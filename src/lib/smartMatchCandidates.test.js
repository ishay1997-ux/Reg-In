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
// חלון-החישוב כפי שהוא ב-`params` (`research §11.1`): 12 חודשים, 24 במורחב, סף 3 תשובות.
// ⚠️ כל שורות-העוגן כאן (`2026-01-01`) בתוך 12 החודשים — החלון אינו משנה את העוגן.
const WINDOW = { months: 12, extendedMonths: 24, minAnswers: 3 }

const project = {
  project_id: 8,
  customer_id: 55,
  final_event_date: EVENT_DATE,
  lat: 32.0853,
  lng: 34.7818,
}

// עוזר: שורת-שיבוץ. `n` = `assignment_number` (ברירת-מחדל 1).
// `attendance` — פרמטר-רשות, שלוש עמודות-הנוכחות של §2.7 (`{attendance_status,
// lateness_level, no_show_reason}`); ברירת-המחדל היא שיבוץ שטרם נסגר (שלושתן `null`).
function row(projectId, hostessId, status, eventDate, n = 1, customerId = 99, attendance = {}) {
  return {
    project_id: projectId,
    hostess_id: hostessId,
    assignment_number: n,
    assignment_status: status,
    projects: { final_event_date: eventDate, customer_id: customerId, project_status: 'ready' },
    ...attendance,
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
      WINDOW,
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
      WINDOW,
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
      WINDOW,
    )
    expect([candidates[0].answered, candidates[0].confirmed]).toEqual([1, 1])
  })

  describe('`עבדה אצל הלקוח הזה N×` — הכלל שהבלופרינט קבע (הנחה 11)', () => {
    const hostesses = [{ hostess_id: 1, status: 'active' }]

    function countFor(assignments) {
      return buildSmartMatchCandidates(
        { project, hostesses, assignments, sameDayHostessIds: [], preferences: [] },
        TODAY,
        WINDOW,
      )[0].workedForCustomerCount
    }

    // 🆕 אודיט-הסגירה 12/08/2026, הכרעת-ישי. `§ב8` מכריע שביטול-לקוח לא ייספר **לרעתה**
    // ושותק על הכיוון ההפוך — ובלי התנאי הזה אירוע שבוטל נספר **לזכותה**, כלומר הצ'יפ
    // מבטיח היכרות עם הלקוח שמעולם לא התרחשה.
    it('🔴 אירוע שהלקוח ביטל אינו נספר — היא לא עבדה שם אף שעה', () => {
      const cancelled = row(20, 1, 'finally_approved', '2026-01-01', 1, 55)
      cancelled.projects.project_status = 'cancelled'
      expect(countFor([cancelled])).toBe(0)
      // ובקרה חיובית באותה נשימה: אותה שורה בדיוק, בלי הביטול, כן נספרת.
      expect(countFor([row(20, 1, 'finally_approved', '2026-01-01', 1, 55)])).toBe(1)
    })

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

  // ✏️ 25/09/2026 (הכרעת-ישי, פער 4): **שני שעונים.** `weeksSinceWorked` — קלט המנוף — עד
  // תאריך-האירוע (22/08); `weeksSinceWorkedToday` — הצ'יפ — עד היום (09/08).
  it("`weeksSinceWorked` נמדד עד תאריך-האירוע והצ'יפ עד היום · `null` למי שטרם עבדה", () => {
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
      WINDOW,
    )
    const byId = Object.fromEntries(built.map((c) => [c.hostess_id, c]))
    // 12/07 ⇐ 22/08 = 41 יום = 5 שבועות שלמים · 12/07 ⇐ 09/08 = 28 יום = 4.
    expect(byId[1].weeksSinceWorked).toBe(5)
    expect(byId[1].weeksSinceWorkedToday).toBe(4)
    expect(byId[2].weeksSinceWorked).toBe(null)
    expect(byId[2].weeksSinceWorkedToday).toBe(null)
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
      WINDOW,
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
      WINDOW,
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
      WINDOW,
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
      WINDOW,
    )
    expect(built[0].distanceKm).toBe(null)
  })
})

