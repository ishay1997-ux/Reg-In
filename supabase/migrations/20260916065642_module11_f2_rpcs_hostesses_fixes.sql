-- =============================================================================
-- מודול 11 · מיגרציה F2 · תיקון-קדימה לארבע פונקציות-הקריאה של לשונית "דיילות"
-- ‏`report_m14_hostess_overview` · `report_m15_reliability` ·
-- ‏`report_m16_quality_cost` · **`report_m17_fairness` — נוצרת כאן בפעם הראשונה**
-- =============================================================================
-- 🎯 **מה זה:** תיקון-קדימה (append-only) למיגרציה
--    `20260916052359_module11_f_rpcs_hostesses.sql`. **הקובץ ההוא לא נערך ולא ייערך** —
--    הוא הוחל, ותיקון מתבצע אך ורק במיגרציה חדשה קדימה (‏`supabase/migrations/CLAUDE.md §2`).
--    **קריאה בלבד:** אין טבלה חדשה, אין עמודה, אין policy, אין אינדקס, אין נגיעה בנתונים.
--    כל ארבע הפונקציות נשארות `stable security definer set search_path to ''`, עם
--    ‏`assert_module_permission('דיילות', array['edit','view'])` כמשפט הראשון, ועם
--    ‏`revoke … from public, anon, authenticated` ואז `grant … to authenticated`.
--
-- 🔻 **שער-האישור:** הוחל דרך MCP בלי הד-מוקלד, לפי ויתור-ישי של 16/09/2026
--    (‏`docs/micro_guides/module-11.md §9 D-9` — *"על כולם — מיגרציות (~8)"*), חד-פעמי.
--
-- ⚠️ **מלכודת שם-הקובץ מול שם-הרשומה (‏`supabase/migrations/CLAUDE.md §3`) — קרתה פעמיים,
--    ומתועדת כאן כדי שה-CLI לא ינסה להריץ שוב:**
--    · **F (16/09 05:2X):** קריאת-`apply_migration` אחת על כל הקובץ (~90,849 תווים) **נקטעה
--      בתעבורה ונדחתה**; שום דבר לא הוחל (רולבק טרנזקציוני, אומת מול `pg_proc`). הקובץ הוחל
--      אז בשלוש קריאות פר-פונקציה ⇒ הרשם נושא **שלוש שורות** —
--      `module11_f_rpcs_hostesses_m14` / `_m15` / `_m16` (גרסאות 20260916031804 / 032033 /
--      032149) — לקובץ אחד בשם `20260916052359_module11_f_rpcs_hostesses.sql`.
--      ‏`report_m17_fairness` **לא נוצרה כלל** (ר' 🔴 למטה).
--    · **ובחלק של מ14 בלבד, ההערות העבריות בגוף קוצצו בתעבורה** ⇒ `pg_get_functiondef`
--      של מ14 לא התאים לקובץ (21,364 מול 23,332 תווים; מ15 ומ16 התאימו ל-md5 המדויק —
--      נמדד 16/09/2026 06:5X). ⇒ **F2 יוצרת את מ14 מחדש מגוף-הקובץ במלואו**, והריפו
--      והמסד חוזרים להיות אותו דבר.
--    · **F2 מוחלת בקריאות פר-פונקציה** (גבול-התעבורה הנמדד: ~60KB לקריאה; החלק הגדול
--      כאן הוא 33KB). ⇒ **שבע שורות ברשם לקובץ אחד**, ואלה שמותיהן המדויקים
--      (‏`select name, version from supabase_migrations.schema_migrations` — נבדק
--      16/09/2026 07:0X): `module11_f2_hostesses_m17` (20260916040735) · `_m16` (040925) ·
--      `_m15` (041215) · `_m14` (041541) · `_m15_fix` (042105) · `_m14_winlabel` (042649) ·
--      `_m17_winlabel` (042928).
--      🔑 **השוואת-מיגרציות נעשית לפי `name` ולא לפי `version`.**
--      🔴 **שלוש השורות האחרונות הן תיקון-בתוך-הפעולה, ומדווחות ככאלה:**
--        · `_m15_fix` — ‏`full join … on … is not distinct from …` שנכתב כאן **עבר
--          קומפילציה בירוק ומת בקריאה הראשונה** ב-`0A000 FULL JOIN is only supported with
--          merge-joinable or hash-joinable join conditions`. **בדיוק המחלקה שהקובץ הזה
--          בא לתקן** — נתפס רק בגלל שהאימות החי רץ על כל הארבע ולא רק על החדשה.
--        · `_m14_winlabel` / `_m17_winlabel` — האימות החי על הפריסט "חודש אחרון" הראה
--          שאריח "הגעה בזמן" מחזיר **93.9%** ותוויתו עדיין *"12 החודשים האחרונים"*;
--          אותה מחלקה בדיוק של אריח-התור, בתווית אחת משם. ⇒ תווית-החלון נגזרת מהחלון.
--      **גוף הקובץ כאן הוא המצב הסופי**, והוא `md5`-זהה לגוף החי (נמדד: מ14
--      `f83581cb…`/27,766 · מ15 `80be2d9e…`/27,450 · מ16 `f0603ab0…`/12,303 · מ17
--      `0ad0fbbc…`/23,704 — ‏`select md5(prosrc), length(prosrc) from pg_proc`).
--
-- 🔴 **מה מתוקן, ולמה כל אחד מהם שרד את כל השערים** *(ממצאי סוכן-האימות, 16/09/2026)*:
--    · **מ17 לא התקמפלה מעולם.** ‏`coalesce(` ב-CTE ‏`speed_rows` נפתח ולא נסגר, ה-CTE
--      בלע את כל ה-`return`, והקומפילציה מתה ב-`42601 unexpected end of function
--      definition at end of input` **על הפונקציה כולה**. ⇒ משטח שלם לא היה קיים, ו-**32
--      בדיקות-היחידה נשארו ירוקות** כי `src/lib/reportsHostesses.js` הוא מימוש-מקביל
--      ב-JS ואינו נוגע ב-SQL. תיקון: `), '[]'::jsonb) j`.
--    · **אריח-התור של מ14 נמדד על חלון-הקורא בעוד התווית אמרה "חלון קפוא".** על פריסט
--      "חודש אחרון" הוא החזיר **0 אדומות מתוך 4 דיילות** בעוד `report_m15_reliability`
--      החזיר 6 אדומות מתוך 87 — ושורת-"אז מה" אמרה *"אין תור לטפל בו החודש"* ליד דלת
--      שנפתחת לשישה. ⇒ התור, `sub`-שלו, שורת-ההגדרות וממוצע-החברה עברו לחלון הקפוא,
--      זהה לאריתמטיקה של מ15.
--    · **הפיזור של מ16 היה בלי ציר-Y.** ‏`series` נשא איבר אחד, והרנדרר
--      (`ChartCard.jsx:283-297`) קורא `series[1].key` כעמודת-ה-Y ⇒ `dataKey="y"` שאינו
--      קיים באף אחת מ-50 הנקודות. ⇒ `series` הוא זוג: `hourly_rate` ואז `rating`.
--    · **מ16 החזיר 17 שורות מתוך 50** כי ה-SQL החיל את ברירת-המחדל של הלקוח
--      (`filter (where h.rating is null)`) ⇒ כיבוי השבב `#onlyNoRating` החזיר טבלה ריקה.
--    · **שני שיעורי אי-ההגעה לפי דירוג (הכרעה 37) לא היו במטען כלל** — לא כמספר ולא
--      כשדה שאפשר לגזור ממנו. ⇒ `meta.no_show_by_rating` + טבלה ב-`meta.extra_tables`.
--    · **שורת-📐2 של מ14 ספרה את העתיד כחוסר-דאטה של ההווה** (זימון ממתין לאירוע שטרם
--      התקיים נספר כ"הוצא" מאוכלוסיית-נוכחות שלא היה כשיר לה). ⇒ שתי השורות מוגבלות
--      לאירוע שכבר עבר.
--    · **צורת-המטען אוחדה:** `drill_key` הוא `{kind:'hostess', id}` בכל ארבע · תת-שורת
--      האריח היא `tiles[].sub` (כמו במיגרציית-ההנהלה) ולא `detail` · `meta.drill_echo`
--      ו-`meta.customer_filter_ignored` בכל ארבע, וה-דגל הוא **תכונה של המשטח** ⇒ `true`
--      קבוע · `meta.sort` בכל ארבע (📐9).
--
-- 📊 **תיקון-רשומה, בלי קוד — כדי שאודיט-הסגירה לא יפתח אותו מחדש:** ‏`0.4329` (ג'יני
--    החלון הקודם, `processes-approved.md §ח8-1` · `§📑#14א` · `data-set.md:1066` ·
--    `stage1-review/m11-live-anchors.md:41`) **אינו משתחזר באף קונבנציית-גבול על החלון
--    של 10/09** — והסיבה נמצאה: הרשם מתעד אותו עם **1,455 משמרות**, ו-`§📑#14א` מציין
--    שהוא **"נמדד 06/09"**. החלון `(06/09/2024, 06/09/2025]` מחזיר `n=95 · 1,455 ·
--    0.4329` **בדיוק**. הכרטיס מדד מחדש ב-10/09 וקיבל `n=95 · 1,446 · 0.4299`.
--    ⇒ **שתי מדידות נכונות של אותה הגדרה בשני ימים** — ארבעה ימים של חלון נגרר, ותו לא.
--    לאיזה יום מוצמד עוגן-ההשוואה של החץ — תיקון-רשומה לישי, לא שינוי-קוד.
--
-- 📐 **קונבנציית-החלון (§9 D-17):** תקופת-לוח סגורה `[from, to]` · חלון-נגרר חצי-פתוח
--    `(from, to]`. כל ארבע הפונקציות כאן הן חלון-נגרר ⇒ חצי-פתוח, כפי שהיו.
--
-- ⚠️ **נמדד ולא תוקן כאן, כי אינו בשטח-הכתיבה של המיגרציה הזו:**
--    · `WEEKDAY_NAMES_HE` (`src/lib/dates.js:97`) מוצהרת `const` **בלי `export`** ⇒ ציר
--      יום-בשבוע של מ15 ירונדר 0–6. ‏`chart.label_source` נשאר כפי שהוא; ה-`export`
--      שייך לבונה-הלשונית.
--    · `KpiTile.jsx` אינו מרנדר לא `tiles[].sub` ולא `tiles[].detail` — תת-השורה של
--      המוקאפ אינה מגיעה למסך **באף אחת מארבע הלשוניות**.
--    · `columns[].sorted` (תיקון-C8, 38 מופעים במיגרציית-ההנהלה) אינו נקרא באף קובץ;
--      הקורא בפועל הוא `meta.sort`.
-- =============================================================================


-- =============================================================================


-- =============================================================================
-- ‏1 · `report_m14_hostess_overview` — "מבט-על דיילות · מה מצב המאגר?"
-- =============================================================================
-- ‏**הכרטיס:** `stage2-cards/cards-hostesses.md` §מ14 (①–⑩) · **ההגדרה:** §📑 שורת
-- "מבט-על דיילות" + §📑ב · **סוג:** בקרה (🧭).
-- **ההכרעות שהמשטח הזה מראה:** ‏**33** (כל אריח-מבט-על הוא דלת לדף — `tiles[].target`) ·
-- ‏**4** (חצי-השוואה בכל אריח + שורת-"אז מה") · **6** (השוואה לתקופה מקבילה, בלי יעד) ·
-- ‏**19** (השורה כולה לחיצה — `rows[].drill_key`) · **22** (בקרה ⇒ "האם חריגה בולטת מיד") ·
-- ‏**32** (תור של 5–6 אדומות, **וכולן פעילות**) · **35** (0.87/0.95 מ-`params`) ·
-- ‏**38** (אותו ציון של Smart Match).
-- 🔴 **ותת-שורת-ג'יני מדברת ברבעים ולא ב"שלוש הדיילות העמוסות"** (⑧14.1): על `n=106`
-- שלוש הדיילות מחזיקות 7.5% — משפט שנקרא כ"אין ריכוזיות" ליד מדד של 0.46 שאומר את ההפך.
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
               coalesce(v_pop_n, 0) || ' שיבוצים אצל ' || coalesce(v_pop_hosts, 0) ||
               ' דיילות · הוצאו: ' || coalesce((v_excluded->>'היעדרות באישור מראש ומחלה'), '0') ||
               ' היעדרויות באישור מראש ומחלה (לא נספרות לא במונה ולא במכנה) · ' ||
               coalesce((v_excluded->>'סירובים'), '0') || ' סירובים · ' ||
               coalesce((v_excluded->>'זימונים שלא נענו'), '0') || ' זימונים שלא נענו · ' ||
               coalesce((v_excluded->>'נוכחות טרם סומנה'), '0') || ' שיבוצים שנוכחותם טרם סומנה.',
      'excluded', coalesce(v_excluded, '{}'::jsonb)),
    'window', jsonb_build_object('from', v_from, 'to', v_to, 'label', v_win_full),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'on_time', 'label', 'הגעה בזמן', 'value', v_on_time_pct, 'format', 'percent',
        'window', v_win_text,
        'compare', case when v_prev_pct is null then null else jsonb_build_object(
          'value', v_prev_pct, 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_on_time_pct > v_prev_pct then 'up' when v_on_time_pct < v_prev_pct then 'down' else 'flat' end) end,
        'target', null,
        'sub', coalesce(v_on_time, 0) || ' מתוך ' || coalesce(v_obs, 0) || ' שיבוצים'),
      jsonb_build_object('key', 'red_hostesses', 'label', 'דיילות אדומות', 'value', v_red, 'format', 'int',
        'window', 'חלון קפוא · 12 חודשים',
        'compare', case when v_prev_red is null then null else jsonb_build_object(
          'value', v_prev_red, 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_red > v_prev_red then 'up' when v_red < v_prev_red then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'אמינות והתייצבות', 'drill', null),
        'sub', coalesce(v_red, 0) || ' מתוך ' || coalesce(v_in_report, 0) || ' דיילות עם ' ||
                  coalesce(v_min_sample::text, '—') || ' משמרות ומעלה · ' || coalesce(v_amber, 0) ||
                  ' בענבר · ' || coalesce(v_red_active, 0) || ' מהאדומות פעילות'),
      jsonb_build_object('key', 'gini', 'label', 'ריכוזיות המשמרות', 'value', round(v_gini, 4), 'format', 'gini',
        'window', v_win_text,
        'compare', case when v_gini_prev is null then null else jsonb_build_object(
          'value', round(v_gini_prev, 4), 'label', 'התקופה המקבילה אשתקד (n=' || v_gini_prev_n || ')',
          'direction', case when v_gini > v_gini_prev then 'up' when v_gini < v_gini_prev then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'הוגנות השיבוץ', 'drill', null),
        'sub', 'מדד ג''יני · רבע הדיילות העמוסות ביותר מקבלות ' || coalesce(v_top_q_pct::text, '—') ||
                  '% מהמשמרות; מחצית המאגר מקבלת ' || coalesce(v_bottom_pct::text, '—') || '%'),
      jsonb_build_object('key', 'active_hostesses', 'label', 'דיילות פעילות', 'value', v_active, 'format', 'int',
        'window', 'נכון ל-' || to_char(v_today, 'DD/MM/YYYY'),
        'compare', null,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'איכות מול עלות', 'drill', null),
        'sub', 'מתוך ' || coalesce(v_registered, 0) || ' רשומות · ' || coalesce(v_worked, 0) || ' עבדו בחלון'),
      jsonb_build_object('key', 'gap_events', 'label', 'אירועים עם חוסר', 'value', v_gap_events, 'format', 'int',
        'window', '30 הימים הקרובים',
        'compare', case when v_prev_upcom = 0 then null else jsonb_build_object(
          'value', v_prev_gap, 'label', '31–60 הימים הבאים',
          'direction', case when v_gap_events > v_prev_gap then 'up' when v_gap_events < v_prev_gap then 'down' else 'flat' end) end,
        'target', null,
        'sub', case when v_upcoming = 0 then 'אין אירועים ב-30 הימים הקרובים'
                  else v_gap_events || ' מתוך ' || v_upcoming || ' אירועים · ' || v_gap_places ||
                       ' מקומות · ' || v_gap_pending || ' זימונים ממתינים' end)),
    'chart', jsonb_build_object(
      'type', 'bar', 'title', 'איחור ואי-הגעה לפי חודש',
      'series', jsonb_build_array(
        jsonb_build_object('key', 'late', 'label', 'איחור'),
        jsonb_build_object('key', 'no_show', 'label', 'אי-הגעה (הבריזה)')),
      'data', coalesce(v_chart, '[]'::jsonb), 'xKey', 'month',
      'domain', null, 'refLines', '[]'::jsonb, 'unit', 'percent'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'hostess_name',    'label', 'דיילת',          'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'status',          'label', 'סטטוס',          'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'shifts',          'label', 'משמרות',         'format', 'int',  'align', 'end'),
      jsonb_build_object('key', 'ghosted',         'label', 'הבריזה',         'format', 'int',  'align', 'end'),
      jsonb_build_object('key', 'reliability',     'label', 'ציון אמינות',     'format', 'ratio', 'align', 'end'),
      jsonb_build_object('key', 'last_shift_date', 'label', 'משמרת אחרונה',   'format', 'text', 'align', 'end')),
    'rows', coalesce(v_rows, '[]'::jsonb),
    'so_what', case
      when v_red is null or v_red = 0 then 'אין דיילות אדומות בחלון — אין תור לטפל בו החודש.'
      else 'לא לשלוח את ' || v_red || ' הדיילות האדומות לאירועים הקרובים — ' || v_red_active ||
           ' מהן פעילות ומוצעות היום בשיבוץ.' end,
    'definitions', 'הגדרות: הגעה בזמן = שיבוצים שסומן בהם "הגיעה" בלי דרגת-איחור, מתוך כל השיבוצים שסומנה בהם נוכחות · ' ||
      -- ‏`trim_scale` ולא `::text` גולמי: ‏`(0.87*100)::text` מרנדר **"87.00"** והמסך היה
      -- אומר *"נמוך מ-87.00%"* במקום *"נמוך מ-87%"* — נתפס בהרצת המטען מול המסד 16/09/2026.
      -- 🔴 **ממוצע-החברה כאן הוא זה של החלון הקפוא, בשש ספרות** — אותו מספר בדיוק
      --    ש-`report_m15_reliability` מחזיר ב-`meta.company_average`. עד F2 הודפס כאן
      --    ממוצע חלון-הקורא, ואותו מונח נשא שלושה ערכים שונים בלשונית אחת (0.9587 ·
      --    0.958358 · 0.958815).
      'דיילת אדומה = ציון-אמינות נמוך מ-' || coalesce(trim_scale(v_red_coef * 100)::text, '—') || '% מממוצע החברה (' ||
      coalesce(round(v_c_frozen, 6)::text, '—') || ') — כלומר מתחת ל-' || coalesce(round(v_red_coef * v_c_frozen, 6)::text, '—') ||
      '; ענבר = מתחת ל-' || coalesce(trim_scale(v_amber_coef * 100)::text, '—') || '% ממנו (' ||
      coalesce(round(v_amber_coef * v_c_frozen, 6)::text, '—') || ') · ' ||
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


