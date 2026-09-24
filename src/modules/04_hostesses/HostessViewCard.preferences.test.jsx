// כרטיס-דיילת · "העדפות של לקוחות" — ליטושי-הכנס, חבילה C1 (24/09/2026).
//
// 🔴 **מה שהבדיקה נועלת:** עד היום הסעיף אמר *"טרם נרשמו העדפות"* **לכל דיילת**, קבוע בקוד, בעוד
// שבמסד יש כ-2,000 העדפות. ושלושת המצבים (`CLAUDE.md` §4.3): **כשל-טעינה לעולם אינו "טרם נרשמו"** —
// הוא "לא נטענו" עם "נסי שוב", ושאר הכרטיס ממשיך לעבוד.
//
// ה-API ממוקק כולו — אין Supabase כאן. (ה-RLS לתפקיד מנהלת-גיוס נבדק בדפדפן החי, לא כאן.)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HostessViewCard from './HostessViewCard'
import {
  getHostess,
  getHostessAssignments,
  getHostessClientPreferences,
  getHostessScreenParams,
} from './api'

vi.mock('./api', () => ({
  getHostess: vi.fn(),
  getHostessAssignments: vi.fn(),
  getHostessClientPreferences: vi.fn(),
  getHostessScreenParams: vi.fn(),
}))
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ permissions: { דיילות: 'view' } }) }))

const HOSTESS = {
  hostess_id: 1,
  full_name: 'נועה שגיא',
  city: 'תל אביב',
  phone: '050-1234567',
  email: 'noa@example.co.il',
  status: 'active',
  hostess_unavailability: [],
  created_at: '2025-01-01T00:00:00Z',
  lat: 32.08,
}

function renderCard() {
  return render(<HostessViewCard hostessId={1} onClose={vi.fn()} onEdit={vi.fn()} />)
}

beforeEach(() => {
  vi.clearAllMocks()
  getHostess.mockResolvedValue(HOSTESS)
  getHostessAssignments.mockResolvedValue([])
  getHostessScreenParams.mockResolvedValue({})
})

describe('כרטיס-דיילת — העדפות של לקוחות', () => {
  it('העדפות אמיתיות: שם-הלקוח, התווית העברית והסיבה — "לא_לשלוח" לעולם לא גולמי', async () => {
    getHostessClientPreferences.mockResolvedValue([
      { customerId: 7, customerName: 'אלפא אירועים', preference: 'מצוינת', reason: null },
      { customerId: 9, customerName: 'בטא כנסים', preference: 'לא_לשלוח', reason: 'איחרה פעמיים' },
    ])
    renderCard()

    const list = await screen.findByTestId('hostess-preferences')
    // מקובץ לפי סוג (דיילות עם 25–37 העדפות במסד): "לא לשלוח שוב" ראשון ועם הסיבה.
    const negative = screen.getByTestId('hostess-preferences-warn')
    expect(negative).toHaveTextContent('לא לשלוח שוב')
    expect(negative).toHaveTextContent('בטא כנסים')
    expect(negative).toHaveTextContent('איחרה פעמיים')
    const excellent = screen.getByTestId('hostess-preferences-teal')
    expect(excellent).toHaveTextContent('מצוינת')
    expect(excellent).toHaveTextContent('אלפא אירועים')
    expect(list.firstChild).toBe(negative)
    expect(list).not.toHaveTextContent('לא_לשלוח')
    expect(screen.queryByText('טרם נרשמו העדפות')).not.toBeInTheDocument()
  })

  it('אין העדפות ⇒ "טרם נרשמו העדפות"', async () => {
    getHostessClientPreferences.mockResolvedValue([])
    renderCard()
    expect(await screen.findByText('טרם נרשמו העדפות')).toBeInTheDocument()
  })

  it('כשל-טעינה ⇒ "לא נטענו" + "נסי שוב", לעולם לא "טרם נרשמו"; ושאר הכרטיס מוצג', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    getHostessClientPreferences
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce([
        { customerId: 7, customerName: 'אלפא אירועים', preference: 'בסדר', reason: null },
      ])
    renderCard()

    expect(await screen.findByTestId('hostess-preferences-error')).toHaveTextContent(
      'העדפות הלקוחות לא נטענו.',
    )
    expect(screen.queryByText('טרם נרשמו העדפות')).not.toBeInTheDocument()
    expect(screen.getByTestId('hostess-card-title')).toHaveTextContent('נועה שגיא')

    fireEvent.click(screen.getByTestId('hostess-preferences-retry'))
    expect(await screen.findByTestId('hostess-preference-7')).toHaveTextContent('אלפא אירועים')
    expect(screen.getByTestId('hostess-preferences-outline')).toHaveTextContent('בסדר')
    expect(getHostessClientPreferences).toHaveBeenCalledTimes(2)
  })
})
