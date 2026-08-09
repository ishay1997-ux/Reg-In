// Smart Match — ארבע השכבות שמדרגות מועמדות לאירוע.
// **טהור לחלוטין: בלי Supabase, בלי שעון, בלי DOM.** מקבל ספירות, ק"מ ושבועות כמספרים,
// ומחזיר סדר. השאילתות חיות ב-`src/modules/04_hostesses/api.js`.
//
// 🔗 **מראת §11 — SSOT למספרים: `docs/specs/module_04_hostesses/module4_smart_match_research.md §11`.**
// 🚫 **אין ולו מספר אחד מקודד בקובץ הזה** — כל 13 הפרמטרים נקראים מ-`params` בזמן ריצה.
// ‏§11 כבר תוקן שלוש פעמים (`m=5`⇐`3` · מפתח-הדיילת · שיעור-ההוגנות `0.05`⇐`0.02`);
// עותק שני של המספרים היה נושא את שלושתם עד היום. **מכפילים נימוק, לעולם לא מספר.**
//
// ⚠️ **חלוקת העבודה מול ה-SQL — סטייה מודעת ממדריך-המיקרו, ר' §10 שלו.** המדריך קבע
// ששכבות 1–2 ושובר-השוויון "רצים ב-SQL". נמדד 09/08/2026 שאין דרך להריץ אותם שם:
// ‏`supabase-js` אינו יודע לחשב haversine, אינו תומך בתת-שאילתה `NOT EXISTS`, ואינו יכול
// למיין לפי ביטוי מחושב; ובמסד אין `view` ואין פונקציית-דירוג שיארחו אותם.
// ⇒ השאילתה מביאה **קבוצות קטנות ומסוננות** (האירוע הזה · הלקוח הזה · התאריך הזה),
// וארבע השכבות רצות כאן — במקום היחיד שיש בו בדיקות-יחידה.

import { isUnavailableOn, optionalNumber } from './hostesses'

// שמות-הפרמטרים, זהים-בייט למיגרציה `20260809125750`. שם שגוי בתו אחד מחזיר שורה ריקה,
// הפרמטר נראה "חסר", ואין שום שגיאה — ולכן יש עליהם בדיקה.
export const SMART_MATCH_PARAM_NAMES = {
  responsivenessWeight: 'משקולת_היענות',
  reliabilityWeight: 'משקולת_אמינות',
  proximityWeight: 'משקולת_קרבה',
  gateDistanceKm: 'שער_מרחק_קמ',
  goalpostDistanceKm: 'גולפוסט_מרחק_קמ',
  dampingConstant: 'קבוע_ריסון_m',
  windowMonths: 'חלון_חישוב_חודשים',
  extendedWindowMonths: 'חלון_חישוב_מורחב_חודשים',
  minAnswersForScore: 'מינימום_תשובות_להצגת_ציון',
  fairnessRatePerWeek: 'שיעור_בונוס_הוגנות_לשבוע',
  fairnessWeeksCap: 'תקרת_שבועות_הוגנות',
  unansweredStreak: 'לא_ענתה_ל_N',
  reliabilityEnabled: 'מרכיב_אמינות_פעיל',
}

// 🔴 אמצע-הגולפוסט, **לא ממוצע-המאגר** (הנחה 5 בבלופרינט): ממוצע-מאגר הוא בדיוק
// התלות-במדגם ש-§11.3#3 אוסר — הוספת דיילת רחוקה אחת הייתה מזיזה את כולן.
export const NEUTRAL_PROXIMITY_SCORE = 0.5

// תוצאות-הנוכחות של §11.3(2). 🚧 מ6 הוא שייצר אותן בפועל; כאן קיים החוזה בלבד,
// כדי שהנרמול יהיה אמיתי ושבדיקות-הקבלה #2 ו-#5 יהיו ניתנות להרצה.
export const ATTENDANCE_OUTCOMES = {
  ARRIVED: 'הגיעה',
  SLIGHTLY_LATE: 'איחור_קצת',
  MODERATELY_LATE: 'איחור_בינוני',
  VERY_LATE: 'איחור_הרבה',
  WITHDREW: 'ביטלה_אחרי_אישור',
  NO_SHOW: 'הבריזה',
  SICK: 'חולה',
  EXCUSED: 'אישור_מראש',
}

