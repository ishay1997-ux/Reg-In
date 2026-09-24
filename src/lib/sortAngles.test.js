import { describe, it, expect } from 'vitest'
import { SORT_ANGLES, defaultSortAngle, isAngleAvailable, sortByAngle } from './sortAngles'

// מועמדות **מדורגות** (הפלט של `rankCandidates`), עם נתונים **מבחינים**: לכל זווית סדר אחר.
// 🔑 וזו כל הפואנטה של הבדיקות כאן — אם הנתונים היו נותנים אותו סדר בכל זווית, כל בדיקה
// הייתה עוברת גם על מימוש שמתעלם מהזווית לגמרי.
const RANKED = [
  {
    hostess_id: 1,
    full_name: 'אלף',
    score: 0.9,
    pinned: false,
    tieBreak: 'a',
    distanceKm: 30,
    workedForCustomerCount: 0,
    hourly_rate: 50,
  },
  {
    hostess_id: 2,
    full_name: 'בית',
    score: 0.8,
    pinned: false,
    tieBreak: 'b',
    distanceKm: 5,
    workedForCustomerCount: 3,
    hourly_rate: 60,
  },
  {
    hostess_id: 3,
    full_name: 'גימל',
    score: 0.7,
    pinned: false,
    tieBreak: 'c',
    distanceKm: 12,
    workedForCustomerCount: 1,
    hourly_rate: 42,
  },
]

const names = (rows) => rows.map((r) => r.full_name)

describe('ארבע הזוויות — מסדרות בלבד', () => {
  it('🔴 כל זווית מחזירה את **אותן** מועמדות, רק בסדר אחר — היא אינה מסננת', () => {
    for (const angle of Object.keys(SORT_ANGLES)) {
      const sorted = sortByAngle(RANKED, angle)
      expect(sorted).toHaveLength(RANKED.length)
      expect([...names(sorted)].sort()).toEqual([...names(RANKED)].sort())
    }
  })

  // ✏️ הכרעת-ישי 25/09/2026: העדשה החמישית, וברירת-המחדל. הנתונים מבחינים — ההמלצה היא
  // הסדר היחיד שבו "אלף" (הרחוקה, היקרה, בלי היסטוריה אצל הלקוח) ראשונה.
  it('🔴 המלצת המערכת — הציון הגבוה ראשון', () => {
    expect(names(sortByAngle(RANKED, 'recommended'))).toEqual(['אלף', 'בית', 'גימל'])
  })

  // 🐞 עד 25/09/2026 הזווית מיינה לפי `averageResponseHours`, שאיש לא יצר ⇒ הגרלה.
  // הנתונים מבחינים: סדר-הזמנים (גימל ← אלף ← בית) שונה משובר-השוויון (אלף ← בית ← גימל).
  it('🔴 תענה הכי מהר — זמן-התגובה החציוני הקצר ראשון, ו"לא ידוע" בסוף', () => {
    const timed = [
      { ...RANKED[0], medianResponseHours: 9 },
      { ...RANKED[1], medianResponseHours: null },
      { ...RANKED[2], medianResponseHours: 2.5 },
    ]
    expect(names(sortByAngle(timed, 'fastest'))).toEqual(['גימל', 'אלף', 'בית'])
  })

  it('קרבה — הקרובה ראשונה', () => {
    expect(names(sortByAngle(RANKED, 'proximity'))).toEqual(['בית', 'גימל', 'אלף'])
  })

  it('עבדה אצל הלקוח הזה — המנוסה ביותר אצלו ראשונה', () => {
    expect(names(sortByAngle(RANKED, 'customer'))).toEqual(['בית', 'גימל', 'אלף'])
  })

  it('הזולה ביותר — התעריף הנמוך ראשון', () => {
    expect(names(sortByAngle(RANKED, 'cheapest'))).toEqual(['גימל', 'אלף', 'בית'])
  })

  it('🔴 מרחק חסר יורד לסוף ולא מתחזה לקרובה ביותר', () => {
    const withUnknown = [
      ...RANKED,
      { ...RANKED[0], hostess_id: 9, full_name: 'דלת', distanceKm: null },
    ]
    expect(names(sortByAngle(withUnknown, 'proximity')).at(-1)).toBe('דלת')
  })

  it('🔴 נעוצה נשארת בראש בכל זווית — הנעיצה היא שכבה 2, והזווית היא שכבה 4', () => {
    const pinned = [
      ...RANKED,
      {
        ...RANKED[0],
        hostess_id: 9,
        full_name: 'נעוצה',
        pinned: true,
        distanceKm: 999,
        hourly_rate: 999,
        workedForCustomerCount: 0,
      },
    ]
    // ✏️ 25/09/2026: גם בעדשת ההמלצה — הנעוצה כאן בעלת הציון הנמוך ביותר.
    const lowest = pinned.map((c) => (c.pinned ? { ...c, score: 0.1 } : c))
    for (const angle of Object.keys(SORT_ANGLES)) {
      expect(names(sortByAngle(lowest, angle))[0]).toBe('נעוצה')
    }
  })

  it('ציון שווה בזווית ⇒ שובר-שוויון קבוע, ולעולם לא סדר-הקליטה', () => {
    const tied = [
      { ...RANKED[0], full_name: 'שני', tieBreak: 'z', distanceKm: 10 },
      { ...RANKED[1], full_name: 'ראשון', tieBreak: 'a', distanceKm: 10 },
    ]
    expect(names(sortByAngle(tied, 'proximity'))).toEqual(['ראשון', 'שני'])
  })
})

