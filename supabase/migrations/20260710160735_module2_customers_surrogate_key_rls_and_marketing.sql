-- =====================================================================================
-- מודול 2 — יסוד ה-DB: מפתח-surrogate ל-customers + חבילת-nod של Phase 1 + RLS + bucket שיווק
-- =====================================================================================
-- why (§7.64, הכרעת ישי 10/07/2026): ח"פ הוא מפתח חיצוני שיכול לזוז (תיקון-הקלדה נחסם-FK) ולהתנגש
-- (שתי יחידות של אותו גוף ממשלתי = אותו ח"פ). PK חייב להיות קבוע-ופנימי — לכן מספר-רץ surrogate כ-PK
-- וח"פ יורד לעמודה עסקית `company_number` (unique not null). זו **סטייה מ-C6 §2.4.1 הקפוא** (שמצייר
-- ח"פ כ-PK) — מותרת, נרשמת בתיעוד-חי (micro_guides/module-2.md §9); C6/C5 דורשים רק ייחודיות, שנשמרת.
-- ⚠️ שער typed-echo (פרוטוקול-DB): להחיל רק אחרי בדיקת-אפס-שורות חיה על customers ו-quotes (צעד 1.2).
-- ⚠️ SECTION 3 (storage.objects policies): בפרויקטים מסוימים schema `storage` בבעלות supabase_storage_admin
--    ו-`create policy on storage.objects` נכשל 42501 — במקרה כזה ליצור את 4 ה-policies דרך
--    Dashboard→Storage→Policies ולהעיר-מחוץ את הבלוק כאן (לתעד ↳ as-built ב-§9).

-- ===== SECTION 1 — §7.64 customers surrogate PK (סטייה מתועדת מ-C6 §2.4.1) =====
alter table quotes drop constraint quotes_customer_id_fkey;
alter table customers drop constraint customers_pkey;            -- default: customers_pkey (לאמת חי)
alter table customers rename column customer_id to company_number;
alter table customers alter column company_number set not null;  -- ח"פ = חובה (§7.11)
alter table customers add constraint customers_company_number_key unique (company_number);
alter table customers add column customer_id bigint generated always as identity primary key;
alter table quotes alter column customer_id type bigint using customer_id::bigint;  -- טבלה ריקה
alter table quotes add constraint quotes_customer_id_fkey
  foreign key (customer_id) references customers(customer_id) on delete restrict;

-- ===== SECTION 2 — nod-bundle (§7.40א · §7.48 · §7.62 · §7.73), הוכרעה 10/07 =====
-- why §7.40(א): role_name/module_name משמשים כמחרוזות בכל ה-RLS — UNIQUE מונע כפילות-שקטה ששוברת אבטחה.
alter table roles   add constraint roles_role_name_key     unique (role_name);
alter table modules add constraint modules_module_name_key unique (module_name);

-- why §7.48: קידוד enable-RLS (idempotent) ל-10 הטבלאות שנותרו (customers כבר פעיל; deny-all מכוון עד policies).
alter table products       enable row level security;
alter table price_tiers    enable row level security;
alter table params         enable row level security;
alter table quotes         enable row level security;
alter table quote_services enable row level security;
alter table projects       enable row level security;
alter table hostesses      enable row level security;
alter table salary_reports enable row level security;
alter table assignments    enable row level security;
alter table logistics      enable row level security;

-- why §7.62: כל שרשרת ה-RLS נשענת על current_user_role_id() (משתמש בלי תפקיד = NULL = מסכים ריקים). 0 NULLs חי 10/07 ✓.
alter table users alter column role_id set not null;

-- why §7.73: created_at/updated_at + moddatetime לכל 11 הטבלאות העסקיות (עקביות + עוגן-תוקף עתידי).
create extension if not exists moddatetime;

alter table customers       add column created_at timestamptz not null default now();
alter table customers       add column updated_at timestamptz not null default now();
create trigger customers_set_updated_at       before update on customers       for each row execute function moddatetime(updated_at);
alter table products        add column created_at timestamptz not null default now();
alter table products        add column updated_at timestamptz not null default now();
create trigger products_set_updated_at        before update on products        for each row execute function moddatetime(updated_at);
alter table price_tiers     add column created_at timestamptz not null default now();
alter table price_tiers     add column updated_at timestamptz not null default now();
create trigger price_tiers_set_updated_at     before update on price_tiers     for each row execute function moddatetime(updated_at);
alter table params          add column created_at timestamptz not null default now();
alter table params          add column updated_at timestamptz not null default now();
create trigger params_set_updated_at          before update on params          for each row execute function moddatetime(updated_at);
alter table quotes          add column created_at timestamptz not null default now();
alter table quotes          add column updated_at timestamptz not null default now();
create trigger quotes_set_updated_at          before update on quotes          for each row execute function moddatetime(updated_at);
alter table quote_services  add column created_at timestamptz not null default now();
alter table quote_services  add column updated_at timestamptz not null default now();
create trigger quote_services_set_updated_at  before update on quote_services  for each row execute function moddatetime(updated_at);
alter table projects        add column created_at timestamptz not null default now();
alter table projects        add column updated_at timestamptz not null default now();
create trigger projects_set_updated_at        before update on projects        for each row execute function moddatetime(updated_at);
alter table hostesses       add column created_at timestamptz not null default now();
alter table hostesses       add column updated_at timestamptz not null default now();
create trigger hostesses_set_updated_at       before update on hostesses       for each row execute function moddatetime(updated_at);
alter table salary_reports  add column created_at timestamptz not null default now();
alter table salary_reports  add column updated_at timestamptz not null default now();
create trigger salary_reports_set_updated_at  before update on salary_reports  for each row execute function moddatetime(updated_at);
alter table assignments     add column created_at timestamptz not null default now();
alter table assignments     add column updated_at timestamptz not null default now();
create trigger assignments_set_updated_at     before update on assignments     for each row execute function moddatetime(updated_at);
alter table logistics       add column created_at timestamptz not null default now();
alter table logistics       add column updated_at timestamptz not null default now();
create trigger logistics_set_updated_at       before update on logistics       for each row execute function moddatetime(updated_at);

-- ===== SECTION 3 — customers RLS (§7.21, תבנית מילולית) + constraints הגנה-לעומק + bucket שיווק =====
-- why: מודול 2 — ה-policies העסקיות הראשונות בפרויקט לפי תבנית §7.21 (הרשאה לפי מטריצה בלבד, בלי בעלות-רשומה).
-- ה-RLS על customers פעיל בפרויקט החי מאז מודול 1 אך לא קודד — כאן מקודד לראשונה (idempotent).
alter table customers enable row level security;  -- idempotent

create policy "customers_select_by_permission" on customers for select to authenticated
  using (exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level in ('edit', 'view')
  ));

