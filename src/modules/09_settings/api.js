// שכבת ה-API של מודול 9 (הגדרות מערכת) — כלל ברזל 14: כל גישת ה-Supabase של המודול
// מרוכזת כאן; המסכים (פזה 3) מייבאים מכאן בלבד ולעולם לא קוראים ל-`supabase.from(...)`
// בעצמם. הקובץ אינו יודע כלום על תוויות/ולידציה/קבוצות — אלה חיים ב-`src/lib/paramsRegistry.js`
// (רגיסטרי נפרד, צעד 2.1); כאן יש קלט/פלט בלבד, בדיוק כמו `08_finance/api.js`.
//
// 🔴 **הכשל השקט המרכזי של הפרויקט חל כאן פעמיים באותה פונקציה** (§4.3 במדריך-המיקרו):
// כתיבה שנחסמת ע"י RLS על `params` מחזירה `{data: [], error: null}` — לא שגיאה — כי המדיניות
// החדשה (מיגרציה A) היא "עריכה על 'הגדרות מערכת' **או** בעלות על השורה" (`owner_role_id`),
// ולא רק CEO. ⇒ **כל `.update()` כאן עובר `.select()` + `assertRowsAffected`**, בדיוק כמו
// `pricesApi.updatePricingParam` (הלקח מ-30/07/2026: לעולם לא `upsert` על `params` —
// `param_type` הוא `NOT NULL` וה-INSERT-המרומז של upsert נבדק עליו **לפני** שהוא פוגע
// בקונפליקט, כלומר עדכון שנראה "תמיד קיים" עדיין נכשל אם ה-upsert מנסה ליצור).
//
// 🔴 **V-9 — קבוצה מעורבת-בעלות אינה "לא תקרה", היא בלתי-אפשרית-בחוזה.** `updateParams`
// מסרבת לכל האצווה **לפני** כתיבה ראשונה אם יש בה שורה שהקורא אינו יכול לערוך (הבדיקה
// מראה את אותו הביטוי בדיוק כמו `canEdit` ב-UI, §4.4: `canEditAll || ownerRoleId === roleId`)
// — כדי שמצב-כתיבה-חלקית (חלק מהשורות נשמרו, חלק נחסמו) יהיה בלתי-נגיש ולא רק לא-סביר
// (ההסק מ-`PricingParamsCard.jsx:93-96`, שבו כתיבה סדרתית בלי המנעול הזה יצרה בדיוק את זה).
//
// 🔴 **`params.param_value` הוא `text` לכל הטיפוסים, כולל בוליאני ומספר** — הקובץ הזה כותב
// וקורא מחרוזות בלבד; פענוח-טיפוס (`optionalNumber`/`paramBoolean`) הוא עבודת-הקורא, לא כאן
// (§2.9). כתיבה עוברת `String(value)`, בדיוק כמו `pricesApi.updatePricingParam`.

import { supabase } from '@/supabaseClient'
import { toError, assertRowsAffected } from '@/lib/apiError'

// קוד-שגיאה סינתטי שה-UI בודק כדי להסתיר את פאנל-השכר-מתחת-למינימום במקום להציג שגיאה
// אדומה למי שאינה בעלת הפרמטר ואינה עורכת 'הגדרות מערכת' — ר' `listBelowMinWage` למטה.
export const PARAMS_ERROR_CODE = { BLOCKED: 'blocked' }

// ---- params: קריאות ----

// כל השורות, כולל `owner_role_id` — משטח ה-CEO (`ParamsTab`). ה-RLS (SELECT open לכל
// authenticated, §7.83) עושה את הסינון האמיתי; המיון לפי שם נותן סדר יציב לבדיקות ולתצוגה.
export async function listParams() {
  const { data, error } = await supabase.from('params').select('*').order('param_name')
  if (error) throw toError(error, 'שגיאה בטעינת רשימת ההגדרות.')
  return data ?? []
}

