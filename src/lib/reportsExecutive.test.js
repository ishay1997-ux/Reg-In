// האורקל של לשונית "הנהלה" — נכתב **לפני** ה-SQL, מתוך ההגדרות והמדידות הכתובות.
//
// 🔴 **למה הקובץ הזה קודם לקוד, ולמה זה לא טקס:** ‏`spec.md §🔢` פותח ב*"חושב ביד מההגדרה,
// לפני שקיים קוד — ואסור לגזור אותו מבדיקה שהבנייה תכתוב לעצמה"*. כל ציפייה כאן באה
// מאחד משלושה מקורות **חיצוניים לסשן הזה**, והמקור נקוב בשורה שמעליה:
//   · `stage2-review/signoff-baseline-2026-09-10.md` — מדידה עצמאית ב-SQL חי, 10/09/2026
//   · `stage2-cards/cards-management.md` §③ — ההגדרה פר-מספר, עם השאילתה שהפיקה אותו
//   · `processes-approved.md` §🗳️39 · §📑#2 · §📑#10 · §7.82 — ההכרעות עצמן
//
// 🔑 **ומה זה אומר מעשית:** ארבע פונקציות-השרת במיגרציה `*_module11_d_rpcs_executive.sql`
// מחשבות את אותם מדדים ב-SQL (המספרים חייבים להגיע גמורים מהשרת, מאחורי
// `assert_module_permission`). **כשה-SQL וקובץ זה נחלקים — ה-SQL הוא החשוד.**

import { describe, expect, it } from 'vitest'

import { deriveQuoteMetrics } from './quotes'
import {
  DISCOUNT_TIERS,
  RATIO_HISTOGRAM_BUCKETS,
  aboveRatioCount,
  buildRatioHistogram,
  compareDirection,
  costPerHour,
  discountTierOf,
  growthPercent,
  guestsPerHostess,
  marginPerHour,
  marginPercent,
  overEstimateCount,
  pointsGap,
  pricePerHour,
  summariseDiscountTiers,
  totalDiscountOf,
} from './reportsExecutive'
import { medianOf } from './reportsHostesses'

describe('מדרגי-הנחה (הכרעה 39)', () => {
  it('ארבעה מדרגים, בסדר הקבוע `0 · 1–5 · 6–10 · 10+`', () => {
    expect(DISCOUNT_TIERS.map((t) => t.key)).toEqual(['0', '1-5', '6-10', '10+'])
  })

  // גבולות-הדלי, מילה-במילה מהשאילתה ב-`cards-management.md` §③ מ4:
  // `when d=0 then '0' when d<=5 then '1-5' when d<=10 then '6-10' else '10+'`
  it('הגבול העליון שייך לדלי התחתון — 5 הוא `1-5`, 10 הוא `6-10`', () => {
    expect(discountTierOf(0)).toBe('0')
    expect(discountTierOf(1)).toBe('1-5')
    expect(discountTierOf(5)).toBe('1-5')
    expect(discountTierOf(5.5)).toBe('6-10')
    expect(discountTierOf(10)).toBe('6-10')
    expect(discountTierOf(10.01)).toBe('10+')
    expect(discountTierOf(22)).toBe('10+')
  })

  // `cards-management.md` ⑦ מ4: "‏`null` נספר כ-0 דרך `coalesce`" ⇒ הצעה בלי הנחה היא
  // מדרג `0`, **ואינה מוצאת מהדוח**.
  it('הנחה חסרה היא אפס ולא היעדרות — שני השדות יחד', () => {
    expect(totalDiscountOf(null, null)).toBe(0)
    expect(totalDiscountOf(3, null)).toBe(3)
    expect(totalDiscountOf(null, 7)).toBe(7)
    expect(totalDiscountOf(3, 7)).toBe(10)
    expect(discountTierOf(totalDiscountOf(null, null))).toBe('0')
  })

  it('ערך שאינו מספר אינו נופל למדרג — `null`, לא `0`', () => {
    expect(discountTierOf(null)).toBeNull()
    expect(discountTierOf('')).toBeNull()
    expect(discountTierOf(Number.NaN)).toBeNull()
  })

  // מקרה מחושב-ביד: שני אירועים במדרג 0 ואחד במדרג 10+.
  it('סיכום-מדרגים מחזיר ארבעה דליים בסדר קבוע, גם כשדלי ריק', () => {
    const rows = [
      { discount: 0, revenue: 1000, grossProfit: 600 },
      { discount: 0, revenue: 1000, grossProfit: 500 },
      { discount: 12, revenue: 500, grossProfit: 200 },
    ]
    const tiers = summariseDiscountTiers(rows)

    expect(tiers.map((t) => t.tier)).toEqual(['0', '1-5', '6-10', '10+'])
    expect(tiers[0]).toMatchObject({ eventCount: 2, revenue: 2000, profit: 1100 })
    expect(tiers[0].marginPercent).toBeCloseTo(55, 6)
    // דלי ריק אינו 0% שוליים — הוא "לא נמדד" (📐12 · תריס-המדגם).
    expect(tiers[1]).toMatchObject({ eventCount: 0, revenue: 0, profit: 0, marginPercent: null })
    expect(tiers[3].marginPercent).toBeCloseTo(40, 6)
  })

  // signoff-baseline: 0% ⇒ 57.8 · 10%+ ⇒ 50.6 ⇒ הפרש 7.2 נקודות (‏`cards-management.md` §③ מ4).
  it('הפרש בין הקצוות הוא נקודות-אחוז, לא יחס', () => {
    expect(pointsGap(57.8, 50.6)).toBeCloseTo(7.2, 6)
    expect(pointsGap(56.6, 47.8)).toBeCloseTo(8.8, 6)
    expect(pointsGap(null, 50.6)).toBeNull()
  })
})

