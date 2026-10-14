// פאנל פנייה (`?case=`) — לוח צד משמאל, לא דיאלוג על דיאלוג (מדריך ה-UX §א.4).
// נסגר ב-Esc; הפוקוס חוזר למה שפתח אותו.
//
// 🔴 **הכרעת הסגן F5b (13/10 23:40):** טופס התיקון מוצג למי שיש לו 'כספים' עריכה או
// 'פרויקטים' עריכה, תמיד מתוך פנייה של דיילת ורק לשיבוצים שבפנייה. השרת אוכף.
// פנייה שאין לה תיקון במערכת (משמרת חסרה, או טענה שמטופלת מחוץ לדוח) נסגרת ב"טופל מחוץ לדוח" — לעולם לא
// בתווית "תוקן".

import { useEffect, useState } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LoadingOrError from '@/components/LoadingOrError'
import Ltr from '@/components/Ltr'
import StatusTag from '@/components/StatusTag'
import { useConfirm } from '@/components/ConfirmDialog'
import { useToast } from '@/components/ToastProvider'
import { formatDate, formatTimestampFull } from '@/lib/dates'
import { getPayrollCaseDetail, resolvePayrollCase } from '../payrollApi'
import CorrectionForm from './CorrectionForm'
import ReasonDialog from './ReasonDialog'
import { Banner, NotApplicable, Td, Th } from './payrollUi'
import {
  CASE_CATEGORY_LABELS,
  caseStatusTag,
  formatHours,
  isCaseOpen,
  payrollErrorMessage,
} from './payrollModel'

const OUTCOME_DIALOGS = {
  reject: {
    title: 'דחיית הפנייה',
    description: 'הסיבה נשמרת ומוצגת לדיילת. דחייה אינה נרשמת כאישור של הדיילת.',
    fields: [
      { name: 'reason', label: 'סיבת הדחייה', required: true, minLength: 5, multiline: true },
    ],
    confirmLabel: 'דחה פנייה',
    toast: 'הפנייה נדחתה',
  },
  accept_noted: {
    title: 'טופל מחוץ לדוח',
    description:
      'הטענה מתקבלת, אבל הטיפול נעשה מחוץ לדוח הזה (למשל בדוח השלמה או אצל רואה החשבון). הסכומים בדוח לא משתנים.',
    fields: [
      {
        name: 'reason',
        label: 'איך ומתי זה מטופל',
        required: true,
        minLength: 10,
        multiline: true,
      },
    ],
    confirmLabel: 'סמן כטופל מחוץ לדוח',
    toast: 'הפנייה סומנה כטופלה מחוץ לדוח',
  },
  close: {
    title: 'סגירת פנייה אחרי הפקה',
    description: 'הדוח כבר הופק. סגירת הפנייה לא משנה סכומים בדוח.',
    fields: [
      { name: 'reason', label: 'איך הפנייה טופלה', required: true, minLength: 5, multiline: true },
    ],
    confirmLabel: 'סגור פנייה',
    toast: 'הפנייה נסגרה',
  },
}