// ── attendance — §2.7: הקלט הגולמי ל-reliabilityScore, לא עוד `[]` מקודד ────────────────
describe('buildSmartMatchCandidates — attendance מוזנת משורות אמיתיות (§2.7)', () => {
  it('🔴 שיבוץ `finally_approved` שנסגר מזין רשומת-נוכחות אמיתית — לא [] עוד', () => {
    const built = buildSmartMatchCandidates(
      {
        project,
        hostesses: [{ hostess_id: 1, status: 'active' }],
        assignments: [
          row(10, 1, 'finally_approved', '2026-01-01', 1, 55, {
            attendance_status: 'late',
            lateness_level: 'medium',
          }),
        ],
        sameDayHostessIds: [],
        preferences: [],
      },
      TODAY,
      WINDOW,
    )
    expect(built[0].attendance).toHaveLength(1)
    expect(built[0].attendance[0]).toMatchObject({
      attendance_status: 'late',
      lateness_level: 'medium',
      projectCancelled: false,
      eventPassed: true,
    })
  })

  it('🔴 "ביטלה אחרי אישור" — הענף הנפרד: אין עמודות-נוכחות בכלל, ועדיין נכנסת לרשימה', () => {
    // ‏§2.7#2: WITHDREW אינו ערך-נוכחות — מגיע מ-assignment_status, לא מהעמודות.
    const built = buildSmartMatchCandidates(
      {
        project,
        hostesses: [{ hostess_id: 1, status: 'active' }],
        assignments: [row(10, 1, 'approval_withdrawn', '2026-01-01', 1, 55)],
        sameDayHostessIds: [],
        preferences: [],
      },
      TODAY,
      WINDOW,
    )
    expect(built[0].attendance).toHaveLength(1)
    expect(built[0].attendance[0]).toMatchObject({
      assignment_status: 'approval_withdrawn',
      projectCancelled: false,
      eventPassed: true,
    })
  })

  it('שיבוץ `finally_approved` שטרם נסגר (שלוש העמודות null) אינו עובדה — לא נכנס לרשימה', () => {
    const built = buildSmartMatchCandidates(
      {
        project,
        hostesses: [{ hostess_id: 1, status: 'active' }],
        assignments: [row(10, 1, 'finally_approved', '2026-01-01', 1, 55)],
        sameDayHostessIds: [],
        preferences: [],
      },
      TODAY,
      WINDOW,
    )
    expect(built[0].attendance).toEqual([])
  })

  it('סטטוסים לא-רלוונטיים לאמינות (pending·declined) אינם מייצרים רשומה', () => {
    const built = buildSmartMatchCandidates(
      {
        project,
        hostesses: [{ hostess_id: 1, status: 'active' }],
        assignments: [row(10, 1, 'declined', '2026-01-01'), row(11, 1, 'pending', '2026-01-01')],
        sameDayHostessIds: [],
        preferences: [],
      },
      TODAY,
      WINDOW,
    )
    expect(built[0].attendance).toEqual([])
  })

  it('`projectCancelled` ו-`eventPassed` נגזרים נכון לכל שורה בנפרד — נתונים לא-אחידים', () => {
    // ⚠️ CLAUDE.md: בדיקת-קיבוץ/סינון על נתונים אחידים "עוברת תמיד, גם כשהקוד לא עשה כלום" —
    // כאן שתי שורות **שונות** של אותה דיילת: פרויקט מבוטל, ופרויקט עתידי.
    const cancelledRow = row(10, 1, 'finally_approved', '2026-01-01', 1, 55, {
      attendance_status: 'no_show',
      no_show_reason: 'ghosted',
    })
    cancelledRow.projects.project_status = 'cancelled'
    const futureRow = row(11, 1, 'finally_approved', '2026-12-01', 1, 55, {
      attendance_status: 'arrived',
    })

    const built = buildSmartMatchCandidates(
      {
        project,
        hostesses: [{ hostess_id: 1, status: 'active' }],
        assignments: [cancelledRow, futureRow],
        sameDayHostessIds: [],
        preferences: [],
      },
      TODAY,
      WINDOW,
    )

    expect(built[0].attendance).toHaveLength(2)
    const cancelledRecord = built[0].attendance.find((r) => r.no_show_reason === 'ghosted')
    const futureRecord = built[0].attendance.find((r) => r.attendance_status === 'arrived')
    expect(cancelledRecord.projectCancelled).toBe(true)
    expect(cancelledRecord.eventPassed).toBe(true)
    expect(futureRecord.projectCancelled).toBe(false)
    expect(futureRecord.eventPassed).toBe(false)
  })

  it('שתי דיילות שונות — אחת עם היסטוריה סגורה, אחת בלי — אינן מתערבבות', () => {
    const built = buildSmartMatchCandidates(
      {
        project,
        hostesses: [
          { hostess_id: 1, status: 'active' },
          { hostess_id: 2, status: 'active' },
        ],
        assignments: [
          row(10, 1, 'finally_approved', '2026-01-01', 1, 55, { attendance_status: 'arrived' }),
          row(20, 2, 'confirmed_available', '2026-01-01'),
        ],
        sameDayHostessIds: [],
        preferences: [],
      },
      TODAY,
      WINDOW,
    )
    const byId = Object.fromEntries(built.map((c) => [c.hostess_id, c]))
    expect(byId[1].attendance).toHaveLength(1)
    expect(byId[2].attendance).toEqual([])
  })
})

