// בדיקות-בסיס ל-UsersManagementPage — נכתב 08/09/2026, לפני שסשן מקביל מוסיף מתג-מצב-onboarding
// לכל שורה במסך הזה. עד עכשיו לא הייתה לקובץ הזה שום בדיקה אוטומטית (נמדד: אין *.test.* תחת
// src/modules/01_auth/), כלומר השינוי הקרוב עמד להיבדק רק בעין. הקובץ הזה נועל את ההתנהגות
// הקיימת - טעינת הטבלה, שגיאת-טעינה+נסה-שוב, ולידציית טופס-ההוספה, השבתת-משתמש (כולל כשל-RLS
// שקט) והגנת-עצמי - כדי שהתוספת הבאה תיבדק כ"לא שברתי כלום", לא רק כ"נראה טוב".
//
// 🔴 מוק ל-`@/supabaseClient` חובה: המסך הזה (מוקש-מודול מוצהר ב-01_auth/CLAUDE.md) קורא
// ל-`supabase.from(...)` ישירות בלי api.js, ו-`supabaseClient.js` קורא ל-`createClient` בזמן-
// הייבוא - בלי המוק הקובץ קורס ב-CI על `Error: supabaseUrl is required` עוד לפני שבדיקה אחת רצה
// (אותו מוקש בדיוק כמו ב-ProfileSettingsPage.test.jsx ובכל api.test.js אחר בריפו).
//
// בילדר-השרשרתי + תור-פר-טבלה מועתקים מ-05_logistics/api.test.js (עוגן-גריפ `makeChain` שם) -
// לא נוסח שני. `useConfirm`/`useToast` זורקים מחוץ ל-Provider, ולכן עוטפים ב-ConfirmProvider+
// ToastProvider האמיתיים (לא mock), כמו SalaryReportDialog.test.jsx.
//
// 🧨 מוקש-סביבה (jsdom), כמו ב-CustomerFormDialog.test.jsx: פתיחת ה-Select (Radix) דורכת על
// `react-use-size` שקורא `new ResizeObserver(...)` בלי guard, ו-Radix Select קורא
// `element.scrollIntoView(...)` כשהוא ממקד את הפריט הנבחר - אף אחד מהם לא קיים ב-jsdom.
// הפוליפילים הזעירים למטה מקומיים לקובץ הזה בלבד.

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import { ToastProvider } from '@/components/ToastProvider'
import UsersManagementPage from './UsersManagementPage'

vi.mock('@/supabaseClient', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn(), auth: { getSession: vi.fn() } },
}))

const CEO_EMAIL = 'ceo@regin.co.il'

const authState = {
  user: { email: CEO_EMAIL, fullName: 'ישי כהן', roleName: 'מנכ"ל', phone: '050-1111111' },
  // מצב הטמעה (הכרעה 28⑨(ב)): הסטר-המקומי שהמסך קורא כשהמנכ"ל מדליק לעצמו.
  updateOnboardingMode: vi.fn(),
}
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }))

// עמודת "מצב הטמעה" כותבת דרך api.js של מודול 9 (הטבלה שלו) — לא דרך supabase.from ישירות.
vi.mock('@/modules/09_settings/api', () => ({
  listOnboardingModes: vi.fn(),
  saveOnboardingMode: vi.fn(),
}))

import { supabase } from '@/supabaseClient'
import { listOnboardingModes, saveOnboardingMode } from '@/modules/09_settings/api'

// ── בילדר-שרשרתי + תור-פר-טבלה (מועתק מ-05_logistics/api.test.js, `makeChain`) ──
function makeChain(result) {
  const builder = {}
  for (const method of ['select', 'eq', 'order', 'update', 'insert']) {
    builder[method] = vi.fn(() => builder)
  }
  builder.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return builder
}

let usersQueue = []
let rolesQueue = []
let usersBuilders = [] // כל הבילדרים שהוחזרו בפועל ל-supabase.from('users'), לפי סדר-קריאה

