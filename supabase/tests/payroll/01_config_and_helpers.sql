-- Migration 1: payroll_config + internal helpers.

-- test: payroll_config has exactly one row, and a second row is impossible
do $$ begin
  assert (select count(*) from public.payroll_config) = 1;
  assert (select legacy_writer from public.payroll_config) in ('enabled', 'disabled');
  assert test.err($q$insert into public.payroll_config (id) values (false)$q$) = 'SQLSTATE:23514';
  assert test.err($q$insert into public.payroll_config (id) values (true)$q$) = 'SQLSTATE:23505';
end $$;

-- test: defaults keep the new flow off until migration 16 (fresh table, before 16/17 ran)
do $$
declare v public.payroll_config;
begin
  -- 16 and 17 ran in the replica; the column defaults are what migration 1 promises.
  assert (select column_default from information_schema.columns
           where table_name = 'payroll_config' and column_name = 'final_issue_enabled') = 'false';
  assert (select column_default from information_schema.columns
           where table_name = 'payroll_config' and column_name = 'review_mail_enabled') = 'false';
  assert (select column_default from information_schema.columns
           where table_name = 'payroll_config' and column_name = 'legacy_writer') = '''enabled''::text';
  v := public._payroll_config();
  assert v.id;
end $$;

-- test: client roles have no table access to payroll_config
do $$ begin
  assert not has_table_privilege('anon', 'public.payroll_config', 'select');
  assert not has_table_privilege('authenticated', 'public.payroll_config', 'select');
  assert not has_table_privilege('authenticated', 'public.payroll_config', 'update');
  assert (select relrowsecurity from pg_class where oid = 'public.payroll_config'::regclass);
end $$;

-- test: every internal payroll function is closed to anon and authenticated
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as f from pg_proc p
            where p.pronamespace = 'public'::regnamespace
              and (p.proname like '\_payroll\_%' or p.proname in ('payroll_collect', 'payroll_pending_closure',
                   'salary_report_lines_immutable', 'salary_reports_identity_guard'))
  loop
    assert not has_function_privilege('anon', r.f, 'execute'), format('anon can execute %s', r.f);
    assert not has_function_privilege('authenticated', r.f, 'execute'), format('authenticated can execute %s', r.f);
  end loop;
end $$;

-- test: every payroll function is SECURITY DEFINER with an empty search_path
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as f, p.prosecdef, p.proconfig from pg_proc p
            where p.pronamespace = 'public'::regnamespace
              and (p.proname like '%payroll%' or p.proname like 'salary_report%')
  loop
    assert r.prosecdef, format('%s is not security definer', r.f);
    assert r.proconfig @> array['search_path=""'], format('%s has no empty search_path', r.f);
  end loop;
end $$;

-- test: _payroll_raise carries the code in DETAIL and JSON in HINT
do $$
declare v_detail text; v_hint text; v_state text; v_msg text;
begin
  begin
    perform public._payroll_raise('SOME_CODE', 'הודעה', jsonb_build_object('report_id', 7));
  exception when others then
    get stacked diagnostics v_detail = pg_exception_detail, v_hint = pg_exception_hint,
                            v_state = returned_sqlstate, v_msg = message_text;
  end;
  assert v_state = 'P0001';
  assert v_detail = 'PAYROLL:SOME_CODE';
  assert v_msg = 'הודעה';
  assert (v_hint::jsonb ->> 'report_id') = '7';
  -- a null hint still produces valid JSON
  begin
    perform public._payroll_raise('X', null);
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint, v_msg = message_text;
  end;
  assert v_hint::jsonb = '{}'::jsonb;
  assert v_msg = 'X';
end $$;

-- test: writer flag is bound to the transaction that set it
do $$ begin
  assert not public._payroll_is_writer();
  perform public._payroll_writer_begin();
  assert public._payroll_is_writer();
  -- a forged value with another transaction id is not the writer
  perform set_config('regin.payroll_writer', 'tx:1', true);
  assert not public._payroll_is_writer();
end $$;

-- test: the flag from the previous check did not survive into this transaction
do $$ begin
  assert not public._payroll_is_writer();
end $$;

-- test: _payroll_lock takes the global advisory lock 7240100401
do $$ begin
  perform public._payroll_lock();
  assert exists (select 1 from pg_locks where locktype = 'advisory' and granted
                   and ((classid::bigint << 32) | objid::bigint) = 7240100401);
end $$;

-- test: _payroll_actor_assert — active user with the module level passes; everything else is PERMISSION_DENIED (42501)
do $$
declare v_state text; v_detail text;
begin
  perform public._payroll_actor_assert('fin@test.local', 'כספים', array['edit']);
  perform public._payroll_actor_assert('FIN@Test.Local ', 'כספים', array['edit']);
  perform public._payroll_actor_assert('view@test.local', 'כספים', array['edit', 'view']);
  assert test.err($q$select public._payroll_actor_assert('view@test.local', 'כספים', array['edit'])$q$) = 'PERMISSION_DENIED';
  assert test.err($q$select public._payroll_actor_assert('pm@test.local', 'כספים', array['edit'])$q$) = 'PERMISSION_DENIED';
  assert test.err($q$select public._payroll_actor_assert('gone@test.local', 'כספים', array['edit'])$q$) = 'PERMISSION_DENIED';
  assert test.err($q$select public._payroll_actor_assert(null, 'כספים', array['edit'])$q$) = 'PERMISSION_DENIED';
  assert test.err($q$select public._payroll_actor_assert('', 'כספים', array['edit'])$q$) = 'PERMISSION_DENIED';
  assert test.err($q$select public._payroll_actor_assert('nobody@test.local', 'כספים', array['edit'])$q$) = 'PERMISSION_DENIED';
  begin
    perform public._payroll_actor_assert('pm@test.local', 'כספים', array['edit']);
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
  end;
  assert v_state = '42501' and v_detail = 'PAYROLL:PERMISSION_DENIED';
end $$;

-- test: _payroll_normalize_period and _payroll_month_state (Israel date)
do $$
declare v_this date := date_trunc('month', now() at time zone 'Asia/Jerusalem')::date;
begin
  assert public._payroll_normalize_period('2026-08-31') = '2026-08-01';
  assert public._payroll_normalize_period('2024-02-29') = '2024-02-01';
  assert test.err($q$select public._payroll_normalize_period(null)$q$) = 'PERIOD_INVALID';
  assert public._payroll_month_state(v_this) = 'current';
  assert public._payroll_month_state(v_this + 20) = 'current';
  assert public._payroll_month_state((v_this - interval '1 month')::date) = 'ended';
  assert public._payroll_month_state((v_this + interval '1 month')::date) = 'future';
end $$;

-- test: a missing config row is CONFIG_MISSING, not a silent default
do $$ begin
  delete from public.payroll_config;
  assert test.err('select public._payroll_config()') = 'CONFIG_MISSING';
  raise exception using errcode = 'XRB01';
exception when sqlstate 'XRB01' then null;
end $$;
