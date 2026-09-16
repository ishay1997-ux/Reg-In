// בדיקות לשונית **הנהלה** — ארבעת המשטחים (מ2 · מ3 · מ4 · מ6).
//
// 🔑 **מאיפה המספרים כאן:** ‏**מטענים חיים** שנמשכו מהמסד ב-16/09/2026 בזהות המנכ"ל
// (`scratchpad/results/payloads/report_m0*__exec_*.json`) — ולא מהכרטיס. ‏`cards-management.md`
// מתוארך ל-10/09/2026, והמסד זז מאז *(מ2: `n` 236⇒241 · הכנסה 1,922,441⇒1,962,981 ₪)*.
// ⇒ **הבדיקות נועלות את מה שהמסך באמת יקבל**; הפער מול הכרטיס מדווח ואינו "מתוקן" כאן.
//
// 🚫 **אין בקובץ הזה תווי-בידוד ליטרליים.** ‏`isolateLtr` מיובא ומרכיב את המצופה, בדיוק כפי
// שהמסך מרכיב אותו — תו בלתי-נראה שמודבק לתוך בדיקה הוא בדיוק המוקש של `src/lib/hostesses.js`.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const state = vi.hoisted(() => ({ mode: 2 }))

vi.mock('@/supabaseClient', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ onboardingMode: state.mode }) }))

// ⚠️ מוק-`recharts` שמחזיר אלמנטים אמיתיים (ולא `null`), כדי שאפשר יהיה לאמת **מה נמסר**
// לגרף — סוג-התרשים, מפתח-הציר וקווי-הייחוס. ‏jsdom אינו מודד SVG ולכן אין מה לצייר.
vi.mock('recharts', () => {
  const serializable = (value) => {
    try {
      JSON.stringify(value)
      return typeof value !== 'function' && !(value && value.$$typeof)
    } catch {
      return false
    }
  }
  const stub =
    (name) =>
    ({ children, ...props }) => (
      <div
        data-testid={`recharts-${name}`}
        data-props={JSON.stringify(
          Object.fromEntries(Object.entries(props).filter(([, v]) => serializable(v))),
        )}
      >
        {children}
      </div>
    )
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
  return Object.fromEntries(names.map((name) => [name, stub(name)]))
})

const callReport = vi.fn()
vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, callReport: (...args) => callReport(...args) }
})

import { isolateLtr } from '@/lib/reportsFormat'
import { M11_EXEC_COPY } from '@/lib/onboardingCopy.m11.exec'
import { REPORT_TABS } from '../reportsCatalog'
import ExecutiveTab from './ExecutiveTab'

const EXEC = REPORT_TABS.find((tab) => tab.key === 'exec')
const surfaceOf = (id) => EXEC.surfaces.find((s) => s.id === id)

const filters = {
  period: 'year',
  from: null,
  to: null,
  customerId: null,
  windowLabel: 'חלון',
  reloadTick: 0,
  isFiltered: false,
  clearFilters: vi.fn(),
}

function renderTab(id, { drill = null, onDrill = vi.fn() } = {}) {
  render(
    <MemoryRouter>
      <ExecutiveTab
        surface={surfaceOf(id)}
        filters={filters}
        drill={drill}
        onDrill={onDrill}
        onWindow={vi.fn()}
      />
    </MemoryRouter>,
  )
  return { onDrill }
}

// ── מטענים (מבנה C8, מספרים מהמסד החי 16/09/2026) ────────────────────────────

const base = (extra) => ({
  population: { n: 0, label: 'אוכלוסייה: כתוב כאן', excluded: {} },
  window: { from: null, to: '2026-09-16', label: 'חלון' },
  tiles: [],
  chart: null,
  columns: [],
  rows: [],
  so_what: null,
  definitions: null,
  drill: null,
  meta: { measured_at: null, missing_params: [], notes: [], row_total: null, run: null },
  ...extra,
})

const m2Payload = () =>
  base({
    population: {
      n: 241,
      label: 'אוכלוסייה: אירועים שכבר התקיימו וסגורים תפעולית · n=241',
      excluded: {},
    },
    window: { from: '2026-01-01', to: '2026-09-16', label: 'שנת 2026' },
    so_what: 'לשים לב שהצמיחה השנה לא באה על חשבון הרווח.',
    definitions: 'שולי-רווח = סך הרווח חלקי סך ההכנסה.',
    tiles: [
      {
        key: 'revenue',
        label: 'הכנסות מתחילת השנה',
        value: 1962981.47,
        format: 'money',
        sub: '241 אירועים שהסתיימו',
        window: 'חלון-האריח',
        target: { tab: 'הנהלה', report: 'report_m03_trends', drill: null },
        compare: {
          value: 1425658.65,
          label: '2025 באותו טווח',
          direction: 'up',
          note: '184 אירועים',
        },
      },
      {
        key: 'margin',
        label: 'שולי-רווח גולמי',
        value: 58.613608308793665,
        format: 'percent',
        sub: 'רווח מתוך הכנסה',
        window: 'חלון-האריח',
        target: { tab: 'הנהלה', report: 'report_m04_discounts', drill: null },
        compare: { value: 55.9443559648728, label: '2025 באותו טווח', direction: 'up', note: null },
      },
      {
        key: 'finished_events',
        label: 'אירועים שהסתיימו',
        value: 241,
        format: 'int',
        sub: 'ארבעת המצבים',
        window: 'חלון-האריח',
        target: { tab: 'כספים', report: 'report_m08_profitability', drill: null },
        compare: { value: 184, label: '2025 באותו טווח', direction: 'up', note: null },
      },
      {
        key: 'top5_share',
        label: 'נתח 5 הלקוחות הגדולים',
        value: 45.65447369246654,
        format: 'percent',
        sub: 'אצל 55 לקוחות עם הכנסה',
        window: 'כל הזמנים · אינו מושפע ממסנן התקופה',
        target: { tab: 'לקוחות', report: 'report_m21_drifting', drill: null },
        compare: {
          value: 47.53143924185967,
          label: 'לפני שנה, אותו חישוב',
          direction: 'down',
          note: null,
        },
      },
    ],
    chart: {
      type: 'bar',
      unit: 'money',
      xKey: 'label',
      title: 'הכנסה ורווח לפי חודש',
      domain: null,
      refLines: [],
      series: [
        { key: 'revenue_cur', label: 'הכנסה 2026', kind: 'bar', axis: 'left' },
        { key: 'revenue_prev', label: 'הכנסה 2025', kind: 'bar', axis: 'left' },
      ],
      data: [
        {
          month: '2026-08-01',
          label: 'אוגוסט',
          partial: false,
          revenue_cur: 141027.05,
          revenue_prev: 128867.79,
        },
        {
          month: '2026-09-01',
          label: 'ספטמבר',
          partial: true,
          revenue_cur: 143148.18,
          revenue_prev: 125103.84,
        },
      ],
    },
    columns: [
      { key: 'event_name', label: 'אירוע', format: 'text', align: 'start', sorted: null },
      { key: 'revenue', label: 'הכנסה', format: 'money', align: 'end', sorted: 'desc' },
    ],
    rows: [
      {
        event_name: 'כנס חינוך שנתי',
        revenue: 18692,
        project_id: 1395,
        drill_key: { kind: 'project', id: 1395 },
      },
    ],
    meta: { measured_at: null, missing_params: [], notes: [], row_total: 241, run: null },
  })

