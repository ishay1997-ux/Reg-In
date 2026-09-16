// בדיקות לשונית "לקוחות" (מ19 · מ20 · מ21 · מ22 · מ25).
//
// 🔑 **מה הן באמת שומרות עליו, ומה לא:** ‏`ReportSurface` · `ReportsPage` · `KpiTile`
// נבדקים אצלם — כולל נתב-הדלתות ושורת-המשנה של האריח. **כאן נבדק רק מה שהלשונית מוסיפה**,
// ואחרי סבב-היישור של 16/09 11:1X זה בדיוק שלושה דברים: **המיסוך** (₪ של מ21 כפוף למודול
// 'כספים' ולא ל'לקוחות') · **מיפויי-התצוגה** (אנום ⇐ עברית · מערך ⇐ תא · בוליאני ⇐ עברית ·
// תאריך שהוכרז `text`) · **מ25** (חמשת המצבים, שני הכפתורים, ושהם אינם קיימים בלי `edit`
// על 'דו"חות'). ⚠️ **ומפתחות-ההטמעה** — מפתח שגוי מרנדר `null` **בשקט בייצור**, ולכן יש
// כאן בדיקה שקוראת את קוד-הלשונית עצמו ומוודאת שכל `reports.*` שבו קיים בקובץ-הקופי.
//
// 🚪 **הדלתות נבדקות כאן כ*חוזה* ולא כניווט:** הלשונית מעבירה את `onDrill` של המעטפת
// הלאה בלי לגעת בו, ולכן מה שיש לאמת הוא **מה נמסר לו** — ‏`{kind, id}` מהשורה,
// `{tab, report}` מהאריח. הניווט עצמו נבדק ב-`ReportsPage.test.jsx`.
//
// 🔴 **ולמה אף בדיקה כאן אינה מריצה סיווג אמיתי:** *"הרץ ניתוח"* קורא לפונקציית-שרת
// ששורפת מכסת-ספק. ‏`supabase.functions.invoke` ממוקם — **נבדק מסלול-הקריאה, לא הספק.**

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import { readFileSync } from 'node:fs'

const invoke = vi.fn()
vi.mock('@/supabaseClient', () => ({
  supabase: { rpc: vi.fn(), from: vi.fn(), functions: { invoke: (...a) => invoke(...a) } },
}))

// גרפים: `recharts` לא רץ ב-jsdom. הפרימיטיבים מוחלפים בגדמים, ולכן **כותרת-הכרטיס
// וטבלת-קורא-המסך** של `ChartCard` — שתיהן DOM רגיל — נשארות ניתנות-לבדיקה.
vi.mock('recharts', () => {
  const Stub = ({ children }) => <div>{children}</div>
  const names = [
    'Bar',
    'BarChart',
    'CartesianGrid',
    'Cell',
    'ComposedChart',
    'Label',
    'Line',
    'LineChart',
    'ReferenceLine',
    'ResponsiveContainer',
    'Scatter',
    'ScatterChart',
    'Tooltip',
    'XAxis',
    'YAxis',
    'ZAxis',
  ]
  return Object.fromEntries(names.map((name) => [name, Stub]))
})

const callReport = vi.fn()
const approveFeedbackAiRun = vi.fn()
vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    callReport: (...a) => callReport(...a),
    approveFeedbackAiRun: (...a) => approveFeedbackAiRun(...a),
  }
})

let permissions = {}
let onboardingMode = 2
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ permissions, onboardingMode }),
}))

import CustomersTab from './CustomersTab'
import { M11_CUSTOMERS_COPY } from '@/lib/onboardingCopy.m11.customers'
import { MASKED_TEXT } from '@/lib/dashboard'
import { EXPORT_NO_APPROVED_RUN, EXPORT_NO_ROWS } from '@/lib/reportsExport'

// הזהויות החיות של §2.7 — לא מומצאות.
const CEO = { כספים: 'edit', דיילות: 'edit', לקוחות: 'edit', 'דו"חות': 'edit' }
const PROJECTS = { דיילות: 'edit', לקוחות: 'edit', 'דו"חות': 'view' }

const SURFACES = {
  מ19: {
    id: 'מ19',
    slug: 'customers-overview',
    rpc: 'report_m19_customers_overview',
    name: 'מבט-על לקוחות',
    drill: false,
  },
  מ20: {
    id: 'מ20',
    slug: 'satisfaction',
    rpc: 'report_m20_satisfaction',
    name: 'שביעות רצון',
    drill: false,
  },
  מ21: {
    id: 'מ21',
    slug: 'drifting',
    rpc: 'report_m21_drifting',
    name: 'לקוחות מתרחקים',
    drill: false,
  },
  מ22: { id: 'מ22', slug: 'notes', rpc: 'report_m22_notes', name: 'ניתוח הערות', drill: false },
}

