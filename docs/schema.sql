-- ============================================================
-- REG-IN — סכמת מסד הנתונים (Database Schema) — SNAPSHOT מתועד
-- מקור-אמת לקריאה: כל קוד חייב להתאים בדיוק לשמות/טיפוסים/constraints כאן,
-- ואם יש סתירה בין האפיון/מדריך לסכמה — הסכמה גוברת.
--
-- ⚠️ מקור-אמת לשינויים = supabase/migrations/ (ולא הקובץ הזה).
-- החל מספרינט ההקשחה, כל שינוי DB נכתב כקובץ מיגרציה חדש בתיקיית המיגרציות,
-- מוחל, ואז הקובץ הזה מתעדכן כ-snapshot של המצב הנוכחי. ראה supabase/README.md.
-- ============================================================

-- 1. טבלת תפקידים (5 תפקידים: מנכ"ל=1, מנהלת פרויקטים, כספים, גיוס, לוגיסטיקה)
create table roles (
  role_id serial primary key,
  role_name text not null
);

-- 2. טבלת מודולים (9 מודולים במטריצת ההרשאות — §7.10: מסך הבית אינו שורת מודול, נגיש לכולם)
create table modules (
  module_id serial primary key,
  module_name text not null
);

-- 3. טבלת הרשאות — לב מודול 1. משייכת לכל (תפקיד, מודול) רמת גישה.
create table permissions (
  role_id int references roles (role_id) on delete cascade,
  module_id int references modules (module_id) on delete cascade,
  permission_level text not null check (permission_level in ('edit', 'view', 'blocked')),
  primary key (role_id, module_id)
);

-- 4. טבלת משתמשי מערכת — המייל הוא המפתח (מקשר ל-Supabase Auth).
create table users (
  email text primary key,
  role_id int references roles (role_id) on delete restrict,
  full_name text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  phone text
);

-- 5. טבלת לקוחות (מודול 2)
create table customers (
  customer_id text primary key,
  customer_type text not null check (customer_type in ('private_company', 'government', 'production_company', 'nonprofit')),
  company_name text not null,
  contact_name text not null,
  phone text not null,
  email text not null,
  discount_percent numeric not null default 0,
  marketing_consent boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive'))
);

-- 6. טבלת מוצרים ומחירים (קטלוג: אתר / דיילת / מוצר)
create table products (
  sku text primary key,
  item_name text not null,
  description text not null,
  category text not null check (category in ('site', 'hostess', 'product')),
  unit text not null,
  base_price numeric not null check (base_price >= 0),
  cost numeric not null check (cost >= 0),
  status text not null default 'active' check (status in ('active', 'out_of_stock', 'inactive')),
  image_url text
);

-- 7. טבלת מדרגות מחיר (הנחות כמות למוצר)
create table price_tiers (
  sku text references products (sku) on delete cascade,
  min_qty int not null,
  special_price numeric not null check (special_price > 0),
  max_qty int,
  primary key (sku, min_qty)
);

-- 8. טבלת פרמטרים גלובליים (מע"מ, יחס אורחים-דיילת, משקולות Smart Match, תבניות)
create table params (
  param_id serial primary key,
  param_name text not null,
  param_value text not null,
  param_type text not null check (param_type in ('pricing_timing', 'control_alerts', 'smart_match', 'templates', 'integration_tech'))
);

-- 9. טבלת הצעות מחיר (מודול 3)
create table quotes (
  quote_id serial primary key,
  customer_id text references customers(customer_id) on delete restrict,
  event_name text not null,
  issue_date date not null default current_date,
  estimated_hours numeric not null check (estimated_hours > 0),
  recommended_hostess_count int not null check (recommended_hostess_count > 0),
  estimated_guests int not null check (estimated_guests > 0),
  estimated_event_date date not null,
  estimated_location text not null,
  quote_status text not null default 'in_progress' check (quote_status in ('in_progress', 'approved', 'rejected')),
  pdf_url text,
  applied_customer_discount numeric not null,
  manual_discount numeric not null default 0,
  rejection_reason text,
  notes text
);

-- 10. טבלת שירותי הצעה (שורות ההצעה)
create table quote_services (
  quote_id int references quotes (quote_id) on delete cascade,
  sku text references products(sku) on delete restrict,
  line_number int not null,
  qty int not null check (qty > 0),
  closing_unit_price numeric not null check (closing_unit_price >= 0),
  color text,
  notes text,
  primary key (quote_id, sku, line_number)
);

-- 11. טבלת פרויקטים (מודול 6 - המחבר המרכזי, מכונת מצבים)
create table projects (
  project_id serial primary key,
  quote_id int unique references quotes(quote_id) on delete restrict,
  owner_email text references users(email) on delete restrict,
  final_event_date date not null,
  final_location text not null,
  required_hostess_count int not null check (required_hostess_count > 0),
  project_bonus numeric not null default 0,
  project_status text not null default 'not_started'
    check (project_status in ('not_started', 'in_progress', 'ready', 'event_finished', 'awaiting_invoice', 'awaiting_payment', 'finished', 'cancelled')),
  invoice_sent boolean not null default false,
  feedback_status text not null default 'not_sent' check (feedback_status in ('not_sent', 'sent', 'completed', 'no_response')),
  actual_guests int,
  actual_hours numeric,
  cancel_reason text,
  payment_date date,
  feedback_score int check (feedback_score between 1 and 5),
  negative_feedback_reason text,
  feedback_notes text,
  summary_report_url text
);

-- 12. טבלת מאגר דיילות (מודול 4)
create table hostesses (
  id_number text primary key,
  full_name text not null,
  phone text not null,
  email text not null,
  city text not null,
  hourly_rate numeric not null,
  rating int not null default 3 check (rating between 1 and 5),
  status text not null default 'active' check (status in ('active', 'inactive')),
  bank_name text not null,
  bank_branch text not null,
  bank_account text not null
);

-- 13. טבלת דוחות שכר חודשיים
create table salary_reports (
  report_id serial primary key,
  sent_date date not null,
  report_file_url text not null
);

-- 14. טבלת שיבוצי דיילות (מודול 4 - assignments)
create table assignments (
  project_id int references projects (project_id) on delete cascade,
  id_number text references hostesses(id_number) on delete restrict,
  assignment_number int not null,
  salary_report_id int references salary_reports (report_id) on delete restrict,
  assignment_status text not null default 'pending'
    check (assignment_status in ('pending', 'confirmed_available', 'declined', 'finally_approved', 'released')),
  hourly_rate_snapshot numeric not null,
  actual_hours numeric not null default 0,
  personal_bonus numeric not null default 0,
  reminder_sent boolean not null default false,
  primary key (project_id, id_number, assignment_number)
);

-- 15. טבלת לוגיסטיקה (מודול 5)
create table logistics (
  project_id int references projects(project_id) on delete cascade,
  sku text references products (sku) on delete restrict,
  serial_number int not null,
  planned_qty int not null check (planned_qty > 0),
  actual_qty int not null default 0,
  item_status text not null default 'not_started' check (item_status in ('not_started', 'ordered', 'ready')),
  notes text,
  primary key (project_id, sku, serial_number)
);

-- ============================================================
-- RLS — מודול 1, צעדים 4-5 (בוצע בפועל ב-Supabase; מתועד כאן לשחזור/היסטוריה)
-- ============================================================

create or replace function current_user_role_id()
returns int
language sql security definer stable
as $$
  select role_id from users
  where email = auth.email() and status = 'active';
$$;

alter table roles enable row level security;
create policy "roles_select_all" on roles for select to authenticated using (true);

alter table modules enable row level security;
create policy "modules_select_all" on modules for select to authenticated using (true);

alter table permissions enable row level security;
create policy "permissions_select_all" on permissions for select to authenticated using (true);
create policy "permissions_write_ceo_only" on permissions for all to authenticated
  using (current_user_role_id() = (select role_id from roles where role_name = 'מנכ"ל'))
  with check (current_user_role_id() = (select role_id from roles where role_name = 'מנכ"ל'));

alter table users enable row level security;
create policy "users_select_self_or_ceo" on users for select to authenticated
  using (email = auth.email() or current_user_role_id() = (select role_id from roles where role_name = 'מנכ"ל'));
create policy "users_write_ceo_only" on users for all to authenticated
  using (current_user_role_id() = (select role_id from roles where role_name = 'מנכ"ל'))
  with check (current_user_role_id() = (select role_id from roles where role_name = 'מנכ"ל'));

-- עדכון-עצמי של פרופיל (מודול 1) — משתמש מעדכן את השורה שלו בלבד (phone/full_name),
-- עם הקפאת role_id ו-status כדי למנוע הסלמת-הרשאות עצמית והפעלה-מחדש עצמית.
-- הקפאת role_id דרך current_user_role_id() (SECURITY DEFINER, עוקפת RLS => חסינת רקורסיה;
-- subquery ישיר על users כאן היה גורם infinite recursion). policy זו permissive ומתווספת
-- ל-users_write_ceo_only ב-OR — המנכ"ל ממשיך לעדכן כל שורה/כל עמודה דרך אותה policy.
create policy "users_update_self" on users for update to authenticated
  using (email = auth.email())
  with check (
    email = auth.email()
    and role_id = current_user_role_id()
    and status = 'active'
  );

-- ============================================================
-- נעילת חשבון אחרי כשלונות התחברות (מודול 1 — סגירה; החליף את דרישת ה-CAPTCHA)
-- ------------------------------------------------------------
-- מונה פר-אימייל שננעל אחרי 5 כשלונות רצופים ל-15 דקות, נאכף בזרימת ההתחברות
-- (LoginPage.jsx) דרך 3 פונקציות SECURITY DEFINER. מגובה ב-rate limiting המובנה
-- (פר-IP) של Supabase. הערה: Auth Hook ("Password verification attempt") היה הפתרון
-- הרובוסטי אך הוא נעול לתוכנית Team; לכן זו אכיפה ברמת אפליקציה/DB — מספקת למערכת
-- פנימית סגורה, אך ניתנת לעקיפה בקריאת API ישירה (מתועד ב-PROJECT_MASTER §5.1).
-- ============================================================

create table if not exists login_attempts (
  email text primary key,
  failed_count int not null default 0,
  locked_until timestamptz,
  last_attempt_at timestamptz not null default now()
);

-- RLS פעיל בלי policies: אין גישה ישירה מהלקוח לטבלה; רק דרך 3 הפונקציות למטה.
alter table login_attempts enable row level security;

-- check_login_lock: מחזיר את מועד שחרור הנעילה אם החשבון נעול כרגע, אחרת NULL.
-- נקרא לפני ההתחברות => זמין ל-anon.
create or replace function check_login_lock(p_email text)
returns timestamptz
language sql security definer
set search_path = ''
as $$
  select locked_until from public.login_attempts
  where email = p_email and locked_until is not null and locked_until > now();
$$;

-- register_failed_login: מגדיל את מונה הכשלונות; בהגעה ל-5 נועל ל-15 דקות ומאפס את המונה.
-- מחזיר את מועד שחרור הנעילה אם ננעל כעת, אחרת NULL. זמין ל-anon (נקרא לפני התחברות מוצלחת).
create or replace function register_failed_login(p_email text)
returns timestamptz
language plpgsql security definer
set search_path = ''
as $$
declare
  v_count int;
  v_locked timestamptz;
begin
  insert into public.login_attempts (email, failed_count, last_attempt_at)
    values (p_email, 1, now())
  on conflict (email) do update
    set failed_count = public.login_attempts.failed_count + 1,
        last_attempt_at = now()
  returning failed_count into v_count;

  if v_count >= 5 then
    v_locked := now() + interval '15 minutes';
    update public.login_attempts
      set locked_until = v_locked, failed_count = 0
      where email = p_email;
    return v_locked;
  end if;

  return null;
end;
$$;

-- reset_login_attempts: מאפס את המונה/נעילה של המשתמש המחובר בלבד (auth.email()).
-- זמין ל-authenticated בלבד => anon לא יכול לאפס מונה של אחר כדי לעקוף נעילה.
create or replace function reset_login_attempts()
returns void
language sql security definer
set search_path = ''
as $$
  delete from public.login_attempts where email = auth.email();
$$;

revoke all on function check_login_lock(text) from public;
revoke all on function register_failed_login(text) from public;
revoke all on function reset_login_attempts() from public;
grant execute on function check_login_lock(text) to anon, authenticated;
grant execute on function register_failed_login(text) to anon, authenticated;
grant execute on function reset_login_attempts() to authenticated;
-- Supabase נותן ברירת-מחדל EXECUTE ישיר ל-anon על פונקציות חדשות ב-public; מבטלים
-- אותו במפורש כדי ש-reset יהיה authenticated-בלבד (least-privilege; ממילא no-op ל-anon
-- כי auth.email() הוא NULL).
revoke execute on function reset_login_attempts() from anon;
