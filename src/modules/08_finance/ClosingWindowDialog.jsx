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
import { compensationReason } from '@/lib/projectCancellation'
import { assertFinanceShape, scoreTag, scoreTagText } from '@/lib/projectFinance'
// ⛔ ייבוא חוצה-מודולים במכוון ולא העתקה: הכלל "ציון מתחת לסף ⇒ טעון בירור" חייב
// להיות אותו כלל בדיוק במסך-הלקוחות (מ2) ובמסך-הכספים, אחרת הם יסטו ביום שהסף ישתנה.
import { needsSatisfactionAttention } from '@/lib/customers'
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
  // 🔵 H5 — הפיצוי שהצוות **יקבל בפועל** בדוח-השכר. **אינו הצעת-חיוב**: הוא נשאר מלא גם
  // כש-`proposed_fee` הוא `null` (סיווג "אחר"), וזה בדיוק תפקידו — לתת למנהלת מספר להחליט
  // *עליו*, במקום שדה ריק. ‏`assertFinanceShape` דורש אותו ⇒ חזרה של הפונקציה לגרסה בלי
  // העמודה תיתפס כשער-צורה, ולא כ-`undefined` שקט שמכווץ את המשפט על המסך.
  'payout_compensation',
]

// 🔤 חמש סיבות-הבירור — **זהות-בייט ל-CHECK החי** ולרשימה שבמוקאפ המאושר. תו אחד שונה
// ⇒ המסד דוחה את השמירה בהודעה שמדברת על אילוץ ולא על הטופס.
const FEEDBACK_REASONS = ['איחור דיילות', 'תפקוד דיילות', 'איכות תגים', 'ניהול לקוי', 'אחר']

// 🔤 נוסחים שנקראו מילולית מהמוקאפ המאושר `02_closing_window_approved.html`.
const INVOICE_BANNER_TITLE = 'המערכת אינה מפיקה חשבונית באופן אוטומטי.' // §7.38
const INVOICE_BANNER_BODY =
  'יש להכין אותה בתוכנת הנהלת-החשבונות ולהעלות כאן — PDF או תמונה, עד 10MB.'
const INVOICE_SEND_TITLE = 'יש לבחור קובץ-חשבונית לפני השליחה'
const WAIVE_TITLE = 'מאפס את הסכום ל-0 ומחייב הערה — לא מחיקה שקטה'
const WRITE_OFF_TITLE = 'חוב-אבוד — הרווח נקפא כרגיל, בסיס-צבירה'
// "ויתור" נעול בכרטיס-P1 (פעולה מפורשת ולא מחיקה שקטה); "צבירה כבסיס" נעולה בכרטיס-P3.
const CANCEL_ACTIONS_NOTE =
  '"ויתור" = פעולה מפורשת (סכום 0 + הערת-חובה), לא מחיקה שקטה. "סגור ללא תשלום" = מסלול חוב-אבוד — הפרויקט מקבל תג "הסתיים — לא שולם"; הרווח נקפא גם בלי גבייה בפועל, כי הבסיס הוא צבירה.'
const FEE_STORAGE_NOTE =
  'נשמר במסד: הסכום הסופי וההערה בלבד — שלושת הרכיבים שלמעלה נגזרים-מחדש לתצוגה בכל פתיחה, ולא נשמרים כעמודות נפרדות.' // ה28
const LOCKED_BANNER_BODY = 'הרווח-הסופי קפוא ואינו ניתן לעריכה. כל השדות שלמטה לעיון בלבד.' // P3
const CREDIT_NOTE_LINE = 'נדרשת חשבונית זיכוי'
// 🔄 **הסף אינו כתוב במשפט יותר** (מודול 9 · צעד 2.3): הוא נקרא מ-`params`
// (`סף_שביעות_רצון`) ומוזרק לנוסח. ⚠️ **ולמה זה לא ניואנס-ניסוח:** אותו סף נאכף גם במסד
// (`record_feedback`/`archive_project`), והמשפט הזה הוא ההודעה הידידותית שקודמת ל-`P0001`
// שלו. מספר קפוא במשפט מול סף חי במסד = המסך מצטט סף אחד בעוד המסד אוכף אחר,
// **בלי שום שגיאה** — בדיוק הכשל השקט שכל המעבר הזה בא למנוע. הנוסח עצמו (כרטיס-P2) לא זז.
const feedbackReasonGate = (threshold) =>
  `חסום: ציון מתחת ל-${threshold} מחייב בחירת סיבת-בירור מהרשימה, אחרי בירור טלפוני.` // כרטיס-P2
// שני הנוסחים שהיו חסרים: עד כה "שמור סטטוס" נכבה גם בשני המצבים האלה **בלי מילה על המסך**.
// ‏A-1 (הכרעת-הבלופרינט) קובעת disabled-with-reason כדפוס-הבית; כפתור מת בלי סיבה הוא בדיוק
// מה שהיא נכתבה נגדו. ⚠️ **הנוסח של "אין ציון" מראה את מה שהמסד יענה בלאו הכי**
// (‏`record_feedback`: "יש לבחור ציון בין 1 ל-5") — המסך והשרת אומרים אותו דבר.
const FEEDBACK_SCORE_GATE = 'חסום: יש לבחור ציון בין 1 ל-5, או לסמן "לא ענה לסקר".'
const FEEDBACK_UNCHANGED_GATE = 'אין שינוי לשמור — עדכני ציון, סיבה או הערות.'
// שני שערי-ענף-הביטול, שעד 28/08/2026 היו בוליאנים בלבד: "שמור דמי-ביטול" ו"ויתור על החוב"
// נכבו **בלי מילה על המסך**, בדיוק כמו שני המצבים שהשורות שמעל תיקנו. ‏A-1 היא דפוס-הבית.
// ⚠️ ובוויתור זה חמור יותר מכפתור-מת רגיל: תווית-השדה ומציין-המקום שלו נלקחו מילולית
// מהמוקאפ המאושר ואומרים **"חופשי"** — כלומר המסך עצמו מבטיח שההערה היא רשות, בעוד
// הוויתור דורש אותה. ‏🚫 הנוסח המאושר אינו משתנה כאן (אינו הממצא ואינו רשותי) — הסתירה
// נפתרת במשפט שאומר מה חסם, ליד הכפתור שנחסם.
const FEE_SAVE_EMPTY_GATE = 'חסום: יש להזין את הסכום שייחתם.'
const FEE_SAVE_ZERO_GATE =
  'חסום: הסכום שייחתם חייב להיות גדול מ-0. לאיפוס מלא יש להשתמש בכפתור "ויתור על החוב" — ויתור הוא פעולה מפורשת, לא סכום 0.' // P1
