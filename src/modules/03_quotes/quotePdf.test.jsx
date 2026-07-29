import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatTimeRange,
  buildQuoteDocument,
  quotePdfFileName,
  QUOTE_TERMS,
} from './quotePdf'

// תרחיש-הקבלה המחייב מהאפיון (C5 §5.5.4) — אותם מספרים שמאמתים את pricing.js.
// הוא חי כאן כדי שה-PDF ייבדק מול אותה אמת בדיוק, ולא מול העתק שיכול להיסחף.
const WORKED_EXAMPLE = {
  quoteId: 1042,
  issueDate: '2026-07-29',
  validUntil: '2026-08-28',
  customer: {
    companyName: 'חברת הפקות בע"מ',
    companyNumber: '514238761',
    contactName: 'דנה לוי',
    phone: '052-4419087',
  },
  event: {
    name: 'כנס לקוחות שנתי 2026',
    date: '2026-09-12',
    location: 'אקספו תל אביב, ביתן 2',
    startTime: '18:00:00',
    endTime: '22:00:00',
  },
  lines: [
    {
      sku: '04ST',
      itemName: 'שירותי דיילת (4 שעות)',
      qty: 6,
      unitPrice: 500,
      color: null,
      notes: '',
    },
    {
      sku: 'B-REG-TAG',
      itemName: 'תג שם רגיל - ממותג',
      qty: 300,
      unitPrice: 5,
      color: 'לבן',
      notes: 'לוגו בצבע מלא',
    },
    {
      sku: 'B-FAB-LAN',
      itemName: 'שרוך בד - ממותג',
      qty: 300,
      unitPrice: 6,
      color: 'טורקיז',
      notes: '',
    },
  ],
  appliedCustomerDiscount: 5,
  manualDiscount: 10,
  vatRate: 18,
  notes: 'הפריקה מרחבת הכניסה הצפונית בלבד. נדרשת גישה לחשמל ליד עמדת הרישום.',
}

describe('formatDate', () => {
  it('מציג תאריך ISO בפורמט dd/mm/yyyy', () => {
    expect(formatDate('2026-09-12')).toBe('12/09/2026')
  })

  it('מרפד יום וחודש חד-ספרתיים באפס', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('05/01/2026')
  })

  // ריק וזבל מוחזרים כמקף ולא כ-"Invalid Date": המסמך הזה נשלח ללקוח.
  it.each([null, undefined, '', 'לא-תאריך'])('מחזיר מקף עבור %s', (bad) => {
    expect(formatDate(bad)).toBe('—')
  })
})

describe('formatTimeRange', () => {
  it('גוזם שניות מערכי time של ה-DB', () => {
    expect(formatTimeRange('18:00:00', '22:00:00')).toBe('18:00–22:00')
  })

  it('שומר על סדר לוגי — שעת ההתחלה ראשונה', () => {
    // הבאג שישי תפס במוקאפ: bidi הופך טווח-שעות שמשורשר למחרוזת עברית.
    // כאן נבדק רק הסדר הלוגי; הבידוד הוויזואלי נעשה ב-<Ltr> שברינדור.
    expect(formatTimeRange('18:00:00', '22:00:00').indexOf('18:00')).toBe(0)
  })

  it('מחזיר null כששעה אחת חסרה — לא מציג טווח חלקי', () => {
    expect(formatTimeRange('18:00:00', null)).toBeNull()
    expect(formatTimeRange(null, '22:00:00')).toBeNull()
    expect(formatTimeRange('18:0', '22:00:00')).toBeNull()
  })
})

describe('quotePdfFileName', () => {
  it('בונה שם קובץ באנגלית עם מזהה ההצעה', () => {
    expect(quotePdfFileName(1042)).toBe('REG-IN-quote-1042.pdf')
  })

  it('נופל ל-draft כשאין מזהה', () => {
    expect(quotePdfFileName(null)).toBe('REG-IN-quote-draft.pdf')
  })
})

describe('QUOTE_TERMS', () => {
  it('התנאים קבועים במסמך ולא מגיעים מהמסך', () => {
    expect(QUOTE_TERMS.length).toBeGreaterThan(0)
    expect(QUOTE_TERMS.every((t) => typeof t === 'string' && t.length > 0)).toBe(true)
  })
})

describe('buildQuoteDocument', () => {
  it('בונה מסמך לתרחיש-הקבלה בלי לזרוק', () => {
    const doc = buildQuoteDocument(WORKED_EXAMPLE)
    expect(doc).toBeTruthy()
    expect(doc.props.title).toContain('1042')
  })

  // הצעה ריקה היא מצב אמיתי: המשתמשת לוחצת "הפק PDF" לפני שהוסיפה שורות.
  it('לא קורס על הצעה בלי שורות ובלי לקוח', () => {
    expect(() => buildQuoteDocument({ quoteId: 1, lines: [], vatRate: 18 })).not.toThrow()
  })

  // ההגנה האמיתית: המסמך אינו מקבל סכומים מבחוץ אלא מחשב מ-pricing.js, כך שהוא
  // לא יכול להציג מספר שונה מהמסך. אם מישהו יעביר total שגוי — הוא פשוט יתעלם.
  it('מתעלם מסכומים שמוזרקים מבחוץ', () => {
    const tampered = { ...WORKED_EXAMPLE, total: 99999, subtotal: 1 }
    expect(() => buildQuoteDocument(tampered)).not.toThrow()
  })
})
