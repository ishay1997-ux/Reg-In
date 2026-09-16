import { describe, it, expect, vi } from 'vitest'
import { responsivenessScore } from './smartMatch'
import {
  giniPopulation,
  lorenzPoints,
  concentrationShares,
  reliabilityThresholds,
  reliabilityBand,
  reliabilityParamOrderNote,
  hostessReliabilityScore,
  medianOf,
  rateByRatingBands,
} from './reportsHostesses'

// 🔴 **המימוש האמיתי עוטף במרגל, ולא מוחלף במימוש מזויף** (הכרעה 38 · כלל-ברזל 14):
// כל בדיקות-המספרים בקובץ ממשיכות לרוץ מול הנוסחה האמיתית של Smart Match, ובנוסף
// אפשר לשאול **האם היא זו שנקראה**. בלי זה, מוטנט שמוחק את ה-`import` ומשכפל את
// `(total + m*C)/(count + m)` לתוך `reportsHostesses.js` עובר את כל הבדיקות — כלומר
// הסוויטה בדקה את המספר ולא את הדבר היחיד שכותרתה מבטיחה.
vi.mock('./smartMatch', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, responsivenessScore: vi.fn(actual.responsivenessScore) }
})

// 🔴 **הבדיקות בקובץ הזה נכתבו לפני המימוש, והמספרים בהן לא חושבו כאן.**
// מקורם: `docs/specs/module_11_reports/spec.md §🔢 3.3` (המקרה המחושב-ביד של ג'יני)
// ו-`stage2-review/signoff-baseline-2026-09-10.md` (המדידה העצמאית). בדיקה שכתב מי
// שכתב את הנוסחה מקודדת את אותה שגיאה ועוברת בירוק — ולכן הציפייה קודמת לקוד.
//
// 🔑 **והקובץ הזה הוא גם האורקל של ה-SQL:** ‏`report_m14_hostess_overview` ·
// `report_m15_reliability` · `report_m16_quality_cost` · `report_m17_fairness`
// (‏`supabase/migrations/20260916*_module11_f_rpcs_hostesses.sql`) מחשבים את אותם
// מדדים בדיוק ב-SQL. **כשהשניים נחלקים — ה-SQL הוא החשוד**, כי הצד הזה נבדק מול
// מספר שחושב ביד לפני שהיה קוד.

// 🔑 **האוכלוסייה האמיתית, לא דוגמה מומצאת.** ‏106 ספירות-המשמרות של
// `assignment_status='finally_approved'` בחלון `(10/09/2025, 10/09/2026]` — **נשלפו
// מהמסד פעם אחת ב-16/09/2026** והודבקו כאן כפיקסצ'ר קפוא:
//   `select count(*) from assignments where assignment_status='finally_approved'
//    and event_date > '2025-09-10' and event_date <= '2026-09-10' group by hostess_id`
// ⇒ `n=106` · `סה"כ 1,862`. זה החלון שבו נמדדו כל עוגני `signoff-baseline-2026-09-10.md`,
// ולכן **הפיקסצ'ר הזה הוא האורקל** של ג'יני (0.4559), הריכוזיות (55.3/16.2/26.0),
// החציון (13.5) והקודקוד הראשון של לורנץ — הערך ש-`cards-hostesses.md §ד` סימן כחסר.
// ⚠️ **אינו נמדד מחדש**: החלון נגרר עם השעון, והפיקסצ'ר נועד דווקא לא לזוז איתו.
const SHIFT_COUNTS_2026_09_10 = [
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 7,
  7, 7, 7, 8, 8, 9, 9, 9, 10, 10, 10, 11, 12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 14, 15,
  15, 15, 15, 15, 17, 18, 18, 20, 21, 23, 24, 24, 25, 26, 26, 27, 28, 28, 30, 30, 31, 31, 32, 32,
  32, 32, 32, 33, 35, 35, 35, 36, 36, 37, 37, 39, 39, 41, 42, 44, 44, 44, 45, 46, 46, 46, 48,
]

