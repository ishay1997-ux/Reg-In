// חלון סגירת-תיק הפרויקט — מודול 8 · משטח S2 (צעד 3.2).
//
// זהו **מנוע-ההתקדמות של הכסף**: כרטיס-P1 (חשבונית → תשלום), כרטיס-P3 (הקפאת-רווח, ארכוב,
// חוב-אבוד) וענף דמי-הביטול (§7.20ג) חיים כולם כאן. כל מה שהוא כתיבה במודול עובר במסך הזה.
//
// ── ארבע ההכרעות שמעצבות את הקובץ ────────────────────────────────────────────────────
//
// 🔴 **① הדיאלוג אינו סומך על השורה ששיגרה אותו.** ‏S1 הוא תצלום-רגע; מנהלת שהשאירה את
//    המסך פתוח חצי שעה עלולה לפתוח חלון על פרויקט שכבר שינה מצב. ⇒ **כל שער, כל נעילה וכל
//    כפתור נגזרים מ-`getFinanceDetail()` שנקרא בפתיחה**, לעולם לא מ-`project` שהגיע כ-prop.
//    זהו בדיוק ㊲ של `ChecklistDialog` (מודול 5), שם אותה טעות סימנה "מוכן" על פרויקט מבוטל.
//    ‏**שני שדות-תצוגה בלבד** נלקחים מה-prop, כי ה-RPC של S2 אינו מחזיר אותם כלל
//    (‏`operationally_closed_at`, ‏`credit_note_flag` — שניהם ב-`get_finance_overview` ואינם
//    ב-`get_project_finance_detail`); הם **תצוגה בלבד ואינם מגדרים שום פעולה**.
//
// 🔴 **② שער-הצורה נקרא לפני כל גזירה** (הכרעת-מתאם, צעד 3.2): כל שורת-RPC עוברת
//    `assertFinanceShape` עם רשימת-השדות שהמסך באמת קורא. עמודה שנמחקה או ששמה השתנה
//    **תפיל את המסך ברעש** במקום להתפרש כ-`—` בכל שורה — וזו כל הסיבה שהגזירות עצמן
//    (`src/lib/projectFinance.js`) מותר להן להישאר פשוטות.
//
// 🔴 **③ אין חשבון-כסף אחד ב-UI.** ‏`finance_project_money` במסד הוא מקור-האמת היחיד
//    (F16/R1-4). לכן תחשיב-המאזן כאן **מציג את רכיבי-ההוצאה כפי שהשרת החזיר אותם** ואינו
//    מסכם אותם לשורת-"הוצאות" אחת: סכימה ב-UI הייתה מוסיפה מחשבון שני לאותו מספר, ורכיב
//    אחד שחוזר `null` היה מכווץ את הסכום בשקט. **החריג היחיד**, ומוצהר: תת-הסכום של
//    שורת-השירות-הידנית בדמי-הביטול — מספר שהמנהלת עצמה הקלידה, שאינו נשמר בשום מקום
//    ואינו מגיע מהמסד (ה28: נשמרים הסכום-הסופי וההערה בלבד).
//
// 🔴 **④ ‏`—` ולעולם לא `0`.** ‏`null` כאן הוא חוסר-נתון **שנמדד** (אין שעות-סופיות ⇒ אין
//    סטיית-תקציב, ‏T7/A-8), ואפס-שקט במקומו הוא החטא המרכזי של המודול (§4.3).
//
// ── מה המסך הזה **אינו** מכיל, במכוון ────────────────────────────────────────────────
// · **אין כפתור שליחת/שליחה-חוזרת של סקר-המשוב** (ה11/§7.92 — מ6 שולח, מ8 אינו שולח דבר).
// · **אין שדה מספר-חשבונית** (B-10/§7.38 — שם-הקובץ הוא כל הזהות שהמערכת שומרת).
// · **אין ארכוב לפרויקט מבוטל** — האילוץ `projects_closed_needs_report` אוסר זאת פיזית,
//   והרווח שלו נקפא ברגע פתרון דמי-הביטול (Q-4), לא בארכוב.
// · **אין אריח "חוסר בסחורה שהוזמנה"** אף שהתצוגה המאושרת מציירת אותו:
//   ‏`get_project_finance_detail` אינו מחזיר כמות-מוזמנת מול כמות-שהגיעה, ומנהלת-הכספים
//   **חסומה ב-RLS** מ'לוגיסטיקה' (קריאה חסומה מחזירה `[]` בלי שגיאה). ⇒ פער-נתונים
//   מדווח, לא מסך שממציא מספר.

import { useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Ltr from '@/components/Ltr'
import Money from '@/components/Money'
import RatingStars from '@/components/RatingStars'
import StatTile from '@/components/StatTile'
import StatusTag from '@/components/StatusTag'
import LoadingOrError from '@/components/LoadingOrError'
import PermissionAwareEmpty from '@/components/PermissionAwareEmpty'
import { useConfirm } from '@/components/ConfirmDialog'
import { useToast } from '@/components/ToastProvider'
import { cn } from '@/lib/utils'
import { formatDate, formatTimestampFull } from '@/lib/dates'
import { toAgorot, toShekels } from '@/lib/pricing'
import { PROJECT_STATUS_LABELS } from '@/lib/projects'
import { EMAIL_SEND_RESULT, sendResultMessage } from '@/lib/email'
import { assertFinanceShape, scoreTag, scoreTagText } from '@/lib/projectFinance'
import {
  CANCELLATION_FEE_ACTIONS,
  INVOICE_FILE_REQUIRED_NOTE,
  archiveProject,
  fileNameOf,
  getBillingContact,
  getCancellationFeeProposal,
  getFinanceDetail,
  recordFeedback,
  recordPayment,
  recordWriteOff,
  resolveCancellationFee,
  sendInvoiceAndRecord,
  validateInvoiceFile,
} from './api'

// ── חוזי-הצורה: בדיוק השדות שהמסך הזה קורא, לא יותר ─────────────────────────────────
// ⚠️ רשימה שמונה שדה שאיננו קוראים הייתה הופכת כל ניקוי-עמודה עתידי לתקלת-מסך מדומה;
// רשימה שמדלגת על שדה שכן נקרא הייתה מחזירה בדיוק את ה-`—`-השקט ששער-הצורה קיים נגדו.
const DETAIL_FIELDS = [
  'project_id',
  'event_name',
  'customer_id',
  'customer_name',
  'project_status',
  'revenue',
  'goods_cost',
  'labor_cost',
  'travel_cost',
  'gross_profit',
  'budget_deviation',
  'final_profit',
  'cancellation_fee',
  'cancellation_fee_note',
  'written_off',
  'written_off_reason',
  'invoice_file_url',
  'invoice_sent',
  'invoice_sent_at',
  'payment_date',
  'feedback_status',
  'feedback_score',
  'negative_feedback_reason',
  'feedback_notes',
  'cancelled_at',
  'cancel_type',
  'archived_at',
]

const PROPOSAL_FIELDS = [
  'compensation_pct',
  'hours_before_event',
  'team_compensation',
  'goods_at_price',
  'proposed_fee',
  'planned_hours',
  'compensated_count',
]

// 🔤 חמש סיבות-הבירור — **זהות-בייט ל-CHECK החי** ולרשימה שבמוקאפ המאושר. תו אחד שונה
// ⇒ המסד דוחה את השמירה בהודעה שמדברת על אילוץ ולא על הטופס.
const FEEDBACK_REASONS = ['איחור דיילות', 'תפקוד דיילות', 'איכות תגים', 'ניהול לקוי', 'אחר']

// 🔤 נוסחים שנקראו מילולית מהמוקאפ המאושר `02_closing_window_approved.html`.
const INVOICE_BANNER_TITLE = 'המערכת אינה מפיקה חשבונית (§7.38).'
const INVOICE_BANNER_BODY =
  'יש להכין אותה בתוכנת הנהלת-החשבונות ולהעלות כאן — PDF או תמונה, עד 10MB.'
const INVOICE_SEND_TITLE = 'יש לבחור קובץ-חשבונית לפני השליחה'
const WAIVE_TITLE = 'מאפס את הסכום ל-0 ומחייב הערה — לא מחיקה שקטה'
const WRITE_OFF_TITLE = 'חוב-אבוד — הרווח נקפא כרגיל, בסיס-צבירה'
const CANCEL_ACTIONS_NOTE =
  '"ויתור" = פעולה מפורשת (סכום 0 + הערת-חובה), לא מחיקה שקטה (P1). "סגור ללא תשלום" = מסלול חוב-אבוד — הפרויקט מקבל תג "הסתיים — לא שולם"; הרווח נקפא גם בלי גבייה בפועל, כי הבסיס הוא צבירה (P3).'
const FEE_STORAGE_NOTE =
  'נשמר במסד: הסכום הסופי וההערה בלבד — שלושת הרכיבים שלמעלה נגזרים-מחדש לתצוגה בכל פתיחה, ולא נשמרים כעמודות נפרדות (ה28).'
const LOCKED_BANNER_BODY = 'הרווח-הסופי קפוא ואינו ניתן לעריכה (P3). כל השדות שלמטה לעיון בלבד.'
const CREDIT_NOTE_LINE = 'נדרשת חשבונית זיכוי'
const FEEDBACK_REASON_GATE =
  'חסום: ציון מתחת ל-3 מחייב בחירת סיבת-בירור מהרשימה, אחרי בירור טלפוני (כרטיס-P2).'
// שני הנוסחים שהיו חסרים: עד כה "שמור סטטוס" נכבה גם בשני המצבים האלה **בלי מילה על המסך**.
// ‏A-1 (הכרעת-הבלופרינט) קובעת disabled-with-reason כדפוס-הבית; כפתור מת בלי סיבה הוא בדיוק
// מה שהיא נכתבה נגדו. ⚠️ **הנוסח של "אין ציון" מראה את מה שהמסד יענה בלאו הכי**
// (‏`record_feedback`: "יש לבחור ציון בין 1 ל-5") — המסך והשרת אומרים אותו דבר.
const FEEDBACK_SCORE_GATE = 'חסום: יש לבחור ציון בין 1 ל-5, או לסמן "לא ענה לסקר".'
const FEEDBACK_UNCHANGED_GATE = 'אין שינוי לשמור — עדכני ציון, סיבה או הערות.'
// 🔤 נלקח מילולית מהודעת-השרת שב-`api.js` (‏`NO_BILLING_EMAIL`) — המסך והשרת אומרים את
// אותו משפט, כדי שמנהלת שראתה את החסימה מראש לא תקבל ניסוח אחר אחרי לחיצה.
const NO_BILLING_EMAIL_NOTE =
  'חסום: אין כתובת מייל לחיוב בכרטיס הלקוח — לא ניתן לשלוח את החשבונית. יש להשלים אותה בכרטיס הלקוח.'
// A-8 — שעות-סופיות חסרות: משפט רועש, לעולם לא 0 שקט.
// ⚠️ **שני נוסחים ולא אחד, בכוונה.** אותו חוסר-נתון (‏`final_start/end_time` ריקים) מפיל
// שני חישובים שונים, ו-A-8 מנסח את משפטו על **רכיב-הפיצוי** בלבד. אריח סטיית-התקציב אינו
// מחשב פיצוי כלל — משפט שמדבר על "פיצוי" מתחת לתווית "סטיית-תקציב" קורא כמו תקלה במסך.
const NO_PLANNED_HOURS_NOTE = 'לא ניתן לחשב פיצוי — חסרות שעות סופיות'
const NO_DEVIATION_NOTE = 'לא ניתן לחשב סטייה — חסרות שעות סופיות'
const ARCHIVE_CONFIRM_MESSAGE =
  'הרווח הסופי ייקפא בשקלים, התיק יינעל לצמיתות וקישור-המשוב של הלקוח יבוטל. אין ביטול לפעולה.'
const WRITE_OFF_CONFIRM_MESSAGE =
  'הפרויקט ייסגר כחוב אבוד: הרווח ייקפא גם בלי גבייה בפועל, והסיבה תישמר. אין ביטול לפעולה.'
const WAIVE_CONFIRM_MESSAGE =
  'דמי-הביטול ייקבעו על 0 ₪, ההערה תישמר, והרווח ייקפא כהפסד רשום. אין ביטול לפעולה.'
const INVOICE_SEND_FAILED_MESSAGE = 'החשבונית לא נשלחה והפרויקט לא סומן כ"נשלח". יש לנסות שוב.'

// ── שער-הארכוב (ה10 / כרטיס-P3) ──────────────────────────────────────────────────────
// המשפט **נבנה ממה שבאמת חסר**, ואינו מחרוזת קבועה: המוקאפ צייר מופע אחד שלו (חשבונית
// טרם נשלחה + משוב תקין), וארבעת המצבים האחרים חייבים לומר את האמת שלהם. מחזיר `null`
// כשהשער פתוח — ואז הכפתור פעיל ואין הערה.
// eslint-disable-next-line react-refresh/only-export-components -- פונקציה טהורה שנועלת נוסח-שער; Fast Refresh נוגע לגרנולריות בפיתוח בלבד (התקדים: ConfirmDialog / PermissionAwareEmpty)
export function archiveGateNote({
  invoiceSent,
  paid,
  writtenOff,
  feedbackResolved,
  feedbackScore,
  feedbackReason,
}) {
  const paymentOk = Boolean(paid) || Boolean(writtenOff)

  // 🔴 השער השלישי, שהמסך לא הכיר עד שנמדד: המסד חוסם ארכוב גם כשהמשוב "נפתר" אבל
  // הציון נמוך מ-3 ואין סיבה (‏`archive_project`, מיגרציה F). המסלול אינו תיאורטי —
  // הדף הציבורי **אינו יודע לקבל סיבה**, ולכן לקוח שהגיש 2 יוצר בדיוק את המצב הזה.
  // בלי השורה הזאת הכפתור נראה פעיל, המנהלת לוחצת, והשרת עונה P0001.
  const lowScoreNeedsReason =
    feedbackScore != null &&
    Number(feedbackScore) < 3 &&
    (feedbackReason == null || String(feedbackReason).trim() === '')
  const feedbackOk = Boolean(feedbackResolved) && !lowScoreNeedsReason
  if (paymentOk && feedbackOk) return null

  const missing = []
  if (!paymentOk) {
    missing.push(invoiceSent ? 'לא נרשם תאריך-תשלום' : 'חשבונית טרם נשלחה ולא נרשם תאריך-תשלום')
  }
  if (!feedbackResolved) missing.push('המשוב טרם נפתר')
  else if (lowScoreNeedsReason) {
    missing.push(`הלקוח נתן ציון ${feedbackScore} ונדרשים בירור טלפוני ובחירת סיבה`)
  }

  // השורה השנייה קיימת רק כשצד אחד תקין — "שניהם חסרים" לא צריך לספר מה כן בסדר.
  let ok = ''
  if (paymentOk) ok = ' התשלום כאן כבר תקין; המשוב עדיין חסר.'
  else if (feedbackOk) ok = ' המשוב כאן כבר תקין; התשלום עדיין חסר.'

  return `🔒 חסום: ${missing.join(', ו')} — שער-הארכוב דורש גם תשלום וגם משוב-פתור (ה10 / כרטיס-P3).${ok}`
}

// המזהה שאליו מצביעים גם הכפתור החסום וגם ה-select — הערך יחיד בדיאלוג, ולכן קבוע ולא נגזר.
const FEEDBACK_GATE_ID = 'closing-feedback-gate-note'
const ARCHIVE_GATE_ID = 'closing-archive-gate-note'

// שער "שמור סטטוס" — אותה צורה בדיוק כמו `archiveGateNote`: `null` ⇒ פתוח, אחרת **המשפט**
// שיוצג ליד הכפתור. עד כה שלושת הענפים חיו כבוליאני אחד, ושניים מהם כיבו את הכפתור בשתיקה.
// eslint-disable-next-line react-refresh/only-export-components -- פונקציה טהורה שנועלת נוסח-שער, כמו `archiveGateNote` שמעליה
export function feedbackGateNote({ score, reason, touched }) {
  if (score == null) return FEEDBACK_SCORE_GATE
  if (score < 3 && String(reason ?? '').trim() === '') return FEEDBACK_REASON_GATE
  if (!touched) return FEEDBACK_UNCHANGED_GATE
  return null
}

// מצב-המסך נגזר **פעם אחת** מהשורה הטרייה, וכל הבלוקים קוראים ממנו. פונקציה טהורה
// כדי שהמעבר בין המצבים ייבדק בלי דפדפן, ומיוצאת כי הבדיקה נועלת אותה ישירות.
// eslint-disable-next-line react-refresh/only-export-components -- כנ"ל: מכונת-מצבים טהורה, לא רכיב
export function closingPhase(detail) {
  const status = detail?.project_status
  const cancelled = status === 'cancelled'
  const archived = detail?.archived_at != null || status === 'finished'
  const feeSet = detail?.cancellation_fee != null
  const writtenOff = detail?.written_off === true
  // 🔗 מראת Q-4 — פרויקט מבוטל "נפתר" ברגע שהרווח שלו נקפא (תשלום / ויתור / חוב-אבוד),
  // ואז השורה יורדת מהתור. ‏`final_profit` הוא הדגל הפיזי של הרגע הזה.
  const cancelResolved = cancelled && detail?.final_profit != null
  const feedbackResolved =
    detail?.feedback_status === 'completed' || detail?.feedback_status === 'no_response'

  return {
    cancelled,
    // ‏"נעול" = ארכוב שקרה, או ביטול שכבר נפתר. בשניהם אין יותר מה לערוך (P3).
    locked: archived || cancelResolved,
    archived,
    cancelResolved,
    feeSet,
    writtenOff,
    invoiceSent: detail?.invoice_sent === true,
    paid: detail?.payment_date != null,
    feedbackResolved,
    // שני אלה קיימים כאן **רק** בשביל שער-הארכוב: הוא צריך לדעת שציון-נמוך-בלי-סיבה
    // חוסם, בדיוק כמו שהמסד יודע. ‏`feedbackResolved` לבדו אינו מספיק (ר' הפונקציה).
    feedbackScore: detail?.feedback_score ?? null,
    feedbackReason: detail?.negative_feedback_reason ?? null,
    // בענף-הביטול: תחילה קובעים סכום, ורק אז נפתח מסלול-P1 (חשבונית ואז תשלום) — F-9 של Q-1.
    showFeeProposal: cancelled && !feeSet && !writtenOff,
    showInvoiceBlock: !archived && !cancelResolved && (cancelled ? feeSet && !writtenOff : true),
    showFeedbackBlock: !archived && !cancelled,
    // 🔴 תחשיב-המאזן הוא של **פרויקט שהתקיים** בלבד. אצל מבוטל `finance_project_money`
    // עדיין מחזירה `revenue` = ההצעה הקפואה + שינויי-התכולה — כסף שמעולם לא נגבה —
    // ו-`gross_profit` שנגזר ממנה. הצגתם לצד "רווח סופי — קפוא" (שנוסחתו Q-3:
    // דמי-ביטול − פיצוי-צוות − עלות-סחורה) הייתה שמה **שני מספרי-רווח סותרים על מסך
    // אחד** ומפרה את F16/R1-4 ("מספר-הכנסה אחד"). התצוגה המאושרת מציירת מאזן בתצוגה ב'
    // בלבד; מבוטל-שנפתר מקבל את הרווח-הקפוא לבדו.
    showBalance: archived,
    showCancelledProfit: cancelResolved,
  }
}

// ── רכיבי-תצוגה קטנים ────────────────────────────────────────────────────────────────

// תא-זהות: תווית וערך באותו div, בסדר תווית→ערך — לעולם לא שורת-תוויות מעל שורת-ערכים
// (הבאג שקרה שלוש פעמים; `ProjectCardPage.jsx` הוא התקדים המדוד).
function Cell({ label, children, className, testId }) {
  return (
    <div
      className={cn('flex min-w-0 flex-col items-start gap-0.5', className)}
      data-testid={testId}
    >
      <span className="text-xs text-slate-500">{label}</span>
      {children}
    </div>
  )
}

function Val({ children, className }) {
  return (
    <span className={cn('break-words text-sm font-semibold text-slate-800', className)}>
      {children}
    </span>
  )
}

function Sub({ children, className, testId }) {
  return (
    <span className={cn('text-[11px] text-slate-500', className)} data-testid={testId}>
      {children}
    </span>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="mt-1 border-b border-slate-200 pb-1 text-[12.5px] font-semibold text-slate-600">
      {children}
    </h3>
  )
}

// ‏`id` הוא רשות ומשמש **רק** ל-`aria-describedby`: משתמשת-מקלדת שמגיעה לפקד חסום שומעת
// את התווית בלבד, והסיבה שכתובה לידה נשארת בלתי-נשמעת (התקדים המדוד: `ScopeChangeDialog`).
function GateNote({ children, testId, id }) {
  return (
    <span className="text-[11px] leading-relaxed text-amber-800" data-testid={testId} id={id}>
      {children}
    </span>
  )
}

function MetaItem({ label, value }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-slate-500">{label}</span>
      <Ltr className="font-medium text-slate-700">{formatTimestampFull(value, '—')}</Ltr>
    </span>
  )
}

