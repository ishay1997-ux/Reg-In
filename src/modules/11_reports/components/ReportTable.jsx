// טבלת-הדוח — הצורה היחידה שבה שישה-עשר המשטחים מציגים שורות.
//
// 🔴 **ארבע דרישות-נגישות שנמדדו חסרות במוקאפ שנחת, ולכן הן בקוד ולא בהערה** (📐9,
// WCAG H63 — *נמדד: 99 `<th>` · 0 `scope` · 0 `aria-live` · 0 `aria-sort`*):
// ‏① `scope="col"` בכל כותרת · ② `aria-sort` על העמודה הממוינת · ③ אזור `aria-live="polite"`
// שמכריז את תוצאת הקרוס-פילטר · ④ והאזור **קיים בדף מראש** ואינו נוצר בלחיצה (§⑥) —
// אזור-חי שנוצר אחרי הפעולה אינו מוכרז כלל.
//
// 🔑 **הכרעה 19: השורה **כולה** לחיצה, ואין קישור "פתח…" חוזר בכל שורה.** ⇒ `<tr>` מקבל
// `onClick` + `tabIndex` + `onKeyDown` — כי `<tr>` אינו אלמנט-פעולה טבעי, ובלי מקלדת זו
// יכולת שקיימת לעכבר בלבד. *(📐14ב③: `tabindex`/`role` **אינם** עדות ל"עובד במקלדת" —
// הצהרה כזו נכתבת רק אחרי שיש `keydown` בפועל. יש.)*
//
// 📐8: **הפאג'ר סופר את מה שהטבלה מציגה** — `total` הוא ספירת-השורות אחרי המסננים ואחרי
// הבחירה-בגרף, **לא** ספירת-האוכלוסייה. כותרת *"הפרויקטים שחרגו"* מול פאג'ר שסופר 206 היא
// התקלה שנמדדה במוקאפ שנחת.

import { Pager } from '@/components/ListWindow'
import { paginate } from '@/lib/listWindow'
import { NO_VALUE, formatByType } from '@/lib/reportsFormat'
import { cn } from '@/lib/utils'

// 🔤 עמודות מספריות מיושרות לקצה-השמאלי של התא (סוף-השורה ב-RTL) — כך טור-מספרים נסרק
// בעין לאורך ספרת-האחדות, בדיוק כמו בכל טבלת-כספים בריפו.
const ALIGN_CLASS = { end: 'text-left', start: 'text-right' }

// ‏`id` בפנים **רק לצורך היישור**: מזהה נסרק בעין כטור-ספרות בדיוק כמו מונה, והפגם
// שתוקן ב-17/09 היה המפריד ולא היישור. (עיצוב-הערך עצמו נגזר ב-`reportsFormat`.)
const NUMERIC_FORMATS = new Set(['money', 'percent', 'gini', 'int', 'days', 'ratio', 'id'])

function alignFor(column) {
  if (column.align) return ALIGN_CLASS[column.align] ?? ALIGN_CLASS.start
  return NUMERIC_FORMATS.has(column.format) ? ALIGN_CLASS.end : ALIGN_CLASS.start
}

function Cell({ column, row }) {
  // 🔤 **כל עיצוב-התא עובר דרך `formatByType` — כולל `textLtr`** (נוסף 16/09/2026): תא
  // שערכו טווח-ספרות (`1–30` · `90+`) מרונדר **הפוך** ב-`<td>` של דף RTL, כי המקף הוא תו
  // נייטרלי בין שני רצפי-ספרות. ⇒ ה-RPC מצהיר `format: 'textLtr'` והבידוד נעשה במקור
  // אחד — **ולא** בעטיפה ידנית בטרנספורם של לשונית, שדלפה משם אל קובץ-האקסל.
  //
  // ✏️ **מזהה מזוהה מהצהרת-השרת בלבד — `format:'id'`** (17/09/2026, סבב ב'). ‏17/09 בבוקר
  // היה כאן גם כלל-סיומת (`/_id$/` על שם-העמודה) שהפך כל `quote_id`/`project_id` למזהה גם
  // כשה-RPC הכריז `int`. **הכלל נמחק:** מיגרציית J2 מצהירה `'format','id'` על כל עמודת-מזהה
  // בשישה-עשר המשטחים (החוזה C8), ושני מנגנונים לאותה התנהגות הם בדיוק מחלקת-הפגם D-30 —
  // ביום שבו הם ייפרדו, אף אחד לא ידע איזה מהם קבע.
  const text = formatByType(row[column.key], column.format)
  return (
    <td className={cn('border-b border-slate-100 p-2.5 align-middle', alignFor(column))}>
      {text === NO_VALUE ? <span className="text-slate-400">{NO_VALUE}</span> : text}
    </td>
  )
}

