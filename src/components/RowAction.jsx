import { cn } from '@/lib/utils'

// כפתור-אייקון בשורת-טבלה. ריבוע ממוסגר 30px לפי המוקאפ, **ולא** כפתור-הקישור של מסך
// הלקוחות: בשורת-הצעה יש עד ארבע פעולות זו-לצד-זו, ומסגרת היא מה שמפריד ביניהן בלי
// לצרוך את הרוחב שתוויות היו לוקחות.
//
// ⚠️ הרכיב ישב **זהה בית-בבית** ב-`QuotesPage.jsx` וב-`CustomerDetailsPage.jsx` ואוחד לכאן
// בסקירת 3.7 (הכרעת-ישי 31/07/2026). שני המסכים מציגים את אותן ארבע הפעולות על אותה
// ישות — הצעת-מחיר — ולכן עותק שני היה נשאר מאחור ביום שגוון או גודל משתנים.
// כל מסך עתידי שמציג פעולות-שורה על הצעה צורך את הרכיב הזה, לא מעתיק אותו.
//
// `title` הוא גם `aria-label` **וגם חוזה-E2E** (הבדיקות מאתרות את הכפתורים לפי השם הנגיש) —
// שינוי הטקסט אינו שינוי קוסמטי.
export default function RowAction({ title, onClick, tone = 'neutral', testId, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'size-[30px] rounded-md border inline-flex items-center justify-center transition-colors',
        tone === 'approve' && 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
        tone === 'reject' && 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
        tone === 'neutral' && 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  )
}
