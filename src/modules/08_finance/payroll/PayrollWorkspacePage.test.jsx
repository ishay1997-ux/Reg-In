// בדיקות מרחב דוח השכר — מסך מול `payrollApi` ממוקק (fixtures לפי חוזה §4.3).
//
// המבנה: כל `describe` ממופה לשורה בטבלת המצבים של האפיון (`docs/plans/2026-10-13-payroll-end-to-end.md`
// :78–95) או בטבלת המשוב (:256–268). הנוסחים הם אחרי תיקוני מדריך ה-UX (`ux-guide.md` §ב).
// 🔴 `@/supabaseClient` ממוקק — בלעדיו הקובץ נופל ב-CI.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

vi.mock('@/supabaseClient', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
    functions: { invoke: vi.fn() },
    storage: { from: vi.fn() },
  },
}))
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('@/api/email', () => ({ getEmailTemplate: vi.fn() }))
vi.mock('./payrollFiles', () => ({ downloadDraft: vi.fn(), downloadReconstruction: vi.fn() }))
vi.mock('../payrollApi', async () => {
  const actual = await vi.importActual('../payrollApi')
  const names = [
    'getPayrollPreview',
    'listPayrollReports',
    'getPayrollReportDetail',
    'getPayrollFileUrl',
    'createPayrollReview',
    'getPayrollReview',
    'findPayrollReview',
    'refreshPayrollReview',
    'getPayrollReviewReadiness',
    'approvePayrollDraft',
    'setPayrollReviewDeadline',
    'distributePayrollReview',
    'continuePayrollDistribution',
    'resendPayrollReviewMail',
    'getPayrollCaseDetail',
    'resolvePayrollCase',
    'approvePayrollNoResponse',
    'correctUnclaimedAssignment',
    'cancelPayrollReview',
    'issuePayrollReport',
    'resumePayrollOperation',
    'getPayrollOperationStatus',
    'abandonPayrollOperation',
    'retryAccountantSend',
  ]
  return { ...actual, ...Object.fromEntries(names.map((n) => [n, vi.fn()])) }
})

import { useAuth } from '@/contexts/AuthContext'
import { getEmailTemplate } from '@/api/email'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import { ToastProvider } from '@/components/ToastProvider'
import * as api from '../payrollApi'
import { PayrollError } from '../payrollApi'
import { downloadDraft, downloadReconstruction } from './payrollFiles'
import PayrollWorkspacePage from './PayrollWorkspacePage'
import {
  caseDetail,
  compensationLine,
  makePreview,
  makeReadiness,
  makeReview,
  opStatus,
  previewLine,
  recipient,
  reportDetail,
  reportItem,
} from './testFixtures'

const TEMPLATE =
  'שלום [שם_דיילת],\nסיכום השעות שלך לחודש [חודש_דיווח_ושנה] מוכן לבדיקה.\n[לינק_בדיקת_שעות]\nנשמח לתשובתך עד [מועד_אחרון_לתגובה]'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.search}</output>
}

function renderPage(search = '?period=2026-07', { perm = 'edit' } = {}) {
  useAuth.mockReturnValue({ permissions: { כספים: perm } })
  return render(
    <MemoryRouter initialEntries={[`/finance/payroll${search}`]}>
      <ConfirmProvider>
        <ToastProvider>
          <Routes>
            <Route
              path="/finance/payroll"
              element={
                <>
                  <PayrollWorkspacePage />
                  <LocationProbe />
                </>
              }
            />
          </Routes>
        </ToastProvider>
      </ConfirmProvider>
    </MemoryRouter>,
  )
}

const searchParams = () => new URLSearchParams(screen.getByTestId('location').textContent)

async function confirmDialog() {
  fireEvent.click(await screen.findByTestId('confirm-dialog-confirm'))
}

beforeEach(() => {
  vi.clearAllMocks()
  api.getPayrollPreview.mockResolvedValue(makePreview())
  api.findPayrollReview.mockResolvedValue(null)
  api.getPayrollReviewReadiness.mockResolvedValue(makeReadiness())
  api.listPayrollReports.mockResolvedValue([reportItem()])
  api.getPayrollReportDetail.mockResolvedValue(reportDetail())
  api.getPayrollOperationStatus.mockResolvedValue(opStatus())
  getEmailTemplate.mockResolvedValue(TEMPLATE)
  downloadDraft.mockResolvedValue({})
})

afterEach(() => {
  vi.useRealTimers()
})

// ── טבלת המצבים ─────────────────────────────────────────────────────────────────

describe('מצב: טוען תצוגה מקדימה', () => {
  it('"טוען את שורות הדוח…" ושלד — בלי אפסים', async () => {
    api.getPayrollPreview.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(await screen.findByText('טוען את שורות הדוח…')).toBeInTheDocument()
    expect(screen.queryByTestId('payroll-tile-total')).not.toBeInTheDocument()
    expect(screen.queryByText(/0\.00/)).not.toBeInTheDocument()
  })
})

describe('מצב: התצוגה המקדימה נכשלה', () => {
  it('שגיאה קבועה + "נסה שוב"; לא מוצג "אין שורות"', async () => {
    api.getPayrollPreview.mockRejectedValueOnce(new PayrollError('NETWORK'))
    renderPage()
    expect(await screen.findByText('אין חיבור לשרת. נסה שוב')).toBeInTheDocument()
    expect(screen.queryByTestId('payroll-draft-empty')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('payroll-draft-retry'))
    expect(await screen.findByTestId('payroll-draft')).toBeInTheDocument()
    expect(api.getPayrollPreview).toHaveBeenCalledTimes(2)
  })
})

