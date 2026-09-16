// מ3 · **מגמות רב-שנתיות** — *"האם הצמיחה שומרת על שולי-הרווח?"* (`cards-management.md`, שורה 236 · `#p2`).
//
// 🔴 **זהו דוח-הדריל היחיד בלשונית** (📐13): שנה ← חודש ← אירוע. ‏**שלוש הרמות מגיעות
// מפונקציית-שרת אחת מגודרת**, המצב חי בכתובת, והפירורים הם הדרך חזרה — כל זה מהשלד
// (`ReportSurface` · `DrillCrumbs`). מה שהמשטח מוסיף הוא **שורת-הפעולה שמשתנה עם הרמה**
// והרמזים של §⑩.
//
// ⚠️ **ופער אמיתי בין המטען לרכיב-הגרף, שמדווח ואינו נסתר:** ה-RPC מחזיר לרמה 0 גרף-משולב
// בן **שלוש** סדרות — שתי עמודות-₪ וקו-אחוזים על ציר ימני נעול `0–100` (⑧ 3.4, **הכרעה
// סגורה**). ‏`ChartCard` נושא `pareto` = עמודה אחת + קו אחד, ואין בו טיפוס של "שתי עמודות
// וקו". ⇒ **מצויר הצמד שעונה על שאלת-הכותרת** (הכנסה מול שולי-רווח), **והרווח הגולמי נשאר
// בעמודה בטבלה שמתחת** — ונאמר כך בהערת-הגרף, כדי שהכותרת לא תבטיח סדרה שאינה מצוירת.

import Hint from '@/components/Hint'
import { formatIsraelDate, isolateLtr } from '@/lib/reportsFormat'
import ReportSurface from '../../components/ReportSurface'
import { ChartLead, SurfaceLead, TableLead } from './surfaceKit'
import { useSurfaceDoors, withCharts, withLabelAxis, withTileSubRows } from './surfaceDoors'

// 🔤 שלוש השורות מילה-במילה מהמוקאפ המאושר (`02_tab_executive_approved.html:1496 · 1458 · 1417`),
// אחת לכל רמה — 📐13② מחייב שהדף יאמר מה לחיצה עושה **ברמה שעליה עומדים**.
const ROW_ACTION = [
  'לחיצה על שורה יורדת לחודשים של אותה שנה',
  'לחיצה על שורה יורדת לאירועים של אותו חודש',
  'זו הרמה האחרונה. לחיצה על שורה פותחת את כרטיס האירוע.',
]

const levelOf = (payload) => payload.drill?.level ?? 0

/**
 * ממיר את גרף-השנים לצורה ש-`ChartCard` באמת מצייר — ר' הערת-הכותרת.
 * 🔴 **ו-`domain` חייב לרדת יחד עם ההמרה:** ‏`ParetoBody` מוסר את `domain` של המטען
 * ל**ציר השמאלי** (₪), בעוד השרת שלח `[0,100]` עבור ציר-האחוזים הימני. השארתו הייתה
 * חותכת עמודה של ⁦2,245,400⁩ ₪ לגובה ⁦100⁩ — גרף שנראה תקין לחלוטין ואינו נכון.
 * ‏`ParetoBody` נועל את הציר הימני ל-`[0,100]` בעצמו, ולכן ⑧ 3.4 נשמר במלואו.
 */
function toComboChart(chart, index) {
  if (index !== 0 || chart.type !== 'bar') return chart
  const bar = chart.series?.find((s) => s.kind !== 'line' && s.axis !== 'right')
  const line = chart.series?.find((s) => s.axis === 'right')
  if (!bar || !line) return chart
  return { ...chart, type: 'pareto', domain: null, series: [bar, line] }
}

function transformPayload(payload) {
  return withCharts(withTileSubRows(payload), (chart, index) =>
    toComboChart(withLabelAxis(chart), index),
  )
}

function yearChartNote(payload) {
  if (levelOf(payload) !== 0) return null
  const charts = Array.isArray(payload.chart) ? payload.chart : [payload.chart]
  const partial = charts[0]?.data?.find((row) => row.partial)
  const asOf = formatIsraelDate(payload.window?.to)
  const partialSentence = partial
    ? `${isolateLtr(String(partial.year))} היא שנה חלקית — נספרת עד ${asOf} בלבד, ואין כאן «קצב שנתי» משוער. `
    : ''
  return `${partialSentence}קו שולי-הרווח נמדד על ציר-אחוזים קבוע, כדי ששינוי של נקודה או שתיים לא ייראה כמפולת; הרווח הגולמי עצמו מופיע בעמודה בטבלה שמתחת.`
}

export default function TrendsSurface({ surface, filters, drill, onDrill, onWindow }) {
  const openDoor = useSurfaceDoors(onDrill)

  return (
    <ReportSurface
      surface={surface}
      filters={filters}
      drill={drill}
      onDrill={openDoor}
      onWindow={onWindow}
      transformPayload={transformPayload}
      renderTop={() => <SurfaceLead hintId="reports.trends.purpose" />}
      renderBeforeChart={(payload) => (
        <ChartLead
          note={yearChartNote(payload)}
          hintIds={levelOf(payload) === 0 ? ['reports.trends.partialYear'] : []}
        />
      )}
      renderBeforeTable={(payload) => (
        <>
          {/* §⑩ ג — העוגן הוא ה-`barkey` של לוחות מחיר/עלות, כלומר מיד אחרי הגרף השני.
              🚫 **וה-`barkey` עצמו אינו נכתב כאן:** ההגדרה המלאה כבר יושבת בשורת-ההגדרות
              של המטען (📐16, `Footers`) — *"עלות לשעה = שכר-הבסיס והבונוסים האישיים…
              נסיעות אינן נכללות"*. שכפולה היה שתי הגדרות לאותו מדד באותו דף. */}
          {levelOf(payload) === 0 && <Hint id="reports.trends.costPerHour" />}
          <TableLead
            payload={payload}
            rowAction={ROW_ACTION[levelOf(payload)]}
            hintId="reports.trends.drillPath"
          />
        </>
      )}
    />
  )
}
