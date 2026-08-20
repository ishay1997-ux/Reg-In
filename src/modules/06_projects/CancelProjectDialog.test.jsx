// בדיקות דיאלוג ביטול-הפרויקט (משטח 7, צעד 3.7) — ה-API ממוקק, params ממוקקים,
// והשעון מוזרק דרך prop-הבדיקה `now`. מה שנעול: המדרג נבנה מ-params (מוכח בהחלפת-ערכים) ·
// שני המונים בשורת-✉ · הווריאנט חסר-השמות · הנוסח הנעול של סיבה-ריקה · תוויות-הפוטר ·
// המיילים נשלחים פר-דיילת רק אחרי הצלחת ה-RPC · ובהצלחה הדיאלוג נסגר והדיווח בטוסטים
// (שורת "הצלחה" של הכרטיס המאושר — אין פאנל-סיום ואין כפתור שלישי).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { ToastProvider } from '@/components/ToastProvider'
import CancelProjectDialog from './CancelProjectDialog'
import { cancelProject, getProjectAssignments } from './api'
import {
  getCancellationEmailTemplate,
  getCancellationParams,
  getHostessEmails,
} from './cancellationApi'
import { sendEmail } from '@/api/email'

vi.mock('./api', () => ({
  cancelProject: vi.fn(),
  getProjectAssignments: vi.fn(),
}))
vi.mock('./cancellationApi', () => ({
  getCancellationParams: vi.fn(),
  getCancellationEmailTemplate: vi.fn(),
  getHostessEmails: vi.fn(),
}))
vi.mock('@/api/email', () => ({ sendEmail: vi.fn() }))

const NOW = '2026-08-19T12:00:00Z'

function project(overrides) {
  return {
    project_id: 103,
    quote_id: 30,
    event_name: 'ערב לקוחות VIP',
    customer_name: 'מדיטק פתרונות בע"מ',
    final_event_date: '2026-09-11', // 23 ימים אחרי NOW — רחוק מ-72 שעות ⇒ 0%
    final_start_time: '19:00',
    final_end_time: '23:00',
    project_status: 'in_progress',
    required_hostess_count: 4,
    ...overrides,
  }
}

function assignmentRow(hostessId, assignmentNumber, status, fullName) {
  return {
    project_id: 103,
    hostess_id: hostessId,
    assignment_number: assignmentNumber,
    assignment_status: status,
    hostesses: fullName === undefined ? undefined : { hostess_id: hostessId, full_name: fullName },
  }
}

// 2 מאושרות-סופית + 2 חיות-אחרות; שורת declined היסטורית של יעל מוכיחה שהקיפול רץ.
function assignmentsFixture() {
  return [
    assignmentRow(1, 1, 'declined', 'יעל דוד'),
    assignmentRow(1, 2, 'finally_approved', 'יעל דוד'),
    assignmentRow(2, 1, 'finally_approved', 'סיון נחום'),
    assignmentRow(3, 1, 'pending', 'מאיה כהן'),
    assignmentRow(4, 1, 'confirmed_available', 'נועה שגיא'),
  ]
}

const PARAMS = {
  שעות_פיצוי_ביטול_מלא: '24',
  שעות_פיצוי_ביטול_חלקי: '72',
  אחוז_פיצוי_ביטול_חלקי: '50',
}

function rpcResult() {
  return {
    project_id: 103,
    event_name: 'ערב לקוחות VIP',
    cancel_type: 'customer',
    cancelled_at: '2026-08-19T12:00:05Z',
    released_rows: 4,
    finally_approved_count: 2,
    other_live_count: 2,
    can_read_hostesses: true,
    hostesses_to_notify: [
      { hostess_id: 1, full_name: 'יעל דוד', was_finally_approved: true },
      { hostess_id: 2, full_name: 'סיון נחום', was_finally_approved: true },
      { hostess_id: 3, full_name: 'מאיה כהן', was_finally_approved: false },
      { hostess_id: 4, full_name: 'נועה שגיא', was_finally_approved: false },
    ],
    logistics_untouched: true,
  }
}

// הטוסטים חיים ב-ToastProvider שמעל הדיאלוג (כמו ב-App) — בלעדיו useToast זורק.
function renderDialogRaw(props = {}) {
  return render(
    <ToastProvider>
      <CancelProjectDialog
        project={project(props.project)}
        open
        onOpenChange={props.onOpenChange ?? vi.fn()}
        onCancelled={props.onCancelled ?? vi.fn()}
        now={props.now ?? NOW}
      />
    </ToastProvider>,
  )
}

