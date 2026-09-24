// חלון-המסמך ⇐ "נסחי מייל מעקב" (ליטושי-הכנס D2, 24/09/2026) — **החיווט בלבד:** האם השורה מוצגת,
// ואם היא מושבת — עם איזה נימוק, לפי הסטטוס, יומן-המיילים וההרשאה. הכלל עצמו נבדק ב-
// `src/lib/quoteFollowup.test.js`; החלון שנפתח ב-`FollowupDraftDialog.test.jsx`.
// ⚠️ ה-PDF אינו מופק כאן (`03_quotes/CLAUDE.md`: PDF תחת vitest אינו ראיה) — ההפקה ממוקמת כנכשלת,
// והשורה אינה תלויה בה.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ToastProvider } from '@/components/ToastProvider'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import QuoteDocumentDialog from './QuoteDocumentDialog'
import { getLastSuccessfulSend } from '@/api/email'

vi.mock('@/supabaseClient', () => ({ supabase: { functions: { invoke: vi.fn() } } }))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { fullName: 'דנה' }, onboardingMode: 0 }),
}))
vi.mock('@/api/email', () => ({ getLastSuccessfulSend: vi.fn(), sendEmail: vi.fn() }))
vi.mock('@/modules/03_quotes/quotePdf', async (importOriginal) => ({
  ...(await importOriginal()),
  renderQuotePdfBlob: () => Promise.reject(new Error('no PDF under jsdom')),
}))

function quote(overrides) {
  return {
    quote_id: 31,
    event_name: 'כנס השנתי',
    quote_status: 'in_progress',
    rejection_reason: null,
    quote_services: [],
    customers: { company_name: 'לקוח', customer_contacts: [] },
    ...overrides,
  }
}

function renderDocument(q, { canEdit = true } = {}) {
  return render(
    <ToastProvider>
      <ConfirmProvider>
        <QuoteDocumentDialog
          open
          onOpenChange={() => {}}
          quote={q}
          productsBySku={{}}
          vatRate={18}
          validityDays="30"
          emailTemplate="תבנית"
          canEdit={canEdit}
        />
      </ConfirmProvider>
    </ToastProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('חלון-המסמך — שורת "נסחי מייל מעקב"', () => {
  it('הצעה פתוחה שנשלחה ⇒ פעיל, בלי נימוק', async () => {
    getLastSuccessfulSend.mockResolvedValue({
      created_at: '2026-08-28T10:00:00Z',
      recipient: 'a@b.co',
    })
    renderDocument(quote())
    await waitFor(() => expect(screen.getByTestId('quote-followup-open')).toBeEnabled())
    expect(screen.queryByTestId('quote-followup-reason')).not.toBeInTheDocument()
  })

  it('הצעה פתוחה שלא נשלחה ⇒ מושבת, והנימוק "ההצעה עוד לא נשלחה ללקוח" גלוי', async () => {
    getLastSuccessfulSend.mockResolvedValue(null)
    renderDocument(quote())
    expect(await screen.findByText('ההצעה עוד לא נשלחה ללקוח')).toBeVisible()
    expect(screen.getByTestId('quote-followup-open')).toBeDisabled()
  })

  it('יומן-המיילים נכשל ⇒ פעיל (והבאנר הענבר הקיים אומר שלא נבדק)', async () => {
    getLastSuccessfulSend.mockRejectedValue(new Error('RLS'))
    renderDocument(quote())
    await screen.findByTestId('quote-send-check-notice')
    expect(screen.getByTestId('quote-followup-open')).toBeEnabled()
  })

  it('הצעה שפג תוקפה ⇒ פעיל, גם בלי שורה ביומן', async () => {
    getLastSuccessfulSend.mockResolvedValue(null)
    renderDocument(quote({ quote_status: 'rejected', rejection_reason: 'פג תוקף' }))
    await waitFor(() => expect(screen.getByTestId('quote-followup-open')).toBeEnabled())
  })

  it('הצעה שאושרה, או שנדחתה מסיבה אחרת ⇒ אין שורה', async () => {
    getLastSuccessfulSend.mockResolvedValue(null)
    const { unmount } = renderDocument(quote({ quote_status: 'approved' }))
    await waitFor(() => expect(getLastSuccessfulSend).toHaveBeenCalled())
    expect(screen.queryByTestId('quote-followup-row')).not.toBeInTheDocument()
    unmount()
    renderDocument(quote({ quote_status: 'rejected', rejection_reason: 'המחיר גבוה' }))
    expect(screen.queryByTestId('quote-followup-row')).not.toBeInTheDocument()
  })

  it('בלי `canEdit` (כרטיס-הלקוח · צפייה בלבד) ⇒ אין שורה', async () => {
    getLastSuccessfulSend.mockResolvedValue({ created_at: '2026-08-28T10:00:00Z', recipient: 'a' })
    renderDocument(quote(), { canEdit: false })
    await waitFor(() => expect(getLastSuccessfulSend).toHaveBeenCalled())
    expect(screen.queryByTestId('quote-followup-row')).not.toBeInTheDocument()
  })
})
