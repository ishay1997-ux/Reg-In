-- why: הכרעת-ישי, 24/09/2026 (אחרי השופט והיועץ): *"אני מסכים עם השופט האמת והמלצת היועץ... באמת
--      לא היה מובן החלקים האלא"*. ⇐ בדוח "הוגנות בחלוקת משמרות" (‏`report_m17_fairness`) אין יותר
--      מונח אקדמי על המסך: אריח מדד-הריכוזיות (0–1) יורד, וגרף העקומה המצטברת מוחלף בגרף-עמודות
--      של ארבעה רבעים. האריח "רבע הדיילות העמוסות" נשאר, ומקבל השוואה לאשתקד על אותו מדד.
--      📏 נמדד לפני הכתיבה (24/09, קריאה בלבד, `pg_get_functiondef` חי, md5
--         `de862cf19f10437b664b5c2989edff06`, ‏24,756 תווים).
--      📏 היום, חלון ברירת-המחדל (25/09/2025–24/09/2026): 106 דיילות · 1,895 משמרות. הרבעים:
--         56.0 · 28.4 · 12.5 · 3.1 (סכום 100.0; ‏27/27/26/26 דיילות). אשתקד: 97 דיילות · 1,444
--         משמרות · 54.6 · 28.2 · 13.5 · 3.7. ⇐ האריח 56.0 מול 54.6 אשתקד.
--      🔑 כלל-הרבעים: ‏`ntile(4)` על מיון-יורד לפי משמרות (ושובר-שוויון `hostess_id`) — הרבע
--         הראשון הוא בדיוק `ceil(n/4)` הדיילות העמוסות, כלומר **אותו כלל שהאריח כבר השתמש בו**
--         (‏`rn_desc <= ceil(n/4)`; נמדד: 56.0 בשני הכללים). האריח והעמודה הראשונה נקראים מאותו
--         `quarter = 1`, ולכן לא יכולים לסטות זה מזה.
--      🔎 מוצג למשתמשת? כן — האריחים, הגרף (כותרת · סדרה · קו-ייחוס), `definitions` (חלונית-ההיקף)
--         ו-`so_what`. ‏`meta.previous.gini` ⇐ `meta.previous.top_quarter_pct`.
--      ✂️ יורד גם: קו-הייחוס "מחצית הדיילות = X% מהמשמרות" ופסקת-הפירוש של העקומה — שניהם
--         מתארים את העקומה שירדה. ‏`so_what` נשאר מילה-במילה; התנאי שלו עבר מ-`v_gini is null`
--         ל-`coalesce(v_n, 0) < 2` — שקול בדיוק (המדד הישן היה null רק כשפחות משתי דיילות).
-- what: שבע החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר. הדפוס:
--       `20260924213000_module11_m02_revenue_tile_no_door.sql`. ארבעה בלוקים גדולים מוחלפים
--       כ"מסמן-התחלה עד מסמן-סוף (לא כולל)", וכל מסמן נבדק שהוא מופיע בדיוק פעם אחת ובסדר הנכון.
-- reversible: כן — הגוף הקודם משוחזר מ-`pg_get_functiondef` לפני ההחלה (md5 למעלה). אין שינוי-סכמה
--             ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m17p$
declare
  v_oid oid;
  v_def text;
  v_s   integer;
  v_e   integer;
  -- (1) הצהרות: שני משתני-המדד ⇐ משתנה אשתקד של הרבע העמוס.
  v_re_decl text := $r$  v_gini\s+numeric;\n  v_gini_prev\s+numeric;\n$r$;
  v_new_decl text := $n$  v_top_q_prev   numeric;
$n$;
  -- (2) הצהרה: סדרת-העקומה ⇐ סדרת-הרבעים.
  v_re_decl2 text := $r$  v_lorenz\s+jsonb;\n$r$;
  v_new_decl2 text := $n$  v_quarters     jsonb;
