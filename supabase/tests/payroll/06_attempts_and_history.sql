-- Migration 6 (attempt lifecycle) + the history readers of migration 5 (report list / detail).

select test.hostess(900001, 'דנה בדיקה', '012345678');
select test.project(900101, '2026-07-10', 'finished', '10:00', '16:00', null, null, 'כנס יולי');

-- a "new contract" report (operation_id set) with a stored artifact, and a legacy report
insert into public.salary_reports (report_id, period, total_amount, report_file_url, operation_id,
                                   artifact_sha256, artifact_size, artifact_mime, artifact_filename,
                                   issued_at, issued_by, send_status, delivery_state)
values (900001, '2026-07-01', 342.60, 'payroll/2026-07/00000000-0000-0000-0000-0000000000aa/1_07_2026_Payroll_Report.xlsx',
        '00000000-0000-0000-0000-0000000000aa', repeat('a', 64), 1234,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '07_2026_Payroll_Report.xlsx',
        '2026-08-02 10:00+03', 'fin@test.local', 'pending', 'queued');
insert into public.salary_reports (report_id, period, total_amount, report_file_url, send_status, created_at)
values (900002, '2026-06-01', 100, 'salary_reports/900002_06_2026_Payroll_Report.xlsx', 'failed', '2026-07-03 09:00+03');
insert into storage.objects (bucket_id, name) values ('finance', 'payroll/2026-07/00000000-0000-0000-0000-0000000000aa/1_07_2026_Payroll_Report.xlsx');
insert into public.salary_report_lines (report_id, hostess_id, hostess_name, id_number, source_project_id, line_basis,
                                        hours, rate, bonus, travel, line_total, assignment_number, event_date)
values (900001, 900001, 'דנה בדיקה', '012345678', 900101, 'actual', 6, 50, 20, 22.60, 342.60, 1, '2026-07-10');
insert into public.email_log (entity_type, entity_id, recipient, status, created_at)
values ('salary_report', 900002, 'old-accountant@example.test', 'failed', '2026-07-03 09:01+03');

create function test.attempt(p_report integer) returns bigint language sql as $$
  select public._payroll_attempt_reserve('accountant', p_report, null, null, 'accountant@example.test',
                                         'תבנית_מייל_דוח_שכר', 'initial', null, 'fin@test.local')
$$;

-- test: reserve queues an attempt; a second active attempt for the same report is DELIVERY_ACTIVE
do $$
declare v bigint;
begin
  v := test.attempt(900001);
  assert (select state from public.payroll_mail_attempts where attempt_id = v) = 'queued';
  assert (select retry_reason from public.payroll_mail_attempts where attempt_id = v) = 'initial';
  assert test.err('select test.attempt(900001)') = 'DELIVERY_ACTIVE';
  assert test.err($q$select public._payroll_attempt_reserve('accountant', 900002, null, null, '  ', null, 'initial', null, 'x')$q$) = 'RECIPIENT_INVALID';
end $$;

-- test: claim and complete are service-role only
do $$ begin
  assert has_function_privilege('service_role', 'public.payroll_attempt_claim(bigint,text)', 'execute');
  assert not has_function_privilege('authenticated', 'public.payroll_attempt_claim(bigint,text)', 'execute');
  assert not has_function_privilege('anon', 'public.payroll_attempt_claim(bigint,text)', 'execute');
  assert not has_function_privilege('authenticated', 'public.payroll_attempt_complete(bigint,text,text,text,boolean,text,text,integer,text,text)', 'execute');
  perform test.act_as('fin@test.local');
  assert test.err($q$select public.payroll_attempt_claim(1, 'fin@test.local')$q$) = 'SQLSTATE:42501';
end $$;

-- test: claim checks the actor (from getUser) has finance edit
do $$
declare v bigint := (select max(attempt_id) from public.payroll_mail_attempts);
begin
  perform test.act_as_service();
  assert test.err(format('select public.payroll_attempt_claim(%s, %L)', v, 'view@test.local')) = 'PERMISSION_DENIED';
  assert test.err(format('select public.payroll_attempt_claim(%s, null)', v)) = 'PERMISSION_DENIED';
end $$;

