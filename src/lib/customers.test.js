import { describe, it, expect } from 'vitest'
import {
  CUSTOMER_TYPE_LABELS,
  countActiveFilters,
  matchesCustomerFilters,
  sortCustomers,
  deriveCustomerMetrics,
  validateCustomerField,
  validateCustomerForm,
  validateExtraContacts,
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

  it('מוצא לפי שם איש-קשר *נוסף* (customer_contacts, §7.81)', () => {
    const withExtra = c({ customer_contacts: [{ contact_name: 'מיכל לוי' }] })
    expect(matchesCustomerFilters(withExtra, { text: 'מיכל' })).toBe(true) // איש-קשר נוסף
    expect(matchesCustomerFilters(withExtra, { text: 'דנה' })).toBe(true) // עדיין מוצא את הראשי
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

describe('matchesCustomerFilters — פילטרים חדשים (ב/ג)', () => {
  it('status: מסנן פעילים בלבד כשסופק; לא מסנן כשלא (toggle-ארכיון)', () => {
    expect(matchesCustomerFilters(c({ status: 'inactive' }), { status: 'active' })).toBe(false)
    expect(matchesCustomerFilters(c({ status: 'inactive' }), {})).toBe(true) // "הצג ארכיון" דלוק
  })

  it('hasDiscount: יש/אין הנחה (בוליאני מפורש בלבד)', () => {
    expect(matchesCustomerFilters(c({ discount_percent: 0 }), { hasDiscount: true })).toBe(false)
    expect(matchesCustomerFilters(c({ discount_percent: 5 }), { hasDiscount: true })).toBe(true)
    expect(matchesCustomerFilters(c({ discount_percent: 5 }), { hasDiscount: false })).toBe(false)
    expect(matchesCustomerFilters(c({ discount_percent: 0 }), { hasDiscount: false })).toBe(true)
  })

  it('createdAfter: "נוספו-לאחרונה" לפי סף-תאריך (השוואת-Date)', () => {
    const cutoff = '2026-06-11T00:00:00Z'
    expect(
      matchesCustomerFilters(c({ created_at: '2026-07-10T00:00:00Z' }), { createdAfter: cutoff }),
    ).toBe(true)
    expect(
      matchesCustomerFilters(c({ created_at: '2026-01-01T00:00:00Z' }), { createdAfter: cutoff }),
    ).toBe(false)
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

describe('deriveCustomerMetrics — 5 מדדים ממוקדי-מנהלת-לקוחות', () => {
  it('הכנסות/גודל-עסקה/אירוע-אחרון/רדום = null במ2; רווח-גולמי ירד מהכרטיס', () => {
    const m = deriveCustomerMetrics([{ feedback_score: 4 }])
    expect(m.totalRevenue).toBeNull()
    expect(m.avgDealSize).toBeNull()
    expect(m.lastEventDate).toBeNull()
    expect(m.isDormant).toBeNull()
    expect(m).not.toHaveProperty('grossProfit') // ירד מהכרטיס — יעדו מ8/מ11
  })

  it('projectCount = אורך-הרשימה, אך null כשריקה (0-נראה מטעה עד מ6)', () => {
    expect(deriveCustomerMetrics([{}, {}, {}]).projectCount).toBe(3)
    expect(deriveCustomerMetrics([]).projectCount).toBeNull()
  })

  it('avgFeedback = ממוצע feedback_score כשיש, אחרת null', () => {
    expect(deriveCustomerMetrics([{ feedback_score: 4 }, { feedback_score: 2 }]).avgFeedback).toBe(
      3,
    )
    expect(deriveCustomerMetrics([]).avgFeedback).toBeNull()
    expect(deriveCustomerMetrics([{ feedback_score: null }]).avgFeedback).toBeNull()
  })
})

// ---- הועברו לכאן 29/07/2026 מ-CustomerFormDialog/CustomersPage (מוקדי-מורכבות → SSOT) ----

describe('countActiveFilters — תג ספירת-המסננים', () => {
  it('אובייקט ריק = 0, וכל מסנן מוסיף 1', () => {
    expect(countActiveFilters()).toBe(0)
    expect(countActiveFilters({})).toBe(0)
    expect(countActiveFilters({ customerType: 'nonprofit', newWithinDays: 7 })).toBe(2)
  })

  it('marketingConsent נספר רק כשהוא true (המסננת היא "מאושרי-דיוור")', () => {
    expect(countActiveFilters({ marketingConsent: true })).toBe(1)
    expect(countActiveFilters({ marketingConsent: false })).toBe(0)
  })

  it('hasDiscount=false הוא מסנן פעיל ("בלי הנחה"), ו-minDiscount=0 נספר גם הוא', () => {
    expect(countActiveFilters({ hasDiscount: false })).toBe(1)
    expect(countActiveFilters({ minDiscount: 0 })).toBe(1)
  })
})

describe('validateCustomerField — ולידציה פר-שדה', () => {
  it('שם-שדה לא-מוכר מוחזר כתקין (מה שמאפשר מעבר על כל מפתחות הטופס)', () => {
    expect(validateCustomerField('marketing_consent', true)).toBe('')
    expect(validateCustomerField('שדה-שלא-קיים', 'x')).toBe('')
  })

  it('ח"פ = 9 ספרות בדיוק, עם מחרוזת-האפיון המילולית', () => {
    expect(validateCustomerField('company_number', '514000001')).toBe('')
    expect(validateCustomerField('company_number', '5140000')).toBe(
      'שגיאה: מספר ח.פ. חייב להכיל 9 ספרות בדיוק',
    )
  })

  it('טלפון: אותיות נחסמות, ≥4 ספרות נדרשות, סימני-טלפון מותרים', () => {
    expect(validateCustomerField('phone', '03-1234567')).toBe('')
    expect(validateCustomerField('phone', '+972 (3) 123.4567')).toBe('')
    expect(validateCustomerField('phone', '*2800')).not.toBe('') // כוכבית אינה סימן מותר
    expect(validateCustomerField('phone', 'ן9999999')).not.toBe('') // הכרעת-ישי 11/07
    expect(validateCustomerField('phone', '123')).not.toBe('') // פחות מ-4 ספרות
    expect(validateCustomerField('phone', '')).toBe('יש להזין מספר טלפון.')
  })

  it('שם-לקוח ≥2 תווים, אימייל תקין, הנחה 0-100', () => {
    expect(validateCustomerField('company_name', 'א')).not.toBe('')
    expect(validateCustomerField('company_name', 'אב')).toBe('')
    expect(validateCustomerField('email', 'a@b.co')).toBe('')
    expect(validateCustomerField('email', 'a@b')).not.toBe('')
    expect(validateCustomerField('discount_percent', '100')).toBe('')
    expect(validateCustomerField('discount_percent', '101')).not.toBe('')
  })
})

describe('validateCustomerForm — ולידציית השדות הראשיים', () => {
  const validForm = {
    company_name: 'טכנולוגיות אלפא',
    company_number: '514000001',
    customer_type: 'private_company',
    contact_name: 'דנה כהן',
    phone: '03-1234567',
    email: 'dana@alpha.co.il',
    discount_percent: '10',
    marketing_consent: true,
  }

  it('טופס תקין = מפה ריקה', () => {
    expect(validateCustomerForm(validForm)).toEqual({})
  })

  it('מחזירה רק את השדות הפגומים, ומדלגת על marketing_consent', () => {
    const errors = validateCustomerForm({ ...validForm, email: 'לא-אימייל', phone: '' })
    expect(Object.keys(errors).sort()).toEqual(['email', 'phone'])
    expect(errors).not.toHaveProperty('marketing_consent')
  })
})

describe('validateExtraContacts — אנשי-קשר נוספים (§7.81)', () => {
  it('שורה ריקה לגמרי מדולגת', () => {
    expect(validateExtraContacts([{ _rk: 1, contact_name: '', phone: '', email: '' }])).toEqual({})
    expect(validateExtraContacts([{ _rk: 1 }])).toEqual({}) // שדות undefined
  })

  it('שורה עם תוכן בלי שם ⇒ שגיאה על שדה-השם', () => {
    expect(validateExtraContacts([{ _rk: 1, phone: '03-1234567' }])).toEqual({
      1: { field: 'contact_name', msg: 'יש להזין שם לאיש הקשר.' },
    })
  })

  it('שם בלי טלפון ובלי אימייל ⇒ שגיאת both', () => {
    expect(validateExtraContacts([{ _rk: 7, contact_name: 'מיכל לוי' }])).toEqual({
      7: { field: 'both', msg: 'יש להזין טלפון או אימייל לאיש הקשר.' },
    })
  })

  it('טלפון/אימייל פגומים נבדקים באותם כללים של השדות הראשיים', () => {
    const errs = validateExtraContacts([
      { _rk: 1, contact_name: 'א', phone: 'אבג' },
      { _rk: 2, contact_name: 'ב', email: 'לא-אימייל' },
    ])
    expect(errs[1].field).toBe('phone')
    expect(errs[2].field).toBe('email')
  })

  it('שורה תקינה (שם + אחד מהשניים) לא מייצרת שגיאה', () => {
    expect(validateExtraContacts([{ _rk: 1, contact_name: 'מיכל', email: 'm@x.co' }])).toEqual({})
    expect(validateExtraContacts([{ _rk: 2, contact_name: 'מיכל', phone: '03-1234567' }])).toEqual(
      {},
    )
  })
})
