// משטח S1 של מודול 8 — מסך הכספים, מבט-על (`/finance`).
//
// 🔴 **ההחלטה האחת שהמסך משרת** (כרטיס-S1 §②): *"לאיזה פרויקט לפנות עכשיו, ובאיזה שלב-טיפול
// הוא נמצא"*. ⇒ **המסך עצמו אינו כותב דבר.** אין כאן ולו קריאת-RPC כותבת אחת: כל כתיבה קורית
// אחרי הקליק, בתוך `ClosingWindowDialog` (S2) או `SalaryReportDialog` (S3). זו הסיבה שאין כאן
// גם `useToast` — אין פעולה שיש לה תוצאה שצריך לדווח עליה.
//
// 🔴 **אפס נוסחאות בקובץ הזה** (כלל ברזל 14). כל מספר מגיע כ**עובדה** מ-`get_finance_overview`
// (מיגרציה E1) דרך `listFinanceOverview`, וכל גזירה-לתצוגה מגיעה מ-`src/lib/projectFinance.js`:
// מועד-פירעון · ימי-איחור · אחוז-רווח · תגית-ציון. **החריג היחיד** הוא הכפלת-המע"מ בשורת-המשנה
// של עמודת-הסכום — ר' `grossWithVat` למטה, שם מוסבר למה הוא כאן ולמה זה מדווח ולא מוסתר.
//
// 🔴 **שער-הצורה נקרא על כל שורה לפני שנגזר ממנה משהו** (`assertFinanceShape`). זו הסיבה
// שהגזירות עצמן רשאיות להישאר פשוטות: עמודה שנמחקה או שונתה-שם ב-RPC תיפול **בקול אחד**
// בגבול, במקום להתחזות ל-`—` בכל שורה ובכל עמודה. חשבונית שלא נרדפה בגלל "—" שקט היא בדיוק
// הכשל ש-§4.3 (silent-zero doctrine) של מדריך-המיקרו קיים כדי למנוע.
//
// 🔴 **חוסר-הרשאה אינו "אין שורות" — והפעם הוא גם אינו שקט.** ‏`get_finance_overview` פותחת
// ב-`assert_module_permission('כספים', …)` שזורקת `42501`, ולכן ההבחנה כאן **נמדדת מקוד-השגיאה**
// ולא נאמדת מאפס-שורות (בניגוד למסך-הלוגיסטיקה, שקורא טבלה תחת RLS). ענף ① נבדק ראשון.
//
// 🔴 **מבוטל-שנפתר (`tab='resolved_cancelled'`) יורד מהמסך לגמרי** — לא ללשונית 3 ולא לאף לשונית
// אחרת. עוגן: שאלת-מוצר 1 (*"מבוטל ב-1/2 לפי מצב-הפה … לעולם לא ב-3"*) + כרטיס-P1
// (*"עם פתרונם השורה יורדת"*), והתוצאה נבחרה במודע ב-N-6: היסטוריית-הביטולים היא של מ11.

import { useCallback, useEffect, useMemo, useState } from 'react'
import LoadingOrError from '@/components/LoadingOrError'
import PermissionAwareEmpty, { DENIED_MARK } from '@/components/PermissionAwareEmpty'
import StatTile from '@/components/StatTile'
import StatusTag from '@/components/StatusTag'
import RatingStars from '@/components/RatingStars'
import Money from '@/components/Money'
import Ltr from '@/components/Ltr'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate, formatTimestampFull } from '@/lib/dates'
import { toAgorot, toShekels, parseVatPercent, PRICING_PARAM_NAMES } from '@/lib/pricing'
import { PROJECT_STATUS_LABELS, resolveProjectTone, filteredOutSentence } from '@/lib/projects'
import { CANCEL_TYPE_LABELS } from '@/lib/projectCard'
import {
  assertFinanceShape,
  deriveDaysOverdue,
  deriveDueDate,
  derivePercent,
  formatPercent,
  scoreTag,
} from '@/lib/projectFinance'
import { SATISFACTION_THRESHOLD_PARAM_NAME, needsSatisfactionAttention } from '@/lib/customers'
import { getParamValues } from '@/api/params'
import { listFinanceOverview } from './api'
import { getParamValue } from '@/modules/06_projects/closingApi'
import ClosingWindowDialog from './ClosingWindowDialog'
import SalaryReportDialog from './SalaryReportDialog'

// ── מחרוזות המשטח ────────────────────────────────────────────────────────────
// 🔤 מועתקות מהמוקאפ המאושר `01_finance_overview_approved.html` ומ-§3.7 של מדריך-המיקרו,
// ואינן מנוסחות מחדש. הן יושבות כאן ולא ב-`src/lib` מאותו טעם ש-`OUTBOUND_LEGEND` של מ5
// יושב בקומפוננטה שלו: זהו טקסט של משטח יחיד. **כולן בלשון-נקבה** (S-28).
const PAGE_TITLE = 'כספים'
const PAGE_SUBTITLE = 'בקרת גבייה, סגירת-תיקים ודו"ח-שכר'
const SALARY_BUTTON_LABEL = 'הפקת דוח-שכר'
const NO_PERMISSION_SENTENCE = 'אין לך הרשאה לצפות בנתוני הכספים.'
const FILTERED_EMPTY_TITLE = 'אין פרויקט התואם לסינון שבחרת.'
const CLEAR_FILTER_LABEL = 'נקי סינון'
const CANCELLATION_FEE_TAG = 'דמי-ביטול'
const CANCELLATION_FEE_UNRESOLVED = 'דמי-ביטול — טרם נפתרו'
const OPERATIONALLY_CLOSED_NOTE = 'נסגר תפעולית'
// 🔤 המילה שהמוקאפ המאושר מצייר **בתא-התאריך** של שורה מבוטלת (שורת #14:
// `<div class="calm">בוטל</div>`) — בדיוק כפי ש-`OPERATIONALLY_CLOSED_NOTE` יושב שם לשורה
// שנסגרה תפעולית. **סוג-הביטול אינו כאן** אלא בשורת-ההקשר שתחת שם-הפרויקט, שם המוקאפ מצייר
// אותו; שני התאים מספרים שני דברים — *מה קרה בתאריך הזה* מול *מי ביטל*.
const CANCELLED_DATE_NOTE = 'בוטל'
const WRITTEN_OFF_TAG = 'הסתיים — לא שולם'
// 🔤 **אותו פועל שהמסך כבר נועל בשלילה** (`WRITTEN_OFF_TAG` — "הסתיים — לא שולם"), בחיוב.
// לא מילה חדשה על המשטח אלא הצד השני של אוצר-מילים שכבר אושר, ולכן אין כאן ניסוח שהומצא.
const PAID_TAG = 'שולם'
// זהה-בייט ל-`CREDIT_NOTE_LINE` של S2 (`ClosingWindowDialog.jsx`) — אותו דגל, אותן מילים.
// ‏A-9 השאיר את הניסוח ל-🗣️; S2 נבנה קודם וקבע אותו, ושני נוסחים לאותו דגל היו הפגם.
const CREDIT_NOTE_LINE = 'נדרשת חשבונית זיכוי'
const VAT_SUFFIX = 'כולל מע"מ'
const DASH = '—'

// 🔤 רצועת-הסיכום (הכרעת-ישי 28/08/2026). "סה"כ ממתין לגבייה" הוא הניסוח שהמוקאפ המאושר
// עצמו שקל ודחה בזמנו — לא מומצא כאן (`01_finance_overview_approved.html`, "מה הכרעתי לבד"
// ②: "אין אריחי-KPI מעל הטבלה … כל מדד-סיכום (למשל 'סה"כ ממתין לגבייה')..." — האריח לא
// היה מוצדק על ארבע שורות-בדיקה; על נתוני-אמת הוא כן). ממשיכים את אותו אוצר-מילים במקום
// להמציא חדש (מעבר-ניסוח, `src/CLAUDE.md`).
const SUMMARY_OPEN_LABEL = 'סה"כ ממתין לגבייה'
const SUMMARY_OVERDUE_LABEL = 'מתוכו באיחור-תשלום'
const SUMMARY_OPEN_UNKNOWN = 'לא ידוע — דמי-ביטול טרם נקבעו'

