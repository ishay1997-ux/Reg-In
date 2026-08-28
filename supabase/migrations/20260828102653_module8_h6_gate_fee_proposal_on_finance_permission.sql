-- =============================================================================
-- מודול 8 · מיגרציה H6 — שער-ההרשאה החסר על `finance_cancellation_fee_proposal`
-- =============================================================================
-- 🔴🔴🔴 **טרם הוחלה. נכתבה 28/08/2026 10:2X וממתינה לשער-ההקלדה של ישי.**
-- =============================================================================
--
-- 🔎 **הממצא, ואיך הוא נמצא.** ישי שאל *"הכל אומת בקוד היטב?"*, ובמקום לענות הלכתי למדוד
--    את כל משפחת-הפונקציות של מ8 מול `pg_proc`. **התמונה טובה כמעט לגמרי — וזה בדיוק מה
--    שהופך את החריג היחיד לשווה-תיקון:**
--
--    | הפונקציה | כותבת/קוראת | מי יכול לקרוא לה | שער-הרשאה |
--    |---|---|---|---|
--    | ‏6 פעולות-הכתיבה *(חשבונית · תשלום · משוב · ארכוב · חוב-אבוד · פתרון-ביטול)* | כותבות | `authenticated` | ✅ **כולן** דרך `finance_assert_writable` |
--    | ‏`get_finance_overview` · `get_project_finance_detail` · `generate_salary_report` · `finalize_salary_report` | — | `authenticated` | ✅ `assert_module_permission` ישיר |
--    | ‏`finance_project_money` · `finance_freeze_cancelled_profit` · `finance_assert_writable` | פנימיות | **`service_role` בלבד** | ✅ לא נגישות מהדפדפן כלל |
--    | 🔴 **`finance_cancellation_fee_proposal`** | קוראת | **`authenticated`** | ❌ **אין** |
--
--    ⇒ **פונקציה אחת מתוך ארבע-עשרה חורגת**, והיא היחידה שנגישה מהדפדפן בלי שום בדיקה.
--
-- 🩸 **מה היא מחזירה למי שאין לו 'כספים':** לכל `project_id` — אחוז-הפיצוי · שעות-הביטול ·
--    פיצוי-הצוות · **`goods_at_price`** · **`goods_at_cost`** · דמי-הביטול המוצעים ·
--    שעות-האירוע · מספר הדיילות המאושרות.
--    🔴 **ו-`goods_at_cost` הוא הפריט שהופך את זה מ"מידע עודף" להפרת-הכרעה:** §7.34 קובע
--    שעלות-הרכש אינה נראית לתפקידים שאינם 'כספים'/CEO, **ויש לזה בדיקת-E2E ייעודית**
--    (`e2e/cost-visibility.spec.js`) שמוכיחה שמנהלת-גיוס מקבלת `[]` מ-`product_costs`.
--    **ה-RPC הזה עוקף בדיוק את מה שאותה בדיקה שומרת** — הנתון מגיע דרך דלת אחרת.
--
-- ⚠️ **ומה זה אינו, כדי שלא ייקרא מוגזם:** אין כאן חשיפה לאנונימי *(זה היה H5b, ותוקן)*,
--    ואין כאן כתיבה — הפונקציה `stable`. **הפגם הוא חשיפת-קריאה בין תפקידים מחוברים.**
--
-- 🕰️ **וזה פגם מקורי, לא נסיגה שלי:** הפונקציה נולדה כך במיגרציה
--    `20260827150049_module8_finance_write_actions` ומעולם לא נשאה שער. *(H5 שברה את ה-ACL
--    ל-`anon` — ההיא תוקנה בנפרד ב-H5b. שני דברים שונים.)*
--
-- 🔧 **התיקון: שורה אחת, ובאותה צורה בדיוק כמו שתי פונקציות-הקריאה האחרות של המודול**
--    (`get_finance_overview` · `get_project_finance_detail` — נבדק, שתיהן `array['edit','view']`).
--    ‏`view` ולא רק `edit`, כי מנהלת שרואה את המסך בקריאה-בלבד עדיין צריכה לראות את התחשיב.
--
-- 🔻 אימות אחרי ההחלה:
--   ① `select prosrc like '%assert_module_permission%' from pg_proc
--        where proname='finance_cancellation_fee_proposal';`  ⇒ true
--   ② ‏ACL נשאר `{postgres, authenticated, service_role}` — **בלי `anon`** (מוקש H5b חוזר על
--      כל `create or replace`? **לא** — הפעם אין `drop`, החתימה לא משתנה, וה-ACL נשמר.
--      **ובכל זאת למדוד**, כי זו בדיוק ההנחה ש-H5 שברה.)
--   ③ מסע חי: מנהלת-הכספים פותחת חלון-סגירה של פרויקט מבוטל ⇒ התחשיב מוצג כרגיל.
-- =============================================================================

create or replace function public.finance_cancellation_fee_proposal(p_project_id integer)
returns table(compensation_pct numeric, hours_before_event numeric, team_compensation numeric,
              goods_at_price numeric, goods_at_cost numeric, proposed_fee numeric,
              planned_hours numeric, compensated_count integer,
              payout_compensation numeric)
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_cancelled_at timestamptz; v_cancel_type text;
  v_event_start timestamptz; v_planned_hours numeric;
  v_full_h numeric; v_part_h numeric; v_part_pct numeric;
  v_hours numeric; v_pct numeric; v_payout_pct numeric;
  v_rate_sum numeric; v_n integer;
  v_goods_price numeric; v_goods_cost numeric;
begin
  -- 🔴 H6 — השער שחסר מלידתה. אותה צורה בדיוק כמו `get_finance_overview` ו-
  -- `get_project_finance_detail`. **ראשון בגוף**, לפני כל קריאת-נתונים.
  perform public.assert_module_permission('כספים', array['edit', 'view']);

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

  -- 🔵 H5 — **אחוז-התשלום**: מה שהצוות יקבל בפועל בדוח-השכר. מראה של ענף-השכר, בלי השעיית-"אחר".
  v_payout_pct := case
                    when v_cancel_type = 'force_majeure' then 0
                    when v_hours is null then null
                    when v_hours > v_part_h then 0
                    when v_hours >= v_full_h then v_part_pct
                    else 100
                  end;

  -- 🟢 **אחוז-ההצעה**: מה שמוצע **לחייב את הלקוח**. ‏H4/ה25 משעים אותו ב-"אחר".
  v_pct := case
             when v_cancel_type = 'force_majeure' then 0
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
    v_n,
    case when v_payout_pct is null or v_planned_hours is null then null
         else round(v_payout_pct / 100.0 * v_planned_hours * v_rate_sum, 2) end;
end;
$function$;
