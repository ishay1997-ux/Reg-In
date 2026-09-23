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

import { isolateLtr } from '@/lib/reportsFormat'
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
        // ✏️ i2: הכרעה 33 מושלמת — חמישה מתוך חמישה אריחים הם דלתות.
        target: { tab: 'דיילות', drill: null, report: 'report_m15_reliability' },
      },
      {
        key: 'red_hostesses',
        label: 'דיילות אדומות',
        value: 6,
        format: 'int',
        window: 'חלון קפוא · 12 חודשים',
        compare: { label: 'התקופה המקבילה אשתקד', value: 0, direction: 'up' },
        target: { tab: 'דיילות', drill: null, report: 'report_m15_reliability' },
      },
      {
        key: 'gini',
        label: 'ריכוזיות המשמרות',
        value: 0.4581,
        format: 'gini',
        window: '12 החודשים האחרונים',
        // ✏️ 23/09/2026 (L3): בלי "(n=97)" — השרת אומר "אשתקד" בלבד.
        compare: { label: 'אשתקד', value: 0.4383, direction: 'up' },
        target: { tab: 'דיילות', drill: null, report: 'report_m17_fairness' },
      },
      {
        key: 'active_hostesses',
        label: 'דיילות פעילות',
        value: 50,
        format: 'int',
        window: 'נכון ל-16/09/2026',
        compare: null,
        target: { tab: 'דיילות', drill: null, report: 'report_m16_quality_cost' },
      },
      {
        key: 'gap_events',
        label: 'אירועים עם חוסר',
        value: 4,
        format: 'int',
        window: '30 הימים הקרובים',
        compare: { label: '31–60 הימים הבאים', value: 2, direction: 'up' },
        // 🔴 **דלת חוצת-לשונית** (הכרעה 33): לשונית "הנהלה", שהרשאתה `'כספים'`.
        target: { tab: 'הנהלה', drill: null, report: 'report_m06_staffing' },
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
    // 🔴 **שלוש שורות ולא אחת, וזה לא נוי** (סבב 3, ממצא 15): עם שורה אחת, החלפת
    // `${isolateLtr(payload.rows.length)}` בליטרל `'1'` הייתה משאירה את בדיקת-הכותרת ירוקה
    // — כלומר הבדיקה שנכתבה כדי להוכיח **גזירה** לא יכלה להיכשל. שלוש שורות הופכות אותה
    // למדידה, והשלישית גם מספקת ערך-ציון נוסף לבדיקת פורמט-ה-`score`.
    rows: [
      {
        hostess_name: 'רותם עמר',
        status: 'פעילה',
        reliability: 0.7589,
        last_shift_date: '2026-08-20',
        drill_key: { kind: 'hostess', id: 449 },
      },
      {
        hostess_name: 'מעיין קדוש',
        status: 'פעילה',
        reliability: 0.7643,
        last_shift_date: '2026-08-26',
        drill_key: { kind: 'hostess', id: 512 },
      },
      {
        hostess_name: 'ירדן תורג׳מן',
        status: 'פעילה',
        reliability: 0.7752,
        last_shift_date: '2026-08-26',
        drill_key: { kind: 'hostess', id: 533 },
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
        drill_key: { kind: 'hostess', id: 449 },
      },
      {
        row_key: 2,
        hostess_name: 'ענבר חדד',
        status: 'לא פעילה',
        band: 'amber',
        no_show_12m: 1,
        no_show_ever: 2,
        drill_key: { kind: 'hostess', id: 539 },
      },
      {
        row_key: 3,
        hostess_name: 'נופר הרוש',
        status: 'פעילה',
        band: null,
        no_show_12m: 0,
        no_show_ever: 1,
        drill_key: { kind: 'hostess', id: 551 },
      },
    ],
    so_what: 'לא לשלוח את 6 הדיילות האדומות.',
    // ✏️ i2 (חי, נמדד 16/09 20:3X): שורת-ההגדרות נושאת עכשיו את **שני הספים במספרים**
    // ואת **משפט הכרעה 38**. מועתקת מילה-במילה מהמטען החי — זו הצורה שמבחן-המחיקה נמדד עליה.
    definitions:
      'הגדרות: ציון אמינות = (סכום ערכי-הנוכחות + 3 × 0.9584) ÷ (מספר המשמרות + 3) — ממוצע ממותן אל ממוצע החברה · איחור נספר לפי דרגה: קל אינו מוריד מהציון, בינוני מוריד רבע, רב מוריד חצי · שתי עמודות אי-ההגעה, ואף אחת מהן אינה "הנכונה": "הבריזה · ב-12 חודשים" היא ההגדרה שהציון עצמו עובד לפיה — רק אי-הגעה בלי הודעה, ורק בחלון הקפוא · "אי-הגעה · אי-פעם" היא כל סיבות אי-ההגעה — כולל מחלה והיעדרות באישור — ועל כל ההיסטוריה. שתיהן נכונות בהגדרתן, והדוח אינו בוחר ביניהן · הבריזה = לא הגיעה ולא הודיעה — רק היא מאפסת את הציון של אותה משמרת · ביטלה אחרי אישור = הודיעה שלא תגיע אחרי שכבר אושרה סופית — נספר כחצי משמרת · החלון = 12 חודשים אחורה מהיום, קפוא ואינו נגרר אחרי מסנן-התקופה · דיילת אדומה = ציון-אמינות נמוך מ-87% ממוצע החברה (0.9584), כלומר מתחת ל-0.8338 · דיילת ענבר = מתחת ל-95% ממנו, כלומר מתחת ל-0.9104 · הציון הוא בדיוק reliabilityScore של Smart Match (הכרעה 38) — אותה נוסחה שמדרגת את הדיילות בשיבוץ, ולא מדד שנולד לדוח הזה.',
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
      // ✏️ i2: ‏`x_domain` נועל את ציר-התעריף ל-⁦38⁩–⁦51⁩ במקום לפתוח אותו מאפס (📐5 נכתב
      // לסכומים; תעריף שעתי שכל ערכיו 41–49 נמחץ לימין הכרטיס). נמדד במטען החי היום.
      x_domain: [38, 51],
      series: [
        { key: 'hourly_rate', label: 'תעריף שעתי' },
        { key: 'rating', label: 'דירוג' },
      ],
      data: [
        { hourly_rate: 49.39, rating: 5, hostess_name: 'שקד ניסים' },
        { hourly_rate: 47.98, rating: 5, hostess_name: 'גלי אוחיון' },
      ],
      // ✏️ I1: תווית קו-הייחוס עברה לשקלים שלמים (📐4), והערת-הגרף מצהירה על 17 הנקודות
      // שאינן עליו — שתיהן נמדדו במטען החי היום (`results/payloads_h5`).
      refLines: [{ axis: 'x', value: 43.27, label: 'חציון התעריף 43 ₪' }],
      note: "⁦17⁩ דיילות ללא דירוג אינן בגרף — ראי את השבב 'בלי דירוג בלבד' בטבלה.",
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
      {
        row_key: 1,
        hostess_name: 'אביב יוסף',
        hourly_rate: 41.73,
        rating: null,
        drill_key: { kind: 'hostess', id: 394 },
      },
      {
        row_key: 2,
        hostess_name: 'שקד ניסים',
        hourly_rate: 49.39,
        rating: 5,
        drill_key: { kind: 'hostess', id: 497 },
      },
      {
        row_key: 3,
        hostess_name: 'גלי אוחיון',
        hourly_rate: 47.98,
        rating: 5,
        drill_key: { kind: 'hostess', id: 496 },
      },
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
        key: 'gini',
        label: 'ריכוזיות המשמרות',
        value: 0.4581,
        format: 'gini',
        window: '12 החודשים האחרונים',
        compare: {
          label: 'אשתקד',
          value: 0.4383,
          direction: 'up',
        },
        target: null,
      },
      {
        key: 'top_quarter',
        label: 'רבע הדיילות העמוסות',
        value: 55.8,
        format: 'percent',
        window: '12 החודשים האחרונים',
        compare: null,
        target: null,
      },
      {
        key: 'rank1_adoption',
        label: 'אימוץ המלצת Smart Match',
        value: null,
        format: 'percent',
        window: 'טרם נמדד',
        // ✏️ i2: *"נמדד מ-—"* (מילת-יחס ואחריה מקף) הוחלף ב-*"טרם נמדד · אין עדיין נתון"*.
        sub: 'דרג ⁦1⁩ = הדיילת שהמערכת דירגה ראשונה · טרם נמדד · אין עדיין נתון: המערכת התחילה לרשום את הדרג שהמליצה רק מעכשיו, ועד שייצברו שיבוצים המדד מציג "—" ולא ⁦0%⁩',
        compare: null,
        target: null,
      },
      {
        key: 'median_response',
        label: 'זמן-תגובה חציוני לזימון',
        value: 9.9,
        format: 'ratio',
        window: '12 החודשים האחרונים',
        compare: { label: 'התקופה המקבילה אשתקד', value: 9.5, direction: 'up' },
        target: null,
      },
      {
        key: 'p90_response',
        label: 'זמן-תגובה, אחוזון 90',
        value: 20.7,
        format: 'ratio',
        window: '12 החודשים האחרונים',
        compare: null,
        target: null,
      },
      {
        key: 'response_rate',
        label: 'אחוז היענות לזימון',
        value: 92.6,
        format: 'percent',
        window: '12 החודשים האחרונים',
        compare: { label: 'התקופה המקבילה אשתקד', value: 97.3, direction: 'down' },
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
      data: [
        { x: 0, y: 0 },
        { x: 50, y: 16.3 },
        { x: 100, y: 100 },
      ],
      // ✏️ I1: קו-השוויון האלכסוני של 📐6 נחת במטען (היה חסר בסבב 2 ודווח).
      refLines: [
        { axis: 'diagonal', from: { x: 0, y: 0 }, to: { x: 100, y: 100 }, label: 'חלוקה שווה' },
        { axis: 'y', value: 16.3, label: 'מחצית הדיילות = ⁦16.3%⁩ מהמשמרות' },
      ],
    },
    columns: [
      { key: 'hostess_name', label: 'דיילת', format: 'text', align: 'start' },
      { key: 'shifts', label: 'משמרות', format: 'int', align: 'end' },
    ],
    rows: [
      {
        row_key: 1,
        hostess_name: 'אביב יוסף',
        shifts: 49,
        drill_key: { kind: 'hostess', id: 394 },
      },
    ],
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
// ⚠️ **ספירת-שורות סופרת את שני המזהים.** ‏`ReportTable` מסמן שורה `report-row-drillable`
// כשהיא נושאת `drill_key` נתיב ו-`report-row` כשלא — וכל שורה חיה בלשונית הזו נושאת אחד
// (‏`{kind:'hostess', id}`). ספירה של מזהה אחד בלבד הייתה מחזירה 0 ונראית כמו סינון שעבד.
const rowCount = () =>
  within(mainTable()).queryAllByTestId('report-row').length +
  within(mainTable()).queryAllByTestId('report-row-drillable').length

