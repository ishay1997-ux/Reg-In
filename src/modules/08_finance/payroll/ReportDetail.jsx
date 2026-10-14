// פרטי דוח שהופק — לקריאה בלבד (חוזה §4.1 סעיף 5 + F6 + תוספת הסגן W4).
// השורות הקפואות הן הסמכות לזהות ולכסף. פרטי בנק נוכחיים לעולם אינם מוצגים כהיסטוריים.
// הורדה: קישור חתום קצר-מועד עם שם-הקובץ המקורי; ארבעה כשלים מוצגים בנפרד.
// דוח ישן בלי קובץ: "הורד שחזור" — קובץ מסומן שנבנה בדפדפן מהשורות הקפואות, לא נשמר ולא נשלח.

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import LoadingOrError from '@/components/LoadingOrError'
import Ltr from '@/components/Ltr'
import Money from '@/components/Money'
import StatusTag from '@/components/StatusTag'
import { Pager } from '@/components/ListWindow'
import { useToast } from '@/components/ToastProvider'
import { formatDate, formatTimestampFull } from '@/lib/dates'
import { paginate } from '@/lib/listWindow'
import { salaryPeriodLabel } from '@/lib/salaryReport'
import { getPayrollFileUrl, getPayrollReportDetail } from '../payrollApi'
import AccountantResend from './AccountantResend'
import { downloadReconstruction } from './payrollFiles'
import { Banner, Card, NotApplicable, Td, Th } from './payrollUi'
import {
  CASE_CATEGORY_LABELS,
  accountantDeliveryTag,
  caseStatusTag,
  countPhrase,
  formatHours,
  hoursSum,
  kindLabel,
  needsReconstruction,
  payrollErrorMessage,
  periodParamOf,
} from './payrollModel'

const DOWNLOAD_ERRORS = {
  ARTIFACT_REFERENCE_MISSING: 'הקובץ המקורי לא נשמר. מוצגים נתוני הדוח כפי שהופק',
  ARTIFACT_NOT_FOUND: 'הקובץ לא נמצא באחסון. נתוני הדוח מוצגים כאן',
  PERMISSION_DENIED: 'אין לך הרשאה להוריד את הקובץ',
  NETWORK: 'אין חיבור לשרת. נסה שוב',
}

export default function ReportDetail({ reportId, update, canEdit, page }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    getPayrollReportDetail(reportId)
      .then((data) => !cancelled && (setDetail(data), setError(null)))
      .catch((err) => !cancelled && setError(err))
    return () => {
      cancelled = true
    }
  }, [reportId, tick])

  const reload = async () => {
    setTick((t) => t + 1)
  }
  const back = (
    <Button
      type="button"
      variant="link"
      className="mb-2 h-auto w-fit p-0 text-sm font-semibold text-teal-700"
      onClick={() => update({ reportId: null, page: null })}
      data-testid="payroll-detail-back"
    >
      לכל הדוחות
    </Button>
  )

  if (error) {
    return (
      <Card testId="payroll-detail-error">
        {back}
        <LoadingOrError
          error={payrollErrorMessage(error)}
          onRetry={reload}
          retryTestId="payroll-detail-retry"
        />
      </Card>
    )
  }
  if (!detail) {
    return (
      <Card testId="payroll-detail-loading">
        {back}
        <LoadingOrError loading skeleton={{ variant: 'table' }} />
      </Card>
    )
  }

  // צורת השרת: פרטי הדוח עטופים ב-`report` (§4.3 + F6; שער-הצורה ב-payrollApi דורש אותו).
  const report = detail.report
  return (
    <div className="flex flex-col gap-4" data-testid="payroll-detail">
      <Card>
        {back}
        <DetailHeader report={report} lines={detail.lines ?? []} />
        <FileActions report={report} detail={detail} />
        <Delivery report={report} detail={detail} canEdit={canEdit} onReload={reload} />
        {canEdit && report.report_kind !== 'supplement' && (
          <Button
            type="button"
            variant="outline"
            className="mt-3 h-auto px-4 py-2"
            onClick={() =>
              update({
                view: 'draft',
                kind: 'supplement',
                original: report.report_id,
                period: periodParamOf(report.period),
                reportId: null,
                page: null,
              })
            }
            data-testid="payroll-start-supplement"
          >
            הפק דוח השלמה
          </Button>
        )}
      </Card>
      <PostIssueCases
        cases={detail.post_issue_cases ?? []}
        onOpen={(caseId) => update({ caseId })}
      />
      <FrozenLines lines={detail.lines ?? []} page={page} onPage={(p) => update({ page: p })} />
    </div>
  )
}

