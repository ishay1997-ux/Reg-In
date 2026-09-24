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
import { readFileSync, readdirSync } from 'node:fs'

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
import { EXPORT_NO_APPROVED_RUN } from '@/lib/reportsExport'

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
        sub: 'ימים מאז האירוע האחרון (חציון) — מרוצים מול לא-מרוצים',
        window: 'כל הזמנים',
        compare: { value: 212, label: 'לקוחות לא-מרוצים', direction: 'flat' },
        target: { tab: 'לקוחות', report: 'report_m20_satisfaction', drill: null },
      },
      {
        key: 'biggest_negative_is_other',
        label: 'הסיבה השלילית הגדולה אינה קטגוריה',
        value: 33,
        format: 'int',
        sub: 'משובים שליליים שתויגו "אחר" מתוך ⁦70⁩',
        window: 'כל הזמנים',
        // i2 — היה `{value: 33, label: 'פילוח לפי שנה', direction: 'up'}`: חזרה על ערך-האריח
        // עם ▲ מומצא, במקום הפילוח שהמוקאפ מצייר באותה שורה.
        compare: {
          value: '⁦2024⁩: ⁦4⁩ · ⁦2025⁩: ⁦19⁩ · ⁦2026⁩: ⁦10⁩',
          label: 'פילוח לפי שנה (השנה הנוכחית חלקית)',
          direction: 'flat',
        },
        target: { tab: 'לקוחות', report: 'report_m22_notes', drill: null },
      },
      {
        key: 'payment_cadence_by_type',
        label: 'קצב-התשלום תלוי בסוג הלקוח',
        value: 69,
        format: 'days',
        sub: 'חציון ימים מחשבונית לתשלום, לפי סוג הלקוח',
        window: 'כל הזמנים',
        // i2 — בלי `format` חצי-ההשוואה ירש `days` והדפיס "⁦675⁩ ימים" על ספירת-חשבוניות.
        compare: {
          value: 675,
          label: 'על ⁦675⁩ חשבוניות ששולמו',
          format: 'int',
          direction: 'flat',
        },
        target: { tab: 'כספים', report: 'report_m09_aging', drill: null },
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
      // i2 — ציר-הזמן נושא שם-חודש עברי ולא `2026-01`.
      xKey: 'label',
      series: [{ key: 'avg_score', label: 'ממוצע' }],
      data: [{ label: 'ינואר ⁦2026⁩', month: '2026-01', avg_score: 4.06, n: 18 }],
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
      // i2 — `avg_feedback:ratio` (ששיטח ⁦4.63⁩ ל-⁦4.6⁩) הוחלף בזוג שהשרת בונה.
      { key: 'avg_feedback_pair', label: 'ממוצע המשוב שלו', format: 'text', align: 'end' },
      { key: 'last_event', label: 'אירוע אחרון', format: 'date', align: 'start' },
    ],
    rows: [
      {
        drill_key: { kind: 'customer', id: 401 },
        customer_id: 401,
        company_name: 'אלפא סיסטמס בע"מ',
        customer_type: 'private_company',
        revenue_12m: 635764.43,
        avg_feedback: 4.63,
        avg_feedback_pair: '⁦4.63⁩ (⁦n=129⁩)',
        last_event: '2026-09-15',
      },
    ],
    so_what:
      'לפתוח את "שביעות רצון" — 10 הלקוחות הלא-מרוצים לא הזמינו כבר 219 ימים, מול 22 אצל המרוצים.',
    definitions: 'הגדרות: ממוצע שביעות-רצון = ממוצע ציון 1–5.',
  })

