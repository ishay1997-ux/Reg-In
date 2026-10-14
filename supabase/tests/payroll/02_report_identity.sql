-- Migration 2: report identity (regular / supplement), immutability of lines and reports.

select test.hostess(900001, 'דנה בדיקה', '000000001');
select test.project(900101, '2026-07-10', 'finished');

-- test: the blanket UNIQUE(period) is gone and the partial index replaces it
do $$ begin
  assert not exists (select 1 from pg_constraint where conname = 'salary_reports_period_key');
  assert exists (select 1 from pg_indexes where indexname = 'salary_reports_regular_period_uq'
                   and indexdef like '%WHERE (report_kind = ''regular''::text)%');
end $$;

-- test: one regular report per month; a second regular for the same month is refused
do $$ begin
  insert into public.salary_reports (report_id, period) values (900001, '2026-07-01');
  assert (select report_kind from public.salary_reports where report_id = 900001) = 'regular';
  assert test.err($q$insert into public.salary_reports (report_id, period) values (900002, '2026-07-01')$q$) = 'SQLSTATE:23505';
end $$;

-- test: supplements — shape check, and (original, seq) unique
do $$ begin
  insert into public.salary_reports (report_id, period, report_kind, original_report_id, supplement_seq)
  values (900010, '2026-07-01', 'supplement', 900001, 1);
  insert into public.salary_reports (report_id, period, report_kind, original_report_id, supplement_seq)
  values (900011, '2026-07-01', 'supplement', 900001, 2);
  assert test.err($q$insert into public.salary_reports (report_id, period, report_kind, original_report_id, supplement_seq)
                    values (900012, '2026-07-01', 'supplement', 900001, 2)$q$) = 'SQLSTATE:23505';
  -- supplement without original, regular with original, seq 0: all refused by the shape check
  assert test.err($q$insert into public.salary_reports (period, report_kind, supplement_seq) values ('2026-06-01', 'supplement', 1)$q$) = 'SQLSTATE:23514';
  assert test.err($q$insert into public.salary_reports (period, report_kind, original_report_id) values ('2026-06-01', 'regular', 900001)$q$) = 'SQLSTATE:23514';
  assert test.err($q$insert into public.salary_reports (period, report_kind, original_report_id, supplement_seq) values ('2026-07-01', 'supplement', 900001, 0)$q$) = 'SQLSTATE:23514';
  assert test.err($q$insert into public.salary_reports (period, report_kind) values ('2026-06-01', 'other')$q$) = 'SQLSTATE:23514';
end $$;

-- test: issued lines can be neither updated nor deleted (PAYROLL_LINE_IMMUTABLE)
do $$
declare v_line bigint;
begin
  insert into public.salary_report_lines (report_id, hostess_id, hostess_name, id_number, source_project_id,
                                          line_basis, hours, rate, line_total, assignment_number, event_date)
  values (900001, 900001, 'דנה בדיקה', '000000001', 900101, 'actual', 6, 50, 300, 1, '2026-07-10')
  returning line_id into v_line;
  assert test.err(format('update public.salary_report_lines set hours = 7 where line_id = %s', v_line)) = 'PAYROLL_LINE_IMMUTABLE';
  assert test.err(format('update public.salary_report_lines set updated_at = now() where line_id = %s', v_line)) = 'PAYROLL_LINE_IMMUTABLE';
  assert test.err(format('delete from public.salary_report_lines where line_id = %s', v_line)) = 'PAYROLL_LINE_IMMUTABLE';
  -- even the payroll writer cannot
  perform public._payroll_writer_begin();
  assert test.err(format('delete from public.salary_report_lines where line_id = %s', v_line)) = 'PAYROLL_LINE_IMMUTABLE';
end $$;

-- test: report identity columns never change
do $$ begin
  assert test.err($q$update public.salary_reports set period = '2026-06-01' where report_id = 900001$q$) = 'PAYROLL_REPORT_IMMUTABLE';
  assert test.err($q$update public.salary_reports set report_kind = 'supplement', original_report_id = 900010, supplement_seq = 5 where report_id = 900001$q$) = 'PAYROLL_REPORT_IMMUTABLE';
  assert test.err($q$update public.salary_reports set supplement_seq = 9 where report_id = 900010$q$) = 'PAYROLL_REPORT_IMMUTABLE';
end $$;

-- test: legacy pattern still works — total and file fill once from null; then frozen
do $$ begin
  update public.salary_reports set total_amount = 300 where report_id = 900001;
  assert test.err($q$update public.salary_reports set total_amount = 301 where report_id = 900001$q$) = 'PAYROLL_REPORT_IMMUTABLE';
  -- same value is not a change
  update public.salary_reports set total_amount = 300 where report_id = 900001;
  update public.salary_reports set report_file_url = 'salary_reports/900001_07_2026_Payroll_Report.xlsx' where report_id = 900001;
  assert test.err($q$update public.salary_reports set report_file_url = 'salary_reports/other.xlsx' where report_id = 900001$q$) = 'PAYROLL_REPORT_IMMUTABLE';
  assert test.err($q$update public.salary_reports set report_file_url = null where report_id = 900001$q$) = 'PAYROLL_REPORT_IMMUTABLE';
end $$;

-- test: artifact_* and issued_* are write-once; delivery status stays updatable
do $$ begin
  update public.salary_reports
     set artifact_sha256 = repeat('a', 64), artifact_size = 10, artifact_mime = 'x', artifact_filename = 'f.xlsx',
         issued_at = now(), issued_by = 'fin@test.local'
   where report_id = 900010;
  assert test.err($q$update public.salary_reports set artifact_sha256 = repeat('b', 64) where report_id = 900010$q$) = 'PAYROLL_REPORT_IMMUTABLE';
  assert test.err($q$update public.salary_reports set artifact_size = 11 where report_id = 900010$q$) = 'PAYROLL_REPORT_IMMUTABLE';
  assert test.err($q$update public.salary_reports set artifact_filename = 'g.xlsx' where report_id = 900010$q$) = 'PAYROLL_REPORT_IMMUTABLE';
  assert test.err($q$update public.salary_reports set issued_by = 'x' where report_id = 900010$q$) = 'PAYROLL_REPORT_IMMUTABLE';
  update public.salary_reports set send_status = 'sent', sent_date = current_date, delivery_state = 'sent'
   where report_id = 900010;
  update public.salary_reports set send_status = 'failed', delivery_state = 'failed' where report_id = 900010;
  assert test.err($q$update public.salary_reports set delivery_state = 'lost' where report_id = 900010$q$) = 'SQLSTATE:23514';
end $$;

-- test: legacy lines keep null assignment_number / event_date (new columns are nullable)
do $$ begin
  insert into public.salary_report_lines (report_id, hostess_id, hostess_name, id_number, source_project_id,
                                          line_basis, hours, rate, line_total)
  values (900010, 900001, 'דנה בדיקה', '000000001', 900101, 'actual', 1, 50, 50);
  assert exists (select 1 from public.salary_report_lines where report_id = 900010 and assignment_number is null);
end $$;
