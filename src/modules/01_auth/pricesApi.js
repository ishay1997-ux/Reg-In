// שכבת ה-API של הכרטיסייה "מחירים" ב-/system (§7.84, מודול 3 — יושבת תחת 01_auth כי זהו
// מסך-מערכת, לא מסך-הצעות; ר' design-notes §1 "מיקום 01_auth ✓ עקבי עם מסכי-מערכת אחרים").
// כלל 14: כל גישת ה-Supabase של המסך הזה מרוכזת כאן. כתיבה = CEO בלבד; אין בדיקת-הרשאה
// מקדימה בקוד (רק canEdit ב-UI כנוחות) — הקיר האמיתי הוא ה-RLS (§7.83), בדיוק כמו מודול 2.

import { supabase } from '@/supabaseClient'
import { flattenProductCost } from '@/lib/catalog'
import { toError, assertRowsAffected } from '@/lib/apiError'

// ---- מוצרים ----

// ⚠️ **העלות אינה עמודה של `products` יותר** (§7.83↳, סבב G 31/07/2026) — היא בטבלת-הבת
// `product_costs`, כדי שהרשאת-הקריאה תהיה ברמת-טבלה (מנהלת גיוס/לוגיסטיקה רואות את הקטלוג
// אך לא את המרווח). המסך הזה ממשיך לעבוד עם `product.cost` שטוח; הצירוף והשיטוח כאן.
// הצירוף **LEFT במכוון** — מוצר בלי שורת-עלות נשאר ברשימה, אחרת הוא נעלם ממסך-המחירים
// דווקא כשצריך לתקן אותו.
export async function listProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_costs(cost)')
    .order('category')
    .order('item_name')
  if (error) throw toError(error, 'שגיאה בטעינת קטלוג המוצרים.')
  return (data ?? []).map(flattenProductCost)
}

// יצירת מוצר. sku הוא מפתח-טבעי (§7.64) — הפרת-ייחודיות מגיעה כ-23505, כמו company_number
// במודול 2; ה-UI מתרגם לשגיאה ידידותית ("מק"ט כבר קיים"), לא כאן.
//
// ⚠️ **שתי כתיבות, ולא טרנזקציה** (סבב G): המוצר נכתב ל-`products` והעלות ל-`product_costs`.
// הסדר אינו שרירותי — ה-FK מחייב שהמוצר יהיה קיים קודם. **כשל בכתיבה השנייה נאמר בקול**
// ואינו נבלע: מוצר בלי שורת-עלות **חוסם יצירת הצעה שכוללת אותו** (ה-RPC זורק "לא מוגדרת
// עלות למוצר"), ולכן "נשמר בהצלחה" חלקי כאן היה מייצר תקלה במקום אחר לגמרי.
// *(לא נבנה RPC אטומי: זהו מסך-תחזוקה שהמנכ"ל פותח לפי הערכתו פעם בחצי שנה — §7.84 —
// והנזק מכשל-חצי הוא שורה חסרה שהמסך מציג כ"—" וניתן לתקן בעריכה.)*
export async function createProduct(product) {
  const { cost, ...productRow } = product
  const { data, error } = await supabase.from('products').insert(productRow).select().single()
  if (error) throw toError(error, 'יצירת המוצר נכשלה.')

  const { error: costError } = await supabase
    .from('product_costs')
    .insert({ sku: data.sku, cost: Number(cost) })
  if (costError)
    throw toError(costError, 'המוצר נוצר אך שמירת העלות נכשלה — יש לפתוח אותו לעריכה ולשמור שוב.')

  return { ...data, cost: Number(cost) }
}

// עדכון מוצר קיים. sku אינו ניתן לעריכה (מפתח-טבעי, §7.64 ON UPDATE CASCADE קיים ברמת ה-DB
// למי שכן משנה אותו בכלים אחרים — אבל לא דרך המסך) ו-status עובר **רק** דרך setProductStatus
// (אותה מוסכמת-ארכיון כמו setCustomerStatus), כך ששני השדות מוסרים הגנתית מה-patch.
// ⚠️ ו-`cost` מוסר גם הוא — הוא כבר אינו עמודה של `products`, ומפתח תועה היה מפיק שגיאת
// PostgREST גולמית ("column not found") במקום ההודעה הידידותית שלמטה.
export async function updateProduct(sku, patch) {
  const safePatch = { ...patch }
  delete safePatch.sku
  delete safePatch.status
  delete safePatch.cost
  const { data, error } = await supabase.from('products').update(safePatch).eq('sku', sku).select()
  if (error) throw toError(error, 'שמירת השינויים במוצר נכשלה.')
  assertRowsAffected(data, 'אין הרשאה לעדכן מוצר זה.')

  // upsert ולא update: מוצר שנוצר לפני סבב G, או שכתיבת-העלות שלו נכשלה, אין לו שורה כלל —
  // ו-update היה מחזיר 0 שורות ונקרא בטעות "אין הרשאה".
  if (patch.cost !== undefined) {
    const { data: costData, error: costError } = await supabase
      .from('product_costs')
      .upsert({ sku, cost: Number(patch.cost) }, { onConflict: 'sku' })
      .select()
    if (costError) throw toError(costError, 'שמירת עלות המוצר נכשלה.')
    assertRowsAffected(costData, 'אין הרשאה לעדכן את עלות המוצר.')
  }

  return { ...data[0], cost: patch.cost !== undefined ? Number(patch.cost) : undefined }
}

export async function setProductStatus(sku, status) {
  const { data, error } = await supabase.from('products').update({ status }).eq('sku', sku).select()
  if (error) throw toError(error, 'שינוי סטטוס המוצר נכשל.')
  assertRowsAffected(data, 'אין הרשאה לשנות את סטטוס המוצר.')
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
// ✅ אותה חולשה **תוקנה גם ב-replaceCustomerContacts** (מודול 2) באותו יום — בצורה אחרת,
// כי הפתרון כאן לא ישים שם: ל-price_tiers יש מפתח טבעי משולב (sku, min_qty) שאפשר לעשות
// עליו upsert, ולאיש-קשר יש רק contact_id מתחולל. לכן שם הסדר הוא קריאת-המזהים-הישנים ←
// הכנסה ← מחיקת-הישנים-בלבד. ר' src/modules/02_customers/api.js.
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
    // כתיבה שנחסמה ע"י RLS חוזרת כ-0 שורות עם error: null — הכשל השקט המרכזי של הפרויקט.
    saved = assertRowsAffected(data, 'אין הרשאה לשמור מדרגות מחיר.')
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

// ---- פרמטרי-התמחור אינם כאן יותר (02/09/2026, מודול 9 צעד 3.1, Q-1) ----
// `getPricingParams` / `updatePricingParam` נמחקו יחד עם `PricingParamsCard`: שני הפרמטרים
// נערכים מעכשיו בלשונית "פרמטרים" דרך `09_settings/api.js` (`listParams`/`updateParams`), שמכבדת
// גם את מדיניות-הבעלות החדשה (`owner_role_id`) שמיגרציה A הוסיפה — דבר שעדכון-השורה שהיה כאן
// לא ידע עליו. ⚠️ **הלקח שהיה כתוב כאן לא אבד** — "לעולם לא `upsert` על `params`, כי
// `param_type` הוא NOT NULL ו-`INSERT … ON CONFLICT` מאמת אותו **לפני** שהוא מגלה את
// הקונפליקט" — הועתק לכותרת `09_settings/api.js` ול-`09_settings/CLAUDE.md`.
