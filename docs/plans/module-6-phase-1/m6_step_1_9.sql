-- =====================================================================================
-- Module 6 (Projects) — Migration I: מכונת-הסטטוסים (טריגרים) + עבודת pg_cron יומית
-- כוונת-השם בריפו: supabase/migrations/<ts>_module6_status_machine_and_cron.sql
-- =====================================================================================
-- why (מדריך-מיקרו מ6 · צעד 1.9 · AS-1 · ㉓ · ㉚ · 🔗 מראת §7.43 + §7.44 · db_roadmap M6-11):
--   • הסטטוס התפעולי של פרויקט (`טרם החל` / `בתהליך` / `מוכן לביצוע`) הוא נגזרת ולא שדה
--     שמישהו מקליד. שלושה מקורות משנים אותו: שורות `assignments`, שורות `logistics`,
--     ועמודת `projects.required_hostess_count`. ⇒ שלושה טריגרים, פונקציית-חישוב אחת.
--   • `recompute_project_status(p_project_id)` — הנוסחה עצמה. `trg_recompute_project_status()`
--     — עטיפת-הטריגר שמחלצת את `project_id` ומזמינה אותה. 🔴 בענף DELETE‏ `NEW` הוא null,
--     ולכן המזהה חייב להגיע מ-`OLD` — זה הענף שנשכח והוא הסיבה שהעטיפה נכתבת במפורש.
--   • 🔴 שומר-§7.44: החישוב רץ **רק** כשהסטטוס הנוכחי הוא אחד משלושת הפעילים. בלעדיו,
--     עריכה מאוחרת (למשל שחרור דיילת) הייתה גוררת פרויקט **סגור או מבוטל** בחזרה לציר הפעיל.
--   • ㉚: מעבר ל-`event_finished` נכתב בעבודת `pg_cron` יומית ולא בטריגר — "התאריך עבר" הוא
--     חלוף-זמן ולא אירוע-נתונים. סוגר §7.32.
--   • ㉓: פרויקט שמגיע ל-100% **אחרי** תאריך האירוע נוחת ב-`event_finished`, לא ב-`ready`.
--
-- הפיכוּת: הפיכה במלואה מבחינת סכמה — `drop trigger` ×3 · `drop function` ×2 ·
--   `select cron.unschedule('module6-event-finished')`. 🔴 **מה שאינו הפיך אוטומטית: הדאטה.**
--   המיגרציה מריצה בסופה מילוי-ראשוני שמשנה את הסטטוס של כל ארבעת הפרויקטים החיים
--   (כולם `not_started` היום). הערכים שלפני ההרצה נמדדו ורשומים בקובץ-ההערות; שחזור = UPDATE ידני.
--   ⇒ נאמר בקול בשער ה-typed-echo.
--
-- ⚠️ `set search_path = ''` — לא `public, pg_temp`. זו המוסכמה **הנמדדת** של הריפו:
--   14 מתוך 14 הפונקציות החיות ב-`public` משתמשות ב-`search_path=""`, אפס משתמשות באחר
--   (נמדד 14/08/2026). כל ההפניות בגוף מוסמכות-סכמה במלואן, ולכן זו החלפה ישירה.
--
-- ⚠️ שתי הפונקציות אינן ניתנות-לקריאה מהלקוח: `revoke ... from public, anon, authenticated`.
--   ל-`recompute_project_status` **אין בדיקת-הרשאה פנימית** (היא מנגנון-מערכת, לא RPC של מסך),
--   ולכן ה-`revoke` **הוא** השער. ‏`grant ... to authenticated` כאן היה חושף כתיבת-סטטוס
--   בלי שום בדיקה דרך ‎/rpc לכל משתמש מחובר.
-- =====================================================================================


-- ─────────────────────────────────────────────────────────────────────────────────────
-- ① פונקציית-החישוב — הנוסחה של מכונת-הסטטוסים
-- ─────────────────────────────────────────────────────────────────────────────────────
create or replace function public.recompute_project_status(p_project_id int)
  returns void language plpgsql security definer set search_path = '' as $$
