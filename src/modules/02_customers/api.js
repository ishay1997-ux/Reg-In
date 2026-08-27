// שכבת ה-API של מודול 2 (לקוחות) — כלל 14: כל גישת ה-Supabase של המודול מרוכזת כאן בקובץ אחד.
// קומפוננטות ה-UI (Phase 3) מייבאות את הפונקציות האלה בלבד ולעולם לא קוראות ל-supabase.from(...)
// בעצמן — כך שאילתה משתנה במקום אחד, ושכבת ה-RLS (מודול 1) נשארת החומה האמיתית מתחת לכל קריאה.
// לוגיקה עסקית (תוויות, סינון, מיון, מדדים) חיה ב-src/lib/customers.js — כאן רק קלט/פלט מול ה-DB.

import { supabase } from '@/supabaseClient'
// עוטף-השגיאות המשותף (חולץ 31/07/2026 — היה משוכפל זהה-בייט בשלושה api.js). הקוד המשומר
// הוא מה שמניע כאן את זרימת-הכפילות §7.11 (‏23505 = הפרת-unique על ח"פ) ב-step 3.2.
import { toError, assertRowsAffected } from '@/lib/apiError'
import { DORMANT_THRESHOLD_PARAM_NAME } from '@/lib/customerProjects'
// 🔁 אתר-הקריאה היחיד ל-`list_project_changes` במערכת חי במודול 6 (‏`src/modules/06_projects/CLAUDE.md`:
// *"הקריאה היחידה: `rpc('list_project_changes')`"*). מודול 2 **צורך** אותו ולא משכפל אותו —
// שכפול היה מייצר שתי גרסאות של שער-הכסף המסוכך (`money_visible`). ר' `attachProjectChanges`.
import { getProjectChanges } from '@/modules/06_projects/api'

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

// היסטוריית הפרויקטים של לקוח (משטח 8, מודול 6 על מסך מודול 2) — SELECT בלבד, פרויקטים
// גדלים ב-projects_select_by_permission ('פרויקטים') כמו כל שדה-פרויקט אחר.
// 🔴 A12 — תוקן 19/08/2026: הסינון עובר ישירות דרך projects.customer_id (ה-FK הישיר,
// index projects_customer_id_idx כבר קיים — schema.sql:517, לא נוצר אינדקס נוסף) ולא דרך
// quotes!inner. `projects.quote_id` הוא nullable ⇒ !inner היה מעלים בשקט כל פרויקט בלי
// הצעה. הצירוף להצעה נשאר, אבל כ-LEFT (ברירת-המחדל של Supabase כשאין !inner) — פרויקט בלי
// הצעה נגיש מוצג עם `quotes: null` והמסך מציג '—' בעמודת הסכום, לא נעלם משורה.
// עמודות מפורשות — לא `select('*')`.
//
// 🔴 **ההערה כאן התהפכה במכוון ב-28/08/2026 (מודול 8 · צעד 4.2), ואינה עריכה שקטה.**
// עד היום עמד כאן: *"projects נושאת שדות-כספים (payment_date, invoice_sent, feedback_*)
// שאין להם מקום בלשונית-הלקוח"* — ה-select היה **צר בכוונה**, מטעמי צנעה. **מה שהשתנה:**
// ‏ה8 (‏§7.79, הכרעת-קלוד-בהאצלה בהרשאת-ישי 26/08/2026) קובע שממוצע-המשוב של כרטיס-הלקוח
// מחושב על **בעלי `feedback_status='completed'` בלבד** — כלומר האריח שהאפיון (‏C5 5.7.3 ·
// ‏C6 §2.4.1 "מאלה שענו") דורש **אינו ניתן לחישוב** בלי שני שדות-המשוב האלה.
// ⇒ **ההרחבה מכוונת ומצומצמת: `feedback_score` + `feedback_status` בלבד.**
// 🚫 ‏`payment_date` · `invoice_sent` · `feedback_notes` · `negative_feedback_reason` **נשארו
//    בחוץ** — לאף אחד מהם אין צרכן בלשונית-הלקוח, וההיגיון של ההערה המקורית עומד לגביהם
//    במלואו. 🚫 וגם `project_finance` (רווח קפוא / דמי-ביטול) **אינה מצורפת כאן**: היא
//    מגודרת ב'כספים' והרווח ירד מכרטיס-הלקוח בהחלטת-פרסונה (11/07) — יעדו מסך-הכספים ומ11.
//
// quotes(...) נושא בדיוק את מה ש-deriveQuoteAmount (src/lib/quotes.js, ה-SSOT) צורך;
// project.quotes יהיה null גם "אין הצעה" וגם "RLS חסם את 'הצעות מחיר'" — projectAmount
// (src/lib/customerProjects.js) מטפל בשני המקרים כ-null ולא 0.
export async function getCustomerProjects(customerId) {
  const { data, error } = await supabase
    .from('projects')
    .select(
      'project_id, event_name, final_event_date, project_status, customer_id, quote_id, ' +
        'cancelled_at, cancel_type, cancelled_by, cancel_reason, ' +
        'feedback_status, feedback_score, ' +
        'quotes(applied_customer_discount, manual_discount, vat_rate_snapshot, quote_services(qty, closing_unit_price))',
    )
    .eq('customer_id', customerId)
  if (error) throw toError(error, 'שגיאה בטעינת היסטוריית הפרויקטים.')
  return attachProjectChanges(data ?? [])
}

