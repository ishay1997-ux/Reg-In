// חלון-זמן + דפדוף לרשימות ארוכות — שני רכיבים משותפים לכל מסכי-הרשימה (הכרעת-ישי 04/09/2026).
// הלוגיקה טהורה ב-`src/lib/listWindow.js`; כאן רק המראה, ואותו מראה בכל מסך (מעבר-האחידות).
//
// 🎨 שפת-העיצוב: גלולות-חלון = `FilterPill` הקיימת (טורקיז בהיר לנבחר, המלא שמור לפעולה
// הראשית) · כפתורי-הדפדוף = `outline` קטנים · המונה = טקסט אפור. אפס צבעים חדשים.
//
// 🔤 המונה "51–100 מתוך 701" הוא **רצף של שני מספרים בתוך עברית** — בדיוק המשפחה שנתפסה
// תשע פעמים (`src/CLAUDE.md`): הטווח מבודד ב-`Ltr` כערך אחד, והמילים סביבו נשארות עבריות.

import { Button } from '@/components/ui/button'
import FilterPill from '@/components/FilterPill'
import Ltr from '@/components/Ltr'
import { WINDOW_OPTIONS } from '@/lib/listWindow'

// שורת גלולות-החלון. `value` = מפתח מ-`WINDOW_OPTIONS` · `onChange(key)`.
// `hiddenCount` (רשות) — כמה שורות מחוץ לחלון, כדי שהמנהלת תדע שיש עוד ולא תחשוב שזה הכול.
export function WindowChips({ value, onChange, hiddenCount = 0, testId = 'list-window' }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-testid={testId} role="group">
      <span className="text-[12px] text-slate-500">מציג:</span>
      {WINDOW_OPTIONS.map((option) => (
        <FilterPill
          key={option.key}
          on={value === option.key}
          onClick={() => onChange(option.key)}
          testId={`${testId}-${option.key}`}
        >
          {option.label}
        </FilterPill>
      ))}
      {value !== 'all' && hiddenCount > 0 && (
        <span className="text-[12px] text-slate-400" data-testid={`${testId}-hidden`}>
          (עוד {hiddenCount} מחוץ לחלון)
        </span>
      )}
    </div>
  )
}

// כותרת-תחתונה של דפדוף. מקבלת את התוצאה של `paginate` + `onPage(n)`.
// 🔴 בעמוד אחד בלבד המונה נשאר ("1–23 מתוך 23") והכפתורים מוסתרים — "מתוך" הוא מידע שימושי
// גם בלי דפדוף, וכפתור-דפדוף מושבת על רשימה בת עמוד אחד הוא רעש (מעבר-המלאי).
export function Pager({ page, pageCount, from, to, total, onPage, testId = 'list-pager' }) {
  if (total === 0) return null
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3 py-2 text-[12.5px] text-slate-500"
      data-testid={testId}
    >
      <span data-testid={`${testId}-range`}>
        <Ltr>
          {from}–{to}
        </Ltr>{' '}
        מתוך {total}
      </span>
      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto px-3 py-1 text-[12.5px]"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            data-testid={`${testId}-prev`}
          >
            הקודם
          </Button>
          <span data-testid={`${testId}-page`}>
            עמוד{' '}
            <Ltr>
              {page}/{pageCount}
            </Ltr>
          </span>
          <Button
            type="button"
            variant="outline"
            className="h-auto px-3 py-1 text-[12.5px]"
            disabled={page >= pageCount}
            onClick={() => onPage(page + 1)}
            data-testid={`${testId}-next`}
          >
            הבא
          </Button>
        </div>
      )}
    </div>
  )
}
