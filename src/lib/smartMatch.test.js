import { describe, it, expect } from 'vitest'
import {
  SMART_MATCH_PARAM_NAMES,
  ATTENDANCE_OUTCOMES,
  NEUTRAL_PROXIMITY_SCORE,
  parseSmartMatchParams,
  activeWeights,
  companyResponsivenessAverage,
  responsivenessCounts,
  responsivenessScore,
  proximityScore,
  reliabilityScore,
  fairnessLeverage,
  haversineKm,
  candidateDistanceKm,
  tieBreakKey,
  rankCandidates,
} from './smartMatch'

// ── ה-Seed החי (מיגרציה 20260809125750) ─────────────────────────────────────
// הערכים כאן הם **מחרוזות**, כי `params.param_value` הוא `text` לכל סוג — כולל
// המשקולות והדגל הבוליאני. בדיקה שתזין מספרים הייתה מפספסת בדיוק את שכבת הפענוח.
const SEED_PARAMS = {
  משקולת_היענות: '0.40',
  משקולת_אמינות: '0.35',
  משקולת_קרבה: '0.25',
  שער_מרחק_קמ: '80',
  גולפוסט_מרחק_קמ: '40',
  קבוע_ריסון_m: '3',
  חלון_חישוב_חודשים: '12',
  חלון_חישוב_מורחב_חודשים: '24',
  מינימום_תשובות_להצגת_ציון: '3',
  שיעור_בונוס_הוגנות_לשבוע: '0.02',
  תקרת_שבועות_הוגנות: '8',
  לא_ענתה_ל_N: '4',
  מרכיב_אמינות_פעיל: 'false',
}

describe('שמות-הפרמטרים — זהים בית-בבית ל-14 שורות ה-Seed', () => {
  // ⚠️ שם שגוי בתו אחד מחזיר שורה ריקה, הפרמטר נראה "חסר", ואין שום שגיאה.
  it('שלוש-עשרה המחרוזות של smart_match', () => {
    expect(SMART_MATCH_PARAM_NAMES).toEqual({
      responsivenessWeight: 'משקולת_היענות',
      reliabilityWeight: 'משקולת_אמינות',
      proximityWeight: 'משקולת_קרבה',
      gateDistanceKm: 'שער_מרחק_קמ',
      goalpostDistanceKm: 'גולפוסט_מרחק_קמ',
      dampingConstant: 'קבוע_ריסון_m',
      windowMonths: 'חלון_חישוב_חודשים',
      extendedWindowMonths: 'חלון_חישוב_מורחב_חודשים',
      minAnswersForScore: 'מינימום_תשובות_להצגת_ציון',
      fairnessRatePerWeek: 'שיעור_בונוס_הוגנות_לשבוע',
      fairnessWeeksCap: 'תקרת_שבועות_הוגנות',
      unansweredStreak: 'לא_ענתה_ל_N',
      reliabilityEnabled: 'מרכיב_אמינות_פעיל',
    })
  })

  it('כל שם ב-SEED_PARAMS מוכר לפענוח, ואף ערך אינו יוצא null', () => {
    const parsed = parseSmartMatchParams(SEED_PARAMS)
    for (const [key, value] of Object.entries(parsed)) {
      expect(value, `הפרמטר ${key} לא נקרא`).not.toBeNull()
    }
  })

  it('הדגל הבוליאני נקרא כטקסט "false" ואינו הופך ל-true רק כי המחרוזת אינה ריקה', () => {
    // 🚨 `Boolean('false') === true` — המלכודת הקלאסית של פרמטר-טקסט.
    expect(parseSmartMatchParams(SEED_PARAMS).reliabilityEnabled).toBe(false)
    expect(
      parseSmartMatchParams({ ...SEED_PARAMS, מרכיב_אמינות_פעיל: 'true' }).reliabilityEnabled,
    ).toBe(true)
  })
})