const base = (over = {}) => ({
  population: { n: 1, label: 'אוכלוסייה: כולם · n=1', excluded: {} },
  window: { from: '2026-01-01', to: '2026-09-16', label: '01/01/2026–16/09/2026 · כל הלקוחות' },
  tiles: [],
  chart: null,
  columns: [],
  rows: [],
  so_what: null,
  definitions: '',
  drill: null,
  meta: { missing_params: [], notes: [], run: null, export_blocked_reason: null },
  ...over,
})

// ── מטענים בצורת C8, עם הצורות והמספרים שנמשכו חי מה-RPC ב-16/09/2026 אחרי G2/H2 ──
const overviewPayload = () =>
  base({
    population: {
      n: 163,
      label: 'אוכלוסייה: משובים שהלקוח מילא · ⁦n=163⁩ משובים מתוך ⁦217⁩ שנשלחו, אצל ⁦42⁩ לקוחות.',
      excluded: { 'נשלח ולא נענה': 54 },
    },
    tiles: [
      {
        key: 'satisfaction_vs_return',
        label: 'שביעות-רצון מנבאת חזרה',
        value: 16,
        format: 'days',
        sub: 'חציון ימים מאז האירוע האחרון: לקוחות מרוצים מול לקוחות לא-מרוצים',
        window: 'כל הזמנים · אינו מושפע ממסנן התקופה',
        compare: { value: 212, label: 'לקוחות לא-מרוצים', direction: 'flat' },
        target: { tab: 'לקוחות', report: 'שביעות רצון', drill: null },
      },
      {
        key: 'payment_cadence_by_type',
        label: 'קצב-התשלום תלוי בסוג הלקוח',
        value: 69,
        format: 'days',
        sub: 'חציון ימים מחשבונית לתשלום, לפי סוג הלקוח',
        window: 'כל הזמנים',
        compare: null,
        target: { tab: 'כספים', report: 'גיול חובות', drill: null },
        detail: {
          rows: [
            { customer_type: 'government', median_days: 69, invoice_count: 51, customer_count: 6 },
            {
              customer_type: 'production_company',
              median_days: 31,
              invoice_count: 99,
              customer_count: 12,
            },
          ],
        },
      },
    ],
    chart: {
      type: 'line',
      title: 'ממוצע שביעות-הרצון לפי חודש',
      xKey: 'month',
      series: [{ key: 'avg_score', label: 'ממוצע' }],
      data: [{ month: '2026-01', avg_score: 4.06, n: 18 }],
      domain: [1, 5],
      refLines: [],
      unit: 'ציון',
    },
    columns: [
      { key: 'company_name', label: 'לקוח', format: 'text', align: 'start' },
      {
        key: 'customer_type',
        label: 'סוג הלקוח',
        format: 'text',
        align: 'start',
        label_source: 'CUSTOMER_TYPE_LABELS',
      },
      {
        key: 'revenue_12m',
        label: 'הכנסת 12 החודשים',
        format: 'money',
        align: 'end',
        sorted: 'descending',
      },
      { key: 'last_event', label: 'אירוע אחרון', format: 'text', align: 'start' },
    ],
    rows: [
      {
        drill_key: { kind: 'customer', id: 401 },
        customer_id: 401,
        company_name: 'אלפא סיסטמס בע"מ',
        customer_type: 'private_company',
        revenue_12m: 635764.43,
        last_event: '2026-09-15',
      },
    ],
    so_what: 'לפתוח את "שביעות רצון" ולראות מה מכעיס את 10 הלקוחות הלא-מרוצים.',
    definitions: 'הגדרות: ממוצע שביעות-רצון = ממוצע ציון 1–5.',
  })

const chartOf = (title) => ({
  type: 'bar',
  title,
  xKey: 'reason',
  series: [{ key: 'n', label: 'משובים' }],
  data: [{ reason: 'אחר', n: 10 }],
  domain: null,
  refLines: [],
  unit: 'משובים',
})

const satisfactionPayload = () =>
  base({
    population: { n: 163, label: 'אוכלוסייה: משובים שהלקוח מילא · ⁦n=163⁩', excluded: {} },
    tiles: [
      {
        key: 'satisfied_share',
        label: 'שיעור המרוצים (4–5)',
        value: 88.3,
        format: 'percent',
        sub: '⁦144⁩ מתוך ⁦163⁩ משובים',
        window: '01/01/2026–16/09/2026',
        compare: { value: 80.1, label: 'אשתקד באותו טווח', direction: 'up' },
        target: null,
      },
    ],
    chart: [
      chartOf('התפלגות הציונים'),
      chartOf('מה משמח'),
      chartOf('מה מכעיס'),
      chartOf('שיעור המרוצים לפי שנה'),
    ],
    columns: [
      { key: 'company_name', label: 'לקוח', format: 'text', align: 'start' },
      { key: 'final_event_date', label: 'תאריך', format: 'text', align: 'start' },
      { key: 'feedback_score', label: 'ציון', format: 'int', align: 'end', sorted: 'ascending' },
      { key: 'reasons', label: 'הסיבה שסומנה', format: 'text', align: 'start' },
      { key: 'feedback_notes', label: 'ההערה שנכתבה', format: 'text', align: 'start' },
    ],
    rows: [
      {
        drill_key: { kind: 'project', id: 1527 },
        project_id: 1527,
        company_name: 'גלובל שיפינג בע"מ',
        final_event_date: '2026-06-22',
        feedback_score: 2,
        reasons: ['תפקוד דיילות', 'ניהול לקוי'],
        feedback_notes: null,
      },
    ],
    so_what: 'לפתוח את 10 המשובים שתויגו "אחר".',
    definitions: 'הגדרות: שיעור המרוצים = משובים בציון 4 או 5.',
  })

