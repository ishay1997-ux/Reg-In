// לשונית "טיוטה" — התצוגה המקדימה האמיתית של החודש (חוזה §4.1 סעיף 1, מדריך ה-UX §א.2).
// קריאה בלבד: שום דבר כאן לא חותם שיבוצים, לא יוצר דוח ולא שולח מייל. ההורדה בונה קובץ
// טיוטה בדפדפן מכל השורות של התצוגה המקדימה — לא מהעמוד המוצג.

import { Button } from '@/components/ui/button'
import Disclosure from '@/components/Disclosure'
import LoadingOrError from '@/components/LoadingOrError'
import Ltr from '@/components/Ltr'
import StatTile from '@/components/StatTile'
import { Pager } from '@/components/ListWindow'
import { formatDate, formatTimestampFull } from '@/lib/dates'
import { paginate } from '@/lib/listWindow'
import { PROJECT_STATUS_LABELS } from '@/lib/projects'
import { Banner, Card, NotApplicable, Td, Th } from './payrollUi'
import { useDraftDownload } from './useDraftDownload'
import {
  HOSTESS_SUMMARY_COLUMNS,
  HOSTESS_SUMMARY_TOTAL_LABEL,
  SALARY_REPORT_COLUMNS,
  salaryFileHostessSummary,
  salaryFileHoursTotal,
  salaryFilePreviewCells,
} from '@/lib/salaryReport'
import {
  SHEETS,
  SHEET_LABELS,
  countPhrase,
  formatHours,
  hoursSum,
  monthNotEndedMessage,
  payrollErrorMessage,
} from './payrollModel'

// D4: שורה אחת שאומרת מה חסר ואיפה משלימים. (כרטיס הדיילת נמצא במודול "דיילות"; מנהלת
// הכספים חסומה ממנו, ולכן אין כאן קישור — היא מעבירה למי שאחראית על הדיילות.)
const BLOCKER_FIX = {
  IDENTITY_MISSING: 'חסרה ת"ז או שם. יש להשלים בכרטיס הדיילת',
  COMP_HOURS_MISSING: 'חסרות שעות האירוע לחישוב הפיצוי. יש להשלים בכרטיס הפרויקט',
}

const DEFECT_LABELS = {
  IDENTITY_MISSING: 'חסרים שם או ת"ז',
  COMP_HOURS_MISSING: 'חסרות שעות לחישוב פיצוי',
}

