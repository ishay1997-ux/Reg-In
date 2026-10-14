-- Migration 15d: payroll_review_case_detail.current_rows[].line_basis (B's function, redefined by A).
-- Needs B's real review tables: run with B's migrations, e.g.
--   node scripts/payroll-replica/run.mjs supabase/tests/payroll \
--     --extra-migration ../Reg-In-payroll-b/supabase/migrations/20261014000700_module8_payroll_review_tables.sql \
--     --extra-migration ../Reg-In-payroll-b/supabase/migrations/20261014001100_module8_payroll_review_core_rpcs.sql …
-- Without them (stub tables) every check here reports a skip notice and passes.

select test.hostess(900001, 'דנה', '000900001');
select test.project(900801, '2026-02-05', 'finished');
select test.project(900802, '2026-02-06', 'cancelled', '10:00', '16:00', 'customer', '2026-02-06 08:00+03');
select test.project(900803, '2026-02-07', 'finished');
select test.assign(900801, 900001, 1, 'finally_approved', 6, 50, 0);
select test.assign(900802, 900001, 1, 'released', 0, 50, 0, 'finally_approved');
select test.assign(900803, 900001, 1, 'declined', 0, 50, 0);

-- test: each current row says whether it is an actual shift, a cancellation compensation, or neither
do $$
declare v_rev bigint; v_rec bigint; v_case bigint; v jsonb;
begin
  if to_regclass('public.payroll_source_corrections') is null then
    raise notice 'skip: B review tables not loaded (stub replica)';
    return;
  end if;
  v_rev := test.review('2026-02-01');
  v_rec := test.recipient(v_rev, 900001, 'דנה');
  execute $q$insert into public.payroll_review_cases (review_id, recipient_id, hostess_id, phase, category, affected_rows, description)
             values ($1, $2, 900001, 'pre_issue', 'hours',
                     '[{"key":"r1","project_id":900801,"assignment_number":1},
                       {"key":"r2","project_id":900802,"assignment_number":1},
                       {"key":"r3","project_id":900803,"assignment_number":1}]'::jsonb, 'בדיקה')
             returning case_id$q$ into v_case using v_rev, v_rec;
  perform test.act_as('fin@test.local');
  v := public.payroll_review_case_detail(v_case);
  assert jsonb_array_length(v -> 'current_rows') = 3, v::text;
  assert (select x ->> 'line_basis' from jsonb_array_elements(v -> 'current_rows') x where (x ->> 'project_id')::int = 900801) = 'actual';
  assert (select x ->> 'line_basis' from jsonb_array_elements(v -> 'current_rows') x where (x ->> 'project_id')::int = 900802) = 'cancellation_compensation';
  assert (select x -> 'line_basis' from jsonb_array_elements(v -> 'current_rows') x where (x ->> 'project_id')::int = 900803) = 'null'::jsonb;
  -- B's fields are all still there
  assert (select x ?& array['project_id', 'assignment_number', 'assignment_status', 'attendance_status', 'actual_hours',
                            'personal_bonus', 'hourly_rate_snapshot', 'project_actual_hours', 'project_status',
                            'event_name', 'salary_report_id']
            from jsonb_array_elements(v -> 'current_rows') x limit 1);
end $$;

-- test: ACL unchanged — authenticated with the finance-edit gate, never anon
do $$ begin
  if to_regprocedure('public.payroll_review_case_detail(bigint)') is null then
    raise notice 'skip';
    return;
  end if;
  assert has_function_privilege('authenticated', 'public.payroll_review_case_detail(bigint)', 'execute');
  assert not has_function_privilege('anon', 'public.payroll_review_case_detail(bigint)', 'execute');
  perform test.act_as('view@test.local');
  assert test.err('select public.payroll_review_case_detail(1)') = 'SQLSTATE:42501';
end $$;
