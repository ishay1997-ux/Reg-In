-- B · מיגרציה 11: יצירת סבב, תקצירים, רענון, קריאה (חוזה §2.2).
-- נתוני יולי 2026 סינתטיים (מזהים ≥ 900000). 3 דיילות, 4 משמרות.

update public.payroll_config set review_mail_enabled = true, final_issue_enabled = true;
select test.hostess(900001, 'נועה כהן', '012345678');
select test.hostess(900002, 'מאיה לוי', '023456789');
select test.hostess(900003, 'שירה אבן', '034567890');
select test.project(900101, '2026-07-10', 'awaiting_invoice');
select test.project(900102, '2026-07-20', 'awaiting_payment');
select test.assign(900101, 900001, 1);
select test.assign(900101, 900002, 1);
select test.assign(900102, 900001, 1, 'finally_approved', 5);
select test.assign(900102, 900003, 1);

create function test.v_july() returns text language sql security definer set search_path to '' as
$$ select public._payroll_preview_version('2026-07-01', 'regular', null) $$;
grant execute on function test.v_july() to authenticated, anon;

-- test: permission — finance view, projects manager and anonymous cannot create a review
do $$
declare v text := test.v_july();
begin
  perform test.act_as('view@test.local');
  assert test.err(format($q$select public.payroll_review_create('2026-07-01','regular',null,%L)$q$, v)) = 'SQLSTATE:42501';
  perform test.act_as('pm@test.local');
  assert test.err(format($q$select public.payroll_review_create('2026-07-01','regular',null,%L)$q$, v)) = 'SQLSTATE:42501';
  perform test.act_as_anon();
  assert test.err(format($q$select public.payroll_review_create('2026-07-01','regular',null,%L)$q$, v)) = 'SQLSTATE:42501';
end $$;

-- test: current month → MONTH_NOT_ENDED; wrong version → PREVIEW_CHANGED; empty month → REVIEW_EMPTY
do $$
declare
  v_now date := date_trunc('month', (now() at time zone 'Asia/Jerusalem'))::date;
  v_june text := public._payroll_preview_version('2026-06-01', 'regular', null);
begin
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_create(%L,'regular',null,'v1:x')$q$, v_now)) = 'MONTH_NOT_ENDED';
  assert test.err($q$select public.payroll_review_create('2026-07-01','regular',null,'v1:wrong')$q$) = 'PREVIEW_CHANGED';
  assert test.err(format($q$select public.payroll_review_create('2026-06-01','regular',null,%L)$q$, v_june)) = 'REVIEW_EMPTY';
end $$;

-- test: a missing identity number blocks creation (BLOCKERS_PRESENT)
do $$
declare v text;
begin
  perform test.hostess(900009, 'ללא תעודה', '');
  perform test.project(900109, '2026-05-10', 'awaiting_invoice');
  perform test.assign(900109, 900009, 1);
  v := public._payroll_preview_version('2026-05-01', 'regular', null);
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_create('2026-05-01','regular',null,%L)$q$, v)) = 'BLOCKERS_PRESENT';
end $$;

-- test: create — one current recipient per hostess, rows ordered, digests stable, safe rows only
do $$
declare v text := test.v_july(); res jsonb; r record; noa public.payroll_review_recipients;
begin
  perform test.act_as('fin@test.local');
  res := public.payroll_review_create('2026-07-01', 'regular', null, v);
  perform test.act_as_owner();
  assert (res ->> 'ok')::boolean and not (res ->> 'existing')::boolean;
  assert (res ->> 'recipient_count')::int = 3;
  assert (select count(*) from public.payroll_review_recipients where review_id = (res ->> 'review_id')::bigint
           and is_current and state = 'awaiting' and revision = 1) = 3;
  select * into noa from public.payroll_review_recipients where hostess_id = 900001;
  assert jsonb_array_length(noa.rows) = 2;
  assert noa.rows -> 0 ->> 'key' = 'r1' and noa.rows -> 0 ->> 'event_date' = '2026-07-10';
  assert noa.rows -> 1 ->> 'key' = 'r2' and noa.rows -> 1 ->> 'event_date' = '2026-07-20';
  assert noa.total = (select sum(line_total) from public.payroll_collect('2026-07-01','regular',null) where hostess_id = 900001);
  assert noa.digest like 'd1:%' and length(noa.digest) = 67;
  -- בלי בנק ובלי ת"ז בשורות השמורות
  assert noa.rows::text not like '%012345678%' and noa.rows::text not like '%bank%';
  -- התקציר דטרמיניסטי: חישוב חוזר נותן אותו ערך
  assert noa.digest = (select digest from public._payroll_hostess_digests('2026-07-01','regular',null) where hostess_id = 900001);
  assert (select count(*) from public.payroll_review_events where event_type = 'created') = 1;
