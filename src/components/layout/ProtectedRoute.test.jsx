// בדיקת רכיב לדוגמה - תבנית להעתקה לבדיקות UI עתידיות של מודולים.
// הטריק המרכזי: מוקקים את useAuth כדי לשלוט במצב המשתמש/ההרשאות בלי DB אמיתי.
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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

  // ⚠️ שלוש הבדיקות הבאות שומרות על ההבחנה שנולדה בסבב-התיקון של 31/07: "לא הצלחנו
  // לטעון הרשאות" אינו "אין לך הרשאה". בלעדיהן, החזרת שתי ההודעות לאחת לא תפיל דבר.
  it('כשל בטעינת ההרשאות ⇒ הסבר + "נסה שוב", ולא האשמת המשתמש', () => {
    renderWith({
      loading: false,
      user: { roleName: 'לוגיסטיקה' },
      permissions: {},
      permissionsError: true,
      reload: vi.fn(),
    })
    expect(screen.getByText(/לא הצלחנו לטעון את ההרשאות/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'נסה שוב' })).toBeInTheDocument()
    expect(screen.queryByText(/אין לך הרשאה/)).not.toBeInTheDocument()
  })

  it('"נסה שוב" קורא ל-reload של הקונטקסט', () => {
    const reload = vi.fn()
    renderWith({
      loading: false,
      user: { roleName: 'לוגיסטיקה' },
      permissions: {},
      permissionsError: true,
      reload,
    })
    fireEvent.click(screen.getByRole('button', { name: 'נסה שוב' }))
    expect(reload).toHaveBeenCalledTimes(1)
  })

  // המפה הישנה מנצחת: כשל-רענון באמצע סשן לא מוציא משתמש עובד מהמסך שלו.
  it('כשל-טעינה עם מפה תקפה ⇒ המסך ממשיך לעבוד', () => {
    renderWith({
      loading: false,
      user: { roleName: 'לוגיסטיקה' },
      permissions: { לקוחות: 'edit' },
      permissionsError: true,
      reload: vi.fn(),
    })
    expect(screen.getByText('תוכן מוגן')).toBeInTheDocument()
  })

  // שלילת-הרשאה אמיתית לא השתנתה — ההודעה הישנה נשארת בדיוק במקומה.
  it('משתמש חסום ללא כשל-טעינה ⇒ עדיין "אין לך הרשאה"', () => {
    renderWith({
      loading: false,
      user: { roleName: 'לוגיסטיקה' },
      permissions: { לקוחות: 'blocked' },
      permissionsError: false,
      reload: vi.fn(),
    })
    expect(screen.getByText(/אין לך הרשאה/)).toBeInTheDocument()
  })
})
