import { describe, it, expect } from 'vitest'
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
  ACTIVE_PROJECT_STATUSES,
  resolveProjectTone,
  staffingMetric,
  logisticsMetric,
  gapSentence,
  gapTone,
  eventPassedSentence,
  eventDaysFromToday,
  proximitySentence,
  sortOverviewProjects,
  overviewHasGap,
  overviewRowKind,
  staffingCell,
  logisticsCell,
  overviewTiles,
  staffingTileSub,
  logisticsTileSub,
  filteredOutSentence,
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

// ── נגזרות מבט-העל (צעד 3.1) — סדר, צבע, אריחים ותאי-המדד. הנתונים מגוונים ולא-מונוטוניים
// בכוונה (משמעת 30/07: דאטה אחידה מאשרת מיון שבור). ──

// שורת-RPC מינימלית של list_projects_overview — רק העמודות שהנגזרות קוראות.
function overviewRow(overrides) {
  return {
    project_id: 1,
    event_name: 'אירוע',
    final_event_date: '2026-08-22',
    project_status: 'in_progress',
    required_hostess_count: 6,
    hostesses_confirmed: 1,
    pending_invites: 0,
    assignments_row_count: 3,
    logistics_ready: 0,
    logistics_total: 2,
    ...overrides,
  }
}

describe('eventDaysFromToday + proximitySentence — עמודת "מתי"', () => {
  it('עתיד/עבר בימי-לוח, וקלט שבור מחזיר null ולא NaN', () => {
    expect(eventDaysFromToday('2026-08-22', '2026-08-13')).toBe(9)
    expect(eventDaysFromToday('2026-08-08', '2026-08-13')).toBe(-5)
    expect(eventDaysFromToday('לא תאריך', '2026-08-13')).toBeNull()
  })

  it('עתיד בנוסח המוקאפ, עבר בנוסח הארוך הנעול — זהה בשתי הלשוניות (§3.7)', () => {
    expect(proximitySentence(9)).toBe('בעוד 9 ימים')
    expect(proximitySentence(45)).toBe('בעוד 45 ימים')
    expect(proximitySentence(-5)).toBe('התקיים לפני 5 ימים')
    expect(proximitySentence(-12)).toBe('התקיים לפני 12 ימים')
  })

  it('לשון-יחיד בקצוות — לא "בעוד 1 ימים"', () => {
    expect(proximitySentence(0)).toBe('היום')
    expect(proximitySentence(1)).toBe('מחר')
    expect(proximitySentence(-1)).toBe('התקיים אתמול')
  })
})

