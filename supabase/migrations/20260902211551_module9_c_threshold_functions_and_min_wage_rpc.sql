-- =============================================================================
-- מודול 9 · מיגרציה C · צעד 1.3 — סף שביעות-הרצון חי ב-`params` · רשימת "מי מתחת לשכר-המינימום"
-- =============================================================================
-- **שני דברים, שניהם קוראים שורות שמיגרציה A זרעה (T1 — A חייבת להיות מוחלת קודם):**
--
-- ① `record_feedback` ו-`archive_project` (מודול 8) — הסף "ציון נמוך מ-3 מחייב סיבה" היה
--    מספר קשיח בגוף הפונקציה. עכשיו הוא נקרא מ-`params.סף_שביעות_רצון` (G-2, ישי 02/09).
--    **הגופים נמשכו חיים** (`pg_get_functiondef`, 02/09/2026 21:13) — לא ממיגרציה ישנה
--    (הלקח של 12/08, `pr.cost`). **ה-diff המדויק מול הגוף החי:**
--      · `record_feedback`: `p_score < 3` ⇒ `p_score < v_threshold` **בשני המקומות** (השער
--        וה-`case`, T6) · ההודעה "ציון נמוך מ-3 מחייב…" ⇒ "ציון נמוך מ-% מחייב…" עם הסף ·
--        הקריאה ל-`params` יושבת **אחרי** מסלול `p_mark_no_response` ואחרי בדיקת 1–5 —
--        סימון "לא ענה לסקר" עובד גם אם השורה חסרה (חוזה "המסלולים שלא מתייעצים").
--      · `archive_project`: `v_score < 3` ⇒ `v_score < v_threshold`; הקריאה ל-`params`
--        **בתוך** `if v_score is not null` — ארכוב פרויקט בלי ציון לא נוגע בסף. ההודעה
--        לא נשאה את המספר — לא שונתה. שאר הגוף, השערים וקודי-השגיאה — זהים בייט-בבייט.
--      · שורה חסרה/פגומה ⇒ `P0001` בעברית **הנוקבת בשם הפרמטר** (התקדים
--        `enforce_hostess_min_wage`). לעולם לא ברירת-מחדל שקטה.
--
-- ② `list_hostesses_below_min_wage()` — הטריגר של מודול 4 חוסם **שמירה** מתחת לשכר-המינימום,
--    אבל כשמעלים את הרף אין דרך לראות מי כבר מתחתיו (§7.66 · `🚧 מ9 ← מ4`). מנהלת-הכספים —
--    הבעלים של `שכר_מינימום_שעתי` — **חסומה** על 'דיילות', ולכן קריאה מהלקוח מחזירה `[]`
--    בשקט ⇒ RPC בזכויות-מגדיר. **השער: קודם בעלות** (הבעלים של הפרמטר), ואם לא — `edit`
--    ב-'הגדרות מערכת' (המנכ"ל) דרך `assert_module_permission` (מעלה `42501`; התקדים של מ6).
--    **דיילות פעילות בלבד** (V-10 — דיילת לא-פעילה לא מקבלת שכר, ורישומה היה מציג רף
--    "מופר" כשאינו). `hostess_id` הוא **bigint** (T13). כל עמודה מתויגת `h.` — שמות-הפלט
--    מתנגשים עם שמות-העמודות (T10).
--
-- **הענקות (T7):** לשלוש הפונקציות `revoke … from public, anon, authenticated` ואז
-- `grant … to authenticated` — גם לשתי הקיימות, שחתימתן לא השתנתה, כדי שהמצב יהיה כתוב
-- ולא מוסק. **הפיכוּת:** ① — `create or replace` חוזר עם הגוף הקודם (שמור במיגרציות
-- `20260827150049` / `20260827155303`) · ② — `drop function`. **כלל-הפריסה:** חתימות לא
-- השתנו; פונקציה חדשה — תוספת. הקוד הפרוס ממשיך לעבוד (הסף הזרוע = 3 = מה שהיה בקוד).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- ① `record_feedback` — הגוף החי + הסף מ-`params`
-- -----------------------------------------------------------------------------
create or replace function public.record_feedback(
  p_project_id integer,
  p_score integer default null,
  p_reason text default null,
  p_notes text default null,
  p_mark_no_response boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_text text; v_threshold integer;
begin
  perform public.finance_assert_writable(p_project_id);

  if p_mark_no_response then
    update public.projects
       set feedback_status = 'no_response'
     where project_id = p_project_id;
    return jsonb_build_object('ok', true, 'feedback_status', 'no_response');
  end if;

  if p_score is null or p_score < 1 or p_score > 5 then
    raise exception 'יש לבחור ציון בין 1 ל-5.' using errcode = 'P0001';
  end if;

  -- מודול 9: הסף חי ב-params. נקרא רק כאן — אחרי מסלול "לא ענה" ואחרי בדיקת 1–5.
  select param_value into v_text from public.params where param_name = 'סף_שביעות_רצון';
  if v_text is null or btrim(v_text) !~ '^[0-9]+$' then
    raise exception 'סף שביעות-הרצון אינו מוגדר בהגדרות המערכת (פרמטר סף_שביעות_רצון) — לא ניתן לרשום משוב'
      using errcode = 'P0001';
  end if;
  v_threshold := btrim(v_text)::integer;

  if p_score < v_threshold and (p_reason is null or btrim(p_reason) = '') then
    raise exception 'ציון נמוך מ-% מחייב בחירת סיבה מהרשימה לאחר בירור טלפוני.', v_threshold
      using errcode = 'P0001';
  end if;

  update public.projects
     set feedback_score = p_score,
         negative_feedback_reason = case when p_score < v_threshold then p_reason else null end,
         feedback_notes = coalesce(p_notes, feedback_notes),
         feedback_status = 'completed'
   where project_id = p_project_id;

  return jsonb_build_object('ok', true, 'feedback_status', 'completed');
end;
$function$;

revoke execute on function public.record_feedback(integer, integer, text, text, boolean) from public, anon, authenticated;
grant execute on function public.record_feedback(integer, integer, text, text, boolean) to authenticated;


-- -----------------------------------------------------------------------------
-- ① `archive_project` — הגוף החי + הסף מ-`params` (רק כשיש ציון)
-- -----------------------------------------------------------------------------
create or replace function public.archive_project(p_project_id integer)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_status text; v_payment date; v_written_off boolean;
  v_feedback text; v_report_url text; v_profit numeric;
  v_score integer; v_reason text;
  v_text text; v_threshold integer;
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

  -- מודול 9: הסף חי ב-params. נקרא רק כשיש ציון — פרויקט בלי ציון לא נוגע בו.
  if v_score is not null then
    select param_value into v_text from public.params where param_name = 'סף_שביעות_רצון';
    if v_text is null or btrim(v_text) !~ '^[0-9]+$' then
      raise exception 'סף שביעות-הרצון אינו מוגדר בהגדרות המערכת (פרמטר סף_שביעות_רצון) — לא ניתן לארכב'
        using errcode = 'P0001';
    end if;
    v_threshold := btrim(v_text)::integer;

    if v_score < v_threshold and (v_reason is null or btrim(v_reason) = '') then
      raise exception 'חסום: הלקוח נתן ציון % — נדרש בירור טלפוני ובחירת סיבה לפני העברה לארכיון.', v_score
        using errcode = 'P0001';
    end if;
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
$function$;

revoke execute on function public.archive_project(integer) from public, anon, authenticated;
grant execute on function public.archive_project(integer) to authenticated;


-- -----------------------------------------------------------------------------
-- ② `list_hostesses_below_min_wage()` — דיילות פעילות שתעריפן מתחת לרף הנוכחי
-- -----------------------------------------------------------------------------
create function public.list_hostesses_below_min_wage()
returns table (hostess_id bigint, full_name text, hourly_rate numeric)
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_text text; v_min numeric;
begin
  -- שער: קודם בעלות על הפרמטר; אחרת `edit` ב-'הגדרות מערכת' (מעלה 42501).
  if not exists (
    select 1 from public.params p
     where p.param_name = 'שכר_מינימום_שעתי'
       and p.owner_role_id = (select public.current_user_role_id())
  ) then
    perform public.assert_module_permission('הגדרות מערכת', array['edit']);
  end if;

  select p.param_value into v_text from public.params p where p.param_name = 'שכר_מינימום_שעתי';
  if v_text is null or btrim(v_text) = '' or btrim(v_text) !~ '^[0-9]+(\.[0-9]+)?$' then
    raise exception 'שכר המינימום השעתי אינו מוגדר בהגדרות המערכת (פרמטר שכר_מינימום_שעתי)'
      using errcode = 'P0001';
  end if;
  v_min := btrim(v_text)::numeric;

  return query
    select h.hostess_id, h.full_name, h.hourly_rate
      from public.hostesses h
     where h.status = 'active'
       and h.hourly_rate < v_min
     order by h.hourly_rate asc, h.full_name asc;
end;
$function$;

revoke execute on function public.list_hostesses_below_min_wage() from public, anon, authenticated;
grant execute on function public.list_hostesses_below_min_wage() to authenticated;
