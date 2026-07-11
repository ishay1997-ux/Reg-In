-- =====================================================================================
-- מודול 2 — ריבוי אנשי-קשר ללקוח: טבלת-ילד customer_contacts (אנשי-קשר *נוספים*)
-- =====================================================================================
-- why (הכרעת ישי 11/07/2026 — מודל אופציה C, היברידי): איש-הקשר הראשי נשאר inline על customers
-- (contact_name/phone/email — נאמן לאפיון הקפוא C6 §2.4.1, אפס backfill, וצרכני-מ3 העתידיים
-- [בוחר-הלקוח של מודול 3 + תבנית-ה-PDF] אינם נשברים). אנשי-קשר *נוספים* חיים כאן, כשורות-ילד.
-- זו הרחבה מעבר לאפיון הקפוא (שמצייר איש-קשר יחיד) — **סטייה מתועדת** בתיעוד-חי
-- (micro_guides/module-2.md §9 + PROJECT_MASTER §7), לא עריכת-אפיון. RLS = אותה תבנית §7.21 של
-- customers (הרשאת מודול 'לקוחות'), כי אנשי-הקשר הם חלק בלתי-נפרד מרשומת-הלקוח.
-- ⚠️ שער typed-echo (פרוטוקול-DB): פרויקט Supabase משותף — להחיל רק אחרי אישור-הקלדת-שם-המיגרציה.
-- ⚠️ moddatetime יושב ב-schema `extensions` (מאז 20260710164420) — הטריגר קורא לו מפורשות משם.

create table customer_contacts (
  contact_id  bigint generated always as identity primary key,
  -- on delete cascade: לקוחות לעולם לא נמחקים קשיח (soft-delete בלבד) — אך אם ימחקו, אנשי-הקשר לא
  -- יישארו יתומים. on update cascade: ה-PK הוא surrogate identity שלא זז, אך מפורש לפי §7.64.
  customer_id bigint not null references customers(customer_id) on delete cascade on update cascade,
  contact_name text not null,   -- שם = חובה (איש-קשר בלי שם חסר-משמעות)
  phone text,                   -- טלפון/אימייל אופציונליים לאיש-קשר *נוסף* (בניגוד לראשי-החובה על customers)
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()   -- §7.73 + טריגר moddatetime
);

-- אינדקס-כיסוי ל-FK (צ'קליסט db_roadmap §1, Lane C-1) — כל שליפות אנשי-הקשר הן by customer_id.
create index customer_contacts_customer_id_idx on customer_contacts (customer_id);

-- §7.73: moddatetime (התוסף כבר קיים ב-schema `extensions` מהמיגרציה 20260710164420).
create trigger customer_contacts_set_updated_at
  before update on customer_contacts
  for each row execute function extensions.moddatetime (updated_at);

-- RLS §7.21 (תבנית מילולית, זהה ל-customers — אנשי-הקשר הם חלק מרשומת-הלקוח, אותה הרשאת-מודול).
alter table customer_contacts enable row level security;

create policy "customer_contacts_select_by_permission" on customer_contacts for select to authenticated
  using (exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level in ('edit', 'view')
  ));

create policy "customer_contacts_write_by_permission" on customer_contacts for all to authenticated
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
