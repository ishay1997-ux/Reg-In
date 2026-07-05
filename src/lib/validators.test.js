import { describe, it, expect } from 'vitest'
import { EMAIL_REGEX, ISRAELI_MOBILE_REGEX, MIN_PASSWORD_LENGTH } from './validators'

describe('EMAIL_REGEX', () => {
  it('מקבל כתובות אימייל תקינות', () => {
    expect(EMAIL_REGEX.test('user@example.com')).toBe(true)
    expect(EMAIL_REGEX.test('a.b-c@sub.domain.co.il')).toBe(true)
  })

  it('פוסל כתובות ללא @ / ללא דומיין / עם רווח', () => {
    expect(EMAIL_REGEX.test('userexample.com')).toBe(false)
    expect(EMAIL_REGEX.test('user@nodot')).toBe(false)
    expect(EMAIL_REGEX.test('user @example.com')).toBe(false)
    expect(EMAIL_REGEX.test('')).toBe(false)
  })
})

describe('ISRAELI_MOBILE_REGEX', () => {
  it('מקבל נייד ישראלי תקין (עם מקף ובלי)', () => {
    expect(ISRAELI_MOBILE_REGEX.test('0501234567')).toBe(true)
    expect(ISRAELI_MOBILE_REGEX.test('050-1234567')).toBe(true)
    expect(ISRAELI_MOBILE_REGEX.test('0591234567')).toBe(true)
  })

  it('פוסל מספר עם 7 ספרות בלבד (הדוגמה מהמאמר)', () => {
    expect(ISRAELI_MOBILE_REGEX.test('1234567')).toBe(false)
  })

  it('פוסל קידומת לא-ניידת ומספר קצר מדי', () => {
    expect(ISRAELI_MOBILE_REGEX.test('0491234567')).toBe(false) // 04 = קווי, לא נייד
    expect(ISRAELI_MOBILE_REGEX.test('050123')).toBe(false) // קצר מדי
  })
})

describe('MIN_PASSWORD_LENGTH', () => {
  it('הוא 6', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(6)
  })
})
