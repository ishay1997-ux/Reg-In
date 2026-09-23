// חיבור מסך-הלקוחות לחלון-הייצוא — המסך השני מחוץ למודול 11 (הדפוס: `ProjectsPage.export.test.jsx`).
//
// 🔑 **מה שנבדק כאן אינו "הכפתור נפתח" אלא שלושה חוזים:**
// ① `value` קורא לאותה נגזרת שהטבלה קוראת לה ⇒ הקובץ והמסך אינם מתפצלים ·
// ② הקובץ מקבל את **כל מה שעומד במסנן** — לא עמוד-דפדוף, ולא "הכול" ·
// ③ ברירת-המחדל = עמודות-המסך, והשאר זמין בבוחר (הכרעת-ישי 23/09/2026).
//
// המוקים כמו ב-`CustomersPage.pagination.test.jsx` — אין Supabase כאן.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ToastProvider'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import CustomersPage from './CustomersPage'
import { listCustomers, listProjectsForCustomerMetrics, getCustomerScreenParams } from './api'
import { getQuoteScreenParams, listQuotes } from '@/modules/03_quotes/api'
import { CUSTOMER_TYPE_LABELS, deriveCustomerMetrics } from '@/lib/customers'
import { PAGE_SIZE } from '@/lib/listWindow'

