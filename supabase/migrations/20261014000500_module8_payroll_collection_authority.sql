-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 5 (A) — סמכות האיסוף, התצוגה המקדימה וההיסטוריה
-- =============================================================================
-- why: עד היום כלל "אילו משמרות נכנסות לדוח החודש" חי רק בתוך הכותב הישן, שכותב תוך כדי
-- חישוב — ולכן אי אפשר היה לראות טיוטה בלי להפיק. כאן הכלל עובר לפונקציה אחת שקוראת
-- בלבד (payroll_collect), וכל השאר — הטיוטה, גרסת הטיוטה (גיבוב), הבדיקה של הדיילות,
-- ההפקה הסופית והכותב הישן — נשענים עליה. אין חישוב שכר שני.
--
-- 🔑 שלושה שינויים מכוונים מול הכותב החי (H3, נמשך 13.10.2026, md5 d8d58ba0…):
--   (a) חודש בלבד: event_date בתוך החודש, ולא "כל מה שעד סוף החודש". אחרת הפקת ספטמבר
--       בדיאלוג הישן הייתה סוחפת ~4,000 משמרות מחודשים קודמים (חוזה D14).
--   (b) פיצוי ביטול חוצה חצות: mod(…+86400, 86400) — אותו כלל כמו finance_project_money,
--       quotes.estimated_hours ו-projectCard.js (D1). 🔴 נמדד 13.10: 25 מועמדי פיצוי שהכותב
--       החי היה נותן להם שעות **שליליות** עוברים לשעות חיוביות. זה שינוי כסף מכוון
--       ומאושר (הכרעת הסגן R1) — שעות שליליות לא יכולות להיות נכונות.
--   (c) hours_raw (דיוק מלא) נשמר לצד hours = round(hours_raw, 2), וסכום השורה מחושב על
--       הלא-מעוגל — בדיוק כמו בכותב החי.
-- 🔑 סף חסר בפרמטרי הפיצוי (72 / 24 / 50) → השורה מסומנת COMP_HOURS_MISSING במקום
--    "100%" שקט, שהיה התוצאה בכותב החי. זה המקרה היחיד שבו האיסוף מחמיר.
-- 🔑 expand בלבד: טיפוס ופונקציות חדשים. שום קוד פרוס לא קורא אותם.
-- =============================================================================

create type public.payroll_line as (
  -- keys
  project_id        integer,
  hostess_id        bigint,
  assignment_number integer,
  line_basis        text,
  event_date        date,
  event_name        text,
  -- project inputs
  project_status    text,
  cancel_type       text,
  cancelled_at      timestamptz,
  final_start_time  time,
  final_end_time    time,
  -- money
  comp_pct          numeric,
  hours_raw         numeric,
  hours             numeric,
  rate              numeric,
  bonus             numeric,
  travel            numeric,
  line_total        numeric,
  -- identity (בלי בנק במכוון: הסיכום האישי של B לא נוגע בפרטי בנק)
  hostess_name      text,
  id_number         text,
  hostess_email     text,
  -- flags
  show_in_file      boolean,
  defects           text[],
  warnings          text[]
);


