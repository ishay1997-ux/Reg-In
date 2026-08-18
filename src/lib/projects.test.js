import { describe, it, expect } from 'vitest'
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
  ACTIVE_PROJECT_STATUSES,
  resolveProjectTone,
  staffingMetric,
  logisticsMetric,
  gapSentence,
  eventPassedSentence,
} from '@/lib/projects'

// אוצר-המילים נעול (spec.md §1.1) — כל סטייה כאן היא באג, לא העדפה.
const EXPECTED_LABELS = {
  not_started: 'טרם החל',
  in_progress: 'בתהליך',
  ready: 'מוכן לביצוע',
  event_finished: 'ממתין לסגירה',
  awaiting_invoice: 'ממתין לחשבונית',
  awaiting_payment: 'ממתין לתשלום',
  finished: 'פרויקט הסתיים',
  cancelled: 'בוטל',
}

describe('PROJECT_STATUS_LABELS — האוצר הנעול', () => {
  it('שמונה סטטוסים בדיוק, מילה-במילה', () => {
    expect(PROJECT_STATUS_LABELS).toEqual(EXPECTED_LABELS)
  })

  it('⑲ — event_finished מוצג "ממתין לסגירה", לעולם לא "אירוע הסתיים"', () => {
    expect(PROJECT_STATUS_LABELS.event_finished).toBe('ממתין לסגירה')
    expect(Object.values(PROJECT_STATUS_LABELS)).not.toContain('אירוע הסתיים')
  })
})

describe('PROJECT_STATUS_TONES — כל תווית פותרת טון (S-1 · S-24)', () => {
  // הסט הקיים ב-StatusTag.jsx — טון שאינו כאן ייפול שם ל-muted בשקט.
  const KNOWN_TONES = new Set(['ok', 'teal', 'muted', 'warn', 'outline', 'dashed'])

  describe.each(Object.values(EXPECTED_LABELS))('התווית "%s"', (label) => {
    it('פותרת טון מוכר', () => {
      const tone = resolveProjectTone(label)
      expect(tone).toBeDefined()
      expect(KNOWN_TONES.has(tone)).toBe(true)
    })
  })

  it('🔴 תווית שאינה במפה מדוּוחת — לא נופלת בשקת לאפור (המקרה האדום של שומר ①)', () => {
    expect(() => resolveProjectTone('אירוע הסתיים')).toThrow()
    expect(() => resolveProjectTone('סטטוס שלא קיים')).toThrow()
  })

  it('ההכרעות הצבעוניות של S-1: בוטל מקווקו ולא אדום · מוכן-לביצוע teal ולא ירוק · בתהליך אפור', () => {
    expect(PROJECT_STATUS_TONES['בוטל']).toBe('dashed')
    expect(PROJECT_STATUS_TONES['מוכן לביצוע']).toBe('teal')
    expect(PROJECT_STATUS_TONES['בתהליך']).toBe('muted')
    expect(PROJECT_STATUS_TONES['פרויקט הסתיים']).toBe('ok')
  })
})

describe('ACTIVE_PROJECT_STATUSES — ה-SSOT של ⑫', () => {
  it('פעיל = שלושת המצבים בלבד, ו-cancelled אינו ביניהם', () => {
    expect(ACTIVE_PROJECT_STATUSES).toEqual(['not_started', 'in_progress', 'ready'])
  })
})

// ── עוגני spec.md §3.2 — המספרים חושבו ביד באפיון לפני שהקוד נכתב. לא לחשב מחדש. ──

// ‏#8 בזעיר-אנפין: 9 שורות · 6 דיילות · הקיפול משאיר מאושרת-סופית אחת.
// הנתונים מגוונים בכוונה (משמעת 30/07: דאטה אחידה מאשרת מיון/קיבוץ שבור).
const P8_ROWS = [
  { project_id: 8, hostess_id: 1, assignment_number: 1, assignment_status: 'declined' },
  { project_id: 8, hostess_id: 1, assignment_number: 2, assignment_status: 'finally_approved' },
  { project_id: 8, hostess_id: 2, assignment_number: 1, assignment_status: 'declined' },
  { project_id: 8, hostess_id: 2, assignment_number: 3, assignment_status: 'pending' },
  { project_id: 8, hostess_id: 3, assignment_number: 1, assignment_status: 'pending' },
  { project_id: 8, hostess_id: 4, assignment_number: 1, assignment_status: 'released' },
  { project_id: 8, hostess_id: 5, assignment_number: 1, assignment_status: 'declined' },
  { project_id: 8, hostess_id: 6, assignment_number: 1, assignment_status: 'approval_withdrawn' },
  { project_id: 8, hostess_id: 2, assignment_number: 2, assignment_status: 'confirmed_available' },
]

