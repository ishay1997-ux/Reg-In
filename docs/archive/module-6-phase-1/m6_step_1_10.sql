-- =====================================================================================
-- מודול 6 · צעד 1.10 — סקריפט האימות של שער-פזה-1  (READ-ONLY. אינו משנה דבר.)
-- =====================================================================================
--
-- why: פזה 1 מחילה תשע מיגרציות בלתי-הפיכות-חלקית על המסד החי היחיד. השער של הפזה
--   דורש הוכחה שכל מה שהובטח באמת נחת — ולא "הרצתי ולא קיבלתי שגיאה". הקובץ הזה הוא
--   ההוכחה: שאילתה אחת, שמחזירה שורה לכל פריט שנבנה, עם `PASS` / `FAIL` / `ADVISORY`.
--
-- 🚫 מה הקובץ הזה אינו: הוא **אינו מיגרציה**. אין בו DDL, אין `insert`, אין `update`.
--   מריצים אותו דרך `execute_sql` (קריאה בלבד) — לא דרך `apply_migration`.
--
-- 🔴 ומה הוא לא יכול לבדוק, ויש לבדוק בנפרד:
--   ① `get_advisors` (security + performance) — אינו נגיש מ-SQL. התחזית והטריאז' בקובץ
--      ההערות שליד (`m6_step_1_10.notes.md`), עם מספר-הבסיס שנמדד לפני שהוחל דבר.
--   ② `docs/schema.sql` — אינו נוצר מ-SQL. הוא בא מ-Supabase Studio, וזו פעולת-ישי.
--      פרומפט-המסירה 🧩 בקובץ ההערות.
--   ③ שורות `db_roadmap.md` — קובץ בריפו, לא במסד. הרשימה המלאה בקובץ ההערות.
--
-- אופן ההרצה: להעתיק את כל הבלוק שמתחיל ב-`with` ועד ה-`order by` הסופי, כשאילתה אחת.
--   הפלט: טבלה אחת, ממוינת לפי סעיף. **כל שורה שאינה `PASS` היא עצירה**, פרט לשורות
--   שה-verdict שלהן `ADVISORY` (המלצה שאינה חוסמת), `INFO` (מדידה לרישום בלבד),
--   או `PENDING-1.4` / `PENDING-1.6` (ראה מיד למטה).
--
-- =====================================================================================
-- 🔴 **כל שורה נושאת את המיגרציה שחייבת לרוץ כדי שתעבור** — תוקן בסבב-הבקרה 14/08/2026
-- =====================================================================================
-- **מה היה שבור:** הקובץ הזה הוא שער-הפזה **כולה**, אבל הוא הורץ מול אצווה שאינה מכילה
-- את כל הפזה. **שבעה** מהפריטים שהוא דורש נוצרים אך ורק ע"י **צעד 1.4** (מדיניות-הלוגיסטיקה
-- ומצביע-המקור) ו**צעד 1.6** (הרחבת `email_log`). כשהאצווה אינה כוללת אותם, השער החזיר
-- שבעה `FAIL` **שנראים כמו באגים בטיוטות שכן קיימות** — כלומר בדיוק הסימן ההפוך מזה
-- שהשער נועד לתת. 🚫 **הפריטים לא נמחקו** — שמותיהם סגורים ומופיעים מילה-במילה
-- בקטעי-הקוד של המדריך עצמו (‏`module-6.md` §1.4 שורות 805-822 · §1.6 שורות 891-899).
--
-- **מה תוקן, ואיך זה עובד עכשיו:**
--   ① כל ציפייה נושאת **תגית-מקור** בעמודת "מצופה" — `[1.1]` · `[1.2]` · `[1.3]` · `[1.4]` ·
--      `[1.5]` · `[1.6]` · `[1.7]` · `[1.8]` · `[1.9]`. קורא שאינו יודע SQL רואה מיד
--      **איזו מיגרציה אשמה** בכל שורה אדומה.
--   ② בלוק `dep` למטה **מגלה בעצמו** אם 1.4 ו-1.6 בכלל רצו, לפי טביעת-אצבע של כל אחת.
--      התוצאה: פריט חסר של 1.4 מדווח `PENDING-1.4` (*"הצעד טרם הוחל"* — לא כישלון)
--      **אבל אם 1.4 כן רצה והפריט עדיין חסר — הוא חוזר להיות `FAIL` אמיתי.**
--      ⇒ השער מבחין בין *"צעד 1.4 לא היה באצווה"* לבין *"צעד 1.4 רץ ונשבר"*, וזו בדיוק
--      ההבחנה שבלעדיה השער חסר-ערך.
--   ③ 🔴 **`PENDING` אינו ירוק.** פזה 1 **אינה** שלמה כל עוד יש ולו שורת-`PENDING` אחת:
--      ‏`logistics` נשארת RLS-מופעלת בלי ולו מדיניות אחת = **deny-all**, והמסך מחזיר
--      אפס שורות **בלי שגיאה** — מה ש-`spec.md` §12 מכנה מצב-הכשל החמור ביותר במודול.
-- =====================================================================================
--
-- מוסכמת-שמות: `<טבלה>_<עמודה>_idx` לאינדקסים · `<טבלה>_<תיאור>` ל-CHECKים —
--   שתיהן נגזרו מהמוסכמה החיה (`projects_owner_email_idx`, `assignments_one_event_per_day`).
-- =====================================================================================

with

-- ═════════════════ ⓿ גלאי-התלות: האם 1.4 ו-1.6 בכלל רצו? ═════════════════
-- 🔴 טביעת-האצבע של כל צעד היא **איחוד** של כל מה שהוא יוצר — לא פריט יחיד. כך, אם הצעד
--    רץ חלקית (למשל המדיניות נוצרה והעמודות לא), הגלאי מדליק `true` והפריטים החסרים
--    חוזרים להיות `FAIL` אמיתי במקום `PENDING` מרגיע.
dep as (
  select
    -- טביעת-אצבע של 1.4: מדיניות-הלוגיסטיקה **או** אחת משתי עמודות-המקור
    (exists (select 1 from pg_policies
              where schemaname='public' and tablename='logistics'
                and policyname='logistics_select_by_permission')
     or exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='logistics'
                   and column_name in ('quote_service_line_id','project_change_id'))
    ) as ran_14,
    -- טביעת-אצבע של 1.6: הרחבת ה-CHECK **או** מדיניות-הקריאה של מ6 על היומן
    (coalesce((select pg_get_constraintdef(oid) from pg_constraint
                where conrelid='public.email_log'::regclass
                  and conname='email_log_entity_type_check'), '') like '%project_report%'
     or exists (select 1 from pg_policies
                 where schemaname='public' and tablename='email_log'
                   and policyname='email_log_select_projects_module')
    ) as ran_16
),

