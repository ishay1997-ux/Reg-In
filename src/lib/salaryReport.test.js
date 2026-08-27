// בדיקות-יחידה ל-src/lib/salaryReport.js — מודול 8, צעד 2.2 (מדריך-מיקרו §Phase 2).
//
// 🔑 **כל מספר כאן מוקלד מהרשמים, ולעולם לא מחושב מהקוד הנבדק** (מדריך-מיקרו §4.3:
// *"tests are written TO these numbers, never re-derived from code"*). המקורות:
// `docs/specs/module_08_finance/data-set.md §5` (חמש השורות של אוגוסט 2026, שני
// וריאנטי-הנסיעות ושני הסה"כ), המוקאפ המאושר `03_salary_report_approved.html`
// (בונוס 0.00 בשורת שעות-בפועל, `—` בשורות-הפיצוי, `—` בשעות/תעריף של שורת-הסה"כ),
// ו-`screens-approved.md §⑦/§⑧`.
//
// **העוגן המרכזי (§4.3):** `598.00` (פרמטר-הנסיעות החי, 0) ו-`620.60` (ה20, 22.60) —
// שני וריאנטים של אותו דוח, ושורת אפרת `270.00` / `292.60`.
import { describe, expect, it } from 'vitest'
import readXlsxFile from 'read-excel-file/node'
import {
  NOT_APPLICABLE,
  SALARY_LINE_BASIS,
  SALARY_REPORT_COLUMNS,
  buildSalaryReportDocument,
  buildSalaryReportLines,
  salaryPeriodLabel,
  salaryReportFileName,
  salaryReportTotals,
  writeSalaryReportXlsx,
} from '@/lib/salaryReport'

// חותמת-הזמן מוזרקת (הקוד טהור מ-clock). 01/09/2026 08:00 שעון-ישראל = 05:00Z —
// התאריך שכרטיס-P4 עצמו נוקב בו כמועד ההפקה של דוח-אוגוסט.
const GENERATED_AT = '2026-09-01T05:00:00.000Z'
const GENERATED_AT_TEXT = '01/09/2026 08:00'

// שורת אפרת דהן (מקור א' — פרויקט #12, שעות-בפועל). שני הווריאנטים מוקלדים בנפרד ולא
// נגזרים זה מזה. ⚠️ `bonus: null` הוא מה שהמסד באמת מחזיר: `nullif(bonus, 0)`.
const efratLiveTravel = {
  hostess_id: 1,
  hostess_name: 'אפרת דהן',
  id_number: '301554333',
  source_project_id: 12,
  line_basis: 'actual',
  hours: 6,
  rate: 45,
  bonus: null,
  travel: null,
  line_total: 270,
  bank_name: 'הפועלים',
  bank_branch: '601',
  bank_account: '2047199',
  show_in_file: true,
}

const efratRuling20Travel = {
  ...efratLiveTravel,
  travel: 22.6,
  line_total: 292.6,
}

// ⚠️ **וריאנט שלישי — והוא היחיד כאן שאינו מהרשמים, במכוון.** ‏`data-set.md §5` נוקב "בונוס 0"
// בכל חמש השורות, ולכן **מסלול-הבונוס-שאינו-אפס אינו מכוסה באף עוגן**: המיפוי
// `bonus: isActual ? (bonusRaw ?? 0) : null`, תא-הבונוס בגיליון ו-`bonusTotal` היו שורדים החלפה
// ל-`0` קבוע בלי שאף בדיקה תאדים — כלומר בונוס אמיתי היה מודפס 0.00 לרו"ח בעוד סכום-השורה
// (שמגיע מהמסד) כן מכיל אותו, והקובץ לא היה מסתכם לשורותיו.
// ‏`assignments.personal_bonus` היא עמודה חיה בבעלות מ8 (§7.19; ‏`not null default 0`), והמסד
// מחזיר אותה כמספר (`nullif(c.bonus, 0)`) ומקפל אותה לסכום-השורה:
// ‏`round(c.hours * c.rate + c.bonus + c.travel, 2)` (מיגרציה `20260827153725`).
// 🔴 **הבונוס 250 אינו הכרעת-מוצר ואינו עוגן** — הוא ערך-בדיקה שנבחר כאן; שני הסכומים נגזרו
// **ביד מהנוסחה הזאת בלבד**: ‏6×45 + 250 + 22.60 = **542.60**, וסה"כ-הדוח
// ‏542.60+86+80+78+84 = **870.60**. ⛔ **ולכן הוא וריאנט נפרד ואינו נוגע בעוגני-§4.3**
// (‏292.60 · 620.60 · 598.00) — עוגן שנרשם אינו משתנה כדי לכסות מסלול.
const efratWithPersonalBonus = {
  ...efratRuling20Travel,
  bonus: 250,
  line_total: 542.6,
}

