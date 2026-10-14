-- Migration 8: assignments_payroll_guard + the guarded legacy writer and finalize.
-- Migration 17 ran in the replica (legacy disabled); checks that need the old dialog turn it on.

select test.hostess(900000 + n, 'דיילת ' || chr(1488 + n), lpad((900000 + n)::text, 9, '0')) from generate_series(1, 8) n;
-- no bank details for hostess 8 (the old JSON then carries null bank fields)
delete from public.hostess_bank_details where hostess_id = 900008;

select test.project(900301, '2026-08-05', 'finished');
select test.project(900302, '2026-08-06', 'awaiting_payment');
select test.project(900303, '2026-08-20', 'cancelled', '10:00', '16:00', 'customer', '2026-08-20 08:00+03');
select test.project(900304, '2026-08-21', 'cancelled', '10:00', '16:00', 'force_majeure', '2026-08-19 08:00+03');
select test.project(900305, '2026-07-15', 'finished');
select test.project(900306, '2026-08-07', 'finished');

select test.assign(900301, 900001, 1, 'finally_approved', 6, 50, 20);
select test.assign(900301, 900002, 1, 'finally_approved', 7.333, 52.5, 0);
select test.assign(900302, 900003, 1, 'finally_approved', 0, 50, 0);
select test.assign(900303, 900004, 1, 'released', 0, 50, 0, 'finally_approved');
select test.assign(900304, 900005, 1, 'released', 0, 50, 0, 'finally_approved');
select test.assign(900305, 900006, 1, 'finally_approved', 5, 50, 0);
select test.assign(900306, 900008, 1, 'finally_approved', 3, 60, 10);

-- a claimed shift to exercise the guard on
insert into public.salary_reports (report_id, period) values (900050, '2026-06-01');
select test.project(900310, '2026-06-10', 'finished');
select test.project(900311, '2026-06-11', 'finished');
select public._payroll_writer_begin();
select test.assign(900310, 900007, 1, 'finally_approved', 6, 50, 0);
update public.assignments set salary_report_id = 900050 where project_id = 900310;
select test.assign(900311, 900007, 1, 'finally_approved', 4, 50, 0);
update public.assignments set salary_report_id = 900050 where project_id = 900311;

update public.payroll_config set legacy_writer = 'enabled';

-- test: guard — a non-writer cannot insert a claimed row; the writer can
do $$ begin
  assert test.err($q$insert into public.assignments (project_id, hostess_id, assignment_number, assignment_status, hourly_rate_snapshot, event_date, salary_report_id)
                    values (900310, 900007, 2, 'pending', 50, '2026-06-10', 900050)$q$) = 'PAYROLL_CLAIM_IMMUTABLE';
  perform public._payroll_writer_begin();
  assert test.err($q$insert into public.assignments (project_id, hostess_id, assignment_number, assignment_status, hourly_rate_snapshot, event_date, salary_report_id)
                    values (900310, 900007, 2, 'pending', 50, '2026-06-10', 900050)$q$) = 'OK';
end $$;

-- test: guard — every frozen money column of a claimed row is refused, one by one
do $$
declare c text;
begin
  foreach c in array array['actual_hours = 7', 'hourly_rate_snapshot = 60', 'personal_bonus = 5', 'travel_amount = 1',
                           'hostess_id = 900006', 'project_id = 900306', 'assignment_number = 9',
                           'salary_report_id = null']
  loop
    assert test.err('update public.assignments set ' || c || ' where project_id = 900310 and assignment_number = 1')
           = 'PAYROLL_CLAIM_IMMUTABLE', c;
  end loop;
end $$;

