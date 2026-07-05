-- תיקון רקורסיה: הגרסה הקודמת השתמשה ב-subquery על users בתוך policy של users
-- => infinite recursion. משתמשים בפונקציית העזר current_user_role_id() (SECURITY DEFINER,
-- עוקפת RLS, כבר בשימוש חסין-רקורסיה ב-users_write_ceo_only) כדי להקפיא את role_id,
-- ו-status='active' כערך קבוע (משתמש שמעדכן פרופיל הוא בהכרח active; אין פיצ'ר השבתה-עצמית).
drop policy if exists "users_update_self" on users;

create policy "users_update_self" on users
  for update to authenticated
  using (email = auth.email())
  with check (
    email = auth.email()
    and role_id = current_user_role_id()
    and status = 'active'
  );
