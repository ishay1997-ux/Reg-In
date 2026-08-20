// בדיקות-יחידה ל-src/lib/projectClosing.js — מודול 6, צעד 2.3 (מדריך-מיקרו §Phase 2).
// כל עוגן-כסף/מחרוזת כאן מצוטט מ-docs/specs/module_06_projects/spec.md §3.3/§1.4/§1.5
// ומ-docs/specs/module_06_projects/screens-approved.md §⑦ — לא מהזיכרון (כלל-ברזל 1).
import { describe, expect, it } from 'vitest'
import {
  ATTENDANCE_OPTIONS,
  QUALITY_MARKS,
  closingValidationSummary,
  defaultHoursForRow,
  hostessActualCost,
  isNoShowAttendance,
  plannedEventHours,
} from '@/lib/projectClosing'

describe('plannedEventHours — הגזירה שה-RPC מריץ בשרת (2.3 as-built ③), תוספת צעד 3.5', () => {
  it('16:00–22:00 ⇒ 6 שעות; 18:00–22:30 ⇒ 4.5', () => {
    expect(plannedEventHours('16:00:00', '22:00:00')).toBe(6)
    expect(plannedEventHours('18:00:00', '22:30:00')).toBe(4.5)
  })

  it('חציית-חצות מודולו יממה — 22:00–02:00 הן 4 שעות, לא ‎-20 (S-17)', () => {
    expect(plannedEventHours('22:00:00', '02:00:00')).toBe(4)
  })

  it('שעה חסרה ⇒ 24, בדיוק כמו ה-fallback של השרת — גבול מתירני, לא חסימה שגויה', () => {
    expect(plannedEventHours(null, '22:00:00')).toBe(24)
    expect(plannedEventHours('16:00:00', null)).toBe(24)
    expect(plannedEventHours(null, null)).toBe(24)
  })
})

describe('ATTENDANCE_OPTIONS — spec.md §1.4, סדר-המוקאפ המדויק', () => {
  it('שבע אפשרויות, בדיוק, באותו סדר כמו הטבלה המאושרת', () => {
    expect(ATTENDANCE_OPTIONS).toHaveLength(7)
    expect(ATTENDANCE_OPTIONS.map((o) => o.label)).toEqual([
      'הגיעה',
      'איחרה — קל',
      'איחרה — בינוני',
      'איחרה — רב',
      'לא הגיעה — חולה',
      'לא הגיעה — אישור מראש',
      'לא הגיעה — הבריזה',
    ])
  })

  it.each([
    ['הגיעה', { attendance_status: 'arrived', lateness_level: null, no_show_reason: null }],
    ['איחרה — קל', { attendance_status: 'late', lateness_level: 'light', no_show_reason: null }],
    [
      'איחרה — בינוני',
      { attendance_status: 'late', lateness_level: 'medium', no_show_reason: null },
    ],
    ['איחרה — רב', { attendance_status: 'late', lateness_level: 'heavy', no_show_reason: null }],
    [
      'לא הגיעה — חולה',
      { attendance_status: 'no_show', lateness_level: null, no_show_reason: 'sick' },
    ],
    [
      'לא הגיעה — אישור מראש',
      { attendance_status: 'no_show', lateness_level: null, no_show_reason: 'approved_absence' },
    ],
    [
      'לא הגיעה — הבריזה',
      { attendance_status: 'no_show', lateness_level: null, no_show_reason: 'ghosted' },
    ],
  ])('%s ⇒ %j (שלושת עמודות-המסד)', (label, expectedTuple) => {
    const option = ATTENDANCE_OPTIONS.find((o) => o.label === label)
    expect(option).toMatchObject(expectedTuple)
  })
})