// שלוש הלשוניות, בשמן ובסדר שהמוקאפ מצייר. ‏`key` = הערך ש-`get_finance_overview` מחזיר
// בעמודת `tab`, כדי שהשיוך יגיע מהמסד ולא ייגזר כאן שנית (B-9 חי במסד, לא כאן).
const TABS = [
  { key: 'awaiting_invoice', label: 'ממתין לחשבונית' },
  { key: 'awaiting_payment', label: 'ממתין לתשלום' },
  { key: 'finished', label: 'פרויקטים שהסתיימו' },
]

const DEFAULT_TAB = 'awaiting_payment'

// כל 22 העמודות שטבלת-ההחזרה של `get_finance_overview` מצהירה עליהן (מיגרציה E1).
// 🔴 **הרשימה מלאה בכוונה ולא "מה שאני משתמש בו"** — שדה שנעלם ואיש לא קרא לו הוא בדיוק
// המקרה ש-`assertFinanceShape` קיים בשבילו; רשימה חלקית הייתה מחזירה אותו לחוסר-כיסוי.
const OVERVIEW_FIELDS = [
  'project_id',
  'event_name',
  'customer_id',
  'customer_name',
  'project_status',
  'tab',
  'revenue',
  'gross_profit',
  'final_profit',
  'invoice_sent',
  'invoice_sent_at',
  'payment_date',
  'payment_terms_days',
  'feedback_status',
  'feedback_score',
  'cancelled_at',
  'cancel_type',
  'cancellation_fee',
  'written_off',
  'credit_note_flag',
  'operationally_closed_at',
  'archived_at',
]

// "היום" בשעון **ישראל** ולא ב-UTC: בין חצות ל-03:00 בישראל ה-UTC עדיין באתמול, וימי-האיחור
// היו קופצים ביום שלם על מסך שכל תפקידו הוא לומר מי מאחר. נקרא פעם אחת בטעינה ומוחזק
// ב-state — ‏`react-hooks/purity` אוסר שעון בגוף render.
function todayIso() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const at = (type) => parts.find((part) => part.type === type)?.value ?? ''
  return `${at('year')}-${at('month')}-${at('day')}`
}

// חותמת-זמן ⇒ `DD/MM/YYYY` בשעון ישראל. 🔴 **נגזר מהפורמט הנעול ולא מפרסר שני:** ארבע
// עמודות-התאריך של המסך הן `timestamptz`, ‏`formatDate` דוחה חותמת במכוון, ו-`new Date(...).
// toISOString().slice(0,10)` היה מחזיר את יום ה-UTC. חיתוך של `formatTimestampFull` משאיר
// מקור-אמת אחד לפענוח-אזור-הזמן — אותו דפוס בדיוק כמו `dayMonth` ב-`LogisticsPage.jsx`.
function stampDate(iso) {
  const full = formatTimestampFull(iso)
  return full ? full.slice(0, 10) : ''
}

// אותו יום-לוח, בצורת `YYYY-MM-DD` — הצורה שבה `<input type="date">` מחזיר את ערכו, ולכן
// הצורה היחידה שמותר להשוות אליה. נגזר מ-`stampDate` ולא מפרסר שלישי.
function israelDayIso(iso) {
  const text = stampDate(iso)
  if (!text) return null
  return `${text.slice(6, 10)}-${text.slice(3, 5)}-${text.slice(0, 2)}`
}

// סכום כולל מע"מ, באגורות שלמות (כמו `src/lib/pricing.js`).
// ⚠️ **החריג היחיד לכלל 14 בקובץ הזה, ומדווח ולא מוסתר:** הבית הנכון של הגזירה הזאת הוא
// `src/lib/projectFinance.js` לצד `derivePercent` — אבל אותו קובץ נסגר בפזה 2 ואינו בבעלות
// הצעד הזה. ‏`computeQuoteTotals` אינה מתאימה (היא מקבלת שורות-הצעה, לא סכום בודד).
// 🔴 שיעור-מע"מ חסר ⇒ `null` ⇒ `—`, **לעולם לא "כמו הסכום עצמו"**: מע"מ 0% הוא מספר שנראה
// מדוד ואינו (אותו נימוק בדיוק שמופיע ב-`toFiniteNumber` של `pricing.js`).
function grossWithVat(amount, vatPercent) {
  if (amount === null || amount === undefined || vatPercent === null) return null
  const n = Number(amount)
  if (!Number.isFinite(n)) return null
  return toShekels(Math.round(toAgorot(n) * (1 + vatPercent / 100)))
}

// שורה מבוטלת: הסכום שעל הפרק הוא **דמי-הביטול**, לא הכנסת-ההצעה (כרטיס-P1 — הביטול מחויב
// דרך מסלול-P1). ‏`null` = טרם נפתרו ⇒ `—` + שורת-משנה בענבר.
function isCancelledRow(row) {
  return row.project_status === 'cancelled'
}

// שדה-התאריך שהלשונית מציגה. 🔑 **הסינון פועל על אותו שדה בדיוק** — מסנן-טווח שרץ על תאריך
// שאינו על המסך אינו ניתן לאימות בעין, והמנהלת הייתה רואה שורות נעלמות בלי סיבה נראית.
function rowDateIso(row, tab) {
  if (tab === 'awaiting_payment') return row.invoice_sent_at
  if (tab === 'finished') return row.archived_at
  return isCancelledRow(row) ? row.cancelled_at : row.operationally_closed_at
}

// ── הכנת-השורות: שער-הצורה ואז הגזירות ──────────────────────────────────────
// כל מה שיכול לזרוק (שער-הצורה · `scoreTag` על ציון מחוץ ל-1–5 · `deriveDueDate` על עמודה
// שנעלמה) רץ **כאן, בתוך try אחד**, ולא בגוף ה-render: מסך-כספים שקורס באמצע ציור מציג
// חצי-טבלה, ומסך-שגיאה מלא הוא התשובה הנכונה.
function prepareRows(raw, today, vatPercent) {
  try {
    const rows = raw.map((row) => {
      assertFinanceShape(row, OVERVIEW_FIELDS, 'שורות מסך הכספים')
      const cancelled = isCancelledRow(row)
      const amount = cancelled ? row.cancellation_fee : row.revenue
      return {
        row,
        cancelled,
        // 🔴 **החוב פתוח או סגור — נגזר פעם אחת, וכל מי שצריך אותו קורא מכאן.**
        // עד `28/08/2026` התנאי הזה חי **רק בתוך `isActionable`**, כלומר שלט על צבע-הרקע
        // בלבד: ‏`record_payment` (מיגרציה E2) כותבת `payment_date` ו**אינה נוגעת
        // ב-`project_status`**, ו-`get_finance_overview` משייכת ללשונית לפי הסטטוס בלבד ⇒
        // תיק ששולם **נשאר ב"ממתין לתשלום"** עד הארכוב — וזה לא רגע אלא ימים, כי שער-הארכוב
        // דורש גם משוב-פתור. באותם ימים הרקע הענברי כבה בעוד מונה-ימי-האיחור המשיך לגדול
        // באדום על אותה שורה. שני חצאי-אותו-כלל שחיים בשני מקומות — ‏SSOT אחד, ולא שניים.
        debtOpen: row.payment_date === null && !row.written_off,
        feeUnresolved: cancelled && row.cancellation_fee === null,
        amount,
        amountWithVat: grossWithVat(amount, vatPercent),
        dueDate: deriveDueDate(row.invoice_sent_at, row.payment_terms_days),
        daysOverdue: deriveDaysOverdue(row.invoice_sent_at, row.payment_terms_days, today),
        profitPercent: derivePercent(row.final_profit, row.revenue),
        score: scoreTag(row.feedback_score),
      }
    })
    return { rows, shapeError: null }
  } catch (err) {
    return { rows: [], shapeError: err?.message ?? 'נתוני הכספים שהתקבלו מהשרת אינם בצורה צפויה.' }
  }
}

