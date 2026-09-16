// מ6 · **קהל מול צוות** — *"כמה דיילות לאורח באמת נדרשו?"* (`cards-management.md`, שורה 523 · `#p4`).
//
// 🔴 **הכרעה 6 היא כל הדף:** ‏`יחס_אורחים_לדיילת` הוא **פרמטר-תכנון ואינו יעד** ⇒ אין בדף
// צבע-חריגה, אין סף ואין אדום (⑧ 6.4). **המשפט הזה כפול בכוונה** — גם בתווית קו-הייחוס
// שהמטען מחזיר וגם בשורת-הבסיס שמתחת להיסטוגרמה (⑩ ג: *"בלעדיו מספר נכון נקרא כציון-כישלון"*).
//
// 🔴 **ופרמטר חסר אינו ברירת-מחדל שקטה** (§7.83 · ת1 ד): המטען מחזיר `meta.missing_params`,
// השלד מצייר *"חסר פרמטר מערכת: …"*, והאריח התלוי בו מגיע עם `value: null` ⇒ `—`.
//
// ✏️ **16/09 11:1X — שני ערוצים שהשכבה המשותפת פתחה והמשטח הזה מדליק:**
// ‏① `chart.shape_key` — 📑ב#10 דורש שהסטייה תקודד ב**צורה** (משולש / עיגול-חלול) ולא בגודל
//    ולא בגוון, כי *"קידוד-שטח הוא הקידוד שהעין הגרועה בו ביותר"*. עד עכשיו הערוץ פשוט לא
//    היה קיים ב-`ChartCard`, והנקודות היו אחידות ⇒ **הדרישה לא הייתה מסופקת ולא הייתה גלויה.**
// ‏② `chart.filter_key: false` — הכרטיס מתעד את מ6 כמי ש**אין** בו סינון-צולב (① ושורת-📐13
//    בטבלת-הכיסוי, שם זה נרשם כסטייה מוצהרת). הקרוס-פילטר האוטומטי היה מזהה כאן `estimated`
//    ופותח אינטראקציה שהכרטיס שולל — ולכן היא נסגרת במפורש ולא נשארת לברירת-מחדל.

import { ChartLead, SurfaceLead, SurfaceNote, TableLead, ExecutiveSurface } from './surfaceKit'
import { withCharts, withoutCrossFilter } from './chartShape'

// 🔤 מילה-במילה מהמוקאפ המאושר (`02_tab_executive_approved.html:1119`).
const ROW_ACTION = 'לחיצה על שורה פותחת את כרטיס האירוע'
// 🔤 שורת-הבסיס של ההיסטוגרמה — ‏`.barkey` שבמוקאפ (שורות 1111–1113), בלי ספירות-הדאטה
// שהיו בה (§5ג). **היא בסיס ולא שכבת-הטמעה**, ולכן היא נכתבת כאן ולא בקובץ-הקופי.
const NOT_A_TARGET =
  'מה הגרף אינו אומר — פרמטר-התכנון אינו יעד ואינו סף. אירוע ביחס גבוה ממנו אינו «כשל», ואירוע ביחס נמוך ממנו אינו «בזבוז», עד שמישהי תכריע שהוא כזה.'

// 🔤 שתי תוויות-המקרא של ערוץ-הצורה — **מילה-במילה מהמוקאפ** (`:991-992`: *"נקודה מעליו =
// הגיעו יותר אורחים מהצפי, מתחתיו = הגיעו פחות"*), ולא נוסח-הגיבוי הגנרי של `ChartCard`
// (*"מעל קו-הייחוס"*), שנכתב למטען שאין לו מילים משלו.
const SHAPE_LABELS = Object.freeze({
  on: 'הגיעו יותר אורחים מהצפי',
  off: 'הגיעו כמו הצפי או פחות',
})

const numberOf = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0)

