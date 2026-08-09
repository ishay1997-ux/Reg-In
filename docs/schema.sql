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

-- 5. טבלת לקוחות (מודול 2) — §7.64 (10/07): מפתח surrogate; ח"פ = company_number עסקי unique (סטייה מ-C6 §2.4.1)
create table customers (
  customer_id bigint generated always as identity primary key,               -- §7.64: surrogate פנימי (היה ח"פ text)
  company_number text not null unique check (company_number ~ '^[0-9]{9}$'),  -- ח"פ (9 ספרות) — המזהה העסקי הקנוני
  customer_type text not null check (customer_type in ('private_company', 'government', 'production_company', 'nonprofit')),
  company_name text not null,
  contact_name text not null,
  phone text not null,
  email text not null,
  discount_percent numeric not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  marketing_consent boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()   -- §7.73 + טריגר moddatetime (ר' בלוק מודול 2 בתחתית)
);

-- 6. טבלת מוצרים ומחירים (קטלוג: אתר / דיילת / מוצר)
create table products (
  sku text primary key,
  item_name text not null,
  description text not null,
  category text not null check (category in ('site', 'hostess', 'product')),
  unit text not null,
  base_price numeric not null check (base_price >= 0),
  cost numeric not null check (cost >= 0),  -- ⛔ נמחקה 31/07/2026 (סבב G) — ר' הבלוק בסוף הקובץ: העלות חיה ב-product_costs
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
  customer_id bigint references customers(customer_id) on delete restrict,   -- §7.64: bigint (עוקב אחרי ה-surrogate PK של customers)
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
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()   -- §7.73
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

-- הגרסה המוקשחת (מיגרציית 20260702195258): search_path='' + שמות סכמה מלאים + revoke מ-anon/PUBLIC.
-- (07/07/2026: תוקן דריפט בקובץ הזה — הופיעה כאן בטעות הגרסה הטרום-מוקשחת.)
create or replace function public.current_user_role_id()
  returns integer
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select role_id from public.users where email = auth.email() and status = 'active';
$$;

revoke execute on function public.current_user_role_id() from public, anon;

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
-- (07/07/2026, מיגרציית initplan: קריאות auth.email()/current_user_role_id() עטופות ב-(select …) —
--  חישוב פעם-לשאילתה במקום פעם-לשורה. זהות התנהגותית; ראו 20260707163709.)
create policy "users_select_self_or_ceo" on users for select to authenticated
  using (
    email = (select auth.email())
    or (select current_user_role_id()) = (select role_id from roles where role_name = 'מנכ"ל')
  );
create policy "users_write_ceo_only" on users for all to authenticated
  using (current_user_role_id() = (select role_id from roles where role_name = 'מנכ"ל'))
  with check (current_user_role_id() = (select role_id from roles where role_name = 'מנכ"ל'));

-- עדכון-עצמי של פרופיל (מודול 1) — משתמש מעדכן את השורה שלו בלבד (phone/full_name),
-- עם הקפאת role_id ו-status כדי למנוע הסלמת-הרשאות עצמית והפעלה-מחדש עצמית.
-- הקפאת role_id דרך current_user_role_id() (SECURITY DEFINER, עוקפת RLS => חסינת רקורסיה;
-- subquery ישיר על users כאן היה גורם infinite recursion). policy זו permissive ומתווספת
-- ל-users_write_ceo_only ב-OR — המנכ"ל ממשיך לעדכן כל שורה/כל עמודה דרך אותה policy.
create policy "users_update_self" on users for update to authenticated
  using (email = (select auth.email()))
  with check (
    email = (select auth.email())
    and role_id = (select current_user_role_id())
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

-- ============================================================
-- מודול 2 — יסוד ה-DB (מיגרציה 20260710160735, בוצע בפועל 10/07/2026; §7.64 + חבילת-nod §7.40א/48/62/73)
-- ============================================================
-- created_at/updated_at + טריגר moddatetime נוספו ל-11 הטבלאות העסקיות (customers, products, price_tiers,
-- params, quotes, quote_services, projects, hostesses, salary_reports, assignments, logistics).
-- מוצג inline ל-customers/quotes; ליתר 9 — הדפוס למטה. התוסף moddatetime הועבר ל-schema `extensions`
-- (מיגרציה 20260710164420 — מ-public לפי המלצת Supabase; 11 הטריגרים נקשרים ל-OID ונשארו תקינים).

-- §7.40(א): ייחודיות מפתחות-המחרוזת שכל ה-RLS משווה כמחרוזת
alter table roles   add constraint roles_role_name_key     unique (role_name);
alter table modules add constraint modules_module_name_key unique (module_name);

-- §7.62: users.role_id חובה (כל שרשרת ה-RLS נשענת עליו — NULL = מסכים ריקים)
alter table users alter column role_id set not null;

-- §7.48: enable-RLS ל-10 הטבלאות העסקיות שנותרו (customers ב-RLS מאז מודול 1; deny-all מכוון עד policies)
alter table products enable row level security;
alter table price_tiers enable row level security;
alter table params enable row level security;
alter table quotes enable row level security;
alter table quote_services enable row level security;
alter table projects enable row level security;
alter table hostesses enable row level security;
alter table salary_reports enable row level security;
alter table assignments enable row level security;
alter table logistics enable row level security;

-- §7.73: הדפוס לכל אחת מ-9 הטבלאות שלא-מוצגות-inline למעלה:
create extension if not exists moddatetime with schema extensions;   -- schema ייעודי (advisor extension_in_public)
--   alter table <t> add column created_at timestamptz not null default now();
--   alter table <t> add column updated_at timestamptz not null default now();
--   create trigger <t>_set_updated_at before update on <t> for each row execute function moddatetime(updated_at);

-- §7.21: ה-policies העסקיות הראשונות בפרויקט — customers (הרשאה לפי מטריצת role→module בלבד; התקדים לכל מודול)
alter table customers enable row level security;
create policy "customers_select_by_permission" on customers for select to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level in ('edit', 'view')));
create policy "customers_write_by_permission" on customers for all to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'))
  with check (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'));

-- אזור השיווק (מסך 5.6.3): bucket ציבורי + 4 policies על storage.objects לפי אותה מטריצת 'לקוחות'
insert into storage.buckets (id, name, public) values ('marketing', 'marketing', true) on conflict (id) do nothing;
create policy "marketing_read_by_permission" on storage.objects for select to authenticated
  using (bucket_id = 'marketing' and exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level in ('edit', 'view')));
create policy "marketing_insert_by_permission" on storage.objects for insert to authenticated
  with check (bucket_id = 'marketing' and exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'));
create policy "marketing_update_by_permission" on storage.objects for update to authenticated
  using (bucket_id = 'marketing' and exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'))
  with check (bucket_id = 'marketing' and exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'));
create policy "marketing_delete_by_permission" on storage.objects for delete to authenticated
  using (bucket_id = 'marketing' and exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'));

-- §7.81 (11/07/2026): ריבוי אנשי-קשר ללקוח — טבלת-ילד customer_contacts (אנשי-קשר *נוספים*; הראשי
-- נשאר inline על customers, אופציה C — סטיית-C6 §2.4.1). RLS = אותה מטריצת 'לקוחות'. הוחל 11/07.
create table customer_contacts (
  contact_id  bigint generated always as identity primary key,
  customer_id bigint not null references customers(customer_id) on delete cascade on update cascade,
  contact_name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customer_contacts_customer_id_idx on customer_contacts (customer_id);
create trigger customer_contacts_set_updated_at before update on customer_contacts for each row execute function extensions.moddatetime(updated_at);
alter table customer_contacts enable row level security;
create policy "customer_contacts_select_by_permission" on customer_contacts for select to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level in ('edit', 'view')));
create policy "customer_contacts_write_by_permission" on customer_contacts for all to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'))
  with check (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'));

-- ============================================================
-- מודול 3 (הצעות מחיר) — מיגרציה 1: מבנה ואילוצים (20260723111005, הוחל 23/07/2026)
-- דלתאות על הטבלאות שהוגדרו למעלה (base). הטבלאות היו ריקות בהחלה => אפס אובדן-נתונים.
-- ============================================================

-- params: ייחודיות שם-הפרמטר (§7.40ב) — ה-Seed מעדכן לפי-שם
alter table params add constraint params_param_name_key unique (param_name);

-- products: יחידה מרשימה סגורה (§7.82/F13) + טיפוסי-כסף (§7.74)
alter table products add constraint products_unit_check check (unit in ('יחידה', 'פרויקט', 'משמרת', 'מטר'));
alter table products alter column base_price type numeric(12,2);
alter table products alter column cost type numeric(12,2);  -- ⛔ העמודה נמחקה 31/07 (סבב G); הטיפוס שרד ב-product_costs.cost

-- price_tiers: כסף מדויק (§7.74) + היגיון (§7.41) + sku ON UPDATE CASCADE (§7.64)
alter table price_tiers alter column special_price type numeric(12,2);
alter table price_tiers add constraint price_tiers_min_qty_check check (min_qty > 0);
alter table price_tiers add constraint price_tiers_max_qty_check check (max_qty is null or max_qty >= min_qty);
alter table price_tiers drop constraint price_tiers_sku_fkey;
alter table price_tiers add constraint price_tiers_sku_fkey
  foreign key (sku) references products(sku) on delete cascade on update cascade;

-- quote_services: בנייה-מחדש (§7.85) — line_id סינתטי, עלות-קפואה (§7.28), צבע (§7.41), sku CASCADE (§7.64), כסף (§7.74)
alter table quote_services drop constraint quote_services_pkey;
alter table quote_services add column line_id bigint generated always as identity primary key;
alter table quote_services add column closing_unit_cost numeric(12,2) not null check (closing_unit_cost >= 0);
alter table quote_services alter column closing_unit_price type numeric(12,2);
alter table quote_services add constraint quote_services_color_check
  check (color is null or color in ('לבן', 'שחור', 'אפור', 'טורקיז', 'כחול'));
alter table quote_services add constraint quote_services_quote_line_key unique (quote_id, line_number);
alter table quote_services drop constraint quote_services_sku_fkey;
alter table quote_services add constraint quote_services_sku_fkey
  foreign key (sku) references products(sku) on delete restrict on update cascade;

-- quotes: snapshots/זמנים/מחזור-חיים/הנחות (§7.51/82/62/26 + LOCAL-2)
alter table quotes add column vat_rate_snapshot numeric(5,2);       -- §7.51
alter table quotes add column rejection_notes text;                 -- §7.82/F3
alter table quotes add column estimated_start_time time not null;   -- §7.82/F23
alter table quotes add column estimated_end_time time not null;     -- §7.82/F23
alter table quotes drop column estimated_hours;                     -- מוקלד → מחושב
alter table quotes add column estimated_hours numeric(4,2) generated always as (
  case when estimated_end_time > estimated_start_time
       then extract(epoch from (estimated_end_time - estimated_start_time)) / 3600
       else extract(epoch from (estimated_end_time - estimated_start_time)) / 3600 + 24
  end
) stored;                                                           -- LOCAL-2: גלגול חוצה-חצות +24
alter table quotes alter column customer_id set not null;           -- §7.62
alter table quotes alter column applied_customer_discount type numeric(12,2);  -- §7.74
alter table quotes alter column manual_discount type numeric(12,2);            -- §7.74
alter table quotes add constraint quotes_applied_discount_range
  check (applied_customer_discount >= 0 and applied_customer_discount <= 100);
alter table quotes add constraint quotes_manual_discount_range
  check (manual_discount >= 0 and manual_discount <= 100);
alter table quotes add constraint quotes_combined_discount_max
  check (applied_customer_discount + manual_discount <= 100);
alter table quotes add constraint quotes_rejection_reason_check
  check (rejection_reason is null or rejection_reason in
    ('מחיר', 'חוסר זמינות/לו"ז', 'נבחר מתחרה', 'תקציב לקוח', 'האירוע בוטל אצל הלקוח', 'פג תוקף', 'נפתחה בטעות', 'אחר'));
alter table quotes add constraint quotes_rejection_notes_required
  check (rejection_reason is distinct from 'אחר' or rejection_notes is not null);
alter table quotes add constraint quotes_rejected_iff_reason
  check ((quote_status = 'rejected') = (rejection_reason is not null));
-- מיגרציה 10 (20260731085335): שיעור-מע"מ ריק לא יכול יותר להיקפא בשקט על הצעה מאושרת
alter table quotes add constraint quotes_approved_requires_vat
  check (quote_status <> 'approved' or vat_rate_snapshot is not null);
alter table quotes add constraint quotes_vat_snapshot_range
  check (vat_rate_snapshot is null or (vat_rate_snapshot >= 0 and vat_rate_snapshot <= 100));

-- projects: snapshot-זהות + זמני-אירוע (§7.76 + LOCAL-1/5) — ה-RPC-האישור ממלא
alter table projects add column event_name text;                                      -- §7.76
alter table projects add column customer_id bigint references customers(customer_id);  -- LOCAL-5 (FK חדש)
alter table projects add column final_start_time time;                                -- LOCAL-1
alter table projects add column final_end_time time;                                  -- LOCAL-1

-- logistics: sku ON UPDATE CASCADE (§7.64)
alter table logistics drop constraint logistics_sku_fkey;
alter table logistics add constraint logistics_sku_fkey
  foreign key (sku) references products(sku) on delete restrict on update cascade;

-- אינדקסים: C-1 (עמודות-FK) + C-6 (סריקת-פקיעה יומית / "פג-בקרוב")
create index if not exists quotes_customer_id_idx      on quotes (customer_id);
create index if not exists quotes_status_updated_idx   on quotes (quote_status, updated_at);
create index if not exists quote_services_sku_idx      on quote_services (sku);
create index if not exists quote_services_quote_id_idx on quote_services (quote_id);
create index if not exists projects_customer_id_idx    on projects (customer_id);
create index if not exists projects_owner_email_idx    on projects (owner_email);
create index if not exists logistics_sku_idx           on logistics (sku);

-- ============================================================
-- מודול 3 — מיגרציה 3: RLS policies (20260723113500) — quotes/quote_services §7.21 · catalog §7.83
-- ============================================================
create policy "quotes_select_by_permission" on quotes for select to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
      and p.permission_level in ('edit', 'view')));
create policy "quotes_write_by_permission" on quotes for all to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
      and p.permission_level = 'edit'))
  with check (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
      and p.permission_level = 'edit'));
create policy "quote_services_select_by_permission" on quote_services for select to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
      and p.permission_level in ('edit', 'view')));
