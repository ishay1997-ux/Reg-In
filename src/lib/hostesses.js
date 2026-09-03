// לוגיקת מודול 4 (דיילות) שאינה Smart Match — הכללים שהמסכים שואלים אותם שאלת כן/לא.
// **טהור לחלוטין: בלי Supabase, בלי שעון, בלי DOM** — אותה מוסכמה כמו `pricing.js`/`quotes.js`,
// וכאן היא נושאת משקל מיוחד: כל מה שלמטה תלוי-זמן, ו"עכשיו" מוזרק כפרמטר בכל פונקציה.
// 🔑 למה לא לקרוא לשעון: שמונה בדיקות בפרויקט הזה נשברו פעם אחת בדיוק מהצמדה לתאריך-לוח
// (`e2e/CLAUDE.md`), ובדיקה שתלויה בשעון מוכיחה את הסביבה ולא את הכלל.
//
// 🚫 מה שאינו כאן, במכוון: ולידציית **פורמט-שדה** (ת"ז, נייד, אימייל) חיה ב-`validators.js`
// יחד עם זו של מודולים 2 ו-3 — בית שלישי לוולידטורים היה חריג שאין לו הצדקה.
// כאן יושבים **כללים עסקיים**: מה חוסם, מה מזהיר, ומה נגזר בזמן-תצוגה.

const MS_PER_HOUR = 3_600_000
const ISRAEL_TIME_ZONE = 'Asia/Jerusalem'

// שמות-הפרמטרים שמסכי מודול 4 קוראים מ-`params`. חייבים להיות זהים-בייט לשורות ה-Seed
// (`20260723112000` לשכר-המינימום · `20260809125750` לנסיעות): שם שגוי בתו אחד מחזיר
// שורה ריקה, הפרמטר נראה "חסר", ואין שום שגיאה בשום מקום.
export const HOSTESS_PARAM_NAMES = {
  minHourlyWage: 'שכר_מינימום_שעתי',
  travelAmount: 'סכום_נסיעות_למשמרת',
  // 🆕 מודול 9 (צעד 2.3): שלושת ספי-הזמן של הזימונים ירדו מקבועים בקוד לשורות ב-`params`,
  // כדי שהמנכ"לית תוכל לשנות אותם ממסך-ההגדרות בלי מיגרציה. ‏`ALL_PARAM_NAMES`
  // ב-`04_hostesses/api.js` נגזר מהמפה הזו ⇒ ההוספה כאן מספיקה, ואין לשכפל אותם שם.
  inviteValidityHours: 'שעות_תוקף_זימון',
  inviteCutoffHours: 'שעות_סף_זימון_לפני_אירוע',
  urgentEventHours: 'שעות_אירוע_דחוף',
}

// אוצר-המילים הנעול (`spec.md §1.1`) — **מה שכתוב כאן הוא מה שנכתב על המסך, מילה-במילה.**
// 🔴 ששת הערכים סגורים ואין שביעי. שתי התוויות הנגזרות שמתחת אינן חלק מהם.
export const ASSIGNMENT_STATUS_LABELS = {
  pending: 'ממתינה למענה',
  confirmed_available: 'אישרה זמינות',
  declined: 'סירבה',
  finally_approved: 'אושרה סופית',
  released: 'שוחררה',
  approval_withdrawn: 'ביטלה אחרי אישור',
}

export const HOSTESS_STATUS_LABELS = { active: 'פעילה', inactive: 'מושבתת' }

// 🔴 שתי אלה **נגזרות בזמן תצוגה** — אין להן עמודה, אין להן מיגרציה, ואסור שיהפכו לסטטוס.
export const EXPIRED_INVITE_LABEL = 'פג תוקף'
export const COMPLETED_ASSIGNMENT_LABEL = 'הושלם'

// 🔄 **שלושת ספי-הזמן אינם קבועים בקובץ הזה יותר** (מודול 9 · צעד 2.3). הם חיים ב-`params`
// (`שעות_תוקף_זימון`=48 · `שעות_סף_זימון_לפני_אירוע`=24 · `שעות_אירוע_דחוף`=72) ומוזרקים
// לכל פונקציה כפרמטר — **בדיוק כמו `nowIso`**, ומאותו טעם: פונקציה טהורה שקוראת סף מגלובל
// מוכיחה את הסביבה ולא את הכלל, וכאן היא הייתה גם ממשיכה לענות 48 אחרי שהמנכ"לית שינתה ל-24.
// 🔴 **וסף חסר אינו מוחלף בברירת-מחדל** (דוקטרינת `optionalNumber`): הפונקציה מחזירה את
// תשובת-ה"לא-יודע" שלה (`null`/`false`), והצעקה נמצאת שכבה אחת מעל — `getParamValues`
// (`src/api/params.js`) זורקת בעברית ונוקבת בשם, כך שהמסך מציג שגיאה ולא מספר מומצא.

