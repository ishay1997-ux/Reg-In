// דוח-השכר החודשי (מודול 8 · תהליך P4 · צעד 2.2) — הרכבת המסמך שנשלח לרו"ח.
//
// 🔴 **מה הקובץ הזה איננו: מחשבון שכר שני.** `generate_salary_report` (מיגרציה E3, צעד 1.5)
// היא שאוספת את השורות משני המקורות של ה15, מחשבת כל שורה, חותמת את השיבוצים ומקפיאה את
// ה-snapshot — הכול בטרנזקציה אחת ובתוך DEFINER, כי מנהלת-הכספים חסומה ב-RLS מ'דיילות'
// (R4-F5: קריאת-שיבוצים מצד-לקוח מחזירה `[]` בלי שגיאה). ⇒ כאן **מעצבים ומאמתים** את מה
// שה-RPC כבר החזיר, ולעולם לא מחשבים אותו מחדש. שני מחשבונים לאותו מספר הם בדיוק הכשל
// ש-F16/R1-4 קיימים כדי למנוע, והוא היה עובר את הבדיקות של עצמו.
// *(מדריך-המיקרו §Phase-2, פסקת-הפתיחה: "Phase 2's job is to call, shape and test — not to
// reimplement". צעד 2.2 עצמו נכתב 26/08 — לפני שה-DB היה קיים — ומנסח את המשימה כ"מודל-האיסוף
// כלוגיקה טהורה"; אותו תיקון-היקף שנרשם ל-2.1 ב-§10 חל כאן מילה-במילה.)*
//
// **מה כן נגזר כאן, ואי-אפשר בשום מקום אחר:** קובץ ה-xlsx עצמו (ה4 — פורמט יחיד), שם-הקובץ
// (`<MM>_<YYYY>_Payroll_Report.xlsx`, C5 §5.8.10 + ריכוז-#5), תווית-החודש בעברית, סמנטיקת
// ה-`—` מול `0.00` בשורות-הפיצוי, וסדרת שומרי-"תיפול-ברעש" (R4-F9) שמסרבים להרכיב מסמך
// שמספריו אינם מסתדרים. **המסמך הזה הולך לרו"ח ומשלם לאנשים** — מספר שגוי בו אינו "באג במסך".
//
// 🔴 **הסתירה שנמצאה בבנייה, ולא הוכרעה כאן — שני הצדדים, כלשונם:**
//   ① **המסד שנשלח בפזה 1** כותב `nullif(c.bonus, 0)` / `nullif(c.travel, 0)`, והערת-העמודה
//      אומרת: *"NULL = לא-רלוונטי; המסך מציג '—' ולא 0.00"* — כלומר גם בונוס-אפס **אמיתי**
//      בשורת שעות-בפועל מגיע כ-NULL.
//   ② **המוקאפ המאושר** (`03_salary_report_approved.html`, אושר 26/08 "מאשר את כולם") מצייר
//      את שורת אפרת דהן (מקור-א, בונוס 0) עם "0.00 ש"ח", ו-`screens-approved.md §⑦` מגביל
//      את ה-`—` במפורש ל**שורות-פיצוי-ביטול** בלבד: *"בונוס/נסיעות בשורות-פיצוי-ביטול: '—'
//      ולא 0.00 — נוסחת-ה24 (הפיצוי) אינה כוללת רכיב-בונוס, וה29 קובע במפורש שאין נסיעות
//      למשמרת שבוטלה"*.
//   ⇒ NULL מהמסד הוא **דו-משמעי**, והמנגנון היחיד שמפריד בין "אפס אמיתי" ל"לא-רלוונטי" הוא
//   `line_basis`. לכן ההצגה נגזרת ממנו: שורת-פיצוי ⇒ `—` · שורת-שעות-בפועל ⇒ מספר (NULL⇒0).
//   זה משחזר את הציור המאושר ואינו סותר את ה24/ה29. **הסתירה מדווחת, לא "מתוקנת" בשקט.**
//
// ⚠️ **ומה שבמכוון אינו נבדק כאן: סכום-השורה עצמו.** ה-RPC מחשב
// `round(hours * rate + bonus + travel, 2)` על השעות **הלא-מעוגלות**, ומחזיר `hours` מעוגל
// לשתי ספרות. חישוב-נגד מהערך המוחזר היה נופל באגורה על שעות כמו 4.005 — כלומר שומר שחוסם
// דוח תקין. מה שכן נבדק: **סכום כל השורות מול `total_amount` של המסד** — שני מספרים שמקורם
// באותה טרנזקציה, ולכן חייבים להיות זהים לאגורה.

