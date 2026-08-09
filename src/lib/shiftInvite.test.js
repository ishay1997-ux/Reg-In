import { describe, it, expect } from 'vitest'
import {
  SHIFT_INVITE_STATE,
  SHIFT_INVITE_MESSAGE,
  stateFromInvitePayload,
  stateFromRespondPayload,
  travelAmountToShow,
  expiryNotice,
  eventWhenLine,
} from '@/lib/shiftInvite'

describe('משטח 5 — מיפוי תשובת-השרת למצב-מסך', () => {
  // 🔴 **הבדיקה החשובה בקובץ.** §⑤ מורה ש"אינו בתוקף" ו"לא תקין" זהים **בכוונה**;
  // המיגרציה מחזירה לשניהם `{ok:false}` זהה. אם מישהו יפצל אותם בעתיד, כאן זה ייפול.
  it('טוקן שפג וטוקן שגוי מגיעים לאותו מצב בדיוק', () => {
    expect(stateFromInvitePayload({ ok: false })).toBe(SHIFT_INVITE_STATE.dead)
    // אין לשרת דרך לומר "פג" מול "לא קיים" — שתי הקריאות מחזירות את אותו אובייקט.
    expect(stateFromInvitePayload({ ok: false })).toBe(stateFromInvitePayload({ ok: false }))
  })

  it('ממתין למענה — המצב היחיד שבו יש כפתורים', () => {
    expect(stateFromInvitePayload({ ok: true, state: 'awaiting' })).toBe(
      SHIFT_INVITE_STATE.awaiting,
    )
  })

  it('שלושת המצבים הסופיים ממופים כל אחד לנוסח שלו', () => {
    expect(stateFromInvitePayload({ ok: true, state: 'confirmed' })).toBe(
      SHIFT_INVITE_STATE.confirmed,
    )
    expect(stateFromInvitePayload({ ok: true, state: 'declined' })).toBe(
      SHIFT_INVITE_STATE.declined,
    )
    expect(stateFromInvitePayload({ ok: true, state: 'filled' })).toBe(SHIFT_INVITE_STATE.filled)
  })

  // ברירת-מחדל בטוחה: מצב לא-מוכר לא יציג כפתורים.
  it('סטטוס לא-מוכר נופל ל"אינו בתוקף" ולא ל"ממתין למענה"', () => {
    expect(stateFromInvitePayload({ ok: true, state: 'משהו_חדש' })).toBe(SHIFT_INVITE_STATE.dead)
    expect(stateFromInvitePayload(null)).toBe(SHIFT_INVITE_STATE.dead)
    expect(stateFromInvitePayload(undefined)).toBe(SHIFT_INVITE_STATE.dead)
  })
})

describe('משטח 5 — תשובת פונקציית-הכתיבה', () => {
  it('כתיבה שהצליחה ⇒ מסך-התודה המתאים', () => {
    expect(stateFromRespondPayload({ ok: true, status: 'confirmed_available' })).toBe(
      SHIFT_INVITE_STATE.confirmed,
    )
    expect(stateFromRespondPayload({ ok: true, status: 'declined' })).toBe(
      SHIFT_INVITE_STATE.declined,
    )
  })

  // 🔑 זה מה שמאפשר ל-§⑦ לעבוד בלי לשבור את האנטי-אורקל של §③: כישלון ⇒ `null` ⇒
  // הדף שואל מחדש את פונקציית-הקריאה במקום לנחש מהמחרוזת הגנרית.
  it('כישלון-כתיבה מחזיר null — סימן לקרוא מחדש, לא להסיק', () => {
    expect(stateFromRespondPayload({ ok: false, message: 'הקישור אינו תקף עוד...' })).toBeNull()
    expect(stateFromRespondPayload(null)).toBeNull()
  })
})

