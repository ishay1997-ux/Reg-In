-- 20/08/2026 — תיקון-קדימה לפונקציית הסגירה התפעולית close_project_operationally.
-- נולד באודיט-הסגירה של מודול 6 (5.2): ההרצה החיה הראשונה של מסע-הסגירה על פרויקט #12
-- (מאויש בדיילת אחת) נפלה כי הפונקציה חישבה את תקרת-שעות-הדיילת מהשעות ה*מתוכננות*.
-- הגוף כאן נמשך מהמסד החי (pg_get_functiondef) ולא מקובץ ישן — פרוטוקול ה-DB, אחרי תקרת 12/08.
--
-- תיקון יחיד (כל שאר הגוף זהה-בייט לגרסה החיה):
--   תקרת-שעות-הדיילת נגזרת מ*שעות-האירוע שהוזנו* (p_actual_hours, שכבר עברו ולידציית
--   0.5–24 מעליו) במקום מהשעות המתוכננות (final_start_time/final_end_time). כך היא
--   מתלכדת עם הכרטיס המאושר (screens-approved.md:1412) ועם המסך
--   (src/lib/projectClosing.js:159). #12 (מתוכנן 1.5ש, הוזן 6) נפל בדיוק כאן.
--   ⇒ v_max_hours := p_actual_hours + 2. final_start_time/final_end_time כבר לא נדרשים
--   לחישוב, אך נשמרים ב-SELECT ובהצהרות כדי למזער את הדיף.
--
-- 🚫 מה שבמכוון לא נגעתי בו: החסימה על מערך-דיילות ריק. אירוע ללא דיילות אינו קורה
--    במציאות (הכרעת-מציאות של ישי, 20/08/2026) ⇒ אין לבנות התנהגות למקרה שלא מתקיים;
--    ה-raise הקיים נשאר, ולעולם אינו נורה על סגירה אמיתית.
--
-- הפיכוּת: מלאה ובלי אובדן-נתונים — CREATE OR REPLACE של גוף-פונקציה בלבד; אין
-- שינוי טבלה/עמודה/RLS/טריגר. חזרה אחורה = replace חוזר לגוף הקודם.