export default function CasePanel({ caseId, canEdit, onClose, onChanged, onSendUpdated }) {
  const confirm = useConfirm()
  const toast = useToast()
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [outcome, setOutcome] = useState(null)
  const [actionError, setActionError] = useState('')
  const [sendState, setSendState] = useState('idle')

  useEffect(() => {
    let cancelled = false
    getPayrollCaseDetail(caseId)
      .then((data) => !cancelled && (setDetail(data), setError(null)))
      .catch((err) => !cancelled && setError(err))
    return () => {
      cancelled = true
    }
  }, [caseId, tick])

  async function requestClose() {
    if (dirty) {
      const discard = await confirm({
        title: 'לבטל את השינויים?',
        message: 'התיקון שהתחלת לא נשמר.',
        confirmLabel: 'בטל שינויים',
        cancelLabel: 'המשך לערוך',
      })
      if (!discard) return
    }
    onClose()
  }

  async function reload() {
    setTick((t) => t + 1)
    await onChanged()
  }

  async function submitOutcome(kind, { reason }) {
    const theCase = detail.case
    await resolvePayrollCase({
      caseId: theCase.case_id,
      expectedCaseRevision: theCase.revision,
      outcome: kind,
      reason,
    })
    setOutcome(null)
    toast.success(OUTCOME_DIALOGS[kind].toast)
    await reload()
  }

  async function reopen() {
    setActionError('')
    try {
      const theCase = detail.case
      await resolvePayrollCase({
        caseId: theCase.case_id,
        expectedCaseRevision: theCase.revision,
        outcome: 'reopen',
        reason: 'החזרה לטיפול',
      })
      await reload()
    } catch (err) {
      setActionError(payrollErrorMessage(err))
    }
  }

  async function sendUpdated() {
    setSendState('sending')
    const done = await onSendUpdated(detail.case)
    setSendState(done ? 'done' : 'idle')
  }

  return (
    <DialogPrimitive.Root open onOpenChange={(next) => !next && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <DialogPrimitive.Content
          dir="rtl"
          className="fixed top-0 bottom-0 left-0 z-50 flex w-full max-w-xl flex-col overflow-y-auto border-r border-slate-200 bg-white p-5 shadow-xl"
          data-testid="payroll-case-panel"
          aria-describedby={undefined}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <DialogPrimitive.Title className="text-lg font-bold text-slate-800">
              פנייה של דיילת
            </DialogPrimitive.Title>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-slate-600"
              onClick={requestClose}
              aria-label="סגירת הפאנל"
              data-testid="payroll-case-close"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
          {error ? (
            <LoadingOrError
              error={payrollErrorMessage(error)}
              onRetry={() => setTick((t) => t + 1)}
              retryTestId="payroll-case-retry"
            />
          ) : !detail ? (
            <LoadingOrError loading skeleton={{ variant: 'card' }} />
          ) : (
            <CaseBody
              detail={detail}
              canEdit={canEdit}
              onDirty={setDirty}
              onOutcome={setOutcome}
              onReopen={reopen}
              onCorrected={reload}
              onSendUpdated={sendUpdated}
              sendState={sendState}
              actionError={actionError}
              toast={toast}
            />
          )}
          {outcome && (
            <ReasonDialog
              open
              {...OUTCOME_DIALOGS[outcome]}
              onClose={() => setOutcome(null)}
              onSubmit={(values) => submitOutcome(outcome, values)}
              testId={`payroll-case-${outcome}`}
            />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function CaseBody({
  detail,
  canEdit,
  onDirty,
  onOutcome,
  onReopen,
  onCorrected,
  onSendUpdated,
  sendState,
  actionError,
  toast,
}) {
  const theCase = detail.case ?? {}
  const status = caseStatusTag(theCase.status)
  const open = isCaseOpen(theCase.status)
  const postIssue = theCase.phase === 'post_issue'
  // משמרת חסרה אינה ניתנת לתיקון מכאן (אין שיבוץ לתקן) ⇒ "טופל מחוץ לדוח" או דחייה.
  const correctable = ['hours', 'not_worked', 'other'].includes(theCase.category)

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-slate-800">{theCase.hostess_name}</span>
        <StatusTag label={CASE_CATEGORY_LABELS[theCase.category] ?? 'אחר'} tone="outline" />
        <StatusTag label={status.label} tone={status.tone} testId="payroll-case-status" />
        <span className="text-slate-600">
          <Ltr>{formatTimestampFull(theCase.created_at, '—')}</Ltr>
        </span>
      </div>
      {postIssue && (
        <Banner tone="info">הפנייה התקבלה אחרי שהדוח הופק. הסכומים בדוח שהופק לא משתנים.</Banner>
      )}
      <section>
        <h3 className="mb-1 font-semibold text-slate-700">מה הדיילת כתבה</h3>
        <blockquote
          dir="auto"
          className="whitespace-pre-line rounded-lg border-r-4 border-slate-300 bg-slate-50 p-3 text-slate-800"
          data-testid="payroll-case-description"
        >
          {theCase.description}
        </blockquote>
        {theCase.missing_shift && <p className="mt-1 text-slate-700">דווחה משמרת חסרה</p>}
        {theCase.suggested_value != null && (
          <p className="mt-1 text-slate-700">
            שעות שהדיילת הציעה: <Ltr>{theCase.suggested_value}</Ltr>
          </p>
        )}
      </section>
      <CaseRows snapshot={detail.snapshot_rows ?? []} current={detail.current_rows ?? []} />
      {(detail.corrections ?? []).length > 0 && (
        <CorrectionsList corrections={detail.corrections} />
      )}
      {theCase.resolution_reason && (
        <p className="text-slate-700">
          החלטה: <span dir="auto">{theCase.resolution_reason}</span>
        </p>
      )}

      {canEdit && open && !postIssue && correctable && (
        <CorrectionForm
          theCase={theCase}
          rows={detail.current_rows ?? []}
          onDirty={onDirty}
          onSaved={async () => {
            toast.success('התיקון נשמר. יש לשלוח לדיילת סיכום מעודכן')
            await onCorrected()
          }}
        />
      )}

      {canEdit && <CaseActions {...{ theCase, open, postIssue, onOutcome, onReopen }} />}

      {canEdit && !postIssue && theCase.status === 'resolved_accepted' && (
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            className="h-auto w-fit px-4 py-2"
            disabled={sendState !== 'idle'}
            onClick={onSendUpdated}
            data-testid="payroll-send-updated"
          >
            {sendState === 'sending' ? 'שולח…' : 'שלח סיכום מעודכן'}
          </Button>
          {sendState === 'done' && (
            <p className="text-teal-800" role="status">
              הסיכום המעודכן נשלח לדיילת. היא צריכה לאשר אותו מחדש.
            </p>
          )}
        </div>
      )}
      {actionError && (
        <Banner tone="error" testId="payroll-case-action-error">
          {actionError}
        </Banner>
      )}
    </div>
  )
}

function CaseActions({ theCase, open, postIssue, onOutcome, onReopen }) {
  if (postIssue) {
    return theCase.status === 'closed_post_issue' ? null : (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-auto px-4 py-2"
          onClick={() => onOutcome('close')}
          data-testid="payroll-case-close-post"
        >
          סגור פנייה
        </Button>
      </div>
    )
  }
  if (!open) return null
  return (
    <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
      <Button
        type="button"
        variant="outline"
        className="h-auto px-4 py-2"
        onClick={() => onOutcome('accept_noted')}
        data-testid="payroll-case-noted"
      >
        טופל מחוץ לדוח
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-auto px-4 py-2"
        onClick={() => onOutcome('reject')}
        data-testid="payroll-case-reject"
      >
        דחה פנייה
      </Button>
      {theCase.status === 'correction_pending' && (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-slate-700 underline"
          onClick={onReopen}
          data-testid="payroll-case-reopen"
        >
          החזר לטיפול
        </Button>
      )}
    </div>
  )
}

function rowKey(row) {
  return `${row.project_id}-${row.assignment_number}`
}

// מה שהדיילת ראתה בסיכום — משמרות ושעות בלבד, בלי סכומים (הכרעת ישי F11) — מול השעות
// היום במקור. את הכסף המנהלת רואה בטבלת המעקב ובטיוטה.
function CaseRows({ snapshot, current }) {
  if (snapshot.length === 0) return <p className="text-slate-600">הפנייה אינה על משמרת מסוימת</p>
  const currentByKey = new Map(current.map((row) => [rowKey(row), row]))
  return (
    <section>
      <h3 className="mb-1 font-semibold text-slate-700">המשמרות בפנייה, כפי שהדיילת ראתה</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="payroll-case-rows">
          <thead>
            <tr>
              <Th>משמרת</Th>
              <Th>שעות בסיכום</Th>
              <Th>שעות כעת</Th>
            </tr>
          </thead>
          <tbody>
            {snapshot.map((row) => {
              const now = currentByKey.get(rowKey(row))
              return (
                <tr key={rowKey(row)}>
                  <Td>
                    {row.event_name} · <Ltr>{formatDate(row.event_date, '—')}</Ltr>
                  </Td>
                  <Td>
                    {row.hours == null ? <NotApplicable /> : <Ltr>{formatHours(row.hours)}</Ltr>}
                  </Td>
                  <Td>
                    {now?.hours == null ? <NotApplicable /> : <Ltr>{formatHours(now.hours)}</Ltr>}
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const FIELD_LABELS = { actual_hours: 'שעות בפועל', personal_bonus: 'בונוס אישי' }

function CorrectionsList({ corrections }) {
  return (
    <section>
      <h3 className="mb-1 font-semibold text-slate-700">תיקונים שנשמרו</h3>
      <ul className="flex flex-col gap-1 text-slate-700">
        {corrections.map((c) => (
          <li key={c.correction_id}>
            {FIELD_LABELS[c.field] ?? c.field}: מ-<Ltr>{c.before_value}</Ltr> ל-
            <Ltr>{c.after_value}</Ltr> · <span dir="auto">{c.reason}</span> ·{' '}
            <Ltr>{formatTimestampFull(c.created_at, '—')}</Ltr>
          </li>
        ))}
      </ul>
    </section>
  )
}
