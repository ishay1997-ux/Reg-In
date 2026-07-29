import { describe, it, expect } from 'vitest'
import {
  QUOTE_STATUS_LABELS,
  REJECTION_REASONS,
  isColorApplicable,
  linesToPricingShape,
  sumHostessQty,
  computeLinesCost,
  deriveProfitability,
  buildQuoteHeader,
  buildQuoteLines,
  validateQuoteForm,
  quoteToFormState,
  computeEventHours,
  crossesMidnight,
} from '@/lib/quotes'

// תרחיש-האפיון המחייב (C5 §5.5.4) — אותו תרחיש שמאמת את מנוע-הכסף, כאן בצורת-המסך.
const WORKED_LINES = [
  { sku: '04ST', category: 'hostess', qty: 6, unitPrice: 500, unitCost: 300 },
  { sku: 'B-REG-TAG', category: 'product', qty: 300, unitPrice: 5, unitCost: 2.5 },
  { sku: 'B-FAB-LAN', category: 'product', qty: 300, unitPrice: 6, unitCost: 3 },
]

const VALID_FORM = {
  customerId: 7,
  eventName: 'כנס טכנולוגיה שנתי',
  eventDate: '2026-09-15',
  location: 'אקספו תל אביב',
  startTime: '18:00',
  endTime: '22:00',
  guests: 300,
  ratio: 50,
  hostessCount: 6,
  appliedDiscount: 5,
  manualDiscount: 10,
  notes: 'כולל הקמה ופירוק',
}

describe('תוויות וקבועים — 1:1 מול אילוצי ה-DB', () => {
  it('שלושת הסטטוסים בדיוק', () => {
    expect(Object.keys(QUOTE_STATUS_LABELS)).toEqual(['in_progress', 'approved', 'rejected'])
  })

  it('7 סיבות דחייה, זהות בית-בבית ל-CHECK', () => {
    expect(REJECTION_REASONS).toEqual([
      'מחיר',
      'חוסר זמינות/לו"ז',
      'נבחר מתחרה',
      'תקציב לקוח',
      'האירוע בוטל אצל הלקוח',
      'פג תוקף',
      'אחר',
    ])
  })
})

describe('isColorApplicable — הכרעת-ישי 29/07: צבע רק לתגים ולשרוכים', () => {
  it('מוצר ⇒ כן', () => expect(isColorApplicable({ category: 'product' })).toBe(true))
  it('דיילת ⇒ לא', () => expect(isColorApplicable({ category: 'hostess' })).toBe(false))
  it('אתר ⇒ לא', () => expect(isColorApplicable({ category: 'site' })).toBe(false))
  it('חסר ⇒ לא, בלי לזרוק', () => expect(isColorApplicable(undefined)).toBe(false))
})

describe('linesToPricingShape + sumHostessQty', () => {
  it('ממיר לצורה הקנונית {qty, unitPrice} בלבד', () => {
    expect(linesToPricingShape(WORKED_LINES)).toEqual([
      { qty: 6, unitPrice: 500 },
      { qty: 300, unitPrice: 5 },
      { qty: 300, unitPrice: 6 },
    ])
  })

  it('סופר דיילות מכל שורות ה-hostess (כמו ה-RPC של האישור)', () => {
    expect(sumHostessQty(WORKED_LINES)).toBe(6)
    expect(
      sumHostessQty([
        { category: 'hostess', qty: 4 },
        { category: 'hostess', qty: 2 },
        { category: 'product', qty: 300 },
      ]),
    ).toBe(6)
  })

  it('אין שורות דיילות ⇒ 0 (וזה מה שחוסם שמירה)', () => {
    expect(sumHostessQty([{ category: 'product', qty: 300 }])).toBe(0)
    expect(sumHostessQty([])).toBe(0)
    expect(sumHostessQty(null)).toBe(0)
  })
})

