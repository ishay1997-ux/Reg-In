// 🆕 24/09/2026 (ליטושי-הכנס, חבילה 0ב — "חזרה למקור"). ישי: *"שלוחצים על דיילת ואז סוגרים אתה לא
// חוזר למסך בדוחות"*. הבדיקה נכתבה לפני הקוד.
import { describe, it, expect } from 'vitest'
import { RETURN_TO_PARAM, returnToLabel, safeReturnTo, withReturnTo } from './returnTo'

describe('safeReturnTo — נתיב פנימי בלבד', () => {
  it('דוח עם מסננים — עובר כמות שהוא', () => {
    expect(safeReturnTo('/reports?tab=hostesses&report=reliability&period=12m')).toBe(
      '/reports?tab=hostesses&report=reliability&period=12m',
    )
  })

  it('מסך הבית — עובר', () => {
    expect(safeReturnTo('/')).toBe('/')
  })

  it.each([
    ['כתובת חיצונית', 'https://evil.example/reports'],
    ['פרוטוקול-יחסי', '//evil.example/reports'],
    ['לוכסן-הפוך', '/\\evil.example'],
    ['javascript:', 'javascript:alert(1)'],
    ['מסך פנימי אחר', '/customers/5'],
    ['דומה-לדוחות', '/reportsX'],
    ['ריק', ''],
    ['לא מחרוזת', null],
  ])('%s ⇒ null', (_name, value) => {
    expect(safeReturnTo(value)).toBeNull()
  })
})

describe('withReturnTo', () => {
  it('מוסיף את הפרמטר, מקודד, ושומר פרמטרים קיימים', () => {
    const href = withReturnTo('/hostesses?hostess=438', '/reports?tab=hostesses&report=reliability')
    const url = new URL(href, 'http://x')
    expect(url.pathname).toBe('/hostesses')
    expect(url.searchParams.get('hostess')).toBe('438')
    expect(url.searchParams.get(RETURN_TO_PARAM)).toBe('/reports?tab=hostesses&report=reliability')
  })

  it('יעד-חזרה לא-בטוח ⇒ הקישור בלי הפרמטר', () => {
    expect(withReturnTo('/projects/5', 'https://evil.example')).toBe('/projects/5')
  })
})

describe('returnToLabel', () => {
  it('דוח ⇒ "חזרה לדוח" · מסך הבית ⇒ "חזרה למסך הבית"', () => {
    expect(returnToLabel('/reports?tab=exec')).toBe('חזרה לדוח')
    expect(returnToLabel('/')).toBe('חזרה למסך הבית')
  })
})
