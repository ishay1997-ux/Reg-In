// בדיקות-יחידה ל-`quoteFollowup.js` — טיוטת מייל-המעקב בעזרת AI (ליטושי-הכנס D2, 24/09/2026).
// מה נשמר כאן: **מתי הכפתור מוצג ומושבת** (מטריצת הסטטוס × היומן × ההרשאה) · **סיווג-הכשל** (מכסה
// לעולם לא מציעה "נסי שוב") · **טיוטה ריקה אינה טיוטה** · **mailto שלא נחתך באמצע משפט**.
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  FOLLOWUP_AI_AVAILABLE,
  FOLLOWUP_CHECKING_REASON,
  FOLLOWUP_DRAFT_TIMEOUT_MS,
  FOLLOWUP_FAILED_MESSAGE,
  FOLLOWUP_NOT_SENT_REASON,
  FOLLOWUP_QUOTA_MESSAGE,
  buildFollowupMailto,
  classifyFollowupFailure,
  composeFollowupBody,
  followupAvailability,
  readFollowupDraft,
} from './quoteFollowup'

const open = { quote_id: 31, quote_status: 'in_progress', rejection_reason: null }
const expired = { quote_id: 7, quote_status: 'rejected', rejection_reason: 'פג תוקף' }
const sentRow = { created_at: '2026-08-28T10:00:00Z', recipient: 'a@b.co' }

describe('FOLLOWUP_AI_AVAILABLE — המתג שמסתיר את הכפתור', () => {
  it('כבוי: שלוש קריאות-אמת לספק (24/09/2026) לא החזירו טיוטה — כפתור שתמיד נכשל גרוע מאין-כפתור', () => {
    expect(FOLLOWUP_AI_AVAILABLE).toBe(false)
  })
})

describe('followupAvailability — מתי "נסחי מייל מעקב" מוצג, ומתי הוא מושבת ולמה', () => {
  it('הצעה פתוחה שנשלחה ⇒ פעיל', () => {
    expect(followupAvailability({ quote: open, canEdit: true, lastSend: sentRow })).toEqual({
      show: true,
      disabledReason: '',
    })
  })

  it('הצעה פתוחה שלא נשלחה ⇒ מושבת, עם הנימוק כלשונו', () => {
    expect(followupAvailability({ quote: open, canEdit: true, lastSend: null })).toEqual({
      show: true,
      disabledReason: FOLLOWUP_NOT_SENT_REASON,
    })
    expect(FOLLOWUP_NOT_SENT_REASON).toBe('ההצעה עוד לא נשלחה ללקוח')
  })

  it('נשלחה בחלון הזה עכשיו (לפני שהיומן נטען מחדש) ⇒ פעיל', () => {
    expect(
      followupAvailability({ quote: open, canEdit: true, lastSend: null, sentNow: true })
        .disabledReason,
    ).toBe('')
  })

  it('היומן עדיין נטען ⇒ מושבת עם "בודקת…", לא עם טענה שאיננו יודעים', () => {
    expect(
      followupAvailability({ quote: open, canEdit: true, lastSend: undefined }).disabledReason,
    ).toBe(FOLLOWUP_CHECKING_REASON)
  })

  it('שאילתת-היומן נכשלה ⇒ פעיל (השרת בודק בעצמו ועונה 409 אם לא נשלחה)', () => {
    expect(
      followupAvailability({ quote: open, canEdit: true, lastSend: undefined, checkFailed: true }),
    ).toEqual({ show: true, disabledReason: '' })
  })

  it('הצעה שפג תוקפה ⇒ פעיל, גם בלי שורה ביומן', () => {
    expect(followupAvailability({ quote: expired, canEdit: true, lastSend: null })).toEqual({
      show: true,
      disabledReason: '',
    })
  })

  it('אושרה · נדחתה מסיבה אחרת ⇒ לא מוצג כלל', () => {
    const approved = { quote_id: 1, quote_status: 'approved' }
    const lost = { quote_id: 2, quote_status: 'rejected', rejection_reason: 'המחיר גבוה' }
    for (const quote of [approved, lost]) {
      expect(followupAvailability({ quote, canEdit: true, lastSend: sentRow }).show).toBe(false)
    }
  })

  it('בלי `edit` על הצעות מחיר, או הצעה בלי מזהה (תצוגה-מקדימה לפני שמירה) ⇒ לא מוצג', () => {
    expect(followupAvailability({ quote: expired, canEdit: false, lastSend: null }).show).toBe(
      false,
    )
    expect(
      followupAvailability({ quote: { ...open, quote_id: undefined }, canEdit: true }).show,
    ).toBe(false)
  })
})

