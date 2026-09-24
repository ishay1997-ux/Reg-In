-- why: תיקון-נתונים במסד החי (24/09/2026). הכרעת-ישי, מילה-במילה: "מאשר לפי המלצתכם..." ואחר-כך
--      "מבחינתי לעשות את זה כמו שצריך שיראה טוב ובלי קיצורי דרך".
--      ① 24 פרויקטים נושאים project_finance.archived_at, אבל projects.project_status = 'awaiting_payment'
--         ו-payment_date ריק. archive_project אינו יכול ליצור מצב כזה: הוא דורש תשלום או חוב-אבוד וכותב
--         'finished'. ב-bak_projects_20260910 כל ה-24 היו 'finished' עם payment_date; ב-10/09
--         (11:56–14:47 UTC) החוב שלהם נפתח מחדש, ו-archived_at/final_profit נשארו מאחור.
--         על המסך: כספים ⇐ "ממתין לתשלום" ⇐ החלון אומר "התיק נעול — הועבר לארכיון." ואין בו דרך לרשום
--         תשלום (closingPhase ב-src/modules/08_finance/ClosingWindowDialog.jsx:314 — archived_at != null ⇒ נעול).
--      ② 6 פרויקטים עתידיים (1638 · 1641 · 1643 · 1644 · 1646 · 1647; נזרעו 09/09, not_started, אירועים
--         בדצמבר–ינואר) בלי אף שורת logistics, אף שבהצעה של כל אחד מהם יש שורת-מוצר ⇒ לשונית-הלוגיסטיקה
--         בכרטיס-הפרויקט מציגה תקלה (logistics-state-broken, src/modules/06_projects/LogisticsTab.jsx:207-214).
-- what: ① archived_at = null ו-final_profit = null ל-24. 🚫 לא מסמנים "שולם" — החוב נשאר פתוח, כפי שהוא היום.
--         final_profit = gross_profit החי בכל ה-24 (נבדק כאן, בשער ①ג) ⇒ coalesce(final_profit, gross_profit)
--         בדוחות אינו זז באגורה. מה כן זז, וזה צפוי ונכון: מוני "ננעלו כספית" (מ02/מ08) וה-ⓘ של מ08.
--       ② insert ל-logistics בדיוק בכלל של approve_quote_and_create_project (הגוף החי, pg_get_functiondef
--         24/09): שורות quote_services של ההצעה שהמוצר שלהן category <> 'hostess', serial_number =
--         row_number() over (order by line_number) — פר-פרויקט, planned_qty = qty,
--         quote_service_line_id = line_id, color. הטריגר logistics_recompute_project_status רץ כרגיל
--         (אין session_replication_role) — כמו באישור-הצעה. ⇒ project_status של ה-6 נשאר not_started
--         (0 שיבוצים, 0 פעולה אנושית — נבדק בשער הסיום), ו-projects.updated_at שלהם זז (moddatetime).
--         פרויקט 12 — לא נוגעים בלוגיסטיקה שלו: אירוע שעבר, ורשימה חדשה הייתה נראית כציוד שלא נבדק.
--       הקבוצות נבחרות לפי תנאי ונבדקות מול רשימה מפורשת; כל סטייה ⇒ raise, והכול מתבטל.
--       גיבויים בסכמה seed_snapshot (לא חשופה ל-API; אין USAGE ל-anon/authenticated/service_role):
--         seed_snapshot.project_finance_archived_unpaid_20260924 — שורות project_finance המלאות של ה-24
--         seed_snapshot.projects_logistics_fix_20260924        — project_id · project_status · updated_at של ה-6
-- reversible: כן —
--   update public.project_finance pf
--      set archived_at = b.archived_at, final_profit = b.final_profit
--     from seed_snapshot.project_finance_archived_unpaid_20260924 b
--    where b.project_id = pf.project_id;
--   delete from public.logistics
--    where project_id in (1638, 1641, 1643, 1644, 1646, 1647)
--      and quote_service_line_id in (select qs.line_id from public.projects p
--            join public.quote_services qs on qs.quote_id = p.quote_id
--           where p.project_id in (1638, 1641, 1643, 1644, 1646, 1647));
--   (ה-delete מפעיל את אותו טריגר, שמחשב את הסטטוס מחדש; updated_at המקורי שמור בגיבוי ②.)