describe("ג'יני — גרסת-אוכלוסייה, וזו ההכרעה (spec.md §🔢 3.3)", () => {
  // חמש דיילות, ספירות 1·2·3·4·10 · n=5 · סכום 20 · ממוצע 4.
  // סכום ההפרשים המוחלטים המסודרים = 80 ⇒ 80 ÷ (2·25·4) = 0.40.
  // ‏🚫 גרסת-המדגם מחזירה 0.50 על אותו קלט — הפרש של 25%.
  const HAND_CASE = [1, 2, 3, 4, 10]

  it('‏1·2·3·4·10 ⇒ 0.40 בדיוק', () => {
    expect(giniPopulation(HAND_CASE)).toBeCloseTo(0.4, 10)
  })

  it('‏0.50 היה אומר שנבחרה גרסת-המדגם — ולכן נבדק במפורש שזה לא קורה', () => {
    expect(giniPopulation(HAND_CASE)).not.toBeCloseTo(0.5, 3)
  })

  it('הנוסחה השנייה (סדרה ממוינת) מחזירה את אותו מספר — 1.6 − 1.2', () => {
    const sorted = [...HAND_CASE].sort((a, b) => a - b)
    const n = sorted.length
    const sum = sorted.reduce((acc, value) => acc + value, 0)
    const weighted = sorted.reduce((acc, value, index) => acc + (index + 1) * value, 0)
    expect(giniPopulation(HAND_CASE)).toBeCloseTo((2 * weighted) / (n * sum) - (n + 1) / n, 10)
  })

  it('סדר הקלט אינו משנה', () => {
    expect(giniPopulation([10, 3, 1, 4, 2])).toBeCloseTo(0.4, 10)
  })

  it('חלוקה שווה ⇒ 0', () => {
    expect(giniPopulation([5, 5, 5, 5])).toBeCloseTo(0, 10)
  })

  it('ריכוז מוחלט (אחת מקבלת הכול) ⇒ (n−1)/n, לא 1 — זו גרסת-האוכלוסייה', () => {
    expect(giniPopulation([0, 0, 0, 4])).toBeCloseTo(0.75, 10)
  })

  // ‏`cards-hostesses.md` ④ מ17: פחות משתי דיילות ⇒ המדד אינו מוגדר, מוצג "—" ולא 0.
  it('‏n<2 ⇒ null, לעולם לא 0', () => {
    expect(giniPopulation([7])).toBeNull()
    expect(giniPopulation([])).toBeNull()
    expect(giniPopulation(null)).toBeNull()
  })

  it('סכום אפס ⇒ null — אין ממוצע לחלק בו', () => {
    expect(giniPopulation([0, 0, 0])).toBeNull()
  })
})

describe('עקומת-לורנץ — אותו נתון בדיוק כמו ג׳יני, בצורת גרף', () => {
  it('‏1·2·3·4·10: שש נקודות, מ-(0,0) ל-(100,100)', () => {
    expect(lorenzPoints([1, 2, 3, 4, 10])).toEqual([
      { x: 0, y: 0 },
      { x: 20, y: 5 },
      { x: 40, y: 15 },
      { x: 60, y: 30 },
      { x: 80, y: 50 },
      { x: 100, y: 100 },
    ])
  })

  it('חלוקה שווה ⇒ העקומה היא קו-השוויון', () => {
    expect(lorenzPoints([2, 2, 2, 2])).toEqual([
      { x: 0, y: 0 },
      { x: 25, y: 25 },
      { x: 50, y: 50 },
      { x: 75, y: 75 },
      { x: 100, y: 100 },
    ])
  })

  it('אין נתון ⇒ מערך ריק, לא נקודה מומצאת', () => {
    expect(lorenzPoints([])).toEqual([])
    expect(lorenzPoints([0, 0])).toEqual([])
  })

  // ✒️ ‏`cards-hostesses.md §ד` סימן במפורש שהקודקוד הזה **חסר מטבלת-ה-`sr-only`** של
  // המוקאפ (הגרף נשא 13 קודקודים והטבלה 12 שורות). כאן הוא מקובע: הדיילת הפחות-עמוסה
  // היא ‏1/106 מהדיילות (0.9434%) ומחזיקה משמרת אחת מתוך 1,862 (0.0537%).
  it('הקודקוד הראשון על האוכלוסייה האמיתית ⇒ (0.9434, 0.0537)', () => {
    const points = lorenzPoints(SHIFT_COUNTS_2026_09_10)
    expect(points).toHaveLength(107)
    expect(points[0]).toEqual({ x: 0, y: 0 })
    expect(points[1].x).toBeCloseTo(0.9434, 4)
    expect(points[1].y).toBeCloseTo(0.0537, 4)
    expect(points[106]).toEqual({ x: 100, y: 100 })
  })

  it("ומאותה סדרה בדיוק יוצא ג'יני 0.4559 — העקומה והמדד לא יכולים לסתור", () => {
    expect(giniPopulation(SHIFT_COUNTS_2026_09_10)).toBeCloseTo(0.45587, 5)
  })
})

