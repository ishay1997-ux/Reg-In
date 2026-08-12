import { describe, it, expect } from 'vitest'
import {
  SHIFT_TEMPLATE_NAMES,
  shiftInviteSubject,
  finalApprovalSubject,
  releaseSubject,
  buildShiftInvitePayload,
  buildFinalApprovalPayload,
  buildReleasePayload,
  resolveShiftContact,
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

// ⚠️ העתקים מדויקים של הערכים שבמסד (מיגרציות `20260723112000` · `20260809125750` ·
// **`20260810001421`**) — כדי שבדיקה תיפול אם שם-placeholder בתבנית ישתנה.
// 🔴 **שורת איש-הקשר עודכנה 10/08/2026 עם המיגרציה, ואומתה מול המסד באותו תור.** לפניה
// היא נשאה *"מנהלת הפרויקט -[שם_מנהלת_פרויקט]"*, והתפקיד עבר לתוך הערך.
// ⚠️ **ואילו העותק כאן היה נשאר ישן, הבדיקה הייתה עוברת בירוק על גוף-מייל שכתוב בו
// "מנהלת הפרויקט -מנהלת הפרויקט ישי אטיאס"** — `toContain('ישי אטיאס')` אינו מבחין בזה.
const FINAL_TEMPLATE = `היי [שם_דיילת],
אנו שמחים לעדכן כי שיבוצך לאירוע '[שם_פרויקט]' אושר ונסגר סופית!
להלן פרטי האירוע המלאים:
תאריך: [תאריך_אירוע]
שעות משמרת: [שעת_התחלה] עד [שעת_סיום]
מיקום האירוע: [כתובת_אירוע_מלאה]
איש קשר בשטח: [שם_מנהלת_פרויקט], טלפון: [טלפון_מנהלת_פרויקט]
אנא ודאי הגעה בזמן (15 דקות לפני תחילת משמרת) והקפידי על קוד לבוש שחור-לבן קלאסי (אלא אם צוין אחרת).
נתראה באירוע!
צוות הגיוס, REG-IN.`

const RELEASE_TEMPLATE = `היי [שם_דיילת],
תודה שהתפנית — המשרה כבר אוישה לאירוע הזה. נשמח לפנות אלייך בפעם הבאה.
בברכה,
צוות הגיוס, REG-IN.`

describe('resolveShiftContact — איש הקשר בשטח (local-2 · §ב5)', () => {
  const withOwner = { ...project, owner_name: 'ישי אטיאס', owner_phone: '050-1241223' }

  it('לא סומנה אחראית משמרת ⇒ מנהלת הפרויקט, מהצילום שעל הפרויקט', () => {
    expect(resolveShiftContact({ project: withOwner, shiftLead: null })).toEqual({
      name: 'מנהלת הפרויקט ישי אטיאס',
      phone: '050-1241223',
      isShiftLead: false,
    })
  })

  it('🔴 סומנה אחראית משמרת ⇒ היא איש-הקשר, וגוברת על מנהלת הפרויקט', () => {
    const lead = { full_name: 'נועה שגיא', phone: '052-7778899' }
    expect(resolveShiftContact({ project: withOwner, shiftLead: lead })).toEqual({
      name: 'אחראית המשמרת נועה שגיא',
      phone: '052-7778899',
      isShiftLead: true,
    })
  })

  // 🔴 **המחצית שהמיגרציה לבדה אינה נותנת.** ‏`20260810001421` הסירה מהתבנית את המילים
  // הקשיחות *"מנהלת הפרויקט -"*; בלי שהתפקיד ייכנס לתוך הערך, השורה במייל הייתה מתנוונת
  // ל-*"איש קשר בשטח: ישי אטיאס"* — שם בלי שום הקשר, לדיילת שצריכה לדעת למי היא מתקשרת.
  it('🔴 התפקיד נוסע בתוך הערך — כי התבנית כבר אינה אומרת אותו', () => {
    const lead = { full_name: 'נועה שגיא', phone: '052-7778899' }
    expect(resolveShiftContact({ project: withOwner, shiftLead: lead }).name).toContain(
      'אחראית המשמרת',
    )
    expect(resolveShiftContact({ project: withOwner }).name).toContain('מנהלת הפרויקט')
  })

  it('🔴 טלפון חסר ⇒ `null` — ולא "טלפון: " ריק במייל שיצא לדיילת', () => {
    expect(resolveShiftContact({ project: { ...withOwner, owner_phone: '' } })).toBe(null)
  })

  it('🔴 שם חסר ⇒ `null` באותה מידה', () => {
    expect(resolveShiftContact({ project: { ...withOwner, owner_name: null } })).toBe(null)
  })

  it('🔴 אחראית משמרת בלי טלפון אינה "נופלת אחורה" למנהלת — היא איש-הקשר, והמייל נעצר', () => {
    const lead = { full_name: 'נועה שגיא', phone: null }
    expect(resolveShiftContact({ project: withOwner, shiftLead: lead })).toBe(null)
  })
})

describe('buildFinalApprovalPayload — מייל האישור הסופי', () => {
  const contact = { name: 'ישי אטיאס', phone: '050-1241223', isShiftLead: false }
  const args = { template: FINAL_TEMPLATE, hostess, project, contact }

  it('כל שמונת השדות מולאו — ולא נשאר סוגר מרובע אחד', () => {
    const payload = buildFinalApprovalPayload(args)
    expect(payload.body).not.toMatch(/\[[^\]\n]+\]/)
    expect(payload.body).toContain('נועה שגיא')
    expect(payload.body).toContain('22/08/2026')
    expect(payload.body).toContain('אקספו תל אביב, ביתן 2')
    expect(payload.body).toContain('ישי אטיאס')
    expect(payload.body).toContain('050-1241223')
  })

  it('🔴 `[כתובת_אירוע_מלאה]` הוא `final_location` — הכתובת המלאה, לא העיר', () => {
    const payload = buildFinalApprovalPayload(args)
    expect(payload.body).toContain('מיקום האירוע: אקספו תל אביב, ביתן 2')
  })

  it('🔴 שורת איש-הקשר נושאת תפקיד אחד בדיוק — לא כפול ולא חסר', () => {
    const payload = buildFinalApprovalPayload({
      ...args,
      contact: { name: 'מנהלת הפרויקט ישי אטיאס', phone: '050-1241223', isShiftLead: false },
    })
    expect(payload.body).toContain('איש קשר בשטח: מנהלת הפרויקט ישי אטיאס, טלפון: 050-1241223')
    // ⚠️ השומר האמיתי: שהתבנית **לא** תוסיף תפקיד משלה על גבי זה שבערך.
    expect(payload.body).not.toContain('מנהלת הפרויקט -')
    expect(payload.body.match(/מנהלת הפרויקט/g)).toHaveLength(1)
  })

  it('🔴 בלי איש-קשר ⇒ `null`, לא מייל עם "טלפון: " ריק', () => {
    expect(buildFinalApprovalPayload({ ...args, contact: null })).toBe(null)
  })

  it('🔴 המצורף כבוי — גם המייל הזה הוא טקסט בלבד', () => {
    expect(buildFinalApprovalPayload(args).pdf_base64).toBe('')
  })

  it('בלי כתובת-מייל לדיילת ⇒ `null`', () => {
    expect(buildFinalApprovalPayload({ ...args, hostess: { full_name: 'נועה' } })).toBe(null)
  })
})