-- test: guard — status, attendance and event_date of a claimed row stay editable (modules 4/6, date sync)
do $$ begin
  update public.assignments set attendance_status = 'arrived' where project_id = 900310 and assignment_number = 1;
  update public.assignments set assignment_status = 'released', released_from_status = 'finally_approved'
   where project_id = 900310 and assignment_number = 1;
  update public.assignments set assignment_status = 'finally_approved', released_from_status = null
   where project_id = 900310 and assignment_number = 1;
  -- the project date-sync trigger rewrites event_date of every row, claimed ones included
  update public.projects set final_event_date = '2026-06-12' where project_id = 900310;
  assert (select event_date from public.assignments where project_id = 900310 and assignment_number = 1) = '2026-06-12';
  -- setting a frozen column to its own value is not a change
  update public.assignments set actual_hours = actual_hours where project_id = 900310;
end $$;

-- test: guard — claiming or un-claiming needs the writer; unclaimed rows stay fully editable
do $$ begin
  assert test.err($q$update public.assignments set salary_report_id = 900050 where project_id = 900301 and hostess_id = 900001$q$) = 'PAYROLL_CLAIM_IMMUTABLE';
  update public.assignments set actual_hours = 6.5 where project_id = 900301 and hostess_id = 900001;
  update public.assignments set actual_hours = 6 where project_id = 900301 and hostess_id = 900001;
  perform public._payroll_writer_begin();
  update public.assignments set salary_report_id = null where project_id = 900311;
  update public.assignments set salary_report_id = 900050 where project_id = 900311;
end $$;

-- test: guard — deleting a claimed row is refused, also through a cascaded project delete; unclaimed delete works
do $$ begin
  assert test.err($q$delete from public.assignments where project_id = 900310 and assignment_number = 1$q$) = 'PAYROLL_CLAIM_IMMUTABLE';
  assert test.err($q$delete from public.projects where project_id = 900311$q$) = 'PAYROLL_CLAIM_IMMUTABLE';
  assert test.err($q$delete from public.assignments where project_id = 900305$q$) = 'OK';
  assert test.err($q$select test.assign(900305, 900006, 1, 'finally_approved', 5, 50, 0)$q$) = 'OK';
end $$;

-- test: guard — a hostesses-edit user (RLS allows the write) still cannot change a claimed row
do $$ begin
  perform test.act_as('pm@test.local');
  assert test.err($q$update public.assignments set actual_hours = 1 where project_id = 900310 and assignment_number = 1$q$) = 'PAYROLL_CLAIM_IMMUTABLE';
  assert test.err($q$update public.assignments set salary_report_id = null where project_id = 900310$q$) = 'PAYROLL_CLAIM_IMMUTABLE';
  -- a forged flag naming another transaction is not the writer
  perform set_config('regin.payroll_writer', 'tx:' || (txid_current() - 1), true);
  assert test.err($q$update public.assignments set actual_hours = 1 where project_id = 900310 and assignment_number = 1$q$) = 'PAYROLL_CLAIM_IMMUTABLE';
end $$;

-- test: legacy generate returns exactly the old JSON (same keys, values, order) on the same month-only fixture
do $$
declare v_old jsonb; v_new jsonb;
begin
  begin
    -- remove July (the old writer is cumulative, the new one is month-only) so both see the same rows
    delete from public.assignments where project_id = 900305;
    -- the old body sets no writer flag; give it one so it can run past the new guard
    perform public._payroll_writer_begin();
    perform test.act_as('fin@test.local');
    v_old := live_copy.generate_salary_report('2026-08-01');
    raise exception using errcode = 'XRB01';
  exception when sqlstate 'XRB01' then null;
  end;
  begin
    perform test.act_as_owner();
    delete from public.assignments where project_id = 900305;
    perform test.act_as('fin@test.local');
    v_new := public.generate_salary_report('2026-08-01');
    raise exception using errcode = 'XRB01';
  exception when sqlstate 'XRB01' then null;
  end;
  assert v_old is not null and v_new is not null;
  assert (select array_agg(k order by k) from jsonb_object_keys(v_old) k) = (select array_agg(k order by k) from jsonb_object_keys(v_new) k);
  assert v_old - 'report_id' = v_new - 'report_id', format(E'old %s\nnew %s', v_old - 'report_id', v_new - 'report_id');
  assert (v_new ->> 'line_count')::int = 6;
  -- the same text, key for key, line for line (jsonb equality already covers numeric scale)
  assert (v_old -> 'lines')::text = (v_new -> 'lines')::text;
