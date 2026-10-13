-- Migration 15: operation lifecycle (begin → snapshot → record_artifact → commit), status,
-- abandon, fail, accountant retry. B's readiness is replaced here by the stub, so these checks
-- do not depend on the review loop (B tests readiness itself); `test.ready` steers it.

create or replace function public._payroll_review_assert_ready_locked(
  p_review_id bigint, p_version text, p_exclude_operation_id uuid default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_ready boolean := coalesce(nullif(current_setting('test.ready', true), ''), 'true')::boolean;
begin
  perform 1 from public.payroll_reviews where review_id = p_review_id for update;
  if v_ready then
    return jsonb_build_object('ready', true, 'blockers', '[]'::jsonb, 'counts', '{}'::jsonb);
  end if;
  return jsonb_build_object('ready', false,
    'blockers', jsonb_build_array(jsonb_build_object('code', 'DECISIONS_MISSING', 'count', 1)), 'counts', '{}'::jsonb);
end $$;
revoke execute on function public._payroll_review_assert_ready_locked(bigint, text, uuid) from public, anon, authenticated;

select test.hostess(900001, 'דנה', '012345678');
select test.hostess(900002, 'רות', '023456789', 50, false);
select test.project(900601, '2026-07-05', 'finished');
select test.project(900602, '2026-07-06', 'awaiting_invoice');
select test.project(900603, '2026-07-20', 'cancelled', '20:00', '01:00', 'customer', '2026-07-20 12:00+03');
select test.assign(900601, 900001, 1, 'finally_approved', 6, 50, 20);
select test.assign(900602, 900002, 1, 'finally_approved', 4.5, 55, 0);
select test.assign(900603, 900001, 1, 'released', 0, 50, 0, 'finally_approved');

create table test.ids (k text primary key, v text);
insert into test.ids values ('review', test.review('2026-07-01')::text);
insert into test.ids values ('version', public._payroll_preview_version('2026-07-01', 'regular', null));

create function test.id(p text) returns text language sql as $$ select v from test.ids where k = p $$;
grant select on test.ids to authenticated, service_role;
grant execute on function test.id(text) to authenticated, service_role;

create function test.begin(p_op uuid, p_version text default null, p_review bigint default null,
                           p_period date default '2026-07-01', p_kind text default 'regular', p_original integer default null)
returns jsonb language plpgsql as $$
begin
  perform test.act_as('fin@test.local');
  return public.payroll_operation_begin(p_op, coalesce(p_review, test.id('review')::bigint),
                                        coalesce(p_version, test.id('version')), p_period, p_kind, p_original);
end $$;

-- snapshot + record_artifact as the edge function would do them
create function test.prepare(p_op uuid) returns jsonb language plpgsql as $$
declare s jsonb;
begin
  perform test.act_as_service();
  s := public.payroll_operation_snapshot(p_op, 'fin@test.local');
  if not (s ->> 'ok')::boolean then return s; end if;
  perform public.payroll_operation_record_artifact(p_op, 'fin@test.local',
    (s ->> 'artifact_key_prefix') || (s ->> 'prepare_attempt') || '_07_2026_Payroll_Report.xlsx',
    repeat('c', 64), 2048, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '07_2026_Payroll_Report.xlsx');
  return s;
end $$;

-- test: grants — begin/status/abandon/retry for authenticated; snapshot/record/commit/fail service role only
do $$ begin
  assert has_function_privilege('authenticated', 'public.payroll_operation_begin(uuid,bigint,text,date,text,integer)', 'execute');
  assert has_function_privilege('authenticated', 'public.payroll_operation_status(uuid)', 'execute');
  assert has_function_privilege('authenticated', 'public.payroll_operation_abandon(uuid)', 'execute');
  assert has_function_privilege('authenticated', 'public.payroll_accountant_retry_reserve(integer,bigint,text,boolean)', 'execute');
  assert not has_function_privilege('anon', 'public.payroll_operation_begin(uuid,bigint,text,date,text,integer)', 'execute');
  assert not has_function_privilege('anon', 'public.payroll_operation_status(uuid)', 'execute');
  assert not has_function_privilege('authenticated', 'public.payroll_operation_snapshot(uuid,text)', 'execute');
  assert not has_function_privilege('authenticated', 'public.payroll_commit(uuid,text)', 'execute');
  assert not has_function_privilege('authenticated', 'public.payroll_operation_record_artifact(uuid,text,text,text,integer,text,text)', 'execute');
  assert not has_function_privilege('authenticated', 'public.payroll_operation_fail(uuid,text,text,text)', 'execute');
  assert has_function_privilege('service_role', 'public.payroll_commit(uuid,text)', 'execute');
  assert not has_function_privilege('anon', 'public.payroll_commit(uuid,text)', 'execute');
end $$;

-- test: begin — gate, kill switch, month, review identity, readiness
do $$
declare v_this date := date_trunc('month', now() at time zone 'Asia/Jerusalem')::date;
begin
  perform test.act_as('view@test.local');
  assert test.err($q$select public.payroll_operation_begin(gen_random_uuid(), 1, 'v', '2026-07-01', 'regular', null)$q$) = 'SQLSTATE:42501';
  perform test.act_as_owner();
  update public.payroll_config set final_issue_enabled = false;
  assert test.err($q$select test.begin(gen_random_uuid())$q$) = 'ISSUE_DISABLED';
  perform test.act_as_owner();
  update public.payroll_config set final_issue_enabled = true;
  assert test.err(format('select test.begin(gen_random_uuid(), null, null, %L)', v_this)) = 'MONTH_NOT_ENDED';
  assert test.err($q$select test.begin(gen_random_uuid(), null, 424242)$q$) = 'REVIEW_NOT_FOUND';
  -- the review is for July regular, not for a June request
  assert test.err($q$select test.begin(gen_random_uuid(), null, null, '2026-06-01')$q$) = 'REVIEW_NOT_FOUND';
  perform set_config('test.ready', 'false', true);
  assert test.err($q$select test.begin(gen_random_uuid())$q$) = 'REVIEW_NOT_READY';
  perform test.act_as_owner();
  assert (select count(*) from public.payroll_operations) = 0;
end $$;

-- test: begin — creates a preparing operation; same UUID is idempotent; different parameters are refused
do $$
declare v jsonb;
begin
  v := test.begin('00000000-0000-0000-0000-00000000a001');
  assert (v ->> 'ok')::boolean and not (v ->> 'existing')::boolean and v ->> 'state' = 'preparing';
  v := test.begin('00000000-0000-0000-0000-00000000a001');
  assert (v ->> 'existing')::boolean and v ->> 'operation_id' = '00000000-0000-0000-0000-00000000a001';
  assert test.err($q$select test.begin('00000000-0000-0000-0000-00000000a001', 'v1:other')$q$) = 'IDEMPOTENCY_MISMATCH';
  -- a second tab with a new UUID and the same version resumes the active operation
  v := test.begin('00000000-0000-0000-0000-00000000a002');
  assert (v ->> 'existing')::boolean and v ->> 'operation_id' = '00000000-0000-0000-0000-00000000a001';
  perform test.act_as_owner();
  assert (select count(*) from public.payroll_operations) = 1;
  assert (select actor_email from public.payroll_operations) = 'fin@test.local';
end $$;

-- test: begin — an active operation with another version is superseded by the new one
do $$
declare v jsonb;
begin
  v := test.begin('00000000-0000-0000-0000-00000000a003', 'v1:a-newer-version');
  assert not (v ->> 'existing')::boolean;
  perform test.act_as_owner();
  assert (select state from public.payroll_operations where operation_id = '00000000-0000-0000-0000-00000000a001') = 'superseded';
  -- leave the stale-version one aside; restart cleanly with the real version
  update public.payroll_operations set state = 'superseded' where operation_id = '00000000-0000-0000-0000-00000000a003';
  v := test.begin('00000000-0000-0000-0000-00000000b001');
  assert v ->> 'state' = 'preparing';
end $$;

-- test: snapshot — legacy shape, reserved report id, key prefix; actor checked; only from preparing
do $$
declare s jsonb; l jsonb;
begin
  perform test.act_as_service();
  assert test.err($q$select public.payroll_operation_snapshot('00000000-0000-0000-0000-00000000b001', 'view@test.local')$q$) = 'PERMISSION_DENIED';
  s := public.payroll_operation_snapshot('00000000-0000-0000-0000-00000000b001', 'fin@test.local');
  assert (s ->> 'ok')::boolean and (s ->> 'report_id') is not null and s ->> 'period' = '2026-07-01';
  assert s ->> 'kind' = 'regular' and s -> 'supplement_seq' = 'null'::jsonb and (s ->> 'prepare_attempt')::int = 1;
  assert s ->> 'artifact_key_prefix' = 'payroll/2026-07/00000000-0000-0000-0000-00000000b001/';
  assert (s ->> 'line_count')::int = 3 and jsonb_array_length(s -> 'lines') = 3;
  -- 6×50+20+22.60 = 342.60 · 4.5×55+22.60 = 270.10 · cross-midnight 20:00→01:00 = 5h × 100% × 50 = 250
  assert (s ->> 'total_amount')::numeric = 862.70, s ->> 'total_amount';
  select x into l from jsonb_array_elements(s -> 'lines') x where x ->> 'line_basis' = 'cancellation_compensation';
  assert l -> 'bonus' = 'null'::jsonb and l -> 'travel' = 'null'::jsonb and (l ->> 'hours')::numeric = 5;
  assert l ?& array['hostess_id', 'hostess_name', 'id_number', 'source_project_id', 'line_basis', 'hours', 'rate',
                    'bonus', 'travel', 'line_total', 'bank_name', 'bank_branch', 'bank_account', 'show_in_file'];
  select x into l from jsonb_array_elements(s -> 'lines') x where (x ->> 'hostess_id')::int = 900002;
  assert l -> 'bank_name' = 'null'::jsonb and l ->> 'id_number' = '023456789' and (l ->> 'rate')::text = '55.00';
  perform test.act_as_owner();
  insert into test.ids values ('report', s ->> 'report_id'), ('generated_at', s ->> 'generated_at');
end $$;

-- test: a second snapshot (resume after a crash) keeps the reserved id and generated_at, bumps prepare_attempt
do $$
declare s jsonb;
begin
  perform test.act_as_service();
  s := public.payroll_operation_snapshot('00000000-0000-0000-0000-00000000b001', 'fin@test.local');
  assert (s ->> 'prepare_attempt')::int = 2;
  assert s ->> 'report_id' = test.id('report') and s ->> 'generated_at' = test.id('generated_at');
end $$;

-- test: record_artifact — key must sit under the operation prefix, sha256 hex, xlsx mime; then prepared
do $$
declare p text := 'payroll/2026-07/00000000-0000-0000-0000-00000000b001/';
begin
  perform test.act_as_service();
  assert test.err(format($q$select public.payroll_operation_record_artifact('00000000-0000-0000-0000-00000000b001', 'fin@test.local', %L, %L, 10, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'f.xlsx')$q$,
                         'payroll/2026-07/other-op/2_x.xlsx', repeat('c', 64))) = 'ARTIFACT_INVALID';
  assert test.err(format($q$select public.payroll_operation_record_artifact('00000000-0000-0000-0000-00000000b001', 'fin@test.local', %L, %L, 10, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'f.xlsx')$q$,
                         p || '2_x.xlsx', 'XYZ')) = 'ARTIFACT_INVALID';
  assert test.err(format($q$select public.payroll_operation_record_artifact('00000000-0000-0000-0000-00000000b001', 'fin@test.local', %L, %L, 10, 'application/pdf', 'f.xlsx')$q$,
                         p || '2_x.xlsx', repeat('c', 64))) = 'ARTIFACT_INVALID';
  perform public.payroll_operation_record_artifact('00000000-0000-0000-0000-00000000b001', 'fin@test.local',
    p || '2_07_2026_Payroll_Report.xlsx', repeat('c', 64), 2048,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '07_2026_Payroll_Report.xlsx');
  -- once prepared, snapshot and record are refused (no overwrite of the artifact)
  assert public.payroll_operation_snapshot('00000000-0000-0000-0000-00000000b001', 'fin@test.local') ->> 'code' = 'OPERATION_STATE';
  assert test.err(format($q$select public.payroll_operation_record_artifact('00000000-0000-0000-0000-00000000b001', 'fin@test.local', %L, %L, 10, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'f.xlsx')$q$,
                         p || '3_x.xlsx', repeat('d', 64))) = 'OPERATION_STATE';
end $$;

-- test: status — prepared ⇒ resume; edit and view may read it; pm may not
do $$
declare v jsonb;
begin
  perform test.act_as('view@test.local');
  v := public.payroll_operation_status('00000000-0000-0000-0000-00000000b001');
  assert v ?& array['ok', 'operation_id', 'state', 'failure_code', 'review_id', 'period', 'kind', 'original_report_id',
                    'report_id', 'updated_at', 'accountant_attempt', 'next_action'];
  assert v ->> 'state' = 'prepared' and v ->> 'next_action' = 'resume' and v -> 'accountant_attempt' = 'null'::jsonb;
  perform test.act_as('pm@test.local');
  assert test.err($q$select public.payroll_operation_status('00000000-0000-0000-0000-00000000b001')$q$) = 'SQLSTATE:42501';
  perform test.act_as('fin@test.local');
  assert test.err($q$select public.payroll_operation_status('00000000-0000-0000-0000-0000000000ff')$q$) = 'OPERATION_NOT_FOUND';
end $$;

-- test: commit — not ready ⇒ REVIEW_NOT_READY and the operation stays prepared (resumable); kill switch likewise
do $$
declare c jsonb;
begin
  perform set_config('test.ready', 'false', true);
  perform test.act_as_service();
  c := public.payroll_commit('00000000-0000-0000-0000-00000000b001', 'fin@test.local');
  assert c ->> 'code' = 'REVIEW_NOT_READY' and (c ->> 'retryable')::boolean and jsonb_array_length(c -> 'blockers') = 1;
  perform test.act_as_owner();
  assert (select state from public.payroll_operations where operation_id = '00000000-0000-0000-0000-00000000b001') = 'prepared';
  update public.payroll_config set final_issue_enabled = false;
  perform test.act_as_service();
  assert public.payroll_commit('00000000-0000-0000-0000-00000000b001', 'fin@test.local') ->> 'code' = 'ISSUE_DISABLED';
  assert test.err($q$select public.payroll_commit('00000000-0000-0000-0000-00000000b001', 'pm@test.local')$q$) = 'PERMISSION_DENIED';
  assert public.payroll_commit('00000000-0000-0000-0000-0000000000ff', 'fin@test.local') ->> 'code' = 'OPERATION_NOT_FOUND';
  perform test.act_as_owner();
  assert (select state from public.payroll_operations where operation_id = '00000000-0000-0000-0000-00000000b001') = 'prepared';
  assert (select count(*) from public.salary_reports) = 0;
  update public.payroll_config set final_issue_enabled = true;
end $$;

-- test: commit — data changed after approval ⇒ PREVIEW_CHANGED, operation failed, nothing written
do $$
declare c jsonb; v_op uuid := '00000000-0000-0000-0000-00000000c001';
begin
  -- a parallel operation on June to exercise the failure without touching the main one
  perform test.project(900611, '2026-06-05', 'finished');
  perform test.assign(900611, 900001, 1, 'finally_approved', 3, 50, 0);
  perform test.act_as_owner();
  insert into test.ids values ('review_june', test.review('2026-06-01')::text);
  perform test.begin(v_op, public._payroll_preview_version('2026-06-01', 'regular', null),
                     test.id('review_june')::bigint, '2026-06-01');
  perform test.prepare(v_op);
  perform test.act_as_owner();
  update public.assignments set actual_hours = 3.5 where project_id = 900611;
  perform test.act_as_service();
  c := public.payroll_commit(v_op, 'fin@test.local');
  assert c ->> 'code' = 'PREVIEW_CHANGED' and not (c ->> 'ok')::boolean;
  perform test.act_as_owner();
  assert (select state = 'failed' and failure_code = 'PREVIEW_CHANGED' from public.payroll_operations where operation_id = v_op);
  assert (select count(*) from public.salary_reports where period = '2026-06-01') = 0;
  assert (select salary_report_id from public.assignments where project_id = 900611) is null;
  -- a failed operation is final: next action none; commit again ⇒ OPERATION_STATE
  perform test.act_as_service();
  assert public.payroll_commit(v_op, 'fin@test.local') ->> 'code' = 'OPERATION_STATE';
  perform test.act_as('fin@test.local');
  assert public.payroll_operation_status(v_op) ->> 'next_action' = 'none';
end $$;

-- test: commit — a shift that became eligible after approval also changes the version (F3)
do $$
declare c jsonb; v_op uuid := '00000000-0000-0000-0000-00000000c002';
begin
  perform test.begin(v_op, public._payroll_preview_version('2026-06-01', 'regular', null),
                     test.id('review_june')::bigint, '2026-06-01');
  perform test.prepare(v_op);
  perform test.act_as_owner();
  perform test.project(900612, '2026-06-08', 'event_finished');
  perform test.assign(900612, 900002, 1, 'finally_approved', 2, 50, 0);
  update public.projects set project_status = 'awaiting_invoice', summary_report_url = 'r.pdf' where project_id = 900612;
  perform test.act_as_service();
  c := public.payroll_commit(v_op, 'fin@test.local');
  assert c ->> 'code' = 'PREVIEW_CHANGED';
end $$;

-- test: snapshot — data changed before the file was built ⇒ PREVIEW_CHANGED recorded durably, {ok:false}
do $$
declare s jsonb; v_op uuid := '00000000-0000-0000-0000-00000000c003';
begin
  perform test.begin(v_op, public._payroll_preview_version('2026-06-01', 'regular', null),
                     test.id('review_june')::bigint, '2026-06-01');
  perform test.act_as_owner();
  update public.assignments set personal_bonus = 10 where project_id = 900611;
  perform test.act_as_service();
  s := public.payroll_operation_snapshot(v_op, 'fin@test.local');
  assert s ->> 'code' = 'PREVIEW_CHANGED' and not (s ->> 'ok')::boolean;
  perform test.act_as_owner();
  assert (select state from public.payroll_operations where operation_id = v_op) = 'failed';
end $$;

-- test: commit — success writes the report, lines, claims, review issued, accountant attempt queued
do $$
declare c jsonb; v_r public.salary_reports; v_id int := test.id('report')::int;
begin
  perform test.act_as_service();
  c := public.payroll_commit('00000000-0000-0000-0000-00000000b001', 'FIN@test.local ');
  assert (c ->> 'ok')::boolean and (c ->> 'report_id')::int = v_id, c::text;
  assert (c ->> 'line_count')::int = 3 and (c ->> 'total_amount')::numeric = 862.70;
  perform test.act_as_owner();
  select * into v_r from public.salary_reports where report_id = v_id;
  assert v_r.period = '2026-07-01' and v_r.report_kind = 'regular' and v_r.total_amount = 862.70;
  assert v_r.report_file_url = 'payroll/2026-07/00000000-0000-0000-0000-00000000b001/2_07_2026_Payroll_Report.xlsx';
  assert v_r.artifact_sha256 = repeat('c', 64) and v_r.artifact_filename = '07_2026_Payroll_Report.xlsx';
  assert v_r.operation_id = '00000000-0000-0000-0000-00000000b001' and v_r.review_id = test.id('review')::bigint;
  assert v_r.issued_by = 'fin@test.local' and v_r.issued_at is not null;
  assert v_r.send_status = 'pending' and v_r.delivery_state = 'queued';
  assert (select count(*) from public.salary_report_lines where report_id = v_id
            and assignment_number is not null and event_date is not null) = 3;
  assert (select count(*) from public.assignments where salary_report_id = v_id) = 3;
  assert (select travel_amount from public.assignments where project_id = 900601) = 22.60;
  assert (select travel_amount from public.assignments where project_id = 900603) = 0;
  assert (select status = 'issued' and report_id = v_id from public.payroll_reviews where review_id = test.id('review')::bigint);
  assert (select state = 'committed' and report_id = v_id and accountant_attempt_id = (c ->> 'attempt_id')::bigint
            from public.payroll_operations where operation_id = '00000000-0000-0000-0000-00000000b001');
  assert (select state = 'queued' and intended_recipient = 'accountant@example.test' and retry_reason = 'initial'
                 and operation_id = '00000000-0000-0000-0000-00000000b001'
            from public.payroll_mail_attempts where attempt_id = (c ->> 'attempt_id')::bigint);
end $$;

-- test: the committed lines are exactly what snapshot handed to the file builder
do $$
declare s jsonb; v_id int := test.id('report')::int;
begin
  -- a fresh snapshot is refused now; rebuild the expected legacy lines from storage instead
  select jsonb_agg(jsonb_build_object('hostess_id', l.hostess_id, 'line_basis', l.line_basis, 'hours', l.hours,
                                      'rate', l.rate, 'bonus', l.bonus, 'travel', l.travel, 'line_total', l.line_total)
                   order by l.hostess_id, l.line_basis)
    into s from public.salary_report_lines l where l.report_id = v_id;
  assert s = '[{"hostess_id": 900001, "line_basis": "actual", "hours": 6.00, "rate": 50.00, "bonus": 20.00, "travel": 22.60, "line_total": 342.60},
               {"hostess_id": 900001, "line_basis": "cancellation_compensation", "hours": 5.00, "rate": 50.00, "bonus": null, "travel": null, "line_total": 250.00},
               {"hostess_id": 900002, "line_basis": "actual", "hours": 4.50, "rate": 55.00, "bonus": null, "travel": 22.60, "line_total": 270.10}]'::jsonb, s::text;
