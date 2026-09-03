// קריאות-המסד של דיאלוג ביטול-הפרויקט (משטח 7) — קובץ-api שני של המודול, לצד api.js.
//
// 🔑 **למה קובץ נפרד ולא תוספת ל-api.js:** צעד 2.5 נסגר, נחתם וקומט (`844efca`), והעוטפים
// שבו הם חוזה שנבדק — הוראת-הבנייה של 3.6/3.7 אוסרת לגעת בו. שלוש הקריאות כאן חסרות שם
// (params של המדרג · תבנית-המייל · כתובות-המייל של המשוחררות), וכלל 14 דורש שגישת-Supabase
// תשב בשכבת-api של המודול ולא בקומפוננטה. התקדים לקובץ-api שני באותו מודול:
// `src/modules/01_auth/pricesApi.js`.
import { supabase } from '@/supabaseClient'
import { toError } from '@/lib/apiError'
import { CANCELLATION_PARAM_NAMES } from '@/lib/projectCancellation'
import { PROJECT_TEMPLATE_NAMES } from '@/lib/shiftEmails'
import { getEmailTemplate } from '@/api/email'

// שלוש שורות-המדרג מ-`params` (נזרעו בצעד 1.7). מוחזרות כמפה param_name⇒param_value.
// ⚠️ פרמטר שלא חוזר אינו מקבל ברירת-מחדל כאן — הדיאלוג מציג מצב-שגיאה במקום מספר מומצא
// (אותה הכרעה כמו `getQuoteScreenParams`; מ-02/09/2026, מודול 9, `getHostessScreenParams` הלך צעד
// רחוק יותר ונכשל בקול כבר בטעינה דרך `getParamValues` — כאן הדיאלוג עדיין הוא שמציג את השגיאה).
export async function getCancellationParams() {
  const { data, error } = await supabase
    .from('params')
    .select('param_name, param_value')
    .in('param_name', Object.values(CANCELLATION_PARAM_NAMES))
  if (error) throw toError(error, 'שגיאה בטעינת הגדרות הפיצוי.')
  return Object.fromEntries((data ?? []).map((p) => [p.param_name, p.param_value]))
}

// גוף תבנית "האירוע בוטל" — נקרא **ברגע השליחה**, לא בטעינת המסך (as-built של 2.8:
// "Read the bodies from params at build/send time"). תבנית חסרה **עוצרת** ואינה נשלחת
// כגוף ריק — נאכף ע"י `getEmailTemplate` המשותף (`src/api/email.js`, אוחד 19/08/2026;
// היה כאן עותק פרטי זהה-בייט שגם `06_projects/api.js` כבר לא מחזיק).
export async function getCancellationEmailTemplate() {
  return getEmailTemplate(PROJECT_TEMPLATE_NAMES.cancellation)
}

// כתובות-המייל של המשוחררות. `hostesses_to_notify` שה-RPC מחזיר נושא **בכוונה** רק
// hostess_id + full_name (הערת-הגוף במיגרציה: "🚫 לא מייל, לא טלפון") — והמייל נשלח
// מהלקוח (AR-5), ולכן הכתובות נשלפות בנפרד. הקריאה מגודרת ב-RLS של 'דיילות': מי שאינה
// רשאית מקבלת רשימה ריקה בלי שגיאה, והדיאלוג מדווח "לא נשלח — אין הרשאה לכתובות".
export async function getHostessEmails(hostessIds) {
  if (!hostessIds?.length) return new Map()
  const { data, error } = await supabase
    .from('hostesses')
    .select('hostess_id, full_name, email')
    .in('hostess_id', hostessIds)
  if (error) throw toError(error, 'שגיאה בטעינת כתובות המייל של הדיילות.')
  return new Map((data ?? []).map((row) => [row.hostess_id, row]))
}