describe('ברירת-המחדל וזווית שאין לה דאטה', () => {
  // ✏️ הכרעת-ישי 25/09/2026: "אחרת קרבה" ⇐ "אחרת המלצת המערכת". ה-72 שעות נשארות (פער 1 (א)).
  it('אירוע רגיל ⇒ המלצת המערכת · אירוע מתחת ל-72 שעות ⇒ "תענה הכי מהר"', () => {
    expect(defaultSortAngle(false, { hasResponseTimes: true })).toBe('recommended')
    expect(defaultSortAngle(true, { hasResponseTimes: true })).toBe('fastest')
  })

  it('ההמלצה היא הכפתור הראשון בשורת-הזוויות', () => {
    expect(Object.keys(SORT_ANGLES)[0]).toBe('recommended')
    expect(SORT_ANGLES.recommended.label).toBe('המלצת המערכת')
  })

  // 🔴 **בטוח-כברירת-מחדל, ובכוונה.** הבדיקה הראשונה שכתבתי כאן קראה `defaultSortAngle(true)`
  // בלי דגל-זמינות וציפתה ל-`fastest` — כלומר **דרשה שקורא ששכח להעביר את הדגל יקבל מיון
  // לפי עמודה ריקה.** זה בדיוק הכשל השקט שהזווית הכבויה קיימת כדי למנוע. ⇒ החוזה הפוך:
  // הזווית נחשבת כבויה עד שמוכיחים שיש לה דאטה.
  it('דגל-זמינות שלא הועבר נחשב "אין דאטה" — לא "יש"', () => {
    expect(defaultSortAngle(true)).toBe('recommended')
  })

  it('🔴 "תענה הכי מהר" כבויה כל עוד אין נתוני-זמן-תגובה — ואינה נעלמת', () => {
    expect(isAngleAvailable('fastest', { hasResponseTimes: false })).toBe(false)
    expect(isAngleAvailable('fastest', { hasResponseTimes: true })).toBe(true)
    expect(SORT_ANGLES.fastest.disabledNote).toContain('זמן')
  })

  it('🔴 וכשהיא כבויה, ברירת-המחדל נופלת חזרה להמלצה — לא ממיינת שגוי בשקט', () => {
    // האירוע דחוף ⇒ ברירת-המחדל הייתה "תענה הכי מהר", אבל אין לה דאטה.
    expect(defaultSortAngle(true, { hasResponseTimes: false })).toBe('recommended')
  })

  it('ארבע העדשות האחרות זמינות תמיד', () => {
    for (const angle of ['recommended', 'proximity', 'customer', 'cheapest']) {
      expect(isAngleAvailable(angle, { hasResponseTimes: false })).toBe(true)
    }
  })
})
