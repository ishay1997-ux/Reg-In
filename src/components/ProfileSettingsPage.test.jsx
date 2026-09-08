// בדיקת NotificationsSection בתוך ProfileSettingsPage (S5, מודול 9, צעד 3.5) — נועלת שהמתגים
// באמת מחוברים לטבלת notification_preferences (מיגרציה B) ולא UI-מקומי-בלבד כמו קודם, ששני
// התיוגים "(בקרוב)" נעלמו לגמרי (R-4), ומתג ה-SMS דובר-אמת ומנוטרל לצמיתות. שאר הקטעים
// (פרטים אישיים/אבטחה) מחוץ לתחום הצעד הזה ואינם נבדקים כאן.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProfileSettingsPage from './ProfileSettingsPage'
import { ToastProvider } from './ToastProvider'
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  saveOnboardingMode,
} from '@/modules/09_settings/api'

const authState = {
  user: {
    email: 'test@example.com',
    fullName: 'בודקת בדיקות',
    phone: '',
    roleName: 'מנהלת פרויקטים',
  },
  reload: vi.fn(),
  // מצב הטמעה (הכרעה 28): הרמה בקונטקסט + הסטר-המקומי שהמסך קורא אחרי שמירה מוצלחת.
  onboardingMode: 0,
  updateOnboardingMode: vi.fn(),
}

// 🔴 **המוק שחסר כאן והפיל את ה-CI (03/09/2026, ‏PR #97).** ‏`ProfileSettingsPage` מייבא את
// `@/supabaseClient` **בזמן-הייבוא**, והמודול הזה קורא ל-`createClient` מיד — כלומר בלי המוק
// הקובץ קורס ב-`Error: supabaseUrl is required` עוד לפני שבדיקה אחת רצה.
// ⚠️ **ולמה זה עבר מקומית ונפל רק ב-CI, וזה המוקש האמיתי:** מקומית `.env.local` מספק
// `VITE_SUPABASE_URL`, ולרץ של GitHub אין קובץ כזה. ⇒ **`npm run gate` אינו מסוגל לראות את
// מחלקת-הכשל הזו** — שני סשנים הריצו אותו וקיבלו 83 קבצים / 2,165 בדיקות ירוקות על עץ שבו
// הסוויטה הזו שבורה. **השחזור הנאמן:** `VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx vitest run`.
// 🔒 **והמוק אינו מחליש שום בדיקה:** ‏`supabase` נוגע בקומפוננטה בשתי נקודות בלבד (‏`:189` ו-`:200`),
// שתיהן במסלול שינוי-הסיסמה — ואף אחת מחמש הבדיקות כאן אינה מגיעה לשם (הקובץ מצהיר בכותרת
// שלשונית-האבטחה מחוץ לתחום). אותו נוסח בדיוק כמו ב-15 קובצי-הבדיקות האחרים בריפו.
vi.mock('@/supabaseClient', () => ({
  supabase: { rpc: vi.fn(), from: vi.fn(), auth: { getSession: vi.fn() } },
}))

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }))

