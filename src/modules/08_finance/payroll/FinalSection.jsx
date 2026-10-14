// לשונית "אישור סופי" (חוזה §4.1 סעיף 4, מדריך ה-UX §א.5).
// פעולה ראשית אחת: "הפק ושלח לרואה החשבון". כשהיא חסומה — כל סיבה גלויה כטקסט, עם קישור
// למקום שפותר אותה. המוכנות נבדקת מחדש בשרת בכל הפקה; המסך רק מראה אותה.
//
// 🔴 **מזהה ההפקה נכתב לכתובת (`op=`) לפני הקריאה לשרת** — רענון, סגירת לשונית או תשובה
// שאבדה לא מייצרים הפקה שנייה: חוזרים לאותה הפקה ושואלים את מצבה.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import LoadingOrError from '@/components/LoadingOrError'
import Ltr from '@/components/Ltr'
import StatTile from '@/components/StatTile'
import { useConfirm } from '@/components/ConfirmDialog'
import { useToast } from '@/components/ToastProvider'
import { salaryPeriodLabel } from '@/lib/salaryReport'
import {
  abandonPayrollOperation,
  getPayrollOperationStatus,
  getPayrollReviewReadiness,
  issuePayrollReport,
  resumePayrollOperation,
} from '../payrollApi'
import AccountantResend from './AccountantResend'
import { useDraftDownload } from './useDraftDownload'
import { Banner, Card } from './payrollUi'
import {
  blockerText,
  countPhrase,
  formatHours,
  hoursSum,
  isStaleCode,
  kindLabel,
  monthNotEndedMessage,
  operationStage,
  payrollErrorMessage,
} from './payrollModel'

const POLL_MS = 2000