// ── חלון-החישוב · 12 ⇐ 24 חודשים (הכרעת-ישי 25/09/2026, אודיט השיבוץ-החכם פער 3) ────────
describe('buildSmartMatchCandidates — חלון-החישוב', () => {
  function build(assignments, window = WINDOW) {
    return buildSmartMatchCandidates(
      {
        project,
        hostesses: [{ hostess_id: 1, status: 'active' }],
        assignments,
        sameDayHostessIds: [],
        preferences: [],
      },
      TODAY,
      window,
    )[0]
  }

  it('🔴 סופר רק את 12 החודשים — שורות ישנות אינן נספרות כשיש מספיק תשובות בחלון', () => {
    // ‏**נתונים מבחינים:** בחלון 3 תשובות, 3 אישורים; מחוצה לו (2024) 4 סירובים.
    // מימוש שסופר את כל ההיסטוריה מחזיר `7/3`, לא `3/3`.
    const c = build([
      row(1, 1, 'confirmed_available', '2026-03-01'),
      row(2, 1, 'confirmed_available', '2026-04-01'),
      row(3, 1, 'confirmed_available', '2026-05-01'),
      ...Array.from({ length: 4 }, (_, i) => row(10 + i, 1, 'declined', '2024-06-01')),
    ])
    expect([c.answered, c.confirmed]).toEqual([3, 3])
  })

  it('🔴 פחות מהסף בחלון ⇒ מתרחב ל-24 חודשים — אבל לא מעבר להם', () => {
    // בחלון: תשובה אחת (מתחת ל-3) ⇒ מרחיבים. ב-24: עוד שתיים (2025). מעבר (2023): לא נספרת.
    const c = build([
      row(1, 1, 'confirmed_available', '2026-03-01'),
      row(2, 1, 'declined', '2025-02-01'),
      row(3, 1, 'confirmed_available', '2024-10-01'),
      row(4, 1, 'declined', '2023-01-01'),
    ])
    expect([c.answered, c.confirmed]).toEqual([3, 2])
    // ‏`C` של החברה נשאר על החלון הבסיסי (הנחה 4) — כאן תשובה אחת.
    expect([c.baseAnswered, c.baseConfirmed]).toEqual([1, 1])
  })

  it('גבול החלון: בדיוק 12 חודשים אחורה — בפנים; יום לפני — בחוץ', () => {
    const c = build([
      ...Array.from({ length: 3 }, (_, i) => row(1 + i, 1, 'confirmed_available', '2026-05-01')),
      row(10, 1, 'declined', '2025-08-09'), // בדיוק 12 חודשים לפני 09/08/2026
      row(11, 1, 'declined', '2025-08-08'), // יום לפני — בחוץ
    ])
    expect(c.answered).toBe(4)
  })

  it('שורה בלי תאריך-אירוע נשארת בחלון — לא נזרקת על סמך נתון חסר', () => {
    const noDate = row(1, 1, 'confirmed_available', null)
    const c = build([noDate])
    expect(c.answered).toBe(1)
  })

  it('🛑 חלון חסר עוצר — אין נפילה שקטה ל"כל ההיסטוריה"', () => {
    // ‏`null` ולא `undefined` — `undefined` היה מפעיל את ברירת-המחדל של העוזר `build` עצמו.
    expect(() => build([], null)).toThrow('חלון-החישוב')
    expect(() => build([], { months: 12, extendedMonths: null, minAnswers: 3 })).toThrow()
  })
})

