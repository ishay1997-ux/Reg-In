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
      summary: '241 אירועים שהסתיימו · מתוך 837',
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
        sub: null,
        window: 'חלון-האריח',
        // ✏️ 24/09/2026 — אין דלת: "סגירת הצעות" אינו יעד לאריח הכנסות (`20260924213000`).
        target: null,
        compare: {
          value: 1425658.65,
          label: '2025 באותו טווח',
          direction: 'up',
          note: null,
        },
      },
      {
        key: 'margin',
        label: 'שולי-רווח גולמי',
        value: 58.613608308793665,
        format: 'percent',
        sub: null,
        window: 'חלון-האריח',
        target: { tab: 'הנהלה', report: 'report_m04_discounts', drill: null },
        compare: { value: 55.9443559648728, label: '2025 באותו טווח', direction: 'up', note: null },
      },
      {
        key: 'finished_events',
        label: 'אירועים שהסתיימו',
        value: 241,
        format: 'int',
        sub: null,
        window: 'חלון-האריח',
        target: { tab: 'כספים', report: 'report_m08_profitability', drill: null },
        compare: { value: 184, label: '2025 באותו טווח', direction: 'up', note: null },
      },
      {
        key: 'top5_share',
        label: 'נתח 5 הלקוחות הגדולים',
        value: 45.65447369246654,
        format: 'percent',
        sub: null,
        window: 'כל הזמנים',
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

// ✏️ 24/09/2026 — **מ3/מ4/מ6 שודרגו במקום לדוחות-החלטה** (`docs/plans/2026-09-23-module-11-decision-reports.md`).
// הפיקסצ'רים הבאים מקוצרים מהמטען החי שנמדד 24/09 כמנכ"ל (`execute_sql` + הזרקת-claims) — המספרים הם של
// המסד, לא הומצאו, והמבנה הוא בדיוק C8 שהפונקציות החדשות מחזירות.
const h1Payload = (extra = {}) =>
  base({
    population: {
      n: 355,
      summary: `${isolateLtr('355')} הצעות שהוכרעו · מתוך ${isolateLtr('390')}`,
      label: 'נכללות הצעות שהופקו בתקופה והוכרעו: אושרו או נדחו.',
      excluded: { 'הצעות פתוחות': 27, 'נפתחה בטעות': 8 },
    },
    window: { from: '2026-01-01', to: '2026-09-23', label: 'חלון' },
    tiles: [
      {
        key: 'close_rate',
        label: 'שיעור סגירה',
        value: 71.3,
        format: 'percent',
        sub: `${isolateLtr('253')} מתוך ${isolateLtr('355')}`,
        window: 'לפי תאריך הפקת ההצעה',
        compare: { value: 72.9, label: 'אשתקד', direction: 'down' },
        target: null,
      },
      {
        key: 'lost_value',
        label: 'כסף שאבד',
        value: 724690,
        format: 'money',
        sub: `${isolateLtr('102')} הצעות שנדחו`,
        window: 'אחרי הנחה, לפני מע"מ',
        compare: { value: 616801, label: 'אשתקד', direction: 'up' },
        target: null,
      },
      {
        key: 'expired_value',
        label: 'פגו בלי מענה',
        value: 53024,
        format: 'money',
        sub: `${isolateLtr('10')} הצעות`,
        window: 'הצעות שהמערכת סגרה',
        compare: { value: 73571, label: 'אשתקד', direction: 'down' },
        target: null,
      },
      {
        key: 'new_customer_rate',
        label: 'סגירה, לקוח חדש',
        value: null,
        format: 'percent',
        sub: `אין מספיק נתונים (${isolateLtr('12')})`,
        window: 'לקוח חדש = עוד לא אישר אף הצעה לפני זו',
        compare: null,
        target: null,
      },
    ],
    chart: [
      {
        type: 'bar',
        title: 'כסף שאבד לפי סיבה',
        series: [
          { key: 'lost_sum', label: 'כסף שאבד', kind: 'bar', axis: 'left', format: 'money' },
        ],
        data: [
          { reason: 'מחיר', lost_sum: 287782, lost_n: 41 },
          { reason: 'פג תוקף', lost_sum: 53024, lost_n: 10 },
        ],
        xKey: 'reason',
        refLines: [],
        unit: 'money',
      },
      {
        type: 'bar',
        title: 'שיעור סגירה לפי מאפיין',
        series: [
          { key: 'rate', label: 'שיעור סגירה', kind: 'bar', axis: 'left', format: 'percent' },
        ],
        data: [
          { segment: 'לקוח חדש', rate: null, n: 12 },
          { segment: 'לקוח חוזר', rate: 72, n: 343 },
        ],
        xKey: 'segment',
        filter_key: false,
        domain: [0, 100],
        refLines: [],
        unit: 'percent',
      },
    ],
    columns: [
      { key: 'quote_id', label: 'הצעה', format: 'id', align: 'start' },
      { key: 'customer_name', label: 'לקוח', format: 'text', align: 'start' },
      { key: 'reason', label: 'סיבה', format: 'text', align: 'start' },
      { key: 'value', label: 'ערך ההצעה', format: 'money', align: 'end', sorted: 'desc' },
    ],
    rows: [
      {
        quote_id: 1201,
        customer_name: 'אלפא סיסטמס',
        reason: 'מחיר',
        value: 21000,
        drill_key: { kind: 'quote', id: 1201 },
      },
      {
        quote_id: 1188,
        customer_name: 'עיריית נתניה',
        reason: 'פג תוקף',
        value: 9000,
        drill_key: { kind: 'quote', id: 1188 },
      },
    ],
    so_what: `לעקוב אחרי הצעות פתוחות לפני שהן פגות — ${isolateLtr('10')} פגו בלי מענה, ${isolateLtr('53,024 ₪')}.`,
    definitions: 'שיעור סגירה = אושרו חלקי (אושרו + נדחו)',
    meta: { measured_at: null, missing_params: [], notes: [], row_total: 102, run: null },
    ...extra,
  })

const h2Payload = (extra = {}) =>
  base({
    population: {
      n: 1174,
      summary: `${isolateLtr('1,174')} הצעות שהוכרעו · ${isolateLtr('741')} אירועים`,
      label: 'שתי אוכלוסיות',
      excluded: {},
    },
    window: { from: null, to: '2026-09-23', label: 'כל הזמנים · כל הלקוחות' },
    tiles: [
      {
        key: 'close_deep',
        label: 'סגירה בהנחה מעל 10%',
        value: 58.1,
        format: 'percent',
        sub: `${isolateLtr('31')} הצעות`,
        window: 'לקוחות ישירים',
        compare: { value: 74, label: 'בלי הנחה', direction: 'down' },
        target: null,
      },
      {
        key: 'margin_deep',
        label: 'שולי-רווח בהנחה מעל 10%',
        value: null,
        format: 'percent',
        sub: `אין מספיק נתונים (${isolateLtr('17')})`,
        window: 'לקוחות ישירים',
        compare: null,
        target: null,
      },
      {
        key: 'score_deep',
        label: 'משוב בהנחה מעל 10%',
        value: null,
        format: 'ratio',
        sub: `אין מספיק נתונים (${isolateLtr('16')})`,
        window: 'לקוחות ישירים',
        compare: null,
        target: null,
      },
    ],
    chart: {
      type: 'bar',
      title: 'סגירה ורווח לפי הנחה',
      series: [
        { key: 'close_rate', label: 'שיעור סגירה', kind: 'bar', axis: 'left', format: 'percent' },
        { key: 'margin', label: 'שולי-רווח', kind: 'bar', axis: 'left', format: 'percent' },
      ],
      data: [
        { band: '0%', close_rate: 74, margin: 57.9, n: 477 },
        { band: '10%+', close_rate: 58.1, margin: null, n: 31 },
      ],
      xKey: 'band',
      domain: [0, 100],
      refLines: [],
      unit: 'percent',
    },
    columns: [
      { key: 'band', label: 'הנחה', format: 'textLtr', align: 'start' },
      { key: 'group', label: 'סוג לקוח', format: 'text', align: 'start' },
      { key: 'close_rate', label: 'שיעור סגירה', format: 'percent', align: 'end' },
      { key: 'score', label: 'ציון משוב', format: 'ratio', align: 'end' },
    ],
    rows: [
      { band: '0%', group: 'לקוחות ישירים', close_rate: 74, score: 4.05 },
      { band: '10%+', group: 'לקוחות ישירים', close_rate: 58.1, score: 4.31 },
      { band: '10%+', group: 'חברות הפקה', close_rate: 67.8, score: 4.15 },
    ],
    so_what: `לא לתת מעל ${isolateLtr('10%')} הנחה כדי לסגור — הסגירה בה ${isolateLtr('58.1%')} מול ${isolateLtr('74.0%')} בלי הנחה.`,
    definitions: 'הנחה = ההנחה הקבועה של הלקוח ועוד ההנחה הידנית',
    meta: { measured_at: null, missing_params: [], notes: [], row_total: 8, run: null },
    ...extra,
  })

const h3Payload = (extra = {}) =>
  base({
    population: {
      n: 552,
      summary: `${isolateLtr('552')} אירועים עם משוב · מתוך ${isolateLtr('741')} שהתקיימו`,
      label: 'נכללים אירועים שהתקיימו',
      excluded: {},
    },
    window: { from: null, to: '2026-09-23', label: 'כל הזמנים · כל הלקוחות' },
    tiles: [
      {
        key: 'score_no_lead',
        label: 'ציון בלי ראש-משמרת',
        value: 2.07,
        format: 'ratio',
        sub: `${isolateLtr('27')} אירועים`,
        window: 'ממוצע',
        compare: { value: 4.18, label: 'עם ראש-משמרת', format: 'ratio', direction: 'down' },
        target: null,
      },
      {
        key: 'score_late',
        label: 'ציון באיחור בינוני-כבד',
        value: 4.26,
        format: 'ratio',
        sub: `${isolateLtr('103')} אירועים`,
        window: 'ממוצע',
        compare: { value: 4.04, label: 'בשאר האירועים', format: 'ratio', direction: 'up' },
        target: null,
      },
    ],
    chart: {
      type: 'bar',
      title: 'ציון המשוב לפי גורם',
      series: [
        { key: 'with_avg', label: 'כשהגורם קיים', kind: 'bar', axis: 'left', format: 'ratio' },
        { key: 'without_avg', label: 'בלעדיו', kind: 'bar', axis: 'left', format: 'ratio' },
      ],
      data: [{ factor: 'בלי ראש-משמרת', with_avg: 2.07, without_avg: 4.18, n: 27 }],
      xKey: 'factor',
      filter_key: false,
      domain: [0, 5],
      refLines: [],
      unit: 'ratio',
    },
    columns: [
      { key: 'event_date', label: 'תאריך', format: 'date', align: 'start', sorted: 'asc' },
      { key: 'event_name', label: 'אירוע', format: 'text', align: 'start' },
      { key: 'risk', label: 'מה חסר', format: 'text', align: 'start' },
    ],
    rows: [
      {
        event_date: '2026-09-28',
        event_name: 'מפגש משקיעים רבעוני',
        risk: 'יותר מ-50 אורחים לדיילת',
        drill_key: { kind: 'project', id: 1597 },
      },
    ],
    so_what: `לשבץ ראש-משמרת בכל אירוע — בלעדיה הציון ${isolateLtr('2.1')} מול ${isolateLtr('4.2')}.`,
    definitions: 'ציון משוב = ממוצע הציונים (1–5) במשובים שהושלמו',
    meta: { measured_at: null, missing_params: [], notes: [], row_total: 1, run: null },
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
    // ✏️ 23/09/2026 (L1, הדגם שישי אישר): אריח = שם · מספר · השוואה — בלי תת-שורה. השרת מחזיר
    // `sub: null` בארבעתם, וההיקף ("241 אירועים שהסתיימו · מתוך 837") עבר לשבב-ההיקף.
    // (רינדור `tiles[].sub` כשיש כזה נעול ב-`KpiTile.test.jsx`.)
    expect(screen.queryAllByTestId('kpi-sub')).toHaveLength(0)
    expect(screen.getByTestId('report-scope-summary')).toHaveTextContent('241 אירועים שהסתיימו')
    // 📐4 — חצי-ההשוואה מעוצב כמו האריח, ולא נשפך כמספר גולמי (נמדד כפגם 16/09).
    expect(screen.getByText(isolateLtr('1,425,659 ₪'))).toBeInTheDocument()
    expect(screen.getByText(isolateLtr('55.9%'))).toBeInTheDocument()
    // 📐2 · 📐23 · 📐16 — בסיס, ולא שכבה.
    expect(screen.getByTestId('report-population')).toHaveTextContent('n=241')
    expect(screen.getByTestId('report-so-what')).toBeInTheDocument()
    expect(screen.getByTestId('report-definitions')).toBeInTheDocument()
  })

  it('📐20 — החודש החלקי מצהיר על אורכו בתווית ובהערת-הגרף, והרשימה נושאת כותרת-כנה', async () => {
    callReport.mockResolvedValueOnce(m2Payload())
    renderTab('מ2')

    expect(await screen.findByTestId('chart-note')).toHaveTextContent(
      `חלקי — ${isolateLtr('16')} ימים בלבד`,
    )
    // 📐20 ① — הערוץ שהשכבה המשותפת פתחה: העמודה החלקית מסומנת `is_today`.
    expect(chartProps('Cell').some((props) => props.strokeDasharray)).toBe(true)
    // ציר-הקטגוריה עבר ל-`label`, והתווית החלקית נושאת את אורך-החלון.
    expect(chartProps('XAxis')[0].dataKey).toBe('label')
    expect(screen.getByText(`ספטמבר (${isolateLtr('16')} ימים)`)).toBeInTheDocument()
    // ✏️ 23/09/2026 (פזה ב׳ שלב 4, הכרעת-ישי 4) — רשימת-שיא: כותרת-כנה, בלי פאג'ר ובלי שורת-תקרה.
    expect(screen.getByTestId('report-topn-title')).toHaveTextContent(
      `8 האירועים הגדולים · מתוך ${isolateLtr('241')}`,
    )
    expect(screen.queryByTestId('report-row-cap')).toBeNull()
    expect(screen.queryByTestId('report-pager')).toBeNull()
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

  it('✂️ הקישור "כל השנים בדוח «מגמות רב-שנתיות»" ירד — הדוח הוחלף ב"סגירת הצעות"', async () => {
    callReport.mockResolvedValueOnce(m2Payload())
    renderTab('מ2')

    await screen.findByTestId('report-so-what')
    expect(screen.queryByTestId('exec-overview-trends-link')).toBeNull()
  })
})

// ── ה1 · סגירת הצעות (report_m03_trends) ─────────────────────────────────────

describe('ה1 · סגירת הצעות', () => {
  it('ארבעת הכרטיסים, שורת-ההחלטה והקישור למסך-הבית — והשם שעל המסך הוא החדש', async () => {
    callReport.mockResolvedValueOnce(h1Payload())
    renderTab('מ3')

    expect(await screen.findByTestId('report-so-what')).toHaveTextContent('לעקוב אחרי הצעות פתוחות')
    for (const label of ['שיעור סגירה', 'כסף שאבד', 'פגו בלי מענה', 'סגירה, לקוח חדש']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
    // 🔑 "פגות בקרוב" אינה נבנית שוב — הקישור שולח לרשימה הקיימת (כלל-ברזל 14).
    expect(screen.getByTestId('trends-expiring-link').querySelector('a')).toHaveAttribute(
      'href',
      '/',
    )
    expect(surfaceOf('מ3')).toMatchObject({ name: 'סגירת הצעות', drill: false })
  })

  it('סף-n — קבוצה מתחת ל-20 אינה מקבלת אחוז: "אין מספיק נתונים" ולא 0', async () => {
    callReport.mockResolvedValueOnce(h1Payload())
    renderTab('מ3')

    const tile = await screen.findByTestId('report-tile-new_customer_rate')
    expect(tile).toHaveTextContent('אין מספיק נתונים')
    expect(tile.textContent).not.toMatch(/0(\.0)?%/)
  })

  it('לחיצה על עמודת-סיבה מסננת את טבלת-ההצעות שאבדו (סינון-צולב, לא קידוח)', async () => {
    callReport.mockResolvedValueOnce(h1Payload())
    renderTab('מ3')

    await screen.findAllByTestId('report-row-drillable')
    const select = screen.getAllByTestId('chart-select-1')[0]
    fireEvent.click(select)
    const rows = screen.getAllByTestId('report-row-drillable')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('פג תוקף')
  })

  it('שורה פותחת את הצעת-המחיר', async () => {
    callReport.mockResolvedValueOnce(h1Payload())
    const { onDrill } = renderTab('מ3')

    fireEvent.click((await screen.findAllByTestId('report-row-drillable'))[0])
    expect(firstDrillArg(onDrill)).toEqual({ kind: 'quote', id: 1201 })
  })
})

// ── ה2 · הנחה מול סגירה (report_m04_discounts) ─────────────────────────────────

describe('ה2 · הנחה מול סגירה', () => {
  it('שורת-ההחלטה, שלושת הכרטיסים וטבלת-הסיכום — בלי שבבי-מדרג', async () => {
    callReport.mockResolvedValueOnce(h2Payload())
    renderTab('מ4')

    expect(await screen.findByTestId('report-so-what')).toHaveTextContent('לא לתת מעל')
    expect(screen.getByTestId('report-tile-close_deep')).toHaveTextContent('בלי הנחה')
    expect(screen.getByTestId('report-tile-margin_deep')).toHaveTextContent('אין מספיק נתונים')
    expect(screen.queryByTestId('discount-tier-chips')).toBeNull()
    expect(screen.getAllByText('חברות הפקה').length).toBeGreaterThan(0)
  })

  it('לחיצה על מדרג בגרף מסננת את הטבלה לאותו מדרג — בשני סוגי-הלקוח', async () => {
    callReport.mockResolvedValueOnce(h2Payload())
    renderTab('מ4')

    await screen.findByTestId('report-table-card')
    fireEvent.click(screen.getAllByTestId('chart-select-1')[0])
    const table = screen.getByTestId('report-table-card')
    expect(within(table).getAllByRole('row').length - 1).toBe(2)
  })
})

// ── ה3 · איכות אירועים (report_m06_staffing) ───────────────────────────────────

describe('ה3 · איכות אירועים', () => {
  it('כרטיס לכל גורם עם השוואה לבלעדיו, ושורה פותחת את כרטיס-האירוע', async () => {
    callReport.mockResolvedValueOnce(h3Payload())
    const { onDrill } = renderTab('מ6')

    expect(await screen.findByTestId('report-so-what')).toHaveTextContent('לשבץ ראש-משמרת')
    expect(screen.getByTestId('report-tile-score_no_lead')).toHaveTextContent('עם ראש-משמרת')
    fireEvent.click(screen.getAllByTestId('report-row-drillable')[0])
    expect(firstDrillArg(onDrill)).toEqual({ kind: 'project', id: 1597 })
  })

  it('🔒 אגרגטים בלבד — אין במטען ובמסך אף עמודת-דיילת ואף תעריף', async () => {
    callReport.mockResolvedValueOnce(h3Payload())
    renderTab('מ6')

    await screen.findByTestId('report-table-card')
    const keys = h3Payload().columns.map((column) => column.key)
    expect(keys.some((key) => /hostess|rate/.test(key))).toBe(false)
  })

  it('§7.83 — פרמטר חסר מוצהר על המסך ואינו הופך לאפס שקט', async () => {
    callReport.mockResolvedValueOnce(
      h3Payload({ meta: { missing_params: ['סף_שביעות_רצון'], notes: [], row_total: 1 } }),
    )
    renderTab('מ6')

    expect(await screen.findByTestId('report-missing-params')).toHaveTextContent(
      'חסר פרמטר מערכת: סף שביעות רצון',
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

  it('🔴 ה1 — רמז-הסיבות לפני הגרף, רמז-הטבלה לפני הטבלה, והקישור מעל האריחים', async () => {
    callReport.mockResolvedValueOnce(h1Payload())
    renderTab('מ3')
    await screen.findByTestId('report-population')

    const link = screen.getByTestId('trends-expiring-link')
    const tiles = screen.getByTestId('report-tiles')
    const reasons = screen.getByTestId('hint-reports.trends.reasons')
    const figure = screen.getAllByTestId('chart-figure')[0]
    const tableHint = screen.getByTestId('hint-reports.trends.table')
    const table = screen.getByTestId('report-table-card')
    expect(comesBefore(link, tiles)).toBe(true)
    expect(comesBefore(tiles, reasons)).toBe(true)
    expect(comesBefore(reasons, figure)).toBe(true)
    expect(comesBefore(tableHint, table)).toBe(true)
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
    // ✏️ 24/09/2026 — 15 ⇒ 13: מ2 ארבעה + שלושה לכל אחד מדוחות-ההחלטה.
    expect(authored).toHaveLength(13)
    expect([...used].sort()).toEqual([...authored].sort())
    for (const key of authored) {
      expect(typeof M11_EXEC_COPY[key].guided).toBe('string')
      expect(M11_EXEC_COPY[key].pointer).toBeUndefined()
    }
  })
})
