// בדיקת דיאלוג "עריכת פרטי האירוע" (משטח 2 · מצב ב׳) — נועלת את הנוסחים המדויקים של
// המוקאפ (משפט-הפתיחה, שני העזרים, ה-placeholders, סדר-הפוטר), את שלושת נוסחי-החובה
// הזהים-בייט לשרת, את באנר-㉑ על שתי גרסאותיו, את שני המודיעים-שאינם-חוסמים (S-17),
// ואת חוזה-המיילים: אחרי הצלחת ה-RPC בלבד, עם דיווח פר-נמען.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ToastProvider } from '@/components/ToastProvider'
import EditProjectDetailsDialog from './EditProjectDetailsDialog'
import {
  getProjectAssignments,
  updateProjectDetails,
  sendDateChangeReinvites,
  sendDetailsChangedMails,
} from './api'

vi.mock('./api', () => ({
  getProjectAssignments: vi.fn(),
  updateProjectDetails: vi.fn(),
  sendDateChangeReinvites: vi.fn(),
  sendDetailsChangedMails: vi.fn(),
}))

// 🔒 העתקים מילוליים של הודעות ה-raise שבגוף update_project_details החי — המקור:
// docs/micro_guides/module-6.md, ‏Step 3.2 ‏↳ as-built 14/08/2026 ②, שנקרא מ-pg_get_functiondef.
// אם בדיקה זו נשברת — או שהלקוח סטה מהשרת, או שהשרת שונה ואז יש לעדכן את שני הצדדים יחד.
const SERVER_LOCATION_MSG = 'חובה למלא מיקום — הוא נשלח לדיילות ומשמש לדירוג הקרבה בשיבוץ.'
const SERVER_HOURS_MSG = 'מלאי גם שעת התחלה וגם שעת סיום, או השאירי את שתיהן ריקות.'

function offsetIso(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
}

function dmy(iso) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

function project(overrides) {
  return {
    project_id: 8,
    quote_id: 6,
    event_name: 'כנס לקוחות שנתי',
    customer_name: 'מדיטק פתרונות בע"מ',
    project_status: 'in_progress',
    final_event_date: offsetIso(9),
    final_start_time: '18:00:00',
    final_end_time: '22:00:00',
    final_location: 'אקספו תל אביב, ביתן 2',
    owner_name: 'ישי אטיאס',
    owner_phone: '050-1241223',
    owner_email: 'ishay1997@gmail.com',
    ...overrides,
  }
}

function overviewRow(overrides) {
  return {
    project_id: 8,
    hostesses_confirmed: 1,
    required_hostess_count: 6,
    ...overrides,
  }
}

function renderDialog(props = {}) {
  return render(
    <ToastProvider>
      <EditProjectDetailsDialog
        open
        onOpenChange={vi.fn()}
        project={project()}
        overviewRow={overviewRow()}
        canReadHostesses
        onSaved={vi.fn()}
        {...props}
      />
    </ToastProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getProjectAssignments.mockResolvedValue([
    {
      project_id: 8,
      hostess_id: 5,
      assignment_number: 2,
      assignment_status: 'finally_approved',
      hourly_rate_snapshot: 45,
      hostesses: { hostess_id: 5, full_name: 'נועה שגיא', email: 'noa@x.co', phone: '050-1' },
    },
  ])
  updateProjectDetails.mockResolvedValue({
    date_changed: false,
    location_changed: true,
    hours_changed: false,
    reactivated: false,
    can_read_hostesses: true,
    hostesses_to_reinvite: [],
    hostesses_to_notify: [{ hostess_id: 5, full_name: 'נועה שגיא' }],
  })
  sendDateChangeReinvites.mockResolvedValue({ sent: 1, unknown: 0, failed: 0 })
  sendDetailsChangedMails.mockResolvedValue({ sent: 1, unknown: 0, failed: 0, blockedReason: null })
})

