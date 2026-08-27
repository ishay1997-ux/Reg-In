// S3 — הפקת דוח-השכר החודשי (P4, מדריך-מיקרו §3.3) + כרטיס-ההיסטוריה שמתחת לה.
//
// 🔴 **הקובץ הזה בונה סביב מגבלה אמיתית של השכבה שמתחתיו — לא ממציא סביבה.** `api.js` עצמו
// מכריז בראשו (עוגן: `08_finance/api.js` שורות ~17-21): "אין קורא 'תצוגה-מקדימה' לדוח-השכר.
// generate_salary_report **כותבת** (מוסיפה דוח, חותמת שיבוצים, חותמת נסיעות — בלתי-הפיך),
// ואין במסד שום פונקציה שמחזירה את השורות *לפני* ההפקה". כלומר: אין דרך לקרוא-בלי-לכתוב.
// המוקאפ המאושר (`03_salary_report_approved.html`) מצייר "תצוגה-מקדימה לפני ייצא-ושלח" —
// ומסביר על-גבי עצמו שהיא **להדגמה בלבד**, מצוירת מנתוני-דמו של דוח שכבר הופק, כי אין מנגנון
// חי שממנו לשלוף אותה. ⇒ הדיאלוג כאן **אינו** מציג טבלה לפני הלחיצה על "ייצא ושלח" — היא
// הפעולה הבלתי-הפיכה היחידה, ולאחריה מוצגת אותה טבלה בדיוק (8 העמודות, אותה הצורה) כ**תוצאה**,
// לא כתחזית. זהו ממצא שדווח לישי (לא תוקן בשקט) — ר' סיכום-הבנייה.
//
// מבנה הקובץ: `SalaryReportDialog` (ברירת-מחדל — הדיאלוג עצמו) +
// `SalaryReportHistoryCard` (יצוא-נקוב — כרטיס-ההיסטוריה, כרטיס עצמאי מתחת לדיאלוג לפי
// design-contract.md §S3: "לא בתוך dlg-body"). שני הרכיבים חיים באותו קובץ כי שניהם צורכים
// את אותו `listSalaryReports()` והם חלק מאותה יחידת-מסירה (מדריך-המיקרו §2.4 מונה קובץ יחיד
// ל-S3) — מסך-הבית (S1, פזה-מקבילה אחרת) הוא זה שממקם וקושר ביניהם דרך `onGenerated`.
//
// remount-on-open: כמו כל דיאלוג בפרויקט (ScopeChangeDialog/QuoteDocumentDialog), האיפוס
// הוא באחריות הקורא דרך `key` (לעולם לא effect שמסנכרן props→state, src/CLAUDE.md).

import { useEffect, useMemo, useState } from 'react'
import { Calendar, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import Money from '@/components/Money'
import Ltr from '@/components/Ltr'
import StatusTag from '@/components/StatusTag'
import LoadingOrError from '@/components/LoadingOrError'
import { useToast } from '@/components/ToastProvider'
import { formatDate } from '@/lib/dates'
import { EMAIL_SEND_RESULT, sendResultMessage } from '@/lib/email'
import { NOT_APPLICABLE, salaryPeriodLabel } from '@/lib/salaryReport'
import {
  ACCOUNTANT_EMAIL_PARAM,
  fileNameOf,
  generateAndSendSalaryReport,
  getFinanceFileSignedUrl,
  listSalaryReports,
  resendSalaryReportMail,
} from './api'
// ⚠️ ייבוא חוצה-מודולים במכוון — לא העתקה. `getParamValue` כבר עוברת דרך `08_finance/api.js`
// עצמו (התקדים המפורש שם), וזה בדיוק אותו שימוש: קריאת `params.מייל_משרד_רואי_חשבון` לתצוגה.
import { getParamValue } from '@/modules/06_projects/closingApi'

// ---------------------------------------------------------------------------
// עזרי-תצוגה טהורים (לא לוגיקה עסקית — הכסף כבר חושב ב-`salaryReport.js`/במסד; כאן רק פריסה)
// ---------------------------------------------------------------------------

function pad2(n) {
  return String(n).padStart(2, '0')
}

function periodOf(year, month) {
  return `${year}-${pad2(month)}-01`
}

// "אוגוסט 2026" → "אוגוסט": שם-החודש הבודד לתא-בחירה בבורר. משתמש ב-SSOT של `salaryReport.js`
// (`salaryPeriodLabel`) במקום להחזיק כאן העתק שני של רשימת-שמות-החודשים בעברית — עותק שהיה
// עלול לסטות ממנה בשקט (אותה מחלה שקטלוג-הרכיבים מזהיר מפניה, src/CLAUDE.md).
function monthOnlyLabel(year, month) {
  const full = salaryPeriodLabel(periodOf(year, month))
  return full.slice(0, full.length - String(year).length).trim()
}

// ברירת-המחדל היא **החודש שהסתיים** — P4 עצמה: "מנהלת-הכספים, ידנית, **בסוף-חודש**".
function lastCompletedMonthPeriod(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), 1)
  d.setMonth(d.getMonth() - 1)
  return periodOf(d.getFullYear(), d.getMonth() + 1)
}