const m3Root = () =>
  base({
    population: { n: 736, label: 'אוכלוסייה: כל השנים · n=736', excluded: {} },
    so_what:
      'לשים לב שהמחיר לשעה עלה מהר מהעלות — מ-260 ₪ ל-305 ₪ לשעה, מול עלייה מ-46 ₪ ל-47 ₪ בעלות; זו הסיבה ששולי-הרווח עמדו על 58.6%.',
    tiles: [
      {
        key: 'price_per_hour',
        label: 'מחיר לשעה',
        value: 305.11874873707933,
        format: 'money',
        sub: 'לפי שעות-בפועל',
        window: 'שנת 2026',
        target: null,
        compare: { value: 259.7790478394169, label: '2025', direction: 'up', note: null },
      },
    ],
    chart: [
      {
        type: 'bar',
        unit: '₪',
        xKey: 'year',
        title: 'הכנסה, רווח ושולי-רווח לפי שנה',
        domain: null,
        refLines: [],
        series: [
          { key: 'revenue', label: 'הכנסה', kind: 'bar', axis: 'left' },
          { key: 'profit', label: 'רווח גולמי', kind: 'bar', axis: 'left' },
          { key: 'margin', label: 'שולי-רווח', kind: 'line', axis: 'right' },
        ],
        data: [
          {
            year: 2024,
            revenue: 1625646.64,
            profit: 892706.34,
            margin: 54.91392274522833,
            partial: false,
          },
          {
            year: 2026,
            revenue: 1962981.47,
            profit: 1150574.27,
            margin: 58.613608308793665,
            partial: true,
          },
        ],
      },
      // ✏️ **נמדד חי 16/09 20:2X, אחרי שמיגרציית `i2` נחתה** — הלוח המשולב פוצל לשני
      // לוחות **מאפסים** (⑧ 3.1), ו**לוח-העלות הוא האחרון**. 🔑 זה מה שהופך את עוגן
      // ה-`costPerHour` (*"הגרף האחרון"*) לנכון, וזו הייתה נקודת-העיוורון המוצהרת של
      // הסבב הקודם: הפיקסצ'ר היה פיצול שבניתי ביד, והכותרות כאן מועתקות מהמטען.
      {
        type: 'line',
        unit: 'money',
        xKey: 'year',
        title: 'מחיר לשעה ומרווח לשעה, לפי שנה',
        domain: null,
        refLines: [],
        series: [
          {
            key: 'price_per_hour',
            label: 'מחיר לשעה',
            format: 'money',
            kind: 'line',
            axis: 'left',
          },
          {
            key: 'margin_per_hour',
            label: 'מרווח לשעה',
            format: 'money',
            kind: 'line',
            axis: 'left',
          },
        ],
        data: [
          { year: 2024, price_per_hour: 253.67, margin_per_hour: 209.48, partial: false },
          { year: 2026, price_per_hour: 305.12, margin_per_hour: 257.75, partial: true },
        ],
      },
      {
        type: 'line',
        unit: 'money',
        xKey: 'year',
        title: 'עלות לשעה, לפי שנה',
        domain: null,
        refLines: [],
        series: [
          { key: 'cost_per_hour', label: 'עלות לשעה', format: 'money', kind: 'line', axis: 'left' },
        ],
        data: [
          { year: 2024, cost_per_hour: 44.19, partial: false },
          { year: 2026, cost_per_hour: 47.37, partial: true },
        ],
      },
    ],
    columns: [
      // ✏️ ‏`text` ולא `int` — ‏i1 תיקנה זאת בשרת אחרי שנמדד על המסך `2,024` (📐4 שם
      // מפריד-אלפים בכל `int`). הפיקסצ'ר עוקב אחרי המטען החי, ולא להפך.
      { key: 'year', label: 'שנה', format: 'text', align: 'start', sorted: 'asc' },
      { key: 'revenue', label: 'הכנסה', format: 'money', align: 'end', sorted: null },
    ],
    rows: [{ year: 2024, revenue: 1625646.64, drill_key: { kind: 'year', year: 2024 } }],
    drill: {
      level: 0,
      levels: ['כל השנים', 'שנה', 'חודש'],
      crumbs: [{ label: 'כל השנים', drill: null }],
      echo: null,
    },
    meta: { measured_at: null, missing_params: [], notes: [], row_total: 3, run: null },
  })

