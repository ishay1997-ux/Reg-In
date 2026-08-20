-- =====================================================================================
-- מודול 6 (פרויקטים) — מיגרציה B: הטבלה `project_changes` · RLS · אינדקסים
-- שם-קובץ מוצע: supabase/migrations/20260814114901_module6_project_changes_table.sql
-- =====================================================================================
-- why (הכרעה ② — ישי, 13/08/2026): *"מסכים, טבלה חדשה. זה תיעוד חשוב גם לדוחות בהמשך"*.
--   שינוי-תכולה אינו עורך את הצעת-המחיר: ההצעה המאושרת **נעולה במסד** (טריגר זורק `P0001`
--   בעברית על כל UPDATE בשורה שאינה `in_progress`) ⇒ **ל`project_changes` אין תחליף — היא
--   הבית היחיד לשינוי, כי למקור אין דלת.** שורה אחת לכל שינוי: מה · בכמה (חיובי=תוספת /
--   שלילי=הפחתה) · **מחיר ועלות מוקפאים** · **סיבה (חובה)** · מי ביצע · מתי.
--
-- why (הכרעה ① — ישי, 13/08/2026): *"כן ברור, משנים רק כמויות"* ⇒ אין עריכת מחיר-יחידה
--   בדיעבד. תוספת היא **שורה חדשה** עם המחיר שלה, לעולם לא עריכה של שורה שהלקוח אישר.
--   ⇒ `unit_price_snapshot` / `unit_cost_snapshot` הם **הקפאה בזמן-הכתיבה**, ולכן `not null`:
--   שורת-שינוי בלי מחיר מוקפא אינה ניתנת לתמחור בדיעבד לעולם.
--   ✅ **הצלבת-טיפוסים שנעשתה בסבב-הבקרה 14/08/2026 (קודם לכן הוצהרה כלא-בוצעה):**
--   ‏`quote_services.closing_unit_price` ו-`closing_unit_cost` הם **`numeric(12,2)` בדיוק** —
--   נמדד בשתי דרכים בלתי-תלויות: ‏`format_type(atttypid, atttypmod)` ⇒ `numeric(12,2)`,
--   ו-`information_schema.columns` ⇒ `precision=12, scale=2`. ⇒ שתי עמודות-ההקפאה כאן
--   **תואמות את המקור תו-בתו**, ואין עיגול-שקט ואין סיכון `22003` בהעתקה. *(28 שורות חיות:
--   ‏`max(scale)` = 2 · `max(price)` = 2,500.00 · `max(cost)` = 1,200.00.)*
--
-- why (הכרעה ③ↄ — 14/08/2026): מעבר-מדרגה בקטלוג **אינו מתמחר מחדש**. התוספת מחויבת לפי
--   המחיר שאושר בהצעה. ⇒ המחיר המוקפא נקרא **בצד-השרת מ-`quote_services`** בתוך ה-RPC,
--   ולעולם לא מ-payload של הדפדפן. הטבלה כאן היא רק הבית לערך המוקפא.
--
-- why (`delta_qty <> 0`, וזו הסיבה ששם האילוץ נכתב במפורש): שינוי בכמות אפס אינו שינוי.
--   🔴 **האילוץ מקבל שם מפורש `project_changes_delta_qty_check`** ולא נשען על מה ש-PostgreSQL
--   גוזר — בדיקת-הקבלה של הצעד תופסת `23514` **לפי שם האילוץ**, ובמערכת הזאת
--   `SERVER_CONSTRAINT_RULES` (`src/lib/hostesses.js:603-613`) ממפה **שמות** להודעות עברית.
--   במילות המקור שם: *"את הנוסח PostgreSQL מנסח, ואילו השם הוא חוזה שאנחנו כתבנו במיגרציה."*
--
-- why (‏AR-4 — למה *אין* כאן אילוץ "לא להוריד לאפס"): ‏AR-4 אוסר להוריד שורת-לוגיסטיקה
--   לכמות אפס. 🔴 **הכלל הזה חל על התוצאה ב-`logistics`, לא על הדלתא כאן** — שורה ב-
--   `project_changes` אינה יודעת מה הכמות המצטברת. הוא נאכף בשלושה מקומות שכבר קיימים או
--   מתוכננים: ‏① `logistics_planned_qty_check` — `CHECK (planned_qty > 0)` **חי במסד היום**
--   (נמדד 14/08/2026) · ② בדיקה מקדימה בתוך ה-RPC של שינוי-התכולה · ③ חסימה בדיאלוג לפני
--   שליחה. **אילוץ שלישי כאן היה מתחזה לאכיפה בלי לראות את הנתון שהוא אמור לאכוף.**
--
-- why (‏RLS — ‏AS-2, וזה המוקש המרכזי של הצעד): 🔴 **המדיניות נכתבת כאן, באותה מיגרציה.**
--   טבלה עם `enable row level security` ובלי ולו מדיניות אחת היא **deny-all**, והקריאה
--   מהדפדפן חוזרת `{data:null, error:null}` — כישלון **שקט**, בלי שגיאה, בדיוק המלכודת
--   שנמדדה חיה על `logistics` (אפס מדיניות, 14/08/2026). ⇒ **SELECT בלבד**, שער `'פרויקטים'`,
--   רמות `('edit','view')`, לפי תבנית §7.21 — עותק-צורה מדויק של
--   `projects_select_by_permission` (`20260809134237_module4_rls_and_public_rpc.sql:126-131`).
--   🚫 **ואין ולו מדיניות-כתיבה אחת** — כל כתיבה עוברת דרך ה-RPC של שינוי-התכולה
--   (`SECURITY DEFINER`), כי השורה חייבת להיכתב **אטומית** יחד עם `logistics.planned_qty` /
--   `projects.required_hostess_count`. מדיניות-כתיבה ללקוח הייתה מתירה לדפדפן לרשום שינוי
--   בלי לעדכן את התכולה — כלומר תיעוד שמשקר.
--
-- why (‏`extensions.moddatetime`, ולא `public.moddatetime`): התוסף הועבר מחוץ ל-`public` על-ידי
--   `20260710164420_module2_moddatetime_to_extensions_schema.sql:7`. **נמדד 14/08/2026 מול
--   `pg_proc`: קיימת בדיוק פונקציה אחת בשם `moddatetime`, בסכמה `extensions`; ב-`public`
--   אין כזו** ⇒ הצורה `public.moddatetime` הייתה מפילה את המיגרציה בזמן ההחלה.
--   ⚠️ ‏11 הטריגרים בשם-חשוף מ-`20260710160735` עובדים רק כי נקשרו ל-OID לפני ההעברה;
--   טריגר חדש אינו יכול להעתיק את צורתם.
--
-- why (אינדקסים על מפתחות-זרים): היועץ של Supabase מסמן FK בלי אינדקס. שתי טבלאות-אחיות
--   כבר עושות בדיוק את זה — `quote_services_sku_idx` ו-`logistics_sku_idx` (נמדדו חיים
--   14/08/2026) — וקונבנציית-השם `<טבלה>_<עמודה>_idx` נגזרת מהן.
--
-- הפיכוּת: ‏`drop table public.project_changes;` מבטל הכול (הטבלה, האילוצים, האינדקסים,
--   הטריגר והמדיניות נופלים איתה). אין נעילה על טבלאות קיימות מעבר לאימות ה-FK, ואין שורות
--   קיימות שיכולות להפר משהו — הטבלה חדשה. אין השפעה על Seed ואין השפעה על Storage.
-- =====================================================================================

