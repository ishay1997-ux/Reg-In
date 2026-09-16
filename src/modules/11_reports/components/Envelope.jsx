// חמשת מצבי-המעטפת של 📐10 — **רכיב אחד, ושישה-עשר משטחים מצייתים לו.**
//
// 🔑 **למה זה לא "עוד wrapper":** 📐10 קובע ש**כל דף חייב לדעת לצייר את חמשתם**, והגלריה
// מצוירת פעם אחת במ1 ואינה משוכפלת (הכרעה 15-ו). בלי רכיב אחד, שישה-עשר דפים היו מממשים
// חמישה מצבים כל אחד — 80 הזדמנויות לסטות, ו-jscpd (3%) היה נופל הרבה לפני שמישהו שם לב.
//
// 🔤 **שלושה מהנוסחים מועתקים ואינם מנוסחים כאן:** *"לא ניתן לטעון את הנתונים."* ו*"נסי שוב"*
// חיים ב-`PermissionAwareEmpty` (המחרוזת הנעולה שלו), ו*"אין נתונים עדיין"* הוא תקדים-קוד
// שגובר על כלל-ניסוח (`m11-copy-rules §4`). ⇒ הרכיב **מנתב** אליהם ואינו כותב אותם מחדש.
//
// 🔴 **וההפרדה שאסור לאבד:** `empty` ("ריק-אחרי-סינון") ו-`blank` ("ריק-לגמרי") הם שני
// מצבים שונים בשלד של §⑥, ולא במקרה — הראשון מציע פעולה (*"נקי מסננים"*), השני אומר
// שאין עדיין דאטה בכלל. מיזוגם היה מציע למשתמשת לנקות מסננים שלא יעזרו.

import LoadingOrError from '@/components/LoadingOrError'
import PermissionAwareEmpty from '@/components/PermissionAwareEmpty'
import { Button } from '@/components/ui/button'

// 🔤 נוסח-הריקות-אחרי-סינון, מהשלד של §⑥ (גלריית-המצבים, מצב 2). ‏`נקי מסננים` הוא תקדים-קוד
// חי בנקבה (4/4 אתרי-קריאה, `spec.md §1.5`) ואינו מנוסח מחדש.
// 🚫 **לא מיוצאים** — אין להם צרכן מחוץ לקובץ, ו-knip תופס ייצוא ספקולטיבי בצדק
// (התקדים המדויק: `isolatedShekels` ב-`src/lib/hostesses.js`). כשלשונית תצטרך את המחרוזת —
// אז מייצאים, ולא לפני.
const EMPTY_AFTER_FILTER = 'אין נתונים בתקופה שנבחרה'
const CLEAR_FILTERS_LABEL = 'נקי מסננים'
// 🔤 §⑥ מצב 3 — `StatTile` כבר נושא את אותה מחרוזת כברירת-מחדל.
const EMPTY_ENTIRELY = 'אין נתונים עדיין'

function EmptyAfterFilter({ onClearFilters, testId }) {
  return (
    <PermissionAwareEmpty
      state="empty"
      title={EMPTY_AFTER_FILTER}
      testId={testId}
      action={
        onClearFilters ? (
          <Button
            type="button"
            variant="outline"
            onClick={onClearFilters}
            className="h-auto rounded-lg border-slate-300 px-4 py-2 text-slate-700"
            data-testid="reports-clear-filters"
          >
            {CLEAR_FILTERS_LABEL}
          </Button>
        ) : null
      }
    />
  )
}

/**
 * ‏`state`: `'loading'` · `'empty'` (אחרי סינון) · `'blank'` (ריק-לגמרי) · `'noPermission'` ·
 * `'error'` · `'content'`. כל מצב אחר נופל ל-`content` — המסך לא ייפול על מחרוזת-מצב חדשה.
 *
 * ⚠️ **סדר-הענפים אינו שרירותי: `noPermission` לפני `error`** — אותו סדר בדיוק כמו
 * ‏`DashboardPage` ו-`FinancePage`. מיזוג חסימת-הרשאה לתוך "תקלה" היה מסתיר אותה מאחורי
 * כפתור *"נסי שוב"* שלעולם לא יעזור.
 */
export default function Envelope({
  state,
  title,
  detail,
  onRetry,
  onClearFilters,
  testId = 'reports-envelope',
  children,
}) {
  if (state === 'loading') {
    return (
      <div data-testid={`${testId}-loading`}>
        <LoadingOrError loading skeleton={{ variant: 'page' }} />
      </div>
    )
  }

  if (state === 'noPermission') {
    return (
      <PermissionAwareEmpty
        state="noPermission"
        title={title ?? 'אין לך הרשאה לצפות בדוח זה'}
        detail={detail}
        testId={`${testId}-no-permission`}
      />
    )
  }

  if (state === 'error') {
    return (
      <PermissionAwareEmpty
        state="error"
        detail={detail}
        onRetry={onRetry}
        testId={`${testId}-error`}
      />
    )
  }

  if (state === 'empty') {
    return <EmptyAfterFilter onClearFilters={onClearFilters} testId={`${testId}-empty`} />
  }

  if (state === 'blank') {
    return (
      <PermissionAwareEmpty
        state="empty"
        title={title ?? EMPTY_ENTIRELY}
        detail={detail}
        testId={`${testId}-blank`}
      />
    )
  }

  return <div data-testid={`${testId}-content`}>{children}</div>
}
