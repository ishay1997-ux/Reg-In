// מסמך דוח-השכר הסופי — העתק טהור של `buildSalaryReportDocument` (`src/lib/salaryReport.js`)
// ועוד הרחבת דוח-ההשלמה (חוזה השכר §3.1 "Filenames", D9).
//
// 🔴 **למה הקובץ נבנה כאן ולא בדפדפן:** הקובץ שהולך לרו"ח חייב לצאת מתמונת-המצב שהמסד נעל
// (`payroll_operation_snapshot`), ולא ממה שהדפדפן החזיק ביד. הטיוטה נשארת בדפדפן ואינה נשמרת.
// 🔴 **ולמה העתק ולא ייבוא:** פונקציית-שרת אינה יכולה לייבא מ-`src/`. כדי שהעתק לא יסטה בשקט,
// `document.parity.test.js` בונה את אותם עשרה מטענים בשני הצדדים ומשווה את הגיליון תא-תא, את שם
// הקובץ, את הסכומים, את רשימת חסרי-הבנק ואת קודי-השגיאה. שינוי ב-`salaryReport.js` בלי שינוי
// כאן — הבדיקה נופלת.
//
// ⚠️ **מה שאינו מחושב כאן — כמו במקור:** אף סכום-שורה לא מחושב מחדש. המסד חישב, וכאן רק
// מעצבים ומצליבים את סכום השורות מול `total_amount` ואת מספרן מול `line_count`.

import { formatTimestampFull } from './dates.ts'
import { toAgorot, toFiniteNumber, toShekels } from './money.ts'

export const SALARY_LINE_BASIS = {
  ACTUAL: 'actual',
  CANCELLATION_COMPENSATION: 'cancellation_compensation',
} as const

// ✏️ F12 (הכרעת-ישי 14.10 00:30, *"לפי מה שמקובל בישראל תברר ותחליט"*): הקובץ לרו"ח הוא
// קובץ **שעות ורכיבים**, לא קובץ תשלום. בישראל מחלקת השכר / רו"ח מחשבים ברוטו (כולל שעות
// נוספות 125%/150%) — ולכן אין עמודת סה"כ ₪, ויש עמודת **תאריך** לכל משמרת, כדי שאפשר יהיה
// לחשב שעות נוספות לפי יום. הסכום עדיין מחושב במסד ומוצלב כאן לפני כתיבת הקובץ.
export const SALARY_REPORT_COLUMNS = [
  'ת"ז',
  'שם',
  'פרטי-בנק',
  'תאריך',
  'תעריף',
  'שעות',
  'בונוס',
  'נסיעות',
]
export const HOURS_TOTAL_LABEL = 'סה"כ שעות'
const HOURS_COLUMN_INDEX = SALARY_REPORT_COLUMNS.indexOf('שעות')

export const NOT_APPLICABLE = '—'

const BASIS_LABELS: Record<string, string> = {
  actual: 'שעות בפועל',
  cancellation_compensation: 'פיצוי-ביטול',
}

const HOURS_LABELS: Record<string, string> = {
  actual: 'בפועל',
  cancellation_compensation: 'מתוכנן',
}

const HEBREW_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
]

const MONEY_FORMAT = '#,##0.00'
const HOURS_FORMAT = '0.00'

export const COLUMN_WIDTHS = [
  { width: 14 },
  { width: 22 },
  { width: 26 },
  { width: 12 },
  { width: 10 },
  { width: 10 },
  { width: 12 },
  { width: 12 },
]

export class SalaryReportError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'SalaryReportError'
    this.code = code
  }
}

type Row = Record<string, unknown>

export interface SheetCell {
  value: string | number
  type: StringConstructor | NumberConstructor
  format?: string
  fontWeight?: 'bold'
  align?: 'center'
}

export type SheetRow = Array<SheetCell | null>