// 🔴 "חולה" ו"אישור-מראש" **אינם בטבלה הזו במכוון** — הם מוחרגים מהבסיס לגמרי,
// לא במונה ולא במכנה. ערך 0 עבורם היה מעניש דיילת שהודיעה מראש כמו מי שהבריזה.
const ATTENDANCE_VALUES = {
  [ATTENDANCE_OUTCOMES.ARRIVED]: 1,
  [ATTENDANCE_OUTCOMES.SLIGHTLY_LATE]: 1,
  [ATTENDANCE_OUTCOMES.MODERATELY_LATE]: 0.75,
  [ATTENDANCE_OUTCOMES.VERY_LATE]: 0.5,
  [ATTENDANCE_OUTCOMES.WITHDREW]: 0.5,
  [ATTENDANCE_OUTCOMES.NO_SHOW]: 0,
}

// §11.3(1) — שלושת הסטטוסים שנספרים במכנה. 🚫 `pending` בחוץ (שתיקה אינה סירוב) ·
// 🚫 `released` בחוץ (פעולת-מערכת) · 🚫 `approval_withdrawn` בחוץ — §11.3(2) קובע
// במפורש שהוא נספר **באמינות** ולא בהיענות, "היא כן אמרה כן במקור".
const RESPONSIVENESS_DENOMINATOR = new Set(['confirmed_available', 'finally_approved', 'declined'])
const RESPONSIVENESS_NUMERATOR = new Set(['confirmed_available', 'finally_approved'])

const PINNED_PREFERENCE = 'מצוינת'
const BLOCKED_PREFERENCE = 'לא_לשלוח'

// ── פענוח פרמטרים ────────────────────────────────────────────────────────────

// ‏`params.param_value` הוא `text` לכל סוג, ולכן כל ערך נקרא דרך `optionalNumber`
// המשותף (‏`./hostesses`) — הוא מחזיר `null` ולא ברירת-מחדל, כי משקולת מומצאת הייתה
// מייצרת דירוג שנראה תקין לחלוטין ומבוסס על מספר שאיש לא הכריע.
// *(עותק שני שלו כאן נתפס ע"י jscpd ואוחד — הכלל הזה חייב להיות זהה בשני הקבצים.)*
const paramNumber = optionalNumber

// 🚨 `Boolean('false') === true` — הדגל **חייב** פענוח מפורש. פענוח נאיבי היה מדליק
// את מרכיב-האמינות שכבוי, ומשנה את כל הדירוג בשקט.
function paramBoolean(value) {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : value
  if (raw === 'true' || raw === true) return true
  if (raw === 'false' || raw === false) return false
  return null
}

export function parseSmartMatchParams(paramsByName) {
  const raw = (key) => paramsByName?.[SMART_MATCH_PARAM_NAMES[key]]
  return {
    responsivenessWeight: paramNumber(raw('responsivenessWeight')),
    reliabilityWeight: paramNumber(raw('reliabilityWeight')),
    proximityWeight: paramNumber(raw('proximityWeight')),
    gateDistanceKm: paramNumber(raw('gateDistanceKm')),
    goalpostDistanceKm: paramNumber(raw('goalpostDistanceKm')),
    dampingConstant: paramNumber(raw('dampingConstant')),
    windowMonths: paramNumber(raw('windowMonths')),
    extendedWindowMonths: paramNumber(raw('extendedWindowMonths')),
    minAnswersForScore: paramNumber(raw('minAnswersForScore')),
    fairnessRatePerWeek: paramNumber(raw('fairnessRatePerWeek')),
    fairnessWeeksCap: paramNumber(raw('fairnessWeeksCap')),
    unansweredStreak: paramNumber(raw('unansweredStreak')),
    reliabilityEnabled: paramBoolean(raw('reliabilityEnabled')),
  }
}

