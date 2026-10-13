-- B + A: המסע המלא על הרפליקה, בלי stub — סבב בדיקה אמיתי מזין את ה-commit של A.
-- יצירה → אישור טיוטה → מועד → הפצה → קישורים → דיילת מאשרת · דיילת פונה (נדחית) · דיילת לא עונה
-- (אושר לפי תיעוד) → מוכן → פנייה שנפתחת אחרי begin חוסמת את ה-commit → טיפול → commit →
-- הסבב הופק → פנייה אחרי הפקה נשמרת כפנייה אחרי הפקה ולא משנה כסף.

update public.payroll_config set review_mail_enabled = true, final_issue_enabled = true;
select test.hostess(900001, 'נועה כהן', '012345678');
select test.hostess(900002, 'מאיה לוי', '023456789');
select test.hostess(900003, 'שירה אבן', '034567890');
select test.project(900101, '2026-07-10', 'awaiting_invoice');
select test.project(900102, '2026-07-20', 'finished');
select test.assign(900101, 900001, 1);
select test.assign(900101, 900002, 1);
select test.assign(900102, 900003, 1, 'finally_approved', 5);

create table test.kv (k text primary key, v text);
grant select, insert, update on test.kv to anon, authenticated, service_role;
create function test.get(p text) returns text language sql as $$ select v from test.kv where k = p $$;
create function test.put(p text, v text) returns void language sql as
$$ insert into test.kv values (p, v) on conflict (k) do update set v = excluded.v $$;
grant execute on function test.get(text), test.put(text, text) to anon, authenticated, service_role;
create function test.rec(p_h bigint) returns bigint language sql security definer set search_path to '' as
$$ select recipient_id from public.payroll_review_recipients where hostess_id = p_h and is_current $$;
create function test.dig(p_h bigint) returns text language sql security definer set search_path to '' as
$$ select digest from public.payroll_review_recipients where hostess_id = p_h and is_current $$;
grant execute on function test.rec(bigint), test.dig(bigint) to anon, authenticated, service_role;

-- test: manager — create, approve draft, deadline, distribute to all three
do $$
declare v text := public._payroll_preview_version('2026-07-01', 'regular', null); res jsonb; rid bigint;
begin
  perform test.act_as('fin@test.local');
  res := public.payroll_review_create('2026-07-01', 'regular', null, v);
  rid := (res ->> 'review_id')::bigint;
  perform public.payroll_review_manager_approve(rid, 1, v);
  perform public.payroll_review_set_deadline(rid, 1, now() + interval '1 hour', null);
  res := public.payroll_review_distribute_begin(rid, 1, null, 'initial', gen_random_uuid());
  assert jsonb_array_length(res -> 'queued') = 3, res::text;
  perform test.put('review', rid::text);
  perform test.put('version', v);
end $$;

-- test: edge stand-in — claim, mint and complete each attempt; links are stored for the hostesses
do $$
declare a record; tok text; claim jsonb;
begin
  for a in select attempt_id, recipient_id from public.payroll_mail_attempts where state = 'queued' order by attempt_id loop
    perform test.act_as_service();
    claim := public.payroll_attempt_claim(a.attempt_id, 'fin@test.local');
    assert claim ->> 'hostess_name' is not null, claim::text;
    tok := public.payroll_review_mint_token(a.recipient_id, a.attempt_id, 'fin@test.local');
    perform public.payroll_attempt_complete(a.attempt_id, 'fin@test.local', 'sent', 'ishay1997@gmail.com', true,
                                            repeat('a', 64), 'סיכום שעות לבדיקה — יולי 2026', 200, null, null);
    perform test.act_as_owner();
    perform test.put('tok' || (select hostess_id from public.payroll_review_recipients where recipient_id = a.recipient_id), tok);
  end loop;
  assert (select count(*) from public.payroll_mail_attempts where state = 'sent') = 3;
end $$;

-- test: hostesses — Noa approves, Maya objects; the manager rejects with a reason; Shira does not answer
do $$
declare res jsonb;
begin
  perform test.act_as_anon();
  assert public.payroll_review_public_respond(test.get('tok900001'), gen_random_uuid(), test.dig(900001), 'approve', null)
         ->> 'state' = 'approved';
  res := public.payroll_review_public_respond(test.get('tok900002'), gen_random_uuid(), test.dig(900002), 'objection',
           '{"category":"hours","row_keys":["r1"],"description":"עבדתי 7 שעות","suggested_value":7}');
  assert res ->> 'state' = 'saved', res::text;

  perform test.act_as('fin@test.local');
  res := public.payroll_review_readiness(test.get('review')::bigint);
  assert (res -> 'blockers') @> '[{"code":"OBJECTION_OPEN"},{"code":"DECISIONS_MISSING"}]'::jsonb, res::text;
  perform public.payroll_review_resolve_case(
    (select (c ->> 'case_id')::bigint from jsonb_array_elements(public.payroll_review_get(test.get('review')::bigint) -> 'cases') c),
    1, 'reject', 'לפי דוח הנוכחות 6 שעות', 'דוח נוכחות');
