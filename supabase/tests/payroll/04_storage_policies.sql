-- Migration 4: storage narrowing — text of the policies and their behaviour.

insert into storage.objects (bucket_id, name) values
  ('finance', 'payroll/2026-07/op/1_07_2026_Payroll_Report.xlsx'),
  ('finance', 'salary_reports/15_08_2026_Payroll_Report.xlsx'),
  ('finance', '900101/invoice.pdf');

-- test: policy text — insert excludes payroll/, update and delete exclude payroll/ and salary_reports/, select unchanged
do $$
declare r record;
begin
  select * into r from pg_policies where schemaname = 'storage' and policyname = 'finance_insert_by_permission';
  assert r.cmd = 'INSERT' and r.with_check like '%name !~~ ''payroll/\%''::text%' and r.with_check not like '%salary_reports/%';
  select * into r from pg_policies where schemaname = 'storage' and policyname = 'finance_update_by_permission';
  assert r.qual like '%payroll/\%%' and r.qual like '%salary_reports/\%%';
  assert r.with_check like '%payroll/\%%' and r.with_check like '%salary_reports/\%%';
  select * into r from pg_policies where schemaname = 'storage' and policyname = 'finance_delete_by_permission';
  assert r.qual like '%payroll/\%%' and r.qual like '%salary_reports/\%%';
  select * into r from pg_policies where schemaname = 'storage' and policyname = 'finance_read_by_permission';
  assert r.qual not like '%payroll/%' and r.qual like '%''view''%';
  -- all four still require the finance permission
  assert (select count(*) from pg_policies where schemaname = 'storage' and policyname like 'finance\_%'
            and coalesce(qual, with_check) like '%כספים%') = 4;
end $$;

-- test: finance edit cannot create anything under payroll/
do $$ begin
  perform test.act_as('fin@test.local');
  assert test.err($q$insert into storage.objects (bucket_id, name) values ('finance', 'payroll/2026-07/x/evil.xlsx')$q$) = 'SQLSTATE:42501';
end $$;

-- test: finance edit can still INSERT a new legacy salary_reports/ file (old dialog, upsert:false)
do $$ begin
  perform test.act_as('fin@test.local');
  insert into storage.objects (bucket_id, name) values ('finance', 'salary_reports/16_07_2026_Payroll_Report.xlsx');
end $$;

-- test: finance edit cannot overwrite or delete payroll/ or salary_reports/ objects (0 rows touched)
do $$
declare n int;
begin
  perform test.act_as('fin@test.local');
  update storage.objects set metadata = '{"x":1}' where name like 'payroll/%';
  get diagnostics n = row_count; assert n = 0;
  update storage.objects set metadata = '{"x":1}' where name like 'salary_reports/%';
  get diagnostics n = row_count; assert n = 0;
  delete from storage.objects where name like 'payroll/%' or name like 'salary_reports/%';
  get diagnostics n = row_count; assert n = 0;
  perform test.act_as_owner();
  assert (select count(*) from storage.objects where name like 'payroll/%' or name like 'salary_reports/%') = 3;
end $$;

-- test: an upsert-style overwrite of a legacy key is refused (insert conflicts, update is not allowed)
do $$ begin
  perform test.act_as('fin@test.local');
  assert test.err($q$insert into storage.objects (bucket_id, name) values ('finance', 'salary_reports/15_08_2026_Payroll_Report.xlsx')
                    on conflict (bucket_id, name) do update set metadata = '{"overwritten":true}'$q$) <> 'OK';
end $$;

-- test: invoices (<project_id>/…) are unaffected — edit can insert, update and delete
do $$
declare n int;
begin
  perform test.act_as('fin@test.local');
  insert into storage.objects (bucket_id, name) values ('finance', '900101/invoice2.pdf');
  update storage.objects set metadata = '{"x":1}' where name = '900101/invoice.pdf';
  get diagnostics n = row_count; assert n = 1;
  delete from storage.objects where name = '900101/invoice2.pdf';
  get diagnostics n = row_count; assert n = 1;
end $$;

-- test: reading payroll and legacy files still works for finance view; blocked roles see nothing
do $$ begin
  perform test.act_as('view@test.local');
  assert (select count(*) from storage.objects where name like 'payroll/%' or name like 'salary_reports/%') = 3;
  perform test.act_as('pm@test.local');
  assert (select count(*) from storage.objects where bucket_id = 'finance') = 0;
end $$;
