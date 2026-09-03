// בדיקות לשונית-הפרויקטים בכרטיס-הלקוח (משטח 8, מודול 6 · עמוד מודול 2) — פאזה 3, סקירה ⓹:
// המסך הזה עלה בלי שום בדיקת-רכיב. ה-API ממוקק כולו (./api של המודול · 03_quotes/api ·
// src/api/email) — אין Supabase בבדיקה; ההרשאות דרך mock של AuthContext, אותו סגנון-בית
// כמו ProjectCardPage.test.jsx/LogisticsTab.test.jsx.
//
// 🔴 בחירה מובנית (ר' הדוח): מרנדרת את **העמוד המלא**, לא ProjectsTabContent מבודדת.
// שניים מששת-הדרישות חיים ברמת-העמוד ולא בתוך הלשונית — תגית-מונה-הלשונית ('—' מול הרשאה)
// ושני אריחי-המדד ('מספר אירועים'/'אירוע אחרון', deriveProjectsTileData/lastEventTileDisplay
// שבקובץ עצמו) — כך שחילוץ-לשונית-בלבד לא היה מכסה אותם בלי לייצא עוד שכבה. מיקוק כל
// שאילתות-העמוד (במקום רק getCustomerProjects/getCustomerScreenParams) הוא המחיר של הבחירה
// הזו, לא "יותר מדי" — הן חייבות להצליח כדי שהעמוד יצא מ-loading בכלל.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/components/ToastProvider'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import CustomerDetailsPage from './CustomerDetailsPage'
import {
  getCustomer,
  getCustomerProjects,
  getCustomerScreenParams,
  listCustomerContacts,
} from './api'
import {
  getPricingCatalog,
  getQuoteScreenParams,
  listQuotesByCustomer,
} from '@/modules/03_quotes/api'
import { getSentEntityIds } from '@/api/email'
import { DORMANT_THRESHOLD_PARAM_NAME } from '@/lib/customerProjects'

vi.mock('./api', () => ({
  getCustomer: vi.fn(),
  getCustomerProjects: vi.fn(),
  getCustomerScreenParams: vi.fn(),
  listCustomerContacts: vi.fn(),
}))
vi.mock('@/modules/03_quotes/api', () => ({
  approveQuote: vi.fn(),
  getPricingCatalog: vi.fn(),
  getQuoteScreenParams: vi.fn(),
  listQuotesByCustomer: vi.fn(),
  rejectQuote: vi.fn(),
}))
vi.mock('@/api/email', () => ({
  getSentEntityIds: vi.fn(),
}))

// הרשאות ניתנות-להחלפה פר-בדיקה — אותה תבנית כמו ProjectCardPage.test.jsx (③.1).
const authState = { permissions: { פרויקטים: 'view' } }
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

// תאריכים יחסיים להיום האמיתי (אותו חישוב-UTC כמו eventDaysFromToday, כדי שלא ייווצר פער
// סביב חצות) — זהה בייט לתבנית שכבר קיימת ב-ProjectsPage.test.jsx/ProjectCardPage.test.jsx.
function offsetIso(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
}

function customerFixture(overrides) {
  return {
    customer_id: 46,
    company_name: 'מדיטק פתרונות בע"מ',
    company_number: '512345678',
    customer_type: 'private_company',
    status: 'active',
    // N2: הצורה שהשאילתה באמת מחזירה — איש-הקשר הראשי הוא שורת-בת עם `is_primary`,
    // לא עמודות על הלקוח. פיקסטורה שטוחה כאן הייתה עוברת בירוק גם על מימוש שבור.
    customer_contacts: [
      {
        contact_id: 1,
        contact_name: 'דנה כהן',
        phone: '050-1234567',
        email: 'dana@meditech.co.il',
        is_primary: true,
      },
    ],
    discount_percent: 0,
    marketing_consent: false,
    ...overrides,
  }
}

