-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 15d (A) — כתובת רו"ח עדכנית ובסיס שורה בפנייה
-- =============================================================================
-- why: שני פריטים מבדיקת ההתאמה (הסגן, 14/10 08:33). fix-forward — קבצים שקומטו לא נערכים.
--   1. payroll_report_detail ו-payroll_operation_status מחזירים accountant_recipient_current —
--      הערך הנוכחי של מייל_משרד_רואי_חשבון (דרך _payroll_accountant_config, המקום היחיד, F9).
--      retry_reserve דורש p_confirmed_recipient = הערך הנוכחי; בלי השדה הזה, אחרי שינוי כתובת
--      המסך שלח את הכתובת הישנה, קיבל STALE_VERSION, ורענון לא עזר.
--   2. payroll_review_case_detail.current_rows[] מחזיר line_basis, כדי שטופס התיקון יחסום שורת
--      פיצוי מראש. 🔴 הפונקציה של B (מיגרציה 11); B סיים, והסגן הורה ל-A לעשות זאת כאן.
--      הגוף = הגוף העדכני מענף ishay/payroll-b (קומיט c24a5bf2, 20261014001100 שורות 1198–1257)
--      + השדה line_basis בלבד.
-- 🔑 expand בלבד: אותן חתימות, אותן הרשאות (create or replace שומר ACL), שדות JSON חדשים.
-- 🔑 תלוי במיגרציה 11 של B (טבלאות הפנייה ו-payroll_source_corrections) — מוחל אחריה.
-- =============================================================================

create or replace function public.payroll_operation_status(p_operation_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_op      public.payroll_operations;
  v_attempt public.payroll_mail_attempts;
  v_state   text;
  v_next    text;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  select * into v_op from public.payroll_operations where operation_id = p_operation_id;
  if not found then
    perform public._payroll_raise('OPERATION_NOT_FOUND', 'פעולת ההפקה לא נמצאה.');
  end if;

  if v_op.report_id is not null then
    select * into v_attempt from public.payroll_mail_attempts m
     where m.kind = 'accountant' and m.report_id = v_op.report_id
     order by m.attempt_id desc limit 1;
    if found then
      v_state := public._payroll_attempt_effective_state(v_attempt);
    end if;
  end if;

  v_next := case
    when v_op.state = 'preparing' and v_op.updated_at < now() - interval '120 seconds' then 'resume'
    when v_op.state = 'preparing' then 'wait'
    when v_op.state = 'prepared' then 'resume'
    when v_op.state = 'committed' then
      case v_state
        when 'queued' then 'resume'
        when 'sending' then 'wait'
        when 'unknown' then 'check_status'
        when 'failed' then 'retry_send'
        else 'none'
      end
    else 'none'
  end;

  return jsonb_build_object(
    'ok', true,
    'operation_id', v_op.operation_id,
    'state', v_op.state,
    'failure_code', v_op.failure_code,
    'review_id', v_op.review_id,
    'period', v_op.period,
    'kind', v_op.report_kind,
    'original_report_id', v_op.original_report_id,
    'report_id', v_op.report_id,
    'updated_at', v_op.updated_at,
    'accountant_attempt', case when v_state is null then null else jsonb_build_object(
      'attempt_id', v_attempt.attempt_id, 'state', v_state,
      'intended_recipient', v_attempt.intended_recipient,
      'delivered_recipient', v_attempt.delivered_recipient,
      'completed_at', v_attempt.completed_at) end,
    'next_action', v_next,
    'accountant_recipient_current', public._payroll_accountant_config() ->> 'recipient');
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
    'accountant_recipient_current', public._payroll_accountant_config() ->> 'recipient',
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

create or replace function public.payroll_review_case_detail(p_case_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  c public.payroll_review_cases;
  r public.payroll_review_recipients;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  select * into c from public.payroll_review_cases where case_id = p_case_id;
  if c.case_id is null then
    perform public._payroll_raise('CASE_NOT_FOUND', 'הפנייה לא נמצאה.', null);
  end if;
  select * into r from public.payroll_review_recipients where recipient_id = c.recipient_id;

  return jsonb_build_object(
    'ok', true,
    'case', jsonb_build_object(
      'case_id', c.case_id, 'review_id', c.review_id, 'recipient_id', c.recipient_id,
      'hostess_id', c.hostess_id, 'hostess_name', r.hostess_name, 'phase', c.phase, 'report_id', c.report_id,
      'category', c.category, 'affected_rows', c.affected_rows, 'missing_shift', c.missing_shift,
      'description', c.description, 'suggested_value', c.suggested_value, 'status', c.status,
      'revision', c.revision, 'resolution_reason', c.resolution_reason, 'resolved_by', c.resolved_by,
      'resolved_at', c.resolved_at, 'created_at', c.created_at),
    -- מה שהדיילת ראתה כשפנתה: השורות מתוך הסיכום שנשלח לה.
    'snapshot_rows', coalesce((
      select jsonb_agg(e order by ord)
        from jsonb_array_elements(r.rows) with ordinality x(e, ord)
       where exists (select 1 from jsonb_array_elements(c.affected_rows) k
                      where k ->> 'key' = e ->> 'key')), '[]'::jsonb),
    -- המקור היום, לכל שיבוץ שבפנייה.
    'current_rows', coalesce((
      select jsonb_agg(jsonb_build_object(
               'project_id', s.project_id, 'assignment_number', s.assignment_number,
               'assignment_status', s.assignment_status, 'attendance_status', s.attendance_status,
               'actual_hours', s.actual_hours, 'personal_bonus', s.personal_bonus,
               'hourly_rate_snapshot', s.hourly_rate_snapshot,
               'project_actual_hours', p.actual_hours, 'project_status', p.project_status,
               'event_name', p.event_name, 'salary_report_id', s.salary_report_id,
               -- אותו כלל חברות כמו payroll_collect: שיבוץ שאושר סופית = 'actual'; שוחרר מאישור
               -- סופי באירוע שבוטל = פיצוי. אחר (לא נכנס לדוח) = null.
               'line_basis', case
                 when s.assignment_status = 'finally_approved' then 'actual'
                 when s.released_from_status = 'finally_approved' and p.project_status = 'cancelled'
                   then 'cancellation_compensation'
               end)
             order by s.event_date, s.project_id, s.assignment_number)
        from public.assignments s
        join public.projects p on p.project_id = s.project_id
       where s.hostess_id = c.hostess_id
         and exists (select 1 from jsonb_array_elements(c.affected_rows) k
                      where (k ->> 'project_id')::int = s.project_id
                        and (k ->> 'assignment_number')::int = s.assignment_number)), '[]'::jsonb),
    'corrections', coalesce((
      select jsonb_agg(jsonb_build_object(
               'correction_id', x.correction_id, 'project_id', x.project_id,
               'assignment_number', x.assignment_number, 'field', x.field,
               'before_value', x.before_value, 'after_value', x.after_value, 'reason', x.reason,
               'actor_email', x.actor_email, 'actor_authority', x.actor_authority, 'created_at', x.created_at)
             order by x.created_at)
        from public.payroll_source_corrections x where x.case_id = c.case_id), '[]'::jsonb));
end;
$$;

-- ACL כמו אצל B (מיגרציה 11): authenticated בלבד, השער בגוף. נכתב במפורש כדי שגם החלה בסדר
-- אחר לא תשאיר את ברירת המחדל של Supabase (EXECUTE ל-anon).
revoke execute on function public.payroll_review_case_detail(bigint) from public, anon, authenticated;
grant execute on function public.payroll_review_case_detail(bigint) to authenticated;
