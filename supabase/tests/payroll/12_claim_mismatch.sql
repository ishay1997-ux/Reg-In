-- CLAIM_MISMATCH — the last line against paying a shift twice. A real race needs two connections
-- (PGlite has one), so a test-only trigger stands in for "another writer claimed this row first":
-- it silently skips the claim UPDATE of one shift, exactly what the conditional
-- `… and salary_report_id is null` does when someone else got there. Both writers must then
-- roll back everything: no report, no lines, no claim.

select test.hostess(900001, 'דנה', '000900001');
select test.hostess(900002, 'רות', '000900002');
select test.project(900701, '2026-03-05', 'finished');
select test.project(900702, '2026-03-06', 'finished');
select test.assign(900701, 900001, 1, 'finally_approved', 6, 50, 0);
select test.assign(900702, 900002, 1, 'finally_approved', 4, 50, 0);

-- runs after the guard (trigger names fire in alphabetical order); skips the claim of project 900702
create function test.skip_claim() returns trigger language plpgsql as $$
begin
  if old.salary_report_id is null and new.salary_report_id is not null and new.project_id = 900702 then
    return null;
  end if;
  return new;
end $$;
create trigger zz_test_skip_claim before update on public.assignments
  for each row execute function test.skip_claim();

create or replace function public._payroll_review_assert_ready_locked(
  p_review_id bigint, p_version text, p_exclude_operation_id uuid default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
begin
  perform 1 from public.payroll_reviews where review_id = p_review_id for update;
  return jsonb_build_object('ready', true, 'blockers', '[]'::jsonb, 'counts', '{}'::jsonb);
end $$;

-- test: legacy writer — one shift not claimed ⇒ CLAIM_MISMATCH, and the whole report is rolled back
do $$ begin
  update public.payroll_config set legacy_writer = 'enabled';
  perform test.act_as('fin@test.local');
  assert test.err($q$select public.generate_salary_report('2026-03-01')$q$) = 'CLAIM_MISMATCH';
  perform test.act_as_owner();
  assert (select count(*) from public.salary_reports where period = '2026-03-01') = 0;
  assert (select count(*) from public.salary_report_lines) = 0;
  assert (select count(*) from public.assignments where salary_report_id is not null) = 0;
end $$;

-- test: new-flow commit — same: CLAIM_MISMATCH rolls back report, lines, claims, review and attempt; the operation stays prepared
do $$
declare v_op uuid := '00000000-0000-0000-0000-0000000c1a1d'; v_rev bigint; s jsonb; v_detail text;
begin
  v_rev := test.review('2026-03-01');
  perform test.act_as('fin@test.local');
  perform public.payroll_operation_begin(v_op, v_rev, public.payroll_preview('2026-03-01') ->> 'version',
                                         '2026-03-01', 'regular', null);
  perform test.act_as_service();
  s := public.payroll_operation_snapshot(v_op, 'fin@test.local');
  perform public.payroll_operation_record_artifact(v_op, 'fin@test.local',
    (s ->> 'artifact_key_prefix') || '1_03_2026_Payroll_Report.xlsx', repeat('e', 64), 100,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '03_2026_Payroll_Report.xlsx');
  begin
    perform public.payroll_commit(v_op, 'fin@test.local');
  exception when others then
    get stacked diagnostics v_detail = pg_exception_detail;
  end;
  assert v_detail = 'PAYROLL:CLAIM_MISMATCH', coalesce(v_detail, 'no error');
  perform test.act_as_owner();
  assert (select count(*) from public.salary_reports) = 0;
  assert (select count(*) from public.salary_report_lines) = 0;
  assert (select count(*) from public.assignments where salary_report_id is not null) = 0;
  assert (select count(*) from public.payroll_mail_attempts) = 0;
  assert (select status from public.payroll_reviews where review_id = v_rev) = 'open';
  assert (select state from public.payroll_operations where operation_id = v_op) = 'prepared';
end $$;

-- test: once the competing writer is gone the same operation commits cleanly
do $$
declare c jsonb;
begin
  drop trigger zz_test_skip_claim on public.assignments;
  perform test.act_as_service();
  c := public.payroll_commit('00000000-0000-0000-0000-0000000c1a1d', 'fin@test.local');
  assert (c ->> 'ok')::boolean and (c ->> 'line_count')::int = 2, c::text;
end $$;
