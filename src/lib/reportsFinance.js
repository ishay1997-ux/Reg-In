// לוגיקת-הכספים הטהורה של מודול 11 — דליי-גיול · חציונים · יחס-סטיית-תקציב.
// בלי Supabase, בלי שעון, בלי DOM: "היום" ותנאי-התשלום מגיעים כקלט, כמו ב-`projectFinance.js`.
//
// 🔴 **מה הקובץ הזה הוא, ומה הוא בכוונה אינו:**
// הוא **התאום ב-JS של ארבע פונקציות-השרת** שבמיגרציה `*_module11_e_rpcs_finance.sql`.
// ‏`reportsFinance.test.js` שלצידו הוא **האורקל** — הציפיות שם הועתקו ספרה-בספרה מ-
// `docs/specs/module_11_reports/spec.md` §🔢 ומ-`stage2-review/signoff-baseline-2026-09-10.md`,
// שנכתבו לפני הקוד — ולכן **ה-SQL נבדק מולו**, לא ההפך. אי-התאמה = הממצא מדווח עם שני
// המספרים; מספר בקו-הבסיס אינו מתוקן בשקט.
//
// 🚫 **ואין כאן הגדרת-גיול שנייה:** ימי-האיחור נגזרים מ-`deriveDaysOverdue` הקיימת
// (`src/lib/projectFinance.js`, כלל-ברזל 14 — מקור-אמת אחד ללוגיקה עסקית). מה שנולד כאן
// הוא **גבולות הדליים בלבד**, שאין להם היום בית בריפו.

import { deriveDaysOverdue, deriveDueDate, toFinanceNumber } from './projectFinance.js'

/**
 * חמשת מדרגי-הגיול, בסדר-הדליים הטבעי.
 *
 * 🔴 **"שוטף" אינו "שולם" ואינו "אין נתון"** — הוא חשבונית שמועד-פירעונה טרם הגיע
 * (‏`deriveDaysOverdue` קוטעת שלילי ל-0). זה הגבול שנמדד שגוי חמש פעמים ביום אחד
 * (‏`spec.md` §🔢), תמיד באותה דרך: ספירת ימים מיום-השליחה במקום ממועד-הפירעון,
 * ואז דלי "שוטף" פשוט לא קיים והחשבונית נזקפת ל-1–30.
 *
 * **התוויות הן מה שמופיע על המסך** (‏`spec.md` §1.4 · כרטיס מ9 §⑥) — מקף-הטווח הוא
 * `–` (en-dash) ולא מקף רגיל, ואין לתרגם אותן מחדש.
 */
export const AGING_BUCKETS = Object.freeze([
  { key: 'current', label: 'שוטף', min: 0, max: 0 },
  { key: 'd1_30', label: '1–30', min: 1, max: 30 },
  { key: 'd31_60', label: '31–60', min: 31, max: 60 },
  { key: 'd61_90', label: '61–90', min: 61, max: 90 },
  { key: 'd90p', label: '90+', min: 91, max: null },
])

// מעל 60 יום = שני הדליים העליונים יחד (כרטיס מ9 §⑥ · 📑#6). נעול כאן כדי שאריח
// "כסף שעבר מועדו" והשאילתה לא יגדירו את זה פעמיים ויתפצלו.
const OVER_SIXTY_KEYS = ['d61_90', 'd90p']

/**
 * ימי-איחור ⇒ מפתח-דלי. **`null` נשאר `null`** ואינו נופל ל"שוטף":
 * חשבונית שאי-אפשר לחשב לה מועד-פירעון אינה "בזמן" — היא מחוץ למדידה, ונספרת בנפרד.
 */
export function agingBucketKey(daysOverdue) {
  if (!Number.isFinite(daysOverdue) || daysOverdue < 0) return null
  const bucket = AGING_BUCKETS.find(
    (b) => daysOverdue >= b.min && (b.max === null || daysOverdue <= b.max),
  )
  return bucket ? bucket.key : null
}

/**
 * חשבונית בודדת ⇒ `{ dueDate, daysOverdue, bucketKey }`.
 *
 * ‏`termsDays` מגיע מ-`params.תנאי_תשלום_ימים` ונקרא בזמן-ריצה. **חסר ⇒ `null` לכל אורך
 * השרשרת**, ולעולם לא 30 מוקשח: פרמטר חסר שמקבל ברירת-מחדל הופך שורת-הגדרות למספר
 * שנראה מדוד (‏§7.83 · דפוס מ7).
 */
export function agingBucketForInvoice({ invoiceSentAt, termsDays, today }) {
  const dueDate = deriveDueDate(invoiceSentAt, termsDays)
  const daysOverdue = deriveDaysOverdue(invoiceSentAt, termsDays, today)
  return { dueDate, daysOverdue, bucketKey: agingBucketKey(daysOverdue) }
}