// גרסה שמחזירה את תוצאת-הרינדור (ל-`unmount`), לבדיקות שמרנדרות שני מטענים ברצף.
function renderTabRaw(surface, { drill = null, onDrill = vi.fn() } = {}) {
  return render(
    <HostessesTab
      surface={surface}
      filters={filters}
      drill={drill}
      onDrill={onDrill}
      onWindow={() => {}}
    />,
  )
}

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
    // 🔑 **המבחן הוא ששני מטענים באורכים שונים מייצרים שתי כותרות שונות.** אימות על מטען
    // אחד אינו מבדיל בין גזירה לליטרל — זה בדיוק מה שממצא 15 מדד.
    const three = m14()
    callReport.mockResolvedValue(three)
    const { unmount } = renderTabRaw(SURFACES.m14)
    expect(await screen.findByTestId('report-table-title')).toHaveTextContent(
      `${isolateLtr(three.rows.length)} הדיילות האדומות · מיון לפי ציון-אמינות, מהנמוך`,
    )
    unmount()

    const two = { ...m14(), rows: m14().rows.slice(0, 2) }
    callReport.mockResolvedValue(two)
    renderTabRaw(SURFACES.m14)
    expect(await screen.findByTestId('report-table-title')).toHaveTextContent(
      `${isolateLtr(2)} הדיילות האדומות · מיון לפי ציון-אמינות, מהנמוך`,
    )
  })

  it('בלי אדומות — הכותרת אומרת "אין דיילות מתחת לסף" (כרטיס ①7)', async () => {
    callReport.mockResolvedValue({ ...m14(), rows: [] })
    renderTab(SURFACES.m14)
    expect(await screen.findByTestId('report-table-title')).toHaveTextContent('אין דיילות מתחת לסף')
  })
})

