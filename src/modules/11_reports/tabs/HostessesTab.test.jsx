// בדיקות לשונית "דיילות" (מ14 · מ15 · מ16 · מ17).
//
// 🔑 **מה נבדק כאן ומה במכוון לא:** הלשונית אינה מציירת אריח/טבלה/ייצוא בעצמה — `ReportSurface`
// עושה זאת, ויש לו בדיקות משלו. ⇒ כאן נבדק **מה שהלשונית באמת מוסיפה**: ארבע נקודות-ההרחבה
// (סינון-לקוח · מיפוי-תוויות · תיקון-יחידה · שכבת-ההטמעה), ועל גבי מטען אמיתי מהמסד נבדק
// שהשרשרת כולה מגיעה למסך — כי תקלה בין שתי השכבות אינה נראית באף אחת מהן לבדה.
//
// 🔬 **המספרים בפיקסצ'רים הם מדידה חיה** (‏CEO, 16/09/2026, ‏`p_from/p_to = null`) ולא
// המצאה: `87.2%` הגעה-בזמן · `6` אדומות · ג'יני `0.4581` · `50` פעילות מתוך `186` ·
// `17` בלי דירוג · חציון-תעריף `43.27 ₪` · תגובה חציונית `9.9` שעות · אחוזון-90 `20.7`.
// 🚫 **ולא הועתקו מהכרטיס** — הכרטיס מדד ב-10/09 והחלון נגרר מאז.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

vi.mock('@/supabaseClient', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))

// רמת-ההטמעה נשלטת מהבדיקה: מצב 2 בודק שהשכבה מרונדרת, מצב 0 הוא **מבחן-המחיקה**.
const onboardingMode = { value: 2 }
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ onboardingMode: onboardingMode.value }),
}))

// ‏jsdom אינו מודד SVG; המוק מחזיר אלמנטים אמיתיים כדי שאפשר יהיה לאמת מה נמסר לגרף.
vi.mock('recharts', () => {
  const stub =
    (name) =>
    ({ children }) => <div data-testid={`recharts-${name}`}>{children}</div>
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
  return Object.fromEntries(names.map((n) => [n, stub(n)]))
})

const callReport = vi.fn()
vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, callReport: (...args) => callReport(...args) }
})

import { M11_HOSTESSES_COPY } from '@/lib/onboardingCopy.m11.hostesses'
import HostessesTab from './HostessesTab'
import ReportSurface from '../components/ReportSurface'

const SURFACES = {
  m14: {
    id: 'מ14',
    slug: 'hostess-overview',
    rpc: 'report_m14_hostess_overview',
    name: 'מבט-על דיילות',
    drill: false,
  },
  m15: {
    id: 'מ15',
    slug: 'reliability',
    rpc: 'report_m15_reliability',
    name: 'אמינות והתייצבות',
    drill: false,
  },
  m16: {
    id: 'מ16',
    slug: 'quality-cost',
    rpc: 'report_m16_quality_cost',
    name: 'איכות מול עלות',
    drill: false,
  },
  m17: {
    id: 'מ17',
    slug: 'fairness',
    rpc: 'report_m17_fairness',
    name: 'הוגנות השיבוץ',
    drill: false,
  },
}

const filters = {
  from: null,
  to: null,
  customerId: null,
  windowLabel: '12 החודשים האחרונים',
  isFiltered: false,
  reloadTick: 0,
  clearFilters: () => {},
}

function base(extra) {
  return {
    population: { n: 0, label: 'אוכלוסייה: —', excluded: {} },
    window: { from: '2025-09-16', to: '2026-09-16', label: '12 החודשים האחרונים' },
    tiles: [],
    chart: null,
    columns: [],
    rows: [],
    so_what: null,
    definitions: null,
    drill: null,
    meta: { missing_params: [], notes: [] },
    ...extra,
  }
}

