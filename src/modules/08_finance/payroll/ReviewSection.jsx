// לשונית "מעקב דיילות" (חוזה §4.1 סעיף 2, מדריך ה-UX §א.3).
// שלושה צירים נפרדים ולא מתערבבים: **משלוח** (נשלח/נכשל/לא ידוע) · **תגובה** (אישרה/פנייה/
// אושר לפי תיעוד) · **בקשה** (מוכנה להפקה או לא). "נשלח" אינו "אושר".
// המונים והחיפוש רצים על כל הרשימה שהשרת החזיר, בדיילות שונות — לא על העמוד המוצג.

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import Disclosure from '@/components/Disclosure'
import FilterPill from '@/components/FilterPill'
import ListSearch from '@/components/ListSearch'
import LoadingOrError from '@/components/LoadingOrError'
import Ltr from '@/components/Ltr'
import { useConfirm } from '@/components/ConfirmDialog'
import { useToast } from '@/components/ToastProvider'
import { getEmailTemplate } from '@/api/email'
import { fillEmailTemplate } from '@/lib/email'
import { formatTimestampFull } from '@/lib/dates'
import { salaryPeriodLabel } from '@/lib/salaryReport'
import {
  approvePayrollDraft,
  cancelPayrollReview,
  continuePayrollDistribution,
  distributePayrollReview,
  setPayrollReviewDeadline,
} from '../payrollApi'
import { Banner, Card } from './payrollUi'
import ReasonDialog from './ReasonDialog'
import ReviewTable from './ReviewTable'
import {
  FILTERS,
  FILTER_LABELS,
  defaultFilter,
  filterRecipients,
  isStaleCode,
  isoToJerusalemLocal,
  jerusalemLocalToIso,
  payrollErrorMessage,
} from './payrollModel'

const REVIEW_TEMPLATE = 'תבנית_מייל_סיכום_שעות_דיילת'

function newRequestId() {
  return globalThis.crypto.randomUUID()
}

export default function ReviewSection({
  review,
  reviewError,
  onRetry,
  preview,
  filter,
  query,
  page,
  update,
  onReload,
  onRefreshReview,
  canEdit,
}) {
  if (reviewError) {
    return (
      <Card testId="payroll-review-error">
        <LoadingOrError
          error={payrollErrorMessage(reviewError)}
          onRetry={onRetry}
          retryTestId="payroll-review-retry"
        />
      </Card>
    )
  }
  if (review === undefined) {
    return (
      <Card testId="payroll-review-loading">
        <LoadingOrError loading skeleton={{ variant: 'table' }} />
      </Card>
    )
  }
  if (review === null) {
    return (
      <Card testId="payroll-review-none">
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-sm font-medium text-slate-700">עדיין לא נשלחו סיכומים לחודש הזה</p>
          <p className="text-sm text-slate-600">
            מתחילים מהטיוטה: בודקים את השורות ושולחים סיכומים
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-auto px-4 py-2"
            onClick={() => update({ view: 'draft' })}
          >
            לטיוטה
          </Button>
        </div>
      </Card>
    )
  }
  return (
    <ReviewBody
      review={review}
      preview={preview}
      filter={filter}
      query={query}
      page={page}
      update={update}
      onReload={onReload}
      onRefreshReview={onRefreshReview}
      canEdit={canEdit}
    />
  )
}

