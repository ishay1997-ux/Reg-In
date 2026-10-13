-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 15 (A) — ההפקה הסופית ושליחה חוזרת לרו"ח
-- =============================================================================
-- why: "אשר והפק" הוא הצעד הבלתי-הפיך של התהליך: השורות נחתמות, המשמרות משויכות, והקובץ
-- נשלח לרו"ח. הוא מפוצל לצעדים שכל אחד מהם שמור במסד, כך שקריסה בכל נקודה ניתנת להמשך
-- בלי הפקה כפולה ובלי קובץ שנדרס:
--   begin (הדפדפן, דרך פונקציית השרת) → snapshot (צילום הנתונים לבניית הקובץ) →
--   record_artifact (הקובץ הועלה) → commit (נעילה, בדיקה אחרונה, חתימה ושיוך) →
--   ניסיון שליחה לרו"ח (מיגרציה 6).
-- 🔑 commit מחשב מחדש את הגרסה **אחרי** שנעל את כל המקורות (תיקון F3), ומשווה לגרסה
--    שהמנהלת אישרה. כל שינוי — שעה, שם, בנק, פרמטר, משמרת שנוספה — ⇒ PREVIEW_CHANGED,
--    לעולם לא דוח עם ערכים שלא אושרו.
-- 🔑 אין קריאת רשת בתוך commit. snapshot ו-commit מחזירים {ok:false} במקום raise כשצריך
--    לשמור את הכישלון (raise היה מבטל גם את רישום הכישלון, D7).
-- 🔑 expand בלבד: פונקציות חדשות.
-- =============================================================================

-- מצב פעולה → כישלון, עם קוד ופירוט מקוצר.
create or replace function public._payroll_operation_mark_failed(p_operation_id uuid, p_code text, p_detail text)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  update public.payroll_operations
     set state = 'failed', failure_code = p_code, failure_detail = left(p_detail, 500)
   where operation_id = p_operation_id;
end;
$$;


-- -----------------------------------------------------------------------------
-- begin — הסדר הקבוע של תיקון F2.
-- -----------------------------------------------------------------------------
create or replace function public.payroll_operation_begin(
  p_operation_id       uuid,
  p_review_id          bigint,
  p_expected_version   text,
  p_period             date,
  p_kind               text,
  p_original_report_id integer)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_cfg    public.payroll_config;
  v_period date;
  v_review record;
  v_op     public.payroll_operations;
  v_ready  jsonb;
