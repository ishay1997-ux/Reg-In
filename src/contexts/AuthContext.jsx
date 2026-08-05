// ============================================================================
// AuthContext — קונטקסט האימות וההרשאות המרכזי של המערכת
// ----------------------------------------------------------------------------
// למה הקובץ קיים: כדי ש-Sidebar, ProtectedRoute, MainLayout ו-Topbar לא ישכפלו
// שוב ושוב את שאילתת "מי אני ומה מותר לי". זהו מקור-אמת יחיד בצד-הלקוח למצב המשתמש:
//   • user        — הזהות והסטטוס: { email, fullName, phone, status, roleId, roleName }
//   • permissions — מפת ההרשאות:   { [module_name]: 'edit' | 'view' | 'blocked' }
// חשוב: האכיפה האמיתית היא ב-DB (RLS). השכבה כאן היא נוחות/תצוגה בלבד ואי אפשר
// להסתמך עליה לביטחון — לקוח יכול לשקר, ה-DB לא.
// ============================================================================

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '@/supabaseClient'

// ערך ברירת המחדל null בכוונה — הוא מה שמאפשר ל-Guard Clause ב-useAuth (בתחתית)
// לזהות קריאה מחוץ ל-<AuthProvider>.
const AuthContext = createContext(null)

// שליפת מפת ההרשאות של תפקיד + השטחה ל-{ module_name: level } לגישה O(1) מהרכיבים
// (Sidebar/ProtectedRoute). מחוץ לקומפוננטה כי היא יחידת-עבודה שלמה בלי תלות ב-state.
// ⚠️ **מחזירה `failed` ולא זורקת, ולא מחזירה מפה ריקה בכשל** — הבחנה שהיא כל התיקון של
// 31/07/2026: מפה ריקה נקראת אצל הקוראים כ"אין לך שום הרשאה", וכשל-רשת אינו זה.
async function fetchPermissionMap(roleId) {
  const { data, error } = await supabase
    .from('permissions')
    .select('permission_level, modules(module_name)')
    .eq('role_id', roleId)
  if (error) return { map: null, failed: true }

  const map = {}
  for (const row of data || []) {
    if (row.modules?.module_name) {
      map[row.modules.module_name] = row.permission_level
    }
  }
  return { map, failed: false }
}

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true) // true עד לסיום הטעינה הראשונה — מונע הבהוב/ניתוב לפני שידוע מי המשתמש
  const [user, setUser] = useState(null) // { email, fullName, phone, status, roleId, roleName } או null (אורח)
  const [permissions, setPermissions] = useState({}) // { [module_name]: 'edit' | 'view' | 'blocked' }
  // ⚠️ **"לא הצלחנו לטעון הרשאות" אינו "אין לך הרשאה"** (סבב-תיקון 31/07/2026). עד לתאריך
  // הזה שגיאת השאילתה למטה לא נלכדה כלל: תקלה רגעית ⇒ מפה ריקה ⇒ ProtectedRoute דחה כל
  // מסך עם "אין לך הרשאה לצפות במסך זה" — מסך שנראה **בדיוק** כמו שלילת-הרשאות אמיתית.
  // וזה לא תרחיש-קצה: `loadUser` רץ מחדש בכל אירוע-אימות כולל רענון-טוקן, כלומר תקלת-רשת
  // בת-שנייה באמצע יום-עבודה מנתקת משתמש עובד. הדגל הוא המצב-השלישי המוצהר.
  const [permissionsError, setPermissionsError] = useState(false)

  // authError — הודעת שער-הרשאה שנקבעת כשיש session תקין ב-Auth אך המשתמש אינו מורשה
  // במערכת (אין שורת users). קריטי בעיקר לזרימת Google OAuth: היא חוזרת ל-app (לא ל-LoginPage),
  // ולכן צריך מקום מרכזי לשדר ממנו את השגיאה חזרה למסך ההתחברות.
  const [authError, setAuthError] = useState(null)

  // דגל "האם הרכיב עדיין מותקן". loadUser אסינכרוני, ואם המשתמש התנתק/ניווט בזמן
  // ה-await אסור לקרוא ל-setState על רכיב מפורק (דליפת זיכרון + אזהרת React).
  // בחרנו ב-ref ולא ב-state: עדכון הדגל לא אמור לגרום רינדור, ואנחנו צריכים ערך "חי"
  // (mutable) שנקרא בתוך ה-closure של loadUser.
  const mountedRef = useRef(true)

  // loadUser עטוף ב-useCallback עם תלות ריקה [] מ-2 סיבות אדריכליות:
  //   1) הוא מיוצא החוצה כ-`reload` דרך ערך ה-context — reference יציב מונע רינדור
  //      מיותר של צרכנים שתלויים ב-reload.
  //   2) הוא נכנס כתלות ל-useEffect למטה. reference יציב => האפקט רץ פעם אחת בלבד,
  //      וזה מספק את כלל react-hooks/exhaustive-deps בלי ליצור לולאה אינסופית
  //      (שהייתה נוצרת אילו loadUser היה נוצר מחדש בכל רינדור ומופיע במערך התלויות).
  const loadUser = useCallback(async () => {
    setLoading(true)

    // 1) מיהו המשתמש המחובר לפי Supabase Auth?
    const { data: sessionData } = await supabase.auth.getSession()
    if (!mountedRef.current) return // פורק בזמן ה-await — עוצרים בשקט, בלי setState
    const email = sessionData?.session?.user?.email

    // אין session פעיל => אורח. מאפסים ומסיימים.
    if (!email) {
      setUser(null)
      setPermissions({})
      setPermissionsError(false)
      setLoading(false)
      return
    }

    // 2) שליפת שורת המשתמש מטבלת users (כולל שם התפקיד דרך join ל-roles).
    //    מדיניות RLS (users_select_self_or_ceo) מבטיחה שמשתמש רגיל שולף רק את השורה שלו.
    const { data: myRow, error: myRowError } = await supabase
      .from('users')
      .select('email, full_name, phone, status, role_id, roles(role_name)')
      .eq('email', email)
      .single()
    if (!mountedRef.current) return

    // ⚠️ **שגיאה רגעית אינה "אין שורת users"** (סבב-תיקון 31/07/2026, אותה משפחת-כשל של
    // ההרשאות למטה — וחמורה ממנה): כל שגיאה כאן גררה signOut מלא + "החשבון אינו מורשה",
    // כלומר תקלת-רשת בת-שנייה **זרקה מהמערכת** משתמש עובד והאשימה אותו. `.single()` מחזיר
    // `PGRST116` כשאין שורה — זה המצב היחיד שבו "אינך מורשה" הוא אמת, ורק הוא מנתק.
    if (myRowError && myRowError.code !== 'PGRST116') {
      // לא מנתקים: אם כבר יש משתמש טעון, הוא ממשיך לעבוד עם המפה שבידו. אם זו טעינה
      // ראשונה (user עדיין null), MainLayout ינווט ל-/login — ולכן authError, שאחרת
      // המשתמש היה מגיע למסך-כניסה בלי מילת-הסבר אחת.
      setPermissionsError(true)
      setAuthError('תקלה זמנית בטעינת פרטי החשבון. נסה שוב בעוד רגע.')
      setLoading(false)
      return
    }

    // שורה חסרה: יש session תקין ב-Auth אך אין שורת users תואמת — למשל התחברות Google
    // עם חשבון שאינו מורשה במערכת. מנתקים את ה-session היתום ומדליקים authError, כדי שמסך
    // ההתחברות (שאליו MainLayout יפנה כש-user=null) יסביר למשתמש למה נחסם. בלי ה-signOut היה
    // נשאר session מיותם שמנווט בלולאה ל-/login בלי הודעה.
    if (!myRow) {
      await supabase.auth.signOut()
      if (!mountedRef.current) return
      setAuthError('החשבון שאיתו התחברת אינו מורשה במערכת. פנה למנכ"ל.')
      setUser(null)
      setPermissions({})
      setPermissionsError(false)
      setLoading(false)
      return
    }

    setUser({
      email: myRow.email,
      fullName: myRow.full_name,
      phone: myRow.phone,
      status: myRow.status,
      roleId: myRow.role_id,
      roleName: myRow.roles?.role_name || '',
    })

    // התחברות מזוהה ותקינה — מנקים שגיאת שער קודמת אם נותרה מניסיון קודם.
    setAuthError(null)

    // 3) הרשאות נטענות רק למשתמש 'active'. משתמש שעבר "מחיקה רכה" (status='inactive')
    //    מקבל מפת הרשאות ריקה — כך גם אם מסך כלשהו יטעה ויציג אותו, אין לו מודול מותר.
    if (myRow.status === 'active') {
      const { map, failed } = await fetchPermissionMap(myRow.role_id)
      if (!mountedRef.current) return

      if (failed) {
        // ⚠️ **לא מאפסים את המפה.** זה לב התיקון: ברענון-טוקן באמצע סשן למשתמש כבר יש
        // מפה תקפה, ואיפוסה היה מוציא אותו מהמסך שהוא עובד בו בגלל תקלה בת-שנייה. הישנה
        // עדיין נכונה (הרשאות אינן משתנות תוך כדי), ואם היא שגויה — ה-RLS חוסם ממילא
        // (כלל 9: ה-UI נוחות, ה-DB החומה). בטעינה ראשונה המפה ריקה, ואז הדגל הוא מה
        // שגורם ל-ProtectedRoute לומר "לא הצלחנו לטעון" במקום "אין לך הרשאה".
        setPermissionsError(true)
      } else {
        setPermissions(map)
        setPermissionsError(false)
      }
    } else {
      // משתמש לא-active: מפה ריקה היא **אמת** ולא כשל, ולכן הדגל מכובה.
      setPermissions({})
      setPermissionsError(false)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    // ב-StrictMode (dev) האפקט רץ mount→unmount→mount. מאתחלים כאן ל-true כדי
    // שהמאונט השני "יחיה" מחדש אחרי שה-cleanup של הראשון כיבה את הדגל.
    mountedRef.current = true

    // הקריאה הבאה מדליקה setLoading(true) באופן סינכרוני, ולכן חוק set-state-in-effect
    // מסמן אותה. זו כוונה: bootstrap של מצב האימות בעליית האפליקציה הוא בדיוק ייעוד ה-effect
    // (סנכרון מול Supabase Auth). הדגל loading גם מונע ניתוב-שגוי ל-/login לפני שידוע מי המשתמש,
    // ולכן אסור לוותר עליו. משתיקים את החוק נקודתית ובמודע.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUser() // טעינה ראשונית בעליית האפליקציה

    // מאזינים לשינויי אימות (התחברות/התנתקות/רענון token) ומרעננים את "מי אני".
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    // ניקוי בפירוק: מבטלים את המנוי ומסמנים unmount — מונע גם דליפת מנוי וגם
    // עדכון state על רכיב מפורק אם loadUser עדיין "תלוי באוויר".
    return () => {
      mountedRef.current = false
      listener?.subscription?.unsubscribe()
    }
  }, [loadUser])

  // התנתקות: מנקה את ה-session ב-Supabase ומאפס מיידית את ה-state המקומי — לא
  // מסתמכים על תזמון ה-onAuthStateChange כדי שה-UI יגיב מיד. useCallback לעקביות.
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setPermissions({})
    setPermissionsError(false)
  }, [])

  // ניקוי ידני של authError — מסך ההתחברות קורא לזה כשהמשתמש מתחיל להקליד/מנסה מחדש,
  // כדי שהשגיאה מהניסיון הקודם לא תישאר תקועה על המסך.
  const clearAuthError = useCallback(() => setAuthError(null), [])

  return (
    <AuthContext.Provider
      value={{
        loading,
        user,
        permissions,
        permissionsError,
        authError,
        clearAuthError,
        reload: loadUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Guard Clause: אם useAuth נקרא מחוץ ל-<AuthProvider>, useContext יחזיר את ערך
// ברירת המחדל (null), וכל destructuring כמו `const { user } = useAuth()` יקרוס בזמן
// ריצה עם הודעה עמומה ("Cannot destructure property ... of null"). זריקת שגיאה
// מפורשת = כשל מהיר וברור למפתח במקום מסך לבן מסתורי.
//
// קובץ הקונטקסט מייצא בכוונה גם את ה-Provider וגם את הצרכן useAuth (דפוס מקובל לקונטקסט).
// חוק only-export-components נוגע רק לגרנולריות של Fast Refresh בפיתוח, לא לתקינות ריצה — משתיקים במודע.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error(
      'useAuth חייב להיקרא בתוך <AuthProvider>. ודא שהרכיב עטוף ב-<AuthProvider> בעץ הרכיבים (ראה App.jsx).',
    )
  }
  return ctx
}