end $$;

-- test: commit is idempotent — a second call returns the stored result and writes nothing
do $$
declare c jsonb; n bigint := (select count(*) from public.salary_report_lines);
begin
  perform test.act_as_service();
  c := public.payroll_commit('00000000-0000-0000-0000-00000000b001', 'fin@test.local');
  assert (c ->> 'ok')::boolean and (c ->> 'existing')::boolean and c ->> 'report_id' = test.id('report');
  assert (c ->> 'line_count')::int = 3;
  perform test.act_as_owner();
  assert (select count(*) from public.salary_report_lines) = n;
  assert (select count(*) from public.payroll_mail_attempts) = 1;
end $$;

-- test: after issue — July regular is closed everywhere (preview, legacy writer, new begin)
do $$ begin
  update public.payroll_config set legacy_writer = 'enabled';
  perform test.act_as('fin@test.local');
  assert test.err($q$select public.payroll_preview('2026-07-01')$q$) = 'PERIOD_EXISTS';
  assert test.err($q$select public.generate_salary_report('2026-07-01')$q$) = 'PERIOD_EXISTS';
  assert test.err($q$select test.begin(gen_random_uuid())$q$) = 'PERIOD_EXISTS';
  assert test.err(format($q$select public.finalize_salary_report(%s, null, 'sent')$q$, test.id('report'))) = 'LEGACY_REPORT_MISMATCH';