// שורת-מאזן: תווית מימין, סכום משמאל — **תווית וערך באותו אלמנט-אב**, ולכן אין כאן את
// פיצול-השורות ש-`LtrFieldGroup` קיים כדי למנוע בפריסה האופקית שלו.
function BalanceRow({ label, amount, op, total, testId }) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-3 py-1',
        total && 'mt-1 border-t border-slate-200 pt-2',
      )}
      data-testid={testId}
    >
      <span
        className={cn(
          'text-[12.5px] text-slate-600',
          total && 'text-[13px] font-semibold text-slate-800',
        )}
      >
        {op ? <span aria-hidden="true">{op} </span> : null}
        {label}
      </span>
      <Money
        amount={amount}
        cents
        className={cn('text-sm text-slate-800', total && 'text-[15px] font-bold')}
      />
    </div>
  )
}

// ── בלוקי-המסך ──────────────────────────────────────────────────────────────────────

function MetaStrip({ project, detail, statusLabel }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600"
      data-testid="closing-meta"
    >
      <span className="flex items-center gap-1.5">
        <span className="text-slate-500">מצב הפרויקט:</span>
        <StatusTag label={statusLabel} testId="closing-status-tag" />
      </span>
      {/* ‏`operationally_closed_at` אינו ב-RPC של S2 — הוא מגיע משורת-S1 והוא תצוגה בלבד. */}
      {project.operationally_closed_at ? (
        <MetaItem label="נסגר תפעולית:" value={project.operationally_closed_at} />
      ) : null}
      {detail.cancelled_at ? <MetaItem label="בוטל:" value={detail.cancelled_at} /> : null}
      {detail.archived_at ? <MetaItem label="הועבר לארכיון:" value={detail.archived_at} /> : null}
    </div>
  )
}

function LockedBanner({ archived }) {
  return (
    <div
      className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs leading-relaxed text-green-800"
      data-testid="closing-locked-banner"
    >
      <b>{archived ? 'התיק נעול — הועבר לארכיון.' : 'התיק נעול — דמי-הביטול נפתרו והרווח נקפא.'}</b>{' '}
      {LOCKED_BANNER_BODY}
    </div>
  )
}

// תא-המשוב של התצוגה הנעולה. **"לעיון בלבד" אינו "הוסר"** — התצוגה המאושרת ב' מציירת את
// המשוב *בתוך* רשת-הזהות (תג-הציון · סיבת-הבירור · הטקסט), ובלעדיו התיק הארכיוני אינו נושא
// שום עקבה לשיחה עם הלקוח. הפקדים לכתיבה הם אלה שנעלמים, לא הנתון.
function LockedFeedbackCell({ detail }) {
  const hasScore = detail.feedback_score != null
  return (
    <Cell label="משוב הלקוח" className="col-span-2" testId="closing-feedback-locked">
      <Val>
        {hasScore ? (
          <StatusTag
            label={scoreTagText(detail.feedback_score)}
            tone={scoreTag(detail.feedback_score).tone}
            testId="closing-feedback-locked-tag"
          />
        ) : detail.feedback_status === 'no_response' ? (
          'הלקוח לא השיב לסקר'
        ) : (
          '—'
        )}
      </Val>
      {detail.negative_feedback_reason ? (
        <Sub>סיבת-בירור: {detail.negative_feedback_reason}</Sub>
      ) : null}
      {detail.feedback_notes ? <Sub>{detail.feedback_notes}</Sub> : null}
    </Cell>
  )
}

