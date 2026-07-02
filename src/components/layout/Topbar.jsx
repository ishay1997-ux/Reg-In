// סרגל עליון קבוע: תיבת חיפוש (placeholder ויזואלי בלבד - אין עדיין נתונים לחפש בהם),
// ותפריט משתמש (שם+תפקיד מתוך AuthContext, וכפתור התנתקות אמיתי).

import { useNavigate } from "react-router-dom"
import { Search, LogOut, User, UserCog } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export default function Topbar({ collapsed }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate("/login")
  }

  return (
    <header
      dir="rtl"
      className={cn(
        "fixed top-0 left-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 transition-all duration-200",
        collapsed ? "right-16" : "right-60"
      )}
    >
      <div className="relative w-72 max-w-full">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          type="text"
          placeholder="חיפוש..."
          disabled
          className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 pr-9 pl-3 text-sm text-slate-500 placeholder:text-slate-400 cursor-not-allowed"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors"
          >
            <span className="flex flex-col items-end text-right">
              <span className="text-sm font-medium text-slate-800">{user?.fullName}</span>
              <span className="text-xs text-slate-500">{user?.roleName}</span>
            </span>
            <span className="size-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold">
              {user?.fullName?.charAt(0) || <User className="size-4" />}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent dir="rtl" align="start">
          <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <UserCog className="size-4" />
            הגדרות פרופיל
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            <LogOut className="size-4" />
            צא מהמערכת
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
