-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 12 (B) — הדף האישי של הדיילת
-- =============================================================================
-- why: דיילת פותחת קישור אישי מהמייל (בלי חשבון), רואה את סיכום השעות שלה לחודש, ומאשרת
-- או מדווחת טעות (§7.107, חוזה §2.2). אלה שתי הפונקציות היחידות בדוח השכר שאנונימי נוגע
-- בהן, ולכן החוקים כאן לא מתרככים:
--   ① טוקן ריק / מנוחש / פג / מבוטל / של סיכום שהוחלף / של סבב שבוטל ⇒ אותה תשובה בדיוק:
--      {state:'invalid'}. כל הבדל ביניהם הוא ערוץ מידע למי שמנחש טוקנים.
--   ② GET לא משנה שום נתון בדוח (גם לא "נצפה ב-"). סורק מיילים שפותח את הקישור לא מאשר
--      דבר. הכתיבה היחידה בקריאה היא מונה הגבלת הקצב.
--   ③ אישור/פנייה = POST מפורש, קשור לתקציר שהדיילת ראתה (p_digest), עם client_request_id
--      ייחודי: לחיצה כפולה או ניסיון חוזר מחזירים את התוצאה השמורה.
--   ④ אין בתשובה מזהי פרויקט/דיילת/דוח, בנק, ת"ז — ואין שום שדה כספי (F11: רק משמרות ושעות).
--   ⑤ 120 קריאות לשעה ל-IP, fail-open כשאין IP — כמו התקדים feedback_rate_limit.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. הגבלת קצב — מחזירה false במקום לזרוק (החוזה), כדי שהתשובה תהיה {state:'rate_limited'}
-- -----------------------------------------------------------------------------
-- ה-IP: הערך הראשון ב-x-forwarded-for, כמו התקדים (20260827155303). הערה של בודק 1 (רשות 7):
-- הערך הראשון נשלט בידי הלקוח. עם טוקן של 256 ביט ההשפעה זניחה — נשאר כמו התקדים.
create or replace function public._payroll_review_rate_limit()
returns boolean
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare v_ip inet; v_recent int;
begin
  begin
    v_ip := nullif(btrim(split_part(
              coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''),
              ',', 1)), '')::inet;
  exception when others then v_ip := null;
  end;

  if v_ip is null then return true; end if;

  delete from public.payroll_review_rpc_calls where called_at < now() - interval '1 hour';
  select count(*) into v_recent
    from public.payroll_review_rpc_calls
   where ip = v_ip and called_at > now() - interval '1 hour';
  if v_recent >= 120 then
    return false;
  end if;
  insert into public.payroll_review_rpc_calls (ip) values (v_ip);
  return true;
end;
$$;

revoke execute on function public._payroll_review_rate_limit() from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- 2. זיהוי הטוקן — פנימי. מחזיר את הטוקן התקף, או null (ואז הקורא עונה invalid).
-- -----------------------------------------------------------------------------
-- תקף = קיים לפי sha256 · לא בוטל · לא פג · הנמענת נוכחית · הסבב פתוח או הופק.
-- 🔑 אורך שאינו 43 נדחה לפני הגיבוב — אותה תשובה, בלי עבודה מיותרת.
create or replace function public._payroll_review_token_valid(p_token text)
returns public.payroll_review_tokens
language plpgsql
stable
security definer
set search_path to ''
as $$
declare t public.payroll_review_tokens;
begin
  if p_token is null or length(p_token) <> 43 or p_token !~ '^[A-Za-z0-9_-]+$' then
    return null;
  end if;
  select tk.* into t
    from public.payroll_review_tokens tk
    join public.payroll_review_recipients r on r.recipient_id = tk.recipient_id
    join public.payroll_reviews v on v.review_id = r.review_id
   where tk.token_hash = pg_catalog.sha256(convert_to(p_token, 'UTF8'))
     and tk.revoked_at is null
     and tk.expires_at > now()
     and r.is_current
     and v.status in ('open', 'issued');
  return t;
end;
$$;

revoke execute on function public._payroll_review_token_valid(text) from public, anon, authenticated;


-- פנייה פתוחה (לפני הפקה) של הדיילת בסבב.
create or replace function public._payroll_review_open_case(p_review_id bigint, p_hostess_id bigint)
returns public.payroll_review_cases
language sql
stable
security definer
set search_path to ''
as $$
  select c.* from public.payroll_review_cases c
   where c.review_id = p_review_id and c.hostess_id = p_hostess_id
     and c.phase = 'pre_issue' and c.status in ('open', 'correction_pending')
   order by c.case_id
   limit 1;
$$;

