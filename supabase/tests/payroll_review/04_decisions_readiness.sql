-- B · מיגרציה 11: החלטות מנהלת על פניות (F5), "אשר לפי תיעוד", ביטול, ומוכנות להפקה (F2).

update public.payroll_config set review_mail_enabled = true, final_issue_enabled = true;
select test.hostess(900001, 'נועה כהן', '012345678');
select test.hostess(900002, 'מאיה לוי', '023456789');
select test.hostess(900003, 'שירה אבן', '034567890');
select test.project(900101, '2026-07-10', 'awaiting_invoice');
select test.assign(900101, 900001, 1);
select test.assign(900101, 900002, 1);
select test.assign(900101, 900003, 1);
insert into public.payroll_reviews (period, report_kind, preview_version, status, response_deadline)
values ('2026-07-01', 'regular', public._payroll_preview_version('2026-07-01', 'regular', null), 'open',
        now() + interval '2 days');
insert into public.payroll_review_recipients (review_id, hostess_id, revision, digest, rows, total, hostess_name)
select (select review_id from public.payroll_reviews), d.hostess_id, 1, d.digest, d.rows, d.total, d.hostess_name
  from public._payroll_hostess_digests('2026-07-01', 'regular', null) d;
-- פנייה פתוחה של מאיה על השיבוץ שלה
insert into public.payroll_review_cases (review_id, recipient_id, hostess_id, phase, category, affected_rows,
                                         description)
select r.review_id, r.recipient_id, r.hostess_id, 'pre_issue', 'hours',
       '[{"key":"r1","project_id":900101,"assignment_number":1}]', 'עבדתי יותר'
  from public.payroll_review_recipients r where r.hostess_id = 900002;
update public.payroll_review_recipients set state = 'objection_open' where hostess_id = 900002;

create function test.rid() returns bigint language sql security definer set search_path to '' as
$$ select review_id from public.payroll_reviews $$;
create function test.rec(p_h bigint) returns bigint language sql security definer set search_path to '' as
$$ select recipient_id from public.payroll_review_recipients where hostess_id = p_h and is_current $$;
create function test.cid(p_h bigint) returns bigint language sql security definer set search_path to '' as
$$ select max(case_id) from public.payroll_review_cases where hostess_id = p_h $$;
create function test.dig(p_h bigint) returns text language sql security definer set search_path to '' as
$$ select digest from public.payroll_review_recipients where hostess_id = p_h and is_current $$;
grant execute on function test.rid(), test.rec(bigint), test.cid(bigint), test.dig(bigint) to authenticated;

-- test: readiness — blockers in the fixed order, distinct-hostess counts
do $$
declare res jsonb; codes text[];
begin
  perform test.act_as('fin@test.local');
  res := public.payroll_review_readiness(test.rid());
  perform test.act_as_owner();
  select array_agg(b ->> 'code' order by ord) into codes
    from jsonb_array_elements(res -> 'blockers') with ordinality x(b, ord);
  assert not (res ->> 'ready')::boolean;
  assert codes = array['MANAGER_APPROVAL_REQUIRED', 'OBJECTION_OPEN', 'DECISIONS_MISSING'], codes::text;
  assert (res -> 'counts' ->> 'hostesses')::int = 3 and (res -> 'counts' ->> 'awaiting')::int = 2;
  assert (res -> 'counts' ->> 'open_cases')::int = 1 and (res -> 'counts' ->> 'never_sent')::int = 3;
  assert (res -> 'blockers' -> 1 -> 'hostess_ids') = '[900002]'::jsonb;
end $$;

-- test: readiness — month, switch, accountant config, version and coverage blockers
do $$
declare res jsonb; v public.payroll_reviews;
begin
  update public.payroll_config set final_issue_enabled = false;
  select * into v from public.payroll_reviews;
  res := public._payroll_review_readiness_of(v, 'v1:other', null);
  assert (res -> 'blockers') @> '[{"code":"ISSUE_DISABLED"},{"code":"VERSION_STALE"}]'::jsonb;
  -- שיבוץ חדש שנכנס לחודש: התקציר של נועה השתנה, ודיילת חדשה לא מכוסה
  perform test.hostess(900004, 'דנה רז', '045678901');
  perform test.assign(900101, 900004, 1);
  update public.assignments set actual_hours = 9 where hostess_id = 900001;
  res := public._payroll_review_readiness_of(v, null, null);
  assert (res -> 'blockers') @> '[{"code":"NOT_COVERED","hostess_ids":[900004]},{"code":"DIGEST_STALE","hostess_ids":[900001]}]'::jsonb,
         res::text;
  update public.params set param_value = '' where param_name = 'מייל_משרד_רואי_חשבון';
  res := public._payroll_review_readiness_of(v, null, null);
  assert (res -> 'blockers') @> '[{"code":"RECIPIENT_INVALID"}]'::jsonb, res::text;
  raise exception 'undo' using errcode = 'UNDO1';
