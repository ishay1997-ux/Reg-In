-- B · מיגרציה 13: correct_unclaimed_assignment — הרשאות (F5b), גבולות, נעילת דוח, יומן.
-- משתמשים: fin = כספים edit + פרויקטים view · pm = פרויקטים edit + כספים blocked ·
-- ceo = שניהם · view = כספים view בלבד.

update public.payroll_config set review_mail_enabled = true, final_issue_enabled = true;
select test.hostess(900001, 'נועה כהן', '012345678');
select test.hostess(900002, 'מאיה לוי', '023456789');
select test.project(900101, '2026-07-10', 'awaiting_invoice');
select test.project(900102, '2026-07-20', 'awaiting_payment');
update public.projects set actual_hours = 6 where project_id in (900101, 900102);
select test.assign(900101, 900001, 1);
select test.assign(900102, 900001, 1);
select test.assign(900101, 900002, 1);
insert into public.payroll_reviews (period, report_kind, preview_version, status, response_deadline)
values ('2026-07-01', 'regular', public._payroll_preview_version('2026-07-01', 'regular', null), 'open',
        now() + interval '2 days');
insert into public.payroll_review_recipients (review_id, hostess_id, revision, digest, rows, total, hostess_name)
select (select review_id from public.payroll_reviews), d.hostess_id, 1, d.digest, d.rows, d.total, d.hostess_name
  from public._payroll_hostess_digests('2026-07-01', 'regular', null) d;
-- הפנייה של נועה — על המשמרת ב-900101 בלבד
insert into public.payroll_review_cases (review_id, recipient_id, hostess_id, phase, category, affected_rows, description)
select r.review_id, r.recipient_id, r.hostess_id, 'pre_issue', 'hours',
       '[{"key":"r1","project_id":900101,"assignment_number":1}]', 'עבדתי 7.5 שעות'
  from public.payroll_review_recipients r where r.hostess_id = 900001;

create function test.cid() returns bigint language sql security definer set search_path to '' as
$$ select case_id from public.payroll_review_cases where hostess_id = 900001 $$;
grant execute on function test.cid() to authenticated;

-- test: finance-edit without a case → PERMISSION_DENIED; finance-view and anonymous → PERMISSION_DENIED
do $$ begin
  perform test.act_as('fin@test.local');
  assert test.err($q$select public.correct_unclaimed_assignment(900101,900001,1,'actual_hours',6,7.5,'לפי דוח נוכחות')$q$) = 'PERMISSION_DENIED';
  perform test.act_as('view@test.local');
  assert test.err($q$select public.correct_unclaimed_assignment(900101,900001,1,'actual_hours',6,7.5,'לפי דוח נוכחות')$q$) = 'PERMISSION_DENIED';
  perform test.act_as_anon();
  assert test.err($q$select public.correct_unclaimed_assignment(900101,900001,1,'actual_hours',6,7.5,'לפי דוח נוכחות')$q$) = 'SQLSTATE:42501';
end $$;

-- test: finance-edit with a case — only the assignment named in that case, of that hostess
do $$ begin
  perform test.act_as('fin@test.local');
  -- שיבוץ אחר של אותה דיילת (900102) — לא בפנייה
  assert test.err(format($q$select public.correct_unclaimed_assignment(900102,900001,1,'actual_hours',6,7,'לפי דוח נוכחות',%s)$q$,
                         test.cid())) = 'PERMISSION_DENIED';
  -- אותו פרויקט, דיילת אחרת
  assert test.err(format($q$select public.correct_unclaimed_assignment(900101,900002,1,'actual_hours',6,7,'לפי דוח נוכחות',%s)$q$,
                         test.cid())) = 'PERMISSION_DENIED';
end $$;

-- test: source rules — field, reason, stale expected value, bounds, no_show
do $$ begin
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.correct_unclaimed_assignment(900101,900001,1,'hourly_rate_snapshot',50,55,'לפי חוזה',%s)$q$, test.cid())) = 'CORRECTION_NOT_SUPPORTED';
  assert test.err(format($q$select public.correct_unclaimed_assignment(900101,900001,1,'actual_hours',6,7.5,'קצר',%s)$q$, test.cid())) = 'REASON_REQUIRED';
  assert test.err(format($q$select public.correct_unclaimed_assignment(900101,900001,1,'actual_hours',5,7.5,'לפי דוח נוכחות',%s)$q$, test.cid())) = 'STALE_VERSION';
  assert test.err(format($q$select public.correct_unclaimed_assignment(900101,900001,1,'actual_hours',6,8.5,'לפי דוח נוכחות',%s)$q$, test.cid())) = 'CORRECTION_OUT_OF_BOUNDS';
  assert test.err(format($q$select public.correct_unclaimed_assignment(900101,900001,1,'actual_hours',6,-1,'לפי דוח נוכחות',%s)$q$, test.cid())) = 'CORRECTION_OUT_OF_BOUNDS';
  assert test.err(format($q$select public.correct_unclaimed_assignment(900101,900001,1,'personal_bonus',0,5001,'לפי דוח נוכחות',%s)$q$, test.cid())) = 'CORRECTION_OUT_OF_BOUNDS';
  perform test.act_as_owner();
  update public.assignments set attendance_status = 'no_show', no_show_reason = 'sick', actual_hours = 0
   where project_id = 900101 and hostess_id = 900001;
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.correct_unclaimed_assignment(900101,900001,1,'actual_hours',0,3,'לפי דוח נוכחות',%s)$q$, test.cid())) = 'CORRECTION_OUT_OF_BOUNDS';
  raise exception 'undo' using errcode = 'UNDO1';