function setupFrom() {
  supabase.from.mockImplementation((table) => {
    if (table === 'users') {
      if (!usersQueue.length) throw new Error('בדיקה לא הכינה תוצאה מתוזמנת לטבלה "users"')
      const builder = makeChain(usersQueue.shift())
      usersBuilders.push(builder)
      return builder
    }
    if (table === 'roles') {
      if (!rolesQueue.length) throw new Error('בדיקה לא הכינה תוצאה מתוזמנת לטבלה "roles"')
      return makeChain(rolesQueue.shift())
    }
    throw new Error(`טבלה לא צפויה בבדיקה: "${table}"`)
  })
}

// שלושה משתמשים שונים בשם/תפקיד/סטטוס - אחד מהם המשתמש הנוכחי (CEO_EMAIL).
function baseUsers() {
  return [
    {
      email: CEO_EMAIL,
      full_name: 'ישי כהן',
      phone: '050-1111111',
      status: 'active',
      role_id: 1,
      roles: { role_name: 'מנכ"ל' },
    },
    {
      email: 'dana@regin.co.il',
      full_name: 'דנה לוי',
      phone: '050-2222222',
      status: 'active',
      role_id: 2,
      roles: { role_name: 'מנהלת פרויקטים' },
    },
    {
      email: 'noa@regin.co.il',
      full_name: 'נועה ברק',
      phone: null,
      status: 'inactive',
      role_id: 3,
      roles: { role_name: 'דיילת' },
    },
  ]
}

function baseRoles() {
  return [
    { role_id: 1, role_name: 'מנכ"ל' },
    { role_id: 2, role_name: 'מנהלת פרויקטים' },
    { role_id: 3, role_name: 'דיילת' },
  ]
}

function queueSuccessfulLoad() {
  usersQueue.push({ data: baseUsers(), error: null })
  rolesQueue.push({ data: baseRoles(), error: null })
}

function renderPage() {
  return render(
    <ConfirmProvider>
      <ToastProvider>
        <UsersManagementPage />
      </ToastProvider>
    </ConfirmProvider>,
  )
}

// פותחת את דיאלוג ההוספה ומחכה שהטופס יעלה (השדה "שם מלא" זמין).
async function openAddDialog() {
  fireEvent.click(screen.getByRole('button', { name: '+ הוספת משתמש חדש' }))
  return screen.findByPlaceholderText('שם פרטי ומשפחה')
}

