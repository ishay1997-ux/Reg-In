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

import { useId, useState } from 'react'
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
import { formatAxisTick, formatByType } from '@/lib/reportsFormat'
import { EMPTY_AFTER_FILTER } from './reportsCopy'

// 🎨 **שלושה צבעים, ואין רביעי** (§⑤ · §①): טורקיז לסדרה-עיקרית · אפור-סלייט לתקופה-קודמת/
// סדרה-משנית · אדום **רק** לערך שחוצה סף מוגדר (כלל-המילוי §④).
// 🚫 בלי ירוק, בלי כתום, בלי גרדיאנטים (`grep gradient src/` = 0, אומת 06/09/2026).
const SERIES_COLORS = ['#009689', '#62748E']
const OVER_THRESHOLD = '#E7000B'
// ‏`slate-300` — **עמודה שאינה נבחרת בסינון-צולב** (הכרעה 15-ד). 🚫 אין כאן גוון רביעי:
// זו אותה משפחת-סלייט של §①, בדרגה שהמוקאפ המאושר נוקב בה.
const UNSELECTED = '#CAD5E2'
// ‏`slate-400` — ל**קווי-רשת וצירים בלבד**, לעולם לא לטקסט על לבן (§⑤ #10: יחס 2.63:1).
const AXIS_COLOR = '#90A1B9'
// טקסט-בתוך-גרף יורד דרגה אחת, בדיוק כפי ש§⑥ תיקן (`--s400` → `--s500`) מאותו נימוק.
const AXIS_TEXT = '#62748E'

const seriesColor = (index) => SERIES_COLORS[index % SERIES_COLORS.length]

/**
 * 🚫 **דאטום שכל סדרותיו אפס אינו דלת-סינון** — הכרטיס נוקב בזה מפורשות: *עמודה שספירתה ⁦0⁩
 * מראה `cursor: not-allowed` ואינה עושה דבר*.
 *
 * 🔴 **ולמה זה מבחן אחד ולא שלושה:** אותה שאלה נשאלת בשלושה מקומות — הגוון-והסמן על התא,
 * ה-`onClick` על העמודה, והכפתור בטבלת-קורא-המסך. שלושה עותקים היו מתפצלים ביום שבו אחד
 * מהם יתוקן, והמשתמשת הייתה מקבלת סמן-חסום על עמודה שכן נלחצת (או להפך).
 * ⚠️ **המבחן הוא על כל הסדרות ולא על הראשונה בלבד** — בגרף-מוערם עמודה "ריקה" היא זו שכל
 * הנדבכים שלה אפס; נדבך אחד ריק אינו מרוקן את הקטגוריה.
 */
function isEmptyDatum(row, series) {
  return !(series ?? []).some((s) => {
    const value = Number(row?.[s.key])
    return Number.isFinite(value) && value !== 0
  })
}

// 🔑 **`onSelect` שמסנן בעצמו** — כך שאף אתר-קריאה אינו צריך לזכור את המבחן שמעליו.
function guardedSelect(onSelect, series) {
  if (!onSelect) return undefined
  return (row, index) => {
    if (isEmptyDatum(row, series)) return
    onSelect(row, index)
  }
}

/**
 * שקילות-מקלדת לקרוס-פילטר — **הפער שהתיעוד מסמן ואינו פותר** (§⑤ #7 · Issues #1946/#4809):
 * ‏`onClick` על `<Bar>`/`<Cell>` אינו הופך אוטומטית ל"ניתן-להפעלה עם Enter/Space", ו-
 * `accessibilityLayer` מזיז בין נקודות בחצים אך אינו **מפעיל** אותן.
 *
 * ⇒ **הפתרון שנבנה כאן, ואינו המצאה אלא דפוס-דילוג מוכר:** טבלת-קורא-המסך (§⑤ #6) שממילא
 * חייבת להיות שם נושאת `<button>` בכל שורה — כלומר משתמשת-מקלדת שמגיעה אליה **רואה** אותה
 * נפרשת, ולוחצת Enter על כל קטגוריה.
 * 🔑 זה גם מה שהופך את הטבלה מ"נספח לקורא-מסך" ל**נתיב-הפעלה אמיתי**, במקום שני מנגנונים.
 *
 * 🔴 **ולמה הפרישה היא `absolute` ולא `focus-within:not-sr-only` — נמדד ע"י סוכן-ה-E2E
 * 16/09/2026, וזו בדיוק המלכודת של "משטח צף שנסגר ב-blur" (`e2e/CLAUDE.md §3`):**
 * ‏`not-sr-only` מחזיר את הטבלה ל**זרימת-המסמך**, ולכן פרישתה **דוחפת למטה** את כל מה
 * שמתחתיה — הצ'יפ *"× נקי בחירה"* ביניהם. לחיצת-עכבר על הצ'יפ מוציאה פוקוס מהטבלה
 * ב-`mousedown`, הטבלה מתקפלת, הדף **נע כלפי מעלה בין `mousedown` ל-`mouseup`**, ואירוע
 * ה-`click` **אינו נורה כלל**. ⇒ המצב הפרוש הוא **שכבה מעל** (`absolute`) — הפריסה מתחת
 * אינה זזה, ולכן אין ריפלואו ואין לחיצה אבודה. ‏`sr-only` עצמו כבר `position:absolute`,
 * כלומר שני המצבים מחוץ-לזרימה והמעבר ביניהם אינו מזיז דבר.
 * ⚠️ **ומצב-הפריסה נשמר ב-`state` ולא ב-`focus-within`**: כך `blur` שלא יצא מהטבלה (מעבר
 * בין כפתורים) אינו מקפל אותה, וסדר-ה-CSS אינו מכריע בין שתי מחלקות שמתנגשות.
 */