async function renderDialog(props = {}) {
  renderDialogRaw(props)
  // הטעינה הסתיימה כשהבאנר על המסך (הכלל החוסם: אין דיאלוג עם באנר חלקי).
  return screen.findByTestId('cancel-banner')
}

beforeEach(() => {
  vi.clearAllMocks()
  getProjectAssignments.mockResolvedValue(assignmentsFixture())
  getCancellationParams.mockResolvedValue({ ...PARAMS })
  getCancellationEmailTemplate.mockResolvedValue(
    'שלום [שם_דיילת], האירוע [שם_פרויקט] בתאריך [תאריך_אירוע] בוטל.',
  )
  getHostessEmails.mockResolvedValue(
    new Map([
      [1, { hostess_id: 1, full_name: 'יעל דוד', email: 'yael@regin-demo.co.il' }],
      [2, { hostess_id: 2, full_name: 'סיון נחום', email: 'sivan@regin-demo.co.il' }],
      [3, { hostess_id: 3, full_name: 'מאיה כהן', email: 'maya@regin-demo.co.il' }],
      [4, { hostess_id: 4, full_name: 'נועה שגיא', email: 'noa@regin-demo.co.il' }],
    ]),
  )
  cancelProject.mockResolvedValue(rpcResult())
  sendEmail.mockResolvedValue({ logFailed: false })
})

describe('CancelProjectDialog — הבאנר', () => {
  it('שורת-✉ מציגה את שני המונים — המאושרות וגם החיות-האחרות (as-built ②)', async () => {
    await renderDialog()
    const row = screen.getByTestId('cancel-released-row')
    expect(row.textContent).toContain('2 דיילות שאושרו סופית ישוחררו ויקבלו מייל "האירוע בוטל"')
    expect(row.textContent).toContain('2 דיילות נוספות שטרם השיבו ישוחררו ויקבלו את אותו מייל')
    expect(row.textContent).toContain('יעל דוד · סיון נחום')
    expect(row.textContent).toContain('אין בחירה מי — כולן משוחררות יחד.')
  })

  it('שמות לא-קריאים ⇒ הווריאנט חסר-השמות: מונים בלי שמות (as-built ③)', async () => {
    getProjectAssignments.mockResolvedValue([
      assignmentRow(1, 1, 'finally_approved', null),
      assignmentRow(2, 1, 'finally_approved', null),
      assignmentRow(3, 1, 'pending', null),
    ])
    await renderDialog()
    const row = screen.getByTestId('cancel-released-row')
    expect(row.textContent).toContain('2 דיילות שאושרו סופית')
    expect(row.textContent).toContain('דיילת נוספת אחת שטרם השיבה')
    expect(row.textContent).not.toContain('יעל')
  })

  it('אפס משובצות ⇒ "אין דיילות משובצות", והשורה נשארת (היעדר-השלכה הוא מידע)', async () => {
    getProjectAssignments.mockResolvedValue([])
    await renderDialog()
    expect(screen.getByTestId('cancel-released-row').textContent).toBe(
      'אין דיילות משובצות — אין מה לשחרר ואין פיצוי.',
    )
  })

  it('המדרג נבנה מערכי params — 24/72/50 מופיעים במשפט', async () => {
    await renderDialog()
    const ladder = screen.getByTestId('cancel-ladder').textContent
    expect(ladder).toContain('יותר מ-72 שעות מזכה ב-0%')
    expect(ladder).toContain('24–72 שעות מזכות ב-50%')
    expect(ladder).toContain('פחות מ-24 שעות מזכות ב-100%')
  })

  it('params אחרים ⇒ המדרג עוקב אחריהם — ההוכחה שאין 24/72/50 קשיחים במשפט', async () => {
    getCancellationParams.mockResolvedValue({
      שעות_פיצוי_ביטול_מלא: '12',
      שעות_פיצוי_ביטול_חלקי: '48',
      אחוז_פיצוי_ביטול_חלקי: '60',
    })
    await renderDialog()
    const ladder = screen.getByTestId('cancel-ladder').textContent
    expect(ladder).toContain('יותר מ-48 שעות מזכה ב-0%')
    expect(ladder).toContain('12–48 שעות מזכות ב-60%')
    expect(ladder).not.toContain('72')
  })

  it('23 ימים לפני ⇒ פיצוי 0% ושורת-הזמן מציגה את מספר-הימים', async () => {
    await renderDialog()
    const banner = screen.getByTestId('cancel-banner')
    expect(banner.textContent).toContain('ביטול')
    expect(banner.textContent).toContain('23')
    expect(banner.textContent).toContain('פיצוי לדיילות: 0%')
  })
})