// קריאת מספר **אופציונלי** — מ-`params` (שהוא `text` לכל סוג) או מעמודה nullable.
// מחזיר `null` ולא ברירת-מחדל: הקורא חייב להחליט מה לעשות כשהערך חסר, במקום לחשב
// לפי מספר מומצא.
//
// 🚨 **שתי מלכודות אמיתיות שנתפסו בפרויקט הזה, ולכן הפונקציה קיימת בכלל:**
// ‏① `Number('   ')` הוא **0** — פרמטר של רווחים היה נקרא כ"שכר מינימום 0" ומכשיר כל תעריף.
// ‏② `Number(null)` הוא **0 ולא `NaN`** — נתפס בבנייה הזו (09/08/2026): דיילת **בלי
// קואורדינטות** נמדדה כאילו היא על קו-המשווה, haversine החזיר 3,558 ק"מ, והצ'יפ
// "אין קואורדינטות" לא נדלק. שתי בדיקות תפסו זאת.
// ⇒ **כל קריאת-מספר-אופציונלי במודול 4 עוברת דרך כאן**, לא דרך `Number` ישירות.
// *(מיוצא כדי ש-`smartMatch.js` ישתמש באותו עותק — jscpd תפס את השכפול, ובצדק.)*
export function optionalNumber(value) {
  if (value === null || value === undefined) return null
  const raw = typeof value === 'string' ? value.trim() : value
  if (raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

// ── רגע-האירוע ───────────────────────────────────────────────────────────────

// ההיסט של שעון ישראל מ-UTC ברגע נתון, במילישניות. נגזר מ-`Intl` ולא מקבוע, כי
// ישראל מחליפה שעון פעמיים בשנה ו-`+02:00` קשיח היה שוגה בשעה בכל הקיץ.
function israelOffsetMs(utcMs) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ISRAEL_TIME_ZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs))

  const p = {}
  for (const part of parts) p[part.type] = part.value
  const asIfUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour) % 24, // חצות מוחזר כ-"24" בחלק מהמנועים
    Number(p.minute),
    Number(p.second),
  )
  return asIfUtc - utcMs
}

// ‏`final_event_date` + `final_start_time` (שעון-קיר ישראלי) ⇒ רגע מוחלט ב-ISO.
// 🔴 **חייב להיות זהה לחישוב שבפונקציה הציבורית `respond_to_shift_invite`**, שמשווה
// `(final_event_date + coalesce(final_start_time, '00:00')) at time zone 'Asia/Jerusalem'`.
// פער בין השניים פירושו מסך שמציג "אפשר עוד לשלוח" בעוד שהמסד כבר דוחה את התשובה —
// כלומר המנהלת שולחת זימון שנולד מת, וזה בדיוק התסריט של `spec.md §2.2(ד)`.
export function eventStartInstant(eventDate, startTime) {
  if (!eventDate) return null
  const raw = typeof startTime === 'string' && startTime.trim() ? startTime.trim() : '00:00:00'
  const wallTime = raw.length === 5 ? `${raw}:00` : raw.slice(0, 8)
  const naive = Date.parse(`${eventDate}T${wallTime}Z`)
  if (Number.isNaN(naive)) return null

  // שני סבבים: ההיסט נמדד סביב הניחוש ואז מאומת סביב התוצאה, כך שאירוע שנופל בדיוק
  // על מעבר שעון-קיץ מקבל את ההיסט של הרגע הנכון ולא של הרגע שממנו התחלנו.
  const firstGuess = naive - israelOffsetMs(naive)
  return new Date(naive - israelOffsetMs(firstGuess)).toISOString()
}

// ── ולידציות שחוסמות שמירה ───────────────────────────────────────────────────

// שכר מתחת למינימום **חוסם** (`spec.md §2.1(1)`), והרף הוא פרמטר שנערך במודול 9.
// 🛡️ זו הגנת-נוחות בלבד: החומה האמיתית היא הטריגר `hostesses_enforce_min_wage` במסד.
// המטרה כאן היא שהמשתמשת תראה את זה מיד ולא אחרי סיבוב לשרת — ו**באותו נוסח**.
// 🚫 פרמטר חסר אינו "אין מגבלה": המסד היה חוסם בכל מקרה, ולכן מסך שמתיר שמירה
// כשהפרמטר נמחק מבטיח שמירה שתיכשל.
// 🔴 **בידוד-כיווניות לסכום שיושב בתוך משפט עברי — המופע השביעי של אותה משפחה.**
// ‏`Money` פותר את זה במסך דרך `dir="ltr"` + `unicode-bidi:isolate`, **ולמחרוזת שטוחה
// אין מקבילה כזו** — היא נשלפת מכאן ומוצגת כטקסט. בלי בידוד, אלגוריתם ה-bidi מעביר את
// ה-₪ אל **שמאל** הספרות, ואותו סכום מופיע במסך אחד משני צדדים שונים.
// 🔬 **נמדד בדפדפן אמיתי (09/08/2026), לא הונח:** מיקום הגליף `₪` היה **שמאלה** מהספרות
// בשתי המחרוזות של המסך — בעוד `Money` באותו מסך מציג `45 ₪`. ישי הצביע על החשד; המדידה
// אישרה אותו. ⇒ `U+2066` (LRI) … `U+2069` (PDI) עוטפים את הסכום ומבודדים אותו, בדיוק
// כפי ש-`isolate` עושה ב-CSS. **תווים אלה בלתי-נראים בכוונה ואינם משנים את הנוסח.**
// ⚠️ ולכן הם **מרוכזים בפונקציה אחת עם שם**, ולא מודבקים בתוך מחרוזות — הריפו כבר נכווה
// מ-`U+200F` נסתר שאיש לא ידע שהוא שם ושיבש ספירה.
const LTR_ISOLATE = '⁦'
const POP_ISOLATE = '⁩'

// 🚫 **לא מיוצאת** — ‏knip תפס את הייצוא הספקולטיבי ובצדק: אין לה צרכן מחוץ לקובץ.
// כשתידרש למחרוזת נוספת (תבניות-המייל של מ8/מ11 נושאות את אותה חולשה) — אז מייצאים.
function isolatedShekels(amount) {
  return `${LTR_ISOLATE}${amount} ₪${POP_ISOLATE}`
}

