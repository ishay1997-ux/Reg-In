-- =============================================================================
-- מודול 11 · מיגרציה A · צעד 1.2 — שתי טבלאות סיווג-ההערות, מדיניות-הקריאה שלהן, ו-RPC-האישור
-- =============================================================================
-- why: `docs/db_roadmap.md` M11-2 (טבלת-הריצות) + M11-3 (טבלת-התובנות), ששתיהן נגזרות
-- מכרטיס **ת2** ב-`docs/specs/module_11_reports/processes-approved.md` — הכרעת-ישי
-- 06/09/2026 "מאשר לפי המלצה", והכרעה 1 שעושה את סיווג-ההערות לכל שכבת-ה-AI של המודול.
-- דף 20 ("ניתוח הערות") מציג **רק שורות מריצה שאושרה**, ולכן זוג `approved_at`/`approved_by`
-- יושב על **הריצה** ולא על השורה: אישור אחד חושף אצווה שלמה.
--
-- 🔴 **המלכודת שבגללה ה-policies נמצאות בקובץ הזה ולא בקובץ אחר** (T2, `micro_guides/module-11.md §4.3`):
-- טבלה עם RLS דלוק ו**אפס** policies מחזירה **אפס שורות עם `error: null`** — המסך משקר, לא נכשל.
-- ⇒ שתי הטבלאות מקבלות את מדיניות-הקריאה שלהן **באותה מיגרציה שיוצרת אותן**, לא אחריה.
--
-- 🔐 **הפרדיקט inline ולא פונקציית-עזר:** אין במסד פונקציה בוליאנית מסוג `has_module_permission` —
-- נמדד 16/09/2026: `grep -rn "has_module_permission" supabase/migrations/` ⇒ **0 מופעים**.
-- התבנית הנעולה היא §7.21 (`docs/PROJECT_MASTER_sec7.md` פריט 21) והתקדים החי הוא
-- `project_finance_select_by_permission` (`20260827125155_module8_finance_tables_and_columns.sql`):
-- `exists (select 1 from public.permissions ...)` כש-`(select public.current_user_role_id())`
-- עטוף ב-`select` — עטיפה שהיא דרישת-ביצועים של Supabase (הערכה פעם אחת לשאילתה, לא פר-שורה).
--
-- 🚫 **ואין מדיניות-כתיבה, במכוון — וזו הכרעה שנמדדה ולא נוחשה** (כרטיס ת8 סעיף 3:
-- "INSERT/UPDATE רק דרך פונקציית-השרת (service role) ו-RPC-האישור (edit)").
-- **הראיה בקוד:** `supabase/functions/send-email/index.ts:196-198` יוצרת לקוח שני עם
-- `SUPABASE_SERVICE_ROLE_KEY` לכתיבת היומן, וההערה שמעליו אומרת מילה-במילה: "נכתב ב-service-role
-- בכוונה: ל-`email_log` אין policy-כתיבה ללקוח, כי יומן שהדפדפן יכול לכתוב אליו אינו ראיה".
-- נמדד חי 16/09/2026: ל-`email_log` יש **4 policies, כולן SELECT**. `classify-feedback` העתידית
-- תיבנה באותה תבנית (JWT לזיהוי + service-role לכתיבה), ו-service role עוקף RLS ⇒ policy-כתיבה
-- ל-`authenticated` הייתה **מרחיבה** את שטח-התקיפה בלי להוסיף יכולת אחת שהמוצר צריך.
--
-- 🧬 **טיפוסים — נמדדו, לא נבחרו בטעם:**
-- · `run_by`/`approved_by` = `text` + FK ל-`public.users(email)`: **כל** עמודת `*_by` במסד היא
--   `text` (נמדד ב-`information_schema`: `projects.cancelled_by` · `projects.operationally_closed_by` ·
--   `project_changes.performed_by`), הזהות הנכתבת היא `auth.email()` (`20260814142440` שורה 208:
--   "auth.email() הוא התקדים החי, והוא גם המפתח ל-public.users"), וערך חי לדוגמה הוא כתובת-מייל.
--   `on delete restrict` לפי `projects_cancelled_by_fkey` — רישום-ביקורת לא נעלם עם המשתמשת.
-- · `sentiment` = `integer` ולא `smallint`. 🔴 **סטייה מנוסח קובץ-המשימה, ומדידה מאחוריה:**
--   במסד החי יש **0 עמודות `smallint`** (54 `integer` · 28 `bigint`, נמדד 16/09/2026), וההכרעה
--   הזו כבר רשומה בגוף מיגרציה מוזגת — `20260908221959_onboarding_mode.sql`: "`integer` ולא
--   `smallint` — אפס `smallint` בריפו". עמודה בת בית-אחד אינה שווה חריג בטיפוסים.
-- · `project_id` = `integer` כי `projects.project_id` הוא `integer` (נמדד), ולא `bigint`.
--
-- 🏷️ **הנחתי (מסומן כדי שיהיה בר-ערעור):**
-- · `negative_topics`/`positive_topics` הן `not null default '{}'` ולא nullable כמו התאומות
--   ב-`projects` (שם ה-NULL הוא שריד של מילוי-לאחור). בטבלה שנולדת ריקה, "לא סווג" נאמר ע"י
--   `unclassifiable`, ו-`{}` הוא "סווג ולא נמצא נושא" — בדיוק הבחנת שלושת-המצבים של הפרויקט.
-- · אין `CHECK` צולב בין `unclassifiable` ל-`sentiment`/`quote`: מנוע-הסיווג עצמו טרם נכתב
--   (פזה 2ב), ואילוץ-צורה שנכתב לפני המנוע הוא ניחוש על הפלט שלו.
-- · `feedback_ai_runs_counts_nonneg` — מונה שלילי אינו מצב עסקי (אותו נימוק בדיוק של
--   `logistics_actual_qty_check`, M5-2).
--
-- ⚠️ **`free_topic` — שני מקורות שאינם מסכימים, ומדווח ולא "מתוקן":**
-- כרטיס **ת2 הכרעה 11** (המקור היחיד בתיקיית-האפיון שמותר לו לקבוע כלל-מוצר) כותב:
-- "להערה שהמודל מסווג 'אחר' הוא מוסיף תג-נושא חופשי אחד (מילה–שתיים, **עמודה free_topic**)".
-- `db_roadmap` M11-3 **אינו מונה אותה**, וגם קובץ-המשימה של הסוכן אינו. העמודה נוצרת כאן
-- (nullable, תוספת טהורה) כי הסתמכות על המקור הגבוה יותר זולה מ**מיגרציה שנייה** תחת כלל
-- ה-append-only. 🔑 **אם ההכרעה היא שלא — מוחקים את השורה הזו לפני ההחלה, לא אחריה.**
--
-- 🔁 **הפיכוּת:** `drop function public.approve_feedback_ai_run(bigint)` ואז
-- `drop table public.feedback_ai_insights` ו-`drop table public.feedback_ai_runs`.
-- **כלל-הפריסה (Expand-Contract):** טבלאות חדשות, policies חדשות ופונקציה חדשה — **תוספת טהורה**;
-- הקוד הפרוס בייצור אינו יודע שהן קיימות ואינו נשבר.
--
-- 🔻 **אימות אחרי ההחלה (קריאה בלבד):**
--   -- (א) pg_policies על שתי הטבלאות ⇒ שתי שורות, שתיהן SELECT, שתיהן {authenticated}.
--   -- (ב) בהתחזות: זהות עם 'דו"חות' view/edit ⇒ קריאה עוברת · זהות blocked ⇒ 0 שורות בלי שגיאה
--   --     (positive control קודם — אחרת "0 שורות" עלול להיות "אין נתונים" ולא "נחסמה").
--   -- (ג) proacl של approve_feedback_ai_run ⇒ בלי anon=.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. feedback_ai_runs — שורה אחת לכל ריצת-סיווג (M11-2)
-- -----------------------------------------------------------------------------
create table public.feedback_ai_runs (
  run_id       bigint      generated always as identity,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text        not null,
  sent_count   integer     not null default 0,
  ok_count     integer     not null default 0,
  failed_count integer     not null default 0,
  model        text,
  run_by       text,
  approved_at  timestamptz,
  approved_by  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- כל אילוץ בשם מפורש — הקוד מזהה שגיאות-מסד לפי שם-האילוץ ולא לפי נוסח ההודעה.
  constraint feedback_ai_runs_pkey primary key (run_id),
  constraint feedback_ai_runs_status_check
    check (status in ('running', 'done', 'partial', 'failed')),
  constraint feedback_ai_runs_counts_nonneg
    check (sent_count >= 0 and ok_count >= 0 and failed_count >= 0),
  constraint feedback_ai_runs_run_by_fkey
    foreign key (run_by) references public.users (email)
    on update no action on delete restrict,
  constraint feedback_ai_runs_approved_by_fkey
    foreign key (approved_by) references public.users (email)
    on update no action on delete restrict
);