exception when sqlstate 'UNDO1' then null;
end $$;

-- test: finance-edit through the case — hours corrected, audit row 'finance_case', case resolved_accepted, review flagged
do $$
declare res jsonb; x public.payroll_source_corrections;
begin
  perform test.act_as('fin@test.local');
  res := public.correct_unclaimed_assignment(900101, 900001, 1, 'actual_hours', 6, 7.5, 'לפי דוח נוכחות', test.cid());
  perform test.act_as_owner();
  assert (res ->> 'ok')::boolean;
  assert res -> 'affected_review_ids' = to_jsonb(array[(select review_id from public.payroll_reviews)]), res::text;
  assert (select actual_hours from public.assignments where project_id = 900101 and hostess_id = 900001) = 7.5;
  select * into x from public.payroll_source_corrections;
  assert x.before_value = 6 and x.after_value = 7.5 and x.actor_email = 'fin@test.local'
     and x.actor_authority = 'finance_case' and x.case_id = test.cid() and x.field = 'actual_hours';
  assert (select status = 'resolved_accepted' and resolved_by = 'fin@test.local' from public.payroll_review_cases where case_id = test.cid());
  assert (select count(*) from public.payroll_review_events where event_type = 'source_corrected') = 1;
  -- התקציר של נועה כבר לא עדכני ⇒ המוכנות דורשת רענון
  assert (public._payroll_review_readiness_of((select v from public.payroll_reviews v), null, null) -> 'blockers')
         @> '[{"code":"DIGEST_STALE","hostess_ids":[900001]}]'::jsonb;
end $$;

-- test: a resolved case no longer authorises finance-edit (one correction per open case)
do $$ begin
  perform test.act_as('fin@test.local');
  assert test.err(format($q$select public.correct_unclaimed_assignment(900101,900001,1,'actual_hours',7.5,7,'שוב תיקון',%s)$q$,
                         test.cid())) = 'PERMISSION_DENIED';
end $$;

-- test: projects-edit — any unclaimed assignment without a case; audit 'projects'
do $$
declare res jsonb;
begin
  perform test.act_as('pm@test.local');
  res := public.correct_unclaimed_assignment(900102, 900001, 1, 'personal_bonus', 0, 100, 'בונוס ראש צוות');
  perform test.act_as_owner();
  assert (select personal_bonus from public.assignments where project_id = 900102 and hostess_id = 900001) = 100;
  assert (select actor_authority = 'projects' and case_id is null from public.payroll_source_corrections
           where correction_id = (res ->> 'correction_id')::bigint);
  -- פנייה שלא שייכת לשיבוץ — גם לבעלת הרשאת פרויקטים
  perform test.act_as('ceo@test.local');
  assert test.err(format($q$select public.correct_unclaimed_assignment(900101,900002,1,'actual_hours',6,5,'לפי דוח נוכחות',%s)$q$,
                         test.cid())) = 'INVALID_ARGUMENT';
end $$;

-- test: claimed, not finally approved, archived project — each refused, nothing written
do $$
declare n int := (select count(*) from public.payroll_source_corrections);
begin
  perform test.act_as('pm@test.local');
  perform test.act_as_owner();
  insert into public.salary_reports (report_id, period) values (900501, '2026-07-01');
  perform public._payroll_writer_begin();
  update public.assignments set salary_report_id = 900501 where project_id = 900101 and hostess_id = 900002;
  perform test.act_as('pm@test.local');
  assert test.err($q$select public.correct_unclaimed_assignment(900101,900002,1,'actual_hours',6,5,'לפי דוח נוכחות')$q$) = 'ALREADY_CLAIMED';
  perform test.act_as_owner();
  update public.assignments set assignment_status = 'released' where project_id = 900102 and hostess_id = 900001;
  perform test.act_as('pm@test.local');
  assert test.err($q$select public.correct_unclaimed_assignment(900102,900001,1,'actual_hours',6,5,'לפי דוח נוכחות')$q$) = 'CORRECTION_NOT_SUPPORTED';
  perform test.act_as_owner();
  update public.assignments set assignment_status = 'finally_approved' where project_id = 900102 and hostess_id = 900001;
  update public.projects set project_status = 'finished' where project_id = 900102;
  perform test.act_as('pm@test.local');
  assert test.err($q$select public.correct_unclaimed_assignment(900102,900001,1,'actual_hours',6,5,'לפי דוח נוכחות')$q$) = 'PROJECT_ARCHIVED';
  assert test.err($q$select public.correct_unclaimed_assignment(900199,900001,1,'actual_hours',6,5,'לפי דוח נוכחות')$q$) = 'CORRECTION_NOT_SUPPORTED';
  perform test.act_as_owner();
  assert (select count(*) from public.payroll_source_corrections) = n;
  raise exception 'undo' using errcode = 'UNDO1';
exception when sqlstate 'UNDO1' then null;
end $$;
