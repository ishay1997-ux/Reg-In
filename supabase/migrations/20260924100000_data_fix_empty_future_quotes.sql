-- why: תיקון-נתונים במסד החי (24/09/2026). הכרעת-ישי, מילה-במילה: "מאשר" (על ההמלצה הזו), ואחר-כך
--      "רק סגרו לי תפינות בבקשה ... קחו תזמן ובלי קיצורי דרך בעבודה אבל תנסו לא להצתרך אותי".
--      get_dashboard_summary לדצמבר 2026 ולינואר 2027 נכשל ב-P0001 "לא ניתן לחשב כספים לפרויקט 1639 —
--      להצעה 2419 אין שורות." (finance_project_money) ⇒ מסך-הבית באותם חודשים הופך כולו למסך-שגיאה
--      (src/modules/07_dashboard/DashboardPage.jsx:122-134), ו-?month= נשאר בכתובת.
--      הסיבה: להצעות המאושרות של 1639 · 1640 · 1642 · 1645 אין אף שורת quote_services. אלה שלד-זריעה
--      מ-09/09 (seed-horizon-2026-09-10), ומצב שהמערכת אינה מאפשרת: approve_quote_and_create_project
--      מסרבת לאשר הצעה בלי שורות.
-- what: ① לכל אחת מ-4 ההצעות — אותה שורה בדיוק שיש ל-6 האחים שלהן מאותה זריעה (1638 · 1641 · 1643 ·
--         1644 · 1646 · 1647, נוספו 10/09 00:02 UTC): 01WEB ×1, closing_unit_price 2500.00,
--         closing_unit_cost 1200.00, line_number 1, color/notes null. הערכים נקראים מהאחים בשאילתה,
--         ושער ①ב דורש שכל 6 זהים. INSERT ל-quote_services אינו חסום: טריגר-הנעילה
--         quote_services_lock_non_in_progress הוא BEFORE DELETE OR UPDATE בלבד. ל-quotes אין עמודות-סכום.
--       ② שורות logistics ל-4, בכלל של approve_quote_and_create_project (כמו 20260924090000). הטריגר
--         logistics_recompute_project_status רץ (אין session_replication_role); הסטטוס נשאר not_started
--         (0 שיבוצים, 0 פעולה אנושית — נבדק בשער הסיום), ו-projects.updated_at של ה-4 זז (moddatetime).
--       seed_registry: השורות של האחים אינן רשומות בו (במרשם אין סוג-ישות לשורת-הצעה — רק customer ·
--         hostess · project · quote), ולכן גם החדשות אינן נרשמות. ההצעות והפרויקטים עצמם רשומים.
--       הכסף שזז, וזה צפוי: revenue לפי finance_project_money = 2500 פחות הנחת-ההצעה ⇒
--         1639 (12%) 2,200 · 1640 (3%) 2,425 · 1642 2,500 · 1645 2,500; gross_profit = revenue − 1,200.
--       גיבויים בסכמה seed_snapshot (לא חשופה ל-API):
--         seed_snapshot.projects_empty_quote_fix_20260924 — project_id · quote_id · project_status · updated_at של ה-4
--         seed_snapshot.quote_services_added_20260924     — line_id · quote_id · project_id של השורות שנוספו
-- reversible: כן —
--   delete from public.logistics
--    where quote_service_line_id in (select line_id from seed_snapshot.quote_services_added_20260924);
--   -- הצעות מאושרות נעולות למחיקה; ה-4 רשומות ב-seed_registry, ולכן מפתח-הזריעה פותח אותן בלבד:
--   set local regin.seed_bypass = 'on';
--   delete from public.quote_services
--    where line_id in (select line_id from seed_snapshot.quote_services_added_20260924);
--   (ה-delete מ-logistics מפעיל את אותו טריגר; updated_at המקורי שמור בגיבוי.)

-- ── שער: הקבוצה לפי תנאי = הרשימה המפורשת · 6 האחים זהים ────────────────────────────────
do $$
declare
  c_empty    constant int[] := array[1639, 1640, 1642, 1645];
  c_siblings constant int[] := array[1638, 1641, 1643, 1644, 1646, 1647];
  v_ids int[];
  v_n int;