export interface SalaryLine {
  hostessId: unknown
  hostessName: string
  idNumber: string
  sourceProjectId: unknown
  lineBasis: string
  basisLabel: string
  hoursLabel: string
  hours: number
  rate: number
  bonus: number | null
  travel: number | null
  lineTotal: number
  bankDetails: string | null
  eventDate: string | null
  showInFile: boolean
}

export interface SalaryTotals {
  lineCount: number
  fileLineCount: number
  total: number
  bonusTotal: number
  travelTotal: number
  hoursTotal: number
}

export interface SalaryDocument {
  reportId: number
  period: unknown
  periodLabel: string
  fileName: string
  lines: SalaryLine[]
  totals: SalaryTotals
  linesMissingBankDetails: string[]
  sheet: SheetRow[]
  kind: 'regular' | 'supplement'
  supplementSeq: number | null
  originalReportId: number | null
}

function textOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text === '' ? null : text
}

function requireFiniteNumber(value: unknown, code: string, message: string): number {
  const number = toFiniteNumber(value)
  if (number === null) throw new SalaryReportError(code, message)
  return number
}

function parsePeriod(period: unknown): { year: number; month: number } {
  const text = textOrNull(period) ?? ''
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(text)
  const month = match ? Number(match[2]) : 0
  if (!match || month < 1 || month > 12) {
    throw new SalaryReportError(
      'SALARY_PERIOD_INVALID',
      'תקופת הדוח אינה תקינה — לא ניתן להרכיב את קובץ השכר.',
    )
  }
  return { year: Number(match[1]), month }
}

export function salaryPeriodLabel(period: unknown): string {
  const { year, month } = parsePeriod(period)
  return `${HEBREW_MONTHS[month - 1]} ${year}`
}

export function salaryReportFileName(period: unknown): string {
  const { year, month } = parsePeriod(period)
  return `${String(month).padStart(2, '0')}_${year}_Payroll_Report.xlsx`
}

// `MM_YYYY_Payroll_Report_Supplement_<n>.xlsx` (חוזה §3.1). נגזר מהשם הרגיל כדי ששני השמות
// לא יסטו זה מזה בפורמט החודש.
export function salarySupplementFileName(period: unknown, supplementSeq: number): string {
  return salaryReportFileName(period).replace(/\.xlsx$/, `_Supplement_${supplementSeq}.xlsx`)
}

// "אוגוסט 2026 — השלמה 1". משמש בכותרת הקובץ, בנושא המייל ובגוף המייל — מקור אחד לשלושתם.
export function reportPeriodLabel(period: unknown, supplementSeq: number | null): string {
  const label = salaryPeriodLabel(period)
  return supplementSeq ? `${label} — השלמה ${supplementSeq}` : label
}

// תאריך האירוע `YYYY-MM-DD` ⇒ `DD/MM/YYYY` (כמו `formatDate` ב-`src/lib/dates.js`) — כמחרוזת, כדי
// שאקסל לא יפרש אותו לפי הגדרות-אזור של המחשב הפותח. כמו בדפדפן: השורה שומרת את הערך הגולמי
// (`eventDate`), והתא מציג `—` כשהוא חסר או פגום. (שורות ישנות קפואות אינן נושאות תאריך; בהפקה
// הסופית `pipeline.ts` דורש תאריך תקין לכל שורה מוצגת.)
export function displayDate(value: unknown): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(textOrNull(value) ?? '')
  return match ? `${match[3]}/${match[2]}/${match[1]}` : null
}

function bankDetailsOf(row: Row): string | null {
  const name = textOrNull(row?.bank_name)
  const branch = textOrNull(row?.bank_branch)
  const account = textOrNull(row?.bank_account)
  if (!account) return null
  const branchAndAccount = branch ? `${branch}-${account}` : account
  return name ? `${name} ${branchAndAccount}` : branchAndAccount
}

