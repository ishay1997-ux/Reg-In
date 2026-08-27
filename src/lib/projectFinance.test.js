// בדיקות-יחידה ל-src/lib/projectFinance.js — מודול 8, צעד 2.1.
//
// 🔴 **כל מספר בקובץ הזה מוקלד מהרשם, לעולם לא מחושב מהקוד הנבדק** — ‏spec §③3:
// *"המספרים ב-③3 הם חוזה-הקבלה — הבדיקות נכתבות אליהם, לא מחושבות מהקוד"*.
// המקורות, פר-מספר:
// · ‏`docs/specs/module_08_finance/data-set.md` §1/§2/§4 — עוגני-היד של הפרויקטים 12/13/15.
// · המוקאפ המאושר `docs/mockups/finance-screen/approved/02_closing_window_approved.html`
//   — אריח-הסטייה `−692.00`.
// · ‏`docs/micro_guides/module-8.md` צעד 2.1 — עוגני הרווח-הצפוי (‏2,958.00 · 3,471.00 ·
//   ‏409.90 / 432.50), שחושבו ביד באישור-הבלופרינט.
//
// 🔑 **הקלטים כאן מגיעים כמחרוזות בכוונה.** ‏PostgREST מחזיר `numeric` כטקסט — נמדד חי
// ‏27/08/2026 על אותם שלושה פרויקטים: `gross_profit` `"207.40"` · `budget_deviation`
// `"202.5000000000000000"`. בדיקה שמזינה `207.4` כמספר הייתה ירוקה על קוד ששובר בייצור.
import { describe, expect, it } from 'vitest'
import {
  FinanceShapeError,
  assertFinanceShape,
  deriveDaysOverdue,
  deriveDueDate,
  deriveExpectedProfit,
  derivePercent,
  formatPercent,
  scoreTag,
  scoreTagText,
  toFinanceNumber,
} from '@/lib/projectFinance'

// ─────────────────────────────────────────────────────────────────────────────
// עוגני-הקבלה, מוקלדים. הטבלה היא החוזה; הקוד רק נמדד מולה.
// המדידה החיה (‏27/08/2026, `finance_project_money` על המסד `yfeovxppnfoafmfbdfvh`)
// החזירה בדיוק את שלוש השורות האלה — ולכן העוגן חזק יותר מבדיקה שנכתבה מול JS בלבד.
// ─────────────────────────────────────────────────────────────────────────────
const ANCHORS = {
  // #12 "כנס משקיעים שנתי" — שעות-בפועל 6 מול 1.5 מתוכננות. **הפרויקט המפריד**:
  // רק כאן מתוכנן ≠ בפועל, ולכן רק כאן החלפת planned↔actual מאדימה בדיקה.
  p12: { grossProfit: '207.40', budgetDeviation: '202.5000000000000000', expected: 409.9 },
  // #13 "פסטיבל קיץ עירוני" — רווח קפוא 3,650.00, הכנסה 5,300.00, סטייה −692.00.
  p13: {
    revenue: '5300.00',
    grossProfit: '3650.00',
    budgetDeviation: '-692.0000000000000000',
    expected: 2958,
  },
  // #15 "ערב השקה — קמפוס צפון" — הכנסה 5,985.00 (‏6,060 פחות שינוי-תכולה של −75).
  p15: {
    revenue: '5985.00',
    grossProfit: '3635.00',
    budgetDeviation: '-164.0000000000000000',
    expected: 3471,
  },
}