const WAIVE_NOTE_GATE = 'חסום: ויתור מחייב הערת-חובה — יש למלא את "הערת-פירוט" שמעל לפני הוויתור.' // P1
// 🔤 נוסח כוח-העליון **אינו נכתב כאן מחדש**: הוא נשאב מהפונקציה שכבר נועלת אותו במודול 6
// (‏`compensationReason`, מהמוקאפ המאושר `07_dialog_cancel_approved.html`). שני המסכים
// מסבירים את אותו כלל (ה25), ומשפט שיוקלד פעמיים יתפצל ביום שאחד מהם ינוסח מחדש.
// הענף של `force_majeure` הוא return מוקדם ואינו נוגע בשאר הארגומנטים; הבדיקה נועלת את
// המחרוזת בייט-בבייט, כדי ששינוי-סדר-ענפים שם לא ירוקן את המשפט כאן בשקט.
const FORCE_MAJEURE_COMP_NOTE = compensationReason({ cancelType: 'force_majeure' })
// 🔤 נלקח מילולית מהודעת-השרת שב-`api.js` (‏`NO_BILLING_EMAIL`) — המסך והשרת אומרים את
// אותו משפט, כדי שמנהלת שראתה את החסימה מראש לא תקבל ניסוח אחר אחרי לחיצה.
const NO_BILLING_EMAIL_NOTE =
  'חסום: אין כתובת מייל לחיוב בכרטיס הלקוח — לא ניתן לשלוח את החשבונית. יש להשלים אותה בכרטיס הלקוח.'
// 🔴 **המשפט השלישי, שעד 01/09/2026 לא היה קיים — והיעדרו הפך תקלת-רשת להצהרה על הלקוח.**
// קריאת פרטי-החיוב נכשלה ⇒ **איננו יודעים** אם יש כתובת. עד היום הכשל הוחזר כ-`null`,
// ו-`null` נקרא במורד-הזרם בדיוק כמו "אין מייל בכרטיס" ⇒ המסך הכריז כעובדה שכרטיס-הלקוח
// חסר כתובת, ושלח את המנהלת למסך שבו הכתובת **כן** רשומה. ⚠️ **החסימה נשארת בשני
// המצבים** — גם כשלא ידוע אין לנו לאן לשלוח — אבל הפעולה הנדרשת הפוכה: שם להשלים נתון,
// כאן לנסות שוב. **התקדים לזוג-הנוסחים הזה חי בקובץ הזה עצמו**: ‏`closing-fee-comp-manual`
// מול `closing-fee-comp-missing` — שני `null` מאותה עמודה, שני משפטים, כי הסיבה שונה.
const BILLING_UNKNOWN_NOTE =
  'חסום: לא הצלחנו לטעון את פרטי החיוב של הלקוח — לא ניתן לשלוח את החשבונית. יש לרענן את המסך ולנסות שוב.'
// A-8 — שעות-סופיות חסרות: משפט רועש, לעולם לא 0 שקט.
// ⚠️ **שני נוסחים ולא אחד, בכוונה.** אותו חוסר-נתון (‏`final_start/end_time` ריקים) מפיל
// שני חישובים שונים, ו-A-8 מנסח את משפטו על **רכיב-הפיצוי** בלבד. אריח סטיית-התקציב אינו
// מחשב פיצוי כלל — משפט שמדבר על "פיצוי" מתחת לתווית "סטיית-תקציב" קורא כמו תקלה במסך.
const NO_PLANNED_HOURS_NOTE = 'לא ניתן לחשב פיצוי — חסרות שעות סופיות'
// 🔴 **ה25 מייצר `null` שני, ומסיבה הפוכה לגמרי — ולכן משפט נפרד ולא שיתוף.** אחרי
// מיגרציה `H4` הפונקציה מחזירה `team_compensation = null` גם בסיווג "אחר", **והשעות שם
// תקינות לחלוטין.** שימוש חוזר ב-`NO_PLANNED_HOURS_NOTE` היה שולח את מנהלת-הכספים לחפש
// שעות חסרות שאינן חסרות — כלומר המיגרציה עצמה הייתה מייצרת שקר על המסך.
const OTHER_NO_PROPOSAL_NOTE = 'אין הצעה אוטומטית — סיווג "אחר"' // ה25
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
  satisfactionThreshold,
}) {
  const paymentOk = Boolean(paid) || Boolean(writtenOff)

  // 🔴 השער השלישי, שהמסך לא הכיר עד שנמדד: המסד חוסם ארכוב גם כשהמשוב "נפתר" אבל
  // הציון נמוך מ-3 ואין סיבה (‏`archive_project`, מיגרציה F). המסלול אינו תיאורטי —
  // הדף הציבורי **אינו יודע לקבל סיבה**, ולכן לקוח שהגיש 2 יוצר בדיוק את המצב הזה.
  // בלי השורה הזאת הכפתור נראה פעיל, המנהלת לוחצת, והשרת עונה P0001.
  // ‏`needsSatisfactionAttention` ולא השוואה מקומית: הסף חי בשורה אחת ב-`params`, והכלל
  // שמפרש אותו חי בפונקציה אחת (`src/lib/customers.js`) שגם מסך-הלקוחות קורא לה.
  const lowScoreNeedsReason =
    needsSatisfactionAttention(
      feedbackScore == null ? null : Number(feedbackScore),
      satisfactionThreshold,
    ) &&
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

  return `🔒 חסום: ${missing.join(', ו')} — שער-הארכוב דורש גם תשלום וגם משוב-פתור.${ok}` // ה10 / כרטיס-P3
}

