// שכבת ה-API של מודול 2 (לקוחות) — כלל 14: כל גישת ה-Supabase של המודול מרוכזת כאן בקובץ אחד.
// קומפוננטות ה-UI (Phase 3) מייבאות את הפונקציות האלה בלבד ולעולם לא קוראות ל-supabase.from(...)
// בעצמן — כך שאילתה משתנה במקום אחד, ושכבת ה-RLS (מודול 1) נשארת החומה האמיתית מתחת לכל קריאה.
// לוגיקה עסקית (תוויות, סינון, מיון, מדדים) חיה ב-src/lib/customers.js — כאן רק קלט/פלט מול ה-DB.

import { supabase } from '@/supabaseClient'

// עוטף שגיאת-Supabase כ-Error עם שדה code משומר, כדי שה-UI יוכל להבחין במקרים ידועים
// (למשל 23505 = הפרת-unique על ח"פ, שמניע את זרימת-הכפילות §7.11 ב-step 3.2) בלי לחשוף את מבנה
// אובייקט-השגיאה של supabase לכל הקוראים. why-first: זריקה (ולא החזרת {error}) מאפשרת ל-UI
// לעטוף ב-try/catch נקי; קריאות-קריאה שנכשלות הן חריגות אמיתיות, לא זרימה רגילה.
function toError(error, fallbackMessage) {
  const e = new Error(fallbackMessage)
  e.code = error?.code
  e.cause = error
  return e
}

// ---- קריאות (Reads) ----

// כל הלקוחות (פעילים ולא-פעילים) ממוינים לפי שם-חברה. הסינון/המיון העדין נעשה בצד-לקוח דרך
// src/lib/customers.js (מסך קטן, דאטה קטן) — כאן מביאים את הסט המלא שה-RLS מתיר לתפקיד.
export async function listCustomers() {
  const { data, error } = await supabase.from('customers').select('*').order('company_name')
  if (error) throw toError(error, 'שגיאה בטעינת רשימת הלקוחות.')
  return data ?? []
}

// לקוח בודד לפי ה-PK הפנימי (customer_id, surrogate §7.64). מחזיר null אם אין שורה נגישה
// (לא-קיים או חסום ב-RLS) — הקורא מחליט אם זו שגיאה בהקשר שלו.
export async function getCustomer(customerId) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('customer_id', customerId)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת פרטי הלקוח.')
  return data ?? null
}

// היסטוריית הפרויקטים של לקוח, דרך שרשרת ה-FK customers→quotes→projects.
// quotes/projects עדיין deny-all (אין policies עד מודול 3/6) ולכן זה מחזיר [] כחוק — לא שגיאה;
// כרטיס-הלקוח (step 3.6) מציג "אין פרויקטים עדיין" עד שהמודולים האלה יוסיפו policies+דאטה.
// !inner על quotes = צירוף-פנימי כדי שאפשר לסנן לפי quotes.customer_id דרך המשאב המקונן.
// 🚧 מ6 — חוב חוצה-מודולים רשום ב-PROJECT_MASTER §6 (שורת "השלמות כרטיס לקוח"): מודול 6 מוסיף
// SELECT policy+דאטה ל-projects, מודול 3 ל-quotes; רק אז ה-join יחזיר שורות. הרשם הזה הוא מה
// שפרומפט-הפתיחה של מודול 6 גורף (`grep '🚧 מ6' §6`) כדי לחזור ולחבר את המסך הזה — כלל ברזל 15.
export async function getCustomerProjects(customerId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*, quotes!inner(customer_id)')
    .eq('quotes.customer_id', customerId)
  if (error) throw toError(error, 'שגיאה בטעינת היסטוריית הפרויקטים.')
  return data ?? []
}

// כתובות הדוא"ל של הלקוחות שמאושרים לדיוור **וגם** פעילים — קהל-היעד ל-BCC של אזור-השיווק
// (step 3.5). why-first: לא-פעיל לא מקבל דיוור גם אם נתן הסכמה בעבר (ארכיון = מחוץ לתפוצה).
export async function getConsentedCustomerEmails() {
  const { data, error } = await supabase
    .from('customers')
    .select('email')
    .eq('marketing_consent', true)
    .eq('status', 'active')
  if (error) throw toError(error, 'שגיאה בטעינת רשימת הנמענים המאושרים.')
  return (data ?? []).map((row) => row.email)
}

// ---- כתיבות (Writes) ----

// יצירת לקוח חדש. משאיר את שגיאת ה-DB לצוף עם code — 23505 (הפרת-unique על company_number)
// היא הטריגר לזרימת-הכפילות הידידותית של §7.11 ב-step 3.2 (הודעה/הצעת-שחזור), לא כשל גנרי.
// .select().single() מחזיר את השורה שנוצרה (כולל ה-customer_id שה-DB הקצה) לרענון מיידי ב-UI.
export async function createCustomer(customer) {
  const { data, error } = await supabase.from('customers').insert(customer).select().single()
  if (error) throw toError(error, 'יצירת הלקוח נכשלה.')
  return data
}

