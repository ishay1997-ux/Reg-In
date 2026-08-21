// קבועים משותפים שנחוצים ביותר מקובץ אחד (Sidebar, App, מסכי ניהול) - כדי לא לשכפל מחרוזות עבריות רגישות-לתווים.

import { Users, FileText, Briefcase, UserRound, Package, Wallet, BarChart3 } from 'lucide-react'

export const CEO_ROLE_NAME = 'מנכ"ל'

// שני מודולי ה"מערכת" (module_id 8-9 ב-DB). הגישה ל"ניהול מערכת" נאכפת לפי הרשאה על
// אלה (permission-driven), לא לפי role==='מנכ"ל' קשיח - כך מטריצת ההרשאות היא מקור האמת
// וניתן להאציל גישת-מערכת לתפקיד אחר בלי שינוי קוד. מקור יחיד לשמות (מונע אי-התאמת מחרוזת).
export const SYSTEM_MODULES = ['ניהול הרשאות', 'הגדרות מערכת']

// מקור יחיד ל-7 המודולים העסקיים (module_name בפועל מטבלת modules, עם path+icon לסרגל,
// ו-group לקיבוץ במטריצת-ההרשאות) - עד 21/08/2026 Sidebar.jsx ו-PermissionsMatrixPage.jsx
// שכפלו כל אחד עצמאית את אותה רשימת-מחרוזות עבריות (MODULE_META / GROUPS), בסיכון של
// אי-התאמה שקטה בין השניים (§6 "MODULE_META/GROUPS duplication"). הסדר כאן הוא סדר-ההצגה
// בסרגל (module_id).
export const BUSINESS_MODULES = [
  { name: 'לקוחות', path: '/customers', icon: Users, group: 'לקוחות ומכירות' },
  { name: 'הצעות מחיר', path: '/quotes', icon: FileText, group: 'לקוחות ומכירות' },
  { name: 'פרויקטים', path: '/projects', icon: Briefcase, group: 'תפעול ופרויקטים' },
  { name: 'דיילות', path: '/hostesses', icon: UserRound, group: 'תפעול ופרויקטים' },
  { name: 'לוגיסטיקה', path: '/logistics', icon: Package, group: 'לוגיסטיקה' },
  { name: 'כספים', path: '/finance', icon: Wallet, group: 'כספים ודוחות' },
  { name: 'דו"חות', path: '/reports', icon: BarChart3, group: 'כספים ודוחות' },
]
