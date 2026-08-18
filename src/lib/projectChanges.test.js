import { describe, it, expect } from 'vitest'
import {
  computeDeltaQty,
  lineChangeAmount,
  computeScopeChangeMoney,
  hoursUntilEvent,
  businessDaysUntil,
  isLateChange,
  lateChangeBanner,
  tierCrossingNotice,
} from './projectChanges'

// מדרגות-המחיר האמיתיות של B-REG-TAG (מיגרציה 20260723112000, אותו נתון כמו pricing.test.js) —
// לא מומצאות, כדי שהתגלית "300→380 = אותה מדרגה, 420 = מדרגה זולה יותר" תישאר תקפה גם אם
// המחירון ישתנה, לא רק היום.
const B_REG_TAG_TIERS = [
  { sku: 'B-REG-TAG', min_qty: 1, max_qty: 50, special_price: 6.0 },
  { sku: 'B-REG-TAG', min_qty: 51, max_qty: 200, special_price: 5.5 },
  { sku: 'B-REG-TAG', min_qty: 201, max_qty: 400, special_price: 5.0 },
  { sku: 'B-REG-TAG', min_qty: 401, max_qty: 1000, special_price: 4.5 },
  { sku: 'B-REG-TAG', min_qty: 1001, max_qty: null, special_price: 4.0 },
]
const TAG = { sku: 'B-REG-TAG', base_price: 6.0 }

describe('computeDeltaQty — הפער בין הכמות המתוכננת ליעד (as-built ①: היעד, לא הפער, נשלח לשרת)', () => {
  it('תוספת ⇒ חיובי, הפחתה ⇒ שלילי', () => {
    expect(computeDeltaQty(6, 8)).toBe(2)
    expect(computeDeltaQty(300, 380)).toBe(80)
    expect(computeDeltaQty(8, 6)).toBe(-2)
  })

  it('אין שינוי ⇒ 0 — as-built ⑤: מתקבל אך לא כותב כלום', () => {
    expect(computeDeltaQty(6, 6)).toBe(0)
  })

  it('קלט לא-מספרי ⇒ null, לא NaN שקט', () => {
    expect(computeDeltaQty(null, 8)).toBeNull()
    expect(computeDeltaQty(6, undefined)).toBeNull()
  })
})

describe('lineChangeAmount — סכום-שורה, תואם ל-revenue_delta של השרת (as-built ③: round(delta_qty × unit_price_snapshot, 2))', () => {
  it('שורת הדיילות מהדוגמה המאושרת: 6→8 ב-500.00 ₪ ⇐ 1,000.00 ₪', () => {
    expect(lineChangeAmount(2, 500)).toBe(1000)
  })

  it('שורת התגים מהדוגמה המאושרת: 300→380 ב-5.00 ₪ ⇐ 400.00 ₪', () => {
    expect(lineChangeAmount(80, 5)).toBe(400)
  })

  it('🔴 הפחתה נותנת סכום שלילי — היא נכנסת לחישוב, ולא מסוננת', () => {
    expect(lineChangeAmount(-2, 500)).toBe(-1000)
  })

  it('אגורות מדויקות — לא float דולף (0.1+0.2 אינו 0.3)', () => {
    expect(lineChangeAmount(3, 5.05)).toBe(15.15)
  })
})

describe('computeScopeChangeMoney — סדר-הכסף וחשבון-האגורות של pricing.js:106-132, על סכום שיכול להיות שלילי', () => {
  // 🔴 עוגן-הקבלה של הצעד: 6→8 דיילות ב-500.00 ₪ + 300→380 תגים ב-5.00 ₪.
  it('דוגמת-הקבלה המדויקת: 1,400.00 → −210.00 (15%) → 1,190.00 → 214.20 (18%) → 1,404.20 ₪', () => {
    const lines = [
      { deltaQty: 2, unitPriceSnapshot: 500 },
      { deltaQty: 80, unitPriceSnapshot: 5 },
    ]
    const money = computeScopeChangeMoney(lines, 5, 10, 18)
    expect(money.changeAmount).toBe(1400)
    expect(money.discountPercent).toBe(15)
    expect(money.discountAmount).toBe(210)
    expect(money.preVat).toBe(1190)
    expect(money.vatAmount).toBe(214.2)
    expect(money.total).toBe(1404.2)
  })

  // 🔴 F7/§7.26: ההנחות מתחברות (5%+10%=15%) ולא משורשרות (12,700=6300 - 14.5%... ). מימוש
  // ששרשר את שתי ההנחות במקום לחבר אותן היה נותן כאן מספר אחר.
  it('🔴 הנחות מתחברות ולא משורשרות — שרשור היה נותן תוצאה אחרת', () => {
    const lines = [{ deltaQty: 1, unitPriceSnapshot: 6300 }]
    const additive = computeScopeChangeMoney(lines, 5, 10, 0)
    // חיבורי: 6300 × 0.85 = 5355. שרשורי: 6300 × 0.95 × 0.90 = 5386.5 — הפרש של 31.50 ₪.
    expect(additive.preVat).toBe(5355)
    expect(additive.preVat).not.toBe(5386.5)
  })

  it('🔴 הפחתה (delta שלילי) מפחיתה גם את ההנחה וגם את המע"מ באותו יחס — לא מסוננת מהסכום', () => {
    const lines = [{ deltaQty: -2, unitPriceSnapshot: 500 }]
    const money = computeScopeChangeMoney(lines, 5, 10, 18)
    expect(money.changeAmount).toBe(-1000)
    expect(money.discountAmount).toBe(-150)
    expect(money.preVat).toBe(-850)
    expect(money.vatAmount).toBe(-153)
    expect(money.total).toBe(-1003)
  })

  it('בלי הנחה ובלי מע"מ ⇒ הכול שווה לסכום השינוי', () => {
    const lines = [{ deltaQty: 10, unitPriceSnapshot: 100 }]
    const money = computeScopeChangeMoney(lines, 0, 0, 0)
    expect(money.changeAmount).toBe(1000)
    expect(money.discountAmount).toBe(0)
    expect(money.preVat).toBe(1000)
    expect(money.vatAmount).toBe(0)
    expect(money.total).toBe(1000)
  })

  it('רשימת-שורות ריקה ⇒ הכול אפס, לא שגיאה', () => {
    expect(computeScopeChangeMoney([], 5, 10, 18)).toEqual({
      changeAmount: 0,
      discountPercent: 15,
      discountAmount: 0,
      preVat: 0,
      vatPercent: 18,
      vatAmount: 0,
      total: 0,
    })
  })
})

