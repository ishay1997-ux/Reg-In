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
  // כולל את אנשי-הקשר הנוספים (§7.81) לחיפוש הסלחני על פני כולם (matchesText ב-src/lib/customers.js).
  const { data, error } = await supabase
    .from('customers')
    .select('*, customer_contacts(contact_name)')
    .order('company_name')
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

// הלקוחות המאושרים-לדיוור **וגם** הפעילים — קהל-היעד של אזור-השיווק (step 3.5). מחזיר שורות מלאות
// (שם/איש-קשר/אימייל/סוג/הנחה) כדי שהפאנל יציג רשימת-נמענים לבחירה פר-שליחה, לא רק מונה (רדיזיין 11/07).
// ה-BCC נגזר מהמסומנים בצד-ה-UI עם dedup על email (email אינו UNIQUE §7.65 — איש-קשר משותף לשתי חברות
// לגיטימי; Set מונע דיוור כפול). why-first: לא-פעיל לא מקבל דיוור גם אם נתן הסכמה בעבר (ארכיון=מחוץ לתפוצה).
export async function getConsentedCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('customer_id, company_name, contact_name, email, customer_type, discount_percent')
    .eq('marketing_consent', true)
    .eq('status', 'active')
    .order('company_name')
  if (error) throw toError(error, 'שגיאה בטעינת רשימת הנמענים המאושרים.')
  return data ?? []
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
// status גם מוסר: ארכוב/שחזור עובר **רק** דרך setCustomerStatus (מוסכמת-הארכיון), כך שבאג-UI
// שיעביר status בטעות לא יעקוף את הפונקציה הייעודית — שכבת-הגנה נוספת, לא החומה (ה-RLS הוא החומה).
// .select() חושף חסימת-RLS שקטה: 0 שורות מוחזרות = הרשאה נדחתה (view בלי edit) → שגיאה, לא הצלחה-שקטה.
export async function updateCustomer(customerId, patch) {
  const safePatch = { ...patch }
  delete safePatch.customer_id
  delete safePatch.company_number
  delete safePatch.status
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

// ---- אנשי-קשר נוספים (customer_contacts, §7.81 — מודל אופציה C) ----
// איש-הקשר הראשי חי inline על customers; כאן רק ה*נוספים*. RLS זהה (הרשאת מודול 'לקוחות').

// אנשי-הקשר הנוספים של לקוח, ממוינים לפי סדר-יצירה.
export async function listCustomerContacts(customerId) {
  const { data, error } = await supabase
    .from('customer_contacts')
    .select('*')
    .eq('customer_id', customerId)
    .order('contact_id')
  if (error) throw toError(error, 'שגיאה בטעינת אנשי הקשר.')
  return data ?? []
}

// שמירת קבוצת אנשי-הקשר הנוספים של לקוח = replace (מחיקה + הכנסה). why: הטופס עורך את כל הקבוצה
// כיחידה, ו-replace פשוט ואמין מ-diff לרשימה קטנה; ה-contact_id מתחדש בכל שמירה — מקובל כי אנשי-הקשר
// אינם מפתח-זר לשום דבר. שורות בלי שם מסוננות (שם = חובה ב-DB). מחזיר את השורות שנשמרו.
export async function replaceCustomerContacts(customerId, contacts) {
  const { error: delError } = await supabase
    .from('customer_contacts')
    .delete()
    .eq('customer_id', customerId)
  if (delError) throw toError(delError, 'שמירת אנשי הקשר נכשלה.')
  const rows = (contacts ?? [])
    .filter((c) => (c.contact_name ?? '').trim() !== '')
    .map((c) => ({
      customer_id: customerId,
      contact_name: c.contact_name.trim(),
      phone: (c.phone ?? '').trim() || null,
      email: (c.email ?? '').trim() || null,
    }))
  if (rows.length === 0) return []
  const { data, error } = await supabase.from('customer_contacts').insert(rows).select()
  if (error) throw toError(error, 'שמירת אנשי הקשר נכשלה.')
  return data ?? []
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
