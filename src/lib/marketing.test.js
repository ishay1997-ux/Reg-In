import { describe, it, expect } from 'vitest'
import {
  buildMarketingMailtoHref,
  dedupeEmails,
  disabledSendReason,
  isMailtoTooLong,
  marketingPreviewKind,
  selectRecipients,
} from './marketing'

// עוזר-בנייה לשורת-נמען (override נקודתי לכל תרחיש).
// 🔴 שונה 02/09/2026 — והשינוי הזה הוא הלקח, לא הפרט. הפיקסטורה הייתה **שטוחה**
// (`email` ו-`contact_name` ישירות על הלקוח), בעוד `getConsentedCustomers` עברה מזמן
// לאמבד `customer_contacts(...)`. ⇒ **הבדיקות רצו מול צורת-נתונים שאינה קיימת בייצור**,
// ולכן עברו בירוק בזמן ש-`dedupeEmails` החזירה `[undefined]` והדיוור נשלח לאף אחד.
// 🔑 **פיקסטורה שאינה תואמת את ה-`select` האמיתי אינה רשת-ביטחון — היא חותמת-גומי.**
// המבנה כאן משקף מילה-במילה את מה ש-`getConsentedCustomers` מחזירה
// (`src/modules/02_customers/api.js`, קבוע `PRIMARY_CONTACT_EMBED`).
// ⚠️ ה-override נשאר **שטוח בכוונה** (`r({ email: 'x' })`) כדי שהבדיקות יישארו קריאות —
// העוזר הוא שמרכיב ממנו את השורה המקוננת. אין כאן קיצור-דרך: `dedupeEmails` עדיין חייבת
// לעבור דרך `primaryContact`, אחרת היא תקבל `undefined` בדיוק כמו בייצור.
const r = ({ contact_name = 'דנה כהן', email = 'dana@alpha.co.il', ...over } = {}) => ({
  customer_id: 1,
  company_name: 'טכנולוגיות אלפא',
  customer_type: 'private_company',
  discount_percent: 0,
  customer_contacts: [
    { contact_id: 101, contact_name, phone: '050-1112223', email, is_primary: true },
  ],
  ...over,
})

describe('disabledSendReason — סיבת-השבתת כפתור השליחה', () => {
  it('בלי קובץ ⇒ "יש להעלות קובץ תחילה" — קודם לכל סיבה אחרת', () => {
    // גם כשיש נמענים מסומנים, חוסר-הקובץ הוא הסיבה שמוצגת
    expect(disabledSendReason({ hasFile: false, selectedCount: 5, consentedCount: 5 })).toBe(
      'יש להעלות קובץ תחילה',
    )
  })

  it('אין לקוחות מאושרים כלל ⇒ "אין לקוחות שאישרו דיוור"', () => {
    expect(disabledSendReason({ hasFile: true, selectedCount: 0, consentedCount: 0 })).toBe(
      'אין לקוחות שאישרו דיוור',
    )
  })

  it('יש מאושרים אך כולם הוסרו לשליחה הזו ⇒ "לא נבחרו נמענים לשליחה"', () => {
    // ההבחנה חשובה: הפעולה המתקנת שונה (רשימת-הלקוחות מול הצ'קבוקסים כאן)
    expect(disabledSendReason({ hasFile: true, selectedCount: 0, consentedCount: 3 })).toBe(
      'לא נבחרו נמענים לשליחה',
    )
  })

  it('יש קובץ ויש נמענים ⇒ הודעת ה-mailto-הארוך (הסיבה הנותרת היחידה)', () => {
    expect(disabledSendReason({ hasFile: true, selectedCount: 60, consentedCount: 60 })).toBe(
      'רשימת הנמענים ארוכה מדי — השתמשו בהעתקה',
    )
  })

  it('המחרוזת זהה-בייט לחוזה ה-title — המקף הוא U+2014, לא מקף רגיל', () => {
    const msg = disabledSendReason({ hasFile: true, selectedCount: 1, consentedCount: 1 })
    expect(msg).toContain('—')
    expect(msg).not.toContain('-')
  })
})

