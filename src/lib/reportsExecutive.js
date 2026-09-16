// לוגיקת-החישוב הטהורה של לשונית "הנהלה" בדוחות (מ2 · מ3 · מ4 · מ6).
// 🚫 טהור לחלוטין — בלי Supabase, בלי שעון, בלי DOM. אותה מוסכמה כמו כל `src/lib/`.
//
// 🔑 **מה מעמד הקובץ:** ארבע פונקציות-השרת של הלשונית — `report_m02_exec_overview` ·
// `report_m03_trends` · `report_m04_discounts` · `report_m06_staffing`, במיגרציה
// `*_module11_d_rpcs_executive.sql` — מחשבות את אותם מדדים ב-SQL, כי המספרים חייבים
// להגיע גמורים מהשרת (‏`assert_module_permission` בשורה הראשונה, ת8 #3).
// **הקובץ הזה הוא האורקל שמולו ה-SQL נבדק**, והבדיקות שלידו נכתבו לפני שהיה קוד — מתוך
// `signoff-baseline-2026-09-10.md`, `cards-management.md` §③ וההכרעות. ⇒ **כששניהם
// נחלקים, ה-SQL הוא החשוד.**
//
// 🔴 **ומה שאין כאן במכוון, כלל-ברזל 14:**
//   · **שיעור-אישור ההצעות אינו משוכפל** — ההגדרה של §7.82 חיה ב-`deriveQuoteMetrics`
//     (`./quotes`) ומשרתת כבר את מסך-ההצעות; מ4 מציג **את אותו מספר**. הבדיקה שלצד
//     הקובץ נועלת אותה שם, ו-ה-SQL הוא התאום שלה.
//   · **`medianOf` אינה משוכפלת** — היא מיובאת מ-`./reportsHostesses`. שתי לשוניות
//     צריכות את אותו חציון (שם ריכוזיות-משמרות, כאן יחס-אורחים), ושני עותקים היו
//     נפרדים ביום שההגדרה משתנה. ‏`percentile_cont(0.5)` ב-SQL הוא התאום שלה בדיוק:
//     שניהם ממצעים את שני האמצעיים במספר-ערכים זוגי.
//   · **פורמט אינו כאן** — 📐4 חי ב-`./reportsFormat`. הפונקציות כאן מחזירות מספרים
//     גולמיים לא-מעוגלים, והעיגול קורה במקום אחד.

import { medianOf } from './reportsHostesses'

// ── עזר פנימי ────────────────────────────────────────────────────────────────

