// בדיקת LoadingOrError — נועלת את חוזה-הרשות של `retryLabel` (צעד 3.0 ε של מודול 6):
// ברירת-המחדל "נסה שוב" אסור שתזוז — ארבעת אתרי-הקריאה הקיימים (מודולים 1–3) נשענים
// עליה בלי להעביר דבר, והחלפתה היא שינוי חוצה-מערכת שרשום כ-`🚧 מ12`, לא של מודול 6.
// מודול 6 (לשון-נקבה, S-28) מעביר "נסי שוב" כ-prop — והבדיקה מוכיחה ששני הכיוונים חיים.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoadingOrError from './LoadingOrError'

describe('LoadingOrError — retryLabel', () => {
  it('🔴 בלי prop — הכפתור נשאר "נסה שוב" בייט-בייט (אפס שינוי לקוראים הקיימים)', () => {
    render(<LoadingOrError error="שגיאה" onRetry={() => {}} retryTestId="r" />)
    expect(screen.getByTestId('r').textContent).toBe('נסה שוב')
  })

  it('retryLabel שהועבר גובר — ועדיין מפעיל את onRetry', () => {
    const onRetry = vi.fn()
    render(<LoadingOrError error="שגיאה" onRetry={onRetry} retryTestId="r" retryLabel="נסי שוב" />)
    const button = screen.getByTestId('r')
    expect(button.textContent).toBe('נסי שוב')
    expect(screen.queryByText('נסה שוב')).not.toBeInTheDocument()
    fireEvent.click(button)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
