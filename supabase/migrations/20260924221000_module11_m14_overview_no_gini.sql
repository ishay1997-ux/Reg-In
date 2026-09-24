-- why: הכרעת-ישי, 24/09/2026 (אחרי השופט והיועץ): *"אני מסכים עם השופט האמת והמלצת היועץ... באמת
--      לא היה מובן החלקים האלא"*. ⇐ גם במבט-העל של הדיילות (‏`report_m14_hostess_overview`) אין
--      מונח אקדמי על המסך. האריח "ריכוזיות המשמרות" (מדד 0–1) מוחלף באריח "רבע הדיילות העמוסות":
--      כמה אחוז מהמשמרות קיבל הרבע העמוס — אותו מדד בדיוק כמו בדוח ההוגנות
--      (`20260924220000_module11_m17_fairness_plain_words.sql`), וההגדרה בחלונית-ההיקף מוחלפת במשפט פשוט.
--      📏 נמדד לפני הכתיבה (24/09, קריאה בלבד, `pg_get_functiondef` חי, md5
--         `2b7b4062a5ba5034867c337565ec92b6`, ‏31,624 תווים).
--      📏 היום, חלון ברירת-המחדל: 106 דיילות · 1,895 משמרות · הרבע העמוס 56.0% (אשתקד 54.6%).
--         ספירת-המשמרות כאן זהה לזו של מ17 (אותו `counted`), ולכן שני האריחים יראו אותו מספר.
--      🔑 כלל-הרבעים: ‏`ntile(4)` על מיון-יורד (שובר-שוויון `hostess_id`); הרבע הראשון = ‏`ceil(n/4)`
--         הדיילות העמוסות — הכלל שכבר חישב את `v_top_q_pct` כאן (‏`rn_desc <= ceil(n/4)`), ושתת-השורה
--         של האריח הישן הציגה.
--      🔎 מוצג למשתמשת? כן — האריח (תווית · ערך · תת-שורה · השוואה) ו-`definitions`. הדלת של האריח
--         (‏`report_m17_fairness`) נשמרת.
--      ⚪ "מקדם" מופיע בגוף הזה 6 פעמים, כולן בשמות-הפרמטרים `מקדם_אמינות_אדום`/`מקדם_אמינות_ענבר`
--         (ארבע שליפות, ושתי שורות של הערת-הסדר `v_order_note` שמוצגת ב-`meta.notes`). הם שייכים
--         לסימון-האמינות ולא למדד שירד — לא נוגעים.
-- what: חמש החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר. הדפוס:
--       `20260924213000_module11_m02_revenue_tile_no_door.sql`. שלושה בלוקים מוחלפים כ"מסמן-התחלה עד
--       מסמן-סוף (לא כולל)", וכל מסמן נבדק שהוא מופיע בדיוק פעם אחת ובסדר הנכון.
-- reversible: כן — הגוף הקודם משוחזר מ-`pg_get_functiondef` לפני ההחלה (md5 למעלה). אין שינוי-סכמה
--             ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m14g$
declare
  v_oid oid;
  v_def text;
  v_s   integer;
  v_e   integer;
  -- (1) הצהרות: ארבעת משתני-המדד ⇐ אשתקד של הרבע העמוס + מספר הדיילות שעבדו.
  v_re_decl text := $r$  v_gini\s+numeric;\n  v_gini_prev\s+numeric;\n  v_gini_n\s+integer;\n  v_gini_prev_n\s+integer;\n$r$;
  v_new_decl text := $n$  v_top_q_prev  numeric;
  v_fair_n      integer;
$n$;
  -- (2) בלוק-הריכוזיות: מהכותרת שלו ועד לפני מונה-המצב.
  v_a_fair text := $o$  -- ── ג'יני והריכוזיות (§ח8-1)$o$;
  v_b_fair text := $o$  -- ── מונה-מצב:$o$;
  v_new_fair text := $n$  -- ── הריכוזיות (§ח8-1): ספירת משמרות `finally_approved` פר-דיילת, אירוע שעבר.
  -- ✏️ 24/09/2026 (הכרעת-ישי): המסך אינו מציג עוד מדד אקדמי. האריח מציג את חלקו של הרבע העמוס
  --    מהמשמרות — אותו כלל בדיוק כמו `report_m17_fairness`: ‏`ntile(4)` על מיון-יורד, הרבע
  --    הראשון = ‏`ceil(n/4)` הדיילות העמוסות; אשתקד באותו כלל על `not is_cur`.
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
           ntile(4)     over (partition by is_cur order by shifts desc, hostess_id) as quarter,
           count(*)     over (partition by is_cur) as n,
           sum(shifts)  over (partition by is_cur) as total
      from counted
  )
  select (select max(r.n) from ranked r where r.is_cur)::integer,
         (select max(r.total) from ranked r where r.is_cur)::integer,
         (select ceil(max(r.n) / 4.0)::integer from ranked r where r.is_cur),
         (select round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) from ranked r
           where r.is_cur and r.quarter = 1),
         (select round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) from ranked r
           where not r.is_cur and r.quarter = 1),
         (select round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) from ranked r
           where r.is_cur and r.rn_asc <= floor(r.n / 2.0))
    into v_fair_n, v_shifts, v_top_q_n, v_top_q_pct, v_top_q_prev, v_bottom_pct;