describe('QUALITY_MARKS — spec.md §1.5, התווית על המסך אינה הערך במסד', () => {
  it('שלוש רשומות בדיוק', () => {
    expect(Object.keys(QUALITY_MARKS)).toHaveLength(3)
  })

  it('מצוינת ⇒ מצוינת', () => {
    expect(QUALITY_MARKS['מצוינת']).toBe('מצוינת')
  })

  it('בסדר ⇒ בסדר', () => {
    expect(QUALITY_MARKS['בסדר']).toBe('בסדר')
  })

  it('🔴 "לא לשלוח שוב" ⇒ "לא_לשלוח" — קו-תחתון, ובלי המילה "שוב" (schema.sql:883)', () => {
    expect(QUALITY_MARKS['לא לשלוח שוב']).toBe('לא_לשלוח')
  })

  it('לא מכיל את הצורות הפסולות שה-CHECK דוחה', () => {
    const dbValues = Object.values(QUALITY_MARKS)
    expect(dbValues).not.toContain('not_send')
    expect(dbValues).not.toContain('לא לשלוח')
  })
})

describe('isNoShowAttendance — ט4-א', () => {
  it.each(['לא הגיעה — חולה', 'לא הגיעה — אישור מראש', 'לא הגיעה — הבריזה'])(
    '%s הוא no_show',
    (label) => {
      expect(isNoShowAttendance(label)).toBe(true)
    },
  )

  it.each(['הגיעה', 'איחרה — קל', 'איחרה — בינוני', 'איחרה — רב'])('%s אינו no_show', (label) => {
    expect(isNoShowAttendance(label)).toBe(false)
  })

  it('תווית לא-מוכרת / חסרה ⇒ false, לא זריקה', () => {
    expect(isNoShowAttendance('משהו שלא קיים')).toBe(false)
    expect(isNoShowAttendance(null)).toBe(false)
    expect(isNoShowAttendance(undefined)).toBe(false)
  })
})

describe('hostessActualCost — 🔴 hourly_rate_snapshot, לא hostesses.hourly_rate של היום', () => {
  // spec.md §3.3 — טבלת הסגירה של #102, חמש השורות בדיוק כפי שהן כתובות שם.
  it('מיכל אברהם: 6.5 שעות × 42 ₪ = 273.00 ₪', () => {
    expect(hostessActualCost(6.5, 42)).toBeCloseTo(273.0, 2)
  })

  it('תמר גולן (שעות נדרסו ידנית ל-5.5): 5.5 × 46 ₪ = 253.00 ₪', () => {
    expect(hostessActualCost(5.5, 46)).toBeCloseTo(253.0, 2)
  })

  it('אביגיל רוזן: 6.5 × 44 ₪ = 286.00 ₪', () => {
    expect(hostessActualCost(6.5, 44)).toBeCloseTo(286.0, 2)
  })

  it('שרון כהן: 6.5 × 42 ₪ = 273.00 ₪', () => {
    expect(hostessActualCost(6.5, 42)).toBeCloseTo(273.0, 2)
  })

  it('קרן אשכנזי — no_show, שעות מאופסות ל-0: 0 × 47 ₪ = 0.00 ₪', () => {
    expect(hostessActualCost(0, 47)).toBe(0)
  })

  it('🎯 העוגן המלא: סכום חמש השורות = 1,085.00 ₪ בדיוק (spec.md §3.3)', () => {
    const rows = [
      { hours: 6.5, rate: 42 },
      { hours: 5.5, rate: 46 },
      { hours: 6.5, rate: 44 },
      { hours: 6.5, rate: 42 },
      { hours: 0, rate: 47 }, // קרן אשכנזי — no_show
    ]
    const total = rows.reduce((sum, r) => sum + hostessActualCost(r.hours, r.rate), 0)
    expect(total).toBeCloseTo(1085.0, 2)
  })

  it('קלט לא-תקין (null/שלילי) ⇒ 0, לא NaN/זריקה — טופס-בבנייה לא אמור לקרוס', () => {
    expect(hostessActualCost(null, 42)).toBe(0)
    expect(hostessActualCost(6, null)).toBe(0)
    expect(hostessActualCost(-1, 42)).toBe(0)
    expect(hostessActualCost(6, -1)).toBe(0)
  })
})

