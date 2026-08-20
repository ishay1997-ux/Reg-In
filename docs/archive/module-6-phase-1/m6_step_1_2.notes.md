<div dir="rtl">

# צעד 1.2 — מיגרציה B: הטבלה `project_changes`

**נכתב:** 14/08/2026 11:49 · **קובץ SQL:** `m6_step_1_2.sql`
**שם-קובץ מוצע למיגרציה:** `supabase/migrations/20260814114901_module6_project_changes_table.sql`

---

## מה זה עושה

בונה טבלה חדשה אחת — **יומן שינויי-התכולה של פרויקט**. כל פעם שדנה משנה כמות אחרי שהלקוח כבר
אישר את הצעת-המחיר (עוד 20 שלטים, פחות שתי דיילות), נרשמת כאן **שורה אחת**: מה השתנה, בכמה
(מספר חיובי = תוספת, שלילי = הפחתה), **המחיר והעלות כפי שהוקפאו בהצעה**, **הסיבה — שדה חובה**,
מי עשתה את זה ומתי. הצעת-המחיר עצמה לא נוגעים בה: היא נעולה במסד, ולכן זו הכתובת היחידה שבה
שינוי יכול להירשם.

בנוסף הטבלה נסגרת מבחינת הרשאות: **מי שיש לה הרשאת צפייה או עריכה על "פרויקטים" יכולה לקרוא**,
ו**אף אחת אינה יכולה לכתוב ישירות מהדפדפן** — הכתיבה תעבור בהמשך רק דרך פונקציית-השרת שמעדכנת
גם את הכמות בפועל, כדי שלא ייווצר תיעוד שמשקר.

---

## הפיכוּת

- ✅ **הכול הפיך בפקודה אחת:** `drop table public.project_changes;` — הטבלה, שמונת האילוצים,
  שלושת האינדקסים, הטריגר והמדיניות נופלים יחד איתה. `אומת-על-ידי` (אין תלות חיצונית שמצביעה
  אליה כרגע — `project_changes` אינה קיימת במסד, ולכן אף אובייקט אינו תלוי בה).
- ✅ **אין נעילה על טבלאות קיימות** מעבר לאימות שלושת המפתחות-הזרים (`projects`, `products`,
  `users`) — אימות שנעשה על טבלת-האב ואינו כותב בה. `אומת-על-ידי` (שלוש הטבלאות קטנות:
  ‏4 פרויקטים · 11 מוצרים · 7 משתמשות).
- ✅ **אין שורות קיימות שיכולות להפר משהו** — הטבלה חדשה לחלוטין. `אומת-על-ידי`.
- ⚠️ **מה שאינו הפיך:** אם הטבלה תופל **אחרי** שנכתבו בה שורות, השורות אובדות. בשלב הזה
  אין שורות, ולכן ההפלה חינם — אבל זה חלון שנסגר ברגע שה-RPC של שינוי-התכולה עולה לאוויר.
- ✅ **אין השפעה על Seed ואין השפעה על Storage.** `אומת-על-ידי` (המיגרציה אינה נוגעת ב-`params`,
  ב-`storage.buckets` ולא ב-`cron.job`).

---

## מה מדדתי

כל השאילתות רצו מול המסד החי ב-14/08/2026 בסביבות 11:4X, קריאה בלבד.

