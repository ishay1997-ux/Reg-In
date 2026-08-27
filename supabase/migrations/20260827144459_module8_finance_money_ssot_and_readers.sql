-- =============================================================================
-- מודול 8 · מיגרציה E1 · צעד 1.5 (חלק א מתוך שניים) — שכבת-החישוב והקוראים
-- =============================================================================
-- למה שני חלקים: המדריך מתיר ("או שתיים אם משפחת-הקוראים מצדיקה קובץ משלה").
-- כאן נולד **מקור-האמת היחיד של הכסף** ושני הקוראים שצורכים אותו; חלק ב יביא את
-- חמש פעולות-הכתיבה, פתרון-דמי-הביטול, הארכוב וטרנזקציית-השכר — כולן קוראות
-- לפונקציה שנולדת כאן. פיצול = לכל חצי אימות משלו, ואף אחד לא קבור בענק.
--
-- 🔴 **מוקש R4-F1/F5 — הסיבה שהכול DEFINER:** מנהלת-הכספים **חסומה ב-RLS**
-- מ'לוגיסטיקה' ומ'דיילות'. קריאת-צד-לקוח של שיבוצים או סחורה מחזירה `[]`
-- **בלי שגיאה** ⇒ הרווח היה יוצא מנופח והחשבונית קטנה, בשקט. לכן כל קריאה
-- שהמתמטיקה צריכה רצה כאן, מאושרת מול 'כספים' ב-`assert_module_permission`.
--
-- 🔑 **הנוסחאות — מהאפיון המאושר, ואומתו מול העוגן שחושב ביד לפני שנכתבה שורה:**
--   הכנסות (ה2)   = preVat של ההצעה + Σ שינויי-תכולה **בסימן** (הקטנה=שלילי, בלי abs — R3-10)
--   סחורה  (ה17/ה26) = Σ (כמות-מוזמנת מעודכנת-שינויים × closing_unit_cost) — משורות-ההצעה,
--                    **לא מהלוגיסטיקה**, ו**לא** `actual_qty`
--   עבודה  (ה7)   = Σ (actual_hours × hourly_rate_snapshot + personal_bonus)
--   נסיעות (ה14/ה29/B-16) = `סכום_נסיעות_למשמרת` × מספר שיבוצים ש-`actual_hours > 0`
--   רווח          = הכנסות − סחורה − עבודה − נסיעות
--
-- 🔴 **וההחלטה שהעוגן חשף, ושאף בדיקה שאכתוב בעצמי לא הייתה תופסת:**
--   לשורת-ההצעה של הדיילות (`04ST`) יש `closing_unit_cost` משלה (300.00 ליחידה).
--   ספירתה כ"סחורה" הייתה מוסיפה 1,200 ₪ עלות לפרויקט #13 ומחזירה רווח 2,450
--   במקום 3,650. **העוגן המחושב-ביד קובע: עלות-הדיילות נלקחת מהשיבוצים בלבד**,
--   ולכן רכיב-הסחורה מסנן `products.category = 'hostess'` החוצה. אומת חי 27/08/2026:
--   הכנסות 5,300.00 · סחורה 1,650.00 · עבודה 0 · **רווח 3,650.00** = spec §③3.
--
-- ⚠️ סטיית-תקציב (ה18) — צד-העבודה בלבד; הסחורה אינה תורמת (בסיס זהה, ה17).
-- ⚠️ שעות-מתוכננות נגזרות מ-`final_end_time − final_start_time` ושתיהן **nullable**
--    (T7) ⇒ החזרה היא NULL מפורש, לעולם לא 0. אפס היה נראה כמו "לא הגיע פיצוי".
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. מקור-האמת של הכסף — פונקציה פנימית אחת שכולם קוראים לה
-- -----------------------------------------------------------------------------
-- 🚫 **אינה חשופה ללקוח.** נקראת רק מתוך הפונקציות המאושרות שמתחתיה ומחלק ב'.
-- אילו כל קורא היה מחשב לעצמו, היו לנו שני מספרי-רווח — וזה בדיוק מה ש-F16 אוסר.
create or replace function finance_project_money(p_project_id integer)
returns table (
  revenue           numeric,
  goods_cost        numeric,
  labor_cost        numeric,
  travel_cost       numeric,
  gross_profit      numeric,
  budget_deviation  numeric,
  planned_hours     numeric,
  paid_shift_count  integer,
  finally_approved_count integer
)
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_quote_id      integer;
  v_discount      numeric;
  v_subtotal      numeric;
  v_pre_vat       numeric;
  v_changes       numeric;
  v_goods         numeric;
  v_labor         numeric;
  v_travel_rate   numeric;
  v_paid_shifts   integer;
  v_planned_hours numeric;
  v_planned_labor numeric;
  v_actual_labor  numeric;
  v_fa_count      integer;