begin
  perform 1 from public.projects where project_id = any (c_empty || c_siblings) for update;

  -- ①א — לפי תנאי: הצעה בלי אף שורה · פרויקט לא מבוטל · אירוע עתידי
  select coalesce(array_agg(p.project_id order by p.project_id), '{}')
    into v_ids
    from public.projects p
   where p.project_status <> 'cancelled'
     and p.final_event_date > current_date
     and not exists (select 1 from public.quote_services qs where qs.quote_id = p.quote_id);
  if v_ids <> c_empty then
    raise exception 'data-fix ③: הקבוצה לפי תנאי (%) אינה {1639,1640,1642,1645}. לא נכתב דבר.', v_ids;
  end if;

  -- ①ב — 6 האחים: שורה אחת לכל הצעה, וכל 6 זהות בכל העמודות שמועתקות
  select count(*) into v_n
    from public.quote_services qs
    join public.projects p on p.quote_id = qs.quote_id
   where p.project_id = any (c_siblings);
  if v_n <> 6 then
    raise exception 'data-fix ③: לאחים % שורות-הצעה, צפוי 6 (אחת לכל אח). לא נכתב דבר.', v_n;
  end if;
  select count(*) into v_n
    from (select distinct qs.sku, qs.line_number, qs.qty, qs.closing_unit_price, qs.closing_unit_cost,
                          qs.color, qs.notes
            from public.quote_services qs
            join public.projects p on p.quote_id = qs.quote_id
           where p.project_id = any (c_siblings)) d;
  if v_n <> 1 then
    raise exception 'data-fix ③: שורות האחים אינן זהות (% צורות שונות). לא נכתב דבר.', v_n;
  end if;

  -- ①ג — ל-4 אין עדיין logistics (אחרת זה לא אותו פגם)
  select count(*) into v_n from public.logistics where project_id = any (c_empty);
  if v_n <> 0 then
    raise exception 'data-fix ③: ל-4 כבר יש % שורות logistics. לא נכתב דבר.', v_n;
  end if;
end $$;

-- ── גיבוי (לפני כל כתיבה) ─────────────────────────────────────────────────────────────────
create table seed_snapshot.projects_empty_quote_fix_20260924 as
select p.project_id, p.quote_id, p.project_status, p.updated_at, now() as captured_at
  from public.projects p
 where p.project_id in (1639, 1640, 1642, 1645);

comment on table seed_snapshot.projects_empty_quote_fix_20260924 is
'גיבוי project_status + updated_at של 4 הפרויקטים שהצעותיהם קיבלו שורה בתיקון-הנתונים 20260924100000_data_fix_empty_future_quotes. חזרה: ר'' כותרת הקובץ.';

-- ── ① השורה של האחים, לכל אחת מ-4 ההצעות ────────────────────────────────────────────────
insert into public.quote_services (quote_id, sku, line_number, qty, closing_unit_price, closing_unit_cost, color, notes)
select b.quote_id, s.sku, s.line_number, s.qty, s.closing_unit_price, s.closing_unit_cost, s.color, s.notes
  from seed_snapshot.projects_empty_quote_fix_20260924 b
 cross join (select distinct qs.sku, qs.line_number, qs.qty, qs.closing_unit_price, qs.closing_unit_cost,
                             qs.color, qs.notes
               from public.quote_services qs
               join public.projects p on p.quote_id = qs.quote_id
              where p.project_id in (1638, 1641, 1643, 1644, 1646, 1647)) s;

create table seed_snapshot.quote_services_added_20260924 as
select qs.line_id, qs.quote_id, b.project_id, now() as captured_at
  from public.quote_services qs
  join seed_snapshot.projects_empty_quote_fix_20260924 b on b.quote_id = qs.quote_id;

comment on table seed_snapshot.quote_services_added_20260924 is
'מזהי שורות-ההצעה שנוספו בתיקון-הנתונים 20260924100000_data_fix_empty_future_quotes — לצורך החזרה (ר'' כותרת הקובץ).';

