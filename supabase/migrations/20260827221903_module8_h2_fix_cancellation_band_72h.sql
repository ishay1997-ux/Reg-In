-- =============================================================================
-- מודול 8 · מיגרציה H2 — תיקון גבול-הסולם בדיוק ב-72.0 שעות (דמי-ביטול)
-- =============================================================================
-- 🔴🔴🔴 **טרם הוחלה. נכתבה 27/08/2026 22:19 וממתינה לשער-ההקלדה של ישי.**
-- ⏸️ **למה לא הוחלה מיד:** הצגת-הביניים של 28/08 רצה על אותו פרויקט-Supabase.
-- =============================================================================
--
-- 🐛 **הפגם: בדיוק ב-72.0 שעות הלקוח משלם 0% במקום 50%.**
--
--    הסולם המאושר (‏ה24 ב-`processes-approved.md`, מראת-§7.16):
--      ‏**>72** שעות לפני האירוע = ‏0%  ·  **24–72** = ‏50%  ·  **<24** = ‏100%
--    ⇒ ‏72.0 בדיוק **נמצא בתוך** טווח-ה-50% (הטווח כתוב מכיל, וה-0% כתוב `>72` ולא `≥72`).
--
--    הגוף המשוגר בדק `when v_hours >= v_part_h then 0` — ובגלל שהענף הזה נבדק **ראשון**,
--    ‏72.0 בדיוק נפל ל-0%. ‏(‏24.0 בדיוק דווקא נכון: `>= v_full_h` מחזיר 50%, כנדרש.)
--
-- 🔎 **אומת בשלוש דרכים בלתי-תלויות, 27/08/2026:**
--      ‏① האפיון המאושר ה24 — "‏>72 = 0% · 24–72 = 50%"
--      ‏② מדריך-המיקרו צעד 2.1 — "בדיוק 24.0 ובדיוק 72.0 — **שניהם** 50%"
--      ‏③ הפרמטרים החיים — `שעות_פיצוי_ביטול_חלקי=72` · `_מלא=24` · `אחוז_..._חלקי=50`
--
-- 📉 **חומרה, בלי לנפח:** נורה רק כשההפרש הוא **בדיוק** 72.000000 שעות. במציאות
--    ‏`cancelled_at` הוא חותמת למיקרו-שנייה, ולכן זה כמעט-בלתי-אפשרי בשימוש אמיתי —
--    **אבל זו טעות-כסף לרעת הלקוח, והיא בגבול שהאפיון מגדיר במפורש.** תו אחד.
--
-- 🔑 **מקור הגוף:** נמשך חי מ-`pg_get_functiondef` ב-27/08/2026 22:19 (חוק המיגרציות:
--    כל `create or replace` על פונקציה קיימת מתחיל מהגוף החי, לא מקובץ-מיגרציה ישן).
--    **השינוי היחיד מול הגוף החי הוא `>=` ⇒ `>` בשורה אחת**, המסומנת למטה.
-- =============================================================================

create or replace function public.finance_cancellation_fee_proposal(p_project_id integer)
returns table (
  compensation_pct   numeric,
  hours_before_event numeric,
  team_compensation  numeric,
  goods_at_price     numeric,
  goods_at_cost      numeric,
  proposed_fee       numeric,
  planned_hours      numeric,
  compensated_count  integer
)
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_cancelled_at timestamptz; v_cancel_type text;
  v_event_start timestamptz; v_planned_hours numeric;
  v_full_h numeric; v_part_h numeric; v_part_pct numeric;
  v_hours numeric; v_pct numeric;
  v_rate_sum numeric; v_n integer;
  v_goods_price numeric; v_goods_cost numeric;
begin
  select p.cancelled_at, p.cancel_type,
         (p.final_event_date + p.final_start_time) at time zone 'Asia/Jerusalem',
         case when p.final_start_time is null or p.final_end_time is null then null
              else extract(epoch from (p.final_end_time - p.final_start_time)) / 3600.0 end
    into v_cancelled_at, v_cancel_type, v_event_start, v_planned_hours
    from public.projects p where p.project_id = p_project_id;

  select pa.param_value::numeric into v_full_h from public.params pa where pa.param_name = 'שעות_פיצוי_ביטול_מלא';
  select pa.param_value::numeric into v_part_h from public.params pa where pa.param_name = 'שעות_פיצוי_ביטול_חלקי';
  select pa.param_value::numeric into v_part_pct from public.params pa where pa.param_name = 'אחוז_פיצוי_ביטול_חלקי';

  if v_full_h is null or v_part_h is null or v_part_pct is null then
    raise exception 'לא ניתן לחשב דמי ביטול — חסרים פרמטרי סולם הפיצוי במערכת.'
      using errcode = 'P0001';
  end if;

  v_hours := case when v_cancelled_at is null or v_event_start is null then null
                  else extract(epoch from (v_event_start - v_cancelled_at)) / 3600.0 end;

  v_pct := case
             when v_cancel_type = 'force_majeure' then 0
             when v_hours is null then null
             -- 🔴 השינוי היחיד במיגרציה הזו: `>=` היה שולח 72.0 בדיוק ל-0%.
             -- ה24 כותב "‏>72 = 0%", והטווח "‏24–72 = 50%" מכיל את 72 ⇒ `>` ולא `>=`.
             when v_hours > v_part_h then 0
             when v_hours >= v_full_h then v_part_pct
             else 100
           end;

  select coalesce(sum(a.hourly_rate_snapshot), 0), count(*)
    into v_rate_sum, v_n
    from public.assignments a
   where a.project_id = p_project_id
     and (a.released_from_status = 'finally_approved'
          or (a.released_from_status is null and a.assignment_status = 'finally_approved'));

  select coalesce(sum(l.planned_qty * qs.closing_unit_price), 0),
         coalesce(sum(l.planned_qty * qs.closing_unit_cost), 0)
    into v_goods_price, v_goods_cost
    from public.logistics l
    join public.projects p2 on p2.project_id = l.project_id
    join public.quote_services qs on qs.quote_id = p2.quote_id and qs.sku = l.sku
   where l.project_id = p_project_id
     and l.item_status in ('ordered', 'ready');

  return query select
    v_pct,
    v_hours,
    case when v_pct is null or v_planned_hours is null then null
         else round(v_pct / 100.0 * v_planned_hours * v_rate_sum, 2) end,
    v_goods_price,
    v_goods_cost,
    case when v_pct is null or v_planned_hours is null then null
         else round(v_pct / 100.0 * v_planned_hours * v_rate_sum, 2) + v_goods_price end,
    v_planned_hours,
    v_n;
end;
$function$;

-- ⚠️ ההרשאות אינן נגזרות מחדש ע"י `create or replace` — הן נשמרות. אין צורך ב-revoke/grant.
--
-- 🔻 אימות (הרץ אחרי ההחלה — הגבול צריך להחזיר 50, לא 0):
--   select case when 72.0 > 72 then 0 when 72.0 >= 24 then 50 else 100 end as at_exactly_72;  -- ⇒ 50
--   select prosrc like '%v_hours > v_part_h%' as fixed
--     from pg_proc where proname = 'finance_cancellation_fee_proposal';                        -- ⇒ true
