-- B · מיגרציה 11: אישור טיוטה, מועד אחרון, הפצה, תור, טביעת קישור, שליחה חוזרת (חוזה §2.2, F1, F4).

update public.payroll_config set review_mail_enabled = true, final_issue_enabled = true;
select test.hostess(900001, 'נועה כהן', '012345678');
select test.hostess(900002, 'מאיה לוי', '023456789');
select test.hostess(900003, 'שירה אבן', '034567890');
update public.hostesses set email = '' where hostess_id = 900003;
select test.project(900101, '2026-07-10', 'awaiting_invoice');
select test.assign(900101, 900001, 1);
select test.assign(900101, 900002, 1);
select test.assign(900101, 900003, 1);
insert into public.payroll_reviews (period, report_kind, preview_version, status)
values ('2026-07-01', 'regular', public._payroll_preview_version('2026-07-01', 'regular', null), 'open');
insert into public.payroll_review_recipients (review_id, hostess_id, revision, digest, rows, total, hostess_name)
select (select review_id from public.payroll_reviews), d.hostess_id, 1, d.digest, d.rows, d.total, d.hostess_name
  from public._payroll_hostess_digests('2026-07-01', 'regular', null) d;

create function test.rid() returns bigint language sql security definer set search_path to '' as
$$ select review_id from public.payroll_reviews $$;
create function test.rec(p_h bigint) returns bigint language sql security definer set search_path to '' as
$$ select recipient_id from public.payroll_review_recipients where hostess_id = p_h and is_current $$;
grant execute on function test.rid(), test.rec(bigint) to authenticated, service_role;

-- test: distribute before the manager approved the draft → MANAGER_REVIEW_REQUIRED
do $$ begin
  update public.payroll_reviews set response_deadline = now() + interval '1 day';
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_distribute_begin(%s,1,null,'initial',gen_random_uuid())$q$,
                         test.rid())) = 'MANAGER_REVIEW_REQUIRED';
end $$;

-- test: manager_approve — wrong version → PREVIEW_CHANGED, wrong revision → STALE_VERSION, then OK
do $$
declare v text := (select preview_version from public.payroll_reviews);
begin
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_manager_approve(%s,1,'v1:old')$q$, test.rid())) = 'PREVIEW_CHANGED';
  assert test.err(format($q$select public.payroll_review_manager_approve(%s,9,%L)$q$, test.rid(), v)) = 'STALE_VERSION';
  perform test.act_as('view@test.local');
  assert test.err(format($q$select public.payroll_review_manager_approve(%s,1,%L)$q$, test.rid(), v)) = 'SQLSTATE:42501';
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_manager_approve(%s,1,%L)$q$, test.rid(), v)) = 'OK';
  perform test.act_as_owner();
  assert (select manager_approved_version = v and manager_approved_by = 'fin@test.local' from public.payroll_reviews);
end $$;

-- test: set_deadline — range 5 minutes to 30 days; reason required after distribution
do $$ begin
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_set_deadline(%s,1,now() + interval '1 minute',null)$q$, test.rid())) = 'DEADLINE_INVALID';
  assert test.err(format($q$select public.payroll_review_set_deadline(%s,1,now() + interval '31 days',null)$q$, test.rid())) = 'DEADLINE_INVALID';
  assert test.err(format($q$select public.payroll_review_set_deadline(%s,1,null,null)$q$, test.rid())) = 'DEADLINE_INVALID';
  assert test.err(format($q$select public.payroll_review_set_deadline(%s,1,now() + interval '2 days',null)$q$, test.rid())) = 'OK';
  perform test.act_as_owner();
  assert (select count(*) from public.payroll_review_events where event_type = 'deadline_set') = 1;
end $$;

-- test: distribute guards — mail switch off, invalid template, past deadline, bad mode
do $$ begin
  update public.payroll_config set review_mail_enabled = false;
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_distribute_begin(%s,1,null,'initial',gen_random_uuid())$q$, test.rid())) = 'ISSUE_DISABLED';
  perform test.act_as_owner();
  update public.payroll_config set review_mail_enabled = true;
  update public.params set param_value = 'בלי קישור [שם_דיילת]' where param_name = 'תבנית_מייל_סיכום_שעות_דיילת';
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_distribute_begin(%s,1,null,'initial',gen_random_uuid())$q$, test.rid())) = 'TEMPLATE_INVALID';
  assert test.err(format($q$select public.payroll_review_distribute_begin(%s,1,null,'all',gen_random_uuid())$q$, test.rid())) = 'INVALID_ARGUMENT';
  assert test.err(format($q$select public.payroll_review_distribute_begin(%s,1,null,'initial',null)$q$, test.rid())) = 'INVALID_ARGUMENT';
  raise exception 'undo' using errcode = 'UNDO1';
