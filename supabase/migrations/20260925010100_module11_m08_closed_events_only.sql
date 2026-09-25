-- why: הכרעת הסגן, 25/09/2026 ~01:3X (סבב תיקוני-אמת, מדידת מסביר-דוחות 01:2X אחרי 5 המיגרציות), מילה-במילה:
--      *"מ8: ① לספור רק אירועים שנסגרו. אותה הגדרה כמו במ12: final_event_date < היום−7, ולא מבוטל ("גג שבוע",
--      הכרעת-ישי). … ② תווית-האוכלוסייה תהיה נכונה אחרי ①. היום כתוב "וחויבו", ול-31 מתוך 248 אין חשבונית.
--      ③ האריח אומר 32 חורגים, והטבלה מראה 8. או שהשניים מתיישבים, או שהנוסח אומר את זה"* · ויחיד/רבים:
--      *"כל מספר שיכול להיות 1"*.
--      📏 נמדד 25/09 (explain\מ8-profitability.json · recheck 01:1X, ושאילתה חוזרת שלי):
--         · 6 אירועים "האירוע הסתיים" בלי אף שעה: 1589 · 1590 (17/09) · 1591 (18/09) · 1594 (22/09) · 1595 · 1596 (23/09);
--           5 מהם בגרף. ‏🔑 **הגדרת מ12 מוציאה 4 מהם ולא 6:** ‏`final_event_date < v_today - 7` = לפני 18/09, ולכן 1589
--           ו-1590 (17/09) נחשבים "נסגרו" ונשארים — עם 0 שעות. זו ההגדרה שהוכרעה, והיא מיושמת כמו שהיא; שלב ④
--           ברענון (14/10) משלים להם שעות.
--         · שורת-האוכלוסייה: "אירועים שהתקיימו ויצאה להם חשבונית", והשבב "248 פרויקטים שהתקיימו וחויבו" — ל-31 אין
--           חשבונית (6 "האירוע הסתיים" + 25 "ממתין לחשבונית").
--         · אריח "פרויקטים שחרגו מהתקציב" = 32, הטבלה = 8: ‏24 מעל הסף אבל מתחת ל-4 שעות או 1,000 ₪ ⇒ לא בדירוג.
-- what: החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר (הדפוס: 20260925000400).
--       (1) declare: ‏`v_recent` (אירועים מהשבוע האחרון שהוצאו) · ‏`v_ranked` (חורגים שבדירוג = שורות הטבלה).
--       (2) ספירת `v_recent` לפני ה-CTE, באותה אוכלוסיית-סטטוסים ובאותו חלון.
--       (3) ‏`win` ⇐ ‏`and final_event_date < v_today - 7` · ‏`prev` ⇐ אותו כלל שנה אחורה (כמו במ12,
--           `report_m12_equipment`: ‏`< (v_today - interval '1 year')::date - 7`). הערת-האוכלוסייה בקוד ⇐ נכונה.
--       (4) ‏`v_ranked` נספר ונכנס ל-`into`.
--       (5) שבב + שורת-אוכלוסייה + `excluded`: "שנסגרו", בלי "וחויבו"; ‏"(חלקם טרם חויבו)"; האירועים מהשבוע
--           האחרון מוצהרים כהוצאה; יחיד כשהמספר 1.
--       (6) שורת-המשנה של "פרויקטים שחרגו": "‹8› בטבלה · ‹24› קטנים מדי לדירוג" (29 תווים — גלוי, ≤30 של KpiTile).
--           "מעל סף 15%" עובר לשורת-ההגדרות (7), כדי שלא ילך לאיבוד.
--       (7) הגדרות: ‏"חרגו מהתקציב = …מעל ‹15›%…" · ‏"אירוע שנסגר = …".
--       (8) שורת-"אז מה" (ענף "כולם מתחת לרצפה"): יחיד כשחרג פרויקט אחד.
--       (9) הערות-השוליים: יחיד כשהמספר 1.
--       🚫 לא נוגע: הגרף (בחירה, כותרת, לחיצה — 20260925000400) · הטבלה · שם האריח "סך החריגה מעל הסף" (טעם, לבוקר).
-- 📏 הגוף החי לפני: md5 `86d741fe2d13517844793493f1515469`, ‏19,005 תווים (= אחרי 20260925000400).
-- 📏 הגוף הצפוי אחרי: md5 `5071a2bfc573e24c09e96cfcfdec5262`, ‏22,171 תווים — בלוק-הניסיון (25/09, בין 01:40 ל-01:56): אותו בלוק
--    של הקובץ (md5 הבלוק נבדק במסד מול הקובץ), `execute v_def` ⇐ עותק ב-pg_temp, שתי הקריאות כמנכ"ל, raise ⇒ גלגול.
-- 📏 בלוק-הניסיון, הקריאה (null,null) (פלט הקריאה השנייה נחתך בתצוגה — לא נקרא): n ‏248 ⇐ 244 (הוצאו 4 מהשבוע האחרון: 1591 · 1594 · 1595 ·
--    1596) · שבב "⁦244⁩ פרויקטים שנסגרו" · אריח החורגים: 32, ושורת-המשנה "⁦8⁩ בטבלה · ⁦24⁩ קטנים מדי לדירוג" ·
--    הערות: 128 ⇐ 127 מתחת לרצפה · "הרווח סופי ב-183 מתוך 244" · ההגדרות נפתחות ב"חרגו מהתקציב = …15%…".
-- reversible: כן — ההחלפות ההפוכות, או הגוף הקודם (md5 למעלה). אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m08c$
declare
  v_oid oid;
  v_def text;
  -- (1) declare.
  v_old_decl text := $o$  v_share_pct   numeric;