const driftingPayload = () =>
  base({
    population: { n: 52, label: 'אוכלוסייה: ⁦52⁩ לקוחות שקיימו ⁦3⁩ אירועים לפחות', excluded: {} },
    tiles: [
      {
        key: 'drifting_count',
        label: 'לקוחות מתרחקים',
        value: 12,
        format: 'int',
        sub: 'מתוך ⁦52⁩ לקוחות עם ⁦3+⁩ אירועים (⁦23.1%⁩)',
        window: 'נכון ל-16/09',
        compare: { value: 10, label: 'לפני חודש', direction: 'up' },
        target: null,
      },
      {
        key: 'marked_revenue_12m',
        label: 'הכנסת 12 החודשים של הלקוחות המסומנים',
        value: 320743.08,
        format: 'money',
        sub: '⁦11.5%⁩ מ-⁦2,786,544 ₪⁩ שהעסק הכניס ב-⁦12⁩ החודשים',
        window: '16/09/2025–16/09/2026',
        compare: null,
        target: null,
      },
      {
        key: 'only_personal_cadence',
        label: 'נתפסים רק בקצב האישי',
        value: 3,
        format: 'int',
        sub: '⁦161,009 ₪⁩ בשנה האחרונה',
        window: 'נכון ל-16/09',
        compare: null,
        target: null,
        detail: { only_personal: 3, dormant_rule_finds: 11 },
      },
    ],
    chart: {
      type: 'histogram',
      title: 'הקצב שבו לקוחות חוזרים',
      xKey: 'label',
      series: [{ key: 'n', label: 'מספר מרווחים' }],
      data: [{ label: '0–30', n: 404, open: false }],
      domain: null,
      refLines: [],
      unit: 'מרווחים',
    },
    columns: [
      { key: 'company_name', label: 'לקוח', format: 'text', align: 'start' },
      { key: 'contact_name', label: 'איש קשר', format: 'text', align: 'start' },
      {
        key: 'revenue_12m',
        label: 'הכנסת 12 החודשים',
        format: 'money',
        align: 'end',
        sorted: 'descending',
      },
      { key: 'ratio', label: 'פי כמה מהקצב', format: 'ratio', align: 'end' },
      { key: 'flag', label: 'דגל', format: 'text', align: 'start' },
    ],
    rows: [
      {
        drill_key: { kind: 'customer', id: 426 },
        customer_id: 426,
        company_name: 'גלובל שיפינג בע"מ',
        contact_name: 'ענבר אשכנזי',
        contact_phone: '055-1794584',
        revenue_12m: 68180.17,
        ratio: 3.2,
        flag: 'מתרחק בלבד',
      },
      {
        drill_key: { kind: 'customer', id: 444 },
        customer_id: 444,
        company_name: 'מגה-אירוע הפקות',
        contact_name: 'דניאל אברהם',
        contact_phone: '057-5880953',
        revenue_12m: 43068.86,
        ratio: 36.1,
        flag: 'מתרחק · גם רדום',
      },
    ],
    so_what: 'להתקשר השבוע לענבר אשכנזי מגלובל שיפינג בע"מ.',
    definitions: 'הגדרות: מתרחק = אין אירוע עתידי וגם פי 1.5 מהמרווח הרגיל.',
  })

// ‏`meta.run` אחרי G2-1: איחוד שתי הריצות המאושרות. ⚠️ `sent_count` כאן הוא **סכום**
// (⁦812⁩) ולא מכנה — הפס לעולם אינו מחלק בו.
const APPROVED_RUN = {
  run_id: 6,
  status: 'done',
  run_count: 2,
  model: 'gemini-3.5-flash-lite + gemini-3.8-flash',
  approved_at: '2026-09-16T04:28:26.605176+00:00',
  approved_by: 'ishay1997@gmail.com',
  sent_count: 812,
  ok_count: 426,
  failed_count: 0,
  classified: 426,
  unclassifiable: 0,
}

