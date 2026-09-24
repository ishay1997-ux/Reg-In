-- why: הכרעת-ישי, 24/09/2026 (דרך הסגן, "סדר לי את זה"): ב-`report_m12_equipment` ("צריכת ציוד"),
--      "שורות שנמדדו" = **רק אירועים שכבר התקיימו**. עד היום טבלת-המוצרים, הגרף "הוזמן מול הגיע"
--      והשורה "נמדד על N שורות" ספרו גם אירועים עתידיים. באירוע עתידי עוד לא הגיע דבר, ולכן הפער
--      באחוזים התנפח.
--      📏 נמדד לפני הכתיבה (24/09, קריאה בלבד, על המסד החי, בלי מסנן-לקוח):
--         01WEB ‏12.5% ⇐ 4.5% (128/112 ⇐ 110/105) · "נמדד על" 92 ⇐ 74 שורות מתוך 1,781.
--         באותה מדידה: B-ECO-TAG ‏4.7 ⇐ 1.8 · B-FAB-LAN ‏5.0 ⇐ 3.7 · B-REG-TAG ‏4.2 ⇐ 3.3 ·
--         B-SAT-LAN ‏2.0 ⇐ 2.1 · ECO-TAG ‏7.6 ⇐ 7.9 · FAB-LAN ‏4.3 ⇐ 4.4 · REG-TAG ‏2.4 ⇐ 2.6 · SAT-LAN ‏5.9 ⇐ 6.3.
--      🔑 "התקיים" = `final_event_date < v_today` (שעון ישראל). אירוע של היום עוד לא נספר (5 שורות ב-24/09).
--         ל-0 שורות אין `final_event_date` — אף שורה לא נופלת בגלל null.
--      🚫 לא נוגעים: אריח "פער הוזמן מול הגיע" (מוגבל לחלון-התקופה, שמסתיים היום כברירת-מחדל) ·
--         אריחי-העלות · גרף "עלות לפי מוצר" · טבלת "כמה להזמין לחודש הקרוב" · שורות "מחיר מוערך".
--      ⚠️ ולכן גם עמודת "עלות מוזמנת (₪)" בטבלת-המוצרים מסכמת מעכשיו רק אירועים שהתקיימו — היא
--         באותה שורה עם "הוזמן", וההגדרה אומרת "עלות מוזמנת = הוזמן × מחיר". העלות של כל הזמנים
--         נשארת באריח "עלות ציוד מצטברת".
--      🔎 מוצג למשתמשת? כן — `definitions` ו-`population.label` מצוירים בחלונית-ההיקף
--         (`ReportSurface.jsx` `ScopeLine`), ו-`meta.notes` מתחת לאריחים.
--      📏 כל אחד משישת הקטעים מופיע בגוף החי בדיוק פעם אחת (נבדק 24/09, `pg_get_functiondef`,
--         md5 ‏572f7b502a50dab316d55e963d54b64b). המיגרציה האחרונה במסד: `module11_drop_m16_quality_cost`.
-- what: שש החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר. הדפוס:
--       `20260924141000_module5_m12_status_names.sql`. ההחלפה בטבלה נעשית ב-regexp, כי בין "as t"
--       ל-"from" יש שבירת-שורה והזחה.
-- reversible: כן — ההחלפות ההפוכות. אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m12p$
declare
  v_oid oid;
  v_def text;
  -- (1) "נמדד על N שורות" — רק שורות שאינן מילוי-אוטומטי, ורק מאירועים שהתקיימו.
  v_old_meas text := $o$(select count(*) from priced where not actual_qty_autofilled),$o$;
  v_new_meas text := $n$(select count(*) from priced where not actual_qty_autofilled and final_event_date < v_today),$n$;
  -- (2) הגרף "הוזמן מול הגיע".
  v_old_chart text := $o$from priced where coalesce(category, '') = 'product'$o$;
  v_new_chart text := $n$from priced where coalesce(category, '') = 'product' and final_event_date < v_today$n$;
  -- (3) טבלת-המוצרים (הזנב שלה: drill_key ⇐ as t ⇐ from priced group by).
  v_re_table text := $r$('sku', sku\)\) as t)(\s+)from priced group by sku, item_name\) s\),$r$;
  v_new_table text := $n$\1\2from priced where final_event_date < v_today group by sku, item_name) s),$n$;
  -- (4) תווית-האוכלוסייה.
  v_old_pop text := $o$' שייכות לאירועים שטרם התקיימו. הטבלה "כמה להזמין לחודש הקרוב" למטה$o$;
  v_new_pop text := $n$' שייכות לאירועים שטרם התקיימו. טבלת-המוצרים והגרף "הוזמן מול הגיע" כוללים רק אירועים שהתקיימו לפני היום. הטבלה "כמה להזמין לחודש הקרוב" למטה$n$;
  -- (5) ההגדרות.
  v_old_def text := $o$'"פער" = הפרש יחידות, לא ₪ · $o$;
  v_new_def text := $n$'"פער" = הפרש יחידות, לא ₪, ובטבלת-המוצרים ובגרף "הוזמן מול הגיע" הוא נמדד רק באירועים שהתקיימו לפני היום — באירוע עתידי עוד לא הגיע דבר · $n$;
  -- (6) ההערה מתחת לאריחים.
  v_old_note text := $o$' — בשאר, "הגיע בפועל" הועתק מהמתוכנן ולא נמדד.'$o$;
  v_new_note text := $n$' — בשאר, האירוע עוד לא התקיים, או ש"הגיע בפועל" הועתק מהמתוכנן ולא נמדד.'$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m12_equipment';
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_meas, ''))) <> length(v_old_meas) then
    raise exception 'm12p: measured-count segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_chart, ''))) <> length(v_old_chart) then
    raise exception 'm12p: ordered-vs-arrived chart segment not exactly once'; end if;
  if regexp_count(v_def, v_re_table) <> 1 then
    raise exception 'm12p: product-table segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_pop, ''))) <> length(v_old_pop) then
    raise exception 'm12p: population label segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_def, ''))) <> length(v_old_def) then
    raise exception 'm12p: definitions segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_note, ''))) <> length(v_old_note) then
    raise exception 'm12p: measured note segment not exactly once'; end if;

  v_def := replace(v_def, v_old_meas, v_new_meas);
  v_def := replace(v_def, v_old_chart, v_new_chart);
  v_def := regexp_replace(v_def, v_re_table, v_new_table);
  v_def := replace(v_def, v_old_pop, v_new_pop);
  v_def := replace(v_def, v_old_def, v_new_def);
  v_def := replace(v_def, v_old_note, v_new_note);
  execute v_def;
end $m12p$;