describe('מצב: טיוטה מוכנה', () => {
  it('חודש, סכום, נמען, פעולות: הורד טיוטה · רענן · שלח סיכומים לדיילות', async () => {
    renderPage()
    expect(await screen.findByTestId('payroll-title')).toHaveTextContent('דוח שכר · יולי 2026')
    // F12: בלי סכום בש"ח על המסך — הסיכום בשעות (6 + 4 = 10).
    expect(screen.getByTestId('payroll-tile-hours')).toHaveTextContent('10')
    expect(screen.queryByText('סה"כ לתשלום')).not.toBeInTheDocument()
    expect(screen.queryByText('452.60', { exact: false })).not.toBeInTheDocument()
    // F13: הנמען המקורי בלבד; כתובת הבדיקה ("הופנה") לא מופיעה בשום מסך.
    expect(screen.getByTestId('payroll-accountant')).toHaveTextContent('office@accountant.example')
    expect(screen.getByTestId('payroll-workspace')).not.toHaveTextContent('ishay1997@gmail.com')
    expect(screen.getByTestId('payroll-workspace')).not.toHaveTextContent('כתובת הבדיקה')
    expect(screen.getByTestId('payroll-download-draft')).toBeEnabled()
    expect(screen.getByTestId('payroll-refresh')).toBeEnabled()
    expect(screen.getByTestId('payroll-start-review')).toHaveTextContent('שלח סיכומים לדיילות')
    expect(screen.getByTestId('payroll-stage')).toHaveTextContent(
      'הצעד הבא: לבדוק את הטיוטה ולשלוח סיכומים לדיילות',
    )
  })

  it('שורת פיצוי: בונוס ונסיעות "—" ולא 0; בלי עמודות ת"ז ובנק; בנק חסר = תג (UX D1)', async () => {
    renderPage()
    const table = await screen.findByTestId('payroll-draft-table')
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((h) => h.textContent)
    expect(headers).toEqual(['דיילת', 'שעות', 'תעריף', 'בונוס', 'נסיעות'])
    const rows = screen.getAllByTestId('payroll-draft-row')
    const comp = rows.find((row) => row.textContent.includes('מאיה כהן'))
    const cells = within(comp).getAllByRole('cell')
    expect(cells[1]).toHaveTextContent('4')
    expect(cells[1]).not.toHaveTextContent('4.00')
    expect(cells[3]).toHaveTextContent('—')
    expect(cells[4]).toHaveTextContent('—')
    expect(cells[3]).not.toHaveTextContent('0.00')
    expect(within(comp).getByTestId('payroll-missing-bank-tag')).toHaveTextContent('חסרים פרטי בנק')
    expect(table).not.toHaveTextContent('204455667')
    expect(screen.getByTestId('payroll-missing-bank-summary')).toHaveTextContent(
      'דיילת אחת בלי פרטי בנק',
    )
  })

  it('הורדת טיוטה: הטוסט מופיע רק אחרי שהקובץ נבנה, עם כל השורות', async () => {
    renderPage()
    fireEvent.click(await screen.findByTestId('payroll-download-draft'))
    expect(await screen.findByText('הטיוטה מוכנה להורדה')).toBeInTheDocument()
    expect(downloadDraft).toHaveBeenCalledWith(expect.objectContaining({ version: 'v1:abc' }))
  })

  it('הורדת טיוטה נכשלה ⇒ הודעה קבועה, בלי טוסט הצלחה', async () => {
    downloadDraft.mockRejectedValueOnce(new Error('סכום שורות הדוח אינו תואם'))
    renderPage()
    fireEvent.click(await screen.findByTestId('payroll-download-draft'))
    expect(await screen.findByTestId('payroll-download-error')).toHaveTextContent('אינו תואם')
    expect(screen.queryByText('הטיוטה מוכנה להורדה')).not.toBeInTheDocument()
  })

  it('"שלח סיכומים לדיילות" פותח בדיקה ומעביר ללשונית המעקב', async () => {
    api.createPayrollReview.mockResolvedValue({ ok: true, review_id: 600001 })
    api.getPayrollReview.mockResolvedValue(
      makeReview({ review: { manager_approved: false, distributed_at: null } }),
    )
    renderPage()
    fireEvent.click(await screen.findByTestId('payroll-start-review'))
    await screen.findByTestId('payroll-review')
    expect(api.createPayrollReview).toHaveBeenCalledWith({
      period: '2026-07-01',
      kind: 'regular',
      originalReportId: null,
      version: 'v1:abc',
    })
    expect(searchParams().get('view')).toBe('review')
  })
})

describe('מצב: חסימה', () => {
  const blocked = () =>
    makePreview({
      lines: [previewLine({ id_number: '', defects: ['IDENTITY_MISSING'] }), compensationLine()],
      blockers: [{ code: 'IDENTITY_MISSING', count: 1, refs: [] }],
    })

  it('שגיאה בשורה + סיכום למעלה; שליחה וטיוטה מושבתות עם סיבה גלויה', async () => {
    api.getPayrollPreview.mockResolvedValue(blocked())
    renderPage()
    // UX D4: הודעה אחת שאומרת מה חסר ואיפה משלימים — לא שלוש.
    expect(await screen.findByTestId('payroll-blockers')).toHaveTextContent(
      'שורה אחת חסומה: חסרה ת"ז או שם. יש להשלים בכרטיס הדיילת',
    )
    const row = screen.getAllByTestId('payroll-draft-row')[0]
    expect(row).toHaveTextContent('חסרים שם או ת"ז')
    expect(screen.getByTestId('payroll-start-review')).toBeDisabled()
    expect(screen.getByTestId('payroll-download-draft')).toBeDisabled()
    expect(screen.queryByTestId('payroll-start-reason')).not.toBeInTheDocument()
    expect(screen.queryByTestId('payroll-draft-reason')).not.toBeInTheDocument()
  })
})

describe('מצב: אין שורות זכאיות', () => {
  it('משפט הריק + ממתינות לסגירה בנפרד; אין כפתור שליחה', async () => {
    api.getPayrollPreview.mockResolvedValue(
      makePreview({
        lines: [],
        pending_closure: {
          ok: true,
          project_count: 1,
          assignment_count: 3,
          projects: [
            {
              project_id: 1,
              event_name: 'ערב גאלה',
              event_date: '2026-07-30',
              project_status: 'event_finished',
            },
          ],
        },
      }),
    )
    renderPage()
    expect(await screen.findByTestId('payroll-draft-empty')).toHaveTextContent(
      'אין לחודש הזה שעות מאושרות שעוד לא נכללו בדוח',
    )
    expect(screen.getByTestId('payroll-draft-empty-pending')).toHaveTextContent(
      '3 משמרות ממתינות לסגירת שעות',
    )
    expect(screen.queryByTestId('payroll-start-review')).not.toBeInTheDocument()
  })

  it('בדיקת "ממתינות לסגירה" נכשלה ⇒ "לא ידוע", לא 0', async () => {
    api.getPayrollPreview.mockResolvedValue(makePreview({ pending_closure: { ok: false } }))
    renderPage()
    expect(await screen.findByTestId('payroll-pending-failed')).toHaveTextContent(
      'לא ניתן לבדוק כרגע',
    )
    expect(screen.queryByTestId('payroll-pending')).not.toBeInTheDocument()
  })
})

describe('מצב: כל השורות באפס', () => {
  it('הסבר מפורש שהשורות נרשמות ולא נכנסות לקובץ', async () => {
    const zero = previewLine({ hours: 0, travel: 0, line_total: 0, show_in_file: false })
    api.getPayrollPreview.mockResolvedValue(makePreview({ lines: [zero] }))
    renderPage()
    expect(await screen.findByTestId('payroll-all-zero')).toHaveTextContent(
      'כל השורות בחודש הזה באפס',
    )
  })
})

