-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 6 (A) — מחזור החיים של ניסיון שליחה
-- =============================================================================
-- why: פונקציית השרת שולחת מיילים, אבל המצב נשמר במסד. כל ניסיון עובר: בתור (reserve) →
-- נשלח כרגע (claim) → נשלח / נכשל / לא ידוע (complete). שלוש הבטחות:
--   * רק מי שתפס את הניסיון (queued → sending) שולח אותו — לחיצה כפולה או שני טאבים לא
--     שולחים פעמיים.
--   * תשובה מאוחרת לעולם לא דורסת מצב חדש יותר (STALE_ATTEMPT).
--   * "לא ידוע" נשמר כ"לא ידוע" (תיקון F1). שליחה חוזרת אחריו רק אחרי אזהרה מפורשת, דרך
--     פונקציות ה-retry (מיגרציה 15 ו-B), שמשתמשות ב-_payroll_attempt_persist_unknown.
--
-- 🔑 expand בלבד. claim ו-complete: service role בלבד (svc), עם מייל השחקן מ-getUser().
-- =============================================================================

create or replace function public._payroll_attempt_reserve(
  p_kind             text,
  p_report_id        integer,
  p_recipient_id     bigint,
  p_operation_id     uuid,
  p_intended         text,
  p_template_name    text,
  p_reason           text,
  p_prior_attempt_id bigint,
  p_actor            text)
returns bigint
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_id bigint;
begin
  if nullif(btrim(coalesce(p_intended, '')), '') is null then
    perform public._payroll_raise('RECIPIENT_INVALID', 'אין כתובת מייל לנמען.');
  end if;

  begin
    insert into public.payroll_mail_attempts
      (kind, report_id, recipient_id, operation_id, state, retry_reason, prior_attempt_id,
       intended_recipient, template_name, created_by)
    values
      (p_kind, p_report_id, p_recipient_id, p_operation_id, 'queued', coalesce(p_reason, 'initial'),
       p_prior_attempt_id, btrim(p_intended), p_template_name, p_actor)
    returning attempt_id into v_id;
  exception when unique_violation then
    perform public._payroll_raise('DELIVERY_ACTIVE',
      'כבר יש שליחה פעילה לנמען הזה. חכו לסיומה ובדקו את המצב.',
      jsonb_build_object('report_id', p_report_id, 'recipient_id', p_recipient_id));
  end;
  return v_id;
end;
$$;


-- תיקון F1: ניסיון שנשאר sending אחרי 120 שניות נשמר כ-unknown, עם הסיבה. רק אז האינדקס
-- החלקי משחרר מקום לניסיון חדש. מחזיר את המצב השמור אחרי הפעולה.
-- הקורא נועל את השורה (for update) לפני הקריאה.
create or replace function public._payroll_attempt_persist_unknown(p_attempt_id bigint)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_a public.payroll_mail_attempts;
begin
  select * into v_a from public.payroll_mail_attempts where attempt_id = p_attempt_id for update;
  if not found then
    perform public._payroll_raise('ATTEMPT_NOT_FOUND', 'ניסיון השליחה לא נמצא.');
  end if;
  if v_a.state = 'sending' and public._payroll_attempt_effective_state(v_a) = 'unknown' then
    update public.payroll_mail_attempts
       set state = 'unknown', error_code = 'LEASE_EXPIRED', completed_at = now()
     where attempt_id = p_attempt_id;

    if v_a.kind = 'accountant' and not exists (
         select 1 from public.payroll_mail_attempts n
          where n.kind = 'accountant' and n.report_id = v_a.report_id and n.attempt_id > v_a.attempt_id) then
      update public.salary_reports
         set delivery_state = 'unknown', send_status = 'pending'
       where report_id = v_a.report_id;
    end if;
    return 'unknown';
  end if;
  return v_a.state;
end;
$$;