| מה נשאל | מה חזר | תג |
|---|---|---|
| `information_schema.tables` — האם `project_changes` קיימת | **0** — אינה קיימת | `אומת-על-ידי` |
| `projects.project_id` — טיפוס | `integer` (`int4`), `not null` | `אומת-על-ידי` |
| `products.sku` — טיפוס | `text`, `not null`, ו-PK של הטבלה | `אומת-על-ידי` |
| `users.email` — טיפוס | `text`, `not null`, ו-PK של הטבלה | `אומת-על-ידי` |
| `quote_services.color` — נוסח ה-CHECK החי | `CHECK (((color IS NULL) OR (color = ANY (ARRAY['לבן','שחור','אפור','טורקיז','כחול']))))` | `אומת-על-ידי` |
| נוסח-המקור של אותו CHECK | `check (color is null or color in ('לבן', 'שחור', 'אפור', 'טורקיז', 'כחול'));` — ‏`20260723111005:41` · `docs/schema.sql:460-461`. **הועתק בייט-בבייט, כולל הרווחים אחרי הפסיקים** | `אומת-על-ידי` |
| דפוס ה-FK על `products(sku)` | `quote_services_sku_fkey` **ו**-`logistics_sku_fkey` — שניהם `ON UPDATE CASCADE ON DELETE RESTRICT` | `אומת-על-ידי` |
| דפוס ה-FK על `users(email)` | `projects_owner_email_fkey` — `ON DELETE RESTRICT` (בלי `on update`) | `אומת-על-ידי` |
| ‏`logistics_planned_qty_check` — האם AR-4 כבר נאכף | **קיים וחי:** `CHECK ((planned_qty > 0))` | `אומת-על-ידי` |
| תבנית ה-RLS (§7.21) — נוסח-המקור | `20260809134237_module4_rls_and_public_rpc.sql:126-131` — ‏`projects_select_by_permission`, כולל העטיפה `(select public.current_user_role_id())` ו-`(select module_id from public.modules where …)` | `אומת-על-ידי` |
| ‏`public.current_user_role_id()` קיימת | **1** | `אומת-על-ידי` |
| ‏`modules` שבו `module_name='פרויקטים'` | **1 שורה** — המחרוזת נכונה ואינה מייצרת `NULL` שקט | `אומת-על-ידי` |
| ‏`permissions` — עמודות | `role_id, module_id, permission_level` — שלוש, בדיוק כמו בתבנית | `אומת-על-ידי` |
| ‏`moddatetime` — באיזו סכמה | **`extensions.moddatetime` בלבד. ב-`public` אין כזו.** ⇒ `public.moddatetime(...)` היה מפיל את ההחלה | `אומת-על-ידי` |
| קונבנציית שמות-אינדקס | `quote_services_sku_idx` · `logistics_sku_idx` · `projects_owner_email_idx` · `projects_customer_id_idx` ⇒ `<טבלה>_<עמודה>_idx` | `אומת-על-ידי` |
| התנגשויות-שם | **0** אינדקסים · **0** אילוצים בשם `project_changes%` · **0** מדיניות בשם הזה | `אומת-על-ידי` |
| ביטויי ה-CHECK — האם הם בכלל חוקיים | הורצו כ-`SELECT`: `length(btrim(' x '))>0`=true · `color` ל-NULL ולערך חוקי=true · **`0 <> 0` = false ⇒ דלתא-אפס אכן נדחית** · `gen_random_uuid()` זמינה | `אומת-על-ידי` |

### שתי סטיות מודעות מגוש-הקוד שבמדריך

1. **‏`on delete restrict` נוסף לשני ה-FK.** המדריך כתב `references public.products(sku) on update
   cascade` (בלי `on delete`) ו-`references public.users(email)` (בלי כלום). **דפוס-הבית שנמדד
   בשתי טבלאות-אחיות הוא `on update cascade on delete restrict`**, ובלעדיו ברירת-המחדל היא
   `NO ACTION` — כלומר מחיקת-מוצר או מחיקת-משתמשת עדיין נחסמת, אבל בצורה שונה מהאחיות. `הנחתי`
   שהעקביות עדיפה; זו החלטת-ביצוע בלי משמעות מוצרית.
2. **כל אילוץ קיבל שם מפורש**, כולל אלה שהמדריך כתב כ-CHECK בשורת-עמודה (`change_target`,
   `unit_price_snapshot`, `unit_cost_snapshot`, `reason`, `color`) ו-PK. **זו לא סטייה מהתוכן** —
   זו אכיפת כלל-הבית "שם מפורש לכל אילוץ ואינדקס". `אומת-על-ידי` (הכלל, ו-`SERVER_CONSTRAINT_RULES`
   ב-`src/lib/hostesses.js:603-613` הוא הצרכן).

### חסמים שהצעד הזה סוגר

- **חסם #4 — ‏`project_changes` נשלחת deny-all.** ✅ **סגור.** המדיניות
  `project_changes_select_by_permission` נמצאת **בתוך גוש-הקוד**, לא כהערה מאחוריו.