function IdentityBlock({ detail, billing, invoiceName, showFeedback }) {
  return (
    <div>
      <SectionTitle>
        {showFeedback ? 'פרטי חיוב · תשלום · משוב — נעול לעיון' : 'פרטי חיוב — נעול לעיון'}
      </SectionTitle>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2" data-testid="closing-identity">
        <Cell label="לקוח">
          <Val>{detail.customer_name ?? '—'}</Val>
        </Cell>
        {/* ⚠️ ‏ח.פ אינו מרונדר: `getBillingContact` (‏api.js, צעד 2.3) אינו שולף את
            `company_number`, ואין דרך מותרת אחרת להשיגו — מסך של מודול קורא רק דרך
            ה-api שלו (כלל ברזל 14). תא עם `—` היה נקרא כ"ללא ח.פ", והעמודה NOT NULL.
            התא נדלק מעצמו ברגע שהשדה יתווסף לאותו select. */}
        {billing?.company_number ? (
          <Cell label="ח.פ">
            <Val>
              <Ltr>{billing.company_number}</Ltr>
            </Val>
          </Cell>
        ) : null}
        <Cell label="איש קשר">
          <Val>{billing?.contact_name ?? '—'}</Val>
        </Cell>
        <Cell label="מייל לחיוב" className="col-span-2">
          <Val>{billing?.email ? <Ltr>{billing.email}</Ltr> : '—'}</Val>
        </Cell>
        {invoiceName ? (
          <Cell label="חשבונית" testId="closing-invoice-done">
            <Val>
              <Ltr>{invoiceName}</Ltr>
            </Val>
            <Sub>
              נשלחה <Ltr>{formatTimestampFull(detail.invoice_sent_at, '—')}</Ltr>
            </Sub>
          </Cell>
        ) : null}
        {detail.payment_date ? (
          <Cell label="תאריך תשלום" testId="closing-payment-done">
            <Val>
              <Ltr>{formatDate(detail.payment_date, '—')}</Ltr>
            </Val>
          </Cell>
        ) : null}
        {showFeedback ? <LockedFeedbackCell detail={detail} /> : null}
        {detail.written_off ? (
          <Cell label="סגירה ללא תשלום" testId="closing-write-off-done">
            <Val>הסתיים — לא שולם</Val>
            {detail.written_off_reason ? <Sub>{detail.written_off_reason}</Sub> : null}
          </Cell>
        ) : null}
      </div>
    </div>
  )
}

// רכיב① — פיצוי-הצוות. ‏`null` כאן אינו 0 אלא משפט (A-8): פיצוי-אפס לדיילות שהתחייבו
// הוא בדיוק הכשל השקט שהמודול נבנה נגדו.
function CompensationComponent({ proposal }) {
  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] font-semibold text-slate-700">① פיצוי-צוות</span>
        {proposal?.team_compensation == null ? (
          <span
            className="text-[12px] font-semibold text-amber-800"
            data-testid="closing-fee-comp-missing"
          >
            {NO_PLANNED_HOURS_NOTE}
          </span>
        ) : (
          <Money
            amount={proposal.team_compensation}
            cents
            className="text-sm font-semibold text-slate-800"
            data-testid="closing-fee-comp"
          />
        )}
      </div>
      <Sub className="mt-1 block">
        <Ltr>{proposal?.compensated_count ?? '—'}</Ltr> דיילות מאושרות-סופית · הביטול נעשה{' '}
        <Ltr>{proposal?.hours_before_event ?? '—'}</Ltr> שעות לפני האירוע ⇐ סולם-הביטול (ה24) נותן{' '}
        <Ltr>{proposal?.compensation_pct ?? '—'}%</Ltr>. בלי רכיב-נסיעות (ה29) — משמרת שבוטלה לא
        נסעה.
      </Sub>
    </div>
  )
}

function ManualServiceComponent({ label, amount, onLabel, onAmount }) {
  return (
    <div className="mt-2 rounded-lg border border-dashed border-slate-300 bg-white p-3">
      <span className="text-[12.5px] font-semibold text-slate-700">③ שירותים שבוצעו</span>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          type="text"
          value={label}
          aria-label="תיאור-שירות ידני"
          placeholder="למשל: עיצוב גרפי לבמה שכבר הופק"
          data-testid="closing-manual-label"
          onChange={(event) => onLabel(event.target.value)}
          className="h-8 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-800"
        />
        <input
          type="number"
          dir="ltr"
          min="0"
          step="0.01"
          value={amount}
          aria-label="סכום השורה הידנית"
          data-testid="closing-manual-amount"
          onFocus={(event) => event.target.select()}
          onChange={(event) => onAmount(event.target.value)}
          className="h-8 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-800"
        />
      </div>
      <Sub className="mt-1 block">
        שורה חופשית בלי מעקב-סטטוס במסד (כרטיס-P1) — אינה נשמרת, ואינה נכנסת מעצמה לסכום שייחתם.
      </Sub>
    </div>
  )
}

function FeeAmountFields({ amount, note, onAmount, onNote }) {
  return (
    <>
      <SectionTitle>סכום דמי-הביטול הסופי</SectionTitle>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500" htmlFor="closing-fee-amount">
            הסכום שייחתם (עריך — ה28)
          </label>
          <input
            id="closing-fee-amount"
            type="number"
            dir="ltr"
            min="0"
            step="0.01"
            value={amount}
            data-testid="closing-fee-amount"
            onFocus={(event) => event.target.select()}
            onChange={(event) => onAmount(event.target.value)}
            className="h-8 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-[13px] text-slate-800"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500" htmlFor="closing-fee-note">
            הערת-פירוט (נשמרת עם הסכום)
          </label>
          <input
            id="closing-fee-note"
            type="text"
            value={note}
            placeholder="חופשי — יישמר לצד הסכום הסופי"
            data-testid="closing-fee-note"
            onChange={(event) => onNote(event.target.value)}
            className="h-8 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-[13px] text-slate-800"
          />
        </div>
      </div>
      <Sub className="mt-1 block">{FEE_STORAGE_NOTE}</Sub>
    </>
  )
}

function FeeActions({ busy, actions }) {
  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={actions.saveBlocked || busy !== ''}
          data-testid="closing-save-fee"
          className="h-auto rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700"
          onClick={actions.onSaveFee}
        >
          {busy === 'fee' ? 'שומר...' : 'שמור דמי-ביטול'}
        </Button>
        <Button
          type="button"
          variant="outline"
          title={WAIVE_TITLE}
          disabled={actions.waiveBlocked || busy !== ''}
          data-testid="closing-waive"
          className="h-auto rounded-lg border-slate-300 px-4 py-2 text-slate-700"
          onClick={actions.onWaive}
        >
          ויתור על החוב
        </Button>
        <Button
          type="button"
          variant="outline"
          title={WRITE_OFF_TITLE}
          disabled={busy !== ''}
          data-testid="closing-write-off-open"
          className="h-auto rounded-lg border-slate-300 px-4 py-2 text-slate-700"
          onClick={actions.onOpenWriteOff}
        >
          סגור ללא תשלום
        </Button>
      </div>
      <GateNote testId="closing-fee-actions-note">{CANCEL_ACTIONS_NOTE}</GateNote>
    </>
  )
}

function FeeProposalBlock({ proposal, form, withManual, busy, actions }) {
  return (
    <div data-testid="closing-fee-block">
      <SectionTitle>פירוט דמי-הביטול המוצע (P1 · ה24 / ה23)</SectionTitle>

      <CompensationComponent proposal={proposal} />

      <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[12.5px] font-semibold text-slate-700">
            ② סחורה שהוזמנה/הגיעה — במחיר מלא
          </span>
          <Money
            amount={proposal?.goods_at_price}
            cents
            className="text-sm font-semibold text-slate-800"
            data-testid="closing-fee-goods"
          />
        </div>
        <Sub className="mt-1 block">
          ה23: "מחיר מלא" = מחיר-הלקוח שהוקפא בהצעה, לא עלות — ורק שורות שכבר "הוזמן"/"מוכן"
          בלוגיסטיקה נכנסות.
        </Sub>
      </div>

      <ManualServiceComponent
        label={form.manualLabel}
        amount={form.manualAmount}
        onLabel={form.setManualLabel}
        onAmount={form.setManualAmount}
      />

      <div className="mt-2 flex items-baseline justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
        <span className="text-[12.5px] font-semibold text-slate-700">תת-סכום (① + ②)</span>
        <Money
          amount={proposal?.proposed_fee}
          cents
          className="text-sm font-bold text-slate-800"
          data-testid="closing-fee-subtotal"
        />
      </div>
      {withManual == null ? null : (
        <Sub className="mt-1 block" testId="closing-fee-with-manual">
          עם השורה הידנית שלמעלה: <Money amount={withManual} cents />
        </Sub>
      )}

      <FeeAmountFields
        amount={form.feeAmount}
        note={form.feeNote}
        onAmount={form.setFeeAmount}
        onNote={form.setFeeNote}
      />

      <FeeActions busy={busy} actions={actions} />
    </div>
  )
}