describe('buildReleasePayload — ההודעה שנוסעת עם השחרור', () => {
  it('🔴 נוסח השחרור, ולא מייל הביטול — היא מעולם לא שובצה', () => {
    const payload = buildReleasePayload({ template: RELEASE_TEMPLATE, hostess, project })
    expect(payload.body).toContain('תודה שהתפנית')
    expect(payload.body).not.toContain('בוטלה')
    expect(payload.body).not.toMatch(/\[[^\]\n]+\]/)
  })

  it('בלי כתובת-מייל ⇒ `null`', () => {
    expect(buildReleasePayload({ template: RELEASE_TEMPLATE, hostess: {}, project })).toBe(null)
  })
})

describe('נושאי המיילים — תיבה של דיילת מקבלת כמה מיילים על כמה אירועים', () => {
  it('שלושת הנושאים נושאים את שם האירוע ונבדלים זה מזה', () => {
    expect(finalApprovalSubject(project)).toBe('אישור סופי למשמרת — כנס לקוחות שנתי')
    expect(releaseSubject(project)).toBe('עדכון על המשמרת — כנס לקוחות שנתי')
    expect(
      new Set([shiftInviteSubject(project), finalApprovalSubject(project), releaseSubject(project)])
        .size,
    ).toBe(3)
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
