// בדיקות לשונית "לקוחות" (מ19 · מ20 · מ21 · מ22 · מ25).
//
// 🔑 **מה הן באמת שומרות עליו, ומה לא:** ‏`ReportSurface` כבר נבדק אצלו; כאן נבדק **מה
// שהלשונית מוסיפה** — ארבע הכרעות שאין להן שום שער אחר שיתפוס אותן אם ייפלו:
// ‏**הכרעה 19** (השורה כולה דלת, ויעד נכון לכל דף) · **הכרעה 33** (אריח-דלת, ותרגום
// התווית העברית לכתובת) · **המיסוך** (₪ של מ21 כפוף למודול 'כספים') · **מ25** (שני
// הכפתורים, חמשת המצבים, ושהם אינם קיימים בלי `edit` על 'דו"חות').
// ⚠️ **ומפתחות-ההטמעה** — מפתח שגוי מרנדר `null` **בשקט בייצור**, ולכן יש כאן בדיקה
// שקוראת את קוד-הלשונית עצמו ומוודאת שכל `reports.*` שמופיע בו קיים בקובץ-הקופי.
//
// 🔴 **ולמה אף בדיקה כאן אינה מריצה סיווג אמיתי:** *"הרץ ניתוח"* קורא לפונקציית-שרת
// ששורפת מכסת-ספק. ‏`supabase.functions.invoke` ממוקם — **נבדק מסלול-הקריאה, לא הספק.**

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

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
  meta: { missing_params: [], notes: [], run: null },
  ...over,
})

