// `?view=<quoteId>` — חלון-המסמך נפתח מהכתובת (ליטושי-הכנס, חבילה 0, 24/09/2026).
// זו הדלת של דוח "סגירת הצעות" (מ11 ה1): שורה ⇐ `/quotes?view=N` ⇐ מסמך ההצעה, **בכל סטטוס**.
// החלון עצמו ממוקק כאן: מה שנבדק הוא החיווט (איזו הצעה, מתי, ומה קורה כשאינה ברשימה) —
// המסמך עצמו נבדק בדפדפן אמיתי (`03_quotes/CLAUDE.md`: PDF תחת vitest אינו ראיה).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { ToastProvider } from '@/components/ToastProvider'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import QuotesPage from './QuotesPage'
import { getPricingCatalog, getQuoteScreenParams, listQuotes } from '@/modules/03_quotes/api'
import { getSentEntityIds } from '@/api/email'

vi.mock('@/modules/03_quotes/api', () => ({
  approveQuote: vi.fn(),
  getPricingCatalog: vi.fn(),
  getQuoteScreenParams: vi.fn(),
  listQuotes: vi.fn(),
  rejectQuote: vi.fn(),
}))
vi.mock('@/api/email', () => ({ getSentEntityIds: vi.fn() }))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ permissions: { 'הצעות מחיר': 'edit' } }),
}))
vi.mock('@/modules/03_quotes/QuoteDocumentDialog', () => ({
  default: ({ open, quote, onOpenChange }) =>
    open ? (
      <div data-testid="document-stub">
        <p data-testid="document-stub-id">{quote?.quote_id}</p>
        <button type="button" onClick={() => onOpenChange(false)}>
          סגירה
        </button>
      </div>
    ) : null,
}))

function quote(overrides) {
  return {
    quote_id: 1,
    customer_id: 1,
    event_name: 'אירוע',
    estimated_event_date: new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10),
    quote_status: 'rejected',
    rejection_reason: 'חוסר זמינות/לו"ז',
    manual_discount: 0,
    applied_customer_discount: 0,
    vat_rate_snapshot: null,
    updated_at: new Date().toISOString(),
    quote_services: [],
    customers: { customer_id: 1, company_name: 'לקוח א׳', customer_contacts: [] },
    ...overrides,
  }
}

function Where() {
  const location = useLocation()
  return <p data-testid="where">{location.search}</p>
}

function renderAt(entry) {
  return render(
    <ToastProvider>
      <ConfirmProvider>
        <MemoryRouter initialEntries={[entry]}>
          <QuotesPage />
          <Where />
        </MemoryRouter>
      </ConfirmProvider>
    </ToastProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getQuoteScreenParams.mockResolvedValue([
    { param_name: 'אחוז_מעמ', param_value: '18' },
    { param_name: 'ימי_תוקף_הצעה', param_value: '30' },
    { param_name: 'ימי_אזהרה_קדם_אירוע', param_value: '14' },
    { param_name: 'ימי_אזהרה_הצעה_פגה', param_value: '7' },
  ])
  getPricingCatalog.mockResolvedValue({ products: [], tiers: [], params: [] })
  getSentEntityIds.mockResolvedValue(new Set())
})

describe('?view= — מסמך-ההצעה מהכתובת', () => {
  it('הצעה שנדחתה, ישנה ומחוץ לחלון-הזמן — נפתחת בכל זאת, וסגירה מוחקת את הפרמטר', async () => {
    listQuotes.mockResolvedValue([quote({ quote_id: 2317 })])
    renderAt('/quotes?view=2317')
    expect(await screen.findByTestId('document-stub-id')).toHaveTextContent('2317')
    expect(screen.queryByTestId('quotes-view-missing')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'סגירה' }))
    expect(screen.queryByTestId('document-stub')).not.toBeInTheDocument()
    expect(screen.getByTestId('where')).not.toHaveTextContent('view=')
  })

  // 0ב (24/09/2026): מדלת-דוח — גם קישור-חזרה גלוי בראש המסך, לא רק חזרה-בסגירה.
  it('מדוח (`returnTo=/reports…`) ⇒ "חזרה לדוח" גלוי, אל אותו דוח', async () => {
    listQuotes.mockResolvedValue([quote({ quote_id: 2317 })])
    const back = '/reports?tab=exec&report=trends'
    renderAt(`/quotes?view=2317&returnTo=${encodeURIComponent(back)}`)
    const link = await screen.findByTestId('return-to-link')
    expect(link).toHaveTextContent('חזרה לדוח')
    expect(link).toHaveAttribute('href', back)
  })

  it('מספר שאינו ברשימה — נאמר במפורש, ולא חלון שפשוט לא נפתח', async () => {
    listQuotes.mockResolvedValue([quote({ quote_id: 5 })])
    renderAt('/quotes?view=999')
    expect(await screen.findByTestId('quotes-view-missing')).toHaveTextContent(
      'ההצעה לא נמצאה, או שאין לך הרשאה אליה.',
    )
    expect(screen.queryByTestId('document-stub')).not.toBeInTheDocument()
  })
})
