// בדיקות הלוגיקה הטהורה של לשונית הלוגיסטיקה (משטח 3) — נועלות: מיון "רחוק ממוכן תחילה",
// רק ready נספר, חשבון-ההנחה של האריח השלישי (חשבון 2.2, לא חשבון חדש), הסימן החתום,
// המבחין של שלושת מצבי-הריק, והדגל money_visible (לעולם לא price === null).
import { describe, it, expect } from 'vitest'
import {
  LOGISTICS_STATUS_LABELS,
  resolveLogisticsTone,
  sortLogisticsRows,
  readinessTileSub,
  readinessMetricBlocked,
  readyItemsCount,
  changesTileSub,
  signedShekelCents,
  signedDelta,
  moneyHidden,
  lastLogisticsChangeBySku,
  plannedChangeNote,
  changeRowsWithRanges,
  changesMoneySummary,
  countProductLines,
  LEGAL_EMPTY_TITLE,
  NO_PERMISSION_SENTENCE,
  BROKEN_EMPTY_DETAIL,
} from './projectLogistics'

describe('resolveLogisticsTone — תווית לא-ממופה צועקת ולא מאפירה', () => {
  it('מחזירה טון לכל אחת משלוש התוויות', () => {
    for (const label of Object.values(LOGISTICS_STATUS_LABELS)) {
      expect(typeof resolveLogisticsTone(label)).toBe('string')
    }
  })

  it('זורקת על תווית זרה — StatusTag היה מציג אפור בשקט', () => {
    expect(() => resolveLogisticsTone('בהזמנה')).toThrow('בהזמנה')
  })
})

describe('sortLogisticsRows — מה שרחוק ביותר ממוכן תחילה', () => {
  it('ready אחרון, not_started ראשון, ושובר-שוויון יציב לפי sku', () => {
    const rows = [
      { sku: 'A', serial_number: 1, item_status: 'ready' },
      { sku: 'C', serial_number: 1, item_status: 'not_started' },
      { sku: 'B', serial_number: 1, item_status: 'ordered' },
      { sku: 'A', serial_number: 2, item_status: 'not_started' },
    ]
    expect(sortLogisticsRows(rows).map((r) => `${r.sku}:${r.item_status}`)).toEqual([
      'A:not_started',
      'C:not_started',
      'B:ordered',
      'A:ready',
    ])
  })
})

describe('readinessTileSub — רק ready נספר (§1.3)', () => {
  it('אף פריט לא הוזמן ⇒ הנוסח של המוקאפ, בטון ענבר', () => {
    const rows = [{ item_status: 'not_started' }, { item_status: 'not_started' }]
    expect(readinessTileSub(rows)).toEqual({ text: 'טרם הוזמן אף פריט', tone: 'hint' })
  })

  it('פריט שהוזמן ולא הגיע זהה במדד לפריט שאיש לא נגע בו — ושונה בתג', () => {
    // ordered אינו נספר: 1 ready מתוך 3 ⇒ "2 פריטים טרם מוכנים", לא "1 טרם מוכן".
    const rows = [
      { item_status: 'ready' },
      { item_status: 'ordered' },
      { item_status: 'not_started' },
    ]
    expect(readinessTileSub(rows)).toEqual({ text: '2 פריטים טרם מוכנים', tone: 'hint' })
  })

  it('לשון-יחיד לפריט בודד, וסגירה מלאה היא עובדה רגועה', () => {
    expect(readinessTileSub([{ item_status: 'ready' }, { item_status: 'ordered' }])).toEqual({
      text: 'פריט אחד טרם מוכן',
      tone: 'hint',
    })
    expect(readinessTileSub([{ item_status: 'ready' }])).toEqual({ text: '✓ מוכן', tone: 'done' })
    expect(readinessTileSub([])).toEqual({ text: '✓ אין פריטים', tone: 'done' })
  })
})

describe('readyItemsCount — המונה של האריח ושורת-המשנה, ממקור אחד', () => {
  it('סופר רק ready — ordered ו-not_started אינם נספרים', () => {
    const rows = [
      { item_status: 'ready' },
      { item_status: 'ordered' },
      { item_status: 'not_started' },
      { item_status: 'ready' },
    ]
    expect(readyItemsCount(rows)).toBe(2)
    expect(readyItemsCount([])).toBe(0)
    expect(readyItemsCount(null)).toBe(0)
  })
})

