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

function toError(error, fallbackMessage) {
  const e = new Error(fallbackMessage)
  e.code = error?.code
  e.cause = error
  return e
}

// ---- קריאות (Reads) ----

// כל ההצעות + שורותיהן, מהחדש-שעודכן קודם. מיון לפי updated_at תואם לאינדקס C-6
// quotes(quote_status, updated_at) שה-DB בנה במקור עבור שאילתת-התפוגה, וגם משרת את
// מסך-הניהול (F24: תגית "פג בקרוב" ממוינת לפי קרבה — מסונן/ממוין מחדש בצד-לקוח שם).
/** @public צרכן: מסך-הניהול (צעד 3.3). להסיר את התג ברגע שהוא מייבא. */
export async function listQuotes() {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_services(*)')
    .order('updated_at', { ascending: false })
  if (error) throw toError(error, 'שגיאה בטעינת רשימת ההצעות.')
  return data ?? []
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

// היסטוריית כל ההצעות של לקוח נתון (חדש-לישן) — כרטיס-הלקוח (§6 מ3, step 3.5).
/** @public צרכן: כרטיס-הלקוח (צעד 3.5). להסיר את התג ברגע שהוא מייבא. */
export async function listQuotesByCustomer(customerId) {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_services(*)')
    .eq('customer_id', customerId)
    .order('issue_date', { ascending: false })
  if (error) throw toError(error, 'שגיאה בטעינת היסטוריית ההצעות של הלקוח.')
  return data ?? []
}

// קטלוג-התמחור לבניית הצעה: מוצרים **פעילים בלבד** (§7.34), כל מדרגות-המחיר, ו-2 פרמטרי-
// התמחור (מע"מ + יחס-אורחים-לדיילת — לא כל params, בדומה ל-pricesApi). מבוצע ב-Promise.all
// כי שלוש השאילתות בלתי-תלויות זו בזו.
export async function getPricingCatalog() {
  const [productsRes, tiersRes, paramsRes] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('category')
      .order('item_name'),
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
  if (error) throw toError(error, 'שמירת ההצעה נכשלה.')
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
  if (error) throw toError(error, 'עדכון ההצעה נכשל.')
}

// אישור הצעה → הפיכתה לפרויקט שלם (§7.49, SECURITY DEFINER). ה-RPC בעצמו בודק הרשאת-עריכה,
// חוסם תאריך-עבר (§7.32), מקפיא מע"מ+עלות, והוא בטוח-להקשה-כפולה (project.quote_id UNIQUE).
// מחזיר את project_id החדש.
/** @public צרכן: חלון-האישור במסך-הניהול (צעד 3.3). להסיר את התג ברגע שהוא מייבא. */
export async function approveQuote(quoteId) {
  const { data, error } = await supabase.rpc('approve_quote_and_create_project', {
    p_quote_id: quoteId,
  })
  if (error) throw toError(error, 'אישור ההצעה נכשל.')
  return data
}

// דחיית הצעה — עדכון ישיר (לא RPC): טריגר-הנעילה מתיר UPDATE כל עוד ה-status **הישן** הוא
// in_progress, וזה בדיוק המצב היחיד שממנו מותר לדחות (CHECK quotes_rejected_iff_reason
// אוכף reason⇔status; 'אחר' דורש rejection_notes — נאכף גם ב-DB, כאן רק מעביר את מה שהתקבל).
// .select() חושף חסימת-RLS שקטה, בדיוק כמו updateCustomer ב-02_customers/api.js.
/** @public צרכן: חלון-הדחייה במסך-הניהול (צעד 3.3). להסיר את התג ברגע שהוא מייבא. */
export async function rejectQuote(quoteId, reason, notes) {
  const { data, error } = await supabase
    .from('quotes')
    .update({ quote_status: 'rejected', rejection_reason: reason, rejection_notes: notes ?? null })
    .eq('quote_id', quoteId)
    .select()
  if (error) throw toError(error, 'דחיית ההצעה נכשלה.')
  if (!data || data.length === 0) throw toError({ code: 'RLS_DENIED' }, 'אין הרשאה לדחות הצעה זו.')
  return data[0]
}