export function minWageError(hourlyRate, minWageParamValue) {
  const min = optionalNumber(minWageParamValue)
  if (min === null) return 'שכר המינימום אינו מוגדר בהגדרות המערכת — לא ניתן לשמור דיילת.'

  const rate = optionalNumber(hourlyRate)
  if (rate === null) return 'יש להזין תעריף שעתי.'

  return rate < min ? `השכר השעתי חייב להיות לפחות ${isolatedShekels(min)} (שכר מינימום)` : null
}

// אימייל כפול — **מזהיר ולא חוסם** (§7.65, הכרעת-ישי 31/07): תיבה משפחתית משותפת היא
// מקרה לגיטימי, ואת כפילות-האדם מונעת הת"ז. 🚫 אין UNIQUE על העמודה במסד, במכוון.
// ⚠️ ‏`currentHostessId` הוא מה שמונע מדיילת בעריכה להיות "כפילות של עצמה" ולהציג
// אזהרה בכל שמירה שלא נגעה באימייל בכלל.
export function duplicateEmailWarning(email, hostesses, currentHostessId = null) {
  const needle = typeof email === 'string' ? email.trim().toLowerCase() : ''
  if (!needle) return null

  const match = (hostesses ?? []).find(
    (h) =>
      String(h?.email ?? '')
        .trim()
        .toLowerCase() === needle && h?.hostess_id !== currentHostessId,
  )
  return match ? `כתובת זו כבר רשומה אצל ${match.full_name} — להמשיך?` : null
}

// ── אי-זמינות מוצהרת — התנאי החמישי בשער ─────────────────────────────────────

// 🔴 **שני הקצוות כלולים** — הוכרע במיגרציה C ועקבי עם כל תוויות-הממשק.
// ההשוואה מחרוזתית בכוונה: תאריכי `date` חוזרים כ-'YYYY-MM-DD', שסדרם הלקסיקוגרפי
// זהה לסדרם הכרונולוגי — כך אין המרה לאובייקט-תאריך ואין אזור-זמן שיזיז יום.
function coversDate(range, isoDate) {
  if (!range?.start_date || !range?.end_date) return false
  return range.start_date <= isoDate && isoDate <= range.end_date
}

export function isUnavailableOn(ranges, isoDate) {
  if (!isoDate) return false
  return (ranges ?? []).some((range) => coversDate(range, isoDate))
}

function toDayMonth(isoDate) {
  const [, month, day] = String(isoDate).split('-')
  return `${day}/${month}`
}

// 🔴 **טווח, לעולם לא תאריך-סיום יחיד** (`spec.md §1.2`): "לא זמינה עד 25/08" משתמע
// כאילו היא זמינה היום, ובדיוק ההפך נכון.
export function unavailabilityLabel(range) {
  if (!range?.start_date || !range?.end_date) return null
  return `לא זמינה ${toDayMonth(range.start_date)}–${toDayMonth(range.end_date)}`
}

// ── מצבים נגזרים — אין להם עמודה ואין להם מיגרציה ────────────────────────────

// כמה שעות שלמות נותרו לקישור. `null` = השאלה אינה רלוונטית (הסטטוס אינו "ממתינה
// למענה", זימון מעולם לא נשלח, **או שסף-התוקף אינו ידוע**). `0` = פג.
// ‏`validityHours` = `params['שעות_תוקף_זימון']` — גולמי מהמסד; הפענוח כאן.
export function inviteHoursLeft(assignment, nowIso, validityHours) {
  if (assignment?.assignment_status !== 'pending') return null
  const sent = Date.parse(assignment?.invite_sent_at ?? '')
  const now = Date.parse(nowIso ?? '')
  if (Number.isNaN(sent) || Number.isNaN(now)) return null
  // 🔴 סף חסר ⇒ `null` ("לא יודע") ולא 48: זימון שיוצג "ממתין" על סמך מספר מומצא הוא בדיוק
  // הכשל השקט שהמעבר ל-`params` בא למנוע. הצעקה נמצאת ב-`getParamValues`.
  const hours = optionalNumber(validityHours)
  if (hours === null) return null

  const remaining = sent + hours * MS_PER_HOUR - now
  return remaining <= 0 ? 0 : Math.ceil(remaining / MS_PER_HOUR)
}

// "פג תוקף" = `ממתינה למענה` **וגם** עברו `שעות_תוקף_זימון` שעות מ-`invite_sent_at`.
// שום דבר אחר.
export function isInviteExpired(assignment, nowIso, validityHours) {
  return inviteHoursLeft(assignment, nowIso, validityHours) === 0
}

// שעות עד תחילת האירוע. שלילי = כבר עבר.
// **פנימי בכוונה**, באותו נימוק שבו `daysUntil` פנימי ב-`quotes.js`: המסך אינו סופר
// שעות בעצמו אלא שואל שאלה עסקית ("בתוך T-24?" / "דחוף?"), ושתי הפונקציות שעונות
// עליה נמצאות מתחת. ייצוא היה מזמין סף מקביל שמחושב במסך.
// 🔮 משטח 4 יציג "בעוד 19 שעות" — כשהוא ייבנה (3.5), זה המקום לייצא מכאן.
function hoursUntilEvent(eventStartsAt, nowIso) {
  const start = Date.parse(eventStartsAt ?? '')
  const now = Date.parse(nowIso ?? '')
  if (Number.isNaN(start) || Number.isNaN(now)) return null
  return (start - now) / MS_PER_HOUR
}

