// שכבת ה-API של מודול 3 (הצעות מחיר) — כלל 14: כל גישת ה-Supabase של המודול מרוכזת כאן.
// קומפוננטות ה-UI (Phase 3) מייבאות רק את הפונקציות האלה ולעולם לא קוראות ל-supabase.from(...)
// בעצמן. לוגיקת-הכסף (מדרגות/סכומים) חיה ב-src/lib/pricing.js — כאן רק קלט/פלט מול ה-DB;
// חישוב-מחדש של סכומים כאן היה שובר את מקור-האמת היחיד (F26).
//
// יצירה ועריכה **תמיד** עוברות דרך פונקציות-השרת create_quote/replace_quote_lines (F17) —
// לעולם לא .insert()/.update() ישיר על quotes/quote_services. why-first: הפונקציות האלה
// כותבות כותרת+שורות כטרנזקציה אחת (אין הצעה חצי-שמורה), ומספרות את השורות בעצמן
// (line_number) — קוד-לקוח שמנחש מספור עלול להתנגש. ר' migration 20260723115000.

import { supabase } from '@/supabaseClient'
import { PRICING_PARAM_NAMES } from '@/lib/pricing'
import { QUOTE_SCREEN_PARAM_NAMES, quoteServerErrorMessage } from '@/lib/quotes'

function toError(error, fallbackMessage) {
  const e = new Error(fallbackMessage)
  e.code = error?.code
  e.cause = error
  return e
}

// כתיבות בלבד: ההודעה המדויקת של המסד גוברת על ה-fallback הכללי כשהיא מוכרת (סבב D).
// למה רק בכתיבות: מסלולי-הכשל של המסד (נעילה/סטטוס/תאריך/מע"מ/הרשאה) נולדים ב-RPCs
// ובטריגר-הנעילה, ורק הם נושאים הודעה שאומרת למשתמשת מה לעשות. שגיאת-קריאה היא כמעט
// תמיד רשת/RLS — שם למחרוזת-המסד אין ערך למשתמשת, וה-fallback הקיים מדויק יותר.
// ⚠️ ‏`quoteServerErrorMessage` מחזירה null לשגיאה לא-מוכרת ⇒ ה-fallback נשמר כלשונו.
function toWriteError(error, fallbackMessage) {
  return toError(error, quoteServerErrorMessage(error) ?? fallbackMessage)
}

// ---- קריאות (Reads) ----

// כל ההצעות + שורותיהן, מהחדש-שעודכן קודם. מיון לפי updated_at תואם לאינדקס C-6
// quotes(quote_status, updated_at) שה-DB בנה במקור עבור שאילתת-התפוגה, וגם משרת את
// מסך-הניהול (F24: תגית "פג בקרוב" ממוינת לפי קרבה — מסונן/ממוין מחדש בצד-לקוח שם).
//
// הצירוף ל-customers הוא **חלק מהמסך ולא נוחות**: כל שורה בטבלה מציגה את שם החברה ואת
// איש-הקשר הראשי (§6 מ3 — הראשי בלבד, אנשי-הקשר הנוספים של §7.81 אינם מוצגים כאן).
// טעינה נפרדת של הלקוחות הייתה מחייבת מיזוג-ידני בצד-הלקוח ומייצרת מצב-ביניים שבו
// הטבלה מציגה שורות בלי שמות.
export async function listQuotes() {
  const { data, error } = await supabase
    .from('quotes')
    .select(
      '*, quote_services(*), customers(customer_id, company_name, company_number, contact_name, phone, email)',
    )
    .order('updated_at', { ascending: false })
    // 🐞 שובר-שוויון חובה (נוסף 30/07/2026, צעד 3.5 — באג חי שהתגלה בתכנון).
    // ‏`updated_at` לבדו **אינו מפתח-מיון יציב**: אומת במסד שכבר יש שתי הצעות עם חותמת זהה
    // לחלוטין (`2026-07-29 16:18:08.682902+00`), ו-Postgres אינו מבטיח סדר בתוך שוויון — כלומר
    // השורות מחליפות מקום בין רענונים בלי סיבה נראית. ⚠️ זה מחמיר מבנית: עבודת-התפוגה היומית
    // (pg_cron, §7.42) מעדכנת הרבה הצעות **בטרנזקציה אחת**, וכל שורה בטרנזקציה מקבלת את אותו
    // `now()` בדיוק — כלומר ריצה אחת מייצרת גוש שלם של חותמות זהות.
    // ⚠️ שום בדיקה אוטומטית לא תופסת את זה: ריצה בודדת רואה סדר כלשהו ועוברת.
    .order('quote_id', { ascending: false })
  if (error) throw toError(error, 'שגיאה בטעינת רשימת ההצעות.')
  return data ?? []
}

