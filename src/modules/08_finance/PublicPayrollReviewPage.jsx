// הדף האישי לבדיקת שעות — `/payroll-review/:token` (מ8, דוח שכר מקצה לקצה, §7.107).
//
// 🔴 **דף בלי התחברות, בלי סרגל ובלי תפקיד** — דיילת שקיבלה מייל עם קישור אישי. הנתיב
// מוגדר ב-`App.jsx` (בונה D), מחוץ ל-`MainLayout`, ליד `/feedback/:token`. כאן רק הרכיב.
// 🔴 **שלד כמו `PublicConfirmPage`, אבל לא החוקים שלו** (מדריך ה-UX §ו3): אין טוקן משמרת,
// אין "תשובה אחת ואין שנייה", ופתיחת הקישור לא משנה דבר. לפני ההפקה דיילת שאישרה עדיין
// יכולה לדווח טעות; אחרי ההפקה "יש טעות" נרשמת כפנייה אחרי הפקה.
// 🔴 **בלי בנק, בלי ת"ז, בלי מזהים** — השרת לא שולח אותם, והדף לא מציג שום מזהה טכני.
// 🔑 לשון נקבה לאורך כל הדף (הכרעת האפיון: הדף האישי ומייל הדיילת בנקבה).
// 🔑 תוצאות בתוך הדף, בלי טוסטים (חוזה §4.1). כל תשובה נשמרת רק אחרי POST מפורש.

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import Money from '@/components/Money'
import Ltr from '@/components/Ltr'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate, formatTimestampFull, weekdayOf } from '@/lib/dates'
import {
  EMPTY_OBJECTION,
  OBJECTION_CATEGORIES,
  OBJECTION_FIELD_MESSAGES,
  REVIEW_ACTION,
  buildCasePayload,
  fetchPayrollReview,
  newRequestId,
  respondToPayrollReview,
  validateObjection,
  zeroReasonText,
} from './payrollReviewPublicApi'

// ─── נוסחים ────────────────────────────────────────────────────────────────

const INVALID_TEXT = 'הקישור הזה כבר לא בתוקף. לסיכום עדכני אפשר לפנות למנהלת'
const LOAD_FAILED_TEXT = 'לא הצלחנו לטעון את הסיכום. נסי שוב'

// תוצאה שמוצגת בתוך הדף אחרי תשובה. `tone` קובע צבע — אבל המילים לבדן נושאות את המשמעות.
const OUTCOME = {
  approved: { tone: 'success', text: 'האישור נשמר. אפשר לסגור את הדף' },
  saved: { tone: 'success', text: 'הפנייה נשמרה לטיפול. אפשר לסגור את הדף' },
  issued_case_saved: {
    tone: 'success',
    text: 'הפנייה נשמרה לטיפול. הדוח כבר הופק, ולכן היא תטופל בנפרד',
  },
  issued: { tone: 'info', text: 'הדוח לחודש הזה כבר הופק. אם יש טעות, אפשר לדווח עליה' },
  case_open: {
    tone: 'info',
    text: 'יש לך פנייה פתוחה על הסיכום הזה. אפשר לאשר אחרי שהיא תטופל',
  },
  stale: { tone: 'warn', text: 'הסיכום עודכן מאז שפתחת את הדף. טעני את הדף מחדש' },
  rate_limited: { tone: 'warn', text: 'היו יותר מדי ניסיונות בזמן קצר. נסי שוב בעוד כמה דקות' },
  approve_failed: { tone: 'error', text: 'האישור לא נשמר. נסי שוב' },
  objection_failed: { tone: 'error', text: 'הפנייה לא נשמרה. נסי שוב. מה שכתבת נשמר כאן' },
}

const OUTCOME_TONE = {
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-teal-200 bg-teal-50 text-teal-800',
  warn: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-700',
}

// מצב ההחלטה הנוכחי, כפי שהדיילת רואה אותו. "אושר לפי תיעוד" ולא "אושר בידי המנהלת"
// (מדריך ה-UX §ב: הבסיס, לא בעל התפקיד).
const DECISION_TEXT = {
  hostess_approved: 'אישרת את הנתונים',
  objection_open: 'הפנייה שלך בטיפול',
  manager_approved_no_response: 'אושר לפי תיעוד, בלי תשובה ממך',
  manager_resolved: 'הפנייה שלך טופלה',
}

const BASIS_LABEL = { cancellation_compensation: 'פיצוי ביטול' }

