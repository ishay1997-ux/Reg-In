import { describe, it, expect } from 'vitest'
import {
  PRICING_PARAM_NAMES,
  computeLineTotal,
  computeQuoteTotals,
  formatShekelWhole,
  parseGuestsRatio,
  parseVatPercent,
  recommendHostessCount,
  resolveUnitPrice,
} from './pricing'

// מדרגות-המחיר האמיתיות מה-Seed (מיגרציה 20260723112000) — לא מספרים מומצאים, כדי שהבדיקה
// תיכשל אם אי-פעם ישתנה המחירון בלי שהבדיקה תעודכן יחד איתו.
const B_REG_TAG_TIERS = [
  { sku: 'B-REG-TAG', min_qty: 1, max_qty: 50, special_price: 6.0 },
  { sku: 'B-REG-TAG', min_qty: 51, max_qty: 200, special_price: 5.5 },
  { sku: 'B-REG-TAG', min_qty: 201, max_qty: 400, special_price: 5.0 },
  { sku: 'B-REG-TAG', min_qty: 401, max_qty: 1000, special_price: 4.5 },
  { sku: 'B-REG-TAG', min_qty: 1001, max_qty: null, special_price: 4.0 },
]
const B_FAB_LAN_TIERS = [
  { sku: 'B-FAB-LAN', min_qty: 1, max_qty: 50, special_price: 7.0 },
  { sku: 'B-FAB-LAN', min_qty: 51, max_qty: 200, special_price: 6.5 },
  { sku: 'B-FAB-LAN', min_qty: 201, max_qty: 400, special_price: 6.0 },
  { sku: 'B-FAB-LAN', min_qty: 401, max_qty: 1000, special_price: 5.2 },
  { sku: 'B-FAB-LAN', min_qty: 1001, max_qty: null, special_price: 4.5 },
]
const TAG = { sku: 'B-REG-TAG', base_price: 6.0 }
const LAN = { sku: 'B-FAB-LAN', base_price: 7.0 }
// שירותי-דיילות: מחיר-בסיס בלבד, בלי מדרגות כלל (החלטת-Seed #3)
const HOSTESS_4H = { sku: '04ST', base_price: 500.0 }

describe('resolveUnitPrice — בחירת מדרגת-מחיר (§7.27)', () => {
  it('בוחר את המדרגה הגבוהה ביותר שסף-הכניסה שלה קטן-או-שווה לכמות', () => {
    expect(resolveUnitPrice(TAG, B_REG_TAG_TIERS, 300)).toBe(5.0)
    expect(resolveUnitPrice(LAN, B_FAB_LAN_TIERS, 300)).toBe(6.0)
  })

  it('מדויק בדיוק על גבולות-המדרגות 50/51, 200/201, 400/401, 1000/1001', () => {
    expect(resolveUnitPrice(TAG, B_REG_TAG_TIERS, 50)).toBe(6.0)
    expect(resolveUnitPrice(TAG, B_REG_TAG_TIERS, 51)).toBe(5.5)
    expect(resolveUnitPrice(TAG, B_REG_TAG_TIERS, 200)).toBe(5.5)
    expect(resolveUnitPrice(TAG, B_REG_TAG_TIERS, 201)).toBe(5.0)
    expect(resolveUnitPrice(TAG, B_REG_TAG_TIERS, 400)).toBe(5.0)
    expect(resolveUnitPrice(TAG, B_REG_TAG_TIERS, 401)).toBe(4.5)
    expect(resolveUnitPrice(TAG, B_REG_TAG_TIERS, 1000)).toBe(4.5)
    expect(resolveUnitPrice(TAG, B_REG_TAG_TIERS, 1001)).toBe(4.0)
  })

  it('פותר נכון גם כשהמדרגות מגיעות בסדר מעורבב (לא סומך על סדר-הקריאה מה-DB)', () => {
    const shuffled = [
      B_REG_TAG_TIERS[3],
      B_REG_TAG_TIERS[0],
      B_REG_TAG_TIERS[4],
      B_REG_TAG_TIERS[2],
    ]
    expect(resolveUnitPrice(TAG, shuffled, 300)).toBe(5.0)
  })

  it('max_qty אינו משתתף בבחירה — רק min_qty (§7.27: תצוגה בלבד)', () => {
    // מדרגה עם max_qty שקרי/חסר: הבחירה עדיין נקבעת לפי min_qty בלבד
    const noMax = B_REG_TAG_TIERS.map((t) => ({ ...t, max_qty: 1 }))
    expect(resolveUnitPrice(TAG, noMax, 300)).toBe(5.0)
  })

  it('מוצר בלי מדרגות כלל ⇒ מחיר-הבסיס (שירותי-דיילות, החלטת-Seed #3)', () => {
    expect(resolveUnitPrice(HOSTESS_4H, [], 6)).toBe(500.0)
    expect(resolveUnitPrice(HOSTESS_4H, null, 6)).toBe(500.0)
  })

  it('כמות מתחת למדרגה הנמוכה ביותר ⇒ מחיר-הבסיס', () => {
    const startsAt10 = [{ sku: 'B-REG-TAG', min_qty: 10, max_qty: null, special_price: 2.0 }]
    expect(resolveUnitPrice(TAG, startsAt10, 9)).toBe(6.0)
    expect(resolveUnitPrice(TAG, startsAt10, 10)).toBe(2.0)
  })

  it('מתעלם ממדרגות של מק"ט אחר גם אם הועבר קטלוג-המדרגות המלא', () => {
    const wholeCatalog = [...B_REG_TAG_TIERS, ...B_FAB_LAN_TIERS]
    expect(resolveUnitPrice(TAG, wholeCatalog, 300)).toBe(5.0)
    expect(resolveUnitPrice(LAN, wholeCatalog, 300)).toBe(6.0)
  })

  it('מוצר בלי מדרגות ובלי מחיר-בסיס ⇒ 0 (שורה חשודה על המסך, לא קריסה)', () => {
    expect(resolveUnitPrice({ sku: 'X' }, [], 5)).toBe(0)
    expect(resolveUnitPrice(null, [], 5)).toBe(0)
  })
})

