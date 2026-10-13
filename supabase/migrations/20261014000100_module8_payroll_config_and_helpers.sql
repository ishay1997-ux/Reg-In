-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 1 (A) — מתגי הבטיחות ועזרי הליבה
-- =============================================================================
-- why: כל כותב של שכר (החדש, הישן, התיקון של אוגוסט) צריך אותם ארבעה דברים: נעילה אחת
-- גלובלית (חוזה D2), סימן "אני הכותב המורשה" שמחזיק רק לטרנזקציה הנוכחית (D3), דרך
-- אחת להחזיר שגיאה עם קוד שהמסך מבין (D7), ומתגי כיבוי אטומיים להעברה ולחזרה (D16).
--
-- 🔑 expand בלבד: טבלה חדשה ופונקציות פנימיות. שום קוד פרוס לא קורא אותן.
-- 🔒 כל הפונקציות כאן פנימיות ("none"): אין להן EXECUTE לאף תפקיד לקוח. הן נקראות רק
--    מתוך פונקציות SECURITY DEFINER אחרות, בשם הבעלים.
-- =============================================================================

create table public.payroll_config (
  id                  boolean     primary key default true check (id),
  legacy_writer       text        not null default 'enabled'
                                  check (legacy_writer in ('enabled', 'disabled')),
  final_issue_enabled boolean     not null default false,
  review_mail_enabled boolean     not null default false,
  locked_periods      date[]      not null default '{}',
  updated_at          timestamptz not null default now(),
  updated_by          text
);

comment on table public.payroll_config is
  'מ8 — שורה אחת: מתגי הכיבוי של תהליך השכר (D16). legacy_writer = הדיאלוג הישן; final_issue_enabled / review_mail_enabled = התהליך החדש; locked_periods = חודשים שאסור לאסוף.';

insert into public.payroll_config (id) values (true) on conflict (id) do nothing;

alter table public.payroll_config enable row level security;
revoke all on table public.payroll_config from public, anon, authenticated;

create trigger payroll_config_set_updated_at
  before update on public.payroll_config
  for each row execute function extensions.moddatetime('updated_at');


-- -----------------------------------------------------------------------------
-- הנעילה הגלובלית (D2). מספר קבוע אחד לכל כותבי השכר.
-- -----------------------------------------------------------------------------
create or replace function public._payroll_lock()
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform pg_advisory_xact_lock(7240100401);
end;
$$;


-- -----------------------------------------------------------------------------
-- סימן הכותב (D3): ערך שקשור למזהה הטרנזקציה. PostgREST לא חושף set_config, ולכן
-- הדפדפן לא יכול לזייף אותו; ובטרנזקציה הבאה הוא כבר לא תקף.
-- -----------------------------------------------------------------------------
create or replace function public._payroll_writer_begin()
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform set_config('regin.payroll_writer', 'tx:' || txid_current()::text, true);
end;
$$;

create or replace function public._payroll_is_writer()
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
begin
  return coalesce(current_setting('regin.payroll_writer', true), '')
         = 'tx:' || txid_current()::text;
end;
$$;


-- -----------------------------------------------------------------------------
-- שגיאה עם קוד (D7): errcode P0001, detail = 'PAYROLL:<CODE>', hint = JSON בטוח.
-- -----------------------------------------------------------------------------
create or replace function public._payroll_raise(p_code text, p_message text, p_hint jsonb default null)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  raise exception using
    errcode = 'P0001',
    message = coalesce(p_message, p_code),
    detail  = 'PAYROLL:' || p_code,
    hint    = coalesce(p_hint, '{}'::jsonb)::text;
end;
$$;


-- -----------------------------------------------------------------------------
-- הרשאת "השחקן" כשהקורא הוא פונקציית השרת (service role): המייל מגיע מ-getUser()
-- של פונקציית השרת, ולא מ-auth.email() — שהוא ריק בקריאת service role.
-- -----------------------------------------------------------------------------
create or replace function public._payroll_actor_assert(p_email text, p_module text, p_levels text[])
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if nullif(btrim(coalesce(p_email, '')), '') is null
     or not exists (
       select 1
         from public.users u
         join public.permissions p on p.role_id = u.role_id
         join public.modules m on m.module_id = p.module_id
        where lower(u.email) = lower(btrim(p_email))
          and u.status = 'active'
          and m.module_name = p_module
          and p.permission_level = any (p_levels)
     ) then
    raise exception using
      errcode = '42501',
      message = 'אין הרשאה לבצע פעולה זו בדוח השכר.',
      detail  = 'PAYROLL:PERMISSION_DENIED',
      hint    = '{}';
  end if;
end;
$$;


create or replace function public._payroll_normalize_period(p_period date)
returns date
language plpgsql
immutable
security definer
set search_path to ''
as $$
begin
  if p_period is null then
    perform public._payroll_raise('PERIOD_INVALID', 'יש לבחור חודש.');
  end if;
  return date_trunc('month', p_period::timestamp)::date;
end;
$$;


-- 'ended' / 'current' / 'future' — לפי התאריך בישראל, לא לפי השעון של השרת (UTC).
create or replace function public._payroll_month_state(p_period date)
returns text
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_month_start date := date_trunc('month', (now() at time zone 'Asia/Jerusalem'))::date;
  v_period      date := date_trunc('month', p_period::timestamp)::date;
begin
  if v_period < v_month_start then
    return 'ended';
  elsif v_period = v_month_start then
    return 'current';
  end if;
  return 'future';
end;
$$;


create or replace function public._payroll_config()
returns public.payroll_config
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_cfg public.payroll_config;
begin
  select * into v_cfg from public.payroll_config where id;
  if not found then
    perform public._payroll_raise('CONFIG_MISSING', 'הגדרות דוח השכר חסרות במסד.');
  end if;
  return v_cfg;
end;
$$;


-- 🔒 "none": אף תפקיד לקוח לא מריץ את אלה. (ב-Supabase ברירת המחדל נותנת EXECUTE גם
-- ל-anon בשם מפורש, ולכן revoke מ-public לבד אינו מספיק.)
revoke execute on function public._payroll_lock() from public, anon, authenticated;
revoke execute on function public._payroll_writer_begin() from public, anon, authenticated;
revoke execute on function public._payroll_is_writer() from public, anon, authenticated;
revoke execute on function public._payroll_raise(text, text, jsonb) from public, anon, authenticated;
revoke execute on function public._payroll_actor_assert(text, text, text[]) from public, anon, authenticated;
revoke execute on function public._payroll_normalize_period(date) from public, anon, authenticated;
revoke execute on function public._payroll_month_state(date) from public, anon, authenticated;
revoke execute on function public._payroll_config() from public, anon, authenticated;