// "ספטמבר 2026" מ-`2026-09-01`. ‏Intl ולא ייבוא מ-`salaryReport.js`: הוא גורר את בונה ה-XLSX
// לדף שנטען בטלפון בלי סיבה.
function periodLabel(period) {
  const [year, month] = String(period ?? '')
    .split('-')
    .map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(month)) return ''
  const name = new Intl.DateTimeFormat('he-IL', { month: 'long', timeZone: 'UTC' }).format(
    Date.UTC(year, month - 1, 1),
  )
  return `${name} ${year}`
}

function kindLabel(summary) {
  return summary?.kind === 'supplement' && summary?.supplement_seq
    ? ` · השלמה ${summary.supplement_seq}`
    : ''
}

// ─── הדף ───────────────────────────────────────────────────────────────────

export default function PublicPayrollReviewPage() {
  const { token } = useParams()
  const [loadState, setLoadState] = useState('loading')
  const [summary, setSummary] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [outcome, setOutcome] = useState(null)
  const [mode, setMode] = useState('view')
  const [form, setForm] = useState(EMPTY_OBJECTION)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(null)
  // 🔑 מזהה הבקשה נשמר בין ניסיונות של אותה פעולה עד שמתקבלת תשובה ודאית מהשרת. כך
  // "נסי שוב" אחרי תשובה שאבדה בדרך מחזיר את מה שכבר נשמר, ולא יוצר פנייה שנייה.
  const requestRef = useRef(null)

  // טעינה — אותה תבנית אפקט כמו `PublicConfirmPage` (IIFE + שומר ביטול; רענון דרך `reloadKey`).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const payload = await fetchPayrollReview(token)
        if (cancelled) return
        if (payload?.state === 'ok') {
          setSummary(payload)
          setLoadState('ready')
        } else if (payload?.state === 'rate_limited') {
          // הגבלת קצב אינה "הקישור לא בתוקף" — הקישור תקין, רק צריך לחכות.
          setLoadState((current) => (current === 'ready' ? current : 'rate_limited'))
        } else {
          setSummary(null)
          setLoadState('invalid')
        }
      } catch {
        if (cancelled) return
        // 🔴 כשל רשת אינו "הקישור לא בתוקף" — רק כאן יש "נסי שוב".
        setLoadState((current) => (current === 'ready' ? current : 'load_failed'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, reloadKey])

  function reload() {
    setLoadState((current) => (current === 'ready' ? current : 'loading'))
    setReloadKey((key) => key + 1)
  }

  function requestIdFor(action) {
    if (requestRef.current?.action !== action) {
      requestRef.current = { action, id: newRequestId() }
    }
    return requestRef.current.id
  }

  // תשובה ודאית מהשרת ⇒ המזהה נסגר. כל מצב חוץ מכשל רשת הוא תשובה ודאית.
  function applyResult(result) {
    requestRef.current = null
    const state = result?.state
    if (state === 'invalid') {
      setSummary(null)
      setLoadState('invalid')
      return
    }
    if (state === 'validation') {
      const field = OBJECTION_FIELD_MESSAGES[result.field] ? result.field : 'description'
      setFormErrors({ [field]: serverFieldMessage(field) })
      return
    }
    // תוצאה לא מוכרת ⇒ "הסיכום עודכן, טעני מחדש": המצב הבטוח, שלא מבטיח שמשהו נשמר.
    const key = OUTCOME[state] ? state : 'stale'
    if (key === 'saved' || key === 'issued_case_saved') {
      setForm(EMPTY_OBJECTION)
      setMode('view')
    }
    setOutcome(key)
    if (key === 'approved' || key === 'saved' || key === 'issued_case_saved') reload()
  }

  async function submit(action, caseInput) {
    setSaving(action)
    setOutcome(null)
    try {
      const result = await respondToPayrollReview({
        token,
        requestId: requestIdFor(action),
        digest: summary?.digest,
        action,
        caseInput,
      })
      applyResult(result)
    } catch {
      // 🚫 לעולם לא "נשמר" כשלא נשמר. הטופס, הטקסט והמזהה נשארים.
      setOutcome(action === REVIEW_ACTION.approve ? 'approve_failed' : 'objection_failed')
    } finally {
      setSaving(null)
    }
  }

  function submitObjection() {
    const errors = validateObjection(form)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    submit(REVIEW_ACTION.objection, buildCasePayload(form))
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800">
      <main className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-teal-600" aria-hidden="true" />
          <span className="text-xs font-semibold text-slate-500">REG-IN · סיכום שעות לבדיקה</span>
        </div>

        {loadState === 'loading' && <Skeleton />}
        {loadState === 'invalid' && <Notice testId="review-invalid" text={INVALID_TEXT} />}
        {loadState === 'rate_limited' && (
          <Notice testId="review-rate-limited" text={OUTCOME.rate_limited.text} onRetry={reload} />
        )}
        {loadState === 'load_failed' && (
          <Notice testId="review-load-failed" text={LOAD_FAILED_TEXT} onRetry={reload} />
        )}
        {loadState === 'ready' && summary && (
          <ReviewBody
            summary={summary}
            outcome={outcome}
            mode={mode}
            form={form}
            formErrors={formErrors}
            saving={saving}
            onApprove={() => submit(REVIEW_ACTION.approve, null)}
            onStartObjection={() => {
              setOutcome(null)
              setMode('objection')
            }}
            onCancelObjection={() => {
              setMode('view')
              setFormErrors({})
            }}
            onFormChange={setForm}
            onSubmitObjection={submitObjection}
            onReload={() => {
              setOutcome(null)
              reload()
            }}
          />
        )}
      </main>
    </div>
  )
}