beforeAll(() => {
  // ר' הערת-הראש - שני הפוליפילים שה-Select (Radix) דורך עליהם ב-jsdom.
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
  if (typeof Element.prototype.scrollIntoView !== 'function') {
    Element.prototype.scrollIntoView = () => {}
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  usersQueue = []
  rolesQueue = []
  usersBuilders = []
  setupFrom()
  authState.user.roleName = 'מנכ"ל'
  listOnboardingModes.mockResolvedValue({ 'dana@regin.co.il': 2 })
  saveOnboardingMode.mockImplementation(async (level) => level)
})

describe('UsersManagementPage — טעינה ורינדור הטבלה', () => {
  it('מרנדרת שם/דוא"ל/טלפון/תפקיד/סטטוס לשלושה משתמשים שונים', async () => {
    queueSuccessfulLoad()
    renderPage()

    await screen.findByText('ישי כהן')

    expect(screen.getByText('ישי כהן')).toBeInTheDocument()
    expect(screen.getByText(CEO_EMAIL)).toBeInTheDocument()
    expect(screen.getByText('050-1111111')).toBeInTheDocument()
    expect(screen.getByText('מנכ"ל')).toBeInTheDocument()

    expect(screen.getByText('דנה לוי')).toBeInTheDocument()
    expect(screen.getByText('dana@regin.co.il')).toBeInTheDocument()
    expect(screen.getByText('מנהלת פרויקטים')).toBeInTheDocument()

    expect(screen.getByText('נועה ברק')).toBeInTheDocument()
    expect(screen.getByText('noa@regin.co.il')).toBeInTheDocument()
    expect(screen.getByText('דיילת')).toBeInTheDocument()
    // טלפון חסר מוצג כ-"—" ולא ריק/undefined.
    expect(screen.getByText('—')).toBeInTheDocument()

    // תגי-סטטוס: שני פעילים, אחת לא-פעילה.
    expect(screen.getAllByText('פעיל')).toHaveLength(2)
    expect(screen.getByText('לא פעיל')).toBeInTheDocument()
  })

  it('כשל-טעינה מציג את הנוסח הנעול וכפתור "נסי שוב" עם test id ייעודי', async () => {
    usersQueue.push({ data: null, error: { message: 'network fail' } })
    rolesQueue.push({ data: [], error: null })
    renderPage()

    expect(await screen.findByText('שגיאה בטעינת רשימת המשתמשים.')).toBeInTheDocument()
    const retryButton = screen.getByTestId('users-load-retry')
    expect(retryButton).toBeInTheDocument()

    // "נסה שוב" באמת טוען מחדש - לא רק כפתור-תצוגה.
    queueSuccessfulLoad()
    fireEvent.click(retryButton)
    await screen.findByText('ישי כהן')
    expect(screen.queryByText('שגיאה בטעינת רשימת המשתמשים.')).not.toBeInTheDocument()
  })
})

describe('UsersManagementPage — דיאלוג הוספת משתמש: ולידציה', () => {
  it('שם באורך תו אחד מציג "שם מלא חייב להכיל לפחות 2 תווים." ואינו נשלח', async () => {
    queueSuccessfulLoad()
    renderPage()
    await screen.findByText('ישי כהן')

    const nameInput = await openAddDialog()
    const callsBefore = supabase.from.mock.calls.length
    fireEvent.change(nameInput, { target: { value: 'א' } })
    fireEvent.click(screen.getByRole('button', { name: 'הוסיפי משתמש' }))

    expect(await screen.findByText('שם מלא חייב להכיל לפחות 2 תווים.')).toBeInTheDocument()
    // אין קריאת-רשת נוספת מעבר לטעינה הראשונית - הולידציה נעצרת לפני כל מגע ב-Supabase.
    expect(supabase.from.mock.calls.length).toBe(callsBefore)
  })

  it('דוא"ל לא תקין מציג "יש להזין כתובת דוא"ל תקינה." — רק אחרי שתפקיד כבר נבחר (הוא נבדק קודם)', async () => {
    queueSuccessfulLoad()
    renderPage()
    await screen.findByText('ישי כהן')

    const nameInput = await openAddDialog()
    const callsBefore = supabase.from.mock.calls.length
    fireEvent.change(nameInput, { target: { value: 'רותם אבני' } })

    // בלי בחירת-תפקיד ההודעה הייתה "יש לבחור תפקיד." - קודם בוחרים תפקיד כדי לבודד
    // את בדיקת-הדוא"ל, בדיוק לפי סדר הבדיקות ב-handleSubmit.
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByRole('option', { name: 'דיילת' }))

    fireEvent.change(screen.getByPlaceholderText('email@regin.co.il'), {
      target: { value: 'not-an-email' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'הוסיפי משתמש' }))

    expect(await screen.findByText('יש להזין כתובת דוא"ל תקינה.')).toBeInTheDocument()
    // גם כאן: תקלת-הולידציה נתפסת לפני insert לשרת - אין קריאת-Supabase נוספת.
    expect(supabase.from.mock.calls.length).toBe(callsBefore)
  })
})

