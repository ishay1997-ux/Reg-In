// שכבת ה-API של מודול 8 (כספים) — כלל ברזל 14: כל גישת ה-Supabase של המודול מרוכזת כאן,
// והמסכים (S1/S2/S3, פזה 3) מייבאים מכאן בלבד ולעולם לא קוראים ל-`supabase.from(...)` בעצמם.
//
// 🔴 **מה הקובץ הזה אינו עושה: הוא אינו מחשב כסף ואינו מרכיב מסמכים.** הכסף נולד ב-
// `finance_project_money` שבמסד (מיגרציה E1) — פונקציה **פנימית** שאף מסך אינו יכול לעקוף;
// גזירות-התצוגה חיות ב-`src/lib/projectFinance.js` (צעד 2.1) והרכבת קובץ-השכר ב-
// `src/lib/salaryReport.js` (צעד 2.2). כאן יש **קלט/פלט בלבד**: קריאות, קריאות-RPC, אחסון
// ושליחת-מייל. שני מחשבונים לאותו מספר הם הכשל ש-F16/R1-4 קיימים כדי למנוע.
//
// 🔴 **למה כמעט הכל RPC ולא `.from(...)`:** מנהלת-הכספים **חסומה ב-RLS** מ'דיילות' ומ'לוגיסטיקה'
// (נמדד חי 27/08/2026 במטריצת-ההרשאות: `דיילות = blocked`, `לוגיסטיקה = blocked`), וקריאה
// חסומה מחזירה `{data: [], error: null}` — **"אין הרשאה" זהה-בייט ל"אין שורות"**. לכן כל קריאה
// שהמתמטיקה או השכר צריכים משם רצה בתוך פונקציית DEFINER מגודרת 'כספים'. כל ה-RPC-ים של המודול
// זורקים `P0001` בעברית גמורה ⇒ **אין כאן "הצלחה ריקה"**, ולכן העוטף מציג את הודעת-השרת
// כפי-שהיא (אותה הכרעה כמו `rpcErrorMessage` של מודול 6) ולא מנסח אותה מחדש.
//
// ⚠️ **שני חורים ידועים שהצעד הזה במכוון אינו סוגר, כדי שלא ייעלמו בשקט:**
//   ① **אין קורא "תצוגה-מקדימה" לדוח-השכר.** ‏`generate_salary_report` **כותבת** (מוסיפה דוח,
//      חותמת שיבוצים, חותמת נסיעות — בלתי-הפיך), ואין במסד שום פונקציה שמחזירה את השורות
//      *לפני* ההפקה. תצוגה-מקדימה מצד-לקוח הייתה חייבת לקרוא `assignments`+`hostesses` —
//      בדיוק שתי הטבלאות שהמנהלת חסומה מהן. ⇒ מה שיש כאן הוא **אחרי**-ההפקה.
//   ② **פונקציות הדף-הציבורי (`get_feedback_page`/`submit_feedback`) אינן כאן** — הן אינן
//      ברשימת צעד 2.3, והצרכן היחיד שלהן הוא S4 (צעד 3.4).
//
// 🔗 מנוע-המייל משותף לכל המערכת ואינו מועתק לכאן: הכללים הטהורים ב-`src/lib/email.js`,
//    התובלה ב-`src/api/email.js`. כאן חיים רק שלושת הדברים ששייכים למודול השולח —
//    מי הנמען, מה הנושא, ואילו placeholders יש לתבנית שלו.

import { supabase } from '@/supabaseClient'
import { toError } from '@/lib/apiError'
import {
  buildEmailPayload,
  classifySendError,
  fillEmailTemplate,
  EMAIL_SEND_RESULT,
} from '@/lib/email'
import { getEmailTemplate, sendEmail } from '@/api/email'
import {
  buildSalaryReportDocument,
  salaryPeriodLabel,
  writeSalaryReportXlsx,
} from '@/lib/salaryReport'
// ⚠️ ייבוא חוצה-מודולים במכוון, ולא העתקה: שתי הפונקציות האלה טהורות-לחלוטין מסמנטיקה של
// מודול 6 (המרת Blob ל-base64 בקטעים · קריאת פרמטר בודד מ-`params`), והעתקתן לכאן הייתה
// יוצרת שני עותקים שיתפצלו ביום שאחד מהם יתוקן. התקדים לייבוא כזה הוא מודול 6 עצמו, שמייבא
// את `writeInviteToken` ממודול 4. 📌 **הבית הנכון שלהן הוא `src/lib/`** — ההעברה לא נעשתה כאן
// כי `closingApi.js` אינו קובץ של הצעד הזה; נרשם כחוב-ניקיון.
import { fileToBase64, getParamValue } from '@/modules/06_projects/closingApi'