// ── מ14 · מבט-על דיילות ─────────────────────────────────────────────────────
const m14 = () =>
  base({
    population: {
      n: 1699,
      label: 'אוכלוסייה: שיבוצים שסומנה בהם נוכחות · ⁦n=1,699⁩ שיבוצים אצל ⁦98⁩ דיילות',
      excluded: {},
    },
    tiles: [
      {
        key: 'on_time',
        label: 'הגעה בזמן',
        value: 87.2,
        format: 'percent',
        window: '12 החודשים האחרונים',
        compare: { label: 'התקופה המקבילה אשתקד', value: 88.7, direction: 'down' },
        target: null,
      },
      {
        key: 'red_hostesses',
        label: 'דיילות אדומות',
        value: 6,
        format: 'int',
        window: 'חלון קפוא · 12 חודשים',
        compare: { label: 'התקופה המקבילה אשתקד', value: 0, direction: 'up' },
        target: { tab: 'דיילות', report: 'אמינות והתייצבות', drill: null },
      },
      {
        key: 'gini',
        label: 'ריכוזיות המשמרות',
        value: 0.4581,
        format: 'gini',
        window: '12 החודשים האחרונים',
        compare: { label: 'התקופה המקבילה אשתקד (n=97)', value: 0.4383, direction: 'up' },
        target: { tab: 'דיילות', report: 'הוגנות השיבוץ', drill: null },
      },
      {
        key: 'active_hostesses',
        label: 'דיילות פעילות',
        value: 50,
        format: 'int',
        window: 'נכון ל-16/09/2026',
        compare: null,
        target: { tab: 'דיילות', report: 'איכות מול עלות', drill: null },
      },
      {
        key: 'gap_events',
        label: 'אירועים עם חוסר',
        value: 4,
        format: 'int',
        window: '30 הימים הקרובים',
        compare: { label: '31–60 הימים הבאים', value: 2, direction: 'up' },
        target: null,
      },
    ],
    chart: {
      type: 'bar',
      title: 'איחור ואי-הגעה לפי חודש',
      xKey: 'month',
      unit: 'percent',
      series: [
        { key: 'late', label: 'איחור' },
        { key: 'no_show', label: 'אי-הגעה (הבריזה)' },
      ],
      data: [{ month: '2025-09', late: 10.2, no_show: 1.7, n: 59 }],
      refLines: [],
    },
    columns: [
      { key: 'hostess_name', label: 'דיילת', format: 'text', align: 'start' },
      { key: 'status', label: 'סטטוס', format: 'text', align: 'start' },
      { key: 'reliability', label: 'ציון אמינות', format: 'score', align: 'end' },
      { key: 'last_shift_date', label: 'משמרת אחרונה', format: 'date', align: 'end' },
    ],
    rows: [
      {
        hostess_name: 'רותם עמר',
        status: 'פעילה',
        reliability: 0.7589,
        last_shift_date: '2026-08-20',
        drill_key: { kind: 'hostess', id: 449 },
      },
    ],
    so_what: 'לא לשלוח את 6 הדיילות האדומות לאירועים הקרובים.',
    definitions: 'הגדרות: הגעה בזמן = …',
    meta: { missing_params: [], notes: ['החודש 09/2026 אינו בגרף'], sort: null },
  })