- **חסם #10 — ‏`project_changes_delta_qty_check` בשם שנגזר אוטומטית.** ✅ **סגור.** האילוץ נכתב
  בשם מפורש. *(הערה כנה: במקרה הזה PostgreSQL היה גוזר **בדיוק** את אותו שם, כי זו בדיקת-העמודה
  היחידה על `delta_qty`. אבל הסתמכות על גזירה היא הסתמכות על צירוף-מקרים — הוספת CHECK שני על
  אותה עמודה בעתיד הייתה מייצרת `..._check1` ושוברת את המיפוי בשקט.)*
- **חסם #8 (חלקי) — ‏FK בלי אינדקס.** ✅ **סגור לחלקו של הצעד הזה.** נוספו
  `project_changes_sku_idx` ו-`project_changes_performed_by_idx`.

---

## הנחות

| # | ההנחה | תג |
|---|---|---|
| 1 | **‏`on delete restrict` על שני ה-FK** במקום ברירת-המחדל `NO ACTION` — לצורך עקביות עם `quote_services_sku_fkey` / `logistics_sku_fkey` / `projects_owner_email_fkey`. ההתנהגות בפועל כמעט זהה (שתיהן חוסמות מחיקה); ההבדל הוא ב-deferrability בלבד | `הנחתי` |
| 2 | **אין אינדקס על `change_group_id`.** קבוצת-שינוי היא תוצר של שליחה אחת, וקריאה של קבוצה שלמה תמיד מגיעה דרך פרויקט מוכר ⇒ `project_changes_project_id_idx` מכסה אותה. אם ה-RPC בצעד 1.8 יתגלה כשולף לפי `change_group_id` לבדו — צריך אינדקס נוסף, והוא זול להוסיף אז | `הנחתי` |
| 3 | **‏`change_group_id` בלי `default gen_random_uuid()`** — ה-RPC מייצר אותו, כי אותו UUID חייב להיות משותף לכמה שורות מאותה שליחה; ברירת-מחדל ברמת-העמודה הייתה נותנת UUID **שונה לכל שורה**, כלומר בדיוק ההפך מהכוונה. *(המדריך כתב `uuid not null` בלי default — זו הסיבה, והיא נרשמת כאן כי היא לא נכתבה שם)* | `הנחתי` |
| 4 | **‏`numeric(12,2)` לשני שדות-ההקפאה** — מהמדריך. לא הצלבתי מול הדיוק של `quote_services.closing_unit_price`; האילוץ החי שם הוא `>= 0` בלבד ולא ראיתי את הדיוק שלו | `הנחתי` |

---

## 🛑 צריך את ישי

**אין.**

הכול כאן הוא צורת-מימוש של הכרעות שכבר קיימות ומצוטטות: ② (טבלה חדשה, סיבה חובה, מחיר מוקפא) ·
① (רק כמויות) · ③ↄ (מדרגה לא מתמחרת מחדש) · ⑯ (זמן מודיע ולא חוסם) · AS-2 (בלי מדיניות-כתיבה) ·
AS-8 (‏`change_id` · `delta_qty`) · AR-4 (אפס אסור — ונאכף במקום שבו הנתון קיים). ארבעת הפריטים
שנשארו של ישי (‏A6 · B11 · B13 · E3) **אינם חוסמים את הצעד הזה** — אף אחד מהם אינו נוגע ב-
`project_changes`.

---

## שמות שהקוד יסתמך עליהם

**טבלה:** `public.project_changes`

**אילוצים (11):**
- `project_changes_pkey`
- `project_changes_project_id_fkey`
- `project_changes_sku_fkey`
- `project_changes_performed_by_fkey`
- `project_changes_change_target_check`
- **`project_changes_delta_qty_check`** ← זה שבדיקת-הקבלה תופסת עליו `23514`
- `project_changes_unit_price_snapshot_check`
- `project_changes_unit_cost_snapshot_check`
- `project_changes_reason_check`
- `project_changes_color_check`
- `project_changes_target_shape`

