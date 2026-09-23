-- why: מ11 · ה3 — המשך לממצא ① של הסוקר (24/09/2026). בסינון ללקוח אחד (אלפא סיסטמס) רק גורם אחד מתוך ארבעה
--      עבר את סף-ה-n, ושורת-ההחלטה אמרה "אף גורם לא מוריד את הציון" — טענה על ארבעה גורמים כשנמדד אחד.
--      עכשיו המשפט אומר רק את מה שנמדד: "בגורמים שנמדדו אין פער ברור".
-- how: החלפת-טקסט "בדיוק פעם אחת" על הגוף החי, execute. אותה חתימה ⇒ ACL נשמר.
-- reversible: כן — ההחלפה ההפוכה.
-- ישי 23/09 לילה: "לא לבקש אישור להכיל מיגרציות בסשן הזה. תכיל בעצמך ותאמת לבד".
do $m11$
declare
  v_oid oid;
  v_def text;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m06_staffing';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, $o0$'להמשיך לעקוב — אף גורם לא מוריד את ציון המשוב באופן ברור.'$o0$, ''))) <> length($o0$'להמשיך לעקוב — אף גורם לא מוריד את ציון המשוב באופן ברור.'$o0$) then
    raise exception 'm11 h3 measured #0: not exactly once'; end if;
  v_def := replace(v_def, $o0$'להמשיך לעקוב — אף גורם לא מוריד את ציון המשוב באופן ברור.'$o0$, $n0$'להמשיך לעקוב — בגורמים שנמדדו אין פער ברור בציון המשוב.'$n0$);
  execute v_def;
end $m11$;