describe('נתחי-ריכוזיות — רבע עליון · מחצית תחתונה · עשירון עליון', () => {
  // ‏1·2·3·4·10 · n=5 · סכום 20.
  // רבע עליון = ceil(5/4) = 2 דיילות ⇒ 10+4 = 14 ⇒ 70.0%
  // מחצית תחתונה = floor(5/2) = 2 דיילות ⇒ 1+2 = 3 ⇒ 15.0%
  // עשירון עליון = ceil(5/10) = 1 דיילת ⇒ 10 ⇒ 50.0%
  it('המקרה המחושב-ביד', () => {
    expect(concentrationShares([1, 2, 3, 4, 10])).toEqual({
      topQuarterCount: 2,
      topQuarterShare: 70,
      bottomHalfCount: 2,
      bottomHalfShare: 15,
      topDecileCount: 1,
      topDecileShare: 50,
    })
  })

  it('חלוקה שווה: הרבע העליון מקבל בדיוק את חלקו', () => {
    const shares = concentrationShares([1, 1, 1, 1])
    expect(shares.topQuarterShare).toBeCloseTo(25, 10)
    expect(shares.bottomHalfShare).toBeCloseTo(50, 10)
  })

  it('אין נתון ⇒ null בכל השדות, לא אפסים', () => {
    expect(concentrationShares([])).toBeNull()
    expect(concentrationShares([0, 0])).toBeNull()
  })

  // 🔴 **`n=5` אינו מבחין בין `ceil(n/10)` ל-`round(n/10)` ל-`max(1, floor(n/10))`** —
  // שלושתם מחזירים דיילת אחת, והעשירון נשאר לא-מכוסה. על 106 הם נחלקים
  // (‏`ceil`=11 · `round`=11 · `floor`=10), ורק כאן `26.0%` נבדק בכלל.
  it('עשירון עליון על האוכלוסייה האמיתית ⇒ 11 דיילות ו-26.0% (עוגן signoff)', () => {
    const shares = concentrationShares(SHIFT_COUNTS_2026_09_10)
    expect(shares.topDecileCount).toBe(11)
    expect(shares.topDecileShare).toBeCloseTo(26.0473, 3)
    expect(Number(shares.topDecileShare.toFixed(1))).toBe(26.0)
  })

  it('ושני האחוזים האחרים באותה מדידה — 55.3% ו-16.2%', () => {
    const shares = concentrationShares(SHIFT_COUNTS_2026_09_10)
    expect(shares.topQuarterCount).toBe(27)
    expect(Number(shares.topQuarterShare.toFixed(1))).toBe(55.3)
    expect(shares.bottomHalfCount).toBe(53)
    expect(Number(shares.bottomHalfShare.toFixed(1))).toBe(16.2)
  })
})