// ---- שגיאות ----

// מחזירה את הודעת-השרת כפי-שהיא, או ניסוח-fallback כשאין הודעה (תקלת-רשת/timeout).
// טהורה, כדי שתיבדק ביחידה בלי לדמות Supabase.
// ⚠️ **כפילות מוצהרת:** אותה פונקציה בדיוק קיימת ב-`src/modules/06_projects/api.js`. הבית
// הנכון לשתיהן הוא `src/lib/apiError.js` (שם כבר גר `toError`), אבל זהו קובץ משותף שאינו
// של הצעד הזה ⇒ נרשם כחוב-ניקיון ולא נעשה כאן בשקט.
export function rpcErrorMessage(error, fallbackMessage) {
  const raw = typeof error?.message === 'string' ? error.message.trim() : ''
  return raw || fallbackMessage
}

function toRpcError(error, fallbackMessage) {
  return toError(error, rpcErrorMessage(error, fallbackMessage))
}

// כל ה-RPC-ים הכותבים של המודול מחזירים `jsonb` שבו `ok: true`. תשובה בלי הדגל הזה אינה
// "הצלחה חלקית" — היא חוזה שנשבר, ובמודול שמחשב כסף אסור לה לעבור בשקט (§4.3).
async function callWriteRpc(fn, args, fallbackMessage) {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw toRpcError(error, fallbackMessage)
  if (data?.ok !== true) {
    throw toError({ code: 'FINANCE_RPC_SHAPE' }, `${fallbackMessage} (תשובת השרת לא הייתה תקינה.)`)
  }
  return data
}

// ---- קריאות (Reads) ----

// שורות שלוש הלשוניות של S1. ה-RPC מחזיר **עובדות בלבד**; ימי-האיחור, האחוזים ותגית-הציון
// נגזרים ב-`src/lib/projectFinance.js` בזמן-תצוגה (§7.52 — ‏₪ נשמר, ‏% תמיד נגזר).
// ⚠️ `payment_terms_days` יכול לחזור `null` (הפרמטר לא נזרע) — הקורא מציג `—`, לעולם לא 0.
export async function listFinanceOverview() {
  const { data, error } = await supabase.rpc('get_finance_overview')
  if (error) throw toRpcError(error, 'שגיאה בטעינת מסך הכספים.')
  return data ?? []
}

// תחשיב-המאזן של פרויקט אחד (S2). אותו `finance_project_money` שמזין את S1, ולכן שני המסכים
// אינם יכולים להראות שני מספרים שונים לאותו פרויקט (F16).
// 🔴 אפס שורות **נזרק ולא מוחזר כ-null**: הדיאלוג נפתח מלחיצה על שורה קיימת, ומאזן ריק היה
// מצייר "הכנסות 0" — מספר שנראה מדוד ואינו. הרשאה חסרה ממילא חוזרת כשגיאת P0001 מה-RPC.
export async function getFinanceDetail(projectId) {
  const { data, error } = await supabase.rpc('get_project_finance_detail', {
    p_project_id: projectId,
  })
  if (error) throw toRpcError(error, 'שגיאה בטעינת נתוני הכספים של הפרויקט.')
  const row = data?.[0]
  if (!row) throw toError({ code: 'FINANCE_NOT_FOUND' }, 'לא נמצאו נתוני כספים לפרויקט זה.')
  return row
}

// שלושת רכיבי דמי-הביטול (ה23/ה24/ה25/ה29), נגזרים במסד מהקלטים הקפואים ולא נשמרים (ה28).
// ⚠️ `proposed_fee`/`team_compensation` יכולים לחזור `null` כששעות-האירוע הסופיות חסרות (T7)
// — ואז המסך אומר "לא ניתן לחשב פיצוי" (A-8), **לעולם לא 0**.
export async function getCancellationFeeProposal(projectId) {
  const { data, error } = await supabase.rpc('finance_cancellation_fee_proposal', {
    p_project_id: projectId,
  })
  if (error) throw toRpcError(error, 'שגיאה בחישוב הצעת דמי הביטול.')
  const row = data?.[0]
  if (!row) throw toError({ code: 'FINANCE_NOT_FOUND' }, 'לא נמצא פרויקט לחישוב דמי ביטול.')
  return row
}

