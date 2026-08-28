// בדיקות S3 — SalaryReportDialog + SalaryReportHistoryCard (צעד 3.3).
//
// מה נעול כאן: ברירת-המחדל לחודש היא **החודש שהסתיים** (P4: "בסוף-חודש") · בדיקת-הכפילות
// מצד-לקוח נגד `listSalaryReports()` חוסמת "ייצא ושלח" ומציגה את הבאנר · "ייצא ושלח" קורא
// ל-`generateAndSendSalaryReport` עם `accountantName: null` (חור-מוצר מוצהר, לא מומצא כאן) ·
// אחרי הצלחה מוצגת אותה טבלת-8-עמודות **כתוצאה**, לא כתצוגה-מקדימה (אין RPC לתצוגה-מקדימה —
// ר' הערת-הראש של הקובץ הנבדק) · **פאנל-הקדם-הפקה**: מה שידוע בוודאות לפני הלחיצה
// (נמען · שם-קובץ · גבול-איסוף · חודשים שטרם הופקו), ההצהרה שהשורות עצמן אינן ניתנות להצגה,
// ואזהרת חוסר-נמען · "אין שעות לתשלום החודש" על 0 שורות · שלושת מצבי-השליחה
// (sent/failed/unknown) מדווחים נכון · כרטיס-ההיסטוריה מציג ריק/שורות, הורדה, ושליחה-חוזרת
// רק על שורות `failed` עם קובץ שמור.
//
// 🆕 ‏28/08/2026 — שני שערים חדשים על המסלול הבלתי-הפיך, ושניהם נעולים כאן: **חודש עתידי
// נדחה בבורר** (‏`applyPicker`), ו**"ייצא ושלח" עובר בחלונית-וידוא** לפני שה-RPC נקרא.
//
// ה-API ממוקק לגמרי (כולל `getParamValue` חוצה-המודול) — אין נגיעה ברשת/Supabase.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import { ToastProvider } from '@/components/ToastProvider'
import { formatShekelExact, formatShekelWhole } from '@/lib/pricing'
import SalaryReportDialog, { SalaryReportHistoryCard } from './SalaryReportDialog'
import {
  ACCOUNTANT_EMAIL_PARAM,
  fileNameOf,
  generateAndSendSalaryReport,
  getFinanceFileSignedUrl,
  listSalaryReports,
  resendSalaryReportMail,
} from './api'
import { getParamValue } from '@/modules/06_projects/closingApi'

vi.mock('./api', async () => {
  const actual = await vi.importActual('./api')
  return {
    ...actual,
    generateAndSendSalaryReport: vi.fn(),
    getFinanceFileSignedUrl: vi.fn(),
    listSalaryReports: vi.fn(),
    resendSalaryReportMail: vi.fn(),
  }
})
vi.mock('@/modules/06_projects/closingApi', () => ({ getParamValue: vi.fn() }))

const NOW = new Date('2026-10-15T10:00:00Z') // "היום" המשותף של data-set.md §0
const ACCOUNTANT_EMAIL = 'office@cpa-firm.co.il'

function reportRow(overrides) {
  return {
    report_id: 7,
    period: '2026-08-01',
    send_status: 'sent',
    sent_date: '2026-09-01',
    report_file_url: 'salary_reports/7_08_2026_Payroll_Report.xlsx',
    total_amount: 620.6,
    created_at: '2026-09-01T08:00:00Z',
    ...overrides,
  }
}

// שורות תואמות-בייט לצורה שמחזירה `shapeLine` ב-`salaryReport.js` — לא ממציאות שדות.
function actualLine(overrides) {
  return {
    hostessId: 1,
    hostessName: 'אפרת דהן',
    idNumber: '301554333',
    sourceProjectId: 12,
    lineBasis: 'actual',
    basisLabel: 'שעות בפועל',
    hoursLabel: 'בפועל',
    hours: 6,
    rate: 45,
    bonus: 0,
    travel: 22.6,
    lineTotal: 292.6,
    bankDetails: 'הפועלים 601-2047199',
    showInFile: true,
    ...overrides,
  }
}

function compensationLine(overrides) {
  return {
    hostessId: 2,
    hostessName: 'אורלי שני',
    idNumber: '301550224',
    sourceProjectId: 14,
    lineBasis: 'cancellation_compensation',
    basisLabel: 'פיצוי-ביטול',
    hoursLabel: 'מתוכנן',
    hours: 4,
    rate: 43,
    bonus: null,
    travel: null,
    lineTotal: 86,
    bankDetails: 'דיסקונט 045-8732016',
    showInFile: true,
    ...overrides,
  }
}

function generateResult(overrides) {
  const lines = overrides?.lines ?? [actualLine(), compensationLine()]
  return {
    reportId: 8,
    period: '2026-09-01',
    periodLabel: 'ספטמבר 2026',
    fileName: '09_2026_Payroll_Report.xlsx',
    lines,
    totals: {
      lineCount: lines.length,
      fileLineCount: lines.filter((l) => l.showInFile).length,
      total: lines.reduce((s, l) => s + l.lineTotal, 0),
      bonusTotal: lines.reduce((s, l) => s + (l.bonus ?? 0), 0),
      travelTotal: lines.reduce((s, l) => s + (l.travel ?? 0), 0),
    },
    linesMissingBankDetails: [],
    filePath: 'salary_reports/8_09_2026_Payroll_Report.xlsx',
    fileError: null,
    sendResult: 'sent',
    sendStatus: 'sent',
    mailError: null,
    logFailed: false,
    finalizeError: null,
    ...overrides,
  }
}

