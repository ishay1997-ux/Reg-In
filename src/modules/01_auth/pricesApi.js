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

// שמירת קבוצת-המדרגות של מק"ט כיחידה — **upsert ואז מחיקת-הנגרעות, ולא מחיקה-ואז-הכנסה.**
//
// 🐞 הסדר תוקן 30/07/2026 אחרי אובדן-נתונים אמיתי: בגרסת מחיקה-ואז-הכנסה (התבנית של
// replaceCustomerContacts במודול 2), סגירת-דפדפן בין שתי הבקשות מחקה בפועל את כל 5 מדרגות
// B-REG-TAG מהמסד החי — המחיקה הגיעה לשרת, ההכנסה כבר לא (קרה באימות-E2E; שוחזר מה-Seed).
// שתי בקשות HTTP נפרדות אינן טרנזקציה, והסדר קובע מה קורה בקטיעה:
//   מחיקה-ואז-הכנסה ⇒ הקטלוג נעלם. ‏upsert-ואז-מחיקה ⇒ לכל היותר נשארת מדרגה ישנה מיותרת,
//   שנראית במסך וניתנת למחיקה בלחיצה. אותו מספר בקשות, כשל שקט הרבה פחות הרסני.
// ⚠️ אותה חולשה קיימת עדיין ב-replaceCustomerContacts (מודול 2, מוזג) — נרשמה לסקירת 3.7,
// לא תוקנה כאן כי היא מחוץ למשטח הצעד (shared-surface של מודול סגור).
export async function replacePriceTiers(sku, tiers) {
  const rows = (tiers ?? []).map((t) => ({
    sku,
    min_qty: t.min_qty,
    max_qty: t.max_qty ?? null,
    special_price: t.special_price,
  }))

  let saved = []
  if (rows.length > 0) {
    // onConflict על ה-PK המשולב (sku, min_qty): שורה קיימת מתעדכנת, חדשה נוצרת.
    const { data, error } = await supabase
      .from('price_tiers')
      .upsert(rows, { onConflict: 'sku,min_qty' })
      .select()
    if (error) throw toError(error, 'שמירת מדרגות המחיר נכשלה.')
    saved = data ?? []
    // כתיבה שנחסמה ע"י RLS חוזרת כ-0 שורות עם error: null — הכשל השקט המרכזי של הפרויקט.
    if (saved.length === 0) throw toError({ code: 'RLS_DENIED' }, 'אין הרשאה לשמור מדרגות מחיר.')
  }

  // מחיקת המדרגות שהוסרו בטופס — אחרי שהחדשות כבר בפנים. min_qty עובר Number() בשכבת
  // הדיאלוג, כך שהשרשור לרשימת in בטוח (מספרים בלבד, לא קלט-טקסט גולמי).
  let deleteQuery = supabase.from('price_tiers').delete().eq('sku', sku)
  if (rows.length > 0) {
    deleteQuery = deleteQuery.not('min_qty', 'in', `(${rows.map((r) => r.min_qty).join(',')})`)
  }
  const { error: delError } = await deleteQuery
  if (delError) throw toError(delError, 'שמירת מדרגות המחיר נכשלה.')

  return saved
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

// 🐞 תוקן 30/07/2026 (צעד 3.6) — **ה-upsert שהיה כאן לא יכול היה לעבוד לעולם**, ונתפס רק
// בשמירה אמיתית מהמסך: `23502 — null value in column "param_type"`.
// **הטעות המושגית שהוחלפה:** ההערה הקודמת הניחה ש"שתי השורות תמיד קיימות ⇒ ה-upsert תמיד
// פוגע ב-UPDATE ⇒ מותר לא לשלוח param_type". ‏Postgres לא עובד כך: ב-`INSERT … ON CONFLICT`
// הוא **בונה קודם את שורת-המועמד** ומאמת עליה NOT NULL, ורק אחר-כך מגלה את הקונפליקט.
// שורה קיימת אינה מצילה — האילוץ נבדק לפני.
//
// עדכון-בלבד, ולא "לתקן" ע"י הוספת param_type: זהו מסך-תחזוקה לשני פרמטרים זרועים (§7.84;
// מסך-הפרמטרים המלא הוא מודול 9). בלי מסלול-INSERT, שם-פרמטר שגוי נכשל בקול (0 שורות)
// במקום ליצור בשקט שורת-params רפאים שאיש לא יחפש.
export async function updatePricingParam(paramName, value) {
  const { data, error } = await supabase
    .from('params')
    .update({ param_value: String(value) })
    .eq('param_name', paramName)
    .select()
  if (error) throw toError(error, 'שמירת הפרמטר נכשלה.')
  // 0 שורות = או שהפרמטר לא קיים, או שה-RLS חסם (מחזיר ריק עם error: null — הכשל השקט
  // המרכזי של הפרויקט). שתי האפשרויות חייבות להישמע, לא להיראות כהצלחה.
  if (!data || data.length === 0)
    throw toError({ code: 'RLS_DENIED' }, `הפרמטר ${paramName} לא עודכן — ייתכן שאין לך הרשאה.`)
  return data[0]
}
