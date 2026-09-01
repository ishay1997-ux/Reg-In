// בדיקות לשונית סגירת-האירוע (משטח 5 · צעד 3.5) — חמשת המצבים + מצב-העייפות-בשם +
// סדר-השמירה (העלאה ⇒ RPC ⇒ מיילים; מחיקת-הקובץ בכשל-RPC) + השבתת-שלב-השליחה (שומר
// ה-double-log) + בקרת השליחה-החוזרת + הישרדות-הטיוטה מעל דיאלוג-שינוי-התכולה (㉔).
// ה-API והדיאלוג ממוקקים כולם — הבדיקות מוכיחות את החוזה, לא את הסביבה.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { ToastProvider } from '@/components/ToastProvider'
import ClosingTab from './ClosingTab'
import {
  getProjectAssignments,
  getProjectQuoteMeta,
  getProjectChanges,
  closeProjectOperationally,
  markFeedbackSurveySent,
  mintFeedbackToken,
} from './api'
import {
  uploadReportFile,
  deleteReportFile,
  downloadReportAsBase64,
  getCustomerMailContact,
  getCustomerPreferences,
} from './closingApi'
import { sendEmail, getEmailTemplate, getLastSuccessfulSend } from '@/api/email'

vi.mock('./api', () => ({
  getProjectAssignments: vi.fn(),
  getProjectQuoteMeta: vi.fn(),
  getProjectChanges: vi.fn(),
  closeProjectOperationally: vi.fn(),
  markFeedbackSurveySent: vi.fn(),
  mintFeedbackToken: vi.fn(),
}))

vi.mock('./closingApi', () => ({
  // הקבועים אמיתיים-בערכם (2MB · שלושת סוגי-הקובץ) — הבדיקות מאמתות את הטקסט שנגזר מהם.
  REPORT_MAX_BYTES: 2 * 1024 * 1024,
  REPORT_ALLOWED_MIME: ['application/pdf', 'image/jpeg', 'image/png'],
  uploadReportFile: vi.fn(),
  deleteReportFile: vi.fn(),
  downloadReportAsBase64: vi.fn(),
  getReportSignedUrl: vi.fn(),
  getCustomerMailContact: vi.fn(),
  getCustomerPreferences: vi.fn(),
  fileToBase64: vi.fn(async () => 'QUJD'),
}))

vi.mock('@/api/email', () => ({
  sendEmail: vi.fn(),
  getEmailTemplate: vi.fn(),
  getLastSuccessfulSend: vi.fn(),
}))

// דיאלוג-שינוי-התכולה האמיתי נבדק בקובץ שלו; כאן stub שחושף פתיחה/שמירה — מספיק כדי
// להוכיח שהטיוטה שורדת את הפתיחה ושהלשונית קוראת-מחדש את נתוני-השינויים אחרי שמירה.
vi.mock('./ScopeChangeDialog', () => ({
  default: ({ open, onSaved, onOpenChange }) =>
    open ? (
      <div data-testid="scope-dialog-stub">
        <button type="button" data-testid="scope-stub-save" onClick={() => onSaved?.()}>
          stub-save
        </button>
        <button type="button" data-testid="scope-stub-close" onClick={() => onOpenChange(false)}>
          stub-close
        </button>
      </div>
    ) : null,
}))

const SURVEY_TEMPLATE = `שלום [שם_איש_קשר],
סקר: [לינק_לשאלון_שביעות_רצון] על '[שם_פרויקט]'.`

function baseProject(overrides) {
  return {
    project_id: 7,
    quote_id: 21,
    customer_id: 47,
    event_name: 'יום העיר חדרה',
    customer_name: 'עיריית חדרה',
    project_status: 'event_finished',
    final_event_date: '2026-08-08',
    final_start_time: '16:00:00',
    final_end_time: '22:00:00',
    feedback_status: 'not_sent',
    operationally_closed_at: null,
    operationally_closed_by: null,
    summary_report_url: null,
    actual_hours: null,
    actual_guests: null,
    ...overrides,
  }
}

