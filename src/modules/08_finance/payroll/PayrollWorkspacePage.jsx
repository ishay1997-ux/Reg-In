// מרחב העבודה של דוח השכר — `/finance/payroll` (חוזה §4.1, D13; מדריך ה-UX §א).
//
// המסע: טיוטה ⇐ שליחת סיכומים לדיילות ⇐ מעקב תגובות ופניות ⇐ אישור סופי ⇐ היסטוריה.
// בראש העמוד תמיד: באיזה שלב הבקשה נמצאת ומה הצעד הבא (כיול ישי 13/10: "שכל הפלואו יהיה
// הגיוני" — המשתמשת צריכה לדעת בכל רגע איפה היא ומה עכשיו).
//
// מצב העמוד חי בכתובת (`usePayrollUrl`). משתמש עם הרשאת צפייה בלבד ב'כספים' רואה רק את
// ההיסטוריה — כפתורי עריכה אינם מוצגים לו, לא רק מושבתים. השרת בודק הרשאה בכל קריאה.

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Ltr from '@/components/Ltr'
import StatusTag from '@/components/StatusTag'
import { useToast } from '@/components/ToastProvider'
import { useAuth } from '@/contexts/AuthContext'
import { formatTimestampFull } from '@/lib/dates'
import { salaryPeriodLabel } from '@/lib/salaryReport'
import { cn } from '@/lib/utils'
import {
  approvePayrollDraft,
  continuePayrollDistribution,
  createPayrollReview,
  distributePayrollReview,
  findPayrollReview,
  getPayrollPreview,
  getPayrollReview,
  refreshPayrollReview,
} from '../payrollApi'
import { useConfirm } from '@/components/ConfirmDialog'
import CasePanel from './CasePanel'
import DraftSection from './DraftSection'
import FinalSection from './FinalSection'
import HistorySection from './HistorySection'
import PeriodPicker from './PeriodPicker'
import ReviewSection from './ReviewSection'
import { usePayrollUrl } from './usePayrollUrl'
import {
  VIEWS,
  VIEW_LABELS,
  isStaleCode,
  lastEndedPeriod,
  payrollErrorMessage,
  periodParamOf,
  processStage,
} from './payrollModel'

export default function PayrollWorkspacePage() {
  const { permissions } = useAuth()
  const canEdit = permissions?.['כספים'] === 'edit'
  const [url, update] = usePayrollUrl()
  const [defaultPeriod] = useState(() => lastEndedPeriod(new Date()))
  const period = url.period ?? defaultPeriod
  const view = canEdit ? (url.view ?? (url.opId ? 'final' : 'draft')) : 'history'

  const data = useWorkspaceData({ canEdit, period, kind: url.kind, original: url.original })

  return (
    <div className="flex flex-col gap-4" data-testid="payroll-workspace">
      <Header
        view={view}
        period={period}
        kind={url.kind}
        data={data}
        canEdit={canEdit}
        update={update}
      />
      {canEdit && <Tabs view={view} update={update} />}
      <SectionFor view={view} url={url} update={update} data={data} canEdit={canEdit} />
      {canEdit && url.caseId && (
        <CasePanel
          caseId={url.caseId}
          canEdit={canEdit}
          canEditProjects={permissions?.['פרויקטים'] === 'edit'}
          onClose={() => update({ caseId: null })}
          onChanged={data.reload}
          onSendUpdated={async (theCase) => {
            const done = await data.sendUpdatedSummary({
              hostessId: theCase.hostess_id,
              hostessName: theCase.hostess_name,
            })
            if (done) update({ caseId: null, view: 'review', page: null })
          }}
        />
      )}
    </div>
  )
}

// ── נתונים משותפים: תצוגה מקדימה + הבדיקה הפעילה ──────────────────────────────────