// מסנני סרגל-החיפוש (C5 §5.6.13). טווח פתוח משני צדדיו; `from > to` **אינו שגיאה** אלא
// פשוט טווח ריק — ‏A-2: אף מקור לא מגדיר ולידציה לשדות-הסינון, ובניית מסך-שגיאה שאיש לא
// ביקש היא המצאה. התוצאה היא מצב-הריק ③ עם "נקי סינון", וזו פעולה הפיכה בקליק אחד.
function matchesFilters(entry, tab, filters) {
  const { from, to, company, projectNumber } = filters
  const day = israelDayIso(rowDateIso(entry.row, tab))
  if (from && (!day || day < from)) return false
  if (to && (!day || day > to)) return false
  const name = (entry.row.customer_name ?? '').toLowerCase()
  if (company.trim() && !name.includes(company.trim().toLowerCase())) return false
  if (projectNumber.trim() && !String(entry.row.project_id).includes(projectNumber.trim())) {
    return false
  }
  return true
}

const EMPTY_FILTERS = { from: '', to: '', company: '', projectNumber: '' }

// ── מיון ברירת-המחדל פר-לשונית (A-10, אושר עם הבלופרינט `26/08/2026 22:43`) ───
// כל לשונית עונה על שאלה אחרת, ולכן "השורה שצריכה להיות ראשונה" היא שורה אחרת בכל אחת:
// **① "ממתין לחשבונית" — תאריך-הסגירה-התפעולית, עולה:** החוב הוותיק ביותר קודם, כי הוא זה
// שממתין הכי הרבה זמן לחשבונית שטרם יצאה. **② "ממתין לתשלום" — ימי-איחור, יורד:** זו בדיוק
// ההדגשה שהמוקאפ המאושר כבר מצייר בעמודה הזאת (המונה האדום) — **והדגשה בלי מיון פירושה
// שהחוב המאחר ביותר יכול לשבת בשורה האחרונה** ולהיקרא אחרון, כלומר המסך מסמן דחיפות ומסתיר
// אותה באותה נשימה. **③ "הסתיימו" — תאריך-הארכוב, יורד:** לשונית-עיון, ומה שנסגר עכשיו הוא
// מה שמחפשים בה.
//
// 🔴 **המיון חי כאן ולא ב-`get_finance_overview`, במכוון.** ‏`order by p.project_id` שבמסד
// נשאר **סדר-הבסיס היציב** שעליו נשען המיון שכאן; מה שמסודר כאן הוא **מה שהמשתמשת רואה**,
// והוא תלוי בלשונית ובמסננים — כלומר במצב-מסך שהמסד אינו מכיר. סדרי-הגודל הם עשרות שורות,
// ולכן זהו אותו שיקול שכבר הוכרע במסננים שלמעלה: **ממיינים מחדש, לא שולפים מחדש.**
// ⚠️ **וזו אינה פרצה בכלל 14:** אין כאן חישוב-כסף חדש אלא **סידור** של מספרים שהמסד כבר
// החזיר וש-`prepareRows` כבר גזר. מיגרציה בשביל שינוי-תצוגה הייתה קונה שער-מסד ותו לא.
//
// 🔴 **חוסר-נתון יורד לתחתית — בשתי הכיווניות, ולעולם אינו נחשב כ-0 או כ"היום" (§4.3).**
// ‏`daysOverdue` הוא `null` כשאי-אפשר לחשב אותו (חשבונית שטרם נשלחה · פרמטר תנאי-תשלום חסר),
// ותאריך חסר מחזיר `null` מ-`israelDayIso`. שורה כזאת שהייתה נספרת כ-0 הייתה מתיישבת **בין
// השורות הבריאות** במיון-יורד ובראש הרשימה במיון-עולה — בשני המקרים המסך היה טוען משהו שלא
// נמדד. לכן היא בתחתית, בכוונה ובמפורש, ומי שיגלול אליה יראה `—` ולא מספר.
//
// ‏`entry.daysOverdue` נלקח כמו-שהוא מ-`prepareRows` — **אותה גזירה בדיוק** (`deriveDaysOverdue`)
// שמציירת את המונה האדום בעמודה. נוסחה שנייה כאן הייתה מייצרת מסך שממיין לפי מספר אחד ומציג
// אחר. באותו אופן `rowDateIso` + `israelDayIso` הם אותו שדה-תאריך ואותה המרה שהסינון
// ו-`DateCell` כבר משתמשים בהם ⇒ **הסדר על המסך תמיד מוסבר ע"י התאריך שנראה באותה שורה** —
// כולל שורה מבוטלת בלשונית ①, שמציגה את `cancelled_at` וממוינת לפיו.
const TAB_SORT_DIRECTION = {
  awaiting_invoice: 1, // עולה — הוותיק ביותר בראש
  awaiting_payment: -1, // יורד — המאחר ביותר בראש
  finished: -1, // יורד — האחרון שארוכב בראש
}

// הערך שהלשונית ממוינת לפיו: מספר (ימי-איחור) או `YYYY-MM-DD`. שניהם משתווים ב-`<` ישירות —
// מחרוזת-תאריך בפורמט הזה מסודרת לקסיקוגרפית בדיוק כמו כרונולוגית, ולכן אין כאן פרסר רביעי.
function sortValue(entry, tab) {
  if (tab === 'awaiting_payment') return entry.daysOverdue
  return israelDayIso(rowDateIso(entry.row, tab))
}

// ⚠️ **מעתיק לפני שממיין (`[...entries]`), ולא ממיין במקום.** המערך שמגיע לכאן נולד בשרשרת
// ‏`useMemo`; ‏`sort` במקום היה משנה מערך שקומפוננטה אחרת עדיין מחזיקה ומניחה שלא השתנה —
// באג שאינו מתפוצץ אלא מסדר שורות אחרת בכל רינדור.
// ‏`sort` של JS **יציב** מאז ES2019 ⇒ שוויון מחזיר 0 ומשמר את סדר-הבסיס של ה-RPC
// (`project_id`), כך ששתי שורות עם אותו ערך-מיון לא מחליפות מקום בין רינדורים.
function sortForTab(entries, tab) {
  const direction = TAB_SORT_DIRECTION[tab]
  return [...entries].sort((a, b) => {
    const left = sortValue(a, tab)
    const right = sortValue(b, tab)
    // חוסר-נתון תמיד אחרון, ללא תלות בכיוון המיון.
    if (left === null && right === null) return 0
    if (left === null) return 1
    if (right === null) return -1
    if (left === right) return 0
    return left < right ? -direction : direction
  })
}

