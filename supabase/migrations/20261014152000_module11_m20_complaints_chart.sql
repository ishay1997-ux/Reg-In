-- why: "שביעות רצון" (מ20) לא עונה על "במה צריך להשתפר" במבט — ישי 14/10: *"חסר למנהלת להבין במה הם צריכים
--      להשתפר על מה התלונות"*. הסיבות השליליות חיו רק בטבלה (גרף "מה מכעיס" נמחק 23/09, כשהטבלה החזיקה 19 שורות
--      ו"אחר" היה 10 מתוך 19). נמדד 14/10: הטבלה מחזיקה 41 שורות, ו"אחר" הוא 10 מתוך 41 — שתי ההנחות של המחיקה
--      כבר לא מתקיימות. ישי אישר להחזיר (14/10 ~14:0X, *"אם יש זמן אולי תכניס את מה שדחית"*), דרך הסגן.
-- what: report_m20_satisfaction בלבד, שדות חדשים בלבד:
--       ① משתנה חדש v_neg_chart — אותה רשימה סגורה של חמש הסיבות השליליות (כמו v_neg, שלא נוגעים בו), ולכל סיבה:
--          n בתקופה · n_prev באותם ימים שנה אחורה · bar_label "17 משובים · אשתקד 11".
--       ② גרף חדש **לפני** גרף-החיוביים: 'על מה הלקוחות מתלוננים · N משובים' — אופקי, ממוין (השכיח ראשון, "אחר"
--          אחרון, כמו v_neg ושורת-ההחלטה), `labelKey:'bar_label'`, ו-`filter_key:'negative_reason'` — לחיצה על סיבה
--          מסננת את הטבלה (השדה הנסתר שכבר קיים בכל שורה מאז G3).
--       🔑 המגמה בתווית ולא כסדרה שנייה: סדרת-אשתקד הייתה הופכת סיבה עם 0 השנה (ו-1 אשתקד) לעמודה לחיצה
--          שמסננת לטבלה ריקה — בדיוק מה שכרטיס ⑦ אוסר.
-- how: הטכניקה של L1: pg_get_functiondef החי + replace מדויק, כל עוגן נבדק שהוא מופיע **בדיוק פעם אחת**, ואז execute.
--      העוגנים אינם תלויים במיגרציית-הניסוח 20261014150000 — אפשר להחיל לפניה או אחריה.
--      אותה חתימה ⇒ CREATE OR REPLACE ⇒ ההרשאות נשמרות; assert בסוף.
-- measured before writing (14/10/2026, SELECT בלבד): שלושת העוגנים מופיעים פעם אחת כל אחד ·
--      proacl = {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
--      2026 עד 14/10 מול 2025 באותם ימים: תפקוד דיילות 17/11 · ניהול לקוי 11/5 · אחר 10/15 · איכות תגים 3/5 · איחור דיילות 0/1.
-- reversible: כן — החלפה הפוכה מחזירה את הגוף הקודם.

create or replace function pg_temp.m11_replace_once(p_def text, p_old text, p_new text, p_tag text)
returns text language plpgsql as $f$
begin
  if (length(p_def) - length(replace(p_def, p_old, ''))) <> length(p_old) then
    raise exception 'm11 m20 complaints %: expected exactly one occurrence', p_tag;
  end if;
  return replace(p_def, p_old, p_new);
end
$f$;

do $m11$
declare
  v_def text;
  v_acl constant text := '{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}';
begin
  v_def := pg_get_functiondef('public.report_m20_satisfaction(date,date,integer,jsonb)'::regprocedure);

  -- ① המשתנה
  v_def := pg_temp.m11_replace_once(v_def,
    E'  v_neg       jsonb;\n',
    E'  v_neg       jsonb;\n  v_neg_chart jsonb;\n',
    'declare');

  -- ① השאילתה — ממש לפני ה-return
  v_def := pg_temp.m11_replace_once(v_def,
    E'  return jsonb_build_object(\n',
    $n$  -- ✏️ 14/10/2026 — גרף "על מה הלקוחות מתלוננים": אותה רשימה סגורה של v_neg, ולצד כל סיבה — אשתקד.
  select coalesce(jsonb_agg(jsonb_build_object(
           'reason', t.reason, 'n', t.n, 'n_prev', t.n_prev,
           'bar_label', v_lri || t.n || v_pdi || case when t.n = 1 then ' משוב' else ' משובים' end
                        || ' · אשתקד ' || v_lri || t.n_prev || v_pdi)
           order by (t.reason = 'אחר'), t.n desc, t.reason), '[]'::jsonb)
    into v_neg_chart
    from (select r.reason,
                 (count(p.project_id) filter (where p.final_event_date between v_from and v_to))::integer as n,
                 (count(p.project_id) filter (where p.final_event_date between v_p_from and v_p_to))::integer as n_prev
            from unnest(array['איחור דיילות', 'תפקוד דיילות', 'איכות תגים',
                              'ניהול לקוי', 'אחר']) as r(reason)
            left join public.projects p
              on p.feedback_status = 'completed'
             and r.reason = any (p.negative_feedback_reasons)
             and (p.final_event_date between v_from and v_to
                  or p.final_event_date between v_p_from and v_p_to)
             and (p_customer_id is null or p.customer_id = p_customer_id)
           group by r.reason) t;

  return jsonb_build_object(
$n$,
    'query');

  -- ② הגרף — אחרי גרף-הציונים, לפני גרף-החיוביים
  v_def := pg_temp.m11_replace_once(v_def,
    E'שינוי-אוכלוסייה, לא הצהרת-מפתח. הכרעת-ישי.\n        ''filter_key'', false),',
    $n$שינוי-אוכלוסייה, לא הצהרת-מפתח. הכרעת-ישי.
        'filter_key', false),
      -- ✏️ 14/10/2026 — "על מה הלקוחות מתלוננים" חוזר, לפני החיוביים (ר' כותרת המיגרציה 20261014152000).
      jsonb_build_object(
        'type', 'bar',
        'title', 'על מה הלקוחות מתלוננים · ' || v_lri || to_char(v_with_neg, 'FM999,999,999') || v_pdi || ' משובים',
        'series', jsonb_build_array(jsonb_build_object('key', 'n', 'label', 'משובים', 'format', 'int')),
        'data', v_neg_chart, 'xKey', 'reason', 'domain', null, 'refLines', '[]'::jsonb,
        'unit', 'int', 'unit_label', 'משובים',
        'layout', 'horizontal',
        'labelKey', 'bar_label',
        'filter_key', 'negative_reason'),$n$,
    'chart');

  execute v_def;

  if (select p.proacl::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = 'report_m20_satisfaction') <> v_acl then
    raise exception 'm11 m20 complaints: proacl changed';
  end if;
end
$m11$;