describe('deriveExpectedProfit — ה27, ורק חיבור של שני שדות שהמסד כבר החזיר', () => {
  it('#13: 3,650.00 + (−692.00) = 2,958.00 — עוגן-היד של הרווח-הצפוי', () => {
    expect(deriveExpectedProfit(ANCHORS.p13.grossProfit, ANCHORS.p13.budgetDeviation)).toBe(
      ANCHORS.p13.expected,
    )
  })

  it('#15: 3,635.00 + (−164.00) = 3,471.00 — תואם ל-data-set §4', () => {
    expect(deriveExpectedProfit(ANCHORS.p15.grossProfit, ANCHORS.p15.budgetDeviation)).toBe(
      ANCHORS.p15.expected,
    )
  })

  it('#12: 207.40 + 202.50 = 409.90 — ולא 409.90000000000003 (חשבון-אגורות)', () => {
    const result = deriveExpectedProfit(ANCHORS.p12.grossProfit, ANCHORS.p12.budgetDeviation)
    expect(result).toBe(ANCHORS.p12.expected)
    // ‏`toBe` על 409.9 כבר סוגר את זה, אבל השורה הזו אומרת **למה** הבדיקה קיימת:
    // חיבור בנקודה-צפה של אותם שני מספרים מחזיר זנב, וזה מספר-כסף שמוצג למנהלת.
    expect(String(result)).toBe('409.9')
  })

  it('#12 בגרסת-הנסיעות הקודמת (פרמטר 0 במקום 22.60): 230.00 + 202.50 = 432.50', () => {
    // 🔑 העוגן השני של #12 מהמדריך. **הנסיעות חיות ב-`gross_profit` של המסד**, ולכן
    // שינוי הפרמטר מזיז את הקלט ולא את הנוסחה כאן — וזו בדיוק ההפרדה שהצעד הזה שומר.
    expect(deriveExpectedProfit('230.00', ANCHORS.p12.budgetDeviation)).toBe(432.5)
  })

  it('🔴 ‏T7 — סטיית-תקציב null ⇒ רווח-צפוי null, ולעולם לא `gross_profit` לבדו', () => {
    expect(deriveExpectedProfit(ANCHORS.p13.grossProfit, null)).toBeNull()
    // השומר האמיתי: לא רק "null" אלא **לא** 3650. פרויקט בלי שעות-סופיות שמדווח את
    // מספר-העבודה-בפועל כתחזית הוא בדיוק הכשל השקט שהצעד הזה נבנה למנוע.
    expect(deriveExpectedProfit(ANCHORS.p13.grossProfit, null)).not.toBe(3650)
  })

  it('רווח-גולמי null ⇒ null (פרויקט שלא נקרא), בלי להתייחס לסטייה', () => {
    expect(deriveExpectedProfit(null, '-692.00')).toBeNull()
  })

  it('🔴 שדה שלא הגיע כלל (undefined) זורק FinanceShapeError — לא נבלע כ-0', () => {
    expect(() => deriveExpectedProfit(undefined, '0')).toThrow(FinanceShapeError)
    expect(() => deriveExpectedProfit('100', undefined)).toThrow(FinanceShapeError)
  })
})

describe('derivePercent + formatPercent — §7.52 ("₪ נשמר, % תמיד נגזר")', () => {
  it('עוגן-היד הרביעי: 3,650 מתוך 5,300 ⇒ 69%', () => {
    expect(derivePercent(ANCHORS.p13.grossProfit, ANCHORS.p13.revenue)).toBe(69)
    expect(formatPercent(derivePercent(ANCHORS.p13.grossProfit, ANCHORS.p13.revenue))).toBe('69%')
  })

  it('#15: 3,471.00 מתוך 5,985.00 ⇒ 58%', () => {
    expect(derivePercent(ANCHORS.p15.expected, ANCHORS.p15.revenue)).toBe(58)
  })

  it('🔴 מכנה 0 (ביטול שוויתרו עליו — הכנסה 0) ⇒ null ⇒ "—", לא NaN ולא 0%', () => {
    expect(derivePercent('1500.00', '0')).toBeNull()
    expect(formatPercent(derivePercent('1500.00', '0'))).toBe('—')
    expect(derivePercent('0', '0')).toBeNull()
  })

  it('מכנה חיובי שמתעגל ל-0 אגורות ⇒ null ולא ∞', () => {
    expect(derivePercent('100', '0.004')).toBeNull()
  })

  it('מכנה חסר/null ⇒ null; מונה null ⇒ null', () => {
    expect(derivePercent('100', null)).toBeNull()
    expect(derivePercent(null, '100')).toBeNull()
  })

  it('‏undefined כאן מתנהג כ-null ומגיע ל-"—" — ובכוונה, כי הקלט הוא ערך כבר-גזור', () => {
    // סעיף (ב) בכותרת-הקובץ: שני הקלטים אינם שמות-עמודות אלא תוצרי-גזירה (למשל
    // ‏`deriveExpectedProfit`, שמחזירה `null` לגיטימי). דריפט-צורה נתפס במעלה-הזרם על
    // השדה הגולמי. **הבדיקה קיימת כדי שההחלטה תהיה נעוצה ולא "כך יצא"** — היפוך שלה
    // לזריקה הוא שינוי-התנהגות שיאדים כאן.
    expect(derivePercent('100', undefined)).toBeNull()
    expect(derivePercent(undefined, '100')).toBeNull()
    expect(formatPercent(derivePercent(undefined, '100'))).toBe('—')
  })

  it('הפסד נשאר שלילי — ‏−500 מתוך 1,000 ⇒ ‎-50%', () => {
    expect(derivePercent('-500', '1000')).toBe(-50)
    expect(formatPercent(-50)).toBe('-50%')
  })

  it('formatPercent על 0 מציג "0%" ולא "—" — אפס מדוד אינו חוסר-נתון', () => {
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(null)).toBe('—')
    expect(formatPercent(undefined)).toBe('—')
  })
})

