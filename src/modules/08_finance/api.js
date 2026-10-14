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
import { fetchAll } from '@/api/fetchAll'
import { toError } from '@/lib/apiError'
// N2: איש-הקשר הראשי הוא שורה ב-customer_contacts (is_primary), לא שלוש עמודות על customers.
// primaryContact היא נקודת-הבחירה היחידה (src/lib/customers.js) — לא לממש inline.
import { primaryContact } from '@/lib/customers'
import {
  buildEmailPayload,
  classifySendError,
  fillEmailTemplate,
  isAttachmentTooLarge,
  EMAIL_SEND_RESULT,
} from '@/lib/email'
import { getEmailTemplate, sendEmail } from '@/api/email'
// ⚠️ ייבוא חוצה-מודולים במכוון, ולא העתקה: שתי הפונקציות האלה טהורות-לחלוטין מסמנטיקה של
// מודול 6 (המרת Blob ל-base64 בקטעים · קריאת פרמטר בודד מ-`params`), והעתקתן לכאן הייתה
// יוצרת שני עותקים שיתפצלו ביום שאחד מהם יתוקן. התקדים לייבוא כזה הוא מודול 6 עצמו, שמייבא
// את `writeInviteToken` ממודול 4. 📌 **הבית הנכון שלהן הוא `src/lib/`** — ההעברה לא נעשתה כאן
// כי `closingApi.js` אינו קובץ של הצעד הזה; נרשם כחוב-ניקיון.
import { fileToBase64 } from '@/modules/06_projects/closingApi'

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
    // 🔤 R13 — שגיאה = משפט אחד: הבסיס (`fallbackMessage`, כבר מסתיים בנקודה) מאבד אותה
    // ומצטרף בקו-מפריד, לא בשתי נקודות נפרדות.
    throw toError(
      { code: 'FINANCE_RPC_SHAPE' },
      `${fallbackMessage.replace(/\.$/, '')} — תשובת השרת לא הייתה תקינה.`,
    )
  }
  return data
}

// ---- קריאות (Reads) ----