-- test: claim moves queued → sending once and returns the render data (F7, accountant)
do $$
declare v bigint := (select max(attempt_id) from public.payroll_mail_attempts); c jsonb;
begin
  perform test.act_as_service();
  c := public.payroll_attempt_claim(v, 'fin@test.local');
  assert c ->> 'kind' = 'accountant' and (c ->> 'report_id')::int = 900001;
  assert c ->> 'intended_recipient' = 'accountant@example.test' and c ->> 'period' = '2026-07-01';
  assert c ->> 'report_kind' = 'regular' and c -> 'supplement_seq' = 'null'::jsonb;
  assert c -> 'artifact' ->> 'key' like 'payroll/2026-07/%' and c -> 'artifact' ->> 'sha256' = repeat('a', 64);
  assert c -> 'artifact' ->> 'filename' = '07_2026_Payroll_Report.xlsx';
  assert c ->> 'template_name' = 'תבנית_מייל_דוח_שכר';
  assert test.err(format('select public.payroll_attempt_claim(%s, %L)', v, 'fin@test.local')) = 'NOT_CLAIMABLE';
  assert test.err($q$select public.payroll_attempt_claim(999999, 'fin@test.local')$q$) = 'NOT_CLAIMABLE';
  perform test.act_as_owner();
  assert (select state from public.payroll_mail_attempts where attempt_id = v) = 'sending';
  assert (select sending_started_at from public.payroll_mail_attempts where attempt_id = v) is not null;
end $$;

-- test: complete(sent) writes email_log with both addresses and the report cache (send_status sent, Israel date)
do $$
declare v bigint := (select max(attempt_id) from public.payroll_mail_attempts); c jsonb; e record;
begin
  perform test.act_as_service();
  c := public.payroll_attempt_complete(v, 'fin@test.local', 'sent', 'ishay1997@gmail.com', true,
                                       repeat('b', 64), '[הופנה: accountant@example.test] דוח שכר', 200, null, null);
  assert (c ->> 'ok')::boolean and c ->> 'state' = 'sent';
  perform test.act_as_owner();
  select * into e from public.email_log where email_log_id = (c ->> 'email_log_id')::bigint;
  assert e.entity_type = 'salary_report' and e.entity_id = 900001 and e.status = 'sent';
  assert e.recipient = 'ishay1997@gmail.com' and e.intended_recipient = 'accountant@example.test';
  assert e.sent_by_email = 'fin@test.local' and e.template_name = 'תבנית_מייל_דוח_שכר';
  assert (select delivered_recipient from public.payroll_mail_attempts where attempt_id = v) = 'ishay1997@gmail.com';
  assert (select redirected and transport_http_status = 200 and artifact_sha256 = repeat('a', 64)
            from public.payroll_mail_attempts where attempt_id = v);
  assert (select send_status = 'sent' and delivery_state = 'sent'
                 and sent_date = (now() at time zone 'Asia/Jerusalem')::date
            from public.salary_reports where report_id = 900001);
end $$;

-- test: a second completion is a STALE_ATTEMPT no-op — the first outcome is kept
do $$
declare v bigint := (select max(attempt_id) from public.payroll_mail_attempts); c jsonb; n bigint;
begin
  n := (select count(*) from public.email_log);
  perform test.act_as_service();
  c := public.payroll_attempt_complete(v, 'fin@test.local', 'failed', null, null, null, null, 502, 'HTTP', 'x');
  assert c ->> 'code' = 'STALE_ATTEMPT' and c ->> 'state' = 'sent' and not (c ->> 'ok')::boolean;
  assert test.err(format($q$select public.payroll_attempt_complete(%s, 'fin@test.local', 'bogus', null, null, null, null, null, null, null)$q$, v)) = 'OUTCOME_INVALID';
  perform test.act_as_owner();
  assert (select state from public.payroll_mail_attempts where attempt_id = v) = 'sent';
  assert (select count(*) from public.email_log) = n;
end $$;