describe('מצב: לחודש כבר הופק דוח רגיל', () => {
  it('הודעה + "לדוח שהופק" ⇒ פרטי הדוח בהיסטוריה; משם "הפק דוח השלמה"', async () => {
    api.getPayrollPreview.mockRejectedValue(
      new PayrollError('PERIOD_EXISTS', { hint: { report_id: 31 } }),
    )
    renderPage()
    expect(
      await screen.findByText('לחודש הזה כבר הופק דוח. אפשר לצפות בו בהיסטוריה'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('payroll-draft-open-existing'))
    await screen.findByTestId('payroll-detail')
    expect(searchParams().get('report')).toBe('31')
    fireEvent.click(screen.getByTestId('payroll-start-supplement'))
    await waitFor(() => expect(searchParams().get('kind')).toBe('supplement'))
    expect(searchParams().get('original')).toBe('31')
    expect(searchParams().get('view')).toBe('draft')
  })
})

describe('מצב: החודש הנוכחי', () => {
  it('התאריך המחושב (מהשרת) בשורת השלב ומתחת לכפתור; שליחה מושבתת (UX D11)', async () => {
    api.getPayrollPreview.mockResolvedValue(
      makePreview({ period: '2026-10-01', month_state: 'current' }),
    )
    renderPage('?period=2026-10')
    expect(await screen.findByTestId('payroll-next-step')).toHaveTextContent(
      'הפקה ושליחה יתאפשרו מ-01/11/2026, אחרי סוף החודש',
    )
    expect(screen.getByTestId('payroll-start-reason')).toHaveTextContent('01/11/2026')
    expect(screen.queryByTestId('payroll-current-month')).not.toBeInTheDocument()
    expect(screen.getByTestId('payroll-start-review')).toBeDisabled()
    expect(screen.getByTestId('payroll-download-draft')).toBeEnabled()
  })

  it('לשונית אישור סופי: "הפק ושלח" מושבת עם תאריך הפתיחה', async () => {
    api.getPayrollPreview.mockResolvedValue(
      makePreview({ period: '2026-10-01', month_state: 'current' }),
    )
    api.findPayrollReview.mockResolvedValue(
      makeReview({
        review: { period: '2026-10-01' },
        readiness: makeReadiness({ ready: true, blockers: [] }),
      }),
    )
    api.getPayrollReviewReadiness.mockResolvedValue(makeReadiness({ ready: true, blockers: [] }))
    renderPage('?period=2026-10&view=final')
    expect(await screen.findByTestId('payroll-issue')).toBeDisabled()
    expect(screen.getByTestId('payroll-final-month')).toHaveTextContent('01/11/2026')
  })
})

describe('מצב: מוכן להפקה + אישור', () => {
  beforeEach(() => {
    const ready = makeReadiness({ ready: true, blockers: [] })
    api.findPayrollReview.mockResolvedValue(makeReview({ readiness: ready }))
    api.getPayrollReviewReadiness.mockResolvedValue(ready)
  })

  it('מונים, סיכום ונמען; האישור מציג סוג, חודש, משמרות ושעות (בלי ₪), נמען ונעילת השעות', async () => {
    api.issuePayrollReport.mockResolvedValue({ ok: true, operation_id: 'from-server' })
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('from-server')
    renderPage('?period=2026-07&view=final')
    expect(await screen.findByTestId('payroll-final-summary')).toHaveTextContent(
      'office@accountant.example',
    )
    fireEvent.click(screen.getByTestId('payroll-issue'))
    const message = await screen.findByTestId('confirm-dialog-message')
    expect(message).toHaveTextContent('רגיל · יולי 2026')
    expect(message).toHaveTextContent('2 משמרות · 10 שעות · 2 דיילות')
    expect(message).not.toHaveTextContent('₪')
    expect(message).toHaveTextContent('office@accountant.example')
    expect(message).not.toHaveTextContent('ishay1997@gmail.com')
    expect(message).toHaveTextContent('השעות יינעלו לדוח הזה ולא ייכללו שוב')
    await confirmDialog()
    await waitFor(() => expect(api.issuePayrollReport).toHaveBeenCalled())
    // מזהה ההפקה נכתב לכתובת לפני/עם הקריאה — רענון חוזר לאותה הפקה.
    await waitFor(() => expect(searchParams().get('op')).toBe('from-server'))
  })

  it('ביטול באישור ⇒ אין הפקה', async () => {
    renderPage('?period=2026-07&view=final')
    fireEvent.click(await screen.findByTestId('payroll-issue'))
    fireEvent.click(await screen.findByTestId('confirm-dialog-cancel'))
    await waitFor(() => expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument())
    expect(api.issuePayrollReport).not.toHaveBeenCalled()
  })

  it('תשובת ההפקה אבדה (RESULT_UNKNOWN) ⇒ "עוד לא ידוע אם הדוח הופק", והמזהה נשאר בכתובת', async () => {
    api.issuePayrollReport.mockRejectedValue(new PayrollError('RESULT_UNKNOWN'))
    api.getPayrollOperationStatus.mockResolvedValue(
      opStatus({ state: 'prepared', accountant_attempt: null, next_action: 'resume' }),
    )
    renderPage('?period=2026-07&view=final')
    fireEvent.click(await screen.findByTestId('payroll-issue'))
    await confirmDialog()
    expect(await screen.findByTestId('payroll-issue-error')).toHaveTextContent(
      'עוד לא ידוע אם הדוח הופק. יש לבדוק לפני הפקה נוספת',
    )
    await waitFor(() =>
      expect(searchParams().get('op')).toBe(api.issuePayrollReport.mock.calls[0][0].operationId),
    )
    expect(await screen.findByTestId('payroll-operation-stage')).toHaveTextContent('מפיק את הדוח…')
  })

  it('הנתונים השתנו בהפקה ⇒ הודעת רענון ואין טוסט הצלחה', async () => {
    api.issuePayrollReport.mockRejectedValue(new PayrollError('PREVIEW_CHANGED'))
    api.getPayrollOperationStatus.mockResolvedValue(
      opStatus({ state: 'failed', failure_code: 'PREVIEW_CHANGED', accountant_attempt: null }),
    )
    renderPage('?period=2026-07&view=final')
    fireEvent.click(await screen.findByTestId('payroll-issue'))
    await confirmDialog()
    expect(await screen.findByTestId('payroll-issue-error')).toHaveTextContent(
      'הנתונים השתנו. יש לרענן לפני אישור',
    )
    expect(screen.queryByText('הדוח נשמר ונשלח לרואה החשבון')).not.toBeInTheDocument()
  })

  it('חוסמים גלויים כטקסט, כל אחד עם קישור לטיפול', async () => {
    const notReady = makeReadiness({
      ready: false,
      blockers: [
        { code: 'OBJECTION_OPEN', count: 2 },
        { code: 'DECISIONS_MISSING', count: 1 },
      ],
    })
    api.getPayrollReviewReadiness.mockResolvedValue(notReady)
    renderPage('?period=2026-07&view=final')
    const list = await screen.findByTestId('payroll-final-blockers')
    expect(list).toHaveTextContent('2 פניות פתוחות')
    expect(list).toHaveTextContent('דיילת אחת עוד בלי אישור')
    expect(screen.getByTestId('payroll-issue')).toBeDisabled()
    fireEvent.click(within(list).getAllByText('לטיפול')[1])
    await waitFor(() => expect(searchParams().get('filter')).toBe('noreply'))
    expect(searchParams().get('view')).toBe('review')
  })
})

describe('מצבי ההפקה השמורה (op= בכתובת)', () => {
  const OP = '?period=2026-07&view=final&op=11111111-1111-4111-8111-111111111111'

  it.each([
    ['preparing', 'מכין ושומר את הקובץ…'],
    ['prepared', 'מפיק את הדוח…'],
  ])('%s ⇒ "%s", ואין כפתור הפקה שני', async (state, text) => {
    api.findPayrollReview.mockResolvedValue(makeReview())
    api.getPayrollOperationStatus.mockResolvedValue(
      opStatus({ state, accountant_attempt: null, next_action: 'wait' }),
    )
    renderPage(OP)
    expect(await screen.findByTestId('payroll-operation-stage')).toHaveTextContent(text)
    expect(screen.queryByTestId('payroll-operation-check')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('payroll-issue')).toBeDisabled())
  })

  it('בשליחה ⇒ "שולח לרואה החשבון…" ובלי טוסט הצלחה', async () => {
    api.findPayrollReview.mockResolvedValue(makeReview({ review: { status: 'issued' } }))
    api.getPayrollOperationStatus.mockResolvedValue(
      opStatus({ accountant_attempt: { attempt_id: 1, state: 'sending' }, next_action: 'wait' }),
    )
    renderPage(OP)
    expect(await screen.findByTestId('payroll-operation-stage')).toHaveTextContent(
      'שולח לרואה החשבון…',
    )
    expect(screen.queryByText('הדוח נשמר ונשלח לרואה החשבון')).not.toBeInTheDocument()
  })

  it('מעבר בשליחה ⇒ נשלח: טוסט הצלחה + מצב קבוע', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    api.findPayrollReview.mockResolvedValue(makeReview({ review: { status: 'issued' } }))
    api.getPayrollOperationStatus
      .mockResolvedValueOnce(
        opStatus({ accountant_attempt: { attempt_id: 1, state: 'sending' }, next_action: 'wait' }),
      )
      .mockResolvedValue(opStatus())
    renderPage(OP)
    await screen.findByText('שולח לרואה החשבון…')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100)
    })
    expect(await screen.findAllByText('הדוח נשמר ונשלח לרואה החשבון')).toHaveLength(2)
  })

  it('כשל ידוע ⇒ "הדוח נשמר אבל לא נשלח" + "שלח שוב" עם הנמען בפועל', async () => {
    api.findPayrollReview.mockResolvedValue(makeReview({ review: { status: 'issued' } }))
    api.getPayrollOperationStatus.mockResolvedValue(
      opStatus({
        accountant_attempt: {
          attempt_id: 810001,
          state: 'failed',
          intended_recipient: 'office@accountant.example',
        },
        next_action: 'retry_send',
      }),
    )
    api.retryAccountantSend.mockResolvedValue({ ok: true, attempt_id: 810002 })
    renderPage(OP)
    expect(await screen.findByTestId('payroll-operation-stage')).toHaveTextContent(
      'הדוח נשמר אבל לא נשלח. אפשר לשלוח שוב',
    )
    fireEvent.click(screen.getByTestId('payroll-accountant-resend'))
    expect(await screen.findByTestId('confirm-dialog-message')).toHaveTextContent(
      'אותו קובץ יישלח אל office@accountant.example',
    )
    await confirmDialog()
    await waitFor(() =>
      expect(api.retryAccountantSend).toHaveBeenCalledWith({
        reportId: 31,
        priorAttemptId: 810001,
        confirmedRecipient: 'office@accountant.example',
        acknowledgeUnknown: false,
      }),
    )
  })

  it('לא ידוע ⇒ "בדוק אם נשלח" קודם; שליחה רק אחרי אזהרה מפורשת; אין שליחה אוטומטית', async () => {
    api.findPayrollReview.mockResolvedValue(makeReview({ review: { status: 'issued' } }))
    api.getPayrollOperationStatus.mockResolvedValue(
      opStatus({
        accountant_attempt: { attempt_id: 810001, state: 'unknown', intended_recipient: 'o@a.ex' },
        next_action: 'check_status',
      }),
    )
    api.retryAccountantSend.mockResolvedValue({ ok: true })
    renderPage(OP)
    expect(await screen.findByTestId('payroll-operation-stage')).toHaveTextContent(
      'לא ידוע אם הדוח נשלח. יש לבדוק לפני שליחה חוזרת',
    )
    expect(api.retryAccountantSend).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('payroll-accountant-check'))
    fireEvent.click(await screen.findByTestId('payroll-accountant-resend-unknown'))
    expect(await screen.findByTestId('confirm-dialog-message')).toHaveTextContent(
      'שליחה נוספת עלולה להגיע פעמיים',
    )
    await confirmDialog()
    await waitFor(() =>
      expect(api.retryAccountantSend).toHaveBeenCalledWith(
        expect.objectContaining({ acknowledgeUnknown: true }),
      ),
    )
  })

  it('שמירת הקובץ נכשלה ⇒ "הדוח לא הופק ולא נשלח"', async () => {
    api.findPayrollReview.mockResolvedValue(makeReview())
    api.getPayrollOperationStatus.mockResolvedValue(
      opStatus({ state: 'failed', failure_code: 'STORAGE_FAILED', accountant_attempt: null }),
    )
    renderPage(OP)
    expect(await screen.findByTestId('payroll-operation-stage')).toHaveTextContent(
      'שמירת הקובץ נכשלה. הדוח לא הופק ולא נשלח, אפשר לנסות שוב',
    )
  })

  it('הפקה שנעצרה ⇒ "המשך" מחדש את אותה הפקה', async () => {
    api.findPayrollReview.mockResolvedValue(makeReview())
    api.getPayrollOperationStatus.mockResolvedValue(
      opStatus({ state: 'prepared', accountant_attempt: null, next_action: 'resume' }),
    )
    api.resumePayrollOperation.mockResolvedValue({ ok: true })
    renderPage(OP)
    fireEvent.click(await screen.findByTestId('payroll-operation-resume'))
    await waitFor(() =>
      expect(api.resumePayrollOperation).toHaveBeenCalledWith(
        '11111111-1111-4111-8111-111111111111',
      ),
    )
  })
})