-- ── שער: הקבוצות לפי תנאי = הרשימות המפורשות ─────────────────────────────────────────────
do $$
declare
  c_archived  constant int[] := array[12, 1040, 1512, 1515, 1516, 1521, 1522, 1525, 1538, 1540, 1541,
                                       1542, 1544, 1545, 1546, 1547, 1548, 1549, 1550, 1551, 1554, 1555,
                                       1562, 1563];
  c_logistics constant int[] := array[1638, 1641, 1643, 1644, 1646, 1647];
  v_ids int[];
  v_bad int;
begin
  -- נעילת השורות לאורך הטרנזקציה: תשלום/ארכוב שנרשם במקביל לא ייפול בין השער לכתיבה.
  perform 1 from public.projects where project_id = any (c_archived || c_logistics) for update;
  perform 1 from public.project_finance where project_id = any (c_archived) for update;

  -- ①א — לפי תנאי
  select coalesce(array_agg(pf.project_id order by pf.project_id), '{}')
    into v_ids
    from public.project_finance pf
    join public.projects p on p.project_id = pf.project_id
   where pf.archived_at is not null
     and p.project_status <> 'finished';
  if cardinality(v_ids) <> 24 then
    raise exception 'data-fix ①: % פרויקטים בארכיון שאינם finished — צפוי 24. לא נכתב דבר.', cardinality(v_ids);
  end if;
  if v_ids <> c_archived then
    raise exception 'data-fix ①: הקבוצה לפי תנאי (%) אינה הרשימה המפורשת. לא נכתב דבר.', v_ids;
  end if;

  -- ①ב — כולם "ממתין לתשלום", לא שולמו, ולא נסגרו כחוב אבוד (אחרת זה לא אותו פגם)
  select count(*)
    into v_bad
    from public.projects p
    join public.project_finance pf on pf.project_id = p.project_id
   where p.project_id = any (c_archived)
     and (p.project_status <> 'awaiting_payment'
          or p.payment_date is not null
          or coalesce(pf.written_off, false));
  if v_bad <> 0 then
    raise exception 'data-fix ①: % מתוך ה-24 אינם awaiting_payment/לא-שולם/לא-חוב-אבוד. לא נכתב דבר.', v_bad;
  end if;

  -- ①ג — אפס תזוזת-כסף: final_profit שנמחק שווה ל-gross_profit החי שיחליף אותו ב-coalesce
  select count(*)
    into v_bad
    from public.project_finance pf
   cross join lateral public.finance_project_money(pf.project_id) m
   where pf.project_id = any (c_archived)
     and pf.final_profit is distinct from m.gross_profit;
  if v_bad <> 0 then
    raise exception 'data-fix ①: ב-% מתוך ה-24 final_profit שונה מ-gross_profit החי — הסכומים בדוחות היו זזים. לא נכתב דבר.', v_bad;
  end if;

  -- ②א — לפי תנאי: בלי logistics · יש שורת-מוצר בהצעה · לא מבוטל · אירוע עתידי
  select coalesce(array_agg(p.project_id order by p.project_id), '{}')
    into v_ids
    from public.projects p
   where p.project_status <> 'cancelled'
     and p.final_event_date > current_date
     and not exists (select 1 from public.logistics l where l.project_id = p.project_id)
     and exists (select 1
                   from public.quote_services qs
                   join public.products pr on pr.sku = qs.sku
                  where qs.quote_id = p.quote_id
                    and pr.category <> 'hostess');
  if v_ids <> c_logistics then
    raise exception 'data-fix ②: הקבוצה לפי תנאי (%) אינה {1638,1641,1643,1644,1646,1647}. לא נכתב דבר.', v_ids;
  end if;
end $$;

-- ── גיבויים (לפני כל כתיבה) ──────────────────────────────────────────────────────────────
create table seed_snapshot.project_finance_archived_unpaid_20260924 as
select pf.*, now() as captured_at
  from public.project_finance pf
  join public.projects p on p.project_id = pf.project_id
 where pf.archived_at is not null
   and p.project_status <> 'finished';

comment on table seed_snapshot.project_finance_archived_unpaid_20260924 is
'גיבוי 24 שורות project_finance (archived_at + final_profit + כל השאר) לפני תיקון-הנתונים 20260924090000_data_fix_archived_unpaid_and_logistics. חזרה: ר'' כותרת הקובץ.';

