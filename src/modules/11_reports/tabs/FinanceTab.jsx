// לשונית כספים — **שלד. הבנייה עצמה היא צעד 3.2** (`approved/03_tab_finance_approved.html`,
// משטחים מ7 · מ8 · מ9 · מ12, כרטיסים `stage2-cards/cards-finance.md`).
//
// ⏸️ **והמלכודת הייחודית ללשונית הזו:** הקובץ המאושר מצייר גם את מ10 · מ11 · מ13, **שלושתם
// נדחו בהכרעה 30 ואינם נבנים לכנס.** הם יושבים שם `class="deferred"` עם טריגר-החזרה.
// 🚫 **אין לבנות אותם כי הם בקובץ** — הקטלוג (`reportsCatalog.js`) הוא מה שקובע, והוא
// נושא ארבעה משטחים בלשונית הזו.
//
// חוזה-הפרופס המלא: ר' `ExecutiveTab.jsx`.

import ReportSurface from '../components/ReportSurface'

export default function FinanceTab({ surface, filters, drill, onDrill, onWindow }) {
  return (
    <ReportSurface
      surface={surface}
      filters={filters}
      drill={drill}
      onDrill={onDrill}
      onWindow={onWindow}
    />
  )
}
