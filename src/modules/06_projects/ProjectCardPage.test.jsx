// בדיקת כרטיס-הפרויקט (משטח 2) — נועלת את מה שמדריך-המיקרו קבע לצעד 3.2: התא התשיעי
// רק בביטול (S-30) · כפתור-הביטול נעלם מ-event_finished ולתפקיד-צפייה (as-built ①) ·
// שלושת מצבי לשונית-הסגירה כולל משפט חלון-ה-cron וההתמדה אחרי הסגירה · ‏planned_revenue
// ‏null ⇒ `—` ואפס אמיתי ⇒ `0.00 ₪` (S-2) · והפשרה שהופכת את התג (as-built ③).
// ה-API ממוקק כולו; ההרשאות דרך mock של AuthContext — כמו בסגנון-הבית של 3.1.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/components/ToastProvider'
import ProjectCardPage from './ProjectCardPage'
import {
  getProject,
  listProjectsOverview,
  getProjectQuoteMeta,
  getProjectCustomerContact,
  getProjectAssignments,
  updateProjectDetails,
  sendDateChangeReinvites,
  sendDetailsChangedMails,
} from './api'

vi.mock('./api', () => ({
  getProject: vi.fn(),
  listProjectsOverview: vi.fn(),
  getProjectQuoteMeta: vi.fn(),
  getProjectCustomerContact: vi.fn(),
  getProjectAssignments: vi.fn(),
  updateProjectDetails: vi.fn(),
  sendDateChangeReinvites: vi.fn(),
  sendDetailsChangedMails: vi.fn(),
}))

// הרשאות ניתנות-להחלפה פר-בדיקה — אותה תבנית של גידור-הכפתורים ב-02_customers.
const authState = { permissions: {} }
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

function offsetIso(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
}

function projectRow(overrides) {
  return {
    project_id: 8,
    quote_id: 6,
    event_name: 'כנס לקוחות שנתי',
    customer_name: 'מדיטק פתרונות בע"מ',
    customer_id: 46,
    project_status: 'in_progress',
    final_event_date: offsetIso(9),
    final_start_time: '18:00:00',
    final_end_time: '22:00:00',
    final_location: 'אקספו תל אביב, ביתן 2',
    lat: 32.1,
    lng: 34.8,
    required_hostess_count: 6,
    owner_name: 'ישי אטיאס',
    owner_phone: '050-1241223',
    owner_email: 'ishay1997@gmail.com',
    feedback_status: 'not_sent',
    feedback_score: null,
    negative_feedback_reason: null,
    feedback_notes: null,
    cancel_reason: null,
    cancel_type: null,
    cancelled_at: null,
    cancelled_by: null,
    operationally_closed_at: null,
    operationally_closed_by: null,
    ...overrides,
  }
}