// ── מ15 · אמינות והתייצבות ──────────────────────────────────────────────────
const m15 = (selectedDow = null) =>
  base({
    population: {
      n: 87,
      label: 'אוכלוסייה: דיילות עם ⁦3⁩ משמרות מסומנות ומעלה · ⁦n=87⁩ דיילות, ⁦1,683⁩ שיבוצים',
      excluded: {},
    },
    window: { from: '2025-09-16', to: '2026-09-16', label: 'חלון קפוא · 12 החודשים האחרונים' },
    tiles: [
      {
        key: 'on_time',
        label: 'הגעה בזמן',
        value: 87.2,
        format: 'percent',
        window: 'חלון קפוא · 12 חודשים',
        compare: null,
        target: null,
      },
      {
        key: 'flagged',
        label: 'דיילות מסומנות',
        value: 11,
        format: 'int',
        window: 'חלון קפוא · 12 חודשים',
        compare: null,
        target: null,
      },
    ],
    chart: {
      type: 'bar',
      title: 'איחור ואי-הגעה לפי יום בשבוע',
      xKey: 'dow',
      unit: 'percent',
      label_source: 'WEEKDAY_NAMES_HE',
      series: [
        { key: 'late', label: 'איחור' },
        { key: 'no_show', label: 'אי-הגעה (הבריזה)' },
      ],
      data: [
        { dow: 0, late: 10.6, no_show: 3.4, n: 292 },
        { dow: 4, late: 10.8, no_show: 2.3, n: 343 },
      ],
      refLines: [],
    },
    columns: [
      { key: 'hostess_name', label: 'דיילת', format: 'text', align: 'start' },
      { key: 'status', label: 'סטטוס', format: 'text', align: 'start' },
      { key: 'no_show_12m', label: 'הבריזה · ב-12 חודשים', format: 'int', align: 'end' },
      { key: 'no_show_ever', label: 'אי-הגעה · אי-פעם', format: 'int', align: 'end' },
    ],
    rows: [
      {
        row_key: 1,
        hostess_name: 'רותם עמר',
        status: 'פעילה',
        band: 'red',
        no_show_12m: 3,
        no_show_ever: 3,
      },
      {
        row_key: 2,
        hostess_name: 'ענבר חדד',
        status: 'לא פעילה',
        band: 'amber',
        no_show_12m: 1,
        no_show_ever: 2,
      },
      {
        row_key: 3,
        hostess_name: 'נופר הרוש',
        status: 'פעילה',
        band: null,
        no_show_12m: 0,
        no_show_ever: 1,
      },
    ],
    so_what: 'לא לשלוח את 6 הדיילות האדומות.',
    definitions: 'הגדרות: ציון אמינות = …',
    meta: {
      missing_params: [],
      notes: ['מתחת לסף המדגם: 11 דיילות'],
      selected_dow: selectedDow,
      extra_tables: [
        {
          title: 'אי-הגעה לפי דירוג',
          columns: [
            { key: 'rating_label', label: 'דירוג', format: 'text', align: 'start' },
            { key: 'months12', label: '12 חודשים', format: 'percent', align: 'end' },
            { key: 'ever', label: 'אי-פעם', format: 'percent', align: 'end' },
          ],
          rows: [{ rating_label: '3', months12: 6.6, ever: 14.6 }],
        },
      ],
    },
  })

// ── מ16 · איכות מול עלות ────────────────────────────────────────────────────
const m16 = () =>
  base({
    population: {
      n: 50,
      label: 'אוכלוסייה: דיילות פעילות בלבד — n=50 מתוך 186 רשומות',
      excluded: {},
    },
    tiles: [
      {
        key: 'no_rating',
        label: 'דיילות בלי דירוג',
        value: 17,
        format: 'int',
        window: 'נכון ל-16/09/2026',
        compare: null,
        target: null,
      },
      {
        key: 'median_rate',
        label: 'תעריף שעתי חציוני',
        value: 43.27,
        format: 'money',
        window: 'נכון ל-16/09/2026',
        compare: { label: 'חציון כלל המאגר (186)', value: 44, direction: 'down' },
        target: null,
      },
    ],
    chart: {
      type: 'scatter',
      title: 'תעריף שעתי מול דירוג · הדיילות הפעילות',
      xKey: 'hourly_rate',
      unit: 'money',
      domain: [1, 5],
      series: [
        { key: 'hourly_rate', label: 'תעריף שעתי' },
        { key: 'rating', label: 'דירוג' },
      ],
      data: [
        { hourly_rate: 49.39, rating: 5, hostess_name: 'שקד ניסים' },
        { hourly_rate: 47.98, rating: 5, hostess_name: 'גלי אוחיון' },
      ],
      refLines: [{ axis: 'x', value: 43.27, label: 'חציון התעריף 43.27 ₪' }],
    },
    columns: [
      { key: 'hostess_name', label: 'דיילת', format: 'text', align: 'start' },
      { key: 'hourly_rate', label: 'תעריף שעתי', format: 'money', align: 'end' },
      { key: 'rating', label: 'דירוג', format: 'int', align: 'end' },
    ],
    // ⚠️ `hourly_rate` יושב **גם** בשורות ו**גם** ב-`chart.xKey`, בדיוק כמו במטען החי —
    // וזה מה שמפעיל את הזיהוי-האוטומטי של המעטפת. פיקסצ'ר בלי זה היה הופך את מבחן-הכיבוי
    // לריק (נמדד: הוא נכשל, וזו הייתה הסיבה).
    rows: [
      { row_key: 1, hostess_name: 'אביב יוסף', hourly_rate: 41.73, rating: null },
      { row_key: 2, hostess_name: 'שקד ניסים', hourly_rate: 49.39, rating: 5 },
      { row_key: 3, hostess_name: 'גלי אוחיון', hourly_rate: 47.98, rating: 5 },
    ],
    so_what: 'להוריד את התעריף של 2 הדיילות שמעל חציון-המאגר.',
    definitions: 'הגדרות: תעריף שעתי = …',
    meta: {
      missing_params: [],
      notes: [],
      default_filter: 'no_rating',
      no_rating_count: 1,
      row_total: 3,
    },
  })