describe('staffingMetric — קיפול MAX(assignment_number) פר-דיילת (🔄4)', () => {
  it('עוגן #8: תשע שורות, שש דיילות ⇒ 1/6 — ספירה נאיבית הייתה מחזירה יותר', () => {
    expect(P8_ROWS).toHaveLength(9)
    const m = staffingMetric(P8_ROWS, 6)
    expect(m).toEqual({ confirmed: 1, required: 6, complete: false })
  })

  it('עוגן #11: שורה אחת שאישרה זמינות בלבד ⇒ 0/1, לא הושלם', () => {
    const rows = [
      {
        project_id: 11,
        hostess_id: 9,
        assignment_number: 1,
        assignment_status: 'confirmed_available',
      },
    ]
    expect(staffingMetric(rows, 1)).toEqual({ confirmed: 0, required: 1, complete: false })
  })

  it('עוגן #3: אפס שורות ⇒ 0/6', () => {
    expect(staffingMetric([], 6)).toEqual({ confirmed: 0, required: 6, complete: false })
  })

  it('דיילת שסירבה-וזומנה-שוב-ואושרה נספרת פעם אחת — לפי הסבב האחרון', () => {
    const rows = [
      { project_id: 5, hostess_id: 7, assignment_number: 1, assignment_status: 'declined' },
      { project_id: 5, hostess_id: 7, assignment_number: 2, assignment_status: 'finally_approved' },
      { project_id: 5, hostess_id: 8, assignment_number: 1, assignment_status: 'finally_approved' },
    ]
    expect(staffingMetric(rows, 2)).toEqual({ confirmed: 2, required: 2, complete: true })
  })
})

describe('logisticsMetric — רק ready נספר, ואפס שורות = הושלם (🔄4 · §1.3)', () => {
  it('אפס שורות לוגיסטיקה ⇒ הושלם, לא 0/0 שבור', () => {
    expect(logisticsMetric([])).toEqual({ ready: 0, total: 0, complete: true })
  })

  it('הוזמן אינו נספר — פריט שהוזמן ולא הגיע זהה במדד לפריט שאיש לא נגע בו', () => {
    const rows = [
      { item_status: 'ready' },
      { item_status: 'ordered' },
      { item_status: 'not_started' },
    ]
    expect(logisticsMetric(rows)).toEqual({ ready: 1, total: 3, complete: false })
  })

  it('כל הפריטים ready ⇒ הושלם', () => {
    const rows = [{ item_status: 'ready' }, { item_status: 'ready' }]
    expect(logisticsMetric(rows)).toEqual({ ready: 2, total: 2, complete: true })
  })
})