describe('רווחיות (§7.28 + הכרעת-ישי 29/07)', () => {
  it('עלות מחושבת מהעלויות לשורה', () => {
    // 6×300 + 300×2.5 + 300×3 = 1800 + 750 + 900
    expect(computeLinesCost(WORKED_LINES)).toBe(3450)
  })

  it('רווח גולמי ושיעורו מול הסכום לפני מע"מ', () => {
    expect(deriveProfitability(5355, 3450)).toEqual({
      cost: 3450,
      grossProfit: 1905,
      marginPercent: 35.6,
    })
  })

  it('הכנסה 0 ⇒ שיעור null ולא 0 (הצעה ריקה אינה "0% רווח")', () => {
    expect(deriveProfitability(0, 0).marginPercent).toBeNull()
  })

  it('הפסד מיוצג כמספר שלילי ולא נבלע', () => {
    const loss = deriveProfitability(1000, 1500)
    expect(loss.grossProfit).toBe(-500)
    expect(loss.marginPercent).toBe(-50)
  })
})

describe('buildQuoteHeader / buildQuoteLines — מפתחות ה-jsonb', () => {
  // ⚠️ הבדיקה הזו היא הרשת מול המלכודת השקטה: מפתח שגוי אינו נכשל בשרת אלא הופך ל-NULL,
  // ובעמודות עם coalesce — ל-0. שינוי שם-מפתח כאן חייב להפיל בדיקה, לא הצעה בפרודקשן.
  it('שמות המפתחות זהים בדיוק לאלה שה-RPC קורא', () => {
    expect(Object.keys(buildQuoteHeader(VALID_FORM)).sort()).toEqual(
      [
        'applied_customer_discount',
        'customer_id',
        'estimated_end_time',
        'estimated_event_date',
        'estimated_guests',
        'estimated_location',
        'estimated_start_time',
        'event_name',
        'manual_discount',
        'notes',
        'recommended_hostess_count',
      ].sort(),
    )
  })

  // הכרעת-ישי 29/07: כמות-הדיילות נערכת ידנית, ולכן **הערך שבטופס** הוא שנשמר.
  it('נשמרת הכמות שהוזנה בטופס, גם כשהיא שונה מההמלצה', () => {
    expect(buildQuoteHeader(VALID_FORM).recommended_hostess_count).toBe(6)
    expect(buildQuoteHeader({ ...VALID_FORM, hostessCount: 7 }).recommended_hostess_count).toBe(7)
  })

  it('כמות ריקה בטופס נופלת חזרה להמלצה המחושבת, ולא ל-NULL', () => {
    expect(buildQuoteHeader({ ...VALID_FORM, hostessCount: '' }).recommended_hostess_count).toBe(6)
    expect(
      buildQuoteHeader({ ...VALID_FORM, hostessCount: '', guests: 301 }).recommended_hostess_count,
    ).toBe(7)
  })

  it('שורה שולחת 5 שדות בלבד — line_number ו-closing_unit_cost נקבעים בשרת', () => {
    const lines = buildQuoteLines(WORKED_LINES)
    expect(Object.keys(lines[0]).sort()).toEqual(
      ['closing_unit_price', 'color', 'notes', 'qty', 'sku'].sort(),
    )
    expect(lines[0]).toMatchObject({ sku: '04ST', qty: 6, closing_unit_price: 500 })
  })
})

