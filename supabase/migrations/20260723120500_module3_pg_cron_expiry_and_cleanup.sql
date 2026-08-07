-- =====================================================================================
-- Module 3 (Quotes) — Migration 5: pg_cron (expiry + login cleanup) + lock-fn hardening revoke
-- =====================================================================================
-- why (blueprint-M3 step 1.5): time-based transitions. M3 is the FIRST pg_cron consumer.
--   • §7.42/§7.56: daily quote-expiry job — in_progress quotes older than the `ימי_תוקף_הצעה`
--     param (30 days) flip to rejected + rejection_reason 'פג תוקף'. The job runs as postgres
--     (bypasses RLS — a system job), still fires the lock trigger (OLD.quote_status='in_progress'
--     → allowed), and satisfies the F16 CHECK (status+reason move together). Date-granular, so
--     the fixed UTC hour is immaterial (Supabase cron.timezone=GMT, §7.56 nod).
--   • §7.75: daily login_attempts cleanup — rows older than 30 days deleted.
--   • Advisor hygiene: revoke EXECUTE on the migration-4 trigger fn enforce_quote_in_progress_lock
--     from public/anon/authenticated — a trigger fn should not sit in the exposed /rpc surface
--     (non-exploitable — calling a trigger fn directly errors — but clean; clears the 2 advisor findings).
-- Applied via MCP apply_migration after Ishay's typed-echo. Verified live: cron.job shows the 2 jobs
--   (active); rolled-back logic test flips a backdated in_progress quote to rejected+'פג תוקף' and
--   deletes a stale login_attempts row; advisors no longer flag enforce_quote_in_progress_lock.
-- pg_cron install per Supabase docs (schema pg_catalog; creates the `cron` schema).

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

select cron.schedule('module3-quote-expiry', '0 1 * * *', $job$
  update public.quotes
     set quote_status = 'rejected', rejection_reason = 'פג תוקף'
   where quote_status = 'in_progress'
     and updated_at < now() - ((select param_value::int from public.params where param_name = 'ימי_תוקף_הצעה') * interval '1 day');
$job$);

select cron.schedule('module1-login-attempts-cleanup', '30 1 * * *', $job$
  delete from public.login_attempts where last_attempt_at < now() - interval '30 days';
$job$);

revoke execute on function public.enforce_quote_in_progress_lock() from public, anon, authenticated;
