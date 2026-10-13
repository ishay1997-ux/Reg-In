// לשונית "היסטוריה" (חוזה §4.1 סעיף 5, מדריך ה-UX §א.6). קריאה בלבד מנתונים קפואים.
// משתמש בהרשאת צפייה רואה רק את הלשונית הזו; כפתורי עריכה לא מוצגים לו כלל.
// השלמות מוצגות מוזחות מתחת לדוח המקורי שלהן.

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import LoadingOrError from '@/components/LoadingOrError'
import Ltr from '@/components/Ltr'
import Money from '@/components/Money'
import StatusTag from '@/components/StatusTag'
import { formatTimestampFull } from '@/lib/dates'
import { salaryPeriodLabel } from '@/lib/salaryReport'
import { cn } from '@/lib/utils'
import { listPayrollReports } from '../payrollApi'
import ReportDetail from './ReportDetail'
import { Card, Td, Th } from './payrollUi'
import { accountantDeliveryTag, groupReports, kindLabel, payrollErrorMessage } from './payrollModel'

export default function HistorySection({ reportId, update, canEdit, page }) {
  if (reportId) {
    return <ReportDetail reportId={reportId} update={update} canEdit={canEdit} page={page} />
  }
  return <ReportList update={update} />
}

function ReportList({ update }) {
  const [reports, setReports] = useState(null)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    listPayrollReports()
      .then((data) => !cancelled && (setReports(data), setError(null)))
      .catch((err) => !cancelled && setError(err))
    return () => {
      cancelled = true
    }
  }, [tick])

  if (error) {
    return (
      <Card testId="payroll-history-error">
        <LoadingOrError
          error={payrollErrorMessage(error)}
          onRetry={() => setTick((t) => t + 1)}
          retryTestId="payroll-history-retry"
        />
      </Card>
    )
  }
  if (!reports) {
    return (
      <Card testId="payroll-history-loading">
        <LoadingOrError loading skeleton={{ variant: 'table' }} />
      </Card>
    )
  }
  if (reports.length === 0) {
    return (
      <Card testId="payroll-history-empty">
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <p className="text-sm font-medium text-slate-700">עדיין לא הופקו דוחות</p>
          <p className="text-sm text-slate-600">דוחות שיופקו יופיעו כאן עם הקובץ ומצב השליחה</p>
        </div>
      </Card>
    )
  }

  return (
    <Card testId="payroll-history">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr>
              <Th>חודש</Th>
              <Th>סוג</Th>
              <Th>מספר דוח</Th>
              <Th>סה"כ לתשלום</Th>
              <Th>קובץ</Th>
              <Th>משלוח</Th>
            </tr>
          </thead>
          <tbody>
            {groupReports(reports).map(({ report, nested }) => {
              const delivery = accountantDeliveryTag(report.delivery_state)
              return (
                <tr key={report.report_id} data-testid={`payroll-history-row-${report.report_id}`}>
                  <Td className={cn(nested && 'pr-6')}>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 font-semibold text-teal-700 underline"
                      onClick={() => update({ reportId: report.report_id, page: null })}
                      data-testid={`payroll-history-open-${report.report_id}`}
                    >
                      {salaryPeriodLabel(report.period)}
                    </Button>
                    {report.open_post_issue_cases > 0 && (
                      <div className="mt-1">
                        <StatusTag
                          label={`פניות אחרי ההפקה: ${report.open_post_issue_cases}`}
                          tone="warn"
                          testId={`payroll-history-cases-${report.report_id}`}
                        />
                      </div>
                    )}
                  </Td>
                  <Td>{kindLabel(report.report_kind, report.supplement_seq)}</Td>
                  <Td>
                    <Ltr>{report.report_id}</Ltr>
                  </Td>
                  <Td>
                    <Money amount={report.total_amount} cents />
                  </Td>
                  <Td>{report.artifact_available ? 'שמור' : 'לא נשמר'}</Td>
                  <Td>
                    <StatusTag label={delivery.label} tone={delivery.tone} />
                    {report.last_attempt?.completed_at && (
                      <div className="mt-1 text-xs text-slate-600">
                        <Ltr>{formatTimestampFull(report.last_attempt.completed_at)}</Ltr>
                      </div>
                    )}
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
