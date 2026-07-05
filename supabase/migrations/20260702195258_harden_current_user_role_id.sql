-- הקשחת פונקציית העזר current_user_role_id (מודול 1):
-- (1) קיבוע search_path='' + שמות סכמה מלאים (public.users, auth.email) — מונע חטיפת search_path
--     בפונקציית SECURITY DEFINER (וקטור הסלמת-הרשאות ידוע). מנקה את אזהרת function_search_path_mutable.
-- (2) הסרת EXECUTE מ-PUBLIC ו-anon — הפונקציה נחוצה רק בתוך policies (רצות בהקשר authenticated),
--     אין סיבה שתהיה חשופה כ-RPC ל-anon. authenticated נשאר עם EXECUTE (הרשאה מפורשת קיימת) —
--     הסרתו הייתה שוברת כל בדיקת RLS שקוראת לפונקציה, ולכן אזהרת authenticated_* נשארת במכוון.
create or replace function public.current_user_role_id()
  returns integer
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select role_id from public.users where email = auth.email() and status = 'active';
$$;

revoke execute on function public.current_user_role_id() from public, anon;
