-- test: replica loads migrations 1-6 + 6b and the helpers
do $$ begin
  assert (select count(*) from public.payroll_config) = 1;
  assert to_regprocedure('public.payroll_collect(date,text,integer)') is not null;
end $$;