// רמה 1 — חודשי ⁦2026⁩, ובהם ספטמבר החלקי. מבנה מהמטען החי (16/09 18:3X).
const m3Year = () =>
  base({
    population: { n: 241, label: 'אוכלוסייה: ⁦2026⁩', excluded: {} },
    so_what: 'לשים לב ששולי-הרווח עמדו על 58.6%.',
    tiles: [
      {
        key: 'revenue',
        label: 'הכנסה בשנה',
        value: 1962981.47,
        format: 'money',
        sub: null,
        window: 'שנת 2026',
        target: null,
        compare: null,
      },
    ],
    chart: {
      type: 'bar',
      unit: 'money',
      xKey: 'label',
      title: 'הכנסה ורווח לפי חודש',
      domain: null,
      refLines: [],
      series: [
        { key: 'revenue', label: 'הכנסה', format: 'money', kind: 'bar', axis: 'left' },
        { key: 'profit', label: 'רווח גולמי', format: 'money', kind: 'bar', axis: 'left' },
      ],
      data: [
        { label: 'אוגוסט', month: 8, revenue: 141027.05, profit: 82038.75, partial: false },
        { label: 'ספטמבר', month: 9, revenue: 143148.18, profit: 106247.18, partial: true },
      ],
    },
    columns: [
      { key: 'label', label: 'חודש', format: 'text', align: 'start', sorted: 'asc' },
      { key: 'revenue', label: 'הכנסה', format: 'money', align: 'end', sorted: null },
    ],
    rows: [
      { label: 'ינואר', revenue: 237414.51, drill_key: { kind: 'month', year: 2026, month: 1 } },
    ],
    drill: {
      level: 1,
      levels: ['כל השנים', 'שנה', 'חודש'],
      crumbs: [
        { label: 'כל השנים', drill: null },
        { label: '2026', drill: { year: 2026 } },
      ],
      echo: { year: 2026 },
    },
    meta: { measured_at: null, missing_params: [], notes: [], row_total: 9, run: null },
  })

const m3Month = () =>
  base({
    population: { n: 35, label: 'אוכלוסייה: פברואר 2026', excluded: {} },
    so_what: 'לשים לב ששולי-הרווח בפברואר עמדו על 57.1%.',
    tiles: [
      {
        key: 'revenue',
        label: 'הכנסה בחודש',
        value: 325119.19,
        format: 'money',
        sub: null,
        window: 'פברואר 2026',
        target: null,
        compare: null,
      },
    ],
    columns: [
      { key: 'event_name', label: 'אירוע', format: 'text', align: 'start', sorted: null },
      { key: 'revenue', label: 'הכנסה', format: 'money', align: 'end', sorted: 'desc' },
    ],
    rows: [
      { event_name: 'כנס חינוך שנתי', revenue: 18692, drill_key: { kind: 'project', id: 1395 } },
    ],
    drill: {
      level: 2,
      levels: ['כל השנים', 'שנה', 'חודש'],
      crumbs: [
        { label: 'כל השנים', drill: null },
        { label: '2026', drill: { year: 2026 } },
        { label: 'פברואר 2026', drill: { year: 2026, month: 2 } },
      ],
      echo: { year: 2026, month: 2 },
    },
    meta: { measured_at: null, missing_params: [], notes: [], row_total: 35, run: null },
  })

const m4Payload = (extra = {}) =>
  base({
    population: { n: 736, label: 'שתי אוכלוסיות שונות בדף אחד · n=736', excluded: {} },
    so_what: 'לשים לב שכל מדרג-הנחה עמוק יותר מוריד את שולי-הרווח.',
    tiles: [
      {
        key: 'approval_rate',
        label: 'שיעור אישור הצעות',
        value: 71.26760563380282,
        format: 'percent',
        sub: '253 אושרו מתוך 355 שהוכרעו השנה',
        window: 'חלון-האריח',
        target: null,
        compare: {
          value: 73.2394366197183,
          label: '2025 באותו טווח',
          direction: 'down',
          note: null,
        },
      },
    ],
    chart: {
      type: 'bar',
      unit: '%',
      xKey: 'tier',
      title: 'שולי-רווח לפי מדרג-הנחה',
      domain: [0, 100],
      refLines: [],
      series: [{ key: 'margin', label: 'שולי-רווח', kind: 'bar', axis: 'left' }],
      data: [
        { tier: '0', label: '0%', margin: 57.76, event_count: 305 },
        { tier: '1-5', label: '1–5%', margin: 56.83, event_count: 270 },
        { tier: '6-10', label: '6–10%', margin: 54.65, event_count: 110 },
        { tier: '10+', label: '10%+ (פתוח)', margin: 50.69, event_count: 51 },
      ],
    },
    columns: [
      { key: 'quote_id', label: 'הצעה', format: 'int', align: 'start', sorted: null },
      { key: 'discount', label: 'הנחה', format: 'percent', align: 'end', sorted: 'desc' },
    ],
    rows: [{ quote_id: 1907, discount: 22, tier: '10+', drill_key: { kind: 'quote', id: 1907 } }],
    meta: { measured_at: null, missing_params: [], notes: [], row_total: 736, run: null },
    ...extra,
  })