function parsePeriodParts(period) {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(String(period ?? ''))
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]) }
}

// "הפועלים 601-2047199" → {name:"הפועלים", numeric:"601-2047199"}. פיצול-תצוגה בלבד (לא
// חישוב) — פרטי-הבנק חוזרים כמחרוזת מורכבת-אחת מ-`salaryReport.js` (B-4: אין להם טבלה
// נפרדת), ומספר צמוד-לעברית בלי בידוד הוא בדיוק המשפחה שנתפסה תשע פעמים בפרויקט
// (src/CLAUDE.md, "מעבר-כיווניות" מופע 9): **מפרקים את הרצף**, לא עוטפים אותו שלם.
// הפורמט שמרכיב אותו (`bankDetailsOf` ב-salaryReport.js) הוא תמיד `<שם> <ענף-חשבון>` —
// רווח יחיד, ולכן פיצול-לפי-הרווח-האחרון בטוח ואינו מנחש.
function splitBankDetails(text) {
  if (!text) return null
  const idx = text.lastIndexOf(' ')
  if (idx < 0) return { name: '', numeric: text }
  return { name: text.slice(0, idx), numeric: text.slice(idx + 1) }
}

function Th({ children, className, style }) {
  return (
    <th
      style={style}
      className={cn(
        'border-b border-slate-200 px-2 py-1.5 text-right text-[11px] font-semibold whitespace-nowrap text-slate-500 align-bottom',
        className,
      )}
    >
      {children}
    </th>
  )
}

function Td({ children, className }) {
  return (
    <td className={cn('border-b border-slate-100 px-2 py-2.5 align-middle', className)}>
      {children}
    </td>
  )
}

const COLUMN_WIDTHS = ['21%', '12%', '15%', '9%', '8%', '9%', '12%', '14%']

// ---------------------------------------------------------------------------
// SalaryReportDialog — הדיאלוג עצמו
// ---------------------------------------------------------------------------

