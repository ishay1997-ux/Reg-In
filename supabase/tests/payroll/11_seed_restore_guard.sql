-- Contract fix F10: scripts/seed-snapshot/restore-seed-snapshot.sql refuses, before any write,
-- once payroll exists. The script is spliced in as text; its first block (the manual lock)
-- is skipped and the stamp is set, exactly what an operator would do by hand.

create table test.restore_script (body text);
insert into test.restore_script values ($restore$
-- @include-file scripts/seed-snapshot/restore-seed-snapshot.sql
$restore$);

-- the snapshot the operator picked: one older salary report
create table seed_snapshot.salary_reports_20260915 (like public.salary_reports including defaults);
insert into seed_snapshot.salary_reports_20260915 (report_id, period, send_status) values (1, '2026-01-01', 'sent');

-- what the operator runs: the script minus its lock block, with the stamp set
create function test.run_restore() returns text language plpgsql as $f$
declare v_sql text; v_msg text;
begin
  select body into v_sql from test.restore_script;
  v_sql := substr(v_sql, strpos(v_sql, 'end $$;') + length('end $$;'));
  v_sql := replace(v_sql, $q$stamp text := 'YYYYMMDD';$q$, $q$stamp text := '20260915';$q$);
  begin
    execute v_sql;
    return 'RAN';
  exception when others then
    get stacked diagnostics v_msg = message_text;
    return v_msg;
  end;
end $f$;

-- test: the script text carries the guard (the file under test was really spliced)
do $$ begin
  assert (select body like '%payroll_operations%' and body like '%RESTORE IS LOCKED%' from test.restore_script);
end $$;

-- test: one payroll operation in the database ⇒ refused before the stamp is even checked
do $$
declare v text;
begin
  insert into public.salary_reports (report_id, period) values (900001, '2026-07-01');
  perform test.review('2026-07-01');
  insert into public.payroll_operations (operation_id, review_id, period, report_kind, expected_version)
  values (gen_random_uuid(), (select max(review_id) from public.payroll_reviews), '2026-07-01', 'regular', 'v');
  v := test.run_restore();
  assert v like 'שחזור נעצר: כבר הופקו דוחות שכר בתהליך החדש.%', v;
  assert (select count(*) from public.salary_reports) = 1;
end $$;

-- test: no new-flow operation, but more live salary reports than in the snapshot ⇒ refused
do $$
declare v text;
begin
  delete from public.payroll_operations;
  insert into public.salary_reports (report_id, period) values (900002, '2026-06-01');
  v := test.run_restore();
  assert v like 'שחזור נעצר: במסד יש 2 דוחות שכר ובתמונת-המצב רק 1.%', v;
  assert (select count(*) from public.salary_reports) = 2;
end $$;

-- test: with no payroll beyond the snapshot the guard lets the script proceed to its own checks
do $$
declare v text;
begin
  delete from public.payroll_operations;
  insert into seed_snapshot.salary_reports_20260915 (report_id, period, send_status) values (2, '2026-02-01', 'sent');
  v := test.run_restore();
  -- the replica has no snapshot of the other 22 tables, so the script's own existence check stops it
  assert v like 'snapshot seed_snapshot.%_20260915 does not exist%', v;
end $$;

-- test: checker 2 — any claimed shift blocks the restore, even with no operation and no extra report
do $$
declare v text;
begin
  perform test.hostess(900001, 'דיילת', '000900001');
  perform test.project(900101, '2026-01-10', 'finished');
  perform public._payroll_writer_begin();
  insert into public.salary_reports (report_id, period) values (900003, '2026-01-01');
  insert into seed_snapshot.salary_reports_20260915 (report_id, period, send_status) values (3, '2026-03-01', 'sent');
  perform test.assign(900101, 900001, 1, 'finally_approved', 6, 50, 0);
  update public.assignments set salary_report_id = 900003 where project_id = 900101;
  v := test.run_restore();
  assert v like 'שחזור נעצר: יש במסד משמרות שכבר שויכו לדוח שכר.%', v;
  assert (select count(*) from public.assignments where salary_report_id = 900003) = 1;
end $$;
