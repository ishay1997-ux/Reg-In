-- =====================================================================================
-- מודול 4 (דיילות) — מיגרציה D: ‏RLS על ארבע הטבלאות · טריגר שכר-מינימום · הפונקציה הציבורית
-- =====================================================================================
-- why (§7.21 — מודל בעלות-הדאטה, הכרעת-ישי 06/07/2026): הגישה נקבעת **אך ורק** לפי מטריצת
--   ההרשאות (תפקיד→מודול→`edit`/`view`), בלי בעלות ברמת-רשומה. ארבע הטבלאות של מ4 נעולות
--   על מודול **'דיילות'**, ו-`projects` מקבלת **SELECT בלבד** על מודול **'פרויקטים'**.
--   🔴 **בלי ה-policy על `projects` המסך הראשון של המודול חוזר ריק לכולם — כולל למנכ"ל —
--   ובלי שגיאה** (`spec.md §12②`). זו בדיוק מלכודת `{data:null, error:null}` ש-`§ מה ייחשב עובד`
--   #4 קורא לה "הכישלון החמור ביותר במודול".
--   🔴 **ו-`hostess_unavailability` היא המסוכנת מכולן** (`spec.md §12⑮`): אילו נשארה deny-all,
--   **התנאי החמישי בשער היה מת בשקט** — השאילתה מחזירה ריק, אף דיילת אינה נפסלת על אי-זמינות,
--   ואיש אינו רואה שגיאה. **לכן היא מקבלת policy כמו אחיותיה, ולא "כי גם היא טבלה".**
--
-- why (§7.66, הכרעת-ישי 31/07/2026): שכר-מינימום נאכף **בזמן-כתיבה** — בהוספה ובעדכון —
--   ו-🔴 **שורות קיימות אינן מועלות אוטומטית לעולם** (במילותיו: *"זה יהיה שינוי-שכר של אדם
--   בשקט"*). הדוח "מי מתחת לרף" הוא של מ9. ⚠️ **ולכן טריגר ולא CHECK:** ‏CHECK היה מאמת גם את
--   השורות הקיימות ברגע העלאת-הפרמטר, כלומר בדיוק מה שנאסר.
--   **הקריאה מוגנת בדפוס של `20260731085335`** — קוראים כ-TEXT, מוודאים (חסר/ריק/לא-מספרי/
--   מחוץ-לתחום), ורק אז ממירים. 🚫 לא `param_value::numeric` ישירות: ‏`''::numeric` זורק שגיאת
--   המרה **באנגלית** במקום ההודעה שלנו.
--
-- why (§7.45 + `screens-approved.md` משטח 5 §③) — `respond_to_shift_invite`:
--   🔴 **זהו המשטח היחיד במערכת שכותב ל-DB בלי התחברות ובלי תפקיד.** ולכן:
--   ‏`assignments` נשארת **deny-all מוחלט ל-`anon`** — אין ולו policy אחת שנוגעת בו — והפונקציה
--   הזו היא **נקודת-הכניסה היחידה**. היא מקבלת **רק** טוקן ובחירה, כותבת **רק**
--   `assignment_status` + `responded_at`, על **שורה אחת**, ורק כששלושת התנאים מתקיימים:
--   טוקן תקף · בתוך המועד · הסטטוס עדיין `pending`.
--   🔴 **ומחזירה מחרוזת גנרית **זהה** לשלושת מצבי-הכישלון** — טוקן שגוי, פג, וכבר-הוגב.
--   הבחנה ביניהם הייתה הופכת את הדף לאורקל שמאשר לאדם זר שטוקן מסוים קיים.
--   **הסיבה האמיתית הולכת ל-`raise log`** — כלומר ליומן-השרת בלבד.
--   ⏱️ **המועד = המוקדם מבין שלושה** (`spec.md §2.2`): המשרה אוישה · **48 שעות** מהשליחה ·
--   **24 שעות** לפני האירוע. השלישי מחושב מול **שעת-ההתחלה בפועל** ובאזור-הזמן של ישראל,
--   לא מול חצות. הראשון מכוסה ע"י תנאי-ה-`pending`: שחרור מעביר את השורה ל-`released`.
--   🔴 **‏`responded_at` נכתבת פעם אחת בלבד** (`spec.md §12⑨`) — `coalesce(responded_at, now())`.
--   "שלח שוב" מאפס את `invite_sent_at` **בלי לגעת בה**, אחרת נוצר זמן-תגובה שלילי.
--
-- ⚠️ **צפי-advisors, מוצהר מראש ולא מתגלה בדיעבד:** המיגרציה הזו **מסירה חמישה ממצאי
--   `rls_enabled_no_policy`** (‏`hostesses` · `assignments` · `projects` ·
--   `hostess_unavailability` · `customer_hostess_preference`) **ומוסיפה ממצא אחד
--   חדש:** ‏`anon_security_definer_function_executable` על `respond_to_shift_invite`.
--   ⇒ **הצפי המספרי: ‏17 ⇐ 13.**
--   **החדש הוא בדיוק מה שהוזמן** — פונקציה שאנונימי חייב להריץ. נרשם כהערת-טריאז' ב-DoD.
--
-- reversibility: הפיכה במלואה — `drop policy` ×9 · `drop trigger`+`drop function` (שכר-מינימום) ·
--   `drop function respond_to_shift_invite`. שום שורה אינה נכתבת, נמחקת או משתנה.

-- ===== SECTION 1 — policies על ארבע הטבלאות של מ4 (מודול 'דיילות') =====
-- תבנית §7.21 מילה-במילה, כולל עטיפת `(select …)` ל-initplan.
create policy "hostesses_select_by_permission" on public.hostesses for select to authenticated
  using (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'דיילות')
      and p.permission_level in ('edit', 'view')));
