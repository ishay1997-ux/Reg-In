-- =============================================================================
-- מודול 8 — כספים וסגירת אירוע · מיגרציה A · צעד 1.1
-- =============================================================================
-- למה: מנהלת-הכספים סוגרת את המעגל שכל המערכת פותחת — חשבונית, תשלום, משוב,
-- ארכוב שמקפיא רווח-סופי. עד היום לשלושת המספרים האלה לא היה בית במסד:
-- הרווח-הקפוא, דמי-הביטול ודגל חוב-אבוד לא היו קיימים בשום עמודה
-- (🗡️ DB Design Challenge, שורת "Screen-to-column audit": שני המספרים היחידים
-- שלא היה להם בית הם בדיוק המיגרציה הזו ומיגרציה G).
--
-- ההכרעה המוצרית שמכתיבה את הצורה — product-Q2 (processes-approved.md):
-- הכסף של מ8 יושב ב**טבלת-בת** `project_finance` מגודרת-'כספים', ולא כעמודות על
-- `projects`. הסיבה: כל בעל-הרשאת-'פרויקטים' קורא את `projects`; רווח ודמי-ביטול
-- אינם אמורים להיחשף לכל מי שרואה פרויקט. חמש עמודות-המשוב/חשבונית הקיימות
-- נשארות על `projects` במכוון (המשוב משותף — ㉞), וכך גם `invoice_sent_at`
-- שהוא סטטוס-תהליך ולא כסף.
--
-- §7 שנוגעים: §7.52 (רווח-סופי קפוא ב-₪ — העמודה נולדת כאן) · §7.20ג (דמי-ביטול
-- תלת-רכיביים — ה28 הכריע לשמור סכום-סופי + הערה בלבד, הפירוק נגזר לתצוגה) ·
-- §7.38 (המערכת לעולם לא מפיקה חשבונית — רק קולטת קובץ; B-8 קובע שה-URL של
-- הקובץ יושב כאן, בבת המגודרת) · §7.63 (ה-RPC הוא יחידת-ההרשאה — ולכן אין כאן
-- מדיניות-כתיבה כלל) · §7.21 (תבנית ה-policy עם עטיפת `(select …)`) ·
-- §7.56 (timestamptz בלבד) · §7.74 (כסף = numeric(12,2)) · §7.73 (moddatetime).
--
-- ⚠️ מוקש T9: `moddatetime` עברה לסכמה `extensions` במיגרציה 20260710164420.
-- `public.moddatetime` הוא SQL שבור על הסכמה הנוכחית.
--
-- ⚠️ מוקש T2: הטריגר של §7.50 זורק על כל UPDATE לשורת quotes/quote_services.
-- הסעיף הרביעי כאן הוא שינוי-מדיניות (DDL) ולא כתיבת-שורה, ולכן אינו מפעיל אותו.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. טבלת-הבת של הכסף — project_finance
-- -----------------------------------------------------------------------------
-- יחס 1:1 לפרויקט, ולכן project_id הוא גם המפתח הראשי וגם המפתח הזר.
-- on delete restrict: פרויקט שיש עליו רשומה כספית אינו נמחק בשקט —
-- זו ראיה חשבונאית (וגם `assignments.salary_report_id` נוקט restrict מאותה סיבה).
create table project_finance (
  project_id            integer     not null,
  final_profit          numeric(12,2),          -- §7.52 — רווח סופי קפוא בשקלים ברגע הארכוב
  cancellation_fee      numeric(12,2),          -- §7.20ג/ה28 — הסכום הסופי בלבד
  cancellation_fee_note text,                   -- ה28 — "הערת-פירוט" (A-5: עמודה חופשית אחת)
  written_off           boolean     not null default false,  -- חוב אבוד ("הסתיים — לא שולם")
  written_off_reason    text,                   -- P3: "וידוא + סיבה-חובה" — ה-RPC אוכף שאינה ריקה
  invoice_file_url      text,                   -- B-8 — הקובץ שהועלה לבאקט finance
  archived_at           timestamptz,            -- 🔮 כדי ש"כמה זמן מחשבונית עד ארכוב" יישאר חשיב
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint project_finance_pkey       primary key (project_id),
  constraint project_finance_project_id_fkey
    foreign key (project_id) references projects (project_id)
    on update restrict on delete restrict
);

comment on table project_finance is
  'מ8 — הכסף הפרטי של הפרויקט. מגודר ''כספים'' בקריאה; כתיבה רק דרך RPC-DEFINER (§7.63).';

alter table project_finance enable row level security;

create trigger project_finance_set_updated_at
  before update on project_finance
  for each row execute function extensions.moddatetime('updated_at');