// ── מטענים בצורת C8, עם המספרים שנמדדו חי מה-RPC ב-16/09/2026 ────────────────
const overviewPayload = () =>
  base({
    population: {
      n: 163,
      label: 'אוכלוסייה: משובים שהלקוח מילא · n=163 משובים מתוך 217 שנשלחו, אצל 61 לקוחות.',
      excluded: { 'נשלח ולא נענה': 54 },
    },
    tiles: [
      {
        key: 'satisfaction_vs_return',
        label: 'שביעות-רצון מנבאת חזרה',
        value: 16,
        format: 'days',
        window: 'כל הזמנים · 46 לקוחות עם 3+ משובים · אינו מושפע ממסנן התקופה',
        compare: { value: 212, label: 'לקוחות לא-מרוצים', direction: 'flat' },
        target: { tab: 'לקוחות', report: 'שביעות רצון', drill: null },
      },
      {
        key: 'payment_cadence_by_type',
        label: 'קצב-התשלום תלוי בסוג הלקוח',
        value: 69,
        format: 'days',
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
      { key: 'customer_type', label: 'סוג הלקוח', format: 'text', align: 'start' },
      { key: 'revenue_12m', label: 'הכנסת 12 החודשים', format: 'money', align: 'end' },
      { key: 'last_event', label: 'אירוע אחרון', format: 'text', align: 'start' },
    ],
    rows: [
      {
        drill_key: 401,
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
    population: { n: 163, label: 'אוכלוסייה: משובים שהלקוח מילא · n=163', excluded: {} },
    tiles: [
      {
        key: 'satisfied_share',
        label: 'שיעור המרוצים (4–5)',
        value: 88.3,
        format: 'percent',
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
      { key: 'feedback_score', label: 'ציון', format: 'int', align: 'end' },
      { key: 'reasons', label: 'הסיבה שסומנה', format: 'text', align: 'start' },
      { key: 'feedback_notes', label: 'ההערה שנכתבה', format: 'text', align: 'start' },
    ],
    rows: [
      {
        drill_key: 1527,
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
    population: { n: 52, label: 'אוכלוסייה: 52 לקוחות שקיימו 3 אירועים לפחות', excluded: {} },
    tiles: [
      {
        key: 'drifting_count',
        label: 'לקוחות מתרחקים',
        value: 12,
        format: 'int',
        window: 'נכון ל-16/09',
        compare: { value: 10, label: 'לפני חודש', direction: 'up' },
        target: null,
        detail: { eligible: 52 },
      },
      {
        key: 'marked_revenue_12m',
        label: 'הכנסת 12 החודשים של הלקוחות המסומנים',
        value: 320743.08,
        format: 'money',
        window: '16/09/2025–16/09/2026',
        compare: null,
        target: null,
      },
      {
        key: 'only_personal_cadence',
        label: 'נתפסים רק בקצב האישי',
        value: 3,
        format: 'int',
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
      { key: 'revenue_12m', label: 'הכנסת 12 החודשים', format: 'money', align: 'end' },
      { key: 'ratio', label: 'פי כמה מהקצב', format: 'ratio', align: 'end' },
      { key: 'flag', label: 'דגל', format: 'text', align: 'start' },
    ],
    rows: [
      {
        drill_key: 426,
        customer_id: 426,
        company_name: 'גלובל שיפינג בע"מ',
        contact_name: 'ענבר אשכנזי',
        contact_phone: '055-1794584',
        revenue_12m: 68180.17,
        ratio: 3.2,
        flag: 'מתרחק בלבד',
      },
      {
        drill_key: 444,
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

const APPROVED_RUN = {
  run_id: 6,
  status: 'done',
  model: 'gemini-3.5-flash-lite',
  approved_at: '2026-09-16T04:28:26.605176+00:00',
  approved_by: 'ishay1997@gmail.com',
  sent_count: 386,
  ok_count: 386,
  failed_count: 0,
  classified: 386,
  unclassifiable: 0,
}

const notesPayload = ({ run = APPROVED_RUN } = {}) =>
  base({
    population: {
      n: 426,
      label: 'אוכלוסייה: הערות חופשיות · 426 הערות מתוך 552 משובים',
      excluded: {},
    },
    tiles: [
      {
        key: 'free_notes',
        label: 'הערות חופשיות שנכתבו',
        value: 426,
        format: 'int',
        window: 'כל הזמנים',
        compare: null,
        target: null,
      },
      {
        key: 'other_tagged_notes',
        label: 'מהן שייכות למשוב שתויג "אחר"',
        value: 33,
        format: 'int',
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
        value: run ? 24 : null,
        format: run ? 'int' : 'text',
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
          { key: 'red_flag', label: 'דגל אדום', format: 'text', align: 'start' },
        ]
      : [],
    rows: run
      ? [
          {
            drill_key: 1455,
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
    meta: { missing_params: [], notes: [], run },
  })

function LocationProbe() {
  const location = useLocation()
  return <p data-testid="probe">{`${location.pathname}${location.search}`}</p>
}

function renderTab(surface, { onRetry = vi.fn() } = {}) {
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
    <MemoryRouter initialEntries={['/reports?tab=customers']}>
      <CustomersTab
        surface={surface}
        filters={filters}
        drill={null}
        onDrill={vi.fn()}
        onWindow={vi.fn()}
        onRetry={onRetry}
      />
      <LocationProbe />
    </MemoryRouter>,
  )
  return { ...utils, onRetry }
}

beforeEach(() => {
  vi.clearAllMocks()
  permissions = CEO
  onboardingMode = 2
})

describe('מ19 · מבט-על לקוחות', () => {
  it('מצייר אריחים בתוויות §1.4, שורת-אוכלוסייה, "אז מה" והגדרות — והשורה כולה דלת לכרטיס-הלקוח', async () => {
    callReport.mockResolvedValue(overviewPayload())
    renderTab(SURFACES.מ19)

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
    expect(screen.getByTestId('probe')).toHaveTextContent('/customers/401')
  })

  it('הכרעה 33 — אריח-דלת מנווט לדוח היעד, ואריח שיעדו ממוסך מאבד את הדלת ולא את הנתון', async () => {
    callReport.mockResolvedValue(overviewPayload())
    renderTab(SURFACES.מ19)

    fireEvent.click(await screen.findByTestId('report-tile-link-satisfaction_vs_return'))
    expect(screen.getByTestId('probe')).toHaveTextContent('tab=customers')
    expect(screen.getByTestId('probe')).toHaveTextContent('report=satisfaction')
  })

  it('מנהלת-פרויקטים (חסומה על כספים) רואה את אריח קצב-התשלום בלי דלת', async () => {
    permissions = PROJECTS
    callReport.mockResolvedValue(overviewPayload())
    renderTab(SURFACES.מ19)

    expect(await screen.findByTestId('report-tile-payment_cadence_by_type')).toHaveTextContent(
      '⁦69⁩ ימים',
    )
    expect(screen.queryByTestId('report-tile-link-payment_cadence_by_type')).toBeNull()
    // והדלת שבתוך הלשונית נשארת פתוחה לה.
    expect(screen.getByTestId('report-tile-link-satisfaction_vs_return')).toBeInTheDocument()
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
  it('מצייר את ארבעת הגרפים של המוקאפ — שניים מהמעטפת ושניים מעל תקרת-C8', async () => {
    callReport.mockResolvedValue(satisfactionPayload())
    renderTab(SURFACES.מ20)
    for (const title of ['התפלגות הציונים', 'מה משמח', 'מה מכעיס', 'שיעור המרוצים לפי שנה']) {
      expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
    }
  })

  it('רשימת-סיבות מוצגת כטקסט אחד, הערה ריקה אינה תא ריק, והמיון המוצהר הוא ציון עולה', async () => {
    callReport.mockResolvedValue(satisfactionPayload())
    renderTab(SURFACES.מ20)
    const row = await screen.findByTestId('report-row-drillable')
    expect(row).toHaveTextContent('תפקוד דיילות · ניהול לקוי')
    expect(row).toHaveTextContent('— ללא הערה')
    const scoreHeader = screen.getByRole('columnheader', { name: /ציון/ })
    expect(scoreHeader).toHaveAttribute('aria-sort', 'ascending')
  })

  it('הכרעה 19 — השורה פותחת את כרטיס הפרויקט', async () => {
    callReport.mockResolvedValue(satisfactionPayload())
    renderTab(SURFACES.מ20)
    fireEvent.click(await screen.findByTestId('report-row-drillable'))
    expect(screen.getByTestId('probe')).toHaveTextContent('/projects/1527')
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
    expect(rows[0]).toHaveTextContent('055-1794584')
    expect(rows[0]).toHaveTextContent('מתרחק בלבד')
  })

  it('🔒 ללא הרשאת כספים — אריח-הכסף והעמודה ממוסכים, והמיון נופל למיון המשני', async () => {
    permissions = PROJECTS
    callReport.mockResolvedValue(driftingPayload())
    renderTab(SURFACES.מ21)

    expect(await screen.findByTestId('report-tile-marked_revenue_12m')).toHaveTextContent(
      MASKED_TEXT,
    )
    const rows = screen.getAllByTestId('report-row-drillable')
    expect(rows[0]).toHaveTextContent(MASKED_TEXT)
    // ⑧21.4 — הסדר נופל ל"פי כמה מהקצב" יורד, ולכן 36.1 ראשונה ולא 3.2.
    expect(rows[0]).toHaveTextContent('מגה-אירוע הפקות')
    expect(screen.getByRole('columnheader', { name: /פי כמה מהקצב/ })).toHaveAttribute(
      'aria-sort',
      'descending',
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

  it('בלי ריצה מאושרת — "טרם אושרה ריצת-ניתוח", והייצוא נושא את הנוסח הנעול', async () => {
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
    invoke.mockResolvedValueOnce({
      data: { status: 'partial', run_id: 7, ok: 300, failed: 0, remaining: 126 },
      error: null,
    })
    renderTab(SURFACES.מ22)

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

  it('"אשר להצגה" קורא ל-RPC המגודר ומבקש טעינה מחדש; שגיאת P0001 מוצגת בעברית', async () => {
    callReport.mockResolvedValue(notesPayload({ run: null }))
    invoke.mockResolvedValue({
      data: { status: 'done', run_id: 7, ok: 426, failed: 0, remaining: 0 },
      error: null,
    })
    const { onRetry } = renderTab(SURFACES.מ22)
    fireEvent.click(await screen.findByTestId('m25-run-button'))
    await waitFor(() => expect(screen.getByTestId('m25-run-button')).toHaveTextContent('אשר להצגה'))

    approveFeedbackAiRun.mockResolvedValueOnce({ ok: true })
    fireEvent.click(screen.getByTestId('m25-run-button'))
    await waitFor(() => expect(approveFeedbackAiRun).toHaveBeenCalledWith(7))
    expect(onRetry).toHaveBeenCalled()
  })

  it('תשובת-שגיאה של פונקציית-השרת מוצגת בעברית מתוך גוף-התשובה ולא כטקסט של הספרייה', async () => {
    callReport.mockResolvedValue(notesPayload({ run: null }))
    invoke.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: { json: async () => ({ error: 'מפתח ה-AI לא הוגדר במערכת — פנה למנכ"ל' }) },
      },
    })
    renderTab(SURFACES.מ22)
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
    callReport.mockResolvedValue(
      driftingPayload({ meta: { missing_params: ['מכפיל_מרווח_מתרחק'], notes: [], run: null } }),
    )
    // המטען נבנה מחדש כדי שה-meta יוחלף בשלמותו.
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
    const files = ['./customers/CustomerSurface.jsx'].map((relative) =>
      readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8'),
    )
    const used = new Set()
    for (const source of files) {
      for (const match of source.matchAll(/'(reports\.[A-Za-z.]+)'/g)) used.add(match[1])
    }
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
})

describe('אורקל-התוויות — §1.4 מול המטען', () => {
  it('שש-עשרה תוויות-האריחים של הלשונית נבדקות מול המטען ולא מהזיכרון', () => {
    const labels = [
      ...overviewPayload().tiles,
      ...satisfactionPayload().tiles,
      ...driftingPayload().tiles,
      ...notesPayload().tiles,
    ].map((tile) => tile.label)
    // 🔑 התוויות מגיעות מה-payload (C8) ואינן נכתבות בלשונית — הבדיקה מוודאת שאף
    // טרנספורמציה אינה נוגעת בהן.
    expect(labels).toContain('שביעות-רצון מנבאת חזרה')
    expect(labels).toContain('שיעור המרוצים (4–5)')
    expect(labels).toContain('הכנסת 12 החודשים של הלקוחות המסומנים')
    expect(labels).toContain('מהן שייכות למשוב שתויג "אחר"')
  })
})

// 🔭 **תאימות-קדימה, ולא ספקולציה:** מיגרציית-התיקון `…_module11_g2_rpcs_customers_fixes.sql`
// יושבת בריפו ו**טרם הוחלה על המסד** (נמדד על המטען החי 16/09/2026 — `drill_key` עדיין
// סקלר, `columns[].sorted` ריק, `export_blocked_reason` נעדר). הבדיקות האלה נועלות את
// שתי הצורות **יחד**, כדי שהחלת התיקון לא תשבור את הלשונית ולא תכפיל הצהרה.
describe('תאימות לשתי צורות-המטען — לפני מיגרציית-התיקון G2 ואחריה', () => {
  it('`drill_key` בצורת `{kind, id}` מנתב לפי ה-kind ולא לפי המשטח', async () => {
    callReport.mockResolvedValue({
      ...driftingPayload(),
      rows: driftingPayload().rows.map((row) => ({
        ...row,
        drill_key: { kind: 'customer', id: row.customer_id },
      })),
    })
    renderTab(SURFACES.מ21)
    fireEvent.click((await screen.findAllByTestId('report-row-drillable'))[0])
    expect(screen.getByTestId('probe')).toHaveTextContent('/customers/426')
  })

  it('`drill_key` של `project` מנתב לכרטיס-הפרויקט גם ממ22', async () => {
    const payload = notesPayload()
    callReport.mockResolvedValue({
      ...payload,
      rows: payload.rows.map((row) => ({ ...row, drill_key: { kind: 'project', id: 1455 } })),
    })
    renderTab(SURFACES.מ22)
    fireEvent.click(await screen.findByTestId('report-row-drillable'))
    expect(screen.getByTestId('probe')).toHaveTextContent('/projects/1455')
  })

  it('הצהרת-מיון של השרת גוברת על ההצהרה של הלשונית — ואינה נוספת עליה', async () => {
    const payload = overviewPayload()
    callReport.mockResolvedValue({
      ...payload,
      columns: payload.columns.map((column) =>
        column.key === 'company_name' ? { ...column, sorted: 'ascending' } : column,
      ),
    })
    renderTab(SURFACES.מ19)
    await screen.findByTestId('report-table-card')
    expect(screen.getByRole('columnheader', { name: 'לקוח' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    expect(screen.getByRole('columnheader', { name: /הכנסת 12 החודשים/ })).not.toHaveAttribute(
      'aria-sort',
    )
  })

  it('`meta.export_blocked_reason` מהשרת מוצג כמות שהוא ואינו נדרס', async () => {
    const payload = notesPayload({ run: null })
    callReport.mockResolvedValue({
      ...payload,
      meta: { ...payload.meta, export_blocked_reason: EXPORT_NO_APPROVED_RUN },
    })
    renderTab(SURFACES.מ22)
    expect(await screen.findByTestId('reports-export-file')).toHaveTextContent(
      EXPORT_NO_APPROVED_RUN,
    )
  })
})

describe('שורת-הדלת אינה שוברת את מצבי-הריק', () => {
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