function overviewRow(overrides) {
  return {
    project_id: 8,
    project_status: 'in_progress',
    final_event_date: offsetIso(9),
    required_hostess_count: 6,
    hostesses_confirmed: 1,
    pending_invites: 2,
    assignments_row_count: 9,
    logistics_ready: 0,
    logistics_total: 2,
    planned_revenue: '5355.00',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/projects/8']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectCardPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

async function findCard() {
  return await screen.findByTestId('project-cell-date')
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.permissions = { פרויקטים: 'edit', דיילות: 'view', לקוחות: 'edit' }
  getProject.mockResolvedValue(projectRow())
  listProjectsOverview.mockResolvedValue([overviewRow()])
  getProjectQuoteMeta.mockResolvedValue({
    estimated_guests: 300,
    applied_customer_discount: 5,
    manual_discount: 10,
  })
  getProjectCustomerContact.mockResolvedValue({ contact_name: 'רון גל', phone: '052-4471180' })
  getProjectAssignments.mockResolvedValue([])
  sendDateChangeReinvites.mockResolvedValue({ sent: 1, unknown: 0, failed: 0 })
  sendDetailsChangedMails.mockResolvedValue({ sent: 0, unknown: 0, failed: 0, blockedReason: null })
})

describe('ProjectCardPage — מעטפת ואזור-זהות', () => {
  it('כותרת + תג + תת-כותרת, ושם-הלקוח ומספר-ההצעה אינם קישורים (S-13)', async () => {
    renderPage()
    await findCard()
    expect(screen.getByRole('heading', { name: 'כנס לקוחות שנתי' })).toBeInTheDocument()
    expect(screen.getByTestId('project-card-status')).toHaveTextContent('בתהליך')
    // אין ולו קישור ישות⇐ישות: הקישור היחיד בעמוד הוא פירור-הלחם חזרה למבט-העל.
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveTextContent('פרויקטים')
  })

  it('הכנסה מתוכננת: הסכום בשתי ספרות-אגורות + שורת ההנחה המחוברת (5%+10%=15%)', async () => {
    renderPage()
    await findCard()
    const cell = screen.getByTestId('project-cell-revenue')
    expect(within(cell).getByText('5,355.00 ₪')).toBeInTheDocument()
    expect(cell.textContent).toContain('לפני מע"מ, אחרי הנחה של')
    expect(cell.textContent).toContain('15%')
  })

  it('🔴 S-2: ‏planned_revenue null ⇒ `—` (גם אין-הצעה וגם אין-הרשאה), ואפס אמיתי ⇒ 0.00 ₪', async () => {
    listProjectsOverview.mockResolvedValue([overviewRow({ planned_revenue: null })])
    const first = renderPage()
    await findCard()
    const revenueCell = screen.getByTestId('project-cell-revenue')
    expect(within(revenueCell).getByText('—')).toBeInTheDocument()
    // יש הצעה מקושרת (quote_id=6) — ה-NULL הוא חסימת-הרשאה, ולכן `—` חשוף בלי שורת-משנה:
    // "אין הצעה מקושרת" על הצעה שקיימת היה עובדה שקרית שהוסקה מקריאה חסומה.
    expect(within(revenueCell).queryByText('אין הצעה מקושרת')).not.toBeInTheDocument()
    first.unmount()

    listProjectsOverview.mockResolvedValue([overviewRow({ planned_revenue: 0 })])
    renderPage()
    await findCard()
    expect(
      within(screen.getByTestId('project-cell-revenue')).getByText('0.00 ₪'),
    ).toBeInTheDocument()
  })

  it('פרויקט בלי הצעה (quote_id null): שני התאים מציגים `—` + "אין הצעה מקושרת" (הכרטיס §④)', async () => {
    getProject.mockResolvedValue(projectRow({ quote_id: null }))
    listProjectsOverview.mockResolvedValue([overviewRow({ planned_revenue: null })])
    renderPage()
    await findCard()
    const guests = screen.getByTestId('project-cell-guests')
    const revenue = screen.getByTestId('project-cell-revenue')
    expect(within(guests).getByText('—')).toBeInTheDocument()
    expect(within(guests).getByText('אין הצעה מקושרת')).toBeInTheDocument()
    expect(within(revenue).getByText('—')).toBeInTheDocument()
    expect(within(revenue).getByText('אין הצעה מקושרת')).toBeInTheDocument()
    // בלי הצעה — אין מה לשלוף ממנה.
    expect(getProjectQuoteMeta).not.toHaveBeenCalled()
  })

  it('טלפון ואימייל של מנהל/ת הפרויקט בשתי שורות נפרדות (S-23), והמשוב במצבו הריק', async () => {
    renderPage()
    await findCard()
    const owner = screen.getByTestId('project-cell-owner')
    // שני ערכי-LTR נפרדים — לא רצף אחד בשורה אחת.
    expect(within(owner).getByText('050-1241223')).toBeInTheDocument()
    expect(within(owner).getByText('ishay1997@gmail.com')).toBeInTheDocument()
    const feedback = screen.getByTestId('project-cell-feedback')
    expect(within(feedback).getByText('טרם התקבל משוב')).toBeInTheDocument()
    expect(
      within(feedback).getByText('הסקר יוצא בסגירת האירוע · הציון והסיבה מוזנים במסך הכספים'),
    ).toBeInTheDocument()
  })

  it('שני האריחים: יחסים כמחרוזות עם שורות-המשנה של הכרטיס — ואף ₪ בהם', async () => {
    renderPage()
    await findCard()
    const staffing = screen.getByTestId('project-card-tile-staffing')
    expect(staffing.textContent).toContain('1/6')
    expect(staffing.textContent).toContain('חסרות 5 דיילות שאושרו סופית')
    const logistics = screen.getByTestId('project-card-tile-logistics')
    expect(logistics.textContent).toContain('0/2')
    expect(logistics.textContent).toContain('2 פריטים טרם מוכנים')
    expect(staffing.textContent).not.toContain('₪')
    expect(logistics.textContent).not.toContain('₪')
  })
})

describe('ProjectCardPage — התא התשיעי (S-30)', () => {
  it('מוצג רק כשהפרויקט בוטל: סיבה + תווית-הסוג + חותמת מי-ומתי', async () => {
    getProject.mockResolvedValue(
      projectRow({
        project_status: 'cancelled',
        cancel_reason: 'הלקוח דחה את הכנס למועד לא ידוע',
        cancel_type: 'customer',
        cancelled_at: '2026-08-11T09:40:00Z',
        cancelled_by: 'dana@regin.co.il',
      }),
    )
    listProjectsOverview.mockResolvedValue([overviewRow({ project_status: 'cancelled' })])
    renderPage()
    await findCard()
    const cell = screen.getByTestId('project-cell-cancel-reason')
    expect(within(cell).getByText('הלקוח דחה את הכנס למועד לא ידוע')).toBeInTheDocument()
    expect(within(cell).getByText('הלקוח ביטל')).toBeInTheDocument()
    expect(screen.getByTestId('project-cancel-stamp').textContent).toContain('dana@regin.co.il')
  })

  it('אינו קיים על פרויקט שאינו מבוטל', async () => {
    renderPage()
    await findCard()
    expect(screen.queryByTestId('project-cell-cancel-reason')).not.toBeInTheDocument()
  })
})

describe('ProjectCardPage — שלוש הפעולות מול הרשאה ומצב', () => {
  it('מנהלת עם edit על פרויקט פעיל: שני הכפתורים + ✎, בסדר ה-DOM ביטול⇐שינוי-תכולה', async () => {
    renderPage()
    await findCard()
    const cancel = screen.getByTestId('project-card-cancel-button')
    const scope = screen.getByTestId('project-card-scope-button')
    expect(cancel).toBeInTheDocument()
    expect(scope).toBeEnabled()
    // סדר ה-DOM: הביטול לפני הפעולה הראשית (המוקאפ).
    expect(cancel.compareDocumentPosition(scope) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByTestId('project-card-edit-details')).toBeInTheDocument()
  })

  it('🔴 as-built ①: על event_finished כפתור-הביטול איננו (לא מרונדר), ושינוי-תכולה מושבת ומנומק', async () => {
    getProject.mockResolvedValue(
      projectRow({ project_status: 'event_finished', final_event_date: offsetIso(-12) }),
    )
    listProjectsOverview.mockResolvedValue([
      overviewRow({ project_status: 'event_finished', final_event_date: offsetIso(-12) }),
    ])
    renderPage()
    await findCard()
    expect(screen.queryByTestId('project-card-cancel-button')).not.toBeInTheDocument()
    const scope = screen.getByTestId('project-card-scope-button')
    expect(scope).toBeDisabled()
    expect(scope).toHaveAttribute('title', "אחרי האירוע, שינויים מוזנים בלשונית 'סגירת אירוע'")
  })

  it('תפקיד-צפייה: אף כפתור ואף ✎ — לא מוצג-ומושבת אלא איננו (חסימת-הרשאה מעלימה)', async () => {
    authState.permissions = { פרויקטים: 'view', דיילות: 'edit' }
    renderPage()
    await findCard()
    expect(screen.queryByTestId('project-card-cancel-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('project-card-scope-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('project-card-edit-details')).not.toBeInTheDocument()
  })
})

describe('ProjectCardPage — שלושת מצבי לשונית "סגירת אירוע"', () => {
  it('① פעיל ותאריך עתידי: מושבתת עם "(נפתחת אחרי האירוע)"', async () => {
    renderPage()
    await findCard()
    const tab = screen.getByTestId('project-tab-closing')
    expect(tab).toBeDisabled()
    expect(screen.getByTestId('project-tab-closing-reason')).toHaveTextContent(
      '(נפתחת אחרי האירוע)',
    )
  })

  it('② האירוע עבר והסטטוס עוד פעיל (חלון ה-02:00): המשפט מתחלף — השער לא', async () => {
    getProject.mockResolvedValue(
      projectRow({ project_status: 'ready', final_event_date: offsetIso(-1) }),
    )
    listProjectsOverview.mockResolvedValue([
      overviewRow({ project_status: 'ready', final_event_date: offsetIso(-1) }),
    ])
    renderPage()
    await findCard()
    expect(screen.getByTestId('project-tab-closing')).toBeDisabled()
    expect(screen.getByTestId('project-tab-closing-reason')).toHaveTextContent(
      '(נפתחת בסריקה היומית — האירוע נסגר לסגירה מחר ב-02:00)',
    )
  })

  it('event_finished: הלשונית פעילה ובלי נימוק-השבתה', async () => {
    getProject.mockResolvedValue(
      projectRow({ project_status: 'event_finished', final_event_date: offsetIso(-12) }),
    )
    listProjectsOverview.mockResolvedValue([
      overviewRow({ project_status: 'event_finished', final_event_date: offsetIso(-12) }),
    ])
    renderPage()
    await findCard()
    expect(screen.getByTestId('project-tab-closing')).toBeEnabled()
    expect(screen.queryByTestId('project-tab-closing-reason')).not.toBeInTheDocument()
  })

  it('③ אחרי הסגירה התפעולית: הלשונית נשארת, נלחצת, ומציגה חותמת "נסגר ב-… על-ידי …"', async () => {
    getProject.mockResolvedValue(
      projectRow({
        project_status: 'awaiting_invoice',
        final_event_date: offsetIso(-20),
        operationally_closed_at: '2026-08-15T07:30:00Z',
        operationally_closed_by: 'dana@regin.co.il',
      }),
    )
    listProjectsOverview.mockResolvedValue([
      overviewRow({ project_status: 'awaiting_invoice', final_event_date: offsetIso(-20) }),
    ])
    renderPage()
    await findCard()
    const tab = screen.getByTestId('project-tab-closing')
    expect(tab).toBeEnabled()
    fireEvent.click(tab)
    const stamp = screen.getByTestId('project-panel-closing-stamp')
    expect(stamp.textContent).toContain('נסגר ב-')
    expect(stamp.textContent).toContain('dana@regin.co.il')
  })
})

describe('ProjectCardPage — הפשרה (as-built ③) ומיילים אחרי הצלחה בלבד', () => {
  it('תאריך עתידי מ"ממתין לסגירה": התג מתהפך והלשונית ננעלת מחדש אחרי הרענון', async () => {
    const finished = projectRow({
      project_status: 'event_finished',
      final_event_date: offsetIso(-5),
    })
    const reactivated = projectRow({
      project_status: 'not_started',
      final_event_date: offsetIso(20),
    })
    getProject.mockResolvedValueOnce(finished).mockResolvedValueOnce(reactivated)
    listProjectsOverview
      .mockResolvedValueOnce([
        overviewRow({ project_status: 'event_finished', final_event_date: offsetIso(-5) }),
      ])
      .mockResolvedValueOnce([
        overviewRow({
          project_status: 'not_started',
          final_event_date: offsetIso(20),
          hostesses_confirmed: 0,
        }),
      ])
    updateProjectDetails.mockResolvedValue({
      date_changed: true,
      location_changed: false,
      hours_changed: false,
      reactivated: true,
      project_status: 'not_started',
      can_read_hostesses: true,
      hostesses_to_reinvite: [],
      hostesses_to_notify: [],
    })

    renderPage()
    await findCard()
    expect(screen.getByTestId('project-card-status')).toHaveTextContent('ממתין לסגירה')

    fireEvent.click(screen.getByTestId('project-card-edit-details'))
    const dateInput = await screen.findByTestId('edit-project-date-input')
    const [dd, mm, yyyy] = [
      offsetIso(20).slice(8, 10),
      offsetIso(20).slice(5, 7),
      offsetIso(20).slice(0, 4),
    ]
    fireEvent.change(dateInput, { target: { value: `${dd}/${mm}/${yyyy}` } })
    // ההשלכה מוצגת לפני האישור (as-built ③).
    expect(await screen.findByTestId('edit-project-reactivation-notice')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('edit-project-save'))

    // אחרי הרענון: התג "טרם החל" ולשונית-הסגירה חוזרת להיות מושבתת — לוגיקת שלושת-המצבים רצה שוב.
    await waitFor(() =>
      expect(screen.getByTestId('project-card-status')).toHaveTextContent('טרם החל'),
    )
    expect(screen.getByTestId('project-tab-closing')).toBeDisabled()
    // אין דיילות לזמן מחדש — לא נשלח דבר.
    expect(sendDateChangeReinvites).not.toHaveBeenCalled()
  })

  it('🔴 המיילים יוצאים רק אחרי הצלחת ה-RPC — ובסדר הזה', async () => {
    updateProjectDetails.mockResolvedValue({
      date_changed: true,
      location_changed: false,
      hours_changed: false,
      reactivated: false,
      can_read_hostesses: true,
      hostesses_to_reinvite: [{ hostess_id: 5, full_name: 'נועה שגיא' }],
      hostesses_to_notify: [],
    })
    renderPage()
    await findCard()
    fireEvent.click(screen.getByTestId('project-card-edit-details'))
    const dateInput = await screen.findByTestId('edit-project-date-input')
    const iso = offsetIso(16)
    fireEvent.change(dateInput, {
      target: { value: `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` },
    })
    fireEvent.click(screen.getByTestId('edit-project-save'))

    await waitFor(() => expect(sendDateChangeReinvites).toHaveBeenCalledTimes(1))
    expect(updateProjectDetails.mock.invocationCallOrder[0]).toBeLessThan(
      sendDateChangeReinvites.mock.invocationCallOrder[0],
    )
    expect(sendDateChangeReinvites.mock.calls[0][1]).toEqual([5])
    // התוצאה מדווחת פר-נמען — הטוסט נוקב במספר.
    expect((await screen.findByTestId('toast-success')).textContent).toContain(
      'נשלח זימון מחדש לדיילת אחת.',
    )
  })

  it('ה-RPC נכשל ⇒ אף מייל לא נשלח, וההודעה של השרת מוצגת כלשונה', async () => {
    updateProjectDetails.mockRejectedValue(
      new Error(
        'נועה שגיא כבר מאושרת סופית לאירוע אחר בתאריך הזה. בחרי תאריך אחר, או שחררי אותה מהאירוע ההוא.',
      ),
    )
    renderPage()
    await findCard()
    fireEvent.click(screen.getByTestId('project-card-edit-details'))
    const dateInput = await screen.findByTestId('edit-project-date-input')
    const iso = offsetIso(16)
    fireEvent.change(dateInput, {
      target: { value: `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` },
    })
    fireEvent.click(screen.getByTestId('edit-project-save'))

    expect(await screen.findByTestId('edit-project-server-error')).toHaveTextContent(
      'נועה שגיא כבר מאושרת סופית לאירוע אחר בתאריך הזה. בחרי תאריך אחר, או שחררי אותה מהאירוע ההוא.',
    )
    expect(sendDateChangeReinvites).not.toHaveBeenCalled()
    expect(sendDetailsChangedMails).not.toHaveBeenCalled()
    // הדיאלוג נשאר פתוח עם הערכים שהוקלדו.
    expect(screen.getByTestId('edit-project-save')).toBeInTheDocument()
  })
})

describe('ProjectCardPage — מצבי טעינה/כשל/לא-נמצא', () => {
  it('כשל-טעינה: המסך נכשל בקול עם הנוסח הנעול ו"נסי שוב" — לעולם לא כרטיס-חצי-מלא', async () => {
    getProject.mockRejectedValue(new TypeError('Failed to fetch'))
    renderPage()
    expect(await screen.findByText('לא ניתן לטעון את הנתונים.')).toBeInTheDocument()
    expect(screen.getByText('כרטיס הפרויקט לא נטען.')).toBeInTheDocument()
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'נסי שוב' })).toBeInTheDocument()
  })

  it('id שאינו קיים: "הפרויקט לא נמצא" + חזרה למבט-העל (④ — אין "ריק אמיתי" בכרטיס)', async () => {
    getProject.mockResolvedValue(null)
    renderPage()
    expect(await screen.findByText('הפרויקט לא נמצא')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'חזרה למבט-העל →' })).toBeInTheDocument()
  })
})
