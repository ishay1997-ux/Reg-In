-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 15c (A) — תיקוני בודק 2
-- =============================================================================
-- why: חמישה תיקונים מהבודק השני (הסגן, 14/10 04:5X–05:0X). fix-forward — קבצים שקומטו לא נערכים.
--   1. שליחה חוזרת לרו"ח לא נתקעת: commit שנקרא שוב מחזיר את הניסיון **החדש ביותר** של הדוח
--      (לא את הראשון שכבר הסתיים); retry_reserve על ניסיון שעוד בתור מחזיר אותו (אידמפוטנטי).
--      payroll_operation_status כבר קורא את הניסיון החדש ביותר (next_action='resume' על queued).
--   2. payroll_report_detail מחזיר line_count ו-file_line_count (שחזור אוגוסט ב-D).
--   3. deadlock_detected ב-commit וב-retry_reserve ⇒ {ok:false, code:'PAYROLL_BUSY', retryable:true}
--      במקום שגיאה גולמית.
--   4. payroll_report_detail: post_issue_cases (טקסט חופשי של הדיילות) רק לכספים edit; ל-view null.
-- 🔑 expand בלבד: אותן חתימות, אותן הרשאות (create or replace שומר ACL), שדות JSON חדשים.
-- =============================================================================

create or replace function public.payroll_commit(p_operation_id uuid, p_actor_email text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v jsonb;
begin
  perform set_config('lock_timeout', '5s', true);
  begin
    v := public._payroll_commit_locked(p_operation_id, p_actor_email);
  exception when lock_not_available or deadlock_detected then
    return jsonb_build_object('ok', false, 'code', 'PAYROLL_BUSY',
                              'message', 'הפקה אחרת של דוח שכר רצה כרגע. נסו שוב בעוד דקה.',
                              'retryable', true, 'operation_id', p_operation_id);
  end;
  -- קריאה חוזרת לפעולה שכבר נחתמה: הניסיון הרלוונטי הוא החדש ביותר של הדוח, כדי ש-resume
  -- ישלח את מה שבאמת בתור ולא ייתקע על הניסיון הראשון שכבר הסתיים.
  if coalesce((v ->> 'existing')::boolean, false) and (v ->> 'report_id') is not null then
    v := v || jsonb_build_object('attempt_id', (
      select m.attempt_id from public.payroll_mail_attempts m
       where m.kind = 'accountant' and m.report_id = (v ->> 'report_id')::integer
       order by m.attempt_id desc limit 1));
  end if;
  return v;
end;
$$;

create or replace function public.payroll_report_detail(p_report_id integer)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_r    public.salary_reports;
  v_edit boolean;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);
  -- פניות הדיילות (טקסט חופשי) — רק לכספים edit; ל-view השדה חוזר null.
  begin
    perform public.assert_module_permission('כספים', array['edit']);
    v_edit := true;
  exception when insufficient_privilege then
    v_edit := false;
  end;

  select * into v_r from public.salary_reports where report_id = p_report_id;
  if not found then
    perform public._payroll_raise('REPORT_NOT_FOUND', 'הדוח לא נמצא.',
                                  jsonb_build_object('report_id', p_report_id));
  end if;

  return jsonb_build_object(
    'ok', true,
    'line_count', (select count(*) from public.salary_report_lines l where l.report_id = v_r.report_id),
    'file_line_count', (select count(*) from public.salary_report_lines l
                         where l.report_id = v_r.report_id and l.line_total <> 0),
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
    'post_issue_cases', case when not v_edit then null else coalesce((
      select jsonb_agg(jsonb_build_object(
               'case_id', c.case_id, 'hostess_name', rc.hostess_name, 'category', c.category,
               'description', c.description, 'suggested_value', c.suggested_value,
               'status', c.status, 'created_at', c.created_at,
               'resolution_reason', c.resolution_reason)
             order by c.created_at, c.case_id)
        from public.payroll_review_cases c
        left join public.payroll_review_recipients rc on rc.recipient_id = c.recipient_id
       where c.report_id = v_r.report_id and c.phase = 'post_issue'), '[]'::jsonb) end
  );
