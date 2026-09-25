// חיבור כרטיס-הלקוח לחלון-הייצוא — שתי לשוניות, שני תיאורי-עמודות (23/09/2026).
//
// 🔑 **מה שנבדק:** ① כל לשונית מייצאת את עמודות-הטבלה שלה ולא את של האחרת · ② `value` הוא אותה
// נגזרת של המסך (`deriveQuoteAmount` · `statusPill` · `scoreTagText`) · ③ בלי הרשאת 'פרויקטים'
// הייצוא חסום עם הנוסח הקיים של הלשונית, לא קובץ ריק · ④ כשל בטעינת-הפרויקטים ⇒ חסימה + "נסי שוב"
// בתוך החלון.
// המוקים — אותם של `CustomerDetailsPage.projects.test.jsx`.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
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
import { deriveQuoteAmount, QUOTE_STATUS_LABELS } from '@/lib/quotes'

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

const authState = { permissions: { לקוחות: 'edit', 'הצעות מחיר': 'edit', פרויקטים: 'view' } }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }))

function offsetIso(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
}

const CUSTOMER = {
  customer_id: 46,
  company_name: 'מדיטק פתרונות בע"מ',
  company_number: '512345678',
  customer_type: 'private_company',
  status: 'active',
  customer_contacts: [
    {
      contact_id: 1,
      contact_name: 'דנה כהן',
      phone: '050-1234567',
      email: 'd@m.co.il',
      is_primary: true,
    },
  ],
  discount_percent: 0,
  marketing_consent: false,
}

function quote(over = {}) {
  return {
    quote_id: 901,
    event_name: 'כנס לקוחות',
    estimated_event_date: offsetIso(-10),
    quote_status: 'approved',
    rejection_reason: null,
    applied_customer_discount: 5,
    manual_discount: 0,
    vat_rate_snapshot: 18,
    quote_services: [{ qty: 2, closing_unit_price: 500 }],
    ...over,
  }
}

function project(over = {}) {
  return {
    project_id: 1,
    event_name: 'יום עיון',
    final_event_date: offsetIso(-30),
    project_status: 'finished',
    quote_id: 901,
    cancelled_at: null,
    cancel_type: null,
    cancelled_by: null,
    cancel_reason: null,
    quotes: quote(),
    project_changes: [],
    feedback_status: 'completed',
    feedback_score: 4,
    ...over,
  }
}

function mockApi({ quotes = [quote()], projects = [project()], projectsReject = false } = {}) {
  getCustomer.mockResolvedValue(CUSTOMER)
  listCustomerContacts.mockResolvedValue([])
  listQuotesByCustomer.mockResolvedValue(quotes)
  getQuoteScreenParams.mockResolvedValue([{ param_name: 'אחוז_מעמ', param_value: '18' }])
  getPricingCatalog.mockResolvedValue({ products: [], tiers: [], params: [] })
  getSentEntityIds.mockResolvedValue(new Set([901]))
  getCustomerScreenParams.mockResolvedValue([])
  if (projectsReject) getCustomerProjects.mockRejectedValue(new Error('network'))
  else getCustomerProjects.mockResolvedValue(projects)
}