// ארבע שורות פיצוי-הביטול (מקור ב' — פרויקט #14, 50% × 4.00 שעות מתוכננות × תעריף-קפוא).
// בונוס ונסיעות מגיעים NULL מהמסד ונשארים "לא-רלוונטי" (ה24/ה29).
const compensationLines = [
  {
    hostess_id: 2,
    hostess_name: 'אורלי שני',
    id_number: '301550224',
    source_project_id: 14,
    line_basis: 'cancellation_compensation',
    hours: 4,
    rate: 43,
    bonus: null,
    travel: null,
    line_total: 86,
    bank_name: 'דיסקונט',
    bank_branch: '045',
    bank_account: '8732016',
    show_in_file: true,
  },
  {
    hostess_id: 3,
    hostess_name: 'רחל לוי',
    id_number: '301551594',
    source_project_id: 14,
    line_basis: 'cancellation_compensation',
    hours: 4,
    rate: 40,
    bonus: null,
    travel: null,
    line_total: 80,
    bank_name: 'מזרחי-טפחות',
    bank_branch: '512',
    bank_account: '4491067',
    show_in_file: true,
  },
  {
    hostess_id: 4,
    hostess_name: 'ליאת פרץ',
    id_number: '301552964',
    source_project_id: 14,
    line_basis: 'cancellation_compensation',
    hours: 4,
    rate: 39,
    bonus: null,
    travel: null,
    line_total: 78,
    bank_name: 'לאומי',
    bank_branch: '782',
    bank_account: '1184538',
    show_in_file: true,
  },
  {
    hostess_id: 5,
    hostess_name: 'שרון כהן',
    id_number: '301557070',
    source_project_id: 14,
    line_basis: 'cancellation_compensation',
    hours: 4,
    rate: 42,
    bonus: null,
    travel: null,
    line_total: 84,
    bank_name: 'מזרחי-טפחות',
    bank_branch: '512',
    bank_account: '44910611',
    show_in_file: true,
  },
]

// data-set.md §5, "שורה שלא נכללה בכוונה": ארבעת השיבוצים של #13 הם `actual_hours=0`,
// כלומר שורות ₪0.00 שנחתמות ונרשמות אך אינן נכנסות לגוף האקסל (N-4).
const zeroLine = {
  hostess_id: 6,
  hostess_name: 'מיכל אברהם',
  id_number: '301553888',
  source_project_id: 13,
  line_basis: 'actual',
  hours: 0,
  rate: 45,
  bonus: null,
  travel: null,
  line_total: 0,
  bank_name: 'לאומי',
  bank_branch: '782',
  bank_account: '1100221',
  show_in_file: false,
}

function augustPayload(efratRow, extraLines = []) {
  const lines = [efratRow, ...compensationLines, ...extraLines]
  // הסה"כ של כל וריאנט — מוקלד, לא מחושב מהשורות. 542.6 ⇒ 870.6 הוא וריאנט-הבונוס שלמעלה.
  const totalsByVariant = { 270: 598, 292.6: 620.6, 542.6: 870.6 }
  return {
    ok: true,
    report_id: 7,
    period: '2026-08-01',
    total_amount: totalsByVariant[efratRow.line_total],
    line_count: lines.length,
    lines,
  }
}