export default function DraftSection({
  preview,
  previewError,
  onRetry,
  onRefresh,
  canEdit,
  page,
  onPage,
  sheet = 'shift',
  onSheet,
  onStartReview,
  onOpenReport,
  startingReview,
}) {
  const draft = useDraftDownload(preview)

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
  // F15: האריחים מסכמים את מה שבקובץ, כמו הטבלה שמתחתם (פוליש 14/10, פריט 1). שורות באפס
  // (N-4) נשמרות בדוח אבל לא נכנסות לקובץ — ולכן לא נספרות כאן; שורה משנית אומרת כמה הן.
  const fileLines = lines.filter((l) => l.show_in_file !== false)
  const zeroLines = lines.length - fileLines.length
  const fileHostesses = new Set(fileLines.map((l) => l.hostess_id)).size
  const hoursTotal = hoursSum(fileLines)
  const monthEnded = preview.month_state === 'ended'
  // D2: נספרות דיילות, לא שורות.
  const missingBank = [
    ...new Set(lines.filter((l) => l.show_in_file && !l.bank_account).map((l) => l.hostess_name)),
  ]
  const zeroDurationCount = lines.filter((l) =>
    (l.warnings ?? []).includes('COMP_DURATION_ZERO'),
  ).length
  const firstBlockedIndex = fileLines.findIndex((l) => (l.defects ?? []).length > 0)
  // שני הגיליונות של הקובץ, ומתג ביניהם (מצב בכתובת, CLAUDE.md §4.2). העימוד לפי הגיליון המוצג.
  const summary = sheet === 'hostess' ? salaryFileHostessSummary(fileLines) : null
  const paged = paginate(summary ? summary.rows : fileLines, page)

  // החסימה מוסברת פעם אחת, בהודעה שמעל (מדריך UX D4). מתחת לכפתור — רק סיבת החודש (D11).
  const startDisabledReason = canEdit && !monthEnded ? monthNotEndedMessage(preview.period) : null

  return (
    <div className="flex flex-col gap-4" data-testid="payroll-draft">
      <div className="flex flex-wrap gap-3">
        <StatTile
          label="דיילות"
          value={<Ltr>{fileHostesses}</Ltr>}
          testId="payroll-tile-hostesses"
        />
        <StatTile
          label="משמרות"
          value={<Ltr>{fileLines.length}</Ltr>}
          sub={
            zeroLines > 0
              ? zeroLines === 1
                ? 'משמרת אחת ללא תשלום אינה נכללת בקובץ'
                : `${zeroLines} משמרות ללא תשלום אינן נכללות בקובץ`
              : undefined
          }
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
          {blockers.map((b) => (
            <p key={b.code}>
              {countPhrase(b.count, 'שורה אחת חסומה', `שורות חסומות`)}:{' '}
              {BLOCKER_FIX[b.code] ?? payrollErrorMessage(b.code)}
            </p>
          ))}
          {firstBlockedIndex >= 0 && (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-red-800 underline"
              onClick={() => onSheet('shift', Math.floor(firstBlockedIndex / 50) + 1)}
              data-testid="payroll-blockers-goto"
            >
              מעבר לשורה החסומה
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
                  disabled={Boolean(startDisabledReason) || hasBlockers || startingReview}
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
              disabled={hasBlockers || draft.downloading}
              onClick={draft.download}
              data-testid="payroll-download-draft"
            >
              {draft.downloading ? 'מכין טיוטה…' : 'הורד טיוטה'}
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
        {draft.error && (
          <Banner tone="error" className="mb-2" testId="payroll-download-error">
            {draft.error}
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
            <h3
              className="mb-2 text-sm font-semibold text-slate-800"
              data-testid="payroll-file-preview-title"
            >
              כך ייראה הקובץ לרואה החשבון
            </h3>
            <SheetSwitch sheet={sheet} onSheet={onSheet} />
            {summary ? (
              <HostessSummaryTable summary={summary} rows={paged.pageRows} />
            ) : (
              <DraftTable
                rows={paged.pageRows}
                offset={paged.from - 1}
                hoursTotal={salaryFileHoursTotal(fileLines)}
              />
            )}
            <Pager {...paged} onPage={onPage} testId="payroll-draft-pager" />
          </>
        )}
      </Card>
    </div>
  )
}

// "לפי משמרת | סיכום לפי דיילת" — שני הגיליונות שבקובץ. כפתורים עם aria-pressed, כמו מסנני המעקב.
function SheetSwitch({ sheet, onSheet }) {
  return (
    <div
      className="mb-3 inline-flex rounded-lg border border-slate-300 p-0.5"
      role="group"
      aria-label="תצוגת הקובץ"
      data-testid="payroll-sheet-switch"
    >
      {SHEETS.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={sheet === key}
          onClick={() => onSheet(key)}
          className={`min-h-9 rounded-md px-3 py-1.5 text-sm font-semibold ${
            sheet === key ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
          data-testid={`payroll-sheet-${key}`}
        >
          {SHEET_LABELS[key]}
        </button>
      ))}
    </div>
  )
}

function MissingBankTag() {
  return (
    <span
      className="mr-1 inline-block rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-900"
      data-testid="payroll-missing-bank-tag"
    >
      חסרים פרטי בנק
    </span>
  )
}

// גיליון 2 של הקובץ על המסך, אחד-לאחד: עמודות `HOSTESS_SUMMARY_COLUMNS`, שורה לדיילת לפי שם,
// ושורת סה"כ של משמרות ושעות (`salaryFileHostessSummary` — אותו קיבוץ כמו בקובץ).
function HostessSummaryTable({ summary, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm" data-testid="payroll-hostess-summary-table">
        <thead>
          <tr>
            {HOSTESS_SUMMARY_COLUMNS.map((label) => (
              <Th key={label}>{label}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} data-testid="payroll-hostess-summary-row">
              <Td>
                <Ltr>{row.cells[0]}</Ltr>
              </Td>
              <Td className="font-semibold text-slate-800">{row.cells[1]}</Td>
              <Td>
                {row.bankMissing ? (
                  <>
                    <NotApplicable /> <MissingBankTag />
                  </>
                ) : (
                  <Ltr>{row.cells[2]}</Ltr>
                )}
              </Td>
              {row.cells.slice(3).map((value, c) => (
                <Td key={HOSTESS_SUMMARY_COLUMNS[c + 3]}>
                  {value === '—' ? <NotApplicable /> : <Ltr>{value}</Ltr>}
                </Td>
              ))}
            </tr>
          ))}
          <tr className="bg-slate-50" data-testid="payroll-hostess-summary-total">
            <Td className="border-t-2 border-slate-300 font-bold">{HOSTESS_SUMMARY_TOTAL_LABEL}</Td>
            <Td className="border-t-2 border-slate-300" />
            <Td className="border-t-2 border-slate-300" />
            <Td className="border-t-2 border-slate-300 font-bold">
              <Ltr>{summary.totalShifts}</Ltr>
            </Td>
            <Td className="border-t-2 border-slate-300 font-bold">
              {summary.totalHours === '—' ? <NotApplicable /> : <Ltr>{summary.totalHours}</Ltr>}
            </Td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function DraftDetails({ preview, missingBank, zeroDurationCount }) {
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
      {missingBank.length > 0 && (
        <Disclosure
          summary={countPhrase(missingBank.length, 'דיילת אחת בלי פרטי בנק', 'דיילות בלי פרטי בנק')}
          testId="payroll-missing-bank-summary"
        >
          <p>{missingBank.join(', ')}</p>
        </Disclosure>
      )}
      <Disclosure summary="פרטים נוספים" testId="payroll-draft-details">
        <p>
          נאסף ב-<Ltr>{formatTimestampFull(preview.captured_at, '—')}</Ltr>
        </p>
        {zeroDurationCount > 0 && (
          <p>
            {countPhrase(zeroDurationCount, 'שורת פיצוי אחת', 'שורות פיצוי')} עם שעת התחלה זהה לשעת
            הסיום — נרשמות עם 0 שעות
          </p>
        )}
      </Disclosure>
    </div>
  )
}

// תצוגה מקדימה של הקובץ, אחד-לאחד: עמודות `SALARY_REPORT_COLUMNS`, ערכים מ-`salaryFilePreviewCells`
// (אותם כללי פורמט כמו בקובץ), ושורת "סה"כ שעות". מה שאינו חלק מהקובץ — חסימה, בנק חסר,
// פיצוי ביטול — מוצג כתג קטן בתוך התא, לא כעמודה.
function DraftTable({ rows, offset, hoursTotal }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm" data-testid="payroll-draft-table">
        <thead>
          <tr>
            {SALARY_REPORT_COLUMNS.map((label) => (
              <Th key={label}>{label}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((line, i) => {
            const defects = line.defects ?? []
            const cells = salaryFilePreviewCells(line)
            return (
              <tr
                key={`${line.project_id}-${line.hostess_id}-${line.assignment_number}-${line.line_basis}`}
                id={`payroll-line-${offset + i}`}
                className={defects.length > 0 ? 'bg-red-50' : undefined}
                data-testid="payroll-draft-row"
              >
                <Td>
                  <Ltr>{cells[0]}</Ltr>
                </Td>
                <Td>
                  <div className="font-semibold text-slate-800">{cells[1]}</div>
                  {defects.length > 0 && (
                    <div className="mt-1 text-xs font-semibold text-red-700" role="note">
                      {defects.map((d) => DEFECT_LABELS[d] ?? payrollErrorMessage(d)).join(' · ')}
                    </div>
                  )}
                </Td>
                <Td>
                  {line.bank_account ? (
                    <Ltr>{cells[2]}</Ltr>
                  ) : (
                    <>
                      <NotApplicable /> <MissingBankTag />
                    </>
                  )}
                </Td>
                {cells.slice(3).map((value, c) => (
                  <Td key={SALARY_REPORT_COLUMNS[c + 3]}>
                    {value === '—' ? <NotApplicable /> : <Ltr>{value}</Ltr>}
                  </Td>
                ))}
              </tr>
            )
          })}
          <tr className="bg-slate-50" data-testid="payroll-draft-hours-total">
            <Td className="border-t-2 border-slate-300 font-bold">סה"כ שעות</Td>
            <Td className="border-t-2 border-slate-300" />
            <Td className="border-t-2 border-slate-300" />
            <Td className="border-t-2 border-slate-300" />
            <Td className="border-t-2 border-slate-300" />
            <Td className="border-t-2 border-slate-300 font-bold">
              <Ltr>{hoursTotal}</Ltr>
            </Td>
            <Td className="border-t-2 border-slate-300" />
            <Td className="border-t-2 border-slate-300" />
          </tr>
        </tbody>
      </table>
    </div>
  )
}
