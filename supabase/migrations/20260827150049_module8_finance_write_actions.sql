-- =============================================================================
-- מודול 8 · מיגרציה E2 · צעד 1.5 (חלק ב) — פעולות-הכתיבה של הכספים
-- =============================================================================
-- E1 בנה את מקור-האמת של הכסף ואת שני הקוראים. כאן נולדות הפעולות שכותבות,
-- וכולן צורכות את `finance_project_money` — אין כאן חישוב-רווח שני.
-- ‏(‏E3 יביא את טרנזקציית-דוח-השכר — עולם נפרד, P4 מול P1/P3.)
--
-- 🔑 **חמש פעולות ולא ארבע (B-13):** ה22 מנה ארבע, אבל כרטיס-P3 אישר מסלול
-- "סגור ללא תשלום" לפרויקט **רגיל** — ולזה לא היה כותב באף אחת מהארבע.
-- ‏`record_write_off` היא החמישית, והרחבת-ה22 גולתה באישור.
--
-- 🔴 **שער-הסטטוס (ה12)** — כתיבת-כספים רק מ-`awaiting_invoice` ואילך.
-- ו-`finished` הוא **נעילה מוחלטת**: התנאים-המוקדמים הם הנעילה (דפוס ㉙ של מ6),
-- לא טריגר. "אין undo; פתיחה = התערבות-מסד" (כרטיס-P3).
--
-- 🔴 **מוקש T1 — תוקן מול הגוף החי של האילוץ, לא מהתוכנית.** האילוץ
-- `projects_closed_needs_report` **אינו מזכיר `cancelled` כלל**; הוא דורש
-- `summary_report_url IS NOT NULL` בשלושת הסטטוסים שאחרי הסגירה התפעולית.
-- ⇒ `archive_project` אוכפת את התנאי **בעצמה** ומחזירה P0001 בעברית. בלי זה,
-- ארכוב לגיטימי היה נופל על שגיאת-CHECK גולמית שאיש לא יודע לפרש.
--
-- 🔑 **הקפאת-רווח של מבוטל (Q-3/Q-4)** — הנוסחה, ואומתה מול עוגן-היד לפני הכתיבה:
--   דמי-ביטול = ① פיצוי-צוות (% סולם-ה24 × שעות-מתוכננות × Σ תעריפי-מאושרות-סופית)
--             + ② סחורה ב-`ordered`/`ready` × **closing_unit_price** (ה23 — "מחיר מלא")
--   רווח-קפוא(מבוטל) = דמי-הביטול − ① − ② **בעלות** (`closing_unit_cost`)
--   ⇒ ויתור (fee=0) מייצר **הפסד רשום אמיתי**, וזו האמת החשבונאית (Q-3).
--   אומת חי 27/08/2026 על #14: 30.0 שעות ⇒ 50% · ‏328.00 + 3,180.00 = **3,508.00** = spec §③3.
--
-- 🔴 **רגע-ההקפאה (Q-4):** ויתור וחוב-אבוד מקפיאים **מיד**; דמי-ביטול **שחויבו**
-- קופאים כשהתשלום נרשם. לעולם לא בשמירת-הסכום לבדה, ולעולם לא בארכוב —
-- שממילא חסום פיזית למבוטל.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. הפונקציה הישנה יורדת — במפורש, לא בשקט
-- -----------------------------------------------------------------------------
-- ה22: החתימה בת ששת-הארגומנטים של מ6 מוחלפת בחמש פעולות מוצהרות.
-- נמדד 27/08/2026: **אפס אתרי-קריאה** ב-`src/`, ב-`e2e/` וב-`supabase/functions/`.
drop function if exists public.set_project_finance_fields(integer, boolean, date, integer, text, text);


