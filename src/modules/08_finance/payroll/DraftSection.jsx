// לשונית "טיוטה" — התצוגה המקדימה האמיתית של החודש (חוזה §4.1 סעיף 1, מדריך ה-UX §א.2).
// קריאה בלבד: שום דבר כאן לא חותם שיבוצים, לא יוצר דוח ולא שולח מייל. ההורדה בונה קובץ
// טיוטה בדפדפן מכל השורות של התצוגה המקדימה — לא מהעמוד המוצג.

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Disclosure from '@/components/Disclosure'
import LoadingOrError from '@/components/LoadingOrError'
import Ltr from '@/components/Ltr'
import Money from '@/components/Money'
import StatTile from '@/components/StatTile'
import { Pager } from '@/components/ListWindow'
import { useToast } from '@/components/ToastProvider'
import { formatDate, formatTimestampFull } from '@/lib/dates'
import { paginate } from '@/lib/listWindow'
import { PROJECT_STATUS_LABELS } from '@/lib/projects'
import { Banner, Card, NotApplicable, Td, Th } from './payrollUi'
import { downloadDraft } from './payrollFiles'
import {
  countPhrase,
  formatHours,
  hoursSum,
  monthNotEndedMessage,
  payrollErrorMessage,
} from './payrollModel'

const BASIS_LABELS = { actual: 'עבודה', cancellation_compensation: 'פיצוי ביטול' }
const DEFECT_LABELS = {
  IDENTITY_MISSING: 'חסרים שם או ת"ז',
  COMP_HOURS_MISSING: 'חסרות שעות לחישוב פיצוי',
}

function bankText(line) {
  if (!line.bank_account) return null
  const numeric = line.bank_branch ? `${line.bank_branch}-${line.bank_account}` : line.bank_account
  return { name: line.bank_name ?? '', numeric }
}

