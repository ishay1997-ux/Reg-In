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

// הקטגוריות של "יש טעות" — הערכים הם החוזה מול המסד (CHECK בטבלת הפניות).
// 🔴 F11 (הכרעת ישי 14.10, "רק משמרות ושעות"): הדיילת בודקת משמרות ושעות בלבד — אין קטגוריה
// של תעריף, בונוס או נסיעות, כי היא לא רואה אותם.
export const OBJECTION_CATEGORIES = [
  { value: 'hours', label: 'שעות' },
  { value: 'missing_shift', label: 'משמרת חסרה' },
  { value: 'not_worked', label: 'משמרת שלא עבדתי בה' },
  { value: 'other', label: 'אחר' },
]

const DESCRIPTION_MAX = 2000
const SUGGESTED_MAX = 24

export const EMPTY_OBJECTION = {
  rowKeys: [],
  category: '',
  description: '',
  suggestedValue: '',
}

// הסבר לשורה בסכום אפס — כדי שאפס לא ייראה כמו טעות במערכת.
// בלי שום סכום (F11): ההסבר מדבר על שעות, לא על כסף.
const ZERO_REASON_TEXT = {
  force_majeure: 'האירוע בוטל בכוח עליון, ולכן אין שעות לתשלום',
  cancelled_early: 'האירוע בוטל מספיק זמן מראש, ולכן אין שעות פיצוי',
  no_hours: 'לא נרשמו שעות למשמרת הזו',
}

export function zeroReasonText(reason) {
  return ZERO_REASON_TEXT[reason] ?? ''
}

// הודעה לכל שדה בטופס "יש טעות". מקור אחד — גם לבדיקה בדפדפן וגם לתשובת `validation`
// מהשרת, כדי ששני המסלולים יגידו אותו דבר.
export const OBJECTION_FIELD_MESSAGES = {
  rows: 'משמרת: יש לסמן משמרת אחת לפחות, או לבחור "משמרת חסרה"',
  category: 'סוג הטעות: יש לבחור אחת מהאפשרויות',
  description: 'מה לא נכון: יש לכתוב כמה מילים על הטעות',
  description_long: `מה לא נכון: עד ${DESCRIPTION_MAX} תווים`,
  suggested_value: `מספר השעות הנכון: מספר בין 0 ל-${SUGGESTED_MAX}`,
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
  // "משמרת חסרה" היא קטגוריה — היא לבדה מחליפה סימון שורה.
  const missingShift = category === 'missing_shift'

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
  // מספר מוצע — רק בפנייה על שעות (F11). בקטגוריה אחרת השדה לא מוצג ולא נשלח.
  const suggested = parseSuggested(form?.suggestedValue)
  if (
    category === 'hours' &&
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
    missing_shift: form.category === 'missing_shift',
    description: String(form.description ?? '').trim(),
    suggested_value: form.category === 'hours' && suggested.present ? suggested.value : null,
  }
}
