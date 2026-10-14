// טבלת המעקב — שורה לכל דיילת (לא לכל שיבוץ). עימוד 50.
// פעולות-שורה מופיעות רק כשהן אפשריות עכשיו, ולצידן המשפט שמסביר למה הדיילת "דורשת טיפול".

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Ltr from '@/components/Ltr'
import { AlertCircle, Check, HelpCircle } from 'lucide-react'
import { Pager } from '@/components/ListWindow'
import { useConfirm } from '@/components/ConfirmDialog'
import { useToast } from '@/components/ToastProvider'
import { formatTimestamp } from '@/lib/dates'
import { paginate } from '@/lib/listWindow'
import { approvePayrollNoResponse, resendPayrollReviewMail } from '../payrollApi'
import ReasonDialog from './ReasonDialog'
import { Td, Th } from './payrollUi'
import {
  actionReason,
  formatHours,
  isDecided,
  payrollErrorMessage,
  recipientStatus,
  resendOutcome,
} from './payrollModel'

export default function ReviewTable({
  rows,
  page,
  onPage,
  review,
  canEdit,
  onOpenCase,
  onReload,
  onSendUpdated,
}) {
  const info = review.review
  const paged = paginate(rows, page)
  const [noResponseFor, setNoResponseFor] = useState(null)
  const flags = {
    deadlinePassed: Boolean(info.deadline_passed),
    distributed: Boolean(info.distributed_at),
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm" data-testid="payroll-review-table">
          <thead>
            <tr>
              <Th className="w-[22%]">דיילת</Th>
              <Th>שעות</Th>
              <Th className="w-[24%]">סטטוס</Th>
              <Th>פעולה אחרונה</Th>
              <Th className="w-[30%]">טיפול</Th>
            </tr>
          </thead>
          <tbody>
            {paged.pageRows.map(({ recipient }) => (
              <RecipientRow
                key={recipient.recipient_id}
                recipient={recipient}
                reason={actionReason(recipient, flags)}
                canEdit={canEdit}
                deadlinePassed={flags.deadlinePassed}
                onOpenCase={onOpenCase}
                onNoResponse={() => setNoResponseFor(recipient)}
                onReload={onReload}
                onSendUpdated={onSendUpdated}
              />
            ))}
          </tbody>
        </table>
      </div>
      <Pager {...paged} onPage={onPage} testId="payroll-review-pager" />
      {noResponseFor && (
        <NoResponseDialog
          recipient={noResponseFor}
          onClose={() => setNoResponseFor(null)}
          onDone={async () => {
            setNoResponseFor(null)
            await onReload()
          }}
        />
      )}
    </>
  )
}