describe('salaryPeriodLabel / salaryReportFileName — תווית-החודש ושם-הקובץ', () => {
  it('תקופה 2026-08-01 ⇒ "אוגוסט 2026" ו-08_2026_Payroll_Report.xlsx (ריכוז-#5, C5 §5.8.10)', () => {
    expect(salaryPeriodLabel('2026-08-01')).toBe('אוגוסט 2026')
    expect(salaryReportFileName('2026-08-01')).toBe('08_2026_Payroll_Report.xlsx')
  })

  it('חודש חד-ספרתי מרופד באפס — ינואר 2027 ⇒ 01_2027_Payroll_Report.xlsx', () => {
    expect(salaryPeriodLabel('2027-01-01')).toBe('ינואר 2027')
    expect(salaryReportFileName('2027-01-01')).toBe('01_2027_Payroll_Report.xlsx')
  })

  it('תקופה חסרה או שבורה נופלת ברעש — לא ברירת-מחדל שקטה', () => {
    expect(() => salaryReportFileName(null)).toThrow(/תקופת הדוח אינה תקינה/)
    expect(() => salaryPeriodLabel('2026-13-01')).toThrow(/תקופת הדוח אינה תקינה/)
  })
})

describe('buildSalaryReportLines — עיצוב חמש שורות אוגוסט 2026 (data-set §5)', () => {
  it('חמש שורות, בסדר שהתקבל מה-RPC, עם שני מקורות-החישוב של ה15', () => {
    const lines = buildSalaryReportLines(augustPayload(efratRuling20Travel))
    expect(lines).toHaveLength(5)
    expect(lines.map((line) => line.hostessName)).toEqual([
      'אפרת דהן',
      'אורלי שני',
      'רחל לוי',
      'ליאת פרץ',
      'שרון כהן',
    ])
    expect(lines[0].lineBasis).toBe(SALARY_LINE_BASIS.ACTUAL)
    expect(lines[0].hoursLabel).toBe('בפועל')
    expect(lines[1].lineBasis).toBe(SALARY_LINE_BASIS.CANCELLATION_COMPENSATION)
    expect(lines[1].hoursLabel).toBe('מתוכנן')
  })

  it('פרטי-הבנק מורכבים לצורת המוקאפ — "הפועלים 601-2047199"', () => {
    const lines = buildSalaryReportLines(augustPayload(efratRuling20Travel))
    expect(lines[0].bankDetails).toBe('הפועלים 601-2047199')
    expect(lines[4].bankDetails).toBe('מזרחי-טפחות 512-44910611')
  })

  it('שורת-פיצוי: בונוס ונסיעות null ⇒ "—" (ה24/ה29); שורת שעות-בפועל: בונוס 0 מספרי (המוקאפ)', () => {
    const lines = buildSalaryReportLines(augustPayload(efratRuling20Travel))
    expect(lines[0].bonus).toBe(0)
    expect(lines[0].travel).toBe(22.6)
    expect(lines[1].bonus).toBeNull()
    expect(lines[1].travel).toBeNull()
  })

  // בונוס-אישי שאינו אפס עובר כמות-שהוא. בלי הבדיקה הזאת המיפוי היה יכול להחזיר 0 קבוע
  // לשורת שעות-בפועל, והפער היה מתגלה רק אצל הרו"ח — סכום-שורה שאינו סכום עמודותיה.
  it('בונוס-אישי שאינו אפס מגיע כמספר ואינו נבלע לאפס (personal_bonus, §7.19)', () => {
    const lines = buildSalaryReportLines(augustPayload(efratWithPersonalBonus))
    expect(lines[0].bonus).toBe(250)
    expect(lines[0].travel).toBe(22.6)
    expect(lines[0].lineTotal).toBe(542.6)
  })
})

describe('salaryReportTotals — שני עוגני-הסה"כ של §4.3', () => {
  it('פרמטר-הנסיעות החי (0) ⇒ שורת אפרת 270.00 וסה"כ 598.00', () => {
    const lines = buildSalaryReportLines(augustPayload(efratLiveTravel))
    expect(lines[0].lineTotal).toBe(270)
    expect(salaryReportTotals(lines).total).toBe(598)
  })

  it('ה20 (22.60) ⇒ שורת אפרת 292.60 וסה"כ 620.60', () => {
    const lines = buildSalaryReportLines(augustPayload(efratRuling20Travel))
    expect(lines[0].lineTotal).toBe(292.6)
    const totals = salaryReportTotals(lines)
    expect(totals.total).toBe(620.6)
    expect(totals.travelTotal).toBe(22.6)
    expect(totals.bonusTotal).toBe(0)
  })

  it('בונוס-אישי 250 נכנס ל-bonusTotal ולסה"כ (542.60 בשורה ⇒ 870.60 בדוח)', () => {
    const lines = buildSalaryReportLines(augustPayload(efratWithPersonalBonus))
    const totals = salaryReportTotals(lines)
    expect(totals.bonusTotal).toBe(250)
    expect(totals.travelTotal).toBe(22.6)
    expect(totals.total).toBe(870.6)
  })

  it('N-4: שורת אפס נרשמת אך אינה בגוף הקובץ, והסה"כ אינו משתנה', () => {
    const lines = buildSalaryReportLines(augustPayload(efratRuling20Travel, [zeroLine]))
    const totals = salaryReportTotals(lines)
    expect(totals.lineCount).toBe(6)
    expect(totals.fileLineCount).toBe(5)
    expect(totals.total).toBe(620.6)
  })
})

