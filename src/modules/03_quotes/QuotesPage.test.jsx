// בדיקות לחיווט חלון-הזמן + הדפדוף במסך-הניהול (`src/components/ListWindow.jsx` +
// `src/lib/listWindow.js`, הכרעת-ישי 04/09/2026) — הרכיבים עצמם כבר נבדקים בנפרד;
// כאן רק שהם מחוברים נכון: ברירת-המחדל (90 יום) חוסמת עבר רחוק, 'הכול' מציג הכול,
// הדפדוף מופיע מעל 50 שורות, ומעבר-לשונית מאפס את העמוד.
//
// ה-API ממוקק כולו (03_quotes/api · src/api/email) — אין Supabase בבדיקה.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ToastProvider'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import QuotesPage from './QuotesPage'
import { getPricingCatalog, getQuoteScreenParams, listQuotes } from '@/modules/03_quotes/api'
import { getSentEntityIds } from '@/api/email'

// ⚠️ QuotesPage.jsx מייבא את api.js דרך ה-alias `@/modules/03_quotes/api` ולא יחסית —
// המיקוק כאן חייב לצטט את אותה מחרוזת בדיוק, אחרת vitest לא מיירט את הקריאה האמיתית.
vi.mock('@/modules/03_quotes/api', () => ({
  approveQuote: vi.fn(),
  getPricingCatalog: vi.fn(),
  getQuoteScreenParams: vi.fn(),
  listQuotes: vi.fn(),
  rejectQuote: vi.fn(),
}))
vi.mock('@/api/email', () => ({
  getSentEntityIds: vi.fn(),
}))

const authState = { permissions: { 'הצעות מחיר': 'view' } }
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

// ארבעת הפרמטרים שהמסך צורך — נמסרים כדי שבאנר "פרמטר חסר" לא ידליק רעש בבדיקות
// שלא בודקות אותו (missingPricingParamsMessage, src/lib/quotes.js).
const QUOTE_PARAM_ROWS = [
  { param_name: 'אחוז_מעמ', param_value: '18' },
  { param_name: 'ימי_תוקף_הצעה', param_value: '30' },
  { param_name: 'ימי_אזהרה_קדם_אירוע', param_value: '14' },
  { param_name: 'ימי_אזהרה_הצעה_פגה', param_value: '7' },
]

function offsetIso(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
}

function quoteFixture(overrides) {
  return {
    quote_id: 1,
    customer_id: 1,
    event_name: 'אירוע',
    estimated_event_date: offsetIso(-10),
    quote_status: 'in_progress',
    rejection_reason: null,
    manual_discount: 0,
    applied_customer_discount: 0,
    vat_rate_snapshot: null,
    updated_at: new Date().toISOString(),
    quote_services: [],
    customers: { customer_id: 1, company_name: 'לקוח א׳', customer_contacts: [] },
    ...overrides,
  }
}

function mockApi(quotes) {
  listQuotes.mockResolvedValue(quotes)
  getQuoteScreenParams.mockResolvedValue(QUOTE_PARAM_ROWS)
  getPricingCatalog.mockResolvedValue({ products: [], tiers: [], params: [] })
  getSentEntityIds.mockResolvedValue(new Set())
}

function renderQuotesPage() {
  return render(
    <ToastProvider>
      <ConfirmProvider>
        <MemoryRouter initialEntries={['/quotes']}>
          <QuotesPage />
        </MemoryRouter>
      </ConfirmProvider>
    </ToastProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.permissions = { 'הצעות מחיר': 'view' }
})

describe('חלון-זמן — ברירת-מחדל (90 יום) מול "הכול"', () => {
  it('שורה ישנה מ-90 יום מוסתרת כברירת-מחדל, ו-"הכול" מחזיר אותה', async () => {
    const oldQuote = quoteFixture({
      quote_id: 901,
      event_name: 'אירוע ישן',
      estimated_event_date: offsetIso(-200), // מחוץ ל-90 יום
    })
    const recentQuote = quoteFixture({
      quote_id: 902,
      event_name: 'אירוע טרי',
      estimated_event_date: offsetIso(-10),
    })
    mockApi([oldQuote, recentQuote])
    renderQuotesPage()

    await screen.findByTestId('quote-row-902')
    expect(screen.queryByTestId('quote-row-901')).not.toBeInTheDocument()
    // הרמז: "עוד N מחוץ לחלון" ליד גלולות-החלון.
    expect(screen.getByTestId('list-window-hidden')).toHaveTextContent('1')

    fireEvent.click(screen.getByTestId('list-window-all'))

    expect(await screen.findByTestId('quote-row-901')).toBeInTheDocument()
    expect(screen.getByTestId('quote-row-902')).toBeInTheDocument()
    expect(screen.queryByTestId('list-window-hidden')).not.toBeInTheDocument()
  })
})

describe('דפדוף — מעל 50 שורות', () => {
  const manyQuotes = Array.from({ length: 55 }, (_, i) =>
    quoteFixture({
      quote_id: 1000 + i,
      event_name: `אירוע ${i + 1}`,
      estimated_event_date: offsetIso(-1), // בתוך חלון-ברירת-המחדל, ולכן כולן נספרות
      updated_at: new Date(Date.now() - i * 1000).toISOString(),
    }),
  )

  it('הפאגר מופיע, ועמוד 1 מציג רק 50 מתוך 55', async () => {
    mockApi(manyQuotes)
    renderQuotesPage()

    await screen.findByTestId('quotes-table')
    expect(screen.getByTestId('list-pager')).toBeInTheDocument()
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('50')
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('55')
    // ⚠️ המיון-הכללי אינו מוגדר לכאן (sortKey='expiry' עם validityDays תקין), ולכן די
    // לבדוק שיש בדיוק 50 שורות מוצגות ולא לצפות למזהה ספציפי בעמוד 1.
    const rows = screen.getAllByTestId(/^quote-row-/)
    expect(rows).toHaveLength(50)
  })

  it('לחיצה על "הבא" עוברת לעמוד 2 ומציגה את חמש השורות הנותרות', async () => {
    mockApi(manyQuotes)
    renderQuotesPage()

    await screen.findByTestId('quotes-table')
    fireEvent.click(screen.getByTestId('list-pager-next'))

    expect(await screen.findByTestId('list-pager-page')).toHaveTextContent('2')
    const rows = screen.getAllByTestId(/^quote-row-/)
    expect(rows).toHaveLength(5)
  })
})

describe('מעבר-לשונית מאפס את העמוד', () => {
  const manyQuotes = Array.from({ length: 55 }, (_, i) =>
    quoteFixture({
      quote_id: 2000 + i,
      event_name: `אירוע ${i + 1}`,
      estimated_event_date: offsetIso(-1),
      updated_at: new Date(Date.now() - i * 1000).toISOString(),
    }),
  )

  it('דפדוף לעמוד 2 ואז מעבר ללשונית "הכל" חוזר לעמוד 1', async () => {
    mockApi(manyQuotes)
    renderQuotesPage()

    await screen.findByTestId('quotes-table')
    fireEvent.click(screen.getByTestId('list-pager-next'))
    expect(await screen.findByTestId('list-pager-page')).toHaveTextContent('2')

    fireEvent.click(screen.getByTestId('quotes-tab-all'))

    expect(await screen.findByTestId('list-pager-page')).toHaveTextContent('1')
  })
})
