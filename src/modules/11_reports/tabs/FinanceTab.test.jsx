// בדיקות-רכיב ללשונית **כספים** — ארבעת המשטחים, חמשת המצבים, שלוש הדלתות ושכבת-ההטמעה.
//
// 🔑 **המספרים שבמתקנים אינם מומצאים:** כולם הועתקו מ-payload חי שנקרא מארבע פונקציות-השרת
// ב-16/09/2026 בהתחזות מנכ"ל (`report_m07_finance_overview` · `m08` · `m09` · `m12`).
// ⚠️ **ולכן הם אורקל-צורה ולא אורקל-מספר:** הבדיקות כאן מוכיחות ש**מה שהשרת החזיר מצויר
// נכון**, לא שהשרת חישב נכון — זה נמדד מול `spec.md §🔢` וקו-הבסיס, לא כאן.
//
// `recharts` ממוקם כי jsdom אינו מרנדר SVG; ‏`@/supabaseClient` ממוקם כדי שהבדיקה לא תיפול
// ב-CI על היעדר `.env.local` (מלכודת מוכרת, `CLAUDE.md §3`). ‏`AuthContext` ממוקם כי
// `<Hint>` קורא ממנו את רמת-ההטמעה — וזה מה שמאפשר את **מבחן-המחיקה** (רמה 0 מול רמה 2).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const state = vi.hoisted(() => ({ onboardingMode: 2 }))

vi.mock('@/supabaseClient', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ onboardingMode: state.onboardingMode, permissions: { כספים: 'edit' } }),
}))
// עטיפות-recharts מוחלפות ב-`null`: מה שנבדק כאן הוא המקרא והטבלה-לקורא-מסך של `ChartCard`,
// ושניהם JSX רגיל שמצויר מאותו `chart.series` — כלומר בדיוק היכן שמיפוי-התוויות נופל או עובד.
vi.mock('recharts', () => {
  const Stub = () => null
  return {
    Bar: Stub,
    BarChart: Stub,
    CartesianGrid: Stub,
    Cell: Stub,
    ComposedChart: Stub,
    Label: Stub,
    Line: Stub,
    LineChart: Stub,
    ReferenceLine: Stub,
    ResponsiveContainer: Stub,
    Scatter: Stub,
    ScatterChart: Stub,
    Tooltip: Stub,
    XAxis: Stub,
    YAxis: Stub,
    ZAxis: Stub,
  }
})
const callReport = vi.fn()
vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, callReport: (...args) => callReport(...args) }
})

import { M11_FINANCE_COPY } from '@/lib/onboardingCopy.m11.finance'
import { REPORT_TABS } from '../reportsCatalog'
import { FINANCE_SURFACE_SPECS } from './finance/financePayload'
import FinanceTab from './FinanceTab'

const FINANCE_SURFACES = REPORT_TABS.find((t) => t.key === 'finance').surfaces
const surfaceBySlug = (slug) => FINANCE_SURFACES.find((s) => s.slug === slug)

const clearFilters = vi.fn()
const filters = {
  from: '2026-01-01',
  to: '2026-09-16',
  customerId: null,
  windowLabel: '2026',
  isFiltered: false,
  reloadTick: 0,
  clearFilters,
}

// LRI/PDI בלתי-נראים בכוונה (`reportsFormat`), ולכן טקסט מושווה אחרי הסרתם — אחרת כל
// טענת-טקסט בקובץ הזה הייתה נכשלת על תו שאיש אינו רואה.
// 🔤 תווי-הבידוד בשמם. הם **בלתי-נראים בכוונה** (`reportsFormat.js`), ומחרוזת-מקור
// שנושאת אותם כליטרל היא בדיוק מה שהריפו כבר נכווה ממנו — אי-אפשר לחפש אותה.
const LRI = '⁦'
const PDI = '⁩'
const iso = (text) => `${LRI}${text}${PDI}`

const plain = (node) => node.textContent.replaceAll('⁦', '').replaceAll('⁩', '')

// `user-event` אינו מותקן בריפו (נמדד) — `fireEvent` עטוף ב-`act` הוא הדפוס הקיים
// (`ReportsPage.test.jsx`). העטיפה נחוצה כי הלחיצה מפעילה `setSearchParams` ואז effect שקורא לשרת.
async function click(element) {
  await act(async () => {
    fireEvent.click(element)
  })
}

// מפתחות-הרמז של מפרט אחד. ‏`chartFooter` הוא **מפה לפי אינדקס-גרף** ולא מערך (רמז-ג של
// מ12 מעוגן בכרטיס השני), ולכן איסוף שטוח חייב לרדת גם דרכה.
function hintIdsOf(spec) {
  return Object.values(spec.hints).flatMap((slot) =>
    Array.isArray(slot) ? slot : Object.values(slot ?? {}).flat(),
  )
}

function renderTab({ slug, drill = null, onDrill = vi.fn(), onWindow = vi.fn() } = {}) {
  render(
    <MemoryRouter initialEntries={[`/reports?tab=finance&report=${slug}`]}>
      <FinanceTab
        surface={surfaceBySlug(slug)}
        filters={filters}
        drill={drill}
        onDrill={onDrill}
        onWindow={onWindow}
      />
    </MemoryRouter>,
  )
  return { onDrill, onWindow }
}

// ---------------------------------------------------------------- מתקני-payload (C8)

