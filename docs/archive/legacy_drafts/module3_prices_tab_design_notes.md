<div dir="rtl">

# חומר-רקע: עיצוב מסך "מחירים" (ניהול-מערכת) — מודול 3

> **מעמד המסמך:** קלט-רקע לבלופרינט הרשמי של מודול 3 (טמפלט-הבלופרינט `.claude/skills/module-blueprint/template.md`, מופעל ע"י הסקיל `module-blueprint`) — **לא** תוכן מאושר-לביצוע. ההחלטה *לבנות* את המסך סגורה (§7.84 ב-`PROJECT_MASTER.md`); העיצוב *הטכני* למטה עדיין צריך לעבור את ה-DB Design Challenge וה-🎤 PM Interview הרשמיים של הבלופרינט לפני שנכתב קוד. הופק ע"י סוכן-תכנון עצמאי (14/07/2026) שקרא ישירות את הקוד הקיים (`src/App.jsx`, `SystemManagementPage.jsx`, `UsersManagementPage.jsx`, `PermissionsMatrixPage.jsx`, מודול 2 המלא, `docs/schema.sql`, `docs/db_roadmap.md`, `docs/PROJECT_MASTER.md`, `products_and_params.md`).

## היקף

טאב נפרד "מחירים" ב-`/system`, בנוסף לטאב "פרמטרים" הקיים (placeholder, ימתין למודול 9). מכסה: קטלוג-מוצרים (`products`) + מדרגות-מחיר (`price_tiers`) + **שני** פרמטרי-התמחור בלבד (`אחוז_מעמ`, `יחס_אורחים_לדיילת` — לא כל `params`). כתיבה = CEO-בלבד. תפקיד המסך: **תחזוקה-שוטפת מכאן-ואילך** — ה-Seed הנעול (11 מוצרים + 40 מדרגות) עדיין רץ ראשון דרך מיגרציה.

## 1. מיקום קבצים — המלצה: `src/modules/01_auth/`

לא תיקיית-מודול חדשה — עקבי עם `UsersManagementPage`/`PermissionsMatrixPage` שכבר יושבים שם למרות שאינם "auth" קונספטואלית; זהו מיקום פיזי של תוכן `SystemManagementPage`, לא שיוך-מודול. פיצול לתיקייה נפרדת היה מפזר את תוכן ה-Outlet המשותף בלי תועלת.

## 2. מבנה קבצים

**קבצים חדשים (כולם ב-`src/modules/01_auth/`):**
- `PricesManagementPage.jsx` — עמוד-הטאב: **2 קטעים מוערמים, לא תת-טאבים** (אין `Tabs` primitive ב-shadcn של הפרויקט היום). קטע 1: טבלת-מוצרים + כפתור "מדרגות מחיר" פר-שורה. קטע 2: כרטיס שני פרמטרי-התמחור. `canEdit = permissions['הגדרות מערכת'] === 'edit'`. עמודת-סטטוס = `<Select>` (3 ערכים: `active`/`out_of_stock`/`inactive` — **לא** אייקון-טוגל כמו במשתמשים, כי שם 2-ערכי) עם עדכון-אופטימי+rollback (דפוס `PermissionsMatrixPage.handleCellClick`).
- `ProductFormDialog.jsx` — דיאלוג יחיד add/edit, תבנית `CustomerFormDialog` מדויקת: `isEdit = !!editingProduct`, רימאונט-הורה ב-`key={`${dialogSeq}-${editingProduct?.sku ?? 'new'}`}`, שדות-מספר כ-string ב-state (`Number()` רק בשמירה), `validateField(name,value)` משותף ל-onBlur+פרה-סאבמיט, `<FieldError>` פר-שדה. שדות: `sku` (**נעול-לעריכה**, immutable ב-UI), `item_name`, `description` (`<textarea>` טבעי מעוצב — אין shadcn Textarea), `category` (`<Select>`), `unit` (`<Input>` חופשי — אין CHECK בסכמה), `base_price`/`cost` (`type="number" min="0" step="0.5"`), `image_url` (אופציונלי). `status` **לא** בטופס — רק דרך ה-`<Select>` בשורה. כפילות-SKU (`23505`) → הודעה ידידותית, בלי זרימת-ארכוב.
- `PriceTiersDialog.jsx` — עורך-מדרגות פר-מוצר. בפתיחה: `listPriceTiers(sku)`. שורות עם `_rk` יציב (לא index). ולידציה: `min_qty` חיובי-שלם, **אין שני שורות עם אותו `min_qty`** (מקדים 23505 על ה-PK המשולב), `special_price`>0, `max_qty` אופציונלי (ריק=NULL="ללא הגבלה", וכש-קיים ≥`min_qty`). שמירה: `replacePriceTiers(sku, rows)` — מחיקה+הכנסה-מחדש מלאה (דפוס `replaceCustomerContacts`).
- `PricingParamsCard.jsx` — טופס לשני הפרמטרים בלבד. טעינה עצמאית (`getPricingParams()`). אם שורה עוד לא קיימת (Seed טרם רץ) — שדה ריק + שמירה מבצעת **insert**, לא רק update.
- `pricesApi.js` — **לא `api.js`** (השם היה מבלבל בתיקייה שתגדל עוד טאבים). `toError(error, fallbackMessage)` + דפוס זיהוי-דחיית-RLS (`.select()` אחרי כתיבה, 0 שורות⇒`throw toError({code:'RLS_DENIED'}, ...)`) בכל פונקציה.

**קבצים חדשים משותפים:**
- `src/lib/catalog.js` + `catalog.test.js` — **לא** `src/lib/pricing.js` (השם שמור ל-SSOT-התמחור העתידי של מודול 3 עצמו — עיגול-אגורות/שקל, §7.74; פורמט-תצוגה כאן = פונקציה מקומית זעירה, לא קובץ מתחרה).
- 5 ולידטורים חדשים ב-`src/lib/validators.js`.

**מיגרציה חדשה:** `supabase/migrations/<timestamp>_prices_tab_catalog_rls.sql`.

## 3. `pricesApi.js` — רשימת פונקציות

```js
import { supabase } from '@/supabaseClient'

// מוצרים
listProducts()                    // .from('products').select('*').order('category').order('item_name')
createProduct(product)             // .insert().select().single(); 23505 עולה כמו-שהוא
updateProduct(sku, patch)          // שולל sku+status מה-patch; RLS_DENIED check
setProductStatus(sku, status)      // 'active'|'out_of_stock'|'inactive'; RLS_DENIED check

// מדרגות-מחיר
listPriceTiers(sku)
replacePriceTiers(sku, tiers)      // מחיקה-מלאה+הכנסה-מחדש (כמו replaceCustomerContacts)

// 2 פרמטרי-תמחור בלבד (לא כל params)
getPricingParams()                 // .in('param_name', Object.values(PRICING_PARAM_NAMES)); null-רשומה=טרם-נזרעה
upsertPricingParam(paramName, value)
  // ⚠️ params.param_name עדיין בלי UNIQUE (עד שמיגרציית-מ3 תריץ את §7.40ב) — אסור .upsert() פשוט.
  // טיפול-הגנתי: 0 שורות→insert · 1 שורה→update-לפי-param_id · >1 שורה→throw PARAM_NOT_UNIQUE
```

בלי בדיקת-הרשאה מקדימה בקוד — רק ה-UI (`canEdit`) כנוחות; הקיר האמיתי = RLS + זיהוי-אחרי-כתיבה, בדיוק כמו מודול 2.

## 4. `src/lib/catalog.js`

```js
export const PRODUCT_CATEGORY_LABELS = { site: 'אתר', hostess: 'דיילות', product: 'מוצרים' }
export const PRODUCT_STATUS_LABELS   = { active: 'פעיל', out_of_stock: 'אזל מהמלאי', inactive: 'לא פעיל' }

// SSOT לשמות-המחרוזת — לא לשכפל 'אחוז_מעמ' בכמה מקומות
export const PRICING_PARAM_NAMES = { VAT_PERCENT: 'אחוז_מעמ', GUESTS_PER_HOSTESS_RATIO: 'יחס_אורחים_לדיילת' }
export const PRICING_PARAM_TYPE = 'pricing_timing'

// הכלל הנעול: min_qty הגבוה-ביותר ≤ qty מנצח; max_qty לא משתתף; ממיין-פנימית (לא סומך על סדר-הקריאה מה-DB)
export function resolveSpecialPrice(tiers, qty)
export function sortTiers(tiers)
export function parseVatPercent(paramValueText)
export function parseGuestsRatio(paramValueText)
```

בדיקות (`catalog.test.js`, Vitest, בלי mocking, בונה `p = (over={}) => ({...})` כמו `customers.test.js`): מיפויי-תווית תואמים ל-CHECK ה-DB · `resolveSpecialPrice` — גבול-מדויק, qty מתחת לסף-הכי-נמוך→null, מדרגות-לא-ממוינות עדיין נפתרות נכון, `max_qty` לא משפיע על הבחירה.

## 5. ולידטורים חדשים (`validators.js`)

```js
export const SKU_REGEX = /^[A-Z0-9][A-Z0-9-]{0,29}$/   // בלי מקף-מוביל, עקבי עם החלטת-ה-Seed
isValidSku(value)
isValidNonNegativePrice(value)   // products.base_price/cost
isValidPositivePrice(value)      // price_tiers.special_price
isValidPositiveInt(value)        // min_qty, max_qty
isValidVatPercent(value)         // 0–100 — כמעט זהה ל-isValidDiscountPercent הקיים; לא לאחד עכשיו (נגיעה מחוץ-להיקף במודול-לקוחות), רק להעיר בקוד
isValidGuestsRatio(value)
```

## 6. מיגרציית RLS (מדויקת — תבנית §7.21, מודול-שער = 'הגדרות מערכת')

```sql
-- <timestamp>_prices_tab_catalog_rls.sql
-- למה: טאב "מחירים" מוסיף עריכה אמיתית ל-products/price_tiers/params (עד כה deny-all, §7.48).
-- קריאה פתוחה לכל authenticated (קטלוג נצרך גם ע"י מסכים עתידיים – מ3/8/11); כתיבה=CEO-בלבד
-- לפי הרשאת-מודול 'הגדרות מערכת' הקיים. 🔗 מתאם עם db_roadmap.md A-12 (seed) ו-A-17 (numeric).

create policy "products_select_all_authenticated" on products
  for select to authenticated using (true);
create policy "products_write_ceo_only" on products for all to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
      and p.permission_level = 'edit'))
  with check (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
      and p.permission_level = 'edit'));

-- אותה תבנית בדיוק ל-price_tiers ול-params (3 זוגות policies סה"כ).
```

**הערה:** ה-`params` policy חלה על **כל הטבלה** (RLS לא משער בקלות לפי ערך-עמודה) — הסינון ל-2 השורות הרלוונטיות קורה ב-`pricesApi.js` (`.in('param_name', …)`), לא ב-DB. כשמודול 9 יבנה את מסך-הפרמטרים המלא, הוא **ישתמש-חוזר** באותן 2 policies בלי מיגרציה נוספת. **בלי** `ALTER…TYPE numeric(12,2)` כאן — זה A-17, נשאר נפרד בכוונה.

## 7. תוכנית-בדיקות

Vitest ל-`catalog.js`/`validators.js`. E2E חדש `e2e/prices.spec.js` (מסלול-CEO מלא: הוספת-מוצר→עריכה→טוגל-3-סטטוסים→מדרגות→2-פרמטרים; + תפקיד-חסום מקבל `RLS_DENIED`). **פער-ידוע:** אין עדיין צרכן אמיתי ל-`resolveSpecialPrice` (מודול 3/מנוע-התמחור טרם נבנה) — נשאר Vitest-בלבד עד אז; לתייג `🚧 מ3` במדריך-המיקרו של מודול 1.

## 8. תשעת-הסיכונים/השאלות שהסוכן דגל

1. **סדר Seed מול UI — ✅ הוכרע (14/07):** ה-Seed הנעול רץ ראשון; המסך לתחזוקה-שוטפת-בלבד.
2. ~~`params.param_name` עדיין בלי UNIQUE בזמן שהמסך נבנה — `upsertPricingParam` חייב טיפול-הגנתי (סעיף 3 למעלה); להחליף ל-`.upsert()` אמיתי אחרי ש-UNIQUE נוחת.~~
   ✅ **התיישן — שני חלקיו כבר לא נכונים** *(נמדד 12/08/2026 ב-`regin-docs-sync`; הקובץ הזה מעולם לא נדחס ולכן איש לא חזר אליו)*: ‏**(א)** ה-UNIQUE נחת ב-`20260723111005` (`params_param_name_key`, גם ב-`docs/schema.sql`) · **(ב)** ‏`upsertPricingParam` **אינו קיים יותר** — הוא הוחלף ב-`updatePricingParam` (`src/modules/01_auth/pricesApi.js`), **ו-`.upsert()` נשלל לגמרי**: Postgres בונה ומאמת NOT-NULL את שורת-ה-INSERT **לפני** שהוא מגלה את ההתנגשות, כך שהמסלול הזה מעולם לא היה יכול לעבוד. הנימוק המלא ב-`docs/micro_guides/module-3.md` §9, רשומת 30/07/2026 22:52.
3. קיבוע `numeric(12,2)` (A-17) **לא** נכלל במיגרציה הזו בכוונה — לתאם שמי-שמבצע את A-17 לא ינסה גם להוסיף policies-כפולות.
4. פורמט-תצוגת-כסף: להשתמש בפונקציית-מיזעור מקומית, **לא** ליצור `src/lib/pricing.js` (שם שמור לעתיד).
5. `replacePriceTiers` (מחיקה+הכנסה) עקבי עם `replaceCustomerContacts` — לא הפרה של "אין-מחיקת-רשומות-עסקיות" (מדרגות-מחיר הן תת-טבלת-פירוק, לא ישות עם מחזור-חיים משלה).
6. `products.status` **3-ערכי** → `<Select>` ולא אייקון-טוגל (סטייה-ויזואלית מודעת מ-`UsersManagementPage`, לדרוש-אישור).
7. **חובת-תיקון-תיעוד:** `docs/micro_guides/module-1.md` כותב כרגע "params UI → M9" בלי הסתייגות — הופך שגוי-עובדתית לשתי השורות שהמסך הזה עורך. תיקון = חלק מה-DoD, לא ניקוי-רשות.
8. `params` הוא שטח-חדש למוסכמת-ה-SSOT (אין תקדים במודול 2 ל"upsert שורה-מפתחית בלי UNIQUE") — מודעות, לא בעיה.
9. סדר-טאבים מוצע: `משתמשים → הרשאות → מחירים → פרמטרים`.

</div>
