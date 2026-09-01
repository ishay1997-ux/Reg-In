// קובץ-API שני של מודול 6 — צד-ה-IO של לשונית סגירת-האירוע (צעד 3.5), לצד `cancellationApi.js`
// (התקדים: pricesApi.js — קובץ-api נוסף כשמשטח אחד נושא IO ייחודי שאינו של שאר המודול).
// כאן: ה-Storage של bucket `reports` (המסלול הראשון מסוגו בפרויקט — `createSignedUrl` הופיע
// 0 פעמים ב-src/ עד היום), קריאת איש-הקשר למיילי-הסגירה, וקריאת ערך-פרמטר בודד מ-`params`.
//
// 🔴 סדר-השמירה שאסור להפוך (spec §2.2 · צעד 3.5): העלאה ל-reports/<project_id>/… ⇒ RPC
// אטומי אחד (נתיב + סטטוס) ⇒ ובכשל ה-RPC — **מחיקת הקובץ שהועלה**. "קובץ יתום הוא לכלוך
// שקוף; פרויקט סגור בלי דוח הוא שבר-נתונים" (㉛). ההרכבה עצמה בקומפוננטה; כאן הפרימיטיבים.

import { supabase } from '@/supabaseClient'
import { toError } from '@/lib/apiError'

// מגבלות ה-bucket — זהות-ערך למה שנמדד חי על storage.buckets (צעד 3.5 as-built ⑤:
// `file_size_limit = 2097152`, `allowed_mime_types = {application/pdf, image/jpeg, image/png}`).
// 🔴 2MB בהכרעת-ישי 14/08/2026 (db_roadmap §5) — 🚫 לא ה-10MB של MARKETING_MAX_BYTES, שהוא
// bucket אחר; הדפוס (קבוע אחד + טקסט-מסך שנגזר ממנו) הועתק מ-02_customers/api.js:180.
// הנימוק ל-2 דווקא: קיר-המייל הקשיח הוא 3,000,000 בייט (MAX_ATTACHMENT_BASE64_CHARS=4M,
// ‏base64 ‏3⇒4) — קובץ שעובר bucket של 3MB עדיין נכשל בשליחה, אחרי שהסגירה כבר נרשמה.
export const REPORT_MAX_BYTES = 2 * 1024 * 1024
export const REPORT_ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png']

// העלאת דוח-הסיכום. הנתיב: `<project_id>/<timestamp>_<שם-מנוקה>` בתוך bucket `reports`
// (המפתח נשמר ללא קידומת-bucket — זה מה ש-download/createSignedUrl/remove מקבלים, וזה מה
// שנכתב ל-p_report_path). חותמת-זמן בתחילית מונעת דריסה של דוח קודם באותו שם — הדפוס של
// uploadMarketingFile. ולידציית סוג/גודל רצה בטופס לפני הקריאה לכאן (validateReportFile);
// כאן רק ההעלאה עצמה.
export async function uploadReportFile(projectId, file) {
  if (!file) throw toError({ code: 'NO_FILE' }, 'לא נבחר קובץ.')
  const safeName = file.name.replace(/[^\w.-]/g, '_')
  const path = `${projectId}/${Date.now()}_${safeName}`
  const { error } = await supabase.storage.from('reports').upload(path, file, { upsert: false })
  if (error) throw toError(error, 'העלאת דוח-הסיכום נכשלה.')
  return { path }
}

// מחיקת הקובץ אחרי כשל-RPC — best-effort: אם גם המחיקה נכשלת, נשאר קובץ יתום (לכלוך
// שקוף, לא שבר-נתונים) והשגיאה המקורית של ה-RPC היא זו שמוצגת. לכן אין throw כאן.
export async function deleteReportFile(path) {
  if (!path) return
  try {
    await supabase.storage.from('reports').remove([path])
  } catch {
    // בכוונה נבלע — הכשל הראשי (ה-RPC) כבר בדרך למסך, והקובץ היתום אינו מסוכן.
  }
}