// ── חור §3.5(א): הפיצול מחושב בזמן ריצה, לעולם לא מקודד ────────────────────
describe('activeWeights — נרמול מחדש, ולא פיצול קשיח', () => {
  it('מרכיב-האמינות כבוי ⇒ שני הנותרים מתחלקים ב-0.65 ומסכמים ל-1.0', () => {
    const w = activeWeights(parseSmartMatchParams(SEED_PARAMS))
    // 🔴 זו הבדיקה שהעוגן המחושב-ביד **אינו** תופס: מימוש שמקודד `0.62/0.38` מחזיר
    // בדיוק את אותן שלוש תוצאות במקרה של האפיון, ונכשל כאן על הספרה השלישית.
    expect(w.responsiveness).toBeCloseTo(0.4 / 0.65, 10)
    expect(w.proximity).toBeCloseTo(0.25 / 0.65, 10)
    expect(w.reliability).toBe(0)
    expect(w.responsiveness + w.proximity).toBeCloseTo(1, 10)
    // ‏0.62 הוא המחשה ב-§11.4, לא קבוע. ההפרש מהערך האמיתי הוא בספרה השלישית.
    expect(w.responsiveness).not.toBeCloseTo(0.62, 3)
  })

  it('מרכיב-האמינות דלוק ⇒ שלושת המשקלים כלשונם, בלי נרמול', () => {
    const w = activeWeights(parseSmartMatchParams({ ...SEED_PARAMS, מרכיב_אמינות_פעיל: 'true' }))
    expect(w.responsiveness).toBeCloseTo(0.4, 10)
    expect(w.reliability).toBeCloseTo(0.35, 10)
    expect(w.proximity).toBeCloseTo(0.25, 10)
  })
})

// ── שכבה 3 · המרכיבים ───────────────────────────────────────────────────────
describe('companyResponsivenessAverage — C של החברה, לא של המאגר', () => {
  const pool = [
    { answered: 7, confirmed: 6 },
    { answered: 12, confirmed: 6 },
    { answered: 1, confirmed: 1 },
    { answered: 5, confirmed: 2 },
    { answered: 5, confirmed: 3 },
  ]

  it('‏18 ÷ 30 = 0.60 — הסכומים, לא ממוצע-של-ממוצעים', () => {
    expect(companyResponsivenessAverage(pool)).toBeCloseTo(0.6, 10)
  })

  it('🔴 מחושב על כל הדיילות — כולל אלה שהשער פסל', () => {
    // ‏§11.3: `C` הוא תכונה של החברה בחלון-זמן, לא של האירוע. חישוב על המאגר-שעבר-שער
    // היה נותן לאותה דיילת ציון אחר בשני אירועים בלי ששום דבר בה השתנה.
    const gatedOnly = pool.slice(0, 3) // בלי יעל ושירה
    expect(companyResponsivenessAverage(gatedOnly)).not.toBeCloseTo(0.6, 3)
  })

  it('מאגר ריק או בלי מענים ⇒ null, לא 0', () => {
    expect(companyResponsivenessAverage([])).toBeNull()
    expect(companyResponsivenessAverage([{ answered: 0, confirmed: 0 }])).toBeNull()
  })
})

describe('responsivenessScore — ריסון בייסיאני לכיוון C', () => {
  it('‏(6 + 3×0.60) ÷ (7 + 3) = 0.78', () => {
    expect(responsivenessScore({ answered: 7, confirmed: 6 }, 0.6, 3)).toBeCloseTo(0.78, 10)
  })

  it('§11.10 #1 — "1 מתוך 1" מדורגת מתחת ל"9 מתוך 10"', () => {
    const perfectNewcomer = responsivenessScore({ answered: 1, confirmed: 1 }, 0.6, 3)
    const provenVeteran = responsivenessScore({ answered: 10, confirmed: 9 }, 0.6, 3)
    expect(perfectNewcomer).toBeLessThan(provenVeteran)
    // ו-100% גולמי הופך ל-0.70 בלבד — הריסון עשה בדיוק את עבודתו.
    expect(perfectNewcomer).toBeCloseTo(0.7, 10)
  })

  it('בלי שום מענה — הציון הוא בדיוק C, לא 0 ולא 1', () => {
    expect(responsivenessScore({ answered: 0, confirmed: 0 }, 0.6, 3)).toBeCloseTo(0.6, 10)
  })
})

