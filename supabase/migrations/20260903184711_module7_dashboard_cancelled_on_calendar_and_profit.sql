-- =============================================================================
-- מודול 7 · מיגרציית-תיקון-קדימה · צעד 1.3 — מבוטלים: מוצגים בלוח, ונספרים ברווח רק אחרי פתרון
-- =============================================================================
-- 🎯 **שתי הכרעות-ישי, 03/09/2026 18:4X — "מאשר הכל לפי המלצתך, אהבתי את הכיוון שנהיה בדומה למנדיי":**
--
--    ‏① **פרויקט מבוטל מופיע בלוח-השנה** (מחוק-בקו, אפור, תג "מבוטל", בלי אייקוני-מוכנות; שבב-סינון
--       רביעי, דלוק כברירת-מחדל). **מה זה מחליף:** ההנחה (`הנחתי`) במיגרציה `20260903182735` ש"אירוע
--       שלא יתקיים אינו מוכן ולכן אינו בלוח" — ישי דחה אותה. **העוגן החיצוני:** Monday משאירה פריט
--       "מבוטל" בתצוגת-הלוח צבוע לפי סטטוס ומסננת לפי עמודת-הסטטוס; Google Calendar מציגה אירועים
--       שנדחו מחוקים-בקו עם מתג "הצג אירועים שנדחו". **תשובת-הכנס:** *"כמו ב-Monday — מבוטל נשאר
--       על הלוח עם סימון, כי המנהלת צריכה לדעת שהתאריך התפנה, ומי שלא רוצה מסנן."*
--       ‏**ה-diff:** בסינון שורות-הלוח נמחק התנאי `and o.project_status <> 'cancelled'`. שדות-הפלט
--       זהים; `project_status = 'cancelled'` הוא מה שהלקוח קורא כדי לצייר את השבב האפור.
--
--    ‏② **פרויקט מבוטל תורם לרווח-החודשי רק אחרי שדמי-הביטול נפתרו** — ואז את `final_profit` הקפוא
--       (§7.79: "נכתב ברגע פתרון-הפה"). עד אז תרומתו **0**, והוא נשאר באוכלוסייה (נספר
--       ב-`monthly_profit_project_count`). **מה זה מחליף — עקיפת-ישי של §7.96 כלשונו:** "מבוטל לא מקבל
--       טיפול מיוחד" הוכרע ע"י קלוד בהאצלה ("תבחרו שניכם"), **ונמדד שהוא מייצר מספר שקרי:** הפרויקט
--       היחיד של ספטמבר 2026 (#15 "ערב השקה — קמפוס צפון", בוטל 28/08, פה לא-נפתר) הציג
--       `monthly_profit = 3635` — הרווח המלא של אירוע שלא יתקיים, כאילו הדיילות עבדו והסחורה סופקה.
--       **תשובת-הכנס:** *"אירוע שבוטל תורם לרווח את מה שבאמת נגבה ממנו, לא את מה שהיה אמור להרוויח."*
--       ‏**ה-diff:** `coalesce(pf.final_profit, m.gross_profit)` ⇒
--       `coalesce(pf.final_profit, case when p.project_status = 'cancelled' then 0 else m.gross_profit end)`.
--       ‏🔗 **write-back ל-§7.96 (↳ 03/09/2026):** הקובץ `PROJECT_MASTER_sec7.md` נושא את פריטים 93–97 רק
--       בדיף לא-מקומט של סשן-הזריעה (כלל 16 — לא נוגעים); הנוסח-להדבקה שמור ב-`docs/micro_guides/module-7.md` §9.
--
-- 🔁 **הגוף החי נמשך לפני הכתיבה** (`pg_get_functiondef`, 03/09/2026 18:4X, md5 `2f06bbee…`, 5,769 תווים)
--    ואומת שהוא מכיל בדיוק את שתי המחרוזות שמשתנות. **כל שאר הגוף — זהה בייט-בבייט למיגרציה
--    `20260903182735`** (הכותרת המלאה, ההנחות, העוגנים — שם; לא משוכפלים כאן).
-- 🔁 **הפיכוּת:** `create or replace` עם גוף `20260903182735`. **כלל-הפריסה:** חתימה זהה; הקוד הפרוס
--    אינו קורא לפונקציה (מ7 טרם נפרס) ⇒ אין מה לשבור.
-- 🧾 הענקות: נכתבות שוב במפורש (המצב כתוב, לא מוסק).
--
-- 🔻 אימות אחרי ההחלה (קריאה בלבד, בהתחזות):
--   -- (א) מנכ"ל, ספטמבר 2026: `projects` מכיל את #15 עם `project_status='cancelled'` (לפני: לא היה).
--   -- (ב) מנכ"ל, ספטמבר 2026: `monthly_profit` = NULL-או-0 ולא 3635, `monthly_profit_project_count` = 1.
--   -- (ג) פרויקט לא-מבוטל — ללא שינוי (אוקטובר: הסכום זהה לפני/אחרי).
--   -- (ד) `proacl` בלי `anon=`.
-- =============================================================================

create or replace function public.get_dashboard_summary(p_month date default null)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  -- שעון-ישראל, לא UTC: אחרי 00:00 בלילה current_date עדיין "אתמול" — המוקש שנמדד 26/08/2026.
  v_today        date := (now() at time zone 'Asia/Jerusalem')::date;
  v_month_start  date;
  v_month_end    date;
  v_can_finance  boolean;
  v_can_quotes   boolean;
  v_active       integer;
  v_sat_avg      numeric;
  v_sat_count    integer;
  v_profit       numeric;
  v_profit_count integer;
  v_pending      integer;
  v_projects     jsonb;
  v_quotes       jsonb;
begin
  -- §7.10: המסך לכולם — השער היחיד הוא הרשאת-הקריאה על 'פרויקטים' שכל חמשת התפקידים מחזיקים.
  -- מי שאינו (משתמש לא-פעיל) מקבל 42501 כמו במסך-הפרויקטים, ולא מסך-בית ריק שנראה כמו "אין נתונים".
  perform public.assert_module_permission('פרויקטים', array['edit', 'view']);

  v_month_start := date_trunc('month', coalesce(p_month, v_today))::date;
  v_month_end   := (v_month_start + interval '1 month')::date;

  -- המיסוך (§7.97): אותו predicate של policy-הקריאה הקיימת על כל אחת משתי הטבלאות.
  select exists (
    select 1 from public.permissions p
     where p.role_id = (select public.current_user_role_id())
       and p.module_id = (select m.module_id from public.modules m where m.module_name = 'כספים')
       and p.permission_level = any (array['edit', 'view'])
  ) into v_can_finance;

  select exists (
    select 1 from public.permissions p
     where p.role_id = (select public.current_user_role_id())
       and p.module_id = (select m.module_id from public.modules m where m.module_name = 'הצעות מחיר')
       and p.permission_level = any (array['edit', 'view'])
  ) into v_can_quotes;

  -- KPI 1 — "פעיל" כפי ש-ACTIVE_PROJECT_STATUSES מגדיר (ready פעיל, cancelled לא).
  select count(*)::integer into v_active
    from public.projects p
   where p.project_status in ('not_started', 'in_progress', 'ready');

  -- KPI 2 — §7.95: 90 יום נגללים כולל היום, מעוגן לתאריך-האירוע (אין חותמת-מענה למשוב).
  select round(avg(p.feedback_score)::numeric, 2), count(*)::integer
    into v_sat_avg, v_sat_count
    from public.projects p
   where p.feedback_status = 'completed'
     and p.feedback_score is not null
     and p.final_event_date >  v_today - 90
     and p.final_event_date <= v_today;

  -- KPI 3 — §7.96/§7.52: קפוא אם נסגר, אחרת צפוי-חי. NULL = חודש ריק, לא 0.
  -- ↳ הכרעת-ישי 03/09/2026 (עקיפת §7.96 כלשונו): מבוטל שהפה שלו טרם נפתר תורם 0 — לא את
  --   הרווח-הצפוי של אירוע שלא יתקיים. אחרי הפתרון final_profit קפוא ונכנס כרגיל (§7.79).
  if v_can_finance then
    select sum(coalesce(pf.final_profit,
                        case when p.project_status = 'cancelled' then 0 else m.gross_profit end)),
           count(*)::integer
      into v_profit, v_profit_count
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      cross join lateral public.finance_project_money(p.project_id) m
     where p.final_event_date >= v_month_start
       and p.final_event_date <  v_month_end;
  end if;

  -- KPI 4 + שורות-הרצועה — רק למי שקורא `quotes` ממילא (השער הקיים; ר' הכותרת).
  if v_can_quotes then
    select count(*)::integer into v_pending
      from public.quotes q
     where q.quote_status = 'in_progress';

    select coalesce(jsonb_agg(jsonb_build_object(
             'quote_id',             q.quote_id,
             'event_name',           q.event_name,
             'customer_name',        c.company_name,
             'updated_at',           q.updated_at,
             'estimated_event_date', q.estimated_event_date
           ) order by q.updated_at, q.quote_id), '[]'::jsonb)
      into v_quotes
      from public.quotes q
      left join public.customers c on c.customer_id = q.customer_id
     where q.quote_status = 'in_progress';
  end if;

  -- הלוח + הרצועה — דרך list_projects_overview() הקיימת: אותן ספירות, אותו קיפול, מקור אחד.
  -- ↳ הכרעת-ישי 03/09/2026: מבוטל נשאר בלוח (כמו Monday) — הלקוח מצייר אותו אפור-מחוק לפי הסטטוס.
  select coalesce(jsonb_agg(jsonb_build_object(
           'project_id',             o.project_id,
           'event_name',             o.event_name,
           'customer_name',          o.customer_name,
           'final_event_date',       o.final_event_date,
           'project_status',         o.project_status,
           'required_hostess_count', o.required_hostess_count,
           'hostesses_confirmed',    o.hostesses_confirmed,
           'assignments_row_count',  o.assignments_row_count,
           'logistics_ready',        o.logistics_ready,
           'logistics_total',        o.logistics_total
         ) order by o.final_event_date, o.project_id), '[]'::jsonb)
    into v_projects
    from public.list_projects_overview() o
   where (o.final_event_date >= v_month_start
          and o.final_event_date < v_month_end)
      or o.project_status in ('not_started', 'in_progress', 'ready', 'event_finished', 'awaiting_invoice');

  return jsonb_build_object(
    'today',                        v_today,
    'month_start',                  v_month_start,
    'active_projects_count',        v_active,
    'satisfaction_avg',             v_sat_avg,
    'satisfaction_count',           v_sat_count,
    'profit_visible',               v_can_finance,
    'monthly_profit',               v_profit,
    'monthly_profit_project_count', v_profit_count,
    'quotes_visible',               v_can_quotes,
    'pending_quotes_count',         v_pending,
    'params', jsonb_build_object(
      'quote_validity_days',      (select pa.param_value from public.params pa where pa.param_name = 'ימי_תוקף_הצעה'),
      'quote_expiring_soon_days', (select pa.param_value from public.params pa where pa.param_name = 'ימי_אזהרה_הצעה_פגה'),
      'event_warning_days',       (select pa.param_value from public.params pa where pa.param_name = 'ימי_אזהרה_קדם_אירוע')
    ),
    'projects',                     v_projects,
    'pending_quotes',               v_quotes
  );
end;
$function$;

revoke execute on function public.get_dashboard_summary(date) from public, anon, authenticated;
grant  execute on function public.get_dashboard_summary(date) to authenticated;
