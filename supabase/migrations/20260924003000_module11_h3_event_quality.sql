-- why: מ11 · דוח-החלטה ה3 — "איכות אירועים" (שדרוג-במקום של report_m06_staffing, 24/09/2026).
--      ישי 23/09: "האם יש קשר בין יחס אורחים לדיילת לבין שביעות רצון?" · "שגורם למנהלת באמת לעשות משו".
--      "קהל מול צוות" הראה שיחס האורחים-לדיילת בפועל קרוב לתכנון — עובדה שמהנהנים מולה. הדוח החדש
--      שואל מה מוריד את ציון-המשוב של אירוע, ומראה את האירועים הקרובים שבהם הגורם הזה כבר קיים ⇒
--      המנהלת מתקנת שיבוץ לפני האירוע, לא אחריו.
-- what: אותה פונקציה, אותה חתימה (6 פרמטרים; p_page/p_page_size אינם בשימוש), אותו שער (`כספים`).
--       אוכלוסייה: אירועים בארבעת סטטוסי הכרעה 36 עם משוב שהושלם (feedback_status = 'completed') עד p_to.
--       ארבעה גורמים, כל אחד כן/לא לאירוע: אין ראש-משמרת בין הדיילות שהגיעו · 2+ דיילות לא הגיעו ·
--       50+ אורחים (actual_guests) לכל דיילת שהגיעה · איחור בינוני או כבד. אירוע בלי actual_guests או בלי
--       דיילת שהגיעה אינו נכנס לגורם היחס (ולא נופל בשקט ל-estimated). אגרגטים בלבד — אף דיילת בשמה,
--       ואפס hourly_rate. שאלת החזרה של לקוח אחרי אירוע רע נשארת במ19 (כלל-ברזל 14) — כאן רק מפנים.
--       הטבלה: אירועים ב-14 הימים הקרובים שכבר עכשיו יש בהם גורם-סיכון, עם דלת לכרטיס-הפרויקט.
--       + תיקון בשורת-ההחלטה של ה2 (report_m04_discounts): משפט-הרווח נאמר רק כשלשני הקצוות יש 20
--       אירועים — אחרת האריח אומר "אין מספיק נתונים" והשורה שמעליו מצטטת את אותו מספר.
-- how: create or replace עם החתימה הזהה ⇒ ACL והערה נשמרים. הדף מתעלם ממסנן-התקופה (⑧ G5, כמו קודם).
-- verified before apply: md5(prosrc) החי של report_m06_staffing היה 7e3b03f838347a8d2a86d6d02f82a3e7.
-- reversible: כן — הגוף הקודם בקובצי J2 + K1.
-- ישי 23/09 לילה: "לא לבקש אישור להכיל מיגרציות בסשן הזה. תכיל בעצמך ותאמת לבד".
create or replace function public.report_m06_staffing(
  p_from date default null,
  p_to date default null,
  p_customer_id integer default null,
  p_drill jsonb default null,
  p_page integer default 1,
  p_page_size integer default 50
)
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
declare
  v_lri constant text := chr(8294);
  v_pdi constant text := chr(8297);
  v_min_n constant integer := 20;
  v_ratio_cap constant integer := 50;
  v_horizon constant integer := 14;
  v_statuses constant text[] := array['finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished'];
  v_today date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to date;
  v_customer_name text;
  v_held_n integer;
  v_fb_n integer;
  v_factors jsonb;
  v_rows jsonb;
  v_best jsonb;
  v_so_what text;
  v_risk_lead integer;
  v_notes jsonb := '[]'::jsonb;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  v_to := coalesce(p_to, v_today);
  select c.company_name into v_customer_name
    from public.customers c where c.customer_id = p_customer_id;

  with ev as (
    select p.project_id, p.feedback_status, p.feedback_score, p.actual_guests,
           count(a.*) filter (where a.attendance_status in ('arrived', 'late')) present,
           count(a.*) filter (where a.attendance_status = 'no_show') noshow,
           count(a.*) filter (where a.lateness_level in ('medium', 'heavy')) late_mh,
           coalesce(bool_or(a.is_shift_lead) filter (where a.attendance_status in ('arrived', 'late')), false) has_lead
      from public.projects p
      left join public.assignments a on a.project_id = p.project_id
     where p.project_status = any (v_statuses)
       and p.final_event_date is not null and p.final_event_date <= v_to
       and (p_customer_id is null or p.customer_id = p_customer_id)
     group by p.project_id
  ),
  fb as (
    select *, case when actual_guests is not null and present > 0
                   then actual_guests::numeric / present end ratio
      from ev where feedback_status = 'completed' and feedback_score is not null
  ),
  f as (
    select 1 ord, 'no_lead' key, 'בלי ראש-משמרת' label, 'עם ראש-משמרת' other,
           count(*) filter (where not has_lead) with_n, avg(feedback_score) filter (where not has_lead) with_avg,
           count(*) filter (where has_lead) without_n, avg(feedback_score) filter (where has_lead) without_avg
      from fb
    union all
    select 2, 'ratio', 'ב-50+ אורחים לדיילת', 'בשאר האירועים',
           count(*) filter (where ratio >= v_ratio_cap), avg(feedback_score) filter (where ratio >= v_ratio_cap),
           count(*) filter (where ratio < v_ratio_cap), avg(feedback_score) filter (where ratio < v_ratio_cap)
      from fb
    union all
    select 3, 'noshow', 'כש-2+ לא הגיעו', 'בשאר האירועים',
           count(*) filter (where noshow >= 2), avg(feedback_score) filter (where noshow >= 2),
           count(*) filter (where noshow < 2), avg(feedback_score) filter (where noshow < 2)
      from fb
    union all
    select 4, 'late', 'באיחור בינוני-כבד', 'בשאר האירועים',
           count(*) filter (where late_mh >= 1), avg(feedback_score) filter (where late_mh >= 1),
           count(*) filter (where late_mh = 0), avg(feedback_score) filter (where late_mh = 0)
      from fb
  )
  select (select count(*) from ev)::integer,
         (select count(*) from fb)::integer,
         (select jsonb_agg(jsonb_build_object(
            'key', key, 'label', label, 'other', other,
            'with_n', with_n, 'with_avg', round(with_avg, 2),
            'without_n', without_n, 'without_avg', round(without_avg, 2),
            'enough', with_n >= v_min_n and without_n >= v_min_n) order by ord) from f)
    into v_held_n, v_fb_n, v_factors;

  -- הגורם שמוריד הכי הרבה — רק על מדגם שעבר את הסף בשני הצדדים, ורק כשהפער ≥ 0.3 נקודה.
  select e into v_best
    from jsonb_array_elements(v_factors) e
   where (e ->> 'enough')::boolean
     and (e ->> 'without_avg')::numeric - (e ->> 'with_avg')::numeric >= 0.3
   order by (e ->> 'without_avg')::numeric - (e ->> 'with_avg')::numeric desc
   limit 1;

  -- ── הטבלה: אירועים ב-14 הימים הקרובים שכבר יש בהם גורם-סיכון ─────────────────────────
  -- השיבוץ עוד לא סגור ⇒ נמדדות הדיילות שאושרו סופית, ומספר האורחים המשוער מההצעה.
  with up as (
    select p.project_id, p.event_name, p.final_event_date, cu.company_name, q.estimated_guests,
           count(a.*) filter (where a.assignment_status = 'finally_approved') staffed,
           coalesce(bool_or(a.is_shift_lead) filter (where a.assignment_status = 'finally_approved'), false) has_lead
      from public.projects p
      join public.quotes q on q.quote_id = p.quote_id
      left join public.customers cu on cu.customer_id = p.customer_id
      left join public.assignments a on a.project_id = p.project_id
     where p.project_status not in ('cancelled', 'finished', 'event_finished', 'awaiting_invoice', 'awaiting_payment')
       and p.final_event_date between v_today and v_today + v_horizon
       and (p_customer_id is null or p.customer_id = p_customer_id)
     group by p.project_id, p.event_name, p.final_event_date, cu.company_name, q.estimated_guests
  ),
  risk as (
    select *, case when staffed > 0 and estimated_guests is not null
                   then round(estimated_guests::numeric / staffed, 1) end per_hostess
      from up
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'event_name', event_name, 'customer_name', company_name, 'event_date', final_event_date,
           'guests', estimated_guests, 'staffed', staffed, 'per_hostess', per_hostess,
           'shift_lead', case when has_lead then 'יש' else 'אין' end,
           'risk', concat_ws(' · ',
                     case when not has_lead then 'בלי ראש-משמרת' end,
                     case when per_hostess >= v_ratio_cap then 'יותר מ-50 אורחים לדיילת' end),
           'drill_key', jsonb_build_object('kind', 'project', 'id', project_id))
           order by final_event_date, project_id), '[]'::jsonb),
         count(*) filter (where not has_lead)::integer
    into v_rows, v_risk_lead
    from risk
   where not has_lead or per_hostess >= v_ratio_cap;

  if p_drill is not null then
    v_notes := v_notes || to_jsonb('הדוח הזה אינו תומך בקידוח.'::text);
  end if;

  v_so_what := case
    when coalesce(v_fb_n, 0) = 0 then 'אין עדיין משובים שהושלמו — לשלוח משוב אחרי כל אירוע.'
    when v_best is null then 'להמשיך לעקוב — אף גורם לא מוריד את ציון המשוב באופן ברור.'
    when v_best ->> 'key' = 'no_lead' then
      'לשבץ ראש-משמרת בכל אירוע — בלעדיה הציון ' || v_lri || to_char((v_best ->> 'with_avg')::numeric, 'FM0.0') || v_pdi
      || ' מול ' || v_lri || to_char((v_best ->> 'without_avg')::numeric, 'FM0.0') || v_pdi
      || case when v_risk_lead > 0 then '; ' || v_lri || v_risk_lead || v_pdi || ' אירועים קרובים עדיין בלי.' else '.' end
    when v_best ->> 'key' = 'ratio' then
      'לשבץ דיילת לכל 50 אורחים לכל היותר — מעבר לזה הציון ' || v_lri || to_char((v_best ->> 'with_avg')::numeric, 'FM0.0') || v_pdi
      || ' מול ' || v_lri || to_char((v_best ->> 'without_avg')::numeric, 'FM0.0') || v_pdi || '.'
    when v_best ->> 'key' = 'noshow' then
      'לשבץ דיילת מחליפה באירועים גדולים — כש-2+ לא מגיעות הציון ' || v_lri || to_char((v_best ->> 'with_avg')::numeric, 'FM0.0') || v_pdi
      || ' מול ' || v_lri || to_char((v_best ->> 'without_avg')::numeric, 'FM0.0') || v_pdi || '.'
    else
      'לטפל באיחורים — באיחור בינוני-כבד הציון ' || v_lri || to_char((v_best ->> 'with_avg')::numeric, 'FM0.0') || v_pdi
      || ' מול ' || v_lri || to_char((v_best ->> 'without_avg')::numeric, 'FM0.0') || v_pdi || '.'
  end;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', coalesce(v_fb_n, 0),
      'summary', v_lri || to_char(coalesce(v_fb_n, 0), 'FM999,999') || v_pdi || ' אירועים עם משוב · מתוך '
                 || v_lri || to_char(coalesce(v_held_n, 0), 'FM999,999') || v_pdi || ' שהתקיימו',
      'label', 'נכללים אירועים שהתקיימו ושהלקוח מילא עליהם משוב. אירוע בלי משוב אינו נכלל — אין לו ציון. '
               || 'גורם היחס נמדד רק כשידוע גם מספר האורחים בפועל וגם מספר הדיילות שהגיעו. '
               || 'ההשוואה מראה קשר, לא סיבה. אם לקוח חוזר אחרי אירוע רע — במבט-על לקוחות.',
      'excluded', jsonb_build_object('אירועים בלי משוב שהושלם', coalesce(v_held_n, 0) - coalesce(v_fb_n, 0))),
    'window', jsonb_build_object('from', null, 'to', v_to,
      'label', 'כל הזמנים · ' || coalesce(v_customer_name, 'כל הלקוחות')),
    'tiles', (
      select jsonb_agg(jsonb_build_object(
               'key', 'score_' || (e ->> 'key'),
               'label', 'ציון ' || (e ->> 'label'),
               'value', case when (e ->> 'with_n')::integer >= v_min_n then (e ->> 'with_avg')::numeric end,
               'format', 'ratio',
               'sub', case when (e ->> 'with_n')::integer >= v_min_n
                           then v_lri || (e ->> 'with_n') || v_pdi || ' אירועים'
                           else 'אין מספיק נתונים (' || v_lri || (e ->> 'with_n') || v_pdi || ')' end,
               'window', 'ממוצע ציון המשוב (1–5) · כל הזמנים',
               'compare', case when (e ->> 'enough')::boolean then jsonb_build_object(
                   'value', (e ->> 'without_avg')::numeric, 'label', e ->> 'other', 'format', 'ratio',
                   'direction', case when (e ->> 'with_avg')::numeric > (e ->> 'without_avg')::numeric then 'up'
                                     when (e ->> 'with_avg')::numeric < (e ->> 'without_avg')::numeric then 'down'
                                     else 'flat' end) end,
               'target', null) order by o)
        from jsonb_array_elements(v_factors) with ordinality x(e, o)),
    'chart', jsonb_build_object(
      'type', 'bar', 'title', 'ציון המשוב לפי גורם',
      'series', jsonb_build_array(
        jsonb_build_object('key', 'with_avg', 'label', 'כשהגורם קיים', 'kind', 'bar', 'axis', 'left', 'format', 'ratio'),
        jsonb_build_object('key', 'without_avg', 'label', 'בלעדיו', 'kind', 'bar', 'axis', 'left', 'format', 'ratio')),
      'data', (select jsonb_agg(jsonb_build_object(
                 'factor', e ->> 'label',
                 'with_avg', case when (e ->> 'enough')::boolean then (e ->> 'with_avg')::numeric end,
                 'without_avg', case when (e ->> 'enough')::boolean then (e ->> 'without_avg')::numeric end,
                 'n', (e ->> 'with_n')::integer) order by o)
                 from jsonb_array_elements(v_factors) with ordinality x(e, o)),
      'xKey', 'factor', 'filter_key', false,
      'note', 'גורם עם פחות מ-20 אירועים — בלי עמודה.',
      'domain', jsonb_build_array(0, 5), 'refLines', '[]'::jsonb, 'unit', 'ratio'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'event_date', 'label', 'תאריך', 'format', 'date', 'align', 'start', 'sorted', 'asc'),
      jsonb_build_object('key', 'event_name', 'label', 'אירוע', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'guests', 'label', 'אורחים (משוער)', 'format', 'int', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'staffed', 'label', 'דיילות משובצות', 'format', 'int', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'per_hostess', 'label', 'אורחים לדיילת', 'format', 'ratio', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'shift_lead', 'label', 'ראש-משמרת', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'risk', 'label', 'מה חסר', 'format', 'text', 'align', 'start', 'sorted', null)
    ),
    'rows', v_rows,
    'so_what', v_so_what,
    'definitions', 'ציון משוב = ממוצע הציונים (1–5) במשובים שהושלמו · בלי ראש-משמרת = אף אחת מהדיילות שהגיעו לא סומנה ראש-משמרת · 2+ לא הגיעו = שתי דיילות או יותר סומנו "לא הגיעה" · 50+ אורחים לדיילת = מספר האורחים בפועל חלקי מספר הדיילות שהגיעו · איחור בינוני-כבד = לפחות דיילת אחת סומנה באיחור בינוני או כבד · גורם עם פחות מ-20 אירועים בכל צד אינו נכנס לשורת-ההחלטה · הטבלה: אירועים ב-14 הימים הקרובים, לפי הדיילות שאושרו סופית עד עכשיו.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', '[]'::jsonb,
      'frozen_count', null,
      'row_total', jsonb_array_length(v_rows),
      'notes', v_notes,
      'run', null,
      'sort', jsonb_build_object('key', 'event_date', 'direction', 'ascending'),
      'customer_filter_ignored', false,
      'drill_echo', p_drill)
  );