declare v_status text; v_required int; v_confirmed int; v_log_total int; v_log_ready int;
        v_any_human_action boolean;
begin
  select project_status, required_hostess_count into v_status, v_required
    from public.projects where project_id = p_project_id for update;

  -- 🔗 מראת §7.44↳ — SSOT: PROJECT_MASTER §7.
  -- 🔴 THE GUARD. Recompute ONLY while the project is on the active axis.
  -- Without it, a closed / cancelled / invoiced project gets dragged backwards by a late edit.
  if v_status not in ('not_started','in_progress','ready') then return; end if;

  -- staffing: MAX(assignment_number) per hostess, then count finally_approved
  select count(*) into v_confirmed from (
    select distinct on (a.hostess_id) a.assignment_status from public.assignments a
     where a.project_id = p_project_id order by a.hostess_id, a.assignment_number desc) w
   where w.assignment_status = 'finally_approved';

  select count(*), count(*) filter (where item_status = 'ready')
    into v_log_total, v_log_ready from public.logistics where project_id = p_project_id;

  -- 🔴 "first human action" = an assignments row exists OR an item LEFT not_started.
  -- 🚫 NOT "a logistics row was created" — logistics rows are born automatically with the
  -- project, so that reading makes `not_started` an unreachable status. (spec.md §12⑨)
  select exists (select 1 from public.assignments where project_id = p_project_id)
      or exists (select 1 from public.logistics   where project_id = p_project_id
                   and item_status <> 'not_started')
    into v_any_human_action;

  if v_confirmed >= v_required                                  -- 🔴 ≥, never = (§7.43)
     and (v_log_total = 0 or v_log_ready = v_log_total)         -- zero rows ⇒ complete
  then
    -- ㉓: 100% AFTER the date has passed ⇒ event_finished, not ready
    update public.projects
       set project_status = case when final_event_date < current_date
                                 then 'event_finished' else 'ready' end
     where project_id = p_project_id;
  elsif v_any_human_action then
    update public.projects set project_status = 'in_progress' where project_id = p_project_id;
  else
    update public.projects set project_status = 'not_started'  where project_id = p_project_id;
  end if;
end $$;

revoke execute on function public.recompute_project_status(int) from public, anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────────────
-- ② עטיפת-הטריגר — פונקציה אחת שמשרתת את שלוש הטבלאות
--    (לשלושתן עמודת `project_id`, ובכולן היא NOT NULL — נמדד 14/08/2026)
-- ─────────────────────────────────────────────────────────────────────────────────────
create or replace function public.trg_recompute_project_status()
  returns trigger language plpgsql security definer set search_path = '' as $$
declare v_project_id int;
begin
  -- 🔴 בענף DELETE‏ `NEW` הוא null. זה הענף שנשכח, וזו הסיבה שהעטיפה קיימת כפונקציה נפרדת.
  if tg_op = 'DELETE' then
    v_project_id := old.project_id;
  else
    v_project_id := new.project_id;
  end if;

  perform public.recompute_project_status(v_project_id);

  -- שורה שהועברה בין פרויקטים (UPDATE ששינה `project_id`) הייתה משאירה את הפרויקט **הישן**
  -- עם מדד ישן ובלי שאיש ידע. נדיר, אבל הכישלון שקט לחלוטין ⇒ מחשבים גם אותו.
  if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id then
    perform public.recompute_project_status(old.project_id);
  end if;

  return null;   -- AFTER ... FOR EACH ROW ⇒ ערך-ההחזרה נזרק ממילא
end $$;

revoke execute on function public.trg_recompute_project_status() from public, anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────────────
-- ③ שלושת הטריגרים — שלושה מקורות, והשלישי הוא זה שנשכח (spec.md §2.1, 🔄3 · AS-1)
-- ─────────────────────────────────────────────────────────────────────────────────────
drop trigger if exists assignments_recompute_project_status on public.assignments;
create trigger assignments_recompute_project_status
  after insert or update or delete on public.assignments
  for each row execute function public.trg_recompute_project_status();