-- ═════════════════ א. עמודות חדשות + הידוקי NOT NULL ═════════════════
exp_col(tbl, col, want_null, src) as (values
  ('projects','cancelled_at','YES','1.1'),
  ('projects','cancelled_by','YES','1.1'),
  ('projects','cancel_type','YES','1.1'),
  ('projects','operationally_closed_at','YES','1.1'),
  ('projects','operationally_closed_by','YES','1.1'),
  ('projects','quote_id','NO','1.1'),              -- §7.62 / A-14 · הידוק
  ('projects','owner_email','NO','1.1'),           -- §7.62 / A-14 · הידוק
  ('assignments','attendance_status','YES','1.3'),
  ('assignments','lateness_level','YES','1.3'),
  ('assignments','no_show_reason','YES','1.3'),
  ('logistics','quote_service_line_id','YES','1.4'),
  ('logistics','project_change_id','YES','1.4'),
  ('project_changes','change_id','NO','1.2'),
  ('project_changes','project_id','NO','1.2'),
  ('project_changes','change_group_id','NO','1.2'),
  ('project_changes','sku','YES','1.2'),
  ('project_changes','color','YES','1.2'),
  ('project_changes','change_target','NO','1.2'),
  ('project_changes','delta_qty','NO','1.2'),
  ('project_changes','unit_price_snapshot','NO','1.2'),
  ('project_changes','unit_cost_snapshot','NO','1.2'),
  ('project_changes','reason','NO','1.2'),
  ('project_changes','performed_by','NO','1.2'),
  ('project_changes','created_at','NO','1.2'),
  ('project_changes','updated_at','NO','1.2')
),
sec_a as (
  select 'א · עמודות'::text as sec,
         'A-' || lpad((row_number() over (order by e.tbl, e.col))::text, 2, '0') as id,
         e.tbl || '.' || e.col as item,
         '[' || e.src || '] קיימת · is_nullable=' || e.want_null as expected,
         coalesce(c.data_type || ' · is_nullable=' || c.is_nullable::text, '*** העמודה חסרה ***') as actual,
         case when c.column_name is not null and c.is_nullable::text = e.want_null then 'PASS'
              when c.column_name is null and e.src = '1.4' and not (select ran_14 from dep)
                   then 'PENDING-1.4'
              else 'FAIL' end as verdict
    from exp_col e
    left join information_schema.columns c
      on c.table_schema = 'public' and c.table_name = e.tbl and c.column_name = e.col
),
sec_a_drop as (
  select 'א · עמודות'::text, 'A-99'::text, 'projects.project_bonus'::text,
         '[1.1] אינה קיימת (㉟ · M6-3)'::text,
         case when exists (select 1 from information_schema.columns
                            where table_schema='public' and table_name='projects'
                              and column_name='project_bonus')
              then 'עדיין קיימת' else 'הוסרה' end,
         case when exists (select 1 from information_schema.columns
                            where table_schema='public' and table_name='projects'
                              and column_name='project_bonus')
              then 'FAIL' else 'PASS' end
),
sec_a_count as (
  -- ✅ אומת חי 14/08/2026: ‏`projects` נושאת **29** עמודות היום ⇒ 29 − 1 + 5 = **33**. תקין.
  select 'א · עמודות'::text, 'A-CNT'::text, 'מספר העמודות ב-projects'::text,
         '[1.1] 33 (29 בסיס שנמדד חי − 1 שהוסרה + 5 חדשות)'::text,
         (select count(*)::text from information_schema.columns
           where table_schema='public' and table_name='projects'),
         case when (select count(*) from information_schema.columns
                     where table_schema='public' and table_name='projects') = 33
              then 'PASS' else 'FAIL' end
),

-- ═════════════════ ב. אילוצים לפי שם ═════════════════
-- 🔴 השמות האלה הם חוזה: `SERVER_CONSTRAINT_RULES` (src/lib/hostesses.js:603-613) ממפה
--    שם-אילוץ להודעה בעברית. שם אוטומטי שהשתנה = הודעה שנעלמת בלי שאף בדיקה תיפול.
exp_con(tbl, con, src) as (values
  ('projects','projects_negative_feedback_reason_check','1.1'),   -- M6-13
  -- 🔴 שם-האילוץ תוקן בסבב-הבקרה 14/08/2026: `project_closed_needs_report` →
  --    `projects_closed_needs_report`. נמדד חי: 44/44 אילוצי-CHECK ב-`public` נושאים את
  --    שם-הטבלה המדויק כתחילית, אפס חריגים. **חייב להישאר זהה ל-`m6_step_1_1.sql`.**
  ('projects','projects_closed_needs_report','1.1'),              -- ㉛ · §7.36
  ('projects','projects_cancel_type_check','1.1'),                -- AR-1 · שלושה ערכים
  ('assignments','assignments_attendance_shape','1.3'),
  ('assignments','assignments_no_show_zero_hours','1.3'),
  ('assignments','assignments_attendance_status_check','1.3'),
  ('assignments','assignments_lateness_level_check','1.3'),
  ('assignments','assignments_no_show_reason_check','1.3'),
  ('logistics','logistics_origin_exactly_one','1.4'),
  ('project_changes','project_changes_delta_qty_check','1.2'),    -- מוקש 🛑#10 — ראה הערות
  ('project_changes','project_changes_target_shape','1.2'),
  ('project_changes','project_changes_change_target_check','1.2'),
  ('project_changes','project_changes_color_check','1.2'),
  ('project_changes','project_changes_reason_check','1.2'),
  ('project_changes','project_changes_unit_price_snapshot_check','1.2'),
  ('project_changes','project_changes_unit_cost_snapshot_check','1.2')
  -- 🔴 `email_log_entity_type_check` הוסר מהרשימה הזאת **בכוונה, אחרי הרצת-יבש 14/08 11:4X**:
  --    האילוץ קיים כבר היום (עם שני ערכים) ⇒ בדיקת-קיום עברה `PASS` בעוד שום דבר לא הוחל.
  --    זו בדיוק "ירוק שאינו סיום". הבדיקה האמיתית שלו היא `B-EML` למטה — על התוכן, לא על השם.
),
sec_b as (
  select 'ב · אילוצים'::text as sec,
         'B-' || lpad((row_number() over (order by e.tbl, e.con))::text, 2, '0') as id,
         e.con as item,
         '[' || e.src || '] קיים על ' || e.tbl as expected,
         coalesce(left(pg_get_constraintdef(c.oid), 120), '*** האילוץ חסר ***') as actual,
         case when c.oid is not null then 'PASS'
              when e.src = '1.4' and not (select ran_14 from dep) then 'PENDING-1.4'
              else 'FAIL' end as verdict
    from exp_con e
    left join pg_constraint c
      on c.conrelid = to_regclass('public.' || e.tbl) and c.conname = e.con
),
sec_b_email as (
  select 'ב · אילוצים'::text, 'B-EML'::text, 'email_log · ארבעת הערכים'::text,
         '[1.6] quote · shift · project · project_report'::text,
         coalesce((select pg_get_constraintdef(oid) from pg_constraint
                    where conrelid='public.email_log'::regclass
                      and conname='email_log_entity_type_check'), '*** חסר ***'),
         case when (select pg_get_constraintdef(oid) from pg_constraint
                     where conrelid='public.email_log'::regclass
                       and conname='email_log_entity_type_check') like '%project_report%'
              then 'PASS'
              when not (select ran_16 from dep) then 'PENDING-1.6'
              else 'FAIL' end
),
-- 🔴 שבע FK, לא שש. התווית קודם קראה '6: … (סה"כ 7)' — נגד `= 7` שבתנאי עצמו.
--    תוקן בסבב-הבקרה 14/08/2026: המספר המודפס הוא מה שקורא שאינו-SQL מאמין לו.
--    ‏**חמש מהן של 1.1/1.2 ושתיים של 1.4** ⇒ הספירה מפוצלת, אחרת אצווה בלי 1.4
--    מדווחת `5 מתוך 7` בלי לומר אילו שתיים חסרות ולמה.
sec_b_fk as (
  select 'ב · אילוצים'::text, 'B-FK'::text, 'מפתחות זרים חדשים'::text,
         '[1.1+1.2] 5 · [1.4] 2 — סה"כ 7'::text,
         '[1.1+1.2]: ' ||
           (select count(*)::text from pg_constraint
             where contype='f' and conname in
               ('projects_cancelled_by_fkey','projects_operationally_closed_by_fkey',
                'project_changes_project_id_fkey','project_changes_sku_fkey',
                'project_changes_performed_by_fkey')) || '/5 · [1.4]: ' ||
           (select count(*)::text from pg_constraint
             where contype='f' and conname in
               ('logistics_quote_service_line_id_fkey','logistics_project_change_id_fkey')) || '/2',
         case when (select count(*) from pg_constraint
                     where contype='f' and conname in
                       ('projects_cancelled_by_fkey','projects_operationally_closed_by_fkey',
                        'project_changes_project_id_fkey','project_changes_sku_fkey',
                        'project_changes_performed_by_fkey')) < 5 then 'FAIL'
              when (select count(*) from pg_constraint
                     where contype='f' and conname in
                       ('logistics_quote_service_line_id_fkey','logistics_project_change_id_fkey')) = 2
                   then 'PASS'
              when not (select ran_14 from dep) then 'PENDING-1.4'
              else 'FAIL' end
),