comment on table public.feedback_ai_runs is
  'ריצת-סיווג אחת של הערות-לקוח (מודול 11, כרטיס ת2). הכתיבה היא של פונקציית-השרת classify-feedback ב-service role; האישור להצגה הוא RPC מגודר edit על מודול הדוחות. דף 20 מציג רק שורות מריצה מאושרת.';

comment on column public.feedback_ai_runs.status is
  'running בתחילת ריצה · done בסיום מלא · partial כשמכסה או פסק-זמן קטעו והסיווגים שכבר נעשו נשמרו · failed כשלא נשמר דבר.';

comment on column public.feedback_ai_runs.sent_count is
  'כמה הערות נשלחו למודל בריצה הזו; ok_count/failed_count הם הפילוח שלהן — המספרים שמוצגים בפס-ההתקדמות ובשורת-הסיום.';

comment on column public.feedback_ai_runs.model is
  'שם-הדגם שסיווג בפועל. נשמר כדי שהשוואת אדם-מול-מודל תדע איזה מודל היא משווה.';

comment on column public.feedback_ai_runs.run_by is
  'המייל של מי שלחצה "הרץ ניתוח" (auth.email(), התקדים של projects.cancelled_by). NULL רק לריצה שאין מאחוריה אדם — מצב שאינו קיים היום.';