-- test: lease — sending older than 120 s reads as unknown; persisting it frees the slot (F1)
do $$
declare v bigint; w bigint;
begin
  v := test.attempt(900001);
  update public.payroll_mail_attempts set state = 'sending', sending_started_at = now() - interval '119 seconds' where attempt_id = v;
  assert public._payroll_attempt_effective_state((select a from public.payroll_mail_attempts a where attempt_id = v)) = 'sending';
  assert public._payroll_attempt_persist_unknown(v) = 'sending';
  update public.payroll_mail_attempts set sending_started_at = now() - interval '121 seconds' where attempt_id = v;
  assert public._payroll_attempt_effective_state((select a from public.payroll_mail_attempts a where attempt_id = v)) = 'unknown';
  -- still stored as sending ⇒ the active-attempt index blocks a new one
  assert test.err('select test.attempt(900001)') = 'DELIVERY_ACTIVE';
  assert public._payroll_attempt_persist_unknown(v) = 'unknown';
  assert (select state = 'unknown' and error_code = 'LEASE_EXPIRED' and completed_at is not null
            from public.payroll_mail_attempts where attempt_id = v);
  assert (select delivery_state = 'unknown' and send_status = 'pending' from public.salary_reports where report_id = 900001);
  w := test.attempt(900001);
  assert w > v;
end $$;

-- test: completing an attempt that was persisted unknown is STALE_ATTEMPT (no overwrite)
do $$
declare v bigint := (select attempt_id from public.payroll_mail_attempts where state = 'unknown'); c jsonb;
begin
  perform test.act_as_service();
  c := public.payroll_attempt_complete(v, 'fin@test.local', 'sent', 'ishay1997@gmail.com', true, null, null, 200, null, null);
  assert c ->> 'code' = 'STALE_ATTEMPT' and c ->> 'state' = 'unknown';
end $$;

-- test: an older attempt finishing late never overwrites the report cache of a newer one
do $$
declare v_old bigint; v_new bigint;
begin
  -- the current active attempt (from the previous check) is the "old" one, still sending
  v_old := (select attempt_id from public.payroll_mail_attempts where report_id = 900001 and state = 'queued');
  update public.payroll_mail_attempts set state = 'sending', sending_started_at = now() where attempt_id = v_old;
  -- a newer attempt already finished as failed (inserted directly to stage the race)
  insert into public.payroll_mail_attempts (kind, report_id, intended_recipient, state, prior_attempt_id)
  values ('accountant', 900001, 'accountant@example.test', 'failed', v_old) returning attempt_id into v_new;
  update public.salary_reports set delivery_state = 'failed', send_status = 'failed' where report_id = 900001;
  perform test.act_as_service();
  perform public.payroll_attempt_complete(v_old, 'fin@test.local', 'sent', 'ishay1997@gmail.com', true, null, null, 200, null, null);
  perform test.act_as_owner();
  assert v_new > v_old;
  assert (select state from public.payroll_mail_attempts where attempt_id = v_old) = 'sent';
  assert (select delivery_state = 'failed' and send_status = 'failed' from public.salary_reports where report_id = 900001);
end $$;

-- test: personal attempt — refused while review mail is off; render data from the review when on (F7)
do $$
declare v_review bigint; v_rec bigint; v bigint; c jsonb;
begin
  v_review := test.review('2026-07-01', 'supplement', 900001);
  update public.payroll_reviews set response_deadline = '2026-10-20 18:00+03' where review_id = v_review;
  insert into public.payroll_review_recipients (review_id, hostess_id, hostess_name)
  values (v_review, 900001, 'דנה בדיקה') returning recipient_id into v_rec;
  v := public._payroll_attempt_reserve('personal_review', null, v_rec, null, 'h900001@test.local',
                                       'תבנית_מייל_סיכום_שעות_דיילת', 'initial', null, 'fin@test.local');
  update public.payroll_config set review_mail_enabled = false;
  perform test.act_as_service();
  assert test.err(format($q$select public.payroll_attempt_claim(%s, 'fin@test.local')$q$, v)) = 'ISSUE_DISABLED';
  perform test.act_as_owner();
  update public.payroll_config set review_mail_enabled = true;
  perform test.act_as_service();
  c := public.payroll_attempt_claim(v, 'fin@test.local');
  assert c ->> 'kind' = 'personal_review' and (c ->> 'recipient_id')::bigint = v_rec;
  assert c ->> 'hostess_name' = 'דנה בדיקה' and (c ->> 'review_id')::bigint = v_review;
  assert (c ->> 'response_deadline')::timestamptz = '2026-10-20 18:00+03';
  assert c ->> 'period' = '2026-07-01' and c ->> 'report_kind' = 'supplement' and (c ->> 'supplement_seq')::int = 1;
  assert c -> 'artifact' = 'null'::jsonb;
  perform public.payroll_attempt_complete(v, 'fin@test.local', 'unknown', null, null, null, 'סיכום', null, 'ABORT', 'timeout');
  perform test.act_as_owner();
  assert (select entity_type = 'payroll_review' and entity_id = v_rec and status = 'unknown'
                 and recipient = 'h900001@test.local' and error_message = 'ABORT: timeout'
            from public.email_log order by email_log_id desc limit 1);