drop trigger if exists logistics_recompute_project_status on public.logistics;
create trigger logistics_recompute_project_status
  after insert or update or delete on public.logistics
  for each row execute function public.trg_recompute_project_status();

-- 🔴 המקור השלישי — ושני שומרי-הרקורסיה שלו:
--   (א) `of required_hostess_count` — הטריגר נדלק רק כשהעמודה הזו נמצאת ב-SET של ה-UPDATE.
--       `recompute_project_status` כותבת **אך ורק** `project_status` ⇒ היא אינה יכולה להצית
--       את הטריגר מחדש. ‏`after update` בלי `of` היה לולאה אינסופית.
--   (ב) `when (old … is distinct from new …)` — שומר-משנה, ותקדים-בית: `projects_sync_assignment_dates`
--       החי בנוי בדיוק כך. חוסם גם UPDATE שמזכיר את העמודה ב-SET בלי לשנות את ערכה.
drop trigger if exists projects_recompute_on_required_count on public.projects;
create trigger projects_recompute_on_required_count
  after update of required_hostess_count on public.projects
  for each row
  when (old.required_hostess_count is distinct from new.required_hostess_count)
  execute function public.trg_recompute_project_status();


-- ─────────────────────────────────────────────────────────────────────────────────────
-- ④ עבודת pg_cron היומית (㉚ — סוגרת §7.32), לפי דפוס-הרישום של 20260723120500
-- ─────────────────────────────────────────────────────────────────────────────────────
-- ⚠️ `0 2 * * *` במכוון, אחרי `0 1` של מ3 ואחרי `30 1` של מ1 — בלי חפיפה.
-- ⚠️ `cron.timezone = GMT` (נמדד חי) ⇒ 02:00 בעבודה = **05:00 שעון ישראל בקיץ** / 04:00 בחורף.
-- ⚠️ `< current_date`, לא `<=` — האירוע של **היום** עדיין מוצג (A14, spec.md §2.1).
-- ⚠️ `cron.schedule` עושה upsert לפי שם-העבודה ⇒ הרצה חוזרת אינה יוצרת עבודה כפולה.
select cron.schedule('module6-event-finished', '0 2 * * *', $job$
  update public.projects
     set project_status = 'event_finished'
   where project_status in ('not_started','in_progress','ready')
     and final_event_date < current_date;
$job$);


-- ─────────────────────────────────────────────────────────────────────────────────────
-- ⑤ מילוי-ראשוני חד-פעמי — 🔴 משנה נתונים גלויים. להצהיר בשער ה-typed-echo.
-- ─────────────────────────────────────────────────────────────────────────────────────
-- הטריגרים אינם מחשבים למפרע. ארבעת הפרויקטים החיים יושבים כולם על `not_started`
-- (נמדד 14/08/2026 11:48) ולכן בלי שתי ההרצות שלמטה כל מסכי מ6 ייבנו מול סטטוסים שקריים.

-- (א) הרצת הנוסחה על כל פרויקט קיים.
select public.recompute_project_status(project_id) from public.projects;

-- (ב) 🔴 הרצת-השלמה של **גוף עבודת-ה-cron**, פעם אחת, כאן ועכשיו.
--     בלעדיה #7 (תאריך 01/08/2026, עבר לפני 13 יום) היה יורד ל-`not_started` בשלב (א) —
--     אפס שורות-שיבוץ ושתי שורות-לוגיסטיקה שלא זזו ⇒ אין "פעולה אנושית" — ולשונית `לסגירה`
--     הייתה נשארת ריקה עד 05:00 למחרת. זהו בדיוק סעיף-הקבלה §8.2 של המדריך
--     (*"#7 actually moved to event_finished"*) ותנאי-הקבלה #1 של הצעד.
--     ההרצה זהה בתו לגוף העבודה המתוזמנת ⇒ אין כאן לוגיקה שנייה שיכולה להיפרד ממנה.
update public.projects
   set project_status = 'event_finished'
 where project_status in ('not_started','in_progress','ready')
   and final_event_date < current_date;


