-- =====================================================================================
-- מודול 6 (פרויקטים) — מיגרציה C: שלוש עמודות-הנוכחות על `assignments` + אילוצי-עקביות
-- שם-קובץ מוצע: 20260814115047_module6_assignments_attendance.sql
-- =====================================================================================
-- why: לשונית "סגירת אירוע" (משטח 5, אושר 13/08/2026) היא **מקור-האמת היחיד** לשאלה
--   "האם הדיילת הגיעה". בלי שלוש העמודות האלה מרכיב-האמינות של Smart Match — **המשקל
--   הגדול ביותר, `0.35`** — נשאר כבוי. ‏`docs/specs/module_06_projects/spec.md §1.4`:
--   *"שבע אפשרויות-הנוכחות — פקד אחד שטוח על המסך, שלוש עמודות במסד"*, ו-`screens-approved`
--   §🗄️ פריטים 1–5 מונה בדיוק את חמשת הפריטים שהמיגרציה הזאת יוצרת.
--   ‏`db_roadmap` שורה **M6-4** · מדריך-המיקרו של מודול 6, צעד **1.3**.
--
-- 🔴 **המיפוי המלא — שבע בחירות על המסך, שלוש עמודות במסד** (‏`spec.md §1.4`, מילה-במילה):
--     הגיעה                     ⇒ arrived | null   | null
--     איחרה — קל                ⇒ late    | light  | null
--     איחרה — בינוני            ⇒ late    | medium | null
--     איחרה — רב                ⇒ late    | heavy  | null
--     לא הגיעה — חולה           ⇒ no_show | null   | sick
--     לא הגיעה — אישור מראש     ⇒ no_show | null   | approved_absence
--     לא הגיעה — הבריזה         ⇒ no_show | null   | ghosted
--
-- 🔴 **שלוש העמודות נשארות `nullable`, וזה לא שכחה:** שיבוץ שטרם נסגר אינו נושא נוכחות,
--   ואין לו ברירת-מחדל הגיונית. **החובה נאכפת ב-RPC של הסגירה ובטופס** — ‏`screens-approved`
--   מסך 5 §⑦: *"נוכחות (כל שורה) — חובה … 'חסר סימון נוכחות ל-‹שם›.'"*
--
-- 🔴 **מה המיגרציה הזאת *אינה* עושה, ורשום כאן כדי שלא ייבנה פעמיים:**
--   ① ‏`assignments.actual_hours` **כבר קיימת** (`numeric not null default 0` — נמדד חי
--      14/08/2026). ‏🚫 לא מוסיפים אותה, לא משנים את הטיפוס שלה ולא נוגעים בברירת-המחדל.
--   ② **סימון-האיכות התלת-מצבי אינו יושב על `assignments`.** הוא יושב על
--      `customer_hostess_preference.preference` — טבלה שנוצרה במ4 ו**קיימת חיה**, עם
--      `check (preference in ('מצוינת','בסדר','לא_לשלוח'))` ועם
--      `customer_hostess_preference_negative_needs_reason`. **הכרעת-ישי B13 (14/08/2026) —
--      דריסה בלי טבלת-היסטוריה — מתקיימת כבר היום ב-`unique (customer_id, hostess_id)`.**
--      ⇒ **אין כאן עמודת `quality_mark`, ואין צורך בה.**
--   ③ **אין `final_gross_profit`** — ‏AR-6: ההקפאה הכספית היא של מ8.
--
-- reversibility: **הפיכה במלואה.** ‏`alter table public.assignments drop column
--   attendance_status, drop column lateness_level, drop column no_show_reason;`
--   (הפלת עמודה מפילה איתה את האילוצים שנשענים עליה). **אף שורה קיימת אינה נמחקת ואינה
--   משתנה** — שלוש העמודות נולדות `null` בכל 10 השורות הקיימות.
--
-- Migration Design Checklist (‏`db_roadmap` §1):
--   [x] הפיכה — כן, ר' למעלה.
--   [x] נעילה — ‏`ACCESS EXCLUSIVE` קצרצר; עמודה `nullable` בלי `default` היא שינוי-מטא-דאטה
--       בלבד ב-PG11+, והטבלה נושאת **10 שורות** (נמדד חי).
--   [x] שורה קיימת שמפרה אילוץ חדש — **נספר לפני:** ‏`select count(*) from
--       public.assignments where actual_hours <> 0` ⇒ **0** (נמדד 14/08/2026 11:4X).
--       ⇒ ‏`assignments_no_show_zero_hours` אינו יכול להיכשל על נתונים קיימים, ואילוץ-הצורה
--       אינו יכול להיכשל כי שלוש העמודות נולדות `null`.
--   [x] FK חדש — אין.
--   [x] ‏`timestamptz` — אין עמודות-זמן חדשות כאן.
--   [x] ‏Seed — אין. Storage — אין.
--   [x] פונקציה שמודול אחר קורא — **אין `create or replace` כאן כלל**, ולכן סעיף
--       `pg_get_functiondef` של פרוטוקול-המיגרציה אינו חל על הצעד הזה.
-- =====================================================================================

