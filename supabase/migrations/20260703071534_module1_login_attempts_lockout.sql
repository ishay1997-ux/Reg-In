-- Account lockout after failed login attempts (Module 1 closure; replaced CAPTCHA)
create table if not exists login_attempts (
  email text primary key,
  failed_count int not null default 0,
  locked_until timestamptz,
  last_attempt_at timestamptz not null default now()
);

alter table login_attempts enable row level security;

create or replace function check_login_lock(p_email text)
returns timestamptz
language sql security definer
set search_path = ''
as $$
  select locked_until from public.login_attempts
  where email = p_email and locked_until is not null and locked_until > now();
$$;

create or replace function register_failed_login(p_email text)
returns timestamptz
language plpgsql security definer
set search_path = ''
as $$
declare
  v_count int;
  v_locked timestamptz;
begin
  insert into public.login_attempts (email, failed_count, last_attempt_at)
    values (p_email, 1, now())
  on conflict (email) do update
    set failed_count = public.login_attempts.failed_count + 1,
        last_attempt_at = now()
  returning failed_count into v_count;

  if v_count >= 5 then
    v_locked := now() + interval '15 minutes';
    update public.login_attempts
      set locked_until = v_locked, failed_count = 0
      where email = p_email;
    return v_locked;
  end if;

  return null;
end;
$$;

create or replace function reset_login_attempts()
returns void
language sql security definer
set search_path = ''
as $$
  delete from public.login_attempts where email = auth.email();
$$;

revoke all on function check_login_lock(text) from public;
revoke all on function register_failed_login(text) from public;
revoke all on function reset_login_attempts() from public;
grant execute on function check_login_lock(text) to anon, authenticated;
grant execute on function register_failed_login(text) to anon, authenticated;
grant execute on function reset_login_attempts() to authenticated;