-- -----------------------------------------------------------------------------
-- 1. שער משותף לכל הכתיבות
-- -----------------------------------------------------------------------------
create or replace function finance_assert_writable(p_project_id integer)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare v_status text;
begin
  perform public.assert_module_permission('כספים', array['edit']);

  select p.project_status into v_status
    from public.projects p where p.project_id = p_project_id;

  if v_status is null then
    raise exception 'פרויקט % לא נמצא.', p_project_id using errcode = 'P0001';
  end if;

  -- הנעילה של P3. ההודעה נאמרת כמו שהמנהלת תקרא אותה, לא כקוד-שגיאה.
  if v_status = 'finished' then
    raise exception 'התיק נעול — הפרויקט כבר הועבר לארכיון ואי אפשר לשנות בו נתונים כספיים.'
      using errcode = 'P0001';
  end if;

  -- ה12: לפני הסגירה התפעולית אין על מה לכתוב כספים.
  if v_status not in ('awaiting_invoice', 'awaiting_payment', 'cancelled') then
    raise exception 'לא ניתן לכתוב נתונים כספיים לפרויקט שטרם נסגר תפעולית (מצב נוכחי: %).', v_status
      using errcode = 'P0001';
  end if;

  return v_status;
end;
$$;

revoke execute on function finance_assert_writable(integer) from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- 2. הצעת דמי-הביטול — שלושת הרכיבים, נגזרים ולא נשמרים (ה28)
-- -----------------------------------------------------------------------------
-- ה28 קבע שנשמר **הסכום הסופי + הערה** בלבד; הפירוק נגזר-מחדש לתצוגה מהקלטים
-- הקפואים (`cancelled_at` · סטטוסי-הלוגיסטיקה · הסולם). לכן זו פונקציה ולא עמודות.
create or replace function finance_cancellation_fee_proposal(p_project_id integer)
returns table (
  compensation_pct    numeric,
  hours_before_event  numeric,
  team_compensation   numeric,
  goods_at_price      numeric,
  goods_at_cost       numeric,
  proposed_fee        numeric,
  planned_hours       numeric,
  compensated_count   integer
)
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_cancelled_at timestamptz; v_cancel_type text;
  v_event_start timestamptz; v_planned_hours numeric;
  v_full_h numeric; v_part_h numeric; v_part_pct numeric;
  v_hours numeric; v_pct numeric;
  v_rate_sum numeric; v_n integer;
  v_goods_price numeric; v_goods_cost numeric;
begin
  select p.cancelled_at, p.cancel_type,
         (p.final_event_date + p.final_start_time) at time zone 'Asia/Jerusalem',
         case when p.final_start_time is null or p.final_end_time is null then null
              else extract(epoch from (p.final_end_time - p.final_start_time)) / 3600.0 end
    into v_cancelled_at, v_cancel_type, v_event_start, v_planned_hours
    from public.projects p where p.project_id = p_project_id;

  select pa.param_value::numeric into v_full_h from public.params pa where pa.param_name = 'שעות_פיצוי_ביטול_מלא';
  select pa.param_value::numeric into v_part_h from public.params pa where pa.param_name = 'שעות_פיצוי_ביטול_חלקי';
  select pa.param_value::numeric into v_part_pct from public.params pa where pa.param_name = 'אחוז_פיצוי_ביטול_חלקי';

  -- 🔴 פרמטר חסר אינו "0%" — הוא היעדר-סולם. אפס כאן היה מוחק פיצוי אמיתי בשקט.
  if v_full_h is null or v_part_h is null or v_part_pct is null then
    raise exception 'לא ניתן לחשב דמי ביטול — חסרים פרמטרי סולם הפיצוי במערכת.'
      using errcode = 'P0001';
  end if;

  v_hours := case when v_cancelled_at is null or v_event_start is null then null
                  else extract(epoch from (v_event_start - v_cancelled_at)) / 3600.0 end;

  -- ה24 + כוח-עליון = 0% תמיד.
  v_pct := case
             when v_cancel_type = 'force_majeure' then 0
             when v_hours is null then null
             when v_hours >= v_part_h then 0
             when v_hours >= v_full_h then v_part_pct
             else 100
           end;

  -- A-7 + R4-F2: רק מי שהייתה **מאושרת-סופית** לפני הביטול. הזמנה שנדחתה אינה
  -- נושאת התחייבות. `released_from_status` נכתב מהביטול ואילך; ביטולי-עבר NULL.
  select coalesce(sum(a.hourly_rate_snapshot), 0), count(*)
    into v_rate_sum, v_n
    from public.assignments a
   where a.project_id = p_project_id
     and (a.released_from_status = 'finally_approved'
          or (a.released_from_status is null and a.assignment_status = 'finally_approved'));

  -- ה23: "מחיר מלא" = closing_unit_price. הלוגיסטיקה נקראת **רק** לבדיקת-"הוזמן" (ה26).
  select coalesce(sum(l.planned_qty * qs.closing_unit_price), 0),
         coalesce(sum(l.planned_qty * qs.closing_unit_cost), 0)
    into v_goods_price, v_goods_cost
    from public.logistics l
    join public.projects p2 on p2.project_id = l.project_id
    join public.quote_services qs on qs.quote_id = p2.quote_id and qs.sku = l.sku
   where l.project_id = p_project_id
     and l.item_status in ('ordered', 'ready');

  return query select
    v_pct,
    v_hours,
    -- שעות-מתוכננות חסרות (T7) ⇒ NULL ולא 0, והמסך אומר "לא ניתן לחשב פיצוי" (A-8).
    case when v_pct is null or v_planned_hours is null then null
         else round(v_pct / 100.0 * v_planned_hours * v_rate_sum, 2) end,
    v_goods_price,
    v_goods_cost,
    case when v_pct is null or v_planned_hours is null then null
         else round(v_pct / 100.0 * v_planned_hours * v_rate_sum, 2) + v_goods_price end,
    v_planned_hours,
    v_n;
