// 🔴 **שער-הקבלה של לשונית-הכספים — וההגדרה כאן קודמת לקוד, לא נגזרת ממנו.**
//
// כל מספר בקובץ הזה הועתק ספרה-בספרה מ-`docs/specs/module_11_reports/spec.md` §🔢
// (המקרה המחושב-ביד, 11/09/2026) ומ-`stage2-review/signoff-baseline-2026-09-10.md`
// (המדידה בערוץ עצמאי, 10/09/2026). **שניהם נכתבו לפני שהקוד הזה היה קיים.**
//
// 🔑 **ולמה זה נאמר בראש הקובץ ולא בהערה בצד:** ‏`spec.md` §🔢 מתעד **חמש** מדידות שגויות
// של אותו דלי-גיול ביום אחד, כולן מאותה מחלקה — *מדידת השחזור של ההגדרה במקום ההגדרה*.
// בדיקה שכותב מי שכותב את הנוסחה מקודדת את אותה שגיאה ועוברת בירוק. ⇒ **הציפיות כאן אינן
// מחושבות כאן.** אם בדיקה נופלת, הקוד שגוי עד שיוכח אחרת; ואם דווקא הציפייה שגויה — זה
// ממצא שמדווח עם שני המספרים, לא מספר שמתקנים בשקט.
//
// 🔁 **והקובץ הזה הוא גם האורקל של ה-SQL:** ‏`report_m09_aging` במיגרציה
// `*_module11_e_rpcs_finance.sql` חייב להחזיר בדיוק את אותם דליים על אותם נתונים.
// הבדיקה היהודית-כפולה: כאן ב-JS, ושם בשאילתה חיה מול המסד.

import { describe, it, expect } from 'vitest'
import {
  AGING_BUCKETS,
  agingBucketKey,
  agingBucketForInvoice,
  summariseAging,
  medianOf,
  budgetDeviationRatio,
  isOverBudgetThreshold,
  roundedShekelSum,
} from './reportsFinance.js'

const TODAY = '2026-09-10' // "היום" המוצהר של מוקאפי מ11 ושל קו-הבסיס (📐22)
const TERMS = 30 // `params.תנאי_תשלום_ימים` — נקרא בזמן-ריצה, מוזרק כאן כקלט

describe('agingBucketKey — גבולות הדליים', () => {
  // ‏`deriveDaysOverdue` כבר קוטעת שלילי ל-0; כאן נבדק רק המיפוי ימים ⇐ דלי.
  it('אפס ימי-איחור הוא "שוטף" — טרם הגיע מועד-הפירעון, לא "שולם"', () => {
    expect(agingBucketKey(0)).toBe('current')
  })

  it.each([
    [1, 'd1_30'],
    [30, 'd1_30'],
    [31, 'd31_60'],
    [60, 'd31_60'],
    [61, 'd61_90'],
    [90, 'd61_90'],
    [91, 'd90p'],
    [574, 'd90p'],
  ])('‏%i ימי-איחור ⇒ %s', (days, key) => {
    expect(agingBucketKey(days)).toBe(key)
  })

  it('ימים שאינם ניתנים לחישוב (null) אינם נופלים ל"שוטף" — הם מחוץ לדליים', () => {
    expect(agingBucketKey(null)).toBeNull()
  })

  it('חמישה דליים, בסדר הטבעי שלהם (📐7 — סדר-דליים גובר על מיון לפי ערך)', () => {
    expect(AGING_BUCKETS.map((b) => b.key)).toEqual([
      'current',
      'd1_30',
      'd31_60',
      'd61_90',
      'd90p',
    ])
    expect(AGING_BUCKETS.map((b) => b.label)).toEqual(['שוטף', '1–30', '31–60', '61–90', '90+'])
  })
})

