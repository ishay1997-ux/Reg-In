// מודל-התצוגה של מרחב דוח השכר — **טהור**: בלי רשת, בלי DOM, בלי שעון (השעון מוזרק).
//
// 🔴 **מה אין כאן: חישוב כסף.** כל סכום מגיע מהמסד. כאן רק: תוויות, סינון, ספירת דיילות
// מתוך הרשימה המלאה שהשרת החזיר (לא מהעמוד המוצג), ומיפוי מצב ⇒ הודעה ⇒ פעולה.
// כל מחרוזת כאן היא נוסח מוצר מתוך טבלאות האפיון אחרי תיקוני מדריך ה-UX (`ux-guide.md` §ב).
// מסכי צוות: לשון נייטרלית או זכר ("נסה שוב", "יש לרענן").

import { formatDate, formatTimestampFull } from '@/lib/dates'

export const VIEWS = ['draft', 'review', 'final', 'history']
export const FILTERS = ['action', 'noreply', 'approved', 'all']
export const KINDS = ['regular', 'supplement']

export const VIEW_LABELS = {
  draft: 'טיוטה',
  review: 'מעקב דיילות',
  final: 'אישור סופי',
  history: 'היסטוריה',
}

export const FILTER_LABELS = {
  action: 'דורש טיפול',
  noreply: 'לא השיבו',
  approved: 'אושרו',
  all: 'הכל',
}

// ── כתובת (URL) ─────────────────────────────────────────────────────────────────

// `YYYY-MM` מהכתובת ⇒ `YYYY-MM-01` (צורת `p_period`). ערך זר ⇒ null, ואז ברירת-מחדל.
export function parsePeriodParam(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value ?? ''))
  if (!match) return null
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return `${match[1]}-${match[2]}-01`
}

export function periodParamOf(period) {
  return String(period ?? '').slice(0, 7)
}

export function parseChoice(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback
}

export function parsePositiveInt(value) {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isInteger(n) && n >= 1 ? n : null
}

