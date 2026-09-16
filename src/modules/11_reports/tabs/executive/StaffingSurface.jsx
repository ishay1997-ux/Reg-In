// מ6 · **קהל מול צוות** — *"כמה דיילות לאורח באמת נדרשו?"* (`cards-management.md`, שורה 523 · `#p4`).
//
// 🔴 **הכרעה 6 היא כל הדף:** ‏`יחס_אורחים_לדיילת` הוא **פרמטר-תכנון ואינו יעד** ⇒ אין בדף
// צבע-חריגה, אין סף ואין אדום (⑧ 6.4). **המשפט הזה כפול בכוונה** — גם בתווית קו-הייחוס
// שהמטען מחזיר וגם בשורת-הבסיס שמתחת להיסטוגרמה (⑩ ג: *"בלעדיו מספר נכון נקרא כציון-כישלון"*).
//
// 🔴 **ופרמטר חסר אינו ברירת-מחדל שקטה** (§7.83 · ת1 ד): המטען מחזיר `meta.missing_params`,
// השלד מצייר *"חסר פרמטר מערכת: …"*, והאריח התלוי בו מגיע עם `value: null` ⇒ `—`.

import ReportSurface from '../../components/ReportSurface'
import { ChartLead, SurfaceLead, SurfaceNote, TableLead } from './surfaceKit'
import { useSurfaceDoors, withCharts, withRowDoors, withTileSubRows } from './surfaceDoors'

// 🔤 מילה-במילה מהמוקאפ המאושר (`02_tab_executive_approved.html:1119`).
const ROW_ACTION = 'לחיצה על שורה פותחת את כרטיס האירוע'
// 🔤 שורת-הבסיס של ההיסטוגרמה — ‏`.barkey` שבמוקאפ (שורות 1111–1113), בלי ספירות-הדאטה
// שהיו בה (§5ג). **היא בסיס ולא שכבת-הטמעה**, ולכן היא נכתבת כאן ולא בקובץ-הקופי.
const NOT_A_TARGET =
  'מה הגרף אינו אומר — פרמטר-התכנון אינו יעד ואינו סף. אירוע ביחס גבוה ממנו אינו «כשל», ואירוע ביחס נמוך ממנו אינו «בזבוז», עד שמישהי תכריע שהוא כזה.'

const numberOf = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0)

/**
 * 🔴 **גרף-הפיזור מגיע עם סדרה אחת, ו-`ScatterBody` צריך שתיים.** הרכיב לוקח את ציר-ה-X
 * מ-`xKey` ואת ציר-ה-Y מ-`series[1].key` — סדרה בודדת הותירה אותו נופל ל-`'y'`, מפתח שאינו
 * קיים באף שורה, ו**כל הנקודות היו נוחתות על אפס**. הצורה נראית תקינה והתמונה שקר.
 * ⇒ סדרת-ה-X נוספת **מתווית-העמודה של אותו שדה** (`columns`), ולא מנוסחת כאן.
 * 🚫 שום סדרה אינה מוסרת; ה-`series` המקורי נשאר במקומו השני.
 */
function withScatterAxes(chart, columns) {
  if (chart.type !== 'scatter' || (chart.series?.length ?? 0) >= 2) return chart
  const label = columns?.find((column) => column.key === chart.xKey)?.label ?? chart.xKey
  return { ...chart, series: [{ key: chart.xKey, label, format: 'int' }, ...(chart.series ?? [])] }
}

/**
 * 📐6 — קו-הייחוס האלכסוני *"ההערכה התקיימה בדיוק"* הוא `y=x`, ולכן הוא חייב להימתח על כל
 * טווח-הדאטה. ‏`ChartCard` נופל ל-`(0,0)–(100,100)` כשהמטען אינו נוקב בקצוות, בעוד הפיזור
 * כאן מגיע עד מאות אורחים ⇒ האלכסון היה נעצר בפינה. **הקצוות נגזרים מהדאטה עצמה.**
 */
function withDiagonalBounds(chart) {
  // 🔑 **נסיגה ולא דריסה:** מיגרציית-התיקון `d2` (‏16/09 08:3X) החלה להחזיר `from`/`to`
  // מחושבים בשרת. קו שכבר נושא קצוות **נשאר כפי שהוא** — דריסת ערך-שרת בערך-לקוח היא
  // בדיוק מה שהופך שני מקורות-אמת לאחד שקרי.
  const needsBounds = chart.refLines?.some((ref) => ref.axis === 'diagonal' && !ref.to)
  if (!needsBounds || !chart.data?.length) return chart
  const yKey = chart.series?.[chart.series.length - 1]?.key
  const max = chart.data.reduce(
    (top, row) => Math.max(top, numberOf(row[chart.xKey]), numberOf(row[yKey])),
    0,
  )
  const refLines = chart.refLines.map((ref) =>
    ref.axis === 'diagonal' && !ref.to
      ? { ...ref, from: { x: 0, y: 0 }, to: { x: max, y: max } }
      : ref,
  )
  return { ...chart, refLines }
}

/**
 * קו-ייחוס מספרי על **ציר-קטגוריה** אינו מצויר כלל — ‏`ReferenceLine x={50}` מחפש קטגוריה
 * ששמה `50` בין `"45–50"` ל-`"50–55"` ואינו מוצא. ⇒ הערך ממופה לדלי שמתחיל בו,
 * כך שתווית-הפרמטר (📐6 · הכרעה 6) נשארת על המסך במקום להיעלם בשקט.
 */
function withCategoryRefLines(chart) {
  if (chart.type !== 'histogram' || !chart.refLines?.length) return chart
  const refLines = chart.refLines.map((ref) => {
    if (ref.axis !== 'x' || typeof ref.value !== 'number') return ref
    const row = chart.data?.find((item) => String(item.bucket ?? '').startsWith(`${ref.value}-`))
    return row ? { ...ref, value: row.label } : ref
  })
  return { ...chart, refLines }
}

function transformPayload(payload) {
  return withCharts(withTileSubRows(payload), (chart) =>
    withCategoryRefLines(withDiagonalBounds(withScatterAxes(chart, payload.columns))),
  )
}

export default function StaffingSurface({ surface, filters, drill, onDrill, onWindow }) {
  const openDoor = useSurfaceDoors(onDrill)

  return (
    <ReportSurface
      surface={withRowDoors(surface)}
      filters={filters}
      drill={drill}
      onDrill={openDoor}
      onWindow={onWindow}
      transformPayload={transformPayload}
      renderTop={() => <SurfaceLead hintId="reports.staffing.purpose" />}
      renderBeforeChart={() => (
        <ChartLead
          note={null}
          hintIds={[
            'reports.staffing.medianRatio',
            'reports.staffing.planningParam',
            'reports.staffing.scatterSample',
          ]}
        />
      )}
      renderBeforeTable={(payload) => (
        <>
          {/* ⑩ ג — שורת-ההיסטוגרמה יושבת מתחת לגרף השני, כלומר מיד לפני הטבלה. */}
          <SurfaceNote testId="report-not-a-target">{NOT_A_TARGET}</SurfaceNote>
          <TableLead payload={payload} rowAction={ROW_ACTION} />
        </>
      )}
    />
  )
}