// ── רצועת-הסיכום מעל הטבלה (הכרעת-ישי 28/08/2026) ────────────────────────────
// "כמה כסף פתוח לגבייה בסה"כ, וכמה ממנו כבר באיחור" — השאלה שהכותרת-משנה של המסך
// ("בקרת גבייה") מבטיחה ושהטבלה, שמראה רק סכום פר-שורה, לא עונה עליה.
//
// 🔴 **"פתוח לגבייה" = לשוניות ①+② בלבד (`awaiting_invoice`+`awaiting_payment`), לא ③.**
// לשונית "הסתיימו" מוצגת רק אחרי ארכוב, ושער-הארכוב (`archiveGateNote`,
// `ClosingWindowDialog.jsx`) דורש `paid || written_off` **וגם** משוב-פתור לפני שהוא נפתח —
// כלומר כל שורה שם כבר נסגרה כספית (שולמה, או נמחקה כחוב-אבוד). ‏`resolved_cancelled`
// כבר לא מגיע לכאן כלל — הוא לא אחד משלושת המפתחות של `byTab` (B-9 בכותרת הקובץ), אז
// לולאת-החלוקה משמיטה אותו לבד; אין צורך לסנן אותו שוב כאן.
//
// 🔴 **חוב-אבוד (`written_off`) מסונן החוצה במפורש, גם לפני הארכוב.** `record_write_off`
// (מיגרציה E2) אינה נוגעת ב-`project_status` — תיק יכול להיות `written_off=true` ועדיין
// לשבת ב"ממתין לתשלום" עד שהמשוב ייפתר ויאפשר ארכוב, בדיוק כמו שתיק ששולם נשאר שם עד
// הארכוב (`debtOpen` למעלה). ברגע שסומן אבוד, החברה הפסיקה לרדוף אחריו — הוא כבר לא
// "פתוח לגבייה" גם אם עדיין לא ארוכב רשמית.
//
// 🔴 **"לא ידוע" אינו "0" — דוקטרינת-האפס-השקט של המודול (§4.3, `projectFinance.js`).**
// שורת-ביטול שדמי-הביטול שלה טרם נקבעו (`entry.amount === null`, `feeUnresolved`) היא
// כסף אמיתי בלי מספר עדיין — לא כסף שאינו קיים. סכימה ששותקת עליה הייתה מדווחת סכום
// קטן-מדי בלי שום סימן. **הפתרון: מסכמים את מה שכן ידוע, וחושפים במפורש את מה שלא** —
// אם יש שורה כזו, שורת-המשנה אומרת זאת; ואם **כל** הפתוח הוא כזה (0 ידוע, יש לא-ידוע),
// האריח בכלל לא מציג "0 ₪" — הוא מציג `SUMMARY_OPEN_UNKNOWN`, כדי שלא ייקרא כעובדה.
function computeFinanceSummary(byTab) {
  const eligible = [...byTab.awaiting_invoice, ...byTab.awaiting_payment].filter(
    (entry) => !entry.row.written_off,
  )
  let knownAgorot = 0
  let knownCount = 0
  let unresolvedCount = 0
  let overdueAgorot = 0
  let overdueCount = 0
  for (const entry of eligible) {
    if (entry.amount === null) {
      unresolvedCount += 1
      continue
    }
    knownAgorot += toAgorot(entry.amount)
    knownCount += 1
    // אותו תנאי בדיוק כמו `isActionable`'s overdue-branch — עוד תיק שהחוב עליו סגור
    // (שולם/אבוד, `debtOpen=false`) לא נספר, ותיק בלי מועד-פירעון ידוע (`daysOverdue===null`,
    // בעיקר לשונית ① — חשבונית טרם נשלחה) לא יכול להיות "באיחור".
    if (entry.debtOpen && entry.daysOverdue !== null && entry.daysOverdue > 0) {
      overdueAgorot += toAgorot(entry.amount)
      overdueCount += 1
    }
  }
  return {
    openCount: eligible.length,
    knownCount,
    unresolvedCount,
    openTotal: knownCount === 0 && unresolvedCount > 0 ? null : toShekels(knownAgorot),
    overdueCount,
    overdueTotal: toShekels(overdueAgorot),
  }
}

// 🔤 **יחיד/רבים בעברית — נתפס בצילום-מסך על דאטה אמיתית, לא בבדיקה.** האריחים הציגו
// *"1 תיקים בטיפול"*, כי המחרוזת נבנתה עם ריבוי קבוע. **בדיקה עם `openCount: 1` הייתה
// עוברת** — היא בודקת שהמספר נכון, לא שהעברית תקינה. ⇒ הפונקציה הזו היא המקום היחיד
// שבו הצורה נבחרת, וכל אריח חדש שמונה משהו חייב לעבור דרכה.
// ⚠️ ‏`2` בעברית הוא "שני X" ולא "2 X", ולכן שלוש צורות ולא שתיים.
function countLabel(n, singular, plural) {
  if (n === 1) return `${singular} אחד`
  if (n === 2) return `שני ${plural}`
  return `${n} ${plural}`
}

// שורת-המשנה של אריח "ממתין לגבייה" — מונה-התיקים תמיד, ובנוסף אזהרת-החוסר כשהיא רלוונטית.
function summaryOpenSub(summary) {
  if (summary.openCount === 0) return 'אין תיקים פתוחים לגבייה כרגע'
  const base = `${countLabel(summary.openCount, 'תיק', 'תיקים')} בטיפול`
  if (summary.unresolvedCount === 0) return base
  const missing = countLabel(summary.unresolvedCount, 'דמי-ביטול', 'דמי-ביטול')
  return `${base} · לא כולל ${missing} שטרם נקבעו`
}

