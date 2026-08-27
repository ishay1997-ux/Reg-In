-- =============================================================================
-- מודול 8 · מיגרציה F · צעד 1.6 — דף-המשוב הציבורי + הגבלת-קצב
-- =============================================================================
-- הלקוח פותח `/feedback/:token` **בלי התחברות**, רואה את שם-האירוע, נותן ציון
-- 1–5 וטקסט חופשי, ושולח **פעם אחת** (כרטיס-P2).
--
-- 🔴 **המשטח היחיד במודול שאנונימי נוגע בו** ⇒ שלושה כללים שאין לרכך:
--   ① **אין policy ל-anon על אף טבלה.** שתי הפונקציות הן הדלת היחידה.
--   ② **תשובת "לא נמצא" זהה בייט-בבייט** לטוקן שגוי, ריק, ומת. כל הבדל ביניהן
--      הוא ערוץ-מידע: מי שמנחש טוקנים ילמד מהתשובה אם ניחש נכון.
--   ③ **הגבלת-קצב** — 15 קריאות לשעה ל-IP.
--
-- 🔴 **מוקש T14 — התקדים שכולם מצביעים עליו אינו קיים.** ‏`/shift/:token` של מ4
-- **אין בו מגביל-קצב כלל** (רשום כפער ידוע ב-§6). ⇒ אין מה להעתיק משם.
-- **התקדים החי היחיד הוא מונה-הכניסה של מודול 1** (`login_rpc_calls`, 15/IP/שעה),
-- ומשם הועתקה הצורה: חילוץ IP מ-`x-forwarded-for` · גיזום שורות ישנות משעה ·
-- ספירה · חסימה · רישום.
--
-- 🔑 **ולמה טבלה נפרדת ולא שימוש-חוזר ב-`login_rpc_calls`** *(המדריך השאיר זאת לבנאי)*:
-- שיתוף המונה היה מערבב שני עולמות — לקוח שמרענן את דף-המשוב היה **אוכל מהמכסה
-- של ניסיונות-ההתחברות** מאותו IP, וההפך. במשרד מאחורי NAT משותף זה נראה כמו
-- "המערכת נעלה אותי" בלי שום קשר. **טבלה נפרדת באותה צורה בדיוק** — קלה לזיהוי
-- למי שמכיר את הקיימת, ובלי הצימוד.
--
-- ⚠️ **חוזי-קצה מהרהרסל:** ‏`mint` מסרב **רק** ל-`finished` (הטוקן מת בארכוב ואינו
-- נטבע מחדש — G-16) · `submit` מקבל גם פרויקט ב-`not_sent` (המייל נכשל אחרי
-- שהטוקן נטבע — הלקוח שמחזיק קישור עובד עדיין נספר, G-17).
-- ⚠️ **T12:** מעבר ל-`completed` חייב לעבוד גם מ-`no_response` — לקוח שענה אחרי
-- שסומן "לא ענה" **דורס**, כי דאטה עדיף על דגל.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. מונה-הקצב — deny-all במכוון, כמו האח שלו מהכניסה
-- -----------------------------------------------------------------------------
create table feedback_rpc_calls (
  ip        inet        not null,
  called_at timestamptz not null default now()
);

comment on table feedback_rpc_calls is
  'מ8 — מונה הגבלת-קצב לדף-המשוב הציבורי (15/IP/שעה). דפוס `login_rpc_calls`. deny-all: הגישה רק דרך פונקציות DEFINER.';

create index feedback_rpc_calls_ip_called_at_idx on feedback_rpc_calls (ip, called_at);

-- 🚫 RLS דלוק ו**אפס policies** — בכוונה, כמו `login_rpc_calls`. אנונימי לעולם
-- לא נוגע בטבלה; רק הפונקציות שמתחת.
alter table feedback_rpc_calls enable row level security;


-- -----------------------------------------------------------------------------
-- 2. הגבלת-הקצב — פנימית, משותפת לשתי הפונקציות הציבוריות
-- -----------------------------------------------------------------------------
create or replace function feedback_rate_limit()
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare v_ip inet; v_recent int;
begin
  -- ה-IP מגיע מכותרת של הפרוקסי. אם אינה קיימת או אינה תקינה — **לא חוסמים**:
  -- זהו fail-open מכוון, בדיוק כמו במונה-הכניסה. מגביל-קצב שבור שחוסם משתמשים
  -- אמיתיים גרוע ממגביל שלא פעל.
  begin
    v_ip := nullif(btrim(split_part(
              coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''),
              ',', 1)), '')::inet;
  exception when others then v_ip := null;
  end;

  if v_ip is null then return; end if;

  delete from public.feedback_rpc_calls where called_at < now() - interval '1 hour';

  select count(*) into v_recent
    from public.feedback_rpc_calls
   where ip = v_ip and called_at > now() - interval '1 hour';

  if v_recent >= 15 then
    raise exception 'לא ניתן להשלים את הפעולה כרגע. נסי שוב מאוחר יותר.'
      using errcode = 'P0001';
  end if;

  insert into public.feedback_rpc_calls (ip) values (v_ip);
