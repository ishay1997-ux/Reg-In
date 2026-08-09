import { describe, it, expect } from 'vitest'
import { buildSmartMatchCandidates } from './smartMatchCandidates'

// ── שכבת-ההרכבה: שורות-מסד ⇒ הקלט ש-`rankCandidates` דורש ────────────────────
//
// 🔑 **למה יש לה בדיקות משלה, ולמה הן דווקא בצורה הזאת:** העוגן המחושב-ביד
// (`smartMatch.test.js`) בודק את **האלגוריתם** על קלט מוכן. הוא לא יכול לתפוס טעות
// ב**הרכבת** אותו קלט — ובדיוק שם יושבות ההחלטות השקטות (מי נספרת במכנה, איך סופרים
// "עבדה אצל הלקוח", ממתי מודדים "שבועות מאז"). ⇒ הבדיקות כאן מוכיחות שהשכבה מייצרת
// **בדיוק** את חמשת המועמדים של העוגן, ומשם האלגוריתם כבר מוכח.

const EVENT_DATE = '2026-08-22'
const TODAY = '2026-08-09'

const project = {
  project_id: 8,
  customer_id: 55,
  final_event_date: EVENT_DATE,
  lat: 32.0853,
  lng: 34.7818,
}

// עוזר: שורת-שיבוץ. `n` = `assignment_number` (ברירת-מחדל 1).
function row(projectId, hostessId, status, eventDate, n = 1, customerId = 99) {
  return {
    project_id: projectId,
    hostess_id: hostessId,
    assignment_number: n,
    assignment_status: status,
    projects: { final_event_date: eventDate, customer_id: customerId, project_status: 'ready' },
  }
}