// שלושת הפרמטרים שמסך-הניהול צריך: מע"מ (לחישוב הסכומים), ימי-תוקף (ל"פג בעוד N יום")
// וחלון-אזהרת-האירוע (למסנן "אירועים קרובים"). נטענים יחד כי המסך חסר-משמעות בלי שלושתם.
// ⚠️ פרמטר שלא חוזר אינו מקבל ברירת-מחדל כאן — המסך מציג "—" במקום מספר מומצא.
export async function getQuoteScreenParams() {
  const { data, error } = await supabase
    .from('params')
    .select('param_name, param_value')
    .in('param_name', Object.values(QUOTE_SCREEN_PARAM_NAMES))
  if (error) throw toError(error, 'שגיאה בטעינת הגדרות ההצעות.')
  return data ?? []
}

// השליחה המוצלחת האחרונה של ישות נתונה, מ-`email_log` (מיגרציה 20260730095439).
// **זהו מקור-האמת היחיד ל"האם כבר נשלח"** — ההגנות שבחלון חיות ב-state של הקומפוננטה
// ולכן מתאפסות ברענון-דף או אצל משתמש שני; רק שאילתה כאן שורדת את שניהם.
// מסונן ל-'sent' בכוונה: ניסיון שנכשל אינו "נשלח", והצגתו כאילו נשלח הייתה מונעת מהמשתמש
// לשלוח מייל שהלקוח מעולם לא קיבל. ‏null = אין שליחה מוצלחת (או שה-RLS חוסם קריאה).
// ⚠️ הטבלה גנרית (entity_type/entity_id) — מודולים 4/8/11 יקראו אותה באותה צורה.
export async function getLastSuccessfulSend(entityType, entityId) {
  const { data, error } = await supabase
    .from('email_log')
    .select('recipient, subject, created_at')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('status', 'sent')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת היסטוריית השליחות.')
  return data ?? null
}

// הצעה בודדת + כל שורותיה, לצורך עריכה/צפייה/PDF. null אם אין שורה נגישה (לא-קיימת או RLS).
export async function getQuote(quoteId) {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_services(*)')
    .eq('quote_id', quoteId)
    .maybeSingle()
  if (error) throw toError(error, 'שגיאה בטעינת פרטי ההצעה.')
  return data ?? null
}

// היסטוריית כל ההצעות של לקוח נתון (חדש-לישן) — עמוד-הלקוח (§6 מ3, צעד 3.5).
export async function listQuotesByCustomer(customerId) {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_services(*)')
    .eq('customer_id', customerId)
    // ⚠️ `issue_date` הוא **תאריך ולא חותמת**, ולכן שוויון כאן הוא המצב הרגיל ולא מקרה-קצה:
    // כל 10 הצעות-הדמו נושאות `2026-07-29`. בלי שובר-השוויון הסדר אקראי לחלוטין.
    // `quote_id` יורד = "באותו יום, החדשה שנוצרה קודם" — טוטאלי, ולכן תמיד דטרמיניסטי.
    .order('issue_date', { ascending: false })
    .order('quote_id', { ascending: false })
  if (error) throw toError(error, 'שגיאה בטעינת היסטוריית ההצעות של הלקוח.')
  return data ?? []
}

// אילו הצעות מתוך רשימה כבר נשלחו ללקוח — **שאילתה אחת** לכל העמוד (צעד 3.5).
// ⚠️ במכוון לא `getLastSuccessfulSend` פר-שורה: על לקוח עם 30 הצעות זה 30 שאילתות (N+1).
// מחזיר Set של entity_id, כי המסך שואל שאלה בוליאנית ("נשלחה?") ולא מציג תאריך —
// הכרעת-ישי 30/07 (LOCAL-16): תאריך-השליחה כמעט תמיד זהה לתאריך-ההצעה ולכן הוא רעש.
// ⚠️ מסונן ל-'sent': ניסיון שנכשל אינו שליחה, והצגתו ככזו תמנע מהמשתמש לשלוח מייל
// שהלקוח מעולם לא קיבל.
export async function getSentQuoteIds(quoteIds) {
  if (!quoteIds?.length) return new Set()
  const { data, error } = await supabase
    .from('email_log')
    .select('entity_id')
    .eq('entity_type', 'quote')
    .eq('status', 'sent')
    .in('entity_id', quoteIds)
  if (error) throw toError(error, 'שגיאה בטעינת היסטוריית השליחות.')
  return new Set((data ?? []).map((row) => row.entity_id))
}