-- -----------------------------------------------------------------------------
-- payroll_collect — הסמכות היחידה לאיסוף. קוראת בלבד.
-- bonus ו-travel הם 0 (לא null) בשורות פיצוי, כדי שסכום השורה לא יהפוך ל-null;
-- ה-null מוצג רק בשכבת התצוגה (payroll_preview).
-- -----------------------------------------------------------------------------
create or replace function public.payroll_collect(p_period date, p_kind text, p_original_report_id integer)
returns setof public.payroll_line
language sql
stable
security definer
set search_path to ''
as $$
  with prm as (
    select
      (select nullif(btrim(pa.param_value), '')::numeric from public.params pa
        where pa.param_name = 'סכום_נסיעות_למשמרת')    as travel,
      (select nullif(btrim(pa.param_value), '')::numeric from public.params pa
        where pa.param_name = 'שעות_פיצוי_ביטול_חלקי') as partial_h,
      (select nullif(btrim(pa.param_value), '')::numeric from public.params pa
        where pa.param_name = 'שעות_פיצוי_ביטול_מלא')  as full_h,
      (select nullif(btrim(pa.param_value), '')::numeric from public.params pa
        where pa.param_name = 'אחוז_פיצוי_ביטול_חלקי') as partial_pct
  ),
  bounds as (
    select date_trunc('month', p_period::timestamp)::date                        as d0,
           (date_trunc('month', p_period::timestamp) + interval '1 month')::date as d1
  ),
  base as (
    -- משמרת שבוצעה: פרויקט סגור תפעולית, שיבוץ שאושר סופית.
    select a.project_id, a.hostess_id, a.assignment_number,
           'actual'::text            as line_basis,
           a.event_date, p.event_name,
           p.project_status, p.cancel_type, p.cancelled_at, p.final_start_time, p.final_end_time,
           null::numeric             as comp_pct,
           a.actual_hours            as hours_raw,
           a.hourly_rate_snapshot    as rate,
           coalesce(a.personal_bonus, 0) as bonus,
           case when a.actual_hours > 0 then coalesce(prm.travel, 0) else 0 end as travel,
           h.full_name, h.id_number, h.email,
           false                     as zero_duration
      from public.assignments a
      join public.projects p  on p.project_id = a.project_id
      join public.hostesses h on h.hostess_id = a.hostess_id
      cross join prm
      cross join bounds b
     where a.salary_report_id is null
       and a.assignment_status = 'finally_approved'
       and a.event_date >= b.d0 and a.event_date < b.d1
       and p.project_status in ('awaiting_invoice', 'awaiting_payment', 'finished')
    union all
    -- פיצוי ביטול: דיילת ששוחררה מאישור סופי באירוע שבוטל.
    select a.project_id, a.hostess_id, a.assignment_number,
           'cancellation_compensation'::text,
           a.event_date, p.event_name,
           p.project_status, p.cancel_type, p.cancelled_at, p.final_start_time, p.final_end_time,
           c.pct,
           c.duration_h * c.pct / 100.0,
           a.hourly_rate_snapshot,
           0::numeric,
           0::numeric,
           h.full_name, h.id_number, h.email,
           coalesce(p.final_start_time = p.final_end_time, false)
      from public.assignments a
      join public.projects p  on p.project_id = a.project_id
      join public.hostesses h on h.hostess_id = a.hostess_id
      cross join prm
      cross join bounds b
      cross join lateral (
        select
          case when p.final_start_time is null or p.final_end_time is null then null
               else mod(extract(epoch from (p.final_end_time - p.final_start_time)) + 86400, 86400) / 3600.0
          end as duration_h,
          case
            when p.cancel_type = 'force_majeure' then 0::numeric
            when p.cancelled_at is null then null
            when prm.partial_h is null or prm.full_h is null or prm.partial_pct is null then null
            when extract(epoch from (((p.final_event_date + p.final_start_time) at time zone 'Asia/Jerusalem')
                                     - p.cancelled_at)) / 3600.0 > prm.partial_h then 0::numeric
            when extract(epoch from (((p.final_event_date + p.final_start_time) at time zone 'Asia/Jerusalem')
                                     - p.cancelled_at)) / 3600.0 >= prm.full_h then prm.partial_pct
            else 100::numeric
          end as pct
      ) c
     where a.salary_report_id is null
       and a.released_from_status = 'finally_approved'
       and p.project_status = 'cancelled'
       and a.event_date >= b.d0 and a.event_date < b.d1
  )
  select x.project_id, x.hostess_id, x.assignment_number, x.line_basis, x.event_date, x.event_name,
         x.project_status, x.cancel_type, x.cancelled_at, x.final_start_time, x.final_end_time,
         x.comp_pct, x.hours_raw, round(x.hours_raw, 2), x.rate, x.bonus, x.travel, x.line_total,
         x.full_name, x.id_number, x.email,
         coalesce(x.line_total <> 0, true),
         array_remove(array[
           case when x.hours_raw is null then 'COMP_HOURS_MISSING' end,
           case when nullif(btrim(coalesce(x.full_name, '')), '') is null
                  or nullif(btrim(coalesce(x.id_number, '')), '') is null then 'IDENTITY_MISSING' end
         ], null),
         array_remove(array[
           case when x.line_total = 0 then 'ZERO_VALUE' end,
           case when x.zero_duration then 'COMP_DURATION_ZERO' end
         ], null)
    from (select base.*, round(base.hours_raw * base.rate + base.bonus + base.travel, 2) as line_total
            from base) x
   order by x.project_id, x.hostess_id, x.assignment_number, x.line_basis;
$$;