comment on column public.feedback_ai_runs.approved_at is
  'רגע האישור להצגה. NULL = טרם אושרה, ואז דף 20 אומר "טרם אושרה ריצת-ניתוח" ואינו מציג דוח ריק.';

comment on column public.feedback_ai_runs.approved_by is
  'המייל של מי שאישרה להצגה. נכתב אך ורק ע"י approve_feedback_ai_run, לעולם לא מהדפדפן.';

-- מוקש T6: הפונקציה חיה ב-extensions ולא ב-public.
create trigger feedback_ai_runs_set_updated_at
  before update on public.feedback_ai_runs
  for each row execute function extensions.moddatetime('updated_at');

-- אינדקסים על עמודות-ה-FK: `on delete restrict` על users(email) בודק את הטבלה המפנה,
-- והתקדים בבית הוא projects_cancelled_by_idx / project_changes_performed_by_idx.
create index feedback_ai_runs_run_by_idx on public.feedback_ai_runs (run_by);
create index feedback_ai_runs_approved_by_idx on public.feedback_ai_runs (approved_by);

-- -----------------------------------------------------------------------------
-- 2. feedback_ai_insights — שורה אחת לכל פרויקט שסווג (M11-3)
-- -----------------------------------------------------------------------------
-- `project_id` **ייחודי** ⇒ סיווג אחד לפרויקט; ריצה חוזרת מחליפה ואינה מוסיפה שכבה
-- (§5 "מפתחות ושינויוּת" במדריך-המיקרו: "הערה מסווגת פעם אחת בחייה").
-- 🔴 **שתי רשימות ולא אחת (T3):** הטקסונומיה היא **שתי רשימות של חמש**, ו-'אחר' נמצא
-- **בשתיהן** ⇒ מערך אחד לא יכול לומר אם 'אחר' היה תלונה או מחמאה, וזו בדיוק ההשוואה
-- אדם-מול-מודל שדף 20 קיים בשבילה. שתי הרשימות הועתקו **מילה-במילה** מ-
-- `20260904233000_feedback_multi_select_reasons.sql`, ואומתו מול pg_get_constraintdef החי של
-- projects_negative_feedback_reasons_check / projects_positive_feedback_reasons_check (16/09/2026).
-- **אין להמציא רשימה שלישית** — הטקסונומיה אינה מתעדכנת מהמודל (§4.5).
create table public.feedback_ai_insights (
  insight_id      bigint      generated always as identity,
  run_id          bigint      not null,
  project_id      integer     not null,
  sentiment       integer,
  negative_topics text[]      not null default '{}',
  positive_topics text[]      not null default '{}',
  free_topic      text,
  quote           text,
  red_flag        boolean     not null default false,
  unclassifiable  boolean     not null default false,
  classified_at   timestamptz not null default now(),

  constraint feedback_ai_insights_pkey primary key (insight_id),
  constraint feedback_ai_insights_project_id_key unique (project_id),
  constraint feedback_ai_insights_run_id_fkey
    foreign key (run_id) references public.feedback_ai_runs (run_id) on delete cascade,
  -- cascade ולא restrict, בניגוד ל-project_finance: תובנה היא תוצר נגזר שאפשר לייצר מחדש
  -- מההערה עצמה, ולא ראיה כספית. אותו שיקול בדיוק של assignments/logistics.
  constraint feedback_ai_insights_project_id_fkey
    foreign key (project_id) references public.projects (project_id) on delete cascade,
  constraint feedback_ai_insights_sentiment_check
    check (sentiment between 1 and 5),
  constraint feedback_ai_insights_negative_topics_check
    check (negative_topics <@ array['איחור דיילות', 'תפקוד דיילות', 'איכות תגים', 'ניהול לקוי', 'אחר']),
  constraint feedback_ai_insights_positive_topics_check
    check (positive_topics <@ array['מקצועיות הדיילות', 'עמידה בזמנים', 'איכות תגים וציוד', 'ניהול ותקשורת', 'אחר'])
);