-- ═════════════════ ג. אינדקסים לפי שם ═════════════════
-- 🔴 ארבעת האינדקסים שהיו מסומנים `ADVISORY` **הפכו ל-`REQUIRED`** בסבב-הבקרה 14/08/2026:
--    ‏`m6_step_1_1.sql` ו-`m6_step_1_2.sql` **יוצרים את כל ארבעתם בפועל** (‏1.1 שורות
--    114-117 · 1.2 שורות 117-118), כלומר הם כבר אינם המלצה פתוחה אלא חלק מהמיגרציה.
--    ⇒ היעדרם פירושו שהמיגרציה לא רצה כפי שנכתבה — וזה `FAIL`, לא "מומלץ".
--    *(וזו גם הסיבה שתחזית-היועץ למטה, K-02, נשארת 20 ולא 24 — ראה שם.)*
exp_idx(idx, kind, src) as (values
  ('project_changes_project_id_idx','REQUIRED','1.2'),
  ('project_changes_sku_idx','REQUIRED','1.2'),
  ('project_changes_performed_by_idx','REQUIRED','1.2'),
  ('projects_cancelled_by_idx','REQUIRED','1.1'),
  ('projects_operationally_closed_by_idx','REQUIRED','1.1'),
  ('logistics_quote_service_line_id_idx','REQUIRED','1.4'),
  ('logistics_project_change_id_idx','REQUIRED','1.4')
),
sec_c as (
  select 'ג · אינדקסים'::text as sec,
         'C-' || lpad((row_number() over (order by e.src, e.idx))::text, 2, '0') as id,
         e.idx as item,
         '[' || e.src || '] חובה — קיים (כיסוי FK)' as expected,
         coalesce(left(i.indexdef, 110), 'אינו קיים') as actual,
         case when i.indexname is not null then 'PASS'
              when e.src = '1.4' and not (select ran_14 from dep) then 'PENDING-1.4'
              else 'FAIL' end as verdict
    from exp_idx e
    left join pg_indexes i on i.schemaname='public' and i.indexname = e.idx
),

