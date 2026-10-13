-- Migration 5: payroll_collect, identity check, version hash, preview, pending closure,
-- accountant config, delivery-address mirror.
--
-- Fixture: August 2026 (an ended month). Compensation cases are timed against an event that
-- starts 20/08/2026 10:00 Israel time (07:00 UTC, IDT).

select test.hostess(900000 + n, 'דיילת ' || n, lpad((900000 + n)::text, 9, '0')) from generate_series(1, 12) n;
select test.hostess(900013, 'דיילת בלי ת"ז', '', 50, false);

select test.project(900201, '2026-08-31', 'finished');
select test.project(900202, '2026-09-01', 'finished');
select test.project(900203, '2026-08-15', 'finished');
select test.project(900204, '2026-08-10', 'awaiting_invoice');
select test.project(900205, '2026-08-12', 'event_finished');
select test.project(900206, '2026-08-20', 'cancelled', '10:00', '16:00', 'other', '2026-08-17 10:00+03');
select test.project(900207, '2026-08-20', 'cancelled', '10:00', '16:00', 'other', '2026-08-17 09:59+03');
select test.project(900208, '2026-08-20', 'cancelled', '10:00', '16:00', 'customer', '2026-08-19 10:00+03');
select test.project(900209, '2026-08-20', 'cancelled', '10:00', '16:00', 'customer', '2026-08-19 10:01+03');
select test.project(900210, '2026-08-20', 'cancelled', '10:00', '16:00', 'force_majeure', '2026-08-20 09:00+03');
select test.project(900211, '2026-08-20', 'cancelled', '22:00', '02:00', 'customer', '2026-08-20 21:00+03');
select test.project(900212, '2026-08-20', 'cancelled', '10:00', '10:00', 'customer', '2026-08-20 09:00+03');
select test.project(900213, '2026-08-20', 'cancelled', '10:00', '16:00', 'customer', null);
select test.project(900214, '2026-08-25', 'cancelled', '10:00', '16:00', 'customer', '2026-08-25 09:00+03');
select test.project(900215, '2026-08-05', 'finished');
select test.project(900216, '2026-08-06', 'finished');
select test.project(900220, '2024-02-29', 'finished');
select test.project(900221, '2024-03-01', 'finished');

select test.assign(900201, 900001, 1, 'finally_approved', 6, 50, 20);
select test.assign(900201, 900002, 1, 'pending', 6, 50, 0);
select test.assign(900202, 900001, 1, 'finally_approved', 5, 50, 0);
select test.assign(900203, 900002, 1, 'finally_approved', 7.333, 50, 0);
select test.assign(900204, 900003, 1, 'finally_approved', 0, 50, 0);
select test.assign(900205, 900004, 1, 'finally_approved', 6, 50, 0);
select test.assign(900206, 900005, 1, 'released', 0, 50, 0, 'finally_approved');
select test.assign(900207, 900006, 1, 'released', 0, 50, 0, 'finally_approved');
select test.assign(900208, 900007, 1, 'released', 0, 50, 0, 'finally_approved');
select test.assign(900209, 900008, 1, 'released', 0, 50, 0, 'finally_approved');
select test.assign(900210, 900009, 1, 'released', 0, 50, 0, 'finally_approved');
select test.assign(900211, 900010, 1, 'released', 0, 50, 0, 'finally_approved');
select test.assign(900212, 900011, 1, 'released', 0, 50, 0, 'finally_approved');
select test.assign(900213, 900012, 1, 'released', 0, 50, 0, 'finally_approved');
select test.assign(900214, 900005, 1, 'released', 0, 50, 0, 'finally_approved');
select test.assign(900214, 900005, 2, 'released', 0, 50, 0, 'finally_approved');
select test.assign(900215, 900013, 1, 'finally_approved', 4, 50, 0);
select test.assign(900220, 900001, 1, 'finally_approved', 1, 50, 0);
select test.assign(900221, 900001, 1, 'finally_approved', 1, 50, 0);