function assignmentsFixture() {
  return [
    {
      project_id: 7,
      hostess_id: 11,
      assignment_number: 2,
      assignment_status: 'finally_approved',
      hourly_rate_snapshot: 42,
      is_shift_lead: true,
      attendance_status: null,
      lateness_level: null,
      no_show_reason: null,
      actual_hours: 0,
      hostesses: { hostess_id: 11, full_name: 'מיכל אברהם', city: 'חיפה' },
    },
    {
      project_id: 7,
      hostess_id: 12,
      assignment_number: 1,
      assignment_status: 'finally_approved',
      hourly_rate_snapshot: 46,
      is_shift_lead: false,
      attendance_status: null,
      lateness_level: null,
      no_show_reason: null,
      actual_hours: 0,
      hostesses: { hostess_id: 12, full_name: 'תמר גולן', city: 'נתניה' },
    },
  ]
}

function renderTab(props = {}) {
  return render(
    <ToastProvider>
      <ClosingTab
        project={props.project ?? baseProject()}
        overviewRow={null}
        canEdit={props.canEdit ?? true}
        canReadHostesses={props.canReadHostesses ?? true}
        onSaved={props.onSaved}
      />
    </ToastProvider>,
  )
}

function pdfFile(name = 'סיכום_יום_העיר_חדרה.pdf', size = 1024) {
  const file = new File(['x'.repeat(16)], name, { type: 'application/pdf' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

// ממלא את הטופס עד "מוכן לשליחה": שני שדות-האירוע, קובץ, ונוכחות+איכות לשתי השורות.
async function fillValidForm() {
  fireEvent.change(await screen.findByTestId('closing-hours'), { target: { value: '6.5' } })
  fireEvent.change(screen.getByTestId('closing-guests'), { target: { value: '180' } })
  fireEvent.change(screen.getByTestId('closing-file-input'), {
    target: { files: [pdfFile()] },
  })
  for (const id of [11, 12]) {
    fireEvent.change(screen.getByTestId(`closing-attendance-${id}`), {
      target: { value: 'הגיעה' },
    })
    fireEvent.click(screen.getByTestId(`closing-quality-${id}-מצוינת`))
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  getProjectAssignments.mockResolvedValue(assignmentsFixture())
  getProjectQuoteMeta.mockResolvedValue({ estimated_guests: 200 })
  getProjectChanges.mockResolvedValue([])
  getCustomerMailContact.mockResolvedValue({
    contact_name: 'שרית מזרחי',
    email: 'sarit@hadera.test',
  })
  getCustomerPreferences.mockResolvedValue([])
  // אדוות-מ8 ①: הקישור שבמייל-הסקר נגזר מטוקן שנטבע ברגע-השליחה, לא מפרמטר-Google-Forms.
  mintFeedbackToken.mockResolvedValue('tok-abc')
  getEmailTemplate.mockResolvedValue(SURVEY_TEMPLATE)
  uploadReportFile.mockResolvedValue({ path: '7/1700000000_report.pdf' })
  deleteReportFile.mockResolvedValue()
  downloadReportAsBase64.mockResolvedValue('QUJD')
  closeProjectOperationally.mockResolvedValue({
    customer_id: 47,
    customer_name: 'עיריית חדרה',
    event_name: 'יום העיר חדרה',
    report_path: '7/1700000000_report.pdf',
    feedback_status: 'not_sent',
    operationally_closed_at: '2026-08-19T12:00:00Z',
    preferences_saved: true,
    preferences_written: 2,
  })
  markFeedbackSurveySent.mockResolvedValue(true)
  sendEmail.mockResolvedValue({ logFailed: false })
  getLastSuccessfulSend.mockResolvedValue(null)
})

describe('המצב המאוכלס — הטבלה, שבע האפשרויות, הבאנר המתוקן', () => {
  it('שתי שורות, פקד-נוכחות שטוח בן 7 אפשרויות, שורת-סיכום דרך התעריף הקפוא', async () => {
    renderTab()
    expect(await screen.findByTestId('closing-row-11')).toBeInTheDocument()
    expect(screen.getByTestId('closing-row-12')).toBeInTheDocument()
    // 7 אפשרויות + שורת "בחרי נוכחות…" = 8 — הסדר נעול ב-ATTENDANCE_OPTIONS.
    const options = within(screen.getByTestId('closing-attendance-11')).getAllByRole('option')
    expect(options).toHaveLength(8)
    expect(options[1]).toHaveTextContent('הגיעה')
    expect(options[7]).toHaveTextContent('לא הגיעה — הבריזה')
    // אחראית-משמרת — תג-מידע בלבד.
    expect(
      within(screen.getByTestId('closing-row-11')).getByText('אחראית משמרת'),
    ).toBeInTheDocument()
  })

  it('🔴 הבאנר נוקב בעלות בלבד — סיפת-המוקאפ על "הרווח הסופי" הוסרה (AR-6)', async () => {
    renderTab()
    const banner = await screen.findByTestId('closing-banner')
    expect(banner).toHaveTextContent('הלחיצה הזאת סוגרת את האירוע ואי-אפשר לבטל אותה.')
    expect(banner).toHaveTextContent('העלות בפועל קופאת')
    expect(banner).not.toHaveTextContent('הרווח הסופי')
    expect(banner).toHaveTextContent('שרית מזרחי, עיריית חדרה')
  })

  it('עזר-הקובץ נגזר מהקבוע — 2MB, לא ה-10MB שבכרטיס (superseded)', async () => {
    renderTab()
    const tab = await screen.findByTestId('closing-tab')
    expect(screen.getByText('2MB')).toBeInTheDocument()
    expect(tab.textContent).not.toContain('10MB')
    expect(tab.textContent).toContain('הקובץ נשלח ללקוח כקובץ מצורף')
  })
})

describe('שיקוף-הכפייה של no_show (ט4-א)', () => {
  it('"לא הגיעה" ⇒ שעות 0 ומושבתות, פקדי-איכות מושבתים עם המשפט המנומק', async () => {
    renderTab()
    await screen.findByTestId('closing-row-11')
    fireEvent.change(screen.getByTestId('closing-hours'), { target: { value: '6.5' } })
    fireEvent.change(screen.getByTestId('closing-attendance-11'), {
      target: { value: 'לא הגיעה — הבריזה' },
    })
    const hours = screen.getByTestId('closing-hours-11')
    expect(hours).toBeDisabled()
    expect(hours).toHaveValue('0')
    expect(screen.getByTestId('closing-quality-11-מצוינת')).toBeDisabled()
    expect(screen.getByTestId('closing-quality-11-לא לשלוח שוב')).toBeDisabled()
    expect(screen.getByTestId('closing-noshow-note-11')).toHaveTextContent(
      'לא ניתן לסמן איכות — לא הגיעה, ואי-אפשר לשפוט מי שלא ראית.',
    )
    // עלות השורה ⇒ 0.00 (אפור), והסיכום סופר רק את השורה השנייה.
    expect(screen.getByTestId('closing-cost-11')).toHaveTextContent('0.00')
  })

  it('🔴 דריסה ידנית ואז "לא הגיעה" ⇒ השדה המושבת מציג 0, לא את הדריסה הישנה', async () => {
    // no_show קודם לדריסה (rowEffectiveHours) — תצוגה של ערך-הדריסה בעוד ה-payload
    // שולח 0 הייתה מסך שמשקר על מה שיישמר.
    renderTab()
    await screen.findByTestId('closing-row-11')
    fireEvent.change(screen.getByTestId('closing-hours'), { target: { value: '6.5' } })
    fireEvent.change(screen.getByTestId('closing-hours-11'), { target: { value: '5' } })
    expect(screen.getByTestId('closing-hours-11')).toHaveValue('5')
    fireEvent.change(screen.getByTestId('closing-attendance-11'), {
      target: { value: 'לא הגיעה — הבריזה' },
    })
    const hours = screen.getByTestId('closing-hours-11')
    expect(hours).toBeDisabled()
    expect(hours).toHaveValue('0')
    // עלות השורה מתאפסת יחד עם התצוגה — אותו חישוב בדיוק.
    expect(screen.getByTestId('closing-cost-11')).toHaveTextContent('0.00')
  })
})

describe('שמירה חסומה — הכפתור נשאר, מכובה, עם משפט-סיכום אחד', () => {
  it('טופס ריק ⇒ הכפתור על המסך ומושבת, ולצידו משפט "לא ניתן לסגור: חסרים…" יחיד', async () => {
    renderTab()
    const save = await screen.findByTestId('closing-save')
    expect(save).toBeInTheDocument()
    expect(save).toBeDisabled()
    const summary = screen.getByTestId('closing-summary')
    expect(summary.textContent).toMatch(/לא ניתן לסגור: חסרים/)
    // משפט אחד — לא שבע הודעות (ספירת המופעים של "לא ניתן לסגור").
    expect(screen.getAllByText(/לא ניתן לסגור/)).toHaveLength(1)
  })

  it('טופס מלא ⇒ הכפתור נדלק והמשפט מתחלף בהערת-הרגע', async () => {
    renderTab()
    await screen.findByTestId('closing-row-11')
    await fillValidForm()
    await waitFor(() => expect(screen.getByTestId('closing-save')).toBeEnabled())
    expect(screen.queryByTestId('closing-summary')).not.toBeInTheDocument()
    expect(screen.getByText('מרגע זה הפרויקט עובר לטיפול מנהלת הכספים.')).toBeInTheDocument()
  })
})

describe('אירוע ללא דיילות אינו קורה (הכרעת-מציאות ישי 20/08/2026) — אין מסלול-סגירה למערך ריק', () => {
  it('אפס דיילות ⇒ אין הודעת-ריק ייעודית, והכפתור נשאר מושבת גם עם שלושת השדות מלאים (המסך מסכים עם השרת)', async () => {
    getProjectAssignments.mockResolvedValue([])
    renderTab()
    await screen.findByTestId('closing-hours')
    expect(screen.queryByTestId('closing-legal-empty')).not.toBeInTheDocument()
    fireEvent.change(screen.getByTestId('closing-hours'), { target: { value: '6.5' } })
    fireEvent.change(screen.getByTestId('closing-guests'), { target: { value: '0' } })
    fireEvent.change(screen.getByTestId('closing-file-input'), { target: { files: [pdfFile()] } })
    await waitFor(() => expect(screen.getByTestId('closing-save')).toBeDisabled())
  })
})

describe('כשל-טעינה — הודעה מפורשת + נסי שוב, לעולם לא רשימה ריקה', () => {
  it('הקריאה נכשלת ⇒ שגיאה+retry; לחיצה טוענת מחדש ומציגה את השורות', async () => {
    getProjectAssignments.mockRejectedValueOnce(new Error('network down'))
    renderTab()
    expect(await screen.findByTestId('closing-load-error')).toBeInTheDocument()
    expect(screen.queryByTestId('closing-legal-empty')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'נסי שוב' }))
    expect(await screen.findByTestId('closing-row-11')).toBeInTheDocument()
  })
})

describe('סדר-השמירה: העלאה ⇒ RPC ⇒ (אחרי commit) מיילים ⇒ mark — ומחיקה בכשל-RPC', () => {
  it('הסדר נאכף, שני מיילים יוצאים (project_report ואז project), ו-mark רק אחרי הסקר', async () => {
    const onSaved = vi.fn()
    renderTab({ onSaved })
    await screen.findByTestId('closing-row-11')
    await fillValidForm()
    await waitFor(() => expect(screen.getByTestId('closing-save')).toBeEnabled())
    fireEvent.click(screen.getByTestId('closing-save'))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    // סדר-הקריאות: העלאה לפני ה-RPC, וה-RPC לפני כל שליחה.
    const uploadOrder = uploadReportFile.mock.invocationCallOrder[0]
    const rpcOrder = closeProjectOperationally.mock.invocationCallOrder[0]
    const firstSend = sendEmail.mock.invocationCallOrder[0]
    const markOrder = markFeedbackSurveySent.mock.invocationCallOrder[0]
    expect(uploadOrder).toBeLessThan(rpcOrder)
    expect(rpcOrder).toBeLessThan(firstSend)
    expect(firstSend).toBeLessThan(markOrder)
    // שני מיילים: הדוח (עם מצורף) ואז הסקר (בלי).
    expect(sendEmail).toHaveBeenCalledTimes(2)
    expect(sendEmail.mock.calls[0][0].entityType).toBe('project_report')
    expect(sendEmail.mock.calls[1][0].entityType).toBe('project')
    expect(deleteReportFile).not.toHaveBeenCalled()
    // 🔴 אדוות-מ8 ①: הטוקן נטבע (get-or-create) **לפני** ששליחת-הסקר יצאה, וקישור-הטוקן
    // — לא Google Forms — הוא מה שנחת בגוף-המייל שהלקוח יקבל.
    expect(mintFeedbackToken).toHaveBeenCalledWith(7)
    expect(mintFeedbackToken.mock.invocationCallOrder[0]).toBeLessThan(
      sendEmail.mock.invocationCallOrder[1],
    )
    expect(sendEmail.mock.calls[1][0].payload.body).toContain('/feedback/tok-abc')
    expect(sendEmail.mock.calls[1][0].payload.body).not.toContain('forms.gle')
    // ה-payload של ה-RPC נושא את חוזה-השדות — כולל assignment_number של השורה הקובעת.
    const rpcArgs = closeProjectOperationally.mock.calls[0][1]
    expect(rpcArgs.reportPath).toBe('7/1700000000_report.pdf')
    expect(rpcArgs.rows.find((r) => r.hostess_id === 11).assignment_number).toBe(2)
  })

  it('🔴 ה-RPC נכשל ⇒ הקובץ שהועלה נמחק, ושום מייל לא יוצא', async () => {
    closeProjectOperationally.mockRejectedValue(new Error('boom'))
    renderTab()
    await screen.findByTestId('closing-row-11')
    await fillValidForm()
    await waitFor(() => expect(screen.getByTestId('closing-save')).toBeEnabled())
    fireEvent.click(screen.getByTestId('closing-save'))
    await waitFor(() => expect(deleteReportFile).toHaveBeenCalledWith('7/1700000000_report.pdf'))
    expect(sendEmail).not.toHaveBeenCalled()
    expect(await screen.findByTestId('closing-save-error')).toHaveTextContent('boom')
  })

  it('מייל-הסקר נכשל ⇒ הסגירה עומדת, הכשל בשם, mark לא נקרא, ובקרת השליחה-החוזרת מופיעה', async () => {
    sendEmail.mockImplementation(async ({ entityType }) => {
      if (entityType === 'project') throw new Error('mailer exploded')
      return { logFailed: false }
    })
    const onSaved = vi.fn()
    renderTab({ onSaved })
    await screen.findByTestId('closing-row-11')
    await fillValidForm()
    await waitFor(() => expect(screen.getByTestId('closing-save')).toBeEnabled())
    fireEvent.click(screen.getByTestId('closing-save'))

    const failure = await screen.findByTestId('closing-mail-failure')
    expect(failure).toHaveTextContent('מייל הסקר לא יצא')
    expect(markFeedbackSurveySent).not.toHaveBeenCalled()
    // אין רענון-עמוד — ההודעה בשם הייתה נמחקת; המסך הנעול מרונדר מקומית.
    expect(onSaved).not.toHaveBeenCalled()
    expect(screen.getByTestId('closing-tab-closed')).toBeInTheDocument()
    expect(screen.getByTestId('closing-resend')).toBeInTheDocument()
  })

  // 🔴 המצב שנולד באדוות-מ8 ①: הטביעה היא תלות-רשת חדשה **לפני** השליחה. הכשל שלה חייב
  // להיראות כמו כשל-מייל ולא כמו הצלחה — אחרת מייל היה יוצא בלי קישור, או שהמסך היה מסמן
  // `sent` על סקר שאיש לא קיבל.
  it('🔴 טביעת-הטוקן נכשלה ⇒ מייל-הסקר כלל לא נשלח, הכשל בשם, ו-mark לא נקרא', async () => {
    mintFeedbackToken.mockRejectedValue(new Error('הנפקת קישור-המשוב נכשלה.'))
    const onSaved = vi.fn()
    renderTab({ onSaved })
    await screen.findByTestId('closing-row-11')
    await fillValidForm()
    await waitFor(() => expect(screen.getByTestId('closing-save')).toBeEnabled())
    fireEvent.click(screen.getByTestId('closing-save'))

    const failure = await screen.findByTestId('closing-mail-failure')
    expect(failure).toHaveTextContent('מייל הסקר לא יצא')
    // רק מייל-הדוח יצא; מייל-הסקר נעצר לפני השליחה — לא נשלח עם קישור ריק.
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail.mock.calls[0][0].entityType).toBe('project_report')
    expect(markFeedbackSurveySent).not.toHaveBeenCalled()
    expect(screen.getByTestId('closing-resend')).toBeInTheDocument()
  })
})