describe('agingBucketForInvoice — שלוש השורות המחושבות-ביד של spec.md §🔢 3.1', () => {
  // 🔴 השורה השלישית היא הגבול שנשבר חמש פעמים: מועד-פירעון **אחרי** היום ⇒ ‎−1 ⇒ 0 ⇒ שוטף.
  it.each([
    ['2026-05-11', 92, 'd90p'],
    ['2026-06-03', 69, 'd61_90'],
    ['2026-08-12', 0, 'current'],
  ])('נשלחה %s ⇒ %i ימי-איחור ⇒ %s', (invoiceSentAt, days, key) => {
    const row = agingBucketForInvoice({ invoiceSentAt, termsDays: TERMS, today: TODAY })
    expect(row.daysOverdue).toBe(days)
    expect(row.bucketKey).toBe(key)
  })

  it('נמדד מול מועד-הפירעון ולא מול יום-השליחה — ההפרש הוא בדיוק ימי-התנאים', () => {
    // אותה חשבונית, אותו יום: מול השליחה 122 ימים, מול הפירעון 92. 30 = תנאי-התשלום.
    const row = agingBucketForInvoice({
      invoiceSentAt: '2026-05-11',
      termsDays: TERMS,
      today: TODAY,
    })
    expect(row.dueDate).toBe('2026-06-10')
    expect(row.daysOverdue).toBe(92)
  })

  it('פרמטר תנאי-תשלום חסר ⇒ null, לעולם לא 30 מוקשח ולא "0 ימי איחור"', () => {
    const row = agingBucketForInvoice({
      invoiceSentAt: '2026-05-11',
      termsDays: null,
      today: TODAY,
    })
    expect(row.daysOverdue).toBeNull()
    expect(row.bucketKey).toBeNull()
  })
})

describe('roundedShekelSum — סדר-העיגול הוא חלק מההגדרה (📐4)', () => {
  // 🔴 נמדד חי 16/09/2026: סכימה-ואז-עיגול מחזירה 236,380; עיגול-פר-שורה ואז סכימה
  //    מחזירה 236,382 — **המספר שבקו-הבסיס.** ₪ בלי אגורות בכל מקום (אריח · טבלה · ציר)
  //    פירושו שהאריח חייב להיות סכום של מה שהטבלה מציגה, ולא סכום נסתר אחר.
  it('מעגל כל שורה ואז מסכם', () => {
    expect(roundedShekelSum([1.4, 1.4, 1.4])).toBe(3)
  })

  it('סכום `null` (נמדד ואין) מדולג ואינו נספר כאפס', () => {
    expect(roundedShekelSum([100.5, null])).toBe(101)
  })

  // ‏`undefined` **אינו** `null` כאן, וזו הדוקטרינה שכבר כתובה בראש `projectFinance.js`:
  // ‏`null` = ערך חסר שנמדד · `undefined` = **שם-עמודה שהשתנה**. בליעה שקטה של השני
  // הופכת כל שורה במסך ל-"—" בלי שום סימן שמשהו נשבר.
  it('מפתח שנעלם (undefined) זורק — הוא סימן-דריפט, לא חוסר-נתון', () => {
    expect(() => roundedShekelSum([100.5, undefined])).toThrow()
  })
})