const base = (extra) => ({
  population: { n: 0, label: 'אוכלוסייה', excluded: {} },
  window: { from: null, to: null, label: 'נכון להיום' },
  tiles: [],
  chart: null,
  columns: [],
  rows: [],
  so_what: null,
  definitions: null,
  drill: null,
  meta: {},
  ...extra,
})

const overviewPayload = () =>
  base({
    population: {
      n: 35,
      summary: '35 חשבוניות פתוחות',
      label: 'אוכלוסייה: חשבוניות שנשלחו וטרם שולמו · n=35',
      excluded: {},
    },
    window: { from: '2026-01-01', to: '2026-09-16', label: '01/01–16/09/2026' },
    tiles: [
      {
        key: 'open_debt',
        label: 'יתרת-חוב פתוחה',
        value: 236382,
        format: 'money',
        window: 'נכון להיום',
        compare: { label: 'לפני חודש', value: 206002, direction: 'up' },
        target: { tab: 'כספים', report: 'report_m09_aging', drill: null },
      },
      {
        key: 'hostess_pay_month',
        label: 'שכר דיילות החודש',
        value: 0,
        format: 'money',
        window: '01/09–16/09',
        compare: { label: 'אוגוסט', value: 19253, direction: 'down' },
        target: null,
      },
    ],
    chart: {
      type: 'bar',
      unit: 'money',
      xKey: 'month',
      title: 'יתרת-החוב הפתוחה בסוף כל חודש',
      series: [{ key: 'open_amount', label: 'יתרת-חוב פתוחה' }],
      data: [
        { month: '08/2026', open_amount: 248233, is_today: false },
        { month: '09/2026', open_amount: 236382, is_today: true },
      ],
      domain: null,
      refLines: [],
    },
    columns: [
      { key: 'project_id', label: 'פרויקט', format: 'int', align: 'start' },
      { key: 'customer_name', label: 'לקוח', format: 'text', align: 'start' },
      { key: 'sent_date', label: 'נשלחה', format: 'date', align: 'start' },
      { key: 'amount', label: 'סכום', format: 'money', align: 'end' },
      { key: 'days_overdue', label: 'ימי איחור', format: 'days', align: 'end' },
    ],
    rows: [
      {
        project_id: 1040,
        customer_name: 'מועצה מקומית שוהם',
        sent_date: '2025-01-14',
        amount: 2899,
        days_overdue: 580,
        drill_key: { kind: 'project', id: 1040 },
      },
      {
        project_id: 1460,
        customer_name: 'אלפא סיסטמס בע"מ',
        sent_date: '2026-04-30',
        amount: 10163,
        days_overdue: 109,
        drill_key: { kind: 'project', id: 1460 },
      },
    ],
    so_what: 'לגבות 46,038 ₪ שממתינים מעל 60 יום',
    definitions: 'יתרת-חוב פתוחה = חשבונית שנשלחה, טרם שולמה ולא נמחקה כחוב-אבוד',
    meta: { open_invoice_count: 35, notes: ['חובות אבודים: 2 חשבוניות'], missing_params: [] },
  })

const profitabilityPayload = () =>
  base({
    population: { n: 236, label: 'אוכלוסייה: אירועים שהתקיימו · n=236', excluded: {} },
    tiles: [
      {
        key: 'over_threshold',
        label: 'פרויקטים שחרגו מהתקציב',
        value: 30,
        format: 'int',
        window: 'התקופה שנבחרה',
        compare: { label: '2025', value: 17, direction: 'up' },
        target: null,
      },
    ],
    columns: [
      // ✏️ 17/09/2026 — מזהה-פרויקט מוצהר `format:'id'` (מיגרציית J2), לא כמות.
      { key: 'project_id', label: 'פרויקט', format: 'id', align: 'start' },
      { key: 'deviation', label: 'סטייה ₪', format: 'money', align: 'end' },
      { key: 'deviation_pct', label: 'סטייה %', format: 'percent', align: 'end' },
    ],
    // ✏️ 17/09/2026 — הסדר החי אחרי J1: ממוין לפי ₪ יורד לאורך כל הדירוג; פרויקט מתחת
    // לרצפת-המהותיות **אינו בדירוג** (📑ב#5), ולכן כל שורה נושאת `below_materiality:false`.
    rows: [
      { project_id: 1416, deviation: 361, deviation_pct: 21.1, below_materiality: false },
      { project_id: 1465, deviation: 285, deviation_pct: 29.1, below_materiality: false },
      { project_id: 1340, deviation: 202, deviation_pct: 15, below_materiality: false },
      { project_id: 1458, deviation: 23, deviation_pct: 16.7, below_materiality: false },
    ],
    so_what: 'לפתוח את פרויקט 1427',
    definitions: 'סטיית-תקציב = צד-העבודה בלבד',
    meta: { missing_params: [] },
  })

const agingBuckets = [
  { key: 'current', label: 'שוטף', n: 8, amount: 48746 },
  { key: 'd61_90', label: '61–90', n: 4, amount: 28092 },
]

