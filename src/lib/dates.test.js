import { describe, it, expect } from 'vitest'
import { formatDate, formatTimeRange } from './dates'

describe('formatDate — dd/mm/yyyy, והריק אינו "Invalid Date"', () => {
  it('ISO ⇒ dd/mm/yyyy', () => {
    expect(formatDate('2026-08-22')).toBe('22/08/2026')
  })

  it('חותמת מלאה נחתכת ליום — לא נשפכת שעה לתוך התאריך', () => {
    expect(formatDate('2026-08-22T18:00:00.000Z'.slice(0, 10))).toBe('22/08/2026')
  })

  it('ריק ⇒ הטקסט שהקורא ביקש, ולא "undefined/undefined"', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate('', '—')).toBe('—')
    expect(formatDate('לא-תאריך', '—')).toBe('—')
  })
})

describe('formatTimeRange — טווח רק כששני הקצוות קיימים', () => {
  it('שני קצוות ⇒ טווח מקוצר לדקות', () => {
    expect(formatTimeRange('18:00:00', '22:00:00')).toBe('18:00–22:00')
  })

  it('🔴 קצה אחד ⇒ רק הוא, לעולם לא "18:00–" שנראה כמו תקלת-רינדור', () => {
    expect(formatTimeRange('18:00:00', null)).toBe('18:00')
    expect(formatTimeRange(null, '22:00:00')).toBe('')
  })
})