function projectRow(overrides) {
  return {
    project_id: 1,
    event_name: 'אירוע',
    final_event_date: offsetIso(9),
    project_status: 'in_progress',
    quote_id: null,
    cancelled_at: null,
    cancel_type: null,
    cancelled_by: null,
    cancel_reason: null,
    quotes: null,
    // 🆕 מ8 · 4.2 — `getCustomerProjects` מצרפת לכל שורה את שינויי-התכולה שלה
    // (‏`attachProjectChanges`, RC-6). מערך ריק = "נבדק, אין שינויים"; `null` = לא ידוע.
    // הפיקסצ'ר נושא את השדה כי בלעדיו העמודה "סכום" מציגה '—' בכוונה — ובדיקה שעובדת על
    // שורה שהמסך לעולם לא יקבל היא בדיקה שמאשרת את הדבר הלא-נכון.
    project_changes: [],
    // 🆕 מ8 · 4.2 — שני שדות-המשוב שה-select הורחב אליהם (ה8): הממוצע נגזר מהם.
    feedback_status: 'not_sent',
    feedback_score: null,
    ...overrides,
  }
}

// ברירת-המחדל של כל שאילתות-העמוד — אין הצעות/אנשי-קשר/פרמטרי-הצעה, כדי ש"טעינה" תסתיים
// בלי להפיל את שאר הכרטיס; רק getCustomerProjects/getCustomerScreenParams משתנים פר-בדיקה.
function mockPageApi({ projects = [], dormantThresholdDays, projectsRejectOnce = false } = {}) {
  getCustomer.mockResolvedValue(customerFixture())
  listCustomerContacts.mockResolvedValue([])
  listQuotesByCustomer.mockResolvedValue([])
  getQuoteScreenParams.mockResolvedValue([])
  getPricingCatalog.mockResolvedValue({ products: [], tiers: [], params: [] })
  getSentEntityIds.mockResolvedValue(new Set())
  getCustomerScreenParams.mockResolvedValue(
    dormantThresholdDays == null
      ? []
      : [{ param_name: DORMANT_THRESHOLD_PARAM_NAME, param_value: String(dormantThresholdDays) }],
  )
  if (projectsRejectOnce) {
    getCustomerProjects.mockRejectedValueOnce(new Error('network'))
  } else {
    getCustomerProjects.mockResolvedValue(projects)
  }
}

function renderCustomerPage() {
  return render(
    <ToastProvider>
      <ConfirmProvider>
        <MemoryRouter initialEntries={['/customers/46']}>
          <Routes>
            <Route path="/customers/:customerId" element={<CustomerDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </ConfirmProvider>
    </ToastProvider>,
  )
}

async function openProjectsTab() {
  await screen.findByTestId('customer-page')
  fireEvent.click(screen.getByTestId('customer-tab-projects'))
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.permissions = { פרויקטים: 'view' }
})

describe('לשונית-פרויקטים — ריק-אמיתי, ואריח "אירוע אחרון": מעולם-לא-התקיים', () => {
  it('שני המשפטים הנעולים במצב-הריק, ותווית-E3, ואריח "אירוע אחרון" מציג "טרם התקיים אירוע"', async () => {
    mockPageApi({ projects: [] })
    renderCustomerPage()
    await openProjectsTab()

    const empty = await screen.findByTestId('customer-no-projects')
    expect(empty).toHaveTextContent('עדיין לא נוצר פרויקט ללקוח הזה.')
    expect(empty).toHaveTextContent('פרויקט נולד מאישור הצעת מחיר.')

    // E3 (🟢 RULED 14/08): התווית הנעולה — מוצגת בכל מצב של העמוד, לא רק כאן.
    // 🔄 04/09/2026: האריח הראשון הוא "רווח גולמי מהלקוח" (הכרעת-ישי) — התווית הנעולה החדשה.
    expect(screen.getByText('רווח גולמי מהלקוח')).toBeInTheDocument()

    // מצב neverHeld: אין פרויקטים בכלל ⇒ אין "הראשון מתוכנן ל-", רק ה-emptyText הנעול.
    expect(screen.getByTestId('metric-last-event')).toHaveTextContent('טרם התקיים אירוע')
  })
})

