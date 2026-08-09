import { describe, it, expect } from 'vitest'
import {
  EMAIL_PAYLOAD_FIELDS,
  EMAIL_SEND_RESULT,
  EMAIL_SEND_TIMEOUT_MS,
  buildEmailPayload,
  classifySendError,
  emailSendDisabledReason,
  fillEmailTemplate,
  findUnknownPlaceholders,
  isAttachmentTooLarge,
  plainTextToEmailHtml,
  SEND_HISTORY_UNKNOWN_CONFIRM,
  SEND_HISTORY_UNKNOWN_NOTICE,
  SEND_LOG_FAILED_NOTICE,
  sendResultMessage,
} from '@/lib/email'

// ⚠️ **העתק מדויק של הערך שבמסד** (`תבנית_מייל_הצעת_מחיר`) אחרי מיגרציות 7 ו-9 — כדי
// שבדיקה תיפול אם שמות-ה-placeholders בתבנית ישתנו.
// ⚠️ **התיישן פעם אחת (30/07/2026)** אחרי מיגרציה 9 והפסיק להגן בשקט; כל מיגרציה שנוגעת
// בתבנית חייבת לעדכן גם את הקבוע הזה וגם את זה שב-`quotes.test.js`.
const QUOTE_TEMPLATE = `שלום [שם_איש_קשר],
בהמשך לפנייתך, מצורפת בזאת הצעת מחיר לאירוע '[שם_פרויקט]' המתוכנן להתקיים בתאריך [תאריך_אירוע].
ההצעה כוללת את מפרט הדיילות והשירותים שסיכמנו. לאישור ההצעה, אנא השב למייל זה או פנה אליי ישירות.
בברכה,
[חתימת_שולח]`

// ארבעת השדות של התבנית שבמסד. **חייבים להיות מלאים** — מאז ההגנה על שדה-לא-מוכר,
// מילוי חלקי מסרב לשלוח (וזה בדיוק מה שהפיל את הבדיקה הזו כשהיא נשארה עם 3 שדות).
const ALL_FIELDS = {
  '[שם_איש_קשר]': 'רון גל',
  '[שם_פרויקט]': 'כנס לקוחות שנתי',
  '[תאריך_אירוע]': '22/08/2026',
  '[חתימת_שולח]': 'ישי אטיאס | מנכ"ל, REG-IN',
}

describe('fillEmailTemplate — מילוי תבנית מ-params', () => {
  it('מחליף כל placeholder שהועבר לו', () => {
    const body = fillEmailTemplate(QUOTE_TEMPLATE, ALL_FIELDS)
    expect(body).toContain('שלום רון גל,')
    expect(body).toContain("לאירוע 'כנס לקוחות שנתי'")
    expect(body).toContain('בתאריך 22/08/2026')
    expect(body).toContain('ישי אטיאס | מנכ"ל, REG-IN')
  })

  it('לא נשאר אף placeholder בגוף שנשלח ללקוח', () => {
    const body = fillEmailTemplate(QUOTE_TEMPLATE, ALL_FIELDS)
    // ⚠️ הטענה על אורך היא **חלק מהבדיקה ולא קישוט**: בלעדיה מחרוזת ריקה עוברת את
    // `not.toMatch` באופן ריק, והבדיקה הייתה "ירוקה" גם כשהמנוע מסרב לשלוח.
    expect(body.length).toBeGreaterThan(50)
    expect(body).not.toMatch(/\[[^\]]+\]/)
  })

  it('תבנית חסרה ⇒ ריק, ולא מייל בלי גוף', () => {
    expect(fillEmailTemplate('', { '[שם_איש_קשר]': 'רון' })).toBe('')
    expect(fillEmailTemplate(null, { '[שם_איש_קשר]': 'רון' })).toBe('')
  })

  it('placeholder שמופיע פעמיים מוחלף בשני המקומות (split/join, לא regex)', () => {
    expect(fillEmailTemplate('שלום [א], שוב [א]', { '[א]': 'רון' })).toBe('שלום רון, שוב רון')
  })

  it('סוגריים מרובעים אינם שוברים את ההחלפה — הם תווים מיוחדים ב-regex', () => {
    expect(fillEmailTemplate('סכום: [סה"כ] ש"ח', { '[סה"כ]': '6,319' })).toBe('סכום: 6,319 ש"ח')
  })

  it('ערך חסר הופך למחרוזת ריקה ולא ל-"undefined" בגוף המייל', () => {
    expect(fillEmailTemplate('שלום [א]', { '[א]': undefined })).toBe('שלום ')
  })

  it('בלי מפת-החלפות ⇒ התבנית כמות-שהיא (לא קורס)', () => {
    expect(fillEmailTemplate('שלום', undefined)).toBe('שלום')
  })
})