// ── "תענה הכי מהר" · זמן-התגובה החציוני (הכרעת-ישי 25/09/2026, פער 2) ──────────────────
describe('buildSmartMatchCandidates — medianResponseHours', () => {
  // שורה שנענתה דרך הקישור: נשלחה ב-09:00, נענתה אחרי `hours` שעות.
  function answered(projectId, hours, eventDate = '2026-06-01') {
    const sent = Date.parse('2026-05-01T09:00:00Z')
    return {
      ...row(projectId, 1, 'confirmed_available', eventDate),
      invite_sent_at: new Date(sent).toISOString(),
      responded_at: new Date(sent + hours * 3_600_000).toISOString(),
    }
  }

  function median(assignments) {
    return buildSmartMatchCandidates(
      {
        project,
        hostesses: [{ hostess_id: 1, status: 'active' }],
        assignments,
        sameDayHostessIds: [],
        preferences: [],
      },
      TODAY,
      WINDOW,
    )[0].medianResponseHours
  }

  it('🔴 חציון ולא ממוצע — תשובה אחת איטית אינה גוררת דיילת מהירה', () => {
    // 1 · 2 · 100 ⇒ חציון 2 (ממוצע היה 34.3).
    expect(median([answered(1, 1), answered(2, 100), answered(3, 2)])).toBe(2)
  })

  it('מספר זוגי של תשובות ⇒ ממוצע שתי האמצעיות', () => {
    expect(median([answered(1, 1), answered(2, 3), answered(3, 5), answered(4, 7)])).toBe(4)
  })

  it('🔴 פחות מהסף ⇒ `null` ("לא ידוע") — לא "הכי מהירה"', () => {
    expect(median([answered(1, 1), answered(2, 1)])).toBe(null)
    expect(median([])).toBe(null)
  })

  it('רק שורות עם שני הזמנים נמדדות — סימון ידני (בלי `responded_at`) אינו זמן אפס', () => {
    const manual = row(9, 1, 'confirmed_available', '2026-06-01')
    manual.invite_sent_at = '2026-05-01T09:00:00Z'
    expect(median([answered(1, 5), answered(2, 6), manual])).toBe(null)
  })

  it('זמן שלילי מדולג — הוא עדות לרענון-שליחה, לא למהירות', () => {
    const negative = { ...answered(9, 1), responded_at: '2026-04-30T09:00:00Z' }
    expect(median([answered(1, 5), answered(2, 6), answered(3, 7), negative])).toBe(6)
  })

  it('רק בתוך החלון — תשובות מלפני 24 חודשים אינן נמדדות', () => {
    expect(
      median([
        answered(1, 1, '2023-01-01'),
        answered(2, 1, '2023-01-01'),
        answered(3, 1, '2023-01-01'),
      ]),
    ).toBe(null)
  })
})