function AccessibleDataTable({ title, xKey, series, data, onSelect, unit }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      onFocus={() => setExpanded(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false)
      }}
      data-testid="chart-sr-table"
      className={
        expanded
          ? 'absolute inset-x-4 z-10 my-2 block rounded-lg border border-slate-200 bg-white p-2 shadow-md'
          : 'sr-only'
      }
    >
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
                    // 🚫 קטגוריה שכל ערכיה אפס — הכפתור **מנוטרל** ולא "נלחץ ולא קורה כלום":
                    // נתיב-המקלדת חייב לומר את אותו דבר שהעכבר אומר (`cursor: not-allowed`),
                    // אחרת קוראת-מסך שומעת דלת שאינה קיימת.
                    disabled={isEmptyDatum(row, series)}
                    className="font-semibold text-teal-700 underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
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

/**
 * ‏**הפורמט של ציר-הערך נגזר מהסדרות שיושבות עליו**, ו-`chart.unit` הוא הגיבוי.
 * 🔴 **ולא `chart.unit` לבדו:** בלוח דו-צירי (`ComposedBody`) ציר-שמאל הוא ₪ וציר-ימין אחוזים
 * — ‏`unit` אחד לשניהם היה מסמן את ציר-הימין בפסיקי-אלפים של כסף.
 */
function valueFormat(series, unit, side = 'left') {
  const onSide = (series ?? []).filter((s) => (s.axis === 'right' ? 'right' : 'left') === side)
  return (onSide[0] ?? (series ?? [])[0])?.format ?? unit
}