// 🛑 עוצר במקום לחשב. מסך שאומר "לא הצלחנו לטעון" עדיף על סדר שגוי שנראה אמין —
// והשני הוא בדיוק מה שקורה כשמשלימים פרמטר חסר בברירת-מחדל.
function requireParams(params, keys) {
  const missing = keys.filter((key) => params?.[key] === null || params?.[key] === undefined)
  if (missing.length > 0) {
    const names = missing.map((key) => SMART_MATCH_PARAM_NAMES[key]).join(', ')
    throw new Error(`חסרים פרמטרים של Smart Match בהגדרות המערכת: ${names}`)
  }
}

// ── שכבה 3 · המשקולות ────────────────────────────────────────────────────────

// 🔴 **נרמול בזמן ריצה, לעולם לא פיצול מקודד.** מרכיב כבוי יוצא מהסכום, והנותרים
// מתחלקים כך שיסכמו ל-1.0.
// 🔑 הסיבה אריתמטית ולא נימוסית: **מרכיב קבוע כפול משקל אינו משנה שום סדר** — נוסחה
// שהייתה מותירה אותו על ערך קבוע הייתה מתנהגת כאילו הוא לא קיים, בלי שאיש הכריע כך.
// ⚠️ ו-`0.62/0.38` שמופיע ב-§11.4 הוא **המחשה, לא קבוע**: מימוש שיקודד אותו עובר את
// העוגן המחושב-ביד ונשבר ביום שמ6 ידליק את מרכיב-האמינות.
export function activeWeights(params) {
  requireParams(params, ['responsivenessWeight', 'reliabilityWeight', 'proximityWeight'])

  const reliability = params.reliabilityEnabled ? params.reliabilityWeight : 0
  const total = params.responsivenessWeight + reliability + params.proximityWeight
  if (total <= 0) throw new Error('סכום משקולות Smart Match אינו חיובי — לא ניתן לדרג.')

  return {
    responsiveness: params.responsivenessWeight / total,
    reliability: reliability / total,
    proximity: params.proximityWeight / total,
  }
}

// ── שכבה 3 · המרכיבים ────────────────────────────────────────────────────────

// 🔴 **`C` מחושב על כל הדיילות בחברה — כולל מי שנפסלה בשער.** חד-משמעית (§11.3).
// ‏`C` פר-מאגר היה גורם לכך שאותה דיילת מקבלת ציונים שונים בשני אירועים **בלי ששום
// דבר בה השתנה**. נמדד שזו לא דקדוק: על מקרה-הבדיקה של האפיון, `C` פר-מאגר מחזיר
// ‏0.65 ו**תיקו בראש הרשימה** במקום 0.60 והסדר הנקי.
// ⚠️ הסכומים ולא ממוצע-של-ממוצעים: לדיילת עם מענה אחד אין אותו משקל כמו לוותיקה.
export function companyResponsivenessAverage(hostesses) {
  let answered = 0
  let confirmed = 0
  for (const h of hostesses ?? []) {
    answered += Number(h?.answered) || 0
    confirmed += Number(h?.confirmed) || 0
  }
  return answered > 0 ? confirmed / answered : null
}

// שורות-`assignments` גולמיות ⇒ המונה והמכנה של ההיענות, אחרי קיפול לשורה הקובעת.
// 🔑 בלי הקיפול, מענה-אחד-שהתהפך נמנה כשני מענים נפרדים (§11.3#1, תוקן 30/07).
export function responsivenessCounts(rows) {
  const finalRows = new Map()
  for (const row of rows ?? []) {
    if (!row) continue
    const key = `${row.project_id}|${row.hostess_id}`
    const current = finalRows.get(key)
    if (!current || Number(row.assignment_number) > Number(current.assignment_number)) {
      finalRows.set(key, row)
    }
  }

  let answered = 0
  let confirmed = 0
  for (const row of finalRows.values()) {
    if (!RESPONSIVENESS_DENOMINATOR.has(row.assignment_status)) continue
    answered += 1
    if (RESPONSIVENESS_NUMERATOR.has(row.assignment_status)) confirmed += 1
  }
  return { answered, confirmed }
}

