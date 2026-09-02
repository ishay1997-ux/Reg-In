// בדיקת עמודת-שביעות-הרצון ומסנן "טעון בירור" ברשימת-הלקוחות (A3 — מודול 8 · צעד 4.2).
//
// 🔴 **למה נולד קובץ-בדיקה חדש דווקא כאן:** ל-`CustomersPage` לא הייתה ולו בדיקת-רכיב אחת
// (מתועד ב-`docs/micro_guides/module-2.md §9`), וצעד 4.2 מדליק בה **עמודה חיה ומסנן חדש**
// על מסך שכבר ממוזג ורץ בייצור. הלוגיקה הטהורה נבדקת ב-`src/lib/customers.test.js`; מה
// שנבדק כאן הוא בדיוק מה שהיא **אינה** מכסה — החיווט: הזרקת `avg_feedback` לשורה, הצ'יפ,
// והתא. ‏🚫 הבדיקה **אינה** מנסה לכסות את שאר העמוד (שיווק/ארכוב/מיון) — זה היה מרחיב את
// צעד 4.2 לעבודה שאיש לא ביקש.
//
// ה-API ממוקק כולו, בדיוק כמו ב-`CustomerDetailsPage.projects.test.jsx` — אין Supabase כאן.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ToastProvider'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import CustomersPage from './CustomersPage'
import { listCustomers, listProjectsForCustomerMetrics, getCustomerScreenParams } from './api'
import { getQuoteScreenParams, listQuotes } from '@/modules/03_quotes/api'

vi.mock('./api', () => ({
  listCustomers: vi.fn(),
  listProjectsForCustomerMetrics: vi.fn(),
  getCustomerScreenParams: vi.fn(),
  setCustomerStatus: vi.fn(),
  updateCustomer: vi.fn(),
  // נצרכות ע"י MarketingPanel, שמיובא ברמת-המודול (גם כשהדיאלוג סגור).
  getConsentedCustomers: vi.fn(),
  uploadMarketingFile: vi.fn(),
  getMarketingPublicUrl: vi.fn(),
  MARKETING_ALLOWED_MIME: [],
  MARKETING_MAX_BYTES: 0,
}))
vi.mock('@/modules/03_quotes/api', () => ({
  getQuoteScreenParams: vi.fn(),
  listQuotes: vi.fn(),
}))

const authState = { permissions: { לקוחות: 'edit' } }
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

function customerRow(id, name) {
  return {
    customer_id: id,
    company_name: name,
    company_number: `51400000${id}`,
    customer_type: 'private_company',
    // N2: הצורה שהשאילתה באמת מחזירה — איש-הקשר הראשי הוא שורת-בת עם `is_primary`,
    // לא עמודות על הלקוח. פיקסטורה שטוחה כאן הייתה עוברת בירוק גם על מימוש שבור.
    customer_contacts: [
      {
        contact_id: id,
        contact_name: 'דנה כהן',
        phone: '050-1234567',
        email: `c${id}@example.co.il`,
        is_primary: true,
      },
    ],
    discount_percent: 0,
    marketing_consent: false,
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
  }
}

// שורות `listProjectsForCustomerMetrics` **בצורת-ה-DB שהרחבנו אליה** (ה8): שני שדות-המשוב
// נוסף ל-`customer_id/final_event_date/project_status`. בדיקה על צורה מומצאת הייתה מאשרת
// select שהמסך לא באמת מקבל.
function projectRow(customerId, feedbackStatus, score) {
  return {
    customer_id: customerId,
    final_event_date: '2026-07-01',
    project_status: 'finished',
    feedback_status: feedbackStatus,
    feedback_score: score,
  }
}

function mockPage(
  projectRows,
  screenParams = [{ param_name: 'סף_שביעות_רצון', param_value: '3' }],
) {
  listCustomers.mockResolvedValue([customerRow(1, 'טכנולוגיות אלפא'), customerRow(2, 'ביתא בע"מ')])
  listQuotes.mockResolvedValue([])
  getQuoteScreenParams.mockResolvedValue([])
  // 🔄 סף "טעון בירור" ירד ל-`params` (מודול 9 · צעד 2.3) ונטען דרך `getCustomerScreenParams`,
  // באותה שאילתה שכבר מביאה את סף-הרדימות. הצורה כאן היא **שורות**, כמו שהפונקציה מחזירה.
  getCustomerScreenParams.mockResolvedValue(screenParams)
  listProjectsForCustomerMetrics.mockResolvedValue(projectRows)
}