-- מדיניות אחת בלבד — קריאה. אין מדיניות-כתיבה במכוון: כל כתיבה עוברת
-- ב-SECURITY DEFINER RPC שמאשר 'כספים' (§7.63/ה22). לקוח שינסה UPDATE ישיר
-- יקבל 0 שורות.
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


-- -----------------------------------------------------------------------------
-- 2. projects — שתי עמודות-תהליך (לא כסף, ולכן כאן ולא בבת)
-- -----------------------------------------------------------------------------
-- invoice_sent_at: B-7 — timestamptz למרות שהתצוגה ברמת-יום, כי הוא העוגן
-- שממנו נגזרים "ימי איחור" מול שוטף+30 (§7.20א) וגם רישום-ביקורת.
alter table projects add column invoice_sent_at timestamptz;

-- feedback_token: הטוקן של הדף הציבורי /feedback/:token. נטבע עצלות
-- (get-or-create ברגע שליחת-המייל של מ6) ומומת בארכוב ע"י איפוס ל-NULL (B-6).
alter table projects add column feedback_token text;
alter table projects add constraint projects_feedback_token_key unique (feedback_token);

comment on column projects.invoice_sent_at is
  'מ8 §7.20א — חותמת שליחת-החשבונית; ממנה נגזרים ימי-האיחור מול תנאי_תשלום_ימים.';
comment on column projects.feedback_token is
  'מ8 — טוקן הדף הציבורי; נטבע ברגע שליחת-הסקר ומאופס ל-NULL בארכוב (B-6).';


-- -----------------------------------------------------------------------------
-- 3. assignments — הסטטוס שממנו שוחררה הדיילת + האינדקס של C-1
-- -----------------------------------------------------------------------------
-- released_from_status (R4-F2/A-6): בלי זה פיצוי-§7.16 אינו בר-חישוב — ברגע
-- שפרויקט מבוטל, cancel_project הופך את כל השיבוצים ל-'released' והמידע מי
-- באמת היה מאושר-סופית נמחק. nullable במכוון: ביטולי-עבר יישארו NULL ולא
-- יניבו פיצוי (מגבלה מוצהרת §4.5⑤).
-- ה-CHECK קיים כי טעות-כתיב כאן מאפסת פיצוי בשקט, בלי שגיאה.
alter table assignments add column released_from_status text;
alter table assignments add constraint assignments_released_from_status_check
  check (
    released_from_status is null
    or released_from_status = any (array[
      'pending'::text, 'confirmed_available'::text, 'declined'::text,
      'finally_approved'::text, 'released'::text, 'approval_withdrawn'::text
    ])
  );

comment on column assignments.released_from_status is
  'מ8 R4-F2 — הסטטוס שקדם ל-released בביטול פרויקט; בסיס פיצוי §7.16. NULL = ביטול שקדם למ8.';

-- C-1 (שורת-מ8): salary_report_id הוא FK בלי אינדקס מכסה. הדוח החודשי סורק
-- לפי המפתח הזה ("אילו שורות כבר חתומות"), ובלי אינדקס זו סריקת-טבלה מלאה.
create index assignments_salary_report_id_idx on assignments (salary_report_id);


-- -----------------------------------------------------------------------------
-- 4. רוכב ה30 — הידוק קריאת-העלות על quote_services
-- -----------------------------------------------------------------------------
-- ההכרעה: closing_unit_cost (עלות) לא אמור להיות קריא לכל מי שמחזיק צפייה
-- ב'הצעות מחיר'. הצורה המדויקת מועתקת מ-product_costs_select_by_permission,
-- שהוא התקדים החי לאותה בעיה בדיוק.
--
-- ⚠️ RLS הוא ברמת-שורה, ולכן "שאר העמודות ללא שינוי" אינו מילולי: ההידוק
-- מסיר גישה לשורה השלמה מכל תפקיד עתידי שיחזיק צפייה-בלבד ב'הצעות מחיר'
-- ואינו מחזיק עריכה ב'כספים'.
-- 🔴 נמדד חי היום (27/08/2026) לפני ההחלה — אפס אובדן בפועל:
--   מנהלת כספים ולקוחות  : view על 'הצעות מחיר' + edit על 'כספים'  ⇒ עוברת בענף-ה-OR ✓
--   מנהלת פרויקטים        : edit על 'הצעות מחיר'                     ⇒ ללא שינוי ✓
--   מנכ"ל                 : edit על שניהם                            ⇒ ללא שינוי ✓
--   מנהלת גיוס / לוגיסטיקה: blocked על שניהם                         ⇒ אפס שורות גם קודם ✓
-- כלומר בעלת-הצפייה היחידה על הצעות-המחיר היום היא מנהלת-הכספים, והיא עוברת
-- דרך 'כספים'. תפקיד חדש שיקבל צפייה-בלבד על 'הצעות מחיר' לא יראה שורות —
-- וזה מכוון.
drop policy quote_services_select_by_permission on quote_services;

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
