-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 4 (A) — צמצום הרשאות האחסון לקבצי שכר
-- =============================================================================
-- why: קובץ דוח שכר שהופק הוא הראיה למה שנשלח לרו"ח. היום כל משתמש כספים-edit יכול
-- לדרוס (upsert) או למחוק אותו מהדפדפן. אחרי המיגרציה:
--   * payroll/…        — רק פונקציית השרת (service role) כותבת. אף משתמש לא מעלה, לא דורס
--                         ולא מוחק.
--   * salary_reports/… — הדיאלוג הישן עדיין מעלה קובץ חדש (upsert:false = INSERT), אבל
--                         אף משתמש לא דורס ולא מוחק.
--   * קריאה (SELECT) לא השתנתה: edit ו-view ממשיכים להוריד מההיסטוריה.
--   * חשבוניות (<project_id>/…) לא הושפעו.
--
-- 🔑 הידוק בטוח: אף קוד פרוס לא מעדכן או מוחק בנתיבים האלה (נבדק ב-api.js: ההעלאה
--    היחידה היא upload(..., {upsert:false}) ל-salary_reports/).
-- 🔑 הכול בטרנזקציה אחת: drop ו-create של כל policy צמודים, כך שאין רגע בלי policy.
-- הנוסח: הטקסט החי של שלוש ה-policies (13.10.2026) + תנאי ההחרגה בלבד.
-- =============================================================================

drop policy if exists finance_insert_by_permission on storage.objects;
create policy finance_insert_by_permission on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'finance'
    and name not like 'payroll/%'
    and exists (
      select 1 from public.permissions p
       where p.role_id = (select public.current_user_role_id())
         and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'כספים')
         and p.permission_level = 'edit'
    )
  );

drop policy if exists finance_update_by_permission on storage.objects;
create policy finance_update_by_permission on storage.objects
  for update to authenticated
  using (
    bucket_id = 'finance'
    and name not like 'payroll/%'
    and name not like 'salary_reports/%'
    and exists (
      select 1 from public.permissions p
       where p.role_id = (select public.current_user_role_id())
         and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'כספים')
         and p.permission_level = 'edit'
    )
  )
  with check (
    bucket_id = 'finance'
    and name not like 'payroll/%'
    and name not like 'salary_reports/%'
    and exists (
      select 1 from public.permissions p
       where p.role_id = (select public.current_user_role_id())
         and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'כספים')
         and p.permission_level = 'edit'
    )
  );

drop policy if exists finance_delete_by_permission on storage.objects;
create policy finance_delete_by_permission on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'finance'
    and name not like 'payroll/%'
    and name not like 'salary_reports/%'
    and exists (
      select 1 from public.permissions p
       where p.role_id = (select public.current_user_role_id())
         and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'כספים')
         and p.permission_level = 'edit'
    )
  );
