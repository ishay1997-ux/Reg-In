// בידוד-כיווניות לערך בודד בתוך עברית — הצורה היחידה של הזוג `dir="ltr"` +
// `unicode-bidi:isolate` באפליקציה.
//
// למה רכיב ולא מחלקה שזוכרים להקליד (S-27): הזוג הזה חי כשני העתקים ידניים —
// ב-`Money` וב-`RatingStars` (הצורה הדחוסה `5 ★`) — וסטייה ביניהם היא בדיוק המשפחה
// שנתפסה תשע פעמים בפרויקט. והסורק אינו רשת-ביטחון: `check:bidi` נורה רק על ספרה
// צמודה ל-₪/★/×, ולכן `1/6`, `0/2` ו-"חסרות 5" — רוב מה שמודול 6 מרנדר — עוברים
// ירוק בלי בידוד. רכיב שפולט את שני החלקים יחד הוא האכיפה היחידה ששורדת כותב ששכח,
// אותו עיקרון כמו `Money` ו-`LtrFieldGroup`.
//
// ⚠️ לערך בודד בלבד — לרצף בן שני ערכים (כמו `62% / 38%`) אין סדר נכון בכלל,
// והתיקון שם הוא לפרק את הרצף, לא לבודד אותו (`src/CLAUDE.md`, המופע התשיעי).

import { cn } from '@/lib/utils'

export default function Ltr({ children, className, 'data-testid': testId }) {
  return (
    <span
      dir="ltr"
      className={cn('inline-block [unicode-bidi:isolate]', className)}
      data-testid={testId}
    >
      {children}
    </span>
  )
}
