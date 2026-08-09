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

// שלושה ספי-זמן שקל להחליף ביניהם, ולכן הם נקובים בשמם ולא כמספרים בתוך תנאי:
// ‏48 — תוקף הקישור מרגע השליחה · 24 — הקישור מת לפני האירוע, והמסך מחליף מצב ·
// ‏72 — "דחוף": מסנן המבט-על וברירת-המחדל של זווית-המיון.
export const INVITE_VALIDITY_HOURS = 48
export const INVITE_CUTOFF_HOURS_BEFORE_EVENT = 24
export const URGENT_EVENT_HOURS = 72

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
export function minWageError(hourlyRate, minWageParamValue) {
  const min = optionalNumber(minWageParamValue)
  if (min === null) return 'שכר המינימום אינו מוגדר בהגדרות המערכת — לא ניתן לשמור דיילת.'

  const rate = optionalNumber(hourlyRate)
  if (rate === null) return 'יש להזין תעריף שעתי.'

  return rate < min ? `השכר השעתי חייב להיות לפחות ${min} ₪ (שכר מינימום)` : null
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
// למענה", או שזימון מעולם לא נשלח). `0` = פג.
export function inviteHoursLeft(assignment, nowIso) {
  if (assignment?.assignment_status !== 'pending') return null
  const sent = Date.parse(assignment?.invite_sent_at ?? '')
  const now = Date.parse(nowIso ?? '')
  if (Number.isNaN(sent) || Number.isNaN(now)) return null

  const remaining = sent + INVITE_VALIDITY_HOURS * MS_PER_HOUR - now
  return remaining <= 0 ? 0 : Math.ceil(remaining / MS_PER_HOUR)
}

// "פג תוקף" = `ממתינה למענה` **וגם** עברו 48 שעות מ-`invite_sent_at`. שום דבר אחר.
export function isInviteExpired(assignment, nowIso) {
  return inviteHoursLeft(assignment, nowIso) === 0
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
// ⚠️ אירוע שכבר התחיל אינו "בתוך 24 שעות" — הוא נגמר, וזה מצב אחר לגמרי.
export function isWithinFinalDay(eventStartsAt, nowIso) {
  const left = hoursUntilEvent(eventStartsAt, nowIso)
  return left !== null && left > 0 && left <= INVITE_CUTOFF_HOURS_BEFORE_EVENT
}

// "דחוף" — סף אחר לגמרי (72), ומשמש למסנן ולברירת-מחדל של זווית-המיון.
export function isUrgentEvent(eventStartsAt, nowIso) {
  const left = hoursUntilEvent(eventStartsAt, nowIso)
  return left !== null && left > 0 && left <= URGENT_EVENT_HOURS
}

// התווית שמוצגת בפועל על התג. סדר הבדיקות אינו שרירותי: הנגזרות גוברות על הסטטוס
// הגולמי, אחרת זימון מת היה מוצג "ממתינה למענה" והמנהלת הייתה ממשיכה לחכות לו.
// 🚫 סטטוס לא-מוכר מוחזר כ-"—" ולא כערכו: ערך-enum באנגלית על מסך עברי הוא דליפה.
export function assignmentDisplayStatus(assignment, nowIso) {
  if (isInviteExpired(assignment, nowIso)) return EXPIRED_INVITE_LABEL

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
// 🔴 **"ממתינות" ו"פג תוקפן" זרים זה לזה, ובכוונה** (`spec.md:135`): *"3 ממתינות"*
// אומר "תני להן זמן", *"3 פג תוקפן"* אומר "שלחי לעוד שלוש, עכשיו" — אותו מספר ושתי
// פעולות הפוכות. ספירת זימון מת בתוך "ממתינות" הייתה משאירה את המנהלת מחכה לקישור
// שכבר אינו עובד. *(הזרות עצמה היא הנחה שמילאתי — האפיון מונה את שני התגים ואינו
// אומר במפורש שהם זרים; ר' §9 במדריך-המיקרו.)*
export function countAssignmentStates(rows, nowIso) {
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
    if (isInviteExpired(row, nowIso)) {
      counts.expired += 1
      continue
    }
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
