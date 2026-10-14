// ביקורת-ולידציה שורה 26 (14/10/2026): ההסבר מוצג רק בטווח הפוך.
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DateRangeNotice from './DateRangeNotice'

describe('DateRangeNotice', () => {
  it('טווח הפוך ⇒ שורת הסבר; טווח תקין ⇒ כלום', () => {
    const { rerender } = render(<DateRangeNotice from="2026-10-20" to="2026-10-01" />)
    expect(screen.getByTestId('date-range-notice')).toHaveTextContent(
      'תאריך ההתחלה מאוחר מתאריך הסיום — אין תוצאות בטווח הזה.',
    )
    rerender(<DateRangeNotice from="2026-10-01" to="2026-10-20" />)
    expect(screen.queryByTestId('date-range-notice')).not.toBeInTheDocument()
  })
})
