import { describe, it, expect } from 'vitest'
import { formatDate, formatTimeRange, formatTimestamp } from './dates'

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

  // 🐞 **הפגם שנתפס בצילום-מסך של מסך 2 (09/08/2026):** חותמת-זמן מלאה שנמסרה **בלי**
  // חיתוך הפיקה `09T20:33:42.432+00:00/08/2026` על המסך. הבדיקה שמעל דווקא **ידעה** על
  // המלכודת — היא חתכה בעצמה לפני הקריאה — כלומר היא הגנה על הקורא הנכון ולא על
  // הפונקציה. ⇒ עכשיו הפונקציה **דוחה** קלט שאינו תאריך-בלבד במקום לפלוט זבל.
  it('🔴 חותמת-זמן מלאה **אינה** מתקבלת בשקט — יום שאינו שתי ספרות נדחה', () => {
    expect(formatDate('2026-08-09T20:33:42.432+00:00', '—')).toBe('—')
  })
})

describe('formatTimestamp — חותמת-זמן לתצוגה, בשעון ישראל', () => {
  it('🔴 חותמת UTC מוצגת בשעון ישראל, ולא בשעון המסד', () => {
    // 20:33 UTC = 23:33 בישראל (קיץ, UTC+3) — **באותו יום**.
    expect(formatTimestamp('2026-08-09T20:33:42.432+00:00')).toBe('09/08 23:33')
  })

  it('🔴 והמלכודת האמיתית: חצות. 22:10 UTC הוא כבר **המחר** בישראל', () => {
    expect(formatTimestamp('2026-08-09T22:10:00.000Z')).toBe('10/08 01:10')
  })

  it('ריק ⇒ הטקסט שהקורא ביקש', () => {
    expect(formatTimestamp(null, '—')).toBe('—')
    expect(formatTimestamp('לא-תאריך', '—')).toBe('—')
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
