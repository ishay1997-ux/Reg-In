-- why: מ11 · דוח-החלטה ה2 — "הנחה מול סגירה" (שדרוג-במקום של report_m04_discounts, 24/09/2026).
--      ישי 23/09: "לדעתי ברור שאם יש יותר הנחה הרווח נשחק אבל זה לא מה שמעניין אלה האם יש קשר בין גובה
--      ההנחה לבין שביעות רצון? … מתי המנהלת מומלץ שתתן הנחה אם זה מה שיסגור את העסקה ומתי עדיף לוותר".
--      ⇒ לכל מדרג-הנחה שלוש שאלות יחד: האם היא סוגרת יותר · כמה רווח היא עולה · האם הלקוח מרוצה יותר.
-- what: אותה פונקציה, אותה חתימה (6 פרמטרים — p_page/p_page_size נשארים ואינם בשימוש: 8 שורות-סיכום),
--       אותו שער (`כספים`). מדרגי-ההנחה 0 · 1–5 · 6–10 · 10+ — הכרעה 39, הגבול העליון שייך לדלי התחתון.
--       הנחה = applied_customer_discount + manual_discount. חברות-הפקה מקבלות הנחה לפי סוג-הלקוח
--       (scripts/seed-lib/plan.mjs) ⇒ הן מוצגות בנפרד, ושורת-ההחלטה נשענת על הלקוחות הישירים בלבד —
--       אחרת "הנחה" הייתה בעצם "סוג לקוח".
--       רווח = finance_project_money() (gross_profit ÷ revenue), לא final_profit. שביעות-רצון = משובים
--       שהושלמו בלבד (feedback_status = 'completed').
-- how: create or replace עם החתימה הזהה ⇒ ACL והערה נשמרים (כותרת K1). הדף מתעלם ממסנן-התקופה, כמו קודם
--      (⑧ G5 — מדרג עמוק בשנה בודדת הוא מדגם קטן מדי): window.from = null ⇒ שורת-המסננים מציגה עובדה.
-- verified before apply: md5(prosrc) החי היה 803ac2f249fb9a966e29cef1b7b5fa03 (23/09 לילה) — L1–L6 לא נגעו בו.
-- reversible: כן — הגוף הקודם בקובצי J2 + K1.
-- ישי 23/09 לילה: "לא לבקש אישור להכיל מיגרציות בסשן הזה. תכיל בעצמך ותאמת לבד".
create or replace function public.report_m04_discounts(
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
  v_statuses constant text[] := array['finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished'];
  v_today date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to date;
  v_customer_name text;
  v_rows jsonb;
  v_chart jsonb;
  v_dec_all integer;
  v_events_all integer;
  v_c0 numeric; v_c10 numeric; v_n0 integer; v_n10 integer;
  v_m0 numeric; v_m10 numeric; v_e0 integer; v_e10 integer;
  v_s0 numeric; v_s10 numeric; v_f0 integer; v_f10 integer;
  v_so_what text;
  v_notes jsonb := '[]'::jsonb;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  v_to := coalesce(p_to, v_today);
  select c.company_name into v_customer_name
    from public.customers c where c.customer_id = p_customer_id;

  with q as (
    select q.quote_id, q.quote_status, q.rejection_reason, c.customer_type,
           coalesce(q.applied_customer_discount, 0) + coalesce(q.manual_discount, 0) d
      from public.quotes q
      join public.customers c on c.customer_id = q.customer_id
     where (p_customer_id is null or q.customer_id = p_customer_id)
       and q.issue_date <= v_to
  ),
  banded as (
    select *,
           case when d = 0 then '0' when d <= 5 then '1-5' when d <= 10 then '6-10' else '10+' end band,
           case when customer_type = 'production_company' then 'production' else 'direct' end grp,
           quote_status = 'approved' won,
           quote_status = 'approved'
             or (quote_status = 'rejected' and coalesce(rejection_reason, '') <> 'נפתחה בטעות') decided
      from q
  ),
  ev as (
    select b.band, b.grp, fm.revenue, fm.gross_profit, p.feedback_status, p.feedback_score
      from banded b
      join public.projects p on p.quote_id = b.quote_id
      cross join lateral public.finance_project_money(p.project_id) fm
     where b.won and p.project_status = any (v_statuses)
       and p.final_event_date is not null and p.final_event_date <= v_to
  ),
  keys as (
    select k.band, k.label, k.ord, g.grp, g.glabel, g.gord
      from unnest(array['0', '1-5', '6-10', '10+'], array['0%', '1–5%', '6–10%', '10%+']) with ordinality k(band, label, ord)
      cross join (values ('direct', 'לקוחות ישירים', 1), ('production', 'חברות הפקה', 2)) g(grp, glabel, gord)
  ),
  agg as (
    select k.*,
           (select count(*) from banded b where b.band = k.band and b.grp = k.grp and b.decided)::integer dec_n,
           (select count(*) from banded b where b.band = k.band and b.grp = k.grp and b.won)::integer won_n,
           (select count(*) from ev e where e.band = k.band and e.grp = k.grp)::integer ev_n,
           (select 100 * sum(e.gross_profit) / nullif(sum(e.revenue), 0) from ev e where e.band = k.band and e.grp = k.grp) margin,
           (select count(*) from ev e where e.band = k.band and e.grp = k.grp and e.feedback_status = 'completed')::integer fb_n,
           (select avg(e.feedback_score) from ev e where e.band = k.band and e.grp = k.grp and e.feedback_status = 'completed') score
      from keys k
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'band', label, 'group', glabel, 'decided', dec_n,
      'close_rate', round(100.0 * won_n / nullif(dec_n, 0), 1),
      'events', ev_n, 'margin', round(margin, 1),
      'score', round(score, 2), 'feedback_n', fb_n) order by gord, ord), '[]'::jsonb),
    coalesce(jsonb_agg(jsonb_build_object(
      'band', label,
      'close_rate', case when dec_n >= v_min_n then round(100.0 * won_n / dec_n, 1) end,
      'margin', case when ev_n >= v_min_n then round(margin, 1) end,
      'n', dec_n) order by ord) filter (where grp = 'direct'), '[]'::jsonb),
    sum(dec_n)::integer, sum(ev_n)::integer,
    max(round(100.0 * won_n / nullif(dec_n, 0), 1)) filter (where grp = 'direct' and band = '0'),
    max(round(100.0 * won_n / nullif(dec_n, 0), 1)) filter (where grp = 'direct' and band = '10+'),
    max(dec_n) filter (where grp = 'direct' and band = '0'),
    max(dec_n) filter (where grp = 'direct' and band = '10+'),
    max(round(margin, 1)) filter (where grp = 'direct' and band = '0'),
    max(round(margin, 1)) filter (where grp = 'direct' and band = '10+'),
    max(ev_n) filter (where grp = 'direct' and band = '0'),
    max(ev_n) filter (where grp = 'direct' and band = '10+'),
    max(round(score, 2)) filter (where grp = 'direct' and band = '0'),
    max(round(score, 2)) filter (where grp = 'direct' and band = '10+'),
    max(fb_n) filter (where grp = 'direct' and band = '0'),
    max(fb_n) filter (where grp = 'direct' and band = '10+')
    into v_rows, v_chart, v_dec_all, v_events_all,
         v_c0, v_c10, v_n0, v_n10, v_m0, v_m10, v_e0, v_e10, v_s0, v_s10, v_f0, v_f10
    from agg;

  if p_drill is not null then
    v_notes := v_notes || to_jsonb('הדוח הזה אינו תומך בקידוח.'::text);
  end if;

  -- ── שורת-ההחלטה — על הלקוחות הישירים בלבד, ורק כשלשני הקצוות יש מדגם ─────────────────
  v_so_what := case
    when coalesce(v_n0, 0) < v_min_n or coalesce(v_n10, 0) < v_min_n then
      'לא להסיק עדיין — יש מעט מדי הצעות בהנחה של מעל ' || v_lri || '10%' || v_pdi || ' כדי להשוות.'
    when v_c10 <= v_c0 then
      'לא לתת מעל ' || v_lri || '10%' || v_pdi || ' הנחה כדי לסגור — הסגירה בה ' || v_lri || to_char(v_c10, 'FM990.0') || '%' || v_pdi
      || ' מול ' || v_lri || to_char(v_c0, 'FM990.0') || '%' || v_pdi || ' בלי הנחה'
      || case when v_m10 is not null and v_m0 is not null and v_m10 < v_m0
              then ', והרווח יורד ל-' || v_lri || to_char(v_m10, 'FM990.0') || '%' || v_pdi else '' end || '.'
    else
      'לתת מעל ' || v_lri || '10%' || v_pdi || ' רק כשזה סוגר — הסגירה עולה ל-' || v_lri || to_char(v_c10, 'FM990.0') || '%' || v_pdi
      || case when v_m10 is not null then ', אבל הרווח יורד ל-' || v_lri || to_char(v_m10, 'FM990.0') || '%' || v_pdi else '' end || '.'
  end;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', coalesce(v_dec_all, 0),
      'summary', v_lri || to_char(coalesce(v_dec_all, 0), 'FM999,999') || v_pdi || ' הצעות שהוכרעו · '
                 || v_lri || to_char(coalesce(v_events_all, 0), 'FM999,999') || v_pdi || ' אירועים',
      'label', 'שתי אוכלוסיות: שיעור-הסגירה נמדד על הצעות שהוכרעו (אושרו או נדחו; «נפתחה בטעות» אינה נספרת). '
               || 'הרווח ושביעות-הרצון נמדדים על האירועים שנולדו מההצעות שאושרו וכבר התקיימו; שביעות-רצון — רק משובים שהושלמו. '
               || 'חברות-הפקה מקבלות הנחה לפי סוג-הלקוח, ולכן הן מוצגות בנפרד ואינן נכנסות לשורת-ההחלטה. '
               || 'ההשוואה בין מדרגים מראה קשר, לא סיבה — ההנחה נבחרה לפי הלקוח ולא הוגרלה.',
      'excluded', '{}'::jsonb),
    'window', jsonb_build_object('from', null, 'to', v_to,
      'label', 'כל הזמנים · ' || coalesce(v_customer_name, 'כל הלקוחות')),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'close_deep', 'label', 'סגירה בהנחה מעל 10%',
        'value', case when v_n10 >= v_min_n then v_c10 end, 'format', 'percent',
        'sub', case when v_n10 >= v_min_n then v_lri || v_n10 || v_pdi || ' הצעות'
                    else 'אין מספיק נתונים (' || v_lri || coalesce(v_n10, 0) || v_pdi || ')' end,
        'window', 'לקוחות ישירים · כל הזמנים',
        'compare', case when v_n0 >= v_min_n and v_n10 >= v_min_n then jsonb_build_object(
          'value', v_c0, 'label', 'בלי הנחה',
          'direction', case when v_c10 > v_c0 then 'up' when v_c10 < v_c0 then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'margin_deep', 'label', 'שולי-רווח בהנחה מעל 10%',
        'value', case when v_e10 >= v_min_n then v_m10 end, 'format', 'percent',
        'sub', case when v_e10 >= v_min_n then v_lri || v_e10 || v_pdi || ' אירועים'
                    else 'אין מספיק נתונים (' || v_lri || coalesce(v_e10, 0) || v_pdi || ')' end,
        'window', 'לקוחות ישירים · כל הזמנים',
        'compare', case when v_e0 >= v_min_n and v_e10 >= v_min_n then jsonb_build_object(
          'value', v_m0, 'label', 'בלי הנחה',
          'direction', case when v_m10 > v_m0 then 'up' when v_m10 < v_m0 then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'score_deep', 'label', 'משוב בהנחה מעל 10%',
        'value', case when v_f10 >= v_min_n then v_s10 end, 'format', 'ratio',
        'sub', case when v_f10 >= v_min_n then v_lri || v_f10 || v_pdi || ' משובים'
                    else 'אין מספיק נתונים (' || v_lri || coalesce(v_f10, 0) || v_pdi || ')' end,
        'window', 'ממוצע הציון (1–5) · לקוחות ישירים · כל הזמנים',
        'compare', case when v_f0 >= v_min_n and v_f10 >= v_min_n then jsonb_build_object(
          'value', v_s0, 'label', 'בלי הנחה', 'format', 'ratio',
          'direction', case when v_s10 > v_s0 then 'up' when v_s10 < v_s0 then 'down' else 'flat' end) end,
        'target', null)
    ),
    'chart', jsonb_build_object(
      'type', 'bar', 'title', 'סגירה ורווח לפי הנחה',
      'series', jsonb_build_array(
        jsonb_build_object('key', 'close_rate', 'label', 'שיעור סגירה', 'kind', 'bar', 'axis', 'left', 'format', 'percent'),
        jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'kind', 'bar', 'axis', 'left', 'format', 'percent')),
      'data', v_chart, 'xKey', 'band', 'note', 'לקוחות ישירים בלבד; מדרג עם פחות מ-20 הצעות — בלי עמודה.',
      'domain', jsonb_build_array(0, 100), 'refLines', '[]'::jsonb, 'unit', 'percent'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'band', 'label', 'הנחה', 'format', 'textLtr', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'group', 'label', 'סוג לקוח', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'decided', 'label', 'הצעות', 'format', 'int', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'close_rate', 'label', 'שיעור סגירה', 'format', 'percent', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'events', 'label', 'אירועים', 'format', 'int', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'format', 'percent', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'score', 'label', 'ציון משוב', 'format', 'ratio', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'feedback_n', 'label', 'משובים', 'format', 'int', 'align', 'end', 'sorted', null)
    ),
    'rows', v_rows,
    'so_what', v_so_what,
    'definitions', 'הנחה = ההנחה הקבועה של הלקוח ועוד ההנחה הידנית בהצעה, יחד · מדרגים: 0 · 1–5% · 6–10% · מעל 10% (הגבול העליון שייך למדרג הנמוך) · שיעור סגירה = אושרו חלקי (אושרו + נדחו); «נפתחה בטעות» אינה נספרת · שולי-רווח = סך הרווח חלקי סך ההכנסה של אירועי המדרג, לא ממוצע של אחוזים · ציון משוב = ממוצע הציונים (1–5) במשובים שהושלמו · לקוחות ישירים = כל סוגי הלקוח חוץ מחברות הפקה · מדרג עם פחות מ-20 הצעות אינו נכנס לשורת-ההחלטה.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', '[]'::jsonb,
      'frozen_count', null,
      'row_total', jsonb_array_length(v_rows),
      'notes', v_notes,
      'run', null,
      'sort', null,
      'customer_filter_ignored', false,
      'drill_echo', p_drill)
  );
end;
$function$;

comment on function public.report_m04_discounts(date, date, integer, jsonb, integer, integer) is
'מ11 · ה2 — הנחה מול סגירה (דוח-החלטה, 24/09/2026; השם הטכני נשמר). לכל מדרג-הנחה (הכרעה 39: 0 · 1–5 · 6–10 · 10+) × קבוצת-לקוח (ישירים · חברות הפקה): שיעור-סגירה על quotes שהוכרעו עד p_to (§7.82 מחריג «נפתחה בטעות»); שולי-רווח דרך finance_project_money על אירועי ההצעות שאושרו בארבעת סטטוסי הכרעה 36; ממוצע feedback_score על feedback_status = completed. p_from מתעלמים ממנו (⑧ G5). p_page/p_page_size נשארים בחתימה (K1) ואינם בשימוש — 8 שורות-סיכום. שורת-ההחלטה על הלקוחות הישירים בלבד, סף-n = 20.';

revoke execute on function public.report_m04_discounts(date, date, integer, jsonb, integer, integer) from public, anon;
grant execute on function public.report_m04_discounts(date, date, integer, jsonb, integer, integer) to authenticated;
