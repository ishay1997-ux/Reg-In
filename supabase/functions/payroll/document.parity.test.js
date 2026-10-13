// @vitest-environment node
// בדיקת-שוויון (חוזה §6, D9): המסמך שהשרת בונה זהה תא-תא למסמך שהדפדפן בנה עד היום
// (`src/lib/salaryReport.js`, קריאה בלבד). אותו מטען נכנס לשני הצדדים; משווים גיליון (ערך, סוג
// String/Number, פורמט, הדגשה, יישור), שם קובץ, סכומים, חסרי-בנק וקוד-שגיאה.
// ועוד: הרחבת דוח-ההשלמה, שאין לה מקבילה בדפדפן.
import { describe, it, expect } from 'vitest'
import { buildSalaryReportDocument as browserBuild } from '@/lib/salaryReport'
import { buildSalaryReportDocument as edgeBuild, reportPeriodLabel } from './document.ts'

const GENERATED_AT = '2026-08-03T21:30:00Z'

function line(overrides = {}) {
  return {
    hostess_id: 901,
    hostess_name: 'אפרת דהן',
    id_number: '203456789',
    source_project_id: 9001,
    line_basis: 'actual',
    hours: 5,
    rate: 50,
    bonus: null,
    travel: 22.6,
    line_total: 272.6,
    bank_name: 'הפועלים',
    bank_branch: '601',
    bank_account: '2047199',
    show_in_file: true,
    ...overrides,
  }
}

function payload(lines, overrides = {}) {
  const total = lines.reduce((sum, l) => sum + Math.round(Number(l.line_total ?? 0) * 100), 0) / 100
  return {
    ok: true,
    report_id: 15,
    period: '2026-08-01',
    total_amount: total,
    line_count: lines.length,
    lines,
    ...overrides,
  }
}

// עשרה מטענים תקינים (חוזה §6: שורות אפס, פיצוי, בנק חסר, שעות עם 3 ספרות, ת"ז עם אפס מוביל).
const VALID = {
  'שורה אחת מלאה': payload([line()]),
  'ת"ז עם אפס מוביל': payload([line({ id_number: '012345678' })]),
  'שעות עם 3 ספרות אחרי הנקודה': payload([
    line({ hours: 4.125, rate: 47.5, travel: 0, line_total: 195.94 }),
  ]),
  'שורת אפס (show_in_file=false)': payload([
    line(),
    line({ hostess_id: 902, hours: 0, travel: null, line_total: 0, show_in_file: false }),
  ]),
  'שורת אפס בלי show_in_file (ברירת המחדל)': payload([
    line({ hours: 0, travel: null, line_total: 0, show_in_file: undefined }),
  ]),
  'פיצוי ביטול': payload([
    line({
      line_basis: 'cancellation_compensation',
      hours: 4,
      bonus: null,
      travel: null,
      line_total: 100,
    }),
  ]),
  'בנק חסר': payload([line({ bank_name: null, bank_branch: null, bank_account: null })]),
  'בנק בלי סניף ובלי שם': payload([
    line({ bank_name: '', bank_branch: null, bank_account: '00123' }),
  ]),
  'בונוס ונסיעות אמיתיים': payload([line({ bonus: 100, travel: 22.6, line_total: 372.6 })]),
  'מעורב: שלוש דיילות, פיצוי, אפס, בלי בנק': payload([
    line(),
    line({
      hostess_id: 903,
      hostess_name: 'נועה',
      id_number: '000000018',
      bonus: 50,
      line_total: 322.6,
    }),
    line({
      hostess_id: 904,
      line_basis: 'cancellation_compensation',
      travel: null,
      line_total: 250,
    }),
    line({ hostess_id: 905, hours: 0, travel: null, line_total: 0, show_in_file: false }),
    line({ hostess_id: 906, bank_account: null }),
  ]),
  'רשימה ריקה': payload([]),
  'תקופה בפורמט YYYY-MM': payload([line()], { period: '2026-02' }),
}

// מטענים פגומים — שני הצדדים חייבים לזרוק את אותו קוד.
const INVALID = {
  'ok=false': { ...payload([line()]), ok: false },
  'בלי report_id': { ...payload([line()]), report_id: null },
  'lines אינו מערך': { ...payload([line()]), lines: null },
  'בסיס לא מוכר': payload([line({ line_basis: 'bonus' })]),
  'חסרה ת"ז': payload([line({ id_number: '  ' })]),
  'חסרות שעות': payload([line({ hours: null })]),
  'חסר תעריף': payload([line({ rate: 'x' })]),
  'חסר סכום': payload([line({ line_total: undefined })]),
  'פיצוי עם נסיעות': payload([line({ line_basis: 'cancellation_compensation', travel: 5 })]),
  'שורה מוסתרת עם סכום': payload([line({ show_in_file: false })]),
  'סכום לא תואם': payload([line()], { total_amount: 999 }),
  'מספר שורות לא תואם': payload([line()], { line_count: 2 }),
  'חסר total_amount': (() => {
    const p = payload([line()])
    delete p.total_amount
    return p
  })(),
  'תקופה פסולה': payload([line()], { period: '2026-13-01' }),
}