function FeeSavedBlock({ detail, creditNoteFlag }) {
  return (
    <div
      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
      data-testid="closing-fee-saved"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] font-semibold text-slate-700">דמי-ביטול שנקבעו</span>
        <Money
          amount={detail.cancellation_fee}
          cents
          className="text-sm font-bold text-slate-800"
        />
      </div>
      {detail.cancellation_fee_note ? <Sub>{detail.cancellation_fee_note}</Sub> : null}
      {/* A-9 / §7.20ב — תצוגה בלבד. הדגל מחושב במסד ומגיע בשורת-S1. */}
      {creditNoteFlag ? (
        <Sub className="mt-0.5 block font-semibold text-amber-800" testId="closing-credit-note">
          {CREDIT_NOTE_LINE}
        </Sub>
      ) : null}
    </div>
  )
}

function InvoiceGateNote({ billingEmailMissing, hasFile }) {
  if (billingEmailMissing) {
    return <GateNote testId="closing-invoice-gate">{NO_BILLING_EMAIL_NOTE}</GateNote>
  }
  if (!hasFile) {
    return <GateNote testId="closing-invoice-gate">{INVOICE_FILE_REQUIRED_NOTE}</GateNote>
  }
  return null
}

// 🔤 המשפט שמצויר בתוך ה-dropzone, מילולית מהמוקאפ המאושר.
const DROPZONE_HINT = 'גררי קובץ-חשבונית לכאן, או'

function InvoiceUploadBlock({
  file,
  fileError,
  blocked,
  billingEmailMissing,
  busy,
  onPick,
  onDropFile,
  onSend,
}) {
  // גרירה **אמיתית**, ולא רק מראה-מקווקו: כרטיס-S2 §① מונה "גרירה ל-dropzone" כאחת משתי
  // הדרכים לצרף קובץ. ‏`preventDefault` על `dragover` הוא מה שהופך את האזור ליעד-שחרור —
  // בלעדיו הדפדפן פותח את הקובץ בטאב ובקשת-השליחה נעלמת. הקובץ עובר בדיוק באותו נתיב
  // כמו בחירה ידנית, ולכן אותה ולידציה ואותה הודעת-שגיאה.
  const handleDragOver = (event) => event.preventDefault()
  const handleDrop = (event) => {
    event.preventDefault()
    // שחרור בלי קובץ (טקסט שנגרר, למשל) **אינו מנקה** בחירה קיימת — איבוד-קובץ בשקט
    // אחרי גרירה שגויה הוא בדיוק מה שנראה כמו "המסך לא הגיב".
    const dropped = event.dataTransfer?.files?.[0]
    if (dropped) onDropFile(dropped)
  }

  return (
    <div data-testid="closing-invoice-block">
      <SectionTitle>חשבונית</SectionTitle>
      <div
        className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
        data-testid="closing-invoice-banner"
      >
        <b>{INVOICE_BANNER_TITLE}</b> {INVOICE_BANNER_BODY}
      </div>

      <div
        className="mt-2 flex flex-col items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-center"
        data-testid="closing-dropzone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <span aria-hidden="true" className="text-lg">
          📎
        </span>
        <span className="text-[12px] text-slate-600">{DROPZONE_HINT}</span>
        <label
          className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1 text-[12px] text-slate-700"
          htmlFor="closing-file-input"
        >
          בחרי קובץ
        </label>
        <input
          id="closing-file-input"
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="sr-only"
          data-testid="closing-file-input"
          onChange={onPick}
        />
        <span className="text-[11px] text-slate-500" data-testid="closing-file-hint">
          {file ? file.name : 'לא נבחר קובץ עדיין'}
        </span>
      </div>

      {fileError ? (
        <p
          className="mt-1 text-[11.5px] font-semibold text-red-600"
          role="alert"
          data-testid="closing-file-error"
        >
          {fileError}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          disabled={blocked || busy !== ''}
          title={file ? undefined : INVOICE_SEND_TITLE}
          data-testid="closing-send-invoice"
          className="h-auto rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700"
          onClick={onSend}
        >
          {busy === 'invoice' ? 'שולח...' : 'שמור ושלח'}
        </Button>
        <InvoiceGateNote billingEmailMissing={billingEmailMissing} hasFile={Boolean(file)} />
      </div>
    </div>
  )
}

// 🆕 הפקד שהשלים Q-1 (הכרעת-ישי 26/08/2026): "ממתין לתשלום" לא צויר באף תצוגה מאושרת.
function PaymentBlock({ value, onChange, onSave, onOpenWriteOff, busy }) {
  return (
    <div data-testid="closing-payment-block">
      <SectionTitle>תשלום</SectionTitle>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500" htmlFor="closing-payment-date">
            תאריך קבלת תשלום
          </label>
          <input
            id="closing-payment-date"
            type="date"
            dir="ltr"
            value={value}
            data-testid="closing-payment-date"
            onChange={(event) => onChange(event.target.value)}
            className="h-8 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-[13px] text-slate-800"
          />
        </div>
        <Button
          type="button"
          disabled={value === '' || busy !== ''}
          data-testid="closing-save-payment"
          className="h-auto rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700"
          onClick={onSave}
        >
          {busy === 'payment' ? 'שומר...' : 'שמור תשלום'}
        </Button>
        <Button
          type="button"
          variant="outline"
          title={WRITE_OFF_TITLE}
          disabled={busy !== ''}
          data-testid="closing-write-off-open"
          className="h-auto rounded-lg border-slate-300 px-4 py-2 text-slate-700"
          onClick={onOpenWriteOff}
        >
          סגור ללא תשלום
        </Button>
      </div>
    </div>
  )
}

// הסיבה היא **חובה** (כרטיס-P3 + האילוץ ב-RPC), ולכן היא שדה ולא רק חלונית-וידוא.
function WriteOffForm({ reason, onReason, onConfirm, onCancel, busy }) {
  return (
    <div
      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
      data-testid="closing-write-off-form"
    >
      <label className="text-xs text-slate-500" htmlFor="closing-write-off-reason">
        סיבת הסגירה ללא תשלום — חובה
      </label>
      <textarea
        id="closing-write-off-reason"
        rows={2}
        value={reason}
        data-testid="closing-write-off-reason"
        placeholder="למשל: הלקוח נכנס לפירוק; הגבייה מוצתה"
        onChange={(event) => onReason(event.target.value)}
        className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-right text-sm outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={reason.trim() === '' || busy !== ''}
          data-testid="closing-write-off-confirm"
          className="h-auto rounded-lg border-slate-300 px-4 py-2 text-slate-700"
          onClick={onConfirm}
        >
          {busy === 'writeOff' ? 'סוגר...' : 'אישור סגירה ללא תשלום'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy !== ''}
          data-testid="closing-write-off-cancel"
          className="h-auto rounded-lg border-slate-300 px-4 py-2 text-slate-700"
          onClick={onCancel}
        >
          חזרה
        </Button>
      </div>
    </div>
  )
}

// הזנה ידנית (א24) — `RatingStars` במצב-עריכה, הרכיב הקיים ולא חדש.
function FeedbackEntry({ score, onScore, onNoResponse, busy }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <RatingStars value={score} onChange={onScore} testId="closing-feedback-stars" />
      <Button
        type="button"
        variant="outline"
        disabled={busy !== ''}
        data-testid="closing-no-response"
        className="h-auto rounded-lg border-slate-300 px-3 py-1.5 text-[12.5px] text-slate-700"
        onClick={onNoResponse}
      >
        לא ענה לסקר
      </Button>
    </div>
  )
}

function FeedbackReasonField({ value, onChange, describedBy }) {
  return (
    <div className="mt-2 flex flex-col gap-1">
      <label className="text-xs text-slate-500" htmlFor="closing-feedback-reason">
        סיבת-הבירור — חובה בציון מתחת ל-3
      </label>
      <select
        id="closing-feedback-reason"
        value={value}
        aria-describedby={describedBy}
        data-testid="closing-feedback-reason"
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-[13px] text-slate-800"
      >
        <option value="">בחרי סיבה</option>
        {FEEDBACK_REASONS.map((reason) => (
          <option key={reason} value={reason}>
            {reason}
          </option>
        ))}
      </select>
    </div>
  )
}

function FeedbackTag({ score, tag }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <StatusTag label={scoreTagText(score)} tone={tag.tone} testId="closing-feedback-tag" />
      <Sub>
        ציון <Ltr>{tag.score}</Ltr> מתוך <Ltr>5</Ltr>
      </Sub>
    </div>
  )
}