$n$;
  -- (3) אזור ההוגנות: מההערה של המדד ועד לפני אזור-המהירות.
  v_a_fair text := $o$  -- 🔴 **ג'יני גרסת-אוכלוסייה**$o$;
  v_b_fair text := $o$  -- ── אזור המהירות:$o$;
  v_new_fair text := $n$  -- ✏️ 24/09/2026 (הכרעת-ישי): המסך אינו מציג עוד מדד אקדמי. במקומו — חלקו של כל רבע
  --    מהמשמרות. ‏`ntile(4)` על מיון-יורד: הרבע הראשון = ‏`ceil(n/4)` הדיילות העמוסות, בדיוק
  --    הכלל שהאריח "רבע הדיילות העמוסות" השתמש בו קודם. האריח והעמודה הראשונה בגרף נקראים
  --    מאותו `quarter = 1`, ואשתקד נמדד באותו כלל על `not is_cur`.
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
           ntile(4)     over (partition by is_cur order by shifts desc, hostess_id) quarter,
           count(*)     over (partition by is_cur)                                  n,
           sum(shifts)  over (partition by is_cur)                                  total
      from counted
  ), agg as (
    select is_cur, max(n)::numeric n, max(total) total,
           max(shifts) max_shifts, avg(shifts) avg_shifts,
           (percentile_cont(0.5) within group (order by shifts))::numeric med_shifts
      from ranked group by is_cur
  ), quarters as (
    -- ארבע עמודות תמיד (כשיש דיילת אחת לפחות); רבע בלי דיילות — ‏0, לא חור בציר.
    select coalesce(jsonb_agg(jsonb_build_object('label', q.label, 'share', coalesce(s.share, 0))
                              order by q.quarter), '[]'::jsonb) j
      from (values (1, 'רבע העמוסות ביותר'), (2, 'רבע שני'), (3, 'רבע שלישי'), (4, 'רבע הפחות עמוסות'))
             as q(quarter, label)
      left join (select r.quarter, round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) share
                   from ranked r where r.is_cur group by r.quarter) s on s.quarter = q.quarter
     where exists (select 1 from ranked r where r.is_cur)
  )
  select (select n from agg where is_cur)::integer,
         (select total from agg where is_cur)::integer,
         (select ceil(n / 4.0)::integer from agg where is_cur),
         (select round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) from ranked r
           where r.is_cur and r.quarter = 1),
         (select round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) from ranked r
           where not r.is_cur and r.quarter = 1),
         (select round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) from ranked r
           where r.is_cur and r.rn_asc <= floor(r.n / 2.0)),
         (select round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) from ranked r
           where r.is_cur and r.rn_desc <= ceil(r.n / 10.0)),
         (select n from agg where not is_cur)::integer,
         (select total from agg where not is_cur)::integer,
         (select max_shifts from agg where is_cur)::integer,
         (select med_shifts from agg where is_cur),
         (select round(avg_shifts, 1) from agg where is_cur),
         (select j from quarters),
         (select count(*) from public.hostesses)
    into v_n, v_shifts, v_top_q_n, v_top_q_pct, v_top_q_prev, v_bottom_pct, v_top_dec_pct,
         v_n_prev, v_shifts_prev,
         v_max_shifts, v_med_shifts, v_avg_shifts, v_quarters, v_registered;