create or replace function public.close_project_operationally(
  p_project_id integer,
  p_actual_hours numeric,
  p_actual_guests integer,
  p_report_path text,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor          text := (select auth.email());
  v_status         text;
  v_closed_at      timestamptz;
  v_customer_id    bigint;
  v_customer_name  text;
  v_event_name     text;
  v_start          time without time zone;
  v_end            time without time zone;
  v_max_hours      numeric;
  v_report         text := nullif(btrim(coalesce(p_report_path, '')), '');
  v_offender       text;
  v_row            jsonb;
  v_hostess_id     bigint;
  v_name           text;
  v_attendance     text;
  v_lateness       text;
  v_no_show        text;
  v_hours          numeric;
  v_preference     text;
  v_reason         text;
  v_assignment_no  integer;
  v_payload_an     integer;
  v_can_mark       boolean;
  v_marks_saved    integer := 0;
  v_written        integer;
  v_new_closed_at  timestamptz;
  v_feedback       text;
begin
  perform public.assert_module_permission('פרויקטים', array['edit']);

  select p.project_status, p.operationally_closed_at, p.customer_id, p.customer_name,
         p.event_name, p.final_start_time, p.final_end_time
    into v_status, v_closed_at, v_customer_id, v_customer_name,
         v_event_name, v_start, v_end
    from public.projects p
   where p.project_id = p_project_id
   for update;

  if not found then
    raise exception 'הפרויקט המבוקש לא נמצא.' using errcode = 'P0002';
  end if;

  if v_status <> 'event_finished' then
    raise exception 'לא ניתן לסגור את האירוע: הסגירה התפעולית זמינה רק לאירוע שהסתיים וממתין לסגירה.'
      using errcode = 'P0001';
  end if;

  if v_closed_at is not null then
    raise exception 'האירוע כבר נסגר תפעולית, ואי-אפשר לסגור אותו פעם נוספת.'
      using errcode = 'P0001';
  end if;

  if v_report is null then
    raise exception 'חובה לצרף דוח-סיכום.' using errcode = 'P0001';
  end if;

  if p_actual_hours is null or p_actual_hours < 0.5 or p_actual_hours > 24 then
    raise exception 'חובה להזין שעות ביצוע — מספר בין 0.5 ל-24.' using errcode = 'P0001';
  end if;

  if p_actual_guests is null or p_actual_guests < 0 then
    raise exception 'חובה להזין כמות אורחים בפועל. אם לא הגיע איש — הזיני 0.'
      using errcode = 'P0001';
  end if;

  -- שומר-הלקוח: דגל ולא raise. פרויקט בלי לקוח מדלג על ה-upsert ומשלים את הסגירה.
  v_can_mark := v_customer_id is not null;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'לא התקבלה רשימת הדיילות לסגירת האירוע.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_rows) = 0 then
    raise exception 'לא התקבלה רשימת הדיילות לסגירת האירוע.' using errcode = 'P0001';
  end if;

  select coalesce(h.full_name, e.hostess_id::text) into v_offender
    from (select distinct on (a.hostess_id) a.hostess_id, a.assignment_status
            from public.assignments a
           where a.project_id = p_project_id
           order by a.hostess_id, a.assignment_number desc) e
    left join public.hostesses h on h.hostess_id = e.hostess_id
   where e.assignment_status = 'finally_approved'
     and not exists (select 1
                       from jsonb_array_elements(p_rows) r
                      where (r->>'hostess_id')::bigint = e.hostess_id)
   order by 1
   limit 1;

  if v_offender is not null then
    raise exception 'חסר סימון נוכחות ל-%.', v_offender using errcode = 'P0001';
  end if;

  select coalesce(h.full_name, (r->>'hostess_id')) into v_offender
    from jsonb_array_elements(p_rows) r
    left join public.hostesses h on h.hostess_id = (r->>'hostess_id')::bigint
   where not exists (
           select 1
             from (select distinct on (a.hostess_id) a.hostess_id, a.assignment_status
                     from public.assignments a
                    where a.project_id = p_project_id
                    order by a.hostess_id, a.assignment_number desc) e
            where e.assignment_status = 'finally_approved'
              and e.hostess_id = (r->>'hostess_id')::bigint)
   order by 1
   limit 1;

  if v_offender is not null then
    raise exception 'הדיילת % אינה מאושרת סופית לאירוע הזה, ולכן אינה על רשימת-הסגירה.', v_offender
      using errcode = 'P0001';
  end if;

  select coalesce(h.full_name, d.hid::text) into v_offender
    from (select (r->>'hostess_id')::bigint as hid
            from jsonb_array_elements(p_rows) r
           group by 1
          having count(*) > 1) d
    left join public.hostesses h on h.hostess_id = d.hid
   order by 1
   limit 1;

  if v_offender is not null then
    raise exception 'הדיילת % מופיעה פעמיים ברשימת-הסגירה.', v_offender using errcode = 'P0001';
  end if;

  -- תקרת-שעות-דיילת נגזרת מהשעות שהוזנו (p_actual_hours, כבר ולידציה 0.5–24) ולא
  -- מהמתוכננות — כדי שתתלכד עם הכרטיס (screens-approved:1412) ועם המסך. (5.2 fix)
  v_max_hours := p_actual_hours + 2;

  update public.projects p
     set actual_hours             = p_actual_hours,
         actual_guests            = p_actual_guests,
         summary_report_url       = v_report,
         project_status           = 'awaiting_invoice',
         operationally_closed_at  = now(),
         operationally_closed_by  = v_actor
   where p.project_id = p_project_id
  returning p.operationally_closed_at, p.feedback_status
       into v_new_closed_at, v_feedback;

  for v_row in select e.value from jsonb_array_elements(p_rows) e
  loop
    v_hostess_id := (v_row->>'hostess_id')::bigint;

    if v_hostess_id is null then
      raise exception 'אחת השורות ברשימת-הסגירה הגיעה בלי מזהה דיילת.' using errcode = 'P0001';
    end if;

    v_attendance := nullif(btrim(coalesce(v_row->>'attendance_status', '')), '');
    v_lateness   := nullif(btrim(coalesce(v_row->>'lateness_level',    '')), '');
    v_no_show    := nullif(btrim(coalesce(v_row->>'no_show_reason',    '')), '');
    v_preference := nullif(btrim(coalesce(v_row->>'preference',        '')), '');
    v_reason     := nullif(btrim(coalesce(v_row->>'preference_reason', '')), '');
    v_hours      := (v_row->>'actual_hours')::numeric;

    select h.full_name into v_name from public.hostesses h where h.hostess_id = v_hostess_id;
    v_name := coalesce(v_name, v_hostess_id::text);

    -- מפתח חסר גורם ל-jsonb_typeof להחזיר SQL-NULL, ואז <> אינו יורה. לכן is distinct from.
    if jsonb_typeof(v_row->'assignment_number') is distinct from 'number' then
      raise exception 'שורת-הסגירה של % הגיעה בלי מספר-זימון.', v_name using errcode = 'P0001';
    end if;
    v_payload_an := (v_row->>'assignment_number')::integer;

    if v_attendance is null then
      raise exception 'חסר סימון נוכחות ל-%.', v_name using errcode = 'P0001';
    end if;

    if v_attendance = 'no_show' then
      v_hours      := 0;
      v_preference := null;
      v_reason     := null;
    else
      if v_preference is null then
        raise exception 'חסר סימון איכות ל-%.', v_name using errcode = 'P0001';
      end if;

      if v_preference not in ('מצוינת', 'בסדר', 'לא_לשלוח') then
        raise exception 'סימון-האיכות של % אינו מוכר.', v_name using errcode = 'P0001';
      end if;

      if v_preference = 'לא_לשלוח' and v_reason is null then
        raise exception 'סימון ''לא לשלוח שוב'' מחייב סיבה — היא תופיע בכרטיס הדיילת.'
          using errcode = 'P0001';
      end if;
    end if;

    if v_hours is null or v_hours < 0 or v_hours > v_max_hours then
      raise exception '%: שעות בפועל חייבות להיות בין 0 ל-%.',
        v_name, rtrim(to_char(v_max_hours, 'FM99990.99'), '.')
        using errcode = 'P0001';
    end if;

    select a.assignment_number into v_assignment_no
      from public.assignments a
     where a.project_id = p_project_id
       and a.hostess_id = v_hostess_id
     order by a.assignment_number desc
     limit 1;

    if v_payload_an <> v_assignment_no then
      raise exception 'רשימת-הסגירה אינה מעודכנת: הזימון של % השתנה מאז שהמסך נטען. רענני את המסך ונסי שוב.',
        v_name using errcode = 'P0001';
    end if;

    update public.assignments a
       set attendance_status = v_attendance,
           lateness_level    = v_lateness,
           no_show_reason    = v_no_show,
           actual_hours      = v_hours
     where a.project_id       = p_project_id
       and a.hostess_id       = v_hostess_id
       and a.assignment_number = v_assignment_no;

    get diagnostics v_written = row_count;
    if v_written <> 1 then
      raise exception 'שמירת הנוכחות של % נכשלה.', v_name using errcode = 'P0001';
    end if;

    if v_can_mark and v_preference is not null then
      insert into public.customer_hostess_preference
        (customer_id, hostess_id, preference, preference_reason)
      values
        (v_customer_id, v_hostess_id, v_preference, v_reason)
      on conflict on constraint customer_hostess_preference_unique
      do update set preference        = excluded.preference,
                    preference_reason = excluded.preference_reason;

      v_marks_saved := v_marks_saved + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'project_id',              p_project_id,
    'customer_id',             v_customer_id,
    'customer_name',           v_customer_name,
    'event_name',              v_event_name,
    'report_path',             v_report,
    'feedback_status',         v_feedback,
    'operationally_closed_at', v_new_closed_at,
    'preferences_saved',       v_can_mark,
    'preferences_written',     v_marks_saved
  );
end
$function$;