describe('classifyFollowupFailure — מה החלון אומר ומה הוא מציע', () => {
  it('מפתח-AI חסר (500 + `unavailable`) ⇒ מצב סופי עם נוסח השרת, בלי "נסי שוב" — ניסיון-חוזר לא יתקין מפתח', () => {
    expect(
      classifyFollowupFailure(
        {
          status: 'unavailable',
          error: 'ניסוח בעזרת AI לא זמין כרגע — אפשר לכתוב את המייל ידנית.',
        },
        500,
      ),
    ).toEqual({
      kind: 'final',
      message: 'ניסוח בעזרת AI לא זמין כרגע — אפשר לכתוב את המייל ידנית.',
    })
  })

  it('429 ⇒ מכסה, בלי "נסי שוב" (גם כשהגוף לא נקרא)', () => {
    expect(classifyFollowupFailure({ status: 'quota' }, 429)).toEqual({
      kind: 'quota',
      message: FOLLOWUP_QUOTA_MESSAGE,
    })
    expect(classifyFollowupFailure(null, 429).kind).toBe('quota')
    expect(FOLLOWUP_QUOTA_MESSAGE).toBe('הגעת למכסת ה-AI — נסי שוב מאוחר יותר.')
  })

  it('4xx אחר ⇒ ההודעה של השרת כלשונה, סופי', () => {
    expect(classifyFollowupFailure({ error: 'ההצעה עוד לא נשלחה ללקוח.' }, 409)).toEqual({
      kind: 'final',
      message: 'ההצעה עוד לא נשלחה ללקוח.',
    })
  })

  it('5xx · רשת · פסק-זמן ⇒ "הניסוח נכשל — נסי שוב." עם ניסיון-חוזר', () => {
    expect(classifyFollowupFailure({ status: 'failed' }, 502)).toEqual({
      kind: 'retry',
      message: FOLLOWUP_FAILED_MESSAGE,
    })
    expect(classifyFollowupFailure(null, 0)).toEqual({
      kind: 'retry',
      message: FOLLOWUP_FAILED_MESSAGE,
    })
    expect(FOLLOWUP_FAILED_MESSAGE).toBe('הניסוח נכשל — נסי שוב.')
  })
})

describe('readFollowupDraft — לעולם לא טיוטה ריקה', () => {
  it('נושא וגוף ⇒ טיוטה; כתובת ריקה ⇒ null', () => {
    expect(readFollowupDraft({ draft: { subject: ' נושא ', body: 'גוף' }, to: '' })).toEqual({
      subject: 'נושא',
      body: 'גוף',
      to: null,
    })
  })

  it('גוף ריק או נושא חסר ⇒ null (והקורא הופך אותו לכשל)', () => {
    expect(readFollowupDraft({ draft: { subject: 'נושא', body: '   ' } })).toBeNull()
    expect(readFollowupDraft({ draft: { body: 'גוף' } })).toBeNull()
    expect(readFollowupDraft(null)).toBeNull()
  })
})

describe('composeFollowupBody — החתימה של מי שלחצה, מתחת ל"בברכה,"', () => {
  it('מוסיפה את החתימה בשורה חדשה, ובלי חתימה משאירה את הגוף', () => {
    expect(composeFollowupBody('שלום,\nבברכה,', 'דנה | REG-IN')).toBe('שלום,\nבברכה,\nדנה | REG-IN')
    expect(composeFollowupBody('שלום,\nבברכה,', '')).toBe('שלום,\nבברכה,')
  })
})

describe('buildFollowupMailto — קישור שלם, או בלי גוף; לעולם לא חתוך', () => {
  it('טיוטה קצרה ⇒ נמען, נושא וגוף מקודדים, מעבר-שורה CRLF', () => {
    const { href, bodyIncluded } = buildFollowupMailto({
      to: 'a@b.co',
      subject: 'מעקב',
      body: 'שורה\nשנייה',
    })
    expect(bodyIncluded).toBe(true)
    expect(href).toBe(
      `mailto:${encodeURIComponent('a@b.co')}?subject=${encodeURIComponent('מעקב')}&body=${encodeURIComponent('שורה\r\nשנייה')}`,
    )
  })

  it('טיוטה שהקישור שלה עובר את הסף ⇒ נמען ונושא בלבד', () => {
    const body = 'שלום רב, רצינו לבדוק אם ההצעה עדיין רלוונטית עבורכם.\n'.repeat(8)
    const { href, bodyIncluded } = buildFollowupMailto({ to: 'a@b.co', subject: 'מעקב', body })
    expect(bodyIncluded).toBe(false)
    expect(href).not.toContain('body=')
    expect(href).toContain(`subject=${encodeURIComponent('מעקב')}`)
  })
})

// 🔗 **החלון מחכה יותר מהשרת — נבדק מול קוד-השרת עצמו, לא מול מספר שהועתק.** השרת מנסה שוב על 5xx
// כל עוד לא עבר `BUDGET_MS`, וכל ניסיון מחכה עד `PROVIDER_TIMEOUT_MS`; ⇒ הוא עונה לכל המאוחר אחרי
// סכומם. חלון שמוותר קודם מציג "הניסוח נכשל" על טיוטה שעוד בדרך. פונקציית-השרת היא Deno ולא ניתנת
// לייבוא כאן, ולכן המספרים נקראים מהטקסט שלה.
describe('FOLLOWUP_DRAFT_TIMEOUT_MS מול תקציב-השרת', () => {
  const serverSource = fs.readFileSync(
    path.resolve(process.cwd(), 'supabase/functions/draft-followup/index.ts'),
    'utf8',
  )
  const readMs = (name) => {
    const match = serverSource.match(new RegExp(`const ${name} = ([0-9_]+)`))
    expect(match, `${name} לא נמצא בקוד-השרת`).not.toBeNull()
    return Number(match[1].replaceAll('_', ''))
  }

  it('ארוך מהמקרה הגרוע של השרת (תקציב + ניסיון אחרון), עם מרווח לרשת', () => {
    const worstServerMs = readMs('BUDGET_MS') + readMs('PROVIDER_TIMEOUT_MS')
    expect(FOLLOWUP_DRAFT_TIMEOUT_MS).toBeGreaterThanOrEqual(worstServerMs + 5_000)
  })
})