const m6Payload = (extra = {}) =>
  base({
    population: { n: 717, label: 'אוכלוסייה: n=717 מתוך 736', excluded: {} },
    so_what: 'לשים לב שהאיוש בפועל נדיב מהתכנון ולא הפוך.',
    tiles: [
      {
        key: 'median_ratio',
        label: 'יחס חציוני: אורחים לדיילת',
        value: 40.8,
        format: 'ratio',
        sub: 'נמדד על 717 אירועים',
        window: 'כל הזמנים',
        target: null,
        compare: { value: 41.1, label: 'לפני שנה, אותו חישוב', direction: 'down', note: null },
      },
    ],
    chart: [
      {
        type: 'scatter',
        unit: 'אורחים',
        xKey: 'estimated',
        title: 'אורחים שהוערכו מול אורחים שהגיעו',
        domain: null,
        refLines: [{ axis: 'diagonal', label: 'ההערכה התקיימה בדיוק', value: 1 }],
        // ✏️ זוג-סדרות, כפי ש-`d2` מחזיר; הנפילה-לאחור לסדרה בודדת נבדקת בנפרד למטה.
        series: [
          {
            key: 'estimated',
            label: 'אורחים שהוערכו',
            format: 'int',
            kind: 'scatter',
            axis: 'left',
          },
          { key: 'actual', label: 'אורחים שהגיעו', format: 'int', kind: 'scatter', axis: 'left' },
        ],
        data: [
          { estimated: 40, actual: 35, ratio: 35, project_id: 830 },
          { estimated: 50, actual: 520, ratio: 52, project_id: 12 },
        ],
      },
      {
        type: 'histogram',
        unit: 'אירועים',
        xKey: 'label',
        title: 'התפלגות היחס',
        domain: null,
        refLines: [{ axis: 'x', label: 'פרמטר-תכנון — לא יעד', value: 50 }],
        series: [{ key: 'count', label: 'אירועים', kind: 'bar', axis: 'left' }],
        data: [
          { bucket: '45-50', label: '45–50', count: 148 },
          { bucket: '50-55', label: '50–55', count: 28 },
        ],
      },
    ],
    columns: [
      { key: 'event_name', label: 'אירוע', format: 'text', align: 'start', sorted: null },
      { key: 'estimated', label: 'הוערכו', format: 'int', align: 'end', sorted: null },
      { key: 'gap', label: 'פער', format: 'int', align: 'end', sorted: 'desc' },
    ],
    rows: [
      {
        event_name: 'כנס משקיעים שנתי',
        estimated: 50,
        gap: 50,
        drill_key: { kind: 'project', id: 12 },
      },
    ],
    meta: { measured_at: null, missing_params: [], notes: [], row_total: 135, run: null },
    ...extra,
  })

// 🔑 **מיקום ולא רק קיום.** ‏§⑩ עוגן כל רמז לאלמנט שהוא מסביר, וקיום לבדו עובר גם כשהרמז
// נחת בתחתית הדף. ‏`compareDocumentPosition` הוא המבחן שמפריד בין השניים:
// ‏`DOCUMENT_POSITION_FOLLOWING` (‏4) = `b` מגיע **אחרי** `a` בסדר-המסמך.
const comesBefore = (a, b) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

// 🔑 **גבול-הבדיקה: מה ש*הלשונית* מבטיחה הוא הארגומנט הראשון — מפתח-הקידוח של השורה.**
// ‏`ReportSurface` מוסיף לו ארגומנטים משלו (השורה עצמה, ומאז 16/09 19:0X גם `'level'`),
// והם חוזה של השלד ומשתנים איתו. ‏`toHaveBeenCalledWith` דורש התאמת-אריות מלאה ולכן
// היה צובע אדום כל פעם שהשלד מוסיף ארגומנט — כשל-שווא שאינו אומר דבר על הלשונית.
const firstDrillArg = (onDrill) => onDrill.mock.calls[0]?.[0]

const chartProps = (name) =>
  screen.getAllByTestId(`recharts-${name}`).map((node) => JSON.parse(node.dataset.props))

beforeEach(() => {
  state.mode = 2
  callReport.mockReset()
})

// ── מ2 · מבט-על הנהלה ────────────────────────────────────────────────────────