describe('summariseAging — האגרגט של spec.md §🔢 3.2 ושל signoff-baseline', () => {
  // הקלט: 35 החשבוניות הפתוחות כפי שהמסד מחזיק אותן (תאריך-שליחה + ₪ מעוגל),
  // נמדדו בערוץ נפרד ב-16/09/2026. **הציפיות למטה הן קו-הבסיס של 10–11/09 — לא נגזרו מכאן.**
  const OPEN_INVOICES = [
    { projectId: 1040, invoiceSentAt: '2025-01-14', amount: 2899 },
    { projectId: 1460, invoiceSentAt: '2026-04-30', amount: 10163 },
    { projectId: 1468, invoiceSentAt: '2026-05-11', amount: 4884 },
    { projectId: 1505, invoiceSentAt: '2026-06-03', amount: 5438 },
    { projectId: 1515, invoiceSentAt: '2026-06-12', amount: 5804 },
    { projectId: 1512, invoiceSentAt: '2026-06-14', amount: 7466 },
    { projectId: 1516, invoiceSentAt: '2026-06-15', amount: 9384 },
    { projectId: 1521, invoiceSentAt: '2026-06-18', amount: 4624 },
    { projectId: 1522, invoiceSentAt: '2026-06-21', amount: 3753 },
    { projectId: 1525, invoiceSentAt: '2026-06-26', amount: 2377 },
    { projectId: 1537, invoiceSentAt: '2026-07-06', amount: 13762 },
    { projectId: 1538, invoiceSentAt: '2026-07-09', amount: 9669 },
    { projectId: 1541, invoiceSentAt: '2026-07-12', amount: 2517 },
    { projectId: 1540, invoiceSentAt: '2026-07-13', amount: 7787 },
    { projectId: 1542, invoiceSentAt: '2026-07-17', amount: 13796 },
    { projectId: 1545, invoiceSentAt: '2026-07-22', amount: 2424 },
    { projectId: 1544, invoiceSentAt: '2026-07-23', amount: 9520 },
    { projectId: 1546, invoiceSentAt: '2026-07-29', amount: 1378 },
    { projectId: 1547, invoiceSentAt: '2026-07-29', amount: 3809 },
    { projectId: 1549, invoiceSentAt: '2026-08-01', amount: 1427 },
    { projectId: 1548, invoiceSentAt: '2026-08-04', amount: 7253 },
    { projectId: 1551, invoiceSentAt: '2026-08-04', amount: 4751 },
    { projectId: 1550, invoiceSentAt: '2026-08-06', amount: 12088 },
    { projectId: 1552, invoiceSentAt: '2026-08-07', amount: 16968 },
    { projectId: 1553, invoiceSentAt: '2026-08-09', amount: 3856 },
    { projectId: 12, invoiceSentAt: '2026-08-28', amount: 3000 },
    { projectId: 1554, invoiceSentAt: '2026-08-16', amount: 10089 },
    { projectId: 1555, invoiceSentAt: '2026-08-17', amount: 6515 },
    { projectId: 1556, invoiceSentAt: '2026-08-15', amount: 9750 },
    { projectId: 1557, invoiceSentAt: '2026-08-21', amount: 5811 },
    { projectId: 1559, invoiceSentAt: '2026-08-21', amount: 2217 },
    { projectId: 1560, invoiceSentAt: '2026-08-20', amount: 12253 },
    { projectId: 1561, invoiceSentAt: '2026-08-24', amount: 5293 },
    { projectId: 1562, invoiceSentAt: '2026-08-23', amount: 7146 },
    { projectId: 1563, invoiceSentAt: '2026-08-29', amount: 6511 },
  ]

  const summary = () => summariseAging(OPEN_INVOICES, { today: TODAY, termsDays: TERMS })

  it('‏35 חשבוניות פתוחות · 236,382 ₪', () => {
    expect(summary().total).toEqual({ n: 35, amount: 236382 })
  })

  it('‏שוטף 10 · 1–30 13 · 31–60 8 · 61–90 1 · 90+ 3', () => {
    expect(summary().buckets.map((b) => b.n)).toEqual([10, 13, 8, 1, 3])
  })

  it('‏68,585 · 87,574 · 56,839 · 5,438 · 17,946', () => {
    expect(summary().buckets.map((b) => b.amount)).toEqual([68585, 87574, 56839, 5438, 17946])
  })

  it('‏מעל 60 יום = 4 חשבוניות · 23,384 ₪ (שני הדליים העליונים יחד)', () => {
    expect(summary().overSixtyDays).toEqual({ n: 4, amount: 23384 })
  })

  it('סכום הדליים שווה לסך הכל — אין חשבונית שנפלה בין הדליים', () => {
    const { buckets, total } = summary()
    expect(buckets.reduce((s, b) => s + b.n, 0)).toBe(total.n)
    expect(buckets.reduce((s, b) => s + b.amount, 0)).toBe(total.amount)
  })

  it('הגרף מציג אוכלוסייה צרה מהדף — 25 חשבוניות באיחור מול 35 בסך הכל (📐2)', () => {
    // הצהרה שחייבת להיות על המסך: 35 בדף · 25 בגרף · 10 באריח "שוטף".
    const { overdueOnly, buckets } = summary()
    expect(overdueOnly).toEqual({ n: 25, amount: 167797 })
    expect(buckets[0]).toMatchObject({ key: 'current', n: 10, amount: 68585 })
  })

  it('החשבונית הישנה ביותר — 574 ימי-איחור, והיא בראש המיון (📐7 · סיפור-כנס ②)', () => {
    const { rows } = summary()
    expect(rows[0].projectId).toBe(1040)
    expect(rows[0].daysOverdue).toBe(574)
  })

  // 🔴 שתי אמירות שונות, ושתיהן חייבות להישמר: השורה **כן** נכנסת ליתרת-החוב (היא חשבונית
  //    פתוחה לכל דבר), אבל **אינה** נכנסת לאף דלי — ולכן היא נספרת בנפרד ומוצהרת.
  //    בליעתה ל"שוטף" הייתה מציגה חשבונית שאיש לא מדד כ"עוד לא באיחור".
  it('שורה שאי-אפשר לחשב לה ימי-איחור נכנסת ליתרה, נספרת בנפרד, ואינה נבלעת בשוטף', () => {
    const withBroken = summariseAging(
      [...OPEN_INVOICES, { projectId: 9999, invoiceSentAt: null, amount: 500 }],
      { today: TODAY, termsDays: TERMS },
    )
    expect(withBroken.unmeasured).toEqual({ n: 1, amount: 500 })
    expect(withBroken.total).toEqual({ n: 36, amount: 236882 })
    const bucketed = withBroken.buckets.reduce(
      (acc, b) => ({ n: acc.n + b.n, amount: acc.amount + b.amount }),
      { n: 0, amount: 0 },
    )
    expect(bucketed).toEqual({ n: 35, amount: 236382 })
  })
})

