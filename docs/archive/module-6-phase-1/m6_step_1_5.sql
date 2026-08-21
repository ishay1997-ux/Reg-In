-- =====================================================================================
-- Module 6 (פרויקטים) · Phase 1 · Step 1.5 · Migration E
-- יעד: supabase/migrations/<ts>_module6_storage_reports_and_finance.sql
-- נכתב 14/08/2026 11:51
-- =====================================================================================
-- למה (why):
--   ㉛ (processes-approved, מודול 6) קבע **שלושה buckets, לא ארבעה ולא אחד — לפי מספר
--   כללי-הגישה השונים, ולא לפי מספר סוגי-הקבצים**:
--     · `marketing` — קיים, **ציבורי** (מ2, מיגרציה 20260710160735). bucket ציבורי עוקף
--       בקרת-גישה בקריאה — מי שיש לו הקישור רואה ⇒ מתאים לשיווק בלבד.
--     · `reports`  — 🆕 **פרטי**. דוח-הסיכום שחובה להעלות בסגירה התפעולית של הפרויקט.
--       כללי-הגישה שלו = מודול 'פרויקטים'.
--     · `finance`  — 🆕 **פרטי**. חשבוניות/קבצי-שכר. כללי-הגישה שלו = מודול 'כספים'
--       (AS-4: **אפס כותבים במודול 6** — מודול 8 הוא הכותב; המדיניות נוצרת כבר עכשיו).
--   ⚠️ אין ערובה טרנזקציונית בין Storage ל-Postgres ⇒ האכיפה האמיתית שהפרויקט לא ייסגר
--   בלי דוח היא ה-CHECK ‏`projects_closed_needs_report` שכבר נוסף בצעד 1.1 — לא הקובץ.
--   *(שם-האילוץ עודכן כאן 14/08/2026 בסבב-הבקרה, יחד עם 1.1 ו-1.10 — ראה
--    `m6_step_1_1.notes.md` §"מה תוקן בסבב הבקרה" ①.)*
--
-- 🔴 `reports.file_size_limit = 2097152` (2 MiB) — **הכרעה, לא העדפה**
--    (`db_roadmap` §5 שורת `reports`, ישי 14/08/2026 בהאצלה). 🚫 לא 10 MiB שהועתקו
--    מ-`marketing`, ו-🚫 לא 3 MiB: `src/lib/email.js:29` חוסם ב-
--    `MAX_ATTACHMENT_BASE64_CHARS = 4_000_000`, ו-base64 מקודד 3 בתים ל-4 תווים ⇒
--    **הקיר הבינארי הקשיח הוא בדיוק 3,000,000 בתים ≈ 2.86 MiB**. bucket של 3 MiB
--    (3,145,728) עדיין היה מקבל קובץ שנכשל בשליחה. 2 MiB מותיר ~900 KB למעטפת ה-JSON.
-- ⚠️ `finance` **לא הוכרע** — רק `reports` הוכרע, כי רק קבציו נוסעים בדואר.
--    `finance` שומר על תקדים `marketing` (10 MiB). האסימטריה היא החלטה, לא טעות-הקלדה.
--
-- ⚠️⚠️ תאומים בלי קשר מכני (אותה אזהרה שכבר יושבת ב-`docs/schema.sql:728` על `marketing`):
--    הערך `2097152` כאן הוא ה**תאום** של `REPORT_MAX_BYTES = 2 * 1024 * 1024` שייכתב
--    ב-`src/modules/06_projects/api.js`, ושממנו נגזר טקסט-העזר במסך
--    (*"‏PDF · JPG · PNG · עד 2MB…"* — הספרה מרונדרת מהקבוע, לעולם לא מוקלדת).
--    🚫 אין להשתמש מחדש ב-`MARKETING_MAX_BYTES` — הוא 10MB ושייך ל-bucket אחר.
--    שינוי צד אחד בלי השני = הלקוח דוחה קובץ שהשרת היה מקבל, או להפך (שגיאה גולמית).
--
-- מקור-התבנית: `20260710160735_module2_customers_surrogate_key_rls_and_marketing.sql:114-153`
--    (bucket `marketing` + 4 מדיניות). ⚠️ **שמות-המדיניות נשמרים בקונבנציה החיה:**
--    ה-SELECT נקרא `_read_` ולא `_select_` (אומת מול `pg_policies`, 14/08/2026).
--
-- ⚠️ מצב-כשל ידוע (`20260710160735:9-10`): הסכמה `storage` בבעלות
--    `supabase_storage_admin`, ו-`create policy` עלול להיכשל ב-**42501**. אם זה קורה —
--    🚫 **לא לעקוף ב-SQL**: יוצרים את שמונה המדיניות דרך ה-Supabase Dashboard
--    (אותם שמות בדיוק) ורושמים ב-§10 עם נוסח-השגיאה המדויק.
--    🔴 נמדד 14/08/2026: `postgres` **אינו** חבר ב-`supabase_storage_admin`
--    (`pg_has_role` = false) ⇒ הסיכון כאן הוא ממשי, לא תיאורטי. ראה קובץ ההערות.
-- =====================================================================================

