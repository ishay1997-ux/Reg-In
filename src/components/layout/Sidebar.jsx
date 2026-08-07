// סרגל צד קבוע (ימין, RTL), מתקפל. 7 המודולים העסקיים נשלפים בפועל מטבלת modules ומסוננים
// לפי מפת ההרשאות של המשתמש המחובר - blocked לא מוצג כלל. "מסך הבית" קבוע ולא כפוף להרשאה.
// "ניהול מערכת" (מאחד את מודולי "ניהול הרשאות"+"הגדרות מערכת") הוא קישור שטוח יחיד המנווט
// ליעד ברירת המחדל /system/users; ניווט-המשנה (משתמשים/הרשאות/פרמטרים) נעשה דרך הטאבים
// האופקיים בתוכן המסך (SystemManagementPage). מוצג permission-driven: רק אם למשתמש יש
// edit/view על אחד ממודולי המערכת (לא בדיקת role==='מנכ"ל' קשיחה) - כך המטריצה היא מקור האמת.

import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  UserRound,
  Package,
  Wallet,
  BarChart3,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import reginLogo from '@/assets/reg-in-logo.png'
import { SYSTEM_MODULES } from '@/lib/constants'
import { cn } from '@/lib/utils'

// מיפוי הצגה (אייקון + נתיב) לכל module_name בפועל מהסכמה - הטקסט עצמו תמיד נשלף מה-DB.
// "ניהול הרשאות" ו"הגדרות מערכת" מכוונות לא נעדרות מכאן - הן מוצגות דרך פריט "ניהול מערכת"
// הקשיח למטה, לא כקישורים בודדים.
const MODULE_META = {
  לקוחות: { path: '/customers', icon: Users },
  'הצעות מחיר': { path: '/quotes', icon: FileText },
  פרויקטים: { path: '/projects', icon: Briefcase },
  דיילות: { path: '/hostesses', icon: UserRound },
  לוגיסטיקה: { path: '/logistics', icon: Package },
  כספים: { path: '/finance', icon: Wallet },
  'דו"חות': { path: '/reports', icon: BarChart3 },
}

export default function Sidebar({ collapsed, onToggleCollapse }) {
  const { permissions } = useAuth()
  const [modules, setModules] = useState([])
  const location = useLocation()

  useEffect(() => {
    supabase
      .from('modules')
      .select('module_id, module_name')
      .order('module_id')
      .then(({ data }) => setModules(data || []))
  }, [])

  const visibleModules = modules.filter((m) => permissions[m.module_name] !== 'blocked')
  // גישה ל"ניהול מערכת" נאכפת לפי הרשאה (permission-driven), לא לפי role==='מנכ"ל' קשיח.
  const canManageSystem = SYSTEM_MODULES.some(
    (m) => permissions[m] === 'edit' || permissions[m] === 'view',
  )
  const isSystemSectionActive = location.pathname.startsWith('/system')

  return (
    <aside
      dir="rtl"
      className={cn(
        'fixed top-0 right-0 h-screen bg-white border-l border-slate-200 flex flex-col transition-all duration-200 z-30',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* כותרת עליונה: כשמורחב - רשת 3 עמודות (spacer|לוגו|כפתור) כדי שהלוגו יהיה באמצע
          האמת, לא רק ב"שאר השטח" אחרי הכפתור (ה-spacer ברוחב זהה לכפתור מאזן את הצדדים).
          כשמכווץ - כפתור יחיד ממורכז. */}
      <div
        className={cn(
          'h-16 items-center border-b border-slate-100 shrink-0 px-2',
          collapsed ? 'flex justify-center' : 'grid grid-cols-[2.25rem_1fr_2.25rem]',
        )}
      >
        {!collapsed && <div aria-hidden="true" />}
        {!collapsed && <img src={reginLogo} alt="REG-IN" className="h-9 justify-self-center" />}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? 'הרחבת התפריט' : 'כיווץ התפריט'}
          aria-label={collapsed ? 'הרחבת התפריט' : 'כיווץ התפריט'}
          className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-50 transition-colors justify-self-center"
        >
          {collapsed ? <ChevronsLeft className="size-5" /> : <ChevronsRight className="size-5" />}
        </button>
      </div>

      {/* יישור פריטים: במצב מורחב כל השורות מיושרות לקצה הימני (justify-start ב-RTL) כך
          שהאייקונים יושבים על קו אנכי אחיד - הסטנדרט המקובל בתפריטי ניווט; מרכוז מוחל רק
          במצב מכווץ, כשנשאר אייקון בודד בלי טקסט. */}
      <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-1 px-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              collapsed ? 'justify-center' : 'justify-start',
              isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50',
            )
          }
          title={collapsed ? 'מסך הבית' : undefined}
        >
          <LayoutDashboard className="size-5 shrink-0" />
          {!collapsed && <span>מסך הבית</span>}
        </NavLink>

        {visibleModules.map((m) => {
          const meta = MODULE_META[m.module_name]
          if (!meta) return null
          const Icon = meta.icon
          return (
            <NavLink
              key={m.module_id}
              to={meta.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center' : 'justify-start',
                  isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50',
                )
              }
              title={collapsed ? m.module_name : undefined}
            >
              <Icon className="size-5 shrink-0" />
              {!collapsed && <span>{m.module_name}</span>}
            </NavLink>
          )
        })}

        {canManageSystem && (
          <NavLink
            to="/system/users"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              collapsed ? 'justify-center' : 'justify-start',
              isSystemSectionActive
                ? 'bg-teal-50 text-teal-700'
                : 'text-slate-600 hover:bg-slate-50',
            )}
            title={collapsed ? 'ניהול מערכת' : undefined}
          >
            <Settings className="size-5 shrink-0" />
            {!collapsed && <span>ניהול מערכת</span>}
          </NavLink>
        )}
      </nav>
    </aside>
  )
}