describe('findUnknownPlaceholders — הגנה מפני עריכת-תבנית שהקוד לא מכיר', () => {
  // ⚠️ למה זה קיים: §7.70 קובע שבמודול 3 מכוונים פרמטרים **דרך ה-Table Editor** (מסך-הפרמטרים
  // הוא מ9), כלומר עריכת-תבנית ביד היא המסלול המתוכנן. שדה שיתווסף לתבנית ולא לקוד היה
  // נשלח ללקוח כסוגריים גולמיים — בלי שגיאה, בלי אזהרה, ובמסמך עסקי.
  const KNOWN = {
    '[שם_איש_קשר]': 'רון גל',
    '[שם_פרויקט]': 'כנס',
    '[תאריך_אירוע]': '22/08/2026',
    '[חתימת_שולח]': 'ישי אטיאס | מנכ"ל, REG-IN',
  }

  it('התבנית שבמסד היום — אפס שדות לא-מוכרים (אחרת השליחה חסומה בלי סיבה)', () => {
    expect(findUnknownPlaceholders(QUOTE_TEMPLATE, KNOWN)).toEqual([])
  })

  it('שדה שנוסף לתבנית ולא לקוד — מזוהה בשמו, כדי שאפשר יהיה לתקן', () => {
    expect(findUnknownPlaceholders('שלום [שם_חברה],', KNOWN)).toEqual(['[שם_חברה]'])
  })

  it('כמה שדות לא-מוכרים ⇒ כולם, בלי כפילויות', () => {
    expect(findUnknownPlaceholders('[א] ו-[ב] ושוב [א]', KNOWN)).toEqual(['[א]', '[ב]'])
  })

  // ⚠️ **הבדיקה שמנעה באג אמיתי:** כל לקוחות-הדמו נקראים "… בע\"מ [דמו]", ולקוח בלי
  // איש-קשר נופל לשם-החברה — כלומר סריקה על הגוף **אחרי** המילוי הייתה חוסמת שליחה
  // לכל לקוחות-הדמו. הסריקה חייבת לרוץ על **התבנית**, לפני שהערכים נכנסים.
  it('סוגריים בתוך ערך מוזרק אינם נחשבים placeholder — סורקים את התבנית, לא את התוצאה', () => {
    const withDemoName = { ...KNOWN, '[שם_איש_קשר]': 'מדיטק פתרונות בע"מ [דמו]' }
    expect(findUnknownPlaceholders(QUOTE_TEMPLATE, withDemoName)).toEqual([])
  })

  it('תבנית ריקה / חסרה ⇒ אין ממצאים (הטיפול בה הוא במקום אחר)', () => {
    expect(findUnknownPlaceholders('', KNOWN)).toEqual([])
    expect(findUnknownPlaceholders(null, KNOWN)).toEqual([])
  })

  it('סוגר בודד אינו placeholder', () => {
    expect(findUnknownPlaceholders('מחיר [ ללא סוגר סוגר', KNOWN)).toEqual([])
  })
})