describe('שיעור-אישור הצעות (§7.82) — האורקל הוא `deriveQuoteMetrics` הקיימת, לא עותק שני', () => {
  // 🔑 כלל-ברזל 14: ההגדרה חיה כבר ב-`src/lib/quotes.js` ומשרתת את מסך-ההצעות.
  // מ4 מציג **את אותו מספר**, ולכן הבדיקה כאן נועלת את ההגדרה שה-SQL חייב להיות תאומה שלה.
  const decided = (approved, lost, mistakes) => [
    ...Array.from({ length: approved }, () => ({ quote_status: 'approved' })),
    ...Array.from({ length: lost }, () => ({
      quote_status: 'rejected',
      rejection_reason: 'המחיר גבוה מדי',
    })),
    ...Array.from({ length: mistakes }, () => ({
      quote_status: 'rejected',
      rejection_reason: 'נפתחה בטעות',
    })),
  ]

  // signoff-baseline: 253 אושרו · 102 נדחו-בהפסד ⇒ 71.3%. המדידה החיה 16/09/2026 אישרה
  // 253/102 ל-2026 ו-204/73 ל-2025, וכן `נפתחה בטעות` = 15 הצעות בכל ההיסטוריה.
  it('המכנה מחריג `נפתחה בטעות` — 253/(253+102) ⇒ 71.3%', () => {
    expect(deriveQuoteMetrics(decided(253, 102, 15), null).approvalRate).toBe(71.3)
  })

  it('אותו חישוב לפני שנה — 204/(204+73) ⇒ 73.6%', () => {
    expect(deriveQuoteMetrics(decided(204, 73, 9), null).approvalRate).toBe(73.6)
  })

  it('אין הצעות שהוכרעו ⇒ `null` ולא 0% — מדגם ריק אינו כישלון', () => {
    expect(deriveQuoteMetrics(decided(0, 0, 4), null).approvalRate).toBeNull()
  })
})