// מצב T-24: הקישור הציבורי כבר מת, ולכן הפעולה הראשית במסך מתחלפת ל"סוכם בטלפון".
// ⚠️ אירוע שכבר התחיל אינו "בתוך החלון" — הוא נגמר, וזה מצב אחר לגמרי.
// ‏`cutoffHours` = `params['שעות_סף_זימון_לפני_אירוע']`; חסר ⇒ `false` ("לא יודע"), כי
// תשובה חיובית כאן **מחליפה את הפעולה הראשית של המסך** ואסור שתישען על מספר מומצא.
export function isWithinFinalDay(eventStartsAt, nowIso, cutoffHours) {
  const left = hoursUntilEvent(eventStartsAt, nowIso)
  const hours = optionalNumber(cutoffHours)
  return left !== null && hours !== null && left > 0 && left <= hours
}

// "דחוף" — סף אחר לגמרי (`שעות_אירוע_דחוף`), ומשמש למסנן ולברירת-מחדל של זווית-המיון.
export function isUrgentEvent(eventStartsAt, nowIso, urgentHours) {
  const left = hoursUntilEvent(eventStartsAt, nowIso)
  const hours = optionalNumber(urgentHours)
  return left !== null && hours !== null && left > 0 && left <= hours
}

// התווית שמוצגת בפועל על התג. סדר הבדיקות אינו שרירותי: הנגזרות גוברות על הסטטוס
// הגולמי, אחרת זימון מת היה מוצג "ממתינה למענה" והמנהלת הייתה ממשיכה לחכות לו.
// 🚫 סטטוס לא-מוכר מוחזר כ-"—" ולא כערכו: ערך-enum באנגלית על מסך עברי הוא דליפה.
export function assignmentDisplayStatus(assignment, nowIso, validityHours) {
  if (isInviteExpired(assignment, nowIso, validityHours)) return EXPIRED_INVITE_LABEL

  if (assignment?.assignment_status === 'finally_approved') {
    const left = hoursUntilEvent(assignment?.event_starts_at, nowIso)
    if (left !== null && left <= 0) return COMPLETED_ASSIGNMENT_LABEL
  }

  return ASSIGNMENT_STATUS_LABELS[assignment?.assignment_status] ?? '—'
}

// ── השורה הקובעת ─────────────────────────────────────────────────────────────

// 🔴 **הסטטוס הקובע הוא של השורה עם `MAX(assignment_number)` פר-(פרויקט, דיילת) —
// לא השורה האחרונה שנוצרה** (`spec.md §2.2(ג)`).
// 🔑 ולמה זה לא פרט טכני: המנהלת שעוקפת סירוב בטלפון יוצרת **שורה שנייה, והישנה
// נשארת כהיסטוריה**. בלי הקיפול הזה אותה דיילת נספרת גם כמסרבת וגם כמאשרת —
// ובמילות האפיון, "נענשת על ששינתה את דעתה לטובה". זה גם המכנה של 40% מהציון.
// ⚠️ הקיפול חי כאן ולא בשאילתה: הספרייה שמדברת עם המסד אינה יודעת `DISTINCT ON`,
// ואין במסד `view` שיעשה זאת. כאן, לפחות, יש לו בדיקת-יחידה.
export function finalAssignmentRows(rows) {
  const byPair = new Map()

  for (const row of rows ?? []) {
    if (!row) continue
    const key = `${row.project_id}|${row.hostess_id}`
    const current = byPair.get(key)
    if (!current || Number(row.assignment_number) > Number(current.assignment_number)) {
      byPair.set(key, row)
    }
  }

  return [...byPair.values()]
}

// המונים של המבט-על ושל מסך ה-Smart Match, כולם על השורה הקובעת בלבד.
//
// 🔴 **`expired` הוא תת-קבוצה של `pending`, לא מונה זר — תוקן 09/08/2026 (צעד 3.3).**
// הגרסה הראשונה ספרה אותם כזרים על סמך הנחה שמילאתי, וציטטה מספר-שורה שמאז נרקב.
// **שלושה מקורות מאושרים אומרים "מתוכן":** `screens-approved.md:464`
// (`ממתינות 3 · מתוכן 2 פג תוקפן`) · `processes-approved.md:374` · ו-`spec.md:151-152`
// ל-KPI (`זימונים ממתינים` + `מתוכם M פג תוקפם`). **והמוקאפ המאושר מכריע בחשבון:**
// שורותיו נושאות `ממתינות` 1+4+2 והכותרת אומרת **7** — לא 10.
// 🔑 **ולמה זה לא סותר את "שתי פעולות הפוכות":** המשפט ב-`spec.md:148` אומר במפורש
// *"**אותו מספר**, שתי פעולות הפוכות"* — הפיצול הוא בתצוגה ובפעולה, לא בספירה.
// ⚠️ **ואל תערבב עם התווית:** על שורה בודדת `assignmentDisplayStatus` מציגה `פג תוקף`
// ולא `ממתינה למענה` — שם הנגזרת **כן** גוברת. מונה ותווית עונים על שתי שאלות שונות.
export function countAssignmentStates(rows, nowIso, validityHours) {
  const counts = {
    pending: 0,
    expired: 0,
    confirmedAvailable: 0,
    declined: 0,
    finallyApproved: 0,
    released: 0,
    approvalWithdrawn: 0,
  }

  for (const row of finalAssignmentRows(rows)) {
    // ⚠️ בלי `continue`: שורה שפג תוקפה נספרת **גם** ב-`expired` **וגם** ב-`pending`.
    // ‏`isInviteExpired` מחייבת ממילא `pending`, ולכן אין כאן סיכון לספירה כפולה בסטטוס אחר.
    if (isInviteExpired(row, nowIso, validityHours)) counts.expired += 1

    switch (row.assignment_status) {
      case 'pending':
        counts.pending += 1
        break
      case 'confirmed_available':
        counts.confirmedAvailable += 1
        break
      case 'declined':
        counts.declined += 1
        break
      case 'finally_approved':
        counts.finallyApproved += 1
        break
      case 'released':
        counts.released += 1
        break
      case 'approval_withdrawn':
        counts.approvalWithdrawn += 1
        break
      default:
        break
    }
  }

  return counts
}

