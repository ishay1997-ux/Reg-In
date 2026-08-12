-- =====================================================================================
-- מודול 4 (דיילות) — מיגרציה A: מפתח-surrogate ל-hostesses + עמודות המודול + snapshot שם-לקוח
-- =====================================================================================
-- why (§7.64, הכרעת-ישי 31/07/2026): ת"ז היא PII, והמפתח המורכב הישן של `assignments`
--   (`project_id, id_number, assignment_number`) שכפל אותה לכל שורת-שיבוץ במערכת. בנוסף,
--   תיקון ספרת-ביקורת אחרי שכבר יש שיבוצים היה נחסם-FK. ⇒ `hostess_id bigint identity` הופך
--   ל-PK, ו-`id_number` יורדת לעמודה עסקית `unique not null`.
--   ‏`docs/specs/module_04_hostesses/spec.md §1.3`: "בכל מקום שכתוב `id_number` בהקשר של
--   מפתח/צירוף/אילוץ/אינדקס — קרא `hostess_id`". **שתי הטבלאות ריקות (נמדד חי 09/08/2026,
--   0 שורות בשתיהן) ⇒ אין מיגרציית-נתונים.**
--
-- why (§12⑱(ב), הכרעת-ישי 08/08/2026): `hostesses.rating` היה `int not null default 3` —
--   כלומר **כל דיילת נולדה עם שלושה כוכבים שאיש לא נתן לה**, ולא היה ערך שמשמעותו "טרם
--   התרשמתי". ⇒ `null` מותר, ה-CHECK 1–5 נשאר, **וברירת-המחדל 3 מבוטלת** — בלעדיה הדיילת
--   עדיין נולדת מדורגת וכל התיקון חסר-ערך.
--
-- why (§7.65, הכרעת-ישי 31/07/2026): **אין UNIQUE על `hostesses.email`.** אזהרת-הכפילות היא
--   רכה ובטופס בלבד. (הפריט נקרא בשלמותו — `PROJECT_MASTER_sec7.md:207` נשמע פתוח ו-`:208` סוגר.)
--
-- why (local-1, הכרעת-ישי 08/08/2026): `email`/`city`/`bank_*` **נשארות `not null`** — הטופס
--   יסמן חמישה שדות-חובה. סטייה מודעת ממוקאפים 06/07, נרשמה במדריך-המיקרו.
--
-- why (local-5, עוגן §7.76): `projects` נושאת `customer_id` בלבד, ו**מנהלת הגיוס חסומה על
--   מודול 'לקוחות'** (נמדד חי 09/08/2026) ⇒ policy-הקריאה של `customers` לא תיתן לה כלום,
--   ושלושה מסכים מאושרים שמדפיסים את שם-הלקוח היו מקבלים **null בשקט, בלי שגיאה**.
--   ⇒ עמודת-snapshot `customer_name`, בדיוק הדפוס ש-`event_name` כבר משתמש בו.
--   🔴 **ולכן `approve_quote_and_create_project` נכתבת מחדש כאן** — היא הכותב היחיד של
--   `projects`, ובלי העדכון כל פרויקט חדש היה נולד עם snapshot ריק: בדיוק התקלה השקטה
--   שהעמודה באה למנוע. תיקון קדימה (P15) — המיגרציה המקורית לא נערכת.
--
-- why (הנחה 8 במדריך-המיקרו, §7.29 כתקדים): "אחראית משמרת" נאכפת **במסד** —
--   `unique index on (project_id) where is_shift_lead` — ולא בקוד המסך.
--
-- why (C-1): `assignments.hostess_id` הוא אחד משמונת ה-FK חסרי-האינדקס. האינדקס הולך על
--   העמודה החדשה, לא על הישנה.
--
-- reversibility: הפיכה במלואה **כל עוד שתי הטבלאות ריקות** — ובלבד שמחזירים את הסדר ההפוך
--   (הפלת ה-PK החדש → החזרת `id_number` ל-`assignments` → החזרת ה-PK הישן). העמודות החדשות
--   ניתנות ל-`drop column`; `projects.customer_name` ניתנת להפלה; ה-RPC ניתנת לשחזור לגרסת
--   `20260731085335` מילה-במילה. 🔴 **אחרי שייכנסו שורות אמיתיות — הפיכות הופכת למיגרציית-נתונים.**

-- ===== SECTION 1 — hostesses: המפתח =====
-- הסדר מחייב: קודם מפרקים את התלות ב-assignments, אחר-כך את ה-PK עצמו.
alter table public.assignments drop constraint assignments_id_number_fkey;
alter table public.assignments drop constraint assignments_pkey;
alter table public.hostesses   drop constraint hostesses_pkey;