describe('מצב-העייפות (staleness, as-built ③) — מצב-בשם, לא כשל גנרי', () => {
  it('P0001 של "רשימת-הסגירה אינה מעודכנת" ⇒ פאנל-בשם עם הודעת-השרת והאמת על אובדן-הטיוטה', async () => {
    closeProjectOperationally.mockRejectedValue(
      new Error(
        'רשימת-הסגירה אינה מעודכנת: הזימון של תמר גולן השתנה מאז שהמסך נטען. רענני את המסך ונסי שוב.',
      ),
    )
    renderTab()
    await screen.findByTestId('closing-row-11')
    await fillValidForm()
    await waitFor(() => expect(screen.getByTestId('closing-save')).toBeEnabled())
    fireEvent.click(screen.getByTestId('closing-save'))

    const stale = await screen.findByTestId('closing-stale')
    expect(stale).toHaveTextContent('הזימון של תמר גולן השתנה')
    // היושר: הרענון מוחק את מה שהוקלד — נאמר מראש.
    expect(stale).toHaveTextContent('מה שהוקלד בלשונית יימחק')
    expect(screen.getByTestId('closing-stale-refresh')).toBeInTheDocument()
    // לא הוצג ככשל גנרי.
    expect(screen.queryByTestId('closing-save-error')).not.toBeInTheDocument()
    // והקובץ שהועלה נמחק — הכשל קרה אחרי ההעלאה.
    expect(deleteReportFile).toHaveBeenCalled()
  })
})

