// שכבת-השאילתות של **הדף הציבורי בלבד** (משטח 5).
//
// 🔴 **למה קובץ נפרד ולא `api.js` של המודול** — וזו החלטה, לא סגנון:
// ‏`api.js` מייבא את מנוע-המיילים, את הגאוקוד, את `smartMatch` ואת `assignmentActions`.
// כל אלה נגררים לגרף-הייבוא של כל מי שמייבא אותו. **הדף הציבורי הוא הדף היחיד באפליקציה
// שנטען ע"י אדם בלי חשבון, בטלפון, לרוב בסלולר** — ואין שום סיבה שקוד שליחת-מיילים
// ייסע אליו. ➕ ובנוסף זה גבול קריאה: מי שפותח את הקובץ הזה רואה **בדיוק** את שתי
// הפעולות שאנונימי מסוגל לבצע במערכת, ותו לא.
// ✅ **כלל ברזל 14 נשמר** — הקומפוננטה עדיין אינה מדברת עם `supabase` ישירות.
//
// 🔴 **שתי הפונקציות כאן הן היחידות במערכת שרצות בלי session.** אין `ProtectedRoute`,
// אין תפקיד, אין RLS שמגן — ההגנה כולה יושבת בתוך שתי פונקציות-ה-DB (`SECURITY DEFINER`,
// ‏`set search_path = ''`), ו-`assignments` נשארת deny-all מוחלט ל-`anon`.

import { supabase } from '@/supabaseClient'

// קריאה — פרטי הזימון. מחזירה את ה-JSON של `get_shift_invite` כפי שהוא.
//
// ⚠️ **`error` מוחזר כזריקה, ו-`data` ריק אינו שגיאה** — זו ההבחנה שהמודול כולו נבנה
// סביבה: כשל-רשת חייב להיראות שונה מ"הקישור אינו בתוקף". הראשון מציג "נסי שוב",
// השני מפנה לטלפון. איחודם היה אומר לדיילת שהקישור מת בכל פעם שהאינטרנט קרטע.
export async function fetchShiftInvite(token) {
  const { data, error } = await supabase.rpc('get_shift_invite', { p_token: token })
  if (error) throw error
  return data
}

// כתיבה — התשובה עצמה. 🔴 **`response` הוא אחד משניים בלבד**; הפונקציה במסד דוחה כל
// ערך אחר בהודעה הגנרית, וזו הרצפה האמיתית. הקבועים כאן הם נוחות-קריאה, לא אכיפה.
export const SHIFT_RESPONSE = { confirm: 'confirmed', decline: 'declined' }

export async function respondToShiftInvite(token, response) {
  const { data, error } = await supabase.rpc('respond_to_shift_invite', {
    p_token: token,
    p_response: response,
  })
  if (error) throw error
  return data
}