describe('משטח 5 — נסיעות (local-3)', () => {
  it('כל עוד הפרמטר 0 — אין מספר להציג', () => {
    expect(travelAmountToShow('0')).toBeNull()
    expect(travelAmountToShow(0)).toBeNull()
    expect(travelAmountToShow(null)).toBeNull()
    expect(travelAmountToShow('לא-מספר')).toBeNull()
  })

  it('סכום חיובי מוצג', () => {
    expect(travelAmountToShow('30')).toBe(30)
    expect(travelAmountToShow('30.5')).toBe(30.5)
  })
})

describe('משטח 5 — הזמן שנותר', () => {
  const now = '2026-08-10T00:00:00Z'

  it('מציג שעות שלמות כלפי מטה', () => {
    expect(expiryNotice('2026-08-11T18:30:00Z', now)).toBe('הקישור בתוקף עוד 42 שעות')
  })

  // עברית: 1 ⇒ "שעה", 2 ⇒ "שעתיים". "1 שעות" הוא בדיוק סוג הפגם שנקרא כתקלה.
  it('צורות-יחיד וזוגי בעברית', () => {
    expect(expiryNotice('2026-08-10T01:30:00Z', now)).toBe('הקישור בתוקף עוד שעה')
    expect(expiryNotice('2026-08-10T02:10:00Z', now)).toBe('הקישור בתוקף עוד שעתיים')
    expect(expiryNotice('2026-08-10T00:40:00Z', now)).toBe('הקישור בתוקף פחות משעה')
  })

  it('מועד שכבר עבר אינו מציג הבטחה', () => {
    expect(expiryNotice('2026-08-09T23:00:00Z', now)).toBeNull()
    expect(expiryNotice(null, now)).toBeNull()
  })
})

describe('משטח 5 — שורת התאריך והשעות', () => {
  // 22/08/2026 הוא יום שבת. הבדיקה נועלת את חישוב-היום-בשבוע מול תאריך אמיתי מהמסד.
  it('יום-בשבוע + תאריך + טווח שעות', () => {
    expect(eventWhenLine('2026-08-22', '18:00:00', '22:00:00')).toBe(
      'יום שבת · 22/08/2026 · 18:00–22:00',
    )
  })

  // 🚫 "18:00–" נראה כמו תקלת-רינדור. `formatTimeRange` מוותרת על הטווח ומשאירה את
  // שעת-ההתחלה לבדה — כלומר הדיילת עדיין יודעת מתי להגיע. אירוע בלי שעת-סיום הוא מצב
  // לגיטימי בסכמה, ולכן זו התנהגות ולא תקלה.
  it('אירוע בלי שעת-סיום — שעת-ההתחלה נשארת, בלי מקף תלוי', () => {
    expect(eventWhenLine('2026-08-22', '18:00:00', null)).toBe('יום שבת · 22/08/2026 · 18:00')
  })

  it('תאריך חסר ⇒ שורה ריקה, בלי "NaN" על המסך', () => {
    expect(eventWhenLine(null, '18:00:00', '22:00:00')).toBe('')
    expect(eventWhenLine('2026-08-22T20:33:42Z', '18:00:00', '22:00:00')).toBe('')
  })
})

describe('משטח 5 — הנוסחים המאושרים', () => {
  // הנוסחים האלה אושרו ב-07/08 ומצוירים במוקאפ. שינוי-ניסוח הוא שינוי-מוצר, לא ריפקטור.
  it('מצוטטים מילה-במילה', () => {
    expect(SHIFT_INVITE_MESSAGE[SHIFT_INVITE_STATE.confirmed]).toBe(
      'תודה! רשמנו שאת מגיעה. פרטים סופיים יישלחו בקרוב.',
    )
    expect(SHIFT_INVITE_MESSAGE[SHIFT_INVITE_STATE.filled]).toBe(
      'תודה שהתפנית — המשרה כבר אוישה לאירוע הזה. נשמח לפנות אלייך בפעם הבאה.',
    )
    expect(SHIFT_INVITE_MESSAGE[SHIFT_INVITE_STATE.saveFailed]).toBe(
      'לא הצלחנו לשמור את התשובה. נסי שוב, או התקשרי למנהלת.',
    )
  })
})