const agingRootPayload = () =>
  base({
    population: { n: 35, label: 'אוכלוסייה: חשבוניות שנשלחו · n=35', excluded: { 'חוב אבוד': 2 } },
    tiles: [
      {
        key: 'over_60',
        label: 'מעל 60 יום',
        value: 46038,
        format: 'money',
        window: 'נכון להיום',
        compare: { label: 'לפני חודש', value: 17946, direction: 'up' },
        // i2 ③ — האריח הוא **צבר** של שני מדרגים, ואין קידוח שנושא אותו ⇒ אין דלת.
        target: null,
      },
      {
        key: 'bucket_90p',
        // i2 ④ — טווח-הספרות מבודד **בשרת**, כיחידה אחת.
        label: `מדרג ${iso('90+')}`,
        value: 17946,
        format: 'money',
        window: 'נכון להיום',
        compare: { label: 'לפני חודש', value: 2899, direction: 'up' },
        target: { tab: 'כספים', report: 'report_m09_aging', drill: { bucket: 'd90p' } },
      },
    ],
    chart: {
      type: 'stackedBar',
      unit: 'money',
      xKey: 'bucket',
      note: 'כל עמודה היא דלי של איחור.',
      title: 'חוב באיחור לפי מדרג-גיול וסוג-לקוח',
      label_source: 'CUSTOMER_TYPE_LABELS',
      series: [
        { key: 'government', label: 'government' },
        { key: 'private_company', label: 'private_company' },
      ],
      data: [{ bucket: '61–90', government: 9384, private_company: 13270 }],
      domain: null,
      refLines: [],
    },
    columns: [
      { key: 'project_id', label: 'פרויקט', format: 'int', align: 'start' },
      { key: 'sent_date', label: 'נשלחה', format: 'date', align: 'start' },
      { key: 'days_overdue', label: 'ימי איחור', format: 'days', align: 'end' },
      // i2 ⑤/⑥ — עמודת 📐18 מוצהרת, ועמודת-המדרג מוכרזת `textLtr` (הפורמטר מבודד).
      { key: 'owner', label: 'איש קשר', format: 'text', align: 'start' },
      { key: 'bucket', label: 'מדרג', format: 'textLtr', align: 'start' },
    ],
    // ‏`bucket` נושא היום את **התווית**, והקוד עבר ל-`bucket_key` (i2). אין מיפוי בלשונית.
    rows: [
      {
        project_id: 1040,
        sent_date: '2025-01-14',
        days_overdue: 580,
        bucket: '90+',
        bucket_key: 'd90p',
        owner: 'ליהי סבן',
        drill_key: { kind: 'project', id: 1040 },
      },
      {
        project_id: 1460,
        sent_date: '2026-04-30',
        days_overdue: 109,
        bucket: '61–90',
        bucket_key: 'd61_90',
        owner: 'ניר נחום',
        drill_key: { kind: 'project', id: 1460 },
      },
    ],
    so_what: 'לגבות 46,038 ₪ מ-4 לקוחות',
    definitions: 'מדרג-גיול נמדד מול מועד-הפירעון',
    drill: {
      level: 0,
      levels: ['מדרג', 'לקוח', 'חשבונית'],
      crumbs: [{ label: 'גיול חובות', drill: null }],
      buckets: agingBuckets,
      echo: null,
    },
    meta: {
      missing_params: [],
      current_tile: {
        label: 'שוטף — עוד לא באיחור',
        value: 48746,
        count: 8,
        compare_value: 101679,
        compare_count: 14,
        drill: { bucket: 'current' },
      },
    },
  })

const agingLevel1Payload = () => {
  const payload = agingRootPayload()
  return {
    ...payload,
    tiles: [
      {
        key: 'bucket_amount',
        label: `חוב במדרג ${iso('61–90')} יום`,
        value: 28092,
        format: 'money',
        window: 'נכון להיום',
        compare: { label: 'לפני חודש במדרג זה', value: 15047, direction: 'up' },
        target: null,
      },
    ],
    // צורת i2 החיה ברמה 1: לקוח · איש קשר · חשבוניות · סכום · ימי איחור.
    columns: [
      { key: 'customer_name', label: 'לקוח', format: 'text', align: 'start' },
      { key: 'owner', label: 'איש קשר', format: 'text', align: 'start' },
      { key: 'invoices', label: 'חשבוניות', format: 'int', align: 'end' },
      { key: 'amount', label: 'סכום', format: 'money', align: 'end' },
      { key: 'days_overdue', label: 'ימי איחור (הוותיקה)', format: 'days', align: 'end' },
    ],
    rows: [
      {
        customer_name: 'אלפא סיסטמס בע"מ',
        owner: 'ניר נחום',
        invoices: 2,
        amount: 13270,
        days_overdue: 66,
        drill_key: { kind: 'customer', bucket: 'd61_90', customer_id: 401 },
      },
      {
        customer_name: 'האגודה למען המדע הצעיר',
        owner: 'ליאור ביטון',
        invoices: 1,
        amount: 5438,
        days_overdue: 75,
        drill_key: { kind: 'customer', bucket: 'd61_90', customer_id: 456 },
      },
    ],
    drill: {
      level: 1,
      levels: ['מדרג', 'לקוח', 'חשבונית'],
      crumbs: [
        { label: 'גיול חובות', drill: null },
        { label: `מדרג ${iso('61–90')} יום`, drill: { kind: 'bucket', bucket: 'd61_90' } },
      ],
      buckets: agingBuckets,
      echo: { kind: 'bucket', bucket: 'd61_90' },
    },
  }
}

