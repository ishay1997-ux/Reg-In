// ה1 · **סגירת הצעות** — *"מה סוגר הצעה, ואיפה הכסף הולך לאיבוד?"* (שדרוג-במקום של מ3, 24/09/2026 ·
// `docs/plans/2026-09-23-module-11-decision-reports.md` §3). ה-RPC נשאר `report_m03_trends` וה-slug `trends`:
// קישורי-KPI במסד (מ2) והרשאות נשענים עליהם, ולכן רק התוכן והשם שעל המסך התחלפו.
//
// 🔑 **"פגות בקרוב" אינה נבנית כאן שוב** (כלל-ברזל 14): הרשימה החיה יושבת במסך-הבית (`src/lib/dashboard.js`,
// דרך `deriveQuoteExpiry`). הדוח מראה את מה שכבר אבד, והקישור שולח למקום שבו אפשר עוד להציל.
// ⚠️ ולכן גם אין כאן "יפוגו תוך N ימים": רענון 14/10 מאפס את שעון-התוקף של ההצעות הפתוחות (התוכנית §4).

import { Link } from 'react-router-dom'
import { ChartLead, SurfaceHint, SurfaceNote, TableLead, ExecutiveSurface } from './surfaceKit'

const ROW_ACTION = 'לחיצה על שורה פותחת את הצעת המחיר'
const EXPIRING_LINK = 'הצעות שעומדות לפוג — במסך הבית'

function ExpiringLink() {
  return (
    <SurfaceNote testId="trends-expiring-link">
      <Link to="/" className="font-semibold text-teal-700 hover:underline">
        {EXPIRING_LINK}
      </Link>
    </SurfaceNote>
  )
}

export default function TrendsSurface(props) {
  return (
    <ExecutiveSurface
      {...props}
      renderAfterSoWhat={() => (
        <>
          <ExpiringLink />
          <SurfaceHint hintId="reports.trends.purpose" />
        </>
      )}
      renderBeforeChart={() => <ChartLead hintIds={['reports.trends.reasons']} />}
      renderBeforeTable={() => <TableLead rowAction={ROW_ACTION} hintId="reports.trends.table" />}
    />
  )
}