describe('לשונית-פרויקטים — אין הרשאה', () => {
  it('🔒 + המשפט הנעול, ומונה-הלשונית מציג "—" ולעולם לא "0"', async () => {
    authState.permissions = {} // אין 'פרויקטים' בכלל בהרשאות — לא view ולא edit.
    mockPageApi({ projects: [] })
    renderCustomerPage()
    await openProjectsTab()

    const empty = await screen.findByTestId('customer-projects-no-permission')
    expect(within(empty).getByText('🔒')).toBeInTheDocument()
    expect(empty).toHaveTextContent('אין לך הרשאה לצפות בפרויקטים.')

    const tab = screen.getByTestId('customer-tab-projects')
    expect(within(tab).getByText('—')).toBeInTheDocument()
    expect(within(tab).queryByText('0')).not.toBeInTheDocument()

    // אין הרשאה נבדק *לפני* השליחה (screens-approved ⑤) — אין קריאת-רשת בכלל.
    expect(getCustomerProjects).not.toHaveBeenCalled()
  })
})

describe('לשונית-פרויקטים — כשל-טעינה ו"נסה שוב"', () => {
  it('הודעת-השגיאה הנעולה + כפתור "נסה שוב", וניסיון חוזר שמצליח מחזיר את מצב-הריק', async () => {
    mockPageApi({ projects: [], projectsRejectOnce: true })
    renderCustomerPage()
    await openProjectsTab()

    expect(await screen.findByTestId('customer-projects-error')).toHaveTextContent(
      'שגיאה בטעינת היסטוריית הפרויקטים.',
    )
    const retry = screen.getByTestId('customer-projects-retry')
    expect(retry).toHaveTextContent('נסה שוב')

    getCustomerProjects.mockResolvedValueOnce([])
    fireEvent.click(retry)
    expect(await screen.findByTestId('customer-no-projects')).toBeInTheDocument()
  })
})

describe('לשונית-פרויקטים — ריק-אחרי-חיפוש (מעל 8 פרויקטים)', () => {
  it('"אין פרויקט התואם לחיפוש." + "נקה חיפוש" שבאמת מנקה את התיבה ומחזיר את השורות', async () => {
    const projects = Array.from({ length: 9 }, (_, i) =>
      projectRow({
        project_id: 200 + i,
        event_name: `אירוע מספר ${i + 1}`,
        final_event_date: offsetIso(10 + i),
      }),
    )
    mockPageApi({ projects })
    renderCustomerPage()
    await openProjectsTab()

    const search = await screen.findByTestId('customer-projects-search')
    fireEvent.change(search, { target: { value: 'לא-קיים-בשום-שורה' } })

    expect(await screen.findByTestId('customer-projects-no-results')).toHaveTextContent(
      'אין פרויקט התואם לחיפוש.',
    )
    fireEvent.click(screen.getByTestId('customer-projects-clear-search'))

    expect(search).toHaveValue('')
    expect(await screen.findByTestId('customer-project-200')).toBeInTheDocument()
  })
})

