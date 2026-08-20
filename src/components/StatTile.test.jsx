// בדיקת StatTile — נועלת את שלושת ענפי-הערך, ובראשם זה שהוא באג-חוזר בפרויקט הזה:
// **מדד בלי נתון מציג טקסט, לעולם לא 0.** "0 ₪" נקרא כעובדה ("הלקוח לא שווה כלום") ולא
// כ"אין מידע", וזו בדיוק הטעות שתוקנה כבר ב-deriveCustomerMetrics וב-deriveQuoteMetrics —
// אם היא תחזור, היא תחזור כאן, במקום היחיד שכל אריחי-המדד עוברים דרכו.
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatTile from './StatTile'

describe('StatTile', () => {
  it('ערך null מציג טקסט-ריק ולא 0', () => {
    render(<StatTile label="סה״כ הכנסות" value={null} testId="t" />)
    expect(screen.getByText('אין נתונים עדיין')).toBeInTheDocument()
    expect(screen.queryByText(/0/)).not.toBeInTheDocument()
  })

  it('ערך undefined מתנהג כמו null', () => {
    render(<StatTile label="סה״כ הכנסות" testId="t" />)
    expect(screen.getByText('אין נתונים עדיין')).toBeInTheDocument()
  })

  it('emptyText גובר על ברירת-המחדל (מסך-ההצעות מציג מקף)', () => {
    render(<StatTile label="שיעור אישור" value={null} emptyText="—" testId="t" />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('אין נתונים עדיין')).not.toBeInTheDocument()
  })

  it('אפס הוא ערך אמיתי ומוצג כמספר — לא כ"אין נתונים"', () => {
    render(<StatTile label="סה״כ הכנסות" value={0} testId="t" />)
    expect(screen.queryByText('אין נתונים עדיין')).not.toBeInTheDocument()
  })

  it('ערך מספרי עובר דרך Money (₪ מוצג)', () => {
    render(<StatTile label="סה״כ הכנסות" value={1234} testId="t" />)
    expect(screen.getByTestId('t').textContent).toContain('₪')
  })

  it('ערך שאינו מספר מוצג כמות שהוא, בלי ₪', () => {
    render(<StatTile label="שיעור אישור" value={<span>50%</span>} testId="t" />)
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByTestId('t').textContent).not.toContain('₪')
  })

  it('שורת-משנה מוצגת רק כשיש לה תוכן', () => {
    const { rerender } = render(<StatTile label="ל" value={1} sub="3 מתוך 6" testId="t" />)
    expect(screen.getByText('3 מתוך 6')).toBeInTheDocument()
    rerender(<StatTile label="ל" value={1} testId="t" />)
    expect(screen.queryByText('3 מתוך 6')).not.toBeInTheDocument()
  })

  it('🔤 העמודה מיושרת flex-start — בלעדיו ערך `ltr` נמתח ומתיישר שמאלה, הרחק מהתווית', () => {
    // צעד 3.0 β של מודול 6: יישור למוקאפ המאושר `.cell, .tile{align-items:flex-start}`.
    render(<StatTile label="ל" value={1} testId="t" />)
    expect(screen.getByTestId('t').className).toContain('items-start')
  })

  it('🎨 כלל-המילוי: לבן+מסגרת, בלי מילוי-צבע (PROJECT_MASTER §4)', () => {
    render(<StatTile label="ל" value={1} testId="t" />)
    const cls = screen.getByTestId('t').className
    expect(cls).toContain('bg-white')
    expect(cls).not.toMatch(/bg-(teal|green|amber|red)-/)
  })
})