describe('שומרי תיפול-ברעש (R4-F9) — מסמך שמספריו אינם מסתדרים אינו מורכב', () => {
  it('payload בלי ok / בלי רשימת שורות', () => {
    expect(() => buildSalaryReportDocument({ ok: false }, { generatedAt: GENERATED_AT })).toThrow(
      /הפקת דוח-השכר לא הושלמה/,
    )
    expect(() => buildSalaryReportLines({ ok: true })).toThrow(/חסרה רשימת השורות/)
  })

  it('שורה בלי סכום, בלי תעריף או בלי ת"ז — נופלת ומזהה את מיקומה', () => {
    const payload = augustPayload(efratRuling20Travel)
    const broken = { ...payload, lines: [{ ...efratRuling20Travel, line_total: null }] }
    expect(() => buildSalaryReportLines(broken)).toThrow(/חסרה סכום/)

    const noId = { ...payload, lines: [{ ...efratRuling20Travel, id_number: '  ' }] }
    expect(() => buildSalaryReportLines(noId)).toThrow(/חסרה שם או ת"ז/)
  })

  it('בסיס-חישוב לא מוכר נופל — ולא מתחזה בשקט לשורת שעות-בפועל', () => {
    const payload = augustPayload(efratRuling20Travel)
    const alien = { ...payload, lines: [{ ...efratRuling20Travel, line_basis: 'retro' }] }
    expect(() => buildSalaryReportLines(alien)).toThrow(/בסיס-חישוב לא מוכר/)
  })

  it('שורת פיצוי-ביטול שהגיעה עם נסיעות נוגדת את ה29 ⇒ נופלת', () => {
    const payload = augustPayload(efratRuling20Travel)
    const withTravel = {
      ...payload,
      lines: [{ ...compensationLines[0], travel: 22.6, line_total: 108.6 }],
    }
    expect(() => buildSalaryReportLines(withTravel)).toThrow(/נוגד את ה24\/ה29/)
  })

  it('סכום השורות שאינו תואם את total_amount של המסד ⇒ הדוח לא מורכב', () => {
    const payload = { ...augustPayload(efratRuling20Travel), total_amount: 620.5 }
    expect(() => buildSalaryReportDocument(payload, { generatedAt: GENERATED_AT })).toThrow(
      /אינו תואם את הסכום שנרשם במסד/,
    )
  })

  it('שורה מוסתרת שנושאת סכום ⇒ נופלת (הקובץ לעולם לא יסכום פחות משורותיו)', () => {
    const hiddenPaid = { ...compensationLines[0], show_in_file: false }
    const lines = buildSalaryReportLines({ ok: true, lines: [hiddenPaid] })
    expect(() => salaryReportTotals(lines)).toThrow(/שורה שאינה מוצגת בקובץ נושאת סכום/)
  })

  it('חותמת-זמן חסרה ⇒ הקובץ לא מורכב (אין שעון פנימי שימלא אותה)', () => {
    expect(() => buildSalaryReportDocument(augustPayload(efratRuling20Travel), {})).toThrow(
      /חסרה חותמת-זמן/,
    )
  })
})

describe('buildSalaryReportDocument — המסמך המלא', () => {
  const doc = buildSalaryReportDocument(augustPayload(efratRuling20Travel), {
    generatedAt: GENERATED_AT,
  })

  it('שם-קובץ, תווית-חודש וסה"כ', () => {
    expect(doc.fileName).toBe('08_2026_Payroll_Report.xlsx')
    expect(doc.periodLabel).toBe('אוגוסט 2026')
    expect(doc.totals.total).toBe(620.6)
    expect(doc.linesMissingBankDetails).toEqual([])
  })

  it('כותרת: שם-הדוח, קוד-ההפקה (B-11) וחותמת-הזמן — קוד-ההפקה כמחרוזת', () => {
    expect(doc.sheet[0][0].value).toBe('דוח שכר דיילות — אוגוסט 2026')
    expect(doc.sheet[1][0].value).toBe('קוד הפקה')
    expect(doc.sheet[1][1]).toMatchObject({ value: '7', type: String })
    expect(doc.sheet[2][1].value).toBe(GENERATED_AT_TEXT)
  })

  it('שורת-הכותרות היא בדיוק שמונה עמודות א48, בסדר של צעד 2.2', () => {
    expect(doc.sheet[4].map((cell) => cell.value)).toEqual(SALARY_REPORT_COLUMNS)
    expect(SALARY_REPORT_COLUMNS).toEqual([
      'ת"ז',
      'שם',
      'פרטי-בנק',
      'תעריף',
      'שעות',
      'בונוס',
      'נסיעות',
      'סה"כ',
    ])
  })

  it('שורת-הסה"כ: שעות ותעריף "—" (S3 §⑧7), בונוס/נסיעות/סה"כ מספרים', () => {
    const totalRow = doc.sheet[doc.sheet.length - 1]
    expect(totalRow[0].value).toBe('סה"כ')
    expect(totalRow[3].value).toBe(NOT_APPLICABLE)
    expect(totalRow[4].value).toBe(NOT_APPLICABLE)
    expect(totalRow[5].value).toBe(0)
    expect(totalRow[6].value).toBe(22.6)
    expect(totalRow[7].value).toBe(620.6)
  })

  // תא-הבונוס בגוף-הגיליון ובשורת-הסה"כ, על שורה שבונוסה אינו אפס — שני התאים היחידים
  // שבהם בונוס אמיתי נראה לרו"ח.
  it('בונוס-אישי מודפס בתא-הגוף ובשורת-הסה"כ, ולא כ-0.00', () => {
    const docBonus = buildSalaryReportDocument(augustPayload(efratWithPersonalBonus), {
      generatedAt: GENERATED_AT,
    })
    expect(docBonus.sheet[5][5].value).toBe(250)
    expect(docBonus.sheet[5][7].value).toBe(542.6)
    const totalRow = docBonus.sheet[docBonus.sheet.length - 1]
    expect(totalRow[5].value).toBe(250)
    expect(totalRow[7].value).toBe(870.6)
  })

  it('דיילת בלי פרטי-בנק מסומנת להתרעה, ובקובץ מקבלת "—" ולא תא ריק', () => {
    const noBank = {
      ...efratRuling20Travel,
      bank_name: null,
      bank_branch: null,
      bank_account: null,
    }
    const docNoBank = buildSalaryReportDocument(augustPayload(noBank), {
      generatedAt: GENERATED_AT,
    })
    expect(docNoBank.linesMissingBankDetails).toEqual(['אפרת דהן'])
    expect(docNoBank.sheet[5][2].value).toBe(NOT_APPLICABLE)
  })
})

describe('writeSalaryReportXlsx — הלוך-ושוב אמיתי דרך קובץ xlsx', () => {
  async function parseGeneratedFile(payload) {
    const doc = buildSalaryReportDocument(payload, { generatedAt: GENERATED_AT })
    const blob = await writeSalaryReportXlsx(doc)
    const rows = await readXlsxFile(Buffer.from(await blob.arrayBuffer()))
    const headerIndex = rows.findIndex((row) => row[0] === 'ת"ז')
    return { doc, rows, headerIndex }
  }

  it('הקובץ נקרא חזרה: כותרת, שמונה עמודות, חמש שורות-גוף ושורת-סה"כ 620.60', async () => {
    const { rows, headerIndex } = await parseGeneratedFile(augustPayload(efratRuling20Travel))

    expect(rows[0][0]).toBe('דוח שכר דיילות — אוגוסט 2026')
    expect(headerIndex).toBeGreaterThan(0)
    expect(rows[headerIndex].slice(0, 8)).toEqual(SALARY_REPORT_COLUMNS)

    const body = rows.slice(headerIndex + 1, rows.length - 1)
    expect(body).toHaveLength(5)

    const totalRow = rows[rows.length - 1]
    expect(totalRow[0]).toBe('סה"כ')
    expect(totalRow[7]).toBe(620.6)
  })

  it('ת"ז חוזרת כמחרוזת ולא כמספר — אפס מוביל לא נעלם במסמך שהולך לרו"ח', async () => {
    const { rows, headerIndex } = await parseGeneratedFile(augustPayload(efratRuling20Travel))
    const firstBodyRow = rows[headerIndex + 1]
    expect(typeof firstBodyRow[0]).toBe('string')
    expect(firstBodyRow[0]).toBe('301554333')
    expect(firstBodyRow[2]).toBe('הפועלים 601-2047199')
  })

  it('עברית, עשרוניות ו-"—" שורדים את ההלוך-ושוב', async () => {
    const { rows, headerIndex } = await parseGeneratedFile(augustPayload(efratRuling20Travel))
    const efrat = rows[headerIndex + 1]
    const orly = rows[headerIndex + 2]

    expect(efrat[1]).toBe('אפרת דהן')
    // ⚠️ תעריף (3) ושעות (4) **בסדר הזה** — א48. שני המספרים ניתנים להחלפה בלי לשנות את
    // סכום-השורה, ולכן החלפה שקטה הייתה מדווחת לרו"ח "45 שעות בתעריף 6" ועוברת בירוק.
    // שורת-הסה"כ אינה מבחינה ביניהם (שני התאים `—`), ולכן הפין חייב לשבת בשורת-גוף.
    expect(efrat[3]).toBe(45)
    expect(efrat[4]).toBe(6)
    // בונוס-אפס בשורת שעות-בפועל הוא **אפס שנמדד** ⇒ 0.00 ולא `—` (המוקאפ המאושר; פסקת-הסתירה
    // בראש `salaryReport.js`). זהו הצד השני של `orly[5]` שמתחתיו.
    expect(efrat[5]).toBe(0)
    expect(efrat[6]).toBe(22.6)
    expect(efrat[7]).toBe(292.6)

    expect(orly[1]).toBe('אורלי שני')
    expect(orly[5]).toBe(NOT_APPLICABLE)
    expect(orly[6]).toBe(NOT_APPLICABLE)
    expect(orly[7]).toBe(86)
  })

  it('N-4 בקובץ עצמו: שורת האפס אינה בגוף הקובץ, והסה"כ נשאר 620.60', async () => {
    const { rows, headerIndex } = await parseGeneratedFile(
      augustPayload(efratRuling20Travel, [zeroLine]),
    )
    const body = rows.slice(headerIndex + 1, rows.length - 1)
    expect(body).toHaveLength(5)
    expect(body.map((row) => row[1])).not.toContain('מיכל אברהם')
    expect(rows[rows.length - 1][7]).toBe(620.6)
  })

  // המסלול המלא של הבונוס — מהמיפוי ועד הבתים שנפתחים באקסל אצל הרו"ח.
  it('בונוס-אישי שורד את ההלוך-ושוב: 250 בתא-הגוף, 250 בסה"כ, שורה 542.60 ודוח 870.60', async () => {
    const { rows, headerIndex } = await parseGeneratedFile(augustPayload(efratWithPersonalBonus))
    const efrat = rows[headerIndex + 1]
    expect(efrat[1]).toBe('אפרת דהן')
    expect(efrat[5]).toBe(250)
    expect(efrat[7]).toBe(542.6)

    const totalRow = rows[rows.length - 1]
    expect(totalRow[5]).toBe(250)
    expect(totalRow[7]).toBe(870.6)
  })

  it('וריאנט הפרמטר החי (נסיעות 0): שורת אפרת 270.00 וסה"כ 598.00', async () => {
    const { rows, headerIndex } = await parseGeneratedFile(augustPayload(efratLiveTravel))
    expect(rows[headerIndex + 1][6]).toBe(0)
    expect(rows[headerIndex + 1][7]).toBe(270)
    expect(rows[rows.length - 1][7]).toBe(598)
  })
})