end $$;

-- test: status after commit follows the accountant attempt — queued ⇒ resume, sending ⇒ wait, unknown ⇒ check_status
do $$
declare a bigint := (select max(attempt_id) from public.payroll_mail_attempts);
begin
  perform test.act_as('fin@test.local');
  assert public.payroll_operation_status('00000000-0000-0000-0000-00000000b001') ->> 'next_action' = 'resume';
  perform test.act_as_service();
  perform public.payroll_attempt_claim(a, 'fin@test.local');
  perform test.act_as('fin@test.local');
  assert public.payroll_operation_status('00000000-0000-0000-0000-00000000b001') ->> 'next_action' = 'wait';
  perform test.act_as_owner();
  update public.payroll_mail_attempts set sending_started_at = now() - interval '3 minutes' where attempt_id = a;
  perform test.act_as('fin@test.local');
  assert public.payroll_operation_status('00000000-0000-0000-0000-00000000b001') ->> 'next_action' = 'check_status';
  assert public.payroll_operation_status('00000000-0000-0000-0000-00000000b001') -> 'accountant_attempt' ->> 'state' = 'unknown';
end $$;

-- test: accountant retry — refused for a legacy report, a stale prior attempt, a changed recipient; unknown needs acknowledgement
do $$
declare a bigint := (select max(attempt_id) from public.payroll_mail_attempts); v_id int := test.id('report')::int;
begin
  insert into public.salary_reports (report_id, period, send_status) values (900090, '2025-11-01', 'failed');
  perform test.act_as('fin@test.local');
  assert test.err($q$select public.payroll_accountant_retry_reserve(900090, 1, 'accountant@example.test', true)$q$) = 'LEGACY_REPORT_MISMATCH';
  assert test.err(format($q$select public.payroll_accountant_retry_reserve(%s, %s, 'accountant@example.test', true)$q$, v_id, a - 1)) = 'STALE_VERSION';
  assert test.err(format($q$select public.payroll_accountant_retry_reserve(%s, %s, 'accountant@example.test', false)$q$, v_id, a)) = 'DELIVERY_UNKNOWN';
  assert test.err(format($q$select public.payroll_accountant_retry_reserve(%s, %s, 'someone@else.test', true)$q$, v_id, a)) = 'STALE_VERSION';
  assert test.err(format($q$select public.payroll_accountant_retry_reserve(%s, %s, 'accountant@example.test', true)$q$, 424242, a)) = 'REPORT_NOT_FOUND';
  perform test.act_as('view@test.local');
  assert test.err(format($q$select public.payroll_accountant_retry_reserve(%s, %s, 'accountant@example.test', true)$q$, v_id, a)) = 'SQLSTATE:42501';