end $$;

-- test: report list — finance edit and view; projects manager refused
do $$ begin
  perform test.act_as('view@test.local');
  assert jsonb_array_length(public.payroll_report_list() -> 'reports') = 2;
  perform test.act_as('pm@test.local');
  assert test.err('select public.payroll_report_list()') = 'SQLSTATE:42501';
  perform test.act_as_anon();
  assert test.err('select public.payroll_report_list()') = 'SQLSTATE:42501';
end $$;

-- test: report list items — newest period first; delivery state from the latest attempt; legacy derived from send_status
do $$
declare v jsonb; n jsonb; o jsonb;
begin
  perform test.act_as('fin@test.local');
  v := public.payroll_report_list() -> 'reports';
  n := v -> 0; o := v -> 1;
  assert n ?& array['report_id', 'period', 'report_kind', 'original_report_id', 'supplement_seq', 'total_amount',
                    'line_count', 'issued_at', 'send_status', 'delivery_state', 'legacy', 'artifact_available',
                    'artifact_filename', 'last_attempt', 'open_post_issue_cases'];
  assert (n ->> 'report_id')::int = 900001 and not (n ->> 'legacy')::boolean and (n ->> 'line_count')::int = 1;
  -- latest attempt for 900001 is the late "failed" one inserted above
  assert n ->> 'delivery_state' = 'failed', n ->> 'delivery_state';
  assert (n ->> 'artifact_available')::boolean and n ->> 'artifact_filename' = '07_2026_Payroll_Report.xlsx';
  assert n -> 'last_attempt' ->> 'state' = 'failed';
  assert (o ->> 'report_id')::int = 900002 and (o ->> 'legacy')::boolean and o ->> 'delivery_state' = 'failed';
  -- the legacy object is not in storage ⇒ not available; file name comes from the key
  assert not (o ->> 'artifact_available')::boolean and o ->> 'artifact_filename' = '06_2026_Payroll_Report.xlsx';
  assert o -> 'last_attempt' ->> 'delivered_recipient' = 'old-accountant@example.test';
  assert (o ->> 'issued_at')::timestamptz = '2026-07-03 09:00+03';
  assert (o ->> 'open_post_issue_cases')::int = 0;
end $$;

-- test: delivery_state in the list is the effective state, not the stale stored cache (F1)
do $$
declare v bigint;
begin
  update public.payroll_mail_attempts set state = 'failed' where state in ('queued', 'sending') and report_id = 900001;
  v := test.attempt(900001);
  update public.payroll_mail_attempts set state = 'sending', sending_started_at = now() - interval '5 minutes' where attempt_id = v;
  update public.salary_reports set delivery_state = 'sending' where report_id = 900001;
  perform test.act_as('fin@test.local');
  assert (select x ->> 'delivery_state' from jsonb_array_elements(public.payroll_report_list() -> 'reports') x
           where (x ->> 'report_id')::int = 900001) = 'unknown';
end $$;