end;
$$;

revoke execute on function feedback_rate_limit() from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- 3. טביעת-הטוקן — עצלה, ברגע שליחת-המייל של מ6
-- -----------------------------------------------------------------------------
-- 🔴 מגודרת **'פרויקטים'** ולא 'כספים': הקורא הוא מסלול-המייל של מ6, ומנהלת
-- הפרויקטים היא ששולחת את הסקר. גידור ב'כספים' היה מפיל לה כל שליחה ב-403 שקט.
-- 🔑 **get-or-create**: שליחה חוזרת של אותו מייל לא תייצר טוקן שני ולא תפסול
-- קישור שכבר בידי הלקוח. ‏`close_project_operationally` **לא נגעה** (R4-F11).
create or replace function mint_feedback_token(p_project_id integer)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare v_token text; v_status text;
begin
  perform public.assert_module_permission('פרויקטים', array['edit']);

  select p.feedback_token, p.project_status into v_token, v_status
    from public.projects p where p.project_id = p_project_id;

  if v_status is null then
    raise exception 'פרויקט % לא נמצא.', p_project_id using errcode = 'P0001';
  end if;

  -- G-16: הטוקן מת בארכוב ואינו נטבע מחדש. זה המצב היחיד שנחסם.
  if v_status = 'finished' then
    raise exception 'הפרויקט כבר בארכיון — לא ניתן להנפיק קישור משוב חדש.'
      using errcode = 'P0001';
  end if;

  if v_token is not null then return v_token; end if;

  v_token := replace(gen_random_uuid()::text, '-', '');
  update public.projects set feedback_token = v_token where project_id = p_project_id;
  return v_token;
end;
$$;

revoke execute on function mint_feedback_token(integer) from public, anon, authenticated;
grant execute on function mint_feedback_token(integer) to authenticated;