end $$;

-- test: accountant retry after unknown + acknowledgement — prior persisted unknown (F1), new attempt queued
do $$
declare a bigint := (select max(attempt_id) from public.payroll_mail_attempts); v_id int := test.id('report')::int; r jsonb;
begin
  perform test.act_as('fin@test.local');
  r := public.payroll_accountant_retry_reserve(v_id, a, ' Accountant@Example.test', true);
  assert (r ->> 'ok')::boolean and r ->> 'retry_reason' = 'unknown_reviewed_resend';
  perform test.act_as_owner();
  assert (select state = 'unknown' and error_code = 'LEASE_EXPIRED' from public.payroll_mail_attempts where attempt_id = a);
  assert (select state = 'queued' and prior_attempt_id = a and created_by = 'fin@test.local'
            from public.payroll_mail_attempts where attempt_id = (r ->> 'attempt_id')::bigint);
  assert (select delivery_state from public.salary_reports where report_id = v_id) = 'queued';
  -- a queued attempt is not retryable; nor is a sent one
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_accountant_retry_reserve(%s, %s, 'accountant@example.test', true)$q$, v_id, r ->> 'attempt_id')) = 'NOT_RETRYABLE';
  perform test.act_as_service();
  perform public.payroll_attempt_claim((r ->> 'attempt_id')::bigint, 'fin@test.local');
  perform public.payroll_attempt_complete((r ->> 'attempt_id')::bigint, 'fin@test.local', 'failed', 'ishay1997@gmail.com', true,
                                          null, 'דוח', 502, 'HTTP_502', 'bad gateway');
  perform test.act_as('fin@test.local');
  assert public.payroll_operation_status('00000000-0000-0000-0000-00000000b001') ->> 'next_action' = 'retry_send';
  r := public.payroll_accountant_retry_reserve(v_id, (r ->> 'attempt_id')::bigint, 'accountant@example.test');
  assert r ->> 'retry_reason' = 'known_failure_retry';
  perform test.act_as_service();
  perform public.payroll_attempt_claim((r ->> 'attempt_id')::bigint, 'fin@test.local');
  perform public.payroll_attempt_complete((r ->> 'attempt_id')::bigint, 'fin@test.local', 'sent', 'ishay1997@gmail.com', true,
                                          null, 'דוח', 200, null, null);
  perform test.act_as('fin@test.local');
  assert public.payroll_operation_status('00000000-0000-0000-0000-00000000b001') ->> 'next_action' = 'none';
  assert test.err(format($q$select public.payroll_accountant_retry_reserve(%s, %s, 'accountant@example.test', true)$q$, v_id, r ->> 'attempt_id')) = 'NOT_RETRYABLE';
  -- history shows the effective state
  assert public.payroll_report_detail(v_id) -> 'report' ->> 'delivery_state' = 'sent';