end;
$function$;

comment on function public.report_m06_staffing(date, date, integer, jsonb, integer, integer) is
'מ11 · ה3 — איכות אירועים (דוח-החלטה, 24/09/2026; השם הטכני נשמר). אוכלוסייה: אירועים בארבעת סטטוסי הכרעה 36 עם final_event_date עד p_to ו-feedback_status = completed. ארבעה גורמים לאירוע (כן/לא): אין is_shift_lead בין הנוכחות (arrived/late) · 2+ no_show · actual_guests ÷ נוכחות ≥ 50 (רק כששניהם ידועים) · lateness_level בינוני/כבד. לכל גורם: ממוצע feedback_score עם/בלי, n בכל צד, סף-n = 20. טבלה: אירועים ב-14 הימים הקרובים בלי ראש-משמרת מאושרת או ביחס משוער ≥ 50. אגרגטים בלבד, בלי שמות דיילות ובלי hourly_rate. p_from מתעלמים ממנו (⑧ G5); p_page/p_page_size אינם בשימוש.';

revoke execute on function public.report_m06_staffing(date, date, integer, jsonb, integer, integer) from public, anon;
grant execute on function public.report_m06_staffing(date, date, integer, jsonb, integer, integer) to authenticated;

-- ═══ report_m04_discounts — 1 replacement: משפט-הרווח בשורת-ההחלטה רק על מדגם שעבר את הסף ═══
do $m11$
declare
  v_oid oid;
  v_def text;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m04_discounts';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, $o0$when v_m10 is not null and v_m0 is not null and v_m10 < v_m0$o0$, ''))) <> length($o0$when v_m10 is not null and v_m0 is not null and v_m10 < v_m0$o0$) then
    raise exception 'm11 text report_m04_discounts #0: not exactly once'; end if;
  v_def := replace(v_def, $o0$when v_m10 is not null and v_m0 is not null and v_m10 < v_m0$o0$, $n0$when v_e10 >= v_min_n and v_e0 >= v_min_n and v_m10 < v_m0$n0$);
  if (length(v_def) - length(replace(v_def, $o1$|| case when v_m10 is not null then ', אבל הרווח יורד ל-'$o1$, ''))) <> length($o1$|| case when v_m10 is not null then ', אבל הרווח יורד ל-'$o1$) then
    raise exception 'm11 text report_m04_discounts #1: not exactly once'; end if;
  v_def := replace(v_def, $o1$|| case when v_m10 is not null then ', אבל הרווח יורד ל-'$o1$, $n1$|| case when v_e10 >= v_min_n and v_e0 >= v_min_n then ', אבל הרווח יורד ל-'$n1$);
  execute v_def;
end $m11$;