-- a claimed shift (already in an older report) must never be collected again
insert into public.salary_reports (report_id, period) values (900050, '2026-07-01');
select public._payroll_writer_begin();
select test.assign(900216, 900001, 1, 'finally_approved', 6, 50, 0);
update public.assignments set salary_report_id = 900050 where project_id = 900216;

-- runs p_sql, returns the August preview version, and rolls the change back
create function test.version_after(p_sql text) returns text language plpgsql as $$
declare v text;
begin
  begin
    execute p_sql;
    v := public._payroll_preview_version('2026-08-01', 'regular', null);
    raise exception using errcode = 'XRB01';
  exception when sqlstate 'XRB01' then
    null;
  end;
  return v;
end $$;

create function test.aug() returns setof public.payroll_line language sql as $$
  select * from public.payroll_collect('2026-08-01', 'regular', null)
$$;

-- test: month membership — 31/8 in August, 1/9 in September, claimed and unapproved rows never
do $$ begin
  assert (select count(*) from test.aug()) = 14, (select count(*) from test.aug())::text;
  assert exists (select 1 from test.aug() where project_id = 900201);
  assert not exists (select 1 from test.aug() where project_id in (900202, 900205, 900216));
  assert not exists (select 1 from test.aug() where project_id = 900201 and hostess_id = 900002);
  assert (select count(*) from public.payroll_collect('2026-09-01', 'regular', null) where project_id = 900202) = 1;
  -- the day passed in does not matter, only its month
  assert (select count(*) from public.payroll_collect('2026-08-17', 'regular', null)) = 14;
  -- kind does not change membership
  assert (select count(*) from public.payroll_collect('2026-08-01', 'supplement', 900050)) = 14;
end $$;

-- test: leap February — 29/2/2024 belongs to February, 1/3/2024 to March
do $$ begin
  assert (select count(*) from public.payroll_collect('2024-02-01', 'regular', null) where project_id = 900220) = 1;
  assert (select count(*) from public.payroll_collect('2024-02-01', 'regular', null) where project_id = 900221) = 0;
  assert (select count(*) from public.payroll_collect('2024-03-01', 'regular', null) where project_id = 900221) = 1;
end $$;

-- test: actual line money — bonus, travel only when hours > 0, total on unrounded hours
do $$
declare r public.payroll_line;
begin
  select * into r from test.aug() where project_id = 900201;
  assert r.line_basis = 'actual' and r.hours = 6 and r.rate = 50 and r.bonus = 20 and r.travel = 22.60;
  assert r.line_total = 342.60 and r.show_in_file and r.defects = '{}' and r.warnings = '{}';
  assert r.comp_pct is null and r.event_date = '2026-08-31' and r.hostess_name = 'דיילת 1';
  assert r.id_number = '000900001' and r.hostess_email = 'h900001@test.local';

  select * into r from test.aug() where project_id = 900203;
  assert r.hours_raw = 7.333 and r.hours = 7.33;
  -- 7.333 × 50 = 366.65 (not 7.33 × 50 = 366.50), + travel 22.60
  assert r.line_total = 389.25, r.line_total::text;

  select * into r from test.aug() where project_id = 900204;
  assert r.hours = 0 and r.travel = 0 and r.line_total = 0;
  assert r.warnings = array['ZERO_VALUE'] and not r.show_in_file and r.defects = '{}';
end $$;

-- test: compensation thresholds — exactly 72h = 50%, 72h+1min = 0%, exactly 24h = 50%, 23h59 = 100%
do $$ begin
  assert (select comp_pct from test.aug() where project_id = 900206) = 50;
  assert (select hours from test.aug() where project_id = 900206) = 3;
  assert (select line_total from test.aug() where project_id = 900206) = 150;
  assert (select comp_pct from test.aug() where project_id = 900207) = 0;
  assert (select warnings from test.aug() where project_id = 900207) = array['ZERO_VALUE'];
  assert (select comp_pct from test.aug() where project_id = 900208) = 50;
  assert (select comp_pct from test.aug() where project_id = 900209) = 100;
  assert (select line_total from test.aug() where project_id = 900209) = 300;
  -- compensation rows carry no bonus and no travel (0 here, null in the preview)
  assert (select bonus + travel from test.aug() where project_id = 900209) = 0;
