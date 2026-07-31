import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatTimeRange,
  buildQuoteDocument,
  quotePdfFileName,
  QUOTE_TERMS,
  MISSING_VAT_CODE,
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

// אוסף כל מחרוזת שמופיעה בעץ-האלמנטים של המסמך. ‏@react-pdf בונה עץ React רגיל, ולכן
// אפשר לאמת **תוכן שמודפס ללקוח** בלי לרנדר PDF אמיתי ובלי לחלץ טקסט מבייטים.
function collectStrings(node, out = []) {
  if (node === null || node === undefined || typeof node === 'boolean') return out
  if (typeof node === 'string' || typeof node === 'number') {
    out.push(String(node))
    return out
  }
  if (Array.isArray(node)) {
    for (const child of node) collectStrings(child, out)
    return out
  }
  // ⚠️ לא רק `children`: שורות-הסיכום מקבלות את הטקסט כ-props (`label` / `value`) לרכיב
  // ‏`TotalRow`, שאינו מורץ בעץ הזה. סריקת children בלבד הייתה מפספסת בדיוק את תווית
  // המע"מ — כלומר את הדבר היחיד שהבדיקה הזו קיימת בשבילו.
  if (node.props) {
    for (const [key, value] of Object.entries(node.props)) {
      if (key === 'style' || key === 'src') continue
      collectStrings(value, out)
    }
  }
  return out
}

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
  // ⚠️ **הבדיקה הזו אימתה `not.toThrow()` בלבד עד 31/07/2026 (סבב F)** — ולכן היא הייתה
  // נשארת ירוקה גם אם ההתעלמות מפסיקה לעבוד ו-99,999 ₪ מודפס ללקוח משלם. "לא זרק" מוכיח
  // שהמסמך **נבנה**, לא שהוא בנוי נכון. מכאן והלאה נבדק **מה כתוב בו**.
  it('מתעלם מסכומים שמוזרקים מבחוץ — ומדפיס את המספרים שהוא חישב בעצמו', () => {
    const tampered = { ...WORKED_EXAMPLE, total: 99999, subtotal: 1 }
    expect(() => buildQuoteDocument(tampered)).not.toThrow()

    const texts = collectStrings(buildQuoteDocument(tampered))
    // אותם מספרים בדיוק כמו בהצעה הנקייה — כלומר ההזרקה לא נגעה בשום דבר.
    expect(texts).toContain('5,355 ₪')
    expect(texts).toContain('964 ₪')
    expect(texts).toContain('6,319 ₪')
    // ומה שהוזרק **אינו** במסמך, בשתי הצורות שבהן הוא היה יכול להופיע:
    // מעוצב דרך אותו מעצב-סכומים, או גולמי אילו הודפס כמו-שהוא.
    expect(texts).not.toContain('99,999 ₪')
    expect(texts.join('|')).not.toContain('99999')
  })
})

// ⚠️ **הבדיקות האלה קיימות כדי להיכשל, לא כדי לעבור.** עד 31/07/2026 היה כאן
// `quote?.vatRate ?? 0`, ושתי הבדיקות שמעל מעבירות `vatRate: 18` מפורש — כלומר המסלול
// של "מע"מ חסר" לא נבדק מעולם, ו-`not.toThrow()` היה עובר גם על קוד שמדפיס ללקוח
// משלם "מע"מ (0%)". מסמך שגוי שנראה תקין גרוע ממסמך שלא הופק.
describe('buildQuoteDocument — שומר המע"מ', () => {
  // כל צורה שבה שורת `אחוז_מעמ` יכולה להיעדר בפועל: נמחקה (undefined), שונתה-שם
  // (undefined), נשמרה ריקה (''), הוקלד בה טקסט, או ערך מחוץ לטווח חוקי.
  it.each([
    ['null — הפרמטר לא נטען', null],
    ['undefined — השורה נמחקה או שונתה-שם', undefined],
    ['מחרוזת ריקה — השורה נשמרה ריקה', ''],
    ['טקסט שאינו מספר', 'שמונה עשרה'],
    ['מעל 100%', 101],
    ['שלילי', -1],
  ])('מסרב להפיק מסמך כששיעור המע"מ %s', (_label, vatRate) => {
    expect(() => buildQuoteDocument({ ...WORKED_EXAMPLE, vatRate })).toThrow()
  })

  it('מסרב גם כשהמפתח vatRate נעדר לגמרי מה-object', () => {
    const withoutVat = { ...WORKED_EXAMPLE }
    delete withoutVat.vatRate
    expect(() => buildQuoteDocument(withoutVat)).toThrow()
  })

  // הקוד הזה הוא **חוזה** מול QuoteDocumentDialog: הוא מה שמבדיל בין ההודעה שאומרת
  // מה לתקן לבין "הפקת המסמך נכשלה" הכללית. שינוי שמו שובר את החלון בלי שגיאת-בנייה.
  it('נושא את קוד-השגיאה MISSING_VAT ואת ההודעה שאומרת מה לתקן', () => {
    let caught = null
    try {
      buildQuoteDocument({ ...WORKED_EXAMPLE, vatRate: null })
    } catch (err) {
      caught = err
    }
    expect(caught?.code).toBe(MISSING_VAT_CODE)
    expect(caught?.message).toContain('אחוז_מעמ')
  })

  // הצד השני של השומר: 0% הוא ערך **חוקי** ולא "חסר". פטור-ממע"מ הוא מצב אמיתי,
  // והשומר לא אמור לחסום אותו — רק את מה שלא ידוע.
  it('מקבל 0% כשיעור חוקי ואינו מבלבל אותו עם "חסר"', () => {
    expect(() => buildQuoteDocument({ ...WORKED_EXAMPLE, vatRate: 0 })).not.toThrow()
  })

  // ⚠️ **הצד השני של המטבע, וזה מה שבאמת נשלח ללקוח.** כל הבדיקות שמעל מוכיחות שהמסמך
  // **אינו** נוצר כשהמע"מ חסר. אף אחת מהן אינה מוכיחה שכשהוא כן קיים — המספר הנכון
  // מודפס. בלי זה, שומר שהיה מקבע בטעות 0% היה עובר את כל החבילה בירוק.
  it('מדפיס את שיעור המע"מ האמיתי בתווית ואת הסכום הנכון', () => {
    const texts = collectStrings(buildQuoteDocument(WORKED_EXAMPLE))
    expect(texts).toContain('מע"מ (18%)')
    // תרחיש-הקבלה של האפיון, אותם מספרים בדיוק כמו ב-pricing.test.js:
    // 6,300 לפני הנחה ⇒ 5,355 לפני מע"מ ⇒ 964 מע"מ ⇒ **6,319 ₪** סופי.
    expect(texts).toContain('5,355 ₪')
    expect(texts).toContain('964 ₪')
    expect(texts).toContain('6,319 ₪')
    // ולא — התווית של הבאג הישן.
    expect(texts).not.toContain('מע"מ (0%)')
  })

  it('שיעור 0% מודפס כ-0% ולא נעלם', () => {
    const texts = collectStrings(buildQuoteDocument({ ...WORKED_EXAMPLE, vatRate: 0 }))
    expect(texts).toContain('מע"מ (0%)')
  })
})