alter table public.hostesses add column hostess_id bigint generated always as identity primary key;
-- ת"ז נשארת חובה וייחודית — היא עדיין המזהה העסקי, רק לא המפתח.
alter table public.hostesses add constraint hostesses_id_number_key unique (id_number);

-- ===== SECTION 2 — hostesses: rating + עמודות המודול =====
-- ה-CHECK הקיים (`rating >= 1 and rating <= 5`) נשאר כפי שהוא: NULL מחזיר NULL ⇒ עובר.
alter table public.hostesses alter column rating drop default;
alter table public.hostesses alter column rating drop not null;

alter table public.hostesses add column address   text;
alter table public.hostesses add column lat       numeric;
alter table public.hostesses add column lng       numeric;
alter table public.hostesses add column has_car   boolean not null default false;
alter table public.hostesses add column languages text[]  not null default '{}';

-- ===== SECTION 3 — assignments: המפתח החדש =====
-- הטבלה ריקה (נמדד) ⇒ מותר להוסיף עמודה `not null` בלי default ולהפיל את ת"ז לגמרי.
alter table public.assignments drop column id_number;
alter table public.assignments add  column hostess_id bigint not null;

alter table public.assignments add constraint assignments_pkey
  primary key (project_id, hostess_id, assignment_number);
