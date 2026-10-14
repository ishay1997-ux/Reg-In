-- B · מיגרציות 7, 10–13: גבולות אבטחה (D6, D10, חוזה §2.2).
-- כל טבלאות הבדיקה deny-all לתפקידי הלקוח · כל פונקציה DEFINER עם search_path ריק ·
-- רק שתי הפונקציות הציבוריות פתוחות ל-anon · mint_token ל-service_role בלבד.

-- test: review tables — RLS on, no policies, no privileges for anon/authenticated
do $$
declare t text;
begin
  foreach t in array array['payroll_reviews', 'payroll_review_recipients', 'payroll_review_tokens',
                           'payroll_review_responses', 'payroll_review_cases', 'payroll_source_corrections',
                           'payroll_review_events', 'payroll_review_rpc_calls'] loop
    assert (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass), t || ' RLS off';
    assert not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t), t || ' has a policy';
    assert not has_table_privilege('anon', 'public.' || t, 'select'), t || ' anon select';
    assert not has_table_privilege('authenticated', 'public.' || t, 'select'), t || ' auth select';
    assert not has_table_privilege('authenticated', 'public.' || t, 'insert'), t || ' auth insert';
    assert not has_table_privilege('authenticated', 'public.' || t, 'update'), t || ' auth update';
    assert not has_table_privilege('authenticated', 'public.' || t, 'delete'), t || ' auth delete';
  end loop;
end $$;

-- test: grants — public pair to anon, mint to service_role only, manager RPCs to authenticated only
do $$
declare f text;
begin
  foreach f in array array['public.payroll_review_public_get(text)',
                           'public.payroll_review_public_respond(text,uuid,text,text,jsonb)'] loop
    assert has_function_privilege('anon', f, 'execute'), f || ' not anon';
  end loop;

  assert has_function_privilege('service_role', 'public.payroll_review_mint_token(bigint,bigint,text)', 'execute');
  assert not has_function_privilege('authenticated', 'public.payroll_review_mint_token(bigint,bigint,text)', 'execute');
  assert not has_function_privilege('anon', 'public.payroll_review_mint_token(bigint,bigint,text)', 'execute');

  foreach f in array array[
      'public.payroll_review_create(date,text,integer,text)',
      'public.payroll_review_refresh(bigint,integer)',
      'public.payroll_review_get(bigint)',
      'public.payroll_review_find(date,text,integer)',
      'public.payroll_review_readiness(bigint)',
      'public.payroll_review_manager_approve(bigint,integer,text)',
      'public.payroll_review_set_deadline(bigint,integer,timestamptz,text)',
      'public.payroll_review_distribute_begin(bigint,integer,bigint[],text,uuid)',
      'public.payroll_review_queued_attempts(bigint,integer)',
      'public.payroll_review_resend_reserve(bigint,bigint,boolean)',
      'public.payroll_review_case_detail(bigint)',
      'public.payroll_review_resolve_case(bigint,integer,text,text,text)',
      'public.payroll_review_approve_no_response(bigint,text,text,text,text)',
      'public.payroll_review_cancel(bigint,text)',
      'public.correct_unclaimed_assignment(integer,bigint,integer,text,numeric,numeric,text,bigint)'] loop
    assert has_function_privilege('authenticated', f, 'execute'), f || ' not authenticated';
    assert not has_function_privilege('anon', f, 'execute'), f || ' open to anon';
  end loop;

  -- הפנימיים (none): אף תפקיד לקוח.
  foreach f in array array[
      'public._payroll_hostess_digests_from(public.payroll_line[],date,text,integer)',
      'public._payroll_hostess_digests(date,text,integer)',
      'public._payroll_review_template_config()',
      'public._payroll_review_readiness_of(public.payroll_reviews,text,uuid)',
      'public._payroll_review_assert_ready_locked(bigint,text,uuid)',
      'public._payroll_review_rate_limit()',
      'public._payroll_review_token_valid(text)',
      'public._payroll_review_case_invalid_field(jsonb,jsonb)',
      'public._payroll_review_mark_resolved(public.payroll_reviews,bigint,text,text)',
      'public._payroll_has_permission(text,text[])'] loop
    assert not has_function_privilege('anon', f, 'execute'), f || ' anon';
    assert not has_function_privilege('authenticated', f, 'execute'), f || ' authenticated';
  end loop;
