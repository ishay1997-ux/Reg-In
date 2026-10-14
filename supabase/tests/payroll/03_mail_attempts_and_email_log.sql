-- Migration 3: payroll_mail_attempts + email_log changes.

insert into public.salary_reports (report_id, period) values (900001, '2026-07-01');

-- test: attempt target shape — accountant has a report, personal has a recipient, never both
do $$ begin
  insert into public.payroll_mail_attempts (kind, report_id, intended_recipient) values ('accountant', 900001, 'a@x.com');
  insert into public.payroll_mail_attempts (kind, recipient_id, intended_recipient) values ('personal_review', 77, 'h@x.com');
  assert test.err($q$insert into public.payroll_mail_attempts (kind, recipient_id, intended_recipient) values ('accountant', 77, 'a@x.com')$q$) = 'SQLSTATE:23514';
  assert test.err($q$insert into public.payroll_mail_attempts (kind, report_id, intended_recipient) values ('personal_review', 900001, 'a@x.com')$q$) = 'SQLSTATE:23514';
  assert test.err($q$insert into public.payroll_mail_attempts (kind, report_id, recipient_id, intended_recipient) values ('accountant', 900001, 77, 'a@x.com')$q$) = 'SQLSTATE:23514';
  assert test.err($q$insert into public.payroll_mail_attempts (kind, report_id) values ('accountant', 900001)$q$) = 'SQLSTATE:23502';
  assert test.err($q$insert into public.payroll_mail_attempts (kind, report_id, intended_recipient, error_detail) values ('accountant', 900001, 'a', repeat('x', 501))$q$) = 'SQLSTATE:23514';
end $$;

-- test: one active (queued/sending) attempt per report and per recipient; finished ones do not block
do $$ begin
  assert test.err($q$insert into public.payroll_mail_attempts (kind, report_id, intended_recipient) values ('accountant', 900001, 'a@x.com')$q$) = 'SQLSTATE:23505';
  assert test.err($q$insert into public.payroll_mail_attempts (kind, recipient_id, intended_recipient) values ('personal_review', 77, 'h@x.com')$q$) = 'SQLSTATE:23505';
  update public.payroll_mail_attempts set state = 'sending' where report_id = 900001;
  assert test.err($q$insert into public.payroll_mail_attempts (kind, report_id, intended_recipient) values ('accountant', 900001, 'a@x.com')$q$) = 'SQLSTATE:23505';
  update public.payroll_mail_attempts set state = 'unknown' where report_id = 900001;
  insert into public.payroll_mail_attempts (kind, report_id, intended_recipient) values ('accountant', 900001, 'a@x.com');
end $$;

-- test: attempts table is closed to client roles (RLS on, no grants)
do $$ begin
  assert not has_table_privilege('authenticated', 'public.payroll_mail_attempts', 'select');
  assert not has_table_privilege('anon', 'public.payroll_mail_attempts', 'select');
  assert (select relrowsecurity from pg_class where oid = 'public.payroll_mail_attempts'::regclass);
  assert not exists (select 1 from pg_policies where tablename = 'payroll_mail_attempts');
  perform test.act_as('fin@test.local');
  assert test.err('select 1 from public.payroll_mail_attempts') = 'SQLSTATE:42501';
end $$;

-- test: email_log accepts payroll_review and unknown, keeps the old values, has intended_recipient
do $$ begin
  insert into public.email_log (entity_type, entity_id, recipient, status, intended_recipient)
  values ('payroll_review', 1, 'ishay1997@gmail.com', 'unknown', 'h@x.com');
  insert into public.email_log (entity_type, entity_id, recipient, status)
  values ('salary_report', 900001, 'a@x.com', 'sent'), ('quote', 1, 'q@x.com', 'failed');
  assert test.err($q$insert into public.email_log (entity_type, entity_id, recipient, status) values ('payroll_review', 1, 'x', 'lost')$q$) = 'SQLSTATE:23514';
  assert test.err($q$insert into public.email_log (entity_type, entity_id, recipient, status) values ('nope', 1, 'x', 'sent')$q$) = 'SQLSTATE:23514';
end $$;

-- test: payroll_review log rows are visible to finance edit only
do $$ begin
  perform test.act_as('fin@test.local');
  assert (select count(*) from public.email_log where entity_type = 'payroll_review') = 1;
  perform test.act_as('view@test.local');
  assert (select count(*) from public.email_log where entity_type = 'payroll_review') = 0;
  -- view still sees salary_report rows (existing policy unchanged)
  assert (select count(*) from public.email_log where entity_type = 'salary_report') = 1;
  perform test.act_as('pm@test.local');
  assert (select count(*) from public.email_log where entity_type = 'payroll_review') = 0;
end $$;
