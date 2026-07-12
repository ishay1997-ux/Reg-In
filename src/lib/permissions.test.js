import { describe, it, expect } from 'vitest'
import { isAllowed } from './permissions'

const ceo = { roleName: 'מנכ"ל' }
const staff = { roleName: 'לוגיסטיקה' }

describe('isAllowed', () => {
  it('חוסם כשאין משתמש', () => {
    expect(isAllowed(null, { לקוחות: 'edit' }, 'לקוחות')).toBe(false)
  })

  it('מאשר הרשאת מודול edit או view', () => {
    expect(isAllowed(staff, { לקוחות: 'edit' }, 'לקוחות')).toBe(true)
    expect(isAllowed(staff, { לקוחות: 'view' }, 'לקוחות')).toBe(true)
  })

  it("חוסם 'blocked' ומודול לא-מוכר (חסימה כברירת מחדל)", () => {
    expect(isAllowed(staff, { לקוחות: 'blocked' }, 'לקוחות')).toBe(false)
    expect(isAllowed(staff, {}, 'לקוחות')).toBe(false)
  })

  it('מאשר לפי שם-תפקיד (fallback), גם בלי הרשאת מודול', () => {
    expect(isAllowed(ceo, {}, 'מנכ"ל')).toBe(true)
  })

  it('מקבל מערך allow - מאשר אם איזשהו איבר עובר (OR)', () => {
    expect(isAllowed(staff, { לוגיסטיקה: 'view' }, ['מנכ"ל', 'לוגיסטיקה'])).toBe(true)
    expect(isAllowed(staff, { לקוחות: 'blocked' }, ['מנכ"ל', 'לקוחות'])).toBe(false)
  })

  it('לא קורס כשמפת ההרשאות היא null/undefined', () => {
    expect(isAllowed(staff, null, 'לקוחות')).toBe(false)
    expect(isAllowed(staff, undefined, 'לקוחות')).toBe(false)
  })
})
