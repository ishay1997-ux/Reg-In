// 🔴 **כרטיס-הגרף — הגרף הראשון בריפו הזה.** ‏`recharts@3.10.1` מותקן מאז 05/09/2026 עם
// **אפס שימושים ב-`src/`** (נמדד), ולכן כל מוסכמת-גרף במערכת נקבעת כאן ואינה נורשת.
// כל מה שלמטה מציית ל-12 העקרונות של `design-contract §⑤` + `stage2-review/
// m11-charts-rtl-a11y.md`, ומספר-הסעיף כתוב ליד כל אחד.
//
// 🔑 **מדוע כרטיס אחד לכל שבעת סוגי-הגרף ולא שבעה רכיבים:** שישה-עשר משטחים × שבעה סוגים
// היו מפוצצים את jscpd (סף 3%) הרבה לפני שמישהו שם לב — ו§⑤ אינו "סגנון", הוא **חוזה**:
// עטיפת-LTR · טבלת-קורא-מסך · טולטיפ-עברי · צבעים · ציר-מאפס. חוזה שמיושם שבע פעמים סוטה.
//
// 🔬 **מדידה שרצה 16/09/2026 ומשנה את המימוש, לא רק את התיעוד:** ולידטור-פלטה על שלושת
// צבעי-§① החזיר על הצמד **טורקיז `#009689` ↔ סלייט `#62748E`**: ‏`ΔE 11.5` בראייה תקינה
// (מתחת ל-15) ו-`ΔE 6.0` בדויטרנופיה. ⇒ **הבחנה בגוון-בלבד אינה קריאה גם לבעל ראייה מלאה**,
// וזה בדיוק מה ש§⑤ #9 ו-📐19 כבר דורשים. ⇒ **מקרא + דפוס-מילוי (hatch) אינם רשות כאן** —
// כל סדרה שנייה ואילך נושאת דפוס, תמיד. 🚫 **הפלטה עצמה לא שונתה** — היא הכרעה מתועדת
// (כלל-ברזל 8); המדידה מחזקת את החובה לקידוד-משני ואינה מתירה להמציא גוון.

import { useId } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Label,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { formatByType } from '@/lib/reportsFormat'

// 🎨 **שלושה צבעים, ואין רביעי** (§⑤ · §①): טורקיז לסדרה-עיקרית · אפור-סלייט לתקופה-קודמת/
// סדרה-משנית · אדום **רק** לערך שחוצה סף מוגדר (כלל-המילוי §④).
// 🚫 בלי ירוק, בלי כתום, בלי גרדיאנטים (`grep gradient src/` = 0, אומת 06/09/2026).
const SERIES_COLORS = ['#009689', '#62748E']
const OVER_THRESHOLD = '#E7000B'
// ‏`slate-400` — ל**קווי-רשת וצירים בלבד**, לעולם לא לטקסט על לבן (§⑤ #10: יחס 2.63:1).
const AXIS_COLOR = '#90A1B9'
// טקסט-בתוך-גרף יורד דרגה אחת, בדיוק כפי ש§⑥ תיקן (`--s400` → `--s500`) מאותו נימוק.
const AXIS_TEXT = '#62748E'

const seriesColor = (index) => SERIES_COLORS[index % SERIES_COLORS.length]

/**
 * שקילות-מקלדת לקרוס-פילטר — **הפער שהתיעוד מסמן ואינו פותר** (§⑤ #7 · Issues #1946/#4809):
 * ‏`onClick` על `<Bar>`/`<Cell>` אינו הופך אוטומטית ל"ניתן-להפעלה עם Enter/Space", ו-
 * `accessibilityLayer` מזיז בין נקודות בחצים אך אינו **מפעיל** אותן.
 *
 * ⇒ **הפתרון שנבנה כאן, ואינו המצאה אלא דפוס-דילוג מוכר:** טבלת-קורא-המסך (§⑤ #6) שממילא
 * חייבת להיות שם נושאת `<button>` בכל שורה, והמעטפת שלה `sr-only focus-within:not-sr-only`
 * — כלומר משתמשת-מקלדת שמגיעה אליה **רואה** אותה נפרשת, ולוחצת Enter על כל קטגוריה.
 * 🔑 זה גם מה שהופך את הטבלה מ"נספח לקורא-מסך" ל**נתיב-הפעלה אמיתי**, במקום שני מנגנונים.
 */