export default function DraftSection({
  preview,
  previewError,
  onRetry,
  onRefresh,
  canEdit,
  page,
  onPage,
  onStartReview,
  onOpenReport,
  startingReview,
}) {
  const toast = useToast()
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  if (previewError) {
    const existingReportId = previewError.hint?.report_id ?? previewError.data?.report_id
    return (
      <Card testId="payroll-draft-error">
        <LoadingOrError
          error={payrollErrorMessage(previewError)}
          onRetry={onRetry}
          retryTestId="payroll-draft-retry"
        />
        {previewError.code === 'PERIOD_EXISTS' && existingReportId && (
          <div className="mt-2 flex justify-center">
            <Button
              type="button"
              variant="outline"
              className="h-auto px-4 py-2"
              onClick={() => onOpenReport(existingReportId)}
              data-testid="payroll-draft-open-existing"
            >
              לדוח שהופק
            </Button>
          </div>
        )}
      </Card>
    )
  }

  if (!preview) {
    return (
      <Card testId="payroll-draft-loading">
        <p className="mb-3 text-sm text-slate-600">טוען את שורות הדוח…</p>
        <LoadingOrError loading skeleton={{ variant: 'table' }} />
      </Card>
    )
  }

  const totals = preview.totals ?? {}
  const lines = preview.lines ?? []
  const blockers = preview.blockers ?? []
  const blockedCount = blockers.reduce((sum, b) => sum + (b.count ?? 0), 0)
  const hasBlockers = blockedCount > 0
  const pending = preview.pending_closure ?? {}
  const empty = lines.length === 0
  const allZero = !empty && Number(totals.total_amount) === 0
  const hoursTotal = totals.hours_total ?? hoursSum(lines)
  const monthEnded = preview.month_state === 'ended'
  const missingBank = lines.filter((l) => l.show_in_file && !l.bank_account)
  const zeroDurationCount = lines.filter((l) =>
    (l.warnings ?? []).includes('COMP_DURATION_ZERO'),
  ).length
  const firstBlockedIndex = lines.findIndex((l) => (l.defects ?? []).length > 0)
  const paged = paginate(lines, page)

  async function handleDownload() {
    setDownloading(true)
    setDownloadError('')
    try {
      await downloadDraft(preview)
      toast.success('הטיוטה מוכנה להורדה')
    } catch (error) {
      setDownloadError(error?.message || 'הורדת הטיוטה נכשלה. נסה שוב')
    } finally {
      setDownloading(false)
    }
  }

  const startDisabledReason = !canEdit
    ? null
    : !monthEnded
      ? monthNotEndedMessage(preview.period)
      : hasBlockers
        ? 'יש לתקן את השורות החסומות לפני שליחת הסיכומים'
        : null

  return (
    <div className="flex flex-col gap-4" data-testid="payroll-draft">
      <div className="flex flex-wrap gap-3">
        <StatTile
          label="דיילות"
          value={<Ltr>{totals.hostess_count}</Ltr>}
          testId="payroll-tile-hostesses"
        />
        <StatTile
          label="משמרות"
          value={<Ltr>{totals.line_count}</Ltr>}
          testId="payroll-tile-lines"
        />
        {/* F12 (14/10): אין סכום מחושב בש"ח על המסך — הסיכום בשעות. הסכום נשאר בתשובת השרת
            ונבדק בהתאמה של קובץ הטיוטה. */}
        <StatTile
          label="שעות"
          value={hoursTotal === null ? null : <Ltr>{formatHours(hoursTotal)}</Ltr>}
          emptyText="—"
          testId="payroll-tile-hours"
        />
        <StatTile
          label="ממתינות לסגירת שעות"
          value={pending.ok === false ? null : <Ltr>{pending.assignment_count ?? 0}</Ltr>}
          emptyText="לא ידוע"
          sub={pending.ok === false ? 'הבדיקה לא הצליחה' : 'משמרות'}
          testId="payroll-tile-pending"
        />
      </div>

      {pending.ok === false && (
        <Banner tone="warn" testId="payroll-pending-failed">
          לא ניתן לבדוק כרגע אם יש משמרות שממתינות לסגירת שעות. החודש אינו בהכרח סגור.
        </Banner>
      )}
      {pending.ok !== false && (pending.project_count ?? 0) > 0 && (
        <Disclosure
          summary={`${countPhrase(pending.assignment_count, 'משמרת אחת ממתינה', 'משמרות ממתינות')} לסגירת שעות`}
          testId="payroll-pending"
        >
          <ul className="flex flex-col gap-1">
            {(pending.projects ?? []).map((project) => (
              <li key={project.project_id}>
                {project.event_name} · <Ltr>{formatDate(project.event_date, '—')}</Ltr> ·{' '}
                {PROJECT_STATUS_LABELS[project.project_status] ?? project.project_status}
              </li>
            ))}
          </ul>
        </Disclosure>
      )}

      {hasBlockers && (
        <Banner tone="error" testId="payroll-blockers">
          <p className="font-semibold">
            {countPhrase(blockedCount, 'שורה אחת חסומה', 'שורות חסומות')} — אי אפשר לשלוח סיכומים עד
            שיתוקנו
          </p>
          <ul className="mt-1 list-disc pr-5">
            {blockers.map((b) => (
              <li key={b.code}>
                {DEFECT_LABELS[b.code] ?? payrollErrorMessage(b.code)}: <Ltr>{b.count}</Ltr>
              </li>
            ))}
          </ul>
          {firstBlockedIndex >= 0 && (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-red-800 underline"
              onClick={() => onPage(Math.floor(firstBlockedIndex / 50) + 1)}
              data-testid="payroll-blockers-goto"
            >
              מעבר לשורה החסומה הראשונה
            </Button>
          )}
        </Banner>
      )}

      {allZero && (
        <Banner tone="info" testId="payroll-all-zero">
          כל השורות בחודש הזה באפס. הן יישמרו בדוח, אבל לא ייכנסו לקובץ לרואה החשבון.
        </Banner>
      )}

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {canEdit &&
            (preview.active_review ? (
              <Button
                type="button"
                className="h-auto px-4 py-2"
                onClick={onStartReview}
                data-testid="payroll-goto-review"
              >
                למעקב הדיילות
              </Button>
            ) : (
              !empty && (
                <Button
                  type="button"
                  className="h-auto px-4 py-2"
                  disabled={Boolean(startDisabledReason) || startingReview}
                  onClick={onStartReview}
                  data-testid="payroll-start-review"
                >
                  {startingReview ? 'פותח מעקב…' : 'שלח סיכומים לדיילות'}
                </Button>
              )
            ))}
          {!empty && (
            <Button
              type="button"
              variant="outline"
              className="h-auto px-4 py-2"
              disabled={hasBlockers || downloading}
              onClick={handleDownload}
              data-testid="payroll-download-draft"
            >
              {downloading ? 'מכין טיוטה…' : 'הורד טיוטה'}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="h-auto px-4 py-2"
            onClick={onRefresh}
            data-testid="payroll-refresh"
          >
            רענן
          </Button>
        </div>
        {startDisabledReason && !preview.active_review && !empty && (
          <p className="mb-2 text-sm text-slate-700" data-testid="payroll-start-reason">
            {startDisabledReason}
          </p>
        )}
        {hasBlockers && !empty && (
          <p className="mb-2 text-sm text-slate-700" data-testid="payroll-draft-reason">
            את הטיוטה אפשר להוריד אחרי תיקון השורות החסומות
          </p>
        )}
        {downloadError && (
          <Banner tone="error" className="mb-2" testId="payroll-download-error">
            {downloadError}
          </Banner>
        )}

        <DraftDetails
          preview={preview}
          missingBank={missingBank}
          zeroDurationCount={zeroDurationCount}
        />

        {empty ? (
          <div className="py-8 text-center" data-testid="payroll-draft-empty">
            <p className="text-sm font-medium text-slate-700">
              אין לחודש הזה שעות מאושרות שעוד לא נכללו בדוח
            </p>
            {pending.ok !== false && (pending.assignment_count ?? 0) > 0 && (
              <p className="mt-1 text-sm text-slate-600" data-testid="payroll-draft-empty-pending">
                {countPhrase(pending.assignment_count, 'משמרת אחת ממתינה', 'משמרות ממתינות')} לסגירת
                שעות
              </p>
            )}
          </div>
        ) : (
          <>
            <DraftTable rows={paged.pageRows} offset={paged.from - 1} />
            <Pager {...paged} onPage={onPage} testId="payroll-draft-pager" />
          </>
        )}
      </Card>
    </div>
  )
}

function DraftDetails({ preview, missingBank, zeroDurationCount }) {
  const totals = preview.totals ?? {}
  const zeroLines = totals.zero_line_count ?? 0
  const accountant = preview.accountant ?? {}
  return (
    <div className="mb-3 flex flex-col gap-1 text-sm text-slate-700">
      <p data-testid="payroll-accountant">
        נמען רואה החשבון: {/* F13: הנמען המקורי בלבד — ההפניה הפנימית אינה מוצגת. */}
        {accountant.recipient ? <Ltr>{accountant.recipient}</Ltr> : <NotApplicable />}
      </p>
      {accountant.recipient_valid === false && (
        <p className="text-amber-800" data-testid="payroll-accountant-invalid">
          כתובת רואה החשבון חסרה או לא תקינה בהגדרות. אפשר לבדוק טיוטה, אבל לא להפיק.
        </p>
      )}
      {accountant.template_valid === false && (
        <p className="text-amber-800">תבנית המייל לרואה החשבון לא תקינה בהגדרות.</p>
      )}
      <Disclosure summary="פרטים נוספים" testId="payroll-draft-details">
        <p>
          נאסף ב-<Ltr>{formatTimestampFull(preview.captured_at, '—')}</Ltr>
        </p>
        <p data-testid="payroll-zero-lines">
          {zeroLines === 0
            ? 'אין שורות באפס'
            : `${countPhrase(zeroLines, 'שורה אחת באפס', 'שורות באפס')} — נשמרות בדוח ולא נכנסות לקובץ לרואה החשבון`}
        </p>
        <p data-testid="payroll-missing-bank">
          {missingBank.length === 0
            ? 'לכל הדיילות בקובץ יש פרטי בנק'
            : `${countPhrase(missingBank.length, 'שורה אחת', 'שורות')} בלי פרטי בנק: ${[
                ...new Set(missingBank.map((l) => l.hostess_name)),
              ].join(', ')}`}
        </p>
        {zeroDurationCount > 0 && (
          <p>
            {countPhrase(zeroDurationCount, 'שורת פיצוי אחת', 'שורות פיצוי')} עם שעת התחלה זהה לשעת
            הסיום — נרשמות עם 0 שעות
          </p>
        )}
        <p>בונוס ונסיעות בשורות פיצוי ביטול מוצגים כקו (—) ולא כאפס: הם אינם חלק מהפיצוי.</p>
      </Disclosure>
    </div>
  )
}

function DraftTable({ rows, offset }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm" data-testid="payroll-draft-table">
        <thead>
          <tr>
            <Th className="w-[26%]">דיילת</Th>
            <Th>ת"ז</Th>
            <Th>פרטי בנק</Th>
            <Th>שעות</Th>
            <Th>תעריף</Th>
            <Th>בונוס</Th>
            <Th>נסיעות</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((line, i) => {
            const defects = line.defects ?? []
            const bank = bankText(line)
            const isComp = line.line_basis === 'cancellation_compensation'
            return (
              <tr
                key={`${line.project_id}-${line.hostess_id}-${line.assignment_number}-${line.line_basis}`}
                id={`payroll-line-${offset + i}`}
                className={defects.length > 0 ? 'bg-red-50' : undefined}
                data-testid="payroll-draft-row"
              >
                <Td>
                  <div className="font-semibold text-slate-800">{line.hostess_name || '—'}</div>
                  <div className="mt-0.5 text-xs text-slate-600">
                    {line.event_name} · <Ltr>{formatDate(line.event_date, '—')}</Ltr> ·{' '}
                    {BASIS_LABELS[line.line_basis] ?? line.line_basis}
                  </div>
                  {defects.length > 0 && (
                    <div className="mt-1 text-xs font-semibold text-red-700" role="note">
                      {defects.map((d) => DEFECT_LABELS[d] ?? payrollErrorMessage(d)).join(' · ')}
                    </div>
                  )}
                  {!line.show_in_file && defects.length === 0 && (
                    <div className="mt-1 text-xs text-slate-600">
                      באפס — לא נכנסת לקובץ לרואה החשבון
                    </div>
                  )}
                </Td>
                <Td>{line.id_number ? <Ltr>{line.id_number}</Ltr> : <NotApplicable />}</Td>
                <Td>
                  {bank ? (
                    <span>
                      {bank.name} <Ltr>{bank.numeric}</Ltr>
                    </span>
                  ) : (
                    <NotApplicable />
                  )}
                </Td>
                <Td>
                  {line.hours == null ? (
                    <NotApplicable />
                  ) : (
                    <Ltr>{Number(line.hours).toFixed(2)}</Ltr>
                  )}
                </Td>
                <Td>
                  {line.rate == null ? <NotApplicable /> : <Money amount={line.rate} exact />}
                </Td>
                <Td>
                  {isComp || line.bonus == null ? (
                    <NotApplicable />
                  ) : (
                    <Money amount={line.bonus} cents />
                  )}
                </Td>
                <Td>
                  {isComp || line.travel == null ? (
                    <NotApplicable />
                  ) : (
                    <Money amount={line.travel} cents />
                  )}
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
