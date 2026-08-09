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
  hostessDisplayState,
  unansweredStreakTag,
  eventsInLastQuarter,
  futureActiveAssignments,
  QUARTER_WINDOW_DAYS,
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
    // 🔴 הסכום עטוף ב-LRI…PDI כדי שה-₪ יישאר **מימין לספרות** בתוך משפט עברי.
    // ‏**נמדד בדפדפן 09/08/2026 שבלי הבידוד הוא נופל שמאלה** — ישי הצביע על החשד,
    // המדידה אישרה, וזו הבדיקה שלא תיתן לזה לחזור. התווים בלתי-נראים, ולכן נכתבים
    // כאן במפורש כ-escape ולא מודבקים — אחרת אי-אפשר לראות בקוד שהם שם.
    expect(minWageError(30, '35')).toBe(
      'השכר השעתי חייב להיות לפחות ⁦' + '35 ₪' + '⁩ (שכר מינימום)',
    )
    expect(minWageError(30, '35')).toContain('⁦')
    expect(minWageError(30, '35')).toContain('⁩')
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

// ═══════════════════════════════════════════════════════════════════════════
// 🧱 פזה 3 · צעד 3.1 — הנגזרות של טבלת-המאגר
// כולן **נכתבו לפני המימוש ונצפו אדומות**. הן מכסות את מה שהמסך מציג ואי-אפשר
// לגזור מקריאת השורה: המצב, שני תגי-ההיגיינה, מונה-הרבעון, והקלט לחלון §א4.
// ═══════════════════════════════════════════════════════════════════════════

describe('hostessDisplayState — עמודת "מצב"', () => {
  const TODAY = '2026-08-09'
  const active = { status: 'active' }

  it('דיילת פעילה בלי אי-זמינות ⇒ "פעילה"', () => {
    expect(hostessDisplayState(active, [], TODAY)).toEqual({
      label: 'פעילה',
      tone: 'ok',
      note: null,
    })
  })

  it('🔴 מושבתת גוברת על הכול — גם אם יש לה טווח אי-זמינות', () => {
    const ranges = [{ start_date: '2026-08-15', end_date: '2026-08-20', note: 'בחו״ל' }]
    expect(hostessDisplayState({ status: 'inactive' }, ranges, TODAY).label).toBe('מושבתת')
  })

  it('🔴 טווח שמכסה את היום מוצג כטווח מלא, לעולם לא כתאריך-סיום יחיד', () => {
    const ranges = [{ start_date: '2026-08-05', end_date: '2026-08-12', note: 'מחלה' }]
    const state = hostessDisplayState(active, ranges, TODAY)
    // "לא זמינה עד 12/08" משתמע כאילו היא זמינה היום — וההפך נכון (spec.md §1.2).
    expect(state.label).toBe('לא זמינה 05/08–12/08')
    expect(state.tone).toBe('warn')
    expect(state.note).toBe('מחלה')
  })

  it('🔴 טווח עתידי מוצג גם הוא — כך מצויר במוקאפ 03 (יעל 07/09–14/09, בעוד היום 08/08)', () => {
    const ranges = [{ start_date: '2026-09-07', end_date: '2026-09-14', note: 'אירוע משפחתי' }]
    expect(hostessDisplayState(active, ranges, TODAY).label).toBe('לא זמינה 07/09–14/09')
  })

  it('🔴 טווח שכבר עבר אינו מוצג — היא פעילה, וזו לא היסטוריה שהמנהלת צריכה בשורה', () => {
    const ranges = [{ start_date: '2026-07-01', end_date: '2026-07-10', note: 'ישן' }]
    expect(hostessDisplayState(active, ranges, TODAY).label).toBe('פעילה')
  })

  it('כמה טווחים ⇒ הקרוב ביותר, ולא הראשון במערך', () => {
    const ranges = [
      { start_date: '2026-10-01', end_date: '2026-10-05', note: 'רחוק' },
      { start_date: '2026-08-20', end_date: '2026-08-25', note: 'קרוב' },
    ]
    expect(hostessDisplayState(active, ranges, TODAY).note).toBe('קרוב')
  })

  it('טווח פעיל **וגם** עתידי ⇒ הפעיל מנצח, כי הוא המצב עכשיו', () => {
    const ranges = [
      { start_date: '2026-09-01', end_date: '2026-09-03', note: 'עתידי' },
      { start_date: '2026-08-08', end_date: '2026-08-11', note: 'עכשיו' },
    ]
    expect(hostessDisplayState(active, ranges, TODAY).note).toBe('עכשיו')
  })
})