// כמה שבועות שלמים עברו מאז האירוע האחרון שהדיילת **השלימה** — הקלט של מנוף-ההוגנות,
// וגם הצ'יפ `עבדה לאחרונה לפני N שבועות`. `null` = טרם עבדה, ו🚫 **זה אינו 0**: אפס
// שבועות אומר "עבדה השבוע" והיה שולל ממנה בדיוק את המנוף שנועד לחדשות.
// ⚠️ **רק אירועים שכבר עברו** — שיבוץ עתידי מאושר אינו "עבדה לאחרונה".
// *(חולץ 09/08/2026: אותו חישוב היה inline ב-`HostessViewCard`, ומסך 2 היה העותק השני.)*
// 🔴 **אירוע שהלקוח ביטל לא התקיים — ולכן אינו נספר לזכות הדיילת בשום מונה.**
// *(הכרעת-ישי 12/08/2026 באודיט-הסגירה, והורחבה על-ידו באותו יום לכל המונים ולא רק לצ'יפ.)*
//
// 🔑 **למה פונקציה ולא תנאי מועתק:** הכלל הזה חי ב-**ארבעה** אתרי-קריאה — הצ'יפ בשיבוץ-החכם,
// אותו צ'יפ בכרטיס-הדיילת, מונה-הרבעון במאגר, ו"עבדה לאחרונה לפני N שבועות". ‏**הוא יושם
// בתחילה באחד מהם בלבד**, וסריקת דיף-התיקון תפסה את הפיצול: אותה דיילת ואותו לקוח היו
// מציגים **מספר אחד בשיבוץ-החכם ומספר אחר בכרטיס שלה** — אותה תווית, שתי אמיתות.
// ⛔ **תנאי מועתק חמישית יתפצל שוב.** זו הדלת היחידה.
// ⚠️ **ודורש ש-`project_status` ייבחר בשאילתה** — `listRepositoryAssignments` לא בחרה אותו
// עד 12/08/2026, ובלעדיו הכלל **מת בשקט** (‏`undefined !== 'cancelled'` ⇒ הכול נספר).
export function eventWasCancelled(row) {
  return row?.projects?.project_status === 'cancelled'
}

export function weeksSinceLastWorked(rows, todayIso) {
  const lastWorked = (rows ?? [])
    .filter((row) => row?.assignment_status === 'finally_approved' && !eventWasCancelled(row))
    .map((row) => row.projects?.final_event_date)
    .filter((date) => date && String(date) < String(todayIso))
    .sort()
    .at(-1)
  if (!lastWorked) return null

  const elapsed = Date.parse(`${todayIso}T00:00:00Z`) - Date.parse(`${lastWorked}T00:00:00Z`)
  return Number.isNaN(elapsed) ? null : Math.floor(elapsed / (7 * 24 * MS_PER_HOUR))
}

// ── הנגזרות של מבט-העל (משטח 1) ──────────────────────────────────────────────

// 🔴 **אירוע שתאריכו לפני היום אינו מוצג במבט-העל** — הכרעת-קלוד 09/08/2026, האפיון שותק
// (נבדק: כרטיס מסך 1 §④/⑤/⑥ · המוקאפ המאושר · תהליך ב׳), ונרשמה כ-`הנחתי` ב-§10.
// **הנימוק:** ‏§② מגדיר את המסך כ*"על איזה אירוע אני נכנסת לטפל **עכשיו**"*, ופרויקט יוצא
// מהרשימה רק כשהוא עובר ל-`מוכן לביצוע` — **סטטוס שמודול 4 לעולם אינו כותב** (`🚧 מ6 ← מ4`).
// ⇒ בלי הכלל הזה אירוע שעבר יושב בראש מסך-הטריאז' **לנצח**, כי המיון הוא לפי קרבה.
// 🔑 **והגבול הוא היום ולא הרגע:** ביום האירוע עצמו היא עדיין סוגרת חורים בטלפון
// (`אושרה סופית — סוכם בטלפון`), ולכן שורה של היום נשארת גם אחרי שהאירוע התחיל.
// 🚫 תאריך חסר **אינו** מסתיר שורה — הסתרה על סמך נתון חסר היא בדיוק החור השקט.
export function isPastEvent(eventDate, todayIso) {
  if (!eventDate || !todayIso) return false
  return String(eventDate) < String(todayIso)
}

