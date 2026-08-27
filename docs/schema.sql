-- ============================================================
-- REG-IN — סכמת מסד הנתונים (Database Schema)
-- ============================================================
-- מה הקובץ הזה: תיאור **מלא ובזמן-הווה** של המסד החי — כל טבלה, עמודה, טיפוס, ברירת-מחדל,
-- אילוץ (בשמו האמיתי), אינדקס, מדיניות RLS, פונקציה, טריגר, עבודת cron ודלי-אחסון.
-- מקור-אמת לקריאה: כל קוד חייב להתאים בדיוק לשמות/טיפוסים/constraints כאן,
-- ואם יש סתירה בין האפיון/מדריך לסכמה — הסכמה גוברת.
--
-- ⚠️ זהו SNAPSHOT שנוצר מתוך שאילתות על המסד החי. **מקור-אמת לשינויים = `supabase/migrations/`**
--    (ולא הקובץ הזה). כל שינוי DB נכתב כקובץ מיגרציה חדש, מוחל, ואז הקובץ הזה נוצר מחדש.
--
-- 📅 נוצר: 14/08/2026 · רוענן: 27/08/2026 (צעד 1.8 — כל עשר מיגרציות פזה 1 של מודול 8; אחרי מיגרציה
--    `20260827125155_module8_finance_tables_and_columns`; הדלתא: טבלה חדשה `project_finance`
--    (+RLS +policy קריאה +טריגר), 2 עמודות ואילוץ-ייחודיות על `projects`, עמודה + CHECK
--    + אינדקס-C-1 על `assignments`, והידוק policy-הקריאה של `quote_services` (ה30)) ·
--    ואחרי מיגרציה B `20260827131033_module8_salary_report_document_model` (הדלתא:
--    `salary_reports` מריצה למסמך — 3 עמודות + 3 אילוצים + policy ראשונה אי-פעם, ושחרור
--    שתי עמודות-חובה; טבלה חדשה `salary_report_lines` +RLS +policy +3 אינדקסים +טריגר) ·
--    ואחרי C `20260827132708_module8_hostess_bank_details_split` (טבלה חדשה
--    `hostess_bank_details` +RLS +2 policies +טריגר + העתקת 26 שורות, ושחרור שלוש
--    עמודות-הבנק ב-`hostesses` מ-NOT NULL **בלי למחוק אותן** — ר' סעיף 29 ו-db_roadmap §9א) ·
--    ואחרי D `20260827132709_module8_email_log_finance_entities` (‏CHECK של `email_log`
--    מ-4 ל-6 ערכים + policy רביעית ל'כספים') ·
--    ואחרי E1 `20260827144459_module8_finance_money_ssot_and_readers` (‏3 פונקציות חדשות —
--    ‏`finance_project_money` הפנימית ושני הקוראים המגודרים — **וכתיבה-מחדש של
--    `list_projects_overview` הממוזגת של מ6**: ‏`planned_revenue` כולל מעכשיו גם
--    Σ שינויי-תכולה. עוגן-מ6 (#8 = 5,355.00) אומת זהה-ספרתית אחרי השכתוב) ·
--    ואחרי E2 `20260827150049_module8_finance_write_actions` (‏9 פונקציות חדשות —
--    ‏2 פנימיות ו-7 נקראות-מהלקוח — ו**הסרת `set_project_finance_fields` של מ6**;
--    שני מסעות מלאים אומתו בטרנזקציות שגולגלו אחורה: ארכוב הקפיא 230.00 וההצעה
--    החזירה 3,508.00 — שני עוגני-היד) ·
--    ואחרי E3 `20260827152840_module8_salary_report_transaction` + תיקון-קדימה
--    `20260827153725_module8_salary_report_temp_table_fix` (שתי פונקציות דוח-השכר) ·
--    ואחרי F `20260827155303_module8_public_feedback_rpc` (טבלה חדשה
--    `feedback_rpc_calls` — סעיף 30 — +RLS בלי policies ואינדקס; 4 פונקציות חדשות,
--    שתיים מהן נקראות בידי `anon`; ו**שער נוסף ל-`archive_project`** — ציון <3 בלי
--    סיבה חוסם ארכוב) ·
--    ואחרי G `20260827160357_module8_cancel_project_released_status_and_seeds`
--    (הרחבת `cancel_project` הממוזגת של מ6 בשורה אחת — שימור
--    `released_from_status`, הוכח ב-md5 על הגוף החי — ושני זרעי-פרמטרים:
--    `תנאי_תשלום_ימים`=30 ו-`סכום_נסיעות_למשמרת` 0→22.60) ·
--    פרויקט Supabase `yfeovxppnfoafmfbdfvh` · Postgres 17.
--
-- 🔴 **לרענן את הקובץ הזה אחרי כל מיגרציה.** העותק הקודם לא רוענן חמישה חודשים והכריז על עמודה
--    (`assignments.id_number`) שאינה קיימת במסד — מפתח ראשי שגוי לטבלה שלמה, בקובץ שהוא דרגה 1
--    בהיררכיית-האמת.
--
-- 🚫 **גופי פונקציות אינם כאן במכוון** — לא חוסר, אלא החלטה: הם מאות שורות, וה-SSOT שלהם הוא
--    `supabase/migrations/`. סעיף 24 נותן לכל פונקציה חתימה מלאה, מצב אבטחה, הרשאות-הרצה
--    ומצביע לקובץ המיגרציה שבו הגוף הנוכחי חי.
--
-- 🚫 **אין כאן סעיף "היסטוריה"/"יומן שינויים"** — הקובץ מתאר הווה בלבד. ציר השינויים חי
--    ב-`supabase/migrations/` וב-`docs/db_roadmap.md`.
--
-- מוסכמות: כל 27 הטבלאות ב-`public` עם RLS **מופעל** (נמדד 27/08/2026 אחרי מיגרציה F).
-- כל 55 המדיניות (43 ב-public, 12 על `storage.objects`) הן PERMISSIVE ומוגדרות `to authenticated`.
-- 🔴 **PERMISSIVE = הן מתאחדות ב-OR.** שתי policies על אותה טבלה מרחיבות גישה, לא מצמצמות —
--    ולכן policy חדשה "מגודרת היטב" אינה מגבילה אף אחד שכבר עובר דרך policy אחרת.
-- 🔴 ארבע טבלאות נותרו deny-all **במכוון**: `project_changes` (נקראת רק דרך ה-RPC הממסך),
--    `login_attempts` ו-`login_rpc_calls` (רק דרך פונקציות ה-DEFINER של הכניסה), ו-`feedback_rpc_calls`
--    (נוספה 27/08/2026 ב-F — אותו דפוס, לדף-המשוב הציבורי). מ-27/08/2026
--    **אין יותר אף טבלה עסקית שחסומה מחוסר-בנייה** — `salary_reports` הייתה האחרונה. הפונקציה `moddatetime` (טריגר
-- `updated_at`) יושבת בסכמה `extensions`, לא ב-`public`.
-- ============================================================


-- ============================================================
-- 1. טבלת תפקידים — public.roles (מודול 1)
-- ============================================================
create table roles (
  role_id   serial not null,
  role_name text   not null,
  constraint roles_pkey          primary key (role_id),
  constraint roles_role_name_key unique (role_name)
);

alter table roles enable row level security;

-- אינדקסים
-- roles_pkey — unique btree (role_id) [נוצר ע"י האילוץ roles_pkey]
-- roles_role_name_key — unique btree (role_name) [נוצר ע"י האילוץ roles_role_name_key]

-- מדיניות RLS
create policy roles_select_all on roles
  for select to authenticated
  using (true);


-- ============================================================
-- 2. טבלת מודולים — public.modules (מודול 1; שורות המטריצה role→module)
-- ============================================================
create table modules (
  module_id   serial not null,
  module_name text   not null,
  constraint modules_pkey            primary key (module_id),
  constraint modules_module_name_key unique (module_name)
);

alter table modules enable row level security;

-- אינדקסים
-- modules_pkey — unique btree (module_id) [נוצר ע"י האילוץ modules_pkey]
-- modules_module_name_key — unique btree (module_name) [נוצר ע"י האילוץ modules_module_name_key]

-- מדיניות RLS
create policy modules_select_all on modules
  for select to authenticated
  using (true);


-- ============================================================
-- 3. טבלת הרשאות — public.permissions (מודול 1; רמת גישה לכל צמד תפקיד×מודול)
-- ============================================================
create table permissions (
  role_id          integer not null,
  module_id        integer not null,
  permission_level text    not null,
  constraint permissions_pkey                   primary key (role_id, module_id),
  constraint permissions_role_id_fkey           foreign key (role_id)   references roles (role_id)     on delete cascade,
  constraint permissions_module_id_fkey         foreign key (module_id) references modules (module_id) on delete cascade,
  constraint permissions_permission_level_check check (permission_level = any (array['edit'::text, 'view'::text, 'blocked'::text]))
);

alter table permissions enable row level security;

-- אינדקסים
-- permissions_pkey — unique btree (role_id, module_id) [נוצר ע"י האילוץ permissions_pkey]

-- מדיניות RLS
create policy permissions_select_all on permissions
  for select to authenticated
  using (true);

create policy permissions_write_ceo_only on permissions
  for all to authenticated
  using      (current_user_role_id() = (select role_id from roles where role_name = 'מנכ"ל'))
  with check (current_user_role_id() = (select role_id from roles where role_name = 'מנכ"ל'));


-- ============================================================
-- 4. טבלת משתמשי מערכת — public.users (מודול 1; המייל מקשר ל-Supabase Auth)
-- ============================================================
create table users (
  email     text    not null,
  role_id   integer not null,
  full_name text    not null,
  status    text    not null default 'active',
  phone     text,
  constraint users_pkey         primary key (email),
  constraint users_role_id_fkey foreign key (role_id) references roles (role_id) on delete restrict,
  constraint users_status_check check (status = any (array['active'::text, 'inactive'::text]))
);

alter table users enable row level security;

-- אינדקסים
-- users_pkey — unique btree (email) [נוצר ע"י האילוץ users_pkey]

-- מדיניות RLS
create policy users_select_self_or_ceo on users
  for select to authenticated
  using (
    email = (select auth.email())
    or (select current_user_role_id()) = (select role_id from roles where role_name = 'מנכ"ל')
  );

create policy users_update_self on users
  for update to authenticated
  using (email = (select auth.email()))
  with check (
    email = (select auth.email())
    and role_id = (select current_user_role_id())
    and status = 'active'
  );

create policy users_write_ceo_only on users
  for all to authenticated
  using      (current_user_role_id() = (select role_id from roles where role_name = 'מנכ"ל'))
  with check (current_user_role_id() = (select role_id from roles where role_name = 'מנכ"ל'));


-- ============================================================
-- 5. טבלת נעילת התחברות — public.login_attempts (מודול 1)
-- ============================================================
-- נכתבת ונקראת אך ורק דרך הפונקציות check_login_lock / register_failed_login /
-- reset_login_attempts (סעיף 24). RLS מופעל ואין לה אף policy ⇒ גישה ישירה מהלקוח חסומה.
create table login_attempts (
  email           text        not null,
  failed_count    integer     not null default 0,
  locked_until    timestamptz,
  last_attempt_at timestamptz not null default now(),
  constraint login_attempts_pkey primary key (email)
);

alter table login_attempts enable row level security;

-- אינדקסים
-- login_attempts_pkey — unique btree (email) [נוצר ע"י האילוץ login_attempts_pkey]

-- מדיניות RLS: אין (0 policies)


-- ============================================================
-- 6. טבלת קצב-קריאות ל-RPC של ההתחברות — public.login_rpc_calls (מודול 1)
-- ============================================================
-- ⚠️ אין לטבלה הזו מפתח ראשי. RLS מופעל ואין לה אף policy.
create table login_rpc_calls (
  ip        inet        not null,
  called_at timestamptz not null default now()
);

alter table login_rpc_calls enable row level security;

-- אינדקסים
create index login_rpc_calls_ip_time_idx on login_rpc_calls using btree (ip, called_at desc);

-- מדיניות RLS: אין (0 policies)


-- ============================================================
-- 7. טבלת לקוחות — public.customers (מודול 2)
-- ============================================================
-- העמודות מסודרות כאן בסדר הפיזי שלהן במסד. המפתח הראשי הוא customer_id (identity),
-- ו-company_number (ח"פ, 9 ספרות) הוא המזהה העסקי הייחודי.
create table customers (
  company_number    text        not null,
  customer_type     text        not null,
  company_name      text        not null,
  contact_name      text        not null,
  phone             text        not null,
  email             text        not null,
  discount_percent  numeric     not null default 0,
  marketing_consent boolean     not null default false,
  status            text        not null default 'active',
  customer_id       bigint      not null generated always as identity,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint customers_pkey                   primary key (customer_id),
  constraint customers_company_number_key     unique (company_number),
  constraint customers_company_number_9_digits check (company_number ~ '^[0-9]{9}$'::text),
  constraint customers_customer_type_check    check (customer_type = any (array['private_company'::text, 'government'::text, 'production_company'::text, 'nonprofit'::text])),
  constraint customers_discount_range         check (discount_percent >= 0::numeric and discount_percent <= 100::numeric),
  constraint customers_status_check           check (status = any (array['active'::text, 'inactive'::text]))
);

alter table customers enable row level security;

-- אינדקסים
-- customers_pkey — unique btree (customer_id) [נוצר ע"י האילוץ customers_pkey]
-- customers_company_number_key — unique btree (company_number) [נוצר ע"י האילוץ customers_company_number_key]

-- טריגרים
create trigger customers_set_updated_at
  before update on customers
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy customers_select_by_permission on customers
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy customers_write_by_permission on customers
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 8. טבלת אנשי-קשר נוספים ללקוח — public.customer_contacts (מודול 2)
-- ============================================================
-- איש-הקשר הראשי יושב inline על customers (contact_name/phone/email); כאן ה*נוספים* בלבד.
create table customer_contacts (
  contact_id   bigint      not null generated always as identity,
  customer_id  bigint      not null,
  contact_name text        not null,
  phone        text,
  email        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint customer_contacts_pkey             primary key (contact_id),
  constraint customer_contacts_customer_id_fkey foreign key (customer_id) references customers (customer_id) on update cascade on delete cascade
);

alter table customer_contacts enable row level security;

-- אינדקסים
create index customer_contacts_customer_id_idx on customer_contacts using btree (customer_id);
-- customer_contacts_pkey — unique btree (contact_id) [נוצר ע"י האילוץ customer_contacts_pkey]

-- טריגרים
create trigger customer_contacts_set_updated_at
  before update on customer_contacts
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy customer_contacts_select_by_permission on customer_contacts
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy customer_contacts_write_by_permission on customer_contacts
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 9. קטלוג מוצרים — public.products (אתר / דיילת / מוצר)
-- ============================================================
-- מחיר-המכירה כאן; **העלות חיה בטבלה נפרדת — product_costs (סעיף 10)**.
create table products (
  sku        text        not null,
  item_name  text        not null,
  description text        not null default '',
  category   text        not null,
  unit       text        not null,
  base_price numeric(12,2) not null,
  status     text        not null default 'active',
  image_url  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_pkey             primary key (sku),
  constraint products_base_price_check check (base_price >= 0::numeric),
  constraint products_category_check   check (category = any (array['site'::text, 'hostess'::text, 'product'::text])),
  constraint products_status_check     check (status = any (array['active'::text, 'out_of_stock'::text, 'inactive'::text])),
  constraint products_unit_check       check (unit = any (array['יחידה'::text, 'פרויקט'::text, 'משמרת'::text, 'מטר'::text]))
);

alter table products enable row level security;

-- אינדקסים
-- products_pkey — unique btree (sku) [נוצר ע"י האילוץ products_pkey]

-- טריגרים
create trigger products_set_updated_at
  before update on products
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy products_select_all_authenticated on products
  for select to authenticated
  using (true);

create policy products_write_ceo_only on products
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 10. עלויות מוצרים — public.product_costs
-- ============================================================
-- טבלה נפרדת מ-products כי הקריאה שלה מוגבלת: רק בעלי הרשאת edit ב'הצעות מחיר' או ב'כספים'.
create table product_costs (
  sku        text          not null,
  cost       numeric(12,2) not null,
  created_at timestamptz   not null default now(),
  updated_at timestamptz   not null default now(),
  constraint product_costs_pkey      primary key (sku),
  constraint product_costs_sku_fkey  foreign key (sku) references products (sku) on update cascade on delete cascade,
  constraint product_costs_cost_check check (cost >= 0::numeric)
);

alter table product_costs enable row level security;

-- אינדקסים
-- product_costs_pkey — unique btree (sku) [נוצר ע"י האילוץ product_costs_pkey]

-- טריגרים
create trigger product_costs_set_updated_at
  before update on product_costs
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy product_costs_select_by_permission on product_costs
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id in (select module_id from modules where module_name = any (array['הצעות מחיר'::text, 'כספים'::text]))
        and p.permission_level = 'edit'
    )
  );

create policy product_costs_write_ceo_only on product_costs
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 11. מדרגות מחיר — public.price_tiers (הנחות כמות למוצר)
-- ============================================================
create table price_tiers (
  sku           text          not null,
  min_qty       integer       not null,
  special_price numeric(12,2) not null,
  max_qty       integer,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now(),
  constraint price_tiers_pkey                primary key (sku, min_qty),
  constraint price_tiers_sku_fkey            foreign key (sku) references products (sku) on update cascade on delete cascade,
  constraint price_tiers_min_qty_check       check (min_qty > 0),
  constraint price_tiers_max_qty_check       check (max_qty is null or max_qty >= min_qty),
  constraint price_tiers_special_price_check check (special_price > 0::numeric)
);

alter table price_tiers enable row level security;

-- אינדקסים
-- price_tiers_pkey — unique btree (sku, min_qty) [נוצר ע"י האילוץ price_tiers_pkey]

-- טריגרים
create trigger price_tiers_set_updated_at
  before update on price_tiers
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy price_tiers_select_all_authenticated on price_tiers
  for select to authenticated
  using (true);

create policy price_tiers_write_ceo_only on price_tiers
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 12. פרמטרים גלובליים — public.params (מע"מ, יחסי-תכנון, משקולות Smart Match, תבניות)
-- ============================================================
create table params (
  param_id    serial      not null,
  param_name  text        not null,
  param_value text        not null,
  param_type  text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint params_pkey            primary key (param_id),
  constraint params_param_name_key  unique (param_name),
  constraint params_param_type_check check (param_type = any (array['pricing_timing'::text, 'control_alerts'::text, 'smart_match'::text, 'templates'::text, 'integration_tech'::text]))
);

alter table params enable row level security;

-- אינדקסים
-- params_pkey — unique btree (param_id) [נוצר ע"י האילוץ params_pkey]
-- params_param_name_key — unique btree (param_name) [נוצר ע"י האילוץ params_param_name_key]

-- טריגרים
create trigger params_set_updated_at
  before update on params
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy params_select_all_authenticated on params
  for select to authenticated
  using (true);

create policy params_write_ceo_only on params
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 13. הצעות מחיר — public.quotes (מודול 3)
-- ============================================================
create table quotes (
  quote_id                  serial      not null,
  customer_id               bigint      not null,
  event_name                text        not null,
  issue_date                date        not null default current_date,
  recommended_hostess_count integer     not null,
  estimated_guests          integer     not null,
  estimated_event_date      date        not null,
  estimated_location        text        not null,
  quote_status              text        not null default 'in_progress',
  pdf_url                   text,
  applied_customer_discount numeric(12,2) not null,
  manual_discount           numeric(12,2) not null default 0,
  rejection_reason          text,
  notes                     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  vat_rate_snapshot         numeric(5,2),
  rejection_notes           text,
  estimated_start_time      time        not null,
  estimated_end_time        time        not null,
  -- עמודה מחושבת ומאוחסנת: משך ההצעה בשעות; חוצה חצות ⇒ מוסיפה 24
  estimated_hours           numeric(4,2) generated always as (
    case
      when estimated_end_time > estimated_start_time
        then extract(epoch from (estimated_end_time - estimated_start_time)) / 3600::numeric
      else extract(epoch from (estimated_end_time - estimated_start_time)) / 3600::numeric + 24::numeric
    end
  ) stored,
  constraint quotes_pkey                        primary key (quote_id),
  constraint quotes_customer_id_fkey            foreign key (customer_id) references customers (customer_id) on delete restrict,
  constraint quotes_quote_status_check          check (quote_status = any (array['in_progress'::text, 'approved'::text, 'rejected'::text])),
  constraint quotes_estimated_guests_check      check (estimated_guests > 0),
  constraint quotes_recommended_hostess_count_check check (recommended_hostess_count > 0),
  constraint quotes_applied_discount_range      check (applied_customer_discount >= 0::numeric and applied_customer_discount <= 100::numeric),
  constraint quotes_manual_discount_range       check (manual_discount >= 0::numeric and manual_discount <= 100::numeric),
  constraint quotes_combined_discount_max       check (applied_customer_discount + manual_discount <= 100::numeric),
  constraint quotes_approved_requires_vat       check (quote_status <> 'approved'::text or vat_rate_snapshot is not null),
  constraint quotes_vat_snapshot_range          check (vat_rate_snapshot is null or (vat_rate_snapshot >= 0::numeric and vat_rate_snapshot <= 100::numeric)),
  constraint quotes_rejected_iff_reason         check ((quote_status = 'rejected'::text) = (rejection_reason is not null)),
  constraint quotes_rejection_reason_check      check (rejection_reason is null or rejection_reason = any (array['מחיר'::text, 'חוסר זמינות/לו"ז'::text, 'נבחר מתחרה'::text, 'תקציב לקוח'::text, 'האירוע בוטל אצל הלקוח'::text, 'פג תוקף'::text, 'נפתחה בטעות'::text, 'אחר'::text])),
  constraint quotes_rejection_notes_required    check (rejection_reason is distinct from 'אחר'::text or rejection_notes is not null)
);

alter table quotes enable row level security;

-- אינדקסים
create index quotes_customer_id_idx     on quotes using btree (customer_id);
create index quotes_status_updated_idx  on quotes using btree (quote_status, updated_at);
-- quotes_pkey — unique btree (quote_id) [נוצר ע"י האילוץ quotes_pkey]

-- טריגרים
create trigger quotes_lock_non_in_progress
  before delete or update on quotes
  for each row execute function enforce_quote_in_progress_lock();

create trigger quotes_set_updated_at
  before update on quotes
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy quotes_select_by_permission on quotes
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy quotes_write_by_permission on quotes
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 14. שורות ההצעה — public.quote_services (מודול 3)
-- ============================================================
-- המפתח הראשי הוא line_id (identity); (quote_id, line_number) הוא מפתח עסקי ייחודי.
-- line_id הוא גם היעד של logistics.quote_service_line_id (סעיף 20).
create table quote_services (
  quote_id           integer       not null,
  sku                text          not null,
  line_number        integer       not null,
  qty                integer       not null,
  closing_unit_price numeric(12,2) not null,
  color              text,
  notes              text,
  created_at         timestamptz   not null default now(),
  updated_at         timestamptz   not null default now(),
  line_id            bigint        not null generated always as identity,
  closing_unit_cost  numeric(12,2) not null,
  constraint quote_services_pkey                     primary key (line_id),
  constraint quote_services_quote_line_key           unique (quote_id, line_number),
  constraint quote_services_quote_id_fkey            foreign key (quote_id) references quotes (quote_id) on delete cascade,
  constraint quote_services_sku_fkey                 foreign key (sku)      references products (sku)    on update cascade on delete restrict,
  constraint quote_services_qty_check                check (qty > 0),
  constraint quote_services_closing_unit_price_check check (closing_unit_price >= 0::numeric),
  constraint quote_services_closing_unit_cost_check  check (closing_unit_cost >= 0::numeric),
  constraint quote_services_color_check              check (color is null or color = any (array['לבן'::text, 'שחור'::text, 'אפור'::text, 'טורקיז'::text, 'כחול'::text]))
);

alter table quote_services enable row level security;

-- אינדקסים
create index quote_services_quote_id_idx on quote_services using btree (quote_id);
create index quote_services_sku_idx      on quote_services using btree (sku);
-- quote_services_pkey — unique btree (line_id) [נוצר ע"י האילוץ quote_services_pkey]
-- quote_services_quote_line_key — unique btree (quote_id, line_number) [נוצר ע"י האילוץ quote_services_quote_line_key]

-- טריגרים
create trigger quote_services_lock_non_in_progress
  before delete or update on quote_services
  for each row execute function enforce_quote_in_progress_lock();

create trigger quote_services_set_updated_at
  before update on quote_services
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
-- ⚠️ הודקה 27/08/2026 (מ8, ה30, מיגרציה A): הקריאה דורשת עריכה — ב'הצעות מחיר'
-- או ב'כספים'. הצורה מועתקת מ-product_costs_select_by_permission (תקדים חי).
-- הסיבה: closing_unit_cost (עלות) היה קריא לכל מחזיק צפייה ב'הצעות מחיר'.
create policy quote_services_select_by_permission on quote_services
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id in (
          select module_id from modules
          where module_name = any (array['הצעות מחיר'::text, 'כספים'::text])
        )
        and p.permission_level = 'edit'::text
    )
  );

create policy quote_services_write_by_permission on quote_services
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 15. מאגר דיילות — public.hostesses (מודול 4)
-- ============================================================
-- המפתח הראשי הוא hostess_id (identity); id_number (ת"ז) הוא מפתח עסקי ייחודי בלבד.
create table hostesses (
  id_number    text        not null,
  full_name    text        not null,
  phone        text        not null,
  email        text        not null,
  city         text        not null,
  hourly_rate  numeric     not null,
  rating       integer,
  status       text        not null default 'active',
  -- ✅ מ8 ה19 **נסגר 27/08/2026 18:0X**: שלוש עמודות-הבנק (bank_name/branch/account)
  --    **נמחקו כאן** במיגרציה C2, אחרי מיזוג מ8 ופריסתו לייצור. הן חיות עכשיו
  --    **רק** ב-hostess_bank_details (סעיף 29), שנקראת ע"י 'דיילות' ו'כספים' בלבד.
  --    🔴 מי שמחפש אותן כאן — הן אינן, וזה מכוון: RLS הוא ברמת-שורה, ולכן
  --    עמודה על hostesses הייתה קריאה לכל מי שיש לו 'דיילות'. זו הייתה החשיפה.
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  hostess_id   bigint      not null generated always as identity,
  address      text,
  lat          numeric,
  lng          numeric,
  has_car      boolean     not null default false,
  languages    text[]      not null default '{}'::text[],
  constraint hostesses_pkey          primary key (hostess_id),
  constraint hostesses_id_number_key unique (id_number),
  constraint hostesses_rating_check  check (rating >= 1 and rating <= 5),
  constraint hostesses_status_check  check (status = any (array['active'::text, 'inactive'::text]))
);

alter table hostesses enable row level security;

-- אינדקסים
-- hostesses_pkey — unique btree (hostess_id) [נוצר ע"י האילוץ hostesses_pkey]
-- hostesses_id_number_key — unique btree (id_number) [נוצר ע"י האילוץ hostesses_id_number_key]

-- טריגרים
create trigger hostesses_enforce_min_wage
  before insert or update of hourly_rate on hostesses
  for each row execute function enforce_hostess_min_wage();

create trigger hostesses_set_updated_at
  before update on hostesses
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy hostesses_select_by_permission on hostesses
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy hostesses_write_by_permission on hostesses
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 16. אי-זמינות מוצהרת של דיילת — public.hostess_unavailability (מודול 4)
-- ============================================================
create table hostess_unavailability (
  unavailability_id bigint      not null generated always as identity,
  hostess_id        bigint      not null,
  start_date        date        not null,
  end_date          date        not null,
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint hostess_unavailability_pkey            primary key (unavailability_id),
  constraint hostess_unavailability_hostess_id_fkey foreign key (hostess_id) references hostesses (hostess_id) on update cascade on delete cascade,
  constraint hostess_unavailability_range_valid     check (end_date >= start_date)
);

alter table hostess_unavailability enable row level security;

-- אינדקסים
create index hostess_unavailability_hostess_id_idx on hostess_unavailability using btree (hostess_id);
-- hostess_unavailability_pkey — unique btree (unavailability_id) [נוצר ע"י האילוץ hostess_unavailability_pkey]

-- טריגרים
create trigger hostess_unavailability_set_updated_at
  before update on hostess_unavailability
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy hostess_unavailability_select_by_permission on hostess_unavailability
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy hostess_unavailability_write_by_permission on hostess_unavailability
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 17. העדפת לקוח לגבי דיילת — public.customer_hostess_preference (מודול 4)
-- ============================================================
-- הסימון צמוד ל**צמד** (לקוח, דיילת) — שורה אחת לכל צמד.
create table customer_hostess_preference (
  preference_id     bigint      not null generated always as identity,
  customer_id       bigint      not null,
  hostess_id        bigint      not null,
  preference        text        not null,
  preference_reason text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint customer_hostess_preference_pkey             primary key (preference_id),
  constraint customer_hostess_preference_unique           unique (customer_id, hostess_id),
  constraint customer_hostess_preference_customer_id_fkey foreign key (customer_id) references customers (customer_id) on update cascade on delete cascade,
  constraint customer_hostess_preference_hostess_id_fkey  foreign key (hostess_id)  references hostesses (hostess_id)  on update cascade on delete cascade,
  constraint customer_hostess_preference_preference_check check (preference = any (array['מצוינת'::text, 'בסדר'::text, 'לא_לשלוח'::text])),
  constraint customer_hostess_preference_negative_needs_reason check (preference <> 'לא_לשלוח'::text or preference_reason is not null)
);

alter table customer_hostess_preference enable row level security;

-- אינדקסים
create index customer_hostess_preference_hostess_id_idx on customer_hostess_preference using btree (hostess_id);
-- customer_hostess_preference_pkey — unique btree (preference_id) [נוצר ע"י האילוץ customer_hostess_preference_pkey]
-- customer_hostess_preference_unique — unique btree (customer_id, hostess_id) [נוצר ע"י האילוץ customer_hostess_preference_unique]

-- טריגרים
create trigger customer_hostess_preference_set_updated_at
  before update on customer_hostess_preference
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy customer_hostess_preference_select_by_permission on customer_hostess_preference
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy customer_hostess_preference_write_by_permission on customer_hostess_preference
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 18. שיבוצי דיילות — public.assignments (מודול 4; נוכחות נוספה במודול 6)
-- ============================================================
-- 🔴 המפתח הראשי הוא (project_id, hostess_id, assignment_number). **אין כאן עמודת id_number** —
--    הקישור לדיילת הוא hostess_id bigint → hostesses(hostess_id).
-- event_date נכתב אוטומטית מהפרויקט ע"י הטריגר assignments_sync_event_date.
create table assignments (
  project_id           integer       not null,
  assignment_number    integer       not null,
  salary_report_id     integer,
  assignment_status    text          not null default 'pending',
  hourly_rate_snapshot numeric       not null,
  actual_hours         numeric       not null default 0,
  personal_bonus       numeric       not null default 0,
  reminder_sent        boolean       not null default false,
  created_at           timestamptz   not null default now(),
  updated_at           timestamptz   not null default now(),
  hostess_id           bigint        not null,
  responded_at         timestamptz,
  invite_token         text,
  invite_sent_at       timestamptz,
  travel_amount        numeric(12,2) not null default 0,
  is_shift_lead        boolean       not null default false,
  event_date           date          not null,
  attendance_status    text,
  lateness_level       text,
  no_show_reason       text,
  -- מ8 (27/08/2026): הסטטוס שקדם ל-released בביטול פרויקט; בסיס פיצוי §7.16.
  -- nullable במכוון — ביטולי-עבר נשארים NULL ואינם מניבים פיצוי (מגבלה מוצהרת).
  released_from_status text,
  constraint assignments_pkey                 primary key (project_id, hostess_id, assignment_number),
  constraint assignments_invite_token_key     unique (invite_token),
  constraint assignments_project_id_fkey      foreign key (project_id)       references projects (project_id)      on delete cascade,
  constraint assignments_hostess_id_fkey      foreign key (hostess_id)       references hostesses (hostess_id)     on update restrict on delete restrict,
  constraint assignments_salary_report_id_fkey foreign key (salary_report_id) references salary_reports (report_id) on delete restrict,
  constraint assignments_assignment_status_check check (assignment_status = any (array['pending'::text, 'confirmed_available'::text, 'declined'::text, 'finally_approved'::text, 'released'::text, 'approval_withdrawn'::text])),
  constraint assignments_attendance_status_check check (attendance_status = any (array['arrived'::text, 'late'::text, 'no_show'::text])),
  constraint assignments_lateness_level_check    check (lateness_level = any (array['light'::text, 'medium'::text, 'heavy'::text])),
  constraint assignments_no_show_reason_check    check (no_show_reason = any (array['sick'::text, 'approved_absence'::text, 'ghosted'::text])),
  -- צורת רשומת-הנוכחות: כל שילוב לגיטימי מנוי במפורש
  constraint assignments_attendance_shape check (
       (attendance_status is null      and lateness_level is null     and no_show_reason is null)
    or (attendance_status = 'arrived'::text and lateness_level is null     and no_show_reason is null)
    or (attendance_status = 'late'::text    and lateness_level is not null and no_show_reason is null)
    or (attendance_status = 'no_show'::text and lateness_level is null     and no_show_reason is not null)
  ),
  constraint assignments_no_show_zero_hours check (attendance_status is distinct from 'no_show'::text or actual_hours = 0::numeric),
  constraint assignments_released_from_status_check check (released_from_status is null or released_from_status = any (array['pending'::text, 'confirmed_available'::text, 'declined'::text, 'finally_approved'::text, 'released'::text, 'approval_withdrawn'::text]))
);

alter table assignments enable row level security;

-- אינדקסים
create index assignments_hostess_id_idx on assignments using btree (hostess_id);
-- C-1 (שורת-מ8, 27/08/2026): אינדקס מכסה ל-FK salary_report_id
create index assignments_salary_report_id_idx on assignments using btree (salary_report_id);
-- דיילת מאושרת סופית לאירוע אחד ביום
create unique index assignments_one_event_per_day on assignments using btree (hostess_id, event_date)
  where (assignment_status = 'finally_approved'::text);
-- אחראית משמרת אחת לכל פרויקט
create unique index assignments_one_shift_lead_per_project on assignments using btree (project_id)
  where is_shift_lead;
-- assignments_pkey — unique btree (project_id, hostess_id, assignment_number) [נוצר ע"י האילוץ assignments_pkey]
-- assignments_invite_token_key — unique btree (invite_token) [נוצר ע"י האילוץ assignments_invite_token_key]

-- טריגרים
create trigger assignments_sync_event_date
  before insert or update on assignments
  for each row execute function sync_assignment_event_date();

create trigger assignments_set_updated_at
  before update on assignments
  for each row execute function moddatetime('updated_at');

create trigger assignments_recompute_project_status
  after insert or delete or update on assignments
  for each row execute function trg_recompute_project_status();

-- מדיניות RLS
create policy assignments_select_by_permission on assignments
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy assignments_write_by_permission on assignments
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 19. דוחות שכר חודשיים — public.salary_reports (הורחבה למודול 8)
-- ============================================================
-- 🔴 עד 27/08/2026 הייתה deny-all מחוסר-בנייה (RLS דלוק, אפס policies) — הטבלה העסקית
--    האחרונה במצב הזה. מיגרציה B של מ8 פתחה אותה והפכה אותה ממריצה ל**מסמך**:
--    `period` (ראשון-לחודש, UNIQUE) הוא מנגנון מניעת ההפקה-הכפולה של §7.40ג/§7.68,
--    ושתי עמודות-החובה שוחררו כי הקובץ נוצר אחרי חישוב השורות (T4).
create table salary_reports (
  report_id       serial        not null,
  sent_date       date,                        -- שוחרר מ-NOT NULL במ8 (T4)
  report_file_url text,                        -- שוחרר מ-NOT NULL במ8 (T4)
  period          date          not null,      -- מ8 §7.40ג — תמיד ראשון-לחודש
  send_status     text          not null default 'pending',
  total_amount    numeric(12,2),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now(),
  constraint salary_reports_pkey primary key (report_id),
  constraint salary_reports_period_key unique (period),
  constraint salary_reports_period_first_of_month check (extract(day from period) = 1),
  constraint salary_reports_send_status_check check (send_status = any (array['pending'::text, 'sent'::text, 'failed'::text]))
);

alter table salary_reports enable row level security;

-- אינדקסים
-- salary_reports_pkey — unique btree (report_id) [נוצר ע"י האילוץ salary_reports_pkey]
-- salary_reports_period_key — unique btree (period) [נוצר ע"י האילוץ salary_reports_period_key]

-- טריגרים
create trigger salary_reports_set_updated_at
  before update on salary_reports
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS (מ8): קריאה בלבד. אין מדיניות-כתיבה — ההפקה היא טרנזקציית RPC.
create policy salary_reports_select_by_permission on salary_reports
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );


-- ============================================================
-- 28. שורות דוח השכר — public.salary_report_lines (מודול 8)
-- ============================================================
-- ה-snapshot הקפוא של מה שנחתם ונשלח לרו"ח (§7.68). שני מקורות-שורה (ה15):
-- עבודה בפועל בפרויקט שנסגר תפעולית, ופיצוי-§7.16 בפרויקט שבוטל — line_basis מפריד.
-- 🔴 אין כאן עמודות בנק במכוון (B-4): ההוכחה היא קובץ ה-xlsx בבאקט finance הפרטי;
--    שכפול פרטי-בנק לכאן היה פותח מחדש את החשיפה שמיגרציה C סוגרת.
-- 🔴 כל FK הוא RESTRICT בשני הכיוונים (T19) — אלה שורות שכר חתומות, ראיה חשבונאית;
--    ה-CASCADE של assignments→projects היה מוחק אותן יחד עם הפרויקט.
create table salary_report_lines (
  line_id           bigint        not null generated always as identity,
  report_id         integer       not null,
  hostess_id        bigint        not null,
  hostess_name      text          not null,   -- צילום-זהות ברגע החתימה
  id_number         text          not null,   -- צילום-זהות ברגע החתימה
  source_project_id integer       not null,
  line_basis        text          not null,
  hours             numeric(12,2) not null default 0,
  rate              numeric(12,2) not null,
  bonus             numeric(12,2),            -- NULL = לא-רלוונטי; המסך מציג "—" ולא 0.00
  travel            numeric(12,2),            -- NULL = לא-רלוונטי (ה29)
  line_total        numeric(12,2) not null,
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now(),
  constraint salary_report_lines_pkey primary key (line_id),
  constraint salary_report_lines_report_id_fkey         foreign key (report_id)         references salary_reports (report_id) on update restrict on delete restrict,
  constraint salary_report_lines_hostess_id_fkey        foreign key (hostess_id)        references hostesses (hostess_id)     on update restrict on delete restrict,
  constraint salary_report_lines_source_project_id_fkey foreign key (source_project_id) references projects (project_id)      on update restrict on delete restrict,
  constraint salary_report_lines_line_basis_check check (line_basis = any (array['actual'::text, 'cancellation_compensation'::text]))
);

alter table salary_report_lines enable row level security;

-- אינדקסים (מכסה לכל FK)
create index salary_report_lines_report_id_idx         on salary_report_lines using btree (report_id);
create index salary_report_lines_hostess_id_idx        on salary_report_lines using btree (hostess_id);
create index salary_report_lines_source_project_id_idx on salary_report_lines using btree (source_project_id);
-- salary_report_lines_pkey — unique btree (line_id) [נוצר ע"י האילוץ salary_report_lines_pkey]

-- טריגרים
create trigger salary_report_lines_set_updated_at
  before update on salary_report_lines
  for each row execute function extensions.moddatetime('updated_at');

-- מדיניות RLS
create policy salary_report_lines_select_by_permission on salary_report_lines
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );


-- ============================================================
-- 20. לוגיסטיקה — public.logistics (מודול 5)
-- ============================================================
-- כתיבה מתבצעת דרך פונקציות בלבד (סעיף 24 — מ-26/08 הכותב הוא `update_logistics_item`);
-- ללקוח יש policy קריאה + policy-כתיבה מגודרת edit (M5-1).
create table logistics (
  project_id            integer     not null,
  sku                   text        not null,
  serial_number         integer     not null,
  planned_qty           integer     not null,
  actual_qty            integer     not null default 0,
  item_status           text        not null default 'not_started',
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  quote_service_line_id bigint,
  project_change_id     bigint,
  color                 text,
  expected_arrival_date date,
  actual_arrival_date   date,
  actual_qty_autofilled boolean     not null default false,
  constraint logistics_pkey                     primary key (project_id, sku, serial_number),
  constraint logistics_project_id_fkey          foreign key (project_id)            references projects (project_id)            on delete cascade,
  constraint logistics_sku_fkey                 foreign key (sku)                   references products (sku)                   on update cascade on delete restrict,
  constraint logistics_quote_service_line_id_fkey foreign key (quote_service_line_id) references quote_services (line_id)        on delete restrict,
  constraint logistics_project_change_id_fkey   foreign key (project_change_id)     references project_changes (change_id)      on delete restrict,
  constraint logistics_item_status_check        check (item_status = any (array['not_started'::text, 'ordered'::text, 'ready'::text])),
  constraint logistics_planned_qty_check        check (planned_qty > 0),
  -- M5-2 — הרצפה של C6 §2.4.13
  constraint logistics_actual_qty_check         check (actual_qty >= 0),
  -- M5-5 — העתק-בייט של quote_services_color_check (⑱: הצבע נוסע עם השורה)
  constraint logistics_color_check              check (color is null or color = any (array['לבן'::text, 'שחור'::text, 'אפור'::text, 'טורקיז'::text, 'כחול'::text])),
  -- לכל היותר אחת משתי עמודות-המקור מלאה
  constraint logistics_origin_exactly_one check (
       (quote_service_line_id is null and project_change_id is null)
    or num_nonnulls(quote_service_line_id, project_change_id) = 1
  )
);

alter table logistics enable row level security;

comment on column logistics.quote_service_line_id is
  'מקור השורה: שורת ההצעה שהולידה אותה. מ-26/08/2026 (M5-3) ה-RPC של אישור-הצעה ממלא אותה, וה-backfill מילא את כל השורות הישנות החד-משמעיות.';
comment on column logistics.expected_arrival_date is
  'מתי הובטח שיגיע — היא ממלאת בהזמנה (㊶). הטריגר השני של סימון-הענבר ⑳ נשען עליו.';
comment on column logistics.actual_arrival_date is
  'מתי הגיע בפועל — נחתם ע"י update_logistics_item במעבר ל-ready, לעולם לא ידנית (M5-8).';
comment on column logistics.actual_qty_autofilled is
  'true כשהכמות-בפועל מולאה אוטומטית בסימון מוכן (㊵) — מספר שאיש לא ספר, והמסך מסמן זאת.';
comment on column logistics.project_change_id is
  'מקור השורה: שורת שינוי-התכולה שהולידה אותה. בדיוק אחת משתי עמודות-המקור מלאה, או שתיהן NULL.';

-- אינדקסים
create index logistics_sku_idx                   on logistics using btree (sku);
create index logistics_quote_service_line_id_idx on logistics using btree (quote_service_line_id);
create index logistics_project_change_id_idx     on logistics using btree (project_change_id);
-- logistics_pkey — unique btree (project_id, sku, serial_number) [נוצר ע"י האילוץ logistics_pkey]

-- טריגרים
create trigger logistics_set_updated_at
  before update on logistics
  for each row execute function moddatetime('updated_at');

create trigger logistics_recompute_project_status
  after insert or delete or update on logistics
  for each row execute function trg_recompute_project_status();

-- מדיניות RLS
create policy logistics_select_by_permission on logistics
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לוגיסטיקה')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

-- M5-1 (26/08/2026) — שער 'לוגיסטיקה', לעולם לא 'פרויקטים' (㉞)
create policy logistics_write_by_permission on logistics
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לוגיסטיקה')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לוגיסטיקה')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 21. פרויקטים — public.projects (מודול 6; המחבר המרכזי, מכונת מצבים)
-- ============================================================
-- כתיבה מתבצעת דרך פונקציות בלבד (סעיף 24); ללקוח יש policy קריאה בלבד.
-- 🔴 **אין כאן עמודת project_bonus.**
create table projects (
  project_id               serial      not null,
  quote_id                 integer     not null,
  owner_email              text        not null,
  final_event_date         date        not null,
  final_location           text        not null,
  required_hostess_count   integer     not null,
  project_status           text        not null default 'not_started',
  invoice_sent             boolean     not null default false,
  feedback_status          text        not null default 'not_sent',
  actual_guests            integer,
  actual_hours             numeric,
  cancel_reason            text,
  payment_date             date,
  feedback_score           integer,
  negative_feedback_reason text,
  feedback_notes           text,
  summary_report_url       text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  event_name               text,
  customer_id              bigint,
  final_start_time         time,
  final_end_time           time,
  lat                      numeric,
  lng                      numeric,
  customer_name            text,
  owner_name               text,
  owner_phone              text,
  -- חמש עמודות מודול 6: ביטול פרויקט וסגירה תפעולית
  cancelled_at             timestamptz,
  cancelled_by             text,
  cancel_type              text,
  operationally_closed_at  timestamptz,
  operationally_closed_by  text,
  -- שתי עמודות מודול 8 (27/08/2026): חותמת שליחת-החשבונית (ממנה נגזרים ימי-האיחור
  -- מול תנאי_תשלום_ימים) וטוקן דף-המשוב הציבורי (נטבע בשליחה, מאופס ל-NULL בארכוב).
  -- 🔴 הכסף עצמו אינו כאן — הוא בטבלת-הבת project_finance (סעיף 27, product-Q2).
  invoice_sent_at          timestamptz,
  feedback_token           text,
  constraint projects_pkey                        primary key (project_id),
  constraint projects_quote_id_key                unique (quote_id),
  constraint projects_feedback_token_key          unique (feedback_token),
  constraint projects_quote_id_fkey               foreign key (quote_id)                references quotes (quote_id)       on delete restrict,
  constraint projects_customer_id_fkey            foreign key (customer_id)             references customers (customer_id),
  constraint projects_owner_email_fkey            foreign key (owner_email)             references users (email)           on delete restrict,
  constraint projects_cancelled_by_fkey           foreign key (cancelled_by)            references users (email)           on delete restrict,
  constraint projects_operationally_closed_by_fkey foreign key (operationally_closed_by) references users (email)          on delete restrict,
  constraint projects_project_status_check        check (project_status = any (array['not_started'::text, 'in_progress'::text, 'ready'::text, 'event_finished'::text, 'awaiting_invoice'::text, 'awaiting_payment'::text, 'finished'::text, 'cancelled'::text])),
  constraint projects_required_hostess_count_check check (required_hostess_count > 0),
  constraint projects_feedback_status_check       check (feedback_status = any (array['not_sent'::text, 'sent'::text, 'completed'::text, 'no_response'::text])),
  constraint projects_feedback_score_check        check (feedback_score >= 1 and feedback_score <= 5),
  constraint projects_negative_feedback_reason_check check (negative_feedback_reason is null or negative_feedback_reason = any (array['איחור דיילות'::text, 'תפקוד דיילות'::text, 'איכות תגים'::text, 'ניהול לקוי'::text, 'אחר'::text])),
  constraint projects_cancel_type_check           check (cancel_type is null or cancel_type = any (array['customer'::text, 'force_majeure'::text, 'other'::text])),
  -- שלושת הסטטוסים שאחרי הסגירה התפעולית מחייבים דוח-סיכום
  constraint projects_closed_needs_report check (
    project_status <> all (array['awaiting_invoice'::text, 'awaiting_payment'::text, 'finished'::text])
    or summary_report_url is not null
  )
);

alter table projects enable row level security;

-- אינדקסים
create index projects_customer_id_idx             on projects using btree (customer_id);
create index projects_owner_email_idx             on projects using btree (owner_email);
create index projects_cancelled_by_idx            on projects using btree (cancelled_by);
create index projects_operationally_closed_by_idx on projects using btree (operationally_closed_by);
-- projects_pkey — unique btree (project_id) [נוצר ע"י האילוץ projects_pkey]
-- projects_quote_id_key — unique btree (quote_id) [נוצר ע"י האילוץ projects_quote_id_key]
-- projects_feedback_token_key — unique btree (feedback_token) [נוצר ע"י האילוץ projects_feedback_token_key]

-- טריגרים
create trigger projects_set_updated_at
  before update on projects
  for each row execute function moddatetime('updated_at');

create trigger projects_recompute_on_required_count
  after update of required_hostess_count on projects
  for each row when (old.required_hostess_count is distinct from new.required_hostess_count)
  execute function trg_recompute_project_status();

create trigger projects_sync_assignment_dates
  after update of final_event_date on projects
  for each row when (old.final_event_date is distinct from new.final_event_date)
  execute function sync_assignments_on_project_date_change();

-- מדיניות RLS
create policy projects_select_by_permission on projects
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );


-- ============================================================
-- 22. שינויי תכולה בפרויקט — public.project_changes (מודול 6)
-- ============================================================
-- כתיבה מתבצעת דרך הפונקציה apply_scope_change בלבד (סעיף 24); ללקוח יש policy קריאה בלבד.
-- change_group_id מקבץ שורות שנשמרו יחד בפעולה אחת.
create table project_changes (
  change_id           bigint        not null generated always as identity,
  project_id          integer       not null,
  change_group_id     uuid          not null,
  sku                 text,
  color               text,
  change_target       text          not null,
  delta_qty           integer       not null,
  unit_price_snapshot numeric(12,2) not null,
  unit_cost_snapshot  numeric(12,2) not null,
  reason              text          not null,
  performed_by        text          not null,
  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now(),
  constraint project_changes_pkey              primary key (change_id),
  constraint project_changes_project_id_fkey   foreign key (project_id)   references projects (project_id) on delete cascade,
  constraint project_changes_sku_fkey          foreign key (sku)          references products (sku)        on update cascade on delete restrict,
  constraint project_changes_performed_by_fkey foreign key (performed_by) references users (email)         on delete restrict,
  constraint project_changes_change_target_check check (change_target = any (array['logistics'::text, 'hostess_count'::text])),
  constraint project_changes_delta_qty_check   check (delta_qty <> 0),
  constraint project_changes_reason_check      check (length(btrim(reason)) > 0),
  constraint project_changes_color_check       check (color is null or color = any (array['לבן'::text, 'שחור'::text, 'אפור'::text, 'טורקיז'::text, 'כחול'::text])),
  constraint project_changes_unit_price_snapshot_check check (unit_price_snapshot >= 0::numeric),
  constraint project_changes_unit_cost_snapshot_check  check (unit_cost_snapshot >= 0::numeric),
  -- שינוי לוגיסטי מחייב sku; שינוי כמות-דיילות אוסר sku וצבע
  constraint project_changes_target_shape check (
       (change_target = 'logistics'::text     and sku is not null)
    or (change_target = 'hostess_count'::text and sku is null and color is null)
  )
);

alter table project_changes enable row level security;

-- אינדקסים
create index project_changes_project_id_idx   on project_changes using btree (project_id, created_at desc);
create index project_changes_sku_idx          on project_changes using btree (sku);
create index project_changes_performed_by_idx on project_changes using btree (performed_by);
-- project_changes_pkey — unique btree (change_id) [נוצר ע"י האילוץ project_changes_pkey]

-- טריגרים
create trigger project_changes_set_updated_at
  before update on project_changes
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
-- 🔴 אפס policies — **במכוון** (deny-all). המדיניות הרחבה `project_changes_select_by_permission`
--    הוסרה ב-`20260814152647_module6_project_changes_money_gated_reader.sql`: היא חשפה את
--    `unit_price_snapshot`/`unit_cost_snapshot` לכל מחזיקי 'פרויקטים' — בסתירה לכרטיסי-המסך
--    המאושרים (מנהלת לוגיסטיקה ומנהלת גיוס חסומות מנתונים פיננסיים). הקריאה היחידה מהדפדפן
--    היא דרך ה-RPC ‏`list_project_changes` (סעיף 24), שמחזיר את שדות-הכסף כ-NULL למי שאינו מורשה
--    ודגל `money_visible` כדי שהמסך יציג `—` במקום ריק.


-- ============================================================
-- 23. יומן שליחות מיילים — public.email_log (חוצה מודולים)
-- ============================================================
-- קריאה בלבד ללקוח, ומפוצלת לשלוש policies לפי entity_type ⇒ לפי המודול שבו הישות חיה.
create table email_log (
  email_log_id  bigint      not null generated always as identity,
  entity_type   text        not null,
  entity_id     bigint      not null,
  recipient     text        not null,
  template_name text,
  subject       text,
  status        text        not null,
  error_message text,
  sent_by_email text,
  created_at    timestamptz not null default now(),
  constraint email_log_pkey              primary key (email_log_id),
  constraint email_log_entity_type_check check (entity_type = any (array['quote'::text, 'shift'::text, 'project'::text, 'project_report'::text, 'invoice'::text, 'salary_report'::text])),
  constraint email_log_status_check      check (status = any (array['sent'::text, 'failed'::text]))
);

alter table email_log enable row level security;

comment on table email_log is
  'יומן שליחות מיילים — מקור-האמת ל"האם נשלח". גנרי לפי (entity_type, entity_id). נכתב ע"י Edge Function בלבד (service-role); הלקוח קורא ולא כותב. הוקדם ממודול 10 בהכרעת-ישי 30/07/2026.';

-- אינדקסים
create index idx_email_log_entity on email_log using btree (entity_type, entity_id, created_at desc);
-- email_log_pkey — unique btree (email_log_id) [נוצר ע"י האילוץ email_log_pkey]

-- מדיניות RLS
create policy email_log_select_quotes_module on email_log
  for select to authenticated
  using (
    entity_type = 'quote'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy email_log_select_shifts_module on email_log
  for select to authenticated
  using (
    entity_type = 'shift'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

-- מ8 (27/08/2026) — ה-policy הרביעית. ⚠️ ארבעתן PERMISSIVE, כלומר הן **מתאחדות ב-OR**:
-- מנהלת-הכספים אינה רואה *רק* את שתי השורות שלה — היא כבר רואה גם מיילי-הצעות
-- (view על 'הצעות מחיר') ומיילי-פרויקטים (view על 'פרויקטים'), דרך שתי ה-policies
-- הקיימות. נמדד 27/08/2026: 8 שורות = 6 quote + 1 project + 1 project_report.
-- ה-policy הזו רק **מוסיפה** לה את invoice/salary_report; היא אינה מצמצמת דבר.
create policy email_log_select_finance_module on email_log
  for select to authenticated
  using (
    entity_type = any (array['invoice'::text, 'salary_report'::text])
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy email_log_select_projects_module on email_log
  for select to authenticated
  using (
    entity_type = any (array['project'::text, 'project_report'::text])
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );


-- ============================================================
-- 27. כספי הפרויקט — public.project_finance (מודול 8)
-- ============================================================
-- טבלת-בת 1:1 לפרויקט. נוצרה 27/08/2026 במיגרציה
-- 20260827125155_module8_finance_tables_and_columns.
-- 🔴 למה בת ולא עמודות על projects (product-Q2): ה-policy של projects פותחת
--    את כל השורה לכל מחזיק 'פרויקטים' — רווח ודמי-ביטול אינם אמורים להיחשף כך.
-- 🔴 policy אחת בלבד, קריאה. **אין מדיניות-כתיבה במכוון** — כל כתיבה עוברת
--    ב-SECURITY DEFINER RPC שמאשר 'כספים' (§7.63/ה22). UPDATE ישיר = 0 שורות.
-- 🚧 מודול שיצטרך לקרוא מכאן (מ11/מ7/מ10) מוסיף policy מגודרת משלו — לא מרחיב
--    את של מ8 (תקדים email_log, db_roadmap A-20).
create table project_finance (
  project_id            integer     not null,
  final_profit          numeric(12,2),          -- §7.52 — רווח סופי קפוא בשקלים בארכוב
  cancellation_fee      numeric(12,2),          -- §7.20ג/ה28 — הסכום הסופי בלבד
  cancellation_fee_note text,                   -- ה28 — הערת-פירוט חופשית
  written_off           boolean     not null default false,
  written_off_reason    text,                   -- P3 — ה-RPC אוכף שאינה ריקה בחוב-אבוד
  invoice_file_url      text,                   -- B-8 — הקובץ שהועלה לבאקט finance
  archived_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint project_finance_pkey primary key (project_id),
  constraint project_finance_project_id_fkey foreign key (project_id) references projects (project_id) on update restrict on delete restrict
);

alter table project_finance enable row level security;

-- אינדקסים
-- project_finance_pkey — unique btree (project_id) [נוצר ע"י האילוץ project_finance_pkey]

-- טריגרים
create trigger project_finance_set_updated_at
  before update on project_finance
  for each row execute function extensions.moddatetime('updated_at');

-- מדיניות RLS
create policy project_finance_select_by_permission on project_finance
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

-- ============================================================
-- 29. פרטי בנק של דיילת — public.hostess_bank_details (מודול 8)
-- ============================================================
-- ה19: RLS ב-Postgres הוא ברמת-שורה ולא ברמת-עמודה ⇒ כל מחזיק 'דיילות' שראה דיילת
-- ראה גם את חשבון-הבנק שלה. הפיצול לטבלת-בת הוא התקדים החי של product_costs.
-- 🔴 קריאה: 'דיילות' עם עריכה (הטופס של מ4, ALL) + 'כספים' עם עריכה (דוח-השכר, SELECT
--    בלבד — היא לעולם לא עורכת פרטי בנק).
-- 🔴 שורה חסרה היא מצב תקין — דיילת בלי פרטי בנק. הקריאה היא LEFT JOIN, והיא מוצגת.
-- ⏸️ **הפיצול חצי-גמור בכוונה:** שלוש העמודות המקוריות עדיין קיימות על hostesses
--    (סעיף 15) כי הייצור כותב אליהן. C2 תמחק אותן אחרי הפריסה — db_roadmap §9א.
--    **עד אז חשיפת-ה19 עדיין פתוחה**, ופרטי-בנק חיים בשני מקומות.
create table hostess_bank_details (
  hostess_id   bigint      not null,
  bank_name    text        not null,
  bank_branch  text        not null,
  bank_account text        not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint hostess_bank_details_pkey primary key (hostess_id),
  constraint hostess_bank_details_hostess_id_fkey foreign key (hostess_id) references hostesses (hostess_id) on update restrict on delete cascade
);

alter table hostess_bank_details enable row level security;

-- אינדקסים
-- hostess_bank_details_pkey — unique btree (hostess_id) [נוצר ע"י האילוץ hostess_bank_details_pkey]

-- טריגרים
create trigger hostess_bank_details_set_updated_at
  before update on hostess_bank_details
  for each row execute function extensions.moddatetime('updated_at');

-- מדיניות RLS
create policy hostess_bank_details_all_hostesses_module on hostess_bank_details
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  );

create policy hostess_bank_details_select_finance_module on hostess_bank_details
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = 'edit'
    )
  );

-- ============================================================
-- 30. קצב-קריאות לדף-המשוב הציבורי — public.feedback_rpc_calls (מודול 8)
-- ============================================================
-- ⚠️ אין לטבלה הזו מפתח ראשי. RLS מופעל ואין לה אף policy — בדיוק כמו `login_rpc_calls`.
-- 🔴 הדף הציבורי `/feedback/:token` נפתח **בלי התחברות**; המונה הזה הוא
--    הדבר היחיד שמונע מניחוש-טוקנים בלולאה: 15 קריאות ל-IP לשעה.
create table feedback_rpc_calls (
  ip        inet        not null,
  called_at timestamptz not null default now()
);

comment on table feedback_rpc_calls is
  'מ8 — מונה הגבלת-קצב לדף-המשוב הציבורי (15/IP/שעה). דפוס `login_rpc_calls`. deny-all: הגישה רק דרך פונקציות DEFINER.';

alter table feedback_rpc_calls enable row level security;

-- אינדקסים
create index feedback_rpc_calls_ip_called_at_idx on feedback_rpc_calls using btree (ip, called_at);

-- מדיניות RLS: אין (0 policies)
--   → supabase/migrations/20260827155303_module8_public_feedback_rpc.sql

-- ============================================================
-- 24. פונקציות בסכמה public — 43 פונקציות
-- ============================================================
-- 🚫 **הגופים אינם כאן במכוון** (ר' כותרת הקובץ). לכל פונקציה: חתימה · מצב אבטחה · search_path ·
--    למי יש EXECUTE · ומצביע לקובץ המיגרציה שבו הגוף הנוכחי חי.
-- לכל 25 הפונקציות `search_path = ''` (שמות מלאים בגוף).
-- ⚠️ `moddatetime` (הטריגר של updated_at) **אינה כאן** — היא יושבת בסכמה `extensions`.
--
-- מקרא: SD = security definer · SI = security invoker · [רשימת התפקידים] = מי קיבל EXECUTE.

-- ── מודול 1 — הרשאות והתחברות ──────────────────────────────
-- current_user_role_id() returns integer
--   SD · stable · [authenticated, service_role]
--   → supabase/migrations/20260702195258_harden_current_user_role_id.sql
-- check_login_lock(p_email text) returns timestamptz
--   SD · sql · [anon, authenticated, service_role]
--   → supabase/migrations/20260703071534_module1_login_attempts_lockout.sql
-- register_failed_login(p_email text) returns timestamptz
--   SD · plpgsql · [anon, authenticated, service_role]
--   → supabase/migrations/20260731155511_round_g_db_hardening.sql
-- reset_login_attempts() returns void
--   SD · sql · [authenticated, service_role]
--   → supabase/migrations/20260703071534_module1_login_attempts_lockout.sql

-- ── מודול 3 — הצעות מחיר ───────────────────────────────────
-- create_quote(p_header jsonb, p_lines jsonb) returns integer
--   SI · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260731155511_round_g_db_hardening.sql
-- replace_quote_lines(p_quote_id integer, p_header jsonb, p_lines jsonb) returns void
--   SI · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260731155511_round_g_db_hardening.sql
-- approve_quote_and_create_project(p_quote_id integer) returns integer
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260826002446_module5_approve_rpc_origin_backfill.sql
-- enforce_quote_in_progress_lock() returns trigger
--   SD · plpgsql · [service_role]
--   → supabase/migrations/20260723115000_module3_lock_and_conversion_rpc.sql

-- ── מודול 4 — דיילות ומשמרות ───────────────────────────────
-- enforce_hostess_min_wage() returns trigger
--   SD · plpgsql · [service_role]
--   → supabase/migrations/20260809134237_module4_rls_and_public_rpc.sql
-- sync_assignment_event_date() returns trigger
--   SD · plpgsql · [service_role]
--   → supabase/migrations/20260809124327_module4_one_event_per_day_constraint.sql
-- sync_assignments_on_project_date_change() returns trigger
--   SD · plpgsql · [service_role]
--   → supabase/migrations/20260809124327_module4_one_event_per_day_constraint.sql
-- get_shift_invite(p_token text) returns jsonb
--   SD · plpgsql · [anon, authenticated, service_role]
--   → supabase/migrations/20260810004500_module4_public_shift_invite_read.sql
-- respond_to_shift_invite(p_token text, p_response text) returns jsonb
--   SD · plpgsql · [anon, authenticated, service_role]
--   → supabase/migrations/20260809134237_module4_rls_and_public_rpc.sql
-- set_project_coordinates(p_project_id integer, p_lat numeric, p_lng numeric) returns boolean
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260809172638_module4_project_coordinates_rpc.sql

-- ── מודול 6 — פרויקטים ─────────────────────────────────────
-- assert_module_permission(p_module text, p_level text[]) returns void
--   SD · plpgsql · [service_role]
--   → supabase/migrations/20260814142440_module6_rpcs_writes.sql
-- recompute_project_status(p_project_id integer) returns void
--   SD · plpgsql · [service_role]
--   → supabase/migrations/20260814141052_module6_status_machine_and_cron.sql
-- trg_recompute_project_status() returns trigger
--   SD · plpgsql · [service_role]
--   → supabase/migrations/20260814141052_module6_status_machine_and_cron.sql
-- list_projects_overview() returns table (project_id integer, event_name text, customer_name text,
--   final_event_date date, final_start_time time, final_end_time time, final_location text,
--   project_status text, required_hostess_count integer, hostesses_confirmed integer,
--   pending_invites integer, assignments_row_count integer, logistics_ready integer,
--   logistics_total integer, cancelled_at timestamptz, cancel_type text, planned_revenue numeric)
--   SD · stable · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260827144459_module8_finance_money_ssot_and_readers.sql
--     ⚠️ **הגוף הנוכחי הוא של מ8, לא של מ6.** מ8 הרחיב את `planned_revenue` כך שיכלול
--     גם Σ שינויי-תכולה (ה2/F16) — אחרת אותו פרויקט מוצג בשני סכומים במ6 ובמ8.
--     המקור המקורי: `20260814142439_module6_rpcs_reads_and_close.sql`.
-- update_project_details(p_project_id integer, p_event_date date, p_location text,
--   p_start_time time, p_end_time time) returns jsonb
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260814142440_module6_rpcs_writes.sql
-- apply_scope_change(p_project_id integer, p_lines jsonb, p_reason text) returns jsonb
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260826002448_module5_scope_change_reset_removal.sql
-- cancel_project(p_project_id integer, p_cancel_type text, p_cancel_reason text) returns jsonb
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260814142440_module6_rpcs_writes.sql
-- close_project_operationally(p_project_id integer, p_actual_hours numeric, p_actual_guests integer,
--   p_report_path text, p_rows jsonb) returns jsonb
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260814142439_module6_rpcs_reads_and_close.sql
-- mark_feedback_survey_sent(p_project_id integer) returns boolean
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260814142439_module6_rpcs_reads_and_close.sql
-- list_project_changes(p_project_id integer) returns table (change_id bigint, change_group_id uuid,
--   change_target text, sku text, color text, delta_qty integer, unit_price_snapshot numeric,
--   unit_cost_snapshot numeric, revenue_delta numeric, money_visible boolean, reason text,
--   performed_by text, created_at timestamptz)
--   SD · stable · plpgsql · [authenticated, service_role] — שדות-הכסף ממוסכים בגוף לפי הרשאת 'הצעות מחיר'
--   → supabase/migrations/20260814152647_module6_project_changes_money_gated_reader.sql

-- ── מודול 5 — לוגיסטיקה ────────────────────────────────────
-- update_logistics_item(p_project_id integer, p_sku text, p_serial_number integer, p_changes jsonb)
--   returns jsonb — {row, project_status}; מפתח-נוכח: item_status · actual_qty · notes ·
--   expected_arrival_date; שער פנימי edit על 'לוגיסטיקה' (㉞); שומר-סטטוס עם חריג ㊴;
--   מילוי-אוטומטי ㉕/㊵ + חתימת actual_arrival_date במעבר ל-ready (㊶)
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260826002447_module5_checklist_rpc.sql


-- ── מודול 8 (27/08/2026) ──────────────────────────────────────────────────────
-- finance_project_money(p_project_id integer) returns table (revenue numeric,
--   goods_cost numeric, labor_cost numeric, travel_cost numeric, gross_profit numeric,
--   budget_deviation numeric, planned_hours numeric, paid_shift_count integer,
--   finally_approved_count integer)
--   SD · stable · plpgsql · [service_role]   ← 🔴 **פנימית: אין anon ואין authenticated**
--   🔑 **מקור-האמת היחיד של הכסף.** כל מסך של מ8 עובר דרכה, ולכן אי-אפשר ששני מסכים
--      יראו שני רווחים שונים לאותו פרויקט (F16/R1-4). אומתה מול עוגן-היד: #13 ⇒ 3,650.00.
--   → supabase/migrations/20260827144459_module8_finance_money_ssot_and_readers.sql
-- get_finance_overview() returns table (22 columns — S1's three tabs)
--   SD · stable · plpgsql · [authenticated, service_role] · gated 'כספים'
--   → supabase/migrations/20260827144459_module8_finance_money_ssot_and_readers.sql
-- get_project_finance_detail(p_project_id integer) returns table (30 columns — S2's balance)
--   SD · stable · plpgsql · [authenticated, service_role] · gated 'כספים'
--   → supabase/migrations/20260827144459_module8_finance_money_ssot_and_readers.sql

-- ── מודול 8 · פעולות-הכתיבה (27/08/2026, E2) ────────────────────────
-- 🔴 `set_project_finance_fields` של מ6 **הוסרה** כאן (ה22, אפס אתרי-קריאה).
-- פנימיות — [service_role] בלבד, בלי anon ובלי authenticated:
-- finance_assert_writable(integer) returns text             SD · plpgsql
--   השער המשותף: 'כספים' edit + שער-הסטטוס ה12 + נעילת-`finished` (דפוס ㊙, לא טריגר)
-- finance_freeze_cancelled_profit(integer) returns numeric   SD · plpgsql
--   Q-3: דמי-ביטול − פיצוי-צוות − סחורה **בעלות**. ויתור ⇒ הפסד רשום אמיתי.
-- נקראות מהלקוח — [authenticated, service_role], כולן מגודרות 'כספים':
-- finance_cancellation_fee_proposal(integer) returns table (8 cols)   SD · stable
--   שלושת הרכיבים, **נגזרים ולא נשמרים** (ה28). אומתה: #14 ⇒ 3,508.00 = עוגן-היד.
-- record_invoice_sent(integer, text) returns jsonb           SD · plpgsql
-- record_payment(integer, date) returns jsonb                SD · plpgsql
--   🔴 אצל מבוטל — **זהו רגע הקפאת-הרווח** (Q-4), לא שמירת-הסכום ולא הארכוב.
-- record_feedback(integer, integer, text, text, boolean) returns jsonb   SD · plpgsql
--   ציון <3 מחייב סיבה; כתיבה על שורה `completed` מותרת עד הארכוב (B-15).
-- record_write_off(integer, text) returns jsonb              SD · plpgsql   ← הפעולה החמישית (B-13)
-- resolve_cancellation_fee(integer, text, numeric, text) returns jsonb   SD · plpgsql
--   bill / waive / write_off. הסטטוס נשאר `cancelled` תמיד (T1).
-- archive_project(integer) returns jsonb                     SD · plpgsql
--   שער כפול → הקפאה → `finished` → `feedback_token = NULL` (B-6) → חותמת. טרנזקציה אחת.
--   🔴 אוכפת `summary_report_url IS NOT NULL` **בעצמה** — האילוץ החי דורש זאת,
--      ובלי האכיפה ארכוב לגיטימי היה נופל על שגיאת-CHECK גולמית (תיקון T1).
--   → כל התשע: supabase/migrations/20260827150049_module8_finance_write_actions.sql

-- ── מודול 8 · דוח-השכר (27/08/2026, E3) ────────────────────────
-- generate_salary_report(date) returns jsonb                 SD · plpgsql · [authenticated]
--   🔑 מנגנון מניעת התשלום-הכפול הוא **החתימה על השורה** (`salary_report_id`),
--      לא בדיקה — ולכן פרויקט שנסגר באיחור עולה מעצמו לדוח הבא (ה15).
--      שני מקורות: עבודה-בפועל + פיצוי-ביטול. נאספות `finally_approved` בלבד (Q-5).
--      פרטי-בנק **מוחזרים לאקסל ואינם נשמרים** (B-4).
--   → supabase/migrations/20260827152840_module8_salary_report_transaction.sql
--     ⚠️ **הגוף הנוכחי מ-**`20260827153725_module8_salary_report_temp_table_fix.sql`
--     (טבלה זמנית שלא נמחקה בין קריאות באותה טרנזקציה — שורה אחת)
-- finalize_salary_report(integer, text, text) returns jsonb  SD · plpgsql · [authenticated]
--   הדוח נשמר גם כשהמייל נכשל (P4) — "נכשל" הוא מצב מוצג עם שליחה-חוזרת.
--   → supabase/migrations/20260827152840_module8_salary_report_transaction.sql

-- ── מודול 8 · הדף הציבורי (27/08/2026, F) ───────────────────────
-- feedback_rate_limit() returns void                        SD · plpgsql · [service_role]
--   15/IP/שעה, דפוס login_rpc_calls. fail-open כשאין כותרת-פרוקסי תקינה (מכוון).
-- mint_feedback_token(integer) returns text                  SD · plpgsql · [authenticated]
--   מגודרת 'פרויקטים' — הקורא הוא מסלול-המייל של מ6. get-or-create; מסרבת רק ל-finished.
-- get_feedback_page(text) returns jsonb                      SD · plpgsql · [anon, authenticated]
-- submit_feedback(text, integer, text) returns jsonb         SD · plpgsql · [anon, authenticated]
--   🔴 שתי הפונקציות היחידות של מ8 שאנונימי קורא להן. תשובת not_found **זהה
--      בייט-בבייט** לטוקן שגוי/ריק/מת — אומת. אין policy ל-anon על אף טבלה.
--   → supabase/migrations/20260827155303_module8_public_feedback_rpc.sql
--   ⚠️ ובאותה מיגרציה: `archive_project` קיבלה שער נוסף — ציון <3 בלי סיבה חוסם
--      ארכוב (P2). הגוף הנוכחי שלה משם, לא מ-E2.

-- ── מודול 8 · G (27/08/2026) — נגיעה בפונקציה ממוזגת של מ6 ────────
-- cancel_project(integer, text, text) — **הגוף הנוכחי מ-G, לא מ-מ6.**
--   הדלתא מול הגוף שקדם לה: **שורה אחת** ב-`set` של שחרור-השיבוצים —
--   `released_from_status = a.assignment_status`. בלעדיה נמחק מי הייתה
--   מאושרת-סופית, ופיצוי-§7.16 אינו בר-חישוב (R4-F2).
--   🔑 הוכח אריתמטית: הסרת השורה מהגוף החדש מחזירה md5 זהה לגוף שלפני
--      (`b21ef3d8e53270dce52dcd3134f8b103`, 4,457 תווים).
--   → supabase/migrations/20260827160357_module8_cancel_project_released_status_and_seeds.sql
--     המקור המקורי: 20260814142440_module6_rpcs_writes.sql

-- ============================================================
-- 25. עבודות מתוזמנות — cron.job (3 עבודות, כולן active)
-- ============================================================
-- הגוף המלא של כל עבודה חי במיגרציה, כמו גופי הפונקציות.
--
-- module3-quote-expiry           · '0 1 * * *'  · פוסלת הצעות in_progress שעברו את ימי-התוקף
--   → supabase/migrations/20260731085335_module3_vat_and_expiry_param_guards.sql
-- module1-login-attempts-cleanup · '30 1 * * *' · מוחקת רשומות login_attempts ישנות מ-30 יום
--   → supabase/migrations/20260723120500_module3_pg_cron_expiry_and_cleanup.sql
-- module6-event-finished         · '0 2 * * *'  · מעבירה פרויקטים שתאריכם עבר ל-event_finished
--   → supabase/migrations/20260814141052_module6_status_machine_and_cron.sql


-- ============================================================
-- 26. אחסון — storage.buckets (3 דליים) ו-storage.objects (12 policies)
-- ============================================================
-- דלי       · public · תקרת-גודל  · סוגי-קובץ מותרים
-- marketing · true   · 10485760 B · application/pdf, image/jpeg, image/png
-- finance   · false  · 10485760 B · application/pdf, image/jpeg, image/png
-- reports   · false  ·  2097152 B · application/pdf, image/jpeg, image/png

-- 12 policies על storage.objects — ארבע לכל דלי (select/insert/update/delete), כולן
-- to authenticated, וכולן מסננות לפי bucket_id + מטריצת ההרשאות של המודול הבעלים.

-- ── marketing (מודול 'לקוחות') ──────────────────────────────
create policy marketing_read_by_permission on storage.objects
  for select to authenticated
  using (
    bucket_id = 'marketing'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy marketing_insert_by_permission on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'marketing'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  );

create policy marketing_update_by_permission on storage.objects
  for update to authenticated
  using (
    bucket_id = 'marketing'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    bucket_id = 'marketing'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  );

create policy marketing_delete_by_permission on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'marketing'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  );

-- ── finance (מודול 'כספים') ─────────────────────────────────
create policy finance_read_by_permission on storage.objects
  for select to authenticated
  using (
    bucket_id = 'finance'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy finance_insert_by_permission on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'finance'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = 'edit'
    )
  );

create policy finance_update_by_permission on storage.objects
  for update to authenticated
  using (
    bucket_id = 'finance'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = 'edit'
    )
  )
  with check (
    bucket_id = 'finance'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = 'edit'
    )
  );

create policy finance_delete_by_permission on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'finance'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = 'edit'
    )
  );

-- ── reports (מודול 'פרויקטים') ──────────────────────────────
create policy reports_read_by_permission on storage.objects
  for select to authenticated
  using (
    bucket_id = 'reports'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy reports_insert_by_permission on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'reports'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
        and p.permission_level = 'edit'
    )
  );

create policy reports_update_by_permission on storage.objects
  for update to authenticated
  using (
    bucket_id = 'reports'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
        and p.permission_level = 'edit'
    )
  )
  with check (
    bucket_id = 'reports'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
        and p.permission_level = 'edit'
    )
  );

create policy reports_delete_by_permission on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'reports'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
        and p.permission_level = 'edit'
    )
  );
