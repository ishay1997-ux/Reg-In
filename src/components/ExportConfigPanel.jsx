// הצד הימני של חלון-הייצוא: מה ייצא, על אילו נתונים, ובאיזה סדר.
//
// 🔴 **רשימה אחת ולא שני אזורים** (הכרעת-ישי 17/09/2026). עמודה שכובתה **נשארת במקומה**,
// ולכן הסדר של כל העמודות גלוי תמיד והחזרת עמודה אינה דורשת לגרור אותה בחזרה ממקום אחר.
// 🔑 **והרווח השני הוא בטיחותי:** הגרירה נשארת **אנכית**, ולכן אין כאן העברה אופקית שתחת
// `<html dir="rtl">` הופכת כיוון.
//
// 🔤 **ארבעה פקדי-סינון ולא אחד — נגזר ממדידה ולא מהערכה:** 484 הכרזות-עמודה בשמונה פורמטים.
// ‏`id` אינו מקבל "גדול מ-" · טקסט קצר-ערכים מקבל רשימת-בחירה ולא תיבת-חיפוש · וההבחנה
// **מחושבת מהשורות**, ולכן נכונה גם בדוח שטרם נבנה. הפירוט: `src/lib/exportFilters.js`.

import { ChevronDown, ChevronUp, ChevronsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { distinctValues, isCategorical, operatorsFor } from '@/lib/exportFilters'

const FIELD = 'w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs'
const ROW = 'flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1'

// ‏♿ **שלושת פקדי-הסידור חולקים קבוע אחד, וזה האכיפה של "שלושתם או אף אחד".**
// הכרעת-ישי 18/09/2026 (*"מאשר לפי המלצה"*): יעד-הקליק ≥ 24×24 לפי WCAG 2.5.8 AA.
// װ📊 **המדידה שלפני, על המסך ולא מה-CSS** (1024px, 22/09/2026): החצים היו **19.9×16**
// עם `px-1 text-xs` בלבד — נמוך מהסף בשני המימדים. װ**ב-8 עמודות זה מעצבן; ב-30, עם עכבר, זה מחטיא.**
// 🔑 **ו-`size-6` ולא `variant="link"`+`h-auto p-0`:** װ`src/CLAUDE.md §2.6` חל על רכיב `Button`,
// ושלושת אלה הם `<button>` גולמי — אין כאן כלל שנשבר, וגם לא תקדים חדש שנכנס.
// 🔑 **שלושה אייקוני `lucide` ולא תווי-טקסט (הכרעת-ישי 23/09/2026).**
// װ`⤒` הוא **תו טקסט**, ולכן עוביו תלוי-גופן ואינו תואם ל-`▲`/`▼` שלידו. נמדד בצילום
// ב-1024px: הוא נקרא דק וחלש, וישי תפס את זה בעין.
// 🔑 **ולמה דווקא כפול-מול-יחיד:** הקשר ביניהם נקרא בלי הסבר — **אחד זז צעד,
// כפול זז עד הסוף.** ✅ וזה גם מיישר את הפקדים ל-`src/CLAUDE.md §4.3`: אייקוני `lucide` בגודל `size-4`.
const ICON_BTN =
  'inline-flex size-6 shrink-0 items-center justify-center rounded text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent'

function ColumnRow({
  column,
  index,
  total,
  checked,
  onToggle,
  onMove,
  onMoveToTop,
  onDragStart,
  onDropBefore,
}) {
  return (
    <li
      draggable
      onDragStart={() => onDragStart(column.key)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        onDropBefore(column.key)
      }}
      className={ROW}
      data-testid={`export-column-${column.key}`}
    >
      <span aria-hidden="true" className="cursor-grab text-slate-400">
        ⠿
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(column.key)}
        aria-label={`${column.label}, עמודה ${index + 1} מתוך ${total}`}
        className="ml-1"
      />
      <span className={`flex-1 truncate text-xs ${checked ? '' : 'text-slate-400 line-through'}`}>
        {column.label}
      </span>
      <button
        type="button"
        className={ICON_BTN}
        disabled={index === 0}
        onClick={() => onMoveToTop(column.key)}
        aria-label={`העבירי את ${column.label} לראש הרשימה`}
      >
        <ChevronsUp className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={ICON_BTN}
        disabled={index === 0}
        onClick={() => onMove(column.key, -1)}
        aria-label={`הזיזי את ${column.label} מעלה`}
      >
        <ChevronUp className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={ICON_BTN}
        disabled={index === total - 1}
        onClick={() => onMove(column.key, 1)}
        aria-label={`הזיזי את ${column.label} מטה`}
      >
        <ChevronDown className="size-4" aria-hidden="true" />
      </button>
    </li>
  )
}