describe('fillEmailTemplate — סירוב כשיש שדה לא-מוכר', () => {
  it('תבנית עם שדה לא-מוכר ⇒ ריק, ולא גוף עם סוגריים גולמיים ללקוח', () => {
    expect(fillEmailTemplate('שלום [שם_חברה],', { '[שם_איש_קשר]': 'רון' })).toBe('')
  })

  it('⇒ ומכיוון שהגוף ריק, גם המשלוח מסרב (buildEmailPayload מחזיר null)', () => {
    const body = fillEmailTemplate('שלום [שם_חברה],', { '[שם_איש_קשר]': 'רון' })
    expect(
      buildEmailPayload({ to: 'a@b.co', subject: 'x', body, attachmentBase64: 'AAA' }),
    ).toBeNull()
  })
})

describe('plainTextToEmailHtml — התבניות טקסט, התעבורה HTML, והשפה עברית', () => {
  // ⚠️ **מופע חמישי של באג-הכיווניות בפרויקט, והראשון מחוץ למסך** (ישי, 30/07/2026):
  // גוף-מייל עברי בלי הכרזת-כיווניות מוצג LTR אצל הלקוח — הפסיקים והנקודות נופלים בצד
  // הלא-נכון. לכן הפונקציה פולטת **כיווניות ותוכן יחד** ואי-אפשר לקבל אחד בלי השני.
  it('הגוף עטוף בהכרזת RTL — אחרת הפיסוק העברי מוצג בצד הלא-נכון', () => {
    const html = plainTextToEmailHtml('שלום רון,')
    expect(html).toContain('dir="rtl"')
    expect(html).toContain('text-align:right')
    expect(html.startsWith('<div')).toBe(true)
    expect(html.endsWith('</div>')).toBe(true)
  })

  it('מעבר-שורה הופך ל-<br>, אחרת כל התבנית נקראת כפסקה אחת רצה', () => {
    expect(plainTextToEmailHtml('שלום רון,\nהצעה מצורפת.')).toContain('שלום רון,<br>הצעה מצורפת.')
  })

  it('חמש שורות ⇒ ארבעה מעברים (בדיוק המקרה של תבנית ההצעה)', () => {
    const html = plainTextToEmailHtml('א\nב\nג\nד\nה')
    expect(html.match(/<br>/g)).toHaveLength(4)
  })

  it('שורות ריקות נשמרות — הן חלק מהעיצוב של התבנית', () => {
    expect(plainTextToEmailHtml('א\n\nב')).toContain('א<br><br>ב')
  })

  it('CRLF מטופל כמעבר אחד ולא כשניים', () => {
    expect(plainTextToEmailHtml('א\r\nב')).toContain('א<br>ב')
  })

  it('תווי-HTML בשם לקוח מוברחים — שם עם & או < לא ישבור את גוף המייל', () => {
    expect(plainTextToEmailHtml('חברת א&ב <בע"מ>')).toContain('חברת א&amp;ב &lt;בע"מ&gt;')
  })

  it('ההברחה נוגעת בתוכן ולא בעטיפה — התגים שלנו נשארים תגים', () => {
    const html = plainTextToEmailHtml('א\nב')
    expect(html).not.toContain('&lt;br&gt;')
    expect(html).not.toContain('&lt;div')
  })

  it('ריק ⇒ ריק לגמרי, בלי עטיפה של כלום', () => {
    expect(plainTextToEmailHtml('')).toBe('')
    expect(plainTextToEmailHtml(null)).toBe('')
  })
})

