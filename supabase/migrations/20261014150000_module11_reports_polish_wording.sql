-- why: ליטוש-ניסוח לדוחות לפני הכנס (15/10/2026). אושר ע"י ישי 14/10 ~14:0X ("אני מאשר הכל"), דרך הסגן.
--      "מה משמח / מה מכעיס" הוא ניסוח לא-מקצועי (ישי 14/10: *"כתוב מה משמח זה מינוח לא מקצועי"*), ו"הכנסות
--      מתחילת השנה" שקרי על כל תקופה שאינה "השנה" (החודש · 3 חודשים · 12 חודשים · ובחירת-שנה).
-- what: שלוש מחרוזות-טקסט בלבד, בשלוש פונקציות-דוח:
--       ① report_m20_satisfaction — כותרת-הגרף 'מה משמח · N משובים סימנו סיבה חיובית' ⇒ 'מה הלקוחות משבחים · N משובים'
--       ② report_m19_customers_overview — ענף שורת-ההחלטה 'ולראות מה מכעיס' ⇒ 'ולראות על מה הלקוחות מתלוננים'
--       ③ report_m02_exec_overview — תווית-האריח 'הכנסות מתחילת השנה' ⇒ 'הכנסות' (שורת-החלון שמתחת מציינת את הטווח)
-- how: אותה טכניקה כמו L1 (20260923180000): pg_get_functiondef החי + replace מדויק, **כל מחרוזת נבדקת שהיא מופיעה
--      בדיוק פעם אחת** (אחרת raise), ואז execute. אותה חתימה ⇒ CREATE OR REPLACE שומר הרשאות. אין drop, אין overload,
--      אין שינוי-סכמה, אין שינוי בנתונים. בסוף: assert ש-proacl זהה למה שנמדד.
-- measured before writing (14/10/2026, SELECT בלבד): proacl של שלוש הפונקציות =
--      {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
--      md5(pg_get_functiondef): m02 634c7ef11e52a1a5da583cfdbf828064 · m19 3b7a6b0b1c7eea771026e8056ed99793 · m20 dfff04ed4e49a4565c5aa2f8fefc0eb8
-- reversible: כן — אותה מיגרציה עם old/new מוחלפים מחזירה את הטקסט.

create or replace function pg_temp.m11_replace_once(p_def text, p_old text, p_new text, p_tag text)
returns text language plpgsql as $f$
begin
  if (length(p_def) - length(replace(p_def, p_old, ''))) <> length(p_old) then
    raise exception 'm11 polish %: expected exactly one occurrence', p_tag;
  end if;
  return replace(p_def, p_old, p_new);
end
$f$;

do $m11$
declare
  v_def text;
  v_acl constant text := '{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}';
begin
  -- ① m20
  v_def := pg_get_functiondef('public.report_m20_satisfaction(date,date,integer,jsonb)'::regprocedure);
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'title', 'מה משמח · ' || v_lri || to_char(v_with_pos, 'FM999,999,999') || v_pdi || ' משובים סימנו סיבה חיובית',$o$,
    $n$'title', 'מה הלקוחות משבחים · ' || v_lri || to_char(v_with_pos, 'FM999,999,999') || v_pdi || ' משובים',$n$,
    'm20 title');
  execute v_def;

  -- ② m19
  v_def := pg_get_functiondef('public.report_m19_customers_overview(date,date,integer,jsonb,integer,integer)'::regprocedure);
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'לפתוח את "שביעות רצון" ולראות מה מכעיס — אין כרגע לקוח שממוצעו מתחת ל-3.5.'$o$,
    $n$'לפתוח את "שביעות רצון" ולראות על מה הלקוחות מתלוננים — אין כרגע לקוח שממוצעו מתחת ל-3.5.'$n$,
    'm19 so_what');
  execute v_def;

  -- ③ m02
  v_def := pg_get_functiondef('public.report_m02_exec_overview(date,date,integer,jsonb,integer,integer)'::regprocedure);
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'key', 'revenue', 'label', 'הכנסות מתחילת השנה',$o$,
    $n$'key', 'revenue', 'label', 'הכנסות',$n$,
    'm02 revenue tile');
  execute v_def;

  -- check ①, inside the migration: the grants did not move
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public'
                and p.proname in ('report_m02_exec_overview', 'report_m19_customers_overview', 'report_m20_satisfaction')
                and p.proacl::text <> v_acl) then
    raise exception 'm11 polish: proacl changed';
  end if;
end
$m11$;
