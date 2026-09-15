-- REG-IN · seed snapshot · capture
--
-- WHY THIS EXISTS
--   Module 11's entire demo rests on seeded business data that was written directly to the
--   live database over several sessions. Measured 15/09/2026 with `git show --name-only`:
--   every `seed(m11):` commit touches markdown only -- zero SQL. There is no migration and
--   no script that rebuilds that state, so `supabase db reset` + migrations cannot recreate
--   the numbers the sixteen report surfaces display, nor the four conference stories.
--
-- WHAT IT DOES
--   Copies every seeded business table into a dedicated `seed_snapshot` schema, one table per
--   source table, suffixed with the capture date. Additive only: it creates, never drops,
--   never writes to `public`.
--
-- WHY A SEPARATE SCHEMA, NOT `public`
--   The build's step 1.1 regenerates `docs/schema.sql`. Snapshot tables sitting in `public`
--   would land in that snapshot and be read as real schema by every later column check.
--   A separate schema is also not exposed through PostgREST by default, so the copies are
--   unreachable from the client.
--
-- WHAT IT IS NOT
--   This is an IN-DATABASE copy. It survives a bad UPDATE; it does NOT survive losing the
--   project. For an off-database copy see README.md in this folder -- that one needs the
--   database password and is Ishay's to run.
--
-- SAFE TO RE-RUN on a different date; re-running on the same date fails loudly rather than
-- overwriting an existing snapshot, which is the intended behaviour.

create schema if not exists seed_snapshot;

comment on schema seed_snapshot is
  'Point-in-time copies of the seeded business tables. Created by scripts/seed-snapshot/capture-seed-snapshot.sql. Not exposed through the API. Never read by application code.';

do $$
declare
  src   text;
  stamp text := to_char(current_date, 'YYYYMMDD');
  tables text[] := array[
    'projects', 'assignments', 'quotes', 'quote_services', 'logistics',
    'project_finance', 'project_changes',
    'customers', 'customer_contacts', 'customer_hostess_preference',
    'hostesses', 'hostess_languages', 'hostess_bank_details', 'hostess_unavailability',
    'email_log', 'salary_reports', 'salary_report_lines',
    'params', 'price_tiers', 'products', 'product_costs',
    'seed_registry', 'notification_preferences'
  ];
begin
  foreach src in array tables loop
    if to_regclass('public.' || src) is null then
      raise notice 'skipped %: table does not exist in public', src;
      continue;
    end if;

    execute format(
      'create table seed_snapshot.%I as table public.%I',
      src || '_' || stamp, src
    );

    execute format(
      'comment on table seed_snapshot.%I is %L',
      src || '_' || stamp,
      'Snapshot of public.' || src || ' taken ' || to_char(now(), 'DD/MM/YYYY HH24:MI')
    );
  end loop;
end $$;

-- Verification: row counts side by side. Every pair must match.
select
  s.table_name                                   as snapshot_table,
  (xpath('/row/c/text()',
     query_to_xml(format('select count(*) as c from seed_snapshot.%I', s.table_name),
                  false, true, '')))[1]::text::bigint as snapshot_rows
from information_schema.tables s
where s.table_schema = 'seed_snapshot'
order by s.table_name;
