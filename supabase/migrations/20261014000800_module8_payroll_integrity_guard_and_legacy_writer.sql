-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 8 (A) — שומר השיוך + הכותב הישן המוגן
-- =============================================================================
-- why: משמרת ששויכה לדוח שכר כבר שולמה. מעכשיו רק כותב שכר מורשה (בתוך הטרנזקציה
-- שלו, D3) יכול לשייך, לבטל שיוך, למחוק שורה משויכת, או לשנות בה את מה שקבע את הכסף
-- (שעות, תעריף, בונוס, נסיעות, הדיילת, הפרויקט, מספר השיבוץ). event_date, הסטטוסים
-- והנוכחות לא מוקפאים: טריגר סנכרון התאריכים כותב event_date לכל שורות הפרויקט, וזרמי
-- מודולים 4/6 משנים סטטוס בלי לגעת בכסף.
--
-- 🔴 באותה מיגרציה, ובכוונה: הכותב הישן (generate_salary_report) והסגירה הישנה
--    (finalize_salary_report) נכתבים מחדש. הטריגר לבדו היה שובר את הדיאלוג הפרוס — הכותב
--    החי לא מסמן את עצמו ככותב. הגופים נמשכו חיים ב-13.10.2026 (md5 d8d58ba0… ו-8af8f09f…).
--
-- 🔑 הכותב הישן שומר על החתימה ועל צורת ה-JSON המוחזרת בדיוק (חוזה D14), ומשתנה בחמישה:
--   (1) חודש בלבד, דרך payroll_collect (במקום "כל מה שעד סוף החודש" — ~4,000 משמרות
--       מחודשים קודמים היו נסחפות להפקת ספטמבר);
--   (2) רק אחרי סוף החודש (MONTH_NOT_ENDED);
--   (3) מסרב כשיש בדיקת דיילות פתוחה לאותו חודש (PERIOD_IN_REVIEW);
--   (4) נעילה גלובלית אחת, שיוך מותנה (salary_report_id is null), ומספר השורות שעודכנו
--       חייב להיות שווה למספר השורות שנכתבו — אחרת הכול מתבטל (CLAIM_MISMATCH);
--   (5) מתג כיבוי: legacy_writer='disabled' ⇒ LEGACY_DISABLED.
-- 🔑 ACL: create or replace שומר את ההרשאות החיות (authenticated, service_role; בלי anon).
-- =============================================================================

create or replace function public.assignments_payroll_guard()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if public._payroll_is_writer() then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    if new.salary_report_id is not null then
      perform public._payroll_raise('PAYROLL_CLAIM_IMMUTABLE',
        'אי אפשר ליצור שיבוץ שכבר משויך לדוח שכר.');
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.salary_report_id is not null then
      perform public._payroll_raise('PAYROLL_CLAIM_IMMUTABLE',
        'אי אפשר למחוק משמרת שכבר נכללה בדוח שכר.',
        jsonb_build_object('project_id', old.project_id, 'hostess_id', old.hostess_id,
                           'assignment_number', old.assignment_number));
    end if;
    return old;
  end if;

  -- UPDATE
  if new.salary_report_id is distinct from old.salary_report_id
     or (old.salary_report_id is not null and (
           new.actual_hours         is distinct from old.actual_hours
        or new.hourly_rate_snapshot is distinct from old.hourly_rate_snapshot
        or new.personal_bonus       is distinct from old.personal_bonus
        or new.travel_amount        is distinct from old.travel_amount
        or new.hostess_id           is distinct from old.hostess_id
        or new.project_id           is distinct from old.project_id
        or new.assignment_number    is distinct from old.assignment_number))
  then
    perform public._payroll_raise('PAYROLL_CLAIM_IMMUTABLE',
      'המשמרת כבר נכללה בדוח שכר — השעות, התעריף, הבונוס והנסיעות שלה אינם ניתנים לשינוי.',
      jsonb_build_object('project_id', old.project_id, 'hostess_id', old.hostess_id,
                         'assignment_number', old.assignment_number));
  end if;
  return new;
end;
$$;

revoke execute on function public.assignments_payroll_guard() from public, anon, authenticated;

create trigger assignments_payroll_guard
  before insert or update or delete on public.assignments
  for each row execute function public.assignments_payroll_guard();


