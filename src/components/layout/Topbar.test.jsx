// בדיקת Topbar (מודול 9, צעד 3.4 — פריט "ההגדרות שלי" בתפריט-המשתמש) — V-7: הפריט מופיע
// **אך ורק** כשאין `edit` על 'הגדרות מערכת' (אותו תנאי בדיוק כמו `canEdit` בכל שאר מסכי
// מודול 9 — לא רשימת-תפקידים נפרדת שיכולה להתפצל ממנו). `useAuth`/`useNavigate` מוקקים
// (התבנית מ-`ProtectedRoute.test.jsx`), כדי לשלוט במפת-ההרשאות בלי DB אמיתי.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Topbar from './Topbar'

vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }))
import { useAuth } from '@/contexts/AuthContext'

const navigateMock = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => navigateMock }
})

function renderTopbar(authState) {
  useAuth.mockReturnValue({ signOut: vi.fn(), ...authState })
  return render(<Topbar collapsed={false} />)
}

async function openUserMenu() {
  const trigger = screen.getByTestId('topbar-user-menu-trigger')
  // Radix פותח את הטריגר על `pointerdown`, לא על `click` בלבד — ו-jsdom לא יורה
  // `PointerEvent` אמיתי מ-`fireEvent.click` לבדו (אין `userEvent` בתלויות הפרויקט).
  fireEvent.pointerDown(trigger, { button: 0, pointerId: 1 })
  fireEvent.click(trigger)
  // Radix מרנדר את תוכן-התפריט ב-portal אחרי פתיחה — ממתינים לפריט-עוגן ("הפרופיל שלי")
  // שקיים בכל מצב-הרשאות, כדי לא לתלות את ההמתנה בפריט שאולי בכוונה נעדר.
  return screen.findByText('הגדרות פרופיל')
}

describe('Topbar — פריט "ההגדרות שלי" (V-7)', () => {
  it('מפת-הרשאות `blocked` על "הגדרות מערכת" ⇒ הפריט מופיע ומוביל ל-/my-settings', async () => {
    renderTopbar({
      user: { fullName: 'שרון בכר', roleName: 'מנהלת לוגיסטיקה', email: 'sharon@example.co.il' },
      permissions: { 'הגדרות מערכת': 'blocked' },
    })
    await openUserMenu()

    const item = screen.getByTestId('settings-my-settings-link')
    expect(item).toHaveTextContent('ההגדרות שלי')
    fireEvent.click(item)
    expect(navigateMock).toHaveBeenCalledWith('/my-settings')
  })

  it('מפת-הרשאות `edit` על "הגדרות מערכת" ⇒ הפריט נעדר (יש לה את הלשונית המלאה)', async () => {
    renderTopbar({
      user: { fullName: 'דנה כהן', roleName: 'מנכ"ל', email: 'dana@example.co.il' },
      permissions: { 'הגדרות מערכת': 'edit' },
    })
    await openUserMenu()

    expect(screen.queryByTestId('settings-my-settings-link')).not.toBeInTheDocument()
  })

  it('מפת-הרשאות `view` על "הגדרות מערכת" ⇒ הפריט מופיע (אין לה עריכה מלאה)', async () => {
    renderTopbar({
      user: { fullName: 'רות לוי', roleName: 'צופה', email: 'ruth@example.co.il' },
      permissions: { 'הגדרות מערכת': 'view' },
    })
    await openUserMenu()

    expect(screen.getByTestId('settings-my-settings-link')).toBeInTheDocument()
  })
})
