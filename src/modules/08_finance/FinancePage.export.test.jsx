// חיבור מסך-הכספים לחלון-הייצוא — המסך השלישי מחוץ למודול 11, והראשון עם **שלושה סטים** של ליבה.
//
// 🔑 **מה שנבדק כאן:** ① ברירת-המחדל מתחלפת עם הלשונית (מה שהטבלה מראה, ולא איחוד של הכול) ·
// ② כל `value` הוא אותה גזירה שהטבלה גזרה — ימי-האיחור נעלמים בקובץ בדיוק כשהחוב סגור, כמו על
// המסך · ③ הקובץ מקבל את כל מה שבמסנן ולא את עמוד-הדפדוף · ④ המע"מ שנטען בנפרד מחזיק את החלון
// בטעינה, וכשל בו חוסם — כדי שלא יירד קובץ עם עמודת "כולל מע"מ" ריקה.
//
// המוקים והפיקסטורות — אותם של `FinancePage.test.jsx` (המוק ל-`@/supabaseClient` חובה ל-CI).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FinancePage from './FinancePage'
import { listFinanceOverview } from './api'
import { getParamValue } from '@/modules/06_projects/closingApi'
import { getParamValues } from '@/api/params'
import { deriveDaysOverdue } from '@/lib/projectFinance'
import { PAGE_SIZE } from '@/lib/listWindow'

vi.mock('@/supabaseClient', () => ({
  supabase: { rpc: vi.fn(), from: vi.fn(), storage: { from: vi.fn() } },
}))
vi.mock('./api', async () => {
  const actual = await vi.importActual('./api')
  return { ...actual, listFinanceOverview: vi.fn() }
})
vi.mock('@/modules/06_projects/closingApi', () => ({ getParamValue: vi.fn() }))
vi.mock('@/api/params', () => ({ getParamValues: vi.fn() }))
vi.mock('./ClosingWindowDialog', () => ({ default: () => null }))
vi.mock('./SalaryReportDialog', () => ({ default: () => null }))

const NOW = new Date('2026-10-15T10:00:00Z')

function overviewRow(overrides = {}) {
  return {
    project_id: 0,
    event_name: '',
    customer_id: 1,
    customer_name: '',
    project_status: 'awaiting_invoice',
    tab: 'awaiting_invoice',
    revenue: '0.00',
    gross_profit: '0.00',
    final_profit: null,
    invoice_sent: false,
    invoice_sent_at: null,
    payment_date: null,
    payment_terms_days: 30,
    feedback_status: 'pending',
    feedback_score: null,
    cancelled_at: null,
    cancel_type: null,
    cancellation_fee: null,
    written_off: false,
    credit_note_flag: false,
    operationally_closed_at: null,
    archived_at: null,
    ...overrides,
  }
}

const P15 = overviewRow({
  project_id: 15,
  event_name: 'ערב השקה — קמפוס צפון',
  customer_name: 'קמפוס טכנולוגי צפון בע"מ',
  project_status: 'awaiting_payment',
  tab: 'awaiting_payment',
  revenue: '5985.00',
  invoice_sent: true,
  invoice_sent_at: '2026-09-10T09:00:00Z',
  operationally_closed_at: '2026-09-08T09:00:00Z',
})
const P13 = overviewRow({
  project_id: 13,
  event_name: 'פסטיבל קיץ עירוני',
  customer_name: 'עיריית חדרה',
  project_status: 'finished',
  tab: 'finished',
  revenue: '5300.00',
  final_profit: '3650.00',
  invoice_sent: true,
  invoice_sent_at: '2026-08-28T09:00:00Z',
  payment_date: '2026-09-04',
  feedback_status: 'completed',
  feedback_score: 4,
  operationally_closed_at: '2026-08-25T09:00:00Z',
  archived_at: '2026-09-06T09:00:00Z',
})
const P12 = overviewRow({
  project_id: 12,
  event_name: 'כנס משקיעים שנתי',
  customer_name: 'קבוצת אחזקות דנוך בע"מ',
  revenue: '500.00',
  operationally_closed_at: '2026-08-21T09:00:00Z',
})

async function renderPage(url = '/finance') {
  render(<FinancePage />, {
    wrapper: ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>,
  })
  await screen.findByTestId('finance-table')
}

async function openDialog() {
  fireEvent.click(await screen.findByTestId('finance-export-button'))
  return within(await screen.findByTestId('export-preview'))
}
const headersOf = (preview) => preview.getAllByRole('columnheader').map((c) => c.textContent)

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(NOW)
  listFinanceOverview.mockResolvedValue([P15, P12, P13])
  getParamValue.mockResolvedValue('18')
  getParamValues.mockResolvedValue({ סף_שביעות_רצון: '3' })
})
afterEach(() => vi.useRealTimers())

