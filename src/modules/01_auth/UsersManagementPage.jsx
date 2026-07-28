// מסך ניהול משתמשים - טאב ראשון בתוך "ניהול מערכת" (SystemManagementPage); בפועל מנכ"ל בלבד.
// ה-Route כבר מוגן ב-ProtectedRoute allow={SYSTEM_MODULES} (App.jsx - permission-driven, לא role
// קשיח) ו-RLS אוכף גם ברמת ה-DB, לכן אין כאן בדיקת session/role עצמאית כפולה - רק טעינת הדאטה
// בפועל דרך useAuth().
// טבלת עובדים, הוספת משתמש חדש, ומצב פעיל/לא-פעיל דו-כיווני (status='active'/'inactive').
// ⚠️ בכוונה אין כאן שום מסגור של "מחיקה": אין טקסט/אייקון "מחק", ואין הסתרה חד-כיוונית -
// שורות inactive מוצגות בטבלה עם תג סטטוס, וניתן להחזיר אותן ל-active מאותו כפתור בדיוק.
// אותה מוסכמה (status דו-כיווני, לא "מחיקה") חלה גם על מסכי לקוחות (מודול 2) ודיילות
// (מודול 4) כשייבנו - ראו docs/CHANGELOG.md, סעיף "חובות עתידיים".
// ⚠️ OPEN חלקי (PROJECT_MASTER §7 פריט 2): phone נוסף לסכמה (02/07/2026) ונכלל כאן.
// username עדיין לא בסכמה - נשאר בחוץ עד להכרעה משותפת עם ישי.