vi.mock('@/modules/09_settings/api', () => ({
  getNotificationPreferences: vi.fn(),
  saveNotificationPreferences: vi.fn(),
  saveOnboardingMode: vi.fn(),
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
  authState.onboardingMode = 0
  getNotificationPreferences.mockResolvedValue({
    emailNewProjects: false,
    smsLastMinute: false,
    onboardingMode: 0,
  })
  saveNotificationPreferences.mockResolvedValue({ emailNewProjects: true, smsLastMinute: false })
  saveOnboardingMode.mockResolvedValue(2)
})

describe('NotificationsSection — הנוסח הנעול ואפס "(בקרוב)"', () => {
  it('שתי השורות מוצגות עם הנוסח הנעול (§3.7), ואין אף מופע של "(בקרוב)"', async () => {
    renderPage()
    await openNotificationsTab()

    expect(screen.getByText('מייל על פרויקטים חדשים')).toBeInTheDocument()
    // ✏️ 08/09/2026 (שלב 2, מדריך-הסגנון B8): "מודול 10" הוא ז'רגון-בנאים ולא טקסט-מסך —
    // הוסר. הנוסח נבדק כאן בלי מספר-מודול פנימי.
    expect(screen.getByText('ההתראות יתחילו להישלח בפועל כשמנוע ההתראות יופעל')).toBeInTheDocument()
    expect(screen.queryByText(/מודול 10/)).not.toBeInTheDocument()
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

  it('מתג-המייל אינו נוגע במצב-ההטמעה: הדלקתו שולחת רק את שתי העדפות-ההתראה (28⑭(א))', async () => {
    renderPage()
    const emailSwitch = await openNotificationsTab()
    fireEvent.click(emailSwitch)
    await waitFor(() => expect(saveNotificationPreferences).toHaveBeenCalledTimes(1))
    expect(saveOnboardingMode).not.toHaveBeenCalled()
  })
})

describe('NotificationsSection — מתג "מצב הטמעה" (הכרעה 28⑨(א), רמה 0/2)', () => {
  it('הבסיס: תווית ותיאור נעולים, והמתג כבוי כשהרמה 0', async () => {
    renderPage()
    await openNotificationsTab()
    expect(screen.getByText('מצב הטמעה')).toBeInTheDocument()
    expect(screen.getByText('מציג משפטי הסבר לצד כל מסך')).toBeInTheDocument()
    expect(screen.getByTestId('settings-onboarding-mode')).not.toBeChecked()
    // ברמה 0 אין Hint על המסך — השכבה כבויה.
    expect(screen.queryByTestId('hint-onboarding.self')).not.toBeInTheDocument()
  })

  it('רמה 2 בטעינה ⇒ המתג דלוק (קריאה: > 0 = דלוק)', async () => {
    getNotificationPreferences.mockResolvedValue({
      emailNewProjects: false,
      smsLastMinute: false,
      onboardingMode: 2,
    })
    renderPage()
    await openNotificationsTab()
    expect(screen.getByTestId('settings-onboarding-mode')).toBeChecked()
  })

  it('הדלקה שומרת 2 (לא true) דרך saveOnboardingMode בלבד, ומעדכנת את הקונטקסט אחרי השורה', async () => {
    renderPage()
    await openNotificationsTab()
    fireEvent.click(screen.getByTestId('settings-onboarding-mode'))

    await waitFor(() => expect(saveOnboardingMode).toHaveBeenCalledWith(2))
    expect(saveOnboardingMode.mock.calls[0][0]).not.toBe(true)
    // ההעדפות האחרות לא נשלחות — זו כל הסיבה לפונקציה הנפרדת.
    expect(saveNotificationPreferences).not.toHaveBeenCalled()
    await waitFor(() => expect(authState.updateOnboardingMode).toHaveBeenCalledWith(2))
    expect(await screen.findByText('ההגדרות נשמרו')).toBeInTheDocument()
    expect(screen.getByTestId('settings-onboarding-mode')).toBeChecked()
  })

  it('כיבוי שומר 0', async () => {
    getNotificationPreferences.mockResolvedValue({
      emailNewProjects: false,
      smsLastMinute: false,
      onboardingMode: 2,
    })
    saveOnboardingMode.mockResolvedValue(0)
    renderPage()
    await openNotificationsTab()
    fireEvent.click(screen.getByTestId('settings-onboarding-mode'))
    await waitFor(() => expect(saveOnboardingMode).toHaveBeenCalledWith(0))
    await waitFor(() => expect(authState.updateOnboardingMode).toHaveBeenCalledWith(0))
  })

  it('שמירה שנכשלת משחזרת את המתג, מציגה שגיאה, ואינה נוגעת בקונטקסט', async () => {
    saveOnboardingMode.mockRejectedValue(new Error('אין הרשאה לשנות את מצב ההטמעה.'))
    renderPage()
    await openNotificationsTab()
    const toggle = screen.getByTestId('settings-onboarding-mode')
    fireEvent.click(toggle)

    expect(await screen.findByText('אין הרשאה לשנות את מצב ההטמעה.')).toBeInTheDocument()
    await waitFor(() => expect(toggle).not.toBeChecked())
    expect(authState.updateOnboardingMode).not.toHaveBeenCalled()
  })

  it('כשהרמה בקונטקסט היא 2 — ה-Hint של המתג עצמו מוצג מתחתיו (הדוגמה המחייבת מהתוכנית)', async () => {
    authState.onboardingMode = 2
    renderPage()
    await openNotificationsTab()
    expect(screen.getByTestId('hint-onboarding.self')).toHaveTextContent(
      'ההסברים נועדו לשבוע-שבועיים הראשונים',
    )
  })
})
