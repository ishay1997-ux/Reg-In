-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 2 (A) — זהות דוח, השלמות ואי-שינוי
-- =============================================================================
-- why: עד היום חודש = דוח אחד (UNIQUE(period)). התהליך החדש צריך גם "דוח השלמה" לאותו
-- חודש — למשמרות שנסגרו אחרי שהדוח הרגיל הופק — ולכן הזהות היא (חודש, סוג, דוח-מקור,
-- מספר השלמה). בנוסף, דוח שהופק הוא ראיה: שורות שנחתמו אינן משתנות ואינן נמחקות, וקובץ
-- שנרשם לדוח אינו מוחלף.
--
-- 🔑 expand + ריכוך אחד: עמודות חדשות עם ברירת מחדל, ואז UNIQUE(period) הגורף מוחלף
--    באינדקס חלקי לדוחות "רגילים" בלבד. הסדר מחייב: האינדקס החלקי נוצר **לפני** שהאילוץ
--    הישן יורד, כך שאין רגע שבו שני דוחות רגילים לאותו חודש אפשריים. הכותב הישן ממשיך
--    להיות מוגן, כי כל שורה חדשה מקבלת report_kind='regular' כברירת מחדל.
-- 🔑 הטריגרים חוסמים רק מה שקוד פרוס אינו עושה: הכותב הישן מכניס שורות (לא מעדכן),
--    ממלא total_amount מ-null לערך פעם אחת, ו-finalize ממלא report_file_url מ-null.
-- =============================================================================

alter table public.salary_reports
  add column report_kind        text    not null default 'regular'
                                        check (report_kind in ('regular', 'supplement')),
  add column original_report_id integer null references public.salary_reports (report_id) on delete restrict,
  add column supplement_seq     integer null,
  add column review_id          bigint  null,
  add column operation_id       uuid    null unique,
  add column artifact_sha256    text,
  add column artifact_size      integer,
  add column artifact_mime      text,
  add column artifact_filename  text,
  add column issued_at          timestamptz,
  add column issued_by          text,
  add column delivery_state     text    null
                                        check (delivery_state in ('queued', 'sending', 'sent', 'failed', 'unknown')),
  add constraint salary_reports_kind_shape check (
    (report_kind = 'regular' and original_report_id is null and supplement_seq is null)
    or (report_kind = 'supplement' and original_report_id is not null and supplement_seq >= 1)
  );

comment on column public.salary_reports.delivery_state is
  'מ8 — מטמון בלבד של מצב השליחה לרו"ח. המקור הוא הניסיון האחרון ב-payroll_mail_attempts (תיקון F1).';

-- דוח רגיל אחד לחודש — קודם האינדקס החדש, ורק אחריו מורידים את הישן.
create unique index salary_reports_regular_period_uq
  on public.salary_reports (period)
  where report_kind = 'regular';

alter table public.salary_reports
  add constraint salary_reports_original_supplement_uq unique (original_report_id, supplement_seq);

alter table public.salary_reports drop constraint salary_reports_period_key;

-- שורות הדוח: מפתח השיבוץ המלא ותאריך המשמרת. null בשורות ישנות (לפני התהליך החדש).
alter table public.salary_report_lines
  add column assignment_number integer null,
  add column event_date        date    null;

create index salary_report_lines_assignment_key_idx
  on public.salary_report_lines (source_project_id, hostess_id, assignment_number)
  where assignment_number is not null;


-- -----------------------------------------------------------------------------
-- שורה שנחתמה אינה משתנה ואינה נמחקת — לאף אחד.
-- -----------------------------------------------------------------------------
create or replace function public.salary_report_lines_immutable()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform public._payroll_raise('PAYROLL_LINE_IMMUTABLE',
    'שורות של דוח שכר שהופק אינן ניתנות לשינוי או למחיקה.');
  return null;
end;
$$;

create trigger salary_report_lines_immutable
  before update or delete on public.salary_report_lines
  for each row execute function public.salary_report_lines_immutable();


-- -----------------------------------------------------------------------------
-- זהות הדוח קבועה; ערכי הראיה (סכום, קובץ, גיבוב, מי הפיק) נכתבים פעם אחת בלבד.
-- מצב השליחה (send_status, sent_date, delivery_state) נשאר ניתן לעדכון.
-- -----------------------------------------------------------------------------
create or replace function public.salary_reports_identity_guard()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if new.report_id is distinct from old.report_id
     or new.period is distinct from old.period
     or new.report_kind is distinct from old.report_kind
     or new.original_report_id is distinct from old.original_report_id
     or new.supplement_seq is distinct from old.supplement_seq
     or (old.total_amount is not null and new.total_amount is distinct from old.total_amount)
     or (old.report_file_url is not null and new.report_file_url is distinct from old.report_file_url)
     or (old.artifact_sha256 is not null and new.artifact_sha256 is distinct from old.artifact_sha256)
     or (old.artifact_size is not null and new.artifact_size is distinct from old.artifact_size)
     or (old.artifact_mime is not null and new.artifact_mime is distinct from old.artifact_mime)
     or (old.artifact_filename is not null and new.artifact_filename is distinct from old.artifact_filename)
     or (old.operation_id is not null and new.operation_id is distinct from old.operation_id)
     or (old.review_id is not null and new.review_id is distinct from old.review_id)
     or (old.issued_at is not null and new.issued_at is distinct from old.issued_at)
     or (old.issued_by is not null and new.issued_by is distinct from old.issued_by)
  then
    perform public._payroll_raise('PAYROLL_REPORT_IMMUTABLE',
      'זהות דוח השכר והקובץ שנרשם לו אינם ניתנים לשינוי.',
      jsonb_build_object('report_id', old.report_id));
  end if;
  return new;
end;
$$;

create trigger salary_reports_identity_guard
  before update on public.salary_reports
  for each row execute function public.salary_reports_identity_guard();

revoke execute on function public.salary_report_lines_immutable() from public, anon, authenticated;
revoke execute on function public.salary_reports_identity_guard() from public, anon, authenticated;