-- ON DELETE restrict: אין מחיקת דיילות בשום מקום (`spec.md §2.1` — "אין מחיקה בשום מקום",
-- השבתה היא תג-סטטוס). ON UPDATE restrict: מפתח-identity אינו זז לעולם, וזו הצהרה מפורשת
-- ולא ברירת-מחדל שקטה (צ'קליסט `db_roadmap §1`).
alter table public.assignments add constraint assignments_hostess_id_fkey
  foreign key (hostess_id) references public.hostesses(hostess_id)
  on delete restrict on update restrict;

-- ===== SECTION 4 — assignments: עמודות המודול + ששת הסטטוסים =====
-- `responded_at` — 🔴 נכתבת **פעם אחת בלבד, במענה הראשון** (`spec.md §12⑨`). "שלח שוב" מאפס
-- את `invite_sent_at` **בלי לגעת בה**, אחרת נוצר זמן-תגובה שלילי. אסור לגזור מ-`updated_at`:
-- מודול 8 יכתוב `salary_report_id` חודשים אחרי המענה ויזייף כל זמני-התגובה בהיסטוריה.
alter table public.assignments add column responded_at   timestamptz;
alter table public.assignments add column invite_token   text unique;
alter table public.assignments add column invite_sent_at timestamptz;
alter table public.assignments add column travel_amount  numeric(12,2) not null default 0;
alter table public.assignments add column is_shift_lead  boolean not null default false;
-- `event_date` מדונרמלת מ-`projects.final_event_date` — ‏`UNIQUE` אינו יכול לצרף טבלאות,
-- וההכרעה "אילוץ במסד ולא בדיקה בקוד" אוסרת על הפתרון הקל. הטריגר שמסנכרן אותה = מיגרציה B.
alter table public.assignments add column event_date     date;

-- ששת הסטטוסים של `spec.md §1.1` — סגורים, ואסור להוסיף שביעי.
-- "פג תוקף" **נגזר בזמן תצוגה** (`pending` + 48 שעות מ-`invite_sent_at`) ואינו ערך כאן.
alter table public.assignments drop constraint assignments_assignment_status_check;
alter table public.assignments add  constraint assignments_assignment_status_check
  check (assignment_status = any (array[
    'pending'::text,             -- ממתינה למענה
    'confirmed_available'::text, -- אישרה זמינות
    'declined'::text,            -- סירבה
    'finally_approved'::text,    -- אושרה סופית
    'released'::text,            -- שוחררה
    'approval_withdrawn'::text   -- ביטלה אחרי אישור
  ]));

-- "אחראית משמרת" — אחת לכל אירוע, נאכף במסד (הנחה 8; תקדים §7.29).
create unique index assignments_one_shift_lead_per_project
  on public.assignments (project_id) where is_shift_lead;

-- C-1: אינדקס מכסה ל-FK החדש. `invite_token` כבר נושא אינדקס מכוח ה-UNIQUE שלו
-- (ה-RPC הציבורית עושה `where invite_token = $1` בכל קריאה) — אין ליצור שני.
create index assignments_hostess_id_idx on public.assignments (hostess_id);

-- ===== SECTION 5 — projects: קואורדינטות + snapshot שם-הלקוח =====
-- lat/lng: בלעדיהן נופלים **גם** מרכיב-הקרבה **וגם** שער-ה-80 ק"מ (`spec.md §12⑫`).
alter table public.projects add column lat           numeric;
alter table public.projects add column lng           numeric;
alter table public.projects add column customer_name text;

update public.projects p
   set customer_name = c.company_name
  from public.customers c
 where c.customer_id = p.customer_id
   and p.customer_name is null;

-- ===== SECTION 6 — ה-RPC של ההמרה כותבת את ה-snapshot מכאן והלאה =====
-- הגוף זהה מילה-במילה לגרסת `20260731085335` (כולל שומר-המע"מ ו-`security definer
-- set search_path = ''`), למעט `customer_name` ב-INSERT ו-ה-`left join` שמזין אותו.
-- ‏`left join` ולא `join`: `projects.customer_id` nullable, ו-`join` היה מבליע את השורה כולה.
create or replace function public.approve_quote_and_create_project(p_quote_id int)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_caller_email text := (select auth.email());
  v_status text; v_event_date date; v_project_id int; v_hostess_count int; v_vat numeric;
  v_vat_text text;
begin
  if not exists (
    select 1 from public.permissions p
    join public.users u on u.role_id = p.role_id
    join public.modules m on m.module_id = p.module_id
    where u.email = v_caller_email and u.status = 'active'
      and m.module_name = 'הצעות מחיר' and p.permission_level = 'edit'
  ) then
    raise exception 'אין הרשאה: נדרשת עריכה על הצעות מחיר לאישור הצעה' using errcode = '42501';
  end if;

  select quote_status, estimated_event_date into v_status, v_event_date
    from public.quotes where quote_id = p_quote_id for update;
  if not found then raise exception 'הצעה % לא נמצאה', p_quote_id using errcode='P0002'; end if;
  if v_status <> 'in_progress' then
    raise exception 'ההצעה כבר טופלה (סטטוס %) — לא ניתן לאשר שוב', v_status using errcode='P0001'; end if;
  if v_event_date < current_date then
    raise exception 'לא ניתן לאשר הצעה שתאריך-האירוע שלה עבר (%)', v_event_date using errcode='P0001'; end if;

  select coalesce(sum(qs.qty),0) into v_hostess_count
    from public.quote_services qs join public.products pr on pr.sku = qs.sku
    where qs.quote_id = p_quote_id and pr.category = 'hostess';
  if v_hostess_count <= 0 then
    raise exception 'לא ניתן לאשר הצעה ללא שורות-דיילות (אין אירוע בלי דיילות)' using errcode='P0001'; end if;

  select param_value into v_vat_text from public.params where param_name = 'אחוז_מעמ';
  if v_vat_text is null or btrim(v_vat_text) = '' or btrim(v_vat_text) !~ '^[0-9]+(\.[0-9]+)?$' then
    raise exception 'שיעור המע"מ אינו מוגדר בהגדרות המערכת (פרמטר אחוז_מעמ) — לא ניתן לאשר הצעה'
      using errcode = 'P0001'; end if;
  v_vat := btrim(v_vat_text)::numeric;
  if v_vat < 0 or v_vat > 100 then
    raise exception 'שיעור המע"מ שבהגדרות המערכת אינו חוקי (%) — לא ניתן לאשר הצעה', v_vat
      using errcode = 'P0001'; end if;

  update public.quote_services qs set closing_unit_cost = pr.cost
    from public.products pr where qs.sku = pr.sku and qs.quote_id = p_quote_id;
  update public.quotes set quote_status='approved', vat_rate_snapshot = v_vat where quote_id = p_quote_id;

  insert into public.projects
    (quote_id, event_name, customer_id, customer_name, final_event_date, final_location,
     final_start_time, final_end_time, owner_email, required_hostess_count, project_status)
  select q.quote_id, q.event_name, q.customer_id, c.company_name, q.estimated_event_date,
         q.estimated_location, q.estimated_start_time, q.estimated_end_time,
         v_caller_email, v_hostess_count, 'not_started'
    from public.quotes q
    left join public.customers c on c.customer_id = q.customer_id
   where q.quote_id = p_quote_id
  returning project_id into v_project_id;

  insert into public.logistics (project_id, sku, serial_number, planned_qty)
  select v_project_id, qs.sku, row_number() over (order by qs.line_number), qs.qty
    from public.quote_services qs join public.products pr on pr.sku = qs.sku
    where qs.quote_id = p_quote_id and pr.category <> 'hostess';

  return v_project_id;
end; $$;
revoke execute on function public.approve_quote_and_create_project(int) from public, anon;
grant  execute on function public.approve_quote_and_create_project(int) to authenticated;