comment on table public.feedback_ai_insights is
  'תוצאת-הסיווג של הערת-לקוח אחת, פרויקט אחד לכל היותר (כרטיס ת2). המודל מקבל טקסט וציון בלבד — לא שם-לקוח ולא כסף (§4.5).';

comment on column public.feedback_ai_insights.sentiment is
  'סנטימנט 1–5 כפי שהמודל קרא את ההערה. NULL כשלא ניתן לסווג — ולעולם לא 0, שהוא ציון ולא "לא ידוע".';

comment on column public.feedback_ai_insights.negative_topics is
  'נושאים שליליים מתוך חמש הקטגוריות שכבר במסד (projects_negative_feedback_reasons_check). מערך ריק = סווג ולא נמצא נושא.';

comment on column public.feedback_ai_insights.positive_topics is
  'נושאים חיוביים מתוך חמש הקטגוריות שכבר במסד (projects_positive_feedback_reasons_check). הערך "אחר" קיים בשתי הרשימות, ולכן הן שתי עמודות ולא אחת.';

comment on column public.feedback_ai_insights.free_topic is
  'תג-נושא חופשי אחד (מילה–שתיים) שהמודל מוסיף כשהוא מסווג "אחר", כדי שדף 20 יראה מה "אחר" מכיל. כרטיס ת2, הכרעה 11. הטקסונומיה הקבועה נשארת ציר-ההשוואה.';

comment on column public.feedback_ai_insights.quote is
  'משפט אחד מתוך ההערה, כלשונו — מה שמוצג ליד דגל אדום.';

comment on column public.feedback_ai_insights.red_flag is
  'ההערה מחייבת מבט אנושי. נספרת במבט-על הלקוחות.';

comment on column public.feedback_ai_insights.unclassifiable is
  'המודל לא הצליח לסווג (כולל שגיאת-פורמט בהערה בודדת). השורה נשמרת בכוונה — "לא ניתן לסווג" הוא מידע, ושורה חסרה הייתה נקראת כאילו ההערה לא נשלחה כלל.';

create index feedback_ai_insights_run_id_idx on public.feedback_ai_insights (run_id);