exception when sqlstate 'UNDO1' then null;
end $$;

-- test: assert_ready_locked ignores the caller's own operation, but not another one (F2)
do $$
declare res jsonb; op uuid := gen_random_uuid();
begin
  insert into public.payroll_operations (operation_id, review_id, period, report_kind, expected_version, state)
  values (op, test.rid(), '2026-07-01', 'regular', 'v1:x', 'prepared');
  res := public._payroll_review_assert_ready_locked(test.rid(), (select preview_version from public.payroll_reviews), op);
  assert not ((res -> 'blockers') @> '[{"code":"OPERATION_ACTIVE"}]'::jsonb), res::text;
  res := public._payroll_review_assert_ready_locked(test.rid(), (select preview_version from public.payroll_reviews), null);
  assert (res -> 'blockers') @> '[{"code":"OPERATION_ACTIVE"}]'::jsonb, res::text;
  -- וביטול סבב עם הפקה פעילה — נחסם
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_cancel(%s,'ביטול לבדיקה')$q$, test.rid())) = 'OPERATION_ACTIVE';
  raise exception 'undo' using errcode = 'UNDO1';
exception when sqlstate 'UNDO1' then null;
end $$;

-- test: case_detail — snapshot rows from what she saw, current source rows, corrections
do $$
declare res jsonb;
begin
  perform test.act_as('fin@test.local');
  res := public.payroll_review_case_detail(test.cid(900002));
  perform test.act_as_owner();
  assert res -> 'case' ->> 'status' = 'open' and res -> 'case' ->> 'hostess_name' = 'מאיה לוי';
  assert jsonb_array_length(res -> 'snapshot_rows') = 1 and res -> 'snapshot_rows' -> 0 ->> 'key' = 'r1';
  assert jsonb_array_length(res -> 'current_rows') = 1;
  assert (res -> 'current_rows' -> 0 ->> 'actual_hours')::numeric = 6;
  assert res -> 'current_rows' -> 0 ->> 'salary_report_id' is null;
  assert res -> 'corrections' = '[]'::jsonb;
  perform test.act_as('fin@test.local');
  assert test.err($q$select public.payroll_review_case_detail(999999)$q$) = 'CASE_NOT_FOUND';
  perform test.act_as('view@test.local');
  assert test.err(format($q$select public.payroll_review_case_detail(%s)$q$, test.cid(900002))) = 'SQLSTATE:42501';
end $$;

-- test: resolve_case guards — revision, reason length, illegal transition, accept_corrected without a correction
do $$ begin
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_resolve_case(%s,9,'reject','סיבה ארוכה',null)$q$, test.cid(900002))) = 'STALE_VERSION';
  assert test.err(format($q$select public.payroll_review_resolve_case(%s,1,'reject','קצר',null)$q$, test.cid(900002))) = 'REASON_REQUIRED';
  assert test.err(format($q$select public.payroll_review_resolve_case(%s,1,'reopen','סיבה ארוכה',null)$q$, test.cid(900002))) = 'INVALID_TRANSITION';
  assert test.err(format($q$select public.payroll_review_resolve_case(%s,1,'close','סיבה ארוכה',null)$q$, test.cid(900002))) = 'INVALID_TRANSITION';
  assert test.err(format($q$select public.payroll_review_resolve_case(%s,1,'accept_corrected','סיבה ארוכה',null)$q$, test.cid(900002))) = 'CORRECTION_REQUIRED';
  assert test.err(format($q$select public.payroll_review_resolve_case(%s,1,'accept_noted','טופל בחוץ',null)$q$, test.cid(900002))) = 'REASON_REQUIRED';
end $$;