describe('unansweredStreakTag — שני תגי-ההיגיינה', () => {
  const N = 4
  const invite = (num, status, sentAt) => ({
    project_id: num,
    hostess_id: 1,
    assignment_number: 1,
    assignment_status: status,
    invite_sent_at: sentAt,
  })

  it('🔴 ארבעה אחרונים ללא מענה ⇒ הצ׳יפ "לא ענתה ל-4 האחרונים"', () => {
    const rows = [1, 2, 3, 4].map((i) => invite(i, 'pending', `2026-0${i}-01T10:00:00Z`))
    expect(unansweredStreakTag(rows, N)).toEqual({ label: 'לא ענתה ל-4 האחרונים', isChip: true })
  })

  it('🔴 שלושה זימונים בלבד, כולם ללא מענה ⇒ "לא ענתה מעולם (3 זימונים)" — ובלי צ׳יפ', () => {
    // מתחת לסף: היא מתה באותה מידה, אבל אינה נכנסת למסנן (כרטיס מסך 3 §③).
    const rows = [1, 2, 3].map((i) => invite(i, 'pending', `2026-0${i}-01T10:00:00Z`))
    expect(unansweredStreakTag(rows, N)).toEqual({
      label: 'לא ענתה מעולם (3 זימונים)',
      isChip: false,
    })
  })

  it('🔴 ענתה באחד מארבעת האחרונים ⇒ אין תג בכלל', () => {
    const rows = [
      invite(1, 'pending', '2026-01-01T10:00:00Z'),
      invite(2, 'declined', '2026-02-01T10:00:00Z'),
      invite(3, 'pending', '2026-03-01T10:00:00Z'),
      invite(4, 'pending', '2026-04-01T10:00:00Z'),
    ]
    expect(unansweredStreakTag(rows, N)).toBeNull()
  })

  it('🔴 הרצף נמדד על ה-N האחרונים לפי תאריך-שליחה — לא לפי סדר המערך', () => {
    // הישן הוא זה שנענה; אילו הסדר היה לפי המערך, הבדיקה הייתה נופלת על התג.
    const rows = [
      invite(9, 'confirmed_available', '2025-01-01T10:00:00Z'),
      ...[1, 2, 3, 4].map((i) => invite(i, 'pending', `2026-0${i}-01T10:00:00Z`)),
    ]
    expect(unansweredStreakTag(rows, N)?.label).toBe('לא ענתה ל-4 האחרונים')
  })

  it('🔴 רק השורה הקובעת נספרת — שורה שנעקפה יוצאת מהספירה לגמרי', () => {
    // ⚠️ **הבדיקה הזאת נבנתה מחדש אחרי שהגרסה הראשונה שלה עברה על קוד שבור.**
    // הראשונה נתנה 4 שורות-קובעות, ולכן קיפול או אי-קיפול החזירו את אותה תשובה —
    // כלומר היא "בדקה" את הקיפול מול נתונים שהתשובה בהם זהה בשני המקרים.
    // כאן ההפרש אמיתי: בפרויקט 1 יש **סירוב שנעקף**, והשורה הקובעת היא השנייה.
    //   עם קיפול   ⇒ 3 זימונים, כולם ללא מענה  ⇒ "לא ענתה מעולם (3 זימונים)"
    //   בלי קיפול ⇒ 4 זימונים, ואחד מהם סירוב ⇒ null
    const rows = [
      { ...invite(1, 'declined', '2026-01-01T10:00:00Z'), assignment_number: 1 },
      { ...invite(1, 'pending', '2026-02-01T10:00:00Z'), assignment_number: 2 },
      invite(2, 'pending', '2026-03-01T10:00:00Z'),
      invite(3, 'pending', '2026-04-01T10:00:00Z'),
    ]
    expect(unansweredStreakTag(rows, N)).toEqual({
      label: 'לא ענתה מעולם (3 זימונים)',
      isChip: false,
    })
  })

  it('דיילת שמעולם לא קיבלה זימון אינה מקבלת תג — אין עליה מידע, וזו לא אשמתה', () => {
    expect(unansweredStreakTag([], N)).toBeNull()
  })

  it('סף חסר מ-params ⇒ null, ולא סף מומצא', () => {
    const rows = [1, 2, 3, 4].map((i) => invite(i, 'pending', `2026-0${i}-01T10:00:00Z`))
    expect(unansweredStreakTag(rows, null)).toBeNull()
  })
})

