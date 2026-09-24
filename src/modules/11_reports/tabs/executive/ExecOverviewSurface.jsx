// מ2 · **מבט-על הנהלה** — *"מה מצב העסק השנה?"* (`cards-management.md`, שורה 89 · `#p1` במוקאפ).
//
// 🔑 **מה הדף מחויב להראות, ומאיפה זה מגיע:** ארבעה אריחים עם חצי-השוואה (📐1) וחלון (📐3) ·
// גרף-חודשים · טבלת האירועים הגדולים · שורת-"אז מה" · הגדרות — **כולם מהמטען** (C8), וכולם
// מרונדרים ע"י השלד המשותף. מה שנוסף כאן הוא רק מה שהמטען אינו יכול לומר לו בעצמו.
//
// 🔴 **הכרעה 33 חיה כאן במלואה, ומאז 16/09 11:1X היא של המעטפת:** ארבעת האריחים נושאים
// `target`, ושלושה מהם פותחים דוח **בלשונית אחרת**. ‏`ReportsPage` הוא נתב-הדלתות היחיד —
// הלשונית מוסרת את `onDrill` כפי שקיבלה אותו ו**אינה כותבת לכתובת בעצמה**. *(עד לתאריך הזה
// היה כאן נתב משלה, כי `onDrill` של המעטפת כתב רק `drill`; שני נתבים = שני כללי-ניווט.)*

import { ChartLead, SurfaceHint, TableLead, ExecutiveSurface } from './surfaceKit'
import { withCharts, withPartialMonth } from './chartShape'

// 🔤 מילה-במילה מהמוקאפ המאושר (`02_tab_executive_approved.html:501`) — הכרעה 19 כפי
// שהיא נאמרת למשתמשת. **אין קישור "פתח…" חוזר בכל שורה; השורה עצמה היא הדלת.**
const ROW_ACTION = 'לחיצה על שורה פותחת את כרטיס האירוע'
// 🔤 החץ נשאר `→` ואינו מתהפך — `m11-copy-rules §4.2` נועל אותו מול התקדים החי
// `לכרטיס →` (`CustomerDetailsPage.jsx:1332`), ולא לפי כלל-הכיווניות הכללי (כ10).

function transformPayload(payload) {
  return withCharts(payload, (chart) => withPartialMonth(chart, payload.window?.to))
}

export default function ExecOverviewSurface(props) {
  return (
    <ExecutiveSurface
      {...props}
      transformPayload={transformPayload}
      renderAfterSoWhat={() => <SurfaceHint hintId="reports.execOverview.purpose" />}
      renderBeforeChart={() => (
        <ChartLead
          hintIds={['reports.execOverview.revenueBasis', 'reports.execOverview.top5Share']}
        />
      )}
      renderBeforeTable={() => (
        <TableLead rowAction={ROW_ACTION} hintId="reports.execOverview.topEventsSort" />
      )}
      // ✂️ 24/09/2026 — הקישור "כל השנים בדוח «מגמות רב-שנתיות» →" ירד: הדוח הוחלף ב"סגירת הצעות",
      // ואין בו עוד ציר-שנים. גם אריח-ההכנסות כבר לא פותח אותו — `target: null` מהשרת
      // (`20260924213000_module11_m02_revenue_tile_no_door`), כי אריח על הכנסות לא נפתח על דוח הצעות.
    />
  )
}