end $$;

-- test: legacy generate is month-only — July's unclaimed shift is not swept into August
do $$
declare v jsonb;
begin
  perform test.act_as('fin@test.local');
  v := public.generate_salary_report('2026-08-15');
  assert v ->> 'period' = '2026-08-01' and (v ->> 'line_count')::int = 6;
  perform test.act_as_owner();
  assert (select salary_report_id from public.assignments where project_id = 900305) is null;
  assert (select count(*) from public.assignments where salary_report_id = (v ->> 'report_id')::int) = 6;
  assert (select report_kind from public.salary_reports where report_id = (v ->> 'report_id')::int) = 'regular';
  -- new line columns are filled; travel_amount stamped on the claimed shift
  assert not exists (select 1 from public.salary_report_lines where report_id = (v ->> 'report_id')::int
                       and (assignment_number is null or event_date is null));
  assert (select travel_amount from public.assignments where project_id = 900301 and hostess_id = 900001) = 22.60;
  assert (select travel_amount from public.assignments where project_id = 900302) = 0;
  assert (select sum(line_total) from public.salary_report_lines where report_id = (v ->> 'report_id')::int)
         = (select total_amount from public.salary_reports where report_id = (v ->> 'report_id')::int);
end $$;

-- test: legacy generate — PERIOD_EXISTS (old Hebrew text) for a month already issued
do $$
declare v_msg text; v_detail text;
begin
  perform test.act_as('fin@test.local');
  begin
    perform public.generate_salary_report('2026-08-01');
  exception when others then
    get stacked diagnostics v_msg = message_text, v_detail = pg_exception_detail;
  end;
  assert v_detail = 'PAYROLL:PERIOD_EXISTS';
  assert v_msg like 'דוח לחודש 08/2026 כבר הופק (מספר %). לא ניתן להפיק פעמיים אותו חודש.';
end $$;

-- test: legacy generate refuses the current month, a future month, a month in review, and when disabled
do $$
declare v_this date := date_trunc('month', now() at time zone 'Asia/Jerusalem')::date;
begin
  perform test.act_as('fin@test.local');
  assert test.err(format('select public.generate_salary_report(%L)', v_this)) = 'MONTH_NOT_ENDED';
  assert test.err(format('select public.generate_salary_report(%L)', (v_this + interval '1 month')::date)) = 'FUTURE_PERIOD';
  assert test.err('select public.generate_salary_report(null)') = 'PERIOD_INVALID';
  perform test.act_as_owner();
  perform test.review('2026-07-01');
  perform test.act_as('fin@test.local');
  assert test.err($q$select public.generate_salary_report('2026-07-01')$q$) = 'PERIOD_IN_REVIEW';
  perform test.act_as_owner();
  update public.payroll_config set legacy_writer = 'disabled';
  perform test.act_as('fin@test.local');
  assert test.err($q$select public.generate_salary_report('2026-05-01')$q$) = 'LEGACY_DISABLED';
end $$;

-- test: legacy generate — line defects block with their code (old Hebrew text for compensation hours)
do $$ begin
  update public.payroll_config set legacy_writer = 'enabled';
  perform test.project(900320, '2026-05-20', 'cancelled', '10:00', '16:00', 'customer', null);
  perform test.assign(900320, 900001, 1, 'released', 0, 50, 0, 'finally_approved');
  perform test.act_as('fin@test.local');
  assert test.err($q$select public.generate_salary_report('2026-05-01')$q$) = 'COMP_HOURS_MISSING';
  perform test.act_as_owner();
  update public.hostesses set id_number = ' ' where hostess_id = 900002;
  perform test.project(900321, '2026-04-20', 'finished');
  perform test.assign(900321, 900002, 1, 'finally_approved', 3, 50, 0);
  perform test.act_as('fin@test.local');
  assert test.err($q$select public.generate_salary_report('2026-04-01')$q$) = 'IDENTITY_MISSING';
