-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  מודול 11 · סבב-RPC J2 (17/09/2026) — "מטפלים הכל מהיסוד, בלי קיצורי דרך"    ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝
-- 🔑 **למה הקובץ הזה קיים:** סבב J1 תיקן סימפטומים במקומות שבהם החוזה שתק. כאן
--    **החוזה עצמו נושא את האמת**, והמעטפת רק מרנדרת אותו. חמישה פריטים:
--
--    ① **`format: 'id'` על כל עמודת-מזהה** (מ4 `quote_id` · מ7 · מ8 · מ9 ×2 · מ12
--       `project_id` — ⁦6⁩ עמודות, וזו כל רשימת עמודות-המזהה בשישה-עשר המשטחים:
--       `grep -on "'key', *'[a-z_]*_id'"` על גופי-החי). 🔴 **וזה חוב-חוזה ולא
--       ליטוש:** `ReportTable.jsx` מחק ב-17/09 את כלל-הסיומת (`/_id$/`) שהפך כל
--       `*_id` למזהה גם כשה-RPC הכריז `int` — שני מנגנונים לאותה התנהגות הם
--       מחלקת-הפגם D-30. מהיום ההצהרה היא המקור היחיד, ועמודה שלא הוצהרה
--       תחזור להיות ⁦1,416⁩ עם מפריד-אלפים.
--    ② **חצי-ההשוואה — נוסח אחד, המוכרע.** הכרעה 15(ב) (`processes-approved.md`
--       שורה 917) ו-📐1 (שורה 781) נועלים *"▲/▼ לא-צבוע + הערך הקודם"* בנוסח
--       *"אשתקד ⁦1,196,000⁩ ₪"*. על המסך היו **ארבעה** נוסחים (*"⁦2025⁩ באותו טווח"* ·
--       *"לפני שנה, אותו חישוב"* · *"התקופה המקבילה אשתקד"* · *"אשתקד באותו
--       טווח (…)"*) בתשעה משטחים.
--       ⚠️ **הנקודתיים אינן בתווית** — `KpiTile.CompareLine` מוסיף `: ` בעצמו
--       (`KpiTile.jsx:88–95`: `{compare.label}` ואז `: <Ltr>{valueText}</Ltr>`),
--       ותווית שנושאת נקודותיים הייתה מדפיסה אותן פעמיים. ⇒ התווית היא `'אשתקד'`
--       בדיוק, והמכנה שכבר היה בסוגריים נשאר — הוא מידע, לא נוסח.
--       🚫 **מה לא נגע, ולמה:** מ3 (הבסיס שם הוא **שנה נקובה**, ו-*"⁦2025⁩ המלאה"*
--       אינו "אותו טווח" אלא שנה מלאה מול YTD — שינוי הנוסח היה מוחק מידע) ·
--       מ7/מ9/מ21 (*"לפני חודש"* — בסיס-השוואה אחר) · מ16 (השוואה ל**חציון**,
--       📐15) · מ19/מ22 (תוויות שהן משפט שלם עם `value: null`, לא בסיס-זמן).
--    ③ **ציר-חודשים — צורה אחת.** *"2025-09"* (מ14) · *"09/2025"* (מ7) ·
--       *"ינואר ⁦2026⁩"* (מ19) היו שלוש צורות באותה מערכת. הכלל: **שם-חודש עברי,
--       ועוד שנה רק כשהציר חוצה יותר משנה קלנדרית אחת**. מפתח-המכונה נשאר,
--       `label` נוסף, ו-`xKey` מצביע עליו — התבנית שמ2/מ3/מ19 כבר עובדים לפיה
--       (`ChartCard.categoryAxis` מרנדר את `row[xKey]` כמות-שהוא; אין מיפוי-תוויות).
--    ④ **"חלון קפוא" ⇒ "חלון קבוע"** (מ14 ×1 · מ15 ×8). `ui-copy-styleguide.md`
--       שורה 157 נועלת את *"קפוא"* ל**מחיר שהלקוח אישר ונעול במסד** — מילה אחת
--       ושתי משמעויות על אותו מוצר. הערות-הקוד ו-`comment on function` נשארות:
--       הן אינן על המסך.
--    ⑤ **מ22 מפסיקה להדהד תקופה שאינה שואלת בה** (יתרת סבב-א, פריט [28]).
--
-- 🔒 **מקורות-האמת שנקראו לפני הכתיבה, לא מהזיכרון:** `processes-approved.md`
--    שורות 781 · 917 · `ui-copy-styleguide.md` שורה 157 · `spec.md §1.4`
--    (⁦79⁩ תוויות-אריח — **אף תווית שמשתנה כאן אינה שם**: הטבלה מונה תוויות-אריח
--    בלבד, לא תוויות-חלון, לא חצאי-השוואה ולא צירי-גרף ⇒ הספירה המוצהרת אינה זזה,
--    ו-`npm run check:declared-counts` מאשר) · `KpiTile.jsx:61–99` ·
--    `ReportTable.jsx:27–47` · `ReportsPage.jsx:130–137` · `ReportSurface.jsx:201–214`.
-- 🧾 **גופי-המוצא (אומתו ב-`md5(prosrc)` מול `pg_proc`, לא לפי שם-הקובץ):**
--    מ2·מ4·מ6 = D2 `20260916083000` · מ7·מ12 = I1 `20260916114500` ·
--    מ17·מ19 = I2 `20260916194500` · מ8·מ9·מ14·מ15·מ20·מ22 = J1 `20260917005500`.

-- ==================== 1 - report_m02_exec_overview ====================
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
          'label', 'אשתקד',
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
          'label', 'אשתקד',
          'note', null,
          'direction', case when v_margin > v_prev_margin then 'up' when v_margin < v_prev_margin then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'הנהלה', 'report', 'report_m04_discounts', 'drill', null)),
      jsonb_build_object(
        'key', 'finished_events', 'label', 'אירועים שהסתיימו', 'value', v_n, 'format', 'int',
        'sub', 'ארבעת המצבים — פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום',
        'window', v_window_text,
        'compare', jsonb_build_object(
          'value', v_prev_n,
          'label', 'אשתקד',
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
          'label', 'אשתקד',
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

-- ==================== 2 - report_m04_discounts ====================
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
          'value', v_prev_no_discount_margin, 'label', 'אשתקד',
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
          'value', v_prev_deep_margin, 'label', 'אשתקד',
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
          'value', v_prev_gap, 'label', 'אשתקד', 'note', 'נקודות-אחוז',
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
          'label', 'אשתקד',
          'note', v_lri || to_char(v_appr_prev, 'FM999,999,999') || ' מתוך ' || to_char((v_appr_prev + v_lost_prev), 'FM999,999,999') || v_pdi,
          'direction', case when v_rate > v_prev_rate then 'up' when v_rate < v_prev_rate then 'down' else 'flat' end) end,
        'target', null)
    ),
    'chart', jsonb_build_object(
      'type', 'bar', 'title', 'שולי-רווח לפי מדרג-הנחה',
      'series', jsonb_build_array(
        jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'kind', 'bar', 'axis', 'left', 'format', 'percent'),
        -- 📐19: `slate-400` נעול כאן למשמעות אחת — "אשתקד".
        -- 🪤 J2 · **המקרא וארבעת האריחים שמעליו אמרו שני דברים על אותו בסיס.**
        --    האריחים עברו ל-'אשתקד' (הכרעה 15ב), והמקרא הולך איתם.
        jsonb_build_object('key', 'margin_prev', 'label', 'אשתקד', 'kind', 'bar', 'axis', 'left', 'format', 'percent')),
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
      jsonb_build_object('key', 'quote_id', 'label', 'הצעה', 'format', 'id', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'event_name', 'label', 'אירוע', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'issue_date', 'label', 'הופקה', 'format', 'date', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'discount', 'label', 'הנחה', 'format', 'percent', 'align', 'end', 'sorted', 'desc'),
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'format', 'money', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'format', 'percent', 'align', 'end', 'sorted', null)
    ),
    'rows', v_rows,
    'so_what', v_so_what,
    'definitions', 'מדרג-הנחה = ההנחה הקבועה של הלקוח ועוד ההנחה הידנית שניתנה בהצעה, יחד · "10%+ (פתוח)" = כל הנחה מעל 10%, בלי חסם עליון · שולי-רווח של מדרג = סך הרווח של אירועי המדרג חלקי סך ההכנסה שלהם, לא ממוצע של אחוזים · שיעור אישור = אושרו חלקי (אושרו + נדחו); הצעות שנסגרו כי "נפתחה בטעות" אינן נספרות כדחייה · "אשתקד" = בדיוק אותו חישוב על מה שהיה במערכת לפני שנה.',
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