// קטלוג-התמחור לבניית הצעה: **כל** המוצרים, כל מדרגות-המחיר, ו-2 פרמטרי-התמחור
// (מע"מ + יחס-אורחים-לדיילת — לא כל params, בדומה ל-pricesApi). מבוצע ב-Promise.all
// כי שלוש השאילתות בלתי-תלויות זו בזו.
//
// ⚠️ **עד 31/07/2026 היה כאן `.eq('status','active')` — והוא נשבר בשקט על הצעה קיימת**
// (סבב-תיקונים D): מוצר שהמנכ"ל השבית **אחרי** שכבר נכנס להצעה פשוט נעלם מהקטלוג, ואז
// (א) השורה איבדה `category` ⇒ `sumHostessQty` החזירה 0 ⇒ השמירה נחסמה ב"הצעה חייבת
// לכלול לפחות שורת דיילות אחת" **בזמן ששורת-דיילות מוצגת על המסך**, ו-(ב) נגיעה בכמות
// תמחרה מחדש ל-**0 ₪ ונשמרה כך**. §7.34 **לא נחלש**: הסינון עבר לשכבת-בורר-המוצרים
// (`QuoteLineEditor`), שם הוא נשאר "מוצר מושבת אינו אופציה להצעה חדשה" — ההכרעה מ-12/07 —
// ואילו שורה קיימת מסומנת ונשמרת (הכרעת-ישי 31/07, תקן Salesforce CPQ).
// ⛔ החזרת הסינון לכאן מחזירה את שני הכשלים במלואם.
// ℹ️ סבב G עתיד לגעת באותה שאילתה (פיצול `products.cost` לטבלת-בת, הכרעת-ישי 31/07) —
// ה-`select('*')` כאן יצטרך אז צירוף מפורש לעמודת-העלות.
export async function getPricingCatalog() {
  const [productsRes, tiersRes, paramsRes] = await Promise.all([
    supabase.from('products').select('*').order('category').order('item_name'),
    supabase.from('price_tiers').select('*'),
    supabase
      .from('params')
      .select('param_name, param_value')
      .in('param_name', Object.values(PRICING_PARAM_NAMES)),
  ])
  if (productsRes.error) throw toError(productsRes.error, 'שגיאה בטעינת קטלוג המוצרים.')
  if (tiersRes.error) throw toError(tiersRes.error, 'שגיאה בטעינת מדרגות המחיר.')
  if (paramsRes.error) throw toError(paramsRes.error, 'שגיאה בטעינת פרמטרי התמחור.')
  return {
    products: productsRes.data ?? [],
    tiers: tiersRes.data ?? [],
    params: paramsRes.data ?? [],
  }
}

// ---- כתיבות (Writes) ----

// יצירת הצעה חדשה (סטטוס in_progress) דרך ה-RPC האטומי — כותרת+שורות בטרנזקציה אחת (F17).
// header: {customer_id, event_name, recommended_hostess_count, estimated_guests,
//          estimated_event_date, estimated_location, estimated_start_time, estimated_end_time,
//          applied_customer_discount, manual_discount, notes}
// lines: [{sku, qty, closing_unit_price, color, notes}] — line_number/closing_unit_cost
// נקבעים בשרת (ordinality + products.cost), הלקוח לא שולח אותם.
// מחזיר את quote_id החדש.
export async function createQuote(header, lines) {
  const { data, error } = await supabase.rpc('create_quote', {
    p_header: header,
    p_lines: lines,
  })
  if (error) throw toWriteError(error, 'שמירת ההצעה נכשלה.')
  return data
}

// עריכת הצעה קיימת — אותה צורת header/lines כמו createQuote. ה-RPC מוודא בעצמו שההצעה
// עדיין in_progress (אחרת P0001 — טריגר-הנעילה §7.50) ומחליף את כל השורות אטומית (מחיקה+הכנסה,
// F17), כך שאין מצב-ביניים של הצעה עם שורות חלקיות.
export async function saveQuoteEdit(quoteId, header, lines) {
  const { error } = await supabase.rpc('replace_quote_lines', {
    p_quote_id: quoteId,
    p_header: header,
    p_lines: lines,
  })
  if (error) throw toWriteError(error, 'עדכון ההצעה נכשל.')
}

// אישור הצעה → הפיכתה לפרויקט שלם (§7.49, SECURITY DEFINER). ה-RPC בעצמו בודק הרשאת-עריכה,
// חוסם תאריך-עבר (§7.32), מקפיא מע"מ+עלות, והוא בטוח-להקשה-כפולה (project.quote_id UNIQUE).
// מחזיר את project_id החדש.
export async function approveQuote(quoteId) {
  const { data, error } = await supabase.rpc('approve_quote_and_create_project', {
    p_quote_id: quoteId,
  })
  if (error) throw toWriteError(error, 'אישור ההצעה נכשל.')
  return data
}

// דחיית הצעה — עדכון ישיר (לא RPC): טריגר-הנעילה מתיר UPDATE כל עוד ה-status **הישן** הוא
// in_progress, וזה בדיוק המצב היחיד שממנו מותר לדחות (CHECK quotes_rejected_iff_reason
// אוכף reason⇔status; 'אחר' דורש rejection_notes — נאכף גם ב-DB, כאן רק מעביר את מה שהתקבל).
// .select() חושף חסימת-RLS שקטה, בדיוק כמו updateCustomer ב-02_customers/api.js.
export async function rejectQuote(quoteId, reason, notes) {
  const { data, error } = await supabase
    .from('quotes')
    .update({ quote_status: 'rejected', rejection_reason: reason, rejection_notes: notes ?? null })
    .eq('quote_id', quoteId)
    .select()
  if (error) throw toWriteError(error, 'דחיית ההצעה נכשלה.')
  if (!data || data.length === 0) throw toError({ code: 'RLS_DENIED' }, 'אין הרשאה לדחות הצעה זו.')
  return data[0]
}