describe('שולי-רווח והשוואה לתקופה קודמת (📐1 · 📐15)', () => {
  // signoff-baseline מ2: 1,121,026 ₪ רווח מתוך 1,922,441 ₪ ⇒ 58.3%.
  it('שוליים = סך הרווח חלקי סך ההכנסה, לא ממוצע של אחוזים', () => {
    expect(marginPercent(1121026, 1922441)).toBeCloseTo(58.31, 2)
    expect(marginPercent(774665, 1385815)).toBeCloseTo(55.9, 1)
    expect(marginPercent(892706, 1625647)).toBeCloseTo(54.9, 1)
  })

  it('הכנסה אפס או חסרה ⇒ `null`, לעולם לא 0% ולא חלוקה-באפס', () => {
    expect(marginPercent(100, 0)).toBeNull()
    expect(marginPercent(100, null)).toBeNull()
    expect(marginPercent(null, 100)).toBeNull()
  })

  // signoff-baseline מ2: 1,922,441 מול 1,385,815 באותו טווח אשתקד ⇒ ‏+38.7%.
  // 🔴 **והספרה השנייה כאן היא ממצא, לא בחירה:** ‏`cards-management.md` §③ מ2 רושם את
  // הבדיקה כ-`1,922,441/1,385,815−1 = 38.71%`. החישוב מחזיר **38.7228%** ⇒ `38.72`,
  // לא `38.71`. **שתיהן מרנדרות `38.7%` תחת 📐4, ולכן שום מספר על המסך אינו שגוי** —
  // אבל ספרת-האימות שבכרטיס כן. **מדווח, לא מתוקן בכרטיס** (C7 · כלל-ברזל 1).
  it('גידול-מול-אשתקד מחושב על אותו טווח-ימים, ומחזיר אחוז', () => {
    expect(growthPercent(1922441, 1385815)).toBeCloseTo(38.72, 2)
    expect(growthPercent(298.8, 253.7)).toBeCloseTo(17.78, 2)
    expect(growthPercent(47.4, 44.2)).toBeCloseTo(7.24, 2)
  })

  // 📐1: *"— מותר רק כשאין שינוי, לא כשלא נמדד"* ⇒ היעדר בסיס חייב להיות `null` מובחן.
  it('אין בסיס-השוואה ⇒ `null`; בסיס אפס אינו "גידול אינסופי"', () => {
    expect(growthPercent(100, 0)).toBeNull()
    expect(growthPercent(100, null)).toBeNull()
  })

  it('כיוון-החץ נגזר מהמספרים ולא נכתב ביד', () => {
    expect(compareDirection(1922441, 1385815)).toBe('up')
    expect(compareDirection(40.8, 41.0)).toBe('down')
    expect(compareDirection(50, 50)).toBe('flat')
    expect(compareDirection(50, null)).toBeNull()
  })
})

describe('מחיר לשעה מול עלות לשעה (📑#1 · הכרעה 24 · ח6)', () => {
  // ‏`cards-management.md` §③ מ3 + ⑧ G6 + signoff-baseline: המונה של העלות הוא
  // **שכר-בסיס + בונוסים אישיים**, ו**נסיעות אינן נכללות** — זו ההגדרה היחידה מארבע
  // שמשחזרת את 44.2 / 45.9 / 47.4. המכנה: שעות-בפועל > 0 בלבד.
  it('2026 — 1,922,441 ₪ ÷ 6,433.5 שעות ⇒ 298.8 ₪ לשעה', () => {
    expect(pricePerHour(1922441, 6433.5)).toBeCloseTo(298.82, 2)
    expect(pricePerHour(1625647, 6408.5)).toBeCloseTo(253.67, 2)
    expect(pricePerHour(2245400, 8643.5)).toBeCloseTo(259.78, 2)
  })

  it('2026 — (284,184 שכר + 20,587 בונוסים) ÷ אותן שעות ⇒ 47.4 ₪ לשעה', () => {
    expect(costPerHour(284184, 20587, 6433.5)).toBeCloseTo(47.37, 2)
    expect(costPerHour(262687, 20521, 6408.5)).toBeCloseTo(44.19, 2)
    expect(costPerHour(370277, 26419, 8643.5)).toBeCloseTo(45.895, 2)
  })

  // ⑧ G6 — הנסיעות מחוץ למונה בכוונה: הן סכום קבוע למשמרת ולא תשלום לפי שעה.
  it('הנסיעות אינן במונה — הוספתן הייתה משנה את המספר', () => {
    expect(costPerHour(284184, 20587, 6433.5)).not.toBeCloseTo((284184 + 20587 + 25244) / 6433.5, 2)
  })

  it('מרווח לשעה = מחיר פחות עלות', () => {
    expect(marginPerHour(298.8, 47.4)).toBeCloseTo(251.4, 6)
    expect(marginPerHour(298.8, null)).toBeNull()
  })

  // ‏`cards-management.md` ⑦ מ3: מכנה 0 ⇒ *"לא נמדד — אין שעות מדווחות בשנה"*, לא 0 ₪.
  it('שנה בלי שעות מדווחות ⇒ `null`, לא אפס ולא חלוקה-באפס', () => {
    expect(pricePerHour(100000, 0)).toBeNull()
    expect(pricePerHour(100000, null)).toBeNull()
    expect(costPerHour(1000, 100, 0)).toBeNull()
  })
})