-- ==================== 3 - report_m06_staffing ====================
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
          'value', v_prev_median, 'label', 'אשתקד', 'note', null,
          'direction', case when v_median > v_prev_median then 'up' when v_median < v_prev_median then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'over_estimate', 'label', 'אירועים מעל הצפי',
        'value', v_over_n, 'format', 'int',
        'sub', 'הגיעו יותר אורחים מההערכה שבהצעה · ' ||
               v_lri || to_char(round(100.0 * v_over_n / nullif(v_both_n, 0), 1), 'FM990.0') || '%' || v_pdi ||
               ' מתוך ' || v_lri || to_char(v_both_n, 'FM999,999,999') || v_pdi || ' האירועים עם שני המספרים',
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה',
        'compare', case when v_prev_both = 0 then null else jsonb_build_object(
          'value', v_prev_over, 'label', 'אשתקד',
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
          'value', v_prev_above, 'label', 'אשתקד',
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
          'value', v_prev_both, 'label', 'אשתקד',
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

-- ==================== 4 - report_m07_finance_overview ====================
create or replace function public.report_m07_finance_overview(
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
  -- why: בידוד-כיווניות לכל רצף-ספרות בתוך משפט עברי — התאום של `isolateLtr`
  --      (`reportsFormat.js`), שם תועד ש-"46,400 ₪" נראה הפוך בדפדפן אמיתי ב-16/09/2026.
  v_lri          constant text := chr(8294);
  v_pdi          constant text := chr(8297);
  -- why: שם-החודש נכתב על האריח ("מתוך 13 אירועים שהתקיימו בספטמבר"). `to_char` היה מחזיר
  --      אנגלית; הרשימה כאן היא אותה רשימה שבמיגרציית ההנהלה.
  v_months_he    constant text[] := array['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  v_today        date := (now() at time zone 'Asia/Jerusalem')::date;
  -- why (F1): תאריך-הייחוס של כל מה שהוא צילום-רגע. `p_to` הוא מסנן-תקופה ואינו מזיז אותו.
  v_asof         date;
  v_to           date;
  v_from         date;
  v_prev_month   date;
  v_terms        integer;
  v_threshold    numeric;
  v_missing      text[] := array[]::text[];
  v_open_n       integer;
  v_open_sum     numeric;
  v_prev_n       integer;
  v_prev_sum     numeric;
  v_over60_n     integer;
  v_over60_sum   numeric;
  v_exp_n        integer;
  v_exp_sum      numeric;
  v_recv_n       integer;
  v_recv_sum     numeric;
  v_dev_n        integer;
  v_dev_den      integer;
  v_dev_prev_n   integer;
  v_dev_prev_den integer;
  v_dev_roll_n   integer;
  v_dev_roll_den integer;
  v_pay_sum      numeric;
  v_pay_shifts   integer;
  v_pay_prev_sum numeric;
  v_pay_prev_n   integer;
  v_pay_roll_sum numeric;
  v_written_n    integer;
  v_written_sum  numeric;
  v_series       jsonb;
  v_series_min   numeric;
  v_rows         jsonb;
  v_oldest_days  integer;
  v_oldest_name  text;
  v_top_name     text;
  v_top_sum      numeric;
begin
  -- הכרעה 2: הלשונית נפתחת לפי המודול שבעלים על הדאטה. השער היחיד שקיים בגוף `definer`.
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  v_asof       := coalesce(p_asof, v_today);
  v_to         := coalesce(p_to, v_today);
  v_from       := coalesce(p_from, date_trunc('year', v_to)::date);
  v_prev_month := (date_trunc('month', v_to) - interval '1 month')::date;

  select pa.param_value::integer into v_terms
    from public.params pa where pa.param_name = 'תנאי_תשלום_ימים';
  if v_terms is null then
    v_missing := v_missing || 'תנאי_תשלום_ימים'::text;
  end if;

  -- why (F2): הסף נקרא מהפרמטר, כמו במ8. סף מוקשח בגוף הפונקציה היה נותן לאריח של מ7
  --           ולדף מ8 שאליו הוא דלת שני מספרים שונים ביום שבו ישי יעדכן את הפרמטר,
  --           ומחיקת שורת-הפרמטר הייתה מחזירה את הסף הישן בשקט במקום "חסר פרמטר מערכת".
  --           🔁 ואין כאן ספרות בכוונה: הבדיקה המכנית מחפשת את הליטרל שהוסר בתוך `prosrc`,
  --           והערה שמצטטת אותו הייתה מפילה אותה בשקט — על טקסט, לא על קוד.
  select pa.param_value::numeric into v_threshold
    from public.params pa where pa.param_name = 'סף_סטיית_תקציב_אחוז';
  if v_threshold is null then
    v_missing := v_missing || 'סף_סטיית_תקציב_אחוז'::text;
  end if;

  -- ── האוכלוסייה: חשבוניות שנשלחו, טרם שולמו, ולא נמחקו כחוב-אבוד ──────────────
  -- ‏`p_customer_id` מצמצם את כל הדף (מסנן-לקוח גלובלי); `null` = כל הלקוחות.
  -- why (F1): ימי-האיחור נמדדים מול `v_asof` ולא מול `v_to`. האוכלוסייה עצמה היא
  --           "טרם שולמה **עכשיו**", ומדידת ימיה מול קצה-התקופה הייתה שני תאריכי-ייחוס
  --           באריח אחד.
  with open_inv as (
    select p.project_id,
           c.company_name,
           (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date as sent_d,
           round(m.revenue) as amt
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
           case when v_terms is null then null
                else greatest(v_asof - (o.sent_d + v_terms), 0) end as dov
      from open_inv o
  )
  select count(*)::integer,
         coalesce(sum(amt), 0),
         count(*) filter (where dov > 60)::integer,
         coalesce(sum(amt) filter (where dov > 60), 0),
         max(dov),
         (array_agg(company_name order by dov desc nulls last))[1],
         (array_agg(company_name order by amt desc nulls last) filter (where dov > 60))[1],
         max(amt) filter (where dov > 60),
         coalesce(jsonb_agg(jsonb_build_object(
           'project_id', project_id, 'customer_name', company_name,
           'sent_date', sent_d, 'due_date', sent_d + v_terms,
           'amount', amt, 'days_overdue', dov,
           -- why (F7): צורת-`drill_key` אחידה בין הלשוניות — `{kind, id}`, כמו בהנהלה.
           'drill_key', jsonb_build_object('kind', 'project', 'id', project_id)
         ) order by dov desc nulls last, amt desc) filter (where dov is not null), '[]'::jsonb)
    into v_open_n, v_open_sum, v_over60_n, v_over60_sum,
         v_oldest_days, v_oldest_name, v_top_name, v_top_sum, v_rows
    from scored;

  -- ‏📑ב: הטבלה מציגה את **4 הישנות ביותר בלי פאג'ר** + קישור "כל N →" לדוח הגיול.
  v_rows := (select coalesce(jsonb_agg(e), '[]'::jsonb)
               from (select e from jsonb_array_elements(v_rows) e limit 4) s);

  -- ── יתרת-החוב לפני חודש (📐1 — תקופה-קודמת אמיתית, לא "—") ────────────────────
  select count(*)::integer, coalesce(sum(round(m.revenue)), 0)
    into v_prev_n, v_prev_sum
    from public.projects p
    left join public.project_finance pf on pf.project_id = p.project_id
    cross join lateral public.finance_project_money(p.project_id) m
   where p.invoice_sent = true
     and p.invoice_sent_at is not null
     and coalesce(pf.written_off, false) = false
     and (p_customer_id is null or p.customer_id = p_customer_id)
     and (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date <= v_asof - 30
     and (p.payment_date is null or p.payment_date > v_asof - 30);

  -- ── "צפוי להיכנס ב-30 יום" = מועד חוזי + חציון-האיחור של אותו לקוח (📑#7) ──────
  -- ‏≥3 חשבוניות ששולמו ⇒ החציון האישי · אחרת חציון-הסגמנט · אחרת חציון-החברה.
  -- ⚠️ **הערכה, לא התחייבות** — מוצהר על האריח (הכרטיס ③, אחרי `m11-contractual-vs-expected`).
  with paid as (
    select p.customer_id, c.customer_type,
           (p.payment_date - ((p.invoice_sent_at at time zone 'Asia/Jerusalem')::date + v_terms)) as late_days
      from public.projects p
      join public.customers c on c.customer_id = p.customer_id
     where p.invoice_sent = true and p.invoice_sent_at is not null and p.payment_date is not null
  ), by_cust as (
    select customer_id, count(*) as n,
           percentile_cont(0.5) within group (order by late_days) as m from paid group by 1
  ), by_seg as (
    select customer_type, percentile_cont(0.5) within group (order by late_days) as m from paid group by 1
  ), by_all as (
    select percentile_cont(0.5) within group (order by late_days) as m from paid
  ), open_inv as (
    select p.project_id, p.customer_id, c.customer_type,
           ((p.invoice_sent_at at time zone 'Asia/Jerusalem')::date + v_terms) as due_d,
           round(m.revenue) as amt
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      left join public.customers c on c.customer_id = p.customer_id
      cross join lateral public.finance_project_money(p.project_id) m
     where p.invoice_sent = true and p.invoice_sent_at is not null and p.payment_date is null
       and coalesce(pf.written_off, false) = false
       and (p_customer_id is null or p.customer_id = p_customer_id)
  )
  select count(*)::integer, coalesce(sum(amt), 0)
    into v_exp_n, v_exp_sum
    from (
      select o.amt,
             (o.due_d + (coalesce(case when bc.n >= 3 then bc.m end, bs.m, ba.m))::integer) as expected_d
        from open_inv o
        left join by_cust bc on bc.customer_id = o.customer_id
        left join by_seg  bs on bs.customer_type = o.customer_type
        cross join by_all ba
    ) x
   where v_terms is not null and expected_d > v_asof and expected_d <= v_asof + 30;

  -- חצי-ההשוואה של אותו אריח: מה **נכנס בפועל** ב-30 הימים האחרונים. השוואה רטרוספקטיבית
  -- ולא אותה נוסחה — ולכן היא מוצהרת ככזו בתווית (הכרטיס ③). חלון נגלל ⇒ חצי-פתוח (D-17).
  select count(*)::integer, coalesce(sum(round(m.revenue)), 0)
    into v_recv_n, v_recv_sum
    from public.projects p
    cross join lateral public.finance_project_money(p.project_id) m
   where p.payment_date > v_asof - 30 and p.payment_date <= v_asof
     and (p_customer_id is null or p.customer_id = p_customer_id);

  -- ── שני האריחים "החודש" — ר' הכותרת: קלנדרי מוצג, נגלל נמדד ומוחזר ב-`meta` ────
  -- why (F6): המכנה נמדד ומוחזר. "0 חרגו" בלי "מתוך 13 אירועים שהתקיימו" הוא מספר בלי עולם,
  --           והמוקאפ המאושר מדפיס את שניהם.
  with money as (
    select p.project_id, p.final_event_date, m.budget_deviation, m.planned_hours,
           (select coalesce(sum(a.hourly_rate_snapshot), 0) from public.assignments a
             where a.project_id = p.project_id and a.assignment_status = 'finally_approved') as rate_sum
      from public.projects p
      cross join lateral public.finance_project_money(p.project_id) m
     where p.project_status in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')
       and (p_customer_id is null or p.customer_id = p_customer_id)
  ), ratio as (
    select final_event_date,
           budget_deviation / nullif(planned_hours * rate_sum, 0) as r from money
  )
  select count(*) filter (where final_event_date >= date_trunc('month', v_to)::date
                            and final_event_date <= v_to)::integer,
         count(*) filter (where final_event_date >= date_trunc('month', v_to)::date
                            and final_event_date <= v_to and r > v_threshold / 100.0)::integer,
         count(*) filter (where final_event_date >= v_prev_month
                            and final_event_date < date_trunc('month', v_to)::date)::integer,
         count(*) filter (where final_event_date >= v_prev_month
                            and final_event_date < date_trunc('month', v_to)::date
                            and r > v_threshold / 100.0)::integer,
         count(*) filter (where final_event_date > v_to - 30 and final_event_date <= v_to)::integer,
         count(*) filter (where final_event_date > v_to - 30 and final_event_date <= v_to
                            and r > v_threshold / 100.0)::integer
    into v_dev_den, v_dev_n, v_dev_prev_den, v_dev_prev_n, v_dev_roll_den, v_dev_roll_n
    from ratio;

  -- why (E3 · D-21): ‏₪ בלי אגורות **בפיילוד ולא רק בתצוגה**, ו**הסדר הוא `round(sum(...))`**
  --            ולא `sum(round(...))`. ‏E2 עיגל פר-שורה והחזיר 19,257 ₪ לאוגוסט 2026, בעוד
  --            קו-הבסיס (`signoff-baseline-2026-09-10.md`) והמוקאפ המאושר כותבים 19,253 ₪
  --            (= `round(19,252.5)`) — והפער, 4 ₪, הוא כולו הסדר. שלושה מקורות מכריעים לסדר
  --            הזה: ① קו-הבסיס הוא קריטריון-הקבלה של המשטחים · ② ה-SSOT של השכר (מ8) מעגל
  --            **פר-שורה לאגורות** — ‏`generate_salary_report` מחשב
  --            `round(c.hours * c.rate + c.bonus + c.travel, 2)` (נמשך מ-`prosrc` החי 16/09,
  --            ומתועד ב-`src/lib/salaryReport.js:32`) ⇒ השלם שתואם את מה ש**משולם בפועל**
  --            הוא עיגול-הסכום · ③ הכרטיס מבטיח "₪ בלי אגורות" בלבד ואינו קובע סדר.
  --            🔴 שלושת המקומות יחד — האריח, ההשוואה לחודש-הקודם, ומדידת 30-הימים-הנגללים
  --            ב-`meta.open_items` — אחרת שני מספרים על אותו מסך נמדדים בשתי שיטות.
  select coalesce(round(sum(a.actual_hours * a.hourly_rate_snapshot)
                    filter (where a.event_date >= date_trunc('month', v_to)::date and a.event_date <= v_to)), 0),
         count(*) filter (where a.event_date >= date_trunc('month', v_to)::date and a.event_date <= v_to)::integer,
         coalesce(round(sum(a.actual_hours * a.hourly_rate_snapshot)
                    filter (where a.event_date >= v_prev_month
                              and a.event_date < date_trunc('month', v_to)::date)), 0),
         count(*) filter (where a.event_date >= v_prev_month
                            and a.event_date < date_trunc('month', v_to)::date)::integer,
         coalesce(round(sum(a.actual_hours * a.hourly_rate_snapshot)
                    filter (where a.event_date > v_to - 30 and a.event_date <= v_to)), 0)
    into v_pay_sum, v_pay_shifts, v_pay_prev_sum, v_pay_prev_n, v_pay_roll_sum
    from public.assignments a
    join public.projects p on p.project_id = a.project_id
   where a.actual_hours > 0
     and (p_customer_id is null or p.customer_id = p_customer_id);

  -- ── הגרף: יתרת-החוב הפתוחה בסוף כל חודש, 12 נקודות אחורה (⏳ב1) ───────────────
  -- why (F1): הנקודה האחרונה נושאת `is_today` **רק כשהיא באמת היום**. קודם היא נשאה את
  --           הדגל גם על תקופה שנבחרה בעבר, ואז המסך צייר עמודת-"היום" מקווקוות על 30/06.
  with inv as (
    select (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date as sent_d,
           p.payment_date, round(m.revenue) as amt
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      cross join lateral public.finance_project_money(p.project_id) m
     where p.invoice_sent = true and p.invoice_sent_at is not null
       and coalesce(pf.written_off, false) = false
       and (p_customer_id is null or p.customer_id = p_customer_id)
  ), pts as (
    select (date_trunc('month', v_to) - ((11 - n) || ' month')::interval + interval '1 month'
              - interval '1 day')::date as asof, false as is_today
      from generate_series(0, 10) n
    union all select v_to, (v_to = v_asof)
  )
  select jsonb_agg(jsonb_build_object(
           -- 🪤 J2 · **ציר-החודשים הדפיס `09/2025`** בעוד מ19 מדפיס 'ינואר ⁦2026⁩'
           --    ומ14 הדפיס `2025-09` — שלוש צורות לאותו מושג. הצורה שנשארת:
           --    **שם-חודש עברי**, ‏+ שנה כשהציר חוצה יותר משנה אחת
           --    (כאן: 12 נקודות אחורה ⇒ תמיד). ‏`month` נשאר **מפתח-מכונה**
           --    ו-`label` הוא מה שהעין קוראת — בדיוק התבנית של מ19/מ3
           --    (`xKey` מצביע על `label`). שום מפתח לא נמחק.
           'month', to_char(asof, 'MM/YYYY'),
           'label', v_months_he[extract(month from asof)::integer]
                    || ' ' || v_lri || to_char(asof, 'YYYY') || v_pdi,
           'asof', asof, 'is_today', is_today,
           'open_amount', coalesce((select sum(amt) from inv
                                     where inv.sent_d <= pts.asof
                                       and (inv.payment_date is null or inv.payment_date > pts.asof)), 0),
           'open_count', (select count(*) from inv
                           where inv.sent_d <= pts.asof
                             and (inv.payment_date is null or inv.payment_date > pts.asof))
         ) order by asof), min(coalesce((select sum(amt) from inv
                                          where inv.sent_d <= pts.asof
                                            and (inv.payment_date is null or inv.payment_date > pts.asof)), 0))
    into v_series, v_series_min
    from pts;

  -- חובות-אבודים: **שורת-הערה מתחת לטבלה, ב-₪** ומחוץ לשורת-האריחים (📑ב#6).
  select count(*)::integer, coalesce(sum(round(m.revenue)), 0)
    into v_written_n, v_written_sum
    from public.projects p
    join public.project_finance pf on pf.project_id = p.project_id
    cross join lateral public.finance_project_money(p.project_id) m
   where p.invoice_sent = true and p.payment_date is null and pf.written_off
     and (p_customer_id is null or p.customer_id = p_customer_id);

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_open_n,
      'label', 'אוכלוסייה: חשבוניות שנשלחו וטרם שולמו · הוצאו: חובות אבודים ('
               || v_lri || v_written_n || v_pdi || ') ופרויקטים שטרם חויבו · '
               || v_lri || 'n=' || v_open_n || v_pdi
               || ' חשבוניות, נכון להיום — צילום-רגע שאינו מושפע ממסנן התקופה. '
               || 'שני האריחים התחתונים נשענים על אוכלוסיית דוחות-הכסף: אירועים שהתקיימו '
               || 'ויצאה להם חשבונית — פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום.',
      'excluded', jsonb_build_object('חוב אבוד', v_written_n)),
    'window', jsonb_build_object('from', v_from, 'to', v_to,
      'label', v_lri || to_char(v_from, 'DD/MM') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'open_debt', 'label', 'יתרת-חוב פתוחה',
        'value', v_open_sum, 'format', 'money', 'count', v_open_n,
        'sub', v_lri || v_open_n || v_pdi
               || case when v_open_n = 1 then ' חשבונית פתוחה' else ' חשבוניות פתוחות' end,
        -- why (F1): אין כאן תאריך-מסנן. האריח הצהיר "אינו מושפע ממסנן התקופה" והדפיס
        --           "נכון ל-30/06" באותה נשימה.
        'window', 'נכון להיום · אינו מושפע ממסנן התקופה',
        'compare', jsonb_build_object('value', v_prev_sum, 'label', 'לפני חודש', 'count', v_prev_n,
          'note', null,
          'direction', case when v_open_sum > v_prev_sum then 'up'
                            when v_open_sum < v_prev_sum then 'down' else 'flat' end),
        'target', jsonb_build_object('tab', 'כספים', 'report', 'report_m09_aging', 'drill', null)),
      jsonb_build_object('key', 'expected_30d', 'label', 'צפוי להיכנס ב-30 יום',
        'value', v_exp_sum, 'format', 'money', 'count', v_exp_n,
        'sub', v_lri || v_exp_n || v_pdi
               || case when v_exp_n = 1 then ' חשבונית' else ' חשבוניות' end
               || ' · הערכה לפי התנהגות-תשלום היסטורית, לא התחייבות של הלקוח',
        'window', v_lri || to_char(v_asof, 'DD/MM') || '–' || to_char(v_asof + 30, 'DD/MM') || v_pdi,
        'compare', jsonb_build_object('value', v_recv_sum, 'count', v_recv_n,
          'label', 'שנכנסו בפועל ב-30 הימים האחרונים',
          'note', 'אינה אותה נוסחה — השוואה רטרוספקטיבית; התחזית של לפני חודש לא שוחזרה',
          'direction', case when v_exp_sum > v_recv_sum then 'up'
                            when v_exp_sum < v_recv_sum then 'down' else 'flat' end),
        -- ‏`null` ולא הפניה: דוח "תזרים צפוי" (מ10) נדחה בהכרעה 30 ואינו נבנה.
        'target', null),
      jsonb_build_object('key', 'over_threshold_month', 'label', 'פרויקטים שחרגו מהתקציב החודש',
        -- why (F2 · C5): הסף חסר ⇒ האריח אינו מצויר. `0` היה נראה כמדידה.
        'value', case when v_threshold is null then null else v_dev_n end,
        'format', 'int',
        'sub', case when v_threshold is null then null
                    else 'מתוך ' || v_lri || v_dev_den || v_pdi || ' אירועים שהתקיימו ב'
                         || v_months_he[extract(month from v_to)::integer]
                         || case when v_dev_n = 0 then ' — אף אחד לא חרג' else '' end end,
        'window', v_lri || to_char(date_trunc('month', v_to), 'DD/MM') || '–' || to_char(v_to, 'DD/MM') || v_pdi,
        'compare', case when v_threshold is null then null else jsonb_build_object(
          'value', v_dev_prev_n, 'count', v_dev_prev_den,
          'label', v_months_he[extract(month from v_prev_month)::integer],
          'note', v_lri || v_dev_prev_n || v_pdi || ' מתוך ' || v_lri || v_dev_prev_den || v_pdi || ' אירועים',
          'direction', case when v_dev_n > v_dev_prev_n then 'up'
                            when v_dev_n < v_dev_prev_n then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'כספים', 'report', 'report_m08_profitability', 'drill', null)),
      jsonb_build_object('key', 'hostess_pay_month', 'label', 'שכר דיילות החודש',
        'value', v_pay_sum, 'format', 'money', 'count', v_pay_shifts,
        'sub', v_lri || v_pay_shifts || v_pdi
               || case when v_pay_shifts = 1 then ' משמרת בתשלום' else ' משמרות בתשלום' end,
        'window', v_lri || to_char(date_trunc('month', v_to), 'DD/MM') || '–' || to_char(v_to, 'DD/MM') || v_pdi,
        'compare', jsonb_build_object('value', v_pay_prev_sum, 'count', v_pay_prev_n,
          'label', v_months_he[extract(month from v_prev_month)::integer],
          'note', v_lri || v_pay_prev_n || v_pdi
                  || case when v_pay_prev_n = 1 then ' משמרת' else ' משמרות' end,
          'direction', case when v_pay_sum > v_pay_prev_sum then 'up'
                            when v_pay_sum < v_pay_prev_sum then 'down' else 'flat' end),
        -- דוח "שכר דיילות לפי חודש" (מ13) נדחה בהכרעה 30 ⇒ אין דלת.
        'target', null)),
    'chart', jsonb_build_object(
      'type', 'bar', 'title', 'יתרת-החוב הפתוחה בסוף כל חודש',
      -- 🪤 I1 · **`chart.unit` הוא שם-פורמט של C8, לא מחרוזת-תצוגה.**
      --    ‏`ChartCard.valueFormat` מחזיר `series[0].format ?? unit` ומזין את
      --    ‏`formatAxisTick`, ו-`HebrewTooltip` מזין את `formatByType` — שניהם מצפים
      --    ל-`money|percent|int|ratio|score|days|text|date`. מחרוזת-תצוגה היא **פורמט
      --    לא-מוכר** ⇒ הציר נופל לקיבוץ-אלפים חשוף והטולטיפ ל-`text`.
      --    הכיתוב העברי נשמר ב-`unit_label` (תוספתי; **אין לו קורא היום** — מדווח).
      'series', jsonb_build_array(jsonb_build_object('key', 'open_amount', 'label', 'יתרת-חוב פתוחה',
                                                    'format', 'money')),
      'data', coalesce(v_series, '[]'::jsonb), 'xKey', 'label',
      'domain', null, 'refLines', '[]'::jsonb, 'unit', 'money'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'project_id', 'label', 'פרויקט', 'format', 'id', 'align', 'start'),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'sent_date', 'label', 'נשלחה', 'format', 'date', 'align', 'start'),
      jsonb_build_object('key', 'amount', 'label', 'סכום', 'format', 'money', 'align', 'end'),
      jsonb_build_object('key', 'days_overdue', 'label', 'ימי איחור', 'format', 'days', 'align', 'end')),
    'rows', v_rows,
    -- 📐23: פעולה קודמת לעובדה, והפועל נגזר מסוג-הדוח. מחושב — לא משפט קפוא שיתיישן.
    -- why (F9): בלי `תנאי_תשלום_ימים` כל ימי-האיחור הם `null` ⇒ "אין חוב מעל 60 יום" הוא
    --           הצהרה על מדידה שלא בוצעה. משפט-"אז מה" אינו אריח, ולכן הוא נשתק כאן במפורש.
    'so_what', case when v_terms is null then null
      when v_over60_n > 0 then
        'לגבות ' || v_lri || to_char(round(v_over60_sum), 'FM999,999,999') || ' ₪' || v_pdi
        || ' שממתינים מעל ' || v_lri || '60' || v_pdi || ' יום ב-' || v_lri || v_over60_n || v_pdi
        || case when v_over60_n = 1 then ' חשבונית' else ' חשבוניות' end
        || ' — הוותיקה כבר ' || v_lri || coalesce(v_oldest_days, 0) || v_pdi
        || case when coalesce(v_oldest_days, 0) = 1 then ' יום' else ' ימים' end
        || ', אצל ' || coalesce(v_oldest_name, '—') || '; יתרת-החוב כולה עומדת על '
        || v_lri || to_char(round(v_open_sum), 'FM999,999,999') || ' ₪' || v_pdi || '.'
      else 'אין חוב מעל ' || v_lri || '60' || v_pdi || ' יום; יתרת-החוב הפתוחה עומדת על '
        || v_lri || to_char(round(v_open_sum), 'FM999,999,999') || ' ₪' || v_pdi || '.' end,
    'definitions', 'יתרת-חוב פתוחה = חשבונית שנשלחה, טרם שולמה ולא נמחקה כחוב-אבוד · '
      || '"צפוי" = מועד חוזי (שליחה + ' || v_lri || coalesce(v_terms::text, '—') || v_pdi
      || ' ימי תנאי-תשלום) ועוד חציון-האיחור של אותו לקוח — הערכה, לא התחייבות · '
      || 'יתרת-חוב בסוף חודש = אותה הגדרה, נכון לערב האחרון של אותו חודש; העמודה האחרונה היא נכון להיום.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(), 'missing_params', to_jsonb(v_missing), 'frozen_count', null,
      'notes', jsonb_build_array(
        'חובות אבודים: ' || v_lri || v_written_n || v_pdi
          || case when v_written_n = 1 then ' חשבונית · ' else ' חשבוניות · ' end
          || v_lri || to_char(round(v_written_sum), 'FM999,999,999') || ' ₪' || v_pdi
          || ' — מוחרגים מהיתרה ומכל המדרגים.',
        'העמודה האחרונה בגרף היא נכון ל-' || v_lri || to_char(v_to, 'DD/MM') || v_pdi || ' ואינה סוף-חודש.',
        'יתרת-החוב, "צפוי להיכנס" וטבלת-הישנות הן צילום-רגע נכון להיום, ואינן זזות עם מסנן התקופה.'),
      'open_items', jsonb_build_object(
        'card_8_7_5', jsonb_build_object(
          'question', 'חלון שני האריחים התחתונים: החודש הקלנדרי (המוקאפ · הכרטיס ③ · התווית) או 30 יום נגללים (§📑ב)?',
          'calendar_month', jsonb_build_object('over_threshold', v_dev_n, 'denominator', v_dev_den,
            'hostess_pay', v_pay_sum, 'shifts', v_pay_shifts),
          'rolling_30', jsonb_build_object('over_threshold', v_dev_roll_n, 'denominator', v_dev_roll_den,
            'hostess_pay', v_pay_roll_sum))),
      'threshold_pct', v_threshold,
      'series_min', v_series_min,
      'top_overdue_customer', jsonb_build_object('name', v_top_name, 'amount', v_top_sum),
      'open_invoice_count', v_open_n,
      'asof', v_asof,
      'export_blocked_reason', null,
      'run', null)
  );
end;
$function$;

comment on function public.report_m07_finance_overview(date, date, integer, jsonb, date) is
  'מודול 11 · מבט-על כספים (מ7). אוכלוסייה: חשבוניות שנשלחו וטרם שולמו · הוצאו: חובות אבודים ופרויקטים שטרם חויבו. יתרת-החוב, הצפי וטבלת-הישנות הם צילום-רגע נכון להיום ואינם מושפעים ממסנן התקופה; p_asof קיים לשחזור האורקל בלבד והלקוח אינו שולח אותו. שני האריחים התחתונים נשענים על אוכלוסיית דוחות-הכסף (הכרעה 36): פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום. סף-החריגה נקרא מ-params. קריאה בלבד, מגודר על מודול כספים.';

revoke execute on function public.report_m07_finance_overview(date, date, integer, jsonb, date) from public, anon, authenticated;
grant execute on function public.report_m07_finance_overview(date, date, integer, jsonb, date) to authenticated;

-- ==================== 5 - report_m08_profitability ====================
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
          'label', 'אשתקד', 'note', null,
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
          'label', 'אשתקד',
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
          'value', round(v_prev_sum), 'label', 'אשתקד', 'note', null,
          'direction', case when v_over_sum > v_prev_sum then 'up'
                            when v_over_sum < v_prev_sum then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח בתקופה',
        'value', round(100 * v_margin, 1), 'format', 'percent', 'window', 'התקופה שנבחרה',
        'sub', 'סך הרווח חלקי סך ההכנסה, על אותה אוכלוסייה',
        'compare', jsonb_build_object('value', round(100 * v_prev_margin, 1),
          'label', 'אשתקד', 'note', null,
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
          'label', 'אשתקד', 'note', null,
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
      jsonb_build_object('key', 'project_id', 'label', 'פרויקט', 'format', 'id', 'align', 'start'),
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

-- ==================== 6 - report_m09_aging ====================
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
    || 'כל עמודה היא מדרג של איחור — כמה ימים עברו מאז שהחשבונית הייתה אמורה להשתלם — '
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
    || 'גובה העמודה = הסכום שממתין באותו מדרג; המספר שמתחת לשם המדרג = כמה חשבוניות.';

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
      jsonb_build_object('key', 'project_id', 'label', 'פרויקט', 'format', 'id', 'align', 'start'),
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
        jsonb_build_object('key', 'project_id', 'label', 'פרויקט', 'format', 'id', 'align', 'start'),
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

-- ==================== 7 - report_m12_equipment ====================
create or replace function public.report_m12_equipment(
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
  v_lri          constant text := chr(8294);
  v_pdi          constant text := chr(8297);
  v_today        date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to           date;
  v_from         date;
  v_prev_from    date;
  v_prev_to      date;
  v_total_rows   integer;
  v_future_rows  integer;
  v_sku_n        integer;
  v_cost_window  numeric;
  v_rows_window  integer;
  v_cost_all     numeric;
  v_planned_w    bigint;
  v_actual_w     bigint;
  v_prev_planned bigint;
  v_prev_actual  bigint;
  v_prev_cost    numeric;
  v_nosrc_n      integer;
  v_nosrc_sum    numeric;
  v_measured_n   integer;
  v_gap_pct      numeric;
  v_prev_gap_pct numeric;
  v_chart_cost   jsonb;
  v_chart_gap    jsonb;
  v_rows         jsonb;
  v_order_rows   jsonb;
  v_nosrc_rows   jsonb;
  v_top_order    text;
  v_top_qty      bigint;
  v_top_events   integer;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  v_to        := coalesce(p_to, v_today);
  v_from      := coalesce(p_from, date_trunc('year', v_to)::date);
  v_prev_from := (v_from - interval '1 year')::date;
  v_prev_to   := (v_to - interval '1 year')::date;

  with lines as (
    select l.project_id, l.sku, pr.item_name, pr.category,
           l.planned_qty, l.actual_qty, l.actual_qty_autofilled,
           l.quote_service_line_id, l.project_change_id,
           qs.closing_unit_cost, pc.unit_cost_snapshot,
           p.final_event_date, p.project_status, p.customer_id
      from public.logistics l
      join public.projects p on p.project_id = l.project_id
      left join public.quote_services qs on qs.line_id = l.quote_service_line_id
      left join public.project_changes pc on pc.change_id = l.project_change_id
      left join public.products pr on pr.sku = l.sku
     where (p_customer_id is null or p.customer_id = p_customer_id)
  ), priced as (
    -- מסלול-העלות: הצעה ⇐ `closing_unit_cost`; שינוי-תכולה ⇐ `unit_cost_snapshot`;
    -- בלי שניהם ⇒ **אין מחיר**, והשורה נכנסת למונה ㉗ (R4 · ה17) ולא לעלות.
    select ln.*, coalesce(ln.closing_unit_cost, ln.unit_cost_snapshot) as unit_cost from lines ln
  ), sku_unit as (
    -- מחיר-יחידה מוערך לשורות ㉗: ממוצע-המוצר, מוצהר על המסך כ"מחיר מוערך".
    select sku, sum(planned_qty * unit_cost) / nullif(sum(planned_qty) filter (where unit_cost is not null), 0) as est
      from priced group by sku
  )
  select (select count(*) from priced),
         (select count(*) from priced where final_event_date > v_to),
         (select count(distinct sku) from priced),
         (select coalesce(sum(round(planned_qty * unit_cost)), 0) from priced
            where final_event_date >= v_from and final_event_date <= v_to),
         (select count(*) from priced where final_event_date >= v_from and final_event_date <= v_to),
         (select coalesce(sum(round(planned_qty * unit_cost)), 0) from priced),
         (select coalesce(sum(planned_qty), 0) from priced
            where final_event_date >= v_from and final_event_date <= v_to),
         (select coalesce(sum(actual_qty), 0) from priced
            where final_event_date >= v_from and final_event_date <= v_to),
         (select coalesce(sum(planned_qty), 0) from priced
            where final_event_date >= v_prev_from and final_event_date <= v_prev_to),
         (select coalesce(sum(actual_qty), 0) from priced
            where final_event_date >= v_prev_from and final_event_date <= v_prev_to),
         (select coalesce(sum(round(planned_qty * unit_cost)), 0) from priced
            where final_event_date >= v_prev_from and final_event_date <= v_prev_to),
         (select count(*) from priced where quote_service_line_id is null and project_change_id is null),
         (select coalesce(sum(round(pc2.planned_qty * su.est)), 0)
            from priced pc2 join sku_unit su on su.sku = pc2.sku
           where pc2.quote_service_line_id is null and pc2.project_change_id is null),
         -- ⚠️ "בפועל" נמדד באמת רק בשורות שאינן מילוי-אוטומטי. המספר הזה **חייב** להופיע
         --    לצד אריח-הפער, אחרת הפער נקרא כחיסכון שנמדד.
         (select count(*) from priced where not actual_qty_autofilled),
         -- גרף א' — עלות פר-מוצר, כל המק"טים, ממוין לפי המדד שהוא מציג (📐7).
         (select coalesce(jsonb_agg(t order by (t ->> 'cost')::numeric desc), '[]'::jsonb) from (
            select jsonb_build_object('sku', sku, 'item_name', coalesce(item_name, sku),
                     'cost', coalesce(sum(round(planned_qty * unit_cost)), 0)) as t
              from priced group by sku, item_name) s),
         -- גרף ב' — הוזמן מול הגיע, **בלי יחידות-השירות** (📑ב#11: 118 מול 58,490 ⇒ קו-אפס).
         (select coalesce(jsonb_agg(t order by (t ->> 'ordered')::numeric desc), '[]'::jsonb) from (
            select jsonb_build_object('sku', sku, 'item_name', coalesce(item_name, sku),
                     'ordered', sum(planned_qty), 'arrived', sum(actual_qty)) as t
              -- `products.category` הוא ההבחנה, לא רשימת-מק"טים קשיחה: `01WEB` הוא `site`
              -- (יחידת-`פרויקט`), ושמונת התגים והשרוכים הם `product` (יחידת-`יחידה`).
              from priced where coalesce(category, '') = 'product'
              group by sku, item_name) s),
         -- הטבלה הראשית: פר-מוצר, כולל **עמודת "עלות מוזמנת (₪)"** (⏳13, הוכרע 15/09).
         (select coalesce(jsonb_agg(t order by (t ->> 'ordered_cost')::numeric desc), '[]'::jsonb) from (
            select jsonb_build_object('sku', sku, 'item_name', coalesce(item_name, sku),
                     'ordered', sum(planned_qty), 'arrived', sum(actual_qty),
                     'gap_units', sum(planned_qty) - sum(actual_qty),
                     'gap_pct', round(100.0 * (sum(planned_qty) - sum(actual_qty))
                                        / nullif(sum(planned_qty), 0), 1),
                     'ordered_cost', coalesce(sum(round(planned_qty * unit_cost)), 0),
                     -- why (F7): צורת-`drill_key` אחידה — `kind` + השדה המזהה.
                     'drill_key', jsonb_build_object('kind', 'sku', 'sku', sku)) as t
              from priced group by sku, item_name) s),
         -- טבלת-ההחלטה: כמה להזמין ל-30 הימים הקרובים. **מבוטלים מוחרגים** — שורה שכללה
         -- אירוע מבוטל ניפחה בעבר את הכמות, וזו הטבלה שממנה יוצאת הזמנת-רכש בפועל.
         (select coalesce(jsonb_agg(t order by (t ->> 'qty')::numeric desc), '[]'::jsonb) from (
            select jsonb_build_object('sku', sku, 'item_name', coalesce(item_name, sku),
                     'qty', sum(planned_qty), 'events', count(distinct project_id),
                     'drill_key', jsonb_build_object('kind', 'sku', 'sku', sku, 'upcoming', true)) as t
              from priced
             where final_event_date > v_to and final_event_date <= v_to + 30
               and project_status <> 'cancelled'
             group by sku, item_name) s),
         (select coalesce(jsonb_agg(jsonb_build_object(
            'project_id', pc3.project_id, 'sku', pc3.sku,
            'item_name', coalesce(pc3.item_name, pc3.sku),
            'planned_qty', pc3.planned_qty, 'actual_qty', pc3.actual_qty,
            'estimated_cost', round(pc3.planned_qty * su.est),
            'drill_key', jsonb_build_object('kind', 'project', 'id', pc3.project_id))), '[]'::jsonb)
            from priced pc3 join sku_unit su on su.sku = pc3.sku
           where pc3.quote_service_line_id is null and pc3.project_change_id is null),
         (select coalesce(item_name, sku) from priced
           where final_event_date > v_to and final_event_date <= v_to + 30 and project_status <> 'cancelled'
           group by sku, item_name order by sum(planned_qty) desc limit 1),
         (select sum(planned_qty) from priced
           where final_event_date > v_to and final_event_date <= v_to + 30 and project_status <> 'cancelled'
           group by sku order by sum(planned_qty) desc limit 1),
         (select count(distinct project_id)::integer from priced
           where final_event_date > v_to and final_event_date <= v_to + 30 and project_status <> 'cancelled'
           group by sku order by sum(planned_qty) desc limit 1)
    into v_total_rows, v_future_rows, v_sku_n, v_cost_window, v_rows_window, v_cost_all,
         v_planned_w, v_actual_w, v_prev_planned, v_prev_actual, v_prev_cost,
         v_nosrc_n, v_nosrc_sum, v_measured_n,
         v_chart_cost, v_chart_gap, v_rows, v_order_rows, v_nosrc_rows,
         v_top_order, v_top_qty, v_top_events;

  -- why (F10): הפער ותאומו אשתקד מחושבים פעם אחת לתוך משתנים, כדי שכיוון-ההשוואה יהיה
  --            השוואה בין שני מספרים ולא ביטוי מוצלב. הענף `else 'down'` הקודם החזיר
  --            "ירד" גם כשהמכנה של אשתקד היה 0, כלומר כשלא היה מה להשוות אליו.
  v_gap_pct      := round(100.0 * (v_planned_w - v_actual_w) / nullif(v_planned_w, 0), 1);
  v_prev_gap_pct := round(100.0 * (v_prev_planned - v_prev_actual) / nullif(v_prev_planned, 0), 1);

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_total_rows,
      -- why (F5): גם מונה-שורות הוא מספר בתוך משפט. ‏1771 בלי מפריד-אלפים הוא בדיוק
      --           הדפוס שהממצא מצא, ולא רק ב-₪.
      'label', 'אוכלוסייה: כל ' || v_lri || to_char(v_total_rows, 'FM999,999,999') || v_pdi
               || ' שורות הלוגיסטיקה, כלל-הזמנים, כולל פרויקטים מבוטלים · הוצאו: אין · '
               || v_lri || 'n=' || to_char(v_total_rows, 'FM999,999,999') || v_pdi || ', מתוכן '
               || v_lri || to_char(v_future_rows, 'FM999,999,999') || v_pdi
               || ' שייכות לאירועים שטרם התקיימו. בלוק ההזמנה למטה חותך לאירועים שטרם התקיימו ('
               || v_lri || to_char(v_to, 'DD/MM') || '–' || to_char(v_to + 30, 'DD/MM') || v_pdi || ').',
      'excluded', jsonb_build_object()),
    'window', jsonb_build_object('from', v_from, 'to', v_to,
      'label', v_lri || to_char(v_to, 'YYYY') || ' (' || to_char(v_from, 'DD/MM') || '–'
               || to_char(v_to, 'DD/MM') || ')' || v_pdi),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'cost_window', 'label', 'עלות ציוד בתקופה',
        'value', v_cost_window, 'format', 'money', 'count', v_rows_window,
        'sub', v_lri || v_rows_window || v_pdi
               || case when v_rows_window = 1 then ' שורת-לוגיסטיקה בתקופה' else ' שורות-לוגיסטיקה בתקופה' end,
        'window', 'התקופה שנבחרה',
        'compare', jsonb_build_object('value', v_prev_cost,
          'label', 'אשתקד', 'note', null,
          'direction', case when v_cost_window > v_prev_cost then 'up'
                            when v_cost_window < v_prev_cost then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object('key', 'gap_pct', 'label', 'פער הוזמן מול הגיע',
        'value', v_gap_pct, 'format', 'percent',
        -- why (F6): שני המספרים שהמוקאפ מדפיס מתחת ל-3.3% לא היו קיימים בפיילוד כלל.
        --           אחוז בלי מונה ומכנה הוא בדיוק מה ש-📑ב אוסר.
        'sub', v_lri || to_char(v_planned_w - v_actual_w, 'FM999,999,999') || v_pdi || ' יחידות מתוך '
               || v_lri || to_char(v_planned_w, 'FM999,999,999') || v_pdi || ' מתוכננות',
        'window', 'התקופה שנבחרה',
        'compare', case when v_prev_gap_pct is null then null else jsonb_build_object(
          'value', v_prev_gap_pct,
          'label', 'אשתקד',
          'note', v_lri || to_char(v_prev_planned - v_prev_actual, 'FM999,999,999') || v_pdi
                  || ' יחידות מתוך ' || v_lri || to_char(v_prev_planned, 'FM999,999,999') || v_pdi,
          'direction', case when v_gap_pct is null then null
                            when v_gap_pct > v_prev_gap_pct then 'up'
                            when v_gap_pct < v_prev_gap_pct then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'cost_all_time', 'label', 'עלות ציוד — כל הזמנים',
        'value', v_cost_all, 'format', 'money',
        'sub', 'סכום ' || v_lri || v_sku_n || v_pdi || ' המוצרים בטבלה למטה',
        'window', 'כל הזמנים',
        'compare', null, 'target', null),
      jsonb_build_object('key', 'no_cost_source', 'label', 'שורות ציוד במחיר מוערך',
        'value', v_nosrc_n, 'format', 'int', 'amount', v_nosrc_sum,
        'sub', 'מתוך ' || v_lri || to_char(v_total_rows, 'FM999,999,999') || v_pdi || ' שורות · כ-'
               || v_lri || to_char(round(v_nosrc_sum), 'FM999,999,999') || ' ₪' || v_pdi
               || ' שהמחיר שלהן מוערך',
        'window', 'כל הזמנים',
        'compare', null, 'target', null)),
    'chart', jsonb_build_array(
      jsonb_build_object('type', 'bar', 'title', 'עלות לפי מוצר',
      -- 🪤 I1 · **`chart.unit` הוא שם-פורמט של C8, לא מחרוזת-תצוגה.**
      --    ‏`ChartCard.valueFormat` מחזיר `series[0].format ?? unit` ומזין את
      --    ‏`formatAxisTick`, ו-`HebrewTooltip` מזין את `formatByType` — שניהם מצפים
      --    ל-`money|percent|int|ratio|score|days|text|date`. מחרוזת-תצוגה היא **פורמט
      --    לא-מוכר** ⇒ הציר נופל לקיבוץ-אלפים חשוף והטולטיפ ל-`text`.
      --    הכיתוב העברי נשמר ב-`unit_label` (תוספתי; **אין לו קורא היום** — מדווח).
        'series', jsonb_build_array(jsonb_build_object('key', 'cost', 'label', 'עלות מוזמנת',
                                                      'format', 'money')),
        'data', v_chart_cost, 'xKey', 'item_name', 'domain', null,
        'refLines', '[]'::jsonb, 'unit', 'money'),
      jsonb_build_object('type', 'bar', 'title', 'הוזמן מול הגיע',
        'series', jsonb_build_array(
          jsonb_build_object('key', 'ordered', 'label', 'הוזמן', 'format', 'int'),
          jsonb_build_object('key', 'arrived', 'label', 'הגיע', 'format', 'int')),
        'data', v_chart_gap, 'xKey', 'item_name', 'domain', null,
        -- הכיתוב העברי *"יחידות"* עובר ל-`unit_label` (תוספתי), ו-`unit` נוקב בפורמט.
        'refLines', '[]'::jsonb, 'unit', 'int', 'unit_label', 'יחידות')),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'item_name', 'label', 'מוצר (מק"ט)', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'ordered', 'label', 'הוזמן', 'format', 'int', 'align', 'end'),
      jsonb_build_object('key', 'arrived', 'label', 'הגיע', 'format', 'int', 'align', 'end'),
      jsonb_build_object('key', 'gap_units', 'label', 'פער יחידות', 'format', 'int', 'align', 'end'),
      jsonb_build_object('key', 'gap_pct', 'label', 'פער %', 'format', 'percent', 'align', 'end'),
      jsonb_build_object('key', 'ordered_cost', 'label', 'עלות מוזמנת (₪)', 'format', 'money', 'align', 'end')),
    'rows', v_rows,
    'so_what', case when v_top_order is not null then
        'להזמין ' || v_lri || to_char(v_top_qty, 'FM999,999,999') || v_pdi
        || case when v_top_qty = 1 then ' יחידה של "' else ' יחידות של "' end
        || v_top_order || '" ל-' || v_lri || v_top_events || v_pdi
        || case when v_top_events = 1 then ' האירוע שבחודש הקרוב' else ' האירועים שבחודש הקרוב' end
        || ' — הכמות הגדולה ביותר בטבלת-ההזמנה.'
      else 'אין אירועים בחודש הקרוב שדורשים הזמנת ציוד.' end,
    'definitions', '"הוזמן" = הכמות המתוכננת, והיא בסיס-החיוב והעלות · "הגיע" = הכמות בפועל, '
      || 'והיא שאלת-רכש בלבד · "עלות מוזמנת" = הוזמן × מחיר-העלות הקפוא בסגירת ההצעה · '
      || '"פער" = הפרש יחידות, לא ₪ · "כמות להזמנה" = מה שהוזמן לאירועים שטרם התקיימו בחודש '
      || 'הקרוב, והיא תקרה עליונה — המערכת אינה יודעת מה כבר הוזמן מהספק · '
      || '"מחיר מוערך" = שורה בלי קישור להצעה ובלי קישור לשינוי-תכולה, שמחירה חושב לפי ממוצע-המוצר.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(), 'missing_params', '[]'::jsonb, 'frozen_count', null,
      'notes', jsonb_build_array(
        'נמדד על ' || v_lri || to_char(v_measured_n, 'FM999,999,999') || v_pdi || ' שורות מתוך '
          || v_lri || to_char(v_total_rows, 'FM999,999,999') || v_pdi
          || ' — בשאר, "הגיע בפועל" הועתק מהמתוכנן ולא נמדד.',
        v_lri || v_nosrc_n || v_pdi
          || case when v_nosrc_n = 1 then ' שורת ציוד ללא מקור-עלות · כ-' else ' שורות ציוד ללא מקור-עלות · כ-' end
          || v_lri || to_char(round(v_nosrc_sum), 'FM999,999,999') || ' ₪' || v_pdi
          || ' — מחירן מוערך לפי ממוצע-המוצר ואינו נמדד.',
        '"כמות להזמנה" היא תקרה עליונה: יש להפחית ממנה הזמנות-רכש שכבר יצאו.'),
      -- חוזה-C8 נושא טבלה אחת לדף, ולדף הזה שלוש (הכרעה 24 · ח5 ו-㉗). השתיים המשניות
      -- יושבות כאן ולא בשורש, כדי לא להוסיף מפתח עליון שאינו בחוזה.
      'extra_tables', jsonb_build_array(
        jsonb_build_object('key', 'upcoming_orders', 'title', 'כמה להזמין לחודש הקרוב',
          'columns', jsonb_build_array(
            jsonb_build_object('key', 'item_name', 'label', 'מוצר (מק"ט)', 'format', 'text', 'align', 'start'),
            jsonb_build_object('key', 'qty', 'label', 'כמות להזמנה', 'format', 'int', 'align', 'end'),
            jsonb_build_object('key', 'events', 'label', 'אירועים', 'format', 'int', 'align', 'end')),
          'rows', v_order_rows),
        jsonb_build_object('key', 'no_cost_source', 'title', 'שורות ציוד במחיר מוערך',
          'columns', jsonb_build_array(
            jsonb_build_object('key', 'project_id', 'label', 'פרויקט', 'format', 'id', 'align', 'start'),
            jsonb_build_object('key', 'item_name', 'label', 'מוצר (מק"ט)', 'format', 'text', 'align', 'start'),
            jsonb_build_object('key', 'planned_qty', 'label', 'מתוכנן', 'format', 'int', 'align', 'end'),
            jsonb_build_object('key', 'actual_qty', 'label', 'בפועל', 'format', 'int', 'align', 'end'),
            jsonb_build_object('key', 'estimated_cost', 'label', 'עלות מוערכת (₪)', 'format', 'money', 'align', 'end')),
          'rows', v_nosrc_rows)),
      'measured_rows', v_measured_n,
      -- why (F10): הכרטיס כותב "9 מק"טים" ולמספר לא היה בית בפיילוד. הוא חושב ולא הוחזר.
      'sku_count', v_sku_n,
      'gap_units', jsonb_build_object('planned', v_planned_w, 'actual', v_actual_w,
        'gap', v_planned_w - v_actual_w),
      'export_blocked_reason', null,
      'run', null)
  );