// ── מ17 · הוגנות השיבוץ ─────────────────────────────────────────────────────
const m17 = () =>
  base({
    population: {
      n: 106,
      label: 'אוכלוסייה: כל דיילת עם משמרת מאושרת אחת לפחות — ⁦n=106⁩ דיילות, ⁦1,869⁩ משמרות',
      excluded: {},
    },
    tiles: [
      {
        key: 'rank1_adoption',
        label: 'אימוץ המלצת Smart Match',
        value: null,
        format: 'percent',
        window: 'טרם נמדד',
        compare: null,
        target: null,
      },
      {
        key: 'median_response',
        label: 'זמן-תגובה חציוני לזימון',
        value: 9.9,
        format: 'days',
        window: '12 החודשים האחרונים',
        compare: { label: 'התקופה המקבילה אשתקד', value: 9.5, direction: 'up' },
        target: null,
      },
      {
        key: 'p90_response',
        label: 'זמן-תגובה, אחוזון 90',
        value: 20.7,
        format: 'days',
        window: '12 החודשים האחרונים',
        compare: null,
        target: null,
      },
    ],
    chart: {
      type: 'lorenz',
      title: 'עקומת לורנץ',
      xKey: 'x',
      unit: 'percent',
      domain: [0, 100],
      series: [{ key: 'y', label: 'אחוז-משמרות מצטבר' }],
      data: [{ x: 0, y: 0 }],
      refLines: [],
    },
    columns: [
      { key: 'hostess_name', label: 'דיילת', format: 'text', align: 'start' },
      { key: 'shifts', label: 'משמרות', format: 'int', align: 'end' },
    ],
    rows: [{ row_key: 1, hostess_name: 'אביב יוסף', shifts: 49 }],
    so_what: 'לפתוח את מסך השיבוץ עם רבע הדיילות התחתון.',
    definitions: 'הגדרות: זמן-תגובה = … בשעות',
    meta: {
      missing_params: [],
      notes: ['אימוץ המלצת Smart Match — אין עדיין נתון'],
      extra_tables: [
        {
          title: 'הדיילות שעונות הכי לאט',
          columns: [
            { key: 'hostess_name', label: 'דיילת', format: 'text', align: 'start' },
            {
              key: 'median_response_hours',
              label: 'זמן-תגובה חציוני (שעות)',
              format: 'ratio',
              align: 'end',
            },
          ],
          rows: [{ hostess_name: 'ענבר חדד', median_response_hours: 31.6 }],
        },
      ],
    },
  })

// ⚠️ `meta.extra_tables` מרונדרות דרך אותו `ReportTable` ⇒ אותם `data-testid` בדיוק.
// ספירת-שורות מתוך `screen` הייתה סופרת גם אותן — ‏`mainTable()` מצמצם לטבלה הראשית.
const mainTable = () => screen.getAllByTestId('report-table-card')[0]

function renderTab(surface, { drill = null, onDrill = vi.fn() } = {}) {
  render(
    <HostessesTab
      surface={surface}
      filters={filters}
      drill={drill}
      onDrill={onDrill}
      onWindow={() => {}}
    />,
  )
  return onDrill
}

beforeEach(() => {
  callReport.mockReset()
  onboardingMode.value = 2
})

