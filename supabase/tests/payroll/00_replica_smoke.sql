-- test: replica loads migrations 1-6 + 6b and the helpers
do $$ begin
  assert (select count(*) from public.payroll_config) = 1;
  assert to_regprocedure('public.payroll_collect(date,text,integer)') is not null;
end $$;

-- test: the replica's copies of the two live payroll writers are byte-identical to live (md5 of 13.10.2026)
do $$ begin
  assert md5(replace(pg_get_functiondef('live_copy.generate_salary_report(date)'::regprocedure),
                     'FUNCTION live_copy.', 'FUNCTION public.')) = 'd8d58ba0ed5c2076fc14d19ce0e0c907';
  assert md5(replace(pg_get_functiondef('live_copy.finalize_salary_report(integer,text,text)'::regprocedure),
                     'FUNCTION live_copy.', 'FUNCTION public.')) = '8af8f09f9cb60904f7ac0feb45e28111';
  -- and the permission gate every payroll RPC relies on
  assert md5(pg_get_functiondef('public.assert_module_permission(text,text[])'::regprocedure)) = '1b8a0ce416cab0a838da113cbb2fbdc0';
  assert md5(pg_get_functiondef('public.current_user_role_id()'::regprocedure)) = '5b7715c8fc94f65180b5a43c23158ce0';
end $$;
