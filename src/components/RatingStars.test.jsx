// בדיקת RatingStars — הדבר האחד שהיא נועלת: **`null` הוא "טרם התרשמתי" ולא 3 כוכבים.**
// זו בדיוק ההכרעה שהמיגרציה עשתה חצי ממנה (הסרת `default 3`); המסך הוא החצי השני,
// ובלי הבדיקה הזאת "3" יכול לחזור בשקט דרך ברירת-מחדל ב-props או דרך `Number(null)===0`.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RatingStars from './RatingStars'

describe('RatingStars', () => {
  it('🔴 null מציג — ולא כוכבים, בשתי הצורות', () => {
    const { rerender } = render(<RatingStars value={null} testId="r" />)
    expect(screen.getByTestId('r').textContent).toBe('—')
    rerender(<RatingStars value={null} variant="compact" testId="r" />)
    expect(screen.getByTestId('r').textContent).toBe('—')
  })

  it('🔴 undefined מתנהג כמו null — לא נופל ל-0 ולא ל-3', () => {
    render(<RatingStars testId="r" />)
    expect(screen.getByTestId('r').textContent).toBe('—')
  })

  it('שורת-טבלה מציגה "5 ★" דחוס (מוקאפ 03)', () => {
    render(<RatingStars value={5} variant="compact" testId="r" />)
    expect(screen.getByTestId('r').textContent).toBe('5 ★')
  })

  it('🔴 הצורה הדחוסה מבודדת-כיווניות — אחרת הכוכב קופץ לשמאל הספרה בתא RTL', () => {
    // נתפס בעין על המסך הבנוי: הוצג `★ 5`. אותה משפחה כמו `Money`, ולכן אותה עטיפה.
    render(<RatingStars value={5} variant="compact" testId="r" />)
    const el = screen.getByTestId('r')
    expect(el).toHaveAttribute('dir', 'ltr')
    expect(el.className).toContain('[unicode-bidi:isolate]')
  })

  it('כרטיס-הצפייה מציג חמישה גליפים — מלאים וריקים (מוקאפ 08)', () => {
    render(<RatingStars value={4} testId="r" />)
    const glyphs = screen.getByTestId('r').querySelectorAll('span')
    expect(glyphs).toHaveLength(5)
    expect([...glyphs].filter((g) => g.className.includes('text-slate-700'))).toHaveLength(4)
  })

  it('🔴 בטופס: לחיצה על כוכב 4 מדווחת 4', () => {
    const onChange = vi.fn()
    render(<RatingStars value={null} onChange={onChange} testId="r" />)
    fireEvent.click(screen.getByRole('button', { name: '4 מתוך 5' }))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('🔴 לחיצה חוזרת על הכוכב שנבחר מנקה חזרה ל-null — אחרת אין דרך לבטל התרשמות', () => {
    const onChange = vi.fn()
    render(<RatingStars value={3} onChange={onChange} testId="r" />)
    fireEvent.click(screen.getByRole('button', { name: '3 מתוך 5' }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('🔴 טופס-הוספה נפתח על "טרם התרשמת" — לא על "3 מתוך 5"', () => {
    render(<RatingStars value={null} onChange={() => {}} testId="r" />)
    expect(screen.getByText('טרם התרשמת')).toBeInTheDocument()
    expect(screen.queryByText(/מתוך 5$/)).not.toBeInTheDocument()
  })

  it('בלי onChange אין כפתורים כלל — תצוגה אינה עריכה בשוגג', () => {
    render(<RatingStars value={4} testId="r" />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
