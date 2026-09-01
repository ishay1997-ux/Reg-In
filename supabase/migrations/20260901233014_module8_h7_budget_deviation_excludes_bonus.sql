-- ============================================================================
-- H7 — סטיית-התקציב מפסיקה לספור בונוס אישי כחריגה מהתכנון
-- מודול 8 · נכתב 01/09/2026 באודיט-הסגירה · בהכרעת-ישי ("עושים פעם אחת עבודה בצורה נכונה")
-- ============================================================================
--
-- 🐛 מה שגוי היום
-- ‏`budget_deviation` מחשב  `v_labor − (שעות-מתוכננות × Σ תעריפים)`, כאשר
--   `v_labor = Σ(שעות-בפועל × תעריף-קפוא  +  בונוס-אישי)`.
-- הצד המתוכנן **אינו מכיל איבר-בונוס כלל** ⇒ פרויקט שבו כל הדיילות עבדו בדיוק
-- כמתוכנן, וקיבלו בונוס, מוצג כ**חריגה מהתקציב בגובה הבונוס** — בעוד שאיש לא חרג
-- מהתכנון. ה18 מגדיר את הסטייה כ-*"(Σ שעות-בפועל × תעריף-קפוא) מול (שעות-מתוכננות ×
-- Σ תעריפי המשובצות-סופית)"* — בלי בונוס בשני הצדדים.
--
-- 🔴 ולמה התיקון צר בכוונה, וזו הנקודה שקל להרוס בה שני מספרים כדי לתקן אחד:
-- ‏`v_labor` מזין **שלושה** ערכים, ורק באחד מהם הבונוס מפריע:
--   ‏① `labor_cost` (עמודת-החזרה) — הבונוס **שייך**: זו עלות-עבודה אמיתית.
--   ‏② `gross_profit` — הבונוס **שייך**: הוא מקטין רווח, וזה המספר ש-`final_profit` מקפיא.
--   ‏③ `budget_deviation` — כאן, ורק כאן, הוא מזהם.
-- ⇒ **אסור לגרוע את הבונוס מ-`v_labor`.** גריעה כזו הייתה משנה את הרווח-הגולמי
--    ואת הרווח-הקפוא, ושוברת את עוגן-הקבלה. לכן נוסף משתנה **נפרד** לצד-הביצוע של
--    הסטייה, ו-`v_labor` נשאר בייט-בבייט כשהיה.
--
-- 🌍 ולמה זו גם הצורה המקובלת, ולא רק ציות לאפיון: בחשבונאות-תמחיר תקן, סטיית-עבודה
--    מפורקת ל**סטיית-תעריף** ול**סטיית-יעילות** — בדיוק כדי שהמספר יגיד *מה לעשות*.
--    בונוס שיקול-דעתי אינו אף אחת מהשתיים; הכללתו הופכת אריח שאומר "מישהו עבד יותר
--    מהמתוכנן" לאריח שצועק כשאיש לא עבד יותר. **מנהלת-כספים שרואה +250 ₪ תשאל "מי
--    האריך?" — ולא תמצא אף אחד.** הבונוס ממשיך להופיע היכן שעלות אמורה להופיע:
--    בעלות-העבודה וברווח.
--
-- 📐 הגוף נמשך חי מ-`pg_get_functiondef` לפני הכתיבה (כלל migrations/CLAUDE.md),
--    והשינוי היחיד הוא משתנה אחד נוסף והחלפת האיבר השמאלי בביטוי-הסטייה.
--
-- 🔬 בסיס-הנתונים החי נמדד לפני הכתיבה: **אפס שורות-`assignments` עם בונוס שאינו אפס**
--    ⇒ התיקון הוא no-op על כל הדאטה הקיימת, ושני עוגני-הקבלה אינם יכולים לזוז
--    (‏#13 `gross_profit=3650` · #12 `gross_profit=207.40`). **ולכן גם אי-אפשר להוכיח
--    אותו מהדאטה החי** — ההוכחה היא בעסקה מתגלגלת שזורעת בונוס, מודדת, וחוזרת אחורה.

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
              else extract(epoch from (p.final_end_time - p.final_start_time)) / 3600.0
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
