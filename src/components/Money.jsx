// תצוגת סכום כסף — **הדרך היחידה** להציג ₪ באפליקציה.
//
// ⚠️ למה רכיב ולא סתם קריאה ל-formatShekelWhole:
// המחרוזת "6,300 ₪" מוצגת אחרת לפי ההקשר. בתוך טקסט עברי, אלגוריתם הכיווניות מעביר את
// סימן ה-₪ אל **שמאל** הספרות; בתוך הקשר לטיני הוא נשאר מימין. התוצאה בפועל (נמדדה
// 29/07/2026 במסך-הבנייה): אותו סכום הופיע עם ה-₪ משני צדדים שונים באותו מסך — בטבלה
// מצד אחד ובפאנל-הסיכום מהצד השני. אין שגיאה ואין בדיקה שנכשלת.
//
// הצורה הקנונית: **מספר ואז ₪ מימינו** — זהה למה ש-quotePdf.jsx מדפיס ללקוח. מסך שמציג
// אחרת מהמסמך ששלחנו הוא בדיוק סוג הפער שמודול-הכסף אמור למנוע.
// `unicode-bidi: isolate` מבודד את הסכום מהטקסט שסביבו, כך שההקשר לא יכול להשפיע עליו.

import { formatShekelWhole } from '@/lib/pricing'
import { cn } from '@/lib/utils'

export default function Money({ amount, className, 'data-testid': testId }) {
  return (
    <span
      dir="ltr"
      className={cn('inline-block [unicode-bidi:isolate]', className)}
      data-testid={testId}
    >
      {formatShekelWhole(amount)}
    </span>
  )
}
