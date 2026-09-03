// הלוגיקה הטהורה של דיאלוג ביטול-הפרויקט (משטח 7, מודול 6) — **טהור**: בלי Supabase,
// בלי DOM, בלי שעון (השעות נכנסות כפרמטר, כמו בכל `src/lib/`). הדיאלוג רק מייבא
// (כלל ברזל 14): המדרג, המונים ומשפטי-הבאנר מחושבים כאן ונבדקים כאן.
//
// 🔴 **המדרג נקרא מ-`params`, לעולם לא מקודד-קשיח במשפט** (as-built ⑤ של צעד 3.7):
// שלוש השורות נזרעו בצעד 1.7 — `שעות_פיצוי_ביטול_מלא=24` · `שעות_פיצוי_ביטול_חלקי=72` ·
// `אחוז_פיצוי_ביטול_חלקי=50`. הפונקציות כאן מקבלות את הערכים כפרמטרים; מי שקורא בלי
// ערכים מ-`params` לא מקבל ברירת-מחדל שקטה אלא `null` — המסך חוסם, לא ממציא מספר.
import { finalAssignmentRows } from '@/lib/hostesses'

// שמות שורות-ה-params — זהים-בייט לזרע של module6 (צעד 1.7). שם שגוי בתו אחד מחזיר
// רשימה ריקה בלי שגיאה — הכשל השקט הקלאסי של params.
export const CANCELLATION_PARAM_NAMES = {
  fullHours: 'שעות_פיצוי_ביטול_מלא',
  partialHours: 'שעות_פיצוי_ביטול_חלקי',
  partialPercent: 'אחוז_פיצוי_ביטול_חלקי',
}

// שלושת הסטטוסים החיים — זהים לרשימה שבגוף `cancel_project` במסד (מיגרציה
// 20260814142440: "השלושה האחרים כבר אינם זימון חי"). ⇒ הבאנר שלפני-האישור סופר
// בדיוק את מי שה-RPC ישחרר, לא קבוצה אחרת.
export const LIVE_ASSIGNMENT_STATUSES = ['finally_approved', 'pending', 'confirmed_available']

// ערכי params נשמרים כטקסט (`param_value text`) — פענוח מפורש, בלי Number() ישיר
// (המוקש של `Number(null) === 0`, ר' מודול 4).
function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// אחוז-הפיצוי לפי §7.16ב, על **שעות** עד האירוע (מול השעה, לא מול חצות — אותו עוגן
// כמו `hoursUntilEvent` ב-projectChanges.js): יותר מ-partial ⇒ 0% · בין full ל-partial
// ⇒ partialPercent · פחות מ-full ⇒ 100% · כוח עליון ⇒ 0% תמיד, בכל מרחק-זמן.
// קלט חסר (params לא נטענו) ⇒ null — המסך מציג מצב-שגיאה, לא מספר מומצא.
export function compensationPercent({
  hoursUntilEvent,
  cancelType,
  fullHours,
  partialHours,
  partialPercent,
}) {
  if (cancelType === 'force_majeure') return 0

  const hours = toFiniteNumber(hoursUntilEvent)
  const full = toFiniteNumber(fullHours)
  const partial = toFiniteNumber(partialHours)
  const partialPct = toFiniteNumber(partialPercent)
  if (hours === null || full === null || partial === null || partialPct === null) return null

  // 🔴 **מדרגות הפוכות ⇒ "לא יודע", לעולם לא אחוז מומצא** (אודיט-סגירת מ9, 03/09/2026).
  // המדרג בנוי על ההנחה `full < partial` — ככל שקרוב יותר לאירוע, הפיצוי גדול יותר. אם
  // הסדר מתהפך, השורה הבאה (`hours > partial ⇒ 0`) בולעת כל ערך שהיה מגיע למדרגה האמצעית,
  // ‏`partialPct` הופך **קוד-מת**, וביטול 50 שעות לפני אירוע מחויב ב-100% במקום 50% —
  // **בלי שגיאה ובלי סימן.** ⚠️ עד מודול 9 שתי השורות היו ניתנות לעריכה רק ב-Table Editor;
  // מסך-הפרמטרים שם אותן זו לצד זו באותה קבוצה ובאותה שמירה, ולכן הפכו נגישות בפועל.
  // 🛡️ **שכבה שנייה במכוון:** מסך-ההגדרות כבר חוסם את השמירה (`cancellationOrderOk`), אבל
  // הכלל הזה חוסם את **הפירוש** של מצב הפוך מכל מקור — Table Editor, PATCH ישיר, מיגרציה
  // עתידית — בדיוק כמו הצמד `max` במרשם + תקרה בתוך ה-RPC של שכר-המינימום. `null` כאן הוא
  // אותו חוזה בדיוק שכבר חל על פרמטר חסר בשורה שמעל: המסך מציג מצב-שגיאה, לא מספר.
  if (full >= partial) return null

  if (hours > partial) return 0
  if (hours >= full) return partialPct
  return 100
}

