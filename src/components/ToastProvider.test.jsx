// 🔴 הבדיקה הזאת נולדה מממצא, לא מכיסוי: הודעת-כשל נמחקה אחרי 4 שניות — כולל ההודעה
// *"הודעות-הביטול: 2 לא נשלחו · 1 — לא ידוע אם יצאו. כדאי ליידע אותה טלפונית"* — **ואין
// בשום מסך רישום שדיילת לא קיבלה הודעה שהאירוע שלה בוטל.** ⇒ שגיאה נשארת עד סגירה ידנית;
// הצלחה ומידע נדחים כרגיל, כי הם ניתנים לשחזור.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ToastProvider, useToast } from './ToastProvider'

function Trigger({ variant, message }) {
  const toast = useToast()
  return (
    <button type="button" onClick={() => toast[variant](message)}>
      ירה
    </button>
  )
}

function fire(variant, message) {
  render(
    <ToastProvider>
      <Trigger variant={variant} message={message} />
    </ToastProvider>,
  )
  act(() => {
    screen.getByRole('button', { name: 'ירה' }).click()
  })
}

// השעון מזויף כדי שהבדיקה תמדוד את **כלל-הדחייה** ולא תמתין 4 שניות אמיתיות.
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('ToastProvider — מה נשאר על המסך ומה נמחק לבד', () => {
  it('הודעת הצלחה נדחית לבד אחרי 4 שניות — היא ניתנת לשחזור', () => {
    fire('success', 'הנתונים נשמרו בהצלחה')
    expect(screen.getByText('הנתונים נשמרו בהצלחה')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(4100))
    expect(screen.queryByText('הנתונים נשמרו בהצלחה')).toBeNull()
  })

  it('🔴 הודעת כשל נשארת — גם הרבה אחרי שהצלחה כבר נעלמה', () => {
    const failure = 'נועה לוי שוחררה, אך הודעות-הביטול: 2 לא נשלחו. כדאי ליידע אותה טלפונית.'
    fire('error', failure)
    expect(screen.getByText(failure)).toBeInTheDocument()
    // פי-חמישה מחלון-הדחייה: אם היא נמחקת בכלל, היא נמחקת כאן.
    act(() => vi.advanceTimersByTime(20_000))
    expect(screen.getByText(failure)).toBeInTheDocument()
  })

  it('ולמשתמשת יש דרך לסגור אותה — היא אינה נתקעת על המסך', () => {
    const failure = 'שמירת הפרמטרים נכשלה.'
    fire('error', failure)
    act(() => vi.advanceTimersByTime(20_000))
    // 🔤 התווית בפועל היא `סגירת ההתראה` — נלקחה מהקוד, לא נוסחה כאן. (הגרסה הראשונה של
    // הבדיקה חיפשה "סגור" ולא מצאה: `סגירת` אינו מכיל `סגור`. אוצר-המילים של היעד, לא שלי.)
    const closer = screen.getByRole('button', { name: 'סגירת ההתראה' })
    expect(closer, 'להודעת-כשל שנשארת חייב להיות פקד סגירה, אחרת היא לכודה').toBeTruthy()
    act(() => closer.click())
    expect(screen.queryByText(failure)).toBeNull()
  })
})