// היסטוריית דוחות-השכר (S3). **קריאה ישירה מהטבלה ולא RPC** — וזה מכוון: `salary_reports`
// קיבלה policy-קריאה מגודרת 'כספים' במיגרציה B, ולכן זו הטבלה היחידה של המודול שהלקוח
// **כן** אמור לקרוא בעצמו. אין כאן פרטי-דיילות ואין פרטי-בנק, ולכן אין מה לגדר ב-DEFINER.
export async function listSalaryReports() {
  const { data, error } = await supabase
    .from('salary_reports')
    .select('report_id, period, send_status, sent_date, report_file_url, total_amount, created_at')
    .order('period', { ascending: false })
  if (error) throw toError(error, 'שגיאה בטעינת היסטוריית דוחות השכר.')
  return data ?? []
}

// שורות דוח שהופק — ה-snapshot הקפוא (§7.68). 🔴 **אין כאן פרטי-בנק** (B-4): הם חיים רק
// ב-`hostess_bank_details` ובקובץ ה-xlsx שבבאקט, וכפילותם לטבלה שנייה הייתה פותחת מחדש את
// החשיפה שה19 סגר.
export async function getSalaryReportLines(reportId) {
  const { data, error } = await supabase
    .from('salary_report_lines')
    .select('*')
    .eq('report_id', reportId)
    .order('hostess_name')
  if (error) throw toError(error, 'שגיאה בטעינת שורות דוח השכר.')
  return data ?? []
}

// הנמען של מייל-החשבונית (M1) ושם-החברה ל-placeholder. **קריאה ישירה ולגיטימית**: מנהלת
// הכספים מחזיקה `edit` על 'לקוחות' (נמדד 27/08/2026), ולכן זו אינה אחת מהטבלאות החסומות.
// 🔴 `null` כשאין שורה — והקורא **חוסם את השליחה עם הפניה לכרטיס-הלקוח** (כרטיס-P1), ולא
// מסיק "אין ללקוח מייל": חוסר-הרשאה וחוסר-שורה נראים כאן אותו דבר.
export async function getBillingContact(customerId) {
  if (!customerId) return null
  const { data, error } = await supabase
    .from('customers')
    .select('customer_id, company_name, contact_name, email')
    .eq('customer_id', customerId)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת פרטי החיוב של הלקוח.')
  return data ?? null
}

// ---- פעולות-כתיבה (RPC בלבד) ----

// 🚫 **`record_invoice_sent` אינה מיוצאת בנפרד בכוונה.** כרטיס-P1 קובע *"מייל נכשל — הסימון
// לא נרשם 'נשלח'"*, וכותרת מיגרציית E2 אומרת זאת במפורש: *"הקוד קורא לפונקציה הזו רק אחרי
// שהמייל הצליח"*. פונקציה ציבורית שמסמנת "נשלח" בלי לשלוח היא בדיוק הטעות שהחוזה הזה מונע,
// ולכן היא נגישה רק דרך `sendInvoiceAndRecord` שמתחת.
async function recordInvoiceSent(projectId, filePath) {
  return callWriteRpc(
    'record_invoice_sent',
    { p_project_id: projectId, p_file_url: filePath },
    'רישום שליחת החשבונית נכשל.',
  )
}

// פעולה ② — התשלום התקבל. אצל פרויקט מבוטל שחויב, זהו **רגע-הקפאת-הרווח** (Q-4), ולכן
// התשובה נושאת `frozen_profit` שהמסך מציג.
export async function recordPayment(projectId, paymentDate) {
  return callWriteRpc(
    'record_payment',
    { p_project_id: projectId, p_payment_date: paymentDate },
    'רישום התשלום נכשל.',
  )
}

// פעולה ③ — קליטת המשוב. שני מסלולים בפונקציה אחת, כי הם שתי תשובות לאותה שאלה: ציון
// שהתקבל (ה5 ⇒ `completed`) או "לא ענה לסקר" (⇒ `no_response`, וה3 מתיר לו לעבור את
// שער-הארכוב). שער ה-<3 (סיבה חובה) נאכף במסד ולא כאן — הוא חייב לחול גם על מסלולים אחרים.
export async function recordFeedback(
  projectId,
  { score = null, reason = null, notes = null, markNoResponse = false } = {},
) {
  return callWriteRpc(
    'record_feedback',
    {
      p_project_id: projectId,
      p_score: score,
      p_reason: reason,
      p_notes: notes,
      p_mark_no_response: markNoResponse,
    },
    'שמירת המשוב נכשלה.',
  )
}

// פעולה ④ — חוב אבוד (B-13). לקוח שלא שילם היה משאיר את הפרויקט ב"ממתין לתשלום" לנצח.
export async function recordWriteOff(projectId, reason) {
  return callWriteRpc(
    'record_write_off',
    { p_project_id: projectId, p_reason: reason },
    'סגירת הפרויקט ללא תשלום נכשלה.',
  )
}