begin
  -- 1. שער והמתג
  perform public.assert_module_permission('כספים', array['edit']);
  v_cfg := public._payroll_config();
  if not v_cfg.final_issue_enabled then
    perform public._payroll_raise('ISSUE_DISABLED', 'ההפקה הסופית כבויה כרגע.');
  end if;
  if p_operation_id is null or nullif(btrim(coalesce(p_expected_version, '')), '') is null then
    perform public._payroll_raise('PERIOD_INVALID', 'חסרים פרטי ההפקה.');
  end if;

  -- 2. זהות · 3. סוף החודש
  v_period := (public._payroll_identity_check(p_period, p_kind, p_original_report_id) ->> 'period')::date;
  if public._payroll_month_state(v_period) <> 'ended' then
    perform public._payroll_raise('MONTH_NOT_ENDED', 'אפשר להפיק את דוח השכר רק אחרי שהחודש הסתיים.');
  end if;

  -- כותב שכר: נעילה גלובלית לפני כל נגיעה בפעולות (D2), באותו סדר כמו commit.
  perform public._payroll_lock();

  -- 4. הבדיקה קיימת, פתוחה, ושל אותה זהות
  select r.review_id, r.status, r.period, r.report_kind, r.original_report_id into v_review
    from public.payroll_reviews r where r.review_id = p_review_id;
  if not found or v_review.status <> 'open' or v_review.period <> v_period
     or v_review.report_kind <> p_kind
     or coalesce(v_review.original_report_id, 0) <> coalesce(p_original_report_id, 0) then
    perform public._payroll_raise('REVIEW_NOT_FOUND', 'בדיקת הדיילות לחודש הזה לא נמצאה או שכבר נסגרה.',
                                  jsonb_build_object('review_id', p_review_id));
  end if;

  -- 5. אותו מזהה: אותם פרמטרים ⇒ אותה פעולה; אחרים ⇒ IDEMPOTENCY_MISMATCH
  select * into v_op from public.payroll_operations where operation_id = p_operation_id;
  if found then
    if v_op.review_id = p_review_id and v_op.expected_version = p_expected_version
       and v_op.period = v_period and v_op.report_kind = p_kind
       and coalesce(v_op.original_report_id, 0) = coalesce(p_original_report_id, 0) then
      return jsonb_build_object('ok', true, 'existing', true, 'operation_id', v_op.operation_id,
                                'state', v_op.state);
    end if;
    perform public._payroll_raise('IDEMPOTENCY_MISMATCH', 'מזהה ההפקה כבר שימש להפקה אחרת.',
                                  jsonb_build_object('operation_id', p_operation_id));
  end if;

  -- 6. פעולה פעילה לאותה זהות: גרסה אחרת ⇒ מוחלפת; אותה גרסה ⇒ ממשיכים אותה
  select * into v_op
    from public.payroll_operations o
   where o.period = v_period and o.report_kind = p_kind
     and coalesce(o.original_report_id, 0) = coalesce(p_original_report_id, 0)
     and o.state in ('preparing', 'prepared')
   for update;
  if found then
    if v_op.expected_version = p_expected_version then
      return jsonb_build_object('ok', true, 'existing', true, 'operation_id', v_op.operation_id,
                                'state', v_op.state);
    end if;
    update public.payroll_operations
       set state = 'superseded', failure_code = 'PREVIEW_CHANGED'
     where operation_id = v_op.operation_id;
  end if;

  -- 7. בדיקת מוכנות מוקדמת, בלי הפעולה הזו
  v_ready := public._payroll_review_assert_ready_locked(p_review_id, p_expected_version, p_operation_id);
  if not coalesce((v_ready ->> 'ready')::boolean, false) then
    perform public._payroll_raise('REVIEW_NOT_READY', 'עדיין יש דברים שחוסמים את ההפקה.',
                                  jsonb_build_object('blockers', v_ready -> 'blockers'));
  end if;

  -- 8. יצירה
  insert into public.payroll_operations
    (operation_id, review_id, period, report_kind, original_report_id, expected_version, state, actor_email)
  values
    (p_operation_id, p_review_id, v_period, p_kind, p_original_report_id, p_expected_version, 'preparing',
     auth.email());

  return jsonb_build_object('ok', true, 'existing', false, 'operation_id', p_operation_id, 'state', 'preparing');
end;
$$;


-- -----------------------------------------------------------------------------
-- snapshot — צילום הנתונים לבניית הקובץ (צורת הכותב הישן). service role בלבד.
-- -----------------------------------------------------------------------------
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
               'show_in_file', r.line_total <> 0)
             order by r.hostess_name, r.event_date, r.project_id, r.assignment_number, r.line_basis)
        from unnest(v_rows) r
        left join public.hostess_bank_details b on b.hostess_id = r.hostess_id), '[]'::jsonb));
end;
$$;