// שורות שלוש הלשוניות של S1. ה-RPC מחזיר **עובדות בלבד**; ימי-האיחור, האחוזים ותגית-הציון
// נגזרים ב-`src/lib/projectFinance.js` בזמן-תצוגה (§7.52 — ‏₪ נשמר, ‏% תמיד נגזר).
// ⚠️ `payment_terms_days` יכול לחזור `null` (הפרמטר לא נזרע) — הקורא מציג `—`, לעולם לא 0.
// 🔴 03/09/2026: `fetchAll` — 711 שורות-כספים חיות, וגם RPC נחתך ב-1,000 בשקט. הפונקציה ממיינת
// לפי `project_id` בעצמה; ה-`order` כאן מצהיר את חוזה-הדפדוף גם אם הגוף ישתנה.
export async function listFinanceOverview() {
  const { data, error } = await fetchAll(() =>
    supabase.rpc('get_finance_overview').order('project_id'),
  )
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

// הנמען של מייל-החשבונית (M1) ושם-החברה ל-placeholder. **קריאה ישירה ולגיטימית**: מנהלת
// הכספים מחזיקה `edit` על 'לקוחות' (נמדד 27/08/2026), ולכן זו אינה אחת מהטבלאות החסומות.
// 🔴 `null` כשאין שורה — והקורא **חוסם את השליחה עם הפניה לכרטיס-הלקוח** (כרטיס-P1), ולא
// מסיק "אין ללקוח מייל": חוסר-הרשאה וחוסר-שורה נראים כאן אותו דבר.
//
// 🔴 **‏`company_number` נשלף אף שהקוד כאן אינו משתמש בו — והוא נוסף 01/09/2026.** התצוגה
// המאושרת של חלון-הסגירה מונה *"ח.פ / איש-קשר / מייל-לחיוב"* כשלושת פרטי-החיוב הנעולים-
// לעיון, אבל התא שבמסך היה מותנה בשדה שה-select הזה מעולם לא ביקש ⇒ **תנאי שלעולם אינו
// מתקיים, כלומר שדה שהובטח ולא הוצג מעולם.** ⚠️ ומסך של מודול קורא רק דרך ה-api שלו
// (כלל ברזל 14), ולכן החוסר לא היה ניתן לתיקון בצד-המסך. **שם-העמודה נלקח מ-`schema.sql`
// ולא נוחש** — היא `not null` עם ‏`check` של 9 ספרות, כלומר תא ריק כאן פירושו שאין שורה
// כלל, ולא שללקוח אין ח.פ.
// N2: `contact_name`/`email` הראשיים הם שורה ב-customer_contacts (is_primary), לא עמודות
// על customers — נקראים כאמבד ונבחרים דרך primaryContact (לא inline). `customer_id` /
// `company_number` / `company_name` נשארים על customers עצמה (אינם N2). הצורה שיוצאת
// ({customer_id, company_number, company_name, contact_name, email} או null) נשארת זהה
// כדי ש-ClosingWindowDialog (כולל sendInvoiceAndRecord, שמקבלת את זה כ-`customer`) לא ישתנה.
export async function getBillingContact(customerId) {
  if (!customerId) return null
  const { data, error } = await supabase
    .from('customers')
    .select(
      'customer_id, company_number, company_name, customer_contacts(contact_name, email, is_primary)',
    )
    .eq('customer_id', customerId)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת פרטי החיוב של הלקוח.')
  if (!data) return null
  const contact = primaryContact(data)
  return {
    customer_id: data.customer_id,
    company_number: data.company_number,
    company_name: data.company_name,
    contact_name: contact?.contact_name ?? null,
    email: contact?.email ?? null,
  }
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
  { score = null, reason = null, reasons = [], notes = null, markNoResponse = false } = {},
) {
  const reasonsArray =
    Array.isArray(reasons) && reasons.length > 0 ? reasons : reason ? [reason] : []

  return callWriteRpc(
    'record_feedback',
    {
      p_project_id: projectId,
      p_score: score,
      p_reason: reasonsArray[0] ?? reason,
      p_notes: notes,
      p_mark_no_response: markNoResponse,
      p_reasons: reasonsArray,
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
export const INVOICE_FILE_REQUIRED_NOTE = 'חסום: יש לבחור קובץ — שליחה בלי חשבונית אינה אפשרית.'

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

// ---- מיילים: שמות התבניות, הנושאים והגופים ----

// 🔴 זהים-בייט לשורות ה-`params` (מיגרציה `20260723112000`). שם שגוי בתו אחד מחזיר תבנית
// חסרה — ואז אין מייל, וההודעה מדברת על תבנית ולא על הקובץ.
export const FINANCE_TEMPLATE_NAMES = {
  invoice: 'תבנית_מייל_חשבונית_מס',
  salaryReport: 'תבנית_מייל_דוח_שכר',
}

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

// מציין-המקום של שם-הרו"ח, והמפריד שהתבנית החיה מניחה **לפניו** (זרע ה-`params`:
// *"שלום לצוות הנהלת חשבונות / [שם_רואה_חשבון],"*).
const ACCOUNTANT_NAME_TOKEN = '[שם_רואה_חשבון]'
const ACCOUNTANT_NAME_SEPARATOR = ' / '

// מסירה את מציין-המקום של שם-הרו"ח **יחד עם המפריד שצמוד אליו**, ומנקה את השארית.
//
// 🔴 **למה על התבנית ולא על הגוף המוכן:** התבנית היא חוזה (`findUnknownPlaceholders` סורק
// אותה, לא את התוצאה), והערכים המוזרקים הם דאטה שמותר לה להכיל כל תו. ניקוי על הגוף
// **אחרי** המילוי היה נוגע גם בשם-החודש ובכל טקסט שהמסד יזריק בעתיד.
// 🔴 **ולמה רק השורה שנושאת את מציין-המקום:** הגוף הוא דאטה ב-`params` שאנשים עורכים
// ב-Table Editor (§7.70). טרנספורמציה גורפת על כל השורות הייתה משנה בשקט טקסט שאיש לא
// ביקש לגעת בו — כאן היא נוגעת **אך ורק בשורת-הפנייה, ואך ורק כשאין שם.**
// ⚠️ שני הכיוונים נתמכים (מפריד לפני / מפריד אחרי) כדי שניסוח-מחדש של השורה במסד לא
// יחזיר את הפגם בשקט; אחריהם מסירים מציין-מקום שנשאר בלי מפריד כלל, ואז מכווצים רווח
// תלוי לפני פסיק/נקודה ורווח-כפול — הסימנים היחידים שההסרה מסוגלת להשאיר.
export function templateWithoutAccountantName(template) {
  return String(template ?? '')
    .split('\n')
    .map((line) => {
      if (!line.includes(ACCOUNTANT_NAME_TOKEN)) return line
      return line
        .split(ACCOUNTANT_NAME_SEPARATOR + ACCOUNTANT_NAME_TOKEN)
        .join('')
        .split(ACCOUNTANT_NAME_TOKEN + ACCOUNTANT_NAME_SEPARATOR)
        .join('')
        .split(ACCOUNTANT_NAME_TOKEN)
        .join('')
        .replace(/\s+([,.])/g, '$1')
        .replace(/ {2,}/g, ' ')
        .trim()
    })
    .join('\n')
}

// גוף מייל דוח-השכר (M2). שני ה-placeholders של התבנית החיה: `[שם_רואה_חשבון]` ו-
// `[חודש_דיווח_ושנה]`.
//
// 🔴 **‏`accountantName` הוא חור-מוצר פתוח, לא ברירת-מחדל שהומצאה כאן.** ל-`[שם_רואה_חשבון]`
// **אין מקור-נתונים בשום מקום במערכת** — ‏`params` מחזיק את כתובת-המייל של המשרד ותו לא
// (נמדד חי; ‏`data-set.md §6` מסמן את "רו"ח דורון אשכנזי" שבמוקאפ כ-🎭 **שם מומצא-לחלוטין**,
// וכרטיס-M2 §③ חוזר על כך). ⇒ הפרמטר מתקבל מהקורא ואינו מנוחש כאן.
// ⛔ שתילת שם מומצא בקוד הייתה שולחת לרו"ח האמיתי מייל שפונה לאדם שאינו קיים, ולכן **גם
// התיקון שלמטה אינו ממציא שם ואינו זורע שדה** — ההכרעה אם להוסיף שדה-שם למערכת היא הכרעת-
// מוצר שאיש טרם קיבל, והיא נשארת פתוחה.
export function buildSalaryReportEmailPayload({
  template,
  recipient,
  periodLabel,
  accountantName = null,
  fileName,
  attachmentBase64,
}) {
  // 🔴 **בלי שם — מסירים את מציין-המקום מהתבנית, לא ממלאים אותו בריק.** ‏`fillEmailTemplate`
  // מחליף מחרוזת-במחרוזת, ולכן ערך ריק על שורת-הפנייה החיה (*"שלום לצוות הנהלת חשבונות /
  // ‏[שם_רואה_חשבון],"*) הפיק **"שלום לצוות הנהלת חשבונות / ,"** — לוכסן ופסיק יתומים
  // שנוחתים בשורה הראשונה של מייל שיוצא למשרד רואי-חשבון אמיתי, ונקראים כתקלה במערכת
  // ששלחה אותו. ⚠️ **וכל שלושת אתרי-הקריאה מעבירים `null` היום**, כלומר זה לא ענף-קצה
  // אלא **ההתנהגות היחידה שקיימת בפועל.**
  const name = String(accountantName ?? '').trim()
  const body = fillEmailTemplate(name === '' ? templateWithoutAccountantName(template) : template, {
    '[שם_רואה_חשבון]': name,
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
    // 🔤 B13 — פעולה קודמת לעובדה: "יש להשלים..." פותח ונושא את כל מה שצריך לעשות;
    // המחסום עצמו יושב מאחורי קו-המפריד ולא לפניו.
    throw toError(
      { code: 'NO_BILLING_EMAIL' },
      'יש להשלים כתובת מייל לחיוב בכרטיס הלקוח — בלעדיה אי-אפשר לשלוח את החשבונית.',
    )
  }

  const [template, attachmentBase64] = await Promise.all([
    getEmailTemplate(FINANCE_TEMPLATE_NAMES.invoice),
    fileToBase64(file),
  ])

  // 🔴 **קיר-המייל נמוך מקיר-הבאקט, ולכן `validateInvoiceFile` לבדה אינה מספיקה.** הבאקט מתיר
  // 10MB, אבל `MAX_ATTACHMENT_BASE64_CHARS = 4,000,000` שבמנוע הוא קיר בינארי של ~2.86MB
  // (‏base64 מנפח 3⇒4) ⇒ חשבונית שצולמה בטלפון (4MB) **עוברת** את הוולידציה, נדחית בצד-Make,
  // וחוזרת ככשל גנרי שכל מה שהוא מציע הוא "יש לנסות שוב" — הפעולה היחידה שלעולם לא תעבוד.
  // מדריך-המיקרו §2.6 דורש זאת במפורש: *"the 10MB bucket admits invoice files bigger than mail
  // can carry — invoice send must surface the engine's size error (it exists) rather than assume
  // fit"*. ⚠️ **והמיקום הוא חצי מהתיקון: לפני ההעלאה** ⇒ אין קובץ יתום בבאקט ואין נגיעה במסד,
  // ולכן ההודעה יכולה להבטיח שדבר לא נשלח ולא נשמר.
  // 🔗 התקדים: `03_quotes/QuoteDocumentDialog.jsx` עוצר באותה פונקציה בדיוק. **הנוסח שונה
  // במכוון** — שם המסמך נוצר במערכת ולכן "יש להוריד אותו ולשלוח ידנית" הוא פתרון; כאן הקובץ
  // כבר אצל המנהלת, ושליחה ידנית הייתה משאירה את הפרויקט לא-מסומן. לכן הפעולה היא הקטנת הקובץ.
  // 📌 **מה זה אינו סוגר** (חוב, ולא שכחה): הבאנר במסך עדיין מזמין "עד 10MB", כי הוא חי
  // ב-`ClosingWindowDialog.jsx` ונגזר מ-`FINANCE_MAX_BYTES`/מגבלת-הבאקט. הצורה הנקייה היא זו
  // של מודול 6 (`REPORT_MAX_BYTES = 2MB`, עם בדיוק הנימוק הזה) — תקרה שנמוכה מקיר-המייל כבר
  // בבחירת-הקובץ; היא דורשת גם שינוי-מסך וגם מיגרציית-באקט, ולכן אינה נעשית כאן בשקט.
  if (isAttachmentTooLarge(attachmentBase64)) {
    // 🔤 B13 + R13 — פעולה ("יש להקטין... ולנסות שוב") פותחת ונושאת את מה שצריך לעשות;
    // הסייג-החיוני (כלום לא נשלח/נשמר, H2) יושב מאחורי קו-מפריד באותו משפט, לא בשני
    // משפטים נפרדים.
    throw toError(
      { code: 'ATTACHMENT_TOO_LARGE' },
      'יש להקטין את הקובץ (סריקה או צילום ברזולוציה נמוכה יותר) ולנסות שוב — הוא גדול מדי לשליחה אוטומטית במייל, ושום דבר לא נשלח ולא נשמר.',
    )
  }

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
      'לא ניתן להרכיב את מייל החשבונית — בדוק את תבנית המייל ואת פרטי הלקוח.',
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

// שם-הקובץ מתוך מפתח-האחסון (`salary_reports/7_08_2026_Payroll_Report.xlsx` ⇒
// `08_2026_Payroll_Report.xlsx`). תחילית מזהה-הדוח נחתכת כדי שמה שמגיע לרו"ח ייקרא כמו
// שם-קובץ ולא כמו מפתח פנימי.
export function fileNameOf(path) {
  const base = String(path ?? '')
    .split('/')
    .pop()
  return (base ?? '').replace(/^\d+_/, '')
}