// ── מעקב דיילות ─────────────────────────────────────────────────────────────────

describe('מעקב: שליחת סיכומים ומשוב', () => {
  function prepared() {
    return makeReview({
      review: { distributed_at: null },
      recipients: [
        recipient({ delivery: null }),
        recipient({ recipient_id: 700002, hostess_name: 'מאיה כהן', delivery: null }),
      ],
    })
  }

  it('האישור מציג חודש, מועד אחרון, מספר נמענים ודוגמת מייל; כולם נשלחו ⇒ "הסיכומים נשלחו"', async () => {
    api.findPayrollReview.mockResolvedValue(prepared())
    api.distributePayrollReview.mockResolvedValue({
      ok: true,
      processed: [{ recipient_id: 700001, state: 'sent' }],
      skipped: [],
      remaining: 1,
    })
    api.continuePayrollDistribution.mockResolvedValue({
      ok: true,
      processed: [{ recipient_id: 700002, state: 'sent' }],
      skipped: [],
      remaining: 0,
    })
    renderPage('?period=2026-07&view=review')
    await waitFor(() => expect(screen.getByTestId('payroll-distribute')).toBeEnabled())
    expect(getEmailTemplate).toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.getByTestId('payroll-sample-mail')).toHaveTextContent('שלום נועה לוי'),
    )
    fireEvent.click(screen.getByTestId('payroll-distribute'))
    const message = await screen.findByTestId('confirm-dialog-message')
    expect(message).toHaveTextContent('חודש: יולי 2026')
    expect(message).toHaveTextContent('יישלחו 2 סיכומים אישיים')
    expect(message).toHaveTextContent('14/10/2026 18:00')
    expect(message).toHaveTextContent('שלום נועה לוי')
    await confirmDialog()
    expect(await screen.findByText('שליחת הסיכומים התחילה')).toBeInTheDocument()
    expect(await screen.findByText('הסיכומים נשלחו')).toBeInTheDocument()
    expect(screen.getByTestId('payroll-progress')).toHaveTextContent('נשלחו 2 מתוך 2 סיכומים')
  })

  it('שליחה חלקית ⇒ "נשלחו 1 מתוך 2 סיכומים. 1 מסומנים ברשימה"', async () => {
    api.findPayrollReview.mockResolvedValue(prepared())
    api.distributePayrollReview.mockResolvedValue({
      ok: true,
      processed: [
        { recipient_id: 700001, state: 'sent' },
        { recipient_id: 700002, state: 'failed' },
      ],
      skipped: [],
      remaining: 0,
    })
    renderPage('?period=2026-07&view=review')
    await waitFor(() => expect(screen.getByTestId('payroll-distribute')).toBeEnabled())
    fireEvent.click(screen.getByTestId('payroll-distribute'))
    await confirmDialog()
    expect(await screen.findByText('נשלחו 1 מתוך 2 סיכומים. 1 מסומנים ברשימה')).toBeInTheDocument()
  })

  it('בלי אישור טיוטה ובלי מועד ⇒ השליחה מושבתת עם הסיבה', async () => {
    api.findPayrollReview.mockResolvedValue(
      makeReview({
        review: { manager_approved: false, response_deadline: null, distributed_at: null },
      }),
    )
    renderPage('?period=2026-07&view=review')
    expect(await screen.findByTestId('payroll-send-reason')).toHaveTextContent(
      'יש לאשר את הטיוטה קודם',
    )
    expect(screen.getByTestId('payroll-distribute')).toBeDisabled()
  })

  it('אישור טיוטה נשלח עם גרסת התצוגה המקדימה; גרסה ישנה ⇒ "הנתונים השתנו"', async () => {
    api.findPayrollReview.mockResolvedValue(
      makeReview({ review: { manager_approved: false, distributed_at: null } }),
    )
    api.approvePayrollDraft.mockRejectedValue(new PayrollError('PREVIEW_CHANGED'))
    renderPage('?period=2026-07&view=review')
    await waitFor(() => expect(screen.getByTestId('payroll-approve-draft')).toBeEnabled())
    fireEvent.click(screen.getByTestId('payroll-approve-draft'))
    expect(await screen.findByTestId('payroll-review-action-error')).toHaveTextContent(
      'הנתונים השתנו. יש לרענן לפני אישור',
    )
    expect(api.approvePayrollDraft).toHaveBeenCalledWith({
      reviewId: 600001,
      expectedRevision: 1,
      version: 'v1:abc',
    })
  })

  it('גרסת הבדיקה ישנה ⇒ באנר "הנתונים השתנו" עם "רענן" שמרענן את הבדיקה', async () => {
    api.findPayrollReview.mockResolvedValue(makeReview({ review: { version_current: false } }))
    api.refreshPayrollReview.mockResolvedValue({ ok: true, revision: 2 })
    renderPage('?period=2026-07&view=review')
    expect(await screen.findByTestId('payroll-review-stale')).toHaveTextContent(
      'הנתונים השתנו. יש לרענן לפני אישור',
    )
    fireEvent.click(screen.getByTestId('payroll-review-refresh'))
    await waitFor(() =>
      expect(api.refreshPayrollReview).toHaveBeenCalledWith({
        reviewId: 600001,
        expectedRevision: 1,
      }),
    )
  })
})