describe('מה ש-i2 הוסיף לשרת, ומה שהוא משנה על המסך', () => {
  it('מ14 · חמישה אריחים וחמש דלתות — הכרעה 33 מושלמת, כולל דלת חוצת-לשונית', async () => {
    callReport.mockResolvedValue(m14())
    const onDrill = renderTab(SURFACES.m14)
    await screen.findByTestId('report-tiles')
    // ⚠️ הספירה נגזרת מהמטען ולא מוקלדת: `report-tile-link-*` הוא העטיפה ש-`KpiTile`
    // מוסיף **רק** לאריח עם `target` (הכרעה 33).
    const doors = screen.getAllByTestId(/^report-tile-link-/)
    expect(doors).toHaveLength(m14().tiles.filter((t) => t.target).length)
    expect(doors).toHaveLength(5)

    // הדלת שהיא **חוצת-לשונית** — האריח היחיד שיעדו מחוץ ללשונית "דיילות".
    fireEvent.click(screen.getByTestId('report-tile-link-gap_events'))
    expect(onDrill).toHaveBeenCalledWith(
      expect.objectContaining({ tab: 'הנהלה', report: 'report_m06_staffing' }),
    )
  })

  it('מ15 · שני הספים והכרעה 38 על המסך **ברמה 0** — מבחן-המחיקה של C3', async () => {
    onboardingMode.value = 0
    callReport.mockResolvedValue(m15())
    renderTab(SURFACES.m15)
    const definitions = await screen.findByTestId('report-definitions')
    // 🔴 זה הליבה של הממצא שהסקירה מדדה: המילים "אדומה"/"ענבר" הופיעו על הדף שלוש פעמים
    // ומעולם לא נאמר **במספרים** מה הן, אלא ברמה 2 בלבד או משטח אחד אחורה במ14.
    expect(definitions).toHaveTextContent('דיילת אדומה')
    expect(definitions).toHaveTextContent('0.8338')
    expect(definitions).toHaveTextContent('דיילת ענבר')
    expect(definitions).toHaveTextContent('0.9104')
    // הכרעה 38 — הציון הוא אותו `reliabilityScore` של Smart Match, ולא מדד שנולד לדוח.
    expect(definitions).toHaveTextContent('הכרעה 38')
    expect(definitions).toHaveTextContent('Smart Match')
    // ⚠️ וברמה 0 אין אף רמז — כלומר כל זה **בסיס**, לא שכבה.
    expect(document.body.querySelectorAll('[data-testid^="hint-"]')).toHaveLength(0)
  })

  it('מ15 · `scoreBasis` נשאר צמוד לשורת-ההגדרות שנושאת עכשיו את הנוסחה והספים', async () => {
    callReport.mockResolvedValue(m15())
    renderTab(SURFACES.m15)
    const hint = await screen.findByTestId('hint-reports.reliability.scoreBasis')
    const definitions = screen.getByTestId('report-definitions')
    // 🔑 **זו ההכרעה שנבדקה מחדש מול הכרטיס אחרי i2**: עוגן ב הוא פסקת `div.datanote`
    // שנושאת נוסחה · C · שני הספים · טבלת-ערכי-הנוכחות — וכל אלה חיים עכשיו בשורת-ההגדרות.
    // ⇒ החריץ הנכון הוא `renderExtras`, שמרונדר מיד אחריה — ולא `renderChartFooter`,
    // שהיה תולה אותו מתחת לגרף יום-בשבוע שהוא אינו מדבר עליו.
    expect(follows(definitions, hint)).toBe(true)
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
    expect(rowCount()).toBe(3)
    fireEvent.click(screen.getByTestId('reports-chips-reliability-onlyFlag'))
    expect(rowCount()).toBe(2)
    expect(screen.getByTestId('reports-chips-reliability-onlyFlag')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    // שני השבבים מצטלבים (כרטיס ①6): מסומנת **וגם** פעילה.
    fireEvent.click(screen.getByTestId('reports-chips-reliability-onlyActive'))
    expect(rowCount()).toBe(1)
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
    expect(rowCount()).toBe(1)
    expect(screen.getByTestId('report-table-title')).toHaveTextContent(
      'הדיילות הפעילות שאין להן דירוג',
    )

    fireEvent.click(chip)
    expect(rowCount()).toBe(3)
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
    // 🔴 **הטענה היא על ה*ערך*, לא על נוכחות התו `%` באריח** — וזה תוקן אחרי i2:
    // תת-השורה עצמה **מצטטת** את *"המדד מציג '—' ולא ⁦0%⁩"*, כלומר מסבירה למה אין אחוז.
    // אריח שערכו `null` מצייר את `emptyText` (`NO_VALUE`) בצומת-הערך — ‏`StatTile.jsx:37-38`
    // — וזו ההצהרה שהכרעת-📑ב#14א דורשת: מקף, לעולם לא `0%`.
    expect(tile.children[1].textContent).toBe('—')
    expect(tile.children[1].textContent).not.toMatch(/%/)
    // ✏️ i2: הנוסח *"נמדד מ-—"* (מילת-יחס ואחריה מקף) ירד; תת-השורה אומרת "טרם נמדד".
    expect(within(tile).getByTestId('kpi-sub')).toHaveTextContent('אין עדיין נתון')
    expect(within(tile).getByTestId('kpi-sub')).not.toHaveTextContent('נמדד מ-—')
    expect(screen.getByTestId('report-meta-notes')).toHaveTextContent('אין עדיין נתון')
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

// ⛳ **רצפת-הבדיקות של ארבעת המשטחים — `it.each` ולא ארבעה עותקים.**
// 🔴 **למה זה נכתב מחדש בסבב 3 (ממצא 16):** כל בדיקות-הרצפה רונדרו את `SURFACES.m14`
// בלבד, כלומר הרצפה נמדדה על משטח אחד מארבעה — ומוטציה במ15/מ16/מ17 (שורת-אוכלוסייה
// שנעלמת · ייצוא שאינו מנוטרל · מצב-שגיאה שהופך ל"אין נתונים") הייתה שורדת ירוקה.
// 🚫 **וארבעה עותקים אינם הפתרון** — ‏jscpd נופל ב-3%; הפרמטריזציה היא גם הגדר וגם הניקיון.
const SURFACE_CASES = [
  ['מ14 · מבט-על דיילות', SURFACES.m14, m14, ['הגעה בזמן', 'דיילות אדומות', 'אירועים עם חוסר']],
  ['מ15 · אמינות והתייצבות', SURFACES.m15, m15, ['הגעה בזמן', 'דיילות מסומנות']],
  ['מ16 · איכות מול עלות', SURFACES.m16, m16, ['דיילות בלי דירוג', 'תעריף שעתי חציוני']],
  [
    'מ17 · הוגנות השיבוץ',
    SURFACES.m17,
    m17,
    ['אימוץ המלצת Smart Match', 'זמן-תגובה חציוני לזימון', 'אחוז היענות לזימון'],
  ],
]

describe('רצפת-המשטח — כל ארבעת המשטחים', () => {
  it.each(SURFACE_CASES)(
    '%s · תוויות §1.4 ושלוש שורות-הבסיס',
    async (_name, surface, make, labels) => {
      callReport.mockResolvedValue(make())
      renderTab(surface)
      await screen.findByTestId('report-tiles')
      for (const label of labels) expect(screen.getByText(label)).toBeInTheDocument()
      expect(screen.getByTestId('report-population')).toBeInTheDocument()
      expect(screen.getByTestId('report-so-what')).toBeInTheDocument()
      expect(screen.getByTestId('report-definitions')).toBeInTheDocument()
    },
  )

  it.each(SURFACE_CASES)('%s · השורה כולה דלת (הכרעה 19)', async (_name, surface, make) => {
    callReport.mockResolvedValue(make())
    const onDrill = renderTab(surface)
    const row = (await screen.findAllByTestId('report-row-drillable'))[0]
    fireEvent.click(row)
    expect(onDrill).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'hostess' }),
      expect.anything(),
    )
  })

  it.each(SURFACE_CASES)(
    '%s · כשל-רשת ⇒ מעטפת-תקלה ו"נסי שוב", לעולם לא "אין נתונים"',
    async (_name, surface, make) => {
      callReport.mockRejectedValueOnce(new Error('network down'))
      renderTab(surface)
      expect(await screen.findByText('נסי שוב')).toBeInTheDocument()
      expect(screen.queryByTestId('report-tiles')).toBeNull()
      callReport.mockResolvedValueOnce(make())
      fireEvent.click(screen.getByText('נסי שוב'))
      expect(await screen.findByTestId('report-tiles')).toBeInTheDocument()
      expect(callReport).toHaveBeenCalledTimes(2)
    },
  )

  it.each(SURFACE_CASES)(
    '%s · `missing_params` בעברית, בשם הפרמטר',
    async (_name, surface, make) => {
      const payload = make()
      callReport.mockResolvedValue({
        ...payload,
        meta: { ...payload.meta, missing_params: ['קבוע_ריסון_m'] },
      })
      renderTab(surface)
      expect(await screen.findByTestId('report-missing-params')).toHaveTextContent(
        'חסר פרמטר מערכת: משקל ממוצע-החברה',
      )
    },
  )

  it.each(SURFACE_CASES)(
    '%s · בלי שורות ⇒ ייצוא מנוטרל עם הנוסח הנעול',
    async (_name, surface, make) => {
      callReport.mockResolvedValue({ ...make(), rows: [] })
      renderTab(surface)
      expect(await screen.findByTestId('reports-export-button')).toBeEnabled()
      // ✏️ **17/09/2026 — ת4ב:** הכפתור פעיל תמיד והכיתוב עבר לתוך החלון; החסימה נבדקת
      // פר-דוח נבחר. הנוסח הנעול עצמו נבדק ב-`reportsExport.test.js` (זהות-בייט) וב-
      // `ExportDialog.test.jsx` (מוצג במקום שורת-הכמות, והייצוא מנוטרל).
      expect(screen.queryByTestId('reports-export-file')).toBeNull()
    },
  )

  it.each(SURFACE_CASES)('%s · מטען ריק לגמרי ⇒ "ריק" ולא תקלה', async (_name, surface) => {
    callReport.mockResolvedValue(base({}))
    renderTab(surface)
    expect(await screen.findByTestId(`report-${surface.slug}-blank`)).toBeInTheDocument()
  })

  it.each(SURFACE_CASES)(
    '%s · מבחן-המחיקה: ברמה 0 הבסיס שלם ואין אף רמז',
    async (_name, surface, make) => {
      onboardingMode.value = 0
      callReport.mockResolvedValue(make())
      renderTab(surface)
      expect(await screen.findByTestId('report-tiles')).toBeInTheDocument()
      expect(screen.getByTestId('report-population')).toBeInTheDocument()
      expect(screen.getByTestId('report-so-what')).toBeInTheDocument()
      expect(screen.getByTestId('report-definitions')).toBeInTheDocument()
      expect(screen.getAllByTestId('report-table-card')[0]).toBeInTheDocument()
      expect(document.body.querySelectorAll('[data-testid^="hint-"]')).toHaveLength(0)
    },
  )
})

// 📐 **מיקום, לא קיום** (סבב 3, ממצא 17). הבדיקה הקודמת ספרה `toBeInTheDocument` על חמישה
// מזהים — כלומר קיפול כל 38 המפתחות ל-`renderExtras` היה משאיר אותה ירוקה **ומייצר בדיוק
// את קיר-הרמזים בתחתית הדף** שממצא 7 מדד. ‏`compareDocumentPosition` הוא מה שמודד עוגן.
// 🔑 **והעוגן של כל חריץ נגזר מ-`onboarding-layer-contract §4ב`:** הרמז הוא שורה עצמאית
// **מתחת לבלוק שהוא מסביר** — ‏`renderTop` מעל שורת-האוכלוסייה · `renderBeforeChart` אחרי
// רצועת-האריחים ולפני הגרף · `renderBeforeTable` לפני הטבלה · `renderExtras` אחרי ההגדרות.
const follows = (first, second) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)

const HINT_PLACEMENT = [
  ['מ14 · מבט-על דיילות', SURFACES.m14, m14, 'hostessOverview', 'redCount', null, 'redTableSort'],
  ['מ15 · אמינות והתייצבות', SURFACES.m15, m15, 'reliability', null, null, 'absenceColumns'],
  ['מ16 · איכות מול עלות', SURFACES.m16, m16, 'qualityCost', null, 'scatterBasis', 'tableSort'],
  ['מ17 · הוגנות השיבוץ', SURFACES.m17, m17, 'fairness', null, 'giniBasis', null],
]

describe('מיקום שכבת-ההטמעה (רמה 2)', () => {
  it.each(HINT_PLACEMENT)(
    '%s · כל רמז מתחת לבלוק שהוא מסביר',
    async (_name, surface, make, slug, beforeChartKey, chartFooterKey, beforeTableKey) => {
      callReport.mockResolvedValue(make())
      renderTab(surface)
      const purpose = await screen.findByTestId(`hint-reports.${slug}.purpose`)
      const soWhat = screen.getByTestId('report-so-what')
      const tiles = screen.getByTestId('report-tiles')
      const table = screen.getAllByTestId('report-table-card')[0]
      const definitions = screen.getByTestId('report-definitions')
      const figure = screen.getAllByTestId('chart-figure')[0]

      // ‏⑩א · `renderAfterSoWhat` — **אחרי** שורת-"אז מה" ו**לפני** רצועת-האריחים.
      // 🔴 זו בדיוק ההיפוך שהמעבר תיקן: קודם הרמז ישב מעל שורת-האוכלוסייה שהוא מסביר.
      expect(follows(soWhat, purpose)).toBe(true)
      expect(follows(purpose, tiles)).toBe(true)

      if (beforeChartKey) {
        // רמז-אריח — מתחת לרצועת-האריחים, לפני הגרף.
        const hint = screen.getByTestId(`hint-reports.${slug}.${beforeChartKey}`)
        expect(follows(tiles, hint)).toBe(true)
        expect(follows(hint, figure)).toBe(true)
      }
      if (chartFooterKey) {
        // רמז-קריאת-גרף — **מתחת לדמות ובתוך כרטיס-הגרף**.
        const hint = screen.getByTestId(`hint-reports.${slug}.${chartFooterKey}`)
        expect(follows(figure, hint)).toBe(true)
        expect(figure.closest('[data-testid^="chart-card-"]').contains(hint)).toBe(true)
      }
      if (beforeTableKey) {
        const hint = screen.getByTestId(`hint-reports.${slug}.${beforeTableKey}`)
        expect(follows(hint, table)).toBe(true)
        expect(follows(screen.getByTestId('report-table-title'), hint)).toBe(true)
      }
      // ✏️ 23/09/2026 — **אין עוד בלוק-מונחים בתחתית הדף** (התוכנית §4ה, 2.1 · 2.3): רמז שאינו
      // צמוד לרכיב שהוא מסביר הוא מילון, לא עזרה. הבדיקה נועלת שהקיר לא חוזר.
      expect(screen.queryAllByTestId(/^hint-reports\..+\.term\./)).toHaveLength(0)
      expect(definitions).toBeInTheDocument()
    },
  )
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

  it('אין מפתח בקובץ-הקופי שאיש אינו שותל — ו-14 הם כל מה שהלשונית שותלת', () => {
    for (const key of Object.keys(M11_HOSTESSES_COPY)) {
      expect(used.has(key), `מפתח שאינו בשימוש: ${key}`).toBe(true)
    }
    // ✏️ 23/09/2026 — 38 ⇒ 14: המונחים ירדו מהשכבה (התוכנית §4ה, 2.3 · 2.5).
    expect(Object.keys(M11_HOSTESSES_COPY)).toHaveLength(14)
    expect(used.size).toBe(14)
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