-- ═════════════════ ד. Policies לפי שם ═════════════════
exp_pol(tbl, pol, want_cmd, src) as (values
  ('logistics','logistics_select_by_permission','SELECT','1.4'),    -- AR-2 · שער 'לוגיסטיקה'
  ('email_log','email_log_select_projects_module','SELECT','1.6')   -- AR-8
),
sec_d as (
  select 'ד · Policies'::text as sec,
         'D-' || lpad((row_number() over (order by e.tbl))::text, 2, '0') as id,
         e.pol as item,
         '[' || e.src || '] קיימת על ' || e.tbl || ' · cmd=' || e.want_cmd as expected,
         coalesce(p.cmd, '*** חסרה ***') as actual,
         case when p.cmd = e.want_cmd then 'PASS'
              when e.src = '1.4' and not (select ran_14 from dep) then 'PENDING-1.4'
              when e.src = '1.6' and not (select ran_16 from dep) then 'PENDING-1.6'
              else 'FAIL' end as verdict
    from exp_pol e
    left join pg_policies p
      on p.schemaname='public' and p.tablename = e.tbl and p.policyname = e.pol
),
sec_d_pc as (
  select 'ד · Policies'::text, 'D-PC'::text, 'project_changes'::text,
         '[1.2] בדיוק policy אחת, cmd=SELECT · אפס policies-כתיבה (AS-2)'::text,
         coalesce((select string_agg(policyname || '/' || cmd, ' · ' order by policyname)
                     from pg_policies where schemaname='public' and tablename='project_changes'),
                  '*** אפס policies — deny-all! מוקש 🛑#4 לא תוקן ***'),
         case when (select count(*) from pg_policies
                     where schemaname='public' and tablename='project_changes') = 1
               and (select count(*) from pg_policies
                     where schemaname='public' and tablename='project_changes' and cmd='SELECT') = 1
              then 'PASS' else 'FAIL' end
),
-- 🔴 השורה הזאת היא **מצב-הכשל החמור ביותר במודול** (`spec.md` §12): ‏`logistics` היא
--    RLS-מופעלת עם **אפס** מדיניות היום (נמדד חי 14/08/2026) ⇒ deny-all ⇒ הלשונית מחזירה
--    `{data:null, error:null}` — אפס שורות **בלי שגיאה**, וכל פרויקט נראה כאילו אין לו
--    לוגיסטיקה. ⇒ `PENDING-1.4` כאן אינו "כמעט ירוק", הוא **חוסם-פזה**.
sec_d_log_only as (
  select 'ד · Policies'::text, 'D-LG'::text, 'logistics · אין policy-כתיבה'::text,
         '[1.4] בדיוק policy אחת (קריאה בלבד — הכתיבה של מ5)'::text,
         (select count(*)::text from pg_policies where schemaname='public' and tablename='logistics')
           || ' policies · 🔴 אפס = deny-all שקט',
         case when (select count(*) from pg_policies
                     where schemaname='public' and tablename='logistics') = 1 then 'PASS'
              when not (select ran_14 from dep) then 'PENDING-1.4'
              else 'FAIL' end
),
sec_d_email as (
  select 'ד · Policies'::text, 'D-EM'::text, 'email_log · שלוש policies'::text,
         '[1.6] quotes_module · shifts_module · projects_module'::text,
         (select string_agg(policyname, ' · ' order by policyname)
            from pg_policies where schemaname='public' and tablename='email_log'),
         case when (select count(*) from pg_policies
                     where schemaname='public' and tablename='email_log') = 3 then 'PASS'
              when not (select ran_16 from dep) then 'PENDING-1.6'
              else 'FAIL' end
),
sec_d_storage as (
  select 'ד · Policies'::text, 'D-ST'::text, 'storage.objects'::text,
         '[1.5] 12 policies (4 marketing קיימות + 4 reports + 4 finance) · נמדד חי היום: 4'::text,
         (select count(*)::text || ' · ' ||
                 coalesce(string_agg(policyname, ', ' order by policyname), '')
            from pg_policies where schemaname='storage' and tablename='objects'),
         case when (select count(*) from pg_policies
                     where schemaname='storage' and tablename='objects') = 12
              then 'PASS' else 'FAIL' end
),
sec_d_storage_split as (
  select 'ד · Policies'::text, 'D-SS'::text, 'storage.objects · פיצול הרשאות'::text,
         '[1.5] reports → ''פרויקטים'' (4) · finance → ''כספים'' (4) — כל אחת עם bucket_id בתנאי'::text,
         'reports+פרויקטים: ' ||
           (select count(*)::text from pg_policies
             where schemaname='storage' and tablename='objects'
               and coalesce(qual,'') || coalesce(with_check,'') like '%reports%'
               and coalesce(qual,'') || coalesce(with_check,'') like '%פרויקטים%') ||
         ' · finance+כספים: ' ||
           (select count(*)::text from pg_policies
             where schemaname='storage' and tablename='objects'
               and coalesce(qual,'') || coalesce(with_check,'') like '%finance%'
               and coalesce(qual,'') || coalesce(with_check,'') like '%כספים%'),
         case when (select count(*) from pg_policies
                     where schemaname='storage' and tablename='objects'
                       and coalesce(qual,'') || coalesce(with_check,'') like '%reports%'
                       and coalesce(qual,'') || coalesce(with_check,'') like '%פרויקטים%') = 4
               and (select count(*) from pg_policies
                     where schemaname='storage' and tablename='objects'
                       and coalesce(qual,'') || coalesce(with_check,'') like '%finance%'
                       and coalesce(qual,'') || coalesce(with_check,'') like '%כספים%') = 4
              then 'PASS' else 'FAIL' end
),

-- ═════════════════ ה. Buckets ═════════════════
-- 🔴 **`marketing` הוא `public = true`, וזה תקין ומכוון** — תוקן בסבב-הבקרה 14/08/2026.
--    הקובץ ציפה קודם ל-`false`, כלומר **דיווח `FAIL` על מצב נכון** — והתיקון שמפעיל היה
--    מבצע (להפוך את ה-bucket לפרטי) **שובר את קישורי-השיווק הקבועים של מודול 2.**
--    המקור: `20260710160735_module2_customers_surrogate_key_rls_and_marketing.sql` —
--    `insert into storage.buckets … values ('marketing','marketing',true)` עם הערת-ה-why
--    *"bucket ציבורי (הכרעת ישי 06/07: קישור קבוע, לא Signed URL)"*.
--    נמדד חי 14/08/2026: `marketing / public=true / file_size_limit=10485760`.
--    ⚠️ ‏`m6_step_1_5.sql:151` כבר נשא את הציפייה הנכונה (`marketing(true,10485760)`) —
--    כלומר שתי הטיוטות סתרו זו את זו, והטיוטה **הזאת** הייתה השגויה.
exp_bkt(id, want_public, want_limit, src) as (values
  ('marketing', true,  10485760, 'מ2'),   -- 🔴 ציבורי במכוון — לא לגעת
  ('reports',   false,  2097152, '1.5'),  -- 🔴 הכרעת-ישי 14/08 — 2 MiB, לא 10
  ('finance',   false, 10485760, '1.5')   -- לא הוכרע; תקדים marketing (AS-4)
),
sec_e as (
  select 'ה · Buckets'::text as sec,
         'E-' || lpad((row_number() over (order by e.id))::text, 2, '0') as id,
         'bucket ' || e.id as item,
         '[' || e.src || '] public=' || e.want_public::text || ' · limit=' || e.want_limit::text || ' · 3 MIME' as expected,
         coalesce('public=' || b.public::text || ' · limit=' || coalesce(b.file_size_limit::text,'NULL')
                  || ' · MIME=' || coalesce(array_length(b.allowed_mime_types,1)::text,'NULL'),
                  '*** ה-bucket אינו קיים ***') as actual,
         case when b.id is null then 'FAIL'
              when b.public <> e.want_public then 'FAIL'
              when b.file_size_limit is distinct from e.want_limit then 'FAIL'
              when coalesce(array_length(b.allowed_mime_types,1),0) <> 3 then 'FAIL'
              else 'PASS' end as verdict
    from exp_bkt e
    left join storage.buckets b on b.id = e.id
),

-- ═════════════════ ו. pg_cron ═════════════════
sec_f as (
  select 'ו · cron'::text, 'F-01'::text, 'module6-event-finished'::text,
         '[1.9] קיים · schedule = 0 2 * * *  (⚠️ cron.timezone=GMT ⇒ 05:00 שעון ישראל)'::text,
         coalesce((select schedule from cron.job where jobname='module6-event-finished'),
                  '*** ה-job אינו קיים ***'),
         case when (select schedule from cron.job where jobname='module6-event-finished') = '0 2 * * *'
              then 'PASS' else 'FAIL' end
  union all
  select 'ו · cron'::text, 'F-02'::text, 'סה"כ jobs'::text,
         '[1.9] 3 (2 של מ1/מ3 — נמדדו חי היום — ועוד אחת של מ6)'::text,
         (select count(*)::text from cron.job),
         case when (select count(*) from cron.job) = 3 then 'PASS' else 'FAIL' end
  union all
  select 'ו · cron'::text, 'F-03'::text, 'אין חפיפת שעות'::text,
         '30 1 · 0 1 · 0 2 — שלוש שעות שונות'::text,
         (select string_agg(jobname || ' @ ' || schedule, ' · ' order by jobname) from cron.job),
         case when (select count(distinct schedule) from cron.job) = 3 then 'PASS' else 'FAIL' end
),