// why: `Number(null)`/`Number('')`/`Number('  ')` הם כולם 0 — ולכן הפסילה קודמת להמרה.
// ערך שלא נמדד חייב להישאר `null` ולא להפוך לאפס שנראה כמו מדידה (📐1: *"— מותר רק
// כשאין שינוי, לא כשלא נמדד"*).
function finiteNumber(value) {
  if (value === null || value === undefined) return null
  const trimmed = typeof value === 'string' ? value.trim() : value
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

// why: כל מכנה בקובץ הזה נופל באותה צורה — 0 או חסר ⇒ `null`. זה `nullif(denom, 0)`
// של ה-SQL, ושמירת הזהות בין השניים היא מה שמאפשר להשוות אותם.
function safeRatio(numerator, denominator) {
  const top = finiteNumber(numerator)
  const bottom = finiteNumber(denominator)
  if (top === null || bottom === null || bottom === 0) return null
  return top / bottom
}

// ── מדרגי-הנחה (הכרעה 39 · §📑#2) ────────────────────────────────────────────

/**
 * ארבעת המדרגים, **בסדר הקבוע** — לא לפי ערך ולא לפי א"ב (📐7: *"סדר-דליים טבעי גובר"*).
 * התווית של האחרון נושאת *"(פתוח)"* מילה-במילה מ-📑ב#2: הוא אינו חסום מלמעלה.
 */
export const DISCOUNT_TIERS = Object.freeze([
  Object.freeze({ key: '0', label: '0%', min: 0, max: 0 }),
  Object.freeze({ key: '1-5', label: '1–5%', min: 0, max: 5 }),
  Object.freeze({ key: '6-10', label: '6–10%', min: 5, max: 10 }),
  Object.freeze({ key: '10+', label: '10%+ (פתוח)', min: 10, max: null }),
])

/**
 * ההנחה הקבועה של הלקוח **ועוד** ההנחה הידנית, יחד (‏`cards-management.md` ⑥ מ4).
 * ‏`null` בשדה הוא **אפס ולא היעדרות** — ⑦ מ4 נוקב ב-`coalesce`, ולכן הצעה בלי הנחה
 * כלל נכנסת למדרג `0` ואינה יוצאת מהדוח.
 */
export function totalDiscountOf(appliedDiscount, manualDiscount) {
  return (finiteNumber(appliedDiscount) ?? 0) + (finiteNumber(manualDiscount) ?? 0)
}

/**
 * ‏`12` ⇒ `'10+'` · לא-מספר ⇒ `null`.
 *
 * 🔴 **הגבול העליון שייך לדלי התחתון**, מילה-במילה מהשאילתה שהפיקה את המספרים
 * (`cards-management.md` §③ מ4): `when d=0 then '0' when d<=5 then '1-5' when d<=10
 * then '6-10' else '10+'`. ⇒ ‏5 הוא `1-5` ו-10 הוא `6-10`. **זו הגדרה, לא טעם**, וה-SQL
 * חייב לשאת אותה מילה-במילה או שארבעת המספרים 57.8/56.6/54.5/50.6 לא ישוחזרו.
 */
export function discountTierOf(discount) {
  const value = finiteNumber(discount)
  if (value === null) return null
  if (value === 0) return '0'
  if (value <= 5) return '1-5'
  if (value <= 10) return '6-10'
  return '10+'
}

/**
 * מסכם אירועים-שהתקיימו לארבעת המדרגים. כל שורה = אירוע אחד עם ההנחה של ההצעה שנולד
 * ממנה, ההכנסה והרווח הגולמי שלו.
 *
 * 🔑 **ארבעה דליים תמיד, גם ריקים** — 📑ב#2 מחייב `n` צמוד לכל מדרג *("מדרג עם 4 הצעות
 * נראה כמו מדרג עם 400")*; דלי שנעלם היה מסתיר בדיוק את זה.
 * 🚫 **ודלי ריק מקבל `marginPercent: null`, לא `0`** — 0% שוליים הוא מדידה, "אין
 * אירועים" הוא חוסר-מדידה, והמסך מבחין ביניהם.
 */
export function summariseDiscountTiers(rows) {
  const buckets = new Map(
    DISCOUNT_TIERS.map((tier) => [
      tier.key,
      { tier: tier.key, label: tier.label, eventCount: 0, revenue: 0, profit: 0 },
    ]),
  )

  for (const row of rows ?? []) {
    const bucket = buckets.get(discountTierOf(row?.discount))
    if (!bucket) continue
    bucket.eventCount += 1
    bucket.revenue += finiteNumber(row?.revenue) ?? 0
    bucket.profit += finiteNumber(row?.grossProfit) ?? 0
  }

  return DISCOUNT_TIERS.map((tier) => {
    const bucket = buckets.get(tier.key)
    return { ...bucket, marginPercent: marginPercent(bucket.profit, bucket.revenue) }
  })
}

/**
 * *"הפרש בין הקצוות"* — **נקודות-אחוז**, לא יחס (`cards-management.md` §③ מ4:
 * ‏`57.8 − 50.6` ⇒ 7.2 נק'). חצי חסר ⇒ `null`.
 */
export function pointsGap(highPercent, lowPercent) {
  const high = finiteNumber(highPercent)
  const low = finiteNumber(lowPercent)
  if (high === null || low === null) return null
  return high - low
}

// ── שוליים והשוואה (📐1 · 📐15) ──────────────────────────────────────────────

/**
 * שולי-רווח = **סך הרווח חלקי סך ההכנסה על כל האוכלוסייה יחד** — ‏🚫 לא ממוצע של
 * אחוזים (`cards-management.md` ⑥ מ2: *"אירוע גדול משפיע יותר מאירוע קטן — וזה מכוון"*).
 * הכנסה 0 או חסרה ⇒ `null`, שהוא `nullif(sum(revenue), 0)` של ה-SQL.
 */
export function marginPercent(profit, revenue) {
  const ratio = safeRatio(profit, revenue)
  return ratio === null ? null : ratio * 100
}

/**
 * גידול באחוזים מול תקופה קודמת — *"אותם חודשים בדיוק בשנה שעברה"* (⑥ מ2).
 * 🔴 **בסיס 0 או חסר ⇒ `null` ולא "אינסוף"**: 📐1 מתיר `—` רק כשאין שינוי, ולכן
 * "לא נמדד" חייב להיות ערך מובחן שהמסך יכול לכתוב עליו משפט משלו.
 */
export function growthPercent(current, previous) {
  const ratio = safeRatio(current, previous)
  return ratio === null ? null : (ratio - 1) * 100
}

/**
 * כיוון חץ-ההשוואה של 📐1 — ‏`up` · `down` · `flat`, **בלי צבע** (הכרעה 6: אין צביעה
 * מול יעד; 🔒: *"אין ירוק לעובדה-טובה"*). אין בסיס ⇒ `null` ⇒ המסך כותב במילים.
 */
export function compareDirection(current, previous) {
  const now = finiteNumber(current)
  const before = finiteNumber(previous)
  if (now === null || before === null) return null
  if (now > before) return 'up'
  if (now < before) return 'down'
  return 'flat'
}

// ── מחיר לשעה מול עלות לשעה (📑#1 · הכרעה 24 · ח6) ───────────────────────────

/** ‏Σ הכנסת השנה ÷ Σ שעות-בפועל של השיבוצים באירועי אותה שנה. מכנה 0 ⇒ `null`. */
export function pricePerHour(revenue, hours) {
  return safeRatio(revenue, hours)
}

/**
 * ‏(Σ שכר-בסיס + Σ בונוסים אישיים) ÷ אותן שעות.
 *
 * 🔴 **הנסיעות אינן במונה, וזו הגדרה מדודה ולא השמטה** (⑧ G6): הן סכום קבוע למשמרת
 * ולא תשלום לפי שעה. **מארבע ההגדרות שנבדקו ב-10/09/2026 זו היחידה שמשחזרת את
 * 44.2 / 45.9 / 47.4** שב-`signoff-baseline`.
 */
export function costPerHour(baseWage, personalBonus, hours) {
  const wage = finiteNumber(baseWage)
  const bonus = finiteNumber(personalBonus)
  if (wage === null || bonus === null) return null
  return safeRatio(wage + bonus, hours)
}

/** מחיר לשעה פחות עלות לשעה. חצי חסר ⇒ `null`. */
export function marginPerHour(price, cost) {
  return pointsGap(price, cost)
}

// ── קהל מול צוות (📑#10 · 📑ב#10) ────────────────────────────────────────────

/**
 * יחס = **אורחים בפועל חלקי דיילות מאושרות-סופית**.
 *
 * 🔴 **ולא חלקי `required_hostess_count`** — זו הטעות שנתפסה ותוקנה ב-`signoff-baseline`
 * (§לפני-הטבלה, שורה 5): התכנון אינו הביצוע, וההפרש הזיז את "מעל 50" מ-25 ל-31 ואת
 * החציון מ-40.67 ל-40.80.
 * ‏**אפס דיילות ⇒ `null`** ולא יחס אינסופי (④ מ6 ב: `nullif`).
 */
export function guestsPerHostess(actualGuests, finallyApprovedHostesses) {
  return safeRatio(actualGuests, finallyApprovedHostesses)
}

/**
 * *"אירועים ביחס מעל 50"* — **חמור** (`cards-management.md` §③ מ6: *"חד-משמעית «מעל»,
 * לא «מ-50 ומעלה»"*). ‏50 בדיוק אינו נספר; `null` אינו נספר.
 */
export function aboveRatioCount(ratios, threshold) {
  const limit = finiteNumber(threshold)
  if (limit === null) return null
  let count = 0
  for (const ratio of ratios ?? []) {
    const value = finiteNumber(ratio)
    if (value !== null && value > limit) count += 1
  }
  return count
}

/**
 * *"אירועים מעל הצפי"* — ‏`actual > estimated`, **חמור**, ורק כששני המספרים קיימים.
 * אירוע שחסר בו אחד מהם אינו "לא חרג" — הוא **אינו נמדד**, ויש לו אריח משלו (📑ב#10).
 */
export function overEstimateCount(rows) {
  let count = 0
  for (const row of rows ?? []) {
    const estimated = finiteNumber(row?.estimatedGuests)
    const actual = finiteNumber(row?.actualGuests)
    if (estimated !== null && actual !== null && actual > estimated) count += 1
  }
  return count
}

/**
 * שמונת דליי-ההיסטוגרמה של מ6 — רוחב 5 אורחים-לדיילת, **עם שני זנבות מקובצים**.
 *
 * 🔑 **ההגדרה נגזרה ממדידה, לא מהעין:** הסדרה במוקאפ המאושר היא
 * ‏`32 · 39 · 70 · 171 · 224 · 148 · 28 · 5`, והחלוקה החיה ל-`floor(r/5)*5` מחזירה
 * ‏15:5 · 20:27 · 25:39 · 30:70 · 35:171 · 40:224 · 45:148 · 50:28 · 55:3 · 60:1 · 100:1.
 * ⇒ ‏**5+27 = 32** בדלי הראשון ו-**3+1+1 = 5** באחרון; ששת האמצעיים זהים אחד-לאחד.
 * 🚫 **זנב פתוח ולא דלי-אפס חוזר**: אירוע #12 ביחס 100 חייב להיראות, ו-תשעה דליים
 * ריקים בדרך אליו היו הופכים את הגרף לבלתי-קריא.
 */
export const RATIO_HISTOGRAM_BUCKETS = Object.freeze([
  Object.freeze({ key: 'lt25', label: 'מתחת ל-25', min: null, max: 25 }),
  Object.freeze({ key: '25-30', label: '25–30', min: 25, max: 30 }),
  Object.freeze({ key: '30-35', label: '30–35', min: 30, max: 35 }),
  Object.freeze({ key: '35-40', label: '35–40', min: 35, max: 40 }),
  Object.freeze({ key: '40-45', label: '40–45', min: 40, max: 45 }),
  Object.freeze({ key: '45-50', label: '45–50', min: 45, max: 50 }),
  Object.freeze({ key: '50-55', label: '50–55', min: 50, max: 55 }),
  Object.freeze({ key: '55plus', label: '55 ומעלה', min: 55, max: null }),
])

/**
 * ‏`[17, 42]` ⇒ הדלי הראשון 1 והדלי `40–45` 1.
 * **הגבול התחתון שייך לדלי והעליון אינו** (`min ≤ v < max`) — התאום של
 * ‏`floor(r/5)*5` ב-SQL. ערך חסר יוצא מהספירה ואינו נופל לדלי הראשון.
 */
export function buildRatioHistogram(ratios) {
  const counts = RATIO_HISTOGRAM_BUCKETS.map((bucket) => ({ ...bucket, count: 0 }))
  for (const ratio of ratios ?? []) {
    const value = finiteNumber(ratio)
    if (value === null) continue
    const index = counts.findIndex(
      (bucket) =>
        (bucket.min === null || value >= bucket.min) && (bucket.max === null || value < bucket.max),
    )
    if (index >= 0) counts[index].count += 1
  }
  return counts
}

// why: מיוצא-מחדש כדי שבונה-הלשונית ימצא את החציון של מ6 באותו קובץ שבו יתר החישובים
// שלו יושבים — **בלי לשכפל אותו** (כלל-ברזל 14; המקור נשאר `./reportsHostesses`).
export { medianOf }
