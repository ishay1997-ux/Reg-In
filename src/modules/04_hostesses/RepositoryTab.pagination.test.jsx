// בדיקת הדפדוף (`Pager`) במאגר-הדיילות (`RepositoryTab`) — מעבר-האחידות (הכרעת-ישי 04/09/2026,
// `src/lib/listWindow.js`). ללשונית הזו אין כתובת משלה (`HostessesPage` מחזיק את בחירת-הלשונית
// ב-`useState`), ולכן העמוד חי כאן ב-`useState` מקומי ולא ב-URL — ר' ההערה מעל `const [page, ...]`.
//
// 🔴 אין תאריך-אירוע על הדיילת עצמה ⇒ דפדוף בלבד, בלי `WindowChips` (כמו ב-`CustomersPage`).
// ה-API ממוקק כולו — אין Supabase כאן, בדיוק כמו `OverviewTab.params.test.jsx`.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RepositoryTab from './RepositoryTab'
import { listHostesses, listRepositoryAssignments, getHostessScreenParams } from './api'

vi.mock('./api', () => ({
  listHostesses: vi.fn(),
  listRepositoryAssignments: vi.fn(),
  getHostessScreenParams: vi.fn(),
  setHostessStatus: vi.fn(),
  releaseAssignment: vi.fn(),
}))

const authState = { permissions: { דיילות: 'edit' } }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }))
vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

// יוצר `count` דיילות, כל אחת עם שם ייחודי — לא נתוני-בדיקה אחידים (`src/CLAUDE.md`).
function makeHostesses(count) {
  return Array.from({ length: count }, (_, i) => {
    const id = i + 1
    return {
      hostess_id: id,
      full_name: `דיילת מספר ${String(id).padStart(3, '0')}`,
      city: 'תל אביב',
      phone: '050-0000000',
      rating: 4,
      hourly_rate: 45,
      status: 'active',
      hostess_unavailability: [],
    }
  })
}

function mockPage(hostesses) {
  listHostesses.mockResolvedValue(hostesses)
  listRepositoryAssignments.mockResolvedValue([])
  getHostessScreenParams.mockResolvedValue({})
}

function renderTab() {
  return render(
    <RepositoryTab reloadKey={0} onAdd={vi.fn()} onEdit={vi.fn()} onOpenCard={vi.fn()} />,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.permissions = { דיילות: 'edit' }
})

describe('מאגר-הדיילות — דפדוף (מעבר-האחידות)', () => {
  it('מתחת ל-50 שורות אין כפתורי-דפדוף, רק מונה (מעבר-המלאי)', async () => {
    mockPage(makeHostesses(5))
    renderTab()

    await screen.findByTestId('repository-row-1')
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('1–5')
    expect(screen.queryByTestId('list-pager-next')).not.toBeInTheDocument()
  })

  it('186 דיילות (המספר האמיתי כיום, כולל לא-פעילות) — עמוד ראשון 50, ומעבר-עמוד מציג את השאר', async () => {
    mockPage(makeHostesses(186))
    renderTab()

    await screen.findByTestId('repository-row-1')
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('1–50')
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('186')
    expect(screen.getByTestId('list-pager-page')).toHaveTextContent('1/4')
    expect(screen.getByText('דיילת מספר 001')).toBeInTheDocument()
    expect(screen.queryByText('דיילת מספר 051')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('list-pager-next'))

    expect(await screen.findByText('דיילת מספר 051')).toBeInTheDocument()
    expect(screen.queryByText('דיילת מספר 001')).not.toBeInTheDocument()
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('51–100')
  })

  it('חיפוש מאפס את העמוד ל-1 — לא נשארים על "עמוד ריק" אחרי סינון מצמצם', async () => {
    mockPage(makeHostesses(186))
    renderTab()

    await screen.findByText('דיילת מספר 001')
    fireEvent.click(screen.getByTestId('list-pager-next')) // עמוד 2
    expect(await screen.findByText('דיילת מספר 051')).toBeInTheDocument()

    fireEvent.change(screen.getByTestId('repository-search'), {
      target: { value: 'דיילת מספר 0' },
    })

    expect(await screen.findByText('דיילת מספר 001')).toBeInTheDocument()
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('1–')
  })
})
