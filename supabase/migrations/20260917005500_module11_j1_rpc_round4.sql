-- =============================================================================
-- מודול 11 · מיגרציה J1 · סבב-4 — מיון-מול-משפט, רצפת-מהותיות, ומה שאסור להגיע למסך
-- =============================================================================
-- 🎯 **מה זה:** מיגרציית תיקון-קדימה שלישית, חוצת-לשוניות, על **שמונה** פונקציות-דוח:
--    ‏`report_m08_profitability` · `report_m09_aging` (כספים) ·
--    ‏`report_m14_hostess_overview` · `report_m15_reliability` ·
--    ‏`report_m16_quality_cost` (דיילות) · `report_m20_satisfaction` ·
--    ‏`report_m21_drifting` · `report_m22_notes` (לקוחות).
--    היא ממשיכה את I1 (`20260916114500_module11_i1_rpc_formats_and_notes.sql`)
--    ואת I2 (`20260916194500_module11_i2_rpc_round3.sql`), ומכסה את פריטי **סבב-4**
--    שבבעלות ה-RPC: חמישה מריצת-האנומליות ([4] [5] [6] [7] [24]) וארבעה מהערכות-הטקסט
--    ‏([C4] [C5] [C6] [C8]).
--    **כל שינוי הוא טקסט, מיון, `where` של הדירוג, או ערך של מפתח קיים/חדש במטען.**
--    אין טבלה חדשה, אין עמודה, אין policy, אין שינוי-חתימה, אין כתיבה.
--
-- 🔻 **אין `drop`, ולמה:** אף חתימה אינה משתנה ⇒ `create or replace` אינו יוצר עומס-יתר
--    חדש ואין קריאת-PostgREST שעלולה להפוך ל-ambiguous. ‏`comment` · `revoke` · `grant`
--    חוזרים כאן מילה-במילה כפי ש-I1/I2 כתבו אותם (הועתקו מהקובץ החי, לא הוקלדו).
--
-- 📐 **מקור הגוף — נמדד, לא זכור:** לפני שנגענו בתו אחד נמשך `md5(prosrc)` מ-`pg_proc`
--    החי (17/09/2026 00:5X) והושווה ל-`md5` של גוף ה-`$function$` בקובץ-המקור של כל אחת.
--    ‏**8/8 זהות**, ולכן הגוף שלמטה **הוא** הגוף החי ועליו הונחו השינויים:
--    ‏`m08` · `m16` מ-I1 · `m09` · `m14` · `m15` · `m20` · `m21` · `m22` מ-I2
--    ‏(`docs/schema.sql §24` מצביע על אותם קבצים בדיוק).
--
-- 🗂️ **שורות הרישום (`supabase_migrations.schema_migrations`), אחת לכל נתח < 60 KB:**
--    ‏`module11_j1_m08` · `module11_j1_m09` · `module11_j1_m14` · `module11_j1_m15` ·
--    ‏`module11_j1_m16` · `module11_j1_m20` · `module11_j1_m21` · `module11_j1_m22`.
--    ‏(D-20: הקובץ מוחל בנתחים כי `apply_migration` קוטם ~90 KB בשקט; כל נתח הוא
--    פונקציה אחת שלמה + `comment`/`revoke`/`grant` שלה.)
--
-- 🩹 **הליקויים שהיא מתקנת — כל אחד נמדד על מטען חי, ומסומן 🪤 J1 בגוף:**
--    ‏① **[4] מ8, שורת-"אז מה" מול המיון:** המשפט בחר את השורה לפי `r desc` (האחוז)
--       בשעה שהטבלה מדורגת לפי ₪-חריגה (📑ב#5 נועל את המיון) ⇒ הוא שלח את מנהלת-הכספים
--       לשורה **הרביעית** בטבלה (1,427 · 27.2%) במקום לראשונה (1,416 · 361 ₪ · 21.1%).
--       עכשיו הוא נוקב בשורה הראשונה **כפי שהיא מוצגת**, ונושא את שני מספריה.
--    ‏② **[5] מ8, רצפת-מהותיות שהוצהרה ולא יושמה:** `processes-approved.md §📑ב#5`
--       ו-`cards-finance.md:261` שניהם אומרים *"אינו בדירוג"*, והערת-השוליים על המסך
--       אומרת *"בתוך האוכלוסייה ומחוץ לדירוג בלבד"* — אך השורות רק ירדו לסוף המיון.
--       הן מוצאות מ-`rows`. המונה והסכום שבהערת-השוליים נספרים על `win` כולו ולא זזו.
--    ‏③ **[6] מ16:** תעריף-חציוני בשתי ספרות ובלי ₪ (`43.27`) ליד אריח שאומר `43 ₪`
--       וקו-ייחוס שאומר `43 ₪` — אותו מספר בשלוש צורות. 📐4 · D-34 ⑤ ⇒ שלמים.
--    ‏④ **[7] מ15:** שורת-ההגדרות ציטטה למשתמשת-הקצה מזהה-קוד (`reliabilityScore`)
--       ומספר-הכרעה פנימי (הכרעה 38). D-34 ④ הוא התקדים ⇒ עברית בלבד, המשמעות נשמרת.
--    ‏⑤ **[24] מ14 מול מ15:** אותם שלושה קבועים בשש ספרות כאן ובארבע שם. מיושר לארבע
--       (הדיוקוּת של מ15); `meta` ממשיך לשאת שש — ערך-מכונה, לא טקסט-מסך. ‏+ 'ענבר'
--       ⇐ 'דיילת ענבר', כפי שמ15 אומרת.
--    ‏⑥ **[C4] מ20:** שורת-ההערות הדפיסה `(📐11)` — קוד-כלל על המסך, הדליפה היחידה
--       מסוגה ב-16 המשטחים (כ4) — ו-*"N מתוך M"*. שניהם ירדו; המוסכמה במילים.
--    ‏⑦ **[C5] מ22:** הפס קרא לאדם בכתובת-ההתחברות שלו ⇒ `left join users` על
--       ‏`approved_by` (FK של דוא"ל) ו-`full_name` הוא מה ש-`meta.run.approved_by`
--       נושא עכשיו (הכתובת שמורה ב-`approved_by_email`). ‏+ שורת-ההערות הסתיימה
--       בשני מזהי-מודל של הספק ⇒ ירדו מהמשפט, ונשארים ב-`meta.models`/`run.models`.
--    ‏⑧ **[C6] מ21, ערך שגוי:** חצי-ההשוואה של אריח *"נתפסים רק בקצב האישי"* אמר
--       *"…ואת אלה הוא מפספס"* ונשא את `dormant_all` — כלומר את מה שכלל-120-הימים
--       **מוצא**, אותו מספר שהתווית כבר הדפיסה שורה לפניו. ⇒ `only_personal`.
--    ‏⑨ **[C8] מ9:** *"ארבעת דליי-האיחור"* מול 'מדרג' בכל שאר המסך ⇒ 'מדרגי-האיחור'
--       (המונח הנעול של `spec.md §1.4`).
--
-- ⚠️ **מה שהקובץ הזה במכוון אינו נוגע בו, ולמה:**
--    ‏(א) **פסקת-נרטיב-הגרף של מ9** (`v_chart_note`, שבע שורות עם מספרים חיים) — היא
--        שאלה פתוחה לישי, ולכן שלוש מופעי 'דלי' שבתוכה **נשארו**. ⇒ המסך עדיין נושא
--        שני מונחים עד שהשאלה תוכרע. מדווח, לא הוסתר.
--    ‏(ב) **הנוסח *"מציג את הריצה"* (יחיד) מול שתי ריצות מאושרות** — המשפט מורכב
--        ב-`src/modules/11_reports/tabs/customers/AnalysisRunBar.jsx:165` ולא ב-SQL.
--    ‏(ג) **שורת-ההשוואה-לאשתקד בארבעה נוסחים על תשעה משטחים** — תשע פונקציות
--        והכרעת-ניסוח; לשולחן-הבוקר, לא לכאן.
-- =============================================================================

create or replace function public.report_m08_profitability(
  p_from date default null,
  p_to date default null,
  p_customer_id integer default null,
  p_drill jsonb default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_lri         constant text := chr(8294);
  v_pdi         constant text := chr(8297);
  v_today       date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to          date;
  v_from        date;
  v_prev_from   date;
  v_prev_to     date;
  v_threshold   numeric;
  v_missing     text[] := array[]::text[];
  v_n           integer;
  v_over        integer;
  v_over_sum    numeric;
  v_margin      numeric;
  v_median      numeric;
  v_frozen      integer;
  v_floor_n     integer;
  v_floor_sum   numeric;
  v_excl_status integer;
  v_prev_n      integer;
  v_prev_over   integer;
  v_prev_sum    numeric;
  v_prev_margin numeric;
  v_prev_median numeric;
  v_chart       jsonb;
  v_rows        jsonb;
  v_top_id      integer;
  v_top_name    text;
  v_top_pct     numeric;
  v_top_dev     numeric;
  v_share_pct   numeric;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  v_to        := coalesce(p_to, v_today);
  v_from      := coalesce(p_from, date_trunc('year', v_to)::date);
  v_prev_from := (v_from - interval '1 year')::date;
  v_prev_to   := (v_to - interval '1 year')::date;

  select pa.param_value::numeric into v_threshold
    from public.params pa where pa.param_name = 'סף_סטיית_תקציב_אחוז';
  if v_threshold is null then
    v_missing := array['סף_סטיית_תקציב_אחוז'];
  end if;

  -- why (F8): מי באמת הוצא מ-n. עד כה `excluded` נשא את 123 שמתחת לרצפת-המהותיות, והם
  --           **בתוך** האוכלוסייה ורק מחוץ לדירוג — מסך שמרנדר `excluded` היה מדפיס
  --           "הוצאו: מתחת לרצפת-המהותיות 123" ליד תווית שאומרת את ההפך.
  select count(*)::integer into v_excl_status
    from public.projects p
   where p.final_event_date >= v_from and p.final_event_date <= v_to
     and p.project_status not in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')
     and (p_customer_id is null or p.customer_id = p_customer_id);

  with money as (
    select p.project_id, p.final_event_date, c.company_name, p.feedback_score,
           pf.final_profit, m.gross_profit, m.revenue, m.budget_deviation,
           m.planned_hours, m.finally_approved_count,
           (select coalesce(sum(a.hourly_rate_snapshot), 0) from public.assignments a
             where a.project_id = p.project_id and a.assignment_status = 'finally_approved') as rate_sum,
           (select coalesce(sum(a.actual_hours), 0) from public.assignments a
             where a.project_id = p.project_id) as actual_team_hours
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      left join public.customers c on c.customer_id = p.customer_id
      cross join lateral public.finance_project_money(p.project_id) m
     -- הכרעה 36 — אוכלוסיית-הכסף: אירועים שהתקיימו ויצאה להם חשבונית.
     where p.project_status in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')
       and (p_customer_id is null or p.customer_id = p_customer_id)
  ), calc as (
    select mo.*,
           mo.planned_hours * mo.rate_sum as planned_labor,
           mo.planned_hours * mo.finally_approved_count as planned_team_hours,
           mo.budget_deviation / nullif(mo.planned_hours * mo.rate_sum, 0) as r
      from money mo
  ), win as (
    select * from calc where final_event_date >= v_from and final_event_date <= v_to
  ), prev as (
    select * from calc where final_event_date >= v_prev_from and final_event_date <= v_prev_to
  )
  select (select count(*) from win),
         (select count(*) from win where r > v_threshold / 100.0),
         (select coalesce(sum(budget_deviation), 0) from win where r > v_threshold / 100.0),
         (select sum(coalesce(final_profit, gross_profit)) / nullif(sum(revenue), 0) from win),
         (select percentile_cont(0.5) within group (order by r) from win),
         (select count(*) from win where final_profit is not null),
         (select count(*) from win where planned_hours < 4 or planned_labor < 1000),
         -- why (F8): הרצפה מוצהרת גם ב-₪. "123 פרויקטים" בלי סכום אינו אומר אם מוסתרים
         --           כאן 5,000 ₪ או 700,000 ₪, וזה ההבדל בין הערת-שוליים לבין ממצא.
         (select coalesce(sum(round(revenue)), 0) from win where planned_hours < 4 or planned_labor < 1000),
         (select count(*) from prev),
         (select count(*) from prev where r > v_threshold / 100.0),
         (select coalesce(sum(budget_deviation), 0) from prev where r > v_threshold / 100.0),
         (select sum(coalesce(final_profit, gross_profit)) / nullif(sum(revenue), 0) from prev),
         -- why (F3): חציון-הסטייה אשתקד — אותה נוסחה, אותו חלון, שנה אחורה. הוא היה
         --           `compare: null` בעוד המוקאפ המאושר מדפיס לצידו "2025: 0.0%".
         (select percentile_cont(0.5) within group (order by r) from prev),
         -- הגרף: 15 הסטיות הגדולות ב-**₪** (📊 · 📑ב#5 — לא באחוזים), חתומות, ציר מאפס.
         (select coalesce(jsonb_agg(jsonb_build_object(
            'project_id', project_id, 'customer_name', company_name,
            'deviation', round(budget_deviation)) order by abs(budget_deviation) desc), '[]'::jsonb)
            from (select * from win order by abs(budget_deviation) desc limit 15) t),
         -- הטבלה: החורגים, **ממוינים לפי ₪-חריגה** (📑ב#5 נועל את המיון), מהותיים בראש.
         (select coalesce(jsonb_agg(jsonb_build_object(
            'project_id', project_id, 'customer_name', company_name,
            'revenue', round(revenue), 'profit', round(coalesce(final_profit, gross_profit)),
            'planned_team_hours', round(planned_team_hours, 1),
            'actual_team_hours', round(actual_team_hours, 1),
            'deviation', round(budget_deviation), 'deviation_pct', round(100 * r, 1),
            'feedback_score', feedback_score,
            'below_materiality', (planned_hours < 4 or planned_labor < 1000),
            'drill_key', jsonb_build_object('kind', 'project', 'id', project_id))
            order by budget_deviation desc), '[]'::jsonb)
            -- 🪤 J1 · **רצפת-המהותיות הוצהרה ולא יושמה.** עד כאן השורות שמתחת לרצפה רק
            --    ירדו לסוף המיון ונשארו **בתוך הדירוג** — נמדד חי 16/09/2026: פרויקט 12
            --    (1.5 שעות-צוות, 300.0%) ישב במקום 12 מתוך 30, בשעה שהערת-השוליים
            --    מעל הטבלה אומרת *"הם בתוך האוכלוסייה ומחוץ לדירוג בלבד"*.
            --    ההגדרה נפתחה ונקראה: `processes-approved.md §📑ב#5` — *"פרויקט מתחת ל-4 שעות
            --    מתוכננות **או** 1,000 ₪ עלות-עבודה מתוכננת **אינו בדירוג**"* — וכן
            --    `cards-finance.md:261`. המונה והסכום שבהערת-השוליים לא זזו: הם נספרים
            --    על `win` כולו ולא על השורות המדורגות.
            from win where r > v_threshold / 100.0
              and not (planned_hours < 4 or planned_labor < 1000)),
         -- 🔴 כותרת-הפעולה נבחרת **מהשורות שבדירוג בלבד**. זו בדיוק הסיבה שרצפת-המהותיות
         --    קיימת (📑ב#5): נמדד חי 16/09/2026 שפרויקט 12 מציג **300%** סטייה על 1.5
         --    שעות-צוות ו-203 ₪ — הוא היה עומד ראשון בשורת-"אז מה" ושולח את מנהלת-הכספים
         --    לפתוח את הפרויקט הקטן ביותר במערכת.
         -- 🪤 J1 · **המיון כאן היה `r desc` (האחוז) בשעה שהטבלה מדורגת ב-₪**
         --    (📑ב#5 נועל מיון-₪) ⇒ שורת-"אז מה" שלחה לשורה אחרת מזו שבראש
         --    הטבלה. נמדד חי 16/09/2026: השורה שנוקבה (1,427 · 27.2%) הייתה **רביעית**
         --    בטבלה, ובראשה עמדה 1,416 (361 ₪ · 21.1%). המשפט מצביע עכשיו
         --    על השורה הראשונה **כפי שהיא מוצגת**, ונושא את שני המספרים שלה.
         (select project_id from win where r > v_threshold / 100.0
            and not (planned_hours < 4 or planned_labor < 1000) order by budget_deviation desc limit 1),
         (select company_name from win where r > v_threshold / 100.0
            and not (planned_hours < 4 or planned_labor < 1000) order by budget_deviation desc limit 1),
         (select round(100 * r, 1) from win where r > v_threshold / 100.0
            and not (planned_hours < 4 or planned_labor < 1000) order by budget_deviation desc limit 1),
         (select round(budget_deviation) from win where r > v_threshold / 100.0
            and not (planned_hours < 4 or planned_labor < 1000) order by budget_deviation desc limit 1)
    into v_n, v_over, v_over_sum, v_margin, v_median, v_frozen, v_floor_n, v_floor_sum,
         v_prev_n, v_prev_over, v_prev_sum, v_prev_margin, v_prev_median, v_chart, v_rows,
         v_top_id, v_top_name, v_top_pct, v_top_dev;

  v_share_pct := round(100.0 * v_over / nullif(v_n, 0), 1);

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_n,
      'label', 'אוכלוסייה: אירועים שהתקיימו ויצאה להם חשבונית — פרויקט הסתיים · ממתין לסגירה · '
               || 'ממתין לחשבונית · ממתין לתשלום, אירוע ב-' || v_lri || to_char(v_from, 'DD/MM/YYYY')
               || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi || ' · הוצאו: פרויקטים פעילים ומבוטלים ('
               || v_lri || v_excl_status || v_pdi || ') · ' || v_lri || 'n=' || v_n || v_pdi
               || '. הדף אינו מציג פרויקטים פעילים — לפני שהאירוע התקיים השעות-בפועל תמיד קטנות '
               || 'מהמתוכננות, ולכן אין בו חריגה למדוד. ' || v_lri || v_floor_n || v_pdi
               || ' מהם מתחת לרצפת-המהותיות — בתוך האוכלוסייה, מחוץ לדירוג.',
      -- why (F8): רק מה שבאמת מחוץ ל-n.
      'excluded', jsonb_build_object('פרויקטים פעילים ומבוטלים', v_excl_status)),
    'window', jsonb_build_object('from', v_from, 'to', v_to,
      'label', v_lri || to_char(v_to, 'YYYY') || ' (' || to_char(v_from, 'DD/MM') || '–'
               || to_char(v_to, 'DD/MM') || ')' || v_pdi),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'projects_in_period', 'label', 'פרויקטים בתקופה',
        'value', v_n, 'format', 'int', 'window', 'התקופה שנבחרה',
        'sub', 'אירועים שהתקיימו ויצאה להם חשבונית',
        'compare', jsonb_build_object('value', v_prev_n,
          'label', v_lri || to_char(v_prev_to, 'YYYY') || v_pdi || ' באותו טווח', 'note', null,
          'direction', case when v_n > v_prev_n then 'up' when v_n < v_prev_n then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object('key', 'over_threshold', 'label', 'פרויקטים שחרגו מהתקציב',
        -- why (F2 · C5): שלושת האריחים התלויים בסף אינם מצוירים בלי הפרמטר.
        'value', case when v_threshold is null then null else v_over end,
        'format', 'int', 'window', 'התקופה שנבחרה',
        'share_pct', case when v_threshold is null then null else v_share_pct end,
        'sub', case when v_threshold is null then null
                    else 'מעל סף ' || v_lri || v_threshold::text || '%' || v_pdi || ' · '
                         || v_lri || to_char(v_share_pct, 'FM990.0') || '%' || v_pdi || ' מתוך '
                         || v_lri || v_n || v_pdi || ' האירועים' end,
        'compare', case when v_threshold is null then null else jsonb_build_object(
          'value', v_prev_over, 'count', v_prev_n,
          'label', v_lri || to_char(v_prev_to, 'YYYY') || v_pdi,
          'note', v_lri || to_char(round(100.0 * v_prev_over / nullif(v_prev_n, 0), 1), 'FM990.0')
                  || '%' || v_pdi || ' מהאירועים',
          'direction', case when v_over > v_prev_over then 'up'
                            when v_over < v_prev_over then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'sum_over_threshold', 'label', 'סך החריגה מעל הסף',
        'value', case when v_threshold is null then null else round(v_over_sum) end,
        'format', 'money', 'window', 'התקופה שנבחרה',
        'sub', 'חריגה כלפי-מעלה בלבד — חיסכון בפרויקט אחד אינו מקזז חריגה באחר',
        'compare', case when v_threshold is null then null else jsonb_build_object(
          'value', round(v_prev_sum), 'label', v_lri || to_char(v_prev_to, 'YYYY') || v_pdi, 'note', null,
          'direction', case when v_over_sum > v_prev_sum then 'up'
                            when v_over_sum < v_prev_sum then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח בתקופה',
        'value', round(100 * v_margin, 1), 'format', 'percent', 'window', 'התקופה שנבחרה',
        'sub', 'סך הרווח חלקי סך ההכנסה, על אותה אוכלוסייה',
        'compare', jsonb_build_object('value', round(100 * v_prev_margin, 1),
          'label', v_lri || to_char(v_prev_to, 'YYYY') || v_pdi, 'note', null,
          'direction', case when v_margin > v_prev_margin then 'up'
                            when v_margin < v_prev_margin then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object('key', 'median_deviation', 'label', 'חציון-סטייה',
        'value', round(100 * v_median, 1), 'format', 'percent', 'window', 'התקופה שנבחרה',
        -- why: תת-השורה **עובדתית ולא פרשנית**. "רוב הפרויקטים סביב התכנון" הוא משפט
        --      שיישאר על המסך גם ביום שבו החציון יקפוץ ל-40%.
        'sub', 'החציון של כל ' || v_lri || v_n || v_pdi || ' הפרויקטים בתקופה — חצי מעליו וחצי מתחתיו',
        -- why (F3): יש בסיס-השוואה אמיתי ומדיד, ולכן "—" אסור (📐1).
        'compare', case when v_prev_median is null then null else jsonb_build_object(
          'value', round(100 * v_prev_median, 1),
          'label', v_lri || to_char(v_prev_to, 'YYYY') || v_pdi, 'note', null,
          'direction', case when v_median > v_prev_median then 'up'
                            when v_median < v_prev_median then 'down' else 'flat' end) end,
        'target', null)),
    'chart', jsonb_build_object(
      'type', 'bar', 'title', '15 הסטיות הגדולות ב-₪',
      -- 🪤 I1 · **`chart.unit` הוא שם-פורמט של C8, לא מחרוזת-תצוגה.**
      --    ‏`ChartCard.valueFormat` מחזיר `series[0].format ?? unit` ומזין את
      --    ‏`formatAxisTick`, ו-`HebrewTooltip` מזין את `formatByType` — שניהם מצפים
      --    ל-`money|percent|int|ratio|score|days|text|date`. מחרוזת-תצוגה היא **פורמט
      --    לא-מוכר** ⇒ הציר נופל לקיבוץ-אלפים חשוף והטולטיפ ל-`text`.
      --    הכיתוב העברי נשמר ב-`unit_label` (תוספתי; **אין לו קורא היום** — מדווח).
      -- הכותרת נוקבת *"15 הסטיות הגדולות ב-₪"* ⇒ הסדרה היא כסף.
      'series', jsonb_build_array(jsonb_build_object('key', 'deviation', 'label', 'סטיית-תקציב',
                                                    'format', 'money')),
      'data', v_chart, 'xKey', 'project_id', 'domain', null,
      'refLines', jsonb_build_array(jsonb_build_object('axis', 'y', 'value', 0, 'label', 'ללא סטייה')),
      'unit', 'money'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'project_id', 'label', 'פרויקט', 'format', 'int', 'align', 'start'),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'format', 'money', 'align', 'end'),
      jsonb_build_object('key', 'profit', 'label', 'רווח', 'format', 'money', 'align', 'end'),
      jsonb_build_object('key', 'planned_team_hours', 'label', 'שעות-צוות מתוכננות', 'format', 'ratio', 'align', 'end'),
      jsonb_build_object('key', 'actual_team_hours', 'label', 'שעות-צוות בפועל', 'format', 'ratio', 'align', 'end'),
      jsonb_build_object('key', 'deviation', 'label', 'סטייה ₪', 'format', 'money', 'align', 'end'),
      jsonb_build_object('key', 'deviation_pct', 'label', 'סטייה %', 'format', 'percent', 'align', 'end'),
      jsonb_build_object('key', 'feedback_score', 'label', 'ציון-משוב', 'format', 'int', 'align', 'end')),
    'rows', v_rows,
    -- why (F9): בלי הסף אין "חרגו" ואין "לא חרגו" — יש "לא נמדד". המשפט נשתק, והמסך מציג
    --           במקומו את הודעת הפרמטר החסר.
    'so_what', case when v_threshold is null then null
      when v_over > 0 and v_top_id is null then
        'חרגו ' || v_lri || v_over || v_pdi || ' פרויקטים ב-'
        || v_lri || to_char(round(v_over_sum), 'FM999,999,999') || ' ₪' || v_pdi
        || ', אך כולם מתחת לרצפת-המהותיות — אין פרויקט שדורש פתיחה השבוע.'
      when v_over > 0 then
        'לפתוח את פרויקט ' || v_lri || v_top_id || v_pdi || ' — ' || coalesce(v_top_name, '—')
        || ', החריגה הגדולה ביותר בתקופה: ' || v_lri || to_char(v_top_dev, 'FM999,999,999') || ' ₪' || v_pdi
        || ' (' || v_lri || to_char(v_top_pct, 'FM999,990.0') || '%' || v_pdi
        || ' מעל התכנון); בסך-הכול חרגו ' || v_lri || v_over || v_pdi || ' פרויקטים ב-'
        || v_lri || to_char(round(v_over_sum), 'FM999,999,999') || ' ₪' || v_pdi || ', מול '
        || v_lri || v_prev_over || v_pdi || ' ו-'
        || v_lri || to_char(round(v_prev_sum), 'FM999,999,999') || ' ₪' || v_pdi || ' אשתקד.'
      else 'אין פרויקטים שחרגו מהתקציב בתקופה שנבחרה.' end,
    'definitions', 'סטיית-תקציב = צד-העבודה בלבד, ב-₪ · עלות-עבודה מתוכננת = שעות-האירוע × Σ תעריפי '
      || 'המשובצות-סופית · "דלף" = חריגה כלפי-מעלה בלבד · שעות-צוות מתוכננות = משך-האירוע × מספר '
      || 'המשובצות-סופית, ולכן הן באותו קנה-מידה של שעות-הצוות בפועל · רווח = הרווח הסופי היכן שקפא, '
      || 'אחרת רווח גולמי מחושב.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(), 'missing_params', to_jsonb(v_missing),
      -- 📑ב: `coalesce(final_profit, gross_profit)` מערבב מדד קפוא ומדד חי ⇒ מונה-הקפואים חובה.
      'frozen_count', v_frozen,
      'notes', jsonb_build_array(
        v_lri || v_floor_n || v_pdi || ' פרויקטים · '
          || v_lri || to_char(round(v_floor_sum), 'FM999,999,999') || ' ₪' || v_pdi
          || ' מתחת לרצפת-המהותיות (פחות מ-' || v_lri || '4' || v_pdi || ' שעות מתוכננות או פחות מ-'
          || v_lri || '1,000' || ' ₪' || v_pdi || ' עלות-עבודה מתוכננת) — הם בתוך האוכלוסייה '
          || 'ומחוץ לדירוג בלבד.',
        'רווח: ' || v_lri || v_frozen || v_pdi || ' מתוך ' || v_lri || v_n || v_pdi
          || ' בתקופה נושאים רווח סופי קפוא; בשאר מוצג הרווח הגולמי המחושב.'),
      -- why (F8): המונה חי כאן, ולא ב-`population.excluded`, כי הוא **בתוך** n.
      'below_materiality', jsonb_build_object('count', v_floor_n, 'amount', round(v_floor_sum)),
      'threshold_pct', v_threshold,
      'export_blocked_reason', null,
      'run', null)
  );
end;
$function$;

comment on function public.report_m08_profitability(date, date, integer, jsonb) is
  'מודול 11 · רווחיות פרויקטים (מ8). אוכלוסייה: אירועים שהתקיימו ויצאה להם חשבונית — פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום, שתאריך האירוע שלהם בתקופה · הוצאו: פרויקטים פעילים ומבוטלים. פרויקטים מתחת לרצפת-המהותיות נמצאים בתוך האוכלוסייה ומחוץ לדירוג, ומונם יושב ב-meta.below_materiality. סטיית-התקציב נקראת מ-finance_project_money ואינה מחושבת כאן. קריאה בלבד, מגודר על מודול כספים.';

revoke execute on function public.report_m08_profitability(date, date, integer, jsonb) from public, anon, authenticated;
grant execute on function public.report_m08_profitability(date, date, integer, jsonb) to authenticated;

create or replace function public.report_m09_aging(
  p_from date default null,
  p_to date default null,
  p_customer_id integer default null,
  p_drill jsonb default null,
  p_asof date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_lri             constant text := chr(8294);
  v_pdi             constant text := chr(8297);
  v_today           date := (now() at time zone 'Asia/Jerusalem')::date;
  -- why (F1): תאריך-הייחוס היחיד של הדף. `p_from`/`p_to` נשארים בחתימה כי C8 נועל אותה,
  --           ומוחזרים ב-`meta` בלבד — הדף אינו סיכום-תקופה ואין לו חלון.
  v_asof            date;
  v_terms           integer;
  v_missing         text[] := array[]::text[];
  v_bucket          text := nullif(p_drill ->> 'bucket', '');
  v_cust            bigint := (p_drill ->> 'customer_id')::bigint;
  v_level           integer := 0;
  v_bucket_name     text;
  v_total_n         integer;
  v_total_sum       numeric;
  v_prev_n          integer;
  v_prev_sum        numeric;
  v_over60_n        integer;
  v_over60_sum      numeric;
  v_over60_cust     integer;
  v_prev_over60_n   integer;
  v_prev_over60_sum numeric;
  v_cur_n           integer;
  v_cur_sum         numeric;
  v_cur_prev        numeric;
  v_cur_prev_n      integer;
  v_p90_n           integer;
  v_p90_sum         numeric;
  v_p90_cust        integer;
  v_prev_p90_n      integer;
  v_prev_p90_sum    numeric;
  v_prev_lvl_n      integer;
  v_prev_lvl_sum    numeric;
  v_median_pay      numeric;
  v_paid_n          integer;
  v_oldest_days     integer;
  v_oldest_name     text;
  v_oldest_sent     date;
  v_written_n       integer;
  v_written_sum     numeric;
  v_buckets         jsonb;
  v_chart           jsonb;
  v_series          jsonb;
  v_rows            jsonb;
  v_columns         jsonb;
  v_tiles           jsonb;
  v_lvl_n           integer;
  v_lvl_sum         numeric;
  v_lvl_cust        integer;
  v_lvl_oldest      integer;
  v_top_name        text;
  v_top_sum         numeric;
  v_so_what         text;
  v_cust_name       text;
  v_cust_phrase     text;
  -- I1 · ⑧ 9.8 — מקרא-העמודות של המוקאפ כטקסט אחד, עם מספרים חיים מ-`v_buckets`.
  v_bkt             jsonb;
  v_chart_note      text;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  v_asof := coalesce(p_asof, v_today);

  select pa.param_value::integer into v_terms
    from public.params pa where pa.param_name = 'תנאי_תשלום_ימים';
  if v_terms is null then
    v_missing := array['תנאי_תשלום_ימים'];
  end if;

  if v_bucket is not null then v_level := 1; end if;
  if v_bucket is not null and v_cust is not null then v_level := 2; end if;
  -- ✏️ 07/09: שם-הרמה. הנוסח האחיד ('מדרג ' || label || ' יום') ייצר על "שוטף" את
  --    "מדרג שוטף יום" — עברית שבורה בפירורים, בכותרות ובשורת-"אז מה", בשלוש הרמות.
  -- why (F10): ‏`d90p` חוזר ל-'מדרג 90+ יום'. הוא היה הדלי היחיד שאיבד את ' יום', בעוד
  --            `agName` שבמוקאפ המאושר מייצר אותו כמו יתר המספריים.
  -- 🪤 I2 · **השמות האלה נבנים ב-SQL, ולכן `FORMATTERS.text` של הלשונית
  --    אינו מגיע אליהם.** נמדד בדפדפן (`m09-bidi-zoom.png`): `מדרג 90+` רונדר **`מדרג +90`**,
  --    ואותו היפוך תפס את הפירור, את אריח-רמה-1 ואת שם קובץ-הייצוא.
  -- 🔑 **כל טווח מבודד כיחידה אחת**, לעולם לא שני בידודים — אותו דפוס
  --    של `formatWindowLabel` (`reportsFormat.js`), שמבודד `from–to` כאחד.
  v_bucket_name := case v_bucket
                     when 'current' then 'שוטף'
                     when 'd1_30'  then 'מדרג ' || v_lri || '1–30' || v_pdi || ' יום'
                     when 'd31_60' then 'מדרג ' || v_lri || '31–60' || v_pdi || ' יום'
                     when 'd61_90' then 'מדרג ' || v_lri || '61–90' || v_pdi || ' יום'
                     when 'd90p'   then 'מדרג ' || v_lri || '90+' || v_pdi || ' יום'
                   end;
  if v_bucket is not null and v_bucket_name is null then
    -- ערך-רמה לא-מוכר בכתובת-הדף ⇒ חזרה לשורש, בלי מסך-שגיאה (הכרטיס ⑦).
    v_bucket := null; v_cust := null; v_level := 0;
  end if;

  with open_inv as (
    select p.project_id, p.customer_id, c.company_name, c.customer_type,
           (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date as sent_d,
           round(m.revenue) as amt,
           (select ct.contact_name from public.customer_contacts ct
             where ct.customer_id = p.customer_id and ct.is_primary order by ct.contact_id limit 1) as contact_name
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      left join public.customers c on c.customer_id = p.customer_id
      cross join lateral public.finance_project_money(p.project_id) m
     where p.invoice_sent = true
       and p.invoice_sent_at is not null
       and p.payment_date is null
       and coalesce(pf.written_off, false) = false
       and (p_customer_id is null or p.customer_id = p_customer_id)
  ), scored as (
    select o.*,
           o.sent_d + v_terms as due_d,
           -- why (F1): `v_asof`, לא `v_to`.
           case when v_terms is null then null else greatest(v_asof - (o.sent_d + v_terms), 0) end as dov
      from open_inv o
  ), tagged as (
    select s.*,
           case when s.dov is null then null
                when s.dov = 0 then 'current'
                when s.dov <= 30 then 'd1_30'
                when s.dov <= 60 then 'd31_60'
                when s.dov <= 90 then 'd61_90'
                else 'd90p' end as bucket_key
      from scored s
  )
  select (select count(*) from tagged),
         (select coalesce(sum(amt), 0) from tagged),
         (select count(*) from tagged where bucket_key in ('d61_90', 'd90p')),
         (select coalesce(sum(amt), 0) from tagged where bucket_key in ('d61_90', 'd90p')),
         (select count(distinct customer_id) from tagged where bucket_key in ('d61_90', 'd90p')),
         (select count(*) from tagged where bucket_key = 'current'),
         (select coalesce(sum(amt), 0) from tagged where bucket_key = 'current'),
         (select count(*) from tagged where bucket_key = 'd90p'),
         (select coalesce(sum(amt), 0) from tagged where bucket_key = 'd90p'),
         (select count(distinct customer_id) from tagged where bucket_key = 'd90p'),
         (select max(dov) from tagged),
         (select company_name from tagged order by dov desc nulls last limit 1),
         (select sent_d from tagged order by dov desc nulls last limit 1),
         (select company_name from tagged where bucket_key in ('d61_90', 'd90p') order by amt desc limit 1),
         (select amt from tagged where bucket_key in ('d61_90', 'd90p') order by amt desc limit 1),
         -- חמשת הדליים בסדר-הדליים הטבעי (📐7 — לא לפי ערך). התוויות כאן חייבות להישאר
         -- זהות ל-`AGING_BUCKETS` ב-`src/lib/reportsFinance.js` — בדיקת-היחידה משווה ביניהן.
         (select jsonb_agg(jsonb_build_object('key', b.k, 'label', b.l, 'n', t.n, 'amount', t.s) order by b.o)
            from (values ('current', 'שוטף', 1), ('d1_30', '1–30', 2), ('d31_60', '31–60', 3),
                         ('d61_90', '61–90', 4), ('d90p', '90+', 5)) as b(k, l, o)
            cross join lateral (select count(*) as n, coalesce(sum(amt), 0) as s
                                  from tagged where bucket_key = b.k) t),
         -- הגרף: ארבעת דליי-האיחור בלבד, מוערמים לפי סוג-לקוח. "שוטף" **אינו** עמודה כאן.
         -- הערימה נפרשת כמפתחות ברמת-השורה (ולא כאובייקט מקונן), כי כך Recharts קורא סדרות.
         (select coalesce(jsonb_agg(
                   jsonb_build_object('bucket', b.l, 'bucket_key', b.k,
                     'total', coalesce(t.s, 0), 'n', coalesce(t.n, 0))
                   || coalesce(t.types, '{}'::jsonb) order by b.o), '[]'::jsonb)
            from (values ('d1_30', '1–30', 2), ('d31_60', '31–60', 3),
                         ('d61_90', '61–90', 4), ('d90p', '90+', 5)) as b(k, l, o)
            left join lateral (
              -- 🔴 ‏`n` ו-`total` נספרים על **החשבוניות**, לא על שכבות-הערימה. תת-שאילתה
              --    מקובצת-לפי-סוג מחזירה שורה לסוג ⇒ `count(*)` עליה היה מחזיר 3 במקום 13.
              select (select count(*) from tagged where bucket_key = b.k) as n,
                     (select coalesce(sum(amt), 0) from tagged where bucket_key = b.k) as s,
                     (select jsonb_object_agg(coalesce(customer_type, 'unclassified'), by_type)
                        from (select customer_type, sum(amt) as by_type
                                from tagged where bucket_key = b.k group by customer_type) g) as types
              ) t on true),
         -- הסדרות = סוגי-הלקוח שקיימים בפועל בדליי-האיחור (📐19: גוון אחד = משמעות אחת).
         -- 🔴 **המפתח הוא ערך-ה-enum, והתווית העברית אינה נכתבת כאן.** ‏`CUSTOMER_TYPE_LABELS`
         --    (`src/lib/customers.js`) הוא מקור-האמת היחיד לתוויות-סוג-הלקוח ⇒ `chart.label_source`
         --    אומר למסך דרך מה לפענח, כדי שלא ידפיס `private_company`.
         -- 🪤 I1 · `format` על כל שכבת-ערימה — כולן ₪. בלעדיו הטולטיפ קורא
         --    `formatByType(value, '₪')` ⇒ נופל ל-`text` ומדפיס מספר גולמי.
         (select coalesce(jsonb_agg(jsonb_build_object('key', ct, 'label', ct, 'format', 'money') order by ct), '[]'::jsonb)
            from (select distinct coalesce(customer_type, 'unclassified') as ct
                    from tagged where bucket_key is not null and bucket_key <> 'current') d),
         case
           when v_level = 0 then
             (select coalesce(jsonb_agg(jsonb_build_object(
                'project_id', project_id, 'customer_name', company_name, 'owner', contact_name,
                'sent_date', sent_d, 'due_date', due_d, 'amount', amt,
                'days_overdue', dov,
                -- 🪤 I2 · **התא נשא את קוד-הדלי (`d90p`), ו-`textLtr` רק מבודד —
                --    הוא אינו מתרגם.** הערך הופך לתווית שהגרף כבר מדפיס (אותה רשימת
                --    `b(k, l, o)` למעלה), והקוד עובר לשדה נפרד `bucket_key` — כך
                --    הקידוח והצלבת-המסנן ממשיכים להצטלב על אותו מפתח (המעטפת
                --    קוראת `drill_key ?? '<xKey>_key'`). **שום מפתח לא נמחק.**
                'bucket', case bucket_key
                            when 'current' then 'שוטף'
                            when 'd1_30'   then '1–30'
                            when 'd31_60'  then '31–60'
                            when 'd61_90'  then '61–90'
                            when 'd90p'    then '90+' end,
                'bucket_key', bucket_key,
                -- why (F7): שורת-שורש פותחת כרטיס-פרויקט ⇒ `kind: project`.
                'drill_key', jsonb_build_object('kind', 'project', 'id', project_id)
              ) order by dov desc nulls last, amt desc), '[]'::jsonb) from tagged)
           when v_level = 1 then
             (select coalesce(jsonb_agg(g.t order by (g.t ->> 'amount')::numeric desc), '[]'::jsonb)
                from (select jsonb_build_object(
                        'customer_id', customer_id, 'customer_name', company_name,
                        'owner', max(contact_name), 'invoices', count(*),
                        'amount', sum(amt), 'days_overdue', max(dov),
                        -- why (F7): שורת-רמה-1 יורדת רמה ⇒ `kind: customer`, ושדותיה הם
                        --           בדיוק ה-`p_drill` של הרמה הבאה.
                        'drill_key', jsonb_build_object('kind', 'customer',
                          'bucket', v_bucket, 'customer_id', customer_id)) as t
                        from tagged where bucket_key = v_bucket
                       group by customer_id, company_name) g)
           else
             (select coalesce(jsonb_agg(jsonb_build_object(
                'project_id', project_id, 'customer_name', company_name, 'owner', contact_name,
                'sent_date', sent_d, 'due_date', due_d, 'amount', amt, 'days_overdue', dov,
                'drill_key', jsonb_build_object('kind', 'project', 'id', project_id)
              ) order by dov desc nulls last), '[]'::jsonb)
                from tagged where bucket_key = v_bucket and customer_id = v_cust)
         end,
         (select count(*) from tagged where v_level > 0 and bucket_key = v_bucket
            and (v_level = 1 or customer_id = v_cust)),
         (select coalesce(sum(amt), 0) from tagged where v_level > 0 and bucket_key = v_bucket
            and (v_level = 1 or customer_id = v_cust)),
         -- 🔴 why (F4): הסייג `(v_level = 1 or customer_id = v_cust)` היה חסר **כאן בלבד**,
         --    מתוך ארבעת הביטויים שיורדים עם הרמה. התוצאה שנמדדה חי: ברמה 2 המסך הראה
         --    חשבונית אחת של לקוח אחד ושורת-"אז מה" אמרה "אצל 3 לקוחות".
         (select count(distinct customer_id) from tagged where v_level > 0 and bucket_key = v_bucket
            and (v_level = 1 or customer_id = v_cust)),
         (select max(dov) from tagged where v_level > 0 and bucket_key = v_bucket
            and (v_level = 1 or customer_id = v_cust)),
         (select company_name from tagged where v_level = 2 and customer_id = v_cust limit 1)
    into v_total_n, v_total_sum, v_over60_n, v_over60_sum, v_over60_cust,
         v_cur_n, v_cur_sum, v_p90_n, v_p90_sum, v_p90_cust,
         v_oldest_days, v_oldest_name, v_oldest_sent, v_top_name, v_top_sum,
         v_buckets, v_chart, v_series, v_rows,
         v_lvl_n, v_lvl_sum, v_lvl_cust, v_lvl_oldest, v_cust_name;

  -- ── I1 · הערת-הגרף (⑧ 9.8) ──────────────────────────────
  -- 🪤 **למה היא קיימת:** ביקורת-ישי §👤 6 — *"הסתכלתי עליו חמש דקות ולא הבנתי"*.
  --    המוקאפ המאושר ענה בשלושה דברים (כותרת-משנה · שורת-פירוש לכל דלי ·
  --    מקרא-עמודות `.barkey`), ואף אחד מהם לא היה במטען. ‏`chart.note` הוא המפתח
  --    שהמעטפת מרנדרת מתחת לכותרת-הגרף (`ChartCard.jsx`, תוספת C8 16/09).
  -- 🔑 **המספרים נגזרים מ-`v_buckets` ולא מהמוקאפ** — המוקאפ צויר על צילום 10/09
  --    והוא כבר לא הנתון. מפריד-אלפים ובידוד LRI…PDI כמו בכל משפט-שרת אחר בקובץ.
  select jsonb_object_agg(x.value ->> 'key', jsonb_build_object(
           'amt', v_lri || to_char(round(coalesce((x.value ->> 'amount')::numeric, 0)), 'FM999,999,999')
                  || ' ₪' || v_pdi,
           'cnt', v_lri || coalesce(x.value ->> 'n', '0') || v_pdi))
    into v_bkt
    from jsonb_array_elements(coalesce(v_buckets, '[]'::jsonb)) x;

  v_chart_note :=
    'השאלה שהעמודות עונות עליה: כמה כסף שכבר איחר יש לנו, וכמה זמן הוא כבר מחכה? '
    || 'כל עמודה היא דלי של איחור — כמה ימים עברו מאז שהחשבונית הייתה אמורה להשתלם — '
    || 'והצבעים שבתוכה מפצלים את אותו סכום לפי סוג-הלקוח. '
    || v_lri || '1–30' || v_pdi || ' — עבר מועד התשלום, ומחכה עד חודש; תזכורת רגילה: '
    || coalesce(v_bkt -> 'd1_30' ->> 'amt', '—') || ' ב-'
    || coalesce(v_bkt -> 'd1_30' ->> 'cnt', '—') || ' חשבוניות. '
    || v_lri || '31–60' || v_pdi || ' — מחכה בין חודש לחודשיים; כאן מתחילים להתקשר: '
    || coalesce(v_bkt -> 'd31_60' ->> 'amt', '—') || ' ב-'
    || coalesce(v_bkt -> 'd31_60' ->> 'cnt', '—') || ' חשבוניות. '
    || v_lri || '61–90' || v_pdi || ' — מחכה בין חודשיים לשלושה; דורש טיפול אישי: '
    || coalesce(v_bkt -> 'd61_90' ->> 'amt', '—') || ' ב-'
    || coalesce(v_bkt -> 'd61_90' ->> 'cnt', '—') || ' חשבוניות. '
    || v_lri || '90+' || v_pdi || ' — מחכה מעל שלושה חודשים, והסיכון שלא ייגבה הוא הגבוה ביותר: '
    || coalesce(v_bkt -> 'd90p' ->> 'amt', '—') || ' ב-'
    || coalesce(v_bkt -> 'd90p' ->> 'cnt', '—') || ' חשבוניות. '
    || 'שוטף — עוד לא הגיע מועד התשלום; הכסף לא מאחר, פשוט טרם הגיע תורו, ולכן הוא אינו '
    || 'בגרף אלא באריח שלצידו: ' || coalesce(v_bkt -> 'current' ->> 'amt', '—') || ' ב-'
    || coalesce(v_bkt -> 'current' ->> 'cnt', '—') || ' חשבוניות. '
    || 'גובה העמודה = הסכום שממתין באותו דלי; המספר שמתחת לשם הדלי = כמה חשבוניות.';

  -- ── צילום-הרגע של לפני חודש, **מדורג לדליים** (📐1) ───────────────────────────
  -- why (F3): חמישה אריחים חזרו `compare: null` אף שהמוקאפ המאושר מצייר לכל אחד חצי-השוואה,
  --           וכל החמישה מדידים באותה הגדרה בדיוק, חודש אחורה. ‏📐1: *"'—' מותר רק כשאין
  --           שינוי, לא כשלא נמדד."* הצילום מחושב פעם אחת ומשרת את כל חמשת האריחים.
  with prev_open as (
    select p.customer_id,
           (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date as sent_d,
           round(m.revenue) as amt
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      cross join lateral public.finance_project_money(p.project_id) m
     where p.invoice_sent = true and p.invoice_sent_at is not null
       and coalesce(pf.written_off, false) = false
       and (p_customer_id is null or p.customer_id = p_customer_id)
       and (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date <= v_asof - 30
       and (p.payment_date is null or p.payment_date > v_asof - 30)
  ), prev_tagged as (
    select o.*,
           case when v_terms is null then null
                else greatest((v_asof - 30) - (o.sent_d + v_terms), 0) end as dov
      from prev_open o
  ), prev_b as (
    select t.*,
           case when t.dov is null then null
                when t.dov = 0 then 'current'
                when t.dov <= 30 then 'd1_30'
                when t.dov <= 60 then 'd31_60'
                when t.dov <= 90 then 'd61_90'
                else 'd90p' end as bucket_key
      from prev_tagged t
  )
  select (select count(*) from prev_b),
         (select coalesce(sum(amt), 0) from prev_b),
         (select count(*) from prev_b where bucket_key = 'current'),
         (select coalesce(sum(amt), 0) from prev_b where bucket_key = 'current'),
         (select count(*) from prev_b where bucket_key in ('d61_90', 'd90p')),
         (select coalesce(sum(amt), 0) from prev_b where bucket_key in ('d61_90', 'd90p')),
         (select count(*) from prev_b where bucket_key = 'd90p'),
         (select coalesce(sum(amt), 0) from prev_b where bucket_key = 'd90p'),
         (select count(*) from prev_b where v_level > 0 and bucket_key = v_bucket),
         (select coalesce(sum(amt), 0) from prev_b where v_level > 0 and bucket_key = v_bucket)
    into v_prev_n, v_prev_sum, v_cur_prev_n, v_cur_prev,
         v_prev_over60_n, v_prev_over60_sum, v_prev_p90_n, v_prev_p90_sum,
         v_prev_lvl_n, v_prev_lvl_sum;

  -- "ימים לתשלום (חציון)" — **אינו DSO**, ואינו מגיב למסנן-התקופה (📐3 · ח8-6).
  select count(*)::integer,
         percentile_cont(0.5) within group (order by (p.payment_date - (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date))
    into v_paid_n, v_median_pay
    from public.projects p
   where p.invoice_sent = true and p.invoice_sent_at is not null and p.payment_date is not null
     and (p_customer_id is null or p.customer_id = p_customer_id);

  select count(*)::integer, coalesce(sum(round(m.revenue)), 0)
    into v_written_n, v_written_sum
    from public.projects p
    join public.project_finance pf on pf.project_id = p.project_id
    cross join lateral public.finance_project_money(p.project_id) m
   where p.invoice_sent = true and p.payment_date is null and pf.written_off
     and (p_customer_id is null or p.customer_id = p_customer_id);

  -- ── האריחים, שורת-"אז מה" והעמודות — יורדים עם הרמה (📐13 ②) ────────────────
  if v_level = 0 then
    v_tiles := jsonb_build_array(
      jsonb_build_object('key', 'open_debt', 'label', 'יתרת-חוב פתוחה', 'value', v_total_sum,
        'format', 'money', 'count', v_total_n,
        'sub', v_lri || v_total_n || v_pdi
               || case when v_total_n = 1 then ' חשבונית פתוחה' else ' חשבוניות פתוחות' end,
        'window', 'נכון להיום · אינו מושפע ממסנן התקופה',
        'compare', jsonb_build_object('value', v_prev_sum, 'count', v_prev_n, 'label', 'לפני חודש',
          'note', null,
          'direction', case when v_total_sum > v_prev_sum then 'up'
                            when v_total_sum < v_prev_sum then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object('key', 'over_60', 'label', 'מעל 60 יום', 'value', v_over60_sum,
        'format', 'money', 'count', v_over60_n, 'customers', v_over60_cust,
        'sub', v_lri || v_over60_n || v_pdi
               || case when v_over60_n = 1 then ' חשבונית אצל ' else ' חשבוניות אצל ' end
               || case when v_over60_cust = 1 then 'לקוח אחד'
                       else v_lri || v_over60_cust || v_pdi || ' לקוחות' end,
        'window', 'נכון להיום',
        'compare', case when v_terms is null then null else jsonb_build_object(
          'value', v_prev_over60_sum, 'count', v_prev_over60_n, 'label', 'לפני חודש', 'note', null,
          'direction', case when v_over60_sum > v_prev_over60_sum then 'up'
                            when v_over60_sum < v_prev_over60_sum then 'down' else 'flat' end) end,
        -- 🪤 I2 · **הדלת נחתה על מספר אחר מזה שעל האריח.** "מעל 60 יום" הוא
        --    צביר של שני מדרגים (`OVER_SIXTY_KEYS`, `reportsFinance.js`), ואוצר-הקידוח
        --    של הפונקציה הוא חמישה מפתחות יחידים בלבד ⇒ **אין קידוח שיכול לשאת אותו**.
        --    האריח שלידו ("מדרג 90+") פותח את הקידוח היחיד שקיים ⇒ `null` כאן.
        'target', null),
      jsonb_build_object('key', 'bucket_90p', 'label', 'מדרג ' || v_lri || '90+' || v_pdi, 'value', v_p90_sum,
        'format', 'money', 'count', v_p90_n, 'customers', v_p90_cust,
        'sub', v_lri || v_p90_n || v_pdi
               || case when v_p90_n = 1 then ' חשבונית אצל ' else ' חשבוניות אצל ' end
               || case when v_p90_cust = 1 then 'לקוח אחד'
                       else v_lri || v_p90_cust || v_pdi || ' לקוחות' end,
        'window', 'נכון להיום',
        'compare', case when v_terms is null then null else jsonb_build_object(
          'value', v_prev_p90_sum, 'count', v_prev_p90_n, 'label', 'לפני חודש', 'note', null,
          'direction', case when v_p90_sum > v_prev_p90_sum then 'up'
                            when v_p90_sum < v_prev_p90_sum then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'כספים', 'report', 'report_m09_aging',
          'drill', jsonb_build_object('bucket', 'd90p'))),
      jsonb_build_object('key', 'median_days_to_pay', 'label', 'ימים לתשלום (חציון)',
        'value', v_median_pay, 'format', 'days', 'count', v_paid_n,
        'sub', 'על ' || v_lri || v_paid_n || v_pdi || ' חשבוניות ששולמו, כל הזמנים · אינו '
               || v_lri || 'DSO' || v_pdi,
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה', 'compare', null, 'target', null));
    v_columns := jsonb_build_array(
      jsonb_build_object('key', 'project_id', 'label', 'פרויקט', 'format', 'int', 'align', 'start'),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start'),
      -- 🪤 I2 · 📐18 מחייב **בעל-שם על השורה**, ו-`owner` כבר נבנה בכל שלוש
      --    הרמות — הוא פשוט לא הוצהר כעמודה, ו-`ReportTable` מרנדר רק
      --    עמודות מוצהרות. **נמדד: 100% מהשורות נושאות `owner`**, ולכן
      --    הנחת-ההימנעות של ✒️9.6 בכרטיס שגויה — הכרעה (2).
      jsonb_build_object('key', 'owner', 'label', 'איש קשר', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'sent_date', 'label', 'נשלחה', 'format', 'date', 'align', 'start'),
      jsonb_build_object('key', 'due_date', 'label', 'מועד-פירעון חוזי', 'format', 'date', 'align', 'start'),
      jsonb_build_object('key', 'amount', 'label', 'סכום', 'format', 'money', 'align', 'end'),
      jsonb_build_object('key', 'days_overdue', 'label', 'ימי איחור', 'format', 'days', 'align', 'end'),
      -- 🪤 I2 · עמודה שערכיה הם טווחי-ספרות ('1–30' … '90+'), והקוד עצמו עבר
      --    לשדה `bucket_key` (ר' ההערה בבניית-השורה) — `textLtr` מבודד ואינו מתרגם.
      --    הבידוד הופך את התא ליחידת-LTR אחת ומנקה את תווי-הבקרה בייצוא.
      --    ✅ נמדד 16/09: הפורמט כבר נחת במעטפת — `reportsFormat.js:133` ו-`ReportTable.jsx:35`.
      jsonb_build_object('key', 'bucket', 'label', 'מדרג', 'format', 'textLtr', 'align', 'start'));
    -- why (F9): בלי `תנאי_תשלום_ימים` אין דליים בכלל, ו-"אין חוב מעל 60 יום" הוא הצהרה
    --           על מדידה שלא בוצעה. ⇒ המשפט נשתק, והמסך מציג את הודעת הפרמטר החסר.
    v_so_what := case when v_terms is null then null
      when v_over60_n > 0 then
        'לגבות ' || v_lri || to_char(round(v_over60_sum), 'FM999,999,999') || ' ₪' || v_pdi || ' '
        || case when v_over60_cust = 1 then 'מלקוח אחד'
                else 'מ-' || v_lri || v_over60_cust || v_pdi || ' לקוחות' end
        || ' — הכסף שממתין מעל ' || v_lri || '60' || v_pdi || ' יום; הגדול שבהם '
        || coalesce(v_top_name, '—') || ', '
        || v_lri || to_char(round(coalesce(v_top_sum, 0)), 'FM999,999,999') || ' ₪' || v_pdi || '.'
      else 'אין חוב מעל ' || v_lri || '60' || v_pdi
        || ' יום — כל החוב הפתוח בתוך התנאים או באיחור קצר.' end;
  else
    -- why (F10): ברמה 2 התווית הייתה זהה לרמה 1 ("חוב במדרג 90+"). המוקאפ המאושר בונה
    --            ברמה 2 מחרוזת אחרת — 'חוב הלקוח ' + agIn(bk) — והיא מה שמבדיל את המסכים.
    v_cust_phrase := case when v_lvl_cust = 1 then 'מלקוח אחד'
                          else 'מ-' || v_lri || v_lvl_cust || v_pdi || ' לקוחות' end;
    v_tiles := jsonb_build_array(
      jsonb_build_object('key', 'bucket_amount',
        'label', case when v_level = 2 then 'חוב הלקוח ב' || v_bucket_name
                      else 'חוב ב' || v_bucket_name end,
        'value', v_lvl_sum, 'format', 'money', 'count', v_lvl_n, 'customers', v_lvl_cust,
        'sub', v_lri || v_lvl_n || v_pdi
               || case when v_lvl_n = 1 then ' חשבונית · ' else ' חשבוניות · ' end
               || case when v_level = 2 then coalesce(v_cust_name, '—')
                       when v_lvl_cust = 1 then 'לקוח אחד'
                       else v_lri || v_lvl_cust || v_pdi || ' לקוחות' end,
        'window', 'נכון להיום · אינו מושפע ממסנן התקופה',
        -- why (F3): ברמה 1 יש תקופה-קודמת מדידה (אותו דלי, חודש אחורה). ברמה 2 אין —
        --           והמוקאפ אומר זאת במפורש ("אין תקופה-קודמת ברמת-לקוח").
        'compare', case when v_level = 1 and v_terms is not null then jsonb_build_object(
          'value', v_prev_lvl_sum, 'count', v_prev_lvl_n, 'label', 'לפני חודש במדרג זה', 'note', null,
          'direction', case when v_lvl_sum > v_prev_lvl_sum then 'up'
                            when v_lvl_sum < v_prev_lvl_sum then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'share_of_open', 'label', 'חלק מסך-החוב הפתוח',
        'value', round(100.0 * v_lvl_sum / nullif(v_total_sum, 0), 1), 'format', 'percent',
        'sub', v_lri || to_char(round(v_lvl_sum), 'FM999,999,999') || ' ₪' || v_pdi || ' מתוך '
               || v_lri || to_char(round(v_total_sum), 'FM999,999,999') || ' ₪' || v_pdi,
        'window', 'נכון להיום',
        'compare', case when v_level = 1 and v_terms is not null and coalesce(v_prev_sum, 0) > 0
          then jsonb_build_object(
            'value', round(100.0 * v_prev_lvl_sum / nullif(v_prev_sum, 0), 1), 'label', 'לפני חודש',
            'note', v_lri || to_char(round(v_prev_lvl_sum), 'FM999,999,999') || ' ₪' || v_pdi || ' מתוך '
                    || v_lri || to_char(round(v_prev_sum), 'FM999,999,999') || ' ₪' || v_pdi,
            'direction', case
              when round(100.0 * v_lvl_sum / nullif(v_total_sum, 0), 1)
                 > round(100.0 * v_prev_lvl_sum / nullif(v_prev_sum, 0), 1) then 'up'
              when round(100.0 * v_lvl_sum / nullif(v_total_sum, 0), 1)
                 < round(100.0 * v_prev_lvl_sum / nullif(v_prev_sum, 0), 1) then 'down'
              else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'oldest_invoice', 'label', 'החשבונית הישנה ביותר',
        'value', v_lvl_oldest, 'format', 'days',
        'sub', 'ימים מעבר למועד-הפירעון החוזי',
        'window', 'נכון להיום', 'compare', null, 'target', null),
      jsonb_build_object('key', 'median_days_to_pay', 'label', 'ימים לתשלום (חציון)',
        'value', v_median_pay, 'format', 'days', 'count', v_paid_n,
        'sub', 'על ' || v_lri || v_paid_n || v_pdi || ' חשבוניות ששולמו, כל הזמנים · אינו '
               || v_lri || 'DSO' || v_pdi,
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה', 'compare', null, 'target', null));
    v_columns := case when v_level = 1 then jsonb_build_array(
        jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start'),
        -- 🪤 I2 · 📐18, רמה 1 (ר' ההערה ברמה 0).
        jsonb_build_object('key', 'owner', 'label', 'איש קשר', 'format', 'text', 'align', 'start'),
        jsonb_build_object('key', 'invoices', 'label', 'חשבוניות', 'format', 'int', 'align', 'end'),
        jsonb_build_object('key', 'amount', 'label', 'סכום', 'format', 'money', 'align', 'end'),
        jsonb_build_object('key', 'days_overdue', 'label', 'ימי איחור (הוותיקה)', 'format', 'days', 'align', 'end'))
      else jsonb_build_array(
        jsonb_build_object('key', 'project_id', 'label', 'פרויקט', 'format', 'int', 'align', 'start'),
        -- 🪤 I2 · 📐18, רמה 2 (ר' ההערה ברמה 0).
        jsonb_build_object('key', 'owner', 'label', 'איש קשר', 'format', 'text', 'align', 'start'),
        jsonb_build_object('key', 'sent_date', 'label', 'נשלחה', 'format', 'date', 'align', 'start'),
        jsonb_build_object('key', 'due_date', 'label', 'מועד-פירעון חוזי', 'format', 'date', 'align', 'start'),
        jsonb_build_object('key', 'amount', 'label', 'סכום', 'format', 'money', 'align', 'end'),
        jsonb_build_object('key', 'days_overdue', 'label', 'ימי איחור', 'format', 'days', 'align', 'end'))
      end;
    -- why (F4 · F5): התאמת-מספר בעברית ומפרידי-אלפים. הנוסח הקודם ייצר "1 חשבוניות אצל
    --                3 לקוחות" על מסך שהראה חשבונית אחת של לקוח אחד.
    v_so_what := case when v_terms is null then null else
        'לגבות ' || v_lri || to_char(round(v_lvl_sum), 'FM999,999,999') || ' ₪' || v_pdi || ' '
        || case when v_level = 2 then 'מהלקוח ' || coalesce(v_cust_name, '—') else v_cust_phrase end
        || ' ב' || v_bucket_name || ' — ' || v_lri || v_lvl_n || v_pdi
        || case when v_lvl_n = 1 then ' חשבונית, שממתינה' else ' חשבוניות, והוותיקה ממתינה' end
        || ' כבר ' || v_lri || coalesce(v_lvl_oldest, 0) || v_pdi
        || case when coalesce(v_lvl_oldest, 0) = 1 then ' יום' else ' ימים' end || '.' end;
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_total_n,
      'label', 'אוכלוסייה: חשבוניות שנשלחו, טרם שולמו ולא נמחקו כחוב-אבוד · הוצאו: חוב אבוד ('
               || v_lri || v_written_n || v_pdi || ') ופרויקטים שטרם חויבו · '
               || v_lri || 'n=' || v_total_n || v_pdi
               || ' · נכון להיום — זהו צילום-רגע ולא סיכום-תקופה, ואינו מושפע ממסנן התקופה. '
               -- 🪤 J1 · **שני שמות למושג אחד על מסך אחד:** 'מדרג' (אריחים · כותרת-הגרף ·
               --    פירורי-הקידוח · שם-קובץ-הייצוא) מול 'דליי-האיחור' כאן. 'מדרג' הוא
               --    המונח הנעול של `spec.md §1.4` (*"מדרג 90+" · "חוב במדרג 61–90"*),
               --    ולכן הוא זה שנשאר.
               || 'ולגרף שלמטה אוכלוסייה צרה יותר: הוא מציג חוב באיחור בלבד — ארבעת מדרגי-האיחור, '
               || v_lri || (v_total_n - v_cur_n) || v_pdi || ' חשבוניות. "שוטף" ('
               || v_lri || v_cur_n || v_pdi || ' חשבוניות · '
               || v_lri || to_char(round(v_cur_sum), 'FM999,999,999') || ' ₪' || v_pdi
               || ') הוצא מהגרף לאריח שלצידו, כי טרם הגיע מועד תשלומן — הן אינן חוב באיחור. '
               || 'האריחים והטבלה ממשיכים לכסות את כל ' || v_lri || v_total_n || v_pdi || '.',
      'excluded', jsonb_build_object('חוב אבוד', v_written_n)),
    -- why (F10): ‏`from`/`to` ריקים. לשונית שבונה כותרת-משנה של תקופה מ-`window` הייתה
    --            מדפיסה על הדף הזה טווח שהוא עצמו מצהיר שהוא מתעלם ממנו.
    'window', jsonb_build_object('from', null, 'to', null, 'label', 'נכון להיום'),
    'tiles', v_tiles,
    'chart', jsonb_build_object(
      'type', 'stackedBar', 'title', 'חוב באיחור לפי מדרג-גיול וסוג-לקוח',
      -- ⑧ 9.8 · מקרא-העמודות, כמפתח שהמעטפת כבר יודעת לרנדר.
      'note', v_chart_note,
      'series', coalesce(v_series, '[]'::jsonb), 'data', coalesce(v_chart, '[]'::jsonb),
      -- 🪤 I1 · **`chart.unit` הוא שם-פורמט של C8, לא מחרוזת-תצוגה.**
      --    ‏`ChartCard.valueFormat` מחזיר `series[0].format ?? unit` ומזין את
      --    ‏`formatAxisTick`, ו-`HebrewTooltip` מזין את `formatByType` — שניהם מצפים
      --    ל-`money|percent|int|ratio|score|days|text|date`. מחרוזת-תצוגה היא **פורמט
      --    לא-מוכר** ⇒ הציר נופל לקיבוץ-אלפים חשוף והטולטיפ ל-`text`.
      --    הכיתוב העברי נשמר ב-`unit_label` (תוספתי; **אין לו קורא היום** — מדווח).
      'xKey', 'bucket', 'domain', null, 'refLines', '[]'::jsonb, 'unit', 'money',
      -- מפתחות-הסדרה הם ערכי-ה-enum; התווית העברית מגיעה מהקוד ולא מהמסד (ר' ההערה בגוף).
      'label_source', 'CUSTOMER_TYPE_LABELS'),
    'columns', v_columns,
    'rows', coalesce(v_rows, '[]'::jsonb),
    'so_what', v_so_what,
    'definitions', 'מדרג-גיול נמדד מול מועד-הפירעון (יום השליחה + '
      || v_lri || coalesce(v_terms::text, '—') || v_pdi
      || ' ימי תנאי-תשלום), לא מול יום השליחה, ונכון להיום · "שוטף" = טרם הגיע מועד-הפירעון, '
      || 'לא "שולם" · "ימים לתשלום (חציון)" = חציון (תאריך-תשלום − תאריך-חשבונית) על חשבוניות '
      || 'ששולמו, כל הזמנים, ואינו DSO · "חוב אבוד" מוחרג לגמרי מהיתרה ומכל המדרגים.',
    'drill', jsonb_build_object(
      'level', v_level,
      'levels', jsonb_build_array('מדרג', 'לקוח', 'חשבונית'),
      'crumbs', case v_level
        when 0 then jsonb_build_array(jsonb_build_object('label', 'גיול חובות', 'drill', null))
        when 1 then jsonb_build_array(jsonb_build_object('label', 'גיול חובות', 'drill', null),
                                      jsonb_build_object('label', v_bucket_name, 'drill', p_drill))
        else jsonb_build_array(jsonb_build_object('label', 'גיול חובות', 'drill', null),
                               jsonb_build_object('label', v_bucket_name,
                                 'drill', jsonb_build_object('bucket', v_bucket)),
                               jsonb_build_object('label', coalesce(v_cust_name, '—'), 'drill', p_drill))
        end,
      'buckets', coalesce(v_buckets, '[]'::jsonb),
      'echo', p_drill),
    'meta', jsonb_build_object(
      'measured_at', now(), 'missing_params', to_jsonb(v_missing), 'frozen_count', null,
      'notes', jsonb_build_array(
        'חובות אבודים: ' || v_lri || v_written_n || v_pdi
          || case when v_written_n = 1 then ' חשבונית · ' else ' חשבוניות · ' end
          || v_lri || to_char(round(v_written_sum), 'FM999,999,999') || ' ₪' || v_pdi
          || ' — מוחרגים מהיתרה ומכל המדרגים.',
        'החשבונית הישנה ביותר: ' || v_lri || coalesce(v_oldest_days, 0) || v_pdi || ' ימי איחור · '
          || coalesce(v_oldest_name, '—') || ' · נשלחה '
          || v_lri || coalesce(to_char(v_oldest_sent, 'DD/MM/YYYY'), '—') || v_pdi || '.',
        'כל מספרי הדף הם צילום-רגע נכון להיום; מסנן-התקופה אינו מזיז אותם.'),
      -- 📑ב#6: מדרג עם 0 שורות **אינו לחיץ**; המסך זקוק ל-`n` פר-דלי כדי לדעת זאת.
      'current_tile', jsonb_build_object('label', 'שוטף — עוד לא באיחור', 'value', v_cur_sum,
        'count', v_cur_n, 'compare_value', v_cur_prev, 'compare_count', v_cur_prev_n,
        'drill', jsonb_build_object('bucket', 'current')),
      'overdue_only', jsonb_build_object('n', v_total_n - v_cur_n, 'amount', v_total_sum - v_cur_sum),
      'previous_snapshot', jsonb_build_object('asof', v_asof - 30, 'n', v_prev_n, 'amount', v_prev_sum),
      'asof', v_asof,
      -- `p_from`/`p_to` מוחזרים כאן ולא ב-`window`, כדי שיהיה גלוי שהתקבלו ולא שימשו.
      'period_filter_ignored', jsonb_build_object('p_from', p_from, 'p_to', p_to),
      'export_blocked_reason', null,
      'run', null)
  );
end;
$function$;

comment on function public.report_m09_aging(date, date, integer, jsonb, date) is
  'מודול 11 · גיול חובות (מ9), דוח-דריל. אוכלוסייה: חשבוניות שנשלחו, טרם שולמו ולא נמחקו כחוב-אבוד · הוצאו: חוב אבוד ופרויקטים שטרם חויבו. צילום-רגע נכון להיום: p_from/p_to מתקבלים ואינם משפיעים (הם מוחזרים ב-meta.period_filter_ignored), ו-p_asof קיים לשחזור האורקל בלבד — הלקוח אינו שולח אותו. ימי-איחור נמדדים מול מועד-הפירעון (invoice_sent_at + תנאי_תשלום_ימים) ולא מול יום השליחה, ושלילי נקטע לאפס = שוטף. קריאה בלבד, מגודר על מודול כספים.';

revoke execute on function public.report_m09_aging(date, date, integer, jsonb, date) from public, anon, authenticated;
grant execute on function public.report_m09_aging(date, date, integer, jsonb, date) to authenticated;

create or replace function public.report_m14_hostess_overview(
  p_from        date    default null,
  p_to          date    default null,
  p_customer_id integer default null,
  p_drill       jsonb   default null
) returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  -- שעון-ישראל ולא UTC: אחרי חצות `current_date` עדיין "אתמול" — המוקש שנמדד 26/08/2026.
  v_today       date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to          date;
  v_from        date;
  v_prev_to     date;
  v_prev_from   date;
  v_missing     text[] := array[]::text[];
  v_notes       jsonb  := '[]'::jsonb;
  v_m           numeric;
  v_min_sample  numeric;
  v_red_coef    numeric;
  v_amber_coef  numeric;
  v_c           numeric;
  v_c_prev      numeric;
  v_obs         integer;
  v_on_time     integer;
  v_on_time_pct numeric;
  v_prev_obs    integer;
  v_prev_on     integer;
  v_prev_pct    numeric;
  v_red         integer;
  v_amber       integer;
  v_red_active  integer;
  v_in_report   integer;
  v_prev_red    integer;
  v_gini        numeric;
  v_gini_prev   numeric;
  v_gini_n      integer;
  v_gini_prev_n integer;
  v_shifts      integer;
  v_top_q_pct   numeric;
  v_top_q_n     integer;
  v_bottom_pct  numeric;
  v_active      integer;
  v_registered  integer;
  v_worked      integer;
  v_gap_events  integer;
  v_upcoming    integer;
  v_gap_places  integer;
  v_gap_pending integer;
  v_prev_gap    integer;
  v_prev_upcom  integer;
  v_chart       jsonb;
  v_rows        jsonb;
  v_excluded    jsonb;
  v_unmarked    jsonb;
  v_pop_n       integer;
  v_pop_hosts   integer;
  v_order_note  text;
  v_bands_on    boolean;
  -- 🔴 **חלון-התור קפוא** (F2, 16/09/2026): 12 חודשים אחורה מהיום, ואינו נגרר אחרי
  --    מסנן-התקופה — כרטיס `cards-hostesses.md` ③ שורת "דיילות אדומות" נוקב
  --    *"חלון קפוא 12 חודשים (📑ב#13)"*. שאר אריחי-הדף כן זזים עם המסנן.
  v_frz_to      date;
  v_frz_from    date;
  v_frz_prev    date;
  v_c_frozen    numeric;
  -- 📐3 · **תווית-החלון נגזרת מהחלון, ולא קבועה בקוד** (F2): נמדד 16/09/2026 שעל
  --    הפריסט "חודש אחרון" אריח "הגעה בזמן" הציג ‏93.9%‏ עם התווית *"12 החודשים
  --    האחרונים"* — אותה מחלקה בדיוק של אריח-התור, תו אחד משם.
  v_win_text    text;
  v_win_full    text;
begin
  perform public.assert_module_permission('דיילות', array['edit', 'view']);

  -- חלון חצי-פתוח `(from, to]`, ברירת-מחדל 12 חודשים עד היום (שעון-ישראל).
  v_to        := coalesce(p_to, v_today);
  v_from      := coalesce(p_from, (v_to - interval '12 months')::date);
  v_prev_to   := v_from;
  v_prev_from := (v_from - (v_to - v_from))::date;

  -- 🔴 **חלון-התור, קפוא — אותה אריתמטיקה בדיוק של `report_m15_reliability`**
  --    (‏`v_to := v_today` · 12 חודשים אחורה · תקופה-קודמת 12 חודשים לפניה), כדי ששני
  --    המסכים יראו את אותו תור ואת אותו ממוצע-חברה. **בלי זה, על הפריסט "חודש אחרון"
  --    האריח החזיר 0 אדומות בעוד דף-האמינות הראה 6, והתווית עדיין אמרה "חלון קפוא"** —
  --    נמדד 16/09/2026 (0 מתוך 4 דיילות, במקום 6 מתוך 87).
  v_frz_to    := v_today;
  v_frz_from  := (v_frz_to - interval '12 months')::date;
  v_frz_prev  := (v_frz_from - interval '12 months')::date;

  v_win_text  := case when v_from = (v_to - interval '12 months')::date then '12 החודשים האחרונים'
                      else to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') end;
  v_win_full  := v_win_text || case when v_from = (v_to - interval '12 months')::date
                                    then ' (' || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || ')'
                                    else '' end;

  -- ── פרמטרים, בזמן-ריצה. שורה חסרה = שם ב-`missing_params`, לא ברירת-מחדל שקטה.
  select nullif(btrim(pa.param_value), '')::numeric into v_m
    from public.params pa where pa.param_name = 'קבוע_ריסון_m';
  if v_m is null then v_missing := v_missing || 'קבוע_ריסון_m'; end if;

  select nullif(btrim(pa.param_value), '')::numeric into v_min_sample
    from public.params pa where pa.param_name = 'מינימום_תשובות_להצגת_ציון';
  if v_min_sample is null then v_missing := v_missing || 'מינימום_תשובות_להצגת_ציון'; end if;

  select nullif(btrim(pa.param_value), '')::numeric into v_red_coef
    from public.params pa where pa.param_name = 'מקדם_אמינות_אדום';
  if v_red_coef is null then v_missing := v_missing || 'מקדם_אמינות_אדום'; end if;

  select nullif(btrim(pa.param_value), '')::numeric into v_amber_coef
    from public.params pa where pa.param_name = 'מקדם_אמינות_ענבר';
  if v_amber_coef is null then v_missing := v_missing || 'מקדם_אמינות_ענבר'; end if;

  -- 🔴 שומר-סדר-המקדמים: היפוך שקט של שני הצבעים על המסך שכל עניינו את מי לא לשלוח.
  if v_red_coef is not null and v_amber_coef is not null and v_red_coef >= v_amber_coef then
    v_order_note := 'סימון האמינות כבוי: מקדם_אמינות_אדום (' || v_red_coef ||
                    ') אינו נמוך ממקדם_אמינות_ענבר (' || v_amber_coef ||
                    '), ולכן שני התגים היו מתהפכים. תקני את הערכים בהגדרות המערכת כדי להחזיר את הצבעים.';
    v_notes := v_notes || to_jsonb(v_order_note);
  end if;

  if p_customer_id is not null then
    v_notes := v_notes || to_jsonb(
      'הדף אינו מושפע ממסנן הלקוח — ציון-האמינות והספים נמדדים מול ממוצע כלל המאגר, וחתך לפי לקוח היה מגדיר מחדש את הממוצע עצמו.'::text);
  end if;

  v_bands_on := v_red_coef is not null and v_amber_coef is not null and v_red_coef < v_amber_coef;

  -- 📐3 · 📑ב#13 — האריח מצהיר את חלונו, וזה המשפט שהמסך מציג לידו.
  v_notes := v_notes || to_jsonb(
    ('אריח "דיילות אדומות" נמדד תמיד על 12 החודשים האחרונים ואינו זז עם מסנן התקופה — בחודש גרוע במיוחד כל הדיילות היו נראות מסתדרות, וגם ממוצע החברה היה נע איתן. שאר האריחים בדף כן זזים עם המסנן.')::text);

  -- ── בסיס-הנוכחות: `attendanceCounts` מילה-במילה, בחלון ובחלון המקביל.
  --    ‏`val is null` = **מדולג** — בדיוק כמו `if (value === undefined) continue` בקוד:
  --    "חולה"/"אישור-מראש" מוחרגים במכוון, וצירוף לא-מוכר מדולג בשקט ואינו מפיל את הדף.
  with obs as (
    select a.hostess_id, a.event_date,
           case
             when a.assignment_status = 'approval_withdrawn' then 0.5
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'light'  then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'medium' then 0.75
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'heavy'  then 0.5
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 0.0
           end as val,
           case
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 'on_time'
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level in ('light', 'medium', 'heavy') then 'late'
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 'ghosted'
           end as outcome,
           a.assignment_status, a.attendance_status, a.no_show_reason,
           (a.event_date > v_from) as is_cur
      from public.assignments a
      join public.projects p on p.project_id = a.project_id
     where p.project_status <> 'cancelled'
       and a.event_date > v_prev_from
       and a.event_date <= v_to
  ), totals as (
    select count(*) filter (where is_cur and val is not null)                         as obs_cur,
           count(*) filter (where is_cur and outcome = 'on_time')                     as on_time_cur,
           count(*) filter (where not is_cur and val is not null)                     as obs_prev,
           count(*) filter (where not is_cur and outcome = 'on_time')                 as on_time_prev,
           avg(val) filter (where is_cur)                                             as c_cur,
           avg(val) filter (where not is_cur)                                         as c_prev,
           count(distinct hostess_id) filter (where is_cur and val is not null)       as hosts_cur
      from obs
  ), excluded as (
    -- שורת-ההחרגות של 📐2 — מי לא נספר ולמה. **מונים, לא אחוזים.**
    select jsonb_build_object(
             'היעדרות באישור מראש ומחלה', count(*) filter (where attendance_status = 'no_show'
                                                            and no_show_reason in ('sick', 'approved_absence')),
             'סירובים',                   count(*) filter (where assignment_status = 'declined'),
             -- 🔴 **רק אירוע שכבר עבר** (F2): זימון שממתין לתשובה לאירוע שעוד לפנינו
             --    **אינו "הוצא" מאוכלוסיית-הנוכחות** — הוא מעולם לא היה כשיר להיכנס
             --    אליה, ואין בו דבר ש"נוכחותו טרם סומנה". בלי הסייג הזה שורת-📐2 סופרת
             --    את העתיד כחוסר-דאטה של ההווה. אותו כלל לשתי השורות.
             --    ⚠️ 'סירובים' נשאר כפי שהוא — לא הוכרע, ומדווח.
             'זימונים שלא נענו',          count(*) filter (where assignment_status = 'pending'
                                                            and event_date <= v_today),
             'נוכחות טרם סומנה',          count(*) filter (where attendance_status is null
                                                            and event_date <= v_today
                                                            and assignment_status not in ('declined', 'pending', 'approval_withdrawn'))
           ) as j
      from obs where is_cur
  ), by_month as (
    -- הגרף: שיעורים לפי חודש, עם `n` פר-חודש (📐12).
    -- **חודש בלי אף שיבוץ מסומן אינו עמודה ריקה** — הוא פשוט אינו בסדרה (⑧ H8).
    select jsonb_agg(x order by x->>'month') as j
      from (
        select jsonb_build_object(
                 'month',   to_char(date_trunc('month', event_date), 'YYYY-MM'),
                 'n',       count(*),
                 'late',    round(100.0 * count(*) filter (where outcome = 'late')    / nullif(count(*), 0), 1),
                 'no_show', round(100.0 * count(*) filter (where outcome = 'ghosted') / nullif(count(*), 0), 1)
               ) as x
          from obs where is_cur and val is not null
         group by date_trunc('month', event_date)
      ) s
  ), marked_months as (
    select distinct date_trunc('month', event_date) as mk from obs where is_cur and val is not null
  ), unmarked as (
    -- חודש שהאירועים בו כבר עברו אך אף שיבוץ בו לא סומן ⇒ נאמר במילים, לא כעמודה ריקה.
    select coalesce(jsonb_agg(to_jsonb(
             'החודש ' || m || ' אינו בגרף: ' || c ||
             ' שיבוצים באירועים שכבר התקיימו טרם נסגרה בהם נוכחות, ואין מה למדוד.')), '[]'::jsonb) as j
      from (
        select to_char(date_trunc('month', event_date), 'MM/YYYY') as m, count(*) as c
          from obs
         where is_cur and val is null and event_date <= v_today
           and attendance_status is null
           and assignment_status not in ('declined', 'pending', 'approval_withdrawn')
           and date_trunc('month', event_date) not in (select mk from marked_months)
         group by date_trunc('month', event_date)
      ) s
  )
  select t.obs_cur, t.on_time_cur, t.obs_prev, t.on_time_prev, t.c_cur, t.c_prev, t.hosts_cur,
         e.j, m.j, u.j
    into v_obs, v_on_time, v_prev_obs, v_prev_on, v_c, v_c_prev, v_pop_hosts,
         v_excluded, v_chart, v_unmarked
    from totals t, excluded e, by_month m, unmarked u;

  v_pop_n       := v_obs;
  v_on_time_pct := round(100.0 * v_on_time / nullif(v_obs, 0), 1);
  v_prev_pct    := round(100.0 * v_prev_on / nullif(v_prev_obs, 0), 1);
  v_notes       := v_notes || coalesce(v_unmarked, '[]'::jsonb);

  -- ── התור: ציון פר-דיילת, סף-מדגם (📐12), ואז שני הספים היחסיים (הכרעה 35).
  with obs as (
    select a.hostess_id, a.event_date,
           case
             when a.assignment_status = 'approval_withdrawn' then 0.5
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'light'  then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'medium' then 0.75
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'heavy'  then 0.5
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 0.0
           end as val,
           (a.attendance_status = 'no_show' and a.no_show_reason = 'ghosted') as is_ghosted,
           (a.event_date > v_frz_from) as is_cur
      from public.assignments a
      join public.projects p on p.project_id = a.project_id
     where p.project_status <> 'cancelled'
       and a.event_date > v_frz_prev
       and a.event_date <= v_frz_to
  ), c_frz as (
    -- 🔴 **ממוצע-החברה של החלון הקפוא, ולא של חלון-הקורא.** הוא המכנה של שני הספים,
    --    ולכן חייב לצאת מאותה אוכלוסייה בדיוק שממנה יוצא הציון — אחרת הסף נמדד על שנה
    --    אחת והציון על אחרת. זהה ל-`report_m15_reliability.meta.company_average`,
    --    ומוחזר כאן ב-`meta.company_average` כדי שההשוואה תהיה שאילתה ולא אמון.
    select avg(val) filter (where is_cur) c_cur, avg(val) filter (where not is_cur) c_prev
      from obs
  ), per as (
    select hostess_id, is_cur, count(*)::numeric n_shifts, sum(val) sum_val,
           count(*) filter (where is_ghosted) ghosted, max(event_date) last_shift
      from obs where val is not null group by hostess_id, is_cur
  ), scored as (
    select p.*, (p.sum_val + v_m * case when p.is_cur then f.c_cur else f.c_prev end)
                / (p.n_shifts + v_m) as score,
           case when p.is_cur then f.c_cur else f.c_prev end as base
      from per p cross join c_frz f
     where v_m is not null and v_min_sample is not null and p.n_shifts >= v_min_sample
  ), tagged as (
    select s.*, (v_bands_on and s.base is not null and s.score < v_red_coef   * s.base) as is_red,
                (v_bands_on and s.base is not null and s.score >= v_red_coef * s.base
                                                  and s.score <  v_amber_coef * s.base) as is_amber
      from scored s
  )
  select count(*) filter (where t.is_cur),
         count(*) filter (where t.is_cur and t.is_red),
         count(*) filter (where t.is_cur and t.is_amber),
         count(*) filter (where t.is_cur and t.is_red and h.status = 'active'),
         count(*) filter (where not t.is_cur and t.is_red),
         max(t.base) filter (where t.is_cur),
         jsonb_agg(jsonb_build_object(
           -- ‏`drill_key` אחיד בכל הלשוניות — `{kind, id}` ולא מזהה עירום (תיקון-חוזה C8).
           'drill_key',       jsonb_build_object('kind', 'hostess', 'id', t.hostess_id),
           'hostess_name',    h.full_name,
           'status',          case when h.status = 'active' then 'פעילה' else 'לא פעילה' end,
           'shifts',          t.n_shifts,
           'ghosted',         t.ghosted,
           'reliability',     round(t.score, 4),
           'last_shift_date', t.last_shift
         ) order by t.score asc, h.full_name asc) filter (where t.is_cur and t.is_red)
    into v_in_report, v_red, v_amber, v_red_active, v_prev_red, v_c_frozen, v_rows
    from tagged t join public.hostesses h on h.hostess_id = t.hostess_id;

  -- ── ג'יני והריכוזיות (§ח8-1): ספירת משמרות `finally_approved` פר-דיילת, אירוע שעבר.
  -- 🔴 **גרסת-אוכלוסייה, בלי `n/(n−1)`** (`spec.md §🔢 3.3`) — הצורה הממוינת
  --    `G = (2·Σ i·xᵢ)/(n·Σxᵢ) − (n+1)/n` שקולה לנוסחת ההפרשים הכפולים ורצה ב-O(n log n).
  -- 🚫 **בלי קיפול-שלישייה** — נמדד: ספירת השורות הגולמיות מחזירה את העוגן בדיוק.
  with counted as (
    select a.hostess_id, count(*)::numeric as shifts,
           (a.event_date > v_from) as is_cur
      from public.assignments a
     where a.assignment_status = 'finally_approved'
       and a.event_date > v_prev_from and a.event_date <= least(v_to, v_today)
     group by a.hostess_id, (a.event_date > v_from)
  ), ranked as (
    select is_cur, shifts,
           row_number() over (partition by is_cur order by shifts, hostess_id)      as rn_asc,
           row_number() over (partition by is_cur order by shifts desc, hostess_id) as rn_desc,
           count(*)  over (partition by is_cur) as n,
           sum(shifts) over (partition by is_cur) as total
      from counted
  ), agg as (
    select is_cur, max(n)::numeric n, max(total) total, sum(rn_asc * shifts) weighted
      from ranked group by is_cur
  )
  select (select n from agg where is_cur)::integer,
         (select total from agg where is_cur)::integer,
         (select case when n >= 2 and total > 0 then (2 * weighted) / (n * total) - (n + 1) / n end
            from agg where is_cur),
         (select ceil(n / 4.0)::integer from agg where is_cur),
         (select round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) from ranked r
           where r.is_cur and r.rn_desc <= ceil(r.n / 4.0)),
         (select round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) from ranked r
           where r.is_cur and r.rn_asc <= floor(r.n / 2.0)),
         (select n from agg where not is_cur)::integer,
         (select case when n >= 2 and total > 0 then (2 * weighted) / (n * total) - (n + 1) / n end
            from agg where not is_cur)
    into v_gini_n, v_shifts, v_gini, v_top_q_n, v_top_q_pct, v_bottom_pct,
         v_gini_prev_n, v_gini_prev;

  -- ── מונה-מצב: פעילות · רשומות · ומי שבאמת עבדה (המספר המעניין מבין השלושה).
  select count(*) filter (where status = 'active'), count(*)
    into v_active, v_registered
    from public.hostesses;
  v_worked := v_gini_n;

  -- ── אירועים עם חוסר, 30 ימים קדימה (הכרעה 24 · ח2).
  -- 🔴 **הקיפול הוא חובה** — `assignments` הוא מפתח-שלישייה ו-797 כפילויות-זוג קיימות
  --    (‏`spec.md §1.3`); בלעדיו דיילת שסירבה-וזומנה-שוב נספרת פעמיים.
  -- ⚠️ ‏`overviewHasGap` (`src/lib/projects.js:203`) מחזירה `true` גם על `event_finished`
  --    וגם על לוגיסטיקה לא-שלמה; **שורת-הכרטיס מגדירה כאן את חצי-האיוש בלבד**, וזה
  --    מה שממומש. מדווח.
  with folded as (
    select a.project_id, a.assignment_status
      from public.assignments a
     where a.assignment_number = (select max(a2.assignment_number) from public.assignments a2
                                   where a2.project_id = a.project_id and a2.hostess_id = a.hostess_id)
  ), conf as (
    select project_id, count(*) filter (where assignment_status = 'finally_approved') as c from folded group by project_id
  ), pend as (
    select project_id, count(*) filter (where assignment_status = 'pending') as p from public.assignments group by project_id
  ), scope as (
    select p.project_id, p.required_hostess_count, coalesce(conf.c, 0) c, coalesce(pend.p, 0) pending_count,
           case when p.final_event_date <= v_today + 30 then 'near' else 'far' end as horizon
      from public.projects p
      left join conf on conf.project_id = p.project_id
      left join pend on pend.project_id = p.project_id
     where p.project_status in ('not_started', 'in_progress', 'ready')
       and p.final_event_date > v_today
       and p.final_event_date <= v_today + 60
  )
  select count(*) filter (where horizon = 'near'),
         count(*) filter (where horizon = 'near' and c < required_hostess_count),
         coalesce(sum(greatest(required_hostess_count - c, 0)) filter (where horizon = 'near'), 0),
         coalesce(sum(pending_count) filter (where horizon = 'near' and c < required_hostess_count), 0),
         count(*) filter (where horizon = 'far'),
         count(*) filter (where horizon = 'far' and c < required_hostess_count)
    into v_upcoming, v_gap_events, v_gap_places, v_gap_pending, v_prev_upcom, v_prev_gap
    from scope;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', coalesce(v_pop_n, 0),
      'label', 'אוכלוסייה: שיבוצים שסומנה בהם נוכחות, באירוע שכבר התקיים ובפרויקט שלא בוטל · n=' ||
      -- 🪤 I1 · **מחלקת-הכמות עוברת דרך `to_char` בלי קשר לגודל.** H2 טיפלה ברצפי
      --    4+ ספרות בלבד, ולכן ארבעת מוני-ההוצאה וספירת-הדיילות נשארו חשופים.
      --    השינוי הוא **no-op על הערכים היום** (כולם תלת-ספרתיים ומטה) — והוא מונע
      --    מהמספר הבא שיעבור אלף להופיע כ-`1234` באותו משפט שבו `1,234` כבר נכון.
               to_char(coalesce(v_pop_n, 0), 'FM999,999,999') || ' שיבוצים אצל ' || to_char(coalesce(v_pop_hosts, 0), 'FM999,999,999') ||
               ' דיילות · הוצאו: ' || to_char(coalesce((v_excluded->>'היעדרות באישור מראש ומחלה')::integer, 0), 'FM999,999,999') ||
               ' היעדרויות באישור מראש ומחלה (לא נספרות לא במונה ולא במכנה) · ' ||
               to_char(coalesce((v_excluded->>'סירובים')::integer, 0), 'FM999,999,999') || ' סירובים · ' ||
               to_char(coalesce((v_excluded->>'זימונים שלא נענו')::integer, 0), 'FM999,999,999') || ' זימונים שלא נענו · ' ||
               to_char(coalesce((v_excluded->>'נוכחות טרם סומנה')::integer, 0), 'FM999,999,999') || ' שיבוצים שנוכחותם טרם סומנה.',
      'excluded', coalesce(v_excluded, '{}'::jsonb)),
    'window', jsonb_build_object('from', v_from, 'to', v_to, 'label', v_win_full),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'on_time', 'label', 'הגעה בזמן', 'value', v_on_time_pct, 'format', 'percent',
        'window', v_win_text,
        'compare', case when v_prev_pct is null then null else jsonb_build_object(
          'value', v_prev_pct, 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_on_time_pct > v_prev_pct then 'up' when v_on_time_pct < v_prev_pct then 'down' else 'flat' end) end,
        -- 🪤 I2 · לאריח הזה יש יעד טבעי —
        --    דף-האמינות, שמפרק את אותה הגעה-בזמן לאיחור/הבריזה ולציון פר-דיילת.
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'report_m15_reliability', 'drill', null),
        'sub', to_char(coalesce(v_on_time, 0), 'FM999,999,999') || ' מתוך ' ||
                  to_char(coalesce(v_obs, 0), 'FM999,999,999') || ' שיבוצים'),
      jsonb_build_object('key', 'red_hostesses', 'label', 'דיילות אדומות', 'value', v_red, 'format', 'int',
        'window', 'חלון קפוא · 12 חודשים',
        'compare', case when v_prev_red is null then null else jsonb_build_object(
          'value', v_prev_red, 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_red > v_prev_red then 'up' when v_red < v_prev_red then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'report_m15_reliability', 'drill', null),
        'sub', to_char(coalesce(v_red, 0), 'FM999,999,999') || ' מתוך ' || to_char(coalesce(v_in_report, 0), 'FM999,999,999') || ' דיילות עם ' ||
                  coalesce(to_char(v_min_sample, 'FM999,999,999'), '—') || ' משמרות ומעלה · ' || to_char(coalesce(v_amber, 0), 'FM999,999,999') ||
                  ' בענבר · ' || to_char(coalesce(v_red_active, 0), 'FM999,999,999') || ' מהאדומות פעילות'),
      jsonb_build_object('key', 'gini', 'label', 'ריכוזיות המשמרות', 'value', round(v_gini, 4), 'format', 'gini',
        'window', v_win_text,
        'compare', case when v_gini_prev is null then null else jsonb_build_object(
          'value', round(v_gini_prev, 4), 'label', 'התקופה המקבילה אשתקד (n=' || v_gini_prev_n || ')',
          'direction', case when v_gini > v_gini_prev then 'up' when v_gini < v_gini_prev then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'report_m17_fairness', 'drill', null),
        'sub', 'מדד ג''יני · רבע הדיילות העמוסות ביותר מקבלות ' || coalesce(v_top_q_pct::text, '—') ||
                  '% מהמשמרות; מחצית המאגר מקבלת ' || coalesce(v_bottom_pct::text, '—') || '%'),
      jsonb_build_object('key', 'active_hostesses', 'label', 'דיילות פעילות', 'value', v_active, 'format', 'int',
        'window', 'נכון ל-' || to_char(v_today, 'DD/MM/YYYY'),
        'compare', null,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'report_m16_quality_cost', 'drill', null),
        'sub', 'מתוך ' || to_char(coalesce(v_registered, 0), 'FM999,999,999') || ' רשומות · ' || to_char(coalesce(v_worked, 0), 'FM999,999,999') || ' עבדו בחלון'),
      jsonb_build_object('key', 'gap_events', 'label', 'אירועים עם חוסר', 'value', v_gap_events, 'format', 'int',
        'window', '30 הימים הקרובים',
        'compare', case when v_prev_upcom = 0 then null else jsonb_build_object(
          'value', v_prev_gap, 'label', '31–60 הימים הבאים',
          'direction', case when v_gap_events > v_prev_gap then 'up' when v_gap_events < v_prev_gap then 'down' else 'flat' end) end,
        -- 🪤 I2 · דלת חוצת-לשונית — תקדים D-18 (נתח-5). המעטפת מסתירה דלת
        --    שהלשונית שלה ממוסכת, ולכן למשתמשת דיילות-בלבד הדלת פשוט אינה מוצגת.
        'target', jsonb_build_object('tab', 'הנהלה', 'report', 'report_m06_staffing', 'drill', null),
        'sub', case when v_upcoming = 0 then 'אין אירועים ב-30 הימים הקרובים'
                  else to_char(coalesce(v_gap_events, 0), 'FM999,999,999') || ' מתוך ' || to_char(coalesce(v_upcoming, 0), 'FM999,999,999') || ' אירועים · ' || to_char(coalesce(v_gap_places, 0), 'FM999,999,999') ||
                       ' מקומות · ' || to_char(coalesce(v_gap_pending, 0), 'FM999,999,999') || ' זימונים ממתינים' end)),
    'chart', jsonb_build_object(
      'type', 'bar', 'title', 'איחור ואי-הגעה לפי חודש',
      'series', jsonb_build_array(
        -- 🪤 I1 · `series[].format` הוא הקודם ל-`unit` בגזירת תו-הסימון
        --    ובטולטיפ, והוא היה `null`. הערכים עצמם אינם זזים.
        jsonb_build_object('key', 'late', 'label', 'איחור', 'format', 'percent'),
        jsonb_build_object('key', 'no_show', 'label', 'אי-הגעה (הבריזה)', 'format', 'percent')),
      'data', coalesce(v_chart, '[]'::jsonb), 'xKey', 'month',
      'domain', null, 'refLines', '[]'::jsonb, 'unit', 'percent'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'hostess_name',    'label', 'דיילת',          'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'status',          'label', 'סטטוס',          'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'shifts',          'label', 'משמרות',         'format', 'int',  'align', 'end'),
      jsonb_build_object('key', 'ghosted',         'label', 'הבריזה',         'format', 'int',  'align', 'end'),
      jsonb_build_object('key', 'reliability',     'label', 'ציון אמינות',     'format', 'score', 'align', 'end'),
      jsonb_build_object('key', 'last_shift_date', 'label', 'משמרת אחרונה',   'format', 'date', 'align', 'end')),
    'rows', coalesce(v_rows, '[]'::jsonb),
    'so_what', case
      when v_red is null or v_red = 0 then 'אין דיילות אדומות בחלון — אין תור לטפל בו החודש.'
      else 'לא לשלוח את ' || to_char(coalesce(v_red, 0), 'FM999,999,999') || ' הדיילות האדומות לאירועים הקרובים — ' || to_char(coalesce(v_red_active, 0), 'FM999,999,999') ||
           ' מהן פעילות ומוצעות היום בשיבוץ.' end,
    'definitions', 'הגדרות: הגעה בזמן = שיבוצים שסומן בהם "הגיעה" בלי דרגת-איחור, מתוך כל השיבוצים שסומנה בהם נוכחות · ' ||
      -- ‏`trim_scale` ולא `::text` גולמי: ‏`(0.87*100)::text` מרנדר **"87.00"** והמסך היה
      -- אומר *"נמוך מ-87.00%"* במקום *"נמוך מ-87%"* — נתפס בהרצת המטען מול המסד 16/09/2026.
      -- 🔴 **ממוצע-החברה כאן הוא זה של החלון הקפוא, בשש ספרות** — אותו מספר בדיוק
      --    ש-`report_m15_reliability` מחזיר ב-`meta.company_average`. עד F2 הודפס כאן
      --    ממוצע חלון-הקורא, ואותו מונח נשא שלושה ערכים שונים בלשונית אחת (0.9587 ·
      --    0.958358 · 0.958815).
      -- 🪤 J1 · **שש ספרות כאן וארבע במ15 — שתי דיוקויות לאותם שלושה מספרים בלשונית
      --    אחת** (0.958358 מול 0.9584 · 0.833771 מול 0.8338 · 0.910440 מול 0.9104).
      --    מיושר לארבע, שהיא הדיוקוּת של מ15, ו-`meta` להלן ממשיך לשאת שש — שם זה
      --    ערך-מכונה להשוואה בשאילתה אחת, כאן זה טקסט שאדם קורא.
      --    ➕ ו-'ענבר' לבדה מול 'דיילת ענבר' במ15: אותו מונח, נוסח אחד.
      'דיילת אדומה = ציון-אמינות נמוך מ-' || coalesce(trim_scale(v_red_coef * 100)::text, '—') || '% מממוצע החברה (' ||
      coalesce(round(v_c_frozen, 4)::text, '—') || ') — כלומר מתחת ל-' || coalesce(round(v_red_coef * v_c_frozen, 4)::text, '—') ||
      '; דיילת ענבר = מתחת ל-' || coalesce(trim_scale(v_amber_coef * 100)::text, '—') || '% ממנו (' ||
      coalesce(round(v_amber_coef * v_c_frozen, 4)::text, '—') || ') · ' ||
      'ג''יני = מדד ריכוזיות בין 0 (כל דיילת מקבלת אותו מספר משמרות) ל-1 (דיילת אחת מקבלת הכול), על ' ||
      coalesce(v_gini_n::text, '0') || ' הדיילות שעבדו בחלון · ' ||
      'דיילת פעילה = הסטטוס ''פעילה'' בכרטיס שלה — אינו "עבדה לאחרונה" · ' ||
      'אירוע עם חוסר = אירוע שטרם התקיים ומספר המשובצות-סופית בו קטן ממספר הדיילות הנדרש.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', to_jsonb(v_missing),
      'frozen_count', null,
      'notes', v_notes,
      'run', null,
      -- 📌 מצב-מוצהר עם מקורו: אותם שלושה מספרים בדיוק ש-`report_m15_reliability`
      --    מחזיר, כדי שאפשר יהיה להשוות בשאילתה אחת במקום להאמין לשני מסכים.
      'company_average', round(v_c_frozen, 6),
      'red_threshold', case when v_bands_on then round(v_red_coef * v_c_frozen, 6) end,
      'amber_threshold', case when v_bands_on then round(v_amber_coef * v_c_frozen, 6) end,
      'frozen_window', jsonb_build_object('from', v_frz_from, 'to', v_frz_to),
      -- ‏📐9: `aria-sort` יושב על עמודה אחת בלבד, וה-RPC הוא שיודע איזו (מיון לפי ציון
      --    עולה — סדר-הטיפול, לא אלף-בית). 🔴 **הקורא בפועל הוא `meta.sort`** — נמדד
      --    16/09/2026: `ReportSurface.jsx:253` מעביר `sort={payload.meta?.sort}` ו-
      --    `ReportTable.jsx:44-49` משווה `sort.key` לעמודה. ‏`columns[].sorted` של
      --    תיקון-C8 אינו נקרא באף קובץ — מדווח, לא מתוקן כאן.
      'sort', jsonb_build_object('key', 'reliability', 'direction', 'ascending'),
      -- ‏C8: ההצהרה היא תכונה של המשטח ולא של הקריאה — ארבעת דפי-הלשונית אינם מסוננים
      --    לפי לקוח **אף פעם**, ולכן `true` קבוע ולא `p_customer_id is not null`.
      'customer_filter_ignored', true,
      'drill_echo', p_drill));
end;
$function$;

comment on function public.report_m14_hostess_overview(date, date, integer, jsonb) is
'מ11 · מבט-על דיילות (בקרה). אוכלוסייה: שיבוצים שסומנה בהם נוכחות, באירוע שכבר התקיים ובפרויקט שלא בוטל. הוצאו: היעדרות באישור-מראש ומחלה (לא במונה ולא במכנה), סירובים, זימונים שלא נענו, ושיבוצים שנוכחותם טרם סומנה. חלון חצי-פתוח (from, to], ברירת-מחדל 12 חודשים בשעון ישראל — למעט אריח "דיילות אדומות", שחלונו קפוא על 12 החודשים האחרונים ואינו נגרר אחרי מסנן-התקופה (זהה ל-report_m15_reliability, כולל ממוצע-החברה). ג''יני: גרסת-אוכלוסייה על ספירת המשמרות המאושרות פר-דיילת (§ח8-1). ספי-האמינות נקראים מ-params בזמן-ריצה ואינם קבועי-קוד (הכרעה 35).';

revoke execute on function public.report_m14_hostess_overview(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m14_hostess_overview(date, date, integer, jsonb) to authenticated;

create or replace function public.report_m15_reliability(
  p_from        date    default null,
  p_to          date    default null,
  p_customer_id integer default null,
  p_drill       jsonb   default null
) returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_today       date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to          date;
  v_from        date;
  v_prev_to     date;
  v_prev_from   date;
  v_dow         integer;
  v_missing     text[] := array[]::text[];
  v_notes       jsonb  := '[]'::jsonb;
  v_m           numeric;
  v_min_sample  numeric;
  v_red_coef    numeric;
  v_amber_coef  numeric;
  v_bands_on    boolean;
  v_c           numeric;
  v_c_prev      numeric;
  v_obs         integer;
  v_prev_obs    integer;
  v_on_time     integer;
  v_prev_on     integer;
  v_late        integer;
  v_late_heavy  integer;
  v_prev_late   integer;
  v_ghosted     integer;
  v_prev_ghost  integer;
  v_withdrew    integer;
  v_in_report   integer;
  v_below       integer;
  v_flagged     integer;
  v_prev_flag   integer;
  v_red         integer;
  v_amber       integer;
  v_red_active  integer;
  v_shifts_in   integer;
  v_shifts_out  integer;
  v_chart       jsonb;
  v_rows        jsonb;
  v_order_note  text;
  -- 🆕 הכרעה 37 בחתך-דירוג — שני השיעורים, והדוח אינו בוחר ביניהם (F2, 16/09/2026).
  v_ns12        jsonb;
  v_ns_ever     jsonb;
  v_ns_rows     jsonb;
begin
  perform public.assert_module_permission('דיילות', array['edit', 'view']);

  -- 🔴 החלון קפוא: `p_from`/`p_to` מתקבלים אך אינם גוררים את בסיס-הציון (📑ב#13).
  v_to        := v_today;
  v_from      := (v_to - interval '12 months')::date;
  v_prev_to   := v_from;
  v_prev_from := (v_from - interval '12 months')::date;

  if p_from is not null or p_to is not null then
    v_notes := v_notes || to_jsonb(
      'החלון כאן קבוע על 12 חודשים ואינו זז עם מסנן התקופה — בחודש גרוע במיוחד כל הדיילות היו נראות מסתדרות, וגם ממוצע החברה היה נע איתן.'::text);
  end if;
  if p_customer_id is not null then
    v_notes := v_notes || to_jsonb(
      'הדף אינו מושפע ממסנן הלקוח — הציון והספים נמדדים מול ממוצע כלל המאגר.'::text);
  end if;

  select nullif(btrim(pa.param_value), '')::numeric into v_m
    from public.params pa where pa.param_name = 'קבוע_ריסון_m';
  if v_m is null then v_missing := v_missing || 'קבוע_ריסון_m'; end if;

  select nullif(btrim(pa.param_value), '')::numeric into v_min_sample
    from public.params pa where pa.param_name = 'מינימום_תשובות_להצגת_ציון';
  if v_min_sample is null then v_missing := v_missing || 'מינימום_תשובות_להצגת_ציון'; end if;

  select nullif(btrim(pa.param_value), '')::numeric into v_red_coef
    from public.params pa where pa.param_name = 'מקדם_אמינות_אדום';
  if v_red_coef is null then v_missing := v_missing || 'מקדם_אמינות_אדום'; end if;

  select nullif(btrim(pa.param_value), '')::numeric into v_amber_coef
    from public.params pa where pa.param_name = 'מקדם_אמינות_ענבר';
  if v_amber_coef is null then v_missing := v_missing || 'מקדם_אמינות_ענבר'; end if;

  -- 🔴 שומר-סדר-המקדמים — ר' כותרת-הקובץ. הצבע כבוי, והמשפט מוצג במקומו.
  v_bands_on := v_red_coef is not null and v_amber_coef is not null and v_red_coef < v_amber_coef;
  if v_red_coef is not null and v_amber_coef is not null and not v_bands_on then
    v_order_note := 'סימון האמינות כבוי: מקדם_אמינות_אדום (' || v_red_coef ||
                    ') אינו נמוך ממקדם_אמינות_ענבר (' || v_amber_coef ||
                    '), ולכן שני התגים היו מתהפכים. תקני את הערכים בהגדרות המערכת כדי להחזיר את הצבעים.';
    v_notes := v_notes || to_jsonb(v_order_note);
  end if;

  -- בחירת-יום מהגרף (סינון-צולב): 0–6, ערך מחוץ לטווח מתעלמים ממנו (⑦).
  v_dow := nullif(btrim(coalesce(p_drill->>'dow', '')), '')::integer;
  if v_dow is not null and (v_dow < 0 or v_dow > 6) then v_dow := null; end if;

  -- ── בסיס-הנוכחות, פעם אחת: אגרגטים · ממוצע-החברה · גרף יום-בשבוע.
  --    **יום בלי אף שיבוץ מסומן אינו עמודה** — שבת אינה בסדרה כי אין אירועים בשבת.
  with obs as (
    select a.hostess_id, extract(dow from a.event_date)::integer as dow,
           case
             when a.assignment_status = 'approval_withdrawn' then 0.5
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'light'  then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'medium' then 0.75
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'heavy'  then 0.5
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 0.0
           end as val,
           case
             when a.assignment_status = 'approval_withdrawn' then 'withdrew'
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 'on_time'
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'light'  then 'late_light'
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'medium' then 'late_medium'
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'heavy'  then 'late_heavy'
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 'ghosted'
           end as outcome,
           (a.event_date > v_from) as is_cur
      from public.assignments a
      join public.projects p on p.project_id = a.project_id
     where p.project_status <> 'cancelled'
       and a.event_date > v_prev_from
       and a.event_date <= v_to
  ), totals as (
    select count(*) filter (where is_cur and val is not null)                 obs_cur,
           count(*) filter (where not is_cur and val is not null)             obs_prev,
           count(*) filter (where is_cur and outcome = 'on_time')             on_cur,
           count(*) filter (where not is_cur and outcome = 'on_time')         on_prev,
           count(*) filter (where is_cur and outcome like 'late\_%')          late_cur,
           count(*) filter (where is_cur and outcome = 'late_heavy')          heavy_cur,
           count(*) filter (where not is_cur and outcome like 'late\_%')      late_prev,
           count(*) filter (where is_cur and outcome = 'ghosted')             gh_cur,
           count(*) filter (where not is_cur and outcome = 'ghosted')         gh_prev,
           count(*) filter (where is_cur and outcome = 'withdrew')            wd_cur,
           avg(val) filter (where is_cur)                                     c_cur,
           avg(val) filter (where not is_cur)                                 c_prev
      from obs
  ), by_dow as (
    -- 🔴 **שמות-הימים אינם נכתבים כאן.** ‏`WEEKDAY_NAMES_HE` ב-`src/lib/dates.js:97` כבר
    --    מחזיקה את שבעת המחרוזות; עותק שני ב-SQL הוא בדיוק הכפילות שכלל-ברזל 14 אוסר,
    --    והוא מתפצל בשקט ביום שמישהו מתקן ניסוח בצד אחד. ⇒ מוחזר **המספר 0–6**,
    --    ו-`chart.label_source` אומר לממשק דרך איזה קבוע למפות אותו.
    select jsonb_agg(x order by (x->>'dow')::int) j
      from (
        select jsonb_build_object(
                 'dow', dow,
                 'n', count(*),
                 'late',    round(100.0 * count(*) filter (where outcome like 'late\_%') / nullif(count(*), 0), 1),
                 'no_show', round(100.0 * count(*) filter (where outcome = 'ghosted')    / nullif(count(*), 0), 1)
               ) as x
          from obs where is_cur and val is not null group by dow
      ) s
  )
  select t.obs_cur, t.obs_prev, t.on_cur, t.on_prev, t.late_cur, t.heavy_cur, t.late_prev,
         t.gh_cur, t.gh_prev, t.wd_cur, t.c_cur, t.c_prev, d.j
    into v_obs, v_prev_obs, v_on_time, v_prev_on, v_late, v_late_heavy, v_prev_late,
         v_ghosted, v_prev_ghost, v_withdrew, v_c, v_c_prev, v_chart
    from totals t, by_dow d;

  -- ── התור עצמו. **מיון לפי ציון עולה — סדר-הטיפול, לא אלף-בית** (📐7 · 📑ב#13).
  -- ‏**השורה שמעל הסף נשארת בכוונה** (⑧15.5): היא מראה איפה עובר הסף במקום להצהיר עליו.
  -- 🔴 **שתי עמודות אי-הגעה (הכרעה 37) — והדוח אינו בוחר:** `no_show_12m` היא הגדרת-הציון
  --    (הבריזה בלבד, בחלון הקפוא), ו-`no_show_ever` היא כל סיבות אי-ההגעה על כל ההיסטוריה.
  --    ‏**"אי-פעם" אינה תלוית-חלון ואינה תלוית-יום**, ולכן היא אינה משתנה בסינון-הצולב (⑧15.6).
  with obs as (
    select a.hostess_id, extract(dow from a.event_date)::integer as dow,
           case
             when a.assignment_status = 'approval_withdrawn' then 0.5
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'light'  then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'medium' then 0.75
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'heavy'  then 0.5
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 0.0
           end as val,
           case
             when a.assignment_status = 'approval_withdrawn' then 'withdrew'
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 'on_time'
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level in ('light', 'medium', 'heavy') then 'late'
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 'ghosted'
           end as outcome,
           (a.event_date > v_from) as is_cur
      from public.assignments a
      join public.projects p on p.project_id = a.project_id
     where p.project_status <> 'cancelled'
       and a.event_date > v_prev_from
       and a.event_date <= v_to
  ), per as (
    select o.hostess_id, count(*)::numeric n_shifts, sum(o.val) sum_val,
           count(*) filter (where o.outcome = 'on_time')     on_time,
           count(*) filter (where o.outcome = 'late')        late_all,
           count(*) filter (where o.outcome = 'ghosted')     ghosted,
           count(*) filter (where o.outcome = 'withdrew')    withdrew
      from obs o where o.is_cur and o.val is not null group by o.hostess_id
  ), per_prev as (
    select o.hostess_id, count(*)::numeric n_shifts, sum(o.val) sum_val
      from obs o where not o.is_cur and o.val is not null group by o.hostess_id
  ), ever as (
    select a.hostess_id,
           count(*) filter (where a.attendance_status is not null)                 marked_ever,
           count(*) filter (where a.attendance_status = 'no_show')                 no_show_ever
      from public.assignments a group by a.hostess_id
  ), day_slice as (
    select o.hostess_id, count(*) n_day,
           count(*) filter (where o.outcome = 'late')     late_day,
           count(*) filter (where o.outcome = 'ghosted')  ghost_day,
           count(*) filter (where o.outcome = 'withdrew') withdrew_day
      from obs o
     where o.is_cur and o.val is not null and v_dow is not null and o.dow = v_dow
     group by o.hostess_id
  ), eligible as (
    select p.*, (p.sum_val + v_m * v_c) / (p.n_shifts + v_m) as score
      from per p
     where v_m is not null and v_c is not null and v_min_sample is not null
       and p.n_shifts >= v_min_sample
  ), banded as (
    select e.*,
           case when not v_bands_on then null
                when e.score <  v_red_coef   * v_c then 'red'
                when e.score <  v_amber_coef * v_c then 'amber'
           end as band
      from eligible e
  ), prev_flagged as (
    select count(*) filter (where v_m is not null and v_c_prev is not null and v_bands_on
                              and v_min_sample is not null and n_shifts >= v_min_sample
                              and (sum_val + v_m * v_c_prev) / (n_shifts + v_m) < v_amber_coef * v_c_prev) c
      from per_prev
  ), sample as (
    select count(*) filter (where v_min_sample is not null and n_shifts >= v_min_sample)      in_rep,
           count(*) filter (where v_min_sample is null or  n_shifts <  v_min_sample)          below,
           coalesce(sum(n_shifts) filter (where v_min_sample is not null and n_shifts >= v_min_sample), 0) sh_in,
           coalesce(sum(n_shifts) filter (where v_min_sample is null or  n_shifts <  v_min_sample), 0)     sh_out
      from per
  ), table_rows as (
    -- **מיון לפי ציון עולה — סדר-הטיפול, לא אלף-בית** (📐7 · 📑ב#13); הדפדוף בצד-הלקוח.
    select jsonb_agg(jsonb_build_object(
             -- ‏`drill_key` אחיד בכל הלשוניות — `{kind, id}` (תיקון-חוזה C8).
             'drill_key',     jsonb_build_object('kind', 'hostess', 'id', b.hostess_id),
             'hostess_name',  h.full_name,
             'status',        case when h.status = 'active' then 'פעילה' else 'לא פעילה' end,
             'band',          b.band,
             -- 🔴 במצב-יום עמודות-החלון מציגות "—" ולא ספירה שמשקרת (⑧15.1):
             --    "11 משמרות" ליד "יום חמישי" היה אומר דבר שלא קרה.
             'shifts',        case when v_dow is null then b.n_shifts else d.n_day end,
             'on_time_pct',   case when v_dow is null
                                   then round(100.0 * b.on_time / nullif(b.n_shifts, 0), 1) end,
             'late',          case when v_dow is null then b.late_all else d.late_day end,
             'no_show_12m',   case when v_dow is null then b.ghosted  else d.ghost_day end,
             'withdrew',      case when v_dow is null then b.withdrew else d.withdrew_day end,
             -- 🔴 "אי-פעם" אינה תלוית-חלון ואינה תלוית-יום ⇒ אינה משתנה בסינון-הצולב (⑧15.6).
             'no_show_ever',  e.no_show_ever,
             'no_show_ever_denominator', e.marked_ever,
             'reliability',   case when v_dow is null then round(b.score, 4) end
           ) order by b.score asc, h.full_name asc) j
      from banded b
      join public.hostesses h on h.hostess_id = b.hostess_id
      left join ever e on e.hostess_id = b.hostess_id
      left join day_slice d on d.hostess_id = b.hostess_id
     where v_dow is null or d.hostess_id is not null
  ), tallies as (
    select count(*) filter (where b.band = 'red')                              red,
           count(*) filter (where b.band = 'amber')                            amber,
           count(*) filter (where b.band is not null)                          flagged,
           count(*) filter (where b.band = 'red' and h.status = 'active')      red_active
      from banded b join public.hostesses h on h.hostess_id = b.hostess_id
  )
  select r.j, t.red, t.amber, t.flagged, t.red_active, pf.c, s.in_rep, s.below, s.sh_in, s.sh_out
    into v_rows, v_red, v_amber, v_flagged, v_red_active, v_prev_flag,
         v_in_report, v_below, v_shifts_in, v_shifts_out
    from table_rows r, tallies t, prev_flagged pf, sample s;

  -- ── 🆕 **הכרעה 37 בחתך-דירוג** (כרטיס ③ מ15 שורת "אי-הגעה לפי דירוג" · ⑧15.4).
  -- 🔴 **שני שיעורים ושני מכנים שונים — ולכן אינם ניתנים להשוואה זה לזה, רק בין דירוגים:**
  --    *"12 חודשים"* = הבריזה בלבד, על אוכלוסיית-הנוכחות של החלון הקפוא (מחלה והיעדרות
  --    באישור מוחרגות משני צדי השבר — בדיוק `attendanceCounts`); *"אי-פעם"* = כל סיבות
  --    אי-ההגעה, על כל ההיסטוריה ובלי חלון. אלה בדיוק שתי העמודות שכבר יושבות בטבלה,
  --    באגרגציה אחרת. ⇒ מוחזרים כאן **מוכנים**, כדי שהלשונית לא תגזור אותם מהשורות
  --    (כלל-ברזל 14) — ואי-אפשר בכלל, כי `rows` אינו נושא `rating`.
  with obs as (
    select a.hostess_id,
           case
             when a.assignment_status = 'approval_withdrawn' then 0.5
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'light'  then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'medium' then 0.75
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'heavy'  then 0.5
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 0.0
           end as val,
           (a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted') as ghosted
      from public.assignments a
      join public.projects p on p.project_id = a.project_id
     where p.project_status <> 'cancelled'
       and a.event_date > v_from and a.event_date <= v_to
  ), w12 as (
    select h.rating, count(*) n, count(*) filter (where o.ghosted) gh
      from obs o join public.hostesses h on h.hostess_id = o.hostess_id
     where o.val is not null group by h.rating
  ), ever_rated as (
    select h.rating,
           count(*) filter (where a.attendance_status is not null) n,
           count(*) filter (where a.attendance_status = 'no_show')  ns
      from public.assignments a join public.hostesses h on h.hostess_id = a.hostess_id
     group by h.rating
  ), rating_keys as (
    -- 🔴 **`full join … on … is not distinct from …` נכשל בזמן-ריצה, לא בקומפילציה:**
    --    ‏`0A000 FULL JOIN is only supported with merge-joinable or hash-joinable join
    --    conditions`. ‏`create or replace` עבר בירוק, והפונקציה מתה רק בקריאה הראשונה —
    --    בדיוק המחלקה שהמיגרציה הזו באה לתקן. ⇒ איחוד-מפתחות ושני `left join`
    --    (‏`left join` **כן** נתמך עם תנאי לא-מיזוגי, דרך לולאה מקוננת), ו-`union`
    --    ממזג גם את המפתח הריק (חסרות-דירוג). נמדד ותוקן 16/09/2026.
    select rating from w12 union select rating from ever_rated
  ), merged as (
    select k.rating, w.n n12, w.gh gh12, e.n n_ever, e.ns ns_ever,
           round(100.0 * w.gh / nullif(w.n, 0), 1) pct12,
           round(100.0 * e.ns / nullif(e.n, 0), 1) pct_ever
      from rating_keys k
      left join w12        w on w.rating is not distinct from k.rating
      left join ever_rated e on e.rating is not distinct from k.rating
  )
  select jsonb_object_agg(rating::text, pct12)    filter (where rating is not null and pct12 is not null),
         jsonb_object_agg(rating::text, pct_ever) filter (where rating is not null and pct_ever is not null),
         jsonb_agg(jsonb_build_object(
           -- ⚠️ **רצועת חסרות-הדירוג נשארת בטבלה במכוון** — אלה מאות תצפיות, והשמטתן
           --    מטבלה ששמה "אי-הגעה לפי דירוג" היא בדיוק ההשמטה-בשקט של 📐2. באובייקט
           --    `no_show_by_rating` היא אינה, כי שם המפתחות הם דירוגים.
           'rating_label', case when rating is null then 'ללא דירוג' else rating::text end,
           'rating', rating,
           'months12', pct12, 'months12_n', n12,
           'ever', pct_ever, 'ever_n', n_ever)
           order by case when rating is null then -1 else rating end desc)
    into v_ns12, v_ns_ever, v_ns_rows
    from merged;

  if v_dow is not null then
    v_notes := v_notes || to_jsonb(
      ('הספירות בטבלה הן של אותו יום בלבד; עמודת "אי-הגעה · אי-פעם" אינה תלוית-יום ונשארת כפי שהיא.')::text);
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', coalesce(v_in_report, 0),
      -- 🪤 I1 · מחלקת-הכמות דרך `to_char` בלי קשר לגודל (ר' ההערה במ14). no-op היום.
      'label', 'אוכלוסייה: דיילות עם ' || coalesce(to_char(v_min_sample, 'FM999,999,999'), '—') ||
               ' משמרות מסומנות ומעלה בחלון · n=' || to_char(coalesce(v_in_report, 0), 'FM999,999,999') || ' דיילות, ' ||
               to_char(coalesce(v_shifts_in, 0), 'FM999,999,999') || ' שיבוצים · הוצאו: ' || to_char(coalesce(v_below, 0), 'FM999,999,999') ||
               ' דיילות עם פחות מ-' || coalesce(to_char(v_min_sample, 'FM999,999,999'), '—') ||
               ' משמרות מסומנות (מוצגות "—" ולא אחוז) · היעדרויות באישור מראש ומחלה — לא במונה ולא במכנה, כדי שדיילת שהודיעה מראש לא תיענש כמי שהבריזה.',
      'excluded', jsonb_build_object('מתחת לסף המדגם', coalesce(v_below, 0))),
    'window', jsonb_build_object('from', v_from, 'to', v_to, 'label', 'חלון קפוא · 12 החודשים האחרונים'),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'on_time', 'label', 'הגעה בזמן',
        'value', round(100.0 * v_on_time / nullif(v_obs, 0), 1), 'format', 'percent',
        'window', 'חלון קפוא · 12 חודשים',
        'compare', case when v_prev_obs = 0 then null else jsonb_build_object(
          'value', round(100.0 * v_prev_on / nullif(v_prev_obs, 0), 1), 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_on_time * v_prev_obs > v_prev_on * v_obs then 'up'
                            when v_on_time * v_prev_obs < v_prev_on * v_obs then 'down' else 'flat' end) end,
        'target', null, 'sub', to_char(coalesce(v_on_time, 0), 'FM999,999,999') || ' מתוך ' ||
                                  to_char(coalesce(v_obs, 0), 'FM999,999,999')),
      jsonb_build_object('key', 'late', 'label', 'איחור',
        'value', round(100.0 * v_late / nullif(v_obs, 0), 1), 'format', 'percent',
        'window', 'חלון קפוא · 12 חודשים',
        'compare', case when v_prev_obs = 0 then null else jsonb_build_object(
          'value', round(100.0 * v_prev_late / nullif(v_prev_obs, 0), 1), 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_late * v_prev_obs > v_prev_late * v_obs then 'up'
                            when v_late * v_prev_obs < v_prev_late * v_obs then 'down' else 'flat' end) end,
        'target', null, 'sub', to_char(coalesce(v_late, 0), 'FM999,999,999') || ' שיבוצים, מהם ' || to_char(coalesce(v_late_heavy, 0), 'FM999,999,999') || ' באיחור רב'),
      jsonb_build_object('key', 'no_show', 'label', 'אי-הגעה (הבריזה)',
        'value', round(100.0 * v_ghosted / nullif(v_obs, 0), 1), 'format', 'percent',
        'window', 'חלון קפוא · 12 חודשים',
        'compare', case when v_prev_obs = 0 then null else jsonb_build_object(
          'value', round(100.0 * v_prev_ghost / nullif(v_prev_obs, 0), 1), 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_ghosted * v_prev_obs > v_prev_ghost * v_obs then 'up'
                            when v_ghosted * v_prev_obs < v_prev_ghost * v_obs then 'down' else 'flat' end) end,
        'target', null, 'sub', to_char(coalesce(v_ghosted, 0), 'FM999,999,999') || ' שיבוצים · ' || to_char(coalesce(v_withdrew, 0), 'FM999,999,999') || ' ביטלו אחרי אישור'),
      jsonb_build_object('key', 'flagged', 'label', 'דיילות מסומנות', 'value', v_flagged, 'format', 'int',
        'window', 'חלון קפוא · 12 חודשים',
        'compare', case when v_prev_flag is null then null else jsonb_build_object(
          'value', v_prev_flag, 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_flagged > v_prev_flag then 'up' when v_flagged < v_prev_flag then 'down' else 'flat' end) end,
        'target', null,
        'sub', to_char(coalesce(v_red, 0), 'FM999,999,999') || ' אדומות · ' || to_char(coalesce(v_amber, 0), 'FM999,999,999') || ' ענבר מתוך ' ||
                  to_char(coalesce(v_in_report, 0), 'FM999,999,999') || ' · ' || to_char(coalesce(v_red_active, 0), 'FM999,999,999') || ' מהאדומות פעילות')),
    'chart', jsonb_build_object(
      'type', 'bar', 'title', 'איחור ואי-הגעה לפי יום בשבוע',
      'series', jsonb_build_array(
        -- 🪤 I1 · `series[].format` הוא הקודם ל-`unit` בגזירת תו-הסימון
        --    ובטולטיפ, והוא היה `null`. הערכים עצמם אינם זזים.
        jsonb_build_object('key', 'late', 'label', 'איחור', 'format', 'percent'),
        jsonb_build_object('key', 'no_show', 'label', 'אי-הגעה (הבריזה)', 'format', 'percent')),
      'data', coalesce(v_chart, '[]'::jsonb), 'xKey', 'dow',
      -- הממשק ממפה `dow` (0–6) דרך `WEEKDAY_NAMES_HE` — ר' הערת ה-CTE למעלה.
      'label_source', 'WEEKDAY_NAMES_HE',
      'domain', null, 'refLines', '[]'::jsonb, 'unit', 'percent'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'hostess_name',  'label', 'דיילת',                'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'status',        'label', 'סטטוס',                'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'shifts',        'label', 'משמרות',               'format', 'int',   'align', 'end'),
      jsonb_build_object('key', 'on_time_pct',   'label', 'הגיעה בזמן',           'format', 'percent', 'align', 'end'),
      jsonb_build_object('key', 'late',          'label', 'איחור',                'format', 'int',   'align', 'end'),
      jsonb_build_object('key', 'no_show_12m',   'label', 'הבריזה · ב-12 חודשים', 'format', 'int',   'align', 'end'),
      jsonb_build_object('key', 'no_show_ever',  'label', 'אי-הגעה · אי-פעם',     'format', 'int',   'align', 'end'),
      jsonb_build_object('key', 'reliability',   'label', 'ציון אמינות',           'format', 'score', 'align', 'end')),
    'rows', coalesce(v_rows, '[]'::jsonb),
    'so_what', case
      when not v_bands_on then 'אין סימון אמינות עד שהמקדמים בהגדרות המערכת יתוקנו.'
      when coalesce(v_flagged, 0) = 0 then 'אין דיילות מתחת לסף בתקופה שנבחרה.'
      when coalesce(v_red, 0) = 0 then 'להזהיר את ' || to_char(coalesce(v_amber, 0), 'FM999,999,999') || ' דיילות הענבר — אף אחת אינה אדומה החודש.'
      else 'לא לשלוח את ' || to_char(coalesce(v_red, 0), 'FM999,999,999') || ' הדיילות האדומות — ' || to_char(coalesce(v_red_active, 0), 'FM999,999,999') ||
           ' מהן פעילות ומוצעות היום בשיבוץ; ' || to_char(coalesce(v_amber, 0), 'FM999,999,999') || ' דיילות ענבר לאזהרה.' end,
    'definitions', 'הגדרות: ציון אמינות = (סכום ערכי-הנוכחות + ' || coalesce(v_m::text, '—') || ' × ' ||
      coalesce(round(v_c, 4)::text, '—') || ') ÷ (מספר המשמרות + ' || coalesce(v_m::text, '—') ||
      ') — ממוצע ממותן אל ממוצע החברה · איחור נספר לפי דרגה: קל אינו מוריד מהציון, בינוני מוריד רבע, רב מוריד חצי · ' ||
      'שתי עמודות אי-ההגעה, ואף אחת מהן אינה "הנכונה": "הבריזה · ב-12 חודשים" היא ההגדרה שהציון עצמו עובד לפיה — רק אי-הגעה בלי הודעה, ורק בחלון הקפוא · ' ||
      '"אי-הגעה · אי-פעם" היא כל סיבות אי-ההגעה — כולל מחלה והיעדרות באישור — ועל כל ההיסטוריה. שתיהן נכונות בהגדרתן, והדוח אינו בוחר ביניהן · ' ||
      'הבריזה = לא הגיעה ולא הודיעה — רק היא מאפסת את הציון של אותה משמרת · ' ||
      'ביטלה אחרי אישור = הודיעה שלא תגיע אחרי שכבר אושרה סופית — נספר כחצי משמרת · ' ||
      'החלון = 12 חודשים אחורה מהיום, קפוא ואינו נגרר אחרי מסנן-התקופה · ' ||
      -- 🪤 I2 · **הדף אמר "אדומה" ו"ענבר" שלוש פעמים ולא אמר מעולם במה מדובר
      --    במספרים** — המספרים ישבו ב-`meta.red_threshold`/`amber_threshold` ולא הגיעו למסך,
      --    ומבחן-המחיקה של C3 נכשל בדיוק במקום שבו הסף הוא שמניע את הפעולה.
      --    הנוסח מועתק ממ14, שכבר מדפיס אותם במלואם — שתי לשוניות, נוסח אחד.
      --    ➕ ומשפט הכרעה 38: הציון הוא reliabilityScore של Smart Match מילה-במילה.
      -- ⚠️ כשהמקדמים פגומים אין ספים כלל (`v_bands_on` = false) — ואז המשפט
      --    אומר זאת במפורש במקום להדפיס `—%`.
      case when v_bands_on then
        'דיילת אדומה = ציון-אמינות נמוך מ-' || trim_scale(v_red_coef * 100) ||
        '% ממוצע החברה (' || round(v_c, 4) || '), כלומר מתחת ל-' ||
        round(v_red_coef * v_c, 4) || ' · דיילת ענבר = מתחת ל-' ||
        trim_scale(v_amber_coef * 100) || '% ממנו, כלומר מתחת ל-' ||
        round(v_amber_coef * v_c, 4)
      else 'סימון האמינות כבוי — אין ספים פעילים עד שהמקדמים בהגדרות המערכת יתוקנו' end || ' · ' ||
      -- 🪤 J1 · **המשפט הדפיס למשתמשת-הקצה מזהה-קוד (`reliabilityScore`) ומספר-הכרעה
      --    פנימי (הכרעה 38)** — שניהם דברים שאי-אפשר לעשות איתם דבר במסך, ו-D-34 ④
      --    כבר הסיר בדיוק את "(הכרעה 36)" ממשפטי-האוכלוסייה. המשמעות נשמרת במלואה:
      --    זהו אותו ציון של השיבוץ, ולא מדד שנולד לדוח.
      'הציון הוא בדיוק אותה נוסחה שמדרגת את הדיילות בשיבוץ, ולא מדד שנולד לדוח הזה.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', to_jsonb(v_missing),
      'frozen_count', null,
      'notes', v_notes || to_jsonb(
        ('מתחת לסף המדגם: ' || to_char(coalesce(v_below, 0), 'FM999,999,999') || ' דיילות עם פחות מ-' ||
         coalesce(to_char(v_min_sample, 'FM999,999,999'), '—') || ' משמרות מסומנות אינן בדוח (' ||
         to_char(coalesce(v_shifts_out, 0), 'FM999,999,999') || ' שיבוצים).')::text),
      'run', null,
      'company_average', round(v_c, 6),
      'red_threshold', case when v_bands_on then round(v_red_coef   * v_c, 6) end,
      'amber_threshold', case when v_bands_on then round(v_amber_coef * v_c, 6) end,
      'selected_dow', v_dow,
      -- 🆕 הכרעה 37 בחתך-דירוג: האובייקט למכונה, והטבלה למסך — אותם מספרים, פעם אחת.
      'no_show_by_rating', jsonb_build_object(
        'months12', coalesce(v_ns12, '{}'::jsonb),
        'ever',     coalesce(v_ns_ever, '{}'::jsonb)),
      'extra_tables', jsonb_build_array(jsonb_build_object(
        'title', 'אי-הגעה לפי דירוג',
        'columns', jsonb_build_array(
          jsonb_build_object('key', 'rating_label', 'label', 'דירוג',      'format', 'text',    'align', 'start'),
          jsonb_build_object('key', 'months12',     'label', '12 חודשים',  'format', 'percent', 'align', 'end'),
          jsonb_build_object('key', 'ever',         'label', 'אי-פעם',     'format', 'percent', 'align', 'end')),
        'rows', coalesce(v_ns_rows, '[]'::jsonb),
        'note', 'שתי העמודות נמדדות על מכנים שונים: "12 חודשים" סופרת הבריזה בלבד מתוך השיבוצים שסומנה בהם נוכחות בחלון הקפוא, ו"אי-פעם" סופרת כל סיבות אי-ההגעה מתוך כל ההיסטוריה המסומנת. אפשר להשוות בין דירוגים בתוך עמודה, לא בין העמודות.',
        'sort', jsonb_build_object('key', 'rating_label', 'direction', 'descending'))),
      -- ‏📐9 · הקורא בפועל הוא `meta.sort` (‏`ReportSurface.jsx:253`) — ר' ההערה במ14.
      'sort', jsonb_build_object('key', 'reliability', 'direction', 'ascending'),
      -- ‏C8: תכונה של המשטח, לא של הקריאה — הדף אינו מסונן לפי לקוח אף פעם.
      'customer_filter_ignored', true,
      'drill_echo', p_drill));
end;
$function$;

comment on function public.report_m15_reliability(date, date, integer, jsonb) is
'מ11 · אמינות והתייצבות (תומך-החלטה). אוכלוסייה: דיילות עם מינימום_תשובות_להצגת_ציון משמרות מסומנות ומעלה בחלון הקפוא של 12 חודשים. הוצאו: דיילות מתחת לסף המדגם (מונה גלוי, לא אחוז), והיעדרות באישור-מראש ומחלה — לא במונה ולא במכנה. הציון הוא reliabilityScore של Smart Match מילה-במילה (הכרעה 38), והספים 0.87/0.95 מממוצע-החברה נקראים מ-params בזמן-ריצה (הכרעה 35). אי-הגעה מוצגת בשתי עמודות והדוח אינו בוחר ביניהן (הכרעה 37). החלון קפוא ואינו נגרר אחרי מסנן-התקופה.';

revoke execute on function public.report_m15_reliability(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m15_reliability(date, date, integer, jsonb) to authenticated;

create or replace function public.report_m16_quality_cost(
  p_from        date    default null,
  p_to          date    default null,
  p_customer_id integer default null,
  p_drill       jsonb   default null
) returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_today        date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to           date;
  v_from         date;
  v_notes        jsonb := '[]'::jsonb;
  v_active       integer;
  v_registered   integer;
  v_no_rating    integer;
  v_median       numeric;
  v_median_all   numeric;
  v_rating_med   numeric;
  v_expensive    integer;
  v_cheap_top    integer;
  v_blocked      integer;
  v_scatter      jsonb;
  v_bands        jsonb;
  v_rows         jsonb;
  v_no_rate      integer;
  -- סבב 3 · קצות-התעריף לציר-ה-X של הפיזור (ר' ההערה על `x_domain`).
  v_rate_min     numeric;
  v_rate_max     numeric;
  -- I1 · בידוד-כיווניות למספר שיושב בתוך משפט עברי. **m16 היא היחידה
  -- בלשונית ש-H2 לא נגעה בה**, ולכן לא היו בה קבועים כאלה כלל.
  -- ⚠️ שאר משפטי-השרת של m16 עדיין בלי בידוד — מדווח, לא מתוקן כאן.
  v_lri          constant text := chr(8294);   -- U+2066 LRI
  v_pdi_x        constant text := chr(8297);   -- U+2069 PDI
begin
  perform public.assert_module_permission('דיילות', array['edit', 'view']);

  v_to   := coalesce(p_to, v_today);
  v_from := coalesce(p_from, (v_to - interval '12 months')::date);

  if p_customer_id is not null then
    v_notes := v_notes || to_jsonb(
      'הדף אינו מושפע ממסנן הלקוח — התעריף והדירוג הם ערכי-היום בכרטיס הדיילת, ואין להם חתך לפי לקוח.'::text);
  end if;

  -- ── האוכלוסייה: פעילות בלבד, וכל המדדים נגזרים ממנה.
  select count(*) filter (where h.status = 'active'),
         count(*),
         count(*) filter (where h.status = 'active' and h.rating is null),
         count(*) filter (where h.status = 'active' and h.hourly_rate is null),
         (percentile_cont(0.5) within group (order by h.hourly_rate)
           filter (where h.status = 'active'))::numeric,
         (percentile_cont(0.5) within group (order by h.hourly_rate))::numeric,
         (percentile_cont(0.5) within group (order by h.rating::numeric)
           filter (where h.status = 'active' and h.rating is not null))::numeric,
         min(h.hourly_rate) filter (where h.status = 'active'),
         max(h.hourly_rate) filter (where h.status = 'active')
    into v_active, v_registered, v_no_rating, v_no_rate, v_median, v_median_all, v_rating_med,
         v_rate_min, v_rate_max
    from public.hostesses h;

  -- 🔴 שני הריבועים — הם **כל הדוח** (⑥ "שני הריבועים").
  --    הימני-תחתון: תעריף מעל החציון **וגם** דירוג ≤3 — על מי משלמים יותר ממה שקיבלו.
  --    השמאלי-עליון: תעריף מתחת לחציון **וגם** דירוג 5 — את מי עלולים לאבד למתחרה.
  --    ⚠️ ‏📑ב#14 מונה ריבוע אחד; הנגדי הוא תוספת מוצהרת (⑧16.7), ומדווחת.
  select count(*) filter (where h.hourly_rate > v_median and h.rating <= 3),
         count(*) filter (where h.hourly_rate < v_median and h.rating = 5)
    into v_expensive, v_cheap_top
    from public.hostesses h where h.status = 'active';

  select count(distinct chp.hostess_id)
    into v_blocked
    from public.customer_hostess_preference chp
    join public.hostesses h on h.hostess_id = chp.hostess_id and h.status = 'active'
   where chp.preference = 'לא_לשלוח';

  -- ── הפיזור: נקודה לכל דיילת פעילה. **הדגל "לא לשלוח" הוא צורה ולא רק צבע** (📐19 · ב15),
  --    ולכן הוא יוצא כשדה בוליאני ולא כרמז-צבע. חסרות-דירוג יוצאות עם `rating: null` —
  --    ‏📐6 נועל `domain 1–5`, והן יושבות ברצועה נפרדת מתחת לציר (⑧16.2).
  with marks as (
    select chp.hostess_id,
           count(*) filter (where chp.preference = 'מצוינת')    excellent,
           count(*) filter (where chp.preference = 'לא_לשלוח')  blocked,
           count(distinct chp.customer_id)                      marked_by
      from public.customer_hostess_preference chp group by chp.hostess_id
  ), worked as (
    select a.hostess_id, count(distinct p.customer_id) customers, count(*) shifts
      from public.assignments a
      join public.projects p on p.project_id = a.project_id
     where a.assignment_status = 'finally_approved'
       and a.event_date > v_from and a.event_date <= least(v_to, v_today)
     group by a.hostess_id
  )
  select jsonb_agg(jsonb_build_object(
           'hostess_id',   h.hostess_id,
           'hostess_name', h.full_name,
           'hourly_rate',  h.hourly_rate,
           'rating',       h.rating,
           'blocked',      coalesce(m.blocked, 0) > 0,
           'shifts',       coalesce(w.shifts, 0)
         ) order by h.hourly_rate desc, h.full_name),
         jsonb_agg(jsonb_build_object(
           -- ‏`drill_key` אחיד בכל הלשוניות — `{kind, id}` (תיקון-חוזה C8).
           'drill_key',        jsonb_build_object('kind', 'hostess', 'id', h.hostess_id),
           'hostess_name',     h.full_name,
           'city',             h.city,
           'hourly_rate',      h.hourly_rate,
           'rating',           h.rating,
           'shifts',           coalesce(w.shifts, 0),
           'excellent_marks',  coalesce(m.excellent, 0),
           'blocked_marks',    coalesce(m.blocked, 0),
           'customers_worked', coalesce(w.customers, 0)
         ) order by coalesce(w.shifts, 0) desc, h.full_name)
    -- 🔴 **כל 50 הפעילות חוזרות, ולא 17 בלבד** (F2, 16/09/2026). עד כאן ה-SQL החיל את
    --    **ברירת-המחדל של הלקוח** (`filter (where h.rating is null)`) וזרק את השאר ⇒
    --    כיבוי השבב `#onlyNoRating`, שכל תפקידו *"מחליף בין 17 חסרות-הדירוג ל-50
    --    הפעילות"* (כרטיס ① מ16 שורה 7), החזיר טבלה ריקה ולא היה פרמטר לבקש את השאר.
    --    ⇒ השרת מחזיר את האוכלוסייה, הלקוח מחזיק את המסנן, והפאג'ר סופר את מה שמוצג
    --    (‏📐8). ‏`meta.default_filter` אומר ללשונית באיזה מצב להיפתח.
    into v_scatter, v_rows
    from public.hostesses h
    left join marks m  on m.hostess_id = h.hostess_id
    left join worked w on w.hostess_id = h.hostess_id
   where h.status = 'active';

  -- רצועות התעריף לפי דירוג — **ממוצע**, כפי שכותרת-הטבלה הנגישה נוקבת,
  -- בסדר 5→4→3→ללא-דירוג: אותו כיוון שבו נקרא ציר-ה-Y (§ד).
  select jsonb_agg(jsonb_build_object(
           'rating', rating, 'n', n, 'avg_rate', avg_rate, 'median_rate', median_rate)
         order by case when rating is null then -1 else rating end desc)
    into v_bands
    from (
      select h.rating,
             count(*) n,
             round(avg(h.hourly_rate), 2) avg_rate,
             round(percentile_cont(0.5) within group (order by h.hourly_rate)::numeric, 2) median_rate
        from public.hostesses h where h.status = 'active' group by h.rating
    ) s;

  if v_no_rate > 0 then
    v_notes := v_notes || to_jsonb(
      (v_no_rate || ' דיילות פעילות ללא תעריף שעתי אינן על הפיזור.')::text);
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', coalesce(v_active, 0),
      -- 🪤 I1 · מחלקת-הכמות דרך `to_char` בלי קשר לגודל (ר' ההערה במ14). no-op היום.
      'label', 'אוכלוסייה: דיילות פעילות בלבד — n=' || to_char(coalesce(v_active, 0), 'FM999,999,999') || ' מתוך ' ||
               to_char(coalesce(v_registered, 0), 'FM999,999,999') || ' רשומות · הוצאו: ' || to_char(coalesce(v_registered - v_active, 0), 'FM999,999,999') ||
               ' דיילות שסטטוסן "לא פעילה", כי אין החלטת-תעריף לקבל עליהן · התעריף והדירוג הם ערכי-היום בכרטיס הדיילת, לא ממוצע היסטורי.',
      'excluded', jsonb_build_object('לא פעילה', coalesce(v_registered - v_active, 0))),
    'window', jsonb_build_object('from', v_from, 'to', v_to,
      'label', 'נכון ל-' || to_char(v_today, 'DD/MM/YYYY') || ' · ספירת המשמרות ב-12 החודשים האחרונים'),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'no_rating', 'label', 'דיילות בלי דירוג', 'value', v_no_rating, 'format', 'int',
        'window', 'נכון ל-' || to_char(v_today, 'DD/MM/YYYY'),
        'compare', null, 'target', null,
        'sub', 'מתוך ' || to_char(coalesce(v_active, 0), 'FM999,999,999') || ' הדיילות הפעילות'),
      jsonb_build_object('key', 'median_rate', 'label', 'תעריף שעתי חציוני', 'value', round(v_median, 2), 'format', 'money',
        'window', 'נכון ל-' || to_char(v_today, 'DD/MM/YYYY'),
        'compare', case when v_median_all is null then null else jsonb_build_object(
          'value', round(v_median_all, 2), 'label', 'חציון כלל המאגר (' || coalesce(v_registered, 0) || ')',
          'direction', case when v_median > v_median_all then 'up' when v_median < v_median_all then 'down' else 'flat' end) end,
        'target', null,
        'sub', 'על ' || to_char(coalesce(v_active, 0), 'FM999,999,999') || ' הדיילות הפעילות'),
      jsonb_build_object('key', 'expensive_low_rated', 'label', 'יקרות ומדורגות נמוך', 'value', v_expensive, 'format', 'int',
        'window', 'נכון ל-' || to_char(v_today, 'DD/MM/YYYY'),
        'compare', null,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'report_m15_reliability', 'drill', null),
        -- 🪤 J1 · **התעריף החציוני הודפס כאן בשתי ספרות ובלי ₪** (43.27) בזמן שהאריח
        --    שלצידו אומר *"תעריף שעתי חציוני 43 ₪"* וקו-הייחוס שבגרף אומר *"חציון
        --    התעריף 43 ₪"* — אותו מספר בשלוש צורות על מסך אחד. 📐4 · D-34 ⑤:
        --    תעריף-לשעה בשקלים שלמים בכל מקום. הנוסח מועתק מקו-הייחוס שמתחת,
        --    כדי ששני המשפטים ייבנו מאותה נוסחה ולא משתיים.
        'sub', 'תעריף מעל החציון (' || coalesce(to_char(round(v_median), 'FM999,999,999') || ' ₪', '—') || ') וגם דירוג 3 ומטה'),
      jsonb_build_object('key', 'blocked', 'label', 'מסומנות "לא לשלוח"', 'value', v_blocked, 'format', 'int',
        'window', 'כל הזמנים',
        'compare', null, 'target', null,
        'sub', 'אצל לקוח אחד לפחות, מתוך ' || to_char(coalesce(v_active, 0), 'FM999,999,999') || ' הפעילות')),
    'chart', jsonb_build_object(
      'type', 'scatter', 'title', 'תעריף שעתי מול דירוג · הדיילות הפעילות',
      -- 🪤 I1 · **החסרות-דירוג נעלמות מהגרף בלי שמץ של עקבה.** הן כן ב-`data`
      --    עם `rating: null`, אבל נקודה בלי `y` אינה מצוירת — וכותרת-הגרף אומרת הפעילות
      --    ‏(50) בעוד על הציר יושבות פחות. המוקאפ צייר להן רצועה נפרדת מתחת לציר;
      --    לרכיב אין רצועה כזו, ולכן ההעדר **נאמר במילים** — עדיף על השמטה שקטה.
      'note', v_lri || to_char(coalesce(v_no_rating, 0), 'FM999,999,999') || v_pdi_x ||
              ' דיילות ללא דירוג אינן בגרף — ראי את השבב ''בלי דירוג בלבד'' בטבלה.',
      -- 🔴 **בפיזור, `series` הוא זוג ולא יחיד** (F2): הרנדרר `ScatterBody`
      --    (‏`src/modules/11_reports/components/ChartCard.jsx:283-297`) קורא
      --    `series[0].label` כשם ציר-ה-X ו-**`series[1].key` כעמודת-ה-Y**. עם איבר אחד
      --    ‏`series[1]` הוא `undefined`, ציר-ה-Y נקשר ל-`dataKey="y"`, ולאף אחת מ-50
      --    הנקודות אין שדה כזה ⇒ **פיזור בלי ציר-Y, בלי שגיאה ובלי בדיקה אדומה**, בדף
      --    שכרטיסו ⑥ קורא לו *"שני הריבועים … הם כל הדוח"*.
      -- 🪤 I1 · **בפיזור זה היה פגם נראה:** `ScatterBody` גוזר את ציר-X מ-
      --    ‏`series[0].format ?? unit` ואת ציר-Y מ-`series[1].format ?? unit`. שתיהן היו
      --    ‏`null` ⇒ **שני הצירים נפלו ל-`unit` = 'money'**, וציר-הדירוג (טווח 1–5)
      --    סומן כשקלים. עכשיו כל ציר מצהיר על עצמו.
      'series', jsonb_build_array(
        jsonb_build_object('key', 'hourly_rate', 'label', 'תעריף שעתי', 'format', 'money'),
        jsonb_build_object('key', 'rating',      'label', 'דירוג',      'format', 'int')),
      'data', coalesce(v_scatter, '[]'::jsonb), 'xKey', 'hourly_rate',
      -- 🪤 סבב 3 · **הכרעה על 📐5 לציר של תעריף:** ציר-מאפס הוא לסכומים,
      --    לספירות ולכסף. **תעריף שעתי הוא שיעור**, וכל הדיילות יושבות
      --    בטווח צר — על ציר שמתחיל ב-0 כל הנקודות נדחסות לקצה הימני
      --    והפיזור מפסיק לפזר. ⇒ **`x_domain` נגזר חי** מקצות-התעריף,
      --    עם שקל מרווח מכל צד. ‏`domain` (ציר-Y, הדירוג) נשאר `[1,5]`.
      --    ⚠️ המפתח תוספתי — המעטפת מוסיפה לו תמיכה במקביל.
      'x_domain', case when v_rate_min is null or v_rate_max is null then null
                       else jsonb_build_array(floor(v_rate_min) - 1, ceil(v_rate_max) + 1) end,
      'domain', jsonb_build_array(1, 5),
      'refLines', jsonb_build_array(
        -- 🪤 I1 · התווית הדפיסה `43.27 ₪` ליד טבלה שמדפיסה שקלים שלמים — ו-📐4
        --    קובע *"₪ בלי אגורות בכל מקום"*. ⇒ **התווית** מעוגלת לשקל שלם,
        --    ו-`value` — המיקום שבו הקו נמתח על הציר — **נשאר ללא עיגול**.
        --    ⚠️ המוקאפ המאושר מצייר `43.27 ₪` — סתירה מדווחת בין רמה 4 ל-📐4.
        jsonb_build_object('axis', 'x', 'value', round(v_median, 2),
          'label', 'חציון התעריף ' || coalesce(to_char(round(v_median), 'FM999,999,999'), '—') || ' ₪'),
        jsonb_build_object('axis', 'y', 'value', v_rating_med,
          'label', 'חציון הדירוג · ' || coalesce(v_rating_med::text, '—'))),
      'unit', 'money'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'hostess_name',    'label', 'דיילת',         'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'city',            'label', 'עיר',           'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'hourly_rate',     'label', 'תעריף שעתי',    'format', 'money', 'align', 'end'),
      jsonb_build_object('key', 'rating',          'label', 'דירוג',         'format', 'int',   'align', 'end'),
      jsonb_build_object('key', 'shifts',          'label', 'משמרות',        'format', 'int',   'align', 'end'),
      jsonb_build_object('key', 'excellent_marks', 'label', 'מצוינת אצל',    'format', 'int',   'align', 'end'),
      jsonb_build_object('key', 'blocked_marks',   'label', 'לא לשלוח אצל',  'format', 'int',   'align', 'end')),
    'rows', coalesce(v_rows, '[]'::jsonb),
    'so_what', case
      when coalesce(v_expensive, 0) = 0 and coalesce(v_no_rating, 0) = 0
        then 'אין דיילת שהתעריף שלה חורג מהדירוג — אין החלטת-תעריף פתוחה החודש.'
      when coalesce(v_expensive, 0) = 0
        then 'לדרג את ' || to_char(coalesce(v_no_rating, 0), 'FM999,999,999') || ' הדיילות הפעילות שאין להן דירוג — בלעדיו אי-אפשר לומר אם התעריף שלהן נכון.'
      else 'להוריד את התעריף של ' || to_char(coalesce(v_expensive, 0), 'FM999,999,999') || ' הדיילות שמעל חציון-המאגר בדירוג 3 ומטה, או להפסיק לשלוח אותן; ובמקביל לדרג את ' ||
           to_char(coalesce(v_no_rating, 0), 'FM999,999,999') || ' הפעילות שאין להן דירוג.' end,
    'definitions', 'הגדרות: תעריף שעתי = הערך הנוכחי בכרטיס הדיילת, ולא התעריף שנשמר בשיבוץ שכבר בוצע — ולכן הוא מתאר כמה היא עולה מהיום והלאה, וזו השאלה שהדף שואל · ' ||
      'דירוג = הערכת 1 עד 5 שהוזנה ידנית בכרטיס הדיילת; אין לה היסטוריה · ' ||
      'חציון ולא ממוצע — דיילת אחת יקרה במיוחד אינה מזיזה אותו · ' ||
      '"מצוינת" / "לא לשלוח" = סימון שלקוח נתן לדיילת מסוימת; לאותה דיילת יכולים להיות שני הסימונים אצל לקוחות שונים · ' ||
      'משמרת = שיבוץ שאושר סופית ושתאריך האירוע שלו כבר עבר, ב-12 החודשים האחרונים.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', '[]'::jsonb,
      'frozen_count', null,
      'notes', v_notes,
      'run', null,
      'rate_by_rating', coalesce(v_bands, '[]'::jsonb),
      'cheap_top_rated', v_cheap_top,
      'median_rate_active', round(v_median, 2),
      'median_rate_all', round(v_median_all, 2),
      -- ‏📐8 · כרטיס ① מ16 שורה 7 + ⑩ עוגן ג: הטבלה **נפתחת** מסוננת לחסרות-הדירוג,
      --    והשבב מחליף בין 17 ל-50. המסנן חי בלקוח; השרת רק אומר במה להיפתח וכמה הן.
      'default_filter', 'no_rating',
      'no_rating_count', v_no_rating,
      'row_total', coalesce(v_active, 0),
      -- ‏📐9 · הקורא בפועל הוא `meta.sort` (‏`ReportSurface.jsx:253`) — ר' ההערה במ14.
      'sort', jsonb_build_object('key', 'shifts', 'direction', 'descending'),
      -- ‏C8: תכונה של המשטח, לא של הקריאה.
      'customer_filter_ignored', true,
      'drill_echo', p_drill));
end;
$function$;

comment on function public.report_m16_quality_cost(date, date, integer, jsonb) is
'מ11 · איכות מול עלות (תומך-החלטה). אוכלוסייה: דיילות פעילות בלבד — הוצאו הדיילות שסטטוסן "לא פעילה", כי אין החלטת-תעריף לקבל עליהן. התעריף והדירוג הם ערכי-היום בכרטיס הדיילת (hourly_rate הנוכחי, לא hourly_rate_snapshot), ואין להם היסטוריה. חציון-התעריף מחושב על הפעילות בלבד ולא על כלל המאגר. ספירת המשמרות היא finally_approved שתאריך האירוע שלהן עבר, בחלון חצי-פתוח (from, to].';

revoke execute on function public.report_m16_quality_cost(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m16_quality_cost(date, date, integer, jsonb) to authenticated;

create or replace function public.report_m20_satisfaction(
  p_from        date    default null,
  p_to          date    default null,
  p_customer_id integer default null,
  p_drill       jsonb   default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_today     date := (now() at time zone 'Asia/Jerusalem')::date;
  -- why (G2-בידוד): בידוד-כיווניות לכל רצף-ספרות בתוך משפט עברי — התאום של `isolateLtr`
  -- (`src/lib/reportsFormat.js`) ושל `v_lri`/`v_pdi` במיגרציות E2/F2. **נמדד 16/09/2026:**
  -- "2,786,544 ₪" חזר מהשרת בתוך משפט עברי בלי בידוד, וזה בדיוק המקרה ש-F5 של E2 תיקן.
  v_lri        constant text := chr(8294);   -- U+2066 LRI
  v_pdi        constant text := chr(8297);   -- U+2069 PDI
  v_to        date;
  v_from      date;
  v_p_from    date;
  v_p_to      date;
  v_notes     jsonb := '[]'::jsonb;
  v_completed integer;
  v_satisfied integer;
  v_no_resp   integer;
  v_not_sent  integer;
  v_held      integer;
  v_avg       numeric;
  v_with_neg  integer;
  v_with_pos  integer;
  v_p_comp    integer;
  v_p_sat     integer;
  v_p_no      integer;
  v_p_avg     numeric;
  v_p_neg     integer;
  v_dist      jsonb;
  v_pos       jsonb;
  v_neg       jsonb;
  v_years     jsonb;
  v_rows      jsonb;
  v_max_tags  integer;
  v_top_neg   text;
  v_top_neg_n integer;
  v_other_n   integer;
  v_rest_n    integer;
begin
  perform public.assert_module_permission('לקוחות', array['edit', 'view']);

  v_to     := coalesce(p_to, v_today);
  v_from   := coalesce(p_from, date_trunc('year', v_to)::date);
  -- 📐1 — תקופה-קודמת **אמיתית**: אותו טווח בדיוק, שנה אחורה. "—" מותר רק כשאין שינוי,
  -- לא כשלא נמדד; ולכן אין כאן אריח בלי בסיס-השוואה.
  v_p_from := (v_from - interval '1 year')::date;
  v_p_to   := (v_to   - interval '1 year')::date;

  -- ── האריחים ושורת-האוכלוסייה, בתקופה ובתקופה הקודמת ─────────────────────────
  select count(*) filter (where p.feedback_status = 'completed'),
         count(*) filter (where p.feedback_status = 'completed' and p.feedback_score >= 4),
         count(*) filter (where p.feedback_status = 'no_response'),
         count(*) filter (where p.feedback_status = 'not_sent' and p.project_status <> 'cancelled'),
         count(*) filter (where p.project_status <> 'cancelled'),
         round((avg(p.feedback_score) filter (where p.feedback_status = 'completed'))::numeric, 2),
         count(*) filter (where p.feedback_status = 'completed'
                            and coalesce(array_length(p.negative_feedback_reasons, 1), 0) > 0),
         count(*) filter (where p.feedback_status = 'completed'
                            and coalesce(array_length(p.positive_feedback_reasons, 1), 0) > 0)
    into v_completed, v_satisfied, v_no_resp, v_not_sent, v_held, v_avg, v_with_neg, v_with_pos
    from public.projects p
   where p.final_event_date between v_from and v_to
     and (p_customer_id is null or p.customer_id = p_customer_id);

  select count(*) filter (where p.feedback_status = 'completed'),
         count(*) filter (where p.feedback_status = 'completed' and p.feedback_score >= 4),
         count(*) filter (where p.feedback_status = 'no_response'),
         round((avg(p.feedback_score) filter (where p.feedback_status = 'completed'))::numeric, 2),
         count(*) filter (where p.feedback_status = 'completed'
                            and coalesce(array_length(p.negative_feedback_reasons, 1), 0) > 0)
    into v_p_comp, v_p_sat, v_p_no, v_p_avg, v_p_neg
    from public.projects p
   where p.final_event_date between v_p_from and v_p_to
     and (p_customer_id is null or p.customer_id = p_customer_id);

  -- ── התפלגות 1–5 · **ציון שלא ניתן אף פעם מצויר בגובה אפס** (כרטיס ④③) ───────
  select coalesce(jsonb_agg(jsonb_build_object('score', s.score, 'n', coalesce(d.n, 0))
                            order by s.score), '[]'::jsonb)
    into v_dist
    from generate_series(1, 5) as s(score)
    left join (select p.feedback_score as score, count(*)::integer as n
                 from public.projects p
                where p.feedback_status = 'completed' and p.feedback_score is not null
                  and p.final_event_date between v_from and v_to
                  and (p_customer_id is null or p.customer_id = p_customer_id)
                group by p.feedback_score) d on d.score = s.score;

  -- ── סיבות חיוביות ושליליות · 📐7: ספירה יורדת, **"אחר" אחרון תמיד** ──────────
  -- ⚠️ קטגוריה קיימת שאיש לא בחר בה נשארת ברשימה עם 0 — היא **נאמרת** ואינה נעלמת בשקט.
  select coalesce(jsonb_agg(jsonb_build_object('reason', t.reason, 'n', t.n)
                            order by (t.reason = 'אחר'), t.n desc, t.reason), '[]'::jsonb)
    into v_pos
    from (select r.reason, count(p.project_id)::integer as n
            from unnest(array['מקצועיות הדיילות', 'עמידה בזמנים', 'איכות תגים וציוד',
                              'ניהול ותקשורת', 'אחר']) as r(reason)
            left join public.projects p
              on p.feedback_status = 'completed'
             and r.reason = any (p.positive_feedback_reasons)
             and p.final_event_date between v_from and v_to
             and (p_customer_id is null or p.customer_id = p_customer_id)
           group by r.reason) t;

  select coalesce(jsonb_agg(jsonb_build_object('reason', t.reason, 'n', t.n)
                            order by (t.reason = 'אחר'), t.n desc, t.reason), '[]'::jsonb)
    into v_neg
    from (select r.reason, count(p.project_id)::integer as n
            from unnest(array['איחור דיילות', 'תפקוד דיילות', 'איכות תגים',
                              'ניהול לקוי', 'אחר']) as r(reason)
            left join public.projects p
              on p.feedback_status = 'completed'
             and r.reason = any (p.negative_feedback_reasons)
             and p.final_event_date between v_from and v_to
             and (p_customer_id is null or p.customer_id = p_customer_id)
           group by r.reason) t;

  select (v_neg #>> '{0,reason}'), (v_neg #>> '{0,n}')::integer into v_top_neg, v_top_neg_n;

  select coalesce(sum(case when e.value ->> 'reason' = 'אחר' then (e.value ->> 'n')::integer else 0 end), 0),
         coalesce(sum(case when e.value ->> 'reason' = 'אחר' then 0 else (e.value ->> 'n')::integer end), 0)
    into v_other_n, v_rest_n
    from jsonb_array_elements(v_neg) as e(value);

  -- ── מגמה שנתית · **מתעלמת ממסנן התקופה במפורש** (📑ב#17 · 📐3) ───────────────
  select coalesce(jsonb_agg(jsonb_build_object(
           'year', t.y, 'satisfied_share', t.share, 'n', t.n,
           'partial', t.y = extract(year from v_to)::integer) order by t.y), '[]'::jsonb)
    into v_years
    from (select extract(year from p.final_event_date)::integer as y,
                 count(*)::integer                              as n,
                 round(100.0 * count(*) filter (where p.feedback_score >= 4)
                       / nullif(count(*), 0), 1)                as share
            from public.projects p
           where p.feedback_status = 'completed' and p.feedback_score is not null
             and p.final_event_date <= v_to
             and (p_customer_id is null or p.customer_id = p_customer_id)
           group by 1) t;

  -- ── הטבלה · המשובים שסימנו סיבה שלילית, **ציון עולה** (📐7 — הנמוך ראשון) ────
  -- ⚠️ `feedback_notes` הוא טקסט שגורם חיצוני כתב. הוא חוזר כדאטה; הלשונית מרנדרת
  -- אותו כטקסט (`{note}`) ולעולם לא כ-HTML (כרטיס ⑨ מ20).
  select coalesce(jsonb_agg(t.row order by t.feedback_score, t.final_event_date desc, t.project_id), '[]'::jsonb)
    into v_rows
    from (select p.project_id, p.feedback_score, p.final_event_date,
                 jsonb_build_object(
                   'drill_key',        jsonb_build_object('kind', 'project', 'id', p.project_id),
                   'project_id',       p.project_id,
                   'event_name',       p.event_name,
                   'company_name',     c.company_name,
                   'final_event_date', p.final_event_date,
                   'feedback_score',   p.feedback_score,
                   'reasons',          to_jsonb(p.negative_feedback_reasons),
                   -- why (G3): שדה-החיבור של הסינון-הצולב מגרף "מה מכעיס". המעטפת משווה
                   -- `String(row[filter_key]) === String(datum[xKey])` — סקלר מול סקלר,
                   -- ולכן `reasons` (מערך) אינו יכול לשמש. נמדד 16/09/2026 על כל הטבלה:
                   -- `max(array_length(negative_feedback_reasons,1)) = 1`, אפס משובים
                   -- רב-סיבתיים ⇒ האיבר הראשון הוא הסיבה. השדה אינו מוצהר ב-`columns[]`
                   -- (`ReportTable` מרנדר רק עמודות מוצהרות) — הוא שדה-שורה נסתר בלבד.
                   'negative_reason',  p.negative_feedback_reasons[1],
                   'feedback_notes',   nullif(btrim(coalesce(p.feedback_notes, '')), '')) as row
            from public.projects p
            left join public.customers c on c.customer_id = p.customer_id
           where p.feedback_status = 'completed'
             and coalesce(array_length(p.negative_feedback_reasons, 1), 0) > 0
             and p.final_event_date between v_from and v_to
             and (p_customer_id is null or p.customer_id = p_customer_id)) t;

  -- ── 📐11 · הצהרת-רב-ערכיות **מותנית במדידה ולא מוצהרת מראש** ────────────────
  -- 🔴 הכלל נוקב במשפט "סכום הספירות עולה על מספר המשובים", והמדידה של 10/09/2026
  -- הראתה שזה **אינו נכון כאן** — בכל המשובים נבחרה בדיוק סיבה אחת. כתיבת המשפט
  -- כלשונו הייתה אמירה שקרית על המסך, ולכן הוא נגזר ממה שנמדד עכשיו.
  select coalesce(max(greatest(coalesce(array_length(p.negative_feedback_reasons, 1), 0),
                               coalesce(array_length(p.positive_feedback_reasons, 1), 0))), 0)
    into v_max_tags
    from public.projects p
   where p.feedback_status = 'completed'
     and p.final_event_date between v_from and v_to
     and (p_customer_id is null or p.customer_id = p_customer_id);

  v_notes := v_notes || to_jsonb(
    case when v_max_tags > 1
      then 'הטופס מאפשר יותר מסיבה אחת, ובפועל יש משוב שסימן יותר מאחת — ולכן סכום הספירות עולה על מספר המשובים.'
      else 'הטופס מאפשר יותר מסיבה אחת; בפועל, בכל המשובים בתקופה נבחרה בדיוק אחת.'
    end::text);
  v_notes := v_notes
    || to_jsonb('גרף המגמה השנתית מתעלם ממסנן התקופה במכוון ומציג את כל השנים.'::text)
    -- 🪤 J1 · **שני דברים שאסור להם להיות על המסך היו כאן במשפט אחד:** '(📐11)' הוא
    --    קוד-כלל (כ4 שולח אותו להערת-HTML, וזו הדליפה היחידה מסוגה בכל 16 המשטחים),
    --    ו-'N מתוך M' מבקש מעובדת-שבוע-ראשון לקרוא שתי אותיות לטיניות כמספרים.
    --    המוסכמה נאמרת עכשיו במילים. את הסייג של רב-הסיבות נושאת ההערה שמעל
    --    (`v_max_tags`), ולכן המשפט הזה אינו חוזר עליו (R27).
    || to_jsonb('הספירות מוצגות כ"כמה מתוך כמה" ולא באחוזים.'::text);
  if p_drill is not null then
    v_notes := v_notes || to_jsonb('הדף אינו דוח-קידוח (📐13) — פרמטר הקידוח לא הופעל.'::text);
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_completed,
      'label', 'אוכלוסייה: משובים שהלקוח מילא · הוצאו: ' || v_lri || to_char(v_no_resp, 'FM999,999,999') || v_pdi
               || ' שנשלחו ולא נענו ו-' || v_lri || to_char(v_not_sent, 'FM999,999,999') || v_pdi || ' שלא נשלחו כלל · '
               || v_lri || 'n=' || to_char(v_completed, 'FM999,999,999') || v_pdi || ', מתוך ' || v_lri || to_char(v_held, 'FM999,999,999') || v_pdi
               || ' האירועים שהתקיימו בתקופה. שיעור המענה מחושב על אוכלוסייה אחרת — מילאו ועוד לא-נענו, '
               || v_lri || to_char((v_completed + v_no_resp), 'FM999,999,999') || v_pdi || ' משובים.',
      'excluded', jsonb_build_object('נשלח ולא נענה', v_no_resp, 'לא נשלח כלל', v_not_sent)),
    'window', jsonb_build_object(
      'from', v_from, 'to', v_to,
      'label', v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi
               || ' · ' || case when p_customer_id is null then 'כל הלקוחות' else 'לקוח נבחר' end),
    'tiles', jsonb_build_array(
      jsonb_build_object(
        'key', 'satisfied_share',
        'label', 'שיעור המרוצים (4–5)',
        'value', round(100.0 * v_satisfied / nullif(v_completed, 0), 1),
        'format', 'percent',
        'sub', v_lri || to_char(v_satisfied, 'FM999,999,999') || v_pdi || ' מתוך ' || v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' משובים',
        'detail', jsonb_build_object('satisfied', v_satisfied, 'completed', v_completed),
        'window', v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi,
        'compare', jsonb_build_object(
          'value', round(100.0 * v_p_sat / nullif(v_p_comp, 0), 1),
          'label', 'אשתקד באותו טווח (' || v_lri || to_char(v_p_sat, 'FM999,999,999') || v_pdi || ' מתוך '
                   || v_lri || to_char(v_p_comp, 'FM999,999,999') || v_pdi || ')',
          'direction', case
            when v_p_comp = 0 or v_completed = 0 then 'flat'
            when 1.0 * v_satisfied / v_completed > 1.0 * v_p_sat / v_p_comp then 'up'
            when 1.0 * v_satisfied / v_completed < 1.0 * v_p_sat / v_p_comp then 'down'
            else 'flat' end),
        'target', null),
      jsonb_build_object(
        'key', 'response_rate',
        'label', 'שיעור המענה למשוב',
        'value', round(100.0 * v_completed / nullif(v_completed + v_no_resp, 0), 1),
        'format', 'percent',
        'sub', v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' מולאו מתוך '
               || v_lri || to_char((v_completed + v_no_resp), 'FM999,999,999') || v_pdi || ' שנשלחו',
        'detail', jsonb_build_object('completed', v_completed, 'sent', v_completed + v_no_resp),
        'window', v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi,
        'compare', jsonb_build_object(
          'value', round(100.0 * v_p_comp / nullif(v_p_comp + v_p_no, 0), 1),
          'label', 'אשתקד באותו טווח (' || v_lri || to_char(v_p_comp, 'FM999,999,999') || v_pdi || ' מתוך '
                   || v_lri || to_char((v_p_comp + v_p_no), 'FM999,999,999') || v_pdi || ')',
          'direction', case
            when v_p_comp + v_p_no = 0 or v_completed + v_no_resp = 0 then 'flat'
            when 1.0 * v_completed / (v_completed + v_no_resp) > 1.0 * v_p_comp / (v_p_comp + v_p_no) then 'up'
            when 1.0 * v_completed / (v_completed + v_no_resp) < 1.0 * v_p_comp / (v_p_comp + v_p_no) then 'down'
            else 'flat' end),
        'target', null),
      jsonb_build_object(
        'key', 'average_score',
        'label', 'ממוצע הציון (1–5)',
        'value', v_avg,
        'format', 'ratio',
        'sub', 'על ' || v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' משובים · מדד משני לשיעור-המרוצים',
        'detail', jsonb_build_object('completed', v_completed),
        'window', v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi,
        'compare', jsonb_build_object(
          'value', v_p_avg,
          'label', 'אשתקד באותו טווח',
          'direction', case when v_avg is null or v_p_avg is null then 'flat'
                            when v_avg > v_p_avg then 'up'
                            when v_avg < v_p_avg then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object(
        'key', 'with_negative_reason',
        'label', 'משובים שסימנו סיבה שלילית',
        'value', v_with_neg,
        'format', 'int',
        'sub', 'מתוך ' || v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' — ו-'
               || v_lri || to_char(v_with_pos, 'FM999,999,999') || v_pdi || ' סימנו סיבה חיובית',
        'detail', jsonb_build_object('with_negative', v_with_neg, 'completed', v_completed),
        'window', v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi,
        'compare', jsonb_build_object(
          'value', v_p_neg,
          -- 🪤 I2 · התווית פתחה באותו מספר שהערך נושא (`27: 27`).
          'label', 'אשתקד באותו טווח, מתוך '
                   || v_lri || to_char(v_p_comp, 'FM999,999,999') || v_pdi || ' משובים',
          'direction', case when v_with_neg > v_p_neg then 'up'
                            when v_with_neg < v_p_neg then 'down' else 'flat' end),
        'target', null)),
    -- 🔴 **ארבעה גרפים ולא שניים** — ר' "פער 2" בכותרת הקובץ: המוקאפ המאושר מצייר
    -- ארבעה, ו-📑ב#17 אוסר במפורש לאחד את שני גרפי-הסיבות לציר אחד.
    'chart', jsonb_build_array(
      jsonb_build_object(
        'type', 'bar',
        'title', 'התפלגות הציונים · ' || v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' משובים',
        -- 🪤 I1 · `series[].format` הוא הקודם ל-`unit` בגזירת תו-הסימון
        --    ובטולטיפ, והוא היה `null`. הערכים עצמם אינם זזים.
        'series', jsonb_build_array(jsonb_build_object('key', 'n', 'label', 'משובים', 'format', 'int')),
        'data', v_dist, 'xKey', 'score', 'domain', null, 'refLines', '[]'::jsonb,
      -- 🪤 I1 · **`chart.unit` הוא שם-פורמט של C8, לא מחרוזת-תצוגה.**
      --    ‏`ChartCard.valueFormat` מחזיר `series[0].format ?? unit` ומזין את
      --    ‏`formatAxisTick`, ו-`HebrewTooltip` מזין את `formatByType` — שניהם מצפים
      --    ל-`money|percent|int|ratio|score|days|text|date`. מחרוזת-תצוגה היא **פורמט
      --    לא-מוכר** ⇒ הציר נופל לקיבוץ-אלפים חשוף והטולטיפ ל-`text`.
      --    הכיתוב העברי נשמר ב-`unit_label` (תוספתי; **אין לו קורא היום** — מדווח).
        'unit', 'int', 'unit_label', 'משובים',
        -- 🔴 **כבוי, והנימוק מדוד — לא זהירות.** הכרטיס ① מבקש סינון-צולב לציון,
        -- אבל **אוכלוסיית הגרף אינה אוכלוסיית הטבלה**: הגרף סופר את כל המשובים
        -- שמילאו (163 בחלון), והטבלה מחזיקה רק את מי שסימן סיבה שלילית (19).
        -- נמדד על כל הטבלה: לכל משוב עם סיבה שלילית יש ציון 2 או 3 — אף לא
        -- אחד עם 4 או 5 (26 + 44 = 70 מתוך 70). ⇒ לחיצה על 4 (עמודה שכתוב
        -- עליה 67) או על 5 (77) הייתה מסננת ל**אפס שורות** בלי שגיאה ובלי רמז —
        -- בדיוק המלכודת שתיעדה `ReportSurface.autoFilterKey` על מ8 ומ9, ובדיוק מה
        -- שכרטיס ⑦ אוסר (*"סיבה עם 0 שורות ⇒ העמודה אינה לחיצה, לא טבלה ריקה"*).
        -- ⚖️ **סתירת-מקורות, מדווחת ולא מוכרעת כאן:** להדליק צריך שהטבלה תחזיק
        -- את כל 163 המשובים — שינוי-אוכלוסייה, לא הצהרת-מפתח. הכרעת-ישי.
        'filter_key', false),
      jsonb_build_object(
        'type', 'bar',
        'title', 'מה משמח · ' || v_lri || to_char(v_with_pos, 'FM999,999,999') || v_pdi || ' משובים סימנו סיבה חיובית',
        -- 🪤 I1 · **שני גרפי-הסיבות אינם חולקים סולם**, והמוקאפ המאושר אומר זאת
        --    במילים מתחת לכותרת. בלעדיו שתי עמודות באותו אורך נקראות כאותו מספר.
        'note', 'הסולם כאן עצמאי ואינו משותף לגרף השלילי שלצידו — אורך עמודה בגרף '
                'אחד אינו מייצג את אותו מספר בגרף השני.',
        -- 🪤 I1 · `series[].format` הוא הקודם ל-`unit` בגזירת תו-הסימון
        --    ובטולטיפ, והוא היה `null`. הערכים עצמם אינם זזים.
        'series', jsonb_build_array(jsonb_build_object('key', 'n', 'label', 'משובים', 'format', 'int')),
        'data', v_pos, 'xKey', 'reason', 'domain', null, 'refLines', '[]'::jsonb,
      -- 🪤 I1 · **`chart.unit` הוא שם-פורמט של C8, לא מחרוזת-תצוגה.**
      --    ‏`ChartCard.valueFormat` מחזיר `series[0].format ?? unit` ומזין את
      --    ‏`formatAxisTick`, ו-`HebrewTooltip` מזין את `formatByType` — שניהם מצפים
      --    ל-`money|percent|int|ratio|score|days|text|date`. מחרוזת-תצוגה היא **פורמט
      --    לא-מוכר** ⇒ הציר נופל לקיבוץ-אלפים חשוף והטולטיפ ל-`text`.
      --    הכיתוב העברי נשמר ב-`unit_label` (תוספתי; **אין לו קורא היום** — מדווח).
        'unit', 'int', 'unit_label', 'משובים',
        -- 🪤 I1 · המוקאפ המאושר (`05_tab_customers_approved.html`) מצייר את שני גרפי-הסיבות
        --    **אופקית** — `aria-label` אומר *"עמודות אופקיות"* ותוויות-הקטגוריה עומדות
        --    ב-`x=129 text-anchor="end"`. שמות-הסיבות הם ביטויים עבריים בני 2–3 מילים, ובציר-X
        --    אנכי הם נחתכים. ‏`layout` הוא מפתח **תוספתי** שהמעטפת קוראת (`ChartCard.BarBody`).
        'layout', 'horizontal',
        -- 🔴 **כבוי, והמדידה חותכת:** אין ולו שורה אחת בטבלה שנושאת סיבה חיובית.
        -- נמדד 16/09/2026: מספר המשובים שסימנו גם סיבה שלילית וגם סיבה חיובית = **0**
        -- (בתקופה ובכל הזמנים). ⇒ חמשת הדאטומים היו מסננים כולם לאפס שורות.
        -- ⚖️ אותה סתירת-מקורות של גרף-הציונים, בגרסה חריפה יותר: 0 מתוך 5 ולא 3 מתוך 5.
        'filter_key', false),
      jsonb_build_object(
        'type', 'bar',
        'title', 'מה מכעיס · ' || v_lri || to_char(v_with_neg, 'FM999,999,999') || v_pdi || ' משובים סימנו סיבה שלילית',
        -- 🪤 I1 · התאום של ההערה בגרף החיובי — אותה אזהרה, מהצד השני.
        'note', 'הסולם כאן עצמאי ואינו משותף לגרף החיובי שלצידו — אורך עמודה בגרף '
                'אחד אינו מייצג את אותו מספר בגרף השני.',
        -- 🪤 I1 · `series[].format` הוא הקודם ל-`unit` בגזירת תו-הסימון
        --    ובטולטיפ, והוא היה `null`. הערכים עצמם אינם זזים.
        'series', jsonb_build_array(jsonb_build_object('key', 'n', 'label', 'משובים', 'format', 'int')),
        'data', v_neg, 'xKey', 'reason', 'domain', null, 'refLines', '[]'::jsonb,
      -- 🪤 I1 · **`chart.unit` הוא שם-פורמט של C8, לא מחרוזת-תצוגה.**
      --    ‏`ChartCard.valueFormat` מחזיר `series[0].format ?? unit` ומזין את
      --    ‏`formatAxisTick`, ו-`HebrewTooltip` מזין את `formatByType` — שניהם מצפים
      --    ל-`money|percent|int|ratio|score|days|text|date`. מחרוזת-תצוגה היא **פורמט
      --    לא-מוכר** ⇒ הציר נופל לקיבוץ-אלפים חשוף והטולטיפ ל-`text`.
      --    הכיתוב העברי נשמר ב-`unit_label` (תוספתי; **אין לו קורא היום** — מדווח).
        'unit', 'int', 'unit_label', 'משובים',
        -- 🪤 I1 · המוקאפ המאושר (`05_tab_customers_approved.html`) מצייר את שני גרפי-הסיבות
        --    **אופקית** — `aria-label` אומר *"עמודות אופקיות"* ותוויות-הקטגוריה עומדות
        --    ב-`x=129 text-anchor="end"`. שמות-הסיבות הם ביטויים עבריים בני 2–3 מילים, ובציר-X
        --    אנכי הם נחתכים. ‏`layout` הוא מפתח **תוספתי** שהמעטפת קוראת (`ChartCard.BarBody`).
        'layout', 'horizontal',
        -- ✅ **הסינון-הצולב היחיד שהמפגש שלו מדויק.** אוכלוסיית הגרף היא בדיוק
        -- אוכלוסיית הטבלה: כל שורה בטבלה סימנה סיבה שלילית אחת, וסכום העמודות
        -- (3+3+3+0+10) שווה ל-19 שורות הטבלה. **המספר שעל העמודה הוא מספר השורות**
        -- שהלחיצה תציג — וזה התנאי שמפריד בין סינון-צולב אמיתי לבין טבלה ריקה.
        -- `filter_key` הוא שם **שדה-השורה** ולא שם ה-`xKey`, והמעטפת משווה
        -- `row['negative_reason']` מול `datum['reason']` (`ReportSurface` §מפתח-הסינון ②).
        'filter_key', 'negative_reason'),
      jsonb_build_object(
        'type', 'bar',
        'title', 'שיעור המרוצים לפי שנה — אינו מושפע ממסנן התקופה',
        -- 🪤 I1 · **זה הגרף שהמדידה נקבה בו:** ציר-הערך קרא 0/25/50/75/100
        --    בלי `%`, כי `'%'` אינו שם-פורמט ו-`series[].format` היה `null`.
        'series', jsonb_build_array(jsonb_build_object('key', 'satisfied_share', 'label', 'שיעור מרוצים',
                                                      'format', 'percent')),
        'data', v_years, 'xKey', 'year',
        'domain', jsonb_build_array(0, 100), 'refLines', '[]'::jsonb, 'unit', 'percent',
        -- 🚫 **כבוי במפורש לפי הכרטיס עצמו** ① (*"לא לחיצה — הגרף מתעלם
        -- ממסנן-התקופה בכוונה, ולחיצה עליו הייתה סותרת את ההצהרה שלו"*). ההצהרה
        -- כתובה כאן ואינה נשענת על כך שהזיהוי-האוטומטי ממילא ייכשל — זיהוי-שנכשל
        -- וכיבוי-מכוון נראים זהים על המסך ושונים לגמרי בקוד.
        'filter_key', false)),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'event_name',       'label', 'אירוע',           'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'company_name',     'label', 'לקוח',            'format', 'text',  'align', 'start'),
      -- 🪤 I1 · `projects.final_event_date` הוא `date` ⇒ `"2026-06-22"` במטען; `date`
      --    מנתב ל-`formatIsraelDate` והמסך מציג `22/06/2026`.
      jsonb_build_object('key', 'final_event_date', 'label', 'תאריך',           'format', 'date',  'align', 'start'),
      -- 📐9 · הטבלה ממוינת בציון עולה (הנמוך ראשון) — וזה מה ש-`aria-sort` חייב לומר.
      jsonb_build_object('key', 'feedback_score',   'label', 'ציון',            'format', 'int',   'align', 'end',
                         'sorted', 'ascending'),
      jsonb_build_object('key', 'reasons',          'label', 'הסיבה שסומנה',    'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'feedback_notes',   'label', 'ההערה שנכתבה',    'format', 'text',  'align', 'start')),
    'rows', v_rows,
    -- 📐23 · דוח-בקרה ⇒ הפועל "לפתוח את X", **והחריגה בשם** (ק4). המשפט נגזר ממה
    -- שנמדד: "גדולה מכל הקטגוריות יחד" נאמר רק כשזה נכון בפועל.
    'so_what', case
      when v_with_neg = 0 then 'אין משוב שלילי בתקופה שנבחרה.'
      when v_other_n > 0 and v_other_n >= v_rest_n
        then 'לפתוח את ' || v_lri || to_char(v_other_n, 'FM999,999,999') || v_pdi
             || ' המשובים שתויגו "אחר" — הם הסיבה השלילית הגדולה בתקופה, גדולה מכל הקטגוריות הקיימות יחד ('
             || v_lri || to_char(v_rest_n, 'FM999,999,999') || v_pdi || '), ואיש לא קרא את הטקסט שבהם.'
      else 'לברר את ' || v_lri || to_char(v_top_neg_n, 'FM999,999,999') || v_pdi || ' המשובים שסימנו "' || v_top_neg
           || '" — זו הסיבה השלילית השכיחה בתקופה.' end,
    'definitions', 'הגדרות: שיעור המרוצים = משובים בציון 4 או 5, חלקי כל המשובים שמולאו · שיעור המענה = משובים שמולאו חלקי (מולאו + נשלחו ולא נענו). משוב שלא נשלח כלל אינו במכנה · ממוצע הציון = ממוצע חשבוני על סולם 1–5; מוצג כמדד משני כי הסולם הוא סולם סדר ולא סולם רציף · סיבה = מה שהלקוח סימן בטופס מתוך רשימה סגורה של חמש קטגוריות לכל כיוון, כולל "אחר" · "אחר" = הלקוח לא מצא קטגוריה מתאימה וכתב בטקסט חופשי.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', '[]'::jsonb,
      'frozen_count', null,
      'notes', v_notes,
      -- הדף מגיב למסנן-הלקוח במלואו ⇒ הרשימה ריקה **ונאמרת**, ולא נעדרת.
      'export_blocked_reason', null,
      'customer_filter_ignored', '[]'::jsonb,
      'drill_echo', p_drill,
      'run', null));
end;
$function$;

comment on function public.report_m20_satisfaction(date, date, integer, jsonb) is
  'שביעות רצון (מ20) — קריאה בלבד, מגודר על מודול לקוחות. אוכלוסייה: משובים שהלקוח מילא בתקופה; הוצאו משובים שנשלחו ולא נענו ומשובים שלא נשלחו כלל, ואירועים מבוטלים אינם מועמדים למשוב. שיעור המענה מחושב על אוכלוסייה אחרת (מילאו + לא-נענו). גרף המגמה השנתית מתעלם ממסנן התקופה. כל שאר הדף מגיב למסנני התקופה והלקוח. חלון התקופה סגור משני קצותיו.';

revoke execute on function public.report_m20_satisfaction(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m20_satisfaction(date, date, integer, jsonb) to authenticated;

create or replace function public.report_m21_drifting(
  p_from        date    default null,
  p_to          date    default null,
  p_customer_id integer default null,
  p_drill       jsonb   default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_today    date := (now() at time zone 'Asia/Jerusalem')::date;
  -- why (G2-בידוד): בידוד-כיווניות לכל רצף-ספרות בתוך משפט עברי — התאום של `isolateLtr`
  -- (`src/lib/reportsFormat.js`) ושל `v_lri`/`v_pdi` במיגרציות E2/F2. **נמדד 16/09/2026:**
  -- ‏"2,786,544 ₪" חזר מהשרת בתוך משפט עברי בלי בידוד, וזה בדיוק המקרה ש-F5 של E2 תיקן.
  v_lri        constant text := chr(8294);   -- U+2066 LRI
  v_pdi        constant text := chr(8297);   -- U+2069 PDI
  v_to       date;
  v_from     date;
  v_y_from   date;
  v_prev     date;
  v_mult     numeric;
  v_dormant  numeric;
  v_missing  text[] := array[]::text[];
  v_notes    jsonb  := '[]'::jsonb;
  v_pop      jsonb;
  v_counts   jsonb;
  v_hist     jsonb;
  v_rows     jsonb;
  v_all_rows jsonb;
  v_oldest   jsonb;
  v_call     jsonb;
  v_drift_n  integer;
  v_prev_n   integer;
  v_elig     integer;
  v_rev      numeric;
  v_rev_all  numeric;
  v_only_n   integer;
  v_only_rev numeric;
  v_dorm_n   integer;
  v_dorm_lt3 integer;
begin
  perform public.assert_module_permission('לקוחות', array['edit', 'view']);

  v_to     := coalesce(p_to, v_today);
  v_from   := coalesce(p_from, date_trunc('year', v_to)::date);
  v_y_from := (v_today - interval '12 months')::date;
  -- "לפני חודש" — ההשוואה של 📐1 על אריח שאין לו תקופה-קודמת טבעית: אותה נוסחה בדיוק,
  -- מורצת מול עוגן אחר. **לא** מדד אחר.
  v_prev   := (v_today - interval '1 month')::date;

  select case when pa.param_value ~ '^\s*-?\d+(\.\d+)?\s*$' then btrim(pa.param_value)::numeric end
    into v_mult from public.params pa where pa.param_name = 'מכפיל_מרווח_מתרחק';
  if v_mult is null then v_missing := v_missing || 'מכפיל_מרווח_מתרחק'; end if;

  select case when pa.param_value ~ '^\s*-?\d+(\.\d+)?\s*$' then btrim(pa.param_value)::numeric end
    into v_dormant from public.params pa where pa.param_name = 'סף_לקוח_רדום_ימים';
  if v_dormant is null then v_missing := v_missing || 'סף_לקוח_רדום_ימים'; end if;

  -- ═══ ההגדרה של §🧾ח7, **ועותק שני שלה** — הראשון ב-`report_m19_customers_overview` ═══
  -- **אין אירוע עתידי · וגם ימים-מאז > מכפיל × חציון-המרווח האישי · ≥ 3 אירועים שהתקיימו.**
  -- אירועים מבוטלים אינם נספרים, ואירועים עתידיים אינם נספרים בקצב.
  -- ⚠️ `nullif(median_gap, 0)` — ר' ההערה בעותק הראשון.
  -- 🔑 **שני עוגנים בשאילתה אחת** (היום · לפני חודש), כדי שההשוואה תהיה אותה נוסחה.
  with anchors as (
    select v_today as anchor, true as is_now
    union all
    select v_prev, false
  ), held as (
    select p.customer_id, p.final_event_date, a.anchor
      from public.projects p
      cross join anchors a
     where p.project_status <> 'cancelled'
       and p.customer_id is not null
       and p.final_event_date < a.anchor
  ), gaps as (
    select h.customer_id, h.anchor,
           h.final_event_date - lag(h.final_event_date) over (
             partition by h.customer_id, h.anchor order by h.final_event_date) as gap_days
      from held h
  ), per_cust as (
    select h.customer_id, h.anchor, count(*)::integer as held_count, max(h.final_event_date) as last_event
      from held h group by h.customer_id, h.anchor
  ), med as (
    select g.customer_id, g.anchor,
           (percentile_cont(0.5) within group (order by g.gap_days))::numeric as median_gap
      from gaps g where g.gap_days is not null group by g.customer_id, g.anchor
  ), fut as (
    select distinct p.customer_id, a.anchor
      from public.projects p
      cross join anchors a
     where p.project_status <> 'cancelled'
       and p.customer_id is not null
       and p.final_event_date >= a.anchor
  ), scored as (
    select pc.customer_id, pc.anchor, pc.held_count, pc.last_event, m.median_gap,
           (pc.anchor - pc.last_event)::numeric as days_since,
           (f.customer_id is not null)          as has_future
      from per_cust pc
      left join med m on m.customer_id = pc.customer_id and m.anchor = pc.anchor
      left join fut f on f.customer_id = pc.customer_id and f.anchor = pc.anchor
  ), drift as (
    select s.*,
           round(s.days_since / nullif(s.median_gap, 0), 1) as ratio,
           (s.days_since > coalesce(v_dormant, 'infinity'::numeric)) as dormant
      from scored s
     where s.held_count >= 3
       and not s.has_future
       and v_mult is not null
       and s.days_since > v_mult * nullif(s.median_gap, 0)
  )
  select jsonb_build_object(
           'drifting_now',  (select count(*)::integer from drift where anchor = v_today),
           'drifting_prev', (select count(*)::integer from drift where anchor = v_prev),
           'eligible',      (select count(*)::integer from scored where anchor = v_today and held_count >= 3),
           'below_min',     (select count(*)::integer from scored where anchor = v_today and held_count between 1 and 2),
           'no_held',       (select count(*)::integer from public.customers c
                              where not exists (select 1 from scored s
                                                 where s.customer_id = c.customer_id and s.anchor = v_today)),
           'customers',     (select count(*)::integer from public.customers),
           'only_personal', (select count(*)::integer from drift where anchor = v_today and not dormant),
           'dormant_all',   (select count(*)::integer from scored
                              where anchor = v_today and not has_future
                                and days_since > coalesce(v_dormant, 'infinity'::numeric)),
           'dormant_lt3',   (select count(*)::integer from scored
                              where anchor = v_today and not has_future and held_count < 3
                                and days_since > coalesce(v_dormant, 'infinity'::numeric))
         )
    into v_counts;

  v_drift_n  := (v_counts ->> 'drifting_now')::integer;
  v_prev_n   := (v_counts ->> 'drifting_prev')::integer;
  v_elig     := (v_counts ->> 'eligible')::integer;
  v_only_n   := (v_counts ->> 'only_personal')::integer;
  v_dorm_n   := (v_counts ->> 'dormant_all')::integer;
  v_dorm_lt3 := (v_counts ->> 'dormant_lt3')::integer;

  -- ── הטבלה · 📐7 ו-הכרעה 24·ח7: מיון ראשוני הכנסת-12-החודשים יורד, משני פי-כמה ──
  -- 📐18 — בעל-שם על השורה החורגת: איש-הקשר הראשי, אותו דפוס בדיוק של `getBillingContact`.
  with held as (
    select p.customer_id, p.final_event_date from public.projects p
     where p.project_status <> 'cancelled' and p.customer_id is not null and p.final_event_date < v_today
  ), gaps as (
    select h.customer_id, h.final_event_date - lag(h.final_event_date) over (
             partition by h.customer_id order by h.final_event_date) as gap_days from held h
  ), per_cust as (
    select h.customer_id, count(*)::integer as held_count, max(h.final_event_date) as last_event
      from held h group by h.customer_id
  ), med as (
    select g.customer_id, (percentile_cont(0.5) within group (order by g.gap_days))::numeric as median_gap
      from gaps g where g.gap_days is not null group by g.customer_id
  ), fut as (
    select distinct p.customer_id from public.projects p
     where p.project_status <> 'cancelled' and p.customer_id is not null and p.final_event_date >= v_today
  ), rev as (
    select p.customer_id, sum(fm.revenue) as revenue
      from public.projects p
      cross join lateral public.finance_project_money(p.project_id) fm
     where p.project_status in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')
       and p.customer_id is not null
       and p.final_event_date >= v_y_from and p.final_event_date <= v_today
     group by p.customer_id
  ), fb as (
    select p.customer_id,
           round(avg(p.feedback_score)::numeric, 2) as avg_score,
           count(*)::integer                        as n,
           (array_agg(p.feedback_score order by p.final_event_date desc, p.project_id desc))[1] as last_score
      from public.projects p
     where p.feedback_status = 'completed' and p.feedback_score is not null and p.customer_id is not null
     group by p.customer_id
  ), contact as (
    select distinct on (cc.customer_id) cc.customer_id, cc.contact_name, cc.phone
      from public.customer_contacts cc where cc.is_primary order by cc.customer_id
  ), drift as (
    select pc.customer_id, pc.last_event, m.median_gap,
           (v_today - pc.last_event)::numeric as days_since
      from per_cust pc
      join med m on m.customer_id = pc.customer_id
      left join fut f on f.customer_id = pc.customer_id
     where pc.held_count >= 3 and f.customer_id is null and v_mult is not null
       and (v_today - pc.last_event)::numeric > v_mult * nullif(m.median_gap, 0)
  )
  -- 🔑 **שני מערכים ולא אחד:** האריחים נמדדים על **כל** המסומנים (הם חתך כלל-לקוחי),
  -- והטבלה בלבד מצטמצמת למסנן-הלקוח. איגוד השניים היה הופך את אריח-הספירה למספר
  -- שמשתנה עם המסנן בלי שנאמר על כך דבר.
  select coalesce(jsonb_agg(t.row order by t.revenue desc nulls last, t.ratio desc, t.customer_id), '[]'::jsonb),
         coalesce(jsonb_agg(t.row order by t.revenue desc nulls last, t.ratio desc, t.customer_id)
                  filter (where p_customer_id is null or t.customer_id = p_customer_id), '[]'::jsonb),
         sum(t.revenue),
         sum(t.revenue) filter (where not t.dormant),
         (select sum(r.revenue) from rev r)
    into v_all_rows, v_rows, v_rev, v_only_rev, v_rev_all
    from (select d.customer_id,
                 coalesce(r.revenue, 0) as revenue,
                 round(d.days_since / nullif(d.median_gap, 0), 1) as ratio,
                 (d.days_since > coalesce(v_dormant, 'infinity'::numeric)) as dormant,
                 jsonb_build_object(
                   'drill_key',    jsonb_build_object('kind', 'customer', 'id', d.customer_id),
                   'customer_id',  d.customer_id,
                   'company_name', c.company_name,
                   'contact_name', coalesce(ct.contact_name, 'אין איש קשר ראשי'),
                   'contact_phone', ct.phone,
                   'revenue_12m',  coalesce(r.revenue, 0),
                   'last_event',   d.last_event,
                   'days_since',   d.days_since,
                   'cadence',      d.median_gap,
                   'ratio',        round(d.days_since / nullif(d.median_gap, 0), 1),
                   'last_score',   f.last_score,
                   'avg_score',    f.avg_score,
                   'feedback_n',   coalesce(f.n, 0),
                   -- 🪤 I1 · העמודה נקראת "ציון אחרון · ממוצעו" ומבטיחה **שני** מספרים,
                   --    והתא נשא אחד. המוקאפ המאושר (`#c3`) מצייר תא אחד: הציון האחרון
                   --    (ככוכבים) ואחריו `· 2.90 (n=10)`. ‏G-ל5 נועל **תשע** עמודות ⇒ עמודה
                   --    עשירית הייתה סותרת הכרעה רשומה, ולכן זהו תא-טקסט מורכב אחד.
                   --    שלושת המספרים הגולמיים נשארים במקומם ואף אחד מהם לא זז.
                   'score_pair',   case when f.last_score is null and f.avg_score is null then null
                                        else v_lri || coalesce(f.last_score::text, '—') || v_pdi || ' · '
                                             || v_lri || coalesce(to_char(f.avg_score, 'FM990.00'), '—') || v_pdi
                                             || ' (' || v_lri || 'n=' || coalesce(f.n, 0) || v_pdi || ')' end,
                   'dormant',      (d.days_since > coalesce(v_dormant, 'infinity'::numeric)),
                   -- 🔒 המילון נועל: "מתרחק" הוא דגל **בשורה**; "מתרחקים" הוא אריח-הספירה בלבד.
                   'flag',         case when d.days_since > coalesce(v_dormant, 'infinity'::numeric)
                                        then 'מתרחק · גם רדום' else 'מתרחק בלבד' end) as row
            from drift d
            join public.customers c on c.customer_id = d.customer_id
            left join rev r  on r.customer_id  = d.customer_id
            left join fb f   on f.customer_id  = d.customer_id
            left join contact ct on ct.customer_id = d.customer_id) t;

  -- אריח "הוותיק שברשימה" — השורה עם הכי הרבה ימים מאז האירוע האחרון.
  select jsonb_build_object(
           'company_name', e.value ->> 'company_name',
           'days_since',   (e.value ->> 'days_since')::numeric,
           'ratio',        (e.value ->> 'ratio')::numeric,
           'cadence',      (e.value ->> 'cadence')::numeric,
           'last_event',   e.value ->> 'last_event',
           'avg_score',    (e.value ->> 'avg_score')::numeric,
           'feedback_n',   (e.value ->> 'feedback_n')::integer,
           -- הטענה "הנמוך ברשימה" נבדקת ואינה מוצהרת: היא נאמרת רק אם היא נכונה.
           'lowest_avg',   (e.value ->> 'avg_score')::numeric is not null
                           and (e.value ->> 'avg_score')::numeric
                               = (select min((x.value ->> 'avg_score')::numeric) from jsonb_array_elements(v_all_rows) x))
    into v_oldest
    from jsonb_array_elements(v_all_rows) e
   order by (e.value ->> 'days_since')::numeric desc limit 1;

  -- שורת-"אז מה" (📐23, תומך-החלטה ⇒ "להתקשר") — שתי השורות הגדולות **שנתפסות רק בקצב האישי**.
  select coalesce(jsonb_agg(x.value order by (x.value ->> 'revenue_12m')::numeric desc), '[]'::jsonb)
    into v_call
    from (select e.value from jsonb_array_elements(v_all_rows) e
           where (e.value ->> 'dormant')::boolean is false
           order by (e.value ->> 'revenue_12m')::numeric desc limit 2) x;

  -- ── היסטוגרמת-הקצב · **רוחב-דלי 30 מוצהר, הדלי האחרון פתוח** (📑ב#18) ────────
  -- 🔴 **כאן, ורק כאן, הגבול חצי-פתוח `(lo, hi]`** — ‏`ceil` ולא `floor`. ר' "פער 1"
  -- בכותרת: `floor` מחזיר 399·96·64·35·20·17·45 במקום 401·98·61·36·20·16·44 שנמדדו.
  -- ⚠️ מרווח 0 (שני אירועים באותו יום — **קיים בדאטה**) נספר בדלי הראשון.
  with held as (
    select p.customer_id, p.final_event_date from public.projects p
     where p.project_status <> 'cancelled' and p.customer_id is not null and p.final_event_date < v_today
  ), gaps as (
    select (h.final_event_date - lag(h.final_event_date) over (
             partition by h.customer_id order by h.final_event_date))::integer as gap_days
      from held h
  ), bucketed as (
    select least(greatest(ceil(g.gap_days / 30.0)::integer, 1), 7) as bucket, count(*)::integer as n
      from gaps g where g.gap_days is not null group by 1
  )
  select jsonb_build_object(
           'data', coalesce(jsonb_agg(jsonb_build_object(
                     'bucket', s.bucket,
                     'label', case when s.bucket = 7 then '181+'
                                   else format('%s–%s', case when s.bucket = 1 then 0 else (s.bucket - 1) * 30 + 1 end,
                                                       s.bucket * 30) end,
                     'open', s.bucket = 7,
                     'n', coalesce(b.n, 0)) order by s.bucket), '[]'::jsonb),
           'total', (select coalesce(sum(n), 0) from bucketed),
           'max_gap', (select max(g.gap_days) from gaps g where g.gap_days is not null))
    into v_hist
    from generate_series(1, 7) as s(bucket)
    left join bucketed b on b.bucket = s.bucket;

  v_pop := jsonb_build_object(
    'eligible', v_elig,
    'below_min', (v_counts ->> 'below_min')::integer,
    'no_held', (v_counts ->> 'no_held')::integer,
    'customers', (v_counts ->> 'customers')::integer);

  v_notes := v_notes
    || to_jsonb('האריחים וההיסטוגרמה נמדדים על כלל הלקוחות ואינם מושפעים ממסנני התקופה והלקוח; הטבלה כן.'::text)
    || to_jsonb((v_lri || to_char((v_counts ->> 'below_min')::integer, 'FM999,999,999') || v_pdi
                 || ' לקוחות עם פחות משלושה אירועים שהתקיימו אינם בדוח; '
                 || v_lri || to_char(v_dorm_lt3, 'FM999,999,999') || v_pdi || ' מהם עומדים בתנאי "רדום".')::text)
    -- ⑤ מ21: עמודות/אריחי-ה-₪ הן הרשאת מודול **'כספים'** ולא 'לקוחות'. המיסוך הוא של
    -- הלשונית (`MASKED_TEXT`/`MASKED_NODE`), לא של ה-RPC; ⑧21.4 עדיין 🔵 פתוח להכרעת-ישי.
    || to_jsonb('עמודות ואריחי ה-₪ בדף זה כפופים להרשאת מודול כספים; המיסוך מתבצע בלשונית.'::text);
  if p_drill is not null then
    v_notes := v_notes || to_jsonb('הדף אינו דוח-קידוח (📐13) — פרמטר הקידוח לא הופעל.'::text);
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_elig,
      'label', 'אוכלוסייה: ' || v_lri || to_char(v_elig, 'FM999,999,999') || v_pdi || ' לקוחות שקיימו '
               || v_lri || '3' || v_pdi || ' אירועים לפחות שכבר התקיימו, מתוך '
               || v_lri || to_char((v_counts ->> 'customers')::integer, 'FM999,999,999') || v_pdi || ' · הוצאו: '
               || v_lri || to_char((v_counts ->> 'no_held')::integer, 'FM999,999,999') || v_pdi || ' לקוחות בלי אף אירוע שהתקיים · '
               || v_lri || to_char((v_counts ->> 'below_min')::integer, 'FM999,999,999') || v_pdi
               || ' עם פחות משלושה · אירועים מבוטלים ואירועים עתידיים אינם נספרים בקצב.',
      'excluded', jsonb_build_object(
        'בלי אף אירוע שהתקיים', (v_counts ->> 'no_held')::integer,
        'פחות משלושה אירועים', (v_counts ->> 'below_min')::integer)),
    'window', jsonb_build_object(
      'from', v_from, 'to', v_to,
      'label', 'נכון ל-' || v_lri || to_char(v_today, 'DD/MM/YYYY') || v_pdi || ' · '
               || case when p_customer_id is null then 'כל הלקוחות' else 'לקוח נבחר' end),
    'tiles', jsonb_build_array(
      jsonb_build_object(
        'key', 'drifting_count',
        'label', 'לקוחות מתרחקים',
        'value', v_drift_n,
        'format', 'int',
        'sub', 'מתוך ' || v_lri || to_char(v_elig, 'FM999,999,999') || v_pdi || ' לקוחות עם ' || v_lri || '3+' || v_pdi
               || ' אירועים (' || v_lri
               || coalesce(to_char(round(100.0 * v_drift_n / nullif(v_elig, 0), 1), 'FM999990.0'), '—')
               || '%' || v_pdi || ')',
        'detail', v_pop,
        'window', 'נכון ל-' || v_lri || to_char(v_today, 'DD/MM') || v_pdi
                  || ' · אינו מושפע ממסנן התקופה',
        'compare', jsonb_build_object(
          'value', v_prev_n,
          'label', 'לפני חודש (' || v_lri || to_char(v_prev, 'DD/MM/YYYY') || v_pdi || ')',
          'direction', case when v_drift_n > v_prev_n then 'up'
                            when v_drift_n < v_prev_n then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object(
        -- 🔒 **"הכנסת 12 החודשים של הלקוחות המסומנים"** — ולא "הכנסה-בסיכון". זהו סכום
        -- שכבר **הורווח**, לא סכום שצפוי להיאבד; המילון נועל את הניסוח.
        'key', 'marked_revenue_12m',
        'label', 'הכנסת 12 החודשים של הלקוחות המסומנים',
        'value', v_rev,
        'format', 'money',
        'sub', v_lri || coalesce(to_char(round(100 * v_rev / nullif(v_rev_all, 0), 1), 'FM999990.0'), '—')
               || '%' || v_pdi || ' מ-'
               || v_lri || coalesce(to_char(round(v_rev_all), 'FM999,999,999'), '—') || ' ₪' || v_pdi
               || ' שהעסק הכניס ב-' || v_lri || '12' || v_pdi || ' החודשים',
        'detail', jsonb_build_object('marked_revenue', v_rev, 'company_revenue', v_rev_all),
        'window', v_lri || to_char(v_y_from, 'DD/MM/YYYY') || '–' || to_char(v_today, 'DD/MM/YYYY') || v_pdi,
        'compare', jsonb_build_object(
          'value', null,
          'label', 'זהו סכום שכבר הורווח — לא סכום שצפוי להיאבד',
          'direction', 'flat'),
        'target', null),
      jsonb_build_object(
        'key', 'only_personal_cadence',
        'label', 'נתפסים רק בקצב האישי',
        'value', v_only_n,
        'format', 'int',
        'sub', v_lri || coalesce(to_char(round(coalesce(v_only_rev, 0)), 'FM999,999,999'), '0') || ' ₪' || v_pdi
               || ' בשנה האחרונה',
        'detail', jsonb_build_object('only_personal', v_only_n, 'revenue', coalesce(v_only_rev, 0),
                                     'dormant_rule_finds', v_dorm_n),
        'window', 'נכון ל-' || v_lri || to_char(v_today, 'DD/MM') || v_pdi,
        -- 🪤 J1 · **המשפט הבטיח מספר אחד והערך נשא אחר.** התווית אומרת *"…ואת אלה
        --    הוא מפספס"*, והערך היה `v_dorm_n` — כלומר מה שכלל-120-הימים **מוצא**,
        --    אותו מספר שהתווית עצמה כבר הדפיסה שורה לפניו (⁦11⁩ ואז ⁦11⁩). מה שהוא
        --    מפספס הם הלקוחות שנתפסים רק בקצב האישי — `only_personal` = `not dormant`
        --    בתוך `drift`, וזה בדיוק הערך שעל האריח עצמו.
        'compare', jsonb_build_object(
          'value', v_only_n,
          'label', 'כלל ' || v_lri || coalesce(v_dormant::text, '—') || v_pdi
                   || ' הימים לבדו מוצא ' || v_lri || to_char(v_dorm_n, 'FM999,999,999') || v_pdi
                   || ' לקוחות, ואת אלה הוא מפספס',
          'direction', 'flat'),
        'target', null),
      jsonb_build_object(
        'key', 'oldest_in_list',
        'label', 'הוותיק שברשימה',
        'value', v_oldest ->> 'company_name',
        'format', 'text',
        'sub', case when v_oldest is null then 'אין לקוח מתרחק כרגע'
          else v_lri || to_char((v_oldest ->> 'days_since')::integer, 'FM999,999,999') || v_pdi || ' ימים מאז האירוע האחרון — פי '
               || v_lri || (v_oldest ->> 'ratio') || v_pdi || ' מהקצב שלו ('
               || v_lri || (v_oldest ->> 'cadence') || v_pdi || ' ימים)' end,
        'detail', v_oldest,
        'window', case when v_oldest is null then '—'
          else 'אירוע אחרון ' || v_lri || to_char((v_oldest ->> 'last_event')::date, 'DD/MM/YYYY') || v_pdi end,
        'compare', case when v_oldest is null or (v_oldest ->> 'avg_score') is null then null
          else jsonb_build_object(
            'value', (v_oldest ->> 'avg_score')::numeric,
            -- 🪤 I2 · התווית הדפיסה את הציון, והערך הוא אותו ציון (`2.43: 2.43`).
            'label', 'ממוצע המשוב שלו על ' || v_lri || to_char((v_oldest ->> 'feedback_n')::integer, 'FM999,999,999') || v_pdi || ' משובים'
                     || case when (v_oldest ->> 'lowest_avg')::boolean then ' — הנמוך ברשימה' else '' end,
            'direction', 'flat') end,
        'target', null)),
    'chart', jsonb_build_object(
      'type', 'histogram',
      'title', 'הקצב שבו לקוחות חוזרים · ' || v_lri || to_char((v_hist ->> 'total')::integer, 'FM999,999') || v_pdi
               || ' מרווחים בין אירועים עוקבים, בדליים של ' || v_lri || '30' || v_pdi || ' יום',
        -- 🪤 I1 · `series[].format` הוא הקודם ל-`unit` בגזירת תו-הסימון
        --    ובטולטיפ, והוא היה `null`. הערכים עצמם אינם זזים.
      'series', jsonb_build_array(jsonb_build_object('key', 'n', 'label', 'מספר מרווחים', 'format', 'int')),
      'data', v_hist -> 'data',
      'xKey', 'label',
      'domain', null,
      'refLines', '[]'::jsonb,
      -- 🪤 I1 · **`chart.unit` הוא שם-פורמט של C8, לא מחרוזת-תצוגה.**
      --    ‏`ChartCard.valueFormat` מחזיר `series[0].format ?? unit` ומזין את
      --    ‏`formatAxisTick`, ו-`HebrewTooltip` מזין את `formatByType` — שניהם מצפים
      --    ל-`money|percent|int|ratio|score|days|text|date`. מחרוזת-תצוגה היא **פורמט
      --    לא-מוכר** ⇒ הציר נופל לקיבוץ-אלפים חשוף והטולטיפ ל-`text`.
      --    הכיתוב העברי נשמר ב-`unit_label` (תוספתי; **אין לו קורא היום** — מדווח).
      'unit', 'int', 'unit_label', 'מרווחים'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'company_name', 'label', 'לקוח',              'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'contact_name', 'label', 'איש קשר',           'format', 'text',  'align', 'start'),
      -- 📐7 · מיון ראשוני הכנסת-12-החודשים יורד ⇒ 📐9 מחייב `aria-sort` עליה.
      jsonb_build_object('key', 'revenue_12m',  'label', 'הכנסת 12 החודשים',  'format', 'money', 'align', 'end',
                         'sorted', 'descending'),
      -- 🪤 I1 · `date` במטען ⇒ `"2026-06-22"`; `date` מנתב ל-`formatIsraelDate`.
      jsonb_build_object('key', 'last_event',   'label', 'אירוע אחרון',       'format', 'date',  'align', 'start'),
      jsonb_build_object('key', 'days_since',   'label', 'ימים מאז האירוע',   'format', 'days',  'align', 'end'),
      jsonb_build_object('key', 'cadence',      'label', 'הקצב שלו',          'format', 'days',  'align', 'end'),
      jsonb_build_object('key', 'ratio',        'label', 'פי כמה מהקצב',      'format', 'ratio', 'align', 'end'),
      -- 🪤 I1 · העמודה מצביעה עכשיו על `score_pair` (ר' ההערה בבניית-השורה). `last_score`
      --    ו-`avg_score` נשארים במטען כמספרים — שום מפתח לא נמחק, ומספר העמודות נשאר תשע.
      jsonb_build_object('key', 'score_pair',   'label', 'ציון אחרון · ממוצעו', 'format', 'text',  'align', 'end'),
      jsonb_build_object('key', 'flag',         'label', 'דגל',               'format', 'text',  'align', 'start')),
    'rows', v_rows,
    'so_what', case
      when v_drift_n = 0 then 'אין לקוח מתרחק כרגע.'
      when jsonb_array_length(v_call) = 0
        then 'להתקשר השבוע ללקוחות שברשימה — ' || v_lri || to_char(v_drift_n, 'FM999,999,999') || v_pdi
             || ' מתרחקים, וכולם כבר מעבר לסף ' || v_lri || coalesce(v_dormant::text, '—') || v_pdi
             || ' הימים הקיים.'
      when jsonb_array_length(v_call) = 1
        then 'להתקשר השבוע ל' || (v_call #>> '{0,contact_name}') || ' מ' || (v_call #>> '{0,company_name}')
             || ' — שקטה פי ' || v_lri || (v_call #>> '{0,ratio}') || v_pdi || ' מהקצב שלה, '
             || v_lri || to_char(round((v_call #>> '{0,revenue_12m}')::numeric), 'FM999,999,999') || ' ₪' || v_pdi
             || ' בשנה האחרונה, ועדיין אינה נחשבת "רדומה".'
      else 'להתקשר השבוע ל' || (v_call #>> '{0,contact_name}') || ' מ' || (v_call #>> '{0,company_name}')
           || ' ול' || (v_call #>> '{1,contact_name}') || ' מ' || (v_call #>> '{1,company_name}')
           || ' — שתיהן שקטו פי ' || v_lri || (v_call #>> '{0,ratio}') || v_pdi
           || ' ופי ' || v_lri || (v_call #>> '{1,ratio}') || v_pdi || ' מהקצב שלהן, יחד '
           || v_lri || to_char(round((v_call #>> '{0,revenue_12m}')::numeric
                                     + (v_call #>> '{1,revenue_12m}')::numeric), 'FM999,999,999') || ' ₪' || v_pdi
           || ' בשנה האחרונה, ושתיהן עדיין לא נחשבות "רדומות".' end,
    'definitions', 'הגדרות: מתרחק = שני תנאים יחד: אין לו אף אירוע עתידי במערכת, וגם עברו מאז האירוע האחרון יותר מפי '
                   || v_lri || coalesce(v_mult::text, '—') || v_pdi
                   || ' מהמרווח הרגיל שלו. נדרשים ' || v_lri || '3' || v_pdi
                   || ' אירועים שהתקיימו לפחות · הקצב שלו = חציון המרווחים בימים בין אירועים עוקבים של אותו לקוח, כל הזמנים · פי כמה מהקצב = ימים מאז האירוע האחרון, חלקי הקצב שלו · רדום = הדגל הקיים במערכת: אין אירוע עתידי וגם עברו יותר מ-'
                   || v_lri || coalesce(v_dormant::text, '—') || v_pdi
                   || ' ימים. הוא חל על כל הלקוחות, גם על אלה עם פחות משלושה אירועים · אירוע = פרויקט שתאריך האירוע שלו כבר עבר ולא בוטל · הכנסת '
                   || v_lri || '12' || v_pdi
                   || ' החודשים = סך ההכנסה מאירועים שהתקיימו בשנה האחרונה ויצאה להם חשבונית — לא רק מאלה שכבר שולמו במלואם. זהו סכום שכבר הורווח, לא סכום שצפוי להיאבד.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', to_jsonb(v_missing),
      'frozen_count', null,
      'notes', v_notes,
      'export_blocked_reason', null,
      'customer_filter_ignored', jsonb_build_array(
        'drifting_count', 'marked_revenue_12m', 'only_personal_cadence', 'oldest_in_list'),
      'drill_echo', p_drill,
      'run', null));
end;
$function$;

comment on function public.report_m21_drifting(date, date, integer, jsonb) is
  'לקוחות מתרחקים (מ21) — קריאה בלבד, מגודר על מודול לקוחות. אוכלוסייה: לקוחות שקיימו שלושה אירועים לפחות שכבר התקיימו; הוצאו לקוחות בלי אף אירוע שהתקיים ולקוחות עם פחות משלושה. אירועים מבוטלים ואירועים עתידיים אינם נספרים בקצב. האריחים וההיסטוגרמה אינם מגיבים למסנני התקופה והלקוח; הטבלה כן. מכפיל_מרווח_מתרחק ו-סף_לקוח_רדום_ימים נקראים בזמן ריצה ואין להם ברירת-מחדל.';

revoke execute on function public.report_m21_drifting(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m21_drifting(date, date, integer, jsonb) to authenticated;

create or replace function public.report_m22_notes(
  p_from        date    default null,
  p_to          date    default null,
  p_customer_id integer default null,
  p_drill       jsonb   default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_today     date := (now() at time zone 'Asia/Jerusalem')::date;
  -- why (G2-בידוד): בידוד-כיווניות לכל רצף-ספרות בתוך משפט עברי — התאום של `isolateLtr`
  -- (`src/lib/reportsFormat.js`) ושל `v_lri`/`v_pdi` במיגרציות E2/F2. **נמדד 16/09/2026:**
  -- "2,786,544 ₪" חזר מהשרת בתוך משפט עברי בלי בידוד, וזה בדיוק המקרה ש-F5 של E2 תיקן.
  v_lri        constant text := chr(8294);   -- U+2066 LRI
  v_pdi        constant text := chr(8297);   -- U+2069 PDI
  v_to        date;
  v_from      date;
  v_notes     jsonb := '[]'::jsonb;
  v_run       record;
  v_run_json  jsonb;
  -- 🔴 **תיקון G2-1, והוא החוסם של הקובץ.** הגוף הקודם קרא **ריצה מאושרת אחת**
  -- (`order by approved_at desc limit 1`). **נמדד חי 16/09/2026:** שתי ריצות מאושרות —
  -- 5 (`partial`, 40 שורות, gemini-3.8-flash) ו-6 (`done`, 386, gemini-3.5-flash-lite),
  -- **זרות זו לזו, ויחד בדיוק 426 הפרויקטים** שהאריח הראשון מכריז עליהם. ⇒ הדוח הציג
  -- 386 שורות ו-24 דגלים אדומים במקום 426 ו-25, **בלי לומר שחסרות 40** — ובאותו מסך
  -- שורת-האוכלוסייה כן אמרה 426. הכרטיס ⑥ נוקב במפורש ב*"הדוח מציג רק ריצות מאושרות"*
  -- (רבים). ⇒ **איחוד כל הריצות המאושרות, שורה אחת לפרויקט** (המאושרת האחרונה גוברת).
  v_run_ids   bigint[];
  v_run_cnt   integer;
  v_runs      jsonb;
  v_models    text[];
  v_models_j  jsonb;
  v_sent      integer;
  v_ok        integer;
  v_failed    integer;
  v_completed integer;
  v_with_note integer;
  v_distinct  integer;
  v_other     integer;
  v_other_txt integer;
  v_rest      integer;
  v_other_yr  jsonb;
  -- סבב 3 · פילוח-השנים כמחרוזת מוכנה (אותו תיקון כמו במ19).
  v_other_yr_txt text;
  v_quotes    jsonb;
  v_matrix    jsonb;
  v_rows      jsonb;
  v_flags     integer;
  v_unclass   integer;
  v_classified integer;
  v_free      jsonb;
  v_free_one  integer;
  v_top_pair  jsonb;
  -- ⑧ מ25 · **פס-הניתוח חי גם כשאין אישור.** השורות והאריחים נעולים לריצות מאושרות
  -- (וזה נכון — תוצאת-מודל אינה עולה למסך לפני שאדם ראה אותה), אבל ריצה `running` /
  -- `partial` / `done`-שטרם-אושרה הייתה **בלתי-נראית לחלוטין** למטען ⇒ הפס היה מצייר
  -- *"טרם סווגו"* עם כפתור חי, ולחיצה עליו נופלת על אינדקס H1 (ריצה-רצה-יחידה). ⇒
  -- הריצה הלא-מאושרת האחרונה חוזרת **בנפרד**, ואינה נוגעת בשורות ובאריחים.
  v_prog      jsonb;
begin
  perform public.assert_module_permission('לקוחות', array['edit', 'view']);

  v_to   := coalesce(p_to, v_today);
  v_from := coalesce(p_from, date_trunc('year', v_to)::date);

  -- ── הריצה המאושרת האחרונה. אין אחת ⇒ כל מה שמתחתיה מאופס-במפורש ──────────────
  -- הריצה המאושרת **האחרונה** — היא שנושאת את חותמת-הדף (⑧22.4: *"מציג את הריצה
  -- מ-DD/MM/YYYY, אושרה ע"י X"*). היא אינה מגדירה עוד את אוכלוסיית-השורות.
  -- 🪤 J1 · **פס-הריצה קרא לאדם בכתובת-ההתחברות שלו** (*"אושרה ע"י
  --    ishay1997@gmail.com"*) בזמן שכל אדם אחר על 16 המסכים נקרא בשמו.
  --    ‏`approved_by` הוא FK של דוא"ל אל `users(email)`, ו-`users.full_name` הוא
  --    עמודת-השם שהמערכת משתמשת בה בכל מקום אחר. `approved_by` נשאר **מפתח-התצוגה**
  --    שהפס מדפיס (`AnalysisRunBar.jsx:165` קורא אותו מילולית ואינו קובץ שלי),
  --    ולכן הוא נושא עכשיו את השם; הכתובת הגולמית לא אבדה — היא ב-`approved_by_email`.
  --    ‏`left join` ולא `join`: ריצה מאושרת שהמאשרת שלה נמחקה מ-`users` חייבת
  --    להמשיך להופיע, ואז הנפילה-לאחור היא הכתובת (📐1 — לא "—").
  select r.run_id, r.status, r.model, r.finished_at, r.approved_at,
         coalesce(nullif(btrim(u.full_name), ''), r.approved_by) as approved_by,
         r.approved_by as approved_by_email,
         r.sent_count, r.ok_count, r.failed_count
    into v_run
    from public.feedback_ai_runs r
    left join public.users u on u.email = r.approved_by
   where r.approved_at is not null
   order by r.approved_at desc, r.run_id desc
   limit 1;

  -- **כל** הריצות המאושרות — הן, יחד, אוכלוסיית-הסיווג של הדף.
  select count(*)::integer,
         array_agg(r.run_id order by r.approved_at desc, r.run_id desc),
         coalesce(sum(r.sent_count), 0)::integer,
         coalesce(sum(r.ok_count), 0)::integer,
         coalesce(sum(r.failed_count), 0)::integer,
         coalesce(jsonb_agg(jsonb_build_object(
           'run_id', r.run_id, 'status', r.status, 'model', r.model,
           'finished_at', r.finished_at, 'approved_at', r.approved_at,
           'approved_by', coalesce(nullif(btrim(u.full_name), ''), r.approved_by),
           'approved_by_email', r.approved_by, 'sent_count', r.sent_count,
           'ok_count', r.ok_count, 'failed_count', r.failed_count)
           order by r.approved_at desc, r.run_id desc), '[]'::jsonb)
    into v_run_cnt, v_run_ids, v_sent, v_ok, v_failed, v_runs
    from public.feedback_ai_runs r
    left join public.users u on u.email = r.approved_by
   where r.approved_at is not null;

  -- 🔑 **שני מודלים מעורבים בפועל**, ולכן הדף אומר אילו ועל כמה שורות כל אחד —
  -- "המודל" ביחיד היה הסתרה של הרכב-הנתונים שעליו האדם מסתכל.
  select coalesce(jsonb_agg(jsonb_build_object('model', t.model, 'runs', t.runs, 'rows', t.rows)
                            order by t.rows desc, t.model), '[]'::jsonb),
         array_agg(t.model order by t.rows desc, t.model)
    into v_models_j, v_models
    from (select r.model,
                 count(distinct r.run_id)::integer as runs,
                 count(i.project_id)::integer      as rows
            from public.feedback_ai_runs r
            left join public.feedback_ai_insights i on i.run_id = r.run_id
           where r.approved_at is not null
           group by r.model) t;

  select jsonb_build_object(
           'run_id', r.run_id, 'status', r.status, 'model', r.model,
           'sent_count', r.sent_count, 'ok_count', r.ok_count, 'failed_count', r.failed_count,
           'started_at', r.started_at, 'finished_at', r.finished_at)
    into v_prog
    from public.feedback_ai_runs r
   where r.approved_at is null
   order by r.run_id desc
   limit 1;

  -- ── מה שידוע **בלי** המודל — כל הזמנים, ואינו מגיב למסנן התקופה ──────────────
  select count(*),
         count(*) filter (where nullif(btrim(coalesce(p.feedback_notes, '')), '') is not null),
         count(distinct nullif(btrim(coalesce(p.feedback_notes, '')), ''))
    into v_completed, v_with_note, v_distinct
    from public.projects p
   where p.feedback_status = 'completed';

  select count(*) filter (where r.reason = 'אחר'),
         count(*) filter (where r.reason <> 'אחר')
    into v_other, v_rest
    from public.projects p
    cross join lateral unnest(p.negative_feedback_reasons) as r(reason)
   where p.feedback_status = 'completed';

  select count(*) into v_other_txt
    from public.projects p
   where p.feedback_status = 'completed'
     and 'אחר' = any (p.negative_feedback_reasons)
     and nullif(btrim(coalesce(p.feedback_notes, '')), '') is not null;

  select coalesce(jsonb_object_agg(t.y::text, t.c), '{}'::jsonb) into v_other_yr
    from (select extract(year from p.final_event_date)::integer as y, count(*)::integer as c
            from public.projects p
           where p.feedback_status = 'completed'
             and 'אחר' = any (p.negative_feedback_reasons)
             and p.final_event_date <= v_today
           group by 1) t;

  -- 🪤 I1 · חצי-ההשוואה חזר על ערך-האריח; המוקאפ מצייר שם פילוח לפי שנה.
  --    המחרוזת נקייה מעברית — `KpiTile` עוטף את הערך ב-`<Ltr dir="ltr">`.
  select string_agg(v_lri || e.key || v_pdi || ': ' || v_lri || e.value || v_pdi, ' · ' order by e.key)
    into v_other_yr_txt
    from jsonb_each_text(coalesce(v_other_yr, '{}'::jsonb)) as e(key, value);

  -- שמונה ההערות שתויגו "אחר" — **טקסט מדוד מהמסד, בלי ולו פלט-מודל אחד** (⑧22.2).
  -- הן אינן `rows` (אלה נעולות לריצה מאושרת), אלא הבסיס למצב-הריק שהמוקאפ מצייר.
  -- ⚠️ `feedback_notes` הוא טקסט שגורם חיצוני כתב ⇒ מוצג כטקסט, לעולם לא כ-HTML (⑨).
  select coalesce(jsonb_agg(t.row order by t.final_event_date desc, t.project_id desc), '[]'::jsonb)
    into v_quotes
    from (select p.project_id, p.final_event_date,
                 jsonb_build_object(
                   'project_id',       p.project_id,
                   'company_name',     c.company_name,
                   'final_event_date', p.final_event_date,
                   'feedback_score',   p.feedback_score,
                   'feedback_notes',   btrim(p.feedback_notes)) as row
            from public.projects p
            left join public.customers c on c.customer_id = p.customer_id
           where p.feedback_status = 'completed'
             and 'אחר' = any (p.negative_feedback_reasons)
             and nullif(btrim(coalesce(p.feedback_notes, '')), '') is not null
             and (p_customer_id is null or p.customer_id = p_customer_id)
           order by p.final_event_date desc, p.project_id desc
           limit 8) t;

  if v_run.run_id is not null then
    -- ── מטריצת-ההסכמה אדם↔מודל · **הצד השלילי** ('אחר' קיים בשתי הרשימות ⇒ שתי עמודות) ──
    -- 🔑 **"מספר-הסכמה בודד אינו מדד"** (📑ב#20): המטריצה היא תגית-לקוח × נושא-מודל,
    -- עם מכנה גלוי לכל שורה. 📐7 — "אחר" אחרון תמיד.
    with pick as (
      -- שורה אחת לפרויקט מתוך **כל** הריצות המאושרות; אם פרויקט סווג פעמיים,
      -- המאושרת האחרונה גוברת. (16/09/2026 אין חפיפה — 426 שורות, 426 פרויקטים.)
      select distinct on (i.project_id) i.*
        from public.feedback_ai_insights i
        join public.feedback_ai_runs r on r.run_id = i.run_id
       where r.approved_at is not null
       order by i.project_id, r.approved_at desc, i.run_id desc
    )
    select coalesce(jsonb_agg(t.row order by (t.human_tag = 'אחר'), t.total desc, t.human_tag), '[]'::jsonb)
      into v_matrix
      from (select h.reason as human_tag,
                   count(*)::integer as total,
                   count(*) filter (where i.unclassifiable)::integer as unclassifiable,
                   count(*) filter (where h.reason = any (i.negative_topics))::integer as agreed,
                   jsonb_build_object(
                     'human_tag',      h.reason,
                     'total',          count(*),
                     'agreed',         count(*) filter (where h.reason = any (i.negative_topics)),
                     'unclassifiable', count(*) filter (where i.unclassifiable),
                     'by_topic', (select coalesce(jsonb_object_agg(m.topic, m.n), '{}'::jsonb)
                                    from (select tt.topic, count(*)::integer as n
                                            from public.projects p2
                                            join pick i2 on i2.project_id = p2.project_id
                                            cross join lateral unnest(i2.negative_topics) as tt(topic)
                                           where h.reason = any (p2.negative_feedback_reasons)
                                             and (p_customer_id is null or p2.customer_id = p_customer_id)
                                           group by tt.topic) m)) as row
              from public.projects p
              join pick i on i.project_id = p.project_id
              cross join lateral unnest(p.negative_feedback_reasons) as h(reason)
             where (p_customer_id is null or p.customer_id = p_customer_id)
             group by h.reason) t;

    with pick as (
      -- שורה אחת לפרויקט מתוך **כל** הריצות המאושרות; אם פרויקט סווג פעמיים,
      -- המאושרת האחרונה גוברת. (16/09/2026 אין חפיפה — 426 שורות, 426 פרויקטים.)
      select distinct on (i.project_id) i.*
        from public.feedback_ai_insights i
        join public.feedback_ai_runs r on r.run_id = i.run_id
       where r.approved_at is not null
       order by i.project_id, r.approved_at desc, i.run_id desc
    )
    select count(*) filter (where i.red_flag),
           count(*) filter (where i.unclassifiable),
           count(*)
      into v_flags, v_unclass, v_classified
      from pick i
      join public.projects p on p.project_id = i.project_id
     where (p_customer_id is null or p.customer_id = p_customer_id);

    -- `free_topic` — **הכרעה 11 של ת2**: מה "אחר" מכיל. 📑ב#20 מציג רק `n≥3`,
    -- והשאר נספרים יחד תחת "תגיות בודדות".
    with pick as (
      -- שורה אחת לפרויקט מתוך **כל** הריצות המאושרות; אם פרויקט סווג פעמיים,
      -- המאושרת האחרונה גוברת. (16/09/2026 אין חפיפה — 426 שורות, 426 פרויקטים.)
      select distinct on (i.project_id) i.*
        from public.feedback_ai_insights i
        join public.feedback_ai_runs r on r.run_id = i.run_id
       where r.approved_at is not null
       order by i.project_id, r.approved_at desc, i.run_id desc
    )
    select coalesce(jsonb_agg(jsonb_build_object('topic', t.topic, 'n', t.n)
                              order by t.n desc, t.topic) filter (where t.n >= 3), '[]'::jsonb),
           coalesce(sum(t.n) filter (where t.n < 3), 0)::integer
      into v_free, v_free_one
      from (select btrim(i.free_topic) as topic, count(*)::integer as n
              from pick i
              join public.projects p on p.project_id = i.project_id
             where nullif(btrim(coalesce(i.free_topic, '')), '') is not null
               and (p_customer_id is null or p.customer_id = p_customer_id)
             group by btrim(i.free_topic)) t;

    -- שורות הדוח — **רק מהריצה המאושרת**, עם `free_topic` על כל שורה.
    with pick as (
      -- שורה אחת לפרויקט מתוך **כל** הריצות המאושרות; אם פרויקט סווג פעמיים,
      -- המאושרת האחרונה גוברת. (16/09/2026 אין חפיפה — 426 שורות, 426 פרויקטים.)
      select distinct on (i.project_id) i.*
        from public.feedback_ai_insights i
        join public.feedback_ai_runs r on r.run_id = i.run_id
       where r.approved_at is not null
       order by i.project_id, r.approved_at desc, i.run_id desc
    )
    select coalesce(jsonb_agg(t.row order by t.red_flag desc, t.final_event_date desc, t.project_id desc), '[]'::jsonb)
      into v_rows
      from (select p.project_id, p.final_event_date, i.red_flag,
                   jsonb_build_object(
                     'drill_key',        jsonb_build_object('kind', 'project', 'id', p.project_id),
                     'project_id',       p.project_id,
                     'company_name',     c.company_name,
                     'final_event_date', p.final_event_date,
                     'feedback_score',   p.feedback_score,
                     'customer_tags',    to_jsonb(p.negative_feedback_reasons),
                     -- why (G3): שדה-החיבור של הסינון-הצולב ממטריצת-ההסכמה. אותו נימוק
                     -- כמו במ20: המעטפת משווה סקלר מול סקלר, ו-`customer_tags` הוא מערך.
                     -- הערך נגזר **מאותו מקור בדיוק** שממנו נבנית המטריצה
                     -- (`unnest(p.negative_feedback_reasons)`) ⇒ המפגש מדויק לפי בנייה.
                     -- הערה ללא תגית-לקוח מקבלת `null` ואינה נתפסת באף דאטום. נסתר.
                     'human_tag',        p.negative_feedback_reasons[1],
                     'feedback_notes',   nullif(btrim(coalesce(p.feedback_notes, '')), ''),
                     'model_topics',     to_jsonb(i.negative_topics),
                     'free_topic',       nullif(btrim(coalesce(i.free_topic, '')), ''),
                     'sentiment',        i.sentiment,
                     'quote',            i.quote,
                     'red_flag',         i.red_flag,
                     'unclassifiable',   i.unclassifiable) as row
              from pick i
              join public.projects p on p.project_id = i.project_id
              left join public.customers c on c.customer_id = p.customer_id
             where (p_customer_id is null or p.customer_id = p_customer_id)) t;

    -- הזוג הגדול ביותר "מה הלקוח תייג ⇒ מה המודל מצא", לשורת-"אז מה" של 📑#20.
    with pick as (
      -- שורה אחת לפרויקט מתוך **כל** הריצות המאושרות; אם פרויקט סווג פעמיים,
      -- המאושרת האחרונה גוברת. (16/09/2026 אין חפיפה — 426 שורות, 426 פרויקטים.)
      select distinct on (i.project_id) i.*
        from public.feedback_ai_insights i
        join public.feedback_ai_runs r on r.run_id = i.run_id
       where r.approved_at is not null
       order by i.project_id, r.approved_at desc, i.run_id desc
    )
    select jsonb_build_object('human_tag', t.human_tag, 'model_topic', t.model_topic, 'n', t.n)
      into v_top_pair
      from (select h.reason as human_tag, mt.topic as model_topic, count(*)::integer as n
              from public.projects p
              join pick i on i.project_id = p.project_id
              cross join lateral unnest(p.negative_feedback_reasons) as h(reason)
              cross join lateral unnest(i.negative_topics) as mt(topic)
             where h.reason <> mt.topic
               and (p_customer_id is null or p.customer_id = p_customer_id)
             group by 1, 2
             order by 3 desc, 1, 2
             limit 1) t;

    -- `model` נשאר מפתח-מחרוזת (לא משנים צורת-מפתח), אך הוא נוקב בשני המודלים
    -- שמאחורי השורות; הפירוט המלא ב-`models` וב-`runs`.
    v_run_json := jsonb_build_object(
      'run_id', v_run.run_id, 'status', v_run.status,
      'model', array_to_string(v_models, ' + '),
      'models', v_models_j,
      'runs', v_runs,
      'run_count', v_run_cnt,
      'finished_at', v_run.finished_at, 'approved_at', v_run.approved_at,
      'approved_by', v_run.approved_by,
      'approved_by_email', v_run.approved_by_email,
      'sent_count', v_sent, 'ok_count', v_ok, 'failed_count', v_failed,
      'classified', v_classified, 'unclassifiable', v_unclass);
  else
    v_matrix := '[]'::jsonb;
    v_rows   := '[]'::jsonb;
    v_free   := '[]'::jsonb;
    v_notes  := v_notes || to_jsonb('טרם אושרה ריצת-ניתוח — הדף אינו מציג סיווג שלא אושר.'::text);
  end if;

  v_notes := v_notes
    || to_jsonb('הדף אינו מגיב למסנן התקופה — הוא מציג את תוצאת כל ריצות-הניתוח שאושרו.'::text)
    -- 🔴 **ההצהרה הקודמת הייתה שקרית על אריח אחד מארבעה.** *"אריחי המצאי … אינם
    -- מושפעים ממסנן הלקוח"* נכון לשלושת אריחי-המצאי, **ולא ל"דגלים אדומים"** — שהוא
    -- כן מסונן (נמדד: 24 ⇐ 5 עם `p_customer_id=401`). המשפט נוקב עכשיו בשלושה,
    -- ו-`meta.customer_filter_ignored` מונה אותם במפורש.
    || to_jsonb('שלושת אריחי המצאי — הערות, "אחר", ו"אחר" מול הקטגוריות — נספרים על כל הזמנים ואינם מושפעים ממסנן הלקוח; אריח הדגלים האדומים והטבלה כן מושפעים ממנו.'::text);
  if v_run_cnt > 1 then
    -- 🪤 J1 · **המשפט הסתיים בשני מזהי-מודל של הספק** (`gemini-3.5-flash-lite,
    --    gemini-3.8-flash`). עובדת-שבוע-ראשון אינה יכולה לעשות איתם דבר, והם
    --    ארטיפקט-הנדסה על מסך-מוצר. הפירוט המלא לא אבד ואינו זז: `meta.models`
    --    (מודל · ריצות · שורות), `meta.run.models` ו-`meta.run.runs` ממשיכים
    --    לשאת אותו — שם הייצוא והבדיקה קוראים אותו.
    v_notes := v_notes || to_jsonb((v_lri || to_char(v_run_cnt, 'FM999,999,999') || v_pdi
      || ' ריצות-ניתוח מאושרות מוצגות יחד, שורה אחת לכל פרויקט.')::text);
  end if;
  if p_drill is not null then
    v_notes := v_notes || to_jsonb('הדף אינו דוח-קידוח (📐13) — פרמטר הקידוח לא הופעל.'::text);
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_with_note,
      'label', 'אוכלוסייה: הערות חופשיות שלקוחות כתבו בטופס המשוב · '
               || v_lri || to_char(v_with_note, 'FM999,999,999') || v_pdi || ' הערות מתוך '
               || v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi
               || ' משובים שהושלמו, כל הזמנים · הוצאו: משובים שנשלחו ולא נענו ומשובים בלי טקסט. הדף אינו מגיב למסנן התקופה — הוא מציג את תוצאת כל ריצות-הניתוח שאושרו.',
      'excluded', jsonb_build_object('משוב שהושלם בלי טקסט', v_completed - v_with_note)),
    'window', jsonb_build_object(
      'from', v_from, 'to', v_to,
      'label', 'כל הזמנים · נכון ל-' || v_lri || to_char(v_today, 'DD/MM/YYYY') || v_pdi),
    'tiles', jsonb_build_array(
      jsonb_build_object(
        'key', 'free_notes',
        'label', 'הערות חופשיות שנכתבו',
        'value', v_with_note,
        'format', 'int',
        'sub', 'מתוך ' || v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' משובים שהושלמו ('
               || v_lri || coalesce(to_char(round(100.0 * v_with_note / nullif(v_completed, 0), 1), 'FM999990.0'), '—')
               || '%' || v_pdi || ' כתבו משהו) · ' || v_lri || to_char(v_distinct, 'FM999,999,999') || v_pdi || ' נוסחים שונים',
        'detail', jsonb_build_object('notes', v_with_note, 'completed', v_completed, 'distinct_notes', v_distinct),
        'window', 'כל הזמנים · נכון ל-' || v_lri || to_char(v_today, 'DD/MM') || v_pdi,
        'compare', jsonb_build_object(
          'value', null,
          'label', 'אין תקופה קודמת להשוואה — זהו המצאי המצטבר, לא מדד תקופתי',
          'direction', 'flat'),
        'target', null),
      jsonb_build_object(
        'key', 'other_tagged_notes',
        'label', 'מהן שייכות למשוב שתויג "אחר"',
        'value', v_other,
        'format', 'int',
        'sub', case when v_other_txt = v_other
                    then 'לכל ' || v_lri || to_char(v_other, 'FM999,999,999') || v_pdi || ' יש טקסט — אין ולו אחת ריקה'
                    else v_lri || to_char(v_other_txt, 'FM999,999,999') || v_pdi || ' מתוך ' || v_lri || to_char(v_other, 'FM999,999,999') || v_pdi
                         || ' נושאות טקסט' end,
        'detail', jsonb_build_object('other', v_other, 'with_text', v_other_txt,
                                     'by_year', v_other_yr, 'sample_quotes', v_quotes),
        'window', 'כל הזמנים · נכון ל-' || v_lri || to_char(v_today, 'DD/MM') || v_pdi,
        'compare', jsonb_build_object(
          'value', coalesce(v_other_yr_txt, '—'),
          'label', 'פילוח לפי שנה (השנה הנוכחית חלקית)', 'direction', 'flat'),
        'target', null),
      jsonb_build_object(
        'key', 'other_vs_categories',
        'label', 'גודל "אחר" מול הקטגוריות',
        'value', v_other,
        'format', 'int',
        -- 🪤 I2 · ה-`sub` הדפיס את אותו מספר שחצי-ההשוואה נושא כערך.
        'sub', '"אחר" מול ארבע הקטגוריות הקיימות יחד',
        'detail', jsonb_build_object('other', v_other, 'categories', v_rest, 'negative_total', v_other + v_rest),
        'window', 'כל הזמנים · נכון ל-' || v_lri || to_char(v_today, 'DD/MM') || v_pdi,
        'compare', jsonb_build_object(
          'value', v_rest,
          'label', 'מתוך ' || v_lri || to_char((v_other + v_rest), 'FM999,999,999') || v_pdi || ' המשובים השליליים בסך הכול',
          'direction', case when v_other > v_rest then 'up' when v_other < v_rest then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object(
        'key', 'red_flags',
        'label', 'דגלים אדומים',
        -- 🔴 **`null` ולא `0`** — אפס כאן היה נקרא "אין בעיות", וזו אמירה שאיש לא בדק.
        'value', case when v_run.run_id is null then null else v_flags end,
        'format', case when v_run.run_id is null then 'text' else 'int' end,
        'sub', case when v_run.run_id is null
                    then 'טרם אושרה ריצה — לא 0. אפס כאן היה נקרא "אין בעיות", וזו אמירה שאיש לא בדק'
                    else 'מתוך ' || v_lri || to_char(v_classified, 'FM999,999,999') || v_pdi || ' הערות מסווגות · '
                         || v_lri || to_char(v_unclass, 'FM999,999,999') || v_pdi || ' לא ניתן לסווג'
                         || case when v_run_cnt > 1
                                 then ' · ' || v_lri || to_char(v_run_cnt, 'FM999,999,999') || v_pdi || ' ריצות מאושרות'
                                 else '' end end,
        'detail', jsonb_build_object(
          'red_flags', case when v_run.run_id is null then null else v_flags end,
          'classified', case when v_run.run_id is null then null else v_classified end,
          'unclassifiable', case when v_run.run_id is null then null else v_unclass end,
          'free_topics', v_free,
          'free_topics_singletons', case when v_run.run_id is null then null else v_free_one end,
          'models', case when v_run.run_id is null then null else v_models_j end),
        'window', case
          when v_run.run_id is null then '—'
          when v_run_cnt = 1
            then 'הריצה מ-' || v_lri
                 || to_char(v_run.approved_at at time zone 'Asia/Jerusalem', 'DD/MM/YYYY') || v_pdi
          else v_lri || to_char(v_run_cnt, 'FM999,999,999') || v_pdi || ' ריצות מאושרות · האחרונה מ-' || v_lri
               || to_char(v_run.approved_at at time zone 'Asia/Jerusalem', 'DD/MM/YYYY') || v_pdi end,
        -- 🪤 I1 · **האריח הראה דגלים על שתי ריצות מאושרות, וחצי-ההשוואה שלו
        --    אמר *"יימדד אחרי הריצה הראשונה"*** — משפט שסותר את המספר שלידו.
        --    אין ספירת ריצה-קודמת נמדדת כאן ⇒ **`compare: null` כשיש ריצה**
        --    (שורה שאינה נמדדת אינה מוצגת), והמשפט נשאר רק כשאין.
        'compare', case when v_run.run_id is null
                        then jsonb_build_object('value', null, 'label', 'יימדד אחרי הריצה הראשונה', 'direction', 'flat')
                        else null end,
        'target', null)),
    -- §📊 לדוח 20: *"עמודות לפי נושא (מודל) לצד עמודות לפי תגית (לקוח) — ההשוואה היא הגרף"*.
    -- בלי ריצה מאושרת אין מה להשוות, ולכן `null` — ולא גרף ריק שנראה כמו תקלה.
    'chart', case when v_run.run_id is null then null else jsonb_build_object(
      'type', 'bar',
      'title', 'מטריצת ההסכמה · מה הלקוח תייג מול מה המודל מצא · מתוך '
               || v_lri || to_char(v_classified, 'FM999,999,999') || v_pdi || ' הערות מסווגות',
        -- 🪤 I1 · `series[].format` הוא הקודם ל-`unit` בגזירת תו-הסימון
        --    ובטולטיפ, והוא היה `null`. הערכים עצמם אינם זזים.
      'series', jsonb_build_array(
        jsonb_build_object('key', 'total',          'label', 'תויג ע"י הלקוח', 'format', 'int'),
        jsonb_build_object('key', 'agreed',         'label', 'המודל הסכים', 'format', 'int'),
        jsonb_build_object('key', 'unclassifiable', 'label', 'לא ניתן לסווג', 'format', 'int')),
      'data', v_matrix,
      'xKey', 'human_tag',
      -- ✅ **הסינון-הצולב של הכרטיס** ①: *"הטבלה מתכווצת להערות שבצירוף תגית×נושא"*.
      -- נמסר **ברמת-התגית** ולא ברמת-התא: המעטפת בוחרת ערך אחד (`datum[xKey]`)
      -- ומשווה אותו לשדה-שורה אחד, ואין בה בחירת-צירוף דו-ממדית. ⇒ לחיצה
      -- על עמודת "אחר" מכווצת ל-33 ההערות שהלקוח תייג "אחר", וטור-הנושא
      -- של המודל (`model_topics`) נקרא בעין בתוך הטבלה המכווצת.
      -- **פער-תא מדווח לפזה 4, לא הוכרע כאן.** כיסוי מדוד: חמישה דאטומים,
      -- חמישה עם שורות (12 · 10 · 6 · 2 · 33 = 63 מתוך 426).
      'filter_key', 'human_tag',
      'domain', null,
      'refLines', '[]'::jsonb,
      -- 🪤 I1 · **`chart.unit` הוא שם-פורמט של C8, לא מחרוזת-תצוגה.**
      --    ‏`ChartCard.valueFormat` מחזיר `series[0].format ?? unit` ומזין את
      --    ‏`formatAxisTick`, ו-`HebrewTooltip` מזין את `formatByType` — שניהם מצפים
      --    ל-`money|percent|int|ratio|score|days|text|date`. מחרוזת-תצוגה היא **פורמט
      --    לא-מוכר** ⇒ הציר נופל לקיבוץ-אלפים חשוף והטולטיפ ל-`text`.
      --    הכיתוב העברי נשמר ב-`unit_label` (תוספתי; **אין לו קורא היום** — מדווח).
      'unit', 'int', 'unit_label', 'הערות') end,
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'company_name',     'label', 'לקוח',            'format', 'text', 'align', 'start'),
      -- 🪤 I1 · `date` במטען ⇒ `"2026-06-22"`; `date` מנתב ל-`formatIsraelDate`.
      jsonb_build_object('key', 'final_event_date', 'label', 'תאריך',           'format', 'date', 'align', 'start'),
      jsonb_build_object('key', 'feedback_score',   'label', 'ציון (לקוח)',     'format', 'int',  'align', 'end'),
      jsonb_build_object('key', 'feedback_notes',   'label', 'ההערה שנכתבה',    'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'model_topics',     'label', 'נושא (מודל)',     'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'free_topic',       'label', 'תג חופשי (מודל)', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'sentiment',        'label', 'סנטימנט (מודל)',  'format', 'int',  'align', 'end'),
      -- 📐9 · הטבלה ממוינת דגל-אדום תחילה ואז תאריך יורד.
      jsonb_build_object('key', 'red_flag',         'label', 'דגל אדום',        'format', 'text', 'align', 'start',
                         'sorted', 'descending')),
    'rows', v_rows,
    -- 📐23 · כשאין ריצה, האמירה היא **מה חסר** — ולא ממצא-מודל מומצא (⑧22.2).
    'so_what', case
      when v_run.run_id is null
        then 'להריץ את הניתוח על ' || v_lri || to_char(v_with_note, 'FM999,999,999') || v_pdi || ' ההערות — '
             || v_lri || to_char(v_other, 'FM999,999,999') || v_pdi
             || ' מהן שייכות למשובים שתויגו "אחר", והן הדלי השלילי הגדול במערכת ואיש עדיין לא קרא אותן.'
      when v_top_pair is null
        then 'לעבור על ' || v_lri || to_char(v_classified, 'FM999,999,999') || v_pdi
             || ' ההערות המסווגות — המודל לא מצא ולו נושא אחד ששונה ממה שהלקוח תייג.'
      else 'לשקול קטגוריה חדשה בטופס-המשוב — המודל מצא "' || (v_top_pair ->> 'model_topic')
           || '" ב-' || v_lri || to_char((v_top_pair ->> 'n')::integer, 'FM999,999,999') || v_pdi || ' הערות שהלקוח תייג "'
           || (v_top_pair ->> 'human_tag') || '".' end,
    'definitions', 'הגדרות: הערה חופשית = טקסט שהלקוח כתב בשדה הפתוח של טופס המשוב, בנוסף לציון ולסיבה · ריצת ניתוח = מעבר של מודל שפה על ההערות, באצווה ולא בזמן אמת. הוא מקבל טקסט וציון בלבד — לא שם לקוח ולא סכומים · ריצה מאושרת = ריצה שמישהו בדק בה 20 דוגמאות ואישר להצגה. הדוח מציג רק ריצות מאושרות · נושא (מודל) = הקטגוריה שהמודל בחר, מתוך אותה רשימה סגורה שהלקוח בוחר ממנה — כדי שאפשר יהיה להשוות · תג חופשי = מילה–שתיים שהמודל מוסיף כשהוא מסווג "אחר", כדי שנדע מה "אחר" מכיל · לא ניתן לסווג = המודל לא הצליח לשייך את ההערה לאף קטגוריה. זו תשובה תקינה, לא תקלה · דגל אדום = הערה שהמודל סימן כדורשת התייחסות מיידית.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', '[]'::jsonb,
      'frozen_count', null,
      'notes', v_notes,
      -- C8: *"`meta.export_blocked_reason` — report 22 before an approved run"*, בנוסח
      -- הנעול של `EXPORT_NO_APPROVED_RUN` (`src/lib/reportsExport.js`), מילה במילה.
      'export_blocked_reason', case when v_run.run_id is null
                                    then 'אין שורות לייצא — טרם אושרה ריצת-ניתוח'
                                    else null end,
      'customer_filter_ignored', jsonb_build_array(
        'free_notes', 'other_tagged_notes', 'other_vs_categories'),
      'drill_echo', p_drill,
      'models', v_models_j,
      -- הריצה הלא-מאושרת האחרונה — **לפס של מ25 בלבד**. `null` כשאין אחת.
      'run_in_progress', v_prog,
      'run', v_run_json));
end;
$function$;

comment on function public.report_m22_notes(date, date, integer, jsonb) is
  'ניתוח הערות (מ22) — קריאה בלבד, מגודר על מודול לקוחות. אוכלוסייה: הערות חופשיות שלקוחות כתבו בטופס המשוב, כל הזמנים; הוצאו משובים שנשלחו ולא נענו ומשובים בלי טקסט. הדוח מציג שורות מכל ריצות-הסיווג שאושרו, שורה אחת לכל פרויקט (המאושרת האחרונה גוברת); בלי ריצה מאושרת הוא מחזיר rows ריק, meta.run ריק, meta.export_blocked_reason נעול, ואריח הדגלים האדומים מחזיר null ולא 0. שלושת אריחי המצאי אינם מגיבים למסנן הלקוח; אריח הדגלים האדומים והטבלה כן. הדף אינו מגיב למסנן התקופה.';

revoke execute on function public.report_m22_notes(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m22_notes(date, date, integer, jsonb) to authenticated;
