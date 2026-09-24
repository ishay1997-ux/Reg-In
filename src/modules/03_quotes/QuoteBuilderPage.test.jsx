// מסך-העריכה על הצעה שאי-אפשר לערוך — ליטושי-הכנס, חבילה 0 (24/09/2026).
//
// 🔴 **הבאג שהבדיקה הזו נועלת, ונמדד בייצור:** דוח "סגירת הצעות" (מ11 ה1) פתח את `/quotes/2317/edit`
// על הצעה שנדחתה, והמסך הציג "עריכת הצעה #2317" עם טופס **ריק** וכפתור `עדכני ושלחי` פעיל.
// השורש: `setLoadError('')` רץ **אחרי** הענף שקבע את השגיאה ומחק אותה. ‏e2e שבדק רק את הכתובת עבר.
// ⇒ כאן בודקים **מה מרונדר**: הודעה + דרך-קדימה, ואין טופס ואין כפתור-שמירה.
//
// ה-API ממוקק כולו — אין Supabase בבדיקה.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ToastProvider } from '@/components/ToastProvider'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import QuoteBuilderPage from './QuoteBuilderPage'
import { getPricingCatalog, getQuote, getQuoteScreenParams } from '@/modules/03_quotes/api'
import { listCustomers } from '@/modules/02_customers/api'

// ✏️ 24/09/2026: ב-CI אין `.env.local` — `src/api/email.js` (שהדף מייבא) יוצר את הלקוח בזמן-טעינה ונפל
// על "supabaseUrl is required" (השחזור: `VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx vitest run <file>`).
vi.mock('@/supabaseClient', () => ({ supabase: {} }))
vi.mock('@/modules/03_quotes/api', () => ({
  createQuote: vi.fn(),
  getPricingCatalog: vi.fn(),
  getQuote: vi.fn(),
  getQuoteScreenParams: vi.fn(),
  saveQuoteEdit: vi.fn(),
}))
vi.mock('@/modules/02_customers/api', () => ({
  listCustomers: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  listCustomerContacts: vi.fn(),
  replaceCustomerContacts: vi.fn(),
}))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ permissions: { 'הצעות מחיר': 'edit' } }),
}))

function Where() {
  const location = useLocation()
  return <p data-testid="where">{location.pathname + location.search}</p>
}

function renderEdit(quoteId) {
  return render(
    <ToastProvider>
      <ConfirmProvider>
        <MemoryRouter initialEntries={[`/quotes/${quoteId}/edit`]}>
          <Routes>
            <Route path="/quotes/:quoteId/edit" element={<QuoteBuilderPage />} />
            <Route path="/quotes" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </ConfirmProvider>
    </ToastProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  listCustomers.mockResolvedValue([])
  getPricingCatalog.mockResolvedValue({
    products: [],
    tiers: [],
    params: [{ param_name: 'אחוז_מעמ', param_value: '18' }],
  })
  getQuoteScreenParams.mockResolvedValue([])
})

describe('הצעה שאי-אפשר לערוך — הודעה ודרך-קדימה, לעולם לא טופס ריק', () => {
  it('הצעה שנדחתה: אין טופס ואין כפתור-שמירה, ו"פתחי את מסמך ההצעה" מוביל לחלון-המסמך', async () => {
    getQuote.mockResolvedValue({ quote_id: 2317, quote_status: 'rejected', quote_services: [] })
    renderEdit(2317)

    expect(await screen.findByTestId('quote-unavailable')).toHaveTextContent(
      'ההצעה כבר נדחתה, ולכן אי-אפשר לערוך אותה.',
    )
    expect(screen.queryByText('עריכת הצעה #2317')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /עדכני ושלחי/ })).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('quote-unavailable-view'))
    expect(await screen.findByTestId('where')).toHaveTextContent('/quotes?view=2317')
  })

  it('הצעה שאושרה: אותה התנהגות, בפועל-העבר הנכון', async () => {
    getQuote.mockResolvedValue({ quote_id: 1907, quote_status: 'approved', quote_services: [] })
    renderEdit(1907)
    expect(await screen.findByTestId('quote-unavailable')).toHaveTextContent(
      'ההצעה כבר אושרה, ולכן אי-אפשר לערוך אותה.',
    )
  })

  it('הצעה שאינה קיימת: הודעה + חזרה לרשימה, ולא טופס "עריכת הצעה" ריק', async () => {
    getQuote.mockResolvedValue(null)
    renderEdit(999999)
    expect(await screen.findByTestId('quote-unavailable')).toHaveTextContent(
      'ההצעה לא נמצאה, או שאין לך הרשאה אליה.',
    )
    expect(screen.queryByText('עריכת הצעה #999999')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('quote-unavailable-back'))
    expect(await screen.findByTestId('where')).toHaveTextContent('/quotes')
  })

  it('כשל-רשת נשאר מסלול "נסי שוב" — ואינו מתחזה ל"לא נמצאה"', async () => {
    getQuote.mockRejectedValue(new Error('network'))
    renderEdit(5)
    expect(await screen.findByText('שגיאה בטעינת נתוני ההצעה.')).toBeInTheDocument()
    expect(screen.getByTestId('quote-load-retry')).toBeInTheDocument()
    expect(screen.queryByTestId('quote-unavailable')).not.toBeInTheDocument()
  })
})
