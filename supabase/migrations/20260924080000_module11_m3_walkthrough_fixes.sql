-- why: מ11 · חבילה 0ג (ליטושי-הכנס, סיור-העיניים של הסגן על 16 הדוחות בייצור, 24/09/2026).
--      ① מ09 "גיול חובות" — "הגדול שבהם" במשפט-"אז מה" הציג את **החשבונית** הגדולה מעל 60 יום (10,163 ₪),
--         בעוד המשפט מדבר על **לקוחות** ("לגבות … מ-N לקוחות"). ⇒ הלקוח עם הסכום הגבוה מעל 60 יום (סכום על
--         חשבוניותיו). הבדיקה: 27,186 ₪ (ארבע חשבוניות — 1460 · 1515 · 1512 · 1522).
--      ② מ07 "מבט-על כספים" ו-מ14 "מבט-על דיילות" אמרו את אותה שורת-פעולה כמו הדוח המפורט (מ09 · מ15).
--         ⇒ מבט-העל מפנה לדוח המפורט, בתקדים של מ19 (`לפתוח את "שביעות רצון" — …`). הדוח המפורט שומר את הפעולה.
--      ③ מ08 ו-מ12 — ה-ⓘ של האריחים אמר רק "התקופה שנבחרה" ⇒ התאריכים עצמם (DD/MM/YYYY–DD/MM/YYYY).
-- how: החלפות-טקסט "בדיוק פעם אחת" (או מספר מדוד) על הגוף החי, execute. אותה חתימה ⇒ ACL נשמר (נבדק אחרי).
-- reversible: כן — ההחלפות ההפוכות. אין שינוי-סכמה ואין נתונים.
-- ישי 24/09/2026, בצ'אט: "אני מאשר לך מראש להכיל מיגרציות בלי לעצור".
do $m11$
declare
  v_oid oid;
  v_def text;

  procedure_names text[] := array[
    'report_m09_aging', 'report_m09_aging',
    'report_m07_finance_overview',
    'report_m14_hostess_overview'];
  v_old text[] := array[
    $a$(select company_name from tagged where bucket_key in ('d61_90', 'd90p') order by amt desc limit 1),$a$,
    $b$(select amt from tagged where bucket_key in ('d61_90', 'd90p') order by amt desc limit 1),$b$,
    $c$'לגבות ' || v_lri || to_char(round(v_over60_sum), 'FM999,999,999') || ' ₪' || v_pdi
        || ' שממתינים מעל ' || v_lri || '60' || v_pdi || ' יום ב-' || v_lri || v_over60_n || v_pdi
        || case when v_over60_n = 1 then ' חשבונית' else ' חשבוניות' end
        || ' — הוותיקה כבר ' || v_lri || coalesce(v_oldest_days, 0) || v_pdi
        || case when coalesce(v_oldest_days, 0) = 1 then ' יום' else ' ימים' end
        || ', אצל ' || coalesce(v_oldest_name, '—') || '.'$c$,
    $d$else 'לא לשלוח את ' || to_char(coalesce(v_red, 0), 'FM999,999,999') || ' הדיילות האדומות לאירועים הקרובים — ' || to_char(coalesce(v_red_active, 0), 'FM999,999,999') ||
           ' מהן פעילות ומוצעות היום בשיבוץ.' end,$d$];
  v_new text[] := array[
    $a$(select company_name from tagged where bucket_key in ('d61_90', 'd90p') group by customer_id, company_name order by sum(amt) desc, customer_id limit 1),$a$,
    $b$(select sum(amt) from tagged where bucket_key in ('d61_90', 'd90p') group by customer_id, company_name order by sum(amt) desc, customer_id limit 1),$b$,
    $c$'לפתוח את "גיול חובות" — ' || v_lri || to_char(round(v_over60_sum), 'FM999,999,999') || ' ₪' || v_pdi
        || ' ממתינים מעל ' || v_lri || '60' || v_pdi || ' יום ב-' || v_lri || v_over60_n || v_pdi
        || case when v_over60_n = 1 then ' חשבונית.' else ' חשבוניות.' end$c$,
    $d$else 'לפתוח את "אמינות והתייצבות" — '
           || case when v_red = 1 then 'דיילת אדומה אחת'
                   else to_char(coalesce(v_red, 0), 'FM999,999,999') || ' דיילות אדומות' end
           || ', ' || to_char(coalesce(v_red_active, 0), 'FM999,999,999') ||
           ' מהן פעילות ומוצעות היום בשיבוץ.' end,$d$];

  -- ③ ⓘ-התקופה: מספר-המופעים נמדד על הגוף החי 24/09 (מ08: 5 · מ12: 2) — והוא נבדק, לא מונח.
  v_win_old text := $w$'window', 'התקופה שנבחרה'$w$;
  v_win_new text := $w$'window', v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi$w$;
  v_win_fn text[] := array['report_m08_profitability', 'report_m12_equipment'];
  v_win_n int[] := array[5, 2];
  v_cur text;
begin
  -- ①② — כל פונקציה נטענת פעם אחת, כל ההחלפות שלה, ואז execute.
  foreach v_cur in array array['report_m09_aging', 'report_m07_finance_overview', 'report_m14_hostess_overview'] loop
    select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = v_cur;
    v_def := pg_get_functiondef(v_oid);
    for i in 1 .. array_length(v_old, 1) loop
      continue when procedure_names[i] <> v_cur;
      if (length(v_def) - length(replace(v_def, v_old[i], ''))) <> length(v_old[i]) then
        raise exception 'm11 m3 % #%: not exactly once', v_cur, i; end if;
      v_def := replace(v_def, v_old[i], v_new[i]);
    end loop;
    execute v_def;
  end loop;

  -- ③
  for i in 1 .. 2 loop
    select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = v_win_fn[i];
    v_def := pg_get_functiondef(v_oid);
    if (length(v_def) - length(replace(v_def, v_win_old, ''))) <> length(v_win_old) * v_win_n[i] then
      raise exception 'm11 m3 %: window text count changed', v_win_fn[i]; end if;
    v_def := replace(v_def, v_win_old, v_win_new);
    execute v_def;
  end loop;
end $m11$;