describe('השבתת-שלב-השליחה — שומר ה-double-log של email_log', () => {
  it('בזמן השליחה הכפתור מושבת ומציג "שומר ושולח…" עד סוף השלב כולו', async () => {
    let releaseSend
    sendEmail.mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseSend = () => resolve({ logFailed: false })
        }),
    )
    renderTab({ onSaved: vi.fn() })
    await screen.findByTestId('closing-row-11')
    await fillValidForm()
    await waitFor(() => expect(screen.getByTestId('closing-save')).toBeEnabled())
    fireEvent.click(screen.getByTestId('closing-save'))

    // ה-RPC כבר עבר, המייל תלוי-ועומד — הבקרה חייבת להיות מושבתת בדיוק עכשיו.
    await waitFor(() => expect(screen.getByTestId('closing-save')).toBeDisabled())
    expect(screen.getByTestId('closing-save')).toHaveTextContent('שומר ושולח…')
    releaseSend()
  })
})

describe('שליחה חוזרת — רק על not_sent אחרי שחותמת-הסגירה קיימת', () => {
  const closedProject = (feedback) =>
    baseProject({
      project_status: 'awaiting_invoice',
      operationally_closed_at: '2026-08-19T12:00:00Z',
      operationally_closed_by: 'dana@regin.test',
      summary_report_url: '7/1700000000_report.pdf',
      actual_hours: 6.5,
      actual_guests: 180,
      feedback_status: feedback,
    })

  it('not_sent אחרי חותמת ⇒ הבקרה מוצגת עם משפט-המצב המדויק', async () => {
    renderTab({ project: closedProject('not_sent') })
    expect(await screen.findByTestId('closing-resend-strip')).toHaveTextContent(
      'הסגירה נשמרה. מייל הסקר לא יצא — אפשר לשלוח שוב.',
    )
    expect(screen.getByTestId('closing-resend')).toBeInTheDocument()
  })

  it('feedback_status=sent ⇒ אין בקרה', async () => {
    renderTab({ project: closedProject('sent') })
    expect(await screen.findByTestId('closing-tab-closed')).toBeInTheDocument()
    expect(screen.queryByTestId('closing-resend')).not.toBeInTheDocument()
  })

  it('לחיצה: הדוח כבר ביומן ⇒ רק הסקר נשלח, ואז mark — והבקרה נעלמת', async () => {
    getLastSuccessfulSend.mockResolvedValue({ recipient: 'sarit@hadera.test' })
    const onSaved = vi.fn()
    renderTab({ project: closedProject('not_sent'), onSaved })
    fireEvent.click(await screen.findByTestId('closing-resend'))
    await waitFor(() => expect(markFeedbackSurveySent).toHaveBeenCalledWith(7))
    // הדוח לא נשלח שוב — email_log הוא מקור-האמת ל"כבר נשלח".
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail.mock.calls[0][0].entityType).toBe('project')
    // גם בשליחה-החוזרת עוברים דרך הטביעה ולא דרך קישור שנשמר בזיכרון: ה-RPC הוא
    // get-or-create, ולכן הלקוח מקבל **אותו** קישור ולא קישור שני שפוסל את הראשון.
    expect(mintFeedbackToken).toHaveBeenCalledWith(7)
    expect(sendEmail.mock.calls[0][0].payload.body).toContain('/feedback/tok-abc')
    await waitFor(() => expect(screen.queryByTestId('closing-resend')).not.toBeInTheDocument())
    expect(onSaved).toHaveBeenCalled()
  })

  it('הדוח מעולם לא נשלח (יומן ריק) ⇒ נשלח קודם הדוח מתוך הורדה מה-bucket, ואז הסקר', async () => {
    getLastSuccessfulSend.mockResolvedValue(null)
    renderTab({ project: closedProject('not_sent') })
    fireEvent.click(await screen.findByTestId('closing-resend'))
    await waitFor(() => expect(sendEmail).toHaveBeenCalledTimes(2))
    expect(downloadReportAsBase64).toHaveBeenCalledWith('7/1700000000_report.pdf')
    expect(sendEmail.mock.calls[0][0].entityType).toBe('project_report')
  })
})