describe('מעקב: מסננים, חיפוש, עימוד וכתובת', () => {
  const many = Array.from({ length: 120 }, (_, i) =>
    recipient({
      recipient_id: 1000 + i,
      hostess_name: `דיילת ${String(i).padStart(3, '0')}`,
      state: i < 60 ? 'hostess_approved' : 'awaiting',
    }),
  )

  it('מונים מכל הרשימה; עמוד 50; עמוד 3 מכתובת מציג 20', async () => {
    api.findPayrollReview.mockResolvedValue(makeReview({ recipients: many }))
    renderPage('?period=2026-07&view=review&filter=all&page=3')
    await screen.findByTestId('payroll-review-table')
    expect(screen.getByTestId('payroll-filter-approved')).toHaveTextContent('60')
    expect(screen.getByTestId('payroll-filter-noreply')).toHaveTextContent('60')
    expect(screen.getByTestId('payroll-filter-all')).toHaveTextContent('120')
    const rows = within(screen.getByTestId('payroll-review-table')).getAllByRole('row')
    expect(rows).toHaveLength(21)
    expect(screen.getByTestId('payroll-review-pager-range')).toHaveTextContent('101–120')
  })

  it('מסנן וחיפוש נכתבים לכתובת ושורדים "רענון" (טעינה מחדש מאותה כתובת)', async () => {
    api.findPayrollReview.mockResolvedValue(makeReview({ recipients: many }))
    const { unmount } = renderPage('?period=2026-07&view=review')
    fireEvent.click(await screen.findByTestId('payroll-filter-noreply'))
    fireEvent.change(screen.getByTestId('payroll-review-search'), {
      target: { value: 'דיילת 077' },
    })
    await waitFor(() => expect(searchParams().get('q')).toBe('דיילת 077'))
    const saved = screen.getByTestId('location').textContent
    expect(new URLSearchParams(saved).get('filter')).toBe('noreply')
    unmount()
    renderPage(saved)
    await screen.findByTestId('payroll-review-table')
    expect(screen.getByTestId('payroll-filter-noreply')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('payroll-review-search')).toHaveValue('דיילת 077')
    expect(screen.getAllByTestId(/^payroll-recipient-\d+$/)).toHaveLength(1)
  })

  it('מסנן ריק ⇒ "אין דיילות במסנן הזה" + "הצג הכל"', async () => {
    api.findPayrollReview.mockResolvedValue(makeReview({ recipients: many }))
    renderPage('?period=2026-07&view=review&filter=action')
    expect(await screen.findByTestId('payroll-review-filter-empty')).toHaveTextContent(
      'אין דיילות במסנן הזה',
    )
    fireEvent.click(screen.getByText('הצג הכל'))
    await waitFor(() => expect(searchParams().get('filter')).toBe('all'))
  })
})

describe('מעקב: עמודת שעות במקום סכום (הכרעת ישי 14/10)', () => {
  it('הטבלה מציגה "11.5 שעות" ולא ₪; שעות חסרות ⇒ "—"', async () => {
    api.findPayrollReview.mockResolvedValue(
      makeReview({
        review: { distributed_at: null },
        recipients: [
          recipient({ hostess_name: 'מאיה כהן', total_hours: 11.5, delivery: null }),
          recipient({ recipient_id: 700009, total_hours: null, delivery: null }),
        ],
      }),
    )
    renderPage('?period=2026-07&view=review&filter=all')
    const table = await screen.findByTestId('payroll-review-table')
    expect(within(table).getByText('שעות', { selector: 'th' })).toBeInTheDocument()
    expect(within(table).queryByText('סכום', { selector: 'th' })).not.toBeInTheDocument()
    const cells = within(table).getAllByTestId('payroll-recipient-hours')
    expect(cells.map((c) => c.textContent)).toEqual(['11.5 שעות', '—'])
    expect(table).not.toHaveTextContent('₪')
  })
})

describe('מעקב: סטטוס אחד וצבע רק למה שדורש פעולה (תיקון ישי 14/10 00:35)', () => {
  it('עמודת "סטטוס" אחת; "אושר" ניטרלי עם ✓; פנייה פתוחה בתג ענבר; פרטי משלוח בשורה משנית', async () => {
    api.findPayrollReview.mockResolvedValue(
      makeReview({
        recipients: [
          recipient({ state: 'hostess_approved' }),
          recipient({
            recipient_id: 700002,
            hostess_name: 'מאיה כהן',
            open_case_id: 9,
            state: 'objection_open',
          }),
        ],
      }),
    )
    renderPage('?period=2026-07&view=review&filter=all')
    const table = await screen.findByTestId('payroll-review-table')
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((h) => h.textContent)
    expect(headers).toEqual(['דיילת', 'שעות', 'סטטוס', 'פעולה אחרונה', 'טיפול'])
    const approved = within(screen.getByTestId('payroll-recipient-700001')).getByTestId(
      'payroll-recipient-status',
    )
    expect(approved).toHaveTextContent('הדיילת אישרה')
    expect(approved).toHaveAttribute('data-kind', 'ok')
    expect(approved.className).not.toContain('bg-')
    expect(approved.querySelector('svg')).not.toBeNull()
    const open = within(screen.getByTestId('payroll-recipient-700002')).getByTestId(
      'payroll-recipient-status',
    )
    expect(open).toHaveTextContent('פנייה פתוחה')
    expect(open.className).toContain('bg-amber-50')
    // UX D6: אין שורה משנית שחוזרת על "פעולה אחרונה".
    expect(screen.queryByTestId('payroll-delivery-line')).not.toBeInTheDocument()
  })
})

