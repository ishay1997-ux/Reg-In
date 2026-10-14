// טבלת-השורות בבונה-ההצעה ⇐ הכרעת-ישי 14/10/2026: מחיר-המדרגה לפי **סך** היחידות של אותו מוצר
// בכל שורות ההצעה. כאן נבדק החיווט (שינוי כמות / מחיקה מתמחרים-מחדש את שורות-האחיות, והכיתוב
// המשני מוצג); הכלל עצמו נבדק ב-`src/lib/pricing.test.js`.
import { useState } from 'react'
import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import QuoteLineEditor from './QuoteLineEditor'

const TAG = {
  sku: 'B-REG-TAG',
  item_name: 'תג שם',
  category: 'product',
  status: 'active',
  base_price: 6,
}
const TIERS = [
  { sku: 'B-REG-TAG', min_qty: 1, max_qty: 50, special_price: 6 },
  { sku: 'B-REG-TAG', min_qty: 51, max_qty: 200, special_price: 5.5 },
]

function Harness({ initial }) {
  const [lines, setLines] = useState(initial)
  return (
    <>
      <QuoteLineEditor lines={lines} products={[TAG]} tiers={TIERS} onChange={setLines} />
      <output data-testid="prices">{lines.map((l) => l.unitPrice).join(',')}</output>
    </>
  )
}

const red = { key: 'a', sku: 'B-REG-TAG', qty: 50, unitPrice: 6, color: 'לבן', notes: '' }
const blue = { key: 'b', sku: 'B-REG-TAG', qty: 1, unitPrice: 6, color: 'כחול', notes: '' }

describe('בונה-ההצעה — מדרגה לפי הכמות הכוללת של המוצר', () => {
  it('50 + 50 ⇒ שתי השורות במדרגת ה-100, עם הכיתוב המשני; מחיקה ⇒ חזרה למחיר הבסיס', () => {
    render(<Harness initial={[red, blue]} />)
    fireEvent.change(screen.getByTestId('quote-line-qty-b'), { target: { value: '50' } })
    expect(screen.getByTestId('prices')).toHaveTextContent('5.5,5.5')
    expect(screen.getByTestId('quote-line-combined-tier-a')).toHaveTextContent(
      'מחיר מדרגה לפי 100 יחידות בסך הכל בהצעה',
    )
    expect(screen.getByTestId('quote-line-combined-tier-b')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('quote-line-remove-b'))
    expect(screen.getByTestId('prices')).toHaveTextContent('6')
    expect(screen.queryByTestId('quote-line-combined-tier-a')).not.toBeInTheDocument()
  })

  it('הצעה ישנה שנשמרה לפני הכלל ועוד לא נגעו בה ⇒ המחיר השמור נשאר ואין כיתוב שאינו נכון', () => {
    render(<Harness initial={[red, { ...blue, qty: 50 }]} />)
    expect(screen.getByTestId('prices')).toHaveTextContent('6,6')
    expect(screen.queryByTestId('quote-line-combined-tier-a')).not.toBeInTheDocument()
  })
})
