// בדיקות הדף האישי לבדיקת שעות (`/payroll-review/:token`). שתי קריאות הרשת ממוקקות; הלוגיקה
// הטהורה של הטופס אמיתית (importActual). אין מגע במסד.
// נועל: כל מצבי הדף (טעינה · לא בתוקף · כשל טעינה · מוכן · אושר · פנייה נשמרה · אחרי הפקה ·
// פנייה פתוחה · ולידציה · הגבלת קצב · סיכום עודכן · כשל שמירה עם "נסי שוב") · מזהה בקשה
// שנשמר בין ניסיונות · הטקסט שהוקלד נשמר בכשל · אין בדף בנק/ת"ז/מזהים · יעדי מגע · לשון נקבה.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PublicPayrollReviewPage from './PublicPayrollReviewPage'
import { fetchPayrollReview, respondToPayrollReview, newRequestId } from './payrollReviewPublicApi'

vi.mock('@/supabaseClient', () => ({ supabase: {} }))
vi.mock('./payrollReviewPublicApi', async (importActual) => {
  const actual = await importActual()
  return {
    ...actual,
    fetchPayrollReview: vi.fn(),
    respondToPayrollReview: vi.fn(),
    newRequestId: vi.fn(),
  }
})

const SUMMARY = {
  state: 'ok',
  first_name: 'נועה',
  period: '2026-07-01',
  kind: 'regular',
  supplement_seq: null,
  deadline: '2026-08-05T15:00:00Z',
  phase: 'pre_issue',
  digest: 'd1:abc',
  total_hours: 6.5,
  compensation_hours: 0,
  rows: [
    {
      key: 'r1',
      event_date: '2026-07-07',
      event_name: 'כנס חדשנות',
      line_basis: 'actual',
      hours: 6.5,
      zero_reason: null,
    },
    {
      key: 'r2',
      event_date: '2026-07-20',
      event_name: 'ערב השקה',
      line_basis: 'cancellation_compensation',
      hours: 0,
      zero_reason: 'force_majeure',
    },
  ],
  decision: { state: 'awaiting', at: null },
  open_case: null,
  can_approve: true,
  can_object: true,
}