function FeedbackBlock({ detail, form, tag, scoreLow, busy, onNoResponse }) {
  return (
    <div data-testid="closing-feedback-block">
      <SectionTitle>משוב הלקוח</SectionTitle>

      {tag ? <FeedbackTag score={detail.feedback_score} tag={tag} /> : null}

      {detail.feedback_status === 'no_response' ? (
        <Sub className="mt-2 block" testId="closing-feedback-no-response">
          הלקוח לא השיב — השער עובר גם כך (ה3). ציון שיתקבל טלפונית עדיין ניתן להזנה כאן.
        </Sub>
      ) : null}

      {detail.feedback_score == null ? (
        <FeedbackEntry
          score={form.score}
          onScore={form.setScore}
          onNoResponse={onNoResponse}
          busy={busy}
        />
      ) : null}

      {scoreLow ? (
        <FeedbackReasonField
          value={form.reason}
          onChange={form.setReason}
          describedBy={form.reason.trim() === '' ? FEEDBACK_GATE_ID : undefined}
        />
      ) : null}

      <div className="mt-2 flex flex-col gap-1">
        <label className="text-xs text-slate-500" htmlFor="closing-feedback-notes">
          הערות המנהלת מהשיחה
        </label>
        <textarea
          id="closing-feedback-notes"
          rows={2}
          value={form.notes}
          data-testid="closing-feedback-notes"
          onChange={(event) => form.setNotes(event.target.value)}
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-right text-sm outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
        />
      </div>
    </div>
  )
}

// שורת-המשנה של אריח-הסטייה. ‏`null` מטופל ע"י `StatTile` עצמו (‏emptyText).
function budgetDeviationSub(deviation) {
  if (deviation == null) return undefined
  const n = Number(deviation)
  if (!Number.isFinite(n)) return undefined
  if (n < 0) return 'בפועל מתחת למתוכנן'
  if (n > 0) return 'בפועל מעל המתוכנן'
  return 'בפועל כמתוכנן'
}

function BalanceBlock({ detail }) {
  return (
    <div>
      <SectionTitle>תחשיב-מאזן (P3)</SectionTitle>
      <div
        className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
        data-testid="closing-balance"
      >
        <BalanceRow
          label="הכנסות (הצעה-קפואה + שינויי-תכולה, ה2)"
          amount={detail.revenue}
          testId="closing-balance-revenue"
        />
        <BalanceRow
          op="−"
          label="עבודה — שעות בפועל × תעריף קפוא + בונוסים (ה17)"
          amount={detail.labor_cost}
          testId="closing-balance-labor"
        />
        <BalanceRow
          op="−"
          label="נסיעות (פרמטר × משמרות)"
          amount={detail.travel_cost}
          testId="closing-balance-travel"
        />
        <BalanceRow
          op="−"
          label="סחורה (כמות × עלות קפואה)"
          amount={detail.goods_cost}
          testId="closing-balance-goods"
        />
        <BalanceRow
          total
          label="רווח גולמי"
          amount={detail.gross_profit}
          testId="closing-balance-profit"
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <StatTile
          label="סטיית-תקציב — עבודה (ה18)"
          // ‏`StatTile` מדפיס מספר דרך `Money` **בלי אגורות**, והתצוגה המאושרת מציירת
          // ‏`−692.00 ₪`. לכן מועבר צומת ולא מספר — שימוש בחוזה הקיים של הרכיב
          // (‏`typeof value === 'number' ? <Money/> : value`), לא עקיפה שלו.
          value={
            detail.budget_deviation == null ? null : (
              <Money amount={detail.budget_deviation} cents />
            )
          }
          sub={budgetDeviationSub(detail.budget_deviation)}
          emptyText={NO_DEVIATION_NOTE}
          testId="closing-deviation-tile"
        />
        {detail.final_profit != null ? (
          <StatTile
            label="רווח סופי — קפוא"
            value={<Money amount={detail.final_profit} cents />}
            sub="נקפא בשקלים ואינו ניתן לעריכה (§7.52)"
            testId="closing-final-profit-tile"
          />
        ) : null}
      </div>
    </div>
  )
}

// פרויקט מבוטל שנפתר — **הרווח הקפוא לבדו, בלי תחשיב-מאזן.** ר' הנימוק המלא ב-`closingPhase`
// (‏`showBalance`): המאזן היה מציג הכנסה שלא נגבתה מול הרווח שנקפא מדמי-הביטול, ושני המספרים
// סותרים זה את זה. השורה שמתחת אומרת למנהלת **למה** אין כאן מאזן, במקום להשאיר חלל.
function CancelledProfitBlock({ detail }) {
  return (
    <div>
      <SectionTitle>רווח סופי — ביטול</SectionTitle>
      <div className="mt-2 flex flex-wrap gap-2">
        <StatTile
          label="רווח סופי — קפוא"
          value={<Money amount={detail.final_profit} cents />}
          sub="נקפא בשקלים ואינו ניתן לעריכה (§7.52)"
          testId="closing-final-profit-tile"
        />
      </div>
      <Sub className="mt-1 block" testId="closing-cancelled-no-balance">
        אין תחשיב-מאזן לפרויקט מבוטל: הרווח כאן נגזר מדמי-הביטול בניכוי פיצוי-הצוות ועלות-הסחורה
        (Q-3), ולא מהכנסות-האירוע — האירוע לא התקיים ולא נגבה עליו התשלום שבהצעה.
      </Sub>
    </div>
  )
}

function ClosingFooter({
  phase,
  gateNote,
  busy,
  feedbackGate,
  onSaveFeedback,
  onArchive,
  onClose,
}) {
  if (phase.locked) {
    return (
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          className="h-auto rounded-lg border-slate-300 px-4 py-2 text-slate-700"
          data-testid="closing-close"
          onClick={onClose}
        >
          סגירה
        </Button>
      </DialogFooter>
    )
  }

  return (
    <DialogFooter className="flex-col items-start gap-2 sm:flex-row sm:items-center">
      {phase.showFeedbackBlock ? (
        <>
          <Button
            type="button"
            variant="outline"
            disabled={feedbackGate != null || busy !== ''}
            title={feedbackGate ?? undefined}
            aria-describedby={feedbackGate ? FEEDBACK_GATE_ID : undefined}
            data-testid="closing-save-status"
            className="h-auto rounded-lg border-slate-300 px-4 py-2 text-slate-700"
            onClick={onSaveFeedback}
          >
            {busy === 'feedback' ? 'שומר...' : 'שמור סטטוס'}
          </Button>
          {feedbackGate ? (
            <GateNote testId="closing-feedback-gate" id={FEEDBACK_GATE_ID}>
              {feedbackGate}
            </GateNote>
          ) : null}
        </>
      ) : null}
      {/* ארכוב אינו קיים לפרויקט מבוטל — האילוץ החי אוסר זאת, וכפתור מושבת-לנצח היה
          מבטיח פעולה שלא תתאפשר לעולם. */}
      {phase.cancelled ? null : (
        <>
          <Button
            type="button"
            disabled={gateNote != null || busy !== ''}
            title={gateNote ?? undefined}
            aria-describedby={gateNote ? ARCHIVE_GATE_ID : undefined}
            data-testid="closing-archive"
            className="h-auto rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700"
            onClick={onArchive}
          >
            {busy === 'archive' ? 'מארכב...' : 'העבר לארכיון'}
          </Button>
          {gateNote ? (
            <GateNote testId="closing-archive-gate" id={ARCHIVE_GATE_ID}>
              {gateNote}
            </GateNote>
          ) : null}
        </>
      )}
    </DialogFooter>
  )
}

// מצב-הפתיחה: שלד בזמן טעינה, ואחרת הצורה הנעולה של כשל-טעינה (§3.7) עם "נסי שוב".
function ClosingLoadingState({ loading, loadError, onRetry, onClose }) {
  return (
    <>
      {loading ? (
        <LoadingOrError loading skeleton={{ variant: 'fields' }} />
      ) : (
        <PermissionAwareEmpty
          state="error"
          detail={loadError}
          onRetry={onRetry}
          testId="closing-load-error"
        />
      )}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          className="h-auto rounded-lg border-slate-300 px-4 py-2 text-slate-700"
          onClick={onClose}
          data-testid="closing-close"
        >
          סגירה
        </Button>
      </DialogFooter>
    </>
  )
}

