-- מ11 · K1 — הוספת p_page/p_page_size + row_total אמיתי בחמישה מתוך שש-עשרה
-- דוחות-הדוח, שבהם השרת חותך שורות (§7 שלב 0.5, snug-mapping-dragon.md).
--
-- 🔴 למה חמישה ולא שש-עשרה: 11 הפונקציות האחרות אינן מגבילות שורות כלל —
-- החזרתן כבר שלמה, ופרמטר-דפדוף עליהן היה תוספת בלי תוכן. הצומצם מתוך
-- הכרעת-ישי (§7ב פריט 3): "המסך חייב להציג בדיוק מה שהוא מציג היום".
--
-- 🔴 ✏️ תוקן 17/09/2026, בעקבות ביקורת של סשן-ייעוץ מקביל, ואומת עצמאית
-- (שחזור מבודד ב-pg_temp, שגיאה 42725 שוחזרה בדיוק): `CREATE OR REPLACE FUNCTION`
-- עם רשימת-ארגומנטים שונה **אינו מחליף** פונקציה — הוא יוצר עומס-יתר (overload)
-- לצידה. קריאת `callReport` עם ארבעת הפרמטרים בשם הייתה נופלת על
-- "function ... is not unique" (42725) על **כל חמש** הפונקציות, בייצור.
-- ⇒ כל בלוק מבצע `drop function if exists` על **החתימה הישנה המדויקת** לפני
-- ה-`execute new_def`. מ07 היא היחידה **מבין החמש** עם `p_asof`
-- (גם `report_m09_aging` נושאת אותו, אך אינה חלק מהמיגרציה הזו).
--
-- 🔴 ✏️ ומוקש שני שנמצא באותו סבב-תיקון: `drop`+`create` מאפס גם הרשאות (ACL)
-- ותיעוד (`comment on function`). נמדד: ברירת-המחדל של הסכימה הזו מעניקה
-- `anon=EXECUTE` לכל פונקציה חדשה (`pg_default_acl`), בעוד חמש הפונקציות האלה
-- חוסמות `anon` במפורש היום. בלי שחזור-מפורש, ה-drop+create היה **פותח** את
-- חמשת הדוחות לגישה לא-מזוהה. ⇒ כל בלוק משחזר, מיד אחרי ה-create, בדיוק את
-- ה-ACL הקיים (`revoke ... from public, anon, authenticated` + `grant ... to
-- authenticated`) ואת התיעוד (נשלף בזמן-ריצה מ-`obj_description`, לא מוקלד).
--
-- ✅ Expand-only מבחינת ההתנהגות (לא מבחינת מנגנון ה-DDL): שני פרמטרים חדשים
-- עם ברירת-מחדל, ומפתח-מטא חדש. שום קריאה קיימת אינה נשברת — `callReport`
-- הלקוחי אינו שולח את שני הפרמטרים החדשים, ולכן כל 16 המשטחים ממשיכים
-- להתנהג בדיוק כמו לפני המיגרציה הזו.
--
-- ברירות-המחדל שומרות על מה שהמסך מציג היום, בייט-בבייט (§7ב פריט 3 · 9):
--   report_m02_exec_overview        p_page_size default 8   (רשימת-שיא)
--   report_m19_customers_overview   p_page_size default 8   (רשימת-שיא)
--   report_m07_finance_overview     p_page_size default 4   (רשימת-שיא)
--   report_m04_discounts            p_page_size default 50  (תקרה אמיתית)
--   report_m06_staffing             p_page_size default 50  (תקרה אמיתית)
--
-- 🔑 שיטת-הביצוע: כל בלוק שולף את הגוף החי מ-`pg_get_functiondef` ואת התיעוד
-- מ-`obj_description`, מוודא שהעוגן שהוא מתכוון להחליף קיים **בדיוק פעם אחת**
-- (RAISE EXCEPTION אם לא), ורק אז מבצע drop → create → revoke/grant → comment.
-- מיגרציה שאינה יכולה לדרוס בשקט גרסה שכבר השתנתה — התנגשות עם שינוי מקביל
-- תיכשל בקול, לא תשתתק. כל הבלוקים באותה טרנזקציה מרומזת של ה-`do` — כשל
-- באמצע מגלגל הכל לאחור, ואף קורא חיצוני לא רואה מצב-ביניים.
--
-- מ19 בלבד מקבל גם חישוב חדש: `v_rank_total` — ספירת הלקוחות עם הכנסה
-- ב-12 החודשים (52 בעת הכתיבה, לא 61 שהוא כלל הלקוחות במערכת — §6ד2, §7ב
-- פריט 9). מ02/מ04/מ06/מ07 כבר מצהירים `row_total`/`open_invoice_count`
-- נכון ובלתי-תלוי בחיתוך; רק מ19 היה חסר.
--
-- ⚠️ מבחני-הקבלה שדרש סשן-הייעוץ (ספירת שורות 8/8/4/50/50 בלי פרמטרים) אינם
-- ניתנים להרצה כאן ב-SQL גולמי: `assert_module_permission` נשען על
-- `auth.email()`, שקיים רק בבקשה שעברה אימות אמיתי (JWT). ⇒ נבדק אחרי ההחלה
-- דרך התחברות-דפדפן אמיתית (כמנכ"ל), לא בתוך המיגרציה עצמה.

do $mig$
declare
  old_def text;
  new_def text;
  old_comment text;
  hits int;
begin
  -- ═══════════ report_m02_exec_overview — רשימת-שיא, 8 מתוך n ═══════════
  select pg_get_functiondef(p.oid), obj_description(p.oid, 'pg_proc')
    into old_def, old_comment
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m02_exec_overview';

  select count(*) into hits from regexp_matches(old_def, 'p_drill jsonb DEFAULT NULL::jsonb\)', 'g');
  if hits <> 1 then raise exception 'm02: signature anchor found % times, expected 1', hits; end if;
  select count(*) into hits from regexp_matches(old_def, 'order by revenue desc, project_id limit 8\) t', 'g');
  if hits <> 1 then raise exception 'm02: limit anchor found % times, expected 1', hits; end if;

  new_def := replace(old_def,
    'p_drill jsonb DEFAULT NULL::jsonb)',
    'p_drill jsonb DEFAULT NULL::jsonb, p_page integer DEFAULT 1, p_page_size integer DEFAULT 8)');
  new_def := replace(new_def,
    'order by revenue desc, project_id limit 8) t',
    'order by revenue desc, project_id limit p_page_size offset (p_page - 1) * p_page_size) t');

  execute 'drop function if exists public.report_m02_exec_overview(date, date, integer, jsonb)';
  execute new_def;
  execute 'revoke all on function public.report_m02_exec_overview(date, date, integer, jsonb, integer, integer) from public, anon, authenticated';
  execute 'grant execute on function public.report_m02_exec_overview(date, date, integer, jsonb, integer, integer) to authenticated';
  if old_comment is not null then
    execute format('comment on function public.report_m02_exec_overview(date, date, integer, jsonb, integer, integer) is %L', old_comment);
  end if;

  -- ═══════════ report_m19_customers_overview — רשימת-שיא, 8 מתוך 52 ═══════════
  select pg_get_functiondef(p.oid), obj_description(p.oid, 'pg_proc')
    into old_def, old_comment
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m19_customers_overview';

  select count(*) into hits from regexp_matches(old_def, 'p_drill jsonb DEFAULT NULL::jsonb\)', 'g');
  if hits <> 1 then raise exception 'm19: signature anchor found % times, expected 1', hits; end if;
  select count(*) into hits from regexp_matches(old_def, E'v_out\\s+jsonb;\\nbegin', 'g');
  if hits <> 1 then raise exception 'm19: declare anchor found % times, expected 1', hits; end if;
  select count(*) into hits from regexp_matches(old_def, 'limit 8\) t;', 'g');
  if hits <> 1 then raise exception 'm19: limit anchor found % times, expected 1', hits; end if;
  select count(*) into hits from regexp_matches(old_def, E'''frozen_count'', null,\\n      ''notes'', v_notes,', 'g');
  if hits <> 1 then raise exception 'm19: meta anchor found % times, expected 1', hits; end if;

  new_def := replace(old_def,
    'p_drill jsonb DEFAULT NULL::jsonb)',
    'p_drill jsonb DEFAULT NULL::jsonb, p_page integer DEFAULT 1, p_page_size integer DEFAULT 8)');
  new_def := replace(new_def,
    E'v_out        jsonb;\nbegin',
    E'v_out        jsonb;\n  v_rank_total integer;\nbegin');
  new_def := replace(new_def,
    'limit 8) t;',
    E'limit p_page_size offset (p_page - 1) * p_page_size) t;\n\n  select count(distinct p.customer_id)::integer into v_rank_total\n    from public.projects p\n   where p.project_status in (\'finished\', \'awaiting_payment\', \'awaiting_invoice\', \'event_finished\')\n     and p.customer_id is not null\n     and p.final_event_date >= v_y_from\n     and p.final_event_date <= v_today\n     and (p_customer_id is null or p.customer_id = p_customer_id);');
  new_def := replace(new_def,
    E'''frozen_count'', null,\n      ''notes'', v_notes,',
    E'''frozen_count'', null,\n      ''row_total'', v_rank_total,\n      ''notes'', v_notes,');

  execute 'drop function if exists public.report_m19_customers_overview(date, date, integer, jsonb)';
  execute new_def;
  execute 'revoke all on function public.report_m19_customers_overview(date, date, integer, jsonb, integer, integer) from public, anon, authenticated';
  execute 'grant execute on function public.report_m19_customers_overview(date, date, integer, jsonb, integer, integer) to authenticated';
  if old_comment is not null then
    execute format('comment on function public.report_m19_customers_overview(date, date, integer, jsonb, integer, integer) is %L', old_comment);
  end if;

  -- ═══════════ report_m07_finance_overview — רשימת-שיא, 4 מתוך 35 (5 פרמטרים: יש p_asof) ═══════════
  select pg_get_functiondef(p.oid), obj_description(p.oid, 'pg_proc')
    into old_def, old_comment
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m07_finance_overview';

  select count(*) into hits from regexp_matches(old_def, 'p_drill jsonb DEFAULT NULL::jsonb, p_asof date DEFAULT NULL::date\)', 'g');
  if hits <> 1 then raise exception 'm07: signature anchor found % times, expected 1', hits; end if;
  select count(*) into hits from regexp_matches(old_def, 'jsonb_array_elements\(v_rows\) e limit 4\) s\);', 'g');
  if hits <> 1 then raise exception 'm07: limit anchor found % times, expected 1', hits; end if;
  select count(*) into hits from regexp_matches(old_def, E'''open_invoice_count'', v_open_n,\\n      ''asof'', v_asof,', 'g');
  if hits <> 1 then raise exception 'm07: meta anchor found % times, expected 1', hits; end if;

  new_def := replace(old_def,
    'p_drill jsonb DEFAULT NULL::jsonb, p_asof date DEFAULT NULL::date)',
    'p_drill jsonb DEFAULT NULL::jsonb, p_asof date DEFAULT NULL::date, p_page integer DEFAULT 1, p_page_size integer DEFAULT 4)');
  new_def := replace(new_def,
    'jsonb_array_elements(v_rows) e limit 4) s);',
    'jsonb_array_elements(v_rows) e limit p_page_size offset (p_page - 1) * p_page_size) s);');
  new_def := replace(new_def,
    E'''open_invoice_count'', v_open_n,\n      ''asof'', v_asof,',
    E'''open_invoice_count'', v_open_n,\n      ''row_total'', v_open_n,\n      ''asof'', v_asof,');

  execute 'drop function if exists public.report_m07_finance_overview(date, date, integer, jsonb, date)';
  execute new_def;
  execute 'revoke all on function public.report_m07_finance_overview(date, date, integer, jsonb, date, integer, integer) from public, anon, authenticated';
  execute 'grant execute on function public.report_m07_finance_overview(date, date, integer, jsonb, date, integer, integer) to authenticated';
  if old_comment is not null then
    execute format('comment on function public.report_m07_finance_overview(date, date, integer, jsonb, date, integer, integer) is %L', old_comment);
  end if;

  -- ═══════════ report_m04_discounts — תקרה אמיתית, 50 מתוך n (row_total כבר תקין) ═══════════
  select pg_get_functiondef(p.oid), obj_description(p.oid, 'pg_proc')
    into old_def, old_comment
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m04_discounts';

  select count(*) into hits from regexp_matches(old_def, 'p_drill jsonb DEFAULT NULL::jsonb\)', 'g');
  if hits <> 1 then raise exception 'm04: signature anchor found % times, expected 1', hits; end if;
  select count(*) into hits from regexp_matches(old_def, 'order by d desc, quote_id limit 50\) t', 'g');
  if hits <> 1 then raise exception 'm04: limit anchor found % times, expected 1', hits; end if;

  new_def := replace(old_def,
    'p_drill jsonb DEFAULT NULL::jsonb)',
    'p_drill jsonb DEFAULT NULL::jsonb, p_page integer DEFAULT 1, p_page_size integer DEFAULT 50)');
  new_def := replace(new_def,
    'order by d desc, quote_id limit 50) t',
    'order by d desc, quote_id limit p_page_size offset (p_page - 1) * p_page_size) t');

  execute 'drop function if exists public.report_m04_discounts(date, date, integer, jsonb)';
  execute new_def;
  execute 'revoke all on function public.report_m04_discounts(date, date, integer, jsonb, integer, integer) from public, anon, authenticated';
  execute 'grant execute on function public.report_m04_discounts(date, date, integer, jsonb, integer, integer) to authenticated';
  if old_comment is not null then
    execute format('comment on function public.report_m04_discounts(date, date, integer, jsonb, integer, integer) is %L', old_comment);
  end if;

  -- ═══════════ report_m06_staffing — תקרה אמיתית, 50 מתוך n (row_total כבר תקין) ═══════════
  select pg_get_functiondef(p.oid), obj_description(p.oid, 'pg_proc')
    into old_def, old_comment
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m06_staffing';

  select count(*) into hits from regexp_matches(old_def, 'p_drill jsonb DEFAULT NULL::jsonb\)', 'g');
  if hits <> 1 then raise exception 'm06: signature anchor found % times, expected 1', hits; end if;
  select count(*) into hits from regexp_matches(old_def, 'from \(select \* from paired where ag > eg order by gap desc, project_id limit 50\) t', 'g');
  if hits <> 1 then raise exception 'm06: limit anchor found % times, expected 1', hits; end if;

  new_def := replace(old_def,
    'p_drill jsonb DEFAULT NULL::jsonb)',
    'p_drill jsonb DEFAULT NULL::jsonb, p_page integer DEFAULT 1, p_page_size integer DEFAULT 50)');
  new_def := replace(new_def,
    'from (select * from paired where ag > eg order by gap desc, project_id limit 50) t',
    'from (select * from paired where ag > eg order by gap desc, project_id limit p_page_size offset (p_page - 1) * p_page_size) t');

  execute 'drop function if exists public.report_m06_staffing(date, date, integer, jsonb)';
  execute new_def;
  execute 'revoke all on function public.report_m06_staffing(date, date, integer, jsonb, integer, integer) from public, anon, authenticated';
  execute 'grant execute on function public.report_m06_staffing(date, date, integer, jsonb, integer, integer) to authenticated';
  if old_comment is not null then
    execute format('comment on function public.report_m06_staffing(date, date, integer, jsonb, integer, integer) is %L', old_comment);
  end if;
end;
$mig$;