create policy "hostesses_write_by_permission" on public.hostesses for all to authenticated
  using (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'דיילות')
      and p.permission_level = 'edit'))
  with check (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'דיילות')
      and p.permission_level = 'edit'));

create policy "assignments_select_by_permission" on public.assignments for select to authenticated
  using (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'דיילות')
      and p.permission_level in ('edit', 'view')));
create policy "assignments_write_by_permission" on public.assignments for all to authenticated
  using (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'דיילות')
      and p.permission_level = 'edit'))
  with check (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'דיילות')
      and p.permission_level = 'edit'));

create policy "hostess_unavailability_select_by_permission" on public.hostess_unavailability for select to authenticated
  using (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'דיילות')
      and p.permission_level in ('edit', 'view')));
create policy "hostess_unavailability_write_by_permission" on public.hostess_unavailability for all to authenticated
  using (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'דיילות')
      and p.permission_level = 'edit'))
  with check (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'דיילות')
      and p.permission_level = 'edit'));

-- ⚠️ מ4 **קורא** את הטבלה הזאת (שכבות 1–2 של Smart Match); **מ6 יכתוב** אליה.
-- ה-policy לכתיבה נוצרת כאן בכל זאת, כי היא נגזרת מאותה מטריצה ואינה תלויה במ6.
create policy "customer_hostess_preference_select_by_permission" on public.customer_hostess_preference for select to authenticated
  using (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'דיילות')
      and p.permission_level in ('edit', 'view')));
create policy "customer_hostess_preference_write_by_permission" on public.customer_hostess_preference for all to authenticated
  using (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'דיילות')
      and p.permission_level = 'edit'))
  with check (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'דיילות')
      and p.permission_level = 'edit'));

-- ===== SECTION 2 — `projects`: SELECT בלבד, ומודול אחר =====
-- 🚫 **מ4 אינו כותב ל-`projects` לעולם** (§12⑱(ד)) — אין כאן policy לכתיבה, במכוון.
-- ה-backfill של `customer_name` במיגרציה A רץ כבעלים ולא דרך policy.
create policy "projects_select_by_permission" on public.projects for select to authenticated
  using (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'פרויקטים')
      and p.permission_level in ('edit', 'view')));