// ── טעינת הנתונים ───────────────────────────────────────────────────────────────────
// מחוץ לרכיב במכוון: קלט = מזהה, פלט = שלוש שורות. אותה פונקציה משמשת גם בטעינה
// הראשונה וגם ברענון שאחרי כתיבה, ולכן אין שני מסלולי-טעינה שיכולים להיפרד.
async function loadClosingData(projectId) {
  // 🔴 שער-הצורה לפני כל גזירה: שורה שאיבדה עמודה נופלת כאן ברעש, ולא מציירת `—`
  // על כל שדה במסך.
  const row = assertFinanceShape(
    await getFinanceDetail(projectId),
    DETAIL_FIELDS,
    'נתוני הכספים של הפרויקט',
  )
  const phase = closingPhase(row)

  // הצעת דמי-הביטול נטענת **רק** כשהיא רלוונטית: אצל פרויקט רגיל ה-RPC היה זורק
  // "אינו מבוטל" והמסך היה נכשל בלי סיבה.
  const proposalRow = phase.showFeeProposal
    ? assertFinanceShape(
        await getCancellationFeeProposal(projectId),
        PROPOSAL_FIELDS,
        'הצעת דמי הביטול',
      )
    : null

  // פרטי-החיוב אינם חלק מהמאזן, ולכן כשלם אינו מפיל את המסך — הוא רק חוסם שליחה
  // (כרטיס-P1: "אין מייל-לחיוב — נחסם עם הפניה לכרטיס-הלקוח").
  let contact
  try {
    contact = await getBillingContact(row.customer_id)
  } catch {
    contact = null
  }

  return { row, proposalRow, contact }
}

// ── פעולות שדורשות חלונית-וידוא ─────────────────────────────────────────────────────
// מחוץ לרכיב: שלוש הפעולות הבלתי-הפיכות (ארכוב · ויתור · חוב-אבוד) חולקות בדיוק את אותו
// רצף — לשאול, ורק אם אושר להריץ. שכפולו שלוש פעמים היה מזמין שכחה באחת מהן.
async function confirmThenRun({ confirm, runAction, dialog, key, fn, successMessage }) {
  const approved = await confirm(dialog)
  if (!approved) return
  await runAction(key, fn, successMessage)
}

// 🔴 חוזה-שלושת-המצבים (כרטיס-P1): "נכשל" ו"לא ידוע" שניהם **אינם** מסמנים "נשלח",
// ולכן אין בהם רענון — המסך נשאר בדיוק כפי שהיה, עם המשפט שאומר מה לעשות עכשיו.
async function sendInvoiceFlow({ detail, billing, file, refresh, toast, setBusy, setServerError }) {
  setBusy('invoice')
  setServerError('')
  try {
    const result = await sendInvoiceAndRecord({ project: detail, customer: billing, file })
    if (result.sendResult !== EMAIL_SEND_RESULT.SENT) {
      setServerError(
        sendResultMessage(result.sendResult, { failedMessage: INVOICE_SEND_FAILED_MESSAGE }),
      )
      return
    }
    await refresh()
    toast.success('החשבונית נשלחה ללקוח והפרויקט עבר ל"ממתין לתשלום".')
    if (result.logFailed) toast.error('המייל יצא, אך רישום שורת-התיעוד (email_log) נכשל.')
  } catch (err) {
    setServerError(err?.message ?? 'שגיאה לא צפויה.')
  } finally {
    setBusy('')
  }
}

// ── הנגזרות של הרינדור, במקום אחד ────────────────────────────────────────────────────
// מחוץ לרכיב: כולן טהורות (שורה + ערכי-טופס ⇒ דגלים), וריכוזן כאן הוא מה שמאפשר לקרוא
// את הגוף כרשימת-בלוקים ולא כרשת-תנאים. **אין כאן חשבון-כסף** מלבד תת-הסכום הידני,
// שהוא כולו קלט של המנהלת.
function derivedView({ detail, proposal, billing, phase, form }) {
  const scoreLow = form.score != null && form.score < 3
  const manualAgorot = form.manualAmount.trim() === '' ? 0 : toAgorot(form.manualAmount)
  const proposedAgorot = proposal?.proposed_fee == null ? null : toAgorot(proposal.proposed_fee)
  const feeAmountNumber = form.feeAmount.trim() === '' ? null : Number(form.feeAmount)

  return {
    statusLabel: PROJECT_STATUS_LABELS[detail.project_status] ?? detail.project_status,
    tag: detail.feedback_score == null ? null : scoreTag(detail.feedback_score),
    gateNote: archiveGateNote(phase),
    scoreLow,
    invoiceName: detail.invoice_file_url ? fileNameOf(detail.invoice_file_url) : null,
    billingEmailMissing: !billing?.email,
    withManual:
      proposedAgorot != null && manualAgorot > 0 ? toShekels(proposedAgorot + manualAgorot) : null,
    feeAmountNumber,
    feeSaveBlocked:
      feeAmountNumber == null || !Number.isFinite(feeAmountNumber) || feeAmountNumber <= 0,
    feedbackGate: feedbackGateNote({
      score: form.score,
      reason: form.reason,
      touched: form.feedbackTouched,
    }),
    showPaymentBlock:
      phase.showInvoiceBlock && phase.invoiceSent && !phase.paid && !phase.writtenOff,
    showInvoiceUpload: phase.showInvoiceBlock && !phase.invoiceSent,
    showFeeSaved: phase.cancelled && phase.feeSet,
  }
}