revoke execute on function public._payroll_review_open_case(bigint, bigint) from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- 3. קריאת הדף — anon
-- -----------------------------------------------------------------------------
create or replace function public.payroll_review_public_get(p_token text)
returns jsonb
language plpgsql
volatile -- רק בגלל מונה הקצב. אין כתיבה לשום טבלת דוח.
security definer
set search_path to ''
as $$
declare
  t public.payroll_review_tokens;
  r public.payroll_review_recipients;
  v public.payroll_reviews;
  c public.payroll_review_cases;
  v_phase text;
begin
  if not public._payroll_review_rate_limit() then
    return jsonb_build_object('state', 'rate_limited');
  end if;
  t := public._payroll_review_token_valid(p_token);
  if t.token_id is null then
    return jsonb_build_object('state', 'invalid');
  end if;
  select * into r from public.payroll_review_recipients where recipient_id = t.recipient_id;
  select * into v from public.payroll_reviews where review_id = r.review_id;
  v_phase := case when v.status = 'issued' then 'post_issue' else 'pre_issue' end;
  c := public._payroll_review_open_case(v.review_id, r.hostess_id);

  return jsonb_build_object(
    'state', 'ok',
    'first_name', split_part(btrim(r.hostess_name), ' ', 1),
    'period', v.period,
    'kind', v.report_kind,
    'supplement_seq', public._payroll_review_supplement_seq(v),
    'deadline', v.response_deadline,
    'phase', v_phase,
    'digest', r.digest,
    -- F11 (הכרעת ישי 14.10 00:10, "רק משמרות ושעות"; לפניה: "זו טעות להציג שכר... זה מטעה את
    -- הדיילת"): רק תאריך, אירוע, בסיס, שעות וסיבת אפס. שום שדה כספי לא יוצא לדפדפן — לא
    -- תעריף, בונוס, נסיעות, סה"כ שורה או סה"כ חודש. גם בלי מזהי פרויקט/שיבוץ (④).
    'rows', coalesce((select jsonb_agg(jsonb_build_object(
                               'key', e -> 'key', 'event_date', e -> 'event_date',
                               'event_name', e -> 'event_name', 'line_basis', e -> 'line_basis',
                               'hours', e -> 'hours', 'zero_reason', e -> 'zero_reason') order by ord)
                        from jsonb_array_elements(r.rows) with ordinality x(e, ord)), '[]'::jsonb),
    -- סה"כ שעות עבודה בחודש, ושעות פיצוי ביטול בנפרד — לא מערבבים עבודה ופיצוי (כמו בקובץ).
    'total_hours', coalesce((select sum((e ->> 'hours')::numeric) from jsonb_array_elements(r.rows) e
                              where e ->> 'line_basis' = 'actual'), 0),
    'compensation_hours', coalesce((select sum((e ->> 'hours')::numeric) from jsonb_array_elements(r.rows) e
                                     where e ->> 'line_basis' = 'cancellation_compensation'), 0),
    'decision', jsonb_build_object('state', r.state, 'at', r.decided_at),
    'open_case', case when c.case_id is null then null
                      else jsonb_build_object('category', c.category, 'created_at', c.created_at) end,
    -- לפני ההפקה: אפשר לאשר כל עוד לא אישרה ואין פנייה פתוחה; אפשר לדווח כל עוד אין פנייה פתוחה
    -- (גם אחרי שאישרה — זה פותח את הבדיקה מחדש). אחרי ההפקה: רק לדווח.
    'can_approve', v_phase = 'pre_issue' and r.state <> 'hostess_approved' and c.case_id is null,
    'can_object', v_phase = 'post_issue' or c.case_id is null);
end;
$$;

revoke execute on function public.payroll_review_public_get(text) from public, anon, authenticated;
grant execute on function public.payroll_review_public_get(text) to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 4. ולידציית פנייה — מחזירה את שם השדה הראשון שנכשל, או null
-- -----------------------------------------------------------------------------
create or replace function public._payroll_review_case_invalid_field(p_case jsonb, p_rows jsonb)
returns text
language plpgsql
immutable
security definer
set search_path to ''
as $$
declare
  v_keys jsonb := coalesce(p_case -> 'row_keys', '[]'::jsonb);
  v_missing boolean;
  v_desc text;
  v_suggested numeric;
begin
  if p_case is null or jsonb_typeof(p_case) <> 'object' then
    return 'category';
  end if;
  if coalesce(p_case ->> 'category', '') not in ('hours', 'missing_shift', 'not_worked', 'other') then
    return 'category';
  end if;
  if jsonb_typeof(v_keys) <> 'array' then
    return 'rows';
  end if;
  -- "משמרת חסרה" היא קטגוריה; היא לבדה מחליפה סימון שורה.
  v_missing := p_case ->> 'category' = 'missing_shift';
  if jsonb_array_length(v_keys) = 0 and not v_missing then
    return 'rows';
  end if;
  -- כל מפתח חייב להיות שורה בסיכום של הדיילת הזו. מפתח זר ⇒ rows.
  if exists (select 1 from jsonb_array_elements_text(v_keys) k
              where not exists (select 1 from jsonb_array_elements(p_rows) e where e ->> 'key' = k)) then
    return 'rows';
  end if;
  v_desc := btrim(coalesce(p_case ->> 'description', ''));
  if length(v_desc) < 1 or length(v_desc) > 2000 then
    return 'description';
  end if;
  if p_case ? 'suggested_value' and jsonb_typeof(p_case -> 'suggested_value') <> 'null' then
    if jsonb_typeof(p_case -> 'suggested_value') <> 'number' then
      return 'suggested_value';
    end if;
    -- מספר מוצע — רק בפנייה על שעות, ובין 0 ל-24 (F11).
    v_suggested := (p_case ->> 'suggested_value')::numeric;
    if p_case ->> 'category' <> 'hours' or v_suggested < 0 or v_suggested > 24 then
      return 'suggested_value';
    end if;
  end if;
  return null;
exception when others then
  -- ערך שלא ניתן לפרש (למשל missing_shift שאינו בוליאני) ⇒ ולידציה, לא שגיאת שרת.
  return 'category';
end;
$$;

revoke execute on function public._payroll_review_case_invalid_field(jsonb, jsonb) from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- 5. תשובה — anon
-- -----------------------------------------------------------------------------
create or replace function public.payroll_review_public_respond(
  p_token text, p_request_id uuid, p_digest text, p_action text, p_case jsonb default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
  t public.payroll_review_tokens;
  r public.payroll_review_recipients;
  v public.payroll_reviews;
  c public.payroll_review_cases;
  v_prior public.payroll_review_responses;
  v_field text;
  v_result jsonb;
  v_response_id bigint;
  v_case_id bigint;
  v_affected jsonb;
begin
  if not public._payroll_review_rate_limit() then
    return jsonb_build_object('state', 'rate_limited');
  end if;

  -- ניסיון חוזר עם אותו מזהה ⇒ התוצאה השמורה — רק אם הוא נשלח עם אותו טוקן בדיוק.
  -- (גם אם הקישור בוטל מאז: התשובה שאבדה בדרך נשמרה, וזה מה שהדיילת צריכה לראות.)
  if p_request_id is not null and p_token is not null then
    select resp.* into v_prior
      from public.payroll_review_responses resp
      join public.payroll_review_tokens tk on tk.token_id = resp.token_id
     where resp.client_request_id = p_request_id
       and tk.token_hash = pg_catalog.sha256(convert_to(p_token, 'UTF8'));
    if v_prior.response_id is not null then
      return v_prior.result;
    end if;
  end if;

  t := public._payroll_review_token_valid(p_token);
  if t.token_id is null then
    return jsonb_build_object('state', 'invalid');
  end if;
  if p_request_id is null or p_action is null or p_action not in ('approve', 'objection') then
    return jsonb_build_object('state', 'validation', 'field', 'action');
  end if;

  -- סדר נעילות: הסבב (for share) לפני שורת הנמענת — כמו ב-commit של A.
  select r0.* into r from public.payroll_review_recipients r0 where r0.recipient_id = t.recipient_id;
  select * into v from public.payroll_reviews where review_id = r.review_id for share;
  select * into r from public.payroll_review_recipients where recipient_id = t.recipient_id for update;
  -- בין הבדיקה לנעילה הסבב יכול היה להתרענן/להתבטל ⇒ בודקים שוב אחרי הנעילה.
  t := public._payroll_review_token_valid(p_token);
  if t.token_id is null then
    return jsonb_build_object('state', 'invalid');
  end if;
  if p_digest is distinct from r.digest then
    return jsonb_build_object('state', 'stale');
  end if;

  if p_action = 'objection' then
    v_field := public._payroll_review_case_invalid_field(p_case, r.rows);
    if v_field is not null then
      return jsonb_build_object('state', 'validation', 'field', v_field);
    end if;
    -- השורות שסומנו, כפי שהופיעו בסיכום — עם מזהי השיבוץ (לשימוש המנהלת והתיקון בלבד).
    select coalesce(jsonb_agg(jsonb_build_object('key', e ->> 'key',
                                                 'project_id', (e ->> 'project_id')::int,
                                                 'assignment_number', (e ->> 'assignment_number')::int,
                                                 'event_date', e ->> 'event_date',
                                                 'line_basis', e ->> 'line_basis') order by ord), '[]'::jsonb)
      into v_affected
      from jsonb_array_elements(r.rows) with ordinality x(e, ord)
     where (e ->> 'key') in (select jsonb_array_elements_text(coalesce(p_case -> 'row_keys', '[]'::jsonb)));
  end if;

  -- ── אחרי ההפקה ─────────────────────────────────────────────────────────
  if v.status = 'issued' then
    if p_action = 'approve' then
      v_result := jsonb_build_object('state', 'issued');
    else
      v_result := jsonb_build_object('state', 'issued_case_saved');
    end if;
    insert into public.payroll_review_responses (recipient_id, token_id, action, client_request_id, result)
    values (r.recipient_id, t.token_id, p_action, p_request_id, v_result)
    returning response_id into v_response_id;
    if p_action = 'objection' then
      insert into public.payroll_review_cases (review_id, recipient_id, hostess_id, phase, report_id, category,
                                               affected_rows, missing_shift, description, suggested_value,
                                               status, response_id)
      values (v.review_id, r.recipient_id, r.hostess_id, 'post_issue', v.report_id, p_case ->> 'category',
              v_affected,
              p_case ->> 'category' = 'missing_shift',
              btrim(p_case ->> 'description'),
              case when jsonb_typeof(p_case -> 'suggested_value') = 'number'
                   then (p_case ->> 'suggested_value')::numeric end,
              'open', v_response_id)
      returning case_id into v_case_id;
      perform public._payroll_review_event(v.review_id, r.recipient_id, v_case_id, 'post_issue_case', 'link',
                                           jsonb_build_object('category', p_case ->> 'category'));
    end if;
    return v_result;
  end if;

  -- ── לפני ההפקה ─────────────────────────────────────────────────────────
  c := public._payroll_review_open_case(v.review_id, r.hostess_id);

  if p_action = 'approve' then
    if c.case_id is not null then
      v_result := jsonb_build_object('state', 'case_open');
    else
      v_result := jsonb_build_object('state', 'approved');
      -- אישור הדיילת גובר על "אושר לפי תיעוד" או "טופל": הוא ראיה חזקה יותר.
      update public.payroll_review_recipients
         set state = 'hostess_approved', decided_kind = 'hostess', decided_at = now(), decided_by = 'link',
             decision_reason = null, decision_evidence = null
       where recipient_id = r.recipient_id;
    end if;
    insert into public.payroll_review_responses (recipient_id, token_id, action, client_request_id, result)
    values (r.recipient_id, t.token_id, 'approve', p_request_id, v_result)
    returning response_id into v_response_id;
    perform public._payroll_review_event(v.review_id, r.recipient_id, null, 'hostess_' || (v_result ->> 'state'),
                                         'link', jsonb_build_object('response_id', v_response_id));
    return v_result;
  end if;

  -- objection — גם אחרי אישור קודם: הבדיקה נפתחת מחדש לדיילת הזו.
  if c.case_id is not null then
    v_result := jsonb_build_object('state', 'case_open');
    insert into public.payroll_review_responses (recipient_id, token_id, action, client_request_id, result)
    values (r.recipient_id, t.token_id, 'objection', p_request_id, v_result);
    return v_result;
  end if;

  v_result := jsonb_build_object('state', 'saved', 'case_saved', true);
  insert into public.payroll_review_responses (recipient_id, token_id, action, client_request_id, result)
  values (r.recipient_id, t.token_id, 'objection', p_request_id, v_result)
  returning response_id into v_response_id;
  insert into public.payroll_review_cases (review_id, recipient_id, hostess_id, phase, report_id, category,
                                           affected_rows, missing_shift, description, suggested_value,
                                           status, response_id)
  values (v.review_id, r.recipient_id, r.hostess_id, 'pre_issue', null, p_case ->> 'category', v_affected,
          p_case ->> 'category' = 'missing_shift',
          btrim(p_case ->> 'description'),
          case when jsonb_typeof(p_case -> 'suggested_value') = 'number'
               then (p_case ->> 'suggested_value')::numeric end,
          'open', v_response_id)
  returning case_id into v_case_id;
  update public.payroll_review_recipients
     set state = 'objection_open', decided_kind = null, decided_at = now(), decided_by = 'link',
         decision_reason = null, decision_evidence = null
   where recipient_id = r.recipient_id;
  perform public._payroll_review_event(v.review_id, r.recipient_id, v_case_id, 'hostess_objection', 'link',
                                       jsonb_build_object('category', p_case ->> 'category'));
  return v_result;
end;
$$;

revoke execute on function public.payroll_review_public_respond(text, uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.payroll_review_public_respond(text, uuid, text, text, jsonb) to anon, authenticated;
