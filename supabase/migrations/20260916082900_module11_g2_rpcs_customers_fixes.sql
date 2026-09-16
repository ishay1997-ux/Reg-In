-- =============================================================================
-- מודול 11 · מיגרציה G2 · תיקון-קדימה לארבע פונקציות-השרת של לשונית "לקוחות"
-- =============================================================================
-- 🎯 **מה זה:** תיקון-קדימה לשבעת הממצאים של סבב-האימות היריב על מיגרציה G
--    (`20260916052511_module11_g_rpcs_customers.sql`). **הקובץ ההוא אינו נערך** — הוא הוחל,
--    ומיגרציה שהוחלה מתוקנת אך ורק במיגרציה חדשה קדימה (`supabase/migrations/CLAUDE.md §2`).
--    **אין טבלה חדשה, אין עמודה חדשה, אין policy חדשה, אין שינוי-חתימה, ואין ולו כתיבה אחת.**
--    ארבע הפונקציות נבנות מחדש מהגוף החי: ‏`md5(prosrc)` נמשך מ-`pg_proc` והושווה לגוף שבקובץ G
--    **לפני** שנכתבה שורה — ‏`a6cf969f…` · `de8cc842…` · `2124220a…` · `064ba91c…`, ארבעה מתוך
--    ארבעה זהים. כל שינוי כאן הוא **תוספתי** (מפתח חדש · ערך מתוקן · תווית מתוקנת), ואף מפתח
--    ואף מפתח-אריח לא שונה שם ולא נמחק — בונה-הלשונית עובד במקביל מול המטענים החיים.
--
-- 🧭 **שבעת התיקונים (G2-1…G2-7), כל אחד עם ה-why שלו בגוף:**
--    G2-1 · 🔴 **החוסם.** ‏`report_m22_notes` קרא **ריצה מאושרת אחת** (`order by approved_at
--           desc limit 1`). **נמדד חי 16/09/2026:** שתי ריצות מאושרות — ‏5 (`partial`, 40 שורות,
--           ‏`gemini-3.8-flash`) ו-6 (`done`, 386, `gemini-3.5-flash-lite`) — **זרות זו לזו,
--           ויחד בדיוק 426 הפרויקטים** ו-25 הדגלים האדומים. ⇒ הדף הציג **386 שורות ו-24 דגלים**
--           בעוד שורת-האוכלוסייה שלו עצמו הכריזה **426**, **ואיש לא היה יודע ש-40 חסרות.**
--           הכרטיס ⑥ נוקב ב*"הדוח מציג רק ריצות מאושרות"* — **רבים**. ⇒ איחוד כל הריצות
--           המאושרות דרך CTE ‏`pick`, **שורה אחת לכל פרויקט** (המאושרת האחרונה גוברת).
--    G2-2 · `meta.export_blocked_reason` **נעדר** בארבעתן. ‏§2ב C8 נוקב בדוח 22 בשמו ובנוסח
--           המדויק, ו-`ReportSurface` מעביר את המפתח ל-`ExportBar`. ⇒ המפתח נוכח בארבעתן
--           (‏`null` היכן שמותר לייצא), ובמ22 ללא ריצה מאושרת הוא נושא את `EXPORT_NO_APPROVED_RUN`
--           של `src/lib/reportsExport.js`, **מילה במילה**.
--    G2-3 · `drill_key` חזר **סקלר**. **נמדד על `pg_proc`:** שתים-עשרה פונקציות-הדוח האחרות
--           מחזירות `{kind, id}` (‏`project` · `quote` · `year` · `sku` · `hostess`), וזו הלשונית
--           **היחידה** שחרגה. ⇒ `{kind:'customer'|'project', id}`.
--    G2-4 · ₪ עם מפרידי-אלפים בתוך משפט עברי **בלי בידוד-כיווניות** — ‏`2,786,544 ₪` ·
--           ‏`161,009 ₪` · `122,124 ₪` (שלושה משפטי-שרת במ21). זהו בדיוק ממצא F5 של E2. ⇒ כל
--           רצף-ספרות בכל משפט-שרת בארבעת המשטחים עטוף `chr(8294)`…`chr(8297)`, ו-`format()`
--           הוחלף בשרשור כדי שהעטיפה תהיה גלויה בקוד.
--    G2-5 · 🔴 **מדידה נכונה על האוכלוסייה הלא-נכונה.** שורת-האוכלוסייה של מ19 אמרה
--           *"n=163 משובים מתוך 217 שנשלחו, **אצל 61 לקוחות**"* — ו-61 הוא `count(*)` על
--           **כל** טבלת הלקוחות, לא הלקוחות שמאחורי 163 המשובים. **נמדד: 42** (‏47 קיבלו טופס).
--           תחת מסנן-לקוח היא אף הדפיסה *"אצל 1 לקוחות"*. ⇒ המונה הוא `count(distinct
--           customer_id)` על האוכלוסייה עצמה, מספר-המערכת נאמר בסוגריים, וצורת-היחיד תוקנה.
--    G2-6 · `columns[].sorted` **נעדר** בארבעתן ⇒ אין `aria-sort` על המסך כלל (📐9), אף
--           ש-`ReportSurface` גוזר אותו **אך ורק** מהמפתח הזה ושכרטיס מ19 ⑩ג נוקב ב-
--           ‏`aria-sort="descending"` על עמודת-ההכנסה כתוכן-רמה-0. ⇒ עמודת-המיון מסומנת בכל דף.
--    G2-7 · מ22 הכריז *"אריחי המצאי … אינם מושפעים ממסנן הלקוח"* — **והוא שקר על אריח אחד
--           מארבעה**: "דגלים אדומים" **כן** מסונן (נמדד: 24 ⇐ 5 עם `p_customer_id=401`). ⇒
--           המשפט נוקב בשלושה, ו-`meta.customer_filter_ignored` מונה אותם בכל ארבעת המשטחים.
--           בנוסף נוסף `meta.drill_echo` (הד-`p_drill`, `null` בארבעתן) ו-`label_source`
--           ל-`customers.customer_type` — ‏C8: *"A legend showing `private_company` is the
--           failure this line prevents"*.
--
-- 🚫 **מה לא תוקן, ומדווח כשתי סתירות-מקורות ולא כמספר ש"תוקן" (C7 · כלל-ברזל 1):**
--    ① **תווית האריח** `הכנסת 12 החודשים של הלקוחות המסומנים`: ‏`spec.md §1.4` כותב את הצורה
--       הקצרה, ואילו **§🔒 (מילון-נעול) והמוקאפ המאושר** (`05_tab_customers_approved.html:1192`)
--       כותבים את הארוכה — ‏§1.4 חולץ מכנית ונקטע על `<span class="ltr">12</span>` בתוך התווית.
--       המטען נושא את הצורה הנעולה (C8: *"the RPC copies them from the approved mockup where
--       §1.4 and the mockup differ"*). **תיאום-מסמכים לפזה 4, מאותו סוג בדיוק כמו D-19.**
--    ② **סדר-העיגול** באריח "נתפסים רק בקצב האישי": סכימה-ואז-עיגול מחזירה `186,940 ₪`,
--       והמוקאפ כותב `186,939 ₪` (עיגול-פר-שורה-ואז-סכימה). זהו **פריט D-15 בדיוק** — ההגדרה
--       עצמה אינה אומרת מי משתיהן. לא נבחר צד.
--    ③ ‏`⑧19.1 · ⑧19.2 · ⑧19.3–19.6 · ⑧21.4 · ⑧22.3 · ⑧22.5 · ⑧22.7` נשארו 🔵 פתוחים להכרעת-ישי.
--
-- 🔻 **אימות אחרי ההחלה** (קריאה-בלבד + קריאות מזוהות, positive control קודם) — ר' הדיווח:
--   -- (א) מ22 ⇒ `rows` 426 · דגלים 25 · `classified` 426 · `meta.run.models` שני מודלים.
--   -- (ב) מ19/מ20/מ21 ⇒ כל מספרי קו-הבסיס של 10/09 שוחזרו ספרה-בספרה מול המטען שלפני התיקון.
--   -- (ג) `md5(prosrc)` = md5 של גוף ה-`$function$` בקובץ הזה, ארבעה מתוך ארבעה.
--   -- (ד) מנהלת-גיוס ומנהלת-לוגיסטיקה ⇒ `42501` בארבעתן, ולא jsonb ריק.
-- =============================================================================


create or replace function public.report_m19_customers_overview(
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
  -- שעון-ישראל ולא `current_date` (UTC): אחרי חצות ה-UTC עדיין "אתמול" — המוקש שנמדד
  -- בסיד של מודול 5 ב-26/08/2026 וחוזר בכל RPC של המודול.
  v_today      date := (now() at time zone 'Asia/Jerusalem')::date;
  -- why (G2-בידוד): בידוד-כיווניות לכל רצף-ספרות בתוך משפט עברי — התאום של `isolateLtr`
  -- (`src/lib/reportsFormat.js`) ושל `v_lri`/`v_pdi` במיגרציות E2/F2. **נמדד 16/09/2026:**
  -- ‏"2,786,544 ₪" חזר מהשרת בתוך משפט עברי בלי בידוד, וזה בדיוק המקרה ש-F5 של E2 תיקן.
  v_lri        constant text := chr(8294);   -- U+2066 LRI
  v_pdi        constant text := chr(8297);   -- U+2069 PDI
  v_to         date;
  v_from       date;
  v_y_from     date;
  v_mult       numeric;
  v_min_n      numeric;
  v_missing    text[] := array[]::text[];
  v_notes      jsonb  := '[]'::jsonb;
  v_buckets    jsonb;
  v_below      integer;
  v_in_buckets integer;
  v_other      integer;
  v_neg_total  integer;
  v_other_year jsonb;
  v_conc       jsonb;
  v_pay        jsonb;
  v_pay_top    numeric;
  v_pay_n      integer;
  v_chart      jsonb;
  v_ref_avg    numeric;
  v_ref_n      integer;
  v_rows       jsonb;
  v_pop_n      integer;
  v_pop_sent   integer;
  v_pop_cust   integer;
  v_cust_all   integer;
  v_pop_no     integer;
  v_sat_med    numeric;
  v_mid_med    numeric;
  v_uns_med    numeric;
  v_sat_cnt    integer;
  v_uns_cnt    integer;
begin
  -- השער, ראשון ולפני כל קריאה למסד (C5 · ת8 · הכרעה 2).
  perform public.assert_module_permission('לקוחות', array['edit', 'view']);

  v_to   := coalesce(p_to, v_today);
  -- ברירת-המחדל היא **השנה הקלנדרית** — `processes-approved.md` §536 (סטייה מוצהרת
  -- מ-§7.98: דוח הוא השוואה תקופתית ולא רשימת-עבודה, §7.95).
  v_from := coalesce(p_from, date_trunc('year', v_to)::date);
  -- חלון 12 החודשים של הכסף מעוגן ל"היום" ולא למסנן — הוא מדד-מלאי, לא מדד-תקופה.
  v_y_from := (v_today - interval '12 months')::date;

  -- ── פרמטרים בזמן-ריצה; שורה חסרה נאמרת ואינה הופכת לברירת-מחדל ──────────────
  select case when pa.param_value ~ '^\s*-?\d+(\.\d+)?\s*$' then btrim(pa.param_value)::numeric end
    into v_mult from public.params pa where pa.param_name = 'מכפיל_מרווח_מתרחק';
  if v_mult is null then v_missing := v_missing || 'מכפיל_מרווח_מתרחק'; end if;

  select case when pa.param_value ~ '^\s*-?\d+(\.\d+)?\s*$' then btrim(pa.param_value)::numeric end
    into v_min_n from public.params pa where pa.param_name = 'מינימום_תשובות_להצגת_ציון';
  if v_min_n is null then v_missing := v_missing || 'מינימום_תשובות_להצגת_ציון'; end if;

  -- ── שורת-האוכלוסייה (📐2) — המספרים של התקופה הנבחרת ────────────────────────
  select count(*) filter (where p.feedback_status = 'completed'),
         count(*) filter (where p.feedback_status in ('completed', 'no_response')),
         count(*) filter (where p.feedback_status = 'no_response')
    into v_pop_n, v_pop_sent, v_pop_no
    from public.projects p
   where p.final_event_date between v_from and v_to
     and (p_customer_id is null or p.customer_id = p_customer_id);

  -- 🔴 **תיקון G2-5 — אוכלוסייה שנמדדה נכון על העולם הלא-נכון.** הספירה כאן הייתה
  -- ‏`count(*) from customers` = **כל** הלקוחות במערכת (61), בתוך משפט שכל שאר מספריו
  -- הם משובי-התקופה ⇒ *"n=163 משובים מתוך 217 שנשלחו, אצל 61 לקוחות"* נקרא כאילו 163
  -- המשובים באו מ-61 לקוחות. **נמדד 16/09/2026: 42 לקוחות עומדים מאחורי 163 המשובים**
  -- (‏47 קיבלו טופס). ⇒ המונה הוא לקוחות-האוכלוסייה, ומספר-המערכת נאמר בנפרד וכהקשר.
  select count(distinct p.customer_id)::integer into v_pop_cust
    from public.projects p
   where p.final_event_date between v_from and v_to
     and p.feedback_status = 'completed'
     and p.customer_id is not null
     and (p_customer_id is null or p.customer_id = p_customer_id);

  select count(*)::integer into v_cust_all from public.customers c
   where (p_customer_id is null or c.customer_id = p_customer_id);

  -- ── אריח ① · חתך-הלקוחות: 4.5+ · 3.5–4.4 · מתחת ל-3.5, על ≥ סף-המדגם (📐12) ──
  -- 🔴 **"לקוחות מרוצים" ואינו "שיעור המרוצים"** (הכרעת-ישי 10/09/2026): כאן המונה הוא
  -- **לקוחות** שממוצעם 4.5+, שם הוא **משובים** בציון 4–5. שני שמות, שתי הגדרות.
  -- החלון הוא **כל הזמנים** ואינו מגיב למסנן — משוב אחד לחודש הוא מדגם קטן מדי לכיוון.
  with fb as (
    select p.customer_id,
           avg(p.feedback_score)::numeric as avg_score,
           count(*)::integer              as n
      from public.projects p
     where p.feedback_status = 'completed'
       and p.feedback_score is not null
       and p.customer_id is not null
     group by p.customer_id
  ), last_held as (
    select p.customer_id, max(p.final_event_date) as last_event
      from public.projects p
     where p.project_status <> 'cancelled'
       and p.customer_id is not null
       and p.final_event_date < v_today
     group by p.customer_id
  ), bucketed as (
    select case when f.avg_score >= 4.5 then 'satisfied'
                when f.avg_score >= 3.5 then 'middle'
                else 'unsatisfied' end                as bucket,
           (v_today - lh.last_event)::numeric         as days_since
      from fb f
      left join last_held lh on lh.customer_id = f.customer_id
     where f.n >= v_min_n
  )
  select coalesce(jsonb_object_agg(b.bucket, jsonb_build_object(
           'customers', b.customers, 'median_days', b.median_days)), '{}'::jsonb),
         coalesce(sum(b.customers)::integer, 0)
    into v_buckets, v_in_buckets
    -- 🔴 **`::numeric` לפני `round`, וזו מלכודת שקטה שנמדדה 16/09/2026:**
    -- ‏`percentile_cont` מחזירה **`double precision`**, ו-`round(double precision)` היא
    -- עיגול-בנקאים (חצי-לזוגי) ⇒ `round(14.5)` = **14**. חציון-המרוצים הוא בדיוק 14.5,
    -- והמסך המאושר אומר **15**. בלי ההמרה הדוח היה מציג 14 בלי שום שגיאה.
    from (select bucket,
                 count(*)::integer as customers,
                 round((percentile_cont(0.5) within group (order by days_since))::numeric)::integer as median_days
            from bucketed group by bucket) b;

  -- מונה-החוץ הגלוי (📐12): מי שיש לו משוב אך פחות מהסף — **לא** נעלם בשקט.
  select count(*)::integer into v_below
    from (select p.customer_id, count(*) n
            from public.projects p
           where p.feedback_status = 'completed' and p.feedback_score is not null
             and p.customer_id is not null
           group by p.customer_id) t
   where t.n < v_min_n;

  v_sat_med := (v_buckets #>> '{satisfied,median_days}')::numeric;
  v_mid_med := (v_buckets #>> '{middle,median_days}')::numeric;
  v_uns_med := (v_buckets #>> '{unsatisfied,median_days}')::numeric;
  v_sat_cnt := (v_buckets #>> '{satisfied,customers}')::integer;
  v_uns_cnt := (v_buckets #>> '{unsatisfied,customers}')::integer;

  -- ── אריח ② · "אחר" מול ארבע הקטגוריות, כל הזמנים (📐11 — מערך, לא ערך יחיד) ──
  select count(*) filter (where r.reason = 'אחר'), count(*)
    into v_other, v_neg_total
    from public.projects p
    cross join lateral unnest(p.negative_feedback_reasons) as r(reason)
   where p.feedback_status = 'completed';

  select coalesce(jsonb_object_agg(t.y::text, t.c), '{}'::jsonb) into v_other_year
    from (select extract(year from p.final_event_date)::integer as y, count(*)::integer as c
            from public.projects p
           where p.feedback_status = 'completed'
             and 'אחר' = any (p.negative_feedback_reasons)
             and p.final_event_date <= v_today
           group by 1) t;

  -- ── אריח ③ · ריכוזיות מול נטישה (הכרעה 24·ח7 · 🔒) ──────────────────────────
  -- 🔴 **ההגדרה שמופיעה כאן פעם שנייה — §🧾ח7, ומקורה שם ולא כאן.** שינוי בה חייב
  -- לגעת גם ב-`report_m21_drifting` למטה. **אין אירוע עתידי · וגם ימים-מאז > מכפיל ×
  -- חציון-המרווח האישי · ≥ 3 אירועים שהתקיימו.** אירועים מבוטלים אינם נספרים.
  -- ⚠️ `nullif(median_gap, 0)` — חציון 0 (שני אירועים באותו יום) היה הופך את התנאי
  -- ל-`days > 0` ומסמן כמעט כל לקוח; הכרטיס ⑦ קובע "היחס '—', והלקוח נשפט ברדום בלבד".
  with held as (
    select p.customer_id, p.final_event_date
      from public.projects p
     where p.project_status <> 'cancelled'
       and p.customer_id is not null
       and p.final_event_date < v_today
  ), gaps as (
    select h.customer_id,
           h.final_event_date - lag(h.final_event_date) over (
             partition by h.customer_id order by h.final_event_date) as gap_days
      from held h
  ), per_cust as (
    select h.customer_id, count(*)::integer as held_count, max(h.final_event_date) as last_event
      from held h group by h.customer_id
  ), med as (
    select g.customer_id,
           (percentile_cont(0.5) within group (order by g.gap_days))::numeric as median_gap
      from gaps g where g.gap_days is not null group by g.customer_id
  ), fut as (
    select distinct p.customer_id
      from public.projects p
     where p.project_status <> 'cancelled'
       and p.customer_id is not null
       and p.final_event_date >= v_today
  ), drift as (
    select pc.customer_id,
           (v_today - pc.last_event)::numeric as days_since,
           m.median_gap
      from per_cust pc
      join med m on m.customer_id = pc.customer_id
      left join fut f on f.customer_id = pc.customer_id
     where pc.held_count >= 3
       and f.customer_id is null
       and v_mult is not null
       and (v_today - pc.last_event)::numeric > v_mult * nullif(m.median_gap, 0)
  ), rev as (
    -- אוכלוסיית-הכסף של הכרעה 36 — ארבעת הסטטוסים, לא `finished` לבדו.
    select p.customer_id, sum(fm.revenue) as revenue
      from public.projects p
      cross join lateral public.finance_project_money(p.project_id) fm
     where p.project_status in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')
       and p.customer_id is not null
       and p.final_event_date >= v_y_from
       and p.final_event_date <= v_today
     group by p.customer_id
  ), ranked as (
    select r.customer_id, r.revenue,
           row_number() over (order by r.revenue desc, r.customer_id) as rnk
      from rev r
  )
  select jsonb_build_object(
           'top5_drifting',   (select count(*)::integer from ranked k join drift d on d.customer_id = k.customer_id where k.rnk <= 5),
           'top5_revenue',    (select sum(k.revenue) from ranked k where k.rnk <= 5),
           'total_revenue',   (select sum(r.revenue) from rev r),
           'producing_count', (select count(*)::integer from rev r where r.revenue > 0),
           'drifting_count',  (select count(*)::integer from drift),
           'first_drifting',  (select jsonb_build_object(
                                 'customer_id', k.customer_id,
                                 'company_name', c.company_name,
                                 'rank', k.rnk,
                                 'revenue', k.revenue,
                                 'days_since', d.days_since,
                                 'cadence', d.median_gap)
                                 from ranked k
                                 join drift d on d.customer_id = k.customer_id
                                 join public.customers c on c.customer_id = k.customer_id
                                order by k.rnk limit 1)
         )
    into v_conc;

  -- ── אריח ④ · חציון ימים מחשבונית לתשלום, לפי סוג-לקוח (כל הזמנים) ───────────
  -- 🔑 **המפתח חוזר, לא התווית** — `CUSTOMER_TYPE_LABELS` הוא SSOT של `src/lib/customers.js`,
  -- ומחרוזת-עברית שנכתבת גם כאן הייתה נפרדת ממנו ביום שהמילון ישתנה (כלל 14).
  -- `invoice_sent_at` הוא `timestamptz` ⇒ מומר לשעון-ישראל לפני שנגזר ממנו יום.
  select coalesce(jsonb_agg(t.row order by t.median_days desc, t.customer_type), '[]'::jsonb),
         max(t.median_days), sum(t.invoice_count)::integer
    into v_pay, v_pay_top, v_pay_n
    from (select g.customer_type, g.invoice_count, g.median_days,
                 jsonb_build_object(
                   'customer_type',  g.customer_type,
                   'median_days',    g.median_days,
                   'invoice_count',  g.invoice_count,
                   'customer_count', g.customer_count) as row
            from (select c.customer_type,
                         count(*)::integer                      as invoice_count,
                         count(distinct c.customer_id)::integer as customer_count,
                         -- אותו `::numeric` לפני `round` — ר' ההערה באריח ①.
                         round((percentile_cont(0.5) within group (
                           order by (p.payment_date - (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date)::numeric
                         ))::numeric) as median_days
                    from public.projects p
                    join public.customers c on c.customer_id = p.customer_id
                   where p.payment_date is not null and p.invoice_sent_at is not null
                   group by c.customer_type) g) t;

  -- ── הגרף · ממוצע לפי חודש בתקופה, `domain` נעול 1–5 (📐6) ────────────────────
  -- ⚠️ **חודש בלי משובים אינו נקודה בגובה אפס** — הוא נעדר, וההיעדר כתוב בכיתוב-הגרף.
  select coalesce(jsonb_agg(jsonb_build_object(
           'month', t.ym, 'avg_score', t.avg_score, 'n', t.n) order by t.ym), '[]'::jsonb)
    into v_chart
    from (select to_char(date_trunc('month', p.final_event_date), 'YYYY-MM') as ym,
                 round(avg(p.feedback_score)::numeric, 2)                    as avg_score,
                 count(*)::integer                                           as n
            from public.projects p
           where p.feedback_status = 'completed' and p.feedback_score is not null
             and p.final_event_date between v_from and v_to
             and (p_customer_id is null or p.customer_id = p_customer_id)
           group by 1) t;

  -- קו-הייחוס (📐15) — הערך **המדוד** של השנה הקודמת המלאה, לא סף מומצא.
  select round(avg(p.feedback_score)::numeric, 2), count(*)::integer
    into v_ref_avg, v_ref_n
    from public.projects p
   where p.feedback_status = 'completed' and p.feedback_score is not null
     and p.final_event_date >= (date_trunc('year', v_to) - interval '1 year')::date
     and p.final_event_date <  date_trunc('year', v_to)::date
     and (p_customer_id is null or p.customer_id = p_customer_id);

  -- ── הטבלה · 8 הלקוחות הגדולים ב-12 החודשים (📐7 — מיון לפי המדד המוצג) ───────
  with rev as (
    select p.customer_id, sum(fm.revenue) as revenue
      from public.projects p
      cross join lateral public.finance_project_money(p.project_id) fm
     where p.project_status in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')
       and p.customer_id is not null
       and p.final_event_date >= v_y_from
       and p.final_event_date <= v_today
     group by p.customer_id
  ), fb as (
    select p.customer_id, round(avg(p.feedback_score)::numeric, 2) as avg_score, count(*)::integer as n
      from public.projects p
     where p.feedback_status = 'completed' and p.feedback_score is not null and p.customer_id is not null
     group by p.customer_id
  ), last_held as (
    select p.customer_id, max(p.final_event_date) as last_event
      from public.projects p
     where p.project_status <> 'cancelled' and p.customer_id is not null and p.final_event_date < v_today
     group by p.customer_id
  ), next_event as (
    select p.customer_id, min(p.final_event_date) as next_event
      from public.projects p
     where p.project_status <> 'cancelled' and p.customer_id is not null and p.final_event_date >= v_today
     group by p.customer_id
  )
  select coalesce(jsonb_agg(t.row order by t.revenue desc, t.customer_id), '[]'::jsonb) into v_rows
    from (select r.customer_id, r.revenue,
                 jsonb_build_object(
                   -- C8: `drill_key` אחיד `{kind, …}` בכל הלשוניות; שתים-עשרה הפונקציות
                   -- האחרות כבר מחזירות אובייקט, וזו הייתה היחידה שהחזירה סקלר.
                   'drill_key',     jsonb_build_object('kind', 'customer', 'id', r.customer_id),
                   'customer_id',   r.customer_id,
                   'company_name',  c.company_name,
                   'customer_type', c.customer_type,
                   'revenue_12m',   r.revenue,
                   'avg_feedback',  f.avg_score,
                   'feedback_n',    coalesce(f.n, 0),
                   'last_event',    lh.last_event,
                   'next_event',    ne.next_event) as row
            from rev r
            join public.customers c on c.customer_id = r.customer_id
            left join fb f on f.customer_id = r.customer_id
            left join last_held lh on lh.customer_id = r.customer_id
            left join next_event ne on ne.customer_id = r.customer_id
           where (p_customer_id is null or r.customer_id = p_customer_id)
           order by r.revenue desc, r.customer_id
           limit 8) t;

  -- ── מה שהמסך חייב לומר על עצמו (📐3 · 📐11 · 22.5) ──────────────────────────
  v_notes := v_notes
    || to_jsonb('ארבעת האריחים נמדדים על כל הזמנים ואינם מושפעים ממסנן התקופה; הגרף והטבלה כן.'::text)
    || to_jsonb('ארבעת האריחים הם חתכים בין-לקוחיים ואינם מושפעים ממסנן הלקוח.'::text);
  if p_drill is not null then
    v_notes := v_notes || to_jsonb('הדף אינו דוח-קידוח (📐13) — פרמטר הקידוח לא הופעל.'::text);
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_pop_n,
      'label', 'אוכלוסייה: משובים שהלקוח מילא · הוצאו: משובים שנשלחו ולא נענו ('
               || v_lri || to_char(v_pop_no, 'FM999,999,999') || v_pdi || ') ומשובים שלא נשלחו · '
               || v_lri || 'n=' || to_char(v_pop_n, 'FM999,999,999') || v_pdi || ' משובים מתוך '
               || v_lri || to_char(v_pop_sent, 'FM999,999,999') || v_pdi || ' שנשלחו, אצל '
               || case when v_pop_cust = 1 then 'לקוח אחד'
                       else v_lri || to_char(v_pop_cust, 'FM999,999,999') || v_pdi || ' לקוחות' end
               || ' (מתוך ' || v_lri || to_char(v_cust_all, 'FM999,999,999') || v_pdi || ' במערכת).',
      'excluded', jsonb_build_object(
        'נשלח ולא נענה', v_pop_no,
        'מתחת לסף המדגם (לקוחות)', v_below)),
    'window', jsonb_build_object(
      'from', v_from, 'to', v_to,
      'label', v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi
               || ' · ' || case when p_customer_id is null then 'כל הלקוחות' else 'לקוח נבחר' end),
    'tiles', jsonb_build_array(
      jsonb_build_object(
        'key', 'satisfaction_vs_return',
        'label', 'שביעות-רצון מנבאת חזרה',
        'value', v_sat_med,
        'format', 'days',
        'sub', 'חציון ימים מאז האירוע האחרון: לקוחות מרוצים (ממוצע 4.5+) מול לקוחות לא-מרוצים (ממוצע מתחת ל-3.5)',
        'detail', jsonb_build_object('buckets', v_buckets, 'in_buckets', v_in_buckets, 'below_min_sample', v_below),
        'window', 'כל הזמנים · ' || v_lri || to_char(v_in_buckets, 'FM999,999,999') || v_pdi || ' לקוחות עם '
                  || v_lri || coalesce(v_min_n::text, '—') || '+' || v_pdi
                  || ' משובים · אינו מושפע ממסנן התקופה',
        'compare', case when v_uns_med is null then null else jsonb_build_object(
          'value', v_uns_med,
          'label', 'לקוחות לא-מרוצים · הבינוניים באמצע: '
                   || v_lri || coalesce(v_mid_med::text, '—') || v_pdi || ' ימים',
          'direction', 'flat') end,
        'target', jsonb_build_object('tab', 'לקוחות', 'report', 'שביעות רצון', 'drill', null)),
      jsonb_build_object(
        'key', 'biggest_negative_is_other',
        'label', 'הסיבה השלילית הגדולה אינה קטגוריה',
        'value', v_other,
        'format', 'int',
        'sub', 'משובים שליליים שתויגו "אחר" מתוך ' || v_lri || to_char(v_neg_total, 'FM999,999,999') || v_pdi
               || ' — הדלי הגדול מכל ארבע הקטגוריות',
        'detail', jsonb_build_object('other', v_other, 'negative_total', v_neg_total, 'by_year', v_other_year),
        'window', 'כל הזמנים · לכל ' || v_lri || to_char(v_other, 'FM999,999,999') || v_pdi
                  || ' יש הערה חופשית · אינו מושפע ממסנן התקופה',
        'compare', jsonb_build_object('value', v_other, 'label', 'פילוח לפי שנה', 'direction', 'up'),
        'target', jsonb_build_object('tab', 'לקוחות', 'report', 'ניתוח הערות', 'drill', null)),
      jsonb_build_object(
        'key', 'concentration_vs_drifting',
        'label', 'הריכוזיות והנטישה עוד לא נפגשות',
        'value', (v_conc ->> 'top5_drifting')::integer,
        'format', 'int',
        'sub', v_lri || to_char((v_conc ->> 'top5_drifting')::integer, 'FM999,999,999') || v_pdi
               || ' מחמשת הלקוחות הגדולים — יחד '
               || v_lri || coalesce(to_char(round(100 * (v_conc ->> 'top5_revenue')::numeric
                          / nullif((v_conc ->> 'total_revenue')::numeric, 0), 1), 'FM999990.0'), '—')
               || '%' || v_pdi || ' מהכנסת ' || v_lri || '12' || v_pdi
               || ' החודשים — מסומנים "מתרחק"',
        'detail', v_conc,
        'window', v_lri || '12' || v_pdi || ' החודשים האחרונים ('
                  || v_lri || to_char(v_y_from, 'DD/MM/YYYY') || '–' || to_char(v_today, 'DD/MM/YYYY') || v_pdi
                  || ') · הדגל נכון ל-' || v_lri || to_char(v_today, 'DD/MM') || v_pdi
                  || ' · אינו מושפע ממסנן התקופה',
        'compare', case when v_conc -> 'first_drifting' is null then null else jsonb_build_object(
          'value', (v_conc #>> '{first_drifting,rank}')::integer,
          'label', 'הגדול הראשון שכן: ' || (v_conc #>> '{first_drifting,company_name}')
                   || ', מקום ' || v_lri || (v_conc #>> '{first_drifting,rank}') || v_pdi
                   || ' ברשימת המניבים — שקטה ' || v_lri || (v_conc #>> '{first_drifting,days_since}') || v_pdi
                   || ' ימים מול קצב של ' || v_lri || (v_conc #>> '{first_drifting,cadence}') || v_pdi,
          'direction', 'flat') end,
        'target', jsonb_build_object('tab', 'לקוחות', 'report', 'לקוחות מתרחקים', 'drill', null)),
      jsonb_build_object(
        'key', 'payment_cadence_by_type',
        'label', 'קצב-התשלום תלוי בסוג הלקוח',
        'value', v_pay_top,
        'format', 'days',
        'sub', 'חציון ימים מחשבונית לתשלום, לפי סוג הלקוח',
        -- C8: *"A legend showing `private_company` is the failure this line prevents"* —
        -- המפתח חוזר גולמי, ושם-הקבוע העברי נאמר כאן כדי שהלשונית תמפה דרכו.
        'detail', jsonb_build_object('rows', v_pay, 'label_source', 'CUSTOMER_TYPE_LABELS'),
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה',
        'compare', jsonb_build_object(
          'value', v_pay_n,
          'label', 'על ' || v_lri || to_char(v_pay_n, 'FM999,999') || v_pdi || ' חשבוניות ששולמו',
          'direction', 'flat'),
        -- הכרעה 33 — דלת חוצת-לשונית. ⚠️ ⑧19.2 עדיין 🔵 פתוח: למי שממוסכת על 'כספים'
        -- ההמלצה בכרטיס היא להסתיר את שורת-היעד ולהשאיר את הנתון. **ההכרעה של ישי**,
        -- והמיסוך הוא של הלשונית — ה-RPC מחזיר את היעד ואינו מחליט עליו.
        'target', jsonb_build_object('tab', 'כספים', 'report', 'גיול חובות', 'drill', null))),
    'chart', jsonb_build_object(
      'type', 'line',
      'title', 'ממוצע שביעות-הרצון לפי חודש · '
               || v_lri || to_char(v_from, 'MM/YYYY') || '–' || to_char(v_to, 'MM/YYYY') || v_pdi,
      'series', jsonb_build_array(jsonb_build_object('key', 'avg_score', 'label', 'ממוצע שביעות-רצון')),
      'data', v_chart,
      'xKey', 'month',
      'domain', jsonb_build_array(1, 5),
      'refLines', case when v_ref_avg is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object(
        'axis', 'y', 'value', v_ref_avg,
        'label', 'ממוצע ' || v_lri || to_char(date_trunc('year', v_to) - interval '1 year', 'YYYY') || v_pdi
                 || ' המלאה: ' || v_lri || v_ref_avg || v_pdi
                 || ' על ' || v_lri || to_char(v_ref_n, 'FM999,999,999') || v_pdi || ' משובים')) end,
      'unit', 'ציון'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'company_name',  'label', 'לקוח',                'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'customer_type', 'label', 'סוג הלקוח',           'format', 'text',  'align', 'start',
                         'label_source', 'CUSTOMER_TYPE_LABELS'),
      -- 📐9 · `aria-sort` על העמודה הממוינת. `ReportSurface` גוזר אותו **אך ורק** מ-
      -- ‏`columns[].sorted` (C8, תוספת 16/09) — בלי המפתח אין `aria-sort` על המסך כלל.
      jsonb_build_object('key', 'revenue_12m',   'label', 'הכנסת 12 החודשים',    'format', 'money', 'align', 'end',
                         'sorted', 'descending'),
      jsonb_build_object('key', 'avg_feedback',  'label', 'ממוצע המשוב שלו',     'format', 'ratio', 'align', 'end'),
      jsonb_build_object('key', 'last_event',    'label', 'אירוע אחרון',         'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'next_event',    'label', 'האירוע הבא',          'format', 'text',  'align', 'start')),
    'rows', v_rows,
    -- 📐23 · מבט-על הוא שער ⇒ הפועל נגזר מהדף שהאריח הראשון פותח (מ20, דוח בקרה).
    'so_what', case when v_uns_cnt is null or v_uns_cnt = 0
      then 'לפתוח את "שביעות רצון" ולראות מה מכעיס — אין כרגע לקוח שממוצעו מתחת ל-3.5.'
      else 'לפתוח את "שביעות רצון" ולראות מה מכעיס את ' || v_lri || to_char(v_uns_cnt, 'FM999,999,999') || v_pdi
           || ' הלקוחות הלא-מרוצים (ממוצע מתחת ל-' || v_lri || '3.5' || v_pdi || ') — הם לא הזמינו כבר '
           || v_lri || v_uns_med || v_pdi || ' ימים (חציון), מול ' || v_lri || v_sat_med || v_pdi
           || ' ימים אצל ' || v_lri || to_char(v_sat_cnt, 'FM999,999,999') || v_pdi || ' הלקוחות המרוצים (ממוצע '
           || v_lri || '4.5+' || v_pdi || ').' end,
    'definitions', 'הגדרות: ממוצע שביעות-רצון = ממוצע ציון 1–5 על משובים שהלקוח מילא בלבד; משוב שנשלח ולא נענה אינו נספר · לקוח מרוצה / בינוני / לא-מרוצה = ממוצע הציונים של אותו לקוח, על 3 משובים לפחות: 4.5+ · 3.5–4.4 · מתחת ל-3.5. זהו חתך של לקוחות ואינו "שיעור המרוצים", שנמדד על משובים בציון 4–5 — שני מונים שונים, ולכן שני שמות · ימים מאז האירוע האחרון = היום פחות תאריך האירוע האחרון שהתקיים ולא בוטל · הכנסת 12 החודשים = סך ההכנסה מאירועים שהתקיימו ויצאה להם חשבונית, שתאריך האירוע שלהם ב-12 החודשים האחרונים · ימים לתשלום (חציון) = חציון (תאריך-תשלום פחות תאריך-חשבונית) על חשבוניות ששולמו, כל הזמנים · סכומים ב-₪ שלמים.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', to_jsonb(v_missing),
      'frozen_count', null,
      'notes', v_notes,
      -- C8 · תוספות-מטא שהחוזה מכיר ושהמשטח הזה לא החזיר: הן `null`/רשימה ולעולם לא חסרות.
      'export_blocked_reason', null,
      'customer_filter_ignored', jsonb_build_array(
        'satisfaction_vs_return', 'biggest_negative_is_other',
        'concentration_vs_drifting', 'payment_cadence_by_type'),
      'drill_echo', p_drill,
      'run', null));
end;
$function$;

comment on function public.report_m19_customers_overview(date, date, integer, jsonb) is
  'מבט-על לקוחות (מ19) — קריאה בלבד, מגודר על מודול לקוחות. אוכלוסייה: משובים שהלקוח מילא בתקופה שנבחרה; הוצאו משובים שנשלחו ולא נענו ומשובים שלא נשלחו. מונה-הלקוחות בשורת-האוכלוסייה הוא הלקוחות שמאחורי אותם משובים (distinct), ומספר לקוחות-המערכת נאמר בסוגריים כהקשר. ארבעת האריחים הם חתכים כלל-לקוחיים על כל הזמנים ואינם מגיבים למסנני התקופה והלקוח; הגרף והטבלה כן. חלון התקופה סגור משני קצותיו.';

revoke execute on function public.report_m19_customers_overview(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m19_customers_overview(date, date, integer, jsonb) to authenticated;

-- ----------------------------------------------------------------------------
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
  -- ‏"2,786,544 ₪" חזר מהשרת בתוך משפט עברי בלי בידוד, וזה בדיוק המקרה ש-F5 של E2 תיקן.
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
    || to_jsonb('הספירות מוצגות כ"N מתוך M" ולא באחוזים (📐11).'::text);
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
          'label', 'אשתקד באותו טווח: ' || v_lri || to_char(v_p_neg, 'FM999,999,999') || v_pdi || ' מתוך '
                   || v_lri || to_char(v_p_comp, 'FM999,999,999') || v_pdi,
          'direction', case when v_with_neg > v_p_neg then 'up'
                            when v_with_neg < v_p_neg then 'down' else 'flat' end),
        'target', null)),
    -- 🔴 **ארבעה גרפים ולא שניים** — ר' "פער 2" בכותרת הקובץ: המוקאפ המאושר מצייר
    -- ארבעה, ו-📑ב#17 אוסר במפורש לאחד את שני גרפי-הסיבות לציר אחד.
    'chart', jsonb_build_array(
      jsonb_build_object(
        'type', 'bar',
        'title', 'התפלגות הציונים · ' || v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' משובים',
        'series', jsonb_build_array(jsonb_build_object('key', 'n', 'label', 'משובים')),
        'data', v_dist, 'xKey', 'score', 'domain', null, 'refLines', '[]'::jsonb, 'unit', 'משובים'),
      jsonb_build_object(
        'type', 'bar',
        'title', 'מה משמח · ' || v_lri || to_char(v_with_pos, 'FM999,999,999') || v_pdi || ' משובים סימנו סיבה חיובית',
        'series', jsonb_build_array(jsonb_build_object('key', 'n', 'label', 'משובים')),
        'data', v_pos, 'xKey', 'reason', 'domain', null, 'refLines', '[]'::jsonb, 'unit', 'משובים'),
      jsonb_build_object(
        'type', 'bar',
        'title', 'מה מכעיס · ' || v_lri || to_char(v_with_neg, 'FM999,999,999') || v_pdi || ' משובים סימנו סיבה שלילית',
        'series', jsonb_build_array(jsonb_build_object('key', 'n', 'label', 'משובים')),
        'data', v_neg, 'xKey', 'reason', 'domain', null, 'refLines', '[]'::jsonb, 'unit', 'משובים'),
      jsonb_build_object(
        'type', 'bar',
        'title', 'שיעור המרוצים לפי שנה — אינו מושפע ממסנן התקופה',
        'series', jsonb_build_array(jsonb_build_object('key', 'satisfied_share', 'label', 'שיעור מרוצים')),
        'data', v_years, 'xKey', 'year',
        'domain', jsonb_build_array(0, 100), 'refLines', '[]'::jsonb, 'unit', '%')),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'event_name',       'label', 'אירוע',           'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'company_name',     'label', 'לקוח',            'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'final_event_date', 'label', 'תאריך',           'format', 'text',  'align', 'start'),
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

-- ----------------------------------------------------------------------------
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
        'compare', jsonb_build_object(
          'value', v_dorm_n,
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
            'label', 'ממוצע המשוב שלו ' || v_lri || (v_oldest ->> 'avg_score') || v_pdi
                     || ' על ' || v_lri || to_char((v_oldest ->> 'feedback_n')::integer, 'FM999,999,999') || v_pdi || ' משובים'
                     || case when (v_oldest ->> 'lowest_avg')::boolean then ' — הנמוך ברשימה' else '' end,
            'direction', 'flat') end,
        'target', null)),
    'chart', jsonb_build_object(
      'type', 'histogram',
      'title', 'הקצב שבו לקוחות חוזרים · ' || v_lri || to_char((v_hist ->> 'total')::integer, 'FM999,999') || v_pdi
               || ' מרווחים בין אירועים עוקבים, בדליים של ' || v_lri || '30' || v_pdi || ' יום',
      'series', jsonb_build_array(jsonb_build_object('key', 'n', 'label', 'מספר מרווחים')),
      'data', v_hist -> 'data',
      'xKey', 'label',
      'domain', null,
      'refLines', '[]'::jsonb,
      'unit', 'מרווחים'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'company_name', 'label', 'לקוח',              'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'contact_name', 'label', 'איש קשר',           'format', 'text',  'align', 'start'),
      -- 📐7 · מיון ראשוני הכנסת-12-החודשים יורד ⇒ 📐9 מחייב `aria-sort` עליה.
      jsonb_build_object('key', 'revenue_12m',  'label', 'הכנסת 12 החודשים',  'format', 'money', 'align', 'end',
                         'sorted', 'descending'),
      jsonb_build_object('key', 'last_event',   'label', 'אירוע אחרון',       'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'days_since',   'label', 'ימים מאז האירוע',   'format', 'days',  'align', 'end'),
      jsonb_build_object('key', 'cadence',      'label', 'הקצב שלו',          'format', 'days',  'align', 'end'),
      jsonb_build_object('key', 'ratio',        'label', 'פי כמה מהקצב',      'format', 'ratio', 'align', 'end'),
      jsonb_build_object('key', 'last_score',   'label', 'ציון אחרון · ממוצעו', 'format', 'ratio', 'align', 'end'),
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

-- ----------------------------------------------------------------------------
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
  -- ‏"2,786,544 ₪" חזר מהשרת בתוך משפט עברי בלי בידוד, וזה בדיוק המקרה ש-F5 של E2 תיקן.
  v_lri        constant text := chr(8294);   -- U+2066 LRI
  v_pdi        constant text := chr(8297);   -- U+2069 PDI
  v_to        date;
  v_from      date;
  v_notes     jsonb := '[]'::jsonb;
  v_run       record;
  v_run_json  jsonb;
  -- 🔴 **תיקון G2-1, והוא החוסם של הקובץ.** הגוף הקודם קרא **ריצה מאושרת אחת**
  -- (`order by approved_at desc limit 1`). **נמדד חי 16/09/2026:** שתי ריצות מאושרות —
  -- ‏5 (`partial`, 40 שורות, gemini-3.8-flash) ו-6 (`done`, 386, gemini-3.5-flash-lite),
  -- **זרות זו לזו, ויחד בדיוק 426 הפרויקטים** שהאריח הראשון מכריז עליהם. ⇒ הדוח הציג
  -- ‏386 שורות ו-24 דגלים אדומים במקום 426 ו-25, **בלי לומר שחסרות 40** — ובאותו מסך
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
  -- ‏`partial` / `done`-שטרם-אושרה הייתה **בלתי-נראית לחלוטין** למטען ⇒ הפס היה מצייר
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
  select r.run_id, r.status, r.model, r.finished_at, r.approved_at, r.approved_by,
         r.sent_count, r.ok_count, r.failed_count
    into v_run
    from public.feedback_ai_runs r
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
           'approved_by', r.approved_by, 'sent_count', r.sent_count,
           'ok_count', r.ok_count, 'failed_count', r.failed_count)
           order by r.approved_at desc, r.run_id desc), '[]'::jsonb)
    into v_run_cnt, v_run_ids, v_sent, v_ok, v_failed, v_runs
    from public.feedback_ai_runs r
   where r.approved_at is not null;

  -- 🔑 **שני מודלים מעורבים בפועל**, ולכן הדף אומר אילו ועל כמה שורות כל אחד —
  -- ‏"המודל" ביחיד היה הסתרה של הרכב-הנתונים שעליו האדם מסתכל.
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
    -- ── מטריצת-ההסכמה אדם↔מודל · **הצד השלילי** (‏'אחר' קיים בשתי הרשימות ⇒ שתי עמודות) ──
    -- 🔑 **"מספר-הסכמה בודד אינו מדד"** (📑ב#20): המטריצה היא תגית-לקוח × נושא-מודל,
    -- עם מכנה גלוי לכל שורה. 📐7 — "אחר" אחרון תמיד.
    with pick as (
      -- שורה אחת לפרויקט מתוך **כל** הריצות המאושרות; אם פרויקט סווג פעמיים,
      -- המאושרת האחרונה גוברת. (‏16/09/2026 אין חפיפה — 426 שורות, 426 פרויקטים.)
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
      -- המאושרת האחרונה גוברת. (‏16/09/2026 אין חפיפה — 426 שורות, 426 פרויקטים.)
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

    -- ‏`free_topic` — **הכרעה 11 של ת2**: מה "אחר" מכיל. 📑ב#20 מציג רק `n≥3`,
    -- והשאר נספרים יחד תחת "תגיות בודדות".
    with pick as (
      -- שורה אחת לפרויקט מתוך **כל** הריצות המאושרות; אם פרויקט סווג פעמיים,
      -- המאושרת האחרונה גוברת. (‏16/09/2026 אין חפיפה — 426 שורות, 426 פרויקטים.)
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
      -- המאושרת האחרונה גוברת. (‏16/09/2026 אין חפיפה — 426 שורות, 426 פרויקטים.)
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
      -- המאושרת האחרונה גוברת. (‏16/09/2026 אין חפיפה — 426 שורות, 426 פרויקטים.)
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

    -- ‏`model` נשאר מפתח-מחרוזת (לא משנים צורת-מפתח), אך הוא נוקב בשני המודלים
    -- שמאחורי השורות; הפירוט המלא ב-`models` וב-`runs`.
    v_run_json := jsonb_build_object(
      'run_id', v_run.run_id, 'status', v_run.status,
      'model', array_to_string(v_models, ' + '),
      'models', v_models_j,
      'runs', v_runs,
      'run_count', v_run_cnt,
      'finished_at', v_run.finished_at, 'approved_at', v_run.approved_at,
      'approved_by', v_run.approved_by,
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
    v_notes := v_notes || to_jsonb((v_lri || to_char(v_run_cnt, 'FM999,999,999') || v_pdi
      || ' ריצות-ניתוח מאושרות מוצגות יחד, שורה אחת לכל פרויקט; המודלים: '
      || array_to_string(v_models, ', ') || '.')::text);
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
        'compare', jsonb_build_object('value', v_other, 'label', 'פילוח לפי שנה', 'direction', 'up'),
        'target', null),
      jsonb_build_object(
        'key', 'other_vs_categories',
        'label', 'גודל "אחר" מול הקטגוריות',
        'value', v_other,
        'format', 'int',
        'sub', '"אחר" מול ארבע הקטגוריות הקיימות יחד (' || v_lri || to_char(v_rest, 'FM999,999,999') || v_pdi || ')',
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
        'compare', jsonb_build_object('value', null, 'label', 'יימדד אחרי הריצה הראשונה', 'direction', 'flat'),
        'target', null)),
    -- §📊 לדוח 20: *"עמודות לפי נושא (מודל) לצד עמודות לפי תגית (לקוח) — ההשוואה היא הגרף"*.
    -- בלי ריצה מאושרת אין מה להשוות, ולכן `null` — ולא גרף ריק שנראה כמו תקלה.
    'chart', case when v_run.run_id is null then null else jsonb_build_object(
      'type', 'bar',
      'title', 'מטריצת ההסכמה · מה הלקוח תייג מול מה המודל מצא · מתוך '
               || v_lri || to_char(v_classified, 'FM999,999,999') || v_pdi || ' הערות מסווגות',
      'series', jsonb_build_array(
        jsonb_build_object('key', 'total',          'label', 'תויג ע"י הלקוח'),
        jsonb_build_object('key', 'agreed',         'label', 'המודל הסכים'),
        jsonb_build_object('key', 'unclassifiable', 'label', 'לא ניתן לסווג')),
      'data', v_matrix,
      'xKey', 'human_tag',
      'domain', null,
      'refLines', '[]'::jsonb,
      'unit', 'הערות') end,
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'company_name',     'label', 'לקוח',            'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'final_event_date', 'label', 'תאריך',           'format', 'text', 'align', 'start'),
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

-- ----------------------------------------------------------------------------
