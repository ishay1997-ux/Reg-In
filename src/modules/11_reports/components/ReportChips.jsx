// בורר-הדוח — **שורת-שבבים אופקית מעל הדף.**
//
// 🔴 **וזה הפרט האחד שהשלד נשא שגוי עד 11/09/2026, ולכן הוא כתוב כאן במפורש:** הבורר היה
// מוגדר `flex-direction:column; width:220px` — כלומר **סרגל-צד שני** בתוך מסך שכבר יש לו
// סרגל-צד — בעוד ארבעת המוקאפים המאושרים מציירים `flex-wrap:wrap; width:100%`.
// **ישי תפס את זה בעין בתוך דקות**, ובמילותיו: *"אסור שבפיתוח יפלו בזה גם"* (§⑥.2).
// ⇒ `flex flex-wrap w-full`, ולעולם לא `flex-col`/`w-[220px]`.
//
// 🔒 **התוויות הן השם הקצר מ-§🏷️** (הכרעה 18, במילותיו: *"כל הבחירת סוגי דוחות כשאלות…
// זה נראלי ממש לא מקצועי"*) — **השאלה יורדת לכותרת-המשנה של הדף**, לא לשבב.
// 🚫 **ואין מספר-דוח בממשק** (`spec.md §1.2`).
//
// 🎨 השבב הפעיל הוא **גלולה** (הכרעה 29) — טורקיז בהיר, בדיוק כמו `FilterPill` הקיימת.
// ⚠️ **ובכל זאת אינו `FilterPill`:** זו רשימת-ניווט (`<nav>` + `aria-current`), לא מסנן
// רב-בחירה (`aria-pressed`). קורא-מסך שומע "קישור נוכחי" ולא "לחצן לחוץ", וזו ההבחנה
// הנכונה — הלחיצה **מחליפה דף**, ואינה מדליקה מסנן.

import { cn } from '@/lib/utils'

export default function ReportChips({ tabLabel, surfaces, activeSlug, onSelect }) {
  return (
    <nav
      // 🔴 `flex-wrap` + `w-full` — ר' הערת-הכותרת. זו לא בחירת-פריסה, זו הכרעה מתועדת.
      className="mb-3.5 flex w-full flex-wrap items-center gap-1.5"
      aria-label={`דוחות לשונית ${tabLabel}`}
      data-testid="reports-picker"
    >
      {surfaces.map((surface) => {
        const on = surface.slug === activeSlug
        return (
          <button
            key={surface.slug}
            type="button"
            onClick={() => onSelect(surface.slug)}
            aria-current={on ? 'true' : undefined}
            data-testid={`reports-chip-${surface.slug}`}
            className={cn(
              'whitespace-nowrap rounded-full border px-3 py-1 text-[12.5px] leading-tight',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700',
              on
                ? 'border-teal-200 bg-teal-50 font-semibold text-teal-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {surface.name}
          </button>
        )
      })}
    </nav>
  )
}