describe('medianOf — "ימים לתשלום (חציון)"', () => {
  it('מחזיר את האמצע על מספר אי-זוגי של ערכים', () => {
    expect(medianOf([5, 1, 3])).toBe(3)
  })

  it('ממוצע שני האמצעיים על מספר זוגי — כמו percentile_cont(0.5) ב-SQL', () => {
    expect(medianOf([1, 2, 3, 4])).toBe(2.5)
  })

  it('רשימה ריקה ⇒ null, לא 0 — "אין חשבוניות ששולמו" אינו "משתלם ביום אפס"', () => {
    expect(medianOf([])).toBeNull()
  })

  it('מדלג על `null` במקום להמיר אותו לאפס, וקורא מחרוזת-מספר כמספר', () => {
    expect(medianOf([10, null, 20, '30'])).toBe(20)
  })
})

describe('budgetDeviationRatio — §7.58 · 📑#5', () => {
  // היחס = `budget_deviation` ÷ (`planned_hours` × Σ תעריפי-המשובצות-סופית), חתום.
  it('מחשב יחס חתום מול עלות-העבודה המתוכננת', () => {
    expect(budgetDeviationRatio(300, 4, 50)).toBeCloseTo(1.5, 10)
  })

  it('סטייה שלילית נשארת שלילית — הדף שואל מי דלף, והחיסכון אינו דליפה', () => {
    expect(budgetDeviationRatio(-40, 4, 50)).toBeCloseTo(-0.2, 10)
  })

  it('פרויקט בלי משובצות-סופית ⇒ null ומוחרג מהיחס, לא אינסוף ולא אפס', () => {
    expect(budgetDeviationRatio(300, 4, 0)).toBeNull()
  })

  it('שעות-מתוכננות חסרות (T7) ⇒ null', () => {
    expect(budgetDeviationRatio(300, null, 50)).toBeNull()
  })
})