-- -----------------------------------------------------------------------------
-- הכותב הישן — אותה חתימה, אותה צורת JSON; האיסוף עובר ל-payroll_collect.
-- -----------------------------------------------------------------------------
create or replace function public.generate_salary_report(p_period date)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_cfg       public.payroll_config;
  v_period    date;
  v_rows      public.payroll_line[];
  v_defect    text;
  v_report_id integer;
  v_claimed   integer;
  v_total     numeric := 0;
  v_lines     jsonb;
begin
  perform public.assert_module_permission('כספים', array['edit']);

  if p_period is null then
    perform public._payroll_raise('PERIOD_INVALID', 'יש לבחור חודש להפקת הדוח.');
  end if;

  v_cfg := public._payroll_config();
  if v_cfg.legacy_writer = 'disabled' then
    perform public._payroll_raise('LEGACY_DISABLED',
      'הפקת דוח השכר בתהליך הקודם הופסקה. השתמשו בעמוד דוח השכר החדש.');
  end if;

  v_period := (public._payroll_identity_check(p_period, 'regular', null) ->> 'period')::date;
  if public._payroll_month_state(v_period) <> 'ended' then
    perform public._payroll_raise('MONTH_NOT_ENDED',
      'אפשר להפיק את דוח השכר רק אחרי שהחודש הסתיים.',
      jsonb_build_object('period', v_period));
  end if;

  -- נעילה גלובלית; ממתינים עד 5 שניות ואז "תפוס" במקום המתנה בלי סוף.
  perform set_config('lock_timeout', '5s', true);
  begin
    perform public._payroll_lock();
  exception when lock_not_available then
    perform public._payroll_raise('PAYROLL_BUSY',
      'הפקה אחרת של דוח שכר רצה כרגע. נסו שוב בעוד דקה.');
  end;

  -- הבדיקות חוזרות אחרי הנעילה: מה שנבדק לפניה יכול היה להשתנות בזמן ההמתנה.
  perform public._payroll_identity_check(v_period, 'regular', null);
  if exists (select 1 from public.payroll_reviews r
              where r.period = v_period and r.report_kind = 'regular'
                and r.status in ('open', 'issuing')) then
    perform public._payroll_raise('PERIOD_IN_REVIEW',
      'לחודש הזה פתוחה בדיקת דיילות בעמוד דוח השכר החדש. הפיקו אותו משם.',
      jsonb_build_object('period', v_period));
  end if;

  v_rows := array(select c from public.payroll_collect(v_period, 'regular', null) c);

  select d into v_defect
    from unnest(v_rows) r cross join lateral unnest(r.defects) d
   order by case d when 'COMP_HOURS_MISSING' then 0 else 1 end
   limit 1;
  if v_defect = 'COMP_HOURS_MISSING' then
    perform public._payroll_raise('COMP_HOURS_MISSING',
      'לא ניתן להפיק את הדוח — לפרויקט מבוטל אחד או יותר חסרות שעות סופיות לחישוב הפיצוי.');
  elsif v_defect is not null then
    perform public._payroll_raise(v_defect,
      'לא ניתן להפיק את הדוח — לדיילת אחת או יותר חסרים שם או מספר תעודת זהות.');
  end if;

  perform public._payroll_writer_begin();

  insert into public.salary_reports (period, send_status, report_kind)
  values (v_period, 'pending', 'regular')
  returning report_id into v_report_id;

  insert into public.salary_report_lines
    (report_id, hostess_id, hostess_name, id_number, source_project_id, line_basis,
     hours, rate, bonus, travel, line_total, assignment_number, event_date)
  select v_report_id, r.hostess_id, r.hostess_name, r.id_number, r.project_id, r.line_basis,
         r.hours, r.rate, nullif(r.bonus, 0), nullif(r.travel, 0), r.line_total,
         r.assignment_number, r.event_date
    from unnest(v_rows) r;

  update public.assignments a
     set salary_report_id = v_report_id,
         travel_amount = r.travel
    from unnest(v_rows) r
   where a.project_id = r.project_id
     and a.hostess_id = r.hostess_id
     and a.assignment_number = r.assignment_number
     and a.salary_report_id is null;
  get diagnostics v_claimed = row_count;

  if v_claimed <> coalesce(cardinality(v_rows), 0) then
    perform public._payroll_raise('CLAIM_MISMATCH',
      'הפקת הדוח בוטלה: חלק מהמשמרות שויכו בינתיים לדוח אחר. רעננו ונסו שוב.',
      jsonb_build_object('expected', cardinality(v_rows), 'claimed', v_claimed));
  end if;

  select coalesce(sum(l.line_total), 0) into v_total
    from public.salary_report_lines l where l.report_id = v_report_id;

  update public.salary_reports set total_amount = v_total where report_id = v_report_id;

  -- צורת ההחזרה הישנה, מילה במילה (כולל בנק ו-show_in_file) — salaryReport.js נשען עליה.
  select coalesce(jsonb_agg(x order by x->>'hostess_name'), '[]'::jsonb) into v_lines
    from (
      select jsonb_build_object(
               'hostess_id', l.hostess_id,
               'hostess_name', l.hostess_name,
               'id_number', l.id_number,
               'source_project_id', l.source_project_id,
               'line_basis', l.line_basis,
               'hours', l.hours,
               'rate', l.rate,
               'bonus', l.bonus,
               'travel', l.travel,
               'line_total', l.line_total,
               'bank_name', b.bank_name,
               'bank_branch', b.bank_branch,
               'bank_account', b.bank_account,
               'show_in_file', l.line_total <> 0
             ) as x
        from public.salary_report_lines l
        left join public.hostess_bank_details b on b.hostess_id = l.hostess_id
       where l.report_id = v_report_id
    ) s;

  return jsonb_build_object(
    'ok', true,
    'report_id', v_report_id,
    'period', v_period,
    'total_amount', v_total,
    'line_count', (select count(*) from public.salary_report_lines where report_id = v_report_id),
    'lines', v_lines
  );
