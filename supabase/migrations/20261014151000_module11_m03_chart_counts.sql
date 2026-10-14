-- why: "סגירת הצעות" (מ3) מציג על הבמה ב-15/10. שני הגרפים הראו סכום/אחוז בלבד, בלי כמה הצעות עומדות מאחוריהם
--      (ישי 14/10: *"ב 2 הגרפים בסגירת הצעות בדרך כלל כותבים כמות גם?"*), והגרף הראשון — סיבות-הדחייה — נקרא
--      כ"רק מלא שורות" (*"חסר תרשים מתאים… יש שם רק מלא שורות"*). אושר ע"י ישי 14/10 ~14:0X ("אני מאשר הכל"), דרך הסגן.
-- what: report_m03_trends בלבד, שדות חדשים בלבד — אף שדה קיים אינו משתנה ואינו נמחק:
--       ① גרף 1 · כל דאטום מקבל `bar_label` — "N הצעות · P% מהסכום" (P = נתח מסך ההצעות שנדחו, אותו v_lost_sum של האריח).
--       ② גרף 1 · `layout:'horizontal'` (עמודות אופקיות, ממוינות לפי ₪ כמו קודם) + `labelKey:'bar_label'` +
--          כותרת: 'הצעות מחיר שנדחו לפי סיבה' ⇒ 'על מה מפסידים הצעות · N הצעות שנדחו' (N מחושב = v_lost_n).
--       ③ גרף 2 · כל דאטום מקבל `bar_label` — "72.3% · 347 הצעות", ומתחת לסף-20: "אין מספיק נתונים · 12 הצעות".
--       ④ גרף 2 · `labelKey:'bar_label'`.
--       הצרכן: ChartCard (`labelKey` ⇒ תווית בקצה העמודה + שורה בטולטיפ + עמודה בטבלת-קורא-המסך).
--       לקוח ישן שאינו מכיר `labelKey`/`bar_label` פשוט מתעלם מהם; `layout` כבר נתמך מ-16/09 ⇒ בטוח לפריסה מדורגת.
-- how: הטכניקה של L1 (20260923180000): pg_get_functiondef החי + replace מדויק, כל מחרוזת-מקור נבדקת שהיא מופיעה
--      **בדיוק פעם אחת** (אחרת raise), ואז execute. אותה חתימה ⇒ CREATE OR REPLACE ⇒ ההרשאות נשמרות; assert בסוף.
--      הסינון-הצולב (לחיצה על סיבה ⇒ הטבלה) אינו נוגע: `xKey` נשאר 'reason'.
-- measured before writing (14/10/2026, SELECT בלבד): 4 מחרוזות-המקור מופיעות פעם אחת כל אחת ·
--      md5(pg_get_functiondef) = eb69dea3e2b14ffe1af29dbce960a9cc · proacl = {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
-- reversible: כן — החלפה הפוכה (new ⇒ old) מחזירה את הגוף הקודם.

create or replace function pg_temp.m11_replace_once(p_def text, p_old text, p_new text, p_tag text)
returns text language plpgsql as $f$
begin
  if (length(p_def) - length(replace(p_def, p_old, ''))) <> length(p_old) then
    raise exception 'm11 m03 counts %: expected exactly one occurrence', p_tag;
  end if;
  return replace(p_def, p_old, p_new);
end
$f$;

do $m11$
declare
  v_def text;
  v_acl constant text := '{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}';
begin
  v_def := pg_get_functiondef('public.report_m03_trends(date,date,integer,jsonb)'::regprocedure);

  -- ① גרף 1 · תווית לכל סיבה
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'reason', reason, 'lost_sum', lost_sum, 'lost_n', lost_n)$o$,
    $n$'reason', reason, 'lost_sum', lost_sum, 'lost_n', lost_n,
           'bar_label', v_lri || lost_n || v_pdi || case when lost_n = 1 then ' הצעה' else ' הצעות' end
             || case when v_lost_sum > 0
                     then ' · ' || v_lri || round(100.0 * lost_sum / v_lost_sum)::integer || '%' || v_pdi || ' מהסכום'
                     else '' end)$n$,
    'reasons bar_label');

  -- ③ גרף 2 · תווית לכל מאפיין
  v_def := pg_temp.m11_replace_once(v_def,
    $o$jsonb_agg((e - 'won') || jsonb_build_object('rate',$o$,
    $n$jsonb_agg((e - 'won') || jsonb_build_object('bar_label',
           case when (e ->> 'n')::integer >= v_min_n
                then v_lri || to_char(round(100.0 * (e ->> 'won')::integer / (e ->> 'n')::integer, 1), 'FM990.0') || '%' || v_pdi
                     || ' · ' || v_lri || to_char((e ->> 'n')::integer, 'FM999,999') || v_pdi || ' הצעות'
                when (e ->> 'n')::integer = 0 then 'אין הצעות'
                else 'אין מספיק נתונים · ' || v_lri || (e ->> 'n') || v_pdi
                     || case when (e ->> 'n')::integer = 1 then ' הצעה' else ' הצעות' end end,
         'rate',$n$,
    'segments bar_label');

  -- ② גרף 1 · אופקי + labelKey + כותרת
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'type', 'bar', 'title', 'הצעות מחיר שנדחו לפי סיבה',$o$,
    $n$'type', 'bar', 'layout', 'horizontal', 'labelKey', 'bar_label',
        'title', 'על מה מפסידים הצעות · '
                 || case when coalesce(v_lost_n, 0) = 1 then 'הצעה אחת שנדחתה'
                         else v_lri || to_char(coalesce(v_lost_n, 0), 'FM999,999') || v_pdi || ' הצעות שנדחו' end,$n$,
    'chart 1 title');

  -- ④ גרף 2 · labelKey
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'type', 'bar', 'title', 'שיעור סגירה לפי מאפיין',$o$,
    $n$'type', 'bar', 'labelKey', 'bar_label', 'title', 'שיעור סגירה לפי מאפיין',$n$,
    'chart 2 labelKey');

  execute v_def;

  if (select p.proacl::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = 'report_m03_trends') <> v_acl then
    raise exception 'm11 m03 counts: proacl changed';
  end if;
end
$m11$;
