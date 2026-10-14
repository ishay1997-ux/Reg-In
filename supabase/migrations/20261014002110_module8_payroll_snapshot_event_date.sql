-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 15b (A) — תאריך המשמרת בצילום ההפקה
-- =============================================================================
-- why: תיקון F12 מוסיף לקובץ לרו"ח עמודת תאריך משמרת, ופונקציית השרת (C) עוצרת הפקה
-- כששורה בלי תאריך. עד עכשיו payroll_operation_snapshot החזיר את צורת הכותב הישן, בלי
-- event_date. כאן הוא מתווסף לכל שורה (תאריך ISO, YYYY-MM-DD), יחד עם assignment_number —
-- אותם שני שדות ש-commit כבר שומר בשורה החתומה, כך שהקובץ והשורה החתומה מתארים אותה משמרת.
--
-- 🔑 fix-forward ולא עריכה של מיגרציה 15: קובץ שקומט הוא היסטוריה (append-only), וענפי B ו-C
--    כבר מיזגו אותו. הגוף כאן = הגוף של מיגרציה 15 + שני השדות, בלי שינוי אחר.
-- 🔑 expand בלבד: שדות חדשים ב-JSON; קורא שלא מכיר אותם מתעלם מהם. create or replace שומר
--    את ההרשאות (service_role בלבד).
-- 🔑 התצוגה המקדימה (payroll_preview) ופרטי הדוח (payroll_report_detail) כבר מחזירים event_date
--    בכל שורה.
-- =============================================================================

create or replace function public.payroll_operation_snapshot(p_operation_id uuid, p_actor_email text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_op     public.payroll_operations;
  v_id     jsonb;
  v_rows   public.payroll_line[];
  v_detail text;
  v_msg    text;
  v_code   text;
begin
  perform public._payroll_actor_assert(p_actor_email, 'כספים', array['edit']);

  select * into v_op from public.payroll_operations where operation_id = p_operation_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'OPERATION_NOT_FOUND', 'message', 'פעולת ההפקה לא נמצאה.',
                              'operation_id', p_operation_id);
  end if;
  if v_op.state <> 'preparing' then
    return jsonb_build_object('ok', false, 'code', 'OPERATION_STATE', 'message', 'פעולת ההפקה אינה בשלב ההכנה.',
                              'operation_id', p_operation_id, 'state', v_op.state);
  end if;

  update public.payroll_operations set prepare_attempt = prepare_attempt + 1
   where operation_id = p_operation_id returning * into v_op;

  begin
    v_id := public._payroll_identity_check(v_op.period, v_op.report_kind, v_op.original_report_id);
  exception when others then
    get stacked diagnostics v_detail = pg_exception_detail, v_msg = message_text;
    if v_detail not like 'PAYROLL:%' then
      raise;
    end if;
    v_code := substr(v_detail, 9);
    perform public._payroll_operation_mark_failed(p_operation_id, v_code, v_msg);
    return jsonb_build_object('ok', false, 'code', v_code, 'message', v_msg, 'operation_id', p_operation_id);
  end;

  v_rows := array(select c from public.payroll_collect(v_op.period, v_op.report_kind, v_op.original_report_id) c);

  if public._payroll_version_of(v_rows, v_op.period, v_op.report_kind, v_op.original_report_id)
     <> v_op.expected_version then
    perform public._payroll_operation_mark_failed(p_operation_id, 'PREVIEW_CHANGED',
      'הנתונים השתנו מאז שהטיוטה אושרה.');
    return jsonb_build_object('ok', false, 'code', 'PREVIEW_CHANGED',
                              'message', 'הנתונים השתנו מאז שהטיוטה אושרה. רעננו את הטיוטה ובדקו אותה שוב.',
                              'operation_id', p_operation_id);
  end if;
  if exists (select 1 from unnest(v_rows) r where cardinality(r.defects) > 0) then
    perform public._payroll_operation_mark_failed(p_operation_id, 'BLOCKERS_PRESENT', null);
    return jsonb_build_object('ok', false, 'code', 'BLOCKERS_PRESENT',
                              'message', 'בטיוטה יש שורות שחוסמות הפקה.', 'operation_id', p_operation_id);
  end if;

  update public.payroll_operations
     set reserved_report_id = coalesce(reserved_report_id,
           nextval(pg_get_serial_sequence('public.salary_reports', 'report_id'))::integer),
         reserved_supplement_seq = case when report_kind = 'supplement'
           then coalesce(reserved_supplement_seq, (v_id ->> 'next_supplement_seq')::integer) end,
         generated_at = coalesce(generated_at, now())
   where operation_id = p_operation_id
  returning * into v_op;

  return jsonb_build_object(
    'ok', true,
    'operation_id', v_op.operation_id,
    'report_id', v_op.reserved_report_id,
    'period', v_op.period,
    'kind', v_op.report_kind,
    'original_report_id', v_op.original_report_id,
    'supplement_seq', v_op.reserved_supplement_seq,
    'generated_at', v_op.generated_at,
    'prepare_attempt', v_op.prepare_attempt,
    'artifact_key_prefix', format('payroll/%s/%s/', to_char(v_op.period, 'YYYY-MM'), v_op.operation_id),
    'total_amount', (select coalesce(sum(r.line_total), 0)::numeric(12,2) from unnest(v_rows) r),
    'line_count', coalesce(cardinality(v_rows), 0),
    'lines', coalesce((
      select jsonb_agg(jsonb_build_object(
               'hostess_id', r.hostess_id,
               'hostess_name', r.hostess_name,
               'id_number', r.id_number,
               'source_project_id', r.project_id,
               'line_basis', r.line_basis,
               'hours', r.hours::numeric(12,2),
               'rate', r.rate::numeric(12,2),
               'bonus', nullif(r.bonus, 0)::numeric(12,2),
               'travel', nullif(r.travel, 0)::numeric(12,2),
               'line_total', r.line_total::numeric(12,2),
               'bank_name', b.bank_name,
               'bank_branch', b.bank_branch,
               'bank_account', b.bank_account,
               'show_in_file', r.line_total <> 0,
               'event_date', r.event_date,
               'assignment_number', r.assignment_number)
             order by r.hostess_name, r.event_date, r.project_id, r.assignment_number, r.line_basis)
        from unnest(v_rows) r
        left join public.hostess_bank_details b on b.hostess_id = r.hostess_id), '[]'::jsonb));
end;
$$;