function RecipientRow({
  recipient,
  reason,
  canEdit,
  deadlinePassed,
  onOpenCase,
  onNoResponse,
  onReload,
  onSendUpdated,
}) {
  const canApproveByRecord =
    canEdit &&
    deadlinePassed &&
    recipient.state === 'awaiting' &&
    !recipient.open_case_id &&
    recipient.digest_current !== false
  return (
    <tr data-testid={`payroll-recipient-${recipient.recipient_id}`}>
      <Td>
        <div className="font-semibold text-slate-800">{recipient.hostess_name}</div>
        <div className="text-xs text-slate-600">
          {recipient.row_count === 1 ? 'משמרת אחת' : `${recipient.row_count} משמרות`}
        </div>
      </Td>
      {/* שעות ולא סכום (הכרעת ישי 14/10 00:20): הטבלה עוקבת אחרי מה שהדיילות מאשרות —
          משמרות ושעות. הכסף נשאר בטיוטה, בפאנל הפנייה ובאישור הסופי. */}
      <Td className="whitespace-nowrap">
        <HoursText hours={recipient.total_hours} />
      </Td>
      <Td>
        <RecipientStatus recipient={recipient} />
      </Td>
      <Td className="whitespace-nowrap">
        <Ltr>{formatTimestamp(recipient.last_action_at, '—')}</Ltr>
      </Td>
      <Td>
        {reason && (
          <p className="mb-1 text-xs text-slate-700" data-testid="payroll-action-reason">
            {reason}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {recipient.open_case_id && (
            <SmallButton
              onClick={() => onOpenCase(recipient.open_case_id)}
              testId="payroll-open-case"
            >
              פתח פנייה
            </SmallButton>
          )}
          {canEdit && !isDecided(recipient) && (
            <ResendButton recipient={recipient} onReload={onReload} />
          )}
          {canEdit && recipient.digest_current === false && (
            <SmallButton
              onClick={() =>
                onSendUpdated({
                  hostessId: recipient.hostess_id,
                  hostessName: recipient.hostess_name,
                })
              }
              testId="payroll-send-updated-row"
            >
              שלח סיכום מעודכן
            </SmallButton>
          )}
          {canApproveByRecord && (
            <SmallButton onClick={onNoResponse} testId="payroll-approve-by-record">
              אשר לפי תיעוד
            </SmallButton>
          )}
        </div>
      </Td>
    </tr>
  )
}

// "11.5 שעות" — אותו פורמט שהדיילת רואה. חסר ⇒ "—", לא 0.
function HoursText({ hours }) {
  const text = formatHours(hours)
  if (text === null) {
    return (
      <span className="text-slate-500" data-testid="payroll-recipient-hours">
        —
      </span>
    )
  }
  return (
    <span data-testid="payroll-recipient-hours">
      <Ltr>{text}</Ltr> שעות
    </span>
  )
}

const STATUS_LOOK = {
  attention: 'rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-900',
  unknown: 'rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-900',
  error: 'text-red-700',
  ok: 'text-green-800',
  neutral: 'text-slate-600',
}
const STATUS_ICON = { error: AlertCircle, unknown: HelpCircle, ok: Check }

// הסטטוס היחיד של השורה. תמיד טקסט, ואייקון היכן שיש — אף פעם לא צבע בלבד.
function RecipientStatus({ recipient }) {
  const status = recipientStatus(recipient)
  const Icon = STATUS_ICON[status.kind]
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${STATUS_LOOK[status.kind]}`}
      data-testid="payroll-recipient-status"
      data-kind={status.kind}
    >
      {Icon && <Icon aria-hidden="true" className="size-3.5 shrink-0" />}
      {status.label}
    </span>
  )
}

function SmallButton({ children, onClick, disabled, testId }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className="h-auto rounded-lg px-2.5 py-1 text-xs font-semibold"
      data-testid={testId}
    >
      {children}
    </Button>
  )
}

// כשל ידוע ⇒ "שלח שוב" עם אישור שמציג את הנמען. מצב לא ידוע ⇒ קודם "בדוק אם נשלח" (טעינה
// מחדש מהשרת); רק אם עדיין לא ידוע — שליחה נוספת אחרי אזהרה מפורשת על כפילות.
function ResendButton({ recipient, onReload }) {
  const confirm = useConfirm()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [checked, setChecked] = useState(false)
  const delivery = recipient.delivery
  const state = delivery?.state
  if (state !== 'failed' && state !== 'unknown') return null

  async function resend(acknowledgeUnknown) {
    const ok = await confirm({
      title: 'לשלוח את הסיכום שוב?',
      message: (
        <>
          <span className="block">
            הסיכום יישלח אל <Ltr>{delivery.intended_recipient}</Ltr>
          </span>
          {acknowledgeUnknown && (
            <span className="mt-1 block font-semibold text-amber-800">
              לא ידוע אם הסיכום הקודם הגיע. שליחה נוספת עלולה להגיע פעמיים.
            </span>
          )}
        </>
      ),
      confirmLabel: 'שלח שוב',
    })
    if (!ok) return
    setBusy(true)
    try {
      const result = await resendPayrollReviewMail({
        recipientId: recipient.recipient_id,
        priorAttemptId: delivery.attempt_id,
        acknowledgeUnknown,
      })
      const outcome = resendOutcome(result?.attempt?.state, 'הסיכום נשלח שוב')
      toast[outcome.tone](outcome.text)
    } catch (error) {
      toast.error(payrollErrorMessage(error))
    } finally {
      setBusy(false)
      await onReload()
    }
  }

  if (state === 'failed') {
    return (
      <SmallButton disabled={busy} onClick={() => resend(false)} testId="payroll-resend">
        {busy ? 'שולח…' : 'שלח שוב'}
      </SmallButton>
    )
  }
  if (!checked) {
    return (
      <SmallButton
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          await onReload()
          setBusy(false)
          setChecked(true)
        }}
        testId="payroll-check-sent"
      >
        {busy ? 'בודק…' : 'בדוק אם נשלח'}
      </SmallButton>
    )
  }
  return (
    <SmallButton disabled={busy} onClick={() => resend(true)} testId="payroll-resend-unknown">
      {busy ? 'שולח…' : 'שלח שוב'}
    </SmallButton>
  )
}

// "אשר לפי תיעוד" — החלטת מנהלת על דיילת שלא השיבה, אחרי המועד. נרשמת כ"אושר לפי תיעוד",
// לעולם לא כאישור של הדיילת. אם הסיכום מעולם לא יצא אליה — חובה לתעד איך נוצר קשר.
function NoResponseDialog({ recipient, onClose, onDone }) {
  const toast = useToast()
  const neverSent = recipient.delivery?.state !== 'sent'
  const fields = [
    { name: 'reason', label: 'סיבה', required: true, minLength: 5, multiline: true },
    {
      name: 'evidence',
      label: 'על מה ההחלטה נשענת',
      help: 'למשל: דוח שעות חתום, שיחה עם מנהלת האירוע',
      required: true,
      minLength: 5,
      multiline: true,
    },
  ]
  if (neverSent) {
    fields.push({
      name: 'contactNote',
      label: 'איך נוצר קשר עם הדיילת',
      help: 'הסיכום לא הגיע אליה במייל',
      required: true,
      minLength: 5,
    })
  }
  return (
    <ReasonDialog
      open
      title={`אשר לפי תיעוד — ${recipient.hostess_name}`}
      description="הדיילת לא השיבה עד המועד. ההחלטה נשמרת עם הסיבה, ולא נרשמת כאישור של הדיילת."
      fields={fields}
      confirmLabel="אשר לפי תיעוד"
      onClose={onClose}
      onSubmit={async ({ reason, evidence, contactNote }) => {
        await approvePayrollNoResponse({
          recipientId: recipient.recipient_id,
          expectedDigest: recipient.digest,
          reason,
          evidence,
          contactNote: contactNote ?? null,
        })
        toast.success('אושר לפי תיעוד')
        await onDone()
      }}
      testId="payroll-no-response"
    />
  )
}