function ReviewBody({
  review,
  preview,
  filter,
  query,
  page,
  update,
  onReload,
  onRefreshReview,
  canEdit,
}) {
  const info = review.review
  const distributed = Boolean(info.distributed_at)
  const deadlinePassed = Boolean(info.deadline_passed)
  const issued = info.status === 'issued'
  // ברירת-המחדל ("דורש טיפול" כשיש) נגזרת מהמונים של כל הרשימה, לפני הסינון.
  const activeFilter = filter ?? defaultFilter(countsOnly(review, deadlinePassed, distributed))
  const { rows, counts } = filterRecipients(review.recipients, {
    filter: activeFilter,
    query,
    deadlinePassed,
    distributed,
  })

  return (
    <div className="flex flex-col gap-4" data-testid="payroll-review">
      {info.version_current === false && !issued && (
        <Banner tone="warn" testId="payroll-review-stale">
          <p>הנתונים השתנו. יש לרענן לפני אישור</p>
          <Button
            type="button"
            variant="outline"
            className="mt-2 h-auto px-4 py-2"
            onClick={onRefreshReview}
            data-testid="payroll-review-refresh"
          >
            רענן
          </Button>
        </Banner>
      )}
      {issued && (
        <Banner tone="ok" testId="payroll-review-issued">
          הדוח לחודש הזה הופק. אפשר לצפות בו בהיסטוריה.
        </Banner>
      )}
      {canEdit && !issued && (
        <PrepareSteps review={review} preview={preview} onReload={onReload} onStale={onReload} />
      )}

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="סינון">
          {FILTERS.map((key) => (
            <FilterPill
              key={key}
              on={activeFilter === key}
              tone={key === 'action' ? 'warn' : undefined}
              onClick={() => update({ filter: key, page: null })}
              testId={`payroll-filter-${key}`}
            >
              {FILTER_LABELS[key]} <Ltr>{counts[key]}</Ltr>
            </FilterPill>
          ))}
          <div className="w-full sm:w-64">
            <ListSearch
              value={query}
              onChange={(value) => update({ q: value, page: null })}
              label="חיפוש דיילת לפי שם"
              placeholder="שם הדיילת"
              testId="payroll-review-search"
            />
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="py-8 text-center" data-testid="payroll-review-filter-empty">
            <p className="text-sm text-slate-700">אין דיילות במסנן הזה</p>
            <Button
              type="button"
              variant="outline"
              className="mt-2 h-auto px-4 py-2"
              onClick={() => update({ filter: 'all', q: null, page: null })}
            >
              הצג הכל
            </Button>
          </div>
        ) : (
          <ReviewTable
            rows={rows}
            page={page}
            onPage={(next) => update({ page: next })}
            review={review}
            canEdit={canEdit && !issued}
            onOpenCase={(caseId) => update({ caseId })}
            onReload={onReload}
          />
        )}
      </Card>

      {canEdit && !issued && <CancelReview reviewId={info.review_id} onDone={onReload} />}
    </div>
  )
}

function countsOnly(review, deadlinePassed, distributed) {
  return filterRecipients(review.recipients, {
    filter: 'all',
    query: '',
    deadlinePassed,
    distributed,
  }).counts
}

// ── שלושת הצעדים לפני שליחה: אישור טיוטה · מועד אחרון · שליחה ─────────────────────

