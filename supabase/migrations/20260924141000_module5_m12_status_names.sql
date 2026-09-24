-- why: מבקרים טריים (דרך הסגן), 24/09/2026 — מ12 "ציוד ולוגיסטיקה" מתאר את "כמה להזמין" במילים שאינן
--      במערכת. מיגרציה `20260924120000_module5_upcoming_orders_not_started` (שורות 71–75) כתבה
--      *"פריט שכבר יצא לספק או הגיע אינו נספר"* ו-*"בלוק ההזמנה למטה חותך לפריטים שטרם יצאו לספק"*.
--      שמות-הסטטוס של פריט-לוגיסטיקה הם **טרם החל · הוזמן · מוכן** (`LOGISTICS_STATUS_LABELS`,
--      `src/lib/projectLogistics.js`), ו"בלוק"/"חותך" הם ז'רגון.
--      🔎 **מוצג למשתמשת?** כן — `definitions` ו-`population.label` מצוירים שניהם בחלונית-ההיקף של הדוח
--         (`ReportSurface.jsx` `ScopeLine`: `report-population` · `report-definitions`).
--      ⚠️ באותה פסקת-הגדרות הדוח מגדיר גם *"הוזמן" = הכמות המתוכננת* (עמודה). ולכן הסטטוס נאמר
--         **"בסטטוס 'הוזמן'"** — המילה "בסטטוס" היא מה שמפריד בין השניים.
--      📏 נמדד לפני הכתיבה (24/09, `pg_get_functiondef` חי): כל אחד משני הקטעים מופיע ב-`report_m12_equipment`
--         בדיוק פעם אחת; כותרת הטבלה "כמה להזמין לחודש הקרוב" קיימת בגוף (`extra_tables`); אין מיגרציה
--         מאוחרת יותר ב-`schema_migrations`. ⚠️ `20260924140000` אינה נוגעת בפונקציה הזו.
-- what: שתי החלפות "בדיוק פעם אחת" על הגוף החי (`pg_get_functiondef`), אותה חתימה ⇒ ה-ACL נשמר.
--      הדפוס: `20260924130000_module11_singular_so_what.sql`. שאר המטען לא זז.
-- reversible: כן — ההחלפות ההפוכות. טקסט בלבד; אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m12n$
declare
  v_oid oid;
  v_def text;
  -- (א) ההגדרה — השורה השנייה של "כמות להזמנה".
  v_old_def text := $o$'שלהם עדיין "טרם החל" — פריט שכבר יצא לספק או הגיע אינו נספר, והקמת אתר רישום אינה ציוד · '$o$;
  v_new_def text := $n$'שלהם עדיין "טרם החל" — פריט בסטטוס "הוזמן" או "מוכן" אינו נספר, והקמת אתר רישום אינה ציוד · '$n$;
  -- (ב) תווית-האוכלוסייה.
  v_old_pop text := $o$' שייכות לאירועים שטרם התקיימו. בלוק ההזמנה למטה חותך לפריטים שטרם יצאו לספק, באירועים שטרם התקיימו ('$o$;
  v_new_pop text := $n$' שייכות לאירועים שטרם התקיימו. הטבלה "כמה להזמין לחודש הקרוב" למטה כוללת רק פריטים בסטטוס "טרם החל", באירועים שטרם התקיימו ('$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m12_equipment';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, v_old_def, ''))) <> length(v_old_def) then
    raise exception 'm12n: definitions segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_pop, ''))) <> length(v_old_pop) then
    raise exception 'm12n: population label segment not exactly once'; end if;
  v_def := replace(v_def, v_old_def, v_new_def);
  v_def := replace(v_def, v_old_pop, v_new_pop);
  execute v_def;
end $m12n$;