exception when sqlstate 'UNDO1' then null;
end $$;

-- test: distribute — queues one attempt per hostess with an email, skips the one without, idempotent per request_id
do $$
declare res jsonb; res2 jsonb; req uuid := '11111111-1111-4111-8111-111111111111';
begin
  perform test.act_as('fin@test.local');
  res := public.payroll_review_distribute_begin(test.rid(), 1, null, 'initial', req);
  perform test.act_as_owner();
  assert jsonb_array_length(res -> 'queued') = 2, res::text;
  assert res -> 'skipped' = jsonb_build_array(jsonb_build_object('recipient_id', test.rec(900003), 'code', 'CONTACT_MISSING'));
  assert res -> 'template' ->> 'name' = 'תבנית_מייל_סיכום_שעות_דיילת';
  assert length(res -> 'template' ->> 'sha256') = 64;
  assert (select count(*) from public.payroll_mail_attempts where kind = 'personal_review' and state = 'queued'
           and retry_reason = 'initial' and created_by = 'fin@test.local') = 2;
  assert (select intended_recipient from public.payroll_mail_attempts where recipient_id = test.rec(900001)) = 'h900001@test.local';
  assert (select distributed_at is not null from public.payroll_reviews);

  perform test.act_as('fin@test.local');
  res2 := public.payroll_review_distribute_begin(test.rid(), 1, null, 'initial', req);
  perform test.act_as_owner();
  assert res2 = res;
  assert (select count(*) from public.payroll_mail_attempts) = 2;
end $$;

-- test: a second initial distribution with a new request skips active attempts; reminder targets only 'awaiting'
do $$
declare res jsonb;
begin
  perform test.act_as('fin@test.local');
  res := public.payroll_review_distribute_begin(test.rid(), 1, null, 'initial', gen_random_uuid());
  perform test.act_as_owner();
  assert res -> 'queued' = '[]'::jsonb, res::text;
  assert (res -> 'skipped') @> jsonb_build_array(jsonb_build_object('recipient_id', test.rec(900001), 'code', 'DELIVERY_ACTIVE'));

  update public.payroll_mail_attempts set state = 'sent', completed_at = now();
  update public.payroll_review_recipients set state = 'hostess_approved' where hostess_id = 900001;
  perform test.act_as('fin@test.local');
  res := public.payroll_review_distribute_begin(test.rid(), 1, null, 'reminder', gen_random_uuid());
  perform test.act_as_owner();
  assert jsonb_array_length(res -> 'queued') = 1, res::text;
  assert (select retry_reason from public.payroll_mail_attempts where attempt_id = (res -> 'queued' ->> 0)::bigint) = 'reminder';
  assert (select recipient_id from public.payroll_mail_attempts where attempt_id = (res -> 'queued' ->> 0)::bigint) = test.rec(900002);
end $$;

-- test: explicit recipient ids bypass the 'already sent' filter; an unknown id is reported NOT_CURRENT
do $$
declare res jsonb;
begin
  update public.payroll_mail_attempts set state = 'sent', completed_at = now() where state = 'queued';
  perform test.act_as('fin@test.local');
  res := public.payroll_review_distribute_begin(test.rid(), 1, array[test.rec(900001), 999999]::bigint[], 'initial', gen_random_uuid());
  perform test.act_as_owner();
  assert jsonb_array_length(res -> 'queued') = 1, res::text;
  assert (res -> 'skipped') @> '[{"recipient_id": 999999, "code": "NOT_CURRENT"}]'::jsonb;
end $$;

-- test: queued_attempts lists queued personal attempts with render data and the template
do $$
declare res jsonb;
begin
  perform test.act_as('fin@test.local');
  res := public.payroll_review_queued_attempts(test.rid(), 8);
  perform test.act_as_owner();
  assert (res ->> 'remaining')::int = 1;
  assert res -> 'attempts' -> 0 ->> 'hostess_name' = 'נועה כהן';
  assert res -> 'attempts' -> 0 ->> 'period' = '2026-07-01';
  assert res -> 'attempts' -> 0 ->> 'deadline' is not null;
  assert res -> 'template' ->> 'body' like '%[לינק_בדיקת_שעות]%';