// 📐4 · **ציר-ערך נושא `tickFormatter` תמיד** — ר' `formatAxisTick`: בלעדיו Recharts מדפיס
// `600000`. זו הדרך היחידה שבה ציר מצויר במודול, ולכן אין "ציר שנשכח".
function valueAxisProps(format, extra = {}) {
  return axisProps({ tickFormatter: (value) => formatAxisTick(value, format), ...extra })
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

// 📐20 · **עמודת-"היום" חלולה ומקווקוות** — *"נכון ל-16/09, לא סוף-חודש"*.
// 🔴 **וזו הצהרה ולא קישוט:** עמודה אחרונה מלאה בגובה 60% מקודמתה נקראת כ**ירידה**, בעוד
// שהיא פשוט **תקופה חלקית**. המוקאפ המאושר מצהיר זאת שלוש פעמים (צורה · תווית · מקרא),
// והצורה היא החצי שהקוד אחראי לו. ‏`is_today` מגיע פר-שורה מה-RPC (C8, תוספת 16/09).
const todayCellProps = (row, seriesIndex = 0) =>
  row.is_today
    ? {
        fillOpacity: 0.55,
        strokeDasharray: '4 2',
        strokeWidth: 1.5,
        stroke: seriesColor(seriesIndex),
      }
    : {}

/**
 * תאי-העמודה: כלל-המילוי §④ (אדום יחיד מעל-סף) + הצהרת-📐20 (עמודת-"היום") + עמעום-15-ד.
 * 🔑 **פונקציה אחת לשני הגופים** (`BarBody` ו-`ComposedBody`) — שני עותקים היו נפרדים ביום
 * שבו אחד מהם יתוקן, וזה בדיוק מה ש-jscpd (3%) קיים כדי לתפוס.
 *
 * ✏️ **ומאז 16/09/2026 — לכל סדרת-עמודות, לא רק לראשונה.** 🔴 **נמדד:** ספטמבר במ2 יצא
 * חלול-ומקווקו **בשנה אחת מתוך שתיים**, כי `<Cell>` נפלט רק ל-`index === 0` — בעוד
 * ‏`is_today` הוא דגל **פר-שורה**, כלומר שתי העמודות של אותו חודש יושבות על אותה שורה
 * מסומנת. אותו פער הפיל גם את **עמעום-הסינון-הצולב** על הסדרה השנייה.
 * ⚠️ **ומילוי-הבסיס הוא זה של הסדרה עצמה** (`fillFor`) — אחרת הדפוס (hatch) של סדרה 2
 * היה נעלם ברגע שנוסף לה תא, וההבחנה שהמדידה בכותרת מחייבת הייתה הולכת לאיבוד.
 * 🚫 **`over_threshold` נשאר על הסדרה הראשונה בלבד, ובמכוון:** הדגל מתאר את **המדד** של
 * השורה, לא את כל סדרותיה — צביעת עמודת-"אשתקד" באדום כי **השנה** חצתה סף היא קביעה
 * שהמטען לא עשה (§④: *"אדום יחיד לערך שחוצה סף מוגדר"*).
 */
function barCells({ data, xKey, selected, series, selectable, idPrefix, seriesIndex = 0 }) {
  const baseFill = fillFor(idPrefix, seriesIndex)
  return data.map((row, rowIndex) => {
    // 🔤 **הכרעה 15-ד, מילה-במילה:** *"העמודה הנבחרת טורקיז-600, השאר slate-300"*.
    // 🔴 **וזה לא קישוט — בלעדיו הסינון-הצולב חסר את חצי-המשוב שלו:** הטבלה מתכווצת,
    // והגרף שגרם לזה נראה בדיוק כמו קודם. הצ'יפ אומר *מה* נבחר, והגוון אומר *איפה*.
    const dimmed = selected != null && String(row[xKey]) !== String(selected)
    // 🚫 הסמן אומר את האמת על התא עצמו — ר' `isEmptyDatum`. ‏`cursor` על `<Cell>` נכתב על
    // צורת-ה-SVG ולכן גובר על ה-`cursor` שנקבע ברמת-ה-`<Bar>`.
    const cursor = selectable ? (isEmptyDatum(row, series) ? 'not-allowed' : 'pointer') : undefined
    const overThreshold = seriesIndex === 0 && row.over_threshold
    return (
      <Cell
        key={`${row[xKey]}-${rowIndex}`}
        fill={dimmed ? UNSELECTED : overThreshold ? OVER_THRESHOLD : baseFill}
        cursor={cursor}
        {...todayCellProps(row, seriesIndex)}
      />
    )
  })
}

/**
 * 🔑 **מרנדר-סדרה אחד לכל שבעת סוגי-הגרף** — עמודה או קו, לפי `series[].kind` (C8).
 *
 * 🔴 **למה אחד ולא שלושה:** ‏jscpd מדד שלושה עותקים של אותו בלוק-פרופס (עמודה ב-`BarBody`,
 * עמודה ב-`ComposedBody`, קו ב-`LineBody`) — ובדיוק בזה נולד הפער שהמאמת תפס: ל-`Bar`
 * של הלוח-המעורב **לא** היה `stackId`, ול-`Line` שלו **לא** היה `activeDot`, כי כל עותק
 * קיבל תיקון אחר. **מרנדר אחד הוא מה שמונע את הסטייה הבאה, לא מה שמנקה את הקודמת.**
 *
 * ‏`axisIds` — לוח דו-צירי (`ComposedChart`) מחייב `yAxisId` על כל סדרה; ‏`BarChart`/
 * `LineChart` נושאים ציר-ערך יחיד **בלי מזהה**, ו-`yAxisId` שם היה מנתק את הסדרה מהציר.
 * ‏`defaultKind` — סדרה שאינה מצהירה `kind`: עמודה בגרף-עמודות, קו בגרף-קווים.
 */
function seriesNode({
  s,
  index,
  idPrefix,
  data = [],
  xKey,
  onSelect,
  selected,
  defaultKind = 'bar',
  axisIds = false,
  stacked = false,
  allSeries,
  radius = [4, 4, 0, 0],
}) {
  const kind = s.kind ?? defaultKind
  const yAxisId = axisIds ? (s.axis === 'right' ? 'right' : 'left') : undefined
  // 🚫 עמודה/נקודה שכל סדרותיה אפס אינה נלחצת — מבחן אחד לכל שלושת אתרי-הקריאה.
  const series = allSeries ?? [s]
  const select = guardedSelect(onSelect, series)
  if (kind === 'line') {
    return (
      <Line
        key={s.key}
        yAxisId={yAxisId}
        type="monotone"
        dataKey={s.key}
        name={s.label}
        unit={s.format}
        stroke={seriesColor(index)}
        strokeWidth={2}
        // 🔴 קידוד-משני לקו: הפער בגוון בין טורקיז לסלייט נמדד כבלתי-מספיק (ר' הכותרת).
        strokeDasharray={index === 0 ? undefined : '6 3'}
        dot={{ r: 3 }}
        activeDot={{
          r: 5,
          onClick: select ? (_, payload) => select(payload?.payload) : undefined,
        }}
      />
    )
  }
  return (
    <Bar
      key={s.key}
      yAxisId={yAxisId}
      dataKey={s.key}
      name={s.label}
      unit={s.format}
      stackId={stacked ? 'a' : undefined}
      fill={fillFor(idPrefix, index)}
      // ‏`radius` מגיע מבחוץ כי בעמודה **אופקית** הקצה המעוגל הוא הימני ולא העליון.
      radius={radius}
      cursor={onSelect ? 'pointer' : undefined}
      onClick={select ? (_, barIndex) => select(data[barIndex], barIndex) : undefined}
    >
      {/* כלל-המילוי §④: **אדום יחיד** לערך שחוצה סף מוגדר; שאר העמודות אינן משנות גוון.
          ‏`over_threshold` מגיע פר-שורה מה-RPC — הסף מוכרע בשרת, לא נגזר במסך.
          ✏️ **ולכל סדרת-עמודות, לא רק לראשונה** (16/09/2026) — ר' `barCells`. */}
      {barCells({
        data,
        xKey,
        selected,
        series,
        selectable: Boolean(onSelect),
        idPrefix,
        seriesIndex: index,
      })}
    </Bar>
  )
}

function BarSeries({ idPrefix, data, xKey, series, onSelect, selected, stacked, radius }) {
  return series.map((s, index) =>
    seriesNode({
      s,
      index,
      idPrefix,
      data,
      xKey,
      onSelect,
      selected,
      stacked,
      radius,
      allSeries: series,
      defaultKind: 'bar',
    }),
  )
}

function LineSeries({ series, onSelect }) {
  return series.map((s, index) =>
    seriesNode({ s, index, onSelect, allSeries: series, defaultKind: 'line' }),
  )
}

// 🔑 **סוג-גרף אחד = פונקציה אחת.** הפיצול אינו סגנון: `ChartBody` אחד ששולט בשבעת
// הסוגים נמדד ב-30 במורכבות-קוגניטיבית מול תקרת-20 של SonarJS — כלומר **גלאי-הספגטי של
// הריפו זיהה נכון** שאף קורא לא מחזיק שבעה ענפים בראש בבת-אחת.

// חלקים שחוזרים בכל הסוגים, מוגדרים פעם אחת (jscpd יתפוס אותם כפולים בשבעה מקומות).
// קווי-הרשת רצים **בניצב לציר-הערך**: עמודות אנכיות ⇒ קווים אופקיים · עמודות אופקיות ⇒
// אנכיים. רשת שנשארת אופקית מעל עמודות אופקיות מציירת קו בין קטגוריה לקטגוריה ולא בין ערך לערך.
const commonGrid = (horizontalBars = false) => (
  <CartesianGrid stroke="#F1F5F9" vertical={horizontalBars} horizontal={!horizontalBars} />
)
const commonTooltip = (unit) => (
  <Tooltip content={<HebrewTooltip unit={unit} />} cursor={{ fill: '#F1F5F9' }} />
)
// ⚠️ `reversed={false}` מפורש: ציר-הזמן רץ LTR בתוך עמוד RTL — **הכרעה קיימת** (ת1,
// *"ינואר משמאל… כמו אקסל ובנק-ישראל"*), לא בחירה של הרכיב.
const categoryAxis = (xKey) => <XAxis dataKey={xKey} reversed={false} {...axisProps()} />

const CHART_MARGIN = { top: 8, right: 8, bottom: 4, left: 4 }

/**
 * ‏**ערוץ-הצורה בפיזור** (`chart.shape_key`, תוספת C8 16/09) — 📑ב#10, במילותיו:
 * *"הסטייה יוצאת מגודל-הנקודה… לצורה בינארית"*, ובנימוק שכתוב שם: **קידוד-שטח הוא הקידוד
 * שהעין הגרועה בו ביותר**. ⇒ ‏`true` = משולש (מעל קו-הייחוס) · `false` = **עיגול חלול**.
 * 🔑 **שני `<Scatter>` ולא צורה-פר-נקודה:** ‏Recharts קובע צורה ברמת-הסדרה, ופיצול לשתי
 * סדרות הוא הדרך היחידה שבה גם המקרא וגם ה-DOM מבחינים ביניהן. ‏`shape_key` חסר ⇒ סדרה
 * אחת ונקודה רגילה, בדיוק כמו קודם.
 * 🚫 **ולא גוון** — 📐19 נועל גוון למשמעות אחת, וסטייה כבר מקודדת בצורה.
 */
function scatterParts(data, shapeKey) {
  if (!shapeKey) return [{ key: 'all', data, fill: seriesColor(0) }]
  return [
    {
      key: 'shape-on',
      data: data.filter((row) => Boolean(row[shapeKey])),
      shape: 'triangle',
      fill: seriesColor(0),
    },
    {
      key: 'shape-off',
      data: data.filter((row) => !row[shapeKey]),
      shape: 'circle',
      // עיגול **חלול**: מתאר בלבד, בלי מילוי — ההבחנה היא בצורה ולא בכמות-הדיו.
      fill: 'none',
      stroke: seriesColor(0),
    },
  ]
}

function ScatterBody({ chart, onSelect }) {
  const { data = [], xKey, series = [], domain, refLines, unit } = chart
  return (
    <ScatterChart accessibilityLayer margin={CHART_MARGIN}>
      {commonGrid()}
      {/* §5.2ב: `type="number"` מפורש — ברירת-המחדל של Recharts היא `category`, וזו
          הטעות הנפוצה שמייצרת ציר שגוי בפיזור.
          🔴 **ו-`domain` נמסר לשני הצירים, לא ליורד בלבד — נמדד 16/09/2026 וזה היה פגם:**
          במ6 המטען מצהיר `domain: [0, 630]` ו-`refLines[0].to = {x:630, y:630}`, בעוד
          מקסימום-ה-x בדאטה הוא ⁦600⁩. ציר-x שנגזר מהדאטה בלבד מסתיים ב-⁦600⁩, הקצה של
          קו-השוויון נופל **מחוץ** לתחום, ו-Recharts **משליך את הקטע כולו** — כלומר
          האלכסון שהרמז, מקרא-הצורות והכרטיס כולם מדברים עליו פשוט לא צויר.
          ⚠️ **ובפיזור זה נכון מהותית ולא רק טכנית:** שני הצירים מודדים את **אותו מדד**
          (צפי מול בפועל), ו-1:1 על שני סולמות שונים אינו קו של ⁦45°⁩. */}
      {/* ✏️ **`chart.x_domain` — חריג מוצהר ל-📐5, הכרעה 16/09/2026 19:4X:** ציר-מאפס קיים
          כדי שלא לנפח **סכומים, מונים וכסף**; ציר של **שיעור** הוא סיפור אחר. נמדד במ16:
          תעריפים שעתיים בטווח ⁦41⁩–⁦49⁩ ₪ נמתחו על ציר ⁦1⁩–⁦49⁩, וכל הנקודות נדחסו לקצה אחד —
          כלומר ציר שאינו משקר ופשוט **אינו קריא**. ⇒ ה-RPC רשאי להצהיר `x_domain`, והוא
          **בלבד** — לא נגזר בלקוח. 🔑 בלעדיו ההתנהגות זהה לקודמתה: אותו `domain` של ציר-Y
          (וזה מה שמחזיר את האלכסון של מ6 למסך), ובהיעדרו `[0, 'auto']`.
          ⚠️ **וקווי-הייחוס אינם משתנים** — הם נחתכים לצירים, כך שאלכסון 1:1 שהוצא מהתחום
          פשוט אינו מצויר, בדיוק כמו קודם. */}
      <XAxis
        dataKey={xKey}
        type="number"
        name={series[0]?.label}
        domain={valueDomain(chart.x_domain ?? domain)}
        {...valueAxisProps(series[0]?.format ?? unit)}
      />
      <YAxis
        dataKey={series[1]?.key ?? 'y'}
        type="number"
        name={series[1]?.label}
        domain={valueDomain(domain)}
        {...valueAxisProps(series[1]?.format ?? unit)}
      />
      <ZAxis dataKey="z" range={[40, 260]} />
      {renderRefLines(refLines)}
      {commonTooltip(unit)}
      {scatterParts(data, chart.shape_key).map((part) => (
        <Scatter
          key={part.key}
          data={part.data}
          shape={part.shape}
          fill={part.fill}
          stroke={part.stroke}
          cursor={onSelect ? 'pointer' : undefined}
          onClick={onSelect ? (point) => onSelect(point?.payload ?? point) : undefined}
        />
      ))}
    </ScatterChart>
  )
}

/**
 * ‏**סדרה מעורבת — עמודות וקו באותו לוח** (`series[].kind` · `series[].axis`, תוספת C8 16/09).
 *
 * 🔴 **נמדד 16/09/2026 ע"י מאמת-ההנהלה, וזה היה פגם חזותי אמיתי:** ‏`BarBody` צייר **כל**
 * סדרה כעמודה על ציר-ה-₪ היחיד ⇒ קו-שולי-הרווח של מ3 (**אחוזים**, טווח 0–100) נחת כעמודה
 * שלישית בגובה ~55 יחידות ליד עמודות של **1.9 מיליון ₪** — פס בלתי-נראה שנקרא כ"אפס".
 * ⇒ `kind: 'line'` מצייר קו · `axis: 'right'` נותן לו ציר-ימני **נעול 0–100** (📐6), בדיוק
 * כפי ש-`ParetoBody` דורש לסדרה-המצטברת שלו — ולכן שניהם אותו גוף.
 *
 * ⚠️ **ומה שלא נפתר כאן ומדווח:** ‏`refLines` של C8 אינם נוקבים באיזה ציר הם יושבים
 * (רק `x`/`y`/`diagonal`) ⇒ בלוח דו-צירי הם נתלים על **הימני כשהוא קיים**, כמו בפארטו.
 * דף שיצטרך קו-ייחוס על ציר-ה-₪ בלוח דו-צירי יידרש לשדה נוסף — פריט-חוזה, לא באג.
 */
function ComposedBody({ chart, idPrefix, onSelect, selected }) {
  const { data = [], xKey, series = [], domain, refLines, unit } = chart
  const hasRight = series.some((s) => s.axis === 'right')
  return (
    <ComposedChart data={data} accessibilityLayer margin={CHART_MARGIN}>
      <HatchDefs idPrefix={idPrefix} series={series} />
      {commonGrid()}
      {categoryAxis(xKey)}
      <YAxis
        yAxisId="left"
        domain={valueDomain(domain)}
        {...valueAxisProps(valueFormat(series, unit, 'left'))}
      />
      {/* ציר-ימין נעול ⁦0⁩–⁦100⁩ (📐6) ⇒ תו-הסימון שלו **תמיד אחוז**, גם כשהסדרה לא הכריזה. */}
      {hasRight && (
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          {...valueAxisProps('percent')}
        />
      )}
      {renderRefLines(refLines, hasRight ? 'right' : 'left')}
      {commonTooltip(unit)}
      {series.map((s, index) =>
        seriesNode({ s, index, idPrefix, data, xKey, onSelect, selected, axisIds: true }),
      )}
    </ComposedChart>
  )
}

/**
 * פארטו — **מקרה פרטי של הלוח המעורב, ולא גוף שני.**
 * §5.2ב מכתיב `ComposedChart` עם `Bar` שמאלי ו-`Line` מצטבר ימני, ו-📐6 נועל את הימני
 * ל-0–100 — כלומר בדיוק `kind`/`axis` של `ComposedBody`, רק שהמטען אינו מצהיר עליהם.
 * ⇒ הם נגזרים כאן, והשלד אחד. 🔑 **וזה לא ניקיון:** שני עותקים של אותו שלד-`ComposedChart`
 * נמדדו ע"י jscpd (7 שורות · 67 טוקנים), והשני הוא זה שהיה סוטה ביום שבו הראשון יתוקן.
 * ⚠️ **ההפרש היחיד שנשאר:** הקו המצטבר מקבל עכשיו נקודות-קטגוריה (`dot`) כמו כל קו אחר.
 * **אף מטען חי אינו מסוג `pareto` היום** (נמדד על 16 המטענים, 16/09) ⇒ אין כאן שינוי-מסך.
 */
function ParetoBody({ chart, idPrefix, onSelect, selected }) {
  const series = (chart.series ?? []).map((s, index) => ({
    ...s,
    kind: index === 0 ? 'bar' : 'line',
    axis: index === 0 ? 'left' : 'right',
  }))
  return (
    <ComposedBody
      chart={{ ...chart, series }}
      idPrefix={idPrefix}
      onSelect={onSelect}
      selected={selected}
    />
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
        <XAxis dataKey={xKey} type="number" domain={[0, 100]} {...valueAxisProps('percent')} />
      ) : (
        categoryAxis(xKey)
      )}
      <YAxis
        domain={lorenz ? [0, 100] : valueDomain(domain)}
        {...valueAxisProps(lorenz ? 'percent' : valueFormat(series, unit))}
      />
      {renderRefLines(refLines)}
      {commonTooltip(unit)}
      {LineSeries({ series, onSelect })}
    </LineChart>
  )
}

