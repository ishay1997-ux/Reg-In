// מחזור-חיי-השיבוץ — **הכללים הטהורים בלבד.** מי רשאית לעשות מה על שורה נתונה, איזה
// מספר-שורה מקבל זימון חדש, את מי משחררים כשהמכסה נסגרת, ומתי מזהירים על עודף.
//
// 🚫 **אין כאן Supabase ואין שעון-מערכת** — `nowIso` מגיע תמיד מהקורא, כמו בכל `src/lib/`.
// הכתיבות עצמן חיות ב-`04_hostesses/api.js`; כאן רק ההחלטה מה מותר ומה כתוב על הכפתור.
//
// 🔴 **ולמה זה קובץ נפרד ולא עוד 200 שורות ב-`hostesses.js`:** התפריט הזה הוא **המשטח
// היחיד במודול שתוכנו נגזר מסטטוס** (`screens-approved` מסך 4), והוא נצרך משני מסכים —
// מסך 2 (Smart Match) ומסך 1 דרך פעולת "שלח שוב". שני עותקים של המפה הזאת היו מתפצלים
// בשקט, וההבדל היה מתגלה רק כשמנהלת לוחצת על פריט שלא היה אמור להיות שם.

import { finalAssignmentRows, isInviteExpired, optionalNumber } from '@/lib/hostesses'

export const ASSIGNMENT_ACTION = {
  RESEND: 'resend',
  NEW_INVITE: 'new_invite',
  MARK_AVAILABLE: 'mark_available',
  MARK_DECLINED: 'mark_declined',
  APPROVE_FINAL: 'approve_final',
  APPROVE_BY_PHONE: 'approve_by_phone',
  RELEASE: 'release',
  MARK_WITHDRAWN: 'mark_withdrawn',
  SET_SHIFT_LEAD: 'set_shift_lead',
  CLEAR_SHIFT_LEAD: 'clear_shift_lead',
}

// ── מספר השורה הבאה ──────────────────────────────────────────────────────────

// 🔴 **`max+1` ולא `count+1`.** המפתח הראשי הוא `(project_id, hostess_id, assignment_number)`
// ⇒ מספר שכבר היה בשימוש יתנגש ויכשל. **וזה בדיוק מה שאנחנו רוצים** (§7.41↳): שני כותבים
// במקביל שחישבו את אותו מספר — השני מקבל `unique_violation` **בקול**, ולא דורס בשקט.
// הקורא (`api.js`) עושה ניסיון-חוזר אחד עם מספר מרוענן.
export function nextAssignmentNumber(rows, projectId, hostessId) {
  let max = 0
  for (const row of rows ?? []) {
    if (row?.project_id !== projectId || row?.hostess_id !== hostessId) continue
    max = Math.max(max, Number(row.assignment_number) || 0)
  }
  return max + 1
}

// ── השחרור האוטומטי ──────────────────────────────────────────────────────────

// מי משוחררת ברגע שהמכסה נסגרה: **מי שאישרה זמינות ולא נכנסה** (`§ב6`).
//
// 🔴 **מותנה במכסה מלאה, ולא רץ על כל אישור.** כל עוד יש חור, דיילת שאישרה זמינות היא
// המשאב היחיד שיש למנהלת — שחרורה היה סוגר את הדלת על האירוע שעוד חסר.
// 🔴 **ועל השורה הקובעת בלבד:** דיילת שאישרה זמינות ואז נפתח לה זימון חדש שממתין למענה
// אינה "אישרה זמינות" יותר — הסטטוס הקובע הוא של `MAX(assignment_number)`.
// 🔑 **ולמה זה בקוד ולא בטריגר** (`local-13`): לשחרור נלווה **מייל משלה** ("תודה שהתפנית"),
// וטריגר במסד אינו יכול לשלוח מייל — הוא היה מפריד את השחרור מההודעה עליו.
export function autoReleaseTargets(rows, requiredCount) {
  const required = Number(requiredCount)
  if (!Number.isFinite(required) || required <= 0) return []

  const deciding = finalAssignmentRows(rows)
  const approved = deciding.filter((row) => row.assignment_status === 'finally_approved').length
  if (approved < required) return []

  return deciding.filter((row) => row.assignment_status === 'confirmed_available')
}

// ── עודף אישורים — אזהרה, לעולם לא חסימה ─────────────────────────────────────