-- ─────────────────────────────────────────────────────────────────────────────────────
-- (1) שני ה-buckets החדשים — שניהם פרטיים
-- ─────────────────────────────────────────────────────────────────────────────────────
-- שורת ה-INSERT ל-`storage.buckets` = Seed-תצורה חד-פעמי (אותו חריג של roles/modules/params),
-- לא דאטה עסקי. `on conflict do nothing` — כתקדים `marketing`.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('reports', 'reports', false, 2097152,   -- 🔴 2 MiB — הכרעה (AS-3 / db_roadmap §5)
   array['application/pdf', 'image/jpeg', 'image/png']),
  ('finance', 'finance', false, 10485760,  -- 10 MiB — תקדים `marketing`, לא הוכרע (M8 יחליט)
   array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────────────
-- (2) ארבע מדיניות ל-bucket `reports` — שער: מודול 'פרויקטים'
-- ─────────────────────────────────────────────────────────────────────────────────────
-- קריאה = `edit` או `view` (חמשת התפקידים רואים את כרטיס-הפרויקט);
-- כתיבה/עדכון/מחיקה = `edit` בלבד. `bucket_id` נבדק **לפני** ה-`exists` על ההרשאות.
create policy "reports_read_by_permission" on storage.objects for select to authenticated
  using (bucket_id = 'reports' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
      and p.permission_level in ('edit', 'view')
  ));

create policy "reports_insert_by_permission" on storage.objects for insert to authenticated
  with check (bucket_id = 'reports' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
      and p.permission_level = 'edit'
  ));

create policy "reports_update_by_permission" on storage.objects for update to authenticated
  using (bucket_id = 'reports' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
      and p.permission_level = 'edit'
  ))
  with check (bucket_id = 'reports' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
      and p.permission_level = 'edit'
  ));

-- למה DELETE בכלל קיימת: `spec.md` §2.2 — "מעלים את הקובץ ⇒ RPC אחד כותב את הנתיב ומעביר
-- סטטוס באותה טרנזקציה ⇒ נכשל ⇒ **מוחקים את הקובץ**". בלי DELETE, כישלון-RPC משאיר קובץ יתום.
create policy "reports_delete_by_permission" on storage.objects for delete to authenticated
  using (bucket_id = 'reports' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
      and p.permission_level = 'edit'
  ));

-- ─────────────────────────────────────────────────────────────────────────────────────
-- (3) ארבע מדיניות ל-bucket `finance` — שער: מודול 'כספים'
-- ─────────────────────────────────────────────────────────────────────────────────────
-- 🔴 שער שונה בכוונה (㉘/AS-4): 'כספים' ולא 'פרויקטים'. בפועל היום זה מנכ"ל + מנהלת
-- כספים ולקוחות בלבד; שלושת התפקידים האחרים `blocked` על 'כספים' ⇒ אפס גישה, גם בקריאה.
-- מודול 6 אינו כותב לכאן כלל — מודול 8 הוא הכותב (AS-4).
create policy "finance_read_by_permission" on storage.objects for select to authenticated
  using (bucket_id = 'finance' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'כספים')
      and p.permission_level in ('edit', 'view')
  ));

create policy "finance_insert_by_permission" on storage.objects for insert to authenticated
  with check (bucket_id = 'finance' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'כספים')
      and p.permission_level = 'edit'
  ));

create policy "finance_update_by_permission" on storage.objects for update to authenticated
  using (bucket_id = 'finance' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'כספים')
      and p.permission_level = 'edit'
  ))
  with check (bucket_id = 'finance' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'כספים')
      and p.permission_level = 'edit'
  ));

create policy "finance_delete_by_permission" on storage.objects for delete to authenticated
  using (bucket_id = 'finance' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'כספים')
      and p.permission_level = 'edit'
  ));

-- =====================================================================================
-- אימות אחרי ההחלה (להריץ ידנית, לא חלק מהמיגרציה):
--   select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id;
--     ⇒ שלוש שורות: finance(false,10485760) · marketing(true,10485760) · reports(false,2097152)
--   select policyname, cmd from pg_policies
--     where schemaname='storage' and tablename='objects' order by policyname;
--     ⇒ **12** שורות (4 של marketing שהיו + 8 חדשות)
-- שחזור (reversible במלואו):
--   drop policy "reports_read_by_permission"   on storage.objects;  (וכן לשבע האחרות)
--   delete from storage.buckets where id in ('reports','finance');   -- בטוח כל עוד ריקים
-- =====================================================================================
