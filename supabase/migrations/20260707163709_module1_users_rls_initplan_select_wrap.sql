-- תיקון לינט auth_rls_initplan (מודול 1): עטיפת קריאות auth.email() ו-current_user_role_id()
-- ב-(select …) בשתי ה-policies שה-advisor סימן על users — כך Postgres מחשב אותן פעם אחת
-- לשאילתה (InitPlan) במקום פעם לשורה. זהות התנהגותית מלאה — שינוי ביצועים בלבד.
-- שתי ה-policies האחרות (users_write_ceo_only, permissions_write_ceo_only) לא סומנו ולא נגענו —
-- מזעור דיף על משטח אבטחה סגור. במקביל עודכנה תבנית §7.21 ב-PROJECT_MASTER באותו סשן —
-- ממודול 2 כל policy חדשה נולדת עטופה.

drop policy if exists "users_select_self_or_ceo" on users;
create policy "users_select_self_or_ceo" on users for select to authenticated
  using (
    email = (select auth.email())
    or (select current_user_role_id()) = (select role_id from roles where role_name = 'מנכ"ל')
  );

-- הרציונל המקורי של users_update_self נשמר אחד-לאחד (הקפאת role_id דרך פונקציית העזר
-- חסינת-הרקורסיה, status='active' קבוע — ראו 20260702143405); רק העטיפה נוספה.
drop policy if exists "users_update_self" on users;
create policy "users_update_self" on users for update to authenticated
  using (email = (select auth.email()))
  with check (
    email = (select auth.email())
    and role_id = (select current_user_role_id())
    and status = 'active'
  );