end $$;

-- test: create is idempotent — a second call returns the existing review
do $$
declare res jsonb;
begin
  perform test.act_as('fin@test.local');
  res := public.payroll_review_create('2026-07-01', 'regular', null, test.v_july());
  perform test.act_as_owner();
  assert (res ->> 'existing')::boolean;
  assert (select count(*) from public.payroll_reviews) = 1;
end $$;

-- test: a bank-detail change does not change any hostess digest (she does not see bank data)
do $$
declare before text;
begin
  select digest into before from public._payroll_hostess_digests('2026-07-01','regular',null) where hostess_id = 900002;
  update public.hostess_bank_details set bank_account = '999999' where hostess_id = 900002;
  assert before = (select digest from public._payroll_hostess_digests('2026-07-01','regular',null) where hostess_id = 900002);
end $$;

-- test: find and get — §4.3 shape, distinct-hostess counts
do $$
declare res jsonb; rec jsonb;
begin
  perform test.act_as('fin@test.local');
  res := public.payroll_review_find('2026-07-15', 'regular', null);
  perform test.act_as_owner();
  assert (res ->> 'ok')::boolean;
  assert res -> 'review' ->> 'status' = 'open';
  -- שינוי הבנק בבדיקה הקודמת שינה את גרסת הטיוטה (הבנק בגיבוב של A) — אבל לא אף תקציר.
  assert not (res -> 'review' ->> 'version_current')::boolean;
  assert (res -> 'readiness' -> 'blockers') @> '[{"code":"VERSION_STALE"}]'::jsonb;
  assert not ((res -> 'readiness' -> 'blockers') @> '[{"code":"DIGEST_STALE"}]'::jsonb);
  assert not (res -> 'review' ->> 'manager_approved')::boolean;
  assert jsonb_array_length(res -> 'recipients') = 3;
  rec := (select e from jsonb_array_elements(res -> 'recipients') e where (e ->> 'hostess_id')::bigint = 900001);
  assert (rec ->> 'row_count')::int = 2 and (rec ->> 'digest_current')::boolean;
  assert (rec ->> 'email_present')::boolean and rec -> 'delivery' = 'null'::jsonb;
  assert (res -> 'readiness' -> 'counts' ->> 'hostesses')::int = 3;
  assert (res -> 'readiness' -> 'counts' ->> 'awaiting')::int = 3;
  assert not (res -> 'readiness' ->> 'ready')::boolean;
  perform test.act_as('fin@test.local');
  assert public.payroll_review_find('2026-08-01', 'regular', null) -> 'review' = 'null'::jsonb;
  perform test.act_as('view@test.local');
  assert test.err($q$select public.payroll_review_find('2026-07-01','regular',null)$q$) = 'SQLSTATE:42501';
end $$;

-- test: refresh — stale revision → STALE_VERSION
do $$
declare v_id bigint := (select review_id from public.payroll_reviews);
begin
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_refresh(%s, 7)$q$, v_id)) = 'STALE_VERSION';
end $$;

-- test: refresh with no change keeps every row, decision and token
do $$
declare v_id bigint := (select review_id from public.payroll_reviews); res jsonb; v_rec bigint;
begin
  select recipient_id into v_rec from public.payroll_review_recipients where hostess_id = 900003;
  update public.payroll_review_recipients set state = 'hostess_approved', decided_kind = 'hostess', decided_at = now()
   where recipient_id = v_rec;
  insert into public.payroll_review_tokens (recipient_id, token_hash, expires_at)
  values (v_rec, sha256('t-keep'::bytea), now() + interval '30 days');
  perform test.act_as('fin@test.local');
  res := public.payroll_review_refresh(v_id, 1);
  perform test.act_as_owner();
  assert (res ->> 'revision')::int = 2;
  assert res -> 'changed_hostess_ids' = '[]'::jsonb and res -> 'removed_hostess_ids' = '[]'::jsonb;
  assert (select is_current and state = 'hostess_approved' from public.payroll_review_recipients where recipient_id = v_rec);
  assert (select revoked_at is null from public.payroll_review_tokens where recipient_id = v_rec);
