-- ============================================================================
-- שעות-מתוכננות באירוע חוצה-חצות — `finance_project_money.planned_hours` היה שלילי
-- מודול 8 (תיקון-בדיעבד) · נכתב 06/09/2026 בסקירת-האפיון של מודול 11 · ענף ishay/hotfix-planned-hours-midnight
-- ============================================================================
--
-- 🐛 מה שגוי היום
-- ‏`v_planned_hours := extract(epoch from (final_end_time - final_start_time)) / 3600` — הפרש
-- של שני `time` בלי טיפול-חצות. אירוע 20:00→01:00 מקבל ‎-19 שעות במקום 5.
-- ⇒ ‏`budget_deviation` (= שעות-בפועל×תעריף − שעות-מתוכננות×Σתעריפים) מתנפח לחיובי-ענק, ו"רווח
-- צפוי" במסך-הכספים (`deriveExpectedProfit`) שגוי לאותם פרויקטים.
--
-- 🔬 נמדד חי 06/09/2026, לפני הכתיבה: מתוך 701 פרויקטים finished — **126 עם planned_hours שלילי,
--    וכל 126 הם בדיוק אלה שבהם final_end_time < final_start_time** (0 מקרים אחרים). על הדאטה
--    הזרועה: חציון-הסטייה 1% מעלות-העבודה אבל p90 = 480% — כולו מהבאג הזה.
--
-- 📐 הגוף נמשך חי מ-`pg_get_functiondef` (md5 dc02f2402dcc8e7d103535aa38d51319, 4,042 תווים —
--    זהה לגרסת H7 `20260901233014`) והשינוי היחיד הוא ביטוי אחד: `mod(… + 86400, 86400)`.
--    זמנים זהים ⇒ 0 שעות (כמו באפליקציה). NULL באחד הקצוות ⇒ NULL כמו קודם.
--
-- 🌍 תקדימים באותו מסד: `quotes.estimated_hours` (GENERATED, "גלגול-חוצה-חצות (+24)", מודול 3)
--    ו-`src/lib/projectCard.js:minutesBetweenTimes` — `(end - start + 1440) % 1440`.
--
-- 🔁 הפיכוּת: `create or replace` בלבד — החתימה, ה-ACL (service_role בלבד) ושאר הגוף ללא שינוי.
--    חזרה אחורה = החלת גוף H7 מחדש. `final_profit` הקפוא אינו נוגע (הוא נכתב בארכוב, לא מחושב כאן).
--    ‏`gross_profit` אינו תלוי ב-planned_hours ולכן אינו זז — עוגני-הקבלה #12/#13 נשארים.

create or replace function public.finance_project_money(p_project_id integer)
returns table(
  revenue                numeric,
  goods_cost             numeric,
  labor_cost             numeric,
  travel_cost            numeric,
  gross_profit           numeric,
  budget_deviation       numeric,
  planned_hours          numeric,
  paid_shift_count       integer,
  finally_approved_count integer
)
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_quote_id      integer;
  v_discount      numeric;
  v_subtotal      numeric;
  v_pre_vat       numeric;
  v_changes       numeric;
  v_goods         numeric;
  v_labor         numeric;
  -- 🆕 צד-הביצוע של הסטייה בלבד: שעות × תעריף, **בלי בונוס**. מכוון שיהיה סימטרי
  --    ל-`v_planned_labor`, שגם בו אין איבר-בונוס. ‏`v_labor` נשאר מה שהיה.
  v_labor_hours   numeric;
  v_travel_rate   numeric;
  v_paid_shifts   integer;
  v_planned_hours numeric;
  v_planned_labor numeric;
  v_fa_count      integer;
begin
  select p.quote_id,
         case when p.final_start_time is null or p.final_end_time is null then null
              -- 🔴 חציית-חצות (תוקן 06/09/2026): 20:00–01:00 הן 5 שעות, לא ‎-19. אותו מודולו-יממה
              --    שכבר רץ באפליקציה (`minutesBetweenTimes`) וב-`quotes.estimated_hours` (LOCAL-2).
              else mod(extract(epoch from (p.final_end_time - p.final_start_time)) + 86400, 86400) / 3600.0
         end
    into v_quote_id, v_planned_hours
    from public.projects p
   where p.project_id = p_project_id;

  -- שומר-כשל (R4-F9): פרויקט בלי הצעה אינו "רווח 0" אלא שאלה בלי תשובה.
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

  -- Σ שינויי-התכולה, בסימן (R3-10). הקטנה לפני-הזמנה = זיכוי מלא, וזה מכוון.
  select coalesce(sum(round(pc.delta_qty * pc.unit_price_snapshot, 2)), 0)
    into v_changes
    from public.project_changes pc where pc.project_id = p_project_id;

  -- סחורה: כמות-ההצעה מעודכנת-שינויים × עלות-קפואה, בלי שורות-דיילות.
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
         coalesce(sum(a.actual_hours * a.hourly_rate_snapshot), 0),
         count(*) filter (where a.actual_hours > 0),
         count(*) filter (where a.assignment_status = 'finally_approved'),
         coalesce(sum(a.hourly_rate_snapshot) filter (where a.assignment_status = 'finally_approved'), 0)
    into v_labor, v_labor_hours, v_paid_shifts, v_fa_count, v_planned_labor
    from public.assignments a where a.project_id = p_project_id;

  select coalesce((select pa.param_value::numeric
                     from public.params pa
                    where pa.param_name = 'סכום_נסיעות_למשמרת'), 0)
    into v_travel_rate;

  return query select
    v_pre_vat + v_changes,
    v_goods,
    v_labor,
    v_travel_rate * v_paid_shifts,
    (v_pre_vat + v_changes) - v_goods - v_labor - (v_travel_rate * v_paid_shifts),
    -- ה18: סטייה על צד-העבודה בלבד. NULL כששעות-מתוכננות חסרות (T7), לא 0.
    -- 🔴 ‏`v_labor_hours` ולא `v_labor` (תוקן 01/09/2026, H7): שני צדי-ההשוואה חייבים
    --    להיות מאותו סוג — שעות×תעריף מול שעות×תעריף. בונוס אינו חריגה-מתכנון והוא
    --    נספר ב-`labor_cost` וב-`gross_profit`, שם מקומו.
    case when v_planned_hours is null then null
         else v_labor_hours - (v_planned_hours * v_planned_labor) end,
    v_planned_hours,
    v_paid_shifts,
    v_fa_count;
end;
$function$;

-- 🚫 אין `drop function` כאן במכוון: `create or replace` שומר על ה-ACL הקיים.
--    (מוקש מדוד: `drop` מאפס הרשאות, ו-`revoke … from public` אינו מוריד את `anon`
--     — כך `H5` פתחה פונקציית-כסף לאנונימי לכמה דקות ו-`H5b` נאלצה לסגור.)
--    הפונקציה הזו היא `service_role` בלבד ואינה נגישה מהדפדפן — לאמת שלא זז.