const equipmentPayload = () =>
  base({
    population: { n: 1771, label: 'אוכלוסייה: כל 1,771 שורות הלוגיסטיקה', excluded: {} },
    tiles: [
      {
        key: 'cost_window',
        label: 'עלות ציוד בתקופה',
        value: 350944,
        format: 'money',
        window: 'התקופה שנבחרה',
        compare: { label: '2025 באותו טווח', value: 274038, direction: 'up' },
        target: null,
      },
    ],
    chart: [
      {
        type: 'bar',
        unit: 'money',
        xKey: 'item_name',
        title: 'עלות לפי מוצר',
        series: [{ key: 'cost', label: 'עלות מוזמנת' }],
        data: [{ item_name: 'שרוך סאטן - ממותג', cost: 233480 }],
        domain: null,
        refLines: [],
      },
      {
        type: 'bar',
        unit: 'int',
        xKey: 'item_name',
        title: 'הוזמן מול הגיע',
        series: [
          { key: 'ordered', label: 'הוזמן' },
          { key: 'arrived', label: 'הגיע' },
        ],
        data: [{ item_name: 'שרוך סאטן - ממותג', ordered: 58490, arrived: 57340 }],
        domain: null,
        refLines: [],
      },
    ],
    columns: [
      { key: 'item_name', label: 'מוצר (מק"ט)', format: 'text', align: 'start' },
      { key: 'ordered_cost', label: 'עלות מוזמנת (₪)', format: 'money', align: 'end' },
    ],
    rows: [
      {
        item_name: 'שרוך סאטן - ממותג',
        ordered_cost: 233480,
        drill_key: { kind: 'sku', sku: 'B-SAT-LAN' },
      },
      {
        item_name: 'שרוך בד - ממותג',
        ordered_cost: 174600,
        drill_key: { kind: 'sku', sku: 'B-FAB-LAN' },
      },
    ],
    so_what: 'להזמין 2,607 יחידות',
    definitions: '"הוזמן" = הכמות המתוכננת',
    meta: {
      missing_params: [],
      notes: ['נמדד על 82 שורות מתוך 1,771'],
      extra_tables: [
        {
          title: 'כמה להזמין לחודש הקרוב',
          columns: [
            { key: 'item_name', label: 'מוצר (מק"ט)', format: 'text', align: 'start' },
            { key: 'qty', label: 'כמות להזמנה', format: 'int', align: 'end' },
          ],
          rows: [
            { item_name: 'תג שם אקולוגי - ממותג', qty: 2607 },
            { item_name: 'תג שם אקולוגי (חלק)', qty: 1800 },
          ],
        },
        {
          title: 'שורות ציוד במחיר מוערך',
          columns: [{ key: 'project_id', label: 'פרויקט', format: 'int', align: 'start' }],
          rows: [{ project_id: 1594 }],
        },
      ],
    },
  })

beforeEach(() => {
  state.onboardingMode = 2
  callReport.mockReset()
  clearFilters.mockReset()
})

// ---------------------------------------------------------------- מ7 · מבט-על כספים

describe('מ7 · מבט-על כספים', () => {
  it('מצייר את האריחים בתוויות §1.4, שורת-אוכלוסייה, "אז מה", הגדרות וטבלה', async () => {
    callReport.mockResolvedValue(overviewPayload())
    renderTab({ slug: 'finance-overview' })

    const tile = await screen.findByTestId('report-tile-open_debt')
    expect(plain(tile)).toContain('יתרת-חוב פתוחה')
    expect(plain(tile)).toContain('236,382 ₪')
    // 📐1 — חצי-ההשוואה מעוצב ככסף ולא כמספר גולמי (ר' `withCompareFormat`).
    expect(plain(tile)).toContain('206,002 ₪')
    // 📐3 — חלון-הזמן על האריח. ✏️ 23/09/2026 (L1): בלי "אינו מושפע ממסנן התקופה" — שורת-המסננים
    // כבר אומרת זאת כעובדה (`תקופה  נכון להיום`), וההסתייגות ירדה מהשרת.
    // ✏️ 23/09/2026 (תקן-הכרטיס): החלון עבר מהשורה הגלויה ל-ⓘ שלצד הכרטיס — לא נמחק.
    expect(plain(screen.getByTestId('report-tile-box-open_debt'))).toContain('נכון להיום')
    expect(plain(tile)).not.toContain('נכון להיום')
    expect(plain(screen.getByTestId('report-tile-box-open_debt'))).not.toContain('אינו מושפע')

    // שבב-ההיקף מהשרת (`population.summary`); ההצהרה המלאה מקופלת בתוכו.
    expect(plain(screen.getByTestId('report-scope-summary'))).toContain('35 חשבוניות פתוחות')
    expect(plain(screen.getByTestId('report-population'))).toContain('n=35')
    expect(plain(screen.getByTestId('report-so-what'))).toContain('מעל 60 יום')
    expect(plain(screen.getByTestId('report-definitions'))).toContain('יתרת-חוב פתוחה =')
    expect(plain(screen.getByTestId('report-meta-notes'))).toContain('חובות אבודים')
    expect(screen.getAllByTestId('report-row-drillable')).toHaveLength(2)
  })

  it('📐9 · aria-sort יושב על "ימי איחור" בלבד, והתאריך יורד בצורה הישראלית (H2)', async () => {
    callReport.mockResolvedValue(overviewPayload())
    renderTab({ slug: 'finance-overview' })
    await screen.findByTestId('report-table-card')

    const headers = screen.getAllByRole('columnheader')
    const overdue = headers.find((h) => h.textContent.includes('ימי איחור'))
    expect(overdue).toHaveAttribute('aria-sort', 'descending')
    expect(headers.filter((h) => h.hasAttribute('aria-sort'))).toHaveLength(1)
    expect(plain(screen.getByTestId('report-table-card'))).toContain('14/01/2025')
  })

  it('הכרעה 19 · השורה כולה דלת — המפתח נמסר למעטפת, שהיא הנתב היחיד', async () => {
    callReport.mockResolvedValue(overviewPayload())
    const { onDrill } = renderTab({ slug: 'finance-overview' })
    const rows = await screen.findAllByTestId('report-row-drillable')
    await click(rows[0])
    // המעטפת מוסרת `(drill_key, row)`; הניווט ל-`/projects/1040` נבדק ב-`ReportsPage.test.jsx`,
    // שם יושב הנתב. 🚫 **לא שני נתבים** — ר' הערת-הפרופס ב-`FinanceTab.jsx`.
    expect(onDrill.mock.calls[0][0]).toEqual({ kind: 'project', id: 1040 })
  })

  it('הכרעה 33 · אריח-דלת ו"כל N החשבוניות →" מוסרים יעד {tab, report} למעטפת', async () => {
    callReport.mockResolvedValue(overviewPayload())
    const { onDrill } = renderTab({ slug: 'finance-overview' })

    // ✏️ 23/09/2026 (פזה ב׳ שלב 4) — משפט *"אלה N החשבוניות הישנות ביותר מתוך 35"* נמחק: הכותרת-
    // הכנה של רשימת-השיא (`surface.topN`) אומרת אותו, ושתי הצהרות זו מעל זו היו כפילות. הדלת נשארת.
    const cap = await screen.findByTestId('finance-row-cap')
    expect(plain(cap)).not.toContain('אלה')
    expect(screen.queryByTestId('report-row-cap')).not.toBeInTheDocument()
    const door = screen.getByTestId('finance-open-invoices-door')
    expect(plain(door)).toBe('כל 35 החשבוניות הפתוחות →')
    await click(door)
    expect(onDrill.mock.calls[0][0]).toEqual({
      tab: 'כספים',
      report: 'report_m09_aging',
      drill: null,
    })

    await click(screen.getByTestId('report-tile-link-open_debt'))
    expect(onDrill.mock.calls[1][0]).toEqual(
      overviewPayload().tiles.find((t) => t.key === 'open_debt').target,
    )
  })
})