-- -----------------------------------------------------------------------------
-- record_artifact — הקובץ הועלה (עם גיבוב). preparing → prepared. service role בלבד.
-- -----------------------------------------------------------------------------
create or replace function public.payroll_operation_record_artifact(
  p_operation_id uuid, p_actor_email text, p_key text, p_sha256 text, p_size integer, p_mime text, p_filename text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_op     public.payroll_operations;
  v_prefix text;
begin
  perform public._payroll_actor_assert(p_actor_email, 'כספים', array['edit']);

  select * into v_op from public.payroll_operations where operation_id = p_operation_id for update;
  if not found then
    perform public._payroll_raise('OPERATION_NOT_FOUND', 'פעולת ההפקה לא נמצאה.');
  end if;
  if v_op.state <> 'preparing' or v_op.reserved_report_id is null then
    perform public._payroll_raise('OPERATION_STATE', 'פעולת ההפקה אינה בשלב ההכנה.',
                                  jsonb_build_object('state', v_op.state));
  end if;

  v_prefix := format('payroll/%s/%s/', to_char(v_op.period, 'YYYY-MM'), v_op.operation_id);
  if p_key is null or left(p_key, length(v_prefix)) <> v_prefix or length(p_key) <= length(v_prefix)
     or p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$'
     or p_size is null or p_size <= 0
     or p_mime is distinct from 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
     or nullif(btrim(coalesce(p_filename, '')), '') is null then
    perform public._payroll_raise('ARTIFACT_INVALID', 'פרטי הקובץ שהועלה אינם תקינים.',
                                  jsonb_build_object('operation_id', p_operation_id));
  end if;

  update public.payroll_operations
     set state = 'prepared', artifact_key = p_key, artifact_sha256 = p_sha256, artifact_size = p_size,
         artifact_mime = p_mime, artifact_filename = p_filename
   where operation_id = p_operation_id;

  return jsonb_build_object('ok', true, 'operation_id', p_operation_id, 'state', 'prepared');
end;
$$;


-- -----------------------------------------------------------------------------
-- fail — כישלון לפני commit (אחסון, בנייה, גודל). preparing → failed. service role בלבד.
-- -----------------------------------------------------------------------------
create or replace function public.payroll_operation_fail(
  p_operation_id uuid, p_actor_email text, p_code text, p_detail text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_op public.payroll_operations;
begin
  perform public._payroll_actor_assert(p_actor_email, 'כספים', array['edit']);
  select * into v_op from public.payroll_operations where operation_id = p_operation_id for update;
  if not found then
    perform public._payroll_raise('OPERATION_NOT_FOUND', 'פעולת ההפקה לא נמצאה.');
  end if;
  if v_op.state <> 'preparing' then
    perform public._payroll_raise('OPERATION_STATE', 'פעולת ההפקה אינה בשלב ההכנה.',
                                  jsonb_build_object('state', v_op.state));
  end if;
  perform public._payroll_operation_mark_failed(p_operation_id, coalesce(nullif(btrim(p_code), ''), 'UNEXPECTED'),
                                                p_detail);
  return jsonb_build_object('ok', true, 'operation_id', p_operation_id, 'state', 'failed');
end;
$$;


-- -----------------------------------------------------------------------------
-- commit — הצעד הבלתי-הפיך. סדר תיקון F3:
--   נעילה גלובלית → הפעולה for update → מצב/שחקן/מתג/חודש/זהות → מוכנות (נעולה, בלי
--   הפעולה הזו) → נעילת המקורות בסדר קבוע → **רק אז** איסוף אחד → גרסה → כתיבה.
-- -----------------------------------------------------------------------------
create or replace function public._payroll_commit_locked(p_operation_id uuid, p_actor_email text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_op        public.payroll_operations;
  v_cfg       public.payroll_config;
  v_id        jsonb;
  v_ready     jsonb;
  v_status    text;
  v_d0        date;
  v_d1        date;
  v_rows      public.payroll_line[];
  v_total     numeric(12,2);
  v_lines_sum numeric(12,2);
  v_count     integer;
  v_claimed   integer;
  v_attempt   bigint;
  v_acc       jsonb;
  v_detail    text;
  v_msg       text;
  v_code      text;
begin
  perform public._payroll_lock();

  select * into v_op from public.payroll_operations where operation_id = p_operation_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'OPERATION_NOT_FOUND', 'message', 'פעולת ההפקה לא נמצאה.',
                              'retryable', false, 'operation_id', p_operation_id);
  end if;

  -- אידמפוטנטיות: פעולה שכבר נחתמה מחזירה את התוצאה השמורה.
  if v_op.state = 'committed' then
    return jsonb_build_object('ok', true, 'existing', true, 'operation_id', v_op.operation_id,
                              'report_id', v_op.report_id, 'attempt_id', v_op.accountant_attempt_id,
                              'total_amount', (select sr.total_amount from public.salary_reports sr
                                                where sr.report_id = v_op.report_id),
                              'line_count', (select count(*) from public.salary_report_lines l
                                              where l.report_id = v_op.report_id));
  end if;
  if v_op.state <> 'prepared' then
    return jsonb_build_object('ok', false, 'code', 'OPERATION_STATE', 'message', 'פעולת ההפקה אינה מוכנה לחתימה.',
                              'retryable', false, 'operation_id', p_operation_id, 'state', v_op.state);
  end if;

  perform public._payroll_actor_assert(p_actor_email, 'כספים', array['edit']);

  v_cfg := public._payroll_config();
  if not v_cfg.final_issue_enabled then
    return jsonb_build_object('ok', false, 'code', 'ISSUE_DISABLED', 'message', 'ההפקה הסופית כבויה כרגע.',
                              'retryable', true, 'operation_id', p_operation_id);
  end if;
  if public._payroll_month_state(v_op.period) <> 'ended' then
    return jsonb_build_object('ok', false, 'code', 'MONTH_NOT_ENDED', 'message', 'החודש עוד לא הסתיים.',
                              'retryable', true, 'operation_id', p_operation_id);
  end if;

  begin
    v_id := public._payroll_identity_check(v_op.period, v_op.report_kind, v_op.original_report_id);
  exception when others then
    get stacked diagnostics v_detail = pg_exception_detail, v_msg = message_text;
    if v_detail not like 'PAYROLL:%' then
      raise;
    end if;
    v_code := substr(v_detail, 9);
    perform public._payroll_operation_mark_failed(p_operation_id, v_code, v_msg);
    return jsonb_build_object('ok', false, 'code', v_code, 'message', v_msg, 'retryable', false,
                              'operation_id', p_operation_id);
  end;

  -- מוכנות — נעולה על שורת הבדיקה, ובלי הפעולה הזו עצמה (תיקון F2).
  v_ready := public._payroll_review_assert_ready_locked(v_op.review_id, v_op.expected_version, p_operation_id);
  if not coalesce((v_ready ->> 'ready')::boolean, false) then
    return jsonb_build_object('ok', false, 'code', 'REVIEW_NOT_READY',
                              'message', 'עדיין יש דברים שחוסמים את ההפקה.',
                              'blockers', v_ready -> 'blockers', 'retryable', true,
                              'operation_id', p_operation_id);
  end if;
  select r.status into v_status from public.payroll_reviews r where r.review_id = v_op.review_id;
  if v_status is distinct from 'open' then
    perform public._payroll_operation_mark_failed(p_operation_id, 'REVIEW_NOT_FOUND', 'review ' || coalesce(v_status, 'missing'));
    return jsonb_build_object('ok', false, 'code', 'REVIEW_NOT_FOUND', 'message', 'בדיקת הדיילות כבר נסגרה.',
                              'retryable', false, 'operation_id', p_operation_id);
  end if;
  if v_op.report_kind = 'supplement'
     and v_op.reserved_supplement_seq is distinct from (v_id ->> 'next_supplement_seq')::integer then
    perform public._payroll_operation_mark_failed(p_operation_id, 'PREVIEW_CHANGED', 'supplement sequence moved');
    return jsonb_build_object('ok', false, 'code', 'PREVIEW_CHANGED',
                              'message', 'בינתיים הופקה השלמה אחרת לחודש הזה. רעננו את הטיוטה.',
                              'retryable', false, 'operation_id', p_operation_id);
  end if;

  -- נעילת המקורות בסדר קבוע. המועמדים — אותו תנאי חברות כמו payroll_collect.
  -- פרויקטים for update (לא for share): השיוך מפעיל את recompute_project_status, שנועל את
  -- הפרויקט for update; נעילה מראש שומרת על סדר הנעילות (בודק 1, רשות 5).
  v_d0 := v_op.period;
  v_d1 := (v_op.period + interval '1 month')::date;
  create temp table _payroll_candidates on commit drop as
  select a.project_id, a.hostess_id, a.assignment_number
    from public.assignments a
    join public.projects p on p.project_id = a.project_id
   where a.salary_report_id is null
     and a.event_date >= v_d0 and a.event_date < v_d1
     and ((a.assignment_status = 'finally_approved'
           and p.project_status in ('awaiting_invoice', 'awaiting_payment', 'finished'))
          or (a.released_from_status = 'finally_approved' and p.project_status = 'cancelled'));

  perform 1 from public.projects p
   where p.project_id in (select c.project_id from _payroll_candidates c)
   order by p.project_id for update;
  perform 1 from public.hostesses h
   where h.hostess_id in (select c.hostess_id from _payroll_candidates c)
   order by h.hostess_id for share;
  perform 1 from public.hostess_bank_details b
   where b.hostess_id in (select c.hostess_id from _payroll_candidates c)
   order by b.hostess_id for share;
  perform 1 from public.assignments a
   where (a.project_id, a.hostess_id, a.assignment_number) in
         (select c.project_id, c.hostess_id, c.assignment_number from _payroll_candidates c)
   order by a.project_id, a.hostess_id, a.assignment_number for update;
  perform 1 from public.params pa
   where pa.param_name in ('סכום_נסיעות_למשמרת', 'שעות_פיצוי_ביטול_חלקי', 'שעות_פיצוי_ביטול_מלא',
                           'אחוז_פיצוי_ביטול_חלקי', 'מייל_משרד_רואי_חשבון', 'תבנית_מייל_דוח_שכר')
   order by pa.param_id for share;
  drop table _payroll_candidates;

  -- איסוף אחד, אחרי הנעילות. הגיבוב, השורות והשיוך — כולם מהמערך הזה (D4).
  v_rows := array(select c from public.payroll_collect(v_op.period, v_op.report_kind, v_op.original_report_id) c);
  if public._payroll_version_of(v_rows, v_op.period, v_op.report_kind, v_op.original_report_id)
     <> v_op.expected_version then
    perform public._payroll_operation_mark_failed(p_operation_id, 'PREVIEW_CHANGED',
      'הנתונים השתנו בין אישור הטיוטה לחתימה.');
    return jsonb_build_object('ok', false, 'code', 'PREVIEW_CHANGED',
                              'message', 'הנתונים השתנו מאז שהטיוטה אושרה. רעננו את הטיוטה ובדקו אותה שוב.',
                              'retryable', false, 'operation_id', p_operation_id);
  end if;
  if exists (select 1 from unnest(v_rows) r where cardinality(r.defects) > 0) then
    perform public._payroll_operation_mark_failed(p_operation_id, 'BLOCKERS_PRESENT', null);
    return jsonb_build_object('ok', false, 'code', 'BLOCKERS_PRESENT', 'message', 'בטיוטה יש שורות שחוסמות הפקה.',
                              'retryable', false, 'operation_id', p_operation_id);
  end if;

  v_count := coalesce(cardinality(v_rows), 0);
  select coalesce(sum(r.line_total), 0) into v_total from unnest(v_rows) r;

  perform public._payroll_writer_begin();

  insert into public.salary_reports
    (report_id, period, report_kind, original_report_id, supplement_seq, total_amount, report_file_url,
     artifact_sha256, artifact_size, artifact_mime, artifact_filename, review_id, operation_id,
     issued_at, issued_by, send_status, delivery_state)
  values
    (v_op.reserved_report_id, v_op.period, v_op.report_kind, v_op.original_report_id, v_op.reserved_supplement_seq,
     v_total, v_op.artifact_key, v_op.artifact_sha256, v_op.artifact_size, v_op.artifact_mime,
     v_op.artifact_filename, v_op.review_id, v_op.operation_id, now(), lower(btrim(p_actor_email)),
     'pending', 'queued');

  insert into public.salary_report_lines
    (report_id, hostess_id, hostess_name, id_number, source_project_id, line_basis,
     hours, rate, bonus, travel, line_total, assignment_number, event_date)
  select v_op.reserved_report_id, r.hostess_id, r.hostess_name, r.id_number, r.project_id, r.line_basis,
         r.hours, r.rate, nullif(r.bonus, 0), nullif(r.travel, 0), r.line_total,
         r.assignment_number, r.event_date
    from unnest(v_rows) r;

  -- השיוך המותנה. travel_amount נכתב כמו בכותב הישן (בודק 1, רשות 3) — get_shift_invite
  -- ו-PublicConfirmPage קוראים אותו.
  update public.assignments a
     set salary_report_id = v_op.reserved_report_id,
         travel_amount = r.travel
    from unnest(v_rows) r
   where a.project_id = r.project_id
     and a.hostess_id = r.hostess_id
     and a.assignment_number = r.assignment_number
     and a.salary_report_id is null;
  get diagnostics v_claimed = row_count;
  if v_claimed <> v_count then
    perform public._payroll_raise('CLAIM_MISMATCH',
      'החתימה בוטלה: חלק מהמשמרות שויכו בינתיים לדוח אחר.',
      jsonb_build_object('expected', v_count, 'claimed', v_claimed));
  end if;

  select coalesce(sum(l.line_total), 0) into v_lines_sum
    from public.salary_report_lines l where l.report_id = v_op.reserved_report_id;
  if v_lines_sum <> v_total then
    perform public._payroll_raise('TOTAL_MISMATCH', 'סכום השורות אינו תואם את סכום הדוח.',
      jsonb_build_object('lines', v_lines_sum, 'total', v_total));
  end if;

  update public.payroll_reviews
     set status = 'issued', report_id = v_op.reserved_report_id
   where review_id = v_op.review_id;

  v_acc := public._payroll_accountant_config();
  v_attempt := public._payroll_attempt_reserve('accountant', v_op.reserved_report_id, null, p_operation_id,
                                               v_acc ->> 'recipient', v_acc ->> 'template_name', 'initial', null,
                                               lower(btrim(p_actor_email)));

  update public.payroll_operations
     set state = 'committed', report_id = v_op.reserved_report_id, accountant_attempt_id = v_attempt,
         failure_code = null, failure_detail = null
   where operation_id = p_operation_id;

  return jsonb_build_object('ok', true, 'existing', false, 'operation_id', p_operation_id,
                            'report_id', v_op.reserved_report_id, 'attempt_id', v_attempt,
                            'total_amount', v_total, 'line_count', v_count);
end;
$$;

create or replace function public.payroll_commit(p_operation_id uuid, p_actor_email text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform set_config('lock_timeout', '5s', true);
  begin
    return public._payroll_commit_locked(p_operation_id, p_actor_email);
  exception when lock_not_available then
    return jsonb_build_object('ok', false, 'code', 'PAYROLL_BUSY',
                              'message', 'הפקה אחרת של דוח שכר רצה כרגע. נסו שוב בעוד דקה.',
                              'retryable', true, 'operation_id', p_operation_id);
  end;
end;
$$;


-- -----------------------------------------------------------------------------
-- status — קריאה בלבד, edit או view. next_action אומר למסך מה הצעד הבא.
-- -----------------------------------------------------------------------------
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
    'next_action', v_next);
end;
$$;


-- abandon — המנהלת מוותרת על פעולה שלא נחתמה. preparing / prepared → superseded.
create or replace function public.payroll_operation_abandon(p_operation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_op public.payroll_operations;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  perform public._payroll_lock();
  select * into v_op from public.payroll_operations where operation_id = p_operation_id for update;
  if not found then
    perform public._payroll_raise('OPERATION_NOT_FOUND', 'פעולת ההפקה לא נמצאה.');
  end if;
  if v_op.state not in ('preparing', 'prepared') then
    perform public._payroll_raise('OPERATION_STATE', 'אפשר לבטל רק הפקה שעוד לא נחתמה.',
                                  jsonb_build_object('state', v_op.state));
  end if;
  update public.payroll_operations set state = 'superseded', failure_code = 'ABANDONED'
   where operation_id = p_operation_id;
  return jsonb_build_object('ok', true, 'operation_id', p_operation_id, 'state', 'superseded');
end;
$$;


-- -----------------------------------------------------------------------------
-- שליחה חוזרת לרו"ח — רק לדוח חדש, רק מהניסיון האחרון, רק אחרי כישלון ידוע או "לא ידוע"
-- עם אישור מפורש. הנמען חייב להיות זה שמוגדר עכשיו (מה שהמנהלת ראתה במסך).
-- -----------------------------------------------------------------------------
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
end;
$$;


-- -----------------------------------------------------------------------------
-- הרשאות
-- -----------------------------------------------------------------------------
revoke execute on function public._payroll_operation_mark_failed(uuid, text, text) from public, anon, authenticated;
revoke execute on function public._payroll_commit_locked(uuid, text) from public, anon, authenticated;

revoke execute on function public.payroll_operation_begin(uuid, bigint, text, date, text, integer) from public, anon, authenticated;
revoke execute on function public.payroll_operation_status(uuid) from public, anon, authenticated;
revoke execute on function public.payroll_operation_abandon(uuid) from public, anon, authenticated;
revoke execute on function public.payroll_accountant_retry_reserve(integer, bigint, text, boolean) from public, anon, authenticated;
grant execute on function public.payroll_operation_begin(uuid, bigint, text, date, text, integer) to authenticated;
grant execute on function public.payroll_operation_status(uuid) to authenticated;
grant execute on function public.payroll_operation_abandon(uuid) to authenticated;
grant execute on function public.payroll_accountant_retry_reserve(integer, bigint, text, boolean) to authenticated;

revoke execute on function public.payroll_operation_snapshot(uuid, text) from public, anon, authenticated;
revoke execute on function public.payroll_operation_record_artifact(uuid, text, text, text, integer, text, text) from public, anon, authenticated;
revoke execute on function public.payroll_operation_fail(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.payroll_commit(uuid, text) from public, anon, authenticated;
grant execute on function public.payroll_operation_snapshot(uuid, text) to service_role;
grant execute on function public.payroll_operation_record_artifact(uuid, text, text, text, integer, text, text) to service_role;
grant execute on function public.payroll_operation_fail(uuid, text, text, text) to service_role;
grant execute on function public.payroll_commit(uuid, text) to service_role;
