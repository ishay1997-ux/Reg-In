import { describe, it, expect } from 'vitest'
import {
  EMAIL_REGEX,
  ISRAELI_MOBILE_REGEX,
  MIN_PASSWORD_LENGTH,
  COMPANY_ID_REGEX,
  SKU_REGEX,
  isValidDiscountPercent,
  isValidSku,
  isValidNonNegativePrice,
  isValidPositivePrice,
  isValidPositiveInt,
  isValidVatPercent,
  isValidGuestsRatio,
  isValidIsraeliId,
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

// ---- מודול 3 (הצעות מחיר / מחירים) — נוספו 29/07/2026, צעד 2.2 ----

describe('SKU_REGEX (מק"ט — מודול 3)', () => {
  it('מקבל אותיות-גדולות/ספרות/מקף, בלי מקף מוביל', () => {
    expect(SKU_REGEX.test('B-REG-TAG')).toBe(true)
    expect(SKU_REGEX.test('04ST')).toBe(true)
    expect(SKU_REGEX.test('A')).toBe(true)
  })

  it('פוסל מקף-מוביל (עקבי עם החלטת-ה-Seed, C6 §9 פגם ידוע #2) ותווים לא-חוקיים', () => {
    expect(SKU_REGEX.test('-06ST')).toBe(false)
    expect(SKU_REGEX.test('b-reg-tag')).toBe(false) // אותיות קטנות
    expect(SKU_REGEX.test('SKU WITH SPACE')).toBe(false)
    expect(SKU_REGEX.test('')).toBe(false)
  })
})

describe('isValidSku', () => {
  it('עוטף את SKU_REGEX', () => {
    expect(isValidSku('B-FAB-LAN')).toBe(true)
    expect(isValidSku('-bad')).toBe(false)
  })
})

describe('isValidNonNegativePrice (products.base_price/cost)', () => {
  it('מקבל 0 וחיובי', () => {
    expect(isValidNonNegativePrice(0)).toBe(true)
    expect(isValidNonNegativePrice(500)).toBe(true)
    expect(isValidNonNegativePrice(5.5)).toBe(true)
  })

  it('פוסל שלילי ולא-מספר', () => {
    expect(isValidNonNegativePrice(-0.01)).toBe(false)
    expect(isValidNonNegativePrice('abc')).toBe(false)
  })

  it('פוסל ריק/null — Number(null)===0 לא אמור להתחזות ל"0 חוקי"', () => {
    expect(isValidNonNegativePrice(null)).toBe(false)
    expect(isValidNonNegativePrice(undefined)).toBe(false)
    expect(isValidNonNegativePrice('')).toBe(false)
  })
})

describe('isValidPositivePrice (price_tiers.special_price — CHECK > 0 ב-DB)', () => {
  it('מקבל חיובי, פוסל 0 ושלילי', () => {
    expect(isValidPositivePrice(0.01)).toBe(true)
    expect(isValidPositivePrice(0)).toBe(false)
    expect(isValidPositivePrice(-5)).toBe(false)
  })
})

describe('isValidPositiveInt (min_qty/max_qty)', () => {
  it('מקבל מספר שלם חיובי, פוסל 0/שלילי/שבר', () => {
    expect(isValidPositiveInt(1)).toBe(true)
    expect(isValidPositiveInt(1000)).toBe(true)
    expect(isValidPositiveInt(0)).toBe(false)
    expect(isValidPositiveInt(-1)).toBe(false)
    expect(isValidPositiveInt(1.5)).toBe(false)
  })
})

describe('isValidVatPercent / isValidGuestsRatio (params — מודול 3)', () => {
  it('מע"מ: 0–100 מותר (כמו isValidDiscountPercent — לא מאוחדים, ר\' הערת-design-notes §5)', () => {
    expect(isValidVatPercent(18)).toBe(true)
    expect(isValidVatPercent(0)).toBe(true)
    expect(isValidVatPercent(101)).toBe(false)
  })

  it('מע"מ ריק אינו מע"מ 0% (אותה מלכודת blank)', () => {
    expect(isValidVatPercent(null)).toBe(false)
    expect(isValidVatPercent('')).toBe(false)
  })

  it('יחס-אורחים-לדיילת: חייב חיובי-ממש (0 היה מחלק באפס ב-recommendHostessCount)', () => {
    expect(isValidGuestsRatio(50)).toBe(true)
    expect(isValidGuestsRatio(0)).toBe(false)
    expect(isValidGuestsRatio(-1)).toBe(false)
  })
})

// ---- מודול 4 (דיילות) — נוספו 09/08/2026, צעד 2.1 ----

describe('isValidIsraeliId — ספרת-ביקורת, לא "9 ספרות"', () => {
  it('מקבל ת"ז תקינות', () => {
    // ⚠️ מספרים מחושבים, לא ת"ז של אדם אמיתי: הסכום המשוקלל שלהם מתחלק ב-10.
    expect(isValidIsraeliId('123456782')).toBe(true)
    expect(isValidIsraeliId('000000018')).toBe(true)
  })

  it('פוסל מספר בעל 9 ספרות שספרת-הביקורת שלו שגויה', () => {
    // 🔑 זו כל הנקודה: בדיקת-אורך לבדה הייתה מכשירה את שניהם.
    expect(isValidIsraeliId('123456789')).toBe(false)
    expect(isValidIsraeliId('123456781')).toBe(false)
  })

  it('משלים אפסים מובילים — קלט בן 8 תווים שקול ל-9 עם אפס בראש', () => {
    expect(isValidIsraeliId('12345678')).toBe(isValidIsraeliId('012345678'))
  })

  it('פוסל ריק, לא-ספרות, ויותר מ-9 ספרות', () => {
    for (const bad of ['', '   ', null, undefined, 'abcdefghi', '12345678a', '1234567890']) {
      expect(isValidIsraeliId(bad)).toBe(false)
    }
  })

  it('פוסל מחרוזת אפסים — סכום 0 מתחלק ב-10 ואינו ת"ז', () => {
    // מלכודת אמיתית באלגוריתם: `sum % 10 === 0` לבדו מכשיר את "000000000".
    expect(isValidIsraeliId('000000000')).toBe(false)
  })

  it('מקבל מספר עם רווחים או מקפים בקצוות/באמצע — המשתמשת מדביקה מהטלפון', () => {
    expect(isValidIsraeliId(' 123456782 ')).toBe(true)
    expect(isValidIsraeliId('123-456-782')).toBe(true)
  })
})