**אינדקסים (3):**
- `project_changes_project_id_idx` — ‏`(project_id, created_at desc)`
- `project_changes_sku_idx`
- `project_changes_performed_by_idx`

**טריגר (1):**
- `project_changes_set_updated_at` — ‏`before update`, ‏`extensions.moddatetime(updated_at)`

**מדיניות (1):**
- **`project_changes_select_by_permission`** — ‏`for select to authenticated`, שער `'פרויקטים'`,
  רמות `('edit','view')`. **ואין אף מדיניות-כתיבה — במתכוון.**

---

## מה תוקן בסבב הבקרה

> **‏14/08/2026 · סבב-בקרה יריב על תשע טיוטות פזה-1.** לקובץ הזה נגעו **שני** ממצאים:
> אחד **נדחה עם מדידה שסותרת אותו**, והשני **הועלה להכרעת-ישי ובמכוון לא שונה**.

### ① ‏[minor] `numeric(12,2)` מול המקור — 🚫 **הממצא נדחה. המדידה סותרת אותו.**

**מה נטען:** ש-`project_changes.unit_price_snapshot` / `unit_cost_snapshot` הוגדרו
`numeric(12,2)` בעוד עמודות-המקור `quote_services.closing_unit_price` / `closing_unit_cost`
הן `numeric` **לא-מוגבל**, ולכן ערך עם יותר משתי ספרות-עשרוני יעוגל בשקט בכתיבה, וערך עם
יותר מעשר ספרות שלמות יזרוק `22003` באמצע ה-RPC. הראיה שצוטטה:
*"information_schema ⇒ שניהם `numeric` עם precision/scale = NULL"*.

🔴 **נמדד חי 14/08/2026, בשתי דרכים בלתי-תלויות — ושתיהן מחזירות את ההפך:**

```sql
-- ① דרך הקטלוג, לא דרך information_schema:
select a.attname, format_type(a.atttypid, a.atttypmod)
  from pg_attribute a
 where a.attrelid='public.quote_services'::regclass
   and a.attname in ('closing_unit_price','closing_unit_cost');
```
⇒ `closing_unit_cost: numeric(12,2)` · `closing_unit_price: numeric(12,2)`

```sql
-- ② ודרך information_schema עצמו — אותו מקור שהממצא ציטט:
select column_name, data_type, numeric_precision, numeric_scale
  from information_schema.columns
 where table_schema='public' and table_name='quote_services'
   and column_name in ('closing_unit_price','closing_unit_cost');
```
⇒ ‏`numeric · precision=12 · scale=2` לשתיהן. **לא NULL.**

**המסקנה: הטיפוסים תואמים תו-בתו.** ‏`numeric(12,2)` כאן אינו הידוק של מקור רחב יותר — הוא
**העתק מדויק** של המקור. ⇒ אין עיגול-שקט, אין סיכון `22003`, ואין מה לשנות.
✅ **ומה כן השתנה בעקבות הממצא:** קובץ ההערות הזה הצהיר קודם שהצלבת-הטיפוסים **לא בוצעה** —
עכשיו היא בוצעה, והתוצאה נרשמה בהערת-ה-why של המיגרציה עצמה.
*(נמדד גם: 28 שורות חיות ב-`quote_services`, `max(scale)` = 2 בשתי העמודות,
`max(closing_unit_price)` = 2,500.00, `max(closing_unit_cost)` = 1,200.00 — הרחק מהגבול.)*

### ② ‏[major] המדיניות חושפת מחיר **ועלות** לכל מי שיש לו `'פרויקטים'` — ⏸️ **פתוח להכרעת-ישי**

🚫 **במכוון לא שונה בקוד.** צורת-המדיניות היא **הכרעת AS-2**, ומי-רואה-כסף היא הכרעת-מוצר,
לא תיקון-קוד. מה שהממצא חושף אינו טעות בכתיבה אלא **תוצאה שלא נשקלה כשההכרעה התקבלה**:
‏AS-2 קבע את *צורת* המדיניות ולא נשאל אילו **עמודות** היא חושפת.

