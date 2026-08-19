// בדיקת Ltr — נועלת את הזוג שאסור להפריד: `dir="ltr"` + `unicode-bidi:isolate`.
// למה זה קריטי: הזוג הזה חי עד עכשיו כשני העתקים ידניים (Money · RatingStars), והסורק
// `check:bidi` נורה רק על ספרה צמודה ל-₪/★/× — כלומר `1/6`, `0/2` ו-"חסרות 5" עוברים
// ירוק בלי בידוד, והם רוב מה שמודול 6 מרנדר. רכיב שפולט את שני החלקים יחד הוא האכיפה
// היחידה ששורדת כותב ששכח — אותו עיקרון כמו Money ו-LtrFieldGroup.
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Ltr from './Ltr'
import Money from './Money'

describe('Ltr', () => {
  it('🔴 שני חלקי-הבידוד נפלטים יחד על אלמנט אחד — dir וגם unicode-bidi וגם inline-block', () => {
    render(<Ltr data-testid="l">1/6</Ltr>)
    const el = screen.getByTestId('l')
    expect(el).toHaveAttribute('dir', 'ltr')
    expect(el.className).toContain('[unicode-bidi:isolate]')
    expect(el.className).toContain('inline-block')
  })

  it('className נוסף מתמזג בלי לאבד את הבידוד', () => {
    render(
      <Ltr className="text-slate-700" data-testid="l">
        0/2
      </Ltr>,
    )
    const el = screen.getByTestId('l')
    expect(el.className).toContain('text-slate-700')
    expect(el.className).toContain('[unicode-bidi:isolate]')
    expect(el.className).toContain('inline-block')
  })

  it('🔴 עוגן-רגרסיה: Money עדיין מרנדר סכום בתוך אלמנט שנושא את שני החלקים', () => {
    // ‏Money עבר לצרוך את Ltr — הבדיקה מוכיחה שהחוזה הציבורי שלו לא זז בייט:
    // אותו אלמנט, אותם שני מאפיינים, וה-₪ בפנים.
    render(<Money amount={1234} data-testid="m" />)
    const el = screen.getByTestId('m')
    expect(el).toHaveAttribute('dir', 'ltr')
    expect(el.className).toContain('[unicode-bidi:isolate]')
    expect(el.textContent).toContain('₪')
  })
})
