// "חזרה למקור" בכרטיס-הדיילת (ליטושי-הכנס 0ב · תיקון מביקורת-קוד, 24/09/2026).
// 🔑 **חזרה-בסגירה רק כשנסגר הכרטיס שהדלת פתחה.** מכרטיס "דיילות" ריק במסך הבית
// (`/hostesses?returnTo=/`) — כרטיס שהיא פתחה בעצמה מהמאגר נסגר סגירה רגילה, והיא נשארת במסך.
// הלשוניות, הכרטיס והטופס ממוקקים: נבדק החיווט של `HostessesPage` בלבד.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import HostessesPage from './HostessesPage'

vi.mock('./RepositoryTab', () => ({
  default: ({ onOpenCard }) => (
    <button type="button" onClick={() => onOpenCard(7)}>
      פתחי את דיילת 7
    </button>
  ),
}))
vi.mock('./OverviewTab', () => ({ default: () => <p>מבט-על</p> }))
vi.mock('./HostessFormDialog', () => ({ default: () => null }))
vi.mock('./SmartMatchPage', () => ({ default: () => null }))
vi.mock('./api', () => ({ resendExpiredInvites: vi.fn() }))
vi.mock('./HostessViewCard', () => ({
  default: ({ hostessId, onClose }) => (
    <div data-testid="card-stub">
      <p data-testid="card-stub-id">{hostessId}</p>
      <button type="button" onClick={onClose}>
        סגירת הכרטיס
      </button>
    </div>
  ),
}))

function Where() {
  const location = useLocation()
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>
}

function renderAt(entry) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/hostesses" element={<HostessesPage />} />
        <Route path="*" element={<p>יעד-חזרה</p>} />
      </Routes>
      <Where />
    </MemoryRouter>,
  )
}

describe('HostessesPage — חזרה-בסגירה רק לכרטיס שהדלת פתחה', () => {
  it('מדוח: סגירת הכרטיס שהדלת פתחה ⇒ חוזרים לדוח', () => {
    renderAt(`/hostesses?hostess=438&returnTo=${encodeURIComponent('/reports?tab=hostesses')}`)
    expect(screen.getByTestId('card-stub-id')).toHaveTextContent('438')
    fireEvent.click(screen.getByRole('button', { name: 'סגירת הכרטיס' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/reports?tab=hostesses')
  })

  it('מכרטיס ריק במסך הבית: כרטיס שנפתח מהמאגר ונסגר ⇒ נשארים במסך הדיילות', () => {
    renderAt('/hostesses?returnTo=%2F')
    fireEvent.click(screen.getByTestId('hostesses-tab-repository'))
    fireEvent.click(screen.getByRole('button', { name: 'פתחי את דיילת 7' }))
    expect(screen.getByTestId('card-stub-id')).toHaveTextContent('7')
    fireEvent.click(screen.getByRole('button', { name: 'סגירת הכרטיס' }))
    expect(screen.queryByTestId('card-stub')).not.toBeInTheDocument()
    expect(screen.getByTestId('where').textContent.startsWith('/hostesses')).toBe(true)
    expect(screen.getByTestId('where')).not.toHaveTextContent('hostess=')
    expect(screen.getByTestId('return-to-link')).toHaveTextContent('חזרה למסך הבית')
  })
})