$n$;
  -- (4) האריחים: אריח-המדד יורד; "רבע הדיילות העמוסות" מקבל השוואה לאשתקד.
  v_a_tiles text := $o$      jsonb_build_object('key', 'gini',$o$;
  v_b_tiles text := $o$      jsonb_build_object('key', 'rank1_adoption',$o$;
  v_new_tiles text := $n$      jsonb_build_object('key', 'top_quarter', 'label', 'רבע הדיילות העמוסות', 'value', v_top_q_pct, 'format', 'percent',
        'sub', v_lri || coalesce(v_top_q_n, 0) || v_pdi || ' דיילות מתוך ' ||
               v_lri || coalesce(v_n, 0) || v_pdi ,
        'window', v_win_text,
        'compare', case when v_top_q_prev is null then null else jsonb_build_object(
          'value', v_top_q_prev,
          'label', 'אשתקד',
          'note', null,
          'direction', case when v_top_q_pct > v_top_q_prev then 'up' when v_top_q_pct < v_top_q_prev then 'down' else 'flat' end) end,
        'target', null),
$n$;
  -- (5) הגרף: עקומה מצטברת ⇐ ארבע עמודות, וקו אופקי של חלוקה שווה ב-25.
  v_a_chart text := $o$    'chart', jsonb_build_object(
      'type', 'lorenz',$o$;
  -- המסמן כולל את שבירת-השורה שלפניו: בלעדיה הוא נמצא גם בתוך `'columns'` של `meta.extra_tables`
  -- (הזחה של 8 רווחים מכילה את זו של 4) — נמדד בריצה-היבשה.
  v_b_chart text := $o$
    'columns', jsonb_build_array($o$;
  v_new_chart text := $n$    'chart', jsonb_build_object(
      'type', 'bar', 'title', 'איך המשמרות מתחלקות בין הדיילות',
      'series', jsonb_build_array(jsonb_build_object('key', 'share', 'label', 'חלק מהמשמרות',
                                                    'format', 'percent')),
      'data', coalesce(v_quarters, '[]'::jsonb), 'xKey', 'label',
      'domain', jsonb_build_array(0, 100),
      -- קו אופקי: `ChartCard.renderRefLines` מצייר `y={value}` לכל קו שאינו `diagonal`/`x`.
      'refLines', jsonb_build_array(
        jsonb_build_object('axis', 'y', 'value', 25,
          'label', 'חלוקה שווה = ' || v_lri || '25%' || v_pdi)),
      'unit', 'percent'),$n$;
  -- (6) ההגדרות: שני משפטי-המונחים ⇐ משפט פשוט על הרבעים.
  v_a_defs text := $o$    'definitions', 'הגדרות: מדד ג''יני$o$;
  v_b_defs text := $o$      'משמרת = שיבוץ שאושר סופית$o$;
  v_new_defs text := $n$    'definitions', 'הגדרות: רבע הדיילות העמוסות = החלק מכלל המשמרות שקיבל הרבע של הדיילות שעבדו הכי הרבה · ' ||
      'רבעים = הדיילות שעבדו בחלון, ממוינות מהעמוסה ביותר לפחות עמוסה ומחולקות לארבע קבוצות שוות ככל האפשר · ' ||
      'בחלוקה שווה כל רבע מקבל ' || v_lri || '25%' || v_pdi || ' מהמשמרות · ' ||
$n$;
  -- (7) ‏`meta.previous`.
  v_old_prev text := $o$'gini', round(v_gini_prev, 4)$o$;
  v_new_prev text := $n$'top_quarter_pct', v_top_q_prev$n$;
  -- (8) תנאי-הריק של `so_what` (שקול: המדד הישן היה null רק כש-n < 2).
  v_old_sw text := $o$when v_gini is null then$o$;
  v_new_sw text := $n$when coalesce(v_n, 0) < 2 then$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m17_fairness';
  v_def := pg_get_functiondef(v_oid);

  if regexp_count(v_def, v_re_decl) <> 1 then
    raise exception 'm17p: index declarations not exactly once'; end if;
  if regexp_count(v_def, v_re_decl2) <> 1 then
    raise exception 'm17p: curve declaration not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_a_fair, ''))) <> length(v_a_fair)
     or (length(v_def) - length(replace(v_def, v_b_fair, ''))) <> length(v_b_fair)
     or strpos(v_def, v_a_fair) >= strpos(v_def, v_b_fair) then
    raise exception 'm17p: fairness block markers not exactly once / out of order'; end if;
  if (length(v_def) - length(replace(v_def, v_a_tiles, ''))) <> length(v_a_tiles)
     or (length(v_def) - length(replace(v_def, v_b_tiles, ''))) <> length(v_b_tiles)
     or strpos(v_def, v_a_tiles) >= strpos(v_def, v_b_tiles) then
    raise exception 'm17p: tile block markers not exactly once / out of order'; end if;
  if (length(v_def) - length(replace(v_def, v_a_chart, ''))) <> length(v_a_chart)
     or (length(v_def) - length(replace(v_def, v_b_chart, ''))) <> length(v_b_chart)
     or strpos(v_def, v_a_chart) >= strpos(v_def, v_b_chart) then
    raise exception 'm17p: chart block markers not exactly once / out of order'; end if;
  if (length(v_def) - length(replace(v_def, v_a_defs, ''))) <> length(v_a_defs)
     or (length(v_def) - length(replace(v_def, v_b_defs, ''))) <> length(v_b_defs)
     or strpos(v_def, v_a_defs) >= strpos(v_def, v_b_defs) then
    raise exception 'm17p: definitions block markers not exactly once / out of order'; end if;
  if (length(v_def) - length(replace(v_def, v_old_prev, ''))) <> length(v_old_prev) then
    raise exception 'm17p: meta.previous segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_sw, ''))) <> length(v_old_sw) then
    raise exception 'm17p: so_what guard segment not exactly once'; end if;

  v_def := regexp_replace(v_def, v_re_decl, v_new_decl);
  v_def := regexp_replace(v_def, v_re_decl2, v_new_decl2);

  v_s := strpos(v_def, v_a_fair);  v_e := strpos(v_def, v_b_fair);
  v_def := left(v_def, v_s - 1) || v_new_fair || substr(v_def, v_e);
  v_s := strpos(v_def, v_a_tiles); v_e := strpos(v_def, v_b_tiles);
  v_def := left(v_def, v_s - 1) || v_new_tiles || substr(v_def, v_e);
  v_s := strpos(v_def, v_a_chart); v_e := strpos(v_def, v_b_chart);
  v_def := left(v_def, v_s - 1) || v_new_chart || substr(v_def, v_e);
  v_s := strpos(v_def, v_a_defs);  v_e := strpos(v_def, v_b_defs);
  v_def := left(v_def, v_s - 1) || v_new_defs || substr(v_def, v_e);

  v_def := replace(v_def, v_old_prev, v_new_prev);
  v_def := replace(v_def, v_old_sw, v_new_sw);
  execute v_def;
end $m17p$;
