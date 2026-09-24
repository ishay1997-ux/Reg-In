-- why: ליטושי-הכנס · חבילה 0ג פריט 4 (`docs/plans/2026-09-24-system-polish.md` §6).
--      "צריכת ציוד" (מ12) אומר "להזמין 2,540…" — ומי שמזמינה, מנהלת הלוגיסטיקה, חסומה על כל לשוניות
--      הדוחות. ⇒ "מה להזמין לחודש הקרוב" מקבל בית במסך הלוגיסטיקה, מ-RPC שגודר 'לוגיסטיקה'.
--      🔑 כלל-ברזל 14 (SSOT): החישוב חי **בפונקציה פנימית אחת** — מ12 עובר לקרוא לה (בלי שינוי
--      בפלט: נבדק לפני/אחרי, md5 של השורות), וה-RPC החדש קורא לאותה פונקציה. לא שני עותקים.
-- what:
--   ① public.m11_upcoming_equipment_orders(p_to, p_customer_id) — פנימית: שורות-ציוד של אירועים
--      ב-30 הימים שאחרי p_to, בלי מבוטלים, לפי מק"ט (כמות · מספר אירועים). בדיוק הגוף של מ12.
--      security invoker + revoke מכולם ⇒ נקראת רק מתוך פונקציות security definer של הבעלים.
--   ② report_m12_equipment — תת-השאילתה של טבלת-ההזמנה מוחלפת בקריאה ל-①. אותה חתימה ⇒ ACL נשמר.
--   ③ public.logistics_upcoming_orders() — RPC חדש, 'לוגיסטיקה' view/edit, מהיום (שעון ישראל).
-- reversible: כן — drop ל-①③ והחלפה הפוכה ב-②. אין שינוי-סכמה בטבלאות ואין נתונים.
-- ישי 24/09/2026, בצ'אט: "אני מאשר לך מראש להכיל מיגרציות בלי לעצור" (ו-0ג אושר: "מאשר הכל לפי המלצתך").

create or replace function public.m11_upcoming_equipment_orders(p_to date, p_customer_id integer default null)
returns jsonb
language sql
stable
security invoker
set search_path to ''
as $f$
  select coalesce(jsonb_agg(t order by (t ->> 'qty')::numeric desc), '[]'::jsonb) from (
    select jsonb_build_object('sku', l.sku, 'item_name', coalesce(pr.item_name, l.sku),
             'qty', sum(l.planned_qty), 'events', count(distinct l.project_id),
             'drill_key', jsonb_build_object('kind', 'sku', 'sku', l.sku, 'upcoming', true)) as t
      from public.logistics l
      join public.projects p on p.project_id = l.project_id
      left join public.products pr on pr.sku = l.sku
     where (p_customer_id is null or p.customer_id = p_customer_id)
       and p.final_event_date > p_to and p.final_event_date <= p_to + 30
       and p.project_status <> 'cancelled'
     group by l.sku, pr.item_name) s
$f$;

revoke execute on function public.m11_upcoming_equipment_orders(date, integer) from public, anon, authenticated;

comment on function public.m11_upcoming_equipment_orders(date, integer) is
  'פנימית (SSOT): "כמה להזמין" ל-30 הימים שאחרי p_to. נקראת מ-report_m12_equipment ומ-logistics_upcoming_orders.';

do $m5$
declare
  v_oid oid;
  v_def text;
  v_old text := $o$(select coalesce(jsonb_agg(t order by (t ->> 'qty')::numeric desc), '[]'::jsonb) from (
            select jsonb_build_object('sku', sku, 'item_name', coalesce(item_name, sku),
                     'qty', sum(planned_qty), 'events', count(distinct project_id),
                     'drill_key', jsonb_build_object('kind', 'sku', 'sku', sku, 'upcoming', true)) as t
              from priced
             where final_event_date > v_to and final_event_date <= v_to + 30
               and project_status <> 'cancelled'
             group by sku, item_name) s),$o$;
  v_new text := $n$public.m11_upcoming_equipment_orders(v_to, p_customer_id),$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m12_equipment';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, v_old, ''))) <> length(v_old) then
    raise exception 'm5 upcoming orders: m12 order block not exactly once'; end if;
  execute replace(v_def, v_old, v_new);
end $m5$;

create or replace function public.logistics_upcoming_orders()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $f$
declare
  v_today date := (now() at time zone 'Asia/Jerusalem')::date;
begin
  perform public.assert_module_permission('לוגיסטיקה', array['edit', 'view']);
  return jsonb_build_object(
    'from', v_today + 1,
    'to', v_today + 30,
    'rows', public.m11_upcoming_equipment_orders(v_today, null));
end
$f$;

revoke execute on function public.logistics_upcoming_orders() from public, anon;
grant execute on function public.logistics_upcoming_orders() to authenticated;

comment on function public.logistics_upcoming_orders() is
  'מודול 5: "להזמין לחודש הקרוב" — אותו חישוב של דוח צריכת-ציוד (מ12), גדור לוגיסטיקה view/edit.';