describe('buildMarketingMailtoHref — בניית ה-mailto', () => {
  it('בלי קובץ ⇒ מחרוזת ריקה (אין href לעוגן)', () => {
    expect(
      buildMarketingMailtoHref({
        hasFile: false,
        publicUrl: 'https://x/y.pdf',
        bccEmails: ['a@b'],
      }),
    ).toBe('')
  })

  it('בונה mailto:?bcc=…&subject=…&body=… בסדר הזה', () => {
    const href = buildMarketingMailtoHref({
      hasFile: true,
      publicUrl: 'https://x/y.pdf',
      bccEmails: ['a@b.co.il'],
    })
    expect(href.startsWith('mailto:?bcc=')).toBe(true)
    expect(href.indexOf('&subject=')).toBeGreaterThan(href.indexOf('bcc='))
    expect(href.indexOf('&body=')).toBeGreaterThan(href.indexOf('&subject='))
  })

  it('מקודד & ו-? שבתוך הקישור הציבורי (load-bearing — אחרת גוף ההודעה נקטע)', () => {
    const href = buildMarketingMailtoHref({
      hasFile: true,
      publicUrl: 'https://x/y.pdf?token=1&v=2',
      bccEmails: ['a@b.co.il'],
    })
    expect(href).toContain('%3F') // ? מקודד
    expect(href).toContain('%26') // & מקודד
    // רק שני ה-& המבניים של ה-mailto עצמו נשארים גולמיים
    expect(href.split('&').length - 1).toBe(2)
  })

  it('רשימת ה-BCC מופרדת בפסיקים ומקודדת כיחידה אחת', () => {
    const href = buildMarketingMailtoHref({
      hasFile: true,
      publicUrl: 'https://x/y.pdf',
      bccEmails: ['a@b.co.il', 'c@d.co.il'],
    })
    expect(href).toContain(encodeURIComponent('a@b.co.il,c@d.co.il'))
  })

  it('בלי נמענים ⇒ bcc ריק אך ה-href עדיין נבנה (כמו היום)', () => {
    const href = buildMarketingMailtoHref({
      hasFile: true,
      publicUrl: 'https://x/y.pdf',
      bccEmails: [],
    })
    expect(href.startsWith('mailto:?bcc=&subject=')).toBe(true)
  })

  it('נושא הדיוור הוא SSOT יחיד — "חומר שיווקי מ-REG-IN"', () => {
    const href = buildMarketingMailtoHref({
      hasFile: true,
      publicUrl: 'https://x/y.pdf',
      bccEmails: [],
    })
    expect(href).toContain(encodeURIComponent('חומר שיווקי מ-REG-IN'))
  })
})

describe('isMailtoTooLong — סף הקיטוע-השקט', () => {
  it('href קצר ⇒ false', () => {
    expect(isMailtoTooLong('mailto:?bcc=a@b')).toBe(false)
  })

  it('מחרוזת ריקה ⇒ false', () => {
    expect(isMailtoTooLong('')).toBe(false)
  })

  it('בדיוק 1900 תווים ⇒ false (הסף עצמו מותר)', () => {
    expect(isMailtoTooLong('x'.repeat(1900))).toBe(false)
  })

  it('1901 תווים ⇒ true', () => {
    expect(isMailtoTooLong('x'.repeat(1901))).toBe(true)
  })
})

describe('marketingPreviewKind — סוג התצוגה-המקדימה לפי MIME', () => {
  it("image/jpeg ו-image/png ⇒ 'image'", () => {
    expect(marketingPreviewKind('image/jpeg')).toBe('image')
    expect(marketingPreviewKind('image/png')).toBe('image')
  })

  it("application/pdf ⇒ 'pdf'", () => {
    expect(marketingPreviewKind('application/pdf')).toBe('pdf')
  })

  it("כל image/* ⇒ 'image' (התנהגות startsWith המקורית)", () => {
    expect(marketingPreviewKind('image/webp')).toBe('image')
  })

  it("undefined/null/סוג לא-נתמך ⇒ '' — בלי תצוגה מקדימה", () => {
    expect(marketingPreviewKind(undefined)).toBe('')
    expect(marketingPreviewKind(null)).toBe('')
    expect(marketingPreviewKind('text/plain')).toBe('')
  })
})