import { useEffect, useState } from 'react'
import { Pencil, UserCheck, UserX } from 'lucide-react'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirm } from '@/components/ConfirmDialog'
import { useToast } from '@/components/ToastProvider'
import LoadingOrError from '@/components/LoadingOrError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EMAIL_REGEX, ISRAELI_MOBILE_REGEX } from '@/lib/validators'
import { cn } from '@/lib/utils'

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth()
  const confirm = useConfirm() // חלון-וידוא משותף (במקום window.confirm) — לפני השבתת משתמש
  const toast = useToast() // התראה אחידה (במקום window.alert) — כשל השבתה/הפעלה

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null) // null = מצב הוספה; אחרת = עריכת השורה הזו
  const [formEmail, setFormEmail] = useState('')
  const [formFullName, setFormFullName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formRoleId, setFormRoleId] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUsersAndRoles()
  }, [])

  async function loadUsersAndRoles() {
    setLoading(true)
    setLoadError('')

    const [{ data: usersData, error: usersError }, { data: rolesData }] = await Promise.all([
      supabase
        .from('users')
        .select('email, full_name, phone, status, role_id, roles(role_name)')
        .order('full_name'),
      supabase.from('roles').select('role_id, role_name').order('role_id'),
    ])

    if (usersError) {
      setLoadError('שגיאה בטעינת רשימת המשתמשים.')
      setLoading(false)
      return
    }

    setUsers(usersData || [])
    setRoles(rolesData || [])
    setLoading(false)
  }

  function resetForm() {
    setEditingUser(null)
    setFormEmail('')
    setFormFullName('')
    setFormPhone('')
    setFormRoleId('')
    setFormError('')
  }

  function openAddDialog() {
    resetForm()
    setDialogOpen(true)
  }

  function openEditDialog(targetUser) {
    setEditingUser(targetUser)
    setFormEmail(targetUser.email)
    setFormFullName(targetUser.full_name)
    setFormPhone(targetUser.phone || '')
    setFormRoleId(String(targetUser.role_id))
    setFormError('')
    setDialogOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const cleanFullName = formFullName.trim()
    const cleanPhone = formPhone.trim()

    if (cleanFullName.length < 2) {
      setFormError('שם מלא חייב להכיל לפחות 2 תווים.')
      return
    }
    if (cleanPhone && !ISRAELI_MOBILE_REGEX.test(cleanPhone)) {
      setFormError('מספר טלפון נייד לא תקין (לדוגמה: 050-1234567).')
      return
    }
    if (!formRoleId) {
      setFormError('יש לבחור תפקיד.')
      return
    }

    setSaving(true)

    if (editingUser) {
      // עריכה: דוא"ל לא ניתן לשינוי כאן (מפתח זיהוי RLS+FK) - רק שם/טלפון/תפקיד.
      const { data: updated, error } = await supabase
        .from('users')
        .update({
          full_name: cleanFullName,
          phone: cleanPhone || null,
          role_id: Number(formRoleId),
        })
        .eq('email', editingUser.email)
        .select()

      setSaving(false)

      if (error || !updated || updated.length === 0) {
        setFormError('שמירת השינויים נכשלה. נסה שוב.')
        return
      }
    } else {
      const cleanEmail = formEmail.trim()
      if (!EMAIL_REGEX.test(cleanEmail)) {
        setSaving(false)
        setFormError('יש להזין כתובת דוא"ל תקינה.')
        return
      }

      const { error } = await supabase.from('users').insert({
        email: cleanEmail,
        full_name: cleanFullName,
        phone: cleanPhone || null,
        role_id: Number(formRoleId),
        status: 'active',
      })

      setSaving(false)

      if (error) {
        if (error.code === '23505') {
          setFormError('כבר קיים משתמש עם כתובת הדוא"ל הזו.')
        } else {
          setFormError('שמירה נכשלה. נסה שוב.')
        }
        return
      }
    }

    setDialogOpen(false)
    resetForm()
    loadUsersAndRoles()
  }

  async function handleToggleStatus(targetUser) {
    const nextStatus = targetUser.status === 'active' ? 'inactive' : 'active'

    // אישור רק לפני השבתה (חוסמת התחברות בפועל) - הפעלה מחדש היא פעולה הפיכה/בטוחה
    // באותה מידה, לכן בלי חיכוך מיותר. שני הכיוונים משתמשים באותו כפתור/פעולה.
    if (nextStatus === 'inactive') {
      const confirmed = await confirm({
        title: 'השבתת משתמש',
        message: `להשבית את המשתמש "${targetUser.full_name}"? הוא לא יוכל להתחבר למערכת עד שיוחזר לפעיל.`,
        confirmLabel: 'השבת משתמש',
      })
      if (!confirmed) return
    }

    // .select() כדי לזהות חסימת RLS שקטה (0 שורות) ולא להיכשל בשקט.
    const { data: updated, error } = await supabase
      .from('users')
      .update({ status: nextStatus })
      .eq('email', targetUser.email)
      .select()

    if (error || !updated || updated.length === 0) {
      toast.error(
        nextStatus === 'inactive' ? 'השבתת המשתמש נכשלה. נסה שוב.' : 'הפעלת המשתמש נכשלה. נסה שוב.',
      )
      return
    }

    loadUsersAndRoles()
  }

  if (loading) {
    return <LoadingOrError loading />
  }

  if (loadError) {
    return (
      <LoadingOrError
        error={loadError}
        onRetry={loadUsersAndRoles}
        retryTestId="users-load-retry"
      />
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800">רשימת עובדים</h2>

        <Button
          onClick={openAddDialog}
          className="h-auto py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
        >
          + הוספת משתמש חדש
        </Button>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'עריכת משתמש' : 'הוספת משתמש חדש'}</DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'עדכון שם, טלפון ותפקיד. לשינוי כתובת דוא"ל יש ליצור משתמש חדש.'
                  : 'המשתמש יתווסף לטבלת המשתמשים במערכת.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-700">דוא"ל</label>
                <Input
                  type="email"
                  value={formEmail}
                  disabled={!!editingUser}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@regin.co.il"
                  className="h-auto p-3 text-right rounded-lg border-slate-300 disabled:opacity-60"
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
                <Select
                  value={formRoleId}
                  onValueChange={setFormRoleId}
                  disabled={editingUser?.email === currentUser?.email}
                >
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
                {/* מניעת self-lockout: מנכ"ל שעורך את עצמו לא יכול לשנות את התפקיד של עצמו -
                    אותו עיקרון בדיוק כמו נעילת עמודת המנכ"ל במטריצה ומניעת מחיקה עצמית. */}
                {editingUser?.email === currentUser?.email && (
                  <p className="text-xs text-slate-400">לא ניתן לשנות תפקיד לחשבון שלך.</p>
                )}
              </div>

              {formError && <p className="text-red-600 text-sm">{formError}</p>}

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-auto p-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? 'שומר...' : editingUser ? 'שמור שינויים' : 'הוסף משתמש'}
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
            const isActive = targetUser.status === 'active'
            return (
              <tr
                key={targetUser.email}
                className={cn('border-b border-slate-100', !isActive && 'opacity-60')}
              >
                <td className="py-3">{targetUser.full_name}</td>
                <td className="py-3 text-slate-600">{targetUser.email}</td>
                <td className="py-3 text-slate-600">{targetUser.phone || '—'}</td>
                <td className="py-3">{targetUser.roles?.role_name}</td>
                <td className="py-3">
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600',
                    )}
                  >
                    {isActive ? 'פעיל' : 'לא פעיל'}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="link"
                      title="ערוך משתמש"
                      onClick={() => openEditDialog(targetUser)}
                      className="h-auto p-0 text-teal-600 hover:text-teal-700"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {isActive ? (
                      <Button
                        type="button"
                        variant="link"
                        disabled={isSelf}
                        title={isSelf ? 'לא ניתן להשבית את החשבון שלך' : 'השבת משתמש'}
                        onClick={() => handleToggleStatus(targetUser)}
                        className="h-auto p-0 text-red-600 hover:text-red-700"
                      >
                        <UserX className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="link"
                        title="הפעל משתמש מחדש"
                        onClick={() => handleToggleStatus(targetUser)}
                        className="h-auto p-0 text-teal-600 hover:text-teal-700"
                      >
                        <UserCheck className="size-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
