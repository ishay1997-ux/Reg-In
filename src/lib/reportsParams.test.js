import { describe, it, expect } from 'vitest'
import { paramLabel } from './paramsRegistry'
import { REPORT_PARAM_NAMES, missingReportParamsMessage } from './reportsParams'

// הערכים שמיגרציה C מכניסה (`20260916043500_module11_c_report_params.sql`), כמחרוזות —
// `params.param_value` הוא `text`, ולכן זו הצורה שהקוד באמת מקבל.
const ALL_PRESENT = {
  [REPORT_PARAM_NAMES.distantCustomerMultiplier]: '1.5',
  [REPORT_PARAM_NAMES.budgetDeviationPercent]: '15',
  [REPORT_PARAM_NAMES.reliabilityRed]: '0.87',
  [REPORT_PARAM_NAMES.reliabilityAmber]: '0.95',
}

describe('REPORT_PARAM_NAMES — ארבעה שמות, זהים בתו לשמות שבמיגרציה', () => {
  it('ארבעה בדיוק, ואלה הם', () => {
    expect(Object.values(REPORT_PARAM_NAMES)).toEqual([
      'מכפיל_מרווח_מתרחק',
      'סף_סטיית_תקציב_אחוז',
      'מקדם_אמינות_אדום',
      'מקדם_אמינות_ענבר',
    ])
  })
})

describe('missingReportParamsMessage — אומרת מה חסר, לעולם לא ברירת-מחדל שקטה', () => {
  it('כל הארבעה קיימים ⇒ null', () => {
    expect(missingReportParamsMessage(ALL_PRESENT)).toBeNull()
  })

  it('שורה אחת חסרה ⇒ המשפט נוקב בשמה, בלשון יחיד', () => {
    const rest = { ...ALL_PRESENT }
    delete rest[REPORT_PARAM_NAMES.reliabilityRed]
    const message = missingReportParamsMessage(rest)
    expect(message).toContain('חסר פרמטר מערכת: מקדם אמינות לסימון אדום')
    expect(message).toContain('אין סימון אדום בדוח אמינות הדיילות')
    expect(message).toContain('יש להוסיף את השורה בהגדרות המערכת.')
    // 🔴 השורות הקיימות אינן מוזכרות — באנר שמונה גם את מה שתקין נקרא כרקע.
    expect(message).not.toContain('מקדם אמינות לסימון ענבר')
  })

  it('שתי שורות חסרות ⇒ שתיהן נקובות, בלשון רבים', () => {
    const message = missingReportParamsMessage({
      [REPORT_PARAM_NAMES.reliabilityRed]: '0.87',
      [REPORT_PARAM_NAMES.reliabilityAmber]: '0.95',
    })
    expect(message).toContain('חסרים פרמטרי מערכת')
    expect(message).toContain('מכפיל מרווח ללקוח מתרחק')
    expect(message).toContain('סף סטיית תקציב')
    expect(message).toContain('יש להוסיף את השורות בהגדרות המערכת.')
  })

  // ⚠️ המחלקה שבגללה הקובץ קיים: ערך שנראה כמו ערך ואינו מספר. `Number('')` הוא 0,
  // ‏`Number(null)` הוא 0 — ושניהם היו הופכים "אין סף" ל-"סף אפס" בלי מילה אחת למשתמשת.
  it.each([[null], [undefined], [''], ['  '], ['לא-מספר'], [Number.NaN]])(
    'ערך %p נחשב שורה חסרה ולא אפס',
    (value) => {
      const message = missingReportParamsMessage({
        ...ALL_PRESENT,
        [REPORT_PARAM_NAMES.budgetDeviationPercent]: value,
      })
      expect(message).toContain('סף סטיית תקציב')
    },
  )

  it('אפס הוא ערך קיים ולא שורה חסרה', () => {
    expect(
      missingReportParamsMessage({
        ...ALL_PRESENT,
        [REPORT_PARAM_NAMES.budgetDeviationPercent]: '0',
      }),
    ).toBeNull()
  })

  it('מפה ריקה או חסרה ⇒ כל הארבעה נקובים, ובלי לזרוק', () => {
    const message = missingReportParamsMessage(undefined)
    // ✏️ 24/09/2026 (A5): ההודעה נוקבת בתווית שבמסך הפרמטרים, ולא בשם-העמודה.
    for (const name of Object.values(REPORT_PARAM_NAMES)) {
      expect(message).toContain(paramLabel(name))
    }
  })

  // תת-קבוצה: לשונית הדיילות אינה תלויה בסף-התקציב, ולכן אינה מדווחת עליו.
  it('בדיקת תת-קבוצה מדווחת רק על מה שנמסר', () => {
    const onlyReliability = [REPORT_PARAM_NAMES.reliabilityRed, REPORT_PARAM_NAMES.reliabilityAmber]
    expect(
      missingReportParamsMessage({ [REPORT_PARAM_NAMES.reliabilityRed]: '0.87' }, onlyReliability),
    ).toContain('מקדם אמינות לסימון ענבר')
    expect(
      missingReportParamsMessage(
        {
          [REPORT_PARAM_NAMES.reliabilityRed]: '0.87',
          [REPORT_PARAM_NAMES.reliabilityAmber]: '0.95',
        },
        onlyReliability,
      ),
    ).toBeNull()
  })
})
