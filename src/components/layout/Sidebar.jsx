// סרגל צד קבוע (ימין, RTL), מתקפל. 7 המודולים העסקיים נשלפים בפועל מטבלת modules ומסוננים
// לפי מפת ההרשאות של המשתמש המחובר - blocked לא מוצג כלל. "לוח בקרה" קבוע ולא כפוף להרשאה.
// "ניהול מערכת" (מאחד את "ניהול הרשאות"+"הגדרות מערכת") הוא פריט קשיח נפרד, מוצג אך ורק
// לתפקיד מנכ"ל (בדיקת roleName ישירה, לא permission-based) - הסתרה מבנית אמיתית, לא רק
// ריקון-מהרשימה. יש לו accordion: כשהתפריט מורחב, קליק על ההורה פותח/סוגר 3 קישורי-בת
// (ניהול משתמשים/הרשאות/פרמטרים); כשהתפריט מכווץ, קליק על האייקון מנווט ישירות ליעד
// ברירת המחדל בלי flyover (צמצום היקף מאושר).

import { useEffect, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
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
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { supabase } from "@/supabaseClient"
import { useAuth } from "@/contexts/AuthContext"
import { CEO_ROLE_NAME } from "@/lib/constants"
import { cn } from "@/lib/utils"

// מיפוי הצגה (אייקון + נתיב) לכל module_name בפועל מהסכמה - הטקסט עצמו תמיד נשלף מה-DB.
// "ניהול הרשאות" ו"הגדרות מערכת" מכוונות לא נעדרות מכאן - הן מוצגות דרך פריט "ניהול מערכת"
// הקשיח למטה, לא כקישורים בודדים.
const MODULE_META = {
  "לקוחות": { path: "/customers", icon: Users },
  "הצעות מחיר": { path: "/quotes", icon: FileText },
  "פרויקטים": { path: "/projects", icon: Briefcase },
  "דיילות": { path: "/hostesses", icon: UserRound },
  "לוגיסטיקה": { path: "/logistics", icon: Package },
  "כספים": { path: "/finance", icon: Wallet },
  'דו"חות': { path: "/reports", icon: BarChart3 },
}

const SYSTEM_TABS = [
  { path: "/system/users", label: "ניהול משתמשים" },
  { path: "/system/permissions", label: "הרשאות" },
  { path: "/system/params", label: "פרמטרים" },
]

export default function Sidebar({ collapsed, onToggleCollapse }) {
  const { user, permissions } = useAuth()
  const [modules, setModules] = useState([])
  const [systemOpen, setSystemOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from("modules")
      .select("module_id, module_name")
      .order("module_id")
      .then(({ data }) => setModules(data || []))
  }, [])

  const visibleModules = modules.filter((m) => permissions[m.module_name] !== "blocked")
  const isCeo = user?.roleName === CEO_ROLE_NAME
  const isSystemSectionActive = location.pathname.startsWith("/system")
  const systemExpanded = systemOpen || isSystemSectionActive

  function handleSystemParentClick() {
    if (collapsed) {
      navigate("/system/users")
    } else {
      setSystemOpen((open) => !open)
    }
  }

  return (
    <aside
      dir="rtl"
      className={cn(
        "fixed top-0 right-0 h-screen bg-white border-l border-slate-200 flex flex-col transition-all duration-200 z-30",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="h-16 flex items-center justify-center border-b border-slate-100 shrink-0">
        {collapsed ? (
          <span className="text-teal-600 font-bold text-lg">R</span>
        ) : (
          <img src="/regin-logo.png" alt="REG-IN" className="h-9" />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-1 px-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-teal-50 text-teal-700"
                : "text-slate-600 hover:bg-slate-50"
            )
          }
          title={collapsed ? "לוח בקרה" : undefined}
        >
          <LayoutDashboard className="size-5 shrink-0" />
          {!collapsed && <span>לוח בקרה</span>}
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-50"
                )
              }
              title={collapsed ? m.module_name : undefined}
            >
              <Icon className="size-5 shrink-0" />
              {!collapsed && <span>{m.module_name}</span>}
            </NavLink>
          )
        })}

        {isCeo && (
          <div>
            <button
              type="button"
              onClick={handleSystemParentClick}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isSystemSectionActive
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-50"
              )}
              title={collapsed ? "ניהול מערכת" : undefined}
            >
              <Settings className="size-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-right">ניהול מערכת</span>
                  <ChevronDown
                    className={cn("size-4 shrink-0 transition-transform", systemExpanded && "rotate-180")}
                  />
                </>
              )}
            </button>

            {!collapsed && systemExpanded && (
              <div className="mt-1 flex flex-col gap-1">
                {SYSTEM_TABS.map((tab) => (
                  <NavLink
                    key={tab.path}
                    to={tab.path}
                    className={({ isActive }) =>
                      cn(
                        "rounded-lg pr-8 pl-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-teal-50 text-teal-700 font-medium"
                          : "text-slate-500 hover:bg-slate-50"
                      )
                    }
                  >
                    {tab.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="border-t border-slate-100 p-2 shrink-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
        >
          {collapsed ? <ChevronsLeft className="size-4" /> : <ChevronsRight className="size-4" />}
          {!collapsed && <span>כיווץ</span>}
        </button>
      </div>
    </aside>
  )
}
