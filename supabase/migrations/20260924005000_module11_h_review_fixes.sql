-- why: מ11 · ממצאי הסוקר-היריב (Opus, קריאה-בלבד, 24/09/2026) על ה1 וה3 — אחרי שכל המספרים שוחזרו ונמצאו תואמים.
--      ① ה3: כשאף גורם לא עבר את סף-ה-n בשני הצדדים (למשל בסינון-לקוח), שורת-ההחלטה אמרה "אף גורם לא מוריד את
--         הציון באופן ברור" — מסקנה על מדגם שאסור להסיק ממנו (התוכנית §9ב.3). עכשיו: "אין עדיין מספיק אירועים".
--      ② ה3: טקסט-הסיכון אמר "יותר מ-50" בעוד התנאי הוא ≥ 50 (פרויקט 1601 עומד בדיוק על 50).
--      ③ ה1: ערך-ההצעה עוגל לשקל לפני הסכימה (724,690 מול 724,686.50) — עכשיו לאגורה, והתצוגה מעגלת.
-- how: החלפות-טקסט "בדיוק פעם אחת" על הגוף החי (pg_get_functiondef), execute. אותה חתימה ⇒ ACL נשמר.
-- reversible: כן — ההחלפות ההפוכות.
-- ישי 23/09 לילה: "לא לבקש אישור להכיל מיגרציות בסשן הזה. תכיל בעצמך ותאמת לבד".
do $m11$
declare
  v_oid oid;
  v_def text;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m06_staffing';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, $o0$    when v_best is null then 'להמשיך לעקוב — אף גורם לא מוריד את ציון המשוב באופן ברור.'$o0$, ''))) <> length($o0$    when v_best is null then 'להמשיך לעקוב — אף גורם לא מוריד את ציון המשוב באופן ברור.'$o0$) then
    raise exception 'm11 h3 #0: not exactly once'; end if;
  v_def := replace(v_def, $o0$    when v_best is null then 'להמשיך לעקוב — אף גורם לא מוריד את ציון המשוב באופן ברור.'$o0$, $n0$    when not exists (select 1 from jsonb_array_elements(v_factors) e where (e ->> 'enough')::boolean) then
      'אין עדיין מספיק אירועים בכל צד כדי להסיק — להמשיך לאסוף משובים.'
    when v_best is null then 'להמשיך לעקוב — אף גורם לא מוריד את ציון המשוב באופן ברור.'$n0$);
  if (length(v_def) - length(replace(v_def, $o1$case when per_hostess >= v_ratio_cap then 'יותר מ-50 אורחים לדיילת' end$o1$, ''))) <> length($o1$case when per_hostess >= v_ratio_cap then 'יותר מ-50 אורחים לדיילת' end$o1$) then
    raise exception 'm11 h3 #1: not exactly once'; end if;
  v_def := replace(v_def, $o1$case when per_hostess >= v_ratio_cap then 'יותר מ-50 אורחים לדיילת' end$o1$, $n1$case when per_hostess >= v_ratio_cap then '50+ אורחים לדיילת' end$n1$);
  execute v_def;
end $m11$;

do $m11$
declare
  v_oid oid;
  v_def text;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m03_trends';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, $o0$(coalesce(q.applied_customer_discount, 0) + coalesce(q.manual_discount, 0)) / 100.0, 2)),$o0$, ''))) <> length($o0$(coalesce(q.applied_customer_discount, 0) + coalesce(q.manual_discount, 0)) / 100.0, 2)),$o0$) then
    raise exception 'm11 h1 #0: not exactly once'; end if;
  v_def := replace(v_def, $o0$(coalesce(q.applied_customer_discount, 0) + coalesce(q.manual_discount, 0)) / 100.0, 2)),$o0$, $n0$(coalesce(q.applied_customer_discount, 0) + coalesce(q.manual_discount, 0)) / 100.0, 2), 2),$n0$);
  execute v_def;
end $m11$;
