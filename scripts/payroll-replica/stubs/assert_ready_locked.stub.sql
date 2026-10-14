-- STUB — replica only, never a migration (brief A, step 5). Loaded by run.mjs ONLY when B's
-- `_payroll_review_assert_ready_locked(bigint, text, uuid)` does not exist after all migrations.
--
-- Same signature and lock as B's function (contract §2.2 + fix F2): locks the review row
-- `for update` and returns a readiness object. Tests steer it with the transaction-local
-- setting `test.ready` ('true' default / 'false').

create or replace function public._payroll_review_assert_ready_locked(
  p_review_id bigint, p_version text, p_exclude_operation_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_ready boolean := coalesce(nullif(current_setting('test.ready', true), ''), 'true')::boolean;
begin
  perform 1 from public.payroll_reviews where review_id = p_review_id for update;
  if v_ready then
    return jsonb_build_object('ready', true, 'blockers', '[]'::jsonb, 'counts', '{}'::jsonb);
  end if;
  return jsonb_build_object('ready', false,
    'blockers', jsonb_build_array(jsonb_build_object('code', 'DECISIONS_MISSING', 'count', 1)),
    'counts', '{}'::jsonb);
end;
$$;

revoke execute on function public._payroll_review_assert_ready_locked(bigint, text, uuid)
  from public, anon, authenticated;