-- ── ② רשימת-הלוגיסטיקה, בכלל של approve_quote_and_create_project ────────────────────────
insert into public.logistics (project_id, sku, serial_number, planned_qty, quote_service_line_id, color)
select p.project_id,
       qs.sku,
       row_number() over (partition by p.project_id order by qs.line_number),
       qs.qty,
       qs.line_id,
       qs.color
  from public.projects p
  join seed_snapshot.projects_empty_quote_fix_20260924 b on b.project_id = p.project_id
  join public.quote_services qs on qs.quote_id = p.quote_id
  join public.products pr on pr.sku = qs.sku
 where pr.category <> 'hostess';

-- ── שער הסיום ───────────────────────────────────────────────────────────────────────────
do $$
declare
  v_n int;
begin
  select count(*) into v_n from seed_snapshot.projects_empty_quote_fix_20260924;
  if v_n <> 4 then
    raise exception 'data-fix ③ סיום: בגיבוי הפרויקטים % שורות, צפוי 4.', v_n;
  end if;
  select count(*) into v_n from seed_snapshot.quote_services_added_20260924;
  if v_n <> 4 then
    raise exception 'data-fix ③ סיום: נוספו % שורות-הצעה, צפוי 4.', v_n;
  end if;

  -- אף הצעה עתידית פעילה אינה נשארת בלי שורות
  select count(*) into v_n
    from public.projects p
   where p.project_status <> 'cancelled'
     and p.final_event_date > current_date
     and not exists (select 1 from public.quote_services qs where qs.quote_id = p.quote_id);
  if v_n <> 0 then
    raise exception 'data-fix ③ סיום: נותרו % פרויקטים עתידיים שלהצעתם אין שורות.', v_n;
  end if;

  -- כל אחת מ-4 השורות החדשות זהה לשורת-האחים
  select count(*) into v_n
    from seed_snapshot.quote_services_added_20260924 a
    join public.quote_services qs on qs.line_id = a.line_id
   cross join (select s.*
                 from public.quote_services s
                 join public.projects p on p.quote_id = s.quote_id
                where p.project_id = 1638) t
   where (qs.sku, qs.line_number, qs.qty, qs.closing_unit_price, qs.closing_unit_cost, qs.color, qs.notes)
         is distinct from
         (t.sku, t.line_number, t.qty, t.closing_unit_price, t.closing_unit_cost, t.color, t.notes);
  if v_n <> 0 then
    raise exception 'data-fix ③ סיום: % מהשורות החדשות שונות משורת-האחים.', v_n;
  end if;

  -- לכל אחד מ-4: מספר שורות-logistics = מספר שורות-המוצר בהצעה
  select count(*) into v_n
    from seed_snapshot.projects_empty_quote_fix_20260924 b
   where (select count(*) from public.logistics l where l.project_id = b.project_id)
         <> (select count(*)
               from public.quote_services qs
               join public.products pr on pr.sku = qs.sku
              where qs.quote_id = b.quote_id
                and pr.category <> 'hostess');
  if v_n <> 0 then
    raise exception 'data-fix ③ סיום: ב-% מתוך ה-4 מספר שורות-הלוגיסטיקה שונה ממספר שורות-המוצר.', v_n;
  end if;

  -- הטריגר רץ, והסטטוס שחישב זהה למה שהיה
  select count(*) into v_n
    from seed_snapshot.projects_empty_quote_fix_20260924 b
    join public.projects p on p.project_id = b.project_id
   where p.project_status is distinct from b.project_status;
  if v_n <> 0 then
    raise exception 'data-fix ③ סיום: הסטטוס של % מתוך ה-4 השתנה — עצירה לבדיקה.', v_n;
  end if;

  -- הכספים של ה-4 מחושבים עכשיו (זו התקלה עצמה) — וזה מה שהם אומרים
  select count(*) into v_n
    from seed_snapshot.projects_empty_quote_fix_20260924 b
   cross join lateral public.finance_project_money(b.project_id) m
   where m.revenue is distinct from (case b.project_id when 1639 then 2200.00 when 1640 then 2425.00 else 2500.00 end)
      or m.gross_profit is distinct from (case b.project_id when 1639 then 1000.00 when 1640 then 1225.00 else 1300.00 end);
  if v_n <> 0 then
    raise exception 'data-fix ③ סיום: ב-% מתוך ה-4 הכנסה/רווח שונים מהצפוי (2500 פחות הנחת-ההצעה, פחות 1200).', v_n;
  end if;
end $$;
