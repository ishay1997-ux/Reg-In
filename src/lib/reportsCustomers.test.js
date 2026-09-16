import { describe, it, expect } from 'vitest'
import {
  consecutiveGaps,
  personalCadence,
  classifyDrifting,
  driftingFlagLabel,
  satisfactionBucket,
  satisfiedShare,
  responseRate,
  cadenceHistogram,
  agreementMatrix,
  paymentCadenceRows,
} from './reportsCustomers'

// 🔴 **הציפיות בקובץ הזה לא חושבו כאן, והן קדמו לקוד.**
// מקורן: `stage2-review/signoff-baseline-2026-09-10.md` (‏552 · 70 · 33 · 426/356 ·
// 12 מתרחקים מתוך 52) · `stage2-cards/cards-customers.md` §③ של מ19–מ22 (ההגדרה של כל
// מספר) · `processes-approved.md` §📐7·11·12 ו-§🧾ח7 (הגדרת "מתרחק"). בדיקה שכתב מי
// שכתב את הנוסחה מקודדת את אותה שגיאה ועוברת בירוק — ולכן הציפייה קודמת לקוד.
//
// 🔑 **והקובץ הזה הוא גם האורקל של ה-SQL:** ‏`report_m19_customers_overview` ·
// `report_m20_satisfaction` · `report_m21_drifting` · `report_m22_notes`
// (‏`supabase/migrations/*_module11_g_rpcs_customers.sql`) מחשבים את אותם מדדים
// ב-SQL. **כשהשניים נחלקים — ה-SQL הוא החשוד.**

describe('קצב אישי — המרווחים והחציון (§🧾ח7 · cards-customers.md ⑥ מ21)', () => {
  it('מרווחים בין אירועים עוקבים, ממוינים לפי תאריך ולא לפי סדר-הקלט', () => {
    expect(consecutiveGaps(['2026-03-01', '2026-01-01', '2026-02-01'])).toEqual([31, 28])
  })

  it('פחות משני אירועים ⇒ אין ולו מרווח אחד', () => {
    expect(consecutiveGaps(['2026-01-01'])).toEqual([])
    expect(consecutiveGaps([])).toEqual([])
  })

  it('הקצב הוא חציון המרווחים — לא ממוצע: מרווח חריג אחד אינו מזיז אותו', () => {
    // 30 · 30 · 30 · 400 ⇒ חציון 30, ממוצע 122.5.
    expect(
      personalCadence(['2026-01-01', '2026-01-31', '2026-03-02', '2026-04-01', '2027-05-06']),
    ).toBe(30)
  })

  it('קצב = null כשאין מספיק אירועים לחשב ולו מרווח אחד', () => {
    expect(personalCadence(['2026-01-01'])).toBeNull()
  })
})

describe('סיווג "מתרחק" — יחס אישי ולא סף אחיד (§🧾ח7 · הכרעה 24·ח7)', () => {
  const MULTIPLIER = 1.5

  it('לקוחה שנתית ששקטה ארבעה חודשים **אינה** מתרחקת', () => {
    // קצב אישי 365 יום; 120 יום הם פחות משליש ממנו — וכלל-120-הימים היה מסמן אותה.
    const result = classifyDrifting({
      heldEventDates: ['2023-01-01', '2024-01-01', '2025-01-01', '2026-01-01'],
      hasFutureEvent: false,
      todayIso: '2026-05-01',
      multiplier: MULTIPLIER,
    })
    expect(result.drifting).toBe(false)
    expect(result.cadence).toBe(365)
    expect(result.daysSince).toBe(120)
  })

  it('לקוחה חודשית ששקטה 100 יום **כן** מתרחקת — וכלל-120-הימים מפספס אותה', () => {
    const result = classifyDrifting({
      heldEventDates: ['2026-01-01', '2026-01-31', '2026-03-02', '2026-04-01'],
      hasFutureEvent: false,
      todayIso: '2026-07-10',
      multiplier: MULTIPLIER,
    })
    expect(result.cadence).toBe(30)
    expect(result.daysSince).toBe(100)
    expect(result.drifting).toBe(true)
    expect(result.missedByFixedThreshold).toBe(true)
  })

  it('אירוע עתידי אחד מבטל את הדגל, גם אחרי שתיקה ארוכה', () => {
    const result = classifyDrifting({
      heldEventDates: ['2026-01-01', '2026-01-31', '2026-03-02'],
      hasFutureEvent: true,
      todayIso: '2026-12-31',
      multiplier: MULTIPLIER,
    })
    expect(result.drifting).toBe(false)
    expect(result.reason).toBe('hasFutureEvent')
  })

  it('פחות משלושה אירועים שהתקיימו ⇒ מחוץ לאוכלוסייה, לא "לא-מתרחק"', () => {
    const result = classifyDrifting({
      heldEventDates: ['2026-01-01', '2026-02-01'],
      hasFutureEvent: false,
      todayIso: '2026-12-31',
      multiplier: MULTIPLIER,
    })
    expect(result.eligible).toBe(false)
    expect(result.drifting).toBe(false)
    expect(result.reason).toBe('belowMinEvents')
  })

  it('חציון-מרווח 0 ⇒ היחס "—" והלקוח אינו מסומן (cards-customers ⑦ מ21)', () => {
    const result = classifyDrifting({
      heldEventDates: ['2026-01-01', '2026-01-01', '2026-01-01'],
      hasFutureEvent: false,
      todayIso: '2026-12-31',
      multiplier: MULTIPLIER,
    })
    expect(result.cadence).toBe(0)
    expect(result.ratio).toBeNull()
    expect(result.drifting).toBe(false)
  })

  it('מכפיל חסר ⇒ null ולא ברירת-מחדל שקטה של 1.5 (דפוס מ7 · C5)', () => {
    const result = classifyDrifting({
      heldEventDates: ['2026-01-01', '2026-01-31', '2026-03-02'],
      hasFutureEvent: false,
      todayIso: '2026-12-31',
      multiplier: null,
    })
    expect(result.drifting).toBeNull()
    expect(result.reason).toBe('missingMultiplier')
  })

  it('הדגל הוא טקסט ולא רק צבע (📐19 · cards-customers ① מ21)', () => {
    expect(driftingFlagLabel({ drifting: true, dormant: false })).toBe('מתרחק בלבד')
    expect(driftingFlagLabel({ drifting: true, dormant: true })).toBe('מתרחק · גם רדום')
    expect(driftingFlagLabel({ drifting: false, dormant: true })).toBe('רדום')
    expect(driftingFlagLabel({ drifting: false, dormant: false })).toBeNull()
  })
})