// ---------------------------------------------------------------- מ8 · רווחיות פרויקטים

describe('מ8 · רווחיות פרויקטים', () => {
  it('ממיין לפי ₪ בתוך כל קבוצת-מהותיות, ומסמן aria-sort על עמודת-הסטייה', async () => {
    callReport.mockResolvedValue(profitabilityPayload())
    renderTab({ slug: 'profitability' })
    await screen.findByTestId('report-table-card')

    const headers = screen.getAllByRole('columnheader')
    const deviation = headers.find((h) => h.textContent.includes('סטייה ₪'))
    expect(deviation).toHaveAttribute('aria-sort', 'descending')
    expect(headers.filter((h) => h.hasAttribute('aria-sort'))).toHaveLength(1)
  })

  it('מצייר את אריח החריגות עם חצי-ההשוואה כמספר שלם', async () => {
    callReport.mockResolvedValue(profitabilityPayload())
    renderTab({ slug: 'profitability' })
    const tile = await screen.findByTestId('report-tile-over_threshold')
    expect(plain(tile)).toContain('פרויקטים שחרגו מהתקציב')
    expect(plain(tile)).toContain('30')
    expect(plain(tile)).toContain('2025: 17')
  })
})

// ---------------------------------------------------------------- מ9 · גיול חובות