end;
$function$;

comment on function public.report_m12_equipment(date, date, integer, jsonb) is
  'מודול 11 · צריכת ציוד (מ12). אוכלוסייה: כל שורות הלוגיסטיקה, כלל-הזמנים, כולל פרויקטים מבוטלים · הוצאו: אין. בלוק ההזמנה חותך לאירועים שטרם התקיימו ב-30 הימים הקרובים ומחריג מבוטלים. בסיס-הכמות הוא planned_qty (המוזמן) לפי הכרעה 5; actual_qty מוצג כעמודת-פער בלבד. קריאה בלבד, מגודר על מודול כספים.';

revoke execute on function public.report_m12_equipment(date, date, integer, jsonb) from public, anon, authenticated;
grant execute on function public.report_m12_equipment(date, date, integer, jsonb) to authenticated;

-- ==================== 8 - report_m14_hostess_overview ====================
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
  -- 🪤 J2 · שני הקבועים האלה **לא היו בפונקציה הזו כלל** — היא היחידה
  --    בקובץ שכתבה רצפי-ספרות בתוך עברית בלי בידוד. הם נוספים כאן
  --    עבור תווית-החודש בלבד (ר' הגרף למטה), ולא כדי לשכתב את שאר
  --    המשפטים — זה סבב אחר, והוא מדווח.
  v_lri         constant text := chr(8294);   -- U+2066 LRI
  v_pdi         constant text := chr(8297);   -- U+2069 PDI
  v_months_he   constant text[] := array['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
                                         'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
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
                 -- 🪤 J2 · **הציר הדפיס `2025-09` — צורת-מכונה על מסך של מנהלת.**
                 --    ‏`month` נשאר המפתח (וגם מפתח-המיון של `jsonb_agg` מתחת),
                 --    ו-`label` הוא שם-החודש העברי + שנה — החלון כאן הוא 12
                 --    חודשים ולכן הוא **תמיד** חוצה שתי שנים, והשנה אינה מיותרת.
                 'month',   to_char(date_trunc('month', event_date), 'YYYY-MM'),
                 'label',   v_months_he[extract(month from date_trunc('month', event_date))::integer]
                            || ' ' || v_lri || to_char(date_trunc('month', event_date), 'YYYY') || v_pdi,
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
        -- 🪤 J2 · המשפט הזה יושב **מתחת לאותו גרף** ואמר `09/2025` בזמן
        --    שהציר מעליו אומר 'ספטמבר ⁦2025⁩'. אותה צורה, אותו מסך.
        select v_months_he[extract(month from date_trunc('month', event_date))::integer]
               || ' ' || v_lri || to_char(date_trunc('month', event_date), 'YYYY') || v_pdi as m, count(*) as c
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
          'value', v_prev_pct, 'label', 'אשתקד',
          'direction', case when v_on_time_pct > v_prev_pct then 'up' when v_on_time_pct < v_prev_pct then 'down' else 'flat' end) end,
        -- 🪤 I2 · לאריח הזה יש יעד טבעי —
        --    דף-האמינות, שמפרק את אותה הגעה-בזמן לאיחור/הבריזה ולציון פר-דיילת.
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'report_m15_reliability', 'drill', null),
        'sub', to_char(coalesce(v_on_time, 0), 'FM999,999,999') || ' מתוך ' ||
                  to_char(coalesce(v_obs, 0), 'FM999,999,999') || ' שיבוצים'),
      jsonb_build_object('key', 'red_hostesses', 'label', 'דיילות אדומות', 'value', v_red, 'format', 'int',
        'window', 'חלון קבוע · 12 חודשים',
        'compare', case when v_prev_red is null then null else jsonb_build_object(
          'value', v_prev_red, 'label', 'אשתקד',
          'direction', case when v_red > v_prev_red then 'up' when v_red < v_prev_red then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'report_m15_reliability', 'drill', null),
        'sub', to_char(coalesce(v_red, 0), 'FM999,999,999') || ' מתוך ' || to_char(coalesce(v_in_report, 0), 'FM999,999,999') || ' דיילות עם ' ||
                  coalesce(to_char(v_min_sample, 'FM999,999,999'), '—') || ' משמרות ומעלה · ' || to_char(coalesce(v_amber, 0), 'FM999,999,999') ||
                  ' בענבר · ' || to_char(coalesce(v_red_active, 0), 'FM999,999,999') || ' מהאדומות פעילות'),
      jsonb_build_object('key', 'gini', 'label', 'ריכוזיות המשמרות', 'value', round(v_gini, 4), 'format', 'gini',
        'window', v_win_text,
        'compare', case when v_gini_prev is null then null else jsonb_build_object(
          'value', round(v_gini_prev, 4), 'label', 'אשתקד (n=' || v_gini_prev_n || ')',
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
      'data', coalesce(v_chart, '[]'::jsonb), 'xKey', 'label',
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

-- ==================== 9 - report_m15_reliability ====================
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
    'window', jsonb_build_object('from', v_from, 'to', v_to, 'label', 'חלון קבוע · 12 החודשים האחרונים'),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'on_time', 'label', 'הגעה בזמן',
        'value', round(100.0 * v_on_time / nullif(v_obs, 0), 1), 'format', 'percent',
        'window', 'חלון קבוע · 12 חודשים',
        'compare', case when v_prev_obs = 0 then null else jsonb_build_object(
          'value', round(100.0 * v_prev_on / nullif(v_prev_obs, 0), 1), 'label', 'אשתקד',
          'direction', case when v_on_time * v_prev_obs > v_prev_on * v_obs then 'up'
                            when v_on_time * v_prev_obs < v_prev_on * v_obs then 'down' else 'flat' end) end,
        'target', null, 'sub', to_char(coalesce(v_on_time, 0), 'FM999,999,999') || ' מתוך ' ||
                                  to_char(coalesce(v_obs, 0), 'FM999,999,999')),
      jsonb_build_object('key', 'late', 'label', 'איחור',
        'value', round(100.0 * v_late / nullif(v_obs, 0), 1), 'format', 'percent',
        'window', 'חלון קבוע · 12 חודשים',
        'compare', case when v_prev_obs = 0 then null else jsonb_build_object(
          'value', round(100.0 * v_prev_late / nullif(v_prev_obs, 0), 1), 'label', 'אשתקד',
          'direction', case when v_late * v_prev_obs > v_prev_late * v_obs then 'up'
                            when v_late * v_prev_obs < v_prev_late * v_obs then 'down' else 'flat' end) end,
        'target', null, 'sub', to_char(coalesce(v_late, 0), 'FM999,999,999') || ' שיבוצים, מהם ' || to_char(coalesce(v_late_heavy, 0), 'FM999,999,999') || ' באיחור רב'),
      jsonb_build_object('key', 'no_show', 'label', 'אי-הגעה (הבריזה)',
        'value', round(100.0 * v_ghosted / nullif(v_obs, 0), 1), 'format', 'percent',
        'window', 'חלון קבוע · 12 חודשים',
        'compare', case when v_prev_obs = 0 then null else jsonb_build_object(
          'value', round(100.0 * v_prev_ghost / nullif(v_prev_obs, 0), 1), 'label', 'אשתקד',
          'direction', case when v_ghosted * v_prev_obs > v_prev_ghost * v_obs then 'up'
                            when v_ghosted * v_prev_obs < v_prev_ghost * v_obs then 'down' else 'flat' end) end,
        'target', null, 'sub', to_char(coalesce(v_ghosted, 0), 'FM999,999,999') || ' שיבוצים · ' || to_char(coalesce(v_withdrew, 0), 'FM999,999,999') || ' ביטלו אחרי אישור'),
      jsonb_build_object('key', 'flagged', 'label', 'דיילות מסומנות', 'value', v_flagged, 'format', 'int',
        'window', 'חלון קבוע · 12 חודשים',
        'compare', case when v_prev_flag is null then null else jsonb_build_object(
          'value', v_prev_flag, 'label', 'אשתקד',
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
      'שתי עמודות אי-ההגעה, ואף אחת מהן אינה "הנכונה": "הבריזה · ב-12 חודשים" היא ההגדרה שהציון עצמו עובד לפיה — רק אי-הגעה בלי הודעה, ורק בחלון הקבוע · ' ||
      '"אי-הגעה · אי-פעם" היא כל סיבות אי-ההגעה — כולל מחלה והיעדרות באישור — ועל כל ההיסטוריה. שתיהן נכונות בהגדרתן, והדוח אינו בוחר ביניהן · ' ||
      'הבריזה = לא הגיעה ולא הודיעה — רק היא מאפסת את הציון של אותה משמרת · ' ||
      'ביטלה אחרי אישור = הודיעה שלא תגיע אחרי שכבר אושרה סופית — נספר כחצי משמרת · ' ||
      'החלון = 12 חודשים אחורה מהיום, קבוע ואינו נגרר אחרי מסנן-התקופה · ' ||
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
        'note', 'שתי העמודות נמדדות על מכנים שונים: "12 חודשים" סופרת הבריזה בלבד מתוך השיבוצים שסומנה בהם נוכחות בחלון הקבוע, ו"אי-פעם" סופרת כל סיבות אי-ההגעה מתוך כל ההיסטוריה המסומנת. אפשר להשוות בין דירוגים בתוך עמודה, לא בין העמודות.',
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

-- ==================== 10 - report_m17_fairness ====================
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
      'label', 'אוכלוסייה: כל דיילת עם משמרת מאושרת אחת לפחות בחלון — ' ||
               v_lri || 'n=' || coalesce(v_n, 0) || v_pdi || ' דיילות, ' ||
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
          'label', 'אשתקד · ' || v_lri || 'n=' || coalesce(v_n_prev, 0) || v_pdi ||
                   ' מול ' || v_lri || 'n=' || coalesce(v_n, 0) || v_pdi || ' היום',
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
                    -- 🪤 I2 · מילת-יחס ואחריה קו-מפריד (`נמדד מ-—`) אינה עברית.
                    then 'טרם נמדד · אין עדיין נתון: המערכת התחילה לרשום את הדרג שהמליצה רק מעכשיו, ועד שייצברו שיבוצים המדד מציג "—" ולא ' ||
                         v_lri || '0%' || v_pdi
                    else 'נמדד מ-' || v_lri || to_char(v_rank_from, 'DD/MM/YYYY') || v_pdi || '; ' ||
                         v_lri || v_rank_total || v_pdi || ' שיבוצים' end,
        'window', case when coalesce(v_rank_total, 0) = 0 then 'טרם נמדד'
                       else 'נמדד מ-' || v_lri || to_char(v_rank_from, 'DD/MM/YYYY') || v_pdi end,
        'compare', null, 'target', null),
      -- 🪤 I1 · **המדד בשעות, וההכרזה אמרה `days`** ⇒ `reportsFormat.days` מעגל ומוסיף
      --    "ימים": `9.9` הופיע על המסך כ-"10 ימים". הכרטיס §③ נוקב ביחידה במפורש
      --    (*"זמן-תגובה חציוני 9.9 שעות"* · *"אחוזון-90 20.7 שעות"*). ‏`ratio` = ספרה
      --    עשרונית אחת בלי יחידה, ואותה הכרזה כבר משרתת את עמודת-השעות ב-`extra_tables`.
      --    התווית **אינה** נוגעת — `spec.md §1.4` כותב אותה בלי יחידה; היחידה יושבת ב-`sub`.
      jsonb_build_object('key', 'median_response', 'label', 'זמן-תגובה חציוני לזימון',
        'value', round(v_med_hours, 1), 'format', 'ratio',
        'sub', 'שעות, מרגע שליחת הזימון האחרון ועד שהדיילת ענתה · ' ||
               v_lri || to_char(coalesce(v_answered, 0), 'FM999,999') || v_pdi || ' תשובות',
        'window', v_win_text,
        'compare', case when v_prev_med is null then null else jsonb_build_object(
          'value', round(v_prev_med, 1), 'label', 'אשתקד', 'note', null,
          'direction', case when v_med_hours > v_prev_med then 'up' when v_med_hours < v_prev_med then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'p90_response', 'label', 'זמן-תגובה, אחוזון 90',
        'value', round(v_p90_hours, 1), 'format', 'ratio',
        -- היחידה נכנסת ל-`sub` ולא לתווית: תווית-האריח היא `spec.md §1.4` מילה-במילה,
        -- ותת-השורה של אריח-החציון שלמעלה כבר פותחת ב-"שעות" — שני האריחים אומרים אותו דבר.
        'sub', 'שעות · אחת מכל עשר תשובות מגיעה לאט מזה — שם יושב הכאב של איוש שנתקע, לא בחציון',
        'window', v_win_text,
        'compare', case when v_prev_p90 is null then null else jsonb_build_object(
          'value', round(v_prev_p90, 1), 'label', 'אשתקד', 'note', null,
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
          'value', round(100.0 * v_prev_ans / nullif(v_prev_inv, 0), 1), 'label', 'אשתקד',
          'note', v_lri || to_char(coalesce(v_prev_ans, 0), 'FM999,999') || v_pdi || ' מתוך ' ||
                  v_lri || to_char(coalesce(v_prev_inv, 0), 'FM999,999') || v_pdi,
          'direction', case when v_answered * v_prev_inv > v_prev_ans * v_invites then 'up'
                            when v_answered * v_prev_inv < v_prev_ans * v_invites then 'down' else 'flat' end) end,
        'target', null)),
    'chart', jsonb_build_object(
      'type', 'lorenz', 'title', 'עקומת לורנץ · חלוקת המשמרות בין הדיילות',
      -- 🪤 I1 · פסקת-הפירוש של המוקאפ המאושר (`04_tab_hostesses_approved.html`,
      --    `p.chart-note` מתחת לכותרת) — **רכיב רמה-0** לפי מבחן-המחיקה של הכרטיס ⑩,
      --    ולא היה במטען כלל. בלעדו האלכסון שלמטה הוא קו בלי שם.
      'note', 'הקו הישר הוא חלוקה שווה לגמרי. ככל שהעקומה נופלת ממנו, החלוקה ריכוזית יותר, '
              'והשטח שביניהם הוא בדיוק מה שמדד ג''יני מודד. הדיילות מסודרות מהפחות-עמוסה '
              'משמאל לעמוסה-ביותר מימין.',
        -- 🪤 I1 · `series[].format` הוא הקודם ל-`unit` בגזירת תו-הסימון
        --    ובטולטיפ, והוא היה `null`. הערכים עצמם אינם זזים.
      'series', jsonb_build_array(jsonb_build_object('key', 'y', 'label', 'אחוז-משמרות מצטבר',
                                                    'format', 'percent')),
      'data', coalesce(v_lorenz, '[]'::jsonb), 'xKey', 'x',
      'domain', jsonb_build_array(0, 100),
      'refLines', jsonb_build_array(
        -- 🪤 I1 · קו-השוויון היה **חסר לגמרי במטען**, ו-📐6 מחייב אותו: עקומת-לורנץ
        --    נמדדת **מול** האלכסון, ובלעדו הגרף הוא קו בלי בסיס. `ChartCard`
        --    מצייר `axis:'diagonal'` דרך `ReferenceLine segment` (הרכיב כבר תומך).
        -- 🔑 **הקצוות הם 0–100 ולא 0–1**: `v_lorenz` מחזיק אחוזים, ו-`domain` של הגרף
        --    נעול על `[0,100]` בשני הצירים (📐6 · כרטיס §③) — וזה גם הברירת-המחדל
        --    של הרכיב. התווית היא *"חלוקה שווה"* — נוסח המוקאפ והכרטיס ⑩ב.
        -- ➕ **נוסף ראשון ולא במקום:** קו-החציון הקיים נשאר — הכרטיס מחייב את שניהם.
        jsonb_build_object('axis', 'diagonal',
          'from', jsonb_build_object('x', 0, 'y', 0),
          'to',   jsonb_build_object('x', 100, 'y', 100),
          'label', 'חלוקה שווה'),
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

-- ==================== 11 - report_m19_customers_overview ====================
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
  -- סבב 3 · פילוח-השנים כמחרוזת מוכנה לחצי-ההשוואה.
  v_other_year_txt text;
  -- שמות-החודשים, אותה רשימה שבמיגרציית ההנהלה (`to_char` מחזיר אנגלית).
  v_months_he constant text[] := array['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
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

  -- 🪤 I1 · **חצי-ההשוואה חזר על ערך-האריח עצמו** (`▲פילוח לפי שנה: 33`),
  --    בעוד המוקאפ המאושר מצייר באותו מקום את הפילוח לפי שנה.
  --    המספרים ישבו כבר ב-`detail.by_year` ולא הגיעו למסך.
  -- 🔑 **המחרוזת נקייה מעברית במכוון:** ‏`KpiTile` עוטף את `compare.value`
  --    ב-`<Ltr dir="ltr">`, ומילה עברית בתוכו היתה מתהפכת. הסייג יושב בתווית.
  select string_agg(v_lri || e.key || v_pdi || ': ' || v_lri || e.value || v_pdi, ' · ' order by e.key)
    into v_other_year_txt
    from jsonb_each_text(coalesce(v_other_year, '{}'::jsonb)) as e(key, value);

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
           -- 🪤 I1 · ציר-הקטגוריה חסר-פורמטר **במכוון** (`ChartCard.categoryAxis`),
           --    ולכן `xKey` הצביע על `2026-01` והודפס כמות-שהוא — גם בציר וגם
           --    בטבלת קורא-המסך. אותו פתרון של מ3: מפתח `label` עברי, ו-`xKey` עליו.
           --    `month` נשמר — שום מפתח לא נמחק.
           'month', t.ym, 'label', t.he_label,
           'avg_score', t.avg_score, 'n', t.n) order by t.ym), '[]'::jsonb)
    into v_chart
    from (select to_char(date_trunc('month', p.final_event_date), 'YYYY-MM') as ym,
                 -- 🪤 J2 · **השנה נאמרת רק כשהיא מבדילה.** הציר הזה הדפיס
                 --    'ינואר ⁦2026⁩' גם על טווח שכולו בתוך 2026, בעוד מ2/מ3 מדפיסים
                 --    'ינואר' לבדו על ציר חד-שנתי. הכלל האחד: שם-חודש עברי,
                 --    ‏+ שנה רק כשהחלון חוצה יותר משנה קלנדרית אחת — ואז גם
                 --    אין שתי שורות שנושאות אותה תווית.
                 v_months_he[extract(month from p.final_event_date)::integer]
                   || case when to_char(v_from, 'YYYY') = to_char(v_to, 'YYYY') then ''
                           else ' ' || v_lri || to_char(p.final_event_date, 'YYYY') || v_pdi
                      end as he_label,
                 round(avg(p.feedback_score)::numeric, 2)                    as avg_score,
                 count(*)::integer                                           as n
            from public.projects p
           where p.feedback_status = 'completed' and p.feedback_score is not null
             and p.final_event_date between v_from and v_to
             and (p_customer_id is null or p.customer_id = p_customer_id)
           group by 1, 2) t;

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
                   -- 🪤 I1 · המוקאפ מצייר `4.63 · n=129`; העמודה הוצהרה `ratio`
                   --    (ספרה אחת) ובלי גודל-מדגם. **אותו דפוס של `score_pair` במ21**:
                   --    תא אחד מורכב, ושני המספרים הגולמיים נשארים במטען ללא שינוי.
                   'avg_feedback_pair', case when f.avg_score is null then null
                     else v_lri || to_char(f.avg_score, 'FM990.00') || v_pdi
                          || ' · ' || v_lri || 'n=' || coalesce(f.n, 0) || v_pdi end,
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
        'sub', 'חציון ימים מאז האירוע האחרון: לקוחות מרוצים (ממוצע 4.5+) מול לקוחות לא-מרוצים (ממוצע מתחת ל-3.5) · הבינוניים באמצע: '
               || v_lri || coalesce(v_mid_med::text, '—') || v_pdi || ' ימים',
        'detail', jsonb_build_object('buckets', v_buckets, 'in_buckets', v_in_buckets, 'below_min_sample', v_below),
        'window', 'כל הזמנים · ' || v_lri || to_char(v_in_buckets, 'FM999,999,999') || v_pdi || ' לקוחות עם '
                  || v_lri || coalesce(v_min_n::text, '—') || '+' || v_pdi
                  || ' משובים · אינו מושפע ממסנן התקופה',
        'compare', case when v_uns_med is null then null else jsonb_build_object(
          'value', v_uns_med,
          -- 🪤 I2 · התווית הייתה משפט שלם שנושא מספר משלו, והערך נדבק אחריה
          --    עם נקודתיים שניות. התווית מתקצרת לבסיס-ההשוואה בלבד,
          --    וחציון-הבינוניים עובר ל-`sub` (וכבר יושב ב-`detail.buckets`).
          'label', 'לקוחות לא-מרוצים',
          'direction', 'flat') end,
        'target', jsonb_build_object('tab', 'לקוחות', 'report', 'report_m20_satisfaction', 'drill', null)),
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
        'compare', jsonb_build_object(
          'value', coalesce(v_other_year_txt, '—'),
          'label', 'פילוח לפי שנה (השנה הנוכחית חלקית)', 'direction', 'flat'),
        'target', jsonb_build_object('tab', 'לקוחות', 'report', 'report_m22_notes', 'drill', null)),
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
          -- 🪤 I2 · התווית הדפיסה 'מקום N' והערך הוא אותו N. המספר
          --    נשאר פעם אחת בלבד, בערך, והתווית מסתיימת בשם-המדד.
          'label', 'הגדול הראשון שכן: ' || (v_conc #>> '{first_drifting,company_name}')
                   || ' — שקטה ' || v_lri || (v_conc #>> '{first_drifting,days_since}') || v_pdi
                   || ' ימים מול קצב של ' || v_lri || (v_conc #>> '{first_drifting,cadence}') || v_pdi
                   || ' · מקומו ברשימת המניבים',
          'direction', 'flat') end,
        'target', jsonb_build_object('tab', 'לקוחות', 'report', 'report_m21_drifting', 'drill', null)),
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
        -- 🪤 I1 · **חצי-ההשוואה נושא ספירת-חשבוניות, והאריח הוא `days`** ⇒
        --    ‏`CompareLine` נפל ל-`tile.format` והמסך הדפיס *"על 675 חשבוניות ששולמו: 675 ימים"*.
        --    ‏`format: 'int'` — הערך הוא מניין, לא יחידת-זמן.
        'compare', jsonb_build_object(
          'value', v_pay_n, 'format', 'int',
          'label', 'על ' || v_lri || to_char(v_pay_n, 'FM999,999') || v_pdi || ' חשבוניות ששולמו',
          'direction', 'flat'),
        -- הכרעה 33 — דלת חוצת-לשונית. ⚠️ ⑧19.2 עדיין 🔵 פתוח: למי שממוסכת על 'כספים'
        -- ההמלצה בכרטיס היא להסתיר את שורת-היעד ולהשאיר את הנתון. **ההכרעה של ישי**,
        -- והמיסוך הוא של הלשונית — ה-RPC מחזיר את היעד ואינו מחליט עליו.
        'target', jsonb_build_object('tab', 'כספים', 'report', 'report_m09_aging', 'drill', null))),
    'chart', jsonb_build_object(
      'type', 'line',
      'title', 'ממוצע שביעות-הרצון לפי חודש · '
               || v_lri || to_char(v_from, 'MM/YYYY') || '–' || to_char(v_to, 'MM/YYYY') || v_pdi,
        -- 🪤 I1 · `series[].format` הוא הקודם ל-`unit` בגזירת תו-הסימון
        --    ובטולטיפ, והוא היה `null`. הערכים עצמם אינם זזים.
      'series', jsonb_build_array(jsonb_build_object('key', 'avg_score', 'label', 'ממוצע שביעות-רצון',
                                                    'format', 'ratio')),
      'data', v_chart,
      'xKey', 'label',
      'domain', jsonb_build_array(1, 5),
      'refLines', case when v_ref_avg is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object(
        'axis', 'y', 'value', v_ref_avg,
        'label', 'ממוצע ' || v_lri || to_char(date_trunc('year', v_to) - interval '1 year', 'YYYY') || v_pdi
                 || ' המלאה: ' || v_lri || v_ref_avg || v_pdi
                 || ' על ' || v_lri || to_char(v_ref_n, 'FM999,999,999') || v_pdi || ' משובים')) end,
      -- 🪤 I1 · **`chart.unit` הוא שם-פורמט של C8, לא מחרוזת-תצוגה.**
      --    ‏`ChartCard.valueFormat` מחזיר `series[0].format ?? unit` ומזין את
      --    ‏`formatAxisTick`, ו-`HebrewTooltip` מזין את `formatByType` — שניהם מצפים
      --    ל-`money|percent|int|ratio|score|days|text|date`. מחרוזת-תצוגה היא **פורמט
      --    לא-מוכר** ⇒ הציר נופל לקיבוץ-אלפים חשוף והטולטיפ ל-`text`.
      --    הכיתוב העברי נשמר ב-`unit_label` (תוספתי; **אין לו קורא היום** — מדווח).
      'unit', 'ratio', 'unit_label', 'ציון'),
    -- I1 · §9 D-30 ③ — ערך-החוזה של `target.report` הוא **שם ה-RPC**; ארבעת היעדים למעלה
    -- נשאו את השם העברי. הנתב מקבל את שניהם, ולכן זו יישור-חוזה ולא תיקון-שבר.
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'company_name',  'label', 'לקוח',                'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'customer_type', 'label', 'סוג הלקוח',           'format', 'text',  'align', 'start',
                         'label_source', 'CUSTOMER_TYPE_LABELS'),
      -- 📐9 · `aria-sort` על העמודה הממוינת. `ReportSurface` גוזר אותו **אך ורק** מ-
      -- ‏`columns[].sorted` (C8, תוספת 16/09) — בלי המפתח אין `aria-sort` על המסך כלל.
      jsonb_build_object('key', 'revenue_12m',   'label', 'הכנסת 12 החודשים',    'format', 'money', 'align', 'end',
                         'sorted', 'descending'),
      -- 🪤 I1 · העמודה מצביעה על התא המורכב; `avg_feedback` ו-`feedback_n` נשארים במטען.
      jsonb_build_object('key', 'avg_feedback_pair', 'label', 'ממוצע המשוב שלו', 'format', 'text', 'align', 'end'),
      -- 🪤 I1 · שתי העמודות נושאות `date` של Postgres ⇒ במטען הן `"2026-09-15"`, ו-`text`
      --    הדפיס את ה-ISO כמות-שהוא. ‏`date` מנתב ל-`formatIsraelDate` ⇒ `15/09/2026`.
      jsonb_build_object('key', 'last_event',    'label', 'אירוע אחרון',         'format', 'date',  'align', 'start'),
      jsonb_build_object('key', 'next_event',    'label', 'האירוע הבא',          'format', 'date',  'align', 'start')),
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