end $$;

-- test: supplement — remaining July shifts go to "supplement 1" of the July report; the original is untouched
do $$
declare v_op uuid := '00000000-0000-0000-0000-00000000d001'; v_rev bigint; c jsonb; s jsonb;
        v_orig int := test.id('report')::int; v_orig_total numeric;
begin
  v_orig_total := (select total_amount from public.salary_reports where report_id = v_orig);
  perform test.project(900620, '2026-07-28', 'finished');
  perform test.assign(900620, 900002, 1, 'finally_approved', 2, 55, 0);
  v_rev := test.review('2026-07-01', 'supplement', v_orig);
  perform test.begin(v_op, public._payroll_preview_version('2026-07-01', 'supplement', v_orig), v_rev,
                     '2026-07-01', 'supplement', v_orig);
  s := test.prepare(v_op);
  assert (s ->> 'supplement_seq')::int = 1 and s ->> 'kind' = 'supplement' and (s ->> 'original_report_id')::int = v_orig;
  perform test.act_as_service();
  c := public.payroll_commit(v_op, 'fin@test.local');
  assert (c ->> 'ok')::boolean and (c ->> 'line_count')::int = 1, c::text;
  perform test.act_as_owner();
  assert (select report_kind = 'supplement' and original_report_id = v_orig and supplement_seq = 1 and period = '2026-07-01'
            from public.salary_reports where report_id = (c ->> 'report_id')::int);
  assert (select total_amount from public.salary_reports where report_id = v_orig) = v_orig_total;
  assert (select count(*) from public.salary_report_lines where report_id = v_orig) = 3;
  assert (select salary_report_id from public.assignments where project_id = 900620) = (c ->> 'report_id')::int;
  -- the next supplement for the same original would be number 2
  assert (public._payroll_identity_check('2026-07-01', 'supplement', v_orig) ->> 'next_supplement_seq')::int = 2;
