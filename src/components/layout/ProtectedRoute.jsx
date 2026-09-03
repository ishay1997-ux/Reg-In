// הגנת נתיבים גלובלית: עוטף כל מסך שדורש הרשאה.
// חוסם גישה גם אם מגיעים ישירות ל-URL (לא רק הסתרה בתפריט) - אותו עיקרון הגנה-כפולה
// שהוחל כבר בתוך UsersManagementPage עצמו.
//
// `allow` מקבל מחרוזת בודדת או מערך - כל איבר יכול להיות שם-מודול (נבדק מול permissions)
// או שם-תפקיד מדויק (נבדק מול user.roleName, למשל הגבלת CEO-בלבד). גישה ניתנת אם איזשהו
// איבר עובר (OR). שמות תפקידים ושמות מודולים הן שתי קבוצות מחרוזות שלא חופפות בפועל,
// כך שאין דו-משמעות בבדיקה.

import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import LoadingOrError from '@/components/LoadingOrError'
import { isAllowed } from '@/lib/permissions'

export default function ProtectedRoute({ allow, children }) {
  const { loading, user, permissions, permissionsError, reload } = useAuth()

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

  if (!isAllowed(user, permissions, allow)) {
    // ⚠️ **שני מסכים שונים לשתי סיבות שונות** (סבב-תיקון 31/07/2026). עד לתאריך הזה
    // כשל בטעינת ההרשאות הציג "אין לך הרשאה" — הודעה שמאשימה את המשתמש בתקלת-רשת,
    // ומשאירה אותו בלי שום פעולה לעשות. הבדיקה **אחרי** `isAllowed` בכוונה: מפה תקפה
    // (כולל ישנה, מלפני כשל-רענון) מנצחת, ורק מי שנדחה בפועל רואה את ההסבר.
    if (permissionsError) {
      return (
        <div className="flex items-center justify-center py-24">
          <div className="bg-white p-8 rounded-2xl shadow-md max-w-sm text-center">
            <LoadingOrError
              error="לא הצלחנו לטעון את ההרשאות שלך. זו כנראה תקלה זמנית."
              onRetry={reload}
              retryTestId="permissions-load-retry"
            />
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-md">
          {/* ‏data-testid נוסף 31/07/2026 (צעד 4.3): מסך-השלילה הזה נבדק היום ע"י ארבע חבילות
              E2E שכולן תופסות אותו לפי **מחרוזת עברית**, בעוד E2E אינו רץ ב-CI — כלומר
              שינוי-ניסוח כאן שובר בדיקות בשקט. הבדיקות החדשות נתלות בעוגן הזה במקום.
              המחרוזת נשארה כפי שהיא; זו תוספת בלבד ואיש לא נשבר. */}
          <p className="text-red-600 font-semibold" data-testid="access-denied">
            אין לך הרשאה לצפות במסך זה.
          </p>
          {/* 🚪 **דרך-קדימה** (ממצא UX-3, אודיט-סגירת מ9 03/09/2026): המסך אמר מה קרה ולא מה
              לעשות — מבוי-סתום שהמשתמשת יוצאת ממנו רק דרך הסרגל. מודול 9 שולח לכאן שני
              תפקידים חדשים (כספים ולוגיסטיקה מנסות `/system/params`), ולשניהם **יש** יעד אמיתי:
              "ההגדרות שלי". ⚠️ ה-`data-testid="access-denied"` והמחרוזת שמעל **לא נגעו** —
              ארבע חבילות E2E תופסות אותן, ו-E2E אינו רץ ב-CI. זו תוספת בלבד. */}
          <Link
            to="/"
            className="text-sm font-medium text-teal-700 underline underline-offset-4 hover:text-teal-800"
            data-testid="access-denied-home"
          >
            חזרה למסך הבית
          </Link>
        </div>
      </div>
    )
  }

  return children
}
