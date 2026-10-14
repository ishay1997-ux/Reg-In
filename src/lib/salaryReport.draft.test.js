// בדיקות הטיוטה והשחזור של `src/lib/salaryReport.js` (דוח השכר החדש, 13/10/2026).
// 🔑 המספרים מוקלדים ולא מחושבים מהקוד: 292.60 (6 שעות × 45 + 22.60 נסיעות) + 160.00 (פיצוי)
// = 452.60. הטיוטה והשחזור לא מחשבים שכר — רק מעצבים ומצליבים מול סכום השרת.
// הבונה הרגיל לא נבדק כאן ולא שונה; בדיקותיו ב-`salaryReport.test.js` נשארו כמו שהן.

import { describe, expect, it } from 'vitest'
import readXlsxFile from 'read-excel-file/node'
import {
  BANK_NOT_STORED,
  NOT_APPLICABLE,
  buildSalaryReportDraftDocument,
  buildSalaryReportReconstructionDocument,
  salaryReportDraftFileName,
  salaryReportReconstructionFileName,
  writeSalaryReportXlsx,
} from '@/lib/salaryReport'
import {
  compensationLine,
  frozenLine,
  makePreview,
  previewLine,
  reportDetail,
  reportItem,
} from '@/modules/08_finance/payroll/testFixtures'

// 13/10/2026 09:30Z = 12:30 שעון ישראל (שעון קיץ, +3).
const CAPTURED_TEXT = '13/10/2026 12:30'

async function readBack(doc) {
  const blob = await writeSalaryReportXlsx(doc)
  return readXlsxFile(Buffer.from(await blob.arrayBuffer()))
}