describe('UsersManagementPage — השבתת משתמש', () => {
  it('לחיצה על "השבת משתמש" פותחת אישור עם שם המשתמש, ומאשרת שולחת update({status:"inactive"}) עם eq על הדוא"ל', async () => {
    queueSuccessfulLoad()
    // התוצאה שתחזור מקריאת ה-update בפועל (הצלחה) - כדי לבודד קודם את מסלול-ההצלחה.
    usersQueue.push({ data: [{ email: 'dana@regin.co.il', status: 'inactive' }], error: null })
    queueSuccessfulLoad() // הרענון אחרי הצלחה קורא שוב ל-loadUsersAndRoles
    renderPage()
    await screen.findByText('ישי כהן')

    fireEvent.click(screen.getByTitle('השביתי משתמש'))

    expect(await screen.findByTestId('confirm-dialog-title')).toHaveTextContent('השבתת משתמש')
    expect(screen.getByTestId('confirm-dialog-message')).toHaveTextContent('דנה לוי')

    fireEvent.click(screen.getByTestId('confirm-dialog-confirm'))

    // שלוש קריאות ל-'users' בסך-הכול: טעינה ראשונית · ה-update עצמו · רענון-אחרי-הצלחה.
    // מחכים שהבילדר השני (אינדקס 1 = קריאת ה-update) ייווצר, ואז בודקים בדיוק מה נשלח בו -
    // זו ההוכחה שה-update קרה עם הארגומנטים הנכונים, לא רק ש"שום שגיאה לא נזרקה".
    await waitFor(() => expect(usersBuilders.length).toBeGreaterThanOrEqual(2))
    const updateBuilder = usersBuilders[1]
    expect(updateBuilder.update).toHaveBeenCalledWith({ status: 'inactive' })
    expect(updateBuilder.eq).toHaveBeenCalledWith('email', 'dana@regin.co.il')

    await waitFor(() => expect(usersBuilders.length).toBe(3)) // רענון-אחרי-הצלחה קרה
    expect(usersQueue).toHaveLength(0)
  })

  it('{data: [], error: null} (חסימת RLS שקטה) מציג "השבתת המשתמש נכשלה. נסי שוב." ואינו מרענן', async () => {
    queueSuccessfulLoad()
    usersQueue.push({ data: [], error: null }) // תוצאת ה-update - חסימה שקטה
    renderPage()
    await screen.findByText('ישי כהן')

    fireEvent.click(screen.getByTitle('השביתי משתמש'))
    await screen.findByTestId('confirm-dialog-title')
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm'))

    expect(await screen.findByTestId('toast-error')).toHaveTextContent(
      'השבתת המשתמש נכשלה. נסי שוב.',
    )
    // ה-update אכן נשלח (לא רק "לא קרה כלום") - התוצאה שקטה, {data:[], error:null}, ולכן
    // המסך חייב לזהות זאת לבד ולא להסתפק בהיעדר-שגיאה.
    const updateBuilder = usersBuilders[1]
    expect(updateBuilder.update).toHaveBeenCalledWith({ status: 'inactive' })
    expect(updateBuilder.eq).toHaveBeenCalledWith('email', 'dana@regin.co.il')
    // אין רענון אחרי כשל - התור עדיין ריק (לא צרכנו עוד קריאת-users).
    expect(usersQueue.length).toBe(0)
  })
})

