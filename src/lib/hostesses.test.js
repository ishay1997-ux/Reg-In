import { describe, it, expect } from 'vitest'
import {
  HOSTESS_PARAM_NAMES,
  ASSIGNMENT_STATUS_LABELS,
  HOSTESS_STATUS_LABELS,
  EXPIRED_INVITE_LABEL,
  COMPLETED_ASSIGNMENT_LABEL,
  INVITE_VALIDITY_HOURS,
  INVITE_CUTOFF_HOURS_BEFORE_EVENT,
  URGENT_EVENT_HOURS,
  eventStartInstant,
  minWageError,
  duplicateEmailWarning,
  isUnavailableOn,
  unavailabilityLabel,
  isInviteExpired,
  inviteHoursLeft,
  isWithinFinalDay,
  isUrgentEvent,
  assignmentDisplayStatus,
  finalAssignmentRows,
  countAssignmentStates,
  hostessServerErrorMessage,
} from './hostesses'

// ── אוצר-המילים הנעול (spec.md §1.1/§1.2) ───────────────────────────────────
// הבדיקות האלה אינן "בודקות מחרוזות" — הן נועלות את פריט-חוזה 1 של האפיון, שקובע
// ש"כל נוסח אחר הוא באג". שינוי תווית כאן חייב להיות שינוי מודע ולא החלקה של אצבע.
describe('אוצר-המילים — ששת הסטטוסים + שתי התוויות הנגזרות', () => {
  it('שש התוויות זהות-בייט לטבלת §1.1, ואין שביעית', () => {
    expect(ASSIGNMENT_STATUS_LABELS).toEqual({
      pending: 'ממתינה למענה',
      confirmed_available: 'אישרה זמינות',
      declined: 'סירבה',
      finally_approved: 'אושרה סופית',
      released: 'שוחררה',
      approval_withdrawn: 'ביטלה אחרי אישור',
    })
  })

  it('התג המלא הוא "ממתינה למענה" ולא "ממתינה" — הכרעת-נוסח שנמדדה על המוקאפים', () => {
    expect(ASSIGNMENT_STATUS_LABELS.pending).toBe('ממתינה למענה')
  })

  it('"פג תוקף" ו"הושלם" נגזרות ואינן חלק מששת הסטטוסים', () => {
    expect(EXPIRED_INVITE_LABEL).toBe('פג תוקף')
    expect(COMPLETED_ASSIGNMENT_LABEL).toBe('הושלם')
    expect(Object.values(ASSIGNMENT_STATUS_LABELS)).not.toContain(EXPIRED_INVITE_LABEL)
    expect(Object.values(ASSIGNMENT_STATUS_LABELS)).not.toContain(COMPLETED_ASSIGNMENT_LABEL)
  })

  it('סטטוס הדיילת — פעילה / מושבתת', () => {
    expect(HOSTESS_STATUS_LABELS).toEqual({ active: 'פעילה', inactive: 'מושבתת' })
  })
})

describe('שמות-פרמטרים — זהים בית-בבית לשורות ה-Seed', () => {
  // ⚠️ שם שגוי בתו אחד ⇒ השאילתה מחזירה שורה ריקה, הפרמטר "חסר", ואין שום שגיאה.
  // המקור: מיגרציה 20260723112000 (שכר מינימום) ו-20260809125750 (נסיעות).
  it('שכר-המינימום והנסיעות נקובים בשמם המדויק', () => {
    expect(HOSTESS_PARAM_NAMES.minHourlyWage).toBe('שכר_מינימום_שעתי')
    expect(HOSTESS_PARAM_NAMES.travelAmount).toBe('סכום_נסיעות_למשמרת')
  })
})

describe('ספי-הזמן — שלושה מספרים שונים שקל לבלבל ביניהם', () => {
  it('48 שעות לתוקף הזימון · 24 שעות חסימה לפני האירוע · 72 שעות "דחוף"', () => {
    expect(INVITE_VALIDITY_HOURS).toBe(48)
    expect(INVITE_CUTOFF_HOURS_BEFORE_EVENT).toBe(24)
    expect(URGENT_EVENT_HOURS).toBe(72)
  })
})