// המרת Blob/File ל-base64 במקטעים — כדי לא לפוצץ את מחסנית-הקריאות של btoa על קובץ שלם.
// משמשת פעמיים: הקובץ המקומי בשליחה הראשונה (אותם בייטים שהועלו הרגע), וההורדה מה-bucket
// בשליחה החוזרת (שם אין קובץ מקומי בזיכרון).
export async function fileToBase64(blob) {
  const buffer = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < buffer.length; i += chunk) {
    binary += String.fromCharCode(...buffer.subarray(i, i + chunk))
  }
  return btoa(binary)
}

// הורדת הדוח מה-bucket כ-base64 לצירוף למייל — 🔴 להוריד ולצרף, לעולם לא קישור חתום
// (spec §12⑬(ג)).
export async function downloadReportAsBase64(path) {
  const { data, error } = await supabase.storage.from('reports').download(path)
  if (error || !data) throw toError(error, 'הורדת דוח-הסיכום מהאחסון נכשלה.')
  return fileToBase64(data)
}

// קישור-הורדה זמני לכפתור "הורדה" במצב-הנעול — ה-bucket פרטי (㉛), ולכן signed URL קצר-חיים
// ולא public URL. השימוש הראשון ב-createSignedUrl בכל הפרויקט — אין תקדים להעתיק, הדפוס
// מתועד כאן: 60 שניות מספיקות ללחיצת-הורדה, וקישור שפג אינו נשלח לאיש (הוא לשימוש-מסך בלבד).
export async function getReportSignedUrl(path) {
  const { data, error } = await supabase.storage.from('reports').createSignedUrl(path, 60)
  if (error || !data?.signedUrl) throw toError(error, 'יצירת קישור להורדת הדוח נכשלה.')
  return data.signedUrl
}

// איש-הקשר ואת כתובת-המייל של הלקוח — הנמען של שני מיילי-הסגירה. `customers` מגודרת על
// 'לקוחות' (למנהלת הפרויקטים ולמנכ"ל יש edit שם); קריאה חסומה מחזירה null בלי שגיאה —
// והקורא מציג כשל-שליחה מנומק ("אין כתובת מייל"), לא מסיק שאין ללקוח מייל.
export async function getCustomerMailContact(customerId) {
  if (!customerId) return null
  const { data, error } = await supabase
    .from('customers')
    .select('contact_name, email')
    .eq('customer_id', customerId)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת פרטי הלקוח.')
  return data ?? null
}

// סימוני-האיכות השמורים — לתצוגת הקריאה-בלבד של הלשונית אחרי סגירה. הטבלה מגודרת על
// 'דיילות' (select ב-edit|view); קריאה חסומה מחזירה אפס שורות בלי שגיאה ⇒ העמודה מציגה
// `—`, לא מסיקה "לא סומנה". המפתח פר-(לקוח, דיילת) — B13: אירוע מאוחר דורס, אין היסטוריה.
export async function getCustomerPreferences(customerId, hostessIds) {
  if (!customerId || !hostessIds?.length) return []
  const { data, error } = await supabase
    .from('customer_hostess_preference')
    .select('hostess_id, preference, preference_reason')
    .eq('customer_id', customerId)
    .in('hostess_id', hostessIds)
  if (error) throw toError(error, 'שגיאה בטעינת סימוני-האיכות.')
  return data ?? []
}

// ערך פרמטר בודד מ-params. לא getEmailTemplate — הודעת-הכשל שלו אומרת "תבנית המייל חסרה",
// וזה שקר על פרמטר שאינו תבנית; כאן ההודעה נוקבת בשם הפרמטר עצמו.
// ⚠️ **הקורא המקורי (קישור-סקר-הלקוחות) יצא מהזרימה במודול 8** — הקישור נגזר מעכשיו מטוקן
// (`feedbackUrlFor`). הפונקציה נשארה כי היא גנרית ומשמשת את מודול 8 (`08_finance/api.js`).
export async function getParamValue(name) {
  const { data, error } = await supabase
    .from('params')
    .select('param_value')
    .eq('param_name', name)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת הגדרות המערכת.')
  if (!data?.param_value) {
    throw toError({ code: 'PGRST116' }, `הפרמטר "${name}" חסר בהגדרות המערכת.`)
  }
  return data.param_value
}
