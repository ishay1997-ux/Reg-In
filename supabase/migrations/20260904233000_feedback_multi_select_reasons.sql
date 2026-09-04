-- =============================================================================
-- מיגרציה: שדרוג משוב לקוח לבחירה מרובה (Multi-Select) של צ'יפים
-- =============================================================================

-- 1. הוספת עמודות מערך negative_feedback_reasons ו-positive_feedback_reasons
alter table public.projects
  add column if not exists negative_feedback_reasons text[] default '{}';

alter table public.projects
  add column if not exists positive_feedback_reasons text[] default '{}';

-- סנכרון ראשוני משורות קיימות
update public.projects
   set negative_feedback_reasons = array[negative_feedback_reason]
 where negative_feedback_reason is not null
   and (negative_feedback_reasons is null or cardinality(negative_feedback_reasons) = 0);

update public.projects
   set positive_feedback_reasons = array[positive_feedback_reason]
 where positive_feedback_reason is not null
   and (positive_feedback_reasons is null or cardinality(positive_feedback_reasons) = 0);

-- אילוצי ערכים מותרים על המערכים
alter table public.projects
  drop constraint if exists projects_negative_feedback_reasons_check;

alter table public.projects
  add constraint projects_negative_feedback_reasons_check
    check (negative_feedback_reasons is null
           or negative_feedback_reasons <@ array['איחור דיילות', 'תפקוד דיילות', 'איכות תגים', 'ניהול לקוי', 'אחר']);

alter table public.projects
  drop constraint if exists projects_positive_feedback_reasons_check;

alter table public.projects
  add constraint projects_positive_feedback_reasons_check
    check (positive_feedback_reasons is null
           or positive_feedback_reasons <@ array['מקצועיות הדיילות', 'עמידה בזמנים', 'איכות תגים וציוד', 'ניהול ותקשורת', 'אחר']);

comment on column public.projects.negative_feedback_reasons is
  'מערך צ''יפים לסיבות אי-שביעות רצון (ציונים 1–3)';

comment on column public.projects.positive_feedback_reasons is
  'מערך צ''יפים להדגשים לשימור/חוזקות (ציונים 4–5)';

-- 2. שדרוג submit_feedback לקבלת מערכי סיבות וסנכרון דו-כיווני
drop function if exists public.submit_feedback(text, integer, text, text, text);
drop function if exists public.submit_feedback(text, integer, text, text[], text[]);