end $$;

-- test: force majeure pays 0 hours, shown as a zero row not in the file
do $$
declare r public.payroll_line;
begin
  select * into r from test.aug() where project_id = 900210;
  assert r.comp_pct = 0 and r.hours = 0 and r.line_total = 0 and not r.show_in_file;
  assert r.defects = '{}' and r.warnings = array['ZERO_VALUE'];
end $$;

-- test: cross-midnight compensation uses D1 — 22:00→02:00 is 4 hours, not −20
do $$
declare r public.payroll_line;
begin
  select * into r from test.aug() where project_id = 900211;
  assert r.hours_raw = 4 and r.comp_pct = 100 and r.line_total = 200, r.hours_raw::text;
end $$;

-- test: equal start and end gives 0 hours with COMP_DURATION_ZERO
do $$
declare r public.payroll_line;
begin
  select * into r from test.aug() where project_id = 900212;
  assert r.hours = 0 and r.line_total = 0;
  assert r.warnings @> array['COMP_DURATION_ZERO', 'ZERO_VALUE'] and r.defects = '{}';
end $$;

-- test: missing cancellation time is a defect (COMP_HOURS_MISSING), never a silent 100%
do $$
declare r public.payroll_line;
begin
  select * into r from test.aug() where project_id = 900213;
  assert r.hours_raw is null and r.line_total is null and r.defects = array['COMP_HOURS_MISSING'];
  assert r.show_in_file;
end $$;

-- test: a missing compensation threshold param is a defect too, not 100%
do $$ begin
  assert test.version_after($q$update public.params set param_value = '' where param_name = 'שעות_פיצוי_ביטול_חלקי'$q$) is not null;
  begin
    update public.params set param_value = '' where param_name = 'שעות_פיצוי_ביטול_חלקי';
    assert (select defects from test.aug() where project_id = 900209) = array['COMP_HOURS_MISSING'];
    -- force majeure does not need the thresholds
    assert (select defects from test.aug() where project_id = 900210) = '{}';
    raise exception using errcode = 'XRB01';
  exception when sqlstate 'XRB01' then null;
  end;
end $$;

-- test: missing start/end time is COMP_HOURS_MISSING
do $$ begin
  begin
    update public.projects set final_start_time = null where project_id = 900209;
    assert (select defects from test.aug() where project_id = 900209) = array['COMP_HOURS_MISSING'];
    raise exception using errcode = 'XRB01';
  exception when sqlstate 'XRB01' then null;
  end;
end $$;

-- test: two compensation shifts of the same hostess in the same project are two lines
do $$ begin
  assert (select count(*) from test.aug() where project_id = 900214 and hostess_id = 900005) = 2;
  assert (select array_agg(assignment_number order by assignment_number) from test.aug() where project_id = 900214) = array[1, 2];
end $$;

-- test: empty ID number is IDENTITY_MISSING; empty name too
do $$ begin
  assert (select defects from test.aug() where project_id = 900215) = array['IDENTITY_MISSING'];
  begin
    update public.hostesses set full_name = '  ' where hostess_id = 900002;
    assert (select defects from test.aug() where project_id = 900203) = array['IDENTITY_MISSING'];
    raise exception using errcode = 'XRB01';
  exception when sqlstate 'XRB01' then null;
  end;
end $$;

-- test: version is deterministic and actor-free (D8)
do $$
declare v1 text; v2 text;
begin
  v1 := public._payroll_preview_version('2026-08-01', 'regular', null);
  perform test.act_as('fin@test.local');
  perform test.act_as_owner();
  v2 := public._payroll_preview_version('2026-08-01', 'regular', null);
  assert v1 = v2 and v1 ~ '^v1:[0-9a-f]{64}$';
  assert v1 <> public._payroll_preview_version('2026-08-01', 'supplement', 900050);