describe('מ2 · מבט-על הנהלה', () => {
  it('מצייר את ארבע התוויות של §1.4, את הערכים המעוצבים ואת שורות-הבסיס', async () => {
    callReport.mockResolvedValueOnce(m2Payload())
    renderTab('מ2')

    expect(await screen.findByText('הכנסות מתחילת השנה')).toBeInTheDocument()
    for (const label of ['שולי-רווח גולמי', 'אירועים שהסתיימו', 'נתח 5 הלקוחות הגדולים']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    // 📐4 — ₪ בלי אגורות · אחוז בספרה אחת, שניהם מבודדים.
    expect(screen.getByText(isolateLtr('1,962,981 ₪'))).toBeInTheDocument()
    expect(screen.getByText(isolateLtr('58.6%'))).toBeInTheDocument()
    // 📑ב — `tiles[].sub` מרונדר **פעם אחת**, ע"י `KpiTile` (GAP 1 של השכבה המשותפת).
    // ⚠️ ‏`compare.note` עדיין אינו מרונדר ע"י אף רכיב — ר' הדיווח; הבדיקה אינה מתחזה לכך שכן.
    expect(screen.getAllByTestId('kpi-sub')).toHaveLength(4)
    expect(screen.getByText('241 אירועים שהסתיימו')).toBeInTheDocument()
    // 📐4 — חצי-ההשוואה מעוצב כמו האריח, ולא נשפך כמספר גולמי (נמדד כפגם 16/09).
    expect(screen.getByText(isolateLtr('1,425,659 ₪'))).toBeInTheDocument()
    expect(screen.getByText(isolateLtr('55.9%'))).toBeInTheDocument()
    // 📐2 · 📐23 · 📐16 — בסיס, ולא שכבה.
    expect(screen.getByTestId('report-population')).toHaveTextContent('n=241')
    expect(screen.getByTestId('report-so-what')).toBeInTheDocument()
    expect(screen.getByTestId('report-definitions')).toBeInTheDocument()
  })

  it('📐20 — החודש החלקי מצהיר על אורכו בתווית ובהערת-הגרף, ו-📐8 מצהיר על תקרת-השורות', async () => {
    callReport.mockResolvedValueOnce(m2Payload())
    renderTab('מ2')

    expect(await screen.findByTestId('chart-note')).toHaveTextContent(
      `מכסה ${isolateLtr('16')} ימים ולא חודש שלם`,
    )
    // 📐20 ① — הערוץ שהשכבה המשותפת פתחה: העמודה החלקית מסומנת `is_today`.
    expect(chartProps('Cell').some((props) => props.strokeDasharray)).toBe(true)
    // ציר-הקטגוריה עבר ל-`label`, והתווית החלקית נושאת את אורך-החלון.
    expect(chartProps('XAxis')[0].dataKey).toBe('label')
    expect(screen.getByText(`ספטמבר (${isolateLtr('16')} ימים)`)).toBeInTheDocument()
    // §9 D-25 — שורה אחת, בנוסח של השלד המשותף.
    expect(screen.getAllByTestId('report-row-cap')).toHaveLength(1)
    expect(screen.getByTestId('report-row-cap')).toHaveTextContent(
      `מוצגות ${isolateLtr('1')} מתוך ${isolateLtr('241')} שורות`,
    )
  })

  it('הכרעה 19 — לחיצה על שורה פותחת את כרטיס-האירוע, והשורה כולה היא הדלת', async () => {
    callReport.mockResolvedValueOnce(m2Payload())
    const { onDrill } = renderTab('מ2')

    const row = (await screen.findByText('כנס חינוך שנתי')).closest('tr')
    expect(row).toHaveAttribute('role', 'button')
    fireEvent.click(row)
    expect(firstDrillArg(onDrill)).toEqual({ kind: 'project', id: 1395 })
    expect(screen.getByTestId('report-row-action')).toHaveTextContent(
      'לחיצה על שורה פותחת את כרטיס האירוע',
    )
  })

  it('הכרעה 33 — אריח-מבט-על מוסר את היעד לנתב-הדלתות של המעטפת, בלי לכתוב לכתובת בעצמו', async () => {
    callReport.mockResolvedValueOnce(m2Payload())
    const { onDrill } = renderTab('מ2')

    fireEvent.click(await screen.findByTestId('report-tile-link-finished_events'))
    expect(onDrill).toHaveBeenCalledWith({
      tab: 'כספים',
      report: 'report_m08_profitability',
      drill: null,
    })
  })

  it('הקישור "כל השנים" נוסע באותו נתב-דלתות, ולא בניווט שני', async () => {
    callReport.mockResolvedValueOnce(m2Payload())
    const { onDrill } = renderTab('מ2')

    fireEvent.click(await screen.findByTestId('exec-overview-trends-link'))
    expect(onDrill).toHaveBeenCalledWith({
      tab: 'הנהלה',
      report: 'report_m03_trends',
      drill: null,
    })
  })
})

// ── מ3 · מגמות רב-שנתיות ─────────────────────────────────────────────────────

describe('מ3 · מגמות רב-שנתיות', () => {
  it('גרף-השנים מצויר ע"י `ComposedBody` — שתי עמודות-₪ וקו-אחוזים על ציר ימני נעול', async () => {
    callReport.mockResolvedValueOnce(m3Root())
    renderTab('מ3')

    await screen.findAllByText('מחיר לשעה')
    // 🔴 הרגרסיה שהבדיקה הזו שומרת עליה: עד 16/09 הלשונית המירה את הגרף ל-`pareto`
    // **ואיבדה את עמודת-הרווח**. שלוש הסדרות מצוירות עכשיו, ואף אחת אינה נופלת.
    expect(screen.getAllByTestId('recharts-ComposedChart')).toHaveLength(1)
    expect(chartProps('Bar').map((props) => props.dataKey)).toEqual(['revenue', 'profit'])
    expect(chartProps('Line').map((props) => props.dataKey)).toContain('margin')
    const right = chartProps('YAxis').find((props) => props.yAxisId === 'right')
    expect(right.domain).toEqual([0, 100])
    const left = chartProps('YAxis').find((props) => props.yAxisId === 'left')
    expect(left.domain).toEqual([0, 'auto'])
  })

  it('📐20 — השנה החלקית מוצהרת בשלושת הערוצים: עמודה מקווקוות · תווית-ציר · הערת-גרף', async () => {
    callReport.mockResolvedValueOnce(m3Root())
    renderTab('מ3')
    await screen.findAllByText('מחיר לשעה')

    // ① הצורה — `is_today` על השורה החלקית בלבד, ובלי לשנות גוון (📐19).
    // **עמודה אחת מקווקוות בכל סדרת-עמודות**, כלומר כל הסדרות של אותה שנה מסומנות יחד
    // (זה מה שממצא #5 דרש למ2, והשלד מיישם אותו לכל הסדרות).
    const dashed = chartProps('Cell').filter((props) => props.strokeDasharray)
    expect(dashed).toHaveLength(chartProps('Bar').length)
    expect(dashed.length).toBeGreaterThan(0)
    // ② התווית — אורך-החלון על הציר, בנוסח המוקאפ המאושר (שורה 628).
    expect(chartProps('XAxis')[0].dataKey).toBe('label')
    expect(screen.getAllByText(`2026 — עד ${isolateLtr('16/09')}`).length).toBeGreaterThan(0)
    // ③ המילים — בתוך כרטיס-הגרף, שם `.chart-note` יושב במוקאפ.
    const note = screen.getAllByTestId('chart-note')[0]
    expect(note).toHaveTextContent('אין כאן «קצב שנתי» משוער')
    expect(note).toHaveTextContent('מסומנת בדפוס מקווקו')
  })

  it('ברמת-החודשים אותה הצהרה נמדדת בימים, ולא בשנה', async () => {
    callReport.mockResolvedValueOnce(m3Year())
    renderTab('מ3', { drill: { year: 2026 } })
    await screen.findByTestId('report-population')

    expect(await screen.findByTestId('chart-note')).toHaveTextContent(
      `מכסה ${isolateLtr('16')} ימים ולא חודש שלם`,
    )
    expect(screen.getByText(`ספטמבר (${isolateLtr('16')} ימים)`)).toBeInTheDocument()
    const dashedMonths = chartProps('Cell').filter((props) => props.strokeDasharray)
    expect(dashedMonths).toHaveLength(chartProps('Bar').length)
    expect(dashedMonths.length).toBeGreaterThan(0)
  })

  it('📐13 — שורת-הפעולה משתנה עם הרמה, והשורה יורדת רמה', async () => {
    callReport.mockResolvedValueOnce(m3Root())
    const { onDrill } = renderTab('מ3')

    expect(await screen.findByTestId('report-row-action')).toHaveTextContent(
      'לחיצה על שורה יורדת לחודשים של אותה שנה',
    )
    fireEvent.click(screen.getByText('שנה').closest('table').querySelector('tbody tr'))
    expect(firstDrillArg(onDrill)).toEqual({ kind: 'year', year: 2024 })
  })

  it('ברמה האחרונה יש פירורים, אין גרף, והשורה פותחת את כרטיס-האירוע', async () => {
    callReport.mockResolvedValueOnce(m3Month())
    const { onDrill } = renderTab('מ3', { drill: { year: 2026, month: 2 } })

    expect(await screen.findByTestId('report-crumbs')).toHaveTextContent('כל השנים')
    expect(screen.getByTestId('report-row-action')).toHaveTextContent('זו הרמה האחרונה')
    expect(screen.queryByTestId('recharts-ComposedChart')).toBeNull()
    fireEvent.click(screen.getByText('כנס חינוך שנתי').closest('tr'))
    expect(firstDrillArg(onDrill)).toEqual({ kind: 'project', id: 1395 })
  })
})

// ── מ4 · הנחות ורווחיות ──────────────────────────────────────────────────────

describe('מ4 · הנחות ורווחיות', () => {
  it('הכרעה 39 — ארבעת המדרגים כשבבים, כל אחד עם ה-`n` שלו', async () => {
    callReport.mockResolvedValueOnce(m4Payload())
    renderTab('מ4')

    const chips = within(await screen.findByTestId('discount-tier-chips'))
    expect(chips.getAllByRole('button')).toHaveLength(4)
    const expected = [
      ['0', '0%', '305'],
      ['1-5', '1–5%', '270'],
      ['6-10', '6–10%', '110'],
      ['10+', '10%+ (פתוח)', '51'],
    ]
    for (const [tier, label, count] of expected) {
      expect(screen.getByTestId(`discount-tier-${tier}`)).toHaveTextContent(
        `${label} · ${isolateLtr(count)}`,
      )
    }
  })

  it('בחירת מדרג נכתבת לכתובת, לחיצה חוזרת מבטלת, וההכרזה קיימת מראש', async () => {
    callReport.mockResolvedValueOnce(m4Payload())
    const { onDrill } = renderTab('מ4')

    expect(await screen.findByTestId('discount-tier-announce')).toHaveTextContent('')
    fireEvent.click(screen.getByTestId('discount-tier-6-10'))
    expect(onDrill).toHaveBeenCalledWith({ tier: '6-10' })
  })

  it('מדרג נבחר — השבב לחוץ, ההכרזה אומרת כמה שורות, ו"נקי בחירה" מנקה', async () => {
    callReport.mockResolvedValueOnce(
      m4Payload({ meta: { row_total: 110, notes: [], missing_params: [] } }),
    )
    const { onDrill } = renderTab('מ4', { drill: { tier: '6-10' } })

    const chip = await screen.findByTestId('discount-tier-6-10')
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('discount-tier-announce')).toHaveTextContent('מסונן למדרג 6–10%')
    fireEvent.click(screen.getByTestId('discount-tier-clear'))
    expect(onDrill).toHaveBeenCalledWith(null)
  })

  it('שורה פותחת את הצעת-המחיר, וייצוא בלי שורות מנוטרל עם הנוסח הנעול', async () => {
    callReport.mockResolvedValueOnce(m4Payload({ rows: [] }))
    renderTab('מ4')

    expect(await screen.findByTestId('reports-export-button')).toBeDisabled()
    expect(screen.getByTestId('reports-export-file')).toHaveTextContent('אין שורות לייצא')

    callReport.mockResolvedValueOnce(m4Payload())
    const { onDrill } = renderTab('מ4')
    // ✏️ 17/09/2026 — מזהה-הצעה מרונדר כמזהה (format:'id' — ספרות בלי מפריד-אלפים), לא ככמות.
    const rows = await screen.findAllByText(isolateLtr('1907'))
    fireEvent.click(rows[0].closest('tr'))
    expect(firstDrillArg(onDrill)).toEqual({ kind: 'quote', id: 1907 })
  })

  it('הקרוס-פילטר האוטומטי כבוי במפורש — הסינון של מ4 רץ בשרת, ולא פעמיים', async () => {
    callReport.mockResolvedValueOnce(m4Payload())
    renderTab('מ4')

    await screen.findByTestId('discount-tier-chips')
    // ‏`ReportSurface` מוסר `onSelect` לגרף **רק** כשיש מפתח-סינון; `filter_key:false` מכבה.
    expect(chartProps('Bar').every((props) => props.cursor === undefined)).toBe(true)
    expect(screen.queryByTestId('report-clear-crossfilter')).toBeNull()
  })
})

