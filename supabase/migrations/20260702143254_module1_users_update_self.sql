-- מודול 1: מדיניות עדכון-עצמי בטוחה מפני הסלמת הרשאות.
-- מאפשרת למשתמש מחובר לעדכן את השורה שלו בלבד (phone/full_name), אך מקפיאה
-- את role_id ו-status לערכם הקודם (WITH CHECK קורא את הסנפשוט לפני העדכון),
-- כדי למנוע הפיכה-עצמית למנכ"ל או שחזור-עצמי מ-inactive ל-active.
-- מדיניות permissive, מתווספת ל-users_write_ceo_only ב-OR (לא פוגעת ביכולות המנכ"ל).
create policy "users_update_self" on users
  for update to authenticated
  using (email = auth.email())
  with check (
    email = auth.email()
    and role_id = (select u.role_id from users u where u.email = auth.email())
    and status  = (select u.status  from users u where u.email = auth.email())
  );