describe('מעקב אחרי שליחה — שורה מקופלת ושליחת סיכום מעודכן (UX D5, D7)', () => {
  it('אחרי השליחה: שורה אחת עם מועד, "שלח תזכורת" ו"שנה מועד"; בלי שלבים ובלי דוגמת מייל', async () => {
    api.findPayrollReview.mockResolvedValue(makeReview())
    renderPage('?period=2026-07&view=review')
    const bar = await screen.findByTestId('payroll-review-compact')
    expect(bar).toHaveTextContent('מועד אחרון: 14/10/2026 18:00')
    expect(screen.queryByTestId('payroll-step-approve')).not.toBeInTheDocument()
    expect(screen.queryByTestId('payroll-sample-mail')).not.toBeInTheDocument()
    expect(screen.queryByTestId('payroll-deadline-input')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('payroll-change-deadline'))
    expect(screen.getByTestId('payroll-deadline-input')).toHaveValue('2026-10-14T18:00')
  })

  it('"שלח סיכום מעודכן" בשורה: אישור מפורש ⇒ רענון ⇒ אישור טיוטה ⇒ שליחה לשורה החדשה בלבד', async () => {
    api.findPayrollReview.mockResolvedValue(
      makeReview({ recipients: [recipient({ digest_current: false })] }),
    )
    api.refreshPayrollReview.mockResolvedValue({ ok: true, revision: 2 })
    api.getPayrollReview.mockResolvedValue(
      makeReview({
        review: { revision: 2, manager_approved: false },
        recipients: [recipient({ recipient_id: 700050, delivery: null })],
      }),
    )
    api.approvePayrollDraft.mockResolvedValue({ ok: true })
    api.distributePayrollReview.mockResolvedValue({
      ok: true,
      processed: [{ recipient_id: 700050, state: 'sent' }],
      skipped: [],
      remaining: 0,
    })
    renderPage('?period=2026-07&view=review&filter=all')
    fireEvent.click(await screen.findByTestId('payroll-send-updated-row'))
    expect(await screen.findByTestId('confirm-dialog-message')).toHaveTextContent('נועה לוי')
    await confirmDialog()
    expect(await screen.findByText('הסיכום המעודכן נשלח')).toBeInTheDocument()
    expect(api.approvePayrollDraft).toHaveBeenCalledWith({
      reviewId: 600001,
      expectedRevision: 2,
      version: 'v1:abc',
    })
    expect(api.distributePayrollReview).toHaveBeenCalledWith(
      expect.objectContaining({ recipientIds: [700050], mode: 'initial', expectedRevision: 2 }),
    )
  })

  it('ביטול באישור ⇒ לא נשלח ולא רוענן', async () => {
    api.findPayrollReview.mockResolvedValue(
      makeReview({ recipients: [recipient({ digest_current: false })] }),
    )
    renderPage('?period=2026-07&view=review&filter=all')
    fireEvent.click(await screen.findByTestId('payroll-send-updated-row'))
    fireEvent.click(await screen.findByTestId('confirm-dialog-cancel'))
    await waitFor(() => expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument())
    expect(api.refreshPayrollReview).not.toHaveBeenCalled()
    expect(api.distributePayrollReview).not.toHaveBeenCalled()
  })
})

describe('מעקב: פעולות שורה', () => {
  it('"אשר לפי תיעוד" רק אחרי המועד; דורש סיבה וראיה; נשמר כ"אושר לפי תיעוד"', async () => {
    api.findPayrollReview.mockResolvedValue(
      makeReview({ review: { deadline_passed: true }, recipients: [recipient()] }),
    )
    api.approvePayrollNoResponse.mockResolvedValue({ ok: true })
    renderPage('?period=2026-07&view=review')
    fireEvent.click(await screen.findByTestId('payroll-approve-by-record'))
    fireEvent.click(await screen.findByTestId('payroll-no-response-submit'))
    expect(await screen.findByTestId('payroll-no-response-errors')).toHaveTextContent(
      'סיבה: שדה חובה',
    )
    expect(api.approvePayrollNoResponse).not.toHaveBeenCalled()
    expect(screen.queryByTestId('payroll-no-response-contactNote')).not.toBeInTheDocument()
    fireEvent.change(screen.getByTestId('payroll-no-response-reason'), {
      target: { value: 'לא ענתה לשתי שיחות' },
    })
    fireEvent.change(screen.getByTestId('payroll-no-response-evidence'), {
      target: { value: 'דוח שעות חתום מהאירוע' },
    })
    fireEvent.click(screen.getByTestId('payroll-no-response-submit'))
    expect(await screen.findByText('אושר לפי תיעוד')).toBeInTheDocument()
    expect(api.approvePayrollNoResponse).toHaveBeenCalledWith({
      recipientId: 700001,
      expectedDigest: 'd1:aaa',
      reason: 'לא ענתה לשתי שיחות',
      evidence: 'דוח שעות חתום מהאירוע',
      contactNote: null,
    })
  })

  it('לפני המועד אין "אשר לפי תיעוד"', async () => {
    api.findPayrollReview.mockResolvedValue(makeReview({ recipients: [recipient()] }))
    renderPage('?period=2026-07&view=review&filter=all')
    await screen.findByTestId('payroll-review-table')
    expect(screen.queryByTestId('payroll-approve-by-record')).not.toBeInTheDocument()
  })

  it('סיכום שלא נשלח לדיילת ⇒ חובה לתעד איך נוצר קשר', async () => {
    api.findPayrollReview.mockResolvedValue(
      makeReview({
        review: { deadline_passed: true },
        recipients: [recipient({ delivery: { attempt_id: 1, state: 'failed' } })],
      }),
    )
    renderPage('?period=2026-07&view=review')
    fireEvent.click(await screen.findByTestId('payroll-approve-by-record'))
    expect(await screen.findByTestId('payroll-no-response-contactNote')).toBeInTheDocument()
  })

  it('כשל משלוח ⇒ סטטוס "השליחה נכשלה" (טקסט + אייקון) ו"שלח שוב" עם הנמען', async () => {
    api.findPayrollReview.mockResolvedValue(
      makeReview({
        recipients: [
          recipient({
            delivery: {
              attempt_id: 800009,
              state: 'failed',
              intended_recipient: 'noa@example.com',
              delivered_recipient: 'ishay1997@gmail.com',
            },
          }),
        ],
      }),
    )
    api.resendPayrollReviewMail.mockResolvedValue({ ok: true })
    renderPage('?period=2026-07&view=review')
    const row = await screen.findByTestId('payroll-recipient-700001')
    const status = within(row).getByTestId('payroll-recipient-status')
    expect(status).toHaveTextContent('השליחה נכשלה')
    expect(status).toHaveAttribute('data-kind', 'error')
    fireEvent.click(within(row).getByTestId('payroll-resend'))
    const resendMessage = await screen.findByTestId('confirm-dialog-message')
    expect(resendMessage).toHaveTextContent('noa@example.com')
    expect(resendMessage).not.toHaveTextContent('ishay1997@gmail.com')
    await confirmDialog()
    await waitFor(() =>
      expect(api.resendPayrollReviewMail).toHaveBeenCalledWith({
        recipientId: 700001,
        priorAttemptId: 800009,
        acknowledgeUnknown: false,
      }),
    )
  })

  it('פנייה פתוחה ⇒ "פתח פנייה" כותב case= לכתובת ופותח את הפאנל', async () => {
    api.findPayrollReview.mockResolvedValue(
      makeReview({ recipients: [recipient({ state: 'objection_open', open_case_id: 500001 })] }),
    )
    api.getPayrollCaseDetail.mockResolvedValue(caseDetail())
    renderPage('?period=2026-07&view=review')
    fireEvent.click(await screen.findByTestId('payroll-open-case'))
    expect(await screen.findByTestId('payroll-case-panel')).toBeInTheDocument()
    expect(searchParams().get('case')).toBe('500001')
  })
})