// שלוש התשובות לדמי-הביטול (ה28 + Q-4): `bill` (נקבע סכום, ייגבה במסלול-P1) · `waive`
// (ויתור מפורש — סכום 0 עם נימוק, והפסד רשום) · `write_off` (חוב אבוד). ההקפאה מתרחשת
// במסד ב-`waive`/`write_off` בלבד; `bill` מקפיא רק כשהתשלום נרשם.
export const CANCELLATION_FEE_ACTIONS = { BILL: 'bill', WAIVE: 'waive', WRITE_OFF: 'write_off' }

export async function resolveCancellationFee(
  projectId,
  action,
  { amount = null, note = null } = {},
) {
  return callWriteRpc(
    'resolve_cancellation_fee',
    { p_project_id: projectId, p_action: action, p_amount: amount, p_note: note },
    'שמירת דמי הביטול נכשלה.',
  )
}

// פעולה ⑤ — הארכוב. טרנזקציה אחת במסד: שער כפול (תשלום או חוב-אבוד, **וגם** משוב שנפתר)
// ⇒ הקפאת `final_profit` ⇒ `finished` ⇒ המתת טוקן-המשוב (B-6). כל סירוב חוזר כהודעת P0001
// בעברית ומוצג כפי-שהוא — הן נוסחו כדי להיקרא ע"י המנהלת (§3.7).
export async function archiveProject(projectId) {
  return callWriteRpc('archive_project', { p_project_id: projectId }, 'הארכוב נכשל.')
}

// ---- אחסון (bucket `finance`) ----

// מגבלות הבאקט — זהות-ערך למה שנמדד חי על `storage.buckets` ב-27/08/2026 ושוב ב-28/08:
// `file_size_limit = 10485760`, `allowed_mime_types = {application/pdf, image/jpeg, image/png}`.
// הדפוס (קבוע אחד + טקסט-מסך שנגזר ממנו) הועתק מ-`06_projects/closingApi.js`.
export const FINANCE_MAX_BYTES = 10 * 1024 * 1024
export const FINANCE_ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png']

// 🔤 נוסח נעול (מדריך-המיקרו §3.7 — כרטיס-P1): שליחה בלי קובץ אינה אפשרית.
export const INVOICE_FILE_REQUIRED_NOTE =
  'חסום: יש לבחור קובץ — שליחה בלי חשבונית אינה אפשרית (כרטיס-P1).'

// ולידציה טהורה של קובץ-החשבונית **לפני** ההעלאה. מחזירה סיבה בעברית או מחרוזת ריקה.
// ⚠️ הבדיקה כאן אינה מחליפה את הבאקט — הוא דוחה בעצמו; היא קיימת כדי שהמנהלת תראה משפט
// שאפשר לפעול לפיו במקום שגיאת-אחסון גולמית באנגלית.
export function validateInvoiceFile(file) {
  if (!file) return INVOICE_FILE_REQUIRED_NOTE
  if (!FINANCE_ALLOWED_MIME.includes(file.type)) {
    return 'סוג הקובץ אינו נתמך — יש להעלות קובץ PDF או תמונה.'
  }
  if (file.size > FINANCE_MAX_BYTES) return 'הקובץ גדול מדי — המגבלה היא 10MB.'
  return ''
}

// העלאת קובץ-החשבונית. הנתיב `<project_id>/<חותמת-זמן>_<שם-מנוקה>` בתוך הבאקט `finance`,
// והמפתח נשמר **בלי קידומת-באקט** — זה מה ש-`download`/`remove`/`createSignedUrl` מקבלים
// וזה מה שנכתב ל-`project_finance.invoice_file_url` (B-8). חותמת-הזמן מונעת דריסה שקטה של
// חשבונית קודמת באותו שם; דפוס `uploadReportFile` של מודול 6.
export async function uploadInvoiceFile(projectId, file) {
  const reason = validateInvoiceFile(file)
  if (reason) throw toError({ code: 'INVALID_FILE' }, reason)
  const safeName = file.name.replace(/[^\w.-]/g, '_')
  const path = `${projectId}/${Date.now()}_${safeName}`
  const { error } = await supabase.storage
    .from('finance')
    .upload(path, file, { upsert: false, contentType: file.type })
  if (error) throw toError(error, 'העלאת קובץ החשבונית נכשלה.')
  return { path }
}

// מחיקה best-effort של קובץ שהועלה ואיש אינו מצביע עליו. אין `throw`: הכשל הראשי כבר בדרך
// למסך, וקובץ יתום הוא לכלוך שקוף ולא שבר-נתונים (אותו נימוק כמו `deleteReportFile` במ6).
export async function deleteFinanceFile(path) {
  if (!path) return
  try {
    await supabase.storage.from('finance').remove([path])
  } catch {
    // נבלע בכוונה — ר' ההערה שמעל.
  }
}

