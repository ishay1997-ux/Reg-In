-- why: הכרעת-ישי, 24/09/2026: אירוע נסגר "גג שבוע" — והסגן: זה כולל את הלוגיסטיקה. ב-15 שורות-ציוד של
--      אירועי 07–16/09 (8 אירועים) "הגיע" = 0 בפריט שמסומן "מוכן" ⇒ מ12 ("צריכת ציוד") קורא אותן כחוסר של
--      3,082 יחידות, ו-01WEB נראה חסר (ממצא מעבר-הדוחות #1).
--      📏 **המקור:** כל 15 השורות עודכנו לאחרונה ב-10/09/2026 02:23 (שעון-ישראל), בריצת-האופק
--         `seed-horizon-2026-09-10` (ר' `20260924100000_data_fix_empty_future_quotes.sql:7`: *"מצב שהמערכת אינה
--         מאפשרת"*), ובצילום `seed_snapshot.logistics_20260915` הן כבר במצב הזה. הסקריפט של ריצת-האופק לא בריפו.
--      🔑 **למה זה מצב-אסור:** `update_logistics_item` (שורות 151–157 בגוף) — פריט שעובר ל-'ready' בלי כמות
--         ⇒ "הגיע" = המתוכנן ו-`actual_qty_autofilled = true`. כך נוצרו כל 1,453 השורות של אירועים שהסתיימו.
--         ו-`scripts/dashboard-readiness-fix.mjs`, בכותרת: *"UPDATE גולמי היה יוצר פריט "מוכן" עם כמות-שהגיעה 0
--         ובלי תאריך-הגעה — מצב שהפונקציה עצמה מונעת."*
-- what: 15 השורות ⇐ **התוצאה שהפונקציה עצמה מגדירה למעבר ל"מוכן"**: `actual_qty = planned_qty`,
--       `actual_qty_autofilled = true`. תאריך-ההגעה כבר רשום בכולן — לא נוגעים בו.
--       🔑 **UPDATE ישיר ולא דרך הפונקציה, כי היא חוסמת:** *"האירוע כבר הסתיים — לא ניתן לעדכן את הלוגיסטיקה שלו"*
--          (שורות 72–80, כל סטטוס-פרויקט מחוץ ל-not_started/in_progress/ready). במיגרציה (postgres) RLS אינו חל.
--          הטריגר `logistics_recompute_project_status` רץ — ולפרויקט שאינו על הציר הפעיל הוא לא עושה דבר
--          (`recompute_project_status`, שורה ראשונה); **③ מוכיח שאף סטטוס לא זז.**
--       🚫 **נדחו (הסגן, 24/09):** ב — לא לגעת (מ12 נשאר 17 שורות / 2.8%, "לא הוזן") — אבל לפי הכלל "גג שבוע"
--          האירועים האלה סגורים. ג — להחזיר את ה-15 ל-not_started — ממציא היסטוריה (שהציוד לא הוזמן), כשתאריך-
--          ההגעה רשום.
--       🚫 **לא נוגעים:** 1577 (07/09) · ECO-TAG ו-SAT-LAN (140 + 140) — `not_started` מ-04/09, מעולם לא הוזמנו. מצב
--          עקבי, ו-280 היחידות הן חוסר אמיתי שמותר לדוח להראות ("מיעוט מכוון עם חוסר אמיתי" —
--          `dashboard-readiness-fix.mjs`). · השורה ה-16 מאותה ריצה (1594, ‏22/09) — מחוץ לטווח, 7 הימים האחרונים.
--       ⏱️ **סדר-ההחלה (הסגן):** אחרי `20260924233000_seed_close_events_2026_09.sql` ולפני
--          `20260924230000_module11_m12_measured_held_only.sql`. הקובץ עצמאי: הוא בוחר לפי תאריך וסטטוס, לא לפי
--          טבלת-הגיבוי של הסגירה.
-- 📏 "בדיוק מה שצפוי": ① עוצר אם לפני ≠ 15 שורות / 3,082 יחידות · ③ עוצר אם עודכנו ≠ 15, או אם סטטוס של אחד
--    מ-8 הפרויקטים השתנה.
-- 🛟 גיבוי: `seed_snapshot.logistics_arrived_fix_20260924`, באותה מיגרציה, לפני הכתיבה. שחזור: `restore-logistics.sql`.
-- reversible: כן (חוץ מ-`updated_at`, שטריגר `moddatetime` דורס).
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

-- ① השער.
do $gate$
declare
  v_rows int;
  v_units int;
begin
  select count(*), coalesce(sum(l.planned_qty), 0) into v_rows, v_units
    from public.logistics l
    join public.projects p on p.project_id = l.project_id
   where p.final_event_date between date '2026-08-31' and date '2026-09-16'
     and p.project_status in ('event_finished', 'awaiting_invoice')
     and l.item_status = 'ready' and not l.actual_qty_autofilled and l.actual_qty = 0;
  if v_rows <> 15 or v_units <> 3082 then
    raise exception 'arrived-2026-09: צפויות 15 שורות / 3,082 יחידות, נמצאו % / % — עוצר.', v_rows, v_units;
  end if;
end
$gate$;

-- ② הגיבוי.
create table seed_snapshot.logistics_arrived_fix_20260924 as
  select l.*
    from public.logistics l
    join public.projects p on p.project_id = l.project_id
   where p.final_event_date between date '2026-08-31' and date '2026-09-16'
     and p.project_status in ('event_finished', 'awaiting_invoice')
     and l.item_status = 'ready' and not l.actual_qty_autofilled and l.actual_qty = 0;
revoke all on seed_snapshot.logistics_arrived_fix_20260924 from public, anon, authenticated;

-- ③ התיקון + הבדיקה.
do $fix$
declare
  v_status_before jsonb;
  v_status_after jsonb;
  v_n int;
begin
  select jsonb_object_agg(p.project_id, p.project_status) into v_status_before
    from public.projects p
   where p.project_id in (select distinct project_id from seed_snapshot.logistics_arrived_fix_20260924);

  update public.logistics l
     set actual_qty = l.planned_qty, actual_qty_autofilled = true
    from seed_snapshot.logistics_arrived_fix_20260924 b
   where l.project_id = b.project_id and l.sku = b.sku and l.serial_number = b.serial_number;
  get diagnostics v_n = row_count;
  if v_n <> 15 then
    raise exception 'arrived-2026-09: עודכנו % שורות, צפוי 15 — עוצר.', v_n;
  end if;

  select jsonb_object_agg(p.project_id, p.project_status) into v_status_after
    from public.projects p
   where p.project_id in (select distinct project_id from seed_snapshot.logistics_arrived_fix_20260924);
  if v_status_after is distinct from v_status_before then
    raise exception 'arrived-2026-09: סטטוס-פרויקט השתנה (% ⇐ %) — עוצר.', v_status_before, v_status_after;
  end if;
end
$fix$;