-- ‏🔴 **כל אילוץ מקבל שם מפורש** (כלל-הבית): הקוד ממפה **שם-אילוץ** להודעה עברית
-- (`SERVER_CONSTRAINT_RULES`, ‏`src/lib/hostesses.js:603-613`), ושם שנוצר אוטומטית הוא באג.
-- השמות נבחרו בקונבנציה שכבר חיה בטבלה הזאת — `assignments_assignment_status_check`.
--
-- ‏**שתי הצהרות בלבד** — שלוש העמודות יחד, ואז שני אילוצי-העקביות יחד. ‏🔑 **ולמה לא הצהרה
-- אחת:** ‏`add constraint` שנשען על עמודה שנוספה **באותה** הצהרה נשען על סדר-הפאזות הפנימי
-- של `ALTER TABLE` — נכון, ולא קריא. שתי הצהרות עולות נעילה שנייה בת מילישניות על טבלה בת
-- 10 שורות, ומסירות את התלות לגמרי.
alter table public.assignments
  -- ① מה קרה, ברמה הגסה (‏`screens-approved` §🗄️ פריט 1)
  add column attendance_status text
    constraint assignments_attendance_status_check
    check (attendance_status in ('arrived', 'late', 'no_show')),

  -- ② דרגת-האיחור — רק כשיש איחור (‏פריט 2)
  add column lateness_level text
    constraint assignments_lateness_level_check
    check (lateness_level in ('light', 'medium', 'heavy')),

  -- ③ סיבת אי-ההגעה — רק כשלא הגיעה (‏פריט 3).
  -- 🔴 ‏`sick` ו-`approved_absence` **אינם ענישה**: ‏`smartMatch.js:54-55` מחריג אותם
  --    מהבסיס לגמרי — לא במונה ולא במכנה. רק `ghosted` שקול ל-`הבריזה` בציון.
  add column no_show_reason text
    constraint assignments_no_show_reason_check
    check (no_show_reason in ('sick', 'approved_absence', 'ghosted'));

alter table public.assignments
  -- ④ אילוץ-העקביות בין השלוש (‏פריט 4) — **שבע הצורות החוקיות של §1.4, ועוד אחת:
  --    "טרם נסגר" = שלושתן `null`.** כל השאר נחסם.
  -- ⚠️ **סטייה מכוונת מנוסח-המדריך, ואינה מוצרית:** המדריך פותח ב-`attendance_status is null
  --    or …` — ניסוח שמתיר שורה עם `attendance_status = null` ו-`lateness_level = 'light'`,
  --    כלומר **דרגת-איחור בלי איחור**. אין לצירוף הזה שורה בטבלת §1.4, וההידוק נאמן לה
  --    בדיוק. (‏אין לו מחיר: כל 10 השורות הקיימות נושאות שלושה `null`.)
  add constraint assignments_attendance_shape check (
    (attendance_status is null    and lateness_level is null     and no_show_reason is null)
    or (attendance_status = 'arrived' and lateness_level is null     and no_show_reason is null)
    or (attendance_status = 'late'    and lateness_level is not null and no_show_reason is null)
    or (attendance_status = 'no_show' and lateness_level is null     and no_show_reason is not null)
  ),

  -- ⑤ "לא הגיעה" ⇒ אפס שעות (‏פריט 5).
  -- ‏`screens-approved` מסך 5: *"בחירה שמתחילה ב'לא הגיעה' … מאפסת את השעות ל-`0`"* —
  -- וכאן זה נאכף במסד, לא רק בטופס. ‏`actual_hours` הוא `not null` ⇒ אין מקרה-`null`.
  -- 🔑 **והאילוץ אינו חוסם את "הגיעה לחצי שעה והלכה"**: מי שהגיעה מסומנת `arrived`/`late`
  --    ושעותיה נכתבות כרגיל; רק `no_show` — מי שלא ראו אותה — מחויבת ל-`0`.
  add constraint assignments_no_show_zero_hours check (
    attendance_status is distinct from 'no_show' or actual_hours = 0
  );

-- ‏🧩 חוזה מול הקוד (שלב 2.7): המיפוי מהעמודות האלה ל-`ATTENDANCE_OUTCOMES`
-- (`src/lib/smartMatch.js:43-52`, **שמונה חברים**) אינו 1:1 — `WITHDREW` **אינו ערך-נוכחות
-- כלל** ומגיע מ-`assignment_status = 'approval_withdrawn'`. הטבלה המלאה בקובץ ההערות
-- שליד המיגרציה הזאת. **שינוי שם של אחת משלוש העמודות מפיל את `reliabilityScore`
-- ל-`undefined` בשקט** (`smartMatch.js:207` — `if (value === undefined) continue`).
--
-- ‏🔻 בדיקת-הקבלה (18 צירופים, קריאה-בלבד + בלוק שמגלגל את עצמו אחורה) יושבת ב-
-- `m6_step_1_3.notes.md` תחת "מה מדדתי". **להריץ אחרי ההחלה.**