// ── המסך ─────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [raw, setRaw] = useState([])
  const [vatPercent, setVatPercent] = useState(null)
  // 🔄 סף-המשוב ירד מקבוע-קוד (שלוש השוואות + שתי מחרוזות עבריות שנשאו את המספר) לשורת-`params`
  // ‏`סף_שביעות_רצון` (מודול 9 · צעד 2.3). 🔴 **הוא נטען כאן ומועבר לדיאלוג** ולא נטען
  // פעמיים: העותק שבמסך והעותק שבחלון-הסגירה **חייבים לקרוא את אותה שורה**, אחרת הם
  // מתפצלים בשקט — וזו בדיוק הסיבה שהעותק בלקוח קיים (הודעה ידידותית לפני ה-P0001 של
  // המסד), שהופכת למזיקה ברגע שהשניים אינם מסכימים.
  // ⚠️ ובניגוד למע"מ שמתחתיו — **כשל כאן כן מפיל את המסך**: הסף מכריע אילו שורות נצבעות
  // ואילו נחסמות בשמירה, ו-`—` אינו מצב אפשרי עבורו.
  const [satisfactionThreshold, setSatisfactionThreshold] = useState(null)
  const [loading, setLoading] = useState(true)
  // ‏`error` נושא גם את הענף: `'noPermission'` נבדק ראשון (כרטיס §④).
  const [error, setError] = useState(null)
  const [today, setToday] = useState(todayIso)
  const [reloadTick, setReloadTick] = useState(0)

  const [tab, setTab] = useState(DEFAULT_TAB)
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  // שורת-הפרויקט הפתוחה ב-S2. **השורה עצמה** מועברת לדיאלוג ולא רק המזהה — זה מה
  // ש-`ClosingWindowDialog` מצפה לו (`project.project_id` · `event_name` · `customer_name` ·
  // `operationally_closed_at` · `credit_note_flag`), והוא ממילא שולף את נתוני-הכסף שלו מחדש
  // בפתיחה ואינו נשען על מה שהשורה נשאה.
  const [openProject, setOpenProject] = useState(null)
  const [salaryOpen, setSalaryOpen] = useState(false)
  // מונה-פתיחות ל-`key` של S3 — ר' ההערה באתר-הרינדור.
  const [salaryMountKey, setSalaryMountKey] = useState(0)

  const refresh = useCallback(() => setReloadTick((tick) => tick + 1), [])
  const retry = useCallback(() => {
    setLoading(true)
    setReloadTick((tick) => tick + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [rows, params] = await Promise.all([
          listFinanceOverview(),
          getParamValues([SATISFACTION_THRESHOLD_PARAM_NAME]),
        ])
        if (cancelled) return
        setRaw(rows)
        setSatisfactionThreshold(params[SATISFACTION_THRESHOLD_PARAM_NAME])
        setToday(todayIso())
        setError(null)
      } catch (err) {
        if (cancelled) return
        // ‏42501 = ה-raise של `assert_module_permission`. **ענף-הרשאה ולא "תקלה"** — שני
        // המסכים נראים אחרת ומספרים סיפור אחר, ומיזוגם היה מסתיר חסימת-הרשאה מאחורי
        // "נסי שוב" שלעולם לא יעזור.
        console.error('finance overview load failed:', err)
        setError(err?.code === '42501' ? { kind: 'noPermission' } : { kind: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadTick])

  // שיעור-המע"מ נקרא בנפרד ו**אינו מפיל את המסך**: הוא מזין שורת-משנה תצוגתית בלבד, בעוד
  // הסכום עצמו — המספר שהמנהלת גובה לפיו — מגיע מה-RPC. כישלון כאן ⇒ `null` ⇒ `—` בשורת
  // המשנה, ולא מסך ריק. ‏`getParamValue` זורקת כשהפרמטר חסר (זו התנהגותה במודול 6).
  useEffect(() => {
    let cancelled = false
    getParamValue(PRICING_PARAM_NAMES.VAT_PERCENT)
      .then((value) => {
        if (!cancelled) setVatPercent(parseVatPercent(value))
      })
      .catch((err) => {
        console.error('finance VAT param load failed:', err)
        if (!cancelled) setVatPercent(null)
      })
    return () => {
      cancelled = true
    }
  }, [reloadTick])

  const prepared = useMemo(() => prepareRows(raw, today, vatPercent), [raw, today, vatPercent])

  // 🔴 `resolved_cancelled` (ו-`not_in_finance`, שאינו אמור להגיע כלל) יורדים כאן — ר'
  // הכותרת. השיוך ללשונית מגיע מהמסד; כאן רק פילוח לפי אותו ערך.
  const byTab = useMemo(() => {
    const buckets = { awaiting_invoice: [], awaiting_payment: [], finished: [] }
    for (const entry of prepared.rows) {
      if (buckets[entry.row.tab]) buckets[entry.row.tab].push(entry)
    }
    return buckets
  }, [prepared])

  // רצועת-הסיכום נגזרת מ-`byTab` בלבד — אין כאן קריאת-רשת נוספת ואין נוסחה חדשה, רק
  // סכימה של מה שכבר נטען וכבר נגזר לכל שורה (`entry.amount` / `entry.debtOpen` /
  // `entry.daysOverdue`, שלושתם מ-`prepareRows` למעלה).
  const summary = useMemo(() => computeFinanceSummary(byTab), [byTab])

  // ‏`byTab` תמיד מחזיק את שלושת המפתחות (הוא נבנה מהם), ו-`tab` מגיע רק מ-`TABS` ⇒ אין
  // כאן `?? []` שהיה יוצר מערך חדש בכל render ומפיל את התלות של ה-useMemo שמתחתיו.
  const tabRows = byTab[tab]
  // מסננים ואז ממיינים — ‏`sortForTab` הוא **ברירת-מחדל בלבד**, בלי פקד-מיון על המסך:
  // ‏A-10 קבע סדר, לא בורר, ולא הוכרע שום פקד כזה.
  const visible = useMemo(
    () =>
      sortForTab(
        tabRows.filter((entry) => matchesFilters(entry, tab, filters)),
        tab,
      ),
    [tabRows, tab, filters],
  )

  const filterActive =
    filters.from !== '' ||
    filters.to !== '' ||
    filters.company !== '' ||
    filters.projectNumber !== ''

  const counts = {
    awaiting_invoice: byTab.awaiting_invoice.length,
    awaiting_payment: byTab.awaiting_payment.length,
    finished: byTab.finished.length,
  }

  const clearFilters = () => setFilters(EMPTY_FILTERS)

  const openSalary = useCallback(() => {
    setSalaryMountKey((k) => k + 1)
    setSalaryOpen(true)
  }, [])

  const header = <PageHeader onOpenSalary={openSalary} />

  if (loading) {
    return (
      <div data-testid="finance-page">
        {header}
        <Card>
          <TabsBar active={tab} counts={null} onSelect={setTab} />
          <LoadingOrError loading skeleton={{ variant: 'table', rows: 5, cols: 6 }} />
        </Card>
      </div>
    )
  }

  // ① חוסר-הרשאה — **הענף הראשון תמיד** (כרטיס §④). הלשוניות נשארות עם `—` במקום מונה:
  // ‏`0` נקרא כעובדה, `—` נקרא כ"אין לי את הנתון".
  if (error?.kind === 'noPermission') {
    return (
      <div data-testid="finance-page">
        {header}
        <Card>
          <TabsBar active={tab} counts={null} onSelect={setTab} />
          <PermissionAwareEmpty
            state="noPermission"
            title={NO_PERMISSION_SENTENCE}
            detail={
              <>
                המונים מציגים <Ltr>{DENIED_MARK}</Ltr>, לא <Ltr>0</Ltr>.
              </>
            }
            testId="finance-no-permission"
          />
        </Card>
      </div>
    )
  }

  // ② תקלת-טעינה, **וגם דריפט-צורה**: שער-הצורה נכשל ⇒ אותו מסך, עם הודעת-השער כשורת-הפירוט.
  // 🔴 הודעת-הרשת עצמה אינה מוצגת (כשל-fetch חוזר באנגלית טכנית); הודעת-השער כן — היא נכתבה
  // בעברית בדיוק כדי שתיקרא, והיא הדבר היחיד שמסביר למה מסך שעבד אתמול ריק היום.
  if (error || prepared.shapeError) {
    return (
      <div data-testid="finance-page">
        {header}
        <Card>
          <PermissionAwareEmpty
            state="error"
            detail={prepared.shapeError ?? undefined}
            onRetry={retry}
            testId="finance-error"
          />
        </Card>
      </div>
    )
  }

  return (
    <div data-testid="finance-page">
      {header}
      <SummaryTiles summary={summary} />
      <Card>
        <TabsBar active={tab} counts={counts} onSelect={setTab} />
        <FilterBar filters={filters} onChange={setFilters} onClear={clearFilters} />
        {visible.length === 0 ? (
          <EmptyRows
            filtered={filterActive}
            tab={tab}
            total={tabRows.length}
            onClear={clearFilters}
          />
        ) : (
          <FinanceTable
            tab={tab}
            entries={visible}
            satisfactionThreshold={satisfactionThreshold}
            onOpen={setOpenProject}
          />
        )}
      </Card>

      {/* 🔴 **היסטוריית-דוחות-השכר אינה כאן יותר — הכרעת-ישי `28/08/2026`.** היא עברה
          לתוך `SalaryReportDialog`, וההנמקה המלאה יושבת שם ליד ה-state שמרענן אותה.
          **מה שהמסך הזה מרוויח:** הוא חוזר להציג ישות אחת בלבד — פרויקטים. */}

      {/* S2 הוא דיאלוג ואינו ראוט (B-2) — הרשימה נשארת גלויה מאחור. הרכבה-מותנית ולא `key`
          על `open`: ‏`ClosingWindowDialog` כבר מרכיב את גופו מחדש בכל פתיחה מבפנים
          (`{open && project ? <Body/> : null}`), וזהו בדיוק דפוס `ChecklistDialog` במ5. */}
      {openProject && (
        <ClosingWindowDialog
          project={openProject}
          open
          onOpenChange={(next) => {
            if (!next) setOpenProject(null)
          }}
          onChanged={refresh}
          satisfactionThreshold={satisfactionThreshold}
        />
      )}

      {/* ⚠️ ‏`key` על **מונה-פתיחות** ולא על `open`: מפתח שנגזר מהבוליאני משתנה גם בסגירה
          והורג את אנימציית-היציאה של Radix (`src/CLAUDE.md`, מלכודת א'). המונה עולה רק
          בפתיחה ⇒ הרכבה טרייה בכל פתיחה, ויציאה חלקה. ‏S3 מחזיק תוצאת-הפקה ב-state, ובלי
          זה פתיחה שנייה הייתה נפתחת על מסך-התוצאה של ההפקה הקודמת. */}
      <SalaryReportDialog key={salaryMountKey} open={salaryOpen} onOpenChange={setSalaryOpen} />
    </div>
  )
}

// ── חלקי-המסך ────────────────────────────────────────────────────────────────

// 🔴 **הכפתור אינו ראשי (`btn-outline`) וזו הכרעת Q-2 מילה-במילה**, לא בחירת-עיצוב:
// הפעולה של S1 היא פתיחת שורה, וכפתור טורקיז-מלא בכותרת היה מתחרה בה. המוקאפ המאושר צויר
// **בלי** כפתור-כותרת כלל (§⑧-6), ו-Q-2 הוא מה שהוסיף אותו — כי בלעדיו אין שום מסלול-ניווט
// ל-S3, והפקת דוח-השכר לא הייתה נגישה מאף מסך.
function PageHeader({ onOpenSalary }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-lg font-bold text-slate-800">{PAGE_TITLE}</h1>
        <p className="mt-0.5 text-[12px] text-slate-500">{PAGE_SUBTITLE}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onOpenSalary}
        className="h-auto rounded-lg border-slate-300 px-4 py-2 font-medium text-slate-700"
        data-testid="finance-open-salary"
      >
        {SALARY_BUTTON_LABEL}
      </Button>
    </div>
  )
}

