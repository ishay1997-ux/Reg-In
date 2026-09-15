// בדיקת LoadingOrError — נועלת את חוזה-הרשות של `retryLabel` (צעד 3.0 ε של מודול 6).
// ✏️ 08/09/2026 (שלב 2, מדריך-הסגנון §1): ברירת-המחדל עצמה הפכה ל-"נסי שוב" — כל חמש
// המשתמשות נשים (S-28), וזו הכרעת-ישי שאישרה את המדריך. מודול 6 שהעביר `retryLabel="נסי שוב"`
// במפורש מקבל כעת בדיוק את מה שהיה מקבל בלי ה-prop — הבדיקה כאן מוכיחה זאת (המקרה השני).
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoadingOrError from './LoadingOrError'

describe('LoadingOrError — retryLabel', () => {
  it('🔴 בלי prop — הכפתור הוא "נסי שוב" בייט-בייט (ברירת-המחדל החדשה, לשון-נקבה)', () => {
    render(<LoadingOrError error="שגיאה" onRetry={() => {}} retryTestId="r" />)
    expect(screen.getByTestId('r').textContent).toBe('נסי שוב')
  })

  it('retryLabel מפורש נותן את אותה תוצאה כמו ברירת-המחדל — ועדיין מפעיל את onRetry', () => {
    const onRetry = vi.fn()
    render(<LoadingOrError error="שגיאה" onRetry={onRetry} retryTestId="r" retryLabel="נסי שוב" />)
    const button = screen.getByTestId('r')
    expect(button.textContent).toBe('נסי שוב')
    fireEvent.click(button)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('retryLabel שונה עדיין גובר על ברירת-המחדל', () => {
    render(
      <LoadingOrError error="שגיאה" onRetry={() => {}} retryTestId="r" retryLabel="נסי מחדש" />,
    )
    expect(screen.getByTestId('r').textContent).toBe('נסי מחדש')
  })
})