describe('responsivenessCounts — §11.10 #4, ספירה על השורה הקובעת בלבד', () => {
  it('סירוב שהמנהלת עקפה נספר פעם אחת, כאישור', () => {
    // 🔑 מימוש עם COUNT(*) נאיבי עובר את העוגן המחושב-ביד (שם הקלט הוא כבר ספירות),
    // ונכשל כאן — וזה בדיוק החור ש-`spec.md §3.5` מסמן כ"ניתן להוסיף בזול, וכדאי".
    const rows = [
      { project_id: 7, hostess_id: 1, assignment_number: 1, assignment_status: 'declined' },
      { project_id: 7, hostess_id: 1, assignment_number: 2, assignment_status: 'finally_approved' },
    ]
    expect(responsivenessCounts(rows)).toEqual({ answered: 1, confirmed: 1 })
  })

  it('"ממתינה למענה" מחוץ למכנה — שתיקה אינה סירוב', () => {
    const rows = [
      { project_id: 7, hostess_id: 1, assignment_number: 1, assignment_status: 'pending' },
    ]
    expect(responsivenessCounts(rows)).toEqual({ answered: 0, confirmed: 0 })
  })

  it('"שוחררה" לא נספרת בשום צד — זו פעולת-מערכת, לא התנהגות של הדיילת', () => {
    const rows = [
      { project_id: 7, hostess_id: 1, assignment_number: 1, assignment_status: 'released' },
    ]
    expect(responsivenessCounts(rows)).toEqual({ answered: 0, confirmed: 0 })
  })

  it('סירוב נספר במכנה ולא במונה · אישור-זמינות בשניהם', () => {
    const rows = [
      { project_id: 1, hostess_id: 1, assignment_number: 1, assignment_status: 'declined' },
      {
        project_id: 2,
        hostess_id: 1,
        assignment_number: 1,
        assignment_status: 'confirmed_available',
      },
    ]
    expect(responsivenessCounts(rows)).toEqual({ answered: 2, confirmed: 1 })
  })

  it('🔴 "ביטלה אחרי אישור" מוחרגת מההיענות לגמרי — היא נספרת באמינות', () => {
    // ‏§11.3(1) מונה שלושה סטטוסים במכנה, ו-`approval_withdrawn` אינו אחד מהם;
    // ‏§11.3(2) אומר במפורש "נספר **כאן**, במרכיב-האמינות (לא בהיענות — היא כן אמרה
    // כן במקור)". ⇒ לא במונה, לא במכנה.
    const rows = [
      { project_id: 1, hostess_id: 1, assignment_number: 1, assignment_status: 'declined' },
      {
        project_id: 2,
        hostess_id: 1,
        assignment_number: 1,
        assignment_status: 'confirmed_available',
      },
      {
        project_id: 3,
        hostess_id: 1,
        assignment_number: 1,
        assignment_status: 'approval_withdrawn',
      },
    ]
    expect(responsivenessCounts(rows)).toEqual({ answered: 2, confirmed: 1 })
  })
})

describe('proximityScore — גולפוסט קבוע (§11.10 #3)', () => {
  it('‏30 ק"מ מתוך גולפוסט 40 ⇒ 0.25', () => {
    expect(proximityScore(30, 40)).toBeCloseTo(0.25, 10)
  })

  it('מעל הגולפוסט ⇒ 0, ולא שלילי', () => {
    expect(proximityScore(200, 40)).toBe(0)
  })

  it('§11.10 #3 — הוספת דיילת ב-200 ק"מ אינה מזיזה אף ציון-קרבה אחר', () => {
    // ⚠️ הניסוח מדויק בכוונה: הבדיקה על **מרכיב-הקרבה**, לא על הציון הכולל.
    // ‏`spec.md:342` מודה במפורש שכש-C חברתי, הוספת דיילת **כן** מזיזה את כולן דרך C.
    // ‏#3 מדבר על הגולפוסט בלבד, והריסון אינו חסין-מדגם ואינו מתיימר להיות.
    const before = proximityScore(30, 40)
    proximityScore(200, 40)
    expect(proximityScore(30, 40)).toBe(before)
  })

  it('🔴 בלי קואורדינטות — ציון ניטרלי 0.5, לעולם לא 0', () => {
    // אפס היה מעניש דיילת על נתון חסר שהוא **תקלה של המערכת**, לא שלה (§11.4).
    expect(proximityScore(null, 40)).toBe(NEUTRAL_PROXIMITY_SCORE)
    expect(NEUTRAL_PROXIMITY_SCORE).toBe(0.5)
  })

  it('🚫 והניטרלי אינו ממוצע-המאגר — זו בדיוק התלות-במדגם ש-§11.3 אוסר', () => {
    const far = [{ distanceKm: 200 }, { distanceKm: 190 }]
    const near = [{ distanceKm: 2 }, { distanceKm: 3 }]
    expect(proximityScore(null, 40, far)).toBe(proximityScore(null, 40, near))
  })
})

