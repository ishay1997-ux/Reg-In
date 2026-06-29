// מסך התחברות - מודול 1 (auth)
// המסך הראשון של המערכת: המשתמש מזין מייל וסיסמה, ואנחנו בודקים מולם דרך Supabase

import { useState } from "react"
import { supabase } from "@/supabaseClient"

export default function LoginPage() {
  // משתני מצב: שומרים את מה שהמשתמש מקליד, והודעות שגיאה/טעינה
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [loading, setLoading] = useState(false)

  // הפונקציה שרצה כשלוחצים על כפתור ההתחברות
  async function handleLogin(e) {
    e.preventDefault() // מונע מהדף להתרענן
    setErrorMsg("")
    setLoading(true)

    // הפנייה ל-Supabase: "בדוק אם המייל והסיסמה האלה נכונים"
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    setLoading(false)

    if (error) {
      // אם הפרטים שגויים - מציגים הודעה ידידותית בעברית
      setErrorMsg("מייל או סיסמה שגויים. נסה שוב.")
    } else {
      // אם הצליח - בינתיים רק הודעה. בהמשך נעביר למסך הבית
      setErrorMsg("")
      alert("התחברת בהצלחה! 🎉")
    }
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-2xl font-bold text-center text-slate-800">
          כניסה למערכת REG-IN
        </h1>

        {/* שדה מייל */}
        <input
          type="email"
          placeholder="כתובת דוא״ל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border border-slate-300 rounded-lg p-3 text-right"
        />

        {/* שדה סיסמה */}
        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border border-slate-300 rounded-lg p-3 text-right"
        />

        {/* הודעת שגיאה - מופיעה רק אם יש */}
        {errorMsg && (
          <p className="text-red-600 text-sm text-center">{errorMsg}</p>
        )}

        {/* כפתור ההתחברות */}
        <button
          type="submit"
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg p-3 transition disabled:opacity-50"
        >
          {loading ? "מתחבר..." : "התחברות"}
        </button>
      </form>
    </div>
  )
}