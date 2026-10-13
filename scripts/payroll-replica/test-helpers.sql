-- REG-IN · payroll replica · test helpers (schema `test`, replica only).
--
-- Shared by A's tests (supabase/tests/payroll/) and B's (supabase/tests/payroll_review/).
-- All fixture ids are ≥ 900000 and synthetic (contract §6). Nothing here is a migration.
--
--   test.act_as(email)      — role authenticated + JWT email, like a PostgREST call
--   test.act_as_service()   — role service_role (the edge function's admin client)
--   test.act_as_anon()      — role anon
--   test.act_as_owner()     — back to the superuser that owns the functions
--   test.err(sql)           — runs sql; returns 'OK', the PAYROLL code from DETAIL, or 'SQLSTATE:<x>'
--   test.hostess / test.project / test.assign — fixtures

create schema test;
grant usage on schema test to anon, authenticated, service_role;

-- users: finance edit (role 3), CEO (1), projects manager (2: finance blocked), and a
-- synthetic finance-view role, which live does not have.
insert into public.roles (role_id, role_name) values (900, 'בדיקה — צפייה בכספים');
insert into public.permissions (role_id, module_id, permission_level)
select 900, m.module_id, case when m.module_name = 'כספים' then 'view' else 'blocked' end
  from public.modules m;
insert into public.users (email, role_id, full_name, status) values
  ('fin@test.local', 3, 'בודקת כספים', 'active'),
  ('ceo@test.local', 1, 'בודק מנכ"ל', 'active'),
  ('pm@test.local', 2, 'בודקת פרויקטים', 'active'),
  ('view@test.local', 900, 'בודקת צפייה', 'active'),
  ('gone@test.local', 3, 'בודקת לא פעילה', 'inactive');

create function test.act_as(p_email text) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('email', p_email, 'role', 'authenticated')::text, true);
end $$;

create function test.act_as_service() returns void language plpgsql as $$
begin
  perform set_config('role', 'service_role', true);
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
end $$;

create function test.act_as_anon() returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
end $$;

create function test.act_as_owner() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

grant execute on all functions in schema test to anon, authenticated, service_role;

-- Runs a statement and reports how it ended. Side effects of a failing statement are rolled
-- back (sub-transaction); a successful one keeps them.
create function test.err(p_sql text) returns text language plpgsql as $$
declare
  v_detail text;
  v_state  text;
begin
  execute p_sql;
  return 'OK';
exception when others then
  get stacked diagnostics v_detail = pg_exception_detail, v_state = returned_sqlstate;
  if v_detail like 'PAYROLL:%' then
    return substr(v_detail, 9);
  end if;
  return 'SQLSTATE:' || v_state;
end $$;
grant execute on function test.err(text) to anon, authenticated, service_role;

create function test.hostess(p_id bigint, p_name text, p_id_number text,
                             p_rate numeric default 50, p_bank boolean default true)
returns bigint language plpgsql as $$
begin
  insert into public.hostesses (hostess_id, id_number, full_name, phone, email, city, hourly_rate)
  overriding system value
  values (p_id, p_id_number, p_name, '050-0000000', 'h' || p_id || '@test.local', 'תל אביב', p_rate);
  if p_bank then
    insert into public.hostess_bank_details (hostess_id, bank_name, bank_branch, bank_account)
    values (p_id, 'בנק בדיקה', '001', '12345' || p_id);
  end if;
  return p_id;
end $$;

create function test.project(p_id integer, p_date date, p_status text,
                             p_start time default '10:00', p_end time default '16:00',
                             p_cancel_type text default null, p_cancelled_at timestamptz default null,
                             p_name text default null)
returns integer language plpgsql as $$
begin
  insert into public.projects (project_id, quote_id, owner_email, final_event_date, final_location,
                               required_hostess_count, project_status, summary_report_url,
                               event_name, final_start_time, final_end_time, cancel_type, cancelled_at)
  values (p_id, p_id, 'pm@test.local', p_date, 'אולם בדיקה', 1, p_status,
          case when p_status in ('awaiting_invoice', 'awaiting_payment', 'finished') then 'reports/' || p_id || '.pdf' end,
          coalesce(p_name, 'אירוע ' || p_id), p_start, p_end, p_cancel_type, p_cancelled_at);
  return p_id;
end $$;

-- status 'finally_approved' = actual shift; 'released' with released_from 'finally_approved'
-- = cancellation-compensation candidate.
create function test.assign(p_project integer, p_hostess bigint, p_num integer default 1,
                            p_status text default 'finally_approved', p_hours numeric default 6,
                            p_rate numeric default 50, p_bonus numeric default 0,
                            p_released_from text default null)
returns void language plpgsql as $$
begin
  insert into public.assignments (project_id, hostess_id, assignment_number, assignment_status,
                                  hourly_rate_snapshot, actual_hours, personal_bonus,
                                  released_from_status, event_date)
  values (p_project, p_hostess, p_num, p_status, p_rate, p_hours, p_bonus, p_released_from, '1900-01-01');
end $$;

-- A review row for the identity (works with B's real table or the stub).
create function test.review(p_period date, p_kind text default 'regular', p_original integer default null,
                            p_status text default 'open', p_version text default 'v1:x')
returns bigint language plpgsql as $$
declare v_id bigint;
begin
  insert into public.payroll_reviews (period, report_kind, original_report_id, preview_version, status)
  values (p_period, p_kind, p_original, p_version, p_status)
  returning review_id into v_id;
  return v_id;
end $$;