describe('קהל מול צוות (📑#10 · 📑ב#10)', () => {
  // 🔴 השורה ששגתה בקו-הבסיס ותוקנה: המכנה הוא **דיילות מאושרות-סופית**, לא
  // `required_hostess_count` (התכנון). ‏`signoff-baseline` §לפני-הטבלה, שורה 5.
  it('יחס = אורחים-בפועל חלקי דיילות מאושרות-סופית', () => {
    expect(guestsPerHostess(100, 1)).toBeCloseTo(100, 6)
    expect(guestsPerHostess(556, 11)).toBeCloseTo(50.55, 2)
  })

  // ‏`cards-management.md` ④ מ6 (ב): אירוע בלי דיילת מאושרת-סופית מוחרג דרך `nullif`,
  // **ואינו נספר כיחס אינסופי**.
  it('אפס דיילות ⇒ `null` ולא אינסוף', () => {
    expect(guestsPerHostess(100, 0)).toBeNull()
    expect(guestsPerHostess(100, null)).toBeNull()
    expect(guestsPerHostess(null, 5)).toBeNull()
  })

  // ‏`cards-management.md` §③ מ6: *"חד-משמעית «מעל», לא «מ-50 ומעלה»"*.
  it('"מעל 50" הוא חמור — 50 בדיוק אינו נספר', () => {
    expect(aboveRatioCount([49.9, 50, 50.1, 100], 50)).toBe(2)
    expect(aboveRatioCount([50, 50, 50], 50)).toBe(0)
    expect(aboveRatioCount([40, null, 60], 50)).toBe(1)
  })

  // *"אירועים מעל הצפי"* = `actual > estimated`, חמור, ורק כששני המספרים קיימים.
  it('"מעל הצפי" סופר רק אירועים שיש בהם שני המספרים', () => {
    const rows = [
      { estimatedGuests: 50, actualGuests: 100 },
      { estimatedGuests: 50, actualGuests: 50 },
      { estimatedGuests: 50, actualGuests: 49 },
      { estimatedGuests: null, actualGuests: 80 },
      { estimatedGuests: 50, actualGuests: null },
    ]
    expect(overEstimateCount(rows)).toBe(1)
  })

  // החציון — ולא הממוצע — הוא מה שמגן על האריח מפני אירוע #12 (50 הוערכו · 100 הגיעו ·
  // דיילת אחת ⇒ יחס 100). ‏`cards-management.md` ④ מ6 (ד).
  it('החציון מוגן מפני החריג; הממוצע אינו', () => {
    const ratios = [38, 40, 41, 42, 100]
    expect(medianOf(ratios)).toBe(41)
    expect(medianOf([1, 2, 3, 4])).toBe(2.5)
  })
})

describe('היסטוגרמת-היחס — שמונה דליים ברוחב 5, עם זנבות מקובצים', () => {
  // 🔑 **ההגדרה נגזרה ממדידה ולא מהעין:** הסדרה שבמוקאפ המאושר היא
  // ‏`32 · 39 · 70 · 171 · 224 · 148 · 28 · 5`, והמדידה החיה (16/09/2026, חלון עד 10/09)
  // מחזירה דליי-`floor(r/5)*5` של ‏15:5 · 20:27 · 25:39 · 30:70 · 35:171 · 40:224 ·
  // 45:148 · 50:28 · 55:3 · 60:1 · 100:1. ⇒ **הדלי הראשון הוא "מתחת ל-25" (5+27=32)
  // והאחרון "55 ומעלה" (3+1+1=5)**, וששת האמצעיים זהים אחד-לאחד.
  it('שמונה דליים, בסדר קבוע', () => {
    expect(RATIO_HISTOGRAM_BUCKETS.map((b) => b.key)).toEqual([
      'lt25',
      '25-30',
      '30-35',
      '35-40',
      '40-45',
      '45-50',
      '50-55',
      '55plus',
    ])
  })

  it('הגבול התחתון שייך לדלי והעליון אינו — `min ≤ v < max`', () => {
    const values = [17, 24.9, 25, 29.9, 30, 49.9, 50, 54.9, 55, 100]
    expect(buildRatioHistogram(values).map((b) => b.count)).toEqual([2, 2, 1, 0, 0, 1, 2, 2])
  })

  it('ערך חסר אינו דלי — הוא יוצא מהספירה ולא נופל ל"מתחת ל-25"', () => {
    expect(buildRatioHistogram([null, undefined, Number.NaN, 42]).map((b) => b.count)).toEqual([
      0, 0, 0, 0, 1, 0, 0, 0,
    ])
  })

  it('סך הדליים שווה למספר הערכים התקפים — אין ערך שנופל בין הדליים', () => {
    const values = [5, 25, 35, 45, 55, 65, 75]
    const total = buildRatioHistogram(values).reduce((sum, b) => sum + b.count, 0)
    expect(total).toBe(values.length)
  })
})
