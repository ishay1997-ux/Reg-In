// בדיקת הדפדוף (`Pager`) ברשימת-הלקוחות — מעבר-האחידות (הכרעת-ישי 04/09/2026, `src/lib/listWindow.js`).
//
// 🔴 ללקוחות אין תאריך-אירוע משלהם ⇒ **פה בלבד** דפדוף בלי חלון-זמן (‏`WindowChips` לא מוצג).
// הדפדוף חי בכתובת (`?page=`) — המסך כבר משתמש ב-`useSearchParams` עם `resolveNext`
// (‏`CLAUDE.md`: "החלפת סטר שקטה") ואנחנו הולכים באותה תבנית בדיוק (`writeParams`).
//
// ה-API ממוקק כולו, בדיוק כמו ב-`CustomersPage.satisfaction.test.jsx` — אין Supabase כאן.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

// יוצר `count` לקוחות, כל אחד עם שם ייחודי כדי שאפשר לזהות אילו נכנסו לעמוד (הכלל
// נגד נתוני-בדיקה אחידים: `src/CLAUDE.md` — כל שורה שונה מקודמתה, לא רק ה-id).
function makeCustomers(count) {
  return Array.from({ length: count }, (_, i) => {
    const id = i + 1
    return {
      customer_id: id,
      company_name: `לקוח מספר ${String(id).padStart(3, '0')}`,
      company_number: `51400${String(id).padStart(4, '0')}`,
      customer_type: 'private_company',
      customer_contacts: [
        { contact_id: id, contact_name: 'איש קשר', phone: '', email: '', is_primary: true },
      ],
      discount_percent: 0,
      marketing_consent: false,
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
    }
  })
}

function mockPage(customers) {
  listCustomers.mockResolvedValue(customers)
  listQuotes.mockResolvedValue([])
  getQuoteScreenParams.mockResolvedValue([])
  getCustomerScreenParams.mockResolvedValue([{ param_name: 'סף_שביעות_רצון', param_value: '3' }])
  listProjectsForCustomerMetrics.mockResolvedValue([])
}

function renderPage(initialEntry = '/customers') {
  return render(
    <ToastProvider>
      <ConfirmProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
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

describe('רשימת-הלקוחות — דפדוף (מעבר-האחידות)', () => {
  it('מתחת ל-50 שורות אין דפדוף (מונה בלבד, בלי כפתורים) — מעבר-המלאי: כפתור-מושבת הוא רעש', async () => {
    mockPage(makeCustomers(3))
    renderPage()

    await screen.findByTestId('customer-row-1')
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('1–3')
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('3')
    expect(screen.queryByTestId('list-pager-next')).not.toBeInTheDocument()
  })

  it('מעל 50 שורות מציג עמוד ראשון (50) עם כפתורי-דפדוף, ומעבר-עמוד מציג את השאר', async () => {
    mockPage(makeCustomers(60))
    renderPage()

    await screen.findByTestId('customer-row-1')
    expect(screen.getByTestId('list-pager')).toBeInTheDocument()
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('1–50')
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('60')
    expect(screen.getByText('לקוח מספר 001')).toBeInTheDocument()
    expect(screen.queryByText('לקוח מספר 051')).not.toBeInTheDocument()

    const next = screen.getByTestId('list-pager-next')
    expect(next).not.toBeDisabled()
    fireEvent.click(next)

    expect(await screen.findByText('לקוח מספר 051')).toBeInTheDocument()
    expect(screen.queryByText('לקוח מספר 001')).not.toBeInTheDocument()
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('51–60')
  })

  it('הכתובת נושאת את מספר-העמוד (`?page=`) — רענון/קישור שומרים על המיקום', async () => {
    mockPage(makeCustomers(60))
    renderPage('/customers?page=2')

    expect(await screen.findByText('לקוח מספר 051')).toBeInTheDocument()
    expect(screen.getByTestId('list-pager-page')).toHaveTextContent('2/2')
  })

  it('חיפוש מאפס את העמוד ל-1 — מסך-רשימה על עמוד 2 שמסננים בו לא נשאר על "עמוד ריק"', async () => {
    mockPage(makeCustomers(60))
    renderPage('/customers?page=2')

    expect(await screen.findByText('לקוח מספר 051')).toBeInTheDocument()

    fireEvent.change(screen.getByTestId('customers-search'), {
      target: { value: 'לקוח מספר 0' },
    })

    // כל 60 הלקוחות תואמים "לקוח מספר 0" (001..060 כולם מתחילים כך פרט ל-100+, שאינם קיימים כאן) —
    // מה שנבדק הוא שהעמוד חזר ל-1, לא כמות-התוצאות.
    expect(await screen.findByText('לקוח מספר 001')).toBeInTheDocument()
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('1–50')
  })
})
