-- =====================================================================================
-- מודול 6 (פרויקטים) — מיגרציה D: מדיניות-קריאה על `logistics` + מצביע-מקור + CHECK
-- שם-קובץ מוצע: supabase/migrations/20260814130103_module6_logistics_policy_and_origin.sql
-- =====================================================================================
-- ⛔ תלות-סדר קשיחה: **מיגרציה B (צעד 1.2, `project_changes`) חייבת להיות מוחלת לפני זו.**
--    נמדד 14/08/2026 13:00 מול המסד החי: `project_changes` **אינה קיימת** (‏0 שורות ב-`pg_class`)
--    ⇒ ה-FK `logistics_project_change_id_fkey` ייכשל עם `42P01` אם הסדר יתהפך. חותמת-הזמן של
--    שם-הקובץ (`130103`) מאוחרת מזו של B (`114901`) ומזו של C (`115047`) — הסדר נשמר מעצמו.
--
-- =====================================================================================
-- why ① — מדיניות-הקריאה, ולמה השער הוא 'לוגיסטיקה' ולא 'פרויקטים' (‏AR-2 · ‏M6-6):
--   ‏`logistics` היא **deny-all חיה**: ‏`relrowsecurity = true` ו-**אפס policies** (נמדד
--   14/08/2026 13:00). זה נכשל בצורה הגרועה ביותר — השאילתה מהדפדפן חוזרת `{data: [], error: null}`,
--   ולכן כלל "אפס שורות ⇒ הושלם" יסמן **כל** פרויקט כמוכן-לוגיסטית. **המסך משקר, לא נכשל.**
--
--   🔴 **והשער חייב להיות `'לוגיסטיקה'`. שער `'פרויקטים'` היה דולף — נמדד, לא הונח:**
--     | תפקיד | הרשאה על 'לוגיסטיקה' | הרשאה על 'פרויקטים' |
--     |---|---|---|
--     | מנכ"ל               | edit    | edit |
--     | מנהלת לוגיסטיקה     | edit    | edit |
--     | מנהלת פרויקטים      | **view**| edit |
--     | מנהלת כספים ולקוחות | **blocked** | **view** ← הדליפה |
--     | מנהלת גיוס ושיבוץ   | **blocked** | **view** ← הדליפה |
--   ⇒ שער `'פרויקטים'` היה פותח את הלוגיסטיקה בפני שתי בעלות-תפקיד שהמטריצה חוסמת במפורש,
--     ובאותה נשימה **לא** היה פוגע במנהלת פרויקטים (יש לה `view` על 'לוגיסטיקה' ממילא).
--     כלומר: השער הנכון אינו מקצץ אף אחד — הוא רק מונע את הדליפה.
--
--   ⚠️ **`module_name` היא מחרוזת עברית שמושווית בייט-בבייט**, ואף קובץ בריפו אינו נושא את
--     האיות הקנוני (שורות `modules` נזרעו ביד ב-Supabase). ⇒ **נקראה חיה לפני הכתיבה:**
--     `module_id = 5` · `module_name = 'לוגיסטיקה'` · `length = 9` ·
--     hex UTF-8 = `d79cd795d792d799d7a1d798d799d7a7d794`. הבייטים כאן הם העתק של מה שחזר.
--
--   הצורה היא **עותק מדויק של תבנית §7.21**, שהועתקה מ-`projects_select_by_permission`
--   כפי שהיא חיה במסד היום (נקראה מ-`pg_policies` באותה מדידה) — כולל העטיפה `(select ...)`
--   סביב `current_user_role_id()` וסביב תת-השאילתה על `modules`. ⚠️ **העטיפה אינה קישוט:**
--   היא מה שגורם ל-Postgres להעריך את הביטוי **פעם אחת לשאילתה** במקום פעם-לכל-שורה
--   (‏`initPlan`), וזו ההמלצה המפורשת של יועץ-הביצועים של Supabase.
--
--   🚫 **ואין ולו מדיניות-כתיבה אחת כאן — במתכוון.** ‏`logistics` היא טבלת-מודול-5;
--   ‏M6 פותח **קריאה** בלבד כדי שמשטח 3 יפסיק לשקר. מדיניות ה-INSERT/UPDATE/DELETE הן של
--   מודול 5 להוסיף (‏M5-contract פריט 7), וכתיבות M6 עוברות דרך RPC ב-`SECURITY DEFINER`.
--
-- =====================================================================================
-- why ② — שתי עמודות-המקור (‏⑬ + ㉗ · ‏AS-7 · ‏M6-5):
--   ⑬ (ישי, 13/08/2026): *"`quote_services` מחזיקה `color`; `logistics` אינה ⇒ שתי
--   שורות-לוגיסטיקה זהות, ואי-אפשר לדעת איזו עלות מוקפאת שייכת לאיזו."*
--   ㉗ מתקן את ההיקף: זו בעיית **מימוש**, לא בעיית כסף — הכסף חי ב-`quote_services` וב-
--   `project_changes`. ⇒ שורת-לוגיסטיקה מקבלת **מקור**: שורת-הצעה **או** שורת-שינוי.
--
--   🔴 **‏`quote_services.line_id` קיים, והוא המפתח הראשי — נמדד, לא הונח:**
--   `pg_constraint` מחזיר `quote_services_pkey PRIMARY KEY (line_id)`, והעמודה היא
--   `bigint`, `identity ALWAYS`, `not null`. ⇒ יעד-FK חוקי, וסוג העמודה המצביעה חייב להיות
--   `bigint`. **אין צורך במפתח-חלופי חדש ואין צורך ב-FK תלת-עמודתי** — הטענה ההפוכה
--   ב-`screens-approved §נספח③` קראה את בלוק ה-`CREATE TABLE` המקורי ולא את ה-`ALTER`
--   שהחליף אותו. ⚠️ שים לב ש-`quote_services_quote_line_key` הוא `UNIQUE (quote_id, line_number)`
--   — כלומר **(quote_id, sku) אינו ייחודי**, וזו בדיוק הנקודה של ⑬.
--
--   `project_changes.change_id` הוא ה-PK של הטבלה שמיגרציה B יוצרת
--   (`project_changes_pkey primary key (change_id)`, `bigint generated always as identity`).
--
--   `on delete restrict` בשני ה-FK: מחיקת שורת-הצעה או שורת-שינוי שכבר הולידה לוגיסטיקה
--   הייתה מותירה שורת-מימוש יתומה שאיש אינו יודע מאין באה. **ההיסטוריה נחסמת, לא נמחקת** —
--   אותו דפוס בדיוק כמו `logistics_sku_fkey` ו-`quote_services_sku_fkey` (נמדדו חיים).
--
-- =====================================================================================
-- why ③ — צורת ה-CHECK, וזו ההכרעה המרכזית של הצעד. 🔴 **קרא לפני שאתה "מהדק" אותו:**
--
--   **המדידה שמכתיבה הכול:** ‏`select count(*) from public.logistics` → **6 שורות**
--   (‏3 פרויקטים: 3 · 7 · 8), כולן נולדו לפני מ6 ואין להן מקור. ⇒ אילוץ
--   `num_nonnulls(...) = 1` "עירום" **מפיל את המיגרציה בהחלה** על 6 השורות האלה.
--
--   נשקלו שלוש דרכים, ונבחרה השלישית:
--
--   🚫 **(א) `not valid` — נדחתה, וזו הסיבה החשובה ביותר בקובץ הזה.**
--     ‏`NOT VALID` מדלג על אימות השורות ה**קיימות** — אך **אוכף במלואו על כל שורה חדשה.**
--     והכותב היחיד ל-`logistics` במסד הוא `approve_quote_and_create_project`
--     (‏`SECURITY DEFINER`; נמדד — **זו הפונקציה היחידה בכל `public` שנוגעת ב-`logistics`**),
--     והוא כותב כך, מילה-במילה מגוף-הפונקציה החי:
--         insert into public.logistics (project_id, sku, serial_number, planned_qty)
--         select v_project_id, qs.sku, row_number() over (order by qs.line_number), qs.qty
--           from public.quote_services qs join public.products pr on pr.sku = qs.sku
--          where qs.quote_id = p_quote_id and pr.category <> 'hostess';
--     ⇒ **שתי עמודות-המקור נשארות NULL בכל אישור-הצעה חדש.** אילוץ `= 1` ב-`not valid`
--     היה מפיל **כל אישור-הצעה מהיום והלאה** עם `23514`. ‏🔴 **וזה קוד M3 ממוזג, ומ6 אינו
--     עורך אותו במודול הזה** (‏`🚧 מ5 ← מ6` פריט 1) ⇒ אין דרך לתקן את זה כאן.
--     **`not valid` כאן אינו "דחיית-אימות" — הוא שבירת-ייצור בתחפושת.**
--
--   🚫 **(ב) Backfill — נדחה, בשתי רמות.**
--     ‏**(ב1) גיבוי מיקומי לפי `serial_number` — שגוי הוכחתית.** ה-RPC מריץ
--     `row_number() over (order by qs.line_number)` **אחרי** שסינן שורות-דיילות
--     (`pr.category <> 'hostess'`) ⇒ המונה מוסט. נמדד על פרויקט **#8** (הצעה 6):
--     בהצעה `B-REG-TAG` הוא `line_number = 2` (שורה 1 היא `04ST`, קטגוריית דיילות שסוננה),
--     ואילו ב-`logistics` הוא `serial_number = 1`. **חיבור מיקומי היה תולה כל שורה במקור הלא-נכון.**
--     ‏**(ב2) גיבוי לפי `sku` — עובד היום ושקרי מחר, ולכן נדחה.** נמדד: אפס זוגות
--     `(quote_id, sku)` כפולים בכל `quote_services` ⇒ חיבור לפי מק"ט היה חד-ערכי **לשש
--     השורות הקיימות**. אבל הסכמה **אינה אוכפת** את הייחודיות הזאת (‏`UNIQUE` הוא על
--     `(quote_id, line_number)`), ו-⑬ **מניחה במפורש** שאותו מק"ט בשני צבעים הוא מצב חוקי.
--     ⇒ גיבוי כזה נכון עד ההצעה הראשונה עם שני צבעים, ואז מכפיל שורות **בשקט**.
--     ‏🔴 **והנימוק שסוגר את הדיון: גיבוי אינו קונה כלום.** גם אחרי גיבוי מושלם של 6 השורות,
--     ה-RPC של M3 ממשיך לכתוב שורות ריקות-מקור ⇒ האילוץ עדיין אינו יכול להיות `= 1` עירום.
--     **גיבוי כאן הוא כתיבת-נתונים שמשלמים עליה ולא מקבלים תמורתה שום הידוק.**
--
--   ✅ **(ג) הצורה שנבחרה — CHECK שמתיר all-NULL, ומוחל VALID מיידית.**
--     המשמעות המדויקת, ואין להתבלבל בה: **"לעולם לא שניהם" — לא "בדיוק אחד".**
--     האילוץ אוסר את ה**סתירה** (שני מקורות לשורה אחת) ואינו אוכף **נוכחות** של מקור.
--     ⚠️ ‏CHECK אינו יכול להבחין בין "שורה ישנה" ל"שורה חדשה" ⇒ ההיתר הזה **תקף לתמיד**,
--     לא רק לשש השורות הישנות. הפער נסגר כשהכותב יתוקן — `🚧 מ5 ← מ6` פריט 1.
--     ‏`num_nonnulls` היא פונקציית-ליבה של Postgres (נמדד: קיימת ב-`pg_catalog`; המסד 17.6).
--
-- =====================================================================================
-- why ④ — אינדקס לכל FK: יועץ-הביצועים של Supabase מסמן **מפתח-זר בלי אינדקס על העמודה
--   המצביעה**. קונבנציית-השם `<טבלה>_<עמודה>_idx` נגזרת מהאחיות `logistics_sku_idx` ו-
--   `quote_services_sku_idx` (נמדדו חיים). 🔴 **והשמות כאן הם חוזה:** צעד 1.10 בודק את שבעת
--   השמות האלה **בשמם המפורש**, ושם שנגזר אוטומטית = בדיקה שנופלת בלי סיבה אמיתית.
--
-- הפיכוּת: מלאה, ובפקודות מפורשות —
--     drop policy "logistics_select_by_permission" on public.logistics;
--     drop index  public.logistics_quote_service_line_id_idx;
--     drop index  public.logistics_project_change_id_idx;
--     alter table public.logistics drop constraint logistics_origin_exactly_one;
--     alter table public.logistics drop column quote_service_line_id;
--     alter table public.logistics drop column project_change_id;
--   שתי העמודות נוספות כ-nullable בלי DEFAULT ⇒ **אין שכתוב-טבלה ואין נעילה ארוכה**.
--   הוספת policy אינה נועלת. אין השפעה על Seed ואין השפעה על Storage.
-- =====================================================================================