end;
$function$;


-- -----------------------------------------------------------------------------
-- הסגירה הישנה — אותה חתימה וצורה. מעכשיו: רק לדוח ישן, רק מ-pending/failed, והקובץ
-- נכתב פעם אחת בלבד.
-- -----------------------------------------------------------------------------
create or replace function public.finalize_salary_report(p_report_id integer, p_file_url text, p_status text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_cfg public.payroll_config;
  v_r   public.salary_reports;
begin
  perform public.assert_module_permission('כספים', array['edit']);

  v_cfg := public._payroll_config();
  if v_cfg.legacy_writer = 'disabled' then
    perform public._payroll_raise('LEGACY_DISABLED',
      'שליחת דוח השכר בתהליך הקודם הופסקה. השתמשו בעמוד דוח השכר החדש.');
  end if;

  if p_status is null or p_status not in ('sent', 'failed') then
    raise exception 'סטטוס שליחה לא מוכר.' using errcode = 'P0001';
  end if;

  select * into v_r from public.salary_reports where report_id = p_report_id for update;
  if not found then
    raise exception 'דוח שכר % לא נמצא.', p_report_id using errcode = 'P0001';
  end if;

  if v_r.operation_id is not null then
    perform public._payroll_raise('LEGACY_REPORT_MISMATCH',
      'הדוח הזה הופק בעמוד דוח השכר החדש, ושם מנוהלת השליחה שלו.',
      jsonb_build_object('report_id', p_report_id));
  end if;

  if v_r.send_status not in ('pending', 'failed') then
    perform public._payroll_raise('STATUS_TRANSITION_INVALID',
      'הדוח כבר סומן כנשלח — אי אפשר לשנות את מצב השליחה שלו.',
      jsonb_build_object('report_id', p_report_id, 'send_status', v_r.send_status));
  end if;

  if p_file_url is not null and v_r.report_file_url is not null and p_file_url <> v_r.report_file_url then
    perform public._payroll_raise('ARTIFACT_IMMUTABLE',
      'לדוח כבר נשמר קובץ אחר — אי אפשר להחליף אותו.',
      jsonb_build_object('report_id', p_report_id));
  end if;

  update public.salary_reports
     set report_file_url = coalesce(report_file_url, p_file_url),
         send_status = p_status,
         sent_date = case when p_status = 'sent' then current_date else sent_date end
   where report_id = p_report_id;

  return jsonb_build_object('ok', true, 'report_id', p_report_id, 'send_status', p_status);
end;
$function$;