// משפט-המדרג — הנוסח המאושר מהמוקאפ (07_dialog_cancel_approved.html), עם שלושת
// המספרים מוזרקים מ-`params` ולא כתובים במשפט. 🚫 24/72/50 קשיחים כאן = הפרת as-built ⑤.
export function ladderSentence({ fullHours, partialHours, partialPercent }) {
  const full = toFiniteNumber(fullHours)
  const partial = toFiniteNumber(partialHours)
  const partialPct = toFiniteNumber(partialPercent)
  if (full === null || partial === null || partialPct === null) return null
  return (
    `המדרג: יותר מ-${partial} שעות מזכה ב-0% · ` +
    `${full}–${partial} שעות מזכות ב-${partialPct}% · ` +
    `פחות מ-${full} שעות מזכות ב-100% · ` +
    `כוח עליון מזכה ב-0% תמיד.`
  )
}

// שורת-הפיצוי (₪) של הבאנר — הטקסט שמסביר את האחוז. הנימוק משתנה עם הבחירה:
// "כוח עליון" מציג את נימוק-האיפוס הקבוע; השאר מציגים את מרחק-הזמן שקבע.
export function compensationReason({ cancelType, percent, fullHours, partialHours }) {
  if (cancelType === 'force_majeure') {
    return 'כוח עליון מאפס פיצוי תמיד, ללא תלות במרחק-הזמן.'
  }
  const full = toFiniteNumber(fullHours)
  const partial = toFiniteNumber(partialHours)
  if (percent === null || full === null || partial === null) return null
  if (percent === 0) return `הביטול הוא יותר מ-${partial} שעות לפני האירוע.`
  if (percent === 100) return `הביטול הוא פחות מ-${full} שעות לפני האירוע.`
  return `הביטול הוא ${full}–${partial} שעות לפני האירוע.`
}

// שורת-המשנה של שורת-ה-₪ בבאנר: בכוח-עליון — משפט-ההשוואה למה ש"הלקוח ביטל" היה נותן
// (ההשוואה שהמוקאפ מצייר במצב ב); בכל סוג אחר — משפט-המדרג עצמו. הענף חי כאן ולא ב-JSX
// (כלל 14): הנוסח נגזר מ-standardPercent, וסטייה בו היא סטיית-מוצר, לא סטיית-רינדור.
export function compensationSubLine({ cancelType, standardPercent, ladder }) {
  if (cancelType !== 'force_majeure') return ladder
  return standardPercent === 0
    ? 'בסוג "הלקוח ביטל" אותו ביטול היה נותן גם הוא 0% — כאן, לעומת זאת, גם ביטול של יום לפני היה מאפס.'
    : `בסוג "הלקוח ביטל" אותו ביטול היה נותן ${standardPercent}% — כאן הפיצוי מתאפס תמיד.`
}

