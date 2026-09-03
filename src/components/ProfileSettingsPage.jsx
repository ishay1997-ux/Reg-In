// הגדרות פרופיל אישי - נגיש לכל משתמש מחובר בלי קשר לתפקיד/הרשאות (לכן לא בסרגל הצד,
// אלא רק דרך תפריט המשתמש ב-Topbar, ולא עטוף ב-ProtectedRoute - MainLayout כבר חוסם
// לא-מחוברים ומוקפאים, וזו רמת ההגנה הנדרשת כאן).
// טאבים מקומיים (state, לא Routes) - עמוד שטוח אחד, אין הבדל הרשאות בין הטאבים.

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastProvider'
import LoadingOrError from '@/components/LoadingOrError'
import { getNotificationPreferences, saveNotificationPreferences } from '@/modules/09_settings/api'
import { CEO_ROLE_NAME } from '@/lib/constants'
import { ISRAELI_MOBILE_REGEX, MIN_PASSWORD_LENGTH } from '@/lib/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'details', label: 'פרטים אישיים' },
  { key: 'security', label: 'אבטחה' },
  { key: 'notifications', label: 'העדפות והתראות' },
]

export default function ProfileSettingsPage() {
  const { user, reload } = useAuth()
  const [activeTab, setActiveTab] = useState('details')

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
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 max-w-xl">
        {activeTab === 'details' && <PersonalDetailsSection user={user} reload={reload} />}
        {activeTab === 'security' && <SecuritySection user={user} />}
        {activeTab === 'notifications' && <NotificationsSection />}
      </div>
    </div>
  )
}

function PersonalDetailsSection({ user, reload }) {
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const cleanFullName = fullName.trim()
    const cleanPhone = phone.trim()

    if (cleanFullName.length < 2) {
      setError('שם מלא חייב להכיל לפחות 2 תווים.')
      return
    }
    if (cleanPhone && !ISRAELI_MOBILE_REGEX.test(cleanPhone)) {
      setError('מספר טלפון נייד לא תקין (לדוגמה: 050-1234567).')
      return
    }

    setSaving(true)
    // מותר ב-RLS (מדיניות users_update_self מקפיאה רק role_id/status, לא full_name/phone).
    // .select() מחזיר את השורות שבאמת עודכנו — אם RLS חסם בשקט (0 שורות), לא נציג
    // הצלחה כוזבת. (זו בדיוק התקלה שהמדיניות users_update_self נועדה לתקן.)
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ full_name: cleanFullName, phone: cleanPhone || null })
      .eq('email', user.email)
      .select()
    setSaving(false)

    if (updateError || !updated || updated.length === 0) {
      setError('שמירה נכשלה. נסה שוב.')
      return
    }

    setSuccess('הפרטים עודכנו בהצלחה.')
    await reload()
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-slate-500">תפקיד</p>
        <p className="text-slate-800 font-medium">{user?.roleName}</p>
        {/* תפקיד לא ניתן לעריכה עצמית בכוונה - חסום גם ב-RLS (users_update_self מקפיא role_id).
            שינוי תפקיד נעשה רק ע"י המנכ"ל דרך מסך ניהול משתמשים. הרמז מוסתר למנכ"ל עצמו -
            אין לו את מי לפנות אליו, וההודעה נשמעה מוזרה כשהמנכ"ל צופה בפרופיל של עצמו. */}
        {user?.roleName !== CEO_ROLE_NAME && (
          <p className="text-xs text-slate-400 mt-0.5">לשינוי תפקיד פנה למנכ"ל.</p>
        )}
      </div>

      <div>
        <p className="text-sm text-slate-500">דוא"ל</p>
        <p className="text-slate-800 font-medium">{user?.email}</p>
        {/* שינוי אימייל עצמאי לא נתמך כרגע - ראו CLAUDE_CODE_LOG.md (email = מפתח זיהוי RLS+FK) */}
      </div>

      <form
        onSubmit={handleSave}
        noValidate
        className="flex flex-col gap-4 pt-2 border-t border-slate-100"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-slate-700">שם מלא</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="שם פרטי ומשפחה"
            className="h-auto p-3 text-right rounded-lg border-slate-300 max-w-xs"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-slate-700">טלפון</label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="050-1234567"
            className="h-auto p-3 text-right rounded-lg border-slate-300 max-w-xs"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <Button
          type="submit"
          disabled={saving}
          className="w-fit h-auto py-2 px-4 mt-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50"
        >
          {saving ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </form>
    </div>
  )
}