describe('לשונית-פרויקטים — רדום + מבוטל-עתידי + "מספר אירועים" בלי ₪', () => {
  it('אריח "אירוע אחרון" רדום-ענבר (סף 120 ממוקק, 150 ימים) ושורת-מבוטל ב"התקיימו"', async () => {
    const projects = [
      projectRow({
        project_id: 301,
        event_name: 'כנס עבר',
        final_event_date: offsetIso(-150),
        project_status: 'finished',
      }),
      projectRow({
        // עתידי — ובכל זאת נופל ל"התקיימו" כי בוטל (🔴 ㊲: מבוטל תמיד "היה אמור להתקיים").
        project_id: 302,
        event_name: 'ערב VIP',
        final_event_date: offsetIso(20),
        project_status: 'cancelled',
        cancelled_at: '2026-08-01T09:00:00Z',
        cancel_type: 'customer',
      }),
    ]
    mockPageApi({ projects, dormantThresholdDays: 120 })
    renderCustomerPage()
    await openProjectsTab()

    // "מספר אירועים" עובר כמחרוזת (String(count)) ולא דרך Money — מוקש-המוקאפ שבהערת-העמוד.
    const countTile = await screen.findByTestId('metric-event-count')
    expect(countTile).toHaveTextContent('2')
    expect(countTile).toHaveTextContent('אחד מהם בוטל')
    expect(countTile.textContent).not.toContain('₪')

    // "אירוע אחרון" — 150 ימים ≥ הסף הממוקק (120) ⇒ רדום-ענבר.
    expect(screen.getByTestId('metric-last-event')).toHaveTextContent('רדום · לפני 150 ימים')

    // שני הפרויקטים נופלים ל"התקיימו" (העתידי-המבוטל כלול) — "מתקרבים" לא מוצג כלל (④).
    expect(screen.queryByText('מתקרבים')).not.toBeInTheDocument()
    expect(screen.getByText('התקיימו')).toBeInTheDocument()

    const cancelledRow = screen.getByTestId('customer-project-302')
    expect(cancelledRow).toHaveTextContent('היה אמור להתקיים')
    const tag = within(cancelledRow).getByText('בוטל')
    expect(tag.className).toContain('border-dashed')

    // 🆕 מונה-הלשונית נספר **בתוך חלון-הזמן** (ברירת-מחדל 90 יום, הכרעת-ישי 04/09/2026) —
    // ולכן הוא "1" ולא "2": פרויקט 301 (150 יום אחורה) מחוץ לחלון, בעוד אריח "מספר אירועים"
    // שמעליי (metric-event-count) ממשיך לספור את כל ההיסטוריה — שני מדדים שונים בכוונה.
    expect(within(screen.getByTestId('customer-tab-projects')).getByText('1')).toBeInTheDocument()
  })
})

// 🆕 מודול 8 · צעד 4.2 — האריח החמישי בכרטיס-הלקוח (ה8 / §7.79), והמשפט הישן שנעלם.
describe('אריח "ממוצע משוב" (מ8 · ה8) — האוכלוסייה, ושורת-ההסבר שפרשה', () => {
  const answered = (id, score) =>
    projectRow({
      project_id: id,
      event_name: `אירוע ${id}`,
      final_event_date: offsetIso(-30),
      project_status: 'finished',
      feedback_status: 'completed',
      feedback_score: score,
    })

  it('מציג את הממוצע של **המשיבים בלבד**, עם מונה-המשיבים בשורת-המשנה', async () => {
    const projects = [
      answered(401, 5),
      answered(402, 4),
      // 🔴 שלושת אלה **אינם** באוכלוסייה: הסקר נשלח ולא נענה / לא נשלח / אין ציון.
      // בלי מסנן ה8 הממוצע היה 3.5 במקום 4.5 — זה בדיוק הפגם ש-§7.79 מנה.
      projectRow({ project_id: 403, feedback_status: 'sent', feedback_score: 1 }),
      projectRow({ project_id: 404, feedback_status: 'no_response', feedback_score: 2 }),
      projectRow({ project_id: 405 }),
    ]
    mockPageApi({ projects })
    renderCustomerPage()
    await screen.findByTestId('customer-page')

    const tile = await screen.findByTestId('metric-feedback')
    expect(tile).toHaveTextContent('ממוצע משוב')
    expect(tile).toHaveTextContent('4.5')
    expect(tile).toHaveTextContent('מ-2 משובים שהתקבלו')
  })

  it('אין ולו משוב אחד שהושלם ⇒ "אין נתונים עדיין", לא "0 ★"', async () => {
    mockPageApi({ projects: [projectRow({ project_id: 411 })] })
    renderCustomerPage()
    await screen.findByTestId('customer-page')

    const tile = await screen.findByTestId('metric-feedback')
    expect(tile).toHaveTextContent('אין נתונים עדיין')
    expect(tile.textContent).not.toContain('★')
  })

  // כלל 13(ח): יכולת שנבנתה ⇒ הטקסט שמתאר אותה כלא-קיימת חייב להיעלם באותו סשן.
  it('🔴 שורת "ממתין למודול הבא — ממוצע משוב (מודול 8)" אינה על המסך יותר', async () => {
    mockPageApi({ projects: [] })
    renderCustomerPage()
    await screen.findByTestId('customer-page')

    expect(screen.queryByText(/ממתין למודול הבא/)).not.toBeInTheDocument()
  })
})