end;
$$;

comment on function finance_cancellation_fee_proposal(integer) is
  'מ8 — שלושת רכיבי דמי-הביטול, נגזרים מהקלטים הקפואים (ה23/ה24/ה28). אומתה מול עוגן-היד 3,508.00 של #14.';

revoke execute on function finance_cancellation_fee_proposal(integer) from public, anon, authenticated;
grant execute on function finance_cancellation_fee_proposal(integer) to authenticated;


-- -----------------------------------------------------------------------------
-- 3. הקפאת רווח של פרויקט מבוטל (Q-3) — פנימית, נקראת מרגעי-הפתרון (Q-4)
-- -----------------------------------------------------------------------------
create or replace function finance_freeze_cancelled_profit(p_project_id integer)
returns numeric
language plpgsql
security definer
set search_path to ''
as $$
declare v_fee numeric; v_comp numeric; v_goods_cost numeric; v_profit numeric;
begin
  select pf.cancellation_fee into v_fee
    from public.project_finance pf where pf.project_id = p_project_id;

  select prop.team_compensation, prop.goods_at_cost
    into v_comp, v_goods_cost
    from public.finance_cancellation_fee_proposal(p_project_id) prop;

  -- ויתור = 0 ולא NULL. שעות-מתוכננות חסרות ⇒ הפיצוי NULL, ואז אין רווח לחשב:
  -- מספר שגוי גרוע ממספר חסר (A-8).
  if v_comp is null then
    raise exception 'לא ניתן להקפיא רווח לפרויקט % — חסרות שעות סופיות לחישוב הפיצוי.', p_project_id
      using errcode = 'P0001';
  end if;

  v_profit := coalesce(v_fee, 0) - v_comp - coalesce(v_goods_cost, 0);

  update public.project_finance
     set final_profit = v_profit
   where project_id = p_project_id;

  return v_profit;
end;
$$;

