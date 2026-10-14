// טופס תיקון מקור מתוך פנייה (חוזה §4.1 סעיף 3 + הכרעת הסגן F5b).
// מתקן רק שעות בפועל או בונוס אישי של שיבוץ שבפנייה ושעוד לא נכלל בדוח. השכר מחושב מחדש
// בשרת בלבד; כאן מוצגים "לפני" ו"אחרי" של הערך שהוקלד — לא סכום מחושב.
// כשל שמירה משאיר את מה שהוקלד, כדי שאפשר יהיה להשוות ולנסות שוב.

import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import Ltr from '@/components/Ltr'
import { useConfirm } from '@/components/ConfirmDialog'
import { formatDate } from '@/lib/dates'
import { correctUnclaimedAssignment } from '../payrollApi'
import { Banner } from './payrollUi'
import { payrollErrorMessage } from './payrollModel'

const FIELDS = {
  actual_hours: { label: 'שעות בפועל', current: (row) => row.actual_hours ?? row.hours },
  personal_bonus: { label: 'בונוס אישי', current: (row) => row.personal_bonus ?? row.bonus ?? 0 },
}
const MAX_BONUS = 5000

function rowId(row) {
  return `${row.project_id}-${row.assignment_number}`
}

function validate({ row, field, value, reason }) {
  const errors = {}
  const n = Number(value)
  if (String(value).trim() === '' || !Number.isFinite(n)) {
    errors.value = 'הערך החדש: יש להזין מספר'
  } else if (n < 0) {
    errors.value = 'הערך החדש: לא יכול להיות שלילי'
  } else if (field === 'actual_hours' && row?.project_actual_hours != null) {
    if (n > Number(row.project_actual_hours) + 2) {
      errors.value = `הערך החדש: עד ${Number(row.project_actual_hours) + 2} שעות לאירוע הזה`
    }
  } else if (field === 'personal_bonus' && n > MAX_BONUS) {
    errors.value = `הערך החדש: עד ${MAX_BONUS} שקלים`
  }
  if (String(reason).trim().length < 5) errors.reason = 'סיבת התיקון: לפחות 5 תווים'
  return errors
}

export default function CorrectionForm({ theCase, rows, onDirty, onSaved }) {
  const confirm = useConfirm()
  const formId = useId()
  const eligible = rows.filter(
    (row) => row.salary_report_id == null && row.line_basis !== 'cancellation_compensation',
  )
  const [selected, setSelected] = useState(eligible[0] ? rowId(eligible[0]) : '')
  const [field, setField] = useState('actual_hours')
  // D9: ממלאים מראש את מה שהדיילת הציעה (שעות בלבד, F11), כדי שלא יוקלד מחדש.
  const [value, setValue] = useState(
    theCase.suggested_value != null ? String(theCase.suggested_value) : '',
  )
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const summaryRef = useRef(null)

  if (eligible.length === 0) {
    return (
      <p className="text-slate-700" data-testid="payroll-correction-none">
        אין בפנייה שיבוץ שאפשר לתקן מכאן. אפשר לסמן "טופל מחוץ לדוח" או לדחות.
      </p>
    )
  }

  const row = eligible.find((r) => rowId(r) === selected) ?? eligible[0]
  const before = FIELDS[field].current(row)
  const touch = (setter) => (event) => {
    setter(event.target.value)
    onDirty(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate({ row, field, value, reason })
    setErrors(found)
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    const ok = await confirm({
      title: 'לשמור את התיקון?',
      message: (
        <>
          <span className="block">
            {FIELDS[field].label}: מ-<Ltr>{before}</Ltr> ל-<Ltr>{Number(value)}</Ltr>
          </span>
          <span className="block">
            הסיכום של {theCase.hostess_name} יתעדכן, והיא תצטרך לאשר אותו מחדש.
          </span>
        </>
      ),
      confirmLabel: 'שמור תיקון',
    })
    if (!ok) return
    setSaving(true)
    setSaveError('')
    try {
      await correctUnclaimedAssignment({
        projectId: row.project_id,
        hostessId: theCase.hostess_id,
        assignmentNumber: row.assignment_number,
        field,
        expectedValue: before,
        newValue: Number(value),
        reason: reason.trim(),
        caseId: theCase.case_id,
      })
      onDirty(false)
      await onSaved()
    } catch (error) {
      setSaveError(`התיקון לא נשמר והנתונים לא השתנו. ${payrollErrorMessage(error)}`)
    } finally {
      setSaving(false)
    }
  }

  const errorList = Object.entries(errors)
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3"
      data-testid="payroll-correction-form"
    >
      <h3 className="font-semibold text-slate-700">תיקון שעות או בונוס</h3>
      {errorList.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-800"
          data-testid="payroll-correction-errors"
        >
          <p className="font-semibold">יש לתקן לפני שמירה:</p>
          <ul className="list-disc pr-5">
            {errorList.map(([name, message]) => (
              <li key={name}>
                <a className="underline" href={`#${formId}-${name}`}>
                  {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {eligible.length > 1 && (
        <label className="flex flex-col gap-1">
          <span className="font-medium">משמרת</span>
          <select
            value={selected}
            onChange={touch(setSelected)}
            className="rounded-lg border border-slate-300 px-2 py-1.5"
          >
            {eligible.map((r) => (
              <option key={rowId(r)} value={rowId(r)}>
                {r.event_name} · {formatDate(r.event_date, '—')}
              </option>
            ))}
          </select>
        </label>
      )}
      <fieldset className="flex flex-wrap gap-4">
        <legend className="mb-1 font-medium">מה מתקנים</legend>
        {Object.entries(FIELDS).map(([key, def]) => (
          <label key={key} className="flex items-center gap-1.5">
            <input
              type="radio"
              name={`${formId}-field`}
              value={key}
              checked={field === key}
              onChange={touch(setField)}
            />
            {def.label}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-medium">ערך נוכחי</span>
          <Ltr className="py-1.5">{before}</Ltr>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-value`} className="font-medium">
            ערך חדש
          </label>
          <input
            id={`${formId}-value`}
            type="number"
            inputMode="decimal"
            step="0.01"
            dir="ltr"
            value={value}
            placeholder="למשל 7"
            aria-invalid={Boolean(errors.value)}
            onChange={touch(setValue)}
            className="w-32 rounded-lg border border-slate-300 px-2 py-1.5"
            data-testid="payroll-correction-value"
          />
        </div>
      </div>
      {errors.value && <p className="text-xs text-red-700">{errors.value}</p>}
      <div className="flex flex-col gap-1">
        <label htmlFor={`${formId}-reason`} className="font-medium">
          סיבת התיקון
        </label>
        <textarea
          id={`${formId}-reason`}
          dir="auto"
          rows={2}
          value={reason}
          aria-invalid={Boolean(errors.reason)}
          onChange={touch(setReason)}
          className="rounded-lg border border-slate-300 px-2 py-1.5"
          data-testid="payroll-correction-reason"
        />
        {errors.reason && <p className="text-xs text-red-700">{errors.reason}</p>}
      </div>
      {saveError && (
        <Banner tone="error" testId="payroll-correction-error">
          {saveError}
        </Banner>
      )}
      <Button
        type="submit"
        disabled={saving}
        className="h-auto w-fit px-4 py-2"
        data-testid="payroll-correction-save"
      >
        {saving ? 'שומר…' : 'שמור תיקון'}
      </Button>
    </form>
  )
}