// משפט-ההצלחה של הביטול — טוסט אחרי שהדיאלוג נסגר (שורת "הצלחה" בכרטיס המאושר:
// "הדיאלוג נסגר · הכרטיס נטען מחדש עם תג 'בוטל'" — הדיווח עובר לטוסט, לא לפאנל בדיאלוג).
// לשון-יחיד לשיבוץ בודד — אותה תבנית כמו releasedSentence.
export function cancelSuccessMessage(releasedRows) {
  const released = toFiniteNumber(releasedRows) ?? 0
  if (released === 0) {
    return 'הפרויקט בוטל. לא היו דיילות משובצות — לא שוחרר אף שיבוץ ולא נשלח אף מייל.'
  }
  if (released === 1) return 'הפרויקט בוטל. שיבוץ אחד שוחרר, ופריטי הלוגיסטיקה לא השתנו.'
  return `הפרויקט בוטל. ${released} שיבוצים שוחררו, ופריטי הלוגיסטיקה לא השתנו.`
}

// מודל שורת-✉ של הבאנר, מתוך שורות-השיבוץ שנטענו לפני האישור.
// 🔴 הקיפול הוא `MAX(assignment_number)` פר-דיילת (finalAssignmentRows) — אותו קיפול
// שה-RPC עצמו מריץ (`distinct on ... order by assignment_number desc`), כדי שהמספר
// שהבאנר מציג יהיה המספר שבאמת ישוחרר.
// `names` — רק כשלכל השורות החיות יש שם (הצטרפות hostesses מותנית בהרשאת 'דיילות');
// שם חסר ולו אחד ⇒ null ⇒ הווריאנט חסר-השמות (as-built ③ — ספירה בלי שמות, לא שם ריק).
export function cancellationBannerModel(assignmentRows) {
  const live = finalAssignmentRows(assignmentRows).filter((row) =>
    LIVE_ASSIGNMENT_STATUSES.includes(row?.assignment_status),
  )
  const finallyApproved = live.filter((row) => row.assignment_status === 'finally_approved')
  const otherLive = live.filter((row) => row.assignment_status !== 'finally_approved')

  const namesOf = (rows) => {
    const names = rows.map((row) => row?.hostesses?.full_name ?? null)
    return names.every((name) => name) ? names : null
  }

  return {
    liveCount: live.length,
    finallyApprovedCount: finallyApproved.length,
    otherLiveCount: otherLive.length,
    approvedNames: namesOf(finallyApproved),
    otherNames: namesOf(otherLive),
  }
}

// משפט-השחרור של שורת-✉ — **שני המונים תמיד** (as-built ② של צעד 3.7: המשפט המאושר
// "3 דיילות שאושרו סופית" לבדו מסתיר מי ש-pending/confirmed_available, והיא כן
// משוחררת ומקבלת מייל). לשון-יחיד לפי תקדים proximitySentence (עברית שבורה על מסך
// היא ממצא). משפט אין-הבחירה — מילולית מהמוקאפ, כדי שהרשימה לא תיקרא כרשימת-בחירה (⑤).
export function releasedSentence({
  finallyApprovedCount,
  otherLiveCount,
  approvedNames,
  otherNames,
}) {
  const parts = []

  if (finallyApprovedCount === 1) {
    parts.push('דיילת אחת שאושרה סופית תשוחרר ותקבל מייל "האירוע בוטל"')
  } else if (finallyApprovedCount > 1) {
    parts.push(`${finallyApprovedCount} דיילות שאושרו סופית ישוחררו ויקבלו מייל "האירוע בוטל"`)
  }
  if (finallyApprovedCount > 0 && approvedNames?.length) {
    parts[parts.length - 1] += `: ${approvedNames.join(' · ')}`
  }

  if (otherLiveCount === 1) {
    parts.push('דיילת נוספת אחת שטרם השיבה תשוחרר ותקבל את אותו מייל')
  } else if (otherLiveCount > 1) {
    parts.push(`${otherLiveCount} דיילות נוספות שטרם השיבו ישוחררו ויקבלו את אותו מייל`)
  }
  if (otherLiveCount > 0 && otherNames?.length) {
    parts[parts.length - 1] += ` (${otherNames.join(' · ')})`
  }

  if (parts.length === 0) return 'אין דיילות משובצות — אין מה לשחרר ואין פיצוי.'

  return `${parts.join(' · ')}. אין בחירה מי — כולן משוחררות יחד.`
}