describe('buildSalaryReportDraftDocument — טיוטה מהתצוגה המקדימה', () => {
  it('כותרת "טיוטה — לא הופק ולא נשלח", "מצב | טיוטה", "נלכד בתאריך" ובלי "קוד הפקה"', () => {
    const doc = buildSalaryReportDraftDocument(makePreview())
    expect(doc.sheet[0][0].value).toBe('טיוטה — לא הופק ולא נשלח — דוח שכר דיילות — יולי 2026')
    expect(doc.sheet[1].map((c) => c.value)).toEqual(['מצב', 'טיוטה'])
    expect(doc.sheet[2].map((c) => c.value)).toEqual(['נלכד בתאריך', CAPTURED_TEXT])
    expect(doc.sheet.flat().some((c) => c?.value === 'קוד הפקה')).toBe(false)
    expect(doc.fileName).toBe('07_2026_Payroll_Report_DRAFT.xlsx')
    expect(doc.totals.total).toBe(452.6)
  })

  it('שורת פיצוי: בונוס ונסיעות "—"; ת"ז נשמרת כטקסט', () => {
    const doc = buildSalaryReportDraftDocument(makePreview())
    const comp = doc.sheet.find((row) => row?.[0]?.value === '204455667')
    expect(comp[6].value).toBe(NOT_APPLICABLE)
    expect(comp[7].value).toBe(NOT_APPLICABLE)
    expect(comp[3].value).toBe('12/07/2026')
    const work = doc.sheet.find((row) => row?.[0]?.value === '012345678')
    expect(work[0].type).toBe(String)
  })

  it('השלמה: שם-קובץ Supplement_DRAFT, "השלמה N" בכותרת ושורת "דוח מקורי"', () => {
    const doc = buildSalaryReportDraftDocument(
      makePreview({ kind: 'supplement', original_report_id: 15, supplement_seq_next: 1 }),
    )
    expect(doc.fileName).toBe('07_2026_Payroll_Report_Supplement_DRAFT.xlsx')
    expect(doc.sheet[0][0].value).toContain('— השלמה 1')
    expect(doc.sheet[3].map((c) => c.value)).toEqual(['דוח מקורי', '15'])
  })

  it('סכום שאינו תואם לשרת ⇒ אין טיוטה', () => {
    const preview = makePreview()
    preview.totals.total_amount = 452.61
    expect(() => buildSalaryReportDraftDocument(preview)).toThrow(
      expect.objectContaining({ code: 'SALARY_TOTAL_MISMATCH' }),
    )
  })

  it('תצוגה מקדימה בלי נתוני-אימות ⇒ אין טיוטה (לא מקלים בשקט)', () => {
    const preview = makePreview()
    delete preview.totals.total_amount
    expect(() => buildSalaryReportDraftDocument(preview)).toThrow(
      expect.objectContaining({ code: 'SALARY_RECONCILIATION_FIELDS_MISSING' }),
    )
  })

  it('שורה חסומה (בלי ת"ז) ⇒ הטיוטה לא נבנית', () => {
    const preview = makePreview({ lines: [previewLine({ id_number: '' })] })
    expect(() => buildSalaryReportDraftDocument(preview)).toThrow(
      expect.objectContaining({ code: 'SALARY_LINE_IDENTITY_MISSING' }),
    )
  })

  it('תצוגה מקדימה שנכשלה (ok:false) ⇒ אין טיוטה', () => {
    expect(() => buildSalaryReportDraftDocument({ ok: false })).toThrow(
      expect.objectContaining({ code: 'SALARY_DRAFT_NOT_OK' }),
    )
  })

  it('שורת אפס נשארת בספירה ולא בגוף הקובץ', () => {
    const zero = previewLine({
      hostess_id: 900003,
      hostess_name: 'שירה בר',
      id_number: '305566778',
      hours: 0,
      hours_raw: 0,
      travel: 0,
      line_total: 0,
      show_in_file: false,
    })
    const doc = buildSalaryReportDraftDocument(
      makePreview({ lines: [previewLine(), compensationLine(), zero] }),
    )
    expect(doc.totals.lineCount).toBe(3)
    expect(doc.totals.fileLineCount).toBe(2)
    expect(doc.sheet.some((row) => row?.[0]?.value === '305566778')).toBe(false)
  })

  it('הלוך-ושוב דרך xlsx אמיתי: כותרת, 2 שורות גוף, "סה"כ שעות" 10, ת"ז עם 0 מוביל', async () => {
    const rows = await readBack(buildSalaryReportDraftDocument(makePreview()))
    expect(rows[0][0]).toBe('טיוטה — לא הופק ולא נשלח — דוח שכר דיילות — יולי 2026')
    const header = rows.findIndex((row) => row[0] === 'ת"ז')
    const body = rows.slice(header + 1, rows.length - 1)
    expect(body).toHaveLength(2)
    expect(body[0][0]).toBe('012345678')
    expect(rows[rows.length - 1][0]).toBe('סה"כ שעות')
    expect(rows[rows.length - 1][5]).toBe(10)
  })

  it('כל השורות נכנסות — גם כשיש יותר מעמוד מסך אחד (אין "ייצוא עמוד")', () => {
    const lines = Array.from({ length: 120 }, (_, i) =>
      previewLine({
        hostess_id: 910000 + i,
        assignment_number: i + 1,
        id_number: String(100000000 + i),
      }),
    )
    const doc = buildSalaryReportDraftDocument(makePreview({ lines }))
    expect(doc.totals.lineCount).toBe(120)
    expect(doc.sheet.filter((row) => /^\d{9}$/.test(String(row?.[0]?.value ?? '')))).toHaveLength(
      120,
    )
  })
})

