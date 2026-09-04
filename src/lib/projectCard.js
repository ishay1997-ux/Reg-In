// הלוגיקה הטהורה של כרטיס-הפרויקט (מודול 6 · משטח 2) — כלל 14: כל משפט, מצב-לשונית
// ונוסח-באנר של הכרטיס נולד כאן עם בדיקת-יחידה לצידו; הקומפוננטות רק מרנדרות.
// המדדים עצמם (יחס-שיבוץ, יחס-לוגיסטיקה) אינם משוכפלים — staffingCell/logisticsCell
// של src/lib/projects.js הם המקור, וכאן רק שורת-המשנה הארוכה שהמוקאפ מצייר לאריחי הכרטיס.

import { eventDaysFromToday, ACTIVE_PROJECT_STATUSES, logisticsTileSub } from '@/lib/projects'

// ── תוויות סוג-הביטול (S-30) ────────────────────────────────────────────────
// שלושת הערכים המדויקים של ה-CHECK במסד (schema.sql:1146). התוויות הן כותרות שלוש
// האפשרויות בדיאלוג-הביטול המאושר (screens-approved משטח 7) — אותה מילה בשני המסכים,
// כדי שמה שנבחר בדיאלוג הוא מה שנקרא בכרטיס.
export const CANCEL_TYPE_LABELS = {
  customer: 'הלקוח ביטל',
  force_majeure: 'כוח עליון',
  other: 'אחר',
}

// ── ולידציה — זהה-בייט להודעות השרת ─────────────────────────────────────────
// 🔴 שלוש ההודעות הן העתק מילולי של הודעות ה-raise שב-update_project_details
// (↳ as-built 14/08/2026 ② בצעד 3.2 של מדריך-המיקרו): הבדיקה בצד-לקוח היא נוחות,
// והמשתמשת חייבת לראות את אותו משפט בין אם הלקוח תפס ובין אם השרת. שינוי כאן בלי
// שינוי בפונקציית-המסד = שני נוסחים לאותה שגיאה.
export const DATE_REQUIRED_MSG = 'חובה למלא תאריך אירוע.'
export const LOCATION_REQUIRED_MSG = 'חובה למלא מיקום — הוא נשלח לדיילות ומשמש לדירוג הקרבה בשיבוץ.'
export const HOURS_BOTH_OR_NEITHER_MSG = 'מלאי גם שעת התחלה וגם שעת סיום, או השאירי את שתיהן ריקות.'

// תאריך בעבר ואירוע חוצה-חצות — מודיעים, לעולם לא חוסמים (S-17, ⑯: "הזמן מודיע,
// לעולם אינו מחליט"). "האירוע חוצה חצות" מילולי מכרטיס-המסך (⑦); נוסח תאריך-העבר
// נגזר מנימוק ⑦ ("pg_cron פשוט יעביר את הפרויקט ל'ממתין לסגירה' בריצה הבאה").
export const CROSS_MIDNIGHT_NOTICE = 'האירוע חוצה חצות'
export const PAST_DATE_NOTICE =
  'התאריך שבחרת כבר עבר — הסריקה היומית תעביר את הפרויקט ל"ממתין לסגירה".'

// המרות תאריך תצוגה⇄מסד. שדה-התאריך בדיאלוג הוא טקסט DD/MM/YYYY (ה-placeholder של
// המוקאפ), וה-RPC מקבל ISO — ההמרה חיה כאן כדי שהבדיקות ינעלו אותה בלי DOM.
export function parseDmyToIso(dmy) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(dmy ?? '').trim())
  if (!match) return null
  const [, day, month, year] = match
  // תקינות לוח בסיסית דרך Date.UTC — 31/02 מתגלגל לחודש הבא ולכן נדחה בהשוואה חזרה.
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  if (
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() !== Number(month) - 1 ||
    parsed.getUTCDate() !== Number(day)
  ) {
    return null
  }
  return `${year}-${month}-${day}`
}

