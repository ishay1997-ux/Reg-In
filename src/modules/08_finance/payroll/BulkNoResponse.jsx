// "אשר לפי תיעוד" לכל מי שלא השיבו — פעולה אחת לכנס עם 40 דיילות (הסגן, 14/10 11:1x).
// אותה החלטה ואותה פונקציית שרת כמו בשורה (`payroll_review_approve_no_response`), דיילת
// אחר דיילת ולא במקביל: כל קריאה נועלת את הבדיקה, ושגיאה של אחת לא עוצרת את האחרות.
// נימוק אחד לכולן; "איך נוצר קשר" חובה רק כשיש ביניהן מי שהסיכום לא הגיע אליה, ונשמר רק אצלה.
// מה שנכשל (למשל הנתונים השתנו) — נשאר ברשימה עם השם, ומה שהצליח נשמר.

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Ltr from '@/components/Ltr'
import { useToast } from '@/components/ToastProvider'
import { approvePayrollNoResponse } from '../payrollApi'
import ReasonDialog from './ReasonDialog'
import { Banner } from './payrollUi'
import {
  countPhrase,
  isNoResponseCandidate,
  needsContactNote,
  payrollErrorMessage,
} from './payrollModel'

export default function BulkNoResponse({ recipients, deadlinePassed, onReload }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState(null)
  const [failed, setFailed] = useState([])
  const candidates = (recipients ?? []).filter(isNoResponseCandidate)
  const anyNeverSent = candidates.some(needsContactNote)
  const running = progress !== null

  if (candidates.length === 0 && failed.length === 0) return null

  async function approveAll({ reason, evidence, contactNote }) {
    setOpen(false)
    setFailed([])
    const misses = []
    let approved = 0
    for (const [index, recipient] of candidates.entries()) {
      setProgress({ done: index, total: candidates.length })
      try {
        await approvePayrollNoResponse({
          recipientId: recipient.recipient_id,
          expectedDigest: recipient.digest,
          reason,
          evidence,
          contactNote: needsContactNote(recipient) ? contactNote : null,
        })
        approved += 1
      } catch (error) {
        // ממשיכים לבאה; השם והסיבה נשארים ברשימה, ואחרי הרענון אפשר לטפל בה בשורה.
        misses.push({ name: recipient.hostess_name, reason: payrollErrorMessage(error) })
      }
    }
    setProgress(null)
    setFailed(misses)
    if (misses.length === 0) {
      toast.success(`אושרו לפי תיעוד: ${countPhrase(approved, 'דיילת אחת', 'דיילות')}`)
    } else {
      toast.error(
        `אושרו ${approved} מתוך ${candidates.length}. ${countPhrase(misses.length, 'דיילת אחת לא אושרה', 'דיילות לא אושרו')}`,
      )
    }
    await onReload()
  }

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
  if (anyNeverSent) {
    fields.push({
      name: 'contactNote',
      label: 'איך נוצר קשר עם מי שהסיכום לא הגיע אליה',
      help: `${countPhrase(candidates.filter(needsContactNote).length, 'לדיילת אחת', 'לדיילות')} הסיכום לא הגיע במייל`,
      required: true,
      minLength: 5,
    })
  }

  return (
    <div className="mb-3 flex flex-col" data-testid="payroll-bulk-no-response">
      {candidates.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto px-4 py-2"
            disabled={!deadlinePassed || running}
            onClick={() => setOpen(true)}
            data-testid="payroll-bulk-no-response-open"
          >
            אשר לפי תיעוד את כל מי שלא השיבו (<Ltr>{candidates.length}</Ltr>)
          </Button>
          {!deadlinePassed && (
            <span className="text-sm text-slate-700">אפשר אחרי המועד האחרון לתגובה</span>
          )}
        </div>
      )}
      <p
        aria-live="polite"
        className="mt-1 text-sm text-slate-700 empty:mt-0"
        data-testid="payroll-bulk-no-response-progress"
      >
        {running ? `מאשר לפי תיעוד: ${progress.done + 1} מתוך ${progress.total}…` : ''}
      </p>
      {failed.length > 0 && !running && (
        <Banner tone="warn" className="mt-2" testId="payroll-bulk-no-response-failed">
          <p className="font-semibold">
            {countPhrase(failed.length, 'דיילת אחת לא אושרה', 'דיילות לא אושרו')}. אפשר לטפל בהן
            בשורה:
          </p>
          <ul className="mt-1 list-disc pr-5">
            {failed.map((miss, i) => (
              <li key={`${miss.name}-${i}`}>
                {miss.name} — {miss.reason}
              </li>
            ))}
          </ul>
        </Banner>
      )}
      {open && (
        <ReasonDialog
          open
          title="אשר לפי תיעוד את כל מי שלא השיבו"
          description={`${countPhrase(candidates.length, 'דיילת אחת לא השיבה', 'דיילות לא השיבו')} עד המועד: ${candidates.map((r) => r.hostess_name).join(', ')}. ההחלטה נשמרת עם הסיבה לכל אחת, ולא נרשמת כאישור של הדיילת.`}
          fields={fields}
          confirmLabel={`אשר ${countPhrase(candidates.length, 'דיילת אחת', 'דיילות')}`}
          onClose={() => setOpen(false)}
          onSubmit={approveAll}
          testId="payroll-bulk-no-response-dialog"
        />
      )}
    </div>
  )
}
