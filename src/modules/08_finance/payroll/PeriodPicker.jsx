// בורר חודש-העבודה. חודש מהרשימה + שנה בשדה, והחלה בלחיצה — לא בכל הקלדה, כדי ששנה
// חלקית ("202") לא תטען תצוגה מקדימה של חודש לא קיים. השרת דוחה שנה מחוץ לטווח.

import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { salaryPeriodLabel } from '@/lib/salaryReport'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

function monthName(month) {
  return salaryPeriodLabel(`2000-${String(month).padStart(2, '0')}-01`).split(' ')[0]
}

export default function PeriodPicker({ period, onApply }) {
  const id = useId()
  const [month, setMonth] = useState(Number(period.slice(5, 7)))
  const [year, setYear] = useState(period.slice(0, 4))
  const [error, setError] = useState('')

  function apply(event) {
    event.preventDefault()
    if (!/^\d{4}$/.test(year)) {
      setError('שנה: יש להזין ארבע ספרות, למשל 2026')
      return
    }
    setError('')
    onApply(`${year}-${String(month).padStart(2, '0')}-01`)
  }

  return (
    <form
      onSubmit={apply}
      className="flex flex-wrap items-end gap-2"
      data-testid="payroll-period-picker"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-month`} className="text-xs font-medium text-slate-700">
          חודש עבודה
        </label>
        <select
          id={`${id}-month`}
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          data-testid="payroll-period-month"
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {monthName(m)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-year`} className="text-xs font-medium text-slate-700">
          שנה
        </label>
        <input
          id={`${id}-year`}
          inputMode="numeric"
          dir="ltr"
          maxLength={4}
          value={year}
          placeholder="2026"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => setYear(e.target.value.trim())}
          className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          data-testid="payroll-period-year"
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        className="h-auto px-4 py-2"
        data-testid="payroll-period-apply"
      >
        הצג
      </Button>
      {error && (
        <p id={`${id}-error`} className="w-full text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