describe('sortOverviewProjects — חסרים תחילה, ובתוכם לפי קרבת האירוע (S-7)', () => {
  const TODAY = '2026-08-13'

  it('לוח-המוקאפ המלא: קבוצת-החוסר לפי מרחק מוחלט, והסגורים אחריה — האדום אינו ראשון', () => {
    // בכוונה בסדר-קלט מעורבב, כדי שהמיון יעבוד בפועל ולא יאשר את סדר-הקליטה.
    const rows = [
      overviewRow({
        project_id: 3,
        final_event_date: '2026-09-27',
        project_status: 'not_started',
        hostesses_confirmed: 0,
        assignments_row_count: 0,
      }), // חסר · 45 · אדום
      overviewRow({
        project_id: 104,
        final_event_date: '2026-03-20',
        project_status: 'awaiting_payment',
      }), // סגור · 146
      overviewRow({
        project_id: 101,
        final_event_date: '2026-08-19',
        project_status: 'ready',
        hostesses_confirmed: 4,
        required_hostess_count: 4,
        logistics_ready: 2,
      }), // סגור · 6
      overviewRow({
        project_id: 7,
        final_event_date: '2026-08-01',
        project_status: 'event_finished',
        hostesses_confirmed: 0,
        assignments_row_count: 0,
      }), // חסר · 12
      overviewRow({ project_id: 8, final_event_date: '2026-08-22', hostesses_confirmed: 1 }), // חסר · 9
      overviewRow({
        project_id: 102,
        final_event_date: '2026-08-08',
        project_status: 'event_finished',
        hostesses_confirmed: 5,
        required_hostess_count: 5,
        assignments_row_count: 7,
        logistics_ready: 2,
      }), // חסר (סגירה) · 5
    ]
    const ids = sortOverviewProjects(rows, TODAY).map((p) => p.project_id)
    // ‏5 < 9 < 12 < 45 בקבוצת-החוסר (עבר ועתיד באותו סרגל), ואז 6 < 146 בקבוצה הסגורה.
    expect(ids).toEqual([102, 8, 7, 3, 101, 104])
  })

  it('S-7: תאריך שעבר ממוין לפי המרחק המוחלט — לפני 5 ימים מעל לפני 12 יום', () => {
    const rows = [
      overviewRow({
        project_id: 7,
        final_event_date: '2026-08-01',
        project_status: 'event_finished',
      }),
      overviewRow({
        project_id: 102,
        final_event_date: '2026-08-08',
        project_status: 'event_finished',
      }),
    ]
    expect(sortOverviewProjects(rows, TODAY).map((p) => p.project_id)).toEqual([102, 7])
  })

  it('שוויון-מרחק נשבר לפי project_id — סדר יציב, לא אקראי', () => {
    const rows = [
      overviewRow({ project_id: 20, final_event_date: '2026-08-18' }), // בעוד 5
      overviewRow({
        project_id: 10,
        final_event_date: '2026-08-08',
        project_status: 'event_finished',
      }), // לפני 5
    ]
    expect(sortOverviewProjects(rows, TODAY).map((p) => p.project_id)).toEqual([10, 20])
  })
})

describe('overviewHasGap + overviewRowKind — "יש חוסר" בינארי, וצבע-השורה', () => {
  it('ממתין-לסגירה תמיד חסר; סטטוס שנמסר הלאה לעולם לא', () => {
    expect(
      overviewHasGap(
        overviewRow({
          project_status: 'event_finished',
          hostesses_confirmed: 5,
          required_hostess_count: 5,
          logistics_ready: 2,
        }),
      ),
    ).toBe(true)
    expect(
      overviewHasGap(overviewRow({ project_status: 'cancelled', hostesses_confirmed: 0 })),
    ).toBe(false)
    expect(
      overviewHasGap(overviewRow({ project_status: 'awaiting_invoice', hostesses_confirmed: 0 })),
    ).toBe(false)
  })

  it('פעיל: חוסר-דיילות או חוסר-לוגיסטיקה — וכל אחד לבדו מספיק', () => {
    expect(overviewHasGap(overviewRow({ hostesses_confirmed: 6, logistics_ready: 1 }))).toBe(true)
    expect(overviewHasGap(overviewRow({ hostesses_confirmed: 2, logistics_ready: 2 }))).toBe(true)
    expect(
      overviewHasGap(
        overviewRow({ project_status: 'ready', hostesses_confirmed: 6, logistics_ready: 2 }),
      ),
    ).toBe(false)
    // ‏≥ ולא = (§7.43): עודף-אישורים 7/6 הוא מאויש, לא חוסר.
    expect(overviewHasGap(overviewRow({ hostesses_confirmed: 7, logistics_ready: 2 }))).toBe(false)
  })

  it('אדום = אפס שורות שיבוץ, ורק על שורה שעוד דורשת טיפול (⑥)', () => {
    expect(overviewRowKind(overviewRow({ assignments_row_count: 0 }))).toBe('red')
    expect(
      overviewRowKind(overviewRow({ project_status: 'event_finished', assignments_row_count: 0 })),
    ).toBe('red')
    expect(overviewRowKind(overviewRow({ assignments_row_count: 9 }))).toBe('plain')
    // מבוטל בלי זימונים אינו אדום — הוא אינו קורא לפעולה; הוא מעומעם.
    expect(
      overviewRowKind(overviewRow({ project_status: 'cancelled', assignments_row_count: 0 })),
    ).toBe('muted')
    expect(overviewRowKind(overviewRow({ project_status: 'awaiting_payment' }))).toBe('muted')
  })
})