vi.mock('./api', () => ({
  listCustomers: vi.fn(),
  listProjectsForCustomerMetrics: vi.fn(),
  getCustomerScreenParams: vi.fn(),
  setCustomerStatus: vi.fn(),
  updateCustomer: vi.fn(),
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

// כל שורה שונה מקודמתה (הכלל נגד נתוני-בדיקה אחידים, `src/CLAUDE.md`).
const TYPES = Object.keys(CUSTOMER_TYPE_LABELS)
function makeCustomers(count) {
  return Array.from({ length: count }, (_, i) => {
    const id = i + 1
    return {
      customer_id: id,
      company_name: `לקוח מספר ${String(id).padStart(3, '0')}`,
      company_number: `05140${String(id).padStart(4, '0')}`,
      customer_type: TYPES[i % TYPES.length],
      customer_contacts: [
        {
          contact_id: id,
          contact_name: `איש קשר ${id}`,
          phone: `05${String(id).padStart(8, '0')}`,
          email: `c${id}@example.test`,
          is_primary: true,
        },
      ],
      discount_percent: i % 3 === 0 ? 10 : 0,
      marketing_consent: i % 2 === 0,
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
    }
  })
}

// הצעה מאושרת אחת ללקוח 1 — כדי שעמודת-הכסף תישא ערך שנגזר ולא מספר קשיח.
const APPROVED_QUOTE = {
  quote_id: 900,
  customer_id: 1,
  quote_status: 'approved',
  vat_rate_snapshot: 18,
  applied_customer_discount: 0,
  manual_discount: 0,
  quote_services: [{ qty: 2, closing_unit_price: 500 }],
}

function mockPage(customers, quotes = []) {
  listCustomers.mockResolvedValue(customers)
  listQuotes.mockResolvedValue(quotes)
  getQuoteScreenParams.mockResolvedValue([{ param_name: 'אחוז_מעמ', param_value: '18' }])
  getCustomerScreenParams.mockResolvedValue([
    { param_name: 'סף_שביעות_רצון', param_value: '3' },
    { param_name: 'סף_לקוח_רדום_ימים', param_value: '180' },
  ])
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

async function openDialog() {
  fireEvent.click(await screen.findByTestId('customers-export-button'))
  return within(await screen.findByTestId('export-preview'))
}

const headersOf = (preview) => preview.getAllByRole('columnheader').map((c) => c.textContent)

beforeEach(() => {
  vi.clearAllMocks()
  authState.permissions = { לקוחות: 'edit' }
})

describe('CustomersPage — חיבור לחלון-הייצוא', () => {
  it('הכפתור קיים ופעיל תמיד — גם בתפקיד view, כי ה-RLS מגדר ולא הכפתור', async () => {
    authState.permissions = { לקוחות: 'view' }
    mockPage(makeCustomers(2))
    renderPage()
    expect(await screen.findByTestId('customers-export-button')).toBeEnabled()
  })

  it('🔴 נגזרת מגיעה לקובץ עם הערך שהטבלה מציגה — סוג-לקוח בעברית, לא ערך-enum', async () => {
    const rows = makeCustomers(1)
    mockPage(rows)
    renderPage()
    const preview = await openDialog()
    const expected = CUSTOMER_TYPE_LABELS[rows[0].customer_type]
    expect(expected).toBeTruthy()
    await waitFor(() => expect(preview.getByText(expected)).toBeInTheDocument())
    expect(preview.queryByText(rows[0].customer_type)).toBeNull()
  })

  it('🔴 עמודת-הכסף היא אותה נגזרת של הטבלה — הצפי מחושב מ-deriveCustomerMetrics, לא מספר קשיח', async () => {
    mockPage(makeCustomers(1), [APPROVED_QUOTE])
    renderPage()
    const preview = await openDialog()
    const { totalRevenue } = deriveCustomerMetrics([], [APPROVED_QUOTE], 18)
    expect(typeof totalRevenue).toBe('number')
    expect(totalRevenue).toBeGreaterThan(0)
    // התא בתצוגה-המקדימה הוא מספר מעוצב (`#,##0`) — משווים לאותו מספר, מעוגל כמו המנוע.
    const cellText = String(Math.round(totalRevenue))
    await waitFor(() =>
      expect(preview.getAllByRole('cell').some((c) => c.textContent === cellText)).toBe(true),
    )
  })

  it('שורת-הכמות סופרת את כל מה שעומד במסנן — לא את עמוד-הדפדוף', async () => {
    const rows = makeCustomers(PAGE_SIZE + 10)
    mockPage(rows)
    renderPage()
    // הטבלה מציגה עמוד אחד; הקובץ חייב את כולם.
    await screen.findByTestId('customers-table')
    expect(screen.getAllByTestId(/^customer-row-/)).toHaveLength(PAGE_SIZE)
    await openDialog()
    await waitFor(() =>
      expect(screen.getByTestId('export-count')).toHaveTextContent(`${rows.length} שורות`),
    )
  })

  it('סינון-המסך כן משפיע — חיפוש שמשאיר לקוח אחד ⇒ שורה אחת', async () => {
    mockPage(makeCustomers(7))
    renderPage('/customers?q=' + encodeURIComponent('לקוח מספר 003'))
    await screen.findByTestId('customers-table')
    expect(screen.getAllByTestId(/^customer-row-/)).toHaveLength(1)
    await openDialog()
    await waitFor(() => expect(screen.getByTestId('export-count')).toHaveTextContent('1 שור'))
  })

  it('כותרות הקובץ הן תוויות-המסך, ועמודת "פעולות" לעולם אינה מיוצאת', async () => {
    mockPage(makeCustomers(1))
    renderPage()
    const heads = headersOf(await openDialog())
    for (const label of ['שם לקוח', 'ח"פ', 'סוג לקוח', 'איש קשר', 'מאושר לדיוור', 'סטטוס']) {
      expect(heads).toContain(label)
    }
    expect(heads.join(' ')).not.toContain('פעולות')
    expect(heads.join(' ')).not.toContain('ערכי')
  })

  it('🔴 בעוד ההכנסות בדרך — החלון בטעינה והייצוא מנוטרל, כדי שלא יירד קובץ עם עמודת-כסף ריקה', async () => {
    mockPage(makeCustomers(2))
    // ההצעות לעולם לא חוזרות ⇒ הנגזרות "עוד בדרך" לכל אורך הבדיקה.
    listQuotes.mockReturnValue(new Promise(() => {}))
    renderPage()
    fireEvent.click(await screen.findByTestId('customers-export-button'))
    expect(await screen.findByTestId('export-preview-loading')).toBeInTheDocument()
    expect(screen.getByTestId('export-dialog-run')).toBeDisabled()
  })

  it('🔴 כשל בטעינת ההצעות — החלון נחסם עם הסיבה, ולא מוריד קובץ עם עמודת-כסף ריקה', async () => {
    mockPage(makeCustomers(2))
    listQuotes.mockRejectedValue(new Error('network'))
    renderPage()
    // הבאנר על המסך הוא הסימן הראשון; החלון חייב לשאת אותו בעצמו.
    await screen.findByTestId('customers-revenue-error')
    fireEvent.click(screen.getByTestId('customers-export-button'))
    await waitFor(() => expect(screen.getByTestId('export-count')).toHaveTextContent('לא נטענו'))
    expect(screen.getByTestId('export-dialog-run')).toBeDisabled()
  })

  it('🔴 כשל בהגדרות-המסך — אותה חסימה: "רדום"/"טעון בירור" לא יורדים כ"לא" מומצא', async () => {
    mockPage(makeCustomers(2))
    getCustomerScreenParams.mockRejectedValue(new Error('missing param'))
    renderPage()
    await screen.findByTestId('customers-screen-params-error')
    fireEvent.click(screen.getByTestId('customers-export-button'))
    await waitFor(() => expect(screen.getByTestId('export-dialog-run')).toBeDisabled())
  })

  it('🔑 אין שדה-שכר ואין מילת-שכר בכותרות — אין כאן דליפה לבדוק', async () => {
    mockPage(makeCustomers(1))
    renderPage()
    const heads = headersOf(await openDialog()).join(' ')
    for (const word of ['שכר', 'תעריף']) expect(heads).not.toContain(word)
  })
})

// 🔴🔴 **הכלל שישי ניסח 23/09/2026:** *"בכל מסך שילחצו ייצוא ברירת המחדל
// תהיה מה שבמסך, ואם ירצה יוכל להוסיף עוד"*.
describe('🔴 ברירת-מחדל = מה שבמסך, ואפשר להוסיף עוד', () => {
  it('נפתח עם עמודות-המסך בלבד — "מס׳ לקוח" ו"תאריך הוספה" אינן בקובץ', async () => {
    mockPage(makeCustomers(1))
    renderPage()
    const preview = await openDialog()
    await waitFor(() => expect(headersOf(preview)).toContain('שם לקוח'))
    expect(headersOf(preview)).not.toContain('מס׳ לקוח')
    expect(headersOf(preview)).not.toContain('תאריך הוספה')
    expect(headersOf(preview)).not.toContain('רדום')
  })

  it('העמודות הנוספות **זמינות בבוחר** גם כשאינן מסומנות', async () => {
    mockPage(makeCustomers(1))
    renderPage()
    await openDialog()
    await screen.findByTestId('export-column-list')
    expect(screen.getByTestId('export-column-customer_id')).toBeInTheDocument()
    expect(screen.getByTestId('export-column-created_at')).toBeInTheDocument()
    expect(screen.getByTestId('export-column-is_dormant')).toBeInTheDocument()
  })

  it('🔴 "סמני הכול" מכניס את השאר לקובץ', async () => {
    mockPage(makeCustomers(1))
    renderPage()
    const preview = await openDialog()
    fireEvent.click(await screen.findByTestId('export-select-all'))
    await waitFor(() => expect(headersOf(preview)).toContain('מס׳ לקוח'))
    expect(headersOf(preview)).toContain('תאריך הוספה')
  })

  it('"טעון בירור" זמינה אך אינה בברירת-המחדל — הקריטריון של "מה חסר", מוחל על מסך שני', async () => {
    mockPage(makeCustomers(1))
    renderPage()
    const preview = await openDialog()
    await screen.findByTestId('export-column-list')
    expect(screen.getByTestId('export-column-low_satisfaction')).toBeInTheDocument()
    expect(headersOf(preview)).not.toContain('טעון בירור')
    // אבל המספר עצמו — "שביעות רצון" — כן בברירת-המחדל.
    expect(headersOf(preview)).toContain('שביעות רצון')
  })
})