function SecuritySection({ user }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`הסיסמה החדשה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('הסיסמה החדשה ואימות הסיסמה אינם תואמים.')
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
      setError('הסיסמה הנוכחית שגויה.')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)

    if (updateError) {
      setError('עדכון הסיסמה נכשל. נסה שוב.')
      return
    }

    setSuccess('הסיסמה עודכנה בהצלחה.')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
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
        {saving ? 'מעדכן...' : 'עדכון סיסמה'}
      </Button>
    </form>
  )
}

// מתג המייל חי מאז מודול 9 (טבלת notification_preferences, מיגרציה B, 02/09/2026) — נטען
// ונשמר דרך src/modules/09_settings/api.js, בדיוק כמו כל שאר הכתיבה על הטבלה הזו (כלל ברזל 14).
// שמירה נכשלת משחזרת את המתג למצבו הקודם ומציגה שגיאה, כדי שהוא לא יישאר "דלוק" כוזב מול
// שורה שלא נכתבה (הכשל השקט המרכזי, src/CLAUDE.md). מתג ה-SMS נשאר disabled **לצמיתות**,
// לא "עד שהתכונה תפותח" — אין כרגע ערוץ SMS במערכת (R-4), ולכן הוא תמיד כבוי ותמיד נשלח
// כ-false בשמירה. שליחת המייל בפועל (מנוע-ההתראות) היא עדיין מודול 10 — טקסט-העזר אומר זאת
// במפורש כדי שלא ייווצר רושם שהמייל כבר יוצא.
function NotificationsSection() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [emailNewProjects, setEmailNewProjects] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)

  // ניסיון-חוזר אחרי כשל-טעינה - מדליק loading דרך handler (לחיצה על "נסה שוב"), לא בגוף
  // ה-effect עצמו (react-hooks/set-state-in-effect; אותו דפוס כמו LogisticsPage.jsx).
  const retry = useCallback(() => {
    setLoading(true)
    setError('')
    setReloadTick((tick) => tick + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const prefs = await getNotificationPreferences()
        if (cancelled) return
        setEmailNewProjects(prefs.emailNewProjects)
      } catch (err) {
        if (!cancelled) setError(err.message || 'לא ניתן לטעון את ההגדרות.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadTick])

  async function handleEmailToggle(nextChecked) {
    const previous = emailNewProjects
    setEmailNewProjects(nextChecked) // אופטימי - התגובה למגע במתג חייבת להיות מיידית
    setSaving(true)
    try {
      // מתג ה-SMS תמיד false (disabled, אין ערוץ) - נשלח מפורשות ולא נגזר מה-state הקודם.
      await saveNotificationPreferences({ emailNewProjects: nextChecked, smsLastMinute: false })
      toast.success('ההגדרות נשמרו')
    } catch (err) {
      setEmailNewProjects(previous) // שחזור בכשל - לא משאירים מצג-שווא של "נשמר"
      toast.error(err.message || 'שמירת ההעדפה נכשלה.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || error) {
    return (
      <LoadingOrError
        loading={loading}
        error={error}
        onRetry={retry}
        retryTestId="settings-notify-retry"
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-800">מייל על פרויקטים חדשים</p>
          <p className="text-xs text-slate-500">
            ההתראות עצמן יישלחו כשמנוע ההתראות יעלה (מודול 10)
          </p>
        </div>
        <Switch
          checked={emailNewProjects}
          onCheckedChange={handleEmailToggle}
          disabled={saving}
          data-testid="settings-notify-email"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-800">SMS על שיבוץ ברגע האחרון</p>
          <p className="text-xs text-slate-500">אין ערוץ SMS במערכת</p>
        </div>
        <Switch checked={false} disabled data-testid="settings-notify-sms" />
      </div>
    </div>
  )
}
