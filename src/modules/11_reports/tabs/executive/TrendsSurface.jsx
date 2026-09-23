// מ3 · **מגמות רב-שנתיות** — *"האם הצמיחה שומרת על שולי-הרווח?"* (`cards-management.md`, שורה 236 · `#p2`).
//
// 🔴 **זהו דוח-הדריל היחיד בלשונית** (📐13): שנה ← חודש ← אירוע. ‏**שלוש הרמות מגיעות
// מפונקציית-שרת אחת מגודרת**, המצב חי בכתובת, והפירורים הם הדרך חזרה — כל זה מהשלד
// (`ReportSurface` · `DrillCrumbs`). מה שהמשטח מוסיף הוא **שורת-הפעולה שמשתנה עם הרמה**
// והרמזים של §⑩.
//
// ✏️ **16/09 18:5X — 📐20 חזר לדף הזה (ממצא #3, בעלות: הלשונית).** נמדד שהשנה החלקית לא
// הוצהרה באף אחד משלושת הערוצים: לא עמודה מקווקוות, לא אורך-חלון בתווית-הציר, ולא הערת-גרף
// — בעוד המטען נושא `partial: true` והשלד כבר יודע לקרוא גם `is_today` וגם `chart.note`.
// 🔴 **וזה בדיוק המקרה ש-📐20 נולד בשבילו:** עמודת-⁦2026⁩ נמוכה מ-⁦2025⁩ **מפני שהשנה טרם
// נגמרה**, ובלי ההצהרה היא נקראת כירידה. הפתרון הוא אותו מנגנון שמ2 כבר מפעיל לחודש חלקי,
// ולכן הוא נגזר לפונקציה משותפת (`chartShape.withPartialSegment`) ולא הועתק.
//
// ✂️ **ומה שנמחק כאן 16/09 11:1X — ‏`toComboChart`:** עד אז המשטח המיר את גרף-השנים ל-`pareto`
// כדי שקו-שולי-הרווח ייצבע בכלל, **במחיר עמודת-הרווח שלא צוירה.** ‏`ChartCard` קיבל
// ‏`ComposedBody` (קומיט `11f347a9`), שקורא `series[].kind`/`axis` ומצייר **את שלוש הסדרות**
// — שתי עמודות-₪ על הציר השמאלי וקו-האחוזים על ציר ימני נעול ⁦0–100⁩ (⑧ 3.4).
// ⇒ **אין כאן `transformPayload` כלל.** אומת חי אחרי המחיקה: ⁦3⁩ `recharts-bar-rectangle`
// ו-⁦1⁩ `recharts-line-curve` בכרטיס הראשון, וציר ימני ⁦0/25/50/75/100⁩.

import { isolateLtr } from '@/lib/reportsFormat'
import { SurfaceHint, TableLead, ExecutiveSurface } from './surfaceKit'
import { shortDate, withCharts, withPartialMonth, withPartialSegment } from './chartShape'

// 🔤 שלוש השורות מילה-במילה מהמוקאפ המאושר (`02_tab_executive_approved.html:1496 · 1458 · 1417`),
// אחת לכל רמה — 📐13② מחייב שהדף יאמר מה לחיצה עושה **ברמה שעליה עומדים**.
const ROW_ACTION = [
  'לחיצה על שורה יורדת לחודשים של אותה שנה',
  'לחיצה על שורה יורדת לאירועים של אותו חודש',
  'זו הרמה האחרונה. לחיצה על שורה פותחת את כרטיס האירוע.',
]

// 🔤 פזה ב׳ שלב 8 (23/09/2026) — שורת-היכולת של הגרף, אחת לכל רמה שיש ממנה לאן לרדת.
// ברמה האחרונה הגרף אינו לחיץ, ולכן אין לה נוסח.
// ⚠️ "שנה"/"חודש" ולא "עמודה" — ברמה 0 שני מתוך שלושת הגרפים הם קווים (נמדד על המסך).
const CHART_ACTION = [
  'לחיצה על שנה בגרף יורדת לחודשים שלה',
  'לחיצה על חודש בגרף יורדת לאירועים שלו',
]

const levelOf = (payload) => payload.drill?.level ?? 0
const chartAction = (payload) => CHART_ACTION[levelOf(payload)] ?? null
const chartCount = (payload) =>
  Array.isArray(payload.chart) ? payload.chart.length : payload.chart ? 1 : 0

/**
 * 📐20 · **רמה 0 — שנה חלקית.** התווית מועתקת מהמוקאפ המאושר מילה-במילה
 * (`02_tab_executive_approved.html:628` — *"‏2026 — עד 10/09"*), והתאריך מבודד כי הוא יושב
 * בתוך עטיפת-ה-`dir="ltr"` של הגרף לצד מילה עברית.
 * 🚫 **ואין כאן "קצב שנתי" משוער** — 📑ב#1 אוסר זאת במפורש, וההערה אומרת זאת בקול.
 */
function withPartialYear(chart, windowTo) {
  const asOf = shortDate(windowTo)
  if (!asOf) return chart
  return withPartialSegment(chart, {
    labelOf: (row, label) => `${label} — עד ${isolateLtr(asOf)}`,
    note: `השנה הנוכחית נספרת עד ${isolateLtr(asOf)} בלבד ומסומנת בדפוס מקווקו — אין כאן «קצב שנתי» משוער, רק מה שכבר קרה. קו שולי-הרווח נמדד על ציר-אחוזים קבוע, כדי ששינוי של נקודה או שתיים לא ייראה כמפולת.`,
  })
}

function transformPayload(payload) {
  const partOfYear = levelOf(payload) === 0
  return withCharts(payload, (chart, index) =>
    // רמה 0: רק גרף-השנים (index 0) נושא תקופה חלקית; הגרף השני הוא סדרת-קצב ולא סכום.
    partOfYear
      ? index === 0
        ? withPartialYear(chart, payload.window?.to)
        : chart
      : withPartialMonth(chart, payload.window?.to),
  )
}

export default function TrendsSurface(props) {
  return (
    <ExecutiveSurface
      {...props}
      transformPayload={transformPayload}
      chartAction={chartAction}
      renderAfterSoWhat={() => <SurfaceHint hintId="reports.trends.purpose" />}
      // §⑩ ב — הרמז מעוגן ל**הערת-הגרף** של גרף-השנים (הראשון), ו-⑩ ג ל-`.barkey` של
      // לוחות מחיר/עלות. 🔑 **ולמה "האחרון" ולא אינדקס קשיח:** במוקאפ ה-`.barkey` יושב
      // **אחרי** ה-`.chart-row` שמחזיק את שני הלוחות (שורות 708–713), כלומר מתחת לאחרון
      // מביניהם — וזה נשאר נכון גם כשמיגרציית `i2` מפצלת את הלוח המשולב לשני כרטיסים
      // נפרדים (⁦2⁩ גרפים ⇐ ⁦3⁩). אינדקס קשיח היה נשבר בשקט ביום שהפיצול נוחת.
      renderChartFooter={(payload, index) => {
        if (levelOf(payload) !== 0) return null
        if (index === 0) return <SurfaceHint hintId="reports.trends.partialYear" />
        return index === chartCount(payload) - 1 ? (
          <SurfaceHint hintId="reports.trends.costPerHour" />
        ) : null
      }}
      renderBeforeTable={(payload) => (
        <TableLead rowAction={ROW_ACTION[levelOf(payload)]} hintId="reports.trends.drillPath" />
      )}
    />
  )
}