-- =============================================================================
-- ‏2 · `report_m15_reliability` — "אמינות והתייצבות · את מי לא לשלוח, ואת מי להזהיר?"
-- =============================================================================
-- ‏**הכרטיס:** §מ15 · **ההגדרה:** §📑#13 + §📑ב#13 · **סוג:** תומך-החלטה (🧭) ⇒ נבחן
-- במבחן-ההחלטה המלא, ושורת-"אז מה" נפתחת ב*"לא לשלוח"* (📐23).
-- **ההכרעות שהמשטח מראה:** ‏**4** · **6** · **19** · **22** · **32** (תור של 5–6 אדומות,
-- כולן פעילות) · **35** (המקדמים מ-`params`) · **37** (🔴 **שתי עמודות אי-הגעה, והדוח
-- אינו בוחר ביניהן**) · **38** (אותו ציון של Smart Match, שני מסכים).
-- 🔴 **החלון כאן קפוא ל-12 חודשים ואינו נגרר אחרי מסנן-התקופה** (📑ב#13): בחודש גרוע
-- במיוחד כל הדיילות היו נראות "מסתדרות", וממוצע-החברה היה נע איתן.
-- 🔴 **וסף-המדגם (📐12) הוא מונה גלוי ולא אחוז:** על שתי משמרות אין מה לומר, והריסון
-- היה מושך אותן אל הממוצע ומייצר ציון שנראה אמין ואיננו.
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
      'label', 'אוכלוסייה: דיילות עם ' || coalesce(v_min_sample::text, '—') ||
               ' משמרות מסומנות ומעלה בחלון · n=' || coalesce(v_in_report, 0) || ' דיילות, ' ||
               coalesce(v_shifts_in, 0) || ' שיבוצים · הוצאו: ' || coalesce(v_below, 0) ||
               ' דיילות עם פחות מ-' || coalesce(v_min_sample::text, '—') ||
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
        'target', null, 'sub', coalesce(v_on_time, 0) || ' מתוך ' || coalesce(v_obs, 0)),
      jsonb_build_object('key', 'late', 'label', 'איחור',
        'value', round(100.0 * v_late / nullif(v_obs, 0), 1), 'format', 'percent',
        'window', 'חלון קפוא · 12 חודשים',
        'compare', case when v_prev_obs = 0 then null else jsonb_build_object(
          'value', round(100.0 * v_prev_late / nullif(v_prev_obs, 0), 1), 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_late * v_prev_obs > v_prev_late * v_obs then 'up'
                            when v_late * v_prev_obs < v_prev_late * v_obs then 'down' else 'flat' end) end,
        'target', null, 'sub', coalesce(v_late, 0) || ' שיבוצים, מהם ' || coalesce(v_late_heavy, 0) || ' באיחור רב'),
      jsonb_build_object('key', 'no_show', 'label', 'אי-הגעה (הבריזה)',
        'value', round(100.0 * v_ghosted / nullif(v_obs, 0), 1), 'format', 'percent',
        'window', 'חלון קפוא · 12 חודשים',
        'compare', case when v_prev_obs = 0 then null else jsonb_build_object(
          'value', round(100.0 * v_prev_ghost / nullif(v_prev_obs, 0), 1), 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_ghosted * v_prev_obs > v_prev_ghost * v_obs then 'up'
                            when v_ghosted * v_prev_obs < v_prev_ghost * v_obs then 'down' else 'flat' end) end,
        'target', null, 'sub', coalesce(v_ghosted, 0) || ' שיבוצים · ' || coalesce(v_withdrew, 0) || ' ביטלו אחרי אישור'),
      jsonb_build_object('key', 'flagged', 'label', 'דיילות מסומנות', 'value', v_flagged, 'format', 'int',
        'window', 'חלון קפוא · 12 חודשים',
        'compare', case when v_prev_flag is null then null else jsonb_build_object(
          'value', v_prev_flag, 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_flagged > v_prev_flag then 'up' when v_flagged < v_prev_flag then 'down' else 'flat' end) end,
        'target', null,
        'sub', coalesce(v_red, 0) || ' אדומות · ' || coalesce(v_amber, 0) || ' ענבר מתוך ' ||
                  coalesce(v_in_report, 0) || ' · ' || coalesce(v_red_active, 0) || ' מהאדומות פעילות')),
    'chart', jsonb_build_object(
      'type', 'bar', 'title', 'איחור ואי-הגעה לפי יום בשבוע',
      'series', jsonb_build_array(
        jsonb_build_object('key', 'late', 'label', 'איחור'),
        jsonb_build_object('key', 'no_show', 'label', 'אי-הגעה (הבריזה)')),
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
      jsonb_build_object('key', 'reliability',   'label', 'ציון אמינות',           'format', 'ratio', 'align', 'end')),
    'rows', coalesce(v_rows, '[]'::jsonb),
    'so_what', case
      when not v_bands_on then 'אין סימון אמינות עד שהמקדמים בהגדרות המערכת יתוקנו.'
      when coalesce(v_flagged, 0) = 0 then 'אין דיילות מתחת לסף בתקופה שנבחרה.'
      when coalesce(v_red, 0) = 0 then 'להזהיר את ' || v_amber || ' דיילות הענבר — אף אחת אינה אדומה החודש.'
      else 'לא לשלוח את ' || v_red || ' הדיילות האדומות — ' || coalesce(v_red_active, 0) ||
           ' מהן פעילות ומוצעות היום בשיבוץ; ' || coalesce(v_amber, 0) || ' דיילות ענבר לאזהרה.' end,
    'definitions', 'הגדרות: ציון אמינות = (סכום ערכי-הנוכחות + ' || coalesce(v_m::text, '—') || ' × ' ||
      coalesce(round(v_c, 4)::text, '—') || ') ÷ (מספר המשמרות + ' || coalesce(v_m::text, '—') ||
      ') — ממוצע ממותן אל ממוצע החברה · איחור נספר לפי דרגה: קל אינו מוריד מהציון, בינוני מוריד רבע, רב מוריד חצי · ' ||
      'שתי עמודות אי-ההגעה, ואף אחת מהן אינה "הנכונה": "הבריזה · ב-12 חודשים" היא ההגדרה שהציון עצמו עובד לפיה — רק אי-הגעה בלי הודעה, ורק בחלון הקפוא · ' ||
      '"אי-הגעה · אי-פעם" היא כל סיבות אי-ההגעה — כולל מחלה והיעדרות באישור — ועל כל ההיסטוריה. שתיהן נכונות בהגדרתן, והדוח אינו בוחר ביניהן · ' ||
      'הבריזה = לא הגיעה ולא הודיעה — רק היא מאפסת את הציון של אותה משמרת · ' ||
      'ביטלה אחרי אישור = הודיעה שלא תגיע אחרי שכבר אושרה סופית — נספר כחצי משמרת · ' ||
      'החלון = 12 חודשים אחורה מהיום, קפוא ואינו נגרר אחרי מסנן-התקופה.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', to_jsonb(v_missing),
      'frozen_count', null,
      'notes', v_notes || to_jsonb(
        ('מתחת לסף המדגם: ' || coalesce(v_below, 0) || ' דיילות עם פחות מ-' ||
         coalesce(v_min_sample::text, '—') || ' משמרות מסומנות אינן בדוח (' ||
         coalesce(v_shifts_out, 0) || ' שיבוצים).')::text),
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