import { formatTimestampFull } from '@/lib/dates'
import { toAgorot, toFiniteNumber, toShekels } from '@/lib/pricing'
import writeXlsxFile from 'write-excel-file'

// שני המקורות של ה15 — הערכים כפי שה-CHECK `salary_report_lines_line_basis_check` אוכף אותם.
export const SALARY_LINE_BASIS = {
  ACTUAL: 'actual',
  CANCELLATION_COMPENSATION: 'cancellation_compensation',
}

// עמודות-הקובץ, בסדר של א48 (C5 §5.7.5) כפי שצעד 2.2 מונה אותן. ⚠️ **שונה בכוונה מסדר
// טבלת-התצוגה שבמוקאפ** (שם: דיילת · ת"ז · פרטי-בנק · שעות · תעריף · …) — המוקאפ מצייר את
// **מסך התצוגה-המקדימה**, וא48 מגדיר את **הקובץ**. מי שבונה את מסך S3 בפזה 3 מצייר לפי המוקאפ.
export const SALARY_REPORT_COLUMNS = [
  'ת"ז',
  'שם',
  'פרטי-בנק',
  'תעריף',
  'שעות',
  'בונוס',
  'נסיעות',
  'סה"כ',
]

// `—` ולא `0.00`: "לא-רלוונטי" ו"אפס שנמדד" הם שני דברים שונים (§3.7 · ה24/ה29 · S-2).
export const NOT_APPLICABLE = '—'

const BASIS_LABELS = {
  [SALARY_LINE_BASIS.ACTUAL]: 'שעות בפועל',
  [SALARY_LINE_BASIS.CANCELLATION_COMPENSATION]: 'פיצוי-ביטול',
}

// יחידת-השעות בשורה: מקור-א מדווח שעות שנעבדו, מקור-ב שעות שתוכננו (ה24). המוקאפ המאושר
// כותב את שתי המילים מתחת למספר, ולכן הן חלק מהמודל ולא המצאה של מסך.
const HOURS_LABELS = {
  [SALARY_LINE_BASIS.ACTUAL]: 'בפועל',
  [SALARY_LINE_BASIS.CANCELLATION_COMPENSATION]: 'מתוכנן',
}

// שמות-חודשים קשיחים ולא `Intl` — פלט של `Intl` תלוי-ICU ועלול להשתנות בין סביבות; שם-החודש
// כאן נכנס לכותרת מסמך חשבונאי ולשם-גיליון, ושינוי שקט בו הוא שינוי במסמך.
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

// רוחבי-עמודות (בתווים) — קוסמטיקה בלבד: בלעדיהם "פרטי-בנק" ו"שם" נחתכים בפתיחה.
const COLUMN_WIDTHS = [
  { width: 14 },
  { width: 22 },
  { width: 26 },
  { width: 10 },
  { width: 10 },
  { width: 12 },
  { width: 12 },
  { width: 14 },
]

// שגיאה עם `code` — אותה מוסכמה כמו `src/lib/apiError.js` (ה-UI מבחין במקרים ידועים בלי
// שמבנה-השגיאה יזלוג לכל קורא). ההודעה עברית כי היא נאמרת למנהלת-הכספים.
function salaryReportError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function textOrNull(value) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text === '' ? null : text
}

function requireFiniteNumber(value, code, message) {
  const number = toFiniteNumber(value)
  if (number === null) throw salaryReportError(code, message)
  return number
}

// `YYYY-MM-DD` (כפי ש-`generate_salary_report` מחזיר את `period`) או `YYYY-MM`.
// נופל ברעש ולא מחזיר ברירת-מחדל: תקופה שגויה = מסמך שגוי, וחודש-שכר מנוחש הוא תשלום כפול.
function parsePeriod(period) {
  const text = textOrNull(period) ?? ''
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(text)
  const month = match ? Number(match[2]) : 0
  if (!match || month < 1 || month > 12) {
    throw salaryReportError(
      'SALARY_PERIOD_INVALID',
      'תקופת הדוח אינה תקינה — לא ניתן להרכיב את קובץ השכר.',
    )
  }
  return { year: Number(match[1]), month }
}

