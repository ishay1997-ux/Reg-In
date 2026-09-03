-- =============================================================================
-- מודול 9 · מיגרציה D · צעד 3.6 — רשימת "מי מתחת לשכר-המינימום" מקבלת רף לתצוגה-מקדימה
-- =============================================================================
-- **למה:** המוקאפ שישי אישר (02/09 22:02, סעיף 4ב) מצייר את הרשימה מגיבה לערך שמוקלד
-- בשדה **לפני** השמירה — "40 ₪: מירב אטיאס · ליאת פרץ". הפונקציה ממיגרציה C קוראת רק את
-- הערך **השמור** ב-`params`, ולכן הבנייה (צעד 3.1) הציגה את הרשימה לפי הרף השמור בלבד.
-- מנהלת-הכספים חסומה על 'דיילות' ⇒ הלקוח לא יכול לחשב את התצוגה-המקדימה בעצמו; הדרך
-- היחידה היא שהפונקציה-בזכויות-מגדיר תקבל את הרף כארגומנט.
--
-- **מה משתנה:** `list_hostesses_below_min_wage()` ⇒ `list_hostesses_below_min_wage(p_threshold
-- numeric default null)`. ‏NULL (או קריאה בלי ארגומנט) = הרף השמור ב-`params`, כמו קודם.
-- ערך = תצוגה-מקדימה מול הערך המוקלד. **השער לא משתנה** — קודם בעלות על הפרמטר, אחרת
-- `edit` ב-'הגדרות מערכת' (`42501`). דיילות פעילות בלבד (V-10). ‏`hostess_id bigint` (T13).
--
-- **למה drop ולא overload:** שתי גרסאות — `()` ו-`(numeric default null)` — הופכות את הקריאה
-- `list_hostesses_below_min_wage()` לדו-משמעית (Postgres מסרב). ⇒ הישנה יורדת.
-- **כלל-הפריסה:** ה-drop בטוח כי **אף קוד פרוס לא קורא לפונקציה** — היא נוצרה הערב במיגרציה C
-- ורק ענף-מ9 (שטרם נפרס) קורא לה. `git show origin/main` אינו מכיל את שמה (נוצרה אחרי `73c61d5`).
-- **הפיכוּת:** מלאה — `drop` + `create` בחתימה הקודמת (הגוף שמור במיגרציה C).
-- =============================================================================

drop function public.list_hostesses_below_min_wage();

create function public.list_hostesses_below_min_wage(p_threshold numeric default null)
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

  if p_threshold is not null then
    if p_threshold < 0 then
      raise exception 'רף לתצוגה-מקדימה חייב להיות מספר אי-שלילי' using errcode = 'P0001';
    end if;
    v_min := p_threshold;
  else
    select p.param_value into v_text from public.params p where p.param_name = 'שכר_מינימום_שעתי';
    if v_text is null or btrim(v_text) = '' or btrim(v_text) !~ '^[0-9]+(\.[0-9]+)?$' then
      raise exception 'שכר המינימום השעתי אינו מוגדר בהגדרות המערכת (פרמטר שכר_מינימום_שעתי)'
        using errcode = 'P0001';
    end if;
    v_min := btrim(v_text)::numeric;
  end if;

  return query
    select h.hostess_id, h.full_name, h.hourly_rate
      from public.hostesses h
     where h.status = 'active'
       and h.hourly_rate < v_min
     order by h.hourly_rate asc, h.full_name asc;
end;
$function$;

revoke execute on function public.list_hostesses_below_min_wage(numeric) from public, anon, authenticated;
grant execute on function public.list_hostesses_below_min_wage(numeric) to authenticated;