-- ═════════════════ ז. פונקציות: prosecdef + הרשאות ═════════════════
-- 🔴 want_auth=true  ⇒ נקראת מהדפדפן ⇒ **חייבת** grant ל-authenticated (ומייצרת אזהרת-יועץ מקובלת)
-- 🔴 want_auth=false ⇒ פנימית בלבד ⇒ **חייבת** revoke מ-authenticated (ואז אינה מייצרת אזהרה)
-- ⚠️ **סדר-החלה, ולא לפי מספר-הצעד:** ‏`update_project_details` (צעד 1.8) קוראת ל-
--    `recompute_project_status` (צעד **1.9**). ‏PL/pgSQL אינו בודק קיום-פונקציה בזמן
--    ה-`create`, ולכן הכשל אינו מתגלה בהחלה אלא **בלחיצה של משתמשת** (`42883`).
--    ⇒ הסדר הנדרש: 1.1 → 1.2 → 1.3 → 1.5 → 1.7 → **1.9** → 1.8 → 1.4 → 1.6 → 1.10.
--    (‏1.4 אחרי 1.2 — ה-FK שלה מפנה ל-`project_changes(change_id)`.)
exp_fn(fn, want_auth, src) as (values
  ('assert_module_permission',      false, '1.8'),
  ('recompute_project_status',      false, '1.9'),
  ('trg_recompute_project_status',  false, '1.9'),
  ('list_projects_overview',        true,  '1.8'),
  ('update_project_details',        true,  '1.8'),
  ('apply_scope_change',            true,  '1.8'),
  ('cancel_project',                true,  '1.8'),
  ('close_project_operationally',   true,  '1.8'),
  ('mark_feedback_survey_sent',     true,  '1.8'),
  ('set_project_finance_fields',    true,  '1.8')
),
fn_live as (
  select p.proname, p.oid, p.prosecdef,
         has_function_privilege('anon', p.oid, 'execute')          as anon_x,
         has_function_privilege('authenticated', p.oid, 'execute') as auth_x,
         pg_get_function_identity_arguments(p.oid)                 as args
    from pg_proc p where p.pronamespace='public'::regnamespace
),
sec_g as (
  select 'ז · פונקציות'::text as sec,
         'G-' || lpad((row_number() over (order by e.want_auth, e.fn))::text, 2, '0') as id,
         e.fn as item,
         '[' || e.src || '] security definer · anon=false · authenticated=' || e.want_auth::text as expected,
         coalesce('secdef=' || f.prosecdef::text || ' · anon=' || f.anon_x::text
                  || ' · auth=' || f.auth_x::text || ' (' || f.args || ')',
                  '*** הפונקציה אינה קיימת ***') as actual,
         case when f.proname is null then 'FAIL'
              when not f.prosecdef then 'FAIL'
              when f.anon_x then 'FAIL'                 -- 🧨 מוקש 09/08: revoke בשם, לא from public
              when f.auth_x <> e.want_auth then 'FAIL'
              else 'PASS' end as verdict
    from exp_fn e left join fn_live f on f.proname = e.fn
),
-- 🔴 **תוקן פעמיים בסבב-הבקרה 14/08/2026 — והתיקון הראשון היה גם הוא שגוי. חשוב לקרוא.**
--    ① הבדיקה דרשה קודם `set search_path = public, pg_temp` — **הפוך ממוסכמת-הבית.**
--       נמדד חי: **14 מתוך 14** הפונקציות ב-`public` נושאות `search_path = ''`, ו**אפס**
--       נושאות `public, pg_temp`. עשר פונקציות מ6 נכתבו כולן ב-`''`. ⇒ הבדיקה הייתה
--       מחזירה `0 מתוך 10` ו-FAIL על בנייה **נכונה**, והתיקון המתבקש (לשנות עשר פונקציות)
--       היה הורס את המוסכמה במכוון. ‏`''` גם מחמיר יותר, וכל ההפניות מוסמכות-סכמה.
--    ② 🔴 **והתיקון המוצע בדוח-הבקרה — `like '%search_path=""%'` — נמדד ונכשל אף הוא: 0/14.**
--       הסיבה: ‏`proconfig` הוא `text[]`, ובהמרה ל-`text` המערך **מצטט את האיבר ומגן על
--       הגרשיים בלוכסן**, כך שהטקסט בפועל הוא `{"search_path=\"\""}` ולא `search_path=""`.
--       ⇒ תבנית-ה-LIKE התמימה אינה מוצאת דבר, והבדיקה הייתה נשארת FAIL — רק מסיבה אחרת.
--       **הצורה שנמדדה כעובדת (14/14): השוואת-איבר-מערך, בלי LIKE בכלל.**
--       *(אומת חי 14/08/2026: `proconfig @> array['search_path=""']` ⇒ 14 · `= any(...)` ⇒ 14 ·
--         `like '%search_path=""%'` ⇒ 0 · `like '%search_path=\"\"%'` ⇒ 0.)*
sec_g_path as (
  select 'ז · פונקציות'::text, 'G-SP'::text, 'search_path על כל העשר'::text,
         'לכולן set search_path = '''' (מוסכמת-הבית — 14/14 חי)'::text,
         (select count(*)::text || ' מתוך 10' from pg_proc p
           where p.pronamespace='public'::regnamespace
             and p.proname in (select fn from exp_fn)
             and p.proconfig @> array['search_path=""']),
         case when (select count(*) from pg_proc p
                     where p.pronamespace='public'::regnamespace
                       and p.proname in (select fn from exp_fn)
                       and p.proconfig @> array['search_path=""']) = 10
              then 'PASS' else 'FAIL' end
),

-- ═════════════════ ח. טריגרים ═════════════════
exp_trg(tbl, trg, src) as (values
  ('assignments','assignments_recompute_project_status','1.9'),
  ('logistics','logistics_recompute_project_status','1.9'),
  ('projects','projects_recompute_on_required_count','1.9'),
  ('project_changes','project_changes_set_updated_at','1.2')
),
sec_h as (
  select 'ח · טריגרים'::text as sec,
         'H-' || lpad((row_number() over (order by e.tbl))::text, 2, '0') as id,
         e.trg as item,
         '[' || e.src || '] קיים על ' || e.tbl as expected,
         coalesce(left(pg_get_triggerdef(t.oid), 130), '*** הטריגר חסר ***') as actual,
         case when t.oid is null then 'FAIL' else 'PASS' end as verdict
    from exp_trg e
    left join pg_trigger t
      on t.tgrelid = to_regclass('public.' || e.tbl) and t.tgname = e.trg and not t.tgisinternal
),
sec_h_recurse as (
  select 'ח · טריגרים'::text, 'H-RC'::text, 'שומר-הרקורסיה'::text,
         '[1.9] הטריגר על projects מוגבל ל-UPDATE OF required_hostess_count'::text,
         coalesce((select pg_get_triggerdef(oid) from pg_trigger
                    where tgrelid='public.projects'::regclass
                      and tgname='projects_recompute_on_required_count'), '*** חסר ***'),
         case when (select pg_get_triggerdef(oid) from pg_trigger
                     where tgrelid='public.projects'::regclass
                       and tgname='projects_recompute_on_required_count')
                   like '%UPDATE OF required_hostess_count%'
              then 'PASS' else 'FAIL' end
),
sec_h_moddate as (
  select 'ח · טריגרים'::text, 'H-MD'::text, 'moddatetime מהסכמה הנכונה'::text,
         '[1.2] extensions.moddatetime — 🚫 לא public.moddatetime (אינה קיימת)'::text,
         coalesce((select pg_get_triggerdef(oid) from pg_trigger
                    where tgrelid=to_regclass('public.project_changes')
                      and tgname='project_changes_set_updated_at'), '*** חסר ***'),
         case when (select pg_get_triggerdef(oid) from pg_trigger
                     where tgrelid=to_regclass('public.project_changes')
                       and tgname='project_changes_set_updated_at')
                   like '%extensions.moddatetime%'
              then 'PASS' else 'FAIL' end
),

-- ═════════════════ ט. Seed של params ═════════════════
sec_i as (
  select 'ט · params'::text, 'I-01'::text, 'תבנית_מייל_אירוע_בוטל'::text,
         '[1.7] שורה אחת · param_type=templates'::text,
         coalesce((select 'קיימת · type=' || param_type from public.params
                    where param_name='תבנית_מייל_אירוע_בוטל'), '*** חסרה ***'),
         case when (select count(*) from public.params
                     where param_name='תבנית_מייל_אירוע_בוטל' and param_type='templates') = 1
              then 'PASS' else 'FAIL' end
  union all
  select 'ט · params'::text, 'I-02'::text, 'תבנית_מייל_פרטי_האירוע_השתנו'::text,
         '[1.7] שורה אחת · param_type=templates'::text,
         coalesce((select 'קיימת · type=' || param_type from public.params
                    where param_name='תבנית_מייל_פרטי_האירוע_השתנו'), '*** חסרה ***'),
         case when (select count(*) from public.params
                     where param_name='תבנית_מייל_פרטי_האירוע_השתנו' and param_type='templates') = 1
              then 'PASS' else 'FAIL' end
  union all
  -- 🔴 המלכודת של §5: השורה הזאת כבר קיימת מ-23/07. שתי שורות = זריעה כפולה.
  select 'ט · params'::text, 'I-03'::text, 'קישור_בסיס_סקר_לקוחות'::text,
         '[מ3 · 1.7 לא נוגעת בה] בדיוק שורה אחת — לא נזרעה שוב'::text,
         (select count(*)::text from public.params where param_name='קישור_בסיס_סקר_לקוחות'),
         case when (select count(*) from public.params
                     where param_name='קישור_בסיס_סקר_לקוחות') = 1
              then 'PASS' else 'FAIL' end
  union all
  select 'ט · params'::text, 'I-04'::text, 'סף_לקוח_רדום_ימים'::text,
         '[1.7] שורה אחת · value=120 · type=control_alerts (הכרעת A6, ישי 14/08/2026)'::text,
         coalesce((select 'value=' || param_value from public.params
                    where param_name='סף_לקוח_רדום_ימים'), '*** חסרה ***'),
         case when (select count(*) from public.params
                     where param_name='סף_לקוח_רדום_ימים'
                       and param_value='120' and param_type='control_alerts') = 1
              then 'PASS' else 'FAIL' end
  union all
  -- ═══ 🔴 שלוש השורות הבאות נוספו בסבב-הבקרה 14/08/2026 ═══
  -- ‏1.7 זורעת **שש** שורות, והשער בדק ארבע. שלושת ספי-פיצוי-הביטול — שדיאלוג-הביטול
  -- קורא כדי להציג את האחוז, ושמודול 8 יקרא כדי לחשב את התשלום בפועל — **לא נבדקו כלל**
  -- (חיפוש 'פיצוי' בקובץ הזה החזיר אפס). אלה מראת `§7.16ב`, ואיש מלבדם אינו מקבע אותם.
  select 'ט · params'::text, 'I-06'::text, 'שעות_פיצוי_ביטול_מלא'::text,
         '[1.7] value=24 · type=control_alerts (מתחת ל-24ש ⇒ 100% פיצוי)'::text,
         coalesce((select 'value=' || param_value || ' · type=' || param_type from public.params
                    where param_name='שעות_פיצוי_ביטול_מלא'), '*** חסרה ***'),
         case when (select count(*) from public.params
                     where param_name='שעות_פיצוי_ביטול_מלא'
                       and param_value='24' and param_type='control_alerts') = 1
              then 'PASS' else 'FAIL' end
  union all
  select 'ט · params'::text, 'I-07'::text, 'שעות_פיצוי_ביטול_חלקי'::text,
         '[1.7] value=72 · type=control_alerts (מעל 72ש ⇒ 0% פיצוי)'::text,
         coalesce((select 'value=' || param_value || ' · type=' || param_type from public.params
                    where param_name='שעות_פיצוי_ביטול_חלקי'), '*** חסרה ***'),
         case when (select count(*) from public.params
                     where param_name='שעות_פיצוי_ביטול_חלקי'
                       and param_value='72' and param_type='control_alerts') = 1
              then 'PASS' else 'FAIL' end
  union all
  select 'ט · params'::text, 'I-08'::text, 'אחוז_פיצוי_ביטול_חלקי'::text,
         '[1.7] value=50 · type=control_alerts (24–72ש ⇒ 50%)'::text,
         coalesce((select 'value=' || param_value || ' · type=' || param_type from public.params
                    where param_name='אחוז_פיצוי_ביטול_חלקי'), '*** חסרה ***'),
         case when (select count(*) from public.params
                     where param_name='אחוז_פיצוי_ביטול_חלקי'
                       and param_value='50' and param_type='control_alerts') = 1
              then 'PASS' else 'FAIL' end
  union all
  -- 🔴 **38, לא 35** — תוקן בסבב-הבקרה 14/08/2026. הבסיס נמדד חי היום: `select count(*)
  --    from public.params` ⇒ **32**, ו-1.7 זורעת **שש** שורות (שתי תבניות · סף-רדום ·
  --    שלושה ספי-פיצוי), לא שלוש. הציפייה הישנה "35 (32+2+1)" פשוט שכחה את שלושת הספים.
  --    ⚠️ **והוורדיקט הוחמר מ-`INFO` ל-`FAIL`:** אחרי שכל שש השורות נבדקות בשמן
  --    (I-01…I-04 · I-06…I-08), סטייה בסך-הכול פירושה **שורה שנזרעה ואיש לא ביקש** —
  --    למשל זריעה כפולה של קישור-הסקר, שהיא בדיוק המלכודת ש-I-03 מחפשת.
  select 'ט · params'::text, 'I-05'::text, 'סה"כ שורות params'::text,
         '[1.7] 38 (32 בסיס + 2 תבניות + 1 סף-רדום + 3 ספי-פיצוי)'::text,
         (select count(*)::text from public.params) || ' (בסיס שנמדד חי 14/08: 32)',
         case when (select count(*) from public.params) = 38 then 'PASS' else 'FAIL' end
),

-- ═════════════════ י. מצב-הנתונים אחרי מכונת-הסטטוסים ═════════════════
-- 🔴 העוגנים של spec.md §3.2 — הם הבדיקה שמכונת-הסטטוסים באמת רצה, לא רק נוצרה.
-- ⚠️ **ו-`J-01` (‏#3 ⇒ not_started) עובר גם היום, לפני שהוחל דבר** — נמדד בהרצת-יבש
--    14/08 11:4X. הוא אינו ראיה בפני עצמו. **הראיות האמיתיות הן `J-02` ו-`J-03`**:
--    ‏#7 זז ל-`event_finished` רק אם ה-cron (או ההרצה החד-פעמית) באמת רצה, ו-#8 זז
--    ל-`in_progress` רק אם ה-de-dup של `MAX(assignment_number)` עובד.
exp_status(pid, want_status) as (values
  (3, 'not_started'), (7, 'event_finished'), (8, 'in_progress'), (11, 'in_progress')
),
sec_j as (
  select 'י · נתונים'::text as sec,
         'J-' || lpad((row_number() over (order by e.pid))::text, 2, '0') as id,
         'projects #' || e.pid::text as item,
         'project_status = ' || e.want_status as expected,
         coalesce(p.project_status || ' · תאריך=' || p.final_event_date::text, '*** הפרויקט אינו קיים ***') as actual,
         case when p.project_id is null then 'INFO'
              when p.project_status = e.want_status then 'PASS' else 'FAIL' end as verdict
    from exp_status e
    left join public.projects p on p.project_id = e.pid
),
sec_j_nulls as (
  select 'י · נתונים'::text, 'J-NN'::text, 'אפס NULLים בעמודות שהודקו'::text,
         'quote_id=0 · owner_email=0'::text,
         (select 'quote_id=' || count(*) filter (where quote_id is null)::text ||
                 ' · owner_email=' || count(*) filter (where owner_email is null)::text
            from public.projects),
         case when (select count(*) from public.projects
                     where quote_id is null or owner_email is null) = 0
              then 'PASS' else 'FAIL' end
),
-- 🔴 השורה הזאת מנוסחת בלי לגעת בעמודות החדשות בשמן, כדי שהסקריפט כולו ירוץ גם
--    באמצע הפזה ולא רק בסופה. הספירה הערכית עצמה מיותרת: `logistics_origin_exactly_one`
--    כבר מתיר all-NULL רק לשורות-הישנות, ואין backfill מיקומי (המלכודת של serial_number).
sec_j_legacy as (
  select 'י · נתונים'::text, 'J-LG'::text, 'שורות logistics שנולדו לפני מ6'::text,
         'קיימות · שתי עמודות-המקור נשארות NULL — הותר במכוון'::text,
         (select count(*)::text from public.logistics) || ' שורות · עמודות-מקור קיימות: ' ||
         (select count(*)::text from information_schema.columns
           where table_schema='public' and table_name='logistics'
             and column_name in ('quote_service_line_id','project_change_id')) || '/2',
         'INFO'::text
),

-- ═════════════════ כ. תזכורות שאינן ניתנות לבדיקה מ-SQL ═════════════════
-- 🔴 **שתי התחזיות למטה נגזרו מחדש בסבב-הבקרה 14/08/2026, מול הרצה חיה של `get_advisors`
--    ולא מהערכה.** מספר-הבסיס נמדד **היום, לפני שהוחל דבר**: **security = 17 · performance = 20.**
--    *(פירוט הבסיס: security = 4 `rls_enabled_no_policy` — ‏login_attempts · login_rpc_calls ·
--    logistics · salary_reports — + 4 `anon_security_definer` + 8 `authenticated_security_definer`
--    + `auth_leaked_password_protection`. performance = 3 FK-בלי-אינדקס + 1 `no_primary_key`
--    + 16 `multiple_permissive_policies`.)*
sec_k as (
  select 'כ · ידני'::text, 'K-01'::text, 'get_advisors security'::text,
         'בסיס 17 (נמדד חי 14/08) → 23 עם 1.4 · 24 בלעדיה. +7 מקובלות, −1 רק אם 1.4 רצה'::text,
         'להריץ mcp get_advisors type=security ולהשוות'::text, 'MANUAL'::text
  union all
  select 'כ · ידני'::text, 'K-02'::text, 'get_advisors performance'::text,
         'בסיס 20 (נמדד חי 14/08) → צפוי 20 — ללא שינוי. שבעת האינדקסים מכסים כל FK חדשה'::text,
         'להריץ mcp get_advisors type=performance ולהשוות'::text, 'MANUAL'::text
  union all
  select 'כ · ידני'::text, 'K-03'::text, 'docs/schema.sql'::text,
         'רענון מ-Supabase Studio → SQL → Snapshots. 🔴 אינו נגזר מ-SQL — פעולת-ישי'::text,
         'פרומפט 🧩 בקובץ ההערות'::text, 'MANUAL'::text
  union all
  select 'כ · ידני'::text, 'K-04'::text, 'db_roadmap.md'::text,
         '18 שורות להיפוך: M6-1…M6-14 · A-14 · שלוש שורות §5 · A-20'::text,
         'הרשימה המלאה והמדויקת בקובץ ההערות'::text, 'MANUAL'::text
  union all
  select 'כ · ידני'::text, 'K-05'::text, 'ספירת 🚧 מ6'::text,
         'להשוות מול הספירה שנלקחה בתחילת הפזה — אף אחד לא נשמט'::text,
         'grep ''🚧 מ6'' על docs/ ו-src/'::text, 'MANUAL'::text
  union all
  select 'כ · ידני'::text, 'K-06'::text, 'deno check על ה-Edge Function'::text,
         'npx deno check --node-modules-dir=none supabase/functions/send-email/index.ts → exit 0'::text,
         'זה מה ש-CI מריץ ב-edge-function-check'::text, 'MANUAL'::text
)

select sec as "סעיף", id as "מזהה", item as "מה נבדק",
       expected as "מצופה", actual as "בפועל", verdict as "תוצאה"
from (
  select * from sec_a          union all select * from sec_a_drop
  union all select * from sec_a_count
  union all select * from sec_b union all select * from sec_b_email
  union all select * from sec_b_fk
  union all select * from sec_c
  union all select * from sec_d union all select * from sec_d_pc
  union all select * from sec_d_log_only union all select * from sec_d_email
  union all select * from sec_d_storage  union all select * from sec_d_storage_split
  union all select * from sec_e
  union all select * from sec_f
  union all select * from sec_g union all select * from sec_g_path
  union all select * from sec_h union all select * from sec_h_recurse
  union all select * from sec_h_moddate
  union all select * from sec_i
  union all select * from sec_j union all select * from sec_j_nulls
  union all select * from sec_j_legacy
  union all select * from sec_k
) all_checks
order by "סעיף", "מזהה";

-- =====================================================================================
-- שאילתה נלווית (להריץ בנפרד רק אם משהו למעלה נכשל) — סיכום בשורה אחת:
-- =====================================================================================
-- select verdict, count(*) from ( … אותו בלוק … ) x group by verdict order by verdict;
--
-- 🔴 **קריאת התוצאה:** ‏`FAIL` = משהו שהוחל נשבר ⇒ לתקן. ‏`PENDING-1.4` / `PENDING-1.6` =
--    הצעד לא היה באצווה ⇒ **להחיל אותו**, לא "לאשר בכל זאת". ‏`ADVISORY`/`INFO`/`MANUAL`
--    אינם חוסמים. **פזה 1 ירוקה רק כשאין ולו `FAIL` ואין ולו `PENDING`.**
--
-- =====================================================================================
-- 📐 גזירת תחזית-היועץ — המספרים, ומאיפה כל אחד מהם (נגזר מחדש 14/08/2026 בסבב-הבקרה)
-- =====================================================================================
-- **בסיס נמדד חי היום, לפני שהוחל דבר: security = 17 · performance = 20.**
--
-- ── security: 17 → 23 (עם 1.4) ─────────────────────────────────────────────────────
--   ‏**+7** ‏`authenticated_security_definer_function_executable` — שבע ה-RPC של מ6 שנקראות
--        מהדפדפן (‏`list_projects_overview` · `update_project_details` · `apply_scope_change` ·
--        `cancel_project` · `close_project_operationally` · `mark_feedback_survey_sent` ·
--        `set_project_finance_fields`). 🔴 **אלה אזהרות מקובלות ומכוונות** — פונקציה
--        ש-`authenticated` חייב להריץ תמיד תדליק אותן; השער האמיתי הוא
--        `assert_module_permission` בתוך הגוף. הבדיקה `G-01…G-10` למעלה היא שמאמתת זאת.
--   ‏**+0** ‏`anon_security_definer` — שלוש הפונקציות הפנימיות (`assert_module_permission` ·
--        `recompute_project_status` · `trg_recompute_project_status`) מקבלות `revoke` מפורש
--        מ-`public, anon, authenticated` ⇒ אינן מדליקות דבר. ‏`G-SP`+`G-01…` מאמתות.
--   ‏**−1** ‏`rls_enabled_no_policy` על `logistics` — נסגר **רק ע"י צעד 1.4**.
--        ⚠️ ‏`project_changes` **אינה** מוסיפה ממצא כזה: 1.2 יוצרת את הטבלה **ואת
--        המדיניות באותה מיגרציה**, ולכן היא לעולם אינה קיימת במצב deny-all.
--   ⇒ **‏17 + 7 − 1 = 23 עם 1.4 · 17 + 7 = 24 בלי 1.4.** מספר גבוה מ-23/24 = ממצא אמיתי.
--
-- ── performance: 20 → 20 (ללא שינוי) ───────────────────────────────────────────────
--   🔴 **וזו הגזירה שהשתנתה בסבב-הבקרה.** הקובץ ניבא קודם "20 עם ארבעת האינדקסים ·
--   ‏24 בלעדיהם", בהנחה שארבעת אינדקסי-ה-FK הם **המלצה פתוחה**. נמדד: הם **כבר כתובים
--   בשתי המיגרציות** (`m6_step_1_1.sql:114-117` יוצרת `projects_cancelled_by_idx` ו-
--   `projects_operationally_closed_by_idx`; `m6_step_1_2.sql:117-118` יוצרת
--   `project_changes_sku_idx` ו-`project_changes_performed_by_idx`). ⇒ תרחיש "בלעדיהם"
--   אינו קיים, וסעיף ג' שונה בהתאם מ-`ADVISORY` ל-`REQUIRED`.
--   ‏**+0** ‏`unindexed_foreign_keys` — שבע ה-FK החדשות מכוסות כולן:
--        ‏5 של 1.1/1.2 באינדקסים למעלה (‏`project_changes_project_id_idx` הוא
--        `(project_id, created_at desc)` — עמודה מובילה = עמודת-ה-FK ⇒ מכסה), ו-2 של 1.4
--        ב-`logistics_*_idx`.
--   ‏**+0** ‏`multiple_permissive_policies` — ל-`project_changes` יש **מדיניות אחת** (AS-2),
--        ל-`logistics` אחת, ו-`email_log` **כבר** מופיעה ברשימה היום ⇒ הוספת מדיניות
--        שלישית אינה מוסיפה **שורת-ממצא** (הלינט הוא פר טבלה×תפקיד×פעולה, לא פר-מדיניות).
--   ‏**+0** מ-`storage.objects`, אף שהוא עובר מ-4 מדיניות ל-12 (3 לכל פעולה, כולן
--        ל-`authenticated`). 🔴 **נמדד ולא הונח:** קיימות היום FK **בלי אינדקס מכסה**
--        בסכמות `storage` ו-`auth` (למשל `s3_multipart_uploads_parts_upload_id_fkey` ·
--        `vector_indexes_bucket_id_fkey` · `auth.oauth_authorizations_user_id_fkey`),
--        ו**היועץ אינו מדווח על אף אחת מהן** — כל 20 ממצאי-הביצועים הם ב-`public`.
--        ⇒ הליבה סורקת את `public` בלבד, ולכן שמונה המדיניות של 1.5 שקופות ליועץ.
--   ⇒ **20 → 20.** כל מספר גבוה מ-20 הוא ממצא אמיתי שיש לפתוח.
-- =====================================================================================
