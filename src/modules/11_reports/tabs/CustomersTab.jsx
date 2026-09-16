// לשונית לקוחות — **שלד. הבנייה עצמה היא צעד 3.4** (`approved/05_tab_customers_approved.html`,
// משטחים מ19 · מ20 · מ21 · מ22, כרטיסים `stage2-cards/cards-customers.md`).
//
// 🔴 **המשטח היחיד במודול שיש בו כתיבה יושב כאן:** מ25 — פס-מצב וכפתור *"אשר להצגה"* **בתוך
// דף 20** (ת2), דרך `approveFeedbackAiRun` ב-`api.js`. **אין מסך נפרד ואין כתיבה מהלקוח.**
// ⚠️ **ובלי ריצה מאושרת דף 20 אינו דוח ריק** — הוא אומר *"טרם אושרה ריצת-ניתוח"*, והייצוא
// שלו נושא את הנוסח הנעול `EXPORT_NO_APPROVED_RUN` (`src/lib/reportsExport.js`).
//
// חוזה-הפרופס המלא: ר' `ExecutiveTab.jsx`.

import ReportSurface from '../components/ReportSurface'

export default function CustomersTab({ surface, filters, drill, onDrill, onWindow }) {
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