describe('מ9 · גיול חובות (דוח-דריל)', () => {
  it('מתרגם את סדרות-הגרף דרך CUSTOMER_TYPE_LABELS ואינו מציג enum באנגלית', async () => {
    callReport.mockResolvedValue(agingRootPayload())
    renderTab({ slug: 'aging' })
    const legend = await screen.findByTestId('chart-legend')
    expect(plain(legend)).toContain('חברה ממשלתית')
    expect(plain(legend)).toContain('חברה פרטית')
    expect(legend.textContent).not.toContain('private_company')
  })

  it('📐18 · עמודת איש-הקשר מצוירת בשלוש הרמות, כפי שהשרת מצהיר אותה', async () => {
    // ⑧9.6 היה 🔵 פתוח ("לא ציירתי עמודה שכולה —"), ומיגרציית i2 סגרה אותו בהצהרת העמודה.
    // 🔑 **ללשונית אין כאן קוד** — `ReportTable` מצייר עמודות מוצהרות; הבדיקה מוודאת
    // שלא נשאר בלשונית שום סינון-עמודות שיבליע אותה כשהשרת יוסיף עוד אחת.
    callReport.mockResolvedValue(agingRootPayload())
    renderTab({ slug: 'aging' })
    expect(
      within(await screen.findByTestId('report-table-card')).getByText('ליהי סבן'),
    ).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'איש קשר' })).toBeInTheDocument()
  })

  it('📐18 · ועמודת איש-הקשר יורדת גם עם הרמה', async () => {
    callReport.mockResolvedValue(agingLevel1Payload())
    renderTab({ slug: 'aging', drill: { kind: 'bucket', bucket: 'd61_90' } })
    expect(
      within(await screen.findByTestId('report-table-card')).getByText('ניר נחום'),
    ).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'איש קשר' })).toBeInTheDocument()
  })

  it('עמודת "מדרג" נמסרת מהשרת כתווית מבודדת, והלשונית אינה נוגעת בה', async () => {
    // 🗑️ **הבדיקה הזו החליפה שתיים.** עד i2 הלשונית מיפתה `d90p` ⇒ `90+` וגם בידדה את
    // הטווח, כי הטור הציג קוד-מסד ואז הציג `30–1` הפוך. **i2 סגרה את שניהם במקור:**
    // `rows[].bucket` נושא את התווית (הקוד ב-`rows[].bucket_key`) והעמודה מוכרזת
    // `textLtr`, כך ש-`formatByType` מבודדת. ⇒ מה שנבדק כאן הוא **שקיפות**: מה שהשרת
    // שלח הוא מה שירד למסך, בלי מיפוי-צל ובלי בידוד כפול.
    const payload = agingRootPayload()
    callReport.mockResolvedValue(payload)
    renderTab({ slug: 'aging' })
    const table = await screen.findByTestId('report-table-card')

    expect(plain(table)).toContain('90+')
    expect(plain(table)).toContain('61–90')
    // קוד-המסד חי ב-`bucket_key` ואינו מוצהר כעמודה ⇒ אינו מגיע למסך.
    expect(payload.rows[0].bucket_key).toBe('d90p')
    expect(table.textContent).not.toContain('d90p')
    // בידוד **אחד**, של הפורמטר. שניים היו אומרים שהלשונית בידדה שוב.
    expect(table.textContent).toContain(iso('90+'))
    expect(table.textContent).not.toContain(`${LRI}${LRI}90+`)
  })

  it('אריח "שוטף — עוד לא באיחור" מצויר לצד הגרף ויורד רמה בלחיצה', async () => {
    callReport.mockResolvedValue(agingRootPayload())
    const { onDrill } = renderTab({ slug: 'aging' })

    const tile = await screen.findByTestId('aging-current-tile')
    // 🔴 **בתוך כרטיס-הגרף ולצידו** (כרטיס ①6ב: *"באריח נפרד לצד הגרף, לא כעמודה בו"*) —
    // עד שנקודת-ה-`aside` נפתחה הוא ישב בשורה נפרדת **מעל** הכרטיס.
    expect(
      within(screen.getByTestId('chart-card-stackedBar')).getByTestId('chart-aside'),
    ).toContainElement(tile)
    expect(plain(tile)).toContain('שוטף — עוד לא באיחור')
    expect(plain(tile)).toContain('48,746 ₪')
    expect(plain(tile)).toContain('101,679 ₪')
    await click(screen.getByTestId('report-tile-link-current_bucket'))
    expect(onDrill.mock.calls[0][0]).toEqual({ bucket: 'current' })
  })

  it('רמה 1 · פירורים, אריחי-הרמה, ולחיצה על שורה יורדת ללקוח', async () => {
    callReport.mockResolvedValue(agingLevel1Payload())
    const { onDrill } = renderTab({ slug: 'aging', drill: { kind: 'bucket', bucket: 'd61_90' } })

    const crumbs = await screen.findByTestId('report-crumbs')
    expect(plain(crumbs)).toContain('מדרג 61–90 יום')
    expect(plain(await screen.findByTestId('report-tile-bucket_amount'))).toContain('28,092 ₪')

    const rows = screen.getAllByTestId('report-row-drillable')
    await click(rows[0])
    expect(onDrill.mock.calls[0][0]).toEqual({
      kind: 'customer',
      bucket: 'd61_90',
      customer_id: 401,
    })
    // 📐9 — ברמה הזו השורות ממוינות לפי ₪, לא לפי ימי-איחור.
    const headers = screen.getAllByRole('columnheader')
    expect(headers.find((h) => h.textContent.includes('סכום'))).toHaveAttribute(
      'aria-sort',
      'descending',
    )
  })

  it('פירור-השורש מחזיר לרמה 0', async () => {
    callReport.mockResolvedValue(agingLevel1Payload())
    const { onDrill } = renderTab({ slug: 'aging', drill: { kind: 'bucket', bucket: 'd61_90' } })
    await screen.findByTestId('report-crumbs')
    await click(screen.getByTestId('report-crumb-0'))
    expect(onDrill.mock.calls[0][0]).toBeNull()
  })
})

// ---------------------------------------------------------------- מ12 · צריכת ציוד

