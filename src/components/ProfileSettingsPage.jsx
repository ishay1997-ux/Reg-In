// הגדרות פרופיל אישי - נגיש לכל משתמש מחובר בלי קשר לתפקיד/הרשאות (לכן לא בסרגל הצד,
// אלא רק דרך תפריט המשתמש ב-Topbar, ולא עטוף ב-ProtectedRoute - MainLayout כבר חוסם
// לא-מחוברים ומוקפאים, וזו רמת ההגנה הנדרשת כאן).
// טאבים מקומיים (state, לא Routes) - עמוד שטוח אחד, אין הבדל הרשאות בין הטאבים.

import { useState } from "react"
import { supabase } from "@/supabaseClient"
import { useAuth } from "@/contexts/AuthContext"
import { ISRAELI_MOBILE_REGEX, MIN_PASSWORD_LENGTH } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

const TABS = [
  { key: "details", label: "פרטים אישיים" },
  { key: "security", label: "אבטחה" },
  { key: "notifications", label: "העדפות והתראות" },
]

export default function ProfileSettingsPage() {
  const { user, reload } = useAuth()
  const [activeTab, setActiveTab] = useState("details")

  return (
    <div dir="rtl">
      <h1 className="text-xl font-bold text-slate-800 mb-4">הגדרות פרופיל</h1>

      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.key
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 max-w-xl">
        {activeTab === "details" && <PersonalDetailsSection user={user} reload={reload} />}
        {activeTab === "security" && <SecuritySection user={user} />}
        {activeTab === "notifications" && <NotificationsSection />}
      </div>
    </div>
  )
}

function PersonalDetailsSection({ user, reload }) {
  const [phone, setPhone] = useState(user?.phone || "")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setError("")
    setSuccess("")

    const cleanPhone = phone.trim()
    if (cleanPhone && !ISRAELI_MOBILE_REGEX.test(cleanPhone)) {
      setError("מספר טלפון נייד לא תקין (לדוגמה: 050-1234567).")
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase
      .from("users")
      .update({ phone: cleanPhone || null })
      .eq("email", user.email)
    setSaving(false)

    if (updateError) {
      setError("שמירה נכשלה. נסה שוב.")
      return
    }

    setSuccess("הטלפון עודכן בהצלחה.")
    await reload()
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-slate-500">שם מלא</p>
        <p className="text-slate-800 font-medium">{user?.fullName}</p>
      </div>

      <div>
        <p className="text-sm text-slate-500">תפקיד</p>
        <p className="text-slate-800 font-medium">{user?.roleName}</p>
      </div>

      <div>
        <p className="text-sm text-slate-500">דוא"ל</p>
        <p className="text-slate-800 font-medium">{user?.email}</p>
        {/* שינוי אימייל עצמאי לא נתמך כרגע - ראו CLAUDE_CODE_LOG.md (email = מפתח זיהוי RLS+FK) */}
        <p className="text-xs text-slate-400 mt-0.5">
          לא ניתן לעריכה עצמית כרגע. לשינוי כתובת הדוא"ל פנה למנכ"ל.
        </p>
      </div>

      <form onSubmit={handleSave} noValidate className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
        <label className="text-sm text-slate-700">טלפון</label>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="050-1234567"
          className="h-auto p-3 text-right rounded-lg border-slate-300 max-w-xs"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <Button
          type="submit"
          disabled={saving}
          className="w-fit h-auto py-2 px-4 mt-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50"
        >
          {saving ? "שומר..." : "שמור שינויים"}
        </Button>
      </form>
    </div>
  )
}

function SecuritySection({ user }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`הסיסמה החדשה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError("הסיסמה החדשה ואימות הסיסמה אינם תואמים.")
      return
    }

    setSaving(true)

    // מאמת מחדש את הסיסמה הנוכחית לפני שינוי בפועל - לא מסתמך רק על session פעיל קיים.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (reauthError) {
      setSaving(false)
      setError("הסיסמה הנוכחית שגויה.")
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)

    if (updateError) {
      setError("עדכון הסיסמה נכשל. נסה שוב.")
      return
    }

    setSuccess("הסיסמה עודכנה בהצלחה.")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 max-w-xs">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-slate-700">סיסמה נוכחית</label>
        <Input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="h-auto p-3 text-right rounded-lg border-slate-300"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-slate-700">סיסמה חדשה</label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="h-auto p-3 text-right rounded-lg border-slate-300"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-slate-700">אימות סיסמה חדשה</label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="h-auto p-3 text-right rounded-lg border-slate-300"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      <Button
        type="submit"
        disabled={saving}
        className="w-fit h-auto py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50"
      >
        {saving ? "מעדכן..." : "עדכון סיסמה"}
      </Button>
    </form>
  )
}

// UI מקומי בלבד בשלב זה, לא מחובר ל-DB (אין עדיין טבלת העדפות) - ראו TODO ב-CLAUDE_CODE_LOG.md.
// מנוטרל בכוונה (disabled) עד שהתכונה תפותח בפועל, כדי לא ליצור רושם מטעה שההעדפות האלו כבר פעילות.
function NotificationsSection() {
  const [emailNewProjects, setEmailNewProjects] = useState(true)
  const [smsLastMinuteChanges, setSmsLastMinuteChanges] = useState(true)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-800">
            התראות מייל על פרויקטים חדשים <span className="text-xs text-slate-400">(בקרוב)</span>
          </p>
          <p className="text-xs text-slate-500">קבלת הודעת דוא"ל בכל פעם שנפתח פרויקט חדש שרלוונטי אליך.</p>
        </div>
        <Switch checked={emailNewProjects} onCheckedChange={setEmailNewProjects} disabled />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-800">
            התראות SMS על שינויי שיבוץ ברגע האחרון <span className="text-xs text-slate-400">(בקרוב)</span>
          </p>
          <p className="text-xs text-slate-500">קבלת מסרון כשיש שינוי דחוף בשיבוץ שלך קרוב לתאריך האירוע.</p>
        </div>
        <Switch checked={smsLastMinuteChanges} onCheckedChange={setSmsLastMinuteChanges} disabled />
      </div>
    </div>
  )
}