// ── שכר מינימום ──────────────────────────────────────────────────────────────
describe('minWageError — חוסם, ומשקף את הטריגר במסד', () => {
  it('תעריף מתחת לרף מחזיר את הנוסח המדויק של כרטיס-המסך', () => {
    expect(minWageError(30, '35')).toBe('השכר השעתי חייב להיות לפחות 35 ₪ (שכר מינימום)')
  })

  it('תעריף בדיוק על הרף עובר — הרף כולל את עצמו, כמו הטריגר', () => {
    expect(minWageError(35, '35')).toBeNull()
    expect(minWageError(40, '35')).toBeNull()
  })

  it('פרמטר חסר/ריק/לא-מספרי חוסם ואומר שהפרמטר חסר — לא מניח 0 ולא מניח 35', () => {
    // 🚨 המלכודת: ברירת-מחדל שקטה כאן הייתה מאפשרת לשמור דיילת בתעריף כלשהו כשהפרמטר
    // נמחק בטעות, בעוד שהמסד היה חוסם — כלומר המסך מבטיח שמירה שתיכשל.
    for (const bad of [null, undefined, '', '   ', 'שלושים']) {
      expect(minWageError(50, bad)).toBe(
        'שכר המינימום אינו מוגדר בהגדרות המערכת — לא ניתן לשמור דיילת.',
      )
    }
  })

  it('תעריף ריק או לא-מספרי אינו נחשב 0 חוקי', () => {
    // Number('') === 0 — אותה מלכודת שתועדה ב-pricing.js ובוולידטורים של מודול 3.
    for (const bad of [null, undefined, '', '   ', 'abc']) {
      expect(minWageError(bad, '35')).toBe('יש להזין תעריף שעתי.')
    }
  })
})

// ── אימייל כפול — מזהיר ולא חוסם (§7.65) ────────────────────────────────────
describe('duplicateEmailWarning — אזהרה רכה, לעולם לא חסימה', () => {
  const pool = [
    { hostess_id: 1, full_name: 'נועה לוי', email: 'noa@example.com' },
    { hostess_id: 2, full_name: 'דנה כהן', email: 'Dana@Example.com' },
  ]

  it('מחזירה את שם בעלת-הכתובת הקיימת בנוסח המאושר', () => {
    expect(duplicateEmailWarning('noa@example.com', pool)).toBe(
      'כתובת זו כבר רשומה אצל נועה לוי — להמשיך?',
    )
  })

  it('ההשוואה אינה רגישה לאותיות גדולות ולרווחים בקצוות', () => {
    expect(duplicateEmailWarning('  DANA@example.com ', pool)).toBe(
      'כתובת זו כבר רשומה אצל דנה כהן — להמשיך?',
    )
  })

  it('בעריכה — הדיילת עצמה אינה כפילות של עצמה', () => {
    expect(duplicateEmailWarning('noa@example.com', pool, 1)).toBeNull()
  })

  it('כתובת חדשה, מאגר ריק, או קלט ריק ⇒ אין אזהרה', () => {
    expect(duplicateEmailWarning('new@example.com', pool)).toBeNull()
    expect(duplicateEmailWarning('noa@example.com', [])).toBeNull()
    expect(duplicateEmailWarning('', pool)).toBeNull()
  })
})

// ── אי-זמינות מוצהרת — תנאי חמישי בשער ──────────────────────────────────────
describe('isUnavailableOn — הטווח כולל את שני הקצוות', () => {
  const ranges = [{ start_date: '2026-08-20', end_date: '2026-08-25', note: 'חופשה' }]

  it('יום הפתיחה, יום באמצע ויום הסיום — כולם חוסמים', () => {
    expect(isUnavailableOn(ranges, '2026-08-20')).toBe(true)
    expect(isUnavailableOn(ranges, '2026-08-22')).toBe(true)
    expect(isUnavailableOn(ranges, '2026-08-25')).toBe(true)
  })

  it('יום לפני ויום אחרי — אינם חוסמים', () => {
    expect(isUnavailableOn(ranges, '2026-08-19')).toBe(false)
    expect(isUnavailableOn(ranges, '2026-08-26')).toBe(false)
  })

  it('מאגר ריק / תאריך חסר ⇒ לא חוסם', () => {
    expect(isUnavailableOn([], '2026-08-22')).toBe(false)
    expect(isUnavailableOn(null, '2026-08-22')).toBe(false)
    expect(isUnavailableOn(ranges, null)).toBe(false)
  })

  it('התווית היא טווח ולעולם לא תאריך-סיום יחיד', () => {
    expect(unavailabilityLabel(ranges[0])).toBe('לא זמינה 20/08–25/08')
  })
})