function FilterRow({ condition, columns, rows, onChange, onRemove }) {
  const column = columns.find((item) => item.key === condition.key)
  const categorical = column ? isCategorical(rows, column) : false
  const operators = column ? operatorsFor(column.format, categorical) : []
  const values = column && categorical ? distinctValues(rows, column) : []

  return (
    /*
      🔑 **שורה אחת ולא `flex-wrap` — הכרעת-ישי 23/09/2026, והנימוק הוא קריאות ולא יופי.**
      📊 נמדד בצילום: עם `w-28`/`w-24` שלושת הפקדים חרגו מפאנל של 320px ונערמו
      **אנכית, כל אחד בשורה משלו**, וה-`✕` נשאר תלוי לבד. װ**ישי לא הבין מזה שזה תנאי אחד.**
      ⇒ בשורה אחת הוא נקרא כמשפט: *"ימי איחור · גדול מ- · 60"*.
      ⚠️ **ו-`min-w-0` על כל פריט הוא הדבר שמאפשר את זה** — בלעדיו `flex-1` משאיר `min-width:auto`
      והפקד מסרב להתכווץ (אותה מלכודת-flexbox שתפסה את שדות-התאריך).
    */
    <div className="flex items-center gap-1" data-testid="export-filter-row">
      <select
        className={`${FIELD} min-w-0 flex-[3]`}
        value={condition.key}
        aria-label="עמודה לסינון"
        onChange={(event) => {
          const next = columns.find((item) => item.key === event.target.value)
          const nextCategorical = next ? isCategorical(rows, next) : false
          const first = next ? operatorsFor(next.format, nextCategorical)[0] : null
          onChange({
            key: event.target.value,
            operator: first?.id ?? 'contains',
            operatorLabel: first?.label ?? '',
            value: '',
            values: [],
          })
        }}
      >
        {columns.map((item) => (
          <option key={item.key} value={item.key}>
            {item.label}
          </option>
        ))}
      </select>

      <select
        className={`${FIELD} min-w-0 flex-[3]`}
        value={condition.operator}
        aria-label="תנאי"
        onChange={(event) => {
          const picked = operators.find((item) => item.id === event.target.value)
          onChange({ ...condition, operator: picked.id, operatorLabel: picked.label })
        }}
      >
        {operators.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>

      {condition.operator === 'oneOf' ? (
        <select
          multiple
          className={`${FIELD} min-w-0 flex-[2]`}
          value={condition.values ?? []}
          aria-label="ערכים"
          onChange={(event) =>
            onChange({
              ...condition,
              values: [...event.target.selectedOptions].map((option) => option.value),
            })
          }
        >
          {values.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      ) : (
        <Input
          className="h-7 min-w-0 flex-[2] text-xs"
          value={condition.value ?? ''}
          aria-label="ערך"
          placeholder={column?.format === 'date' ? 'YYYY-MM-DD' : ''}
          onChange={(event) => onChange({ ...condition, value: event.target.value })}
        />
      )}

      {condition.operator === 'between' && (
        <Input
          className="h-7 min-w-0 flex-[2] text-xs"
          value={condition.value2 ?? ''}
          aria-label="ערך שני"
          onChange={(event) => onChange({ ...condition, value2: event.target.value })}
        />
      )}

      <button
        type="button"
        className={`${ICON_BTN} shrink-0`}
        onClick={onRemove}
        aria-label="הסירי מסנן"
      >
        ✕
      </button>
    </div>
  )
}

export default function ExportConfigPanel({
  reports,
  reportId,
  onReportChange,
  customers,
  customerId,
  onCustomerChange,
  from,
  to,
  onPeriodChange,
  columns,
  rows,
  order,
  selected,
  onToggle,
  onMove,
  onMoveToTop,
  onDragStart,
  onDropBefore,
  conditions,
  onConditions,
  onReset,
  topN,
  showAll,
  onShowAllChange,
}) {
  const ordered = order.map((key) => columns.find((item) => item.key === key)).filter(Boolean)

  return (
    <section className="space-y-3" aria-label="הגדרות הייצוא">
      {reports.length > 1 && (
        <label className="block text-xs text-slate-600">
          דוח
          <select
            className={FIELD}
            value={reportId ?? ''}
            onChange={(event) => onReportChange?.(event.target.value)}
            data-testid="export-report-select"
          >
            {reports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {/*
        🔴 **`min-w-0` על שני ה-labels, וזו מלכודת-flexbox שנמדדה ולא שוערה.**
        ‏📊 נמדד 17/09/2026 ב-1024px: השורה `clientWidth` **178** · `scrollWidth` **282** ⇒
        **גלישה של 104px**, ו-`export-to` יצא מהעמודה (left 461 מול גבול-שורה 565) ונחתך.
        **הסיבה:** ‏`flex-1` הוא `flex: 1 1 0%` אבל **`min-width` נשאר `auto`** ⇒ הרוחב
        המינימלי הוא הרוחב האינטרינזי של `<input type="date">` (‏137px כל אחד + 8px gap = 282).
        **שני שדות-תאריך פשוט מסרבים להתכווץ.** ⇒ `min-w-0` מרשה להם.
        ✅ פיזי-נייטרלי — אינו utility לוגית ואינו מפר את `src/CLAUDE.md §2.4`.
      */}
      <div className="flex gap-2">
        <label className="min-w-0 flex-1 text-xs text-slate-600">
          מתאריך
          <Input
            type="date"
            className="h-7 text-xs"
            value={from ?? ''}
            onChange={(event) => onPeriodChange?.({ from: event.target.value, to })}
            data-testid="export-from"
          />
        </label>
        <label className="min-w-0 flex-1 text-xs text-slate-600">
          עד תאריך
          <Input
            type="date"
            className="h-7 text-xs"
            value={to ?? ''}
            onChange={(event) => onPeriodChange?.({ from, to: event.target.value })}
            data-testid="export-to"
          />
        </label>
      </div>

      {customers.length > 0 && (
        <label className="block text-xs text-slate-600">
          לקוח
          <select
            className={FIELD}
            value={customerId ?? ''}
            onChange={(event) => onCustomerChange?.(event.target.value)}
            data-testid="export-customer"
          >
            <option value="">כל הלקוחות</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* 🔴 רשימת-שיא היא הדוח, לא חיתוך — ולכן היא ברירת-המחדל, והנוסח נוקב במספר האוכלוסייה. */}
      {topN && (
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(event) => onShowAllChange?.(event.target.checked)}
            data-testid="export-show-all"
          />
          {`כל ${topN.total} השורות, ולא רק ${topN.label}`}
        </label>
      )}

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600">מסננים</span>
          <button
            type="button"
            className="text-xs text-slate-600 underline"
            data-testid="export-add-filter"
            onClick={() => {
              const column = columns[0]
              if (!column) return
              const first = operatorsFor(column.format, isCategorical(rows, column))[0]
              onConditions([
                ...conditions,
                {
                  key: column.key,
                  operator: first.id,
                  operatorLabel: first.label,
                  value: '',
                  values: [],
                },
              ])
            }}
          >
            + מסנן
          </button>
        </div>
        {conditions.map((condition, index) => (
          <FilterRow
            key={index}
            condition={condition}
            columns={columns}
            rows={rows}
            onChange={(next) =>
              onConditions(conditions.map((item, i) => (i === index ? next : item)))
            }
            onRemove={() => onConditions(conditions.filter((item, i) => i !== index))}
          />
        ))}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-slate-600">
            עמודות ({selected.size}/{columns.length})
          </span>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={onReset}
            data-testid="export-reset"
          >
            איפוס
          </Button>
        </div>
        {/*
          🔴 **גובה נגזר-מסך ולא 224px קבוע.** ‏`max-h-56` הראה **6 שורות**, כלומר בגיול-חובות
          (8 עמודות) כבר היום גוללים — ובגרירה זה אומר לגרור בתוך חלון של 6.
          📊 **ולמה זה יחמיר ולא ישתפר:** מצבת-השדות לייצוא-פרויקטים היא **40 עמודות בטבלה +
          10 בכספים = 50** (נמדד מ-`docs/schema.sql`), ודיילות 41, הצעות 35. ‏`40vh` נותן
          ~8 שורות ב-768px ו-~11 ב-1080 — שיפור אמיתי שמתאים את עצמו למסך.
          ⚠️ **ואינו הפתרון ל-50** — חיפוש בתוך הרשימה, סימון-הכול ודרך לסדר 50 פריטים הם
          הכרעת-מוצר של ישי, ומוצגים לו במוקאפ. **זה מרחיב את מה שקיים, לא מחליף אותו.**
        */}
        <ul className="max-h-[40vh] space-y-1 overflow-auto" data-testid="export-column-list">
          {ordered.map((column, index) => (
            <ColumnRow
              key={column.key}
              column={column}
              index={index}
              total={ordered.length}
              checked={selected.has(column.key)}
              onToggle={onToggle}
              onMove={onMove}
              onMoveToTop={onMoveToTop}
              onDragStart={onDragStart}
              onDropBefore={onDropBefore}
            />
          ))}
        </ul>
        <p className="mt-1 text-xs text-slate-400">הסדר כאן הוא הסדר בקובץ</p>
      </div>
    </section>
  )
}