-- test: accept → correction_pending → reopen → open (revision bumps each time)
do $$
declare res jsonb;
begin
  perform test.act_as('fin@test.local');
  res := public.payroll_review_resolve_case(test.cid(900002), 1, 'accept', 'נבדוק מול הפרויקט', 'דוח נוכחות');
  assert res ->> 'status' = 'correction_pending' and (res ->> 'revision')::int = 2;
  res := public.payroll_review_resolve_case(test.cid(900002), 2, 'reopen', 'אין מה לתקן במערכת', null);
  assert res ->> 'status' = 'open' and (res ->> 'revision')::int = 3;
  perform test.act_as_owner();
  assert (select count(*) from public.payroll_review_events where event_type in ('case_accept', 'case_reopen')) = 2;
  assert (select payload ->> 'evidence' from public.payroll_review_events where event_type = 'case_accept') = 'דוח נוכחות';
end $$;

-- test: reject — rejected with reason; recipient becomes manager_resolved (digest unchanged, no other case); never 'hostess_approved'
do $$
declare res jsonb;
begin
  perform test.act_as('fin@test.local');
  res := public.payroll_review_resolve_case(test.cid(900002), 3, 'reject', 'לפי דוח הנוכחות 6 שעות', 'דוח נוכחות');
  perform test.act_as_owner();
  assert res ->> 'status' = 'resolved_rejected' and (res ->> 'recipient_resolved')::boolean, res::text;
  assert (select state = 'manager_resolved' and decided_kind = 'manager' and decided_by = 'fin@test.local'
            from public.payroll_review_recipients where hostess_id = 900002 and is_current);
  assert (select resolution_reason = 'לפי דוח הנוכחות 6 שעות' and resolved_at is not null
            from public.payroll_review_cases where case_id = test.cid(900002));
end $$;

-- test: accept_noted ("טופל מחוץ לדוח") — resolved_noted; recipient not resolved while her digest is stale
do $$
declare res jsonb; v_case bigint;
begin
  insert into public.payroll_review_cases (review_id, recipient_id, hostess_id, phase, category, description)
  values (test.rid(), test.rec(900003), 900003, 'pre_issue', 'other', 'שאלה על המשמרת') returning case_id into v_case;
  update public.payroll_review_recipients set state = 'objection_open' where hostess_id = 900003;
  update public.assignments set actual_hours = 9 where hostess_id = 900003; -- התקציר שלה כבר לא עדכני
  perform test.act_as('fin@test.local');
  res := public.payroll_review_resolve_case(v_case, 1, 'accept_noted', 'יטופל אצל רואה החשבון', null);
  perform test.act_as_owner();
  assert res ->> 'status' = 'resolved_noted' and not (res ->> 'recipient_resolved')::boolean, res::text;
  assert (select state from public.payroll_review_recipients where hostess_id = 900003 and is_current) = 'objection_open';
  update public.assignments set actual_hours = 6 where hostess_id = 900003;
end $$;

-- test: approve_no_response guards — before deadline, open case, stale digest, missing reason/evidence/contact note
do $$ begin
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_approve_no_response(%s,%L,'לא ענתה','שיחה','ניסיתי')$q$,
                         test.rec(900001), test.dig(900001))) = 'DEADLINE_NOT_PASSED';
  perform test.act_as_owner();
  update public.payroll_reviews set response_deadline = now() - interval '1 minute';
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_approve_no_response(%s,'d1:old','לא ענתה','שיחה','ניסיתי')$q$,
                         test.rec(900001))) = 'STALE_VERSION';
  assert test.err(format($q$select public.payroll_review_approve_no_response(%s,%L,'קצר','שיחה טלפון','ניסיתי')$q$,
                         test.rec(900001), test.dig(900001))) = 'REASON_REQUIRED';
  assert test.err(format($q$select public.payroll_review_approve_no_response(%s,%L,'לא ענתה בזמן','ש',null)$q$,
                         test.rec(900001), test.dig(900001))) = 'REASON_REQUIRED';
  -- לא נשלח לה אף מייל בהצלחה ⇒ חובה לתעד קשר
  assert test.err(format($q$select public.payroll_review_approve_no_response(%s,%L,'לא ענתה בזמן','שיחה טלפונית',null)$q$,
                         test.rec(900001), test.dig(900001))) = 'CONTACT_EVIDENCE_REQUIRED';
  -- מאיה כבר הוחלט עליה (manager_resolved) ⇒ לא awaiting ⇒ STALE_VERSION
  assert test.err(format($q$select public.payroll_review_approve_no_response(%s,%L,'לא ענתה בזמן','שיחה טלפונית','x')$q$,
                         test.rec(900002), test.dig(900002))) = 'STALE_VERSION';