// ‏`meta.run_in_progress` כפי שהוא **חי היום**: ריצה 4 במצב `failed` — קיימת, ואינה "בתהליך".
const FAILED_RUN_IN_PROGRESS = {
  run_id: 4,
  status: 'failed',
  model: 'gemini-3.8-flash',
  ok_count: 0,
  failed_count: 0,
  sent_count: 426,
  started_at: '2026-09-16T03:05:52.311548+00:00',
  finished_at: '2026-09-16T03:06:01.201+00:00',
}

const notesPayload = ({ run = APPROVED_RUN, runInProgress = FAILED_RUN_IN_PROGRESS } = {}) =>
  base({
    population: { n: 426, label: 'אוכלוסייה: הערות חופשיות · ⁦426⁩ הערות', excluded: {} },
    tiles: [
      {
        key: 'free_notes',
        label: 'הערות חופשיות שנכתבו',
        value: 426,
        format: 'int',
        sub: 'מתוך ⁦552⁩ משובים שהושלמו',
        window: 'כל הזמנים',
        compare: null,
        target: null,
      },
      {
        key: 'other_tagged_notes',
        label: 'מהן שייכות למשוב שתויג "אחר"',
        value: 33,
        format: 'int',
        sub: 'לכל ⁦33⁩ יש טקסט',
        window: 'כל הזמנים',
        compare: null,
        target: null,
        detail: {
          other: 33,
          sample_quotes: [
            {
              project_id: 1544,
              company_name: 'מיטב מוצרי חשמל',
              feedback_notes: 'לא היה ברור מתי הצוות אמור להגיע.',
              feedback_score: 3,
              final_event_date: '2026-07-19',
            },
          ],
        },
      },
      {
        key: 'red_flags',
        label: 'דגלים אדומים',
        value: run ? 25 : null,
        format: run ? 'int' : 'text',
        sub: run ? 'מתוך ⁦426⁩ הערות מסווגות · ⁦2⁩ ריצות מאושרות' : 'טרם אושרה ריצה — לא 0',
        window: run ? 'הריצה מ-16/09/2026' : '—',
        compare: null,
        target: null,
      },
    ],
    columns: run
      ? [
          { key: 'company_name', label: 'לקוח', format: 'text', align: 'start' },
          { key: 'final_event_date', label: 'תאריך', format: 'text', align: 'start' },
          { key: 'feedback_notes', label: 'ההערה שנכתבה', format: 'text', align: 'start' },
          { key: 'model_topics', label: 'נושא (מודל)', format: 'text', align: 'start' },
          {
            key: 'red_flag',
            label: 'דגל אדום',
            format: 'text',
            align: 'start',
            sorted: 'descending',
          },
        ]
      : [],
    rows: run
      ? [
          {
            drill_key: { kind: 'project', id: 1455 },
            project_id: 1455,
            company_name: 'ורד קוסמטיקה טבעית',
            final_event_date: '2026-04-21',
            feedback_notes: 'הפלסטיק של התגים היה נוקשה מדי.',
            model_topics: ['איכות תגים', 'ניהול לקוי'],
            red_flag: true,
          },
        ]
      : [],
    so_what: run ? 'לשקול קטגוריה חדשה בטופס-המשוב.' : 'להריץ את הניתוח על 426 ההערות.',
    definitions: 'הגדרות: הערה חופשית = טקסט שהלקוח כתב.',
    meta: {
      missing_params: [],
      notes: [],
      run,
      run_in_progress: runInProgress,
      export_blocked_reason: run ? null : EXPORT_NO_APPROVED_RUN,
    },
  })

function renderTab(surface, { onRetry = vi.fn(), onDrill = vi.fn() } = {}) {
  const filters = {
    period: 'year',
    from: '2026-01-01',
    to: '2026-09-16',
    customerId: null,
    windowLabel: '01/01/2026–16/09/2026',
    reloadTick: 0,
    isFiltered: false,
    clearFilters: vi.fn(),
  }
  const utils = render(
    <CustomersTab
      surface={surface}
      filters={filters}
      drill={null}
      onDrill={onDrill}
      onWindow={vi.fn()}
      onRetry={onRetry}
    />,
  )
  return { ...utils, onRetry, onDrill }
}

beforeEach(() => {
  vi.clearAllMocks()
  permissions = CEO
  onboardingMode = 2
})

