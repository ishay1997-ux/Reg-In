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

// 🔴 **הדבר האחד שהחבילה הזו נועלת: שלושת פרמטרי-הרשות הם `opt-in`, ולא זזה שום
// ברירת-מחדל.** הרכיב משרת שני קהלים — מנהלת שמתרשמת מדיילת, ולקוח חיצוני שמדרג את
// האירוע שלו בדף הציבורי — והדרך היחידה שזה נשבר בשקט היא ש"תיקון" לקהל אחד ידלוף
// לשני. ⚠️ ולכן כל בדיקה כאן נבדקת **בשני הכיוונים**: מה הפרמטר עושה כשמעבירים אותו,
// ומה הוא **לא** עושה כשלא. בלי חצי השני, החלפת ברירת-מחדל הייתה עוברת בירוק.
describe('RatingStars — פרמטרי-הרשות של הקהל הציבורי (01/09/2026)', () => {
  it('🔴 ברירת-המחדל של starLabel לא זזה — הקוראים הפנימיים ממשיכים לקבל "N מתוך 5"', () => {
    render(<RatingStars value={null} onChange={() => {}} testId="r" />)
    for (const star of [1, 2, 3, 4, 5]) {
      expect(screen.getByRole('button', { name: `${star} מתוך 5` })).toBeInTheDocument()
    }
  })

  it('starLabel נועל את נוסח המוקאפ המאושר — "כוכב 1"…"כוכב 5" (screens-approved §S4/①)', () => {
    render(
      <RatingStars value={null} onChange={() => {}} starLabel={(s) => `כוכב ${s}`} testId="r" />,
    )
    for (const star of [1, 2, 3, 4, 5]) {
      expect(screen.getByRole('button', { name: `כוכב ${star}` })).toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: '1 מתוך 5' })).not.toBeInTheDocument()
  })

  it('🔴 hideCaption מסיר את כיתוב-המנהלת — גם "טרם התרשמת" וגם "N מתוך 5"', () => {
    const { rerender } = render(
      <RatingStars value={null} onChange={() => {}} hideCaption testId="r" />,
    )
    expect(screen.queryByText('טרם התרשמת')).not.toBeInTheDocument()
    // גם אחרי בחירה — הכיתוב הנוסף הוא שני הנוסחים, לא רק הריק.
    rerender(<RatingStars value={4} onChange={() => {}} hideCaption testId="r" />)
    expect(screen.queryByText('4 מתוך 5')).not.toBeInTheDocument()
    // והכוכבים עצמם נשארו — "להסתיר כיתוב" אינו "להסתיר את הווידג'ט".
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  it('🔴 בלי hideCaption הכיתוב נשאר — ברירת-המחדל היא להציג', () => {
    render(<RatingStars value={4} onChange={() => {}} testId="r" />)
    expect(screen.getByText('4 מתוך 5')).toBeInTheDocument()
  })

  it('🔴 tone="primary" צובע את הכוכב המלא בטורקיז-המותג, והריק נשאר אפור', () => {
    // ‏§S4/⑧4: "הדירוג *הוא* הפעולה הראשית כאן" ⇒ מילוי-מלא, לפי כלל-המילוי.
    render(<RatingStars value={3} onChange={() => {}} tone="primary" testId="r" />)
    const stars = screen.getAllByRole('button')
    expect(stars.slice(0, 3).every((b) => b.className.includes('text-teal-600'))).toBe(true)
    expect(stars.slice(3).every((b) => b.className.includes('text-slate-300'))).toBe(true)
  })

  it('🔴 ברירת-המחדל של tone נשארה אפורה — אף מסך פנימי לא נצבע טורקיז', () => {
    const { rerender } = render(<RatingStars value={3} onChange={() => {}} testId="r" />)
    const stars = screen.getAllByRole('button')
    expect(stars.slice(0, 3).every((b) => b.className.includes('text-slate-700'))).toBe(true)
    expect(stars.some((b) => b.className.includes('teal'))).toBe(false)

    // ושתי צורות-התצוגה (לא-עריכה) גם הן לא זזו.
    rerender(<RatingStars value={5} variant="compact" testId="r" />)
    expect(screen.getByTestId('r').className).toContain('text-slate-700')
    rerender(<RatingStars value={4} testId="r" />)
    const glyphs = [...screen.getByTestId('r').querySelectorAll('span')]
    expect(glyphs.filter((g) => g.className.includes('text-slate-700'))).toHaveLength(4)
  })

  it('🔴 הכוכבים נשארים נגישים למקלדת — כפתור אמיתי, וטבעת-המיקוד לא בוטלה', () => {
    // בלי זה, "שיפור-עיצובי" שמוסיף `outline-none` היה משאיר את הווידג'ט בלתי-שמיש
    // למי שמנווט ב-Tab, בלי שום סימן על המסך ובלי שאף בדיקה אחרת תאדים.
    render(<RatingStars value={null} onChange={() => {}} tone="primary" hideCaption testId="r" />)
    for (const button of screen.getAllByRole('button')) {
      expect(button.tabIndex).toBe(0)
      expect(button).not.toBeDisabled()
      expect(button.className).not.toContain('outline-none')
    }
  })
})
