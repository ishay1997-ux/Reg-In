-- Migration 9 must refuse — and change nothing — unless every line has exactly one candidate,
-- no shift is matched twice, and the result is the 83 claims the contract fixes (§1.1).

select test.hostess(900001, 'דיילת א', '000900001');
select test.project(900401, '2026-08-03', 'finished');
select test.project(900402, '2026-08-04', 'finished');
select test.assign(900401, 900001, 1, 'finally_approved', 6, 50, 0);
insert into public.salary_reports (report_id, period, total_amount, send_status) values (15, '2026-08-01', 0, 'sent');
-- line 2 points at project 900402, which has no shift yet ⇒ zero candidates
insert into public.salary_report_lines (report_id, hostess_id, hostess_name, id_number, source_project_id, line_basis,
                                        hours, rate, line_total)
values (15, 900001, 'דיילת א', '000900001', 900401, 'actual', 6, 50, 300),
       (15, 900001, 'דיילת א', '000900001', 900402, 'actual', 6, 50, 300);

-- test: a line without a candidate aborts the whole repair — no claim, no backup table
do $t$
declare v_msg text;
begin
  begin
    execute $m$
-- @include-migration 20261014000900_module8_payroll_august_claim_repair.sql
    $m$;
  exception when others then
    get stacked diagnostics v_msg = message_text;
  end;
  assert v_msg like 'august claim repair aborted:%', coalesce(v_msg, 'no error');
  assert (select count(*) from public.assignments where salary_report_id = 15) = 0;
  assert to_regclass('seed_snapshot.assignments_payroll_claim_20261014') is null;
end $t$;

-- test: two lines that match the same shift abort too
do $t$
declare v_msg text;
begin
  perform test.assign(900402, 900001, 1, 'finally_approved', 6, 50, 0);
  insert into public.salary_report_lines (report_id, hostess_id, hostess_name, id_number, source_project_id, line_basis,
                                          hours, rate, line_total)
  values (15, 900001, 'דיילת א', '000900001', 900402, 'actual', 6, 50, 300);
  begin
    execute $m$
-- @include-migration 20261014000900_module8_payroll_august_claim_repair.sql
    $m$;
  exception when others then
    get stacked diagnostics v_msg = message_text;
  end;
  assert v_msg like 'august claim repair aborted:%', coalesce(v_msg, 'no error');
  assert (select count(*) from public.assignments where salary_report_id = 15) = 0;
end $t$;

-- test: a clean match that is not 83 claims fails the post-check and rolls back
do $t$
declare v_msg text;
begin
  -- remove the duplicate line (test-only: lines are immutable in production)
  alter table public.salary_report_lines disable trigger salary_report_lines_immutable;
  delete from public.salary_report_lines
   where line_id = (select max(line_id) from public.salary_report_lines where source_project_id = 900402);
  alter table public.salary_report_lines enable trigger salary_report_lines_immutable;
  begin
    execute $m$
-- @include-migration 20261014000900_module8_payroll_august_claim_repair.sql
    $m$;
  exception when others then
    get stacked diagnostics v_msg = message_text;
  end;
  assert v_msg like 'august claim repair post-check failed: 2 lines, 2 updated, 2 now claimed', coalesce(v_msg, 'no error');
  assert (select count(*) from public.assignments where salary_report_id = 15) = 0;
  assert to_regclass('seed_snapshot.assignments_payroll_claim_20261014') is null;
end $t$;