// "מתי" בשפה שהמנהלת חושבת בה, לא בתאריך — `היום` · `מחר` · `בעוד N ימים`, בדיוק
// שלושת הנוסחים שהמוקאפ המאושר מצייר. 🔑 **המרחק נמדד בימי-לוח ולא בשעות:** אירוע
// ב-08:00 מחר הוא "מחר" גם אם נותרו 12 שעות, ו"בעוד יום" על אותה שורה שכתוב בה "מחר"
// היה שני נוסחים לאותה עובדה. ⚠️ אזהרת ה-24 שעות היא שורה **נפרדת** (`isFinalDay`),
// כי היא עונה על שאלה אחרת — לא "מתי" אלא "כמה זמן נשאר לפעול".
export function eventProximityLabel(eventDate, todayIso) {
  if (!eventDate || !todayIso) return ''
  const event = Date.parse(`${eventDate}T00:00:00Z`)
  const today = Date.parse(`${todayIso}T00:00:00Z`)
  if (Number.isNaN(event) || Number.isNaN(today)) return ''

  const days = Math.round((event - today) / (24 * MS_PER_HOUR))
  if (days === 0) return 'היום'
  if (days === 1) return 'מחר'
  if (days === 2) return 'בעוד יומיים'
  if (days < 0) return `לפני ${Math.abs(days)} ימים`
  return `בעוד ${days} ימים`
}

// כל מה ששורה אחת במבט-העל צריכה לדעת על עצמה, במקום אחד.
// 🔴 **"מאויש" = `אושרה סופית` בלבד.** מי שרק אישרה זמינות **אינה** מאיישת — וזו כל הסיבה
// שהמונה החמישי נולד: אירוע עם 3 שאישרו זמינות ואפס מאושרות **עדיין חסר**, אבל הפעולה
// שהוא דורש (לאשר) הפוכה מזו של אירוע שאיש לא ענה בו (לשלוח לעוד).
// ⚠️ **שלושת הספים מגיעים כאובייקט אחד ולא כשלושה ארגומנטים** (מודול 9 · צעד 2.3): שלושה
// מספרים עוקבים בחתימה הם בדיוק המקום שבו שניים מהם מתחלפים בשקט, והשגיאה נראית כמו
// "המסנן 'דחוף' מתנהג מוזר" ולא כמו באג. המפתחות זהים לשמות ב-`HOSTESS_PARAM_NAMES`.
export function overviewRow(project, nowIso, todayIso, thresholds = {}) {
  const { inviteValidityHours, inviteCutoffHours, urgentEventHours } = thresholds
  const counts = countAssignmentStates(project?.assignments, nowIso, inviteValidityHours)
  const required = optionalNumber(project?.required_hostess_count) ?? 0
  const staffed = counts.finallyApproved
  const gap = Math.max(0, required - staffed)
  const isMissing = gap > 0
  const eventStartsAt = eventStartInstant(project?.final_event_date, project?.final_start_time)
  const isFinalDay = isWithinFinalDay(eventStartsAt, nowIso, inviteCutoffHours)

  return {
    project,
    counts,
    required,
    staffed,
    gap,
    isMissing,
    eventStartsAt,
    isFinalDay,
    isUrgent: isUrgentEvent(eventStartsAt, nowIso, urgentEventHours),
    isPast: isPastEvent(project?.final_event_date, todayIso),
    // ⚠️ ההתראה היא על **חוסר** בתוך T-24, לא על הקרבה עצמה (כרטיס מסך 1 §④): אירוע מלא
    // שמתקיים מחר אינו דורש ממנה דבר, וסימון-אזהרה עליו היה מלמד אותה להתעלם מהסימן.
    showsFinalDayAlert: isMissing && isFinalDay,
  }
}

// 🔴 **הסדר הוא התשובה של המסך, לא קישוט** (כרטיס מסך 1 §②): חסרים תחילה, ובתוכם לפי
// קרבת-האירוע; המאוישים אחריהם. ⚠️ ולכן אירוע **חסר ורחוק** עולה מעל **מאויש וקרוב** —
// זה נראה הפוך לאינטואיציה של לוח-זמנים, וזו בדיוק ההבחנה בין מסך-טריאז' לדוח.
// 🚫 שורה בלי תאריך יורדת לסוף קבוצתה ולא מתחזה לקרובה ביותר (`null` ממוין ראשון בהשוואה
// נאיבית — הפוך בדיוק ממה שצריך).
export function sortOverviewRows(rows) {
  return [...(rows ?? [])].sort((a, b) => {
    if (a.isMissing !== b.isMissing) return a.isMissing ? -1 : 1

    const left = a.eventStartsAt
    const right = b.eventStartsAt
    if (left !== right) {
      if (!left) return 1
      if (!right) return -1
      return left < right ? -1 : 1
    }

    // שובר-שוויון יציב: בלעדיו שתי שורות באותו תאריך מחליפות מקום בין רענונים.
    return Number(a.project?.project_id ?? 0) - Number(b.project?.project_id ?? 0)
  })
}

// שני ה-KPI העליונים. 🔴 **אינם עמודה ואינם שאילתה** — הם צירוף של מוני-השורות
// (`screens-approved.md:484-486`), ולכן הם מתארים בדיוק את מה שמוצג ברשימה שמתחתיהם.
export function overviewKpis(rows) {
  const list = rows ?? []
  return {
    missingEvents: list.filter((row) => row.isMissing).length,
    missingWithinFinalDay: list.filter((row) => row.showsFinalDayAlert).length,
    // `pendingInvites` **מכיל** את `expiredInvites` — ר' ההערה על `countAssignmentStates`.
    pendingInvites: list.reduce((sum, row) => sum + row.counts.pending, 0),
    expiredInvites: list.reduce((sum, row) => sum + row.counts.expired, 0),
  }
}

// ── הנגזרות של טבלת-המאגר (משטח 3) ───────────────────────────────────────────