describe('ספי-האמינות — נעים עם ממוצע-החברה, ונקראים מ-params (הכרעה 35)', () => {
  // ‏`cards-hostesses.md` ③ מ15: `C=0.958815` ⇒ אדום 0.8342 · ענבר 0.9109.
  const C = 0.958815

  it('‏0.87·C ו-0.95·C — המקדמים מ-params, לא קבועי-קוד', () => {
    const { red, amber } = reliabilityThresholds(C, 0.87, 0.95)
    expect(red).toBeCloseTo(0.8342, 4)
    expect(amber).toBeCloseTo(0.9109, 4)
  })

  it('‏C חסר ⇒ null בשני הספים — סף מומצא היה צובע דיילות בשקט', () => {
    expect(reliabilityThresholds(null, 0.87, 0.95)).toEqual({ red: null, amber: null })
  })

  it('מקדם חסר ⇒ null באותו סף בלבד', () => {
    expect(reliabilityThresholds(C, null, 0.95).red).toBeNull()
    expect(reliabilityThresholds(C, null, 0.95).amber).toBeCloseTo(0.9109, 4)
  })

  it('הסיווג: מתחת לאדום ⇒ אדום · בין הספים ⇒ ענבר · מעליהם ⇒ null', () => {
    expect(reliabilityBand(0.759, 0.8342, 0.9109)).toBe('red')
    expect(reliabilityBand(0.8342, 0.8342, 0.9109)).toBe('amber')
    expect(reliabilityBand(0.9, 0.8342, 0.9109)).toBe('amber')
    expect(reliabilityBand(0.914, 0.8342, 0.9109)).toBeNull()
  })

  it('סף חסר ⇒ null — לא "עברה", לא "נכשלה"', () => {
    expect(reliabilityBand(0.5, null, 0.9109)).toBeNull()
    expect(reliabilityBand(null, 0.8342, 0.9109)).toBeNull()
  })

  // 🔴 **גבול-הענבר, התאום של גבול-האדום שכבר מקובע כאן.** ‏`score === amber` חייב
  // לצאת **מחוץ** לרצועה: `<` ולא `<=`. מוטנט עם `score <= amber` עובר את כל שאר
  // הבדיקות ומסמן בשקט דיילת אחת נוספת **על הסף עצמו** — במסך שכל תכליתו את מי לא
  // לשלוח, וזו דיילת שמפסידה עבודה בגלל סימן-השוואה.
  it('ציון השווה בדיוק לסף-הענבר ⇒ null, לא "amber" (`<` ולא `<=`)', () => {
    expect(reliabilityBand(0.9109, 0.8342, 0.9109)).toBeNull()
    expect(reliabilityBand(0.91089, 0.8342, 0.9109)).toBe('amber')
  })
})

describe('שומר-סדר-המקדמים — אדום חייב להיות חמור מענבר', () => {
  it('הסדר התקין ⇒ אין הערה', () => {
    expect(reliabilityParamOrderNote(0.87, 0.95)).toBeNull()
  })

  it('אדום ≥ ענבר ⇒ משפט עברי שנוקב בשני הפרמטרים בשמם ובערכיהם', () => {
    const note = reliabilityParamOrderNote(0.95, 0.87)
    expect(note).toContain('מקדם_אמינות_אדום')
    expect(note).toContain('מקדם_אמינות_ענבר')
    expect(note).toContain('0.95')
    expect(note).toContain('0.87')
  })

  // 🔴 **`toContain` על ארבעת המחרוזות בנפרד אינו מבחין בין המשפט הנכון להיפוכו** —
  // מוטנט שמחליף `${red}` ב-`${amber}` בתבנית מייצר *"מקדם_אמינות_אדום (0.87) אינו
  // נמוך ממקדם_אמינות_ענבר (0.95)"*, שהוא **גם לא-נכון וגם לא-קוהרנטי** (0.87 כן נמוך
  // מ-0.95), ועובר. ⇒ כאן נבדק **הצימוד** — כל ערך צמוד לפרמטר שלו — **וגם הסדר**,
  // כי המשפט מסביר סיבה ותוצאה ומי-קודם-למי הוא חלק מההסבר.
  it('כל ערך צמוד לפרמטר שלו, והאדום נאמר ראשון', () => {
    const note = reliabilityParamOrderNote(0.95, 0.87)
    expect(note).toContain('מקדם_אמינות_אדום (0.95)')
    expect(note).toContain('מקדם_אמינות_ענבר (0.87)')
    expect(note.indexOf('מקדם_אמינות_אדום')).toBeLessThan(note.indexOf('מקדם_אמינות_ענבר'))
  })

  // והתאום: על הערכים התקינים של `params` — 0.87 אדום · 0.95 ענבר — אין משפט בכלל.
  it('‏0.87 אדום ו-0.95 ענבר — הסדר של params — ⇒ null, בלי משפט על המסך', () => {
    expect(reliabilityParamOrderNote(0.87, 0.95)).toBeNull()
  })

  it('שוויון הוא גם היפוך — ענבר מאבד את כל חבריו', () => {
    expect(reliabilityParamOrderNote(0.9, 0.9)).not.toBeNull()
  })

  it('מקדם חסר ⇒ אין הערת-סדר (החוסר נאמר במקום אחר — missingReportParamsMessage)', () => {
    expect(reliabilityParamOrderNote(null, 0.95)).toBeNull()
    expect(reliabilityParamOrderNote(0.87, null)).toBeNull()
  })
})

