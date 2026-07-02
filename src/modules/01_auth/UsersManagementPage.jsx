// מסך ניהול משתמשים - טאב ראשון בתוך "ניהול מערכת" (SystemManagementPage), נגיש למנכ"ל בלבד.
// ה-Route כבר מוגן ב-ProtectedRoute allow={CEO_ROLE_NAME} (App.jsx) ו-RLS אוכף גם ברמת ה-DB,
// לכן אין כאן יותר בדיקת session/role עצמאית כפולה - רק טעינת הדאטה בפועל דרך useAuth().
// טבלת עובדים, הוספת משתמש חדש, הקפאה/שחזור.
// ⚠️ OPEN חלקי (PROJECT_MASTER §7 פריט 2): phone נוסף לסכמה (02/07/2026) ונכלל כאן.
// username עדיין לא בסכמה - נשאר בחוץ עד להכרעה משותפת עם ישי.

import { useEffect, useState } from "react"
import { supabase } from "@/supabaseClient"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ISRAELI_MOBILE_REGEX = /^0(5[0-9])-?\d{7}$/

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formEmail, setFormEmail] = useState("")
  const [formFullName, setFormFullName] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formRoleId, setFormRoleId] = useState("")
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUsersAndRoles()
  }, [])

  async function loadUsersAndRoles() {
    setLoading(true)
    setLoadError("")

    const [{ data: usersData, error: usersError }, { data: rolesData }] = await Promise.all([
      supabase
        .from("users")
        .select("email, full_name, phone, status, role_id, roles(role_name)")
        .order("full_name"),
      supabase.from("roles").select("role_id, role_name").order("role_id"),
    ])

    if (usersError) {
      setLoadError("שגיאה בטעינת רשימת המשתמשים.")
      setLoading(false)
      return
    }

    setUsers(usersData || [])
    setRoles(rolesData || [])
    setLoading(false)
  }

  function resetForm() {
    setFormEmail("")
    setFormFullName("")
    setFormPhone("")
    setFormRoleId("")
    setFormError("")
  }

  async function handleAddUser(e) {
    e.preventDefault()
    setFormError("")

    const cleanEmail = formEmail.trim()
    const cleanFullName = formFullName.trim()
    const cleanPhone = formPhone.trim()

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setFormError('יש להזין כתובת דוא"ל תקינה.')
      return
    }
    if (cleanFullName.length < 2) {
      setFormError("שם מלא חייב להכיל לפחות 2 תווים.")
      return
    }
    if (cleanPhone && !ISRAELI_MOBILE_REGEX.test(cleanPhone)) {
      setFormError("מספר טלפון נייד לא תקין (לדוגמה: 050-1234567).")
      return
    }
    if (!formRoleId) {
      setFormError("יש לבחור תפקיד.")
      return
    }

    setSaving(true)

    const { error } = await supabase.from("users").insert({
      email: cleanEmail,
      full_name: cleanFullName,
      phone: cleanPhone || null,
      role_id: Number(formRoleId),
      status: "active",
    })

    setSaving(false)

    if (error) {
      if (error.code === "23505") {
        setFormError("כבר קיים משתמש עם כתובת הדוא\"ל הזו.")
      } else {
        setFormError("שמירה נכשלה. נסה שוב.")
      }
      return
    }

    setDialogOpen(false)
    resetForm()
    loadUsersAndRoles()
  }

  async function handleToggleStatus(targetUser) {
    const nextStatus = targetUser.status === "active" ? "frozen" : "active"
    const { error } = await supabase
      .from("users")
      .update({ status: nextStatus })
      .eq("email", targetUser.email)

    if (!error) {
      loadUsersAndRoles()
    }
  }

  if (loading) {
    return <p className="text-slate-500">טוען...</p>
  }

  if (loadError) {
    return <p className="text-red-600 font-semibold">{loadError}</p>
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800">רשימת עובדים</h2>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button className="h-auto py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold">
              + הוספת משתמש חדש
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>הוספת משתמש חדש</DialogTitle>
              <DialogDescription>המשתמש יתווסף לטבלת המשתמשים במערכת.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddUser} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-700">דוא"ל</label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@regin.co.il"
                  className="h-auto p-3 text-right rounded-lg border-slate-300"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-700">שם מלא</label>
                <Input
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="שם פרטי ומשפחה"
                  className="h-auto p-3 text-right rounded-lg border-slate-300"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-700">טלפון (לא חובה)</label>
                <Input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="050-1234567"
                  className="h-auto p-3 text-right rounded-lg border-slate-300"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-700">תפקיד</label>
                <Select value={formRoleId} onValueChange={setFormRoleId}>
                  <SelectTrigger className="w-full h-auto p-3 rounded-lg border-slate-300">
                    <SelectValue placeholder="בחר תפקיד" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {roles.map((role) => (
                      <SelectItem key={role.role_id} value={String(role.role_id)}>
                        {role.role_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formError && <p className="text-red-600 text-sm">{formError}</p>}

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-auto p-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? "שומר..." : "הוסף משתמש"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-sm text-slate-500">
            <th className="py-2 font-medium">שם מלא</th>
            <th className="py-2 font-medium">דוא"ל</th>
            <th className="py-2 font-medium">טלפון</th>
            <th className="py-2 font-medium">תפקיד</th>
            <th className="py-2 font-medium">סטטוס</th>
            <th className="py-2 font-medium">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {users.map((targetUser) => {
            const isSelf = targetUser.email === currentUser?.email
            return (
              <tr key={targetUser.email} className="border-b border-slate-100">
                <td className="py-3">{targetUser.full_name}</td>
                <td className="py-3 text-slate-600">{targetUser.email}</td>
                <td className="py-3 text-slate-600">{targetUser.phone || "—"}</td>
                <td className="py-3">{targetUser.roles?.role_name}</td>
                <td className="py-3">
                  <span
                    className={
                      "px-2 py-1 rounded-full text-xs font-medium " +
                      (targetUser.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-200 text-slate-600")
                    }
                  >
                    {targetUser.status === "active" ? "פעיל" : "מוקפא"}
                  </span>
                </td>
                <td className="py-3">
                  <Button
                    type="button"
                    variant="link"
                    disabled={isSelf}
                    title={isSelf ? "לא ניתן להקפיא את החשבון שלך" : undefined}
                    onClick={() => handleToggleStatus(targetUser)}
                    className="h-auto p-0 text-sm text-teal-600"
                  >
                    {targetUser.status === "active" ? "הקפא" : "שחזר"}
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