describe('hoursUntilEvent — עוגן זהה לשרת: תאריך-אירוע + שעת-התחלה, Asia/Jerusalem, floor (as-built ①)', () => {
  // 🔴 השחזור המדויק של הדוגמה המאושרת מ-⑯: "שינוי 18 שעות לפני האירוע". 18:00 בישראל
  // ב-22/08/2026 (שעון-קיץ, UTC+3) הוא 15:00 UTC; "עכשיו" נבחר 18 שעות לפניו בדיוק.
  it('22/08/2026 18:00 (ישראל) פחות 18 שעות מ"עכשיו" ⇐ 18', () => {
    const now = new Date('2026-08-21T21:00:00.000Z') // = 22/08/2026 00:00 בישראל
    expect(hoursUntilEvent('2026-08-22', '18:00:00', now)).toBe(18)
  })

  it('רגע האירוע עצמו ⇐ 0, ולא NaN/שלילי-מזערי מ-float', () => {
    const now = new Date('2026-08-22T15:00:00.000Z') // = 22/08/2026 18:00 בישראל, בדיוק
    expect(hoursUntilEvent('2026-08-22', '18:00:00', now)).toBe(0)
  })

  it('האירוע כבר עבר ⇐ מספר שלילי (floor, לא round)', () => {
    const now = new Date('2026-08-22T16:30:00.000Z') // שעה וחצי אחרי 18:00 בישראל
    expect(hoursUntilEvent('2026-08-22', '18:00:00', now)).toBe(-2)
  })

  it('אין שעת-התחלה ⇒ נופל לחצות (00:00), כמו ב-COALESCE של השרת', () => {
    const now = new Date('2026-08-21T21:00:00.000Z')
    // חצות 22/08 בישראל = 21:00 UTC של 21/08 — כלומר "עכשיו" הוא בדיוק רגע-האירוע.
    expect(hoursUntilEvent('2026-08-22', null, now)).toBe(0)
  })
})

describe('businessDaysUntil — ימי-עסקים בישראל (א׳-ה׳), לא הפרש-לוח נאיבי', () => {
  // 🔴 העוגן שהצעד דורש: גבול רביעי→ראשון, שבו חיסור נאיבי טועה בדיוק בשתיים.
  // 19/08/2026 רביעי → 23/08/2026 ראשון: הפרש-לוח נאיבי = 4 ימים. ימי-העסקים בפועל:
  // חמישי (20/08) וראשון (23/08) בלבד — שישי-שבת (21–22/08) אינם נספרים ⇐ 2, לא 4.
  it('רביעי→ראשון: 2 ימי-עסקים, לא 4 (ההפרש הנאיבי)', () => {
    expect(businessDaysUntil('2026-08-19', '2026-08-23')).toBe(2)
  })

  it('חמישי→ראשון הבא (חוצה סופ"ש מלא): רק ראשון נספר', () => {
    expect(businessDaysUntil('2026-08-20', '2026-08-23')).toBe(1)
  })

  it('אותו יום ⇒ 0 ימי-עסקים עד האירוע', () => {
    expect(businessDaysUntil('2026-08-22', '2026-08-22')).toBe(0)
  })

  it('יום ראשון עד יום שלישי הסמוך (יומיים, שני ומהם ימי-חול) ⇐ 2', () => {
    expect(businessDaysUntil('2026-08-16', '2026-08-18')).toBe(2)
  })
})

