// פקד-מצב מקוטע — רכיב **מקומי** של מודול 5 (AS-9): נמדד בצעד 3.0 שאין בפרויקט ולו פקד
// מקוטע אחד (אפס תוצאות ל-"segmented" ב-`src/`), ולפקד הזה צרכן יחיד — שורת-הצ'קליסט —
// כלומר רף שלושת-המשטחים של כלל-הרכיב-המשותף אינו מתקיים. 🚫 אין להעביר ל-`src/components/`
// בלי צרכן שני אמיתי.
//
// 🎨 המראה נשאל מ-`FilterPill` ולא הומצא: *"טורקיז בהיר = מצב-נבחר"* היא **כלל-צבע**
// (`design-contract §1.4`) ולא רכושה של הגלולה — והטורקיז **המלא** נשאר שמור לפעולה-הראשית
// ואינו מופיע בדיאלוג הזה כלל (תקציב-הצבע של כרטיס-המסך).
//
// 🔴 שתי דרישות שאינן קוסמטיות:
// · **‏`role="group"` + `aria-pressed` פר-כפתור** — התג שליד הפקד אומר *"מה המצב"*, הפקד אומר
//   *"מה אני יכולה לעשות"* (כרטיס §⑧-2), ובלי `aria-pressed` קורא-מסך אינו יודע מה כבר לחוץ.
// · **הפעלה במקלדת עם טבעת-מיקוד נראית** — ‏`<button>` יליד נותן את ההפעלה, `focus-visible:ring`
//   נותן את הנראות. ‏`<div onClick>` היה עובר בעין ונופל בשער-הנגישות.
//
// ㉚ — פקד חסום **נשאר על המסך, מושבת ומנומק** (‏`title`), לעולם לא נעלם. מי שנחסם בגלל
// *היעדר הרשאה* אינו מגיע לכאן בכלל: שם הקורא מסיר את הפקד מהמסך (כרטיס §⑤).

import { cn } from '@/lib/utils'

export default function SegmentedControl({
  options,
  value,
  onSelect,
  disabled = false,
  disabledTitle,
  ariaLabel,
  testIdPrefix,
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex overflow-hidden rounded-md border border-slate-200 bg-white"
    >
      {options.map((option, index) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            title={disabled ? disabledTitle : undefined}
            data-testid={testIdPrefix ? `${testIdPrefix}-${option.value}` : undefined}
            onClick={() => onSelect?.(option.value)}
            className={cn(
              // מאפיינים פיזיים בלבד (`src/CLAUDE.md`): המפריד הוא `border-l` על כל כפתור
              // פרט לאחרון — בדיוק כמו במוקאפ המאושר, ולא `border-s`/`border-e` לוגי.
              'h-auto whitespace-nowrap px-2.5 py-1 text-[11px] font-medium text-slate-600',
              'focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden focus-visible:ring-inset',
              index < options.length - 1 && 'border-l border-slate-200',
              selected && 'bg-teal-50 font-semibold text-teal-700',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