describe('readinessMetricBlocked — מתי המדד מציג — ולעולם לא 0/0 (S-26)', () => {
  it('noPermission וגם broken חוסמים — רשימה ריקה לא-כדין אינה "0 מתוך 0 ✓"', () => {
    expect(readinessMetricBlocked('noPermission')).toBe(true)
    expect(readinessMetricBlocked('broken')).toBe(true)
  })

  it('legal וטבלה מאוכלסת (null) אינם חסומים', () => {
    expect(readinessMetricBlocked('legal')).toBe(false)
    expect(readinessMetricBlocked(null)).toBe(false)
  })
})

describe('changesTileSub — "האחרון היום, 09:15" בשעון ישראל', () => {
  it('שינוי מאותו יום-ישראל מקבל "האחרון היום" עם השעה', () => {
    const sub = changesTileSub('2026-08-13T06:15:00Z', '2026-08-13T12:00:00Z')
    expect(sub.prefix).toBe('האחרון היום, ')
    expect(sub.value).toBe('09:15') // ‏06:15Z = ‏09:15 בישראל (קיץ, UTC+3)
  })

  it('שינוי מיום אחר מקבל תאריך DD/MM', () => {
    const sub = changesTileSub('2026-08-11T11:22:00Z', '2026-08-13T12:00:00Z')
    expect(sub.prefix).toBe('האחרון ב-')
    expect(sub.value).toBe('11/08')
  })

  it('קלט לא-תקין ⇒ null, לא זריקה', () => {
    expect(changesTileSub(null, '2026-08-13T12:00:00Z')).toBeNull()
  })
})

describe('signedShekelCents — הסימן מהערך, הגודל מ-formatShekelCents', () => {
  it('חיובי מקבל +, שלילי מקבל −, אפס נשאר עובדה', () => {
    expect(signedShekelCents(85)).toBe('+85.00 ₪')
    expect(signedShekelCents(-300)).toBe('−300.00 ₪')
    expect(signedShekelCents(0)).toBe('0.00 ₪')
  })

  it('ערך לא-מספרי ⇒ מקף, לעולם לא 0', () => {
    expect(signedShekelCents(null)).toBe('—')
    expect(signedShekelCents(undefined)).toBe('—')
  })
})

describe('signedDelta — דלתא חתומה בלי ₪ (עמודת "השינוי" היא כמות, לא כסף)', () => {
  it('חיובי +, שלילי − (U+2212), אפס עובדה, ולא-מספרי מקף', () => {
    expect(signedDelta(80)).toBe('+80')
    expect(signedDelta(-50)).toBe('−50')
    expect(signedDelta(0)).toBe('0')
    expect(signedDelta('abc')).toBe('—')
  })
})

describe('moneyHidden — הדגל money_visible הוא המבחין, לא price === null', () => {
  it('שורה אחת עם money_visible=false מסתירה את כל הכסף', () => {
    expect(moneyHidden([{ money_visible: true }, { money_visible: false }])).toBe(true)
  })

  it('כולן true — או אין שורות בכלל — הכסף גלוי', () => {
    expect(moneyHidden([{ money_visible: true }])).toBe(false)
    expect(moneyHidden([])).toBe(false)
  })

  it('revenue_delta null עם money_visible=true אינו "חסום" — null חוקי גם כערך', () => {
    expect(moneyHidden([{ money_visible: true, revenue_delta: null }])).toBe(false)
  })
})

describe('plannedChangeNote — הוגדל=ענבר (יוצר חוסר) · הוקטן=אפור (עובדה)', () => {
  it('הגדלה: המקור הוא הנוכחי פחות הדלתא, והטון ענבר', () => {
    const note = plannedChangeNote(380, {
      delta_qty: 80,
      created_at: '2026-08-11T11:22:00Z',
    })
    expect(note).toMatchObject({ text: 'הוגדל מ-', previous: 300, tone: 'hint' })
    expect(note.dayMonth).toBe('11/08')
  })

  it('הקטנה: טון רגוע, לא ענבר', () => {
    const note = plannedChangeNote(250, {
      delta_qty: -50,
      created_at: '2026-08-13T06:15:00Z',
    })
    expect(note).toMatchObject({ text: 'הוקטן מ-', previous: 300, tone: 'calm' })
  })

  it('בלי שינוי — אין שורת-משנה בכלל', () => {
    expect(plannedChangeNote(300, undefined)).toBeNull()
  })
})