describe('buildSmartMatchCandidates — ההרכבה שמזינה את הדירוג', () => {
  it('🎯 מייצרת בדיוק את חמשת המועמדים של העוגן — כולל מי שתיפסל בשער', () => {
    // ⚠️ **כל החמש נטענות, גם הנפסלות** — `C` (ממוצע-החברה) מחושב עליהן, וסינון מוקדם
    // היה משנה אותו ואת כל הדירוג. זו מלכודת מדודה, `§11.3`.
    const hostesses = [
      { hostess_id: 1, full_name: 'נועה', status: 'active', has_car: true },
      { hostess_id: 2, full_name: 'דנה', status: 'active', has_car: true },
      { hostess_id: 3, full_name: 'מיכל', status: 'active', has_car: true },
      { hostess_id: 4, full_name: 'יעל', status: 'active', has_car: false },
      {
        hostess_id: 5,
        full_name: 'שירה',
        status: 'active',
        has_car: true,
        hostess_unavailability: [{ start_date: '2026-08-20', end_date: '2026-08-25' }],
      },
    ]

    // נועה: 7 במכנה, 6 במונה ⇒ שישה `confirmed_available` ואחד `declined`.
    const assignments = [
      ...Array.from({ length: 6 }, (_, i) => row(100 + i, 1, 'confirmed_available', '2026-01-01')),
      row(200, 1, 'declined', '2026-01-01'),
      // דנה: 12 ענו, 6 אישרו
      ...Array.from({ length: 6 }, (_, i) => row(300 + i, 2, 'finally_approved', '2026-01-01')),
      ...Array.from({ length: 6 }, (_, i) => row(400 + i, 2, 'declined', '2026-01-01')),
      // מיכל: 1 מתוך 1
      row(500, 3, 'confirmed_available', '2026-01-01'),
      // יעל: 5 ענו, 2 אישרו
      ...Array.from({ length: 2 }, (_, i) => row(600 + i, 4, 'confirmed_available', '2026-01-01')),
      ...Array.from({ length: 3 }, (_, i) => row(700 + i, 4, 'declined', '2026-01-01')),
      // שירה: 5 ענו, 3 אישרו
      ...Array.from({ length: 3 }, (_, i) => row(800 + i, 5, 'confirmed_available', '2026-01-01')),
      ...Array.from({ length: 2 }, (_, i) => row(900 + i, 5, 'declined', '2026-01-01')),
    ]

    const candidates = buildSmartMatchCandidates(
      { project, hostesses, assignments, sameDayHostessIds: [], preferences: [] },
      TODAY,
    )

    expect(candidates).toHaveLength(5)
    const byName = Object.fromEntries(candidates.map((c) => [c.full_name, c]))
    expect([byName['נועה'].answered, byName['נועה'].confirmed]).toEqual([7, 6])
    expect([byName['דנה'].answered, byName['דנה'].confirmed]).toEqual([12, 6])
    expect([byName['מיכל'].answered, byName['מיכל'].confirmed]).toEqual([1, 1])
    expect([byName['יעל'].answered, byName['יעל'].confirmed]).toEqual([5, 2])
    expect([byName['שירה'].answered, byName['שירה'].confirmed]).toEqual([5, 3])
  })

  it('🔴 "ממתינה למענה" אינה במכנה — אי-מענה אינו סירוב', () => {
    const candidates = buildSmartMatchCandidates(
      {
        project,
        hostesses: [{ hostess_id: 1, status: 'active' }],
        assignments: [
          row(100, 1, 'confirmed_available', '2026-01-01'),
          row(101, 1, 'pending', '2026-01-01'),
          row(102, 1, 'pending', '2026-01-01'),
        ],
        sameDayHostessIds: [],
        preferences: [],
      },
      TODAY,
    )
    expect([candidates[0].answered, candidates[0].confirmed]).toEqual([1, 1])
  })

  it('🔴 רק השורה הקובעת נספרת — סירוב שנעקף באישור אינו נספר פעמיים', () => {
    // אותה דיילת, אותו פרויקט: שורה 1 `declined`, שורה 2 `finally_approved`.
    // ‏**נתונים מבחינים:** אילו שתיהן נספרו — היה יוצא `2/1`, ולא `1/1`.
    const candidates = buildSmartMatchCandidates(
      {
        project,
        hostesses: [{ hostess_id: 1, status: 'active' }],
        assignments: [
          row(100, 1, 'declined', '2026-01-01', 1),
          row(100, 1, 'finally_approved', '2026-01-01', 2),
        ],
        sameDayHostessIds: [],
        preferences: [],
      },
      TODAY,
    )
    expect([candidates[0].answered, candidates[0].confirmed]).toEqual([1, 1])
  })

  describe('`עבדה אצל הלקוח הזה N×` — הכלל שהבלופרינט קבע (הנחה 11)', () => {
    const hostesses = [{ hostess_id: 1, status: 'active' }]

    function countFor(assignments) {
      return buildSmartMatchCandidates(
        { project, hostesses, assignments, sameDayHostessIds: [], preferences: [] },
        TODAY,
      )[0].workedForCustomerCount
    }

    it('סופר רק אירועים שכבר עברו, אצל אותו לקוח, ורק "אושרה סופית"', () => {
      expect(
        countFor([
          row(10, 1, 'finally_approved', '2026-01-01', 1, 55), // ✅ עבר, אותו לקוח
          row(11, 1, 'finally_approved', '2026-02-01', 1, 55), // ✅
          row(12, 1, 'finally_approved', '2026-12-01', 1, 55), // ❌ עתידי — עוד לא עבדה
          row(13, 1, 'confirmed_available', '2026-01-01', 1, 55), // ❌ לא אושרה סופית
          row(14, 1, 'finally_approved', '2026-01-01', 1, 77), // ❌ לקוח אחר
        ]),
      ).toBe(2)
    })

    // 🔴 **הבדיקה הזאת נכתבה פעמיים, והראשונה הייתה חסרת-ערך — נתפס בשבירה מכוונת.**
    // הגרסה הראשונה בדקה `declined` שנעקף ב-`finally_approved` וטענה שהיא מוכיחה
    // "סופר אירועים ולא שורות". **היא עוברת גם על מימוש שסופר שורות**: סינון-הסטטוס
    // מסלק את ה-`declined` ממילא, ואחרי הקיפול נשארת שורה אחת בכל מקרה.
    // ⇒ **הצורה שכן מבחינה: אושרה סופית ואז ביטלה.** מימוש שקורא את השורה הקובעת
    // מחזיר 0; מימוש שסורק את כל השורות מוצא את ה-`finally_approved` הישן ומחזיר 1 —
    // כלומר **זוקף לזכותה אירוע שהיא ביטלה.**
    it('🔴 אושרה סופית ואז ביטלה — השורה הקובעת היא הביטול, ולכן אינה נספרת', () => {
      expect(
        countFor([
          row(10, 1, 'finally_approved', '2026-01-01', 1, 55),
          row(10, 1, 'approval_withdrawn', '2026-01-01', 2, 55),
        ]),
      ).toBe(0)
    })
  })

  it('`weeksSinceWorked` נמדד מהאירוע האחרון שהושלם, ו-`null` למי שטרם עבדה', () => {
    const built = buildSmartMatchCandidates(
      {
        project,
        hostesses: [
          { hostess_id: 1, status: 'active' },
          { hostess_id: 2, status: 'active' },
        ],
        assignments: [row(10, 1, 'finally_approved', '2026-07-12', 1, 55)], // 4 שבועות לפני 09/08
        sameDayHostessIds: [],
        preferences: [],
      },
      TODAY,
    )
    const byId = Object.fromEntries(built.map((c) => [c.hostess_id, c]))
    expect(byId[1].weeksSinceWorked).toBe(4)
    expect(byId[2].weeksSinceWorked).toBe(null)
  })

  it('שער-היום ושער-ההעדפה מועברים כמו שהם — הפסילה עצמה היא של האלגוריתם', () => {
    const built = buildSmartMatchCandidates(
      {
        project,
        hostesses: [
          { hostess_id: 1, status: 'active' },
          { hostess_id: 2, status: 'active' },
        ],
        assignments: [],
        sameDayHostessIds: [1],
        preferences: [{ hostess_id: 2, preference: 'לא_לשלוח' }],
      },
      TODAY,
    )
    const byId = Object.fromEntries(built.map((c) => [c.hostess_id, c]))
    expect(byId[1].hasSameDayFinalAssignment).toBe(true)
    expect(byId[2].hasSameDayFinalAssignment).toBe(false)
    expect(byId[2].preference).toBe('לא_לשלוח')
  })

  it('🔴 דיילת בלי קואורדינטות ⇒ `distanceKm: null` — לא 0, ולא קו-המשווה', () => {
    const built = buildSmartMatchCandidates(
      {
        project,
        hostesses: [{ hostess_id: 1, status: 'active', lat: null, lng: null }],
        assignments: [],
        sameDayHostessIds: [],
        preferences: [],
      },
      TODAY,
    )
    expect(built[0].distanceKm).toBe(null)
  })

  // 🔴 **גם הבדיקה הזאת נוספה אחרי שבירה מכוונת שלא הפילה כלום.** שתי בדיקות-ה-`null`
  // שמעליי עוברות **גם** על מימוש שקורא ל-`haversineKm` הגולמי, כי גם הוא מחזיר `null`
  // על קואורדינטה חסרה ⇒ הן אינן מבחינות בין שתי הפונקציות.
  // **מה שכן מבחין — וזה בדיוק המקרה החי:** דיילת ואירוע שנפתרו ל**אותה נקודה בדיוק**
  // (כתובת שירדה לרמת-עיר משני הצדדים). ‏`haversineKm` יחזיר `0` ⇒ ציון-קרבה **מושלם**,
  // כלומר ככל שיש עלינו פחות מידע עליה כך היא מדורגת גבוה יותר. ‏`candidateDistanceKm`
  // מחזיר `null`, ומשם הציון ניטרלי. *(`סיון נחום` נפתרה בדיוק לקואורדינטות של אירוע 3.)*
  it('🔴 דיילת ואירוע על אותה נקודה בדיוק ⇒ `null`, לא `0` — "0 ק"מ" מזויף הוא הציון המושלם', () => {
    const built = buildSmartMatchCandidates(
      {
        project,
        hostesses: [{ hostess_id: 1, status: 'active', lat: project.lat, lng: project.lng }],
        assignments: [],
        sameDayHostessIds: [],
        preferences: [],
      },
      TODAY,
    )
    expect(built[0].distanceKm).toBe(null)
  })

  it('🔴 אירוע בלי קואורדינטות ⇒ כל המרחקים `null`, ולא אפס לכולן', () => {
    const built = buildSmartMatchCandidates(
      {
        project: { ...project, lat: null, lng: null },
        hostesses: [{ hostess_id: 1, status: 'active', lat: 32.1, lng: 34.8 }],
        assignments: [],
        sameDayHostessIds: [],
        preferences: [],
      },
      TODAY,
    )
    expect(built[0].distanceKm).toBe(null)
  })
})