describe('defaultHoursForRow — ט4-ב, נגזר משעות-האירוע וניתן-לדריסה-לצמיתות', () => {
  it('שורה שלא נדרסה ⇒ ברירת-המחדל היא שעות-האירוע', () => {
    expect(defaultHoursForRow(6.5, false)).toBe(6.5)
  })

  it('שורה שנדרסה ⇒ null (הקורא לא נוגע בערך הידני שכבר יש בטופס)', () => {
    expect(defaultHoursForRow(6.5, true)).toBeNull()
  })

  it('שעות-אירוע לא-תקינות ⇒ null, לא NaN', () => {
    expect(defaultHoursForRow(null, false)).toBeNull()
    expect(defaultHoursForRow('', false)).toBeNull()
  })
})

describe('closingValidationSummary — משפט-החסימה היחיד ליד "שמור ושלח" הכבוי', () => {
  const fullRow = (overrides = {}) => ({
    attendanceLabel: 'הגיעה',
    qualityLabel: 'מצוינת',
    qualityReason: null,
    actualHours: 6.5,
    ...overrides,
  })

  it('טיוטה תקינה במלואה (חמש שורות, כמו #102 שנסגר בהצלחה) ⇒ null', () => {
    const draft = {
      actualHours: 6.5,
      actualGuests: 180,
      hasReport: true,
      rows: [
        fullRow(),
        fullRow({ qualityLabel: 'בסדר', actualHours: 5.5 }),
        fullRow({ qualityLabel: 'מצוינת' }),
        fullRow({ qualityLabel: 'בסדר' }),
        // קרן אשכנזי — no_show, שעות 0, איכות מושבתת (לא נספרת כחסרה)
        {
          attendanceLabel: 'לא הגיעה — הבריזה',
          qualityLabel: null,
          qualityReason: null,
          actualHours: 0,
        },
      ],
    }
    expect(closingValidationSummary(draft)).toBeNull()
  })

  it('🎯 העוגן המצוטט מילה-במילה: "לא ניתן לסגור: חסרים 2 סימוני-איכות ודוח-סיכום."', () => {
    const draft = {
      actualHours: 6.5,
      actualGuests: 180,
      hasReport: false, // דוח-סיכום חסר
      rows: [
        fullRow({ qualityLabel: null }), // סימון-איכות חסר #1
        fullRow({ qualityLabel: null }), // סימון-איכות חסר #2
        fullRow(),
        fullRow(),
        fullRow(),
      ],
    }
    expect(closingValidationSummary(draft)).toBe('לא ניתן לסגור: חסרים 2 סימוני-איכות ודוח-סיכום.')
  })

  it('סימון-איכות חסר יחיד ⇒ יחיד ("סימון-איכות אחד"), לא "1 סימוני-איכות" — הנחתי', () => {
    const draft = {
      actualHours: 6.5,
      actualGuests: 180,
      hasReport: true,
      rows: [fullRow({ qualityLabel: null }), fullRow(), fullRow(), fullRow(), fullRow()],
    }
    expect(closingValidationSummary(draft)).toBe('לא ניתן לסגור: חסרים סימון-איכות אחד.')
  })

  it('שעות-אירוע חסרות/מחוץ לתחום 0.5–24 (RPC bound) ⇒ נתפס לפני שליחה', () => {
    const base = {
      actualGuests: 180,
      hasReport: true,
      rows: [fullRow()],
    }
    expect(closingValidationSummary({ ...base, actualHours: null })).toContain('שעות ביצוע בפועל')
    expect(closingValidationSummary({ ...base, actualHours: 0 })).toContain('שעות ביצוע בפועל')
    expect(closingValidationSummary({ ...base, actualHours: 25 })).toContain('שעות ביצוע בפועל')
    expect(closingValidationSummary({ ...base, actualHours: 24 })).toBeNull()
  })

  it('אורחים-בפועל שלילי או ריק ⇒ נתפס; 0 חוקי ("אם לא הגיע איש — הזיני 0")', () => {
    const base = { actualHours: 6.5, hasReport: true, rows: [fullRow()] }
    expect(closingValidationSummary({ ...base, actualGuests: null })).toContain('כמות אורחים בפועל')
    expect(closingValidationSummary({ ...base, actualGuests: -1 })).toContain('כמות אורחים בפועל')
    expect(closingValidationSummary({ ...base, actualGuests: 0 })).toBeNull()
  })

  it('נוכחות חסרה בשורה ⇒ נספרת בנפרד מאיכות', () => {
    const draft = {
      actualHours: 6.5,
      actualGuests: 180,
      hasReport: true,
      rows: [fullRow({ attendanceLabel: null, qualityLabel: null }), fullRow()],
    }
    expect(closingValidationSummary(draft)).toContain('סימון-נוכחות אחד')
  })

  it('"לא לשלוח שוב" בלי סיבה ⇒ נתפס — הסיבה תופיע בכרטיס הדיילת (⑦)', () => {
    const draft = {
      actualHours: 6.5,
      actualGuests: 180,
      hasReport: true,
      rows: [fullRow({ qualityLabel: 'לא לשלוח שוב', qualityReason: null }), fullRow()],
    }
    expect(closingValidationSummary(draft)).toContain('לא לשלוח שוב')
  })

  it('"לא לשלוח שוב" עם סיבה ⇒ אינו נתפס', () => {
    const draft = {
      actualHours: 6.5,
      actualGuests: 180,
      hasReport: true,
      rows: [fullRow({ qualityLabel: 'לא לשלוח שוב', qualityReason: 'איחור חוזר' }), fullRow()],
    }
    expect(closingValidationSummary(draft)).toBeNull()
  })

  it('🔴 as-built ③: שעות-שורה מעל שעות-האירוע+2 נתפסות לפני שליחה (RPC bound)', () => {
    const draft = {
      actualHours: 6, // ⇒ הגבול פר-דיילת הוא 8
      actualGuests: 180,
      hasReport: true,
      rows: [fullRow({ actualHours: 8.5 }), fullRow({ actualHours: 8 })],
    }
    const summary = closingValidationSummary(draft)
    expect(summary).not.toBeNull()
    expect(summary).toContain('שעה בפועל אחת שגויה')
  })

  it('שעות-שורה שליליות נתפסות גם כששעות-האירוע עצמן לא ידועות', () => {
    const draft = {
      actualHours: null,
      actualGuests: 180,
      hasReport: true,
      rows: [fullRow({ actualHours: -1 })],
    }
    expect(closingValidationSummary(draft)).toContain('שעה בפועל אחת שגויה')
  })

  it('ט4-א: שורת no_show לא נספרת בבדיקת שעות-שורה (מאופסת ומושבתת בשרת ובטופס)', () => {
    const draft = {
      actualHours: 6.5,
      actualGuests: 180,
      hasReport: true,
      rows: [
        fullRow(),
        {
          attendanceLabel: 'לא הגיעה — הבריזה',
          qualityLabel: null,
          qualityReason: null,
          actualHours: 0,
        },
      ],
    }
    expect(closingValidationSummary(draft)).toBeNull()
  })

  it('רשימת-שורות ריקה ⇒ אין מסלול-סגירה (אירוע ללא דיילות אינו קורה — ישי 20/08/2026)', () => {
    const draft = { actualHours: 6.5, actualGuests: 180, hasReport: true, rows: [] }
    expect(closingValidationSummary(draft)).toBe('לא ניתן לסגור: לא שובצו דיילות לאירוע.')
  })

  it('draft ריק לגמרי ⇒ לא זורק, מחזיר משפט', () => {
    expect(() => closingValidationSummary({})).not.toThrow()
    expect(closingValidationSummary({})).not.toBeNull()
  })
})