// 🔴 הורדה-וצירוף, לעולם לא קישור-חתום בתוך מייל (§7.61). הקישור-החתום שמתחת קיים רק
// לכפתור-הורדה **במסך**, שם הוא חי 60 שניות ואינו נשלח לאיש.
export async function downloadFinanceFileAsBase64(path) {
  const { data, error } = await supabase.storage.from('finance').download(path)
  if (error || !data) throw toError(error, 'הורדת הקובץ מהאחסון נכשלה.')
  return fileToBase64(data)
}

export async function getFinanceFileSignedUrl(path) {
  const { data, error } = await supabase.storage.from('finance').createSignedUrl(path, 60)
  if (error || !data?.signedUrl) throw toError(error, 'יצירת קישור להורדת הקובץ נכשלה.')
  return data.signedUrl
}

// ---- מיילים: שמות התבניות, הנושאים והגופים ----

// 🔴 זהים-בייט לשורות ה-`params` (מיגרציה `20260723112000`). שם שגוי בתו אחד מחזיר תבנית
// חסרה — ואז אין מייל, וההודעה מדברת על תבנית ולא על הקובץ.
export const FINANCE_TEMPLATE_NAMES = {
  invoice: 'תבנית_מייל_חשבונית_מס',
  salaryReport: 'תבנית_מייל_דוח_שכר',
}

// כתובת משרד רואי-החשבון — פרמטר-מערכת, לא שדה במסך (א49).
export const ACCOUNTANT_EMAIL_PARAM = 'מייל_משרד_רואי_חשבון'

// שתי שורות-הנושא — **נעולות ב-N-1** (אישור-ישי 26/08/2026, "מאשר את חמשתן/כולן"), בנוסח
// המדויק שצויר במוקאפים המאושרים `05_mail_invoice_approved.html` ו-`06_mail_salary_approved.html`.
// ⚠️ הנושא **אינו** עובר `plainTextToEmailHtml` (רק הגוף עובר), ולכן אין כאן בידוד-כיווניות —
// זו תצפית רשומה של כותב-מוקאפ M1 §⑧5 על פער קיים במנוע, ולא משהו שמודול 8 מתקן לעצמו.
export function invoiceEmailSubject(project) {
  return `חשבונית מס/קבלה מ-REG-IN — ${project?.event_name ?? ''}`.trim()
}

export function salaryReportEmailSubject(periodLabel) {
  return `דוח שכר דיילות — ${periodLabel ?? ''}`.trim()
}

// גוף מייל-החשבונית (M1). שני ה-placeholders של התבנית החיה: `[שם_לקוח_חברה]` ⇐ `company_name`
// ו-`[שם_פרויקט]` ⇐ שם-האירוע.
// 🔴 `null` ולא "לשלוח בכל זאת": בלי נמען, בלי גוף או בלי הקובץ אין מה לשלוח — וחשבונית
// שיוצאת ללקוח **בלי הקובץ** היא בדיוק מה שרצפת-המצורף של המנוע קיימת בשבילו (ולכן אין כאן
// `requireAttachment: false`; הרצפה נשארת דלוקה, והשרת אוכף אותה שוב פר-`entity_type`).
export function buildInvoiceEmailPayload({
  template,
  customer,
  project,
  fileName,
  attachmentBase64,
}) {
  const body = fillEmailTemplate(template, {
    '[שם_לקוח_חברה]': customer?.company_name ?? '',
    '[שם_פרויקט]': project?.event_name ?? '',
  })
  if (!body) return null

  return buildEmailPayload({
    to: customer?.email,
    subject: invoiceEmailSubject(project),
    body,
    filename: fileName,
    attachmentBase64,
  })
}

// גוף מייל דוח-השכר (M2). שני ה-placeholders של התבנית החיה: `[שם_רואה_חשבון]` ו-
// `[חודש_דיווח_ושנה]`.
//
// 🔴 **‏`accountantName` הוא חור-מוצר פתוח, לא ברירת-מחדל שהומצאה כאן.** ל-`[שם_רואה_חשבון]`
// **אין מקור-נתונים בשום מקום במערכת** — ‏`params` מחזיק את כתובת-המייל של המשרד ותו לא
// (נמדד חי; ‏`data-set.md §6` מסמן את "רו"ח דורון אשכנזי" שבמוקאפ כ-🎭 **שם מומצא-לחלוטין**,
// וכרטיס-M2 §③ חוזר על כך). ⇒ הפרמטר מתקבל מהקורא ואינו מנוחש כאן; כשאין ערך, הפנייה
// נשארת "לצוות הנהלת חשבונות / " — **מכוער ולא שקרי**. ⛔ שתילת שם מומצא בקוד הייתה שולחת
// לרו"ח האמיתי מייל שפונה לאדם שאינו קיים. **טעון הכרעת-ישי** (זריעת פרמטר-שם, או הסרת
// ה-placeholder מהתבנית במיגרציה).
export function buildSalaryReportEmailPayload({
  template,
  recipient,
  periodLabel,
  accountantName = null,
  fileName,
  attachmentBase64,
}) {
  const body = fillEmailTemplate(template, {
    '[שם_רואה_חשבון]': accountantName ?? '',
    '[חודש_דיווח_ושנה]': periodLabel ?? '',
  })
  if (!body) return null

  return buildEmailPayload({
    to: recipient,
    subject: salaryReportEmailSubject(periodLabel),
    body,
    filename: fileName,
    attachmentBase64,
  })
}