describe('חתך-הלקוחות של מ19 — 4.5+ · 3.5–4.4 · מתחת ל-3.5, על ≥3 משובים (📐12)', () => {
  it('הגבולות עצמם: 4.5 מרוצה · 4.4 בינוני · 3.5 בינוני · 3.49 לא-מרוצה', () => {
    expect(satisfactionBucket(4.5, 3, 3)).toBe('satisfied')
    expect(satisfactionBucket(4.4, 3, 3)).toBe('middle')
    expect(satisfactionBucket(3.5, 3, 3)).toBe('middle')
    expect(satisfactionBucket(3.49, 3, 3)).toBe('unsatisfied')
  })

  it('מתחת לסף-המדגם ⇒ null, לא דלי — הלקוח נספר במונה-החוץ ולא בדלי', () => {
    expect(satisfactionBucket(5, 2, 3)).toBeNull()
  })

  it('בלי ממוצע ⇒ null, לעולם לא "לא-מרוצה"', () => {
    expect(satisfactionBucket(null, 9, 3)).toBeNull()
  })
})

describe('שיעור המרוצים ושיעור המענה — שני מונים ושני מכנים (📑ב#17 · §🧾ח8-6)', () => {
  // המספרים: 144 מתוך 163 ⇒ 88.3% · 163 מתוך 217 ⇒ 75.1%
  // (`signoff-baseline` · `cards-customers.md` §③ מ20, נמדד 10/09/2026).
  it('שיעור המרוצים = משובים בציון 4–5 חלקי כל מי שמילא', () => {
    expect(satisfiedShare({ satisfiedCount: 144, completedCount: 163 })).toBeCloseTo(88.3, 1)
  })

  it('אשתקד באותו טווח: 107 מתוך 132 ⇒ 81.1%', () => {
    expect(satisfiedShare({ satisfiedCount: 107, completedCount: 132 })).toBeCloseTo(81.1, 1)
  })

  it('שיעור המענה = מילאו חלקי (מילאו + נשלחו ולא נענו); "לא נשלח" אינו במכנה', () => {
    expect(responseRate({ completedCount: 163, noResponseCount: 54 })).toBeCloseTo(75.1, 1)
    expect(responseRate({ completedCount: 132, noResponseCount: 46 })).toBeCloseTo(74.2, 1)
  })

  it('מכנה אפס ⇒ null ולא 0% — "אין משובים" אינו "אף אחד לא מרוצה"', () => {
    expect(satisfiedShare({ satisfiedCount: 0, completedCount: 0 })).toBeNull()
    expect(responseRate({ completedCount: 0, noResponseCount: 0 })).toBeNull()
  })
})

describe('היסטוגרמת-הקצב — רוחב-דלי 30, הדלי האחרון פתוח (📑ב#18)', () => {
  it('הגבול שייך לדלי התחתון: 30 בדלי הראשון, 31 בשני, 60 בשני', () => {
    const buckets = cadenceHistogram([0, 30, 31, 60, 61], { bucketWidth: 30, bucketCount: 7 })
    expect(buckets[0].count).toBe(2) // 0 · 30
    expect(buckets[1].count).toBe(2) // 31 · 60
    expect(buckets[2].count).toBe(1) // 61
  })

  it('הדלי האחרון פתוח וסופר כל מה שמעליו — 503 הימים שנמדדו נכנסים אליו', () => {
    const buckets = cadenceHistogram([181, 503], { bucketWidth: 30, bucketCount: 7 })
    expect(buckets[6].open).toBe(true)
    expect(buckets[6].count).toBe(2)
  })

  it('סך הספירות שווה למספר המרווחים — אין מרווח שנופל בין הדליים', () => {
    const gaps = [0, 1, 29, 30, 31, 59, 60, 90, 120, 150, 180, 181, 400]
    const total = cadenceHistogram(gaps, { bucketWidth: 30, bucketCount: 7 }).reduce(
      (sum, b) => sum + b.count,
      0,
    )
    expect(total).toBe(gaps.length)
  })

  it('התווית נוקבת ברוחב-הדלי במפורש, כי בלעדיה המספר אינו בר-קריאה', () => {
    const buckets = cadenceHistogram([], { bucketWidth: 30, bucketCount: 7 })
    expect(buckets[0].label).toBe('0–30')
    expect(buckets[1].label).toBe('31–60')
    expect(buckets[6].label).toBe('181+')
  })
})

