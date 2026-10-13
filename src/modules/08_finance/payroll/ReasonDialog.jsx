// דיאלוג החלטה עם נימוק — משותף לכל פעולת מנהלת שדורשת סיבה שמורה: "אשר לפי תיעוד",
// "דחה פנייה", "טופל מחוץ לדוח", סגירת פנייה אחרי הפקה, ביטול בדיקה ושינוי מועד אחרון.
//
// 🔑 טופס עם ולידציה בשני מקומות (מדריך ה-UX §ג): סיכום שגיאות בראש הטופס שמקבל פוקוס,
// עם קישור לכל שדה, **וגם** שגיאה ליד השדה שחוזרת על שם התווית. כשל בשרת משאיר את מה
// שהוקלד ואת הדיאלוג פתוח — "נשמר" מוצג רק אחרי תשובה מוצלחת.

import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { payrollErrorMessage } from './payrollModel'

function fieldError(field, value) {
  const text = String(value ?? '').trim()
  if (field.required && text === '') return `${field.label}: שדה חובה`
  if (field.minLength && text !== '' && text.length < field.minLength) {
    return `${field.label}: לפחות ${field.minLength} תווים`
  }
  return null
}

export default function ReasonDialog({
  open,
  title,
  description,
  fields,
  confirmLabel,
  onSubmit,
  onClose,
  testId = 'reason-dialog',
}) {
  const formId = useId()
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const summaryRef = useRef(null)
  const errorList = Object.entries(errors).filter(([, message]) => message)

  // הפוקוס עובר לסיכום השגיאות רק אחרי ניסיון שמירה שנכשל — לא בכל הקלדה.
  const [focusTick, setFocusTick] = useState(0)
  useEffect(() => {
    if (focusTick > 0) summaryRef.current?.focus()
  }, [focusTick])

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    for (const field of fields) nextErrors[field.name] = fieldError(field, values[field.name])
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) {
      setFocusTick((tick) => tick + 1)
      return
    }
    setSaving(true)
    setServerError('')
    try {
      const trimmed = Object.fromEntries(
        fields.map((field) => [field.name, String(values[field.name] ?? '').trim() || null]),
      )
      await onSubmit(trimmed)
    } catch (error) {
      setServerError(payrollErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !saving && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-lg" data-testid={testId}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          {errorList.length > 0 && (
            <div
              ref={summaryRef}
              tabIndex={-1}
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              data-testid={`${testId}-errors`}
            >
              <p className="font-semibold">יש לתקן לפני שמירה:</p>
              <ul className="mt-1 list-disc pr-5">
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
          {fields.map((field) => {
            const inputId = `${formId}-${field.name}`
            const error = errors[field.name]
            const InputTag = field.multiline ? 'textarea' : 'input'
            return (
              <div key={field.name} className="flex flex-col gap-1">
                <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
                  {field.label}
                  {field.required ? '' : ' (רשות)'}
                </label>
                {field.help && <p className="text-xs text-slate-600">{field.help}</p>}
                <InputTag
                  id={inputId}
                  dir="auto"
                  rows={field.multiline ? 3 : undefined}
                  value={values[field.name] ?? ''}
                  placeholder={field.placeholder}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${inputId}-error` : undefined}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
                  data-testid={`${testId}-${field.name}`}
                />
                {error && (
                  <p id={`${inputId}-error`} className="text-xs text-red-700">
                    {error}
                  </p>
                )}
              </div>
            )
          })}
          {serverError && (
            <p role="alert" className="text-sm text-red-700" data-testid={`${testId}-server-error`}>
              {serverError}
            </p>
          )}
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form={formId}
            disabled={saving}
            className="h-auto px-4 py-2"
            data-testid={`${testId}-submit`}
          >
            {saving ? 'שומר…' : confirmLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onClose}
            className="h-auto px-4 py-2"
          >
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