// המזהה שאליו מצביעים גם הכפתור החסום וגם ה-select — הערך יחיד בדיאלוג, ולכן קבוע ולא נגזר.
const FEEDBACK_GATE_ID = 'closing-feedback-gate-note'
const ARCHIVE_GATE_ID = 'closing-archive-gate-note'
const FEE_SAVE_GATE_ID = 'closing-fee-save-gate-note'
const WAIVE_GATE_ID = 'closing-waive-gate-note'

// שער "שמור דמי-ביטול" — אותה צורה: `null` ⇒ פתוח, אחרת המשפט. שני ענפים ולא אחד, כי
// "לא הקלדתי סכום" ו"הקלדתי 0" הם שתי טעויות שונות: השנייה היא בדיוק המקום שבו המנהלת
// מנסה לוותר דרך הסכום במקום דרך פעולת-הוויתור, ואז ההערה **אינה** נשמרת כהערת-ויתור.
// eslint-disable-next-line react-refresh/only-export-components -- פונקציה טהורה שנועלת נוסח-שער, כמו `archiveGateNote` שמעליה
export function feeSaveGateNote({ amount }) {
  if (amount == null || !Number.isFinite(amount)) return FEE_SAVE_EMPTY_GATE
  if (amount <= 0) return FEE_SAVE_ZERO_GATE
  return null
}

// שער "ויתור על החוב" — ה28/P1: ויתור = סכום 0 **+ הערת-חובה**, ולכן הערה ריקה חוסמת.
// eslint-disable-next-line react-refresh/only-export-components -- כנ"ל: פונקציה טהורה שנועלת נוסח-שער
export function waiveGateNote({ note }) {
  return String(note ?? '').trim() === '' ? WAIVE_NOTE_GATE : null
}

// 🔢 שעות-לפני-האירוע לתצוגה. ‏`hours_before_event` נולד במסד כ-
// `extract(epoch from (event_start - cancelled_at)) / 3600.0` — חלוקת `numeric` בלי `round` —
// ו-`cancelled_at` נכתב מ-`now()` בלחיצה, כלומר **ערך עגול הוא צירוף-מקרים ולא המקרה
// הרגיל**. ‏`numeric` עובר מ-PostgREST במלוא הסקאלה (המדידה החיה בכותרת
// `src/lib/projectFinance.js`: `"202.5000000000000000"`), ולכן הדפסה גולמית נותנת מספר
// בן 16–18 ספרות בתוך משפט שמצדיק סכום שנגבה מלקוח — קריאה כמו תקלה, לא כמו נימוק.
// ⚠️ **ספרה אחת ולא שלם**, בכוונה: הסולם (24 / 72) נבדק **במסד** על הערך המדויק, ועיגול
// לשלם היה יכול להציג "72 שעות ⇐ 0%" בעוד הטווח שאותו משפט מצטט מכיל את 72.
// 🚫 ואין כאן חישוב-מחדש של הסולם — האחוז מגיע כפי שהמסד קבע אותו (③ בראש הקובץ).
// eslint-disable-next-line react-refresh/only-export-components -- כנ"ל: פורמט טהור, לא רכיב
export function formatHoursBeforeEvent(value) {
  if (value == null) return '—'
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(1) : '—'
}