end $$;

-- test: refresh after an hours change — only that hostess gets a new row; old row superseded, its tokens revoked
do $$
declare v_id bigint := (select review_id from public.payroll_reviews); res jsonb; v_old bigint;
begin
  select recipient_id into v_old from public.payroll_review_recipients where hostess_id = 900001 and is_current;
  insert into public.payroll_review_tokens (recipient_id, token_hash, expires_at)
  values (v_old, sha256('t-old'::bytea), now() + interval '30 days');
  update public.payroll_reviews set manager_approved_version = preview_version, manager_approved_by = 'fin@test.local',
         manager_approved_at = now() where review_id = v_id;
  update public.assignments set actual_hours = 7 where project_id = 900101 and hostess_id = 900001;

  perform test.act_as('fin@test.local');
  res := public.payroll_review_refresh(v_id, 2);
  perform test.act_as_owner();
  assert res -> 'changed_hostess_ids' = '[900001]'::jsonb, res::text;
  assert (select state = 'superseded' and not is_current from public.payroll_review_recipients where recipient_id = v_old);
  assert (select revoked_reason = 'superseded' from public.payroll_review_tokens where recipient_id = v_old);
  assert (select count(*) from public.payroll_review_recipients where hostess_id = 900001 and is_current
           and state = 'awaiting' and revision = 3) = 1;
  -- 900003 (שלא השתנתה) שומרת את ההחלטה
  assert (select state from public.payroll_review_recipients where hostess_id = 900003 and is_current) = 'hostess_approved';
  -- הגרסה השתנתה ⇒ אישור הטיוטה של המנהלת נמחק
  assert (select manager_approved_version is null and preview_version = test.v_july() from public.payroll_reviews);
end $$;

-- test: refresh after a hostess leaves the month — her row is superseded, not deleted
do $$
declare v_id bigint := (select review_id from public.payroll_reviews); res jsonb;
begin
  update public.assignments set assignment_status = 'released' where project_id = 900102 and hostess_id = 900003;
  perform test.act_as('fin@test.local');
  res := public.payroll_review_refresh(v_id, 3);
  perform test.act_as_owner();
  assert res -> 'removed_hostess_ids' = '[900003]'::jsonb, res::text;
  assert not exists (select 1 from public.payroll_review_recipients where hostess_id = 900003 and is_current);
  assert exists (select 1 from public.payroll_review_recipients where hostess_id = 900003 and state = 'superseded');
end $$;

-- test: refresh after an email change since the last send — tokens revoked, decision kept
do $$
declare v_id bigint := (select review_id from public.payroll_reviews); res jsonb; v_rec bigint;
begin
  select recipient_id into v_rec from public.payroll_review_recipients where hostess_id = 900002 and is_current;
  update public.payroll_review_recipients set state = 'hostess_approved' where recipient_id = v_rec;
  insert into public.payroll_mail_attempts (kind, recipient_id, state, retry_reason, intended_recipient)
  values ('personal_review', v_rec, 'sent', 'initial', 'h900002@test.local');
  insert into public.payroll_review_tokens (recipient_id, token_hash, expires_at)
  values (v_rec, sha256('t-contact'::bytea), now() + interval '30 days');
  update public.hostesses set email = 'new900002@test.local' where hostess_id = 900002;

  perform test.act_as('fin@test.local');
  res := public.payroll_review_refresh(v_id, 4);
  perform test.act_as_owner();
  assert res -> 'contact_changed_ids' = '[900002]'::jsonb, res::text;
  assert (select revoked_reason = 'contact_changed' from public.payroll_review_tokens where recipient_id = v_rec);
  assert (select is_current and state = 'hostess_approved' from public.payroll_review_recipients where recipient_id = v_rec);
end $$;

-- test: a cancelled review can no longer be refreshed (REVIEW_NOT_OPEN)
do $$
declare v_id bigint := (select review_id from public.payroll_reviews);
begin
  update public.payroll_reviews set status = 'cancelled' where review_id = v_id;
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.payroll_review_refresh(%s, 5)$q$, v_id)) = 'REVIEW_NOT_OPEN';
end $$;