export function isoToDmy(iso) {
  const [year, month, day] = String(iso ?? '').split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

// ולידציית הטופס — שלושת הכללים שהשרת אוכף, באותן מילים. מחזירה מפה ריקה כשהכול תקין.
export function validateDetailsForm({ dateText, location, startTime, endTime }) {
  const errors = {}
  if (!parseDmyToIso(dateText)) errors.date = DATE_REQUIRED_MSG
  if (!String(location ?? '').trim()) errors.location = LOCATION_REQUIRED_MSG
  const hasStart = Boolean(String(startTime ?? '').trim())
  const hasEnd = Boolean(String(endTime ?? '').trim())
  if (hasStart !== hasEnd) errors.hours = HOURS_BOTH_OR_NEITHER_MSG
  return errors
}

// ── שלושת מצבי לשונית "סגירת אירוע" (A9 · §3.2) ────────────────────────────
// 🔴 השער הוא הסטטוס בלבד, לעולם לא התאריך — מכונת-הסטטוס היא הכותב היחיד (⑫/㉚),
// והגדרת-מסך שנייה ל"האירוע עבר" היא בדיוק הסחף שהיא נועדה למנוע. מה שכן משתנה לפי
// התאריך הוא *המשפט*: בין סוף-האירוע לסריקת ה-02:00 המשפט "נפתחת אחרי האירוע" הוא
// שקר על המסך ("האירוע כבר היה!"), ולכן הוא מתחלף — אבל הלשונית נשארת סגורה.
export const CLOSING_TAB_BEFORE_EVENT = '(נפתחת אחרי האירוע)'
export const CLOSING_TAB_CRON_GAP = '(נפתחת בסריקה היומית — האירוע נסגר לסגירה מחר ב-02:00)'
// פרויקט מבוטל — אין לו סגירה תפעולית לעולם (🏁6: "אין סגירה תפעולית לפרויקט מבוטל").
export const CLOSING_TAB_CANCELLED = '(אין סגירה תפעולית לפרויקט מבוטל)'

// project = שורת projects · todayIso = 'YYYY-MM-DD' מהשעון (מחושב ב-handler, לא ברינדור).
// מצבים: disabled (עם reason) · open (event_finished — הלשונית פעילה, תוכן 3.5) ·
// closed (אחרי הסגירה התפעולית — הלשונית נשארת, קריאה בלבד, עם חותמת "נסגר ב-…").
export function closingTabState(project, todayIso) {
  const status = project?.project_status
  if (status === 'cancelled') return { mode: 'disabled', reason: CLOSING_TAB_CANCELLED }
  if (ACTIVE_PROJECT_STATUSES.includes(status)) {
    const days = eventDaysFromToday(project.final_event_date, todayIso)
    // ימים שליליים = האירוע עבר והסטטוס עוד לא זז (חלון עד ריצת ה-02:00) — המשפט מתחלף.
    const reason = days != null && days < 0 ? CLOSING_TAB_CRON_GAP : CLOSING_TAB_BEFORE_EVENT
    return { mode: 'disabled', reason }
  }
  if (status === 'event_finished') return { mode: 'open' }
  // awaiting_invoice / awaiting_payment / finished — הסגירה בוצעה; הלשונית לא נעלמת:
  // היעלמותה הייתה מוחקת מהמסך את מה שדנה זה-עתה הזינה (screens-approved:1309).
  return { mode: 'closed' }
}

// ── משוב הלקוח (㉞ · S-21 · S-22) ───────────────────────────────────────────
// תא אחד, קריאה בלבד. ארבעת ניסוחי feedback_status הם המלצת ⑧⑫ שאושרה עם הכרטיס,
// והתיקון של S-22: completed עם ציון NULL הוא שורה חוקית בסכמה (העמודות בלתי-תלויות)
// ולכן מקבל נוסח משלו במקום להציג ציון שאינו קיים.
const FEEDBACK_EMPTY_VALUE = 'טרם התקבל משוב'
// "נשלח" ולא "יוצא" — תיקון-הנוסח של צעד 3.5 (מדריך-המיקרו :961): הסקר נשלח מהלקוח-בדפדפן
// אחרי ה-commit (AR-5), לא "יוצא" מעצמו מתוך הסגירה, והנוסח הישן סתר את מסלול-הכשל.
const FEEDBACK_EMPTY_SUB = 'הסקר נשלח בסגירת האירוע · הציון והסיבה מוזנים במסך הכספים'
// not_sent אחרי שחותמת-הסגירה קיימת = השליחה לא הצליחה — והכרטיס חייב לומר זאת במקום
// לרמוז שהסקר בדרך (אותה שורה במדריך: "must say the send did not succeed"). ההמשך —
// בקרת "שליחה חוזרת" שבלשונית הסגירה.
const FEEDBACK_NOT_SENT_AFTER_CLOSE_SUB =
  'מייל הסקר לא יצא בסגירה — שליחה חוזרת מלשונית סגירת האירוע'

export function feedbackCell(project) {
  const status = project?.feedback_status ?? 'not_sent'
  if (status === 'sent') return { kind: 'plain', value: 'הסקר נשלח — טרם התקבלה תשובה' }
  if (status === 'no_response') return { kind: 'plain', value: 'הלקוח לא השיב' }
  if (status === 'completed') {
    if (project?.feedback_score == null) return { kind: 'plain', value: 'הסקר מולא' }
    const negativeReasons =
      Array.isArray(project.negative_feedback_reasons) &&
      project.negative_feedback_reasons.length > 0
        ? project.negative_feedback_reasons
        : project.negative_feedback_reason
          ? [project.negative_feedback_reason]
          : []
    const positiveReasons =
      Array.isArray(project.positive_feedback_reasons) &&
      project.positive_feedback_reasons.length > 0
        ? project.positive_feedback_reasons
        : project.positive_feedback_reason
          ? [project.positive_feedback_reason]
          : []
    return {
      kind: 'score',
      score: project.feedback_score,
      // הסיבה מוצגת רק כשהיא קיימת (C5 §5.6.14 מחייב אותה בציון < 3) — תא קבוע-וריק הוא רעש.
      reason: project.negative_feedback_reason ?? null,
      positiveReason: project.positive_feedback_reason ?? null,
      negativeReasons,
      positiveReasons,
      notes: project.feedback_notes ?? null,
    }
  }
  // not_sent — המצב המצויר: אפור, במילים, לעולם לא 0 ולא 0★ (אין ציון-רפאים).
  // אחרי חותמת-הסגירה not_sent הוא עדות לכשל-שליחה, ושורת-המשנה אומרת זאת ביושר.
  if (project?.operationally_closed_at) {
    return { kind: 'empty', value: FEEDBACK_EMPTY_VALUE, sub: FEEDBACK_NOT_SENT_AFTER_CLOSE_SUB }
  }
  return { kind: 'empty', value: FEEDBACK_EMPTY_VALUE, sub: FEEDBACK_EMPTY_SUB }
}

// ── פירסור טווח-שעות ("HH:MM") ───────────────────────────────────────────────
// משותפת ל-`eventDurationText` כאן ול-`plannedEventHours` (`src/lib/projectClosing.js`,
// אוחד 19/08/2026 — jscpd תפס את בלוק ה-parsing כפול). מחזירה דקות בין הקצוות, כולל
// חציית-חצות (מודולו יממה) — `null` **רק** כשקצה חסר/שגוי; זמנים זהים-בדיוק מחזירים `0`
// (לא `null`), כי "בלי קלט" ו"טווח באורך אפס" הם שני מצבים שונים שכל קורא מפרש בעצמו.
export function minutesBetweenTimes(startTime, endTime) {
  const toMinutes = (value) => {
    const match = /^(\d{2}):(\d{2})/.exec(String(value ?? ''))
    if (!match) return null
    return Number(match[1]) * 60 + Number(match[2])
  }
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  if (start == null || end == null) return null
  return (end - start + 1440) % 1440
}

// ── משך האירוע ("4 שעות") ───────────────────────────────────────────────────
// נגזר מהפרש השעות; חציית-חצות (22:00–02:00) חוקית ומחושבת מודולו יממה (S-17).
export function eventDurationText(startTime, endTime) {
  const minutes = minutesBetweenTimes(startTime, endTime)
  if (minutes === null || minutes === 0) return null
  const hours = minutes / 60
  if (hours === 1) return 'שעה אחת'
  if (hours === 2) return 'שעתיים'
  // חצאי-שעה מוצגים כמספר עשרוני (3.5 שעות) — עדיף על עיגול שמשקר ברבע שעה.
  const text = Number.isInteger(hours) ? String(hours) : String(Math.round(hours * 10) / 10)
  return `${text} שעות`
}

// ── הנחת ההצעה ("אחרי הנחה של 15%") ────────────────────────────────────────
// חיבור ולא שרשור (§7.26/F7): ‏5%+10% הם 15%. שני האחוזים גרים על quotes, שקריאתה
// מגודרת על 'הצעות מחיר' — אותו שער בדיוק כמו planned_revenue, ולכן אין מצב שבו
// הסכום קריא וההנחה לא (as-built 3.3④: "the two travel together").
export function combinedDiscountPercent(quoteMeta) {
  if (!quoteMeta) return null
  const applied = Number(quoteMeta.applied_customer_discount)
  const manual = Number(quoteMeta.manual_discount)
  if (!Number.isFinite(applied) || !Number.isFinite(manual)) return null
  return Math.round((applied + manual) * 100) / 100
}

// ── שורות-המשנה של שני אריחי-המוכנות בכרטיס ────────────────────────────────
// היחס עצמו מגיע מ-staffingCell/logisticsCell (src/lib/projects.js — לא משוכפל); כאן רק
// המשפט הארוך שהמוקאפ מצייר מתחת לאריח: "חסרות 5 דיילות שאושרו סופית" — ניסוח מדויק
// בכוונה (כרטיס-המסך ③): מה שחסר הוא אישור סופי, לא פנייה. לשון-יחיד לחוסר בודד —
// אותה תבנית שאושרה פעמיים (gapWord · הזימון הבודד).
export function cardStaffingTileSub(row) {
  const required = Number(row?.required_hostess_count) || 0
  const confirmed = Number(row?.hostesses_confirmed) || 0
  if (required > 0 && confirmed >= required) return '✓ מאויש'
  const gap = Math.max(required - confirmed, 0)
  if (gap === 0) return null
  return gap === 1 ? 'חסרה דיילת אחת שאושרה סופית' : `חסרות ${gap} דיילות שאושרו סופית`
}

// שורת-המשנה של אריח-הלוגיסטיקה — "טרם מוכנים" ולא "טרם הוזמנו" שבמוקאפ: הסטייה המודעת
// שאושרה במשטח 1 (ה-RPC אינו מחזיר מונה ordered, ו"לא הוזמן" אינו ניתן לאימות). המשפט
// הממוספר מגיע מ-logisticsTileSub של מבט-העל — אותו נוסח בשני המסכים, לא עותק.
export function cardLogisticsTileSub(row) {
  const total = Number(row?.logistics_total) || 0
  const ready = Number(row?.logistics_ready) || 0
  if (total === 0) return '✓ אין פריטים'
  if (ready >= total) return '✓ מוכן'
  return logisticsTileSub({ count: 1, itemsNotReady: total - ready })
}

// ── באנר-ההשלכה של שינוי-תאריך (㉑) ─────────────────────────────────────────
// מוצג לפני האישור. המונה מגיע מ-hostesses_confirmed של שורת מבט-העל (RPC מוגדר —
// קריא לכל תפקיד), והשמות משורות-השיבוץ — שקריאתן מגודרת על 'דיילות'. למנהלת
// הלוגיסטיקה (edit על 'פרויקטים', ➖ על 'דיילות') יש לכן מונה בלי שמות — נוסח-המונה
// בלבד (as-built ⑤), לעולם לא undefined ליד פסיק.
export function dateChangeBanner({ confirmedCount, names, requiredCount }) {
  const count = Number(confirmedCount) || 0
  if (count <= 0) return null
  const named = Array.isArray(names) && names.length > 0 ? ` — ${names.join(' · ')}` : ''
  const body =
    count === 1
      ? `דיילת אחת כבר אושרה סופית לתאריך הקודם${named}. השמירה תבטל את האישור שלה ותשלח לה זימון מחדש לתאריך החדש.`
      : `${count} דיילות כבר אושרו סופית לתאריך הקודם${named}. השמירה תבטל את האישור שלהן ותשלח להן זימון מחדש לתאריך החדש.`
  return {
    opening: 'שינית את תאריך האירוע.',
    body,
    // היחסים מרונדרים עם בידוד-כיווניות בקומפוננטה (Ltr) — כאן רק הטקסט.
    metricFrom: `${count}/${Number(requiredCount) || 0}`,
    metricTo: `0/${Number(requiredCount) || 0}`,
  }
}

// הפשרה מ"ממתין לסגירה" (as-built ③): תאריך עתידי מ-event_finished מחזיר את הפרויקט
// לציר הפעיל. ההשלכה מוצגת לפני האישור, כפי ש-㉑ כבר דורש לתאריך.
export const REACTIVATION_NOTICE =
  'הפרויקט יחזור לציר הפעיל — תג-הסטטוס ישתנה, ולשונית סגירת האירוע תינעל עד אחרי התאריך החדש.'

// ── דיווח תוצאות-מייל (שלוש תוצאות, לא שתיים) ──────────────────────────────
// אותה הבחנה כמו reportMail של SmartMatchPage (שאינו מיוצא — הדפוס שוחזר כאן כפונקציה
// טהורה): פסק-זמן הוא "לא ידוע" ולא "נכשל" — המייל אולי יצא, ודיווח "נכשל" גורר
// שליחה חוזרת והצפת הדיילת.
export function mailOutcomeMessage({ sent = 0, unknown = 0, failed = 0 } = {}, sentVerb) {
  const parts = []
  if (sent > 0) parts.push(`${sent} ${sentVerb}`)
  if (unknown > 0) parts.push(`${unknown} — לא ידוע אם יצאו (ייתכן שכן; לא לשלוח שוב מיד)`)
  if (failed > 0) parts.push(`${failed} נכשלו`)
  if (parts.length === 0) return null
  return { message: parts.join(' · '), isError: unknown > 0 || failed > 0 }
}

// משפט-ההצלחה של השמירה — "התאריך עודכן. נשלח זימון מחדש לדיילת אחת." (מצב-ההצלחה
// של כרטיס-המסך, ④) — נבנה מדגלי-התשובה של ה-RPC, במספרים חיים.
export function saveSuccessMessage(result, reinvitedCount = 0) {
  const parts = []
  if (result?.date_changed) parts.push('התאריך עודכן')
  if (result?.location_changed) parts.push('המיקום עודכן')
  if (result?.hours_changed) parts.push('השעות עודכנו')
  if (parts.length === 0) return 'לא בוצע שינוי.'
  let sentence = `${parts.join(' · ')}.`
  if (result?.date_changed && reinvitedCount > 0) {
    sentence +=
      reinvitedCount === 1
        ? ' נשלח זימון מחדש לדיילת אחת.'
        : ` נשלחו זימונים מחדש ל-${reinvitedCount} דיילות.`
  }
  return sentence
}