// החודש האחרון שהסתיים, **בשעון ישראל**. ברירת-מחדל לבורר בלבד — השרת הוא שקובע אם
// החודש הסתיים (`month_state`); זו רק נוחות בפתיחת המסך.
export function lastEndedPeriod(now) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now)
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`
}

// "01/11/2026" — היום הראשון אחרי חודש-העבודה. חשבון-לוח על מחרוזת התקופה, לא שעון.
export function nextMonthStartLabel(period) {
  const match = /^(\d{4})-(\d{2})/.exec(String(period ?? ''))
  if (!match) return ''
  const year = Number(match[1])
  const month = Number(match[2])
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  return `01/${String(nextMonth).padStart(2, '0')}/${nextYear}`
}

export function monthNotEndedMessage(period) {
  return `הפקה ושליחה יתאפשרו מ-${nextMonthStartLabel(period)}, אחרי סוף החודש`
}

// ── זמן ישראל לשדה `datetime-local` ─────────────────────────────────────────────

function jerusalemWallClock(instantMs) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(instantMs))
  const get = (type) => Number(parts.find((p) => p.type === type)?.value)
  const hour = get('hour') === 24 ? 0 : get('hour')
  return Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'))
}

// "2026-10-14T18:00" (שעון-קיר בישראל) ⇒ ISO ב-UTC. השדה מוצג כשעון ישראל בכל דפדפן,
// גם אם מחשב המשתמש מוגדר לאזור זמן אחר.
export function jerusalemLocalToIso(local) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(local ?? ''))
  if (!match) return null
  const [, y, mo, d, h, mi] = match.map(Number)
  const wall = Date.UTC(y, mo - 1, d, h, mi)
  let guess = wall
  for (let i = 0; i < 2; i += 1) guess = wall - (jerusalemWallClock(guess) - guess)
  return new Date(guess).toISOString()
}

export function isoToJerusalemLocal(iso) {
  const ms = new Date(iso ?? '').getTime()
  if (Number.isNaN(ms)) return ''
  return new Date(jerusalemWallClock(ms)).toISOString().slice(0, 16)
}

// ── שעות (F12: סיכומים בשעות, לא בש"ח) ──────────────────────────────────────

// סכום שעות להצגה בלבד, במאיות-שעה שלמות. ערך שאינו מספר אינו נספר כאפס בשקט — הוא מחזיר null.
export function hoursSum(lines) {
  let hundredths = 0
  for (const line of lines ?? []) {
    const n = Number(line?.hours)
    if (line?.hours == null || !Number.isFinite(n)) return null
    hundredths += Math.round(n * 100)
  }
  return hundredths / 100
}

// 11.5 ⇒ "11.5" · 6 ⇒ "6" · 4.25 ⇒ "4.25"
export function formatHours(hours) {
  const n = Number(hours)
  if (hours == null || !Number.isFinite(n)) return null
  return String(Number(n.toFixed(2)))
}

// ── ספירה בעברית ───────────────────────────────────────────────────────────────

export function countPhrase(n, one, many) {
  if (n === 1) return one
  return `${n} ${many}`
}

// ── שגיאות ─────────────────────────────────────────────────────────────────────

const ERROR_MESSAGES = {
  PERMISSION_DENIED: 'אין לך הרשאה לפעולה הזו',
  NETWORK: 'אין חיבור לשרת. נסה שוב',
  RESULT_UNKNOWN: 'עוד לא ידוע אם הפעולה הושלמה. יש לבדוק לפני ניסיון נוסף',
  PREVIEW_CHANGED: 'הנתונים השתנו. יש לרענן לפני אישור',
  STALE_VERSION: 'הנתונים השתנו. יש לרענן לפני אישור',
  STALE_ATTEMPT: 'הנתונים השתנו. יש לרענן לפני אישור',
  MONTH_NOT_ENDED: 'החודש עוד לא הסתיים. אפשר להוריד טיוטה בלבד',
  FUTURE_PERIOD: 'אי אפשר לבחור חודש עתידי',
  PERIOD_INVALID: 'החודש שנבחר אינו תקין',
  PERIOD_LOCKED: 'החודש הזה נעול להפקה. יש לפנות למנהל המערכת',
  PERIOD_EXISTS: 'לחודש הזה כבר הופק דוח. אפשר לצפות בו בהיסטוריה',
  PERIOD_IN_REVIEW: 'לחודש הזה כבר פתוחה בדיקה',
  ORIGINAL_INVALID: 'הדוח המקורי לא נמצא לחודש הזה',
  BLOCKERS_PRESENT: 'יש שורות חסומות. יש לתקן אותן לפני שליחת הסיכומים',
  REVIEW_EMPTY: 'אין לחודש הזה שעות מאושרות שעוד לא נכללו בדוח',
  MANAGER_REVIEW_REQUIRED: 'יש לאשר את הטיוטה לפני שליחת הסיכומים',
  DEADLINE_INVALID: 'המועד האחרון צריך להיות בין 5 דקות ל-30 יום מעכשיו',
  TEMPLATE_INVALID: 'תבנית המייל חסרה או לא תקינה. יש לתקן אותה בהגדרות',
  ISSUE_DISABLED: 'ההפקה בתהליך החדש עדיין לא הופעלה',
  DEADLINE_NOT_PASSED: 'המועד האחרון לתגובה עוד לא עבר',
  OBJECTION_OPEN: 'יש פנייה פתוחה. יש לטפל בה קודם',
  REASON_REQUIRED: 'יש לכתוב סיבה',
  CONTACT_EVIDENCE_REQUIRED: 'הסיכום לא נשלח לדיילת. יש לתעד איך נוצר איתה קשר',
  OPERATION_ACTIVE: 'הפקה כבר בתהליך. אפשר לבדוק את מצבה',
  ALREADY_CLAIMED: 'השיבוץ כבר נכלל בדוח שהופק ואי אפשר לתקן אותו',
  CORRECTION_NOT_SUPPORTED: 'אי אפשר לתקן את השדה הזה מכאן',
  PROJECT_ARCHIVED: 'הפרויקט בארכיון ואי אפשר לתקן בו שעות',
  CORRECTION_OUT_OF_BOUNDS: 'הערך מחוץ לטווח המותר',
  REVIEW_NOT_FOUND: 'הבדיקה לא נמצאה. יש לרענן',
  REVIEW_NOT_READY: 'עוד לא הכל מוכן להפקה. הסיבות מופיעות ברשימה',
  IDEMPOTENCY_MISMATCH: 'הבקשה לא תואמת להפקה שכבר התחילה. יש לרענן',
  PAYROLL_BUSY: 'הפקה אחרת רצה כרגע. נסה שוב בעוד רגע',
  OPERATION_STATE: 'מצב ההפקה השתנה. יש לבדוק סטטוס',
  NOT_RETRYABLE: 'אי אפשר לשלוח שוב במצב הנוכחי',
  NOT_CLAIMABLE: 'שליחה כבר בתהליך',
  DELIVERY_UNKNOWN: 'לא ידוע אם הדוח נשלח. יש לבדוק לפני שליחה חוזרת',
  DELIVERY_ACTIVE: 'שליחה כבר בתהליך',
  LEGACY_REPORT_MISMATCH: 'את הדוח הזה יש לשלוח מהתהליך הקודם',
  LEGACY_DISABLED: 'התהליך הקודם כבר לא פעיל',
  ARTIFACT_REFERENCE_MISSING: 'הקובץ המקורי לא נשמר. מוצגים נתוני הדוח כפי שהופק',
  ARTIFACT_NOT_FOUND: 'הקובץ לא נמצא באחסון',
  ARTIFACT_TOO_LARGE: 'הקובץ גדול מדי לשליחה',
  ORIGIN_NOT_ALLOWED: 'הבקשה נשלחה מכתובת לא מורשית',
  RECIPIENT_INVALID: 'כתובת רואה החשבון חסרה או לא תקינה. יש לתקן אותה בהגדרות',
  CONTACT_MISSING: 'אין כתובת מייל לדיילת',
  SHAPE: 'התקבלה תשובה לא צפויה מהשרת. נסה שוב',
  OPERATION_NOT_FOUND: 'ההפקה לא נמצאה. יש לרענן את העמוד',
  REVIEW_NOT_OPEN: 'הבדיקה לחודש הזה כבר לא פתוחה. יש לרענן את העמוד',
  INVALID_TRANSITION: 'הפעולה כבר לא אפשרית במצב הנוכחי. יש לרענן את העמוד',
  SALARY_LINE_DATE_MISSING: 'לאחת המשמרות חסר תאריך, ולכן הקובץ לא נבנה. הדוח לא הופק ולא נשלח',
  MAIL_NOT_CONFIGURED: 'שליחת המיילים לא מוגדרת. יש לפנות למנהל המערכת',
  INVALID_REQUEST: 'הבקשה לא תקינה. יש לרענן את העמוד ולנסות שוב',
  RPC_ERROR: 'השרת החזיר תשובה לא צפויה. יש לבדוק סטטוס לפני ניסיון נוסף',
}

// קודי `SALARY_*` של בניית הקובץ (C, `document.ts`) — כולם אומרים שנתוני הדוח לא הסתדרו ולכן
// הקובץ לא נבנה; ניסיון חוזר לא יעזור בלי תיקון הנתונים.
const SALARY_BUILD_MESSAGE = 'נתוני הדוח לא הסתדרו בבניית הקובץ. הדוח לא הופק ולא נשלח'

export function payrollErrorMessage(codeOrError) {
  const code = typeof codeOrError === 'string' ? codeOrError : codeOrError?.code
  if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code]
  // אין לנו נוסח לקוד ⇒ הנוסח העברי של השרת, אם יש — לא "נסה שוב" כללי.
  if (typeof codeOrError === 'object' && codeOrError?.serverMessage)
    return codeOrError.serverMessage
  if (typeof code === 'string' && code.startsWith('SALARY_')) return SALARY_BUILD_MESSAGE
  return 'הפעולה נכשלה. נסה שוב'
}

// תשובות שאומרות שההפקה שהמסך מחכה לה כבר לא רלוונטית כאן: הדוח הופק בלשונית או במכשיר
// אחר, או שההפקה שבכתובת לא קיימת. המסך מרענן את הנתונים ומפסיק לשאול על מצבה — בלי זה
// הלשונית השנייה נשארה על "מוכן להפקה" ושאלה שוב ושוב (קבלה בייצור על יולי, 14/10).
const ISSUED_ELSEWHERE_CODES = new Set(['REVIEW_NOT_OPEN', 'PERIOD_EXISTS', 'OPERATION_NOT_FOUND'])

export function isIssuedElsewhereCode(code) {
  return ISSUED_ELSEWHERE_CODES.has(code)
}

export function isStaleCode(code) {
  return code === 'PREVIEW_CHANGED' || code === 'STALE_VERSION' || code === 'STALE_ATTEMPT'
}

// ── סוג הדוח ───────────────────────────────────────────────────────────────────

export function kindLabel(kind, supplementSeq) {
  if (kind !== 'supplement') return 'רגיל'
  return Number.isInteger(supplementSeq) ? `השלמה ${supplementSeq}` : 'השלמה'
}

// ── מצבי דיילת (מעקב) ──────────────────────────────────────────────────────────

const APPROVED_STATES = new Set([
  'hostess_approved',
  'manager_approved_no_response',
  'manager_resolved',
])

// עמודת סטטוס אחת למעקב (תיקון ישי 14/10 00:35: *"מרגיש יותר מדי צבועני"*): המצב החשוב
// ביותר בלבד, לפי סדר קבוע. צבע רק למה שדורש פעולה — כמו Material 3 ו-Shopify Polaris,
// שמשאירים מצב רגיל ניטרלי. `kind` קובע את המראה ברכיב, והטקסט תמיד נוכח (לא צבע בלבד):
//   attention — צ'יפ ענבר רך · error — טקסט אדום עם אייקון · unknown — ענבר רך עם אייקון ·
//   neutral — טקסט אפור · ok — ✓ וטקסט ירוק-כהה.
// החלטה תקפה (אישור דיילת / אושר לפי תיעוד / פנייה שטופלה, על סיכום עדכני ובלי פנייה פתוחה)
// גוברת על מצב המשלוח: מי שכבר הוחלט עליה לא "דורשת טיפול" ולא מקבלת "שלח שוב" — גם אם
// המייל שלה נכשל או שמצבו לא ידוע (סקירת UX מקומית 14/10, פריט 1).
export function isDecided(recipient) {
  return (
    APPROVED_STATES.has(recipient?.state) &&
    recipient?.digest_current !== false &&
    !recipient?.open_case_id
  )
}

const DECISION_LABELS = {
  hostess_approved: 'הדיילת אישרה',
  manager_approved_no_response: 'אושר לפי תיעוד',
  manager_resolved: 'הפנייה טופלה',
}

export function recipientStatus(recipient) {
  const deliveryState = recipient?.delivery?.state
  if (recipient?.open_case_id || recipient?.state === 'objection_open') {
    return { label: 'פנייה פתוחה', kind: 'attention' }
  }
  if (isDecided(recipient)) return { label: DECISION_LABELS[recipient.state], kind: 'ok' }
  if (deliveryState === 'failed') return { label: 'השליחה נכשלה', kind: 'error' }
  if (deliveryState === 'unknown') return { label: 'לא ידוע אם נשלח', kind: 'unknown' }
  // סיכום שמעולם לא יצא אליה הוא "לא נשלח" — גם אם הנתונים השתנו בינתיים: "עודכן — נדרש אישור
  // מחדש" מניח שהיא כבר קיבלה ואישרה (קבלה בייצור על יולי, 14/10).
  if (!recipient?.delivery) return { label: 'לא נשלח', kind: 'neutral' }
  if (recipient?.digest_current === false) {
    return { label: 'עודכן — נדרש אישור מחדש', kind: 'attention' }
  }
  if (deliveryState === 'queued' || deliveryState === 'sending') {
    return { label: 'בשליחה', kind: 'neutral' }
  }
  return { label: 'ממתין לתגובה', kind: 'neutral' }
}

// דיילת "דורשת טיפול" כשיש משהו שהמנהלת יכולה לעשות עכשיו. סדר-המיון קבוע:
// דורש טיפול ⇐ לא השיבו ⇐ אושרו, ואז לפי שם (מדריך ה-UX §ד).
function recipientBucket(recipient, { deadlinePassed, distributed }) {
  const deliveryState = recipient?.delivery?.state
  if (isDecided(recipient)) return 'approved'
  const needsAction =
    Boolean(recipient?.open_case_id) ||
    recipient?.state === 'objection_open' ||
    recipient?.digest_current === false ||
    recipient?.contact_changed === true ||
    recipient?.email_present === false ||
    deliveryState === 'failed' ||
    deliveryState === 'unknown' ||
    (distributed && !recipient?.delivery) ||
    (deadlinePassed && recipient?.state === 'awaiting')
  if (needsAction) return 'action'
  if (APPROVED_STATES.has(recipient?.state)) return 'approved'
  return 'noreply'
}

// למה דיילת נמצאת ב"דורש טיפול" — משפט גלוי בשורה, לא tooltip. `null` כשאין מה לעשות.
// הסבר קצר בעמודת "טיפול" — רק מה שהסטטוס עצמו לא אומר (מה לעשות, או למה). `null` כשאין.
export function actionReason(recipient, { deadlinePassed, distributed } = {}) {
  if (isDecided(recipient)) return null
  // שורה שתוקנה ומחכה לסיכום מעודכן (הסיכום הישן הוחלף, או שהשורה החדשה עוד לא נשלחה) —
  // זה מה שיש לעשות, לא "המועד עבר" (סקירת UX מקומית, פריט 4).
  if (recipient?.email_present === false) return 'אין כתובת מייל. אחרי המועד אפשר לאשר לפי תיעוד'
  // בלי ניסיון משלוח על השורה הנוכחית אי אפשר לדעת אם קיבלה פעם סיכום קודם (שורה חדשה אחרי
  // תיקון) או שמעולם לא קיבלה — לכן ניסוח שנכון בשני המקרים, ולא "מעודכן" (קבלה בייצור, 14/10).
  if (!recipient?.delivery) return distributed ? 'יש לשלוח את הסיכום' : null
  if (recipient?.digest_current === false) return 'יש לשלוח סיכום מעודכן'
  if (recipient?.contact_changed) return 'כתובת המייל השתנתה. יש לשלוח שוב'
  if (recipient?.delivery?.state === 'unknown') return 'יש לבדוק לפני שליחה חוזרת'
  if (deadlinePassed && recipient?.state === 'awaiting' && !recipient?.open_case_id) {
    return 'המועד עבר בלי תגובה'
  }
  return null
}

// "פעולה אחרונה" בטבלת המעקב. יצירת השורה אינה פעולה: לדיילת שלא נשלח אליה סיכום ולא הוחלט
// עליה אין פעולה אחרונה ⇒ null ("—"), גם אם המסד מחזיר את זמן היצירה.
export function lastActionAt(recipient) {
  if (!recipient?.delivery && !recipient?.decided_at) return null
  return recipient?.last_action_at ?? null
}

const BUCKET_ORDER = { action: 0, noreply: 1, approved: 2 }

// מסנן + חיפוש על **כל** הרשימה (300 דיילות), ומונים מאותה רשימה — לא מהעמוד.
export function filterRecipients(recipients, { filter, query, deadlinePassed, distributed }) {
  const q = String(query ?? '').trim()
  const withBucket = (recipients ?? []).map((r) => ({
    recipient: r,
    bucket: recipientBucket(r, { deadlinePassed, distributed }),
  }))
  const counts = { action: 0, noreply: 0, approved: 0, all: withBucket.length }
  for (const { bucket } of withBucket) counts[bucket] += 1
  const rows = withBucket
    .filter(({ bucket }) => filter === 'all' || bucket === filter)
    .filter(({ recipient }) => !q || String(recipient.hostess_name ?? '').includes(q))
    .sort(
      (a, b) =>
        BUCKET_ORDER[a.bucket] - BUCKET_ORDER[b.bucket] ||
        String(a.recipient.hostess_name ?? '').localeCompare(
          String(b.recipient.hostess_name ?? ''),
          'he',
        ),
    )
  return { rows, counts }
}

// ברירת-המחדל: "דורש טיפול" כשיש כאלה, אחרת "הכל".
export function defaultFilter(counts) {
  return counts.action > 0 ? 'action' : 'all'
}

// ── פניות ──────────────────────────────────────────────────────────────────────

// הכרעת ישי F11 (14/10 00:10): הדיילת מאשרת משמרות ושעות בלבד, ולכן אין קטגוריית תעריף,
// בונוס או נסיעות — פנייה של דיילת היא על שעות או על משמרת.
export const CASE_CATEGORY_LABELS = {
  hours: 'שעות',
  missing_shift: 'משמרת חסרה',
  not_worked: 'משמרת שלא עבדתי בה',
  other: 'אחר',
}

const CASE_STATUS = {
  open: { label: 'פתוחה', tone: 'warn' },
  correction_pending: { label: 'ממתינה לתיקון', tone: 'warn' },
  resolved_accepted: { label: 'תוקנה', tone: 'ok' },
  resolved_rejected: { label: 'נדחתה', tone: 'muted' },
  resolved_noted: { label: 'טופל מחוץ לדוח', tone: 'teal' },
  closed_post_issue: { label: 'נסגרה', tone: 'muted' },
}

export function caseStatusTag(status) {
  return CASE_STATUS[status] ?? { label: 'פתוחה', tone: 'warn' }
}

export function isCaseOpen(status) {
  return status === 'open' || status === 'correction_pending'
}

// ── חוסמי הפקה (מוכנות) ⇒ משפט גלוי + המקום שפותר אותו ──────────────────────────

export function blockerText(blocker, { period }) {
  const n = blocker?.count ?? 0
  switch (blocker?.code) {
    case 'ISSUE_DISABLED':
      return { text: 'ההפקה בתהליך החדש עדיין לא הופעלה', target: null }
    case 'MONTH_NOT_ENDED':
      return { text: monthNotEndedMessage(period), target: null }
    case 'VERSION_STALE':
      return { text: 'הנתונים השתנו מאז הטיוטה. יש לרענן', target: { view: 'review' } }
    case 'MANAGER_APPROVAL_REQUIRED':
      return { text: 'הטיוטה עוד לא אושרה', target: { view: 'review' } }
    case 'PREVIEW_BLOCKERS':
      return { text: 'יש שורות חסומות בטיוטה', target: { view: 'draft' } }
    case 'NOT_COVERED':
      return {
        text: `${countPhrase(n, 'דיילת אחת', 'דיילות')} בלי סיכום לבדיקה`,
        target: { view: 'review', filter: 'action' },
      }
    case 'DIGEST_STALE':
      return {
        text:
          n === 1 ? 'סיכום אחד השתנה ומחכה לבדיקה חוזרת' : `${n} סיכומים השתנו ומחכים לבדיקה חוזרת`,
        target: { view: 'review', filter: 'action' },
      }
    case 'OBJECTION_OPEN':
      return {
        text: `${countPhrase(n, 'פנייה פתוחה אחת', 'פניות פתוחות')}`,
        target: { view: 'review', filter: 'action' },
      }
    case 'DECISIONS_MISSING':
      return {
        text: `${countPhrase(n, 'דיילת אחת', 'דיילות')} עוד בלי אישור`,
        target: { view: 'review', filter: 'noreply' },
      }
    case 'RECIPIENT_INVALID':
      return { text: 'כתובת רואה החשבון חסרה או לא תקינה בהגדרות', target: null }
    case 'TEMPLATE_INVALID':
      return { text: 'תבנית המייל לרואה החשבון לא תקינה בהגדרות', target: null }
    case 'OPERATION_ACTIVE':
      return { text: 'הפקה כבר בתהליך', target: { view: 'final' } }
    case 'REVIEW_NOT_OPEN':
      return { text: 'הבדיקה לחודש הזה כבר לא פתוחה', target: null }
    default:
      return { text: payrollErrorMessage(blocker?.code), target: null }
  }
}

// ── הפקה סופית: מצב הפעולה ⇒ שלב, הודעה ופעולה ────────────────────────────────

// ערכי `failure_code` כפי ש-C כותב אותם (בדיקת התאמה 14/10, ממצא 5).
const STORAGE_FAILURES = new Set([
  'ARTIFACT_TOO_LARGE',
  'STORAGE_UPLOAD_FAILED',
  'XLSX_BUILD_FAILED',
])

// מחזיר `{busy, tone, text, action}`. `action` ∈ resume | check_status | retry_send | null.
export function operationStage(status) {
  if (!status) return null
  const attempt = status.accountant_attempt
  const next = status.next_action
  if (status.state === 'preparing') {
    return {
      busy: next === 'wait',
      tone: 'info',
      text: 'מכין ושומר את הקובץ…',
      action: next === 'resume' ? 'resume' : null,
    }
  }
  if (status.state === 'prepared') {
    return {
      busy: next === 'wait',
      tone: 'info',
      text: 'מפיק את הדוח…',
      action: next === 'resume' ? 'resume' : null,
    }
  }
  if (status.state === 'failed') {
    if (isStaleCode(status.failure_code)) {
      return {
        busy: false,
        tone: 'warn',
        text: payrollErrorMessage('PREVIEW_CHANGED'),
        action: null,
      }
    }
    if (STORAGE_FAILURES.has(status.failure_code) || !status.failure_code) {
      return {
        busy: false,
        tone: 'error',
        text: 'שמירת הקובץ נכשלה. הדוח לא הופק ולא נשלח, אפשר לנסות שוב',
        action: null,
      }
    }
    return {
      busy: false,
      tone: 'error',
      text: payrollErrorMessage(status.failure_code),
      action: null,
    }
  }
  if (status.state === 'superseded') {
    return { busy: false, tone: 'info', text: 'ההפקה הזו הוחלפה בהפקה חדשה יותר', action: null }
  }
  // committed — הדוח הופק; עכשיו רק מצב המשלוח לרואה החשבון.
  return accountantStage(attempt?.state, next)
}

function accountantStage(state, next) {
  switch (state) {
    case 'sent':
      return { busy: false, tone: 'ok', text: 'הדוח נשמר ונשלח לרואה החשבון', action: null }
    case 'failed':
      return {
        busy: false,
        tone: 'error',
        text: 'הדוח נשמר אבל לא נשלח. אפשר לשלוח שוב',
        action: 'retry_send',
      }
    case 'unknown':
      return {
        busy: false,
        tone: 'warn',
        text: 'לא ידוע אם הדוח נשלח. יש לבדוק לפני שליחה חוזרת',
        action: 'check_status',
      }
    default:
      return {
        busy: next === 'wait' || next == null,
        tone: 'info',
        text: 'שולח לרואה החשבון…',
        action: next === 'resume' ? 'resume' : null,
      }
  }
}

// תוצאת שליחה חוזרת לפי מצב הניסיון שחזר מהשרת (בדיקת התאמה 14/10, ממצא 3): השרת מחזיר
// `ok:true` גם כשהניסיון נכשל או שמצבו לא ידוע — "נשלח" מוצג רק כש-`state==='sent'`.
export function resendOutcome(state, sentText) {
  if (state === 'sent') return { tone: 'success', text: sentText }
  if (state === 'failed') return { tone: 'error', text: 'השליחה החוזרת נכשלה. אפשר לנסות שוב' }
  return { tone: 'error', text: 'לא ידוע אם נשלח. יש לבדוק לפני שליחה חוזרת' }
}

// מועד שמור להצגה בהיסטוריה (פוליש 14/10, פריט 3): **לעולם לא שעה שלא נשמרה.**
// ערך תאריך-בלבד (`YYYY-MM-DD`, כמו `sent_date`) ⇒ `DD/MM/YYYY`. דוח מהתהליך הקודם (`legacy`)
// שמר רק תאריך שליחה — זמני היומן שלו אינם מקור לשעה (נמדד: דוח 15 נשא 10:00:00 עגול) ⇒ תאריך
// בלבד, בשעון ישראל. אחרת ⇒ `DD/MM/YYYY HH:MM`.
export function formatStoredMoment(value, { dateOnly = false } = {}, emptyText = '—') {
  if (!value) return emptyText
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return formatDate(value, emptyText)
  const full = formatTimestampFull(value, '')
  if (!full) return emptyText
  return dateOnly ? full.slice(0, 10) : full
}

// ── היסטוריה ───────────────────────────────────────────────────────────────────

const ACCOUNTANT_DELIVERY = {
  sent: { label: 'נשלח', tone: 'ok' },
  failed: { label: 'לא נשלח', tone: 'danger' },
  unknown: { label: 'לא ידוע אם נשלח', tone: 'warn' },
  queued: { label: 'בשליחה', tone: 'muted' },
  sending: { label: 'בשליחה', tone: 'muted' },
}

export function accountantDeliveryTag(state) {
  return ACCOUNTANT_DELIVERY[state] ?? { label: 'לא ידוע אם נשלח', tone: 'warn' }
}

// השלמות מוצגות מתחת לדוח המקורי שלהן. השלמה שהמקורי שלה אינו ברשימה נשארת בשורה משלה —
// לא נעלמת.
export function groupReports(reports) {
  const list = reports ?? []
  const byOriginal = new Map()
  for (const report of list) {
    if (report.report_kind === 'supplement' && report.original_report_id != null) {
      const bucket = byOriginal.get(report.original_report_id) ?? []
      bucket.push(report)
      byOriginal.set(report.original_report_id, bucket)
    }
  }
  const regularIds = new Set(
    list.filter((r) => r.report_kind !== 'supplement').map((r) => r.report_id),
  )
  const rows = []
  for (const report of list) {
    if (report.report_kind === 'supplement' && regularIds.has(report.original_report_id)) continue
    rows.push({ report, nested: false })
    const supplements = (byOriginal.get(report.report_id) ?? []).sort(
      (a, b) => (a.supplement_seq ?? 0) - (b.supplement_seq ?? 0),
    )
    for (const supplement of supplements) rows.push({ report: supplement, nested: true })
  }
  return rows
}

// דוח בלי קובץ מקורי (תוספת הסגן W4) — מציעים שחזור מסומן.
// צורת השרת (בדיקת התאמה 14/10, ממצא 8): ב-`payroll_report_detail` אין `artifact_available`
// על הדוח — הקובץ נקבע לפי `artifact`: הפניה חסרה או בלי מפתח ⇒ אין קובץ מקורי.
export function needsReconstruction(artifact) {
  return Boolean(artifact?.reference_missing) || !artifact?.key
}

// ── שלב הבקשה והצעד הבא (כותרת העמוד) ─────────────────────────────────────────
// ארבעת השלבים של מדריך ה-UX: טיוטה · ממתין לתגובות · מוכן להפקה · הופק. השלבים "נגזרים"
// מהשרת ואינם נשמרים (חוזה §1 מיגרציה 7) — כאן רק קוראים אותם.
export function processStage({ preview, review }) {
  if (review === undefined && !preview) return null
  const info = review?.review
  if (info?.status === 'issued') {
    return { label: 'הופק', next: 'הדוח הופק. אפשר לצפות בו ובקובץ בהיסטוריה' }
  }
  if (!info) {
    if (preview && preview.month_state !== 'ended') {
      return {
        label: 'טיוטה',
        next: `${monthNotEndedMessage(preview.period)}. בינתיים אפשר לבדוק את הטיוטה ולהוריד אותה`,
      }
    }
    if (preview && (preview.lines ?? []).length === 0) {
      return { label: 'טיוטה', next: 'אין כרגע שורות לדוח בחודש הזה' }
    }
    return { label: 'טיוטה', next: 'הצעד הבא: לבדוק את הטיוטה ולשלוח סיכומים לדיילות' }
  }
  if (review.readiness?.ready) {
    return { label: 'מוכן להפקה', next: 'הצעד הבא: הפקה ושליחה לרואה החשבון' }
  }
  if (!info.distributed_at) {
    if (!info.manager_approved || !info.response_deadline) {
      return { label: 'טיוטה', next: 'הצעד הבא: לאשר את הטיוטה ולקבוע מועד אחרון לתגובה' }
    }
    return { label: 'טיוטה', next: 'הצעד הבא: לשלוח סיכומים לדיילות' }
  }
  return { label: 'ממתין לתגובות', next: 'הצעד הבא: לטפל בדיילות שדורשות טיפול' }
}
