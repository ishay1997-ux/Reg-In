-- why: הכרעת-ישי, 25/09/2026 03:1X, בצ'אט של מסביר-הדוחות, על ההמלצה "כן, כדי שיהיה מספר אחד" — מילה-במילה:
--      *"מאשר הכל לפי המלצתך"*. אריח "שולי-רווח גולמי" של מ2 נמדד על כל האירועים שהתקיימו, כולל השבוע
--      האחרון, ומ8 (אחרי 20260925010100) רק על אירועים שנסגרו — "גג שבוע", כמו מ12. ‏📏 נמדד 25/09, אותה
--      תקופה (01/01–25/09/2026, כל הלקוחות): מ2 **57.8%** (248 אירועים) · מ8 **57.5%** (244). ההפרש = 4 אירועים
--      מהשבוע האחרון (1591 · 1594 · 1595 · 1596), שעלות-הדיילות שלהם עוד לא דווחה.
-- what: החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר (הדפוס: 20260925010100).
--       **רק שולי-הרווח זזים** — המונה (רווח) והמכנה (הכנסה) שניהם על אירועים שנסגרו: `final_event_date < היום − 7`,
--       ו"לא בוטל" כבר נאכף (ארבעת הסטטוסים). אשתקד: אותו כלל שנה אחורה, כמו ב-prev של מ8
--       (`< (v_today - interval '1 year')::date - 7`).
--       (1) declare: ‏`v_mrev` · `v_mprof` · `v_prev_mrev` · `v_prev_mprof`.
--       (2) ארבע ספירות נוספות ב-select, מתוך `cur`/`prev` הקיימים (אותו מסנן-לקוח, אותו חלון).
--       (3) ה-`into` מקבל אותן.
--       (4) ‏`v_margin` / `v_prev_margin` ⇐ מהן. שורת-"אז מה" קוראת את אותם משתנים ⇒ זזה איתם.
--       (5) ההגדרות (בתוך השבב, סגור כברירת-מחדל): "על כל האירועים יחד" ⇐ "על כל האירועים שנסגרו יחד"
--           + "אירוע שנסגר = …" — אותו נוסח כמו בהגדרות מ8. בלי זה ההגדרה משקרת.
--       🚫 לא נוגע: אריח ההכנסות · אריח "אירועים שהסתיימו" (248) · הגרף · הטבלה · שורת-האוכלוסייה · נתח-5 · הרמזים.
--       🔑 מ2 ממשיך לחשב `gross_profit` ולא `coalesce(final_profit, gross_profit)` כמו מ8 (הערת 📑ב#1 בגוף) —
--          היום שני הביטויים זהים בכל 244 האירועים (0 שונים, נמדד 25/09); אם יתפצלו, מ2 ומ8 יתפצלו שוב.
-- 📏 הגוף החי לפני: md5 `e5d48b5a06bde41a48ae465b055f9dd9`, ‏17,139 תווים.
-- 📏 הגוף הצפוי אחרי: md5 `634c7ef11e52a1a5da583cfdbf828064`, ‏18,079 תווים — בלוק-ניסיון (25/09): אותו DO כמו כאן
--    (md5 הבלוק `c15b3e8e…` נבדק במסד מול הקובץ), ב-EXECUTE בתוך DO שמסתיים ב-raise ⇒ גלגול; ה-ACL זהה לפני/אחרי;
--    אחריו נבדק שהגוף החי עדיין `e5d48b5a…`.
-- 📏 בלוק-הניסיון, קריאה כמנכ"ל (null,null,null,null), 01/01–25/09/2026: שולי-רווח 57.80% ⇐ **57.50%** (= מ8) ·
--    אשתקד 55.91% ⇐ 55.94% · "אז מה": "…גבוהות ב-36.8% מאשתקד, ושולי-הרווח עלו ל-57.5%." · אריח ההכנסות,
--    "אירועים שהסתיימו" (248), נתח-5, הגרף, הטבלה ושורת-האוכלוסייה — זהים לפני/אחרי.
-- reversible: כן — ההחלפות ההפוכות, או הגוף הקודם (md5 למעלה). אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m02c$
declare
  v_oid oid;
  v_def text;
  -- (1) declare.
  v_old_decl text := $o$  v_prev_prof numeric;
$o$;
  v_new_decl text := $n$  v_prev_prof numeric;
  v_mrev numeric;
  v_mprof numeric;
  v_prev_mrev numeric;
  v_prev_mprof numeric;
$n$;
  -- (2) הספירות — הכנסה ורווח של האירועים שנסגרו, עכשיו ואשתקד.
  v_old_sel text := $o$         (select coalesce(sum(gross_profit), 0) from prev),
         tn.ncust, tn.total, tn.top5,$o$;
  v_new_sel text := $n$         (select coalesce(sum(gross_profit), 0) from prev),
         -- ✏️ 25/09/2026 (הכרעת-ישי 03:1X, "מספר אחד" עם מ8): שולי-הרווח רק על אירועים שנסגרו — "גג שבוע".
         --    אירוע מהשבוע האחרון עוד בסגירה: עלות-הדיילות שלו עוד לא דווחה, והרווח שלו נראה גבוה מדי.
         (select coalesce(sum(revenue), 0) from cur where final_event_date < v_today - 7),
         (select coalesce(sum(gross_profit), 0) from cur where final_event_date < v_today - 7),
         (select coalesce(sum(revenue), 0) from prev
           where final_event_date < (v_today - interval '1 year')::date - 7),
         (select coalesce(sum(gross_profit), 0) from prev
           where final_event_date < (v_today - interval '1 year')::date - 7),
         tn.ncust, tn.total, tn.top5,$n$;
  -- (3) into.
  v_old_into text := $o$    into v_n, v_rev, v_prof, v_frozen, v_prev_n, v_prev_rev, v_prev_prof,
$o$;
  v_new_into text := $n$    into v_n, v_rev, v_prof, v_frozen, v_prev_n, v_prev_rev, v_prev_prof,
         v_mrev, v_mprof, v_prev_mrev, v_prev_mprof,
$n$;
  -- (4) השוליים.
  v_old_margin text := $o$  v_margin        := 100 * v_prof / nullif(v_rev, 0);
  v_prev_margin   := 100 * v_prev_prof / nullif(v_prev_rev, 0);
$o$;
  v_new_margin text := $n$  -- ✏️ 25/09/2026: המונה והמכנה על אותה אוכלוסייה — אירועים שנסגרו (כמו מ8).
  v_margin        := 100 * v_mprof / nullif(v_mrev, 0);
  v_prev_margin   := 100 * v_prev_mprof / nullif(v_prev_mrev, 0);
$n$;
  -- (5) ההגדרות.
  v_old_defs text := $o$'שולי-רווח = סך הרווח הגולמי חלקי סך ההכנסה, על כל האירועים יחד · $o$;
  v_new_defs text := $n$'שולי-רווח = סך הרווח הגולמי חלקי סך ההכנסה, על כל האירועים שנסגרו יחד · אירוע שנסגר = התקיים לפני יותר משבוע ולא בוטל · $n$;
begin
  v_oid := 'public.report_m02_exec_overview(date,date,integer,jsonb,integer,integer)'::regprocedure;
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_decl, ''))) <> length(v_old_decl) then
    raise exception 'm02c: declare segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_sel, ''))) <> length(v_old_sel) then
    raise exception 'm02c: select segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_into, ''))) <> length(v_old_into) then
    raise exception 'm02c: into segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_margin, ''))) <> length(v_old_margin) then
    raise exception 'm02c: margin segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_defs, ''))) <> length(v_old_defs) then
    raise exception 'm02c: definitions segment not exactly once'; end if;

  v_def := replace(v_def, v_old_decl, v_new_decl);
  v_def := replace(v_def, v_old_sel, v_new_sel);
  v_def := replace(v_def, v_old_into, v_new_into);
  v_def := replace(v_def, v_old_margin, v_new_margin);
  v_def := replace(v_def, v_old_defs, v_new_defs);
  execute v_def;
end $m02c$;
