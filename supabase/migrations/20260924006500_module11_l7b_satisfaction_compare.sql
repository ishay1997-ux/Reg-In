-- why: מ11 · מ20 "שביעות רצון" — שלוש שורות-השוואה נשברו לשתי שורות ברשת החדשה (בדיקת-הצפיפות, כלל 0.3):
--      "אשתקד (103 מתוך 138): 74.6%". הבסיס של ההשוואה הוא מידע, לא השוואה ⇒ עובר ל-note (נפתח ב-ⓘ),
--      ועל הכרטיס נשאר "▲ אשתקד: 74.6%" — כמו בשאר 15 הדוחות. אותו מספר, אותו חישוב.
-- how: החלפות-טקסט "בדיוק פעם אחת" על הגוף החי, execute. אותה חתימה ⇒ ACL נשמר.
-- reversible: כן — ההחלפות ההפוכות.
-- ישי 23/09 לילה: "לא לבקש אישור להכיל מיגרציות בסשן הזה. תכיל בעצמך ותאמת לבד".
do $m11$
declare
  v_oid oid;
  v_def text;
  v_old text[] := array[
    $a$'label', 'אשתקד (' || v_lri || to_char(v_p_sat, 'FM999,999,999') || v_pdi || ' מתוך '
                   || v_lri || to_char(v_p_comp, 'FM999,999,999') || v_pdi || ')',$a$,
    $b$'label', 'אשתקד (' || v_lri || to_char(v_p_comp, 'FM999,999,999') || v_pdi || ' מתוך '
                   || v_lri || to_char((v_p_comp + v_p_no), 'FM999,999,999') || v_pdi || ')',$b$,
    $c$'label', 'אשתקד, מתוך '
                   || v_lri || to_char(v_p_comp, 'FM999,999,999') || v_pdi || ' משובים',$c$];
  v_new text[] := array[
    $a$'label', 'אשתקד', 'note', v_lri || to_char(v_p_sat, 'FM999,999,999') || v_pdi || ' מתוך '
                   || v_lri || to_char(v_p_comp, 'FM999,999,999') || v_pdi || ' משובים',$a$,
    $b$'label', 'אשתקד', 'note', v_lri || to_char(v_p_comp, 'FM999,999,999') || v_pdi || ' מתוך '
                   || v_lri || to_char((v_p_comp + v_p_no), 'FM999,999,999') || v_pdi || ' שנשלחו',$b$,
    $c$'label', 'אשתקד', 'note', 'מתוך '
                   || v_lri || to_char(v_p_comp, 'FM999,999,999') || v_pdi || ' משובים',$c$];
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m20_satisfaction';
  v_def := pg_get_functiondef(v_oid);
  for i in 1 .. 3 loop
    if (length(v_def) - length(replace(v_def, v_old[i], ''))) <> length(v_old[i]) then
      raise exception 'm11 l7b m20 #%: not exactly once', i; end if;
    v_def := replace(v_def, v_old[i], v_new[i]);
  end loop;
  execute v_def;
end $m11$;