// "אוגוסט 2026" — כותרת-הקובץ, שם-הגיליון, וההודעה שהמסך מציג.
export function salaryPeriodLabel(period) {
  const { year, month } = parsePeriod(period)
  return `${HEBREW_MONTHS[month - 1]} ${year}`
}

// `08_2026_Payroll_Report.xlsx` — חודש כ**מספר** דו-ספרתי. ⚠️ לא "אוגוסט_2026": ריכוז-ממצא
// #5 (26/08/2026) הכריע במפורש נגד הווריאנט העברי, מול דפוס `[חודש_שנה]` שב-C5 §5.8.10.
export function salaryReportFileName(period) {
  const { year, month } = parsePeriod(period)
  return `${String(month).padStart(2, '0')}_${year}_Payroll_Report.xlsx`
}

// פרטי-הבנק מגיעים מה-RPC ו**אינם** נשמרים ב-`salary_report_lines` (B-4) — שכפולם לטבלה
// שנייה היה פותח מחדש את החשיפה שה19 סגר. הצורה היא זו של המוקאפ: "הפועלים 601-2047199".
// דיילת בלי שורת-בנק (LEFT JOIN) מחזירה null ⇒ המסמך יראה `—` ולא שדה ריק שנראה תקין.
function bankDetailsOf(row) {
  const name = textOrNull(row?.bank_name)
  const branch = textOrNull(row?.bank_branch)
  const account = textOrNull(row?.bank_account)
  if (!account) return null
  const branchAndAccount = branch ? `${branch}-${account}` : account
  return name ? `${name} ${branchAndAccount}` : branchAndAccount
}

