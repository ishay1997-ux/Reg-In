// מסך התחברות - מודול 1 (auth)
// כולל לוגו, ולידציה מקומית, ניקוי רווחים, איפוס שגיאות תוך כדי הקלדה, ובדיקת סטטוס/הרשאה לאחר התחברות

import { useState } from "react"
import { supabase } from "@/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [infoMsg, setInfoMsg] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setErrorMsg("")
    setInfoMsg("")

    const cleanEmail = email.trim()

    if (!cleanEmail) {
      setErrorMsg("יש להזין כתובת דוא״ל.")
      return
    }
    if (password.length < 6) {
      setErrorMsg("הסיסמה חייבת להכיל לפחות 6 תווים.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    })

    if (error) {
      setErrorMsg("מייל או סיסמה שגויים. נסה שוב.")
      setLoading(false)
      return
    }

    const { data: userData, error: dbError } = await supabase
      .from("users")
      .select("status, role_id")
      .eq("email", cleanEmail)
      .single()

    if (dbError || !userData) {
      setErrorMsg("משתמש זה אינו מורשה במערכת. פנה למנהל.")
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (userData.status === "frozen") {
      setErrorMsg('חשבונך הוקפא זמנית. פנה למנכ"ל לצורך בירור.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    // TODO: אחרי בניית מסך הבית (מודול 7) - להעביר לשם במקום alert
    alert("התחברת בהצלחה! 🎉")
    setLoading(false)
  }

  async function handleForgotPassword() {
    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setErrorMsg("הזן קודם את כתובת הדוא״ל שלך בשדה למעלה.")
      return
    }
    setErrorMsg("")
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail)
    if (error) {
      setErrorMsg("לא הצלחנו לשלוח מייל איפוס. בדוק את הכתובת.")
    } else {
      setInfoMsg("נשלח אליך מייל לאיפוס הסיסמה. בדוק את תיבת הדוא״ל.")
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
        <img src="/regin-logo.png" alt="REG-IN" className="h-12 mx-auto mb-2" />

        <h1 className="text-xl font-bold text-center text-slate-800">
          כניסה למערכת
        </h1>

        <Input
          type="email"
          placeholder="כתובת דוא״ל"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setErrorMsg("")
          }}
          className="h-auto p-3 text-right rounded-lg border-slate-300"
        />

        <Input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setErrorMsg("")
          }}
          className="h-auto p-3 text-right rounded-lg border-slate-300"
        />

        {errorMsg && <p className="text-red-600 text-sm text-center">{errorMsg}</p>}
        {infoMsg && <p className="text-green-600 text-sm text-center">{infoMsg}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-auto p-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
        >
          {loading ? "מתחבר..." : "התחברות"}
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