describe('deriveDueDate / deriveDaysOverdue — §7.20א, עוגן data-set §4א', () => {
  it('חשבונית 10/09/2026 + שוטף+30 ⇒ מועד-פירעון 10/10/2026', () => {
    expect(deriveDueDate('2026-09-10T09:00:00+03:00', 30)).toBe('2026-10-10')
  })

  it('העוגן המלא: "היום" 15/10/2026 מול פירעון 10/10 ⇒ 5 ימי איחור', () => {
    expect(deriveDaysOverdue('2026-09-10T09:00:00+03:00', 30, '2026-10-15')).toBe(5)
  })

  it('🔴 חותמת שנשלחה אחרי חצות בישראל נספרת ליום הישראלי, לא ל-UTC', () => {
    // 10/09/2026 00:30 בישראל = 09/09 21:30 UTC. חיתוך נאיבי של ה-ISO היה מחזיר
    // פירעון 09/10 ⇒ **6** ימי איחור במקום 5 — יום שלם שנולד מאזור-זמן.
    expect(deriveDueDate('2026-09-09T21:30:00Z', 30)).toBe('2026-10-10')
    expect(deriveDaysOverdue('2026-09-09T21:30:00Z', 30, '2026-10-15')).toBe(5)
  })

  it('🔴 אין פרמטר תנאי-תשלום (null) ⇒ null בשני השדות — לעולם לא "0 ימי איחור"', () => {
    expect(deriveDueDate('2026-09-10T09:00:00+03:00', null)).toBeNull()
    expect(deriveDaysOverdue('2026-09-10T09:00:00+03:00', null, '2026-10-15')).toBeNull()
  })

  it('חשבונית טרם נשלחה (null) ⇒ null', () => {
    expect(deriveDueDate(null, 30)).toBeNull()
    expect(deriveDaysOverdue(null, 30, '2026-10-15')).toBeNull()
  })

  it('טרם הגיע מועד-הפירעון ⇒ 0 — מספר מדוד, ולכן לא null', () => {
    expect(deriveDaysOverdue('2026-09-10T09:00:00+03:00', 30, '2026-10-01')).toBe(0)
    // ובדיוק ביום-הפירעון עצמו עדיין אין איחור.
    expect(deriveDaysOverdue('2026-09-10T09:00:00+03:00', 30, '2026-10-10')).toBe(0)
    // יום אחריו — 1.
    expect(deriveDaysOverdue('2026-09-10T09:00:00+03:00', 30, '2026-10-11')).toBe(1)
  })

  it('חוצה מעבר-שעון-קיץ (סוף אוקטובר בישראל) בלי לאבד או להוסיף יום', () => {
    // שעון-הקיץ בישראל מסתיים בסוף אוקטובר; חישוב-הפרש שנשען על מילישניות היה
    // מחזיר 30.04 ימים ומתעגל שגוי. החישוב כאן עובר דרך ימי-לוח שלמים.
    expect(deriveDueDate('2026-10-15T12:00:00+03:00', 30)).toBe('2026-11-14')
    expect(deriveDaysOverdue('2026-10-15T12:00:00+03:00', 30, '2026-11-20')).toBe(6)
  })

  it('תאריך פסול / תנאי-תשלום שלילי או לא-שלם ⇒ null, לא זריקה', () => {
    expect(deriveDueDate('לא-תאריך', 30)).toBeNull()
    expect(deriveDueDate('2026-09-10T09:00:00+03:00', -5)).toBeNull()
    expect(deriveDueDate('2026-09-10T09:00:00+03:00', 30.5)).toBeNull()
  })

  it('🔴 שדה שנעלם (undefined) זורק — הוא דריפט-עמודה, לא "אין תנאי-תשלום"', () => {
    // שתי העמודות מוצהרות בטבלת-ההחזרה של `get_finance_overview` (מיגרציית E1):
    // ‏`invoice_sent_at timestamptz` · `payment_terms_days integer`. ⇒ המפתח מגיע תמיד,
    // והערך הוא שיכול להיות null. שם-עמודה שהשתנה חייב להאדים ולא להציג `—` בשקט על
    // **כל** השורות — מנהלת-הכספים לא הייתה רודפת אחרי אף חוב ואיש לא היה רואה סימן.
    expect(() => deriveDueDate('2026-09-10T09:00:00+03:00', undefined)).toThrow(FinanceShapeError)
    expect(() => deriveDueDate('2026-09-10T09:00:00+03:00', undefined)).toThrow(
      /payment_terms_days/,
    )
    expect(() => deriveDueDate(undefined, 30)).toThrow(FinanceShapeError)
    expect(() => deriveDueDate(undefined, 30)).toThrow(/invoice_sent_at/)
    // וגם דרך העוטפת — ‏`deriveDaysOverdue` אינה בולעת את הזריקה.
    expect(() => deriveDaysOverdue('2026-09-10T09:00:00+03:00', undefined, '2026-10-15')).toThrow(
      FinanceShapeError,
    )
  })

  it('מקבל גם `Date` וגם מחרוזת-תאריך-בלבד כ-"היום"', () => {
    expect(
      deriveDaysOverdue('2026-09-10T09:00:00+03:00', 30, new Date('2026-10-15T08:00:00Z')),
    ).toBe(5)
    expect(deriveDaysOverdue('2026-09-10', 30, '2026-10-15')).toBe(5)
  })
})