create or replace function public.submit_feedback(
  p_token text,
  p_score integer,
  p_notes text default null,
  p_negative_reasons text[] default '{}',
  p_positive_reasons text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_id integer;
  v_status text;
  v_clean_negs text[];
  v_clean_pos text[];
  v_neg_single text;
  v_pos_single text;
begin
  perform public.feedback_rate_limit();

  if p_token is null or btrim(p_token) = '' then
    return jsonb_build_object('state', 'not_found');
  end if;

  select p.project_id, p.feedback_status into v_id, v_status
    from public.projects p where p.feedback_token = p_token;

  if v_id is null then
    return jsonb_build_object('state', 'not_found');
  end if;

  if v_status = 'completed' then
    return jsonb_build_object('state', 'already');
  end if;

  if p_score is null or p_score < 1 or p_score > 5 then
    return jsonb_build_object('state', 'invalid');
  end if;

  -- ולידציה וטיהור לפי ציון:
  -- ציון 1–3: נשמרות סיבות שליליות, חיוביות מתאפסות
  -- ציון 4–5: נשמרות סיבות חיוביות, שליליות מתאפסות
  if p_score <= 3 then
    if p_negative_reasons is not null and cardinality(p_negative_reasons) > 0 then
      select coalesce(array_agg(distinct x), '{}')
        into v_clean_negs
        from unnest(p_negative_reasons) x
       where x in ('איחור דיילות', 'תפקוד דיילות', 'איכות תגים', 'ניהול לקוי', 'אחר');
    else
      v_clean_negs := '{}';
    end if;

    v_clean_pos := '{}';
    v_neg_single := case when cardinality(v_clean_negs) > 0 then v_clean_negs[1] else null end;
    v_pos_single := null;
  else
    if p_positive_reasons is not null and cardinality(p_positive_reasons) > 0 then
      select coalesce(array_agg(distinct x), '{}')
        into v_clean_pos
        from unnest(p_positive_reasons) x
       where x in ('מקצועיות הדיילות', 'עמידה בזמנים', 'איכות תגים וציוד', 'ניהול ותקשורת', 'אחר');
    else
      v_clean_pos := '{}';
    end if;

    v_clean_negs := '{}';
    v_pos_single := case when cardinality(v_clean_pos) > 0 then v_clean_pos[1] else null end;
    v_neg_single := null;
  end if;

  update public.projects
     set feedback_score = p_score,
         negative_feedback_reasons = v_clean_negs,
         negative_feedback_reason = v_neg_single,
         positive_feedback_reasons = v_clean_pos,
         positive_feedback_reason = v_pos_single,
         feedback_notes = nullif(btrim(coalesce(p_notes, '')), ''),
         feedback_status = 'completed'
   where project_id = v_id;

  return jsonb_build_object('state', 'ok');
end;
$$;

revoke execute on function public.submit_feedback(text, integer, text, text[], text[]) from public, anon, authenticated;
grant execute on function public.submit_feedback(text, integer, text, text[], text[]) to anon, authenticated;

-- 3. שדרוג record_feedback לקבלת p_reasons
drop function if exists public.record_feedback(integer, integer, text, text, boolean);
drop function if exists public.record_feedback(integer, integer, text, text, boolean, text[]);

create or replace function public.record_feedback(
  p_project_id integer,
  p_score integer default null,
  p_reason text default null,
  p_notes text default null,
  p_mark_no_response boolean default false,
  p_reasons text[] default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_status text;
  v_text text;
  v_threshold integer;
  v_clean_negs text[] := '{}';
  v_neg_single text := null;
begin
  v_status := public.finance_assert_writable(p_project_id);

  if p_mark_no_response then
    update public.projects
       set feedback_status = 'no_response'
     where project_id = p_project_id;
    return jsonb_build_object('ok', true, 'feedback_status', 'no_response');
  end if;

  if p_score is null or p_score < 1 or p_score > 5 then
    raise exception 'ציון המשוב חייב להיות בין 1 ל-5.' using errcode = 'P0001';
  end if;

  select param_value into v_text from public.params where param_name = 'סף_שביעות_רצון';
  if v_text is null or btrim(v_text) !~ '^[0-9]+$' then
    raise exception 'סף שביעות-הרצון אינו מוגדר בהגדרות המערכת (פרמטר סף_שביעות_רצון) — לא ניתן לרשום משוב'
      using errcode = 'P0001';
  end if;
  v_threshold := btrim(v_text)::integer;

  -- איסוף סיבות אם סופקו במערך או במחרוזת בודדת
  if p_reasons is not null and cardinality(p_reasons) > 0 then
    select coalesce(array_agg(distinct x), '{}')
      into v_clean_negs
      from unnest(p_reasons) x
     where x in ('איחור דיילות', 'תפקוד דיילות', 'איכות תגים', 'ניהול לקוי', 'אחר');
  elsif p_reason is not null and btrim(p_reason) <> '' then
    if p_reason in ('איחור דיילות', 'תפקוד דיילות', 'איכות תגים', 'ניהול לקוי', 'אחר') then
      v_clean_negs := array[p_reason];
    end if;
  end if;

  if p_score < v_threshold and cardinality(v_clean_negs) = 0 then
    raise exception 'ציון נמוך מ-% מחייב בחירת סיבה מהרשימה לאחר בירור טלפוני.', v_threshold
      using errcode = 'P0001';
  end if;

  if p_score < v_threshold then
    v_neg_single := v_clean_negs[1];
  else
    v_clean_negs := '{}';
    v_neg_single := null;
  end if;

  update public.projects
     set feedback_score = p_score,
         negative_feedback_reasons = v_clean_negs,
         negative_feedback_reason = v_neg_single,
         positive_feedback_reasons = case when p_score >= v_threshold then positive_feedback_reasons else '{}' end,
         positive_feedback_reason = case when p_score >= v_threshold then positive_feedback_reason else null end,
         feedback_notes = coalesce(p_notes, feedback_notes),
         feedback_status = 'completed'
   where project_id = p_project_id;

  return jsonb_build_object('ok', true, 'feedback_status', 'completed');
end;
$$;

revoke execute on function public.record_feedback(integer, integer, text, text, boolean, text[]) from public, anon, authenticated;
grant execute on function public.record_feedback(integer, integer, text, text, boolean, text[]) to authenticated;

-- 4. עדכון get_project_finance_detail להחזרת המערכים
drop function if exists public.get_project_finance_detail(integer);

create or replace function public.get_project_finance_detail(p_project_id integer)
returns table (
  project_id        integer,
  event_name        text,
  customer_id       bigint,
  customer_name     text,
  project_status    text,
  revenue           numeric,
  goods_cost        numeric,
  labor_cost        numeric,
  travel_cost       numeric,
  gross_profit      numeric,
  budget_deviation  numeric,
  planned_hours     numeric,
  paid_shift_count  integer,
  finally_approved_count integer,
  final_profit      numeric,
  cancellation_fee  numeric,
  cancellation_fee_note text,
  written_off       boolean,
  written_off_reason text,
  invoice_file_url  text,
  invoice_sent      boolean,
  invoice_sent_at   timestamptz,
  payment_date      date,
  payment_terms_days integer,
  feedback_status   text,
  feedback_score    integer,
  negative_feedback_reason text,
  positive_feedback_reason text,
  negative_feedback_reasons text[],
  positive_feedback_reasons text[],
  feedback_notes    text,
  cancelled_at      timestamptz,
  cancel_type       text,
  archived_at       timestamptz
)
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_terms integer;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  select pa.param_value::integer into v_terms
    from public.params pa where pa.param_name = 'תנאי_תשלום_ימים';

  return query
  select
    p.project_id, p.event_name, p.customer_id, p.customer_name, p.project_status,
    m.revenue, m.goods_cost, m.labor_cost, m.travel_cost, m.gross_profit,
    m.budget_deviation, m.planned_hours, m.paid_shift_count, m.finally_approved_count,
    pf.final_profit, pf.cancellation_fee, pf.cancellation_fee_note,
    coalesce(pf.written_off, false), pf.written_off_reason, pf.invoice_file_url,
    p.invoice_sent, p.invoice_sent_at, p.payment_date, v_terms,
    p.feedback_status, p.feedback_score, p.negative_feedback_reason, p.positive_feedback_reason,
    coalesce(p.negative_feedback_reasons, '{}'), coalesce(p.positive_feedback_reasons, '{}'),
    p.feedback_notes,
    p.cancelled_at, p.cancel_type, pf.archived_at
  from public.projects p
  left join public.project_finance pf on pf.project_id = p.project_id
  cross join lateral public.finance_project_money(p.project_id) m
  where p.project_id = p_project_id;
end;
$$;

revoke execute on function public.get_project_finance_detail(integer) from public, anon, authenticated;
grant execute on function public.get_project_finance_detail(integer) to authenticated;