describe('validateQuoteForm', () => {
  const TODAY = '2026-07-29'

  it('טופס מלא ותקין ⇒ אין שגיאות', () => {
    expect(validateQuoteForm(VALID_FORM, WORKED_LINES, TODAY)).toEqual({})
  })

  it('שדות חובה חסרים מדווחים כל אחד בנפרד', () => {
    const errors = validateQuoteForm({ appliedDiscount: 0, manualDiscount: 0 }, [], TODAY)
    expect(errors).toHaveProperty('customerId')
    expect(errors).toHaveProperty('eventName')
    expect(errors).toHaveProperty('location')
    expect(errors).toHaveProperty('startTime')
    expect(errors).toHaveProperty('endTime')
    expect(errors).toHaveProperty('eventDate')
    expect(errors).toHaveProperty('guests')
    expect(errors).toHaveProperty('lines')
  })

  it('הכרעת-ישי: תאריך שעבר נחסם כבר ביצירה', () => {
    const errors = validateQuoteForm(
      { ...VALID_FORM, eventDate: '2026-07-28' },
      WORKED_LINES,
      TODAY,
    )
    expect(errors.eventDate).toContain('עבר')
  })

  it('היום עצמו מותר (הגבול הוא "לפני היום", לא "עד היום")', () => {
    expect(
      validateQuoteForm({ ...VALID_FORM, eventDate: TODAY }, WORKED_LINES, TODAY).eventDate,
    ).toBeUndefined()
  })

  it('סכום ההנחות מעל 100% נחסם (כמו CHECK quotes_combined_discount_max)', () => {
    const errors = validateQuoteForm(
      { ...VALID_FORM, appliedDiscount: 60, manualDiscount: 50 },
      WORKED_LINES,
      TODAY,
    )
    expect(errors.manualDiscount).toContain('100')
  })

  // הבחנה שנתפסה בבדיקה: שדה-קלט אופציונלי שנשאר ריק פירושו 0 (בשונה מפרמטר-מערכת חסר,
  // שאסור לו להתחזות ל-0 — ר' ההערה ב-quotes.js). טקסט לא-מספרי חייב עדיין להיפסל.
  it('הנחה ידנית ריקה = בלי הנחה נוספת (0), ולא שגיאה', () => {
    expect(validateQuoteForm({ ...VALID_FORM, manualDiscount: '' }, WORKED_LINES, TODAY)).toEqual(
      {},
    )
  })

  it('הנחה ידנית לא-מספרית נפסלת ואינה הופכת בשקט ל-0', () => {
    expect(
      validateQuoteForm({ ...VALID_FORM, manualDiscount: 'הנחה' }, WORKED_LINES, TODAY),
    ).toHaveProperty('manualDiscount')
  })

  it('הנחה ידנית שלילית נפסלת', () => {
    expect(
      validateQuoteForm({ ...VALID_FORM, manualDiscount: -5 }, WORKED_LINES, TODAY),
    ).toHaveProperty('manualDiscount')
  })

  it('§7.53: הצעה בלי שורת דיילות נחסמת — אחרת היא לעולם לא תוכל להפוך לפרויקט', () => {
    const noHostess = WORKED_LINES.filter((l) => l.category !== 'hostess')
    expect(validateQuoteForm(VALID_FORM, noHostess, TODAY).lines).toContain('דיילות')
  })

  it('שורה בלי מוצר או עם כמות 0 נחסמת', () => {
    expect(
      validateQuoteForm(VALID_FORM, [...WORKED_LINES, { sku: '', qty: 0 }], TODAY).lines,
    ).toBeTruthy()
  })

  // ⚠️ NaN <= 0 הוא false — בדיקת-טווח לבדה הייתה מכשירה כמות לא-מספרית בשקט.
  it('כמות לא-מספרית או ריקה נחסמת ואינה מחליקה דרך בדיקת-הטווח', () => {
    expect(
      validateQuoteForm(VALID_FORM, [{ sku: '04ST', category: 'hostess', qty: 'שלוש' }], TODAY)
        .lines,
    ).toBeTruthy()
    expect(
      validateQuoteForm(VALID_FORM, [{ sku: '04ST', category: 'hostess', qty: '' }], TODAY).lines,
    ).toBeTruthy()
  })

  // מאז שהשדה נערך ידנית אפשר לרוקן אותו; ריק היה מגיע לשרת כ-NULL ומפיל את ה-INSERT
  // על CHECK ‏recommended_hostess_count > 0 בשגיאה לא-קריאה.
  it('כמות דיילות ריקה או 0 נחסמת בטופס', () => {
    expect(
      validateQuoteForm({ ...VALID_FORM, hostessCount: '' }, WORKED_LINES, TODAY),
    ).toHaveProperty('hostessCount')
    expect(
      validateQuoteForm({ ...VALID_FORM, hostessCount: 0 }, WORKED_LINES, TODAY),
    ).toHaveProperty('hostessCount')
  })

  it('כמות דיילות ידנית שונה מההמלצה היא תקינה — זו כל הנקודה', () => {
    expect(validateQuoteForm({ ...VALID_FORM, hostessCount: 7 }, WORKED_LINES, TODAY)).toEqual({})
  })

  it('יחס 0 נחסם — אחרת ההמלצה הייתה חילוק באפס', () => {
    expect(validateQuoteForm({ ...VALID_FORM, ratio: 0 }, WORKED_LINES, TODAY)).toHaveProperty(
      'ratio',
    )
  })
})