create table public.project_changes (
  change_id           bigint  generated always as identity,
  project_id          integer not null,
  change_group_id     uuid    not null,   -- שליחה אחת של הדיאלוג = קבוצה אחת (משטח 9)
  sku                 text,
  color               text,
  change_target       text    not null,
  delta_qty           integer not null,   -- ② + spec §14②: `delta_qty`, ולא `qty_delta`/`change_qty`
  unit_price_snapshot numeric(12,2) not null,
  unit_cost_snapshot  numeric(12,2) not null,
  reason              text    not null,   -- ②: הסיבה היא **חובה**
  performed_by        text    not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- כל אילוץ מקבל שם מפורש: הקוד ממפה שמות-אילוצים להודעות עברית, ושם שנגזר אוטומטית הוא באג.
  constraint project_changes_pkey primary key (change_id),

  constraint project_changes_project_id_fkey foreign key (project_id)
    references public.projects (project_id) on delete cascade,

  -- דפוס-הבית ל-FK על `products(sku)`, מועתק מ-`quote_services_sku_fkey` ומ-`logistics_sku_fkey`
  -- (נמדדו חיים 14/08/2026): שינוי-מק"ט מתגלגל, מחיקת-מוצר נחסמת כשיש לו היסטוריה.
  constraint project_changes_sku_fkey foreign key (sku)
    references public.products (sku) on update cascade on delete restrict,

  -- דפוס-הבית ל-FK על `users(email)`, מועתק מ-`projects_owner_email_fkey` (נמדד חי 14/08/2026).
  constraint project_changes_performed_by_fkey foreign key (performed_by)
    references public.users (email) on delete restrict,

  constraint project_changes_change_target_check
    check (change_target in ('logistics', 'hostess_count')),

  -- 🔴 השם הזה הוא חוזה: בדיקת-הקבלה של הצעד תופסת `23514` עליו בשמו.
  constraint project_changes_delta_qty_check check (delta_qty <> 0),

  constraint project_changes_unit_price_snapshot_check check (unit_price_snapshot >= 0),
  constraint project_changes_unit_cost_snapshot_check  check (unit_cost_snapshot  >= 0),

  constraint project_changes_reason_check check (length(btrim(reason)) > 0),

  -- 🔴 זהה בייט-בבייט ל-`quote_services_color_check`
  -- (`20260723111005_module3_quotes_structure_and_constraints.sql:41` · `docs/schema.sql:460-461`).
  constraint project_changes_color_check
    check (color is null or color in ('לבן', 'שחור', 'אפור', 'טורקיז', 'כחול')),

  -- שינוי-לוגיסטיקה מחייב מק"ט; שינוי-כמות-דיילות אינו נושא מק"ט ואינו נושא צבע.
  constraint project_changes_target_shape check (
    (change_target = 'logistics'     and sku is not null) or
    (change_target = 'hostess_count' and sku is null and color is null))
);