begin
  select p.quote_id,
         case when p.final_start_time is null or p.final_end_time is null then null
              else extract(epoch from (p.final_end_time - p.final_start_time)) / 3600.0
         end
    into v_quote_id, v_planned_hours
    from public.projects p
   where p.project_id = p_project_id;

  -- 🔴 שומר-כשל (R4-F9): פרויקט בלי הצעה אינו "רווח 0" — הוא שאלה בלי תשובה.
  -- סכום-חלקי שקט הוא החטא המרכזי של המודול הזה.
  if v_quote_id is null then
    raise exception 'לא ניתן לחשב כספים לפרויקט % — אין לו הצעת מחיר מקושרת.', p_project_id
      using errcode = 'P0001';
  end if;

  select coalesce(q.applied_customer_discount, 0) + coalesce(q.manual_discount, 0)
    into v_discount
    from public.quotes q where q.quote_id = v_quote_id;

  select sum(qs.qty * qs.closing_unit_price)
    into v_subtotal
    from public.quote_services qs where qs.quote_id = v_quote_id;

  if v_subtotal is null then
    raise exception 'לא ניתן לחשב כספים לפרויקט % — להצעה % אין שורות.', p_project_id, v_quote_id
      using errcode = 'P0001';
  end if;

  v_pre_vat := v_subtotal - round(v_subtotal * v_discount / 100.0, 2);

  -- Σ שינויי-התכולה, **בסימן** (R3-10). הקטנה לפני-הזמנה = זיכוי מלא, וזה מכוון.
  select coalesce(sum(round(pc.delta_qty * pc.unit_price_snapshot, 2)), 0)
    into v_changes
    from public.project_changes pc where pc.project_id = p_project_id;

  -- סחורה: כמות-ההצעה מעודכנת-שינויים × עלות-קפואה. **בלי שורות-דיילות** (ר' הכותרת).
  select coalesce(sum(
           (qs.qty + coalesce((select sum(pc.delta_qty)
                                 from public.project_changes pc
                                where pc.project_id = p_project_id and pc.sku = qs.sku), 0))
           * qs.closing_unit_cost), 0)
    into v_goods
    from public.quote_services qs
    join public.products pr on pr.sku = qs.sku
   where qs.quote_id = v_quote_id
     and pr.category is distinct from 'hostess';

  select coalesce(sum(a.actual_hours * a.hourly_rate_snapshot + coalesce(a.personal_bonus, 0)), 0),
         count(*) filter (where a.actual_hours > 0),
         count(*) filter (where a.assignment_status = 'finally_approved'),
         coalesce(sum(a.hourly_rate_snapshot) filter (where a.assignment_status = 'finally_approved'), 0)
    into v_labor, v_paid_shifts, v_fa_count, v_planned_labor
    from public.assignments a where a.project_id = p_project_id;

  select coalesce((select pa.param_value::numeric
                     from public.params pa
                    where pa.param_name = 'סכום_נסיעות_למשמרת'), 0)
    into v_travel_rate;

  v_actual_labor := v_labor;

  return query select
    v_pre_vat + v_changes,
    v_goods,
    v_labor,
    v_travel_rate * v_paid_shifts,
    (v_pre_vat + v_changes) - v_goods - v_labor - (v_travel_rate * v_paid_shifts),
    -- ה18: סטיית-תקציב על צד-העבודה בלבד. NULL כששעות-מתוכננות חסרות (T7) —
    -- לא 0, כי 0 קורא כמו "עמדנו בתקציב בדיוק".
    case when v_planned_hours is null then null
         else v_actual_labor - (v_planned_hours * v_planned_labor) end,
    v_planned_hours,
    v_paid_shifts,
    v_fa_count;
end;
$$;

comment on function finance_project_money(integer) is
  'מ8 — מקור-האמת היחיד לכספי פרויקט (ה2/ה7/ה17/ה18/ה26/ה29). פנימית: נקראת רק מפונקציות מאושרות. אומתה מול עוגן-היד 3,650.00 של #13.';

revoke execute on function finance_project_money(integer) from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- 2. הקורא של מסך S1 — לשונית-העבודה של מנהלת-הכספים
-- -----------------------------------------------------------------------------
-- מחזיר **עובדות**; הגזירות לתצוגה (מועד-פירעון, ימי-איחור, %, תגית-ציון) חיות
-- ב-`src/lib/projectFinance.js` — כרטיס-S1 §③ אומר "נגזר בזמן-תצוגה", ו-₪ נשמר
-- בעוד % תמיד נגזר (§7.52).
-- ⚠️ `payment_terms_days` מוחזר **nullable**: הפרמטר `תנאי_תשלום_ימים` נזרע במיגרציה G.
--    עד אז מועד-הפירעון אינו ניתן לחישוב, והמסך יציג `—` — לעולם לא "0 ימי איחור",
--    שהוא שקר שנראה כמו עובדה.
create or replace function get_finance_overview()
returns table (
  project_id          integer,
  event_name          text,
  customer_id         bigint,
  customer_name       text,
  project_status      text,
  tab                 text,
  revenue             numeric,
  gross_profit        numeric,
  final_profit        numeric,
  invoice_sent        boolean,
  invoice_sent_at     timestamptz,
  payment_date        date,
  payment_terms_days  integer,
  feedback_status     text,
  feedback_score      integer,
  cancelled_at        timestamptz,
  cancel_type         text,
  cancellation_fee    numeric,
  written_off         boolean,
  credit_note_flag    boolean,
  operationally_closed_at timestamptz,
  archived_at         timestamptz
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
    p.project_id,
    p.event_name,
    p.customer_id,
    p.customer_name,
    p.project_status,
    -- 🔗 מראת B-9 — חברות-בלשונית, כולל הענף של מבוטל.
    -- מבוטל **לעולם לא בלשונית 3**, ויורד מהרשימה כשהפה נפתר (רווח קפוא).
    case
      when p.project_status = 'awaiting_invoice'  then 'awaiting_invoice'
      when p.project_status = 'awaiting_payment'  then 'awaiting_payment'
      when p.project_status = 'finished'          then 'finished'
      when p.project_status = 'cancelled' and pf.final_profit is not null then 'resolved_cancelled'
      when p.project_status = 'cancelled' and p.invoice_sent then 'awaiting_payment'
      when p.project_status = 'cancelled'         then 'awaiting_invoice'
      else 'not_in_finance'
    end,
    m.revenue,
    m.gross_profit,
    pf.final_profit,
    p.invoice_sent,
    p.invoice_sent_at,
    p.payment_date,
    v_terms,
    p.feedback_status,
    p.feedback_score,
    p.cancelled_at,
    p.cancel_type,
    pf.cancellation_fee,
    coalesce(pf.written_off, false),
    -- 🔗 מראת B-14 (§7.20ב) — תצוגה בלבד. נמדד שהמסלול "בוטל אחרי חשבונית" אינו
    -- אפשרי (cancel_project מסרב מ-awaiting_invoice ואילך) ⇒ הטריגר האמיתי היחיד
    -- הוא דמי-ביטול שחויבו ואז ויתרו עליהם / נמחקו כחוב-אבוד.
    (p.project_status = 'cancelled'
       and p.invoice_sent
       and (pf.cancellation_fee = 0 or coalesce(pf.written_off, false))),
    p.operationally_closed_at,
    pf.archived_at
  from public.projects p
  left join public.project_finance pf on pf.project_id = p.project_id
  cross join lateral public.finance_project_money(p.project_id) m
  where p.project_status in ('awaiting_invoice', 'awaiting_payment', 'finished', 'cancelled')
  order by p.project_id;
end;
$$;

comment on function get_finance_overview() is
  'מ8 S1 — שורות שלוש הלשוניות. מחזיר עובדות; הגזירות לתצוגה ב-src/lib/projectFinance.js.';

revoke execute on function get_finance_overview() from public, anon, authenticated;
grant execute on function get_finance_overview() to authenticated;


-- -----------------------------------------------------------------------------
-- 3. הקורא של חלון-הסגירה S2 — תחשיב-המאזן
-- -----------------------------------------------------------------------------
-- כרטיס-P3: "החלון מציג תחשיב-מאזן: הכנסות … הוצאות … שורה תחתונה מודגשת".
-- 🔑 **אותו `finance_project_money` שמזין את S1** — ולכן אי-אפשר ששני המסכים
--    יראו שני מספרים שונים לאותו פרויקט (F16/R1-4).
create or replace function get_project_finance_detail(p_project_id integer)
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
    p.feedback_status, p.feedback_score, p.negative_feedback_reason, p.feedback_notes,
    p.cancelled_at, p.cancel_type, pf.archived_at
  from public.projects p
  left join public.project_finance pf on pf.project_id = p.project_id
  cross join lateral public.finance_project_money(p.project_id) m
  where p.project_id = p_project_id;
end;
$$;

comment on function get_project_finance_detail(integer) is
  'מ8 S2 — תחשיב-המאזן של פרויקט אחד. אותו SSOT של S1 (F16).';

revoke execute on function get_project_finance_detail(integer) from public, anon, authenticated;
grant execute on function get_project_finance_detail(integer) to authenticated;


-- -----------------------------------------------------------------------------
-- 4. 🔴 אדווה לקוד ממוזג של מודול 6 — list_projects_overview
-- -----------------------------------------------------------------------------
-- **למה זה חייב לקרות כאן ולא "מתישהו":** ‏F16/R1-4 דורשים **מספר-הכנסה אחד
-- בכל המערכת**. הפונקציה הזו (מ6, חיה) מחשבת `planned_revenue` כ-preVat של
-- ההצעה **בלבד** — בלי שינויי-התכולה. מ8 מחשב הכנסות **עם** שינויי-התכולה (ה2).
-- ⇒ בלי התיקון, מבט-העל של מ6 והמסכים של מ8 היו מציגים שתי הכנסות שונות לאותו
--   פרויקט. **דוגמה מדודה מהביקורת: #15 — ‏6,060 מול 5,985.**
--
-- 🔴 **הגוף נמשך חי מ-`pg_get_functiondef` לפני העריכה** (מוקש-הפרוטוקול: מיגרציה
-- שנבנתה מגרסה ישנה שברה כאן אישור-הצעה בשקט לשלושה ימים). **הדלתא היא שורה אחת
-- בלבד** — תוספת ה-Σ לביטוי-ההכנסה; כל השאר זהה בייט-בבייט לגוף החי.
--
-- 🔒 **הוכחת-הרגרסיה:** לעוגן המחושב-ביד של מ6 — פרויקט #8 ⇒ ‏5,355.00 — **אפס
-- שינויי-תכולה**, ולכן הוא **חייב** להישאר זהה-ספרתית אחרי השכתוב. אם הוא זז,
-- שברתי את מ6.
create or replace function list_projects_overview()
returns table(project_id integer, event_name text, customer_name text, final_event_date date, final_start_time time without time zone, final_end_time time without time zone, final_location text, project_status text, required_hostess_count integer, hostesses_confirmed integer, pending_invites integer, assignments_row_count integer, logistics_ready integer, logistics_total integer, cancelled_at timestamp with time zone, cancel_type text, planned_revenue numeric)
language plpgsql
stable security definer
set search_path to ''
as $function$
declare
  v_can_read_quotes boolean;
begin
  perform public.assert_module_permission('פרויקטים', array['edit', 'view']);

  select exists (
    select 1
      from public.permissions p
     where p.role_id = (select public.current_user_role_id())
       and p.module_id = (select m.module_id from public.modules m where m.module_name = 'הצעות מחיר')
       and p.permission_level = any(array['edit', 'view'])
  ) into v_can_read_quotes;

  return query
  select
      p.project_id,
      p.event_name,
      p.customer_name,
      p.final_event_date,
      p.final_start_time,
      p.final_end_time,
      p.final_location,
      p.project_status,
      p.required_hostess_count,
      (select count(*)
         from (select distinct on (a.hostess_id) a.assignment_status
                 from public.assignments a
                where a.project_id = p.project_id
                order by a.hostess_id, a.assignment_number desc) w
        where w.assignment_status = 'finally_approved')::integer,
      (select count(*)
         from (select distinct on (a.hostess_id) a.assignment_status
                 from public.assignments a
                where a.project_id = p.project_id
                order by a.hostess_id, a.assignment_number desc) w
        where w.assignment_status = 'pending')::integer,
      (select count(*)
         from public.assignments a2
        where a2.project_id = p.project_id)::integer,
      (select count(*) filter (where l.item_status = 'ready')
         from public.logistics l
        where l.project_id = p.project_id)::integer,
      (select count(*)
         from public.logistics l2
        where l2.project_id = p.project_id)::integer,
      p.cancelled_at,
      p.cancel_type,
      case
        when v_can_read_quotes and p.quote_id is not null
          then (select s.sub
                       - round(s.sub * (q.applied_customer_discount + q.manual_discount) / 100.0, 2)
                       -- ⬇️ הדלתא היחידה מול הגוף החי (מ8 · F16 · ה2, 27/08/2026):
                       --    Σ שינויי-התכולה, בסימן. פרויקט בלי שינויים ⇒ 0 ⇒ אותו מספר בדיוק.
                       + coalesce((select sum(round(pc.delta_qty * pc.unit_price_snapshot, 2))
                                     from public.project_changes pc
                                    where pc.project_id = p.project_id), 0)
                  from public.quotes q
                  cross join lateral (select sum(qs.qty * qs.closing_unit_price) as sub
                                        from public.quote_services qs
                                       where qs.quote_id = q.quote_id) s
                 where q.quote_id = p.quote_id)
        else null
      end
    from public.projects p
   order by p.project_id;
end
$function$;