// רצועת-הסיכום — אותו רכיב-משותף ואותה מוסכמה בדיוק כמו `ProjectsPage.TilesRow`:
// `flex flex-wrap` בין הכותרת לכרטיס-הטבלה, לעולם לא `grid` שמותח לרוחב-מלא (הכרעת-ישי
// 08/08/2026, `StatTile.jsx`). ‏`summary.openTotal === null` = "יש חוב פתוח, הסכום שלו
// עדיין לא ידוע" (דמי-ביטול לא-נפתרים בלבד בפתוח) — **לא** "0 חוב פתוח"; `emptyText`
// הוא ההבדל היחיד בין השניים ב-`StatTile`.
function SummaryTiles({ summary }) {
  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <StatTile
        label={SUMMARY_OPEN_LABEL}
        value={summary.openTotal}
        emptyText={SUMMARY_OPEN_UNKNOWN}
        sub={summaryOpenSub(summary)}
        testId="finance-summary-open"
      />
      <StatTile
        label={SUMMARY_OVERDUE_LABEL}
        value={summary.overdueTotal}
        sub={`${countLabel(summary.overdueCount, 'תיק', 'תיקים')} באיחור-תשלום`}
        testId="finance-summary-overdue"
      />
    </div>
  )
}

function Card({ children }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">{children}</div>
}

// `counts === null` = טוען או חסום: מונה `—` ולא `0`.
function TabsBar({ active, counts, onSelect }) {
  return (
    <div className="-mx-4 flex gap-1 border-b border-slate-200 px-4" role="tablist">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active === key}
          onClick={() => onSelect(key)}
          className={cn(
            '-mb-px border-b-2 px-4 py-2.5 text-sm',
            active === key
              ? 'border-teal-600 font-semibold text-teal-700'
              : 'border-transparent font-medium text-slate-500',
          )}
          data-testid={`finance-tab-${key}`}
        >
          {label}
          {/* המונה מוצג **גם כשהוא 0** — לשונית שמעלימה את המונה מוחקת את המצב מהמציאות. */}
          <Ltr
            className={cn(
              'mr-1.5 text-xs font-semibold',
              active === key ? 'text-teal-700' : 'text-slate-400',
            )}
          >
            {counts ? String(counts[key]) : DENIED_MARK}
          </Ltr>
        </button>
      ))}
    </div>
  )
}

// סרגל-החיפוש של C5 §5.6.13: טווח-תאריכים · שם-חברה · מספר-פרויקט · "נקי סינון".
// ⌨️ שדות-התאריך `dir="ltr"` — תאריך אינו טקסט עברי, וה-widget הילידי מסדר אותו LTR ממילא.
// 🔤 לכל שדה `placeholder` שמראה את הפורמט/הדוגמה (מעבר-קלט-ריק, `src/CLAUDE.md`).
function FilterBar({ filters, onChange, onClear }) {
  const set = (patch) => onChange({ ...filters, ...patch })
  return (
    <div className="flex flex-wrap items-center gap-2.5 py-3" data-testid="finance-filter-bar">
      <label className="text-[11.5px] text-slate-500" htmlFor="finance-filter-from">
        מ-
      </label>
      <input
        id="finance-filter-from"
        type="date"
        dir="ltr"
        value={filters.from}
        onChange={(e) => set({ from: e.target.value })}
        className="h-8 w-[130px] rounded-lg border border-slate-200 bg-white px-2.5 text-[12.5px] text-slate-700"
        data-testid="finance-filter-from"
      />
      <label className="text-[12px] text-slate-400" htmlFor="finance-filter-to">
        עד
      </label>
      <input
        id="finance-filter-to"
        type="date"
        dir="ltr"
        value={filters.to}
        onChange={(e) => set({ to: e.target.value })}
        className="h-8 w-[130px] rounded-lg border border-slate-200 bg-white px-2.5 text-[12.5px] text-slate-700"
        data-testid="finance-filter-to"
      />
      <input
        type="text"
        value={filters.company}
        onChange={(e) => set({ company: e.target.value })}
        placeholder="שם חברה, לדוגמה: קמפוס טכנולוגי צפון"
        aria-label="סינון לפי שם חברה"
        className="h-8 w-[190px] rounded-lg border border-slate-200 bg-white px-2.5 text-[12.5px] text-slate-700"
        data-testid="finance-filter-company"
      />
      <input
        type="text"
        inputMode="numeric"
        value={filters.projectNumber}
        onChange={(e) => set({ projectNumber: e.target.value })}
        placeholder="מס׳ פרויקט, לדוגמה: 15"
        aria-label="סינון לפי מספר פרויקט"
        className="h-8 w-[160px] rounded-lg border border-slate-200 bg-white px-2.5 text-[12.5px] text-slate-700"
        data-testid="finance-filter-number"
      />
      <Button
        type="button"
        variant="link"
        onClick={onClear}
        className="mr-auto h-auto p-0 text-[12.5px] font-semibold text-teal-700"
        data-testid="finance-clear-filter"
      >
        {CLEAR_FILTER_LABEL}
      </Button>
    </div>
  )
}

// ③ ריק-אחרי-סינון — פעולה **הפוכה** ממצב ② (ניקוי-סינון, לא ניסיון-חוזר) ⇒ אסור לאחד.
// ⬜ ריק-אמיתי (לשונית בלי סינון פעיל) — הכרטיס מסמן אותו "חסר, לא צויר"; הנוסח כאן בנוי
// על מסגרת-המשפט של מ6 (`'אין אירוע שממתין לסגירה'`) ועל תווית-הלשונית עצמה, כדי שלא
// תיווצר סמנטיקה חדשה. **מדווח כהנחה.**
const TAB_EMPTY_TITLES = {
  awaiting_invoice: 'אין פרויקט שממתין לחשבונית',
  awaiting_payment: 'אין פרויקט שממתין לתשלום',
  finished: 'אין פרויקט שהועבר לארכיון',
}

function EmptyRows({ filtered, tab, total, onClear }) {
  if (filtered) {
    return (
      <PermissionAwareEmpty
        state="empty"
        title={FILTERED_EMPTY_TITLE}
        detail={total > 0 ? filteredOutSentence(total) : undefined}
        action={
          <Button
            type="button"
            variant="link"
            onClick={onClear}
            className="h-auto p-0 text-[12.5px] font-semibold text-teal-700"
            data-testid="finance-empty-clear-filter"
          >
            {CLEAR_FILTER_LABEL}
          </Button>
        }
        testId="finance-empty-filtered"
      />
    )
  }
  return (
    <PermissionAwareEmpty state="empty" title={TAB_EMPTY_TITLES[tab]} testId="finance-empty-tab" />
  )
}

