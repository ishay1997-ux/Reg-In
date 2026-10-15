-- D — the two blind-UAT test customers leak into the report customer filter (מ2 / מ3 and every report).
-- Written by Agent K (card-customer-reports.md, item D), 14.10. FILE ONLY — applied by the deputy, never by K.
-- Ishay's ruling 12:5x: nothing in the reports changes without his approval ⇒ the deputy applies this only after his "אשר".
--
-- Measured 14.10 (SELECT only, project yfeovxppnfoafmfbdfvh):
--   492 "UAT-2026-10-08"    private_company · status inactive · company_number 000000018 · created 08.10 11:39 UTC
--   493 "UAT-2026-10-08-b"  private_company · status inactive · company_number 000000026 · created 08.10 11:42 UTC
--   Both: 0 projects · 0 quotes · 0 contacts · 0 hostess preferences (all four FKs into customers checked).
--   Created by the blind UAT script, task 2 (docs/guides/conference-uat-script.md:101 "ליצור לקוח בשם UAT-<התאריך>"),
--   and archived at the end as its rule 5 requires (line 18). Archiving does NOT hide them: the report filter lists
--   every customer, active and archived (listCustomers(), src/modules/02_customers/api.js:41, no status filter),
--   sorted by company_name ⇒ the Latin "UAT-…" names sort above every Hebrew name, right under "כל הלקוחות".
--
-- What this does: renames both to realistic Hebrew company names and keeps them archived. Nothing else changes:
--   no delete (card: "NO deletion"), no status change, no type change, company_number untouched (it is the only
--   unique key besides the PK). Report numbers do not move — neither customer has a project or a quote.
-- Why not deactivate: they already are inactive. Why not a flag: there is no flag column; adding one is a migration.
-- Trigger on customers: only customers_set_updated_at (moddatetime) ⇒ updated_at moves; no audit table.
-- Name check 14.10: no live customer name contains "אופק" or "נתיב".

begin;

do $$
begin
  if (select count(*) from public.customers
       where (customer_id = 492 and company_name = 'UAT-2026-10-08')
          or (customer_id = 493 and company_name = 'UAT-2026-10-08-b')) <> 2 then
    raise exception 'GATE0: 492/493 not in the measured state (renamed already?)';
  end if;
  if exists (select 1 from public.projects where customer_id in (492, 493))
     or exists (select 1 from public.quotes where customer_id in (492, 493)) then
    raise exception 'GATE0: 492/493 now carry projects or quotes — stop and re-measure';
  end if;
  if exists (select 1 from public.customers
              where company_name in ('אופק מערכות מידע בע"מ', 'נתיב לוגיסטיקה בע"מ')) then
    raise exception 'GATE0: a target name is already taken';
  end if;
  if to_regclass('seed_snapshot.customers_uat_rename_20261015') is not null then
    raise exception 'GATE0: backup table already exists — this script already ran';
  end if;
end $$;

-- backup before the change (same schema the project already keeps snapshots in)
create table seed_snapshot.customers_uat_rename_20261015 as
  select * from public.customers where customer_id in (492, 493);

do $$
declare n int;
begin
  update public.customers set company_name = 'אופק מערכות מידע בע"מ'
   where customer_id = 492 and company_name = 'UAT-2026-10-08';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GATE 492: updated % rows', n; end if;

  update public.customers set company_name = 'נתיב לוגיסטיקה בע"מ'
   where customer_id = 493 and company_name = 'UAT-2026-10-08-b';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GATE 493: updated % rows', n; end if;

  if (select count(*) from seed_snapshot.customers_uat_rename_20261015) <> 2
     or exists (select 1 from public.customers where company_name like 'UAT-%')
     or (select count(*) from public.customers where customer_id in (492, 493) and status = 'inactive') <> 2 then
    raise exception 'AFTER-GATE failed';
  end if;
end $$;

commit;

-- proof (read-only)
select customer_id, company_name, customer_type, status, company_number, updated_at
  from public.customers where customer_id in (492, 493);
select count(*) as uat_names_left from public.customers where company_name like 'UAT-%';   -- expect 0

-- ═════════════════════════════════════════════════════════════════════════════
-- REVERSE (whenever wanted — e.g. if a future UAT run must find its UAT- records again)
-- ═════════════════════════════════════════════════════════════════════════════
-- begin;
-- update public.customers c set company_name = s.company_name
--   from seed_snapshot.customers_uat_rename_20261015 s
--  where c.customer_id = s.customer_id;                                   -- expect 2
-- select customer_id, company_name from public.customers where customer_id in (492, 493);
-- commit;