// ── פאנל פנייה ─────────────────────────────────────────────────────────────────

describe('פאנל פנייה', () => {
  beforeEach(() => {
    api.findPayrollReview.mockResolvedValue(makeReview())
    api.getPayrollCaseDetail.mockResolvedValue(caseDetail())
  })

  it('מציג את מה שהדיילת כתבה (dir=auto); "מה שהיא ראתה" — משמרות ושעות בלי סכום (F11)', async () => {
    renderPage('?period=2026-07&view=review&case=500001')
    const quote = await screen.findByTestId('payroll-case-description')
    expect(quote).toHaveTextContent('עבדתי 7 שעות ולא 6')
    expect(quote).toHaveAttribute('dir', 'auto')
    const rows = screen.getByTestId('payroll-case-rows')
    expect(rows).toHaveTextContent('6')
    expect(rows).not.toHaveTextContent('6.00')
    expect(rows).toHaveTextContent('שעות כעת')
    expect(rows).not.toHaveTextContent('₪')
    expect(rows).not.toHaveTextContent('סכום')
  })

  it('תיקון: סיבה חובה; לפני/אחרי באישור; נשמר ⇒ הטוסט של מדריך ה-UX', async () => {
    api.correctUnclaimedAssignment.mockResolvedValue({ ok: true, correction_id: 1 })
    renderPage('?period=2026-07&view=review&case=500001')
    fireEvent.change(await screen.findByTestId('payroll-correction-value'), {
      target: { value: '7' },
    })
    fireEvent.click(screen.getByTestId('payroll-correction-save'))
    expect(await screen.findByTestId('payroll-correction-errors')).toHaveTextContent(
      'סיבת התיקון: לפחות 5 תווים',
    )
    fireEvent.change(screen.getByTestId('payroll-correction-reason'), {
      target: { value: 'לפי דוח הנוכחות' },
    })
    fireEvent.click(screen.getByTestId('payroll-correction-save'))
    expect(await screen.findByTestId('confirm-dialog-message')).toHaveTextContent(
      'שעות בפועל: מ-6 ל-7',
    )
    await confirmDialog()
    expect(await screen.findByText('התיקון נשמר. יש לשלוח לדיילת סיכום מעודכן')).toBeInTheDocument()
    expect(api.correctUnclaimedAssignment).toHaveBeenCalledWith({
      projectId: 900101,
      hostessId: 900001,
      assignmentNumber: 1,
      field: 'actual_hours',
      expectedValue: 6,
      newValue: 7,
      reason: 'לפי דוח הנוכחות',
      caseId: 500001,
    })
  })

  it('ערך חדש ממולא מראש במה שהדיילת הציעה; התווית "ערך נוכחי" (UX D9)', async () => {
    renderPage('?period=2026-07&view=review&case=500001')
    expect(await screen.findByTestId('payroll-correction-value')).toHaveValue(7)
    expect(screen.getByTestId('payroll-correction-form')).toHaveTextContent('ערך נוכחי')
  })

  it('תיקון נכשל ⇒ הודעה ליד הטופס, והערך שהוקלד נשאר', async () => {
    api.correctUnclaimedAssignment.mockRejectedValue(new PayrollError('STALE_VERSION'))
    renderPage('?period=2026-07&view=review&case=500001')
    fireEvent.change(await screen.findByTestId('payroll-correction-value'), {
      target: { value: '7' },
    })
    fireEvent.change(screen.getByTestId('payroll-correction-reason'), {
      target: { value: 'לפי דוח הנוכחות' },
    })
    fireEvent.click(screen.getByTestId('payroll-correction-save'))
    await confirmDialog()
    expect(await screen.findByTestId('payroll-correction-error')).toHaveTextContent(
      'התיקון לא נשמר והנתונים לא השתנו. הנתונים השתנו. יש לרענן לפני אישור',
    )
    expect(screen.getByTestId('payroll-correction-value')).toHaveValue(7)
  })

  it('דחיית פנייה: סיבה חובה ⇒ resolve(reject)', async () => {
    api.resolvePayrollCase.mockResolvedValue({ ok: true })
    renderPage('?period=2026-07&view=review&case=500001')
    fireEvent.click(await screen.findByTestId('payroll-case-reject'))
    fireEvent.change(await screen.findByTestId('payroll-case-reject-reason'), {
      target: { value: 'השעות תואמות לדוח הנוכחות' },
    })
    fireEvent.click(screen.getByTestId('payroll-case-reject-submit'))
    expect(await screen.findByText('הפנייה נדחתה')).toBeInTheDocument()
    expect(api.resolvePayrollCase).toHaveBeenCalledWith({
      caseId: 500001,
      expectedCaseRevision: 1,
      outcome: 'reject',
      reason: 'השעות תואמות לדוח הנוכחות',
      evidence: undefined,
    })
  })

  it('"טופל מחוץ לדוח" דורש 10 תווים לפחות', async () => {
    api.getPayrollCaseDetail.mockResolvedValue(
      caseDetail({ case: { ...caseDetail().case, category: 'missing_shift' } }),
    )
    renderPage('?period=2026-07&view=review&case=500001')
    expect(screen.queryByTestId('payroll-correction-form')).not.toBeInTheDocument()
    fireEvent.click(await screen.findByTestId('payroll-case-noted'))
    fireEvent.change(await screen.findByTestId('payroll-case-accept_noted-reason'), {
      target: { value: 'קצר' },
    })
    fireEvent.click(screen.getByTestId('payroll-case-accept_noted-submit'))
    expect(await screen.findByTestId('payroll-case-accept_noted-errors')).toHaveTextContent(
      'לפחות 10 תווים',
    )
    expect(api.resolvePayrollCase).not.toHaveBeenCalled()
  })

  it('סגירה עם שינויים לא שמורים ⇒ "לבטל את השינויים?"; "המשך לערוך" משאיר את הטיוטה', async () => {
    renderPage('?period=2026-07&view=review&case=500001')
    fireEvent.change(await screen.findByTestId('payroll-correction-value'), {
      target: { value: '8' },
    })
    fireEvent.click(screen.getByTestId('payroll-case-close'))
    expect(await screen.findByTestId('confirm-dialog-title')).toHaveTextContent('לבטל את השינויים?')
    fireEvent.click(screen.getByTestId('confirm-dialog-cancel'))
    await waitFor(() => expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument())
    expect(screen.getByTestId('payroll-correction-value')).toHaveValue(8)
    expect(searchParams().get('case')).toBe('500001')
  })
})

// ── היסטוריה ופרטי דוח ─────────────────────────────────────────────────────────