function shapeLine(row: Row, index: number): SalaryLine {
  const position = index + 1
  const lineBasis = textOrNull(row?.line_basis)
  if (lineBasis !== 'actual' && lineBasis !== 'cancellation_compensation') {
    throw new SalaryReportError(
      'SALARY_LINE_BASIS_UNKNOWN',
      `שורת-שכר ${position} הגיעה עם בסיס-חישוב לא מוכר — לא ניתן להרכיב את הקובץ.`,
    )
  }

  const hostessName = textOrNull(row?.hostess_name)
  const idNumber = textOrNull(row?.id_number)
  if (!hostessName || !idNumber) {
    throw new SalaryReportError(
      'SALARY_LINE_IDENTITY_MISSING',
      `שורת-שכר ${position} חסרה שם או ת"ז — לא ניתן לשלוח דוח בלי זיהוי מלא.`,
    )
  }

  const isActual = lineBasis === SALARY_LINE_BASIS.ACTUAL
  const bonusRaw = toFiniteNumber(row?.bonus)
  const travelRaw = toFiniteNumber(row?.travel)
  if (!isActual && ((bonusRaw ?? 0) !== 0 || (travelRaw ?? 0) !== 0)) {
    throw new SalaryReportError(
      'SALARY_COMPENSATION_LINE_HAS_EXTRAS',
      `שורת פיצוי-ביטול ${position} הגיעה עם בונוס או נסיעות, וזה אינו אפשרי בשורת-פיצוי — הדוח לא הורכב.`,
    )
  }

  return {
    hostessId: row?.hostess_id ?? null,
    hostessName,
    idNumber,
    sourceProjectId: row?.source_project_id ?? null,
    lineBasis,
    basisLabel: BASIS_LABELS[lineBasis],
    hoursLabel: HOURS_LABELS[lineBasis],
    hours: requireFiniteNumber(
      row?.hours,
      'SALARY_LINE_HOURS_MISSING',
      `שורת-שכר ${position} (${hostessName}) חסרה שעות.`,
    ),
    rate: requireFiniteNumber(
      row?.rate,
      'SALARY_LINE_RATE_MISSING',
      `שורת-שכר ${position} (${hostessName}) חסרה תעריף.`,
    ),
    bonus: isActual ? (bonusRaw ?? 0) : null,
    travel: isActual ? (travelRaw ?? 0) : null,
    lineTotal: requireFiniteNumber(
      row?.line_total,
      'SALARY_LINE_TOTAL_MISSING',
      `שורת-שכר ${position} (${hostessName}) חסרה סכום.`,
    ),
    bankDetails: bankDetailsOf(row),
    eventDate: textOrNull(row?.event_date),
    showInFile:
      typeof row?.show_in_file === 'boolean'
        ? row.show_in_file
        : toFiniteNumber(row?.line_total) !== 0,
  }
}

export function buildSalaryReportLines(payload: Row): SalaryLine[] {
  const rows = payload?.lines
  if (!Array.isArray(rows)) {
    throw new SalaryReportError(
      'SALARY_REPORT_SHAPE',
      'תשובת הפקת דוח-השכר אינה תקינה — חסרה רשימת השורות.',
    )
  }
  return rows.map((row, index) => shapeLine(row as Row, index))
}

export function salaryReportTotals(lines: SalaryLine[]): SalaryTotals {
  const totals = lines.reduce(
    (acc, line) => ({
      totalAgorot: acc.totalAgorot + toAgorot(line.lineTotal),
      visibleAgorot: acc.visibleAgorot + (line.showInFile ? toAgorot(line.lineTotal) : 0),
      bonusAgorot: acc.bonusAgorot + toAgorot(line.bonus ?? 0),
      travelAgorot: acc.travelAgorot + toAgorot(line.travel ?? 0),
      // שורת הסיכום סוכמת את מה **שמופיע בקובץ** — שורות אפס מושמטות (N-4), ולכן גם השעות שלהן.
      visibleHundredths: acc.visibleHundredths + (line.showInFile ? toAgorot(line.hours) : 0),
    }),
    { totalAgorot: 0, visibleAgorot: 0, bonusAgorot: 0, travelAgorot: 0, visibleHundredths: 0 },
  )

  if (totals.visibleAgorot !== totals.totalAgorot) {
    throw new SalaryReportError(
      'SALARY_HIDDEN_LINE_HAS_AMOUNT',
      'שורה שאינה מוצגת בקובץ נושאת סכום — הדוח לא הורכב.',
    )
  }

  return {
    lineCount: lines.length,
    fileLineCount: lines.filter((line) => line.showInFile).length,
    total: toShekels(totals.totalAgorot),
    bonusTotal: toShekels(totals.bonusAgorot),
    travelTotal: toShekels(totals.travelAgorot),
    hoursTotal: toShekels(totals.visibleHundredths),
  }
}