// G3/I1: גרף-הסיבות חוזר `layout: 'horizontal'`. ✏️ 23/09/2026 (מיגרציית-הטקסט L1): גרף-השליליות
// ("מה מכעיס") וגרף "שיעור המרוצים לפי שנה" נמחקו מהשרת בהכרעת-ישי — המטען כאן משקף את השרת החדש.
const chartOf = (title, extra = {}) => ({
  type: 'bar',
  title,
  xKey: 'reason',
  series: [{ key: 'n', label: 'משובים' }],
  data: [{ reason: 'אחר', n: 10 }],
  domain: null,
  refLines: [],
  unit: 'משובים',
  ...extra,
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
      chartOf('התפלגות הציונים', { xKey: 'score', filter_key: false, data: [{ score: 2, n: 3 }] }),
      chartOf('מה משמח', { layout: 'horizontal', filter_key: false }),
    ],
    columns: [
      { key: 'company_name', label: 'לקוח', format: 'text', align: 'start' },
      { key: 'final_event_date', label: 'תאריך', format: 'date', align: 'start' },
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
        negative_reason: 'אחר',
        feedback_notes: null,
      },
    ],
    so_what: 'לקרוא את 10 המשובים שתויגו "אחר" — יותר מכל הסיבות האחרות יחד, ואיש עוד לא קרא אותם.',
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
        compare: {
          value: null,
          label: 'זהו סכום שכבר הורווח — לא סכום שצפוי להיאבד',
          direction: 'flat',
        },
        target: null,
      },
      {
        key: 'only_personal_cadence',
        label: 'נתפסים רק בקצב האישי',
        value: 3,
        format: 'int',
        sub: '⁦161,009 ₪⁩ בשנה האחרונה',
        window: 'נכון ל-16/09',
        // ✏️ 25/09/2026 (`20260925000100`): הצורה שהמסד שולח — מה שכלל-120-הימים מוצא לבדו, בלי כיוון.
        compare: { value: 11, label: 'כלל «רדום» לבדו מוצא', direction: null },
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
      // I1 — העמודה שתווית שלה הבטיחה שני מספרים מחזירה עכשיו את שניהם, כמחרוזת-שרת אחת.
      { key: 'score_pair', label: 'ציון אחרון · ממוצעו', format: 'text', align: 'end' },
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
        score_pair: '⁦2⁩ · ⁦2.90⁩ (⁦n=10⁩)',
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
        score_pair: '⁦3⁩ · ⁦3.20⁩ (⁦n=5⁩)',
        flag: 'מתרחק · גם רדום',
      },
    ],
    // שורת-"אז מה" של מ21 נושאת סכום — וזה הטקסט שהדליף ₪ לזהות ממוסכת.
    so_what:
      'להתקשר השבוע לענבר אשכנזי מגלובל שיפינג בע"מ — שתיהן שקטו, יחד ⁦122,124 ₪⁩ בשנה האחרונה.',
    definitions: 'הגדרות: מתרחק = אין אירוע עתידי וגם פי 1.5 מהמרווח הרגיל.',
  })

