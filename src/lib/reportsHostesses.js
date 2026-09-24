// לוגיקת-החישוב הטהורה של לשונית "דיילות" בדוחות (מ14 · מ15 · מ16 · מ17).
// 🚫 טהור לחלוטין — בלי Supabase, בלי שעון, בלי DOM. אותה מוסכמה כמו כל `src/lib/`.
//
// 🔑 **למה הקובץ קיים, ומה מעמדו:** ארבע פונקציות-השרת של הלשונית
// (`report_m14_hostess_overview` · `report_m15_reliability` · `report_m16_quality_cost` ·
// `report_m17_fairness`, במיגרציה `*_module11_f_rpcs_hostesses.sql`) מחשבות את אותם
// מדדים ב-SQL, כי המספרים חייבים להגיע גמורים מהשרת (‏`assert_module_permission` בשורה
// הראשונה). **הקובץ הזה הוא האורקל שמולו ה-SQL נבדק** — הבדיקות שלידו נכתבו לפני שהיה
// קוד, מתוך `spec.md §🔢 3.3` ו-`signoff-baseline-2026-09-10.md`. ⇒ **כשהשניים נחלקים,
// ה-SQL הוא החשוד.**
//
// 🔴 **ומה שאין כאן במכוון:** ‏`reliabilityScore` **אינה משוכפלת** — היא נקראת מ-
// `./smartMatch` (הכרעה 38: אותו ציון בדיוק בשני המסכים; כלל-ברזל 14). שכפול היה
// מייצר שני מספרים שנקראים "ציון-אמינות" ונפרדים ביום שהנוסחה משתנה.

import { finiteNumber } from './reportsFormat'
import { responsivenessScore } from './smartMatch'

// ── עזר פנימי ────────────────────────────────────────────────────────────────

// why: מדדי-הריכוזיות כאן עובדים על סדרה אחת — ספירת-המשמרות פר-דיילת —
// ולכן הניקוי נעשה פעם אחת ובאותה צורה: ערכים סופיים ולא-שליליים, ממוינים בעלייה.
function sortedCounts(values) {
  const clean = []
  for (const value of values ?? []) {
    const parsed = finiteNumber(value)
    if (parsed === null || parsed < 0) continue
    clean.push(parsed)
  }
  return clean.sort((a, b) => a - b)
}

// ── ריכוזיות המשמרות (מ14 · מ17) ─────────────────────────────────────────────
//
// ✂️ **24/09/2026 — `giniPopulation` ו-`lorenzPoints` נמחקו.** הכרעת-ישי: מקדם ג'יני ועקומת
// לורנץ ירדו מהמסך ("באמת לא היה מובן"), ובמקומם המספר שמנהלת קוראת במבט — *איזה חלק
// מהמשמרות הלך לרבע הדיילות העמוסות* — ולצידו גרף-עמודות של ארבעת הרבעים מול קו 25%.
// לשתי הפונקציות לא נשאר קורא מחוץ לבדיקות, ולכן הן לא הושארו כאורקל של מדד שאינו מוצג.

/**
 * נתחי-הריכוזיות: רבע-עליון · מחצית-תחתונה · עשירון-עליון — **האורקל של אריח
 * "רבע הדיילות העמוסות"** (`top_quarter` במ14 ובמ17), שהוא המדד הראשי של הריכוזיות מאז
 * שג'יני ירד מהמסך (24/09/2026). בחלוקה שווה כל רבע מקבל 25%; ככל שהרבע העליון רחוק מזה,
 * העבודה מרוכזת אצל פחות דיילות.
 *
 * 🔴 **התבנית "3 דיילות מרכזות X%" שב-📑ב אינה בשימוש כאן, וזו הכרעה מדודה**
 * (`cards-hostesses.md` ⑧ 14.1): על `n=106` שלוש הדיילות העמוסות מחזיקות 7.5% —
 * משפט שנקרא כ"אין ריכוזיות" כשהרבע העליון מחזיק יותר ממחצית המשמרות. ⇒ מדברים ברבעים.
 *
 * ‏**הספירות, כפי שהדף מצהיר אותן:** רבע עליון `ceil(n/4)` · מחצית תחתונה `floor(n/2)` ·
 * עשירון עליון `ceil(n/10)`. **הספירה עצמה מוחזרת** כי היא נאמרת על המסך
 * (*"27 דיילות מקבלות 55.3%"*), ולא רק האחוז.
 */
export function concentrationShares(values) {
  const sorted = sortedCounts(values)
  const n = sorted.length
  if (n === 0) return null

  const total = sorted.reduce((acc, value) => acc + value, 0)
  if (total === 0) return null

  const topSum = (count) => sorted.slice(n - count).reduce((acc, value) => acc + value, 0)
  const bottomSum = (count) => sorted.slice(0, count).reduce((acc, value) => acc + value, 0)

  const topQuarterCount = Math.ceil(n / 4)
  const bottomHalfCount = Math.floor(n / 2)
  const topDecileCount = Math.ceil(n / 10)

  return {
    topQuarterCount,
    topQuarterShare: (topSum(topQuarterCount) * 100) / total,
    bottomHalfCount,
    bottomHalfShare: (bottomSum(bottomHalfCount) * 100) / total,
    topDecileCount,
    topDecileShare: (topSum(topDecileCount) * 100) / total,
  }
}

// ── אמינות (מ14 · מ15) ───────────────────────────────────────────────────────