describe('EditProjectDetailsDialog — הנוסחים המדויקים של המוקאפ', () => {
  it('משפט-הפתיחה, שני העזרים, ה-placeholders והפוטר — מילה במילה, ובסדר המצויר', async () => {
    renderDialog()
    expect(await screen.findByText('עריכת פרטי האירוע')).toBeInTheDocument()
    expect(
      screen.getByText(/שינוי כאן משנה את הפרויקט בלבד — ההצעה שהלקוח אישר נשארת כפי שהיא\./),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'שינוי מיקום אינו מבטל אישורים. הדיילות מקבלות עדכון, והנקודה על המפה נקבעת מחדש.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('שינוי שעות אינו מבטל אישורים. הדיילות מקבלות עדכון שנוקב בשעות החדשות.'),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText('DD/MM/YYYY')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('למשל: היכל התרבות, תל אביב')).toBeInTheDocument()
    expect(screen.getAllByPlaceholderText('HH:MM')).toHaveLength(2)
    // הפוטר: הפעולה הראשית ואז "ביטול" — סדר ה-DOM כמו במוקאפ (justify-start, הראשית מימין).
    const save = screen.getByTestId('edit-project-save')
    const cancel = screen.getByTestId('edit-project-cancel')
    expect(save).toHaveTextContent('שמור ושלח זימון מחדש')
    expect(cancel).toHaveTextContent('ביטול')
    expect(save.compareDocumentPosition(cancel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('EditProjectDetailsDialog — שדות-חובה, זהים-בייט לשרת', () => {
  it('מיקום ריק: המשפט של השרת, וה-RPC לא נקרא', async () => {
    renderDialog()
    fireEvent.change(await screen.findByTestId('edit-project-location-input'), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByTestId('edit-project-save'))
    expect(await screen.findByText(SERVER_LOCATION_MSG)).toBeInTheDocument()
    expect(updateProjectDetails).not.toHaveBeenCalled()
  })

  it('שעה אחת בלבד: both-or-neither של השרת, וה-RPC לא נקרא', async () => {
    renderDialog()
    fireEvent.change(await screen.findByTestId('edit-project-end-input'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByTestId('edit-project-save'))
    expect(await screen.findByText(SERVER_HOURS_MSG)).toBeInTheDocument()
    expect(updateProjectDetails).not.toHaveBeenCalled()
  })

  it('תאריך ריק: "חובה למלא תאריך אירוע." (כרטיס ⑦)', async () => {
    renderDialog()
    fireEvent.change(await screen.findByTestId('edit-project-date-input'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByTestId('edit-project-save'))
    expect(await screen.findByText('חובה למלא תאריך אירוע.')).toBeInTheDocument()
    expect(updateProjectDetails).not.toHaveBeenCalled()
  })
})

describe('EditProjectDetailsDialog — באנר-ההשלכה (㉑)', () => {
  it('עם הרשאת-דיילות: הבאנר נוקב בשם ובמדד — לפני האישור, בלי שום שמירה', async () => {
    renderDialog()
    fireEvent.change(await screen.findByTestId('edit-project-date-input'), {
      target: { value: dmy(offsetIso(16)) },
    })
    const banner = await screen.findByTestId('edit-project-date-banner')
    await waitFor(() => expect(banner.textContent).toContain('נועה שגיא'))
    expect(banner.textContent).toContain('שינית את תאריך האירוע.')
    expect(banner.textContent).toContain('דיילת אחת כבר אושרה סופית לתאריך הקודם')
    expect(banner.textContent).toContain('1/6')
    expect(banner.textContent).toContain('0/6')
    expect(updateProjectDetails).not.toHaveBeenCalled()
  })

  it('🔴 בלי הרשאת-דיילות (as-built ⑤): נוסח-המונה בלבד — בלי שם ובלי undefined', async () => {
    renderDialog({ canReadHostesses: false })
    fireEvent.change(await screen.findByTestId('edit-project-date-input'), {
      target: { value: dmy(offsetIso(16)) },
    })
    const banner = await screen.findByTestId('edit-project-date-banner')
    expect(banner.textContent).toContain('דיילת אחת כבר אושרה סופית לתאריך הקודם.')
    expect(banner.textContent).not.toContain('נועה שגיא')
    expect(banner.textContent).not.toContain('undefined')
    // שמות לא נשלפו בכלל — הקריאה עצמה מגודרת.
    expect(getProjectAssignments).not.toHaveBeenCalled()
  })
})

describe('EditProjectDetailsDialog — מודיעים ולא חוסמים (S-17)', () => {
  it('אירוע חוצה-חצות: ענבר על המסך, והשמירה עוברת', async () => {
    renderDialog()
    fireEvent.change(await screen.findByTestId('edit-project-start-input'), {
      target: { value: '22:00' },
    })
    fireEvent.change(screen.getByTestId('edit-project-end-input'), {
      target: { value: '02:00' },
    })
    expect(await screen.findByTestId('edit-project-cross-midnight')).toHaveTextContent(
      'האירוע חוצה חצות',
    )
    fireEvent.click(screen.getByTestId('edit-project-save'))
    await waitFor(() => expect(updateProjectDetails).toHaveBeenCalledTimes(1))
  })

  it('תאריך בעבר: הודעה רגועה, והשמירה עוברת — "הזמן מודיע, לעולם אינו מחליט"', async () => {
    renderDialog()
    fireEvent.change(await screen.findByTestId('edit-project-date-input'), {
      target: { value: dmy(offsetIso(-3)) },
    })
    expect(await screen.findByTestId('edit-project-past-date')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('edit-project-save'))
    await waitFor(() => expect(updateProjectDetails).toHaveBeenCalledTimes(1))
  })
})

describe('EditProjectDetailsDialog — מיילים: אחרי הצלחה בלבד, דיווח פר-נמען', () => {
  it('שינוי-מיקום: מייל-העדכון יוצא אחרי ה-RPC, לרשימת hostesses_to_notify', async () => {
    renderDialog()
    fireEvent.change(await screen.findByTestId('edit-project-location-input'), {
      target: { value: 'מרכז הכנסים, ירושלים' },
    })
    fireEvent.click(screen.getByTestId('edit-project-save'))
    await waitFor(() => expect(sendDetailsChangedMails).toHaveBeenCalledTimes(1))
    expect(updateProjectDetails.mock.invocationCallOrder[0]).toBeLessThan(
      sendDetailsChangedMails.mock.invocationCallOrder[0],
    )
    expect(sendDetailsChangedMails.mock.calls[0][1]).toEqual([5])
    // הבונים מקבלים את הערכים *החדשים* — לא את השורה הישנה.
    expect(sendDetailsChangedMails.mock.calls[0][0].final_location).toBe('מרכז הכנסים, ירושלים')
    expect(sendDateChangeReinvites).not.toHaveBeenCalled()
    // שני טוסטים ירוקים: משפט-ההצלחה של השמירה + דיווח פר-נמען של מייל-העדכון.
    const successToasts = await screen.findAllByTestId('toast-success')
    const successText = successToasts.map((t) => t.textContent).join(' | ')
    expect(successText).toContain('המיקום עודכן.')
    expect(successText).toContain('מייל עדכון נשלח')
  })

  it('חלק מהמיילים נכשל — הטוסט אומר זאת, בשלוש התוצאות ולא בשתיים', async () => {
    sendDetailsChangedMails.mockResolvedValue({
      sent: 1,
      unknown: 1,
      failed: 1,
      blockedReason: null,
    })
    renderDialog()
    fireEvent.change(await screen.findByTestId('edit-project-location-input'), {
      target: { value: 'מרכז הכנסים, ירושלים' },
    })
    fireEvent.click(screen.getByTestId('edit-project-save'))
    const errorToast = await screen.findByTestId('toast-error')
    expect(errorToast.textContent).toContain('לא ידוע אם יצאו')
    expect(errorToast.textContent).toContain('נכשלו')
  })

  it('חסימת-דיילות מלאה: האמת נאמרת — "אין לך הרשאה" ולא "נכשלו" סתמי', async () => {
    sendDetailsChangedMails.mockResolvedValue({
      sent: 0,
      unknown: 0,
      failed: 1,
      blockedReason: 'permission',
    })
    renderDialog({ canReadHostesses: false })
    fireEvent.change(await screen.findByTestId('edit-project-location-input'), {
      target: { value: 'מרכז הכנסים, ירושלים' },
    })
    fireEvent.click(screen.getByTestId('edit-project-save'))
    const errorToast = await screen.findByTestId('toast-error')
    expect(errorToast.textContent).toContain('אין לך הרשאה לצפות בדיילות')
  })

  it('סירוב-שרת מ"ממתין לסגירה" עם תאריך עבר: ההודעה מוצגת כלשונה והדיאלוג נשאר פתוח', async () => {
    const refusal =
      'האירוע כבר התקיים והפרויקט ממתין לסגירה. שינוי שהתגלה אחרי האירוע נרשם דרך מסך סגירת האירוע; להזזת האירוע קדימה בחרי תאריך עתידי.'
    updateProjectDetails.mockRejectedValue(new Error(refusal))
    renderDialog({ project: project({ project_status: 'event_finished' }) })
    fireEvent.change(await screen.findByTestId('edit-project-date-input'), {
      target: { value: dmy(offsetIso(-30)) },
    })
    fireEvent.click(screen.getByTestId('edit-project-save'))
    expect(await screen.findByTestId('edit-project-server-error')).toHaveTextContent(refusal)
    expect(sendDetailsChangedMails).not.toHaveBeenCalled()
    expect(screen.getByTestId('edit-project-date-input')).toHaveValue(dmy(offsetIso(-30)))
  })
})
