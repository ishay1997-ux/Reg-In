// לשונית דיילות — **שלד. הבנייה עצמה היא צעד 3.3** (`approved/04_tab_hostesses_approved.html`,
// משטחים מ14 · מ15 · מ16 · מ17, כרטיסים `stage2-cards/cards-hostesses.md`).
//
// 🔴 **שתי נקודות שהבונה של הלשונית הזו חייב לדעת מראש:**
// ① **מ17 (הוגנות השיבוץ) הוא היחיד עם עקומת-לורנץ ואריח-ג'יני** — ו-`spec.md §🔢 3.3` נועל
//    את **גרסת-הנוסחה** (ג'יני של אוכלוסייה, בלי `n/(n−1)`), עם מקרה-יד בן חמישה ערכים
//    שמצפה ל-**0.40**. הגרסה המדגמית מחזירה 0.50 על אותו קלט — פער של 25%.
// ② **`recommended_rank` אין לו דאטה עד ש-M11-4 נשלחת**, ודוח 14א **מצהיר את ההיעדר**
//    ואינו מדפיס `0%` (מדריך-המיקרו §5).
//
// חוזה-הפרופס המלא: ר' `ExecutiveTab.jsx`.

import ReportSurface from '../components/ReportSurface'

export default function HostessesTab({ surface, filters, drill, onDrill, onWindow }) {
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