// ── מרכיב-האמינות: כבוי היום, אבל חייב להתקיים כדי שהנרמול יהיה אמיתי ───────
describe('reliabilityScore — §11.10 #2 ו-#5', () => {
  const base = { projectCancelled: false, eventPassed: true }

  it('§11.10 #2 — "חולה" מוחרגת מהבסיס לגמרי ואינה משנה את הציון', () => {
    const without = [
      { ...base, outcome: ATTENDANCE_OUTCOMES.ARRIVED },
      { ...base, outcome: ATTENDANCE_OUTCOMES.ARRIVED },
    ]
    const withSick = [...without, { ...base, outcome: ATTENDANCE_OUTCOMES.SICK }]
    expect(reliabilityScore(withSick, 0.6, 3)).toBe(reliabilityScore(without, 0.6, 3))
  })

  it('§11.10 #5 — פרויקט שהלקוח ביטל אינו נספר בשום צד', () => {
    const without = [{ ...base, outcome: ATTENDANCE_OUTCOMES.ARRIVED }]
    const withCancelled = [
      ...without,
      { ...base, projectCancelled: true, outcome: ATTENDANCE_OUTCOMES.NO_SHOW },
    ]
    expect(reliabilityScore(withCancelled, 0.6, 3)).toBe(reliabilityScore(without, 0.6, 3))
  })

  it('אירוע שטרם התקיים אינו נספר — אי-אפשר לא-להגיע לאירוע שלא קרה', () => {
    const only = [{ ...base, eventPassed: false, outcome: ATTENDANCE_OUTCOMES.NO_SHOW }]
    expect(reliabilityScore(only, 0.6, 3)).toBeCloseTo(0.6, 10)
  })

  it('סולם-הערכים של §11.3(2)', () => {
    const one = (outcome) => reliabilityScore([{ ...base, outcome }], 0.6, 3)
    // ריסון עם m=3 ו-C=0.6 על תצפית אחת: (v + 1.8) / 4
    expect(one(ATTENDANCE_OUTCOMES.ARRIVED)).toBeCloseTo((1 + 1.8) / 4, 10)
    expect(one(ATTENDANCE_OUTCOMES.SLIGHTLY_LATE)).toBeCloseTo((1 + 1.8) / 4, 10)
    expect(one(ATTENDANCE_OUTCOMES.MODERATELY_LATE)).toBeCloseTo((0.75 + 1.8) / 4, 10)
    expect(one(ATTENDANCE_OUTCOMES.VERY_LATE)).toBeCloseTo((0.5 + 1.8) / 4, 10)
    expect(one(ATTENDANCE_OUTCOMES.WITHDREW)).toBeCloseTo((0.5 + 1.8) / 4, 10)
    expect(one(ATTENDANCE_OUTCOMES.NO_SHOW)).toBeCloseTo((0 + 1.8) / 4, 10)
  })
})

// ── שכבה 4 · מנוף-ההוגנות ───────────────────────────────────────────────────
describe('fairnessLeverage — חור §3.5(ב)', () => {
  it('‏8 שבועות בשיעור 0.02 ⇒ ×1.16', () => {
    expect(fairnessLeverage(8, 0.02, 8)).toBeCloseTo(1.16, 10)
  })

  it('התקרה חוסמת — 20 שבועות שקולים ל-8', () => {
    expect(fairnessLeverage(20, 0.02, 8)).toBeCloseTo(fairnessLeverage(8, 0.02, 8), 10)
  })

  it('🔴 מי שמעולם לא עבדה מקבלת 0 שבועות — לא את התקרה', () => {
    // ‏`spec.md §3.5(ב)`: מימוש שנותן לה את התקרה **עובר את העוגן**, כי שתי הדיילות
    // חסרות-ההיסטוריה שם נפסלות בשער ממילא. לחדשה יש כבר מנגנון — הריסון.
    expect(fairnessLeverage(null, 0.02, 8)).toBe(1)
    expect(fairnessLeverage(undefined, 0.02, 8)).toBe(1)
    expect(fairnessLeverage(null, 0.02, 8)).not.toBeCloseTo(1.16, 5)
  })

  it('אפס שבועות ⇒ בלי בונוס', () => {
    expect(fairnessLeverage(0, 0.02, 8)).toBe(1)
  })
})