/**
 * שני ספי-האמינות, **יחסיים לממוצע-החברה** ולא מספרים קבועים (הכרעה 35 · §ח8-3).
 *
 * 🔑 **למה יחסיים:** כשכל המאגר נחלש הסף יורד איתו — השאלה היא מי חריגה **ביחס לשאר**,
 * לא מי מתחת למספר שנקבע פעם. ⇒ הספים נעים עם `C` בכל ריצה.
 *
 * 🔴 **המקדמים נקראים מ-`params` בזמן-ריצה** (`מקדם_אמינות_אדום` 0.87 ·
 * `מקדם_אמינות_ענבר` 0.95) ולעולם אינם קבועי-קוד. חסר ⇒ `null` באותו סף, והמסך אומר
 * *"חסר פרמטר מערכת: X"* (`missingReportParamsMessage`) — **לא ברירת-מחדל שקטה**,
 * שהייתה נקראת כ"אין דיילות בסיכון" בזמן שהדף פשוט אינו יודע.
 */
export function reliabilityThresholds(companyAverage, redCoefficient, amberCoefficient) {
  const average = finiteNumber(companyAverage)
  if (average === null) return { red: null, amber: null }

  const red = finiteNumber(redCoefficient)
  const amber = finiteNumber(amberCoefficient)
  return {
    red: red === null ? null : average * red,
    amber: amber === null ? null : average * amber,
  }
}

/**
 * הסיווג לתג: `'red'` מתחת לסף-האדום · `'amber'` בינו לסף-הענבר · `null` מעליהם.
 *
 * 🔴 **סף אחד חסר ⇒ `null`, ולא סיווג חלקי.** דיילת בציון 0.5 בלי סף-אדום הייתה
 * מסווגת "ענבר" — כלומר *"יש לב לה"* במקום *"אל תשלחי אותה"*, והמסך היה נראה תקין
 * לחלוטין. ⇒ כשחסר מקדם, כל הסימון כבוי והמסך אומר *"חסר פרמטר מערכת: X"*.
 * ציון חסר ⇒ `null` גם הוא — **לא "עברה" ולא "נכשלה"**, והמסך מציג "—".
 */
export function reliabilityBand(score, redThreshold, amberThreshold) {
  const value = finiteNumber(score)
  const red = finiteNumber(redThreshold)
  const amber = finiteNumber(amberThreshold)
  if (value === null || red === null || amber === null) return null

  if (value < red) return 'red'
  if (value < amber) return 'amber'
  return null
}

/**
 * 🔴 **שומר-סדר-המקדמים.** אם `מקדם_אמינות_אדום` ≥ `מקדם_אמינות_ענבר` שני הצבעים
 * **מתהפכים בשקט**: סף-האדום עובר את סף-הענבר, וכל מי שהייתה "ענבר" נצבעת אדום או
 * נעלמת — בלי שגיאה, בלי בדיקה אדומה, על מסך שכל תכליתו להחליט את מי לא לשלוח.
 *
 * שני הפרמטרים ניתנים לעריכה בידי המנכ"ל במסך-מ9 (כרטיס ת6), ולכן ההיפוך אינו
 * היפותטי — הוא עריכה אחת. ⇒ הדוח מחזיר את המשפט ב-`meta.notes` והמסך מציג אותו
 * **במקום לצבוע**.
 *
 * @returns {string|null} משפט עברי הנוקב בשני הפרמטרים ובערכיהם, או `null` כשהסדר תקין.
 */
export function reliabilityParamOrderNote(redCoefficient, amberCoefficient) {
  const red = finiteNumber(redCoefficient)
  const amber = finiteNumber(amberCoefficient)
  if (red === null || amber === null) return null
  if (red < amber) return null

  return (
    `סימון האמינות כבוי: מקדם_אמינות_אדום (${red}) אינו נמוך ממקדם_אמינות_ענבר (${amber}), ` +
    'ולכן שני התגים היו מתהפכים. תקני את הערכים בהגדרות המערכת כדי להחזיר את הצבעים.'
  )
}

/**
 * ציון-האמינות של דיילת — **הפונקציה של Smart Match, לא עותק שלה** (הכרעה 38).
 *
 * ‏`(Σערך-נוכחות + m×C) ÷ (n + m)`, כאשר `m` = `params.קבוע_ריסון_m` ו-`C` = ממוצע-החברה.
 * 🔑 **מה הריסון עושה:** דיילת עם "1 מתוך 1" אינה 100% — היא מעורבבת בממוצע-החברה עד
 * שיצטבר לה רקורד, ולכן `1/1` מדורגת מתחת ל-`9/10`.
 *
 * ⚠️ **המונים עצמם (`count`/`total`) מגיעים מה-SQL**, שמשחזר את `attendanceCounts`
 * מילה-במילה — כולל ההחרגה של "חולה"/"אישור-מראש" **משני צדי השבר**.
 *
 * @returns {number|null} `null` כשאין ממוצע-חברה — ציון בלי `C` הוא ציון מומצא.
 */
export function hostessReliabilityScore({ count, total }, companyAverage, dampingConstant) {
  const average = finiteNumber(companyAverage)
  const damping = finiteNumber(dampingConstant)
  if (average === null || damping === null) return null

  const answered = finiteNumber(count)
  const confirmed = finiteNumber(total)
  if (answered === null || confirmed === null) return null

  return responsivenessScore({ answered, confirmed }, average, damping)
}

// ── חציון (נולד במ16; משמש היום את מ19/מ2 — ✂️ רצועות-התעריף נמחקו עם מ16, 24/09/2026) ───────────────────────────────────────────────────────

/**
 * חציון — **ולא ממוצע**: דיילת אחת יקרה במיוחד אינה מזיזה אותו (`cards-hostesses.md` ⑥ מ16).
 * מספר זוגי של ערכים ⇒ ממוצע שני האמצעיים. ריק ⇒ `null`.
 */
export function medianOf(values) {
  const sorted = sortedCounts(values)
  const n = sorted.length
  if (n === 0) return null

  const middle = Math.floor(n / 2)
  return n % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
