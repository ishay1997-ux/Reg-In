// בדיקת תנאי-ההצגה של הרמז `prices.openQuotes` בדיאלוג-המוצר (ליטושי-הכנס, 24/09/2026).
// ✏️ מבקרים טריים: הרמז אומר "שינוי מחיר כאן לא משנה הצעות שכבר נשמרו" — ולמוצר חדש אין עדיין
// אף הצעה. ⇒ הוא מוצג בעריכה בלבד. ה-API ממוקק כולו — אין Supabase בבדיקה.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductFormDialog from './ProductFormDialog'

vi.mock('@/supabaseClient', () => ({ supabase: {} }))
vi.mock('@/modules/01_auth/pricesApi', () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
}))

const authState = { onboardingMode: 2 }
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

const PRODUCT = {
  sku: 'B-REG-TAG',
  item_name: 'תג שם רגיל - ממותג',
  description: '',
  category: 'product',
  unit: 'יחידה',
  base_price: 4.5,
  cost: 1.2,
  image_url: '',
}

afterEach(() => {
  authState.onboardingMode = 2
})

describe('מצב 2: `prices.openQuotes`', () => {
  it('עריכת מוצר קיים — מוצג', () => {
    render(<ProductFormDialog open onOpenChange={vi.fn()} editingProduct={PRODUCT} />)
    expect(screen.getByTestId('product-form-base-price')).toBeInTheDocument()
    expect(screen.getByTestId('hint-prices.openQuotes')).toBeInTheDocument()
  })

  it('מוצר חדש — אינו מוצג (אין עדיין הצעה שהמחיר נוגע בה)', () => {
    render(<ProductFormDialog open onOpenChange={vi.fn()} editingProduct={null} />)
    expect(screen.getByTestId('product-form-base-price')).toBeInTheDocument()
    expect(screen.queryByTestId('hint-prices.openQuotes')).toBeNull()
  })
})
