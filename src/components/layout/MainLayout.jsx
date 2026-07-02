// המעטפת הראשית: שער-כניסה (מפנה ל-login אם אין session), Sidebar+Topbar קבועים, ותוכן המסך הפעיל.

import { useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import { cn } from "@/lib/utils"

export default function MainLayout() {
  const { loading, user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">טוען...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.status === "frozen") {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-sm text-center">
          <p className="text-red-600 font-semibold">חשבונך הוקפא זמנית. פנה למנכ"ל לצורך בירור.</p>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      <Topbar collapsed={collapsed} />
      <main className={cn("pt-16 transition-all duration-200", collapsed ? "mr-16" : "mr-60")}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
