// פירורי-לחם לדריל-דאון (📐13①) — **מוצגים רק בדפי-הדריל**; בשאר הדפים אין אלמנט כזה.
//
// 🔑 **לא רכיב חדש — העתק של התקדים הקיים** `Crumbs` ב-`src/modules/06_projects/
// ProjectCardPage.jsx`: `flex items-center gap-2 text-xs text-slate-500`, הקישור
// `font-semibold text-teal-700`, המפריד `|` ב-`text-slate-300`.
//
// ⚠️ **ו-flex ולא טקסט-עם-מפריד** — הערת-הקוד שם מנמקת: **הסדר נקבע ע"י הפריסה ולא ע"י
// אלגוריתם-ה-bidi.** רצף `"2026 | מרץ | ערב גאלה"` כטקסט אחד היה מסודר מחדש ע"י ה-bidi
// ברגע שאחד הפירורים מכיל ספרות בלבד.
// ✏️ **והמפריד הוא `|` ולא `›`** — 07/09 16:1X: הקוד הקיים משתמש ב-`|` עם נימוק-bidi כתוב,
// והמוקאפ עוקב אחרי הקוד.
//
// **מה שמודול 11 מוסיף על התקדים:** יותר משתי רמות, והפריט האחרון נושא `aria-current="page"`.

import { cn } from '@/lib/utils'

export default function DrillCrumbs({ crumbs = [], onNavigate }) {
  // רמת-שורש בלבד ⇒ אין פירורים. פירור בודד "2026" הוא רעש, לא התמצאות.
  if (crumbs.length < 2) return null

  return (
    <nav
      className="my-2.5 flex items-center gap-2 text-xs text-slate-500"
      aria-label="מיקום בדוח"
      data-testid="report-crumbs"
    >
      {crumbs.map((crumb, index) => {
        const last = index === crumbs.length - 1
        return (
          <span key={`${crumb.label}-${index}`} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-slate-300" aria-hidden="true">
                |
              </span>
            )}
            {last ? (
              <span aria-current="page" className="font-semibold text-slate-700">
                {crumb.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(crumb.drill ?? null, index)}
                className={cn(
                  'font-semibold text-teal-700',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700',
                )}
                data-testid={`report-crumb-${index}`}
              >
                {crumb.label}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}
