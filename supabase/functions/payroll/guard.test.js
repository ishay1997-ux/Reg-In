// @vitest-environment node
// שומר-הנמענים (חוזה D11 + F13): מי נמסר כפי שהוא, מי מופנה לכתובת של ישי, ומה חוסם שליחה.
// F13: ההפניה אינה נראית במייל — השומר מחליף רק את הנמען, ואין בו שום כלי לשנות נושא או גוף.
// ועוד: שני העותקים של הקובץ (`payroll` ו-`send-email`) זהים בבתים — כל פונקציה נפרסת לבדה.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as guard from './guard.ts'

const { OWNER_ADDRESS, GuardError, guardRecipient } = guard

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

describe('F13 — ההפניה אינה נראית במייל', () => {
  it('השומר מייצא רק את הכתובת, השגיאה ו-guardRecipient — אין כלי לשנות נושא או גוף', () => {
    expect(Object.keys(guard).sort()).toEqual(['GuardError', 'OWNER_ADDRESS', 'guardRecipient'])
  })

  it('בקוד השומר אין שום נוסח של הודעת-בדיקה או תגית-הפניה', () => {
    const source = readFileSync(fileURLToPath(new URL('./guard.ts', import.meta.url)), 'utf8')
    const NL = String.fromCharCode(10)
    const code = source
      .split(NL)
      .filter((line) => !line.trim().startsWith('//'))
      .join(NL)
    expect(code).not.toMatch(/הודעת בדיקה|הופנה|כתובת הבדיקה/)
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
