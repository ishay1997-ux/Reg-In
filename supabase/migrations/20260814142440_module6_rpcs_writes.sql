-- =====================================================================================
-- מודול 6 (פרויקטים) · צעד 1.8ב — **הגופים** של שלוש ה-RPC הכותבות
--   ‏① update_project_details   ② apply_scope_change   ③ cancel_project
-- שם-קובץ מוצע: supabase/migrations/<ts>_module6_rpcs_writes.sql
-- נכתב 14/08/2026 · **תוקן 14/08/2026 בסבב-הבקרה האדוורסרי** (ר' §0א למטה) ·
--   כל טיפוס, כל שם-עמודה וכל שם-אילוץ כאן נמדד מול המסד החי
--   (ref `yfeovxppnfoafmfbdfvh`) לפני שנכתב. אפס שמות מנוחשים.
-- =====================================================================================
--
-- why (🛑 שורת-חסימה #2): המדריך תיאר את שבע ה-RPC ב**פרוזה** ואפס גופים. הקובץ הזה כותב
--   שלושה מהם במלואם — מול **‏PAYLOAD CONTRACTS שבמדריך-המיקרו (שורות 990–1027)**, שהוא
--   ה-SSOT למטען, ולא מול נוסח-הביניים של `m6_step_1_8_contract.sql`.
--
-- why (הפונקציות הן `SECURITY DEFINER`, ואין ברירה): נמדד 14/08/2026 —
--   ל-`public.projects` יש **policy קריאה בלבד** (`projects_select_by_permission`) ואפס
--   policy כתיבה, ול-`public.logistics` **אפס policies בכלל** (deny-all). ⇒ דפדפן אינו
--   יכול לכתוב לאף אחת מהן ישירות, גם לא לדנה. הפונקציה רצה כבעלים (`postgres`), וכל
--   שלוש הטבלאות בבעלות `postgres` **ו-`relforcerowsecurity = false`** (נמדד) ⇒ ה-RLS
--   אינו חל עליה, ולכן **שער-ההרשאה שבראש הגוף הוא ההרשאה היחידה שקיימת.**
--   🔴 **וזו בדיוק הסיבה לשני שערי-הקריאה החדשים ב-§0ב** — פונקציית-DEFINER קוראת מה
--   שהקוראת אינה יכולה לקרוא, ובלי שער משלה היא **מוסרת לה את המספר בחזרה.**
--
-- why (`set search_path = ''` ולא `public, pg_temp`): 🔴 **סטייה מודעת ממדריך-המיקרו שורה 1029.**
--   הנימוק נמדד: **14 מתוך 14 הפונקציות החיות ב-`public` משתמשות ב-`SET search_path TO ''`**
--   (‏`current_user_role_id` · `set_project_coordinates` · `enforce_quote_in_progress_lock` ·
--   ‏`sync_assignments_on_project_date_change` ועוד). ‏`''` חמור יותר — שום שם לא-מוסמך אינו
--   נפתר — ולכן **כל אובייקט כאן מוסמך במלואו** (`public.x` · `pg_catalog.x` · `auth.email()`).
--   הכנסת דפוס שני למערכת בת דפוס אחד היא החריג שצריך להצדיק את עצמו, ואין לו הצדקה.
--
-- why (שני קודי-שגיאה): **`42501`** = כשל הרשאה (רק `assert_module_permission`) ·
--   **`P0001`** = כשל כלל-עסקי. התקדים החי: `set_project_coordinates` זורק `42501` על
--   הרשאה, `enforce_quote_in_progress_lock` זורק `P0001` על נעילה, ו-`hostessServerErrorMessage`
--   (`src/lib/hostesses.js:620`) **כבר מסתעף על `error.code === '42501'`**.
--
-- why (עברית, נקבה): חמש המשתמשות כולן נשים. כל `raise exception` כאן מנוסח בלשון נקבה.
--
-- 🚫 **מה שאין כאן במכוון:** אף `exception when unique_violation` (AR-10, ר' §① למטה) ·
--   אף סף-זמן (⑯) · אף חישוב-רווח ואף עמודת-רווח (AR-6) · אף שליחת-מייל (AR-5) ·
--   אף נגיעה ב-`logistics` בביטול (㉕) · אף אילוץ, אינדקס או policy — הצעד יוצר פונקציות בלבד.
--
-- ⚠️ **סדר-החלה מחייב, ו-1.8 אינו האחרון בו** (ממצא-הבקרה sql-validity): הפונקציות **נוצרות
--    בהצלחה** גם בלי התלויות ונופלות רק בזמן-ריצה, ולכן המספור לבדו מטעה.
--    **הסדר הנכון: 1.1 → 1.2 → 1.3 → 1.5 → 1.7 → 1.9 → 1.8א → 1.8ב → 1.10.**
--    ‏**1.9 חייב לקדם את 1.8ב** — `update_project_details` קוראת ל-`public.recompute_project_status(int)`
--    (נמדד 14/08/2026: `to_regprocedure` מחזירה NULL, כלומר היא **טרם קיימת**), ו-1.9 אינו תלוי
--    ב-1.8 כלל ⇒ הקדמתו אינה עולה דבר. בסדר המספרי, הזזת-תאריך של אירוע שהסתיים זורקת `42883`.
--    התלויות הנוספות: 1.1 — `projects.cancelled_at/cancelled_by/cancel_type/operationally_closed_at`
--    ‏· 1.2 — הטבלה `public.project_changes`.
--
-- הפיכוּת: מלאה. שלוש הפונקציות **חדשות** — נמדד 14/08/2026: אף אחד משמונת שמות מ6 אינו
--   קיים ב-`pg_proc` ⇒ אין גרסה קודמת שנדרסת, והביטול הוא `drop function` (הפקודות בסוף הקובץ).
--   הקובץ אינו נוגע בנתונים, אינו משנה עמודה ואינו נועל טבלה.
-- =====================================================================================


-- =====================================================================================
-- ‏§0א · מה השתנה בסבב-הבקרה (14/08/2026) — חמישה תיקונים, כולם אומתו בהרצה חיה
-- =====================================================================================
-- ‏**‏1 · 🔴 חסם-אבטחה.** `apply_scope_change` החזירה `unit_price_snapshot` · `revenue_delta` ·
--     `revenue_delta_total` לכל בעלת `edit` על 'פרויקטים' — **כולל מנהלת הלוגיסטיקה**, שנמדדה
--     `blocked` על 'הצעות מחיר' ולכן אינה יכולה לקרוא `closing_unit_price` בשום מסלול.
--     ‏`screens-approved.md:809` מכריע מפורשות, בעמודת *"מה נעלם לה"*:
--     *"עמודת 'השפעה על ההכנסה' · אריח ההשפעה · שורת-הסיכום. **חסומה מנתונים פיננסיים**"*.
--     ⇒ שלושת השדות מוחזרים **`NULL`** כשאין לה 'הצעות מחיר'. 🚫 **לא `0`** — אפס נקרא כעובדה.
--     **מסלול-הכתיבה עצמו לא השתנה בגרם.** התבנית מועתקת מ-`m6_step_1_8a:143-149`.
-- ‏**‏2 · 🔴 שמות-דיילות.** אותה מחלה בדיוק, מחלקת-נתונים אחרת: `full_name` הוחזר לכל בעלת
--     `edit` על 'פרויקטים', בעוד מנהלת הלוגיסטיקה נמדדה `blocked` על 'דיילות' (AR-3 מונה
--     שמות-דיילות **ראשונים** ברשימת מה שאסור שידלוף כך). ⇒ `full_name` מוחזר `NULL` בלעדיה,
--     ו-AR-10 עובר לנוסח-הגיבוי **חסר-השם** שהמדריך כבר כתב מילה-במילה.
-- ‏**‏3 · 🔴 מטען off-contract.** `new_qty` → **`target_qty`** · הופל `quote_line_id`
--     (שדה שאינו בחוזה) · היעד נקרא מהשדה **`target`** ולא נגזר מנוכחות `serial_number`.
-- ‏**‏4 · ㉔+B7.** `apply_scope_change` סירבה מ-`event_finished` והלאה — ובכך חסמה את
--     **מסך-הסגירה עצמו**, שהוא הדרך היחידה שבה ㉔ נכנס. ‏B7 הוכרע 14/08: *"reuse surface 6's
--     dialog"*, והדיאלוג ההוא שולח דרך הפונקציה הזאת. ⇒ חלון-הסגירה פתוח.
-- ‏**‏5 · ㉑.** האיפוס מנקה עכשיו גם `invite_sent_at`, `responded_at` **ו-`invite_token`**,
--     אחרת כל דיילת מאופסת מוצגת **`פג תוקף`** מייד — על זימון שמעולם לא נשלח — והקישור
--     הישן נשאר חי. *(הטוקן נוסף בסבב-התיקון השני, באישור המרכיב.)*
-- ‏**‏6 · 🔴 החזרת יכולת שהסרתי בטעות (סבב-תיקון שני).** ‏`+ הוספת פריט שאינו בהצעה` הוא
--     **פקד מאושר ומצויר** (`screens-approved.md:1591`), והדיאלוג **אינו כותב למסד** ⇒
--     **ה-RPC הוא הדבר שחייב ליצור את השורה.** קראתי את ① לא נכון: הוא אוסר **תמחור-מחדש
--     של שורה שהלקוח אישר**, ובמפורש מברך על תוספת — *"An addition is a new line with its
--     own price"*. ⇒ ‏`serial_number` **חובה רק לשורה קיימת**, והשמטתו = **שורה חדשה**.
-- =====================================================================================


-- =====================================================================================
-- ‏§0ב · עוזר-השער המשותף
-- ⚠️ **לתשומת-לב המרכיב:** הפונקציה הזאת שייכת לצעד 1.8 כולו ולא רק לקובץ הזה, והיא נכתבת
--    גם ב-`m6_step_1_8a_reads_and_close.sql`. **שני הגופים זהים מבחינה סמנטית ומעוצבים שונה**
--    (חתימה בשורה אחת מול שלוש · ארבע שורות-הערה שקיימות רק כאן) — 🚫 **ולא "בייט-לבייט",
--    כפי שנכתב כאן ובקובץ-האח לפני סבב-הבקרה.** החתימה והטיפוסים זהים ⇒ `create or replace`
--    השני אינו זורק `42P13`, אינו משנה התנהגות, ו**משמר את ה-ACL** שנקבע ברשומת-ה-revoke.
--    ⇒ **באיחוד לשתי-מיגרציה-אחת: למחוק את הבלוק מאחד הקבצים, לא לשנות אותו.**
-- =====================================================================================

create or replace function public.assert_module_permission(p_module text, p_level text[])
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  -- 🔴 בתוך `security definer` ה-RLS של הקורא אינו חל ⇒ זו ההרשאה היחידה שקיימת.
  -- שמות המודולים נמדדו מול `public.modules` החי: 'פרויקטים'=3 · 'דיילות'=4 ·
  -- 'לוגיסטיקה'=5 · 'כספים'=6 · 'הצעות מחיר'=2. טעות-הקלדה הופכת את תת-השאילתה
  -- ל-NULL ומשווה `module_id = null` ⇒ **השער נסגר בשקט על כולן**, ולכן מילה-במילה.
  if not exists (
    select 1
      from public.permissions p
     where p.role_id = (select public.current_user_role_id())
       and p.module_id = (select m.module_id from public.modules m where m.module_name = p_module)
       and p.permission_level = any(p_level)
  ) then
    raise exception 'אין לך הרשאה לבצע פעולה זו במודול %', p_module using errcode = '42501';
  end if;
end
$$;


-- =====================================================================================
-- ‏§① `update_project_details` — ㉑ · ㉒ · ㉝ · AR-3 · AR-10 · ㉙(א)+(ב)
-- =====================================================================================
--
-- 🔴 **סדר-הפקודות בגוף הוא נושא-משקל, והיפוכו הופך הזזת-תאריך חוקית לכישלון קשה:**
--   ‏**1** שאילתה-מקדימה ⇒ **2** איפוס האישורים-הסופיים ⇒ **3** ‏`update public.projects`.
--   **המנגנון, ונמדד חי 14/08/2026 ואינו כתוב באף מסמך לפני החוזה:** קיים טריגר
--     CREATE TRIGGER projects_sync_assignment_dates AFTER UPDATE OF final_event_date
--       ON public.projects FOR EACH ROW WHEN (old.final_event_date IS DISTINCT FROM new.final_event_date)
--       EXECUTE FUNCTION sync_assignments_on_project_date_change()
--   וגופו `update public.assignments set event_date = new.final_event_date where project_id = ...`
--   — **על כל השורות, בלי סינון-סטטוס.** ⇒ הפונקציה הזאת **אינה** נוגעת ב-`event_date` בעצמה;
--   הטריגר עושה זאת עבורה. והאינדקס `assignments_one_event_per_day` הוא **חלקי**:
--     UNIQUE (hostess_id, event_date) WHERE (assignment_status = 'finally_approved')
--   ⇒ **אחרי צעד 2 אף שורה של הפרויקט אינה מכוסה עוד** והטריגר אינו יכול להפר אותו.
--   בסדר הפוך — עדכון `projects` לפני האיפוס — הטריגר עובר על שורות שעדיין
--   ‏`finally_approved`, ודחיית-תאריך לגיטימית נופלת `23505`.
--
-- 🔴 **AR-10 — משחררים את `23505` החוצה. 🚫 אין כאן `exception when unique_violation`**, וזו
--   סטייה מודעת משורה 1089 במדריך-המיקרו. שלושה נימוקים, מדודים: ① ‏`re-raise` היה ממיר
--   ‏`23505`→`P0001` **ומוחק את שם-האינדקס**, ו-`SERVER_CONSTRAINT_RULES`
--   (`src/lib/hostesses.js:603-613`) מזהה **לפי השם** (`raw.includes(r.constraint)`, `:627`)
--   ⇒ גיבוי שלא יכול לירות אינו גיבוי · ② לפי המנגנון למעלה הענף בלתי-נגיש בזרימה התקינה ·
--   ③ בלוק `exception` עוטף את הגוף בתת-טרנזקציה **בכל קריאה**, מחיר שמשולם על כל הזזת-תאריך
--   חוקית עבור ענף שלא ייכנס.
--   **המנגנון האמיתי הוא השאילתה-המקדימה** — רק היא יכולה לנקוב בשם הדיילת ובשם האירוע
--   המתנגש; האינדקס נושא לא זה ולא זה.
--   ⚠️ **חוב פזה 2/3 שנולד מההכרעה הזאת:** הנוסח שב-`SERVER_CONSTRAINT_RULES` לשם-האינדקס
--   הזה הוא **של מודול 4** ואינו נוסח-AR-10. רק **נוסח-הגיבוי** של AR-10 יכול לחיות במפה
--   ההיא (הנוסח הראשי מכיל `{full_name}`/`{event_name}` שהמפה אינה יכולה לספק).
--
-- 🔴 **㉒ + S-3 — `lat`/`lng` מתאפסים ללא תנאי כשהמיקום השתנה.** ‏`ensureProjectCoordinates`
--   (`src/modules/04_hostesses/api.js:87-99`) **חוזרת מוקדם כששתי העמודות מלאות**
--   (`if (project.lat !== null && project.lng !== null) return null`, `:88` — נקרא ואומת
--   בסבב-הבקרה) ⇒ הגיאוקודינג-מחדש קורה **רק מפני שמודול 6 מאפס אותן**. איפוס מותנה =
--   סיכה שקופאת על הכתובת הישנה לנצח.
--
-- 🔴 **AR-3 — שם-דיילת אינו נתון של 'פרויקטים'.** ‏`v_can_read_hostesses` נמדד פעם אחת בראש
--   הגוף, וכשהוא `false` **מוחזר `hostess_id` בלבד ו-`full_name` הוא `NULL`**, ו-AR-10 עובר
--   לנוסח-הגיבוי חסר-השם. הנמדד: מנהלת הלוגיסטיקה = `פרויקטים:edit` · `דיילות:blocked` ⇒
--   ‏`assignments_select_by_permission` ו-`hostesses_select_by_permission` מחזירות לה אפס שורות.

create or replace function public.update_project_details(
  p_project_id integer,
  p_event_date date,
  p_location   text,
  p_start_time time without time zone,
  p_end_time   time without time zone
) returns jsonb
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_actor              text;
  v_can_read_hostesses boolean;
  v_event_name         text;
  v_status             text;
  v_closed_at          timestamptz;
  v_old_date           date;
  v_old_location       text;
  v_old_start          time without time zone;
  v_old_end            time without time zone;
  v_location           text;
  v_date_changed       boolean;
  v_location_changed   boolean;
  v_hours_changed      boolean;
  v_reactivated        boolean := false;
  v_conflict_name      text;
  v_conflict_event     text;
  v_reset              jsonb := '[]'::jsonb;
  v_notify             jsonb := '[]'::jsonb;
  v_new_status         text;
begin
  -- ── השער, ראשון בגוף ─────────────────────────────────────────────────────────────
  perform public.assert_module_permission('פרויקטים', array['edit']);

  -- ── שער-הקריאה השני (AR-3), מחושב פעם אחת ולא פר-שורה ────────────────────────────
  select exists (
    select 1
      from public.permissions p
     where p.role_id = (select public.current_user_role_id())
       and p.module_id = (select m.module_id from public.modules m where m.module_name = 'דיילות')
       and p.permission_level = any(array['edit', 'view'])
  ) into v_can_read_hostesses;

  -- מי מבצעת. ‏`auth.email()` הוא התקדים החי (`current_user_role_id`), והוא גם המפתח
  -- ל-`public.users` — ומעצם המעבר בשער כבר ידוע שיש לה שורה פעילה שם.
  v_actor := auth.email();
  if v_actor is null then
    raise exception 'לא זוהתה משתמשת מחוברת. התחברי מחדש ונסי שוב.' using errcode = '42501';
  end if;

  -- ── הפרויקט, נעול לכל אורך הטרנזקציה ─────────────────────────────────────────────
  select p.event_name, p.project_status, p.operationally_closed_at,
         p.final_event_date, p.final_location, p.final_start_time, p.final_end_time
    into v_event_name, v_status, v_closed_at,
         v_old_date, v_old_location, v_old_start, v_old_end
    from public.projects p
   where p.project_id = p_project_id
   for update;

  if not found then
    raise exception 'הפרויקט המבוקש אינו קיים.' using errcode = 'P0001';
  end if;

  -- ── ולידציית-שדות (הנוסחים מ-`screens-approved.md` §⑦, שורות 554 · 557 · 558) ─────
  if p_event_date is null then
    raise exception 'חובה למלא תאריך אירוע.' using errcode = 'P0001';
  end if;

  v_location := btrim(coalesce(p_location, ''));
  if v_location = '' then
    raise exception 'חובה למלא מיקום — הוא נשלח לדיילות ומשמש לדירוג הקרבה בשיבוץ.'
      using errcode = 'P0001';
  end if;

  -- שתי השעות `nullable` במסד (נמדד) — או ששתיהן מלאות או ששתיהן ריקות.
  -- 🚫 ואין בדיקת-סדר: אירוע 22:00–02:00 חוקי לגמרי (S-17), והמסך מודיע ואינו חוסם.
  if (p_start_time is null) <> (p_end_time is null) then
    raise exception 'מלאי גם שעת התחלה וגם שעת סיום, או השאירי את שתיהן ריקות.'
      using errcode = 'P0001';
  end if;

  -- ── ㉙(א) הנעילה, ו-(ב) מסלול-המילוט היחיד ───────────────────────────────────────
  if v_status = 'cancelled' then
    raise exception 'הפרויקט בוטל ולא ניתן לעדכן את פרטי האירוע.' using errcode = 'P0001';
  end if;

  if v_closed_at is not null
     or v_status in ('awaiting_invoice', 'awaiting_payment', 'finished') then
    raise exception 'האירוע כבר נסגר תפעולית ולא ניתן לעדכן את פרטיו.'
      using errcode = 'P0001';
  end if;

  if v_status = 'event_finished' then
    -- 🔴 מסלול-המילוט (ב): בלעדיו פרויקט שתאריכו נדחה תקוע ב"ממתין לסגירה" **לנצח** —
    -- הקרון מזיז קדימה בלבד, ו-`recompute_project_status` חוזרת מוקדם לכל סטטוס
    -- שאינו אחד משלושת הפעילים. ⇒ תאריך-יעד עתידי מחזיר את הפרויקט לציר-הפעיל.
    if p_event_date >= current_date then
      v_reactivated := true;
    else
      raise exception 'האירוע כבר התקיים והפרויקט ממתין לסגירה. שינוי שהתגלה אחרי האירוע נרשם דרך מסך סגירת האירוע; להזזת האירוע קדימה בחרי תאריך עתידי.'
        using errcode = 'P0001';
    end if;
  end if;

  v_date_changed     := p_event_date is distinct from v_old_date;
  v_location_changed := v_location   is distinct from v_old_location;
  v_hours_changed    := (p_start_time is distinct from v_old_start)
                     or (p_end_time   is distinct from v_old_end);

  -- ── 1. השאילתה-המקדימה (AR-10) — רק כשהתאריך השתנה ───────────────────────────────
  -- מי שאנחנו עומדים לאפס ולזמן מחדש, וכבר מאושרת סופית לאירוע **אחר** בתאריך היעד.
  if v_date_changed then
    select h.full_name, op.event_name
      into v_conflict_name, v_conflict_event
      from public.assignments a
      join public.hostesses  h  on h.hostess_id = a.hostess_id
      join public.assignments oa on oa.hostess_id = a.hostess_id
                                and oa.project_id <> p_project_id
                                and oa.assignment_status = 'finally_approved'
      join public.projects   op on op.project_id = oa.project_id
                               and op.final_event_date = p_event_date
     where a.project_id = p_project_id
       and a.assignment_status = 'finally_approved'
     order by h.full_name, op.event_name
     limit 1;

    if v_conflict_name is not null then
      -- 🔴 שני הנוסחים מועתקים **מילה-במילה** מ-AR-10 (מדריך-המיקרו שורה 307). שם-האירוע
      --    המתנגש אינו מוגבל — הקוראת כבר עברה בשער 'פרויקטים' ⇒ `projects_select_by_permission`
      --    ממילא פותחת לה את כל שמות-האירועים. **מה שמוגבל הוא שם-הדיילת בלבד.**
      if v_can_read_hostesses then
        raise exception '% כבר מאושרת סופית ל"%" בתאריך הזה. בחרי תאריך אחר, או שחררי אותה מהאירוע ההוא.',
          v_conflict_name, v_conflict_event using errcode = 'P0001';
      else
        raise exception 'אחת הדיילות המאושרות כבר משובצת סופית לאירוע אחר בתאריך היעד. בחרי תאריך אחר, או שחררי אותה מהאירוע ההוא.'
          using errcode = 'P0001';
      end if;
    end if;
  end if;

  -- ── 2. איפוס האישורים-הסופיים (㉑) — לפני העדכון ב-`projects`, ר' הערת-הסדר למעלה ──
  -- 🔴 **ושלושת השדות מתאפסים יחד, לא רק הסטטוס.** ‏`פג תוקף` אינו סטטוס שביעי — הוא
  --    **נגזר בזמן-תצוגה** מ-`pending` + 48 שעות מ-`invite_sent_at` (`spec.md:124`).
  --    השארת `invite_sent_at` הישן ⇒ **כל דיילת מאופסת נצבעת `פג תוקף` מיידית**, על זימון
  --    שמעולם לא נשלח — ולצמיתות אם שליחת-הלקוח נכשלת, מצב ש-AR-5 מדגים כתוצאה רגילה.
  --    ‏`responded_at` מתאפס באותה נשימה: השארתו על שורה שסטטוסה `pending` אומרת "היא
  --    ענתה" בעוד הסטטוס אומר "טרם ענתה", **ואחרי הזימון-מחדש היא מייצרת זמן-תגובה שלילי**
  --    (`responded_at` ישן פחות `invite_sent_at` חדש) בזווית-המיון של `sortAngles.js`.
  --    🔴 **ו-`invite_token` מתאפס גם הוא** *(אושר בסבב-התיקון השני; קודם הושאר בכוונה)*:
  --    כוונת ㉑ היא ש**הזימון הישן מת**. השארתו חיה פירושה שדיילת שתלחץ על הקישור שבמייל
  --    הישן — מייל שמציג את **התאריך הישן** — תאשר בפועל את **החדש**, וזה תרחיש-אמת ולא
  --    תיאורטי כי `AR-5` מדגים כשל-שליחה כתוצאה **רגילה**. מסלול הזימון-מחדש של מ4
  --    (`04_hostesses/api.js:331`) כותב טוקן חדש על אותה שורה **בלי לקרוא את הישן**
  --    (`update … set invite_token = <new>` לפי מפתח-השורה) ⇒ האיפוס אינו שובר אותו.
  --    ‏`assignments_invite_token_key` הוא `UNIQUE`, ו-NULL אינו מתנגש ב-UNIQUE.
  if v_date_changed then
    with reset_rows as (
      update public.assignments a
         set assignment_status = 'pending',
             invite_sent_at    = null,
             responded_at      = null,
             invite_token      = null
       where a.project_id = p_project_id
         and a.assignment_status = 'finally_approved'
      returning a.hostess_id
    )
    select coalesce(
             jsonb_agg(jsonb_build_object(
                         'hostess_id', r.hostess_id,
                         -- AR-3: `NULL` ולא השמטה — הצורה יציבה לפזה 3, והערך נעדר.
                         'full_name',  case when v_can_read_hostesses then h.full_name end)
                       order by h.full_name),
             '[]'::jsonb)
      into v_reset
      from reset_rows r
      join public.hostesses h on h.hostess_id = r.hostess_id;
  end if;

  -- ── 3. העדכון ב-`projects` — ומכאן הטריגר מסנכרן את `assignments.event_date` ──────
  update public.projects p
     set final_event_date = p_event_date,
         final_location   = v_location,
         final_start_time = p_start_time,
         final_end_time   = p_end_time,
         -- ㉒ + S-3: איפוס **ללא תנאי** כשהמיקום השתנה. ר' ההערה שמעל הפונקציה.
         lat = case when v_location_changed then null else p.lat end,
         lng = case when v_location_changed then null else p.lng end,
         -- מסלול-המילוט (ב): החזרה לציר-הפעיל, ואז `recompute` קובעת על איזו משלוש.
         project_status = case when v_reactivated then 'not_started' else p.project_status end
   where p.project_id = p_project_id;

  if v_reactivated then
    -- ⚠️ מצריך את 1.9. ר' "סדר-החלה מחייב" בראש הקובץ.
    perform public.recompute_project_status(p_project_id);
  end if;

  -- ── 4. למי הלקוח שולח, ומה (AR-5: המייל נשלח **אחרי** ה-commit, בקוד הלקוח) ───────
  -- ㉒/㉝: שינוי מיקום או שעות **אינו** מאפס אישורים ⇒ מייל-עדכון לדיילות החיות.
  -- 🚫 מוחזרים `hostess_id` ו-`full_name` בלבד — לא מייל, לא טלפון, לא תעריף.
  --    **ו-`full_name` עצמו מותנה ב-'דיילות'** (AR-3, ר' ההערה שמעל הפונקציה): מנהלת
  --    הלוגיסטיקה היא `edit` על 'פרויקטים' ו-`blocked` על 'דיילות' (נמדד), ופונקציית
  --    ‏`SECURITY DEFINER` שתחזיר לה שם מוסרת בדיוק את מה ש-RLS שולל.
  if v_location_changed or v_hours_changed then
    select coalesce(
             jsonb_agg(jsonb_build_object(
                         'hostess_id', w.hostess_id,
                         'full_name',  case when v_can_read_hostesses then h.full_name end)
                       order by h.full_name),
             '[]'::jsonb)
      into v_notify
      from (
        -- קיפול ה-de-dup של AR-3: השורה האחרונה פר-דיילת היא מצבה האמיתי.
        select distinct on (a.hostess_id) a.hostess_id, a.assignment_status
          from public.assignments a
         where a.project_id = p_project_id
         order by a.hostess_id, a.assignment_number desc
      ) w
      join public.hostesses h on h.hostess_id = w.hostess_id
     where w.assignment_status in ('finally_approved', 'confirmed_available', 'pending')
       and not exists (select 1
                         from jsonb_array_elements(v_reset) e
                        where (e ->> 'hostess_id')::bigint = w.hostess_id);
  end if;

  select p.project_status into v_new_status
    from public.projects p where p.project_id = p_project_id;

  return jsonb_build_object(
    'project_id',            p_project_id,
    'event_name',            v_event_name,
    'date_changed',          v_date_changed,
    'location_changed',      v_location_changed,
    'hours_changed',         v_hours_changed,
    'coordinates_cleared',   v_location_changed,
    'reactivated',           v_reactivated,
    'project_status',        v_new_status,
    'can_read_hostesses',    v_can_read_hostesses,  -- AR-3: `full_name=null` = חסימה, לא חוסר-נתון
    'hostesses_to_reinvite', v_reset,   -- ㉑: אישורן אופס ⇒ זימון מחדש
    'hostesses_to_notify',   v_notify   -- ㉒/㉝: אישורן עומד ⇒ מייל-עדכון בלבד
  );
end
$$;


-- =====================================================================================
-- ‏§② `apply_scope_change` — ① · ② · ③ · ③ↄ · ⑯ · ㉔ · AR-4 · S-2
-- =====================================================================================
--
-- 📜 **המטען כפוף ל-PAYLOAD CONTRACTS (מדריך-המיקרו 995–1007), והוא ה-SSOT.**
--   ‏`p_lines` הוא **מערך אובייקטים**, וצורה אחת בלבד, המובחנת לפי `target`:
--     ‏`target`        — `'logistics'` | `'hostess_count'` · **תמיד**
--     ‏`sku`           — `text`, כאשר `target='logistics'`
--     ‏`serial_number` — `int`, **החלק השלישי של `logistics_pkey`** — כאשר `target='logistics'`
--                        **ושורת-היעד קיימת**. 🔴 **השמטתו = "פריט חדש"**, וה-RPC מקצה
--                        ‏`max(serial_number)+1` בשרת. 🚫 **הלקוח לעולם אינו ממציא מספר סידורי.**
--     ‏`target_qty`    — `int`, **תמיד**
--   🚫 **`p_project_id` הוא פרמטר סקלרי ולעולם לא שדה בתוך שורה** (החוזה, שורה 993):
--      מזהה-פרויקט פר-שורה מאפשר לקריאה אחת לכתוב על פני פרויקטים, והשער בודק אחד.
--
-- 🔴 **`target_qty` הוא הכמות ה*חדשה*, לעולם לא דלתא — והדלתא נגזרת בשרת.**
--   זה מה שקונה אי-דמיות: לחיצה כפולה על `שמור` מחשבת `380 − 380 = 0`, השורה מדולגת,
--   ו-`project_changes_delta_qty_check` (‏`delta_qty <> 0`, צעד 1.2) הופך שורה ריקה
--   לבלתי-ניתנת-להוספה. עם דלתא הלקוח היה מחויב פעמיים על שינוי אחד, **בלי שדבר יזרוק**.
--
-- 🔴 **`logistics_pkey` היא שלשה — `(project_id, sku, serial_number)`, נמדד חי 14/08/2026.**
--   ⇒ ה-`UPDATE` נוקב בשלושת החלקים. פגיעה בחלק אחד בלבד מעדכנת את השורה הלא-נכונה
--   (או את שתיהן) **בלי לזרוק דבר**, כשלאירוע יש שתי שורות מאותו מק"ט.
--
-- 🔴 **ומאיפה נקראת "הכמות הנוכחית" — הנקודה שמפילה בשקט:** ‏**לא** מ-`quote_services.qty`.
--   ההצעה **קפואה**: `quotes.quote_id=6` בסטטוס `approved`, והטריגר החי
--   ‏`quote_services_lock_non_in_progress` זורק `P0001` על כל `UPDATE` לשורה שהצעתה אינה
--   ‏`in_progress` ⇒ `qs.qty` יישאר `300` לנצח, ושינוי-תכולה **שני** (380→400) היה מחשב
--   ‏`400 − 300 = +100` במקום `+20`. ✅ **המקור הנכון הוא היעד עצמו:** `target='logistics'` ⇒
--   ‏`logistics.planned_qty` באותה שלשת-PK · `target='hostess_count'` ⇒
--   ‏`projects.required_hostess_count`. ‏`quote_services` נותנת **מחיר ועלות בלבד**.
--
-- 🔴 **ואיך נמצאת שורת-המחיר בלי `quote_line_id` — ולמה השדה ההוא הופל.** החוזה אינו נושא
--   מזהה-שורת-הצעה, והמדידה מסבירה למה זה נכון: **היום אין קישור בין `logistics` לבין
--   ‏`quote_services`** — ‏`serial_number` מוקצה ב-`row_number()` על שורות-ההצעה
--   (`20260812204405:76`) ואינו `line_id`. הקישור נולד רק בצעד **1.4**
--   (`logistics.quote_service_line_id`). ⇒ **גם הלקוח היה נאלץ להתאים לפי `sku`** — כלומר
--   ‏`quote_line_id` לא היה פותר את הדו-משמעות, רק מעביר אותה לצד שיודע פחות.
--   ✅ **לכן: חיפוש לפי `(quote_id, sku)` בשרת, ו-`raise` מפורש אם נמצאה יותר משורה אחת.**
--   נמדד 14/08/2026: **אפס הצעות במסד נושאות שתי שורות מאותו מק"ט** ⇒ הענף אינו נגיש היום,
--   והוא **נכשל בקול** במקום לבחור בשקט. 🔧 **וצעד 1.4 מייתר אותו לתמיד.**
--
-- 🔴 **③ↄ — מעבר-מדרגה אינו מתמחר מחדש.** המחיר המוקפא נקרא מ-`quote_services` של ההצעה
--   של **הפרויקט הזה** ובצד-השרת בלבד; ‏`p_lines` אינו נושא כסף ואינו יכול להשפיע עליו.
--
-- 🔴 **AR-4 — אפס אסור, והשורה אינה נמחקת לעולם.** ‏`logistics_planned_qty_check`
--   (`CHECK (planned_qty > 0)`) חי ויתפוס — אבל באנגלית של Postgres; ההודעה שלנו קודמת לו.
--   ‏㉕: שורה שסומנה `ordered` היא **הראיה לחיוב** — מחיקתה מוחקת את ההוכחה.
--   ⚠️ **וזו סטייה מודעת משורה 1006 בחוזה-המטען** (*"`target_qty = 0` means DELETE the row"*),
--   שסותרת את AR-4 ואת ㉕ באותו מסמך. **‏AR-4 בעל הפרובננס החזק, ולכן הוא שנבנה.**
--   **המרכיב חייב למחוק/לתקן את שורות 1003 ו-1006 במדריך** ולסמן `↳ as-built` — ר' notes.
--
-- 🔴 **מסלול "פריט חדש" — יכולת מאושרת, ומה שקורא את ① כאוסר אותה קורא אותו הפוך.**
--   ‏**①** אוסר **תמחור-מחדש של שורה שהלקוח אישר** ובמפורש מברך על תוספת:
--   *"An addition is a **new line with its own price**, never an edit of a line the customer
--   approved"* (מדריך-המיקרו שורה 247). ⇒ *"משנים רק כמויות"* מוסב על **השורות הקיימות**,
--   לא על קיומן של שורות חדשות.
--   **שלושה עוגנים שנקראו, לא צוטטו מהזיכרון:**
--     ‏① `screens-approved.md:1591` — הפקד `+ הוספת פריט שאינו בהצעה`:
--        *"פותח בורר-מוצר מהקטלוג ומוסיף **שורה חדשה** לטבלה שבדיאלוג. **אינו כותב למסד**"*
--        ⇒ 🔑 **הדיאלוג רק מבייים; ה-RPC הזה הוא הדבר היחיד שיכול ליצור את השורה.**
--     ‏② מדריך-המיקרו שורה 1724 — *"פריט חדש נכנס לפי מדרגת-המחיר בקטלוג היום, ומקבל את
--        הנחת ההצעה"*.
--     ‏③ מדריך-המיקרו שורה 1732 — **מצב ④ של משטח 6, "פריט שאינו בהצעה"**, מצב שהדיאלוג
--        חייב לצייר. **מצב שהשרת אינו יכול לספק הוא מסך שבור.**
--
-- 🔴 **תמחור פריט חדש — הועתק מ-SSOT-הכסף, לא הומצא.** ‏`src/lib/pricing.js:72-89`
--   (`findMatchingTier`/`resolveUnitPrice`, §7.27, הכרעת-ישי 07/07):
--   **המדרגה בעלת ה-`min_qty` הגבוה ביותר שעדיין ≤ הכמות מנצחת · `max_qty` הוא תצוגה בלבד
--   ואינו משתתף בבחירה · אין מדרגה מתאימה ⇒ `products.base_price`.** העלות מגיעה
--   מ-`product_costs.cost` — **מקור-העלות שנקבע ב-§7.83↳ ושמיושם ב-`approve_quote…:58-59`**,
--   ‏🚫 לא מ-`products`.
--   🔑 **ולמה המחיר נשמר *לפני* הנחה, וזו הנקודה שהייתה מייצרת הנחה-כפולה שקטה:** נמדד חי —
--   להצעה 6 יש `applied_customer_discount=5.00` **וגם** `manual_discount=10.00`, ובכל זאת
--   ‏`closing_unit_price` של `B-REG-TAG` הוא **5.00**, שהוא בדיוק מחיר-המדרגה הגולמי
--   ‏(201–400) — כלומר **מחיר-היחידה בכל המערכת הוא טרום-הנחה**, וההנחה חיה **ברמת
--   סכום-הביניים בלבד** (`computeQuoteTotals`, §7.26: ההנחות מתחברות בחיבור ולא בשרשור).
--   ⇒ **"מקבל את הנחת ההצעה" מתקיים מאליו** כשהשורה החדשה נשמרת גולמית כמו כל אחותה;
--   הטבעת ההנחה לתוך `unit_price_snapshot` הייתה מנכה אותה **פעמיים**.
--
-- 🔴 **הקצאת `serial_number` — לפי התקדים החי, ובמכוון רחבה מהנדרש.** ‏`logistics_pkey` הוא
--   ‏`(project_id, sku, serial_number)`, ולכן די היה ב-`max+1` **פר-מק"ט**. בכל זאת מוקצה
--   ‏`max+1` **על הפרויקט כולו**, כי כך `approve_quote_and_create_project:76` ממספר את
--   השורות (`row_number() over (order by qs.line_number)` על כל שורות-הפרויקט) ⇒ פר-מק"ט
--   היה מייצר `1` **שני** באותו אירוע, ומנהלת הלוגיסטיקה קוראת את המספר הזה כמזהה-שורה.
--   ‏**מקסימום-הפרויקט תמיד ≥ מקסימום-המק"ט ⇒ ה-PK אינו יכול להתנגש.**
--   🚫 **והלקוח לעולם אינו ממציא מספר:** שליחת `serial_number` שאין לו שורה **זורקת**
--   ואינה מוסיפה. **התנגשות מקבילית מנוטרלת ב-`for update` על שורת-הפרויקט** שבראש הגוף —
--   שני שינויי-תכולה על אותו פרויקט מסודרים בתור, ולא קוראים את אותו `max`.
--
-- 🔴 **ומוצר מושבת אינו אופציה לתוספת — התקדים, מתוארך:** `03_quotes/api.js:107-113` מתעד
--   את הכרעת-ישי 31/07 (תקן Salesforce CPQ): *"מוצר מושבת אינו אופציה להצעה **חדשה**"*
--   (הכרעה מ-12/07), **ואילו שורה קיימת מסומנת ונשמרת**. ⇒ כאן בדיוק אותה הבחנה:
--   ‏`products.status = 'active'` נדרש **רק במסלול "פריט חדש"**, ואינו נבדק כלל בעדכון
--   כמות של שורה קיימת.
--
-- 🚫 **ומה שנשאר אסור: `target_qty = 0`** (AR-4 + ㉕) — הכמות חייבת להיות > 0 בשני המסלולים,
--   והשורה **אינה נמחקת לעולם**. ⇒ **שורה 1006 בחוזה-המטען עדיין שגויה ועדיין דורשת תיקון
--   במדריך**; רק שורה 1003 (מסלול השורה החדשה) הוחזרה.
--
-- 🚫 **אין כאן שום סף-זמן** (⑯). ‏`hours_to_event` **מדווח ואינו חוסם** — הלקוח מחליט אם
--   לצייר את סימון *"שינוי מאוחר"*, לפי ההכרעה של 14/08 11:30 שחיה ב-`isLateChange` (צעד 2.2).
--
-- 🔴 **㉔ + B7 — חלון-הסגירה פתוח בכוונה, וזה תוקן בסבב-הבקרה.** ㉔ קובע ששינוי שהתגלה אחרי
--   האירוע נכנס דרך **מסך-הסגירה**, ו-B7 הוכרע 14/08/2026: *"reuse surface 6's dialog"* —
--   כלומר אותו דיאלוג, שמגיש דרך הפונקציה הזאת. ⇒ סירוב מ-`event_finished` היה **חוסם את
--   המסלול היחיד ש-㉔ מתיר**. ‏㉙ עצמו מנוסח *"after the operational closing"* — כלומר
--   הנעילה תלויה ב-`operationally_closed_at`, לא בסטטוס `event_finished`.

create or replace function public.apply_scope_change(
  p_project_id integer,
  p_lines      jsonb,
  p_reason     text
) returns jsonb
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_actor           text;
  v_can_read_quotes boolean;
  v_reason          text;
  v_status          text;
  v_closed_at       timestamptz;
  v_quote_id        integer;
  v_required_now    integer;
  v_group           uuid;
  v_line            jsonb;
  v_target          text;
  v_sku             text;
  v_serial          integer;
  v_is_new          boolean;
  v_new_qty         integer;
  v_qty_raw         numeric;
  v_key             text;
  v_seen            text[] := '{}';
  v_category        text;
  v_prod_status     text;
  v_base_price      numeric;
  v_q_count         integer;
  v_q_color         text;
  v_q_price         numeric;
  v_q_cost          numeric;
  v_current         integer;
  v_delta           integer;
  v_revenue         numeric(14,2);
  v_lines_out       jsonb := '[]'::jsonb;
  v_total           numeric(14,2) := 0;
  v_hours           integer;
begin
  -- ── השער, ראשון בגוף. 🔑 'פרויקטים' ולא 'לוגיסטיקה': AR-2 מחילה את 'לוגיסטיקה' על
  --    policy-הקריאה של הטבלה (צעד 1.4), לא על פונקציה. הכתיבה ל-`logistics` כאן נעשית
  --    תחת `SECURITY DEFINER` — וזו בדיוק הסיבה שהפונקציה היא DEFINER.
  perform public.assert_module_permission('פרויקטים', array['edit']);

  -- ── 🔴 שער-הקריאה הפיננסי (S-2), מחושב פעם אחת ─────────────────────────────────────
  -- **הצורה מועתקת מ-`m6_step_1_8a_reads_and_close.sql:143-149`** — אותה פזה, אותה
  -- מחלקת-נתונים, ולכן אותו טיפול. ‏`screens-approved.md:809` הכריע במפורש שמנהלת
  -- הלוגיסטיקה **חסומה מנתונים פיננסיים** ושעמודת *"השפעה על ההכנסה"*, אריח-ההשפעה
  -- ושורת-הסיכום **נעלמים לה** — והשלושה האלה הם `unit_price_snapshot` · `revenue_delta` ·
  -- `revenue_delta_total`. 🚫 **מוחזר `NULL` ולא `0`:** אפס נקרא כעובדה ("השינוי לא שווה
  -- כסף"), ו-`NULL` הוא מה שהמסך מצייר כ-`—` (§3.7, שורת "אין הרשאה").
  -- 🔑 **ואין דו-משמעות בקריאה:** הפונקציה מסרבת לפרויקט בלי `quote_id` (למטה) ⇒
  --    ‏`revenue_delta = null` פירושו **חסימת-הרשאה** ותמיד רק היא.
  select exists (
    select 1
      from public.permissions p
     where p.role_id = (select public.current_user_role_id())
       and p.module_id = (select m.module_id from public.modules m where m.module_name = 'הצעות מחיר')
       and p.permission_level = any(array['edit', 'view'])
  ) into v_can_read_quotes;

  v_actor := auth.email();
  if v_actor is null then
    raise exception 'לא זוהתה משתמשת מחוברת. התחברי מחדש ונסי שוב.' using errcode = '42501';
  end if;

  -- ② — הסיבה היא **חובה**. הנוסח נעול ב-§3.7 ומועתק, לא נגזר מחדש.
  v_reason := btrim(coalesce(p_reason, ''));
  if v_reason = '' then
    raise exception 'חובה למלא סיבה — היא מה שיסביר את החיוב הזה בעוד חודש.'
      using errcode = 'P0001';
  end if;

  -- 🔴 שני `if` נפרדים ולא תנאי אחד עם `or`: ‏`jsonb_array_length` **זורקת** על ערך שאינו
  --    מערך, ו-SQL אינו מבטיח הערכה מקוצרת של `or` ⇒ מטען שאינו מערך היה מפיל שגיאת-מסד
  --    באנגלית במקום את ההודעה שלנו. הסדר כאן הוא השומר.
  if p_lines is null or jsonb_typeof(p_lines) is distinct from 'array' then
    raise exception 'לא נשלחה אף שורה לשינוי.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_lines) = 0 then
    raise exception 'לא נשלחה אף שורה לשינוי.' using errcode = 'P0001';
  end if;

  select p.project_status, p.operationally_closed_at, p.quote_id, p.required_hostess_count
    into v_status, v_closed_at, v_quote_id, v_required_now
    from public.projects p
   where p.project_id = p_project_id
   for update;

  if not found then
    raise exception 'הפרויקט המבוקש אינו קיים.' using errcode = 'P0001';
  end if;

  -- ㉙ — הנעילה תלויה ב**סגירה התפעולית**, לא בכך שהתאריך עבר. ‏`event_finished` עם
  -- ‏`operationally_closed_at is null` = **חלון-הסגירה**, והוא פתוח בכוונה (㉔ + B7).
  if v_status = 'cancelled' then
    raise exception 'הפרויקט בוטל ולא ניתן לשנות את תכולתו.' using errcode = 'P0001';
  end if;
  if v_closed_at is not null
     or v_status in ('awaiting_invoice', 'awaiting_payment', 'finished') then
    raise exception 'האירוע כבר נסגר תפעולית ולא ניתן לשנות את תכולתו.'
      using errcode = 'P0001';
  end if;

  if v_quote_id is null then
    raise exception 'לפרויקט אין הצעת מחיר משויכת, ולכן אין מחיר מוקפא לרשום לשינוי.'
      using errcode = 'P0001';
  end if;

  -- ③ במדריך: **`change_group_id` אחד לכל קריאה** — שליחה אחת של הדיאלוג = קבוצה אחת.
  -- ‏`gen_random_uuid` קיימת ב-`pg_catalog` מאז PG13 (נמדד: גם ב-`extensions`) ⇒ מוסמכת
  -- ל-`pg_catalog` כדי שתיפתר תחת `search_path = ''` ובלי דו-משמעות.
  v_group := pg_catalog.gen_random_uuid();

  for v_line in select je.value from jsonb_array_elements(p_lines) je loop
    if jsonb_typeof(v_line) is distinct from 'object' then
      raise exception 'אחת השורות בבקשה אינה תקינה. השינוי לא בוצע.' using errcode = 'P0001';
    end if;

    -- ── פענוח המטען, לפי החוזה, עם ולידציית-טיפוס מפורשת ─────────────────────────
    -- 🔴 `is distinct from` ולא `<>`: על מפתח **חסר** מחזירה `jsonb_typeof` ערך NULL,
    --    ו-`NULL <> 'number'` הוא NULL ⇒ ה-`if` אינו נכנס, השומר מדלג בשקט, והשורה
    --    ממשיכה עם כמות NULL — כלומר no-op שקט שאיש לא רואה. זה בדיוק הכשל שהצעד הזה
    --    קיים כדי למנוע, ולכן ההשוואה כאן היא תלת-ערכית-בטוחה.

    -- (א) `target` — **המבחין**, ולא נגזר מנוכחות `serial_number`.
    v_target := btrim(coalesce(v_line ->> 'target', ''));
    if v_target not in ('logistics', 'hostess_count') then
      raise exception 'שורה בבקשה נשלחה בלי סוג יעד תקין. השינוי לא בוצע.' using errcode = 'P0001';
    end if;

    -- (ב) `target_qty` — **כמות-יעד, לא דלתא.**
    if jsonb_typeof(v_line -> 'target_qty') is distinct from 'number' then
      raise exception 'שורה בבקשה נשלחה בלי כמות חדשה. השינוי לא בוצע.' using errcode = 'P0001';
    end if;
    v_qty_raw := (v_line ->> 'target_qty')::numeric;
    if v_qty_raw <> trunc(v_qty_raw) then
      raise exception 'הכמות חייבת להיות מספר שלם. השינוי לא בוצע.' using errcode = 'P0001';
    end if;
    v_new_qty := v_qty_raw::integer;

    -- 🔴 AR-4 — וההודעה שלנו קודמת ל-CHECK, כי CHECK מדבר אנגלית.
    if v_new_qty <= 0 then
      raise exception 'הכמות חייבת להיות גדולה מאפס. להסרת פריט לגמרי — פני למנהלת הלוגיסטיקה.'
        using errcode = 'P0001';
    end if;

    -- (ג) שדות-המפתח, לפי היעד
    if v_target = 'logistics' then
      v_sku := btrim(coalesce(v_line ->> 'sku', ''));
      if v_sku = '' then
        raise exception 'שורת פריט נשלחה בלי מק"ט. השינוי לא בוצע.' using errcode = 'P0001';
      end if;
      -- 🔴 **נוכחות `serial_number` היא המבחין בין "שורה קיימת" ל"פריט חדש"** (חוזה 1003).
      --    ר' ההערה שמעל הפונקציה — הפקד `+ הוספת פריט שאינו בהצעה` מגיע לכאן בלעדיו.
      v_is_new := jsonb_typeof(v_line -> 'serial_number') is distinct from 'number';
      if v_is_new then
        v_serial := null;
        v_key    := v_sku || '#new';
      else
        v_serial := (v_line ->> 'serial_number')::integer;
        v_key    := v_sku || '#' || v_serial::text;
      end if;
    else
      v_is_new := false;
      -- 🔴 השומר שמונע מלקוח שסימן `hostess_count` בטעות על שורת-פריט להקפיץ בשקט את
      --    מספר-הדיילות: מספר סידורי על שורת-דיילות הוא באג-לקוח, לא ערך שמתעלמים ממנו.
      if jsonb_typeof(v_line -> 'serial_number') = 'number' then
        raise exception 'שורת הדיילות נשלחת בלי מספר סידורי. השינוי לא בוצע.' using errcode = 'P0001';
      end if;
      v_sku    := null;
      v_serial := null;
      v_key    := 'hostess_count';
    end if;

    -- אותה שורה פעמיים באותה בקשה = כפל-חיוב שקט. נעצר, לא נבחר בשקט.
    if v_key = any(v_seen) then
      raise exception 'אותה שורה נשלחה פעמיים באותה בקשה. השינוי לא בוצע.' using errcode = 'P0001';
    end if;
    v_seen := v_seen || v_key;

    -- ── המחיר, העלות והכמות-הנוכחית — **הכול מהשרת**, ובשני מסלולים נפרדים ────────
    if v_target = 'logistics' then
      select pr.category, pr.status, pr.base_price
        into v_category, v_prod_status, v_base_price
        from public.products pr where pr.sku = v_sku;

      -- ‏`logistics_sku_fkey` היה תופס — אבל באנגלית של Postgres, ואחרי שכבר עבדנו.
      if not found then
        raise exception 'המק"ט שנשלח אינו קיים בקטלוג המוצרים. השינוי לא בוצע.' using errcode = 'P0001';
      end if;
      if v_category = 'hostess' then
        raise exception 'המק"ט שנשלח הוא שורת דיילות ולא פריט. השינוי לא בוצע.' using errcode = 'P0001';
      end if;

      if not v_is_new then
        -- ═══ מסלול א' · שורה קיימת — המחיר **מוקפא** מההצעה (③ↄ) ═══════════════════
        -- 🔴 שלושת חלקי `logistics_pkey`, בשליפה **ובעדכון**.
        select l.planned_qty into v_current
          from public.logistics l
         where l.project_id = p_project_id
           and l.sku = v_sku
           and l.serial_number = v_serial
         for update;

        -- 🚫 **ולעולם לא `insert` כאן:** מספר סידורי שהלקוח שלח ואין לו שורה הוא באג-לקוח
        --    או מירוץ — הוספה שקטה הייתה נותנת ללקוח להמציא מפתח.
        if not found then
          raise exception 'לא נמצאה שורת לוגיסטיקה תואמת לפריט הזה בפרויקט. להוספת פריט חדש שלחי את השורה בלי מספר סידורי. השינוי לא בוצע.'
            using errcode = 'P0001';
        end if;

        select count(*)::integer into v_q_count
          from public.quote_services qs
         where qs.quote_id = v_quote_id and qs.sku = v_sku;

        if v_q_count = 0 then
          -- בלי הסייג `quote_id` מטען יכול לצטט שורת-מחיר של הצעה של לקוח אחר.
          raise exception 'הפריט שנשלח אינו מופיע בהצעת המחיר של הפרויקט הזה. השינוי לא בוצע.'
            using errcode = 'P0001';
        end if;
        if v_q_count > 1 then
          -- ⑬: אותו מק"ט בשני צבעים = שתי שורות-הצעה בלתי-נבדלות. **נכשל בקול** עד ש-1.4
          -- יוסיף את `logistics.quote_service_line_id`. נמדד 14/08: אפס מקרים כאלה במסד.
          raise exception 'למק"ט הזה יש יותר משורה אחת בהצעת המחיר, ולכן לא ברור לפי איזה מחיר לחייב. השינוי לא בוצע.'
            using errcode = 'P0001';
        end if;

        select qs.color, qs.closing_unit_price, qs.closing_unit_cost
          into v_q_color, v_q_price, v_q_cost
          from public.quote_services qs
         where qs.quote_id = v_quote_id and qs.sku = v_sku;

        v_delta := v_new_qty - v_current;
        if v_delta <> 0 then
          update public.logistics
             set planned_qty = v_new_qty
           where project_id = p_project_id
             and sku = v_sku
             and serial_number = v_serial;
        end if;
      else
        -- ═══ מסלול ב' · פריט חדש — המחיר **מקטלוג היום** (מדריך 1724) ══════════════
        -- ① השורה אינה יכולה להיות כפילות של שורה קיימת: אין בחוזה שדה-צבע, ולכן שתי
        --    שורות של אותו מק"ט הן בדיוק הדו-משמעות של ⑬. **מפנים לעדכן את הקיימת.**
        if exists (select 1 from public.logistics l
                    where l.project_id = p_project_id and l.sku = v_sku) then
          raise exception 'הפריט הזה כבר קיים באירוע. לעדכון הכמות שלחי את השורה הקיימת עם המספר הסידורי שלה. השינוי לא בוצע.'
            using errcode = 'P0001';
        end if;

        -- ② מוצר מושבת אינו אופציה לתוספת (הכרעת 12/07, ר' ההערה שמעל הפונקציה).
        --    🚫 ובמכוון **אינו** נבדק במסלול א' — שורה קיימת נשמרת גם אם המוצר הושבת.
        if v_prod_status <> 'active' then
          raise exception 'המוצר הזה אינו פעיל בקטלוג ולא ניתן להוסיף אותו לאירוע. השינוי לא בוצע.'
            using errcode = 'P0001';
        end if;

        -- ③ מדרגת-המחיר של היום — **תרגום מילה-במילה של `resolveUnitPrice`** (§7.27):
        --    ה-`min_qty` הגבוה ביותר שעדיין ≤ הכמות. ‏`max_qty` **אינו משתתף** — אין עליו
        --    אילוץ במסד, והסתמכות עליו הופכת שגיאת-מחירון לשגיאת-תמחור שקטה.
        --    ‏`price_tiers.sku` הוא `NOT NULL` (נמדד) ⇒ ההשוואה מדויקת ואין מדרגה גלובלית.
        select t.special_price into v_q_price
          from public.price_tiers t
         where t.sku = v_sku
           and t.min_qty <= v_new_qty
         order by t.min_qty desc
         limit 1;

        -- אין מדרגה מתאימה (או אין מדרגות בכלל) ⇒ מחיר-הבסיס. זהה ל-`resolveUnitPrice`.
        if v_q_price is null then
          v_q_price := v_base_price;
        end if;

        -- ④ העלות — מ-`product_costs` (§7.83↳), לא מ-`products`.
        select c.cost into v_q_cost from public.product_costs c where c.sku = v_sku;
        if v_q_cost is null then
          -- ‏`project_changes.unit_cost_snapshot` הוא `NOT NULL` ⇒ בלי זה נופלים על `23502`
          -- באנגלית, אחרי שכבר נכתבה שורת-לוגיסטיקה.
          raise exception 'למוצר הזה אין עלות מוגדרת בקטלוג, ולכן לא ניתן לרשום אותו כשינוי תכולה. השינוי לא בוצע.'
            using errcode = 'P0001';
        end if;

        -- ⑤ צבע: לפריט חדש אין שורת-הצעה ⇒ אין צבע. ‏`NULL` הוא ערך לגיטימי ומשמעותו
        --    *"ללא צבע מוגדר"* (`screens-approved:838`), לא "המידע חסר".
        v_q_color := null;

        -- ⑥ המספר הסידורי — **מוקצה בשרת, על הפרויקט כולו** (ר' ההערה שמעל הפונקציה).
        select coalesce(max(l.serial_number), 0) + 1 into v_serial
          from public.logistics l
         where l.project_id = p_project_id;

        insert into public.logistics (project_id, sku, serial_number, planned_qty)
        values (p_project_id, v_sku, v_serial, v_new_qty);

        -- שורה חדשה = הכמות כולה היא הדלתא. ‏`v_new_qty > 0` כבר נאכף (AR-4) ⇒ תמיד ≠ 0.
        v_current := 0;
        v_delta   := v_new_qty;
      end if;
    else
      -- שורת-הדיילות של ההצעה = השורה היחידה שקטגוריית-המוצר שלה `hostess`.
      select count(*)::integer into v_q_count
        from public.quote_services qs
        join public.products pr on pr.sku = qs.sku
       where qs.quote_id = v_quote_id and pr.category = 'hostess';

      if v_q_count = 0 then
        raise exception 'להצעת המחיר של הפרויקט אין שורת דיילות, ולכן אין מחיר לרשום לשינוי. השינוי לא בוצע.'
          using errcode = 'P0001';
      end if;
      if v_q_count > 1 then
        raise exception 'להצעת המחיר של הפרויקט יש יותר משורת דיילות אחת, ולכן לא ברור לפי איזה מחיר לחייב. השינוי לא בוצע.'
          using errcode = 'P0001';
      end if;

      select qs.closing_unit_price, qs.closing_unit_cost
        into v_q_price, v_q_cost
        from public.quote_services qs
        join public.products pr on pr.sku = qs.sku
       where qs.quote_id = v_quote_id and pr.category = 'hostess';

      -- `project_changes_target_shape` דורש `color is null` בשורת-דיילות (צעד 1.2).
      v_q_color := null;

      -- הכמות הנוכחית — **מהיעד עצמו** (`projects`), ר' הערת-ה-why למעלה.
      v_current := v_required_now;
      v_delta   := v_new_qty - v_current;
      if v_delta <> 0 then
        update public.projects
           set required_hostess_count = v_new_qty
         where project_id = p_project_id;
        -- שמירה על עקביות אם המטען נושא בטעות שתי שורות-דיילות (הכפילות כבר נעצרה למעלה,
        -- וזה החגורה השנייה).
        v_required_now := v_new_qty;
      end if;
    end if;

    -- ── התיעוד (②) — שורה אחת לכל שינוי אמיתי. דלתא אפס אינה שינוי ואינה נרשמת ────
    if v_delta <> 0 then
      insert into public.project_changes (
        project_id, change_group_id, sku, color, change_target, delta_qty,
        unit_price_snapshot, unit_cost_snapshot, reason, performed_by)
      values (
        p_project_id,
        v_group,
        -- `project_changes_target_shape` דורש `sku`/`color` ריקים בשורת-דיילות (צעד 1.2).
        v_sku,       -- `null` בשורת-דיילות, לפי ההשמה למעלה
        v_q_color,   -- `null` בשורת-דיילות, לפי ההשמה למעלה
        v_target,
        v_delta,
        -- ③ↄ שורה קיימת: המחיר **המוקפא** של ההצעה, לא מחיר הקטלוג של היום.
        -- פריט חדש: מחיר-המדרגה של **היום** — ובשני המקרים **טרום-הנחה**, כי ההנחה
        -- מנוכה ברמת סכום-הביניים. ר' ההערה שמעל הפונקציה.
        v_q_price,
        v_q_cost,
        v_reason,
        v_actor);
    end if;

    v_revenue := round(v_delta * v_q_price, 2);
    v_total   := v_total + v_revenue;

    -- 🔴 שמות-השדות ביציאה תואמים לשמות-החוזה בכניסה, כדי שפזה 3 תקרא טבלה אחת.
    --    ‏`unit_price_snapshot` ו-`revenue_delta` **מותנים ב-'הצעות מחיר'** (`screens-approved:809`).
    --    🔑 **ו-`serial_number` החוזר הוא זה שהוקצה בשרת** כשהשורה חדשה — זה הערוץ היחיד
    --       שדרכו הדיאלוג לומד את המפתח של השורה שזה עתה נוצרה.
    v_lines_out := v_lines_out || jsonb_build_array(jsonb_build_object(
      'target',              v_target,
      'sku',                 v_sku,
      'serial_number',       v_serial,
      'is_new_line',         v_is_new,   -- מצב ④ של משטח 6 ("פריט שאינו בהצעה")
      'target_qty',          v_new_qty,
      'delta_qty',           v_delta,
      'unit_price_snapshot', case when v_can_read_quotes then v_q_price end,
      'revenue_delta',       case when v_can_read_quotes then v_revenue end));
  end loop;

  -- ⑯: **מדווח, לא חוסם.** מול `final_event_date + final_start_time` בשעון ישראל —
  -- לא מול חצות ולא בימים (`screens-approved` §⑥).
  select floor(extract(epoch from
           (((p.final_event_date + coalesce(p.final_start_time, '00:00'::time))
              at time zone 'Asia/Jerusalem') - now())) / 3600)::integer
    into v_hours
    from public.projects p
   where p.project_id = p_project_id;

  return jsonb_build_object(
    'change_group_id',     v_group,
    'lines',               v_lines_out,
    'revenue_delta_total', case when v_can_read_quotes then v_total end,
    'can_read_revenue',    v_can_read_quotes,  -- `null` בשדות-הכסף = חסימה, לא חוסר-נתון
    'hours_to_event',      v_hours);
end
$$;


-- =====================================================================================
-- ‏§③ `cancel_project` — ⑤ · ⑩ · ⑪ · ⑭ · ㉕ · AR-1 · AR-3
-- =====================================================================================
--
-- 🔴 **⑤ — שחרור הדיילות אוטומטי. כולן, יחד, בלי בחירה.** ‏🔑 ואין לבלבל עם **צמצום
--   תכולה** (6→4), ששם הבחירה **כן** קיימת והיא של **מנהלת הגיוס** — במסך של מודול 4.
--
-- 🔴 **⑩ — שלוש סיבות ביטול, לא ארבע.** *"בעיית איוש"* הוסרה, במילותיו:
--   *"שמעת על עסק שמבטל ללקוח כי אין לו עובדים?"*. ‏AR-1: **עמודה אחת בת שלושה ערכים**
--   (`customer` · `force_majeure` · `other`), ו**סוג-הכסף נגזר בקוד ולעולם אינו נשמר**
--   (`other` מתנהג כמו `customer` לעניין הפיצוי).
--
-- 🚫 **㉕ — הביטול אינו נוגע ב-`logistics` בשום צורה.** אין סטטוס-פריט רביעי ואין מפל.
--   פריט שסומן `ordered` ברגע הביטול הוא **הראיה לחיוב** "הוצאות שבוצעו טרם הביטול"
--   (§7.16) — לשנות אותו = למחוק את ההוכחה.
--
-- 🚫 **אינה שולחת מייל** (AR-5). היא מחזירה את רשימת הדיילות, והלקוח שולח אחרי ה-commit.
--   ‏**ו-`full_name` מותנה ב-'דיילות'** (AR-3), בדיוק כמו ב-§①.
--
-- 🔴 **סדר: `projects` קודם, `assignments` אחריו — ולא להפוך.** צעד 1.9 תולה
--   ‏`trg_recompute_project_status` על `assignments`, ו-`recompute_project_status` חוזרת
--   מוקדם לכל סטטוס שאינו אחד משלושת הפעילים. בסימון `cancelled` תחילה, כל שחרור מפעיל
--   ‏`recompute` שחוזרת מייד; בסדר ההפוך היא מחשבת סטטוס-ביניים שנדרס מיד אחר-כך —
--   אותה תוצאה, עבודה מיותרת, וחלון שבו סטטוס-הפרויקט אינו נכון בתוך הטרנזקציה.

create or replace function public.cancel_project(
  p_project_id    integer,
  p_cancel_type   text,
  p_cancel_reason text
) returns jsonb
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_actor              text;
  v_can_read_hostesses boolean;
  v_type               text;
  v_reason             text;
  v_event_name         text;
  v_status             text;
  v_closed_at          timestamptz;
  v_hostesses          jsonb := '[]'::jsonb;
  v_final_count        integer := 0;
  v_live_count         integer := 0;
  v_released           integer := 0;
  v_cancelled_at       timestamptz;
begin
  perform public.assert_module_permission('פרויקטים', array['edit']);

  -- ── שער-הקריאה השני (AR-3), מחושב פעם אחת ────────────────────────────────────────
  select exists (
    select 1
      from public.permissions p
     where p.role_id = (select public.current_user_role_id())
       and p.module_id = (select m.module_id from public.modules m where m.module_name = 'דיילות')
       and p.permission_level = any(array['edit', 'view'])
  ) into v_can_read_hostesses;

  v_actor := auth.email();
  if v_actor is null then
    raise exception 'לא זוהתה משתמשת מחוברת. התחברי מחדש ונסי שוב.' using errcode = '42501';
  end if;

  -- ── ולידציה (screens-approved משטח 7 §⑦) ─────────────────────────────────────────
  v_type := btrim(coalesce(p_cancel_type, ''));
  if v_type = '' then
    -- 🚫 ואין ברירת-מחדל: **הבחירה נושאת כסף** — ההבדל בין 100% ל-0% לדיילת.
    raise exception 'סוג הביטול — חובה לבחור אחד.' using errcode = 'P0001';
  end if;
  if v_type not in ('customer', 'force_majeure', 'other') then
    raise exception 'סוג ביטול לא מוכר. הסוגים הקיימים הם: הלקוח ביטל, כוח עליון, אחר.'
      using errcode = 'P0001';
  end if;

  -- ⑪: הסיבה חובה **בכל שלושת הסוגים**, כולל "כוח עליון". הנוסח נעול ב-§3.7.
  v_reason := btrim(coalesce(p_cancel_reason, ''));
  if v_reason = '' then
    raise exception 'חובה לכתוב סיבה. היא נשמרת בכרטיס והיא ההסבר היחיד שיישאר אחרי הביטול.'
      using errcode = 'P0001';
  end if;

  select p.event_name, p.project_status, p.operationally_closed_at
    into v_event_name, v_status, v_closed_at
    from public.projects p
   where p.project_id = p_project_id
   for update;

  if not found then
    raise exception 'הפרויקט המבוקש אינו קיים.' using errcode = 'P0001';
  end if;

  -- "אין ביטול-ביטול" (הכרעת-ישי: *"בא נניח שלא"*).
  if v_status = 'cancelled' then
    raise exception 'הפרויקט כבר בוטל. הפעולה אינה הפיכה, ופרויקט מבוטל אינו חוזר לפעילות.'
      using errcode = 'P0001';
  end if;

  -- ㉙ — הפרדיקט המלא, בלי מסלול-מילוט. ביטול אפשרי כל עוד הפרויקט פעיל.
  -- ⬜ **וזה הפריט היחיד שנשאר לישי** — ר' "צריך את ישי" ב-notes: אם לקוח מבטל ודנה
  --    רושמת רק אחרי שהתאריך עבר, נדרש חלון-חסד. **‏S-14 + ⑫ תומכים בסירוב הנוכחי.**
  if v_closed_at is not null
     or v_status in ('event_finished', 'awaiting_invoice', 'awaiting_payment', 'finished') then
    raise exception 'האירוע כבר התקיים או נסגר, ולא ניתן לבטל אותו. ביטול אפשרי כל עוד הפרויקט פעיל.'
      using errcode = 'P0001';
  end if;

  -- ── מי חיה **לפני** השחרור — נאסף קודם, כי `RETURNING` מחזיר את הסטטוס החדש ────────
  -- הקיפול (AR-3): השורה האחרונה פר-דיילת היא מצבה האמיתי. ‏`hostess_id` + `full_name`
  -- בלבד — 🚫 לא מייל, לא טלפון, לא תעריף — **ו-`full_name` עצמו רק למי שיש לה 'דיילות'**
  -- (מנהלת הלוגיסטיקה `blocked` שם, נמדד).
  select coalesce(
           jsonb_agg(jsonb_build_object(
             'hostess_id',           w.hostess_id,
             'full_name',            case when v_can_read_hostesses then h.full_name end,
             -- רק המאושרות סופית שיריינו יומן ⇒ רק הן נספרות בשורת-הפיצוי (§7.16ב).
             'was_finally_approved', w.assignment_status = 'finally_approved')
             order by h.full_name),
           '[]'::jsonb),
         count(*) filter (where w.assignment_status = 'finally_approved')::integer,
         count(*)::integer
    into v_hostesses, v_final_count, v_live_count
    from (
      select distinct on (a.hostess_id) a.hostess_id, a.assignment_status
        from public.assignments a
       where a.project_id = p_project_id
       order by a.hostess_id, a.assignment_number desc
    ) w
    join public.hostesses h on h.hostess_id = w.hostess_id
   where w.assignment_status in ('finally_approved', 'pending', 'confirmed_available');

  -- ── 1. הפרויקט (ר' הערת-הסדר מעל הפונקציה) ───────────────────────────────────────
  update public.projects p
     set project_status = 'cancelled',
         cancelled_at   = now(),
         cancelled_by   = v_actor,
         cancel_type    = v_type,
         cancel_reason  = v_reason
   where p.project_id = p_project_id
  returning p.cancelled_at into v_cancelled_at;

  -- ── 2. ⑤ — כל שיבוץ חי ⇒ `released`. כולן, יחד, בלי בחירה ────────────────────────
  -- שלושת הסטטוסים החיים, מתוך ששת הערכים של `assignments_assignment_status_check`
  -- (נמדד): `pending` · `confirmed_available` · `finally_approved`. השלושה האחרים
  -- (`declined` · `released` · `approval_withdrawn`) כבר אינם זימון חי.
  update public.assignments a
     set assignment_status = 'released'
   where a.project_id = p_project_id
     and a.assignment_status in ('finally_approved', 'pending', 'confirmed_available');
  get diagnostics v_released = row_count;

  -- 🚫 ‏`public.logistics` **אינה מוזכרת כאן במכוון** (㉕).

  return jsonb_build_object(
    'project_id',             p_project_id,
    'event_name',             v_event_name,
    'cancel_type',            v_type,
    'cancelled_at',           v_cancelled_at,
    'released_rows',          v_released,
    'finally_approved_count', v_final_count,
    'other_live_count',       v_live_count - v_final_count,
    'can_read_hostesses',     v_can_read_hostesses,
    'hostesses_to_notify',    v_hostesses,
    'logistics_untouched',    true);
end
$$;


-- =====================================================================================
-- ‏§④ הרשאות-הרצה
-- 🧨 המוקש, מתועד ב-`20260809174501`: Supabase מגדיר `alter default privileges` שמעניק
--    EXECUTE ל-`anon`/`authenticated`/`service_role` על כל פונקציה חדשה ב-`public` ⇒
--    ‏`revoke ... from public` **אינו נוגע בהן. יש לשלול בשם.**
-- =====================================================================================

revoke execute on function public.update_project_details(integer, date, text, time without time zone, time without time zone) from public, anon;
grant  execute on function public.update_project_details(integer, date, text, time without time zone, time without time zone) to authenticated;

revoke execute on function public.apply_scope_change(integer, jsonb, text) from public, anon;
grant  execute on function public.apply_scope_change(integer, jsonb, text) to authenticated;

revoke execute on function public.cancel_project(integer, text, text) from public, anon;
grant  execute on function public.cancel_project(integer, text, text) to authenticated;

-- 🔴 העוזר הפנימי — **שולל משלושתם ואינו מעניק לאיש.** הקוראות הן `SECURITY DEFINER`
--    ורצות כבעלים, ולכן קוראות לו בלי קשר. התקדים: `enforce_hostess_min_wage`.
-- ⚠️ **ואם 1.8א מוחל לפניו ובלי שורה כזאת משלו — קיים חלון שבו העוזר קריא ל-`anon`.**
--    ר' ממצא-הבקרה על 1.8א; האיחוד לשתי-מיגרציה-אחת סוגר את החלון לגמרי.
revoke execute on function public.assert_module_permission(text, text[]) from public, anon, authenticated;


-- =====================================================================================
-- ‏§⑤ אימות אחרי החלה (קריאה בלבד — להריץ ידנית, אינו חלק מהמיגרציה)
-- =====================================================================================
-- select p.proname, pg_get_function_identity_arguments(p.oid), p.prosecdef, p.proconfig, p.proacl::text
--   from pg_proc p
--  where p.pronamespace = 'public'::regnamespace
--    and p.proname in ('assert_module_permission','update_project_details','apply_scope_change','cancel_project')
--  order by 1;
-- **צפוי:** 4 שורות · `prosecdef = true` בכולן · `proconfig = {search_path=}` בכולן ·
--   `anon` נעדר מכל `proacl` · `authenticated` נוכח בשלוש ונעדר מ-`assert_module_permission`.
--
-- ביטול מלא:
-- drop function if exists public.cancel_project(integer, text, text);
-- drop function if exists public.apply_scope_change(integer, jsonb, text);
-- drop function if exists public.update_project_details(integer, date, text, time without time zone, time without time zone);
-- drop function if exists public.assert_module_permission(text, text[]);
-- =====================================================================================