-- -----------------------------------------------------------------------------
-- תקינות רו"ח — מוגדרת במקום אחד (תיקון F9): גם התצוגה המקדימה וגם המוכנות קוראות כאן.
-- -----------------------------------------------------------------------------
create or replace function public._payroll_accountant_config()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_recipient text;
  v_body      text;
  v_tokens    text[];
  v_missing   text[];
  v_unknown   text[];
  v_required  constant text[] := array['[חודש_דיווח_ושנה]'];
  v_allowed   constant text[] := array['[חודש_דיווח_ושנה]', '[שם_רואה_חשבון]'];
begin
  select nullif(btrim(pa.param_value), '') into v_recipient
    from public.params pa where pa.param_name = 'מייל_משרד_רואי_חשבון';
  select pa.param_value into v_body
    from public.params pa where pa.param_name = 'תבנית_מייל_דוח_שכר';

  select coalesce(array_agg(distinct m[1]), '{}') into v_tokens
    from regexp_matches(coalesce(v_body, ''), '(\[[^]\n]+\])', 'g') as m;
  select coalesce(array_agg(t), '{}') into v_missing
    from unnest(v_required) t where not (t = any (v_tokens));
  select coalesce(array_agg(t order by t), '{}') into v_unknown
    from unnest(v_tokens) t where not (t = any (v_allowed));

  return jsonb_build_object(
    'recipient', v_recipient,
    'recipient_valid', coalesce(v_recipient ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$', false),
    'template_name', 'תבנית_מייל_דוח_שכר',
    'template_valid', v_body is not null and btrim(v_body) <> ''
                      and cardinality(v_missing) = 0 and cardinality(v_unknown) = 0,
    'template_sha256', case when v_body is null then null
                            else encode(sha256(convert_to(v_body, 'UTF8')), 'hex') end,
    'missing_tokens', to_jsonb(v_missing),
    'unknown_tokens', to_jsonb(v_unknown)
  );
end;
$$;


-- מראת השומר של פונקציית השרת (D11), לתצוגה בלבד. השומר בשרת הוא הסמכות.
create or replace function public._payroll_guard_mirror(p_intended text)
returns jsonb
language plpgsql
immutable
security definer
set search_path to ''
as $$
declare
  v_address text := btrim(coalesce(p_intended, ''));
begin
  if v_address = '' or v_address !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    return jsonb_build_object('intended', nullif(v_address, ''), 'valid', false,
                              'delivered', null, 'redirected', null);
  end if;
  if v_address ~* '^ishay1997(\+[a-z0-9._-]{1,64})?@gmail\.com$' then
    return jsonb_build_object('intended', v_address, 'valid', true,
                              'delivered', v_address, 'redirected', false);
  end if;
  return jsonb_build_object('intended', v_address, 'valid', true,
                            'delivered', 'ishay1997@gmail.com', 'redirected', true);
end;
$$;


-- -----------------------------------------------------------------------------
-- בדיקת הזהות: חודש תקין, לא עתידי, לא נעול; דוח רגיל אחד לחודש; השלמה רק לדוח רגיל
-- קיים מאותו חודש.
-- -----------------------------------------------------------------------------
create or replace function public._payroll_identity_check(p_period date, p_kind text, p_original integer)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_period    date;
  v_state     text;
  v_cfg       public.payroll_config;
  v_existing  integer;
  v_orig      record;
  v_next_seq  integer;
  v_this_year integer := extract(year from (now() at time zone 'Asia/Jerusalem'))::integer;
begin
  if p_period is null or p_kind is null or p_kind not in ('regular', 'supplement') then
    perform public._payroll_raise('PERIOD_INVALID', 'החודש או סוג הדוח אינם תקינים.');
  end if;
  v_period := public._payroll_normalize_period(p_period);

  if extract(year from v_period) < 2025 or extract(year from v_period) > v_this_year + 1 then
    perform public._payroll_raise('PERIOD_INVALID', 'אפשר להפיק דוח שכר רק לחודשים מ-2025 ואילך.');
  end if;

  v_state := public._payroll_month_state(v_period);
  if v_state = 'future' then
    perform public._payroll_raise('FUTURE_PERIOD', 'אי אפשר להכין דוח שכר לחודש שעוד לא התחיל.');
  end if;

  v_cfg := public._payroll_config();
  if v_period = any (v_cfg.locked_periods) then
    perform public._payroll_raise('PERIOD_LOCKED',
      'החודש הזה נעול לאיסוף שכר עד שיוסדר תיקון ידני.',
      jsonb_build_object('period', v_period));
  end if;

  if p_kind = 'regular' then
    if p_original is not null then
      perform public._payroll_raise('ORIGINAL_INVALID', 'לדוח רגיל אין דוח מקור.');
    end if;
    select sr.report_id into v_existing
      from public.salary_reports sr
     where sr.period = v_period and sr.report_kind = 'regular';
    if found then
      perform public._payroll_raise('PERIOD_EXISTS',
        format('דוח לחודש %s כבר הופק (מספר %s). לא ניתן להפיק פעמיים אותו חודש.',
               to_char(v_period, 'MM/YYYY'), v_existing),
        jsonb_build_object('report_id', v_existing));
    end if;
  else
    select sr.report_id, sr.period, sr.report_kind into v_orig
      from public.salary_reports sr where sr.report_id = p_original;
    if not found or v_orig.report_kind <> 'regular' or v_orig.period <> v_period then
      perform public._payroll_raise('ORIGINAL_INVALID',
        'דוח ההשלמה חייב להתייחס לדוח רגיל שהופק לאותו חודש.',
        jsonb_build_object('original_report_id', p_original));
    end if;
    select coalesce(max(sr.supplement_seq), 0) + 1 into v_next_seq
      from public.salary_reports sr where sr.original_report_id = p_original;
  end if;

  return jsonb_build_object(
    'period', v_period,
    'period_end', (v_period + interval '1 month' - interval '1 day')::date,
    'month_state', v_state,
    'next_supplement_seq', v_next_seq
  );
end;
$$;


-- -----------------------------------------------------------------------------
-- גרסת הטיוטה: גיבוב של כל מה שמשפיע על הכסף ועל הקובץ. בלי מי שביקש (D8).
-- 🔑 project_status נכנס לגיבוב רק בשורות פיצוי: בשורת "בוצע" מעבר שגרתי בין
--    awaiting_invoice / awaiting_payment / finished (חשבונית, תשלום) לא משנה כסף, ולא
--    אמור לבטל את אישור המנהלת (בודק 1, רשות 4).
-- -----------------------------------------------------------------------------
create or replace function public._payroll_version_of(p_rows public.payroll_line[], p_period date, p_kind text,
                                                      p_original integer)
returns text
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_header text;
  v_body   text;
  v_acc    jsonb := public._payroll_accountant_config();
begin
  select concat_ws('|', 'v1',
           date_trunc('month', p_period::timestamp)::date::text, p_kind, coalesce(p_original::text, ''),
           coalesce((select pa.param_value from public.params pa where pa.param_name = 'סכום_נסיעות_למשמרת'), ''),
           coalesce((select pa.param_value from public.params pa where pa.param_name = 'שעות_פיצוי_ביטול_חלקי'), ''),
           coalesce((select pa.param_value from public.params pa where pa.param_name = 'שעות_פיצוי_ביטול_מלא'), ''),
           coalesce((select pa.param_value from public.params pa where pa.param_name = 'אחוז_פיצוי_ביטול_חלקי'), ''),
           coalesce(v_acc ->> 'recipient', ''),
           coalesce(v_acc ->> 'template_sha256', ''))
    into v_header;

  select string_agg(
           jsonb_build_array(
             r.project_id, r.hostess_id, r.assignment_number, r.line_basis, r.event_date,
             case when r.line_basis = 'cancellation_compensation' then r.project_status end,
             r.cancel_type, extract(epoch from r.cancelled_at), r.final_start_time, r.final_end_time,
             r.hours_raw, r.rate, r.bonus, r.travel, r.line_total, r.hostess_name, r.id_number,
             b.bank_name, b.bank_branch, b.bank_account)::text,
           E'\n' order by r.project_id, r.hostess_id, r.assignment_number, r.line_basis)
    into v_body
    from unnest(p_rows) r
    left join public.hostess_bank_details b on b.hostess_id = r.hostess_id;

  return 'v1:' || encode(sha256(convert_to(v_header || E'\n' || coalesce(v_body, ''), 'UTF8')), 'hex');
end;
$$;

create or replace function public._payroll_preview_version(p_period date, p_kind text, p_original integer)
returns text
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_rows public.payroll_line[];
begin
  v_rows := array(select c from public.payroll_collect(p_period, p_kind, p_original) c);
  return public._payroll_version_of(v_rows, p_period, p_kind, p_original);
end;
$$;


-- -----------------------------------------------------------------------------
-- משמרות שאושרו לחודש אבל הפרויקט שלהן עוד לא נסגר תפעולית — הן לא בדוח, ומוצגות
-- כהסבר בלבד (לא נכנסות לגרסה).
-- -----------------------------------------------------------------------------
create or replace function public.payroll_pending_closure(p_period date)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $$
  with pending as (
    select a.project_id, p.event_name, a.event_date, p.project_status
      from public.assignments a
      join public.projects p on p.project_id = a.project_id
     where a.assignment_status = 'finally_approved'
       and a.salary_report_id is null
       and a.event_date >= date_trunc('month', p_period::timestamp)::date
       and a.event_date < (date_trunc('month', p_period::timestamp) + interval '1 month')::date
       and p.project_status in ('not_started', 'in_progress', 'ready', 'event_finished')
  )
  select jsonb_build_object(
    'ok', true,
    'project_count', (select count(distinct project_id) from pending),
    'assignment_count', (select count(*) from pending),
    'projects', coalesce((
      select jsonb_agg(jsonb_build_object('project_id', project_id, 'event_name', event_name,
                                          'event_date', event_date, 'project_status', project_status)
                       order by event_date, project_id)
        from (select distinct project_id, event_name, event_date, project_status from pending) d
    ), '[]'::jsonb)
  );
$$;


-- -----------------------------------------------------------------------------
-- payroll_preview — הטיוטה. קוראת בלבד; כספים edit (יש בה פרטי בנק).
-- -----------------------------------------------------------------------------
create or replace function public.payroll_preview(p_period date, p_kind text default 'regular',
                                                  p_original_report_id integer default null)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_id      jsonb;
  v_period  date;
  v_rows    public.payroll_line[];
  v_pending jsonb;
  v_acc     jsonb;
  v_guard   jsonb;
  v_review  jsonb;
  v_op      jsonb;
  v_orig    jsonb;
begin
  perform public.assert_module_permission('כספים', array['edit']);

  v_id := public._payroll_identity_check(p_period, p_kind, p_original_report_id);
  v_period := (v_id ->> 'period')::date;
  v_rows := array(select c from public.payroll_collect(v_period, p_kind, p_original_report_id) c);

  -- הסבר בלבד: כשל כאן מוחזר כ-ok:false, ולעולם לא כאפס.
  begin
    v_pending := public.payroll_pending_closure(v_period);
  exception when others then
    v_pending := jsonb_build_object('ok', false);
  end;

  v_acc := public._payroll_accountant_config();
  v_guard := public._payroll_guard_mirror(v_acc ->> 'recipient');

  select jsonb_build_object('review_id', r.review_id, 'revision', r.revision, 'status', r.status)
    into v_review
    from public.payroll_reviews r
   where r.period = v_period and r.report_kind = p_kind
     and coalesce(r.original_report_id, 0) = coalesce(p_original_report_id, 0)
     and r.status in ('open', 'issuing');

  select jsonb_build_object('operation_id', o.operation_id, 'state', o.state)
    into v_op
    from public.payroll_operations o
   where o.period = v_period and o.report_kind = p_kind
     and coalesce(o.original_report_id, 0) = coalesce(p_original_report_id, 0)
     and o.state in ('preparing', 'prepared');

  if p_kind = 'supplement' then
    select jsonb_build_object('report_id', sr.report_id, 'period', sr.period) into v_orig
      from public.salary_reports sr where sr.report_id = p_original_report_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'period', v_period,
    'period_end', v_id -> 'period_end',
    'kind', p_kind,
    'original_report_id', p_original_report_id,
    'original', v_orig,
    'supplement_seq_next', v_id -> 'next_supplement_seq',
    'month_state', v_id -> 'month_state',
    'captured_at', now(),
    'version', public._payroll_version_of(v_rows, v_period, p_kind, p_original_report_id),
    'totals', (
      select jsonb_build_object(
        'line_count', count(*),
        'file_line_count', count(*) filter (where r.show_in_file),
        'hostess_count', count(distinct r.hostess_id),
        'total_amount', case when bool_or(r.line_total is null) then null
                             else coalesce(sum(r.line_total), 0) end,
        'bonus_total', coalesce(sum(r.bonus), 0),
        'travel_total', coalesce(sum(r.travel), 0),
        'zero_line_count', count(*) filter (where r.line_total = 0))
        from unnest(v_rows) r),
    'lines', coalesce((
      select jsonb_agg(jsonb_build_object(
               'project_id', r.project_id, 'hostess_id', r.hostess_id,
               'assignment_number', r.assignment_number, 'event_date', r.event_date,
               'event_name', r.event_name, 'line_basis', r.line_basis,
               'hours', r.hours, 'hours_raw', r.hours_raw, 'rate', r.rate,
               'bonus', case when r.line_basis = 'actual' then r.bonus end,
               'travel', case when r.line_basis = 'actual' then r.travel end,
               'line_total', r.line_total, 'show_in_file', r.show_in_file,
               'hostess_name', r.hostess_name, 'id_number', r.id_number,
               'bank_name', b.bank_name, 'bank_branch', b.bank_branch, 'bank_account', b.bank_account,
               'defects', to_jsonb(r.defects), 'warnings', to_jsonb(r.warnings))
             order by r.hostess_name, r.event_date, r.project_id, r.assignment_number, r.line_basis)
        from unnest(v_rows) r
        left join public.hostess_bank_details b on b.hostess_id = r.hostess_id), '[]'::jsonb),
    'pending_closure', v_pending,
    'blockers', coalesce((
      select jsonb_agg(jsonb_build_object('code', g.code, 'count', g.cnt, 'refs', g.refs) order by g.code)
        from (select d.code, count(*) as cnt,
                     jsonb_agg(jsonb_build_object('project_id', r.project_id, 'hostess_id', r.hostess_id,
                                                  'assignment_number', r.assignment_number)
                               order by r.project_id, r.hostess_id, r.assignment_number) as refs
                from unnest(v_rows) r cross join lateral unnest(r.defects) as d(code)
               group by d.code) g), '[]'::jsonb),
    'warnings', coalesce((
      select jsonb_agg(jsonb_build_object('code', g.code, 'count', g.cnt, 'refs', g.refs) order by g.code)
        from (select w.code, count(*) as cnt,
                     jsonb_agg(jsonb_build_object('project_id', r.project_id, 'hostess_id', r.hostess_id,
                                                  'assignment_number', r.assignment_number)
                               order by r.project_id, r.hostess_id, r.assignment_number) as refs
                from unnest(v_rows) r cross join lateral unnest(r.warnings) as w(code)
               group by w.code) g), '[]'::jsonb),
    'accountant', jsonb_build_object(
      'recipient', v_acc -> 'recipient',
      'recipient_valid', v_acc -> 'recipient_valid',
      'template_valid', v_acc -> 'template_valid',
      'delivered', v_guard -> 'delivered',
      'redirected', v_guard -> 'redirected'),
    'active_review', v_review,
    'active_operation', v_op
  );
