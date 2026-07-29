// שכבת ה-API של הכרטיסייה "מחירים" ב-/system (§7.84, מודול 3 — יושבת תחת 01_auth כי זהו
// מסך-מערכת, לא מסך-הצעות; ר' design-notes §1 "מיקום 01_auth ✓ עקבי עם מסכי-מערכת אחרים").
// כלל 14: כל גישת ה-Supabase של המסך הזה מרוכזת כאן. כתיבה = CEO בלבד; אין בדיקת-הרשאה
// מקדימה בקוד (רק canEdit ב-UI כנוחות) — הקיר האמיתי הוא ה-RLS (§7.83), בדיוק כמו מודול 2.

import { supabase } from '@/supabaseClient'

function toError(error, fallbackMessage) {
  const e = new Error(fallbackMessage)
  e.code = error?.code
  e.cause = error
  return e
}

// ---- מוצרים ----

export async function listProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('category')
    .order('item_name')
  if (error) throw toError(error, 'שגיאה בטעינת קטלוג המוצרים.')
  return data ?? []
}

// יצירת מוצר. sku הוא מפתח-טבעי (§7.64) — הפרת-ייחודיות מגיעה כ-23505, כמו company_number
// במודול 2; ה-UI מתרגם לשגיאה ידידותית ("מק"ט כבר קיים"), לא כאן.
export async function createProduct(product) {
  const { data, error } = await supabase.from('products').insert(product).select().single()
  if (error) throw toError(error, 'יצירת המוצר נכשלה.')
  return data
}

// עדכון מוצר קיים. sku אינו ניתן לעריכה (מפתח-טבעי, §7.64 ON UPDATE CASCADE קיים ברמת ה-DB
// למי שכן משנה אותו בכלים אחרים — אבל לא דרך המסך) ו-status עובר **רק** דרך setProductStatus
// (אותה מוסכמת-ארכיון כמו setCustomerStatus), כך ששני השדות מוסרים הגנתית מה-patch.
export async function updateProduct(sku, patch) {
  const safePatch = { ...patch }
  delete safePatch.sku
  delete safePatch.status
  const { data, error } = await supabase.from('products').update(safePatch).eq('sku', sku).select()
  if (error) throw toError(error, 'שמירת השינויים במוצר נכשלה.')
  if (!data || data.length === 0) throw toError({ code: 'RLS_DENIED' }, 'אין הרשאה לעדכן מוצר זה.')
  return data[0]
}

export async function setProductStatus(sku, status) {
  const { data, error } = await supabase.from('products').update({ status }).eq('sku', sku).select()
  if (error) throw toError(error, 'שינוי סטטוס המוצר נכשל.')
  if (!data || data.length === 0)
    throw toError({ code: 'RLS_DENIED' }, 'אין הרשאה לשנות את סטטוס המוצר.')
  return data[0]
}

// ---- מדרגות-מחיר ----

export async function listPriceTiers(sku) {
  const { data, error } = await supabase
    .from('price_tiers')
    .select('*')
    .eq('sku', sku)
    .order('min_qty')
  if (error) throw toError(error, 'שגיאה בטעינת מדרגות המחיר.')
  return data ?? []
}

// שמירת קבוצת-המדרגות של מק"ט = מחיקה-מלאה+הכנסה-מחדש, כמו replaceCustomerContacts
// במודול 2 — הטופס עורך את כל הקבוצה כיחידה, וזה פשוט ואמין יותר מ-diff לרשימה קטנה.
export async function replacePriceTiers(sku, tiers) {
  const { error: delError } = await supabase.from('price_tiers').delete().eq('sku', sku)
  if (delError) throw toError(delError, 'שמירת מדרגות המחיר נכשלה.')
  const rows = (tiers ?? []).map((t) => ({
    sku,
    min_qty: t.min_qty,
    max_qty: t.max_qty ?? null,
    special_price: t.special_price,
  }))
  if (rows.length === 0) return []
  const { data, error } = await supabase.from('price_tiers').insert(rows).select()
  if (error) throw toError(error, 'שמירת מדרגות המחיר נכשלה.')
  return data ?? []
}

// ---- פרמטרי-תמחור (2 בלבד — לא כל params; ר' src/lib/pricing.js PRICING_PARAM_NAMES) ----

export async function getPricingParams() {
  const { data, error } = await supabase
    .from('params')
    .select('param_id, param_name, param_value')
    .in('param_name', ['אחוז_מעמ', 'יחס_אורחים_לדיילת'])
  if (error) throw toError(error, 'שגיאה בטעינת פרמטרי התמחור.')
  return data ?? []
}

// ✅ upsert פשוט ובטוח (בניגוד להערת-הזהירות ב-design-notes §3): params_param_name_key
// נחתה במיגרציה 20260723111005 (§7.40ב) — הטיפול ההגנתי המורכב שהוצע שם (0/1/>1 שורות)
// כבר מיותר. onConflict מפורש כי אין UNIQUE-קונפליקט אחר על הטבלה שיכול לבלבל את ה-upsert.
// ⚠️ לא שולח param_type: תקין רק כי שני הפרמטרים האלה תמיד קיימים מה-Seed (מיגרציה 2, נעולה,
// לא ניתנים למחיקה מהמסך הזה) — כלומר ה-upsert תמיד פוגע ב-UPDATE, לא ב-INSERT. אם אי-פעם
// תיפתח מחיקת-פרמטרים מהמסך, יש להוסיף param_type כאן (NOT NULL, בלי ברירת-מחדל ב-DB).
export async function upsertPricingParam(paramName, value) {
  const { data, error } = await supabase
    .from('params')
    .upsert({ param_name: paramName, param_value: String(value) }, { onConflict: 'param_name' })
    .select()
    .single()
  if (error) throw toError(error, 'שמירת הפרמטר נכשלה.')
  return data
}