describe('scoreTag — ה16 (סוגר §7.80)', () => {
  it.each([
    [5, 'מצוין', 'ok'],
    [4, 'טוב', 'ok'],
    [3, 'בינוני', 'warn'],
    [2, 'טעון בירור', 'danger'],
    [1, 'טעון בירור', 'danger'],
  ])('ציון %i ⇒ "%s" בטון %s', (score, label, tone) => {
    expect(scoreTag(score)).toEqual({ score, label, tone })
  })

  it('אין ציון (טרם ענו / לא ענה לסקר) ⇒ null', () => {
    expect(scoreTag(null)).toBeNull()
    expect(scoreTag(undefined)).toBeNull()
  })

  it('ציון שהגיע כמחרוזת מה-RPC מטופל זהה', () => {
    expect(scoreTag('4')).toEqual({ score: 4, label: 'טוב', tone: 'ok' })
  })

  it('🔴 ציון מחוץ ל-1–5 זורק ולא נופל בשקט לאפור', () => {
    expect(() => scoreTag(0)).toThrow(FinanceShapeError)
    expect(() => scoreTag(6)).toThrow(FinanceShapeError)
    expect(() => scoreTag(3.5)).toThrow(FinanceShapeError)
  })

  it('scoreTagText: תווית בלבד בכל משטח — הצורה הממוספרת פרשה (החלטה חוצת-משטחים #4)', () => {
    expect(scoreTagText(4)).toBe('טוב')
    expect(scoreTagText(2)).toBe('טעון בירור')
    expect(scoreTagText(null)).toBeNull()
    // 🔴 השומר האמיתי: **אין** דרך לקבל מכאן את הצורה שנפסלה. ‏S2 (צעד 3.2) יקבל את
    // אותה תווית כמו S1 — `screens-approved.md`: "התג הנוכחי ב-S2 … הוא ייצוג-מוקאפ
    // בלבד, לא חוזה-פורמט". בונה עתידי שמעביר אופציה כלשהי מקבל את אותה תווית.
    expect(scoreTagText(2, { withScore: true })).toBe('טעון בירור')
    expect(scoreTagText(2)).not.toMatch(/2/)
  })
})

describe('שומרי-הצורה (R4-F9) — undefined הוא דריפט, null הוא תשובה', () => {
  it('toFinanceNumber: null עובר · מחרוזת-מספר עוברת · undefined וטקסט זורקים', () => {
    expect(toFinanceNumber(null)).toBeNull()
    expect(toFinanceNumber('202.5000000000000000')).toBe(202.5)
    expect(toFinanceNumber(0)).toBe(0)
    expect(() => toFinanceNumber(undefined, 'gross_profit')).toThrow(FinanceShapeError)
    expect(() => toFinanceNumber('כספים')).toThrow(FinanceShapeError)
  })

  it('הודעת-השגיאה נושאת את שם-השדה, כדי שהמסך יוכל לומר מה נשבר', () => {
    expect(() => toFinanceNumber(undefined, 'budget_deviation')).toThrow(/budget_deviation/)
  })

  it('assertFinanceShape: שורה מלאה עוברת; שדה חסר או null-שורה זורקים', () => {
    const row = { revenue: '5300.00', gross_profit: '3650.00', budget_deviation: null }
    expect(assertFinanceShape(row, ['revenue', 'gross_profit', 'budget_deviation'])).toBe(row)
    // ‏null הוא ערך לגיטימי (‏T7) — הוא **לא** נחשב חסר.
    expect(() => assertFinanceShape(row, ['budget_deviation'])).not.toThrow()
    expect(() => assertFinanceShape(row, ['final_profit'])).toThrow(FinanceShapeError)
    expect(() => assertFinanceShape(null, ['revenue'])).toThrow(FinanceShapeError)
    expect(() => assertFinanceShape(undefined, ['revenue'])).toThrow(FinanceShapeError)
  })

  it('הודעת השדה-החסר מונה את השמות, לא רק "שגיאה"', () => {
    expect(() => assertFinanceShape({}, ['revenue', 'gross_profit'])).toThrow(
      /revenue, gross_profit/,
    )
  })
})
