// מסך מטריצת הרשאות - טאב שני בתוך "ניהול מערכת", נגיש למנכ"ל בלבד (Route+RLS).
// מציג רק את 7 המודולים העסקיים, מקובצים ל-4 קבוצות-על (לפי מבנה המוקאפ המקורי).
// "ניהול הרשאות" ו"הגדרות מערכת" מכוונות לא נכללות ברשת: הגישה אליהן כבר קבועה בקוד
// כ-CEO-בלבד באופן קשיח (Sidebar.jsx/ProtectedRoute בודקים roleName ישירות, לא permissions) -
// עריכתן כאן הייתה מטעה כי לא הייתה משפיעה בפועל על שום דבר.
// עמודת המנכ"ל נעולה (תמיד "עריכה") - מניעת self-lockout, כמו במחיקת משתמש ב-UsersManagementPage.

import { Fragment, useEffect, useState } from "react"
import { Check, Eye, Minus } from "lucide-react"
import { supabase } from "@/supabaseClient"
import { CEO_ROLE_NAME } from "@/lib/constants"
import { cn } from "@/lib/utils"

const CYCLE = ["edit", "view", "blocked"]

const LEVEL_STYLE = {
  edit: { Icon: Check, className: "bg-teal-600 text-white border-teal-600", label: "צפייה ועריכה" },
  view: { Icon: Eye, className: "bg-white text-teal-600 border-teal-500", label: "צפייה בלבד" },
  blocked: { Icon: Minus, className: "bg-white text-slate-400 border-slate-300", label: "אין גישה" },
}

const GROUPS = [
  { label: "לקוחות ומכירות", modules: ["לקוחות", "הצעות מחיר"] },
  { label: "תפעול ופרויקטים", modules: ["פרויקטים", "דיילות"] },
  { label: "לוגיסטיקה", modules: ["לוגיסטיקה"] },
  { label: "כספים ודוחות", modules: ["כספים", 'דו"חות'] },
]

export default function PermissionsMatrixPage() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [cellError, setCellError] = useState("")
  const [modules, setModules] = useState([])
  const [roles, setRoles] = useState([])
  const [permMap, setPermMap] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setLoadError("")

    const [{ data: modulesData, error: modulesError }, { data: rolesData }, { data: permsData }] =
      await Promise.all([
        supabase.from("modules").select("module_id, module_name").order("module_id"),
        supabase.from("roles").select("role_id, role_name").order("role_id"),
        supabase.from("permissions").select("role_id, module_id, permission_level"),
      ])

    if (modulesError) {
      setLoadError("שגיאה בטעינת נתוני המטריצה.")
      setLoading(false)
      return
    }

    setModules(
      (modulesData || []).filter(
        (m) => m.module_name !== "ניהול הרשאות" && m.module_name !== "הגדרות מערכת"
      )
    )
    setRoles(rolesData || [])

    const map = {}
    for (const row of permsData || []) {
      map[`${row.role_id}-${row.module_id}`] = row.permission_level
    }
    setPermMap(map)
    setLoading(false)
  }

  async function handleCellClick(roleId, moduleId) {
    const key = `${roleId}-${moduleId}`
    const current = permMap[key] || "blocked"
    const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]

    setPermMap((prev) => ({ ...prev, [key]: next }))
    setCellError("")

    const { error } = await supabase
      .from("permissions")
      .update({ permission_level: next })
      .eq("role_id", roleId)
      .eq("module_id", moduleId)

    if (error) {
      setPermMap((prev) => ({ ...prev, [key]: current }))
      setCellError("השינוי לא נשמר. נסה שוב.")
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
      <h2 className="text-lg font-bold text-slate-800 mb-4">מטריצת הרשאות</h2>

      <div className="flex flex-wrap items-center gap-6 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 mb-6 text-sm text-slate-700">
        {CYCLE.map((level) => (
          <div key={level} className="flex items-center gap-2">
            <PermissionCircle level={level} disabled />
            <span>{LEVEL_STYLE[level].label}</span>
          </div>
        ))}
      </div>

      {cellError && <p className="text-red-600 text-sm mb-4">{cellError}</p>}

      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-sm text-slate-500">
            <th className="py-2 px-3 font-medium">מודול</th>
            {roles.map((role) => (
              <th key={role.role_id} className="py-2 px-3 font-medium text-center">
                {role.role_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GROUPS.map((group) => {
            const groupModules = modules.filter((m) => group.modules.includes(m.module_name))
            if (groupModules.length === 0) return null

            return (
              <Fragment key={group.label}>
                <tr className="bg-slate-100">
                  <td colSpan={roles.length + 1} className="py-2 px-3 text-sm font-semibold text-slate-600">
                    {group.label}
                  </td>
                </tr>
                {groupModules.map((m) => (
                  <tr key={m.module_id} className="border-b border-slate-100">
                    <td className="py-3 px-3 font-medium text-slate-700">{m.module_name}</td>
                    {roles.map((role) => {
                      const isCeo = role.role_name === CEO_ROLE_NAME
                      const level = isCeo ? "edit" : permMap[`${role.role_id}-${m.module_id}`] || "blocked"
                      return (
                        <td key={role.role_id} className="py-3 px-3 text-center">
                          <PermissionCircle
                            level={level}
                            disabled={isCeo}
                            onClick={isCeo ? undefined : () => handleCellClick(role.role_id, m.module_id)}
                            title={isCeo ? 'למנכ"ל תמיד עריכה מלאה' : undefined}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PermissionCircle({ level, disabled, onClick, title }) {
  const { Icon, className, label } = LEVEL_STYLE[level]

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title ?? label}
      className={cn(
        "size-8 mx-auto rounded-full border-2 flex items-center justify-center transition-colors",
        className,
        disabled ? "cursor-default opacity-90" : "cursor-pointer hover:opacity-80"
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}
