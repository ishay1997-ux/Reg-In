// שכבת-השאילתות של **הדף הציבורי בלבד** (משטח S4 — `/feedback/:token`).
//
// 🔴 **קובץ נפרד מ-`api.js` של המודול, לאותה סיבה בדיוק כמו `04_hostesses/publicApi.js`**
// (נקרא במלואו לפני כתיבת הקובץ הזה): `api.js` גורר את מנוע-המיילים ואת שאר הלוגיקה
// הפנימית של מנהלת-הכספים. הדף הציבורי נטען ע"י לקוח-חיצוני בלי חשבון, לרוב בסלולר —
// אין שום סיבה שקוד-שליחת-מיילים ייסע אליו. ➕ וגבול-קריאה: מי שפותח את הקובץ הזה רואה
// בדיוק את שתי הפעולות שאנונימי מסוגל לבצע, ותו לא.
// ✅ כלל ברזל 14 נשמר — הקומפוננטה עדיין אינה מדברת עם `supabase` ישירות.
//
// 🔴 **שתי הפונקציות כאן רצות בלי session** — כמו `respondToShiftInvite`/`fetchShiftInvite`.
// אין `ProtectedRoute`, אין תפקיד, אין RLS שמגן; ההגנה כולה בתוך שתי פונקציות-ה-DB
// (`SECURITY DEFINER`, `set search_path = ''`) שהוקמו במיגרציה `20260827155303`
// (מודול 8, צעד 1.6) + הגבלת-הקצב הפנימית שלהן (15/IP/שעה).

import { supabase } from '@/supabaseClient'

// קריאה — מצב-הדף לפי הטוקן. מחזירה את ה-JSON של `get_feedback_page` כפי שהוא:
// `{state:'ok', event_name, event_date}` · `{state:'already'}` · `{state:'not_found'}`.
//
// ⚠️ **`not_found` מכסה טוקן ריק/שגוי/מת — אותו אובייקט בדיוק, בכוונה** (אין ערוץ-מידע
// למי שמנחש טוקנים; ר' כותרת המיגרציה). `error` מוחזר כזריקה, ולא מתורגם ל-`not_found`:
// כשל-רשת חייב להיראות שונה מ"הקישור אינו בתוקף" — הראשון מציג "נסו שוב", השני לא.
export async function fetchFeedbackPage(token) {
  const { data, error } = await supabase.rpc('get_feedback_page', { p_token: token })
  if (error) throw error
  return data
}

// כתיבה — הגשת המשוב. `score` הוא 1–5; `notes`/`negativeReasons`/`positiveReasons` רשות.
// מחזירה `{state:'ok'}` · `{state:'already'}` · `{state:'not_found'}` · `{state:'invalid'}`
// (ציון חסר/מחוץ-לטווח — הרצפה האמיתית יושבת בשרת; הלקוח רק חוסם את כפתור-השליחה, A-1).
export async function submitFeedback(
  token,
  score,
  notes,
  negativeReasons = [],
  positiveReasons = [],
) {
  const negArray = Array.isArray(negativeReasons)
    ? negativeReasons
    : negativeReasons
      ? [negativeReasons]
      : []
  const posArray = Array.isArray(positiveReasons)
    ? positiveReasons
    : positiveReasons
      ? [positiveReasons]
      : []

  const { data, error } = await supabase.rpc('submit_feedback', {
    p_token: token,
    p_score: score,
    p_notes: notes,
    p_negative_reasons: negArray,
    p_positive_reasons: posArray,
  })
  if (error) throw error
  return data
}