-- ===== SECTION 3 — טריגר שכר-מינימום (§7.66) =====
create or replace function public.enforce_hostess_min_wage()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_text text; v_min numeric;
begin
  select param_value into v_text from public.params where param_name = 'שכר_מינימום_שעתי';
  -- קריאה מוגנת: חסר / ריק / לא-מספרי — כולם נעצרים לפני ההמרה, בהודעה בעברית.
  if v_text is null or btrim(v_text) = '' or btrim(v_text) !~ '^[0-9]+(\.[0-9]+)?$' then
    raise exception 'שכר המינימום השעתי אינו מוגדר בהגדרות המערכת (פרמטר שכר_מינימום_שעתי) — לא ניתן לשמור דיילת'
      using errcode = 'P0001';
  end if;
  v_min := btrim(v_text)::numeric;
  if new.hourly_rate < v_min then
    raise exception 'התעריף השעתי שהוזן (%) נמוך משכר המינימום שבהגדרות המערכת (%) — לא ניתן לשמור',
      new.hourly_rate, v_min using errcode = 'P0001';
  end if;
  return new;
end; $$;
revoke execute on function public.enforce_hostess_min_wage() from public, anon, authenticated;

-- 🔴 `of hourly_rate` — הטריגר נדלק **רק** כשהעמודה הזאת בפועל ב-SET של ה-UPDATE.
-- ⇒ עדכון שם/טלפון של דיילת ותיקה שתעריפה מתחת לרף החדש **אינו נחסם**, ותעריפה **אינו משתנה**.
-- זו בדיוק ההכרעה: אכיפה בזמן-כתיבה, בלי העלאה רטרואקטיבית שקטה.
create trigger hostesses_enforce_min_wage
  before insert or update of hourly_rate on public.hostesses
  for each row execute function public.enforce_hostess_min_wage();

-- ===== SECTION 4 — הפונקציה הציבורית (§7.45) =====
create or replace function public.respond_to_shift_invite(p_token text, p_response text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  -- 🔴 מחרוזת אחת קבועה לכל שלושת מצבי-הכישלון. הבחנה ביניהם הייתה הופכת את הדף
  -- לאורקל שמאשר לאדם זר שטוקן מסוים קיים במערכת.
  c_generic constant text :=
    'הקישור אינו תקף עוד. ייתכן שהמשרה כבר אוישה, שחלף המועד, או שכבר נרשמה תשובה. לפרטים ניתן לפנות למשרד.';
  v_new_status text;
  v_project_id int;
  v_hostess_id bigint;
  v_number int;
begin
  if p_response = 'confirmed' then
    v_new_status := 'confirmed_available';
  elsif p_response = 'declined' then
    v_new_status := 'declined';
  else
    raise log 'respond_to_shift_invite: unknown response value %', p_response;
    return jsonb_build_object('ok', false, 'message', c_generic);
  end if;

  -- שלושת התנאים בשאילתה אחת. `for update` נועל את השורה מפני מרוץ (שני טאבים).
  select a.project_id, a.hostess_id, a.assignment_number
    into v_project_id, v_hostess_id, v_number
    from public.assignments a
    join public.projects p on p.project_id = a.project_id
   where a.invite_token = p_token
     and a.assignment_status = 'pending'
     and a.invite_sent_at is not null
     and a.invite_sent_at + interval '48 hours' > now()
     -- 24 שעות לפני האירוע — מול שעת-ההתחלה בפועל ובאזור-הזמן של ישראל, לא מול חצות.
     and (((p.final_event_date + coalesce(p.final_start_time, time '00:00'))
            at time zone 'Asia/Jerusalem') - interval '24 hours') > now()
   for update of a;

  if not found then
    raise log 'respond_to_shift_invite: no eligible row for token (masked), response=%', p_response;
    return jsonb_build_object('ok', false, 'message', c_generic);
  end if;

  -- כותבת **רק** שני שדות, על **שורה אחת**.
  -- `coalesce` — `responded_at` נכתבת פעם אחת בלבד, במענה הראשון (§12⑨).
  update public.assignments
     set assignment_status = v_new_status,
         responded_at = coalesce(responded_at, now())
   where project_id = v_project_id
     and hostess_id = v_hostess_id
     and assignment_number = v_number;

  return jsonb_build_object('ok', true, 'status', v_new_status);
end; $$;

-- 🔴 זו הפונקציה היחידה במערכת שאנונימי רשאי להריץ מרצון-תחילה.
-- ‏`assignments` עצמה נשארת deny-all ל-anon — אין ולו policy אחת `to anon`.
revoke execute on function public.respond_to_shift_invite(text, text) from public;
grant  execute on function public.respond_to_shift_invite(text, text) to anon, authenticated;
