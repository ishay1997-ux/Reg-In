// ביקורת-ולידציה שורות 19/20/28 (14/10/2026): מונה-תווים שמופיע מ-80% מהתקרה.
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CharCounter from './CharCounter'
import { QUOTE_TEXT_MAX } from '@/lib/quotes'

describe('CharCounter', () => {
  it('מתחת ל-80% ⇒ כלום; מ-80% ⇒ n/N; בתקרה ⇒ מודגש', () => {
    const { rerender } = render(<CharCounter value={'א'.repeat(95)} max={120} testId="c" />)
    expect(screen.queryByTestId('c')).not.toBeInTheDocument()
    rerender(<CharCounter value={'א'.repeat(96)} max={120} testId="c" />)
    expect(screen.getByTestId('c')).toHaveTextContent('96/120')
    rerender(<CharCounter value={'א'.repeat(120)} max={120} testId="c" />)
    expect(screen.getByTestId('c')).toHaveClass('font-semibold')
  })

  it('תקרות בונה-ההצעה: 120 · 120 · 1000', () => {
    expect(QUOTE_TEXT_MAX).toEqual({ eventName: 120, location: 120, notes: 1000 })
  })
})