**העובדה, במילים של ישי ולא של SQL:** בלשונית שינויי-התכולה של פרויקט יופיעו שתי עמודות —
**מה הלקוח משלם** ליחידה ו**כמה זה עולה לנו** ליחידה. המדיניות כפי שנכתבה נותנת את שתיהן
לכל מי שרואה את מסך-הפרויקטים. **וזה כולל את מנהלת הלוגיסטיקה ואת מנהלת הגיוס והשיבוץ,
שהיום חסומות לגמרי גם מ'הצעות מחיר' וגם מ'כספים'** (נמדד חי במטריצת-ההרשאות).
⇒ **זו הדלת הראשונה במערכת שדרכה שתיהן רואות מחיר ועלות בכלל.**

**להשוואה — שערי-הקריאה החיים על בדיוק אותו סוג-נתון** (נמדדו מ-`pg_policies`):
| המדיניות החיה | מי עוברת |
|---|---|
| `product_costs_select_by_permission` | `edit` על **'הצעות מחיר'** או **'כספים'** — שער-הקריאה המחמיר במסד |
| `quote_services_select_by_permission` | **'הצעות מחיר'** ב-`edit`/`view` |
| `project_changes_select_by_permission` *(כפי שנכתבה)* | **'פרויקטים'** ב-`edit`/`view` ⇐ הפער |

**שתי הצורות, מדודות — וההמלצה שלי היא (ב):**
- **(א)** להשאיר את המדיניות כפי ש-AS-2 קבע, ופשוט **לא לבחור** את `unit_cost_snapshot`
  בשום קריאה מהלקוח; העלות תיחשף רק דרך RPC של מודול 8, מאחורי שער 'כספים'.
  *זול מיידית, אבל מסתמך על משמעת-קוד: מי שיכתוב `select *` בעוד חצי שנה יפתח את הדלת בלי לדעת.*
- **(ב) ✅ מומלץ — לפצל את הקריאה:** המדיניות נשארת כפי שהוכרעה עבור העמודות התפעוליות
  (מה השתנה, בכמה, מתי, מי), ו**שתי עמודות-הכסף נקראות רק דרך פונקציית-קריאה
  `SECURITY DEFINER` שמריצה את אותה בדיקת-`v_can_read_quotes` שצעד 1.8 כבר מממש**.
  *יקר בכתיבה פעם אחת, ואז המסד עצמו אוכף — ולא הזיכרון של מי שכותב שאילתה.*
  🔑 **והנימוק המכריע:** זה **בדיוק אותו דפוס** שכבר הוכרע ונבנה במודול הזה עצמו לשדה
  `planned_revenue`, כלומר אינו חריג חדש אלא הרחבה של תקדים קיים.

🔴 **המיגרציה נושאת הערת-⏸️ מפורשת מעל המדיניות** כדי שאיש לא יקרא אותה כסגורה.

### ③ מה נבדק מחדש בקובץ הזה ועבר ✅

- **`extensions.moddatetime` ולא `public.moddatetime`:** נמדד שוב —
  `extensions` ⇒ **1** פונקציה, `public` ⇒ **0**. הצורה בקובץ נכונה; `public.moddatetime`
  היה מפיל את המיגרציה בהחלה.
- **כל אילוץ, אינדקס, FK, טריגר ומדיניות בשם מפורש:** ✅ אפס שמות אוטומטיים.
- **`timestamptz`:** ‏`created_at` ו-`updated_at` שתיהן `timestamptz`. ✅
- **שלושת האינדקסים** (`project_changes_project_id_idx` · `_sku_idx` · `_performed_by_idx`)
  מכסים את שלוש ה-FK של הטבלה. ‏`project_changes_project_id_idx` הוא
  `(project_id, created_at desc)` — **עמודה מובילה = עמודת-ה-FK**, ולכן הוא מכסה גם את ה-FK
  וגם את הקריאה השכיחה. זו הסיבה שתחזית-יועץ-הביצועים ב-1.10 נשארת 20 → 20.
- ⚠️ **סעיף ג' ב-1.10 שונה בעקבות זה:** שלושת האינדקסים האלה היו מסומנים שם `ADVISORY`
  ("המלצה"), בעוד המיגרציה **יוצרת אותם בפועל**. הם הועלו ל-`REQUIRED`.

</div>