// ── בניית רגע-האירוע ────────────────────────────────────────────────────────
describe('eventStartInstant — שעון-קיר ישראלי ⇒ רגע מוחלט', () => {
  // ⚠️ הבדיקה הזו חייבת לעבור בכל אזור-זמן, ולכן היא משווה מול UTC מפורש.
  it('אוגוסט (שעון קיץ, +03:00)', () => {
    expect(eventStartInstant('2026-08-22', '18:00:00')).toBe('2026-08-22T15:00:00.000Z')
  })

  it('ינואר (שעון חורף, +02:00) — אותו קוד, היסט אחר', () => {
    expect(eventStartInstant('2026-01-22', '18:00:00')).toBe('2026-01-22T16:00:00.000Z')
  })

  it('שעת-התחלה חסרה ⇒ חצות, כמו ה-coalesce בפונקציה הציבורית', () => {
    expect(eventStartInstant('2026-08-22', null)).toBe('2026-08-21T21:00:00.000Z')
  })

  it('תאריך חסר ⇒ null, לא היום', () => {
    expect(eventStartInstant(null, '18:00')).toBeNull()
  })
})

// ── "פג תוקף" — נגזר, לא סטטוס ──────────────────────────────────────────────
describe('isInviteExpired — ממתינה למענה וגם עברו 48 שעות', () => {
  const sent = '2026-08-10T09:00:00.000Z'

  it('47 שעות — עדיין בתוקף · 49 שעות — פג', () => {
    expect(
      isInviteExpired(
        { assignment_status: 'pending', invite_sent_at: sent },
        '2026-08-12T08:00:00.000Z',
      ),
    ).toBe(false)
    expect(
      isInviteExpired(
        { assignment_status: 'pending', invite_sent_at: sent },
        '2026-08-12T10:00:00.000Z',
      ),
    ).toBe(true)
  })

  it('כל סטטוס שאינו "ממתינה למענה" אינו פג-תוקף, גם אחרי שבוע', () => {
    for (const status of [
      'confirmed_available',
      'declined',
      'finally_approved',
      'released',
      'approval_withdrawn',
    ]) {
      expect(
        isInviteExpired(
          { assignment_status: status, invite_sent_at: sent },
          '2026-08-20T09:00:00.000Z',
        ),
      ).toBe(false)
    }
  })

  it('זימון שמעולם לא נשלח אינו פג-תוקף', () => {
    expect(
      isInviteExpired(
        { assignment_status: 'pending', invite_sent_at: null },
        '2026-08-20T09:00:00.000Z',
      ),
    ).toBe(false)
  })

  it('inviteHoursLeft — "נותרו 31 שעות" של תפריט-השורה', () => {
    expect(
      inviteHoursLeft(
        { assignment_status: 'pending', invite_sent_at: sent },
        '2026-08-11T02:00:00.000Z',
      ),
    ).toBe(31)
    expect(
      inviteHoursLeft(
        { assignment_status: 'pending', invite_sent_at: sent },
        '2026-08-12T10:00:00.000Z',
      ),
    ).toBe(0)
  })
})

// ── מצב T-24 ו"דחוף" T-72 ───────────────────────────────────────────────────
describe('isWithinFinalDay / isUrgentEvent — שני ספים שונים', () => {
  const eventAt = '2026-08-22T15:00:00.000Z'

  it('‏19 שעות לפני האירוע ⇒ בתוך T-24', () => {
    expect(isWithinFinalDay(eventAt, '2026-08-21T20:00:00.000Z')).toBe(true)
  })

  it('‏25 שעות לפני האירוע ⇒ עדיין לא', () => {
    expect(isWithinFinalDay(eventAt, '2026-08-21T14:00:00.000Z')).toBe(false)
  })

  it('אירוע שכבר עבר אינו "בתוך 24 שעות" — הוא נגמר', () => {
    expect(isWithinFinalDay(eventAt, '2026-08-23T15:00:00.000Z')).toBe(false)
  })

  it('"דחוף" הוא 72 שעות ולא 24 — סף המסנן וברירת-מחדל המיון', () => {
    expect(isUrgentEvent(eventAt, '2026-08-20T15:00:00.000Z')).toBe(true)
    expect(isUrgentEvent(eventAt, '2026-08-19T09:00:00.000Z')).toBe(false)
  })
})