end $$;

-- test: version changes on a same-total swap, a bank change, the accountant, the template, a param, a name
do $$
declare v0 text := public._payroll_preview_version('2026-08-01', 'regular', null);
begin
  -- swap: the 6h actual shift moves from hostess 1 to hostess 12 at the same money
  assert test.version_after($q$update public.assignments set hostess_id = 900012 where project_id = 900201 and hostess_id = 900001$q$) <> v0;
  assert test.version_after($q$update public.hostess_bank_details set bank_account = '999' where hostess_id = 900001$q$) <> v0;
  assert test.version_after($q$delete from public.hostess_bank_details where hostess_id = 900001$q$) <> v0;
  assert test.version_after($q$update public.params set param_value = 'other@example.test' where param_name = 'מייל_משרד_רואי_חשבון'$q$) <> v0;
  assert test.version_after($q$update public.params set param_value = param_value || ' ' where param_name = 'תבנית_מייל_דוח_שכר'$q$) <> v0;
  assert test.version_after($q$update public.params set param_value = '25' where param_name = 'סכום_נסיעות_למשמרת'$q$) <> v0;
  assert test.version_after($q$update public.hostesses set full_name = 'שם אחר' where hostess_id = 900001$q$) <> v0;
  assert test.version_after($q$update public.hostesses set id_number = '123' where hostess_id = 900001$q$) <> v0;
  assert test.version_after($q$update public.assignments set actual_hours = 6.001 where project_id = 900201 and hostess_id = 900001$q$) <> v0;
  assert test.version_after($q$update public.projects set cancelled_at = cancelled_at - interval '1 minute' where project_id = 900209$q$) <> v0;
end $$;

-- test: version ignores what does not change money — closed-status moves of an actual row, hostess email, pending closure
do $$
declare v0 text := public._payroll_preview_version('2026-08-01', 'regular', null);
begin
  assert test.version_after($q$update public.projects set project_status = 'awaiting_payment' where project_id = 900201$q$) = v0;
  assert test.version_after($q$update public.hostesses set email = 'new@test.local' where hostess_id = 900001$q$) = v0;
  assert test.version_after($q$update public.assignments set actual_hours = 9 where project_id = 900205$q$) = v0;
end $$;

-- test: _payroll_identity_check — period range, future, locked, exists, original
do $$
declare v jsonb; v_next date := (date_trunc('month', now() at time zone 'Asia/Jerusalem') + interval '1 month')::date;
begin
  v := public._payroll_identity_check('2026-08-17', 'regular', null);
  assert v ->> 'period' = '2026-08-01' and v ->> 'period_end' = '2026-08-31' and v ->> 'month_state' = 'ended';
  assert v -> 'next_supplement_seq' = 'null'::jsonb;
  assert test.err($q$select public._payroll_identity_check('2024-02-01', 'regular', null)$q$) = 'PERIOD_INVALID';
  assert test.err($q$select public._payroll_identity_check('2026-08-01', 'weird', null)$q$) = 'PERIOD_INVALID';
  assert test.err($q$select public._payroll_identity_check(null, 'regular', null)$q$) = 'PERIOD_INVALID';
  assert test.err(format('select public._payroll_identity_check(%L, %L, null)', v_next, 'regular')) = 'FUTURE_PERIOD';
  assert test.err($q$select public._payroll_identity_check('2026-07-01', 'regular', null)$q$) = 'PERIOD_EXISTS';
  assert test.err($q$select public._payroll_identity_check('2026-08-01', 'regular', 900050)$q$) = 'ORIGINAL_INVALID';
  assert test.err($q$select public._payroll_identity_check('2026-08-01', 'supplement', 900050)$q$) = 'ORIGINAL_INVALID';
  assert test.err($q$select public._payroll_identity_check('2026-07-01', 'supplement', 999999)$q$) = 'ORIGINAL_INVALID';
  v := public._payroll_identity_check('2026-07-01', 'supplement', 900050);
  assert (v ->> 'next_supplement_seq')::int = 1;
  update public.payroll_config set locked_periods = array['2026-08-01'::date];
  assert test.err($q$select public._payroll_identity_check('2026-08-01', 'regular', null)$q$) = 'PERIOD_LOCKED';
  update public.payroll_config set locked_periods = '{}';