/**
 * ‏₪ שלמים לשורה בודדת — **הבית היחיד של "איך מעגלים שורת-כסף אחת" במודול.**
 *
 * 🔴 **נולדה 18/09/2026, סגן-לילה:** `roundedShekelSum` ו-`addTo` (למטה) עיגלו כל אחת
 * בנפרד עם `Math.round` משלה — אותה נוסחה, בשני מקומות, בלי בית משותף. היום שתיהן
 * מסכימות (📊 נבדק ב-`summariseAging` מול `roundedShekelSum` על אותם פיקסצ'רים — זהות),
 * אבל שני מימושים עצמאיים לאותה הגדרה הם בדיוק מה שכלל-ברזל 14 (SSOT ללוגיקה עסקית)
 * קיים כדי למנוע: מי שיתקן אחד ולא את השני לא יגלה מהבדיקות הקיימות, כי אין בדיקה
 * שמשווה בין השניים ישירות. אין כאן שינוי-התנהגות — שתי הקריאות הישנות מוחלפות בקריאה
 * לפונקציה הזו, בית-בבית.
 */
function roundShekelRow(value) {
  return Math.round(value)
}

/**
 * ‏₪ שלמים: **מעגלים כל שורה ואז מסכמים** — ולא להפך.
 *
 * 🔴 **סדר-העיגול הוא חלק מההגדרה, לא פרט-מימוש.** נמדד חי 16/09/2026 על 35 החשבוניות
 * הפתוחות: סכימה-ואז-עיגול מחזירה **236,380 ₪**, עיגול-פר-שורה-ואז-סכימה מחזירה
 * **236,382 ₪** — המספר שבקו-הבסיס. ו-📐4 מחייב ₪ בלי אגורות **בכל מקום**, כלומר
 * האריח חייב להיות סכום של מה שהטבלה מציגה; סכום נסתר אחר הוא שורה שלא מסתדרת על המסך.
 */
export function roundedShekelSum(amounts) {
  return amounts.reduce((sum, value) => {
    const n = toFinanceNumber(value, 'amount')
    return n === null ? sum : sum + roundShekelRow(n)
  }, 0)
}

const emptyTotals = () => ({ n: 0, amount: 0 })

const addTo = (totals, amount) => {
  totals.n += 1
  totals.amount += roundShekelRow(amount)
}

/**
 * אגרגט-הגיול של דוח מ9 (ושל אריח יתרת-החוב במ7).
 *
 * @param {{projectId?: number, invoiceSentAt: unknown, amount: unknown}[]} invoices
 *        החשבוניות **הפתוחות בלבד** — הסינון (`invoice_sent` · בלי `payment_date` ·
 *        `written_off = false`) הוא אוכלוסייה ולא חישוב, ולכן הוא בשאילתה ולא כאן.
 * @param {{today: unknown, termsDays: unknown}} options
 * @returns {{
 *   rows: object[], buckets: object[], total: {n:number,amount:number},
 *   overdueOnly: {n:number,amount:number}, overSixtyDays: {n:number,amount:number},
 *   unmeasured: {n:number,amount:number}
 * }}
 *
 * **`overdueOnly` קיים בגלל 📐2:** הגרף מציג ארבעת דליי-האיחור בלבד (25 חשבוניות),
 * הדף מדבר על 35, והאריח "שוטף" על 10. שלוש ההצהרות חייבות להיות כתובות על המסך —
 * ולכן שלושתן מוחזרות מכאן, במקום שהמסך יחסר אחת ויציג פער בלי הסבר.
 *
 * **המיון (📐7):** ימי-איחור יורד — סדר-הגבייה מתחיל מהוותיקה, שם הכסף הכי בסיכון.
 */
export function summariseAging(invoices, { today, termsDays }) {
  const rows = invoices.map((invoice) => ({
    ...invoice,
    ...agingBucketForInvoice({ ...invoice, termsDays, today }),
  }))

  const byKey = new Map(AGING_BUCKETS.map((b) => [b.key, emptyTotals()]))
  const total = emptyTotals()
  const unmeasured = emptyTotals()

  for (const row of rows) {
    const amount = toFinanceNumber(row.amount, 'amount') ?? 0
    addTo(total, amount)
    if (row.bucketKey === null) addTo(unmeasured, amount)
    else addTo(byKey.get(row.bucketKey), amount)
  }

  const buckets = AGING_BUCKETS.map((b) => ({ ...b, ...byKey.get(b.key) }))
  const sumOf = (keys) =>
    keys.reduce(
      (acc, key) => {
        const t = byKey.get(key)
        return { n: acc.n + t.n, amount: acc.amount + t.amount }
      },
      { n: 0, amount: 0 },
    )

  return {
    rows: rows.sort((a, b) => (b.daysOverdue ?? -1) - (a.daysOverdue ?? -1)),
    buckets,
    total,
    overdueOnly: sumOf(AGING_BUCKETS.filter((b) => b.key !== 'current').map((b) => b.key)),
    overSixtyDays: sumOf(OVER_SIXTY_KEYS),
    unmeasured,
  }
}