/**
 * 📏 **רוחב ציר-הקטגוריה האנכי, נגזר מהתווית הארוכה ביותר.**
 * 🔴 **ולמה לא ברירת-המחדל:** ‏`YAxis` של Recharts קבוע ב-⁦60⁩px, ותווית-סיבה עברית בת ארבע
 * מילים (*"חוסר מקצועיות של הצוות"*) נחתכת שם **בשקט** — בלי שגיאה ובלי שינוי-פריסה.
 * ⚠️ **האומדן הוא אומדן ומוצהר ככזה:** ‏`jsdom` אינו מודד טקסט, ולכן הרוחב נגזר מספירת-תווים
 * ב-⁦11⁩px (‏`axisProps`) ונחסם משני הצדדים — ⁦190⁩px היא התקרה שמעבר לה הציר אוכל את הגרף.
 */
const CATEGORY_CHAR_PX = 6.6
function categoryAxisWidth(data, xKey) {
  const longest = (data ?? []).reduce(
    (max, row) => Math.max(max, String(row?.[xKey] ?? '').length),
    0,
  )
  return Math.min(190, Math.max(64, Math.round(longest * CATEGORY_CHAR_PX) + 12))
}

/**
 * ‏**שני צירי גרף-העמודות, ומי מהם הקטגוריה** (`chart.layout`, תוספת 16/09/2026).
 *
 * 🔴 **`layout` לבדו לא הספיק, וזה היה פגם ולא פער-תיעוד:** הקוד כבר העביר
 * `layout="vertical"` ל-`BarChart`, אבל ‏Recharts מחליף צירים רק כשגם **סוגי-הצירים**
 * מתחלפים — ציר-ערך שנשאר `YAxis` וציר-קטגוריה שנשאר `XAxis` מייצרים לוח **ריק**, בלי
 * שגיאה. ⇒ ‏`layout: 'horizontal'` ⇒ `YAxis` קטגוריאלי + `XAxis` מספרי, שניהם כאן.
 * 🔤 **והמקור אינו טעם:** המוקאפ המאושר של מ20 מצייר את שני גרפי-הסיבות כעמודות אופקיות
 * (ארבע תוויות-הקטגוריה נמדדו כולן ב-`x=129` ב-SVG) — 📑ב#17 אוסר גם למזג ביניהם.
 */