// ── הגוף — ממונטש רק כשהדיאלוג פתוח, ולכן כל פתיחה מתחילה מ-state טרי ────────────────
function ClosingWindowBody({ project, onOpenChange, onChanged }) {
  const toast = useToast()
  const confirm = useConfirm()

  const [detail, setDetail] = useState(null)
  const [proposal, setProposal] = useState(null)
  const [billing, setBilling] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [reloadTick, setReloadTick] = useState(0)
  const [busy, setBusy] = useState('')
  const [serverError, setServerError] = useState('')

  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [score, setScore] = useState(null)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [feedbackTouched, setFeedbackTouched] = useState(false)
  const [feeAmount, setFeeAmount] = useState('')
  const [feeNote, setFeeNote] = useState('')
  const [manualLabel, setManualLabel] = useState('')
  const [manualAmount, setManualAmount] = useState('')
  const [writeOffOpen, setWriteOffOpen] = useState(false)
  const [writeOffReason, setWriteOffReason] = useState('')

  const projectId = project.project_id

  // ערכי-הטופס נזרעים מהשורה הטרייה בלבד, פעם אחת לכל טעינה — אין effect שמסנכרן
  // props→state (‏`src/CLAUDE.md`); איפוס מלא נעשה ב-remount של הגוף.
  const seed = useCallback((row, proposalRow) => {
    setPaymentDate(row.payment_date ?? '')
    setScore(row.feedback_score ?? null)
    setReason(row.negative_feedback_reason ?? '')
    setNotes(row.feedback_notes ?? '')
    setFeeNote(row.cancellation_fee_note ?? '')
    setFeeAmount(proposalRow?.proposed_fee == null ? '' : String(Number(proposalRow.proposed_fee)))
    setFeedbackTouched(false)
    setFile(null)
    setFileError('')
    setWriteOffOpen(false)
    setWriteOffReason('')
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { row, proposalRow, contact } = await loadClosingData(projectId)
        if (!alive) return
        setDetail(row)
        setProposal(proposalRow)
        setBilling(contact)
        seed(row, proposalRow)
        setLoadError(null)
      } catch (err) {
        if (alive) setLoadError(err?.message ?? 'שגיאה לא צפויה.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- טעינה בפתיחה וברענון בלבד
  }, [reloadTick])

  // אחרי כל כתיבה מוצלחת: **קוראים מחדש מהשרת** ולא מעדכנים state אופטימית. כתיבה
  // שנחסמה, או שינוי-סטטוס שהמסד עשה בעצמו (ממתין-לחשבונית ⇒ ממתין-לתשלום), חייבים
  // להגיע מהמקור — אחרת המסך מציג מצב שלא קיים.
  const refresh = useCallback(async () => {
    const { row, proposalRow, contact } = await loadClosingData(projectId)
    setDetail(row)
    setProposal(proposalRow)
    setBilling(contact)
    seed(row, proposalRow)
    onChanged?.()
  }, [projectId, seed, onChanged])

  const runAction = useCallback(
    async (key, fn, successMessage) => {
      setBusy(key)
      setServerError('')
      try {
        await fn()
        await refresh()
        if (successMessage) toast.success(successMessage)
      } catch (err) {
        // הודעת-השרת (P0001, עברית גמורה) מוצגת כלשונה — היא נוסחה כדי שהמנהלת תקרא אותה.
        setServerError(err?.message ?? 'שגיאה לא צפויה.')
      } finally {
        setBusy('')
      }
    },
    [refresh, toast],
  )

  if (loading || loadError || !detail) {
    return (
      <ClosingLoadingState
        loading={loading}
        loadError={loadError}
        onClose={() => onOpenChange?.(false)}
        onRetry={() => {
          setLoading(true)
          setLoadError(null)
          setReloadTick((tick) => tick + 1)
        }}
      />
    )
  }

  const phase = closingPhase(detail)
  const view = derivedView({
    detail,
    proposal,
    billing,
    phase,
    form: { score, reason, feedbackTouched, feeAmount, manualAmount },
  })
  const { scoreLow, feeAmountNumber } = view

  // נתיב-קובץ אחד לשתי הדרכים לצרף (בורר-קבצים · גרירה), כדי שהוולידציה לא תוכל
  // להתקיים בענף אחד ולא בשני.
  const applyPickedFile = (picked) => {
    setFile(picked)
    setFileError(picked ? validateInvoiceFile(picked) : '')
  }

  const handlePickFile = (event) => applyPickedFile(event.target.files?.[0] ?? null)

  const handleSendInvoice = () =>
    sendInvoiceFlow({ detail, billing, file, refresh, toast, setBusy, setServerError })

  const handleArchive = () =>
    confirmThenRun({
      confirm,
      runAction,
      dialog: {
        title: 'העברה לארכיון',
        message: ARCHIVE_CONFIRM_MESSAGE,
        confirmLabel: 'העבר לארכיון',
      },
      key: 'archive',
      fn: () => archiveProject(projectId),
      successMessage: 'התיק הועבר לארכיון והרווח נקפא.',
    })

  // מבוטל ורגיל הם שתי פונקציות-מסד שונות: אצל מבוטל זהו גם פתרון דמי-הביטול
  // (‏`resolve_cancellation_fee` מאפס את הסכום ורושם הערה), אצל רגיל זהו `record_write_off`.
  const writeOffCall = () =>
    phase.cancelled
      ? resolveCancellationFee(projectId, CANCELLATION_FEE_ACTIONS.WRITE_OFF, {
          note: writeOffReason.trim(),
        })
      : recordWriteOff(projectId, writeOffReason.trim())

  const handleWriteOff = () =>
    confirmThenRun({
      confirm,
      runAction,
      dialog: {
        title: 'סגירה ללא תשלום',
        message: WRITE_OFF_CONFIRM_MESSAGE,
        confirmLabel: 'סגור ללא תשלום',
      },
      key: 'writeOff',
      fn: writeOffCall,
      successMessage: 'הפרויקט נסגר ללא תשלום (חוב אבוד).',
    })

  const handleWaive = () =>
    confirmThenRun({
      confirm,
      runAction,
      dialog: {
        title: 'ויתור על החוב',
        message: WAIVE_CONFIRM_MESSAGE,
        confirmLabel: 'ויתור על החוב',
      },
      key: 'waive',
      fn: () =>
        resolveCancellationFee(projectId, CANCELLATION_FEE_ACTIONS.WAIVE, {
          note: feeNote.trim(),
        }),
      successMessage: 'הוויתור נרשם ודמי-הביטול נקבעו על 0 ₪.',
    })

  const feeForm = {
    feeAmount,
    setFeeAmount,
    feeNote,
    setFeeNote,
    manualLabel,
    setManualLabel,
    manualAmount,
    setManualAmount,
  }

  const feeActions = {
    saveBlocked: view.feeSaveBlocked,
    waiveBlocked: feeNote.trim() === '',
    onSaveFee: () =>
      runAction(
        'fee',
        () =>
          resolveCancellationFee(projectId, CANCELLATION_FEE_ACTIONS.BILL, {
            amount: feeAmountNumber,
            note: feeNote.trim() === '' ? null : feeNote.trim(),
          }),
        'דמי-הביטול נשמרו. אפשר להעלות חשבונית ולשלוח.',
      ),
    onWaive: handleWaive,
    onOpenWriteOff: () => setWriteOffOpen(true),
  }

  const feedbackForm = {
    score,
    setScore: (next) => {
      setScore(next)
      setFeedbackTouched(true)
    },
    reason,
    setReason: (next) => {
      setReason(next)
      setFeedbackTouched(true)
    },
    notes,
    setNotes: (next) => {
      setNotes(next)
      setFeedbackTouched(true)
    },
  }

  return (
    <>
      <MetaStrip project={project} detail={detail} statusLabel={view.statusLabel} />

      {phase.locked ? <LockedBanner archived={phase.archived} /> : null}

      {/* התיק הארכיוני מאבד את בלוק-המשוב הכותב, ולכן הוא מקבל את המשוב כתא-קריאה
          ברשת-הזהות — בדיוק כפי שהתצוגה המאושרת ב' מציירת. */}
      <IdentityBlock
        detail={detail}
        billing={billing}
        invoiceName={view.invoiceName}
        showFeedback={phase.archived}
      />

      {phase.showFeeProposal ? (
        <FeeProposalBlock
          proposal={proposal}
          form={feeForm}
          withManual={view.withManual}
          busy={busy}
          actions={feeActions}
        />
      ) : null}

      {view.showFeeSaved ? (
        <FeeSavedBlock detail={detail} creditNoteFlag={project.credit_note_flag} />
      ) : null}

      {view.showInvoiceUpload ? (
        <InvoiceUploadBlock
          file={file}
          fileError={fileError}
          blocked={!file || Boolean(fileError) || view.billingEmailMissing}
          billingEmailMissing={view.billingEmailMissing}
          busy={busy}
          onPick={handlePickFile}
          onDropFile={applyPickedFile}
          onSend={handleSendInvoice}
        />
      ) : null}

      {view.showPaymentBlock ? (
        <PaymentBlock
          value={paymentDate}
          onChange={setPaymentDate}
          busy={busy}
          onSave={() =>
            runAction(
              'payment',
              () => recordPayment(projectId, paymentDate),
              'תאריך קבלת התשלום נרשם.',
            )
          }
          onOpenWriteOff={() => setWriteOffOpen(true)}
        />
      ) : null}

      {writeOffOpen && !phase.locked ? (
        <WriteOffForm
          reason={writeOffReason}
          onReason={setWriteOffReason}
          onConfirm={handleWriteOff}
          onCancel={() => setWriteOffOpen(false)}
          busy={busy}
        />
      ) : null}

      {phase.showFeedbackBlock ? (
        <FeedbackBlock
          detail={detail}
          form={feedbackForm}
          tag={view.tag}
          scoreLow={scoreLow}
          busy={busy}
          onNoResponse={() =>
            runAction(
              'noResponse',
              () => recordFeedback(projectId, { markNoResponse: true }),
              'סומן שהלקוח לא ענה לסקר.',
            )
          }
        />
      ) : null}

      {phase.showBalance ? <BalanceBlock detail={detail} /> : null}

      {phase.showCancelledProfit ? <CancelledProfitBlock detail={detail} /> : null}

      {serverError ? (
        <p
          className="text-sm font-semibold text-red-600"
          role="alert"
          data-testid="closing-server-error"
        >
          {serverError}
        </p>
      ) : null}

      <ClosingFooter
        phase={phase}
        gateNote={view.gateNote}
        busy={busy}
        feedbackGate={view.feedbackGate}
        onClose={() => onOpenChange?.(false)}
        onArchive={handleArchive}
        onSaveFeedback={() =>
          runAction(
            'feedback',
            () =>
              recordFeedback(projectId, {
                score,
                reason: scoreLow ? reason : null,
                notes: notes.trim() === '' ? null : notes,
              }),
            'המשוב נשמר.',
          )
        }
      />
    </>
  )
}

export default function ClosingWindowDialog({ project, open, onOpenChange, onChanged }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-lg" data-testid="closing-dialog">
        <DialogHeader>
          <DialogTitle>{project?.event_name ?? 'חלון סגירת-תיק'}</DialogTitle>
          <DialogDescription>
            {project?.customer_name ?? ''} — מה חסר כדי לסגור את הפרויקט הזה, ומה הצעד הבא.
          </DialogDescription>
        </DialogHeader>
        {open && project ? (
          <ClosingWindowBody project={project} onOpenChange={onOpenChange} onChanged={onChanged} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