describe('מ14 · מבט-על דיילות', () => {
  it('מצייר את חמשת האריחים בתוויות §1.4 ובדיוק של 📐4, ואת שורות-הבסיס', async () => {
    callReport.mockResolvedValue(m14())
    renderTab(SURFACES.m14)

    expect(await screen.findByTestId('report-tiles')).toBeInTheDocument()
    const labels = [
      'הגעה בזמן',
      'דיילות אדומות',
      'ריכוזיות המשמרות',
      'דיילות פעילות',
      'אירועים עם חוסר',
    ]
    for (const label of labels) expect(screen.getByText(label)).toBeInTheDocument()
    // 📐4 — אחוז בעשרונית אחת · ג'יני בשתיים, שניהם מבודדים ב-LRI…PDI.
    expect(screen.getByTestId('report-tile-on_time')).toHaveTextContent('87.2%')
    expect(screen.getByTestId('report-tile-gini')).toHaveTextContent('0.46')
    // 📐2 · 📐23 · 📐16 — שלוש שורות-הבסיס, שאינן שכבת-הטמעה.
    expect(screen.getByTestId('report-population')).toHaveTextContent('n=1,699')
    expect(screen.getByTestId('report-so-what')).toHaveTextContent('לא לשלוח')
    expect(screen.getByTestId('report-definitions')).toHaveTextContent('הגדרות')
  })

  it('השורה כולה דלת לכרטיס-הדיילת (הכרעה 19) — גם במשטח שאינו דוח-דריל', async () => {
    // ✏️ 16/09 11:2X — נסגר בשכבה המשותפת (11f347a9): `ReportSurface` מוסר `onDrill`
    // ל-`ReportTable` על כל שורה עם `drill_key` שה-`kind` שלה נתיב (ROW_DOOR_KINDS),
    // ולא רק כש-`surface.drill`. לפני כן `report-row-drillable` היה 0 בכל ארבעת המשטחים.
    callReport.mockResolvedValue(m14())
    const onDrill = renderTab(SURFACES.m14)
    const row = (await screen.findAllByTestId('report-row-drillable'))[0]
    fireEvent.click(row)
    expect(onDrill).toHaveBeenCalledWith({ kind: 'hostess', id: 449 }, expect.anything())
  })

  it('תאריך וציון מעוצבים לפי הפורמטים של H2 — לא ISO ולא ספרה אחת', async () => {
    callReport.mockResolvedValue(m14())
    renderTab(SURFACES.m14)
    const row = (await screen.findAllByTestId('report-row-drillable'))[0]
    // `date` ⇒ DD/MM/YYYY · `score` ⇒ שלוש ספרות (‏`ratio` היה משטח את שש האדומות ל-0.8).
    expect(row).toHaveTextContent('20/08/2026')
    expect(row).toHaveTextContent('0.759')
  })

  it('כותרת-הטבלה נגזרת ממספר השורות שנשארו ולא מוקלדת', async () => {
    callReport.mockResolvedValue(m14())
    renderTab(SURFACES.m14)
    expect(await screen.findByTestId('report-table-title')).toHaveTextContent(
      'הדיילות האדומות · מיון לפי ציון-אמינות, מהנמוך',
    )
    expect(screen.getByTestId('report-table-title').textContent).toMatch(/1/)
  })

  it('בלי אדומות — הכותרת אומרת "אין דיילות מתחת לסף" (כרטיס ①7)', async () => {
    callReport.mockResolvedValue({ ...m14(), rows: [] })
    renderTab(SURFACES.m14)
    expect(await screen.findByTestId('report-table-title')).toHaveTextContent('אין דיילות מתחת לסף')
  })
})

