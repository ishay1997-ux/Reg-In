-- 🛟 שחזור ל-`20260924233000_seed_close_events_2026_09.sql` — מחזיר את 20 הפרויקטים, 105 הזימונים ו-55
--    העדפות-הלקוח↔דיילת למצבם לפני הסגירה, מתוך שלוש טבלאות-הגיבוי ב-`seed_snapshot`.
-- ⚠️ `updated_at` אינו חוזר: טריגר `moddatetime` דורס אותו בכל עדכון. כל השאר — בדיוק.
-- ⚠️ להריץ רק אם הסגירה הוחלה, ורק לפני שמשהו אחר נגע ב-20 הפרויקטים (חשבונית, תשלום, משוב) —
--    השער למטה עוצר אם אחד מהם כבר לא ב-`awaiting_invoice`.
-- ⏳ נכתב, לא הוחל.

do $restore$
declare
  v_n int;
begin
  select count(*) into v_n from public.projects p
    join seed_snapshot.projects_close_20260924 b on b.project_id = p.project_id
   where p.project_status = 'awaiting_invoice';
  if v_n <> 20 then
    raise exception 'restore close-2026-09: רק % מ-20 הפרויקטים ב-awaiting_invoice — משהו נגע בהם אחרי הסגירה. עוצר.', v_n;
  end if;

  -- ① העדפות: זוגות שהסגירה יצרה ⇐ נמחקים; זוגות שהיו ⇐ חוזרים לערכם.
  delete from public.customer_hostess_preference c
   where exists (select 1
                   from seed_snapshot.assignments_close_20260924 a
                   join seed_snapshot.projects_close_20260924 p on p.project_id = a.project_id
                  where a.assignment_status = 'finally_approved'
                    and a.hostess_id = c.hostess_id and p.customer_id = c.customer_id)
     and not exists (select 1 from seed_snapshot.customer_hostess_preference_close_20260924 b
                      where b.preference_id = c.preference_id);
  update public.customer_hostess_preference c
     set preference = b.preference, preference_reason = b.preference_reason
    from seed_snapshot.customer_hostess_preference_close_20260924 b
   where b.preference_id = c.preference_id;

  -- ② זימונים.
  update public.assignments a
     set attendance_status = b.attendance_status, lateness_level = b.lateness_level,
         no_show_reason = b.no_show_reason, actual_hours = b.actual_hours
    from seed_snapshot.assignments_close_20260924 b
   where b.project_id = a.project_id and b.hostess_id = a.hostess_id and b.assignment_number = a.assignment_number;
  get diagnostics v_n = row_count;
  if v_n <> (select count(*) from seed_snapshot.assignments_close_20260924) then
    raise exception 'restore close-2026-09: שוחזרו % זימונים, צפוי % — עוצר.', v_n,
      (select count(*) from seed_snapshot.assignments_close_20260924);
  end if;

  -- ③ פרויקטים.
  update public.projects p
     set project_status = b.project_status, actual_hours = b.actual_hours, actual_guests = b.actual_guests,
         summary_report_url = b.summary_report_url,
         operationally_closed_at = b.operationally_closed_at, operationally_closed_by = b.operationally_closed_by
    from seed_snapshot.projects_close_20260924 b
   where b.project_id = p.project_id;
  get diagnostics v_n = row_count;
  if v_n <> 20 then
    raise exception 'restore close-2026-09: שוחזרו % פרויקטים, צפוי 20 — עוצר.', v_n;
  end if;
end
$restore$;
