-- REG-IN · seed snapshot · RESTORE
--
-- 🔴 DESTRUCTIVE. This overwrites live business tables with a dated snapshot.
--
-- IT WILL NOT RUN AS-IS, ON PURPOSE.
--   The `raise exception` below aborts the script. Removing that one line is the deliberate
--   act that says "yes, overwrite production data". Do not remove it to 'test' the script.
--
-- BEFORE YOU RUN IT
--   1. Take a fresh capture first (`capture-seed-snapshot.sql`) -- restoring is itself a
--      change you may want to undo.
--   2. Pick ONE date suffix and set it in `stamp` below. Mixing dates across tables produces
--      a state that never existed: `project_finance` rows pointing at projects from another
--      day is exactly the silent incoherence `seed-coherence-tests.md` exists to catch.
--   3. Know that this restores ROWS ONLY. It does not restore sequences, and it truncates
--      with CASCADE, so anything referencing these tables from outside the list goes too.
--
-- AFTER YOU RUN IT
--   Run the sixteen coherence tests in
--   `docs/specs/module_11_reports/seed-coherence-tests.md`. A restore that passes row counts
--   and fails coherence is the expected failure mode here, not an unlikely one.

do $$
begin
  raise exception
    'RESTORE IS LOCKED. Read scripts/seed-snapshot/README.md §6, set the stamp below, then delete this raise.';
end $$;

do $$
declare
  src   text;
  stamp text := 'YYYYMMDD';  -- <-- set to the snapshot you intend to restore
  tables text[] := array[
    -- children first, parents last: truncate order matters even with cascade
    'salary_report_lines', 'salary_reports', 'email_log',
    'project_finance', 'project_changes', 'logistics',
    'quote_services', 'quotes', 'assignments', 'projects',
    'customer_hostess_preference', 'customer_contacts', 'customers',
    'hostess_bank_details', 'hostess_unavailability', 'hostess_languages', 'hostesses',
    'product_costs', 'products', 'price_tiers', 'params',
    'seed_registry', 'notification_preferences'
  ];
begin
  if stamp = 'YYYYMMDD' then
    raise exception 'stamp was never set -- refusing to run';
  end if;

  foreach src in array tables loop
    if to_regclass('seed_snapshot.' || src || '_' || stamp) is null then
      raise exception 'snapshot seed_snapshot.%_% does not exist -- aborting before any write', src, stamp;
    end if;
  end loop;

  -- every table is emptied before any is refilled, so a mid-run failure leaves an obviously
  -- broken database rather than a plausible-looking half-restored one
  foreach src in array tables loop
    execute format('truncate table public.%I cascade', src);
  end loop;

  foreach src in array (select array_agg(t order by ord desc)
                        from unnest(tables) with ordinality as u(t, ord)) loop
    execute format('insert into public.%I select * from seed_snapshot.%I',
                   src, src || '_' || stamp);
  end loop;
end $$;

-- Verify before trusting: every pair must match.
select 'run the coherence tests in docs/specs/module_11_reports/seed-coherence-tests.md' as next_step;
