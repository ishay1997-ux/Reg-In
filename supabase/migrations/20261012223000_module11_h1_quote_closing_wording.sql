-- why: בדוח "סגירת הצעות" (ה1, מ3) שונו תוויות האריחים לבקשת ישי (12/10/2026):
--      1. "פגו בלי מענה" ⇐ "סך הצעות שפג תוקפן"
--      2. "כסף שאבד" ⇐ "הצעות מחיר שנדחו" (באריח, בכותרת הגרף ובסדרה)
-- what: החלפה מדויקת "בדיוק פעם אחת" לכל מקטע על הגוף החי של public.report_m03_trends.
--       החתימה, ה-ACL והערכים נשמרים ללא שינוי.
-- reversible: כן — החלפה הפוכה פשוטה. אין שינוי סכמה ואין פגיעה בנתונים.

do $h1w$
declare
  v_oid oid;
  v_def text;

  -- 1. אריח "כסף שאבד" ⇐ "הצעות מחיר שנדחו"
  v_old_tile_lost text := $o$'key', 'lost_value', 'label', 'כסף שאבד'$o$;
  v_new_tile_lost text := $n$'key', 'lost_value', 'label', 'הצעות מחיר שנדחו'$n$;

  -- 2. אריח "פגו בלי מענה" ⇐ "סך הצעות שפג תוקפן"
  v_old_tile_exp text := $o$'key', 'expired_value', 'label', 'פגו בלי מענה'$o$;
  v_new_tile_exp text := $n$'key', 'expired_value', 'label', 'סך הצעות שפג תוקפן'$n$;

  -- 3. כותרת גרף 1
  v_old_chart_title text := $o$'type', 'bar', 'title', 'כסף שאבד לפי סיבה'$o$;
  v_new_chart_title text := $n$'type', 'bar', 'title', 'הצעות מחיר שנדחו לפי סיבה'$n$;

  -- 4. סדרת גרף 1
  v_old_chart_series text := $o$'key', 'lost_sum', 'label', 'כסף שאבד'$o$;
  v_new_chart_series text := $n$'key', 'lost_sum', 'label', 'הצעות מחיר שנדחו'$n$;

  -- 5. שורת הגדרות — כסף שאבד
  v_old_def_lost text := 'כסף שאבד = סכום ההצעות שנדחו';
  v_new_def_lost text := 'הצעות מחיר שנדחו = סכום ההצעות שנדחו';

  -- 6. שורת הגדרות — פגו בלי מענה
  v_old_def_exp text := 'פגו בלי מענה = הצעות שהמערכת סגרה';
  v_new_def_exp text := 'סך הצעות שפג תוקפן = הצעות שהמערכת סגרה';
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m03_trends';
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_tile_lost, ''))) <> length(v_old_tile_lost) then
    raise exception 'h1w: tile lost_value segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_tile_exp, ''))) <> length(v_old_tile_exp) then
    raise exception 'h1w: tile expired_value segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_chart_title, ''))) <> length(v_old_chart_title) then
    raise exception 'h1w: chart title segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_chart_series, ''))) <> length(v_old_chart_series) then
    raise exception 'h1w: chart series segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_def_lost, ''))) <> length(v_old_def_lost) then
    raise exception 'h1w: lost definition segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_def_exp, ''))) <> length(v_old_def_exp) then
    raise exception 'h1w: exp definition segment not exactly once'; end if;

  v_def := replace(v_def, v_old_tile_lost, v_new_tile_lost);
  v_def := replace(v_def, v_old_tile_exp, v_new_tile_exp);
  v_def := replace(v_def, v_old_chart_title, v_new_chart_title);
  v_def := replace(v_def, v_old_chart_series, v_new_chart_series);
  v_def := replace(v_def, v_old_def_lost, v_new_def_lost);
  v_def := replace(v_def, v_old_def_exp, v_new_def_exp);

  execute v_def;
end $h1w$;
