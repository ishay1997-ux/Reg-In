-- =============================================================================
-- ‏מודול 11 · מיגרציה D2 · תיקון-קדימה לארבע פונקציות-השרת של לשונית "הנהלה"
-- =============================================================================
-- 🎯 **מה זה:** תיקון-קדימה לממצאי סבב-האימות היריב על מיגרציה D
--    (`20260916052600_module11_d_rpcs_executive.sql`). ‏**הקובץ ההוא אינו נערך** — הוא הוחל,
--    ומיגרציה שהוחלה מתוקנת אך ורק במיגרציה חדשה קדימה (`supabase/migrations/CLAUDE.md §2`).
--    **אין טבלה חדשה, אין עמודה חדשה, אין policy חדשה, אין שינוי-חתימה, אין כתיבה.**
--    ארבע הפונקציות נבנות מחדש מהגוף **המאומת**: ‏`md5(prosrc)` של ארבעתן נמשך מהמסד
--    ‏16/09/2026 08:1X והושווה ל-md5 של הגוף שבין תגי-הדולר בקובץ D — **4/4 זהים**, ולכן
--    עריכת-הטקסט של הקובץ שקולה לעריכת הגוף החי.
--
-- 🧾 **מלכודת-הרשומות בהחלה מפוצלת:** ‏`apply_migration` קוטם סביב ~90KB, ולכן הקובץ מוחל
--    בארבעה נתחים — אחד לכל פונקציה — וכל נתח מקבל **שורת-רישום משלו**:
--    `module11_d2_executive_m02` · `..._m03` · `..._m04` · `..._m06`. זו סטייה מודעת מ"קובץ
--    אחד = שורה אחת", והיא רשומה כאן כדי שסשן עתידי שיראה ארבע שורות ידע שהן קובץ אחד.
--
-- 🧭 **הכרעות התיקון — שלושה בלוקרים, ארבעה מייג'ורים, שלושה מינורים:**
--    🔴 **B1 · מ6 · גרף-הפיזור חזר בלי ציר-Y.** ‏`series` נשלח כאיבר יחיד; ‏`ScatterBody`
--         קורא את `series[1].key` כעמודת-ה-Y ⇒ `dataKey="y"` שאינו קיים באף נקודה ⇒ 717
--         נקודות ללא ערך-Y, **בלי שגיאה ובלי בדיקה אדומה**. זהו התאום המדויק של הפגם שתיקון
--         F2 מצא בדוח 16 (`20260916065642_..._f2_...sql:1244-1252`) — אותה מלכודת, לשונית אחרת.
--    🔴 **B2 · מ3 · `domain: [0,100]` על גרף שערכיו מיליוני ₪.** ‏`BarBody` מחזיק ציר-Y אחד
--         ומעביר לו את `domain` ⇒ עמודות 1.9M נחתכות לתקרה 100. נעילת-ה-0–100 של ⑧ 3.4
--         שייכת לציר-**הימני**, וזה ציר שהרכיב קובע (כמו ב-`ParetoBody`), לא המטען.
--    🔴 **B3 · מ6 · הקו האלכסוני `y=x` צויר מ-(0,0) ל-(100,100)** בעוד הנתונים רצים 40–600
--         אורחים — כלומר קו זעיר בפינה. `from`/`to` נמדדים עכשיו מהמטען.
--    🟠 **M1 · אפס `comment on function` על ארבעתן** — ‏C5 מחייב הצהרת-אוכלוסייה בהערת
--         הפונקציה, וזה המקום היחיד שבו ההגדרה חיה **ליד** הקוד ולא במסמך נפרד.
--    🟠 **M2 · `meta.sort` נעדר.** הקורא בפועל של המיון הוא `meta.sort`
--         (`ReportSurface.jsx:297`); הנפילה-לאחור `sortFromColumns` (שורה 110) ממפה כל ערך
--         שאינו `'ascending'` ל-`'descending'` ⇒ ‏`sorted:'asc'` של מ3 הכריז
--         ‏`aria-sort="descending"` על עמודה **עולה**. ‏`columns[].sorted` נשאר כפי שהוא.
--    🟠 **M3 · `unit` נשלח כסימן (`'₪'` · `'%'` · `'אורחים'`) ולא כשם-פורמט.**
--         ‏`formatByType(v, unit)` מחפש אותו במפת-הפורמטים ונופל ל-`text` ⇒ הטולטיפ וטבלת
--         קורא-המסך הציגו `237414.51` ו-`57.764887800252716`. עכשיו `money`/`percent`/`int`,
--         ו-`series[].format` נוסף פר-סדרה לגרף שמערבב ₪ ואחוז.
--    🟠 **M4 · מ6 · `to_char(50,'FM999,990.99')` מחזיר `'50.'`.** ‏`FM` מוחק אפסים-נגררים
--         ולא את הנקודה ⇒ «פרמטר-תכנון 50.‏» בחמישה מקומות על המסך, מול נוסח-הכרטיס
--         *"פרמטר-תכנון 50 — לא יעד"* מילה-במילה.
--    🟡 **N1 · מ6 · קו-פרמטר-התכנון בהיסטוגרמה לא צויר כלל** — ציר-X קטגוריאלי
--         (`xKey='label'`) ו-`ReferenceLine x={50}` אינו בתחום-הסקאלה. העוגן הוא תווית-הדלי
--         שבו נופל הפרמטר, נגזרת מהפרמטר החי.
--    🟡 **N2 · מ2 · `xKey='month'` הוא תאריך-ISO** ⇒ ציר של `2026-01-01` במקום «ינואר».
--    🟡 **N3 · מ2/מ3 · `population.excluded` נספר גלובלית בעוד `n` מסונן לפי לקוח** ⇒ פירוק
--         שאינו מסתכם באוכלוסייה שהוא מפרק (על לקוח 401: n=50 מול "500 מחוץ לחלון").
--
-- 🚫 **מה שנמצא ולא תוקן כאן, כי אינו בשטח-הכתיבה של מיגרציה — מדווח לבונה-הלשונית:**
--    · ‏`ChartCard.BarBody` מתעלם מ-`series[].kind` ו-`.axis` ⇒ קו-הרווח של מ2 וקו-השוליים
--      של מ3 מרונדרים כעמודה שלישית. ‏`ComposedChart` קיים ברכיב, אך רק ב-`ParetoBody`.
--    · ‏`KpiTile` אינו מרנדר `tiles[].sub` כלל ⇒ **תת-שורת-המכנה-הגלוי של 📑ב אינה מגיעה
--      למסך באף אחד מארבעת הדפים** — והיא הסיבה שהתוספת הזו נוספה ל-C8 מלכתחילה.
--    · ‏`ReportTable` סופר `rows.length` ומתעלם מ-`meta.row_total` ⇒ הפאג'ר יאמר
--      *"1–8 מתוך 8"* במקום *"1–8 מתוך 236"* שהכרטיס נוקב בו (📐8).
--
-- 🧮 **מה שלא השתנה, ובמכוון:** כל מספר שקו-הבסיס של 10/09/2026 נמדד עליו — 1,922,441 ₪ ·
--    ‏58.3% · 236 · 45.5% · 253.7/259.8/298.8 · 44.2/45.9/47.4 · 727/71.3% · 717 · 40.8 · 31 ·
--    ‏135 — **חוזר ביט-בביט אחרי התיקון**; ארבעת השערים (`assert_module_permission('כספים')`),
--    ‏`security definer`, `search_path=''`, ההענקות, גבולות-החלון (📐 §9 D-17: לוח סגור
--    ‏`[from,to]`) והאוכלוסיות — ללא נגיעה.
--
-- 📏 **מעבר שני על אותו קובץ (16/09 09:1X) — שני כללים שהגיעו מהמאמת של לשונית-הדיילות:**
--    ✅ **כלל א' — `n=` בתוך הבידוד — נמדד ולא שונה.** ‏`'n=' || chr(8294) || value || chr(8297)`
--       מרונדר "106=n" בפסקת-RTL, כי ה-`=` מקבל את כיוון-הפסקה. ‏**נבדק בארבע הפונקציות:
--       ‏4/4 כבר כותבות `chr(8294) || 'n=' || value || chr(8297)`** — אפס הפרות, אפס תיקונים.
--    🔧 **כלל ב' — מפרידי-אלפים על כל מונה במשפט-שרת:** 30 אתרים עברו ל-
--       `to_char(x,'FM999,999,999')`. ‏**היום אף מונה אינו חוצה 999** ⇒ המחרוזות זהות בית-בבית,
--       וזה תיקון **פרוספקטיבי**: `v_pop_n` של מ3/מ4 עומד על 731 ויחצה 1,000 תוך שנה, ואז
--       "1731" היה מופיע בלי מפריד בדיוק כמו ב-מ14. ‏🔑 **התיקון נעשה כשהוא עדיין בלתי-נראה,
--       כי ברגע שייראה — איש לא יידע שהוא חסר.**
--    🔴 **ושני מקומות שבהם המספר יצא חשוף לגמרי, ושתי הסריקות שלי פספסו:**
--       · מ6 `meta.notes` — `v_missing_actual || ' אירועים הוצאו…'` **בלי LRI/PDI** (סריקת
--         4-ספרות פספסה כי 14 קצר, וסריקת-האריחים פספסה כי זה `meta.notes`).
--       · מ4 `meta.notes` — תווית-המדרג `6–10%` בתוך משפט עברי בלי בידוד.
--    ⛔ **`meta.extra_tables` — אינו מוחזר באף אחת מארבע הפונקציות** (נמדד על המטענים החיים),
--       ולכן `extra_tables[].sort` אינו רלוונטי כאן.
--
-- 🔁 **הפיכוּת:** החלה-מחדש של גוף D מהקובץ הישן מחזירה את המצב הקודם; אין שינוי-סכימה.
-- =============================================================================