// עמודות פר-לשונית (כרטיס §⑧-3: *"הבריף עצמו ביקש זאת במפורש"*) — לא סט אחיד.
const COLUMNS = {
  awaiting_invoice: [
    { label: 'פרויקט', width: '44%' },
    { label: 'תאריך', width: '18%' },
    { label: 'סכום', width: '20%' },
    { label: 'סטטוס', width: '18%' },
  ],
  awaiting_payment: [
    { label: 'פרויקט', width: '30%' },
    { label: 'חשבונית נשלחה', width: '15%' },
    { label: 'מועד פירעון', width: '15%' },
    { label: 'ימי איחור', width: '14%' },
    { label: 'סכום לתשלום', width: '16%' },
    { label: 'סטטוס', width: '10%' },
  ],
  finished: [
    { label: 'פרויקט', width: '36%' },
    { label: 'הועבר לארכיון', width: '18%' },
    { label: 'רווח סופי', width: '18%' },
    { label: 'שביעות רצון', width: '16%' },
    { label: 'סטטוס', width: '12%' },
  ],
}

function FinanceTable({ tab, entries, satisfactionThreshold, onOpen }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse" data-testid="finance-table">
        <thead>
          <tr>
            {COLUMNS[tab].map((col) => (
              <Th key={col.label} style={{ width: col.width }}>
                {col.label}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <FinanceRow
              key={entry.row.project_id}
              entry={entry}
              tab={tab}
              satisfactionThreshold={satisfactionThreshold}
              onOpen={() => onOpen(entry.row)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// 🎨 **ענבר = פריט-פעולה אמיתי וממתין, לעולם לא אדום ולעולם לא קישוט** (מוסכמת ⑳, זהה
// למ5/מ6): איחור-תשלום · ציון-משוב שדורש בירור טלפוני · דמי-ביטול שטרם נפתרו. שורה
// שהסתיימה — רגילה. **האדום היחיד בשורה הוא מונה ימי-האיחור עצמו** (עובדה שלילית, לא מילוי).
// ‏`threshold` = הערך הגולמי של `סף_שביעות_רצון`; חסר ⇒ ציון-משוב אינו הופך שורה
// לפריט-פעולה (ושאר שני הטריגרים ממשיכים כרגיל) — ולא סף מומצא שיצבע שורות בענבר.
function isActionable(entry, threshold) {
  // 🔴 **האיחור נספר רק כל עוד החוב פתוח.** ‏`deriveDaysOverdue` היא חשבון-ימים טהור ואינה
  // יודעת דבר על תשלום — פרויקט שכבר שולם וארוכב עדיין מחזיק `invoice_sent_at` ישן, ולכן
  // המספר שהיא מחזירה עליו חיובי. בלי התנאי הזה **כל** שורה בלשונית "הסתיימו" הייתה נצבעת
  // ענבר, והצבע שמסמן "דורש טיפול" היה מפסיק להפריד בין כלום לכלום.
  // 🔒 ותיק שארוכב נעול לגמרי (כרטיס-P3) ⇒ **אין בו פריט-פעולה בהגדרה**. שער-הארכוב דורש
  // משוב-פתור, ולכן ציון נמוך בשורה מארוכבת כבר טופל — ושורת-"נדרש בירור" עליו הייתה
  // מבקשת מהמנהלת לעשות שוב מה שהיא כבר עשתה.
  if (entry.row.archived_at) return false
  // ‏`entry.debtOpen` נגזר ב-`prepareRows` — אותו שדה בדיוק שמכבה את מונה-ימי-האיחור.
  const overdue = entry.debtOpen && entry.daysOverdue !== null && entry.daysOverdue > 0
  const needsClarification = needsSatisfactionAttention(entry.score?.score ?? null, threshold)
  return overdue || needsClarification || entry.feeUnresolved
}

function FinanceRow({ entry, tab, satisfactionThreshold, onOpen }) {
  // 🔑 **אותה פונקציה בדיוק שמסך-הלקוחות משתמש בה** (`needsSatisfactionAttention`,
  // `src/lib/customers.js`) ולא תנאי מקומי: הסף חי עכשיו בשורה אחת במסד, והכלל שמפרש
  // אותו חייב לחיות בפונקציה אחת — אחרת מ2 ומ8 יסטו ביום שהסף ישתנה.
  const needsClarification = needsSatisfactionAttention(
    entry.score?.score ?? null,
    satisfactionThreshold,
  )
  const { row } = entry
  const locked = tab === 'finished'
  const label = PROJECT_STATUS_LABELS[row.project_status]

  return (
    <tr
      onClick={onOpen}
      // ⌨️ שורה לחיצה חייבת נגישות-מקלדת משלה — התבנית של `ProjectsPage`/`LogisticsPage`,
      // שכל מסך-טבלה בונה מחדש ולכן כל מסך יכול לשכוח בנפרד.
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      aria-label={`${row.event_name}, פתיחת חלון סגירת-תיק${locked ? ' (נעול-לעיון)' : ''}`}
      className={cn(
        'cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset focus-visible:outline-none',
        isActionable(entry, satisfactionThreshold) && 'bg-amber-50',
      )}
      data-testid={`finance-row-${row.project_id}`}
    >
      <Td>
        <div className="text-[13.5px] font-semibold text-slate-800">{row.event_name}</div>
        <div className="mt-px text-[11.5px] text-slate-500">{row.customer_name}</div>
        {/* שורת-ההקשר של שורה מבוטלת, במקום שבו המוקאפ המאושר מצייר אותה — תחת שם-הפרויקט
            ושם-הלקוח, ב-`class="calm"` שהוא בדיוק `text-[11.5px] text-slate-500` שכאן.
            🔤 **התווית עצמה אינה מנוסחת כאן**: `CANCEL_TYPE_LABELS` (S-30) היא אותה מילה
            שבדיאלוג-הביטול של מ6 ובכרטיס-הפרויקט (`ProjectCardPage.jsx` — שם היא עומדת
            בדיוק כך, לבדה, כשורת-משנה). ⚠️ **ומה שהמוקאפ מצייר וכאן חסר:** חצי-המשפט
            *"— 30 שעות לפני האירוע"*. תאריך-האירוע **אינו בטבלת-ההחזרה של
            `get_finance_overview`** (22 עמודות, ואין בהן תאריך-אירוע) ⇒ אין כאן מספר
            לגזור ממנו, וכתיבת מספר משוער הייתה המצאה. **מדווח כפער-נתונים, לא הושלם בניחוש.** */}
        {entry.cancelled && row.cancel_type && (
          <div
            className="mt-px text-[11.5px] text-slate-500"
            data-testid={`finance-cancel-context-${row.project_id}`}
          >
            {CANCEL_TYPE_LABELS[row.cancel_type]}
          </div>
        )}
        {/* אותו תנאי בדיוק כמו `isActionable` — הרקע והשורה מספרים סיפור אחד, ותיק
            מארוכב אינו מבקש בירור שכבר נעשה כתנאי לארכובו. */}
        {!row.archived_at && needsClarification && (
          <div className="mt-0.5 text-[11.5px] font-semibold text-amber-700">
            ⚠ ציון-משוב <Ltr>{String(entry.score.score)}</Ltr> — נדרש בירור טלפוני
          </div>
        )}
        {row.credit_note_flag && (
          <div
            className="mt-0.5 text-[11.5px] font-semibold text-amber-700"
            data-testid={`finance-credit-note-${row.project_id}`}
          >
            {CREDIT_NOTE_LINE}
          </div>
        )}
      </Td>

      {tab === 'awaiting_invoice' && (
        <>
          <Td>
            <DateCell iso={rowDateIso(row, tab)} />
            <div className="text-[11.5px] text-slate-500">
              {entry.cancelled ? CANCELLED_DATE_NOTE : OPERATIONALLY_CLOSED_NOTE}
            </div>
          </Td>
          <Td>
            <AmountCell entry={entry} />
          </Td>
        </>
      )}

      {tab === 'awaiting_payment' && (
        <>
          <Td>
            <DateCell iso={row.invoice_sent_at} />
          </Td>
          <Td>
            {entry.dueDate ? (
              <>
                <Ltr className="text-[13px]">{formatDate(entry.dueDate)}</Ltr>
                <div className="text-[11.5px] text-slate-500">
                  שוטף+<Ltr>{String(row.payment_terms_days)}</Ltr>
                </div>
              </>
            ) : (
              <span className="text-slate-400">{DASH}</span>
            )}
          </Td>
          <Td>
            <OverdueCell
              days={entry.daysOverdue}
              debtOpen={entry.debtOpen}
              paidOn={row.payment_date}
              testId={`finance-paid-${row.project_id}`}
            />
          </Td>
          <Td>
            <AmountCell entry={entry} />
          </Td>
        </>
      )}

      {tab === 'finished' && (
        <>
          <Td>
            <DateCell iso={row.archived_at} />
          </Td>
          <Td>
            {/* §7.52 — ‏% נגזר לתצוגה כערך-ראשי, ‏₪ הנשמר יורד לשורת-המשנה (תיקון-הבקרה
                26/08 בתוך המוקאפ עצמו, שגובר על בלוק-הפתיחה שלו). */}
            <div className="text-[13.5px] font-bold text-slate-800">
              <Ltr>{formatPercent(entry.profitPercent)}</Ltr>
            </div>
            <div className="mt-px text-[11px] text-slate-500">
              {row.final_profit === null ? DASH : <Money amount={Number(row.final_profit)} cents />}
            </div>
          </Td>
          <Td>
            <ScoreCell score={entry.score} />
          </Td>
        </>
      )}

      <Td>
        <div className="flex flex-wrap items-center gap-1">
          <StatusTag label={label} tone={resolveProjectTone(label)} />
          {/* תג-הביטול מזהה **מה** השורה (חיוב דמי-ביטול ולא הכנסת-אירוע); *מצב* הפתרון
              יושב בשורת-המשנה של עמודת-הסכום. שני תפקידים ⇒ שני מקומות, לא כפילות. */}
          {entry.cancelled && (
            <StatusTag
              label={CANCELLATION_FEE_TAG}
              tone="warn"
              testId={`finance-fee-tag-${row.project_id}`}
            />
          )}
          {row.written_off && (
            <StatusTag
              label={WRITTEN_OFF_TAG}
              tone="muted"
              testId={`finance-writeoff-tag-${row.project_id}`}
            />
          )}
        </div>
      </Td>
    </tr>
  )
}

function DateCell({ iso }) {
  const text = stampDate(iso)
  if (!text) return <span className="text-slate-400">{DASH}</span>
  return <Ltr className="text-[13px]">{text}</Ltr>
}

// 🔴 שורה מבוטלת שדמי-הביטול שלה טרם נפתרו מציגה `—` ולא סכום: ההצעה התלת-רכיבית נגזרת
// ב-`finance_cancellation_fee_proposal` פר-פרויקט, ואינה בטבלת-ההחזרה של `get_finance_overview`
// ⇒ אין כאן מספר לקרוא, וכתיבת ההכנסה במקומו הייתה מציגה סכום שאיש לא עומד לגבות.
function AmountCell({ entry }) {
  if (entry.amount === null || entry.amount === undefined) {
    return (
      <>
        <div className="text-[13.5px] font-bold text-slate-400">{DASH}</div>
        {entry.feeUnresolved && (
          <div className="mt-px text-[11px] font-semibold text-amber-700">
            {CANCELLATION_FEE_UNRESOLVED}
          </div>
        )}
      </>
    )
  }
  return (
    <>
      <div className="text-[13.5px] font-bold text-slate-800">
        <Money amount={Number(entry.amount)} cents />
      </div>
      <div className="mt-px text-[11px] text-slate-500">
        {entry.amountWithVat === null ? (
          <Ltr>{DASH}</Ltr>
        ) : (
          <Money amount={entry.amountWithVat} cents />
        )}{' '}
        {VAT_SUFFIX}
      </div>
    </>
  )
}

// 🔴 **שלושה מצבים ולא שניים** — וזו נקודת-`—`-מול-`0` של §4.3: ‏`null` = אי-אפשר לחשב
// (אין חשבונית שנשלחה / אין פרמטר תנאי-תשלום) ⇒ `—`; ‏`0` = חושב, והמועד טרם חלף ⇒ מספר
// אמיתי, מוצג אפור ובלי הדגשה; ‏`>0` = איחור בפועל ⇒ אדום, עם המילה "ימים".
// ⚠️ ההערה ב-`projectFinance.js` כותבת *"המסך מציג את המונה רק כשהוא > 0"*; הצגת `—` על 0
// הייתה מוחקת את ההבחנה שאותו קובץ עצמו בנה. **מדווח כסתירה, לא הוכרע כאן לבד.**
// 🔴 **וקודם לשלושת המצבים — שאלה אחת: האם החוב בכלל עוד פתוח.** ‏`deriveDaysOverdue` היא
// חשבון-ימים טהור ואינה יודעת דבר על תשלום *(כך היא מתועדת ב-`projectFinance.js`)*, ולכן
// על שורה ששולמה היא ממשיכה להחזיר מספר חיובי **שגדל כל יום**. תיק ששולם נשאר בלשונית
// "ממתין לתשלום" עד הארכוב (ר' `debtOpen` ב-`prepareRows`), ולכן זה אינו מקרה-קצה נדיר
// אלא המצב הרגיל של כל תיק בין רישום-התשלום לארכוב. **מונה-איחור אדום על חוב שנסגר אינו
// "מספר ישן" — הוא עובדה שקרית**, והמחיר שלה הוא טלפון-גבייה ללקוח ששילם.
// 🎨 **התג ירוק דרך `StatusTag` ולא צבע מקומי** — ובמילות הרכיב עצמו, ירוק כאן אומר בדיוק
// *"סגור, אין מה לעשות"*. אין טוקן חדש ואין החלטת-עיצוב חדשה (כלל 8).
// ⚪ **חוב-אבוד (`written_off`) מקבל `—` ולא תג:** הוא לא שולם, והשורה כבר נושאת את
// `WRITTEN_OFF_TAG` שאומר בדיוק זאת. מה שנכון לשתי הדרכים הוא רק שהספירה נעצרת.
function OverdueCell({ days, debtOpen, paidOn, testId }) {
  if (!debtOpen) {
    if (!paidOn) return <span className="text-slate-400">{DASH}</span>
    return (
      <>
        <StatusTag label={PAID_TAG} tone="ok" testId={testId} />
        <div className="mt-px text-[11.5px] text-slate-500">
          <Ltr>{formatDate(paidOn, DASH)}</Ltr>
        </div>
      </>
    )
  }
  if (days === null) return <span className="text-slate-400">{DASH}</span>
  if (days === 0) return <Ltr className="text-[13px] text-slate-400">0</Ltr>
  return (
    <>
      <Ltr className="text-[13.5px] font-bold text-red-600">{String(days)}</Ltr>{' '}
      <span className="text-[11.5px] text-slate-500">ימים</span>
    </>
  )
}

// תג-הציון בפורמט S1 הקנוני: **תווית בלבד, בלי מספר בתוך התג** (החלטה חוצת-משטחים #4).
// הכוכבים מגיעים מ-`RatingStars` המשותף ולא מגליפים מקומיים — אותו רכיב שמשרת את מ4 ואת S4.
function ScoreCell({ score }) {
  if (score === null) return <span className="text-slate-400">{DASH}</span>
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <RatingStars value={score.score} />
      <StatusTag label={score.label} tone={score.tone} />
    </div>
  )
}

function Th({ children, style }) {
  return (
    <th
      style={style}
      className="border-b border-slate-200 px-2.5 py-1.5 text-right text-xs font-semibold whitespace-nowrap text-slate-500"
    >
      {children}
    </th>
  )
}

function Td({ children }) {
  return <td className="border-b border-slate-100 px-2.5 py-2.5 align-middle">{children}</td>
}
