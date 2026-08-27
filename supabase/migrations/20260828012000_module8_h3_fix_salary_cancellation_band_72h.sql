-- =============================================================================
-- מודול 8 · מיגרציה H3 — אותו תיקון של H2, בפונקציה השנייה שנושאת אותו פגם
-- =============================================================================
-- 🔴🔴🔴 **טרם הוחלה. נכתבה 28/08/2026 01:2X וממתינה לשער-ההקלדה של ישי.**
--        ‏H1 ו-H2 הוחלו אחרי שישי הקליד את שמותיהן. **הקלדה אחת אינה מכסה מיגרציה
--        אחרת** — גם כשמדובר באותו באג בדיוק.
-- =============================================================================
--
-- 🔴 **וזו תוספת לתיקון שלי-עצמי, לא ממצא חדש על מישהו אחר.**
--    ‏H2 תיקנה את גבול-ה-72.0 שעות ב-`finance_cancellation_fee_proposal` — **ועצרה שם.**
--    ‏`_shared/discipline.md` אומר במפורש: *"תיקון אינו גמור עד שבדקת איפה עוד חי אותו
--    פגם"*, ואני לא בדקתי. **בודק-הפאנל של פזה 4 מצא את המופע השני.**
--
-- 🩸 **והמופע השני חמור יותר מזה שכבר תוקן:**
--      · `finance_cancellation_fee_proposal` — **מציגה הצעה על המסך.** אפשר לתקן ידנית
--        לפני השמירה; מנהלת-הכספים רואה את המספר.
--      · `generate_salary_report` — **משלמת לדיילות בפועל.** היא כותבת שורות-שכר,
--        **חותמת אותן לצמיתות** (`salary_report_id`), ושולחת את הקובץ לרו"ח.
--        ⇒ כאן ה-0% במקום 50% הופך ל**דיילת שלא קיבלה פיצוי שמגיע לה**, בתוך מסמך חתום.
--
-- 🔎 **הפגם, מילה-במילה, בענף `cancellation_compensation` של ה-CTE `_collect`:**
--
--      when extract(...) / 3600.0
--           >= (… 'שעות_פיצוי_ביטול_חלקי') then 0      ⇐ ‏>= שולח את 72.0 בדיוק ל-0%
--
--    ה24 (‏`processes-approved.md`, מראת-§7.16): ‏**>72 = 0% · 24–72 = 50% · <24 = 100%**
--    ⇒ ‏72.0 בדיוק **בתוך** טווח-ה-50%. **התיקון: `>=` ⇒ `>`, מופע אחד.**
--    ⚠️ ה-`>=` השני (מול `שעות_פיצוי_ביטול_מלא`=24) **נכון ואינו נוגע** — ‏24.0 בדיוק
--       אכן צריך להחזיר 50%.
--
-- 🔑 **מקור הגוף:** נמשך חי מ-`pg_get_functiondef` ב-28/08/2026 01:2X
--    (‏`md5(prosrc)`=`8dd84f0a24eaea4516f11890652db3e7`, אורך 5,860).
--    **השינוי היחיד מול הגוף החי הוא התו הזה.**
--
-- 🔻 אימות אחרי ההחלה (חייב להחזיר true):
--   select prosrc not like '%>= (select pa.param_value::numeric from public.params pa%
--     where pa.param_name = ''שעות_פיצוי_ביטול_חלקי'')%'
--     from pg_proc where proname='generate_salary_report';
-- =============================================================================

create or replace function public.generate_salary_report(p_period date)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
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

  drop table if exists _collect;

  create temp table _collect on commit drop as
  select a.project_id, a.hostess_id, a.assignment_number,
         'actual'::text                      as line_basis,
         a.actual_hours                      as hours,
         a.hourly_rate_snapshot              as rate,
         coalesce(a.personal_bonus, 0)       as bonus,
         case when a.actual_hours > 0 then v_travel_rate else 0 end as travel
    from public.assignments a
    join public.projects p on p.project_id = a.project_id
   where a.salary_report_id is null
     and a.assignment_status = 'finally_approved'
     and a.event_date <= (v_period + interval '1 month' - interval '1 day')::date
     and p.project_status in ('awaiting_invoice', 'awaiting_payment', 'finished')
  union all
  select a.project_id, a.hostess_id, a.assignment_number,
         'cancellation_compensation'::text,
         case when p.final_start_time is null or p.final_end_time is null then null
              else extract(epoch from (p.final_end_time - p.final_start_time)) / 3600.0 end
           * (case
                when p.cancel_type = 'force_majeure' then 0
                when p.cancelled_at is null then null
                -- 🔴 H3: היה `>=`. ה24 קובע ">72 = 0%" והטווח "24–72 = 50%" מכיל את 72,
                -- ולכן ביטול בדיוק 72.0 שעות לפני האירוע מזכה ב-50% ולא באפס.
                when extract(epoch from (((p.final_event_date + p.final_start_time)
                       at time zone 'Asia/Jerusalem') - p.cancelled_at)) / 3600.0
                     > (select pa.param_value::numeric from public.params pa
                          where pa.param_name = 'שעות_פיצוי_ביטול_חלקי') then 0
                -- ⚠️ ה-`>=` הבא נכון ואינו משתנה: 24.0 בדיוק כן מזכה ב-50%.
                when extract(epoch from (((p.final_event_date + p.final_start_time)
                       at time zone 'Asia/Jerusalem') - p.cancelled_at)) / 3600.0
                     >= (select pa.param_value::numeric from public.params pa
                          where pa.param_name = 'שעות_פיצוי_ביטול_מלא')
                  then (select pa.param_value::numeric from public.params pa
                         where pa.param_name = 'אחוז_פיצוי_ביטול_חלקי')
                else 100
              end) / 100.0                   as hours,
         a.hourly_rate_snapshot,
         0::numeric,
         0::numeric
    from public.assignments a
    join public.projects p on p.project_id = a.project_id
   where a.salary_report_id is null
     and a.released_from_status = 'finally_approved'
     and p.project_status = 'cancelled'
     and a.event_date <= (v_period + interval '1 month' - interval '1 day')::date;

  if exists (select 1 from _collect where hours is null) then
    raise exception 'לא ניתן להפיק את הדוח — לפרויקט מבוטל אחד או יותר חסרות שעות סופיות לחישוב הפיצוי.'
      using errcode = 'P0001';
  end if;

  insert into public.salary_report_lines
    (report_id, hostess_id, hostess_name, id_number, source_project_id,
     line_basis, hours, rate, bonus, travel, line_total)
  select v_report_id, c.hostess_id, h.full_name, h.id_number, c.project_id,
         c.line_basis, round(c.hours, 2), c.rate,
         nullif(c.bonus, 0),
         nullif(c.travel, 0),
         round(c.hours * c.rate + c.bonus + c.travel, 2)
    from _collect c join public.hostesses h on h.hostess_id = c.hostess_id;

  update public.assignments a
     set salary_report_id = v_report_id,
         travel_amount = c.travel
    from _collect c
   where a.project_id = c.project_id
     and a.hostess_id = c.hostess_id
     and a.assignment_number = c.assignment_number;

  select coalesce(sum(l.line_total), 0) into v_total
    from public.salary_report_lines l where l.report_id = v_report_id;

  update public.salary_reports set total_amount = v_total where report_id = v_report_id;

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
$function$;