$o$;
  v_new_decl text := $n$  v_share_pct   numeric;
  v_recent      integer;
  v_ranked      integer;
$n$;
  -- (2) ספירת האירועים מהשבוע האחרון — לפני ה-CTE.
  v_old_cte text := $o$  with money as (
    select p.project_id, p.final_event_date, c.company_name, p.feedback_score,$o$;
  v_new_cte text := $n$  -- ✏️ 25/09/2026 (הכרעת הסגן · "גג שבוע", הכרעת-ישי): אירוע מהשבוע האחרון עוד בסגירה — השעות
  --    שלו עוד מדווחות, ו-0 שעות נראות כחיסכון של 100%. הוא מוצא מהדף ונספר כאן, כדי ששורת-האוכלוסייה
  --    תגיד כמה הוצאו. אותה הגדרה כמו ב-report_m12_equipment.
  select count(*)::integer into v_recent
    from public.projects p
   where p.final_event_date >= v_from and p.final_event_date <= v_to
     and p.final_event_date >= v_today - 7
     and p.project_status in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')
     and (p_customer_id is null or p.customer_id = p_customer_id);

  with money as (
    select p.project_id, p.final_event_date, c.company_name, p.feedback_score,$n$;
  -- (3) החלון והשנה הקודמת — רק מה שנסגר.
  v_old_pop_note text := $o$     -- הכרעה 36 — אוכלוסיית-הכסף: אירועים שהתקיימו ויצאה להם חשבונית.$o$;
  v_new_pop_note text := $n$     -- הכרעה 36 — אוכלוסיית-הכסף: אירועים שהתקיימו — פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית ·
     -- ממתין לתשלום. ✏️ 25/09/2026: "ויצאה להם חשבונית" לא היה נכון (31/248 בלי חשבונית), ו"שנסגרו" נאכף
     -- ב-win/prev למטה.$n$;
  v_old_win text := $o$    select * from calc where final_event_date >= v_from and final_event_date <= v_to
$o$;
  v_new_win text := $n$    select * from calc where final_event_date >= v_from and final_event_date <= v_to
       and final_event_date < v_today - 7
$n$;
  v_old_prev text := $o$    select * from calc where final_event_date >= v_prev_from and final_event_date <= v_prev_to
$o$;
  v_new_prev text := $n$    select * from calc where final_event_date >= v_prev_from and final_event_date <= v_prev_to
       and final_event_date < (v_today - interval '1 year')::date - 7
$n$;
  -- (4) ‏v_ranked.
  v_old_into text := $o$            and not (planned_hours < 4 or planned_labor < 1000) order by budget_deviation desc limit 1)
    into v_n, v_over, v_over_sum, v_margin, v_median, v_frozen, v_floor_n, v_floor_sum,
         v_prev_n, v_prev_over, v_prev_sum, v_prev_margin, v_prev_median, v_chart, v_rows,
         v_top_id, v_top_name, v_top_pct, v_top_dev;$o$;
  v_new_into text := $n$            and not (planned_hours < 4 or planned_labor < 1000) order by budget_deviation desc limit 1),
         -- ✏️ 25/09/2026: החורגים שבדירוג — בדיוק שורות הטבלה. האריח סופר את כל החורגים (32), הטבלה 8.
         (select count(*) from win where r > v_threshold / 100.0
             and not (planned_hours < 4 or planned_labor < 1000))
    into v_n, v_over, v_over_sum, v_margin, v_median, v_frozen, v_floor_n, v_floor_sum,
         v_prev_n, v_prev_over, v_prev_sum, v_prev_margin, v_prev_median, v_chart, v_rows,
         v_top_id, v_top_name, v_top_pct, v_top_dev, v_ranked;$n$;
  -- (5) שבב + שורת-אוכלוסייה + excluded.
  v_old_popu text := $o$      'summary', v_lri || v_n || v_pdi || ' פרויקטים שהתקיימו וחויבו',
      'label', 'אוכלוסייה: אירועים שהתקיימו ויצאה להם חשבונית — פרויקט הסתיים · ממתין לסגירה · '
               || 'ממתין לחשבונית · ממתין לתשלום, אירוע ב-' || v_lri || to_char(v_from, 'DD/MM/YYYY')
               || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi || ' · הוצאו: פרויקטים פעילים ומבוטלים ('
               || v_lri || v_excl_status || v_pdi || ') · ' || v_lri || 'n=' || v_n || v_pdi
               || '. הדף אינו מציג פרויקטים פעילים — לפני שהאירוע התקיים השעות-בפועל תמיד קטנות '
               || 'מהמתוכננות, ולכן אין בו חריגה למדוד. ' || v_lri || v_floor_n || v_pdi
               || ' מהם מתחת לרצפת-המהותיות — בתוך האוכלוסייה, מחוץ לדירוג.',
      -- why (F8): רק מה שבאמת מחוץ ל-n.
      'excluded', jsonb_build_object('פרויקטים פעילים ומבוטלים', v_excl_status)),$o$;
  v_new_popu text := $n$      -- ✏️ 25/09/2026 (הכרעת הסגן): "שנסגרו" ולא "וחויבו" — ל-31 מתוך 248 לא יצאה חשבונית (נמדד 25/09).
      --    והאירועים מהשבוע האחרון מוצהרים כהוצאה. יחיד כשהמספר 1.
      'summary', case when v_n = 1 then 'פרויקט אחד שנסגר'
                      else v_lri || v_n || v_pdi || ' פרויקטים שנסגרו' end,
      'label', 'אוכלוסייה: אירועים שנסגרו — התקיימו לפני יותר משבוע ולא בוטלו: פרויקט הסתיים · ממתין לסגירה · '
               || 'ממתין לחשבונית · ממתין לתשלום (חלקם טרם חויבו), אירוע ב-' || v_lri || to_char(v_from, 'DD/MM/YYYY')
               || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi || ' · הוצאו: פרויקטים פעילים ומבוטלים ('
               || v_lri || v_excl_status || v_pdi || ') · אירועים מהשבוע האחרון, שעוד בסגירה ('
               || v_lri || coalesce(v_recent, 0) || v_pdi || ') · ' || v_lri || 'n=' || v_n || v_pdi
               || '. הדף אינו מציג פרויקטים פעילים — לפני שהאירוע התקיים השעות-בפועל תמיד קטנות '
               || 'מהמתוכננות, ולכן אין בו חריגה למדוד; ובשבוע שאחרי האירוע השעות עוד מדווחות. '
               || case when v_floor_n = 1 then 'אחד מהם מתחת לרצפת-המהותיות'
                       else v_lri || v_floor_n || v_pdi || ' מהם מתחת לרצפת-המהותיות' end
               || ' — בתוך האוכלוסייה, מחוץ לדירוג.',
      -- why (F8): רק מה שבאמת מחוץ ל-n.
      'excluded', jsonb_build_object('פרויקטים פעילים ומבוטלים', v_excl_status,
                                     'אירועים מהשבוע האחרון', coalesce(v_recent, 0))),$n$;
  -- (6) שורת-המשנה של "פרויקטים שחרגו".
  v_old_sub text := $o$        'sub', case when v_threshold is null then null
                    else 'מעל סף ' || v_lri || v_threshold::text || '%' || v_pdi || ' · '
                         || v_lri || to_char(v_share_pct, 'FM990.0') || '%' || v_pdi || ' מתוך '
                         || v_lri || v_n || v_pdi || ' האירועים' end,$o$;
  v_new_sub text := $n$        -- ✏️ 25/09/2026 (הכרעת הסגן): האריח (32) והטבלה (8) מתיישבים על המסך. הישנה ("מעל סף 15% ·
        --    12.1% מתוך 248 האירועים", 36 תווים) ישבה ב-ⓘ, והסף עבר לשורת-ההגדרות.
        'sub', case when v_threshold is null then null
                    else v_lri || coalesce(v_ranked, 0) || v_pdi || ' בטבלה'
                         || case when v_over - coalesce(v_ranked, 0) <= 0 then ''
                                 when v_over - coalesce(v_ranked, 0) = 1 then ' · אחד קטן מדי לדירוג'
                                 else ' · ' || v_lri || (v_over - coalesce(v_ranked, 0)) || v_pdi || ' קטנים מדי לדירוג' end end,$n$;
  -- (7) הגדרות.
  v_old_defs text := $o$    'definitions', 'סטיית-תקציב = צד-העבודה בלבד, ב-₪ · עלות-עבודה מתוכננת = שעות-האירוע × Σ תעריפי '$o$;
  v_new_defs text := $n$    'definitions', 'חרגו מהתקציב = סטיית-התקציב גבוהה ביותר מ-' || v_lri || coalesce(v_threshold::text, '—') || '%' || v_pdi
      || ' מעלות-העבודה המתוכננת · אירוע שנסגר = התקיים לפני יותר משבוע ולא בוטל · '
      || 'סטיית-תקציב = צד-העבודה בלבד, ב-₪ · עלות-עבודה מתוכננת = שעות-האירוע × Σ תעריפי '$n$;
  -- (8) "אז מה" — כולם מתחת לרצפה.
  v_old_sw text := $o$        'חרגו ' || v_lri || v_over || v_pdi || ' פרויקטים ב-'
        || v_lri || to_char(round(v_over_sum), 'FM999,999,999') || ' ₪' || v_pdi
        || ', אך כולם מתחת לרצפת-המהותיות — אין פרויקט שדורש פתיחה השבוע.'$o$;
  v_new_sw text := $n$        -- ✏️ 25/09/2026: יחיד כשחרג פרויקט אחד (היה: "חרגו 1 פרויקטים … אך כולם").
        case when v_over = 1 then 'חרג פרויקט אחד ב-'
             else 'חרגו ' || v_lri || v_over || v_pdi || ' פרויקטים ב-' end
        || v_lri || to_char(round(v_over_sum), 'FM999,999,999') || ' ₪' || v_pdi
        || case when v_over = 1 then ', אך הוא מתחת לרצפת-המהותיות — אין פרויקט שדורש פתיחה השבוע.'
                else ', אך כולם מתחת לרצפת-המהותיות — אין פרויקט שדורש פתיחה השבוע.' end$n$;
  -- (9) הערות-השוליים.
  v_old_notes text := $o$        v_lri || v_floor_n || v_pdi || ' פרויקטים מתחת ל-' || v_lri || '4' || v_pdi || ' שעות או '
          || v_lri || '1,000' || ' ₪' || v_pdi || ' אינם מדורגים.',
        case when v_frozen >= v_n then 'הרווח סופי בכל ' || v_lri || v_n || v_pdi || ' הפרויקטים.'
               when coalesce(v_frozen, 0) = 0 then 'הרווח בכל ' || v_lri || v_n || v_pdi || ' הפרויקטים מחושב מהעלויות שנרשמו עד היום.'
               else 'הרווח סופי ב-' || v_lri || v_frozen || v_pdi || ' מתוך ' || v_lri || v_n || v_pdi
                    || ' פרויקטים; בשאר — לפי העלויות עד היום.' end),$o$;
  v_new_notes text := $n$        -- ✏️ 25/09/2026: יחיד כשהמספר 1 (הכרעת הסגן: "כל מספר שיכול להיות 1").
        case when v_floor_n = 1 then 'פרויקט אחד מתחת ל-' || v_lri || '4' || v_pdi || ' שעות או '
                                     || v_lri || '1,000' || ' ₪' || v_pdi || ' אינו מדורג.'
             else v_lri || v_floor_n || v_pdi || ' פרויקטים מתחת ל-' || v_lri || '4' || v_pdi || ' שעות או '
                  || v_lri || '1,000' || ' ₪' || v_pdi || ' אינם מדורגים.' end,
        case when v_n = 1 and v_frozen >= 1 then 'הרווח בפרויקט סופי.'
               when v_n = 1 then 'הרווח בפרויקט מחושב מהעלויות שנרשמו עד היום.'
               when v_frozen >= v_n then 'הרווח סופי בכל ' || v_lri || v_n || v_pdi || ' הפרויקטים.'
               when coalesce(v_frozen, 0) = 0 then 'הרווח בכל ' || v_lri || v_n || v_pdi || ' הפרויקטים מחושב מהעלויות שנרשמו עד היום.'
               when v_frozen = 1 then 'הרווח סופי בפרויקט אחד מתוך ' || v_lri || v_n || v_pdi
                    || '; בשאר — לפי העלויות עד היום.'
               else 'הרווח סופי ב-' || v_lri || v_frozen || v_pdi || ' מתוך ' || v_lri || v_n || v_pdi
                    || ' פרויקטים; בשאר — לפי העלויות עד היום.' end),$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m08_profitability';
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_decl, ''))) <> length(v_old_decl) then
    raise exception 'm08c: declare segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_cte, ''))) <> length(v_old_cte) then
    raise exception 'm08c: money-cte segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_pop_note, ''))) <> length(v_old_pop_note) then
    raise exception 'm08c: population-comment segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_win, ''))) <> length(v_old_win) then
    raise exception 'm08c: win segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_prev, ''))) <> length(v_old_prev) then
    raise exception 'm08c: prev segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_into, ''))) <> length(v_old_into) then
    raise exception 'm08c: into segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_popu, ''))) <> length(v_old_popu) then
    raise exception 'm08c: population segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_sub, ''))) <> length(v_old_sub) then
    raise exception 'm08c: over-threshold sub segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_defs, ''))) <> length(v_old_defs) then
    raise exception 'm08c: definitions segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_sw, ''))) <> length(v_old_sw) then
    raise exception 'm08c: so-what segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_notes, ''))) <> length(v_old_notes) then
    raise exception 'm08c: notes segment not exactly once'; end if;

  v_def := replace(v_def, v_old_decl, v_new_decl);
  v_def := replace(v_def, v_old_cte, v_new_cte);
  v_def := replace(v_def, v_old_pop_note, v_new_pop_note);
  v_def := replace(v_def, v_old_win, v_new_win);
  v_def := replace(v_def, v_old_prev, v_new_prev);
  v_def := replace(v_def, v_old_into, v_new_into);
  v_def := replace(v_def, v_old_popu, v_new_popu);
  v_def := replace(v_def, v_old_sub, v_new_sub);
  v_def := replace(v_def, v_old_defs, v_new_defs);
  v_def := replace(v_def, v_old_sw, v_new_sw);
  v_def := replace(v_def, v_old_notes, v_new_notes);
  execute v_def;
end $m08c$;
