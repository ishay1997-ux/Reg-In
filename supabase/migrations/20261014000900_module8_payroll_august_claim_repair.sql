-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 9 (A) — תיקון השיוכים של דוח אוגוסט
-- =============================================================================
-- why: דוח אוגוסט 2026 (report 15) הופק ב-09.09 עם 83 שורות, אבל במסד החי אף משמרת לא
-- משויכת אליו (נמדד 13.10: 0 שיוכים). כלומר 83 משמרות ששולמו נראות כ"עוד לא שולמו",
-- והדוח הבא היה משלם אותן שוב. הסיבה הסבירה: שחזור תמונת-מצב של הזריעה (15.09), שמריץ
-- truncate … cascade ומחזיר שיבוצים בלי שיוך (בודק 1, W0-2; n=1, מתאריכים בלבד).
--
-- 🔑 הכלל: השורה החתומה היא הסמכות. לכל שורה מחפשים שיבוץ יחיד: אותו פרויקט, אותה
--    דיילת, לא משויך, עד 31.08.2026, והסטטוס מתאים לבסיס השורה ('actual' ⇒ finally_approved;
--    פיצוי ⇒ released מתוך finally_approved). חייב להיות בדיוק מועמד אחד לכל שורה, ושום
--    שיבוץ לא מותאם לשתי שורות — אחרת raise והכול מתבטל. שום דבר לא מנוחש.
--    נמדד 13.10.2026 (W0-1, SELECT בלבד): 83 שורות · 83 עם מועמד יחיד · 0 בלי · 0 עם כמה ·
--    0 כפולים · 0 פערי שעות/תעריף · Σ שורות 22,508.30 = total_amount.
-- 🔑 גיבוי לפני הכתיבה, באותה טרנזקציה: seed_snapshot.assignments_payroll_claim_20261014
--    (השיבוץ המלא + מזהה השורה + שעות/תעריף/נסיעות מהשורה + value_mismatch).
-- 🔑 הכתיבה: salary_report_id = 15, travel_amount = travel מהשורה (מה שההפקה המקורית
--    כתבה). פער ערכים נרשם בגיבוי ואינו חוסם.
-- 🔑 בדיקה פנימית: מספר השיבוצים המשויכים לדוח אחרי התיקון = מספר שורות הדוח = 83
--    (הערך שנמדד ושהחוזה קובע, §1.1) — אחרת raise.
-- 🔑 על מסד בלי דוח לאוגוסט 2026 (העתק מקומי ריק) המיגרציה לא עושה כלום ואומרת זאת.
-- 🔒 לא מבוטל לעולם: זה המצב הנכון. הגיבוי נשמר.
-- =============================================================================

do $$
declare
  v_aug        integer;
  v_lines      integer;
  v_one        integer;
  v_double     integer;
  v_claimed    integer;
  v_after      integer;
begin
  select report_id into v_aug
    from public.salary_reports
   where period = '2026-08-01' and report_kind = 'regular';
  if not found then
    raise notice 'august claim repair: no regular report for 2026-08 in this database — nothing to repair';
    return;
  end if;

  perform public._payroll_lock();

  create temp table _aug_match on commit drop as
  select l.line_id, l.hours as line_hours, l.rate as line_rate, l.travel as line_travel,
         a.project_id, a.hostess_id, a.assignment_number,
         (round(a.actual_hours, 2) <> l.hours or a.hourly_rate_snapshot <> l.rate) as value_mismatch
    from public.salary_report_lines l
    join public.assignments a
      on a.project_id = l.source_project_id
     and a.hostess_id = l.hostess_id
     and a.salary_report_id is null
     and a.event_date <= '2026-08-31'
     and ((l.line_basis = 'actual' and a.assignment_status = 'finally_approved')
          or (l.line_basis = 'cancellation_compensation' and a.assignment_status = 'released'
              and a.released_from_status = 'finally_approved'))
   where l.report_id = v_aug;

  select count(*) into v_lines from public.salary_report_lines where report_id = v_aug;
  select count(*) into v_one
    from (select line_id from _aug_match group by line_id having count(*) = 1) x;
  select count(*) into v_double
    from (select project_id, hostess_id, assignment_number from _aug_match
           group by 1, 2, 3 having count(*) > 1) x;

  if v_one <> v_lines or (select count(*) from _aug_match) <> v_lines or v_double <> 0 then
    raise exception 'august claim repair aborted: % lines, % with exactly one candidate, % candidate rows, % assignments matched twice',
      v_lines, v_one, (select count(*) from _aug_match), v_double;
  end if;

  create table seed_snapshot.assignments_payroll_claim_20261014 as
  select a.*, m.line_id, m.line_hours, m.line_rate, m.line_travel, m.value_mismatch
    from _aug_match m
    join public.assignments a
      on a.project_id = m.project_id and a.hostess_id = m.hostess_id
     and a.assignment_number = m.assignment_number;
  revoke all on table seed_snapshot.assignments_payroll_claim_20261014 from public, anon, authenticated;

  perform public._payroll_writer_begin();

  update public.assignments a
     set salary_report_id = v_aug,
         travel_amount = coalesce(m.line_travel, 0)
    from _aug_match m
   where a.project_id = m.project_id and a.hostess_id = m.hostess_id
     and a.assignment_number = m.assignment_number
     and a.salary_report_id is null;
  get diagnostics v_claimed = row_count;

  select count(*) into v_after from public.assignments where salary_report_id = v_aug;
  if v_claimed <> v_lines or v_after <> v_lines or v_after <> 83 then
    raise exception 'august claim repair post-check failed: % lines, % updated, % now claimed',
      v_lines, v_claimed, v_after;
  end if;

  raise notice 'august claim repair: report %, % assignments re-linked (% with a value mismatch, kept as issued)',
    v_aug, v_claimed, (select count(*) from _aug_match where value_mismatch);
end $$;