describe('isLateChange — מותנה: כמות-דיילות מתחת ל-24 שעות, לוגיסטיקה מתחת ל-3 ימי-עסקים, הפחתה — לעולם לא (as-built)', () => {
  const eventDate = '2026-08-22'
  const startTime = '18:00:00'

  it('תוספת-דיילות פחות מ-24 שעות לפני האירוע ⇒ מסומן', () => {
    const now = new Date('2026-08-21T21:00:00.000Z') // 18 שעות לפני
    expect(isLateChange({ target: 'hostess_count', deltaQty: 2 }, eventDate, startTime, now)).toBe(
      true,
    )
  })

  it('תוספת-דיילות 45 יום לפני האירוע ⇒ לא מסומן (התרחיש שישי תיקן, 14/08 סעיף ד)', () => {
    const now = new Date('2026-07-08T21:00:00.000Z')
    expect(isLateChange({ target: 'hostess_count', deltaQty: 2 }, eventDate, startTime, now)).toBe(
      false,
    )
  })

  it('🔴 הפחתת-דיילות (delta שלילי) לעולם אינה מסומנת, גם 18 שעות לפני', () => {
    const now = new Date('2026-08-21T21:00:00.000Z')
    expect(isLateChange({ target: 'hostess_count', deltaQty: -2 }, eventDate, startTime, now)).toBe(
      false,
    )
  })

  it('תוספת-לוגיסטיקה (תגים) פחות מ-3 ימי-עסקים ⇒ מסומן, גם אם החישוב הנאיבי (4 ימים) היה אומר "לא"', () => {
    // רביעי 19/08 → אירוע ראשון 23/08: 2 ימי-עסקים בפועל (מתחת ל-3).
    const now = new Date('2026-08-19T08:00:00.000Z')
    expect(isLateChange({ target: 'logistics', deltaQty: 80 }, '2026-08-23', startTime, now)).toBe(
      true,
    )
  })

  it('תוספת-לוגיסטיקה 3 ימי-עסקים או יותר ⇒ לא מסומן', () => {
    // ראשון 16/08 → אירוע שבוע הבא, רחוק בהרבה מ-3 ימי-עסקים.
    const now = new Date('2026-08-16T08:00:00.000Z')
    expect(isLateChange({ target: 'logistics', deltaQty: 80 }, '2026-08-22', startTime, now)).toBe(
      false,
    )
  })

  it('הפחתת-לוגיסטיקה לעולם אינה מסומנת', () => {
    const now = new Date('2026-08-19T08:00:00.000Z')
    expect(isLateChange({ target: 'logistics', deltaQty: -80 }, '2026-08-23', startTime, now)).toBe(
      false,
    )
  })

  it('delta_qty=0 (אין שינוי אמיתי) ⇒ לא מסומן', () => {
    const now = new Date('2026-08-21T21:00:00.000Z')
    expect(isLateChange({ target: 'hostess_count', deltaQty: 0 }, eventDate, startTime, now)).toBe(
      false,
    )
  })
})

describe('lateChangeBanner — הנוסח המאושר מילה-במילה (⑯), עם מספר-השעות המדויק', () => {
  it('משכפל בדיוק את "שינוי 18 שעות לפני האירוע" ושתי המשפטים הקבועים', () => {
    expect(lateChangeBanner(18)).toBe(
      '⚠ שינוי 18 שעות לפני האירוע. ' +
        'דיילת נוספת כמעט אינה ניתנת לגיוס בטווח כזה, ותגים מודפסים דורשים ימים. ' +
        'הרימי טלפון — אל תסתמכי על מייל.',
    )
  })

  it('🔴 לא "1,080 שעות" — התרחיש שהניסוח הקבוע-תמיד היה מפיק לפני שהותנה', () => {
    expect(lateChangeBanner(1080)).toContain('⚠ שינוי 1080 שעות לפני האירוע.')
  })
})

describe('tierCrossingNotice — הודעת-מדרגה (③ↄ), בלי סכום ₪ בטקסט', () => {
  it('🔴 עוגן מהצעד עצמו: 420 יחידות נכנסות למדרגה זולה יותר (300→420 מדלג דרך 380, נבדק גם ישירות)', () => {
    expect(tierCrossingNotice(TAG, B_REG_TAG_TIERS, 380, 420)).toBe(
      '420 יחידות נכנסות בקטלוג למדרגת מחיר זולה יותר. ' +
        'התוספת מחויבת לפי המחיר שאושר בהצעה — לא לפי מחיר הקטלוג של היום.',
    )
  })

  it('300→380: אותה מדרגה (201–400) ⇒ אין הודעה', () => {
    expect(tierCrossingNotice(TAG, B_REG_TAG_TIERS, 300, 380)).toBeNull()
  })

  it('🚫 אין ₪ בטקסט ההודעה', () => {
    const notice = tierCrossingNotice(TAG, B_REG_TAG_TIERS, 380, 420)
    expect(notice).not.toContain('₪')
  })

  it('הפחתה שיוצאת ממדרגה זולה למדרגה יקרה יותר ⇒ אין הודעה (ההודעה רק על מדרגה זולה יותר)', () => {
    expect(tierCrossingNotice(TAG, B_REG_TAG_TIERS, 420, 380)).toBeNull()
  })
})
