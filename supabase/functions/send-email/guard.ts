// שומר-הנמענים של מיילי השכר — **מקודד בקוד ולא בהגדרות, ובמכוון** (חוזה השכר D11).
//
// הכרעת-ישי 13.10.2026, מילה במילה: *"שליחת מיילים אמיתית לכתובת ishay1997@gmail.com בלבד"*.
// ⇒ כל כתובת שאינה של ישי נמסרת לכתובת שלו.
// ✏️ F13 (ישי, 14.10 00:40): *"אני לא יכול להציג ככה בכנס זה צריך להראות אמיתי"* — ההפניה נשארת
// כפויה, אבל **אינה נראית במייל**: בלי שורת-הסבר, בלי תגית בנושא, בלי אזכור כתובת בדיקה. המייל
// המופנה זהה בדיוק למייל שהיה יוצא לנמען המקורי, חוץ מה-To. למי נועד ולאן נמסר — נרשם רק במסד
// (`intended_recipient`, `delivered_recipient`, `redirected`).
//
// 🔒 **למה אין כאן משתנה-סביבה או פרמטר:** שער שאפשר להרחיב בהגדרה אחת הוא שער שנפתח בטעות.
// הסרת השומר היא שינוי-קוד מכוון שעובר ביקורת — לא מתג.
// 🔒 **ולמה שני עותקים זהים בבתים** (`payroll/guard.ts` ו-`send-email/guard.ts`): כל פונקציית-שרת
// נפרסת לבדה ואינה יכולה לייבא קובץ של אחותה. בדיקת-יחידה (`guard.test.js`) נכשלת אם השניים נפרדו.
//
// ⚠️ **כל חריגה כאן = אין שליחה.** הקוראים תופסים `GuardError` ומסיימים את הניסיון כ"נכשל" לפני
// שנגעו ברשת.

export const OWNER_ADDRESS = 'ishay1997@gmail.com'

// הכתובת של ישי, וגם ה-`+tag` שלה (Gmail מוסר אותו לאותה תיבה). ⚠️ **לא** `ishay1997.x@` — נקודה
// משנה את החלק המקומי, וזו כבר אינה הכתובת שהוכרעה; כתובת כזו מופנית כמו כל כתובת זרה.
const ALLOWED_RECIPIENT = /^ishay1997(\+[a-z0-9._-]{1,64})?@gmail\.com$/i

// מבנה בסיסי של כתובת אחת: בלי רווח, בלי שורה חדשה, @ אחד בלבד. רשימת כתובות ("a@x.com,b@y.com")
// נכשלת כאן, ולכן לא יכולה להחליק כ"כתובת אחת" לשום שלב אחרי השומר.
const SINGLE_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export class GuardError extends Error {
  code: string
  constructor(code: string) {
    super(code)
    this.name = 'GuardError'
    this.code = code
  }
}

export interface GuardResult {
  intended: string
  delivered: string
  redirected: boolean
}

export function guardRecipient(intended: string): GuardResult {
  const address = typeof intended === 'string' ? intended.trim() : ''
  if (!address || !SINGLE_ADDRESS.test(address)) throw new GuardError('RECIPIENT_INVALID')
  if (ALLOWED_RECIPIENT.test(address)) {
    return { intended: address, delivered: address, redirected: false }
  }
  return { intended: address, delivered: OWNER_ADDRESS, redirected: true }
}
