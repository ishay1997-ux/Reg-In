-- =============================================================================
-- מודול 8 · מיגרציה C · צעד 1.3 — פיצול פרטי-הבנק (ה19)
-- =============================================================================
-- למה: שלוש עמודות הבנק יושבות היום על `hostesses`, ו-RLS ב-Postgres הוא
-- ברמת-שורה ולא ברמת-עמודה ⇒ **כל מי שמחזיק 'דיילות' רואה גם את פרטי-הבנק**,
-- גם אם אין לו שום עניין בשכר. ה19 מפצל אותם לטבלת-בת שנקראת רק ע"י 'דיילות'
-- (כדי שהטופס ימשיך לעבוד) ו-'כספים' (כדי שדוח-השכר יוכל לשלם).
-- התקדים החי לאותה בעיה בדיוק: פיצול `product_costs`.
--
-- 🔴🔴 חשוב — המיגרציה הזו היא **החצי הבטוח בלבד**, בהכרעת-ישי 27/08/2026.
-- התוכנית המקורית (T3) ביקשה "העתק-ואז-מחק באותה מיגרציה". **נמדד באותו יום
-- שזה היה שובר את האתר החי:** ‏`origin/main` — הקוד שרץ בייצור — כותב את שלוש
-- העמודות ישירות ל-`hostesses` (‏`HostessFormDialog.jsx:217-219`) וקורא אותן
-- (‏`HostessViewCard.jsx:315`), ויש **פרויקט-Supabase אחד** לייצור ולפיתוח.
-- ⇒ מחיקת העמודות הייתה שוברת את טופס-הדיילות בייצור **מיד**, ועד למיזוג
-- ולפריסה של מודול 8 — ימים, כשההצגה היא 28/08.
--
-- ⇒ **מה כן קורה כאן (הפיך, לא שובר כלום):**
--    ① נוצרת טבלת-הבת ומועתקים אליה 26 השורות הקיימות.
--    ② שלוש העמודות ב-`hostesses` **משוחררות מ-NOT NULL אך נשארות במקומן** —
--       ריכוך אילוץ לעולם אינו שובר כותב שממשיך לספק ערך, ולכן הייצור ממשיך
--       לעבוד בדיוק כמו קודם.
-- ⇒ **מה נדחה למיגרציה C2, אחרי שמודול 8 ימוזג וייפרס:**
--    ③ `alter table hostesses drop column bank_name/bank_branch/bank_account`.
--    זו הפעולה שסוגרת בפועל את חשיפת-ה19, והיא רשומה ב-db_roadmap §10 וב-§10
--    של מדריך-המיקרו כחוב פתוח — לא כדבר שנשכח.
--
-- ⚠️ מה שנשאר פתוח בחלון-הביניים, ונאמר במפורש: החשיפה שה19 בא לסגור **עדיין
--    פתוחה** עד C2 (המצב הקיים, לא הרעה), ובחלון הזה פרטי-בנק חיים בשני
--    מקומות. קוד-הענף יכתוב לבת; הייצור הישן ימשיך לכתוב לאב. עריכת דיילת
--    דרך הייצור בחלון הזה לא תתעדכן בבת.
--
-- 🌱 נמדד חי 27/08/2026: 26 דיילות, לכולן שלושת השדות מלאים.
-- =============================================================================

create table hostess_bank_details (
  hostess_id  bigint      not null,
  bank_name   text        not null,
  bank_branch text        not null,
  bank_account text       not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint hostess_bank_details_pkey primary key (hostess_id),
  constraint hostess_bank_details_hostess_id_fkey
    foreign key (hostess_id) references hostesses (hostess_id)
    on update restrict on delete cascade
);

comment on table hostess_bank_details is
  'מ8 ה19 — פרטי הבנק של הדיילת, מופרדים מ-hostesses כי RLS הוא ברמת-שורה. קריאה: ''דיילות'' (הטופס) + ''כספים'' (דוח השכר). שורה חסרה = דיילת בלי פרטי בנק, והמסך מציג אותה (LEFT JOIN).';

alter table hostess_bank_details enable row level security;

create trigger hostess_bank_details_set_updated_at
  before update on hostess_bank_details
  for each row execute function extensions.moddatetime('updated_at');

-- העתקת הקיים. `where` מיותר היום (שלוש העמודות NOT NULL), ונשאר כהגנה
-- אם C2 יידחה והעמודות יתמלאו בינתיים בשורות חלקיות.
insert into hostess_bank_details (hostess_id, bank_name, bank_branch, bank_account)
select hostess_id, bank_name, bank_branch, bank_account
from hostesses
where bank_name is not null and bank_branch is not null and bank_account is not null;

-- 'דיילות' עם עריכה — כתיבה וקריאה מלאות, כדי שטופס מ4 ימשיך לעבוד.
create policy hostess_bank_details_all_hostesses_module on hostess_bank_details
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'::text
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'::text
    )
  );

-- 'כספים' — קריאה בלבד. זה כל מה שדוח-השכר צריך; היא לעולם לא עורכת פרטי בנק.
create policy hostess_bank_details_select_finance_module on hostess_bank_details
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = 'edit'::text
    )
  );

-- ריכוך האילוץ באב — מאפשר לקוד-הענף לכתוב רק לבת, בלי לשבור את הייצור
-- שממשיך לספק ערכים. העמודות עצמן נמחקות ב-C2.
alter table hostesses alter column bank_name drop not null;
alter table hostesses alter column bank_branch drop not null;
alter table hostesses alter column bank_account drop not null;

comment on column hostesses.bank_name is
  '⚠️ מ8 ה19 — הוחלפה ע"י hostess_bank_details. נשארת זמנית כדי שהייצור לא יישבר; תימחק במיגרציה C2 אחרי מיזוג מ8.';
comment on column hostesses.bank_branch is
  '⚠️ מ8 ה19 — הוחלפה ע"י hostess_bank_details. נשארת זמנית כדי שהייצור לא יישבר; תימחק במיגרציה C2 אחרי מיזוג מ8.';
comment on column hostesses.bank_account is
  '⚠️ מ8 ה19 — הוחלפה ע"י hostess_bank_details. נשארת זמנית כדי שהייצור לא יישבר; תימחק במיגרציה C2 אחרי מיזוג מ8.';
