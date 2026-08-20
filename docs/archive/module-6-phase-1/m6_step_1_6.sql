-- =====================================================================================
-- Module 6 (פרויקטים) · Phase 1 · Step 1.6 · Migration F
-- יעד: supabase/migrations/<ts>_module6_email_log_accepts_project.sql
-- נכתב 14/08/2026 12:58
-- =====================================================================================
-- למה (why):
--   מודול 6 שולח **ארבעה** סוגי-מייל: ביטול-אירוע · פרטי-האירוע-השתנו · סקר-משוב ·
--   ודוח-הסיכום ללקוח. ה-CHECK החי על `email_log.entity_type` מכיר **שני** ערכים בלבד —
--   `'quote'` ו-`'shift'` (נמדד חי 14/08/2026 12:5X, ראה קובץ ההערות) — ולכן כל שליחה
--   של מ6 הייתה **יוצאת** ו**היומן היה נשאר ריק, בשקט**: `send-email` בולעת כשל-יומן
--   בכוונה (`index.ts:163-168`), כי המייל כבר יצא ולומר "נכשל" היה גורר שליחה כפולה.
--
-- 🔴 **שני ערכים ולא אחד — וזו כל הנקודה של AR-8:**
--     · `'project'`        — ביטול · פרטים-השתנו · סקר-משוב. **בלי מצורף.**
--     · `'project_report'` — דוח-הסיכום ללקוח. **עם מצורף חובה.**
--   ‏`ENTITY_REQUIRES_ATTACHMENT` בפונקציית-השרת הוא **פר-`entity_type`**, ומ6 שולח את
--   שני הסוגים. הפיכת המצורף לרשות באופן גורף הייתה מוחקת שומר חי מנתיב הצעת-המחיר
--   (`index.ts:34-36`: *"ואף בדיקה קיימת לא הייתה נופלת על כך"*) ⇒ שני ערכים נפרדים.
--   **שניהם ממופים לאותו מודול — `'פרויקטים'`** — ולכן **policy אחת** מכסה את שניהם.
--
-- 🔴 **למה לא למחזר את `'shift'` — נמדד, לא הוסק:**
--   ‏`index.ts:116` דורש `permission_level === 'edit'`, ו-`ENTITY_MODULE.shift = 'דיילות'`.
--   נמדד חי מ-`permissions × roles × modules` (14/08/2026):
--     · **מנהלת פרויקטים על 'דיילות' = `view`** — לא `edit`.
--     · מנהלת פרויקטים על 'פרויקטים' = `edit`. ✅
--   ⇒ אילו מ6 היה שולח תחת `'shift'`, **כל מייל-ביטול שמנהלת הפרויקטים שולחת היה נדחה
--   ‏403 בשקט, ואף דיילת לא הייתה שומעת דבר.** תחת `'project'` היא עוברת את השער.
--
-- 🚫 **ולא מרחיבים policy קיימת.** `db_roadmap` A-20 קבע כהודעה-קדימה שכל מודול מוסיף
--   policy משלו. הרחבה גורפת הייתה פותחת את יומן-ההצעות למנהלת הגיוס.
--   ⚠️ **A-20 עצמה טעונה תיקון:** היא כותבת *"M4/M8/M11 each widen the CHECK by one
--   value"* — **מ6 אינו ברשימה, והוא מרחיב בשניים.** התיקון אינו במיגרציה הזו (ר' הערות).
--
-- 🔴 **סדר-הפריסה — המיגרציה והפונקציה הן צעד אחד:**
--   ‏`index.ts:26-28`: *"מ8/מ11 יוסיפו את הערך שלהם **יחד עם המיגרציה שמרחיבה את
--   ה-CHECK**, לא לפניה."* ⇒ **קודם המיגרציה, מיד אחריה פריסת הפונקציה, באותו צעד.**
--   ‏פריסת-פונקציה לפני המיגרציה = "המייל יוצא והיומן נשאר ריק". ה-diff המדויק
--   ל-`supabase/functions/send-email/index.ts` נמצא בקובץ ההערות.
--
-- 🔁 **הפיכוּת:** ה-policy נמחקת בשורה אחת. ה-CHECK חוזר לצורתו הקודמת (שני ערכים)
--   **כל עוד אין שורות `'project'`/`'project_report'`** — נמדד היום: אפס. מרגע שיצא
--   מייל-מ6 ראשון, צמצום-חוזר יידרוש מחיקת-היסטוריה, ובפרויקט הזה לא מוחקים (§7.11).
--   ⇒ **לומר זאת במפורש בשער ה-typed-echo.**
--   אין כאן מחיקת עמודה, שינוי-טיפוס, FK, טריגר, timestamps, Seed או נגיעה ב-Storage.
--
-- 🔒 **נעילה:** ‏`ADD CONSTRAINT ... CHECK` מבצע סריקת-אימות של הטבלה תחת
--   `ACCESS EXCLUSIVE`. `email_log` מנתה **26 שורות** בעת הכתיבה (5 `quote` · 21 `shift`),
--   כולן עוברות ⇒ הנעילה היא שברירי-שנייה.
--
-- מקור-התבנית: `20260809085058_module4_email_log_accepts_shift.sql` (מ4, אותו דפוס בדיוק),
--   ותבנית §7.21 — כולל עטיפת `(select …)`, שבלעדיה Postgres מריץ את תת-השאילתה
--   פר-שורה (initplan) והקריאה מתנוונת. אומת מול `pg_policies` החי, 14/08/2026.
-- =====================================================================================