// ── מ6 · קהל מול צוות ────────────────────────────────────────────────────────

describe('מ6 · קהל מול צוות', () => {
  it('הפיזור מקבל את שני הצירים, והאלכסון נמתח על טווח-הדאטה', async () => {
    callReport.mockResolvedValueOnce(m6Payload())
    renderTab('מ6')

    await screen.findByText('יחס חציוני: אורחים לדיילת')
    const axes = chartProps('XAxis')
    expect(axes.some((props) => props.dataKey === 'estimated' && props.type === 'number')).toBe(
      true,
    )
    expect(chartProps('YAxis').some((props) => props.dataKey === 'actual')).toBe(true)
    const diagonal = chartProps('ReferenceLine').find((props) => Array.isArray(props.segment))
    expect(diagonal.segment).toEqual([
      { x: 0, y: 0 },
      { x: 520, y: 520 },
    ])
  })

  it('📑ב#10 — הסטייה מקודדת בצורה (משולש / עיגול-חלול) ולא בגודל ולא בגוון', async () => {
    callReport.mockResolvedValueOnce(m6Payload())
    renderTab('מ6')

    await screen.findByText('יחס חציוני: אורחים לדיילת')
    const shapes = chartProps('Scatter').map((props) => props.shape)
    expect(shapes).toEqual(['triangle', 'circle'])
    // עיגול **חלול**: מתאר בלבד. ‏`fill:'none'` הוא ההבחנה, ולא גוון שני (📐19).
    expect(chartProps('Scatter').find((props) => props.shape === 'circle').fill).toBe('none')
    const legend = screen.getByTestId('chart-shape-legend')
    expect(legend).toHaveTextContent('הגיעו יותר אורחים מהצפי')
    expect(legend).toHaveTextContent('הגיעו כמו הצפי או פחות')
  })

  it('אין במ6 סינון-צולב — הכרטיס מתעד זאת, והכיבוי מפורש', async () => {
    callReport.mockResolvedValueOnce(m6Payload())
    renderTab('מ6')

    await screen.findByText('יחס חציוני: אורחים לדיילת')
    expect(chartProps('Scatter').every((props) => props.cursor === undefined)).toBe(true)
    expect(screen.queryByTestId('report-clear-crossfilter')).toBeNull()
  })

  it('קו-הפרמטר ממופה לדלי שלו, והמשפט "אינו יעד" נשאר בבסיס', async () => {
    callReport.mockResolvedValueOnce(m6Payload())
    renderTab('מ6')

    await screen.findByText('יחס חציוני: אורחים לדיילת')
    const categoryLine = chartProps('ReferenceLine').find((props) => props.x !== undefined)
    expect(categoryLine.x).toBe('50–55')
    expect(screen.getByTestId('report-not-a-target')).toHaveTextContent(
      'פרמטר-התכנון אינו יעד ואינו סף',
    )
  })

  it('§7.83 — פרמטר חסר מוצהר על המסך ואינו הופך לאפס שקט', async () => {
    callReport.mockResolvedValueOnce(
      m6Payload({
        meta: { missing_params: ['יחס_אורחים_לדיילת'], notes: [], row_total: 135 },
      }),
    )
    renderTab('מ6')

    expect(await screen.findByTestId('report-missing-params')).toHaveTextContent(
      'חסר פרמטר מערכת: יחס_אורחים_לדיילת',
    )
  })
})