-- ═══════════════════════════ 1 · `report_m02_exec_overview` ═══════════════════════════
create or replace function public.report_m02_exec_overview(
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
  -- הכרעה 36 — ארבעת הסטטוסים, בשמותיהם במסד. טעות-הקלדה כאן אינה שגיאה אלא דוח ריק.
  v_statuses constant text[] :=
    array['finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished'];
  v_months_he constant text[] := array['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  v_lri constant text := chr(8294);   -- U+2066 LRI — כמו `isolateLtr` ב-reportsFormat.js
  v_pdi constant text := chr(8297);   -- U+2069 PDI
  v_today date := (now() at time zone 'Asia/Jerusalem')::date;
  v_from date;
  v_to date;
  v_prev_from date;
  v_prev_to date;
  v_n integer;
  v_rev numeric;
  v_prof numeric;
  v_frozen integer;
  v_prev_n integer;
  v_prev_rev numeric;
  v_prev_prof numeric;
  v_ncust integer;
  v_total_rev numeric;
  v_top5 numeric;
  v_prev_ncust integer;
  v_prev_total numeric;
  v_prev_top5 numeric;
  v_chart jsonb;
  v_rows jsonb;
  v_customers_all integer;
  v_projects_all integer;
  v_excl_status integer;
  v_excl_window integer;
  v_customer_name text;
  v_margin numeric;
  v_prev_margin numeric;
  v_top5_pct numeric;
  v_prev_top5_pct numeric;
  v_growth numeric;
  v_window_text text;
  v_notes jsonb := '[]'::jsonb;
  v_so_what text;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  v_to   := coalesce(p_to, v_today);
  v_from := coalesce(p_from, date_trunc('year', v_to)::date);
  -- "אשתקד" = אותו טווח-ימים בדיוק, שנה אחורה (⑥ מ2) — לא שנה קלנדרית מלאה, אחרת
  -- השנה הרצה תיראה תמיד קטנה.
  v_prev_from := (v_from - interval '1 year')::date;
  v_prev_to   := (v_to   - interval '1 year')::date;

  with scoped as materialized (
    -- מעבר-lateral אחד על כל האוכלוסייה עד `v_to`; כל השאר נגזר ממנו בזיכרון.
    -- 🔴 `scoped` **אינו** מסונן לפי לקוח: אריח נתח-5 הוא מדד-ריכוזיות חברתי, ונתח של
    -- לקוח יחיד מול עצמו הוא תמיד 100%. הסינון מוחל ב-`cur`/`prev`/`rows` בלבד.
    select p.project_id,
           p.customer_id,
           p.event_name,
           p.final_event_date,
           fm.revenue,
           fm.gross_profit,
           (pf.final_profit is not null) as frozen
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      cross join lateral public.finance_project_money(p.project_id) fm
     where p.project_status = any (v_statuses)
       and p.final_event_date is not null
       and p.final_event_date <= v_to
  ),
  cur as (
    select * from scoped
     where final_event_date >= v_from
       and (p_customer_id is null or customer_id = p_customer_id)
  ),
  prev as (
    select * from scoped
     where final_event_date >= v_prev_from
       and final_event_date <= v_prev_to
       and (p_customer_id is null or customer_id = p_customer_id)
  ),
  cust_now as (select customer_id, sum(revenue) rev from scoped group by 1),
  cust_prev as (
    select customer_id, sum(revenue) rev from scoped
     where final_event_date <= v_prev_to group by 1
  ),
  top5_now as (
    select count(*)::integer ncust,
           coalesce(sum(rev), 0) total,
           coalesce(sum(rev) filter (where rn <= 5), 0) top5
      from (select rev, row_number() over (order by rev desc) rn from cust_now) t
  ),
  top5_prev as (
    select count(*)::integer ncust,
           coalesce(sum(rev), 0) total,
           coalesce(sum(rev) filter (where rn <= 5), 0) top5
      from (select rev, row_number() over (order by rev desc) rn from cust_prev) t
  ),
  axis as (
    select generate_series(date_trunc('month', v_from), date_trunc('month', v_to),
                           interval '1 month')::date m
  ),
  m_cur as (
    select date_trunc('month', final_event_date)::date m, count(*)::integer n,
           sum(revenue) rev, sum(gross_profit) prof
      from cur group by 1
  ),
  m_prev as (
    select date_trunc('month', final_event_date)::date m, sum(revenue) rev
      from prev group by 1
  ),
  chart as (
    select jsonb_agg(jsonb_build_object(
             'month',           a.m,
             'label',           v_months_he[extract(month from a.m)::integer],
             'revenue_cur',     coalesce(c.rev, 0),
             'profit_cur',      coalesce(c.prof, 0),
             'revenue_prev',    coalesce(pv.rev, 0),
             'event_count_cur', coalesce(c.n, 0),
             -- 📐20: החודש האחרון חלקי כשהחלון נגמר לפניו — הצהרת-אורך, לא עמודה שקרית.
             'partial',         a.m = date_trunc('month', v_to)::date
                                and v_to < (a.m + interval '1 month' - interval '1 day')::date
           ) order by a.m) j
      from axis a
      left join m_cur c on c.m = a.m
      left join m_prev pv on pv.m = (a.m - interval '1 year')::date
  ),
  top_rows as (
    select jsonb_agg(jsonb_build_object(
             'project_id',       t.project_id,
             'event_name',       t.event_name,
             'customer_name',    cu.company_name,
             'final_event_date', t.final_event_date,
             'revenue',          t.revenue,
             'profit',           t.gross_profit,
             'margin',           100 * t.gross_profit / nullif(t.revenue, 0),
             'drill_key',        jsonb_build_object('kind', 'project', 'id', t.project_id)
           ) order by t.revenue desc, t.project_id) j
      from (select * from cur order by revenue desc, project_id limit 8) t
      left join public.customers cu on cu.customer_id = t.customer_id
  ),
  counts as (
    select (select count(*) from public.customers)::integer customers_all,
           -- 🔴 D2 · שלושת המונים האלה נספרו על **כל** המערכת בעוד `n` מסונן לפי לקוח, ולכן
           --    הצהרת-האוכלוסייה (📐2) הציגה על מסנן-לקוח 401 את «‏n=50 · 500 מחוץ לחלון ·
           --    101 בסטטוס אחר» — פירוק שאינו מסתכם באוכלוסייה שהוא מתיימר לפרק. שלושתם
           --    מסוננים עכשיו יחד עם `cur`. `customers_all` נשאר גלובלי **בכוונה**: הוא משרת
           --    רק את אריח נתח-5, שמוצהר כמדד-כלל-חברתי שאינו מגיב למסנן (⑧ 2.4).
           (select count(*) from public.projects
             where (p_customer_id is null or customer_id = p_customer_id))::integer projects_all,
           (select count(*) from public.projects
             where not (project_status = any (v_statuses))
               and (p_customer_id is null or customer_id = p_customer_id))::integer excl_status,
           (select count(*) from public.projects
             where project_status = any (v_statuses)
               and (p_customer_id is null or customer_id = p_customer_id)
               and (final_event_date is null
                    or final_event_date < v_from
                    or final_event_date > v_to))::integer excl_window
  )
  select (select count(*)::integer from cur),
         (select coalesce(sum(revenue), 0) from cur),
         (select coalesce(sum(gross_profit), 0) from cur),
         (select count(*) filter (where frozen)::integer from cur),
         (select count(*)::integer from prev),
         (select coalesce(sum(revenue), 0) from prev),
         (select coalesce(sum(gross_profit), 0) from prev),
         tn.ncust, tn.total, tn.top5,
         tp.ncust, tp.total, tp.top5,
         coalesce(chart.j, '[]'::jsonb),
         coalesce(top_rows.j, '[]'::jsonb),
         counts.customers_all, counts.projects_all, counts.excl_status, counts.excl_window
    into v_n, v_rev, v_prof, v_frozen, v_prev_n, v_prev_rev, v_prev_prof,
         v_ncust, v_total_rev, v_top5, v_prev_ncust, v_prev_total, v_prev_top5,
         v_chart, v_rows, v_customers_all, v_projects_all, v_excl_status, v_excl_window
    from top5_now tn, top5_prev tp, chart, top_rows, counts;

  select c.company_name into v_customer_name
    from public.customers c where c.customer_id = p_customer_id;

  -- 🚫 כל מכנה עובר `nullif` — "אין אירועים" ו"שוליים 0%" אינם אותה אמירה (📐12).
  v_margin        := 100 * v_prof / nullif(v_rev, 0);
  v_prev_margin   := 100 * v_prev_prof / nullif(v_prev_rev, 0);
  v_top5_pct      := 100 * v_top5 / nullif(v_total_rev, 0);
  v_prev_top5_pct := 100 * v_prev_top5 / nullif(v_prev_total, 0);
  v_growth        := 100 * (v_rev / nullif(v_prev_rev, 0) - 1);

  v_window_text := v_lri || to_char(v_from, 'DD/MM') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi;

  if p_customer_id is not null then
    v_notes := v_notes || to_jsonb(
      'אריח «נתח 5 הלקוחות הגדולים» נמדד על כל הלקוחות ואינו מושפע ממסנן-הלקוח — נתח של לקוח יחיד מול עצמו הוא תמיד 100%.'::text);
  end if;
  if p_drill is not null then
    v_notes := v_notes || to_jsonb('מבט-על הנהלה אינו דוח-קידוח (📐13) — פרמטר הקידוח מתעלמים ממנו.'::text);
  end if;

  -- 📐23 + סייג-מבט-על: הפועל נגזר מהדף שהשורה פותחת (מגמות רב-שנתיות — אסטרטגי),
  -- ולכן *"לשים לב ש…"*. 🔴 **והמשפט מחושב ולא מוקלד** — שלושת הענפים קיימים כי דף
  -- שאומר "הצמיחה לא באה על חשבון הרווח" בשנה שבה השוליים ירדו הוא שקר על המסך.
  if v_growth is null or v_prev_margin is null then
    v_so_what := 'לשים לב שאין טווח מקביל אשתקד למדוד מולו — ' ||
      v_lri || to_char(round(v_rev), 'FM999,999,999') || ' ₪' || v_pdi || ' מתחילת התקופה, שולי-רווח ' ||
      v_lri || to_char(round(v_margin, 1), 'FM990.0') || '%' || v_pdi || '.';
  elsif v_margin >= v_prev_margin and v_growth >= 0 then
    v_so_what := 'לשים לב שהצמיחה השנה לא באה על חשבון הרווח — ' ||
      v_lri || to_char(round(v_rev), 'FM999,999,999') || ' ₪' || v_pdi || ' עד ' ||
      v_lri || to_char(v_to, 'DD/MM') || v_pdi || ', גידול של ' ||
      v_lri || to_char(round(v_growth, 1), 'FM990.0') || '%' || v_pdi ||
      ' מול אותו טווח אשתקד, ושולי-הרווח דווקא עלו ל-' ||
      v_lri || to_char(round(v_margin, 1), 'FM990.0') || '%' || v_pdi || '. הפירוט בדוח «מגמות רב-שנתיות».';
  elsif v_growth >= 0 then
    v_so_what := 'לשים לב שהצמיחה השנה באה על חשבון הרווח — ' ||
      v_lri || to_char(round(v_rev), 'FM999,999,999') || ' ₪' || v_pdi || ' עד ' ||
      v_lri || to_char(v_to, 'DD/MM') || v_pdi || ', גידול של ' ||
      v_lri || to_char(round(v_growth, 1), 'FM990.0') || '%' || v_pdi ||
      ' מול אותו טווח אשתקד, אך שולי-הרווח ירדו ל-' ||
      v_lri || to_char(round(v_margin, 1), 'FM990.0') || '%' || v_pdi ||
      ' מול ' || v_lri || to_char(round(v_prev_margin, 1), 'FM990.0') || '%' || v_pdi ||
      '. הפירוט בדוח «מגמות רב-שנתיות».';
  else
    v_so_what := 'לשים לב שההכנסות נמוכות מאותו טווח אשתקד — ' ||
      v_lri || to_char(round(v_rev), 'FM999,999,999') || ' ₪' || v_pdi || ' מול ' ||
      v_lri || to_char(round(v_prev_rev), 'FM999,999,999') || ' ₪' || v_pdi ||
      ', ושולי-הרווח על ' || v_lri || to_char(round(v_margin, 1), 'FM990.0') || '%' || v_pdi ||
      '. הפירוט בדוח «מגמות רב-שנתיות».';
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_n,
      'label', 'אוכלוסייה: אירועים שכבר התקיימו וסגורים תפעולית — פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום · הוצאו: אירועים שטרם התקיימו, אירועים בתהליך ואירועים מבוטלים · ' ||
        v_lri || 'n=' || to_char(v_n, 'FM999,999,999') || v_pdi || ' (מתוך ' || v_lri || to_char(v_projects_all, 'FM999,999,999') || v_pdi ||
        case when p_customer_id is null then ' אירועים במערכת).' else ' אירועים של הלקוח).' end,
      'excluded', jsonb_build_object(
        'אינם באחד מארבעת המצבים', v_excl_status,
        'מחוץ לחלון-התקופה', v_excl_window)
    ),
    'window', jsonb_build_object(
      'from', v_from, 'to', v_to,
      'label', v_lri || extract(year from v_to)::integer || v_pdi || ' (' ||
        v_lri || to_char(v_from, 'DD/MM') || '–' || to_char(v_to, 'DD/MM') || v_pdi || ') · ' ||
        coalesce(v_customer_name, 'כל הלקוחות')
    ),
    'tiles', jsonb_build_array(
      jsonb_build_object(
        'key', 'revenue', 'label', 'הכנסות מתחילת השנה', 'value', v_rev, 'format', 'money',
        'sub', v_lri || to_char(v_n, 'FM999,999,999') || v_pdi || ' אירועים שהסתיימו',
        'window', v_window_text,
        'compare', case when v_prev_rev = 0 then null else jsonb_build_object(
          'value', v_prev_rev,
          'label', v_lri || extract(year from v_prev_to)::integer || v_pdi || ' באותו טווח',
          'note', v_lri || to_char(v_prev_n, 'FM999,999,999') || v_pdi || ' אירועים',
          'direction', case when v_rev > v_prev_rev then 'up' when v_rev < v_prev_rev then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'הנהלה', 'report', 'report_m03_trends', 'drill', null)),
      jsonb_build_object(
        'key', 'margin', 'label', 'שולי-רווח גולמי', 'value', v_margin, 'format', 'percent',
        'sub', v_lri || to_char(round(v_prof), 'FM999,999,999') || ' ₪' || v_pdi || ' רווח מתוך ' ||
               v_lri || to_char(round(v_rev), 'FM999,999,999') || ' ₪' || v_pdi || ' הכנסה',
        'window', v_window_text,
        'compare', case when v_prev_margin is null then null else jsonb_build_object(
          'value', v_prev_margin,
          'label', v_lri || extract(year from v_prev_to)::integer || v_pdi || ' באותו טווח',
          'note', null,
          'direction', case when v_margin > v_prev_margin then 'up' when v_margin < v_prev_margin then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'הנהלה', 'report', 'report_m04_discounts', 'drill', null)),
      jsonb_build_object(
        'key', 'finished_events', 'label', 'אירועים שהסתיימו', 'value', v_n, 'format', 'int',
        'sub', 'ארבעת המצבים — פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום',
        'window', v_window_text,
        'compare', jsonb_build_object(
          'value', v_prev_n,
          'label', v_lri || extract(year from v_prev_to)::integer || v_pdi || ' באותו טווח',
          'note', null,
          'direction', case when v_n > v_prev_n then 'up' when v_n < v_prev_n then 'down' else 'flat' end),
        'target', jsonb_build_object('tab', 'כספים', 'report', 'report_m08_profitability', 'drill', null)),
      jsonb_build_object(
        'key', 'top5_share', 'label', 'נתח 5 הלקוחות הגדולים', 'value', v_top5_pct, 'format', 'percent',
        -- 📑ב (מבט-על הנהלה): המכנה גלוי, ולצידו תת-שורה בשקלים. בלעדיהם 45.5% הוא מספר בלי עולם.
        'sub', v_lri || to_char(round(v_top5), 'FM999,999,999') || ' ₪' || v_pdi || ' מתוך ' ||
               v_lri || to_char(round(v_total_rev), 'FM999,999,999') || ' ₪' || v_pdi || ' · אצל ' ||
               v_lri || to_char(v_ncust, 'FM999,999,999') || v_pdi || ' לקוחות עם הכנסה (מתוך ' || v_lri || to_char(v_customers_all, 'FM999,999,999') || v_pdi || ' רשומים)',
        -- ⑧ 2.4: בסיס אחר מיתר האריחים, **ומוצהר** — מדד-ריכוזיות על חתך של שמונה חודשים אינו מדד.
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה',
        'compare', case when v_prev_top5_pct is null then null else jsonb_build_object(
          'value', v_prev_top5_pct,
          'label', 'לפני שנה, אותו חישוב',
          'note', 'אז ' || v_lri || to_char(v_prev_ncust, 'FM999,999,999') || v_pdi || ' לקוחות עם הכנסה',
          'direction', case when v_top5_pct > v_prev_top5_pct then 'up' when v_top5_pct < v_prev_top5_pct then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'לקוחות', 'report', 'report_m21_drifting', 'drill', null))
    ),
    'chart', jsonb_build_object(
      'type', 'bar',
      'title', 'הכנסה ורווח לפי חודש · ' || v_lri || extract(year from v_to)::integer || ' מול ' ||
               extract(year from v_prev_to)::integer || v_pdi,
      'series', jsonb_build_array(
        jsonb_build_object('key', 'revenue_cur', 'label', 'הכנסה ' || extract(year from v_to)::integer, 'kind', 'bar', 'axis', 'left', 'format', 'money'),
        -- 📐19 · 📑ב: סדרת-אשתקד היא המשמעות היחידה של `slate-400` בדף.
        jsonb_build_object('key', 'revenue_prev', 'label', 'הכנסה ' || extract(year from v_prev_to)::integer, 'kind', 'bar', 'axis', 'left', 'format', 'money'),
        -- ⑧ 2.1: הרווח כ**קו** ולא כעמודה שלישית — 27 עמודות בתשעה חודשים אינן נקראות.
        jsonb_build_object('key', 'profit_cur', 'label', 'רווח גולמי ' || extract(year from v_to)::integer, 'kind', 'line', 'axis', 'left', 'format', 'money')),
      'data', v_chart,
      -- 🔴 D2 · ציר-ה-X היה `month`, שהוא **תאריך-ISO**: `ChartCard` מעביר את `xKey` ישירות
      --    ל-`<XAxis dataKey>` הקטגוריאלי, ולכן על המסך התנוססו `2026-01-01` במקום «ינואר».
      --    השדה `month` נשאר בשורות (הוא המיון ומפתח-הנתונים); הציר עובר ל-`label` העברי.
      'xKey', 'label',
      'domain', null,
      'refLines', '[]'::jsonb,
      -- 🔴 D2 · `unit` אינו סימן-מטבע אלא **שם-פורמט**: `formatByType(v, unit)`
      --    (`src/lib/reportsFormat.js:121`) מחפש אותו במפת-הפורמטים, ו-`'₪'` אינו בה ⇒
      --    נופל ל-`text` ⇒ הטולטיפ וטבלת-קורא-המסך הציגו `237414.51` גולמי במקום `237,415 ₪`.
      'unit', 'money'
    ),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'event_name', 'label', 'אירוע', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'final_event_date', 'label', 'תאריך', 'format', 'date', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'format', 'money', 'align', 'end', 'sorted', 'desc'),
      jsonb_build_object('key', 'profit', 'label', 'רווח', 'format', 'money', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'format', 'percent', 'align', 'end', 'sorted', null)
    ),
    'rows', v_rows,
    'so_what', v_so_what,
    'definitions', 'שולי-רווח = סך הרווח הגולמי חלקי סך ההכנסה על כל האוכלוסייה יחד, לא ממוצע של אחוזים · רווח גולמי = הכנסה פחות עלויות ישירות (דיילות · ציוד · נסיעות); הוצאות המשרד אינן נכללות · נתח 5 הלקוחות הגדולים = הכנסת חמשת הגדולים חלקי הכנסת כל הלקוחות, על כל ההיסטוריה · "אשתקד" = אותם ימים בדיוק בשנה שעברה.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', '[]'::jsonb,
      -- 📑ב#1 · ⑧ G3: מ2 מציג `gross_profit` המחושב (ולא `coalesce(final_profit, …)`),
      -- וההצהרה כמה מהאירועים כבר ננעלו כספית נשארת גלויה.
      'frozen_count', v_frozen,
      'row_total', v_n,
      'notes', v_notes,
      'run', null,
      -- 🔴 D2 · **הקורא בפועל של המיון הוא `meta.sort`** ולא `columns[].sorted`:
      --    `ReportSurface.jsx:297` מעדיף `payload.meta?.sort`, ונופל ל-`sortFromColumns`
      --    שממפה כל ערך שאינו `'ascending'` ל-`'descending'` (שורה 110) — כלומר
      --    `sorted:'asc'` היה מכריז `aria-sort="descending"` על עמודה עולה. הכרזה מפורשת.
      'sort', jsonb_build_object('key', 'revenue', 'direction', 'descending'),
      -- C8 · תאומי E2/F2: הצהרה מפורשת במקום היעדר-מפתח.
      'customer_filter_ignored', false,
      'drill_echo', p_drill)
  );