end $$;

-- test: legacy generate keeps the old ACL (authenticated, no anon) and the permission gate
do $$ begin
  assert has_function_privilege('authenticated', 'public.generate_salary_report(date)', 'execute');
  assert not has_function_privilege('anon', 'public.generate_salary_report(date)', 'execute');
  assert has_function_privilege('authenticated', 'public.finalize_salary_report(integer,text,text)', 'execute');
  assert not has_function_privilege('anon', 'public.finalize_salary_report(integer,text,text)', 'execute');
  perform test.act_as('view@test.local');
  assert test.err($q$select public.generate_salary_report('2026-03-01')$q$) = 'SQLSTATE:42501';
end $$;

-- test: legacy finalize — fills the file once, sets status, refuses a different file and a final status
do $$
declare v_id int := (select report_id from public.salary_reports where period = '2026-08-01');
begin
  perform test.act_as('fin@test.local');
  assert (public.finalize_salary_report(v_id, 'salary_reports/a.xlsx', 'failed') ->> 'send_status') = 'failed';
  -- same file again is fine (a resend after failure)
  assert (public.finalize_salary_report(v_id, 'salary_reports/a.xlsx', 'sent') ->> 'ok')::boolean;
  assert test.err(format($q$select public.finalize_salary_report(%s, null, 'failed')$q$, v_id)) = 'STATUS_TRANSITION_INVALID';
  perform test.act_as_owner();
  assert (select send_status = 'sent' and report_file_url = 'salary_reports/a.xlsx' and sent_date = current_date
            from public.salary_reports where report_id = v_id);
end $$;

-- test: legacy finalize — a different file is ARTIFACT_IMMUTABLE; a null file keeps the stored one; unknown status keeps old text
do $$
declare v_msg text;
begin
  insert into public.salary_reports (report_id, period, report_file_url, send_status) values (900060, '2026-02-01', 'salary_reports/x.xlsx', 'failed');
  insert into public.salary_reports (report_id, period, send_status) values (900061, '2026-01-01', 'pending');
  perform test.act_as('fin@test.local');
  assert test.err($q$select public.finalize_salary_report(900060, 'salary_reports/y.xlsx', 'sent')$q$) = 'ARTIFACT_IMMUTABLE';
  perform public.finalize_salary_report(900060, null, 'sent');
  perform public.finalize_salary_report(900061, null, 'failed');
  begin
    perform public.finalize_salary_report(900061, null, 'maybe');
  exception when others then get stacked diagnostics v_msg = message_text;
  end;
  assert v_msg = 'סטטוס שליחה לא מוכר.';
  begin
    perform public.finalize_salary_report(424242, null, 'sent');
  exception when others then get stacked diagnostics v_msg = message_text;
  end;
  assert v_msg = 'דוח שכר 424242 לא נמצא.';
  perform test.act_as_owner();
  assert (select report_file_url from public.salary_reports where report_id = 900060) = 'salary_reports/x.xlsx';
end $$;

-- test: legacy finalize refuses a new-contract report and runs only while the legacy writer is enabled
do $$ begin
  insert into public.salary_reports (report_id, period, operation_id, send_status)
  values (900070, '2025-12-01', '00000000-0000-0000-0000-000000000070', 'pending');
  perform test.act_as('fin@test.local');
  assert test.err($q$select public.finalize_salary_report(900070, null, 'sent')$q$) = 'LEGACY_REPORT_MISMATCH';
  perform test.act_as_owner();
  update public.payroll_config set legacy_writer = 'disabled';
  perform test.act_as('fin@test.local');
  assert test.err($q$select public.finalize_salary_report(900061, null, 'sent')$q$) = 'LEGACY_DISABLED';
end $$;