describe('buildEmailPayload — החוזה מול תרחיש ה-Make', () => {
  const ARGS = {
    to: 'ron@meditech-demo.co.il',
    subject: 'הצעת מחיר מ-REG-IN — כנס',
    body: 'שלום רון גל,',
    filename: 'REG-IN-quote-6.pdf',
    attachmentBase64: 'JVBERi0xLjcK',
  }

  it('בדיוק חמשת השדות של החוזה, ובאותם שמות', () => {
    expect(Object.keys(buildEmailPayload(ARGS)).sort()).toEqual([...EMAIL_PAYLOAD_FIELDS].sort())
  })

  it('הגוף עובר המרה ל-HTML **ולכיווניות** בתוך המשלוח — הקורא לא צריך לזכור זאת', () => {
    const payload = buildEmailPayload({ ...ARGS, body: 'שלום רון,\nהצעה מצורפת.' })
    expect(payload.body).toContain('שלום רון,<br>הצעה מצורפת.')
    expect(payload.body).toContain('dir="rtl"')
  })

  it('שם השדה של הקובץ הוא pdf_base64 — כך קרוי השדה במבנה-הנתונים של Make', () => {
    expect(buildEmailPayload(ARGS).pdf_base64).toBe('JVBERi0xLjcK')
  })

  it('חסר נמען / גוף / קובץ ⇒ null, ולא מייל חלקי', () => {
    expect(buildEmailPayload({ ...ARGS, to: '' })).toBeNull()
    expect(buildEmailPayload({ ...ARGS, to: '   ' })).toBeNull()
    expect(buildEmailPayload({ ...ARGS, body: '' })).toBeNull()
    expect(buildEmailPayload({ ...ARGS, attachmentBase64: '' })).toBeNull()
    expect(buildEmailPayload()).toBeNull()
  })

  it('נושא חסר מותר (מייל בלי נושא נשלח) — בשונה מגוף חסר', () => {
    expect(buildEmailPayload({ ...ARGS, subject: undefined }).subject).toBe('')
  })

  // ── מצורף-רשות: נוסף 09/08/2026 בפזה 0 של מודול 4 ──────────────────────────
  // ⚠️ **הבדיקה הראשונה כאן היא השומר האמיתי**, ולא זו של המסלול החדש: הפיכת המצורף
  // לרשות **באופן גורף** הייתה מוציאה מסמך ללקוח בלי הקובץ, ואף בדיקה קיימת לא הייתה
  // נופלת על כך. לכן הרצפה נשארת דלוקה כברירת-מחדל, ומכובה רק במפורש.
  it('ברירת-המחדל עדיין דורשת מצורף — הקורא חייב לכבות אותה במפורש', () => {
    expect(buildEmailPayload({ ...ARGS, attachmentBase64: undefined })).toBeNull()
  })

  it('מייל טקסטואלי (זימון-משמרת) נבנה בלי מצורף — וחמשת המפתחות נשמרים', () => {
    const payload = buildEmailPayload({
      to: 'noa@example.com',
      subject: 'זימון למשמרת',
      body: 'היי נועה,',
      requireAttachment: false,
    })
    expect(payload).not.toBeNull()
    // ⚠️ מפתח שנעלם נראה בתרחיש ה-Make כמו תקלת-מיפוי; מחרוזת ריקה אומרת "אין מצורף".
    expect(Object.keys(payload).sort()).toEqual([...EMAIL_PAYLOAD_FIELDS].sort())
    expect(payload.pdf_base64).toBe('')
    expect(payload.filename).toBe('')
  })

  it('נמען וגוף נשארים חובה גם בלי מצורף', () => {
    const base = { to: 'noa@example.com', body: 'היי', requireAttachment: false }
    expect(buildEmailPayload({ ...base, to: '' })).toBeNull()
    expect(buildEmailPayload({ ...base, body: '' })).toBeNull()
  })
})

describe('isAttachmentTooLarge — תקרת הקובץ (Make חינמי: 5MB)', () => {
  it('מסמך רגיל (~46KB ב-base64) עובר', () => {
    expect(isAttachmentTooLarge('A'.repeat(46_000))).toBe(false)
  })

  it('מעל התקרה נחסם **אצלנו** — Make היה דוחה אותו אחרי שהמשתמש קיבל "נשלח"', () => {
    expect(isAttachmentTooLarge('A'.repeat(5_000_000))).toBe(true)
  })

  it('ריק אינו "גדול מדי" — זו בעיה אחרת עם הודעה אחרת', () => {
    expect(isAttachmentTooLarge('')).toBe(false)
    expect(isAttachmentTooLarge(null)).toBe(false)
  })
})

