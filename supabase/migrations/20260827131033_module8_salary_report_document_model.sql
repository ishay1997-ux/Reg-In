-- =============================================================================
-- מודול 8 — כספים וסגירת אירוע · מיגרציה B · צעד 1.2
-- =============================================================================
-- למה: `salary_reports` נולדה כשלוש עמודות בלבד ומעולם לא נפתחה — היא הטבלה
-- העסקית האחרונה שנשארה deny-all מחוסר-בנייה. שלוש בעיות חיות חוסמות את
-- ההפקה, וכולן נסגרות כאן:
--   ① §7.40ג — אין מזהה-חודש ⇒ אין שום דבר שמונע הפקה כפולה של אותו חודש.
--   ② `sent_date` ו-`report_file_url` הן NOT NULL ⇒ אי-אפשר בכלל להתחיל
--      טרנזקציית-הפקה, כי הקובץ נוצר רק אחרי שהשורות חושבו (T4).
--   ③ אין טבלת-שורות ⇒ אין הוכחה מה בדיוק נשלח לרו"ח (§7.68).
--
-- ההכרעה המוצרית: §7.68 + ה9 — הדוח הוא **מסמך**, לא ריצה. `period` (ראשון-
-- לחודש) הוא מנגנון-הייחודיות; `salary_report_lines` הוא ה-snapshot הקפוא של
-- מה שנחתם, ו-B-11 קובע שקוד-ההפקה שהאפיון מבקש הוא `report_id` בכותרת האקסל,
-- ולא מפתח שני.
--
-- 🔴 B-4 — השורות מצלמות זהות ומספרים, **לא פרטי-בנק**. שכפול עמודות-הבנק לכאן
--    היה פותח מחדש בדיוק את החשיפה שמיגרציה C סוגרת (ה19). ההוכחה מה נשלח היא
--    קובץ ה-xlsx בבאקט `finance` הפרטי.
--
-- 🔴 T19 — כל מפתח זר כאן הוא RESTRICT בשני הכיוונים. השורות הן **ראיה
--    חשבונאית**: העתקת ה-CASCADE של assignments→projects הייתה מוחקת את הראיה
--    יחד עם הפרויקט.
-- 🔴 T19 — ל-`period` יש CHECK של ראשון-לחודש. בלעדיו תאריך באמצע החודש היה
--    מחלק חודש אחד לשתי "תקופות" שונות ועובר את ה-UNIQUE בלי להתלונן.
-- 🔴 T20 — רמת ה-policy היא `edit|view` על 'כספים', בדיוק כמו project_finance.
-- ⚠️ T9 — moddatetime חיה בסכמה extensions.
--
-- 🌱 נמדד חי 27/08/2026 לפני הכתיבה: `salary_reports` מכילה **0 שורות**, ואפס
--    שורות ב-`assignments` מצביעות על דוח ⇒ הוספת `period NOT NULL` בטוחה
--    בלי ברירת-מחדל ובלי backfill.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. salary_reports — מריצה למסמך
-- -----------------------------------------------------------------------------
-- שחרור NOT NULL (T4): הטרנזקציה מכניסה קודם את שורת-הדוח ואת השורות, ורק
-- אחר-כך הלקוח בונה את ה-xlsx, מעלה אותו ומחזיר URL + תוצאת-שליחה.
alter table salary_reports alter column sent_date drop not null;
alter table salary_reports alter column report_file_url drop not null;

alter table salary_reports add column period date not null;
alter table salary_reports add constraint salary_reports_period_key unique (period);
alter table salary_reports add constraint salary_reports_period_first_of_month
  check (extract(day from period) = 1);

alter table salary_reports add column send_status text not null default 'pending';
alter table salary_reports add constraint salary_reports_send_status_check
  check (send_status = any (array['pending'::text, 'sent'::text, 'failed'::text]));

alter table salary_reports add column total_amount numeric(12,2);

comment on column salary_reports.period is
  'מ8 §7.40ג/§7.68 — החודש שהדוח מכסה, תמיד ראשון-לחודש. זהו מנגנון מניעת ההפקה הכפולה.';
comment on column salary_reports.send_status is
  'מ8 R4-F6 — pending בהפקה, ואז sent/failed. שליחה חוזרת מעדכנת את השורה ואינה יוצרת דוח שני.';
comment on column salary_reports.total_amount is
  'מ8 §7.68 — סך הדוח כפי שנחתם. נשמר ולא נגזר מחדש, כי השורות קפואות.';

-- RLS כבר מופעל על הטבלה (נמדד 27/08/2026) — מה שחסר היה policy, ולכן היא
-- הייתה deny-all. אין כאן enable מיותר שייקרא כאילו מ8 הדליק אותו.
-- אין מדיניות-כתיבה: ההפקה היא טרנזקציית RPC.
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


-- -----------------------------------------------------------------------------
-- 2. salary_report_lines — ה-snapshot הקפוא
-- -----------------------------------------------------------------------------
-- שתי מקורות-שורה (ה15): עבודה בפועל בפרויקט שנסגר תפעולית, ופיצוי-§7.16
-- בפרויקט שבוטל. line_basis מפריד ביניהם, כי לרו"ח זה שני דברים שונים.
-- 🔴 אין כאן עמודות בנק (B-4).
create table salary_report_lines (
  line_id          bigint        not null generated always as identity,
  report_id        integer       not null,
  hostess_id       bigint        not null,
  hostess_name     text          not null,   -- צילום-זהות: השם כפי שנחתם
  id_number        text          not null,   -- צילום-זהות: ת"ז כפי שנחתמה
  source_project_id integer      not null,
  line_basis       text          not null,
  hours            numeric(12,2) not null default 0,
  rate             numeric(12,2) not null,
  bonus            numeric(12,2),            -- NULL = לא-רלוונטי; המסך מציג "—" ולא 0.00
  travel           numeric(12,2),            -- NULL = לא-רלוונטי (ה29 — פיצוי אינו כולל נסיעות)
  line_total       numeric(12,2) not null,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now(),
  constraint salary_report_lines_pkey primary key (line_id),
  constraint salary_report_lines_report_id_fkey
    foreign key (report_id) references salary_reports (report_id)
    on update restrict on delete restrict,
  constraint salary_report_lines_hostess_id_fkey
    foreign key (hostess_id) references hostesses (hostess_id)
    on update restrict on delete restrict,
  constraint salary_report_lines_source_project_id_fkey
    foreign key (source_project_id) references projects (project_id)
    on update restrict on delete restrict,
  constraint salary_report_lines_line_basis_check
    check (line_basis = any (array['actual'::text, 'cancellation_compensation'::text]))
);

comment on table salary_report_lines is
  'מ8 §7.68 — שורות הדוח החודשי, קפואות ברגע ההפקה. ראיה חשבונאית: כל FK הוא RESTRICT. אין כאן פרטי בנק (B-4).';

alter table salary_report_lines enable row level security;

-- אינדקסים מכסים לשלושת ה-FK (צ'קליסט העיצוב §1 — חל על כל FK חדש)
create index salary_report_lines_report_id_idx         on salary_report_lines (report_id);
create index salary_report_lines_hostess_id_idx        on salary_report_lines (hostess_id);
create index salary_report_lines_source_project_id_idx on salary_report_lines (source_project_id);

create trigger salary_report_lines_set_updated_at
  before update on salary_report_lines
  for each row execute function extensions.moddatetime('updated_at');

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