function useWorkspaceData({ canEdit, period, kind, original }) {
  const toast = useToast()
  const confirm = useConfirm()
  const [tick, setTick] = useState(0)
  const [startingReview, setStartingReview] = useState(false)
  // כל תוצאה נשמרת עם המפתח שלה, וערך שאינו של המפתח הנוכחי נקרא כ"בטעינה" — כך מעבר חודש
  // או רענון לא מציגים לרגע נתונים של חודש אחר, ובלי setState סינכרוני בתוך effect.
  const identityKey = `${period}|${kind}|${original ?? ''}`
  const loadKey = `${identityKey}|${tick}`
  const [previewState, setPreviewState] = useState({ key: null })
  // הבדיקה נשמרת לפי החודש בלבד (בלי מונה הרענון): בזמן רענון ממשיכים להציג את הקיימת.
  const [reviewState, setReviewState] = useState({ key: null })
  const preview = previewState.key === loadKey ? (previewState.value ?? null) : null
  const previewError = previewState.key === loadKey ? (previewState.error ?? null) : null
  // `undefined` = בטעינה · `null` = אין בדיקה פעילה · אובייקט = יש.
  const review = reviewState.key === identityKey ? reviewState.value : undefined
  const reviewError = reviewState.key === identityKey ? (reviewState.error ?? null) : null

  useEffect(() => {
    if (!canEdit) return undefined
    let cancelled = false
    const identity = { period, kind, originalReportId: kind === 'supplement' ? original : null }
    getPayrollPreview(identity)
      .then((value) => !cancelled && setPreviewState({ key: loadKey, value }))
      .catch((error) => !cancelled && setPreviewState({ key: loadKey, error }))
    findPayrollReview(identity)
      .then((value) => !cancelled && setReviewState({ key: identityKey, value }))
      .catch((error) => !cancelled && setReviewState({ key: identityKey, error }))
    return () => {
      cancelled = true
    }
  }, [canEdit, period, kind, original, identityKey, loadKey])

  const reload = useCallback(async () => {
    setTick((t) => t + 1)
  }, [])

  const refreshReview = useCallback(async () => {
    if (!review?.review) return
    try {
      await refreshPayrollReview({
        reviewId: review.review.review_id,
        expectedRevision: review.review.revision,
      })
      toast.success('הסיכומים עודכנו. יש לאשר את הטיוטה ולשלוח את הסיכומים שהשתנו')
    } catch (err) {
      toast.error(payrollErrorMessage(err))
    } finally {
      setTick((t) => t + 1)
    }
  }, [review, toast])

  const startReview = useCallback(
    async (goToReview) => {
      if (preview?.active_review) {
        goToReview()
        return
      }
      setStartingReview(true)
      try {
        const result = await createPayrollReview({
          period,
          kind,
          originalReportId: kind === 'supplement' ? original : null,
          version: preview.version,
        })
        const created = await getPayrollReview(result.review_id)
        setReviewState({ key: identityKey, value: created })
        goToReview()
        setTick((t) => t + 1)
      } catch (err) {
        toast.error(payrollErrorMessage(err))
        if (isStaleCode(err?.code)) setTick((t) => t + 1)
      } finally {
        setStartingReview(false)
      }
    },
    [preview, period, kind, original, toast, identityKey],
  )

  // "שלח סיכום מעודכן" לדיילת אחת (סקירת UX D7) — דלת אחת לשני מקומות: שורת המעקב ופאנל
  // הפנייה. סדר הפעולות קבוע: רענון הבדיקה ⇐ אישור מפורש של הטיוטה המעודכנת (השינוי מבטל
  // את האישור הקודם, חוזה §2.2) ⇐ שליחה לשורה החדשה של הדיילת בלבד.
  const sendUpdatedSummary = useCallback(
    async ({ hostessId, hostessName }) => {
      const info = review?.review
      if (!info) return false
      const ok = await confirm({
        title: 'לשלוח סיכום מעודכן?',
        message: `הנתונים של ${hostessName} עודכנו. השליחה מאשרת את הטיוטה המעודכנת ושולחת לה סיכום חדש לאישור.`,
        confirmLabel: 'אשר ושלח',
      })
      if (!ok) return false
      try {
        const refreshed = await refreshPayrollReview({
          reviewId: info.review_id,
          expectedRevision: info.revision,
        })
        const identity = { period, kind, originalReportId: kind === 'supplement' ? original : null }
        const [fresh, current] = await Promise.all([
          getPayrollPreview(identity),
          getPayrollReview(info.review_id),
        ])
        const revision = refreshed?.revision ?? current.review.revision
        await approvePayrollDraft({
          reviewId: info.review_id,
          expectedRevision: revision,
          version: fresh.version,
        })
        const target = current.recipients.find((r) => r.hostess_id === hostessId && !r.delivery)
        if (!target) {
          toast.info('לדיילת הזו אין סיכום חדש לשלוח')
          return true
        }
        let result = await distributePayrollReview({
          reviewId: info.review_id,
          expectedRevision: revision,
          recipientIds: [target.recipient_id],
          mode: 'initial',
          requestId: globalThis.crypto.randomUUID(),
        })
        const sent = [...result.processed]
        while (result.remaining > 0) {
          result = await continuePayrollDistribution({ reviewId: info.review_id })
          sent.push(...result.processed)
        }
        if (sent.some((p) => p.state === 'sent')) toast.success('הסיכום המעודכן נשלח')
        else toast.error('הסיכום המעודכן לא נשלח. הסיבה מסומנת ברשימה')
        return true
      } catch (err) {
        toast.error(payrollErrorMessage(err))
        return false
      } finally {
        setTick((t) => t + 1)
      }
    },
    [review, confirm, toast, period, kind, original],
  )

  return {
    preview,
    previewError,
    review,
    reviewError,
    reload,
    refreshReview,
    sendUpdatedSummary,
    startReview,
    startingReview,
  }
}