describe('emailSendDisabledReason — למה כפתור-השליחה מושבת', () => {
  const OK = { email: 'a@b.co', template: QUOTE_TEMPLATE, canEdit: true }

  it('הכול קיים ⇒ ריק (הכפתור פעיל)', () => {
    expect(emailSendDisabledReason(OK)).toBe('')
  })

  it('הרשאת-צפייה בלבד ⇒ אין שליחה (שליחת מסמך היא פעולה עסקית)', () => {
    expect(emailSendDisabledReason({ ...OK, canEdit: false })).toBe('אין לך הרשאה לשלוח')
  })

  // ⚠️ הנוסח הגנרי הוא **ברירת-מחדל ולא הנוסח שהמשתמש רואה**: כל מודול שולח מעביר את שלו
  // (`QUOTE_SEND_NO_PERMISSION_REASON` בהצעות-מחיר). הבדיקה נועלת את שני הצדדים, כי מנוע
  // שיחזיר את המילה "הצעות" למנהלת-הגיוס הוא בדיוק הרגרסיה שפזה 0 של מודול 4 באה למנוע.
  it('הנוסח הספציפי מגיע מהמודול השולח, והגנרי אינו מזכיר סוג-מסמך', () => {
    expect(
      emailSendDisabledReason({
        ...OK,
        canEdit: false,
        noPermissionReason: 'אין לך הרשאה לשלוח X',
      }),
    ).toBe('אין לך הרשאה לשלוח X')
    expect(emailSendDisabledReason({ ...OK, canEdit: false })).not.toContain('הצעות')
  })

  it('חוסר-הרשאה קודם לכל — אין טעם להנחות לתקן דבר שלא ניתן לבצע', () => {
    expect(emailSendDisabledReason({ email: '', template: '', canEdit: false })).toBe(
      'אין לך הרשאה לשלוח',
    )
  })

  it('אין כתובת', () => {
    expect(emailSendDisabledReason({ ...OK, email: '' })).toBe('אין כתובת מייל לאיש הקשר')
  })

  it('כתובת פגומה נחסמת לפני היציאה — לא נשלחת ל-Make כדי שייכשל שם', () => {
    expect(emailSendDisabledReason({ ...OK, email: 'ron@@meditech' })).toBe(
      'כתובת המייל של איש הקשר אינה תקינה',
    )
    expect(emailSendDisabledReason({ ...OK, email: 'ron-at-meditech.co.il' })).toBe(
      'כתובת המייל של איש הקשר אינה תקינה',
    )
  })

  it('תבנית חסרה — אחרונה בסדר, כי זו תקלת-הגדרות ולא של המשתמש', () => {
    expect(emailSendDisabledReason({ ...OK, template: '' })).toBe('תבנית המייל אינה מוגדרת במערכת')
  })
})

