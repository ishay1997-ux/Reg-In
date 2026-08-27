-- =============================================================================
-- מודול 8 · מיגרציה E3 · צעד 1.5 (חלק ג) — טרנזקציית דוח-השכר (P4)
-- =============================================================================
-- למה קובץ נפרד: דוח-השכר הוא **עולם אחר** מזרימת-הגבייה. ‏P1/P3 עוסקים בפרויקט
-- אחד; ‏P4 חוצה פרויקטים וחודשים, ומשלם לאנשים. שגיאה כאן אינה "מספר שגוי במסך" —
-- היא **תשלום כפול או תשלום שלא בוצע**.
--
-- 🔑 **מודל השורות-הלא-חתומות (ה15) — וזה הלב:** דוח חודש X אוסף **כל** שורת-שיבוץ
-- ש-`salary_report_id IS NULL` שתאריך-האירוע שלה בחודש X **או קודם**. ⇒ פרויקט
-- שנסגר באיחור עולה מעצמו לדוח הבא כשורת-רטרו, בלי שאיש יזכור. **מנגנון מניעת-הכפל
-- הוא החתימה עצמה** (`salary_report_id`), לא בדיקה — שורה חתומה לא תיאסף שוב לעולם.
--
-- 🔴 **שני מקורות, ולא אחד — וזה תיקון של ה15 שנתפס באותו יום ע"י שאלת-ישי:**
--   ‏(א) פרויקט **שנסגר תפעולית** — שעות-בפועל × תעריף-קפוא + בונוס אישי (ה7).
--   ‏(ב) פרויקט **שבוטל** — פיצוי-§7.16: ‏% × שעות-**מתוכננות** × תעריף-קפוא (ה24).
-- הנוסח הראשון מנה רק את (א); פרויקט מבוטל **לעולם אינו נסגר תפעולית**, ולכן פיצוי
-- הביטול לא היה נכנס לאף דוח — כלומר דיילות שאירוען בוטל לא היו מקבלות את הפיצוי
-- שהוכרע להן. אין כאן מנגנון שהיה תופס את זה; רק שאלה של אדם.
--
-- 🔴 **מי נאסף ונחתם (Q-5) — ההכרעה הכי קלה לבנות לא-נכון בכל הפזה:**
-- ה15 אמר "**כל** שורת-שיבוץ לא-חתומה". קריאה מילולית הייתה אוספת גם `declined`,
-- ‏`released` ו-`approval_withdrawn` — כל אחת הופכת ל**שורה חתומה לצמיתות על ₪0.00**
-- במסמך שנשלח לרו"ח. ⇒ **נאספות `finally_approved` בלבד** (מקור א) ו-
-- ‏`released_from_status='finally_approved'` בלבד (מקור ב, A-7). **חתימה היא בלתי-הפיכה.**
--
-- 🔴 **ה14 — הנסיעות נחתמות כאן, ברגע ההפקה, ולא ביצירת-השיבוץ.** החזר-נסיעות הוא
-- קצבה מוסדרת: משולם לפי השיעור **בתוקף**, לא לפי הבטחה קפואה — ולכן שונה במכוון
-- מ-`hourly_rate_snapshot`. ⚠️ **וב-16/ה29: רק למשמרת שבאמת עבדה** (`actual_hours > 0`);
-- משמרת שבוטלה לא נסעה, ואין מה להחזיר.
--
-- 🔴 **N-4 — שורות באפס ₪:** נחתמות ונרשמות (כדי שלא תיאספנה שוב ושהראיה שלמה),
-- אבל **מסומנות `show_in_file=false`** ולא ייכנסו לגוף האקסל. הסה"כ אינו משתנה.
--
-- 🔴 **פרטי-הבנק מוחזרים ואינם נשמרים (B-4).** האקסל צריך אותם; `salary_report_lines`
-- לא. שכפולם לטבלה שנייה היה פותח מחדש בדיוק את החשיפה שה19 סגר.
--
-- ⚠️ הכול DEFINER: מנהלת-הכספים חסומה ב-RLS מ'דיילות' (R4-F5) — קריאת-שיבוצים
-- וכתיבת-החתימות מצד-לקוח היו מחזירות `[]` בלי שגיאה.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. ההפקה — טרנזקציה אחת
-- -----------------------------------------------------------------------------
create or replace function generate_salary_report(p_period date)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_period      date;
  v_report_id   integer;
  v_travel_rate numeric;
  v_total       numeric := 0;
  v_lines       jsonb;
  v_existing    record;
