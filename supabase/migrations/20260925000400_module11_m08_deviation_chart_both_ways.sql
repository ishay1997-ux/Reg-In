-- why: הכרעת הסגן, 25/09/2026 (לילה), מילה-במילה: *"קודם בדוק אם זה עדיין נכון אחרי סגירת 20 האירועים.
--      אם כן — תקן, כדי שהגרף יראה את שני הכיוונים, כמו שהרמז אומר. אם לא — 'לא נדרש', עם המדידה."*
--      והקשר-ישי (צ'אט הסגן, 24/09 ~23:5X): *"בצע מה שאתה יכול עכשיו"*.
--      🔎 הממצא (מעבר-הדוחות 24/09, `explain\מ8-profitability.json` + `RESULT.md` חמור 2): הגרף "15 הסטיות
--         הגדולות ב-₪" ברווחיות פרויקטים (מ8) הציג רק עמודות שליליות, 14 מתוך 15 אירועים בלי שעות, והחריגה
--         ששורת-"אז מה" שולחת אליה (1416, ‏+361 ₪) לא הופיעה בו. הרמז `reports.profitability.sortWhy`
--         (`src/lib/onboardingCopy.m11.finance.js:90`) אומר: "הגרף מציג את הסטיות הגדולות לשני הכיוונים".
--      📏 נמדד עכשיו, 25/09/2026, אחרי סגירת 20 האירועים (`20260924233000_seed_close_events_2026_09`), כמנכ"ל,
--         בשתי הקריאות של הדף — (null,null) ו-(01/01/2026–25/09/2026) — תוצאה זהה:
--         · הגרף: 15 עמודות, **כולן שליליות**, מ-−1,854 ₪ (1594) עד −518 ₪ (1585). ‏5 מהן אירועים בלי אף שעה
--           (1594 · 1591 · 1595 · 1589 · 1590), ו-10 אירועים עם שעות וחיסכון אמיתי.
--         · שורת-"אז מה": פרויקט 1416, ‏361 ₪ (21.1%) — **לא בגרף**. הוא החריגה החיובית הגדולה בתקופה, ומדורג
--           23 בערך מוחלט.
--         · 🔑 גם בלי האירועים שאין להם שעות — 15 הגדולות בערך מוחלט כולן שליליות (−970…−410). ⇒ הסרת האירועים
--           בלי שעות **לא** מביאה את שני הכיוונים; מה שחסר הוא בחירה לפי כיוון.
--         · באוכלוסייה: 92 סטיות חיוביות · 134 שליליות · 22 אפס · 0 ריקות (מתוך 248).
--      📏 הגוף החי לפני הכתיבה: md5 `25422dda6fb9311ebfb73388bcf0c8a5`, ‏17,906 תווים (`pg_get_functiondef`, 25/09).
--      📏 הגוף הצפוי אחרי ההחלה: md5 `86d741fe2d13517844793493f1515469`, ‏19,005 תווים — אותן ארבע ההחלפות על
--         `pg_get_functiondef` החי, וזהה למה שבלוק-הניסיון הריץ (25/09).
--      📏 בלוק-הניסיון (25/09, כמנכ"ל, pg_temp, מתגלגל אחורה): אחרי — 15 עמודות, ‏8 שליליות (−1,854…−797) ו-7
--         חיוביות (+361…+291), ‏1416 בגרף; שורת-"אז מה" · האריחים · הטבלה · האוכלוסייה · ההערות — זהים לפני ואחרי,
--         בשתי הקריאות (null,null) ו-(01/01–25/09).
-- what: ארבע החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר. הדפוס:
--       `20260924213000_module11_m02_revenue_tile_no_door.sql`.
--       (1) בחירת 15 העמודות: דירוג בתוך כל כיוון, ולוקחים לסירוגין — הגדולה מכל צד, אחריה השנייה מכל צד…
--           (7–8 לכל צד); כשבצד אחד יש פחות — הצד השני משלים ל-15. סטייה 0 אינה בגרף. סדר-העמודות בגרף
--           נשאר "לפי גודל מוחלט" (כרטיס מ8 §③, `cards-finance.md:241`).
--       (2) כותרת-הגרף: "15 הסטיות הגדולות ב-₪" ⇐ "הסטיות הגדולות ב-₪ — מעל התכנון ומתחתיו". הישנה כבר לא נכונה:
--           הגרף אינו 15 הגדולות בערך מוחלט (למשל +291 ₪ בגרף, −757 ₪ לא).
--       (3) הערת-הקוד שציטטה את הכותרת הישנה.
--       (4) `'filter_key', false` בגרף. כרטיס מ8 (`cards-finance.md:226`): "עמודה בגרף-הסטיות — לא לחיץ". עד היום
--           זה קרה מעצמו: אף עמודה לא הייתה בטבלה, ו-`autoFilterKey` (`ReportSurface.jsx:240`) כיבה את הסינון.
--           עכשיו 1416 בגרף ובטבלה ⇒ הסינון היה נדלק, ולחיצה על עמודה שלילית הייתה מסננת את הטבלה לאפס שורות.
--       🚫 לא נוגע: האריחים · הטבלה · שורת-"אז מה" · האוכלוסייה · ששת האירועים של 17–23/09 שעוד אין להם שעות.
-- reversible: כן — ההחלפות ההפוכות, או הגוף הקודם (md5 למעלה). אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m08b$
declare
  v_oid oid;
  v_def text;
  -- (1) בחירת העמודות.
  v_old_pick text := $o$from (select * from win order by abs(budget_deviation) desc limit 15) t),$o$;
  v_new_pick text := $n$-- ✏️ 25/09/2026 (הכרעת הסגן): שני הכיוונים, כמו שהרמז reports.profitability.sortWhy אומר.
            --    עד כאן: 15 הגדולות בערך מוחלט. נמדד 25/09, אחרי סגירת 20 האירועים: כל 15 שליליות,
            --    ו-1416 (+361 ש"ח) של שורת-"אז מה" לא בגרף. גם בלי האירועים שאין להם שעות — כולן שליליות.
            --    עכשיו: דירוג בתוך כל כיוון, ולוקחים לסירוגין (7-8 לכל צד); צד קצר ⇒ הצד השני משלים ל-15.
            --    סטייה 0 אינה סטייה. סדר-העמודות בגרף לא נגע (כרטיס §③: "ממוין לפי גודל מוחלט").
            from (select * from win where budget_deviation <> 0
                   order by row_number() over (partition by sign(budget_deviation)
                                               order by abs(budget_deviation) desc, project_id),
                            abs(budget_deviation) desc, project_id
                   limit 15) t),$n$;
  -- (2) כותרת-הגרף.
  v_old_title text := $o$'type', 'bar', 'title', '15 הסטיות הגדולות ב-₪',$o$;
  v_new_title text := $n$'type', 'bar', 'title', 'הסטיות הגדולות ב-₪ — מעל התכנון ומתחתיו',$n$;
  -- (3) ההערה שציטטה את הכותרת הישנה.
  v_old_note text := $o$-- הכותרת נוקבת *"15 הסטיות הגדולות ב-₪"* ⇒ הסדרה היא כסף.$o$;
  v_new_note text := $n$-- הכותרת נוקבת *"ב-₪"* ⇒ הסדרה היא כסף. (✏️ 25/09: "15" ירד מהכותרת — הגרף הוא 7-8 לכל כיוון.)$n$;
  -- (4) הגרף אינו לחיץ.
  v_old_click text := $o$'data', v_chart, 'xKey', 'project_id', 'domain', null,$o$;
  v_new_click text := $n$-- ✏️ 25/09/2026: כרטיס מ8 — "עמודה בגרף-הסטיות: לא לחיץ". עד כאן זה קרה מעצמו (אף עמודה לא
      --    הייתה בטבלה ⇒ autoFilterKey כיבה). עכשיו 1416 בשניהם ⇒ הסינון היה נדלק, ולחיצה על עמודה
      --    שלילית הייתה מסננת את הטבלה לאפס שורות.
      'data', v_chart, 'xKey', 'project_id', 'domain', null, 'filter_key', false,$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m08_profitability';
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_pick, ''))) <> length(v_old_pick) then
    raise exception 'm08b: chart-pick segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_title, ''))) <> length(v_old_title) then
    raise exception 'm08b: chart-title segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_note, ''))) <> length(v_old_note) then
    raise exception 'm08b: title-note segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_click, ''))) <> length(v_old_click) then
    raise exception 'm08b: chart-click segment not exactly once'; end if;

  v_def := replace(v_def, v_old_pick, v_new_pick);
  v_def := replace(v_def, v_old_title, v_new_title);
  v_def := replace(v_def, v_old_note, v_new_note);
  v_def := replace(v_def, v_old_click, v_new_click);
  execute v_def;
end $m08b$;