// שדה שהשרת דחה ⇒ אותה הודעה שהבדיקה בדפדפן הייתה נותנת. שדה לא מוכר ⇒ התיאור.
function serverFieldMessage(field) {
  return OBJECTION_FIELD_MESSAGES[field] ?? OBJECTION_FIELD_MESSAGES.description
}

// ─── חלקים ─────────────────────────────────────────────────────────────────

// 🚫 שלד בלי הבטחה מוקדמת: אין "טוען את השעות שלך" לפני שהטוקן נבדק.
function Skeleton() {
  return (
    <div className="flex flex-col gap-3" data-testid="review-loading" aria-busy="true">
      <span className="sr-only">טוען</span>
      <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
      <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
    </div>
  )
}

function Notice({ text, onRetry, testId }) {
  return (
    <div
      className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center"
      role="status"
      data-testid={testId}
    >
      <p className="max-w-[260px] text-sm leading-relaxed text-slate-700">{text}</p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="h-auto min-h-11 rounded-xl border-slate-300 px-5 py-3 font-semibold text-slate-700"
          data-testid="review-retry"
        >
          נסי שוב
        </Button>
      )}
    </div>
  )
}

function ReviewBody({
  summary,
  outcome,
  mode,
  form,
  formErrors,
  saving,
  onApprove,
  onStartObjection,
  onCancelObjection,
  onFormChange,
  onSubmitObjection,
  onReload,
}) {
  const objecting = mode === 'objection'
  const deadline = formatTimestampFull(summary.deadline)

  return (
    <div className="flex flex-col gap-4" data-testid="review-ready">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-bold">שלום, {summary.first_name}</h1>
        <p className="text-sm text-slate-600" data-testid="review-period">
          סיכום שעות לבדיקה · {periodLabel(summary.period)}
          {kindLabel(summary)}
        </p>
        {summary.phase === 'post_issue' ? (
          <p className="text-sm text-slate-600" data-testid="review-issued-note">
            הדוח לחודש הזה כבר הופק
          </p>
        ) : (
          deadline && (
            <p className="text-sm text-slate-600" data-testid="review-deadline">
              אפשר להשיב עד <Ltr>{deadline}</Ltr>
            </p>
          )
        )}
      </header>

      <DecisionLine decision={summary.decision} openCase={summary.open_case} />

      {outcome && <OutcomeBanner outcomeKey={outcome} onReload={onReload} />}

      <ShiftList
        rows={summary.rows ?? []}
        selectable={objecting}
        selected={form.rowKeys}
        onToggle={(key) =>
          onFormChange((current) => ({
            ...current,
            rowKeys: current.rowKeys.includes(key)
              ? current.rowKeys.filter((k) => k !== key)
              : [...current.rowKeys, key],
          }))
        }
      />

      <div
        className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold"
        data-testid="review-total"
      >
        <span>סה"כ</span>
        <Money amount={summary.total} cents />
      </div>

      {objecting ? (
        <ObjectionForm
          form={form}
          errors={formErrors}
          saving={saving === REVIEW_ACTION.objection}
          onChange={onFormChange}
          onSubmit={onSubmitObjection}
          onCancel={onCancelObjection}
        />
      ) : (
        <Actions
          canApprove={Boolean(summary.can_approve)}
          canObject={Boolean(summary.can_object)}
          saving={saving}
          onApprove={onApprove}
          onObject={onStartObjection}
        />
      )}
    </div>
  )
}