$n$;
  -- (3) מונה "עבדו בחלון".
  v_old_worked text := $o$v_worked := v_gini_n;$o$;
  v_new_worked text := $n$v_worked := v_fair_n;$n$;
  -- (4) האריח: "ריכוזיות המשמרות" ⇐ "רבע הדיילות העמוסות" (הדלת נשמרת).
  v_a_tile text := $o$      jsonb_build_object('key', 'gini',$o$;
  v_b_tile text := $o$      jsonb_build_object('key', 'active_hostesses',$o$;
  v_new_tile text := $n$      jsonb_build_object('key', 'top_quarter', 'label', 'רבע הדיילות העמוסות', 'value', v_top_q_pct, 'format', 'percent',
        'window', v_win_text,
        'compare', case when v_top_q_prev is null then null else jsonb_build_object(
          'value', v_top_q_prev, 'label', 'אשתקד', 'note', null,
          'direction', case when v_top_q_pct > v_top_q_prev then 'up' when v_top_q_pct < v_top_q_prev then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'report_m17_fairness', 'drill', null),
        'sub', 'מהמשמרות · בחלוקה שווה ' || v_lri || '25%' || v_pdi),
$n$;
  -- (5) ההגדרה.
  v_a_defs text := $o$      'ג''יני = מדד$o$;
  v_b_defs text := $o$      'דיילת פעילה = $o$;
  v_new_defs text := $n$      'רבע הדיילות העמוסות = החלק מכלל המשמרות שקיבל הרבע העמוס ביותר מתוך ' ||
      coalesce(v_fair_n::text, '0') || ' הדיילות שעבדו בחלון · בחלוקה שווה כל רבע מקבל ' ||
      v_lri || '25%' || v_pdi || ' · ' ||
$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m14_hostess_overview';
  v_def := pg_get_functiondef(v_oid);

  if regexp_count(v_def, v_re_decl) <> 1 then
    raise exception 'm14g: index declarations not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_a_fair, ''))) <> length(v_a_fair)
     or (length(v_def) - length(replace(v_def, v_b_fair, ''))) <> length(v_b_fair)
     or strpos(v_def, v_a_fair) >= strpos(v_def, v_b_fair) then
    raise exception 'm14g: concentration block markers not exactly once / out of order'; end if;
  if (length(v_def) - length(replace(v_def, v_old_worked, ''))) <> length(v_old_worked) then
    raise exception 'm14g: worked-count segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_a_tile, ''))) <> length(v_a_tile)
     or (length(v_def) - length(replace(v_def, v_b_tile, ''))) <> length(v_b_tile)
     or strpos(v_def, v_a_tile) >= strpos(v_def, v_b_tile) then
    raise exception 'm14g: tile block markers not exactly once / out of order'; end if;
  if (length(v_def) - length(replace(v_def, v_a_defs, ''))) <> length(v_a_defs)
     or (length(v_def) - length(replace(v_def, v_b_defs, ''))) <> length(v_b_defs)
     or strpos(v_def, v_a_defs) >= strpos(v_def, v_b_defs) then
    raise exception 'm14g: definitions block markers not exactly once / out of order'; end if;

  v_def := regexp_replace(v_def, v_re_decl, v_new_decl);

  v_s := strpos(v_def, v_a_fair);  v_e := strpos(v_def, v_b_fair);
  v_def := left(v_def, v_s - 1) || v_new_fair || substr(v_def, v_e);
  v_def := replace(v_def, v_old_worked, v_new_worked);
  v_s := strpos(v_def, v_a_tile);  v_e := strpos(v_def, v_b_tile);
  v_def := left(v_def, v_s - 1) || v_new_tile || substr(v_def, v_e);
  v_s := strpos(v_def, v_a_defs);  v_e := strpos(v_def, v_b_defs);
  v_def := left(v_def, v_s - 1) || v_new_defs || substr(v_def, v_e);
  execute v_def;
end $m14g$;
