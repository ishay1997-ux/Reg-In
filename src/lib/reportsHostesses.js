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

// why: כל מדדי-הריכוזיות כאן עובדים על אותה סדרה — ספירת-המשמרות פר-דיילת —
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

// ── ג'יני ולורנץ (מ14 · מ17) ─────────────────────────────────────────────────

/**
 * מדד ג'יני — **גרסת-אוכלוסייה**, ללא תיקון `n/(n−1)`.
 *
 * 🔴 **הגרסה היא הכרעה כתובה, לא טעם** (`spec.md §🔢 3.3`): האוכלוסייה כאן היא **מפקד
 * ולא מדגם** — כל הדיילות שעבדו בחלון, לא דגימה מהן. על `1·2·3·4·10` הגרסה הזו מחזירה
 * **0.40**; גרסת-המדגם מחזירה **0.50** על אותם נתונים בדיוק — פער של 25%, ושתיהן
 * "נראות נכון" על המסך.
 *
 * ‏`G = (2·Σ i·xᵢ) ⁄ (n·Σxᵢ) − (n+1)/n` על סדרה ממוינת בעלייה — שקולה מתמטית לנוסחת
 * ההפרשים הכפולים `Σᵢ Σⱼ |xᵢ − xⱼ| ⁄ (2·n²·μ)`, ורצה ב-O(n log n) במקום O(n²).
 *
 * @returns {number|null} `null` כשפחות משתי תצפיות או כשהסכום אפס — **לעולם לא 0**,
 *   שהיה נקרא על המסך כ"חלוקה מושלמת" (`cards-hostesses.md` ④ מ17).
 */
export function giniPopulation(values) {
  const sorted = sortedCounts(values)
  const n = sorted.length
  if (n < 2) return null

  let sum = 0
  let weighted = 0
  for (let index = 0; index < n; index += 1) {
    sum += sorted[index]
    weighted += (index + 1) * sorted[index]
  }
  if (sum === 0) return null

  return (2 * weighted) / (n * sum) - (n + 1) / n
}

/**
 * נקודות עקומת-לורנץ: לכל אחוז-דיילות מצטבר (מהפחות-עמוסה), אחוז-המשמרות המצטבר.
 *
 * 🔑 **אותו נתון בדיוק שממנו נגזר ג'יני** — ולכן השניים אינם יכולים לסתור זה את זה
 * (`cards-hostesses.md` ⑩ מ17, עוגן ב). מתחילה ב-`(0,0)` ומסתיימת ב-`(100,100)`.
 * `domain 0–100` בשני הצירים (📐6).
 *
 * ⚠️ **החישוב הוא `(i·100)/n` ולא `(i/n)·100`** — הצורה השנייה מחזירה `60.00000000000001`
 * על `3/5`, וזה מספר שמגיע לטבלת-ה-`sr-only` וסותר את הגרף שלידו.
 */
export function lorenzPoints(values) {
  const sorted = sortedCounts(values)
  const n = sorted.length
  if (n === 0) return []

  const total = sorted.reduce((acc, value) => acc + value, 0)
  if (total === 0) return []

  const points = [{ x: 0, y: 0 }]
  let cumulative = 0
  for (let index = 0; index < n; index += 1) {
    cumulative += sorted[index]
    points.push({ x: ((index + 1) * 100) / n, y: (cumulative * 100) / total })
  }
  return points
}

/**
 * נתחי-הריכוזיות שהדף מפרש בהם את ג'יני: רבע-עליון · מחצית-תחתונה · עשירון-עליון.
 *
 * 🔴 **התבנית "3 דיילות מרכזות X%" שב-📑ב אינה בשימוש כאן, וזו הכרעה מדודה**
 * (`cards-hostesses.md` ⑧ 14.1): על `n=106` שלוש הדיילות העמוסות מחזיקות 7.5% —
 * משפט שנקרא כ"אין ריכוזיות" ליד ג'יני 0.46 שאומר את ההפך. ⇒ מדברים ברבעים.
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

// ── תעריף ודירוג (מ16) ───────────────────────────────────────────────────────

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

/**
 * רצועות התעריף לפי דירוג — הסדרה שמתחת לפיזור של מ16, בסדר `5 → 4 → 3 → ללא-דירוג`.
 *
 * 🔑 **הסדר הוא הכרעה** (`cards-hostesses.md` §ד): הטבלה נקראת באותו כיוון שבו נקרא
 * ציר-ה-Y של הפיזור, מלמעלה למטה. **רצועת חסרות-הדירוג אחרונה** — אי-אפשר להציב אותן
 * על סולם 1–5 בלי להמציא להן ציון (📐6 נועל `domain 1–5`).
 *
 * 🚫 **דירוג בלי אף דיילת אינו רצועה** — רצועה ריקה הייתה מצוירת כ-"0 ₪", שהוא מחיר
 * ולא חוסר.
 */
export function rateByRatingBands(rows) {
  const byRating = new Map()
  for (const row of rows ?? []) {
    const rate = finiteNumber(row?.hourly_rate)
    if (rate === null) continue
    const rating = finiteNumber(row?.rating)
    const key = rating === null ? 'none' : rating
    if (!byRating.has(key)) byRating.set(key, { rating, rates: [] })
    byRating.get(key).rates.push(rate)
  }

  const rated = [...byRating.values()].filter((band) => band.rating !== null)
  rated.sort((a, b) => b.rating - a.rating)
  const unrated = byRating.get('none')

  return [...rated, ...(unrated ? [unrated] : [])].map(({ rating, rates }) => ({
    rating,
    count: rates.length,
    avgRate: rates.reduce((acc, value) => acc + value, 0) / rates.length,
    medianRate: medianOf(rates),
  }))
}