describe('ציון-האמינות — אותה נוסחה של Smart Match, לא עותק שלה (הכרעה 38)', () => {
  // ‏`(Σערך + m×C) ÷ (n + m)`, ‏m=3. ‏`cards-hostesses.md` ⑥ מ15.
  it('‏1 מתוך 1 אינה 1.0 — הריסון מושך אותה לממוצע', () => {
    expect(hostessReliabilityScore({ count: 1, total: 1 }, 0.958815, 3)).toBeCloseTo(
      (1 + 3 * 0.958815) / (1 + 3),
      10,
    )
  })

  it('‏11 משמרות מסומנות וסכום-ערכים 7.75 (רותם עמר) ⇒ הציון שבכרטיס, 0.759', () => {
    // ‏`cards-hostesses.md` ③ מ14 רושם לרותם עמר `0.759`. ‏11 המשמרות כתובות שם;
    // **סכום-הערכים 7.75 נמדד מהמסד** (ר' הדוח: `baseline_checks` של `report_m15_reliability`),
    // ולא נגזר לאחור מהציון — אחרת הבדיקה הייתה מוכיחה את עצמה.
    expect(hostessReliabilityScore({ count: 11, total: 7.75 }, 0.958815, 3)).toBeCloseTo(0.759, 3)
  })

  it('אין תצפיות ⇒ הציון הוא ממוצע-החברה עצמו, ולא 0', () => {
    expect(hostessReliabilityScore({ count: 0, total: 0 }, 0.958815, 3)).toBeCloseTo(0.958815, 10)
  })

  it('ממוצע-חברה חסר ⇒ null, לא ציון מומצא', () => {
    expect(hostessReliabilityScore({ count: 5, total: 4 }, null, 3)).toBeNull()
  })

  // 🔴 **הבדיקה היחידה שבודקת את הכרעה 38 עצמה, ולא את המספר שיצא ממנה.** כל שאר
  // הבדיקות ב-describe הזה מאמתות ערך — ומוטנט שמוחק את ה-`import` ומשכפל את
  // `(total + m*C)/(count + m)` לתוך `reportsHostesses.js` עובר את כולן בירוק,
  // ומוליד **שני** מספרים ששניהם נקראים "ציון-אמינות" ונפרדים ביום שהנוסחה משתנה
  // (כלל-ברזל 14). כאן נשאלת השאלה האחרת: **מי חישב, ובאיזה מיפוי-ארגומנטים.**
  // ⚠️ המיפוי אינו אינטואיטיבי ולכן הוא מקובע: ‏`count` (מספר המשמרות) עובר כ-
  // `answered` — **המכנה** — ו-`total` (סכום ערכי-הנוכחות) כ-`confirmed` — המונה;
  // בדיוק כפי ש-`reliabilityScore` עושה ב-`smartMatch.js`. היפוך השניים מחזיר 1.29
  // במקום 0.759 על אותה דיילת.
  it('מפעילה את responsivenessScore של Smart Match, באותו מיפוי-ארגומנטים', () => {
    vi.mocked(responsivenessScore).mockClear()
    const score = hostessReliabilityScore({ count: 11, total: 7.75 }, 0.958815, 3)
    expect(responsivenessScore).toHaveBeenCalledTimes(1)
    expect(responsivenessScore).toHaveBeenCalledWith({ answered: 11, confirmed: 7.75 }, 0.958815, 3)
    expect(score).toBeCloseTo(0.759, 3)
  })

  it('חסר ⇒ Smart Match כלל אינה נקראת, ולא נקראת עם null שיוחזר ממנה כ-NaN', () => {
    vi.mocked(responsivenessScore).mockClear()
    expect(hostessReliabilityScore({ count: 5, total: 4 }, null, 3)).toBeNull()
    expect(hostessReliabilityScore({ count: 5, total: 4 }, 0.958815, null)).toBeNull()
    expect(hostessReliabilityScore({ count: null, total: 4 }, 0.958815, 3)).toBeNull()
    expect(responsivenessScore).not.toHaveBeenCalled()
  })
})