async function renderPage() {
  render(
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
  await screen.findByTestId('customer-page')
}

async function openDialog() {
  fireEvent.click(screen.getByTestId('customer-export-button'))
  return within(await screen.findByTestId('export-preview'))
}
const headersOf = (preview) => preview.getAllByRole('columnheader').map((c) => c.textContent)

beforeEach(() => {
  vi.clearAllMocks()
  authState.permissions = { לקוחות: 'edit', 'הצעות מחיר': 'edit', פרויקטים: 'view' }
})

describe('CustomerDetailsPage — חיבור לחלון-הייצוא', () => {
  it('לשונית ההצעות: עמודות-הטבלה שלה + שורות-המשנה, ולא עמודות-הפרויקטים', async () => {
    mockApi()
    await renderPage()
    const heads = headersOf(await openDialog())
    for (const l of [
      'תאריך אירוע',
      'שם האירוע',
      'סכום',
      'הנחה %',
      'סטטוס',
      'סיבת דחייה',
      'נשלחה ללקוח',
    ]) {
      expect(heads).toContain(l)
    }
    expect(heads).not.toContain('שביעות רצון')
    expect(heads).not.toContain('מס׳ הצעה')
  })

  it('🔴 הסכום והסטטוס הם אותה נגזרת של השורה על המסך', async () => {
    const q = quote()
    mockApi({ quotes: [q] })
    await renderPage()
    const preview = await openDialog()
    const { total } = deriveQuoteAmount(q, 18)
    expect(total).toBeGreaterThan(0)
    const cells = () => preview.getAllByRole('cell').map((c) => c.textContent)
    await waitFor(() => expect(cells()).toContain(Math.round(total).toLocaleString('en-US')))
    expect(cells()).toContain(QUOTE_STATUS_LABELS.approved)
    expect(cells()).toContain('כן') // נשלחה ללקוח — sentIds מכיל 901
  })

  it('"נשלחה ללקוח" מחקה את המסך: "לא" רק על הצעה פתוחה, ריק על סגורה שלא נשלחה', async () => {
    mockApi({
      quotes: [
        quote({ quote_id: 1, event_name: 'פתוחה', quote_status: 'in_progress' }),
        quote({ quote_id: 2, event_name: 'סגורה', quote_status: 'rejected' }),
      ],
    })
    getSentEntityIds.mockResolvedValue(new Set())
    await renderPage()
    const preview = await openDialog()
    await waitFor(() => expect(preview.getByText('פתוחה')).toBeInTheDocument())
    const sentIdx = headersOf(preview).indexOf('נשלחה ללקוח')
    const rowCells = (name) =>
      within(preview.getAllByRole('row').find((r) => within(r).queryByText(name))).getAllByRole(
        'cell',
      )
    expect(rowCells('פתוחה')[sentIdx].textContent).toBe('לא')
    expect(rowCells('סגורה')[sentIdx].textContent).toBe('')
  })

  it('🔴 ציון-משוב יוצא רק כשהמשוב הושלם — כמו "—" על המסך', async () => {
    mockApi({
      projects: [
        project({
          project_id: 1,
          event_name: 'הושלם',
          feedback_status: 'completed',
          feedback_score: 4,
        }),
        project({
          project_id: 2,
          event_name: 'לא נשלח',
          feedback_status: 'not_sent',
          feedback_score: 4,
        }),
      ],
    })
    await renderPage()
    fireEvent.click(screen.getByTestId('customer-tab-projects'))
    const preview = await openDialog()
    await waitFor(() => expect(preview.getByText('הושלם')).toBeInTheDocument())
    const idx = headersOf(preview).indexOf('שביעות רצון')
    const rowCells = (name) =>
      within(preview.getAllByRole('row').find((r) => within(r).queryByText(name))).getAllByRole(
        'cell',
      )
    expect(rowCells('הושלם')[idx].textContent).toBe('טוב')
    expect(rowCells('לא נשלח')[idx].textContent).toBe('')
  })

  it('לשונית הפרויקטים: שביעות-רצון ופרטי-ביטול בקובץ, "הנחה %" לא — והתווית מ-scoreTagText', async () => {
    mockApi()
    await renderPage()
    fireEvent.click(screen.getByTestId('customer-tab-projects'))
    const preview = await openDialog()
    const heads = headersOf(preview)
    for (const l of ['תאריך אירוע', 'שם האירוע', 'סכום', 'סטטוס', 'שביעות רצון', 'סוג ביטול']) {
      expect(heads).toContain(l)
    }
    expect(heads).not.toContain('הנחה %')
    await waitFor(() => expect(preview.getByText('טוב')).toBeInTheDocument())
  })

  it('🔒 בלי הרשאת פרויקטים — הייצוא של הלשונית חסום עם הנוסח הקיים, לא קובץ ריק', async () => {
    authState.permissions = { לקוחות: 'edit', 'הצעות מחיר': 'edit', פרויקטים: 'blocked' }
    mockApi()
    await renderPage()
    fireEvent.click(screen.getByTestId('customer-tab-projects'))
    fireEvent.click(screen.getByTestId('customer-export-button'))
    await waitFor(() =>
      expect(screen.getByTestId('export-count')).toHaveTextContent('אין לך הרשאה לצפות בפרויקטים.'),
    )
    expect(screen.getByTestId('export-dialog-run')).toBeDisabled()
  })

  it('🔴 כשל בטעינת הפרויקטים — חסימה, ו"נסי שוב" בתוך החלון משחרר', async () => {
    mockApi({ projectsReject: true })
    await renderPage()
    fireEvent.click(screen.getByTestId('customer-tab-projects'))
    await screen.findByTestId('customer-projects-error')
    fireEvent.click(screen.getByTestId('customer-export-button'))
    await waitFor(() => expect(screen.getByTestId('export-count')).toHaveTextContent('לא נטענה'))
    expect(screen.getByTestId('export-dialog-run')).toBeDisabled()
    getCustomerProjects.mockResolvedValue([project()])
    fireEvent.click(
      within(screen.getByTestId('export-preview')).getByRole('button', { name: 'נסי שוב' }),
    )
    await waitFor(() => expect(screen.getByTestId('export-dialog-run')).toBeEnabled())
  })

  it('שורת-הכמות סופרת את כל ההצעות שבמסנן — 55 הצעות כשהעמוד מציג 50, ומסנן-סטטוס מקטין', async () => {
    const quotes = Array.from({ length: 55 }, (_, i) =>
      quote({
        quote_id: 900 + i,
        event_name: `אירוע ${i}`,
        quote_status: i < 5 ? 'in_progress' : 'approved',
      }),
    )
    mockApi({ quotes })
    await renderPage()
    expect(screen.getAllByTestId(/^customer-quote-\d+$/)).toHaveLength(50)
    await openDialog()
    await waitFor(() => expect(screen.getByTestId('export-count')).toHaveTextContent('55 שורות'))
    fireEvent.keyDown(document.activeElement, { key: 'Escape' })
    // ✏️ 25/09/2026 (מעבר-העיניים #7): השבב של `rejected` סופר גם הצעות שפגו — והוא אומר את זה.
    expect(screen.getByTestId('customer-quotes-chip-rejected')).toHaveTextContent('נדחו או פגו')
    // מסנן-סטטוס של המסך (מעל 8 הצעות) — הקובץ עוקב אחריו.
    fireEvent.click(screen.getByTestId('customer-quotes-chip-in_progress'))
    await openDialog()
    await waitFor(() => expect(screen.getByTestId('export-count')).toHaveTextContent('5 שורות'))
  })
})

// ✏️ 25/09/2026 (screens-pass s03): הראשי הופיע גם ב"איש קשר" וגם ב"אנשי קשר נוספים".
describe('CustomerDetailsPage — אנשי קשר נוספים', () => {
  it('הראשי אינו חוזר ב"אנשי קשר נוספים"; משני — כן', async () => {
    mockApi()
    listCustomerContacts.mockResolvedValue([
      {
        contact_id: 1,
        contact_name: 'ראשי בדיקה',
        phone: '050-1',
        email: 'a@x.co',
        is_primary: true,
      },
      {
        contact_id: 2,
        contact_name: 'משני בדיקה',
        phone: '050-2',
        email: 'b@x.co',
        is_primary: false,
      },
    ])
    await renderPage()
    const heading = await screen.findByText('אנשי קשר נוספים')
    const section = heading.parentElement
    expect(section).toHaveTextContent('משני בדיקה')
    expect(section).not.toHaveTextContent('ראשי בדיקה')
  })

  it('רק ראשי ⇒ אין סעיף "אנשי קשר נוספים"', async () => {
    mockApi()
    listCustomerContacts.mockResolvedValue([
      {
        contact_id: 1,
        contact_name: 'ראשי בדיקה',
        phone: '050-1',
        email: 'a@x.co',
        is_primary: true,
      },
    ])
    await renderPage()
    expect(screen.queryByText('אנשי קשר נוספים')).not.toBeInTheDocument()
  })
})