// עדכון לקוח קיים לפי ה-PK. company_number (ח"פ) ו-customer_id לעולם לא משתנים במודול 2 —
// מוסרים אותם מה-patch הגנתית כדי שקורא לא ישנה בטעות מזהה עסקי/מפתח (החלטת-קיבוע §7.11/§7.64).
// .select() חושף חסימת-RLS שקטה: 0 שורות מוחזרות = הרשאה נדחתה (view בלי edit) → שגיאה, לא הצלחה-שקטה.
export async function updateCustomer(customerId, patch) {
  const safePatch = { ...patch }
  delete safePatch.customer_id
  delete safePatch.company_number
  const { data, error } = await supabase
    .from('customers')
    .update(safePatch)
    .eq('customer_id', customerId)
    .select()
  if (error) throw toError(error, 'שמירת השינויים נכשלה.')
  if (!data || data.length === 0) throw toError({ code: 'RLS_DENIED' }, 'אין הרשאה לעדכן לקוח זה.')
  return data[0]
}

// ארכוב/שחזור דו-כיווני (מוסכמת מודול 1 המחייבת: אין "מחיקה", רק status active/inactive).
// אותה בדיקת-.select() לחסימת-RLS שקטה כמו ב-updateCustomer.
export async function setCustomerStatus(customerId, status) {
  const { data, error } = await supabase
    .from('customers')
    .update({ status })
    .eq('customer_id', customerId)
    .select()
  if (error) throw toError(error, 'שינוי סטטוס הלקוח נכשל.')
  if (!data || data.length === 0)
    throw toError({ code: 'RLS_DENIED' }, 'אין הרשאה לשנות את סטטוס הלקוח.')
  return data[0]
}

// ---- אחסון שיווקי (Storage) ----
// 🚧 מ10 — מודל-השליחה כאן זמני (mailto+קישור ציבורי, בלי מעקב-שליחות); מודול 10 מחליף
// בשליחת-שרת אמיתית + יומן-שליחות. רשום ב-PROJECT_MASTER §6 ("שליחת חומר שיווקי אמיתית").

// אזור-השיווק (מסך 5.6.3): קבצי PDF/JPG/PNG עד 10MB (לפי המוקאפ). מוגדר כאן פעם אחת כדי
// שגם ה-UI (step 3.5) יאכוף אותו לפני העלאה בלי לשכפל את הרשימה.
export const MARKETING_ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png']
export const MARKETING_MAX_BYTES = 10 * 1024 * 1024 // 10MB

// העלאת קובץ שיווקי ל-bucket הציבורי 'marketing'. ולידציית סוג/גודל לפני הרשת (חוסך round-trip
// וכשל מבלבל). why-first: שם-הקובץ מקבל תחילית חותמת-זמן כדי למנוע התנגשות/דריסה של קבצים
// באותו שם; upsert:false נשאר ברירת-מחדל להגנה נוספת מפני דריסה. מחזיר את הנתיב ב-bucket.
// §7.36 (אטומיות Storage↔DB, מעוגן): במודול 2 אין כתיבת-DB מזווגת להעלאה (השליחה = mailto עם
// קישור ציבורי, בלי רשומת-DB), ולכן אין תרחיש קובץ-יתום כאן; העיגון נשאר ל-step 3.5 אם ישתנה.
export async function uploadMarketingFile(file) {
  if (!file) throw toError({ code: 'NO_FILE' }, 'לא נבחר קובץ.')
  if (!MARKETING_ALLOWED_MIME.includes(file.type)) {
    throw toError({ code: 'BAD_TYPE' }, 'סוג קובץ לא נתמך. יש להעלות PDF, JPG או PNG.')
  }
  if (file.size > MARKETING_MAX_BYTES) {
    throw toError({ code: 'TOO_LARGE' }, 'הקובץ גדול מדי (מותר עד 10MB).')
  }
  const safeName = file.name.replace(/[^\w.-]/g, '_') // שם-קובץ בטוח לנתיב (לועזי/מספרים/נקודה/מקף)
  const path = `${Date.now()}_${safeName}`
  const { error } = await supabase.storage.from('marketing').upload(path, file, { upsert: false })
  if (error) throw toError(error, 'העלאת הקובץ נכשלה.')
  return { path }
}

// קישור ציבורי קבוע לקובץ שיווקי (הכרעת ישי 06/07: bucket ציבורי, לא Signed URL — חומר-שיווק
// לא רגיש). getPublicUrl סינכרוני ולא נכשל; מחזיר את ה-URL להטמעה בגוף ה-mailto (step 3.5).
export function getMarketingPublicUrl(path) {
  const { data } = supabase.storage.from('marketing').getPublicUrl(path)
  return data.publicUrl
}