describe('מ19 · מבט-על לקוחות', () => {
  it('מצייר אריחים בתוויות §1.4, שורת-אוכלוסייה, "אז מה" והגדרות — ומעביר את דלת-השורה למעטפת', async () => {
    callReport.mockResolvedValue(overviewPayload())
    const { onDrill } = renderTab(SURFACES.מ19)

    expect(await screen.findByText('שביעות-רצון מנבאת חזרה')).toBeInTheDocument()
    // ‏`⁦`/`⁩` = LRI…PDI — הבידוד ש-`reportsFormat` מוסיף לכל ערך לא-עברי.
    expect(screen.getByTestId('report-tile-satisfaction_vs_return')).toHaveTextContent('⁦16⁩ ימים')
    expect(screen.getByTestId('report-population')).toHaveTextContent('n=163')
    expect(screen.getByTestId('report-so-what')).toHaveTextContent('לפתוח את "שביעות רצון"')
    expect(screen.getByTestId('report-definitions')).toHaveTextContent('ממוצע שביעות-רצון')

    // אנום-המסד אינו מגיע למסך: `private_company` ⇐ "חברה פרטית" (C8 · `CUSTOMER_TYPE_LABELS`).
    const row = screen.getByTestId('report-row-drillable')
    expect(row).toHaveTextContent('חברה פרטית')
    expect(row).not.toHaveTextContent('private_company')
    // עמודת-תאריך שהוכרזה `text` מוצגת בכל זאת בצורה הישראלית.
    expect(row).toHaveTextContent('15/09/2026')

    fireEvent.click(row)
    // 🚪 הלשונית אינה מנווטת — היא מוסרת את המפתח לנתב של המעטפת (`ReportsPage.openDoor`).
    expect(onDrill).toHaveBeenCalledWith({ kind: 'customer', id: 401 }, expect.any(Object))
  })

  it('הכרעה 33 — אריח-דלת מוסר את היעד בתוויות של §🏷️, גם כשהיעד בלשונית אחרת', async () => {
    callReport.mockResolvedValue(overviewPayload())
    const { onDrill } = renderTab(SURFACES.מ19)

    fireEvent.click(await screen.findByTestId('report-tile-link-satisfaction_vs_return'))
    expect(onDrill).toHaveBeenCalledWith({ tab: 'לקוחות', report: 'שביעות רצון', drill: null })

    fireEvent.click(screen.getByTestId('report-tile-link-payment_cadence_by_type'))
    expect(onDrill).toHaveBeenLastCalledWith({ tab: 'כספים', report: 'גיול חובות', drill: null })
  })

  it('הצהרת-המיון של השרת עוברת כמות שהיא — הלשונית אינה מזריקה `sorted` משלה', async () => {
    callReport.mockResolvedValue(overviewPayload())
    renderTab(SURFACES.מ19)
    await screen.findByTestId('report-table-card')
    expect(screen.getByRole('columnheader', { name: /הכנסת 12 החודשים/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    expect(screen.getByRole('columnheader', { name: 'לקוח' })).not.toHaveAttribute('aria-sort')
  })

  it('`tiles[].detail` מוצג כגילוי ולא כאריח שני, עם התוויות העבריות של סוג-הלקוח', async () => {
    callReport.mockResolvedValue(overviewPayload())
    renderTab(SURFACES.מ19)
    const details = await screen.findByTestId('m19-payment-detail')
    expect(details).toHaveTextContent('חברה ממשלתית')
    expect(details).toHaveTextContent('חברת הפקה')
  })
})

describe('מ20 · שביעות רצון', () => {
  it('מצייר את ארבעת הגרפים של המוקאפ המאושר', async () => {
    callReport.mockResolvedValue(satisfactionPayload())
    renderTab(SURFACES.מ20)
    for (const title of ['התפלגות הציונים', 'מה משמח', 'מה מכעיס', 'שיעור המרוצים לפי שנה']) {
      expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
    }
  })

  it('רשימת-סיבות מוצגת כטקסט אחד, והערה ריקה אינה תא ריק', async () => {
    callReport.mockResolvedValue(satisfactionPayload())
    renderTab(SURFACES.מ20)
    const row = await screen.findByTestId('report-row-drillable')
    expect(row).toHaveTextContent('תפקוד דיילות · ניהול לקוי')
    expect(row).toHaveTextContent('— ללא הערה')
  })

  it('הכרעה 19 — השורה מוסרת דלת אל כרטיס הפרויקט', async () => {
    callReport.mockResolvedValue(satisfactionPayload())
    const { onDrill } = renderTab(SURFACES.מ20)
    fireEvent.click(await screen.findByTestId('report-row-drillable'))
    expect(onDrill).toHaveBeenCalledWith({ kind: 'project', id: 1527 }, expect.any(Object))
  })
})

describe('מ21 · לקוחות מתרחקים', () => {
  it('באנר שתי-השיטות הוא בסיס ונושא מספרים חיים; איש-הקשר נושא גם טלפון', async () => {
    callReport.mockResolvedValue(driftingPayload())
    renderTab(SURFACES.מ21)
    const banner = await screen.findByTestId('drifting-two-methods')
    expect(banner).toHaveTextContent('12')
    expect(banner).toHaveTextContent('11')
    expect(banner).toHaveTextContent('3')
    const rows = screen.getAllByTestId('report-row-drillable')
    expect(rows[0]).toHaveTextContent('ענבר אשכנזי')
    // 🔴 מקף בלתי-שביר (`‑`) ולא ASCII — נמדד בדפדפן שהתא הצר שבר את המספר לשתי
    // שורות (*"· -055"* / *"1794584"*). המספר נשאר שלם, והמקף נראה זהה.
    expect(rows[0]).toHaveTextContent('055‑1794584')
    expect(rows[0].textContent).not.toContain('055-1794584')
    expect(rows[0]).toHaveTextContent('מתרחק בלבד')
  })

  it('🔒 ללא הרשאת כספים — האריח, שורת-המשנה שיש בה ₪, והעמודה ממוסכים, והמיון נופל למשני', async () => {
    permissions = PROJECTS
    callReport.mockResolvedValue(driftingPayload())
    renderTab(SURFACES.מ21)

    expect(await screen.findByTestId('report-tile-marked_revenue_12m')).toHaveTextContent(
      MASKED_TEXT,
    )
    // 🔴 הדליפה שנפתחה כש-`KpiTile` התחיל לרנדר `tiles[].sub`: אריח שאינו אריח-כסף
    // ושורת-המשנה שלו נושאת ₪.
    const personal = screen.getByTestId('report-tile-only_personal_cadence')
    expect(personal).not.toHaveTextContent('₪')
    expect(personal).toHaveTextContent('⁦3⁩')

    const rows = screen.getAllByTestId('report-row-drillable')
    expect(rows[0]).toHaveTextContent(MASKED_TEXT)
    // ⑧21.4 — הסדר נופל ל"פי כמה מהקצב" יורד, ולכן 36.1 ראשונה ולא 3.2.
    expect(rows[0]).toHaveTextContent('מגה-אירוע הפקות')
    expect(screen.getByRole('columnheader', { name: /פי כמה מהקצב/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    // ו-`aria-sort` **ירד** מהעמודה הממוסכת — אחרת הוא היה מצביע על מספר שאינו על המסך.
    expect(screen.getByRole('columnheader', { name: /הכנסת 12 החודשים/ })).not.toHaveAttribute(
      'aria-sort',
    )
  })

  it('עם הרשאת כספים — הסכום מוצג, והמיון נשאר לפי הכנסת 12 החודשים', async () => {
    callReport.mockResolvedValue(driftingPayload())
    renderTab(SURFACES.מ21)
    const rows = await screen.findAllByTestId('report-row-drillable')
    expect(rows[0]).toHaveTextContent('גלובל שיפינג')
    expect(rows[0]).not.toHaveTextContent(MASKED_TEXT)
    expect(screen.getByRole('columnheader', { name: /הכנסת 12 החודשים/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
  })
})

describe('מ22 · ניתוח הערות + מ25 · פס-הניתוח', () => {
  it('ריצה מאושרת — הפס אומר מי אישר ומתי, והטבלה מציגה עברית ולא בוליאני', async () => {
    callReport.mockResolvedValue(notesPayload())
    renderTab(SURFACES.מ22)
    expect(await screen.findByTestId('m25-run-text')).toHaveTextContent('16/09/2026')
    expect(screen.getByTestId('m25-run-text')).toHaveTextContent('ishay1997@gmail.com')
    const row = screen.getByTestId('report-row-drillable')
    expect(row).toHaveTextContent('איכות תגים · ניהול לקוי')
    expect(row).toHaveTextContent('כן')
    expect(row).not.toHaveTextContent('true')
    expect(screen.queryByTestId('m22-no-run')).toBeNull()
  })

  it('🔴 `run_in_progress` במצב `failed` אינו "ריצה בתהליך" — הדף מתנהג כאילו אין אחת', async () => {
    callReport.mockResolvedValue(notesPayload({ run: null }))
    renderTab(SURFACES.מ22)
    // המטען נושא את ריצה 4 (`failed`) — ובכל זאת:
    expect(await screen.findByTestId('m25-run-text')).toHaveTextContent('הערות טרם סווגו')
    expect(screen.getByTestId('m25-run-button')).toHaveTextContent('הרץ ניתוח')
    expect(screen.getByTestId('m25-run-button')).toBeEnabled()
  })

  it('ריצה `running` שהתחילה במקום אחר — הפס מדווח עליה והכפתור מנוטרל', async () => {
    callReport.mockResolvedValue(
      notesPayload({
        run: null,
        runInProgress: { ...FAILED_RUN_IN_PROGRESS, status: 'running', ok_count: 120 },
      }),
    )
    renderTab(SURFACES.מ22)
    expect(await screen.findByTestId('m25-run-text')).toHaveTextContent('מסווג…')
    expect(screen.getByTestId('m25-run-text')).toHaveTextContent('120/426')
    expect(screen.getByTestId('m25-run-button')).toBeDisabled()
    expect(screen.getByTestId('m25-run-bar')).toHaveTextContent('ריצת-ניתוח כבר פועלת.')
  })

  it('ריצה `partial` שהתחילה במקום אחר — [המשך] פעיל ושולח את ה-run_id של השרת', async () => {
    callReport.mockResolvedValue(
      notesPayload({
        run: null,
        runInProgress: { ...FAILED_RUN_IN_PROGRESS, status: 'partial', ok_count: 300, run_id: 7 },
      }),
    )
    renderTab(SURFACES.מ22)
    expect(await screen.findByTestId('m25-run-text')).toHaveTextContent('נעצר')
    expect(screen.getByTestId('m25-run-text')).toHaveTextContent('300/426')
    invoke.mockResolvedValueOnce({
      data: { status: 'done', run_id: 7, ok: 426, failed: 0, remaining: 0 },
      error: null,
    })
    fireEvent.click(screen.getByTestId('m25-run-button'))
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith('classify-feedback', {
        body: { action: 'continue', run_id: 7 },
      }),
    )
  })

  it('בלי ריצה מאושרת — "טרם אושרה ריצת-ניתוח", והייצוא נושא את הנוסח הנעול של השרת', async () => {
    callReport.mockResolvedValue(notesPayload({ run: null }))
    renderTab(SURFACES.מ22)
    expect(await screen.findByTestId('m25-run-text')).toHaveTextContent('הערות טרם סווגו')
    expect(screen.getByTestId('m22-no-run')).toHaveTextContent('טרם אושרה ריצת-ניתוח')
    expect(screen.getByTestId('reports-export-file')).toHaveTextContent(EXPORT_NO_APPROVED_RUN)
    expect(screen.getByTestId('reports-export-button')).toBeDisabled()
    // הרמז ⑩ג יושב **בענף המצב-הריק בלבד**.
    expect(screen.getByTestId('hint-reports.notes.tilesBasis')).toBeInTheDocument()
  })

  it('צופה בלי `edit` על דו"חות — בלי כפתור, עם המשפט של הכרטיס', async () => {
    permissions = PROJECTS
    callReport.mockResolvedValue(notesPayload({ run: null }))
    renderTab(SURFACES.מ22)
    expect(await screen.findByTestId('m25-run-text')).toHaveTextContent(
      'טרם אושרה ריצת-ניתוח — פנה למנכ"ל',
    )
    expect(screen.queryByTestId('m25-run-button')).toBeNull()
  })

  it('"הרץ ניתוח" קורא ל-classify-feedback, ותשובת `partial` מציגה נעצר N/M עם [המשך]', async () => {
    callReport.mockResolvedValue(notesPayload({ run: null }))
    renderTab(SURFACES.מ22)
    invoke.mockResolvedValueOnce({
      data: { status: 'partial', run_id: 7, ok: 300, failed: 0, remaining: 126 },
      error: null,
    })

    fireEvent.click(await screen.findByTestId('m25-run-button'))
    await waitFor(() => expect(screen.getByTestId('m25-run-text')).toHaveTextContent('נעצר'))
    expect(invoke).toHaveBeenCalledWith('classify-feedback', { body: { action: 'start' } })
    expect(screen.getByTestId('m25-run-text')).toHaveTextContent('300/426')
    expect(screen.getByTestId('m25-run-button')).toHaveTextContent('המשך')

    invoke.mockResolvedValueOnce({
      data: { status: 'done', run_id: 7, ok: 426, failed: 0, remaining: 0 },
      error: null,
    })
    fireEvent.click(screen.getByTestId('m25-run-button'))
    await waitFor(() => expect(screen.getByTestId('m25-run-button')).toHaveTextContent('אשר להצגה'))
    expect(invoke).toHaveBeenLastCalledWith('classify-feedback', {
      body: { action: 'continue', run_id: 7 },
    })
  })

  it('"אשר להצגה" קורא ל-RPC המגודר ומבקש טעינה מחדש', async () => {
    callReport.mockResolvedValue(notesPayload({ run: null }))
    const { onRetry } = renderTab(SURFACES.מ22)
    invoke.mockResolvedValue({
      data: { status: 'done', run_id: 7, ok: 426, failed: 0, remaining: 0 },
      error: null,
    })
    fireEvent.click(await screen.findByTestId('m25-run-button'))
    await waitFor(() => expect(screen.getByTestId('m25-run-button')).toHaveTextContent('אשר להצגה'))

    approveFeedbackAiRun.mockResolvedValueOnce({ ok: true })
    fireEvent.click(screen.getByTestId('m25-run-button'))
    await waitFor(() => expect(approveFeedbackAiRun).toHaveBeenCalledWith(7))
    expect(onRetry).toHaveBeenCalled()
  })

  it('תשובת-שגיאה של פונקציית-השרת מוצגת בעברית מתוך גוף-התשובה ולא כטקסט של הספרייה', async () => {
    callReport.mockResolvedValue(notesPayload({ run: null }))
    renderTab(SURFACES.מ22)
    invoke.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: { json: async () => ({ error: 'מפתח ה-AI לא הוגדר במערכת — פנה למנכ"ל' }) },
      },
    })
    fireEvent.click(await screen.findByTestId('m25-run-button'))
    expect(await screen.findByRole('alert')).toHaveTextContent('מפתח ה-AI לא הוגדר במערכת')
  })
})

describe('מצבי-מעטפת ושכבת-ההטמעה', () => {
  it('תקלת-רשת מציגה מצב-שגיאה עם "נסי שוב", והלחיצה קוראת שוב ל-RPC — ולעולם לא "אין נתונים"', async () => {
    callReport.mockRejectedValueOnce(new Error('boom'))
    renderTab(SURFACES.מ19)
    const retry = await screen.findByRole('button', { name: 'נסי שוב' })
    expect(screen.queryByText('אין נתונים עדיין')).toBeNull()

    callReport.mockResolvedValueOnce(overviewPayload())
    fireEvent.click(retry)
    expect(await screen.findByText('שביעות-רצון מנבאת חזרה')).toBeInTheDocument()
    expect(callReport).toHaveBeenCalledTimes(2)
  })

  it('`meta.missing_params` מוצג כמשפט עברי מלא', async () => {
    callReport.mockResolvedValue({
      ...driftingPayload(),
      meta: { missing_params: ['מכפיל_מרווח_מתרחק'], notes: [], run: null },
    })
    renderTab(SURFACES.מ21)
    expect(await screen.findByTestId('report-missing-params')).toHaveTextContent(
      'חסר פרמטר מערכת: מכפיל_מרווח_מתרחק',
    )
  })

  it('טבלה בלי שורות — כפתור-הייצוא מנוטרל עם "אין שורות לייצא"', async () => {
    callReport.mockResolvedValue({ ...overviewPayload(), rows: [] })
    renderTab(SURFACES.מ19)
    await screen.findByTestId('reports-export-button')
    expect(screen.getByTestId('reports-export-button')).toBeDisabled()
    expect(screen.getByTestId('reports-export-file')).toHaveTextContent(EXPORT_NO_ROWS)
  })

  it('כל מפתח-הטמעה שהלשונית משתמשת בו קיים בקובץ-הקופי, וכל 12 המפתחות בשימוש', () => {
    // 🔑 נתיב יחסי ל-`cwd` (שורש-הריפו, כפי ש-Vitest מדפיס בראש הריצה) ולא
    // `import.meta.url` — הוא אינו `file:` תחת ה-runner הזה, וזה הפיל את הבדיקה.
    const source = readFileSync('src/modules/11_reports/tabs/customers/CustomerSurface.jsx', 'utf8')
    const used = new Set()
    for (const match of source.matchAll(/'(reports\.[A-Za-z.]+)'/g)) used.add(match[1])
    expect(used.size).toBeGreaterThan(0)
    for (const id of used) expect(M11_CUSTOMERS_COPY[id]).toBeTruthy()
    expect([...used].sort()).toEqual(Object.keys(M11_CUSTOMERS_COPY).sort())
  })

  it('🧪 מבחן-המחיקה — ברמת-הטמעה 0 אין אף רמז, וכל שכבת-הבסיס עדיין על המסך', async () => {
    onboardingMode = 0
    callReport.mockResolvedValue(driftingPayload())
    const { container } = renderTab(SURFACES.מ21)
    await screen.findByTestId('report-population')
    expect(container.querySelectorAll('[data-testid^="hint-"]')).toHaveLength(0)
    expect(screen.getByTestId('report-so-what')).toBeInTheDocument()
    expect(screen.getByTestId('report-definitions')).toBeInTheDocument()
    expect(screen.getByTestId('drifting-two-methods')).toBeInTheDocument()
    expect(screen.getByTestId('report-tiles')).toBeInTheDocument()
    expect(screen.getAllByTestId('report-row-drillable').length).toBeGreaterThan(0)
  })

  it('ברמה 2 — שלושת הרמזים של המשטח מרונדרים בעוגנים שלהם', async () => {
    callReport.mockResolvedValue(driftingPayload())
    renderTab(SURFACES.מ21)
    expect(await screen.findByTestId('hint-reports.drifting.why')).toBeInTheDocument()
    expect(screen.getByTestId('hint-reports.drifting.revenueBasis')).toBeInTheDocument()
    expect(screen.getByTestId('hint-reports.drifting.tableSort')).toBeInTheDocument()
  })

  it('מטען ריק לגמרי — מצב "אין נתונים עדיין" ולא טבלה ריקה', async () => {
    callReport.mockResolvedValue(base())
    renderTab(SURFACES.מ19)
    await waitFor(() =>
      expect(
        within(screen.getByTestId('report-customers-overview-blank')).getByText(/אין נתונים/),
      ).toBeInTheDocument(),
    )
  })
})
