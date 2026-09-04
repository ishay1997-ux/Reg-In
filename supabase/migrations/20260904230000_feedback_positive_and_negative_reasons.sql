-- =============================================================================
-- מיגרציה: הוספת הדגש חיובי למשוב ועדכון submit_feedback
-- =============================================================================

-- 1. הוספת עמודת positive_feedback_reason לטבלת projects עם אילוץ ערכים מותרים
alter table public.projects
  add column if not exists positive_feedback_reason text;

alter table public.projects
  drop constraint if exists projects_positive_feedback_reason_check;

alter table public.projects
  add constraint projects_positive_feedback_reason_check
    check (positive_feedback_reason is null
           or positive_feedback_reason in
              ('מקצועיות הדיילות', 'עמידה בזמנים', 'איכות תגים וציוד', 'ניהול ותקשורת', 'אחר'));

comment on column public.projects.positive_feedback_reason is
  'צ''יפ הדגש חיובי שנבחר ע"י הלקוח בסקר שביעות הרצון (ציונים 4–5)';

-- 2. הסרת הפונקציה הישנה והקמת submit_feedback מעודכנת עם קליטת נימוקים
drop function if exists public.submit_feedback(text, integer, text);

create or replace function public.submit_feedback(
  p_token text,
  p_score integer,
  p_notes text default null,
  p_negative_reason text default null,
  p_positive_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_id integer;
  v_status text;
  v_neg text;
  v_pos text;
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
  -- ציון 1–3: נשמרת סיבה שלילית (אם סופקה ותקפה), וחיובית מתאפסת
  -- ציון 4–5: נשמרת סיבה חיובית (אם סופקה ותקפה), ושלילית מתאפסת
  if p_score <= 3 then
    v_neg := nullif(btrim(coalesce(p_negative_reason, '')), '');
    if v_neg is not null and v_neg not in ('איחור דיילות', 'תפקוד דיילות', 'איכות תגים', 'ניהול לקוי', 'אחר') then
      v_neg := null;
    end if;
    v_pos := null;
  else
    v_pos := nullif(btrim(coalesce(p_positive_reason, '')), '');
    if v_pos is not null and v_pos not in ('מקצועיות הדיילות', 'עמידה בזמנים', 'איכות תגים וציוד', 'ניהול ותקשורת', 'אחר') then
      v_pos := null;
    end if;
    v_neg := null;
  end if;

  update public.projects
     set feedback_score = p_score,
         negative_feedback_reason = v_neg,
         positive_feedback_reason = v_pos,
         feedback_notes = nullif(btrim(coalesce(p_notes, '')), ''),
         feedback_status = 'completed'
   where project_id = v_id;

  return jsonb_build_object('state', 'ok');
end;
$$;

revoke execute on function public.submit_feedback(text, integer, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_feedback(text, integer, text, text, text) to anon, authenticated;

-- 3. עדכון get_project_finance_detail להחזרת positive_feedback_reason למסך הכספים
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
    p.feedback_status, p.feedback_score, p.negative_feedback_reason, p.positive_feedback_reason, p.feedback_notes,
    p.cancelled_at, p.cancel_type, pf.archived_at
  from public.projects p
  left join public.project_finance pf on pf.project_id = p.project_id
  cross join lateral public.finance_project_money(p.project_id) m
  where p.project_id = p_project_id;
end;
$$;

revoke execute on function public.get_project_finance_detail(integer) from public, anon, authenticated;
grant execute on function public.get_project_finance_detail(integer) to authenticated;
