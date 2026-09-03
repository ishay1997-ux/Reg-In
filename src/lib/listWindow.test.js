import { describe, expect, it } from 'vitest'
import {
  DEFAULT_WINDOW,
  filterByWindow,
  inWindow,
  paginate,
  parsePageParam,
  parseWindowParam,
  windowStart,
} from './listWindow'

const TODAY = '2026-09-04'

describe('windowStart', () => {
  it('החודש = הראשון בחודש · השנה = 1 בינואר · 3 חודשים = 90 יום אחורה · הכול = null', () => {
    expect(windowStart('month', TODAY)).toBe('2026-09-01')
    expect(windowStart('year', TODAY)).toBe('2026-01-01')
    expect(windowStart('90d', TODAY)).toBe('2026-06-06')
    expect(windowStart('all', TODAY)).toBeNull()
  })

  it('🔴 today ריק/לא-תקין (הפריים הראשון של מסך) ⇒ אין חלון, לא קריסה', () => {
    expect(windowStart('90d', '')).toBeNull()
    expect(windowStart('month', undefined)).toBeNull()
    expect(windowStart('year', 'not-a-date')).toBeNull()
    expect(inWindow('2020-01-01', '90d', '')).toBe(true)
  })

  it('חוצה שנה ואינו תלוי באזור-זמן (חישוב על מחרוזות, לא על Date מקומי)', () => {
    expect(windowStart('90d', '2026-02-10')).toBe('2025-11-12')
    expect(windowStart('month', '2026-01-31')).toBe('2026-01-01')
  })
})

describe('inWindow / filterByWindow', () => {
  it('🔴 שורה עתידית לעולם אינה מוסתרת — החלון תוחם את העבר בלבד', () => {
    expect(inWindow('2027-03-01', 'month', TODAY)).toBe(true)
    expect(inWindow('2026-05-01', '90d', TODAY)).toBe(false)
    expect(inWindow('2026-06-06', '90d', TODAY)).toBe(true)
  })

  it('תאריך חסר נשאר בפנים (ממצא להראות, לא להסתיר), ו"הכול" מחזיר את אותו מערך', () => {
    expect(inWindow(null, '90d', TODAY)).toBe(true)
    const rows = [{ d: '2024-01-01' }, { d: null }, { d: '2026-09-01' }]
    expect(filterByWindow(rows, (r) => r.d, 'all', TODAY)).toBe(rows)
    expect(filterByWindow(rows, (r) => r.d, 'year', TODAY).map((r) => r.d)).toEqual([
      null,
      '2026-09-01',
    ])
  })

  it('מקבל גם חותמת-זמן מלאה (created_at) ומשווה לפי היום בלבד', () => {
    expect(inWindow('2026-06-06T23:59:00+03:00', '90d', TODAY)).toBe(true)
    expect(inWindow('2026-06-05T00:00:00Z', '90d', TODAY)).toBe(false)
  })
})

describe('paginate', () => {
  const rows = Array.from({ length: 123 }, (_, i) => i + 1)

  it('חותך 50 לעמוד ומונה 1-based: 51–100 מתוך 123', () => {
    const p = paginate(rows, 2)
    expect(p.pageRows[0]).toBe(51)
    expect(p.pageRows.at(-1)).toBe(100)
    expect(p).toMatchObject({ page: 2, pageCount: 3, total: 123, from: 51, to: 100 })
  })

  it('עמוד מעבר לסוף נגזר לעמוד האחרון (רשימה שהתקצרה אחרי סינון), ואפס ⇒ 1', () => {
    expect(paginate(rows, 9).page).toBe(3)
    expect(paginate(rows, 0).page).toBe(1)
    expect(paginate(rows, 3).to).toBe(123)
  })

  it('רשימה ריקה: עמוד 1 מתוך 1, טווח 0–0', () => {
    expect(paginate([], 1)).toMatchObject({ page: 1, pageCount: 1, total: 0, from: 0, to: 0 })
  })
})

describe('פרמטרי-כתובת', () => {
  it('ערך לא-מוכר ⇒ ברירת-המחדל, לא שגיאה ולא מסך ריק', () => {
    expect(parseWindowParam('bogus')).toBe(DEFAULT_WINDOW)
    expect(parseWindowParam(null)).toBe(DEFAULT_WINDOW)
    expect(parseWindowParam('all')).toBe('all')
    expect(parsePageParam('3')).toBe(3)
    expect(parsePageParam('-2')).toBe(1)
    expect(parsePageParam('x')).toBe(1)
    expect(parsePageParam(undefined)).toBe(1)
  })
})