// ---- M1: החשבונית — העלאה, שליחה, ורק אז הסימון ----

// 🔴 **סדר-הפעולות הוא החוזה, לא סגנון** (כרטיס-P1 + כותרת מיגרציית E2):
//   ① קריאות זולות שיכולות להיכשל (תבנית, קובץ⇒base64) — **לפני** שנוגעים במסד או באחסון.
//   ② העלאה לבאקט.
//   ③ שליחת המייל.
//   ④ ‏`record_invoice_sent` — **רק אם המייל הצליח.**
// ⚠️ **ו"הצליח" הוא אחד משלושה מצבים ולא שניים:** פסק-זמן/תקלת-רשת = **"לא ידוע"**, כלומר
// המייל אולי כן יצא. במצב הזה **אין** סימון "נשלח" (זו לשון הכרטיס), ו**אין** מחיקת-הקובץ:
// מחיקה של צרופה שאולי הגיעה ללקוח מוחקת את הראיה היחידה למה שנשלח.
// כשל **ודאי** ⇒ מוחקים את הקובץ שהרגע הועלה, כי אף שורה אינה מצביעה עליו ושליחה חוזרת
// מעלה עותק חדש ממילא.
export async function sendInvoiceAndRecord({ project, customer, file } = {}) {
  const reason = validateInvoiceFile(file)
  if (reason) throw toError({ code: 'INVALID_FILE' }, reason)
  if (!customer?.email) {
    throw toError(
      { code: 'NO_BILLING_EMAIL' },
      'אין כתובת מייל לחיוב בכרטיס הלקוח — לא ניתן לשלוח את החשבונית.',
    )
  }

  const [template, attachmentBase64] = await Promise.all([
    getEmailTemplate(FINANCE_TEMPLATE_NAMES.invoice),
    fileToBase64(file),
  ])

  const payload = buildInvoiceEmailPayload({
    template,
    customer,
    project,
    fileName: file.name,
    attachmentBase64,
  })
  if (!payload) {
    throw toError(
      { code: 'MAIL_PAYLOAD' },
      'לא ניתן להרכיב את מייל החשבונית — בדקי את תבנית המייל ואת פרטי הלקוח.',
    )
  }

  const { path } = await uploadInvoiceFile(project.project_id, file)

  let logFailed
  try {
    ;({ logFailed } = await sendEmail({
      payload,
      entityType: 'invoice',
      entityId: project.project_id,
      templateName: FINANCE_TEMPLATE_NAMES.invoice,
    }))
  } catch (sendError) {
    const result = classifySendError(sendError)
    if (result === EMAIL_SEND_RESULT.FAILED) await deleteFinanceFile(path)
    return { sendResult: result, recorded: false, filePath: null, logFailed: false }
  }

  const recorded = await recordInvoiceSent(project.project_id, path)
  return {
    sendResult: EMAIL_SEND_RESULT.SENT,
    recorded: true,
    filePath: path,
    logFailed,
    projectStatus: recorded.project_status,
  }
}

// ---- M2: דוח-השכר — הפקה, קובץ, שליחה, סגירה ----

// נתיב-האחסון של קובץ-השכר. `salary_reports/` ולא תיקיית-פרויקט — הדוח חוצה פרויקטים
// וחודשים; מזהה-הדוח בתחילית מונע התנגשות בין שתי הפקות של אותו חודש (שממילא חסומות
// ב-UNIQUE, אבל שם-קובץ אינו מקום להסתמך על כך).
// 🔴 **‏`contentType` מוצהר במפורש ולא מנוחש מהבלוב** — ובדיוק כאן יושב חסם מדוד: הבאקט
// `finance` מתיר היום `application/pdf, image/jpeg, image/png` בלבד, ו-xlsx **אינו** ברשימה
// (נמדד חי מול `storage.buckets`). 🚫 העלאה בהסוואה כ-PDF הייתה "מתקנת" את השגיאה ומייצרת
// קובץ פגום אצל הרו"ח; לכן הסוג נאמר כמות-שהוא, והשגיאה עולה למסך.
export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export async function uploadSalaryReportFile(reportId, fileName, blob) {
  const path = `salary_reports/${reportId}_${fileName}`
  const { error } = await supabase.storage
    .from('finance')
    .upload(path, blob, { upsert: false, contentType: XLSX_MIME })
  if (error) throw toError(error, 'העלאת קובץ דוח השכר לאחסון נכשלה.')
  return { path }
}

