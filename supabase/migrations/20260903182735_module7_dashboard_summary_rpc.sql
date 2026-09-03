-- =============================================================================
-- מודול 7 · מיגרציה יחידה · צעד 1.1 — `get_dashboard_summary(p_month)`: מסך-הבית בקריאה אחת
-- =============================================================================
-- 🎯 **מה זה:** RPC-מרכז אחד שמחזיר את כל מה שמסך-הבית מציג — ארבעת ה-KPI, שורות-הפרויקטים
--    ללוח-השנה ולרצועת "מה דורש טיפול", ההצעות-הפתוחות לרצועה, ושלושת פרמטרי-הספים — בקריאה
--    אחת במקום 4–5 שאילתות-לקוח. **קריאה בלבד. אין טבלה חדשה, אין עמודה חדשה, אין policy חדשה.**
--
-- 🔐 **מודל-ההרשאות (§7.10 + §7.97, מדריך-המיקרו §4):**
--    · המסך נגיש לכולם (§7.10) — אין שורת-מודול "מסך הבית" ואסור שתהיה. השער היחיד בכניסה הוא
--      `assert_module_permission('פרויקטים', edit/view)` — **כל חמשת התפקידים מחזיקים אותה**, ומי
--      שאינו (משתמש לא-פעיל, `current_user_role_id()` = NULL) מקבל `42501` בדיוק כמו במסך-הפרויקטים.
--      ⇒ ה-RPC קורא `projects` בשמך רק אם היית יכול לקרוא אותה בעצמך.
--    · **המיסוך קורה בגוף, פר-שדה, לא ב-policy:** הפונקציה היא `security definer` ולכן עוקפת RLS
--      בקריאותיה-שלה; לכן היא בודקת בעצמה **את אותו predicate בדיוק** של שתי ה-policies הקיימות —
--      `project_finance_select_by_permission` ('כספים') ו-`quotes_select_by_permission` ('הצעות מחיר')
--      — ומחזירה **NULL** (לא 0) בשדה חסום, לצד דגל `*_visible` שמבדיל "חסום" מ"אין נתונים".
--      ‏`project_finance` שומרת על ה-policy של מודול 8 ללא שינוי (מדריך-המיקרו §4 — policy שנייה
--      זהה הייתה משכפלת ולא משנה דבר).
--    · ⚠️ **"הצעות ממתינות" נגזר מהשער הקיים על `quotes`** — כלומר גלוי גם למנהלת-הפרויקטים
--      (`edit` על 'הצעות מחיר'), לא רק למנכ"ל+כספים. §7.97 פותח ב"מנכ"ל+כספים בלבד" ומסיים
--      ב-"`quotes` לא צריכה שינוי — ה-policy הקיימת כבר עושה את זה"; מדריך-המיקרו (§2, טבלת-היכולות)
--      מכריע לפי השער הקיים, כי מיסוך-במסך-הבית-בלבד היה מקרה-פרטי חדש למי שרואה הצעות בכל שאר
--      המערכת. **הוצג לישי בשער-ההקלדה של המיגרציה הזו.** שינוי = מחרוזת-מודול אחת בגוף.
--
-- 📐 **מה נגזר איפה — כלל 14 (SSOT ללוגיקה עסקית ב-`src/lib/`):**
--    · ה-RPC מחזיר **עובדות גולמיות בלבד**: ספירות-איוש/לוגיסטיקה **דרך `list_projects_overview()`
--      הקיימת** (אותו קיפול MAX(assignment_number)-פר-דיילת, אותה ספירת `ready`) — לא שכפול של
--      תת-השאילתות. צבע-הלוח (§7.94), "פג בקרוב" (`deriveQuoteExpiry`), ו"מה חסר" נגזרים בלקוח
--      מ-`src/lib/dashboard.js` + `src/lib/projects.js` + `src/lib/quotes.js` — שם הם כבר חיים
--      ונבדקים. ↳ סטייה מנוסח צעד 1.1 במדריך (שכתב `color`/`staffing_ok` בפלט): הוחלף בעובדות
--      גולמיות כדי שלכלל-הצבע יהיה מקור אחד; רשום ב-§9 של המדריך.
--    · שלושת ספי-ה-`params` (`ימי_תוקף_הצעה` · `ימי_אזהרה_הצעה_פגה` · `ימי_אזהרה_קדם_אירוע`=14 —
--      **הוא חלון ה-14 יום של §7.94**, פרמטר חי ולא קבוע-קוד) מוחזרים כטקסט, כפי שהם ב-`params`;
--      `paramNumber` בלקוח כבר יודע ש-"לא נטען ≠ 0".
--
-- 🧮 **הגדרות ה-KPI, ועוגן לכל אחת:**
--    · `active_projects_count` — `project_status in ('not_started','in_progress','ready')`:
--      ‏`ACTIVE_PROJECT_STATUSES` ב-`src/lib/projects.js` ("פעיל מוגדר פעם אחת. ready פעיל, cancelled לא").
--    · `satisfaction_avg` (§7.95, 90-יום נגלל): ממוצע `feedback_score` של `feedback_status='completed'`
--      שתאריך-האירוע שלהם ב-90 הימים האחרונים כולל היום. ‏🏷️ `הנחתי`: העיגון לתאריך-האירוע — אין
--      עמודת "מתי נענה המשוב" (`record_feedback` אינה כותבת חותמת; נבדק בגוף החי 03/09/2026).
--      NULL כשאין אף משוב בחלון (המסך מציג "—", לא 0).
--    · `monthly_profit` (§7.96 + §7.52): כל פרויקט ש-`final_event_date` שלו בחודש-היעד;
--      `project_finance.final_profit` אם קפוא, אחרת `finance_project_money().gross_profit` (רווח-צפוי חי).
--      **מבוטל נכנס כמו כל פרויקט אחר, בלי טיפול מיוחד** (§7.96 מילה-במילה; תקדים §7.79). NULL כשאין
--      פרויקטים בחודש (ולא 0 — "חודש ריק" ו"חודש ברווח 0" אינם אותה אמירה), ו-NULL כשחסום.
--      ⚠️ `finance_project_money` מעלה `P0001` לפרויקט בלי שורות-הצעה — אותה חשיפה בדיוק של
--      `get_finance_overview` החיה; לא נעטף, כדי שלא להסתיר פרויקט פגום בשקט מסכום-כסף.
--    · `pending_quotes_count` — `quote_status='in_progress'`: אותו מסנן של `deriveQuoteMetrics`
--      ("open") ב-`src/lib/quotes.js`.
--    · `p_month` — חודש-היעד ללוח **ולרווח-החודשי**; ברירת-המחדל היום. 🏷️ `הנחתי`: כרטיס-הרווח עוקב
--      אחרי החודש שמוצג בלוח (ניווט לאוקטובר ⇒ רווח אוקטובר); שני ה-KPI האחרים הם "עכשיו". פתוח
--      לעקיפה בשער-ה-🎨 של פזה 3, בלי שינוי-מסד — הלקוח יכול לקרוא עם `null` תמיד.
--    · "היום" נגזר משעון-ישראל (`Asia/Jerusalem`), לא מ-`current_date` שהוא UTC — המוקש שנמדד
--      בסיד של מודול 5 (26/08/2026: ריצת-לילה זרעה יום אחורה).
--
-- 📦 **שורות-הפרויקטים (`projects`)** — איחוד של: (א) כל פרויקט לא-מבוטל שתאריכו בחודש-היעד
--    (הלוח) · (ב) כל פרויקט בסטטוס פתוח — פעיל, `event_finished`, `awaiting_invoice` — מכל חודש
--    (הרצועה: "הסתיים ולא חויב" · "חוסר בתוך 14 יום"). מבוטל אינו בלוח (🏷️ `הנחתי`: אירוע שלא
--    יתקיים אינו "מוכן"; מקומו ברשימת-הפרויקטים, לא בלוח-הביצוע). שדות = תת-קבוצה של
--    `list_projects_overview`, כדי ש-`overviewHasGap`/`logisticsComplete` יעבדו עליהן כמו שהן.
--
-- 🔁 **הפיכוּת:** `drop function public.get_dashboard_summary(date)` — אין מצב שנשאר מאחור.
--    **כלל-הפריסה:** פונקציה חדשה — תוספת בלבד; הקוד הפרוס אינו יודע שהיא קיימת.
-- 🧾 **הענקות (המוקש של 09/08):** `revoke … from public, anon, authenticated` ואז `grant … to authenticated`;
--    אימות `proacl` בלי `anon=` אחרי ההחלה.
-- ✅ **צ'קליסט-העיצוב (`db_roadmap.md §1`):** §7 — 10/52/79/94/95/96/97 (למעלה) · RLS — אין טבלה/policy
--    חדשה · FK/אילוצים/עמודות-זמן/כסף — אין עמודה חדשה · כל מספר-מוצג ⇒ מקור נקוב (למעלה) · Seed —
--    אין · typed-echo — לפני ההחלה · אחרי — `schema.sql` + `db_roadmap` באותו קומיט · advisors — צפי:
--    ממצא-מחלקה אחד צפוי (`authenticated_security_definer_function_executable`, כמו כל ה-RPC-ים).
--
-- 🔻 אימות אחרי ההחלה (קריאה בלבד, בהתחזות, positive control קודם):
--   -- (א) כספים/מנכ"ל: `profit_visible=true`, `monthly_profit` מספר (או NULL עם `monthly_profit_project_count=0`).
--   -- (ב) פרויקטים: `profit_visible=false`, `monthly_profit` NULL, `quotes_visible=true`.
--   -- (ג) גיוס/לוגיסטיקה: שני הדגלים false, שני השדות NULL, `projects` מלא.
--   -- (ד) `active_projects_count` מול ספירת-יד `select count(*) from projects where project_status in (…)`.
--   -- (ה) `select proacl from pg_proc where proname='get_dashboard_summary'` ⇒ בלי `anon=`.
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

  -- KPI 3 — §7.96/§7.52: קפוא אם נסגר, אחרת צפוי-חי; מבוטל נכנס כמו כולם. NULL = חודש ריק, לא 0.
  if v_can_finance then
    select sum(coalesce(pf.final_profit, m.gross_profit)), count(*)::integer
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
          and o.final_event_date < v_month_end
          and o.project_status <> 'cancelled')
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

-- הענקות — הדפוס הקיים (מיגרציית מ4-D): revoke מכולם בשם, grant ל-authenticated; השער בגוף.
revoke execute on function public.get_dashboard_summary(date) from public, anon, authenticated;
grant  execute on function public.get_dashboard_summary(date) to authenticated;
