// מעטפת "ניהול מערכת" - מוגנת ב-ProtectedRoute allow={SYSTEM_MODULES} (App.jsx): permission-driven,
// כלומר נגישה למי שיש לו הרשאה על "ניהול הרשאות"/"הגדרות מערכת". לפי ה-seed זה המנכ"ל בלבד.
// שורת טאבים אמיתית (NavLink, לא state פנימי) כדי שלכל טאב יהיה URL אמיתי - ריענון/קישור ישיר עובדים.
// תוכן הטאב הפעיל מגיע דרך <Outlet/> מתתי-הנתיבים שמוגדרים ב-App.jsx.

import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'

const TABS = [
  { path: 'users', label: 'ניהול משתמשים' },
  { path: 'permissions', label: 'הרשאות' },
  { path: 'prices', label: 'מחירים' },
  { path: 'params', label: 'פרמטרים' },
]

export default function SystemManagementPage() {
  return (
    <div dir="rtl">
      <h1 className="text-xl font-bold text-slate-800 mb-4">ניהול מערכת</h1>

      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