// 🔴 **מרגע ש-`generate_salary_report` חזרה, המסד כבר השתנה בלי דרך חזרה:** שורת-דוח נכתבה,
// כל שיבוץ שנאסף **נחתם** (`salary_report_id`) ונחתמה עליו חותמת-נסיעות (ה14). ⇒ **אסור
// שהפונקציה הזו תזרוק אחרי הנקודה הזו בלי לסגור את הדוח**: דוח שנשאר `pending` בלי קובץ
// ובלי סטטוס הוא חודש-שכר תקוע — השורות כבר חתומות ולא ייאספו שוב, אבל שום מסמך לא יצא.
// לכן כל מה שאחרי ההפקה עטוף, והסגירה (`finalize_salary_report`) קורית בכל מסלול.
//
// ⚠️ **והפער שהמסד אינו יודע לבטא, ומדווח ולא מוסתר:** `finalize_salary_report` מקבלת
// `'sent'` או `'failed'` **בלבד**, בעוד למנוע-המייל שלושה מצבים ו-"לא ידוע" אינו "נכשל".
// מה שנבנה כאן: הסטטוס שנכתב במסד הוא `'failed'` (זה הערך היחיד שאינו "נשלח"), **אך התשובה
// למסך נושאת `sendResult: 'unknown'`** כדי שההודעה שתוצג תהיה זו של המנוע — *"בדקי בתיבת
// 'נשלחו' לפני שליחה חוזרת"* — ולא "נכשל", שהיה מזמין מייל שני לרו"ח.
export async function generateAndSendSalaryReport({
  period,
  generatedAt,
  accountantName = null,
} = {}) {
  // לפני ההפקה הבלתי-הפיכה: מוודאים שיש תבנית ויש נמען. כשל כאן עדיף פי כמה על דוח חתום
  // שאי-אפשר לשלוח.
  const [template, recipient] = await Promise.all([
    getEmailTemplate(FINANCE_TEMPLATE_NAMES.salaryReport),
    getParamValue(ACCOUNTANT_EMAIL_PARAM),
  ])

  const generated = await callWriteRpc(
    'generate_salary_report',
    { p_period: period },
    'הפקת דוח השכר נכשלה.',
  )

  const reportId = generated.report_id
  let doc = null
  let filePath = null
  let fileError = null
  // כל אחד משני המסלולים (הצלחה / `catch`) מציב את שניהם, ולכן אין כאן ערך-פתיחה שיכול
  // לזלוג לתשובה — `no-useless-assignment` תופס בדיוק את זה.
  let sendResult
  let logFailed = false
  // 🔴 **השגיאה עצמה נשמרת ואינה נבלעת.** ל-`catch` הזה נכנסים גם שומרי-ההרכבה של
  // `salaryReport.js` — למשל "סכום שורות הדוח אינו תואם את הסכום שנרשם במסד" — ו"נכשל"
  // גנרי במקומם היה מוחק בדיוק את ההודעה שנועדה לצעוק (§4.3).
  let mailError = null

  try {
    doc = buildSalaryReportDocument(generated, { generatedAt })

    // ההעלאה לבאקט היא **ראיית-מה-שנשלח** (§7.68) ואינה תנאי לשליחה: הצרופה נבנית מהבלוב
    // שבזיכרון. כישלון-אחסון מדווח למעלה ואינו מבטל את המייל — הרו"ח צריך את הקובץ, והראיה
    // החסרה נאמרת למסך במקום להיקבר.
    const blob = await writeSalaryReportXlsx(doc)
    const attachmentBase64 = await fileToBase64(blob)
    try {
      filePath = (await uploadSalaryReportFile(reportId, doc.fileName, blob)).path
    } catch (uploadError) {
      fileError = uploadError
    }

    const payload = buildSalaryReportEmailPayload({
      template,
      recipient,
      periodLabel: doc.periodLabel,
      accountantName,
      fileName: doc.fileName,
      attachmentBase64,
    })
    if (!payload) {
      throw toError(
        { code: 'MAIL_PAYLOAD' },
        'לא ניתן להרכיב את מייל דוח השכר — בדקי את תבנית המייל ואת כתובת רואי החשבון.',
      )
    }

    ;({ logFailed } = await sendEmail({
      payload,
      entityType: 'salary_report',
      entityId: reportId,
      templateName: FINANCE_TEMPLATE_NAMES.salaryReport,
    }))
    sendResult = EMAIL_SEND_RESULT.SENT
  } catch (error) {
    sendResult = classifySendError(error)
    mailError = error
  }

  // ‏`'sent'` רק כשידוע שהמייל יצא. 'לא ידוע' נרשם `'failed'` כי אין ערך שלישי — ר' ההערה
  // שמעל הפונקציה. הסגירה עצמה best-effort: אם גם היא נכשלת, הדוח קיים והשורות חתומות,
  // והמסך מקבל את התמונה המלאה במקום חריגה שמסתירה אותה.
  const sendStatus = sendResult === EMAIL_SEND_RESULT.SENT ? 'sent' : 'failed'
  let finalizeError = null
  try {
    await callWriteRpc(
      'finalize_salary_report',
      { p_report_id: reportId, p_file_url: filePath, p_status: sendStatus },
      'סגירת דוח השכר נכשלה.',
    )
  } catch (error) {
    finalizeError = error
  }

  return {
    reportId,
    period: generated.period,
    periodLabel: doc?.periodLabel ?? null,
    fileName: doc?.fileName ?? null,
    lines: doc?.lines ?? [],
    totals: doc?.totals ?? null,
    linesMissingBankDetails: doc?.linesMissingBankDetails ?? [],
    filePath,
    fileError,
    sendResult,
    sendStatus,
    mailError,
    logFailed,
    finalizeError,
  }
}

