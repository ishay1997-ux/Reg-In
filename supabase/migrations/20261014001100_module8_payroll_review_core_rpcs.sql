-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 11 (B) — פונקציות סבב הבדיקה של המנהלת
-- =============================================================================
-- why: המנהלת יוצרת סבב בדיקה לחודש, מאשרת את הטיוטה, קובעת מועד אחרון, שולחת לכל דיילת
-- סיכום אישי, מטפלת בפניות ומאשרת לפי תיעוד את מי שלא השיבה (§7.107, חוזה §2.2). כאן כל
-- הפונקציות של הצד המנהל, ופונקציית המוכנות שה-commit של A קורא בתוך הנעילה.
--
-- 🔑 עקרונות שחוצים את כל הקובץ:
--   ① הכסף לא מחושב כאן. כל שורה באה מ-payroll_collect (A) — הסמכות היחידה לאיסוף.
--      איסוף אחד למערך בכל קריאה (D4), והגרסה, התקצירים והמוכנות נגזרים מאותו מערך.
--   ② מצבים נגזרים ("מוכן", "ממתין") לא נשמרים — מחושבים מחדש בכל קריאה.
--   ③ סדר נעילות קבוע: שורת הבדיקה (for share / for update) לפני שורות הנמענות והפניות —
--      אותו סדר כמו ב-commit של A.
--   ④ כל פונקציה SECURITY DEFINER עם search_path ריק, revoke מפורש לפני כל grant.
--      שער הרשאה בתוך הגוף: 'כספים' edit (חוזה §2.2). mint_token — service_role בלבד.
--   ⑤ שגיאות דרך _payroll_raise (D7): detail = 'PAYROLL:<CODE>'.
-- תלוי במיגרציות 1–6 + 6b של A (payroll_config, payroll_collect, _payroll_version_of,
-- _payroll_attempt_*, payroll_mail_attempts, payroll_operations) ובמיגרציה 7 (הטבלאות).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. עזרים פנימיים (none)
-- -----------------------------------------------------------------------------