// 🆕 RC-6 (מ8 · צעד 4.2) — שינויי-התכולה של כל פרויקט, לעמודת "סכום".
//
// 🔴 **למה N קריאות ולא ג'וין אחד, ולמה זו "עבודה ולא תיקון" כפי שהחוב עצמו ניבא:**
// ‏`project_changes` היא **deny-all מוחלט** (‏RLS פעיל, אפס policies) — `.from('project_changes')`
// מחזירה `[]` **בלי שגיאה** לכל תפקיד כולל מנכ"ל, וצירוף PostgREST היה נותן בדיוק את
// השקר הזה. הנתיב היחיד הוא ה-RPC `list_project_changes(p_project_id)`, שהוא **פר-פרויקט**
// וממסך את שדות-הכסף למי שאין לו 'הצעות מחיר' (מסלול-§7.21 נשמר במסד, לא במסך).
// הקריאות יוצאות **במקביל** ו-N הוא מספר הפרויקטים של לקוח **אחד** (בודדים) — לא כל המערכת.
//
// ⚠️ **כשל בקריאה אחת אינו מפיל את הלשונית ואינו מתחזה ל"אין שינויים":** הפרויקט מקבל
// ‏`project_changes: null` = **לא ידוע**, ו-`projectAmount` מתרגם זאת ל-'—'. סכום-הצעה-בלבד
// היה נראה תקין לחלוטין וזו בדיוק הסכנה. ‏🔁 קריאת ה-RPC עצמה אינה משוכפלת כאן —
// ‏`getProjectChanges` של מודול 6 היא אתר-הקריאה היחיד במערכת (כלל 14).
async function attachProjectChanges(rows) {
  const results = await Promise.all(
    rows.map((row) => getProjectChanges(row.project_id).catch(() => null)),
  )
  return rows.map((row, index) => ({ ...row, project_changes: results[index] }))
}

// בתפזורת עבור רשימת-הלקוחות (CustomersPage) — עמודות מזעריות לחישוב "רדומים" (A3) ולממוצע-
// המשוב פר-לקוח, בלי N+1 קריאות. אותה מדיניות-קריאה כמו getCustomerProjects (SELECT בלבד,
// מגודר 'פרויקטים').
// 🆕 **הורחב ב-28/08/2026 (מ8 · צעד 4.2) בשני שדות בלבד** — `feedback_status`+`feedback_score`:
// עמודת-הכוכבים ומסנן-"טעון בירור" ברשימה נשענים על **אותה** `deriveCustomerMetrics` שהכרטיס
// קורא לה, ולכן הם צריכים בדיוק את אותם שני השדות. ‏🚫 שאר שדות-הכספים נשארו בחוץ (ר' ההערה
// המורחבת שמעל `getCustomerProjects`). 🚫 **ואין כאן קריאת שינויי-תכולה** — הרשימה אינה מציגה
// סכום פר-פרויקט, ו-N-קריאות-RPC על **כל** הפרויקטים במערכת היו מחיר בלי צרכן.
export async function listProjectsForCustomerMetrics() {
  const { data, error } = await supabase
    .from('projects')
    .select('customer_id, final_event_date, project_status, feedback_status, feedback_score')
  if (error) throw toError(error, 'שגיאה בטעינת נתוני הפרויקטים.')
  return data ?? []
}