end $$;

-- test: preparing older than 120 s reads as stuck (resume); fresh preparing ⇒ wait; abandon and fail
do $$
declare v_op uuid := '00000000-0000-0000-0000-00000000e001';
begin
  perform test.begin(v_op, public._payroll_preview_version('2026-06-01', 'regular', null),
                     test.id('review_june')::bigint, '2026-06-01');
  perform test.act_as('fin@test.local');
  assert public.payroll_operation_status(v_op) ->> 'next_action' = 'wait';
  perform test.act_as_owner();
  alter table public.payroll_operations disable trigger payroll_operations_set_updated_at;
  update public.payroll_operations set updated_at = now() - interval '3 minutes' where operation_id = v_op;
  alter table public.payroll_operations enable trigger payroll_operations_set_updated_at;
  perform test.act_as('fin@test.local');
  assert public.payroll_operation_status(v_op) ->> 'next_action' = 'resume';
  perform test.act_as_service();
  assert test.err(format($q$select public.payroll_operation_fail(%L, 'view@test.local', 'X', null)$q$, v_op)) = 'PERMISSION_DENIED';
  perform public.payroll_operation_fail(v_op, 'fin@test.local', 'ARTIFACT_TOO_LARGE', repeat('x', 900));
  perform test.act_as_owner();
  assert (select state = 'failed' and failure_code = 'ARTIFACT_TOO_LARGE' and length(failure_detail) = 500
            from public.payroll_operations where operation_id = v_op);
  perform test.act_as_service();
  assert test.err(format($q$select public.payroll_operation_fail(%L, 'fin@test.local', 'X', null)$q$, v_op)) = 'OPERATION_STATE';