-- ① מדיניות-הקריאה (‏AR-2 · ‏M6-6) — SELECT בלבד, שער 'לוגיסטיקה', רמות ('edit','view').
create policy "logistics_select_by_permission" on public.logistics for select to authenticated
  using (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'לוגיסטיקה')
      and p.permission_level in ('edit', 'view')));

-- ② שתי עמודות-המקור (‏⑬ + ㉗ · ‏AS-7). `bigint` בשתיהן — כסוג המפתחות שהן מצביעות אליהם.
alter table public.logistics
  add column quote_service_line_id bigint,
  add column project_change_id     bigint;

-- שני ה-FK בשמם המפורש (צעד 1.10 סופר אותם בשם, כחלק משבעת ה-FK החדשים של הפזה).
alter table public.logistics
  add constraint logistics_quote_service_line_id_fkey
    foreign key (quote_service_line_id) references public.quote_services (line_id)
    on delete restrict;

alter table public.logistics
  add constraint logistics_project_change_id_fkey
    foreign key (project_change_id) references public.project_changes (change_id)
    on delete restrict;

-- 🔴 האילוץ, בצורה שנומקה ב-why ③: **לעולם לא שניהם.** ה-`is null and is null` הראשון
--    הוא מה שמתיר את 6 השורות שנולדו לפני מ6 (ואת אלה שה-RPC של M3 ימשיך לכתוב עד
--    שיתוקן ב-`🚧 מ5 ← מ6` פריט 1); ה-`num_nonnulls(...) = 1` הוא האכיפה עצמה.
alter table public.logistics
  add constraint logistics_origin_exactly_one check (
    (quote_service_line_id is null and project_change_id is null)   -- שורות ללא מקור — הותר במכוון
    or num_nonnulls(quote_service_line_id, project_change_id) = 1); -- ומעולם לא שתיהן

-- ③ אינדקס לכל FK (why ④). השמות נבדקים בשמם בצעד 1.10.
create index logistics_quote_service_line_id_idx on public.logistics (quote_service_line_id);
create index logistics_project_change_id_idx     on public.logistics (project_change_id);

comment on column public.logistics.quote_service_line_id is
  'מקור השורה: שורת ההצעה שהולידה אותה (⑬/㉗). NULL בשורות שנולדו לפני מ6 ובשורות שה-RPC של מ3 כותב עד תיקונו — 🚧 מ5 ← מ6 פריט 1.';
comment on column public.logistics.project_change_id is
  'מקור השורה: שורת שינוי-התכולה שהולידה אותה (⑬/㉗). בדיוק אחת משתי עמודות-המקור מלאה, או שתיהן NULL.';