function AccessibleDataTable({ title, xKey, series, data, onSelect, unit }) {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:my-2 focus-within:block">
      <table className="w-full border-collapse text-xs">
        <caption className="text-right text-slate-600">{title}</caption>
        <thead>
          <tr>
            <th scope="col" className="px-2 py-1 text-right">
              קטגוריה
            </th>
            {series.map((s) => (
              <th key={s.key} scope="col" className="px-2 py-1 text-right">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={`${row[xKey]}-${index}`}>
              <th scope="row" className="px-2 py-1 text-right font-normal">
                {onSelect ? (
                  <button
                    type="button"
                    onClick={() => onSelect(row, index)}
                    className="font-semibold text-teal-700 underline"
                    data-testid={`chart-select-${index}`}
                  >
                    {row[xKey]}
                  </button>
                ) : (
                  row[xKey]
                )}
              </th>
              {series.map((s) => (
                <td key={s.key} className="px-2 py-1 text-right">
                  {formatByType(row[s.key], s.format ?? unit)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * טולטיפ עברי — `content` מותאם ולא ברירת-המחדל של הספרייה (§⑤, עקרון-הטולטיפ).
 * 🔴 **`dir="rtl"` נכתב על התיבה עצמה ואינו נסמך על ירושה:** הגרף כולו יושב בתוך
 * `dir="ltr"`, ולכן ירושה כאן פירושה טולטיפ עברי הפוך.
 * ⚠️ **וכל ערך בשורה נפרד** — §⑤ #4: שני ערכים-צמודים באותה תווית מפוצלים למשפטים נפרדים
 * ולא מבודדים כרצף.
 */
function HebrewTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div
      dir="rtl"
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-xs shadow-sm"
      data-testid="chart-tooltip"
    >
      <p className="mb-1 font-semibold text-slate-700">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-slate-600">
          {entry.name}: {formatByType(entry.value, entry.unit ?? unit)}
        </p>
      ))}
    </div>
  )
}

function axisProps(extra = {}) {
  return {
    tick: { fontSize: 11, fill: AXIS_TEXT },
    stroke: AXIS_COLOR,
    ...extra,
  }
}

// 📐5 — ערכי-ציר עגולים **וציר-ערך שמתחיל באפס**. `domain` מגיע מה-RPC (C8) כשהסולם ידוע
// מראש (0–100 למצטבר/אחוז · 1–5 לציון); כשאינו מגיע — `[0, 'auto']`, **לעולם לא קטיעה**.
// 🚫 קטיעת-ציר מנפחת את גודל-האפקט הנתפס, וסימון-קטיעה אינו מנטרל זאת (arXiv 1907.02035).
function valueDomain(domain) {
  return Array.isArray(domain) && domain.length === 2 ? domain : [0, 'auto']
}

function renderRefLines(refLines, yAxisId) {
  return (refLines ?? []).map((ref, index) => {
    // 🔴 **התווית נמסרת כ-`<Label>` ולא כאובייקט-`label`** — נמדד בדפדפן 16/09/2026:
    // הצורה `label={{ value, position }}` **אינה מרנדרת טקסט כלל** על `ReferenceLine`
    // ב-Recharts 3.10.1 (‏0 צמתי-`text` בתוך `.recharts-reference-line`), וקו-הייחוס נחת
    // בלי השם שלו. ‏📐6 דורש תווית נקובה (*"חלוקה שווה"* על קו-השוויון), ולכן זה פגם
    // ולא קישוט. **הצורה שעובדת היא רכיב-ילד.**
    const labelNode = ref.label ? (
      <Label value={ref.label} position="insideTopRight" fill={AXIS_TEXT} fontSize={11} />
    ) : null
    const common = {
      stroke: AXIS_COLOR,
      strokeDasharray: '4 4',
      ...(yAxisId ? { yAxisId } : {}),
    }
    // ⚠️ `key` נמסר **מפורשות ולא דרך spread** — React מזהיר על `key` בתוך אובייקט-פרופס
    // מפוזר, והאזהרה נמדדה בפועל בקונסולה בריצת-האימות. `key` בתוך spread אינו מפתח.
    const key = `ref-${index}`

    // 📐6: קו-השוויון בלורנץ הוא **אלכסון 1:1** — `ReferenceLine` תומך בזה דרך `segment`,
    // ולא דרך `y=` שהוא אופקי בלבד. בלי זה הלורנץ מצויר בלי הבסיס שהוא נמדד מולו.
    if (ref.axis === 'diagonal') {
      return (
        <ReferenceLine
          key={key}
          {...common}
          segment={[
            { x: ref.from?.x ?? 0, y: ref.from?.y ?? 0 },
            { x: ref.to?.x ?? 100, y: ref.to?.y ?? 100 },
          ]}
        >
          {labelNode}
        </ReferenceLine>
      )
    }
    if (ref.axis === 'x') {
      return (
        <ReferenceLine key={key} {...common} x={ref.value}>
          {labelNode}
        </ReferenceLine>
      )
    }
    return (
      <ReferenceLine key={key} {...common} y={ref.value}>
        {labelNode}
      </ReferenceLine>
    )
  })
}

// 🔴 **דפוס-מילוי לסדרה שנייה ואילך** — ר' המדידה בכותרת. הדפוס מוגדר פר-כרטיס (`useId`)
// כי שני כרטיסים באותו דף היו מתנגשים על אותו `id` ב-SVG, והשני היה מקבל את הדפוס של הראשון.
function HatchDefs({ idPrefix, series }) {
  return (
    <defs>
      {series.map((s, index) =>
        index === 0 ? null : (
          <pattern
            key={s.key}
            id={`${idPrefix}-hatch-${index}`}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill={seriesColor(index)} opacity="0.25" />
            <line x1="0" y1="0" x2="0" y2="6" stroke={seriesColor(index)} strokeWidth="3" />
          </pattern>
        ),
      )}
    </defs>
  )
}

const fillFor = (idPrefix, index) =>
  index === 0 ? seriesColor(0) : `url(#${idPrefix}-hatch-${index})`

function BarSeries({ idPrefix, data, xKey, series, onSelect, stacked }) {
  return series.map((s, index) => (
    <Bar
      key={s.key}
      dataKey={s.key}
      name={s.label}
      stackId={stacked ? 'a' : undefined}
      fill={fillFor(idPrefix, index)}
      radius={[4, 4, 0, 0]}
      cursor={onSelect ? 'pointer' : undefined}
      onClick={onSelect ? (_, barIndex) => onSelect(data[barIndex], barIndex) : undefined}
    >
      {/* כלל-המילוי §④: **אדום יחיד** לערך שחוצה סף מוגדר; שאר העמודות אינן משנות גוון.
          ‏`over_threshold` מגיע פר-שורה מה-RPC — הסף מוכרע בשרת, לא נגזר במסך. */}
      {index === 0 &&
        data.map((row, rowIndex) => (
          <Cell
            key={`${row[xKey]}-${rowIndex}`}
            fill={row.over_threshold ? OVER_THRESHOLD : seriesColor(0)}
          />
        ))}
    </Bar>
  ))
}

function LineSeries({ series, onSelect }) {
  return series.map((s, index) => (
    <Line
      key={s.key}
      type="monotone"
      dataKey={s.key}
      name={s.label}
      stroke={seriesColor(index)}
      strokeWidth={2}
      // 🔴 קידוד-משני לקו: הפער בגוון בין טורקיז לסלייט נמדד כבלתי-מספיק (ר' הכותרת).
      strokeDasharray={index === 0 ? undefined : '6 3'}
      dot={{ r: 3 }}
      activeDot={{
        r: 5,
        onClick: onSelect ? (_, payload) => onSelect(payload?.payload) : undefined,
      }}
    />
  ))
}

// 🔑 **סוג-גרף אחד = פונקציה אחת.** הפיצול אינו סגנון: `ChartBody` אחד ששולט בשבעת
// הסוגים נמדד ב-30 במורכבות-קוגניטיבית מול תקרת-20 של SonarJS — כלומר **גלאי-הספגטי של
// הריפו זיהה נכון** שאף קורא לא מחזיק שבעה ענפים בראש בבת-אחת.

// חלקים שחוזרים בכל הסוגים, מוגדרים פעם אחת (jscpd יתפוס אותם כפולים בשבעה מקומות).
const commonGrid = () => <CartesianGrid stroke="#F1F5F9" vertical={false} />
const commonTooltip = (unit) => (
  <Tooltip content={<HebrewTooltip unit={unit} />} cursor={{ fill: '#F1F5F9' }} />
)
// ⚠️ `reversed={false}` מפורש: ציר-הזמן רץ LTR בתוך עמוד RTL — **הכרעה קיימת** (ת1,
// *"ינואר משמאל… כמו אקסל ובנק-ישראל"*), לא בחירה של הרכיב.
const categoryAxis = (xKey) => <XAxis dataKey={xKey} reversed={false} {...axisProps()} />

const CHART_MARGIN = { top: 8, right: 8, bottom: 4, left: 4 }

function ScatterBody({ chart, onSelect }) {
  const { data = [], xKey, series = [], domain, refLines, unit } = chart
  return (
    <ScatterChart accessibilityLayer margin={CHART_MARGIN}>
      {commonGrid()}
      {/* §5.2ב: `type="number"` מפורש — ברירת-המחדל של Recharts היא `category`, וזו
          הטעות הנפוצה שמייצרת ציר שגוי בפיזור. */}
      <XAxis dataKey={xKey} type="number" name={series[0]?.label} {...axisProps()} />
      <YAxis
        dataKey={series[1]?.key ?? 'y'}
        type="number"
        name={series[1]?.label}
        domain={valueDomain(domain)}
        {...axisProps()}
      />
      <ZAxis dataKey="z" range={[40, 260]} />
      {renderRefLines(refLines)}
      {commonTooltip(unit)}
      <Scatter
        data={data}
        fill={seriesColor(0)}
        cursor={onSelect ? 'pointer' : undefined}
        onClick={onSelect ? (point) => onSelect(point?.payload ?? point) : undefined}
      />
    </ScatterChart>
  )
}

function ParetoBody({ chart, idPrefix, onSelect }) {
  const { data = [], xKey, series = [], domain, refLines, unit } = chart
  // ⚠️ **שני צירי-Y — וזו סטייה מודעת מכלל כללי של "ציר אחד".** §5.2ב מכתיב
  // `ComposedChart` עם `Bar` שמאלי ו-`Line` מצטבר ימני, ו-📐6 נועל את הימני ל-0–100.
  // **חוזה-העיצוב גובר** (הוא ה-SSOT לאיך מצוירים גרפי מ11), והפער מדווח ולא מוכרע כאן.
  return (
    <ComposedChart data={data} accessibilityLayer margin={CHART_MARGIN}>
      <HatchDefs idPrefix={idPrefix} series={series} />
      {commonGrid()}
      {categoryAxis(xKey)}
      <YAxis yAxisId="left" domain={valueDomain(domain)} {...axisProps()} />
      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} {...axisProps()} />
      {renderRefLines(refLines, 'right')}
      {commonTooltip(unit)}
      <Bar
        yAxisId="left"
        dataKey={series[0]?.key}
        name={series[0]?.label}
        fill={seriesColor(0)}
        radius={[4, 4, 0, 0]}
        cursor={onSelect ? 'pointer' : undefined}
        onClick={onSelect ? (_, index) => onSelect(data[index], index) : undefined}
      />
      <Line
        yAxisId="right"
        type="monotone"
        dataKey={series[1]?.key}
        name={series[1]?.label}
        stroke={seriesColor(1)}
        strokeWidth={2}
        strokeDasharray="6 3"
        dot={false}
      />
    </ComposedChart>
  )
}

function LineBody({ chart, onSelect }) {
  const { type, data = [], xKey, series = [], domain, refLines, unit } = chart
  const lorenz = type === 'lorenz'
  return (
    <LineChart data={data} accessibilityLayer margin={CHART_MARGIN}>
      {commonGrid()}
      {/* לורנץ: ציר-X מצטבר מספרי 0–100, לא קטגוריה — אחרת קו-השוויון האלכסוני מאבד זווית. */}
      {lorenz ? (
        <XAxis dataKey={xKey} type="number" domain={[0, 100]} {...axisProps()} />
      ) : (
        categoryAxis(xKey)
      )}
      <YAxis domain={lorenz ? [0, 100] : valueDomain(domain)} {...axisProps()} />
      {renderRefLines(refLines)}
      {commonTooltip(unit)}
      {LineSeries({ series, onSelect })}
    </LineChart>
  )
}

function BarBody({ chart, idPrefix, onSelect }) {
  const { type, data = [], xKey, series = [], domain, refLines, unit, layout } = chart
  return (
    <BarChart
      data={data}
      accessibilityLayer
      margin={CHART_MARGIN}
      // §5.2ב: היסטוגרמה = `BarChart` על דליים מחושבים-מראש, עם `barCategoryGap={0}`
      // לרצף-חזותי. אין ב-Recharts primitive ייעודי.
      barCategoryGap={type === 'histogram' ? 0 : '20%'}
      layout={layout === 'horizontal' ? 'vertical' : 'horizontal'}
    >
      <HatchDefs idPrefix={idPrefix} series={series} />
      {commonGrid()}
      {categoryAxis(xKey)}
      <YAxis domain={valueDomain(domain)} {...axisProps()} />
      {renderRefLines(refLines)}
      {commonTooltip(unit)}
      {BarSeries({ idPrefix, data, xKey, series, onSelect, stacked: type === 'stackedBar' })}
    </BarChart>
  )
}

// מפת-הסוגים. 🔑 **טבלה ולא `switch`** — הוספת סוג היא שורה, ולא ענף נוסף בפונקציה
// שכבר נמדדה כמורכבת-מדי.
const CHART_BODIES = {
  scatter: ScatterBody,
  pareto: ParetoBody,
  line: LineBody,
  lorenz: LineBody,
  bar: BarBody,
  stackedBar: BarBody,
  histogram: BarBody,
}

function ChartBody({ chart, idPrefix, onSelect }) {
  // סוג לא-מוכר נופל ל-`bar` ואינו מפיל את המסך — אותו עיקרון כמו `format` לא-מוכר
  // ב-`reportsFormat`: שרת שהוסיף סוג לפני שהלקוח מכיר אותו מקבל תצוגה סבירה.
  const Body = CHART_BODIES[chart.type] ?? BarBody
  return <Body chart={chart} idPrefix={idPrefix} onSelect={onSelect} />
}

/**
 * מקרא — **מחוץ לעטיפת-ה-LTR**, ולכן לא `<Legend>` של Recharts.
 * 🔑 שתי סיבות, שתיהן מדודות: ① §⑤ #2 — טקסט עברי נשאר בזרימת-ה-RTL של הכרטיס ·
 * ② ה"דגימה" חייבת להראות את **הדפוס** ולא רק את הגוון, כי הגוון לבדו נמדד כבלתי-מספיק.
 */
function ChartLegend({ series }) {
  if (series.length < 2) return null
  return (
    <ul
      className="mb-2 flex flex-wrap gap-3 text-[11.5px] text-slate-600"
      data-testid="chart-legend"
    >
      {series.map((s, index) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-4 rounded-sm"
            style={
              index === 0
                ? { background: seriesColor(0) }
                : {
                    background: `repeating-linear-gradient(45deg, ${seriesColor(index)} 0 3px, transparent 3px 6px)`,
                    outline: `1px solid ${seriesColor(index)}`,
                  }
            }
          />
          {s.label}
        </li>
      ))}
    </ul>
  )
}

/**
 * ‏`chart` — אובייקט-גרף של C8:
 * `{ type, title, series: [{key,label,format?}], data, xKey, domain, refLines, unit }`.
 * ‏`soWhat` — שורת-📐23, **מחוץ** לעטיפת-ה-LTR ומתחת לגרף.
 * ‏`onSelect(row, index)` — קרוס-פילטר; מחווט גם לעכבר (Cell/Bar) וגם למקלדת (הטבלה).
 */
export default function ChartCard({ chart, soWhat, height = 260, onSelect }) {
  const idPrefix = useId().replace(/:/g, '')
  if (!chart) return null
  const { title, series = [], data = [], xKey = 'x', unit } = chart

  return (
    <div
      className="mb-4 rounded-xl border border-slate-200 bg-white p-4"
      data-testid={`chart-card-${chart.type}`}
    >
      {/* §⑤ #2 — הכותרת העברית נשארת **מחוץ** לעטיפת-ה-LTR, ברמת הכרטיס. */}
      <h3 className="mb-2.5 text-[13.5px] font-semibold text-slate-700">{title}</h3>
      <ChartLegend series={series} />

      {/* §⑤ #1 — `dir="ltr"` על ה-div העוטף ולא על `<BarChart>`: Recharts אינו מכבד `dir`
          שיורש מהורה (Issues #263/#682/#4214).
          §⑤ #8 — **גובה מפורש על ההורה**, לא `h-full`/`flex-1`: הורה בלי גובה ⇒ הגרף מקבל
          `height=0` ולא מצייר כלום, לפעמים רק בדפדפן אחד.
          §⑤ #6 — `role="figure"` + `aria-label` על מעטפת-הגרף. */}
      <div
        dir="ltr"
        role="figure"
        aria-label={`${title}, גרף`}
        style={{ height }}
        data-testid="chart-figure"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ChartBody chart={chart} idPrefix={idPrefix} onSelect={onSelect} />
        </ResponsiveContainer>
      </div>

      {/* §⑤ #6 — אותם נתונים כטבלה לקורא-מסך; וגם נתיב-ההפעלה במקלדת (ר' הערת-הרכיב). */}
      <AccessibleDataTable
        title={title}
        xKey={xKey}
        series={series}
        data={data}
        unit={unit}
        onSelect={onSelect}
      />

      {soWhat && (
        // 📐23 · הכרעה 15-ג: שורת-"אז מה" — **בלי מילוי-רקע**, קו-ימני דק בלבד.
        <p
          className="mt-3 border-r-[3px] border-teal-600 px-3.5 py-1.5 text-[13px] font-semibold text-teal-700"
          data-testid="chart-so-what"
        >
          {soWhat}
        </p>
      )}
    </div>
  )
}