-- ==================== 12 - report_m20_satisfaction ====================
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
          'label', 'אשתקד (' || v_lri || to_char(v_p_sat, 'FM999,999,999') || v_pdi || ' מתוך '
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
          'label', 'אשתקד (' || v_lri || to_char(v_p_comp, 'FM999,999,999') || v_pdi || ' מתוך '
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
          'label', 'אשתקד',
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
          'label', 'אשתקד, מתוך '
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

-- ==================== 13 - report_m22_notes ====================
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
  -- 🪤 J2 · **`v_from` נמחק, ולא הושתק.** הוא חושב כאן בשורה אחת
  --    ומעולם לא הופיע באף שאילתה — רק הודהד ל-`window.from`, וזה
  --    הספיק כדי שהמעטפת תצייר לדף הזה כותרת-תקופה ותשאיר את
  --    שבבי-התקופה דלוקים, בעוד שורת-האוכלוסייה שמתחתיה אומרת
  --    *"הדף אינו מגיב למסנן התקופה"*. שתי הצהרות סותרות על מסך אחד.
  --    ‏`window.from = null` הוא הסימן שהמעטפת קוראת (`ReportsPage.readScope`),
  --    ו-`meta.period_filter_ignored` הוא ההד המפורש — התקדים הוא מ9.

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
      'from', null, 'to', v_to,
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
      'period_filter_ignored', jsonb_build_object('p_from', p_from, 'p_to', p_to),
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