function PrepareSteps({ review, preview, onReload, onStale }) {
  const info = review.review
  const toast = useToast()
  const confirm = useConfirm()
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(null)
  const [deadlineLocal, setDeadlineLocal] = useState(isoToJerusalemLocal(info.response_deadline))
  const [deadlineReasonOpen, setDeadlineReasonOpen] = useState(false)
  const template = useReviewTemplate()
  const approved = Boolean(info.manager_approved)
  const deadlineSet = Boolean(info.response_deadline)
  const distributed = Boolean(info.distributed_at)
  const periodLabel = salaryPeriodLabel(info.period)
  const toSend = review.recipients.filter((r) => r.email_present !== false && !r.delivery).length

  async function run(key, action) {
    setBusy(key)
    setError('')
    try {
      await action()
    } catch (err) {
      if (isStaleCode(err?.code)) onStale()
      setError(payrollErrorMessage(err))
    } finally {
      setBusy('')
    }
  }

  const approve = () =>
    run('approve', async () => {
      await approvePayrollDraft({
        reviewId: info.review_id,
        expectedRevision: info.revision,
        version: preview?.version,
      })
      toast.success('הטיוטה אושרה')
      await onReload()
    })

  function saveDeadline(reason = null) {
    const iso = jerusalemLocalToIso(deadlineLocal)
    if (!iso) {
      setError('יש לבחור תאריך ושעה למועד האחרון')
      return Promise.resolve()
    }
    if (distributed && reason === null) {
      setDeadlineReasonOpen(true)
      return Promise.resolve()
    }
    return run('deadline', async () => {
      await setPayrollReviewDeadline({
        reviewId: info.review_id,
        expectedRevision: info.revision,
        deadline: iso,
        reason,
      })
      toast.success('המועד האחרון נשמר')
      await onReload()
    })
  }

  async function send(mode) {
    const sample = sampleMail(template, review.recipients[0], periodLabel, info.response_deadline)
    const ok = await confirm({
      title: mode === 'reminder' ? 'לשלוח תזכורת?' : 'לשלוח סיכומים לדיילות?',
      message: (
        <>
          <span className="block">חודש: {periodLabel}</span>
          <span className="block">
            מועד אחרון לתגובה: <Ltr>{formatTimestampFull(info.response_deadline, '—')}</Ltr>
          </span>
          <span className="block">
            {mode === 'reminder'
              ? 'תזכורת תישלח לכל מי שעוד לא השיבה.'
              : `יישלחו ${toSend} סיכומים אישיים. כל דיילת רואה רק את השורות שלה.`}
          </span>
          {sample && (
            <span className="mt-2 block whitespace-pre-line rounded border border-slate-200 bg-slate-50 p-2 text-slate-700">
              {sample}
            </span>
          )}
        </>
      ),
      confirmLabel: mode === 'reminder' ? 'שלח תזכורת' : 'שלח סיכומים',
    })
    if (!ok) return
    await run('send', () => distributeAll({ info, mode, toast, setProgress, onReload }))
  }

  const sendBlockedReason = !approved
    ? 'יש לאשר את הטיוטה קודם'
    : !deadlineSet
      ? 'יש לקבוע מועד אחרון לתגובה'
      : info.version_current === false
        ? 'הנתונים השתנו. יש לרענן לפני שליחה'
        : null

  return (
    <Card testId="payroll-review-steps">
      <ol className="flex flex-col gap-3 text-sm">
        <li className="flex flex-wrap items-center gap-2" data-testid="payroll-step-approve">
          <span className="font-semibold">1. אישור הטיוטה</span>
          {approved ? (
            <span className="text-slate-700">
              אושרה ב-<Ltr>{formatTimestampFull(info.manager_approved_at, '—')}</Ltr>
            </span>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-auto px-4 py-2"
              disabled={busy !== '' || !preview?.version || info.version_current === false}
              onClick={approve}
              data-testid="payroll-approve-draft"
            >
              {busy === 'approve' ? 'שומר…' : 'אשר טיוטה'}
            </Button>
          )}
        </li>
        <li className="flex flex-wrap items-center gap-2" data-testid="payroll-step-deadline">
          <label htmlFor="payroll-deadline" className="font-semibold">
            2. מועד אחרון לתגובה (שעון ישראל)
          </label>
          <input
            id="payroll-deadline"
            type="datetime-local"
            dir="ltr"
            value={deadlineLocal}
            onChange={(e) => setDeadlineLocal(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5"
            data-testid="payroll-deadline-input"
          />
          <Button
            type="button"
            variant="outline"
            className="h-auto px-4 py-2"
            disabled={busy !== '' || deadlineLocal === ''}
            onClick={() => saveDeadline()}
            data-testid="payroll-deadline-save"
          >
            {busy === 'deadline' ? 'שומר…' : 'שמור מועד'}
          </Button>
          {deadlineSet && (
            <span className="text-slate-700">
              נשמר: <Ltr>{formatTimestampFull(info.response_deadline)}</Ltr>
            </span>
          )}
        </li>
        <li className="flex flex-col gap-1" data-testid="payroll-step-send">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">3. שליחה</span>
            <Button
              type="button"
              className="h-auto px-4 py-2"
              disabled={busy !== '' || Boolean(sendBlockedReason)}
              onClick={() => send('initial')}
              data-testid="payroll-distribute"
            >
              {busy === 'send' ? 'שולח…' : 'שלח סיכומים לדיילות'}
            </Button>
            {distributed && (
              <Button
                type="button"
                variant="outline"
                className="h-auto px-4 py-2"
                disabled={busy !== '' || Boolean(sendBlockedReason)}
                onClick={() => send('reminder')}
                data-testid="payroll-remind"
              >
                שלח תזכורת
              </Button>
            )}
          </div>
          {sendBlockedReason && (
            <p className="text-slate-700" data-testid="payroll-send-reason">
              {sendBlockedReason}
            </p>
          )}
          {distributed && (
            <p className="text-slate-600">
              נשלח לראשונה ב-<Ltr>{formatTimestampFull(info.distributed_at)}</Ltr>. שליחה נוספת
              יוצאת רק למי שעוד לא קיבלה סיכום.
            </p>
          )}
        </li>
      </ol>
      <p aria-live="polite" className="mt-2 text-sm text-slate-700" data-testid="payroll-progress">
        {progress
          ? `נשלחו ${progress.sent} מתוך ${progress.total} סיכומים${progress.done ? '' : '…'}`
          : ''}
      </p>
      {error && (
        <Banner tone="error" className="mt-2" testId="payroll-review-action-error">
          {error}
        </Banner>
      )}
      <Disclosure summary="דוגמה למייל לדיילת" testId="payroll-sample-mail">
        {template.status === 'error' ? (
          <p>לא ניתן להציג דוגמה: התבנית חסרה או לא תקינה בהגדרות</p>
        ) : (
          <p className="whitespace-pre-line">
            {sampleMail(template, review.recipients[0], periodLabel, info.response_deadline) ||
              'טוען…'}
          </p>
        )}
      </Disclosure>
      {deadlineReasonOpen && (
        <ReasonDialog
          open
          title="שינוי מועד אחרון"
          description="הסיכומים כבר נשלחו. השינוי נרשם ומוצג לדיילות בסיכום."
          fields={[{ name: 'reason', label: 'סיבת השינוי', required: true, minLength: 5 }]}
          confirmLabel="שמור מועד"
          onClose={() => setDeadlineReasonOpen(false)}
          onSubmit={async ({ reason }) => {
            setDeadlineReasonOpen(false)
            await saveDeadline(reason)
          }}
          testId="payroll-deadline-reason"
        />
      )}
    </Card>
  )
}

// לולאת השליחה: הקריאה הראשונה מזמינה את כל הניסיונות, וכל קריאה מעבדת מנה קטנה עד
// ש-`remaining=0`. ריענון באמצע לא מאבד כלום — הניסיונות שמורים בשרת.
async function distributeAll({ info, mode, toast, setProgress, onReload }) {
  let sent = 0
  let total = 0
  const absorb = (result) => {
    sent += result.processed.filter((p) => p.state === 'sent').length
    total += result.processed.length
    return result.remaining
  }
  try {
    let remaining = absorb(
      await distributePayrollReview({
        reviewId: info.review_id,
        expectedRevision: info.revision,
        recipientIds: null,
        mode,
        requestId: newRequestId(),
      }),
    )
    toast.info('שליחת הסיכומים התחילה')
    setProgress({ sent, total: total + remaining, done: false })
    while (remaining > 0) {
      remaining = absorb(await continuePayrollDistribution({ reviewId: info.review_id }))
      setProgress({ sent, total: total + remaining, done: false })
    }
    setProgress({ sent, total, done: true })
    if (total > 0 && sent === total) toast.success('הסיכומים נשלחו')
    else if (total > 0) {
      toast.error(`נשלחו ${sent} מתוך ${total} סיכומים. ${total - sent} מסומנים ברשימה`)
    }
  } finally {
    await onReload()
  }
}

function useReviewTemplate() {
  const [state, setState] = useState({ status: 'loading', body: '' })
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    getEmailTemplate(REVIEW_TEMPLATE)
      .then((body) => mounted.current && setState({ status: 'ok', body }))
      .catch(() => mounted.current && setState({ status: 'error', body: '' }))
    return () => {
      mounted.current = false
    }
  }, [])
  return state
}

