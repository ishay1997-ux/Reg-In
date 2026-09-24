-- 🛟 שחזור ל-`20260924233500_seed_logistics_arrived_2026_09.sql` — מחזיר את 15 שורות-הציוד ל"הגיע" = 0,
--    `actual_qty_autofilled = false`, מתוך `seed_snapshot.logistics_arrived_fix_20260924`.
-- ⚠️ `updated_at` אינו חוזר (טריגר `moddatetime`).
-- ⏳ נכתב, לא הוחל.

do $restore_log$
declare
  v_n int;
begin
  update public.logistics l
     set actual_qty = b.actual_qty, actual_qty_autofilled = b.actual_qty_autofilled
    from seed_snapshot.logistics_arrived_fix_20260924 b
   where l.project_id = b.project_id and l.sku = b.sku and l.serial_number = b.serial_number;
  get diagnostics v_n = row_count;
  if v_n <> (select count(*) from seed_snapshot.logistics_arrived_fix_20260924) then
    raise exception 'restore arrived-2026-09: שוחזרו % שורות, צפוי % — עוצר.', v_n,
      (select count(*) from seed_snapshot.logistics_arrived_fix_20260924);
  end if;
end
$restore_log$;