// 🔑 **הכלל של `§ב5`: חוסמים את מה שאסור שיקרה (שיבוץ כפול באותו יום = תשלום כפול, ואת
// זה אוכף המסד), ומזהירים על מה שעולה כסף.** שביעית היא לפעמים ביטוח לגיטימי, וחסימה
// ממילא תיעקף בשלוש לחיצות.
export function quotaNotice({ approvedCount, requiredCount, adding = 1, subjectLabel } = {}) {
  const required = Number(requiredCount)
  const approved = Number(approvedCount)
  if (!Number.isFinite(required) || required <= 0) return null
  if (!Number.isFinite(approved)) return null
  if (approved + Number(adding || 0) <= required) return null

  const subject = subjectLabel ? `לאשר את ${subjectLabel} בכל זאת?` : 'לאשר בכל זאת?'
  return {
    title: `המכסה מלאה — ${approved} מתוך ${required}. ${subject}`,
    note: `ההצעה תומחרה ל-${required} דיילות. דיילת נוספת היא עלות שהלקוח לא משלם עליה.`,
  }
}

// התוספת שנצבעת על המונה כשכבר עברו את הנדרש (`§ב5`: *"אושרו סופית 7 · נדרשות 6 —
// אחת מעבר לנדרש"*). ⚠️ "אחת" ולא "1": זו עברית על מסך, לא ערך מספרי.
export function overQuotaLabel(approvedCount, requiredCount) {
  const diff = Number(approvedCount) - Number(requiredCount)
  if (!Number.isFinite(diff) || diff <= 0) return null
  return diff === 1 ? 'אחת מעבר לנדרש' : `${diff} מעבר לנדרש`
}

// ── "שלח את הקישור שוב" — שלושה מצבי-כיבוי ───────────────────────────────────

// 🔴 **הקישור מת במוקדם מבין שלושה** (`§ב3` · `§7.45`), ולכן שלוש סיבות ולא אחת.
// ⚠️ **וכל אחת מהן מכבה-ומנמקת ולא מעלימה** (`§11.4`): פריט שנעלם מלמד את המנהלת שהמערכת
// לא-עקבית; פריט מכובה עם סיבה מלמד אותה **למה**, והיא עוברת לטלפון.
// 🚫 הסיבה השלישית אינה מיותרת רק מפני שהפריט מוצג היום על שורות `pending` בלבד: אותה
// פונקציה משרתת את כפתור-הצובר של מסך 1, שם השורות מגיעות בכל הסטטוסים.
export function resendDisabledReason(
  row,
  { isEventStaffed, isWithinFinalDay, nowIso, inviteValidityHours, inviteCutoffHours } = {},
) {
  // 🔄 המספר במשפט ירד ל-`params` (`שעות_סף_זימון_לפני_אירוע`, מודול 9 · צעד 2.3): הודעה
  // שאומרת "24" בעוד הסף החי הוא אחר מלמדת את המנהלת כלל שגוי, בלי שאף בדיקה תיפול.
  // ⚠️ **וכשהסף חסר — הפסוקית פשוט יורדת, ואין נוסח-חלופה חדש.** המסלול הזה אינו נגיש
  // ממסך אמיתי (‏`isWithinFinalDay` עצמה מחזירה `false` בלי סף, והמסך נופל קודם לכן על
  // `getParamValues` שזורקת) ⇒ ניסוח חדש כאן היה מחרוזת שאיש לא יראה ואיש לא אישר.
  if (isWithinFinalDay) {
    const hours = optionalNumber(inviteCutoffHours)
    return hours === null
      ? 'קישור חדש כבר לא ייפתח'
      : `האירוע בתוך ${hours} שעות — קישור חדש כבר לא ייפתח`
  }
  if (isEventStaffed) return 'האירוע כבר אויש במלואו'
  if (row?.assignment_status !== 'pending') return 'הדיילת כבר ענתה — רענון קישור לא רלוונטי'
  // ⚠️ פקיעת התוקף **אינה** סיבת-כיבוי — היא בדיוק המצב שבו הכפתור נחוץ.
  // 🔄 הסף עצמו ירד ל-`params` (`שעות_תוקף_זימון`, מודול 9 · צעד 2.3) ומגיע בהקשר, לצד "עכשיו".
  void isInviteExpired(row, nowIso, inviteValidityHours)
  return null
}

// ── תפריט-השורה ──────────────────────────────────────────────────────────────

const item = (action, label, patch = {}) => ({
  action,
  label,
  sendsEmail: false,
  isPrimary: false,
  tone: 'default',
  disabledReason: null,
  ...patch,
})