// שליחה-חוזרת מההיסטוריה (כרטיס-P4: *"המייל נכשל — הדוח נשמר, סטטוס 'נכשל' מוצג, שליחה-חוזרת
// מההיסטוריה"*). 🔑 **אין כאן הפקה מחדש** — השורות כבר חתומות וה-`period` ייחודי; מה שנשלח
// שוב הוא **אותו קובץ** מהבאקט, ולכן דוח בלי `report_file_url` אינו ניתן לשליחה-חוזרת ואומר
// זאת במפורש במקום לשלוח מייל בלי צרופה.
export async function resendSalaryReportMail({ report, accountantName = null } = {}) {
  if (!report?.report_file_url) {
    throw toError(
      { code: 'NO_REPORT_FILE' },
      'לא נשמר קובץ לדוח הזה — לא ניתן לשלוח אותו שוב מההיסטוריה.',
    )
  }

  const [template, recipient, attachmentBase64] = await Promise.all([
    getEmailTemplate(FINANCE_TEMPLATE_NAMES.salaryReport),
    getParamValue(ACCOUNTANT_EMAIL_PARAM),
    downloadFinanceFileAsBase64(report.report_file_url),
  ])

  const periodLabel = salaryPeriodLabel(report.period)
  const payload = buildSalaryReportEmailPayload({
    template,
    recipient,
    periodLabel,
    accountantName,
    fileName: fileNameOf(report.report_file_url),
    attachmentBase64,
  })
  if (!payload) {
    throw toError(
      { code: 'MAIL_PAYLOAD' },
      'לא ניתן להרכיב את מייל דוח השכר — בדקי את תבנית המייל ואת כתובת רואי החשבון.',
    )
  }

  let sendResult = EMAIL_SEND_RESULT.SENT
  let logFailed = false
  try {
    ;({ logFailed } = await sendEmail({
      payload,
      entityType: 'salary_report',
      entityId: report.report_id,
      templateName: FINANCE_TEMPLATE_NAMES.salaryReport,
    }))
  } catch (error) {
    sendResult = classifySendError(error)
  }

  const sendStatus = sendResult === EMAIL_SEND_RESULT.SENT ? 'sent' : 'failed'
  await callWriteRpc(
    'finalize_salary_report',
    { p_report_id: report.report_id, p_file_url: report.report_file_url, p_status: sendStatus },
    'עדכון סטטוס השליחה של הדוח נכשל.',
  )

  return { sendResult, sendStatus, logFailed }
}

// שם-הקובץ מתוך מפתח-האחסון (`salary_reports/7_08_2026_Payroll_Report.xlsx` ⇒
// `08_2026_Payroll_Report.xlsx`). תחילית מזהה-הדוח נחתכת כדי שמה שמגיע לרו"ח ייקרא כמו
// שם-קובץ ולא כמו מפתח פנימי.
export function fileNameOf(path) {
  const base = String(path ?? '')
    .split('/')
    .pop()
  return (base ?? '').replace(/^\d+_/, '')
}