end;
$$;


-- -----------------------------------------------------------------------------
-- מצב השליחה האפקטיבי של ניסיון: sending שעבר 120 שניות = "לא ידוע". קוראת בלבד.
-- (מוגדרת כאן ולא במיגרציה 6, כי ההיסטוריה למטה נשענת עליה.)
-- -----------------------------------------------------------------------------
create or replace function public._payroll_attempt_effective_state(p_attempt public.payroll_mail_attempts)
returns text
language sql
stable
security definer
set search_path to ''
as $$
  select case
           when p_attempt.state = 'sending'
                and p_attempt.sending_started_at < now() - interval '120 seconds' then 'unknown'
           else p_attempt.state
         end;
$$;


-- מצב שליחה לדוח: חדש = הניסיון האחרון (אפקטיבי, F1); ישן = נגזר מ-send_status.
create or replace function public._payroll_report_delivery_state(p_report public.salary_reports)
returns text
language sql
stable
security definer
set search_path to ''
as $$
  select case
    when p_report.operation_id is null then
      case p_report.send_status when 'sent' then 'sent' when 'failed' then 'failed' else 'unknown' end
    else coalesce(
      (select public._payroll_attempt_effective_state(m)
         from public.payroll_mail_attempts m
        where m.kind = 'accountant' and m.report_id = p_report.report_id
        order by m.attempt_id desc limit 1),
      p_report.delivery_state)
  end;