// 🔴 **התוכן נגזר מהסטטוס, לעולם לא רשימה שטוחה עם פריטים מכובים.** זו ההחלטה שהמשטח
// הזה קיים בשבילה (`screens-approved` מסך 4 §③).
//
// 🔴 **ושתי מלכודות-השם שמוצפנות כאן, כי הן נראות זהות ואינן:**
// ‏① `שלח את הקישור שוב` מרענן את **אותה שורה**; `פתח זימון חדש` יוצר **שורה שנייה**.
//    לכן הן לעולם אינן מופיעות באותו סטטוס — איחודן היה מוחק סירוב שקדם, וההיענות היא
//    **40% מהציון**. ⇒ דיילת שסירבה ושוכנעה בטלפון מקבלת שורה חדשה; הסירוב נשאר היסטוריה.
// ‏② `שחרר` הוא ויתור **שלנו** (מחוץ לציון) מול `ביטלה אחרי אישור` שהוא חזרה **שלה**
//    (‏`0.5` באמינות). פריט אחד לשתיהן היה מזייף את הדירוג של דיילת חפה-מפשע.
export function rowMenuItems(row, context = {}) {
  const status = row?.assignment_status
  const { isWithinFinalDay, hasShiftLead } = context

  if (status === 'pending') {
    const resend = item(ASSIGNMENT_ACTION.RESEND, 'שלח את הקישור שוב', {
      sendsEmail: true,
      disabledReason: resendDisabledReason(row, context),
    })
    const available = item(ASSIGNMENT_ACTION.MARK_AVAILABLE, 'סמן: אישרה זמינות', { tone: 'good' })
    const declined = item(ASSIGNMENT_ACTION.MARK_DECLINED, 'סמן: סירבה', { tone: 'bad' })
    // ⚠️ **אינה "סמן:" ואינה סימון** — היא מוציאה לדיילת את פרטי האירוע. הפריט היחיד
    // משלושת פריטי-הטלפון ששולח מייל, ולכן הוא נקרא בשמו המלא (§⑧①).
    const byPhone = item(ASSIGNMENT_ACTION.APPROVE_BY_PHONE, 'אושרה סופית — סוכם בטלפון', {
      sendsEmail: true,
      tone: 'good',
    })

    // 🔴 **בתוך 24 השעות: אותם פריטים, סדר הפוך** — הטלפון הופך לכלי הראשי כי הקישור
    // כבר לא ייפתח. **לא תפריט אחר** — זה היה יוצר סטטוס שביעי בדלת האחורית.
    return isWithinFinalDay
      ? [{ ...byPhone, isPrimary: true }, available, declined, resend]
      : [{ ...resend, isPrimary: true }, available, declined, byPhone]
  }

  if (status === 'confirmed_available') {
    return [
      item(ASSIGNMENT_ACTION.APPROVE_FINAL, 'אשר סופית ושלח פרטים', {
        sendsEmail: true,
        isPrimary: true,
        tone: 'good',
      }),
      // "חזרה בה" — המסלול של דיילת שהתקשרה לפני האישור הסופי (`§ב8`). אין מסלול-קישור.
      item(ASSIGNMENT_ACTION.MARK_DECLINED, 'סמן: סירבה (חזרה בה)', { tone: 'bad' }),
      item(ASSIGNMENT_ACTION.RELEASE, 'שחרר — המשרה אוישה', { sendsEmail: true, tone: 'muted' }),
    ]
  }

  if (status === 'finally_approved') {
    const isLead = Boolean(row?.is_shift_lead)
    return [
      item(
        isLead ? ASSIGNMENT_ACTION.CLEAR_SHIFT_LEAD : ASSIGNMENT_ACTION.SET_SHIFT_LEAD,
        isLead ? 'בטל סימון אחראית משמרת' : 'סמן כאחראית משמרת',
        {
          // 📌 `הנחתי` (נרשם ב-§10): האפיון אומר *"ביטלה ⇒ הסימון משתחרר, המנהלת מסמנת
          // אחרת"* ואינו אומר מה קורה בלחיצה כשכבר יש אחראית. במסד יש אינדקס-ייחוד חלקי
          // ⇒ הלחיצה **הייתה נכשלת**. כיבוי-ומנמק הוא הדפוס שכבר נקבע כאן ל"שלח שוב".
          disabledReason:
            !isLead && hasShiftLead ? 'כבר מסומנת אחראית משמרת אחרת לאירוע הזה' : null,
        },
      ),
      item(ASSIGNMENT_ACTION.RELEASE, 'שחרר מהאירוע (צמצום תקנים)', {
        sendsEmail: true,
        tone: 'muted',
      }),
      // 🔴 **רושם בלבד — אינו שולח מייל.** מפת-הלחיצות (§①) מסמנת 🚫, ומקרא-המוקאפ מונה
      // אותה תחת "רק רושמות"; ההערה שמתחת לתפריט במוקאפ אומרת ההפך **והיא הטעות**.
      item(ASSIGNMENT_ACTION.MARK_WITHDRAWN, 'סמן: ביטלה אחרי אישור', { tone: 'bad' }),
    ]
  }

  // 🔴 סירבה / שוחררה ⇒ **שורה שנייה בלבד.** הישנה נשארת כהיסטוריה ומזינה את הציון.
  if (status === 'declined' || status === 'released') {
    return [item(ASSIGNMENT_ACTION.NEW_INVITE, 'פתח זימון חדש', { sendsEmail: true })]
  }

  // `approval_withdrawn` — שורת היסטוריה. המחליפה נבחרת ב-Smart Match, לא כאן.
  return []
}
