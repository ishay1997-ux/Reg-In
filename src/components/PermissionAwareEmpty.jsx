// מצב-ריק מודע-הרשאות — שלושת המצבים שקריאה מטבלה מגודרת יכולה להחזיר, ברכיב אחד (S-26).
//
// למה שלושה מצבים ולא שניים: קריאה שנחסמה ב-RLS מחזירה `{data:null, error:null}` —
// זהה-בייט לאפס שורות. המבחין בין "ריק כדין" ל"תקלה" הוא בעצמו קריאה מטבלה מגודרת
// (למשל `quote_services`, שסגורה בפני מנהלת גיוס ומנהלת לוגיסטיקה) — כלומר בדיוק למי
// שההבחנה נכתבה בשבילו, המבחין עצמו חסום. שני מצבים אינם יכולים לבטא שלוש סיטואציות;
// המצב השלישי (`noPermission`) הוא מה שהופך את ההבחנה לניתנת-לביטוי בכלל.
//
// למה רכיב משותף ולא פר-מסך: המודול כבר בנה את הצורה הזאת במשטח 8 ובשום מקום אחר —
// משותף במקום פעמיים (מדריך-המיקרו, צעד 3.0 δ). הרכיב תצוגתי בלבד: אפס שליפות,
// אפס Supabase — המשטח מחליט באיזה מצב הוא נמצא ומעביר את הנוסח שלו.
//
// 🔤 הנוסחים הנעולים (מדריך-המיקרו §3.7) חיים כאן פעם אחת: כותרת-הכשל
// "לא ניתן לטעון את הנתונים." + כפתור "נסי שוב" (לשון-נקבה — S-28: כל חמש המשתמשות
// נשים, והכרטיסים המאושרים כתובים כך). המשטח מוסיף רק את מה שספציפי לו.

import { Button } from '@/components/ui/button'

// 🔴 מונה שאסור לקרוא מציג `—`, לעולם לא `0` — "אפס שורות ⇒ הושלם" על טבלה חסומה
// הוא השקר המסוכן של המודול (S-26): `0` נקרא כעובדה, `—` נקרא כ"אין לי את הנתון".
export const DENIED_MARK = '—'

// העזר שכל מונה מגודר עובר דרכו: הדגל המפורש מהשרת (`money_visible` /
// `can_read_revenue` וכו') מכריע — לעולם לא `value === null`, כי null חוקי גם כערך.
// העזר גר כאן ולא בקובץ נפרד כי הוא חצי מאותה הכרעה שהרכיב מקיים — מונה חסום ומסך
// חסום חייבים לספר את אותו סיפור. חוק only-export-components נוגע רק לגרנולריות של
// Fast Refresh בפיתוח, לא לתקינות ריצה — משתיקים במודע (התקדים: ConfirmDialog).
// eslint-disable-next-line react-refresh/only-export-components
export function deniedValue(canRead, value) {
  return canRead ? value : DENIED_MARK
}

// 🔒 המחרוזת הנעולה — אחת לכל המשטחים; ההבדל ביניהם חי בשורה השנייה (`detail`).
const ERROR_TITLE = 'לא ניתן לטעון את הנתונים.'
const RETRY_LABEL = 'נסי שוב'

// state: `'empty'` (ריק כדין — נוסח פר-משטח) · `'noPermission'` (המשטח מעביר את המשפט
//        המלא שהושלם מהבסיס הנעול "אין לך הרשאה לצפות ב…") · `'error'` (כשל-טעינה).
// title: השורה הראשונה — ב-`error` היא נעולה ואין להעבירה.
// detail: שורת-ההסבר השנייה, פר-משטח. action: צומת-פעולה (קישור / ניקוי-סינון) — רק ב-`empty`.
export default function PermissionAwareEmpty({ state, title, detail, action, onRetry, testId }) {
  if (state === 'error') {
    return (
      <div
        className="flex flex-col items-center gap-3 py-12 text-center"
        role="alert"
        data-testid={testId}
      >
        <p className="text-red-600 font-semibold">{ERROR_TITLE}</p>
        {detail && <p className="text-sm text-slate-600">{detail}</p>}
        {onRetry && (
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            className="h-auto py-2 px-4 rounded-lg border-slate-300 text-slate-700"
          >
            {RETRY_LABEL}
          </Button>
        )}
      </div>
    )
  }

  if (state === 'noPermission') {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center" data-testid={testId}>
        {/* המנעול דקורטיבי — המשפט עצמו כבר אומר "אין לך הרשאה", וקורא-מסך לא צריך אימוג'י */}
        <span aria-hidden="true" className="text-2xl">
          🔒
        </span>
        <p className="text-slate-600 font-medium">{title}</p>
        {detail && <p className="text-sm text-slate-500">{detail}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center" data-testid={testId}>
      <p className="text-slate-600 font-medium">{title}</p>
      {detail && <p className="text-sm text-slate-500">{detail}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