// ── התווית שמוצגת בפועל ─────────────────────────────────────────────────────
describe('assignmentDisplayStatus — ששת הסטטוסים ושתי הנגזרות', () => {
  const eventAt = '2026-08-22T15:00:00.000Z'

  it('ממתינה שפג תוקפה מוצגת "פג תוקף"', () => {
    const row = { assignment_status: 'pending', invite_sent_at: '2026-08-10T09:00:00.000Z' }
    expect(assignmentDisplayStatus(row, '2026-08-13T09:00:00.000Z')).toBe('פג תוקף')
  })

  it('אושרה סופית ואירועה עבר מוצגת "הושלם" — תווית תצוגה, לא סטטוס', () => {
    const row = { assignment_status: 'finally_approved', event_starts_at: eventAt }
    expect(assignmentDisplayStatus(row, '2026-08-23T09:00:00.000Z')).toBe('הושלם')
  })

  it('אושרה סופית לאירוע עתידי נשארת "אושרה סופית"', () => {
    const row = { assignment_status: 'finally_approved', event_starts_at: eventAt }
    expect(assignmentDisplayStatus(row, '2026-08-20T09:00:00.000Z')).toBe('אושרה סופית')
  })

  it('סטטוס שאינו מוכר אינו דולף למסך כערך-אנגלית', () => {
    expect(assignmentDisplayStatus({ assignment_status: 'zzz' }, '2026-08-20T09:00:00.000Z')).toBe(
      '—',
    )
  })
})

// ── הלב: השורה הקובעת לפי MAX(assignment_number) ────────────────────────────
describe('finalAssignmentRows — סירוב שהתהפך נספר פעם אחת (§11.10 #4)', () => {
  // הנתונים מגוונים בכוונה: מספרים לא-עוקבים ולא לפי סדר ההופעה במערך, אחרת
  // מימוש שפשוט לוקח את האיבר האחרון היה עובר בירוק (מלכודת "נתוני-בדיקה אחידים").
  const rows = [
    { project_id: 7, hostess_id: 1, assignment_number: 1, assignment_status: 'declined' },
    { project_id: 7, hostess_id: 1, assignment_number: 3, assignment_status: 'finally_approved' },
    {
      project_id: 7,
      hostess_id: 1,
      assignment_number: 2,
      assignment_status: 'confirmed_available',
    },
    { project_id: 7, hostess_id: 2, assignment_number: 1, assignment_status: 'pending' },
    { project_id: 9, hostess_id: 1, assignment_number: 1, assignment_status: 'declined' },
  ]

  it('משאירה שורה אחת לכל צמד (פרויקט, דיילת) — זו עם המספר הגבוה', () => {
    const final = finalAssignmentRows(rows)
    expect(final).toHaveLength(3)
    const pair = final.find((r) => r.project_id === 7 && r.hostess_id === 1)
    expect(pair.assignment_number).toBe(3)
    expect(pair.assignment_status).toBe('finally_approved')
  })

  it('אינה מאחדת בין פרויקטים — אותה דיילת בשני אירועים היא שתי שורות', () => {
    const final = finalAssignmentRows(rows)
    expect(final.filter((r) => r.hostess_id === 1)).toHaveLength(2)
  })

  it('הסירוב הישן אינו נספר בנוסף לאישור — לא "גם סירבה וגם אישרה"', () => {
    const final = finalAssignmentRows(rows)
    const declinedForProject7 = final.filter(
      (r) => r.project_id === 7 && r.assignment_status === 'declined',
    )
    expect(declinedForProject7).toHaveLength(0)
  })

  it('קלט ריק/לא-תקין אינו מפיל', () => {
    expect(finalAssignmentRows([])).toEqual([])
    expect(finalAssignmentRows(null)).toEqual([])
  })
})