end $$;

-- test: PERIOD_EXISTS carries the existing report id in the hint and the old Hebrew message
do $$
declare v_hint text; v_msg text;
begin
  begin
    perform public._payroll_identity_check('2026-07-01', 'regular', null);
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint, v_msg = message_text;
  end;
  assert (v_hint::jsonb ->> 'report_id')::int = 900050;
  assert v_msg = 'דוח לחודש 07/2026 כבר הופק (מספר 900050). לא ניתן להפיק פעמיים אותו חודש.', v_msg;
end $$;

-- test: payroll_pending_closure lists approved shifts of projects not yet closed
do $$
declare v jsonb := public.payroll_pending_closure('2026-08-01');
begin
  assert (v ->> 'ok')::boolean and (v ->> 'project_count')::int = 1 and (v ->> 'assignment_count')::int = 1;
  assert v -> 'projects' -> 0 ->> 'project_id' = '900205';
  assert v -> 'projects' -> 0 ->> 'project_status' = 'event_finished';
end $$;

-- test: payroll_preview — finance edit only; view, projects manager and anon are refused
do $$ begin
  perform test.act_as('view@test.local');
  assert test.err($q$select public.payroll_preview('2026-08-01')$q$) = 'SQLSTATE:42501';
  perform test.act_as('pm@test.local');
  assert test.err($q$select public.payroll_preview('2026-08-01')$q$) = 'SQLSTATE:42501';
  perform test.act_as_anon();
  assert test.err($q$select public.payroll_preview('2026-08-01')$q$) = 'SQLSTATE:42501';
end $$;

-- test: payroll_preview — shape, totals, null bonus/travel on compensation, blockers and warnings
do $$
declare v jsonb; l jsonb; v_expected text := public._payroll_preview_version('2026-08-01', 'regular', null);
begin
  perform test.act_as('fin@test.local');
  v := public.payroll_preview('2026-08-01');
  assert v ?& array['ok', 'period', 'period_end', 'kind', 'original_report_id', 'original', 'supplement_seq_next',
                    'month_state', 'captured_at', 'version', 'totals', 'lines', 'pending_closure', 'blockers',
                    'warnings', 'accountant', 'active_review', 'active_operation'];
  assert v ->> 'period' = '2026-08-01' and v ->> 'kind' = 'regular' and v ->> 'month_state' = 'ended';
  assert v ->> 'version' = v_expected;
  assert (v -> 'totals' ->> 'line_count')::int = 14;
  assert (v -> 'totals' ->> 'hostess_count')::int = 12;
  -- one line has no total (COMP_HOURS_MISSING) ⇒ the month total is unknown, never a partial sum
  assert v -> 'totals' -> 'total_amount' = 'null'::jsonb;
  assert (v -> 'totals' ->> 'zero_line_count')::int = 4;
  assert (v -> 'totals' ->> 'file_line_count')::int = 10;
  assert jsonb_array_length(v -> 'lines') = 14;
  select x into l from jsonb_array_elements(v -> 'lines') x where (x ->> 'project_id')::int = 900209;
  assert l -> 'bonus' = 'null'::jsonb and l -> 'travel' = 'null'::jsonb and l ->> 'line_basis' = 'cancellation_compensation';
  select x into l from jsonb_array_elements(v -> 'lines') x where (x ->> 'project_id')::int = 900201;
  assert (l ->> 'bonus')::numeric = 20 and (l ->> 'travel')::numeric = 22.60;
  assert l ->> 'bank_name' = 'בנק בדיקה' and l ? 'hours_raw' and l ? 'event_name';
  -- missing bank is shown as null, and is not a blocker
  select x into l from jsonb_array_elements(v -> 'lines') x where (x ->> 'project_id')::int = 900215;
  assert l -> 'bank_name' = 'null'::jsonb and l -> 'bank_account' = 'null'::jsonb;
  assert jsonb_array_length(v -> 'blockers') = 2;
  assert (select (x ->> 'count')::int from jsonb_array_elements(v -> 'blockers') x where x ->> 'code' = 'COMP_HOURS_MISSING') = 1;
  assert (select x -> 'refs' -> 0 ->> 'project_id' from jsonb_array_elements(v -> 'blockers') x where x ->> 'code' = 'IDENTITY_MISSING') = '900215';
  assert (select (x ->> 'count')::int from jsonb_array_elements(v -> 'warnings') x where x ->> 'code' = 'ZERO_VALUE') = 4;
  assert (select (x ->> 'count')::int from jsonb_array_elements(v -> 'warnings') x where x ->> 'code' = 'COMP_DURATION_ZERO') = 1;
  assert (v -> 'pending_closure' ->> 'assignment_count')::int = 1;
  assert v -> 'accountant' ->> 'recipient' = 'accountant@example.test';
  assert (v -> 'accountant' ->> 'recipient_valid')::boolean and (v -> 'accountant' ->> 'template_valid')::boolean;
  assert v -> 'accountant' ->> 'delivered' = 'ishay1997@gmail.com' and (v -> 'accountant' ->> 'redirected')::boolean;
  assert v -> 'active_review' = 'null'::jsonb and v -> 'active_operation' = 'null'::jsonb;
