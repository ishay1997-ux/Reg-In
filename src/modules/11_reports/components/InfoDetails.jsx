// ⓘ — פירוט שנפתח בלחיצה: **נתונים**, לא הסברים (תקן-הכרטיס, `2026-09-23-module-11-decision-reports.md` §4ד).
//
// ✏️ **חולץ 24/09/2026 מ-`KpiTile.jsx` (`TileDetails`)** — ליטושי-הכנס, חבילה D1: פס ה-AI בדוח
// "ניתוח הערות" צריך אותו פירוט בדיוק (מספר-הריצות ומי אישרה), והעתקה הייתה שני עותקים שנפרדים
// ביום הראשון (`jscpd` בשער). ⇒ **הקליפה כאן, התוכן אצל הקורא.**
//
// 🔽 `<details>` מקומי — מקלדת מלידה, בלי portal ובלי מוקש-RTL (ר' `Disclosure.jsx`).
// ⚠️ **אח של כפתור ולא בתוכו:** אריח-דלת הוא `<button>`, ואלמנט-אינטראקטיבי בתוך כפתור אינו HTML
// תקין — הלחיצה על ⓘ הייתה פותחת את הדוח במקום את הפירוט. הקורא אחראי למקם אותו מחוץ לדלת.
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function InfoDetails({ label, className, testId = 'kpi-details', children }) {
  return (
    <details className={cn('group', className)} data-testid={testId}>
      <summary
        aria-label={`פירוט — ${label}`}
        className="flex size-7 cursor-pointer list-none items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700 [&::-webkit-details-marker]:hidden"
      >
        <Info aria-hidden="true" className="size-4" />
      </summary>
      <div className="absolute left-0 top-8 z-10 w-64 space-y-1 rounded-lg border border-slate-200 bg-white p-3 text-right shadow-lg">
        {children}
      </div>
    </details>
  )
}