// רק השורות שהתפקיד הנוכחי בעליהן — משטח "ההגדרות שלי" (A-9/R-2). 🔴 **שאילתה עם `eq` בצד
// השרת, לא "הכול ואז סינון"** (§4.4: "the my-settings page queries with owner_role_id = roleId,
// never all then filter") — כדי שגם ה-*בקשה* תיחסם ע"י ה-fetch ולא רק שהתצוגה תסתיר שורות.
export async function listMyParams(roleId) {
  const { data, error } = await supabase
    .from('params')
    .select('*')
    .eq('owner_role_id', roleId)
    .order('param_name')
  if (error) throw toError(error, 'שגיאה בטעינת ההגדרות שלך.')
  return data ?? []
}

// ---- params: כתיבה ----

// `changes` = [{ name, value, ownerRoleId }] — `name` הוא `param_name` (המפתח הטבעי שה-UI
// שומר עליו), `ownerRoleId` הוא `owner_role_id` הידוע-ל-UI של אותה שורה (לא נקרא כאן מהמסד
// שוב — זה כבר בידי הקורא מ-`listParams`/`listMyParams`).
//
// שלב 1 — מנעול-הבעלות-המעורבת (V-9), *לפני* כל כתיבה: אם יש שורה שהקורא אינו יכול לערוך,
// כל האצווה נדחית ואף `update` לא יוצא. הביטוי זהה בכוונה ל-`canEdit` שב-UI (§4.4) — כלל אחד,
// לא שני ניסוחים שיכולים להתפצל.
function canEditParam(change, { roleId, canEditAll }) {
  return Boolean(canEditAll) || change.ownerRoleId === roleId
}

export async function updateParams(changes, { roleId, canEditAll } = {}) {
  const list = changes ?? []

  const forbidden = list.find((change) => !canEditParam(change, { roleId, canEditAll }))
  if (forbidden) {
    throw toError(
      { code: 'PARAMS_MIXED_BATCH' },
      `אין הרשאה לערוך את "${forbidden.name}" — כל קבוצת השינויים לא נשלחה.`,
    )
  }

  // שלב 2 — כתיבה סדרתית, שורה-שורה. עצירה בכשל הראשון (ולא Promise.all): כתיבה חלקית
  // גלויה עדיפה על ניסיון-כל-השורות-ואיסוף-שגיאות, כי היא נעצרת במקום שהוא כבר בעייתי
  // (למשל: שם-פרמטר שגוי, או שורה שאיבדה בעלות בין הטעינה לשמירה).
  const written = []
  for (const change of list) {
    const { data, error } = await supabase
      .from('params')
      .update({ param_value: String(change.value) })
      .eq('param_name', change.name)
      .select()
    if (error) throw toError(error, `שמירת "${change.name}" נכשלה.`)
    // 0 שורות = הכשל השקט (למעלה) — או ששם-הפרמטר שגוי, או שה-RLS חסם. שני המקרים חייבים
    // להישמע, ולכן הניסוח כאן דו-משמעי בכוונה כמו בשאר הקובץ המקביל (`pricesApi.js`).
    assertRowsAffected(data, `הפרמטר "${change.name}" לא עודכן — ייתכן שאין לך הרשאה.`)
    written.push(change.name)
  }
  return written
}

// ---- min-wage: RPC (finance חסומה על 'דיילות', §4.2) ----

// `list_hostesses_below_min_wage()` שומרת גם היא (`assert_module_permission`) — רק בעלת
// `שכר_מינימום_שעתי` או מי שמחזיקה `edit` על 'הגדרות מערכת'. חסימה חוזרת `42501`, וממופה
// כאן לקוד-שגיאה טיפוסי (`PARAMS_ERROR_CODE.BLOCKED`) כדי שה-UI יוכל **להסתיר** את הפאנל
// (לא להציג שגיאה אדומה) למי שאין לה עסק בו — בדיוק כמו שקוד-RLS_DENIED מסמן "כשל-הרשאה
// ולא כשל-רשת" בשאר הפרויקט.
// `threshold` (אופציונלי, מיגרציה D 02/09/2026): מספר סופי ⇒ תצוגה-מקדימה מול הרף המוקלד — לפני
// השמירה; חסר/לא-מספר ⇒ הפונקציה קוראת את הרף השמור ב-params, כמו קודם. הסינון "דיילות פעילות
// בלבד" והשער נשארים בפונקציה עצמה בשני המקרים.
export async function listBelowMinWage(threshold) {
  const args = Number.isFinite(threshold) ? { p_threshold: threshold } : {}
  const { data, error } = await supabase.rpc('list_hostesses_below_min_wage', args)
  if (error) {
    if (error.code === '42501') {
      const blockedError = toError(
        error,
        'אין לך הרשאה לצפות ברשימת השכר — רק בעלת הפרמטר או מי שמחזיקה עריכה על "הגדרות מערכת".',
      )
      blockedError.code = PARAMS_ERROR_CODE.BLOCKED
      throw blockedError
    }
    throw toError(error, 'שגיאה בטעינת רשימת הדיילות מתחת לשכר המינימום.')
  }
  return data ?? []
}