end;
$function$;

comment on function public.report_m02_exec_overview(date, date, integer, jsonb) is
'מ11 · מבט-על הנהלה (בקרה). אוכלוסייה: אירועים שכבר התקיימו וסגורים תפעולית — finished · awaiting_payment · awaiting_invoice · event_finished (הכרעה 36) — עם final_event_date שאינו null. הוצאו: אירועים שטרם התקיימו, בתהליך ומבוטלים. חלון-לוח סגור [from, to] (§9 D-17), ברירת-מחדל השנה הקלנדרית עד היום בשעון ישראל. הכנסה ורווח גולמי נקראים מ-finance_project_money(); אין כאן חישוב-רווח שני. אריח "נתח 5 הלקוחות הגדולים" נמדד על כל ההיסטוריה ועל כל הלקוחות, ואינו מגיב למסנן-התקופה ולא למסנן-הלקוח (⑧ 2.4).';

revoke execute on function public.report_m02_exec_overview(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m02_exec_overview(date, date, integer, jsonb) to authenticated;

-- ═══════════════════════════ 2 · `report_m03_trends` ═══════════════════════════
create or replace function public.report_m03_trends(
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
  v_statuses constant text[] :=
    array['finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished'];
  v_months_he constant text[] := array['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  v_lri constant text := chr(8294);
  v_pdi constant text := chr(8297);
  v_today date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to date;
  v_this_year integer;
  v_year integer;
  v_month integer;
  v_level integer := 0;
  v_pop_n integer;
  v_min_year integer;
  v_customer_name text;
  v_years jsonb;
  v_tiles jsonb;
  v_chart jsonb;
  v_columns jsonb;
  v_rows jsonb;
  v_row_total integer;
  v_so_what text;
  v_frozen integer;
  v_range_label text;
  v_crumbs jsonb;
  v_notes jsonb;
  v_sort jsonb;
  -- שנת-המוקד ושנת-ההשוואה, כסקלרים ולא כ-`record`: ‏plpgsql אינו מאפשר לכתוב לשדה של
  -- משתנה-`record` שטרם קיבל צורת-שורה, והרמות כאן ממלאות אותם בשלבים.
  v_y_year integer;   v_y_n integer;      v_y_rev numeric;   v_y_prof numeric;
  v_y_margin numeric; v_y_hours numeric;  v_y_price numeric; v_y_cost numeric;
  v_y_frozen integer;
  v_p_year integer;   v_p_n integer;      v_p_rev numeric;   v_p_prof numeric;
  v_p_margin numeric; v_p_hours numeric;  v_p_price numeric; v_p_cost numeric;
  v_m_n integer;      v_m_rev numeric;    v_m_prof numeric;  v_m_margin numeric;
  v_pm_n integer;     v_pm_rev numeric;   v_pm_prof numeric; v_pm_margin numeric;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  -- ⑧ G5: הדף אינו מגיב למסנן-התקופה — `p_from` נזרק, `p_to` נשאר תקרת "נכון-לתאריך".
  v_to := coalesce(p_to, v_today);
  v_this_year := extract(year from v_to)::integer;
  v_notes := jsonb_build_array(
    'הדף אינו מגיב למסנן התקופה — הוא ציר-שנים בהגדרתו, ונמדד על כל ההיסטוריה עד התאריך הנוכחי.',
    'מקור-הרווח: רווח סופי היכן שקפא, אחרת רווח גולמי מחושב.');

  -- ⑦ מ3 · ⑨ מ3 — אימות פרמטר-הקידוח **בשרת** ולא רק בדפדפן, אחרת רמה-שלישית בכתובת
  -- הופכת לשאילתה חופשית. שנה בלי אירועים באוכלוסייה, או חודש מחוץ ל-1–12, מפילים
  -- לרמת-השורש **בלי מסך-שגיאה**.
  v_year  := nullif(p_drill ->> 'year', '')::integer;
  v_month := nullif(p_drill ->> 'month', '')::integer;
  if v_year is not null and not exists (
    select 1 from public.projects p
     where p.project_status = any (v_statuses)
       and p.final_event_date is not null
       and p.final_event_date <= v_to
       and extract(year from p.final_event_date)::integer = v_year
       and (p_customer_id is null or p.customer_id = p_customer_id)
  ) then
    v_year := null;
  end if;
  if v_year is null then
    v_month := null;
  elsif v_month is not null and (v_month < 1 or v_month > 12) then
    v_month := null;
  end if;
  v_level := case when v_year is null then 0 when v_month is null then 1 else 2 end;

  select c.company_name into v_customer_name
    from public.customers c where c.customer_id = p_customer_id;

  -- ── השכבה המשותפת: שנה אחר שנה, מעבר-lateral אחד ───────────────────────────
  with scoped as materialized (
    select p.project_id,
           extract(year from p.final_event_date)::integer yr,
           fm.revenue,
           coalesce(pf.final_profit, fm.gross_profit) profit,
           (pf.final_profit is not null) frozen
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      cross join lateral public.finance_project_money(p.project_id) fm
     where p.project_status = any (v_statuses)
       and p.final_event_date is not null
       and p.final_event_date <= v_to
       and (p_customer_id is null or p.customer_id = p_customer_id)
  ),
  labour as (
    -- 🔴 המפתח של `assignments` הוא שלישייה `(project_id, hostess_id, assignment_number)`;
    -- הצירוף כאן הוא `projects → assignments` בלבד (1:N) ואין בו קיפול פר-דיילת.
    -- ‏`actual_hours > 0` חותך את **שני** צדי השבר: שיבוץ בלי שעות אינו נספר במכנה ולא
    -- במונה, אחרת העלות-לשעה יורדת מלאכותית (⑦ מ3).
    select s.yr,
           sum(a.actual_hours) hrs,
           sum(a.actual_hours * a.hourly_rate_snapshot) wage,
           sum(coalesce(a.personal_bonus, 0)) bonus
      from scoped s
      join public.assignments a on a.project_id = s.project_id
     where a.actual_hours is not null and a.actual_hours > 0
     group by s.yr
  ),
  per_year as (
    select s.yr,
           count(*)::integer n,
           sum(s.revenue) rev,
           sum(s.profit) prof,
           count(*) filter (where s.frozen)::integer frozen,
           max(l.hrs) hrs,
           max(l.wage) wage,
           max(l.bonus) bonus
      from scoped s left join labour l on l.yr = s.yr
     group by s.yr
  )
  select jsonb_agg(jsonb_build_object(
           'year',            yr,
           'event_count',     n,
           'revenue',         rev,
           'profit',          prof,
           'margin',          100 * prof / nullif(rev, 0),
           'hours',           hrs,
           'price_per_hour',  rev / nullif(hrs, 0),
           'cost_per_hour',   (wage + bonus) / nullif(hrs, 0),
           'margin_per_hour', rev / nullif(hrs, 0) - (wage + bonus) / nullif(hrs, 0),
           'frozen',          frozen,
           -- 📑ב#1: השנה הרצה מסומנת חלקית — דפוס-מילוי שונה, ו**אין** קצב-שנתי מומצא.
           'partial',         yr = v_this_year,
           'drill_key',       jsonb_build_object('kind', 'year', 'year', yr)
         ) order by yr),
         sum(n)::integer,
         sum(frozen)::integer,
         min(yr)::integer
    into v_years, v_pop_n, v_frozen, v_min_year
    from per_year;

  v_years := coalesce(v_years, '[]'::jsonb);
  v_pop_n := coalesce(v_pop_n, 0);

  -- שנת-המוקד: ברמה 0 היא השנה הרצה, ברמה 1 השנה שנבחרה.
  select (e ->> 'year')::integer, (e ->> 'event_count')::integer, (e ->> 'revenue')::numeric,
         (e ->> 'profit')::numeric, (e ->> 'margin')::numeric, (e ->> 'hours')::numeric,
         (e ->> 'price_per_hour')::numeric, (e ->> 'cost_per_hour')::numeric, (e ->> 'frozen')::integer
    into v_y_year, v_y_n, v_y_rev, v_y_prof, v_y_margin, v_y_hours, v_y_price, v_y_cost, v_y_frozen
    from jsonb_array_elements(v_years) e
   where (e ->> 'year')::integer = coalesce(v_year, v_this_year);

  select (e ->> 'year')::integer, (e ->> 'event_count')::integer, (e ->> 'revenue')::numeric,
         (e ->> 'profit')::numeric, (e ->> 'margin')::numeric, (e ->> 'hours')::numeric,
         (e ->> 'price_per_hour')::numeric, (e ->> 'cost_per_hour')::numeric
    into v_p_year, v_p_n, v_p_rev, v_p_prof, v_p_margin, v_p_hours, v_p_price, v_p_cost
    from jsonb_array_elements(v_years) e
   where (e ->> 'year')::integer = coalesce(v_year, v_this_year) - 1;

  if v_level = 0 then
    -- ── רמה 0 · כל השנים ────────────────────────────────────────────────────
    v_range_label := v_lri || coalesce(v_min_year::text, '') || '–' || v_this_year || v_pdi ||
      ' · ' || coalesce(v_customer_name, 'כל הלקוחות');

    v_sort := jsonb_build_object('key', 'year', 'direction', 'ascending');
    v_tiles := jsonb_build_array(
      jsonb_build_object('key', 'price_per_hour', 'label', 'מחיר לשעה',
        'value', v_y_price, 'format', 'money',
        'sub', v_lri || to_char(round(coalesce(v_y_rev, 0)), 'FM999,999,999') || ' ₪' || v_pdi || ' ÷ ' ||
               v_lri || to_char(round(coalesce(v_y_hours, 0)), 'FM999,999') || v_pdi || ' שעות-בפועל',
        'window', 'שנת ' || v_lri || v_this_year || v_pdi || ' עד ' || v_lri || to_char(v_to, 'DD/MM') || v_pdi,
        'compare', case when v_p_price is null then null else jsonb_build_object(
          'value', v_p_price, 'label', v_lri || v_p_year || v_pdi, 'note', null,
          'direction', case when v_y_price > v_p_price then 'up'
                            when v_y_price < v_p_price then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'cost_per_hour', 'label', 'עלות לשעה',
        'value', v_y_cost, 'format', 'money',
        'sub', 'שכר הדיילות ובונוסים אישיים ÷ אותן ' ||
               v_lri || to_char(round(coalesce(v_y_hours, 0)), 'FM999,999') || v_pdi ||
               ' שעות · נסיעות אינן נכללות',
        'window', 'שנת ' || v_lri || v_this_year || v_pdi || ' עד ' || v_lri || to_char(v_to, 'DD/MM') || v_pdi,
        'compare', case when v_p_cost is null then null else jsonb_build_object(
          'value', v_p_cost, 'label', v_lri || v_p_year || v_pdi, 'note', null,
          'direction', case when v_y_cost > v_p_cost then 'up'
                            when v_y_cost < v_p_cost then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח',
        'value', v_y_margin, 'format', 'percent',
        'sub', v_lri || to_char(round(coalesce(v_y_prof, 0)), 'FM999,999,999') || ' ₪' || v_pdi ||
               ' רווח מתוך ' || v_lri || to_char(round(coalesce(v_y_rev, 0)), 'FM999,999,999') || ' ₪' || v_pdi,
        'window', 'שנת ' || v_lri || v_this_year || v_pdi || ' עד ' || v_lri || to_char(v_to, 'DD/MM') || v_pdi,
        'compare', case when v_p_margin is null then null else jsonb_build_object(
          'value', v_p_margin, 'label', v_lri || v_p_year || v_pdi || ' המלאה', 'note', null,
          'direction', case when v_y_margin > v_p_margin then 'up'
                            when v_y_margin < v_p_margin then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'finished_events', 'label', 'אירועים שהסתיימו',
        'value', v_y_n, 'format', 'int',
        'sub', 'בכל השנים יחד: ' || v_lri || to_char(v_pop_n, 'FM999,999,999') || v_pdi,
        'window', v_lri || to_char(date_trunc('year', v_to)::date, 'DD/MM') || '–' ||
                  to_char(v_to, 'DD/MM/YYYY') || v_pdi,
        'compare', case when v_p_n is null then null else jsonb_build_object(
          'value', v_p_n, 'label', v_lri || v_p_year || v_pdi || ' המלאה', 'note', null,
          'direction', case when v_y_n > v_p_n then 'up' when v_y_n < v_p_n then 'down' else 'flat' end) end,
        'target', null));

    -- 🔴 שני גרפים ולא שלושה: ⑧ 3.1 מצייר מחיר ועלות בשני לוחות נפרדים, אבל זו **צורה** —
    -- הדאטה היא סדרה אחת, ותקרת C8 היא שני גרפים לדף.
    v_chart := jsonb_build_array(
      jsonb_build_object(
        'type', 'bar', 'title', 'הכנסה, רווח ושולי-רווח לפי שנה',
        'series', jsonb_build_array(
          jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'kind', 'bar', 'axis', 'left', 'format', 'money'),
          jsonb_build_object('key', 'profit', 'label', 'רווח גולמי', 'kind', 'bar', 'axis', 'left', 'format', 'money'),
          -- §5.2 #15: ציר-האחוזים נעול 0–100, אחרת תנודה של נקודה וחצי נראית כמפולת.
          jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'kind', 'line', 'axis', 'right', 'format', 'percent')),
        -- 🔴 D2 · `domain` היה `[0,100]` — והוא **לא** נעילת-ציר-האחוזים של ⑧ 3.4:
        --    `ChartCard.BarBody` מחזיק ציר-Y **אחד** ומעביר לו את `domain` (שורה 402), ולכן
        --    עמודות של 1.9 מיליון ₪ נחתכו לתקרה 100 — גרף ריק על המסך, בלי שגיאה. נעילת
        --    ה-0–100 שייכת לציר-הימני, והיא קבועה ברכיב (כמו ב-`ParetoBody`), לא במטען.
        --    ⚠️ הציר-השני עצמו עדיין אינו מרונדר — `BarBody` מתעלם מ-`series[].kind/.axis`;
        --    זה פגם-רכיב שדווח לבונה-הלשונית ואינו ניתן לתיקון מתוך מיגרציה.
        'data', v_years, 'xKey', 'year', 'domain', null,
        'refLines', '[]'::jsonb, 'unit', 'money'),
      jsonb_build_object(
        'type', 'line', 'title', 'מחיר לשעה מול עלות לשעה, לפי שנה',
        'series', jsonb_build_array(
          jsonb_build_object('key', 'price_per_hour', 'label', 'מחיר לשעה', 'kind', 'line', 'axis', 'left', 'format', 'money'),
          jsonb_build_object('key', 'cost_per_hour', 'label', 'עלות לשעה', 'kind', 'line', 'axis', 'left', 'format', 'money'),
          jsonb_build_object('key', 'margin_per_hour', 'label', 'מרווח לשעה', 'kind', 'line', 'axis', 'left', 'format', 'money')),
        'data', v_years, 'xKey', 'year', 'domain', null,
        'refLines', '[]'::jsonb, 'unit', 'money'));

    v_columns := jsonb_build_array(
      jsonb_build_object('key', 'year', 'label', 'שנה', 'format', 'int', 'align', 'start', 'sorted', 'asc'),
      jsonb_build_object('key', 'event_count', 'label', 'אירועים', 'format', 'int', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'format', 'money', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'profit', 'label', 'רווח', 'format', 'money', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'format', 'percent', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'price_per_hour', 'label', 'מחיר לשעה', 'format', 'money', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'cost_per_hour', 'label', 'עלות לשעה', 'format', 'money', 'align', 'end', 'sorted', null));
    v_rows := v_years;
    v_row_total := jsonb_array_length(v_years);
    v_crumbs := jsonb_build_array(jsonb_build_object('label', 'כל השנים', 'drill', null));

    -- 📐23 · אסטרטגי ⇒ *"לשים לב ש…"*, **והכיוון נמדד ולא מוקלד**: דף שאומר "המחיר עלה
    -- מהר מהעלות" בשנה שבה קרה ההפך הוא שקר על המסך.
    v_so_what := case
      when v_p_price is null or v_y_price is null then
        'לשים לב שאין שנה קודמת למדוד מולה — מחיר לשעה ' ||
        v_lri || to_char(round(coalesce(v_y_price, 0), 1), 'FM999,990.0') || ' ₪' || v_pdi ||
        ' מול עלות לשעה ' ||
        v_lri || to_char(round(coalesce(v_y_cost, 0), 1), 'FM999,990.0') || ' ₪' || v_pdi || '.'
      when v_y_price / nullif(v_p_price, 0) >= v_y_cost / nullif(v_p_cost, 0) then
        'לשים לב שהמחיר לשעה עלה מהר מהעלות — מ-' ||
        v_lri || to_char(round(v_p_price, 1), 'FM999,990.0') || ' ₪' || v_pdi || ' ל-' ||
        v_lri || to_char(round(v_y_price, 1), 'FM999,990.0') || ' ₪' || v_pdi ||
        ' לשעה, מול עלייה מ-' || v_lri || to_char(round(v_p_cost, 1), 'FM999,990.0') || ' ₪' || v_pdi ||
        ' ל-' || v_lri || to_char(round(v_y_cost, 1), 'FM999,990.0') || ' ₪' || v_pdi ||
        ' בעלות; זו הסיבה ששולי-הרווח עמדו על ' ||
        v_lri || to_char(round(v_y_margin, 1), 'FM990.0') || '%' || v_pdi || '.'
      else
        'לשים לב שהעלות לשעה עולה מהר מהמחיר — מ-' ||
        v_lri || to_char(round(v_p_cost, 1), 'FM999,990.0') || ' ₪' || v_pdi || ' ל-' ||
        v_lri || to_char(round(v_y_cost, 1), 'FM999,990.0') || ' ₪' || v_pdi ||
        ', בעוד המחיר לשעה עלה מ-' || v_lri || to_char(round(v_p_price, 1), 'FM999,990.0') || ' ₪' || v_pdi ||
        ' ל-' || v_lri || to_char(round(v_y_price, 1), 'FM999,990.0') || ' ₪' || v_pdi ||
        '; שולי-הרווח עמדו על ' || v_lri || to_char(round(v_y_margin, 1), 'FM990.0') || '%' || v_pdi || '.'
    end;

  elsif v_level = 1 then
    -- ── רמה 1 · חודשי שנה אחת ───────────────────────────────────────────────
    with scoped as materialized (
      select extract(year from p.final_event_date)::integer yr,
             extract(month from p.final_event_date)::integer mo,
             fm.revenue, coalesce(pf.final_profit, fm.gross_profit) profit
        from public.projects p
        left join public.project_finance pf on pf.project_id = p.project_id
        cross join lateral public.finance_project_money(p.project_id) fm
       where p.project_status = any (v_statuses)
         and p.final_event_date is not null
         and p.final_event_date <= v_to
         and extract(year from p.final_event_date)::integer in (v_year, v_year - 1)
         and (p_customer_id is null or p.customer_id = p_customer_id)
    ),
    per_month as (
      select mo, count(*)::integer n, sum(revenue) rev, sum(profit) prof
        from scoped where yr = v_year group by mo
    ),
    prev_month as (
      select mo, sum(revenue) rev from scoped where yr = v_year - 1 group by mo
    ),
    axis as (
      select generate_series(1, case when v_year = v_this_year
                                     then extract(month from v_to)::integer else 12 end) mo
    )
    select jsonb_agg(jsonb_build_object(
             'month',        a.mo,
             'label',        v_months_he[a.mo],
             'event_count',  coalesce(c.n, 0),
             'revenue',      coalesce(c.rev, 0),
             'profit',       coalesce(c.prof, 0),
             'margin',       100 * c.prof / nullif(c.rev, 0),
             'revenue_prev', pv.rev,
             -- ④ מ3 (א): חודש שכולו אפס **מצויר** ואינו נעלם מהסדרה.
             'partial',      v_year = v_this_year and a.mo = extract(month from v_to)::integer,
             'drill_key',    jsonb_build_object('kind', 'month', 'year', v_year, 'month', a.mo)
           ) order by a.mo)
      into v_rows
      from axis a
      left join per_month c on c.mo = a.mo
      left join prev_month pv on pv.mo = a.mo;

    v_rows := coalesce(v_rows, '[]'::jsonb);
    v_row_total := jsonb_array_length(v_rows);
    v_frozen := v_y_frozen;
    v_range_label := v_lri || v_year || v_pdi ||
      case when v_year = v_this_year
           then ' (שנה חלקית, עד ' || v_lri || to_char(v_to, 'DD/MM') || v_pdi || ')' else '' end ||
      ' · ' || coalesce(v_customer_name, 'כל הלקוחות');

    v_tiles := jsonb_build_array(
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה בשנה', 'value', v_y_rev, 'format', 'money',
        'sub', v_lri || to_char(v_y_n, 'FM999,999,999') || v_pdi || ' אירועים',
        'window', 'שנת ' || v_lri || v_year || v_pdi,
        'compare', case when v_p_rev is null then null else jsonb_build_object(
          'value', v_p_rev, 'label', v_lri || (v_year - 1) || v_pdi || ' המלאה', 'note', null,
          'direction', case when v_y_rev > v_p_rev then 'up' when v_y_rev < v_p_rev then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'profit', 'label', 'רווח גולמי בשנה', 'value', v_y_prof, 'format', 'money',
        'sub', 'מתוך ' || v_lri || to_char(round(coalesce(v_y_rev, 0)), 'FM999,999,999') || ' ₪' || v_pdi || ' הכנסה',
        'window', 'שנת ' || v_lri || v_year || v_pdi,
        'compare', case when v_p_prof is null then null else jsonb_build_object(
          'value', v_p_prof, 'label', v_lri || (v_year - 1) || v_pdi || ' המלאה', 'note', null,
          'direction', case when v_y_prof > v_p_prof then 'up' when v_y_prof < v_p_prof then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח בשנה', 'value', v_y_margin, 'format', 'percent',
        'sub', 'סך הרווח חלקי סך ההכנסה בשנה',
        'window', 'שנת ' || v_lri || v_year || v_pdi,
        'compare', case when v_p_margin is null then null else jsonb_build_object(
          'value', v_p_margin, 'label', v_lri || (v_year - 1) || v_pdi, 'note', null,
          'direction', case when v_y_margin > v_p_margin then 'up' when v_y_margin < v_p_margin then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'price_vs_cost', 'label', 'מחיר לשעה מול עלות לשעה',
        -- 🏷️ אריח מורכב: שני מספרים בתא אחד ⇒ `format` הוא `text` והערך נבנה כאן.
        'value', case when v_y_price is null then null else
                 v_lri || to_char(round(v_y_price, 1), 'FM999,990.0') || ' ₪ / ' ||
                 to_char(round(coalesce(v_y_cost, 0), 1), 'FM999,990.0') || ' ₪' || v_pdi end,
        'format', 'text',
        'sub', v_lri || to_char(round(coalesce(v_y_hours, 0)), 'FM999,999') || v_pdi || ' שעות-בפועל בשנה',
        'window', 'שנת ' || v_lri || v_year || v_pdi,
        'compare', case when v_p_price is null then null else jsonb_build_object(
          'value', v_p_price, 'label', v_lri || (v_year - 1) || v_pdi || ': מחיר לשעה',
          'note', 'עלות לשעה ' || v_lri || to_char(round(coalesce(v_p_cost, 0), 1), 'FM999,990.0') || ' ₪' || v_pdi,
          'direction', case when v_y_price > v_p_price then 'up'
                            when v_y_price < v_p_price then 'down' else 'flat' end) end,
        'target', null));

    v_chart := jsonb_build_object(
      'type', 'bar', 'title', 'הכנסה ורווח לפי חודש · ' || v_lri || v_year || v_pdi,
      'series', jsonb_build_array(
        jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'kind', 'bar', 'axis', 'left', 'format', 'money'),
        jsonb_build_object('key', 'profit', 'label', 'רווח גולמי', 'kind', 'bar', 'axis', 'left', 'format', 'money'),
        jsonb_build_object('key', 'revenue_prev', 'label', 'הכנסה ' || (v_year - 1), 'kind', 'bar', 'axis', 'left', 'format', 'money')),
      'data', v_rows, 'xKey', 'label', 'domain', null, 'refLines', '[]'::jsonb, 'unit', 'money');

    v_columns := jsonb_build_array(
      jsonb_build_object('key', 'label', 'label', 'חודש', 'format', 'text', 'align', 'start', 'sorted', 'asc'),
      jsonb_build_object('key', 'event_count', 'label', 'אירועים', 'format', 'int', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'format', 'money', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'profit', 'label', 'רווח', 'format', 'money', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'format', 'percent', 'align', 'end', 'sorted', null));
    v_crumbs := jsonb_build_array(
      jsonb_build_object('label', 'כל השנים', 'drill', null),
      jsonb_build_object('label', v_lri || v_year || v_pdi, 'drill', jsonb_build_object('year', v_year)));
    v_sort := jsonb_build_object('key', 'label', 'direction', 'ascending');

    v_so_what := 'לשים לב ששולי-הרווח ב-' || v_lri || v_year || v_pdi || ' עמדו על ' ||
      v_lri || to_char(round(coalesce(v_y_margin, 0), 1), 'FM990.0') || '%' || v_pdi || ' על ' ||
      v_lri || to_char(coalesce(v_y_n, 0), 'FM999,999,999') || v_pdi || ' אירועים, עם מחיר לשעה של ' ||
      v_lri || to_char(round(coalesce(v_y_price, 0), 1), 'FM999,990.0') || ' ₪' || v_pdi ||
      ' מול עלות לשעה של ' ||
      v_lri || to_char(round(coalesce(v_y_cost, 0), 1), 'FM999,990.0') || ' ₪' || v_pdi || '.';

  else
    -- ── רמה 2 · אירועי חודש אחד ─────────────────────────────────────────────
    -- §7.98 נועל 50 שורות לעמוד; הפאג'ר סופר את **כל** אירועי החודש (📐8 · ⑧ 3.3).
    with scoped as materialized (
      select p.project_id, p.event_name, p.customer_id, p.final_event_date,
             extract(year from p.final_event_date)::integer yr,
             fm.revenue, coalesce(pf.final_profit, fm.gross_profit) profit
        from public.projects p
        left join public.project_finance pf on pf.project_id = p.project_id
        cross join lateral public.finance_project_money(p.project_id) fm
       where p.project_status = any (v_statuses)
         and p.final_event_date is not null
         and p.final_event_date <= v_to
         and extract(year from p.final_event_date)::integer in (v_year, v_year - 1)
         and extract(month from p.final_event_date)::integer = v_month
         and (p_customer_id is null or p.customer_id = p_customer_id)
    ),
    cur as (select * from scoped where yr = v_year),
    prev as (select * from scoped where yr = v_year - 1)
    select coalesce((select jsonb_agg(jsonb_build_object(
             'project_id',       t.project_id,
             'event_name',       t.event_name,
             'customer_name',    cu.company_name,
             'final_event_date', t.final_event_date,
             'revenue',          t.revenue,
             'margin',           100 * t.profit / nullif(t.revenue, 0),
             'drill_key',        jsonb_build_object('kind', 'project', 'id', t.project_id)
           ) order by t.revenue desc, t.project_id)
           from (select * from cur order by revenue desc, project_id limit 50) t
           left join public.customers cu on cu.customer_id = t.customer_id), '[]'::jsonb),
           (select count(*)::integer from cur),
           (select coalesce(sum(revenue), 0) from cur),
           (select coalesce(sum(profit), 0) from cur),
           (select count(*)::integer from prev),
           (select coalesce(sum(revenue), 0) from prev),
           (select coalesce(sum(profit), 0) from prev)
      into v_rows, v_m_n, v_m_rev, v_m_prof, v_pm_n, v_pm_rev, v_pm_prof;

    v_m_margin  := 100 * v_m_prof / nullif(v_m_rev, 0);
    v_pm_margin := 100 * v_pm_prof / nullif(v_pm_rev, 0);
    v_row_total := v_m_n;
    v_frozen := null;
    v_range_label := v_months_he[v_month] || ' ' || v_lri || v_year || v_pdi || ' · ' ||
      coalesce(v_customer_name, 'כל הלקוחות');

    -- 📐1 · ④ מ3 (ב): חודש בלי מקבילה אינו "—" — הוא **משפט**, כי "—" פירושו "אין שינוי".
    v_tiles := jsonb_build_array(
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה בחודש', 'value', v_m_rev, 'format', 'money',
        'sub', v_lri || to_char(v_m_n, 'FM999,999,999') || v_pdi || ' אירועים',
        'window', v_months_he[v_month] || ' ' || v_lri || v_year || v_pdi,
        'compare', case when v_pm_n = 0 then null else jsonb_build_object(
          'value', v_pm_rev, 'label', v_months_he[v_month] || ' ' || v_lri || (v_year - 1) || v_pdi, 'note', null,
          'direction', case when v_m_rev > v_pm_rev then 'up' when v_m_rev < v_pm_rev then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'profit', 'label', 'רווח גולמי בחודש', 'value', v_m_prof, 'format', 'money',
        'sub', 'מתוך ' || v_lri || to_char(round(v_m_rev), 'FM999,999,999') || ' ₪' || v_pdi || ' הכנסה',
        'window', v_months_he[v_month] || ' ' || v_lri || v_year || v_pdi,
        'compare', case when v_pm_n = 0 then null else jsonb_build_object(
          'value', v_pm_prof, 'label', v_months_he[v_month] || ' ' || v_lri || (v_year - 1) || v_pdi, 'note', null,
          'direction', case when v_m_prof > v_pm_prof then 'up' when v_m_prof < v_pm_prof then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח בחודש', 'value', v_m_margin, 'format', 'percent',
        'sub', 'סך הרווח חלקי סך ההכנסה בחודש',
        'window', v_months_he[v_month] || ' ' || v_lri || v_year || v_pdi,
        'compare', case when v_pm_margin is null then null else jsonb_build_object(
          'value', v_pm_margin, 'label', v_months_he[v_month] || ' ' || v_lri || (v_year - 1) || v_pdi, 'note', null,
          'direction', case when v_m_margin > v_pm_margin then 'up' when v_m_margin < v_pm_margin then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'event_count', 'label', 'אירועים בחודש', 'value', v_m_n, 'format', 'int',
        'sub', 'אירועים שהסתיימו',
        'window', v_months_he[v_month] || ' ' || v_lri || v_year || v_pdi,
        'compare', case when v_pm_n = 0 then null else jsonb_build_object(
          'value', v_pm_n, 'label', v_months_he[v_month] || ' ' || v_lri || (v_year - 1) || v_pdi, 'note', null,
          'direction', case when v_m_n > v_pm_n then 'up' when v_m_n < v_pm_n then 'down' else 'flat' end) end,
        'target', null));

    if v_pm_n = 0 then
      v_notes := v_notes || to_jsonb(
        ('אין חודש מקביל למדוד מולו — ' || v_months_he[v_month] || ' ' || (v_year - 1) ||
         ' ריק באוכלוסייה. זו אינה "אין שינוי", ולכן לא נכתב "—".')::text);
    end if;

    v_chart := null;
    v_columns := jsonb_build_array(
      jsonb_build_object('key', 'event_name', 'label', 'אירוע', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'final_event_date', 'label', 'תאריך', 'format', 'date', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'format', 'money', 'align', 'end', 'sorted', 'desc'),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'format', 'percent', 'align', 'end', 'sorted', null));
    v_crumbs := jsonb_build_array(
      jsonb_build_object('label', 'כל השנים', 'drill', null),
      jsonb_build_object('label', v_lri || v_year || v_pdi, 'drill', jsonb_build_object('year', v_year)),
      jsonb_build_object('label', v_months_he[v_month] || ' ' || v_lri || v_year || v_pdi,
                         'drill', jsonb_build_object('year', v_year, 'month', v_month)));
    v_sort := jsonb_build_object('key', 'revenue', 'direction', 'descending');

    v_so_what := 'לשים לב ששולי-הרווח ב' || v_months_he[v_month] || ' ' || v_lri || v_year || v_pdi ||
      ' עמדו על ' || v_lri || to_char(round(coalesce(v_m_margin, 0), 1), 'FM990.0') || '%' || v_pdi ||
      ' על ' || v_lri || to_char(v_m_n, 'FM999,999,999') || v_pdi || ' אירועים' ||
      case when v_pm_margin is null then '.'
           else ', מול ' || v_lri || to_char(round(v_pm_margin, 1), 'FM990.0') || '%' || v_pdi ||
                ' באותו חודש אשתקד.' end;
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_pop_n,
      'label', 'אוכלוסייה: אירועים שכבר התקיימו וסגורים תפעולית — פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום · הוצאו: אירועים שטרם התקיימו, אירועים בתהליך ואירועים מבוטלים · ' ||
        v_lri || 'n=' || to_char(v_pop_n, 'FM999,999,999') || v_pdi || ' בכל השנים. השנה הנוכחית חלקית — עד ' ||
        v_lri || to_char(v_to, 'DD/MM') || v_pdi || ' — ואינה ברת-השוואה לשנים מלאות.',
      'excluded', jsonb_build_object(
        -- 🔴 D2 · מסונן לפי הלקוח, כמו `n` עצמו (ר' ההנמקה במ2).
        'אינם באחד מארבעת המצבים',
        (select count(*)::integer from public.projects
          where not (project_status = any (v_statuses))
            and (p_customer_id is null or customer_id = p_customer_id)))
    ),
    'window', jsonb_build_object('from', null, 'to', v_to, 'label', v_range_label),
    'tiles', v_tiles,
    'chart', v_chart,
    'columns', v_columns,
    'rows', v_rows,
    'so_what', v_so_what,
    'definitions', 'שנה = השנה שבה התקיים האירוע, לא זו שבה נשלחה החשבונית · מחיר לשעה = כל הכנסת השנה חלקי כל שעות-העבודה שדווחו בה · עלות לשעה = שכר-הבסיס והבונוסים האישיים חלקי אותן שעות; נסיעות אינן נכללות, כי הן סכום קבוע למשמרת ולא תשלום לפי שעה · מרווח לשעה = מחיר לשעה פחות עלות לשעה · רווח = הרווח שקפא בסגירה הכספית היכן שקפא, אחרת הרווח שהמערכת מחשבת עכשיו.',
    'drill', jsonb_build_object(
      'level', v_level,
      'levels', jsonb_build_array('כל השנים', 'שנה', 'חודש'),
      'crumbs', v_crumbs,
      'echo', p_drill),
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', '[]'::jsonb,
      'frozen_count', v_frozen,
      'row_total', v_row_total,
      'notes', v_notes,
      'run', null,
      -- 🔴 D2 · ר' ההנמקה במ2: `meta.sort` הוא הקורא בפועל, ו-`sorted:'asc'` של רמה 0/1
      --    היה מתורגם ל-`aria-sort="descending"` על עמודה עולה.
      'sort', v_sort,
      'customer_filter_ignored', false,
      'drill_echo', p_drill)
  );
end;
$function$;

comment on function public.report_m03_trends(date, date, integer, jsonb) is
'מ11 · מגמות רב-שנתיות (אסטרטגי, דוח-קידוח שנה←חודש←אירוע). אוכלוסייה: אותם ארבעה סטטוסים של הכרעה 36 עם final_event_date שאינו null, בכל השנים עד p_to (ברירת-מחדל היום בשעון ישראל). p_from מתעלמים ממנו — הדף הוא ציר-שנים בהגדרתו (⑧ G5). הרווח כאן הוא coalesce(final_profit, gross_profit) — ולא gross_profit לבדו כמו במ2 (📑#1). עלות-לשעה = (שכר-בסיס + בונוסים אישיים) ÷ שעות-בפועל, על שיבוצים עם actual_hours > 0 בלבד; נסיעות אינן נכללות (⑧ G6). p_drill פגום נופל לרמת-השורש בלי מסך-שגיאה.';

revoke execute on function public.report_m03_trends(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m03_trends(date, date, integer, jsonb) to authenticated;

-- ═══════════════════════════ 3 · `report_m04_discounts` ═══════════════════════════
create or replace function public.report_m04_discounts(
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
  v_statuses constant text[] :=
    array['finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished'];
  v_tier_keys constant text[] := array['0', '1-5', '6-10', '10+'];
  v_tier_labels constant text[] := array['0%', '1–5%', '6–10%', '10%+ (פתוח)'];
  v_lri constant text := chr(8294);
  v_pdi constant text := chr(8297);
  v_today date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to date;
  v_year_start date;
  v_prev_year_start date;
  v_prev_to date;
  v_tier text;
  v_customer_name text;
  v_tiers jsonb;
  v_rows jsonb;
  v_row_total integer;
  v_pop_n integer;
  v_approved_n integer;
  v_rejected_n integer;
  v_mistake_n integer;
  v_pending_events integer;
  v_no_discount_margin numeric;
  v_deep_margin numeric;
  v_no_discount_n integer;
  v_deep_n integer;
  v_no_discount_rev numeric;
  v_deep_rev numeric;
  v_prev_no_discount_margin numeric;
  v_prev_deep_margin numeric;
  v_prev_no_discount_n integer;
  v_prev_deep_n integer;
  v_appr_cur integer;
  v_lost_cur integer;
  v_appr_prev integer;
  v_lost_prev integer;
  v_rate numeric;
  v_prev_rate numeric;
  v_gap numeric;
  v_prev_gap numeric;
  v_monotonic boolean;
  v_notes jsonb;
  v_so_what text;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  -- ⑧ G5 · ⑧ 4.3: הדף אינו מגיב למסנן-התקופה — מדרג-הנחה הוא חתך של כל ההיסטוריה,
  -- וחיתוכו לשנה בודדת מותיר 21 אירועים במדרג העמוק ביותר. ‏`p_to` נשאר תקרת-"נכון-ל".
  v_to := coalesce(p_to, v_today);
  v_year_start := date_trunc('year', v_to)::date;
  v_prev_year_start := (v_year_start - interval '1 year')::date;
  v_prev_to := (v_to - interval '1 year')::date;
  v_tier := p_drill ->> 'tier';
  if v_tier is not null and not (v_tier = any (v_tier_keys)) then
    v_tier := null;   -- ⑦ מ4: ערך לא-מוכר ⇒ חזרה לרמת-השורש, בלי מסך-שגיאה.
  end if;

  v_notes := jsonb_build_array(
    'הדף אינו מגיב למסנן התקופה — מדרג-הנחה הוא חתך של כל ההיסטוריה, וחיתוכו לשנה בודדת היה מותיר מדרג עמוק עם מעט אירועים.',
    'זו השוואה בין מדרגים, לא ניסוי — מדרג-ההנחה נבחר לפי הלקוח ולא הוגרל.');

  select c.company_name into v_customer_name
    from public.customers c where c.customer_id = p_customer_id;

  with q as (
    select q.quote_id,
           q.quote_status,
           q.rejection_reason,
           q.issue_date,
           -- ⑦ מ4: `null` בשדה-הנחה הוא **אפס ולא היעדרות** — ההצעה נכנסת למדרג 0.
           coalesce(q.applied_customer_discount, 0) + coalesce(q.manual_discount, 0) d
      from public.quotes q
     where (p_customer_id is null or q.customer_id = p_customer_id)
  ),
  tiered as (
    select quote_id, d,
           case when d = 0 then '0' when d <= 5 then '1-5' when d <= 10 then '6-10' else '10+' end tier
      from q where quote_status = 'approved'
  ),
  events as materialized (
    select t.tier, t.d, p.project_id, p.event_name, p.customer_id, p.final_event_date,
           q2.issue_date, q2.quote_id, fm.revenue, fm.gross_profit
      from tiered t
      join public.quotes q2 on q2.quote_id = t.quote_id
      join public.projects p on p.quote_id = t.quote_id
      cross join lateral public.finance_project_money(p.project_id) fm
     where p.project_status = any (v_statuses)
       and p.final_event_date is not null
       and p.final_event_date <= v_to
  ),
  by_tier as (
    select k.ord, k.tier, k.label,
           (select count(*) from tiered t where t.tier = k.tier)::integer quote_count,
           coalesce((select count(*) from events e where e.tier = k.tier), 0)::integer event_count,
           coalesce((select sum(e.revenue) from events e where e.tier = k.tier), 0) revenue,
           coalesce((select sum(e.gross_profit) from events e where e.tier = k.tier), 0) profit,
           (select 100 * sum(e.gross_profit) / nullif(sum(e.revenue), 0)
              from events e where e.tier = k.tier) margin,
           (select 100 * sum(e.gross_profit) / nullif(sum(e.revenue), 0)
              from events e where e.tier = k.tier and e.final_event_date <= v_prev_to) margin_prev,
           coalesce((select count(*) from events e
                      where e.tier = k.tier and e.final_event_date <= v_prev_to), 0)::integer event_count_prev
      from unnest(v_tier_keys, v_tier_labels) with ordinality as k(tier, label, ord)
  ),
  quote_rows as (
    select coalesce(jsonb_agg(jsonb_build_object(
             'quote_id',      t.quote_id,
             'customer_name', cu.company_name,
             'event_name',    t.event_name,
             'issue_date',    t.issue_date,
             'discount',      t.d,
             'revenue',       t.revenue,
             'margin',        100 * t.gross_profit / nullif(t.revenue, 0),
             'tier',          t.tier,
             'drill_key',     jsonb_build_object('kind', 'quote', 'id', t.quote_id)
           ) order by t.d desc, t.quote_id), '[]'::jsonb) j
      from (select * from events
             where v_tier is null or tier = v_tier
             order by d desc, quote_id limit 50) t
      left join public.customers cu on cu.customer_id = t.customer_id
  )
  select (select jsonb_agg(jsonb_build_object(
            'tier', tier, 'label', label, 'quote_count', quote_count,
            'event_count', event_count, 'revenue', revenue, 'margin', margin,
            'margin_prev', margin_prev, 'event_count_prev', event_count_prev,
            'drill_key', jsonb_build_object('kind', 'tier', 'tier', tier)) order by ord)
          from by_tier),
         (select count(*)::integer from events where v_tier is null or tier = v_tier),
         (select count(*)::integer from events),
         (select count(*)::integer from q where quote_status = 'approved'),
         (select count(*)::integer from q where quote_status = 'rejected'
            and coalesce(rejection_reason, '') <> 'נפתחה בטעות'),
         (select count(*)::integer from q where quote_status = 'rejected'
            and coalesce(rejection_reason, '') = 'נפתחה בטעות'),
         (select count(*)::integer from q where quote_status = 'approved')
           - (select count(*)::integer from events),
         (select count(*)::integer from q where quote_status = 'approved'
            and issue_date >= v_year_start and issue_date <= v_to),
         (select count(*)::integer from q where quote_status = 'rejected'
            and coalesce(rejection_reason, '') <> 'נפתחה בטעות'
            and issue_date >= v_year_start and issue_date <= v_to),
         (select count(*)::integer from q where quote_status = 'approved'
            and issue_date >= v_prev_year_start and issue_date <= v_prev_to),
         (select count(*)::integer from q where quote_status = 'rejected'
            and coalesce(rejection_reason, '') <> 'נפתחה בטעות'
            and issue_date >= v_prev_year_start and issue_date <= v_prev_to),
         quote_rows.j
    into v_tiers, v_row_total, v_pop_n, v_approved_n, v_rejected_n, v_mistake_n,
         v_pending_events, v_appr_cur, v_lost_cur, v_appr_prev, v_lost_prev, v_rows
    from quote_rows;

  v_tiers := coalesce(v_tiers, '[]'::jsonb);
  select (e ->> 'margin')::numeric, (e ->> 'event_count')::integer, (e ->> 'revenue')::numeric,
         (e ->> 'margin_prev')::numeric, (e ->> 'event_count_prev')::integer
    into v_no_discount_margin, v_no_discount_n, v_no_discount_rev,
         v_prev_no_discount_margin, v_prev_no_discount_n
    from jsonb_array_elements(v_tiers) e where e ->> 'tier' = '0';
  select (e ->> 'margin')::numeric, (e ->> 'event_count')::integer, (e ->> 'revenue')::numeric,
         (e ->> 'margin_prev')::numeric, (e ->> 'event_count_prev')::integer
    into v_deep_margin, v_deep_n, v_deep_rev, v_prev_deep_margin, v_prev_deep_n
    from jsonb_array_elements(v_tiers) e where e ->> 'tier' = '10+';

  -- §7.82 — התאומה של `deriveQuoteMetrics`: אושרו ÷ (אושרו + נדחו-בהפסד). אין סגורות ⇒
  -- `null` ולא 0%, כי "0% אישור" על מדגם ריק הוא מספר שקרי ולא מספר נמוך.
  v_rate      := 100.0 * v_appr_cur  / nullif(v_appr_cur + v_lost_cur, 0);
  v_prev_rate := 100.0 * v_appr_prev / nullif(v_appr_prev + v_lost_prev, 0);
  v_gap       := v_no_discount_margin - v_deep_margin;
  v_prev_gap  := v_prev_no_discount_margin - v_prev_deep_margin;

  -- 🔴 הטענה *"בלי יוצא מן הכלל"* אינה מוקלדת — היא נבדקת בכל טעינה. מדרג שיעלה מחר
  -- הופך את המשפט לשקר, ואז הדף אומר משהו אחר.
  -- ‏`coalesce(ok, false)` ולא `bool_and` לבדה: ‏`bool_and` **מדלגת על NULL**, ולכן מדרג
  -- ריק (שוליים `null`) היה נעלם מהבדיקה והמשפט היה מצהיר "בלי יוצא מן הכלל" על סדרה
  -- שחסר בה אבר. מדרג בלי נתון פירושו שאי-אפשר להוכיח מונוטוניות — לא שהיא קיימת.
  select bool_and(coalesce(ok, false)) into v_monotonic from (
    select (lag((e ->> 'margin')::numeric) over (order by ord) is null
            or (e ->> 'margin')::numeric <= lag((e ->> 'margin')::numeric) over (order by ord)) ok
      from jsonb_array_elements(v_tiers) with ordinality as t(e, ord)) s;

  if v_tier is not null then
    -- 🔴 D2 · תווית-המדרג נושאת ספרות ואחוז ('6–10%') בתוך משפט עברי ⇒ בידוד-כיווניות,
    --    אחרת הטווח מתהפך בפסקת-RTL (§🚫.4).
    v_notes := v_notes || to_jsonb(('הטבלה מסוננת למדרג ' ||
      v_lri || v_tier_labels[array_position(v_tier_keys, v_tier)] || v_pdi ||
      ' — האריחים ממשיכים למדוד את כל האוכלוסייה.')::text);
  end if;

  v_so_what := case
    when v_no_discount_margin is null or v_deep_margin is null then
      'לשים לב שאין מספיק אירועים באחד המדרגים כדי להשוות ביניהם.'
    when v_monotonic then
      'לשים לב שכל מדרג-הנחה עמוק יותר מוריד את שולי-הרווח, בלי יוצא מן הכלל — מ-' ||
      v_lri || to_char(round(v_no_discount_margin, 1), 'FM990.0') || '%' || v_pdi || ' בלי הנחה ועד ' ||
      v_lri || to_char(round(v_deep_margin, 1), 'FM990.0') || '%' || v_pdi || ' מעל ' ||
      v_lri || '10%' || v_pdi || ' הנחה, פער של ' ||
      v_lri || to_char(round(v_gap, 1), 'FM990.0') || v_pdi || ' נקודות; ההנחה לא מוחזרת בנפח.'
    else
      'לשים לב שהפער בין המדרגים אינו מונוטוני — ' ||
      v_lri || to_char(round(v_no_discount_margin, 1), 'FM990.0') || '%' || v_pdi || ' בלי הנחה מול ' ||
      v_lri || to_char(round(v_deep_margin, 1), 'FM990.0') || '%' || v_pdi || ' מעל ' ||
      v_lri || '10%' || v_pdi || ' הנחה, פער של ' ||
      v_lri || to_char(round(v_gap, 1), 'FM990.0') || v_pdi || ' נקודות.'
  end;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_pop_n,
      -- 📑ב#2: שתי אוכלוסיות, כל אחת עם ה-`n` שלה, ומוצהרות זו לצד זו.
      'label', 'שתי אוכלוסיות שונות בדף אחד, ובכוונה: שיעור-האישור נמדד על הצעות מחיר — ' ||
        v_lri || to_char(v_approved_n, 'FM999,999,999') || v_pdi || ' אושרו ו-' || v_lri || to_char(v_rejected_n, 'FM999,999,999') || v_pdi ||
        ' נדחו (הצעות שנסגרו בסיבה «נפתחה בטעות» אינן נספרות כדחייה) · שולי-הרווח נמדדים על האירועים שנולדו מההצעות המאושרות וכבר התקיימו — ' ||
        v_lri || 'n=' || to_char(v_pop_n, 'FM999,999,999') || v_pdi || '; ' || v_lri || to_char(v_pending_events, 'FM999,999,999') || v_pdi ||
        ' הצעות מאושרות טרם הפכו לאירוע שהתקיים ואינן כאן.',
      'excluded', jsonb_build_object(
        'הצעות מאושרות שטרם הפכו לאירוע שהתקיים', v_pending_events,
        'הצעות שנסגרו «נפתחה בטעות»', v_mistake_n)
    ),
    'window', jsonb_build_object('from', null, 'to', v_to,
      'label', 'כל הזמנים · ' || coalesce(v_customer_name, 'כל הלקוחות')),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'margin_no_discount', 'label', 'שולי-רווח ללא הנחה',
        'value', v_no_discount_margin, 'format', 'percent',
        'sub', v_lri || to_char(v_no_discount_n, 'FM999,999,999') || v_pdi || ' אירועים · ' ||
               v_lri || to_char(round(v_no_discount_rev), 'FM999,999,999') || ' ₪' || v_pdi,
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה',
        'compare', case when v_prev_no_discount_margin is null then null else jsonb_build_object(
          'value', v_prev_no_discount_margin, 'label', 'לפני שנה, אותו חישוב',
          'note', v_lri || to_char(v_prev_no_discount_n, 'FM999,999,999') || v_pdi || ' אירועים',
          'direction', case when v_no_discount_margin > v_prev_no_discount_margin then 'up'
                            when v_no_discount_margin < v_prev_no_discount_margin then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'margin_deep_discount', 'label', 'שולי-רווח בהנחה מעל 10%',
        'value', v_deep_margin, 'format', 'percent',
        'sub', v_lri || to_char(v_deep_n, 'FM999,999,999') || v_pdi || ' אירועים · ' ||
               v_lri || to_char(round(v_deep_rev), 'FM999,999,999') || ' ₪' || v_pdi,
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה',
        'compare', case when v_prev_deep_margin is null then null else jsonb_build_object(
          'value', v_prev_deep_margin, 'label', 'לפני שנה, אותו חישוב',
          'note', v_lri || to_char(v_prev_deep_n, 'FM999,999,999') || v_pdi || ' אירועים',
          'direction', case when v_deep_margin > v_prev_deep_margin then 'up'
                            when v_deep_margin < v_prev_deep_margin then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'edges_gap', 'label', 'הפרש בין הקצוות',
        'value', v_gap, 'format', 'ratio',
        'sub', v_lri || to_char(round(v_no_discount_margin, 1), 'FM990.0') || '%' || v_pdi || ' ללא הנחה, מול ' ||
               v_lri || to_char(round(v_deep_margin, 1), 'FM990.0') || '%' || v_pdi || ' מעל ' || v_lri || '10%' || v_pdi,
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה',
        'compare', case when v_prev_gap is null then null else jsonb_build_object(
          'value', v_prev_gap, 'label', 'לפני שנה', 'note', 'נקודות-אחוז',
          'direction', case when v_gap > v_prev_gap then 'up' when v_gap < v_prev_gap then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'approval_rate', 'label', 'שיעור אישור הצעות',
        'value', v_rate, 'format', 'percent',
        'sub', v_lri || to_char(v_appr_cur, 'FM999,999,999') || v_pdi || ' אושרו מתוך ' ||
               v_lri || to_char((v_appr_cur + v_lost_cur), 'FM999,999,999') || v_pdi || ' שהוכרעו השנה',
        -- 📐3: זה האריח היחיד בדף שכן נמדד בחלון-שנה, וזה כתוב עליו.
        'window', v_lri || to_char(v_year_start, 'DD/MM') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi,
        'compare', case when v_prev_rate is null then null else jsonb_build_object(
          'value', v_prev_rate,
          'label', v_lri || extract(year from v_prev_to)::integer || v_pdi || ' באותו טווח',
          'note', v_lri || to_char(v_appr_prev, 'FM999,999,999') || ' מתוך ' || to_char((v_appr_prev + v_lost_prev), 'FM999,999,999') || v_pdi,
          'direction', case when v_rate > v_prev_rate then 'up' when v_rate < v_prev_rate then 'down' else 'flat' end) end,
        'target', null)
    ),
    'chart', jsonb_build_object(
      'type', 'bar', 'title', 'שולי-רווח לפי מדרג-הנחה',
      'series', jsonb_build_array(
        jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'kind', 'bar', 'axis', 'left', 'format', 'percent'),
        -- 📐19: `slate-400` נעול כאן למשמעות אחת — "לפני שנה".
        jsonb_build_object('key', 'margin_prev', 'label', 'לפני שנה', 'kind', 'bar', 'axis', 'left', 'format', 'percent')),
      -- ⚠️ `xKey` נשאר `tier` ולא `label`: `tier` הוא מפתח-הדלי ('0'·'1-5'·'6-10'·'10+')
      --    והוא **קריא בעברית כפי שהוא**; `label` נושא את התוספת "(פתוח)" שאינה נכנסת לציר.
      'data', v_tiers, 'xKey', 'tier',
      -- 📐6: `domain` נעול 0–100 לכל ציר-אחוז. **כאן זה נכון** — שתי הסדרות אחוזים,
      --    ‏`BarBody` מחזיק ציר-Y אחד, והתקרה 100 היא התקרה האמיתית (בניגוד למ3).
      'domain', jsonb_build_array(0, 100), 'refLines', '[]'::jsonb,
      -- 🔴 D2 · `'%'` אינו שם-פורמט מוכר ⇒ `formatByType` נופל ל-`text` והטולטיפ הציג
      --    ‏`57.764887800252716`. ‏`percent` הוא הפורמט של 📐4 (ספרה אחת אחרי הנקודה).
      'unit', 'percent'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'quote_id', 'label', 'הצעה', 'format', 'int', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'event_name', 'label', 'אירוע', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'issue_date', 'label', 'הופקה', 'format', 'date', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'discount', 'label', 'הנחה', 'format', 'percent', 'align', 'end', 'sorted', 'desc'),
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'format', 'money', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'format', 'percent', 'align', 'end', 'sorted', null)
    ),
    'rows', v_rows,
    'so_what', v_so_what,
    'definitions', 'מדרג-הנחה = ההנחה הקבועה של הלקוח ועוד ההנחה הידנית שניתנה בהצעה, יחד · "10%+ (פתוח)" = כל הנחה מעל 10%, בלי חסם עליון · שולי-רווח של מדרג = סך הרווח של אירועי המדרג חלקי סך ההכנסה שלהם, לא ממוצע של אחוזים · שיעור אישור = אושרו חלקי (אושרו + נדחו); הצעות שנסגרו כי "נפתחה בטעות" אינן נספרות כדחייה · "לפני שנה" = בדיוק אותו חישוב על מה שהיה במערכת לפני שנה.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', '[]'::jsonb,
      'frozen_count', null,
      'row_total', v_row_total,
      'notes', v_notes,
      'run', null,
      -- 🔴 D2 · ר' ההנמקה במ2.
      'sort', jsonb_build_object('key', 'discount', 'direction', 'descending'),
      'customer_filter_ignored', false,
      'drill_echo', p_drill)
  );
end;
$function$;

comment on function public.report_m04_discounts(date, date, integer, jsonb) is
'מ11 · הנחות ורווחיות (אסטרטגי). שתי אוכלוסיות מוצהרות: (1) שיעור-האישור נמדד על quotes בחלון-הלוח הסגור של השנה הקלנדרית לפי issue_date — אושרו ÷ (אושרו + נדחו), כאשר §7.82 מחריג מהמכנה את NON_LOSS_REJECTION_REASONS = [נפתחה בטעות] (src/lib/quotes.js:490); (2) שולי-הרווח נמדדים על האירועים שנולדו מההצעות המאושרות וכבר התקיימו — ארבעת הסטטוסים של הכרעה 36 — בכל הזמנים עד p_to. מדרגי-ההנחה 0 · 1–5 · 6–10 · 10+ הם הכרעה 39, והגבול העליון שייך לדלי התחתון. p_from מתעלמים ממנו (⑧ G5).';

revoke execute on function public.report_m04_discounts(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m04_discounts(date, date, integer, jsonb) to authenticated;

-- ═══════════════════════════ 4 · `report_m06_staffing` ═══════════════════════════
create or replace function public.report_m06_staffing(
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
  v_statuses constant text[] :=
    array['finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished'];
  v_lri constant text := chr(8294);
  v_pdi constant text := chr(8297);
  v_param_name constant text := 'יחס_אורחים_לדיילת';
  v_today date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to date;
  v_param_raw text;
  v_param numeric;
  v_missing jsonb := '[]'::jsonb;
  v_customer_name text;
  v_pop_n integer;
  v_both_n integer;
  v_missing_actual integer;
  v_over_n integer;
  v_median numeric;
  v_above integer;
  v_prev_both integer;
  v_prev_pop integer;
  v_prev_over integer;
  v_prev_median numeric;
  v_prev_above integer;
  v_scatter jsonb;
  v_hist jsonb;
  v_rows jsonb;
  v_row_total integer;
  v_notes jsonb;
  v_so_what text;
  -- 🔴 D2 · **`to_char(50, 'FM999,990.99')` מחזיר `'50.'`** — ‏`FM` מוחק אפסים-נגררים אך
  --    **לא את הנקודה העשרונית**, ולכן פרמטר-התכנון הופיע על המסך כ«‏50.‏» בחמישה מקומות
  --    (שתי תת-שורות-אריח · תווית קו-הייחוס · שתי הופעות בשורת-"אז מה"), בעוד הכרטיס §③
  --    נוקב מילה-במילה ב*"פרמטר-תכנון 50 — לא יעד"*. ‏`rtrim`-כפול מחזיר `50` ל-50
  --    ו-`47.5` ל-47.5 — בלי לאבד שבר אמיתי.
  v_param_txt text;
  -- קצה-הצירים של גרף-הפיזור: המקסימום משני הצירים יחד, כדי שהאלכסון יהיה 45° אמיתי (§③).
  v_axis_max numeric;
  -- תווית-הדלי שבו נופל הפרמטר — עוגן קו-הייחוס על ציר קטגוריאלי.
  v_param_bucket text;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  -- ⑧ G5: הדף אינו מגיב למסנן-התקופה — היחס נמדד על כל ההיסטוריה, כי האירועים החורגים
  -- פרוסים על שלוש שנים. ‏`p_to` נשאר תקרת-"נכון-ל" לצורך אימות.
  v_to := coalesce(p_to, v_today);

  -- 🔴 הפרמטר נקרא, ואם אין שורה — נאמר. **בלי ברירת-מחדל שקטה** (§7.83).
  select p.param_value into v_param_raw from public.params p where p.param_name = v_param_name;
  begin
    v_param := nullif(btrim(coalesce(v_param_raw, '')), '')::numeric;
  exception when others then
    v_param := null;
  end;
  if v_param is null then
    v_missing := jsonb_build_array(v_param_name);
  end if;
  v_param_txt := case when v_param is null then null
                      else rtrim(rtrim(to_char(v_param, 'FM999,990.00'), '0'), '.') end;

  select c.company_name into v_customer_name
    from public.customers c where c.customer_id = p_customer_id;

  with base as materialized (
    select p.project_id, p.event_name, p.customer_id, p.final_event_date,
           p.actual_guests ag, q.estimated_guests eg,
           -- 🔴 המפתח של `assignments` הוא שלישייה; כאן סופרים **שורות-שיבוץ שאושרו סופית**
           -- באירוע, כפי שהשאילתה שהפיקה את קו-הבסיס סופרת (`cards-management.md` §③ מ6).
           (select count(*) from public.assignments a
             where a.project_id = p.project_id
               and a.assignment_status = 'finally_approved')::integer hs
      from public.projects p
      join public.quotes q on q.quote_id = p.quote_id
     where p.project_status = any (v_statuses)
       and p.final_event_date is not null
       and p.final_event_date <= v_to
       and (p_customer_id is null or p.customer_id = p_customer_id)
  ),
  scoped as (
    select b.*,
           b.ag::numeric / nullif(b.hs, 0) ratio,      -- ④ מ6 (ב): אפס דיילות ⇒ null, לא אינסוף
           b.ag - b.eg gap
      from base b
  ),
  paired as (select * from scoped where ag is not null and eg is not null),
  prev as (select * from scoped where final_event_date <= (v_to - interval '1 year')::date),
  prev_paired as (select * from prev where ag is not null and eg is not null),
  hist as (
    select k.ord, k.key, k.label,
           coalesce((select count(*) from paired p
                      where p.ratio is not null
                        and (k.lo is null or p.ratio >= k.lo)
                        and (k.hi is null or p.ratio <  k.hi)), 0)::integer n
      from (values
              (1, 'lt25',   'מתחת ל-25', null::numeric, 25::numeric),
              (2, '25-30',  '25–30',     25,  30),
              (3, '30-35',  '30–35',     30,  35),
              (4, '35-40',  '35–40',     35,  40),
              (5, '40-45',  '40–45',     40,  45),
              (6, '45-50',  '45–50',     45,  50),
              (7, '50-55',  '50–55',     50,  55),
              (8, '55plus', '55 ומעלה',  55,  null)
            ) as k(ord, key, label, lo, hi)
  )
  select (select count(*)::integer from scoped),
         (select count(*)::integer from paired),
         (select count(*)::integer from scoped where ag is null),
         (select count(*)::integer from paired where ag > eg),
         -- ‏`percentile_cont` מחזירה `double precision`; ההמרה מפורשת כדי שהעיגול ב-📐4
         -- ייעשה על אותו טיפוס בשני צדי השוואת-האורקל (`medianOf` ב-JS).
         (select percentile_cont(0.5) within group (order by ratio)::numeric
            from paired where ratio is not null),
         -- 🔴 פרמטר חסר ⇒ `null`, **לא 0**: "אפס אירועים חרגו" ו"לא יודעים כמה חרגו" הם
         -- שתי אמירות שונות, והראשונה נקראת כבשורה טובה (§7.83 · ④ מ6 ג).
         (select case when v_param is null then null else
            count(*) filter (where ratio is not null and ratio > v_param)::integer end from paired),
         (select count(*)::integer from prev),
         (select count(*)::integer from prev_paired),
         (select count(*)::integer from prev_paired where ag > eg),
         (select percentile_cont(0.5) within group (order by ratio)::numeric
            from prev_paired where ratio is not null),
         (select case when v_param is null then null else
            count(*) filter (where ratio is not null and ratio > v_param)::integer end from prev_paired),
         -- 📑ב#10: הסטייה בינארית בצורה, לא בגודל-נקודה; הפיזור מצייר את כל האירועים.
         (select coalesce(jsonb_agg(jsonb_build_object(
            'project_id', project_id, 'estimated', eg, 'actual', ag,
            'over_estimate', ag > eg, 'ratio', ratio) order by eg, project_id), '[]'::jsonb)
          from paired),
         (select coalesce(jsonb_agg(jsonb_build_object(
            'bucket', key, 'label', label, 'count', n) order by ord), '[]'::jsonb) from hist),
         -- 📐7 · ⑧ 6.6: מיון לפי **הפער המוחלט באורחים** — סטייה מוצהרת ופתוחה להכרעת-ישי.
         (select coalesce(jsonb_agg(jsonb_build_object(
            'project_id',       t.project_id,
            'event_name',       t.event_name,
            'customer_name',    cu.company_name,
            'final_event_date', t.final_event_date,
            'estimated',        t.eg,
            'actual',           t.ag,
            'gap',              t.gap,
            'gap_percent',      100.0 * t.gap / nullif(t.eg, 0),
            'hostesses',        t.hs,
            'ratio',            t.ratio,
            'drill_key',        jsonb_build_object('kind', 'project', 'id', t.project_id)
          ) order by t.gap desc, t.project_id), '[]'::jsonb)
          from (select * from paired where ag > eg order by gap desc, project_id limit 50) t
          left join public.customers cu on cu.customer_id = t.customer_id)
    into v_pop_n, v_both_n, v_missing_actual, v_over_n, v_median, v_above,
         v_prev_pop, v_prev_both, v_prev_over, v_prev_median, v_prev_above,
         v_scatter, v_hist, v_rows;

  -- 🔴 D2 · קצה-הצירים נמדד מהמטען עצמו ולא מוקלד: הקו האלכסוני נמסר ל-`ChartCard`
  --    כ-`segment` מפורש, ובלי `from`/`to` הוא נופל לברירת-המחדל `(0,0)→(100,100)`
  --    (`ChartCard.jsx:188-190`) — קו זעיר בפינה השמאלית-תחתונה בעוד הנתונים רצים
  --    ‏40–600 אורחים. 5% תוספת כדי שהקו יחצה גם את הנקודה הקיצונית ולא ייעצר בה.
  select ceil(greatest(max((e ->> 'estimated')::numeric), max((e ->> 'actual')::numeric)) * 1.05)
    into v_axis_max
    from jsonb_array_elements(v_scatter) e;

  -- תווית-הדלי שבו נופל הפרמטר. התאום ב-JS הוא `ratioBucketLabelFor`
  -- (`src/lib/reportsExecutive.js`), והבדיקות שלידו הן האורקל.
  select e ->> 'label' into v_param_bucket
    from jsonb_array_elements(v_hist) with ordinality as t(e, ord)
   where v_param is not null
     and case e ->> 'bucket'
           when 'lt25'   then v_param <  25
           when '55plus' then v_param >= 55
           else v_param >= split_part(e ->> 'bucket', '-', 1)::numeric
            and v_param <  split_part(e ->> 'bucket', '-', 2)::numeric
         end
   order by ord limit 1;

  v_row_total := v_over_n;
  v_notes := jsonb_build_array(
    'הדף אינו מגיב למסנן התקופה — היחס נמדד על כל ההיסטוריה, כי האירועים החורגים פרוסים על שלוש שנים.',
    -- 📑#10 · D9: מוצהר במפורש ולא מושמט בשקט.
    'אין במערכת מושג "עמדה" ואין מונה מוזמנים-לדקה — "מוזמנים לדקה לעמדה" אינו נמדד כאן.');
  if v_missing_actual > 0 then
    -- 🔴 D2 · המונה הזה יצא **בלי בידוד ובלי מפריד** — המקום היחיד בארבע הפונקציות שבו
    --    מספר נכנס למשפט עברי חשוף. שתי הסריקות שלי פספסו אותו: סריקת-4-ספרות (14 קצר מדי)
    --    וסריקת-האריחים (זה `meta.notes`).
    v_notes := v_notes || to_jsonb((v_lri || to_char(v_missing_actual, 'FM999,999,999') || v_pdi ||
      ' אירועים הוצאו כי לא נרשם בהם מספר האורחים בפועל בסגירה — הם נספרים באריח הרביעי ולא נעלמים.')::text);
  end if;
  if v_param is null then
    v_notes := v_notes || to_jsonb(('חסר פרמטר מערכת: ' || v_param_name ||
      ' — קו פרמטר-התכנון ואריח «אירועים ביחס מעל הסף» אינם מצוירים.')::text);
  elsif v_param <> 50 then
    -- 🔴 תווית-האריח נעולה מילה-במילה ב-`spec.md §1.4` כ-"אירועים ביחס מעל 50" *(וכרטיס ⑩ ג
    -- מסביר למה הסף נשאר בכותרת)*. ⇒ שינוי הפרמטר בהגדרות הופך את **התווית** לשקר בעוד
    -- **המספר** נכון. אי-אפשר לתקן זאת כאן בלי לשנות תווית נעולה, ולכן זה נאמר על המסך.
    v_notes := v_notes || to_jsonb(('פרמטר-התכנון בהגדרות הוא ' || v_param_txt ||
      ' ולא 50 — המספר באריח נמדד לפי הפרמטר העדכני, אך תוויתו נעולה על 50 ודורשת הכרעה.')::text);
  end if;

  -- 📐23: אסטרטגי ⇒ *"לשים לב ש…"*, והכיוון נגזר מהמדידה ולא מוקלד.
  v_so_what := case
    when v_median is null or v_param is null then
      'לשים לב שאי-אפשר למדוד את היחס — חסר פרמטר-התכנון או שאין אירועים עם שני המספרים.'
    when v_median < v_param then
      'לשים לב שהאיוש בפועל נדיב מהתכנון ולא הפוך — יחס חציוני של ' ||
      v_lri || to_char(round(v_median, 1), 'FM990.0') || v_pdi || ' אורחים לדיילת מול פרמטר-תכנון ' ||
      v_lri || v_param_txt || v_pdi || ', ורק ב-' || v_lri || to_char(v_above, 'FM999,999,999') || v_pdi ||
      ' אירועים מתוך ' || v_lri || to_char(v_both_n, 'FM999,999,999') || v_pdi || ' (' ||
      v_lri || to_char(round(100.0 * v_above / nullif(v_both_n, 0), 1), 'FM990.0') || '%' || v_pdi ||
      ') היחס עלה על ' || v_lri || v_param_txt || v_pdi || '.'
    else
      'לשים לב שהאיוש בפועל הדוק מהתכנון — יחס חציוני של ' ||
      v_lri || to_char(round(v_median, 1), 'FM990.0') || v_pdi || ' אורחים לדיילת מול פרמטר-תכנון ' ||
      v_lri || v_param_txt || v_pdi || ', וב-' || v_lri || to_char(v_above, 'FM999,999,999') || v_pdi ||
      ' אירועים מתוך ' || v_lri || to_char(v_both_n, 'FM999,999,999') || v_pdi || ' היחס עלה עליו.'
  end;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_both_n,
      'label', 'אוכלוסייה: אירועים שכבר התקיימו וסגורים תפעולית (פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום) ושיש להם גם הערכת-אורחים בהצעה וגם מספר אורחים בפועל · ' ||
        v_lri || 'n=' || to_char(v_both_n, 'FM999,999,999') || v_pdi || ' מתוך ' || v_lri || to_char(v_pop_n, 'FM999,999,999') || v_pdi || '; הוצאו ' ||
        v_lri || to_char(v_missing_actual, 'FM999,999,999') || v_pdi || ' אירועים שבהם לא נרשם מספר האורחים בפועל בסגירה.',
      'excluded', jsonb_build_object('ללא מספר אורחים בפועל', v_missing_actual)
    ),
    'window', jsonb_build_object('from', null, 'to', v_to,
      'label', 'כל הזמנים · ' || coalesce(v_customer_name, 'כל הלקוחות')),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'median_ratio', 'label', 'יחס חציוני: אורחים לדיילת',
        'value', v_median, 'format', 'ratio',
        'sub', case when v_param is null then 'חסר פרמטר מערכת: ' || v_param_name
                    else 'מול פרמטר-התכנון ' || v_lri || v_param_txt || v_pdi end ||
               ' · נמדד על ' || v_lri || to_char(v_both_n, 'FM999,999,999') || v_pdi || ' אירועים',
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה',
        'compare', case when v_prev_median is null then null else jsonb_build_object(
          'value', v_prev_median, 'label', 'לפני שנה, אותו חישוב', 'note', null,
          'direction', case when v_median > v_prev_median then 'up' when v_median < v_prev_median then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'over_estimate', 'label', 'אירועים מעל הצפי',
        'value', v_over_n, 'format', 'int',
        'sub', 'הגיעו יותר אורחים מההערכה שבהצעה · ' ||
               v_lri || to_char(round(100.0 * v_over_n / nullif(v_both_n, 0), 1), 'FM990.0') || '%' || v_pdi ||
               ' מתוך ' || v_lri || to_char(v_both_n, 'FM999,999,999') || v_pdi || ' האירועים עם שני המספרים',
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה',
        'compare', case when v_prev_both = 0 then null else jsonb_build_object(
          'value', v_prev_over, 'label', 'לפני שנה',
          'note', 'מתוך ' || v_lri || to_char(v_prev_both, 'FM999,999,999') || v_pdi,
          'direction', case when v_over_n > v_prev_over then 'up' when v_over_n < v_prev_over then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'above_param', 'label', 'אירועים ביחס מעל 50',
        'value', v_above, 'format', 'int',
        'sub', case when v_param is null then 'חסר פרמטר מערכת: ' || v_param_name
                    else v_lri || to_char(round(100.0 * v_above / nullif(v_both_n, 0), 1), 'FM990.0') || '%' || v_pdi ||
                         ' — יותר מ-' || v_lri || v_param_txt || v_pdi || ' אורחים לכל דיילת בפועל' end,
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה',
        'compare', case when v_prev_both = 0 or v_param is null then null else jsonb_build_object(
          'value', v_prev_above, 'label', 'לפני שנה',
          'note', 'מתוך ' || v_lri || to_char(v_prev_both, 'FM999,999,999') || v_pdi,
          'direction', case when v_above > v_prev_above then 'up' when v_above < v_prev_above then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'both_numbers', 'label', 'אירועים עם שני המספרים',
        'value', v_both_n, 'format', 'int',
        'sub', 'מתוך ' || v_lri || to_char(v_pop_n, 'FM999,999,999') || v_pdi || ' (' ||
               v_lri || to_char(round(100.0 * v_both_n / nullif(v_pop_n, 0), 1), 'FM990.0') || '%' || v_pdi || ') · ב-' ||
               v_lri || to_char(v_missing_actual, 'FM999,999,999') || v_pdi || ' אירועים לא נרשם מספר האורחים בפועל',
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה',
        'compare', case when v_prev_pop = 0 then null else jsonb_build_object(
          'value', v_prev_both, 'label', 'לפני שנה',
          'note', 'מתוך ' || v_lri || to_char(v_prev_pop, 'FM999,999,999') || v_pdi,
          'direction', case when v_both_n > v_prev_both then 'up' when v_both_n < v_prev_both then 'down' else 'flat' end) end,
        'target', null)
    ),
    'chart', jsonb_build_array(
      jsonb_build_object(
        'type', 'scatter', 'title', 'אורחים שהוערכו מול אורחים שהגיעו',
        -- 🔴 D2 · **בפיזור `series` הוא זוג ולא יחיד** — התאום המדויק של הפגם שתיקון F2
        --    מצא בדוח 16: ‏`ScatterBody` (`src/modules/11_reports/components/ChartCard.jsx:283-297`)
        --    קורא את `series[0].label` כשם ציר-ה-X ואת **`series[1].key` כעמודת-ה-Y**.
        --    עם איבר אחד `series[1]` הוא `undefined`, ציר-ה-Y נקשר ל-`dataKey="y"`, ולאף
        --    אחת מ-717 הנקודות אין שדה כזה ⇒ **פיזור בלי ציר-Y, בלי שגיאה ובלי בדיקה
        --    אדומה**, בדף שכרטיסו §③ קורא לגרף הזה *"הקו עצמו הוא ההשוואה"*.
        'series', jsonb_build_array(
          jsonb_build_object('key', 'estimated', 'label', 'אורחים שהוערכו', 'kind', 'scatter', 'axis', 'left', 'format', 'int'),
          jsonb_build_object('key', 'actual', 'label', 'אורחים שהגיעו', 'kind', 'scatter', 'axis', 'left', 'format', 'int')),
        -- ‏`domain` בפיזור הוא תחום **ציר-ה-Y**; נעילתו לאותו קצה כמו האלכסון היא מה
        -- שמקיים את *"שני הצירים בקנה-מידה זהה"* (§③ מ6) בצד שהמטען שולט בו.
        'data', v_scatter, 'xKey', 'estimated',
        'domain', case when v_axis_max is null then null else jsonb_build_array(0, v_axis_max) end,
        -- ➕ הרחבת-C8: `axis = 'diagonal'` — ‏📐6 · 📑ב#10 מחייבים קו `y=x`, ו-`'x'|'y'`
        -- אינם יכולים לבטא אלכסון. `value` הוא השיפוע; `from`/`to` הם הקצוות שהרכיב מצייר.
        'refLines', jsonb_build_array(jsonb_build_object(
          'axis', 'diagonal', 'value', 1, 'label', 'ההערכה התקיימה בדיוק',
          'from', jsonb_build_object('x', 0, 'y', 0),
          'to', jsonb_build_object('x', coalesce(v_axis_max, 100), 'y', coalesce(v_axis_max, 100)))),
        'unit', 'int'),
      jsonb_build_object(
        'type', 'histogram', 'title', 'התפלגות היחס — אורחים לדיילת',
        'series', jsonb_build_array(
          jsonb_build_object('key', 'count', 'label', 'אירועים', 'kind', 'bar', 'axis', 'left')),
        'data', v_hist, 'xKey', 'label', 'domain', null,
        -- 🔴 D2 · ציר-ה-X של ההיסטוגרמה הוא **קטגוריאלי** (`xKey='label'`, דליים כמחרוזות),
        --    ולכן `ReferenceLine x={50}` אינו נמצא בתחום-הסקאלה ואינו מצויר כלל: קו
        --    פרמטר-התכנון — שהוא **התשובה החזותית לשאלת-הכותרת** (⑧ 6.2) — פשוט נעדר.
        --    העוגן הוא תווית-הדלי שבו נופל הפרמטר, נגזרת מהפרמטר החי ולא מוקלדת.
        'refLines', case when v_param is null or v_param_bucket is null then '[]'::jsonb
          else jsonb_build_array(jsonb_build_object(
            'axis', 'x', 'value', v_param_bucket,
            -- הכרעה 6, מילה-במילה על המסך: פרמטר ולא יעד.
            'label', 'פרמטר-תכנון ' || v_param_txt || ' — לא יעד')) end,
        'unit', 'int')
    ),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'event_name', 'label', 'אירוע', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'final_event_date', 'label', 'תאריך', 'format', 'date', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'estimated', 'label', 'הוערכו', 'format', 'int', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'actual', 'label', 'הגיעו', 'format', 'int', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'gap', 'label', 'פער', 'format', 'int', 'align', 'end', 'sorted', 'desc'),
      jsonb_build_object('key', 'hostesses', 'label', 'דיילות', 'format', 'int', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'ratio', 'label', 'אורחים לדיילת', 'format', 'ratio', 'align', 'end', 'sorted', null)
    ),
    'rows', v_rows,
    'so_what', v_so_what,
    'definitions', '"הוערכו" = מספר האורחים שנרשם בהצעת המחיר לפני האירוע · "הגיעו" = מספר האורחים שנרשם בסגירה התפעולית · "דיילות" = דיילות שאושרו סופית לאירוע, לא דיילות שהוזמנו · יחס = הגיעו חלקי דיילות · יחס חציוני = החציון על פני האירועים, לא סך האורחים חלקי סך הדיילות · פרמטר-התכנון הוא נקודת-מוצא לשיבוץ, לא יעד ולא סף.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', v_missing,
      'frozen_count', null,
      'row_total', v_row_total,
      'notes', v_notes,
      'run', null,
      -- 🔴 D2 · ר' ההנמקה במ2.
      'sort', jsonb_build_object('key', 'gap', 'direction', 'descending'),
      'customer_filter_ignored', false,
      'drill_echo', p_drill)
  );