describe('㉔ — דיאלוג-שינוי-התכולה מעל הטיוטה (B7 · as-built ⑥)', () => {
  it('הטיוטה שורדת פתיחה/שמירה/סגירה, והלשונית קוראת-מחדש רק את נתוני-השינויים שלה', async () => {
    renderTab()
    await screen.findByTestId('closing-row-11')
    // מקלידים טיוטה.
    fireEvent.change(screen.getByTestId('closing-hours'), { target: { value: '6.5' } })
    fireEvent.change(screen.getByTestId(`closing-attendance-11`), { target: { value: 'הגיעה' } })
    expect(getProjectChanges).toHaveBeenCalledTimes(1)

    // פותחים את הדיאלוג, שומרים בו, סוגרים.
    fireEvent.click(screen.getByTestId('closing-change-link'))
    expect(await screen.findByTestId('scope-dialog-stub')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('scope-stub-save'))
    await waitFor(() => expect(getProjectChanges).toHaveBeenCalledTimes(2))
    fireEvent.click(screen.getByTestId('scope-stub-close'))

    // הטיוטה עדיין שם — שעות-האירוע והנוכחות שנבחרה.
    expect(screen.getByTestId('closing-hours')).toHaveValue('6.5')
    expect(screen.getByTestId('closing-attendance-11')).toHaveValue('הגיעה')
  })

  it('משפט-ההשלכה של הרישום-המיידי מוצג במקטע עצמו', async () => {
    renderTab()
    await screen.findByTestId('closing-changes-section')
    expect(screen.getByTestId('closing-change-note')).toHaveTextContent('נרשם במסד מיד')
  })
})