describe('tieBreakKey — אקראי-אך-קבוע, לעולם לא סדר-קליטה', () => {
  it('אותו צמד מחזיר תמיד את אותו מפתח', () => {
    expect(tieBreakKey(8, 42)).toBe(tieBreakKey(8, 42))
  })

  it('אותה דיילת מקבלת מפתח אחר באירוע אחר — אין יתרון-קבע לאף אחת', () => {
    expect(tieBreakKey(8, 42)).not.toBe(tieBreakKey(9, 42))
  })

  it('🔴 הסדר אינו סדר-המזהים — ותיקה אינה מנצחת חדשה בשוויון', () => {
    // הבדיקה סורקת מספיק צמדים כדי שהטענה לא תהיה מקרית: אילו המפתח היה מונוטוני
    // ב-hostess_id, לא היה נמצא ולו זוג אחד שסדרו הפוך.
    const keys = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, key: tieBreakKey(8, i + 1) }))
    const inverted = keys.some((a, i) => keys.slice(i + 1).some((b) => a.key > b.key))
    expect(inverted).toBe(true)
  })
})

describe('haversineKm', () => {
  it('תל אביב ⇄ חיפה ≈ 85 ק"מ', () => {
    const km = haversineKm({ lat: 32.0853, lng: 34.7818 }, { lat: 32.794, lng: 34.9896 })
    expect(km).toBeGreaterThan(78)
    expect(km).toBeLessThan(92)
  })

  it('אותה נקודה ⇒ 0', () => {
    expect(haversineKm({ lat: 32, lng: 34 }, { lat: 32, lng: 34 })).toBeCloseTo(0, 6)
  })

  it('קואורדינטה חסרה ⇒ null, לעולם לא 0 — "0 ק"מ" הוא הציון המושלם', () => {
    expect(haversineKm({ lat: null, lng: 34 }, { lat: 32, lng: 34 })).toBeNull()
    expect(haversineKm({ lat: 32, lng: 34 }, null)).toBeNull()
  })
})