function shapeLine(row, index) {
  const position = index + 1
  const lineBasis = textOrNull(row?.line_basis)
  if (!Object.values(SALARY_LINE_BASIS).includes(lineBasis)) {
    throw salaryReportError(
      'SALARY_LINE_BASIS_UNKNOWN',
      `שורת-שכר ${position} הגיעה עם בסיס-חישוב לא מוכר — לא ניתן להרכיב את הקובץ.`,
    )
  }

  const hostessName = textOrNull(row?.hostess_name)
  const idNumber = textOrNull(row?.id_number)
  if (!hostessName || !idNumber) {
    throw salaryReportError(
      'SALARY_LINE_IDENTITY_MISSING',
      `שורת-שכר ${position} חסרה שם או ת"ז — לא ניתן לשלוח דוח בלי זיהוי מלא.`,
    )
  }

  const isActual = lineBasis === SALARY_LINE_BASIS.ACTUAL
  const bonusRaw = toFiniteNumber(row?.bonus)
  const travelRaw = toFiniteNumber(row?.travel)
  // ה24 (הפיצוי הוא על השעות בלבד) + ה29 (משמרת שבוטלה לא נסעה): ערך בפועל בשורת-פיצוי
  // סותר את שתי ההכרעות. עדיף שהמסמך לא ייבנה מאשר שהרו"ח יקבל תשלום שאיש לא הכריע עליו.
  if (!isActual && ((bonusRaw ?? 0) !== 0 || (travelRaw ?? 0) !== 0)) {
    throw salaryReportError(
      'SALARY_COMPENSATION_LINE_HAS_EXTRAS',
      `שורת פיצוי-ביטול ${position} הגיעה עם בונוס או נסיעות — נוגד את ה24/ה29.`,
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
    // NULL בשורת-שעות-בפועל הוא אפס אמיתי (המסד מריץ `nullif(bonus,0)`); בשורת-פיצוי הוא
    // "לא-רלוונטי" ונשאר null ⇒ `—`. ר' פסקת-הסתירה בראש הקובץ.
    bonus: isActual ? (bonusRaw ?? 0) : null,
    travel: isActual ? (travelRaw ?? 0) : null,
    lineTotal: requireFiniteNumber(
      row?.line_total,
      'SALARY_LINE_TOTAL_MISSING',
      `שורת-שכר ${position} (${hostessName}) חסרה סכום.`,
    ),
    bankDetails: bankDetailsOf(row),
    // N-4: שורת אפס נחתמת ונרשמת (כדי שלא תיאסף שוב ושהראיה שלמה) אך אינה נכנסת לגוף
    // הקובץ. המסד מחזיר `show_in_file`; ה-fallback הוא בדיוק הביטוי שלו, למקרה של payload ישן.
    showInFile:
      typeof row?.show_in_file === 'boolean'
        ? row.show_in_file
        : toFiniteNumber(row?.line_total) !== 0,
  }
}

// `payload` = מה ש-`generate_salary_report` החזיר.
export function buildSalaryReportLines(payload) {
  const rows = payload?.lines
  if (!Array.isArray(rows)) {
    throw salaryReportError(
      'SALARY_REPORT_SHAPE',
      'תשובת הפקת דוח-השכר אינה תקינה — חסרה רשימת השורות.',
    )
  }
  return rows.map(shapeLine)
}

// סכימה באגורות-שלמות (src/lib/pricing.js · §7.25/§7.74) — 0.1+0.2 אינו 0.3 בכסף.
export function salaryReportTotals(lines) {
  const totals = lines.reduce(
    (acc, line) => ({
      totalAgorot: acc.totalAgorot + toAgorot(line.lineTotal),
      visibleAgorot: acc.visibleAgorot + (line.showInFile ? toAgorot(line.lineTotal) : 0),
      bonusAgorot: acc.bonusAgorot + toAgorot(line.bonus ?? 0),
      travelAgorot: acc.travelAgorot + toAgorot(line.travel ?? 0),
    }),
    { totalAgorot: 0, visibleAgorot: 0, bonusAgorot: 0, travelAgorot: 0 },
  )

  // N-4 קובע שהשמטת שורות-האפס **אינה משנה את הסה"כ**. אם השתיים נפרדו — שורה בעלת סכום
  // הוסתרה מהקובץ, והרו"ח היה מקבל מסמך שסכומו אינו סכום שורותיו.
  if (totals.visibleAgorot !== totals.totalAgorot) {
    throw salaryReportError(
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
  }
}

const boldCell = (value) => ({ value, type: String, fontWeight: 'bold' })
const textCell = (value) => ({ value, type: String })
const dashCell = () => ({ value: NOT_APPLICABLE, type: String, align: 'center' })
const moneyCell = (value, bold = false) => ({
  value,
  type: Number,
  format: MONEY_FORMAT,
  ...(bold ? { fontWeight: 'bold' } : {}),
})

// 🔴 ת"ז כ-`String` מפורש ולא כמספר. ת"ז ישראלית שמתחילה באפס מאבדת אותו בשקט ברגע
// שאקסל קורא אותה כמספר — במסמך שהולך לרו"ח, על שדה-זיהוי. אותו נימוק לפרטי-הבנק
// (מספר-סניף/חשבון עם אפס מוביל) ולקוד-ההפקה.
function sheetLineRow(line) {
  return [
    textCell(line.idNumber),
    textCell(line.hostessName),
    line.bankDetails ? textCell(line.bankDetails) : dashCell(),
    moneyCell(line.rate),
    { value: line.hours, type: Number, format: HOURS_FORMAT },
    line.bonus === null ? dashCell() : moneyCell(line.bonus),
    line.travel === null ? dashCell() : moneyCell(line.travel),
    moneyCell(line.lineTotal),
  ]
}

// שורת-הסה"כ: "שעות"/"תעריף" נשארות `—` — סיכום שעות-בפועל עם שעות-מתוכננות אינו מספר
// בעל משמעות (S3 §⑧7, המוקאפ המאושר).
function sheetTotalRow(totals) {
  return [
    boldCell('סה"כ'),
    dashCell(),
    dashCell(),
    dashCell(),
    dashCell(),
    moneyCell(totals.bonusTotal, true),
    moneyCell(totals.travelTotal, true),
    moneyCell(totals.total, true),
  ]
}

// חותמת-הזמן וקוד-ההפקה בכותרת — כרטיס-P4 ("Excel עם חותמת-זמן ושורת-סה\"כ") + B-11
// ("קוד-הפקה ייחודי = `report_id`, מוצג בכותרת האקסל"). `generatedAt` מוזרק ואינו נקרא
// משעון פנימי: קובץ שנבנה פעמיים חייב להיות זהה, וקבצי-`src/lib` כאן טהורים מ-clock.
export function buildSalaryReportSheet({ reportId, periodLabel, generatedAt, lines, totals }) {
  const stamp = formatTimestampFull(generatedAt)
  if (!stamp) {
    throw salaryReportError(
      'SALARY_REPORT_TIMESTAMP_MISSING',
      'חסרה חותמת-זמן להפקת הדוח — הקובץ לא הורכב.',
    )
  }

  return [
    [boldCell(`דוח שכר דיילות — ${periodLabel}`)],
    [boldCell('קוד הפקה'), textCell(String(reportId))],
    [boldCell('הופק בתאריך'), textCell(stamp)],
    [null],
    SALARY_REPORT_COLUMNS.map(boldCell),
    ...lines.filter((line) => line.showInFile).map(sheetLineRow),
    sheetTotalRow(totals),
  ]
}

// הרכבת המסמך כולו — טהור, בלי רשת ובלי קבצים, כדי שכל שומר כאן ייבדק ביחידה.
export function buildSalaryReportDocument(payload, { generatedAt } = {}) {
  if (!payload || payload.ok !== true) {
    throw salaryReportError('SALARY_REPORT_NOT_OK', 'הפקת דוח-השכר לא הושלמה — הקובץ לא הורכב.')
  }

  const reportId = payload.report_id
  if (!Number.isInteger(reportId)) {
    throw salaryReportError('SALARY_REPORT_ID_MISSING', 'תשובת ההפקה חסרה מזהה-דוח.')
  }

  const lines = buildSalaryReportLines(payload)
  const totals = salaryReportTotals(lines)

  // אימות-צולב מול המספר שהמסד עצמו כתב ל-`salary_reports.total_amount`. שני הצדדים נולדו
  // באותה טרנזקציה ⇒ פער כלשהו הוא באג-הרכבה, לא הבדל-עיגול. הדוח לא נשלח על ספק.
  const reportedTotal = toFiniteNumber(payload.total_amount)
  if (reportedTotal !== null && toAgorot(reportedTotal) !== toAgorot(totals.total)) {
    throw salaryReportError(
      'SALARY_TOTAL_MISMATCH',
      'סכום שורות הדוח אינו תואם את הסכום שנרשם במסד — הדוח לא הורכב.',
    )
  }

  const reportedCount = toFiniteNumber(payload.line_count)
  if (reportedCount !== null && reportedCount !== totals.lineCount) {
    throw salaryReportError(
      'SALARY_LINE_COUNT_MISMATCH',
      'מספר שורות הדוח אינו תואם את מה שנרשם במסד — הדוח לא הורכב.',
    )
  }

  const periodLabel = salaryPeriodLabel(payload.period)

  return {
    reportId,
    period: payload.period,
    periodLabel,
    fileName: salaryReportFileName(payload.period),
    lines,
    totals,
    // דיילת בלי שורת-בנק תופיע במסמך עם `—`; הרשימה כאן קיימת כדי שהמסך יוכל להתריע
    // **לפני** שהקובץ נשלח, במקום שהרו"ח יגלה זאת. אין כאן חסימה: החתימות כבר נכתבו
    // ב-RPC, ונפילה בשלב-ההרכבה הייתה משאירה דוח חתום בלי קובץ.
    linesMissingBankDetails: lines
      .filter((line) => line.showInFile && !line.bankDetails)
      .map((line) => line.hostessName),
    sheet: buildSalaryReportSheet({ reportId, periodLabel, generatedAt, lines, totals }),
  }
}

// ⚠️ ייבוא מ-`write-excel-file` (הכניסה הדפדפנית) ולא מ-`write-excel-file/node`: הקובץ נבנה
// בדפדפן ומועלה ל-bucket `finance` — בדיוק תקדים `quotePdf.jsx` (B-5). `rightToLeft` הופך את
// כיוון-הגיליון עצמו, אחרת אקסל פותח מסמך עברי עם עמודה A משמאל.
export function writeSalaryReportXlsx(doc) {
  return writeXlsxFile(doc.sheet, {
    sheet: doc.periodLabel,
    columns: COLUMN_WIDTHS,
    rightToLeft: true,
  })
}
