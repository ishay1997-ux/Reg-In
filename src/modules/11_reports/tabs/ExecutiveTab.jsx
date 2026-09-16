// לשונית הנהלה — **שלד. הבנייה עצמה היא צעד 3.1** (`approved/02_tab_executive_approved.html`,
// משטחים מ2 · מ3 · מ4 · מ6, כרטיסים `stage2-cards/cards-management.md`).
//
// 🔑 **החוזה שהשלד הזה נועל, וארבעת הסוכנים בונים לתוכו:**
// ‏`surface` — שורת-הקטלוג (`id · slug · rpc · name · question · drill`) ·
// ‏`filters` — `{ period, from, to, customerId, windowLabel, reloadTick }` ·
// ‏`drill` — מצב-הדריל מהכתובת (`null` = שורש) · `onDrill(next)` — כותב אותו לכתובת ·
// ‏`onRetry()` — מגדיל את `reloadTick` כדי שהמעטפת תבקש טעינה מחדש.
//
// 🚫 **מה שהבונה **לא** נוגע בו:** ‏`ReportsPage.jsx` · `reportsCatalog.js` · `api.js` ·
// `components/**` · `src/lib/reports*.js`. שינוי-התנהגות שם הוא שינוי לכל ארבע הלשוניות.

import ReportSurface from '../components/ReportSurface'

export default function ExecutiveTab({ surface, filters, drill, onDrill, onWindow }) {
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