create policy "customers_write_by_permission" on customers for all to authenticated
  using (exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'
  ))
  with check (exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'
  ));

-- why: הגנה-לעומק מתחת לולידציית ה-UI — ח"פ (`company_number`) = בדיוק 9 ספרות; אחוז הנחה 0–100.
alter table customers add constraint customers_company_number_9_digits check (company_number ~ '^[0-9]{9}$');
alter table customers add constraint customers_discount_range check (discount_percent >= 0 and discount_percent <= 100);

-- why: אזור השיווק (מסך 5.6.3) — bucket ציבורי (הכרעת ישי 06/07: קישור קבוע, לא Signed URL).
-- שורת ה-INSERT ל-storage.buckets = Seed-תצורה חד-פעמי (מקביל לחריג roles/modules/params), לא דאטה עסקי.
insert into storage.buckets (id, name, public) values ('marketing', 'marketing', true)
  on conflict (id) do nothing;

create policy "marketing_read_by_permission" on storage.objects for select to authenticated
  using (bucket_id = 'marketing' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level in ('edit', 'view')
  ));

create policy "marketing_insert_by_permission" on storage.objects for insert to authenticated
  with check (bucket_id = 'marketing' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'
  ));

create policy "marketing_update_by_permission" on storage.objects for update to authenticated
  using (bucket_id = 'marketing' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'
  ))
  with check (bucket_id = 'marketing' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'
  ));

create policy "marketing_delete_by_permission" on storage.objects for delete to authenticated
  using (bucket_id = 'marketing' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'
  ));
