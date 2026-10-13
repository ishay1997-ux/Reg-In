-- Migration 9: August claim repair, re-run on a synthetic August with 83 frozen lines.
-- (When the replica is built there is no August report, so the migration was a no-op then.)

select test.hostess(900001 + n, 'דיילת ' || n, lpad((900001 + n)::text, 9, '0')) from generate_series(0, 2) n;

-- 82 actual shifts + 1 compensation shift, all unclaimed, all in August 2026
select test.project(900400 + i, ('2026-08-01'::date + (i - 1) % 28), case when i = 83 then 'cancelled' else 'finished' end,
                    '10:00', '16:00', case when i = 83 then 'customer' end, case when i = 83 then '2026-08-20 09:00+03'::timestamptz end)
  from generate_series(1, 83) i;
select test.assign(900400 + i, 900001 + (i - 1) / 28, 1,
                   case when i = 83 then 'released' else 'finally_approved' end,
                   case when i = 83 then 0 else 6 end, 50, 0,
                   case when i = 83 then 'finally_approved' end)
  from generate_series(1, 83) i;
-- a shift of a later month and a pre-existing claimed shift are not candidates
select test.project(900500, '2026-09-03', 'finished');
select test.assign(900500, 900001, 1, 'finally_approved', 6, 50, 0);

insert into public.salary_reports (report_id, period, total_amount, send_status) values (15, '2026-08-01', 0, 'sent');
insert into public.salary_report_lines (report_id, hostess_id, hostess_name, id_number, source_project_id, line_basis,
                                        hours, rate, bonus, travel, line_total)
select 15, 900001 + (i - 1) / 28, 'דיילת ' || ((i - 1) / 28), lpad((900001 + (i - 1) / 28)::text, 9, '0'), 900400 + i,
       case when i = 83 then 'cancellation_compensation' else 'actual' end,
       case when i = 83 then 6 when i = 1 then 5.5 else 6 end,   -- line 1: issued with 5.5h, shift now says 6h
       50, null, case when i = 83 then null else 22.60 end,
       case when i = 83 then 300 when i = 1 then 297.60 else 322.60 end
  from generate_series(1, 83) i;

-- test: before the repair nothing is claimed and the 83 shifts would be collected again
do $$ begin
  assert (select count(*) from public.assignments where salary_report_id = 15) = 0;
  assert (select count(*) from public.payroll_collect('2026-08-01', 'regular', null)) = 83;
end $$;

-- test: the repair re-links exactly the 83 shifts, with travel from the frozen line
-- @include-migration 20261014000900_module8_payroll_august_claim_repair.sql

-- test: after the repair — 83 claims, travel restored, the later month untouched, nothing left to collect
do $$ begin
  assert (select count(*) from public.assignments where salary_report_id = 15) = 83;
  assert (select travel_amount from public.assignments where project_id = 900402) = 22.60;
  assert (select travel_amount from public.assignments where project_id = 900483) = 0;
  assert (select salary_report_id from public.assignments where project_id = 900500) is null;
  assert (select count(*) from public.payroll_collect('2026-08-01', 'regular', null)) = 0;
  -- the guard now protects the repaired claims
  assert test.err($q$update public.assignments set actual_hours = 1 where project_id = 900402$q$) = 'PAYROLL_CLAIM_IMMUTABLE';
end $$;

-- test: the backup holds every re-linked shift with its line, records the value mismatch, and is closed to clients
do $$ begin
  assert (select count(*) from seed_snapshot.assignments_payroll_claim_20261014) = 83;
  -- line 1 (issued 5.5h, shift says 6h) and the compensation line (hours are computed, the shift
  -- holds 0 actual hours — the contract's rule compares actual_hours, so it flags it; live August
  -- has no compensation lines, measured 13.10)
  assert (select count(*) from seed_snapshot.assignments_payroll_claim_20261014 where value_mismatch) = 2;
  assert (select value_mismatch from seed_snapshot.assignments_payroll_claim_20261014 where project_id = 900401);
  -- the backup is the state before the write
  assert (select count(*) from seed_snapshot.assignments_payroll_claim_20261014 where salary_report_id is not null) = 0;
  assert not has_table_privilege('authenticated', 'seed_snapshot.assignments_payroll_claim_20261014', 'select');
  assert not has_table_privilege('anon', 'seed_snapshot.assignments_payroll_claim_20261014', 'select');
end $$;