end;
$$;


create or replace function public.payroll_accountant_retry_reserve(
  p_report_id integer, p_prior_attempt_id bigint, p_confirmed_recipient text,
  p_acknowledge_unknown boolean default false)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_r       public.salary_reports;
  v_prior   public.payroll_mail_attempts;
  v_eff     text;
  v_reason  text;
  v_acc     jsonb;
  v_attempt bigint;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  begin

  select * into v_r from public.salary_reports where report_id = p_report_id for update;
  if not found then
    perform public._payroll_raise('REPORT_NOT_FOUND', 'הדוח לא נמצא.');
  end if;
  if v_r.operation_id is null then
    perform public._payroll_raise('LEGACY_REPORT_MISMATCH',
      'הדוח הזה הופק בתהליך הקודם — שליחה חוזרת שלו נעשית מהחלון הקודם.');
  end if;

  select * into v_prior from public.payroll_mail_attempts m
   where m.kind = 'accountant' and m.report_id = p_report_id
   order by m.attempt_id desc limit 1
   for update;
  -- אידמפוטנטי: לחיצה חוזרת (אותו prior, או ה-id שכבר הוחזר) כשהניסיון החדש ביותר עוד
  -- בתור — מחזירים אותו, לא NOT_RETRYABLE ולא STALE_VERSION.
  if found and v_prior.state = 'queued'
     and (v_prior.attempt_id = p_prior_attempt_id or v_prior.prior_attempt_id = p_prior_attempt_id) then
    return jsonb_build_object('ok', true, 'existing', true, 'attempt_id', v_prior.attempt_id,
                              'retry_reason', v_prior.retry_reason);
  end if;
  if not found or v_prior.attempt_id is distinct from p_prior_attempt_id then
    perform public._payroll_raise('STALE_VERSION', 'מצב השליחה השתנה. רעננו את העמוד.',
                                  jsonb_build_object('latest_attempt_id', v_prior.attempt_id));
  end if;

  v_eff := public._payroll_attempt_effective_state(v_prior);
  if v_eff = 'failed' then
    v_reason := 'known_failure_retry';
  elsif v_eff = 'unknown' then
    if not coalesce(p_acknowledge_unknown, false) then
      perform public._payroll_raise('DELIVERY_UNKNOWN',
        'לא ידוע אם המייל הקודם נשלח. בדקו בתיבת "נשלחו" ואשרו במפורש לפני שליחה חוזרת.');
    end if;
    v_reason := 'unknown_reviewed_resend';
    -- תיקון F1: "לא ידוע" נשמר, ורק אז האינדקס משחרר מקום לניסיון חדש.
    perform public._payroll_attempt_persist_unknown(v_prior.attempt_id);
  else
    perform public._payroll_raise('NOT_RETRYABLE', 'אין צורך בשליחה חוזרת במצב הנוכחי.',
                                  jsonb_build_object('state', v_eff));
  end if;

  v_acc := public._payroll_accountant_config();
  if nullif(btrim(coalesce(p_confirmed_recipient, '')), '') is null
     or lower(btrim(p_confirmed_recipient)) is distinct from lower(v_acc ->> 'recipient') then
    perform public._payroll_raise('STALE_VERSION', 'כתובת רו"ח השתנתה. רעננו את העמוד ובדקו אותה.',
                                  jsonb_build_object('recipient', v_acc ->> 'recipient'));
  end if;

  v_attempt := public._payroll_attempt_reserve('accountant', p_report_id, null, v_r.operation_id,
                                               v_acc ->> 'recipient', v_acc ->> 'template_name', v_reason,
                                               v_prior.attempt_id, auth.email());
  update public.salary_reports set delivery_state = 'queued' where report_id = p_report_id;

  return jsonb_build_object('ok', true, 'attempt_id', v_attempt, 'retry_reason', v_reason);
  exception when deadlock_detected then
    return jsonb_build_object('ok', false, 'code', 'PAYROLL_BUSY',
                              'message', 'פעולה אחרת על הדוח רצה כרגע. נסו שוב בעוד דקה.', 'retryable', true);
  end;
end;
$$;

