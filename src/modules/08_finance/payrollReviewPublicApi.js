// שכבת הנתונים של **הדף האישי לבדיקת שעות** (`/payroll-review/:token`) — ותו לא.
//
// 🔴 **למה קובץ נפרד ולא `api.js` / `payrollApi.js`** — אותה החלטה כמו `publicApi.js` של
// המשוב ושל זימון המשמרת: הדף נפתח בטלפון של דיילת בלי חשבון, ואין סיבה שקוד הכספים,
// המיילים או ה-XLSX ייסע אליו. ➕ גבול קריאה: מי שפותח את הקובץ רואה בדיוק את שתי הפעולות
// שאנונימי מסוגל לבצע על דוח השכר — לקרוא את הסיכום שלה, ולהשיב עליו.
//
// 🔴 ההגנה כולה יושבת בשתי פונקציות המסד (מיגרציה 20261014001200, SECURITY DEFINER): טוקן
// מנוחש / פג / מבוטל / של דיילת אחרת מקבל אותה תשובה בדיוק `{state:'invalid'}`, והטבלאות
// עצמן deny-all. מה שכתוב כאן הוא נוחות ותצוגה, לא אכיפה.
//
// ⚠️ **שגיאת רשת נזרקת; `{state:'invalid'}` אינו שגיאה.** הדף חייב להבחין בין "האינטרנט
// קרטע" (נסי שוב) לבין "הקישור לא בתוקף" (לפנות למנהלת) — איחודם היה שולח דיילת לטלפון
// בכל פעם שהקליטה נפלה.

import { supabase } from '@/supabaseClient'

// קריאה בלבד. 🔑 פתיחת הקישור **לא משנה כלום** — סורק מיילים שפותח את הקישור לא מאשר דבר.
export async function fetchPayrollReview(token) {
  const { data, error } = await supabase.rpc('payroll_review_public_get', { p_token: token })
  if (error) throw error
  return data
}

// תשובה מפורשת: `approve` או `objection`. ‏`requestId` נשמר בדף בין ניסיונות, כך שלחיצה
// כפולה או "נסי שוב" אחרי תשובה שאבדה מחזירים את התוצאה השמורה ולא יוצרים פנייה שנייה.
export async function respondToPayrollReview({ token, requestId, digest, action, caseInput }) {
  const { data, error } = await supabase.rpc('payroll_review_public_respond', {
    p_token: token,
    p_request_id: requestId,
    p_digest: digest,
    p_action: action,
    p_case: caseInput ?? null,
  })
  if (error) throw error
  return data
}

export const REVIEW_ACTION = { approve: 'approve', objection: 'objection' }

// מזהה בקשה חדש. `crypto.randomUUID` קיים בכל דפדפן נייד עדכני ובסביבת הבדיקות.
export function newRequestId() {
  return crypto.randomUUID()
}

// ─── לוגיקה טהורה של הדף (בלי רשת) ─────────────────────────────────────────

// הקטגוריות של "יש טעות" — הערכים הם החוזה מול המסד (CHECK בטבלת הפניות), התוויות בנקבה
// הן שמות עצם, ולכן אין בהן מגדר.
export const OBJECTION_CATEGORIES = [
  { value: 'hours', label: 'שעות' },
  { value: 'rate', label: 'תעריף' },
  { value: 'bonus_travel', label: 'בונוס או נסיעות' },
  { value: 'missing_shift', label: 'משמרת חסרה' },
  { value: 'other', label: 'אחר' },
]

export const DESCRIPTION_MAX = 2000
export const SUGGESTED_MAX = 100000

export const EMPTY_OBJECTION = {
  rowKeys: [],
  missingShift: false,
  category: '',
  description: '',
  suggestedValue: '',
}

// הסבר לשורה בסכום אפס — כדי שאפס לא ייראה כמו טעות במערכת.
const ZERO_REASON_TEXT = {
  force_majeure: 'האירוע בוטל בכוח עליון, ולכן אין תשלום',
  cancelled_early: 'האירוע בוטל מספיק זמן מראש, ולכן אין פיצוי',
  no_hours: 'לא נרשמו שעות למשמרת הזו',
}

export function zeroReasonText(reason) {
  return ZERO_REASON_TEXT[reason] ?? ''
}

// הודעה לכל שדה בטופס "יש טעות". מקור אחד — גם לבדיקה בדפדפן וגם לתשובת `validation`
// מהשרת, כדי ששני המסלולים יגידו אותו דבר.
export const OBJECTION_FIELD_MESSAGES = {
  rows: 'משמרת: יש לסמן משמרת אחת לפחות, או "משמרת חסרה"',
  category: 'סוג הטעות: יש לבחור אחת מהאפשרויות',
  description: 'מה לא נכון: יש לכתוב כמה מילים על הטעות',
  description_long: `מה לא נכון: עד ${DESCRIPTION_MAX} תווים`,
  suggested_value: `המספר הנכון: מספר בין 0 ל-${SUGGESTED_MAX.toLocaleString('en-US')}`,
}

function parseSuggested(raw) {
  const text = String(raw ?? '').trim()
  if (text === '') return { present: false, value: null }
  const value = Number(text)
  return { present: true, value }
}

// בדיקת הטופס לפני שליחה. מחזירה מפה `שדה ⇒ הודעה`; ריקה = תקין.
// 🔑 כל הודעה חוזרת על שם השדה (UC18) — היא נקראת גם בסיכום השגיאות שבראש הטופס.
// המסד בודק את אותם כללים שוב (`{state:'validation', field}`), וזו הרצפה האמיתית.
export function validateObjection(form) {
  const errors = {}
  const category = form?.category ?? ''
  const rowKeys = form?.rowKeys ?? []
  const missingShift = Boolean(form?.missingShift) || category === 'missing_shift'

  if (rowKeys.length === 0 && !missingShift) {
    errors.rows = OBJECTION_FIELD_MESSAGES.rows
  }
  if (!OBJECTION_CATEGORIES.some((option) => option.value === category)) {
    errors.category = OBJECTION_FIELD_MESSAGES.category
  }
  const description = String(form?.description ?? '').trim()
  if (description.length === 0) {
    errors.description = OBJECTION_FIELD_MESSAGES.description
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = OBJECTION_FIELD_MESSAGES.description_long
  }
  const suggested = parseSuggested(form?.suggestedValue)
  if (
    suggested.present &&
    (!Number.isFinite(suggested.value) || suggested.value < 0 || suggested.value > SUGGESTED_MAX)
  ) {
    errors.suggested_value = OBJECTION_FIELD_MESSAGES.suggested_value
  }
  return errors
}

// צורת `p_case` שהמסד מקבל. ‏`row_keys` הם מפתחות השורות שבסיכום (`r1`…), לא מזהי פרויקט —
// הדף לא רואה מזהים, והמסד מתרגם את המפתח לשיבוץ מתוך הסיכום השמור.
export function buildCasePayload(form) {
  const suggested = parseSuggested(form?.suggestedValue)
  return {
    category: form.category,
    row_keys: [...(form.rowKeys ?? [])],
    missing_shift: Boolean(form.missingShift) || form.category === 'missing_shift',
    description: String(form.description ?? '').trim(),
    suggested_value: suggested.present ? suggested.value : null,
  }
}