-- הקריאה השכיחה: כל השינויים של פרויקט אחד, החדש קודם (משטחים 3 · 6 · תיק-האירוע).
create index project_changes_project_id_idx
  on public.project_changes (project_id, created_at desc);

-- שני אלה קיימים כדי שהיועץ לא יסמן FK בלי אינדקס, ובקונבנציית-השם של הטבלאות-האחיות.
create index project_changes_sku_idx          on public.project_changes (sku);
create index project_changes_performed_by_idx on public.project_changes (performed_by);

create trigger project_changes_set_updated_at
  before update on public.project_changes
  for each row execute function extensions.moddatetime(updated_at);

alter table public.project_changes enable row level security;

-- 🔴 המדיניות **בתוך** המיגרציה, לא כהערה בסופה: טבלה עם RLS ובלי מדיניות מחזירה
--    `{data:null, error:null}` — כישלון שקט שאף בדיקה קיימת אינה תופסת.
--
-- ⏸️ **פתוח להכרעת-ישי — נמצא בסבב-הבקרה 14/08/2026, ובמכוון *לא* שוּנה כאן.**
--    צורת-המדיניות היא הכרעת AS-2 ואינה מוטלת בספק; מה שלא נשקל כשהיא הוכרעה הוא
--    **אילו עמודות היא חושפת**. ‏`unit_price_snapshot` (מחיר-ללקוח) ו-`unit_cost_snapshot`
--    (עלות-מוצר) נחשפות בה לכל מי שמחזיק `'פרויקטים'` ב-`edit`/`view` — **וזה כולל את
--    מנהלת הלוגיסטיקה ואת מנהלת הגיוס והשיבוץ, ששתיהן חסומות היום על 'הצעות מחיר'
--    ועל 'כספים'** (נמדד חי). כלומר זו **הדלת הראשונה במערכת** שדרכה שתיהן רואות
--    מחיר ועלות בכלל. להשוואה, שערי-הקריאה החיים על אותו סוג-נתון:
--      · `product_costs_select_by_permission` → `edit` על 'הצעות מחיר' **או** 'כספים'
--      · `quote_services_select_by_permission` → 'הצעות מחיר' ב-`edit`/`view`
--    🚫 **לא לשנות בשקט** — שינוי כאן הוא הכרעת-מוצר (מי רואה כסף), לא תיקון-קוד.
--    שתי הצורות המדודות והמלצה מנומקת: `m6_step_1_2.notes.md` §"מה תוקן בסבב הבקרה".
create policy "project_changes_select_by_permission" on public.project_changes for select to authenticated
  using (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'פרויקטים')
      and p.permission_level in ('edit', 'view')));

-- 🚫 אין מדיניות INSERT/UPDATE/DELETE — במתכוון (AS-2). כתיבה עוברת רק דרך ה-RPC של
--    שינוי-התכולה, שהוא `SECURITY DEFINER` ולכן עוקף RLS מטעם המערכת ולא מטעם הדפדפן.