-- =============================================================================
-- ‏3 · `report_m16_quality_cost` — "איכות מול עלות · מי שווה את התעריף שלה?"
-- =============================================================================
-- ‏**הכרטיס:** §מ16 · **ההגדרה:** §📑#14 + §📑ב#14 · **סוג:** תומך-החלטה (🧭).
-- **ההכרעות שהמשטח מראה:** ‏**4** · **6** (חציון-החברה כבסיס-השוואה, **בלי סף-צבע**) ·
-- ‏**19** (השורה כולה לחיצה) · **22**.
-- 🔴 **האוכלוסייה היא 50 הפעילות — אוכלוסייה ולא מסנן** (⑧16.1): אין החלטת-תעריף לקבל
-- על דיילת שאינה מוצעת. **וזה גם למה חציון-התעריף כאן הוא של הפעילות ולא של 186 הרשומות** —
-- כל דיילת נמדדת מול הקבוצה שהיא באמת מתחרה בה.
-- 🔴 **`hourly_rate` הנוכחי ולא ה-snapshot** (⑧16.6): הדוח שואל "מי שווה את התעריף שלה" —
-- שאלה על העתיד. ‏`hourly_rate_snapshot` נכון לדוח-השכר (מ13), לא כאן.
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
           filter (where h.status = 'active' and h.rating is not null))::numeric
    into v_active, v_registered, v_no_rating, v_no_rate, v_median, v_median_all, v_rating_med
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
      'label', 'אוכלוסייה: דיילות פעילות בלבד — n=' || coalesce(v_active, 0) || ' מתוך ' ||
               coalesce(v_registered, 0) || ' רשומות · הוצאו: ' || coalesce(v_registered - v_active, 0) ||
               ' דיילות שסטטוסן "לא פעילה", כי אין החלטת-תעריף לקבל עליהן · התעריף והדירוג הם ערכי-היום בכרטיס הדיילת, לא ממוצע היסטורי.',
      'excluded', jsonb_build_object('לא פעילה', coalesce(v_registered - v_active, 0))),
    'window', jsonb_build_object('from', v_from, 'to', v_to,
      'label', 'נכון ל-' || to_char(v_today, 'DD/MM/YYYY') || ' · ספירת המשמרות ב-12 החודשים האחרונים'),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'no_rating', 'label', 'דיילות בלי דירוג', 'value', v_no_rating, 'format', 'int',
        'window', 'נכון ל-' || to_char(v_today, 'DD/MM/YYYY'),
        'compare', null, 'target', null,
        'sub', 'מתוך ' || coalesce(v_active, 0) || ' הדיילות הפעילות'),
      jsonb_build_object('key', 'median_rate', 'label', 'תעריף שעתי חציוני', 'value', round(v_median, 2), 'format', 'money',
        'window', 'נכון ל-' || to_char(v_today, 'DD/MM/YYYY'),
        'compare', case when v_median_all is null then null else jsonb_build_object(
          'value', round(v_median_all, 2), 'label', 'חציון כלל המאגר (' || coalesce(v_registered, 0) || ')',
          'direction', case when v_median > v_median_all then 'up' when v_median < v_median_all then 'down' else 'flat' end) end,
        'target', null,
        'sub', 'על ' || coalesce(v_active, 0) || ' הדיילות הפעילות'),
      jsonb_build_object('key', 'expensive_low_rated', 'label', 'יקרות ומדורגות נמוך', 'value', v_expensive, 'format', 'int',
        'window', 'נכון ל-' || to_char(v_today, 'DD/MM/YYYY'),
        'compare', null,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'אמינות והתייצבות', 'drill', null),
        'sub', 'תעריף מעל החציון (' || coalesce(round(v_median, 2)::text, '—') || ') וגם דירוג 3 ומטה'),
      jsonb_build_object('key', 'blocked', 'label', 'מסומנות "לא לשלוח"', 'value', v_blocked, 'format', 'int',
        'window', 'כל הזמנים',
        'compare', null, 'target', null,
        'sub', 'אצל לקוח אחד לפחות, מתוך ' || coalesce(v_active, 0) || ' הפעילות')),
    'chart', jsonb_build_object(
      'type', 'scatter', 'title', 'תעריף שעתי מול דירוג · הדיילות הפעילות',
      -- 🔴 **בפיזור, `series` הוא זוג ולא יחיד** (F2): הרנדרר `ScatterBody`
      --    (‏`src/modules/11_reports/components/ChartCard.jsx:283-297`) קורא
      --    `series[0].label` כשם ציר-ה-X ו-**`series[1].key` כעמודת-ה-Y**. עם איבר אחד
      --    ‏`series[1]` הוא `undefined`, ציר-ה-Y נקשר ל-`dataKey="y"`, ולאף אחת מ-50
      --    הנקודות אין שדה כזה ⇒ **פיזור בלי ציר-Y, בלי שגיאה ובלי בדיקה אדומה**, בדף
      --    שכרטיסו ⑥ קורא לו *"שני הריבועים … הם כל הדוח"*.
      'series', jsonb_build_array(
        jsonb_build_object('key', 'hourly_rate', 'label', 'תעריף שעתי'),
        jsonb_build_object('key', 'rating',      'label', 'דירוג')),
      'data', coalesce(v_scatter, '[]'::jsonb), 'xKey', 'hourly_rate',
      'domain', jsonb_build_array(1, 5),
      'refLines', jsonb_build_array(
        jsonb_build_object('axis', 'x', 'value', round(v_median, 2),
          'label', 'חציון התעריף ' || coalesce(round(v_median, 2)::text, '—') || ' ₪'),
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
        then 'לדרג את ' || v_no_rating || ' הדיילות הפעילות שאין להן דירוג — בלעדיו אי-אפשר לומר אם התעריף שלהן נכון.'
      else 'להוריד את התעריף של ' || v_expensive || ' הדיילות שמעל חציון-המאגר בדירוג 3 ומטה, או להפסיק לשלוח אותן; ובמקביל לדרג את ' ||
           coalesce(v_no_rating, 0) || ' הפעילות שאין להן דירוג.' end,
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


-- =============================================================================
-- ‏4 · `report_m17_fairness` — "הוגנות השיבוץ · האם השיבוץ הוגן ומהיר?"
-- =============================================================================
-- ‏**הכרטיס:** §מ17 · **ההגדרה:** §📑#14א + §📑ב#14א · **סוג:** בקרה (🧭) ⇒ נבחן ב"האם
-- הטיה נראית · כיול המשקולות", **ולא במבחן-ההחלטה המלא**.
-- **ההכרעות שהמשטח מראה:** ‏**4** · **6** · **19** · **22** · **R2** (⬇️ למטה).
-- 🔴 **שתי אוכלוסיות באותו דף, ושני `n` נפרדים** (⑧17.1): ההוגנות נמדדת על הדיילות שעבדו
-- בחלון, והמהירות על הזימונים שנשלחו בו. ⇒ **`columns`/`rows` הם טבלת-ההוגנות**, וטבלת
-- המהירות יושבת ב-`meta.extra_tables` *(תיקון-חוזה של המתזמר, 16/09/2026)*.
-- ⚠️ **וזה בדיוק הפריט ש-⑧17.6 השאיר לבנייה** *("או ייצוא של שתי הטבלאות לשני גיליונות,
--    או בורר")* — המטען נושא את שתיהן, וההכרעה על הייצוא היא של שלב-ה-UI.
-- 🔴 **R2 — חור-דאטה מקובל-בכוונה של מ4:** שליחה-חוזרת **דורסת** `invite_sent_at` ⇒ כל
--    זמן-תגובה כאן הוא *"מאז הזימון האחרון"*, לעולם לא מאז הראשון, והזמן הנמדד **קצר**
--    מהזמן שבאמת חיכו. נאמר על המסך במילים.
-- 🔴 **אימוץ המלצת Smart Match — היעדר מוצהר, לא אפס:** `assignments.recommended_rank`
--    נולדה במיגרציה B ו**כל השורות הקיימות `NULL`** (אין מילוי-לאחור, ת5). ⇒ הערך `null`
--    ו-`meta.notes` נושא *"נמדד מ-<תאריך>; N שיבוצים"*. 🚫 **`0%` היה נקרא "אף פעם לא
--    מאמצים את ההמלצה"** — טענה על מנוע שעוד לא נמדד (`spec.md §🎯` · 📑ב#14א).
-- 🔴 **הדוח הזה אינו דוח-קידוח, ו-`drill` תמיד `null`.** ‏📐13 מונה ארבעה דוחות-דריל —
--    ‏**1 · 6 · 16 · 4** (מגמות · גיול · שכר · **ריכוזיות-לקוחות, שהוא מ5**) — ואין ביניהם
--    את 14א; כרטיס ① מ17 קובע במפורש שהעקומה וקווי-העזר **אינם לחיצים**, כי 14א הוא
--    דוח-**בקרה**. ‏`p_drill` נשאר בחתימה לאחידות C5 בלבד, מוחזר כהד ב-`meta.drill_echo`,
--    **ואינו משנה דבר.** *(נבנה תחילה עם קידוח-רבעונים לפי בריף-המשימה; המתזמר תיקן
--    ‏16/09/2026 ש-C8 שגתה — "ריכוזיות" שם היא מ5 ולא מ17. הקידוח הוסר.)*
create or replace function public.report_m17_fairness(
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
  v_prev_to      date;
  v_prev_from    date;
  v_notes        jsonb := '[]'::jsonb;
  v_speed_rows   jsonb;
  v_gini         numeric;
  v_gini_prev    numeric;
  v_n            integer;
  v_n_prev       integer;
  v_shifts       integer;
  v_shifts_prev  integer;
  v_registered   integer;
  v_top_q_n      integer;
  v_top_q_pct    numeric;
  v_bottom_pct   numeric;
  v_top_dec_pct  numeric;
  v_max_shifts   integer;
  v_med_shifts   numeric;
  v_avg_shifts   numeric;
  v_invites      integer;
  v_answered     integer;
  v_prev_inv     integer;
  v_prev_ans     integer;
  v_med_hours    numeric;
  v_p90_hours    numeric;
  v_prev_med     numeric;
  v_prev_p90     numeric;
  v_rank_total   integer;
  v_rank_first   integer;
  v_rank_from    date;
  v_lorenz       jsonb;
  v_rows         jsonb;
  v_min_sample   numeric;
  v_missing      text[] := array[]::text[];
  v_resp_rating  jsonb;
  -- 📐3 · תווית-החלון נגזרת מהחלון ולא קבועה בקוד — ר' ההערה במ14 (F2).
  v_win_text     text;
  v_win_full     text;
  -- בידוד-כיווניות למספרים בתוך משפט עברי — התאום של `isolateLtr` ב-`reportsFormat.js`
  -- ושל `v_lri`/`v_pdi` במיגרציית-ההנהלה. בלעדיו טווח-תאריכים מתהפך והסימן נודד.
  v_lri constant text := chr(8294);   -- U+2066 LRI
  v_pdi constant text := chr(8297);   -- U+2069 PDI
begin
  perform public.assert_module_permission('דיילות', array['edit', 'view']);

  v_to        := coalesce(p_to, v_today);
  v_from      := coalesce(p_from, (v_to - interval '12 months')::date);
  v_prev_to   := v_from;
  v_prev_from := (v_from - (v_to - v_from))::date;

  v_win_text  := case when v_from = (v_to - interval '12 months')::date then '12 החודשים האחרונים'
                      else v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi end;
  v_win_full  := v_win_text || case when v_from = (v_to - interval '12 months')::date
                                    then ' (' || v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' ||
                                         to_char(v_to, 'DD/MM/YYYY') || v_pdi || ')'
                                    else '' end;

  select nullif(btrim(pa.param_value), '')::numeric into v_min_sample
    from public.params pa where pa.param_name = 'מינימום_תשובות_להצגת_ציון';
  if v_min_sample is null then v_missing := v_missing || 'מינימום_תשובות_להצגת_ציון'; end if;

  if p_customer_id is not null then
    v_notes := v_notes || to_jsonb(
      'הדף אינו מושפע ממסנן הלקוח — ההוגנות נמדדת על חלוקת המשמרות בכל המאגר.'::text);
  end if;

  -- ── אזור ההוגנות: ספירת משמרות `finally_approved` פר-דיילת, אירוע שעבר (§ח8-1).
  -- 🔴 **ג'יני גרסת-אוכלוסייה**, בלי `n/(n−1)` — `spec.md §🔢 3.3`, והאורקל ב-
  --    `src/lib/reportsHostesses.test.js` (‏1·2·3·4·10 ⇒ 0.40 · המדגם ⇒ 0.50).
  -- **עקומת-לורנץ נגזרת מאותה סדרה בדיוק** ⇒ המדד והעקומה לעולם לא סותרים זה את זה.
  -- ‏`(i·100)/n` ולא `(i/n)·100`: השנייה מחזירה 60.00000000000001 ומגיעה לטבלת-ה-`sr-only`.
  with counted as (
    select a.hostess_id, count(*)::numeric shifts, (a.event_date > v_from) as is_cur
      from public.assignments a
     where a.assignment_status = 'finally_approved'
       and a.event_date > v_prev_from and a.event_date <= least(v_to, v_today)
     group by a.hostess_id, (a.event_date > v_from)
  ), ranked as (
    select is_cur, hostess_id, shifts,
           row_number() over (partition by is_cur order by shifts, hostess_id)      rn_asc,
           row_number() over (partition by is_cur order by shifts desc, hostess_id) rn_desc,
           sum(shifts)   over (partition by is_cur order by shifts, hostess_id
                               rows between unbounded preceding and current row)    cum,
           count(*)      over (partition by is_cur)                                 n,
           sum(shifts)   over (partition by is_cur)                                 total
      from counted
  ), agg as (
    select is_cur, max(n)::numeric n, max(total) total, sum(rn_asc * shifts) weighted,
           max(shifts) max_shifts, avg(shifts) avg_shifts,
           (percentile_cont(0.5) within group (order by shifts))::numeric med_shifts
      from ranked group by is_cur
  ), lorenz as (
    select jsonb_build_array(jsonb_build_object('x', 0, 'y', 0)) ||
           coalesce(jsonb_agg(jsonb_build_object(
             'x', round((rn_asc * 100.0) / nullif(n, 0), 4),
             'y', round((cum * 100.0) / nullif(total, 0), 4)) order by rn_asc), '[]'::jsonb) j
      from ranked where is_cur
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
         (select round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) from ranked r
           where r.is_cur and r.rn_desc <= ceil(r.n / 10.0)),
         (select n from agg where not is_cur)::integer,
         (select total from agg where not is_cur)::integer,
         (select case when n >= 2 and total > 0 then (2 * weighted) / (n * total) - (n + 1) / n end
            from agg where not is_cur),
         (select max_shifts from agg where is_cur)::integer,
         (select med_shifts from agg where is_cur),
         (select round(avg_shifts, 1) from agg where is_cur),
         (select j from lorenz),
         (select count(*) from public.hostesses)
    into v_n, v_shifts, v_gini, v_top_q_n, v_top_q_pct, v_bottom_pct, v_top_dec_pct,
         v_n_prev, v_shifts_prev, v_gini_prev,
         v_max_shifts, v_med_shifts, v_avg_shifts, v_lorenz, v_registered;

  -- ── אזור המהירות: זימונים שנשלחו, על פי תאריך-האירוע שבחלון.
  -- ‏🔴 **מי שלא ענתה כלל נספרת במכנה של אחוז-ההיענות** (§ח8-6 · ⑥), ואינה נכנסת לחישוב-הזמן.
  select count(*), count(*) filter (where a.responded_at is not null),
         (percentile_cont(0.5) within group (order by extract(epoch from (a.responded_at - a.invite_sent_at)) / 3600.0)
           filter (where a.responded_at is not null))::numeric,
         (percentile_cont(0.9) within group (order by extract(epoch from (a.responded_at - a.invite_sent_at)) / 3600.0)
           filter (where a.responded_at is not null))::numeric
    into v_invites, v_answered, v_med_hours, v_p90_hours
    from public.assignments a
   where a.invite_sent_at is not null and a.event_date > v_from and a.event_date <= v_to;

  select count(*), count(*) filter (where a.responded_at is not null),
         (percentile_cont(0.5) within group (order by extract(epoch from (a.responded_at - a.invite_sent_at)) / 3600.0)
           filter (where a.responded_at is not null))::numeric,
         (percentile_cont(0.9) within group (order by extract(epoch from (a.responded_at - a.invite_sent_at)) / 3600.0)
           filter (where a.responded_at is not null))::numeric
    into v_prev_inv, v_prev_ans, v_prev_med, v_prev_p90
    from public.assignments a
   where a.invite_sent_at is not null and a.event_date > v_prev_from and a.event_date <= v_prev_to;

  -- ── אימוץ ההמלצה: היעדר מוצהר. `v_rank_from` = המשמרת הראשונה שבה בכלל נרשם דרג.
  select count(*) filter (where a.recommended_rank is not null),
         count(*) filter (where a.recommended_rank = 1),
         min(a.event_date) filter (where a.recommended_rank is not null)
    into v_rank_total, v_rank_first, v_rank_from
    from public.assignments a
   where a.event_date > v_from and a.event_date <= v_to;

  if coalesce(v_rank_total, 0) = 0 then
    v_notes := v_notes || to_jsonb(
      'אימוץ המלצת Smart Match — אין עדיין נתון: המערכת התחילה לרשום את הדרג שהמליצה רק מעכשיו, ועד שייצברו שיבוצים המדד מציג "—" ולא 0%.'::text);
  end if;

  -- ── שתי הטבלאות: ההוגנות ב-`rows`, המהירות ב-`meta.extra_tables` (⑧17.1 · ⑧17.6).
  -- **שתיהן מוחזרות במלואן וממוינות** — המוקאפ מצייר 8 שורות כמוסכמת-ציור (‏`cards-finance.md` G3:
  -- *"8 שורות = מוסכמת-מוקאפ; בבנייה 50"*), והפאג'ר הוא שסופר את מה שהטבלה מציגה (📐8).
  -- 🔴 **סף-המדגם אינו נופל לברירת-מחדל:** בלי `מינימום_תשובות_להצגת_ציון` אין טבלת-מהירות
  --    כלל, והבאנר *"חסר פרמטר מערכת"* מסביר למה — `coalesce(…, 3)` היה ממציא סף בשקט.
  with cur as (
    select a.hostess_id, count(*)::numeric shifts
      from public.assignments a
     where a.assignment_status = 'finally_approved'
       and a.event_date > v_from and a.event_date <= least(v_to, v_today)
     group by a.hostess_id
  ),
  ranked as (
    select hostess_id, shifts,
           row_number() over (order by shifts desc, hostess_id) rn,
           -- ✒️ **"אחוז מצטבר" הוא עמודה במוקאפ המאושר** (‏`04_tab_hostesses_approved.html`
           --    §p4, הכותרת החמישית בטבלת-העמוסות), ושורת-ה-`tnote` שמתחתיה נשענת עליה
           --    במילים: *"שמונה הדיילות העמוסות ביותר מחזיקות יחד 19.5%"*. בלעדיה הטבלה
           --    אינה יכולה לומר את המשפט שהיא כתובה כדי לומר. מצטבר **מהעמוסה ומטה**.
           sum(shifts) over (order by shifts desc, hostess_id
                             rows between unbounded preceding and current row) cum
      from cur
  ), busiest as (
    select r.hostess_id, r.shifts, r.rn,
           round(100.0 * r.shifts / nullif(v_shifts, 0), 1) pct,
           round(100.0 * r.cum    / nullif(v_shifts, 0), 1) cum_pct
      from ranked r
  ), slowest as (
    select a.hostess_id, count(*) invites,
           count(*) filter (where a.responded_at is not null) answered,
           (percentile_cont(0.5) within group (order by extract(epoch from (a.responded_at - a.invite_sent_at)) / 3600.0)
             filter (where a.responded_at is not null))::numeric med_hours
      from public.assignments a
     where a.invite_sent_at is not null and a.event_date > v_from and a.event_date <= v_to
     group by a.hostess_id
    having count(*) >= v_min_sample
  ), fairness_rows as (
    select coalesce(jsonb_agg(jsonb_build_object(
             'drill_key', jsonb_build_object('kind', 'hostess', 'id', b.hostess_id),
             'hostess_name', h.full_name,
             'status', case when h.status = 'active' then 'פעילה' else 'לא פעילה' end,
             'shifts', b.shifts, 'share_pct', b.pct, 'cum_pct', b.cum_pct,
             'rank', b.rn) order by b.rn), '[]'::jsonb) j
      from busiest b join public.hostesses h on h.hostess_id = b.hostess_id
  ), speed_rows as (
    -- 🔴 **הסוגר שהפיל את הפונקציה כולה (נמדד 16/09/2026):** ‏`coalesce(` נפתח כאן ולא
    --    נסגר — הסגירה האחרונה הייתה של `jsonb_agg` ואחריה `j` — ולכן ה-CTE **בלע את כל
    --    ה-`return` שאחריו**, והקומפילציה מתה ב-`42601 unexpected end of function
    --    definition at end of input` **על הפונקציה כולה**. שגיאת-תו אחת מחקה משטח שלם,
    --    ו-32 בדיקות-היחידה נשארו ירוקות כי אינן נוגעות ב-SQL. התאום `fairness_rows`
    --    מעליה סוגר נכון; ההבדל הוא בדיוק `), '[]'::jsonb) j`.
    select coalesce(jsonb_agg(jsonb_build_object(
             'drill_key', jsonb_build_object('kind', 'hostess', 'id', s.hostess_id),
             'hostess_name', h.full_name,
             'status', case when h.status = 'active' then 'פעילה' else 'לא פעילה' end,
             'rating', h.rating, 'invites', s.invites, 'answered', s.answered,
             -- ✒️ שתי העמודות האלה מצוירות במוקאפ ("זומנה · ענתה · אחוז היענות") ולא היה
             --    להן בית במטען. ‏`הנחתי` — מדווח.
             'response_rate', round(100.0 * s.answered / nullif(s.invites, 0), 1),
             -- ‏`::numeric` לפני `round` — ל-`percentile_cont` **אין וריאנט numeric**,
             -- היא מחזירה `double precision`, ו-`round(double precision, int)` אינה קיימת
             -- ‏(‏`42883`). המשתנים למעלה ניצלו רק כי ההשמה לטיפוס-המשתנה ממירה בשקט.
             'median_response_hours', round(s.med_hours, 1))
             order by s.med_hours desc, h.full_name), '[]'::jsonb) j
      from slowest s join public.hostesses h on h.hostess_id = s.hostess_id
     where s.med_hours is not null
  )
  select f.j, s.j into v_rows, v_speed_rows from fairness_rows f, speed_rows s;

  -- ✒️ חציון-התגובה לפי דירוג — שורת-ה-`tnote` של טבלת-האיטיות נוקבת בו במילים
  --    (*"26.5 · 10.1 · 4.0 שעות"* לדירוגים 3/4/5, כרטיס ③ מ17), והוא הדפוס שמסביר
  --    למה כל השמונה האיטיות הן דירוג 3. מוחזר מוכן כדי שהלשונית לא תגזור אותו מחדש.
  select jsonb_object_agg(rating::text, med) filter (where rating is not null)
    into v_resp_rating
    from (
      select h.rating,
             round((percentile_cont(0.5) within group (
               order by extract(epoch from (a.responded_at - a.invite_sent_at)) / 3600.0))::numeric, 1) med
        from public.assignments a
        join public.hostesses h on h.hostess_id = a.hostess_id
       where a.invite_sent_at is not null and a.responded_at is not null
         and a.event_date > v_from and a.event_date <= v_to
       group by h.rating
    ) s;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', coalesce(v_n, 0),
      'label', 'אוכלוסייה: כל דיילת עם משמרת מאושרת אחת לפחות בחלון — n=' ||
               v_lri || coalesce(v_n, 0) || v_pdi || ' דיילות, ' ||
               v_lri || to_char(coalesce(v_shifts, 0), 'FM999,999') || v_pdi || ' משמרות · הוצאו: ' ||
               v_lri || coalesce(v_registered - coalesce(v_n, 0), 0) || v_pdi ||
               ' דיילות רשומות שלא עבדה אף משמרת בחלון (מי שאינה במשחק אינה יכולה להיות מקופחת בו) · אזור המהירות נמדד על אוכלוסייה אחרת: ' ||
               v_lri || to_char(coalesce(v_invites, 0), 'FM999,999') || v_pdi ||
               ' זימונים שנשלחו בחלון, ולא על דיילות — שני n נפרדים, מוצהרים בכל אזור.',
      'excluded', jsonb_build_object('לא עבדה בחלון', coalesce(v_registered - coalesce(v_n, 0), 0))),
    'window', jsonb_build_object('from', v_from, 'to', v_to, 'label', v_win_full),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'gini', 'label', 'ריכוזיות המשמרות', 'value', round(v_gini, 4), 'format', 'gini',
        -- תת-השורה מועתקת מהמוקאפ המאושר: המדד מוסבר בקצוות שלו, לא בסף שאין לו.
        'sub', 'מדד ג''יני · ' || v_lri || '0' || v_pdi || ' = חלוקה שווה בין הדיילות · ' ||
               v_lri || '1' || v_pdi || ' = דיילת אחת מקבלת הכול',
        'window', v_win_text,
        'compare', case when v_gini_prev is null then null else jsonb_build_object(
          'value', round(v_gini_prev, 4),
          'label', 'התקופה המקבילה אשתקד · n=' || v_lri || coalesce(v_n_prev, 0) || v_pdi ||
                   ' מול n=' || v_lri || coalesce(v_n, 0) || v_pdi || ' היום',
          'note', 'חלק מהשינוי הוא שינוי-אוכלוסייה ולא שינוי-התנהגות',
          'direction', case when v_gini > v_gini_prev then 'up' when v_gini < v_gini_prev then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'top_quarter', 'label', 'רבע הדיילות העמוסות', 'value', v_top_q_pct, 'format', 'percent',
        'sub', v_lri || coalesce(v_top_q_n, 0) || v_pdi || ' דיילות מתוך ' ||
               v_lri || coalesce(v_n, 0) || v_pdi || ' · מחצית המאגר מקבלת ' ||
               v_lri || coalesce(v_bottom_pct::text, '—') || '%' || v_pdi || ' · העשירון העליון ' ||
               v_lri || coalesce(v_top_dec_pct::text, '—') || '%' || v_pdi,
        'window', v_win_text,
        'compare', null, 'target', null),
      jsonb_build_object('key', 'rank1_adoption', 'label', 'אימוץ המלצת Smart Match',
        -- ‏`nullif` ולא הסתמכות על קיצור-ה-CASE: המכנה הוא **0 היום** בכל השורות
        -- (‏`recommended_rank` נולדה ריקה), וזו הזרוע היחידה בקובץ שחילקה בו.
        'value', case when coalesce(v_rank_total, 0) = 0 then null
                      else round(100.0 * v_rank_first / nullif(v_rank_total, 0), 1) end,
        'format', 'percent',
        'sub', 'דרג ' || v_lri || '1' || v_pdi || ' = הדיילת שהמערכת דירגה ראשונה · ' ||
               case when coalesce(v_rank_total, 0) = 0
                    then 'נמדד מ-— · אין עדיין נתון: המערכת התחילה לרשום את הדרג שהמליצה רק מעכשיו, ועד שייצברו שיבוצים המדד מציג "—" ולא ' ||
                         v_lri || '0%' || v_pdi
                    else 'נמדד מ-' || v_lri || to_char(v_rank_from, 'DD/MM/YYYY') || v_pdi || '; ' ||
                         v_lri || v_rank_total || v_pdi || ' שיבוצים' end,
        'window', case when coalesce(v_rank_total, 0) = 0 then 'טרם נמדד'
                       else 'נמדד מ-' || v_lri || to_char(v_rank_from, 'DD/MM/YYYY') || v_pdi end,
        'compare', null, 'target', null),
      jsonb_build_object('key', 'median_response', 'label', 'זמן-תגובה חציוני לזימון',
        'value', round(v_med_hours, 1), 'format', 'days',
        'sub', 'שעות, מרגע שליחת הזימון האחרון ועד שהדיילת ענתה · ' ||
               v_lri || to_char(coalesce(v_answered, 0), 'FM999,999') || v_pdi || ' תשובות',
        'window', v_win_text,
        'compare', case when v_prev_med is null then null else jsonb_build_object(
          'value', round(v_prev_med, 1), 'label', 'התקופה המקבילה אשתקד', 'note', null,
          'direction', case when v_med_hours > v_prev_med then 'up' when v_med_hours < v_prev_med then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'p90_response', 'label', 'זמן-תגובה, אחוזון 90',
        'value', round(v_p90_hours, 1), 'format', 'days',
        'sub', 'אחת מכל עשר תשובות מגיעה לאט מזה — שם יושב הכאב של איוש שנתקע, לא בחציון',
        'window', v_win_text,
        'compare', case when v_prev_p90 is null then null else jsonb_build_object(
          'value', round(v_prev_p90, 1), 'label', 'התקופה המקבילה אשתקד', 'note', null,
          'direction', case when v_p90_hours > v_prev_p90 then 'up' when v_p90_hours < v_prev_p90 then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'response_rate', 'label', 'אחוז היענות לזימון',
        'value', round(100.0 * v_answered / nullif(v_invites, 0), 1), 'format', 'percent',
        'sub', v_lri || to_char(coalesce(v_answered, 0), 'FM999,999') || v_pdi || ' ענו מתוך ' ||
               v_lri || to_char(coalesce(v_invites, 0), 'FM999,999') || v_pdi || ' שזומנו · ' ||
               v_lri || to_char(coalesce(v_invites, 0) - coalesce(v_answered, 0), 'FM999,999') || v_pdi ||
               ' לא ענו כלל — והן נספרות במכנה',
        'window', v_win_text,
        'compare', case when coalesce(v_prev_inv, 0) = 0 then null else jsonb_build_object(
          'value', round(100.0 * v_prev_ans / nullif(v_prev_inv, 0), 1), 'label', 'התקופה המקבילה אשתקד',
          'note', v_lri || to_char(coalesce(v_prev_ans, 0), 'FM999,999') || v_pdi || ' מתוך ' ||
                  v_lri || to_char(coalesce(v_prev_inv, 0), 'FM999,999') || v_pdi,
          'direction', case when v_answered * v_prev_inv > v_prev_ans * v_invites then 'up'
                            when v_answered * v_prev_inv < v_prev_ans * v_invites then 'down' else 'flat' end) end,
        'target', null)),
    'chart', jsonb_build_object(
      'type', 'lorenz', 'title', 'עקומת לורנץ · חלוקת המשמרות בין הדיילות',
      'series', jsonb_build_array(jsonb_build_object('key', 'y', 'label', 'אחוז-משמרות מצטבר')),
      'data', coalesce(v_lorenz, '[]'::jsonb), 'xKey', 'x',
      'domain', jsonb_build_array(0, 100),
      'refLines', jsonb_build_array(
        jsonb_build_object('axis', 'y', 'value', v_bottom_pct,
          'label', 'מחצית הדיילות = ' || v_lri || coalesce(v_bottom_pct::text, '—') || '%' || v_pdi || ' מהמשמרות')),
      'unit', 'percent'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'hostess_name', 'label', 'דיילת',        'format', 'text',    'align', 'start'),
      jsonb_build_object('key', 'status',       'label', 'סטטוס',        'format', 'text',    'align', 'start'),
      jsonb_build_object('key', 'shifts',       'label', 'משמרות',       'format', 'int',     'align', 'end'),
      jsonb_build_object('key', 'share_pct',    'label', 'חלק מהמשמרות', 'format', 'percent', 'align', 'end'),
      jsonb_build_object('key', 'cum_pct',      'label', 'אחוז מצטבר',   'format', 'percent', 'align', 'end')),
    'rows', coalesce(v_rows, '[]'::jsonb),
    'so_what', case
      when v_gini is null then 'אין מספיק דיילות שעבדו בחלון כדי למדוד ריכוזיות.'
      else 'לפתוח את מסך השיבוץ עם רבע הדיילות התחתון — ' || v_lri || coalesce(v_top_q_n, 0) || v_pdi ||
           ' דיילות מקבלות ' || v_lri || coalesce(v_top_q_pct::text, '—') || '%' || v_pdi ||
           ' מהמשמרות בעוד מחצית המאגר מקבלת ' || v_lri || coalesce(v_bottom_pct::text, '—') || '%' || v_pdi || '.' end,
    'definitions', 'הגדרות: מדד ג''יני = מדד ריכוזיות בין ' || v_lri || '0' || v_pdi || ' ל-' ||
      v_lri || '1' || v_pdi || ', כאן על מספר המשמרות לכל דיילת · ' ||
      'עקומת לורנץ = אותו נתון כגרף: לכל אחוז דיילות (מהפחות-עמוסה), כמה אחוז מהמשמרות הצטברו · ' ||
      'משמרת = שיבוץ שאושר סופית ושתאריך האירוע שלו כבר עבר · ' ||
      'זמן-תגובה = מרגע שליחת הזימון האחרון ועד שהדיילת ענתה, בשעות — לא מרגע פתיחת האירוע · ' ||
      'אחוזון ' || v_lri || '90' || v_pdi || ' = הערך שתשע מכל עשר תשובות מהירות ממנו · ' ||
      'אחוז היענות = ענו ÷ זומנו; מי שלא ענתה כלל נספרת במכנה.',
    -- 🔴 14א הוא דוח-**בקרה** ואינו אחד מארבעת דוחות-הקידוח של 📐13 (§9 D-14) ⇒
    --    `drill` **תמיד** `null`, ו-`p_drill` חוזר כהד בלבד ואינו משנה דבר.
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', to_jsonb(v_missing),
      'frozen_count', null,
      'notes', v_notes || to_jsonb(
        ('זמן-התגובה נמדד מאז הזימון האחרון ולא מהראשון — שליחה חוזרת דורסת את שעת הזימון, ולכן הזמן שרואים כאן קצר מהזמן שבאמת חיכית.')::text),
      'run', null,
      -- אזור-המהירות: טבלה שנייה על אוכלוסייה אחרת (זימונים, לא דיילות) ⇒ `extra_tables`.
      'extra_tables', jsonb_build_array(jsonb_build_object(
        'title', 'הדיילות שעונות הכי לאט',
        'columns', jsonb_build_array(
          jsonb_build_object('key', 'hostess_name',  'label', 'דיילת',       'format', 'text',    'align', 'start'),
          jsonb_build_object('key', 'status',        'label', 'סטטוס',       'format', 'text',    'align', 'start'),
          jsonb_build_object('key', 'rating',        'label', 'דירוג',       'format', 'int',     'align', 'end'),
          jsonb_build_object('key', 'invites',       'label', 'זומנה',       'format', 'int',     'align', 'end'),
          jsonb_build_object('key', 'answered',      'label', 'ענתה',        'format', 'int',     'align', 'end'),
          jsonb_build_object('key', 'response_rate', 'label', 'אחוז היענות', 'format', 'percent', 'align', 'end'),
          jsonb_build_object('key', 'median_response_hours', 'label', 'זמן-תגובה חציוני (שעות)',
                             'format', 'ratio', 'align', 'end')),
        'rows', coalesce(v_speed_rows, '[]'::jsonb),
        'sort', jsonb_build_object('key', 'median_response_hours', 'direction', 'descending'))),
      'shift_stats', jsonb_build_object('max', v_max_shifts, 'median', v_med_shifts, 'mean', v_avg_shifts),
      'top_decile_pct', v_top_dec_pct,
      'response_median_by_rating', coalesce(v_resp_rating, '{}'::jsonb),
      'previous', jsonb_build_object('n', v_n_prev, 'shifts', v_shifts_prev, 'gini', round(v_gini_prev, 4)),
      -- ‏📐9 · הקורא בפועל הוא `meta.sort` (‏`ReportSurface.jsx:253`) — ר' ההערה במ14.
      'sort', jsonb_build_object('key', 'shifts', 'direction', 'descending'),
      -- ‏C8: תכונה של המשטח, לא של הקריאה.
      'customer_filter_ignored', true,
      'drill_echo', p_drill));
end;
$function$;

comment on function public.report_m17_fairness(date, date, integer, jsonb) is
'מ11 · הוגנות השיבוץ (בקרה). שתי אוכלוסיות: ההוגנות נמדדת על כל דיילת עם משמרת מאושרת אחת לפחות בחלון (הוצאו הדיילות שלא עבדה אף משמרת בו), והמהירות על הזימונים שנשלחו בחלון — שני n נפרדים. ג''יני הוא גרסת-האוכלוסייה על ספירת המשמרות פר-דיילת, בחלון חצי-פתוח (from, to]. זמן-התגובה נמדד מאז הזימון האחרון, כי שליחה חוזרת דורסת את invite_sent_at (R2). אימוץ המלצת Smart Match מציג היעדר מוצהר ולא 0% כל עוד recommended_rank ריקה.';

revoke execute on function public.report_m17_fairness(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m17_fairness(date, date, integer, jsonb) to authenticated;



-- =============================================================================
-- ביטול (לא מורץ — כאן כדי שההפיכוּת תהיה כתובה ולא מסופרת):
--   ‏מ14/מ15/מ16 — `create or replace` חזרה לגוף של מיגרציה F.
--   drop function if exists public.report_m17_fairness(date, date, integer, jsonb);
-- =============================================================================