describe('staffingCell + logisticsCell — תאי-המדד: יחס, מילה וטון', () => {
  it('דיילות: חסר עם זימונים = ענבר "חסרות N"; אפס שורות = אדום; מאויש = ✓', () => {
    expect(staffingCell(overviewRow({ hostesses_confirmed: 1, assignments_row_count: 9 }))).toEqual(
      { ratio: '1/6', sub: 'חסרות 5', tone: 'hint' },
    )
    expect(staffingCell(overviewRow({ hostesses_confirmed: 0, assignments_row_count: 0 }))).toEqual(
      { ratio: '0/6', sub: 'חסרות 6', tone: 'miss' },
    )
    expect(
      staffingCell(
        overviewRow({
          required_hostess_count: 1,
          hostesses_confirmed: 0,
          assignments_row_count: 1,
        }),
      ),
    ).toEqual({ ratio: '0/1', sub: 'חסרה 1', tone: 'hint' })
    expect(
      staffingCell(overviewRow({ required_hostess_count: 4, hostesses_confirmed: 4 })),
    ).toEqual({ ratio: '4/4', sub: '✓ מאויש', tone: 'done' })
  })

  it('אחרי שהאירוע עבר, אפס-שורות מנוסח כעובדה היסטורית — "אף אחת לא שובצה"', () => {
    expect(
      staffingCell(
        overviewRow({
          project_status: 'event_finished',
          hostesses_confirmed: 0,
          assignments_row_count: 0,
        }),
      ),
    ).toEqual({ ratio: '0/6', sub: 'אף אחת לא שובצה', tone: 'miss' })
  })

  it('לוגיסטיקה: אפס שורות = "✓ אין פריטים" בלי יחס (הכרעת-ישי 08/08, המקרה של #11)', () => {
    expect(logisticsCell(overviewRow({ logistics_total: 0 }))).toEqual({
      ratio: null,
      sub: '✓ אין פריטים',
      tone: 'done',
    })
    expect(logisticsCell(overviewRow({ logistics_ready: 2 }))).toEqual({
      ratio: '2/2',
      sub: '✓ מוכן',
      tone: 'done',
    })
    expect(logisticsCell(overviewRow({ logistics_ready: 0 }))).toEqual({
      ratio: '0/2',
      sub: 'טרם מוכנים',
      tone: 'hint',
    })
    expect(logisticsCell(overviewRow({ logistics_ready: 1 }))).toEqual({
      ratio: '1/2',
      sub: 'טרם מוכן',
      tone: 'hint',
    })
  })

  it('אחרי שהאירוע עבר הלוגיסטיקה כבר אינה עבודה — הטון calm ולא ענבר', () => {
    expect(
      logisticsCell(overviewRow({ project_status: 'event_finished', logistics_ready: 0 })).tone,
    ).toBe('calm')
  })

  it('שורה שנמסרה הלאה מסתירה את שני המדדים — מוכנות שם חסרת משמעות', () => {
    expect(staffingCell(overviewRow({ project_status: 'cancelled' }))).toEqual({ hidden: true })
    expect(logisticsCell(overviewRow({ project_status: 'awaiting_payment' }))).toEqual({
      hidden: true,
    })
  })
})

