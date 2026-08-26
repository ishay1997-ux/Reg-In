// בדיקות הפקד המקוטע המקומי (AS-9, צעד 3.2). מה שנעול כאן הוא **מה שאינו נראה בעין**:
// ‏`role="group"` + `aria-pressed` פר-כפתור · הפעלה במקלדת עם טבעת-מיקוד נראית (זה מה
// ששער-ה-🎨 בודק) · ו-㉚ — פקד חסום **נשאר, מושבת ומנומק**, לעולם לא נעלם.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SegmentedControl from './SegmentedControl'
import { LOGISTICS_STATUS_LABELS } from '@/lib/projectLogistics'

const OPTIONS = ['not_started', 'ordered', 'ready'].map((value) => ({
  value,
  label: LOGISTICS_STATUS_LABELS[value],
}))

function renderControl(props = {}) {
  const onSelect = vi.fn()
  render(
    <SegmentedControl
      options={OPTIONS}
      value="ordered"
      onSelect={onSelect}
      ariaLabel="עדכון מצב — תג שם רגיל - ממותג"
      testIdPrefix="seg"
      {...props}
    />,
  )
  return { onSelect }
}

describe('SegmentedControl', () => {
  it('שלושת המצבים מוצגים, והנוכחי הוא היחיד עם aria-pressed=true', () => {
    renderControl()
    const group = screen.getByRole('group', { name: 'עדכון מצב — תג שם רגיל - ממותג' })
    expect(group).toBeInTheDocument()
    expect(screen.getByTestId('seg-not_started')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('seg-ordered')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('seg-ready')).toHaveAttribute('aria-pressed', 'false')
    // התוויות מגיעות מהמילון המוזג, לא מליטרל מקומי.
    expect(screen.getByTestId('seg-ordered')).toHaveTextContent('הוזמן')
  })

  it('לחיצה מחזירה את הערך שנבחר', () => {
    const { onSelect } = renderControl()
    fireEvent.click(screen.getByTestId('seg-ready'))
    expect(onSelect).toHaveBeenCalledWith('ready')
  })

  it('כל כפתור הוא <button type="button"> ממוקד — כלומר ניתן להפעלה במקלדת, עם טבעת-מיקוד נראית', () => {
    renderControl()
    const button = screen.getByTestId('seg-ready')
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveAttribute('type', 'button')
    button.focus()
    expect(document.activeElement).toBe(button)
    // הטבעת אינה קוסמטית: בלעדיה המשתמשת במקלדת אינה יודעת על מה היא עומדת.
    expect(button.className).toContain('focus-visible:ring-2')
  })

  it('㉚ — חסום ⇒ מושבת, גלוי ומנומק, ולעולם לא מוסר מהמסך', () => {
    const { onSelect } = renderControl({
      disabled: true,
      disabledTitle: 'הפרויקט בוטל — לא ניתן לעדכן',
    })
    const button = screen.getByTestId('seg-ready')
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('title', 'הפרויקט בוטל — לא ניתן לעדכן')
    fireEvent.click(button)
    expect(onSelect).not.toHaveBeenCalled()
  })
})