describe('selectRecipients — החרגות פר-שליחה (§Q3)', () => {
  it('Set ריק ⇒ כל הרשימה', () => {
    const rows = [r({ customer_id: 1 }), r({ customer_id: 2 })]
    expect(selectRecipients(rows, new Set())).toHaveLength(2)
  })

  it('מחריג לפי customer_id בלבד', () => {
    const rows = [r({ customer_id: 1 }), r({ customer_id: 2 })]
    expect(selectRecipients(rows, new Set([1])).map((x) => x.customer_id)).toEqual([2])
  })

  it('לא משנה את המערך המקורי (עותק חדש)', () => {
    const rows = [r({ customer_id: 1 }), r({ customer_id: 2 })]
    selectRecipients(rows, new Set([1]))
    expect(rows).toHaveLength(2)
  })

  it('רשימה ריקה ⇒ []', () => {
    expect(selectRecipients([], new Set([1]))).toEqual([])
  })
})

describe('dedupeEmails — BCC ייחודי (email אינו UNIQUE §7.65)', () => {
  it('שתי שורות-לקוח שונות עם אותו אימייל ⇒ כתובת אחת', () => {
    const rows = [
      r({ customer_id: 1, email: 'same@x.co.il' }),
      r({ customer_id: 2, email: 'same@x.co.il' }),
    ]
    expect(dedupeEmails(rows)).toEqual(['same@x.co.il'])
  })

  it('שומר את סדר-ההופעה הראשון', () => {
    const rows = [
      r({ customer_id: 1, email: 'b@x.co.il' }),
      r({ customer_id: 2, email: 'a@x.co.il' }),
      r({ customer_id: 3, email: 'b@x.co.il' }),
    ]
    expect(dedupeEmails(rows)).toEqual(['b@x.co.il', 'a@x.co.il'])
  })

  // 🔴 שלוש הבדיקות הבאות נוספו 02/09/2026 אחרי שהתקלה כבר קרתה בייצור. הן קיימות
  // כדי שהיא לא תוכל לחזור בשקט — כל אחת נופלת אם מישהו יחזיר קריאה שטוחה.
  it('לקוח שאיש-הקשר הראשי שלו בלי אימייל — אינו נספר כנמען', () => {
    // בלי filter(Boolean) הוא היה מגיע ל-BCC כמחרוזת "undefined" ומרעיל את כל השליחה.
    const rows = [r({ customer_id: 1, email: 'real@x.co.il' }), r({ customer_id: 2, email: null })]
    expect(dedupeEmails(rows)).toEqual(['real@x.co.il'])
  })

  it('לקוח בלי שורות אנשי-קשר כלל — אינו מפיל ואינו נספר', () => {
    const rows = [r({ customer_id: 1, email: 'real@x.co.il' }), { customer_id: 2 }]
    expect(dedupeEmails(rows)).toEqual(['real@x.co.il'])
  })

  it('הכתובת נלקחת מהראשי בלבד — לא מאיש-קשר נוסף', () => {
    // הבדיקה שתופסת מימוש שמשטח את כל אנשי-הקשר במקום לבחור את הראשי. השני מוזרק
    // ראשון במערך בכוונה: `find` על is_primary חייב לגבור על "הראשון ברשימה".
    const row = r()
    row.customer_contacts = [
      {
        contact_id: 9,
        contact_name: 'משני',
        phone: null,
        email: 'wrong@x.co.il',
        is_primary: false,
      },
      ...row.customer_contacts,
    ]
    expect(dedupeEmails([row])).toEqual(['dana@alpha.co.il'])
  })

  it('רשימה ריקה ⇒ []', () => {
    expect(dedupeEmails([])).toEqual([])
  })
})
