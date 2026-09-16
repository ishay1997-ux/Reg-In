// מ3 · **מגמות רב-שנתיות** — *"האם הצמיחה שומרת על שולי-הרווח?"* (`cards-management.md`, שורה 236 · `#p2`).
//
// 🔴 **זהו דוח-הדריל היחיד בלשונית** (📐13): שנה ← חודש ← אירוע. ‏**שלוש הרמות מגיעות
// מפונקציית-שרת אחת מגודרת**, המצב חי בכתובת, והפירורים הם הדרך חזרה — כל זה מהשלד
// (`ReportSurface` · `DrillCrumbs`). מה שהמשטח מוסיף הוא **שורת-הפעולה שמשתנה עם הרמה**
// והרמזים של §⑩.
//
// ✂️ **ומה שנמחק כאן 16/09 11:1X — ‏`toComboChart`:** עד אז המשטח המיר את גרף-השנים ל-`pareto`
// כדי שקו-שולי-הרווח ייצבע בכלל, **במחיר עמודת-הרווח שלא צוירה.** ‏`ChartCard` קיבל
// ‏`ComposedBody` (קומיט `11f347a9`), שקורא `series[].kind`/`axis` ומצייר **את שלוש הסדרות**
// — שתי עמודות-₪ על הציר השמאלי וקו-האחוזים על ציר ימני נעול ⁦0–100⁩ (⑧ 3.4).
// ⇒ **אין כאן `transformPayload` כלל.** אומת חי אחרי המחיקה: ⁦3⁩ `recharts-bar-rectangle`
// ו-⁦1⁩ `recharts-line-curve` בכרטיס הראשון, וציר ימני ⁦0/25/50/75/100⁩.

import Hint from '@/components/Hint'
import { ChartLead, SurfaceLead, TableLead, ExecutiveSurface } from './surfaceKit'

// 🔤 שלוש השורות מילה-במילה מהמוקאפ המאושר (`02_tab_executive_approved.html:1496 · 1458 · 1417`),
// אחת לכל רמה — 📐13② מחייב שהדף יאמר מה לחיצה עושה **ברמה שעליה עומדים**.
const ROW_ACTION = [
  'לחיצה על שורה יורדת לחודשים של אותה שנה',
  'לחיצה על שורה יורדת לאירועים של אותו חודש',
  'זו הרמה האחרונה. לחיצה על שורה פותחת את כרטיס האירוע.',
]

const levelOf = (payload) => payload.drill?.level ?? 0

export default function TrendsSurface(props) {
  return (
    <ExecutiveSurface
      {...props}
      renderTop={() => <SurfaceLead hintId="reports.trends.purpose" />}
      renderBeforeChart={(payload) => (
        <ChartLead hintIds={levelOf(payload) === 0 ? ['reports.trends.partialYear'] : []} />
      )}
      renderBeforeTable={(payload) => (
        <>
          {/* §⑩ ג — העוגן הוא ה-`barkey` של לוחות מחיר/עלות, כלומר מיד אחרי הגרף השני.
              🚫 **וה-`barkey` עצמו אינו נכתב כאן:** ההגדרה המלאה כבר יושבת בשורת-ההגדרות
              של המטען (📐16, `Footers`) — *"עלות לשעה = שכר-הבסיס והבונוסים האישיים…
              נסיעות אינן נכללות"*. שכפולה היה שתי הגדרות לאותו מדד באותו דף. */}
          {levelOf(payload) === 0 && <Hint id="reports.trends.costPerHour" />}
          <TableLead rowAction={ROW_ACTION[levelOf(payload)]} hintId="reports.trends.drillPath" />
        </>
      )}
    />
  )
}