-- -----------------------------------------------------------------------------
-- 4. קריאת הדף — אנונימית
-- -----------------------------------------------------------------------------
-- שלושת המצבים מוחזרים כ-`state`: `ok` · `already` · `not_found`.
-- 🔴 **`not_found` מוחזר עבור טוקן ריק, שגוי, ומת — אותו אובייקט בדיוק.**
create or replace function get_feedback_page(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_id integer; v_name text; v_date date; v_status text;
begin
  perform public.feedback_rate_limit();

  if p_token is null or btrim(p_token) = '' then
    return jsonb_build_object('state', 'not_found');
  end if;

  select p.project_id, p.event_name, p.final_event_date, p.feedback_status
    into v_id, v_name, v_date, v_status
    from public.projects p where p.feedback_token = p_token;

  if v_id is null then
    return jsonb_build_object('state', 'not_found');
  end if;

  if v_status = 'completed' then
    return jsonb_build_object('state', 'already');
  end if;

  return jsonb_build_object(
    'state', 'ok',
    'event_name', v_name,
    'event_date', v_date
  );
end;
$$;

comment on function get_feedback_page(text) is
  'מ8 P2 — קריאת דף-המשוב הציבורי. שלושה מצבים; not_found זהה לטוקן שגוי/ריק/מת (אין ערוץ-מידע).';

revoke execute on function get_feedback_page(text) from public, anon, authenticated;
grant execute on function get_feedback_page(text) to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 5. ההגשה — אנונימית, פעם אחת
-- -----------------------------------------------------------------------------
create or replace function submit_feedback(p_token text, p_score integer, p_notes text default null)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare v_id integer; v_status text;
begin
  perform public.feedback_rate_limit();

  if p_token is null or btrim(p_token) = '' then
    return jsonb_build_object('state', 'not_found');
  end if;

  select p.project_id, p.feedback_status into v_id, v_status
    from public.projects p where p.feedback_token = p_token;

  if v_id is null then
    return jsonb_build_object('state', 'not_found');
  end if;

  -- הגשה יחידה. ⚠️ **`no_response` אינו חוסם** (T12): לקוח שענה אחרי שסומן
  -- "לא ענה" דורס את הדגל — דאטה עדיף על דגל.
  if v_status = 'completed' then
    return jsonb_build_object('state', 'already');
  end if;

  if p_score is null or p_score < 1 or p_score > 5 then
    return jsonb_build_object('state', 'invalid');
  end if;

  -- G-17: פרויקט ב-`not_sent` מתקבל. המייל אולי נכשל אחרי שהטוקן נטבע, והלקוח
  -- שמחזיק קישור עובד עדיין נספר.
  update public.projects
     set feedback_score = p_score,
         feedback_notes = nullif(btrim(coalesce(p_notes, '')), ''),
         feedback_status = 'completed'
   where project_id = v_id;

  return jsonb_build_object('state', 'ok');
end;
$$;

comment on function submit_feedback(text, integer, text) is
  'מ8 P2 — הגשת המשוב מהדף הציבורי. הגשה יחידה; דורס no_response (T12); מקבל not_sent (G-17).';

revoke execute on function submit_feedback(text, integer, text) from public, anon, authenticated;
grant execute on function submit_feedback(text, integer, text) to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 6. 🔴 תיקון שער-הארכוב — פער שנמצא בכתיבת F ולא ב-E2
-- -----------------------------------------------------------------------------
-- **מה היה חסר:** ‏`archive_project` בדקה שהמשוב "נפתר" (`completed`/`no_response`)
-- — אבל **לא** שציון נמוך קיבל סיבה.
-- **למה זה נהיה אמיתי דווקא עכשיו:** לדף הציבורי **אין שדה-סיבה בכלל** (הלקוח
-- נותן ציון וטקסט חופשי, והסיבה נבחרת ע"י המנהלת אחרי שיחת-טלפון). ⇒ מרגע ש-F
-- קיימת, לקוח יכול להגיש **2 בלי סיבה**, והארכוב היה עובר — כלומר **התיק היה
-- נסגר בלי שהשיחה הטלפונית קרתה מעולם.**
-- **מה האפיון אומר, מילה במילה:** *"ציון <3 מדליק 'נדרש בירור טלפוני' ושער-הארכוב
-- ממשיך לחסום עד הזנת-סיבה"* · *"עד אז אין ארכוב"* (כרטיס-P2).
-- 🚫 המיגרציה של E2 לא נערכה — היא היסטוריה; זה תיקון קדימה.
create or replace function archive_project(p_project_id integer)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_status text; v_payment date; v_written_off boolean;
  v_feedback text; v_report_url text; v_profit numeric;
  v_score integer; v_reason text;
begin
  v_status := public.finance_assert_writable(p_project_id);

  if v_status = 'cancelled' then
    raise exception 'פרויקט שבוטל אינו עובר לארכיון — הרווח שלו נקפא עם פתרון דמי הביטול.'
      using errcode = 'P0001';
  end if;

  select p.payment_date, p.feedback_status, p.summary_report_url,
         p.feedback_score, p.negative_feedback_reason
    into v_payment, v_feedback, v_report_url, v_score, v_reason
    from public.projects p where p.project_id = p_project_id;

  select coalesce(pf.written_off, false) into v_written_off
    from public.project_finance pf where pf.project_id = p_project_id;

  if v_payment is null and not coalesce(v_written_off, false) then
    raise exception 'חסום: שער-הארכוב דורש גם תשלום וגם משוב-פתור — טרם נרשם תאריך תשלום, והפרויקט לא נסגר כחוב אבוד.'
      using errcode = 'P0001';
  end if;
  if v_feedback not in ('completed', 'no_response') then
    raise exception 'חסום: שער-הארכוב דורש גם תשלום וגם משוב-פתור — המשוב עדיין במצב "%".', v_feedback
      using errcode = 'P0001';
  end if;

  -- ⬇️ השער שנוסף כאן.
  if v_score is not null and v_score < 3 and (v_reason is null or btrim(v_reason) = '') then
    raise exception 'חסום: הלקוח נתן ציון % — נדרש בירור טלפוני ובחירת סיבה לפני העברה לארכיון.', v_score
      using errcode = 'P0001';
  end if;

  if v_report_url is null then
    raise exception 'לא ניתן לארכב — לפרויקט חסר דוח סיכום מהסגירה התפעולית.'
      using errcode = 'P0001';
  end if;

  select m.gross_profit into v_profit
    from public.finance_project_money(p_project_id) m;

  insert into public.project_finance (project_id, final_profit, archived_at)
  values (p_project_id, v_profit, now())
  on conflict (project_id) do update
    set final_profit = excluded.final_profit, archived_at = excluded.archived_at;

  update public.projects
     set project_status = 'finished',
         feedback_token = null
   where project_id = p_project_id;

  return jsonb_build_object('ok', true, 'final_profit', v_profit);
end;
$$;

comment on function archive_project(integer) is
  'מ8 P3 — הארכוב: שער כפול + שער ציון-נמוך-דורש-סיבה, הקפאת רווח, נעילה והמתת טוקן. טרנזקציה אחת.';

revoke execute on function archive_project(integer) from public, anon, authenticated;
grant execute on function archive_project(integer) to authenticated;