const boldCell = (value: string): SheetCell => ({ value, type: String, fontWeight: 'bold' })
const textCell = (value: string): SheetCell => ({ value, type: String })
const dashCell = (): SheetCell => ({ value: NOT_APPLICABLE, type: String, align: 'center' })
const moneyCell = (value: number, bold = false): SheetCell => ({
  value,
  type: Number,
  format: MONEY_FORMAT,
  ...(bold ? { fontWeight: 'bold' as const } : {}),
})

// ת"ז, פרטי-בנק וקוד-הפקה כ-`String`: אפס מוביל בת"ז נעלם בשקט ברגע שאקסל קורא אותה כמספר.
function sheetLineRow(line: SalaryLine): SheetRow {
  return [
    textCell(line.idNumber),
    textCell(line.hostessName),
    line.bankDetails ? textCell(line.bankDetails) : dashCell(),
    line.eventDate ? textCell(displayDate(line.eventDate) ?? NOT_APPLICABLE) : dashCell(),
    moneyCell(line.rate),
    { value: line.hours, type: Number, format: HOURS_FORMAT },
    line.bonus === null ? dashCell() : moneyCell(line.bonus),
    line.travel === null ? dashCell() : moneyCell(line.travel),
  ]
}

// שורת הסיכום (F12): `סה"כ שעות` — הסכום מתחת לעמודת השעות בלבד, שאר התאים ריקים. אין סה"כ ₪.
function sheetTotalRow(totals: SalaryTotals): SheetRow {
  const row: SheetRow = SALARY_REPORT_COLUMNS.map(() => null)
  row[0] = boldCell(HOURS_TOTAL_LABEL)
  row[HOURS_COLUMN_INDEX] = {
    value: totals.hoursTotal,
    type: Number,
    format: HOURS_FORMAT,
    fontWeight: 'bold',
  }
  return row
}

interface SheetInput {
  reportId: number
  titleLabel: string
  generatedAt: unknown
  lines: SalaryLine[]
  totals: SalaryTotals
  originalReportId: number | null
}

// דוח-השלמה מוסיף שורת `דוח מקורי | <מזהה>` מיד אחרי `הופק בתאריך` (חוזה §3.1). דוח רגיל זהה
// לחלוטין למקור — זה מה שבדיקת-השוויון נועלת.
function buildSalaryReportSheet(input: SheetInput): SheetRow[] {
  const stamp = formatTimestampFull(input.generatedAt)
  if (!stamp) {
    throw new SalaryReportError(
      'SALARY_REPORT_TIMESTAMP_MISSING',
      'חסרה חותמת-זמן להפקת הדוח — הקובץ לא הורכב.',
    )
  }

  const header: SheetRow[] = [
    [boldCell(`דוח שכר דיילות — ${input.titleLabel}`)],
    [boldCell('קוד הפקה'), textCell(String(input.reportId))],
    [boldCell('הופק בתאריך'), textCell(stamp)],
  ]
  if (input.originalReportId !== null) {
    header.push([boldCell('דוח מקורי'), textCell(String(input.originalReportId))])
  }

  return [
    ...header,
    [null],
    SALARY_REPORT_COLUMNS.map(boldCell),
    ...input.lines.filter((line) => line.showInFile).map(sheetLineRow),
    sheetTotalRow(input.totals),
  ]
}