export default function SalaryReportDialog({ open, onOpenChange, onGenerated }) {
  const toast = useToast()

  const [selectedPeriod, setSelectedPeriod] = useState(() => lastCompletedMonthPeriod())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingParts, setPendingParts] = useState(() =>
    parsePeriodParts(lastCompletedMonthPeriod()),
  )

  const [history, setHistory] = useState(null) // null = טרם נטען
  const [historyError, setHistoryError] = useState('')
  const [accountantEmail, setAccountantEmail] = useState(null)

  const [phase, setPhase] = useState('select') // 'select' | 'submitting' | 'result' | 'error'
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  // נטען פעם אחת בפתיחה — לבדיקת-הכפילות-מצד-לקוח (תצוגה ג' של המוקאפ) ולעמודת "נשלח אל".
  // כשל כאן אינו חוסם את המסך: הבדיקה-האמיתית היא ה-UNIQUE במסד (T19), וזו רק נוחות-תצוגה.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    listSalaryReports()
      .then((rows) => {
        if (!cancelled) setHistory(rows)
      })
      .catch((err) => {
        if (!cancelled) setHistoryError(err?.message || 'שגיאה בטעינת היסטוריית דוחות השכר.')
      })
    getParamValue(ACCOUNTANT_EMAIL_PARAM)
      .then((value) => {
        if (!cancelled) setAccountantEmail(value)
      })
      .catch(() => {
        // לא חוסם: אם הפרמטר לא נטען, השורה המוצגת (אם בכלל) פשוט לא תישא כתובת — ר' §⑦.
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const existingForSelected = useMemo(
    () => history?.find((row) => row.period === selectedPeriod) ?? null,
    [history, selectedPeriod],
  )
  const periodLabel = useMemo(() => salaryPeriodLabel(selectedPeriod), [selectedPeriod])
  const selectedParts = useMemo(() => parsePeriodParts(selectedPeriod), [selectedPeriod])

  function openPicker() {
    setPendingParts(parsePeriodParts(selectedPeriod))
    setPickerOpen(true)
  }

  function applyPicker() {
    if (!pendingParts) return
    setSelectedPeriod(periodOf(pendingParts.year, pendingParts.month))
    setPickerOpen(false)
  }

  async function handleGenerate() {
    if (existingForSelected || phase === 'submitting') return
    setPhase('submitting')
    setErrorMessage('')
    try {
      const generated = await generateAndSendSalaryReport({
        period: selectedPeriod,
        generatedAt: new Date().toISOString(),
        // `accountantName` הוא חור-מוצר פתוח מוצהר (`api.js`, ה-JSDoc של
        // `buildSalaryReportEmailPayload`) — אין לו מקור-נתונים בשום מקום במערכת, ו-null
        // הוא בדיוק ברירת-המחדל שה-API עצמו מגדיר. לא מומצא שם כאן.
        accountantName: null,
      })
      setResult(generated)
      setPhase('result')
      onGenerated?.(generated)

      if (generated.sendResult === EMAIL_SEND_RESULT.SENT) {
        if (generated.fileError) {
          toast.error(
            'הדוח נחתם והמייל נשלח, אך שמירת קובץ ה-Excel באחסון נכשלה — לא ניתן יהיה לשלוח אותו שוב מההיסטוריה.',
          )
        } else if (generated.logFailed) {
          toast.error('הדוח נשלח, אך רישום השליחה ביומן נכשל.')
        } else {
          toast.success(
            `דוח ${generated.periodLabel} הופק ונשלח ל-${accountantEmail ?? 'רואה-החשבון'}.`,
          )
        }
      } else {
        toast.error(
          sendResultMessage(generated.sendResult, {
            failedMessage: 'שליחת דוח השכר נכשלה. הדוח נשמר; ניתן לשלוח אותו שוב מההיסטוריה.',
          }),
        )
      }
      if (generated.finalizeError) {
        toast.error('סגירת הדוח במסד נכשלה אחרי השליחה — יש לרענן ולבדוק את שורתו בהיסטוריה.')
      }
    } catch (err) {
      setErrorMessage(err?.message || 'הפקת דוח השכר נכשלה.')
      setPhase('error')
    }
  }

  function handleClose(next) {
    if (phase === 'submitting') return // לא סוגרים באמצע פעולה בלתי-הפיכה שכבר יצאה לדרך
    onOpenChange?.(next)
  }

  const blockedBannerText = existingForSelected
    ? existingForSelected.send_status === 'sent'
      ? `דוח לחודש ${periodLabel} כבר הופק. נשלח ב-${formatDate(existingForSelected.sent_date, '—')} אל ${accountantEmail ?? '—'}. לא ניתן להפיק פעמיים אותו חודש (ה-UNIQUE על period חוסם גם לחיצה-כפולה, ה9).`
      : // ⚠️ סטייה מודעת מהנוסח הנעול: הוא מניח "נשלח ב-X" — ונכון תמיד למה שהמוקאפ מצייר,
        // אבל דוח קיים יכול גם לעמוד על `pending`/`failed` (למשל תקלת-סגירה, ר' סיכום-הבנייה).
        // אמירת "נשלח ב-" על דוח שלא נשלח הייתה שקר; הנוסח כאן נשאר קרוב אך כן.
        `דוח לחודש ${periodLabel} כבר הופק (מספר ${existingForSelected.report_id}, סטטוס-שליחה: ${
          existingForSelected.send_status === 'failed' ? 'נכשל' : 'בהפקה'
        }). לא ניתן להפיק פעמיים אותו חודש (ה-UNIQUE על period חוסם גם לחיצה-כפולה, ה9).`
    : ''

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir="rtl" className="sm:max-w-3xl" data-testid="salary-report-dialog">
        <DialogHeader>
          <DialogTitle>הפקת דוח-שכר חודשי</DialogTitle>
          <DialogDescription>
            אוספת את כל שורות-השכר שטרם שולמו עד סוף החודש שנבחר — פרויקטים שנסגרו תפעולית ופרויקטים
            שבוטלו-בדמי-ביטול (ה15).
          </DialogDescription>
        </DialogHeader>

        {phase !== 'result' && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <span className="text-[11.5px] text-slate-500">חודש להפקה:</span>
            {pickerOpen ? (
              <div className="flex items-center gap-1.5" data-testid="salary-report-month-picker">
                {/* בורר-חודש: אין תקדים-קוד לרכיב הזה בכלל (design-contract §S3 — "נבנה
                    מאפס"), ולכן אין חובה לעטוף ב-Select של Radix — `<select>` טבעי כאן פשוט,
                    נגיש-מקלדת ונמנע מהיתלות בהתנהגות-pointer של Radix שאין לה תקדים-בדיקה
                    בפרויקט הזה (0 קבצי-בדיקה קיימים שמפעילים Select אמיתי תחת jsdom). */}
                <select
                  value={pendingParts?.month ?? ''}
                  onChange={(e) =>
                    setPendingParts((prev) => ({
                      year: prev?.year ?? new Date().getFullYear(),
                      month: Number(e.target.value),
                    }))
                  }
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-800"
                  aria-label="חודש"
                  data-testid="salary-report-month-select"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {monthOnlyLabel(pendingParts?.year ?? new Date().getFullYear(), m)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  dir="ltr"
                  value={pendingParts?.year ?? ''}
                  onChange={(e) =>
                    setPendingParts((prev) => ({
                      month: prev?.month ?? 1,
                      year: Number(e.target.value),
                    }))
                  }
                  className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-800"
                  data-testid="salary-report-year-input"
                  aria-label="שנה"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={applyPicker}
                  className="h-auto rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                  data-testid="salary-report-month-apply"
                >
                  אישור
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerOpen(false)}
                  className="h-auto rounded-lg px-3 py-1.5 text-xs font-semibold"
                  data-testid="salary-report-month-cancel"
                >
                  ביטול
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openPicker}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-800"
                data-testid="salary-report-month-button"
              >
                <Calendar className="size-3.5" aria-hidden="true" />
                <span>
                  {monthOnlyLabel(selectedParts.year, selectedParts.month)}{' '}
                  <Ltr>{selectedParts.year}</Ltr>
                </span>
              </button>
            )}
          </div>
        )}

        {/* בדיקת-הכפילות-מצד-לקוח היא נוחות-תצוגה בלבד (ה-UNIQUE במסד הוא האכיפה האמיתית,
            T19) — כשל בטעינת ההיסטוריה לא חוסם, אבל נאמר בקול כדי שהמנהלת לא תניח שקיבלה
            בדיקה שלא בוצעה. */}
        {phase === 'select' && historyError && (
          <p className="text-[11.5px] text-amber-700" role="status">
            לא ניתן היה לבדוק אם החודש כבר הופק ({historyError}) — הבדיקה הסופית תמיד תתבצע במסד
            בלחיצה על "ייצא ושלח".
          </p>
        )}

        {phase === 'select' && existingForSelected && (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12.5px] leading-relaxed text-amber-800"
            role="alert"
            data-testid="salary-report-blocked-banner"
          >
            <b className="mb-0.5 block text-[13.5px]">{blockedBannerText}</b>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleClose(false)}
              className="mt-2 h-auto rounded-lg px-2.5 py-1 text-xs font-semibold"
              data-testid="salary-report-view-existing"
            >
              צפייה בדוח הקיים ↑
            </Button>
          </div>
        )}

        {phase === 'error' && (
          <p
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
            data-testid="salary-report-error"
          >
            {errorMessage}
          </p>
        )}

        {phase === 'result' && result && <ResultView result={result} />}

        <DialogFooter>
          {phase === 'result' ? (
            <Button
              type="button"
              onClick={() => handleClose(false)}
              className="h-auto rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700"
              data-testid="salary-report-close"
            >
              סגירה
            </Button>
          ) : (
            <>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={Boolean(existingForSelected) || phase === 'submitting'}
                className="h-auto rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                data-testid="salary-report-generate"
              >
                {phase === 'submitting' ? 'מפיקה ושולחת…' : 'ייצא ושלח'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={phase === 'submitting'}
                className="h-auto rounded-lg px-4 py-2 font-semibold"
                data-testid="salary-report-cancel"
              >
                ביטול
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// תוצאת ה-"ייצא ושלח" — אותה טבלה שהמוקאפ מצייר כ"תצוגה-מקדימה", מוצגת **אחרי** ההפקה
// (ר' הערת-הראש של הקובץ). `result` הוא הערך שמחזירה `generateAndSendSalaryReport`.
function ResultView({ result }) {
  const lines = result.lines ?? []
  const totals = result.totals
  const hasTravel = lines.some((l) => (l.travel ?? 0) > 0)
  // כמה שורות נחתמו אך אינן בגוף הקובץ (N-4: שורת-אפס נרשמת כדי שלא תיאסף שוב, ואינה
  // נכנסת לקובץ). בדרך-כלל 0 — ואז ההערה שלמטה לא מוצגת כלל.
  const omittedFromFile =
    typeof totals?.fileLineCount === 'number' ? lines.length - totals.fileLineCount : 0

  return (
    <div data-testid="salary-report-result">
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]">
        <span>
          <span className="text-[11.5px] text-slate-500">חודש שהופק:</span>{' '}
          <b>{result.periodLabel}</b>
        </span>
        <span>
          {/* `lineCount` ולא `fileLineCount`: כרטיס-המסך מגדיר את המספר הזה כ"ספירה/סכימה
              של הטבלה" (screens-approved §③ של S3), והטבלה שמתחתיו מציגה **כל** שורה שנחתמה
              — כולל שורות-האפס ש-N-4 משמיט מגוף-הקובץ. `fileLineCount` היה מציג "4" מעל חמש
              שורות נראות. הפער עצמו נאמר בקול בהערת-השוליים שמתחת לטבלה. */}
          <span className="text-[11.5px] text-slate-500">שורות בדוח:</span>{' '}
          <Ltr>{totals?.lineCount ?? lines.length}</Ltr>
        </span>
        <span>
          <span className="text-[11.5px] text-slate-500">סה"כ לתשלום:</span>{' '}
          <b>
            <Money amount={totals?.total} cents />
          </b>
        </span>
        <SendResultTag result={result} />
      </div>

      {lines.length === 0 ? (
        <p
          className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600"
          data-testid="salary-report-empty-note"
        >
          אין שעות לתשלום החודש.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full table-fixed text-[13.5px]"
            data-testid="salary-report-result-table"
          >
            <thead>
              <tr>
                {['דיילת', 'ת"ז', 'פרטי-בנק', 'שעות', 'תעריף', 'בונוס', 'נסיעות', 'סה"כ'].map(
                  (label, i) => (
                    <Th key={label} className="text-right" style={{ width: COLUMN_WIDTHS[i] }}>
                      {label}
                    </Th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => {
                const bank = splitBankDetails(line.bankDetails)
                return (
                  <tr key={`${line.hostessId}-${line.sourceProjectId}-${i}`}>
                    <Td>
                      <div className="font-semibold text-slate-800">{line.hostessName}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        פרויקט <Ltr>#{line.sourceProjectId}</Ltr> · {line.basisLabel}
                      </div>
                    </Td>
                    <Td>
                      <Ltr>{line.idNumber}</Ltr>
                    </Td>
                    <Td>
                      {bank ? (
                        <span>
                          {bank.name} <Ltr>{bank.numeric}</Ltr>
                        </span>
                      ) : (
                        <span className="text-slate-400">{NOT_APPLICABLE}</span>
                      )}
                    </Td>
                    <Td>
                      <div className="font-semibold">
                        <Ltr>{Number(line.hours).toFixed(2)}</Ltr>
                      </div>
                      <div className="mt-0.5 text-[10.5px] text-slate-500">{line.hoursLabel}</div>
                    </Td>
                    <Td>
                      {/* `exact` ולא ברירת-המחדל: `formatShekelWhole` **מעגל** (`Math.round`),
                          והתעריף כאן הוא הנתון עצמו — `hourly_rate` הוא `numeric` בלי סקאלה
                          (docs/schema.sql), נכתב משדה-טקסט חופשי, ולכן 34.32 הוא ערך אפשרי.
                          עיגול שלו ל-"34 ₪" **שובר את השורה בעין**: לצידו מוצגות שעות ב-2
                          ספרות ו-`lineTotal` באגורות, ו-`salaryReport.js` כותב לגיליון שהולך
                          לרו"ח את אותו שדה ב-`#,##0.00`. `exact` מציג אגורות רק כשהן קיימות,
                          ולכן תעריף שלם נשאר "45 ₪" — בדיוק כפי שהמוקאפ המאושר מצייר וכפי
                          שארבעת אתרי-הקריאה הקיימים של אותו שדה מציגים (TeamTab, RepositoryTab,
                          HostessViewCard, PublicConfirmPage). */}
                      <Money amount={line.rate} exact />
                    </Td>
                    <Td>
                      {line.bonus === null ? (
                        <span className="text-slate-400">{NOT_APPLICABLE}</span>
                      ) : (
                        <Money amount={line.bonus} cents />
                      )}
                    </Td>
                    <Td>
                      {line.travel === null ? (
                        <span className="text-slate-400">{NOT_APPLICABLE}</span>
                      ) : (
                        <Money amount={line.travel} cents />
                      )}
                    </Td>
                    <Td>
                      <span className="font-bold">
                        <Money amount={line.lineTotal} cents />
                      </span>
                    </Td>
                  </tr>
                )
              })}
              <tr className="bg-slate-50">
                <Td className="font-bold border-t-2 border-slate-300">סה"כ</Td>
                <Td className="border-t-2 border-slate-300 text-slate-400">{NOT_APPLICABLE}</Td>
                <Td className="border-t-2 border-slate-300 text-slate-400">{NOT_APPLICABLE}</Td>
                <Td className="border-t-2 border-slate-300 text-slate-400">{NOT_APPLICABLE}</Td>
                <Td className="border-t-2 border-slate-300 text-slate-400">{NOT_APPLICABLE}</Td>
                <Td className="border-t-2 border-slate-300 font-bold">
                  <Money amount={totals?.bonusTotal} cents />
                </Td>
                <Td className="border-t-2 border-slate-300 font-bold">
                  <Money amount={totals?.travelTotal} cents />
                </Td>
                <Td className="border-t-2 border-slate-300 font-bold">
                  <Money amount={totals?.total} cents />
                </Td>
              </tr>
            </tbody>
          </table>

          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11.5px] leading-relaxed text-slate-600">
            {hasTravel && (
              <p>
                נסיעות מחושבות לפי הפרמטר החי <code>סכום_נסיעות_למשמרת</code> נכון לרגע ההפקה —
                הסכום עדיין טעון אימות מול רואה-החשבון (§7.69).
              </p>
            )}
            <p>
              <b>בונוס/נסיעות בשורות-פיצוי-ביטול:</b> "{NOT_APPLICABLE}" ולא 0.00 ₪ — נוסחת-ה24
              (הפיצוי) אינה כוללת רכיב-בונוס, וה29 קובע במפורש שאין נסיעות למשמרת שבוטלה.
            </p>
            {omittedFromFile > 0 && (
              <p data-testid="salary-report-omitted-note">
                <b>שורות שאינן בגוף הקובץ:</b>{' '}
                {omittedFromFile === 1 ? (
                  'שורה אחת'
                ) : (
                  <>
                    <Ltr>{omittedFromFile}</Ltr> שורות
                  </>
                )}{' '}
                בסכום <Money amount={0} cents /> נחתמו ונרשמו כדי שלא ייאספו שוב, ואינן נכללות בגוף
                הקובץ שנשלח (N-4). בקובץ עצמו <Ltr>{totals.fileLineCount}</Ltr> שורות.
              </p>
            )}
            <p>
              <b>🔒 פרטי-הבנק</b> מוצגים מהטבלה המוגנת (<code>hostess_bank_details</code>, ה19) —
              קריאה בהרשאת 'כספים' בלבד.
            </p>
          </div>
        </div>
      )}

      {result.linesMissingBankDetails?.length > 0 && (
        <p
          className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[12px] text-amber-800"
          data-testid="salary-report-missing-bank"
        >
          שימו לב: לדיילות הבאות אין פרטי-בנק שמורים בדוח שנשלח —{' '}
          {result.linesMissingBankDetails.join(', ')}.
        </p>
      )}
    </div>
  )
}

function SendResultTag({ result }) {
  if (result.fileError) {
    return <StatusTag label="נשלח — קובץ לא נשמר" tone="warn" testId="salary-report-send-tag" />
  }
  if (result.sendResult === EMAIL_SEND_RESULT.SENT) {
    return <StatusTag label="✓ נשלח" tone="ok" testId="salary-report-send-tag" />
  }
  if (result.sendResult === EMAIL_SEND_RESULT.UNKNOWN) {
    return <StatusTag label="סטטוס-שליחה לא ידוע" tone="warn" testId="salary-report-send-tag" />
  }
  return <StatusTag label="נכשל" tone="danger" testId="salary-report-send-tag" />
}

// ---------------------------------------------------------------------------
// SalaryReportHistoryCard — כרטיס-ההיסטוריה (design-contract §S3: card עצמאי, לא בתוך הדיאלוג)
// ---------------------------------------------------------------------------

// `refreshToken`: כל ערך שמשתנה גורם לרענון (S1 מעביר מונה שהוא מגדיל ב-`onGenerated` של
// הדיאלוג). הכרטיס עצמו לא תלוי בדיאלוג ולא יודע עליו — כל מה שהוא צריך הוא איתות-לרענון.
export function SalaryReportHistoryCard({ refreshToken }) {
  const toast = useToast()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [accountantEmail, setAccountantEmail] = useState(null)
  const [resendingId, setResendingId] = useState(null)
  // ‏"ניסי-שוב" ורענון-אחרי-שליחה-חוזרת בונים ערך חדש ל-effect לתלות בו, במקום לקרוא
  // ל-setState בגוף-ה-effect עצמו (שער `react-hooks/set-state-in-effect`) — אותו דפוס
  // כמו `reloadTick` ב-LogisticsPage.jsx.
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    listSalaryReports()
      .then((data) => {
        if (!cancelled) {
          setRows(data)
          setError('')
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'שגיאה בטעינת היסטוריית דוחות השכר.')
      })
    getParamValue(ACCOUNTANT_EMAIL_PARAM)
      .then((value) => {
        if (!cancelled) setAccountantEmail(value)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [refreshToken, reloadTick])

  const retry = () => setReloadTick((t) => t + 1)

  async function handleDownload(row) {
    if (!row.report_file_url) return
    try {
      const url = await getFinanceFileSignedUrl(row.report_file_url)
      window.open(url, '_blank')
    } catch (err) {
      toast.error(err?.message || 'הורדת קובץ הדוח נכשלה.')
    }
  }

  async function handleResend(row) {
    setResendingId(row.report_id)
    try {
      const outcome = await resendSalaryReportMail({ report: row, accountantName: null })
      if (outcome.sendResult === EMAIL_SEND_RESULT.SENT) {
        toast.success(`דוח ${salaryPeriodLabel(row.period)} נשלח שוב.`)
      } else {
        toast.error(
          sendResultMessage(outcome.sendResult, {
            failedMessage: 'השליחה החוזרת נכשלה. אפשר לנסות שוב מכאן.',
          }),
        )
      }
      retry()
    } catch (err) {
      toast.error(err?.message || 'השליחה החוזרת נכשלה.')
    } finally {
      setResendingId(null)
    }
  }

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      data-testid="salary-history-card"
    >
      <h3 className="mb-2.5 text-sm font-bold text-slate-800">היסטוריית דוחות-שכר</h3>
      {rows === null && !error ? (
        <LoadingOrError loading skeleton={{ variant: 'table' }} />
      ) : error ? (
        <LoadingOrError
          error={error}
          onRetry={retry}
          retryLabel="נסי שוב"
          retryTestId="salary-history-retry"
        />
      ) : rows?.length === 0 ? (
        <div
          className="flex flex-col items-center gap-1 py-8 text-center"
          data-testid="salary-history-empty"
        >
          <p className="text-[13.5px] font-medium text-slate-600">עדיין לא הופקו דוחות</p>
          <p className="text-xs text-slate-500">דוחות שיופקו ויישלחו יופיעו כאן</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-[13.5px]">
            <thead>
              <tr>
                <Th style={{ width: '18%' }}>תקופה</Th>
                <Th style={{ width: '14%' }}>סטטוס</Th>
                <Th style={{ width: '16%' }}>נשלח בתאריך</Th>
                <Th style={{ width: '26%' }}>נשלח אל</Th>
                <Th style={{ width: '14%' }}>סה"כ ששולם</Th>
                <Th style={{ width: '12%' }}>קובץ</Th>
              </tr>
            </thead>
            <tbody>
              {rows?.map((row) => (
                <tr key={row.report_id} data-testid={`salary-history-row-${row.report_id}`}>
                  <Td>{salaryPeriodLabel(row.period)}</Td>
                  <Td>
                    <StatusTag
                      label={
                        row.send_status === 'sent'
                          ? '✓ נשלח'
                          : row.send_status === 'failed'
                            ? 'נכשל'
                            : 'בהפקה'
                      }
                      tone={
                        row.send_status === 'sent'
                          ? 'ok'
                          : row.send_status === 'failed'
                            ? 'danger'
                            : 'muted'
                      }
                    />
                  </Td>
                  <Td>
                    <Ltr>{formatDate(row.sent_date, '—')}</Ltr>
                  </Td>
                  <Td className="truncate">
                    <Ltr>{accountantEmail ?? '—'}</Ltr>
                  </Td>
                  <Td>
                    <Money amount={row.total_amount} cents />
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!row.report_file_url}
                        title={
                          row.report_file_url
                            ? fileNameOf(row.report_file_url)
                            : 'הקובץ לא נשמר באחסון'
                        }
                        onClick={() => handleDownload(row)}
                        className="h-auto rounded-lg px-2 py-1 text-[11px] font-semibold"
                        data-testid={`salary-history-download-${row.report_id}`}
                      >
                        <Download className="size-3.5" aria-hidden="true" />
                        הורדה
                      </Button>
                      {row.send_status === 'failed' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!row.report_file_url || resendingId === row.report_id}
                          title={
                            row.report_file_url ? undefined : 'אין קובץ שמור — לא ניתן לשלוח שוב'
                          }
                          onClick={() => handleResend(row)}
                          className="h-auto rounded-lg px-2 py-1 text-[11px] font-semibold"
                          data-testid={`salary-history-resend-${row.report_id}`}
                        >
                          {resendingId === row.report_id ? 'שולחת…' : 'שלח שוב'}
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
