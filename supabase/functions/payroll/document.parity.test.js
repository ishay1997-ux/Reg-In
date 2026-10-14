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
    event_date: '2026-08-03',
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

// גיליון 2: נועה ראשונה בקלט, אפרת עם שתי משמרות (אחת פיצוי), שורת אפס של נועה, בתיה בלי בנק.
const SUMMARY_PAYLOAD = payload([
  line({
    hostess_id: 903,
    hostess_name: 'נועה לוי',
    id_number: '000000018',
    hours: 6,
    rate: 45,
    travel: 0,
    line_total: 270,
  }),
  line(),
  line({ line_basis: 'cancellation_compensation', hours: 4, travel: null, line_total: 200 }),
  line({
    hostess_id: 903,
    hostess_name: 'נועה לוי',
    id_number: '000000018',
    hours: 0,
    travel: null,
    line_total: 0,
    show_in_file: false,
  }),
  line({
    hostess_id: 907,
    hostess_name: 'בתיה כץ',
    id_number: '301234567',
    hours: 2.25,
    rate: 40,
    travel: 0,
    line_total: 90,
    bank_account: null,
  }),
])

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
  'בלי תאריך משמרת (שורה ישנה)': payload([line({ event_date: null })]),
  'סיכום לפי דיילת: שלוש דיילות, כמה משמרות, פיצוי, אפס, בלי בנק': SUMMARY_PAYLOAD,
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
      summarySheet: doc.summarySheet,
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
  })

  it('ת"ז עם אפס מוביל נשמרת כמחרוזת בגיליון (F12: עמודה ראשונה)', () => {
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

describe('F12 — מבנה הקובץ לרו"ח (שעות ורכיבים, בלי סה"כ ₪)', () => {
  const bold = (value) => ({ value, type: String, fontWeight: 'bold' })
  const text = (value) => ({ value, type: String })
  const dash = { value: '—', type: String, align: 'center' }
  const money = (value) => ({ value, type: Number, format: '#,##0.00' })
  const hours = (value) => ({ value, type: Number, format: '0.00' })

  it('כותרות העמודות לפי הסדר — בלי עמודת סה"כ', () => {
    const doc = edgeBuild(VALID['שורה אחת מלאה'], { generatedAt: GENERATED_AT })
    expect(doc.sheet[4]).toEqual(
      ['ת"ז', 'שם', 'פרטי-בנק', 'תאריך', 'תעריף', 'שעות', 'בונוס', 'נסיעות'].map(bold),
    )
  })

  it('הגיליון המלא של המטען המעורב: תאריך לכל שורה, פיצוי מסומן בתאריך ועם —, שורת אפס מושמטת, סה"כ שעות בלבד', () => {
    const doc = edgeBuild(VALID['מעורב: שלוש דיילות, פיצוי, אפס, בלי בנק'], {
      generatedAt: GENERATED_AT,
    })
    expect(doc.sheet.slice(5)).toEqual([
      [
        text('203456789'),
        text('אפרת דהן'),
        text('הפועלים 601-2047199'),
        text('03/08/2026'),
        money(50),
        hours(5),
        money(0),
        money(22.6),
      ],
      [
        text('000000018'),
        text('נועה'),
        text('הפועלים 601-2047199'),
        text('03/08/2026'),
        money(50),
        hours(5),
        money(50),
        money(22.6),
      ],
      [
        text('203456789'),
        text('אפרת דהן'),
        text('הפועלים 601-2047199'),
        // הכרעת הסגן 14/10: שורת פיצוי ביטול מסומנת בתא התאריך, כדי שרו"ח יבחין בה (שעות נוספות).
        text('03/08/2026 (פיצוי ביטול)'),
        money(50),
        hours(5),
        dash,
        dash,
      ],
      [
        text('203456789'),
        text('אפרת דהן'),
        dash,
        text('03/08/2026'),
        money(50),
        hours(5),
        money(0),
        money(22.6),
      ],
      [bold('סה"כ שעות'), null, null, null, null, { ...hours(20), fontWeight: 'bold' }, null, null],
    ])
  })

  it('סה"כ השעות סוכם במאיות (בלי שגיאת נקודה צפה) ומשמיט שורות שאינן בקובץ', () => {
    const doc = edgeBuild(
      payload([
        line({ hours: 0.1, line_total: 27.6 }),
        line({ hours: 0.2, line_total: 32.6 }),
        line({ hours: 4, travel: null, line_total: 0, show_in_file: false }),
      ]),
      { generatedAt: GENERATED_AT },
    )
    expect(doc.totals.hoursTotal).toBe(0.3)
    expect(doc.sheet.at(-1)[5].value).toBe(0.3)
  })

  it('אין בגיליון שום תא של סכום-שורה או סה"כ ₪', () => {
    const doc = edgeBuild(VALID['בונוס ונסיעות אמיתיים'], { generatedAt: GENERATED_AT })
    const values = doc.sheet
      .flat()
      .filter(Boolean)
      .map((cell) => cell.value)
    expect(values).not.toContain(372.6)
    expect(values).not.toContain('סה"כ')
  })

  it('ההצלבה הפנימית נשארת: סכום שורות שונה מ-total_amount ⇒ SALARY_TOTAL_MISMATCH', () => {
    expect(
      run(edgeBuild, payload([line()], { total_amount: 1 }), { generatedAt: GENERATED_AT }),
    ).toEqual({
      code: 'SALARY_TOTAL_MISMATCH',
    })
  })

  it.each([
    ['null', null],
    ['פורמט אחר', '03/08/2026'],
    ['חותמת-זמן', '2026-08-03T10:00:00Z'],
  ])('תאריך חסר/לא תקין (%s) ⇒ "—" בתא, זהה לדפדפן', (_name, value) => {
    const input = payload([line({ event_date: value })])
    const doc = edgeBuild(input, { generatedAt: GENERATED_AT })
    expect(doc.sheet[5][3].value).toBe('—')
    expect(run(edgeBuild, input, { generatedAt: GENERATED_AT })).toEqual(
      run(browserBuild, input, { generatedAt: GENERATED_AT }),
    )
  })
})

describe('גיליון 2 — "סיכום לפי דיילת" (כרטיס תיקונים 14/10)', () => {
  const bold = (value) => ({ value, type: String, fontWeight: 'bold' })
  const text = (value) => ({ value, type: String })
  const dash = { value: '—', type: String, align: 'center' }
  const count = (value) => ({ value, type: Number })
  const hours = (value) => ({ value, type: Number, format: '0.00' })

  it('תא-תא: כותרת גיליון 1, עמודות, דיילת לשורה לפי שם, בלי שורות אפס, ושורת סה"כ', () => {
    const doc = edgeBuild(SUMMARY_PAYLOAD, { generatedAt: GENERATED_AT })
    expect(doc.summarySheet).toEqual([
      [bold('דוח שכר דיילות — אוגוסט 2026')],
      [null],
      ['ת"ז', 'שם', 'פרטי-בנק', 'משמרות', 'סה"כ שעות'].map(bold),
      [text('203456789'), text('אפרת דהן'), text('הפועלים 601-2047199'), count(2), hours(9)],
      [text('301234567'), text('בתיה כץ'), dash, count(1), hours(2.25)],
      [text('000000018'), text('נועה לוי'), text('הפועלים 601-2047199'), count(1), hours(6)],
      [
        bold('סה"כ'),
        null,
        null,
        { ...count(4), fontWeight: 'bold' },
        { ...hours(17.25), fontWeight: 'bold' },
      ],
    ])
    // הסיכום שווה לגיליון 1: אותן משמרות ואותו סה"כ שעות.
    expect(doc.totals.hoursTotal).toBe(17.25)
    expect(doc.totals.fileLineCount).toBe(4)
  })

  it('זהה לדפדפן בכל המטענים התקינים, כולל דוח השלמה', () => {
    const supplement = {
      ...SUMMARY_PAYLOAD,
      report_id: 41,
      kind: 'supplement',
      original_report_id: 15,
      supplement_seq: 1,
    }
    const edge = edgeBuild(supplement, { generatedAt: GENERATED_AT })
    expect(edge.summarySheet[0]).toEqual([bold('דוח שכר דיילות — אוגוסט 2026 — השלמה 1')])
    expect(edge.summarySheet.slice(1)).toEqual(
      edgeBuild(SUMMARY_PAYLOAD, { generatedAt: GENERATED_AT }).summarySheet.slice(1),
    )
  })

  it('אין בגיליון 2 שום סכום ₪', () => {
    const doc = edgeBuild(SUMMARY_PAYLOAD, { generatedAt: GENERATED_AT })
    const values = doc.summarySheet
      .flat()
      .filter(Boolean)
      .map((cell) => cell.value)
    for (const amount of [270, 272.6, 200, 90, 832.6]) expect(values).not.toContain(amount)
    expect(doc.summarySheet.flat().some((cell) => cell?.format === '#,##0.00')).toBe(false)
  })

  it('רשימה ריקה ⇒ כותרות ושורת סה"כ אפס', () => {
    const doc = edgeBuild(VALID['רשימה ריקה'], { generatedAt: GENERATED_AT })
    expect(doc.summarySheet.slice(3)).toEqual([
      [
        bold('סה"כ'),
        null,
        null,
        { ...count(0), fontWeight: 'bold' },
        { ...hours(0), fontWeight: 'bold' },
      ],
    ])
  })
})