// הפרמטר היחיד שמשטח-8 ולשונית-הלקוחות (A3) צריכים מ-params ואינו בין שלושת פרמטרי-מסך-
// ההצעות של getQuoteScreenParams (03_quotes/api.js) — לכן שאילתה נפרדת, לא הרחבת הקיימת
// (שם היא מוגדרת-במפורש לשלושת השדות של מסך-ההצעות, ולא בית חוקי לפרמטר של מודול 2/6).
export async function getCustomerScreenParams() {
  const { data, error } = await supabase
    .from('params')
    .select('param_name, param_value')
    .in('param_name', [DORMANT_THRESHOLD_PARAM_NAME])
  if (error) throw toError(error, 'שגיאה בטעינת הגדרות המסך.')
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
  assertRowsAffected(data, 'אין הרשאה לעדכן לקוח זה.')
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
  assertRowsAffected(data, 'אין הרשאה לשנות את סטטוס הלקוח.')
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

// שמירת קבוצת אנשי-הקשר הנוספים של לקוח = replace. הטופס עורך את כל הקבוצה כיחידה;
// ה-contact_id מתחדש בכל שמירה — מקובל כי אנשי-הקשר אינם מפתח-זר לשום דבר. שורות בלי שם
// מסוננות (שם = חובה ב-DB). מחזיר את השורות שנשמרו.
//
// 🐞 סדר-הפעולות תוקן 30/07/2026 (בהכרעת-ישי, אחרי שאותה חולשה בדיוק מחקה בפועל את 5
// מדרגות-המחיר של B-REG-TAG במודול 3): הגרסה הקודמת הייתה מחיקה-ואז-הכנסה, ושתי בקשות
// HTTP אינן טרנזקציה — סגירת-דפדפן/רענון בין המחיקה להכנסה משאירה את הלקוח **בלי אנשי-קשר
// בכלל**, בלי שגיאה. הסדר החדש: קריאת המזהים הישנים ← הכנסת החדשים ← מחיקת הישנים בלבד.
// קטיעה באמצע משאירה לכל היותר כפילות **גלויה** (ישן+חדש זה לצד זה) שנעלמת בשמירה הבאה —
// לעולם לא אובדן. ‏upsert (הפתרון של price_tiers) לא ישים כאן: המפתח היחיד הוא contact_id
// מתחולל, ואין לשורה מפתח טבעי לעגון בו.
export async function replaceCustomerContacts(customerId, contacts) {
  const { data: existing, error: listError } = await supabase
    .from('customer_contacts')
    .select('contact_id')
    .eq('customer_id', customerId)
  if (listError) throw toError(listError, 'שמירת אנשי הקשר נכשלה.')
  const oldIds = (existing ?? []).map((r) => r.contact_id)

  const rows = (contacts ?? [])
    .filter((c) => (c.contact_name ?? '').trim() !== '')
    .map((c) => ({
      customer_id: customerId,
      contact_name: c.contact_name.trim(),
      phone: (c.phone ?? '').trim() || null,
      email: (c.email ?? '').trim() || null,
    }))

  let saved = []
  if (rows.length > 0) {
    const { data, error } = await supabase.from('customer_contacts').insert(rows).select()
    if (error) throw toError(error, 'שמירת אנשי הקשר נכשלה.')
    saved = data ?? []
  }

  // מחיקת הישנים לפי המזהים שנקראו למעלה — לא לפי customer_id, שהיה מוחק גם את שזה-עתה הוכנסו.
  if (oldIds.length > 0) {
    const { error: delError } = await supabase
      .from('customer_contacts')
      .delete()
      .in('contact_id', oldIds)
    if (delError) throw toError(delError, 'שמירת אנשי הקשר נכשלה.')
  }

  return saved
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
