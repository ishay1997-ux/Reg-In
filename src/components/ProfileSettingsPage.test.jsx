// בדיקת NotificationsSection בתוך ProfileSettingsPage (S5, מודול 9, צעד 3.5) — נועלת שהמתגים
// באמת מחוברים לטבלת notification_preferences (מיגרציה B) ולא UI-מקומי-בלבד כמו קודם, ששני
// התיוגים "(בקרוב)" נעלמו לגמרי (R-4), ומתג ה-SMS דובר-אמת ומנוטרל לצמיתות. שאר הקטעים
// (פרטים אישיים/אבטחה) מחוץ לתחום הצעד הזה ואינם נבדקים כאן.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProfileSettingsPage from './ProfileSettingsPage'
import { ToastProvider } from './ToastProvider'
import { getNotificationPreferences, saveNotificationPreferences } from '@/modules/09_settings/api'

const authState = {
  user: {
    email: 'test@example.com',
    fullName: 'בודקת בדיקות',
    phone: '',
    roleName: 'מנהלת פרויקטים',
  },
  reload: vi.fn(),
}

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }))

vi.mock('@/modules/09_settings/api', () => ({
  getNotificationPreferences: vi.fn(),
  saveNotificationPreferences: vi.fn(),
}))

// useToast זורק מחוץ ל-<ToastProvider> (אותו דפוס כמו src/modules/05_logistics/CLAUDE.md) —
// עטיפה אמיתית, לא mock.
function renderPage() {
  render(
    <ToastProvider>
      <ProfileSettingsPage />
    </ToastProvider>,
  )
}

async function openNotificationsTab() {
  fireEvent.click(screen.getByRole('button', { name: 'העדפות והתראות' }))
  return screen.findByTestId('settings-notify-email')
}

beforeEach(() => {
  vi.clearAllMocks()
  getNotificationPreferences.mockResolvedValue({ emailNewProjects: false, smsLastMinute: false })
  saveNotificationPreferences.mockResolvedValue({ emailNewProjects: true, smsLastMinute: false })
})

describe('NotificationsSection — הנוסח הנעול ואפס "(בקרוב)"', () => {
  it('שתי השורות מוצגות עם הנוסח הנעול (§3.7), ואין אף מופע של "(בקרוב)"', async () => {
    renderPage()
    await openNotificationsTab()

    expect(screen.getByText('מייל על פרויקטים חדשים')).toBeInTheDocument()
    expect(
      screen.getByText('ההתראות עצמן יישלחו כשמנוע ההתראות יעלה (מודול 10)'),
    ).toBeInTheDocument()
    expect(screen.getByText('SMS על שיבוץ ברגע האחרון')).toBeInTheDocument()
    expect(screen.getByText('אין ערוץ SMS במערכת')).toBeInTheDocument()

    // 🔴 rule 13(ח) — היכולת קיימת עכשיו, ולכן שום טקסט לא מתאר אותה כטרם-קיימת.
    expect(screen.queryByText(/בקרוב/)).not.toBeInTheDocument()
  })

  it('מתג ה-SMS מנוטרל לצמיתות — אין ערוץ SMS במערכת, לא "עדיין"', async () => {
    renderPage()
    await openNotificationsTab()
    expect(screen.getByTestId('settings-notify-sms')).toBeDisabled()
    expect(screen.getByTestId('settings-notify-sms')).not.toBeChecked()
  })
})

describe('NotificationsSection — מתג המייל חי מול notification_preferences', () => {
  it('טוען את הערך הקיים בעליית הקטע', async () => {
    getNotificationPreferences.mockResolvedValue({
      emailNewProjects: true,
      smsLastMinute: false,
    })
    renderPage()
    const emailSwitch = await openNotificationsTab()
    expect(emailSwitch).toBeChecked()
  })

  it('הדלקת המתג שומרת מיד עם smsLastMinute=false (המתג השני תמיד כבוי), ומציגה אישור', async () => {
    renderPage()
    const emailSwitch = await openNotificationsTab()
    expect(emailSwitch).not.toBeChecked()

    fireEvent.click(emailSwitch)

    await waitFor(() =>
      expect(saveNotificationPreferences).toHaveBeenCalledWith({
        emailNewProjects: true,
        smsLastMinute: false,
      }),
    )
    expect(await screen.findByText('ההגדרות נשמרו')).toBeInTheDocument()
    expect(emailSwitch).toBeChecked()
  })

  it('שמירה שנכשלת משחזרת את המתג למצבו הקודם ומציגה שגיאה — לא נשאר "דלוק" כוזב', async () => {
    saveNotificationPreferences.mockRejectedValue(new Error('שמירת העדפות ההתראות נכשלה.'))
    renderPage()
    const emailSwitch = await openNotificationsTab()
    expect(emailSwitch).not.toBeChecked()

    fireEvent.click(emailSwitch)

    expect(await screen.findByText('שמירת העדפות ההתראות נכשלה.')).toBeInTheDocument()
    await waitFor(() => expect(emailSwitch).not.toBeChecked())
  })
})
