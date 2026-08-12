-- =====================================================================================
-- מודול 4 (דיילות) — מיגרציה B: "דיילת אחת, אירוע אחד ביום" — אילוץ במסד, לא בדיקה בקוד
-- =====================================================================================
-- why (§7.88, הכרעת-ישי 08/08/2026): `processes-approved.md:242` — *"המערכת מונעת אישור סופי
--   לדיילת שכבר משובצת באותו תאריך — **אילוץ במסד, לא בדיקה בקוד**"*, ובמילותיו: "אסור שזה
--   יקרה". ‏`spec.md § מה ייחשב עובד` #5: *"אי-אפשר לשבץ דיילת לשני אירועים באותו יום —
--   **והמסד חוסם, לא הקוד**"*.
--
-- 🔴 **ולמה זה דרש עמודה מדונרמלת ולא סתם `UNIQUE`** (‏`spec.md §12⑱(א)` — חוסם מפורש):
--   התאריך יושב על `projects.final_event_date`, ו-**`UNIQUE` ב-Postgres אינו יכול לצרף טבלאות.**
--   ⇒ `assignments.event_date` (נוספה במיגרציה A) + **טריגר דו-כיווני** שמסנכרן אותה.
--   הכיוון השני הוא הקריטי: בלי טריגר על `projects`, דחיית-תאריך של אירוע הייתה משאירה את
--   `event_date` על הערך הישן — **והאילוץ היה נהיה מיושן בשקט**, כלומר נראה עובד ולא עובד.
--
-- 🔴 **נקודת-האכיפה = `finally_approved` בלבד** (§7.88↳, הכרעת-ישי 08/08/2026).
--   ‏`processes-approved.md:242` ממקם את החסימה ב"אישור סופי". **שני זימונים `pending` באותו
--   יום נשארים חוקיים לחלוטין** — המנהלת שולחת בסבבים, והיא זו שמחליטה מי מאושרת בסוף.
--   ⚠️ **המחיר, רשום כדי שלא יתגלה מחדש:** §7.54 ביקש את אותו אינדקס גם על סטטוסים פעילים
--   אחרים, מה שהיה חוסם **גם** שתי שורות פעילות על אותו פרויקט. הבונוס הזה **אבוד**, ושורת
--   `A-15` ב-`db_roadmap` **נשארת פתוחה**.
--
-- 🔴 **ואסור שזה ישבור את ה-RPC של מודול 3:** ‏`approve_quote_and_create_project` יוצרת פרויקט
--   עם **אפס** שיבוצים. הטריגר על `projects` הוא `AFTER UPDATE` בלבד — הוא לא נדלק על INSERT
--   כלל, וגם אילו נדלק, ה-UPDATE שלו על אפס שורות אינו שגיאה.
--
-- reversibility: הפיכה במלואה — `drop index` + `drop trigger` ×2 + `drop function` ×2 +
--   `alter column event_date drop not null`. שום שורה לא נמחקת ולא משתנה (שתי הטבלאות ריקות).

-- ===== SECTION 1 — הכיוון הראשון: שיבוץ שנכתב שואב את התאריך מהאירוע =====
-- `security definer`: העמודה היא **נגזרת טהורה**, ואסור שהיא תלויה בשאלה אם לכותב יש הרשאת
-- קריאה על `projects`. ‏RLS שהיה חוסם את הקריאה היה מחזיר NULL — כלומר אילוץ שקט שאינו אוכף.
-- אין כאן דליפת-מידע: הפונקציה מעתיקה תאריך לשורה שהמשתמש ממילא כותב.
create or replace function public.sync_assignment_event_date()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select p.final_event_date into new.event_date
    from public.projects p where p.project_id = new.project_id;
  return new;
end; $$;
revoke execute on function public.sync_assignment_event_date() from public, anon, authenticated;

-- על כל insert/update — ולא רק כששדה מסוים משתנה — כדי שאיש לא יוכל לכתוב ערך משלו לעמודה.
create trigger assignments_sync_event_date
  before insert or update on public.assignments
  for each row execute function public.sync_assignment_event_date();

-- ===== SECTION 2 — הכיוון השני: אירוע שזז גורר את כל שיבוציו =====
create or replace function public.sync_assignments_on_project_date_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.assignments set event_date = new.final_event_date
   where project_id = new.project_id;
  return null;
end; $$;
revoke execute on function public.sync_assignments_on_project_date_change() from public, anon, authenticated;

-- ⚠️ אם הזזת התאריך יוצרת התנגשות אמיתית (הדיילת כבר מאושרת סופית ביעד) — ה-UPDATE הזה
-- ייכשל על האינדקס שלמטה, וכל שינוי-התאריך יתגלגל אחורה. **זו ההתנהגות הנכונה**: עדיף
-- להיכשל בקול מאשר להזיז אירוע ולהשאיר דיילת משובצת פעמיים.
create trigger projects_sync_assignment_dates
  after update of final_event_date on public.projects
  for each row when (old.final_event_date is distinct from new.final_event_date)
  execute function public.sync_assignments_on_project_date_change();

-- ===== SECTION 3 — העמודה הופכת לחובה, ואז האילוץ עצמו =====
-- 🔴 **`not null` אינו קישוט:** באינדקס-ייחודי, שני NULL נחשבים **שונים זה מזה** — כלומר שתי
-- שורות `finally_approved` עם `event_date` ריק היו עוקפות את האילוץ בלי להפר אותו.
-- הטריגר שלמעלה ממלא את העמודה תמיד (‏`projects.final_event_date` הוא עצמו `not null`),
-- ולכן `not null` כאן הוא **רשת-הביטחון למקרה שהטריגר יפסיק לרוץ** — ואז ניכשל בקול.
alter table public.assignments alter column event_date set not null;

create unique index assignments_one_event_per_day
  on public.assignments (hostess_id, event_date)
  where assignment_status = 'finally_approved';

-- 🧩 חוזה מול הממשק (שלב 3): שם האינדקס הוא מה שהמסך ימפה להודעה בעברית, בדיוק כמו
-- ‏`SERVER_MESSAGE_RULES` ב-`src/lib/quotes.js` ממפה את הודעות-ה-RAISE. **שינוי-שם כאן בלי
-- עדכון שם המיפוי מפיל את המסך להודעה גנרית, ואף בדיקה לא תיכשל.**
