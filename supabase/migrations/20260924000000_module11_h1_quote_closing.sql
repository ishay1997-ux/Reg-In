-- why: מ11 · דוח-החלטה ה1 — "סגירת הצעות" (שדרוג-במקום של report_m03_trends, 24/09/2026).
--      ישי 23/09: "מה מאפיין הצעות מחיר שנסגרות?" · "שגורם למנהלת באמת לעשות משו ולא סתם להנהן".
--      "מגמות רב-שנתיות" ענה על "האם הצמיחה שומרת על הרווח" — שאלה שמ02 כבר עונה עליה, ושהמנהלת
--      מהנהנת מולה. הדוח החדש אומר איפה הכסף הולך לאיבוד ומה מאפיין הצעה שנסגרת ⇒ מה לעשות מחר.
-- what: אותה פונקציה, אותה חתימה (4 פרמטרים), אותו שער (`כספים`), תוכן חדש בחוזה C8.
--      אוכלוסייה: הצעות שהוכרעו (אושרו + נדחו) שהופקו בתקופה; «נפתחה בטעות» אינה נספרת (§7.82,
--      התאומה של deriveQuoteMetrics). ערך-הצעה = סכום השורות אחרי הנחה ולפני מע"מ — אותה נוסחה
--      של finance_project_money (subtotal − round(subtotal × הנחה ÷ 100, 2)).
-- how: create or replace עם החתימה הזהה ⇒ אין עומס-יתר (42725), ה-ACL וההערה נשמרים (כותרת K1).
--      הערת-הפונקציה מתעדכנת בסוף. אין שינוי-סכמה ואין שינוי בנתונים.
-- verified before apply: הגוף החי של report_m03_trends היה md5(prosrc)=668b22433f2043a535b2715567599733
--      (נמדד 23/09 לילה) — אף סבב-טקסט (L1–L6) לא נגע בו.
-- reversible: כן — הגוף הקודם שמור בקובצי J3 + K1 (הגוף החי לפני הקובץ הזה).
-- ישי 23/09 לילה: "לא לבקש אישור להכיל מיגרציות בסשן הזה. תכיל בעצמך ותאמת לבד".
create or replace function public.report_m03_trends(
  p_from date default null,
  p_to date default null,
  p_customer_id integer default null,
  p_drill jsonb default null
)
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
declare
  v_lri constant text := chr(8294);
  v_pdi constant text := chr(8297);
  -- סף-n (הכרעת שלב 1, התוכנית §9ב): מתחת ל-20 הצעות בקבוצה ⇒ "אין מספיק נתונים", לא מסקנה.
  v_min_n constant integer := 20;
  v_mistake constant text := 'נפתחה בטעות';
  v_expired constant text := 'פג תוקף';
  v_today date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to date;
  v_from date;
  v_prev_from date;
  v_prev_to date;
  v_customer_name text;
  v_all_n integer;
  v_dec integer;
  v_won integer;
  v_lost_n integer;
  v_lost_sum numeric;
  v_exp_n integer;
  v_exp_sum numeric;
  v_mistake_n integer;
  v_open_n integer;
  v_open_past_n integer;
  v_prev_dec integer;
  v_prev_won integer;
  v_prev_lost_sum numeric;
  v_prev_exp_sum numeric;
  v_new_dec integer;
  v_new_won integer;
  v_rep_dec integer;
  v_rep_won integer;
  v_rate numeric;
  v_prev_rate numeric;
  v_new_rate numeric;
  v_rep_rate numeric;
  v_reasons jsonb;
  v_segments jsonb;
  v_rows jsonb;
  v_top_reason text;
  v_top_sum numeric;
  v_so_what text;
  v_notes jsonb := '[]'::jsonb;
  v_base jsonb;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  v_to := coalesce(p_to, v_today);
  v_from := coalesce(p_from, date_trunc('year', v_to)::date);
  v_prev_from := (v_from - interval '1 year')::date;
  v_prev_to := (v_to - interval '1 year')::date;

  select c.company_name into v_customer_name
    from public.customers c where c.customer_id = p_customer_id;

  -- ── הבסיס: כל ההצעות של הלקוח/כולם, עם ערך, סטטוס-הכרעה, ולקוח-חדש-או-חוזר ─────────────
  -- "לקוח חוזר" = לקוח שכבר אישר הצעה **לפני** ההצעה הזו (issue_date קודם). הצעה ראשונה של לקוח
  -- חדש שנדחתה משאירה אותו "חדש" גם בהצעה הבאה — וזו ההגדרה הנכונה לשאלה "למי קשה יותר למכור".
  -- ⚠️ jsonb ולא טבלה-זמנית: פונקציה STABLE אינה רשאית ליצור טבלה או להכניס שורות.
  select coalesce(jsonb_agg(jsonb_build_object(
           'quote_id', q.quote_id, 'customer_id', q.customer_id, 'company_name', c.company_name,
           'customer_type', c.customer_type, 'event_name', q.event_name, 'issue_date', q.issue_date,
           'estimated_event_date', q.estimated_event_date, 'quote_status', q.quote_status,
           'reason', q.rejection_reason,
           'val', round(coalesce(s.sub, 0) - round(coalesce(s.sub, 0)
                  * (coalesce(q.applied_customer_discount, 0) + coalesce(q.manual_discount, 0)) / 100.0, 2)),
           'won', q.quote_status = 'approved',
           'lost', q.quote_status = 'rejected' and coalesce(q.rejection_reason, '') <> v_mistake,
           'repeat_cust', exists (select 1 from public.quotes q0
                                   where q0.customer_id = q.customer_id and q0.quote_status = 'approved'
                                     and q0.issue_date < q.issue_date))), '[]'::jsonb)
    into v_base
    from public.quotes q
    join public.customers c on c.customer_id = q.customer_id
    left join lateral (select sum(qs.qty * qs.closing_unit_price) sub
                         from public.quote_services qs where qs.quote_id = q.quote_id) s on true
   where (p_customer_id is null or q.customer_id = p_customer_id);

  select count(*) filter (where issue_date between v_from and v_to),
         count(*) filter (where issue_date between v_from and v_to and (won or lost)),
         count(*) filter (where issue_date between v_from and v_to and won),
         count(*) filter (where issue_date between v_from and v_to and lost),
         coalesce(sum(val) filter (where issue_date between v_from and v_to and lost), 0),
         count(*) filter (where issue_date between v_from and v_to and lost and reason = v_expired),
         coalesce(sum(val) filter (where issue_date between v_from and v_to and lost and reason = v_expired), 0),
         count(*) filter (where issue_date between v_from and v_to and quote_status = 'rejected' and reason = v_mistake),
         count(*) filter (where issue_date between v_from and v_to and quote_status = 'in_progress'),
         count(*) filter (where issue_date between v_from and v_to and quote_status = 'in_progress'
                            and estimated_event_date < v_today),
         count(*) filter (where issue_date between v_prev_from and v_prev_to and (won or lost)),
         count(*) filter (where issue_date between v_prev_from and v_prev_to and won),
         coalesce(sum(val) filter (where issue_date between v_prev_from and v_prev_to and lost), 0),
         coalesce(sum(val) filter (where issue_date between v_prev_from and v_prev_to and lost and reason = v_expired), 0),
         count(*) filter (where issue_date between v_from and v_to and (won or lost) and not repeat_cust),
         count(*) filter (where issue_date between v_from and v_to and won and not repeat_cust),
         count(*) filter (where issue_date between v_from and v_to and (won or lost) and repeat_cust),
         count(*) filter (where issue_date between v_from and v_to and won and repeat_cust)
    into v_all_n, v_dec, v_won, v_lost_n, v_lost_sum, v_exp_n, v_exp_sum, v_mistake_n, v_open_n,
         v_open_past_n, v_prev_dec, v_prev_won, v_prev_lost_sum, v_prev_exp_sum,
         v_new_dec, v_new_won, v_rep_dec, v_rep_won
    from jsonb_to_recordset(v_base) as b(quote_id integer, customer_id bigint, company_name text,
         customer_type text, event_name text, issue_date date, estimated_event_date date,
         quote_status text, reason text, val numeric, won boolean, lost boolean, repeat_cust boolean);

  -- אין הכרעות ⇒ `null` ולא 0% (אותו כלל של deriveQuoteMetrics: "0%" על מדגם ריק הוא שקר).
  v_rate := round(100.0 * v_won / nullif(v_dec, 0), 1);
  v_prev_rate := round(100.0 * v_prev_won / nullif(v_prev_dec, 0), 1);
  v_new_rate := round(100.0 * v_new_won / nullif(v_new_dec, 0), 1);
  v_rep_rate := round(100.0 * v_rep_won / nullif(v_rep_dec, 0), 1);

  -- ── גרף 1: כסף שאבד לפי סיבת-הדחייה (הגדול ראשון) ─────────────────────────────────────
  select coalesce(jsonb_agg(jsonb_build_object(
           'reason', reason, 'lost_sum', lost_sum, 'lost_n', lost_n) order by lost_sum desc, reason), '[]'::jsonb)
    into v_reasons
    from (select reason, sum(val) lost_sum, count(*)::integer lost_n
            from jsonb_to_recordset(v_base) as b(quote_id integer, customer_id bigint, company_name text,
         customer_type text, event_name text, issue_date date, estimated_event_date date,
         quote_status text, reason text, val numeric, won boolean, lost boolean, repeat_cust boolean)
           where issue_date between v_from and v_to and lost
           group by reason) r;

  select r ->> 'reason', (r ->> 'lost_sum')::numeric into v_top_reason, v_top_sum
    from jsonb_array_elements(v_reasons) r limit 1;

  -- ── גרף 2: שיעור-סגירה לפי מאפיין — חדש/חוזר · זמן עד-האירוע ─────────────────────────
  -- n נוסע עם כל עמודה; קבוצה מתחת לסף מקבלת `rate: null` — עמודה ריקה, לא מספר על 7 הצעות.
  select jsonb_build_array(
      jsonb_build_object('segment', 'לקוח חדש', 'n', count(*) filter (where not repeat_cust),
                         'won', count(*) filter (where not repeat_cust and won)),
      jsonb_build_object('segment', 'לקוח חוזר', 'n', count(*) filter (where repeat_cust),
                         'won', count(*) filter (where repeat_cust and won)),
      jsonb_build_object('segment', 'פחות משבועיים מראש', 'n', count(*) filter (where estimated_event_date - issue_date < 14),
                         'won', count(*) filter (where estimated_event_date - issue_date < 14 and won)),
      jsonb_build_object('segment', 'שבועיים עד חודשיים', 'n', count(*) filter (where estimated_event_date - issue_date between 14 and 60),
                         'won', count(*) filter (where estimated_event_date - issue_date between 14 and 60 and won)),
      jsonb_build_object('segment', 'יותר מחודשיים מראש', 'n', count(*) filter (where estimated_event_date - issue_date > 60),
                         'won', count(*) filter (where estimated_event_date - issue_date > 60 and won)))
    into v_segments
    from jsonb_to_recordset(v_base) as b(quote_id integer, customer_id bigint, company_name text,
         customer_type text, event_name text, issue_date date, estimated_event_date date,
         quote_status text, reason text, val numeric, won boolean, lost boolean, repeat_cust boolean)
   where issue_date between v_from and v_to and (won or lost);

  select coalesce(jsonb_agg((e - 'won') || jsonb_build_object('rate',
           case when (e ->> 'n')::integer >= v_min_n
                then round(100.0 * (e ->> 'won')::integer / (e ->> 'n')::integer, 1) end) order by o), '[]'::jsonb)
    into v_segments
    from jsonb_array_elements(v_segments) with ordinality x(e, o);

  -- ── הטבלה: ההצעות שאבדו בתקופה, הגדולה ראשונה ────────────────────────────────────────
  select coalesce(jsonb_agg(jsonb_build_object(
           'quote_id', quote_id, 'customer_name', company_name, 'event_name', event_name,
           'issue_date', issue_date, 'value', val, 'reason', reason,
           'drill_key', jsonb_build_object('kind', 'quote', 'id', quote_id))
           order by val desc, quote_id), '[]'::jsonb)
    into v_rows
    from jsonb_to_recordset(v_base) as b(quote_id integer, customer_id bigint, company_name text,
         customer_type text, event_name text, issue_date date, estimated_event_date date,
         quote_status text, reason text, val numeric, won boolean, lost boolean, repeat_cust boolean)
   where issue_date between v_from and v_to and lost;

  if v_open_past_n > 0 then
    v_notes := v_notes || to_jsonb((v_lri || v_open_past_n || v_pdi
      || case when v_open_past_n = 1 then ' הצעה פתוחה שתאריך האירוע שלה עבר — לא נספרה.'
              else ' הצעות פתוחות שתאריך האירוע שלהן עבר — לא נספרו.' end)::text);
  end if;
  if p_drill is not null then
    v_notes := v_notes || to_jsonb('הדוח הזה אינו תומך בקידוח.'::text);
  end if;

  -- ── שורת-ההחלטה: פעולה קודמת לעובדה, ורק על מדגם שעבר את הסף ─────────────────────────
  v_so_what := case
    when coalesce(v_dec, 0) = 0 then 'אין הצעות שהוכרעו בתקופה — להרחיב את התקופה.'
    when v_dec < v_min_n then
      'להרחיב את התקופה — ' || v_lri || v_dec || v_pdi || ' הצעות שהוכרעו הן מעט מדי כדי להסיק.'
    when v_exp_n > 0 then
      'לעקוב אחרי הצעות פתוחות לפני שהן פגות — ' || v_lri || v_exp_n || v_pdi
      || case when v_exp_n = 1 then ' פגה' else ' פגו' end || ' בלי מענה, '
      || v_lri || to_char(v_exp_sum, 'FM999,999,999') || ' ₪' || v_pdi || '.'
    when v_new_dec >= v_min_n and v_rep_dec >= v_min_n and v_rep_rate - v_new_rate >= 5 then
      'לחזור מהר ללקוחות חדשים — הם נסגרים ב-' || v_lri || to_char(v_new_rate, 'FM990.0') || '%' || v_pdi
      || ' מול ' || v_lri || to_char(v_rep_rate, 'FM990.0') || '%' || v_pdi || ' אצל חוזרים.'
    when v_top_reason is not null then
      'לבדוק את הסיבה «' || v_top_reason || '» — היא הגדולה בכסף שאבד: '
      || v_lri || to_char(v_top_sum, 'FM999,999,999') || ' ₪' || v_pdi || '.'
    else 'אין הצעות שאבדו בתקופה.'
  end;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', coalesce(v_dec, 0),
      'summary', v_lri || to_char(coalesce(v_dec, 0), 'FM999,999') || v_pdi || ' הצעות שהוכרעו · מתוך '
                 || v_lri || to_char(coalesce(v_all_n, 0), 'FM999,999') || v_pdi,
      'label', 'נכללות הצעות שהופקו בתקופה והוכרעו: אושרו או נדחו. לא נכללות הצעות שעוד פתוחות ('
               || v_lri || coalesce(v_open_n, 0) || v_pdi || ') והצעות שנסגרו «נפתחה בטעות» ('
               || v_lri || coalesce(v_mistake_n, 0) || v_pdi || '). ההשוואה בין קבוצות מראה קשר, לא סיבה.',
      'excluded', jsonb_build_object('הצעות פתוחות', coalesce(v_open_n, 0),
                                     'נפתחה בטעות', coalesce(v_mistake_n, 0),
                                     'פתוחות שתאריך האירוע שלהן עבר', coalesce(v_open_past_n, 0))),
    'window', jsonb_build_object('from', v_from, 'to', v_to,
      'label', v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi
               || ' · ' || coalesce(v_customer_name, 'כל הלקוחות')),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'close_rate', 'label', 'שיעור סגירה',
        'value', case when v_dec >= v_min_n then v_rate end, 'format', 'percent',
        'sub', case when v_dec >= v_min_n
                    then v_lri || to_char(v_won, 'FM999,999') || v_pdi || ' מתוך ' || v_lri || to_char(v_dec, 'FM999,999') || v_pdi
                    else 'אין מספיק נתונים (' || v_lri || coalesce(v_dec, 0) || v_pdi || ')' end,
        'window', 'לפי תאריך הפקת ההצעה',
        'compare', case when v_prev_dec >= v_min_n and v_dec >= v_min_n then jsonb_build_object(
          'value', v_prev_rate, 'label', 'אשתקד',
          'direction', case when v_rate > v_prev_rate then 'up' when v_rate < v_prev_rate then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'lost_value', 'label', 'כסף שאבד',
        'value', v_lost_sum, 'format', 'money',
        'sub', v_lri || to_char(coalesce(v_lost_n, 0), 'FM999,999') || v_pdi || ' הצעות שנדחו',
        'window', 'אחרי הנחה, לפני מע"מ',
        'compare', case when v_prev_dec > 0 then jsonb_build_object(
          'value', v_prev_lost_sum, 'label', 'אשתקד',
          'direction', case when v_lost_sum > v_prev_lost_sum then 'up' when v_lost_sum < v_prev_lost_sum then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'expired_value', 'label', 'פגו בלי מענה',
        'value', v_exp_sum, 'format', 'money',
        'sub', v_lri || to_char(coalesce(v_exp_n, 0), 'FM999,999') || v_pdi || ' הצעות',
        'window', 'הצעות שהמערכת סגרה כי עבר תוקפן בלי תשובה',
        'compare', case when v_prev_dec > 0 then jsonb_build_object(
          'value', v_prev_exp_sum, 'label', 'אשתקד',
          'direction', case when v_exp_sum > v_prev_exp_sum then 'up' when v_exp_sum < v_prev_exp_sum then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'new_customer_rate', 'label', 'סגירה, לקוח חדש',
        'value', case when v_new_dec >= v_min_n then v_new_rate end, 'format', 'percent',
        'sub', case when v_new_dec >= v_min_n
                    then v_lri || to_char(v_new_dec, 'FM999,999') || v_pdi || ' הצעות'
                    else 'אין מספיק נתונים (' || v_lri || coalesce(v_new_dec, 0) || v_pdi || ')' end,
        'window', 'לקוח חדש = עוד לא אישר אף הצעה לפני זו',
        'compare', case when v_new_dec >= v_min_n and v_rep_dec >= v_min_n then jsonb_build_object(
          'value', v_rep_rate, 'label', 'לקוח חוזר',
          'direction', case when v_new_rate > v_rep_rate then 'up' when v_new_rate < v_rep_rate then 'down' else 'flat' end) end,
        'target', null)
    ),
    'chart', jsonb_build_array(
      jsonb_build_object(
        'type', 'bar', 'title', 'כסף שאבד לפי סיבה',
        'series', jsonb_build_array(
          jsonb_build_object('key', 'lost_sum', 'label', 'כסף שאבד', 'kind', 'bar', 'axis', 'left', 'format', 'money')),
        'data', v_reasons, 'xKey', 'reason', 'refLines', '[]'::jsonb, 'unit', 'money'),
      jsonb_build_object(
        'type', 'bar', 'title', 'שיעור סגירה לפי מאפיין',
        'series', jsonb_build_array(
          jsonb_build_object('key', 'rate', 'label', 'שיעור סגירה', 'kind', 'bar', 'axis', 'left', 'format', 'percent')),
        'data', v_segments, 'xKey', 'segment', 'filter_key', false,
        'domain', jsonb_build_array(0, 100), 'refLines', '[]'::jsonb, 'unit', 'percent')
    ),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'quote_id', 'label', 'הצעה', 'format', 'id', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'event_name', 'label', 'אירוע', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'issue_date', 'label', 'הופקה', 'format', 'date', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'reason', 'label', 'סיבה', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'value', 'label', 'ערך ההצעה', 'format', 'money', 'align', 'end', 'sorted', 'desc')
    ),
    'rows', v_rows,
    'so_what', v_so_what,
    'definitions', 'שיעור סגירה = אושרו חלקי (אושרו + נדחו); הצעות שנסגרו «נפתחה בטעות» אינן נספרות · כסף שאבד = סכום ההצעות שנדחו, אחרי הנחה ולפני מע"מ · פגו בלי מענה = הצעות שהמערכת סגרה כי עבר תוקפן בלי תשובה מהלקוח · לקוח חוזר = לקוח שכבר אישר הצעה לפני זו · זמן מראש = מתאריך הפקת ההצעה עד תאריך האירוע המשוער · קבוצה עם פחות מ-20 הצעות אינה מקבלת אחוז · התקופה נספרת לפי תאריך הפקת ההצעה · "אשתקד" = אותו חישוב על אותם ימים בשנה שעברה.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', '[]'::jsonb,
      'frozen_count', null,
      'row_total', coalesce(v_lost_n, 0),
      'notes', v_notes,
      'run', null,
      'sort', jsonb_build_object('key', 'value', 'direction', 'descending'),
      'customer_filter_ignored', false,
      'drill_echo', p_drill)
  );
end;
$function$;

comment on function public.report_m03_trends(date, date, integer, jsonb) is
'מ11 · ה1 — סגירת הצעות (דוח-החלטה, 24/09/2026; השם הטכני report_m03_trends נשמר כדי לא לשבור קישורים והרשאות). אוכלוסייה: הצעות שהופקו בחלון [p_from, p_to] (ברירת-מחדל: מתחילת השנה עד היום בשעון ישראל) והוכרעו — אושרו או נדחו; «נפתחה בטעות» אינה נספרת (§7.82, NON_LOSS_REJECTION_REASONS ב-src/lib/quotes.js). ערך-הצעה = סכום qty × closing_unit_price אחרי הנחה (applied_customer_discount + manual_discount) ולפני מע"מ, באותה נוסחה של finance_project_money. לקוח חוזר = אישר הצעה לפני issue_date של ההצעה. סף-n = 20. אין קידוח; p_drill מוחזר ב-meta.drill_echo בלבד.';

revoke execute on function public.report_m03_trends(date, date, integer, jsonb) from public, anon;
grant execute on function public.report_m03_trends(date, date, integer, jsonb) to authenticated;
