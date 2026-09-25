// בדיקת חלון-הזמן + הדפדוף על "היסטוריה" בכרטיס-הצפייה של דיילת (מעבר-האחידות,
// הכרעת-ישי 04/09/2026, `src/lib/listWindow.js`).
//
// 🔴 החלון חל **רק על ההיסטוריה** — "שיבוצים קרובים" הוא כבר רשימה קצרה של מחר-והלאה.
// הכרטיס הוא overlay בלי כתובת משלו (`processes-approved.md`: "באותו מסך") ⇒ החלון
// והעמוד חיים ב-`useState` מקומי, לא בכתובת — בניגוד ל-`CustomersPage`.
//
// ה-API ממוקק כולו — אין Supabase כאן.
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

const authState = { permissions: { דיילות: 'view' } }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }))

const HOSTESS = {
  hostess_id: 1,
  full_name: 'נועה שגיא',
  city: 'תל אביב',
  phone: '050-1234567',
  email: 'noa@example.co.il',
  rating: 4.5,
  has_car: true,
  status: 'active',
  hostess_unavailability: [],
  created_at: '2025-01-01T00:00:00Z',
  lat: 32.08,
}

// שורת-שיבוץ היסטורית (הושלמה) בתאריך נתון. כל שורה מקבלת `project_id` ייחודי —
// לא נתוני-בדיקה אחידים (`src/CLAUDE.md`).
function historyRow(projectId, dateIso) {
  return {
    project_id: projectId,
    hostess_id: 1,
    assignment_number: 1,
    assignment_status: 'finally_approved',
    invite_sent_at: `${dateIso}T08:00:00Z`,
    projects: {
      final_event_date: dateIso,
      final_start_time: '18:00:00',
      event_name: `אירוע ${projectId}`,
      customer_name: `לקוח ${projectId}`,
      project_status: 'finished',
    },
  }
}

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
}

function mockCard(assignments) {
  getHostess.mockResolvedValue(HOSTESS)
  getHostessAssignments.mockResolvedValue(assignments)
  getHostessScreenParams.mockResolvedValue({})
  getHostessClientPreferences.mockResolvedValue([])
}

function renderCard() {
  return render(<HostessViewCard hostessId={1} onClose={vi.fn()} onEdit={vi.fn()} />)
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.permissions = { דיילות: 'view' }
})

describe('כרטיס-דיילת — חלון-זמן + דפדוף על ההיסטוריה', () => {
  it('ברירת-המחדל ("3 חודשים") מסתירה שיבוץ ישן, ו"הכול" מציג אותו', async () => {
    // אירוע-ישן: לפני 200 יום — מחוץ ל-90 יום. אירוע-טרי: לפני 10 ימים — בפנים.
    mockCard([historyRow(1, isoDaysAgo(200)), historyRow(2, isoDaysAgo(10))])
    renderCard()

    await screen.findByTestId('hostess-card-title')
    expect(screen.getByText('אירוע 2')).toBeInTheDocument()
    expect(screen.queryByText('אירוע 1')).not.toBeInTheDocument()
    // גלולת "3 חודשים" נבחרת כברירת-מחדל, והמונה מראה ששורה אחת מוסתרת.
    expect(screen.getByTestId('list-window-hidden')).toHaveTextContent('1')

    fireEvent.click(screen.getByTestId('list-window-all'))

    expect(await screen.findByText('אירוע 1')).toBeInTheDocument()
    expect(screen.getByText('אירוע 2')).toBeInTheDocument()
    expect(screen.queryByTestId('list-window-hidden')).not.toBeInTheDocument()
  })

  it('156 שורות-היסטוריה (מקרה אמיתי בדיילת אחת) — "הכול" מציג עמוד ראשון של 50 עם דפדוף', async () => {
    const rows = Array.from({ length: 156 }, (_, i) => historyRow(i + 1, isoDaysAgo(i + 1)))
    mockCard(rows)
    renderCard()

    await screen.findByTestId('hostess-card-title')
    fireEvent.click(screen.getByTestId('list-window-all'))

    expect(await screen.findByTestId('list-pager')).toBeInTheDocument()
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('1–50')
    expect(screen.getByTestId('list-pager-range')).toHaveTextContent('156')
    expect(screen.getByTestId('list-pager-page')).toHaveTextContent('1/4')
  })

  it('החלפת-חלון מאפסת את העמוד ל-1', async () => {
    const rows = Array.from({ length: 156 }, (_, i) => historyRow(i + 1, isoDaysAgo(i + 1)))
    mockCard(rows)
    renderCard()

    await screen.findByTestId('hostess-card-title')
    fireEvent.click(screen.getByTestId('list-window-all'))
    await screen.findByTestId('list-pager')
    fireEvent.click(screen.getByTestId('list-pager-next')) // עמוד 2
    expect(await screen.findByTestId('list-pager-page')).toHaveTextContent('2/4')

    // חזרה לחלון "3 חודשים" — כל 156 השורות הן בתוך 156 יום, כך שרובן ייעלמו; מה
    // שנבדק הוא שהעמוד חזר ל-1, לא כמות-התוצאות.
    fireEvent.click(screen.getByTestId('list-window-90d'))
    expect(await screen.findByTestId('list-pager-range')).toHaveTextContent('1–')
  })
})