-- תקצירי הדיילות מתוך מערך איסוף אחד. שורה לכל דיילת: השורות (בלי בנק, בלי ת"ז) בסדר
-- תאריך → פרויקט → שיבוץ → בסיס, עם מפתח 'r1'..'rN'. השורות השמורות כוללות גם כסף — הן
-- משמשות את מסכי המנהלת. 🔴 אבל התקציר d1 מכסה **רק מה שהדיילת רואה** (F11, הכרעת ישי 14.10:
-- "רק משמרות ושעות"): שם, תאריך, אירוע, בסיס, שעות, סיבת אפס, וזהות המשמרת (פרויקט+שיבוץ,
-- כדי שהחלפת משמרת תיתפס). שינוי תעריף/בונוס/נסיעות/בנק לא מבטל את האישור שלה — היא לא אישרה
-- אותם. ⚠️ סיבת האפס נגזרת מהשעות, לא מהסכום: הדף לא מציג סכום, ושורה עם שעות ותעריף 0
-- אינה "בלי שעות".
create or replace function public._payroll_hostess_digests_from(
  p_rows public.payroll_line[], p_period date, p_kind text, p_original integer)
returns table (hostess_id bigint, hostess_name text, hostess_email text, digest text,
               rows jsonb, total numeric)
language sql
stable
security definer
set search_path to ''
as $$
  with l as (
    select u.*,
           row_number() over (partition by u.hostess_id
                              order by u.event_date, u.project_id, u.assignment_number, u.line_basis) as rn
      from unnest(p_rows) u
  ),
  shaped as (
    select l.hostess_id, l.hostess_name, l.hostess_email, l.rn, l.line_total,
           jsonb_build_object(
             'key', 'r' || l.rn,
             'project_id', l.project_id,
             'assignment_number', l.assignment_number,
             'event_date', l.event_date,
             'event_name', l.event_name,
             'line_basis', l.line_basis,
             'hours', l.hours,
             'rate', l.rate,
             -- בפיצוי ביטול אין בונוס ונסיעות: null ולא 0, כדי שהדף יציג "—" (חוזה §4.3).
             'bonus', case when l.line_basis = 'cancellation_compensation' then null else l.bonus end,
             'travel', case when l.line_basis = 'cancellation_compensation' then null else l.travel end,
             'line_total', l.line_total,
             'zero_reason', case
               when coalesce(l.hours, 0) <> 0 then null
               when l.line_basis = 'cancellation_compensation' and l.cancel_type = 'force_majeure' then 'force_majeure'
               when l.line_basis = 'cancellation_compensation' and coalesce(l.comp_pct, 0) = 0 then 'cancelled_early'
               else 'no_hours'
             end) as row_json
      from l
  ),
  per_hostess as (
    select s.hostess_id,
           min(s.hostess_name) as hostess_name,
           min(s.hostess_email) as hostess_email,
           jsonb_agg(s.row_json order by s.rn) as rows,
           jsonb_agg(jsonb_build_object(
                       'project_id', s.row_json -> 'project_id',
                       'assignment_number', s.row_json -> 'assignment_number',
                       'event_date', s.row_json -> 'event_date',
                       'event_name', s.row_json -> 'event_name',
                       'line_basis', s.row_json -> 'line_basis',
                       'hours', s.row_json -> 'hours',
                       'zero_reason', s.row_json -> 'zero_reason') order by s.rn) as rows_for_digest,
           sum(s.line_total) as total
      from shaped s
     group by s.hostess_id
  )
  select h.hostess_id, h.hostess_name, h.hostess_email,
         'd1:' || encode(pg_catalog.sha256(convert_to(
           jsonb_build_object('p', p_period, 'k', p_kind, 'o', p_original,
                              'n', h.hostess_name, 'rows', h.rows_for_digest)::text, 'UTF8')), 'hex'),
         h.rows, h.total
    from per_hostess h;
$$;

revoke execute on function public._payroll_hostess_digests_from(public.payroll_line[], date, text, integer)
  from public, anon, authenticated;

-- אותו דבר, עם איסוף משלו — לקוראים שלא מחזיקים מערך (חוזה §2.2, החתימה המקורית).
create or replace function public._payroll_hostess_digests(p_period date, p_kind text, p_original integer)
returns table (hostess_id bigint, hostess_name text, hostess_email text, digest text,
               rows jsonb, total numeric)
language sql
stable
security definer
set search_path to ''
as $$
  select d.*
    from public._payroll_hostess_digests_from(
           array(select c from public.payroll_collect(p_period, p_kind, p_original) c),
           p_period, p_kind, p_original) d;
$$;

revoke execute on function public._payroll_hostess_digests(date, text, integer)
  from public, anon, authenticated;


-- תקינות תבנית הסיכום האישי — אותה צורה כמו _payroll_accountant_config של A (F9).
-- תקינה = ארבעת משתני החובה קיימים, וכל [..] בגוף הוא אחד מהם (אותו כלל כמו העורך).
create or replace function public._payroll_review_template_config()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_name constant text := 'תבנית_מייל_סיכום_שעות_דיילת';
  v_required constant text[] := array['[שם_דיילת]', '[חודש_דיווח_ושנה]', '[לינק_בדיקת_שעות]', '[מועד_אחרון_לתגובה]'];
  v_body text;
  v_missing text[];
  v_unknown text[];
begin
  select p.param_value into v_body from public.params p where p.param_name = v_name;

  select coalesce(array_agg(t order by ord), '{}') into v_missing
    from unnest(v_required) with ordinality as r(t, ord)
   where v_body is null or strpos(v_body, t) = 0;

  select coalesce(array_agg(distinct m[1]), '{}') into v_unknown
    from regexp_matches(coalesce(v_body, ''), '(\[[^]\n]+\])', 'g') as m
   where m[1] <> all (v_required);

  return jsonb_build_object(
    'recipient', null,
    'recipient_valid', true,
    'template_name', v_name,
    'template_valid', v_body is not null and cardinality(v_missing) = 0 and cardinality(v_unknown) = 0,
    'template_sha256', case when v_body is null then null
                            else encode(pg_catalog.sha256(convert_to(v_body, 'UTF8')), 'hex') end,
    'template_body', v_body,
    'missing_tokens', to_jsonb(v_missing),
    'unknown_tokens', to_jsonb(v_unknown));
end;
$$;

revoke execute on function public._payroll_review_template_config() from public, anon, authenticated;


-- שורת יומן. כל פעולה של מנהלת/דיילת על הסבב נרשמת כאן.
create or replace function public._payroll_review_event(
  p_review_id bigint, p_recipient_id bigint, p_case_id bigint, p_event_type text, p_actor text,
  p_payload jsonb default '{}'::jsonb)
returns void
language sql
volatile
security definer
set search_path to ''
as $$
  insert into public.payroll_review_events (review_id, recipient_id, case_id, event_type, actor, payload)
  values (p_review_id, p_recipient_id, p_case_id, p_event_type, p_actor, coalesce(p_payload, '{}'::jsonb));
$$;

revoke execute on function public._payroll_review_event(bigint, bigint, bigint, text, text, jsonb)
  from public, anon, authenticated;


-- נעילת שורת הבדיקה בסדר הקבוע. p_mode: 'update' (רענון, ביטול, הפצה, מועד, אישור טיוטה)
-- או 'share' (תשובה, פנייה, החלטה). לא נמצאה ⇒ REVIEW_NOT_FOUND.
create or replace function public._payroll_review_lock(p_review_id bigint, p_mode text)
returns public.payroll_reviews
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare v public.payroll_reviews;
begin
  if p_mode = 'update' then
    select * into v from public.payroll_reviews where review_id = p_review_id for update;
  else
    select * into v from public.payroll_reviews where review_id = p_review_id for share;
  end if;
  if v.review_id is null then
    perform public._payroll_raise('REVIEW_NOT_FOUND', 'סבב הבדיקה לא נמצא.',
                                  jsonb_build_object('review_id', p_review_id));
  end if;
  return v;
end;
$$;

revoke execute on function public._payroll_review_lock(bigint, text) from public, anon, authenticated;


-- פעולות מנהלת אפשריות רק על סבב פתוח. סבב שהופק או בוטל — REVIEW_NOT_OPEN.
create or replace function public._payroll_review_assert_open(p_review public.payroll_reviews)
returns void
language plpgsql
volatile
security definer
set search_path to ''
as $$
begin
  if p_review.status <> 'open' then
    perform public._payroll_raise('REVIEW_NOT_OPEN', 'סבב הבדיקה כבר לא פתוח לשינויים.',
                                  jsonb_build_object('review_id', p_review.review_id, 'status', p_review.status));
  end if;
end;
$$;

revoke execute on function public._payroll_review_assert_open(public.payroll_reviews) from public, anon, authenticated;


-- מספר ההשלמה של סבב: מהדוח שהופק, אחרת הבא בתור לדוח המקורי. regular ⇒ null.
create or replace function public._payroll_review_supplement_seq(p_review public.payroll_reviews)
returns integer
language sql
stable
security definer
set search_path to ''
as $$
  select case
    when p_review.report_kind <> 'supplement' then null
    when p_review.report_id is not null then
      (select s.supplement_seq from public.salary_reports s where s.report_id = p_review.report_id)
    else
      (select coalesce(max(s.supplement_seq), 0) + 1
         from public.salary_reports s where s.original_report_id = p_review.original_report_id)
  end;
$$;

revoke execute on function public._payroll_review_supplement_seq(public.payroll_reviews) from public, anon, authenticated;


-- בדיקת טקסט חובה (סיבה, ראיה): אחרי trim, לפחות p_min תווים — אחרת REASON_REQUIRED.
create or replace function public._payroll_review_require_text(p_value text, p_min integer, p_field text)
returns text
language plpgsql
volatile
security definer
set search_path to ''
as $$
begin
  if p_value is null or length(btrim(p_value)) < p_min then
    perform public._payroll_raise('REASON_REQUIRED', 'יש לכתוב סיבה מפורטת.',
                                  jsonb_build_object('field', p_field, 'min', p_min));
  end if;
  return btrim(p_value);
end;
$$;

revoke execute on function public._payroll_review_require_text(text, integer, text) from public, anon, authenticated;


-- הניסיון האחרון של נמענת, עם המצב האפקטיבי (sending ישן ⇒ unknown, חוזה §2.1).
create or replace function public._payroll_review_last_attempt(p_recipient_id bigint)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $$
  select jsonb_build_object(
           'attempt_id', a.attempt_id,
           'state', public._payroll_attempt_effective_state(a),
           'intended_recipient', a.intended_recipient,
           'delivered_recipient', a.delivered_recipient,
           'redirected', a.redirected,
           'completed_at', a.completed_at,
           'created_at', a.created_at,
           'attempts_count', (select count(*) from public.payroll_mail_attempts x
                               where x.kind = 'personal_review' and x.recipient_id = p_recipient_id))
    from public.payroll_mail_attempts a
   where a.kind = 'personal_review' and a.recipient_id = p_recipient_id
   order by a.attempt_id desc
   limit 1;
$$;

revoke execute on function public._payroll_review_last_attempt(bigint) from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- 1. מוכנות — מחושבת מאפס בכל קריאה (חוזה §2.2, F2)
-- -----------------------------------------------------------------------------
-- חסמים בסדר קבוע. לפניהם REVIEW_NOT_OPEN לסבב שכבר הופק/בוטל (הכרעת B: בלי זה סבב שהופק
-- היה מוצג "מוכן"). p_expected_version: הגרסה שהקורא מתכוון להפיק (null ⇒ הגרסה של הסבב).
-- p_exclude_operation_id: הפעולה של הקורא עצמו, שלא תחסום את עצמה (F2).
create or replace function public._payroll_review_readiness_of(
  p_review public.payroll_reviews, p_expected_version text, p_exclude_operation_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_rows public.payroll_line[];
  v_version text;
  v_expected text := coalesce(p_expected_version, p_review.preview_version);
  v_digests jsonb;
  v_member_ids bigint[];
  v_cfg public.payroll_config := public._payroll_config();
  v_acc jsonb := public._payroll_accountant_config();
  v_blockers jsonb := '[]'::jsonb;
  v_counts jsonb;
  v_defects int;
  v_not_covered bigint[];
  v_stale bigint[];
  v_objection bigint[];
  v_missing bigint[];
  v_ops int;
begin
  v_rows := array(select c from public.payroll_collect(p_review.period, p_review.report_kind,
                                                       p_review.original_report_id) c);
  v_version := public._payroll_version_of(v_rows, p_review.period, p_review.report_kind,
                                          p_review.original_report_id);

  select coalesce(jsonb_object_agg(d.hostess_id::text, d.digest), '{}'::jsonb),
         coalesce(array_agg(d.hostess_id), '{}')
    into v_digests, v_member_ids
    from public._payroll_hostess_digests_from(v_rows, p_review.period, p_review.report_kind,
                                              p_review.original_report_id) d;

  select count(*) into v_defects from unnest(v_rows) u where cardinality(u.defects) > 0;

  select coalesce(array_agg(m), '{}') into v_not_covered
    from unnest(v_member_ids) m
   where not exists (select 1 from public.payroll_review_recipients r
                      where r.review_id = p_review.review_id and r.hostess_id = m and r.is_current);

  select coalesce(array_agg(r.hostess_id), '{}') into v_stale
    from public.payroll_review_recipients r
   where r.review_id = p_review.review_id and r.is_current
     and r.digest is distinct from v_digests ->> r.hostess_id::text;

  select coalesce(array_agg(distinct c.hostess_id), '{}') into v_objection
    from public.payroll_review_cases c
   where c.review_id = p_review.review_id and c.phase = 'pre_issue'
     and c.status in ('open', 'correction_pending');

  select coalesce(array_agg(r.hostess_id), '{}') into v_missing
    from public.payroll_review_recipients r
   where r.review_id = p_review.review_id and r.is_current
     and r.state not in ('hostess_approved', 'manager_approved_no_response', 'manager_resolved');

  select count(*) into v_ops
    from public.payroll_operations o
   where o.review_id = p_review.review_id and o.state in ('preparing', 'prepared')
     and o.operation_id is distinct from p_exclude_operation_id;

  if p_review.status <> 'open' then
    v_blockers := v_blockers || jsonb_build_object('code', 'REVIEW_NOT_OPEN', 'count', 1);
  end if;
  if not v_cfg.final_issue_enabled then
    v_blockers := v_blockers || jsonb_build_object('code', 'ISSUE_DISABLED', 'count', 1);
  end if;
  if public._payroll_month_state(p_review.period) <> 'ended' then
    v_blockers := v_blockers || jsonb_build_object('code', 'MONTH_NOT_ENDED', 'count', 1);
  end if;
  if v_version is distinct from v_expected or v_version is distinct from p_review.preview_version then
    v_blockers := v_blockers || jsonb_build_object('code', 'VERSION_STALE', 'count', 1);
  end if;
  if p_review.manager_approved_version is distinct from v_version then
    v_blockers := v_blockers || jsonb_build_object('code', 'MANAGER_APPROVAL_REQUIRED', 'count', 1);
  end if;
  if v_defects > 0 then
    v_blockers := v_blockers || jsonb_build_object('code', 'PREVIEW_BLOCKERS', 'count', v_defects);
  end if;
  if cardinality(v_not_covered) > 0 then
    v_blockers := v_blockers || jsonb_build_object('code', 'NOT_COVERED', 'count', cardinality(v_not_covered),
                                                   'hostess_ids', to_jsonb(v_not_covered));
  end if;
  if cardinality(v_stale) > 0 then
    v_blockers := v_blockers || jsonb_build_object('code', 'DIGEST_STALE', 'count', cardinality(v_stale),
                                                   'hostess_ids', to_jsonb(v_stale));
  end if;
  if cardinality(v_objection) > 0 then
    v_blockers := v_blockers || jsonb_build_object('code', 'OBJECTION_OPEN', 'count', cardinality(v_objection),
                                                   'hostess_ids', to_jsonb(v_objection));
  end if;
  if cardinality(v_missing) > 0 then
    v_blockers := v_blockers || jsonb_build_object('code', 'DECISIONS_MISSING', 'count', cardinality(v_missing),
                                                   'hostess_ids', to_jsonb(v_missing));
  end if;
  if not coalesce((v_acc ->> 'recipient_valid')::boolean, false) then
    v_blockers := v_blockers || jsonb_build_object('code', 'RECIPIENT_INVALID', 'count', 1);
  end if;
  if not coalesce((v_acc ->> 'template_valid')::boolean, false) then
    v_blockers := v_blockers || jsonb_build_object('code', 'TEMPLATE_INVALID', 'count', 1);
  end if;
  if v_ops > 0 then
    v_blockers := v_blockers || jsonb_build_object('code', 'OPERATION_ACTIVE', 'count', v_ops);
  end if;

  -- מונים בדיילות שונות לגרסה הנוכחית (מדריך UX §ד), לא בשיבוצים ולא במיילים.
  select jsonb_build_object(
           'hostesses', count(*),
           'hostess_approved', count(*) filter (where r.state = 'hostess_approved'),
           'manager_approved', count(*) filter (where r.state = 'manager_approved_no_response'),
           'manager_resolved', count(*) filter (where r.state = 'manager_resolved'),
           'awaiting', count(*) filter (where r.state = 'awaiting'),
           'open_cases', (select count(distinct c.hostess_id) from public.payroll_review_cases c
                           where c.review_id = p_review.review_id and c.phase = 'pre_issue' and c.status = 'open'),
           'correction_pending', (select count(distinct c.hostess_id) from public.payroll_review_cases c
                                   where c.review_id = p_review.review_id and c.phase = 'pre_issue'
                                     and c.status = 'correction_pending'),
           'stale_digest', cardinality(v_stale),
           'not_covered', cardinality(v_not_covered),
           'never_sent', count(*) filter (where not exists (
                            select 1 from public.payroll_mail_attempts a
                             where a.kind = 'personal_review' and a.recipient_id = r.recipient_id
                               and a.state = 'sent')),
           'delivery_failed', count(*) filter (where (public._payroll_review_last_attempt(r.recipient_id) ->> 'state') = 'failed'),
           'delivery_unknown', count(*) filter (where (public._payroll_review_last_attempt(r.recipient_id) ->> 'state') = 'unknown'))
    into v_counts
    from public.payroll_review_recipients r
   where r.review_id = p_review.review_id and r.is_current;

  return jsonb_build_object('ready', jsonb_array_length(v_blockers) = 0,
                            'blockers', v_blockers,
                            'counts', v_counts,
                            'version_current', v_version);
end;
$$;

revoke execute on function public._payroll_review_readiness_of(public.payroll_reviews, text, uuid)
  from public, anon, authenticated;


-- התלות של ה-commit של A, בחתימה המדויקת (F2): נועלת את הסבב for update ומחזירה מוכנות.
create or replace function public._payroll_review_assert_ready_locked(
  p_review_id bigint, p_version text, p_exclude_operation_id uuid default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare v public.payroll_reviews;
begin
  v := public._payroll_review_lock(p_review_id, 'update');
  return public._payroll_review_readiness_of(v, p_version, p_exclude_operation_id);
end;
$$;

revoke execute on function public._payroll_review_assert_ready_locked(bigint, text, uuid)
  from public, anon, authenticated;


create or replace function public.payroll_review_readiness(p_review_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare v public.payroll_reviews;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  select * into v from public.payroll_reviews where review_id = p_review_id;
  if v.review_id is null then
    perform public._payroll_raise('REVIEW_NOT_FOUND', 'סבב הבדיקה לא נמצא.', null);
  end if;
  return public._payroll_review_readiness_of(v, null, null);
end;
$$;

revoke execute on function public.payroll_review_readiness(bigint) from public, anon, authenticated;
grant execute on function public.payroll_review_readiness(bigint) to authenticated;


-- -----------------------------------------------------------------------------
-- 2. יצירה ורענון
-- -----------------------------------------------------------------------------

create or replace function public.payroll_review_create(
  p_period date, p_kind text, p_original_report_id integer, p_expected_version text)
returns jsonb
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
  v_actor text := (select auth.email());
  v_ident jsonb;
  v_period date;
  v_existing bigint;
  v_rows public.payroll_line[];
  v_version text;
  v_review_id bigint;
  v_count int;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  -- מנעול השכר הגלובלי: שתי מנהלות שלוחצות יחד לא ייצרו שני סבבים (וגם האינדקס הייחודי מגן).
  perform public._payroll_lock();

  v_ident := public._payroll_identity_check(p_period, p_kind, p_original_report_id);
  v_period := (v_ident ->> 'period')::date;

  select r.review_id into v_existing
    from public.payroll_reviews r
   where r.period = v_period and r.report_kind = p_kind
     and coalesce(r.original_report_id, 0) = coalesce(p_original_report_id, 0)
     and r.status in ('open', 'issuing');
  if v_existing is not null then
    return jsonb_build_object('ok', true, 'existing', true, 'review_id', v_existing);
  end if;

  if (v_ident ->> 'month_state') <> 'ended' then
    perform public._payroll_raise('MONTH_NOT_ENDED', 'החודש עוד לא הסתיים. אפשר לשלוח לבדיקה רק אחרי סוף החודש.',
                                  jsonb_build_object('period', v_period));
  end if;

  v_rows := array(select c from public.payroll_collect(v_period, p_kind, p_original_report_id) c);
  v_version := public._payroll_version_of(v_rows, v_period, p_kind, p_original_report_id);
  if v_version is distinct from p_expected_version then
    perform public._payroll_raise('PREVIEW_CHANGED', 'הנתונים השתנו. יש לרענן לפני אישור.', null);
  end if;
  if exists (select 1 from unnest(v_rows) u where cardinality(u.defects) > 0) then
    perform public._payroll_raise('BLOCKERS_PRESENT', 'יש שורות עם נתונים חסרים. יש לתקן אותן לפני השליחה.', null);
  end if;
  if cardinality(v_rows) = 0 then
    perform public._payroll_raise('REVIEW_EMPTY', 'אין לחודש הזה שעות מאושרות שעוד לא נכללו בדוח.', null);
  end if;

  insert into public.payroll_reviews (period, report_kind, original_report_id, revision, preview_version,
                                      status, created_by)
  values (v_period, p_kind, p_original_report_id, 1, v_version, 'open', v_actor)
  returning review_id into v_review_id;

  insert into public.payroll_review_recipients (review_id, hostess_id, revision, digest, rows, total,
                                                hostess_name, is_current, state)
  select v_review_id, d.hostess_id, 1, d.digest, d.rows, d.total, d.hostess_name, true, 'awaiting'
    from public._payroll_hostess_digests_from(v_rows, v_period, p_kind, p_original_report_id) d;
  get diagnostics v_count = row_count;

  perform public._payroll_review_event(v_review_id, null, null, 'created', v_actor,
                                       jsonb_build_object('version', v_version, 'recipients', v_count));

  return jsonb_build_object('ok', true, 'existing', false, 'review_id', v_review_id,
                            'revision', 1, 'recipient_count', v_count);
end;
$$;

revoke execute on function public.payroll_review_create(date, text, integer, text) from public, anon, authenticated;
grant execute on function public.payroll_review_create(date, text, integer, text) to authenticated;


-- רענון: תקציר שלא השתנה — שומר את הרשומה ואת ההחלטה. השתנה/חדשה — רשומה חדשה (awaiting),
-- הישנה superseded והקישורים שלה מבוטלים. דיילת שיצאה — superseded + ביטול. מייל שהשתנה מאז
-- השליחה האחרונה — ביטול קישורים בלבד (ההחלטה נשארת).
create or replace function public.payroll_review_refresh(p_review_id bigint, p_expected_revision integer)
returns jsonb
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
  v_actor text := (select auth.email());
  v public.payroll_reviews;
  v_rows public.payroll_line[];
  v_version text;
  v_new_rev int;
  v_changed bigint[];
  v_removed bigint[];
  v_contact bigint[];
  v_fresh jsonb;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  v := public._payroll_review_lock(p_review_id, 'update');
  perform public._payroll_review_assert_open(v);
  if v.revision <> p_expected_revision then
    perform public._payroll_raise('STALE_VERSION', 'הנתונים השתנו. יש לרענן לפני אישור.',
                                  jsonb_build_object('revision', v.revision));
  end if;

  v_rows := array(select c from public.payroll_collect(v.period, v.report_kind, v.original_report_id) c);
  v_version := public._payroll_version_of(v_rows, v.period, v.report_kind, v.original_report_id);
  v_new_rev := v.revision + 1;

  -- התקצירים הטריים כ-jsonb (ולא טבלה זמנית): מערך אחד, נקרא כמה פעמים באותה פונקציה.
  select coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb) into v_fresh
    from public._payroll_hostess_digests_from(v_rows, v.period, v.report_kind, v.original_report_id) d;

  -- דיילות שהתקציר שלהן השתנה (קיימות ושונות) או חדשות.
  select coalesce(array_agg(f.hostess_id), '{}') into v_changed
    from jsonb_to_recordset(v_fresh) as f(hostess_id bigint, hostess_name text, hostess_email text, digest text, rows jsonb, total numeric)
    left join public.payroll_review_recipients r
      on r.review_id = v.review_id and r.hostess_id = f.hostess_id and r.is_current
   where r.recipient_id is null or r.digest <> f.digest;

  select coalesce(array_agg(r.hostess_id), '{}') into v_removed
    from public.payroll_review_recipients r
   where r.review_id = v.review_id and r.is_current
     and not exists (select 1 from jsonb_to_recordset(v_fresh) as f(hostess_id bigint, hostess_name text, hostess_email text, digest text, rows jsonb, total numeric) where f.hostess_id = r.hostess_id);

  -- ביטול קישורים והחלפה — לכל מי שהשתנה או יצא.
  update public.payroll_review_tokens t
     set revoked_at = now(), revoked_reason = 'superseded'
    from public.payroll_review_recipients r
   where t.recipient_id = r.recipient_id and t.revoked_at is null
     and r.review_id = v.review_id and r.is_current
     and r.hostess_id = any (v_changed || v_removed);

  update public.payroll_review_recipients r
     set is_current = false, state = 'superseded'
   where r.review_id = v.review_id and r.is_current
     and r.hostess_id = any (v_changed || v_removed);

  insert into public.payroll_review_recipients (review_id, hostess_id, revision, digest, rows, total,
                                                hostess_name, is_current, state)
  select v.review_id, f.hostess_id, v_new_rev, f.digest, f.rows, f.total, f.hostess_name, true, 'awaiting'
    from jsonb_to_recordset(v_fresh) as f(hostess_id bigint, hostess_name text, hostess_email text, digest text, rows jsonb, total numeric)
   where f.hostess_id = any (v_changed);

  -- תקציר זהה אבל כסף שהשתנה (תעריף/בונוס/נסיעות — F11): ההחלטה נשארת, והשורות השמורות
  -- מתעדכנות כדי שמסכי המנהלת יראו את הסכום העדכני.
  update public.payroll_review_recipients r
     set rows = f.rows, total = f.total
    from jsonb_to_recordset(v_fresh) as f(hostess_id bigint, hostess_name text, hostess_email text, digest text, rows jsonb, total numeric)
   where r.review_id = v.review_id and r.is_current and r.hostess_id = f.hostess_id
     and r.digest = f.digest and (r.rows is distinct from f.rows or r.total is distinct from f.total);

  -- מייל שהשתנה מאז הניסיון האחרון: הקישור הישן הלך לכתובת אחרת ⇒ מבוטל. ההחלטה נשארת.
  select coalesce(array_agg(r.hostess_id), '{}') into v_contact
    from public.payroll_review_recipients r
    join jsonb_to_recordset(v_fresh) as f(hostess_id bigint, hostess_name text, hostess_email text, digest text, rows jsonb, total numeric) on f.hostess_id = r.hostess_id
   where r.review_id = v.review_id and r.is_current
     and (public._payroll_review_last_attempt(r.recipient_id) ->> 'intended_recipient') is not null
     and lower(public._payroll_review_last_attempt(r.recipient_id) ->> 'intended_recipient')
         <> lower(coalesce(f.hostess_email, ''));

  update public.payroll_review_tokens t
     set revoked_at = now(), revoked_reason = 'contact_changed'
    from public.payroll_review_recipients r
   where t.recipient_id = r.recipient_id and t.revoked_at is null
     and r.review_id = v.review_id and r.is_current and r.hostess_id = any (v_contact);

  update public.payroll_reviews
     set revision = v_new_rev,
         preview_version = v_version,
         manager_approved_version = case when v_version is distinct from v.preview_version then null
                                         else manager_approved_version end,
         manager_approved_by = case when v_version is distinct from v.preview_version then null
                                    else manager_approved_by end,
         manager_approved_at = case when v_version is distinct from v.preview_version then null
                                    else manager_approved_at end
   where review_id = v.review_id;

  perform public._payroll_review_event(v.review_id, null, null, 'refreshed', v_actor,
    jsonb_build_object('revision', v_new_rev, 'version', v_version, 'changed', to_jsonb(v_changed),
                       'removed', to_jsonb(v_removed), 'contact_changed', to_jsonb(v_contact)));

  return jsonb_build_object('ok', true, 'revision', v_new_rev, 'version', v_version,
                            'changed_hostess_ids', to_jsonb(v_changed),
                            'removed_hostess_ids', to_jsonb(v_removed),
                            'contact_changed_ids', to_jsonb(v_contact));
end;
$$;

revoke execute on function public.payroll_review_refresh(bigint, integer) from public, anon, authenticated;
grant execute on function public.payroll_review_refresh(bigint, integer) to authenticated;


-- -----------------------------------------------------------------------------
-- 3. קריאה (צורה §4.3)
-- -----------------------------------------------------------------------------
create or replace function public.payroll_review_get(p_review_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v public.payroll_reviews;
  v_rows public.payroll_line[];
  v_digests jsonb := '{}'::jsonb;
  v_emails jsonb := '{}'::jsonb;
  v_readiness jsonb;
  v_version text;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  select * into v from public.payroll_reviews where review_id = p_review_id;
  if v.review_id is null then
    perform public._payroll_raise('REVIEW_NOT_FOUND', 'סבב הבדיקה לא נמצא.', null);
  end if;

  -- גרסה ותקצירים עדכניים — רק לסבב פתוח. סבב שהופק קפוא, ואין טעם לאסוף עבורו.
  if v.status = 'open' then
    v_rows := array(select c from public.payroll_collect(v.period, v.report_kind, v.original_report_id) c);
    v_version := public._payroll_version_of(v_rows, v.period, v.report_kind, v.original_report_id);
    select coalesce(jsonb_object_agg(d.hostess_id::text, d.digest), '{}'::jsonb),
           coalesce(jsonb_object_agg(d.hostess_id::text, d.hostess_email), '{}'::jsonb)
      into v_digests, v_emails
      from public._payroll_hostess_digests_from(v_rows, v.period, v.report_kind, v.original_report_id) d;
  end if;
  v_readiness := public._payroll_review_readiness_of(v, null, null);

  return jsonb_build_object(
    'ok', true,
    'review', jsonb_build_object(
      'review_id', v.review_id, 'period', v.period, 'kind', v.report_kind,
      'original_report_id', v.original_report_id, 'supplement_seq', public._payroll_review_supplement_seq(v),
      'revision', v.revision, 'status', v.status,
      'version', v.preview_version,
      'version_current', case when v.status = 'open' then v_version = v.preview_version else null end,
      'manager_approved', v.manager_approved_version is not null
                          and v.manager_approved_version = coalesce(v_version, v.preview_version),
      'manager_approved_at', v.manager_approved_at, 'manager_approved_by', v.manager_approved_by,
      'response_deadline', v.response_deadline,
      'deadline_passed', v.response_deadline is not null and now() > v.response_deadline,
      'distributed_at', v.distributed_at, 'report_id', v.report_id),
    'recipients', coalesce((
      select jsonb_agg(jsonb_build_object(
               'recipient_id', r.recipient_id, 'hostess_id', r.hostess_id, 'hostess_name', r.hostess_name,
               'total', r.total, 'row_count', jsonb_array_length(r.rows), 'state', r.state,
               'decided_kind', r.decided_kind, 'decided_at', r.decided_at,
               'decision_reason', r.decision_reason, 'digest', r.digest,
               'digest_current', case when v.status = 'open'
                                      then r.digest = (v_digests ->> r.hostess_id::text) else null end,
               'contact_changed', case when v.status = 'open' then
                                    coalesce(lower(la.a ->> 'intended_recipient')
                                             <> lower(coalesce(v_emails ->> r.hostess_id::text, h.email, '')), false)
                                  else false end,
               'email_present', coalesce(btrim(h.email), '') <> '',
               'delivery', la.a,
               'open_case_id', (select min(c.case_id) from public.payroll_review_cases c
                                 where c.review_id = v.review_id and c.hostess_id = r.hostess_id
                                   and c.status in ('open', 'correction_pending')),
               'last_action_at', greatest(r.created_at, r.decided_at,
                                          (la.a ->> 'completed_at')::timestamptz,
                                          (la.a ->> 'created_at')::timestamptz,
                                          (select max(c.created_at) from public.payroll_review_cases c
                                            where c.review_id = v.review_id and c.hostess_id = r.hostess_id)))
             order by r.hostess_name, r.hostess_id)
        from public.payroll_review_recipients r
        left join public.hostesses h on h.hostess_id = r.hostess_id
        left join lateral (select public._payroll_review_last_attempt(r.recipient_id) as a) la on true
       where r.review_id = v.review_id and r.is_current), '[]'::jsonb),
    'cases', coalesce((
      select jsonb_agg(jsonb_build_object(
               'case_id', c.case_id, 'recipient_id', c.recipient_id, 'hostess_id', c.hostess_id,
               'hostess_name', r.hostess_name, 'phase', c.phase, 'category', c.category,
               'affected_rows', c.affected_rows, 'missing_shift', c.missing_shift,
               'description', c.description, 'suggested_value', c.suggested_value,
               'status', c.status, 'revision', c.revision, 'created_at', c.created_at,
               'resolution_reason', c.resolution_reason, 'resolved_by', c.resolved_by,
               'resolved_at', c.resolved_at)
             order by c.created_at desc)
        from public.payroll_review_cases c
        join public.payroll_review_recipients r on r.recipient_id = c.recipient_id
       where c.review_id = v.review_id), '[]'::jsonb),
    'readiness', v_readiness);
end;
$$;

revoke execute on function public.payroll_review_get(bigint) from public, anon, authenticated;
grant execute on function public.payroll_review_get(bigint) to authenticated;


-- הסבב של זהות דוח: הפעיל, ואם אין — האחרון שהופק. לא נמצא ⇒ {ok:true, review:null}.
create or replace function public.payroll_review_find(p_period date, p_kind text, p_original_report_id integer)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare v_id bigint;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  select r.review_id into v_id
    from public.payroll_reviews r
   where r.period = public._payroll_normalize_period(p_period) and r.report_kind = p_kind
     and coalesce(r.original_report_id, 0) = coalesce(p_original_report_id, 0)
     and r.status in ('open', 'issuing', 'issued')
   order by (r.status in ('open', 'issuing')) desc, r.review_id desc
   limit 1;
  if v_id is null then
    return jsonb_build_object('ok', true, 'review', null);
  end if;
  return public.payroll_review_get(v_id);
end;
$$;

revoke execute on function public.payroll_review_find(date, text, integer) from public, anon, authenticated;
grant execute on function public.payroll_review_find(date, text, integer) to authenticated;


-- -----------------------------------------------------------------------------
-- 4. אישור טיוטה ומועד אחרון
-- -----------------------------------------------------------------------------
create or replace function public.payroll_review_manager_approve(
  p_review_id bigint, p_expected_revision integer, p_version text)
returns jsonb
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
  v_actor text := (select auth.email());
  v public.payroll_reviews;
  v_version text;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  v := public._payroll_review_lock(p_review_id, 'update');
  perform public._payroll_review_assert_open(v);
  if v.revision <> p_expected_revision then
    perform public._payroll_raise('STALE_VERSION', 'הנתונים השתנו. יש לרענן לפני אישור.', null);
  end if;
  v_version := public._payroll_preview_version(v.period, v.report_kind, v.original_report_id);
  -- מאשרים רק את מה שרואים: הגרסה הנוכחית, שהיא גם גרסת הסבב (אחרת קודם רענון).
  if v_version is distinct from p_version or v.preview_version is distinct from p_version then
    perform public._payroll_raise('PREVIEW_CHANGED', 'הנתונים השתנו. יש לרענן לפני אישור.', null);
  end if;

  update public.payroll_reviews
     set manager_approved_version = p_version, manager_approved_by = v_actor, manager_approved_at = now()
   where review_id = v.review_id;
  perform public._payroll_review_event(v.review_id, null, null, 'manager_approved', v_actor,
                                       jsonb_build_object('version', p_version));
  return jsonb_build_object('ok', true, 'review_id', v.review_id, 'manager_approved_at', now());
end;
$$;

revoke execute on function public.payroll_review_manager_approve(bigint, integer, text) from public, anon, authenticated;
grant execute on function public.payroll_review_manager_approve(bigint, integer, text) to authenticated;


create or replace function public.payroll_review_set_deadline(
  p_review_id bigint, p_expected_revision integer, p_deadline timestamptz, p_reason text)
returns jsonb
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
  v_actor text := (select auth.email());
  v public.payroll_reviews;
  v_reason text;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  v := public._payroll_review_lock(p_review_id, 'update');
  perform public._payroll_review_assert_open(v);
  if v.revision <> p_expected_revision then
    perform public._payroll_raise('STALE_VERSION', 'הנתונים השתנו. יש לרענן לפני אישור.', null);
  end if;
  if p_deadline is null or p_deadline < now() + interval '5 minutes' or p_deadline > now() + interval '30 days' then
    perform public._payroll_raise('DEADLINE_INVALID',
      'המועד האחרון צריך להיות לפחות 5 דקות מעכשיו ולא יותר מ-30 יום.', null);
  end if;
  -- אחרי שהסיכומים יצאו, שינוי מועד מחייב סיבה (הדיילות כבר ראו את המועד הקודם).
  if v.distributed_at is not null then
    v_reason := public._payroll_review_require_text(p_reason, 5, 'reason');
  else
    v_reason := nullif(btrim(coalesce(p_reason, '')), '');
  end if;

  update public.payroll_reviews set response_deadline = p_deadline where review_id = v.review_id;

  -- קישור שכבר נשלח נשאר בתוקף לפחות 30 יום אחרי המועד החדש.
  update public.payroll_review_tokens t
     set expires_at = greatest(t.expires_at, p_deadline + interval '30 days')
    from public.payroll_review_recipients r
   where t.recipient_id = r.recipient_id and t.revoked_at is null
     and r.review_id = v.review_id and r.is_current;

  perform public._payroll_review_event(v.review_id, null, null, 'deadline_set', v_actor,
    jsonb_build_object('from', v.response_deadline, 'to', p_deadline, 'reason', v_reason));
  return jsonb_build_object('ok', true, 'response_deadline', p_deadline);
end;
$$;

revoke execute on function public.payroll_review_set_deadline(bigint, integer, timestamptz, text) from public, anon, authenticated;
grant execute on function public.payroll_review_set_deadline(bigint, integer, timestamptz, text) to authenticated;


-- -----------------------------------------------------------------------------
-- 5. הפצה, תור, קישור, שליחה חוזרת
-- -----------------------------------------------------------------------------
create or replace function public.payroll_review_distribute_begin(
  p_review_id bigint, p_expected_revision integer, p_recipient_ids bigint[], p_mode text, p_request_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
  v_actor text := (select auth.email());
  v public.payroll_reviews;
  v_prior jsonb;
  v_tpl jsonb;
  v_version text;
  v_queued jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
  v_result jsonb;
  v_attempt bigint;
  t record;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  if p_request_id is null or p_mode is null or p_mode not in ('initial', 'reminder') then
    perform public._payroll_raise('INVALID_ARGUMENT', 'בקשת השליחה אינה תקינה.', null);
  end if;
  v := public._payroll_review_lock(p_review_id, 'update');

  -- אידמפוטנטיות: אותו request_id ⇒ אותה תשובה, בלי לשלוח שוב.
  select e.payload -> 'result' into v_prior
    from public.payroll_review_events e
   where e.review_id = v.review_id and e.event_type = 'distribute'
     and e.payload ->> 'request_id' = p_request_id::text
   limit 1;
  if v_prior is not null then
    return v_prior;
  end if;

  if not (public._payroll_config()).review_mail_enabled then
    perform public._payroll_raise('ISSUE_DISABLED', 'שליחת הסיכומים לדיילות כבויה כרגע.', null);
  end if;
  perform public._payroll_review_assert_open(v);
  if v.revision <> p_expected_revision then
    perform public._payroll_raise('STALE_VERSION', 'הנתונים השתנו. יש לרענן לפני אישור.', null);
  end if;
  v_version := public._payroll_preview_version(v.period, v.report_kind, v.original_report_id);
  if v.manager_approved_version is null or v.manager_approved_version is distinct from v_version
     or v.preview_version is distinct from v_version then
    perform public._payroll_raise('MANAGER_REVIEW_REQUIRED', 'יש לאשר את הטיוטה העדכנית לפני השליחה.', null);
  end if;
  if v.response_deadline is null or v.response_deadline <= now() then
    perform public._payroll_raise('DEADLINE_INVALID', 'יש לקבוע מועד אחרון לתגובה שעוד לא עבר.', null);
  end if;
  v_tpl := public._payroll_review_template_config();
  if not (v_tpl ->> 'template_valid')::boolean then
    perform public._payroll_raise('TEMPLATE_INVALID', 'תבנית הסיכום לדיילת חסרה או לא תקינה בהגדרות.',
      jsonb_build_object('missing', v_tpl -> 'missing_tokens', 'unknown', v_tpl -> 'unknown_tokens'));
  end if;

  for t in
    select r.recipient_id, r.hostess_id, r.state, btrim(coalesce(h.email, '')) as email,
           exists (select 1 from public.payroll_mail_attempts a
                    where a.kind = 'personal_review' and a.recipient_id = r.recipient_id
                      and a.state = 'sent') as has_sent,
           exists (select 1 from public.payroll_mail_attempts a
                    where a.kind = 'personal_review' and a.recipient_id = r.recipient_id
                      and a.state in ('queued', 'sending')) as has_active,
           (p_recipient_ids is null or r.recipient_id = any (p_recipient_ids)) as targeted
      from public.payroll_review_recipients r
      left join public.hostesses h on h.hostess_id = r.hostess_id
     where r.review_id = v.review_id and r.is_current
     order by r.hostess_name, r.recipient_id
  loop
    -- בלי רשימה מפורשת: initial = מי שעוד לא קיבלה בהצלחה · reminder = מי שעוד לא השיבה.
    -- רשימה מפורשת עוקפת את הסינון (למשל מייל שתוקן אחרי שליחה מוצלחת).
    if not t.targeted then
      continue;
    end if;
    if p_recipient_ids is null and p_mode = 'initial' and t.has_sent then
      continue;
    end if;
    if p_recipient_ids is null and p_mode = 'reminder' and t.state <> 'awaiting' then
      continue;
    end if;
    if t.email = '' then
      v_skipped := v_skipped || jsonb_build_object('recipient_id', t.recipient_id, 'code', 'CONTACT_MISSING');
      continue;
    end if;
    if t.has_active then
      v_skipped := v_skipped || jsonb_build_object('recipient_id', t.recipient_id, 'code', 'DELIVERY_ACTIVE');
      continue;
    end if;
    v_attempt := public._payroll_attempt_reserve('personal_review', null, t.recipient_id, null, t.email,
                                                 v_tpl ->> 'template_name',
                                                 case when p_mode = 'reminder' then 'reminder' else 'initial' end,
                                                 null, v_actor);
    v_queued := v_queued || to_jsonb(v_attempt);
  end loop;

  -- מזהים מפורשים שאינם נמענת נוכחית בסבב הזה — מדווחים, לא נבלעים.
  select v_skipped || coalesce(jsonb_agg(jsonb_build_object('recipient_id', x, 'code', 'NOT_CURRENT')), '[]'::jsonb)
    into v_skipped
    from unnest(coalesce(p_recipient_ids, '{}')) x
   where not exists (select 1 from public.payroll_review_recipients r
                      where r.recipient_id = x and r.review_id = v.review_id and r.is_current);

  update public.payroll_reviews set distributed_at = coalesce(distributed_at, now())
   where review_id = v.review_id;

  v_result := jsonb_build_object(
    'ok', true, 'queued', v_queued, 'skipped', v_skipped,
    'template', jsonb_build_object('name', v_tpl ->> 'template_name', 'body', v_tpl ->> 'template_body',
                                   'sha256', v_tpl ->> 'template_sha256'));
  perform public._payroll_review_event(v.review_id, null, null, 'distribute', v_actor,
    jsonb_build_object('request_id', p_request_id, 'mode', p_mode, 'result', v_result));
  return v_result;
end;
$$;

revoke execute on function public.payroll_review_distribute_begin(bigint, integer, bigint[], text, uuid) from public, anon, authenticated;
grant execute on function public.payroll_review_distribute_begin(bigint, integer, bigint[], text, uuid) to authenticated;


create or replace function public.payroll_review_queued_attempts(p_review_id bigint, p_limit integer default 8)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v public.payroll_reviews;
  v_tpl jsonb;
  v_seq int;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  select * into v from public.payroll_reviews where review_id = p_review_id;
  if v.review_id is null then
    perform public._payroll_raise('REVIEW_NOT_FOUND', 'סבב הבדיקה לא נמצא.', null);
  end if;
  v_tpl := public._payroll_review_template_config();
  v_seq := public._payroll_review_supplement_seq(v);

  return jsonb_build_object(
    'ok', true,
    'attempts', coalesce((
      select jsonb_agg(x.obj order by x.attempt_id)
        from (select a.attempt_id,
                     jsonb_build_object('attempt_id', a.attempt_id, 'recipient_id', a.recipient_id,
                                        'hostess_name', r.hostess_name, 'intended_recipient', a.intended_recipient,
                                        'deadline', v.response_deadline, 'period', v.period,
                                        'kind', v.report_kind, 'supplement_seq', v_seq) as obj
                from public.payroll_mail_attempts a
                join public.payroll_review_recipients r on r.recipient_id = a.recipient_id
               where a.kind = 'personal_review' and a.state = 'queued' and r.review_id = v.review_id
               order by a.attempt_id
               limit greatest(1, least(coalesce(p_limit, 8), 50))) x), '[]'::jsonb),
    'remaining', (select count(*) from public.payroll_mail_attempts a
                    join public.payroll_review_recipients r on r.recipient_id = a.recipient_id
                   where a.kind = 'personal_review' and a.state = 'queued' and r.review_id = v.review_id),
    'template', jsonb_build_object('name', v_tpl ->> 'template_name', 'body', v_tpl ->> 'template_body',
                                   'sha256', v_tpl ->> 'template_sha256'));
end;
$$;

revoke execute on function public.payroll_review_queued_attempts(bigint, integer) from public, anon, authenticated;
grant execute on function public.payroll_review_queued_attempts(bigint, integer) to authenticated;


-- טביעת קישור (svc בלבד, חוזה D10 + F4). הטוקן הגולמי מוחזר פעם אחת; נשמר רק sha256 שלו.
-- base64url אינו קיים ב-PG17 ⇒ base64 + החלפת +/ ב- -_ והסרת '=' (43 תווים).
create or replace function public.payroll_review_mint_token(
  p_recipient_id bigint, p_attempt_id bigint, p_actor_email text)
returns text
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
  r public.payroll_review_recipients;
  v public.payroll_reviews;
  v_token text;
begin
  perform public._payroll_actor_assert(p_actor_email, 'כספים', array['edit']);
  select * into r from public.payroll_review_recipients where recipient_id = p_recipient_id;
  if r.recipient_id is null then
    perform public._payroll_raise('STALE_VERSION', 'הסיכום הזה כבר הוחלף.', null);
  end if;
  v := public._payroll_review_lock(r.review_id, 'share');
  if not r.is_current or v.status <> 'open' then
    perform public._payroll_raise('STALE_VERSION', 'הסיכום הזה כבר הוחלף.', null);
  end if;
  if not exists (select 1 from public.payroll_mail_attempts a
                  where a.attempt_id = p_attempt_id and a.kind = 'personal_review'
                    and a.recipient_id = p_recipient_id) then
    perform public._payroll_raise('STALE_ATTEMPT', 'ניסיון השליחה לא שייך לסיכום הזה.', null);
  end if;
  if v.response_deadline is null then
    perform public._payroll_raise('DEADLINE_INVALID', 'יש לקבוע מועד אחרון לפני שליחה.', null);
  end if;

  v_token := rtrim(translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'), '=');
  insert into public.payroll_review_tokens (recipient_id, token_hash, expires_at)
  values (p_recipient_id, pg_catalog.sha256(convert_to(v_token, 'UTF8')), v.response_deadline + interval '30 days');
  return v_token;
end;
$$;

revoke execute on function public.payroll_review_mint_token(bigint, bigint, text) from public, anon, authenticated;
grant execute on function public.payroll_review_mint_token(bigint, bigint, text) to service_role;


-- שליחה חוזרת לדיילת אחת (חוזה §2.3 השורה האחרונה + F1).
create or replace function public.payroll_review_resend_reserve(
  p_recipient_id bigint, p_prior_attempt_id bigint, p_acknowledge_unknown boolean)
returns jsonb
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
  v_actor text := (select auth.email());
  r public.payroll_review_recipients;
  v public.payroll_reviews;
  a public.payroll_mail_attempts;
  v_state text;
  v_email text;
  v_attempt bigint;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  select * into r from public.payroll_review_recipients where recipient_id = p_recipient_id;
  if r.recipient_id is null then
    perform public._payroll_raise('STALE_VERSION', 'הסיכום הזה כבר הוחלף.', null);
  end if;
  v := public._payroll_review_lock(r.review_id, 'share');
  if not (public._payroll_config()).review_mail_enabled then
    perform public._payroll_raise('ISSUE_DISABLED', 'שליחת הסיכומים לדיילות כבויה כרגע.', null);
  end if;
  if not r.is_current or v.status <> 'open' then
    perform public._payroll_raise('STALE_VERSION', 'הסיכום הזה כבר הוחלף.', null);
  end if;

  select * into a from public.payroll_mail_attempts
   where kind = 'personal_review' and recipient_id = p_recipient_id
   order by attempt_id desc limit 1 for update;
  if a.attempt_id is null or a.attempt_id <> p_prior_attempt_id then
    perform public._payroll_raise('STALE_VERSION', 'מצב השליחה השתנה. יש לרענן.', null);
  end if;

  v_state := public._payroll_attempt_effective_state(a);
  if v_state = 'unknown' and not coalesce(p_acknowledge_unknown, false) then
    perform public._payroll_raise('DELIVERY_UNKNOWN', 'לא ידוע אם הסיכום נשלח. יש לבדוק לפני שליחה חוזרת.', null);
  end if;
  if v_state not in ('failed', 'unknown') then
    perform public._payroll_raise('NOT_RETRYABLE', 'אפשר לשלוח שוב רק אחרי כשל ידוע.', null);
  end if;

  -- F1: ניסיון שתקוע ב-sending אחרי שהחוזה פג נשמר כ-unknown לפני ההזמנה החדשה,
  -- אחרת האינדקס החלקי (queued/sending) היה חוסם אותה.
  -- (העזר של A, _payroll_attempt_persist_unknown — אותו מעבר בדיוק כמו בשליחה חוזרת לרו"ח.)
  if v_state = 'unknown' then
    perform public._payroll_attempt_persist_unknown(a.attempt_id);
  end if;

  select btrim(coalesce(h.email, '')) into v_email from public.hostesses h where h.hostess_id = r.hostess_id;
  if coalesce(v_email, '') = '' then
    perform public._payroll_raise('CONTACT_MISSING', 'לדיילת אין כתובת מייל.', null);
  end if;

  v_attempt := public._payroll_attempt_reserve('personal_review', null, r.recipient_id, null, v_email,
                 'תבנית_מייל_סיכום_שעות_דיילת',
                 case when v_state = 'unknown' then 'unknown_reviewed_resend' else 'known_failure_retry' end,
                 a.attempt_id, v_actor);
  perform public._payroll_review_event(v.review_id, r.recipient_id, null, 'resend_reserved', v_actor,
    jsonb_build_object('prior_attempt_id', a.attempt_id, 'prior_state', v_state, 'attempt_id', v_attempt));
  return jsonb_build_object('ok', true, 'attempt_id', v_attempt);
end;
$$;

revoke execute on function public.payroll_review_resend_reserve(bigint, bigint, boolean) from public, anon, authenticated;
grant execute on function public.payroll_review_resend_reserve(bigint, bigint, boolean) to authenticated;


-- -----------------------------------------------------------------------------
-- 6. פניות והחלטות מנהלת
-- -----------------------------------------------------------------------------
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
               'event_name', p.event_name, 'salary_report_id', s.salary_report_id)
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

revoke execute on function public.payroll_review_case_detail(bigint) from public, anon, authenticated;
grant execute on function public.payroll_review_case_detail(bigint) to authenticated;


-- הנמענת הנוכחית עוברת ל-manager_resolved רק כשהתקציר שלה עדיין עדכני ואין לה פנייה פתוחה
-- אחרת. אחרת — רענון והחלטה חדשה יגיעו בהמשך; לא מסמנים "טופל" על נתונים שהשתנו.
create or replace function public._payroll_review_mark_resolved(
  p_review public.payroll_reviews, p_hostess_id bigint, p_actor text, p_reason text)
returns boolean
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
  r public.payroll_review_recipients;
  v_fresh text;
begin
  select * into r from public.payroll_review_recipients
   where review_id = p_review.review_id and hostess_id = p_hostess_id and is_current
   for update;
  if r.recipient_id is null then
    return false;
  end if;
  if exists (select 1 from public.payroll_review_cases c
              where c.review_id = p_review.review_id and c.hostess_id = p_hostess_id
                and c.phase = 'pre_issue' and c.status in ('open', 'correction_pending')) then
    return false;
  end if;
  select d.digest into v_fresh
    from public._payroll_hostess_digests(p_review.period, p_review.report_kind, p_review.original_report_id) d
   where d.hostess_id = p_hostess_id;
  if v_fresh is distinct from r.digest then
    return false;
  end if;
  update public.payroll_review_recipients
     set state = 'manager_resolved', decided_kind = 'manager', decided_at = now(),
         decided_by = p_actor, decision_reason = p_reason
   where recipient_id = r.recipient_id;
  return true;
end;
$$;

revoke execute on function public._payroll_review_mark_resolved(public.payroll_reviews, bigint, text, text)
  from public, anon, authenticated;


-- החלטה על פנייה (חוזה §2.2 + F5): reject · accept (→ ממתין לתיקון) · accept_corrected ·
-- accept_noted ("טופל מחוץ לדוח") · reopen · close (פנייה אחרי הפקה; לעולם לא משנה כסף).
create or replace function public.payroll_review_resolve_case(
  p_case_id bigint, p_expected_case_revision integer, p_outcome text, p_reason text, p_evidence text)
returns jsonb
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
  v_actor text := (select auth.email());
  c public.payroll_review_cases;
  v public.payroll_reviews;
  v_reason text;
  v_status text;
  v_resolved boolean := false;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  select * into c from public.payroll_review_cases where case_id = p_case_id;
  if c.case_id is null then
    perform public._payroll_raise('CASE_NOT_FOUND', 'הפנייה לא נמצאה.', null);
  end if;
  v := public._payroll_review_lock(c.review_id, 'share');
  select * into c from public.payroll_review_cases where case_id = p_case_id for update;
  if c.revision <> p_expected_case_revision then
    perform public._payroll_raise('STALE_VERSION', 'הפנייה עודכנה בינתיים. יש לרענן.', null);
  end if;

  -- פנייה אחרי הפקה: רק close, מפנייה פתוחה.
  if c.phase = 'post_issue' then
    if p_outcome <> 'close' or c.status <> 'open' then
      perform public._payroll_raise('INVALID_TRANSITION', 'אי-אפשר לבצע את הפעולה הזו על הפנייה.', null);
    end if;
    v_reason := public._payroll_review_require_text(p_reason, 5, 'reason');
    v_status := 'closed_post_issue';
  else
    perform public._payroll_review_assert_open(v);
    v_status := case
      when p_outcome = 'reject' and c.status in ('open', 'correction_pending') then 'resolved_rejected'
      when p_outcome = 'accept' and c.status = 'open' then 'correction_pending'
      when p_outcome = 'accept_corrected' and c.status in ('open', 'correction_pending') then 'resolved_accepted'
      when p_outcome = 'accept_noted' and c.status in ('open', 'correction_pending') then 'resolved_noted'
      when p_outcome = 'reopen' and c.status = 'correction_pending' then 'open'
      else null end;
    if v_status is null then
      perform public._payroll_raise('INVALID_TRANSITION', 'אי-אפשר לבצע את הפעולה הזו על הפנייה.', null);
    end if;
    v_reason := public._payroll_review_require_text(p_reason, case when p_outcome = 'accept_noted' then 10 else 5 end, 'reason');
    if p_outcome = 'accept_corrected'
       and not exists (select 1 from public.payroll_source_corrections x where x.case_id = c.case_id) then
      perform public._payroll_raise('CORRECTION_REQUIRED', 'אין תיקון שמור לפנייה הזו. יש לשמור תיקון קודם.', null);
    end if;
  end if;

  update public.payroll_review_cases
     set status = v_status, revision = revision + 1, resolution_reason = v_reason,
         resolved_by = case when v_status in ('open', 'correction_pending') then null else v_actor end,
         resolved_at = case when v_status in ('open', 'correction_pending') then null else now() end
   where case_id = c.case_id;

  if v_status in ('resolved_rejected', 'resolved_noted') then
    v_resolved := public._payroll_review_mark_resolved(v, c.hostess_id, v_actor, v_reason);
  end if;

  perform public._payroll_review_event(c.review_id, c.recipient_id, c.case_id, 'case_' || p_outcome, v_actor,
    jsonb_build_object('from', c.status, 'to', v_status, 'reason', v_reason,
                       'evidence', nullif(btrim(coalesce(p_evidence, '')), '')));
  return jsonb_build_object('ok', true, 'case_id', c.case_id, 'status', v_status,
                            'revision', c.revision + 1, 'recipient_resolved', v_resolved);
end;
$$;

revoke execute on function public.payroll_review_resolve_case(bigint, integer, text, text, text) from public, anon, authenticated;
grant execute on function public.payroll_review_resolve_case(bigint, integer, text, text, text) to authenticated;


-- "אשר לפי תיעוד" — אחרי המועד, לדיילת שלא השיבה. נרשם כהחלטת מנהלת, לעולם לא כאישור דיילת.
create or replace function public.payroll_review_approve_no_response(
  p_recipient_id bigint, p_expected_digest text, p_reason text, p_evidence text, p_contact_note text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
  v_actor text := (select auth.email());
  r public.payroll_review_recipients;
  v public.payroll_reviews;
  v_reason text;
  v_evidence text;
  v_note text;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  select * into r from public.payroll_review_recipients where recipient_id = p_recipient_id;
  if r.recipient_id is null then
    perform public._payroll_raise('STALE_VERSION', 'הסיכום הזה כבר הוחלף.', null);
  end if;
  v := public._payroll_review_lock(r.review_id, 'share');
  perform public._payroll_review_assert_open(v);
  select * into r from public.payroll_review_recipients where recipient_id = p_recipient_id for update;
  if not r.is_current or r.digest is distinct from p_expected_digest or r.state <> 'awaiting' then
    perform public._payroll_raise('STALE_VERSION', 'הנתונים השתנו. יש לרענן לפני אישור.', null);
  end if;
  if v.response_deadline is null or now() <= v.response_deadline then
    perform public._payroll_raise('DEADLINE_NOT_PASSED', 'אפשר לאשר לפי תיעוד רק אחרי המועד האחרון לתגובה.', null);
  end if;
  if exists (select 1 from public.payroll_review_cases c
              where c.review_id = v.review_id and c.hostess_id = r.hostess_id
                and c.phase = 'pre_issue' and c.status in ('open', 'correction_pending')) then
    perform public._payroll_raise('OBJECTION_OPEN', 'לדיילת יש פנייה פתוחה. יש לטפל בה קודם.', null);
  end if;
  v_reason := public._payroll_review_require_text(p_reason, 5, 'reason');
  v_evidence := public._payroll_review_require_text(p_evidence, 5, 'evidence');
  -- בלי שליחה מוצלחת לסיכום הזה — חובה לתעד איך נוצר קשר (או למה לא).
  if not exists (select 1 from public.payroll_mail_attempts a
                  where a.kind = 'personal_review' and a.recipient_id = r.recipient_id and a.state = 'sent') then
    if p_contact_note is null or length(btrim(p_contact_note)) < 5 then
      perform public._payroll_raise('CONTACT_EVIDENCE_REQUIRED',
        'הסיכום לא נשלח לדיילת בהצלחה. יש לתעד איך נוצר איתה קשר.', null);
    end if;
  end if;
  v_note := nullif(btrim(coalesce(p_contact_note, '')), '');

  update public.payroll_review_recipients
     set state = 'manager_approved_no_response', decided_kind = 'manager', decided_at = now(),
         decided_by = v_actor, decision_reason = v_reason, decision_evidence = v_evidence, contact_note = v_note
   where recipient_id = r.recipient_id;
  perform public._payroll_review_event(v.review_id, r.recipient_id, null, 'approved_no_response', v_actor,
    jsonb_build_object('reason', v_reason, 'evidence', v_evidence, 'contact_note', v_note));
  return jsonb_build_object('ok', true, 'recipient_id', r.recipient_id, 'state', 'manager_approved_no_response');
end;
$$;

revoke execute on function public.payroll_review_approve_no_response(bigint, text, text, text, text) from public, anon, authenticated;
grant execute on function public.payroll_review_approve_no_response(bigint, text, text, text, text) to authenticated;


create or replace function public.payroll_review_cancel(p_review_id bigint, p_reason text)
returns jsonb
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
  v_actor text := (select auth.email());
  v public.payroll_reviews;
  v_reason text;
begin
  perform public.assert_module_permission('כספים', array['edit']);
  v := public._payroll_review_lock(p_review_id, 'update');
  perform public._payroll_review_assert_open(v);
  if exists (select 1 from public.payroll_operations o
              where o.review_id = v.review_id and o.state in ('preparing', 'prepared')) then
    perform public._payroll_raise('OPERATION_ACTIVE', 'יש הפקה בתהליך. אי-אפשר לבטל עכשיו.', null);
  end if;
  v_reason := public._payroll_review_require_text(p_reason, 5, 'reason');

  update public.payroll_reviews set status = 'cancelled', cancelled_reason = v_reason where review_id = v.review_id;
  update public.payroll_review_tokens t
     set revoked_at = now(), revoked_reason = 'cancelled'
    from public.payroll_review_recipients r
   where t.recipient_id = r.recipient_id and t.revoked_at is null and r.review_id = v.review_id;
  perform public._payroll_review_event(v.review_id, null, null, 'cancelled', v_actor,
                                       jsonb_build_object('reason', v_reason));
  return jsonb_build_object('ok', true, 'review_id', v.review_id, 'status', 'cancelled');
end;
$$;

revoke execute on function public.payroll_review_cancel(bigint, text) from public, anon, authenticated;
grant execute on function public.payroll_review_cancel(bigint, text) to authenticated;