describe('חציון ותעריף לפי דירוג (מ16)', () => {
  it('חציון על מספר אי-זוגי של ערכים', () => {
    expect(medianOf([41, 43, 47])).toBe(43)
  })

  it('חציון על מספר זוגי — ממוצע שני האמצעיים', () => {
    expect(medianOf([42.5, 44.04])).toBeCloseTo(43.27, 10)
  })

  it('סדר הקלט אינו משנה, וריק ⇒ null', () => {
    expect(medianOf([47, 41, 43])).toBe(43)
    expect(medianOf([])).toBeNull()
  })

  // 🔴 **דיילת בלי תעריף אינה דיילת ב-0 ₪.** ‏`Number(null)` ו-`Number('')` הם **0**,
  // ומימוש שמדלג על הפסילה שותל אפס בתחתית הסדרה — על ארבע דיילות `[41, —, 43, 47]`
  // החציון קופץ מ-**43 ל-42**, מספר שנראה סביר לגמרי על המסך וקו-הייחוס של הפיזור
  // (📐6) זז איתו. ⇒ ערך שאינו מספר סופי **נופל מהסדרה**, ואינו נספר במכנה.
  it('null · NaN · מחרוזת ריקה · undefined נופלים מהסדרה — ולא נספרים כאפס', () => {
    expect(medianOf([41, null, 43, 47])).toBe(43)
    expect(medianOf([41, Number.NaN, 43, 47])).toBe(43)
    expect(medianOf([41, '', 43, 47])).toBe(43)
    expect(medianOf([41, undefined, 43, 47])).toBe(43)
    expect(medianOf([41, '  ', 43, 47])).toBe(43)
  })

  it('והמספר שמוטנט-האפס היה מחזיר על אותו קלט — 42 — נבדק במפורש שאינו יוצא', () => {
    expect(medianOf([41, null, 43, 47])).not.toBe(42)
  })

  it('סדרה שכולה חוסר ⇒ null, לא 0 — "אין תעריף" אינו "תעריף אפס"', () => {
    expect(medianOf([null, Number.NaN, undefined])).toBeNull()
  })

  it('רצועות-דירוג: ממוצע לכל דירוג, ורצועה נפרדת לחסרות-דירוג', () => {
    const rows = [
      { rating: 5, hourly_rate: 46 },
      { rating: 5, hourly_rate: 48 },
      { rating: 4, hourly_rate: 44 },
      { rating: 3, hourly_rate: 40 },
      { rating: 3, hourly_rate: 42 },
      { rating: null, hourly_rate: 42.26 },
    ]
    expect(rateByRatingBands(rows)).toEqual([
      { rating: 5, count: 2, avgRate: 47, medianRate: 47 },
      { rating: 4, count: 1, avgRate: 44, medianRate: 44 },
      { rating: 3, count: 2, avgRate: 41, medianRate: 41 },
      { rating: null, count: 1, avgRate: 42.26, medianRate: 42.26 },
    ])
  })

  it('דירוג בלי אף דיילת אינו רצועה — לא מציגים "0 ₪"', () => {
    expect(rateByRatingBands([{ rating: 4, hourly_rate: 44 }])).toEqual([
      { rating: 4, count: 1, avgRate: 44, medianRate: 44 },
    ])
  })
})
