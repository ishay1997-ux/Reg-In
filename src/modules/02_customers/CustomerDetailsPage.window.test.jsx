// בדיקות לחיווט חלון-הזמן + הדפדוף בכרטיס-הלקוח (`src/components/ListWindow.jsx` +
// `src/lib/listWindow.js`, הכרעת-ישי 04/09/2026) — מופע יחיד של WindowChips מעל שתי
// הלשוניות (הצעות/פרויקטים), ופאגר נפרד לכל אחת. הרכיבים המשותפים עצמם נבדקים בנפרד
// (`ListWindow.test.jsx`, `listWindow.test.js`); כאן רק שהם מחוברים נכון למסך הזה.
//
// ה-API ממוקק כולו (./api · 03_quotes/api · src/api/email) — אין Supabase בבדיקה,
// אותו סגנון-בית כמו CustomerDetailsPage.projects.test.jsx.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

const authState = { permissions: {} }
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

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
    customer_contacts: [],
    discount_percent: 0,
    marketing_consent: false,
    ...overrides,
  }
}

function quoteFixture(overrides) {
  return {
    quote_id: 1,
    event_name: 'אירוע',
    estimated_event_date: offsetIso(-10),
    quote_status: 'in_progress',
    rejection_reason: null,
    manual_discount: 0,
    applied_customer_discount: 0,
    vat_rate_snapshot: 18,
    quote_services: [],
    ...overrides,
  }
}

function projectFixture(overrides) {
  return {
    project_id: 1,
    event_name: 'פרויקט',
    final_event_date: offsetIso(-10),
    project_status: 'finished',
    quote_id: null,
    cancelled_at: null,
    cancel_type: null,
    cancelled_by: null,
    cancel_reason: null,
    quotes: null,
    project_changes: [],
    feedback_status: 'not_sent',
    feedback_score: null,
    ...overrides,
  }
}

function mockPageApi({ quotes = [], projects = [] } = {}) {
  getCustomer.mockResolvedValue(customerFixture())
  listCustomerContacts.mockResolvedValue([])
  listQuotesByCustomer.mockResolvedValue(quotes)
  getQuoteScreenParams.mockResolvedValue([])
  getPricingCatalog.mockResolvedValue({ products: [], tiers: [], params: [] })
  getSentEntityIds.mockResolvedValue(new Set())
  getCustomerScreenParams.mockResolvedValue([])
  getCustomerProjects.mockResolvedValue(projects)
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

beforeEach(() => {
  vi.clearAllMocks()
  authState.permissions = { פרויקטים: 'view' }
})

describe('חלון-זמן משותף — ברירת-מחדל (90 יום) מול "הכול", בלשונית ההצעות', () => {
  it('הצעה ישנה מ-90 יום מוסתרת כברירת-מחדל, ו-"הכול" מחזיר אותה', async () => {
    const oldQuote = quoteFixture({ quote_id: 901, estimated_event_date: offsetIso(-200) })
    const recentQuote = quoteFixture({ quote_id: 902, estimated_event_date: offsetIso(-10) })
    mockPageApi({ quotes: [oldQuote, recentQuote] })
    renderCustomerPage()

    await screen.findByTestId('customer-quote-902')
    expect(screen.queryByTestId('customer-quote-901')).not.toBeInTheDocument()
    expect(screen.getByTestId('list-window-hidden')).toHaveTextContent('1')

    fireEvent.click(screen.getByTestId('list-window-all'))

    expect(await screen.findByTestId('customer-quote-901')).toBeInTheDocument()
    expect(screen.getByTestId('customer-quote-902')).toBeInTheDocument()
  })
})

describe('חלון-זמן משותף — אותו חלון חל גם על לשונית-הפרויקטים', () => {
  it('פרויקט ישן מוסתר כברירת-מחדל דרך אותו WindowChips יחיד', async () => {
    const oldProject = projectFixture({ project_id: 701, final_event_date: offsetIso(-200) })
    const recentProject = projectFixture({ project_id: 702, final_event_date: offsetIso(-10) })
    mockPageApi({ projects: [oldProject, recentProject] })
    renderCustomerPage()

    await screen.findByTestId('customer-page')
    fireEvent.click(screen.getByTestId('customer-tab-projects'))

    expect(await screen.findByTestId('customer-project-702')).toBeInTheDocument()
    expect(screen.queryByTestId('customer-project-701')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('list-window-all'))

    expect(await screen.findByTestId('customer-project-701')).toBeInTheDocument()
  })
})

describe('דפדוף — מעל 50 הצעות (הלקוח עם 262 הצעות בייצור)', () => {
  const manyQuotes = Array.from({ length: 55 }, (_, i) =>
    quoteFixture({ quote_id: 1000 + i, estimated_event_date: offsetIso(-1) }),
  )

  it('customer-quotes-pager מופיע, ועמוד 1 מציג רק 50 מתוך 55', async () => {
    mockPageApi({ quotes: manyQuotes })
    renderCustomerPage()

    await screen.findByTestId('customer-page')
    expect(screen.getByTestId('customer-quotes-pager')).toBeInTheDocument()
    expect(screen.getByTestId('customer-quotes-pager-range')).toHaveTextContent('55')
    expect(screen.getAllByTestId(/^customer-quote-\d+$/)).toHaveLength(50)
  })

  it('מעבר ללשונית-פרויקטים וחזרה מאפס את עמוד-ההצעות ל-1', async () => {
    mockPageApi({ quotes: manyQuotes })
    renderCustomerPage()

    await screen.findByTestId('customer-page')
    fireEvent.click(screen.getByTestId('customer-quotes-pager-next'))
    expect(await screen.findByTestId('customer-quotes-pager-page')).toHaveTextContent('2')

    fireEvent.click(screen.getByTestId('customer-tab-projects'))
    fireEvent.click(screen.getByTestId('customer-tab-quotes'))

    expect(await screen.findByTestId('customer-quotes-pager-page')).toHaveTextContent('1')
  })
})

describe('דפדוף — מעל 50 פרויקטים', () => {
  const manyProjects = Array.from({ length: 60 }, (_, i) =>
    projectFixture({ project_id: 2000 + i, final_event_date: offsetIso(-1 - i) }),
  )

  it('customer-projects-pager מופיע, ועמוד 1 מציג רק 50 מתוך 60', async () => {
    mockPageApi({ projects: manyProjects })
    renderCustomerPage()

    await screen.findByTestId('customer-page')
    fireEvent.click(screen.getByTestId('customer-tab-projects'))

    expect(await screen.findByTestId('customer-projects-pager')).toBeInTheDocument()
    expect(screen.getByTestId('customer-projects-pager-range')).toHaveTextContent('60')
    expect(screen.getAllByTestId(/^customer-project-\d+$/)).toHaveLength(50)
  })
})