// 🔴 **שלוש הבדיקות הבאות נולדו מסבב-אימות, לא מכתיבת-הקוד** (16/09/2026). כל אחת סוגרת
//    חור שהמאמת הצביע עליו ב-`tests_pass_but_would_not_catch`: מחיקת הכלל, ואף בדיקה
//    קיימת לא נופלת.
describe('סדר-העיגול נשמר גם דרך `summariseAging`, לא רק דרך `roundedShekelSum`', () => {
  // 🔴 **מה זה תופס:** ‏`summariseAging` מעגלת פר-שורה ב-`addTo` משלה, ו-`roundedShekelSum`
  //    כלל אינה נקראת ממנה. הפיקסצ'ר של 35 החשבוניות מחזיק שלמים ⇒ סכימה-ואז-עיגול מחזירה
  //    עליו את אותם 236,382 בדיוק, ולכן מחיקת ה-`Math.round` הייתה עוברת בירוק.
  //    כאן השברים נבחרו כך ששתי השיטות **לא** מסכימות: 3 × 1.4 ⇒ פר-שורה 3, סכימה-ואז-עיגול 4.
  const FRACTIONAL = [
    { projectId: 1, invoiceSentAt: '2026-08-12', amount: 1.4 },
    { projectId: 2, invoiceSentAt: '2026-08-12', amount: 1.4 },
    { projectId: 3, invoiceSentAt: '2026-08-12', amount: 1.4 },
  ]

  it('מעגל כל שורה ואז מסכם — 3 ולא 4', () => {
    const { total, buckets } = summariseAging(FRACTIONAL, { today: TODAY, termsDays: TERMS })
    expect(total).toEqual({ n: 3, amount: 3 })
    expect(buckets[0]).toMatchObject({ key: 'current', n: 3, amount: 3 })
  })

  it('ובכיוון ההפוך: ‏3 × 1.6 ⇒ 6 ולא 5 — העיגול הוא פר-שורה, לא על הסכום', () => {
    const rows = FRACTIONAL.map((r) => ({ ...r, amount: 1.6 }))
    expect(summariseAging(rows, { today: TODAY, termsDays: TERMS }).total.amount).toBe(6)
  })
})

describe('תוויות-הדליים של ה-SQL שוות ל-`AGING_BUCKETS`', () => {
  // 🔴 **מה זה תופס:** לגבולות-הדליים יש **שלושה** עותקים — כאן, ברשימת ה-`values` שבתוך
  //    `report_m09_aging`, ובמוקאפ. ‏`drill.buckets` שנכתב למטה הוא **הפיילוד החי** של
  //    הפונקציה, נלקח מקריאה חתומה ב-16/09/2026; אם מישהו יערוך רק את אחד השניים, ההשוואה
  //    כאן נופלת. ⚠️ **והמגבלה הכתובה:** הפיקסצ'ר קפוא — הוא תופס דריפט ב-JS מיידית, ודריפט
  //    ב-SQL רק בריצת-אימות חיה שמדביקה אותו מחדש.
  const SQL_DRILL_BUCKETS = [
    { key: 'current', label: 'שוטף' },
    { key: 'd1_30', label: '1–30' },
    { key: 'd31_60', label: '31–60' },
    { key: 'd61_90', label: '61–90' },
    { key: 'd90p', label: '90+' },
  ]

  it('חמישה מפתחות וחמש תוויות, באותו סדר', () => {
    expect(AGING_BUCKETS.map(({ key, label }) => ({ key, label }))).toEqual(SQL_DRILL_BUCKETS)
  })
})

describe('isOverBudgetThreshold — הגבול `>` ולא `>=`', () => {
  // 🔴 **מה זה תופס:** ההשוואה חיה ב-SQL בשני מקומות (מ7 ומ8) ולא הייתה לה תאומה ב-JS.
  //    החלפת `>` ב-`>=` משנה את "‏30 חרגו" בלי שום בדיקה נופלת.
  it('בדיוק על הסף אינו חריגה', () => {
    expect(isOverBudgetThreshold(0.15, 15)).toBe(false)
  })

  it('מעל הסף — ולו במעט — הוא חריגה', () => {
    expect(isOverBudgetThreshold(0.1501, 15)).toBe(true)
  })

  it('מתחת לסף אינו חריגה, וגם חיסכון (יחס שלילי) אינו', () => {
    expect(isOverBudgetThreshold(0.149, 15)).toBe(false)
    expect(isOverBudgetThreshold(-0.4, 15)).toBe(false)
  })

  it('סף חסר ⇒ null ולא false — "לא חרג" אינו "לא נמדד" (§7.83)', () => {
    expect(isOverBudgetThreshold(0.9, null)).toBeNull()
  })

  it('יחס שאי-אפשר לחשב (פרויקט בלי משובצות-סופית) ⇒ null', () => {
    expect(isOverBudgetThreshold(null, 15)).toBeNull()
  })
})
