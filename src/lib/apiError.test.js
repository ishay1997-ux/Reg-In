import { describe, it, expect } from 'vitest'
import { toError, assertRowsAffected, RLS_DENIED_CODE } from './apiError'

describe('toError — עטיפת שגיאת-Supabase', () => {
  it('משמר את הקוד ואת השגיאה המקורית מתחת להודעה הידידותית', () => {
    const original = { code: '23505', details: 'duplicate key' }
    const err = toError(original, 'מק"ט כבר קיים.')
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('מק"ט כבר קיים.')
    expect(err.code).toBe('23505')
    expect(err.cause).toBe(original)
  })

  // ⚠️ שגיאת-רשת מגיעה בלי `code`. ה-UI חייב לקבל `undefined` ולא לקרוס — הוא משווה
  // מול קודים ידועים, וכל ערך-דמה כאן היה יכול להתנגש באחד מהם.
  it('code הוא undefined כשלשגיאה אין קוד — וגם כשאין שגיאה בכלל', () => {
    expect(toError({}, 'נכשל.').code).toBeUndefined()
    expect(toError(null, 'נכשל.').code).toBeUndefined()
    expect(toError(undefined, 'נכשל.').message).toBe('נכשל.')
  })
})

describe('assertRowsAffected — 0 שורות עם error:null אינו הצלחה', () => {
  it('מחזיר את השורות כשהכתיבה נגעה במשהו', () => {
    const rows = [{ sku: 'B-REG-TAG' }]
    expect(assertRowsAffected(rows, 'אין הרשאה.')).toBe(rows)
  })

  // הכשל השקט עצמו: RLS חוסם ⇒ PostgREST מחזיר מערך ריק **בלי שגיאה**.
  it.each([
    ['מערך ריק — הכתיבה נחסמה ע"י RLS', []],
    ['null — לא הוחזר data כלל', null],
    ['undefined', undefined],
  ])('זורק RLS_DENIED על %s', (_label, data) => {
    expect(() => assertRowsAffected(data, 'אין הרשאה לעדכן מוצר זה.')).toThrow(
      'אין הרשאה לעדכן מוצר זה.',
    )
  })

  it('נושא את הקוד הסינתטי RLS_DENIED, שהוא מה שמבדיל אותו משגיאת-מסד אמיתית', () => {
    let caught = null
    try {
      assertRowsAffected([], 'אין הרשאה.')
    } catch (err) {
      caught = err
    }
    expect(caught?.code).toBe(RLS_DENIED_CODE)
    expect(RLS_DENIED_CODE).toBe('RLS_DENIED')
  })
})
