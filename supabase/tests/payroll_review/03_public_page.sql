-- B · מיגרציה 12: הדף האישי — אנונימי, טוקן, GET בלי כתיבה, POST מפורש, אידמפוטנטיות,
-- תגובה אחרי החלטת מנהלת, אחרי הפקה, הגבלת קצב (חוזה §2.2, תדריך B "חובה בבדיקות").

update public.payroll_config set review_mail_enabled = true, final_issue_enabled = true;
select test.hostess(900001, 'נועה כהן', '012345678');
select test.hostess(900002, 'מאיה לוי', '023456789');
select test.hostess(900003, 'שירה אבן', '034567890');
select test.project(900101, '2026-07-10', 'awaiting_invoice');
select test.project(900102, '2026-07-20', 'awaiting_payment');
select test.assign(900101, 900001, 1);
select test.assign(900102, 900001, 1, 'finally_approved', 5);
select test.assign(900101, 900002, 1);
select test.assign(900101, 900003, 1);
insert into public.payroll_reviews (period, report_kind, preview_version, status, response_deadline)
values ('2026-07-01', 'regular', public._payroll_preview_version('2026-07-01', 'regular', null), 'open',
        now() + interval '2 days');
insert into public.payroll_review_recipients (review_id, hostess_id, revision, digest, rows, total, hostess_name)
select (select review_id from public.payroll_reviews), d.hostess_id, 1, d.digest, d.rows, d.total, d.hostess_name
  from public._payroll_hostess_digests('2026-07-01', 'regular', null) d;
insert into public.payroll_mail_attempts (kind, recipient_id, state, retry_reason, intended_recipient)
select 'personal_review', r.recipient_id, 'sending', 'initial', 'h' || r.hostess_id || '@test.local'
  from public.payroll_review_recipients r;

-- טוקן אמיתי לכל דיילת, דרך mint (service_role) — נשמר בטבלת עזר של הבדיקה בלבד.
create table test.tokens (hostess_id bigint primary key, token text);
grant select on test.tokens to anon, authenticated;
do $$
declare r record; v_tok text;
begin
  for r in select rc.recipient_id, rc.hostess_id, a.attempt_id
             from public.payroll_review_recipients rc
             join public.payroll_mail_attempts a on a.recipient_id = rc.recipient_id loop
    perform test.act_as_service();
    v_tok := public.payroll_review_mint_token(r.recipient_id, r.attempt_id, 'fin@test.local');
    perform test.act_as_owner();
    insert into test.tokens values (r.hostess_id, v_tok);
  end loop;
end $$;

create function test.tok(p_h bigint) returns text language sql as $$ select token from test.tokens where hostess_id = p_h $$;
create function test.dig(p_h bigint) returns text language sql security definer set search_path to '' as
$$ select digest from public.payroll_review_recipients where hostess_id = p_h and is_current $$;
grant execute on function test.tok(bigint), test.dig(bigint) to anon, authenticated;

-- מצב "כל מה שהדוח יודע" — להשוואה לפני/אחרי GET.
create function test.domain_state() returns jsonb language sql security definer set search_path to '' as $$
  select jsonb_build_object(
    'reviews', (select jsonb_agg(to_jsonb(v) order by v.review_id) from public.payroll_reviews v),
    'recipients', (select jsonb_agg(to_jsonb(r) order by r.recipient_id) from public.payroll_review_recipients r),
    'tokens', (select jsonb_agg(to_jsonb(t) order by t.token_id) from public.payroll_review_tokens t),
    'responses', (select count(*) from public.payroll_review_responses),
    'cases', (select count(*) from public.payroll_review_cases),
    'events', (select count(*) from public.payroll_review_events),
    'attempts', (select jsonb_agg(to_jsonb(a) order by a.attempt_id) from public.payroll_mail_attempts a))
$$;
grant execute on function test.domain_state() to anon;