end $$;

-- test: payroll_preview total is a number when every line is known
do $$
declare v jsonb;
begin
  update public.projects set cancelled_at = '2026-08-18 09:00+03' where project_id = 900213;
  update public.hostesses set id_number = '000900013' where hostess_id = 900013;
  perform test.act_as('fin@test.local');
  v := public.payroll_preview('2026-08-01');
  assert jsonb_array_length(v -> 'blockers') = 0;
  -- 342.60 + 389.25 + 0 + 150 + 0 + 150 + 300 + 0 + 200 + 0 + 150 (900213, now 49h ⇒ 50%) + 300 + 300 + (4×50 + 22.60)
  assert (v -> 'totals' ->> 'total_amount')::numeric = 2504.45, v -> 'totals' ->> 'total_amount';
  assert (v -> 'totals' ->> 'bonus_total')::numeric = 20;
  assert (v -> 'totals' ->> 'travel_total')::numeric = 67.80;
end $$;

-- test: preview of a supplement names its original; the current month is previewable; identity errors surface
do $$
declare v jsonb; v_this date := date_trunc('month', now() at time zone 'Asia/Jerusalem')::date;
begin
  perform test.act_as('fin@test.local');
  v := public.payroll_preview('2026-07-01', 'supplement', 900050);
  assert v -> 'original' ->> 'report_id' = '900050' and (v ->> 'supplement_seq_next')::int = 1;
  v := public.payroll_preview(v_this);
  assert v ->> 'month_state' = 'current';
  assert test.err($q$select public.payroll_preview('2026-07-01')$q$) = 'PERIOD_EXISTS';
  assert test.err($q$select public.payroll_preview('2024-01-01')$q$) = 'PERIOD_INVALID';
end $$;

-- test: preview is read-only — nothing changes in the tables it reads
do $$
declare before_a text; before_r bigint; before_l bigint;
begin
  select md5(string_agg(a::text, ',' order by project_id, hostess_id, assignment_number)) into before_a from public.assignments a;
  select count(*) into before_r from public.salary_reports;
  select count(*) into before_l from public.salary_report_lines;
  perform test.act_as('fin@test.local');
  perform public.payroll_preview('2026-08-01');
  perform test.act_as_owner();
  assert before_a = (select md5(string_agg(a::text, ',' order by project_id, hostess_id, assignment_number)) from public.assignments a);
  assert before_r = (select count(*) from public.salary_reports);
  assert before_l = (select count(*) from public.salary_report_lines);
