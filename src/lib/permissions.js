// לוגיקת החלטת-הרשאה טהורה (בלי React) - מחולצת מ-ProtectedRoute כדי שתהיה ניתנת לבדיקה
// ולשימוש חוזר. חשוב: זו שכבת נוחות/תצוגה בצד-הלקוח בלבד; האכיפה האמיתית היא ב-DB (RLS).
//
// `allow` מקבל מחרוזת בודדת או מערך - כל איבר יכול להיות שם-מודול (נבדק מול מפת permissions)
// או שם-תפקיד מדויק (נבדק מול user.roleName). גישה ניתנת אם איזשהו איבר עובר (OR).
// 'blocked' לא נבדק בכוונה => נופל ל-false, כלומר חסימה כברירת מחדל.

export function isAllowed(user, permissions, allow) {
  if (!user) return false

  const perms = permissions || {}
  const allowList = Array.isArray(allow) ? allow : [allow]

  return allowList.some(
    (entry) => entry === user.roleName || perms[entry] === 'edit' || perms[entry] === 'view',
  )
}