function renderPage() {
  return render(
    <ToastProvider>
      <ConfirmProvider>
        <MemoryRouter initialEntries={['/customers']}>
          <CustomersPage />
        </MemoryRouter>
      </ConfirmProvider>
    </ToastProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.permissions = { לקוחות: 'edit' }
})

describe('רשימת-הלקוחות — עמודת שביעות-רצון (מ8 · 4.2)', () => {
  it('הכוכבים מציגים את ממוצע-המשיבים, ולקוח בלי משוב שהושלם נשאר "אין נתונים עדיין"', async () => {
    // אלפא: 5 ו-4 שענו ⇒ 4.5 · ה-1 של סקר-שנשלח-ולא-נענה **מודר** (ה8) — אחרת היה 3.3.
    // ביתא: הסקר נשלח ולא נענה ⇒ אין נתון בכלל.
    mockPage([
      projectRow(1, 'completed', 5),
      projectRow(1, 'completed', 4),
      projectRow(1, 'sent', 1),
      projectRow(2, 'sent', null),
    ])
    renderPage()

    const alpha = await screen.findByTestId('customer-row-1')
    expect(alpha).toHaveTextContent('4.5')
    expect(within(alpha).queryByText('טעון בירור')).not.toBeInTheDocument()

    const beta = screen.getByTestId('customer-row-2')
    expect(beta).toHaveTextContent('אין נתונים עדיין')
    expect(beta.textContent).not.toContain('★')
  })

  it('ממוצע מתחת ל-3 מקבל את תווית "טעון בירור" (ה16/§7.80 — אדום <3)', async () => {
    mockPage([projectRow(1, 'completed', 2), projectRow(1, 'completed', 2)])
    renderPage()

    const alpha = await screen.findByTestId('customer-row-1')
    expect(within(alpha).getByText('טעון בירור')).toBeInTheDocument()
  })
})

describe('רשימת-הלקוחות — צ\'יפ "טעון בירור" (A3)', () => {
  it('מסנן ללקוחות שמתחת לסף, ולחיצה שנייה מכבה', async () => {
    mockPage([projectRow(1, 'completed', 2), projectRow(2, 'completed', 5)])
    renderPage()

    await screen.findByTestId('customer-row-1')
    expect(screen.getByTestId('customer-row-2')).toBeInTheDocument()

    const chip = screen.getByTestId('customers-preset-low-satisfaction')
    expect(chip).toHaveTextContent('טעון בירור')
    fireEvent.click(chip)

    expect(screen.getByTestId('customer-row-1')).toBeInTheDocument()
    expect(screen.queryByTestId('customer-row-2')).not.toBeInTheDocument()
    expect(chip).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(chip)
    expect(screen.getByTestId('customer-row-2')).toBeInTheDocument()
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })

  it('🔴 לקוח שאין עליו נתון-משוב **אינו** נכנס לרשימת-הטיפול', async () => {
    // "אין נתון" אינו "לא מרוצה". לקוח שאיש לא ענה לו לא אמור לקבל טלפון-בירור.
    mockPage([projectRow(1, 'completed', 2), projectRow(2, 'not_sent', null)])
    renderPage()

    await screen.findByTestId('customer-row-1')
    fireEvent.click(screen.getByTestId('customers-preset-low-satisfaction'))

    expect(screen.getByTestId('customer-row-1')).toBeInTheDocument()
    expect(screen.queryByTestId('customer-row-2')).not.toBeInTheDocument()
  })

  it('כשל בטעינת-הפרויקטים אינו מפיל את הרשימה — הכוכבים נשארים ריקים ("לא בכוח")', async () => {
    mockPage([])
    listProjectsForCustomerMetrics.mockRejectedValue(new Error('network'))
    renderPage()

    const alpha = await screen.findByTestId('customer-row-1')
    expect(alpha).toHaveTextContent('אין נתונים עדיין')
    expect(screen.getByTestId('customers-table')).toBeInTheDocument()
  })
})