function DecisionLine({ decision, openCase }) {
  const text = DECISION_TEXT[decision?.state]
  if (!text) return null
  const at = formatTimestampFull(decision?.at)
  return (
    <p
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
      data-testid="review-decision"
    >
      {text}
      {at && (
        <>
          {' · '}
          <Ltr>{at}</Ltr>
        </>
      )}
      {openCase?.category && (
        <>
          {' · '}
          {OBJECTION_CATEGORIES.find((option) => option.value === openCase.category)?.label}
        </>
      )}
    </p>
  )
}

function OutcomeBanner({ outcomeKey, onReload }) {
  const look = OUTCOME[outcomeKey]
  const isError = look.tone === 'error'
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={cn('rounded-xl border px-3 py-2.5 text-sm font-semibold', OUTCOME_TONE[look.tone])}
      data-testid={`review-outcome-${outcomeKey}`}
    >
      {look.text}
      {outcomeKey === 'stale' && (
        <Button
          type="button"
          variant="outline"
          onClick={onReload}
          className="mt-2 h-auto min-h-11 w-full rounded-xl border-amber-300 py-2.5 font-semibold"
          data-testid="review-reload"
        >
          טעני מחדש
        </Button>
      )}
    </div>
  )
}

function shiftHeadline(row) {
  const date = formatDate(row.event_date)
  const day = weekdayOf(row.event_date)
  return day ? `${date} · ${day}` : date
}

// כרטיס משמרת. במצב "יש טעות" כל הכרטיס הוא כפתור בחירה (≥44px) עם `aria-pressed`.
function ShiftCard({ row, selectable, selected, onToggle }) {
  const zeroText = zeroReasonText(row.zero_reason)
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold" data-testid="review-shift-date">
            <Ltr>{shiftHeadline(row)}</Ltr>
          </p>
          <p className="truncate text-sm text-slate-700" dir="auto">
            {row.event_name}
          </p>
        </div>
        <div className="shrink-0 text-left text-base font-bold">
          <Money amount={row.line_total} cents />
        </div>
      </div>
      {BASIS_LABEL[row.line_basis] && (
        <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
          {BASIS_LABEL[row.line_basis]}
        </span>
      )}
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
        <Detail label="שעות" value={<Ltr>{Number(row.hours ?? 0).toFixed(2)}</Ltr>} />
        <Detail label="תעריף" value={<Money amount={row.rate} exact />} />
        <Detail
          label="בונוס"
          value={row.bonus == null ? '—' : <Money amount={row.bonus} cents />}
        />
        <Detail
          label="נסיעות"
          value={row.travel == null ? '—' : <Money amount={row.travel} cents />}
        />
      </dl>
      {zeroText && <p className="mt-2 text-xs text-slate-600">{zeroText}</p>}
    </>
  )

  if (!selectable) {
    return (
      <li className="rounded-2xl border border-slate-200 p-3" data-testid="review-shift">
        {content}
      </li>
    )
  }
  return (
    <li data-testid="review-shift">
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onToggle(row.key)}
        className={cn(
          'block min-h-11 w-full rounded-2xl border p-3 text-right',
          selected ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600' : 'border-slate-200',
        )}
        data-testid={`review-shift-select-${row.key}`}
      >
        {content}
        <span className="mt-2 block text-xs font-semibold text-teal-700">
          {selected ? 'סומנה ✓' : 'לחצי לסימון'}
        </span>
      </button>
    </li>
  )
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <dt>{label}</dt>
      <dd className="font-semibold text-slate-700">{value}</dd>
    </div>
  )
}

function ShiftList({ rows, selectable, selected, onToggle }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-600">אין משמרות בסיכום הזה</p>
  }
  return (
    <ul className="flex flex-col gap-2.5" aria-label="המשמרות בחודש">
      {rows.map((row) => (
        <ShiftCard
          key={row.key}
          row={row}
          selectable={selectable}
          selected={selected.includes(row.key)}
          onToggle={onToggle}
        />
      ))}
    </ul>
  )
}

function Actions({ canApprove, canObject, saving, onApprove, onObject }) {
  if (!canApprove && !canObject) return null
  return (
    <div className="flex flex-col gap-2.5">
      {canApprove && (
        <Button
          type="button"
          disabled={saving != null}
          onClick={onApprove}
          className="h-auto min-h-11 rounded-xl bg-teal-700 py-3.5 text-base font-bold text-white hover:bg-teal-800"
          data-testid="review-approve"
        >
          {saving === REVIEW_ACTION.approve ? 'שומרת…' : 'הנתונים נכונים'}
        </Button>
      )}
      {canObject && (
        <Button
          type="button"
          variant="outline"
          disabled={saving != null}
          onClick={onObject}
          className="h-auto min-h-11 rounded-xl border-slate-300 py-3.5 text-base font-bold text-slate-700"
          data-testid="review-object"
        >
          יש טעות
        </Button>
      )}
    </div>
  )
}