function renderPage(token = 'tok-aaa') {
  return render(
    <MemoryRouter initialEntries={[`/payroll-review/${token}`]}>
      <Routes>
        <Route path="/payroll-review/:token" element={<PublicPayrollReviewPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

let idCounter = 0
beforeEach(() => {
  vi.clearAllMocks()
  idCounter = 0
  newRequestId.mockImplementation(() => `req-${++idCounter}`)
})

async function openReady(summary = SUMMARY) {
  fetchPayrollReview.mockResolvedValue(summary)
  renderPage()
  await screen.findByTestId('review-ready')
}

async function fillObjection({ description = 'עבדתי 8 שעות ולא 6.5' } = {}) {
  fireEvent.click(screen.getByTestId('review-object'))
  fireEvent.click(screen.getByTestId('review-shift-select-r1'))
  fireEvent.click(screen.getByTestId('review-category-hours'))
  fireEvent.change(screen.getByTestId('review-description'), { target: { value: description } })
  fireEvent.change(screen.getByTestId('review-suggested'), { target: { value: '8' } })
}

describe('טעינה ומצבי קישור', () => {
  it('שלד בלי טקסט מבטיח, ואז הסיכום: שם, חודש, מועד אחרון, משמרות וסה"כ', async () => {
    fetchPayrollReview.mockResolvedValue(SUMMARY)
    renderPage()
    expect(screen.getByTestId('review-loading')).toBeInTheDocument()
    expect(screen.queryByText(/השעות שלך/)).toBeNull()

    await screen.findByTestId('review-ready')
    expect(fetchPayrollReview).toHaveBeenCalledWith('tok-aaa')
    expect(screen.getByText('שלום, נועה')).toBeInTheDocument()
    expect(screen.getByTestId('review-period')).toHaveTextContent('סיכום שעות לבדיקה · יולי 2026')
    expect(screen.getByTestId('review-deadline')).toHaveTextContent(
      'אפשר להשיב עד 05/08/2026 18:00',
    )
    const dates = screen.getAllByTestId('review-shift-date').map((el) => el.textContent)
    expect(dates).toEqual(['07/07/2026 · שלישי', '20/07/2026 · שני'])
    // F11 (ישי 14.10, "רק משמרות ושעות"): שעות לכל משמרת וסה"כ שעות — בלי שום סכום ובלי ₪.
    expect(screen.getAllByTestId('review-shift-hours')[0]).toHaveTextContent('6.5 שעות')
    expect(screen.getByTestId('review-total-hours')).toHaveTextContent('סה"כ שעות בחודש6.5')
    expect(document.body.textContent).not.toContain('₪')
    for (const money of ['תעריף', 'בונוס', 'נסיעות', 'שכר', 'תשלום:']) {
      expect(document.body.textContent).not.toContain(money)
    }
  })

  it('ביטול בכוח עליון ⇒ שורה אחת "בוטל — לא נספר בשעות", בלי "לתשלום" ובלי הסבר כפול', async () => {
    await openReady()
    const card = screen.getAllByTestId('review-shift')[1]
    expect(within(card).getByTestId('review-shift-hours')).toHaveTextContent('בוטל — לא נספר בשעות')
    expect(card.textContent).not.toContain('לתשלום')
    expect(card.textContent).not.toContain('כוח עליון')
    expect(card.textContent).not.toContain('₪')
  })

  it('פיצוי ביטול עם שעות ⇒ "פיצוי ביטול — X שעות" עם הסבר; שעות הפיצוי נספרות בנפרד', async () => {
    await openReady({
      ...SUMMARY,
      compensation_hours: 3,
      rows: [SUMMARY.rows[0], { ...SUMMARY.rows[1], hours: 3, zero_reason: null }],
    })
    const card = screen.getAllByTestId('review-shift')[1]
    expect(within(card).getByTestId('review-shift-hours')).toHaveTextContent('פיצוי ביטול — 3 שעות')
    expect(card).toHaveTextContent('נרשמו לך שעות פיצוי')
    expect(screen.getByTestId('review-total-hours')).toHaveTextContent('סה"כ שעות בחודש6.5')
    expect(screen.getByTestId('review-total-hours')).toHaveTextContent('שעות פיצוי ביטול3')
  })

  it('השלמה ⇒ "השלמה N" בכותרת', async () => {
    await openReady({ ...SUMMARY, kind: 'supplement', supplement_seq: 2 })
    expect(screen.getByTestId('review-period')).toHaveTextContent('יולי 2026 · השלמה 2')
  })

  it('{state:"invalid"} ⇒ "הקישור הזה כבר לא בתוקף", בלי "נסי שוב" ובלי שום נתון', async () => {
    fetchPayrollReview.mockResolvedValue({ state: 'invalid' })
    renderPage()
    await screen.findByTestId('review-invalid')
    expect(
      screen.getByText('הקישור הזה כבר לא בתוקף. לסיכום עדכני אפשר לפנות למנהלת'),
    ).toBeVisible()
    expect(screen.queryByTestId('review-retry')).toBeNull()
  })

  it('כשל רשת בטעינה ⇒ "נסי שוב" (לא "לא בתוקף"), והלחיצה טוענת מחדש', async () => {
    fetchPayrollReview.mockRejectedValueOnce(new Error('network'))
    renderPage()
    await screen.findByTestId('review-load-failed')
    expect(screen.queryByTestId('review-invalid')).toBeNull()

    fetchPayrollReview.mockResolvedValueOnce(SUMMARY)
    fireEvent.click(screen.getByTestId('review-retry'))
    await screen.findByTestId('review-ready')
    expect(fetchPayrollReview).toHaveBeenCalledTimes(2)
  })

  it('הגבלת קצב בטעינה ⇒ הודעת המתנה עם "נסי שוב" (לא "לא בתוקף")', async () => {
    fetchPayrollReview.mockResolvedValueOnce({ state: 'rate_limited' })
    renderPage()
    await screen.findByTestId('review-rate-limited')
    expect(screen.queryByTestId('review-invalid')).toBeNull()
    fetchPayrollReview.mockResolvedValueOnce(SUMMARY)
    fireEvent.click(screen.getByTestId('review-retry'))
    await screen.findByTestId('review-ready')
  })

  it('הדף לא מציג בנק, ת"ז, מזהים או סכום כולל — גם כשהשרת היה שולח אותם בטעות', async () => {
    await openReady({
      ...SUMMARY,
      bank_account: '123456',
      id_number: '012345678',
      review_id: 991,
      hostess_id: 900001,
      total: 722.5,
      rows: SUMMARY.rows.map((row) => ({
        ...row,
        project_id: 900111,
        line_total: 377.5,
        rate: 55,
        bonus: 40,
        travel: 20,
      })),
    })
    const text = document.body.textContent
    for (const secret of [
      '123456',
      '012345678',
      '991',
      '900001',
      '900111',
      'd1:abc',
      '377.5',
      '722.5',
      '₪',
    ]) {
      expect(text).not.toContain(secret)
    }
  })
})

describe('אישור', () => {
  it('"הנתונים נכונים" ⇒ POST מפורש עם הטוקן, הגרסה ומזהה בקשה; "האישור נשמר" וטעינה מחדש', async () => {
    await openReady()
    respondToPayrollReview.mockResolvedValue({ state: 'approved' })
    fetchPayrollReview.mockResolvedValue({
      ...SUMMARY,
      decision: { state: 'hostess_approved', at: '2026-08-01T07:00:00Z' },
      can_approve: false,
    })

    fireEvent.click(screen.getByTestId('review-approve'))
    await screen.findByTestId('review-outcome-approved')
    expect(respondToPayrollReview).toHaveBeenCalledWith({
      token: 'tok-aaa',
      requestId: 'req-1',
      digest: 'd1:abc',
      action: 'approve',
      caseInput: null,
    })
    expect(screen.getByText('האישור נשמר. אפשר לסגור את הדף')).toBeVisible()
    await waitFor(() =>
      expect(screen.getByTestId('review-decision')).toHaveTextContent(
        'אישרת את הנתונים · 01/08/2026 10:00',
      ),
    )
    // אחרי אישור — "יש טעות" עדיין זמין לפני ההפקה.
    expect(screen.queryByTestId('review-approve')).toBeNull()
    expect(screen.getByTestId('review-object')).toBeInTheDocument()
  })

  // סקירת UX מקומית 14/10, פריט 8: גם אם השרת עדיין מחזיר can_approve=true אחרי שאישרה.
  it('אחרי שאישרה, "הנתונים נכונים" לא מוצג גם כש-can_approve עדיין true', async () => {
    await openReady({
      ...SUMMARY,
      decision: { state: 'hostess_approved', at: '2026-08-01T07:00:00Z' },
      can_approve: true,
    })
    expect(screen.queryByTestId('review-approve')).toBeNull()
    expect(screen.getByTestId('review-object')).toBeInTheDocument()
  })

  it('פתיחת "יש טעות" מעבירה את הפוקוס לבחירת המשמרת הראשונה', async () => {
    await openReady()
    fireEvent.click(screen.getByTestId('review-object'))
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByTestId('review-shift-select-r1')),
    )
  })

  it('פתיחת הדף לבדה לא שולחת אף תשובה (GET בלבד)', async () => {
    await openReady()
    expect(respondToPayrollReview).not.toHaveBeenCalled()
  })

  it('כשל רשת ⇒ "האישור לא נשמר. נסי שוב"; ניסיון חוזר עם אותו מזהה בקשה', async () => {
    await openReady()
    respondToPayrollReview.mockRejectedValueOnce(new Error('network'))
    fireEvent.click(screen.getByTestId('review-approve'))
    await screen.findByTestId('review-outcome-approve_failed')
    expect(screen.getByRole('alert')).toHaveTextContent('האישור לא נשמר. נסי שוב')

    respondToPayrollReview.mockResolvedValueOnce({ state: 'approved' })
    fireEvent.click(screen.getByTestId('review-approve'))
    await screen.findByTestId('review-outcome-approved')
    const ids = respondToPayrollReview.mock.calls.map(([args]) => args.requestId)
    expect(ids).toEqual(['req-1', 'req-1'])
  })

  it('פנייה פתוחה ⇒ "יש לך פנייה פתוחה"', async () => {
    await openReady()
    respondToPayrollReview.mockResolvedValue({ state: 'case_open' })
    fireEvent.click(screen.getByTestId('review-approve'))
    expect(await screen.findByTestId('review-outcome-case_open')).toHaveTextContent(
      'יש לך פנייה פתוחה על הסיכום הזה',
    )
  })

  it('סיכום שהתעדכן ⇒ "טעני את הדף מחדש" עם כפתור שטוען מחדש', async () => {
    await openReady()
    respondToPayrollReview.mockResolvedValue({ state: 'stale' })
    fireEvent.click(screen.getByTestId('review-approve'))
    await screen.findByTestId('review-outcome-stale')
    fireEvent.click(screen.getByTestId('review-reload'))
    await waitFor(() => expect(fetchPayrollReview).toHaveBeenCalledTimes(2))
  })

  it('הגבלת קצב ⇒ הודעה בתוך הדף, בלי "נשמר"', async () => {
    await openReady()
    respondToPayrollReview.mockResolvedValue({ state: 'rate_limited' })
    fireEvent.click(screen.getByTestId('review-approve'))
    await screen.findByTestId('review-outcome-rate_limited')
    expect(screen.queryByText(/נשמר/)).toBeNull()
  })

  it('הקישור בוטל בזמן שהדף פתוח ⇒ מסך "לא בתוקף"', async () => {
    await openReady()
    respondToPayrollReview.mockResolvedValue({ state: 'invalid' })
    fireEvent.click(screen.getByTestId('review-approve'))
    await screen.findByTestId('review-invalid')
  })

  it('אחרי הפקה ⇒ אישור מחזיר "הדוח כבר הופק"', async () => {
    await openReady()
    respondToPayrollReview.mockResolvedValue({ state: 'issued' })
    fireEvent.click(screen.getByTestId('review-approve'))
    expect(await screen.findByTestId('review-outcome-issued')).toHaveTextContent(
      'הדוח לחודש הזה כבר הופק',
    )
  })
})

describe('החלטה על פנייה — הסיבה מגיעה לדיילת', () => {
  it('דחייה ⇒ "הפנייה שלך טופלה: <הסיבה>"', async () => {
    await openReady({
      ...SUMMARY,
      decision: { state: 'manager_resolved', at: '2026-08-02T07:00:00Z' },
      last_case: {
        category: 'hours',
        status: 'resolved_rejected',
        resolution_reason: 'לפי דוח הנוכחות 6 שעות',
        resolved_at: '2026-08-02T07:00:00Z',
      },
    })
    expect(screen.getByTestId('review-last-case')).toHaveTextContent(
      'הפנייה שלך טופלה: לפי דוח הנוכחות 6 שעות',
    )
    // השורה הכללית לא מופיעה בנוסף
    expect(screen.queryByTestId('review-decision')).toBeNull()
  })

  it('טופל מחוץ לדוח ⇒ "הפנייה שלך התקבלה: <הסיבה>"', async () => {
    const base = { category: 'hours', resolved_at: '2026-08-02T07:00:00Z' }
    await openReady({
      ...SUMMARY,
      last_case: { ...base, status: 'resolved_noted', resolution_reason: 'יטופל בדוח ההשלמה' },
    })
    expect(screen.getByTestId('review-last-case')).toHaveTextContent(
      'הפנייה שלך התקבלה: יטופל בדוח ההשלמה',
    )
  })

  it('תוקן ⇒ "הפנייה שלך התקבלה" בלי סיבה', async () => {
    await openReady({
      ...SUMMARY,
      last_case: {
        category: 'hours',
        status: 'resolved_accepted',
        resolution_reason: 'תוקן לפי דוח נוכחות',
        resolved_at: '2026-08-02T07:00:00Z',
      },
    })
    expect(screen.getByTestId('review-last-case')).toHaveTextContent(/^הפנייה שלך התקבלה$/)
  })

  it('פנייה פתוחה חדשה גוברת על ההחלטה הקודמת', async () => {
    await openReady({
      ...SUMMARY,
      decision: { state: 'objection_open', at: '2026-08-03T07:00:00Z' },
      open_case: { category: 'hours', created_at: '2026-08-03T07:00:00Z' },
      last_case: {
        category: 'hours',
        status: 'resolved_rejected',
        resolution_reason: 'סיבה ישנה',
        resolved_at: '2026-08-02T07:00:00Z',
      },
    })
    expect(screen.queryByTestId('review-last-case')).toBeNull()
    expect(screen.getByTestId('review-decision')).toHaveTextContent('הפנייה שלך בטיפול')
  })
})

describe('"יש טעות"', () => {
  it('שליחה ריקה ⇒ סיכום שגיאות שמקבל פוקוס, ושגיאה ליד כל שדה שחוזרת על שמו; אין קריאה לשרת', async () => {
    await openReady()
    fireEvent.click(screen.getByTestId('review-object'))
    // שורת הנחיה אחת, בלי "לחצי לסימון" על כל כרטיס (סקירת UX 1)
    expect(document.body.textContent).not.toContain('לחצי לסימון')
    expect(screen.getAllByText(/סמני את המשמרת/)).toHaveLength(1)
    fireEvent.click(screen.getByTestId('review-submit-objection'))

    const summary = await screen.findByTestId('review-error-summary')
    await waitFor(() => expect(summary).toHaveFocus())
    // שגיאת בחירת המשמרת — פעם אחת, ליד הבחירה, לא גם בסיכום
    expect(screen.getByTestId('review-error-rows')).toHaveTextContent('משמרת:')
    expect(screen.getAllByText(/משמרת: יש לסמן/)).toHaveLength(1)
    expect(summary).not.toHaveTextContent('משמרת: יש לסמן')
    expect(screen.getByTestId('review-error-category')).toHaveTextContent('סוג הטעות:')
    expect(screen.getByTestId('review-error-description')).toHaveTextContent('מה לא נכון:')
    expect(respondToPayrollReview).not.toHaveBeenCalled()
  })

  it('רק המשמרת חסרה ⇒ אין סיכום, והפוקוס עובר לשגיאה שליד הבחירה', async () => {
    await openReady()
    fireEvent.click(screen.getByTestId('review-object'))
    fireEvent.click(screen.getByTestId('review-category-hours'))
    fireEvent.change(screen.getByTestId('review-description'), { target: { value: 'x' } })
    fireEvent.click(screen.getByTestId('review-submit-objection'))
    const rowsError = await screen.findByTestId('review-error-rows')
    await waitFor(() => expect(rowsError).toHaveFocus())
    expect(screen.queryByTestId('review-error-summary')).toBeNull()
  })

  it('מספר מוצע לא תקין ⇒ שגיאה ליד השדה', async () => {
    await openReady()
    await fillObjection()
    fireEvent.change(screen.getByTestId('review-suggested'), { target: { value: '-3' } })
    fireEvent.click(screen.getByTestId('review-submit-objection'))
    expect(await screen.findByTestId('review-error-suggested_value')).toHaveTextContent(
      'מספר השעות הנכון: מספר בין 0 ל-24',
    )
    expect(respondToPayrollReview).not.toHaveBeenCalled()
  })

  it('פנייה תקינה ⇒ נשלחת עם מפתח השורה בלבד, "הפנייה נשמרה לטיפול"', async () => {
    await openReady()
    await fillObjection()
    expect(screen.getByTestId('review-shift-select-r1')).toHaveAttribute('aria-pressed', 'true')
    respondToPayrollReview.mockResolvedValue({ state: 'saved', case_saved: true })
    fetchPayrollReview.mockResolvedValue({
      ...SUMMARY,
      decision: { state: 'objection_open', at: '2026-08-01T07:00:00Z' },
      open_case: { category: 'hours', created_at: '2026-08-01T07:00:00Z' },
      can_approve: false,
      can_object: false,
    })

    fireEvent.click(screen.getByTestId('review-submit-objection'))
    await screen.findByTestId('review-outcome-saved')
    expect(respondToPayrollReview.mock.calls[0][0]).toEqual({
      token: 'tok-aaa',
      requestId: 'req-1',
      digest: 'd1:abc',
      action: 'objection',
      caseInput: {
        category: 'hours',
        row_keys: ['r1'],
        missing_shift: false,
        description: 'עבדתי 8 שעות ולא 6.5',
        suggested_value: 8,
      },
    })
    expect(screen.queryByTestId('review-objection-form')).toBeNull()
    await waitFor(() =>
      expect(screen.getByTestId('review-decision')).toHaveTextContent(
        'הפנייה שלך בטיפול (נשלחה 01/08/2026 10:00)',
      ),
    )
  })

  it('כשל שמירה ⇒ "הפנייה לא נשמרה. נסי שוב. מה שכתבת נשמר כאן", הטקסט נשאר, ואותו מזהה בניסיון החוזר', async () => {
    await openReady()
    await fillObjection({ description: 'טקסט ארוך שהקלדתי בטלפון' })
    respondToPayrollReview.mockRejectedValueOnce(new Error('network'))
    fireEvent.click(screen.getByTestId('review-submit-objection'))

    await screen.findByTestId('review-outcome-objection_failed')
    expect(screen.getByRole('alert')).toHaveTextContent('מה שכתבת נשמר כאן')
    // וגם ליד כפתור השליחה, שם הדיילת נמצאת אחרי הלחיצה
    expect(screen.getByTestId('review-objection-failed-inline')).toHaveTextContent(
      'הפנייה לא נשמרה',
    )
    expect(screen.getByTestId('review-description')).toHaveValue('טקסט ארוך שהקלדתי בטלפון')
    expect(screen.getByTestId('review-shift-select-r1')).toHaveAttribute('aria-pressed', 'true')

    respondToPayrollReview.mockResolvedValueOnce({ state: 'saved', case_saved: true })
    fireEvent.click(screen.getByTestId('review-submit-objection'))
    await screen.findByTestId('review-outcome-saved')
    const ids = respondToPayrollReview.mock.calls.map(([args]) => args.requestId)
    expect(ids).toEqual(['req-1', 'req-1'])
  })

  it('השרת דוחה שדה (validation) ⇒ השגיאה ליד השדה, הטופס והטקסט נשארים', async () => {
    await openReady()
    await fillObjection()
    respondToPayrollReview.mockResolvedValue({ state: 'validation', field: 'description' })
    fireEvent.click(screen.getByTestId('review-submit-objection'))
    expect(await screen.findByTestId('review-error-description')).toHaveTextContent('מה לא נכון:')
    expect(screen.getByTestId('review-description')).toHaveValue('עבדתי 8 שעות ולא 6.5')
  })

  it('קטגוריה "משמרת חסרה" בלי לסמן משמרת ⇒ תקין', async () => {
    await openReady()
    fireEvent.click(screen.getByTestId('review-object'))
    fireEvent.click(screen.getByTestId('review-category-missing_shift'))
    fireEvent.change(screen.getByTestId('review-description'), {
      target: { value: 'עבדתי ב-12/07 ואין את זה' },
    })
    respondToPayrollReview.mockResolvedValue({ state: 'saved', case_saved: true })
    fireEvent.click(screen.getByTestId('review-submit-objection'))
    await screen.findByTestId('review-outcome-saved')
    expect(respondToPayrollReview.mock.calls[0][0].caseInput).toMatchObject({
      row_keys: [],
      missing_shift: true,
    })
  })

  it('אחרי הפקה ⇒ "הדוח כבר הופק", בלי אישור, ופנייה נשמרת כפנייה אחרי הפקה', async () => {
    await openReady({ ...SUMMARY, phase: 'post_issue', can_approve: false, can_object: true })
    expect(screen.getByTestId('review-issued-note')).toHaveTextContent('הדוח לחודש הזה כבר הופק')
    expect(screen.queryByTestId('review-approve')).toBeNull()
    await fillObjection()
    respondToPayrollReview.mockResolvedValue({ state: 'issued_case_saved' })
    fireEvent.click(screen.getByTestId('review-submit-objection'))
    expect(await screen.findByTestId('review-outcome-issued_case_saved')).toHaveTextContent(
      'הפנייה נשמרה לטיפול. הדוח כבר הופק',
    )
  })

  it('"מספר השעות הנכון" מופיע רק בפנייה על שעות, ולא נשלח בקטגוריה אחרת', async () => {
    await openReady()
    await fillObjection()
    fireEvent.click(screen.getByTestId('review-category-not_worked'))
    expect(screen.queryByTestId('review-suggested')).toBeNull()
    respondToPayrollReview.mockResolvedValue({ state: 'saved', case_saved: true })
    fireEvent.click(screen.getByTestId('review-submit-objection'))
    await screen.findByTestId('review-outcome-saved')
    expect(respondToPayrollReview.mock.calls[0][0].caseInput).toMatchObject({
      category: 'not_worked',
      suggested_value: null,
    })
  })

  it('"חזרה לסיכום" סוגר את הטופס בלי לשלוח', async () => {
    await openReady()
    fireEvent.click(screen.getByTestId('review-object'))
    fireEvent.click(screen.getByTestId('review-cancel-objection'))
    expect(screen.queryByTestId('review-objection-form')).toBeNull()
    expect(respondToPayrollReview).not.toHaveBeenCalled()
  })
})

describe('נגישות ולשון', () => {
  it('כל כפתור ובחירה בדף נושאים min-h-11 (44px)', async () => {
    await openReady()
    for (const id of ['review-approve', 'review-object']) {
      expect(screen.getByTestId(id).className).toMatch(/min-h-11/)
    }
    fireEvent.click(screen.getByTestId('review-object'))
    fireEvent.click(screen.getByTestId('review-category-hours'))
    for (const id of [
      'review-shift-select-r1',
      'review-submit-objection',
      'review-cancel-objection',
      'review-suggested',
    ]) {
      expect(screen.getByTestId(id).className).toMatch(/min-h-11/)
    }
  })

  it('לשון נקבה: "נסי", "שלחי", "סמני" — ולא צורות זכר', async () => {
    await openReady()
    fireEvent.click(screen.getByTestId('review-object'))
    const text = document.body.textContent
    expect(text).toContain('שלחי פנייה')
    expect(text).toContain('סמני את המשמרת')
    for (const masculine of ['שלח פנייה', 'סמן את', 'נסה שוב', 'לחץ ']) {
      expect(text).not.toContain(masculine)
    }
  })
})