function run(build, input, options) {
  try {
    const doc = build(input, options)
    return {
      sheet: doc.sheet,
      fileName: doc.fileName,
      periodLabel: doc.periodLabel,
      totals: doc.totals,
      linesMissingBankDetails: doc.linesMissingBankDetails,
      lines: doc.lines,
    }
  } catch (err) {
    return { code: err.code }
  }
}

describe('document.ts מול src/lib/salaryReport.js — מטענים תקינים', () => {
  it.each(Object.entries(VALID))('%s', (_name, input) => {
    const browser = run(browserBuild, input, { generatedAt: GENERATED_AT })
    const edge = run(edgeBuild, input, { generatedAt: GENERATED_AT })
    expect(browser.code).toBeUndefined()
    expect(edge).toEqual(browser)
    // הסוגים הם הקונסטרוקטורים עצמם — ת"ז כמחרוזת, כסף כמספר.
    edge.sheet.flat().forEach((cell, i) => {
      const other = browser.sheet.flat()[i]
      expect(cell?.type).toBe(other?.type)
    })
  })

  it('ת"ז עם אפס מוביל נשמרת כמחרוזת בגיליון', () => {
    const doc = edgeBuild(VALID['ת"ז עם אפס מוביל'], { generatedAt: GENERATED_AT })
    const idCell = doc.sheet[5][0]
    expect(idCell).toEqual({ value: '012345678', type: String })
  })
})

describe('document.ts מול src/lib/salaryReport.js — אותו קוד שגיאה', () => {
  it.each(Object.entries(INVALID))('%s', (_name, input) => {
    const browser = run(browserBuild, input, { generatedAt: GENERATED_AT })
    const edge = run(edgeBuild, input, { generatedAt: GENERATED_AT })
    expect(browser.code).toBeTruthy()
    expect(edge).toEqual(browser)
  })

  it('בלי חותמת-זמן — אותו קוד', () => {
    const input = VALID['שורה אחת מלאה']
    expect(run(edgeBuild, input, {})).toEqual(run(browserBuild, input, {}))
    expect(run(edgeBuild, input, {}).code).toBe('SALARY_REPORT_TIMESTAMP_MISSING')
  })

  it('kind=regular מפורש (כפי שתמונת-המצב מחזירה) — זהה לדפדפן', () => {
    const input = {
      ...VALID['שורה אחת מלאה'],
      kind: 'regular',
      original_report_id: null,
      supplement_seq: null,
    }
    expect(run(edgeBuild, input, { generatedAt: GENERATED_AT })).toEqual(
      run(browserBuild, input, { generatedAt: GENERATED_AT }),
    )
  })
})

describe('דוח השלמה (חוזה §3.1)', () => {
  const supplement = {
    ...payload([line()], { report_id: 41 }),
    kind: 'supplement',
    original_report_id: 15,
    supplement_seq: 1,
  }

  it('שם קובץ, כותרת ושורת "דוח מקורי" אחרי "הופק בתאריך"', () => {
    const doc = edgeBuild(supplement, { generatedAt: GENERATED_AT })
    expect(doc.fileName).toBe('08_2026_Payroll_Report_Supplement_1.xlsx')
    expect(doc.sheet[0][0].value).toBe('דוח שכר דיילות — אוגוסט 2026 — השלמה 1')
    expect(doc.sheet[1].map((c) => c.value)).toEqual(['קוד הפקה', '41'])
    expect(doc.sheet[2][0].value).toBe('הופק בתאריך')
    expect(doc.sheet[3]).toEqual([
      { value: 'דוח מקורי', type: String, fontWeight: 'bold' },
      { value: '15', type: String },
    ])
    expect(doc.sheet[4]).toEqual([null])
    expect(doc.periodLabel).toBe('אוגוסט 2026')
  })

  it('גוף הגיליון (מהכותרות ועד הסה"כ) זהה לדוח רגיל עם אותן שורות', () => {
    const regular = edgeBuild(payload([line()], { report_id: 41 }), { generatedAt: GENERATED_AT })
    const doc = edgeBuild(supplement, { generatedAt: GENERATED_AT })
    expect(doc.sheet.slice(5)).toEqual(regular.sheet.slice(4))
  })

  it.each([
    ['בלי מספר השלמה', { supplement_seq: null }],
    ['מספר השלמה 0', { supplement_seq: 0 }],
    ['בלי דוח מקורי', { original_report_id: null }],
    ['סוג לא מוכר', { kind: 'adjustment' }],
  ])('%s ⇒ SALARY_SUPPLEMENT_IDENTITY_MISSING', (_name, patch) => {
    expect(run(edgeBuild, { ...supplement, ...patch }, { generatedAt: GENERATED_AT })).toEqual({
      code: 'SALARY_SUPPLEMENT_IDENTITY_MISSING',
    })
  })

  it('תווית החודש: רגיל מול השלמה', () => {
    expect(reportPeriodLabel('2026-08-01', null)).toBe('אוגוסט 2026')
    expect(reportPeriodLabel('2026-08-01', 2)).toBe('אוגוסט 2026 — השלמה 2')
  })
})