const RECONCILIATION_FIELDS = ['total_amount', 'line_count']

// זהות דוח-ההשלמה מגיעה מתמונת-המצב (`kind`, `supplement_seq`, `original_report_id`). השלמה בלי
// מספר-סידורי או בלי מקור היא מסמך שאי-אפשר לזהות מול הדוח המקורי — נופלים ולא מנחשים.
function supplementIdentity(payload: Row): {
  kind: 'regular' | 'supplement'
  supplementSeq: number | null
  originalReportId: number | null
} {
  if (payload.kind === undefined || payload.kind === null || payload.kind === 'regular') {
    return { kind: 'regular', supplementSeq: null, originalReportId: null }
  }
  const seq = payload.supplement_seq
  const original = payload.original_report_id
  if (
    payload.kind !== 'supplement' ||
    !Number.isInteger(seq) ||
    (seq as number) < 1 ||
    !Number.isInteger(original)
  ) {
    throw new SalaryReportError(
      'SALARY_SUPPLEMENT_IDENTITY_MISSING',
      'זהות דוח ההשלמה חסרה או אינה תקינה — הקובץ לא הורכב.',
    )
  }
  return { kind: 'supplement', supplementSeq: seq as number, originalReportId: original as number }
}

export function buildSalaryReportDocument(
  payload: Row,
  { generatedAt }: { generatedAt?: unknown } = {},
): SalaryDocument {
  if (!payload || payload.ok !== true) {
    throw new SalaryReportError('SALARY_REPORT_NOT_OK', 'הפקת דוח-השכר לא הושלמה — הקובץ לא הורכב.')
  }

  const reportId = payload.report_id
  if (!Number.isInteger(reportId)) {
    throw new SalaryReportError('SALARY_REPORT_ID_MISSING', 'תשובת ההפקה חסרה מזהה-דוח.')
  }

  const lines = buildSalaryReportLines(payload)
  const totals = salaryReportTotals(lines)

  const missingReconciliation = RECONCILIATION_FIELDS.filter(
    (field) => !Object.hasOwn(payload, field) || payload[field] === undefined,
  )
  if (missingReconciliation.length > 0) {
    throw new SalaryReportError(
      'SALARY_RECONCILIATION_FIELDS_MISSING',
      'תשובת ההפקה חסרה את נתוני-האימות של הדוח — הדוח לא הורכב.',
    )
  }

  const reportedTotal = toFiniteNumber(payload.total_amount)
  if (reportedTotal !== null && toAgorot(reportedTotal) !== toAgorot(totals.total)) {
    throw new SalaryReportError(
      'SALARY_TOTAL_MISMATCH',
      'סכום שורות הדוח אינו תואם את הסכום שנרשם במסד — הדוח לא הורכב.',
    )
  }

  const reportedCount = toFiniteNumber(payload.line_count)
  if (reportedCount !== null && reportedCount !== totals.lineCount) {
    throw new SalaryReportError(
      'SALARY_LINE_COUNT_MISMATCH',
      'מספר שורות הדוח אינו תואם את מה שנרשם במסד — הדוח לא הורכב.',
    )
  }

  const identity = supplementIdentity(payload)
  const periodLabel = salaryPeriodLabel(payload.period)
  const fileName =
    identity.supplementSeq === null
      ? salaryReportFileName(payload.period)
      : salarySupplementFileName(payload.period, identity.supplementSeq)

  return {
    reportId: reportId as number,
    period: payload.period,
    periodLabel,
    fileName,
    lines,
    totals,
    linesMissingBankDetails: lines
      .filter((line) => line.showInFile && !line.bankDetails)
      .map((line) => line.hostessName),
    sheet: buildSalaryReportSheet({
      reportId: reportId as number,
      titleLabel: reportPeriodLabel(payload.period, identity.supplementSeq),
      generatedAt,
      lines,
      totals,
      originalReportId: identity.originalReportId,
    }),
    ...identity,
  }
}
