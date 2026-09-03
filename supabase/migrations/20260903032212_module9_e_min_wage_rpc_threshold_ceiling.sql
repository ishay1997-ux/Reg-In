-- =============================================================================
-- מודול 9 · מיגרציה E · אודיט-הסגירה — תקרה לרף שמועבר ל-`list_hostesses_below_min_wage`
-- =============================================================================
-- 🔴 **ממצא F-3 של אודיט-הסגירה (03/09/2026), נמדד חי ולא הוסק:** מיגרציה D הוסיפה את
-- הארגומנט `p_threshold` כדי שהמסך יוכל להציג תצוגה-מקדימה לפני שמירה, ובדקה שהוא **אינו
-- שלילי** — אבל לא הגבילה אותו מלמעלה. התוצאה, בהתחזות למנהלת-הכספים בבלוק שגולגל אחורה:
--
--     select count(*) from list_hostesses_below_min_wage(999999);   ⇒ 26
--     select count(*) from hostesses;                               ⇒ 0
--
-- כלומר הפונקציה מחזירה **שם + תעריף של כל דיילת פעילה** למי שקריאתה הישירה לטבלה מסוננת
-- לאפס. ‏`p_threshold` גבוה מספיק הופך "מי מתחת לרף" ל"רשימת כל הדיילות".
--
-- ⚖️ **מה זה כן ומה זה לא.** מנהלת-הכספים כבר קוראת `hostess_bank_details` של כל 26 הדיילות
-- (משטח של מודול 8, רגיש יותר מ-שם+תעריף) — ולכן **אין כאן חציית גבול-סודיות חדש**, וזו הסיבה
-- שהממצא לא סווג כחוסם. מה שכן: פונקציה בזכויות-מגדיר חייבת להיות מוגבלת למה שנועדה לו, ולא
-- להיות ניתנת להטיה לשליפה-מלאה על-ידי ארגומנט שהלקוח שולט בו.
--
-- 🚫 **ותקרה בצד-הלקוח אינה מספיקה, וזו הסיבה שהמיגרציה הזו קיימת:** באותו אודיט נוספה
-- ‏`max: 200` על `שכר_מינימום_שעתי` ב-`src/lib/paramsRegistry.js`, וזה סוגר את המסלול דרך
-- המסך — אבל ה-RPC חשוף ב-PostgREST לכל משתמש מחובר, וקריאה ישירה עוקפת כל ולידציה בדפדפן.
-- **החומה היא כאן, ולא בטופס.**
--
-- **מה משתנה:** תוספת בדיקה אחת בגוף הפונקציה — `p_threshold` חייב להיות בין 0 ל-1000.
-- ‏1000 הוא ~19× התעריף הגבוה שנמדד (52 ₪/שעה, 26 דיילות פעילות, ממוצע 44.27), כלומר תצוגה
-- מקדימה לגיטימית לעולם לא תיחסם, ו-999999 נדחה בעברית. ‏NULL ממשיך להתנהג בדיוק כמו קודם:
-- קריאה בלי ארגומנט קוראת את הרף השמור ב-`params`.
-- **מה לא משתנה:** החתימה · השער (בעלות ואז `assert_module_permission`) · `status='active'` ·
-- הסדר · ההרשאות. הגוף להלן נמשך מהמסד (`pg_get_functiondef`) ולא נבנה מזיכרון.
--
-- **הפיכוּת:** מלאה — `create or replace` עם הגוף של מיגרציה D מחזיר את המצב הקודם.
-- **כלל-הפריסה:** אין DDL הרסני; הידוק-ולידציה בתוך גוף-פונקציה על ארגומנט שהקוד הפרוס
-- **אינו שולח כלל** *(‏`origin/main` אינו מכיר את הפונקציה — היא נוצרה 02/09 בערב)*.
-- =============================================================================

create or replace function public.list_hostesses_below_min_wage(p_threshold numeric default null)
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
    -- 🔴 F-3: גם רצפה וגם תקרה. בלי התקרה, רף גבוה מספיק הופך את הפונקציה לשליפת-כל-הדיילות.
    if p_threshold < 0 or p_threshold > 1000 then
      raise exception 'רף לתצוגה-מקדימה חייב להיות בין 0 ל-1000'
        using errcode = 'P0001';
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