begin
  perform public.assert_module_permission('כספים', array['edit']);

  if p_period is null then
    raise exception 'יש לבחור חודש להפקת הדוח.' using errcode = 'P0001';
  end if;
  v_period := date_trunc('month', p_period::timestamp)::date;

  -- החסימה נאמרת **לפני** ה-UNIQUE, כדי שההודעה תהיה של המסך ולא של המסד,
  -- ותכיל את מה שהמנהלת צריכה: מתי הופק, ולאן נשלח.
  select sr.report_id, sr.sent_date, sr.report_file_url into v_existing
    from public.salary_reports sr where sr.period = v_period;
  if found then
    raise exception 'דוח לחודש % כבר הופק (מספר %). לא ניתן להפיק פעמיים אותו חודש.',
      to_char(v_period, 'MM/YYYY'), v_existing.report_id using errcode = 'P0001';
  end if;

  select coalesce(pa.param_value::numeric, 0) into v_travel_rate
    from public.params pa where pa.param_name = 'סכום_נסיעות_למשמרת';
  v_travel_rate := coalesce(v_travel_rate, 0);

  insert into public.salary_reports (period, send_status)
  values (v_period, 'pending')
  returning report_id into v_report_id;

  -- ── איסוף שני המקורות ────────────────────────────────────────────────────
  create temp table _collect on commit drop as
  -- (א) עבודה בפועל בפרויקט שנסגר תפעולית
  select a.project_id, a.hostess_id, a.assignment_number,
         'actual'::text                      as line_basis,
         a.actual_hours                      as hours,
         a.hourly_rate_snapshot              as rate,
         coalesce(a.personal_bonus, 0)       as bonus,
         case when a.actual_hours > 0 then v_travel_rate else 0 end as travel
    from public.assignments a
    join public.projects p on p.project_id = a.project_id
   where a.salary_report_id is null
     and a.assignment_status = 'finally_approved'          -- Q-5
     and a.event_date <= (v_period + interval '1 month' - interval '1 day')::date
     and p.project_status in ('awaiting_invoice', 'awaiting_payment', 'finished')
  union all
  -- (ב) פיצוי-§7.16 בפרויקט שבוטל
  select a.project_id, a.hostess_id, a.assignment_number,
         'cancellation_compensation'::text,
         case when p.final_start_time is null or p.final_end_time is null then null
              else extract(epoch from (p.final_end_time - p.final_start_time)) / 3600.0 end
           * (case
                when p.cancel_type = 'force_majeure' then 0
                when p.cancelled_at is null then null
                when extract(epoch from (((p.final_event_date + p.final_start_time)
                       at time zone 'Asia/Jerusalem') - p.cancelled_at)) / 3600.0
                     >= (select pa.param_value::numeric from public.params pa
                          where pa.param_name = 'שעות_פיצוי_ביטול_חלקי') then 0
                when extract(epoch from (((p.final_event_date + p.final_start_time)
                       at time zone 'Asia/Jerusalem') - p.cancelled_at)) / 3600.0
                     >= (select pa.param_value::numeric from public.params pa
                          where pa.param_name = 'שעות_פיצוי_ביטול_מלא')
                  then (select pa.param_value::numeric from public.params pa
                         where pa.param_name = 'אחוז_פיצוי_ביטול_חלקי')
                else 100
              end) / 100.0                   as hours,
         a.hourly_rate_snapshot,
         0::numeric,                          -- ה24: הפיצוי הוא על השעות בלבד, בלי בונוס
         0::numeric                           -- ה29: משמרת שבוטלה לא נסעה
    from public.assignments a
    join public.projects p on p.project_id = a.project_id
   where a.salary_report_id is null
     and a.released_from_status = 'finally_approved'        -- A-7
     and p.project_status = 'cancelled'
     and a.event_date <= (v_period + interval '1 month' - interval '1 day')::date;

  -- 🔴 שורה שלא ניתן לחשב אינה נחתמת ואינה נשלחת כ-0. A-8: מספר שגוי גרוע מחסר.
  if exists (select 1 from _collect where hours is null) then
    raise exception 'לא ניתן להפיק את הדוח — לפרויקט מבוטל אחד או יותר חסרות שעות סופיות לחישוב הפיצוי.'
      using errcode = 'P0001';
  end if;

  -- ── כתיבת השורות + החתימה, באותה טרנזקציה ────────────────────────────────
  insert into public.salary_report_lines
    (report_id, hostess_id, hostess_name, id_number, source_project_id,
     line_basis, hours, rate, bonus, travel, line_total)
  select v_report_id, c.hostess_id, h.full_name, h.id_number, c.project_id,
         c.line_basis, round(c.hours, 2), c.rate,
         nullif(c.bonus, 0),                        -- ה24/§3.7: "—" ולא 0.00 כשלא-רלוונטי
         nullif(c.travel, 0),
         round(c.hours * c.rate + c.bonus + c.travel, 2)
    from _collect c join public.hostesses h on h.hostess_id = c.hostess_id;

  update public.assignments a
     set salary_report_id = v_report_id,
         travel_amount = c.travel                    -- ה14: החתימה ברגע ההפקה
    from _collect c
   where a.project_id = c.project_id
     and a.hostess_id = c.hostess_id
     and a.assignment_number = c.assignment_number;

  select coalesce(sum(l.line_total), 0) into v_total
    from public.salary_report_lines l where l.report_id = v_report_id;

  update public.salary_reports set total_amount = v_total where report_id = v_report_id;

  -- ── מה שחוזר ללקוח כדי לבנות את האקסל ────────────────────────────────────
  -- 🔴 פרטי-הבנק כאן ו**לא** בטבלת-השורות (B-4). ‏`show_in_file` מיישם את N-4.
  select coalesce(jsonb_agg(x order by x->>'hostess_name'), '[]'::jsonb) into v_lines
    from (
      select jsonb_build_object(
               'hostess_id', l.hostess_id,
               'hostess_name', l.hostess_name,
               'id_number', l.id_number,
               'source_project_id', l.source_project_id,
               'line_basis', l.line_basis,
               'hours', l.hours,
               'rate', l.rate,
               'bonus', l.bonus,
               'travel', l.travel,
               'line_total', l.line_total,
               'bank_name', b.bank_name,
               'bank_branch', b.bank_branch,
               'bank_account', b.bank_account,
               'show_in_file', l.line_total <> 0
             ) as x
        from public.salary_report_lines l
        left join public.hostess_bank_details b on b.hostess_id = l.hostess_id
       where l.report_id = v_report_id
    ) s;

  return jsonb_build_object(
    'ok', true,
    'report_id', v_report_id,
    'period', v_period,
    'total_amount', v_total,
    'line_count', (select count(*) from public.salary_report_lines where report_id = v_report_id),
    'lines', v_lines
  );