end $$;

-- test: after the deadline — approve Shira by documentation; the review becomes ready
do $$
declare res jsonb;
begin
  update public.payroll_reviews set response_deadline = now() - interval '1 minute';
  perform test.act_as('fin@test.local');
  perform public.payroll_review_approve_no_response(test.rec(900003), test.dig(900003), 'לא ענתה עד המועד',
                                                    'אישור טלפוני מול המנהלת', null);
  res := public.payroll_review_readiness(test.get('review')::bigint);
  assert (res ->> 'ready')::boolean, res::text;
  assert (res -> 'counts' ->> 'hostess_approved')::int = 1 and (res -> 'counts' ->> 'manager_approved')::int = 1
     and (res -> 'counts' ->> 'manager_resolved')::int = 1, res::text;
end $$;

-- test: begin succeeds; a late objection before commit leaves the operation prepared with REVIEW_NOT_READY
do $$
declare op uuid := gen_random_uuid(); res jsonb; s jsonb;
begin
  perform test.put('op', op::text);
  perform test.act_as('fin@test.local');
  res := public.payroll_operation_begin(op, test.get('review')::bigint, test.get('version'), '2026-07-01', 'regular', null);
  assert (res ->> 'ok')::boolean, res::text;
  perform test.act_as_service();
  s := public.payroll_operation_snapshot(op, 'fin@test.local');
  assert (s ->> 'ok')::boolean, s::text;
  perform public.payroll_operation_record_artifact(op, 'fin@test.local',
    (s ->> 'artifact_key_prefix') || (s ->> 'prepare_attempt') || '_07_2026_Payroll_Report.xlsx', repeat('c', 64), 2048,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '07_2026_Payroll_Report.xlsx');

  perform test.act_as_anon();
  assert public.payroll_review_public_respond(test.get('tok900001'), gen_random_uuid(), test.dig(900001), 'objection',
           '{"category":"other","row_keys":["r1"],"description":"שכחתי משהו"}') ->> 'state' = 'saved';

  perform test.act_as_service();
  res := public.payroll_commit(op, 'fin@test.local');
  assert not (res ->> 'ok')::boolean and res ->> 'code' = 'REVIEW_NOT_READY', res::text;
  perform test.act_as_owner();
  assert (select state from public.payroll_operations where operation_id = op) = 'prepared';
  assert not exists (select 1 from public.assignments where salary_report_id is not null);
end $$;

-- test: the manager resolves the late case ("טופל מחוץ לדוח"), Noa approves again, and the same operation commits
do $$
declare res jsonb; op uuid := test.get('op')::uuid; v_case bigint;
begin
  select case_id into v_case from public.payroll_review_cases where hostess_id = 900001;
  perform test.act_as('fin@test.local');
  perform public.payroll_review_resolve_case(v_case, 1, 'accept_noted', 'לא משפיע על השעות בדוח הזה', null);
  perform test.act_as_anon();
  assert public.payroll_review_public_respond(test.get('tok900001'), gen_random_uuid(), test.dig(900001), 'approve', null)
         ->> 'state' = 'approved';
  perform test.act_as_service();
  res := public.payroll_commit(op, 'fin@test.local');
  assert (res ->> 'ok')::boolean, res::text;
  perform test.act_as_owner();
  assert (select status = 'issued' and report_id = (res ->> 'report_id')::int from public.payroll_reviews);
  assert (select count(*) from public.assignments where salary_report_id = (res ->> 'report_id')::int) = 3;
  perform test.put('report', res ->> 'report_id');
end $$;

-- test: after issue — the hostess page is post-issue; an objection becomes a post-issue case on that report, no money change
do $$
declare res jsonb; before numeric;
begin
  select sum(actual_hours) into before from public.assignments;
  perform test.act_as_anon();
  res := public.payroll_review_public_get(test.get('tok900003'));
  assert res ->> 'phase' = 'post_issue' and not (res ->> 'can_approve')::boolean, res::text;
  assert public.payroll_review_public_respond(test.get('tok900003'), gen_random_uuid(), test.dig(900003), 'objection',
           '{"category":"hours","row_keys":["r1"],"description":"היו 6 שעות","suggested_value":6}') ->> 'state' = 'issued_case_saved';
  perform test.act_as_owner();
  assert (select phase = 'post_issue' and report_id = test.get('report')::int
            from public.payroll_review_cases where hostess_id = 900003);
  assert (select sum(actual_hours) from public.assignments) = before;
  -- והמנהלת לא יכולה לשנות החלטות בסבב שהופק
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_refresh(%s, 1)$q$, test.get('review'))) = 'REVIEW_NOT_OPEN';
  assert test.err(format($q$select public.payroll_review_cancel(%s, 'ביטול אחרי הפקה')$q$, test.get('review'))) = 'REVIEW_NOT_OPEN';
end $$;
