-- why: הכרעת הסגן, 25/09/2026 (ממצא 4 של מעבר-הדוחות, `reports-review-2026-09-25\explain\_work\RESULT.md`):
--      *"מוסיפים עמודה שמראה את הסימון, מאותו מקור שמ14 סופר ממנו ("אדומות"). נדחה: למחוק את המשפט
--      מהרמז. אם אין לזה מקור אחד במסד — [שאלה]."* · ישי, בצ'אט של הסגן (~23:5X): *"בצע מה שאתה יכול עכשיו"*.
--      🔎 הממצא: לכל שורה ב"אמינות והתייצבות" (`report_m15_reliability`) יש `band` (‏'red'/'amber'/null),
--         ואף אחת משמונה העמודות לא מציגה אותו. השבב "אדומות וענבר בלבד" לא מבחין בין השתיים, והרמזים
--         אומרים "התחילי מהדיילות האדומות" (מ14, `onboardingCopy.m11.hostesses.js:75`) ו"עברי על השורות
--         האדומות" (מ15, שם:97) — על מסך שבו אי-אפשר לדעת מי אדומה.
--      📏 נמדד לפני הכתיבה (25/09/2026, `pg_get_functiondef` חי, קריאה בלבד):
--         ‏`report_m15_reliability` md5 `acec24d22f9202dcbd0f33951aab2efc` · ‏29,738 תווים ·
--         ‏`report_m14_hostess_overview` md5 `ff571396a45a0c906f1022c2a5ca916c` · ‏31,272 תווים.
--      🔑 "מקור אחד" — נבדק בשני הגופים, והוא אותו כלל, אותם פרמטרים ואותה אוכלוסייה:
--         חלון קפוא 12 חודשים עד היום (מ15 שורות 53–56 · מ14 שורות 90–92) · אותו `val` · אותו ממוצע-חברה
--         (‏`avg(val)` על החלון) · אותו ציון ממותן עם `קבוע_ריסון_m` ו-`מינימום_תשובות_להצגת_ציון` ·
--         אדומה = ציון < `מקדם_אמינות_אדום` × ממוצע · ענבר = מתחת ל-`מקדם_אמינות_ענבר` × ממוצע
--         (מ15 `banded` שורות 207–213 · מ14 `tagged` שורות 270–274).
--      📏 חי, כמנכ"ל, ברירת-מחדל (null×4): מ15 — 90 שורות: 5 אדומות · 7 ענבר · 78 בלי סימון; מ14 — אריח
--         "דיילות אדומות" = 5 ("5 מתוך 90 … · 7 בענבר"); אותם חמישה שמות בדיוק; ממוצע-החברה 0.956275 בשניהם,
--         ספים 0.831959 / 0.908461 בשניהם. (אתמול: 6 אדומות · 5 ענבר — הנתונים זזו בסגירת האירועים הלילה.)
--      🔎 מוצג למשתמשת? כן — עמודה חדשה "סימון" בטבלה הראשית של מ15, שנייה מימין (אחרי "דיילת"),
--         וגם בקובץ-האקסל (הייצוא לוקח את `columns[]` כפי שהוא). הערכים: "אדומה" · "ענבר" · "מעל שני הספים".
--         כשהסימון כבוי (המקדמים הפוכים, `v_bands_on` = false) — אין סימון לאף אחת ⇒ `null` ⇒ "—".
--         במצב-יום (בחירת יום בגרף) העמודה נשארת: הסימון הוא של החלון הקפוא ואינו תלוי-יום.
--      ⚪ המחרוזות החדשות אינן נושאות מספר ⇒ אין צורך ב-LRI…PDI.
-- what: שתי החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר. הדפוס:
--       `20260924213000_module11_m02_revenue_tile_no_door.sql`.
--       (1) בשורה: אחרי `'band', b.band,` נוסף `'band_label'` — נגזר מ-`b.band` עצמו, אותו ערך שסופר את
--           האריח "דיילות מסומנות" (`tallies`) ושהשבב "אדומות וענבר בלבד" מסנן לפיו. `band` נשאר כפי שהוא.
--       (2) ב-`columns[]`: אחרי "דיילת" נוספת `{key 'band_label', label 'סימון', format 'text', align 'start'}`.
--       המיון לא נגע: `score asc` כבר שם את האדומות ראשונות ואחריהן הענבר (נמדד: 5 אדומות ואז 7 ענבר).
--       📏 צפוי אחרי ההחלה: md5 `fa878407a7beef4162de932e2f9c53ff` · ‏30,357 תווים
--          (חושב ב-SELECT על `pg_get_functiondef` עם אותן החלפות, וזהה למה שבלוק-הניסיון הריץ).
-- reversible: כן — ההחלפות ההפוכות (מחיקת שני הקטעים שנוספו), או הגוף הקודם מ-`pg_get_functiondef`
--             (md5 למעלה). אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m15b$
declare
  v_oid oid;
  v_def text;
  -- (1) השורה: הערך הקריא של הסימון, מיד אחרי `band`.
  v_old_row text := $o$             'band',          b.band,
$o$;
  v_new_row text := $n$             'band',          b.band,
             -- 🆕 25/09/2026 · הכרעת-הסגן: הסימון גלוי בטבלה — מאותו `band` בדיוק שסופר כאן את
             --    "דיילות מסומנות" ובמ14 את "דיילות אדומות". כשהסימון כבוי (`v_bands_on` = false)
             --    אין סימון לאף אחת ⇒ `null` ⇒ "—", ולא "מעל שני הספים" שהיה שקר.
             'band_label',    case when b.band = 'red'   then 'אדומה'
                                   when b.band = 'amber' then 'ענבר'
                                   when v_bands_on       then 'מעל שני הספים' end,
$n$;
  -- (2) העמודה: "סימון", מיד אחרי "דיילת" — שם מתחילה הקריאה.
  v_old_col text := $o$      jsonb_build_object('key', 'hostess_name',  'label', 'דיילת',                'format', 'text',  'align', 'start'),
$o$;
  v_new_col text := $n$      jsonb_build_object('key', 'hostess_name',  'label', 'דיילת',                'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'band_label',    'label', 'סימון',                'format', 'text',  'align', 'start'),
$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m15_reliability';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, v_old_row, ''))) <> length(v_old_row) then
    raise exception 'm15b: row band segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_col, ''))) <> length(v_old_col) then
    raise exception 'm15b: hostess_name column segment not exactly once'; end if;
  v_def := replace(v_def, v_old_row, v_new_row);
  v_def := replace(v_def, v_old_col, v_new_col);
  execute v_def;
end $m15b$;
