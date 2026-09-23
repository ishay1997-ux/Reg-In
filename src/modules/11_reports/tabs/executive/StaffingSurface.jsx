// ה3 · **איכות אירועים** — *"מה מוריד את ציון האירוע?"* (שדרוג-במקום של מ6, 24/09/2026 ·
// `docs/plans/2026-09-23-module-11-decision-reports.md` §3). ה-RPC נשאר `report_m06_staffing`:
// אריח "אירועים עם חוסר" במבט-על דיילות (מ14) פותח את הדף הזה, והטבלה כאן היא בדיוק ההמשך שלו —
// האירועים הקרובים שכבר יש בהם גורם-סיכון.
//
// 🔒 **אגרגטים בלבד** — אף דיילת בשמה ואפס `hourly_rate` (חוב פתוח עד ~07/10, `RepositoryTab` מוקפא).
// ⚠️ **שאלת החזרה אחרי אירוע רע נשארת במ19** ("מבט-על לקוחות") — כאן רק מפנים אליה (כלל-ברזל 14).

import { ChartLead, SurfaceHint, TableLead, ExecutiveSurface } from './surfaceKit'

const ROW_ACTION = 'לחיצה על שורה פותחת את כרטיס האירוע'

export default function StaffingSurface(props) {
  return (
    <ExecutiveSurface
      {...props}
      renderAfterSoWhat={() => <SurfaceHint hintId="reports.staffing.purpose" />}
      renderBeforeChart={() => <ChartLead hintIds={['reports.staffing.chart']} />}
      renderBeforeTable={() => <TableLead rowAction={ROW_ACTION} hintId="reports.staffing.table" />}
    />
  )
}