describe('buildSalaryReportReconstructionDocument — שחזור לדוח בלי קובץ (W4)', () => {
  const report = reportItem({ report_id: 15, period: '2026-08-01', total_amount: 452.6 })
  const lines = [
    frozenLine({ report_id: 15 }),
    frozenLine({
      line_id: 2,
      report_id: 15,
      hostess_name: 'מאיה כהן',
      id_number: '204455667',
      line_basis: 'cancellation_compensation',
      hours: 4,
      rate: 40,
      travel: null,
      line_total: 160,
    }),
  ]
  const at = '2026-10-13T09:30:00.000Z'

  it('כותרת השחזור, "קוד הפקה", "שוחזר בתאריך" ושם-קובץ RECONSTRUCTED', () => {
    const doc = buildSalaryReportReconstructionDocument(report, lines, { reconstructedAt: at })
    expect(doc.sheet[0][0].value).toBe(
      'שחזור — הקובץ המקורי אינו זמין — דוח שכר דיילות — אוגוסט 2026',
    )
    expect(doc.sheet[1].map((c) => c.value)).toEqual(['קוד הפקה', '15'])
    expect(doc.sheet[2].map((c) => c.value)).toEqual(['שוחזר בתאריך', CAPTURED_TEXT])
    expect(doc.fileName).toBe('08_2026_Payroll_Report_RECONSTRUCTED.xlsx')
  })

  it('עמודת הבנק בכל שורה: "לא נשמר בנתוני הדוח" — לא פרטי בנק נוכחיים', () => {
    const doc = buildSalaryReportReconstructionDocument(report, lines, { reconstructedAt: at })
    const body = doc.sheet.filter((row) => /^\d{9}$/.test(String(row?.[0]?.value ?? '')))
    expect(body).toHaveLength(2)
    for (const row of body) expect(row[2].value).toBe(BANK_NOT_STORED)
    expect(BANK_NOT_STORED).toBe('לא נשמר בנתוני הדוח')
  })

  it('בשורה קפואה NULL בבונוס של שורת עבודה = 0, ובשורת פיצוי = —', () => {
    const doc = buildSalaryReportReconstructionDocument(report, lines, { reconstructedAt: at })
    const work = doc.sheet.find((row) => row?.[0]?.value === '012345678')
    const comp = doc.sheet.find((row) => row?.[0]?.value === '204455667')
    expect(work[6].value).toBe(0)
    expect(comp[6].value).toBe(NOT_APPLICABLE)
  })

  it('סכום השורות שונה מסכום הדוח ⇒ אין שחזור', () => {
    expect(() =>
      buildSalaryReportReconstructionDocument({ ...report, total_amount: 999 }, lines, {
        reconstructedAt: at,
      }),
    ).toThrow(expect.objectContaining({ code: 'SALARY_TOTAL_MISMATCH' }))
  })

  // תיקון בודק 2 (14/10): השחזור נכשל תמיד כי התשובה האמיתית עוטפת את הדוח ב-`report`.
  // כאן נבנה השחזור בדיוק מצורת השרת (`detail.report` + `detail.lines`), כפי שהמסך קורא לו.
  it('נבנה מצורת השרת האמיתית — detail.report (עם line_count) ו-detail.lines', () => {
    const detail = reportDetail({ report: { report_id: 15, period: '2026-08-01' } })
    // `line_count` ברמה העליונה של התשובה, לא בתוך `report` — כמו שהמסך מרכיב (ReportDetail).
    expect(detail.report.line_count).toBeUndefined()
    const doc = buildSalaryReportReconstructionDocument(
      { ...detail.report, line_count: detail.line_count },
      detail.lines,
      { reconstructedAt: at },
    )
    expect(doc.fileName).toBe('08_2026_Payroll_Report_RECONSTRUCTED.xlsx')
    expect(doc.totals.lineCount).toBe(2)
  })

  it('בלי מועד שחזור ⇒ אין קובץ', () => {
    expect(() => buildSalaryReportReconstructionDocument(report, lines, {})).toThrow(
      expect.objectContaining({ code: 'SALARY_RECONSTRUCTION_TIMESTAMP_MISSING' }),
    )
  })

  it('הלוך-ושוב דרך xlsx אמיתי: הכותרת והבנק נקראים חזרה', async () => {
    const rows = await readBack(
      buildSalaryReportReconstructionDocument(report, lines, { reconstructedAt: at }),
    )
    expect(rows[0][0]).toContain('שחזור — הקובץ המקורי אינו זמין')
    const header = rows.findIndex((row) => row[0] === 'ת"ז')
    expect(rows[header + 1][2]).toBe('לא נשמר בנתוני הדוח')
    expect(rows[rows.length - 1][5]).toBe(10)
  })

  it('שמות-קבצים: השלמה בטיוטה בלי מספר, בשחזור עם מספר', () => {
    expect(salaryReportDraftFileName('2026-08-01', 'supplement')).toBe(
      '08_2026_Payroll_Report_Supplement_DRAFT.xlsx',
    )
    expect(salaryReportReconstructionFileName('2026-08-01', 'supplement', 2)).toBe(
      '08_2026_Payroll_Report_Supplement_2_RECONSTRUCTED.xlsx',
    )
  })
})
