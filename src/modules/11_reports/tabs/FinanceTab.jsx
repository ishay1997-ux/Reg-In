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
// 🔑 **מה הקובץ הזה עושה, ומה לא:** הוא בוחר את מפרט-המשטח, וזה כל תפקידו. הציור יושב
// ב-`finance/FinanceSurface.jsx` ובמרנדר המשותף, והניתוב-לדלתות במעטפת (`ReportsPage`).

import FinanceSurface from './finance/FinanceSurface'
import { FINANCE_SURFACE_SPECS } from './finance/financePayload'

// משטח בלי מפרט אינו יכול לקרות (`activeSurface` תמיד מגיע מ-`activeTab.surfaces`), אבל
// **הנפילה היא לדוח בלי שכבת-הטמעה ולא למסך ריק** — 🚫 מסך לבן על מפתח לא-מוכר הוא בדיוק
// הכשל השקט ש-§4.3 אוסר.
const BARE_SPEC = Object.freeze({
  hints: Object.freeze({ top: [], chart: [], table: [], extras: [] }),
  sort: null,
})

export default function FinanceTab({ surface, filters, drill, onDrill, onWindow }) {
  return (
    <FinanceSurface
      surface={surface}
      spec={FINANCE_SURFACE_SPECS[surface.slug] ?? BARE_SPEC}
      filters={filters}
      drill={drill}
      // 🚪 **נמסר כמו שהוא, ובכוונה.** עד 16/09 ישב כאן נתב-דלתות של הלשונית (אריח ⇒ לשונית+דוח ·
      // שורת-פרויקט ⇒ `/projects/:id`). **המעטפת נושאת היום את אותו נתב פעם אחת** (`ReportsPage`
      // `openDoor`, GAP 11), והוא עושה גם את מה ששלי לא עשה: אינו פותח דלת ללשונית ממוסכת (ת8)
      // ואינו כותב מצב-זבל על יעד שאינו בקטלוג. 🔴 **שני נתבים לאותה דלת הם שתי הגדרות שיסטו.**
      onDrill={onDrill}
      onWindow={onWindow}
    />
  )
}