-- -----------------------------------------------------------------------------
-- claim: queued → sending. מחזיר את כל מה שצריך כדי לרנדר את המייל (תיקון F7) — כך
-- שליחה ראשונה, תזכורת ושליחה חוזרת מרנדרות מאותו מקור.
-- -----------------------------------------------------------------------------
create or replace function public.payroll_attempt_claim(p_attempt_id bigint, p_actor_email text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_a      public.payroll_mail_attempts;
  v_cfg    public.payroll_config;
  v_report public.salary_reports;
  v_rec    record;
  v_seq    integer;
begin
  perform public._payroll_actor_assert(p_actor_email, 'כספים', array['edit']);

  select * into v_a from public.payroll_mail_attempts where attempt_id = p_attempt_id for update;
  if not found or v_a.state <> 'queued' then
    perform public._payroll_raise('NOT_CLAIMABLE', 'הניסיון כבר נלקח לשליחה או הסתיים.',
      jsonb_build_object('attempt_id', p_attempt_id, 'state', v_a.state));
  end if;

  if v_a.kind = 'personal_review' then
    v_cfg := public._payroll_config();
    if not v_cfg.review_mail_enabled then
      perform public._payroll_raise('ISSUE_DISABLED', 'שליחת הסיכומים לדיילות כבויה כרגע.');
    end if;
  end if;

  update public.payroll_mail_attempts
     set state = 'sending', sending_started_at = now()
   where attempt_id = p_attempt_id;

  if v_a.kind = 'accountant' then
    select * into v_report from public.salary_reports where report_id = v_a.report_id;
    return jsonb_build_object(
      'attempt_id', v_a.attempt_id,
      'kind', v_a.kind,
      'intended_recipient', v_a.intended_recipient,
      'report_id', v_a.report_id,
      'recipient_id', null,
      'template_name', v_a.template_name,
      'period', v_report.period,
      'report_kind', v_report.report_kind,
      'supplement_seq', v_report.supplement_seq,
      'artifact', case when v_report.report_file_url is null then null else jsonb_build_object(
                    'key', v_report.report_file_url,
                    'sha256', v_report.artifact_sha256,
                    'filename', coalesce(v_report.artifact_filename,
                                         regexp_replace(split_part(v_report.report_file_url, '/', -1), '^\d+_', '')),
                    'mime', v_report.artifact_mime,
                    'size', v_report.artifact_size) end);
  end if;

  select rc.hostess_name, rc.review_id, rv.response_deadline, rv.period, rv.report_kind,
         rv.original_report_id
    into v_rec
    from public.payroll_review_recipients rc
    join public.payroll_reviews rv on rv.review_id = rc.review_id
   where rc.recipient_id = v_a.recipient_id;

  if v_rec.report_kind = 'supplement' then
    select coalesce(max(sr.supplement_seq), 0) + 1 into v_seq
      from public.salary_reports sr where sr.original_report_id = v_rec.original_report_id;
  end if;

  return jsonb_build_object(
    'attempt_id', v_a.attempt_id,
    'kind', v_a.kind,
    'intended_recipient', v_a.intended_recipient,
    'report_id', null,
    'recipient_id', v_a.recipient_id,
    'template_name', v_a.template_name,
    'artifact', null,
    'hostess_name', v_rec.hostess_name,
    'response_deadline', v_rec.response_deadline,
    'period', v_rec.period,
    'report_kind', v_rec.report_kind,
    'supplement_seq', v_seq,
    'review_id', v_rec.review_id);
end;
$$;


-- -----------------------------------------------------------------------------
-- complete: sending → sent / failed / unknown. מכל מצב אחר — STALE_ATTEMPT בלי שינוי.
-- -----------------------------------------------------------------------------
create or replace function public.payroll_attempt_complete(
  p_attempt_id      bigint,
  p_actor_email     text,
  p_outcome         text,
  p_delivered       text,
  p_redirected      boolean,
  p_template_sha256 text,
  p_subject         text,
  p_http_status     integer,
  p_error_code      text,
  p_error_detail    text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_a      public.payroll_mail_attempts;
  v_log_id bigint;
begin
  perform public._payroll_actor_assert(p_actor_email, 'כספים', array['edit']);

  if p_outcome is null or p_outcome not in ('sent', 'failed', 'unknown') then
    perform public._payroll_raise('OUTCOME_INVALID', 'תוצאת שליחה לא מוכרת.');
  end if;

  select * into v_a from public.payroll_mail_attempts where attempt_id = p_attempt_id for update;
  if not found then
    perform public._payroll_raise('ATTEMPT_NOT_FOUND', 'ניסיון השליחה לא נמצא.');
  end if;
  if v_a.state <> 'sending' then
    return jsonb_build_object('ok', false, 'code', 'STALE_ATTEMPT',
                              'attempt_id', v_a.attempt_id, 'state', v_a.state);
  end if;

  insert into public.email_log
    (entity_type, entity_id, recipient, intended_recipient, template_name, subject, status,
     error_message, sent_by_email)
  values
    (case when v_a.kind = 'accountant' then 'salary_report' else 'payroll_review' end,
     coalesce(v_a.report_id::bigint, v_a.recipient_id),
     coalesce(nullif(btrim(p_delivered), ''), v_a.intended_recipient),
     v_a.intended_recipient,
     v_a.template_name,
     p_subject,
     p_outcome,
     case when p_error_code is null and p_error_detail is null then null
          else left(concat_ws(': ', p_error_code, p_error_detail), 500) end,
     btrim(p_actor_email))
  returning email_log_id into v_log_id;

  update public.payroll_mail_attempts
     set state = p_outcome,
         delivered_recipient = nullif(btrim(p_delivered), ''),
         redirected = p_redirected,
         template_sha256_used = p_template_sha256,
         subject = p_subject,
         artifact_sha256 = case when v_a.kind = 'accountant'
                                then (select sr.artifact_sha256 from public.salary_reports sr
                                       where sr.report_id = v_a.report_id) end,
         transport_http_status = p_http_status,
         error_code = p_error_code,
         error_detail = left(p_error_detail, 500),
         completed_at = now(),
         email_log_id = v_log_id
   where attempt_id = p_attempt_id;

  -- מטמון המצב בדוח — רק אם זה הניסיון האחרון לדוח, כך שתשובה מאוחרת לא דורסת חדשה.
  if v_a.kind = 'accountant' and not exists (
       select 1 from public.payroll_mail_attempts n
        where n.kind = 'accountant' and n.report_id = v_a.report_id and n.attempt_id > v_a.attempt_id) then
    update public.salary_reports
       set delivery_state = p_outcome,
           send_status = case p_outcome when 'sent' then 'sent' when 'failed' then 'failed' else 'pending' end,
           sent_date = case when p_outcome = 'sent'
                            then (now() at time zone 'Asia/Jerusalem')::date else sent_date end
     where report_id = v_a.report_id;
  end if;

  return jsonb_build_object('ok', true, 'attempt_id', v_a.attempt_id, 'state', p_outcome,
                            'email_log_id', v_log_id);
end;
$$;


revoke execute on function public._payroll_attempt_reserve(text, integer, bigint, uuid, text, text, text, bigint, text)
  from public, anon, authenticated;
revoke execute on function public._payroll_attempt_persist_unknown(bigint) from public, anon, authenticated;
revoke execute on function public.payroll_attempt_claim(bigint, text) from public, anon, authenticated;
revoke execute on function public.payroll_attempt_complete(bigint, text, text, text, boolean, text, text, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.payroll_attempt_claim(bigint, text) to service_role;
grant execute on function public.payroll_attempt_complete(bigint, text, text, text, boolean, text, text, integer, text, text)
  to service_role;