describe('gapTone — צבע עמודת "מה חסר" צמוד לענפי gapSentence', () => {
  it('miss רק כשאיש לא נגע; calm לעובדות; hint לשאר', () => {
    expect(gapTone(overviewRow({ assignments_row_count: 0 }))).toBe('miss')
    expect(
      gapTone(overviewRow({ project_status: 'event_finished', assignments_row_count: 0 })),
    ).toBe('miss')
    expect(
      gapTone(overviewRow({ project_status: 'event_finished', assignments_row_count: 7 })),
    ).toBe('hint')
    expect(gapTone(overviewRow({ hostesses_confirmed: 1, assignments_row_count: 9 }))).toBe('hint')
    expect(
      gapTone(overviewRow({ project_status: 'ready', hostesses_confirmed: 6, logistics_ready: 2 })),
    ).toBe('calm')
    expect(gapTone(overviewRow({ project_status: 'awaiting_payment' }))).toBe('calm')
    expect(gapTone(overviewRow({ project_status: 'cancelled' }))).toBe('calm')
  })
})

describe('overviewTiles — שני האריחים נספרים על רשימת-הפעילים של ⑫ בלבד', () => {
  // לוח מגוון: פעיל-חסר-בלי-זימונים · פעיל-חסר-עם-זימונים · פעיל-מאויש-בלי-לוגיסטיקה ·
  // ממתין-לסגירה-חסר (לא נספר!) · מבוטל-חסר (לא נספר!).
  const BOARD = [
    overviewRow({
      project_id: 3,
      project_status: 'not_started',
      hostesses_confirmed: 0,
      assignments_row_count: 0,
      logistics_ready: 0,
      logistics_total: 2,
    }),
    overviewRow({
      project_id: 8,
      hostesses_confirmed: 1,
      assignments_row_count: 9,
      logistics_ready: 0,
      logistics_total: 2,
    }),
    overviewRow({
      project_id: 11,
      required_hostess_count: 1,
      hostesses_confirmed: 0,
      assignments_row_count: 1,
      logistics_total: 0,
    }),
    overviewRow({
      project_id: 7,
      project_status: 'event_finished',
      hostesses_confirmed: 0,
      assignments_row_count: 0,
    }),
    overviewRow({
      project_id: 103,
      project_status: 'cancelled',
      hostesses_confirmed: 0,
      assignments_row_count: 0,
    }),
  ]

  it('אריח-הדיילות: שלושה פעילים חסרים, מתוכם אחד בלי אף זימון — הסגורים והמבוטלים בחוץ', () => {
    const tiles = overviewTiles(BOARD)
    expect(tiles.staffing).toEqual({ count: 3, noInviteCount: 1 })
    expect(staffingTileSub(tiles.staffing)).toBe('מתוכם 1 שלא נשלח בו אף זימון')
  })

  it('אריח-הלוגיסטיקה: שני פעילים חסרים · 4 פריטים טרם מוכנים; אפס-שורות אינו נספר כחסר', () => {
    const tiles = overviewTiles(BOARD)
    expect(tiles.logistics).toEqual({ count: 2, itemsNotReady: 4 })
    expect(logisticsTileSub(tiles.logistics)).toBe('4 פריטים טרם מוכנים')
  })

  it('אין חוסר ⇒ אין שורת-משנה ("לא בכוח" — אין ממצא, אין משפט)', () => {
    expect(staffingTileSub({ count: 0, noInviteCount: 0 })).toBeNull()
    expect(staffingTileSub({ count: 2, noInviteCount: 0 })).toBeNull()
    expect(logisticsTileSub({ count: 0, itemsNotReady: 0 })).toBeNull()
  })

  it('לשון-רבים בשורות-המשנה', () => {
    expect(staffingTileSub({ count: 3, noInviteCount: 2 })).toBe('מתוכם 2 שלא נשלח בהם אף זימון')
    expect(logisticsTileSub({ count: 1, itemsNotReady: 1 })).toBe('פריט אחד טרם מוכן')
  })
})

describe('filteredOutSentence — המונה של מצב-הריק-אחרי-סינון חי, לא מועתק', () => {
  it('רבים ויחיד', () => {
    expect(filteredOutSentence(8)).toBe('8 פרויקטים קיימים ואינם מוצגים כרגע.')
    expect(filteredOutSentence(1)).toBe('פרויקט אחד קיים ואינו מוצג כרגע.')
  })
})