function HeaderCell({ column, sort }) {
  // ‏`aria-sort` **רק** על העמודה הממוינת — הכרזתו על כל העמודות היא שקר לקורא-המסך.
  const sorted = sort?.key === column.key ? (sort.direction ?? 'descending') : undefined
  return (
    <th
      scope="col"
      aria-sort={sorted}
      className={cn(
        'whitespace-nowrap border-b border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500',
        alignFor(column),
      )}
    >
      {column.label}
      {sorted && (
        <span aria-hidden="true" className="mr-1">
          {sorted === 'descending' ? '▼' : '▲'}
        </span>
      )}
    </th>
  )
}

// מפתח-שורה יציב: `row_key` אם ה-RPC נתן · אחרת `drill_key` מסורלז (הוא אובייקט) · אחרת מיקום בעמוד.
function rowKey(row, page, index) {
  if (row.row_key != null) return String(row.row_key)
  if (row.drill_key != null) {
    return typeof row.drill_key === 'object' ? JSON.stringify(row.drill_key) : String(row.drill_key)
  }
  return `${page}-${index}`
}

function Row({ columns, row, onDrill }) {
  // הכרעה 19: דלת-דריל אחת לשורה, והשורה כולה היא הדלת. `drill_key` מגיע מה-RPC (C8).
  const drillable = Boolean(onDrill && row.drill_key)
  const open = () => onDrill(row.drill_key, row)
  return (
    <tr
      className={cn(drillable && 'cursor-pointer hover:bg-slate-50')}
      onClick={drillable ? open : undefined}
      // 🔴 שקילות-מקלדת אמיתית, לא הצהרה: `<tr>` אינו אלמנט-פעולה, ולכן גם `role`,
      // גם `tabIndex` וגם `keydown` — שלושתם, אחרת זו יכולת-עכבר בלבד.
      role={drillable ? 'button' : undefined}
      tabIndex={drillable ? 0 : undefined}
      onKeyDown={
        drillable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                open()
              }
            }
          : undefined
      }
      data-testid={drillable ? 'report-row-drillable' : 'report-row'}
    >
      {columns.map((column) => (
        <Cell key={column.key} column={column} row={row} />
      ))}
    </tr>
  )
}

/**
 * ‏`columns`/`rows` — כפי שה-RPC החזיר (C8), **כבר ממוינים לפי 📐7** (הגרף והטבלה באותו סדר).
 * 🚫 הרכיב אינו ממיין: מיון-לקוח על דאטה מעומדת היה מייצר סדר שני שסותר את הגרף.
 *
 * ‏`announcement` — הטקסט שנכנס לאזור ה-`aria-live` (📐9), למשל *"מסונן למדרג 61–90; 2 שורות"*.
 */
export default function ReportTable({
  columns = [],
  rows = [],
  page = 1,
  onPage,
  sort,
  onDrill,
  announcement = '',
  caption,
}) {
  if (columns.length === 0) return null
  const view = paginate(rows, page)

  return (
    <div
      className="mb-4 rounded-xl border border-slate-200 bg-white"
      data-testid="report-table-card"
    >
      {/* 📐9④ — קיים בדף **מראש** וריק, ולא נוצר בלחיצה. */}
      <p className="sr-only" aria-live="polite" data-testid="report-table-announce">
        {announcement}
      </p>
      {/* גלילה אופקית משלה — 📐21 (1280px): טבלה רחבה אינה מזיזה את הדף כולו. */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="sticky top-0 bg-white">
            <tr>
              {columns.map((column) => (
                <HeaderCell key={column.key} column={column} sort={sort} />
              ))}
            </tr>
          </thead>
          <tbody>
            {view.pageRows.map((row, index) => (
              <Row
                // ‏`drill_key` הוא אובייקט ({kind, id…}) — כמפתח-React הוא היה מתקפל ל-"[object Object]"
                // ואותו מפתח לכל שורה לחיצה (נמצא באימות-הכספים 16/09). מחרוזת יציבה במקומו.
                key={rowKey(row, page, index)}
                columns={columns}
                row={row}
                index={index}
                onDrill={onDrill}
              />
            ))}
          </tbody>
        </table>
      </div>
      {/* 📐8 — `total` הוא `rows.length` שכבר עבר את המסננים ואת הבחירה-בגרף. */}
      <Pager {...view} onPage={onPage} testId="report-pager" />
    </div>
  )
}