describe('מטריצת ההסכמה אדם↔מודל — צד שלילי וצד חיובי בנפרד (ת2 · 📑ב#20)', () => {
  const ROWS = [
    { humanTags: ['אחר'], modelTopics: ['ניהול לקוי'], unclassifiable: false },
    { humanTags: ['אחר'], modelTopics: ['ניהול לקוי'], unclassifiable: false },
    { humanTags: ['אחר'], modelTopics: [], unclassifiable: true },
    { humanTags: ['איכות תגים'], modelTopics: ['איכות תגים'], unclassifiable: false },
  ]

  it('שורה לכל תגית-לקוח שקיימת בפועל, עם המכנה שלה', () => {
    const matrix = agreementMatrix(ROWS, { side: 'negative' })
    const other = matrix.find((row) => row.humanTag === 'אחר')
    expect(other.total).toBe(3)
    expect(other.byTopic['ניהול לקוי']).toBe(2)
    expect(other.unclassifiable).toBe(1)
  })

  it('הסכמה = אותה קטגוריה משני הצדדים', () => {
    const matrix = agreementMatrix(ROWS, { side: 'negative' })
    expect(matrix.find((row) => row.humanTag === 'איכות תגים').agreed).toBe(1)
    expect(matrix.find((row) => row.humanTag === 'אחר').agreed).toBe(0)
  })

  it('"אחר" אחרון תמיד, גם כשהוא הגדול (📐7)', () => {
    const matrix = agreementMatrix(ROWS, { side: 'negative' })
    expect(matrix[matrix.length - 1].humanTag).toBe('אחר')
  })

  it('הצד החיובי משתמש ברשימה החיובית — "אחר" קיים בשתיהן ואינו מתערבב', () => {
    const matrix = agreementMatrix(
      [
        {
          humanTags: ['מקצועיות הדיילות'],
          modelTopics: ['מקצועיות הדיילות'],
          unclassifiable: false,
        },
      ],
      { side: 'positive' },
    )
    expect(matrix).toHaveLength(1)
    expect(matrix[0].agreed).toBe(1)
  })

  it('תגית שאינה ברשימה הסגורה אינה מייצרת שורה שישית', () => {
    const matrix = agreementMatrix([{ humanTags: ['משהו אחר לגמרי'], modelTopics: [] }], {
      side: 'negative',
    })
    expect(matrix).toEqual([])
  })

  it('בלי שורות ⇒ מערך ריק, ולא מטריצה של אפסים שנקראת "אין בעיות"', () => {
    expect(agreementMatrix([], { side: 'negative' })).toEqual([])
  })
})

describe('קצב-התשלום לפי סוג-לקוח — התווית מהקוד, לא מתורגמת מחדש (מ19 אריח ④)', () => {
  // ‏69 · 46 · 34 · 31 ימים, נמדד 10/09/2026 (`cards-customers.md` §③ מ19).
  const ROWS = [
    { customer_type: 'private_company', median_days: 34, invoice_count: 503, customer_count: 33 },
    { customer_type: 'government', median_days: 69, invoice_count: 51, customer_count: 6 },
    { customer_type: 'production_company', median_days: 31, invoice_count: 99, customer_count: 12 },
    { customer_type: 'nonprofit', median_days: 46, invoice_count: 22, customer_count: 3 },
  ]

  it('ממוין לפי המדד המוצג — האיטי ראשון (📐7)', () => {
    expect(paymentCadenceRows(ROWS).map((row) => row.medianDays)).toEqual([69, 46, 34, 31])
  })

  it('התווית נלקחת מ-CUSTOMER_TYPE_LABELS ולא נכתבת שוב (כלל 14)', () => {
    expect(paymentCadenceRows(ROWS)[0].label).toBe('חברה ממשלתית')
    expect(paymentCadenceRows(ROWS)[3].label).toBe('חברת הפקה')
  })

  it('סוג שאינו במילון נשאר עם המפתח שלו ואינו נעלם בשקט', () => {
    const rows = paymentCadenceRows([{ customer_type: 'unknown_kind', median_days: 5 }])
    expect(rows[0].label).toBe('unknown_kind')
  })

  it('סוג בלי חשבוניות ששולמו אינו בשורה (cards-customers ① מ19)', () => {
    expect(paymentCadenceRows([{ customer_type: 'nonprofit', median_days: null }])).toEqual([])
  })
})