// שער "שמור סטטוס" — אותה צורה בדיוק כמו `archiveGateNote`: `null` ⇒ פתוח, אחרת **המשפט**
// שיוצג ליד הכפתור. עד כה שלושת הענפים חיו כבוליאני אחד, ושניים מהם כיבו את הכפתור בשתיקה.
// eslint-disable-next-line react-refresh/only-export-components -- פונקציה טהורה שנועלת נוסח-שער, כמו `archiveGateNote` שמעליה
export function feedbackGateNote({ score, reason, touched, satisfactionThreshold }) {
  if (score == null) return FEEDBACK_SCORE_GATE
  if (
    needsSatisfactionAttention(score, satisfactionThreshold) &&
    String(reason ?? '').trim() === ''
  ) {
    return feedbackReasonGate(satisfactionThreshold)
  }
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
  const paid = detail?.payment_date != null
  // חוב-אבוד פותח את צד-התשלום בדיוק כמו תשלום שנרשם — אותה הכרעה כמו ב-`archiveGateNote`,
  // ואותו זוג-תנאים בדיוק. אילו הוא נכתב כאן מחדש, שער-הארכוב והמאזן היו יכולים להיפרד.
  const archiveGateOpen = (paid || writtenOff) && feedbackResolved

  return {
    cancelled,
    // ‏"נעול" = ארכוב שקרה, או ביטול שכבר נפתר. בשניהם אין יותר מה לערוך (P3).
    locked: archived || cancelResolved,
    archived,
    cancelResolved,
    feeSet,
    writtenOff,
    invoiceSent: detail?.invoice_sent === true,
    paid,
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
    // אחד** ומפרה את F16/R1-4 ("מספר-הכנסה אחד"). מבוטל-שנפתר מקבל את הרווח-הקפוא לבדו,
    // וזה נשאר נכון גם אחרי התיקון שמתחת — ולכן `!cancelled` הוא תנאי ולא הערה.
    //
    // 🔴 **ומתי כן — תוקן 01/09/2026, כי הקוד הפוך מהתהליך המאושר.** עד היום הבלוק היה
    // ‏`archived` בלבד ⇒ **הרווח נקפא בלי שאיש ראה אותו:** המנהלת לחצה "העבר לארכיון"
    // על מספר שהמסך מעולם לא הציג לה, והפעולה בלתי-הפיכה. כרטיס-P3 קובע את הסדר
    // מפורשות — *"התשלום נכנס והמשוב נפתר. החלון מציג **תחשיב-מאזן** … שורה תחתונה
    // מודגשת: רווח גולמי בשקלים + סטיית-תקציב לצידה. 'העבר לארכיון' → חלונית-וידוא →
    // ה-RPC מקפיא את הרווח-הסופי"* — והתצוגה המאושרת מסמנת את השורה **"נגזר, נקפא
    // בארכוב"**, כלומר מספר חי שקופא, לא מספר שנולד בארכוב.
    // ⚠️ **ומה שחשבתי שסותר ולא סותר:** ההערה כאן טענה קודם *"התצוגה המאושרת מציירת
    // מאזן בתצוגה ב' בלבד"* — וזה נכון על **המוקאפ** (‏א' הוא #12, פרויקט שהחשבונית שלו
    // טרם יצאה, ושם באמת אין מאזן). המוקאפים הם רפרנס ויזואלי והאפיון המאושר גובר
    // עליהם; הם פשוט לא ציירו את המצב הזה. **המצב המוקדם נשאר בלי מאזן, כפי שהמוקאפ
    // מראה** — לפני תשלום אין מה למאזן, וזו הסיבה שהתנאי הוא השער ולא "תמיד".
    showBalance: archived || (!cancelled && archiveGateOpen),
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
// ‏`fullWidth` (ברירת-מחדל כבויה) מוסיף `w-full` — בדיוק כמו `.gate-note{width:100%}` במוקאפ
// המאושר — שגורם לפתק לתפוס שורה שלמה משלו כשהוא יושב לצד כפתור בתוך שורת-flex עם flex-wrap.
// בלעדיו, בתוך flex-row בלי wrap, הדפדפן מכווץ את הטקסט לעמודה צרה במקום לשבור שורה — בדיוק
// התקלה שנמדדה בשורת-הכפתורים התחתונה של ClosingFooter. נשאר כבוי בברירת-מחדל כדי לא לשנות
// אתרי-קריאה אחרים (למשל הפתק שליד "שמור ושלח") שהמוקאפ מצייר אותם כטקסט-שורה רגיל.
function GateNote({ children, testId, id, fullWidth = false }) {
  return (
    <span
      className={cn('text-[11px] leading-relaxed text-amber-800', fullWidth && 'w-full')}
      data-testid={testId}
      id={id}
    >
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

function IdentityBlock({ detail, billing, invoiceName, showFeedback, showPaymentDate }) {
  return (
    <div>
      <SectionTitle>
        {showFeedback ? 'פרטי חיוב · תשלום · משוב — נעול לעיון' : 'פרטי חיוב — נעול לעיון'}
      </SectionTitle>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2" data-testid="closing-identity">
        <Cell label="לקוח">
          <Val>{detail.customer_name ?? '—'}</Val>
        </Cell>
        {/* ‏ח.פ — התא היה כתוב מאז צעד 3.2 ו**מעולם לא רונדר**: `getBillingContact` לא
            שלפה את `company_number`, ולכן התנאי שמעליו לעולם לא התקיים והשדה שהתצוגה
            המאושרת מבטיחה ("ח.פ / איש-קשר / מייל-לחיוב") פשוט נעדר מהמסך. השדה נוסף
            ל-select ב-01/09/2026 והתא נדלק. ⚠️ **התנאי נשאר ולא הפך ל-`—`**: העמודה
            `not null` במסד ⇒ ערך חסר כאן פירושו שאין שורת-לקוח או שהקריאה נכשלה, ושני
            אלה כבר נאמרים במפורש במקום אחר במסך — תא `—` היה מוסיף להם "ללא ח.פ" שקרי. */}
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
        {/* ‏"נעול לעיון" מתקיים רק כשהתאריך באמת אינו עריך. כשבלוק-התשלום שמתחת פתוח
            לתיקון, אותו תאריך היה מופיע פעמיים על מסך אחד — פעם כערך-קריאה ופעם בשדה. */}
        {detail.payment_date && showPaymentDate ? (
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
// 🔴 **ומה שהמשפט שמתחתיו אסור לו לומר:** בכוח-עליון האחוז נקבע **לפני** שהשעון נבדק
// בכלל (`v_pct := case when v_cancel_type = 'force_majeure' then 0 …` — הענף הראשון
// בפונקציה, ה24/ה25: "כוח-עליון = 0% תמיד"). משפט אחד שמצרף תמיד שעות⇐אחוז היה מציג
// "5 שעות לפני האירוע ⇐ סולם-הביטול נותן 0%" — שקר-לכאורה מול הסולם שהוא עצמו מצטט,
// שממנו מנהלת-הכספים תסיק שהחישוב שבור ותתקן את הסכום ביד.
function CompensationComponent({ proposal, cancelType }) {
  const forceMajeure = cancelType === 'force_majeure'
  const manualOnly = cancelType === 'other'
  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] font-semibold text-slate-700">① פיצוי-צוות</span>
        {proposal?.team_compensation == null ? (
          <span
            className="text-[12px] font-semibold text-amber-800"
            data-testid={manualOnly ? 'closing-fee-comp-manual' : 'closing-fee-comp-missing'}
          >
            {manualOnly ? OTHER_NO_PROPOSAL_NOTE : NO_PLANNED_HOURS_NOTE}
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
      {/* 🔵 H5 — **עוגן-ההחלטה, ולא הצעה.** בסיווג "אחר" המסד מפסיק להציע (ה25/H4), אבל
          החברה **עדיין משלמת** לצוות: ‏`generate_salary_report` מסתעף על `force_majeure`
          בלבד (נמדד 28/08/2026). ⇒ השאלה שלה אינה "כמה לחייב" באוויר אלא "כמה ממה שאנחנו
          כבר משלמים להעביר ללקוח", וזה טווח: ‏0 → הפיצוי → הפיצוי + סחורה.
          🚫 **ואינו זורע את השדה** — מספר לחשוב עליו, לא ברירת-מחדל שנשמרת בלחיצה. */}
      {manualOnly && proposal?.payout_compensation != null ? (
        <div
          className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
          data-testid="closing-fee-payout-anchor"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12.5px] font-semibold text-slate-700">
              הצוות יקבל בפועל (משולם בדוח-השכר)
            </span>
            <Money
              amount={proposal.payout_compensation}
              cents
              className="text-sm font-semibold text-slate-800"
              data-testid="closing-fee-payout"
            />
          </div>
          <Sub className="mt-1 block">
            זהו הסכום שהחברה משלמת בלי קשר לשאלה מי ביטל. ההחלטה שלך היא{' '}
            <b>כמה מתוכו להעביר ללקוח</b> — אפס (החברה סופגת) · הסכום המלא · או הסכום בתוספת הסחורה
            שכבר הוזמנה.
          </Sub>
        </div>
      ) : null}

      <Sub className="mt-1 block" testId="closing-fee-comp-why">
        <Ltr>{proposal?.compensated_count ?? '—'}</Ltr> דיילות מאושרות-סופית · הביטול נעשה{' '}
        <Ltr>{formatHoursBeforeEvent(proposal?.hours_before_event)}</Ltr> שעות לפני האירוע{' '}
        {forceMajeure ? (
          // ה25 — כוח-עליון מאפס פיצוי תמיד, ללא תלות בשעון.
          <>
            · הביטול סווג ככוח-עליון ⇐ <Ltr>{proposal?.compensation_pct ?? '—'}%</Ltr>.{' '}
            {FORCE_MAJEURE_COMP_NOTE}{' '}
          </>
        ) : manualOnly ? (
          // 🔴 בסיווג "אחר" **אסור לצטט את הסולם**: הוא לא הופעל. השעות נשארות עובדה
          // מוצגת — הן נכונות, הן פשוט אינן קובעות כאן אחוז. (ה25)
          <>· הביטול סווג כ"אחר" ⇐ הסולם אינו מופעל, והסכום נקבע בשיקול-דעתך. </>
        ) : (
          // ה24 — סולם-הביטול הסטנדרטי.
          <>
            ⇐ לפי מדרג-הביטול נותן <Ltr>{proposal?.compensation_pct ?? '—'}%</Ltr>.{' '}
          </>
        )}
        {/* ה29 */}
        בלי רכיב-נסיעות — משמרת שבוטלה לא נסעה.
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
        {/* כרטיס-P1 */}
        שורה חופשית בלי מעקב-סטטוס במסד — אינה נשמרת, ואינה נכנסת מעצמה לסכום שייחתם.
      </Sub>
    </div>
  )
}

// ‏`cancelType` נכנס לכאן בשביל ה25 בלבד: בסיווג "אחר" השדה נשאר ריק **ואומר למה**.
// שדה ריק בלי משפט נראה כמו תקלת-טעינה, וזה בדיוק המקום שבו מנהלת ממלאת את המספר
// מהתת-סכום שמעל — כלומר חוזרת לאוטומט שההכרעה ביקשה לבטל.
function FeeAmountFields({ amount, note, cancelType, onAmount, onNote }) {
  const manualOnly = cancelType === 'other'
  return (
    <>
      <SectionTitle>סכום דמי-הביטול הסופי</SectionTitle>
      {manualOnly && (
        <p
          className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] leading-relaxed text-amber-800"
          role="note"
          data-testid="closing-fee-manual-only"
        >
          {/* ה25 */}
          ביטול בסיווג <b>"אחר"</b> — אין הצעה אוטומטית. הביטול אינו בהכרח באשמת הלקוח, ולכן הסכום
          נקבע בשיקול-דעתך. התחשיב שמעל מוצג לעיון בלבד.
        </p>
      )}
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          {/* ה28 */}
          <label className="text-xs text-slate-500" htmlFor="closing-fee-amount">
            הסכום שייחתם (עריך)
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
          disabled={actions.saveNote != null || busy !== ''}
          title={actions.saveNote ?? undefined}
          aria-describedby={actions.saveNote ? FEE_SAVE_GATE_ID : undefined}
          data-testid="closing-save-fee"
          className="h-auto rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700"
          onClick={actions.onSaveFee}
        >
          {busy === 'fee' ? 'שומר...' : 'שמור דמי-ביטול'}
        </Button>
        <Button
          type="button"
          variant="outline"
          title={actions.waiveNote ?? WAIVE_TITLE}
          disabled={actions.waiveNote != null || busy !== ''}
          aria-describedby={actions.waiveNote ? WAIVE_GATE_ID : undefined}
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
      {/* עמודה ולא שורה: ‏`GateNote` הוא `span`, ושני משפטי-שער זה לצד זה בתוך אב-בלוק
          היו נדבקים לפסקה אחת. ‏`w-full` (ה-`fullWidth`) פועל רק בתוך flex — בדיוק
          התקלה שנמדדה בשורת-הכפתורים של ClosingFooter. */}
      <div className="mt-1 flex flex-col gap-1">
        {actions.saveNote ? (
          <GateNote testId="closing-fee-save-gate" id={FEE_SAVE_GATE_ID} fullWidth>
            {actions.saveNote}
          </GateNote>
        ) : null}
        {actions.waiveNote ? (
          <GateNote testId="closing-waive-gate" id={WAIVE_GATE_ID} fullWidth>
            {actions.waiveNote}
          </GateNote>
        ) : null}
        <GateNote testId="closing-fee-actions-note" fullWidth>
          {CANCEL_ACTIONS_NOTE}
        </GateNote>
      </div>
    </>
  )
}

function FeeProposalBlock({ proposal, cancelType, form, withManual, busy, actions }) {
  return (
    <div data-testid="closing-fee-block">
      {/* P1 · ה24 / ה23 */}
      <SectionTitle>פירוט דמי-הביטול המוצע</SectionTitle>

      <CompensationComponent proposal={proposal} cancelType={cancelType} />

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
          {/* ה23 */}
          "מחיר מלא" = מחיר-הלקוח שהוקפא בהצעה, לא עלות — ורק שורות שכבר "הוזמן"/"מוכן" בלוגיסטיקה
          נכנסות.
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
        cancelType={cancelType}
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

// סדר-הענפים הוא לוגיקת-אמת ולא סגנון: "לא הצלחנו לקרוא" **קודם** ל"אין מייל", כי כשלא
// קראנו איננו יודעים דבר על הכרטיס — בדיוק ההיפוך שנדרש ב-`SendResultTag` של דוח-השכר.
function InvoiceGateNote({ billingUnknown, billingEmailMissing, hasFile }) {
  if (billingUnknown) {
    return <GateNote testId="closing-invoice-gate">{BILLING_UNKNOWN_NOTE}</GateNote>
  }
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
  billingUnknown,
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
        <InvoiceGateNote
          billingUnknown={billingUnknown}
          billingEmailMissing={billingEmailMissing}
          hasFile={Boolean(file)}
        />
      </div>
    </div>
  )
}

// 🆕 הפקד שהשלים Q-1 (הכרעת-ישי 26/08/2026): "ממתין לתשלום" לא צויר באף תצוגה מאושרת.
//
// 🔴 **והבלוק אינו נעלם ברגע שנרשם תאריך** (תוקן 28/08/2026). קודם לכן `!phase.paid` הוריד
// אותו מיד אחרי השמירה, והתאריך הפך לערך-קריאה — כלומר הקלדה של 04/09 במקום 04/10 לא
// הייתה ניתנת לתיקון **בשום מסך**. ‏**המסד מעולם לא אסר זאת:** `record_payment` הוא
// `update projects set payment_date = …` בלי שום שער-חד-פעמיות (מיגרציה E2) — האיסור היה
// של ה-UI בלבד, ולא נובע מאף הכרעה רשומה (המוקאפ המאושר אינו מצייר את הבלוק כלל).
// ⚠️ **החריג נשמר במפורש: בפרויקט מבוטל רישום-התשלום הוא גם רגע הקפאת-הרווח (Q-4)**,
// והתיק ננעל מיד — שם הבלוק אכן נעלם, וזה נגזר מ-`phase.locked`, לא מכאן.
function PaymentBlock({ value, alreadyPaid, onChange, onSave, onOpenWriteOff, busy }) {
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
          {busy === 'payment' ? 'שומר...' : alreadyPaid ? 'עדכון תאריך התשלום' : 'שמור תשלום'}
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
//
// 🔴 **‏`showNoResponse` — למה הכפתור נעלם דווקא בתיקון-ציון (01/09/2026).** ‏`record_feedback`
// במסלול "לא ענה לסקר" כותב `feedback_status = 'no_response'` **ואינו מנקה את `feedback_score`**
// (מיגרציית פעולות-הכתיבה, הענף הראשון בפונקציה). ⇒ לחיצה עליו על פרויקט שכבר יש לו ציון
// הייתה מייצרת שורה שאומרת בו-זמנית "הלקוח נתן 4" ו"הלקוח לא ענה" — מצב שאף מסך אינו יודע
// להציג, ושאין ממנו דרך חזרה מלבד תיקון-מסד. ⚠️ **וזו אינה החמרה של הזרימה הקיימת:** עד
// היום הבלוק כולו רונדר רק כשאין ציון, ולכן הצירוף הזה **מעולם לא היה נגיש** — הפרמטר רק
// שומר שהוא לא ייעשה נגיש בדלת האחורית שנפתחה עכשיו.
function FeedbackEntry({ score, onScore, onNoResponse, busy, showNoResponse = true }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <RatingStars value={score} onChange={onScore} testId="closing-feedback-stars" />
      {showNoResponse ? (
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
      ) : null}
    </div>
  )
}

// ⚠️ התווית נושאת את הסף, ולכן הוא מוזרק ולא כתוב (מודול 9 · צעד 2.3) — אותה הנמקה
// בדיוק כמו `feedbackReasonGate`: תווית שאומרת מספר אחר ממה שהמסד אוכף מלמדת את
// המנהלת כלל שגוי, בלי שאף בדיקה תיפול.
function FeedbackReasonField({ value, onChange, describedBy, satisfactionThreshold }) {
  return (
    <div className="mt-2 flex flex-col gap-1">
      <label className="text-xs text-slate-500" htmlFor="closing-feedback-reason">
        סיבת-הבירור — חובה בציון מתחת ל-{satisfactionThreshold}
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

function FeedbackTag({ score, tag, children }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <StatusTag label={scoreTagText(score)} tone={tag.tone} testId="closing-feedback-tag" />
      <Sub>
        ציון <Ltr>{tag.score}</Ltr> מתוך <Ltr>5</Ltr>
      </Sub>
      {children}
    </div>
  )
}

// 🔴 **"שנה ציון" — הכרעת-ישי 01/09/2026, והפער שהיא סוגרת.** עד היום גוש-ההזנה רונדר
// **רק** כשאין ציון, ולכן ברגע שציון הגיע — מהדף הציבורי או מהזנה טלפונית — הכוכבים נעלמו
// ולא נותר שום מסלול לתקן אותו: לקוח שהקליד 2 במקום 5, או מנהלת שלחצה על הכוכב השגוי,
// היו נעולים עד הארכוב. האפיון קובע *"תיקון מאוחר — ידני ע"י המנהלת"*, כלומר האפשרות
// הייתה אמורה להתקיים כל הזמן.
// 🔑 **והמסד כבר מרשה זאת בדיוק עד הגבול הנכון, בלי מיגרציה:** `record_feedback` הוא
// ‏`update` בלי שער-חד-פעמיות, הוא מנקה את סיבת-הבירור מעצמו כשהציון החדש ≥ 3, ו-
// `finance_assert_writable` מסרבת ברגע שהפרויקט `finished`. ⇒ **התיקון אפשרי עד הארכוב
// ונחסם אחריו** — וזה בדיוק הגבול שכרטיס-P3 מתאר ("נעילה מוחלטת").
// 🎨 **קישור-טקסט ולא כפתור-טורקיז**, במכוון: הטורקיז המלא שמור לפעולה-הראשית האחת של
// המסך (כלל-המילוי, `PROJECT_MASTER §4`), והתיקון הוא מסלול-חריג ולא מה שהמנהלת באה
// לעשות. **ברירת-המחדל נשארת תצוגת-התג** — הגוש נפתח רק בלחיצה, ונסגר בחזרה בכל טעינה
// ואחרי כל שמירה (`seed`), כי אז התג כבר מציג את הערך החדש.
function FeedbackBlock({
  detail,
  form,
  tag,
  scoreLow,
  busy,
  onNoResponse,
  scoreEditOpen,
  satisfactionThreshold,
  onOpenScoreEdit,
}) {
  const hasScore = detail.feedback_score != null
  return (
    <div data-testid="closing-feedback-block">
      <SectionTitle>משוב הלקוח</SectionTitle>

      {tag ? (
        <FeedbackTag score={detail.feedback_score} tag={tag}>
          {scoreEditOpen ? null : (
            <Button
              type="button"
              variant="link"
              disabled={busy !== ''}
              data-testid="closing-feedback-score-edit"
              className="h-auto p-0 text-[12px] font-semibold text-slate-600 underline"
              onClick={onOpenScoreEdit}
            >
              שנה ציון
            </Button>
          )}
        </FeedbackTag>
      ) : null}

      {detail.feedback_status === 'no_response' ? (
        <Sub className="mt-2 block" testId="closing-feedback-no-response">
          {/* ה3 */}
          הלקוח לא השיב — השער עובר גם כך. ציון שיתקבל טלפונית עדיין ניתן להזנה כאן.
        </Sub>
      ) : null}

      {!hasScore || scoreEditOpen ? (
        <FeedbackEntry
          score={form.score}
          onScore={form.setScore}
          onNoResponse={onNoResponse}
          busy={busy}
          showNoResponse={!hasScore}
        />
      ) : null}

      {scoreLow ? (
        <FeedbackReasonField
          value={form.reason}
          onChange={form.setReason}
          satisfactionThreshold={satisfactionThreshold}
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
      {/* P3 */}
      <SectionTitle>תחשיב-מאזן</SectionTitle>
      <div
        className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
        data-testid="closing-balance"
      >
        <BalanceRow
          // ה2
          label="הכנסות (הצעה-קפואה + שינויי-תכולה)"
          amount={detail.revenue}
          testId="closing-balance-revenue"
        />
        <BalanceRow
          op="−"
          // ה17
          label="עבודה — שעות בפועל × תעריף קפוא + בונוסים"
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
          // ה18
          label="סטיית-תקציב — עבודה"
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
            // §7.52
            sub="נקפא בשקלים ואינו ניתן לעריכה"
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
          // §7.52
          sub="נקפא בשקלים ואינו ניתן לעריכה"
          testId="closing-final-profit-tile"
        />
      </div>
      <Sub className="mt-1 block" testId="closing-cancelled-no-balance">
        {/* Q-3 */}
        אין תחשיב-מאזן לפרויקט מבוטל: הרווח כאן נגזר מדמי-הביטול בניכוי פיצוי-הצוות ועלות-הסחורה,
        ולא מהכנסות-האירוע — האירוע לא התקיים ולא נגבה עליו התשלום שבהצעה.
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
    <DialogFooter className="flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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
            <GateNote testId="closing-feedback-gate" id={FEEDBACK_GATE_ID} fullWidth>
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
            <GateNote testId="closing-archive-gate" id={ARCHIVE_GATE_ID} fullWidth>
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
  //
  // 🔴 **שלושה מצבים ולא שניים, וזו הצורה הנעולה של הפרויקט** (`src/CLAUDE.md`, חוזה
  // יומן-המיילים): ‏`undefined` = **לא ידוע** · `null` = אין שורה · אובייקט = יש שורה.
  // שלושתם חוסמים שליחה, אבל רק הראשון אומר "נסי שוב" במקום להאשים את כרטיס-הלקוח.
  // ⚠️ **וה-`catch` הריק שהיה כאן לא רק שיקר — הוא גם בלע את השגיאה לגמרי:** אחרי כשל
  // כזה לא נשארה ולו שורה אחת בקונסול, ולכן לא הייתה שום דרך לדעת *מה* נכשל. הצורה
  // זהה לשאר המודול (`FinancePage.jsx`), כדי שכל כשלי-הטעינה ייראו אותו דבר ביומן.
  let contact
  try {
    contact = await getBillingContact(row.customer_id)
  } catch (err) {
    console.error('billing contact load failed:', err)
    contact = undefined
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
function derivedView({ detail, proposal, billing, phase, form, satisfactionThreshold }) {
  const scoreLow = needsSatisfactionAttention(form.score, satisfactionThreshold)
  const manualAgorot = form.manualAmount.trim() === '' ? 0 : toAgorot(form.manualAmount)
  const proposedAgorot = proposal?.proposed_fee == null ? null : toAgorot(proposal.proposed_fee)
  const feeAmountNumber = form.feeAmount.trim() === '' ? null : Number(form.feeAmount)

  return {
    statusLabel: PROJECT_STATUS_LABELS[detail.project_status] ?? detail.project_status,
    tag: detail.feedback_score == null ? null : scoreTag(detail.feedback_score),
    gateNote: archiveGateNote({ ...phase, satisfactionThreshold }),
    scoreLow,
    invoiceName: detail.invoice_file_url ? fileNameOf(detail.invoice_file_url) : null,
    // שני דגלים ולא אחד — ר' `BILLING_UNKNOWN_NOTE`. ‏`undefined` הוא **קריאה שנכשלה**,
    // ולכן הוא **אינו** נספר כ"אין מייל": משפט שמאשים את כרטיס-הלקוח נאמר רק כשבאמת
    // קראנו את הכרטיס. שניהם חוסמים את השליחה.
    billingUnknown: billing === undefined,
    billingEmailMissing: billing !== undefined && !billing?.email,
    withManual:
      proposedAgorot != null && manualAgorot > 0 ? toShekels(proposedAgorot + manualAgorot) : null,
    feeAmountNumber,
    // שני השערים חיים כמשפט ולא כבוליאני, ומצב-הכפתור נגזר מ-`!= null` — בדיוק כמו
    // הארכוב ו"שמור סטטוס" בפוטר. כך אי-אפשר לכבות כפתור בלי שהסיבה תגיע איתו למסך.
    feeSaveGate: feeSaveGateNote({ amount: feeAmountNumber }),
    waiveGate: waiveGateNote({ note: form.feeNote }),
    feedbackGate: feedbackGateNote({
      score: form.score,
      reason: form.reason,
      touched: form.feedbackTouched,
      satisfactionThreshold,
    }),
    // ‏`showInvoiceBlock` כבר נושא את `!archived && !cancelResolved` ⇒ תיק נעול אינו מגיע
    // לכאן כלל. מה שנשאר: תשלום שנרשם **אינו** מוריד את הבלוק בפרויקט רגיל (תיקון), אבל
    // כן מורידו במבוטל — שם התשלום מקפיא את הרווח (Q-4) והתיק ננעל באותה נשימה.
    showPaymentBlock:
      phase.showInvoiceBlock &&
      phase.invoiceSent &&
      !phase.writtenOff &&
      !(phase.paid && phase.cancelled),
    showInvoiceUpload: phase.showInvoiceBlock && !phase.invoiceSent,
    showFeeSaved: phase.cancelled && phase.feeSet,
  }
}

// ── הגוף — ממונטש רק כשהדיאלוג פתוח, ולכן כל פתיחה מתחילה מ-state טרי ────────────────
function ClosingWindowBody({ project, onOpenChange, onChanged, satisfactionThreshold }) {
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
  // גוש-הזנת-הציון בתצוגת-התג נפתח בלחיצה בלבד — ר' ההנמקה מעל `FeedbackBlock`.
  const [scoreEditOpen, setScoreEditOpen] = useState(false)
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
    // 🔴 **ה25: ‏`other` אינו נזרע — הכרעת-ישי, `28/08/2026`.** האפיון קובע מילה-במילה
    // *"‏`other` ⇒ **אין הצעה אוטומטית** (ביטול שאינו-בהכרח-באשמת-הלקוח — שיקול-המנהלת,
    // ידני)"* (`processes-approved.md`, ה25) — **והמסד לא בנה את הענף הזה**: ‏`v_pct` מטפל
    // ב-`force_majeure` בלבד ו-`other` נופל לסולם המלא כמו `customer`. ⇒ עד היום השדה נזרע
    // מראש בסכום שההכרעה אמרה שצריך להיות שיקול-דעת, ולחיצה אחת על "שמור" חייבה לקוח.
    // ⚠️ **ההצעה עצמה נשארת מוצגת** — היא מידע לגיטימי לעיון; מה שהוסר הוא רק ההסכמה
    // השקטה. **וזה תיקון-מסך בלבד:** הפונקציה במסד ממשיכה להחזיר את המספר, ותיקונה דורש
    // מיגרציה (רשום ב-§10 להכרעה נפרדת).
    setFeeAmount(
      row.cancel_type === 'other' || proposalRow?.proposed_fee == null
        ? ''
        : String(Number(proposalRow.proposed_fee)),
    )
    setFeedbackTouched(false)
    // 🔑 נסגר כאן ולא בהאנדלר-השמירה, כי `seed` היא **נקודת-האיפוס היחידה** של הטופס
    // (טעינה ראשונה + כל רענון-אחרי-כתיבה). סגירה בהאנדלר הייתה משאירה מסלול שני שבו
    // הגוש נשאר פתוח על ערך שכבר נשמר.
    setScoreEditOpen(false)
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
    form: { score, reason, feedbackTouched, feeAmount, feeNote, manualAmount },
    // 🔴 **מגיע מ-`FinancePage` ואינו נטען כאן שוב:** המסך והדיאלוג חייבים לקרוא את
    // **אותה שורה** ב-`params` — שתי שליפות נפרדות היו יכולות להיפרד בזמן (רענון של אחד
    // בלבד) ולהציג שני ספים שונים לאותו ציון, בלי שום שגיאה.
    satisfactionThreshold,
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
    saveNote: view.feeSaveGate,
    waiveNote: view.waiveGate,
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
        showPaymentDate={!view.showPaymentBlock}
      />

      {phase.showFeeProposal ? (
        <FeeProposalBlock
          proposal={proposal}
          cancelType={detail.cancel_type}
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
          blocked={!file || Boolean(fileError) || view.billingUnknown || view.billingEmailMissing}
          billingUnknown={view.billingUnknown}
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
          alreadyPaid={phase.paid}
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
          scoreEditOpen={scoreEditOpen}
          satisfactionThreshold={satisfactionThreshold}
          onOpenScoreEdit={() => setScoreEditOpen(true)}
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
                // 🔴 **`null` אינו "רוקן" בצד השני של הגבול, אלא "לא סופק":**
                // ‏`record_feedback` כותב `feedback_notes = coalesce(p_notes, feedback_notes)`
                // (מיגרציה E2) ⇒ שליחת `null` על תיבה שרוקנה **משאירה את ההערה הישנה**,
                // ומיד אחרי טוסט-ההצלחה `refresh()`+`seed()` מחזירים אותה לתיבה. מחיקת
                // הערה שגויה לא הייתה אפשרית בשום מסלול. מחרוזת ריקה עוברת את ה-`coalesce`
                // ומנקה בפועל, ו-`''` נופל כ-falsy בכל אתרי-התצוגה (כאן, ובכרטיס-הפרויקט
                // `projectCard.js` ⇒ `feedback.notes && …`) — כלומר אין שינוי-מראה בשום מצב אחר.
                notes: notes.trim(),
              }),
            'המשוב נשמר.',
          )
        }
      />
    </>
  )
}

export default function ClosingWindowDialog({
  project,
  open,
  onOpenChange,
  onChanged,
  satisfactionThreshold,
}) {
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
          <ClosingWindowBody
            project={project}
            onOpenChange={onOpenChange}
            onChanged={onChanged}
            satisfactionThreshold={satisfactionThreshold}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
