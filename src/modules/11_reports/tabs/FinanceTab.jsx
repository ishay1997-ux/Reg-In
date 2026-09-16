// לשונית כספים — **ארבעה משטחים: מ7 מבט-על · מ8 רווחיות · מ9 גיול (דריל) · מ12 צריכת ציוד**
// (`approved/03_tab_finance_approved.html`, כרטיסים `stage2-cards/cards-finance.md`).
//
// ⏸️ **והמלכודת הייחודית ללשונית הזו:** הקובץ המאושר מצייר גם את מ10 · מ11 · מ13, **שלושתם
// נדחו בהכרעה 30 ואינם נבנים לכנס.** הם יושבים שם `class="deferred"` עם טריגר-החזרה.
// 🚫 **אין לבנות אותם כי הם בקובץ** — הקטלוג (`reportsCatalog.js`) הוא מה שקובע, והוא
// נושא ארבעה משטחים בלשונית הזו. *(עשרת מפתחות-ההטמעה שלהם לא הועברו מהכרטיס מאותה סיבה.)*
//
// חוזה-הפרופס המלא: ר' `ExecutiveTab.jsx`.
//
// 🔑 **מה הקובץ הזה עושה, ומה לא:** הוא בוחר את מפרט-המשטח ומתרגם **דלת** לניווט. הציור
// כולו יושב ב-`finance/FinanceSurface.jsx` ובמרנדר המשותף.

import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { REPORT_TABS } from '../reportsCatalog'
import FinanceSurface from './finance/FinanceSurface'
import { FINANCE_SURFACE_SPECS } from './finance/financePayload'

// משטח בלי מפרט אינו יכול לקרות (`activeSurface` תמיד מגיע מ-`activeTab.surfaces`), אבל
// **הנפילה היא לדוח בלי שכבת-הטמעה ולא למסך ריק** — 🚫 מסך לבן על מפתח לא-מוכר הוא בדיוק
// הכשל השקט ש-§4.3 אוסר.
const BARE_SPEC = Object.freeze({
  hints: Object.freeze({ top: [], chart: [], table: [], extras: [] }),
  sort: null,
})

/**
 * ‏`tiles[].target` של C8 — `{ tab, report, drill }` — הוא **הכרעה 33**: כל אריח במבט-על
 * הוא דלת לדף, גם חוצת-לשונית. ‏`report` הוא **שם-ה-RPC** ו-`tab` הוא **תווית-הלשונית**,
 * בעוד שהכתובת נושאת `slug` ו-`key` ⇒ התרגום נעשה מול הקטלוג ולא מתבנית.
 * 🚫 יעד שאין לו משטח בקטלוג מחזיר `null` ⇒ הדלת פשוט אינה פועלת, ואין ניווט לכתובת מומצאת.
 */
function resolveTarget(target) {
  for (const tab of REPORT_TABS) {
    if (target.tab && tab.label !== target.tab && tab.key !== target.tab) continue
    const found = tab.surfaces.find((s) => s.rpc === target.report || s.slug === target.report)
    if (found) return { tabKey: tab.key, slug: found.slug }
  }
  return null
}

export default function FinanceTab({ surface, filters, drill, onDrill, onWindow }) {
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()

  /**
   * 🚪 **שלושת סוגי-הדלת שמגיעים דרך `onDrill` של המרנדר המשותף — ולמה הם מופרדים כאן.**
   * ① `{kind:'project', id}` — **הכרעה 19**: שורה בטבלה של מ7 · מ8 · ורמות 0/2 של מ9 היא
   *    דלת ל**כרטיס-הפרויקט** (`/projects/:id`), הדף היחיד שבאמת קיים בתור יעד.
   *    ⚠️ **וכרטיס מ8 ⑧8.1 נוקב ב"מסך-הכספים"** — `FinancePage` אינה נושאת פרמטר-פרויקט
   *    בכתובת (נמדד: רק `window` ו-`page`), ולכן היעד כאן הוא כרטיס-הפרויקט. **מדווח.**
   * ② `{tab, report, …}` — **הכרעה 33**: אריח-דלת וקישור "כל N החשבוניות →". נכתב
   *    לכתובת של המעטפת, שהיא מקור-האמת למצב-התצוגה (📐13④); המעטפת מאמתת הרשאה בעצמה.
   * ③ כל השאר — ירידת-רמה רגילה בתוך הדוח, שמוסרת למעטפת כמו שהיא.
   */
  const handleDrill = useCallback(
    (next) => {
      if (next?.kind === 'project' && next.id != null) {
        navigate(`/projects/${next.id}`)
        return
      }
      const destination = next?.report || next?.tab ? resolveTarget(next) : null
      if (!destination) {
        onDrill(next ?? null)
        return
      }
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          params.set('tab', destination.tabKey)
          params.set('report', destination.slug)
          if (next.drill) params.set('drill', JSON.stringify(next.drill))
          else params.delete('drill')
          params.delete('page')
          return params
        },
        { replace: true },
      )
    },
    [navigate, onDrill, setSearchParams],
  )

  return (
    <FinanceSurface
      surface={surface}
      spec={FINANCE_SURFACE_SPECS[surface.slug] ?? BARE_SPEC}
      filters={filters}
      drill={drill}
      onDrill={handleDrill}
      onWindow={onWindow}
    />
  )
}
