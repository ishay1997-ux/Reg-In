-- =====================================================================================
-- מודול 6 · צעד 1.8 — חלק א': **הקוראת והסוגרות** (4 מתוך 7 ה-RPC) + עוזר-השער המשותף
-- שם-קובץ מוצע: <ts>_module6_rpcs_reads_and_close.sql
--   ⚠️ **תוקן בסבב-הבקרה 14/08/2026:** היה `module6_rpc_…` ביחיד מול `module6_rpcs_writes` ברבים
--   בקובץ של חלק ב'. המדריך (‏`module-6.md:144`) כותב `<ts>_module6_rpcs.sql` — **רבים** ⇒ הזוג
--   הוא `module6_rpcs_reads_and_close` / `module6_rpcs_writes`.
-- נכתב 14/08/2026 · כל שם-טבלה, שם-עמודה, ערך-אילוץ ומחרוזת-מודול כאן **נמדדו חי**
--   מול ‏`yfeovxppnfoafmfbdfvh` לפני הכתיבה. ‏🚫 אפס ניחושים.
-- =====================================================================================
--
-- why (‏AR-3): שני המדדים של מבט-העל — דיילות מאושרות ולוגיסטיקה מוכנה — **חייבים להיספר
--   בשרת.** ‏`assignments` נעולה על `'דיילות'` ו-`quote_services` על `'הצעות מחיר'`; מנהלת
--   הלוגיסטיקה חסומה בשתיהן (נמדד חי) ⇒ צירוף בצד-הדפדפן היה מחזיר לה `0/6` בכל שורה,
--   כלומר **שקר על המסך שכל עבודתה יושבת בו.** ‏`SECURITY DEFINER` + שער מפורש הוא הפתרון,
--   ו-🚫 **לא `view`** — נמדד: אפס `create view` בכל הריפו.
--
-- why (‏AR-5 — הגבול הכבד ביותר): **בתוך הטרנזקציה נכנס רק מה שהוא עובדה על מה שקרה.
--   כל שליחה נשארת בחוץ, אחרי ה-commit, בקוד-הלקוח.** ‏`close_project_operationally`
--   **אינה כותבת `feedback_status` ואינה שולחת דבר** — כתיבת `'sent'` כאן היא שקר ברגע
--   שהשליחה נכשלת. ‏`mark_feedback_survey_sent` היא ה-RPC הצרה שכותבת `feedback_status`
--   ו**לא-כלום מלבדו**, והיא **פטורה מנעילת ㉙** (‏AS-5) — אחרת לשליחה שנכשלה אין דרך חזרה.
--
-- why (㉘): ‏`set_project_finance_fields` נשמרת על **`'כספים'`** ולא על `'פרויקטים'`.
--   נמדד חי: `מנהלת כספים ולקוחות` = `view` על פרויקטים + `edit` על כספים ⇒ בלי ה-RPC הזו
--   אין לה שום מסלול-כתיבה חוקי, ועם policy-כתיבה על `projects` היו נפתחות לה כל 28 העמודות.
--
-- 🔴 **סדר-החלה מחייב: ‏1.1 → 1.3 → 1.8.** ‏PL/pgSQL אינו מאמת שמות-עמודות בזמן היצירה ⇒
--   הקובץ הזה **ייווצר בהצלחה** גם בלי הצעדים הקודמים, וייפול ב-`42703` בקריאה הראשונה.
--   העמודות שהוא נשען עליהן ונמדדו כ**לא-קיימות היום**:
--     · ‏1.1 → `projects.cancelled_at` · `cancel_type` · `operationally_closed_at` · `operationally_closed_by`
--     · ‏1.3 → `assignments.attendance_status` · `lateness_level` · `no_show_reason`
--
-- 🔴 **מוסכמות שנמדדו ומחייבות כל שורה כאן:**
--   ‏(א) `set search_path = ''` — **14 מתוך 14 הפונקציות החיות משתמשות בזה**, ולכן כל אובייקט
--       שאינו של `pg_catalog` מוסמך במלואו (`public.x` · `auth.email()`).
--   ‏(ב) `42501` להרשאה · `P0001` לכלל-עסקי. תקדים חי: `set_project_coordinates` זורק `42501`,
--       ‏`enforce_quote_in_progress_lock` זורק `P0001`, ו-`hostessServerErrorMessage`
--       (`src/lib/hostesses.js:620`) כבר מסתעף על `42501`.
--   ‏(ג) כל טקסט-שגיאה — **עברית, נקבה.** חמש המשתמשות כולן נשים.
--   ‏(ד) 🚫 **לא כותבים `updated_at` ביד.** נמדד חי: `projects_set_updated_at` ·
--       ‏`assignments_set_updated_at` · `customer_hostess_preference_set_updated_at` — שלושתם
--       ‏`BEFORE UPDATE … moddatetime('updated_at')`. כתיבה ידנית היא בית שני לאותה עובדה.
--   ‏(ה) 🚫 **אין `exception when unique_violation`** (‏AR-10) — המרת `23505` מוחקת את
--       שם-האינדקס, ו-`SERVER_CONSTRAINT_RULES` מזהה **לפי השם**. גיבוי שלא יכול לירות
--       אינו גיבוי. *(רלוונטי בעיקר לפונקציות של חלק ב'; נרשם כאן כי הכלל חל על הצעד כולו.)*
-- =====================================================================================


-- =====================================================================================
-- ‏§1 · עוזר-השער המשותף
-- ⚠️ **הפונקציה הזו מופיעה גם בקובץ של חלק ב' של אותו צעד — ‏🔴 זהה סמנטית, לא זהה בייט-לבייט.**
--    *(תוקן בסבב-הבקרה 14/08/2026. הנוסח הקודם כאן טען "בגוף זהה בייט-לבייט" — **וזה לא נכון**:
--    ‏`diff` בין שני הגופים מראה חתימה מקופלת לשורה אחת בחלק ב', ארבע שורות-הערה שקיימות רק שם,
--    ו-`raise … using errcode` מפוצל לשתי שורות כאן ומאוחד שם. **הפרמטרים והטיפוסים זהים**
--    (`p_module text, p_level text[]`) ⇒ ה-`create or replace` השני אינו `42P13` ואינו משנה
--    התנהגות, והוא **משמר** את ה-ACL שנקבע ב-`revoke` של הקובץ הזה.)*
--    ⇒ **מי שמאחד את שני הקבצים משאיר עותק אחד — של חלק ב'**, שנושא את הערת-שמות-המודולים.
-- =====================================================================================
-- why: שבע ה-RPC של מ6 הן **יחידת-ההרשאה** (㉘) ⇒ שער אחד, כתוב פעם אחת. שכפול של
--   תת-השאילתה בשבעה גופים היה מייצר שבעה מקומות לטעות בהם באיות מחרוזת עברית.
-- 🔴 מחרוזות המודולים נקראו חי מ-`public.modules` ב-14/08/2026 ואומתו גם ב-hex:
--    ‏`'פרויקטים'`=3 · `'דיילות'`=4 · `'לוגיסטיקה'`=5 · `'כספים'`=6 · `'הצעות מחיר'`=2.
--    **טעות-הקלדה בת תו אחד הופכת את תת-השאילתה ל-NULL והשער נסגר בשקט.**
-- 🔴 `permission_level` נושא גם את הערך `'blocked'` (נמדד) ⇒ ההשוואה היא `= any(p_level)`
--    עם רשימה מפורשת, ולעולם לא "קיימת שורה".
create or replace function public.assert_module_permission(
  p_module text,
  p_level  text[]
) returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if not exists (
    select 1
      from public.permissions p
     where p.role_id = (select public.current_user_role_id())
       and p.module_id = (select m.module_id from public.modules m where m.module_name = p_module)
       and p.permission_level = any(p_level)
  ) then
    raise exception 'אין לך הרשאה לבצע פעולה זו במודול %', p_module
      using errcode = '42501';
  end if;
end
$$;


-- =====================================================================================
-- ‏§2 · ① `list_projects_overview()` — הקוראת היחידה (‏AR-3)
-- =====================================================================================
-- why: משטח 1 מציג לכל פרויקט שני מדדים נפרדים (⑨ — לעולם לא ממוזגים לאחוז אחד) ואת
--   ההכנסה המתוכננת. שלושתם יושבים בטבלאות שהקוראת אינה מורשית לקרוא ⇒ נספרים כאן.
--
-- 🔴 **קיפול ה-de-dup, ולמה הוא הכרחי לשני המונים ולא רק לאחד:** לדיילת יכולות להיות כמה
--   שורות `assignments` על אותו פרויקט (‏`assignments_pkey = (project_id, hostess_id,
--   assignment_number)`, נמדד). נמדד חי על `#8`: **9 שורות · 6 דיילות** — ‏`hostess_id=41`
--   נושאת שלוש שורות ו-`29` שתיים (סירבה ואז זומנה מחדש). ⇒ ספירה נאיבית הייתה מונה
--   זימונים במקום דיילות. השורה הקובעת היא **`MAX(assignment_number)` פר-דיילת**, וזו
--   **המימוש השני** של אותו קיפול — הראשון הוא `finalAssignmentRows`
--   (`src/lib/hostesses.js:250-272`). מספרי-העוגן של `spec.md §3.2` הם מה שמצמיד ביניהם.
--
-- 🔴 **`planned_revenue` — NULL ולא 0** (‏S-2). ‏`SECURITY DEFINER` יכולה לקרוא
--   ‏`quote_services` עבור כל קוראת ⇒ **חייבים לחשב את ראות-הקוראת במפורש**, אחרת
--   מנהלת-הלוגיסטיקה (‏`blocked` על `'הצעות מחיר'`, נמדד) הייתה רואה סכום שה-RLS שולל ממנה.
--   שלושת המצבים שמחזירים NULL: אין `quote_id` · אין הרשאה · אפס שורות (‏`sum` על אפס
--   שורות מחזיר NULL מעצמו). **`0` שמור לאפס אמיתי** — *"‏«0 ₪» נקרא כעובדה שקרית"*
--   (`StatTile.jsx:25`).
--
-- 🔴🔴 **וההנחות — תוקן בסבב-הבקרה 14/08/2026.** הנוסח הקודם כאן חישב
--   ‏`Σ(qty × closing_unit_price)` **בלי שום איבר-הנחה** ⇒ פרויקט `#8` החזיר `6,300.00`
--   במקום `5,355.00 ₪` — **סתירה ספרה-בספרה לעוגן המחושב-ביד** של `spec.md §3.1`, שהוא
--   קריטריון-הקבלה #9 (`spec.md:455`). ⚠️ **והפער הזה עובר בקריאה:** מספר סביר, בסדר-גודל
--   נכון, שמפיל דוח.
--   ‏**מקור-האמת לחשבון הוא `src/lib/pricing.js:105-124`, ואינו נגזר מחדש כאן:**
--     ‏`discount = round(subtotal × (applied_customer_discount + manual_discount) / 100)`
--     ‏`preVat   = subtotal − discount`
--   ‏🔴 **ההנחות מתחברות בחיבור ולא בשרשור** (‏§7.26 · F7, הכרעת-ישי 07/07): ‏5% ו-10% הן 15%
--   מסכום-הביניים. ‏**שרשור** (`6,300 × 0.95 × 0.90`) נותן `5,386.50` — פער של `31.50 ₪`.
--   ‏🔴 **וההכנסה המתוכננת היא לפני מע"מ** — ‏`6,318.90` שם עובר כל בדיקת-סכימה ושוגה.
--   ‏**נמדד חי 14/08/2026:** ‏`applied_customer_discount` ו-`manual_discount` שתיהן `NOT NULL`
--   ב-`public.quotes` ⇒ אין צורך ב-`coalesce`, וצירוף שלו היה מסתיר עמודה שהתרוקנה.
--   ‏**נמדד גם:** ‏`max(scale(closing_unit_price)) = 2` על 28 השורות החיות.
--   ⚠️ **ולמה `sub − round(discount,2)` ולא `round(sub × (1−pct/100), 2)`:** השתיים זהות כל
--   עוד לסכום-הביניים אין יותר משתי ספרות-עשרוני (נמדד: כל 12 ההצעות החיות מסכימות בין
--   שתי הצורות). **הן נפרדות ברגע שיש שלוש** — ‏`(100.005, 10%)` → ‏`90.005` מול `90.00` —
--   ‏**והצורה שנבחרה היא זו שמשקפת את `pricing.js` מילה-במילה: מעגלים את ההנחה, ואז מחסרים.**
--
-- 🔴 **שתי מלכודות-טיפוס שנסגרו כאן:**
--   ‏· שמות עמודות-הפלט הם פרמטרי-OUT ו**מצלים** עמודות-טבלה ⇒ **כל טבלה מקבלת alias וכל
--     עמודה מוסמכת**, אחרת `42702 column reference … is ambiguous`.
--   ‏· `count(*)` הוא `bigint` ⇒ כל מונה מומר `::integer`, אחרת `42804`.
--
-- ⚠️ `final_location` מוחזרת ואינה מרונדרת במבט-העל (‏S-8 שולל עמודת-מיקום). היא בחוזה כי
--   המדריך מנה אותה; אין להסיק ממנה שמשטח 1 מציג מיקום.
-- ⚠️ המיון הוא `project_id` בלבד — **מיון-תצוגה הוא הכרעת-מוצר של ⑧/S-7 ואינו נקבע כאן.**
--   סדר קבוע נחוץ רק כדי שהפלט לא ישתנה בין קריאות.
create or replace function public.list_projects_overview()
  returns table (
    project_id              integer,
    event_name              text,
    customer_name           text,
    final_event_date        date,
    final_start_time        time without time zone,
    final_end_time          time without time zone,
    final_location          text,
    project_status          text,
    required_hostess_count  integer,
    hostesses_confirmed     integer,
    pending_invites         integer,
    assignments_row_count   integer,
    logistics_ready         integer,
    logistics_total         integer,
    cancelled_at            timestamptz,
    cancel_type             text,
    planned_revenue         numeric
  )
  language plpgsql
  stable
  security definer
  set search_path = ''
as $$
declare
  v_can_read_quotes boolean;
begin
  -- ① השער. ‏`view` מספיק — זו קריאה.
  perform public.assert_module_permission('פרויקטים', array['edit', 'view']);

  -- ② ראות-הקוראת על `'הצעות מחיר'`, מחושבת פעם אחת ולא פר-שורה (‏S-2).
  select exists (
    select 1
      from public.permissions p
     where p.role_id = (select public.current_user_role_id())
       and p.module_id = (select m.module_id from public.modules m where m.module_name = 'הצעות מחיר')
       and p.permission_level = any(array['edit', 'view'])
  ) into v_can_read_quotes;

  return query
  select
      p.project_id,
      p.event_name,
      -- 🔴 מהעמודה-הצילום `projects.customer_name`, **לא בצירוף ל-`customers`** —
      --    ‏`מנהלת גיוס` ו-`מנהלת לוגיסטיקה` חסומות על לקוחות (‏S-13).
      p.customer_name,
      p.final_event_date,
      p.final_start_time,
      p.final_end_time,
      p.final_location,
      p.project_status,
      p.required_hostess_count,
      -- מאושרות סופית, אחרי הקיפול
      (select count(*)
         from (select distinct on (a.hostess_id) a.assignment_status
                 from public.assignments a
                where a.project_id = p.project_id
                order by a.hostess_id, a.assignment_number desc) w
        where w.assignment_status = 'finally_approved')::integer,
      -- ממתינות למענה, **אותו קיפול** — דיילת שסירבה ואז זומנה מחדש היא זימון אחד ממתין
      (select count(*)
         from (select distinct on (a.hostess_id) a.assignment_status
                 from public.assignments a
                where a.project_id = p.project_id
                order by a.hostess_id, a.assignment_number desc) w
        where w.assignment_status = 'pending')::integer,
      -- 🔴 ספירה **גולמית** ובכוונה: `S-6` צובע שורה אדומה על **אפס שורות זימון**,
      --    ושורת-המשנה של אריח 1 סופרת אירועים שלא נשלח בהם אף זימון. שאלה אחרת מ"כמה ממתינים".
      (select count(*)
         from public.assignments a2
        where a2.project_id = p.project_id)::integer,
      (select count(*) filter (where l.item_status = 'ready')
         from public.logistics l
        where l.project_id = p.project_id)::integer,
      -- 🔴 `logistics_total = 0` הוא ✅ ולא ⚠️ (הכרעת-ישי 08/08/2026: אפס שורות = הושלם).
      --    `#11` הוא המקרה החי — הצעה בת שורת-דיילות אחת בלבד ⇒ אפס שורות לוגיסטיקה.
      (select count(*)
         from public.logistics l2
        where l2.project_id = p.project_id)::integer,
      p.cancelled_at,
      p.cancel_type,
      -- ‏`s.sub` הוא סכום-הביניים; ההנחה מעוגלת לאגורה **ואז** מחוסרת — סדר-הפעולות של
      -- ‏`computeQuoteTotals`. ‏`s.sub` הוא NULL כשאין שורות ⇒ הביטוי כולו NULL (מצב ③).
      case
        when v_can_read_quotes and p.quote_id is not null
          then (select s.sub
                       - round(s.sub * (q.applied_customer_discount + q.manual_discount) / 100.0, 2)
                  from public.quotes q
                  cross join lateral (select sum(qs.qty * qs.closing_unit_price) as sub
                                        from public.quote_services qs
                                       where qs.quote_id = q.quote_id) s
                 where q.quote_id = p.quote_id)
        else null
      end
    from public.projects p
   order by p.project_id;
end
$$;


-- =====================================================================================
-- ‏§3 · ⑤ `close_project_operationally(...)` — הסגירה התפעולית (‏ט4-ד · ㉙ · AR-5 · AR-6)
-- =====================================================================================
-- why: *"שמור ושלח"* היא **פעולה אטומית אחת** (‏ט4-ד) — כישלון באמצע חייב להחזיר הכל,
--   אחרת פרויקט "נסגר" עם חצי מהנתונים. הפונקציה כותבת **רק עובדות**: מה קרה באירוע.
--
-- 🚫 **אפס חישובי-רווח ואפס עמודת-רווח** (‏AR-6, הבהרת-ישי 14/08/2026 01:17) — ההקפאה
--   הפיננסית היא של מ8. 🚫 **אינה כותבת `feedback_status` ואינה שולחת דבר** (‏AR-5).
--
-- 🔴 **פרדיקט-הכניסה הפוך ואינו שלילת-הפרדיקט של האחרות** (‏§9 בחוזה): הסגירה **דורשת**
--   ‏`event_finished` + לא-סגור + נתיב-דוח. **היא זו שקובעת את הנעילה.**
--
-- 🔴 **המטען נושא `hostess_id` **ו-`assignment_number`**, והשרת גוזר בעצמו ומשווה**
--   *(עודכן בסבב-הבקרה 14/08/2026 — קודם לכן המטען נשא `hostess_id` בלבד, בניגוד לחוזה)*.
--   הגזירה היא `MAX(assignment_number)` פר-דיילת — אותו קיפול של `list_projects_overview`
--   ומאותה סיבה: ל-`hostess_id=41` בפרויקט 8 יש שלוש שורות. כתיבה ל-`assignment_number = 1`
--   היא כתיבה לשורה היסטורית שאיש לא קורא.
--   ‏**⇒ הגזירה כותבת; המטען מאמת.** ‏`assignment_number` שאינו תואם ⇒ `P0001` שאומר
--   *"רענני את המסך"*, כי המשמעות היא **מסך שהתיישן**, לא טעות של המשתמשת.
--   **והאימות דו-כיווני:** כל מאושרת-סופית מופיעה במטען בדיוק פעם אחת, ואין במטען מי שאינה.
--
-- 🔤 **שמות-המפתחות במטען הם החוזה של `module-6.md §PAYLOAD CONTRACTS`** (מחייב על פזות
--   ‏1·2·3, נוסף 14/08/2026 בבקשת-ישי): ‏`hostess_id` · `assignment_number` ·
--   ‏`attendance_status` · `lateness_level` · `no_show_reason` · `actual_hours` ·
--   ‏**`preference`** · `preference_reason`. 🚫 **ולא `quality_mark`** — השם שהיה בטיוטה.
--
-- 🔴 **אוצר-המילים של הנוכחות אינו נקבע כאן.** הוא נקבע ב-CHECK של צעד 1.3
--   (`assignments_attendance_status_check` · `assignments_lateness_level_check` ·
--    `assignments_no_show_reason_check` · `assignments_attendance_shape`).
--   הפונקציה הזו מכירה **ערך אחד בלבד** — `'no_show'` — כי ט4-א מוגדרת עליו; כל השאר
--   נאכף ע"י ה-CHECK, ששמו הוא שם-האילוץ שהקוד ממפה להודעה (אותו דפוס כמו AR-10).
create or replace function public.close_project_operationally(
  p_project_id    integer,
  p_actual_hours  numeric,
  p_actual_guests integer,
  p_report_path   text,
  p_rows          jsonb
) returns jsonb
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_actor          text := (select auth.email());
  v_status         text;
  v_closed_at      timestamptz;
  v_customer_id    bigint;
  v_customer_name  text;
  v_event_name     text;
  v_start          time without time zone;
  v_end            time without time zone;
  v_event_hours    numeric;
  v_max_hours      numeric;
  v_report         text := nullif(btrim(coalesce(p_report_path, '')), '');
  v_offender       text;
  v_row            jsonb;
  v_hostess_id     bigint;
  v_name           text;
  v_attendance     text;
  v_lateness       text;
  v_no_show        text;
  v_hours          numeric;
  v_preference     text;
  v_reason         text;
  v_assignment_no  integer;
  v_payload_an     integer;
  v_can_mark       boolean;
  v_marks_saved    integer := 0;
  v_written        integer;
  v_new_closed_at  timestamptz;
  v_feedback       text;
begin
  -- ─────────────────────────────────────────────────────────────────────────────────
  -- ① השער — הדבר הראשון שהגוף עושה.
  -- ─────────────────────────────────────────────────────────────────────────────────
  perform public.assert_module_permission('פרויקטים', array['edit']);

  -- ─────────────────────────────────────────────────────────────────────────────────
  -- ② קריאת הפרויקט ונעילת השורה. הנעילה היא מה שהופך את "עדיין לא סגור" לבדיקה אמיתית
  --    ולא לצילום-מצב שיכול להתיישן בין הבדיקה לכתיבה.
  -- ─────────────────────────────────────────────────────────────────────────────────
  select p.project_status, p.operationally_closed_at, p.customer_id, p.customer_name,
         p.event_name, p.final_start_time, p.final_end_time
    into v_status, v_closed_at, v_customer_id, v_customer_name,
         v_event_name, v_start, v_end
    from public.projects p
   where p.project_id = p_project_id
   for update;

  if not found then
    raise exception 'הפרויקט המבוקש לא נמצא.' using errcode = 'P0002';
  end if;

  -- ─────────────────────────────────────────────────────────────────────────────────
  -- ③ תנאי-הכניסה. 🔴 כולם **לפני** הכתיבה הראשונה — כישלון באמצע היה משאיר חצי-סגירה.
  -- ─────────────────────────────────────────────────────────────────────────────────
  -- ⑲: המצב `event_finished` נקרא על המסך `ממתין לסגירה`, ו-`אירוע הסתיים` אינו מופיע בשום מקום.
  if v_status <> 'event_finished' then
    raise exception 'לא ניתן לסגור את האירוע: הסגירה התפעולית זמינה רק לאירוע שהסתיים וממתין לסגירה.'
      using errcode = 'P0001';
  end if;

  if v_closed_at is not null then
    raise exception 'האירוע כבר נסגר תפעולית, ואי-אפשר לסגור אותו פעם נוספת.'
      using errcode = 'P0001';
  end if;

  -- ㉛: אין ערובה טרנזקציונית בין Storage ל-Postgres ⇒ הנתיב הוא תנאי, לא קישוט.
  --     ‏`project_closed_needs_report` (צעד 1.1) הוא הגיבוי; ההודעה כאן היא של המשתמשת.
  --     ⚠️ הנוסח נגזם מ-`screens-approved:1408` בכוונה: הזנב *"עד 10MB"* התיישן (‏AS-3 קבע 2MB),
  --        והשרת ממילא מקבל נתיב ולא קובץ.
  if v_report is null then
    raise exception 'חובה לצרף דוח-סיכום.' using errcode = 'P0001';
  end if;

  if p_actual_hours is null or p_actual_hours < 0.5 or p_actual_hours > 24 then
    raise exception 'חובה להזין שעות ביצוע — מספר בין 0.5 ל-24.' using errcode = 'P0001';
  end if;

  if p_actual_guests is null or p_actual_guests < 0 then
    raise exception 'חובה להזין כמות אורחים בפועל. אם לא הגיע איש — הזיני 0.'
      using errcode = 'P0001';
  end if;

  -- 🔴 שומר-הלקוח — **תוקן בסבב-הבקרה 14/08/2026: דגל, לא `raise`.**
  --    ‏`projects.customer_id` נמדדה `nullable` (נמדד שוב היום: **0 מתוך 4 ריקות**), בעוד
  --    ‏`customer_hostess_preference.customer_id` היא `NOT NULL` עם FK ⇒ upsert תמים היה נופל
  --    ב-`23502` **אחרי** שחצי הטרנזקציה כבר נכתב.
  --    ⚠️ **הנוסח הקודם כאן זרק `P0001` וביטל את כל הסגירה** — וזה **היפוך מדויק** של סעיף
  --    ה-PAYLOAD CONTRACTS המחייב (‏`module-6.md:1023`, נוסף בבקשת-ישי *"סבבה תוסיף"*):
  --    *"if the project carries no customer, **skip the preference upsert and complete the
  --    closing** — do not fail the whole transaction over an optional side-effect."*
  --    ⇒ **הסגירה התפעולית — עובדות מה שקרה באירוע — אינה תלויה בתופעת-לוואי אופציונלית.**
  --    🚫 **ועדיין אין לגזור את הלקוח מ-`quotes`:** ‏`customer_id` הוא מפתח האילוץ הייחודי,
  --    וגזירה שגויה נועצת דיילת ללקוח הלא-נכון בשכבה 2 של Smart Match, בשקט ולתמיד.
  --    ‏**הדגל חוזר ב-jsonb (‏`preferences_saved`)** כדי שהמסך יאמר שסימוני-האיכות לא נשמרו,
  --    ‏🚫 ולא ישתוק — שתיקה כאן היא בדיוק אותה "הצלחה שקרית" של S-2.
  v_can_mark := v_customer_id is not null;

  -- ⚠️ **שתי בדיקות ולא תנאי אחד עם `or`:** ‏SQL אינו מבטיח סדר-הערכה של `or`, ו-
  --    ‏`jsonb_array_length` על אובייקט זורק *"cannot get array length of a non-array"*
  --    באנגלית. בדיקת-הטיפוס חייבת להסתיים **לפני** שהשנייה מורשית לרוץ.
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'לא התקבלה רשימת הדיילות לסגירת האירוע.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_rows) = 0 then
    raise exception 'לא התקבלה רשימת הדיילות לסגירת האירוע.' using errcode = 'P0001';
  end if;

  -- ─────────────────────────────────────────────────────────────────────────────────
  -- ④ אימות דו-כיווני של המטען מול הדיילות המאושרות-סופית.
  --    זה מה שהופך את *"חסר סימון נוכחות ל-‹שם›"* מהודעת-טופס להבטחה של השרת.
  -- ─────────────────────────────────────────────────────────────────────────────────
  -- ‏(א) מאושרת-סופית שאינה במטען
  select coalesce(h.full_name, e.hostess_id::text) into v_offender
    from (select distinct on (a.hostess_id) a.hostess_id, a.assignment_status
            from public.assignments a
           where a.project_id = p_project_id
           order by a.hostess_id, a.assignment_number desc) e
    left join public.hostesses h on h.hostess_id = e.hostess_id
   where e.assignment_status = 'finally_approved'
     and not exists (select 1
                       from jsonb_array_elements(p_rows) r
                      where (r->>'hostess_id')::bigint = e.hostess_id)
   order by 1
   limit 1;

  if v_offender is not null then
    raise exception 'חסר סימון נוכחות ל-%.', v_offender using errcode = 'P0001';
  end if;

  -- ‏(ב) שורה במטען שאינה מאושרת-סופית באירוע הזה.
  --     ⚠️ `approval_withdrawn` (דיילת שביטלה אחרי אישור) **אינה על רשימת-הסגירה כלל** (‏AR-7)
  --     ⇒ מטען שמכיל אותה נעצר כאן, וזה נכון.
  select coalesce(h.full_name, (r->>'hostess_id')) into v_offender
    from jsonb_array_elements(p_rows) r
    left join public.hostesses h on h.hostess_id = (r->>'hostess_id')::bigint
   where not exists (
           select 1
             from (select distinct on (a.hostess_id) a.hostess_id, a.assignment_status
                     from public.assignments a
                    where a.project_id = p_project_id
                    order by a.hostess_id, a.assignment_number desc) e
            where e.assignment_status = 'finally_approved'
              and e.hostess_id = (r->>'hostess_id')::bigint)
   order by 1
   limit 1;

  if v_offender is not null then
    raise exception 'הדיילת % אינה מאושרת סופית לאירוע הזה, ולכן אינה על רשימת-הסגירה.', v_offender
      using errcode = 'P0001';
  end if;

  -- ‏(ג) כפילות במטען — שתי שורות לאותה דיילת היו מייצרות שתי כתיבות לאותה שורה,
  --     והאחרונה הייתה מנצחת בשקט.
  select coalesce(h.full_name, d.hid::text) into v_offender
    from (select (r->>'hostess_id')::bigint as hid
            from jsonb_array_elements(p_rows) r
           group by 1
          having count(*) > 1) d
    left join public.hostesses h on h.hostess_id = d.hid
   order by 1
   limit 1;

  if v_offender is not null then
    raise exception 'הדיילת % מופיעה פעמיים ברשימת-הסגירה.', v_offender using errcode = 'P0001';
  end if;

  -- ─────────────────────────────────────────────────────────────────────────────────
  -- ⑤ הגבול העליון לשעות פר-דיילת — `screens-approved:1412`: *"שעות-האירוע + 2"*.
  --    ‏🔴 חוצה-חצות מטופל: `22:00–02:00` הוא ארבע שעות, לא מינוס עשרים
  --    (אותה התנהגות של `src/lib/dates.js:61-66`, שאינו בודק סדר).
  --    כששעות-האירוע אינן ידועות — נופלים לתקרת-השדה של `:1406`, ‏24.
  -- ─────────────────────────────────────────────────────────────────────────────────
  if v_start is null or v_end is null then
    v_max_hours := 24;
  else
    v_event_hours := extract(epoch from ((date '2000-01-02' + v_end) - (date '2000-01-01' + v_start))) / 3600.0;
    if v_event_hours >= 24 then
      v_event_hours := v_event_hours - 24;
    end if;
    if v_event_hours <= 0 then
      v_event_hours := 24;
    end if;
    v_max_hours := v_event_hours + 2;
  end if;

  -- ─────────────────────────────────────────────────────────────────────────────────
  -- ⑥ הכתיבה ברמת-הפרויקט. ‏`summary_report_url` ו-`project_status` באותו משפט —
  --    ‏`project_closed_needs_report` נבדק בסוף המשפט, ולכן הסדר הזה חוקי.
  --    🚫 `updated_at` אינו נכתב: `projects_set_updated_at` עושה זאת.
  -- ─────────────────────────────────────────────────────────────────────────────────
  update public.projects p
     set actual_hours             = p_actual_hours,
         actual_guests            = p_actual_guests,
         summary_report_url       = v_report,
         project_status           = 'awaiting_invoice',
         operationally_closed_at  = now(),
         operationally_closed_by  = v_actor
   where p.project_id = p_project_id
  returning p.operationally_closed_at, p.feedback_status
       into v_new_closed_at, v_feedback;

  -- ─────────────────────────────────────────────────────────────────────────────────
  -- ⑦ שורה-שורה: נוכחות · שעות · סימון-איכות.
  -- ─────────────────────────────────────────────────────────────────────────────────
  -- ⚠️ `e.value` ולא `e` — ‏`jsonb_array_elements` מחזירה עמודה ששמה `value`, ושימוש
  --    בשם-הכינוי לבדו בהקשר של `for … in select` הוא הפניה-לשורה-שלמה ולא ל-jsonb.
  for v_row in select e.value from jsonb_array_elements(p_rows) e
  loop
    v_hostess_id := (v_row->>'hostess_id')::bigint;

    -- 🔴 שורה בלי מזהה **חומקת משלוש בדיקות-המטען למעלה**, כי `NULL = NULL` אינו אמת ולכן
    --    היא אינה "עודפת" ואינה "כפולה". בלי השורה הזו היא הייתה מגיעה עד הודעת-הכישלון
    --    הגנרית, עם `<NULL>` במקום שם.
    if v_hostess_id is null then
      raise exception 'אחת השורות ברשימת-הסגירה הגיעה בלי מזהה דיילת.' using errcode = 'P0001';
    end if;

    -- 🔴 **שמות-המפתחות הם החוזה המחייב** (‏`module-6.md` §PAYLOAD CONTRACTS, נוסף בבקשת-ישי
    --    ‏14/08/2026) — **תוקן בסבב-הבקרה: `quality_mark` → `preference`.** הטיוטה נשאה שם
    --    שאינו בחוזה ⇒ דיאלוג-פזה-3 שנבנה מהחוזה היה נכשל ב-**100% מהקריאות**, ובקול
    --    (*"חסר סימון איכות"*) — אבל על עובדה שקרית.
    v_attendance := nullif(btrim(coalesce(v_row->>'attendance_status', '')), '');
    v_lateness   := nullif(btrim(coalesce(v_row->>'lateness_level',    '')), '');
    v_no_show    := nullif(btrim(coalesce(v_row->>'no_show_reason',    '')), '');
    v_preference := nullif(btrim(coalesce(v_row->>'preference',        '')), '');
    v_reason     := nullif(btrim(coalesce(v_row->>'preference_reason', '')), '');
    v_hours      := (v_row->>'actual_hours')::numeric;

    select h.full_name into v_name from public.hostesses h where h.hostess_id = v_hostess_id;
    v_name := coalesce(v_name, v_hostess_id::text);

    -- ─────────────────────────────────────────────────────────────────────────────────
    -- 🔴 `assignment_number` — **החוזה מחייב שהוא יגיע במטען** (הוא החלק השלישי של
    --    ‏`assignments_pkey`), **והשרת ממשיך לגזור אותו בעצמו ולהשוות.** *(נוסף בסבב-הבקרה
    --    ‏14/08/2026.)* ⇒ **הגזירה היא זו שכותבת**, והמטען הוא **הצהרה על מה שהמסך ראה**.
    --    🔑 למה גם וגם, ולא אחד מהם: אמון עיוור במטען כותב לשורה היסטורית כשהמסך התיישן;
    --    גזירה שקטה בלבד **מסתירה** את ההתיישנות ומעדכנת שורה שהמשתמשת לא התכוונה אליה.
    --    ‏**נמדד חי היום על `#8`:** מטען עם `assignment_number = 1` ל-`hostess_id = 41`
    --    מול גזירה `3` — בדיוק המקרה. *(ל-41 שלוש שורות, ל-29 שתיים.)*
    -- 🧨 **מלכודת שנמדדה ונסגרה כאן:** מפתח **חסר** גורם ל-`jsonb_typeof(...)` להחזיר SQL-NULL,
    --    ואז `<> 'number'` הוא **NULL ולא TRUE — וה-`if` אינו יורה.** ⇒ `is distinct from`.
    --    *(נמדד: מפתח חסר → `<>` מחזיר NULL · `is distinct from` מחזיר TRUE.)*
    -- ─────────────────────────────────────────────────────────────────────────────────
    if jsonb_typeof(v_row->'assignment_number') is distinct from 'number' then
      raise exception 'שורת-הסגירה של % הגיעה בלי מספר-זימון.', v_name using errcode = 'P0001';
    end if;
    v_payload_an := (v_row->>'assignment_number')::integer;

    if v_attendance is null then
      raise exception 'חסר סימון נוכחות ל-%.', v_name using errcode = 'P0001';
    end if;

    if v_attendance = 'no_show' then
      -- ‏ט4-א + `screens-approved:1422-1424`: שדה-האיכות **מושבת** ושדה-השעות **מתאפס ל-0**.
      -- 🔑 השרת משחזר את הכלל המאושר במקום לסמוך על המטען — אותו עיקרון שלפיו מחיר נקרא
      --    בשרת ולא מהלקוח. ‏`assignments_no_show_zero_hours` (‏1.3) הוא הגיבוי.
      v_hours      := 0;
      v_preference := null;
      v_reason     := null;
    else
      -- `screens-approved:1410` — סימון-איכות חובה בכל שורה **אלא אם לא הגיעה**.
      -- ⇒ מטען שנושא מפתח אחר (למשל `quality_mark` — השם שהיה בטיוטה לפני סבב-הבקרה)
      --    נעצר כאן בקול, במקום לדלג על ה-upsert בשקט.
      if v_preference is null then
        raise exception 'חסר סימון איכות ל-%.', v_name using errcode = 'P0001';
      end if;

      -- 🔴 **רשימה-לבנה לערך עצמו** *(נוסף בסבב-הבקרה 14/08/2026)*. בלעדיה ערך לא-מוכר
      --    (למשל `'מעולה'` במקום `'מצוינת'`) היה עובר את כל הבדיקות כאן ונופל רק ב-upsert,
      --    על **`customer_hostess_preference_preference_check`** — ‏`23514` **באנגלית של
      --    Postgres**, אחרי שהפרויקט כבר עודכן. ‏`SERVER_CONSTRAINT_RULES` אינו מכיר את השם.
      --    **האילוץ החי, נמדד מילה-במילה 14/08/2026:**
      --      CHECK ((preference = ANY (ARRAY['מצוינת'::text, 'בסדר'::text, 'לא_לשלוח'::text])))
      --    🔴 `'לא_לשלוח'` **עם קו-תחתון** — התווית על המסך היא *"לא לשלוח ללקוח הזה שוב"*,
      --    וההמרה נעשית בלקוח. **המטען נושא את ערך-המסד.**
      if v_preference not in ('מצוינת', 'בסדר', 'לא_לשלוח') then
        raise exception 'סימון-האיכות של % אינו מוכר.', v_name using errcode = 'P0001';
      end if;

      -- 🔴 `customer_hostess_preference_negative_needs_reason` חי — אבל הוא מאשר **מחרוזת
      --    ריקה**, כי `''` אינה NULL. ⇒ הבדיקה כאן היא זו שבאמת אוכפת את ההבטחה.
      if v_preference = 'לא_לשלוח' and v_reason is null then
        raise exception 'סימון ''לא לשלוח שוב'' מחייב סיבה — היא תופיע בכרטיס הדיילת.'
          using errcode = 'P0001';
      end if;
    end if;

    if v_hours is null or v_hours < 0 or v_hours > v_max_hours then
      raise exception '%: שעות בפועל חייבות להיות בין 0 ל-%.',
        v_name, rtrim(to_char(v_max_hours, 'FM99990.99'), '.')
        using errcode = 'P0001';
    end if;

    -- שורת-היעד: `MAX(assignment_number)` פר-דיילת. ‏④(ב) כבר הוכיח שהיא `finally_approved`.
    select a.assignment_number into v_assignment_no
      from public.assignments a
     where a.project_id = p_project_id
       and a.hostess_id = v_hostess_id
     order by a.assignment_number desc
     limit 1;

    -- ההשוואה מול המטען. אי-התאמה פירושה **שהמסך התיישן** — נוצרה שורת-זימון חדשה אחרי
    -- שהרשימה נטענה — ולא שהמשתמשת טעתה. ⇒ הודעה שאומרת מה לעשות, לא מה נשבר.
    if v_payload_an <> v_assignment_no then
      raise exception 'רשימת-הסגירה אינה מעודכנת: הזימון של % השתנה מאז שהמסך נטען. רענני את המסך ונסי שוב.',
        v_name using errcode = 'P0001';
    end if;

    update public.assignments a
       set attendance_status = v_attendance,
           lateness_level    = v_lateness,
           no_show_reason    = v_no_show,
           actual_hours      = v_hours
     where a.project_id       = p_project_id
       and a.hostess_id       = v_hostess_id
       and a.assignment_number = v_assignment_no;

    get diagnostics v_written = row_count;
    if v_written <> 1 then
      raise exception 'שמירת הנוכחות של % נכשלה.', v_name using errcode = 'P0001';
    end if;

    -- ‏B13: הטבלה היא **מצב פר-זוג ולא יומן** ⇒ דריסה, בלי היסטוריה.
    --      `customer_hostess_preference_unique = (customer_id, hostess_id)` — נמדד.
    --      🔴 שורת "לא הגיעה" **אינה מקבלת שורה כלל** — `preference` היא `NOT NULL`,
    --         ו-upsert תמים היה נופל בדיוק על השורות האלה.
    --      🔴 **‏`v_can_mark` — פרויקט בלי לקוח מדלג על ה-upsert וממשיך לסגור** (החוזה
    --         המחייב, `module-6.md:1023`). **הסגירה עצמה כבר נכתבה למעלה ואינה מבוטלת.**
    if v_can_mark and v_preference is not null then
      insert into public.customer_hostess_preference
        (customer_id, hostess_id, preference, preference_reason)
      values
        (v_customer_id, v_hostess_id, v_preference, v_reason)
      on conflict on constraint customer_hostess_preference_unique
      do update set preference        = excluded.preference,
                    preference_reason = excluded.preference_reason;

      v_marks_saved := v_marks_saved + 1;
    end if;
  end loop;

  -- ─────────────────────────────────────────────────────────────────────────────────
  -- ⑧ ההחזרה — כל מה שהלקוח צריך לשלב-השליחה **שאחרי** ה-commit (‏AR-5).
  --    🚫 אין כאן כתובת-מייל של דיילת: מנהלת הלוגיסטיקה היא `edit` על 'פרויקטים' ו-`blocked`
  --       על 'דיילות' (נמדד) ⇒ החזרת פרטי-קשר הייתה מוסרת לה בדיוק את מה שה-RLS שולל.
  -- ─────────────────────────────────────────────────────────────────────────────────
  --    🔴 **`preferences_saved` — שדה חדש בסבב-הבקרה 14/08/2026.** ‏`false` פירושו: האירוע
  --       נסגר במלואו, **וסימוני-האיכות לא נשמרו** כי לפרויקט אין לקוח. **המסך חייב לומר
  --       זאת** — הצלחה שקטה שחסר בה חצי היא בדיוק המלכודת ש-S-2 קיים בשבילה.
  --       ‏`preferences_written` הוא הספירה בפועל (שורות לא-הגיעה אינן נספרות — ③).
  return jsonb_build_object(
    'project_id',              p_project_id,
    'customer_id',             v_customer_id,
    'customer_name',           v_customer_name,
    'event_name',              v_event_name,
    'report_path',             v_report,
    'feedback_status',         v_feedback,
    'operationally_closed_at', v_new_closed_at,
    'preferences_saved',       v_can_mark,
    'preferences_written',     v_marks_saved
  );
end
$$;


-- =====================================================================================
-- ‏§4 · ⑥ `mark_feedback_survey_sent(p_project_id)` — ה-RPC הצרה של AR-5 / AS-5
-- =====================================================================================
-- why: הסגירה רושמת עובדות; **השליחה קורית אחריה, בקוד-הלקוח.** כשהשליחה מצליחה — ורק אז —
--   נכתב `feedback_status = 'sent'`. כשהיא נכשלת, הערך נשאר `'not_sent'` — **וזה נכון ולא
--   קישוט.** ⇒ הפונקציה הזו היא **המסלול היחיד חזרה**, ולכן היא **פטורה מנעילת ㉙**:
--   נוסח גורף — *"כל RPC שנוגע בפרויקט סגור מסרב"* — היה הופך שליחה כושלת לבלתי-ניתנת-לתיקון.
-- 🔴 הערך **באנגלית**: ה-CHECK החי הוא
--    `projects_feedback_status_check CHECK (feedback_status in ('not_sent','sent','completed','no_response'))`
--    — נמדד. ‏`'נשלח'` בעברית היה נדחה.
-- 🚫 כותבת **עמודה אחת ולא-כלום מלבדה.**
create or replace function public.mark_feedback_survey_sent(
  p_project_id integer
) returns boolean
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_rows integer;
begin
  perform public.assert_module_permission('פרויקטים', array['edit']);

  update public.projects p
     set feedback_status = 'sent'
   where p.project_id = p_project_id;

  get diagnostics v_rows = row_count;
  return v_rows = 1;   -- ‏AS-6: הקורא מאשר שהכתיבה נחתה, ולא מניח.
end
$$;


-- =====================================================================================
-- ‏§5 · ⑦ `set_project_finance_fields(...)` — חלון-הכתיבה של מ8 (㉘)
-- =====================================================================================
-- why: ל-`projects` **אין policy-כתיבה, וזו ארכיטקטורה ולא חסר.** ‏RLS ב-Postgres הוא
--   ברמת-שורה ולא ברמת-עמודה ⇒ policy-כתיבה אחת הייתה פותחת את כל 28 העמודות לכל מי
--   שיש לה `edit` על 'פרויקטים', והורסת את ㉘ ואת ㉙ באותה שורה.
-- 🔴 **השער הוא `'כספים'` ולא `'פרויקטים'`.** נמדד חי: `מנהלת כספים ולקוחות` = `view` על
--   פרויקטים + `edit` על כספים ⇒ הפונקציה הזו היא מה שהופך את ㉘ לאמיתי ולא להצהרה.
-- ✅ **ממשיכה לעבוד אחרי הסגירה התפעולית** — זה בדיוק חלון-העבודה שלה. אין כאן בדיקת-נעילה.
-- 🚫 **אינה כותבת `feedback_status`** — לפי ㉞ השליחה היא של מ6 (‏§4 למעלה) והציון של מ8.
-- ⚠️ מ6 משגרת אותה עם **אפס קוראים**; מ8 הוא הקורא.
-- ⚠️ **סמנטיקה: כתיבה מלאה של ששת השדות כפי שהתקבלו** — הטופס של מ8 שולח את כולם יחד.
--    ‏`null` פירושו "רוקני", לא "אל תיגעי". שני האילוצים החיים הם הגיבוי:
--    `projects_feedback_score_check (1..5)` · `projects_negative_feedback_reason_check` (צעד 1.1).
create or replace function public.set_project_finance_fields(
  p_project_id               integer,
  p_invoice_sent             boolean,
  p_payment_date             date,
  p_feedback_score           integer,
  p_negative_feedback_reason text,
  p_feedback_notes           text
) returns boolean
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_rows integer;
begin
  perform public.assert_module_permission('כספים', array['edit']);

  -- ‏`projects.invoice_sent` היא `NOT NULL` (נמדד) ⇒ `null` היה נופל ב-`23502` באנגלית.
  if p_invoice_sent is null then
    raise exception 'חובה לציין אם החשבונית נשלחה.' using errcode = 'P0001';
  end if;

  update public.projects p
     set invoice_sent             = p_invoice_sent,
         payment_date             = p_payment_date,
         feedback_score           = p_feedback_score,
         negative_feedback_reason = nullif(btrim(coalesce(p_negative_feedback_reason, '')), ''),
         feedback_notes           = nullif(btrim(coalesce(p_feedback_notes, '')), '')
   where p.project_id = p_project_id;

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end
$$;


-- =====================================================================================
-- ‏§6 · הרשאות-הרצה
-- 🧨 המוקש, מתועד ב-`20260809174501`: Supabase מגדיר `alter default privileges` שמעניק
--    EXECUTE ל-`anon`/`authenticated`/`service_role` על כל פונקציה חדשה ב-`public` ⇒
--    ‏`revoke … from public` **אינו נוגע בהן. יש לשלול בשם.**
-- =====================================================================================
revoke execute on function public.list_projects_overview()                        from public, anon;
grant  execute on function public.list_projects_overview()                        to authenticated;

revoke execute on function public.close_project_operationally(integer, numeric, integer, text, jsonb) from public, anon;
grant  execute on function public.close_project_operationally(integer, numeric, integer, text, jsonb) to authenticated;

revoke execute on function public.mark_feedback_survey_sent(integer)              from public, anon;
grant  execute on function public.mark_feedback_survey_sent(integer)              to authenticated;

revoke execute on function public.set_project_finance_fields(integer, boolean, date, integer, text, text) from public, anon;
grant  execute on function public.set_project_finance_fields(integer, boolean, date, integer, text, text) to authenticated;

-- 🔴 העוזר הפנימי — **נשלל משלושתם ואינו מוענק לאיש.** הקוראות הן `SECURITY DEFINER`
--    ורצות כבעלים, ולכן קוראות לו בלי קשר. התקדים החי: `enforce_hostess_min_wage`,
--    ש-`proacl` שלו הוא `{postgres=X/postgres,service_role=X/postgres}` — נמדד.
-- ✅ **סבב-הבקרה 14/08/2026 — ממצא שנדחה, והראיה כאן:** הבקרה טענה ש-*"‏1.8א יוצרת את
--    ‏`assert_module_permission` בלי `revoke` כלל, ולכן בין 1.8א ל-1.8ב היא ניתנת-להרצה
--    ל-`anon`"*, בהסתמך על כך שסעיף-ההרשאות *"מזכיר רק את ארבע ה-RPC"*. **השורה הבאה קיימת
--    כאן מאז הטיוטה הראשונה** ⇒ אין חלון-חשיפה, ואין מה לתקן. *(הראיה: `grep -n
--    'assert_module_permission(text, text\[\])' <הקובץ>` מחזיר את השורה הזו.)*
revoke execute on function public.assert_module_permission(text, text[]) from public, anon, authenticated;

-- =====================================================================================
-- ‏§7 · אימות אחרי החלה (להריץ, לא להניח)
-- =====================================================================================
-- ‏① החתימות וההרשאות:
--   select p.proname, p.prosecdef, pg_get_function_identity_arguments(p.oid), p.proacl::text
--     from pg_proc p where p.pronamespace='public'::regnamespace
--      and p.proname in ('assert_module_permission','list_projects_overview',
--          'close_project_operationally','mark_feedback_survey_sent','set_project_finance_fields')
--    order by 1;
--   צפוי: 5 שורות · כל `prosecdef = true` · `anon` נעדר מכולן ·
--         `authenticated` נוכח ב-4 ונעדר מ-`assert_module_permission`.
--
-- ‏② **מבחן-העוגן** (`spec.md §3.2`), ומספריו חושבו ביד לפני שהפונקציה נכתבה:
--   select project_id, hostesses_confirmed, required_hostess_count, pending_invites,
--          assignments_row_count, logistics_ready, logistics_total
--     from public.list_projects_overview() where project_id in (3, 8, 11);
--   צפוי: ‏#3 → 0 / 6 · 0 ממתינים · 0 שורות · 0 / 2
--         ‏#8 → **1 / 6** · **2** ממתינים · **9** שורות · 0 / 2
--         ‏#11 → 0 / 1 · 0 ממתינים · 1 שורה · 0 / **0**
--   ‏🔴 ספירה נאיבית מחזירה `pending_invites = 3` על `#8` (9 שורות, שתי דיילות נספרות פעמיים).
--
-- ‏③ **מבחן-העוגן של הכסף** (`spec.md §3.1` · קריטריון-קבלה #9 ב-`spec.md:455`) —
--   **נוסף בסבב-הבקרה 14/08/2026, והוא זה שתופס את באג-ההנחות:**
--   select project_id, planned_revenue from public.list_projects_overview()
--    where project_id in (3, 7, 8, 11) order by project_id;
--   ‏**צפוי, והורץ חי על הביטוי המתוקן ב-14/08/2026:**
--     ‏#3  → `8,360.00` ‏(‏8,800 − 5%)
--     ‏#7  → `5,355.00` ‏(‏6,300 − 15%)
--     ‏#8  → 🎯 **`5,355.00`** ‏(‏6,300 − 945) — **הספרה שהאפיון חישב ביד**
--     ‏#11 → `500.00`   ‏(אפס הנחה)
--   ‏🔴 **מימוש בלי איבר-הנחה מחזיר `6,300.00` על `#8`, ומימוש משרשר מחזיר `5,386.50`.**
--   ⚠️ **והמבחן הזה חייב לרוץ בזהות שיש לה `'הצעות מחיר'`** — למנהלת-הלוגיסטיקה כל
--   ארבע השורות יחזירו `NULL`, **וזה נכון** (‏S-2), אבל אז המבחן אינו בודק כלום.
-- =====================================================================================