const FIELD_ORDER = ['rows', 'category', 'description', 'suggested_value']
const FIELD_ANCHOR = {
  rows: 'review-missing-shift',
  category: 'review-category-hours',
  description: 'review-description',
  suggested_value: 'review-suggested',
}

// טופס "יש טעות" — באותו עמוד, לא דיאלוג. סיכום שגיאות בראש שמקבל פוקוס, ושגיאה ליד כל שדה.
function ObjectionForm({ form, errors, saving, onChange, onSubmit, onCancel }) {
  const summaryRef = useRef(null)
  const errorFields = FIELD_ORDER.filter((field) => errors[field])

  useEffect(() => {
    if (errorFields.length > 0) summaryRef.current?.focus()
  }, [errors, errorFields.length])

  function set(field, value) {
    onChange((current) => ({ ...current, [field]: value }))
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      data-testid="review-objection-form"
    >
      <p className="text-sm font-bold">מה לא נכון בסיכום?</p>
      <p className="text-xs text-slate-600">סמני את המשמרת שיש בה טעות, או "משמרת חסרה"</p>

      {errorFields.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          data-testid="review-error-summary"
        >
          <p className="font-bold">יש לתקן לפני השליחה</p>
          <ul className="mt-1 list-disc pr-5">
            {errorFields.map((field) => (
              <li key={field}>
                <a className="underline" href={`#${FIELD_ANCHOR[field]}`}>
                  {errors[field]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          id="review-missing-shift"
          type="checkbox"
          checked={form.missingShift}
          onChange={(event) => set('missingShift', event.target.checked)}
          className="h-5 w-5 accent-teal-700"
          data-testid="review-missing-shift"
        />
        משמרת חסרה בסיכום
      </label>
      <FieldError message={errors.rows} testId="review-error-rows" />

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-semibold">סוג הטעות</legend>
        <div className="flex flex-wrap gap-2">
          {OBJECTION_CATEGORIES.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm',
                form.category === option.value
                  ? 'border-teal-600 bg-teal-50 font-semibold text-teal-800'
                  : 'border-slate-300',
              )}
            >
              <input
                id={`review-category-${option.value}`}
                type="radio"
                name="review-category"
                value={option.value}
                checked={form.category === option.value}
                onChange={() => set('category', option.value)}
                className="accent-teal-700"
                data-testid={`review-category-${option.value}`}
              />
              {option.label}
            </label>
          ))}
        </div>
        <FieldError message={errors.category} testId="review-error-category" />
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="review-description" className="text-sm font-semibold">
          מה לא נכון
        </label>
        <textarea
          id="review-description"
          dir="auto"
          rows={4}
          value={form.description}
          onChange={(event) => set('description', event.target.value)}
          aria-invalid={Boolean(errors.description)}
          className="rounded-xl border border-slate-300 p-3 text-sm"
          data-testid="review-description"
        />
        <FieldError message={errors.description} testId="review-error-description" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="review-suggested" className="text-sm font-semibold">
          המספר הנכון (רשות)
        </label>
        <input
          id="review-suggested"
          type="text"
          inputMode="decimal"
          dir="ltr"
          value={form.suggestedValue}
          onChange={(event) => set('suggestedValue', event.target.value)}
          aria-invalid={Boolean(errors.suggested_value)}
          className="min-h-11 rounded-xl border border-slate-300 px-3 text-right text-sm"
          data-testid="review-suggested"
        />
        <FieldError message={errors.suggested_value} testId="review-error-suggested_value" />
      </div>

      <div className="flex flex-col gap-2.5">
        <Button
          type="submit"
          disabled={saving}
          className="h-auto min-h-11 rounded-xl bg-teal-700 py-3.5 text-base font-bold text-white hover:bg-teal-800"
          data-testid="review-submit-objection"
        >
          {saving ? 'שולחת…' : 'שלחי פנייה'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={onCancel}
          className="h-auto min-h-11 rounded-xl border-slate-300 py-3 text-base font-semibold text-slate-700"
          data-testid="review-cancel-objection"
        >
          חזרה לסיכום
        </Button>
      </div>
    </form>
  )
}

function FieldError({ message, testId }) {
  if (!message) return null
  return (
    <p className="text-sm text-red-700" data-testid={testId}>
      {message}
    </p>
  )
}