describe('מ12 · צריכת ציוד', () => {
  it('מצייר שני גרפים ואת שתי הטבלאות הנוספות עם הכותרות שלהן', async () => {
    callReport.mockResolvedValue(equipmentPayload())
    renderTab({ slug: 'equipment' })

    // שלוש טבלאות בדף ⇒ שלושה `report-table-card`: הראשית ושתי `meta.extra_tables`.
    expect(await screen.findAllByTestId('report-table-card')).toHaveLength(3)
    expect(screen.getAllByTestId(/^chart-card-/)).toHaveLength(2)
    const extras = screen.getAllByTestId('report-extra-table')
    expect(extras).toHaveLength(2)
    expect(within(extras[0]).getByRole('heading')).toHaveTextContent('כמה להזמין לחודש הקרוב')
    expect(plain(extras[0])).toContain('2,607')
    // 📐9 חל גם על טבלה נוספת: "כמות להזמנה" היא העמודה שהיא ממוינת לפיה.
    expect(within(extras[0]).getByText(/כמות להזמנה/)).toHaveAttribute('aria-sort', 'descending')
  })

  it('סינון-צולב · לחיצה על מוצר בגרף מצמצמת את הטבלה, ושבב-הניקוי מחזיר אותה', async () => {
    callReport.mockResolvedValue(equipmentPayload())
    renderTab({ slug: 'equipment' })
    // ‏`report-row` חי גם בשתי הטבלאות הנוספות ⇒ הספירה מתוחמת לטבלה הראשית בלבד.
    const mainTable = () => screen.getAllByTestId('report-table-card')[0]
    await screen.findAllByTestId('report-table-card')
    expect(within(mainTable()).getAllByTestId('report-row')).toHaveLength(2)

    // הנתיב שקיים במקלדת: הכפתור בטבלת-קורא-המסך של `ChartCard` (‏onClick על `<rect>` אינו
    // ניתן-להפעלה במקלדת — §⑤ #7). המפתח `item_name` מזוהה אוטומטית ומאומת מול השורות.
    await click(screen.getAllByTestId('chart-select-0')[0])
    expect(within(mainTable()).getAllByTestId('report-row')).toHaveLength(1)
    expect(plain(screen.getByTestId('report-crossfilter-label'))).toContain('שרוך סאטן - ממותג')

    await click(screen.getByTestId('report-clear-crossfilter'))
    expect(within(mainTable()).getAllByTestId('report-row')).toHaveLength(2)
  })

  it('רמז-ג יושב בכרטיס-הגרף השני, לא בראשון (עוגן §⑩ג)', async () => {
    state.onboardingMode = 2
    callReport.mockResolvedValue(equipmentPayload())
    renderTab({ slug: 'equipment' })
    await screen.findAllByTestId('report-table-card')
    const cards = screen.getAllByTestId(/^chart-card-/)
    expect(cards).toHaveLength(2)
    // "גרף-העלות שמעל … והגרף הזה לפי הכמות שהוזמנה" — המשפט מדבר מתוך הגרף השני.
    expect(within(cards[1]).getByTestId('hint-reports.equipment.sortWhy')).toBeInTheDocument()
    expect(within(cards[0]).queryByTestId('hint-reports.equipment.sortWhy')).toBeNull()
  })

  it('שורות הטבלה אינן לחיצות — יעד-הקידוח של ה-sku אינו מסך קיים (⑧12.1 פתוח)', async () => {
    callReport.mockResolvedValue(equipmentPayload())
    renderTab({ slug: 'equipment' })
    await screen.findAllByTestId('report-table-card')
    expect(screen.queryAllByTestId('report-row-drillable')).toHaveLength(0)
    expect(screen.getAllByTestId('report-row').length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------- מצבים · ייצוא · הטמעה

describe('חמשת המצבים והייצוא', () => {
  it('payload ריק ⇒ ריק-לגמרי, ולא מסך שמתיימר להיות טעון', async () => {
    callReport.mockResolvedValue(base({}))
    renderTab({ slug: 'finance-overview' })
    expect(await screen.findByTestId('report-finance-overview-blank')).toBeInTheDocument()
  })

  it('ריק-אחרי-סינון ⇒ מעטפת "empty" עם "נקי מסננים" שקוראת לניקוי', async () => {
    // ⚠️ **מה הבדיקה הזו מוכיחה ומה לא:** היא מוכיחה שהלשונית מעבירה `isFiltered`
    // ו-`clearFilters` נכון, ושהמעטפת בוחרת את הענף הנכון. 🚫 **היא אינה מוכיחה שהמצב
    // נגיש בייצור בלשונית הזו** — המעטפת גוזרת ריקות מ-`tiles/chart/rows`, וארבעת
    // משטחי-הכספים מחזירים אריחים תמיד. ⇒ המצב ייפתח לייצור רק כשהמעטפת תגזור ריקות
    // מ-`rows` + `population.n` (תיקון-מעטפת שטרם נחת; נמדד ב-`ReportSurface.jsx` היום).
    callReport.mockResolvedValue(base({}))
    render(
      <MemoryRouter initialEntries={['/reports?tab=finance&report=finance-overview']}>
        <FinanceTab
          surface={surfaceBySlug('finance-overview')}
          filters={{ ...filters, isFiltered: true }}
          drill={null}
          onDrill={vi.fn()}
          onWindow={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(await screen.findByTestId('report-finance-overview-empty')).toBeInTheDocument()
    await click(screen.getByTestId('reports-clear-filters'))
    expect(clearFilters).toHaveBeenCalledTimes(1)
  })

  it('כשל-רשת ⇒ מצב-תקלה עם "נסי שוב", והלחיצה קוראת שוב לשרת', async () => {
    callReport.mockRejectedValueOnce(new Error('boom')).mockResolvedValue(overviewPayload())
    renderTab({ slug: 'finance-overview' })

    expect(await screen.findByTestId('report-finance-overview-error')).toBeInTheDocument()
    expect(screen.queryByText('אין נתונים עדיין')).not.toBeInTheDocument()
    await click(screen.getByRole('button', { name: 'נסי שוב' }))
    expect(await screen.findByTestId('report-tile-open_debt')).toBeInTheDocument()
    expect(callReport).toHaveBeenCalledTimes(2)
  })

  it('חוסר-הרשאה ⇒ מעטפת-הרשאה עם שם-הדוח, בלי כפתור-ניסיון', async () => {
    const denied = Object.assign(new Error('denied'), { code: '42501' })
    callReport.mockRejectedValue(denied)
    renderTab({ slug: 'aging' })
    const envelope = await screen.findByTestId('report-aging-no-permission')
    expect(plain(envelope)).toContain('אין לך הרשאה לצפות בגיול חובות')
    expect(screen.queryByRole('button', { name: 'נסי שוב' })).not.toBeInTheDocument()
  })

  it('פרמטר-מערכת חסר ⇒ הודעה עברית בשם הפרמטר', async () => {
    const payload = overviewPayload()
    payload.meta.missing_params = ['תנאי_תשלום_ימים']
    callReport.mockResolvedValue(payload)
    renderTab({ slug: 'finance-overview' })
    expect(plain(await screen.findByTestId('report-missing-params'))).toContain(
      'חסר פרמטר מערכת: תנאי תשלום ללקוח',
    )
  })

  it('טבלה בלי שורות ⇒ הכפתור נשאר פעיל, והחסימה עברה לתוך החלון', async () => {
    const payload = overviewPayload()
    payload.rows = []
    callReport.mockResolvedValue(payload)
    renderTab({ slug: 'finance-overview' })
    const button = await screen.findByTestId('reports-export-button')
    expect(button).toBeEnabled()
    // ✏️ **17/09/2026 — ת4ב:** הכפתור פעיל תמיד והכיתוב עבר לתוך החלון; החסימה נבדקת
    // פר-דוח נבחר. הנוסח הנעול עצמו נבדק ב-`reportsExport.test.js` (זהות-בייט) וב-
    // `ExportDialog.test.jsx` (מוצג במקום שורת-הכמות, והייצוא מנוטרל).
    expect(screen.queryByTestId('reports-export-file')).toBeNull()
  })
})

describe('שכבת-ההטמעה (§2ב C3)', () => {
  it('כל מפתח שהלשונית משתילה קיים בקובץ-הקופי שלה', () => {
    const used = Object.values(FINANCE_SURFACE_SPECS).flatMap(hintIdsOf)
    expect(used).toHaveLength(15)
    for (const id of used) {
      expect(M11_FINANCE_COPY, `מפתח חסר: ${id}`).toHaveProperty(id)
      expect(M11_FINANCE_COPY[id].guided.length).toBeGreaterThan(40)
    }
    // ② רק `guided` — רמה 1 אינה נכתבת (הכרעת-ישי).
    for (const entry of Object.values(M11_FINANCE_COPY)) {
      expect(Object.keys(entry)).toEqual(['guided'])
    }
  })

  it('רמה 2 · ארבעת הרמזים של מבט-על יושבים בעוגנים שלהם, ולא רק על הדף', async () => {
    callReport.mockResolvedValue(overviewPayload())
    renderTab({ slug: 'finance-overview' })
    await screen.findByTestId('report-tile-open_debt')
    for (const id of hintIdsOf(FINANCE_SURFACE_SPECS['finance-overview'])) {
      expect(screen.getByTestId(`hint-${id}`)).toBeInTheDocument()
    }
    // 🔴 **מיקום נמדד ולא מונח.** השם הישן הבטיח "בעוגנים שלהם" בעוד הגוף בדק נוכחות
    // בלבד — בנייה שערמה את ארבעת הרמזים בתחתית הדף הייתה עוברת אותו.
    const before = (a, b) =>
      Boolean(
        screen.getByTestId(a).compareDocumentPosition(screen.getByTestId(b)) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      )
    // `whyAndFirst` — **בין שורת-"אז מה" לאריחים**, בדיוק כפי שהכרטיס מעגן (renderAfterSoWhat).
    expect(before('report-so-what', 'hint-reports.overview.whyAndFirst')).toBe(true)
    expect(before('hint-reports.overview.whyAndFirst', 'report-tiles')).toBe(true)
    // `tileBasis` — בין האריחים לכרטיס-הגרף.
    expect(before('report-tiles', 'hint-reports.overview.tileBasis')).toBe(true)
    expect(before('hint-reports.overview.tileBasis', 'chart-card-bar')).toBe(true)
    // `debtSeriesBasis` — **בתוך** הכרטיס, מתחת לציור (renderChartFooter).
    expect(
      within(screen.getByTestId('chart-card-bar')).getByTestId(
        'hint-reports.overview.debtSeriesBasis',
      ),
    ).toBeInTheDocument()
    expect(before('chart-figure', 'hint-reports.overview.debtSeriesBasis')).toBe(true)
    // `oldestSort` בין הגרף לטבלה.
    expect(before('chart-card-bar', 'hint-reports.overview.oldestSort')).toBe(true)
    expect(before('hint-reports.overview.oldestSort', 'report-table-card')).toBe(true)
  })

  it('מבחן-המחיקה · ברמה 0 אין אף רמז, והדף עומד במלואו', async () => {
    state.onboardingMode = 0
    callReport.mockResolvedValue(overviewPayload())
    renderTab({ slug: 'finance-overview' })

    await screen.findByTestId('report-tile-open_debt')
    expect(document.querySelectorAll('[data-testid^="hint-"]')).toHaveLength(0)
    // הבסיס (📐2 · 📐23 · 📐16 · טבלה · ייצוא · דלת) נשאר על המסך.
    expect(screen.getByTestId('report-population')).toBeInTheDocument()
    expect(screen.getByTestId('report-so-what')).toBeInTheDocument()
    expect(screen.getByTestId('report-definitions')).toBeInTheDocument()
    expect(screen.getByTestId('report-table-card')).toBeInTheDocument()
    expect(screen.getByTestId('reports-export-button')).toBeInTheDocument()
    expect(screen.getByTestId('finance-row-cap')).toBeInTheDocument()
    expect(screen.getByTestId('finance-open-invoices-door')).toBeInTheDocument()
  })
})