describe('UsersManagementPage — הגנת-עצמי', () => {
  it('כפתור ההשבתה של המשתמש הנוכחי עצמו מושבת עם title "לא ניתן להשבית את החשבון שלך"', async () => {
    queueSuccessfulLoad()
    renderPage()
    await screen.findByText('ישי כהן')

    const selfButton = screen.getByTitle('לא ניתן להשבית את החשבון שלך')
    expect(selfButton).toBeDisabled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// עמודת "מצב הטמעה" — הדלת המנוהלת (הכרעה 28⑨(ב) · 28⑭), נוספה 08/09/2026
// ═══════════════════════════════════════════════════════════════════════════════
describe('UsersManagementPage — עמודת "מצב הטמעה" (מנכ"ל בלבד)', () => {
  it('המנכ"ל רואה את העמודה, ומתג-השורה משקף את הרמה שנטענה (2 = דלוק, אין שורה = כבוי)', async () => {
    queueSuccessfulLoad()
    renderPage()
    await screen.findByText('ישי כהן')

    expect(screen.getByText('מצב הטמעה')).toBeInTheDocument()
    expect(listOnboardingModes).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('users-onboarding-dana@regin.co.il')).toBeChecked()
    expect(screen.getByTestId(`users-onboarding-${CEO_EMAIL}`)).not.toBeChecked()
    expect(screen.getByTestId('users-onboarding-noa@regin.co.il')).not.toBeChecked()
  })

  it('מי שאינה מנכ"ל אינה רואה את העמודה, והרמות אינן נטענות כלל', async () => {
    authState.user.roleName = 'מנהלת פרויקטים'
    queueSuccessfulLoad()
    renderPage()
    await screen.findByText('ישי כהן')

    expect(screen.queryByText('מצב הטמעה')).not.toBeInTheDocument()
    expect(screen.queryByTestId('users-onboarding-dana@regin.co.il')).not.toBeInTheDocument()
    expect(listOnboardingModes).not.toHaveBeenCalled()
  })

  it('הדלקה למשתמשת אחרת שולחת 2 (לא true) עם ה-email שלה, ואינה נוגעת בקונטקסט של המנכ"ל', async () => {
    queueSuccessfulLoad()
    renderPage()
    await screen.findByText('ישי כהן')

    const noaSwitch = screen.getByTestId('users-onboarding-noa@regin.co.il')
    fireEvent.click(noaSwitch)

    await waitFor(() =>
      expect(saveOnboardingMode).toHaveBeenCalledWith(2, { email: 'noa@regin.co.il' }),
    )
    expect(saveOnboardingMode.mock.calls[0][0]).not.toBe(true)
    expect(await screen.findByTestId('toast-success')).toHaveTextContent('מצב הטמעה הודלק')
    expect(noaSwitch).toBeChecked()
    expect(authState.updateOnboardingMode).not.toHaveBeenCalled()
  })

  it('כיבוי שולח 0', async () => {
    queueSuccessfulLoad()
    renderPage()
    await screen.findByText('ישי כהן')

    fireEvent.click(screen.getByTestId('users-onboarding-dana@regin.co.il'))
    await waitFor(() =>
      expect(saveOnboardingMode).toHaveBeenCalledWith(0, { email: 'dana@regin.co.il' }),
    )
    expect(await screen.findByTestId('toast-success')).toHaveTextContent('מצב הטמעה כובה')
  })

  it('המנכ"ל מדליק לעצמו ⇒ גם הקונטקסט מתעדכן, כדי שההסברים יידלקו לו חי', async () => {
    queueSuccessfulLoad()
    renderPage()
    await screen.findByText('ישי כהן')

    fireEvent.click(screen.getByTestId(`users-onboarding-${CEO_EMAIL}`))
    await waitFor(() => expect(saveOnboardingMode).toHaveBeenCalledWith(2, { email: CEO_EMAIL }))
    await waitFor(() => expect(authState.updateOnboardingMode).toHaveBeenCalledWith(2))
  })

  it('שמירה שנכשלת (למשל 0 שורות — "אין הרשאה") משחזרת את המתג ומציגה שגיאה', async () => {
    saveOnboardingMode.mockRejectedValue(new Error('אין הרשאה לשנות את מצב ההטמעה.'))
    queueSuccessfulLoad()
    renderPage()
    await screen.findByText('ישי כהן')

    const noaSwitch = screen.getByTestId('users-onboarding-noa@regin.co.il')
    fireEvent.click(noaSwitch)

    expect(await screen.findByTestId('toast-error')).toHaveTextContent(
      'אין הרשאה לשנות את מצב ההטמעה.',
    )
    await waitFor(() => expect(noaSwitch).not.toBeChecked())
    expect(authState.updateOnboardingMode).not.toHaveBeenCalled()
  })

  it('כשל בטעינת הרמות אינו מפיל את המסך: הטבלה עולה, והעמודה מציגה "—" במקום מתג "כבוי" כוזב', async () => {
    listOnboardingModes.mockRejectedValue(new Error('net'))
    queueSuccessfulLoad()
    renderPage()
    await screen.findByText('ישי כהן')

    expect(screen.getByText('דנה לוי')).toBeInTheDocument()
    expect(screen.queryByTestId('users-onboarding-dana@regin.co.il')).not.toBeInTheDocument()
    expect(screen.getAllByTitle('מצב ההטמעה לא נטען')).toHaveLength(3)
  })
})