describe('FinancePage — חיבור לחלון-הייצוא, ליבה פר-לשונית', () => {
  it('לשונית "ממתין לתשלום" (ברירת-המחדל): ימי-איחור ומועד-פירעון בקובץ, "הועבר לארכיון" לא', async () => {
    await renderPage()
    const heads = headersOf(await openDialog())
    for (const label of [
      'אירוע',
      'לקוח',
      'חשבונית נשלחה',
      'מועד פירעון',
      'ימי איחור',
      'סכום לתשלום',
      'כולל מע"מ',
      'סטטוס',
    ]) {
      expect(heads).toContain(label)
    }
    expect(heads).not.toContain('הועבר לארכיון')
    expect(heads).not.toContain('רווח סופי')
    expect(heads).not.toContain('מס׳ פרויקט')
  })

  it('לשונית "הסתיימו": רווח סופי ושביעות-רצון בקובץ, ימי-איחור לא — והתווית "סכום" בלי "לתשלום"', async () => {
    await renderPage()
    fireEvent.click(screen.getByRole('tab', { name: /הסתיימו/ }))
    const heads = headersOf(await openDialog())
    for (const label of ['הועבר לארכיון', 'רווח סופי %', 'רווח סופי', 'שביעות רצון', 'סטטוס']) {
      expect(heads).toContain(label)
    }
    expect(heads).not.toContain('ימי איחור')
    expect(heads).not.toContain('סכום לתשלום')
  })

  it('לשונית "ממתין לחשבונית": תאריך אחד + מהותו (כמו על המסך), ושלוש התגיות בליבה בכל לשונית', async () => {
    await renderPage()
    fireEvent.click(screen.getByRole('tab', { name: /ממתין לחשבונית/ }))
    const heads = headersOf(await openDialog())
    for (const label of ['תאריך', 'מהות התאריך', 'סוג ביטול', 'חוב אבוד', 'נדרשת חשבונית זיכוי']) {
      expect(heads).toContain(label)
    }
    expect(heads).not.toContain('נסגר תפעולית')
    expect(heads).not.toContain('תאריך ביטול')
  })

  it('🔴 ימי-האיחור בקובץ הם אותה גזירה של המסך — מספר על חוב פתוח, ריק כששולם', async () => {
    const paid = { ...P15, project_id: 16, event_name: 'שולם כבר', payment_date: '2026-10-01' }
    listFinanceOverview.mockResolvedValue([P15, paid])
    await renderPage()
    const preview = await openDialog()
    const expected = String(
      deriveDaysOverdue(P15.invoice_sent_at, P15.payment_terms_days, '2026-10-15'),
    )
    expect(Number(expected)).toBeGreaterThan(0)
    await waitFor(() =>
      expect(preview.getAllByRole('cell').map((c) => c.textContent)).toContain(expected),
    )
    const rows = preview.getAllByRole('row').slice(1)
    const overdueIdx = headersOf(preview).indexOf('ימי איחור')
    const paidRow = rows.find((r) => within(r).queryByText('שולם כבר'))
    expect(within(paidRow).getAllByRole('cell')[overdueIdx].textContent).toBe('')
  })

  it('🔴 המסך מציג "טוב" לציון 4 — והקובץ מקבל את אותה תווית, לא את המספר', async () => {
    await renderPage()
    fireEvent.click(screen.getByRole('tab', { name: /הסתיימו/ }))
    const preview = await openDialog()
    await waitFor(() => expect(preview.getByText('טוב')).toBeInTheDocument())
  })

  it('שורת-הכמות סופרת את כל הלשונית שבמסנן — לא את עמוד-הדפדוף', async () => {
    const many = Array.from({ length: PAGE_SIZE + 5 }, (_, i) => ({
      ...P15,
      project_id: 100 + i,
      event_name: `אירוע ${i}`,
    }))
    listFinanceOverview.mockResolvedValue(many)
    await renderPage()
    expect(screen.getAllByTestId(/^finance-row-/)).toHaveLength(PAGE_SIZE)
    await openDialog()
    await waitFor(() =>
      expect(screen.getByTestId('export-count')).toHaveTextContent(`${many.length} שורות`),
    )
  })

  it('🔴 בעוד המע"מ בדרך — החלון בטעינה; כשל במע"מ — חסימה עם סיבה, לא עמודה ריקה', async () => {
    let resolveVat
    getParamValue.mockReturnValue(new Promise((r) => (resolveVat = r)))
    await renderPage()
    fireEvent.click(screen.getByTestId('finance-export-button'))
    expect(await screen.findByTestId('export-preview-loading')).toBeInTheDocument()
    expect(screen.getByTestId('export-dialog-run')).toBeDisabled()
    resolveVat('18')
    await waitFor(() => expect(screen.getByTestId('export-dialog-run')).toBeEnabled())
  })

  it('🔴 כשל בטעינת המע"מ ⇒ הייצוא חסום והסיבה כתובה', async () => {
    getParamValue.mockRejectedValue(new Error('missing'))
    await renderPage()
    fireEvent.click(screen.getByTestId('finance-export-button'))
    await waitFor(() => expect(screen.getByTestId('export-count')).toHaveTextContent('לא נטען'))
    expect(screen.getByTestId('export-dialog-run')).toBeDisabled()
    // ההודעה מבטיחה "נסי שוב" — והכפתור קיים בחלון, ולחיצה עליו טוענת מחדש ומשחררת.
    getParamValue.mockResolvedValue('18')
    fireEvent.click(screen.getByRole('button', { name: 'נסי שוב' }))
    await waitFor(() => expect(screen.getByTestId('export-dialog-run')).toBeEnabled())
  })
})
