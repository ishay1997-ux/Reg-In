-- 🛟 שחזור ל-`supabase/migrations/20260924234000_seed_logistics_arrived_horizon_rest.sql` — מחזיר את שתי
--    שורות-הציוד (1594 SAT-LAN · 1597 FAB-LAN) ל"הגיע" = 0, `actual_qty_autofilled = false`, מתוך
--    `seed_snapshot.logistics_arrived_fix_horizon_rest_20260924`.
-- ⚠️ `updated_at` אינו חוזר (טריגר `moddatetime`).
-- ⚠️ 1597 פעיל: אם מישהו עדכן את השורה במסך אחרי התיקון, השחזור ידרוס את העדכון. לבדוק `updated_at` לפני.
-- ⏳ נכתב, לא הוחל.

do $restore_horizon_rest$
declare
  v_n int;
begin
  update public.logistics l
     set actual_qty = b.actual_qty, actual_qty_autofilled = b.actual_qty_autofilled
    from seed_snapshot.logistics_arrived_fix_horizon_rest_20260924 b
   where l.project_id = b.project_id and l.sku = b.sku and l.serial_number = b.serial_number;
  get diagnostics v_n = row_count;
  if v_n <> (select count(*) from seed_snapshot.logistics_arrived_fix_horizon_rest_20260924) then
    raise exception 'restore arrived-horizon-rest: שוחזרו % שורות, צפוי % — עוצר.', v_n,
      (select count(*) from seed_snapshot.logistics_arrived_fix_horizon_rest_20260924);
  end if;
end
$restore_horizon_rest$;