end $$;

-- test: every B function is SECURITY DEFINER with an empty search_path
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as f, p.prosecdef, p.proconfig from pg_proc p
            where p.pronamespace = 'public'::regnamespace
              and (p.proname like '%payroll_review%' or p.proname in ('correct_unclaimed_assignment',
                   '_payroll_hostess_digests', '_payroll_hostess_digests_from', '_payroll_has_permission'))
  loop
    assert r.prosecdef, format('%s is not security definer', r.f);
    assert r.proconfig @> array['search_path=""'], format('%s has no empty search_path', r.f);
  end loop;
end $$;

-- test: assert_ready_locked has the exact F2 signature A depends on
do $$ begin
  assert to_regprocedure('public._payroll_review_assert_ready_locked(bigint,text,uuid)') is not null;
  assert (select prorettype = 'jsonb'::regtype from pg_proc
           where oid = 'public._payroll_review_assert_ready_locked(bigint,text,uuid)'::regprocedure);
end $$;

-- test: migration 10 — the template row exists, owned by the finance manager role, same type as the accountant's
do $$
declare v public.params; acc public.params;
begin
  select * into v from public.params where param_name = 'תבנית_מייל_סיכום_שעות_דיילת';
  select * into acc from public.params where param_name = 'תבנית_מייל_דוח_שכר';
  assert v.param_id is not null;
  assert v.param_type = acc.param_type;
  assert v.owner_role_id = (select role_id from public.roles where role_name = 'מנהלת כספים ולקוחות');
  assert (public._payroll_review_template_config() ->> 'template_valid')::boolean;
  assert strpos(v.param_value, 'נשמח לתשובתך עד [מועד_אחרון_לתגובה]') > 0;
end $$;

-- test: migration 10 is idempotent and never overwrites an edited body
update public.params set param_value = 'גוף ערוך [שם_דיילת] [חודש_דיווח_ושנה] [לינק_בדיקת_שעות] [מועד_אחרון_לתגובה]'
 where param_name = 'תבנית_מייל_סיכום_שעות_דיילת';
-- @include-migration 20261014001000_module8_payroll_review_template_seed.sql
do $$ begin
  assert (select count(*) from public.params where param_name = 'תבנית_מייל_סיכום_שעות_דיילת') = 1;
  assert (select param_value from public.params where param_name = 'תבנית_מייל_סיכום_שעות_דיילת') like 'גוף ערוך%';
end $$;

-- test: template validity — a missing required token or an unknown token makes it invalid
do $$
declare v jsonb;
begin
  update public.params set param_value = 'שלום [שם_דיילת] [חודש_דיווח_ושנה] [מועד_אחרון_לתגובה]'
   where param_name = 'תבנית_מייל_סיכום_שעות_דיילת';
  v := public._payroll_review_template_config();
  assert not (v ->> 'template_valid')::boolean;
  assert v -> 'missing_tokens' = '["[לינק_בדיקת_שעות]"]'::jsonb;

  update public.params
     set param_value = 'שלום [שם_דיילת] [חודש_דיווח_ושנה] [לינק_בדיקת_שעות] [מועד_אחרון_לתגובה] [שם_רואה_חשבון]'
   where param_name = 'תבנית_מייל_סיכום_שעות_דיילת';
  v := public._payroll_review_template_config();
  assert not (v ->> 'template_valid')::boolean;
  assert v -> 'unknown_tokens' = '["[שם_רואה_חשבון]"]'::jsonb;
end $$;