end $$;

-- test: mint_token — service role only; 43 url-safe chars; only sha256 stored; expiry = deadline + 30 days
do $$
declare v_att bigint; tok text;
begin
  select attempt_id into v_att from public.payroll_mail_attempts where state = 'queued';
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_mint_token(%s,%s,'fin@test.local')$q$, test.rec(900001), v_att)) = 'SQLSTATE:42501';
  perform test.act_as_service();
  assert test.err(format($q$select public.payroll_review_mint_token(%s,%s,'view@test.local')$q$, test.rec(900001), v_att)) = 'PERMISSION_DENIED';
  assert test.err(format($q$select public.payroll_review_mint_token(%s,%s,'fin@test.local')$q$, test.rec(900002), v_att)) = 'STALE_ATTEMPT';
  tok := public.payroll_review_mint_token(test.rec(900001), v_att, 'fin@test.local');
  perform test.act_as_owner();
  assert length(tok) = 43 and tok ~ '^[A-Za-z0-9_-]{43}$', tok;
  assert (select count(*) from public.payroll_review_tokens where token_hash = sha256(convert_to(tok, 'UTF8'))) = 1;
  assert not exists (select 1 from public.payroll_review_tokens t where encode(t.token_hash, 'escape') like '%' || tok || '%');
  assert (select expires_at = (select response_deadline from public.payroll_reviews) + interval '30 days'
            from public.payroll_review_tokens where token_hash = sha256(convert_to(tok, 'UTF8')));
end $$;

-- test: mint on a superseded recipient → STALE_VERSION
do $$
declare v_att bigint := (select attempt_id from public.payroll_mail_attempts where state = 'queued');
begin
  update public.payroll_review_recipients set is_current = false where recipient_id = test.rec(900001);
  perform test.act_as_service();
  assert test.err(format($q$select public.payroll_review_mint_token(%s,%s,'fin@test.local')$q$,
    (select recipient_id from public.payroll_review_recipients where hostess_id = 900001), v_att)) = 'STALE_VERSION';
  raise exception 'undo' using errcode = 'UNDO1';
exception when sqlstate 'UNDO1' then null;
end $$;

-- test: resend_reserve — only from the newest attempt, only after a known failure or an acknowledged unknown
do $$
declare v_rec bigint := test.rec(900002); v_last bigint; res jsonb;
begin
  select max(attempt_id) into v_last from public.payroll_mail_attempts where recipient_id = v_rec;
  perform test.act_as('fin@test.local');
  -- המצב 'sent' ⇒ לא שולחים שוב
  assert test.err(format($q$select public.payroll_review_resend_reserve(%s,%s,false)$q$, v_rec, v_last)) = 'NOT_RETRYABLE';
  -- לא הניסיון האחרון ⇒ STALE_VERSION
  assert test.err(format($q$select public.payroll_review_resend_reserve(%s,%s,false)$q$, v_rec, v_last - 1)) = 'STALE_VERSION';
  perform test.act_as_owner();
  update public.payroll_mail_attempts set state = 'failed' where attempt_id = v_last;
  perform test.act_as('fin@test.local');
  res := public.payroll_review_resend_reserve(v_rec, v_last, false);
  perform test.act_as_owner();
  assert (select retry_reason = 'known_failure_retry' and prior_attempt_id = v_last and state = 'queued'
            from public.payroll_mail_attempts where attempt_id = (res ->> 'attempt_id')::bigint);
end $$;

-- test: resend after an unknown outcome — refused without acknowledgement; with it, the old attempt is persisted 'unknown' (F1)
do $$
declare v_rec bigint := test.rec(900002); v_last bigint; res jsonb;
begin
  select max(attempt_id) into v_last from public.payroll_mail_attempts where recipient_id = v_rec;
  update public.payroll_mail_attempts set state = 'sending', sending_started_at = now() - interval '10 minutes'
   where attempt_id = v_last;
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_resend_reserve(%s,%s,false)$q$, v_rec, v_last)) = 'DELIVERY_UNKNOWN';
  res := public.payroll_review_resend_reserve(v_rec, v_last, true);
  perform test.act_as_owner();
  assert (select state = 'unknown' and error_code = 'LEASE_EXPIRED' from public.payroll_mail_attempts where attempt_id = v_last);
  assert (select retry_reason = 'unknown_reviewed_resend' from public.payroll_mail_attempts
           where attempt_id = (res ->> 'attempt_id')::bigint);
end $$;