// ✏️ 25/09/2026 (סבב תיקוני-אמת, מעבר-העיניים #10): "שיבוצים קרובים" הציג אירוע מבוטל (1626) בלי שום סימון.
describe('שיבוצים קרובים — אירוע שבוטל מסומן', () => {
  function isoDaysAhead(days) {
    return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
  }

  it('אירוע מבוטל ⇒ "האירוע בוטל" במקום סטטוס-השיבוץ; אירוע רגיל ⇒ סטטוס-השיבוץ', async () => {
    const cancelled = historyRow(1626, isoDaysAhead(40))
    cancelled.projects.project_status = 'cancelled'
    const live = historyRow(1627, isoDaysAhead(41))
    live.projects.project_status = 'ready'
    mockCard([cancelled, live])
    renderCard()

    await screen.findByTestId('hostess-card-title')
    const cancelledRow = screen.getByText('אירוע 1626').closest('tr')
    expect(cancelledRow).toHaveTextContent('האירוע בוטל')
    expect(cancelledRow).not.toHaveTextContent('אושרה סופית')
    const liveRow = screen.getByText('אירוע 1627').closest('tr')
    expect(liveRow).not.toHaveTextContent('בוטל')
  })
})

// ✏️ 25/09/2026 (צלם-דוחות על האתר החי): התג "סימנה אי-זמינות" מעולם לא הופיע בכרטיס — טבלת "שיבוצים קרובים"
// לא קיבלה `ranges`/`today`, והיחידה שקיבלה (ההיסטוריה) היא בדיוק זו שבה אין תג לעולם (אירוע שעבר).
describe('שיבוצים קרובים — תג "סימנה אי-זמינות" על שיבוץ מאושר בתוך טווח אי-זמינות', () => {
  function isoDaysAhead(days) {
    return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
  }

  it('שיבוץ מאושר-סופית בתוך טווח אי-זמינות ⇒ התג מופיע בשורה שלו בטבלת הקרובים', async () => {
    const eventDate = isoDaysAhead(30)
    const inside = historyRow(1620, eventDate)
    inside.projects.project_status = 'in_progress'
    const outside = historyRow(1700, isoDaysAhead(60))
    outside.projects.project_status = 'ready'
    getHostess.mockResolvedValue({
      ...HOSTESS,
      hostess_unavailability: [
        { start_date: isoDaysAhead(28), end_date: isoDaysAhead(32), note: 'חופשה' },
      ],
    })
    getHostessAssignments.mockResolvedValue([inside, outside])
    getHostessScreenParams.mockResolvedValue({})
    getHostessClientPreferences.mockResolvedValue([])
    renderCard()

    await screen.findByTestId('hostess-card-title')
    expect(screen.getByTestId('hostess-unavailable-1620')).toBeInTheDocument()
    expect(screen.queryByTestId('hostess-unavailable-1700')).not.toBeInTheDocument()
  })
})