create policy "quote_services_write_by_permission" on quote_services for all to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
      and p.permission_level = 'edit'))
  with check (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
      and p.permission_level = 'edit'));
-- §7.83: catalog — open read to authenticated + CEO write via 'הגדרות מערכת'
create policy "products_select_all_authenticated"    on products    for select to authenticated using (true);
create policy "price_tiers_select_all_authenticated" on price_tiers for select to authenticated using (true);
create policy "params_select_all_authenticated"      on params      for select to authenticated using (true);
create policy "products_write_ceo_only" on products for all to authenticated
  using (exists (select 1 from permissions p where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת') and p.permission_level = 'edit'))
  with check (exists (select 1 from permissions p where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת') and p.permission_level = 'edit'));
create policy "price_tiers_write_ceo_only" on price_tiers for all to authenticated
  using (exists (select 1 from permissions p where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת') and p.permission_level = 'edit'))
  with check (exists (select 1 from permissions p where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת') and p.permission_level = 'edit'));
create policy "params_write_ceo_only" on params for all to authenticated
  using (exists (select 1 from permissions p where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת') and p.permission_level = 'edit'))
  with check (exists (select 1 from permissions p where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת') and p.permission_level = 'edit'));

-- ============================================================
-- מודול 3 — מיגרציה 4: lock trigger + RPCs (20260723115000)
-- ============================================================
-- §7.50/F5: נועל UPDATE/DELETE על הצעה/שורה שאינה in_progress (מגן על שחזור-PDF §7.12 + רווחיות §7.28)
create or replace function public.enforce_quote_in_progress_lock()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_status text;
begin
  if TG_TABLE_NAME = 'quotes' then v_status := OLD.quote_status;
  else select q.quote_status into v_status from public.quotes q where q.quote_id = OLD.quote_id; end if;
  if v_status is distinct from 'in_progress' then
    raise exception 'הצעה נעולה: עריכה/מחיקה מותרת רק בסטטוס in_progress (נמצא: %)', coalesce(v_status,'unknown') using errcode='P0001';
  end if;
  return case when TG_OP = 'DELETE' then OLD else NEW end;
end; $$;
create trigger quotes_lock_non_in_progress         before update or delete on quotes         for each row execute function public.enforce_quote_in_progress_lock();
create trigger quote_services_lock_non_in_progress before update or delete on quote_services for each row execute function public.enforce_quote_in_progress_lock();
-- ⚠️ 3 ה-RPCs: הגוף המלא (הסמכותי) בקובץ supabase/migrations/20260723115000_module3_lock_and_conversion_rpc.sql.
--    כאן החתימות בלבד (schema.sql הוא snapshot-רפרנס; מקור-האמת-לשחזור = המיגרציות, ר' כותרת-הקובץ):
--    • approve_quote_and_create_project(p_quote_id int) returns int  — SECURITY DEFINER, search_path=''
--        §7.49 המרה: בדיקת-edit-פנימית → הקפאת cost(§7.28)+VAT(§7.51) → project נולד-שלם(§7.76/LOCAL-1/5, F22) → logistics.
--        grants: revoke public,anon; grant authenticated.
--        ⚠️ **הגוף עודכן במיגרציה 10 (20260731085335)** — הוא זה שחי היום, לא זה של 20260723115000:
--        פרמטר `אחוז_מעמ` נקרא כטקסט ומאומת (חסר/ריק/לא-מספרי/מחוץ ל-0–100) **לפני כל כתיבה**,
--        עם raise עברי P0001 — כך שאישור שנכשל אינו מוליד פרויקט. שאר הגוף זהה בית-בבית.
--    • create_quote(p_header jsonb, p_lines jsonb) returns int        — SECURITY INVOKER, F17 (RLS הוא הקיר).
--    • replace_quote_lines(p_quote_id int, p_header jsonb, p_lines jsonb) returns void — SECURITY INVOKER, F17.
--        grants (שתיהן): revoke public,anon; grant authenticated.

-- ============================================================
-- מודול 3 — מיגרציה 5: pg_cron (expiry + login cleanup) + lock-fn revoke (20260723120500)
-- ============================================================
create extension if not exists pg_cron with schema pg_catalog;
-- ⚠️ הגוף שלמטה **נדרס במיגרציה 10 (20260731085335)** — cron.schedule עם אותו שם-עבודה מעדכן
--    במקום ליצור כפולה (אומת חי: 2 עבודות, jobid=1 נשמר). הגוף החי היום:
select cron.schedule('module3-quote-expiry', '0 1 * * *', $job$
do $expiry$
declare v_days_text text; v_days int;
begin
  select param_value into v_days_text from public.params where param_name = 'ימי_תוקף_הצעה';
  if v_days_text is null or btrim(v_days_text) = '' or btrim(v_days_text) !~ '^[0-9]+$' then
    raise exception 'פרמטר ימי_תוקף_הצעה חסר או אינו מספר שלם — עבודת תפוגת ההצעות לא בוצעה'
      using errcode = 'P0001';
  end if;
  v_days := btrim(v_days_text)::int;
  update public.quotes set quote_status = 'rejected', rejection_reason = 'פג תוקף'
   where quote_status = 'in_progress'
     and updated_at < now() - (v_days * interval '1 day');
end
$expiry$;
$job$);  -- §7.42/§7.56 + שומר-הפרמטר (מיגרציה 10)
select cron.schedule('module1-login-attempts-cleanup', '30 1 * * *', $job$
  delete from public.login_attempts where last_attempt_at < now() - interval '30 days'; $job$);  -- §7.75
revoke execute on function public.enforce_quote_in_progress_lock() from public, anon, authenticated;  -- advisor hygiene

-- ============================================================
-- מודול 3 — מיגרציה 8: email_log (20260730095439, הוחל 30/07/2026)
-- ============================================================
-- יומן שליחות מיילים — מקור-האמת ל"האם נשלח". **גנרי** לפי (entity_type, entity_id): 6 תבניות-מייל
-- קיימות ב-params ומודולים 4/8/11 ישלחו גם הם, ולכן אין כאן טבלה פר-מודול. אין FK אמיתי (הישות
-- משתנה) — מקובל ביומן: שליחה היא היסטוריה, ובפרויקט אין מחיקה (§7.11).
-- ⚠️ נכתב ע"י Edge Function בלבד (service-role); **אין policy כתיבה ללקוח** — יומן שהדפדפן
-- יכול לכתוב אליו אינו ראיה. הוקדם ממודול 10 (§6 🚧 מ10) בהכרעת-ישי 30/07/2026.
create table email_log (
  email_log_id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('quote', 'shift')),  -- 'shift' נוסף במיגרציה 20260809085058 (מ4); מ8/מ11 מרחיבים בערך אחד כל אחד
  entity_id bigint not null,
  recipient text not null,
  template_name text,
  subject text,
  status text not null check (status in ('sent', 'failed')),   -- אין 'unknown' במכוון
  error_message text,
  sent_by_email text,
  created_at timestamptz not null default now()
);
create index idx_email_log_entity on email_log (entity_type, entity_id, created_at desc);
alter table email_log enable row level security;
create policy "email_log_select_quotes_module" on email_log for select to authenticated
  using (entity_type = 'quote' and exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
      and p.permission_level in ('edit', 'view')));

-- מודול 4 — מיגרציה 0 (20260809085058, הוחל 09/08/2026): policy נפרדת ליומן-הדיילות.
-- 🚫 **לא הרחבה של זו שמעליה** — `db_roadmap` A-20 מורה שכל מודול מוסיף policy משלו, אחרת
-- יומן-ההצעות נפתח למנהלת הגיוס ויומן-הדיילות למנהלת הכספים, ושתיהן חסומות זו במודול של זו.
create policy "email_log_select_shifts_module" on email_log for select to authenticated
  using (entity_type = 'shift' and exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'דיילות')
      and p.permission_level in ('edit', 'view')));

-- ============================================================
-- סבב-תיקונים G — הקשחת-מסד (20260731155511 + 2 מיגרציות תיקון-קדימה, הוחל 31/07/2026)
-- ============================================================
-- ארבעה פערים שבהם המסד היה מתירני יותר מההכרעה שהוא אמור לאכוף (סקירת-הקוד 31/07 §G).

-- (1) §7.8↳ — הגבלת-קצב לפונקציית-הכניסה: 15 קריאות לכל כתובת-IP בשעה.
-- ‏`register_failed_login` מוענקת ל-anon ומקבלת כתובת-מייל כפרמטר, ולכן כל מחזיק מפתח-anon
-- (=כל אחד; הוא בבנדל הציבורי) יכול היה לנעול כל חשבון ידוע שוב ושוב **בלי אף ניסיון-סיסמה**,
-- והנעול אינו יכול לשחרר את עצמו. ההגבלה היא לפי **מי שמתקשר** ולא לפי הפרמטר, שנשלט ע"י התוקף.
-- ⚠️ מקטינה חומרה ואינה סוגרת את הפער — הפתרון המלא (Auth Hook) דורש Team plan, נדחה בהכרעת-ישי.
create table login_rpc_calls (
  ip inet not null,
  called_at timestamptz not null default now()
);
create index login_rpc_calls_ip_time_idx on login_rpc_calls (ip, called_at desc);
alter table login_rpc_calls enable row level security;   -- deny-all מכוון: 0 policies
revoke all on login_rpc_calls from anon, authenticated;  -- הגישה רק מתוך הפונקציה (DEFINER)
-- ‏`register_failed_login` שוכתבה: בראשה שליפת IP מ-`request.headers→x-forwarded-for`, מחיקת
-- שורות מעל שעה, ספירה, ומעל 15 — `raise` בהודעה **גנרית** (לא לחשוף לתוקף שזו הגנת-קצב).
-- ‏IP חסר ⇒ מדלגים על ההגבלה ולא חוסמים (קורה רק בגישה ישירה למסד, לא דרך PostgREST).
-- הלוגיקה העסקית (5 כשלונות ⇒ נעילת 15 דק') לא שונתה.

-- (2) §7.83↳ — עלות-הרכש יוצאת מ-`products` לטבלת-בת, כדי שההרשאה תהיה ברמת-**טבלה**.
-- ‏`products_select_all_authenticated` (using(true)) חשפה את `cost` — כלומר את המרווח — לכל
-- משתמש מחובר, כולל מנהלת-גיוס ומנהלת-לוגיסטיקה שחסומות לגמרי על 'הצעות מחיר' (נמדד חי לפני
-- התיקון: כל חמשת התפקידים קיבלו את העלויות ב-REST). ‏RLS ב-Postgres הוא ברמת-שורה, וכל
-- המחוברים חולקים role אחד — ולכן פיצול-טבלה, לא הרשאת-עמודה; view עם security_invoker אינו פותר.
create table product_costs (
  sku text primary key references products (sku) on update cascade on delete cascade,
  cost numeric(12,2) not null check (cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger product_costs_set_updated_at before update on product_costs
  for each row execute function extensions.moddatetime (updated_at);
alter table product_costs enable row level security;
-- קריאה: בעלי edit על 'הצעות מחיר' (רואי-הרווחיות, §7.28) **או** על 'כספים' (מ8, §7.79)
-- ⟵ אומת חי: מנכ"ל · מנהלת פרויקטים · מנהלת כספים ולקוחות. כתיבה: מנכ"ל, כמו products.
create policy "product_costs_select_by_permission" on product_costs for select to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id in (select module_id from modules where module_name in ('הצעות מחיר', 'כספים'))
      and p.permission_level = 'edit'));
create policy "product_costs_write_ceo_only" on product_costs for all to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
      and p.permission_level = 'edit'))
  with check (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
      and p.permission_level = 'edit'));
insert into product_costs (sku, cost) select sku, cost from products;  -- העתקה לפני המחיקה
alter table products drop column cost;   -- ⚠️ העמודה בשורה 64 ובשורה 445 אינה קיימת יותר
-- שלוש הפונקציות שקראו `products.cost` שוכתבו לקרוא מ-`product_costs`:
--   • approve_quote_and_create_project (DEFINER — עוקף RLS, ההקפאה עובדת לכל מאשר מורשה)
--   • create_quote · replace_quote_lines (INVOKER — בטוח: כל מי שרשאי לכתוב הצעה רשאי לקרוא עלות)
-- ⚠️ שתי האחרונות זורקות `P0001` בעברית **הנוקבת בשם-המוצר** כשלמק"ט אין שורת-עלות, במקום
-- ‏23502 גולמי על closing_unit_cost. התחילית "לא מוגדרת עלות למוצר" היא **חוזה** מול
-- ‏`SERVER_MESSAGE_RULES` ב-`src/lib/quotes.js` — שינוי-ניסוח כאן בלי שם מפיל את המסך ל-fallback.
-- ⚠️ צד-הלקוח קורא `select('*, product_costs(cost)')` — **LEFT במכוון**; inner join היה מפיל
-- מוצר מושבת מהקטלוג ומחזיר את באג-ה-0 ₪ של §7.34.

-- (3) תקרות-שרת ל-bucket `marketing` (היו null — הוולידציה חיה ב-JS בלבד, כלומר עקיפה ב-REST).
-- ⚠️ תאומים של MARKETING_MAX_BYTES / MARKETING_ALLOWED_MIME ב-`src/modules/02_customers/api.js`.
update storage.buckets set file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png'] where id = 'marketing';

-- (4) `products.description` — NOT NULL נשאר (זו הכוונה), נוספה ברירת-מחדל ריקה כרשת-ביטחון
-- לכותב שישמיט את המפתח (הבאג שתוקן בטופס 30/07 המתין לכותב הבא).
alter table products alter column description set default '';

-- ============================================================
-- מודול 4 — מיגרציה A (20260809122536, הוחל 09/08/2026)
-- ============================================================
-- ⚠️ ההגדרות בשורות 143 (hostesses) ו-165 (assignments) הן המצב ההיסטורי. המצב הנוכחי = כאן.
-- שתי הטבלאות נמדדו ריקות (0/0) מיד לפני ההחלה ⇒ אין מיגרציית-נתונים.

-- §7.64 — ת"ז יורדת מהמפתח. היא PII, והמפתח המורכב הישן שכפל אותה לכל שורת-שיבוץ במערכת;
-- בנוסף תיקון ספרת-ביקורת אחרי שיש שיבוצים היה נחסם-FK. ת"ז נשארת `unique not null`.
alter table assignments drop constraint assignments_id_number_fkey;
alter table assignments drop constraint assignments_pkey;
alter table hostesses   drop constraint hostesses_pkey;
alter table hostesses add column hostess_id bigint generated always as identity primary key;
alter table hostesses add constraint hostesses_id_number_key unique (id_number);

-- §12⑱(ב) (הכרעת-ישי 08/08/2026) — `rating` היה `not null default 3`, כלומר כל דיילת נולדה
-- מדורגת בלי שאיש התרשם ממנה. ‏NULL = "טרם התרשמה", והמסך מציג `—`.
-- 🔴 **וביטול ה-DEFAULT הוא חצי הכרחי, לא ניקוי** — בלעדיו העמודה ממשיכה למלא 3 לבד.
alter table hostesses alter column rating drop default;
alter table hostesses alter column rating drop not null;   -- ה-CHECK 1..5 נשאר; NULL עובר אותו
-- 🚫 אין UNIQUE על `hostesses.email` (§7.65, הכרעת-ישי 31/07) — האזהרה רכה ובטופס בלבד.
-- 🚫 `email`/`city`/`bank_*` נשארות `not null` (local-1, הכרעת-ישי 08/08).
alter table hostesses add column address   text;
alter table hostesses add column lat       numeric;
alter table hostesses add column lng       numeric;
alter table hostesses add column has_car   boolean not null default false;
alter table hostesses add column languages text[]  not null default '{}';

alter table assignments drop column id_number;
alter table assignments add  column hostess_id bigint not null;
alter table assignments add constraint assignments_pkey
  primary key (project_id, hostess_id, assignment_number);
-- ON DELETE restrict: אין מחיקת דיילות בשום מקום (השבתה = תג-סטטוס).
-- ON UPDATE restrict: מפתח-identity אינו זז — הצהרה מפורשת, לא ברירת-מחדל שקטה (db_roadmap §1).
alter table assignments add constraint assignments_hostess_id_fkey
  foreign key (hostess_id) references hostesses(hostess_id) on delete restrict on update restrict;

-- 🔴 `responded_at` נכתבת **פעם אחת בלבד, במענה הראשון** (spec §12⑨). "שלח שוב" מאפס את
-- `invite_sent_at` בלי לגעת בה, אחרת נוצר זמן-תגובה שלילי. ואסור לגזור מ-`updated_at`:
-- מודול 8 יכתוב `salary_report_id` חודשים אחרי המענה ויזייף כל זמני-התגובה בהיסטוריה.
alter table assignments add column responded_at   timestamptz;
alter table assignments add column invite_token   text unique;   -- ה-UNIQUE הוא גם האינדקס של ה-RPC
alter table assignments add column invite_sent_at timestamptz;
alter table assignments add column travel_amount  numeric(12,2) not null default 0;  -- §7.69
alter table assignments add column is_shift_lead  boolean not null default false;
-- `event_date` מדונרמלת מ-`projects.final_event_date` — ‏UNIQUE אינו יכול לצרף טבלאות,
-- וההכרעה "אילוץ במסד ולא בדיקה בקוד" (§7.88) אוסרת על הפתרון בקוד. הטריגר = מיגרציה B.
alter table assignments add column event_date     date;

-- ששת הסטטוסים של spec §1.1 — סגורים. "פג תוקף" **נגזר בתצוגה** ואינו ערך שביעי.
alter table assignments drop constraint assignments_assignment_status_check;
alter table assignments add  constraint assignments_assignment_status_check
  check (assignment_status in ('pending', 'confirmed_available', 'declined',
                               'finally_approved', 'released', 'approval_withdrawn'));

-- "אחראית משמרת" — אחת לכל אירוע, נאכף במסד (תקדים §7.29).
create unique index assignments_one_shift_lead_per_project on assignments (project_id) where is_shift_lead;
create index assignments_hostess_id_idx on assignments (hostess_id);   -- C-1

-- local-5 (עוגן §7.76) — מנהלת הגיוס **חסומה** על מודול 'לקוחות' (נמדד חי), ולכן join ל-`customers`
-- היה מחזיר null **בשקט** בשלושה מסכים מאושרים שמדפיסים שם-לקוח. ⇒ snapshot, כמו `event_name`.
-- lat/lng: בלעדיהן נופלים גם מרכיב-הקרבה וגם שער-ה-80 ק"מ (spec §12⑫).
alter table projects add column lat           numeric;
alter table projects add column lng           numeric;
alter table projects add column customer_name text;
update projects p set customer_name = c.company_name
  from customers c where c.customer_id = p.customer_id and p.customer_name is null;
-- 🔴 ו-`approve_quote_and_create_project` נכתבה מחדש (create or replace) כדי שתמלא את השדה —
-- היא הכותב היחיד של `projects`, ובלעדיה כל פרויקט **חדש** היה נולד עם snapshot ריק: בדיוק
-- התקלה השקטה שהעמודה באה למנוע. הגוף זהה לגרסת 20260731085335 פרט ל-`customer_name`
-- ול-`left join customers` שמזין אותו (‏LEFT ולא INNER — `projects.customer_id` nullable).

-- ============================================================
-- מודול 4 — מיגרציה B (20260809124327, הוחל 09/08/2026): "אירוע אחד ביום" (§7.88)
-- ============================================================
-- ‏`UNIQUE` אינו יכול לצרף טבלאות, והתאריך יושב על `projects` ⇒ עמודה מדונרמלת + טריגר
-- **דו-כיווני**. הכיוון השני הוא הקריטי: בלי טריגר על `projects`, דחיית-תאריך של אירוע הייתה
-- משאירה את האילוץ תקוע על התאריך הישן — **נראה עובד, ואינו עובד.**
create or replace function public.sync_assignment_event_date()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select p.final_event_date into new.event_date
    from public.projects p where p.project_id = new.project_id;
  return new;
end; $$;
revoke execute on function public.sync_assignment_event_date() from public, anon, authenticated;
-- על כל insert/update, ולא רק כששדה מסוים משתנה — כדי שאיש לא יוכל לכתוב ערך משלו לעמודה.
-- ‏`security definer`: העמודה היא נגזרת טהורה, ואסור שתהיה תלויה בהרשאת-הקריאה של הכותב על
-- `projects` — ‏RLS חוסם היה מחזיר NULL, כלומר אילוץ שקט שאינו אוכף.
create trigger assignments_sync_event_date before insert or update on assignments
  for each row execute function public.sync_assignment_event_date();

create or replace function public.sync_assignments_on_project_date_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.assignments set event_date = new.final_event_date
   where project_id = new.project_id;
  return null;
end; $$;
revoke execute on function public.sync_assignments_on_project_date_change() from public, anon, authenticated;
-- ‏AFTER UPDATE בלבד ⇒ **אינו נדלק על INSERT**, ולכן ה-RPC של מ3 (שיוצרת פרויקט עם אפס
-- שיבוצים) אינה מושפעת כלל. ואם הזזת-תאריך יוצרת התנגשות אמיתית — ה-UPDATE נכשל על האינדקס
-- וכל השינוי מתגלגל אחורה. זו ההתנהגות הנכונה: עדיף להיכשל בקול מלהזיז אירוע ולהשאיר
-- דיילת משובצת פעמיים באותו יום.
create trigger projects_sync_assignment_dates after update of final_event_date on projects
  for each row when (old.final_event_date is distinct from new.final_event_date)
  execute function public.sync_assignments_on_project_date_change();

-- 🔴 `not null` אינו קישוט: באינדקס-ייחודי שני NULL נחשבים **שונים זה מזה**, ולכן שתי שורות
-- `finally_approved` עם `event_date` ריק היו עוקפות את האילוץ **בלי להפר אותו**.
alter table assignments alter column event_date set not null;

-- 🔴 נקודת-האכיפה = `finally_approved` בלבד (§7.88↳, הכרעת-ישי 08/08/2026). שני זימונים
-- `pending` באותו יום נשארים חוקיים — המנהלת שולחת בסבבים ומחליטה מי מאושרת בסוף.
-- ⚠️ המחיר: הבונוס של §7.54 (חסימת שתי שורות פעילות על אותו פרויקט) אבוד, ו-A-15 נשארת פתוחה.
-- 🧩 שם האינדקס הוא **חוזה מול הממשק** (שלב 3) — המסך ימפה אותו להודעה בעברית, כמו
-- ‏`SERVER_MESSAGE_RULES` ב-`src/lib/quotes.js`. שינוי-שם בלי עדכון המיפוי מפיל להודעה גנרית.
create unique index assignments_one_event_per_day on assignments (hostess_id, event_date)
  where assignment_status = 'finally_approved';

-- ============================================================
-- מודול 4 — מיגרציה C (20260809125750, הוחל 09/08/2026): שתי טבלאות + 14 params + תבנית
-- ============================================================
-- אי-זמינות מוצהרת (§2.1(3)) — התנאי החמישי בשער של Smart Match. בלעדיה הדיילת מקבלת זימונים
-- בזמן שהיא בחו"ל, מסרבת לכולם, **והמערכת רושמת אותה כלא-אמינה** (ההיענות = 40% מהציון).
-- הטווח **כולל את יום-הסיום** (הנחה 9; עקבי עם §7.30 ועם כל תוויות-הממשק).
create table hostess_unavailability (
  unavailability_id bigint generated always as identity primary key,
  hostess_id bigint not null references hostesses(hostess_id) on delete cascade on update cascade,
  start_date date not null,
  end_date   date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hostess_unavailability_range_valid check (end_date >= start_date)
);
create trigger hostess_unavailability_set_updated_at before update on hostess_unavailability
  for each row execute function extensions.moddatetime (updated_at);
create index hostess_unavailability_hostess_id_idx on hostess_unavailability (hostess_id);   -- C-1
alter table hostess_unavailability enable row level security;   -- policies במיגרציה D

-- הסימון התלת-מצבי — צמוד **ללקוח**, לא לדיילת (§7.15↳ · `db_roadmap:145`).
-- 🔴 מ4 יוצר וקורא (שכבות 1–2 של Smart Match); **מ6 כותב** (`🚧 מ6 ← מ4`). נשארת ריקה עד אז,
-- וזה תקין — אבל בלעדיה לתנאי השלישי בשער אין מה לקרוא, והוא היה מדלג בשקט.
create table customer_hostess_preference (
  preference_id bigint generated always as identity primary key,
  customer_id bigint not null references customers(customer_id) on delete cascade on update cascade,
  hostess_id  bigint not null references hostesses(hostess_id)  on delete cascade on update cascade,
  preference text not null check (preference in ('מצוינת', 'בסדר', 'לא_לשלוח')),
  preference_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_hostess_preference_unique unique (customer_id, hostess_id),
  -- סימון שלילי מחייב נימוק כתוב — אילוץ, לא ולידציה בטופס (תקדים-שוק: TempWorks/Avionté).
  constraint customer_hostess_preference_negative_needs_reason
    check (preference <> 'לא_לשלוח' or preference_reason is not null)
);
create trigger customer_hostess_preference_set_updated_at before update on customer_hostess_preference
  for each row execute function extensions.moddatetime (updated_at);
-- `customer_id` מכוסה כבר ע"י ה-UNIQUE (עמודה מובילה) ⇒ אינדקס נפרד היה כפילות מתה.
create index customer_hostess_preference_hostess_id_idx on customer_hostess_preference (hostess_id);
alter table customer_hostess_preference enable row level security;   -- policies במיגרציה D

-- ‏`params`: 20 ⇐ 32. שלוש שורות-המשקולות הישנות (`משקולת_1W_דירוג`/`2W_קרבה`/`3W_מהימנות`)
-- **נמחקו, לא שונו שם** — לאלגוריתם החדש אין מרכיב "דירוג" כלל, ושינוי-שם היה משאיר שם שקרי
-- על ערך חדש. נוספו 14 פרמטרים + תבנית מייל-השחרור:
--   smart_match: משקולת_היענות 0.40 · משקולת_אמינות 0.35 · משקולת_קרבה 0.25 (**סכום = 1.00**) ·
--     שער_מרחק_קמ 80 · גולפוסט_מרחק_קמ 40 · קבוע_ריסון_m 3 · חלון_חישוב_חודשים 12 ·
--     חלון_חישוב_מורחב_חודשים 24 · מינימום_תשובות_להצגת_ציון 3 · שיעור_בונוס_הוגנות_לשבוע 0.02 ·
--     תקרת_שבועות_הוגנות 8 · לא_ענתה_ל_N 4 · מרכיב_אמינות_פעיל **false** (§7.90)
--   pricing_timing: סכום_נסיעות_למשמרת 0 (§7.69 — הסכום עצמו פתוח עד אימות מול רואה-החשבון)
--   templates: תבנית_מייל_שחרור_משמרת
-- ⛔ `תקרת_דיילות_מומלצת` **אינה קיימת** — בוטלה בהכרעת-ישי 09/08/2026 ("אין צורך בתקרה, מיותר").
-- ⚠️ ‏`מרכיב_אמינות_פעיל` כבוי ⇒ בזמן-ריצה **מנרמלים מחדש** את שני המשקלים הנותרים ל-1.0.
-- 🚫 אין לקודד קשיח את הפיצול הדו-כיווני (§11.1).
