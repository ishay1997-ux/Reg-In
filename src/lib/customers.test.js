import { describe, it, expect } from 'vitest'
import {
  CUSTOMER_TYPE_LABELS,
  matchesCustomerFilters,
  sortCustomers,
  deriveCustomerMetrics,
} from './customers'

// עוזר-בנייה ללקוח-בדיקה (override נקודתי לכל תרחיש)
const c = (over = {}) => ({
  customer_id: 1,
  company_number: '514000001',
  company_name: 'טכנולוגיות אלפא',
  contact_name: 'דנה כהן',
  customer_type: 'private_company',
  discount_percent: 5,
  marketing_consent: true,
  status: 'active',
  ...over,
})

describe('CUSTOMER_TYPE_LABELS', () => {
  it('ממפה את 4 ערכי ה-enum לתוויות האפיון (§7.3)', () => {
    expect(CUSTOMER_TYPE_LABELS.private_company).toBe('חברה פרטית')
    expect(CUSTOMER_TYPE_LABELS.government).toBe('חברה ממשלתית')
    expect(CUSTOMER_TYPE_LABELS.production_company).toBe('חברת הפקה')
    expect(CUSTOMER_TYPE_LABELS.nonprofit).toBe('עמותה')
  })
})

describe('matchesCustomerFilters — חיפוש סלחני (§7.11)', () => {
  it('מוצא לפי שם-חברה בלבד / שם-איש-קשר בלבד / תחילת-ח"פ', () => {
    expect(matchesCustomerFilters(c(), { text: 'אלפא' })).toBe(true) // שם חברה
    expect(matchesCustomerFilters(c(), { text: 'דנה' })).toBe(true) // איש קשר
    expect(matchesCustomerFilters(c(), { text: '514' })).toBe(true) // תחילת ח"פ
  })

  it('ח"פ = התאמת-תחילית בלבד, לא אמצע', () => {
    expect(matchesCustomerFilters(c({ company_number: '514000001' }), { text: '000' })).toBe(false)
  })

  it('טקסט ריק / חסר / רווחים = מחזיר את כולם', () => {
    expect(matchesCustomerFilters(c(), {})).toBe(true)
    expect(matchesCustomerFilters(c(), { text: '   ' })).toBe(true)
  })

  it('מסנן לפי סוג-לקוח, מאושר-דיוור, ואחוז-הנחה-מינימלי', () => {
    expect(matchesCustomerFilters(c(), { customerType: 'government' })).toBe(false)
    expect(
      matchesCustomerFilters(c({ marketing_consent: false }), { marketingConsent: true }),
    ).toBe(false)
    expect(matchesCustomerFilters(c({ discount_percent: 5 }), { minDiscount: 10 })).toBe(false)
    expect(matchesCustomerFilters(c({ discount_percent: 15 }), { minDiscount: 10 })).toBe(true)
  })

  it('marketingConsent לא-בוליאני (null) = לא מסנן', () => {
    expect(
      matchesCustomerFilters(c({ marketing_consent: false }), { marketingConsent: null }),
    ).toBe(true)
  })
})

describe('sortCustomers', () => {
  const list = [
    c({ company_name: 'גמא', discount_percent: 10, customer_type: 'nonprofit' }),
    c({ company_name: 'אלפא', discount_percent: 5, customer_type: 'government' }),
    c({ company_name: 'בטא', discount_percent: 20, customer_type: 'private_company' }),
  ]

  it('ממיין לפי שם-חברה עולה/יורד', () => {
    expect(sortCustomers(list, 'company_name', 'asc').map((x) => x.company_name)).toEqual([
      'אלפא',
      'בטא',
      'גמא',
    ])
    expect(sortCustomers(list, 'company_name', 'desc').map((x) => x.company_name)).toEqual([
      'גמא',
      'בטא',
      'אלפא',
    ])
  })

  it('ממיין אחוז-הנחה מספרית (לא לקסיקוגרפית)', () => {
    expect(sortCustomers(list, 'discount_percent', 'asc').map((x) => x.discount_percent)).toEqual([
      5, 10, 20,
    ])
  })

  it('לא משנה את המערך המקורי (עותק חדש)', () => {
    const before = list.map((x) => x.company_name)
    sortCustomers(list, 'company_name', 'desc')
    expect(list.map((x) => x.company_name)).toEqual(before)
  })

  it('מפתח לא-מוכר = עותק בלי מיון, בלי לזרוק', () => {
    expect(sortCustomers(list, 'nope').map((x) => x.company_name)).toEqual(
      list.map((x) => x.company_name),
    )
  })
})

describe('deriveCustomerMetrics', () => {
  it('totalRevenue + grossProfit תמיד null במודול 2 (SSOT במודול 3/7)', () => {
    const m = deriveCustomerMetrics([{ feedback_score: 4 }])
    expect(m.totalRevenue).toBeNull()
    expect(m.grossProfit).toBeNull()
  })

  it('avgFeedback = ממוצע feedback_score כשיש, אחרת null', () => {
    expect(deriveCustomerMetrics([{ feedback_score: 4 }, { feedback_score: 2 }]).avgFeedback).toBe(
      3,
    )
    expect(deriveCustomerMetrics([]).avgFeedback).toBeNull()
    expect(deriveCustomerMetrics([{ feedback_score: null }]).avgFeedback).toBeNull()
  })
})