end $$;

-- test: abandon — preparing/prepared become superseded; a committed operation cannot be abandoned
do $$
declare v_op uuid := '00000000-0000-0000-0000-00000000e002';
begin
  perform test.begin(v_op, public._payroll_preview_version('2026-06-01', 'regular', null),
                     test.id('review_june')::bigint, '2026-06-01');
  perform test.act_as('view@test.local');
  assert test.err(format('select public.payroll_operation_abandon(%L)', v_op)) = 'SQLSTATE:42501';
  perform test.act_as('fin@test.local');
  assert public.payroll_operation_abandon(v_op) ->> 'state' = 'superseded';
  assert test.err(format('select public.payroll_operation_abandon(%L)', v_op)) = 'OPERATION_STATE';
  assert test.err($q$select public.payroll_operation_abandon('00000000-0000-0000-0000-00000000b001')$q$) = 'OPERATION_STATE';
end $$;

-- test: a cancelled review can no longer be issued; the operation fails instead of writing
do $$
declare v_op uuid := '00000000-0000-0000-0000-00000000e003'; c jsonb;
begin
  perform test.begin(v_op, public._payroll_preview_version('2026-06-01', 'regular', null),
                     test.id('review_june')::bigint, '2026-06-01');
  perform test.prepare(v_op);
  perform test.act_as_owner();
  update public.payroll_reviews set status = 'cancelled' where review_id = test.id('review_june')::bigint;
  perform test.act_as_service();
  c := public.payroll_commit(v_op, 'fin@test.local');
  assert c ->> 'code' = 'REVIEW_NOT_FOUND', c::text;
  perform test.act_as_owner();
  assert (select count(*) from public.salary_reports where period = '2026-06-01') = 0;
end $$;

-- test: a version approved over defective rows still cannot be issued — snapshot says BLOCKERS_PRESENT
do $$
declare v_op uuid := '00000000-0000-0000-0000-00000000f001'; s jsonb;
begin
  perform test.project(900630, '2026-05-20', 'cancelled', '10:00', '16:00', 'customer', null);
  perform test.assign(900630, 900001, 1, 'released', 0, 50, 0, 'finally_approved');
  perform test.begin(v_op, public._payroll_preview_version('2026-05-01', 'regular', null),
                     test.review('2026-05-01'), '2026-05-01');
  perform test.act_as_service();
  s := public.payroll_operation_snapshot(v_op, 'fin@test.local');
  assert s ->> 'code' = 'BLOCKERS_PRESENT' and not (s ->> 'ok')::boolean, s::text;
  perform test.act_as_owner();
  assert (select state = 'failed' and failure_code = 'BLOCKERS_PRESENT' from public.payroll_operations where operation_id = v_op);
end $$;