// ── מצבי-מעטפת ושכבת-ההטמעה ──────────────────────────────────────────────────

describe('מצבים ושכבת-הטמעה', () => {
  it('תקלת-רשת מציגה מעטפת-שגיאה עם "נסי שוב", והלחיצה טוענת מחדש', async () => {
    callReport.mockRejectedValueOnce(new Error('boom'))
    renderTab('מ2')

    const retry = await screen.findByRole('button', { name: 'נסי שוב' })
    expect(screen.queryByTestId('report-population')).toBeNull()
    callReport.mockResolvedValueOnce(m2Payload())
    fireEvent.click(retry)
    expect(await screen.findByTestId('report-population')).toBeInTheDocument()
    expect(callReport).toHaveBeenCalledTimes(2)
  })

  it('מטען ריק לגמרי מציג "אין נתונים עדיין" ולא מסך-שגיאה', async () => {
    callReport.mockResolvedValueOnce(base())
    renderTab('מ4')

    expect(await screen.findByText('אין נתונים עדיין')).toBeInTheDocument()
  })

  it('רמה 2 מציגה את כל רמזי §⑩ של המשטח', async () => {
    callReport.mockResolvedValueOnce(m2Payload())
    renderTab('מ2')

    await screen.findByTestId('hint-reports.execOverview.purpose')
    for (const key of ['revenueBasis', 'top5Share', 'topEventsSort']) {
      expect(screen.getByTestId(`hint-reports.execOverview.${key}`)).toBeInTheDocument()
    }
  })

  it('מבחן-המחיקה — ברמה 0 אין אף רמז, וכל הבסיס עדיין על המסך', async () => {
    state.mode = 0
    callReport.mockResolvedValueOnce(m2Payload())
    renderTab('מ2')

    expect(await screen.findByTestId('report-population')).toBeInTheDocument()
    expect(screen.queryByTestId('hint-reports.execOverview.purpose')).toBeNull()
    expect(screen.getByTestId('report-so-what')).toBeInTheDocument()
    expect(screen.getByTestId('report-definitions')).toBeInTheDocument()
    expect(screen.getByTestId('report-tiles')).toBeInTheDocument()
    expect(screen.getByTestId('report-table-card')).toBeInTheDocument()
    expect(screen.getByTestId('report-row-action')).toBeInTheDocument()
  })

  it('🔴 הרמזים יושבים במקום שהכרטיס עיגן בו — מיקום, לא רק קיום', async () => {
    callReport.mockResolvedValueOnce(m2Payload())
    renderTab('מ2')
    await screen.findByTestId('report-population')

    const purpose = screen.getByTestId('hint-reports.execOverview.purpose')
    const population = screen.getByTestId('report-population')
    const soWhat = screen.getByTestId('report-so-what')
    const tiles = screen.getByTestId('report-tiles')
    const revenueHint = screen.getByTestId('hint-reports.execOverview.revenueBasis')
    const top5Hint = screen.getByTestId('hint-reports.execOverview.top5Share')
    const chart = screen.getByTestId('chart-figure')
    const tableHint = screen.getByTestId('hint-reports.execOverview.topEventsSort')
    const table = screen.getByTestId('report-table-card')

    // ⑩ א — רמז-המטרה יושב **בין שורת-"אז מה" לרצועת-האריחים**, בדיוק כפי שהכרטיס מעגן
    // אותו (*"מתחת ל-.so-what, מעל .tiles"*) ובדיוק כפי שנמדד במוקאפ (470 < 476 < 482).
    // 🔴 עד 16/09 19:0X הוא ישב ב-`renderTop`, כלומר מעל שורת-האוכלוסייה — הבדיקה הזו
    // היא מה שתפס את המעבר, ולא קריאה חוזרת.
    expect(comesBefore(population, purpose)).toBe(true)
    expect(comesBefore(soWhat, purpose)).toBe(true)
    expect(comesBefore(purpose, tiles)).toBe(true)
    // ⑩ ב · ג — שני רמזי-האריחים **מתחת לרצועת-האריחים ולפני הגרף** (§4ב: שורה עצמאית
    // מתחת לבלוק שהיא מסבירה, לעולם לא ילד של אריח).
    expect(comesBefore(tiles, revenueHint)).toBe(true)
    expect(comesBefore(revenueHint, top5Hint)).toBe(true)
    expect(comesBefore(top5Hint, chart)).toBe(true)
    // ⑩ ד — רמז-הטבלה מעל כרטיס-הטבלה, אחרי הגרף.
    expect(comesBefore(chart, tableHint)).toBe(true)
    expect(comesBefore(tableHint, table)).toBe(true)
    // 🚫 ואף רמז אינו **בתוך** אריח — הדפוס שהכרטיס מדד כמתיחת-רצועה ל-373px.
    expect(tiles.querySelector('[data-testid^="hint-"]')).toBeNull()
  })

  it('🔴 רמזי-הגרף יושבים בכרטיס שהם מסבירים — וה-`barkey` על לוח-העלות, האחרון', async () => {
    // 🪤 **הרגרסיה שהבדיקה נועלת:** ‏`i2` פיצלה את לוח מחיר/עלות לשני לוחות מאפסים
    // (⁦2⁩ גרפים ⇐ ⁦3⁩). אינדקס קשיח `=== 1` היה מצמיד את רמז-ה-`barkey` ללוח **המחיר**
    // בעוד הוא מסביר את ה**עלות**; במוקאפ ה-`.barkey` יושב אחרי שני הלוחות (שורות 708–713),
    // ולכן העוגן הוא "הגרף האחרון".
    // ✅ **והפיקסצ'ר הוא המטען החי** (נמדד 16/09 20:2X, אחרי ש-i2 נחתה) ולא פיצול שבניתי
    // ביד — זו בדיוק נקודת-העיוורון שהסבב הקודם הצהיר עליה: סדר-הלוחות הוא של השרת,
    // ולוח-העלות הוא **האחרון** בפועל.
    callReport.mockResolvedValueOnce(m3Root())
    renderTab('מ3')
    await screen.findAllByText('מחיר לשעה')

    const cards = screen.getAllByTestId(/^chart-card-/)
    expect(cards).toHaveLength(3)
    expect(cards.map((card) => card.querySelector('h3')?.textContent)).toEqual([
      'הכנסה, רווח ושולי-רווח לפי שנה',
      'מחיר לשעה ומרווח לשעה, לפי שנה',
      'עלות לשעה, לפי שנה',
    ])
    // ⑩ ב — הערת-גרף-השנים ⇒ הכרטיס הראשון.
    expect(cards[0].querySelector('[data-testid="hint-reports.trends.partialYear"]')).not.toBeNull()
    // ⑩ ג — ה-`barkey` ⇒ הכרטיס האחרון (העלות), ולא זה שלפניו.
    expect(cards[1].querySelector('[data-testid="hint-reports.trends.costPerHour"]')).toBeNull()
    expect(cards[2].querySelector('[data-testid="hint-reports.trends.costPerHour"]')).not.toBeNull()
    // ושני לוחות-הקצב **מאפסים**: `domain: null` ⇒ `[0,'auto']` ב-`ChartCard.valueDomain`.
    const leftAxes = chartProps('YAxis').filter((props) => props.yAxisId !== 'right')
    expect(leftAxes.every((props) => props.domain[0] === 0)).toBe(true)
    // ושניהם **מתחת** לגרף שבכרטיסם (F10), לא מעליו.
    const footer = cards[0].querySelector('[data-testid="chart-footer"]')
    expect(comesBefore(cards[0].querySelector('[data-testid="chart-figure"]'), footer)).toBe(true)
  })

  it('🔴 כל מפתח-רמז שנכתב בקבצי הלשונית קיים בקובץ-הקופי, ואין בו מפתח מת', () => {
    // 🔑 **הבדיקה סורקת את הקוד עצמו ולא רשימה שנכתבה ביד** — מפתח שגוי מרנדר `null`
    // בשקט בייצור (`spec.md §🚫.5`), ורשימה ידנית הייתה נשברת יחד עם הקוד.
    const dir = path.join(process.cwd(), 'src/modules/11_reports/tabs')
    const sources = [
      'ExecutiveTab.jsx',
      'executive/surfaceKit.jsx',
      'executive/chartShape.js',
      'executive/ExecOverviewSurface.jsx',
      'executive/TrendsSurface.jsx',
      'executive/DiscountsSurface.jsx',
      'executive/StaffingSurface.jsx',
    ].map((file) => readFileSync(path.join(dir, file), 'utf8'))

    const used = new Set()
    for (const source of sources) {
      for (const match of source.matchAll(/['"](reports\.[A-Za-z0-9_.]+)['"]/g)) used.add(match[1])
    }

    const authored = Object.keys(M11_EXEC_COPY)
    expect(authored).toHaveLength(15)
    expect([...used].sort()).toEqual([...authored].sort())
    for (const key of authored) {
      expect(typeof M11_EXEC_COPY[key].guided).toBe('string')
      expect(M11_EXEC_COPY[key].pointer).toBeUndefined()
    }
  })
})
