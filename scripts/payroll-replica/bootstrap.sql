-- REG-IN · payroll replica · step 1: the Supabase platform pieces the live schema assumes.
--
-- What this is: the minimum of what Supabase provides around `public`, rebuilt for PGlite
-- (PostgreSQL 17.5, one connection, no Docker — contract §9.1). It is NOT a copy of Supabase.
-- Only what the payroll migrations and their tests touch is reproduced:
--   roles anon / authenticated / service_role, the default privileges that hand EXECUTE and ALL
--   to them (the trap migrations/CLAUDE.md §3 names: "REVOKE ... FROM PUBLIC does not block
--   anon"), schema `extensions` with pgcrypto, `auth.email()` exactly as live, a stub `storage`
--   schema with RLS, and schema `seed_snapshot`.

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

grant usage on schema public to anon, authenticated, service_role;

-- Supabase grants these by default to every new object in `public`. Reproducing it is the
-- point: a migration that forgets `revoke ... from anon` must fail its test here, as it would
-- leak live.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

create schema extensions;
create extension pgcrypto schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;

-- Live uses the `moddatetime` contrib extension, which PGlite does not ship. Same behaviour:
-- set the named column to now() on update.
create function extensions.moddatetime() returns trigger
language plpgsql as $$
begin
  new := jsonb_populate_record(new, jsonb_build_object(tg_argv[0], now()));
  return new;
end $$;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

-- Body copied verbatim from live `pg_get_functiondef('auth.email()')`, 13.10.2026.
create function auth.email() returns text
language sql stable as $function$
  select
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$function$;

create function auth.uid() returns uuid
language sql stable as $function$
  select nullif(
    coalesce(current_setting('request.jwt.claim.sub', true),
             (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')),
    '')::uuid
$function$;

create function auth.role() returns text
language sql stable as $function$
  select coalesce(current_setting('request.jwt.claim.role', true),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'))::text
$function$;

grant execute on function auth.email(), auth.uid(), auth.role() to anon, authenticated, service_role;

-- Storage stub: only the columns the finance policies and payroll readers use.
create schema storage;
grant usage on schema storage to anon, authenticated, service_role;

create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  allowed_mime_types text[],
  file_size_limit bigint
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  metadata jsonb,
  unique (bucket_id, name)
);

alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;
grant select on storage.buckets to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;

insert into storage.buckets (id, name, public, allowed_mime_types)
values ('finance', 'finance', false,
        array['application/pdf', 'image/jpeg', 'image/png',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);

create schema seed_snapshot;

-- Copies of live function bodies under another name, for "old vs new" comparisons in tests.
create schema live_copy;