describe('computeLineTotal — סך-שורה', () => {
  it('מכפיל כמות במחיר-יחידה בדיוק של אגורה', () => {
    expect(computeLineTotal(300, 5.0)).toBe(1500)
    expect(computeLineTotal(300, 6.0)).toBe(1800)
    expect(computeLineTotal(6, 500.0)).toBe(3000)
  })

  it('שומר על אגורות במחירים עם שבר (המקום שבו float שובר חישובי-כסף)', () => {
    expect(computeLineTotal(3, 5.5)).toBe(16.5)
    expect(computeLineTotal(7, 4.7)).toBe(32.9) // 7*4.7 ב-float = 32.899999999999999
    expect(computeLineTotal(3, 1.1)).toBe(3.3) // 3*1.1 ב-float = 3.3000000000000003
  })

  it('כמות או מחיר לא-תקינים ⇒ 0', () => {
    expect(computeLineTotal(0, 5)).toBe(0)
    expect(computeLineTotal(-1, 5)).toBe(0)
    expect(computeLineTotal(3, 'abc')).toBe(0)
  })
})

describe('computeQuoteTotals — תרחיש-הקבלה 6,319 ₪ (C5 §5.5.4)', () => {
  // התרחיש המחייב מהאפיון: 300 אורחים · 4 שעות · 6 דיילות (04ST) · 300 תגים ממותגים ·
  // 300 שרוכים ממותגים · 5% הנחת-לקוח קבועה + 10% הנחה ידנית · מע"מ 18%.
  const acceptanceLines = [
    { qty: 6, unitPrice: 500.0 },
    { qty: 300, unitPrice: 5.0 },
    { qty: 300, unitPrice: 6.0 },
  ]

  it('מפיק את חמשת המספרים המדויקים של האפיון', () => {
    const t = computeQuoteTotals(acceptanceLines, 5, 10, 18)
    expect(t.subtotal).toBe(6300)
    expect(t.discountAmount).toBe(945)
    expect(t.preVat).toBe(5355)
    expect(t.vatAmount).toBe(963.9)
    expect(t.total).toBe(6318.9)
  })

  it('מוצג למשתמש כ-6,319 ₪ (F18 — עיגול בתצוגה בלבד)', () => {
    const t = computeQuoteTotals(acceptanceLines, 5, 10, 18)
    expect(formatShekelWhole(t.total)).toBe('6,319 ₪')
  })

  it('סכום-הביניים משוחזר מהשורות (§7.25 — 5,355 נבנה מהשורות, לא מוקלד)', () => {
    const fromLines = acceptanceLines.reduce((s, l) => s + computeLineTotal(l.qty, l.unitPrice), 0)
    expect(fromLines).toBe(6300)
  })
})

