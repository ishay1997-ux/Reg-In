-- =============================================================================
-- מודול 8 · תיקון-קדימה ל-E3 · צעד 1.5
-- =============================================================================
-- 🐞 **הבאג, ואיך נתפס:** ‏`generate_salary_report` יוצרת טבלה זמנית `_collect` עם
-- `on commit drop`. הדגל הזה מוחק אותה **בסוף הטרנזקציה** — ולכן **קריאה שנייה
-- לפונקציה באותה טרנזקציה נכשלת** ב-`relation "_collect" already exists`.
--
-- **בייצור זה לא היה מתפוצץ:** כל קריאת-RPC של Supabase רצה בטרנזקציה משלה, ולכן
-- הטבלה נמחקת בין קריאה לקריאה. ⇒ הבאג היה יושב שקט עד שמישהו היה קורא לפונקציה
-- פעמיים באותה טרנזקציה — למשל `finalize` ואז `generate` בבאצ' אחד, או כל קיבוץ עתידי.
--
-- 🔑 **ומה שכן נשבר מיד, וזה החשוב:** בפרויקט הזה מאמתים פונקציות-כתיבה בהרצה על
-- דאטה אמיתית **בתוך טרנזקציה שמתגלגלת אחורה**. באג כזה הופך את הפונקציה
-- ל**בלתי-ניתנת-לאימות בשיטה הזאת** — כלומר הוא לא רק פגם שקט, הוא פגם **שמכבה את
-- הבודק**. נתפס בניסיון הראשון להפיק דוח-אוגוסט ואז דוח-ספטמבר ברצף, 27/08/2026,
-- לפני שנכתב דבר לצמיתות.
--
-- 🚫 **המיגרציה המקורית לא נערכה** — היא הוחלה וקומטה, כלומר היסטוריה
-- (`supabase/migrations/CLAUDE.md`: append-only; תיקון = מיגרציה חדשה קדימה).
--
-- **התיקון:** מחיקה מפורשת לפני היצירה. ‏`on commit drop` נשאר כרשת-ביטחון לסוף
-- הטרנזקציה, וה-`drop … if exists` מטפל בטבלה ששרדה מקריאה קודמת **באותה** טרנזקציה;
-- שתי השורות יחד מכסות את שני התרחישים.
-- 🚫 **אין כאן שינוי לוגיקה, נוסחה או הרשאה.** הגוף נגזר מהמיגרציה המקורית
-- תוכנתית ולא הוקלד מחדש — הדלתא היא **שורה אחת בדיוק**.
-- =============================================================================

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
  -- ⬇️ התיקון היחיד מול הגרסה הקודמת.
  drop table if exists _collect;

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
