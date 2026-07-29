// מסך התחברות - מודול 1 (auth)
// כולל לוגו, ולידציה מקומית, ניקוי רווחים, איפוס שגיאות תוך כדי הקלדה, ובדיקת סטטוס/הרשאה לאחר התחברות

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import reginLogo from '@/assets/reg-in-logo.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const navigate = useNavigate()
  // authError מגיע מ-AuthContext ומכסה בעיקר את זרימת Google OAuth (חשבון לא-מורשה שנותק
  // בעת החזרה ל-app). מציגים אותו יחד עם errorMsg המקומי של זרימת הסיסמה.
  const { authError, clearAuthError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setErrorMsg('')
    setInfoMsg('')
    clearAuthError()

    const cleanEmail = email.trim()

    if (!cleanEmail) {
      setErrorMsg('יש להזין כתובת דוא״ל.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('הסיסמה חייבת להכיל לפחות 6 תווים.')
      return
    }

    setLoading(true)

    // 1) בדיקת נעילת חשבון לפני פנייה ל-Auth: אחרי 5 כשלונות רצופים החשבון ננעל ל-15 דקות.
    //    ה-RPC מאובטח (SECURITY DEFINER). אם הפונקציה עדיין לא הותקנה ב-DB היא נכשלת בשקט
    //    (data=null) והכניסה ממשיכה כרגיל — הנעילה לעולם לא חוסמת התחברות תקינה.
    const { data: lockedUntil } = await supabase.rpc('check_login_lock', { p_email: cleanEmail })
    if (lockedUntil) {
      setErrorMsg('החשבון ננעל זמנית עקב ריבוי ניסיונות כושלים. נסה שוב מאוחר יותר.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    })

    if (error) {
      // רישום ניסיון כושל. אם חצינו את הסף (5), ה-RPC מחזיר את מועד שחרור הנעילה (≠ null).
      const { data: nowLockedUntil } = await supabase.rpc('register_failed_login', {
        p_email: cleanEmail,
      })
      setErrorMsg(
        nowLockedUntil
          ? 'החשבון ננעל עקב 5 ניסיונות כושלים. נסה שוב בעוד כ-15 דקות.'
          : 'מייל או סיסמה שגויים. נסה שוב.',
      )
      setLoading(false)
      return
    }

    // סיסמה נכונה — מאפסים את מונה הכשלונות (RPC ל-authenticated בלבד; מאפס את שורת auth.email()).
    await supabase.rpc('reset_login_attempts')

    // גם אם ההזדהות מול Supabase Auth הצליחה, בודקים שוב את השורה ב-users: ייתכן משתמש
    // Auth תקין שאין לו שורת users (לא מורשה) או שהושבת (status='inactive'). בשני המקרים
    // מתנתקים מיד (signOut) כדי לא להשאיר session פעיל למי שאסור לו להיכנס.
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('status, role_id')
      .eq('email', cleanEmail)
      .single()

    if (dbError || !userData) {
      setErrorMsg('משתמש זה אינו מורשה במערכת. פנה למנהל.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (userData.status === 'inactive') {
      setErrorMsg('חשבון זה אינו פעיל במערכת. פנה למנכ"ל לצורך בירור.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    setLoading(false)
    navigate('/')
  }

  async function handleGoogleLogin() {
    setErrorMsg('')
    setInfoMsg('')
    clearAuthError()
    // זרימת OAuth: הפניה לגוגל וחזרה לשורש האפליקציה. שער ההרשאה (שורת users פעילה) נאכף
    // מרכזית ב-AuthContext בעת החזרה — חשבון גוגל שאינו במערכת ינותק ויוצג authError.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      setErrorMsg('ההתחברות עם Google נכשלה. נסה שוב.')
    }
  }

  async function handleForgotPassword() {
    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setErrorMsg('הזן קודם את כתובת הדוא״ל שלך בשדה למעלה.')
      return
    }
    setErrorMsg('')
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail)
    if (error) {
      setErrorMsg('לא הצלחנו לשלוח מייל איפוס. בדוק את הכתובת.')
    } else {
      setInfoMsg('נשלח אליך מייל לאיפוס הסיסמה. בדוק את תיבת הדוא״ל.')
    }
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-50">
      {/* noValidate - מבטל את הולידציה של הדפדפן כדי שהקוד שלנו ירוץ תמיד */}
      <form
        onSubmit={handleLogin}
        noValidate
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm flex flex-col gap-4"
      >
        <img src={reginLogo} alt="REG-IN" className="h-12 mx-auto mb-2" />

        <h1 className="text-xl font-bold text-center text-slate-800">כניסה למערכת</h1>

        <Input
          type="email"
          placeholder="כתובת דוא״ל"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setErrorMsg('')
            clearAuthError()
          }}
          className="h-auto p-3 text-right rounded-lg border-slate-300"
        />

        <Input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setErrorMsg('')
            clearAuthError()
          }}
          className="h-auto p-3 text-right rounded-lg border-slate-300"
        />

        {(errorMsg || authError) && (
          <p className="text-red-600 text-sm text-center">{errorMsg || authError}</p>
        )}
        {infoMsg && <p className="text-green-600 text-sm text-center">{infoMsg}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-auto p-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
        >
          {loading ? 'מתחבר...' : 'התחברות'}
        </Button>

        {/* מפריד "או" בין כניסת סיסמה לכניסת Google */}
        <div className="flex items-center gap-2 my-1">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">או</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          className="w-full h-auto p-3 rounded-lg border-slate-300 flex items-center justify-center gap-2 font-medium text-slate-700"
        >
          <svg className="size-5 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#FFC107"
              d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
              fill="#FF3D00"
              d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
          </svg>
          התחברות עם Google
        </Button>

        <Button
          type="button"
          variant="link"
          onClick={handleForgotPassword}
          className="h-auto p-0 text-teal-600 text-sm"
        >
          שכחת סיסמה?
        </Button>
      </form>
    </div>
  )
}