describe('מ15 · אמינות והתייצבות', () => {
  it('ממפה `dow` 0–6 לשמות-ימים דרך `chart.label_source` — הציר אינו ספרות', async () => {
    callReport.mockResolvedValue(m15())
    renderTab(SURFACES.m15)
    // בורר-היום נבנה מאותם נתוני-גרף; שמו של כל שבב הוא התווית שהגיעה מהמיפוי.
    const dowRow = await screen.findByTestId('reports-chips-dow')
    expect(within(dowRow).getByTestId('reports-chips-dow-dow-0')).toHaveTextContent('ראשון')
    expect(within(dowRow).getByTestId('reports-chips-dow-dow-4')).toHaveTextContent('חמישי')
    expect(within(dowRow).queryByTestId('reports-chips-dow-dow-6')).toBeNull()
  })

  it('בלי `chart.label_source` — בורר-היום אינו מרונדר כלל, ולא כתווית ריקה', async () => {
    const payload = m15()
    delete payload.chart.label_source
    callReport.mockResolvedValue(payload)
    renderTab(SURFACES.m15)
    await screen.findByTestId('reports-chips-reliability')
    expect(screen.queryByTestId('reports-chips-dow')).toBeNull()
  })

  it('שבב "אדומות וענבר בלבד" מסנן את השורות, והמונה סופר את מה שמוצג (📐8)', async () => {
    callReport.mockResolvedValue(m15())
    renderTab(SURFACES.m15)
    await screen.findByTestId('report-table-title')
    expect(within(mainTable()).getAllByTestId('report-row')).toHaveLength(3)
    fireEvent.click(screen.getByTestId('reports-chips-reliability-onlyFlag'))
    expect(within(mainTable()).getAllByTestId('report-row')).toHaveLength(2)
    expect(screen.getByTestId('reports-chips-reliability-onlyFlag')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    // שני השבבים מצטלבים (כרטיס ①6): מסומנת **וגם** פעילה.
    fireEvent.click(screen.getByTestId('reports-chips-reliability-onlyActive'))
    expect(within(mainTable()).getAllByTestId('report-row')).toHaveLength(1)
    expect(screen.getByTestId('reports-chips-reliability-announce')).toHaveTextContent('שורות')
  })

  it('בחירת-יום נוסעת ב-`p_drill` דרך הכתובת, ולחיצה חוזרת מנקה', async () => {
    callReport.mockResolvedValue(m15())
    const onDrill = renderTab(SURFACES.m15)
    fireEvent.click(await screen.findByTestId('reports-chips-dow-dow-4'))
    expect(onDrill).toHaveBeenCalledWith({ dow: 4 })

    callReport.mockResolvedValue(m15(4))
    renderTab(SURFACES.m15, { drill: { dow: 4 }, onDrill })
    const clear = await screen.findAllByTestId('reports-chips-dow-clearDow')
    fireEvent.click(clear[0])
    expect(onDrill).toHaveBeenLastCalledWith(null)
  })

  it('שתי עמודות אי-ההגעה קיימות, ו-`meta.extra_tables` מרונדר פעם אחת בלבד', async () => {
    callReport.mockResolvedValue(m15())
    renderTab(SURFACES.m15)
    expect(await screen.findByText('הבריזה · ב-12 חודשים')).toBeInTheDocument()
    expect(screen.getByText('אי-הגעה · אי-פעם')).toBeInTheDocument()
    const extra = screen.getAllByTestId('report-extra-table')
    expect(extra).toHaveLength(1)
    // כותרת גלויה + `<caption class="sr-only">` של אותה טבלה — שתיהן, ולא יותר.
    expect(within(extra[0]).getAllByText('אי-הגעה לפי דירוג')).toHaveLength(2)
  })
})

describe('מ16 · איכות מול עלות', () => {
  it('נפתח מסונן ל"בלי דירוג" (ברירת-מחדל), והכיבוי מחזיר את כל הפעילות', async () => {
    callReport.mockResolvedValue(m16())
    renderTab(SURFACES.m16)
    const chip = await screen.findByTestId('reports-chips-quality-cost-onlyNoRating')
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(within(mainTable()).getAllByTestId('report-row')).toHaveLength(1)
    expect(screen.getByTestId('report-table-title')).toHaveTextContent(
      'הדיילות הפעילות שאין להן דירוג',
    )

    fireEvent.click(chip)
    expect(within(mainTable()).getAllByTestId('report-row')).toHaveLength(3)
    expect(screen.getByTestId('report-table-title')).toHaveTextContent('כל הדיילות הפעילות')
  })
})

describe('הסינון-הצולב של המעטפת', () => {
  it('מ16 · הפיזור מכובה מפורשות — `hourly_rate` אינו משמעות-הדף', async () => {
    // 🔴 **מבחן דו-צדדי, אחרת הוא ריק:** ‏`ReportSurface` מוסר `onSelect` ל-`ChartCard`
    // **רק** כשנפתר מפתח-סינון, ולכן היעדר כפתורי-הבחירה בטבלת-קורא-המסך הוא בדיוק
    // ההוכחה. ① דרך הלשונית — אין אף כפתור. ② אותו מטען דרך המעטפת **בלי** הטרנספורמציה —
    // הזיהוי-האוטומטי תופס `hourly_rate` ומייצר אותם. הצד השני הוא מה שמוכיח שהכיבוי
    // הוא שלי ולא מקריות של הפיקסצ'ר.
    callReport.mockResolvedValue(m16())
    const { unmount } = render(
      <HostessesTab
        surface={SURFACES.m16}
        filters={filters}
        drill={null}
        onDrill={vi.fn()}
        onWindow={() => {}}
      />,
    )
    await screen.findByTestId('report-table-title')
    expect(screen.queryAllByTestId(/^chart-select-/)).toHaveLength(0)
    unmount()

    callReport.mockResolvedValue(m16())
    render(
      <ReportSurface
        surface={SURFACES.m16}
        filters={filters}
        drill={null}
        onDrill={vi.fn()}
        onWindow={() => {}}
      />,
    )
    await screen.findByTestId('report-tiles')
    expect(screen.queryAllByTestId(/^chart-select-/).length).toBeGreaterThan(0)
  })

  it('מ14 · מ15 · מ17 — אין מפתח-סינון אוטומטי (month · dow · x אינם מפתחות-שורה)', async () => {
    for (const [surface, payload] of [
      [SURFACES.m14, m14()],
      [SURFACES.m15, m15()],
      [SURFACES.m17, m17()],
    ]) {
      callReport.mockResolvedValue(payload)
      const { unmount } = render(
        <HostessesTab
          surface={surface}
          filters={filters}
          drill={null}
          onDrill={vi.fn()}
          onWindow={() => {}}
        />,
      )
      await screen.findByTestId('report-table-title')
      // אין כפתורי-בחירה בכלל ⇒ המעטפת לא פתרה מפתח ⇒ אין סינון-צולב על המשטח הזה.
      expect(screen.queryAllByTestId(/^chart-select-/)).toHaveLength(0)
      unmount()
    }
  })
})

describe('מ17 · הוגנות השיבוץ', () => {
  it('אריח-האימוץ מצהיר היעדר ואינו מדפיס אחוז', async () => {
    callReport.mockResolvedValue(m17())
    renderTab(SURFACES.m17)
    const tile = await screen.findByTestId('report-tile-rank1_adoption')
    expect(tile).toHaveTextContent('אימוץ המלצת Smart Match')
    expect(tile).toHaveTextContent('טרם נמדד')
    expect(tile).not.toHaveTextContent('%')
    expect(screen.getByTestId('report-notes')).toHaveTextContent('אין עדיין נתון')
  })

  it('זמני-התגובה מוצגים בערכם, ולא כ"ימים" מעוגלים (תיקון-יחידה מוצהר)', async () => {
    callReport.mockResolvedValue(m17())
    renderTab(SURFACES.m17)
    const median = await screen.findByTestId('report-tile-median_response')
    expect(median).toHaveTextContent('9.9')
    expect(median).not.toHaveTextContent('ימים')
    expect(screen.getByTestId('report-tile-p90_response')).toHaveTextContent('20.7')
  })
})

describe('מצבי-המעטפת ושכבת-ההטמעה', () => {
  it('כשל-רשת מציג מעטפת-תקלה עם "נסי שוב", והלחיצה קוראת שוב', async () => {
    callReport.mockRejectedValueOnce(new Error('network down'))
    renderTab(SURFACES.m14)
    expect(await screen.findByText('נסי שוב')).toBeInTheDocument()
    // 🔴 כשל **לעולם אינו** "אין נתונים" (§4.3 של מדריך-המיקרו).
    expect(screen.queryByTestId('report-tiles')).toBeNull()
    callReport.mockResolvedValueOnce(m14())
    fireEvent.click(screen.getByText('נסי שוב'))
    expect(await screen.findByTestId('report-tiles')).toBeInTheDocument()
    expect(callReport).toHaveBeenCalledTimes(2)
  })

  it('`meta.missing_params` מוצג בעברית, בשם הפרמטר', async () => {
    callReport.mockResolvedValue({
      ...m14(),
      meta: { ...m14().meta, missing_params: ['קבוע_ריסון_m'] },
    })
    renderTab(SURFACES.m14)
    expect(await screen.findByTestId('report-missing-params')).toHaveTextContent(
      'חסר פרמטר מערכת: קבוע_ריסון_m',
    )
  })

  it('טבלה בלי שורות — כפתור-הייצוא מנוטרל ואומר "אין שורות לייצא"', async () => {
    callReport.mockResolvedValue({ ...m14(), rows: [] })
    renderTab(SURFACES.m14)
    expect(await screen.findByTestId('reports-export-button')).toBeDisabled()
    expect(screen.getByTestId('reports-export-file')).toHaveTextContent('אין שורות לייצא')
  })

  it('מטען ריק לגמרי — מצב "ריק" ולא תקלה', async () => {
    callReport.mockResolvedValue(base({}))
    renderTab(SURFACES.m14)
    expect(await screen.findByTestId('report-hostess-overview-blank')).toBeInTheDocument()
  })

  it('מבחן-המחיקה: ברמה 0 כל הבסיס נשאר, ואף רמז אינו מרונדר', async () => {
    onboardingMode.value = 0
    callReport.mockResolvedValue(m14())
    renderTab(SURFACES.m14)
    expect(await screen.findByTestId('report-tiles')).toBeInTheDocument()
    expect(screen.getByTestId('report-population')).toBeInTheDocument()
    expect(screen.getByTestId('report-so-what')).toBeInTheDocument()
    expect(screen.getByTestId('report-definitions')).toBeInTheDocument()
    expect(screen.getByTestId('report-table-card')).toBeInTheDocument()
    expect(document.body.querySelectorAll('[data-testid^="hint-"]')).toHaveLength(0)
  })

  it('ברמה 2 הרמזים מרונדרים בארבע נקודות-ההרחבה', async () => {
    callReport.mockResolvedValue(m14())
    renderTab(SURFACES.m14)
    expect(await screen.findByTestId('hint-reports.hostessOverview.purpose')).toBeInTheDocument()
    expect(screen.getByTestId('hint-reports.hostessOverview.redCount')).toBeInTheDocument()
    expect(screen.getByTestId('hint-reports.hostessOverview.gini')).toBeInTheDocument()
    expect(screen.getByTestId('hint-reports.hostessOverview.redTableSort')).toBeInTheDocument()
    expect(screen.getByTestId('hint-reports.hostessOverview.term.onTime')).toBeInTheDocument()
  })
})

// 🔴 **הבדיקה שאין לה תחליף: מפתח-הטמעה שגוי מרנדר `null` בשקט בייצור** (`spec.md §🚫.5`).
// ⇒ הסריקה היא **על קבצי-המקור של הלשונית**, ולא על רשימה שהבדיקה מחזיקה בעצמה: רשימה
// כזו הייתה מאשרת את עצמה, ו-`<Hint id="…">` שנכתב אינליין באחד הקבצים היה חומק ממנה.
describe('שלמות מפתחות-ההטמעה', () => {
  const dir = path.resolve(process.cwd(), 'src/modules/11_reports/tabs')
  const files = [
    path.join(dir, 'HostessesTab.jsx'),
    ...readdirSync(path.join(dir, 'hostesses')).map((f) => path.join(dir, 'hostesses', f)),
  ]
  const used = new Set()
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/'(reports\.[A-Za-z0-9_.]+)'/g)) used.add(match[1])
  }

  it('כל מפתח שהלשונית משתמשת בו קיים בקובץ-הקופי ונושא `guided`', () => {
    expect(used.size).toBeGreaterThan(0)
    for (const key of used) {
      expect(M11_HOSTESSES_COPY[key], `מפתח חסר: ${key}`).toBeTruthy()
      expect(typeof M11_HOSTESSES_COPY[key].guided).toBe('string')
    }
  })

  it('אין מפתח בקובץ-הקופי שאיש אינו שותל — ו-38 הם כל מה ש-§⑩ מונה', () => {
    for (const key of Object.keys(M11_HOSTESSES_COPY)) {
      expect(used.has(key), `מפתח שאינו בשימוש: ${key}`).toBe(true)
    }
    expect(Object.keys(M11_HOSTESSES_COPY)).toHaveLength(38)
    expect(used.size).toBe(38)
  })

  it('אין `pointer` באף ערך — רק רמה 2 נכתבת (הכרעת-ישי)', () => {
    for (const entry of Object.values(M11_HOSTESSES_COPY)) {
      expect(entry.pointer).toBeUndefined()
    }
  })

  it('אף משפט אינו נושא ספירת-דאטה קשיחה (§5ג) — רק מספרים מבניים', () => {
    // ספירות-הדאטה שהוסרו מנוסחי §⑩, מילולית. ⚠️ **מבחן-נסיגה ולא קישוט:** זו בדיוק
    // הקבוצה שישי הורה להסיר 11/09, והיא חוזרת ברגע שמישהו "משלים" נוסח מהכרטיס.
    const bannedCounts = ['50 ', '186', '106', '95 ', '43.27', '44.00', '17 ', '87 ']
    for (const [key, entry] of Object.entries(M11_HOSTESSES_COPY)) {
      for (const banned of bannedCounts) {
        expect(entry.guided.includes(banned), `${key} נושא ספירת-דאטה: ${banned}`).toBe(false)
      }
    }
  })
})