describe('CancelProjectDialog — כשל-טעינה (הצורה הנעולה של §3.7)', () => {
  it('שתי השורות — הנעולה + הודעת-העוטף — ו"נסי שוב"; הכפתור ההרסני מושבת', async () => {
    getCancellationParams.mockRejectedValue(new Error('שגיאה בטעינת הגדרות הפיצוי.'))
    renderDialogRaw()
    const box = await screen.findByTestId('cancel-load-error')
    // השורה הראשונה נעולה; השורה השנייה נוקבת במה שחסר (ההודעה העברית של העוטף).
    expect(within(box).getByText('לא ניתן לטעון את הנתונים.')).toBeInTheDocument()
    expect(within(box).getByText('שגיאה בטעינת הגדרות הפיצוי.')).toBeInTheDocument()
    expect(within(box).getByRole('button', { name: 'נסי שוב' })).toBeInTheDocument()
    expect(screen.getByTestId('cancel-confirm')).toBeDisabled()
  })

  it('מדרג חסר ב-params ⇒ אותו מצב-שגיאה, עם שורת-פירוט משלו (הכלל החוסם §④)', async () => {
    getCancellationParams.mockResolvedValue({ שעות_פיצוי_ביטול_מלא: '24' })
    renderDialogRaw()
    const box = await screen.findByTestId('cancel-load-error')
    expect(within(box).getByText('לא ניתן לטעון את הנתונים.')).toBeInTheDocument()
    expect(within(box).getByText('מדרג-הפיצוי חסר בהגדרות המערכת.')).toBeInTheDocument()
  })
})