-- =====================================================================================
-- 🔻 VERIFY — להריץ אחרי ההחלה. הציפיות למטה נגזרו מהנתונים החיים של 14/08/2026 11:48
--    ולא הועתקו מהמדריך (ציפיית המדריך ל-#7 לא הייתה נגישה מהוראותיו — ראו קובץ-ההערות).
-- =====================================================================================
--
-- (1) הסטטוסים אחרי המילוי-הראשוני:
--
--   select project_id, project_status, final_event_date, required_hostess_count
--     from public.projects order by project_id;
--
--   צפוי — ארבע שורות:
--     #3  → not_started    (05/11/2026 · 0 שורות-שיבוץ · 2 שורות-לוגיסטיקה ב-not_started)
--     #7  → event_finished (01/08/2026 · הועבר ע"י הרצת-ההשלמה ⑤ב)
--     #8  → in_progress    (15/10/2026 · 9 שורות-שיבוץ · 1 מאושרת-סופית מתוך 6)
--     #11 → in_progress    (20/10/2026 · שורת-שיבוץ אחת · 0 מתוך 1 · אפס לוגיסטיקה)
--
-- (2) שלוש עבודות cron:
--
--   select jobname, schedule, active from cron.job order by schedule, jobname;
--
--   צפוי — שלוש שורות:
--     module3-quote-expiry            | 0 1 * * *  | t
--     module6-event-finished          | 0 2 * * *  | t
--     module1-login-attempts-cleanup  | 30 1 * * * | t
--
-- (3) שתי הפונקציות קיימות, SECURITY DEFINER, ואינן חשופות ללקוח:
--
--   select p.proname, p.prosecdef, p.proconfig,
--          has_function_privilege('anon',          p.oid, 'execute') as anon_exec,
--          has_function_privilege('authenticated', p.oid, 'execute') as auth_exec
--     from pg_proc p
--    where p.pronamespace = 'public'::regnamespace
--      and p.proname in ('recompute_project_status','trg_recompute_project_status')
--    order by 1;
--
--   צפוי — שתי שורות · prosecdef = true · proconfig = {"search_path="""} ·
--          anon_exec = false · auth_exec = false.
--
-- (4) שלושת הטריגרים, ובפרט שומר-הרקורסיה על `projects`:
--
--   select c.relname, t.tgname, pg_get_triggerdef(t.oid)
--     from pg_trigger t join pg_class c on c.oid = t.tgrelid
--    where not t.tgisinternal and t.tgname like '%recompute%' order by 1;
--
--   צפוי — שלוש שורות, ובשורת `projects` מופיעים **גם** `AFTER UPDATE OF required_hostess_count`
--   **וגם** `WHEN ((old.required_hostess_count IS DISTINCT FROM new.required_hostess_count))`.
--
-- (5) 🔴 הוכחת אי-הרקורסיה, בפועל ובלי להשאיר שריטה בנתונים.
--     הבלוק משנה `required_hostess_count`, מצית את הטריגר השלישי, ואז מפיל את עצמו
--     בכוונה כדי לגלגל הכול לאחור. **אין commit.**
--
--   do $proof$
--   begin
--     update public.projects set required_hostess_count = required_hostess_count + 1
--      where project_id = 3;
--     raise exception 'ROLLBACK-BY-DESIGN: הטריגר רץ עד הסוף — אין רקורסיה'
--       using errcode = 'P0001';
--   end $proof$;
--
--   צפוי — שגיאה **P0001** עם הטקסט העברי שלמעלה.
--   🔴 שגיאת **54001** (`stack depth limit exceeded`) פירושה שהרקורסיה כן קיימת ⇒ להיכשל.
--   לאחר מכן: `select project_id, required_hostess_count from public.projects where project_id = 3;`
--   מחזיר **6** — כלומר הגלגול-לאחור עבד ושום נתון לא זז.
-- =====================================================================================
