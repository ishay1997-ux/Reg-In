-- =============================================================================
-- מתג אחד לשתי משימות-הלילה שמזיזות סטטוסים — `עדכון_סטטוסים_לילי_פעיל` (נזרע כבוי)
-- =============================================================================
-- why: הפרויקט הוקפא 15/10/2026 ונתוני-ההדגמה נשארו חיים (הכרעת-ישי: "זה טוב להצגות במקומות
-- נוספים"). שתי משימות pg_cron ממשיכות לרוץ בלילה ו"מזקינות" אותם: תפוגת-הצעות (01:00, מעבירה
-- הצעות in_progress ל-rejected 'פג תוקף') ו"האירוע הסתיים" (02:00). ישי, 15/10/2026: *"אפשר
-- לעשות בהגדרות טגלים כאלא של להפעיל ולכבות?"* ⇒ על ההמלצה "מתג אחד לשתי המשימות, כבוי בזמן
-- ההקפאה": *"מאשר"*. ניקוי login_attempts (01:30) אינו נוגע בנתוני-הדגמה — נשאר דולק תמיד, מחוץ למתג.
--
-- 🧬 param_type = 'integration_tech' (הקבוצה "טכני" במסך ההגדרות) · בעלות: מנכ"ל — מתג
-- מערכתי, לא החלטה של מחלקה. התווית, ההסבר והקינד boolean חיים ב-`src/lib/paramsRegistry.js`.
--
-- 🔑 הפונקציה מחזירה true רק על 'true' מפורש: שורה חסרה או ערך משובש ⇒ המשימות לא רצות.
--    כבוי-כברירת-מחדל הוא הכיוון הבטוח בהקפאה — המשימות משנות נתונים, והמתג הוא ה"אישור" להן.
-- 🔁 אידמפוטנטי: `on conflict do nothing` על השורה · `create or replace` על הפונקציה ·
--    `cron.alter_job` דורס את הפקודה בנוסח המלא (הרצה שנייה = אותה תוצאה).
-- 🔁 הפיכוּת: להחזיר את שתי הפקודות לנוסח שבמיגרציות 20260731085335 (מ3) ו-20260814141052 (מ6),
--    ואז `drop function public.nightly_status_jobs_enabled(); delete from public.params where param_name = 'עדכון_סטטוסים_לילי_פעיל';`
-- כלל-הפריסה: תוספת (פונקציה + שורה) ושינוי פקודת-cron — אין קוד-לקוח שתלוי בסדר; Expand.
--
-- 🔻 אימות אחרי ההחלה (קריאה בלבד):
--   select param_value, param_type from public.params where param_name = 'עדכון_סטטוסים_לילי_פעיל';  -- 'false' · 'integration_tech'
--   select public.nightly_status_jobs_enabled();                                                         -- false
--   select jobname, command like '%nightly_status_jobs_enabled%' from cron.job;                          -- שתיים true, login_attempts false
-- =============================================================================

do $$
begin
  if not exists (select 1 from public.roles where role_name = 'מנכ"ל') then
    raise exception 'לא נמצאה שורת-התפקיד "מנכ"ל" בטבלת roles — הפרמטר היה נשמר בלי בעלים.'
      using errcode = 'P0001';
  end if;
end $$;

insert into public.params (param_name, param_value, param_type, owner_role_id)
select 'עדכון_סטטוסים_לילי_פעיל',
       'false',
       'integration_tech',
       r.role_id
  from public.roles r
 where r.role_name = 'מנכ"ל'
on conflict (param_name) do nothing;

-- נקראת רק מתוך משימות-ה-cron (רצות כ-postgres). stable + search_path ריק — אין תלות בנתיב החיפוש.
create or replace function public.nightly_status_jobs_enabled()
returns boolean
language sql
stable
set search_path = ''
as $fn$
  select coalesce(
    (select lower(btrim(p.param_value)) = 'true'
       from public.params p
      where p.param_name = 'עדכון_סטטוסים_לילי_פעיל'),
    false)
$fn$;

revoke all on function public.nightly_status_jobs_enabled() from public, anon, authenticated;

-- מ3 · תפוגת-הצעות — אותה פקודה בדיוק, עם יציאה מוקדמת כשהמתג כבוי.
select cron.alter_job(
  (select jobid from cron.job where jobname = 'module3-quote-expiry'),
  command := $cmd$
do $expiry$
declare v_days_text text; v_days int;
begin
  if not public.nightly_status_jobs_enabled() then
    return;
  end if;

  select param_value into v_days_text from public.params where param_name = 'ימי_תוקף_הצעה';
  if v_days_text is null or btrim(v_days_text) = '' or btrim(v_days_text) !~ '^[0-9]+$' then
    raise exception 'פרמטר ימי_תוקף_הצעה חסר או אינו מספר שלם — עבודת תפוגת ההצעות לא בוצעה'
      using errcode = 'P0001';
  end if;
  v_days := btrim(v_days_text)::int;

  update public.quotes
     set quote_status = 'rejected', rejection_reason = 'פג תוקף'
   where quote_status = 'in_progress'
     and updated_at < now() - (v_days * interval '1 day');
end
$expiry$;
$cmd$
);

-- מ6 · "האירוע הסתיים" — אותו עדכון, עם תנאי המתג.
select cron.alter_job(
  (select jobid from cron.job where jobname = 'module6-event-finished'),
  command := $cmd$
  update public.projects
     set project_status = 'event_finished'
   where project_status in ('not_started','in_progress','ready')
     and final_event_date < current_date
     and public.nightly_status_jobs_enabled();
$cmd$
);
