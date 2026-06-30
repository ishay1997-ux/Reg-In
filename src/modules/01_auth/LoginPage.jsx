// מסך התחברות - מודול 1 (auth)
// כולל לוגו, ולידציה מקומית, ניקוי רווחים, ואיפוס שגיאות תוך כדי הקלדה

import { useState } from "react"
import { supabase } from "@/supabaseClient"

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

    setLoading(false)

    if (error) {
      setErrorMsg("מייל או סיסמה שגויים. נסה שוב.")
    } else {
      // TODO: אחרי בניית מסך הבית (מודול 7) - להעביר לשם במקום alert
      alert("התחברת בהצלחה! 🎉")
    }
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

        <input
          type="email"
          placeholder="כתובת דוא״ל"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setErrorMsg("")
          }}
          className="border border-slate-300 rounded-lg p-3 text-right"
        />

        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setErrorMsg("")
          }}
          className="border border-slate-300 rounded-lg p-3 text-right"
        />

        {errorMsg && <p className="text-red-600 text-sm text-center">{errorMsg}</p>}
        {infoMsg && <p className="text-green-600 text-sm text-center">{infoMsg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg p-3 transition disabled:opacity-50"
        >
          {loading ? "מתחבר..." : "התחברות"}
        </button>

        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-teal-600 hover:underline text-sm text-center"
        >
          שכחת סיסמה?
        </button>
      </form>
    </div>
  )
}