end;
$$;

comment on function generate_salary_report(date) is
  'מ8 P4 — הפקת דוח-השכר החודשי: איסוף שורות לא-חתומות משני מקורות, snapshot, חתימה וחותמת-נסיעות, הכול בטרנזקציה אחת.';

revoke execute on function generate_salary_report(date) from public, anon, authenticated;
grant execute on function generate_salary_report(date) to authenticated;


-- -----------------------------------------------------------------------------
-- 2. סגירת הדוח אחרי שהקובץ נבנה ונשלח
-- -----------------------------------------------------------------------------
-- 🔴 **הדוח נשמר גם כשהמייל נכשל** (P4). "נכשל" הוא מצב מוצג עם שליחה-חוזרת
-- מההיסטוריה — לא סיבה לאבד את ה-snapshot ואת החתימות שכבר נכתבו.
create or replace function finalize_salary_report(
  p_report_id integer,
  p_file_url text,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform public.assert_module_permission('כספים', array['edit']);

  if p_status not in ('sent', 'failed') then
    raise exception 'סטטוס שליחה לא מוכר.' using errcode = 'P0001';
  end if;

  update public.salary_reports
     set report_file_url = coalesce(p_file_url, report_file_url),
         send_status = p_status,
         sent_date = case when p_status = 'sent' then current_date else sent_date end
   where report_id = p_report_id;

  if not found then
    raise exception 'דוח שכר % לא נמצא.', p_report_id using errcode = 'P0001';
  end if;

  return jsonb_build_object('ok', true, 'report_id', p_report_id, 'send_status', p_status);
end;
$$;

revoke execute on function finalize_salary_report(integer, text, text) from public, anon, authenticated;
grant execute on function finalize_salary_report(integer, text, text) to authenticated;
