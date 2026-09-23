// 🔽 **גילוי-בלחיצה — שבב קטן, והפירוט נפתח מתחתיו.** עטיפה על `<details>/<summary>` המקומי.
//
// 🔑 **למה native ולא Radix/shadcn** (תוכנית-הטיפוגרפיה §3, 17/09/2026): אין בריפו
// tooltip/popover/accordion, ו-`npx shadcn add` הוא מלכודת רשומה (`CLAUDE.md §3` — דורס רכיבים
// בחזרה ל-LTR). ‏`<details>` נגיש במקלדת מלידה (Enter/Space על ה-summary) ונפתח **בלי portal**,
// ולכן בלי מוקש-ה-RTL של `src/CLAUDE.md §2.5`. והמצב פתוח/סגור הוא של הדפדפן — אין state לנהל.
//
// 🎯 **הכרעת-ישי א׳, 17/09/2026:** מצב 0 הוא *"נקי אבל לא סודי"* — ההיקף גלוי בשבב אחד, והפירוט
// המלא (מי נכלל · מי הוצא · הגדרות) נפתח בלחיצה. ⚠️ **וזה לא שכבת-ההטמעה:** התוכן כאן זמין בכל רמה,
// רק מקופל. מה שחיוני לקריאה נכונה של מספר נשאר בתווית עצמה, לא כאן (R26).

import { ChevronDown } from 'lucide-react'

export default function Disclosure({ summary, children, testId }) {
  if (!summary) return null
  return (
    <details className="group mb-3" data-testid={testId}>
      <summary
        className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 [&::-webkit-details-marker]:hidden"
        data-testid={testId ? `${testId}-summary` : undefined}
      >
        {summary}
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
        {children}
      </div>
    </details>
  )
}