-- test: report detail — frozen lines with live event name, attempts, artifact, no current bank data
do $$
declare v jsonb;
begin
  update public.hostess_bank_details set bank_account = 'CHANGED' where hostess_id = 900001;
  perform test.act_as('view@test.local');
  v := public.payroll_report_detail(900001);
  assert v ?& array['report', 'lines', 'attempts', 'artifact', 'review', 'supplements', 'original', 'post_issue_cases'];
  assert jsonb_array_length(v -> 'lines') = 1;
  assert v -> 'lines' -> 0 ->> 'event_name' = 'כנס יולי' and v -> 'lines' -> 0 ->> 'id_number' = '012345678';
  assert (v -> 'lines' -> 0 ->> 'line_total')::numeric = 342.60;
  assert v::text not like '%CHANGED%' and v::text not like '%bank%';
  assert jsonb_array_length(v -> 'attempts') >= 3;
  assert v -> 'artifact' ->> 'sha256' = repeat('a', 64) and not (v -> 'artifact' ->> 'reference_missing')::boolean;
  assert v -> 'report' ->> 'delivery_state' = 'unknown';
  assert test.err('select public.payroll_report_detail(424242)') = 'REPORT_NOT_FOUND';
  perform test.act_as('pm@test.local');
  assert test.err('select public.payroll_report_detail(900001)') = 'SQLSTATE:42501';
end $$;

-- test: legacy report detail — reference present, missing filename derived; a report without file says reference_missing
do $$
declare v jsonb;
begin
  insert into public.salary_reports (report_id, period, total_amount, send_status) values (900003, '2026-05-01', 0, 'failed');
  perform test.act_as('fin@test.local');
  v := public.payroll_report_detail(900003);
  assert (v -> 'artifact' ->> 'reference_missing')::boolean and v -> 'artifact' -> 'key' = 'null'::jsonb;
  assert v -> 'report' ->> 'delivery_state' = 'failed' and (v -> 'report' ->> 'legacy')::boolean;
  v := public.payroll_report_detail(900002);
  assert v -> 'artifact' ->> 'filename' = '06_2026_Payroll_Report.xlsx';
end $$;

-- test: supplements, original and post-issue cases (F6) in detail and list
do $$
declare v jsonb; v_review bigint; v_rec bigint;
begin
  insert into public.salary_reports (report_id, period, report_kind, original_report_id, supplement_seq, total_amount)
  values (900004, '2026-07-01', 'supplement', 900001, 1, 50);
  select review_id into v_review from public.payroll_reviews where original_report_id = 900001;
  select recipient_id into v_rec from public.payroll_review_recipients where review_id = v_review;
  update public.salary_reports set review_id = v_review where report_id = 900001;
  update public.payroll_review_recipients set state = 'hostess_approved' where recipient_id = v_rec;
  insert into public.payroll_review_cases (review_id, recipient_id, hostess_id, phase, report_id, category, description)
  values (v_review, v_rec, 900001, 'post_issue', 900001, 'hours', 'חסרה שעה'),
         (v_review, v_rec, 900001, 'post_issue', 900001, 'other', 'כבר טופל');
  update public.payroll_review_cases set status = 'closed_post_issue', resolution_reason = 'נבדק'
   where description = 'כבר טופל';
  perform test.act_as('fin@test.local');
  v := public.payroll_report_detail(900001);
  assert jsonb_array_length(v -> 'supplements') = 1 and (v -> 'supplements' -> 0 ->> 'supplement_seq')::int = 1;
  assert jsonb_array_length(v -> 'post_issue_cases') = 2;
  assert v -> 'post_issue_cases' -> 0 ->> 'hostess_name' = 'דנה בדיקה' and v -> 'post_issue_cases' -> 0 ->> 'category' = 'hours';
  assert (v -> 'review' ->> 'review_id')::bigint = v_review and (v -> 'review' -> 'counts' ->> 'hostess_approved')::int = 1;
  v := public.payroll_report_detail(900004);
  assert v -> 'original' ->> 'report_id' = '900001' and v -> 'report' ->> 'report_kind' = 'supplement';
  assert (select (x ->> 'open_post_issue_cases')::int from jsonb_array_elements(public.payroll_report_list() -> 'reports') x
           where (x ->> 'report_id')::int = 900001) = 1;
  -- supplement sorts after its regular report of the same period
  assert (select array_agg((x ->> 'report_id')::int) from jsonb_array_elements(public.payroll_report_list() -> 'reports') x
           where x ->> 'period' = '2026-07-01') = array[900001, 900004];
end $$;