create table seed_snapshot.projects_logistics_fix_20260924 as
select p.project_id, p.project_status, p.updated_at, now() as captured_at
  from public.projects p
 where p.project_id in (1638, 1641, 1643, 1644, 1646, 1647);

comment on table seed_snapshot.projects_logistics_fix_20260924 is
'גיבוי project_status + updated_at של 6 הפרויקטים שקיבלו שורות logistics בתיקון-הנתונים 20260924090000_data_fix_archived_unpaid_and_logistics.';

-- ── ① ביטול הארכוב השגוי: החוב נשאר פתוח, החלון נפתח לרישום תשלום ─────────────────────────
update public.project_finance pf
   set archived_at = null,
       final_profit = null
  from seed_snapshot.project_finance_archived_unpaid_20260924 b
 where b.project_id = pf.project_id;

-- ── ② רשימת-הלוגיסטיקה, בכלל של approve_quote_and_create_project ────────────────────────
insert into public.logistics (project_id, sku, serial_number, planned_qty, quote_service_line_id, color)
select p.project_id,
       qs.sku,
       row_number() over (partition by p.project_id order by qs.line_number),
       qs.qty,
       qs.line_id,
       qs.color
  from public.projects p
  join seed_snapshot.projects_logistics_fix_20260924 b on b.project_id = p.project_id
  join public.quote_services qs on qs.quote_id = p.quote_id
  join public.products pr on pr.sku = qs.sku
 where pr.category <> 'hostess';

-- ── שער הסיום: מה שהובטח קרה, ורק הוא ────────────────────────────────────────────────────
do $$
declare
  v_n int;
begin
  select count(*) into v_n from seed_snapshot.project_finance_archived_unpaid_20260924;
  if v_n <> 24 then
    raise exception 'data-fix סיום: בגיבוי ① % שורות, צפוי 24.', v_n;
  end if;
  select count(*) into v_n from seed_snapshot.projects_logistics_fix_20260924;
  if v_n <> 6 then
    raise exception 'data-fix סיום: בגיבוי ② % שורות, צפוי 6.', v_n;
  end if;

  select count(*)
    into v_n
    from public.project_finance pf
    join public.projects p on p.project_id = pf.project_id
   where pf.archived_at is not null
     and p.project_status <> 'finished';
  if v_n <> 0 then
    raise exception 'data-fix סיום: נותרו % פרויקטים בארכיון שאינם finished.', v_n;
  end if;

  select count(*)
    into v_n
    from public.project_finance pf
    join seed_snapshot.project_finance_archived_unpaid_20260924 b on b.project_id = pf.project_id
   where pf.archived_at is not null
      or pf.final_profit is not null;
  if v_n <> 0 then
    raise exception 'data-fix סיום: % מתוך ה-24 עדיין נושאים archived_at/final_profit.', v_n;
  end if;

  -- לכל אחד מה-6: מספר שורות-logistics = מספר שורות-המוצר בהצעה
  select count(*)
    into v_n
    from seed_snapshot.projects_logistics_fix_20260924 b
   where (select count(*) from public.logistics l where l.project_id = b.project_id)
         <> (select count(*)
               from public.projects p
               join public.quote_services qs on qs.quote_id = p.quote_id
               join public.products pr on pr.sku = qs.sku
              where p.project_id = b.project_id
                and pr.category <> 'hostess');
  if v_n <> 0 then
    raise exception 'data-fix סיום: ב-% מתוך ה-6 מספר שורות-הלוגיסטיקה שונה ממספר שורות-המוצר.', v_n;
  end if;

  -- הטריגר רץ, והסטטוס שחישב זהה למה שהיה (0 שיבוצים, 0 פעולה אנושית ⇒ not_started)
  select count(*)
    into v_n
    from seed_snapshot.projects_logistics_fix_20260924 b
    join public.projects p on p.project_id = b.project_id
   where p.project_status is distinct from b.project_status;
  if v_n <> 0 then
    raise exception 'data-fix סיום: הסטטוס של % מתוך ה-6 השתנה אחרי יצירת הלוגיסטיקה — עצירה לבדיקה.', v_n;
  end if;
end $$;
