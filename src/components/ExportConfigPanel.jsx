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

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { distinctValues, isCategorical, operatorsFor } from '@/lib/exportFilters'

const FIELD = 'w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs'
const ROW = 'flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1'

function ColumnRow({ column, index, total, checked, onToggle, onMove, onDragStart, onDropBefore }) {
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
        className="px-1 text-xs text-slate-500 disabled:opacity-30"
        disabled={index === 0}
        onClick={() => onMove(column.key, -1)}
        aria-label={`הזיזי את ${column.label} מעלה`}
      >
        ▲
      </button>
      <button
        type="button"
        className="px-1 text-xs text-slate-500 disabled:opacity-30"
        disabled={index === total - 1}
        onClick={() => onMove(column.key, 1)}
        aria-label={`הזיזי את ${column.label} מטה`}
      >
        ▼
      </button>
    </li>
  )
}

function FilterRow({ condition, columns, rows, onChange, onRemove }) {
  const column = columns.find((item) => item.key === condition.key)
  const categorical = column ? isCategorical(rows, column.key) : false
  const operators = column ? operatorsFor(column.format, categorical) : []
  const values = column && categorical ? distinctValues(rows, column.key) : []

  return (
    <div className="flex flex-wrap items-center gap-1" data-testid="export-filter-row">
      <select
        className={`${FIELD} w-28`}
        value={condition.key}
        aria-label="עמודה לסינון"
        onChange={(event) => {
          const next = columns.find((item) => item.key === event.target.value)
          const nextCategorical = next ? isCategorical(rows, next.key) : false
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
        className={`${FIELD} w-24`}
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
          className={`${FIELD} w-32`}
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
          className="h-7 w-24 text-xs"
          value={condition.value ?? ''}
          aria-label="ערך"
          placeholder={column?.format === 'date' ? 'YYYY-MM-DD' : ''}
          onChange={(event) => onChange({ ...condition, value: event.target.value })}
        />
      )}

      {condition.operator === 'between' && (
        <Input
          className="h-7 w-20 text-xs"
          value={condition.value2 ?? ''}
          aria-label="ערך שני"
          onChange={(event) => onChange({ ...condition, value2: event.target.value })}
        />
      )}

      <button
        type="button"
        className="px-1 text-xs text-slate-500"
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

      <div className="flex gap-2">
        <label className="flex-1 text-xs text-slate-600">
          מתאריך
          <Input
            type="date"
            className="h-7 text-xs"
            value={from ?? ''}
            onChange={(event) => onPeriodChange?.({ from: event.target.value, to })}
            data-testid="export-from"
          />
        </label>
        <label className="flex-1 text-xs text-slate-600">
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
              const first = operatorsFor(column.format, isCategorical(rows, column.key))[0]
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
        <ul className="max-h-56 space-y-1 overflow-auto" data-testid="export-column-list">
          {ordered.map((column, index) => (
            <ColumnRow
              key={column.key}
              column={column}
              index={index}
              total={ordered.length}
              checked={selected.has(column.key)}
              onToggle={onToggle}
              onMove={onMove}
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