/**
 * חציון — התאום של `percentile_cont(0.5)` ב-SQL, כולל ממוצע שני האמצעיים בזוגי.
 *
 * **רשימה ריקה ⇒ `null` ולא 0:** "אין חשבוניות ששולמו" ו"משתלמות ביום אפס" הן שתי
 * אמירות שונות, והשנייה משקרת על המסך (📐תלת-ערכיות · `src/CLAUDE.md`).
 * ‏**ערך שאינו מספר מוחרג ולא מומר ל-0** — ‏`Number(null)` הוא 0, וזה בדיוק המקום
 * שבו חציון מתרסק כלפי מטה בלי סימן.
 */
export function medianOf(values) {
  const numbers = values
    .map((v) => toFinanceNumber(v, 'value'))
    .filter((v) => v !== null)
    .sort((a, b) => a - b)
  if (numbers.length === 0) return null
  const mid = Math.floor(numbers.length / 2)
  return numbers.length % 2 === 1 ? numbers[mid] : (numbers[mid - 1] + numbers[mid]) / 2
}

/**
 * יחס-סטיית-התקציב של דוח מ8 — **חתום**, מול עלות-העבודה **המתוכננת** (§📑#5 · §7.58).
 *
 * המכנה = `planned_hours` × Σ תעריפי-המשובצות-**סופית** — אותו דפוס שכבר חי ב-
 * `finance_project_money`. 🔴 **מכנה 0 ⇒ `null`, לא אינסוף ולא אפס:** פרויקט בלי
 * משובצות-סופית **מוחרג מהיחס** (כרטיס מ8 §④) — אינסוף היה עומד ראשון בדירוג-החורגים,
 * ואפס היה אומר "לא חרג" על פרויקט שאיש לא מדד.
 *
 * **הסימן נשמר בכוונה:** "דלף" הוא חריגה כלפי-מעלה בלבד, ולכן הסינון הוא `> הסף` —
 * אבל חציון-הסטייה שעל המסך כן מציג ערכים שליליים, וקיזוז-חיסכון-מול-חריגה היה מוחק
 * בדיוק את מה שהדף מחפש.
 */
export function budgetDeviationRatio(deviation, plannedHours, finallyApprovedRateSum) {
  const dev = toFinanceNumber(deviation, 'budget_deviation')
  const hours = toFinanceNumber(plannedHours, 'planned_hours')
  const rates = toFinanceNumber(finallyApprovedRateSum, 'rate_sum')
  if (dev === null || hours === null || rates === null) return null
  const plannedLabor = hours * rates
  return plannedLabor === 0 ? null : dev / plannedLabor
}

/**
 * "חרג מהתקציב?" — התאום ב-JS של `r > v_threshold / 100.0` שב-`report_m08_profitability`
 * וב-`report_m07_finance_overview`.
 *
 * 🔴 **הוא קיים כדי שלגבול יהיה בית שנבדק.** ההשוואה חיה בשני מקומות ב-SQL בלבד, והחלפת
 * ‏`>` ב-`>=` הייתה משנה את "‏30 חרגו" בלי שאף בדיקה תיפול — בדיוק החור שדרכו נכנס
 * הליטרל המוקשח שהוסר במיגרציה E2. הגבול עצמו הוא הכרעה: **בדיוק על הסף אינו חריגה.**
 *
 * ‏`thresholdPct` הוא **אחוזים** (`params.סף_סטיית_תקציב_אחוז` = 15), והיחס הוא שבר (0.15).
 * 🚫 **סף חסר ⇒ `null`, לא `false`:** "לא חרג" ו"לא נמדד" הן שתי אמירות שונות, והשנייה היא
 * מה שהאריח חייב להציג (§7.83 · C5 — `meta.missing_params` ואריח שאינו מצויר).
 */
export function isOverBudgetThreshold(ratio, thresholdPct) {
  const r = toFinanceNumber(ratio, 'ratio')
  const t = toFinanceNumber(thresholdPct, 'סף_סטיית_תקציב_אחוז')
  if (r === null || t === null) return null
  return r > t / 100
}
