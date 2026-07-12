import { describe, it, expect } from 'vitest'
import {
  EMAIL_REGEX,
  ISRAELI_MOBILE_REGEX,
  MIN_PASSWORD_LENGTH,
  COMPANY_ID_REGEX,
  isValidDiscountPercent,
} from './validators'

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

describe('COMPANY_ID_REGEX (ח"פ לקוח — מודול 2)', () => {
  it('מקבל בדיוק 9 ספרות', () => {
    expect(COMPANY_ID_REGEX.test('514000001')).toBe(true)
  })

  it('פוסל 8 / 10 ספרות, אותיות, וריק', () => {
    expect(COMPANY_ID_REGEX.test('51400000')).toBe(false)
    expect(COMPANY_ID_REGEX.test('5140000012')).toBe(false)
    expect(COMPANY_ID_REGEX.test('51400000a')).toBe(false)
    expect(COMPANY_ID_REGEX.test('')).toBe(false)
  })
})

describe('isValidDiscountPercent', () => {
  it('מקבל 0–100', () => {
    expect(isValidDiscountPercent(0)).toBe(true)
    expect(isValidDiscountPercent(50)).toBe(true)
    expect(isValidDiscountPercent(100)).toBe(true)
  })

  it('פוסל מתחת ל-0, מעל 100, ולא-מספר', () => {
    expect(isValidDiscountPercent(-1)).toBe(false)
    expect(isValidDiscountPercent(101)).toBe(false)
    expect(isValidDiscountPercent('abc')).toBe(false)
  })
})