$$;


-- -----------------------------------------------------------------------------
-- payroll_report_list — כל הדוחות, החודש החדש ראשון. כספים edit או view.
-- -----------------------------------------------------------------------------
create or replace function public.payroll_report_list()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  return jsonb_build_object('ok', true, 'reports', coalesce((
    select jsonb_agg(jsonb_build_object(
             'report_id', sr.report_id,
             'period', sr.period,
             'report_kind', sr.report_kind,
             'original_report_id', sr.original_report_id,
             'supplement_seq', sr.supplement_seq,
             'total_amount', sr.total_amount,
             'line_count', (select count(*) from public.salary_report_lines l where l.report_id = sr.report_id),
             'issued_at', coalesce(sr.issued_at, sr.created_at),
             'send_status', sr.send_status,
             'delivery_state', public._payroll_report_delivery_state(sr),
             'legacy', sr.operation_id is null,
             'artifact_available', sr.report_file_url is not null and exists (
                 select 1 from storage.objects o
                  where o.bucket_id = 'finance' and o.name = sr.report_file_url),
             'artifact_filename', coalesce(sr.artifact_filename,
                 regexp_replace(split_part(sr.report_file_url, '/', -1), '^\d+_', '')),
             'last_attempt', case
               when sr.operation_id is not null then (
                 select jsonb_build_object('state', public._payroll_attempt_effective_state(m),
                                           'intended_recipient', m.intended_recipient,
                                           'delivered_recipient', m.delivered_recipient,
                                           'completed_at', m.completed_at)
                   from public.payroll_mail_attempts m
                  where m.kind = 'accountant' and m.report_id = sr.report_id
                  order by m.attempt_id desc limit 1)
               else (
                 select jsonb_build_object('state', e.status,
                                           'intended_recipient', coalesce(e.intended_recipient, e.recipient),
                                           'delivered_recipient', e.recipient,
                                           'completed_at', e.created_at)
                   from public.email_log e
                  where e.entity_type = 'salary_report' and e.entity_id = sr.report_id
                  order by e.created_at desc, e.email_log_id desc limit 1)
             end,
             'open_post_issue_cases', (
               select count(*) from public.payroll_review_cases pc
                where pc.report_id = sr.report_id and pc.phase = 'post_issue' and pc.status = 'open'))
           order by sr.period desc, sr.report_kind, sr.supplement_seq nulls first, sr.report_id desc)
      from public.salary_reports sr), '[]'::jsonb));