// ── כותרת: חודש, סוג, שלב הבקשה והצעד הבא ────────────────────────────────────────

function Header({ view, period, kind, data, canEdit, update }) {
  // ההיסטוריה חוצה חודשים — אין לה חודש-עבודה, שלב או צעד הבא. כותרת אחת בלבד.
  if (view === 'history') {
    return (
      <header className="flex flex-col gap-3">
        <BackLink />
        <h1 className="text-lg font-bold text-slate-800" data-testid="payroll-title">
          דוחות שכר
        </h1>
      </header>
    )
  }
  const periodLabel = salaryPeriodLabel(period)
  const info = data.review?.review
  const stage = processStage({ preview: data.preview, review: data.review })
  return (
    <header className="flex flex-col gap-3">
      <BackLink />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-bold text-slate-800" data-testid="payroll-title">
          דוח שכר · {periodLabel}
        </h1>
        {kind === 'supplement' && (
          <StatusTag label={`השלמה · ${periodLabel}`} tone="outline" testId="payroll-kind" />
        )}
      </div>
      {canEdit && (
        <PeriodPicker
          key={period}
          period={period}
          onApply={(next) =>
            update({
              period: periodParamOf(next),
              kind: null,
              original: null,
              caseId: null,
              reportId: null,
              opId: null,
              filter: null,
              q: null,
              page: null,
            })
          }
        />
      )}
      {canEdit && stage && (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          data-testid="payroll-stage"
        >
          <span>
            <span className="text-slate-600">שלב:</span> <b>{stage.label}</b>
          </span>
          <span className="text-slate-800" data-testid="payroll-next-step">
            {stage.next}
          </span>
          {info?.response_deadline && info.status !== 'issued' && (
            <span>
              <span className="text-slate-600">מועד אחרון לתגובה:</span>{' '}
              <Ltr>{formatTimestampFull(info.response_deadline)}</Ltr>
            </span>
          )}
        </div>
      )}
    </header>
  )
}

function BackLink() {
  return (
    <Link
      to="/finance"
      className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
      data-testid="payroll-back"
    >
      <ArrowRight aria-hidden="true" className="size-4" />
      כספים
    </Link>
  )
}

function Tabs({ view, update }) {
  return (
    <div className="flex gap-1 border-b border-slate-200" role="tablist" aria-label="שלבי הדוח">
      {VIEWS.map((key) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={view === key}
          onClick={() => update({ view: key, page: null, filter: null, q: null })}
          className={cn(
            '-mb-px border-b-2 px-4 py-2.5 text-sm',
            view === key
              ? 'border-teal-600 font-semibold text-teal-700'
              : 'border-transparent font-medium text-slate-600',
          )}
          data-testid={`payroll-tab-${key}`}
        >
          {VIEW_LABELS[key]}
        </button>
      ))}
    </div>
  )
}

function SectionFor({ view, url, update, data, canEdit }) {
  if (view === 'history') {
    return (
      <HistorySection reportId={url.reportId} update={update} canEdit={canEdit} page={url.page} />
    )
  }
  if (view === 'review') {
    return (
      <ReviewSection
        review={data.review}
        reviewError={data.reviewError}
        onRetry={data.reload}
        preview={data.preview}
        filter={url.filter}
        query={url.q}
        page={url.page}
        update={update}
        onReload={data.reload}
        onRefreshReview={data.refreshReview}
        onSendUpdated={data.sendUpdatedSummary}
        canEdit={canEdit}
      />
    )
  }
  if (view === 'final') {
    return (
      <FinalSection
        review={data.review ?? null}
        preview={data.preview}
        opId={url.opId}
        update={update}
        canEdit={canEdit}
        onStale={data.reload}
        onIssued={data.reload}
      />
    )
  }
  return (
    <DraftSection
      preview={data.preview}
      previewError={data.previewError}
      onRetry={data.reload}
      onRefresh={data.reload}
      canEdit={canEdit}
      page={url.page}
      onPage={(page) => update({ page })}
      sheet={url.sheet}
      onSheet={(sheet, page = null) => update({ sheet: sheet === 'shift' ? null : sheet, page })}
      startingReview={data.startingReview}
      onStartReview={() => data.startReview(() => update({ view: 'review', page: null }))}
      onOpenReport={(reportId) => update({ view: 'history', reportId })}
    />
  )
}
