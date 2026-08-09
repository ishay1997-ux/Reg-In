-- =====================================================================================
-- מודול 4 · מיגרציה E — `set_project_coordinates`: מסלול-הכתיבה היחיד לקואורדינטות אירוע
-- =====================================================================================
--
-- why: מרכיב-הקרבה הוא 0.25 מציון ההתאמה (§11.4) ודורש קואורדינטות משני הצדדים.
--   ‏§7.55 הוסיף `projects.lat`/`lng` (מיגרציה A) — **אבל אף אחד לא הוסיף דרך לכתוב אליהן.**
--   נמדד 09/08/2026: ל-`projects` יש מדיניות **קריאה אחת בלבד** (`projects_select_by_permission`,
--   מיגרציה D) ואפס מדיניות-כתיבה ⇒ הדפדפן אינו יכול לשמור קואורדינטה, וכל אירוע במערכת
--   היה נשאר "אין קואורדינטות" לצמיתות.
--
-- 🚫 **ולמה לא פשוט מדיניות-UPDATE על `projects` — וזו הנקודה המרכזית של המיגרציה הזאת:**
--   ‏RLS ב-Postgres הוא ברמת-**שורה** ולא ברמת-**עמודה** (`src/CLAUDE.md` §RLS). מדיניות-כתיבה
--   הייתה מתירה למודול 4 לדרוס **כל** עמודה ב-`projects` — כולל `final_event_date`,
--   `project_status` ו-`customer_id` — בעוד שמודל-האבטחה של המודול (§4 במדריך-המיקרו · §7.63)
--   קובע במפורש: **מ4 לוקחת SELECT בלבד על `projects`.** פונקציה ייעודית היא הדרך היחידה
--   לפתוח **שתי עמודות** בלי לפתוח את הטבלה.
--   התקדים בתוך המודול עצמו: `respond_to_shift_invite` (מיגרציה D) — אותו דפוס בדיוק,
--   פונקציה שכותבת שני שדות בשורה אחת ותו לא.
--
-- מה היא עושה: כותבת `lat`/`lng` · בשורה **אחת** · **רק אם שתיהן ריקות** — כלומר
--   *"מומרת פעם אחת בשמירה"* (`processes-approved.md:97`) נאכף במסד ולא בקוד.
--
-- הרשאות: **`authenticated` בלבד**, ורק בעל הרשאת-**עריכה** על מודול 'דיילות'.
--   🚫 ‏`anon` אינו יכול להריץ אותה — בניגוד לפונקציה הציבורית, כאן אין שום מקרה-שימוש ציבורי.
--
-- ⚠️ **צפי-יועצים, כדי שלא ייקרא כרגרסיה:** הבסיס לפני המיגרציה הוא **14** (נמדד באותו יום).
--   הפונקציה החדשה תוסיף **אזהרה אחת** — `authenticated_security_definer_function_executable` —
--   בדיוק כמו שש הקיימות. **הצפי: 14 ⇐ 15.** זו הזמנה, לא ממצא.
--
-- reversibility: הפיכה במלואה — `drop function public.set_project_coordinates(int,numeric,numeric)`.
--   ⚠️ **מלבד שורות שכבר נכתבו**: קואורדינטה שנשמרה נשארת. זו כתיבת-נתונים ולא שינוי-מבנה,
--   והיא **מתקנת-את-עצמה** — ריקון `lat`/`lng` מחזיר את השורה למצב "טרם הומרה" והמסלול ירוץ שוב.

create or replace function public.set_project_coordinates(
  p_project_id integer,
  p_lat numeric,
  p_lng numeric
)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_rows integer;
begin
  -- שער-ההרשאה. 🔴 בתוך `security definer` ה-RLS של הקורא **אינו** חל, ולכן הבדיקה
  -- הזאת היא ההרשאה היחידה — היעדרה היה הופך את הפונקציה לדלת פתוחה לכל מחובר.
  -- אותה תבנית §7.21 של כל ה-policies במודול, כולל עטיפת `(select …)`.
  if not exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'דיילות')
      and p.permission_level = 'edit'
  ) then
    raise exception 'אין הרשאה לעדכן קואורדינטות של אירוע' using errcode = '42501';
  end if;

  -- שפיות-קלט. הלקוח כבר מסנן לגבולות ישראל (`src/lib/geocode.js`), וזו הבדיקה
  -- **השנייה והבלתי-תלויה**: שומר שחי רק בדפדפן מת ברגע שמישהו קורא ל-RPC ישירות.
  if p_lat is null or p_lng is null
     or p_lat < 29.0 or p_lat > 33.5
     or p_lng < 34.0 or p_lng > 36.0 then
    raise exception 'קואורדינטות מחוץ לתחום הקביל' using errcode = '22023';
  end if;

  -- 🔴 `and lat is null and lng is null` הוא אכיפת ה"פעם אחת": קריאה שנייה על אותו
  -- אירוע אינה דורסת ואינה שוגה — היא פשוט אינה נוגעת בשורה ומחזירה `false`.
  update public.projects
     set lat = p_lat,
         lng = p_lng
   where project_id = p_project_id
     and lat is null
     and lng is null;

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end $$;

-- ‏`create function` מעניק EXECUTE ל-PUBLIC כברירת-מחדל ⇒ בלי ה-revoke הזה
-- **‏`anon` היה יכול להריץ אותה.** הסדר חשוב: קודם לשלול מכולם, ואז להעניק.
revoke execute on function public.set_project_coordinates(integer, numeric, numeric) from public;
grant  execute on function public.set_project_coordinates(integer, numeric, numeric) to authenticated;