end;
$$;


-- -----------------------------------------------------------------------------
-- payroll_report_detail — שורות חתומות, ניסיונות, קובץ, ביקורת, השלמות ופניות אחרי
-- ההפקה. לעולם לא פרטי בנק עדכניים.
-- -----------------------------------------------------------------------------
create or replace function public.payroll_report_detail(p_report_id integer)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_r public.salary_reports;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  select * into v_r from public.salary_reports where report_id = p_report_id;
  if not found then
    perform public._payroll_raise('REPORT_NOT_FOUND', 'הדוח לא נמצא.',
                                  jsonb_build_object('report_id', p_report_id));
  end if;

  return jsonb_build_object(
    'ok', true,
    'report', jsonb_build_object(
      'report_id', v_r.report_id, 'period', v_r.period, 'report_kind', v_r.report_kind,
      'original_report_id', v_r.original_report_id, 'supplement_seq', v_r.supplement_seq,
      'total_amount', v_r.total_amount, 'issued_at', coalesce(v_r.issued_at, v_r.created_at),
      'issued_by', v_r.issued_by, 'send_status', v_r.send_status, 'sent_date', v_r.sent_date,
      'delivery_state', public._payroll_report_delivery_state(v_r),
      'legacy', v_r.operation_id is null, 'review_id', v_r.review_id),
    'lines', coalesce((
      select jsonb_agg(jsonb_build_object(
               'line_id', l.line_id, 'hostess_id', l.hostess_id, 'hostess_name', l.hostess_name,
               'id_number', l.id_number, 'source_project_id', l.source_project_id,
               'assignment_number', l.assignment_number, 'event_date', l.event_date,
               'event_name', p.event_name, 'line_basis', l.line_basis, 'hours', l.hours,
               'rate', l.rate, 'bonus', l.bonus, 'travel', l.travel, 'line_total', l.line_total)
             order by l.hostess_name, l.event_date, l.source_project_id, l.line_id)
        from public.salary_report_lines l
        left join public.projects p on p.project_id = l.source_project_id
       where l.report_id = v_r.report_id), '[]'::jsonb),
    'attempts', coalesce((
      select jsonb_agg(jsonb_build_object(
               'attempt_id', m.attempt_id, 'state', public._payroll_attempt_effective_state(m),
               'retry_reason', m.retry_reason, 'intended_recipient', m.intended_recipient,
               'delivered_recipient', m.delivered_recipient, 'redirected', m.redirected,
               'created_at', m.created_at, 'created_by', m.created_by,
               'completed_at', m.completed_at, 'error_code', m.error_code)
             order by m.attempt_id desc)
        from public.payroll_mail_attempts m
       where m.kind = 'accountant' and m.report_id = v_r.report_id), '[]'::jsonb),
    'artifact', jsonb_build_object(
      'key', v_r.report_file_url,
      'filename', coalesce(v_r.artifact_filename,
                           regexp_replace(split_part(v_r.report_file_url, '/', -1), '^\d+_', '')),
      'sha256', v_r.artifact_sha256,
      'size', v_r.artifact_size,
      'reference_missing', v_r.report_file_url is null),
    'review', (
      select jsonb_build_object('review_id', rv.review_id, 'counts', jsonb_build_object(
               'hostesses', count(rc.recipient_id),
               'hostess_approved', count(*) filter (where rc.state = 'hostess_approved'),
               'manager_approved', count(*) filter (where rc.state = 'manager_approved_no_response'),
               'manager_resolved', count(*) filter (where rc.state = 'manager_resolved')))
        from public.payroll_reviews rv
        left join public.payroll_review_recipients rc on rc.review_id = rv.review_id and rc.is_current
       where rv.review_id = v_r.review_id
       group by rv.review_id),
    'supplements', coalesce((
      select jsonb_agg(jsonb_build_object('report_id', s.report_id, 'supplement_seq', s.supplement_seq,
                                          'total_amount', s.total_amount,
                                          'issued_at', coalesce(s.issued_at, s.created_at))
             order by s.supplement_seq)
        from public.salary_reports s where s.original_report_id = v_r.report_id), '[]'::jsonb),
    'original', (
      select jsonb_build_object('report_id', o.report_id, 'period', o.period)
        from public.salary_reports o where o.report_id = v_r.original_report_id),
    'post_issue_cases', coalesce((
      select jsonb_agg(jsonb_build_object(
               'case_id', c.case_id, 'hostess_name', rc.hostess_name, 'category', c.category,
               'description', c.description, 'suggested_value', c.suggested_value,
               'status', c.status, 'created_at', c.created_at,
               'resolution_reason', c.resolution_reason)
             order by c.created_at, c.case_id)
        from public.payroll_review_cases c
        left join public.payroll_review_recipients rc on rc.recipient_id = c.recipient_id
       where c.report_id = v_r.report_id and c.phase = 'post_issue'), '[]'::jsonb)
  );