-- -----------------------------------------------------------------------------
-- 3. RLS — קריאה בלבד, שתיהן מגודרות על מודול הדוחות (T2, כרטיס ת8 סעיף 3)
-- -----------------------------------------------------------------------------
alter table public.feedback_ai_runs enable row level security;
alter table public.feedback_ai_insights enable row level security;

create policy feedback_ai_runs_select_by_permission on public.feedback_ai_runs
  for select to authenticated
  using (
    exists (
      select 1 from public.permissions p
      where p.role_id = (select public.current_user_role_id())
        and p.module_id = (select m.module_id from public.modules m where m.module_name = 'דו"חות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy feedback_ai_insights_select_by_permission on public.feedback_ai_insights
  for select to authenticated
  using (
    exists (
      select 1 from public.permissions p
      where p.role_id = (select public.current_user_role_id())
        and p.module_id = (select m.module_id from public.modules m where m.module_name = 'דו"חות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

-- -----------------------------------------------------------------------------
-- 4. approve_feedback_ai_run — המעבר היחיד שאדם מבצע, ו-RPC ולא כתיבת-לקוח
-- -----------------------------------------------------------------------------
-- why: כרטיס ת2 — "מאושרת-להצגה: RPC מגודר edit על דו"חות". בלקוח זו הייתה שורת update
-- שכל בעל-view יכול לשלוח, וההגנה היחידה עליה הייתה היעדר-כפתור במסך.
-- ⚠️ ריצה running אינה מאושרת (היא עוד משתנה), failed אינה מאושרת (אין מה להציג),
-- ואישור כפול נדחה **ברעש** — אחרת שתי לחיצות היו דורסות את חותמת-האישור הראשונה.
-- partial **כן** מאושרת: מה שסווג נשמר, וזו בדיוק כוונת ת2 (א).
create or replace function public.approve_feedback_ai_run(p_run_id bigint)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor       text;
  v_status      text;
  v_approved_at timestamptz;
begin
  -- השער, ראשון ולפני כל קריאה: edit על מודול הדוחות בלבד.
  perform public.assert_module_permission('דו"חות', array['edit']);

  v_actor := auth.email();
  if v_actor is null then
    raise exception 'לא זוהתה משתמשת מחוברת. התחברי מחדש ונסי שוב.' using errcode = '42501';
  end if;

  -- נעילת השורה לכל אורך ההכרעה — שתי לחיצות במקביל לא יאשרו פעמיים.
  select r.status, r.approved_at
    into v_status, v_approved_at
    from public.feedback_ai_runs r
   where r.run_id = p_run_id
     for update;

  if v_status is null then
    raise exception 'ריצת-הניתוח המבוקשת אינה קיימת.' using errcode = 'P0001';
  end if;

  if v_approved_at is not null then
    raise exception 'ריצת-הניתוח כבר אושרה להצגה.' using errcode = 'P0001';
  end if;

  if v_status = 'running' then
    raise exception 'ריצת-הניתוח עדיין פועלת — אין מה לאשר עד שתסתיים.' using errcode = 'P0001';
  end if;

  if v_status = 'failed' then
    raise exception 'ריצת-הניתוח נכשלה ואין בה סיווגים לאישור.' using errcode = 'P0001';
  end if;

  update public.feedback_ai_runs r
     set approved_at = now(),
         approved_by = v_actor
   where r.run_id = p_run_id
  returning r.approved_at into v_approved_at;

  return jsonb_build_object('ok', true, 'run_id', p_run_id, 'approved_at', v_approved_at);
end;
$function$;

comment on function public.approve_feedback_ai_run(bigint) is
  'מאשרת ריצת-סיווג להצגה בדף 20. מגודרת edit על מודול הדוחות; מסרבת לריצה שפועלת, לריצה שנכשלה ולריצה שכבר אושרה.';

-- הענקות — המוקש של 09/08: revoke ... from public אינו חוסם את anon, שקיבל הרשאה בשמו.
revoke execute on function public.approve_feedback_ai_run(bigint) from public, anon, authenticated;
grant execute on function public.approve_feedback_ai_run(bigint) to authenticated;