// הריסון: `(מונה + m×C) ÷ (מכנה + m)`.
// 🔑 מה הוא עושה, כי בלעדיו הכל נשבר: דיילת עם "1 מתוך 1" נראית 100% — וזה חסר
// משמעות. הריסון מערבב אותה עם ממוצע-החברה עד שיצטבר לה רקורד, ולכן `1/1` מדורגת
// מתחת ל-`9/10`. ⚠️ ו-`m=5` היה שגוי: הוא הועבר מ-IMDb שיש לה אלפי הצבעות לפריט,
// בעוד שדיילת צוברת 5–15 שיבוצים בשנה.
export function responsivenessScore({ answered, confirmed }, companyAverage, dampingConstant) {
  const m = Number(dampingConstant)
  const c = Number(companyAverage)
  return (Number(confirmed) + m * c) / (Number(answered) + m)
}

// מרכיב-האמינות. 🚧 **כבוי עד מ6** — הפונקציה קיימת כדי שהנרמול יהיה אמיתי ושבדיקות
// הקבלה #2 ו-#5 תהיינה ניתנות להרצה, לא כדי שתיקרא היום.
// ⚠️ שמות שדות-הרשומה (`outcome` / `projectCancelled` / `eventPassed`) הם **הנחה שלי** —
// מ6 הוא שיקבע את שמות-העמודות בפועל. ר' §9 במדריך-המיקרו.
export function reliabilityScore(records, companyAverage, dampingConstant) {
  let count = 0
  let total = 0

  for (const record of records ?? []) {
    // 🔴 פרויקט שהלקוח ביטל אינו נספר בשום צד — הדיילת לא אשמה (§11.10 #5),
    // ואירוע שטרם התקיים אינו יכול להעיד על הגעה או אי-הגעה.
    if (!record || record.projectCancelled || !record.eventPassed) continue
    // 🔴 "חולה"/"אישור-מראש" מוחרגים מהבסיס לגמרי — לא במונה ולא במכנה (§11.10 #2).
    const value = ATTENDANCE_VALUES[record.outcome]
    if (value === undefined) continue
    count += 1
    total += value
  }

  return responsivenessScore({ answered: count, confirmed: total }, companyAverage, dampingConstant)
}

// ציון-קרבה: `1 − LEAST(ק"מ, גולפוסט) ÷ גולפוסט`.
// 🔴 **הגולפוסט קבוע ואינו נגזר מהמדגם** — אחרת הוספת דיילת רחוקה אחת משנה את הציון
// של כל השאר ומייצרת שינויי-סדר מסתוריים (§11.10 #3).
// 🔴 **בלי קואורדינטות ⇒ ניטרלי, לעולם לא 0.** אפס היה מעניש דיילת על נתון חסר שהוא
// תקלה של המערכת ולא שלה, והיה מוריד אותה לתחתית הרשימה בשקט.
export function proximityScore(distanceKm, goalpostKm) {
  const km = optionalNumber(distanceKm)
  if (km === null) return NEUTRAL_PROXIMITY_SCORE

  const goalpost = Number(goalpostKm)
  return 1 - Math.min(Math.max(km, 0), goalpost) / goalpost
}

// ── שכבה 4 · מנוף-ההוגנות ────────────────────────────────────────────────────

