// בדיקת PermissionAwareEmpty — נועלת את ההבחנה ששני מצבים אינם מסוגלים לבטא (S-26):
// קריאה חסומה מחזירה `{data:null, error:null}` — זהה-בייט לאפס שורות — ולכן "ריק כדין",
// "אין הרשאה" ו"כשל-טעינה" חייבים שלושה מצבים מפורשים, לא שניים.
// והשקר המסוכן מכולם: מונה חסום שמציג `0` — הבדיקה כאן נועלת שהוא מציג `—`.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PermissionAwareEmpty, { DENIED_MARK, deniedValue } from './PermissionAwareEmpty'

describe('PermissionAwareEmpty', () => {
  it('empty: נוסח-המשטח על שתי שורותיו + פעולת-המשטח מוצגים', () => {
    render(
      <PermissionAwareEmpty
        state="empty"
        title="עדיין אין פרויקטים במערכת."
        detail="פרויקט נוצר מעצמו ברגע שהצעת מחיר מאושרת — אין כאן יצירה ידנית."
        action={<a href="/quotes">למסך הצעות מחיר ←</a>}
        testId="pe"
      />,
    )
    expect(screen.getByText('עדיין אין פרויקטים במערכת.')).toBeInTheDocument()
    expect(
      screen.getByText('פרויקט נוצר מעצמו ברגע שהצעת מחיר מאושרת — אין כאן יצירה ידנית.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'למסך הצעות מחיר ←' })).toBeInTheDocument()
  })

  it('noPermission: המשפט המלא שהמשטח העביר מוצג, עם סמן-המנעול', () => {
    // המשטח משלים את הבסיס הנעול "אין לך הרשאה לצפות ב…" למשפט שלם — הרכיב רק מציג.
    render(
      <PermissionAwareEmpty
        state="noPermission"
        title="אין לך הרשאה לצפות בפריטי ההצעה, ולכן לא ניתן לקבוע אם הרשימה ריקה כדין."
        testId="pe"
      />,
    )
    expect(
      screen.getByText('אין לך הרשאה לצפות בפריטי ההצעה, ולכן לא ניתן לקבוע אם הרשימה ריקה כדין.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('pe').textContent).toContain('🔒')
  })

  it('error: הכותרת הנעולה + שורת-המשטח + "נסי שוב" שמפעיל את ה-callback', () => {
    const onRetry = vi.fn()
    render(
      <PermissionAwareEmpty
        state="error"
        detail="להצעה שאושרה יש פריטי מוצר, ולכן רשימה ריקה כאן היא תקלה ולא מצב תקין."
        onRetry={onRetry}
        testId="pe"
      />,
    )
    // 🔒 המחרוזת הנעולה (§3.7): הכותרת אחת לכל המשטחים; השורה השנייה היא של המשטח.
    expect(screen.getByText('לא ניתן לטעון את הנתונים.')).toBeInTheDocument()
    expect(
      screen.getByText('להצעה שאושרה יש פריטי מוצר, ולכן רשימה ריקה כאן היא תקלה ולא מצב תקין.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'נסי שוב' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('🔴 מונה חסום מציג — ולעולם לא 0', () => {
    // ‏S-26: "אפס שורות ⇒ הושלם" על טבלה שאסור לקרוא הוא השקר המסוכן של המודול.
    expect(deniedValue(false, 0)).toBe(DENIED_MARK)
    expect(DENIED_MARK).toBe('—')
    expect(String(deniedValue(false, 0))).not.toContain('0')
    // והכיוון השני: מי שמותר לו רואה את הערך האמיתי, כולל אפס אמיתי.
    expect(deniedValue(true, 0)).toBe(0)
    expect(deniedValue(true, '2/6')).toBe('2/6')
  })
})
