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
  EXPIRING_SOON_DAYS,
  quoteToPdfModel,
  MANUAL_REJECTION_REASONS,
  NON_LOSS_REJECTION_REASONS,
  deriveQuoteAmount,
  deriveQuoteExpiry,
  isEventSoon,
  deriveQuoteMetrics,
  countRejectionReasons,
  matchesQuoteFilters,
  sortQuotes,
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

  it('8 סיבות דחייה, זהות בית-בבית ל-CHECK (7 מקוריות + "נפתחה בטעות", מיגרציה 20260729191557)', () => {
    expect(REJECTION_REASONS).toEqual([
      'מחיר',
      'חוסר זמינות/לו"ז',
      'נבחר מתחרה',
      'תקציב לקוח',
      'האירוע בוטל אצל הלקוח',
      'פג תוקף',
      'נפתחה בטעות',
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

// ── מסך ניהול ההצעות (צעד 3.3) ────────────────────────────────────────────────
// שורות כפי שהן חוזרות מ-listQuotes(): עמודות ה-DB הגולמיות + quote_services + customers.
// הצעה #6 היא בדיוק תרחיש-האפיון (5% לקוח + 10% ידנית ⇒ 6,319 ₪) — אותו עוגן כמו במנוע-הכסף.
const WORKED_SERVICES = [
  { qty: 6, closing_unit_price: 500 },
  { qty: 300, closing_unit_price: 5 },
  { qty: 300, closing_unit_price: 6 },
]

function quoteRow(overrides = {}) {
  return {
    quote_id: 6,
    customer_id: 2,
    event_name: 'כנס לקוחות שנתי',
    quote_status: 'in_progress',
    applied_customer_discount: 5,
    manual_discount: 10,
    vat_rate_snapshot: null,
    updated_at: '2026-07-29T09:00:00.000Z',
    estimated_event_date: '2026-08-22',
    rejection_reason: null,
    quote_services: WORKED_SERVICES,
    customers: { company_name: 'מדיטק פתרונות בע"מ', contact_name: 'רון גל' },
    ...overrides,
  }
}

describe('deriveQuoteAmount — הסכום בשורת-הטבלה', () => {
  it('תרחיש-האפיון מחזיר 6,319 ₪ בדיוק גם מצורת-ה-DB', () => {
    expect(deriveQuoteAmount(quoteRow(), 18).total).toBe(6318.9)
  })

  it('אחוז-ההנחה המוצג הוא **חיבור** שתי ההנחות (§7.26/F7) — 5+10=15, לא 14.5', () => {
    expect(deriveQuoteAmount(quoteRow(), 18).discountPercent).toBe(15)
  })

  it('בלי הנחה כלל ⇒ 0, כדי שהמסך ידע לא להציג את שורת "אחרי X% הנחה"', () => {
    const row = quoteRow({ applied_customer_discount: 0, manual_discount: 0 })
    expect(deriveQuoteAmount(row, 18).discountPercent).toBe(0)
  })

  it('הצעה מאושרת משתמשת ב-vat_rate_snapshot הקפוא ולא במע"מ החי (§7.51)', () => {
    const approved = quoteRow({ quote_status: 'approved', vat_rate_snapshot: 17 })
    // 5,355 לפני מע"מ; 17% ⇒ 6,265.35, ולא 6,318.90 שהיו יוצאים לפי 18% החי.
    expect(deriveQuoteAmount(approved, 18).total).toBe(6265.35)
  })

  it('הצעה בלי שורות ⇒ 0 ולא קריסה', () => {
    expect(deriveQuoteAmount(quoteRow({ quote_services: [] }), 18).total).toBe(0)
  })

  it('מע"מ שלא נטען (null) ⇒ null ולא סכום שמומצא בלי מע"מ', () => {
    // "ריק אינו 0" — פרמטר-מערכת שנכשל בטעינה חייב לצעוק, לא להציג סכום נמוך אמין-למראה.
    expect(deriveQuoteAmount(quoteRow(), null).total).toBeNull()
  })
})

describe('deriveQuoteExpiry — "פג בעוד N יום" (F4: נספר מ-updated_at)', () => {
  it('הצעה שעודכנה היום פגה בעוד מלוא ימי-התוקף', () => {
    const exp = deriveQuoteExpiry(quoteRow(), 30, '2026-07-29')
    expect(exp.expiryDate).toBe('2026-08-28')
    expect(exp.daysLeft).toBe(30)
    expect(exp.isExpiringSoon).toBe(false)
  })

  it('נשארו 5 ימים ⇒ נכנסת ל"פג בקרוב" (סף LOCAL-4 = 7)', () => {
    const row = quoteRow({ updated_at: '2026-07-04T09:00:00.000Z' })
    const exp = deriveQuoteExpiry(row, 30, '2026-07-29')
    expect(exp.daysLeft).toBe(5)
    expect(exp.isExpiringSoon).toBe(true)
  })

  it('בדיוק 7 ימים עדיין "פג בקרוב" — הסף כולל', () => {
    const row = quoteRow({ updated_at: '2026-07-06T09:00:00.000Z' })
    const exp = deriveQuoteExpiry(row, 30, '2026-07-29')
    expect(exp.daysLeft).toBe(EXPIRING_SOON_DAYS)
    expect(exp.isExpiringSoon).toBe(true)
  })

  it('הצעה סגורה (מאושרת/נדחתה) אינה פגה ⇒ null', () => {
    expect(deriveQuoteExpiry(quoteRow({ quote_status: 'approved' }), 30, '2026-07-29')).toBeNull()
    expect(deriveQuoteExpiry(quoteRow({ quote_status: 'rejected' }), 30, '2026-07-29')).toBeNull()
  })

  it('ימי-תוקף שלא נטענו ⇒ null, ולא ספירה לפי 30 מומצא', () => {
    expect(deriveQuoteExpiry(quoteRow(), null, '2026-07-29')).toBeNull()
  })
})

describe('isEventSoon — "אירועים קרובים" (מהפרמטר ימי_אזהרה_קדם_אירוע)', () => {
  it('אירוע בעוד 12 יום נכנס לחלון של 14', () => {
    const row = quoteRow({ estimated_event_date: '2026-08-10' })
    expect(isEventSoon(row, 14, '2026-07-29')).toBe(true)
  })

  it('אירוע בעוד 24 יום — לא', () => {
    expect(isEventSoon(quoteRow(), 14, '2026-07-29')).toBe(false)
  })

  it('אירוע שכבר עבר אינו "קרוב" — אין למה להיערך', () => {
    const row = quoteRow({ estimated_event_date: '2026-07-01' })
    expect(isEventSoon(row, 14, '2026-07-29')).toBe(false)
  })
})

describe('deriveQuoteMetrics — שני המדדים שליד הכותרת', () => {
  const MIXED = [
    quoteRow({ quote_id: 1, quote_status: 'in_progress' }),
    quoteRow({ quote_id: 2, quote_status: 'in_progress' }),
    quoteRow({ quote_id: 3, quote_status: 'approved', vat_rate_snapshot: 18 }),
    quoteRow({ quote_id: 4, quote_status: 'rejected', rejection_reason: 'תקציב לקוח' }),
    quoteRow({ quote_id: 5, quote_status: 'rejected', rejection_reason: 'פג תוקף' }),
    quoteRow({ quote_id: 6, quote_status: 'rejected', rejection_reason: 'נבחר מתחרה' }),
  ]

  it('"שווי הצעות פתוחות" מסכם רק את ההצעות בתהליך', () => {
    const m = deriveQuoteMetrics(MIXED, 18)
    expect(m.openCount).toBe(2)
    expect(m.openValue).toBe(6318.9 * 2)
  })

  it('שיעור-אישור = מאושרות מתוך שנסגרו — 1 מתוך 4 = 25%', () => {
    const m = deriveQuoteMetrics(MIXED, 18)
    expect(m.closedCount).toBe(4)
    expect(m.approvedCount).toBe(1)
    expect(m.approvalRate).toBe(25)
  })

  it('"פג תוקף" **כן** נספר כהפסד — הלקוח לא ענה, וזו תוצאה עסקית', () => {
    expect(NON_LOSS_REJECTION_REASONS).not.toContain('פג תוקף')
  })

  it('אף הצעה לא נסגרה ⇒ שיעור null ולא 0% (0% על מדגם ריק הוא מספר שקרי)', () => {
    expect(deriveQuoteMetrics([quoteRow()], 18).approvalRate).toBeNull()
  })

  it('סיבת-דחייה שאינה-הפסד יוצאת מהמכנה של השיעור', () => {
    const m = deriveQuoteMetrics(MIXED, 18, ['נבחר מתחרה'])
    expect(m.closedCount).toBe(3)
    expect(m.approvalRate).toBe(33.3)
  })

  it('"נפתחה בטעות" מוחרגת **כברירת-מחדל** — הצעה שנפתחה בטעות מעולם לא הוצעה ללקוח', () => {
    const withMistake = [
      ...MIXED,
      quoteRow({ quote_id: 9, quote_status: 'rejected', rejection_reason: 'נפתחה בטעות' }),
    ]
    // בלי ההחרגה היו 5 סגורות ושיעור 20%; איתה — 4 ו-25%, בדיוק כמו לפני הטעות.
    const m = deriveQuoteMetrics(withMistake, 18)
    expect(m.closedCount).toBe(4)
    expect(m.approvalRate).toBe(25)
  })

  it('"נפתחה בטעות" עדיין ניתנת לבחירה ידנית — היא הסיבה, לא תקלה', () => {
    expect(MANUAL_REJECTION_REASONS).toContain('נפתחה בטעות')
  })
})

describe('countRejectionReasons — פילוח הסיבות בלשונית "נדחו"', () => {
  it('סופר רק דחויות, מהשכיח לנדיר', () => {
    const rows = [
      quoteRow({ quote_status: 'rejected', rejection_reason: 'תקציב לקוח' }),
      quoteRow({ quote_status: 'rejected', rejection_reason: 'תקציב לקוח' }),
      quoteRow({ quote_status: 'rejected', rejection_reason: 'פג תוקף' }),
      quoteRow({ quote_status: 'in_progress' }),
      quoteRow({ quote_status: 'approved' }),
    ]
    expect(countRejectionReasons(rows)).toEqual([
      { reason: 'תקציב לקוח', count: 2 },
      { reason: 'פג תוקף', count: 1 },
    ])
  })

  it('אין דחויות ⇒ רשימה ריקה (המסך לא מציג שורת-פילוח ריקה)', () => {
    expect(countRejectionReasons([quoteRow()])).toEqual([])
  })
})

describe('matchesQuoteFilters — סינון צד-לקוח', () => {
  const CTX = { todayIso: '2026-07-29', validityDays: 30, eventWarningDays: 14 }

  it('חיפוש חופשי תופס שם-אירוע וגם שם-לקוח', () => {
    expect(matchesQuoteFilters(quoteRow(), { text: 'כנס' }, CTX)).toBe(true)
    expect(matchesQuoteFilters(quoteRow(), { text: 'מדיטק' }, CTX)).toBe(true)
    expect(matchesQuoteFilters(quoteRow(), { text: 'עירייה' }, CTX)).toBe(false)
  })

  it('חיפוש סלחני לרווחים מיותרים', () => {
    expect(matchesQuoteFilters(quoteRow(), { text: '  כנס לקוחות  ' }, CTX)).toBe(true)
  })

  it('סינון לפי לקוח', () => {
    expect(matchesQuoteFilters(quoteRow(), { customerId: 2 }, CTX)).toBe(true)
    expect(matchesQuoteFilters(quoteRow(), { customerId: 9 }, CTX)).toBe(false)
  })

  it('טווח תאריכי-אירוע — כולל את הקצוות', () => {
    const exact = { eventDateFrom: '2026-08-22', eventDateTo: '2026-08-22' }
    expect(matchesQuoteFilters(quoteRow(), exact, CTX)).toBe(true)
    expect(matchesQuoteFilters(quoteRow(), { eventDateFrom: '2026-08-23' }, CTX)).toBe(false)
    expect(matchesQuoteFilters(quoteRow(), { eventDateTo: '2026-08-21' }, CTX)).toBe(false)
  })

  it('מסנן "פג בקרוב" משאיר רק הצעות בתוך 7 ימים לתפוגה', () => {
    const stale = quoteRow({ updated_at: '2026-07-04T09:00:00.000Z' })
    expect(matchesQuoteFilters(quoteRow(), { expiringSoon: true }, CTX)).toBe(false)
    expect(matchesQuoteFilters(stale, { expiringSoon: true }, CTX)).toBe(true)
  })

  it('"אירועים קרובים" עצמאי מ"פג בקרוב" — הצעה טרייה שהאירוע שלה בעוד 12 יום', () => {
    const row = quoteRow({ estimated_event_date: '2026-08-10' })
    expect(matchesQuoteFilters(row, { eventSoon: true }, CTX)).toBe(true)
    expect(matchesQuoteFilters(row, { expiringSoon: true }, CTX)).toBe(false)
  })

  it('בלי מסננים — הכול עובר', () => {
    expect(matchesQuoteFilters(quoteRow(), {}, CTX)).toBe(true)
  })
})

describe('sortQuotes', () => {
  const CTX = { defaultVatRate: 18 }
  const A = quoteRow({ quote_id: 1, updated_at: '2026-07-20T09:00:00.000Z' })
  const B = quoteRow({ quote_id: 2, updated_at: '2026-07-28T09:00:00.000Z' })
  const C = quoteRow({
    quote_id: 3,
    updated_at: '2026-07-25T09:00:00.000Z',
    manual_discount: 0,
    estimated_event_date: '2026-07-31',
  })

  it('ברירת-המחדל "הקרוב לפוג ראשון" = הישן-שלא-נגעו-בו ראשון', () => {
    expect(sortQuotes([B, C, A], 'expiry', CTX).map((q) => q.quote_id)).toEqual([1, 3, 2])
  })

  it('מיון לפי סכום — מהגבוה לנמוך (C בלי הנחה ידנית ולכן גבוהה יותר)', () => {
    expect(sortQuotes([A, B, C], 'amount', CTX).map((q) => q.quote_id)).toEqual([3, 1, 2])
  })

  it('מיון לפי תאריך-אירוע — הקרוב ראשון', () => {
    expect(sortQuotes([A, B, C], 'eventDate', CTX).map((q) => q.quote_id)).toEqual([3, 1, 2])
  })

  it('אינו משנה את המערך המקורי', () => {
    const input = [B, A]
    sortQuotes(input, 'expiry', CTX)
    expect(input.map((q) => q.quote_id)).toEqual([2, 1])
  })
})

describe('quoteToPdfModel — שורת-DB ⇒ צורת-הקלט של מנוע ה-PDF', () => {
  const PRODUCTS = {
    '04ST': { item_name: 'דיילת סטנדרט' },
    'B-REG-TAG': { item_name: 'תג שם רגיל' },
  }
  const FULL = quoteRow({
    issue_date: '2026-07-29',
    estimated_location: 'אקספו תל אביב',
    estimated_start_time: '18:00:00',
    estimated_end_time: '22:00:00',
    notes: 'כולל הקמה ופירוק',
    customers: {
      company_name: 'מדיטק פתרונות בע"מ',
      company_number: '514789632',
      contact_name: 'רון גל',
      phone: '052-4471180',
    },
    quote_services: [
      { sku: '04ST', qty: 6, closing_unit_price: 500, color: null, notes: '', line_number: 1 },
      {
        sku: 'B-REG-TAG',
        qty: 300,
        closing_unit_price: 5,
        color: 'לבן',
        notes: 'לוגו',
        line_number: 2,
      },
    ],
  })

  it('ממפה לקוח, אירוע ושורות — כולל שם-מוצר מהקטלוג (ה-DB שומר מק"ט בלבד)', () => {
    const model = quoteToPdfModel(FULL, PRODUCTS, 18, 30)
    expect(model.customer).toEqual({
      companyName: 'מדיטק פתרונות בע"מ',
      companyNumber: '514789632',
      contactName: 'רון גל',
      phone: '052-4471180',
    })
    expect(model.event.name).toBe('כנס לקוחות שנתי')
    expect(model.event.startTime).toBe('18:00')
    expect(model.lines[0].itemName).toBe('דיילת סטנדרט')
    expect(model.lines[1]).toMatchObject({ sku: 'B-REG-TAG', qty: 300, unitPrice: 5, color: 'לבן' })
  })

  it('"תוקף ההצעה עד" נגזר מ-updated_at + ימי-התוקף — אותו שעון כמו במסך (F4)', () => {
    expect(quoteToPdfModel(FULL, PRODUCTS, 18, 30).validUntil).toBe('2026-08-28')
  })

  it('מק"ט שאינו בקטלוג ⇒ המק"ט עצמו כשם, ולעולם לא שורה ריקה במסמך ללקוח', () => {
    const orphan = quoteRow({
      quote_services: [{ sku: 'X-GONE', qty: 1, closing_unit_price: 10, line_number: 1 }],
    })
    expect(quoteToPdfModel(orphan, PRODUCTS, 18, 30).lines[0].itemName).toBe('X-GONE')
  })

  it('הצעה מאושרת נושאת את המע"מ הקפוא, לא את החי (§7.51)', () => {
    const approved = quoteRow({ quote_status: 'approved', vat_rate_snapshot: 17 })
    expect(quoteToPdfModel(approved, PRODUCTS, 18, 30).vatRate).toBe(17)
  })

  it('שורות מוגשות לפי line_number, גם אם ה-DB החזיר אותן בסדר אחר', () => {
    const shuffled = quoteRow({
      quote_services: [
        { sku: 'B-REG-TAG', qty: 300, closing_unit_price: 5, line_number: 2 },
        { sku: '04ST', qty: 6, closing_unit_price: 500, line_number: 1 },
      ],
    })
    expect(quoteToPdfModel(shuffled, PRODUCTS, 18, 30).lines.map((l) => l.sku)).toEqual([
      '04ST',
      'B-REG-TAG',
    ])
  })
})

describe('MANUAL_REJECTION_REASONS — מה שמוצע בחלון הדחייה', () => {
  it('כולן תת-קבוצה של 7 הסיבות שה-DB מכיר', () => {
    MANUAL_REJECTION_REASONS.forEach((reason) => expect(REJECTION_REASONS).toContain(reason))
  })

  it('"פג תוקף" אינו נבחר ידנית — עבודת-הרקע היומית כותבת אותו (§7.41)', () => {
    expect(MANUAL_REJECTION_REASONS).not.toContain('פג תוקף')
    expect(REJECTION_REASONS).toContain('פג תוקף')
  })
})