end $$;

-- test: approve_no_response with an open case → OBJECTION_OPEN
do $$ begin
  insert into public.payroll_review_cases (review_id, recipient_id, hostess_id, phase, category, description)
  values (test.rid(), test.rec(900001), 900001, 'pre_issue', 'other', 'פנייה');
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_approve_no_response(%s,%L,'לא ענתה בזמן','שיחה טלפונית','ניסיתי בטלפון')$q$,
                         test.rec(900001), test.dig(900001))) = 'OBJECTION_OPEN';
  raise exception 'undo' using errcode = 'UNDO1';
exception when sqlstate 'UNDO1' then null;
end $$;

-- test: approve_no_response — recorded as a manager decision with reason, evidence and contact note
do $$
declare res jsonb;
begin
  perform test.act_as('fin@test.local');
  res := public.payroll_review_approve_no_response(test.rec(900001), test.dig(900001), 'לא ענתה בזמן',
                                                   'אישור בעל-פה בטלפון', 'לא נשלח בכוונה — בדיקת קבלה');
  perform test.act_as_owner();
  assert res ->> 'state' = 'manager_approved_no_response';
  assert (select decided_kind = 'manager' and decision_reason = 'לא ענתה בזמן'
             and decision_evidence = 'אישור בעל-פה בטלפון' and contact_note like 'לא נשלח%'
            from public.payroll_review_recipients where hostess_id = 900001 and is_current);
end $$;

-- test: post-issue case — only 'close', never touches money; pre-issue outcomes refused once issued
do $$
declare res jsonb; v_case bigint; v_hours numeric;
begin
  insert into public.salary_reports (report_id, period) values (900501, '2026-07-01');
  update public.payroll_reviews set status = 'issued', report_id = 900501;
  insert into public.payroll_review_cases (review_id, recipient_id, hostess_id, phase, report_id, category, description)
  values (test.rid(), test.rec(900003), 900003, 'post_issue', 900501, 'hours', 'אחרי ההפקה') returning case_id into v_case;
  select sum(actual_hours) into v_hours from public.assignments;
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_resolve_case(%s,1,'reject','סיבה ארוכה',null)$q$, v_case)) = 'INVALID_TRANSITION';
  res := public.payroll_review_resolve_case(v_case, 1, 'close', 'הועבר לרואה החשבון', null);
  perform test.act_as_owner();
  assert res ->> 'status' = 'closed_post_issue';
  assert (select sum(actual_hours) from public.assignments) = v_hours;
  -- פנייה לפני הפקה בסבב שהופק — סגורה לשינויים
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_resolve_case(%s,4,'accept','סיבה ארוכה',null)$q$, test.cid(900002))) = 'REVIEW_NOT_OPEN';
  -- וסבב שהופק לא "מוכן" שוב
  perform test.act_as_owner();
  assert (public._payroll_review_readiness_of((select v from public.payroll_reviews v), null, null) -> 'blockers')
         @> '[{"code":"REVIEW_NOT_OPEN"}]'::jsonb;
  raise exception 'undo' using errcode = 'UNDO1';
exception when sqlstate 'UNDO1' then null;
end $$;

-- test: cancel — reason required; status cancelled; every token revoked; then nothing can change
do $$ begin
  insert into public.payroll_review_tokens (recipient_id, token_hash, expires_at)
  select recipient_id, sha256(('t' || recipient_id)::bytea), now() + interval '30 days'
    from public.payroll_review_recipients;
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_cancel(%s,'x')$q$, test.rid())) = 'REASON_REQUIRED';
  assert test.err(format($q$select public.payroll_review_cancel(%s,'בוטל לצורך בדיקה')$q$, test.rid())) = 'OK';
  perform test.act_as_owner();
  assert (select status = 'cancelled' and cancelled_reason = 'בוטל לצורך בדיקה' from public.payroll_reviews);
  assert not exists (select 1 from public.payroll_review_tokens where revoked_at is null);
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_cancel(%s,'שוב פעם')$q$, test.rid())) = 'REVIEW_NOT_OPEN';
  assert test.err(format($q$select public.payroll_review_manager_approve(%s,1,'v')$q$, test.rid())) = 'REVIEW_NOT_OPEN';
end $$;