describe('quoteToFormState — טעינת הצעה קיימת לעריכה', () => {
  const QUOTE = {
    customer_id: 7,
    event_name: 'כנס טכנולוגיה שנתי',
    estimated_event_date: '2026-09-15',
    estimated_location: 'אקספו תל אביב',
    estimated_start_time: '18:00:00',
    estimated_end_time: '22:00:00',
    estimated_guests: 300,
    applied_customer_discount: '5.00',
    manual_discount: '10.00',
    notes: 'הערה',
    quote_services: [
      {
        line_id: 2,
        line_number: 2,
        sku: 'B-REG-TAG',
        qty: 300,
        closing_unit_price: '5.00',
        closing_unit_cost: '2.50',
        color: 'לבן',
        notes: null,
      },
      {
        line_id: 1,
        line_number: 1,
        sku: '04ST',
        qty: 6,
        closing_unit_price: '500.00',
        closing_unit_cost: '300.00',
        color: null,
        notes: null,
      },
    ],
  }
  const PRODUCTS = {
    '04ST': { sku: '04ST', item_name: 'שירותי דיילת (4 שעות)', category: 'hostess', cost: 300 },
    'B-REG-TAG': {
      sku: 'B-REG-TAG',
      item_name: 'תג שם רגיל - ממותג',
      category: 'product',
      cost: 2.5,
    },
  }

  it('השורות מסודרות לפי line_number ולא לפי סדר-ההחזרה מה-DB', () => {
    const { lines } = quoteToFormState(QUOTE, PRODUCTS, 50)
    expect(lines.map((l) => l.sku)).toEqual(['04ST', 'B-REG-TAG'])
  })

  it('שעות נחתכות ל-HH:MM עבור שדה-הזמן בטופס', () => {
    const { form } = quoteToFormState(QUOTE, PRODUCTS, 50)
    expect(form.startTime).toBe('18:00')
    expect(form.endTime).toBe('22:00')
  })

  it('F12: הנחת-הלקוח נקראת מההצעה השמורה, לא מכרטיס הלקוח', () => {
    expect(quoteToFormState(QUOTE, PRODUCTS, 50).form.appliedDiscount).toBe(5)
  })

  it('F20: היחס אינו נשמר בהצעה וחוזר מברירת-המחדל של ההגדרות', () => {
    expect(quoteToFormState(QUOTE, PRODUCTS, 50).form.ratio).toBe(50)
  })

  it('הקטגוריה מושלמת מהקטלוג — היא זו שקובעת אם מוצגת בחירת-צבע', () => {
    const { lines } = quoteToFormState(QUOTE, PRODUCTS, 50)
    expect(lines[0].category).toBe('hostess')
    expect(lines[1].category).toBe('product')
  })
})

describe('computeEventHours / crossesMidnight (LOCAL-2)', () => {
  it('אירוע רגיל', () => expect(computeEventHours('18:00', '22:00')).toBe(4))
  it('חצי שעה נשמרת', () => expect(computeEventHours('18:00', '22:30')).toBe(4.5))
  it('גלגול חוצה-חצות (+24), כמו העמודה המחושבת ב-DB', () => {
    expect(computeEventHours('20:00', '02:00')).toBe(6)
    expect(crossesMidnight('20:00', '02:00')).toBe(true)
  })
  it('אירוע רגיל אינו מסומן כחוצה-חצות', () => {
    expect(crossesMidnight('18:00', '22:00')).toBe(false)
  })
  it('קלט חסר ⇒ null ולא 0 (0 שעות היה נראה כמו נתון אמיתי)', () => {
    expect(computeEventHours('', '22:00')).toBeNull()
    expect(computeEventHours('18:00', null)).toBeNull()
  })
})