// חלון "אירועים · רבעון אחרון" — **90 יום מתגלגלים**, ואותו חלון בדיוק בטבלה
// ובכרטיס-הצפייה. 🔑 `§11.5` מנמק למה זה חייב להיות חלון אחד: שני חלונות לאותו שם
// היו גורמים למסך לספר סיפור שונה מהדירוג, על אותה דיילת.
export const QUARTER_WINDOW_DAYS = 90

// מוסיף/מחסיר ימים לתאריך-ISO ומחזיר תאריך-ISO. עובר דרך UTC בכוונה: תאריכי `date`
// חוזרים כ-'YYYY-MM-DD' בלי אזור-זמן, ופרשנות מקומית הייתה מזיזה יום שלם בקצוות.
function shiftIsoDate(isoDate, days) {
  const base = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(base.getTime())) return null
  base.setUTCDate(base.getUTCDate() + days)
  return base.toISOString().slice(0, 10)
}

// עמודת "מצב" — שלוש התוויות של כרטיס מסך 3 §③.
//
// 🔴 **סדר הבדיקות אינו שרירותי: `מושבתת` גוברת על אי-זמינות.** דיילת מושבתת אינה
// מקבלת זימונים בכלל, ולכן "לא זמינה 15/08–20/08" עליה הוא מידע נכון-אך-מטעה —
// הוא מרמז שאחרי ה-20/08 היא חוזרת, והיא לא.
//
// 📌 `הנחתי` (נרשם ב-§10 של מדריך-המיקרו): **טווח שכבר עבר אינו מוצג, ומבין הרלוונטיים
// מוצג הקרוב ביותר.** האפיון קובע את התווית ואת מקורה ואינו קובע את הבחירה הזאת;
// היא נגזרה מהמוקאפ המאושר, שמצייר טווחים **עתידיים** (יעל 07/09–14/09 בעוד היום 08/08)
// ⇒ כלומר "עתידי כן, עבר לא". טווח שהסתיים אינו מצב — הוא היסטוריה.
export function hostessDisplayState(hostess, ranges, todayIso) {
  if (hostess?.status === 'inactive') {
    return { label: HOSTESS_STATUS_LABELS.inactive, tone: 'dashed', note: null }
  }

  const relevant = (ranges ?? [])
    .filter((range) => range?.start_date && range?.end_date && range.end_date >= todayIso)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  // הפעיל (זה שכבר התחיל) גובר על העתידי — הוא המצב **עכשיו**, וזו השאלה שהעמודה שואלת.
  const current = relevant.find((range) => range.start_date <= todayIso)
  const chosen = current ?? relevant[0]

  if (chosen) {
    return { label: unavailabilityLabel(chosen), tone: 'warn', note: chosen.note ?? null }
  }

  return { label: HOSTESS_STATUS_LABELS.active, tone: 'ok', note: null }
}

// שני תגי-ההיגיינה של המאגר, ולעולם לא שניהם יחד.
//
// **מה נחשב "לא ענתה":** הסטטוס נשאר `pending`. ⚠️ זה כולל זימון שפג-תוקפו — הוא עדיין
// `pending` במסד, ומבחינת המנהלת הוא בדיוק אותו דבר: היא לא קיבלה תשובה.
//
// 🔴 **הספירה על השורה הקובעת בלבד** (`MAX(assignment_number)` פר-צמד): דיילת שסירבה
// ואז נעקפה בטלפון **אינה** "לא ענתה" — היא ענתה, ואז שינתה את דעתה לטובה.
//
// **שני תגים ולא אחד** (כרטיס מסך 3 §③): מי שקיבלה פחות מ-N זימונים ולא ענתה על אף אחד
// **מתה באותה מידה** — אבל היא אינה נכנסת למסנן, כי המסנן שואל "מי שרפה N הזדמנויות".
// ⇒ `isChip:false` אומר לקורא: הצג תווית, אל תכליל אותה במסנן.
export function unansweredStreakTag(rows, streakN) {
  const threshold = optionalNumber(streakN)
  if (threshold === null || threshold < 1) return null

  const invites = finalAssignmentRows(rows)
    .filter((row) => row?.invite_sent_at)
    // 🔴 מיון לפי **תאריך-השליחה**, לא לפי סדר-המערך: הקורא מקבל שורות בסדר שאילתה
    // שרירותי, ו"ה-N האחרונים" לפי סדר-מערך היה מחזיר קבוצה אחרת לגמרי.
    .sort((a, b) => String(b.invite_sent_at).localeCompare(String(a.invite_sent_at)))

  if (invites.length === 0) return null

  const isUnanswered = (row) => row.assignment_status === 'pending'

  if (invites.length >= threshold) {
    const lastN = invites.slice(0, threshold)
    return lastN.every(isUnanswered)
      ? { label: `לא ענתה ל-${threshold} האחרונים`, isChip: true }
      : null
  }

  return invites.every(isUnanswered)
    ? { label: `לא ענתה מעולם (${invites.length} זימונים)`, isChip: false }
    : null
}