// 🔴 המלכודת שישי זיהה במוצר לפני שהיא נכתבה בקוד (09/08/2026):
// *"אם אירוע הוא תל אביב והדיילת ירקון 5 תל אביב — מרחק אווירי 0?"*
//
// היא אמיתית ומגיעה מהמסלול החוקי: כשכתובת-אירוע נופלת לרמת-עיר (`מרכז הכנסים, ירושלים`
// ⇐ מרכז ירושלים — קרה בפועל על אירוע 3), ולדיילת יש רק `city` בלי `address`, **שני
// הצדדים נופלים על אותו אובייקט OSM בדיוק** ⇒ מרחק `0.000` ⇒ ציון-קרבה **1.0, מושלם**.
// 🚨 כלומר **ככל שיש לנו פחות מידע עליה, כך היא מדורגת גבוה יותר** — אותה משפחה
// בדיוק של `Number(null)===0`, רק שהפעם היא מגיעה דרך חשבון תקין לחלוטין.
//
// 🔑 והכלל שמכריע: **שתי כתובות שונות שגואקדו בנפרד לעולם לא נוחתות על נקודה זהה-בדיוק.**
// ‏⇒ שוויון מדויק אינו "קרוב", הוא **עדות ששני הצדדים קרסו לאותה נפילה-לאחור**, והמרחק
// אינו ידוע. בלי סף שרירותי ובלי אפסילון — שוויון מדויק, ותו לא.
describe('candidateDistanceKm — השומר מפני "0 ק"מ" מזויף', () => {
  const jerusalem = { lat: 31.7788472, lng: 35.2257856 } // הערך האמיתי של אירוע 3

  it('🔴 שני צדדים שקרסו לאותה נקודה ⇒ null, ולא 0', () => {
    expect(candidateDistanceKm(jerusalem, jerusalem)).toBeNull()
  })

  it('🔴 ולכן הציון יוצא ניטרלי ולא מושלם — זה כל העניין', () => {
    expect(proximityScore(candidateDistanceKm(jerusalem, jerusalem), 40)).toBe(0.5)
    // מה שהיה קורה בלי השומר: `haversineKm` מחזיר 0 והציון הוא 1.0 — הגבוה ביותר.
    expect(proximityScore(haversineKm(jerusalem, jerusalem), 40)).toBe(1)
  })

  it('מרחק אמיתי ממשיך לעבוד — ירקון 5 ת"א ⇄ אקספו ת"א הוא כמה ק"מ, לא 0', () => {
    const yarkon = { lat: 32.0892, lng: 34.7751 }
    const expo = { lat: 32.1062629, lng: 34.8101508 }
    const km = candidateDistanceKm(yarkon, expo)
    expect(km).toBeGreaterThan(1)
    expect(km).toBeLessThan(6)
  })

  it('צד חסר-קואורדינטות ⇒ null, כמו קודם', () => {
    expect(candidateDistanceKm(null, jerusalem)).toBeNull()
    expect(candidateDistanceKm({ lat: 32, lng: null }, jerusalem)).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 העוגן המחושב-ביד — `spec.md §3.1-§3.2`
// המספרים הועתקו ספרה-בספרה מהאפיון ולא חושבו כאן מחדש. אילו חושבו כאן, הבדיקה
// הייתה משווה את הקוד לעצמו — "שומר שאינו שומר".
// ═══════════════════════════════════════════════════════════════════════════
describe('🎯 rankCandidates — העוגן של כנס לקוחות שנתי, 22/08/2026', () => {
  const EVENT_DATE = '2026-08-22'

  const POOL = [
    {
      hostess_id: 1,
      full_name: 'נועה',
      status: 'active',
      has_car: true,
      answered: 7,
      confirmed: 6,
      distanceKm: 30,
      weeksSinceWorked: 8,
    },
    {
      hostess_id: 2,
      full_name: 'דנה',
      status: 'active',
      has_car: true,
      answered: 12,
      confirmed: 6,
      distanceKm: 8,
      weeksSinceWorked: 1,
    },
    {
      hostess_id: 3,
      full_name: 'מיכל',
      status: 'active',
      has_car: true,
      answered: 1,
      confirmed: 1,
      distanceKm: 20,
      weeksSinceWorked: 3,
    },
    {
      hostess_id: 4,
      full_name: 'יעל',
      status: 'active',
      has_car: false,
      answered: 5,
      confirmed: 2,
      distanceKm: 55,
      weeksSinceWorked: null,
    },
    {
      hostess_id: 5,
      full_name: 'שירה',
      status: 'active',
      has_car: true,
      answered: 5,
      confirmed: 3,
      distanceKm: 18,
      weeksSinceWorked: null,
      unavailability: [{ start_date: '2026-08-20', end_date: '2026-08-25' }],
    },
  ]

  const context = {
    eventDate: EVENT_DATE,
    projectId: 8,
    params: parseSmartMatchParams(SEED_PARAMS),
  }

  it('ממוצע-החברה יוצא 0.60 — על כל החמש, כולל שתי הנפסלות', () => {
    expect(companyResponsivenessAverage(POOL)).toBeCloseTo(0.6, 10)
  })

  it('🎯 שלושת הציונים: נועה 0.67 · מיכל 0.66 · דנה 0.64', () => {
    const ranked = rankCandidates(POOL, context)
    expect(ranked.map((r) => [r.full_name, r.score])).toEqual([
      ['נועה', 0.67],
      ['מיכל', 0.66],
      ['דנה', 0.64],
    ])
  })

  it('🎯 סדר-התצוגה: נועה ← מיכל ← דנה', () => {
    expect(rankCandidates(POOL, context).map((r) => r.full_name)).toEqual(['נועה', 'מיכל', 'דנה'])
  })

  it('🎯 שתי מועמדות אינן ברשימה כלל — ומשני טעמי-שער שונים', () => {
    const names = rankCandidates(POOL, context).map((r) => r.full_name)
    expect(names).toHaveLength(3)
    expect(names).not.toContain('יעל') // מעל הגולפוסט בלי רכב
    expect(names).not.toContain('שירה') // אי-זמינות מוצהרת שמכסה את 22/08
  })

  it('הפסילות אינן מקריות — הסרת הסיבה מחזירה כל אחת לרשימה', () => {
    // 🛡️ "שומר שלא נצפה נכשל אינו שומר": הבדיקה שלמעלה עוברת גם על שער שפוסל את כולן.
    const yaelWithCar = POOL.map((h) => (h.hostess_id === 4 ? { ...h, has_car: true } : h))
    expect(rankCandidates(yaelWithCar, context).map((r) => r.full_name)).toContain('יעל')

    const shiraFree = POOL.map((h) => (h.hostess_id === 5 ? { ...h, unavailability: [] } : h))
    expect(rankCandidates(shiraFree, context).map((r) => r.full_name)).toContain('שירה')
  })

  it('מרכיבי-הביניים תואמים את הטבלה של §3.2', () => {
    const byName = Object.fromEntries(rankCandidates(POOL, context).map((r) => [r.full_name, r]))
    expect(byName['נועה'].components.responsiveness).toBeCloseTo(0.78, 10)
    expect(byName['דנה'].components.responsiveness).toBeCloseTo(0.52, 10)
    expect(byName['מיכל'].components.responsiveness).toBeCloseTo(0.7, 10)
    expect(byName['נועה'].components.proximity).toBeCloseTo(0.25, 10)
    expect(byName['דנה'].components.proximity).toBeCloseTo(0.8, 10)
    expect(byName['מיכל'].components.proximity).toBeCloseTo(0.5, 10)
  })

  it('🔴 חור §3.5(ג) — עיגול אחד בסוף: הציון הגולמי מדויק לעשר ספרות', () => {
    // זו הבדיקה שתופסת מימוש שמעגל באמצע. העוגן עצמו **אינו** תופס אותו, כי כל
    // תת-הציונים במקרה הזה יוצאים עגולים — ולכן נבדק כאן הערך הלא-מעוגל.
    const byName = Object.fromEntries(rankCandidates(POOL, context).map((r) => [r.full_name, r]))
    expect(byName['נועה'].rawScore).toBeCloseTo((0.3745 / 0.65) * 1.16, 10)
    expect(byName['דנה'].rawScore).toBeCloseTo((0.408 / 0.65) * 1.02, 10)
    expect(byName['מיכל'].rawScore).toBeCloseTo((0.405 / 0.65) * 1.06, 10)
  })

  it('🔴 חור §3.5(ג), המקרה שבאמת תופס — תת-ציונים שאינם עגולים', () => {
    // ⚠️ **נמדד 09/08/2026:** הבדיקה שמעל, על נתוני-העוגן, **אינה תופסת** מימוש שמעגל
    // באמצע — כי כל תת-הציונים שם יוצאים עגולים ממילא (0.78 · 0.25 · 0.52 · 0.80 …),
    // והעיגול הוא no-op. זה בדיוק מה ש-`spec.md §3.5(ג)` מזהיר ממנו, ווידאתי זאת
    // בהרצה: שברתי את הקוד בכוונה והבדיקה נשארה ירוקה.
    // ⇒ המקרה כאן בנוי כך ש**שני** תת-הציונים אינם עגולים:
    //   היענות = (1 + 3×0.6) ÷ 6 = 0.4666…  ·  קרבה = 1 − 17/40 = 0.575
    // עיגול-ביניים היה מזיז אותם ל-0.47 ול-0.58, והציון הגולמי סוטה בספרה השלישית.
    const pool = [
      {
        hostess_id: 1,
        full_name: 'א',
        status: 'active',
        has_car: true,
        answered: 3,
        confirmed: 1,
        distanceKm: 17,
        weeksSinceWorked: 0,
      },
      {
        hostess_id: 2,
        full_name: 'ב',
        status: 'active',
        has_car: true,
        answered: 7,
        confirmed: 5,
        distanceKm: 10,
        weeksSinceWorked: 0,
      },
    ]
    // ‏C = (1+5) ÷ (3+7) = 0.60 — נבחר עגול כדי שהציפייה תהיה קריאה.
    const expected = ((1 + 3 * 0.6) / 6) * (0.4 / 0.65) + (1 - 17 / 40) * (0.25 / 0.65)
    const row = rankCandidates(pool, context).find((r) => r.full_name === 'א')
    expect(row.rawScore).toBeCloseTo(expected, 10)
  })

  it('המנוף הוא שהופך את הסדר הגולמי — דנה מנצחת לפניו', () => {
    // ‏§3.3①/③: בלי המנוף דנה ראשונה (0.6277 מול 0.5762). זה מוכיח שהמנוף הופעל,
    // ובשלב הנכון — על הגולמי ולא על המעוגל.
    const byName = Object.fromEntries(rankCandidates(POOL, context).map((r) => [r.full_name, r]))
    expect(byName['דנה'].baseScore).toBeGreaterThan(byName['נועה'].baseScore)
    expect(byName['נועה'].rawScore).toBeGreaterThan(byName['דנה'].rawScore)
  })

  it('מיכל מסומנת "טרם נצבר מידע" — ובכל זאת מדורגת', () => {
    const michal = rankCandidates(POOL, context).find((r) => r.full_name === 'מיכל')
    expect(michal.flags.notEnoughAnswers).toBe(true)
    expect(michal.score).toBe(0.66)
  })

  it('הציון קיים באובייקט אך אינו מה שמוצג — הצ׳יפים הם המוצגים', () => {
    const noa = rankCandidates(POOL, context).find((r) => r.full_name === 'נועה')
    expect(noa.components).toBeDefined()
    expect(noa.flags.noCoordinates).toBe(false)
  })
})

describe('rankCandidates — שכבה 1, חמשת תנאי-השער', () => {
  const context = {
    eventDate: '2026-08-22',
    projectId: 8,
    params: parseSmartMatchParams(SEED_PARAMS),
  }
  const base = {
    hostess_id: 1,
    full_name: 'א',
    status: 'active',
    has_car: true,
    answered: 4,
    confirmed: 3,
    distanceKm: 10,
    weeksSinceWorked: 2,
  }
  const filler = {
    hostess_id: 99,
    full_name: 'ב',
    status: 'active',
    has_car: true,
    answered: 10,
    confirmed: 6,
    distanceKm: 10,
    weeksSinceWorked: 2,
  }
  const names = (pool) => rankCandidates(pool, context).map((r) => r.full_name)

  it('מושבתת נפסלת', () => {
    expect(names([{ ...base, status: 'inactive' }, filler])).not.toContain('א')
  })

  it('שיבוץ סופי באותו תאריך פוסל', () => {
    expect(names([{ ...base, hasSameDayFinalAssignment: true }, filler])).not.toContain('א')
  })

  it('סימון "לא_לשלוח" אצל לקוח האירוע הזה פוסל', () => {
    expect(names([{ ...base, preference: 'לא_לשלוח' }, filler])).not.toContain('א')
  })

  it('"מצוינת" ו"בסדר" אינם פוסלים', () => {
    expect(names([{ ...base, preference: 'מצוינת' }, filler])).toContain('א')
    expect(names([{ ...base, preference: 'בסדר' }, filler])).toContain('א')
  })

  it('מעל שער-המרחק (80) פוסל — גם עם רכב', () => {
    expect(names([{ ...base, distanceKm: 81, has_car: true }, filler])).not.toContain('א')
    expect(names([{ ...base, distanceKm: 79, has_car: true }, filler])).toContain('א')
  })

  it('בין הגולפוסט לשער — עם רכב עוברת, בלי רכב נפסלת', () => {
    expect(names([{ ...base, distanceKm: 55, has_car: true }, filler])).toContain('א')
    expect(names([{ ...base, distanceKm: 55, has_car: false }, filler])).not.toContain('א')
  })

  it('🔴 בלי קואורדינטות השער אינו פוסל — היא נכנסת ומסומנת', () => {
    // הנתון החסר הוא תקלה של המערכת. פסילה כאן הייתה מעלימה דיילת מהמסך בשקט.
    const ranked = rankCandidates([{ ...base, distanceKm: null }, filler], context)
    const row = ranked.find((r) => r.full_name === 'א')
    expect(row).toBeDefined()
    expect(row.flags.noCoordinates).toBe(true)
  })

  it('שכבה 2 — "מצוינת אצל הלקוח הזה" צפה לראש בלי קשר לציון', () => {
    // הנעיצה נגזרת מהעדפת-הלקוח ואינה שדה שהקורא מזין — אחרת שני מקורות-אמת.
    const weakPinned = { ...base, answered: 20, confirmed: 1, distanceKm: 39, preference: 'מצוינת' }
    const ranked = rankCandidates([filler, weakPinned], context)
    expect(ranked[0].full_name).toBe('א')
    expect(ranked[0].pinned).toBe(true)
  })
})

describe('rankCandidates — עמידות בפני קלט חסר', () => {
  const context = {
    eventDate: '2026-08-22',
    projectId: 8,
    params: parseSmartMatchParams(SEED_PARAMS),
  }

  it('מאגר ריק ⇒ רשימה ריקה, לא קריסה', () => {
    expect(rankCandidates([], context)).toEqual([])
    expect(rankCandidates(null, context)).toEqual([])
  })

  it('פרמטר חסר ⇒ נזרקת שגיאה ולא מחושב ציון לפי מספר מומצא', () => {
    // 🚨 ברירת-מחדל שקטה כאן הייתה מייצרת דירוג שנראה תקין לחלוטין ומבוסס על משקולת
    // שאיש לא הכריע. מוטב מסך שאומר "לא הצלחנו לטעון" מאשר סדר שגוי שנראה אמין.
    const broken = parseSmartMatchParams({ ...SEED_PARAMS, משקולת_קרבה: '' })
    expect(() =>
      rankCandidates([{ hostess_id: 1, status: 'active', answered: 1, confirmed: 1 }], {
        ...context,
        params: broken,
      }),
    ).toThrow()
  })
})