describe('computeQuoteTotals — הנחות מצטברות בחיבור (§7.26/F7)', () => {
  const lines = [{ qty: 10, unitPrice: 100 }] // 1,000 ₪

  it('5% + 10% = 15% מסכום-הביניים, ולא 10% מהיתרה אחרי 5%', () => {
    const t = computeQuoteTotals(lines, 5, 10, 0)
    expect(t.discountAmount).toBe(150) // חיבורי. שרשורי היה נותן 145
    expect(t.preVat).toBe(850)
  })

  it('בלי הנחות כלל — 0', () => {
    const t = computeQuoteTotals(lines, 0, 0, 18)
    expect(t.discountAmount).toBe(0)
    expect(t.preVat).toBe(1000)
    expect(t.total).toBe(1180)
  })

  it('הנחה מלאה 100% ⇒ הכל מתאפס (כולל המע"מ)', () => {
    const t = computeQuoteTotals(lines, 100, 0, 18)
    expect(t.preVat).toBe(0)
    expect(t.vatAmount).toBe(0)
    expect(t.total).toBe(0)
  })

  it('דוחה הנחה בודדת מעל 100 או שלילית', () => {
    expect(() => computeQuoteTotals(lines, 101, 0, 18)).toThrow()
    expect(() => computeQuoteTotals(lines, 0, 101, 18)).toThrow()
    expect(() => computeQuoteTotals(lines, -1, 0, 18)).toThrow()
  })

  it('דוחה סכום-הנחות מעל 100 גם כששתיהן חוקיות לחוד (CHECK combined ב-DB)', () => {
    expect(() => computeQuoteTotals(lines, 60, 50, 18)).toThrow()
    expect(computeQuoteTotals(lines, 60, 40, 18).discountAmount).toBe(1000) // 100 בדיוק — מותר
  })

  it('דוחה שיעור-מע"מ לא-חוקי', () => {
    expect(() => computeQuoteTotals(lines, 0, 0, 101)).toThrow()
    expect(() => computeQuoteTotals(lines, 0, 0, null)).toThrow()
  })

  it('הצעה בלי שורות ⇒ אפסים, בלי לזרוק (מסך-בנייה שעדיין ריק)', () => {
    const t = computeQuoteTotals([], 5, 10, 18)
    expect(t).toEqual({ subtotal: 0, discountAmount: 0, preVat: 0, vatAmount: 0, total: 0 })
  })
})

describe('recommendHostessCount — המלצת כוח-אדם (F14)', () => {
  it('300 אורחים ביחס 50 ⇒ 6 דיילות (תרחיש-הקבלה)', () => {
    expect(recommendHostessCount(300, 50)).toBe(6)
  })

  it('מעגל תמיד כלפי מעלה — 301 אורחים ⇒ 7, לא 6', () => {
    expect(recommendHostessCount(301, 50)).toBe(7)
    expect(recommendHostessCount(1, 50)).toBe(1)
  })

  it('קלט חסר או לא-תקין ⇒ 0 (הטופס חוסם שמירה; אין קריסה תוך-כדי הקלדה)', () => {
    expect(recommendHostessCount(0, 50)).toBe(0)
    expect(recommendHostessCount(300, 0)).toBe(0)
    expect(recommendHostessCount(null, null)).toBe(0)
  })
})

describe('formatShekelWhole — תצוגת שקלים שלמים (F18)', () => {
  it('מעגל לשקל שלם ומוסיף מפריד-אלפים', () => {
    expect(formatShekelWhole(6318.9)).toBe('6,319 ₪')
    expect(formatShekelWhole(5355)).toBe('5,355 ₪')
    expect(formatShekelWhole(963.9)).toBe('964 ₪')
    expect(formatShekelWhole(0)).toBe('0 ₪')
  })

  it('ערך לא-מספרי ⇒ מקף, לא NaN על המסך', () => {
    expect(formatShekelWhole(null)).toBe('—')
    expect(formatShekelWhole('abc')).toBe('—')
  })
})

describe('פרמטרי-התמחור — שמות ופענוח', () => {
  it('שמות-הפרמטרים זהים בית-בבית לשורות ה-Seed ב-params', () => {
    expect(PRICING_PARAM_NAMES.VAT_PERCENT).toBe('אחוז_מעמ')
    expect(PRICING_PARAM_NAMES.GUESTS_PER_HOSTESS_RATIO).toBe('יחס_אורחים_לדיילת')
  })

  it('parseVatPercent מפענח את הערך הטקסטואלי מה-DB, ופוסל ערך מחוץ לטווח', () => {
    expect(parseVatPercent('18')).toBe(18)
    expect(parseVatPercent('0')).toBe(0)
    expect(parseVatPercent('101')).toBe(null)
    expect(parseVatPercent('')).toBe(null)
    expect(parseVatPercent(undefined)).toBe(null)
  })

  it('parseGuestsRatio דורש מספר חיובי (יחס 0 היה מחלק באפס)', () => {
    expect(parseGuestsRatio('50')).toBe(50)
    expect(parseGuestsRatio('0')).toBe(null)
    expect(parseGuestsRatio('לא-מספר')).toBe(null)
  })
})