// `1 + שיעור × LEAST(שבועות, תקרה)`.
// 🔑 למה הוא קיים: בלעדיו, מי שנבחרה פעם אחת עובדת ⇒ צוברת רקורד ⇒ מדורגת גבוה ⇒
// נבחרת שוב; ומי שלא נבחרה נשארת מאחור לנצח, כי אין לה מה לשפר.
// 🔴 **מי שמעולם לא עבדה מקבלת 0 שבועות, לא את התקרה** — לחדשה כבר יש מנגנון (הריסון),
// והמנוף נועד למי שנשחקה ואז נזנחה. ⚠️ מימוש שנותן לה את התקרה **עובר את העוגן**,
// כי שתי הדיילות חסרות-ההיסטוריה שם נפסלות בשער ממילא (`spec.md §3.5(ב)`).
export function fairnessLeverage(weeksSinceWorked, ratePerWeek, weeksCap) {
  const weeks = optionalNumber(weeksSinceWorked)
  if (weeks === null) return 1
  return 1 + Number(ratePerWeek) * Math.min(Math.max(weeks, 0), Number(weeksCap))
}

// שובר-שוויון **אקראי-אך-קבוע לאירוע**.
// 🔴 לעולם לא לפי סדר-הקליטה למערכת — זה יתרון-קבע לוותיקות, בדיוק ההפך ממה שהמנוף
// מנסה לתקן. ⚠️ **סטייה מודעת מ-§11.2, שכותב `md5(...)`:** אין ספריית-גיבוב ב-
// `package.json` ו-`crypto.subtle` אינו מממש md5 (נמדד 09/08/2026). ‏FNV-1a נותן את
// מה שהדרישה באמת אומרת — דטרמיניסטי, קבוע לצמד, ובלתי-תלוי בסדר-ההוספה.
export function tieBreakKey(projectId, hostessId) {
  const input = `${projectId}|${hostessId}`
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

// ── מרחק ─────────────────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371
const toRadians = (deg) => (deg * Math.PI) / 180

// haversine — §7.14 קבע במפורש בלי Maps API בתשלום.
// 🔴 קואורדינטה חסרה מחזירה `null` ולא 0: "0 ק"מ" הוא הציון **המושלם**, כלומר דיילת
// בלי כתובת הייתה קופצת לראש הרשימה.
export function haversineKm(from, to) {
  const lat1 = optionalNumber(from?.lat)
  const lng1 = optionalNumber(from?.lng)
  const lat2 = optionalNumber(to?.lat)
  const lng2 = optionalNumber(to?.lng)
  if ([lat1, lng1, lat2, lng2].some((v) => v === null)) return null

  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

// ── שכבה 1 · השער ────────────────────────────────────────────────────────────

// **פוסלים, לא מנקדים.** חמישה תנאים בינאריים לפני כל חישוב.
// 🔑 ולמה שער ולא משקל — זו התובנה שממנה נגזרה כל הארכיטקטורה: בחיבור משוקלל, דיילת
// מצוינת מאילת "קונה מחילה" על 300 ק"מ בזכות שאר ציונה. זו תכונה מובנית של כל סכום
// משוקלל ואי-אפשר לתקן אותה מתוך הנוסחה. ⇒ פוסלים לפני שמדרגים.
function passesGate(candidate, { eventDate, params }) {
  if (candidate?.status !== 'active') return false
  if (candidate?.hasSameDayFinalAssignment) return false
  if (candidate?.preference === BLOCKED_PREFERENCE) return false
  if (isUnavailableOn(candidate?.unavailability, eventDate)) return false

  const km = optionalNumber(candidate?.distanceKm)
  // 🔴 בלי קואורדינטות השער אינו פוסל — הנתון החסר הוא תקלה שלנו, והיא נכנסת מסומנת.
  if (km === null) return true

  if (km > params.gateDistanceKm) return false
  // ➕ שער מותנה יחיד: מעל הגולפוסט בלי רכב = פסילה. 🚫 נבחן ונדחה כמקדם —
  // "בלי רכב מ-40 ק"מ זו פסילה מוחלטת ולא שיפור שולי" (§11.5).
  if (km > params.goalpostDistanceKm && !candidate?.has_car) return false

  return true
}

// ── ארבע השכבות יחד ──────────────────────────────────────────────────────────

// מקבל את **כל** הדיילות (‏`C` מחושב עליהן), ומחזיר רק את מי שעברה את השער, מדורגת.
// 🚫 הנפסלות אינן ברשימה כלל — לא בתחתיתה ולא עם ציון 0 (`spec.md §3.2`).
//
// סדר הפעולות אינו שרירותי, וכל סטייה ממנו נראית תקינה ומחזירה סדר אחר:
// ‏① `C` על כל המאגר · ② שער · ③ ציון משוקלל מנורמל · ④ מנוף על הגולמי · ⑤ עיגול אחד
// בסוף · ⑥ מיון: נעוצות, ואז ציון יורד, ואז שובר-שוויון.
export function rankCandidates(candidates, context) {
  const pool = candidates ?? []
  if (pool.length === 0) return []

  const { params, eventDate, projectId } = context ?? {}
  requireParams(params, [
    'responsivenessWeight',
    'reliabilityWeight',
    'proximityWeight',
    'gateDistanceKm',
    'goalpostDistanceKm',
    'dampingConstant',
    'minAnswersForScore',
    'fairnessRatePerWeek',
    'fairnessWeeksCap',
  ])

  const weights = activeWeights(params)
  // 🔴 לפני השער, לא אחריו. זו הנקודה שבודק בהקשר-טרי מדד עליה תיקו-בראש-הרשימה.
  const companyAverage = companyResponsivenessAverage(pool)

  const ranked = pool
    .filter((candidate) => passesGate(candidate, { eventDate, params }))
    .map((candidate) => {
      const answered = Number(candidate.answered) || 0
      const components = {
        responsiveness: responsivenessScore(
          { answered, confirmed: Number(candidate.confirmed) || 0 },
          companyAverage ?? 0,
          params.dampingConstant,
        ),
        // 🚧 מ6: כל עוד הדגל כבוי המשקל שלו הוא 0, ולכן הערך אינו משפיע על הציון.
        // הוא מחושב בכל זאת כדי שהדלקת הדגל תהיה שינוי-פרמטר ולא שינוי-קוד.
        reliability: reliabilityScore(
          candidate.attendance,
          companyAverage ?? 0,
          params.dampingConstant,
        ),
        proximity: proximityScore(candidate.distanceKm, params.goalpostDistanceKm),
      }

      const baseScore =
        components.responsiveness * weights.responsiveness +
        components.reliability * weights.reliability +
        components.proximity * weights.proximity

      const leverage = fairnessLeverage(
        candidate.weeksSinceWorked,
        params.fairnessRatePerWeek,
        params.fairnessWeeksCap,
      )

      // 🔴 המנוף על הגולמי, **עיגול אחד בסוף** — `round(ציון × מנוף, 2)` ולא
      // `round(ציון,2) × מנוף`. מימוש שמעגל באמצע עובר את העוגן ושגוי (`spec.md §3.5(ג)`).
      const rawScore = baseScore * leverage

      return {
        ...candidate,
        pinned: candidate.preference === PINNED_PREFERENCE,
        components,
        baseScore,
        leverage,
        rawScore,
        score: Math.round(rawScore * 100) / 100,
        tieBreak: tieBreakKey(projectId, candidate.hostess_id),
        flags: {
          // בלי קואורדינטות ⇒ צ'יפ `אין קואורדינטות` על השורה. המחסור נאמר בקול.
          noCoordinates: optionalNumber(candidate.distanceKm) === null,
          // מתחת לסף ⇒ צ'יפ `טרם נצבר מידע`. 🔴 והיא **עדיין מדורגת** — הריסון
          // החזיר אותה לממוצע-החברה; היא לא נעלמת ולא מקבלת אפס.
          notEnoughAnswers: answered < params.minAnswersForScore,
        },
      }
    })

  // שכבה 2 קודמת לציון: נעוצה צפה לראש **בלי קשר לציון**, עם תגית גלויה.
  return ranked.sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      b.score - a.score ||
      a.tieBreak.localeCompare(b.tieBreak),
  )
}