describe('gapSentence — עמודת "מה חסר": משפט במילים, לעולם לא ציון (⑧)', () => {
  const base = {
    project_status: 'in_progress',
    required_hostess_count: 6,
    hostesses_confirmed: 0,
    pending_invites: 0,
    assignments_row_count: 0,
    logistics_ready: 0,
    logistics_total: 2,
  }

  it('פרויקט שאיש לא נגע בו (עוגן #3)', () => {
    expect(gapSentence({ ...base, project_status: 'not_started' })).toBe(
      'לא נשלח אף זימון — איש לא נגע בפרויקט מאז שנוצר',
    )
  })

  it('עוגן #8: שני זימונים פתוחים ועדיין חסרות שלוש — הנוסח המאושר מילה-במילה', () => {
    expect(
      gapSentence({
        ...base,
        hostesses_confirmed: 1,
        pending_invites: 2,
        assignments_row_count: 9,
      }),
    ).toBe('2 זימונים ממתינים למענה — וגם אם שתיהן יאשרו, עדיין חסרות 3')
  })

  it('עוגן #11: הדיילת היחידה אישרה זמינות וממתינה לאישור הסופי', () => {
    expect(
      gapSentence({
        ...base,
        required_hostess_count: 1,
        assignments_row_count: 1,
        logistics_total: 0,
        confirmed_available: 1,
      }),
    ).toBe('הדיילת היחידה אישרה זמינות וממתינה לאישור סופי ממך')
  })

  it('עוגן #7: אירוע שעבר בלי שנשלח בו זימון מעולם', () => {
    expect(
      gapSentence({ ...base, project_status: 'event_finished', assignments_row_count: 0 }),
    ).toBe('האירוע עבר ולא נסגר — לא נשלח בו אף זימון מעולם')
  })

  it('ממתין לסגירה רגיל — מפרט מה נדרש להזין', () => {
    expect(
      gapSentence({ ...base, project_status: 'event_finished', assignments_row_count: 5 }),
    ).toBe('ממתין להזנת שעות בפועל, כמות אורחים ודוח-סיכום')
  })

  it('אצל הכספים — אינו דורש פעולה ממנהלת הפרויקטים', () => {
    expect(gapSentence({ ...base, project_status: 'awaiting_invoice' })).toBe(
      'אצל מנהלת הכספים — אינו דורש ממך פעולה',
    )
    expect(gapSentence({ ...base, project_status: 'awaiting_payment' })).toBe(
      'אצל מנהלת הכספים — אינו דורש ממך פעולה',
    )
  })

  it('הכול סגור — פרויקט מוכן, שהסתיים, או שבוטל', () => {
    const done = 'הכול סגור — אין מה לעשות'
    expect(
      gapSentence({
        ...base,
        project_status: 'ready',
        hostesses_confirmed: 6,
        assignments_row_count: 6,
        logistics_ready: 2,
      }),
    ).toBe(done)
    expect(gapSentence({ ...base, project_status: 'finished' })).toBe(done)
    expect(gapSentence({ ...base, project_status: 'cancelled' })).toBe(done)
  })

  it('נפילה-לאחור מספרית: חסרות N (הדוגמה מ-spec §1.8), בלי זימונים פתוחים', () => {
    expect(gapSentence({ ...base, hostesses_confirmed: 1, assignments_row_count: 3 })).toBe(
      'חסרות 5',
    )
  })

  it('🚫 אף משפט אינו מכיל ציון מספרי או אחוז-דחיפות', () => {
    const s = gapSentence({
      ...base,
      hostesses_confirmed: 1,
      pending_invites: 2,
      assignments_row_count: 9,
    })
    expect(s).not.toMatch(/ציון|דחיפות|%/)
  })
})

describe('eventPassedSentence — הנוסח הארוך, זהה בשתי הלשוניות (הכרעת-ישי 18/08)', () => {
  it('התקיים לפני N ימים', () => {
    expect(eventPassedSentence(17)).toBe('התקיים לפני 17 ימים')
  })
})

// ── תוספות שער 2.9 (19/08/2026): גבולות הזימונים-הפתוחים + לשון-היחיד (תבנית-הנהון המאושרת) ──
describe('gapSentence — גבולות הזימונים-הפתוחים ולשון-היחיד', () => {
  const base = {
    project_status: 'in_progress',
    required_hostess_count: 6,
    hostesses_confirmed: 0,
    pending_invites: 0,
    assignments_row_count: 4,
    logistics_ready: 0,
    logistics_total: 2,
  }

  it('הזימונים מכסים בדיוק את החוסר ⇒ הצורה הקצרה, לעולם לא "עדיין חסרות 0"', () => {
    expect(
      gapSentence({
        ...base,
        required_hostess_count: 3,
        hostesses_confirmed: 1,
        pending_invites: 2,
      }),
    ).toBe('2 זימונים ממתינים למענה')
  })

  it('שלושה זימונים ⇒ "כולן"', () => {
    expect(gapSentence({ ...base, hostesses_confirmed: 1, pending_invites: 3 })).toBe(
      '3 זימונים ממתינים למענה — וגם אם כולן יאשרו, עדיין חסרות 2',
    )
  })

  it('זימון בודד ⇒ לשון-יחיד, לא "1 זימונים"', () => {
    expect(gapSentence({ ...base, hostesses_confirmed: 3, pending_invites: 1 })).toBe(
      'זימון אחד ממתין למענה — וגם אם תאשר, עדיין חסרות 2',
    )
    expect(
      gapSentence({
        ...base,
        required_hostess_count: 4,
        hostesses_confirmed: 3,
        pending_invites: 1,
      }),
    ).toBe('זימון אחד ממתין למענה')
  })
})
