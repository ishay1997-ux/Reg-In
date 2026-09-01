-- =============================================================================
-- מודול 8 · מיגרציה H5 — עוגן-התשלום להחלטה הידנית בסיווג "אחר"
-- =============================================================================
-- 🔴🔴🔴 **טרם הוחלה. נכתבה 28/08/2026 09:56 וממתינה לשער-ההקלדה של ישי.**
--        ‏"מאשר" בצ'אט מאשר **לבנות** — הוא אינו שער-ההקלדה. ‏H1–H4 קיבלו כל אחת הקלדה נפרדת.
-- =============================================================================
--
-- 🎯 **מאיפה זה נולד — שאלת-ישי, מיד אחרי ש-H4 הוחלה:**
--    *"מנהלת הכספים באחר איך היא בוחרת כמה החזר?"*
--    ‏H4 עשתה את הדבר הנכון (הסירה את ההצעה האוטומטית שה25 אסר), **אבל השאירה אותה מול שדה
--    ריק.** *"שיקול-דעת"* בלי מספר להישען עליו הוא ניחוש, לא שיקול-דעת.
--
-- 🔑 **והמדידה שהופכת את זה מ"נחמד" ל"נדרש" (28/08/2026, קריאת `prosrc` חיה):**
--    ‏`generate_salary_report` מסתעף על `force_majeure` **בלבד** — אין בו ולו אזכור אחד של
--    `'other'`. ⇒ **פרויקט שבוטל כ"אחר" עדיין משלם לדיילות** את פיצוי-הסולם המלא.
--    **כלומר ההחלטה שלה מעולם לא הייתה "כמה לחייב" באוויר, אלא:**
--      *"אנחנו כבר משלמים X לצוות — כמה מ-X להעביר ללקוח?"*
--    טווח מוגדר: ‏**0** (החברה סופגת) → **X** (הלקוח מכסה את הצוות) → **X + סחורה** (מכסה הכול).
--
-- 🔴 **ולמה זה חייב לבוא מהמסד ולא מהמסך:** חישוב `pct × שעות × Σתעריפים` ב-JS הוא
--    **מחשבון-כסף שני** — בדיוק מה ש-F16/R1-4 אוסרים, ובדיוק מה שהתגלה כמסוכן ב-H2/H3
--    (אותו כלל בשני מקומות, ושניהם שגו). **מספר-כסף אחד, מקור אחד.**
--
-- 📐 **מה העמודה מחזירה, ומה היא במפורש אינה:**
--    ‏`payout_compensation` = הפיצוי שהצוות **יקבל בפועל בדוח-השכר**, לפי כלל-השכר
--    (‏`force_majeure` ⇒ 0 · אחרת הסולם) — **בלי השעיית-ה"אחר" של H4.**
--    🚫 **היא אינה הצעת-חיוב.** ‏`proposed_fee`/`team_compensation` נשארים `null` ב"אחר"
--    בדיוק כפי ש-H4 קבעה; ה25 לא נסוג ולו בסנטימטר. **זהו עוגן-ידיעה, לא ברירת-מחדל** —
--    והמסך **אינו זורע** ממנו את שדה-הסכום *(נבדק בבדיקה ייעודית)*.
--
-- ⚠️ **פער-עיגול שכבר קיים היום ואינו נוצר כאן — נאמר כדי שלא ייקרא כבאג:**
--    דוח-השכר מעגל **פר-שורה** ואז סוכם; שתי העמודות כאן מעגלות **את הסכום**. עם דיילת אחת
--    זהה לחלוטין; עם N דיילות ההפרש חסום ב-N×½ אגורה. **‏`payout_compensation` נבנתה בכוונה
--    באותה צורה בדיוק כמו `team_compensation`** — כדי שהשתיים יסכימו בייט-בבייט בכל סיווג
--    שאינו "אחר", ולא ייראו כשני מספרים סותרים על מסך אחד.
--
-- 🔑 **מקור הגוף:** נמשך חי מ-`pg_get_functiondef` אחרי H4 (28/08/2026 09:5X;
--    ‏`md5(prosrc)`=`a8ad0c1765be015d6ca69b42bff172d6`, אורך 3,270).
--    **השינויים מול הגוף החי: ‏`v_payout_pct` + עמודת-החזרה התשיעית. שום שינוי בקיים.**
--
-- 🔴 **`create or replace` אינו מספיק כאן, ו-Postgres עוצר על זה במפורש:**
--    *"cannot change return type of existing function — Row type defined by OUT parameters is
--    different"*. הוספת עמודת-החזרה מחייבת `drop function` ואז יצירה מחדש.
-- 🩸 **ומה ש-`drop` הורס בשקט, ולכן נמדד לפני ולא אחרי (28/08/2026, `pg_proc.proacl`):**
--    ‏`{postgres=X/postgres, service_role=X/postgres, authenticated=X/postgres}` — כלומר
--    **הרשאות-ההרצה מפורשות, ו-PUBLIC נשלל.** ⚠️ **ובמיוחד: ל-`anon` אין הרצה** — וזה מכוון:
--    ‏`finance_cancellation_fee_proposal` היא `security definer` וחושפת נתוני-כסף.
--    ⇒ **המיגרציה חייבת להחזיר את ה-ACL בעצמה.** ‏`drop` בלי ה-`grant` שאחריו היה מחזיר את
--    ברירת-המחדל של Postgres — **`EXECUTE` ל-PUBLIC**, כלומר פתיחת הפונקציה לכל תפקיד
--    כולל `anon`. **זו לא הערה זהירותית: זו הסיבה שהשורות האלה קיימות.**
--
-- 🔻 אימות אחרי ההחלה (שלושתם חייבים להחזיר true):
--   select prosrc like '%v_payout_pct%' from pg_proc where proname='finance_cancellation_fee_proposal';
--   -- ובעסקה מתגלגלת על #11 (48ש' לפני): other ⇒ proposed_fee IS NULL **וגם** payout_compensation = 90.00
--   -- customer ⇒ team_compensation = payout_compensation (השתיים חייבות להסכים)
-- =============================================================================

