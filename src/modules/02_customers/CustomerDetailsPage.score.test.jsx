// עמודת "שביעות רצון" בלשונית-הפרויקטים של כרטיס-הלקוח (בקשת-ישי 04/09/2026).
// מה שנעול: הדירוג שהלקוח נתן מוצג על השורה **באותה צורה כמו במסך הכספים** (כוכבים + תגית-
// תווית, דרך `ScoreCell` המשותף), ורק כשהמשוב הושלם — ציון שיושב על שורה שסקר טרם נענה בה
// (`feedback_status` שאינו `completed`) אינו מוצג, בדיוק כמו שאריח "ממוצע משוב" סופר רק משיבים.
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
vi.mock('@/api/email', () => ({ getSentEntityIds: vi.fn() }))
const authState = { permissions: { פרויקטים: 'view', כספים: 'edit' } }
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

function offsetIso(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
}

function projectRow(overrides) {
  return {
    project_id: 1,
    quote_id: 1,
    event_name: 'כנס לקוחות',
    final_event_date: offsetIso(-10),
    project_status: 'finished',
    cancel_type: null,
    cancelled_at: null,
    feedback_status: 'completed',
    feedback_score: 5,
    project_finance: { final_profit: 1000 },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.permissions = { פרויקטים: 'view', כספים: 'edit' }
  getCustomer.mockResolvedValue({
    customer_id: 46,
    company_name: 'לקוח לבדיקה',
    company_number: '512345678',
    customer_type: 'private_company',
    status: 'active',
    customer_contacts: [],
    discount_percent: 0,
    marketing_consent: false,
  })
  listCustomerContacts.mockResolvedValue([])
  listQuotesByCustomer.mockResolvedValue([])
  getQuoteScreenParams.mockResolvedValue([])
  getPricingCatalog.mockResolvedValue({ products: [], tiers: [], params: [] })
  getSentEntityIds.mockResolvedValue(new Set())
  getCustomerScreenParams.mockResolvedValue([])
})

function renderPage() {
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

describe('כרטיס-לקוח · אריח "רווח גולמי מהלקוח" (במקום "סה"כ הצעות מאושרות", ישי 04/09/2026)', () => {
  it('למי שיש הרשאת כספים: סכום final_profit הקפוא של הפרויקטים שהסתיימו + מונה', async () => {
    getCustomerProjects.mockResolvedValue([
      projectRow({ project_id: 601, project_finance: { final_profit: '1200.50' } }),
      projectRow({ project_id: 602, project_finance: { final_profit: 800 } }),
      projectRow({
        project_id: 603,
        project_status: 'cancelled',
        project_finance: { final_profit: 999 },
      }),
    ])
    renderPage()
    await screen.findByTestId('customer-page')
    const tile = await screen.findByTestId('metric-profit')
    expect(tile).toHaveTextContent('רווח גולמי מהלקוח')
    expect(tile).toHaveTextContent('2,001 ₪')
    expect(tile).toHaveTextContent('מ-2 פרויקטים שהסתיימו')
    expect(screen.queryByTestId('metric-revenue')).toBeNull()
  })

  it('🔴 בלי הרשאת כספים: "דורש הרשאת כספים" — לא 0 ולא ריק', async () => {
    authState.permissions = { פרויקטים: 'view', כספים: 'blocked' }
    getCustomerProjects.mockResolvedValue([projectRow({ project_id: 611, project_finance: null })])
    renderPage()
    await screen.findByTestId('customer-page')
    const tile = await screen.findByTestId('metric-profit')
    expect(tile).toHaveTextContent('דורש הרשאת כספים')
    expect(tile).not.toHaveTextContent('0 ₪')
  })
})

describe('כרטיס-לקוח · לשונית-פרויקטים — עמודת "שביעות רצון"', () => {
  it('משוב שהושלם ⇒ תגית-תווית (בלי מספר בתוך התג); סקר שלא נענה ⇒ "—"', async () => {
    getCustomerProjects.mockResolvedValue([
      projectRow({ project_id: 501, feedback_score: 5 }),
      projectRow({ project_id: 502, feedback_score: 3 }),
      projectRow({ project_id: 503, feedback_status: 'sent', feedback_score: null }),
      // ציון ששוכן על שורה שהסקר בה לא נענה אינו "דירוג שהלקוח נתן" — לא מוצג.
      projectRow({ project_id: 504, feedback_status: 'no_response', feedback_score: 2 }),
    ])
    renderPage()
    await screen.findByTestId('customer-page')
    fireEvent.click(screen.getByTestId('customer-tab-projects'))

    expect(await screen.findByText('שביעות רצון')).toBeInTheDocument()
    expect(screen.getByTestId('customer-project-score-501')).toHaveTextContent('מצוין')
    expect(screen.getByTestId('customer-project-score-501')).not.toHaveTextContent('5')
    expect(screen.getByTestId('customer-project-score-502')).toHaveTextContent('בינוני')
    expect(screen.getByTestId('customer-project-score-503')).toHaveTextContent('—')
    expect(screen.getByTestId('customer-project-score-504')).toHaveTextContent('—')
  })
})