// ---- attendance: מונה-חי לצד מתג-האמינות (A-10) ----

// קריאה רגילה על `assignments` תחת מדיניות-הקריאה הקיימת של 'דיילות' — לא DEFINER חדש:
// הפאנל הזה נגיש רק לתפקידים שכבר מחזיקים 'דיילות' (CEO, גיוס), אז RPC-עוקף היה חשיפה
// בלי תועלת (A-10). סופרים בצד-הלקוח על שליפה אחת ולא שתי שאילתות `count`, כי הטבלה קטנה
// (כלי-פנים ל-5 משתמשים) והמונים חייבים להסתכם תמיד לאותו מכנה בלי מרוץ בין שתי בקשות-רשת.
export async function countAttendanceRows() {
  const { data, error } = await supabase.from('assignments').select('attendance_status')
  if (error) throw toError(error, 'שגיאה בטעינת נתוני הנוכחות.')
  const rows = data ?? []
  return {
    total: rows.length,
    withAttendance: rows.filter((row) => row.attendance_status !== null).length,
  }
}

// ---- notification_preferences: self-only (email = auth.email(), §4.1) ----

// הזהות של "מי המשתמש המחובר" נקראת ישירות מה-session, בדיוק כמו `AuthContext.loadUser`
// (`sessionData.session.user.email`) — ולא מקבלת אותה כארגומנט: השורה במסד ממילא **ממופה
// ל-email דרך RLS** (`email = (select auth.email())`), ולכן זו נקודת-האמת היחידה למי-אני,
// לא state שה-UI צריך להעביר ולסנכרן.
async function currentUserEmail() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw toError(error, 'שגיאה בזיהוי המשתמש המחובר.')
  const email = data?.session?.user?.email
  if (!email) throw toError({ code: 'NO_SESSION' }, 'אין משתמש מחובר.')
  return email
}

// שורה חסרה = שתי ההעדפות כבויות (§2.8 "Absent row = both false") — לא שגיאה ולא ברירת-מחדל
// שממציאים כאן; זהו החוזה שהמיגרציה קבעה.
export async function getNotificationPreferences() {
  const email = await currentUserEmail()
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('email_new_projects, sms_last_minute')
    .eq('email', email)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת העדפות ההתראות.')
  return {
    emailNewProjects: data?.email_new_projects ?? false,
    smsLastMinute: data?.sms_last_minute ?? false,
  }
}

// `upsert` ולא `update`+`insert` נפרדים — ובניגוד ל-`params` זה **בטוח** כאן: שתי העמודות
// הבוליאניות היחידות מלבד ה-PK הן `not null`, ושתיהן מוזרקות במפורש בכל קריאה. אין כאן
// עמודה שלישית שה-INSERT-המרומז של ה-upsert יכול להיכשל עליה (הבדל מהמלכודת ב-`params`,
// שבה `param_type` לא נשלח).
export async function saveNotificationPreferences({ emailNewProjects, smsLastMinute }) {
  const email = await currentUserEmail()
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        email,
        email_new_projects: Boolean(emailNewProjects),
        sms_last_minute: Boolean(smsLastMinute),
      },
      { onConflict: 'email' },
    )
    .select()
  if (error) throw toError(error, 'שמירת העדפות ההתראות נכשלה.')
  assertRowsAffected(data, 'אין הרשאה לשמור העדפות התראות.')
  return {
    emailNewProjects: data[0].email_new_projects,
    smsLastMinute: data[0].sms_last_minute,
  }
}