-- 🔴 חובה לפני היצירה מחדש — ר' ההסבר בכותרת. `if exists` כדי שהמיגרציה תהיה
-- בת-הרצה-חוזרת (idempotent) ולא תיפול על סביבה שבה הפונקציה עדיין לא קיימת.
drop function if exists public.finance_cancellation_fee_proposal(integer);

create function public.finance_cancellation_fee_proposal(p_project_id integer)
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

  -- 🔵 H5 — **אחוז-התשלום**: מה שהצוות יקבל בפועל בדוח-השכר. מראה מדויקת של ענף
  -- `cancellation_compensation` ב-`generate_salary_report` — כלומר **בלי** השעיית-ה"אחר".
  -- 🔴 **זהו הכלל שקובע כמה כסף יוצא מהחברה, והוא אינו תלוי בשאלה מי אשם.**
  v_payout_pct := case
                    when v_cancel_type = 'force_majeure' then 0
                    when v_hours is null then null
                    when v_hours > v_part_h then 0
                    when v_hours >= v_full_h then v_part_pct
                    else 100
                  end;

  -- 🟢 **אחוז-ההצעה**: מה שאנחנו מציעים **לחייב את הלקוח**. זהה לאחוז-התשלום בכל סיווג
  -- **חוץ מ"אחר"**, שבו H4/ה25 משעים את ההצעה ומשאירים את ההכרעה למנהלת.
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
    v_n,
    -- אותה צורה בדיוק כמו `team_compensation` שלמעלה, עם אחוז-התשלום — כדי שהשתיים
    -- יסכימו בייט-בבייט בכל סיווג שאינו "אחר".
    case when v_payout_pct is null or v_planned_hours is null then null
         else round(v_payout_pct / 100.0 * v_planned_hours * v_rate_sum, 2) end;
end;
$function$;

-- 🔒 שחזור ה-ACL שנמדד לפני ה-`drop` — **בדיוק כפי שהיה, לא רחב יותר.**
-- ‏`revoke from public` הוא החצי החשוב: בלעדיו ברירת-המחדל של Postgres נותנת `EXECUTE`
-- לכל תפקיד, **כולל `anon`** — פונקציית-כסף `security definer` שנפתחת לאנונימי.
revoke all on function public.finance_cancellation_fee_proposal(integer) from public;
grant execute on function public.finance_cancellation_fee_proposal(integer) to authenticated;
grant execute on function public.finance_cancellation_fee_proposal(integer) to service_role;