describe('countAssignmentStates — חמשת המונים של המבט-על', () => {
  const sent = '2026-08-10T09:00:00.000Z'
  const rows = [
    { project_id: 7, hostess_id: 1, assignment_number: 2, assignment_status: 'finally_approved' },
    { project_id: 7, hostess_id: 1, assignment_number: 1, assignment_status: 'declined' },
    {
      project_id: 7,
      hostess_id: 2,
      assignment_number: 1,
      assignment_status: 'confirmed_available',
    },
    {
      project_id: 7,
      hostess_id: 3,
      assignment_number: 1,
      assignment_status: 'pending',
      invite_sent_at: sent,
    },
    {
      project_id: 7,
      hostess_id: 4,
      assignment_number: 1,
      assignment_status: 'pending',
      invite_sent_at: '2026-08-12T20:00:00.000Z',
    },
  ]

  it('סופר על השורה הקובעת בלבד', () => {
    const c = countAssignmentStates(rows, '2026-08-13T09:00:00.000Z')
    expect(c.finallyApproved).toBe(1)
    expect(c.confirmedAvailable).toBe(1)
    expect(c.declined).toBe(0)
  })

  it('"ממתינות" ו"פג תוקפן" זרים זה לזה — אותו מספר, שתי פעולות הפוכות', () => {
    // ‏spec.md:135 — "3 ממתינות" = תני להן זמן; "3 פג תוקפן" = שלחי לעוד שלוש, עכשיו.
    // דיילת שפג תוקף זימונה כבר אינה "ממתינה", אחרת המנהלת מחכה למי שהקישור שלה מת.
    const c = countAssignmentStates(rows, '2026-08-13T09:00:00.000Z')
    expect(c.expired).toBe(1)
    expect(c.pending).toBe(1)
  })
})

// ── תרגום שגיאות-המסד ───────────────────────────────────────────────────────
describe('hostessServerErrorMessage — שגיאת-מסד ⇒ משפט אנושי', () => {
  it('אילוץ "אירוע אחד ביום" מזוהה לפי שם האינדקס ומתורגם', () => {
    const message = hostessServerErrorMessage({
      code: '23505',
      message: 'duplicate key value violates unique constraint "assignments_one_event_per_day"',
    })
    expect(message).toBe(
      'הדיילת כבר מאושרת סופית לאירוע אחר באותו תאריך — לא ניתן לאשר אותה לשני אירועים ביום.',
    )
  })

  it('אילוץ "אחראית משמרת אחת" מזוהה בנפרד', () => {
    const message = hostessServerErrorMessage({
      code: '23505',
      message:
        'duplicate key value violates unique constraint "assignments_one_shift_lead_per_project"',
    })
    expect(message).toBe('כבר סומנה אחראית משמרת לאירוע הזה — יש להסיר את הסימון הקיים תחילה.')
  })

  it('שגיאת שכר-המינימום מהטריגר מועברת כלשונה — היא כבר עברית ונוקבת בשני המספרים', () => {
    const raw = 'התעריף השעתי שהוזן (30) נמוך משכר המינימום שבהגדרות המערכת (35) — לא ניתן לשמור'
    expect(hostessServerErrorMessage({ code: 'P0001', message: raw })).toBe(raw)
  })

  it('חוסר-הרשאה מתורגם למשפט שאומר מה לעשות', () => {
    expect(hostessServerErrorMessage({ code: '42501' })).toBe(
      'אין לך הרשאת עריכה על "דיילות" — יש לפנות למנכ"ל להרחבת ההרשאה.',
    )
  })

  it('שגיאה לא-מוכרת מחזירה null — הקורא נשאר עם ה-fallback שלו', () => {
    // 🚫 לעולם לא להחזיר את המחרוזת הגולמית: היא עלולה לשאת שמות-עמודות ואנגלית.
    expect(hostessServerErrorMessage({ code: '08006', message: 'network error' })).toBeNull()
    expect(hostessServerErrorMessage(null)).toBeNull()
  })
})
