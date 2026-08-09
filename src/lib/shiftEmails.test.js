import { describe, it, expect } from 'vitest'
import {
  SHIFT_TEMPLATE_NAMES,
  shiftInviteSubject,
  buildShiftInvitePayload,
  confirmUrlFor,
} from './shiftEmails'

// ⚠️ **העתק מדויק של הערך שבמסד** (`תבנית_זימון_משמרת`, מיגרציה `20260723112000`) — כדי
// שבדיקה תיפול אם שמות-ה-placeholders בתבנית ישתנו. אותה מוסכמה כמו `QUOTE_TEMPLATE`.
const INVITE_TEMPLATE = `היי [שם_דיילת],
התאמת לאירוע חדש של REG-IN!
אירוע: [שם_פרויקט]
תאריך: [תאריך_אירוע]
שעות: [שעת_התחלה] עד [שעת_סיום]
מיקום: [עיר_אירוע]
תעריף: [תעריף_שעתי_דיילת] ש"ח לשעה + נסיעות
לאישור הגעה או דחייה, לחצי על הלינק הבא: [לינק_אישור_משמרת]
שימי לב: השיבוץ הינו על בסיס כל הקודם זוכה.`

const hostess = { full_name: 'נועה שגיא', email: 'noa@example.test' }
const project = {
  event_name: 'כנס לקוחות שנתי',
  final_event_date: '2026-08-22',
  final_start_time: '18:00:00',
  final_end_time: '22:00:00',
  final_location: 'אקספו תל אביב, ביתן 2',
}

describe('confirmUrlFor — הקישור האישי', () => {
  it('הטוקן יושב בנתיב, לעולם לא ב-query', () => {
    expect(confirmUrlFor('https://reg-in.app', 'abc-123')).toBe('https://reg-in.app/shift/abc-123')
  })

  it('בלי טוקן אין קישור — עדיף בלי מייל מאשר מייל עם קישור מת', () => {
    expect(confirmUrlFor('https://reg-in.app', null)).toBe(null)
  })
})

describe('buildShiftInvitePayload — חוזה מול מנוע-המייל', () => {
  const args = {
    template: INVITE_TEMPLATE,
    hostess,
    project,
    hourlyRate: 45,
    confirmUrl: 'https://reg-in.app/shift/abc-123',
  }

  it('כל שמונת השדות מולאו — ולא נשאר סוגר מרובע אחד בגוף', () => {
    const payload = buildShiftInvitePayload(args)
    expect(payload.body).not.toMatch(/\[[^\]\n]+\]/)
    expect(payload.body).toContain('נועה שגיא')
    expect(payload.body).toContain('22/08/2026')
    expect(payload.body).toContain('18:00')
    expect(payload.body).toContain('22:00')
    expect(payload.body).toContain('אקספו תל אביב, ביתן 2')
    expect(payload.body).toContain('45')
    expect(payload.body).toContain('https://reg-in.app/shift/abc-123')
  })

  it('🔴 המצורף כבוי במפורש — זימון-משמרת הוא טקסט בלבד', () => {
    const payload = buildShiftInvitePayload(args)
    expect(payload.filename).toBe('')
    expect(payload.pdf_base64).toBe('')
    expect(payload.to).toBe('noa@example.test')
  })

  it('🔴 בלי קישור ⇒ `null`, ולא מייל שנשלח עם "לחצי על הלינק:" ריק', () => {
    expect(buildShiftInvitePayload({ ...args, confirmUrl: null })).toBe(null)
  })

  it('בלי כתובת-מייל לדיילת ⇒ `null` — המנוע לא ישלח לשום מקום', () => {
    expect(buildShiftInvitePayload({ ...args, hostess: { full_name: 'נועה' } })).toBe(null)
  })

  it('🔴 תבנית שנוסף לה שדה לא-מוכר ⇒ `null`, לא מייל עם `[שדה]` גולמי', () => {
    const payload = buildShiftInvitePayload({
      ...args,
      template: `${INVITE_TEMPLATE}\nבונוס: [שדה_שלא_קיים]`,
    })
    expect(payload).toBe(null)
  })

  it('שעת-סיום חסרה אינה מפילה את המייל — הטווח מתקצר, השליחה יוצאת', () => {
    const payload = buildShiftInvitePayload({
      ...args,
      project: { ...project, final_end_time: null },
    })
    expect(payload).not.toBe(null)
    expect(payload.body).not.toMatch(/\[[^\]\n]+\]/)
  })
})

describe('shiftInviteSubject', () => {
  it('נושא נושא את שם האירוע — תיבה של דיילת מקבלת כמה זימונים', () => {
    expect(shiftInviteSubject(project)).toBe('זימון למשמרת — כנס לקוחות שנתי')
  })
})

describe('SHIFT_TEMPLATE_NAMES — זהים-בייט לשורות ה-Seed', () => {
  it('ארבע התבניות של מודול 4', () => {
    expect(SHIFT_TEMPLATE_NAMES).toEqual({
      invite: 'תבנית_זימון_משמרת',
      finalApproval: 'תבנית_אישור_סופי_שיבוץ',
      cancellation: 'תבנית_מייל_ביטול_משמרת',
      release: 'תבנית_מייל_שחרור_משמרת',
      reminder: 'תבנית_תזכורת_משמרת',
    })
  })
})
