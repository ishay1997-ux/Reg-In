// שליחה חוזרת לרואה החשבון — אותו קובץ בדיוק, בלי הפקה מחדש (חוזה §2.3, D12).
// משמש גם את לשונית "אישור סופי" וגם את פרטי הדוח בהיסטוריה, כדי ששני המקומות יתנהגו זהה.
//
// · כשל ידוע ⇒ "שלח שוב", והאישור מציג את נמען רו"ח המקורי (F13).
// · לא ידוע ⇒ קודם "בדוק אם נשלח" (טעינה מחדש מהשרת). רק אם עדיין לא ידוע — "שלח שוב"
//   עם אזהרה מפורשת שהמייל עלול להגיע פעמיים. אין שליחה חוזרת אוטומטית, ואין "סמן כנשלח".

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Ltr from '@/components/Ltr'
import { useConfirm } from '@/components/ConfirmDialog'
import { useToast } from '@/components/ToastProvider'
import { retryAccountantSend } from '../payrollApi'
import { payrollErrorMessage } from './payrollModel'

export default function AccountantResend({ reportId, attempt, onCheck, onDone }) {
  const confirm = useConfirm()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [checked, setChecked] = useState(false)
  const state = attempt?.state
  if (state !== 'failed' && state !== 'unknown') return null

  async function resend(acknowledgeUnknown) {
    setBusy(true)
    try {
      const intended = attempt.intended_recipient
      const ok = await confirm({
        title: 'לשלוח את הדוח שוב לרואה החשבון?',
        message: (
          <>
            <span className="block">
              אותו קובץ יישלח אל <Ltr>{intended}</Ltr>
            </span>
            {acknowledgeUnknown && (
              <span className="mt-1 block font-semibold text-amber-800">
                לא ידוע אם המייל הקודם הגיע. שליחה נוספת עלולה להגיע פעמיים.
              </span>
            )}
          </>
        ),
        confirmLabel: 'שלח שוב',
      })
      if (!ok) return
      await retryAccountantSend({
        reportId,
        priorAttemptId: attempt.attempt_id,
        confirmedRecipient: intended,
        acknowledgeUnknown,
      })
      toast.success('הדוח נשלח שוב לרואה החשבון')
    } catch (error) {
      toast.error(payrollErrorMessage(error))
    } finally {
      setBusy(false)
      await onDone()
    }
  }

  if (state === 'failed') {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-auto px-4 py-2"
        disabled={busy}
        onClick={() => resend(false)}
        data-testid="payroll-accountant-resend"
      >
        {busy ? 'שולח…' : 'שלח שוב'}
      </Button>
    )
  }
  if (!checked) {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-auto px-4 py-2"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            await onCheck()
          } finally {
            setBusy(false)
            setChecked(true)
          }
        }}
        data-testid="payroll-accountant-check"
      >
        {busy ? 'בודק…' : 'בדוק אם נשלח'}
      </Button>
    )
  }
  return (
    <Button
      type="button"
      variant="outline"
      className="h-auto px-4 py-2"
      disabled={busy}
      onClick={() => resend(true)}
      data-testid="payroll-accountant-resend-unknown"
    >
      {busy ? 'שולח…' : 'שלח שוב'}
    </Button>
  )
}