/**
 * 🔴 **גרף-הפיזור מגיע עם סדרה אחת, ו-`ScatterBody` צריך שתיים** (‏`dataKey={series[1]?.key ?? 'y'}`
 * ⇒ סדרה בודדת מפילה את כל הנקודות על אפס, בלי שגיאה ובלי מבחן אדום).
 * ⚠️ **היום זה כבר לא קורה** — מיגרציית `d2` מחזירה זוג-סדרות — ולכן הפונקציה חוזרת ריקה.
 * היא נשארת כ**נסיגה** ולא כקישוט: היום שבו תיקון-שרת יסיר את הסדרה הראשונה הוא היום שבו
 * הגרף ייראה תקין ויהיה שקר.
 */
function withScatterAxes(chart, columns) {
  if (chart.type !== 'scatter' || (chart.series?.length ?? 0) >= 2) return chart
  const label = columns?.find((column) => column.key === chart.xKey)?.label ?? chart.xKey
  return { ...chart, series: [{ key: chart.xKey, label, format: 'int' }, ...(chart.series ?? [])] }
}

/**
 * 📑ב#10 — **ערוץ-הצורה.** ‏`over_estimate` מגיע פר-נקודה מהמטען; כשאינו מגיע הוא **נגזר
 * מאותה הגדרה בדיוק** ש-⑦ מ6 נוקב בה — `actual > estimated`, חמור, **ורק כששני המספרים
 * קיימים** (אירוע בלי אחד מהם אינו "לא חרג", הוא אינו נמדד).
 * 🚫 הגזירה כאן אינה מדד חדש: היא מפתח-תצוגה לאותה עובדה שהאריח *"אירועים מעל הצפי"* סופר.
 */
function withShapeChannel(chart) {
  if (chart.type !== 'scatter' || !chart.data?.length) return chart
  const yKey = chart.series?.[chart.series.length - 1]?.key ?? 'actual'
  const data = chart.data.map((row) =>
    Object.hasOwn(row, 'over_estimate')
      ? row
      : {
          ...row,
          over_estimate:
            row[chart.xKey] != null &&
            row[yKey] != null &&
            numberOf(row[yKey]) > numberOf(row[chart.xKey]),
        },
  )
  return { ...chart, data, shape_key: 'over_estimate', shape_labels: SHAPE_LABELS }
}

/**
 * 📐6 — קו-הייחוס האלכסוני *"ההערכה התקיימה בדיוק"* הוא `y=x` וחייב להימתח על טווח-הדאטה;
 * ‏`ChartCard` נופל ל-`(0,0)–(100,100)` כשאין קצוות. 🔑 **נסיגה ולא דריסה:** מ-`d2` השרת
 * מחזיר `from`/`to`, וקו שכבר נושא קצוות נשאר כפי שהוא.
 */
function withDiagonalBounds(chart) {
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
 * ששמה `50` בין `"45–50"` ל-`"50–55"` ואינו מוצא. ⇒ הערך ממופה לדלי שמתחיל בו.
 * ⚠️ גם כאן `d2` כבר מחזיר `'50–55'`, והפונקציה היא נסיגה.
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
  return withCharts(payload, (chart) =>
    withoutCrossFilter(
      withCategoryRefLines(
        withShapeChannel(withDiagonalBounds(withScatterAxes(chart, payload.columns))),
      ),
    ),
  )
}

export default function StaffingSurface(props) {
  return (
    <ExecutiveSurface
      {...props}
      transformPayload={transformPayload}
      renderTop={() => <SurfaceLead hintId="reports.staffing.purpose" />}
      renderBeforeChart={() => (
        <ChartLead
          hintIds={[
            'reports.staffing.medianRatio',
            'reports.staffing.planningParam',
            'reports.staffing.scatterSample',
          ]}
        />
      )}
      renderBeforeTable={() => (
        <>
          {/* ⑩ ג — שורת-ההיסטוגרמה יושבת מתחת לגרף השני, כלומר מיד לפני הטבלה. */}
          <SurfaceNote testId="report-not-a-target">{NOT_A_TARGET}</SurfaceNote>
          <TableLead rowAction={ROW_ACTION} />
        </>
      )}
    />
  )
}
