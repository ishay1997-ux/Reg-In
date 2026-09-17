// בדיקות מסנן-התקופה — **פונקציות טהורות, ולכן "היום" הוא פרמטר קבוע בבדיקה.**
//
// 🔴 **למה הקובץ נולד דווקא עכשיו (16/09/2026):** עד היום `periodRange` נבדק רק בעקיפין,
// דרך `ReportsPage.test.jsx`, ששולט ב"היום" דרך תשובת-ה-RPC הממוקמת. זה הספיק לשלוש
// התקופות הקלנדריות — ולא מספיק ל**חלון המתגלגל**, שכל הנקודה בו היא **חשבון-תאריכים**
// ‏(⁦12⁩ חודשים אחורה, כולל ⁦29⁩ בפברואר). חשבון שנבדק רק דרך מסך הוא חשבון שאיש לא מדד.

import { describe, it, expect } from 'vitest'
import { DEFAULT_PERIOD, PERIOD_OPTIONS, parsePeriodParam, periodRange } from './reportsPeriod'

// 🌱 "היום" של יום-הבנייה, כפי שהשרת מחזיר אותו ב-`window.to` (C8).
const TODAY = '2026-09-16'

describe('periodRange — תקופות קלנדריות (סגורות משני הקצוות)', () => {
  it('החודש ⇒ מה-1 בחודש ועד היום', () => {
    expect(periodRange('month', TODAY)).toEqual({ from: '2026-09-01', to: TODAY })
  })

  it('השנה ⇒ מה-1 בינואר ועד היום', () => {
    expect(periodRange('year', TODAY)).toEqual({ from: '2026-01-01', to: TODAY })
  })

  it('3 חודשים ⇒ 90 יום אחורה', () => {
    expect(periodRange('90d', TODAY)).toEqual({ from: '2026-06-18', to: TODAY })
  })

  // 🔴 "הכול" **אינו** טווח רחב — הוא היעדר טווח, וה-RPC בוחר את חלון-ברירת-המחדל של הכרטיס.
  it('הכול ⇒ שני הקצוות null', () => {
    expect(periodRange('all', TODAY)).toEqual({ from: null, to: null })
  })

  // ⚠️ "היום" שעדיין לא חזר מהשרת אינו שגיאה — הטעינה הראשונה שולחת null בשני הקצוות.
  it('בלי "היום" ⇒ null, בלי ליפול ובלי new Date()', () => {
    expect(periodRange('year', null)).toEqual({ from: null, to: null })
    expect(periodRange('year', '16/09/2026')).toEqual({ from: null, to: null })
  })
})

// ── ✏️ 12 חודשים מתגלגלים — הכרעת-ישי 16/09/2026 17:4X (כרטיס ⑧H2) ──────────
//
// 🔴 **הפער שהיא סוגרת:** כרטיסי-הדיילות מוגדרים על `(10/09/2025, 10/09/2026]` — חלון
// מתגלגל — בעוד הלשונית נפתחה על שנה קלנדרית. שתי אוכלוסיות שונות, בלי שאף שער יראה זאת.
describe('periodRange — 12 חודשים מתגלגלים (§9 D-17: חלון חצי-פתוח)', () => {
  it('אותו יום-בחודש, שנה אחורה — ולא ה-1 בינואר', () => {
    expect(periodRange('12m', TODAY)).toEqual({ from: '2025-09-16', to: TODAY })
    // 🔑 ההבדל מ"השנה" הוא **האוכלוסייה**, ולכן הוא נמדד ולא מונח.
    expect(periodRange('12m', TODAY).from).not.toBe(periodRange('year', TODAY).from)
  })

  it('הצורה היא בדיוק זו של הכרטיס: (היום−12ח, היום]', () => {
    expect(periodRange('12m', '2026-09-10')).toEqual({ from: '2025-09-10', to: '2026-09-10' })
  })

  // ⚠️ `2024-02-29` פחות שנה הוא תאריך שאינו קיים — Date.UTC מנרמל במקום לייצר מחרוזת פסולה.
  it('29 בפברואר מנורמל ואינו מייצר תאריך שאינו קיים', () => {
    const { from } = periodRange('12m', '2024-02-29')
    expect(from).toBe('2023-03-01')
    expect(Number.isNaN(Date.parse(from))).toBe(false)
  })

  it('הגלולה קיימת בבורר, בתווית של ההכרעה', () => {
    expect(PERIOD_OPTIONS.find((o) => o.key === '12m')?.label).toBe('12 חודשים')
  })
})

describe('parsePeriodParam — הכתובת גוברת, והלשונית קובעת כשאין כתובת', () => {
  it('ערך מוכר בכתובת מוחזר כמות-שהוא', () => {
    expect(parsePeriodParam('month')).toBe('month')
    expect(parsePeriodParam('12m')).toBe('12m')
  })

  // S-18 — כתובת פגומה אינה מפילה מסך.
  it('ערך לא-מוכר או חסר ⇒ ברירת-המחדל', () => {
    expect(parsePeriodParam('לא-קיים')).toBe(DEFAULT_PERIOD)
    expect(parsePeriodParam(null)).toBe(DEFAULT_PERIOD)
  })

  // 🔑 זה הצד שבו ברירת-המחדל של הלשונית נכנסת — ורק כאן.
  it('בלי כתובת ⇒ ברירת-המחדל של הלשונית', () => {
    expect(parsePeriodParam(null, '12m')).toBe('12m')
  })

  it('עם כתובת ⇒ הכתובת גוברת על ברירת-המחדל של הלשונית', () => {
    expect(parsePeriodParam('year', '12m')).toBe('year')
  })

  // ⚠️ ברירת-מחדל פסולה בקטלוג אינה מדליפה למסך — היא נופלת לגלובלית.
  it('ברירת-מחדל שאינה מפתח מוכר נופלת לגלובלית', () => {
    expect(parsePeriodParam(null, 'שבוע')).toBe(DEFAULT_PERIOD)
  })
})
