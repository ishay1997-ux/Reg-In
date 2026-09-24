-- why: הכרעת-ישי, 24/09/2026: אירוע נסגר "גג שבוע" (הציטוט המלא בראש `20260924233000_seed_close_events_2026_09.sql`).
--      ‏`20260924233500_seed_logistics_arrived_2026_09.sql` תיקן 15 שורות-ציוד של אירועי 07–16/09 שנשארו
--      "מוכן" עם "הגיע" = 0. **שתי שורות נוספות מאותה ריצה נשארו מחוץ לטווח שלו** (נמדד 24/09, קריאה בלבד):
--        · 1594 · SAT-LAN · 420 יחידות · אירוע 22/09 · `event_finished`
--        · 1597 · FAB-LAN (כחול) · 100 יחידות · אירוע 28/09 · `in_progress`
--      שתיהן עודכנו לאחרונה ב-10/09/2026 02:23 (שעון-ישראל), בריצת-האופק `seed-horizon-2026-09-10`, כמו ה-15.
--      ⇐ מ12 ("צריכת ציוד") סופר אירוע שנסגר (עבר לפני יותר משבוע, `20260924230000_module11_m12_measured_held_only`):
--         1594 נכנס לספירה ב-30/09, ו-1597 ב-06/10. בלי התיקון, ביום הכנס הדוח יראה 520 יחידות חסרות שלא חסרו.
--      ✏️ הסגן, 24/09 (#1): *"מתקנים עכשיו, לא ב-14/10"*. אותה מחלקה בדיוק, אותה שיטה כמו `233500`.
-- what: שתי השורות ⇐ `actual_qty = planned_qty`, `actual_qty_autofilled = true`. זו התוצאה שהפונקציה
--       `update_logistics_item` מגדירה לפריט שעובר ל"מוכן" בלי כמות (שורות 151–157 בגוף).
--       🔑 **UPDATE ישיר ולא דרך הפונקציה:** היא חוסמת פרויקט מחוץ ל-not_started/in_progress/ready (שורות 72–80),
--          ו-1594 כבר `event_finished`. במיגרציה (postgres) RLS אינו חל.
--       ⚠️ **1597 פעיל (`in_progress`) — ושם הטריגר `logistics_recompute_project_status` כן מחשב מחדש.** הוא קורא
--          רק את `item_status` (לא את הכמות), והתיקון לא משנה אותו ⇐ הסטטוס אמור להישאר. ③ מוכיח את זה ועוצר אם לא.
--       ⚪ **`actual_arrival_date` ריק בשתיהן, ולא נוגעים בו** (הכרעת-הסגן: כמות + דגל). הפונקציה הייתה חותמת בו את
--          יום המעבר ל"מוכן". המסך היחיד שקורא אותו לפריט "מוכן" הוא רשימת-הציוד (`ChecklistDialog.jsx:932`),
--          שמציג "—".
--       🚫 **לא נוגעים:** 1577 (07/09) · ECO-TAG ו-SAT-LAN (140 + 140) — `not_started`, מעולם לא הוזמנו. חוסר אמיתי.
-- 📏 "בדיוק מה שצפוי": ① עוצר אם לפני ≠ 2 שורות / 520 יחידות, או אם הפרויקטים אינם בדיוק 1594 ו-1597 ·
--    ③ עוצר אם עודכנו ≠ 2, או אם סטטוס של אחד משני הפרויקטים השתנה.
-- 🛟 גיבוי: `seed_snapshot.logistics_arrived_fix_horizon_rest_20260924`, באותה מיגרציה, לפני הכתיבה.
--    שחזור: `scripts/seed-focused/2026-09-24-logistics-arrived-horizon-rest-restore.sql`.
-- reversible: כן (חוץ מ-`updated_at`, שטריגר `moddatetime` דורס).
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

-- ① השער.
do $gate$
declare
  v_rows int;
  v_units int;
  v_projects int[];
begin
  select count(*), coalesce(sum(l.planned_qty), 0), array_agg(distinct l.project_id order by l.project_id)
    into v_rows, v_units, v_projects
    from public.logistics l
    join public.projects p on p.project_id = l.project_id
   where p.final_event_date between date '2026-09-17' and date '2026-10-07'
     and p.project_status is distinct from 'cancelled'
     and l.item_status = 'ready' and not l.actual_qty_autofilled and l.actual_qty = 0;
  if v_rows <> 2 or v_units <> 520 or v_projects is distinct from array[1594, 1597] then
    raise exception 'arrived-horizon-rest: צפויות 2 שורות / 520 יחידות ב-1594 וב-1597, נמצאו % / % ב-% — עוצר.',
      v_rows, v_units, v_projects;
  end if;
end
$gate$;

-- ② הגיבוי.
create table seed_snapshot.logistics_arrived_fix_horizon_rest_20260924 as
  select l.*
    from public.logistics l
    join public.projects p on p.project_id = l.project_id
   where p.final_event_date between date '2026-09-17' and date '2026-10-07'
     and p.project_status is distinct from 'cancelled'
     and l.item_status = 'ready' and not l.actual_qty_autofilled and l.actual_qty = 0;
revoke all on seed_snapshot.logistics_arrived_fix_horizon_rest_20260924 from public, anon, authenticated;

-- ③ התיקון + הבדיקה.
do $fix$
declare
  v_status_before jsonb;
  v_status_after jsonb;
  v_n int;
begin
  select jsonb_object_agg(p.project_id, p.project_status) into v_status_before
    from public.projects p
   where p.project_id in (select distinct project_id from seed_snapshot.logistics_arrived_fix_horizon_rest_20260924);

  update public.logistics l
     set actual_qty = l.planned_qty, actual_qty_autofilled = true
    from seed_snapshot.logistics_arrived_fix_horizon_rest_20260924 b
   where l.project_id = b.project_id and l.sku = b.sku and l.serial_number = b.serial_number;
  get diagnostics v_n = row_count;
  if v_n <> 2 then
    raise exception 'arrived-horizon-rest: עודכנו % שורות, צפוי 2 — עוצר.', v_n;
  end if;

  select jsonb_object_agg(p.project_id, p.project_status) into v_status_after
    from public.projects p
   where p.project_id in (select distinct project_id from seed_snapshot.logistics_arrived_fix_horizon_rest_20260924);
  if v_status_after is distinct from v_status_before then
    raise exception 'arrived-horizon-rest: סטטוס-פרויקט השתנה (% ⇐ %) — עוצר.', v_status_before, v_status_after;
  end if;
end
$fix$;
