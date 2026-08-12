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
    for (const angle of ['proximity', 'customer', 'cheapest']) {
      expect(names(sortByAngle(pinned, angle))[0]).toBe('נעוצה')
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
  it('אירוע רגיל ⇒ קרבה · אירוע מתחת ל-72 שעות ⇒ "תענה הכי מהר"', () => {
    expect(defaultSortAngle(false, { hasResponseTimes: true })).toBe('proximity')
    expect(defaultSortAngle(true, { hasResponseTimes: true })).toBe('fastest')
  })

  // 🔴 **בטוח-כברירת-מחדל, ובכוונה.** הבדיקה הראשונה שכתבתי כאן קראה `defaultSortAngle(true)`
  // בלי דגל-זמינות וציפתה ל-`fastest` — כלומר **דרשה שקורא ששכח להעביר את הדגל יקבל מיון
  // לפי עמודה ריקה.** זה בדיוק הכשל השקט שהזווית הכבויה קיימת כדי למנוע. ⇒ החוזה הפוך:
  // הזווית נחשבת כבויה עד שמוכיחים שיש לה דאטה.
  it('דגל-זמינות שלא הועבר נחשב "אין דאטה" — לא "יש"', () => {
    expect(defaultSortAngle(true)).toBe('proximity')
  })

  it('🔴 "תענה הכי מהר" כבויה כל עוד אין נתוני-זמן-תגובה — ואינה נעלמת', () => {
    expect(isAngleAvailable('fastest', { hasResponseTimes: false })).toBe(false)
    expect(isAngleAvailable('fastest', { hasResponseTimes: true })).toBe(true)
    expect(SORT_ANGLES.fastest.disabledNote).toContain('זמן')
  })

  it('🔴 וכשהיא כבויה, ברירת-המחדל נופלת חזרה לקרבה — לא ממיינת שגוי בשקט', () => {
    // האירוע דחוף ⇒ ברירת-המחדל הייתה "תענה הכי מהר", אבל אין לה דאטה.
    expect(defaultSortAngle(true, { hasResponseTimes: false })).toBe('proximity')
  })

  it('שלוש הזוויות האחרות זמינות תמיד', () => {
    for (const angle of ['proximity', 'customer', 'cheapest']) {
      expect(isAngleAvailable(angle, { hasResponseTimes: false })).toBe(true)
    }
  })
})