describe('changeRowsWithRanges — שחזור "300 → 380" לאחור מהערך הנוכחי', () => {
  it('שרשרת שינויים על אותו פריט נפרשת נכון מהחדש לישן', () => {
    // ‏desc: ‏+30 (אחרון, ליעד 380) ואז +50 (קודם, ליעד 350).
    const changes = [
      { change_id: 2, change_target: 'logistics', sku: 'TAG', delta_qty: 30 },
      { change_id: 1, change_target: 'logistics', sku: 'TAG', delta_qty: 50 },
    ]
    const ranged = changeRowsWithRanges(changes, { plannedBySku: new Map([['TAG', 380]]) })
    expect(ranged.map(({ from, to }) => `${from}→${to}`)).toEqual(['350→380', '300→350'])
  })

  it('שינוי כמות-דיילות נמדד מול required הנוכחי', () => {
    const changes = [{ change_id: 1, change_target: 'hostess_count', sku: null, delta_qty: 2 }]
    const [row] = changeRowsWithRanges(changes, { currentRequired: 8 })
    expect(row).toMatchObject({ from: 6, to: 8 })
  })

  it('פריט שאינו קריא (אין planned) ⇒ null-ים, לא NaN', () => {
    const changes = [{ change_id: 1, change_target: 'logistics', sku: 'GONE', delta_qty: 10 }]
    const [row] = changeRowsWithRanges(changes, { plannedBySku: new Map() })
    expect(row.from).toBeNull()
    expect(row.to).toBeNull()
  })
})

describe('changesMoneySummary — חשבון 2.2: סכום ⇒ הנחה, באגורות שלמות', () => {
  it('העוגן של המוקאפ: ‏+400 −300 בהנחת 5%+10% ⇒ ‏+100 לפני, ‏+85 אחרי', () => {
    const changes = [
      { delta_qty: 80, unit_price_snapshot: 5 },
      { delta_qty: -50, unit_price_snapshot: 6 },
    ]
    const meta = { applied_customer_discount: 5, manual_discount: 10 }
    expect(changesMoneySummary(changes, meta)).toEqual({
      preDiscount: 100,
      discountPercent: 15,
      afterDiscount: 85,
    })
  })

  it('בלי מטא-הצעה ההנחה 0 והסכום נשאר טרום-הנחה', () => {
    const changes = [{ delta_qty: 10, unit_price_snapshot: 5 }]
    expect(changesMoneySummary(changes, null)).toEqual({
      preDiscount: 50,
      discountPercent: 0,
      afterDiscount: 50,
    })
  })
})

describe('countProductLines — המבחין של שלושת מצבי-הריק (S-26)', () => {
  const products = [
    { sku: 'H-SRV', category: 'hostess' },
    { sku: 'TAG', category: 'product' },
  ]

  it('הצעה לא-קריאה ⇒ null — שני מצבים אינם יכולים לבטא שלוש סיטואציות', () => {
    expect(countProductLines(null, products)).toBeNull()
  })

  it('הצעת דיילות-בלבד ⇒ 0 ⇒ ריק כדין', () => {
    const quote = { quote_services: [{ sku: 'H-SRV' }] }
    expect(countProductLines(quote, products)).toBe(0)
  })

  it('הצעה עם שורות-מוצר ⇒ רשימה ריקה היא תקלה, לא מצב תקין', () => {
    const quote = { quote_services: [{ sku: 'H-SRV' }, { sku: 'TAG' }] }
    expect(countProductLines(quote, products)).toBe(1)
  })

  it('מק"ט שאינו בקטלוג נספר כמוצר — טעות לכיוון "תקלה", לא לכיוון "תקין"', () => {
    const quote = { quote_services: [{ sku: 'MYSTERY' }] }
    expect(countProductLines(quote, products)).toBe(1)
  })
})

describe('lastLogisticsChangeBySku — השינוי האחרון בלבד, פר-פריט', () => {
  it('הראשון בסדר-ה-desc מנצח, ושינויי כמות-דיילות אינם נכנסים', () => {
    const changes = [
      { change_id: 3, change_target: 'hostess_count', sku: null, delta_qty: 2 },
      { change_id: 2, change_target: 'logistics', sku: 'TAG', delta_qty: 30 },
      { change_id: 1, change_target: 'logistics', sku: 'TAG', delta_qty: 50 },
    ]
    const map = lastLogisticsChangeBySku(changes)
    expect(map.get('TAG').change_id).toBe(2)
    expect(map.size).toBe(1)
  })
})

describe('שלושת המשפטים של מצבי-הריק שונים זה מזה — S-26', () => {
  it('אין שני מצבים שחולקים משפט', () => {
    const sentences = [LEGAL_EMPTY_TITLE, NO_PERMISSION_SENTENCE, BROKEN_EMPTY_DETAIL]
    expect(new Set(sentences).size).toBe(3)
  })
})