describe('קריאה-בלבד — הלשונית אינה משטח-פעולה למי שאינו מפעיל אותה (מה-ייחשב-עובד #6)', () => {
  it('canEdit בלי דיילות (מנהלת לוגיסטיקה) ⇒ אין "שמור ושלח" ואין פקדים, ומצב-ריק מודע-הרשאות', async () => {
    getProjectAssignments.mockResolvedValue([])
    renderTab({ canEdit: true, canReadHostesses: false })
    await screen.findByTestId('closing-tab')
    expect(screen.queryByTestId('closing-save')).not.toBeInTheDocument()
    expect(screen.getByTestId('closing-no-permission')).toBeInTheDocument()
    // הריק-מודע-ההרשאות במקום טבלה ריקה שקטה — הדגל מכריע, לא אורך-הרשימה.
    expect(screen.queryByTestId('closing-legal-empty')).not.toBeInTheDocument()
  })

  it('תפקיד-צפייה (canEdit=false) ⇒ שדות מושבתים ואין כפתור-שמירה כלל', async () => {
    renderTab({ canEdit: false, canReadHostesses: true })
    await screen.findByTestId('closing-row-11')
    expect(screen.queryByTestId('closing-save')).not.toBeInTheDocument()
    expect(screen.getByTestId('closing-hours')).toBeDisabled()
    expect(screen.getByTestId('closing-attendance-11')).toBeDisabled()
  })
})