function BarAxes({ horizontal, xKey, data, domain, format }) {
  if (horizontal) {
    return (
      <>
        <XAxis type="number" domain={valueDomain(domain)} {...valueAxisProps(format)} />
        <YAxis
          dataKey={xKey}
          type="category"
          width={categoryAxisWidth(data, xKey)}
          {...axisProps()}
        />
      </>
    )
  }
  return (
    <>
      {categoryAxis(xKey)}
      <YAxis domain={valueDomain(domain)} {...valueAxisProps(format)} />
    </>
  )
}

function BarBody({ chart, idPrefix, onSelect, selected }) {
  const { type, data = [], xKey, series = [], domain, refLines, unit, layout } = chart
  const horizontal = layout === 'horizontal'
  return (
    <BarChart
      data={data}
      accessibilityLayer
      margin={CHART_MARGIN}
      // §5.2ב: היסטוגרמה = `BarChart` על דליים מחושבים-מראש, עם `barCategoryGap={0}`
      // לרצף-חזותי. אין ב-Recharts primitive ייעודי.
      barCategoryGap={type === 'histogram' ? 0 : '20%'}
      layout={horizontal ? 'vertical' : 'horizontal'}
    >
      <HatchDefs idPrefix={idPrefix} series={series} />
      {commonGrid(horizontal)}
      <BarAxes
        horizontal={horizontal}
        xKey={xKey}
        data={data}
        domain={domain}
        format={valueFormat(series, unit)}
      />
      {renderRefLines(refLines)}
      {commonTooltip(unit)}
      {BarSeries({
        idPrefix,
        data,
        xKey,
        series,
        onSelect,
        selected,
        stacked: type === 'stackedBar',
        // עמודה אופקית גדלה ימינה ⇒ הפינות המעוגלות הן הימניות.
        radius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
      })}
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

// 🔑 **סדרה מעורבת נקבעת מ-`series[].kind` ולא מ-`chart.type`** — ‏`type` אומר *"זה גרף
// עמודות"*, ו-`kind` אומר *"הסדרה השלישית בו היא קו"*. ‏`pareto` פטור: הוא **כבר** לוח
// דו-צירי ייעודי, ו-`ComposedBody` היה מכפיל אותו.
const hasMixedSeries = (chart) => {
  const series = chart.series ?? []
  return series.some((s) => s.kind === 'line') && series.some((s) => (s.kind ?? 'bar') === 'bar')
}

function ChartBody({ chart, idPrefix, onSelect, selected }) {
  if (chart.type !== 'pareto' && hasMixedSeries(chart)) {
    return (
      <ComposedBody chart={chart} idPrefix={idPrefix} onSelect={onSelect} selected={selected} />
    )
  }
  // סוג לא-מוכר נופל ל-`bar` ואינו מפיל את המסך — אותו עיקרון כמו `format` לא-מוכר
  // ב-`reportsFormat`: שרת שהוסיף סוג לפני שהלקוח מכיר אותו מקבל תצוגה סבירה.
  const Body = CHART_BODIES[chart.type] ?? BarBody
  return <Body chart={chart} idPrefix={idPrefix} onSelect={onSelect} selected={selected} />
}

/**
 * מקרא — **מחוץ לעטיפת-ה-LTR**, ולכן לא `<Legend>` של Recharts.
 * 🔑 שתי סיבות, שתיהן מדודות: ① §⑤ #2 — טקסט עברי נשאר בזרימת-ה-RTL של הכרטיס ·
 * ② ה"דגימה" חייבת להראות את **הדפוס** ולא רק את הגוון, כי הגוון לבדו נמדד כבלתי-מספיק.
 */
// 🔑 **הדגימה מראה את מה שהעין באמת צריכה להבחין בו:** סדרת-קו מדגימה **קו** (ולא מלבן
// מלא שנראה כמו עמודה), וסדרת-עמודה שנייה ואילך מדגימה את **הדפוס** ולא רק את הגוון.
function swatchStyle(s, index) {
  const color = seriesColor(index)
  if (s.kind === 'line') {
    return {
      background: 'transparent',
      borderTop: `2px ${index === 0 ? 'solid' : 'dashed'} ${color}`,
      height: '2px',
      marginBlock: '4px',
    }
  }
  if (index === 0) return { background: color }
  return {
    background: `repeating-linear-gradient(45deg, ${color} 0 3px, transparent 3px 6px)`,
    outline: `1px solid ${color}`,
  }
}

function ChartLegend({ series }) {
  if (series.length < 2) return null
  return (
    <ul className="mb-2 flex flex-wrap gap-3 text-xs text-slate-600" data-testid="chart-legend">
      {series.map((s, index) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-4 rounded-sm"
            style={swatchStyle(s, index)}
          />
          {s.label}
        </li>
      ))}
    </ul>
  )
}

// 🔤 **נוסח-הגיבוי, ולמה הוא לא הומצא:** ערוץ-הצורה נקוב ב-📑ב#10 **במקום אחד בלבד** —
// הפיזור של מ6, שבו האלכסון הוא *"ההערכה התקיימה בדיוק"* ומעליו *"הגיעו יותר אורחים מהצפי"*.
// ⇒ הגיבוי מתאר את **היחס לקו-הייחוס**, וכל מטען שמשמעותו אחרת מוסר `chart.shape_labels`
// ‏(`{ on, off }`) ודורס אותו. 🚫 אין כאן ניסוח-מוצר חדש.
const SHAPE_FALLBACK = Object.freeze({ on: 'מעל קו-הייחוס', off: 'על הקו או מתחתיו' })

function ShapeLegend({ chart }) {
  if (!chart.shape_key) return null
  const labels = { ...SHAPE_FALLBACK, ...(chart.shape_labels ?? {}) }
  return (
    <ul
      className="mb-2 flex flex-wrap gap-3 text-xs text-slate-600"
      data-testid="chart-shape-legend"
    >
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true">▲</span>
        {labels.on}
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true">○</span>
        {labels.off}
      </li>
    </ul>
  )
}

/**
 * ‏**מקרא לקווי-ייחוס אלכסוניים** — ✏️ נוסף 16/09/2026.
 *
 * 🔴 **נמדד בדפדפן, וזו מגבלת-ספרייה ולא בחירה:** ‏`ReferenceLine` עם `segment` מצייר את
 * הקו (‏`<line x1=64 y1=226 x2=950 y2=8>`, אומת על מ6 אחרי תיקון תחום-הציר) אבל **אינו
 * מרנדר את ה-`<Label>` שלו כלל** — אפס צמתי-`text` בתוך `.recharts-reference-line`. זו
 * אותה משפחה בדיוק של הממצא הקודם *(`label={{…}}` אינו מרנדר דבר)*, והפעם גם צורת-הילד
 * אינה עוזרת. ⚠️ **וקווי `x`/`y` ממשיכים לקבל תווית בתוך הגרף** — הם נמדדו עובדים, ולכן
 * המקרא הזה חל **על האלכסון בלבד** ואינו מכפיל תווית שכבר מצוירת.
 *
 * 🔑 **והטקסט אינו מומצא כאן:** הוא `refLines[].label` של המטען, מילה-במילה
 * *(מ6: "ההערכה התקיימה בדיוק")* — הועבר למקום שבו הוא **נראה**, ולא נוסח מחדש.
 */
function DiagonalLegend({ refLines }) {
  const diagonals = (refLines ?? []).filter((ref) => ref.axis === 'diagonal' && ref.label)
  if (diagonals.length === 0) return null
  return (
    <ul
      className="mb-2 flex flex-wrap gap-3 text-xs text-slate-600"
      data-testid="chart-refline-legend"
    >
      {diagonals.map((ref) => (
        <li key={ref.label} className="flex items-center gap-1.5">
          {/* הדגימה מראה **קו מקווקו**, אותו קו שמצויר בגרף — ולא ריבוע צבע. */}
          <span
            aria-hidden="true"
            className="inline-block h-0 w-4"
            style={{ borderTop: `1px dashed ${AXIS_COLOR}` }}
          />
          {ref.label}
        </li>
      ))}
    </ul>
  )
}

/**
 * ‏`chart` — אובייקט-גרף של C8:
 * `{ type, title, note?, series: [{key,label,format?,kind?,axis?}], data, xKey, domain,
 *    refLines, unit, shape_key?, shape_labels? }`.
 * ‏`series[].kind:'line'` + `axis:'right'` ⇒ לוח מעורב עם ציר-ימני נעול 0–100 (ר' `ComposedBody`).
 * ‏`shape_key` ⇒ ערוץ-צורה בינארי בפיזור (📑ב#10) · `note` ⇒ שורת-פירוש מתחת לכותרת.
 * ‏`data[].is_today` ⇒ עמודה חלולה-ומקווקוות (📐20) · `data[].over_threshold` ⇒ אדום (§④).
 * ‏`soWhat` — שורת-📐23, **מחוץ** לעטיפת-ה-LTR ומתחת לגרף.
 * ‏`layout: 'horizontal'` ⇒ **עמודות אופקיות** — ציר-קטגוריה אנכי (ר' `BarAxes`).
 * ‏`x_domain` ⇒ תחום ציר-ה-X בפיזור כשהשרת מצהיר עליו (שיעור ולא סכום — ר' `ScatterBody`).
 * ‏`onSelect(row, index)` — קרוס-פילטר; מחווט גם לעכבר (Cell/Bar) וגם למקלדת (הטבלה).
 * 🚫 **דאטום שכל סדרותיו אפס אינו נלחץ בשום נתיב** (ר' `isEmptyDatum`): סמן-חסום על התא,
 * ‏`onClick` שאינו מפעיל, וכפתור **מנוטרל** בטבלת-קורא-המסך.
 * ‏`selected` — ערך-ה-`xKey` שנבחר: העמודה שלו נשארת טורקיז והשאר יורדות ל-slate-300 (15-ד).
 *
 * ‏`aside` · `footer` — שתי נקודות-הרחקה לבונה-הלשונית (F9/F10, 16/09/2026): ‏`aside` יושב
 * **לצד** הגרף (אריח-צד כמו *"שוטף — עוד לא באיחור"* של מ9, שהכרטיס מעגן *"בתוך .chart-card"*)
 * ו-`footer` **מתחתיו** (רמזי-⑩ שהכרטיס מעגן מתחת ל-`.legend`/`.barkey`). ר' `ReportSurface`.
 */
export default function ChartCard({
  chart,
  soWhat,
  height = 260,
  onSelect,
  selected,
  aside,
  footer,
  // ✏️ 17/09/2026 — משפט-הריקות מגיע מהמעטפת, שיודעת **איזה מסנן** רוקן את הדף (תקופה או
  // לקוח — `EMPTY_AFTER_CUSTOMER_FILTER`, כלל כ17); ברירת-המחדל נשארת משפט-התקופה הנעול,
  // כך שכל צרכן אחר של הגרף אינו משתנה. בלי זה מסך אחד אמר שני משפטים על אותו מסנן.
  emptyText = EMPTY_AFTER_FILTER,
}) {
  const idPrefix = useId().replace(/:/g, '')
  if (!chart) return null
  const { title, series = [], data = [], xKey = 'x', unit } = chart

  return (
    // ‏`relative` — עוגן-המיקום של טבלת-קורא-המסך הפרושה (ר' `AccessibleDataTable`).
    <div
      className="relative mb-4 rounded-xl border border-slate-200 bg-white p-4"
      data-testid={`chart-card-${chart.type}`}
    >
      {/* §⑤ #2 — הכותרת העברית נשארת **מחוץ** לעטיפת-ה-LTR, ברמת הכרטיס. */}
      <h3 className="mb-2.5 text-sm font-semibold text-slate-700">{title}</h3>
      {/* ‏`chart.note` (תוספת C8 16/09) — **שורת-פירוש מתחת לכותרת**: מה העמודות אומרות,
          מה קו-הייחוס מסמן, ואילו שורות נכללו. ⚠️ **בסיס ולא רמז** (📐2 · ⑩): הכרטיס של
          גרף-הגיול נוקב במפורש בשורת-פירוש לכל דלי, ובלי המקום הזה היא הייתה מומצאת
          שוב בכל לשונית. שכבת-ההטמעה (`<Hint>`) היא שכבה נפרדת ואינה מחליפה אותה. */}
      {chart.note && (
        <p className="mb-2 text-xs leading-relaxed text-slate-500" data-testid="chart-note">
          {chart.note}
        </p>
      )}
      {/* 🔴 **גרף שחזר בלי דאטה אומר זאת במילים — נמדד 16/09/2026 וזה היה מסך שקט:**
          לחיצה אחת על גלולת *"החודש"* במ14 השאירה מסגרת ⁦260⁩px **ריקה לגמרי**, בלי מילה,
          בלי מקרא ובלי טבלת-קורא-מסך שיש בה שורות. ⇒ 📐10 חל גם על הגרף ולא רק על הדף:
          כותרת + המשפט הנעול, ו**בלי** מקרא/עטיפת-LTR/טבלה — שלושתם מתארים דאטה שאינה שם.
          🔤 הנוסח מגיע מ-`reportsCopy.js`, אותו משפט בדיוק שהמעטפת אומרת. */}
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500" data-testid="chart-empty">
          {emptyText}
        </p>
      ) : (
        <>
          <ChartLegend series={series} />
          <ShapeLegend chart={chart} />
          <DiagonalLegend refLines={chart.refLines} />

          {/* ‏`aside` — אריח-צד שהלשונית שותלת **בתוך** כרטיס-הגרף (F9). ‏`md:flex` כדי
              שבמסך צר הוא ייפול מתחת לגרף במקום לרסק אותו. */}
          <div className="md:flex md:items-start md:gap-3">
            {/* §⑤ #1 — `dir="ltr"` על ה-div העוטף ולא על `<BarChart>`: Recharts אינו מכבד
                `dir` שיורש מהורה (Issues #263/#682/#4214).
                §⑤ #8 — **גובה מפורש על ההורה**, לא `h-full`/`flex-1`: הורה בלי גובה ⇒ הגרף
                מקבל `height=0` ולא מצייר כלום, לפעמים רק בדפדפן אחד.
                §⑤ #6 — `role="figure"` + `aria-label` על מעטפת-הגרף. */}
            <div
              dir="ltr"
              role="figure"
              aria-label={`${title}, גרף`}
              style={{ height }}
              className="md:min-w-0 md:flex-1"
              data-testid="chart-figure"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ChartBody
                  chart={chart}
                  idPrefix={idPrefix}
                  onSelect={onSelect}
                  selected={selected}
                />
              </ResponsiveContainer>
            </div>
            {aside && (
              <div className="mt-2 md:mt-0 md:w-[210px] md:shrink-0" data-testid="chart-aside">
                {aside}
              </div>
            )}
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
        </>
      )}

      {/* ‏`footer` — מתחת לגרף ומעל שורת-"אז מה" (F10): שם הכרטיסים מעגנים את רמזי-⑩
       *"בתוך .chart-card, מתחת ל-.barkey"*. מוצג גם בגרף ריק — הוא מסביר **איך לקרוא**. */}
      {footer && <div data-testid="chart-footer">{footer}</div>}

      {soWhat && (
        // 📐23 · הכרעה 15-ג: שורת-"אז מה" — **בלי מילוי-רקע**, קו-ימני דק בלבד.
        <p
          className="mt-3 border-r-[3px] border-teal-600 px-3.5 py-1.5 text-sm font-semibold text-teal-700"
          data-testid="chart-so-what"
        >
          {soWhat}
        </p>
      )}
    </div>
  )
}