// ‏`ConfirmProvider` בדיוק כפי ש-`App.jsx` עוטף את כל המסכים — `useConfirm()` **זורק** מחוץ
// לספק, ולכן זו אינה נוחות-בדיקה אלא אותה חיווט שקיים בייצור.
function renderDialog(props = {}) {
  return render(
    <ConfirmProvider>
      <ToastProvider>
        <SalaryReportDialog open onOpenChange={vi.fn()} {...props} />
      </ToastProvider>
    </ConfirmProvider>,
  )
}

// 🔴 כל הפעלה של המסלול הבלתי-הפיך עוברת דרך העוזר הזה ולא דרך לחיצה ישירה — אחרת שכחת
// חלונית-הווידוא הייתה נראית בבדיקה בדיוק כמו "ה-RPC לא נקרא", כלומר כשל אילם.
async function clickGenerateAndConfirm() {
  fireEvent.click(screen.getByTestId('salary-report-generate'))
  fireEvent.click(await screen.findByTestId('confirm-dialog-confirm'))
}

beforeEach(() => {
  // `shouldAdvanceTime` הוא קריטי: בלעדיו `findBy*`/`waitFor` של testing-library (שמסתמכות
  // על `setTimeout` אמיתי כדי לתשאל מחדש) נתקעות מול שעונים מדומים — כל 17 הבדיקות בקובץ
  // הזה תקעו (timeout 5000ms) עד שזה נוסף.
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(NOW)
  // `mockReset` ולא רק `mockResolvedValue`: בלעדיו מונה-הקריאות מצטבר מהרצות קודמות
  // (נתפס כאן בפועל — בדיקת "רענון" ראתה 18 קריאות, בדיוק מספר-הבדיקות בקובץ).
  listSalaryReports.mockReset().mockResolvedValue([])
  getParamValue.mockReset().mockResolvedValue(ACCOUNTANT_EMAIL)
  generateAndSendSalaryReport.mockReset()
  getFinanceFileSignedUrl.mockReset()
  resendSalaryReportMail.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('SalaryReportDialog — בחירת-חודש וברירת-מחדל', () => {
  it('ברירת-המחדל היא החודש שהסתיים (P4: "בסוף-חודש") — "היום" 15/10/2026 ⇒ ספטמבר 2026', async () => {
    renderDialog()
    expect(await screen.findByTestId('salary-report-month-button')).toHaveTextContent('ספטמבר')
    expect(screen.getByTestId('salary-report-month-button')).toHaveTextContent('2026')
  })

  it('פותחת את הבורר, משנה שנה+חודש, ומאשרת — הכפתור הסגור מציג את הבחירה החדשה', async () => {
    renderDialog()
    fireEvent.click(await screen.findByTestId('salary-report-month-button'))

    const monthSelect = screen.getByTestId('salary-report-month-select')
    fireEvent.change(monthSelect, { target: { value: '1' } })
    const yearInput = screen.getByTestId('salary-report-year-input')
    // ⚠️ ‏2025 ולא 2027: מ-28/08/2026 חודש עתידי נדחה בשער (הבדיקה הייעודית לו למטה),
    // ובחירה עתידית כאן הייתה בודקת את השער במקום את מה שהבדיקה הזו נועלת — שהבורר מחיל
    // חודש **ושנה** גם יחד. הכוונה נשמרה; הערכים הוזזו לעבר.
    fireEvent.change(yearInput, { target: { value: '2025' } })
    fireEvent.click(screen.getByTestId('salary-report-month-apply'))

    const button = screen.getByTestId('salary-report-month-button')
    expect(button).toHaveTextContent('ינואר')
    expect(button).toHaveTextContent('2025')
  })

  it('ביטול-הבורר משאיר את החודש הקודם ללא שינוי', async () => {
    renderDialog()
    fireEvent.click(await screen.findByTestId('salary-report-month-button'))
    fireEvent.change(screen.getByTestId('salary-report-year-input'), { target: { value: '1999' } })
    fireEvent.click(screen.getByTestId('salary-report-month-cancel'))

    expect(screen.getByTestId('salary-report-month-button')).toHaveTextContent('2026')
    expect(screen.queryByText(/1999/)).not.toBeInTheDocument()
  })
})

describe('SalaryReportDialog — פאנל-הקדם-הפקה (הכרעת-ישי 28/08/2026)', () => {
  it('נושא את הנמען, את שם-הקובץ ואת גבול-האיסוף — שלושתם ידועים בוודאות לפני הכתיבה', async () => {
    renderDialog()

    const panel = await screen.findByTestId('salary-report-preflight')
    expect(panel).toHaveTextContent('מה ייכלל בדוח של ספטמבר 2026')
    await waitFor(() => expect(panel).toHaveTextContent(ACCOUNTANT_EMAIL))
    // שם-הקובץ נגזר מ-`salaryReportFileName` — אותה פונקציה שמייצרת את הקובץ בפועל.
    expect(panel).toHaveTextContent('09_2026_Payroll_Report.xlsx')
    // גבול-האיסוף = היום האחרון של החודש הנבחר, כפי ש-`generate_salary_report` אוספת.
    expect(panel).toHaveTextContent('30/09/2026')
  })

  it('אומר במפורש ששורות-הדוח אינן מוצגות ושהפעולה אינה הפיכה — ואינו מציג ולו סכום אחד', async () => {
    renderDialog()

    const limit = await screen.findByTestId('salary-report-preflight-limit')
    expect(limit).toHaveTextContent('שורות הדוח עצמן אינן מוצגות כאן')
    expect(limit).toHaveTextContent('אינה הפיכה')

    // 🛡️ העוגן שמונע רגרסיה לכיוון "תצוגה-מקדימה מומצאת": אין ₪ בפאנל כולו. מספר-כסף כאן
    // היה בהכרח אומדן — אין במסד קורא שמחזיר את השורות בלי לכתוב אותן.
    expect(screen.getByTestId('salary-report-preflight').textContent).not.toContain('₪')
  })

  it('אינו מוצג כשהחודש כבר הופק — שם הבאנר החסום הוא המסר', async () => {
    listSalaryReports.mockResolvedValue([reportRow({ period: '2026-09-01' })])
    renderDialog()

    await screen.findByTestId('salary-report-blocked-banner')
    expect(screen.queryByTestId('salary-report-preflight')).not.toBeInTheDocument()
  })

  it('נעלם אחרי ההפקה ובמקומו מוצגת הטבלה האמיתית', async () => {
    generateAndSendSalaryReport.mockResolvedValue(generateResult())
    renderDialog()

    await screen.findByTestId('salary-report-preflight')
    await clickGenerateAndConfirm()

    await screen.findByTestId('salary-report-result-table')
    expect(screen.queryByTestId('salary-report-preflight')).not.toBeInTheDocument()
  })

  it('פער-חודשים: דילוג על חודש מגלגל את שורותיו לדוח הזה — והפאנל נוקב בחודשים בשמם', async () => {
    // האחרון שהופק הוא יוני 2026; הנבחר (ברירת-המחדל) ספטמבר 2026 ⇒ יולי ואוגוסט חסרים.
    listSalaryReports.mockResolvedValue([reportRow({ period: '2026-06-01' })])
    renderDialog()

    const gap = await screen.findByTestId('salary-report-gap-note')
    expect(gap).toHaveTextContent('יולי 2026')
    expect(gap).toHaveTextContent('אוגוסט 2026')
    // 🛡️ מפלה: החודש הנבחר עצמו והחודש שכן הופק אינם ברשימת-החסרים.
    expect(gap).not.toHaveTextContent('יוני 2026')
    expect(gap).not.toHaveTextContent('ספטמבר 2026')
    expect(screen.getByTestId('salary-report-last-report')).toHaveTextContent('יוני 2026')
  })

  it('אין היסטוריה כלל ⇒ "זהו דוח-השכר הראשון", ובלי הערת-פער', async () => {
    listSalaryReports.mockResolvedValue([])
    renderDialog()

    expect(await screen.findByTestId('salary-report-last-report')).toHaveTextContent(
      'זהו דוח-השכר הראשון במערכת',
    )
    expect(screen.queryByTestId('salary-report-gap-note')).not.toBeInTheDocument()
  })

  // 🔴 הבדיקה הזו נועלת **תיקון** ולא רק קיום-אזהרה. עד 28/08/2026 היא אימתה את המחרוזת
  // "לא יישלח", כלומר נעלה משפט שאמר את ההפך ממה שקורה: `generateAndSendSalaryReport`
  // שולפת נמען+תבנית ב-`Promise.all` **לפני** `generate_salary_report`, ולכן חוסר-נמען
  // עוצר את ההפקה כולה — אין דוח, אין חתימה, ואין שורת-היסטוריה לשלוח ממנה
  // (`api.test.js`: "חוסר-תבנית או חוסר-נמען עוצר **לפני** ההפקה הבלתי-הפיכה" מאמת
  // `rpc` שלא נקרא). שתי הבדיקות סתרו זו את זו; זו התיישרה לפי המנגנון.
  it('כתובת רואה-החשבון לא נטענה ⇒ אזהרה שההפקה תיעצר לפני שנכתב משהו (ולא שהדוח ייחתם)', async () => {
    // `getParamValue` **זורקת** כשהפרמטר חסר (closingApi.js) — וזה בדיוק המסלול שנבדק כאן.
    getParamValue.mockRejectedValue(new Error('הפרמטר "מייל_משרד_רואי_חשבון" חסר בהגדרות המערכת.'))
    renderDialog()

    const warn = await screen.findByTestId('salary-report-no-recipient')
    expect(warn).toHaveTextContent('ההפקה תיעצר לפני שנכתב משהו')
    expect(warn).toHaveTextContent('לא תיחתם אף שורה')
    // 🛡️ מפלה: המשפט הישן — ההבטחה שהדוח כן יופק ורק המייל לא ייצא — אסור שיחזור.
    expect(warn).not.toHaveTextContent('המייל לא יישלח')
    expect(warn).not.toHaveTextContent('אפשר יהיה לשלוח אותו מההיסטוריה')
  })

  it('כתובת שנטענה בהצלחה אינה מדליקה את אזהרת-חוסר-הנמען (מפלה בין "טוען" ל"אין")', async () => {
    renderDialog()

    await screen.findByTestId('salary-report-preflight')
    await waitFor(() =>
      expect(screen.getByTestId('salary-report-preflight')).toHaveTextContent(ACCOUNTANT_EMAIL),
    )
    expect(screen.queryByTestId('salary-report-no-recipient')).not.toBeInTheDocument()
  })
})

describe('SalaryReportDialog — שער-הקריסה של בורר-החודש', () => {
  // 🐞 המנגנון שנמדד: שדה-השנה הוא `<input type="number">`; מחיקת תוכנו מחזירה `''`,
  // ‏`Number('')` הוא 0, ו-`periodOf(0, 9)` הוא `"0-09-01"` — שאינו עובר את פירוק-התקופה
  // (ארבע ספרות). בלי השער, השורה שמציגה את הכפתור הסגור קוראת `selectedParts.year` על
  // `null` וזורקת **בגוף-הרינדור** ⇒ מסך לבן. הבדיקה מפלה: אם השער יוסר, ה-render יזרוק
  // כאן והבדיקה תאדים.
  it('שנה ריקה: "אישור" אינו מפיל את המסך, מציג הנחיה, ומשאיר את החודש הקודם', async () => {
    renderDialog()
    fireEvent.click(await screen.findByTestId('salary-report-month-button'))
    fireEvent.change(screen.getByTestId('salary-report-year-input'), { target: { value: '' } })
    fireEvent.click(screen.getByTestId('salary-report-month-apply'))

    expect(screen.getByTestId('salary-report-month-error')).toHaveTextContent(
      'יש להזין שנה בת ארבע ספרות',
    )
    // הבורר נשאר פתוח והבחירה לא הוחלה — הדיאלוג חי.
    expect(screen.getByTestId('salary-report-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('salary-report-month-select')).toBeInTheDocument()

    // תיקון השנה מחיל כרגיל ומנקה את ההנחיה.
    fireEvent.change(screen.getByTestId('salary-report-year-input'), { target: { value: '2025' } })
    expect(screen.queryByTestId('salary-report-month-error')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('salary-report-month-apply'))
    expect(screen.getByTestId('salary-report-month-button')).toHaveTextContent('2025')
  })

  it('הכפתור הסגור מכריז על תפריט (aria-haspopup) — כפי שהמוקאפ המאושר מסמן אותו', async () => {
    renderDialog()
    expect(await screen.findByTestId('salary-report-month-button')).toHaveAttribute(
      'aria-haspopup',
      'true',
    )
  })
})

// 🔴 **שער-החודש-העתידי.** התרחיש שהוא חוסם, במספרים: "היום" הוא 15/10/2026; המנהלת מקלידה
// בשדה-השנה החופשי `2027` במקום `2026`, ולוחצת "ייצא ושלח" — פעולה בלתי-הפיכה. כלל-האיסוף
// של `generate_salary_report` הוא `event_date <= סוף-החודש-הנבחר`, ולכן חודש עתידי אוסף
// **את כל** שורות-השכר הפתוחות, חותם אותן, ושולח לרו"ח קובץ בכותרת של חודש שטרם היה — ואת
// החודש האמיתי כבר אי-אפשר להפיק עם השורות האלה. **המסד אינו חוסם** (הוא דוחה `null`
// ותקופה שכבר הופקה בלבד), ולכן זה השער היחיד.
describe('SalaryReportDialog — שער-החודש-העתידי', () => {
  it('שנה עתידית (2027 במקום 2026) נדחית: הנחיה, הבורר נשאר פתוח, והחודש לא הוחל', async () => {
    renderDialog()
    fireEvent.click(await screen.findByTestId('salary-report-month-button'))
    fireEvent.change(screen.getByTestId('salary-report-year-input'), { target: { value: '2027' } })
    fireEvent.click(screen.getByTestId('salary-report-month-apply'))

    expect(screen.getByTestId('salary-report-month-error')).toHaveTextContent(
      'לא ניתן להפיק דוח לחודש עתידי',
    )
    // הבורר נשאר פתוח והבחירה לא הוחלה — לא נוצר מצב שבו "אישור" נראה כאילו עבד.
    expect(screen.getByTestId('salary-report-month-select')).toBeInTheDocument()
    expect(screen.queryByTestId('salary-report-month-button')).not.toBeInTheDocument()
  })

  it('חודש עתידי באותה שנה (נובמבר 2026 מול "היום" 15/10/2026) נדחה גם הוא', async () => {
    renderDialog()
    fireEvent.click(await screen.findByTestId('salary-report-month-button'))
    fireEvent.change(screen.getByTestId('salary-report-month-select'), { target: { value: '11' } })
    fireEvent.click(screen.getByTestId('salary-report-month-apply'))

    expect(screen.getByTestId('salary-report-month-error')).toHaveTextContent(
      'לא ניתן להפיק דוח לחודש עתידי',
    )
  })

  // 🛡️ **המפלה שמוכיחה שהשער אינו רחב מדי.** ‏P4 מגדירה את ההפקה כ"מנהלת-הכספים, ידנית,
  // **בסוף-חודש**" — כלומר הפקה ב-31/10 עבור אוקטובר היא שימוש לגיטימי מפורש. שער שהיה
  // חוסם גם את החודש הנוכחי היה שובר אותו, ובדיקה בלי השורה הזו לא הייתה מבחינה.
  it('החודש הנוכחי (אוקטובר 2026) עובר — P4 מתירה הפקה בסוף-החודש עצמו', async () => {
    renderDialog()
    fireEvent.click(await screen.findByTestId('salary-report-month-button'))
    fireEvent.change(screen.getByTestId('salary-report-month-select'), { target: { value: '10' } })
    fireEvent.click(screen.getByTestId('salary-report-month-apply'))

    expect(screen.queryByTestId('salary-report-month-error')).not.toBeInTheDocument()
    expect(screen.getByTestId('salary-report-month-button')).toHaveTextContent('אוקטובר')
    expect(screen.getByTestId('salary-report-month-button')).toHaveTextContent('2026')
  })
})

// 🔴 **חלונית-הווידוא לפני החתימה.** באותו מודול, שלוש פעולות קטנות מזו (ארכוב · סגירה
// ללא-תשלום · ויתור) עוצרות ושואלות; זו — שחותמת את שכר כל החודש ומוציאה קובץ לרו"ח — לא
// שאלה דבר עד 28/08/2026. הבדיקות כאן נועלות את השער עצמו: **ה-RPC אינו נקרא לפני אישור.**
describe('SalaryReportDialog — חלונית-הווידוא של "ייצא ושלח"', () => {
  it('לחיצה על "ייצא ושלח" פותחת וידוא שנוקב בחודש ובאי-ההפיכות — וה-RPC טרם נקרא', async () => {
    generateAndSendSalaryReport.mockResolvedValue(generateResult())
    renderDialog()

    await screen.findByTestId('salary-report-month-button')
    fireEvent.click(screen.getByTestId('salary-report-generate'))

    const message = await screen.findByTestId('confirm-dialog-message')
    expect(message).toHaveTextContent('ספטמבר 2026')
    expect(message).toHaveTextContent('לא ייאספו שוב')
    expect(message).toHaveTextContent('אין ביטול לפעולה')
    expect(screen.getByTestId('confirm-dialog-title')).toHaveTextContent('הפקת דוח-שכר')
    expect(generateAndSendSalaryReport).not.toHaveBeenCalled()
  })

  it('"ביטול" בחלונית-הווידוא אינו מפיק דבר, והדיאלוג נשאר במצב-בחירה', async () => {
    generateAndSendSalaryReport.mockResolvedValue(generateResult())
    renderDialog()

    await screen.findByTestId('salary-report-month-button')
    fireEvent.click(screen.getByTestId('salary-report-generate'))
    fireEvent.click(await screen.findByTestId('confirm-dialog-cancel'))

    await waitFor(() => expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument())
    expect(generateAndSendSalaryReport).not.toHaveBeenCalled()
    // הכפתור חוזר לנוסחו הרגיל (לא "מפיקה ושולחת…") ואין טבלת-תוצאה.
    expect(screen.getByTestId('salary-report-generate')).toHaveTextContent('ייצא ושלח')
    expect(screen.queryByTestId('salary-report-result')).not.toBeInTheDocument()
  })

  it('חודש שכבר הופק: הלחיצה אינה פותחת וידוא כלל (הכפתור מושבת מלכתחילה)', async () => {
    listSalaryReports.mockResolvedValue([reportRow({ period: '2026-09-01' })])
    renderDialog()

    await screen.findByTestId('salary-report-blocked-banner')
    fireEvent.click(screen.getByTestId('salary-report-generate'))

    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument()
    expect(generateAndSendSalaryReport).not.toHaveBeenCalled()
  })
})

describe('SalaryReportDialog — חסימת-כפילות מצד-לקוח (תצוגה ג׳ של המוקאפ)', () => {
  it('חודש שכבר הופק (send_status=sent) מציג את הבאנר החסום ומשבית "ייצא ושלח"', async () => {
    listSalaryReports.mockResolvedValue([reportRow({ period: '2026-09-01' })])
    renderDialog()

    const banner = await screen.findByTestId('salary-report-blocked-banner')
    expect(banner).toHaveTextContent('דוח לחודש ספטמבר 2026 כבר הופק')
    expect(banner).toHaveTextContent('01/09/2026')
    expect(banner).toHaveTextContent(ACCOUNTANT_EMAIL)
    expect(screen.getByTestId('salary-report-generate')).toBeDisabled()
    expect(generateAndSendSalaryReport).not.toHaveBeenCalled()
  })

  it('חודש שלא הופק אינו מציג באנר, וה-RPC לא נקרא לפני לחיצה', async () => {
    listSalaryReports.mockResolvedValue([reportRow({ period: '2026-01-01' })])
    renderDialog()

    await screen.findByTestId('salary-report-month-button')
    expect(screen.queryByTestId('salary-report-blocked-banner')).not.toBeInTheDocument()
    expect(screen.getByTestId('salary-report-generate')).not.toBeDisabled()
  })
})

describe('SalaryReportDialog — "ייצא ושלח" (המסלול הבלתי-הפיך היחיד)', () => {
  it('קוראת ל-RPC עם התקופה הנבחרת ו-accountantName:null, ומציגה את טבלת-התוצאה', async () => {
    generateAndSendSalaryReport.mockResolvedValue(generateResult())
    const onGenerated = vi.fn()
    renderDialog({ onGenerated })

    await screen.findByTestId('salary-report-month-button')
    await clickGenerateAndConfirm()

    await waitFor(() => expect(generateAndSendSalaryReport).toHaveBeenCalledTimes(1))
    const call = generateAndSendSalaryReport.mock.calls[0][0]
    expect(call.period).toBe('2026-09-01')
    expect(call.accountantName).toBeNull()

    const table = await screen.findByTestId('salary-report-result-table')
    expect(within(table).getByText('אפרת דהן')).toBeInTheDocument()
    expect(within(table).getByText('אורלי שני')).toBeInTheDocument()
    // בונוס/נסיעות בשורת-פיצוי-ביטול = "—" ולא 0.00 (ה24/ה29, §3.7)
    const compRow = within(table).getByText('אורלי שני').closest('tr')
    expect(within(compRow).getAllByText('—').length).toBeGreaterThanOrEqual(2)

    expect(onGenerated).toHaveBeenCalledTimes(1)
  })

  it('דוח עם אפס שורות מציג "אין שעות לתשלום החודש" ולא טבלה ריקה', async () => {
    generateAndSendSalaryReport.mockResolvedValue(generateResult({ lines: [] }))
    renderDialog()

    await screen.findByTestId('salary-report-month-button')
    await clickGenerateAndConfirm()

    expect(await screen.findByTestId('salary-report-empty-note')).toHaveTextContent(
      'אין שעות לתשלום החודש',
    )
    expect(screen.queryByTestId('salary-report-result-table')).not.toBeInTheDocument()
  })

  // 🔴 **המסלול שהפך חודש חתום לחודש "ריק ותקין".** שומר-הרכבה שנופל ב-`salaryReport.js`
  // נתפס ב-`catch` של `generateAndSendSalaryReport`, והיא **חוזרת כרגיל** עם
  // `totals: null` / `lines: []` — בעוד במסד כבר יש שורת-דוח וכל שיבוץ שנאסף כבר נחתם.
  // הצורה שנבדקת כאן היא בדיוק זו שה-API מחזירה (api.js: `doc?.totals ?? null`).
  const assemblyFailureResult = () =>
    generateResult({
      periodLabel: null,
      fileName: null,
      lines: [],
      totals: null,
      filePath: null,
      sendResult: 'failed',
      sendStatus: 'failed',
      mailError: new Error('סכום שורות הדוח אינו תואם את הסכום שנרשם במסד — הדוח לא הורכב.'),
    })

  it('נפילת-הרכבה: מוצג מצב-כשל אדום עם הודעת-השומר — ולא "אין שעות לתשלום החודש"', async () => {
    generateAndSendSalaryReport.mockResolvedValue(assemblyFailureResult())
    renderDialog()

    await screen.findByTestId('salary-report-month-button')
    await clickGenerateAndConfirm()

    const panel = await screen.findByTestId('salary-report-assembly-failure')
    expect(panel).toHaveTextContent('הדוח לא הורכב — אך השורות כבר נחתמו')
    // ההודעה של השומר מגיעה למסך מילה-במילה — `api.js` שומרת אותה ב-`mailError` בדיוק לשם כך.
    expect(panel).toHaveTextContent('סכום שורות הדוח אינו תואם את הסכום שנרשם במסד')
    expect(panel).toHaveTextContent('לא ייאספו שוב')
    expect(panel).toHaveTextContent('לא ניתן לשלוח את הדוח מההיסטוריה')
    // 🛡️ מפלה: אלה בדיוק שני הפריטים שהמסך הציג לפני התיקון — חודש חתום שנקרא כחודש ריק.
    expect(screen.queryByTestId('salary-report-empty-note')).not.toBeInTheDocument()
    expect(screen.queryByTestId('salary-report-result-table')).not.toBeInTheDocument()
  })

  it('נפילת-הרכבה: ספירת-השורות מוצגת "—" ולא 0, והחודש נגזר מהתקופה שחזרה מהמסד', async () => {
    generateAndSendSalaryReport.mockResolvedValue(assemblyFailureResult())
    renderDialog()

    await screen.findByTestId('salary-report-month-button')
    await clickGenerateAndConfirm()

    const result = await screen.findByTestId('salary-report-result')
    const countLabel = within(result).getByText('שורות בדוח:').parentElement
    expect(countLabel).toHaveTextContent('—')
    expect(countLabel).not.toHaveTextContent('0')
    // `periodLabel` הוא null במסלול הזה; התקופה עצמה (`2026-09-01`) כן חזרה מהמסד.
    expect(within(result).getByText('ספטמבר 2026')).toBeInTheDocument()
  })

  it('נפילת-הרכבה: הטוסט אינו מבטיח שליחה-חוזרת מההיסטוריה כשאין קובץ שמור', async () => {
    generateAndSendSalaryReport.mockResolvedValue(assemblyFailureResult())
    renderDialog()

    await screen.findByTestId('salary-report-month-button')
    await clickGenerateAndConfirm()

    const toast = await screen.findByTestId('toast-error')
    expect(toast).toHaveTextContent('לא ניתן לשלוח אותו שוב מההיסטוריה')
    // 🛡️ מפלה: הנוסח הישן היה גורף ("הדוח נשמר; ניתן לשלוח…") — והוא בדיוק ההבטחה השקרית.
    expect(toast).not.toHaveTextContent('הדוח נשמר')
  })

  it('כשל-שליחה עם קובץ שנשמר: הטוסט כן מפנה להיסטוריה (הענף השני של אותו תנאי)', async () => {
    generateAndSendSalaryReport.mockResolvedValue(
      generateResult({ sendResult: 'failed', sendStatus: 'failed' }),
    )
    renderDialog()

    await screen.findByTestId('salary-report-month-button')
    await clickGenerateAndConfirm()

    const toast = await screen.findByTestId('toast-error')
    expect(toast).toHaveTextContent('הדוח נשמר; ניתן לשלוח אותו שוב מההיסטוריה.')
  })

  it('כשל-RPC (למשל P0001 מהמסד) מציג את הודעת-השרת כפי-שהיא, בלי לסגור את הדיאלוג', async () => {
    generateAndSendSalaryReport.mockRejectedValue(
      new Error(
        'לא ניתן להפיק את הדוח — לפרויקט מבוטל אחד או יותר חסרות שעות סופיות לחישוב הפיצוי.',
      ),
    )
    renderDialog()

    await screen.findByTestId('salary-report-month-button')
    await clickGenerateAndConfirm()

    expect(await screen.findByTestId('salary-report-error')).toHaveTextContent(
      'חסרות שעות סופיות לחישוב הפיצוי',
    )
    expect(screen.getByTestId('salary-report-dialog')).toBeInTheDocument()
    expect(screen.queryByTestId('salary-report-result-table')).not.toBeInTheDocument()
  })

  it('sendResult=failed מציג תג "נכשל" בתוצאה (הדוח כבר נחתם ונשמר — לא נעלם)', async () => {
    generateAndSendSalaryReport.mockResolvedValue(
      generateResult({ sendResult: 'failed', sendStatus: 'failed' }),
    )
    renderDialog()

    await screen.findByTestId('salary-report-month-button')
    await clickGenerateAndConfirm()

    await screen.findByTestId('salary-report-result')
    expect(screen.getByTestId('salary-report-send-tag')).toHaveTextContent('נכשל')
  })

  it('fileError (הבאקט דחה את קובץ ה-xlsx — פגם (a) המוכר) מדווח על קובץ שלא נשמר, לא מוסתר', async () => {
    generateAndSendSalaryReport.mockResolvedValue(
      generateResult({ fileError: new Error('הבאקט דחה את סוג-הקובץ'), filePath: null }),
    )
    renderDialog()

    await screen.findByTestId('salary-report-month-button')
    await clickGenerateAndConfirm()

    await screen.findByTestId('salary-report-result')
    expect(screen.getByTestId('salary-report-send-tag')).toHaveTextContent('קובץ לא נשמר')
  })

  // ⚠️ הבדיקה הזו נועלת את הפער שנמצא בבקרה: `formatShekelWhole` (ברירת-המחדל של `Money`)
  // **מעגל**, בעוד הגיליון שהולך לרו"ח כותב את אותו תעריף ב-`#,##0.00`. תעריף שברי הוא ערך
  // אפשרי (`hourly_rate` הוא `numeric` בלי סקאלה, נכתב משדה-טקסט חופשי), ואז השורה על המסך
  // שהמנהלת מאשרת **אינה מתחברת**: 34 × 6.00 אינו 205.92.
  it('תעריף שברי מוצג במלואו והשורה מתיישבת (34.32 × 6.00 = 205.92) — ותעריף שלם נשאר "43 ₪"', async () => {
    const fractional = actualLine({ rate: 34.32, hours: 6, bonus: 0, travel: 0, lineTotal: 205.92 })
    generateAndSendSalaryReport.mockResolvedValue(
      generateResult({ lines: [fractional, compensationLine()] }),
    )
    renderDialog()

    await screen.findByTestId('salary-report-month-button')
    await clickGenerateAndConfirm()

    const table = await screen.findByTestId('salary-report-result-table')
    const row = within(table).getByText('אפרת דהן').closest('tr')

    // 🛡️ "שומר שלא נצפה נכשל אינו שומר": שתי השורות האלה מוכיחות שהבדיקה **מפלה** — הן
    // מודדות שברירת-המחדל של `Money` הייתה מדפיסה כאן "34 ₪" (הפגם), ושהצורה שנבחרה
    // משאירה תעריף שלם בדיוק כפי שהמוקאפ מצייר. בלעדיהן הבדיקה עוברת גם על הקוד השבור.
    expect(formatShekelWhole(34.32)).toBe('34 ₪')
    expect(formatShekelExact(43)).toBe('43 ₪')

    // אין עיגול: "34 ₪" אינו על המסך בכלל, וגם לא "34.00 ₪" (הצורה שהמוקאפ אינו מצייר).
    expect(within(row).getByText('34.32 ₪')).toBeInTheDocument()
    expect(within(table).queryByText('34 ₪')).not.toBeInTheDocument()
    expect(within(table).queryByText('34.00 ₪')).not.toBeInTheDocument()

    // ההתיישבות נמדדת מהמסך עצמו, לא מהפיקסצ'ר: שעות × תעריף כפי שהם **מוצגים**.
    const num = (text) => Number(text.replace(/[^\d.-]/g, ''))
    const shownHours = num(within(row).getByText('6.00').textContent)
    const shownRate = num(within(row).getByText('34.32 ₪').textContent)
    const shownTotal = num(within(row).getByText('205.92 ₪').textContent)
    expect(shownHours * shownRate).toBeCloseTo(shownTotal, 2)

    // תעריף שלם נשאר כפי שהמוקאפ המאושר מצייר — "43 ₪", לא "43.00 ₪".
    const compRow = within(table).getByText('אורלי שני').closest('tr')
    expect(within(compRow).getByText('43 ₪')).toBeInTheDocument()

    // אין שורות-אפס בדוח הזה ⇒ הערת-ההשמטה אינה מוצגת כלל.
    expect(screen.queryByTestId('salary-report-omitted-note')).not.toBeInTheDocument()
  })

  // N-4: שורת-אפס נחתמת ונרשמת אך אינה בגוף הקובץ. הכותרת סופרת את **הטבלה**
  // (screens-approved §③ של S3: "ספירה/סכימה של הטבלה"), ולכן היא חייבת להראות 3 מעל שלוש
  // שורות — ולא 2, שהוא מספר-השורות שבקובץ.
  it('שורת-אפס: הכותרת סופרת את הטבלה (3) והערת-שוליים אומרת שבקובץ יש 2', async () => {
    const zeroLine = compensationLine({
      hostessId: 3,
      hostessName: 'נועה לוי',
      idNumber: '301550999',
      hours: 0,
      rate: 41,
      lineTotal: 0,
      showInFile: false,
    })
    generateAndSendSalaryReport.mockResolvedValue(
      generateResult({ lines: [actualLine(), compensationLine(), zeroLine] }),
    )
    renderDialog()

    await screen.findByTestId('salary-report-month-button')
    await clickGenerateAndConfirm()

    const table = await screen.findByTestId('salary-report-result-table')
    expect(within(table).getByText('נועה לוי')).toBeInTheDocument()
    expect(screen.getByText('שורות בדוח:').parentElement).toHaveTextContent('3')

    const note = screen.getByTestId('salary-report-omitted-note')
    expect(note).toHaveTextContent('שורה אחת')
    expect(note).toHaveTextContent('0.00 ₪')
    expect(note).toHaveTextContent('2')
  })

  it('"ייצא ושלח" חסום כשהחודש הנבחר כבר קיים בהיסטוריה, גם בלי המתנה לרשת', async () => {
    listSalaryReports.mockResolvedValue([reportRow({ period: '2026-09-01' })])
    renderDialog()

    await screen.findByTestId('salary-report-blocked-banner')
    fireEvent.click(screen.getByTestId('salary-report-generate'))
    expect(generateAndSendSalaryReport).not.toHaveBeenCalled()
  })
})

describe('SalaryReportHistoryCard', () => {
  function renderCard(props = {}) {
    return render(
      <ToastProvider>
        <SalaryReportHistoryCard {...props} />
      </ToastProvider>,
    )
  }

  it('מציגה מצב-ריק כשאין דוחות', async () => {
    listSalaryReports.mockResolvedValue([])
    renderCard()
    expect(await screen.findByTestId('salary-history-empty')).toHaveTextContent(
      'עדיין לא הופקו דוחות',
    )
  })

  it('מציגה שורה עם תג "✓ נשלח" וכפתור-הורדה פעיל כשיש קובץ', async () => {
    const row = reportRow()
    listSalaryReports.mockResolvedValue([row])
    renderCard()

    const tr = await screen.findByTestId(`salary-history-row-${row.report_id}`)
    expect(within(tr).getByText('✓ נשלח')).toBeInTheDocument()
    expect(within(tr).getByTestId(`salary-history-download-${row.report_id}`)).toBeEnabled()
    expect(
      within(tr).queryByTestId(`salary-history-resend-${row.report_id}`),
    ).not.toBeInTheDocument()
  })

  it('שורה נכשלת עם קובץ שמור מציגה "שלח שוב" — לחיצה קוראת ל-resend ומרעננת', async () => {
    const row = reportRow({ report_id: 9, send_status: 'failed', sent_date: null })
    listSalaryReports
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([{ ...row, send_status: 'sent' }])
    resendSalaryReportMail.mockResolvedValue({
      sendResult: 'sent',
      sendStatus: 'sent',
      logFailed: false,
    })
    renderCard()

    const resendBtn = await screen.findByTestId('salary-history-resend-9')
    fireEvent.click(resendBtn)

    await waitFor(() =>
      expect(resendSalaryReportMail).toHaveBeenCalledWith({ report: row, accountantName: null }),
    )
    await waitFor(() => expect(listSalaryReports).toHaveBeenCalledTimes(2))
  })

  it('שורה נכשלת בלי קובץ שמור: כפתור "שלח שוב" קיים אך מושבת (אין מה לצרף)', async () => {
    const row = reportRow({
      report_id: 10,
      send_status: 'failed',
      report_file_url: null,
      sent_date: null,
    })
    listSalaryReports.mockResolvedValue([row])
    renderCard()

    const resendBtn = await screen.findByTestId('salary-history-resend-10')
    expect(resendBtn).toBeDisabled()
    const downloadBtn = screen.getByTestId('salary-history-download-10')
    expect(downloadBtn).toBeDisabled()
  })

  it('כפתור-ההורדה יוצר קישור-חתום ופותח אותו בכרטיסייה חדשה', async () => {
    const row = reportRow()
    listSalaryReports.mockResolvedValue([row])
    getFinanceFileSignedUrl.mockResolvedValue('https://signed.example/file.xlsx')
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => {})
    renderCard()

    fireEvent.click(await screen.findByTestId(`salary-history-download-${row.report_id}`))

    await waitFor(() => expect(getFinanceFileSignedUrl).toHaveBeenCalledWith(row.report_file_url))
    expect(openSpy).toHaveBeenCalledWith('https://signed.example/file.xlsx', '_blank')
    openSpy.mockRestore()
  })

  it('רענון מבחוץ (refreshToken) גורם לטעינה חוזרת', async () => {
    listSalaryReports.mockResolvedValue([])
    const { rerender } = renderCard({ refreshToken: 1 })
    await waitFor(() => expect(listSalaryReports).toHaveBeenCalledTimes(1))

    rerender(
      <ToastProvider>
        <SalaryReportHistoryCard refreshToken={2} />
      </ToastProvider>,
    )
    await waitFor(() => expect(listSalaryReports).toHaveBeenCalledTimes(2))
  })
})

// עוגן-חוזה שקט: `fileNameOf`/`ACCOUNTANT_EMAIL_PARAM` נצרכים מהקובץ הזה — ודא שהם עדיין
// קיימים בחוזה של api.js (לא נערך כאן; רק תזכורת-קומפילציה אם הם ייעלמו משם).
it('חוזה-הייבוא מ-api.js עדיין קיים (fileNameOf/ACCOUNTANT_EMAIL_PARAM)', () => {
  expect(typeof fileNameOf).toBe('function')
  expect(typeof ACCOUNTANT_EMAIL_PARAM).toBe('string')
})
