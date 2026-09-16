// לשונית הנהלה — **ארבעת המשטחים, צעד 3.1** (`approved/02_tab_executive_approved.html`,
// כרטיסים `stage2-cards/cards-management.md`: מ2 · מ3 · מ4 · מ6).
//
// 🔑 **החוזה שהשלד נועל, וזה הקובץ שבונה לתוכו:**
// ‏`surface` — שורת-הקטלוג (`id · slug · rpc · name · question · drill`) ·
// ‏`filters` — `{ period, from, to, customerId, windowLabel, reloadTick }` ·
// ‏`drill` — מצב-הדריל מהכתובת (`null` = שורש) · `onDrill(next)` — כותב אותו לכתובת ·
// ‏`onRetry()` — מגדיל את `reloadTick` כדי שהמעטפת תבקש טעינה מחדש.
//
// 🚫 **מה שהלשונית **אינה** נוגעת בו:** ‏`ReportsPage.jsx` · `reportsCatalog.js` · `api.js` ·
// `components/**` · `src/lib/reports*.js`. שינוי-התנהגות שם הוא שינוי לכל ארבע הלשוניות.
//
// 🔴 **ולמה הקובץ הזה הוא נתב ולא דף:** ארבעת המשטחים חולקים את אותו שלד (`ReportSurface`)
// ונבדלים רק בתוכן נקודות-ההרחבה. **משטח = קובץ**, והמשותף יושב ב-`executive/surfaceKit.jsx`
// פעם אחת — ‏jscpd נופל ב-3% (§2ב C6), וארבעה עותקים של אותו JSX הם בדיוק מה שהוא סופר.

import DiscountsSurface from './executive/DiscountsSurface'
import ExecOverviewSurface from './executive/ExecOverviewSurface'
import StaffingSurface from './executive/StaffingSurface'
import TrendsSurface from './executive/TrendsSurface'

// 🔑 **טבלה ולא `switch`** — מזהי-המשטחים מגיעים מ-`reportsCatalog` ואינם נגזרים כאן;
// משטח שאינו מוכר נופל ל-`null` ואינו מפיל את הלשונית.
const SURFACES = {
  מ2: ExecOverviewSurface,
  מ3: TrendsSurface,
  מ4: DiscountsSurface,
  מ6: StaffingSurface,
}

export default function ExecutiveTab({ surface, filters, drill, onDrill, onWindow }) {
  const Surface = SURFACES[surface.id]
  if (!Surface) return null
  return (
    <Surface
      surface={surface}
      filters={filters}
      drill={drill}
      onDrill={onDrill}
      onWindow={onWindow}
    />
  )
}
