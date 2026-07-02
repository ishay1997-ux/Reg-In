// הגנת נתיבים גלובלית: עוטף כל מסך שדורש הרשאה.
// חוסם גישה גם אם מגיעים ישירות ל-URL (לא רק הסתרה בתפריט) - אותו עיקרון הגנה-כפולה
// שהוחל כבר בתוך UsersManagementPage עצמו.
//
// `allow` מקבל מחרוזת בודדת או מערך - כל איבר יכול להיות שם-מודול (נבדק מול permissions)
// או שם-תפקיד מדויק (נבדק מול user.roleName, למשל הגבלת CEO-בלבד). גישה ניתנת אם איזשהו
// איבר עובר (OR). שמות תפקידים ושמות מודולים הן שתי קבוצות מחרוזות שלא חופפות בפועל,
// כך שאין דו-משמעות בבדיקה.

import { useAuth } from "@/contexts/AuthContext"

export default function ProtectedRoute({ allow, children }) {
  const { loading, user, permissions } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500">טוען...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-red-600 font-semibold">יש להתחבר כדי לצפות במסך זה.</p>
      </div>
    )
  }

  const allowList = Array.isArray(allow) ? allow : [allow]
  // גישה אם עובר לפחות תנאי אחד (OR): שם-תפקיד תואם, או הרשאת מודול 'edit'/'view'.
  // 'blocked' לא נבדק בכוונה => נופל ל-false, כלומר חסימה כברירת מחדל.
  const isAllowed = allowList.some(
    (entry) => entry === user.roleName || permissions[entry] === "edit" || permissions[entry] === "view"
  )

  if (!isAllowed) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-sm text-center">
          <p className="text-red-600 font-semibold">אין לך הרשאה לצפות במסך זה.</p>
        </div>
      </div>
    )
  }

  return children
}