-- test: GET with a valid token — §4.3 shape, first name, no ids / bank / id number
do $$
declare res jsonb; row1 jsonb;
begin
  perform test.act_as_anon();
  res := public.payroll_review_public_get(test.tok(900001));
  assert res ->> 'state' = 'ok', res::text;
  assert (select array_agg(k order by k) from jsonb_object_keys(res) k) = array[
    'can_approve', 'can_object', 'compensation_hours', 'deadline', 'decision', 'digest', 'first_name', 'kind',
    'last_case', 'open_case', 'period', 'phase', 'rows', 'state', 'supplement_seq', 'total_hours'];
  assert res -> 'last_case' = 'null'::jsonb;
  assert (res ->> 'total_hours')::numeric = 11 and (res ->> 'compensation_hours')::numeric = 0, res::text;
  assert res ->> 'first_name' = 'נועה' and res ->> 'phase' = 'pre_issue' and res ->> 'period' = '2026-07-01';
  assert jsonb_array_length(res -> 'rows') = 2;
  row1 := res -> 'rows' -> 0;
  assert (select array_agg(k order by k) from jsonb_object_keys(row1) k) = array[
    'event_date', 'event_name', 'hours', 'key', 'line_basis', 'zero_reason'];
  -- F11 (ישי 14.10, "רק משמרות ושעות"): שום שדה כספי בתשובה — לא מפתח ולא ערך.
  assert res::text !~ '"(rate|bonus|travel|line_total|total|amount)"', res::text;
  perform test.act_as_owner();
  assert res::text not like '%' || (select total::text from public.payroll_review_recipients
                                     where hostess_id = 900001 and is_current) || '%';
  assert res::text not like '%' || (select (rows -> 0 ->> 'line_total') from public.payroll_review_recipients
                                     where hostess_id = 900001 and is_current) || '%';
  assert res::text not like '%012345678%' and res::text not like '%900001%'
     and res::text not like '%bank%' and res::text not like '%h900001@%';
  assert (res ->> 'can_approve')::boolean and (res ->> 'can_object')::boolean;
  assert res -> 'decision' ->> 'state' = 'awaiting' and res -> 'open_case' = 'null'::jsonb;
end $$;