describe('eventsInLastQuarter — "אירועים · רבעון אחרון"', () => {
  const TODAY = '2026-08-09'
  const worked = (projectId, eventDate) => ({
    project_id: projectId,
    hostess_id: 1,
    assignment_number: 1,
    assignment_status: 'finally_approved',
    projects: { final_event_date: eventDate },
  })

  it('החלון הוא 90 יום מתגלגלים', () => {
    expect(QUARTER_WINDOW_DAYS).toBe(90)
  })

  it('סופר רק אירועים שכבר עברו ובתוך החלון', () => {
    const rows = [worked(1, '2026-08-01'), worked(2, '2026-06-20'), worked(3, '2026-07-15')]
    expect(eventsInLastQuarter(rows, TODAY)).toBe(3)
  })

  it('🔴 אירוע עתידי אינו נספר — היא עוד לא עבדה בו', () => {
    expect(eventsInLastQuarter([worked(1, '2026-09-20')], TODAY)).toBe(0)
  })

  it('🔴 אירוע ישן מ-90 יום נופל מהחלון', () => {
    expect(eventsInLastQuarter([worked(1, '2026-04-01')], TODAY)).toBe(0)
  })

  it('🔴 רק "אושרה סופית" נספר — זימון שנשלח אינו עבודה שבוצעה', () => {
    const rows = [
      { ...worked(1, '2026-07-01'), assignment_status: 'pending' },
      { ...worked(2, '2026-07-01'), assignment_status: 'confirmed_available' },
      { ...worked(3, '2026-07-01'), assignment_status: 'declined' },
    ]
    expect(eventsInLastQuarter(rows, TODAY)).toBe(0)
  })

  it('🔴 השורה הקובעת מכריעה: שיבוץ שאושר ואז בוטל אינו נספר כעבודה', () => {
    // ⚠️ **גם הבדיקה הזאת נבנתה מחדש.** הראשונה נתנה שתי שורות `finally_approved`
    // לאותו פרויקט וציפתה ל-1 — אבל `finalAssignmentRows` מקפל אותן ממילא לשורה אחת,
    // כלומר היא הייתה עוברת גם אילו הספירה הייתה על שורות ולא על אירועים.
    // 🔑 כאן ההפרש אמיתי: השורה הקובעת (assignment_number 2) היא `ביטלה אחרי אישור`,
    // ולכן התשובה הנכונה היא **0**. ספירה שאינה מקפלת הייתה מחזירה 1.
    const rows = [
      { ...worked(5, '2026-07-01'), assignment_number: 1 },
      { ...worked(5, '2026-07-01'), assignment_number: 2, assignment_status: 'approval_withdrawn' },
    ]
    expect(eventsInLastQuarter(rows, TODAY)).toBe(0)
  })

  it('שורה בלי תאריך-אירוע אינה מפילה ואינה נספרת', () => {
    expect(eventsInLastQuarter([worked(1, null)], TODAY)).toBe(0)
  })
})

describe('futureActiveAssignments — הקלט לחלון-האישור של §א4', () => {
  const TODAY = '2026-08-09'
  const row = (projectId, status, eventDate, eventName) => ({
    project_id: projectId,
    hostess_id: 1,
    assignment_number: 1,
    assignment_status: status,
    projects: { final_event_date: eventDate, event_name: eventName },
  })

  it('🔴 שיבוץ עתידי שאושר סופית — בדיוק המקרה שהאפיון מצייר', () => {
    const found = futureActiveAssignments(
      [row(8, 'finally_approved', '2026-08-22', 'כנס לקוחות שנתי')],
      TODAY,
    )
    expect(found).toHaveLength(1)
    expect(found[0].eventName).toBe('כנס לקוחות שנתי')
    expect(found[0].eventDate).toBe('2026-08-22')
    expect(found[0].statusLabel).toBe('אושרה סופית')
  })

  it('🔴 "אישרה זמינות" נספרת גם היא — היא התחייבות חיה שהמנהלת חייבת לראות', () => {
    const rows = [row(8, 'confirmed_available', '2026-08-22', 'א')]
    expect(futureActiveAssignments(rows, TODAY)).toHaveLength(1)
  })

  it('🔴 אירוע שעבר אינו "עתידי" — אין ממה לשחרר אותה', () => {
    const rows = [row(8, 'finally_approved', '2026-07-01', 'א')]
    expect(futureActiveAssignments(rows, TODAY)).toHaveLength(0)
  })

  it('🔴 סירבה · שוחררה · ביטלה-אחרי-אישור ⇒ אינן שיבוץ פעיל', () => {
    const rows = [
      row(1, 'declined', '2026-08-22', 'א'),
      row(2, 'released', '2026-08-22', 'ב'),
      row(3, 'approval_withdrawn', '2026-08-22', 'ג'),
    ]
    expect(futureActiveAssignments(rows, TODAY)).toHaveLength(0)
  })

  it('🔴 זימון שרק נשלח (ממתינה למענה) אינו התחייבות — ולכן אינו פותח את החלון', () => {
    expect(futureActiveAssignments([row(1, 'pending', '2026-08-22', 'א')], TODAY)).toHaveLength(0)
  })

  it('רק השורה הקובעת — סירוב שנעקף מאוחר יותר כן נספר', () => {
    const rows = [
      { ...row(8, 'declined', '2026-08-22', 'כנס'), assignment_number: 1 },
      { ...row(8, 'finally_approved', '2026-08-22', 'כנס'), assignment_number: 2 },
    ]
    expect(futureActiveAssignments(rows, TODAY)).toHaveLength(1)
  })

  it('ממוינות לפי תאריך — הקרוב ביותר ראשון בחלון', () => {
    const rows = [
      row(1, 'finally_approved', '2026-09-30', 'רחוק'),
      row(2, 'finally_approved', '2026-08-15', 'קרוב'),
    ]
    expect(futureActiveAssignments(rows, TODAY).map((r) => r.eventName)).toEqual(['קרוב', 'רחוק'])
  })
})
