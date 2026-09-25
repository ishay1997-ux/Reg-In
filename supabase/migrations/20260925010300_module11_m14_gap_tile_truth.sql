-- why: הכרעות הסגן, 25/09/2026 ~01:3X–01:5X (סבב תיקוני-אמת), מילה-במילה:
--      *"מ14 F3: חץ ▲ על השוואה עתידית ("31–60 הימים הבאים: 1"). direction = null, כמו שעשינו במ21."* ·
--      *"הרמז או שורת-המשנה של האריח: "4 ב-30 הימים הקרובים — הם הראשונים ברשימה". כך הפער בין 4 באריח ל-16 במסך
--      מוסבר."* · ויחיד/רבים: *"כל מספר שיכול להיות 1"*.
--      📏 נמדד 25/09 (recheck 01:1X + שאילתה שלי 01:3X): האריח "אירועים עם חוסר" = 4 (1597 · 1600 · 16 · 1615),
--         וההשוואה "31–60 הימים הבאים: 1" עם direction='up' ⇒ ▲, כאילו "עלה מאז". שתי התקופות בעתיד.
--         במסך הדיילות, "הציגי חסרים בלבד", יש 16 אירועים חסרים — בלי אופק — וארבעת אלה הם 4 השורות הראשונות
--         (`sortOverviewRows`: חסרים קודם, בתוכם לפי קרבה).
-- what: שתי החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר.
--       (1) ‏`'direction'` בהשוואת האריח ⇐ null. ‏`KpiTile` מצייר חץ רק לפי `direction` — אין שינוי בצד-לקוח, ו-`main`
--           (94db912d) זהה בקובץ הזה ⇒ בטוח לפני העלייה.
--       (2) שורת-המשנה (יושבת ב-ⓘ, 60+ תווים): יחיד כשהמספר 1, ובסופה "במסך הדיילות … הם הראשונים ברשימה".
--       🚫 לא נוגע: הדלת (`target`) — היא בקובץ נפרד, `20260925010350_module11_m14_gap_tile_door.sql`, שמוחל רק אחרי
--          שקוד-הלקוח שמכיר יעד מסוג `path` עולה לאוויר (תנאי הסגן, CLAUDE.md §2.2). אין חפיפה בין הקטעים, ולכן
--          כל קובץ עומד לבד ואפשר להריץ לכל אחד הרצה-יבשה על הגוף החי.
-- 📏 הגוף החי לפני: md5 `489f97eb174853467075113b789ea5e8`, ‏31,369 תווים (= אחרי 20260925000300).
-- 📏 הגוף הצפוי אחרי: md5 `4fbd074d0e850ec89d58904c3021e99b`, ‏32,233 תווים — בלוק-הניסיון (25/09, בין 01:40 ל-01:56, כמנכ"ל,
--    pg_temp, מתגלגל; md5 הבלוק נבדק במסד מול הקובץ), הקריאה (25/09/2025–25/09/2026): השתנה רק האריח gap_events —
--    direction 'up' ⇐ null, ושורת-המשנה "4 מתוך 21 אירועים · 14 מקומות · 0 זימונים ממתינים · במסך הדיילות, ב"הציגי
--    חסרים בלבד", הם הראשונים ברשימה". ארבעת האריחים האחרים, הטבלה, הגרף ושורת-"אז מה" — זהים.
-- reversible: כן — ההחלפות ההפוכות, או הגוף הקודם (md5 למעלה). אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m14e$
declare
  v_oid oid;
  v_def text;
  -- (1) בלי חץ על השוואה עתידית.
  v_old_dir text := $o$          'direction', case when v_gap_events > v_prev_gap then 'up' when v_gap_events < v_prev_gap then 'down' else 'flat' end) end,$o$;
  v_new_dir text := $n$          -- ✏️ 25/09/2026 (הכרעת הסגן): בלי חץ — שתי התקופות בעתיד, ו-▲ נקרא "עלה מאז". כמו במ21.
          'direction', null) end,$n$;
  -- (2) שורת-המשנה.
  v_old_sub text := $o$        'sub', case when v_upcoming = 0 then 'אין אירועים ב-30 הימים הקרובים'
                  else to_char(coalesce(v_gap_events, 0), 'FM999,999,999') || ' מתוך ' || to_char(coalesce(v_upcoming, 0), 'FM999,999,999') || ' אירועים · ' || to_char(coalesce(v_gap_places, 0), 'FM999,999,999') ||
                       ' מקומות · ' || to_char(coalesce(v_gap_pending, 0), 'FM999,999,999') || ' זימונים ממתינים' end)),$o$;
  v_new_sub text := $n$        -- ✏️ 25/09/2026 (הכרעת הסגן): יחיד כשהמספר 1, ובסוף — איפה רואים אותם. במסך הדיילות אין אופק
        --    (16 חסרים ב-25/09), ולכן המשפט אומר שהאירועים שבאריח הם הראשונים שם.
        'sub', case when v_upcoming = 0 then 'אין אירועים ב-30 הימים הקרובים'
                  else case when v_gap_events = 1 then 'אחד' else to_char(coalesce(v_gap_events, 0), 'FM999,999,999') end
                       || ' מתוך ' || case when v_upcoming = 1 then 'אירוע אחד'
                                           else to_char(coalesce(v_upcoming, 0), 'FM999,999,999') || ' אירועים' end
                       || ' · ' || case when v_gap_places = 1 then 'מקום אחד'
                                        else to_char(coalesce(v_gap_places, 0), 'FM999,999,999') || ' מקומות' end
                       || ' · ' || case when v_gap_pending = 1 then 'זימון אחד ממתין'
                                        else to_char(coalesce(v_gap_pending, 0), 'FM999,999,999') || ' זימונים ממתינים' end
                       || case when coalesce(v_gap_events, 0) = 0 then ''
                               when v_gap_events = 1 then ' · במסך הדיילות, ב"הציגי חסרים בלבד", הוא הראשון ברשימה'
                               else ' · במסך הדיילות, ב"הציגי חסרים בלבד", הם הראשונים ברשימה' end end)),$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m14_hostess_overview';
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_dir, ''))) <> length(v_old_dir) then
    raise exception 'm14e: gap-compare direction segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_sub, ''))) <> length(v_old_sub) then
    raise exception 'm14e: gap-tile sub segment not exactly once'; end if;

  v_def := replace(v_def, v_old_dir, v_new_dir);
  v_def := replace(v_def, v_old_sub, v_new_sub);
  execute v_def;
end $m14e$;