-- test: guessed / malformed / empty / null token — exactly {state:'invalid'}
do $$
declare t text;
begin
  perform test.act_as_anon();
  foreach t in array array['AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'short', '', 'x'' or 1=1 --',
                           repeat('a', 44), 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+'] loop
    assert public.payroll_review_public_get(t) = '{"state":"invalid"}'::jsonb, t;
    assert public.payroll_review_public_respond(t, gen_random_uuid(), 'd1:x', 'approve', null)
           = '{"state":"invalid"}'::jsonb, t;
  end loop;
  assert public.payroll_review_public_get(null) = '{"state":"invalid"}'::jsonb;
end $$;

-- test: GET changes nothing in the report domain (email scanners must not confirm)
do $$
declare before jsonb;
begin
  perform test.act_as_anon();
  before := test.domain_state();
  perform public.payroll_review_public_get(test.tok(900001));
  perform public.payroll_review_public_get(test.tok(900002));
  perform public.payroll_review_public_get(test.tok(900001));
  assert test.domain_state() = before;
end $$;

-- test: stale digest → {state:'stale'}, nothing written
do $$
declare before jsonb;
begin
  perform test.act_as_anon();
  before := test.domain_state();
  assert public.payroll_review_public_respond(test.tok(900001), gen_random_uuid(), 'd1:old', 'approve', null)
         = '{"state":"stale"}'::jsonb;
  assert test.domain_state() = before;
end $$;

-- test: approve — hostess_approved by the hostess; same request_id twice → same result, one response row
do $$
declare req uuid := '22222222-2222-4222-8222-222222222222'; res jsonb; res2 jsonb;
begin
  perform test.act_as_anon();
  res := public.payroll_review_public_respond(test.tok(900001), req, test.dig(900001), 'approve', null);
  res2 := public.payroll_review_public_respond(test.tok(900001), req, test.dig(900001), 'approve', null);
  assert res = '{"state":"approved"}'::jsonb, res::text;
  assert res2 = res;
  perform test.act_as_owner();
  assert (select count(*) from public.payroll_review_responses where client_request_id = req) = 1;
  assert (select state = 'hostess_approved' and decided_kind = 'hostess' and decided_at is not null
            from public.payroll_review_recipients where hostess_id = 900001 and is_current);
  perform test.act_as_anon();
  res := public.payroll_review_public_get(test.tok(900001));
  assert not (res ->> 'can_approve')::boolean and (res ->> 'can_object')::boolean;
  assert res -> 'decision' ->> 'state' = 'hostess_approved';
end $$;

-- test: a request_id replayed with another hostess's token does not leak the stored result
do $$
begin
  perform test.act_as_anon();
  assert public.payroll_review_public_respond(test.tok(900002), '22222222-2222-4222-8222-222222222222',
                                              'd1:x', 'approve', null) = '{"state":"stale"}'::jsonb;
end $$;

-- test: objection validation — each bad field reported by name, nothing written
do $$
declare before jsonb; t text := test.tok(900002); d text := test.dig(900002);
begin
  perform test.act_as_anon();
  before := test.domain_state();
  assert public.payroll_review_public_respond(t, gen_random_uuid(), d, 'objection', null) ->> 'field' = 'category';
  assert public.payroll_review_public_respond(t, gen_random_uuid(), d, 'objection',
    '{"category":"bank","row_keys":["r1"],"description":"x"}') ->> 'field' = 'category';
  assert public.payroll_review_public_respond(t, gen_random_uuid(), d, 'objection',
    '{"category":"hours","row_keys":[],"description":"x"}') ->> 'field' = 'rows';
  assert public.payroll_review_public_respond(t, gen_random_uuid(), d, 'objection',
    '{"category":"hours","row_keys":["r9"],"description":"x"}') ->> 'field' = 'rows';
  assert public.payroll_review_public_respond(t, gen_random_uuid(), d, 'objection',
    '{"category":"hours","row_keys":["r1"],"description":"   "}') ->> 'field' = 'description';
  assert public.payroll_review_public_respond(t, gen_random_uuid(), d, 'objection',
    jsonb_build_object('category', 'hours', 'row_keys', jsonb_build_array('r1'), 'description', repeat('א', 2001)))
    ->> 'field' = 'description';
  assert public.payroll_review_public_respond(t, gen_random_uuid(), d, 'objection',
    '{"category":"hours","row_keys":["r1"],"description":"x","suggested_value":-1}') ->> 'field' = 'suggested_value';
  assert public.payroll_review_public_respond(t, gen_random_uuid(), d, 'objection',
    '{"category":"hours","row_keys":["r1"],"description":"x","suggested_value":25}') ->> 'field' = 'suggested_value';
  -- מספר מוצע רק בפנייה על שעות (F11)
  assert public.payroll_review_public_respond(t, gen_random_uuid(), d, 'objection',
    '{"category":"other","row_keys":["r1"],"description":"x","suggested_value":3}') ->> 'field' = 'suggested_value';
  -- הקטגוריות הכספיות הישנות כבר לא קיימות (F11)
  assert public.payroll_review_public_respond(t, gen_random_uuid(), d, 'objection',
    '{"category":"rate","row_keys":["r1"],"description":"x"}') ->> 'field' = 'category';
  assert public.payroll_review_public_respond(t, gen_random_uuid(), d, 'objection',
    '{"category":"bonus_travel","row_keys":["r1"],"description":"x"}') ->> 'field' = 'category';
  -- "משמרת שלא עבדתי בה" חייבת לסמן משמרת
  assert public.payroll_review_public_respond(t, gen_random_uuid(), d, 'objection',
    '{"category":"not_worked","row_keys":[],"description":"x"}') ->> 'field' = 'rows';
  assert public.payroll_review_public_respond(t, gen_random_uuid(), d, 'objection',
    '{"category":"hours","row_keys":["r1"],"description":"x","suggested_value":"8"}') ->> 'field' = 'suggested_value';
  assert public.payroll_review_public_respond(t, gen_random_uuid(), d, 'delete', null) ->> 'field' = 'action';
  assert test.domain_state() = before;
end $$;

-- test: objection saved — pre-issue case with the assignment keys, recipient objection_open; approve then → case_open
do $$
declare res jsonb; c public.payroll_review_cases;
begin
  perform test.act_as_anon();
  res := public.payroll_review_public_respond(test.tok(900002), gen_random_uuid(), test.dig(900002), 'objection',
    '{"category":"hours","row_keys":["r1"],"missing_shift":false,"description":"עבדתי 8 שעות","suggested_value":8}');
  assert res = '{"state":"saved","case_saved":true}'::jsonb, res::text;
  perform test.act_as_owner();
  select * into c from public.payroll_review_cases where hostess_id = 900002;
  assert c.phase = 'pre_issue' and c.status = 'open' and c.category = 'hours' and c.suggested_value = 8;
  assert c.affected_rows = '[{"key":"r1","project_id":900101,"assignment_number":1,"event_date":"2026-07-10","line_basis":"actual"}]'::jsonb,
         c.affected_rows::text;
  assert c.response_id is not null;
  assert (select state from public.payroll_review_recipients where hostess_id = 900002 and is_current) = 'objection_open';

  perform test.act_as_anon();
  assert public.payroll_review_public_respond(test.tok(900002), gen_random_uuid(), test.dig(900002), 'approve', null)
         = '{"state":"case_open"}'::jsonb;
  assert public.payroll_review_public_respond(test.tok(900002), gen_random_uuid(), test.dig(900002), 'objection',
    '{"category":"not_worked","row_keys":["r1"],"description":"לא עבדתי שם"}') = '{"state":"case_open"}'::jsonb;
  res := public.payroll_review_public_get(test.tok(900002));
  assert not (res ->> 'can_approve')::boolean and not (res ->> 'can_object')::boolean;
  assert res -> 'open_case' ->> 'category' = 'hours';
end $$;

-- test: the manager's reason reaches the hostess — last closed case (rejected / noted / accepted), no ids or money
do $$
declare res jsonb; v_case bigint;
begin
  select case_id into v_case from public.payroll_review_cases where hostess_id = 900002;
  update public.payroll_review_cases
     set status = 'resolved_rejected', resolution_reason = 'לפי דוח הנוכחות 6 שעות', resolved_at = now()
   where case_id = v_case;
  update public.payroll_review_recipients set state = 'manager_resolved' where hostess_id = 900002 and is_current;
  perform test.act_as_anon();
  res := public.payroll_review_public_get(test.tok(900002));
  assert res -> 'open_case' = 'null'::jsonb, res::text;
  assert res -> 'last_case' ->> 'status' = 'resolved_rejected', res::text;
  assert res -> 'last_case' ->> 'resolution_reason' = 'לפי דוח הנוכחות 6 שעות';
  assert res -> 'last_case' ->> 'category' = 'hours' and res -> 'last_case' ->> 'resolved_at' is not null;
  assert (select array_agg(k order by k) from jsonb_object_keys(res -> 'last_case') k)
         = array['category', 'resolution_reason', 'resolved_at', 'status'];
  -- פנייה פתוחה שוב (פנייה חדשה) לא מוחקת את ההחלטה הקודמת, אבל open_case מוצג
  perform test.act_as_owner();
  update public.payroll_review_cases set status = 'resolved_accepted', resolution_reason = 'תוקן', resolved_at = now()
   where case_id = v_case;
  perform test.act_as_anon();
  assert public.payroll_review_public_get(test.tok(900002)) -> 'last_case' ->> 'status' = 'resolved_accepted';
end $$;

-- test: missing shift with no row selected is a valid objection
do $$
declare res jsonb;
begin
  perform test.act_as_anon();
  res := public.payroll_review_public_respond(test.tok(900001), gen_random_uuid(), test.dig(900001), 'objection',
    '{"category":"missing_shift","row_keys":[],"description":"חסרה משמרת ב-25/07"}');
  assert res ->> 'state' = 'saved', res::text;
  perform test.act_as_owner();
  -- נועה אישרה קודם — הפנייה פותחת מחדש את הבדיקה שלה
  assert (select state from public.payroll_review_recipients where hostess_id = 900001 and is_current) = 'objection_open';
  assert (select missing_shift and affected_rows = '[]'::jsonb from public.payroll_review_cases where hostess_id = 900001);
end $$;

-- test: reply after the manager decided (approved by documentation) — the hostess's own approval wins
do $$
declare res jsonb;
begin
  update public.payroll_review_recipients
     set state = 'manager_approved_no_response', decided_kind = 'manager', decision_reason = 'לא ענתה בזמן'
   where hostess_id = 900003 and is_current;
  perform test.act_as_anon();
  res := public.payroll_review_public_get(test.tok(900003));
  assert res -> 'decision' ->> 'state' = 'manager_approved_no_response' and (res ->> 'can_approve')::boolean;
  assert public.payroll_review_public_respond(test.tok(900003), gen_random_uuid(), test.dig(900003), 'approve', null)
         = '{"state":"approved"}'::jsonb;
  perform test.act_as_owner();
  assert (select state = 'hostess_approved' and decided_kind = 'hostess' and decision_reason is null
            from public.payroll_review_recipients where hostess_id = 900003 and is_current);
end $$;

-- test: after issue — approve has no effect ({state:'issued'}); objection becomes a post-issue case on the report
do $$
declare res jsonb; before text;
begin
  insert into public.salary_reports (report_id, period) values (900501, '2026-07-01');
  update public.payroll_reviews set status = 'issued', report_id = 900501;
  select state into before from public.payroll_review_recipients where hostess_id = 900003 and is_current;
  perform test.act_as_anon();
  res := public.payroll_review_public_get(test.tok(900003));
  assert res ->> 'phase' = 'post_issue' and not (res ->> 'can_approve')::boolean and (res ->> 'can_object')::boolean;
  assert public.payroll_review_public_respond(test.tok(900003), gen_random_uuid(), test.dig(900003), 'approve', null)
         = '{"state":"issued"}'::jsonb;
  assert public.payroll_review_public_respond(test.tok(900003), gen_random_uuid(), test.dig(900003), 'objection',
    '{"category":"other","row_keys":["r1"],"description":"שמתי לב אחרי ההפקה"}') = '{"state":"issued_case_saved"}'::jsonb;
  perform test.act_as_owner();
  assert (select state from public.payroll_review_recipients where hostess_id = 900003 and is_current) = before;
  assert (select phase = 'post_issue' and report_id = 900501 and status = 'open'
            from public.payroll_review_cases where hostess_id = 900003);
end $$;

-- test: expired, revoked, superseded and cancelled — each exactly {state:'invalid'}
do $$
begin
  update public.payroll_review_tokens set expires_at = now() - interval '1 second'
   where recipient_id = (select recipient_id from public.payroll_review_recipients where hostess_id = 900001);
  update public.payroll_review_tokens set revoked_at = now(), revoked_reason = 'test'
   where recipient_id = (select recipient_id from public.payroll_review_recipients where hostess_id = 900002);
  update public.payroll_review_recipients set is_current = false, state = 'superseded' where hostess_id = 900003;
  perform test.act_as_anon();
  assert public.payroll_review_public_get(test.tok(900001)) = '{"state":"invalid"}'::jsonb;
  assert public.payroll_review_public_get(test.tok(900002)) = '{"state":"invalid"}'::jsonb;
  assert public.payroll_review_public_get(test.tok(900003)) = '{"state":"invalid"}'::jsonb;
  assert public.payroll_review_public_respond(test.tok(900003), gen_random_uuid(), 'd1:x', 'approve', null)
         = '{"state":"invalid"}'::jsonb;
  perform test.act_as_owner();
  update public.payroll_review_tokens set expires_at = now() + interval '1 day', revoked_at = null;
  update public.payroll_review_recipients set is_current = true where hostess_id = 900003;
  update public.payroll_reviews set status = 'cancelled';
  perform test.act_as_anon();
  assert public.payroll_review_public_get(test.tok(900003)) = '{"state":"invalid"}'::jsonb;
end $$;

-- test: rate limit — 120 calls per IP per hour, then {state:'rate_limited'}; another IP is unaffected
do $$
declare i int;
begin
  perform test.act_as_anon();
  perform set_config('request.headers', '{"x-forwarded-for":"203.0.113.7, 10.0.0.1"}', true);
  for i in 1..120 loop
    assert public.payroll_review_public_get('nope') ->> 'state' = 'invalid';
  end loop;
  assert public.payroll_review_public_get('nope') = '{"state":"rate_limited"}'::jsonb;
  assert public.payroll_review_public_respond('nope', gen_random_uuid(), 'd', 'approve', null)
         = '{"state":"rate_limited"}'::jsonb;
  perform set_config('request.headers', '{"x-forwarded-for":"198.51.100.9"}', true);
  assert public.payroll_review_public_get('nope') ->> 'state' = 'invalid';
end $$;
