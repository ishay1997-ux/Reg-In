// @vitest-environment node
// שומר-הנמענים (חוזה D11): מי נמסר כפי שהוא, מי מופנה לכתובת של ישי, ומה חוסם שליחה.
// ועוד: שני העותקים של הקובץ (`payroll` ו-`send-email`) זהים בבתים — כל פונקציה נפרסת לבדה.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  OWNER_ADDRESS,
  GuardError,
  applyRedirectNotice,
  applyRedirectNoticeHtml,
  guardRecipient,
  guardedSubject,
} from './guard.ts'

const LRI = String.fromCharCode(0x2066)
const PDI = String.fromCharCode(0x2069)

describe('guardRecipient — רשימת המותרים', () => {
  it.each([
    ['ishay1997@gmail.com'],
    ['Ishay1997@Gmail.com'],
    ['ISHAY1997@GMAIL.COM'],
    ['ishay1997+x@gmail.com'],
    ['ishay1997+payroll.test_1-a@gmail.com'],
  ])('%s נמסר לעצמו, בלי הפניה', (address) => {
    expect(guardRecipient(address)).toEqual({
      intended: address,
      delivered: address,
      redirected: false,
    })
  })

  it.each([
    ['ishay1997.x@gmail.com', 'נקודה בחלק המקומי — אינה הכתובת שהוכרעה'],
    ['evil@x.com', 'כתובת זרה'],
    ['accountant@office.co.il', 'כתובת רו"ח'],
    ['ishay1997@gmail.com.evil.com', 'סיומת מתחזה'],
    ['xishay1997@gmail.com', 'קידומת מתחזה'],
    ['ishay1997@googlemail.com', 'דומיין אחר'],
    [`ishay1997+${'a'.repeat(65)}@gmail.com`, 'תגית ארוכה מ-64'],
    ['ishay1997+@gmail.com', 'תגית ריקה'],
  ])('%s מופנה לכתובת של ישי (%s)', (address) => {
    expect(guardRecipient(address)).toEqual({
      intended: address,
      delivered: OWNER_ADDRESS,
      redirected: true,
    })
  })

  it('רווחים מסביב נחתכים לפני הבדיקה', () => {
    expect(guardRecipient('  evil@x.com ')).toEqual({
      intended: 'evil@x.com',
      delivered: OWNER_ADDRESS,
      redirected: true,
    })
  })

  it.each([
    [''],
    ['   '],
    ['not-an-address'],
    ['a@x.com,ishay1997@gmail.com'],
    ['a@x.com ishay1997@gmail.com'],
    ['ishay1997@gmail.com\nbcc@evil.com'],
    [null],
    [undefined],
  ])('%j — זורק RECIPIENT_INVALID (אין שליחה)', (address) => {
    expect(() => guardRecipient(address)).toThrow(GuardError)
    try {
      guardRecipient(address)
    } catch (err) {
      expect(err.code).toBe('RECIPIENT_INVALID')
    }
  })
})

describe('הודעת ההפניה והנושא', () => {
  const redirected = guardRecipient('evil@x.com')
  const direct = guardRecipient('ishay1997@gmail.com')

  it('גוף טקסט מופנה מקבל שורת הסבר בראשו', () => {
    expect(applyRedirectNotice('שלום', redirected)).toBe(
      'הודעת בדיקה: ההודעה נועדה ל־evil@x.com ונשלחה לכתובת הבדיקה בלבד.\n\nשלום',
    )
  })

  it('נושא מופנה מקבל תגית עם הכתובת המקורית', () => {
    expect(guardedSubject('דוח שכר דיילות — יולי 2026', redirected)).toBe(
      '[הופנה: evil@x.com] דוח שכר דיילות — יולי 2026',
    )
  })

  it('גוף HTML מופנה: הכתובת מוברחת ומבודדת כיוונית', () => {
    const g = guardRecipient('a<b>@x.com')
    const html = applyRedirectNoticeHtml('<div>גוף</div>', g)
    expect(html).toBe(
      `<div dir="rtl" style="text-align:right">הודעת בדיקה: ההודעה נועדה ל־${LRI}a&lt;b&gt;@x.com${PDI} ונשלחה לכתובת הבדיקה בלבד.</div><br><div>גוף</div>`,
    )
  })

  it('כתובת מותרת — שום שינוי בגוף או בנושא', () => {
    expect(applyRedirectNotice('שלום', direct)).toBe('שלום')
    expect(applyRedirectNoticeHtml('<div>x</div>', direct)).toBe('<div>x</div>')
    expect(guardedSubject('נושא', direct)).toBe('נושא')
  })
})

describe('שני עותקי השומר', () => {
  it('payroll/guard.ts ו-send-email/guard.ts זהים בבתים', () => {
    const a = readFileSync(fileURLToPath(new URL('./guard.ts', import.meta.url)))
    const b = readFileSync(fileURLToPath(new URL('../send-email/guard.ts', import.meta.url)))
    expect(a.length).toBeGreaterThan(0)
    expect(Buffer.compare(a, b)).toBe(0)
  })

  it('אין בשומר משתנה-סביבה או מתג שמרחיב את הרשימה', () => {
    const source = readFileSync(fileURLToPath(new URL('./guard.ts', import.meta.url)), 'utf8')
    expect(source).not.toMatch(/Deno\.env|process\.env/)
  })
})
