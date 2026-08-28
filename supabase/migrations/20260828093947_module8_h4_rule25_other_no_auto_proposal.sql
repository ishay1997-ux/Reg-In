-- =============================================================================
-- מודול 8 · מיגרציה H4 — ה25: ביטול בסיווג `other` אינו מקבל הצעה אוטומטית
-- =============================================================================
-- 🔴🔴🔴 **טרם הוחלה. נכתבה 28/08/2026 09:39 וממתינה לשער-ההקלדה של ישי.**
--        ‏H1/H2/H3 הוחלו אחרי שהקליד את שמותיהן. **הקלדה אחת אינה מכסה מיגרציה אחרת.**
-- =============================================================================
--
-- 🔎 **הפגם, ומדוע הוא לא נקרא מהמקור אלא נמדד חי:**
--    ‏`processes-approved.md` (ה25) קובע מילה-במילה:
--      *"מיפוי-`cancel_type` לדמי-ביטול: `customer` ⇒ הסולם המלא · `force_majeure` ⇒ 0 ·
--        **`other` ⇒ אין הצעה אוטומטית** (ביטול שאינו-בהכרח-באשמת-הלקוח — שיקול-המנהלת, ידני)"*
--    **הפונקציה מעולם לא בנתה את הענף הזה.** ‏`v_pct` מטפל ב-`force_majeure` בלבד,
--    ו-`other` נופל דרך אותם תנאי-שעות בדיוק כמו `customer`.
--
-- 🩸 **המדידה, בעסקה שגלגלה את עצמה לאחור על פרויקט #11 (28/08/2026 10:0X, 48 שעות לפני
--     האירוע). אפס שורות קבועות — #11 יצא `ready` ו-`cancelled_at IS NULL`:**
--       · `customer`      ⇒ ‏50% · ‏90.00 ₪   ✅ (1 דיילת × 4 ש' × 45 ₪ = 180; חצי = 90)
--       · `force_majeure` ⇒ ‏ 0% · ‏ 0.00 ₪   ✅
--       · **`other`       ⇒ ‏50% · ‏90.00 ₪** 🔴 **זהה בייט-בבייט ל-`customer`**
--
-- 🎯 **ומה זה עשה בפועל על המסך, וזו הסיבה שזה לא קוסמטי:** ‏`ClosingWindowDialog` זרע את
--    שדה-הסכום מ-`proposed_fee`. ⇒ ביטול בסיווג "אחר" הגיע למנהלת **עם סכום מוכן בשדה**,
--    ולחיצה אחת על "שמור דמי-ביטול" חייבה לקוח בסכום שההכרעה אמרה שצריך להיות שיקול-דעת.
--    **הזריעה כבר תוקנה בצד-המסך (קומיט `82cd764`) — זו המיגרציה שסוגרת את המקור.**
--
-- 🔑 **מקור הגוף:** נמשך חי מ-`pg_get_functiondef` ב-28/08/2026 09:3X
--    (‏`md5(prosrc)`=`8e54ca8aa56ee94cad16300734343e5e`, אורך 2,908).
--    **השינוי היחיד מול הגוף החי הוא שורת-ה-`when` הנוספת** (וההערה שמעליה).
--
-- ⚠️ **מה `null` עושה בהמשך הפונקציה, ולמה זו התוצאה הנכונה — ולא ויתור על מידע:**
--    ‏`v_pct := null` ⇒ ‏`team_compensation` = null ו-`proposed_fee` = null,
--    **אבל `goods_at_price` / `goods_at_cost` / `planned_hours` / `compensated_count`
--    ממשיכים לחזור כרגיל.** הסחורה שהוזמנה היא **עובדה** ואינה תלויה בסולם-הפיצוי;
--    מה שנשלל הוא **ההצעה**, לא הנתונים. המנהלת רואה את כל המרכיבים ומקלידה סכום.
--
-- 🔴 **וזה דורש שינוי-מסך באותו קומיט, אחרת המיגרציה מייצרת שקר:** היום `team_compensation
--    IS NULL` מרונדר כ-*"לא ניתן לחשב פיצוי — חסרות שעות סופיות"* (‏A-8). בסיווג "אחר"
--    השעות **תקינות לחלוטין**, והמשפט הזה היה מטעה. המסך מבחין עכשיו בין שני הענפים.
--
-- 🔻 אימות אחרי ההחלה (חייב להחזיר true):
--   select prosrc like '%when v_cancel_type = ''other'' then null%'
--     from pg_proc where proname = 'finance_cancellation_fee_proposal';
-- =============================================================================

create or replace function public.finance_cancellation_fee_proposal(p_project_id integer)
returns table(compensation_pct numeric, hours_before_event numeric, team_compensation numeric,
              goods_at_price numeric, goods_at_cost numeric, proposed_fee numeric,
              planned_hours numeric, compensated_count integer)
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
             -- 🔴 H4 / ה25: "אחר" ⇒ **אין הצעה אוטומטית** — שיקול-דעת המנהלת, ידני.
             -- הענף חייב לשבת **לפני** תנאי-השעות, בדיוק כמו זה של כוח-עליון: הסיווג
             -- מכריע לפני שהשעון נבדק בכלל. שאר הרכיבים (סחורה, שעות, ספירת-דיילות)
             -- ממשיכים לחזור — נשללת ההצעה, לא המידע.
             when v_cancel_type = 'other' then null
             when v_hours is null then null
             -- ה24: ">72 = 0%", והטווח "24–72 = 50%" מכיל את 72 ⇒ `>` ולא `>=`.
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