// ‏`meta.run` אחרי G2-1: איחוד שתי הריצות המאושרות. ⚠️ `sent_count` כאן הוא **סכום**
// (⁦812⁩) ולא מכנה — הפס לעולם אינו מחלק בו.
// ✏️ **‏17/09/2026: `approved_by` הוא שם ולא כתובת.** מיגרציית J1 מצרפת
// ‏`users.full_name` (`coalesce(nullif(btrim(u.full_name),''), r.approved_by)`), והערך
// כאן הוא **מה שנמדד חי** באותו יום מול `report_m22_notes` כ-CEO: `ישי אטיאס`,
// ‏`run_count: 2`. הכתובת הגולמית לא אבדה — היא `approved_by_email`, והפס אינו מדפיס אותה.
const APPROVED_RUN = {
  run_id: 6,
  status: 'done',
  run_count: 2,
  model: 'gemini-3.5-flash-lite + gemini-3.8-flash',
  approved_at: '2026-09-16T04:28:26.605176+00:00',
  approved_by: 'ישי אטיאס',
  approved_by_email: 'ishay1997@gmail.com',
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
        // i2 — חצי-ההשוואה נושא את הפילוח עצמו כמחרוזת, ולא חוזר על ערך-האריח.
        compare: {
          value: '⁦2024⁩: ⁦4⁩ · ⁦2025⁩: ⁦19⁩ · ⁦2026⁩: ⁦10⁩',
          label: 'פילוח לפי שנה (השנה הנוכחית חלקית)',
          direction: 'flat',
        },
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
        // i2 — היה 'יימדד אחרי הריצה הראשונה' על אריח שכבר מציג ⁦25⁩. עכשיו: אין השוואה.
        compare: null,
        target: null,
      },
    ],
    // העמודות חוזרות **גם בלי ריצה מאושרת** — נמדד בגוף ה-SQL: `'columns',
    // jsonb_build_array(...)` אינו מסועף על הריצה. זה מה שמאפשר ל-`renderBeforeTable`
    // לירות במצב-הריק, ושם יושב עכשיו בלוק "טרם אושרה ריצת-ניתוח".
    columns: [
      { key: 'company_name', label: 'לקוח', format: 'text', align: 'start' },
      { key: 'final_event_date', label: 'תאריך', format: 'date', align: 'start' },
      { key: 'feedback_notes', label: 'ההערה שנכתבה', format: 'text', align: 'start' },
      { key: 'model_topics', label: 'נושא (מודל)', format: 'text', align: 'start' },
      {
        key: 'red_flag',
        label: 'דגל אדום',
        format: 'text',
        align: 'start',
        sorted: 'descending',
      },
    ],
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
    expect(onDrill).toHaveBeenCalledWith({
      tab: 'לקוחות',
      report: 'report_m20_satisfaction',
      drill: null,
    })

    fireEvent.click(screen.getByTestId('report-tile-link-payment_cadence_by_type'))
    expect(onDrill).toHaveBeenLastCalledWith({
      tab: 'כספים',
      report: 'report_m09_aging',
      drill: null,
    })
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

  // 🔬 **מה ש-i2 תיקן — נבדק על המסך ולא על המטען.** שלושת אלה היו ממצאי סבב-הביקורת
  // בבעלות ה-RPC, והם הסוג שנראה תקין במטען ושקרי באריח: פורמט שנורש מהאריח, חצי-השוואה
  // שחוזר על הערך, ודיוק שהשתטח. **בדיקה שקוראת את המטען לא הייתה תופסת אף אחד מהם.**
  it('i2 · חצי-ההשוואה של אריח קצב-התשלום הוא ספירה ולא "ימים", והפילוח מציג שלוש שנים', async () => {
    callReport.mockResolvedValue(overviewPayload())
    renderTab(SURFACES.מ19)

    const payment = await screen.findByTestId('report-tile-payment_cadence_by_type')
    // הערך עצמו ימים; חצי-ההשוואה ספירת-חשבוניות — ולכן "⁦675⁩ ימים" שם הוא הפגם.
    expect(payment).toHaveTextContent('⁦69⁩ ימים')
    const compare = within(payment).getByTestId('kpi-compare')
    expect(compare).toHaveTextContent('על ⁦675⁩ חשבוניות ששולמו')
    expect(compare.textContent).not.toMatch(/675.{0,3}ימים/)

    // הפילוח לפי שנה נושא את **שלוש השנים**, ולא חוזר על ערך-האריח עם ▲ מומצא.
    const other = within(screen.getByTestId('report-tile-biggest_negative_is_other')).getByTestId(
      'kpi-compare',
    )
    expect(other).toHaveTextContent('⁦2024⁩')
    expect(other).toHaveTextContent('⁦2025⁩')
    expect(other).toHaveTextContent('⁦2026⁩')
    expect(other).toHaveTextContent('פילוח לפי שנה')
    // ▲/▼ הוא סימן-כיוון; על פילוח אין כיוון, ולכן `direction: 'flat'` אינו מצייר חץ.
    expect(other.textContent).not.toContain('▲')
  })

  it('i2 · ממוצע-המשוב בטבלה מוצג בשתי ספרות ולא משוטח לאחת', async () => {
    callReport.mockResolvedValue(overviewPayload())
    renderTab(SURFACES.מ19)
    const row = await screen.findByTestId('report-row-drillable')
    // העמודה `ratio` הציגה ⁦4.6⁩ במקום ⁦4.63⁩ שבמוקאפ; i2 מחזיר זוג-מחרוזת עם מונה-המדגם.
    expect(row).toHaveTextContent('⁦4.63⁩')
    expect(row).toHaveTextContent('n=129')
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
  // ✏️ 23/09/2026 — ארבעה ⇐ שניים: "מה מכעיס" ו"שיעור המרוצים לפי שנה" נמחקו (הכרעת-ישי, תוכנית §6).
  it('מצייר את שני הגרפים שנשארו', async () => {
    callReport.mockResolvedValue(satisfactionPayload())
    renderTab(SURFACES.מ20)
    for (const title of ['התפלגות הציונים', 'מה משמח']) {
      expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
    }
    expect(screen.queryByRole('heading', { name: 'מה מכעיס' })).toBeNull()
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
  it('אין באנר-הסבר במצב 0 (תקן-הכרטיס §4ד); איש-הקשר נושא גם טלפון', async () => {
    callReport.mockResolvedValue(driftingPayload())
    renderTab(SURFACES.מ21)
    const rows = await screen.findAllByTestId('report-row-drillable')
    // ✂️ 23/09/2026 — באנר שתי-השיטות נמחק: מספריו בכרטיסים (L5), ההסבר ברמז `drifting.why`.
    expect(screen.queryByTestId('drifting-two-methods')).toBeNull()
    expect(rows[0]).toHaveTextContent('ענבר אשכנזי')
    // 🔴 מקף בלתי-שביר (`‑`) ולא ASCII — נמדד בדפדפן שהתא הצר שבר את המספר לשתי
    // שורות (*"· -055"* / *"1794584"*). המספר נשאר שלם, והמקף נראה זהה.
    expect(rows[0]).toHaveTextContent('055‑1794584')
    expect(rows[0].textContent).not.toContain('055-1794584')
    expect(rows[0]).toHaveTextContent('מתרחק בלבד')
  })

  // 🔤 הכרעה ש1 (התוכנית §4ג): משפט-ההרשאה נאמר רק כשיש באמת סכום מוסתר.
  const MONEY_GATE_NOTE = 'עמודות ואריחי ה-₪ בדף זה כפופים להרשאת מודול כספים.'
  const withGateNote = () => {
    const payload = driftingPayload()
    return { ...payload, meta: { ...payload.meta, notes: ['הערה אחרת.', MONEY_GATE_NOTE] } }
  }

  it('ש1 · מי שרואה את הסכומים — משפט-ההרשאה אינו על המסך, והערה אחרת נשארת', async () => {
    callReport.mockResolvedValue(withGateNote())
    renderTab(SURFACES.מ21)
    const notes = await screen.findByTestId('report-meta-notes')
    expect(notes).toHaveTextContent('הערה אחרת.')
    expect(notes).not.toHaveTextContent('כפופים להרשאת')
  })

  it('ש1 · מי שהסכומים מוסתרים ממנה — משפט-ההרשאה על המסך', async () => {
    permissions = PROJECTS
    callReport.mockResolvedValue(withGateNote())
    renderTab(SURFACES.מ21)
    expect(await screen.findByTestId('report-meta-notes')).toHaveTextContent('כפופים להרשאת')
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
    // ✏️ 25/09/2026 (`20260925000100`): ההשוואה אומרת מה שהכלל מוצא, ולא "ללא שינוי".
    const personalCompare = within(personal).getByTestId('kpi-compare')
    expect(personalCompare).toHaveTextContent('כלל «רדום» לבדו מוצא: ')
    expect(personalCompare).toHaveTextContent('11')
    expect(personalCompare).not.toHaveTextContent('ללא שינוי')

    // 🔴 **הדליפה שסבב-הביקורת תפס (ממצא 1, חוסם):** הדף הסתיר את הסכום באריח, בשורת-המשנה
    // ובעמודה — והדפיס אותו בשורת-"אז מה" שמעליהם. אין ₪ בשום מקום בדף הזה לזהות הזו.
    const soWhat = screen.getByTestId('report-so-what')
    expect(soWhat.textContent).not.toContain('₪')
    expect(soWhat).toHaveTextContent(MASKED_TEXT)
    expect(soWhat).toHaveTextContent('להתקשר השבוע לענבר אשכנזי')
    expect(screen.getByTestId('report-drifting').textContent).not.toContain('122,124')

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

  it('🔒 הכרעת-המתזמר — אותו מיסוך-₪ חל גם על מ19, ולא רק על מ21', async () => {
    permissions = PROJECTS
    callReport.mockResolvedValue(overviewPayload())
    renderTab(SURFACES.מ19)

    const row = await screen.findByTestId('report-row-drillable')
    expect(row).toHaveTextContent(MASKED_TEXT)
    expect(row.textContent).not.toContain('635,764')
    // אותה עמודה בדיוק הופיעה ממוסכת במ21 וגלויה במ19 — לאותה זהות. עכשיו אחיד.
    expect(screen.getByRole('columnheader', { name: /הכנסת 12 החודשים/ })).not.toHaveAttribute(
      'aria-sort',
    )
    // ומה שאינו כסף נשאר גלוי: התווית העברית של סוג-הלקוח, והתאריך.
    expect(row).toHaveTextContent('חברה פרטית')
    expect(row).toHaveTextContent('15/09/2026')
  })

  // 🔒 **§7.100 · הכרעת ישי 17/09/2026 — המיסוך עבר אל תוך המסד** (מיגרציה J3): מ19 ומ21
  // מחזירות `null` בשדות-הכסף ו-`meta.money_masked = true` למי שאינה `view`/`edit` על
  // 'כספים'. 🔑 **והשאלה שהבדיקה הזו סוגרת אינה "האם השרת ממסך"** — אותה מודדת בדיקה
  // חתומה מול המסד — **אלא האם המסך עדיין אומר את המשפט הנכון כשהערך כבר חסר.**
  // ‏`KpiTile` מבדיל בין *"לא זמין בתפקידך"* (חסימת-הרשאה) לבין `—` (אין נתון), וההבדל
  // נגזר מ-`format` ומעמודת-הכסף — **לא מהערך**. אילו הוא נגזר מהערך, הדף היה מתחלף
  // ל-`—` ברגע שהשרת התחיל להחזיר `null`, כלומר *"אין נתון"* במקום *"חסום לך"*.
  it('🔒 §7.100 · השרת כבר החזיר null — המסך עדיין אומר "לא זמין בתפקידך" ולא "—"', async () => {
    permissions = PROJECTS
    const masked = driftingPayload()
    masked.meta = { ...masked.meta, money_masked: true }
    masked.tiles = masked.tiles.map((tile) =>
      tile.format === 'money' ? { ...tile, value: null, sub: null, detail: null } : tile,
    )
    masked.rows = masked.rows.map((row) => ({ ...row, revenue_12m: null }))
    masked.so_what = 'להתקשר השבוע לענבר אשכנזי — יחד (לא זמין בתפקידך) בשנה האחרונה.'
    callReport.mockResolvedValue(masked)
    renderTab(SURFACES.מ21)

    const tile = await screen.findByTestId('report-tile-marked_revenue_12m')
    expect(tile).toHaveTextContent(MASKED_TEXT)
    expect(tile.textContent).not.toContain('—')
    const rows = screen.getAllByTestId('report-row-drillable')
    expect(rows[0]).toHaveTextContent(MASKED_TEXT)
    expect(screen.getByTestId('report-drifting').textContent).not.toContain('₪')
  })

  it('🔒 §7.100 · מ19 · עמודת-הכסף שחזרה null נקראת "לא זמין בתפקידך", לא תא ריק', async () => {
    permissions = PROJECTS
    const masked = overviewPayload()
    masked.meta = { ...masked.meta, money_masked: true }
    masked.rows = masked.rows.map((row) => ({ ...row, revenue_12m: null }))
    callReport.mockResolvedValue(masked)
    renderTab(SURFACES.מ19)

    const row = await screen.findByTestId('report-row-drillable')
    expect(row).toHaveTextContent(MASKED_TEXT)
    expect(row.textContent).not.toContain('635,764')
    // ומה שאינו כסף נשאר גלוי — כדי שהבדיקה לא תעבור על מסך ריק.
    expect(row).toHaveTextContent('חברה פרטית')
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
  it('מ25 · פס-הניתוח יושב בין שורת-"אז מה" לאריחים, כסדר המוקאפ', async () => {
    callReport.mockResolvedValue(notesPayload())
    renderTab(SURFACES.מ22)
    const bar = await screen.findByTestId('m25-run-bar')
    const follows = (a, b) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    // המוקאפ של דף מ22: `so-what → רמז א → runbar → רמז ב → אריחים`.
    expect(follows(screen.getByTestId('report-so-what'), bar)).toBe(true)
    expect(follows(screen.getByTestId('hint-reports.notes.why'), bar)).toBe(true)
    expect(follows(bar, screen.getByTestId('hint-reports.notes.runGate'))).toBe(true)
    expect(follows(bar, screen.getByTestId('report-tiles'))).toBe(true)
  })

  it('ריצה מאושרת — הפס אומר מי אישר ומתי, והטבלה מציגה עברית ולא בוליאני', async () => {
    callReport.mockResolvedValue(notesPayload())
    renderTab(SURFACES.מ22)
    expect(await screen.findByTestId('m25-run-text')).toHaveTextContent('16/09/2026')
    // 🔤 שם, לא כתובת-התחברות (J1) — וכתובת-הדוא"ל **אינה** עולה למסך.
    // ✏️ 24/09/2026 (D1): שם-המאשרת עבר ל-ⓘ של הפס.
    expect(screen.getByTestId('m25-run-details')).toHaveTextContent('ישי אטיאס')
    expect(screen.getByTestId('m25-run-text')).not.toHaveTextContent('ishay1997@gmail.com')
    // 🎨 ממצא 14 — המוקאפ שומר את הענבר ל-`.runbar.warn`; מצב מיושב שאין בו מה לעשות
    // מצויר לבן. פס שענבר תמיד — אינו אומר דבר כשהוא באמת צריך לומר.
    expect(screen.getByTestId('m25-run-bar')).toHaveAttribute('data-tone', 'plain')
    const row = screen.getByTestId('report-row-drillable')
    expect(row).toHaveTextContent('איכות תגים · ניהול לקוי')
    expect(row).toHaveTextContent('כן')
    expect(row).not.toHaveTextContent('true')
    expect(screen.queryByTestId('m22-no-run')).toBeNull()
  })

  // ✏️ **פריט [C5] סבב ב' — התאמת-מספר בפס** (17/09/2026). ‏`run_count` נמדד חי = ⁦2⁩,
  // והפס הכריז *"מציג את **הריצה**"* ביחיד על שתי ריצות שאוחדו ב-G2-1. שתי הבדיקות
  // נועלות את **שני** הענפים, כי כ12 נופל דווקא בקצה: *"‏1 ריצות"*.
  // ✏️ 24/09/2026 (ליטושי-הכנס, D1 — "AI גלוי"): השורה היא *"סווג בעזרת AI · <תאריך>"* (חותמת
  // העדכניות של ⚖️5-א נשארת גלויה), ומספר-הריצות ושם-המאשרת עברו ל-ⓘ. שני ענפי-המספר נשמרו שם.
  it('שתי ריצות מאושרות — השורה אומרת AI ותאריך, וה-ⓘ אומר כמה ושהתאריך של האחרונה', async () => {
    callReport.mockResolvedValue(notesPayload())
    renderTab(SURFACES.מ22)
    const text = await screen.findByTestId('m25-run-text')
    expect(text).toHaveTextContent('סווג בעזרת AI · ⁦16/09/2026⁩')
    expect(text).not.toHaveTextContent('אושרה ע"י')
    const details = screen.getByTestId('m25-run-details')
    expect(details).toHaveTextContent('⁦2⁩ ריצות-ניתוח מאושרות; התאריך הוא של האחרונה')
    expect(details).toHaveTextContent('אושרה ע"י ישי אטיאס')
  })

  it('ריצה מאושרת אחת — "ריצת-ניתוח מאושרת אחת", ולא "‏1 ריצות"', async () => {
    callReport.mockResolvedValue(
      notesPayload({ run: { ...APPROVED_RUN, run_count: 1, runs: undefined } }),
    )
    renderTab(SURFACES.מ22)
    await screen.findByTestId('m25-run-text')
    const details = screen.getByTestId('m25-run-details')
    expect(details).toHaveTextContent('ריצת-ניתוח מאושרת אחת')
    expect(details).not.toHaveTextContent('ריצות')
  })

  it('D1 — במצב המאושר, מי שיש לה `edit` רואה "הריצי שוב"; ו-`noop` משאיר את שורת-ה-AI', async () => {
    callReport.mockResolvedValue(notesPayload())
    renderTab(SURFACES.מ22)
    const button = await screen.findByTestId('m25-run-button')
    expect(button).toHaveTextContent('הריצי שוב')
    invoke.mockResolvedValueOnce({ data: { status: 'noop' }, error: null })
    fireEvent.click(button)
    await waitFor(() =>
      expect(screen.getByTestId('m25-run-sub')).toHaveTextContent('אין הערות חדשות לסיווג.'),
    )
    expect(invoke).toHaveBeenCalledWith('classify-feedback', { body: { action: 'start' } })
    expect(screen.getByTestId('m25-run-text')).toHaveTextContent('סווג בעזרת AI')
  })

  it('D1 — צופה בלי `edit` רואה את שורת-ה-AI, בלי כפתור', async () => {
    permissions = PROJECTS
    callReport.mockResolvedValue(notesPayload())
    renderTab(SURFACES.מ22)
    expect(await screen.findByTestId('m25-run-text')).toHaveTextContent('סווג בעזרת AI')
    expect(screen.queryByTestId('m25-run-button')).toBeNull()
  })

  // 🪤 מטען ישן שאין בו `run_count` כלל — הנפילה-לאחור היא `runs.length`, ולא ⁦1⁩ שקרי.
  it('מטען בלי run_count נופל אחורה לאורך runs[]', async () => {
    callReport.mockResolvedValue(
      notesPayload({
        run: {
          ...APPROVED_RUN,
          run_count: undefined,
          runs: [{ run_id: 6 }, { run_id: 5 }, { run_id: 3 }],
        },
      }),
    )
    renderTab(SURFACES.מ22)
    await screen.findByTestId('m25-run-text')
    expect(screen.getByTestId('m25-run-details')).toHaveTextContent('⁦3⁩ ריצות-ניתוח מאושרות')
  })

  it('🔴 `run_in_progress` במצב `failed` אינו "ריצה בתהליך" — הדף מתנהג כאילו אין אחת', async () => {
    callReport.mockResolvedValue(notesPayload({ run: null }))
    renderTab(SURFACES.מ22)
    // המטען נושא את ריצה 4 (`failed`) — ובכל זאת:
    expect(await screen.findByTestId('m25-run-text')).toHaveTextContent('הערות טרם סווגו')
    expect(screen.getByTestId('m25-run-button')).toHaveTextContent('הרץ ניתוח')
    expect(screen.getByTestId('m25-run-button')).toBeEnabled()
    expect(screen.getByTestId('m25-run-bar')).toHaveAttribute('data-tone', 'warn')
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
    const noRun = screen.getByTestId('m22-no-run')
    expect(noRun).toHaveTextContent('טרם אושרה ריצת-ניתוח')
    // ממצא 16 — ההסבר יושב **מעל** הטבלה שהוא מסביר, כמו ב-`basebanner` של המוקאפ,
    // ולא אחרי שורת-ההגדרות בתחתית הדף.
    expect(
      Boolean(
        noRun.compareDocumentPosition(screen.getByTestId('report-table-card')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true)
    // ✏️ **17/09/2026 — ת4ב:** הכפתור פעיל תמיד והכיתוב עבר לתוך החלון; החסימה נבדקת
    // פר-דוח נבחר. הנוסח הנעול עצמו נבדק ב-`reportsExport.test.js` (זהות-בייט) וב-
    // `ExportDialog.test.jsx` (מוצג במקום שורת-הכמות, והייצוא מנוטרל).
    expect(screen.queryByTestId('reports-export-file')).toBeNull()
    expect(screen.getByTestId('reports-export-button')).toBeEnabled()
    // הרמז ⑩ג יושב **בענף המצב-הריק בלבד**.
    expect(screen.getByTestId('hint-reports.notes.tilesBasis')).toBeInTheDocument()
  })

  it('צופה בלי `edit` על דו"חות — בלי כפתור, עם המשפט של הכרטיס', async () => {
    permissions = PROJECTS
    callReport.mockResolvedValue(notesPayload({ run: null }))
    renderTab(SURFACES.מ22)
    // §1.5 — ציווי בנקבה. הכרטיס כתב "פנה"; כלל-הניסוח גובר, ו-C2 מתיר בדיוק את זה.
    expect(await screen.findByTestId('m25-run-text')).toHaveTextContent(
      'טרם אושרה ריצת-ניתוח — פני למנכ"ל',
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

  // 🔴 **B-2 (אודיט-הסגירה 17/09/2026, ממצא F-11) — ריצה שפועלת דווחה כריצה שנכשלה.**
  // ‏`index.ts:825–828` עונה על "כבר פועלת" ב-HTTP **409** עם גוף שנושא **גם** `error`
  // **וגם** `status:'running'`. ‏`classify()` בדקה `status` תחילה ⇒ המצב נכנס ל-`local`,
  // ו-`localState` לא הכירה `running` ⇒ נפילה לענף האחרון: *"הריצה נכשלה ולא נשמרו בה
  // סיווגים"* עם כפתור **פעיל** שיחזיר 409 שוב. **טענה עובדתית שקרית על הדאטה של
  // המשתמשת, בזמן שהשורות נכתבות.**
  it('409 "ריצת-ניתוח כבר פועלת" מציג את מצב-הריצה, ולא ריצה שנכשלה', async () => {
    callReport.mockResolvedValue(notesPayload({ run: null }))
    renderTab(SURFACES.מ22)
    invoke.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: {
          json: async () => ({ error: 'ריצת-ניתוח כבר פועלת.', run_id: 1, status: 'running' }),
        },
      },
    })
    fireEvent.click(await screen.findByTestId('m25-run-button'))

    // 🔤 **ההמתנה היא על נוסח-השרת ולא על "מסווג…"** — אותו קבוע ש-`serverRunState` כבר
    // משתמש בו, ולא ניסוח שני. ⚠️ ובכוונה: *"מסווג…"* מופיע גם במצב-הביניים `pending`
    // (עם שורת-משנה אחרת), ולכן המתנה עליו הייתה נתפסת על מצב חולף ולא על התוצאה.
    await waitFor(() =>
      expect(screen.getByTestId('m25-run-bar')).toHaveTextContent('ריצת-ניתוח כבר פועלת.'),
    )
    expect(screen.getByTestId('m25-run-text')).toHaveTextContent('מסווג…')
    expect(screen.getByTestId('m25-run-text')).not.toHaveTextContent('הריצה נכשלה')
    // ⚠️ **מנוטרל ואינו נעדר** (מצב 2 של מ25) — והלחיצה השנייה אינה אפשרית.
    expect(screen.getByTestId('m25-run-button')).toBeDisabled()
    expect(screen.getByTestId('m25-run-button')).toHaveTextContent('הרץ ניתוח')
    // 🚫 וריצה שפועלת אינה תקלה: אין משבצת-שגיאה אדומה.
    expect(screen.queryByRole('alert')).toBeNull()
  })

  // 🔴 **T11 — מסלול-הרשת היחיד במודול שלא השאיר עקבה.** כשאין גוף-תשובה לקרוא, המסך
  // מקבל את הנוסח הכללי (וזה נכון) — אבל שגיאת-ה-supabase עצמה נבלעה ב-`catch` ריק,
  // ואי-אפשר היה לדעת אם הפונקציה לא ענתה כלל או ענתה בגוף שאינו JSON.
  it('כשל-רשת בלי גוף-תשובה — הנוסח הכללי על המסך, והשגיאה נרשמת לקונסול', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    callReport.mockResolvedValue(notesPayload({ run: null }))
    renderTab(SURFACES.מ22)
    invoke.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Failed to fetch',
        context: {
          json: async () => {
            throw new SyntaxError('Unexpected end of JSON input')
          },
        },
      },
    })
    fireEvent.click(await screen.findByTestId('m25-run-button'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'הניתוח נכשל. נסי שוב, ואם זה חוזר — פני למנכ"ל.',
    )
    expect(consoleError).toHaveBeenCalled()
    expect(String(consoleError.mock.calls[0][0])).toContain('classify-feedback')
    consoleError.mockRestore()
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
      'חסר פרמטר מערכת: מכפיל מרווח ללקוח מתרחק',
    )
  })

  it('טבלה בלי שורות — הכותרות נשארות, אין שורות-נתונים, והייצוא מנוטרל עם "אין שורות לייצא"', async () => {
    callReport.mockResolvedValue({ ...overviewPayload(), rows: [] })
    renderTab(SURFACES.מ19)
    await screen.findByTestId('reports-export-button')
    expect(screen.getByTestId('reports-export-button')).toBeEnabled()
    expect(screen.queryByTestId('reports-export-file')).toBeNull()

    // 🔴 **וזה הגבול שהבדיקה נועלת, ולא הצלחה:** האריחים והגרף שורדים ⇒ `hasContent` נשאר
    // אמת ⇒ מעטפת-הריק אינה נכנסת, והטבלה מציירת **כותרות בלי גוף**. הכרטיס (שורה 173)
    // דורש *"ריק-אחרי-סינון, לא שורה ריקה"*. ‏`ReportTable` הוא רכיב משותף ואין לו ענף-ריק
    // — ‏**ממצא 7 בסבב-הביקורת, בבעלות המעטפת.** נעול כאן כדי שהתיקון שם ייתפס כאן.
    expect(screen.getByTestId('report-table-card')).toBeInTheDocument()
    expect(screen.queryAllByTestId('report-row')).toHaveLength(0)
    expect(screen.queryAllByTestId('report-row-drillable')).toHaveLength(0)
    expect(screen.queryByTestId('reports-envelope-empty')).toBeNull()
  })

  it('כל מפתח-הטמעה שהלשונית משתמשת בו קיים בקובץ-הקופי, וכל 12 המפתחות בשימוש', () => {
    // 🔑 נתיב יחסי ל-`cwd` (שורש-הריפו, כפי ש-Vitest מדפיס בראש הריצה) ולא
    // `import.meta.url` — הוא אינו `file:` תחת ה-runner הזה, וזה הפיל את הבדיקה.
    // 🔴 **כל קבצי-הלשונית, לא רק אחד** (ממצא 18): הסריקה קראה את `CustomerSurface.jsx`
    // בלבד, ולכן מפתח שגוי ב-`AnalysisRunBar.jsx` או ב-`CustomersTab.jsx` היה מרנדר `null`
    // בשקט בייצור **והסוויטה הייתה ירוקה**. שוויון דו-כיווני מול קובץ-הקופי נשמר.
    const dir = 'src/modules/11_reports/tabs/customers'
    const files = [
      'src/modules/11_reports/tabs/CustomersTab.jsx',
      ...readdirSync(dir)
        .filter((name) => name.endsWith('.jsx'))
        .map((name) => `${dir}/${name}`),
    ]
    expect(files.length).toBeGreaterThan(2)
    const used = new Set()
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
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
    expect(screen.queryByTestId('drifting-two-methods')).toBeNull()
    expect(screen.getByTestId('report-tiles')).toBeInTheDocument()
    expect(screen.getAllByTestId('report-row-drillable').length).toBeGreaterThan(0)
  })

  it('ברמה 2 — שלושת הרמזים מרונדרים **בעוגנים שלהם**, לא רק על הדף', async () => {
    callReport.mockResolvedValue(driftingPayload())
    renderTab(SURFACES.מ21)
    const why = await screen.findByTestId('hint-reports.drifting.why')
    const basis = screen.getByTestId('hint-reports.drifting.revenueBasis')
    const tableSort = screen.getByTestId('hint-reports.drifting.tableSort')

    // 🔑 **מיקום ולא נוכחות** — רמז שנחת אחרי הטבלה מסביר משהו שכבר נקרא. `Node.DOCUMENT_
    // POSITION_FOLLOWING` = הארגומנט מופיע **אחרי** האלמנט בסדר-המסמך.
    const follows = (a, b) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

    const soWhat = screen.getByTestId('report-so-what')
    const tiles = screen.getByTestId('report-tiles')
    const table = screen.getByTestId('report-table-card')

    // ⑩א · **שני חצאי-העוגן, סוף-סוף:** *"מתחת לשורת-אז-מה, מעל האריחים"*. עד
    // ‏HEAD fb7bcd26 החצי הראשון לא היה בר-קיום — `renderTop` יושב מעל שורת-האוכלוסייה —
    // והבדיקה נעלה רק את החצי השני. הסלוט `renderAfterSoWhat` נולד, הרמז עבר אליו,
    // ו**זו הבדיקה שתתפוס אם מישהו יחזיר אותו ל-`renderTop`**.
    expect(follows(soWhat, why)).toBe(true)
    expect(follows(why, tiles)).toBe(true)
    // ⑩ב · מתחת לאריחים.
    expect(follows(tiles, basis)).toBe(true)
    // ⑩ג · צמוד לטבלה שהוא מסביר, ולפניה.
    expect(follows(basis, tableSort)).toBe(true)
    expect(follows(tableSort, table)).toBe(true)
  })

  it('מטען ריק לגמרי — מצב "אין נתונים עדיין" ולא טבלה ריקה', async () => {
    // 🔑 **שני התנאים, לא אחד** — המעטפת שינתה ב-16/09 את מבחן-הריק ל-`rows.length === 0`
    // **וגם** `population.n === 0`: כל שישה-עשר ה-RPC מחזירים אריחים תמיד, ולכן המבחן
    // הישן (אריחים-או-גרף-או-שורות) לא התקיים לעולם ומצב-הריק היה קוד-מת.
    callReport.mockResolvedValue({ ...base(), population: { n: 0, label: '', excluded: {} } })
    renderTab(SURFACES.מ19)
    await waitFor(() =>
      expect(
        within(screen.getByTestId('report-customers-overview-blank')).getByText(/אין נתונים/),
      ).toBeInTheDocument(),
    )
  })
})