end;
$function$;

comment on function public.report_m06_staffing(date, date, integer, jsonb) is
'מ11 · קהל מול צוות (אסטרטגי). אוכלוסייה: אירועים בארבעת הסטטוסים של הכרעה 36 עם final_event_date שאינו null עד p_to, שיש להם גם estimated_guests בהצעה וגם actual_guests בסגירה; אירוע בלי actual_guests מוצא ונספר באריח "אירועים עם שני המספרים". המכנה של היחס הוא דיילות ב-assignment_status = finally_approved — בפועל ולא required_hostess_count (§📑#10); אפס דיילות ⇒ nullif ⇒ האירוע אינו נכנס לחציון. היחס החציוני הוא percentile_cont על פני האירועים, לא סך-אורחים ÷ סך-דיילות. הפרמטר יחס_אורחים_לדיילת נקרא מ-params בזמן-ריצה; חסר ⇒ meta.missing_params ואריח בלי ערך, לעולם לא ברירת-מחדל שקטה (§7.83). הפרמטר הוא פרמטר-תכנון ולא יעד ולא סף (הכרעה 6) ⇒ אין צבע-סף בדף. p_from מתעלמים ממנו (⑧ G5).';

revoke execute on function public.report_m06_staffing(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m06_staffing(date, date, integer, jsonb) to authenticated;