-- ─────────────────────────────────────────────────────────────────────────────────────
-- (1) הרחבת ה-CHECK משני ערכים לארבעה
-- ─────────────────────────────────────────────────────────────────────────────────────
-- ⚠️ **נבנה מהפלט החי, לא מהזיכרון.** ‏`pg_get_constraintdef` החזיר 14/08/2026:
--    `CHECK ((entity_type = ANY (ARRAY['quote'::text, 'shift'::text])))`
--    ⇒ שני הערכים הקיימים משוחזרים כלשונם. **הפלת ערך כאן הייתה שוברת בשקט את מ3 או מ4.**
-- ⚠️ מוחקים ויוצרים מחדש **בשם זהה** — `email_log_entity_type_check` — כדי שהשם יישאר
--    צפוי למי שיחפש אותו, וכדי שבדיקת-הקבלה של צעד 1.10 (`B-EML`) תמצא אותו.
alter table public.email_log drop constraint email_log_entity_type_check;

alter table public.email_log
  add constraint email_log_entity_type_check
  check (entity_type in ('quote', 'shift', 'project', 'project_report'));

-- ─────────────────────────────────────────────────────────────────────────────────────
-- (2) ה-policy השלישית — קריאה, שער 'פרויקטים', מכסה את **שני** הערכים החדשים
-- ─────────────────────────────────────────────────────────────────────────────────────
-- ‏`edit` **וגם** `view`: חמשת התפקידים רואים את כרטיס-הפרויקט (מנהלת גיוס ומנהלת כספים
-- הן `view` על 'פרויקטים'), והיומן הוא מידע לצפייה.
-- הכתיבה נשארת ל-service-role בלבד — **אין policy-כתיבה, ובכוונה**: יומן שהדפדפן יכול
-- לכתוב אליו אינו ראיה (`index.ts:159-161`).
create policy "email_log_select_projects_module" on public.email_log for select to authenticated
  using (entity_type in ('project', 'project_report') and exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'פרויקטים')
      and p.permission_level in ('edit', 'view')));

-- =====================================================================================
-- 🔻👤 אימות (להריץ אחרי ההחלה — קריאה בלבד)
-- =====================================================================================
-- select conname, pg_get_constraintdef(oid) from pg_constraint
--  where conrelid='public.email_log'::regclass and contype='c';
--   ⇒ מצופה: `email_log_entity_type_check` מונה את **ארבעת** הערכים.
--
-- select policyname from pg_policies where tablename='email_log' order by policyname;
--   ⇒ מצופה **שלוש** שורות:
--      email_log_select_projects_module · email_log_select_quotes_module ·
--      email_log_select_shifts_module
--
-- ואז, **באותו צעד**, פריסת הפונקציה (👤) ו:
--   npx deno check --node-modules-dir=none supabase/functions/send-email/index.ts  → exit 0
--
-- =====================================================================================
-- 🔁 ביטול (down) — לתיעוד בלבד, **לא להריץ בלי הכרעת-ישי**
-- =====================================================================================
-- drop policy "email_log_select_projects_module" on public.email_log;
-- alter table public.email_log drop constraint email_log_entity_type_check;
-- alter table public.email_log
--   add constraint email_log_entity_type_check
--   check (entity_type in ('quote', 'shift'));
-- ⚠️ הצמצום נכשל אם קיימת ולו שורת `'project'`/`'project_report'` אחת. בדיקה לפני:
--   select entity_type, count(*) from public.email_log group by 1;