// `onIssued` — רענון הנתונים ברמת העמוד אחרי הפקה מוצלחת, כדי ששורת השלב, ההיסטוריה ולשונית
// האישור הסופי יציגו "הופק" ופקדי ההפקה ייעלמו (סקירת UX מקומית 14/10, פריט 2).
export default function FinalSection({
  review,
  preview,
  opId,
  update,
  canEdit,
  onStale,
  onIssued,
}) {
  const activeOpId = opId ?? preview?.active_operation?.operation_id ?? null
  if (!review) {
    return (
      <Card testId="payroll-final-no-review">
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          {/* פוליש 14/10, פריט 2: חודש פתוח קודם לכל — אחרת המסך מבקש לשלוח סיכומים שאי אפשר עוד. */}
          {preview && preview.month_state !== 'ended' && (
            <p className="text-sm font-semibold text-slate-800" data-testid="payroll-final-month">
              {monthNotEndedMessage(preview.period)}
            </p>
          )}
          <p className="text-sm font-medium text-slate-700">
            לפני הפקה יש לשלוח סיכומים לדיילות ולקבל אישורים
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
    <div className="flex flex-col gap-4" data-testid="payroll-final">
      {activeOpId && (
        <OperationProgress
          opId={activeOpId}
          update={update}
          canEdit={canEdit}
          reviewIssued={review.review.status === 'issued'}
          onIssued={onIssued}
          key={activeOpId}
        />
      )}
      {review.review.status !== 'issued' && (
        <Readiness
          review={review}
          preview={preview}
          update={update}
          canEdit={canEdit}
          onStale={onStale}
          onIssued={onIssued}
          busyOp={Boolean(activeOpId)}
        />
      )}
    </div>
  )
}

function Readiness({ review, preview, update, canEdit, onStale, onIssued, busyOp }) {
  const info = review.review
  const confirm = useConfirm()
  const [readiness, setReadiness] = useState(null)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)
  const [issueError, setIssueError] = useState(null)
  const [issuing, setIssuing] = useState(false)

  useEffect(() => {
    let cancelled = false
    getPayrollReviewReadiness(info.review_id)
      .then((data) => !cancelled && (setReadiness(data), setError(null)))
      .catch((err) => !cancelled && setError(err))
    return () => {
      cancelled = true
    }
  }, [info.review_id, tick])

  if (error) {
    return (
      <Card>
        <LoadingOrError
          error={payrollErrorMessage(error)}
          onRetry={() => setTick((t) => t + 1)}
          retryTestId="payroll-readiness-retry"
        />
      </Card>
    )
  }
  if (!readiness) {
    return (
      <Card>
        <LoadingOrError loading skeleton={{ variant: 'card' }} />
      </Card>
    )
  }

  const counts = readiness.counts ?? {}
  const periodLabel = salaryPeriodLabel(info.period)
  const kind = kindLabel(info.kind, preview?.supplement_seq_next)
  const monthEnded = preview?.month_state === 'ended'
  const recipient = preview?.accountant?.recipient
  const pendingCount = preview?.pending_closure?.assignment_count ?? 0
  // פוליש 14/10, פריט 2: חודש שעוד לא נגמר הוא הסיבה הראשונה — לפני כל חוסם אחר, עם התאריך.
  const serverBlockers = readiness.blockers ?? []
  const blockers =
    preview && !monthEnded
      ? [{ code: 'MONTH_NOT_ENDED' }, ...serverBlockers.filter((b) => b.code !== 'MONTH_NOT_ENDED')]
      : serverBlockers
  // F12 + F15: הסיכום בשעות, ועל השורות שבקובץ — כמו הטבלה והקובץ ("64 משמרות · 412 שעות · 32 דיילות").
  const fileLines = (preview?.lines ?? []).filter((l) => l.show_in_file !== false)
  const hoursTotal = hoursSum(fileLines)
  const hoursSummary = [
    countPhrase(fileLines.length, 'משמרת אחת', 'משמרות'),
    hoursTotal === null ? null : `${formatHours(hoursTotal)} שעות`,
    countPhrase(new Set(fileLines.map((l) => l.hostess_id)).size, 'דיילת אחת', 'דיילות'),
  ]
    .filter(Boolean)
    .join(' · ')
  const canIssue = canEdit && readiness.ready && monthEnded && !busyOp && Boolean(preview)

  async function handleIssue() {
    const ok = await confirm({
      title: 'להפיק ולשלוח לרואה החשבון?',
      message: (
        <>
          <span className="block">
            {kind} · {periodLabel}
          </span>
          <span className="block">{hoursSummary}</span>
          <span className="block">
            נמען: <Ltr>{recipient ?? '—'}</Ltr>
          </span>
          {pendingCount > 0 && (
            <span className="block">
              {countPhrase(pendingCount, 'משמרת אחת עדיין ממתינה', 'משמרות עדיין ממתינות')} לסגירת
              שעות ולא ייכללו בדוח הזה
            </span>
          )}
          <span className="mt-1 block font-semibold">השעות יינעלו לדוח הזה ולא ייכללו שוב.</span>
        </>
      ),
      confirmLabel: 'הפק ושלח',
    })
    if (!ok) return
    const operationId = globalThis.crypto.randomUUID()
    update({ opId: operationId })
    setIssuing(true)
    setIssueError(null)
    try {
      const result = await issuePayrollReport({
        operationId,
        reviewId: info.review_id,
        expectedVersion: preview.version,
        period: info.period,
        kind: info.kind,
        originalReportId: info.original_report_id ?? null,
      })
      if (result?.operation_id && result.operation_id !== operationId) {
        update({ opId: result.operation_id })
      }
      await onIssued?.()
    } catch (err) {
      setIssueError(err)
      if (isStaleCode(err?.code)) onStale()
      if (err?.code === 'REVIEW_NOT_READY') setTick((t) => t + 1)
    } finally {
      setIssuing(false)
    }
  }

  return (
    <Card testId="payroll-readiness">
      <div className="mb-3 flex flex-wrap gap-3">
        <StatTile label="הדיילת אישרה" value={<Ltr>{counts.hostess_approved ?? 0}</Ltr>} />
        <StatTile label="אושר לפי תיעוד" value={<Ltr>{counts.manager_approved ?? 0}</Ltr>} />
        <StatTile
          label="פניות פתוחות"
          value={<Ltr>{(counts.open_cases ?? 0) + (counts.correction_pending ?? 0)}</Ltr>}
          sub={counts.manager_resolved ? `טופלו: ${counts.manager_resolved}` : undefined}
        />
        <StatTile label="ממתין לבדיקה חוזרת" value={<Ltr>{counts.stale_digest ?? 0}</Ltr>} />
      </div>
      <p className="mb-3 text-sm text-slate-700" data-testid="payroll-final-summary">
        {kind} · {periodLabel} · {hoursSummary} · נמען <Ltr>{recipient ?? '—'}</Ltr>
      </p>

      {canEdit && (
        <Button
          type="button"
          className="h-auto px-4 py-2"
          disabled={!canIssue || issuing}
          onClick={handleIssue}
          data-testid="payroll-issue"
        >
          {issuing ? 'מפיק…' : 'הפק ושלח לרואה החשבון'}
        </Button>
      )}
      {canEdit && preview && (
        <FileToBeSent preview={preview} stale={info.version_current === false} onStale={onStale} />
      )}

      {blockers.length > 0 && (
        <p className="mt-3 text-sm font-semibold text-slate-800">אי אפשר להפיק עד שאלה יטופלו:</p>
      )}
      {blockers.length > 0 && (
        <ul className="mt-1.5 flex flex-col gap-1.5 text-sm" data-testid="payroll-final-blockers">
          {blockers.map((blocker) => {
            const { text, target } = blockerText(blocker, { period: info.period })
            return (
              <li key={blocker.code} className="flex flex-wrap items-center gap-2 text-slate-800">
                <span>• {text}</span>
                {target && (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-teal-700 underline"
                    onClick={() => update({ view: target.view, filter: target.filter ?? null })}
                  >
                    לטיפול
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {issueError && (
        <Banner
          tone={issueError.code === 'RESULT_UNKNOWN' ? 'warn' : 'error'}
          className="mt-3"
          testId="payroll-issue-error"
        >
          {issueError.code === 'RESULT_UNKNOWN'
            ? 'עוד לא ידוע אם הדוח הופק. יש לבדוק לפני הפקה נוספת'
            : payrollErrorMessage(issueError)}
        </Banner>
      )}
    </Card>
  )
}

// "הורד תצוגה מקדימה של הקובץ" — אותו handler של "הורד טיוטה" (`useDraftDownload`): אותו בונה ואותה
// גרסת תצוגה מקדימה. נתונים ישנים ⇒ מבקשים לרענן קודם, כמו בכל פעולה אחרת.
function FileToBeSent({ preview, stale, onStale }) {
  const draft = useDraftDownload(preview)
  return (
    <div className="mt-3 flex flex-col gap-1" data-testid="payroll-file-to-send">
      {stale ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
          <span>הנתונים השתנו. יש לרענן לפני אישור</span>
          <Button
            type="button"
            variant="outline"
            className="h-auto px-4 py-2"
            onClick={onStale}
            data-testid="payroll-file-to-send-refresh"
          >
            רענן
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-auto w-fit px-4 py-2"
          disabled={draft.downloading}
          onClick={draft.download}
          data-testid="payroll-download-file-to-send"
        >
          {draft.downloading ? 'מכין קובץ…' : 'הורד תצוגה מקדימה של הקובץ'}
        </Button>
      )}
      <p className="text-xs text-slate-600">
        תצוגה מקדימה של הקובץ לרואה החשבון, כולל ת"ז ופרטי בנק. הקובץ הסופי ייבנה מאותם נתונים בדיוק
        ברגע ההפקה.
      </p>
      {draft.error && (
        <Banner tone="error" testId="payroll-file-to-send-error">
          {draft.error}
        </Banner>
      )}
    </div>
  )
}

// מצב ההפקה השמור, נשאל מהשרת כל 2 שניות כל עוד הוא באמצע. יציאה מהמסך לא מבטלת דבר.
function OperationProgress({ opId, update, canEdit, reviewIssued, onIssued }) {
  const toast = useToast()
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [actionBusy, setActionBusy] = useState(false)
  const lastStage = useRef(null)

  const load = useCallback(async () => {
    try {
      const data = await getPayrollOperationStatus(opId)
      setStatus(data)
      setError(null)
      return data
    } catch (err) {
      setError(err)
      return null
    }
  }, [opId])

  const stage = operationStage(status)

  useEffect(() => {
    let timer
    let cancelled = false
    async function tickLoop() {
      const data = await load()
      if (cancelled) return
      if (!data || operationStage(data)?.busy) timer = setTimeout(tickLoop, POLL_MS)
    }
    tickLoop()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [load])

  // הדוח הופק (committed) והעמוד עוד חושב שהבדיקה פתוחה ⇒ רענון ברמת העמוד, פעם אחת לכל הפקה.
  // מכסה כל דרך להגיע לכאן: תשובה רגילה, "המשך", או "בדוק סטטוס" אחרי תשובה שאבדה.
  const issuedNotified = useRef(false)
  useEffect(() => {
    if (status?.state === 'committed' && !reviewIssued && !issuedNotified.current) {
      issuedNotified.current = true
      onIssued?.()
    }
  }, [status?.state, reviewIssued, onIssued])

  // טוסט רק במעבר שנצפה כאן (לא בכל פתיחה של דוח ישן) — המצב הקבוע נשאר בכרטיס.
  useEffect(() => {
    if (!stage) return
    const previous = lastStage.current
    lastStage.current = stage.text
    if (previous && previous !== stage.text && !stage.busy) {
      if (stage.tone === 'ok') toast.success(stage.text)
      else if (stage.tone === 'error') toast.error(stage.text)
    }
  }, [stage, toast])

  async function act(action) {
    setActionBusy(true)
    try {
      await action()
    } catch (err) {
      setError(err)
    } finally {
      setActionBusy(false)
      await load()
    }
  }

  if (error && !status) {
    return (
      <Card testId="payroll-operation-error">
        <LoadingOrError
          error={payrollErrorMessage(error)}
          onRetry={load}
          retryTestId="payroll-operation-retry"
        />
      </Card>
    )
  }
  if (!status) {
    return (
      <Card>
        <LoadingOrError loading skeleton={{ variant: 'page' }} />
      </Card>
    )
  }

  const toneMap = { ok: 'ok', error: 'error', warn: 'warn', info: 'info' }
  return (
    <Card testId="payroll-operation">
      <Banner tone={toneMap[stage.tone]} testId="payroll-operation-stage">
        <span aria-live="polite">{stage.text}</span>
        {stage.busy && (
          <span className="block text-xs">אפשר לצאת מהמסך — ההפקה ממשיכה ונשמרת.</span>
        )}
      </Banner>
      <div className="mt-3 flex flex-wrap gap-2">
        {canEdit &&
          stage.action === 'resume' &&
          (status.state === 'preparing' || status.state === 'prepared') && (
            <>
              <Button
                type="button"
                className="h-auto px-4 py-2"
                disabled={actionBusy}
                onClick={() => act(() => resumePayrollOperation(opId))}
                data-testid="payroll-operation-resume"
              >
                המשך
              </Button>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-slate-700 underline"
                disabled={actionBusy}
                onClick={() => act(() => abandonPayrollOperation(opId))}
                data-testid="payroll-operation-abandon"
              >
                בטל את ההפקה הזו
              </Button>
            </>
          )}
        {canEdit && (stage.action === 'retry_send' || stage.action === 'check_status') && (
          <AccountantResend
            reportId={status.report_id}
            attempt={status.accountant_attempt}
            currentRecipient={status.accountant_recipient_current}
            onCheck={load}
            onDone={load}
          />
        )}
        {/* "בדוק סטטוס" רק כשאין פעולה ייעודית — במצב "לא ידוע" הכפתור הוא "בדוק אם נשלח"
            (מדריך ה-UX: שם אחד לאותה פעולה). */}
        {!stage.busy && !stage.action && stage.tone !== 'ok' && (
          <Button
            type="button"
            variant="outline"
            className="h-auto px-4 py-2"
            onClick={load}
            data-testid="payroll-operation-check"
          >
            בדוק סטטוס
          </Button>
        )}
        {status.report_id && (
          <Button
            type="button"
            variant="outline"
            className="h-auto px-4 py-2"
            onClick={() => update({ view: 'history', reportId: status.report_id })}
            data-testid="payroll-operation-report"
          >
            לפרטי הדוח והורדה
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{payrollErrorMessage(error)}</p>}
    </Card>
  )
}