describe('היסטוריה', () => {
  it('משתמש צפייה רואה היסטוריה בלבד: בלי לשוניות, בלי טיוטה ובלי כפתורי עריכה', async () => {
    renderPage('?period=2026-07&view=draft', { perm: 'view' })
    expect(await screen.findByTestId('payroll-history')).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(api.getPayrollPreview).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('payroll-history-open-31'))
    await screen.findByTestId('payroll-detail')
    expect(screen.queryByTestId('payroll-start-supplement')).not.toBeInTheDocument()
    expect(screen.getByTestId('payroll-download-file')).toBeInTheDocument()
  })

  it('השלמה מוזחת מתחת למקורי; תג "פניות אחרי ההפקה: N" (F6)', async () => {
    api.listPayrollReports.mockResolvedValue([
      reportItem({ open_post_issue_cases: 2 }),
      reportItem({
        report_id: 35,
        report_kind: 'supplement',
        original_report_id: 31,
        supplement_seq: 1,
      }),
    ])
    renderPage('?view=history')
    expect(await screen.findByTestId('payroll-history-cases-31')).toHaveTextContent(
      'פניות אחרי ההפקה: 2',
    )
    const supplementRow = screen.getByTestId('payroll-history-row-35')
    expect(supplementRow).toHaveTextContent('השלמה 1')
    expect(within(supplementRow).getAllByRole('cell')[0].className).toContain('pr-6')
  })

  it('ריק ⇒ "עדיין לא הופקו דוחות"; שגיאה ⇒ "נסה שוב" ולא ריק', async () => {
    api.listPayrollReports.mockRejectedValueOnce(new PayrollError('NETWORK'))
    renderPage('?view=history')
    expect(await screen.findByTestId('payroll-history-error')).toBeInTheDocument()
    expect(screen.queryByTestId('payroll-history-empty')).not.toBeInTheDocument()
    api.listPayrollReports.mockResolvedValueOnce([])
    fireEvent.click(screen.getByTestId('payroll-history-retry'))
    expect(await screen.findByTestId('payroll-history-empty')).toHaveTextContent(
      'עדיין לא הופקו דוחות',
    )
  })

  it('פרטי דוח: שורות קפואות, ניסיונות עם הנמען המקורי וזמן מלא, פיצוי "—"', async () => {
    renderPage('?view=history&report=31')
    const latest = await screen.findByTestId('payroll-detail-latest')
    expect(latest).toHaveTextContent('אל office@accountant.example · 13/10/2026 14:00')
    expect(screen.getByTestId('payroll-detail')).not.toHaveTextContent('ishay1997@gmail.com')
    // UX D10: ניסיון אחד ⇒ אין רשימת ניסיונות נוספת, ו"נשלח" מופיע פעם אחת.
    expect(screen.queryByTestId('payroll-detail-attempts')).not.toBeInTheDocument()
    expect(screen.getAllByText('נשלח')).toHaveLength(1)
    const lines = screen.getAllByTestId('payroll-detail-line')
    const comp = lines.find((row) => row.textContent.includes('מאיה כהן'))
    expect(within(comp).getAllByRole('cell')[4]).toHaveTextContent('—')
    const work = lines.find((row) => row.textContent.includes('נועה לוי'))
    expect(within(work).getAllByRole('cell')[4]).toHaveTextContent('0.00')
  })

  it('הורדה: הקובץ לא נמצא ⇒ הודעה נפרדת', async () => {
    api.getPayrollFileUrl.mockRejectedValue(new PayrollError('ARTIFACT_NOT_FOUND'))
    renderPage('?view=history&report=31')
    fireEvent.click(await screen.findByTestId('payroll-download-file'))
    expect(await screen.findByTestId('payroll-download-file-error')).toHaveTextContent(
      'הקובץ לא נמצא באחסון',
    )
  })

  it('הורדה: אין הרשאה ⇒ הודעה נפרדת', async () => {
    api.getPayrollFileUrl.mockRejectedValue(new PayrollError('PERMISSION_DENIED'))
    renderPage('?view=history&report=31')
    fireEvent.click(await screen.findByTestId('payroll-download-file'))
    expect(await screen.findByTestId('payroll-download-file-error')).toHaveTextContent(
      'אין לך הרשאה להוריד את הקובץ',
    )
  })

  it('דוח ישן בלי קובץ ⇒ ההסבר + "הורד שחזור" שבונה מהשורות הקפואות', async () => {
    api.getPayrollReportDetail.mockResolvedValue(
      reportDetail({
        report: { legacy: true, artifact_available: false },
        artifact: { key: null, filename: null, reference_missing: true },
        attempts: [],
      }),
    )
    downloadReconstruction.mockResolvedValue({})
    renderPage('?view=history&report=31')
    expect(await screen.findByTestId('payroll-detail-no-file')).toHaveTextContent(
      'הקובץ המקורי לא נשמר. מוצגים נתוני הדוח כפי שהופק',
    )
    expect(screen.queryByTestId('payroll-download-file')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('payroll-download-reconstruction'))
    await waitFor(() => expect(downloadReconstruction).toHaveBeenCalled())
    const [report, lines] = downloadReconstruction.mock.calls[0]
    // צורת השרת: פרטי הדוח מתוך `report` (עם `line_count`), השורות מהרמה העליונה.
    expect(report.report_id).toBe(31)
    expect(report.line_count).toBe(2)
    expect(lines).toHaveLength(2)
  })

  it('פניות אחרי ההפקה מוצגות ונפתחות בפאנל', async () => {
    api.getPayrollReportDetail.mockResolvedValue(
      reportDetail({
        post_issue_cases: [
          {
            case_id: 500009,
            hostess_name: 'נועה לוי',
            category: 'hours',
            description: 'חסרה לי שעה',
            suggested_value: null,
            status: 'open',
            created_at: '2026-10-14T08:00:00.000Z',
            resolution_reason: null,
          },
        ],
      }),
    )
    renderPage('?view=history&report=31')
    expect(await screen.findByTestId('payroll-detail-cases')).toHaveTextContent('חסרה לי שעה')
    api.getPayrollCaseDetail.mockResolvedValue(
      caseDetail({ case: { ...caseDetail().case, case_id: 500009, phase: 'post_issue' } }),
    )
    fireEvent.click(screen.getByTestId('payroll-detail-case-500009'))
    expect(await screen.findByTestId('payroll-case-close-post')).toHaveTextContent('סגור פנייה')
    expect(screen.queryByTestId('payroll-correction-form')).not.toBeInTheDocument()
  })
})

describe('עימוד הטיוטה', () => {
  it('120 שורות ⇒ 50 בעמוד; ההורדה מקבלת את כל ה-120', async () => {
    const lines = Array.from({ length: 120 }, (_, i) =>
      previewLine({ hostess_id: 910000 + i, assignment_number: i + 1, hostess_name: `דיילת ${i}` }),
    )
    api.getPayrollPreview.mockResolvedValue(makePreview({ lines }))
    renderPage()
    expect(await screen.findAllByTestId('payroll-draft-row')).toHaveLength(50)
    fireEvent.click(screen.getByTestId('payroll-draft-pager-next'))
    await waitFor(() => expect(searchParams().get('page')).toBe('2'))
    fireEvent.click(screen.getByTestId('payroll-download-draft'))
    await waitFor(() => expect(downloadDraft).toHaveBeenCalled())
    expect(downloadDraft.mock.calls[0][0].lines).toHaveLength(120)
  })
})