describe('classifySendError — שלושת המצבים, וההבחנה שקל לפספס', () => {
  it('פסק-זמן ⇒ "לא ידוע" ולא "נכשל" — המייל אולי כן נשלח', () => {
    expect(classifySendError(new Error('TIMEOUT'))).toBe(EMAIL_SEND_RESULT.UNKNOWN)
  })

  it('תקלת-רשת של פונקציית-השרת ⇒ "לא ידוע" מאותה סיבה', () => {
    const netErr = Object.assign(new Error('failed to fetch'), { name: 'FunctionsFetchError' })
    expect(classifySendError(netErr)).toBe(EMAIL_SEND_RESULT.UNKNOWN)
  })

  it('כל שגיאה אחרת ⇒ "נכשל" (תשובה חד-משמעית מהשרת)', () => {
    expect(classifySendError(new Error('502'))).toBe(EMAIL_SEND_RESULT.FAILED)
    expect(classifySendError(undefined)).toBe(EMAIL_SEND_RESULT.FAILED)
  })

  it('ההודעה על "לא ידוע" מפנה לבדיקה לפני ניסיון חוזר — לא ל"נסה שוב"', () => {
    const msg = sendResultMessage(EMAIL_SEND_RESULT.UNKNOWN)
    expect(msg).toContain('לא התקבל אישור')
    expect(msg).toContain('לפני שליחה חוזרת')
  })

  it('ההודעה על כשל אומרת מה לעשות, לא רק שנכשל', () => {
    expect(sendResultMessage(EMAIL_SEND_RESULT.FAILED)).toContain('שוב')
  })

  // נוסף 09/08/2026 (פזה 0 של מודול 4): הנוסח הספציפי עבר למודול השולח, כי "הורד את
  // הקובץ ושלח ידנית" מפנה לקובץ שלזימון-משמרת אין. הבדיקה נועלת את שני הצדדים.
  it('נוסח-הכשל הספציפי מגיע מהמודול השולח, והגנרי אינו מזכיר סוג-מסמך', () => {
    expect(
      sendResultMessage(EMAIL_SEND_RESULT.FAILED, { failedMessage: 'ההצעה לא נשלחה. הורד ושלח.' }),
    ).toBe('ההצעה לא נשלחה. הורד ושלח.')
    expect(sendResultMessage(EMAIL_SEND_RESULT.FAILED)).not.toContain('הצעה')
    expect(sendResultMessage(EMAIL_SEND_RESULT.FAILED)).not.toContain('קובץ')
  })

  it('הצלחה ⇒ אין הודעת-שגיאה', () => {
    expect(sendResultMessage(EMAIL_SEND_RESULT.SENT)).toBe('')
  })
})

describe('קבועים שהם חוזה', () => {
  it('תקרת-הזמן היא 30 שניות (מספיק לשליחה, קצר מכדי לתקוע משתמש)', () => {
    expect(EMAIL_SEND_TIMEOUT_MS).toBe(30_000)
  })
})

// ⚠️ שלושת הנוסחים האלה נבדקים כי הם **הגדרת-ההתנהגות** ולא קישוט: כל אחד מהם הוא הרגע
// שבו המערכת מודה שאינה יודעת אם הלקוח כבר קיבל את המסמך. נוסח שיאבד את ההבחנה הזו
// (למשל "אירעה שגיאה") יחזיר בדיוק את הבאג שהם נולדו ממנו.
describe('מצב "לא ידוע אם כבר נשלח" (סבב-תיקון 31/07)', () => {
  it('החיווי אומר מה לא ידוע — ולא "שגיאה" כללית', () => {
    expect(SEND_HISTORY_UNKNOWN_NOTICE).toContain('לא ניתן היה לבדוק')
    expect(SEND_HISTORY_UNKNOWN_NOTICE).toContain('כבר נשלח')
  })

  it('שאלת-האישור מציגה את חוסר-הוודאות ומבקשת הכרעה', () => {
    expect(SEND_HISTORY_UNKNOWN_CONFIRM).toContain('לא ניתן לוודא')
    expect(SEND_HISTORY_UNKNOWN_CONFIRM).toContain('לשלוח בכל זאת?')
  })

  it('כשל-יומן אומר גם שהמייל **כן** נשלח וגם שההגנה לא תפעל בפעם הבאה', () => {
    expect(SEND_LOG_FAILED_NOTICE).toContain('המייל נשלח')
    expect(SEND_LOG_FAILED_NOTICE).toContain('לא תזהיר')
  })

  it('שלושת הנוסחים נבדלים זה מזה — הם שלושה מצבים, לא אחד', () => {
    const all = [SEND_HISTORY_UNKNOWN_NOTICE, SEND_HISTORY_UNKNOWN_CONFIRM, SEND_LOG_FAILED_NOTICE]
    expect(new Set(all).size).toBe(3)
  })
})