end $$;

-- test: preview reports an active review and an active operation for the identity
do $$
declare v jsonb; v_review bigint;
begin
  v_review := test.review('2026-08-01');
  insert into public.payroll_operations (operation_id, review_id, period, report_kind, expected_version)
  values ('00000000-0000-0000-0000-000000000001', v_review, '2026-08-01', 'regular', 'v1:x');
  perform test.act_as('fin@test.local');
  v := public.payroll_preview('2026-08-01');
  assert (v -> 'active_review' ->> 'review_id')::bigint = v_review and v -> 'active_review' ->> 'status' = 'open';
  assert v -> 'active_operation' ->> 'state' = 'preparing';
end $$;

-- test: pending-closure failure is reported as ok:false, never as zero
do $$
declare v jsonb;
begin
  -- break the helper for this transaction only
  alter function public.payroll_pending_closure(date) rename to payroll_pending_closure_off;
  create function public.payroll_pending_closure(p date) returns jsonb language plpgsql as $f$ begin raise exception 'broken'; end $f$;
  perform test.act_as('fin@test.local');
  v := public.payroll_preview('2026-08-01');
  assert v -> 'pending_closure' = '{"ok": false}'::jsonb;
  raise exception using errcode = 'XRB01';
exception when sqlstate 'XRB01' then null;
end $$;

-- test: accountant config — required token, unknown token, invalid recipient
do $$
declare v jsonb;
begin
  v := public._payroll_accountant_config();
  assert (v ->> 'template_valid')::boolean and v -> 'missing_tokens' = '[]' and v -> 'unknown_tokens' = '[]';
  assert v ->> 'template_name' = 'תבנית_מייל_דוח_שכר' and length(v ->> 'template_sha256') = 64;
  update public.params set param_value = 'שלום [שם_רואה_חשבון] [טוקן_זר]' where param_name = 'תבנית_מייל_דוח_שכר';
  v := public._payroll_accountant_config();
  assert not (v ->> 'template_valid')::boolean;
  assert v -> 'missing_tokens' = '["[חודש_דיווח_ושנה]"]'::jsonb and v -> 'unknown_tokens' = '["[טוקן_זר]"]'::jsonb;
  update public.params set param_value = 'not-an-address' where param_name = 'מייל_משרד_רואי_חשבון';
  assert not (public._payroll_accountant_config() ->> 'recipient_valid')::boolean;
  update public.params set param_value = '  ' where param_name = 'מייל_משרד_רואי_חשבון';
  assert public._payroll_accountant_config() -> 'recipient' = 'null'::jsonb;
  raise exception using errcode = 'XRB01';
exception when sqlstate 'XRB01' then null;
end $$;

-- test: delivery-address mirror matches the edge guard (D11)
do $$ begin
  perform test.act_as('fin@test.local');
  assert public.payroll_delivery_address('ishay1997@gmail.com') ->> 'redirected' = 'false';
  assert public.payroll_delivery_address('Ishay1997@Gmail.com') ->> 'delivered' = 'Ishay1997@Gmail.com';
  assert public.payroll_delivery_address('ishay1997+july@gmail.com') ->> 'redirected' = 'false';
  assert public.payroll_delivery_address('ishay1997.x@gmail.com') ->> 'delivered' = 'ishay1997@gmail.com';
  assert public.payroll_delivery_address('evil@x.com') ->> 'redirected' = 'true';
  assert public.payroll_delivery_address(' evil@x.com ') ->> 'intended' = 'evil@x.com';
  assert public.payroll_delivery_address('') ->> 'valid' = 'false';
  assert public.payroll_delivery_address(null) ->> 'valid' = 'false';
  assert public.payroll_delivery_address('a@x.com,b@y.com') ->> 'valid' = 'false';
  perform test.act_as('view@test.local');
  assert test.err($q$select public.payroll_delivery_address('a@x.com')$q$) = 'SQLSTATE:42501';
end $$;