// תצוגה מקדימה בלבד — לא נשלחת. בנויה מדיילת אמיתית אחת ומאותו מנוע-מילוי של המייל.
function sampleMail(template, recipient, periodLabel, deadline) {
  if (template.status !== 'ok') return ''
  return fillEmailTemplate(template.body, {
    '[שם_דיילת]': recipient?.hostess_name ?? '',
    '[חודש_דיווח_ושנה]': periodLabel,
    '[לינק_בדיקת_שעות]': '(קישור אישי לכל דיילת)',
    '[מועד_אחרון_לתגובה]': formatTimestampFull(deadline, '(טרם נקבע)'),
  })
}

function CancelReview({ reviewId, onDone }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  return (
    <div className="flex justify-start">
      <Button
        type="button"
        variant="link"
        className="h-auto p-0 text-sm text-slate-600 underline"
        onClick={() => setOpen(true)}
        data-testid="payroll-cancel-review"
      >
        בטל את הבדיקה
      </Button>
      {open && (
        <ReasonDialog
          open
          title="ביטול הבדיקה"
          description="הקישורים שנשלחו לדיילות יפסיקו לעבוד. הנתונים לא נמחקים, ואפשר לפתוח בדיקה חדשה מהטיוטה."
          fields={[{ name: 'reason', label: 'סיבת הביטול', required: true, minLength: 5 }]}
          confirmLabel="בטל בדיקה"
          onClose={() => setOpen(false)}
          onSubmit={async ({ reason }) => {
            await cancelPayrollReview({ reviewId, reason })
            setOpen(false)
            toast.success('הבדיקה בוטלה')
            await onDone()
          }}
          testId="payroll-cancel-dialog"
        />
      )}
    </div>
  )
}
