// בדיקת רכיב לדוגמה - תבנית להעתקה לבדיקות UI עתידיות של מודולים.
// הטריק המרכזי: מוקקים את useAuth כדי לשלוט במצב המשתמש/ההרשאות בלי DB אמיתי.
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProtectedRoute from './ProtectedRoute'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))
import { useAuth } from '@/contexts/AuthContext'

function renderWith(authState) {
  useAuth.mockReturnValue(authState)
  return render(
    <ProtectedRoute allow="לקוחות">
      <div>תוכן מוגן</div>
    </ProtectedRoute>,
  )
}

describe('ProtectedRoute', () => {
  it('מציג טעינה כשעוד לא נטען', () => {
    renderWith({ loading: true, user: null, permissions: {} })
    expect(screen.getByText('טוען...')).toBeInTheDocument()
  })

  it('דורש התחברות כשאין משתמש', () => {
    renderWith({ loading: false, user: null, permissions: {} })
    expect(screen.getByText(/יש להתחבר/)).toBeInTheDocument()
  })

  it('חוסם משתמש בלי הרשאה למודול', () => {
    renderWith({
      loading: false,
      user: { roleName: 'לוגיסטיקה' },
      permissions: { לקוחות: 'blocked' },
    })
    expect(screen.getByText(/אין לך הרשאה/)).toBeInTheDocument()
    expect(screen.queryByText('תוכן מוגן')).not.toBeInTheDocument()
  })

  it('מרנדר את התוכן המוגן כשיש הרשאת edit/view', () => {
    renderWith({ loading: false, user: { roleName: 'לוגיסטיקה' }, permissions: { לקוחות: 'edit' } })
    expect(screen.getByText('תוכן מוגן')).toBeInTheDocument()
  })
})
