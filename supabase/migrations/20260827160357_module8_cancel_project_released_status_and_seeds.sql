-- =============================================================================
-- מודול 8 · מיגרציה G · צעד 1.7 — האחרונה בפזה 1
-- =============================================================================
-- שני דברים שאין ביניהם קשר, ולכן הם באותה מיגרציה: שניהם "מה שחסר כדי
-- שהמספרים שכבר נבנו יהיו נכונים".
--
-- 🔴 **① הרחבת `cancel_project` — פונקציה ממוזגת וחיה של מודול 6.**
-- **הבעיה (R4-F2):** כשפרויקט מבוטל, הפונקציה הופכת **את כל השיבוצים החיים**
-- ל-`released` — ובכך **מוחקת את המידע מי הייתה מאושרת-סופית.** אבל פיצוי-§7.16
-- משולם **רק** למי שהייתה מאושרת-סופית. ⇒ בלי התיקון, פיצוי-הביטול אינו בר-חישוב
-- מול הקוד הממוזג, ודיילת שהאירוע שלה בוטל **לא הייתה מקבלת את מה שמגיע לה**.
--
-- 🔴 **הגוף נמשך חי מ-`pg_get_functiondef` לפני העריכה, ולא נבנה מקובץ ישן.**
-- זה מוקש מתועד ביוקר: ‏12/08/2026 מיגרציה שנבנתה מגרסה שקדמה לתיקון שברה
-- **אישור-הצעה אמיתי בשקט למשך שלושה ימים**, ונתפסה רק ברהרסל-הדגמה חי.
-- **הדלתא כאן: הוספה אחת ל-`set` של UPDATE אחד.** כל השאר זהה בייט-בבייט.
--
-- ⚠️ **למה `released_from_status = a.assignment_status` תופס את הערך הישן:**
-- ב-UPDATE של Postgres, הצד הימני של `set` נקרא מהשורה **לפני** העדכון. שתי
-- ההשמות באותו `set` רואות את אותו מצב-מקור, ולכן אין כאן תלות-סדר.
-- ⚠️ **לביטולים חדשים בלבד** — ביטולי-עבר נשארים NULL ואינם מניבים פיצוי.
-- זו מגבלה מוצהרת (§4.5⑤), לא פער.
--
-- 🌱 **② שני זרעי-פרמטרים שהמספרים כבר מחכים להם:**
--   ‏`תנאי_תשלום_ימים = 30` — שוטף+30, ומכאן נגזרים "ימי איחור" (§7.20א). **עד
--   עכשיו הוא לא היה קיים במסד כלל**, ולכן שני הקוראים של מ8 מחזירים `NULL`
--   ומועד-הפירעון אינו חשיב. ‏`param_type='pricing_timing'` (T22 — הטיפוס של
--   `סכום_נסיעות_למשמרת`, פרמטר-מכניקת-הכסף הקרוב ביותר).
--   ⚠️ ‏`products_and_params.md` **אינו נושא אף אחד משני הפרמטרים** — הוא עונה
--   על ה-enum בלבד. אין שם מה לחפש.
--
--   ‏`סכום_נסיעות_למשמרת` **0 → 22.60** (ה20) — תקרת-החוק היומית. הערך 0 שהיה
--   מרוקן את עמודת-הנסיעות בכל דוח-שכר. **⚠️ §7.69 נשאר פתוח: אימות הסכום מול
--   רו"ח לפני מ10.** זה ערך-בדין, לא ערך-סופי.
--   🔑 **ומכאן העוגן השלישי מושלם:** שורת אפרת דהן עוברת מ-270.00 ל-**292.60**.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- ① cancel_project — הגוף החי + תוספת אחת
-- -----------------------------------------------------------------------------
create or replace function cancel_project(p_project_id integer, p_cancel_type text, p_cancel_reason text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
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

  v_type := btrim(coalesce(p_cancel_type, ''));
  if v_type = '' then
    raise exception 'סוג הביטול — חובה לבחור אחד.' using errcode = 'P0001';
  end if;
  if v_type not in ('customer', 'force_majeure', 'other') then
    raise exception 'סוג ביטול לא מוכר. הסוגים הקיימים הם: הלקוח ביטל, כוח עליון, אחר.'
      using errcode = 'P0001';
  end if;

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

  if v_status = 'cancelled' then
    raise exception 'הפרויקט כבר בוטל. הפעולה אינה הפיכה, ופרויקט מבוטל אינו חוזר לפעילות.'
      using errcode = 'P0001';
  end if;

  if v_closed_at is not null
     or v_status in ('event_finished', 'awaiting_invoice', 'awaiting_payment', 'finished') then
    raise exception 'האירוע כבר התקיים או נסגר, ולא ניתן לבטל אותו. ביטול אפשרי כל עוד הפרויקט פעיל.'
      using errcode = 'P0001';
  end if;

  select coalesce(
           jsonb_agg(jsonb_build_object(
             'hostess_id',           w.hostess_id,
             'full_name',            case when v_can_read_hostesses then h.full_name end,
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

  update public.projects p
     set project_status = 'cancelled',
         cancelled_at   = now(),
         cancelled_by   = v_actor,
         cancel_type    = v_type,
         cancel_reason  = v_reason
   where p.project_id = p_project_id
  returning p.cancelled_at into v_cancelled_at;

  -- ⑤ — כל שיבוץ חי => released. כולן, יחד, בלי בחירה.
  -- 🔴 **התוספת של מ8 (R4-F2) — השורה הבאה בלבד:** משמרים את הסטטוס שקדם לשחרור,
  --    כי בלעדיו נמחק המידע מי הייתה **מאושרת-סופית** — והוא הבסיס היחיד לחישוב
  --    פיצוי-§7.16. הצד הימני נקרא מהשורה שלפני העדכון, ולכן אין תלות-סדר.
  update public.assignments a
     set assignment_status    = 'released',
         released_from_status = a.assignment_status
   where a.project_id = p_project_id
     and a.assignment_status in ('finally_approved', 'pending', 'confirmed_available');
  get diagnostics v_released = row_count;

  -- public.logistics אינה מוזכרת כאן במכוון (㉕).

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
$function$;


-- -----------------------------------------------------------------------------
-- ② הזרעים
-- -----------------------------------------------------------------------------
-- ‏`on conflict do nothing` ולא `do update`: אם ישי כבר קבע ערך אחר בינתיים —
-- אנחנו לא דורסים אותו. זרע הוא ברירת-מחדל, לא הכרעה.
insert into params (param_name, param_value, param_type)
values ('תנאי_תשלום_ימים', '30', 'pricing_timing')
on conflict (param_name) do nothing;

-- כאן דווקא כן מעדכנים — הערך 0 אינו "בחירה של ישי" אלא חוסר-זריעה מקורי
-- שמרוקן את עמודת-הנסיעות. מעדכנים **רק** אם הוא עדיין 0.
update params
   set param_value = '22.60'
 where param_name = 'סכום_נסיעות_למשמרת'
   and param_value in ('0', '0.00');