revoke execute on function finance_freeze_cancelled_profit(integer) from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- 4. פעולה ① — החשבונית נשלחה
-- -----------------------------------------------------------------------------
-- כרטיס-P1: "שמור ושלח" ⇒ מייל ללקוח · `invoice_sent` ✓ · חותמת ⇒ מעבר ל"ממתין
-- לתשלום". ⚠️ **הקוד קורא לפונקציה הזו רק אחרי שהמייל הצליח** — חוזה-שלושת-המצבים
-- של מנוע-המייל: כשל/לא-ידוע **אינם** מסמנים "נשלח" (P1: "מייל נכשל — הסימון לא נרשם").
create or replace function record_invoice_sent(p_project_id integer, p_file_url text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare v_status text;
begin
  v_status := public.finance_assert_writable(p_project_id);

  if p_file_url is null or btrim(p_file_url) = '' then
    raise exception 'חסום: יש לבחור קובץ — שליחה בלי חשבונית אינה אפשרית.'
      using errcode = 'P0001';
  end if;

  insert into public.project_finance (project_id, invoice_file_url)
  values (p_project_id, p_file_url)
  on conflict (project_id) do update set invoice_file_url = excluded.invoice_file_url;

  -- 🔴 פרויקט מבוטל **נשאר מבוטל** (T1/P1) — הנוכחות בלשונית היא מצב-הפה, לא סטטוס.
  update public.projects
     set invoice_sent = true,
         invoice_sent_at = now(),
         project_status = case when v_status = 'awaiting_invoice' then 'awaiting_payment'
                               else project_status end
   where project_id = p_project_id;

  return jsonb_build_object('ok', true, 'project_status',
    (select project_status from public.projects where project_id = p_project_id));
end;
$$;

revoke execute on function record_invoice_sent(integer, text) from public, anon, authenticated;
grant execute on function record_invoice_sent(integer, text) to authenticated;


-- -----------------------------------------------------------------------------
-- 5. פעולה ② — התשלום התקבל
-- -----------------------------------------------------------------------------
-- 🔴 **Q-4 חי כאן:** דמי-ביטול שחויבו קופאים ברגע הזה — לא בשמירת-הסכום ולא בארכוב.
create or replace function record_payment(p_project_id integer, p_payment_date date)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare v_status text; v_frozen numeric;
begin
  v_status := public.finance_assert_writable(p_project_id);

  if p_payment_date is null then
    raise exception 'יש להזין תאריך קבלת תשלום.' using errcode = 'P0001';
  end if;
  if p_payment_date > current_date then
    raise exception 'תאריך קבלת התשלום אינו יכול להיות בעתיד.' using errcode = 'P0001';
  end if;

  update public.projects set payment_date = p_payment_date where project_id = p_project_id;

  if v_status = 'cancelled' then
    v_frozen := public.finance_freeze_cancelled_profit(p_project_id);
  end if;

  return jsonb_build_object('ok', true, 'frozen_profit', v_frozen);
end;
$$;

revoke execute on function record_payment(integer, date) from public, anon, authenticated;
grant execute on function record_payment(integer, date) to authenticated;


-- -----------------------------------------------------------------------------
-- 6. פעולה ③ — קליטת המשוב
-- -----------------------------------------------------------------------------
-- ה5: ציון ⇒ `completed` · "לא ענה" ⇒ `no_response`.
-- 🔴 **B-15 — כתיבה על שורה שכבר `completed` מותרת עד הארכוב.** מסלול-הטלפון של P2
-- דורש בדיוק את זה: הדף הציבורי כותב ציון בלי סיבה, והמנהלת מוסיפה את הסיבה
-- אחרי השיחה. סירוב היה **נועל את שער-הארכוב** על ציון נמוך — בלי מוצא.
create or replace function record_feedback(
  p_project_id integer,
  p_score integer default null,
  p_reason text default null,
  p_notes text default null,
  p_mark_no_response boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform public.finance_assert_writable(p_project_id);

  if p_mark_no_response then
    update public.projects
       set feedback_status = 'no_response'
     where project_id = p_project_id;
    return jsonb_build_object('ok', true, 'feedback_status', 'no_response');
  end if;

  if p_score is null or p_score < 1 or p_score > 5 then
    raise exception 'יש לבחור ציון בין 1 ל-5.' using errcode = 'P0001';
  end if;

  -- שער ה-<3 של P2. הסיבה עצמה נאכפת ע"י ה-CHECK החי מול חמש המחרוזות.
  if p_score < 3 and (p_reason is null or btrim(p_reason) = '') then
    raise exception 'ציון נמוך מ-3 מחייב בחירת סיבה מהרשימה לאחר בירור טלפוני.'
      using errcode = 'P0001';
  end if;

  update public.projects
     set feedback_score = p_score,
         negative_feedback_reason = case when p_score < 3 then p_reason else null end,
         feedback_notes = coalesce(p_notes, feedback_notes),
         feedback_status = 'completed'
   where project_id = p_project_id;

  return jsonb_build_object('ok', true, 'feedback_status', 'completed');
end;
$$;

revoke execute on function record_feedback(integer, integer, text, text, boolean) from public, anon, authenticated;
grant execute on function record_feedback(integer, integer, text, text, boolean) to authenticated;


-- -----------------------------------------------------------------------------
-- 7. פעולה ④ — חוב אבוד (B-13, הפעולה החמישית שה22 לא מנתה)
-- -----------------------------------------------------------------------------
-- כרטיס-P3: לקוח שלא שילם היה משאיר את הפרויקט ב"ממתין לתשלום" **לנצח**.
create or replace function record_write_off(p_project_id integer, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare v_status text; v_frozen numeric;
begin
  v_status := public.finance_assert_writable(p_project_id);

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'סגירה ללא תשלום מחייבת ציון סיבה.' using errcode = 'P0001';
  end if;

  insert into public.project_finance (project_id, written_off, written_off_reason)
  values (p_project_id, true, p_reason)
  on conflict (project_id) do update
    set written_off = true, written_off_reason = excluded.written_off_reason;

  -- Q-4: אצל מבוטל זהו רגע-הפתרון ⇒ הקפאה מיידית.
  if v_status = 'cancelled' then
    v_frozen := public.finance_freeze_cancelled_profit(p_project_id);
  end if;

  return jsonb_build_object('ok', true, 'frozen_profit', v_frozen);
end;
$$;

revoke execute on function record_write_off(integer, text) from public, anon, authenticated;
grant execute on function record_write_off(integer, text) to authenticated;


-- -----------------------------------------------------------------------------
-- 8. פתרון דמי-הביטול (ה28 + Q-4)
-- -----------------------------------------------------------------------------
-- שלוש פעולות בשם אחד, כי הן שלוש תשובות לאותה שאלה:
--   'bill'      — נקבע סכום ⇒ נגבה במסלול-P1 (חשבונית→תשלום); הקפאה בתשלום.
--   'waive'     — ויתור מפורש: סכום 0 + הערת-חובה ⇒ **הקפאה מיידית** (הפסד רשום).
--   'write_off' — חוב אבוד ⇒ הקפאה מיידית.
-- 🚫 הסטטוס נשאר `cancelled` תמיד (T1). מכונת-המצבים של מ6 אינה נגעת.
create or replace function resolve_cancellation_fee(
  p_project_id integer,
  p_action text,
  p_amount numeric default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare v_status text; v_frozen numeric;
begin
  v_status := public.finance_assert_writable(p_project_id);

  if v_status <> 'cancelled' then
    raise exception 'דמי ביטול ניתנים לקביעה רק לפרויקט שבוטל.' using errcode = 'P0001';
  end if;
  if p_action not in ('bill', 'waive', 'write_off') then
    raise exception 'פעולה לא מוכרת לפתרון דמי הביטול.' using errcode = 'P0001';
  end if;

  -- ויתור אינו מחיקה שקטה (P1): הוא סכום 0 **עם נימוק**.
  if p_action in ('waive', 'write_off') and (p_note is null or btrim(p_note) = '') then
    raise exception 'ויתור או סגירה ללא תשלום מחייבים ציון סיבה.' using errcode = 'P0001';
  end if;
  if p_action = 'bill' and (p_amount is null or p_amount <= 0) then
    raise exception 'יש להזין סכום דמי ביטול גדול מאפס.' using errcode = 'P0001';
  end if;

  insert into public.project_finance (project_id, cancellation_fee, cancellation_fee_note,
                                      written_off, written_off_reason)
  values (p_project_id,
          case when p_action = 'bill' then p_amount else 0 end,
          p_note,
          p_action = 'write_off',
          case when p_action = 'write_off' then p_note else null end)
  on conflict (project_id) do update
    set cancellation_fee = excluded.cancellation_fee,
        cancellation_fee_note = excluded.cancellation_fee_note,
        written_off = excluded.written_off,
        written_off_reason = coalesce(excluded.written_off_reason, project_finance.written_off_reason);

  -- 🔴 Q-4: 'bill' **אינו** רגע-פתרון — הוא רק קביעת-הסכום. ההקפאה תגיע בתשלום.
  if p_action in ('waive', 'write_off') then
    v_frozen := public.finance_freeze_cancelled_profit(p_project_id);
  end if;

  return jsonb_build_object('ok', true, 'action', p_action, 'frozen_profit', v_frozen);
end;
$$;

revoke execute on function resolve_cancellation_fee(integer, text, numeric, text) from public, anon, authenticated;
grant execute on function resolve_cancellation_fee(integer, text, numeric, text) to authenticated;


-- -----------------------------------------------------------------------------
-- 9. פעולה ⑤ — הארכוב: הרגע הסופי
-- -----------------------------------------------------------------------------
-- טרנזקציה אחת: שער כפול → הקפאת-רווח → `finished` → המתת-הטוקן → חותמת.
create or replace function archive_project(p_project_id integer)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_status text; v_payment date; v_written_off boolean;
  v_feedback text; v_report_url text; v_profit numeric;
begin
  v_status := public.finance_assert_writable(p_project_id);

  -- 🔴 T1 — האילוץ החי דורש דוח-סיכום, ולא "אינו מבוטל". מבוטל אכן נחסם, אבל
  -- דרך התנאי הזה. אוכפים בעצמנו כדי שההודעה תהיה בעברית ולא שגיאת-CHECK גולמית.
  if v_status = 'cancelled' then
    raise exception 'פרויקט שבוטל אינו עובר לארכיון — הרווח שלו נקפא עם פתרון דמי הביטול.'
      using errcode = 'P0001';
  end if;

  select p.payment_date, p.feedback_status, p.summary_report_url
    into v_payment, v_feedback, v_report_url
    from public.projects p where p.project_id = p_project_id;

  select coalesce(pf.written_off, false) into v_written_off
    from public.project_finance pf where pf.project_id = p_project_id;

  -- שער כפול (P3): תשלום **או** חוב-אבוד, **וגם** משוב שנפתר (ה3).
  if v_payment is null and not coalesce(v_written_off, false) then
    raise exception '🔒 חסום: שער-הארכוב דורש גם תשלום וגם משוב-פתור — טרם נרשם תאריך תשלום, והפרויקט לא נסגר כחוב אבוד.'
      using errcode = 'P0001';
  end if;
  if v_feedback not in ('completed', 'no_response') then
    raise exception '🔒 חסום: שער-הארכוב דורש גם תשלום וגם משוב-פתור — המשוב עדיין במצב "%".', v_feedback
      using errcode = 'P0001';
  end if;
  if v_report_url is null then
    raise exception 'לא ניתן לארכב — לפרויקט חסר דוח סיכום מהסגירה התפעולית.'
      using errcode = 'P0001';
  end if;

  select m.gross_profit into v_profit
    from public.finance_project_money(p_project_id) m;

  insert into public.project_finance (project_id, final_profit, archived_at)
  values (p_project_id, v_profit, now())
  on conflict (project_id) do update
    set final_profit = excluded.final_profit, archived_at = excluded.archived_at;

  update public.projects
     set project_status = 'finished',
         feedback_token = null   -- B-6: המתת-הטוקן. הדף יציג "הקישור אינו בתוקף".
   where project_id = p_project_id;

  return jsonb_build_object('ok', true, 'final_profit', v_profit);
end;
$$;

comment on function archive_project(integer) is
  'מ8 P3 — הארכוב: שער כפול, הקפאת רווח, נעילה והמתת טוקן. טרנזקציה אחת.';

revoke execute on function archive_project(integer) from public, anon, authenticated;
grant execute on function archive_project(integer) to authenticated;