end;
$$;


-- כתובת המסירה בפועל לפי השומר — לתצוגה ("יישלח אל …").
create or replace function public.payroll_delivery_address(p_intended text)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  perform public.assert_module_permission('כספים', array['edit']);
  return public._payroll_guard_mirror(p_intended);
end;
$$;


-- -----------------------------------------------------------------------------
-- הרשאות: פנימיות = אף תפקיד לקוח; auth = authenticated (השער בגוף הפונקציה).
-- -----------------------------------------------------------------------------
revoke execute on function public.payroll_collect(date, text, integer) from public, anon, authenticated;
revoke execute on function public._payroll_accountant_config() from public, anon, authenticated;
revoke execute on function public._payroll_guard_mirror(text) from public, anon, authenticated;
revoke execute on function public._payroll_identity_check(date, text, integer) from public, anon, authenticated;
revoke execute on function public._payroll_version_of(public.payroll_line[], date, text, integer) from public, anon, authenticated;
revoke execute on function public._payroll_preview_version(date, text, integer) from public, anon, authenticated;
revoke execute on function public.payroll_pending_closure(date) from public, anon, authenticated;
revoke execute on function public._payroll_attempt_effective_state(public.payroll_mail_attempts) from public, anon, authenticated;
revoke execute on function public._payroll_report_delivery_state(public.salary_reports) from public, anon, authenticated;

revoke execute on function public.payroll_preview(date, text, integer) from public, anon, authenticated;
revoke execute on function public.payroll_report_list() from public, anon, authenticated;
revoke execute on function public.payroll_report_detail(integer) from public, anon, authenticated;
revoke execute on function public.payroll_delivery_address(text) from public, anon, authenticated;
grant execute on function public.payroll_preview(date, text, integer) to authenticated;
grant execute on function public.payroll_report_list() to authenticated;
grant execute on function public.payroll_report_detail(integer) to authenticated;
grant execute on function public.payroll_delivery_address(text) to authenticated;