function DetailHeader({ report, lines }) {
  // F12: היקף בשעות ובמשמרות, בלי סכום בש"ח.
  const hours = hoursSum(lines)
  const hoursSummary = [
    countPhrase(report.line_count ?? lines.length, 'משמרת אחת', 'משמרות'),
    hours === null ? null : `${formatHours(hours)} שעות`,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <div
      className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm"
      data-testid="payroll-detail-header"
    >
      <span>
        <span className="text-slate-600">חודש:</span> <b>{salaryPeriodLabel(report.period)}</b>
      </span>
      <span>
        <span className="text-slate-600">סוג:</span>{' '}
        {kindLabel(report.report_kind, report.supplement_seq)}
      </span>
      <span>
        <span className="text-slate-600">הופק:</span>{' '}
        <Ltr>{formatTimestampFull(report.issued_at, '—')}</Ltr>
      </span>
      <span data-testid="payroll-detail-hours">
        <span className="text-slate-600">היקף:</span> {hoursSummary}
      </span>
    </div>
  )
}

function FileActions({ report, detail }) {
  const toast = useToast()
  const [downloadError, setDownloadError] = useState('')
  const [busy, setBusy] = useState(false)
  const artifact = detail.artifact ?? {}
  const reconstruct = needsReconstruction(report, artifact)

  async function download() {
    setBusy(true)
    setDownloadError('')
    try {
      const url = await getPayrollFileUrl(
        artifact.reference_missing ? null : artifact.key,
        artifact.filename ?? report.artifact_filename,
      )
      window.location.assign(url)
    } catch (err) {
      setDownloadError(DOWNLOAD_ERRORS[err?.code] ?? payrollErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function reconstructFile() {
    setBusy(true)
    setDownloadError('')
    try {
      await downloadReconstruction(report, detail.lines ?? [], new Date())
      toast.success('קובץ השחזור מוכן להורדה')
    } catch (err) {
      setDownloadError(err?.message || 'בניית השחזור נכשלה. נסה שוב')
    } finally {
      setBusy(false)
    }
  }

  if (reconstruct) {
    return (
      <div className="flex flex-col gap-2" data-testid="payroll-detail-no-file">
        <p className="text-sm text-slate-700">הקובץ המקורי לא נשמר. מוצגים נתוני הדוח כפי שהופק</p>
        <Button
          type="button"
          variant="outline"
          className="h-auto w-fit px-4 py-2"
          disabled={busy}
          onClick={reconstructFile}
          data-testid="payroll-download-reconstruction"
        >
          הורד שחזור
        </Button>
        <p className="text-xs text-slate-600">קובץ משוחזר מנתוני הדוח, לעיון בלבד</p>
        {downloadError && <Banner tone="error">{downloadError}</Banner>}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-auto w-fit px-4 py-2"
        disabled={busy}
        onClick={download}
        data-testid="payroll-download-file"
      >
        {busy ? 'מכין הורדה…' : 'הורד קובץ'}
      </Button>
      {downloadError && (
        <Banner tone="error" testId="payroll-download-file-error">
          {downloadError}
        </Banner>
      )}
    </div>
  )
}

function Delivery({ report, detail, canEdit, onReload }) {
  const attempts = detail.attempts ?? []
  // הניסיון החדש ביותר לפי מזהה — לא לפי סדר המערך, שאינו מובטח בחוזה.
  const latest =
    attempts.reduce((best, a) => (best && best.attempt_id > a.attempt_id ? best : a), null) ??
    report.last_attempt ??
    null
  const tag = accountantDeliveryTag(report.delivery_state)
  return (
    <div className="mt-3 flex flex-col gap-2 text-sm" data-testid="payroll-detail-delivery">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-slate-700">שליחה לרואה החשבון:</span>
        <StatusTag label={tag.label} tone={tag.tone} testId="payroll-detail-delivery-tag" />
        {/* F13: הנמען המקורי בלבד. D10: הנמען והזמן באותה שורה, בלי "נשלח" שני. */}
        {latest?.intended_recipient && (
          <span className="text-slate-700" data-testid="payroll-detail-latest">
            אל <Ltr>{latest.intended_recipient}</Ltr>
            {latest.completed_at && (
              <>
                {' '}
                · <Ltr>{formatTimestampFull(latest.completed_at)}</Ltr>
              </>
            )}
          </span>
        )}
      </div>
      {report.delivery_state === 'failed' && <p>הדוח נשמר אבל לא נשלח. אפשר לשלוח שוב</p>}
      {report.delivery_state === 'unknown' && (
        <p>לא ידוע אם הדוח נשלח. יש לבדוק לפני שליחה חוזרת</p>
      )}
      {canEdit && !report.legacy && latest?.attempt_id && (
        <div className="flex flex-wrap gap-2">
          <AccountantResend
            reportId={report.report_id}
            attempt={{ ...latest, state: report.delivery_state }}
            onCheck={onReload}
            onDone={onReload}
          />
        </div>
      )}
      {attempts.length > 1 && (
        <div data-testid="payroll-detail-attempts">
          <p className="text-xs font-semibold text-slate-600">ניסיונות קודמים</p>
          <ul className="flex flex-col gap-1 text-slate-700">
            {attempts
              .filter((attempt) => attempt.attempt_id !== latest?.attempt_id)
              .map((attempt) => (
                <li key={attempt.attempt_id}>
                  {accountantDeliveryTag(attempt.state).label} · אל{' '}
                  <Ltr>{attempt.intended_recipient}</Ltr> ·{' '}
                  <Ltr>{formatTimestampFull(attempt.completed_at ?? attempt.created_at, '—')}</Ltr>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function PostIssueCases({ cases, onOpen }) {
  if (cases.length === 0) return null
  return (
    <Card testId="payroll-detail-cases">
      <h3 className="mb-2 text-sm font-bold text-slate-800">פניות אחרי ההפקה</h3>
      <ul className="flex flex-col gap-2 text-sm">
        {cases.map((c) => {
          const status = caseStatusTag(c.status)
          return (
            <li key={c.case_id} className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{c.hostess_name}</span>
              <StatusTag label={CASE_CATEGORY_LABELS[c.category] ?? 'אחר'} tone="outline" />
              <StatusTag label={status.label} tone={status.tone} />
              <span dir="auto" className="text-slate-700">
                {c.description}
              </span>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-teal-700 underline"
                onClick={() => onOpen(c.case_id)}
                data-testid={`payroll-detail-case-${c.case_id}`}
              >
                פתח פנייה
              </Button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

const BASIS_LABELS = { actual: 'עבודה', cancellation_compensation: 'פיצוי ביטול' }

// בשורה קפואה, NULL בבונוס/נסיעות של שורת עבודה הוא אפס אמיתי (המסד כתב `nullif(…,0)`),
// ובשורת פיצוי הוא "לא רלוונטי" ⇒ `—`. אותו כלל כמו בקובץ (`salaryReport.js`).
function extraCell(line, value) {
  if (line.line_basis === 'cancellation_compensation') return <NotApplicable />
  return <Money amount={value ?? 0} cents />
}

function FrozenLines({ lines, page, onPage }) {
  const paged = paginate(lines, page)
  return (
    <Card testId="payroll-detail-lines">
      <h3 className="mb-1 text-sm font-bold text-slate-800">שורות הדוח</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr>
              <Th className="w-[30%]">דיילת</Th>
              <Th>ת"ז</Th>
              <Th>שעות</Th>
              <Th>תעריף</Th>
              <Th>בונוס</Th>
              <Th>נסיעות</Th>
            </tr>
          </thead>
          <tbody>
            {paged.pageRows.map((line, i) => (
              <tr key={line.line_id ?? `${paged.from}-${i}`} data-testid="payroll-detail-line">
                <Td>
                  <div className="font-semibold text-slate-800">{line.hostess_name}</div>
                  <div className="text-xs text-slate-600">
                    {line.event_name ?? '—'}
                    {line.event_date && (
                      <>
                        {' '}
                        · <Ltr>{formatDate(line.event_date)}</Ltr>
                      </>
                    )}{' '}
                    · {BASIS_LABELS[line.line_basis] ?? line.line_basis}
                  </div>
                </Td>
                <Td>
                  <Ltr>{line.id_number}</Ltr>
                </Td>
                <Td>
                  <Ltr>{formatHours(line.hours)}</Ltr>
                </Td>
                <Td>
                  <Money amount={line.rate} exact />
                </Td>
                <Td>{extraCell(line, line.bonus)}</Td>
                <Td>{extraCell(line, line.travel)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager {...paged} onPage={onPage} testId="payroll-detail-pager" />
    </Card>
  )
}
