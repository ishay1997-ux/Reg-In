-- why: הכרעת הסגן, 25/09/2026 ~01:3X (סבב תיקוני-אמת), מילה-במילה: *"מ6 F1: חץ ▲ הפוך על איחור."*
--      והכלל שהסגן קבע באותה הודעה על מ14: *"direction = null, כמו שעשינו במ21"* — השוואה שאינה בזמן לא נושאת חץ.
--      🔎 הממצא (`explain\מ6-staffing.json` F1, recheck 25/09 01:1X — "לא נפתר"): באריח "ציון באיחור בינוני-כבד" המסך
--         מראה "4.3 ▲ בשאר האירועים: 4.0" (4.26 מול 4.04, 103 אירועים). החץ נקרא כמו "עלה", כאילו האיחור משפר את
--         הציון. אבל זו לא השוואה בזמן: שני המספרים הם אותה תקופה, עם הגורם ובלעדיו.
--      📏 כך בכל ארבעת האריחים (הגוף החי, שורות 167–171): ‏`direction` = 'up'/'down' לפי with_avg מול without_avg.
--         בשלושה האחרים החץ ▼ "נכון" רק במקרה, והוא נקרא כירידה בזמן. אותו מחלקה ⇒ אותו תיקון לארבעתם.
-- what: החלפה אחת "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר (הדפוס: 20260925000100, מ21).
--       ‏`'direction'` בהשוואת האריחים ⇐ null. ‏`KpiTile` (`src/modules/11_reports/components/KpiTile.jsx:73–78`) מצייר
--       חץ רק לפי `direction`, ומדפיס "ללא שינוי" רק כשיש `direction` — ולכן המסך יציג "בשאר האירועים: 4.0" בלי חץ,
--       גם ביום ששני המספרים שווים. הצד-לקוח שבייצור (`main` 94db912d) זהה בקובץ הזה ⇒ בטוח לפני העלייה.
--       🚫 לא נוגע: הערכים · התוויות · הגרף (F2) · הטבלה · שורת-"אז מה" (F3 — "השתנה", ומתיישבת עכשיו).
-- 📏 הגוף החי לפני: md5 `3af65969c9279ca4601a315d7264690a`, ‏13,013 תווים (= אחרי 20260925000500).
-- 📏 הגוף הצפוי אחרי: md5 `8e44dc98c59af282e9ad80250aa09bdb`, ‏12,976 תווים — בלוק-הניסיון (25/09, בין 01:40 ל-01:56, כמנכ"ל,
--    pg_temp, מתגלגל; md5 הבלוק נבדק במסד מול הקובץ). השתנה רק `tiles[].compare.direction` בארבעת האריחים
--    (down · down · down · up ⇐ null); הערכים, השורות, הגרף, שורת-"אז מה" וההגדרות — זהים.
-- reversible: כן — ההחלפה ההפוכה, או הגוף הקודם (md5 למעלה). אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m06b$
declare
  v_oid oid;
  v_def text;
  v_old_dir text := $o$                   'direction', case when (e ->> 'with_avg')::numeric > (e ->> 'without_avg')::numeric then 'up'
                                     when (e ->> 'with_avg')::numeric < (e ->> 'without_avg')::numeric then 'down'
                                     else 'flat' end) end,$o$;
  v_new_dir text := $n$                   -- ✏️ 25/09/2026 (הכרעת הסגן): בלי חץ. זו לא השוואה בזמן — אותה תקופה, עם הגורם ובלעדיו.
                   --    ▲ על "באיחור בינוני-כבד" (4.26 מול 4.04) נקרא כאילו האיחור מעלה את הציון.
                   'direction', null) end,$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m06_staffing';
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_dir, ''))) <> length(v_old_dir) then
    raise exception 'm06b: factor-compare direction segment not exactly once'; end if;

  v_def := replace(v_def, v_old_dir, v_new_dir);
  execute v_def;
end $m06b$;