describe('CancelProjectDialog — שלושת הסוגים והוולידציה', () => {
  it('שורת-ההסבר של כוח-עליון (⑪) נוכחת — האפשרות היחידה שלוקחת כסף מהדיילות', async () => {
    await renderDialog()
    expect(
      screen.getByText('מאפס את הפיצוי לדיילות — 0% תמיד, גם בביטול של יום לפני.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/מלחמה · אסון טבע · צו ממשלתי/)).toBeInTheDocument()
  })

  it('סיבה ריקה — הכפתור ההרסני מושבת והנוסח הנעול מוצג, בכל שלושת הסוגים', async () => {
    await renderDialog()
    // בלי סוג ובלי סיבה — מושבת, בלי הודעת-שגיאה עדיין (הטופס נקי).
    expect(screen.getByTestId('cancel-confirm')).toBeDisabled()

    for (const type of ['customer', 'force_majeure', 'other']) {
      fireEvent.click(screen.getByTestId(`cancel-type-${type}`))
      expect(screen.getByTestId('cancel-confirm')).toBeDisabled()
      // 🔒 עותק מילולי של הנוסח הנעול (§3.7), הזהה-בייט ל-raise של cancel_project
      // (supabase/migrations/20260814142440_module6_rpcs_writes.sql).
      expect(screen.getByTestId('cancel-reason-error').textContent).toBe(
        'חובה לכתוב סיבה. היא נשמרת בכרטיס והיא ההסבר היחיד שיישאר אחרי הביטול.',
      )
    }

    fireEvent.change(screen.getByTestId('cancel-reason'), {
      target: { value: 'הלקוח דחה את האירוע לרבעון הבא' },
    })
    expect(screen.getByTestId('cancel-confirm')).not.toBeDisabled()
  })

  it('כוח-עליון נבחר ⇒ שורת-הפיצוי מתחלפת לנימוק-האיפוס', async () => {
    await renderDialog()
    fireEvent.click(screen.getByTestId('cancel-type-force_majeure'))
    expect(screen.getByTestId('cancel-banner').textContent).toContain(
      'כוח עליון מאפס פיצוי תמיד, ללא תלות במרחק-הזמן.',
    )
  })

  it('הפוטר: "בטל את הפרויקט" (מסגרת אדומה, לא מילוי) ואז "חזרה" — לעולם לא "ביטול"', async () => {
    await renderDialog()
    const confirm = screen.getByTestId('cancel-confirm')
    const back = screen.getByTestId('cancel-back')
    expect(confirm.textContent).toBe('בטל את הפרויקט')
    expect(back.textContent).toBe('חזרה')
    // הדפוס השלילי היחיד ב-src/ (RowAction): מסגרת אדומה על רקע בהיר, בלי מילוי מלא.
    expect(confirm.className).toContain('border-red-200')
    expect(confirm.className).toContain('bg-red-50')
    expect(confirm.className).not.toContain('bg-red-600')
  })
})

describe('CancelProjectDialog — האישור, המיילים והסירובים', () => {
  async function fillAndConfirm() {
    fireEvent.click(screen.getByTestId('cancel-type-customer'))
    fireEvent.change(screen.getByTestId('cancel-reason'), {
      target: { value: 'הלקוח דחה את האירוע לרבעון הבא' },
    })
    fireEvent.click(screen.getByTestId('cancel-confirm'))
  }

  it('הצלחה: המיילים אחרי ה-RPC ובסדר הזה, הדיאלוג נסגר, והדיווח בטוסטים (AR-5 + הכרטיס)', async () => {
    const onOpenChange = vi.fn()
    const onCancelled = vi.fn()
    await renderDialog({ onOpenChange, onCancelled })
    await fillAndConfirm()

    // שורת "הצלחה" של הכרטיס: הדיאלוג נסגר, והאב מרענן את הכרטיס (onCancelled ⇒ refresh).
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(onCancelled).toHaveBeenCalledWith(expect.objectContaining({ released_rows: 4 }))
    expect(cancelProject).toHaveBeenCalledWith(103, 'customer', 'הלקוח דחה את האירוע לרבעון הבא')
    // ארבע נמענות ברשימת ה-RPC ⇒ בדיוק ארבע שליחות, לפי סדר הרשימה — ורק אחרי ה-RPC.
    expect(sendEmail).toHaveBeenCalledTimes(4)
    expect(cancelProject.mock.invocationCallOrder[0]).toBeLessThan(
      sendEmail.mock.invocationCallOrder[0],
    )
    expect(sendEmail.mock.calls[0][0]).toMatchObject({
      entityType: 'project',
      entityId: 103,
      templateName: 'תבנית_מייל_אירוע_בוטל',
    })
    expect(sendEmail.mock.calls[0][0].payload.to).toBe('yael@regin-demo.co.il')
    // הדיווח בטוסטים: הצלחת-הביטול + מצבור המיילים שנשלחו; אין טוסט-שגיאה ואין פאנל-סיום.
    const successToasts = await screen.findAllByTestId('toast-success')
    const successText = successToasts.map((t) => t.textContent).join(' | ')
    expect(successText).toContain('הפרויקט בוטל. 4 שיבוצים שוחררו, ופריטי הלוגיסטיקה לא השתנו.')
    expect(successText).toContain('4 מיילי "האירוע בוטל" נשלחו')
    expect(screen.queryByTestId('toast-error')).not.toBeInTheDocument()
    // הכפתור השלישי ("סגירה") איננו — §3.7 מתיר רק ביטול/חזרה.
    expect(screen.queryByText('סגירה')).not.toBeInTheDocument()
  })

  it('ה-RPC נכשל ⇒ אף מייל לא נשלח, וההודעה העברית של השרת מוצגת כלשונה', async () => {
    // 🔒 עותק מילולי של raise "כבר בוטל" (㉑ — אין ביטול-ביטול) מתוך cancel_project.
    const serverMessage = 'הפרויקט כבר בוטל. הפעולה אינה הפיכה, ופרויקט מבוטל אינו חוזר לפעילות.'
    cancelProject.mockRejectedValue(new Error(serverMessage))
    const onOpenChange = vi.fn()
    await renderDialog({ onOpenChange })
    await fillAndConfirm()

    await waitFor(() =>
      expect(screen.getByTestId('cancel-server-error').textContent).toContain(serverMessage),
    )
    expect(sendEmail).not.toHaveBeenCalled()
    // הדיאלוג נשאר פתוח עם הערכים, וההודעה אומרת במפורש ששום דבר לא השתנה (§④).
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(screen.getByTestId('cancel-server-error').textContent).toContain(
      'הפרויקט לא השתנה, והדיילות לא שוחררו.',
    )
    expect(screen.getByTestId('cancel-reason').value).toBe('הלקוח דחה את האירוע לרבעון הבא')
  })

  it('סירוב "האירוע כבר התקיים" מוצג כלשונו (as-built ④)', async () => {
    const serverMessage =
      'האירוע כבר התקיים או נסגר, ולא ניתן לבטל אותו. ביטול אפשרי כל עוד הפרויקט פעיל.'
    cancelProject.mockRejectedValue(new Error(serverMessage))
    await renderDialog()
    await fillAndConfirm()
    await waitFor(() =>
      expect(screen.getByTestId('cancel-server-error').textContent).toContain(serverMessage),
    )
  })

  it('כתובת חסרה ⇒ דיווח "לא נשלח" לאותה נמענת, והשאר נשלחות', async () => {
    getHostessEmails.mockResolvedValue(
      new Map([
        [1, { hostess_id: 1, full_name: 'יעל דוד', email: 'yael@regin-demo.co.il' }],
        // 2 חסרה · 3+4 קיימות
        [3, { hostess_id: 3, full_name: 'מאיה כהן', email: 'maya@regin-demo.co.il' }],
        [4, { hostess_id: 4, full_name: 'נועה שגיא', email: 'noa@regin-demo.co.il' }],
      ]),
    )
    const onOpenChange = vi.fn()
    await renderDialog({ onOpenChange })
    await fillAndConfirm()

    // הדיאלוג נסגר גם כשחלק מהמיילים נכשל — הביטול עצמו כבר קרה ואינו הפיך.
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(sendEmail).toHaveBeenCalledTimes(3)
    // הכשל מדווח פר-נמענת, בשמה — כדי שיהיה ברור למי להוסיף כתובת.
    const errorToasts = await screen.findAllByTestId('toast-error')
    const errorText = errorToasts.map((t) => t.textContent).join(' | ')
    expect(errorText).toContain('מייל "האירוע בוטל" אל סיון נחום: לא נשלח — לא נמצאה כתובת מייל.')
    // שלושת המיילים שכן יצאו מדווחים בטוסט-הצלחה מקובץ.
    const successToasts = screen.getAllByTestId('toast-success')
    expect(successToasts.map((t) => t.textContent).join(' | ')).toContain(
      '3 מיילי "האירוע בוטל" נשלחו',
    )
  })

  it('🔴 תקלת-רשת (FunctionsFetchError) מסווגת "לא ידוע", לא "נכשל" — הסיווג דרך classifySendError', async () => {
    // עד התיקון הסיווג היה צר מה-SSOT (רק message==='TIMEOUT') — תקלת-רשת דווחה "נכשל"
    // והזמינה שליחה חוזרת על מייל שאולי כן יצא.
    const fetchError = new Error('Failed to send a request to the Edge Function')
    fetchError.name = 'FunctionsFetchError'
    sendEmail.mockRejectedValue(fetchError)
    const onOpenChange = vi.fn()
    await renderDialog({ onOpenChange })
    await fillAndConfirm()

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    const errorToasts = await screen.findAllByTestId('toast-error')
    const errorText = errorToasts.map((t) => t.textContent).join(' | ')
    expect(errorText).toContain('לא ידוע אם נשלח — לא התקבל אישור שליחה.')
    expect(errorText).not.toContain('נכשל — המייל לא נשלח.')
  })

  it('🔴 חסימת-"דיילות" (מפה ריקה על רשימה לא-ריקה): "אין הרשאה לכתובות המייל", לא "לא נמצאה כתובת"', async () => {
    // RLS silent-empty: getHostessEmails חוזרת ריקה בלי שגיאה למי שחסומה על 'דיילות'.
    getHostessEmails.mockResolvedValue(new Map())
    const onOpenChange = vi.fn()
    await renderDialog({ onOpenChange })
    await fillAndConfirm()

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(sendEmail).not.toHaveBeenCalled()
    const errorToasts = await screen.findAllByTestId('toast-error')
    const errorText = errorToasts.map((t) => t.textContent).join(' | ')
    expect(errorText).toContain('לא נשלח — אין הרשאה לכתובות המייל.')
    // ההבחנה של הכשל השקט: לא מדווחים "לא נמצאה כתובת" על כתובות שקיימות ורק חסומות.
    expect(errorText).not.toContain('לא נמצאה כתובת מייל.')
  })
})