// כמה אירועים היא עבדה בפועל ב-90 הימים האחרונים.
//
// 🔴 **"עבדה" = `אושרה סופית` **וגם** האירוע כבר עבר.** זימון שנשלח אינו עבודה, ואירוע
// עתידי טרם קרה — שניהם היו מנפחים את המספר שהמנהלת מסתכלת עליו כדי לדעת מי עמוסה.
// 🔴 **וסופרים אירועים, לא שורות:** שתי שורות-שיבוץ לאותו פרויקט הן אירוע אחד.
//
// 📌 `הנחתי` (נרשם ב-§10): **כלל-הספירה זהה לזה של "עבדה אצל <לקוח>"** (הנחה 11
// בבלופרינט). הבלופרינט קובע את **החלון** (הנחה 10) ואת **כלל-הספירה** (הנחה 11) בשתי
// שורות נפרדות ואינו אומר שהם אותו כלל; אחדתי אותם, כי שני מספרים שנקראים "אירועים"
// ונספרים אחרת על אותו מסך הם בדיוק הסיפור-הכפול ש-`§11.5` אוסר.
export function eventsInLastQuarter(rows, todayIso) {
  const cutoff = shiftIsoDate(todayIso, -QUARTER_WINDOW_DAYS)
  if (!cutoff) return 0

  const projects = new Set()
  for (const row of finalAssignmentRows(rows)) {
    if (row?.assignment_status !== 'finally_approved') continue
    // 🆕 12/08/2026 — אירוע שבוטל אינו "עומס". ר' `eventWasCancelled` לכלל ולמה הוא משותף.
    if (eventWasCancelled(row)) continue
    const eventDate = row?.projects?.final_event_date
    if (!eventDate) continue
    if (eventDate < todayIso && eventDate >= cutoff) projects.add(row.project_id)
  }
  return projects.size
}

// השיבוצים שחלון-ההשבתה (§א4) מונה **בשם ובתאריך** לפני שהוא מציע לשחרר אותה.
//
// 🔴 **"פעיל" = `אושרה סופית` או `אישרה זמינות`.** ‏`ממתינה למענה` אינה כאן במכוון:
// זימון שנשלח ולא נענה אינו התחייבות, והצפת החלון בזימונים פתוחים הייתה הופכת אותו
// לרעש שלוחצים דרכו. 🔑 **וזו ההנחה שבחרתי לצד הבטוח:** הסיכון שהחלון קיים למנוע הוא
// **שהמנהלת לא תדע על התחייבות** — ולכן `אישרה זמינות` נכללת, גם אם טרם אושרה סופית.
// 📌 `הנחתי` — §א4 כותב "שיבוצים עתידיים פעילים" ואינו מונה אילו סטטוסים. נרשם ב-§10.
const ACTIVE_COMMITMENT_STATUSES = ['finally_approved', 'confirmed_available']

export function futureActiveAssignments(rows, todayIso) {
  return finalAssignmentRows(rows)
    .filter((row) => {
      if (!ACTIVE_COMMITMENT_STATUSES.includes(row?.assignment_status)) return false
      const eventDate = row?.projects?.final_event_date
      return Boolean(eventDate) && eventDate >= todayIso
    })
    .map((row) => ({
      projectId: row.project_id,
      // 🆕 מזהי-השורה נוספו כדי שקורא (חלון-ההשבתה ב-RepositoryTab) יוכל לקרוא ל-`releaseAssignment`
      // בלי לשכפל את הסינון/הקיפול שכבר קרו כאן — לא צריכים לצריכה הקיימת (eventName/eventDate/statusLabel).
      hostessId: row.hostess_id,
      assignmentNumber: row.assignment_number,
      eventName: row.projects?.event_name ?? null,
      eventDate: row.projects.final_event_date,
      statusLabel: ASSIGNMENT_STATUS_LABELS[row.assignment_status],
    }))
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
}

// ── תרגום שגיאות-המסד ────────────────────────────────────────────────────────

// זיהוי לפי **שם האילוץ** ולא לפי נוסח ההודעה: את הנוסח PostgreSQL מנסח, ואילו השם
// הוא חוזה שאנחנו כתבנו במיגרציה. `docs/schema.sql:850` אומר זאת במפורש על האינדקס
// הראשון — "שם האינדקס הוא חוזה מול הממשק; שינוי-שם בלי עדכון המיפוי מפיל להודעה גנרית".
const SERVER_CONSTRAINT_RULES = [
  {
    constraint: 'assignments_one_event_per_day',
    message:
      'הדיילת כבר מאושרת סופית לאירוע אחר באותו תאריך — לא ניתן לאשר אותה לשני אירועים ביום.',
  },
  {
    constraint: 'assignments_one_shift_lead_per_project',
    message: 'כבר סומנה אחראית משמרת לאירוע הזה — יש להסיר את הסימון הקיים תחילה.',
  },
]

// מחזירה ניסוח-מסך לשגיאת-מסד מוכרת, או `null` כשהיא אינה מוכרת — ואז הקורא נשאר עם
// הודעת-ה-fallback שלו. **null ולא ניחוש:** מחרוזת-מסד שלא מופתה נושאת אנגלית, שמות
// אילוצים ושמות-עמודות, וכולם גרועים יותר מ"שמירת הדיילת נכשלה." הכללי.
// *(אותה תבנית בדיוק כמו `quoteServerErrorMessage` — ומודול חדש מחקה, לא ממציא.)*
export function hostessServerErrorMessage(error) {
  if (error?.code === '42501') {
    return 'אין לך הרשאת עריכה על "דיילות" — יש לפנות למנכ"ל להרחבת ההרשאה.'
  }

  const raw = typeof error?.message === 'string' ? error.message.trim() : ''
  if (!raw) return null

  const rule = SERVER_CONSTRAINT_RULES.find((r) => raw.includes(r.constraint))
  if (rule) return rule.message

  // ‏P0001 = הטריגרים שכתבנו בעצמנו (שכר-מינימום, נעילת-הצעה). הנוסח שלהם כבר עברי,
  // נוקב בשני המספרים, ונכתב למשתמשת ⇒ מועבר כלשונו במקום להיקבר בהודעה גנרית.
  return error?.code === 'P0001' ? raw : null
}
