-- =============================================================================
-- מודול 9 · מיגרציה B · צעד 1.2 — טבלת העדפות-ההתראות של המשתמש
-- =============================================================================
-- **למה הטבלה קיימת:** מסך-הפרופיל (מודול 1) מציג שני מתגי-התראה שמעולם לא נשמרו —
-- "(בקרוב)". הכרעת-ישי 07/07 (§6, `🚧 מ9 · 🚧 מ10`): מודול 9 בונה את הטבלה והמתגים,
-- מודול 10 שולח בפועל. R-4 (02/09): שתי העמודות קיימות, **רק מתג-המייל נדלק**; SMS מוצג
-- כבוי עם "אין ערוץ SMS במערכת" — ולכן העמודה קיימת כבר עכשיו, שלא נצטרך מיגרציה
-- כשהערוץ יגיע.
--
-- **המבנה:** שורה אחת למשתמש, המפתח הוא המייל (זהות המשתמש בכל המערכת — `users.email`
-- הוא ה-FK הרביעי… כעת **החמישי** שמצביע אליו). **`on update no action` נכתב במפורש**
-- (V-2): שינוי-מייל צריך להיכשל **בקול** על ה-FK עד שיגיע סנכרון-Auth (§7.64, נדחה) —
-- cascade היה הופך כשל רועש לנעילה שקטה. `on delete cascade`: משתמש שנמחק לוקח את
-- ההעדפה איתו. **אין שורה = שני המתגים כבויים** (ברירת-המחדל בקוד; אין Seed).
--
-- **RLS:** שלוש מדיניות-עצמי (SELECT · INSERT · UPDATE, `email = auth.email()` — התקדים
-- `users_update_self`), **בלי DELETE** — אין פעולת-מחיקה במסך. באותה מיגרציה, כדי שלא
-- תהיה רגע של deny-all (T5). אין אינדקס נוסף על `email` — ה-PK מכסה (C-1). אין
-- הענקות מעבר לברירות-המחדל של Supabase (כלל-הטבלאות).
--
-- **הפיכוּת:** `drop table` מלא. **כלל-הפריסה:** טבלה חדשה — תוספת טהורה.
-- =============================================================================

create table public.notification_preferences (
  email              text        primary key
                                 references public.users(email)
                                 on update no action on delete cascade,
  email_new_projects boolean     not null default false,
  sms_last_minute    boolean     not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.notification_preferences is
  'העדפות-התראות פר-משתמש (מודול 9 שומר, מודול 10 שולח). אין שורה = הכל כבוי. SMS: העמודה קיימת, הערוץ לא (R-4).';

-- מוקש T8: הפונקציה חיה ב-`extensions`, לא ב-`public`.
create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function extensions.moddatetime('updated_at');

alter table public.notification_preferences enable row level security;

create policy notification_preferences_select_self on public.notification_preferences
  for select to authenticated
  using (email = (select auth.email()));

create policy notification_preferences_insert_self on public.notification_preferences
  for insert to authenticated
  with check (email = (select auth.email()));

create policy notification_preferences_update_self on public.notification_preferences
  for update to authenticated
  using (email = (select auth.email()))
  with check (email = (select auth.email()));
