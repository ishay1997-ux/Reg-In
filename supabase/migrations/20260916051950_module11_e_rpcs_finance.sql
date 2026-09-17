-- =============================================================================
-- מודול 11 · מיגרציה E · פזה 2 — ארבע פונקציות-השרת של לשונית "כספים"
-- =============================================================================
-- 🎯 **מה זה:** ארבעה RPC-ים לקריאה בלבד, אחד לכל משטח בנוי בלשונית — מבט-על כספים (מ7) ·
--    רווחיות פרויקטים (מ8) · גיול חובות (מ9, עם קידוח) · צריכת ציוד (מ12).
--    **אין טבלה חדשה, אין עמודה חדשה, אין policy חדשה, אין כתיבה.**
--    כל אחד מחזיר `jsonb` יחיד בחוזה-התשלום של מדריך-המיקרו §2ב C8, ומספרים **גולמיים**
--    (הלקוח מעצב לפי 📐4 דרך `reportsFormat.js`).
--
-- 🔐 **מודל-ההרשאות (הכרעה 2 · מדריך-המיקרו §4.1–4.2):** לשונית נפתחת לפי הרשאת **המודול
--    שבעלים על הדאטה**, ולשונית-הכספים בעליה הוא מודול **'כספים'** ⇒ ארבעתן נפתחות בשער
--    זהה על 'כספים' ב-`edit`/`view`. הפונקציות `security definer` ולכן ה-RLS של הקורא אינו
--    חל בגופן — **השער בשורה הראשונה הוא ההרשאה היחידה שקיימת.** מי שאין לו מקבל `42501`,
--    ולא דוח ריק שנקרא כ"אין חובות" (מדריך-המיקרו §4.3 — דוקטרינת-הכישלון-השקט).
--    ‏`finance_project_money` פנימית ל-`service_role`; היא נקראת כאן כמו ב-
--    `get_dashboard_summary`, כלומר בזכות בעלות-הפונקציה ולא בזכות הקורא.
--
-- 📐 **מה נגזר כאן ומה לא (כלל-ברזל 14):**
--    · **ימי-איחור אינם מוגדרים כאן מחדש.** ההגדרה חיה ב-`deriveDaysOverdue`
--      (`src/lib/projectFinance.js`): איחור מול **מועד-הפירעון** = `invoice_sent_at` +
--      `params.תנאי_תשלום_ימים`, ושלילי נקטע ל-0. התאום ב-JS + חמשת גבולות-הדליים יושבים ב-
--      `src/lib/reportsFinance.js`, **ובדיקותיו הן האורקל שה-SQL כאן נמדד מולו** — לא ההפך.
--    · **סטיית-תקציב אינה מחושבת כאן.** ‏§7.58 קבעה אותה, ו-`finance_project_money`
--      כבר מחזירה `budget_deviation`; כאן רק **היחס** מול עלות-העבודה המתוכננת.
--    · **בסיס-הכמות בציוד הוא `planned_qty`** (הכרעה 5 · §7.22) — "בפועל" הוא עמודת-פער
--      ושאלת-רכש, לא בסיס-חיוב.
--    · **אין רווח תפעולי/נקי** (§7.93). רווח = `coalesce(final_profit, gross_profit)`,
--      ו-📑ב מחייב את מונה-הקפואים לצידו ⇒ `meta.frozen_count`.
--
-- 🧮 **קונבנציות שחוזרות בארבעתן:**
--    · "היום" = `(now() at time zone 'Asia/Jerusalem')::date`, לא `current_date` שהוא UTC.
--    · ‏₪ שלמים: **מעגלים כל שורה ואז מסכמים.** 🔴 נמדד חי 16/09/2026 על 35 החשבוניות
--      הפתוחות — סכימה-ואז-עיגול מחזירה 236,380 ₪, עיגול-פר-שורה 236,382 ₪, **שהוא המספר
--      שבקו-הבסיס.** ‏📐4 מחייב ₪ בלי אגורות בכל מקום, כלומר האריח חייב להיות סכום של מה
--      שהטבלה מציגה. סדר-העיגול כאן הוא הגדרה, לא פרט-מימוש.
--    · מכנה אפס עובר תמיד ב-`nullif(...,0)` — "לא נמדד" ולא "אפס אחוז".
--    · חלון: `p_from`/`p_to` **כוללים את שני קצותיהם** על עמודות-תאריך (`final_event_date`
--      היא `date`), כי כך מנוסחות תוויות-הדפים ("2026 (01/01–10/09)") וכך נמדד קו-הבסיס.
--      חלונות **נגללים** פנימיים (30 יום · 12 חודשים) הם חצי-פתוחים `(from, to]` כדרישת C8.
--    · פרמטר-מערכת חסר נכנס ל-`meta.missing_params` ולעולם אינו נופל לברירת-מחדל שקטה
--      (§7.83 · דפוס `missingDashboardParamsMessage`).
--
-- 🔁 **הפיכוּת:** ‏`drop function public.report_m07_finance_overview(date,date,integer,jsonb)`
--    וכן לשלוש האחרות — ארבע פונקציות חדשות, תוספת בלבד; הקוד הפרוס אינו יודע שהן קיימות.
-- 🧾 **הענקות:** הדפוס של מ4-D/מ7 — שלילה מכולם בשם ואז הענקה ל-`authenticated`; השער בגוף.
-- ✅ **צ'קליסט-העיצוב (`db_roadmap.md §1`):** §7 — 7.22 · 7.58 · 7.83 · 7.93 · 7.95 · 7.97 ·
--    RLS — אין טבלה/policy חדשה · עמודות — אין חדשה · כל מספר-מוצג ⇒ מקור נקוב · Seed — אין ·
--    advisors — צפי: `authenticated_security_definer_function_executable` ×4, כמו כל RPC כאן.
--
-- 🔻 **אימות אחרי ההחלה** (קריאה-בלבד, בהתחזות, positive control קודם):
--   -- (א) מ9 בשורש עם "היום"=10/09/2026 ⇒ 35 · 10-13-8-1-3 · 68,585/87,574/56,839/5,438/17,946
--   --     ⇒ 236,382 ₪ · מעל 60 יום 4 חשבוניות · 23,384 ₪ *(`spec.md` §🔢 — האורקל המחושב-ביד)*.
--   -- (ב) מ8 על 01/01–10/09/2026 ⇒ 236 אירועים · 30 חורגים · 5,280 ₪ · 58.3% · חציון ‎−1.7%.
--   -- (ג) מ12 ⇒ 1,771 שורות · 9 מק"טים · 350,944 ₪ בתקופה · 1,191,808 ₪ כל-הזמנים · 3 ללא-מקור.
--   -- (ד) מ7 ⇒ יתרת-חוב 236,382 ₪ (35) · צפוי-ב-30 65,930 ₪ · שיא-הסדרה 408,021 ₪ (12/2025).
--   -- (ה) מנהלת-גיוס/לוגיסטיקה ⇒ `42501` בארבעתן, ולא jsonb ריק.
--   -- (ו) `select proacl from pg_proc where proname like 'report_m%'` ⇒ בלי `anon=`.
-- =============================================================================

-- =============================================================================
-- ‏① `report_m07_finance_overview` — מבט-על כספים · "מה מצב הכסף?"
-- =============================================================================
-- **סוג:** בקרה (🧭) · **ההחלטה:** האם הכסף שנכנס החודש מספיק, ואם לא — במי לטפל קודם.
-- **ארבעה אריחים · גרף אחד · טבלה** (ת1). כל אריח הוא **דלת לדף** (הכרעה 33) היכן שהדף
-- שאליו הוא מוביל **נבנה**; מ10 (תזרים) ומ13 (שכר) נדחו בהכרעה 30 ⇒ ‏`target` שלהם `null`
-- ולא הפניה למסך שאינו קיים.
-- 🔴 **שני האריחים התחתונים מוצגים על החודש הקלנדרי**, כפי שהמוקאפ המאושר מצייר, כפי
-- ששורת-הכרטיס ③ מגדירה ("01/09–10/09") וכפי שהתווית עצמה אומרת ("החודש") — **ו-📑ב מבקש
-- להחליף את החלון ל-30 יום נגללים.** ‏`cards-finance.md` ⑧7.5 מסמן זאת 🔵 **פתוח להכרעת-ישי**
-- ומציין שההחלפה "דורשת מדידה חדשה" ⇒ **המדידה בוצעה ומוחזרת ב-`meta`**, כדי שההכרעה
-- תיפול על מספרים ולא על תיאור. 🚫 לא הוחלף חלון בלי הכרעה.
create or replace function public.report_m07_finance_overview(
  p_from date default null,
  p_to date default null,
  p_customer_id integer default null,
  p_drill jsonb default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_today        date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to           date;
  v_from         date;
  v_terms        integer;
  v_missing      text[] := array[]::text[];
  v_open_n       integer;
  v_open_sum     numeric;
  v_prev_n       integer;
  v_prev_sum     numeric;
  v_over60_n     integer;
  v_over60_sum   numeric;
  v_exp_n        integer;
  v_exp_sum      numeric;
  v_recv_n       integer;
  v_recv_sum     numeric;
  v_dev_n        integer;
  v_dev_prev_n   integer;
  v_dev_roll_n   integer;
  v_pay_sum      numeric;
  v_pay_shifts   integer;
  v_pay_prev_sum numeric;
  v_pay_roll_sum numeric;
  v_written_n    integer;
  v_written_sum  numeric;
  v_series       jsonb;
  v_series_min   numeric;
  v_rows         jsonb;
  v_oldest_days  integer;
  v_oldest_name  text;
  v_top_name     text;
  v_top_sum      numeric;
begin
  -- הכרעה 2: הלשונית נפתחת לפי המודול שבעלים על הדאטה. השער היחיד שקיים בגוף `definer`.
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  v_to   := coalesce(p_to, v_today);
  v_from := coalesce(p_from, date_trunc('year', v_to)::date);

  select pa.param_value::integer into v_terms
    from public.params pa where pa.param_name = 'תנאי_תשלום_ימים';
  if v_terms is null then
    v_missing := array['תנאי_תשלום_ימים'];
  end if;

  -- ── האוכלוסייה: חשבוניות שנשלחו, טרם שולמו, ולא נמחקו כחוב-אבוד ──────────────
  -- ‏`p_customer_id` מצמצם את כל הדף (מסנן-לקוח גלובלי); `null` = כל הלקוחות.

  with open_inv as (
    select p.project_id,
           c.company_name,
           (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date as sent_d,
           round(m.revenue) as amt
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      left join public.customers c on c.customer_id = p.customer_id
      cross join lateral public.finance_project_money(p.project_id) m
     where p.invoice_sent = true
       and p.invoice_sent_at is not null
       and p.payment_date is null
       and coalesce(pf.written_off, false) = false
       and (p_customer_id is null or p.customer_id = p_customer_id)
  ), scored as (
    select o.*,
           case when v_terms is null then null
                else greatest(v_to - (o.sent_d + v_terms), 0) end as dov
      from open_inv o
  )
  select count(*)::integer,
         coalesce(sum(amt), 0),
         count(*) filter (where dov > 60)::integer,
         coalesce(sum(amt) filter (where dov > 60), 0),
         max(dov),
         (array_agg(company_name order by dov desc nulls last))[1],
         (array_agg(company_name order by amt desc nulls last) filter (where dov > 60))[1],
         max(amt) filter (where dov > 60),
         coalesce(jsonb_agg(jsonb_build_object(
           'project_id', project_id, 'customer_name', company_name,
           'sent_date', sent_d, 'due_date', sent_d + v_terms,
           'amount', amt, 'days_overdue', dov,
           'drill_key', jsonb_build_object('project_id', project_id)
         ) order by dov desc nulls last, amt desc) filter (where dov is not null), '[]'::jsonb)
    into v_open_n, v_open_sum, v_over60_n, v_over60_sum,
         v_oldest_days, v_oldest_name, v_top_name, v_top_sum, v_rows
    from scored;

  -- ‏📑ב: הטבלה מציגה את **4 הישנות ביותר בלי פאג'ר** + קישור "כל N →" לדוח הגיול.
  v_rows := (select coalesce(jsonb_agg(e), '[]'::jsonb)
               from (select e from jsonb_array_elements(v_rows) e limit 4) s);

  -- ── יתרת-החוב לפני חודש (📐1 — תקופה-קודמת אמיתית, לא "—") ────────────────────
  select count(*)::integer, coalesce(sum(round(m.revenue)), 0)
    into v_prev_n, v_prev_sum
    from public.projects p
    left join public.project_finance pf on pf.project_id = p.project_id
    cross join lateral public.finance_project_money(p.project_id) m
   where p.invoice_sent = true
     and p.invoice_sent_at is not null
     and coalesce(pf.written_off, false) = false
     and (p_customer_id is null or p.customer_id = p_customer_id)
     and (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date <= v_to - 30
     and (p.payment_date is null or p.payment_date > v_to - 30);

  -- ── "צפוי להיכנס ב-30 יום" = מועד חוזי + חציון-האיחור של אותו לקוח (📑#7) ──────
  -- ‏≥3 חשבוניות ששולמו ⇒ החציון האישי · אחרת חציון-הסגמנט · אחרת חציון-החברה.
  -- ⚠️ **הערכה, לא התחייבות** — מוצהר על האריח (הכרטיס ③, אחרי `m11-contractual-vs-expected`).
  with paid as (
    select p.customer_id, c.customer_type,
           (p.payment_date - ((p.invoice_sent_at at time zone 'Asia/Jerusalem')::date + v_terms)) as late_days
      from public.projects p
      join public.customers c on c.customer_id = p.customer_id
     where p.invoice_sent = true and p.invoice_sent_at is not null and p.payment_date is not null
  ), by_cust as (
    select customer_id, count(*) as n,
           percentile_cont(0.5) within group (order by late_days) as m from paid group by 1
  ), by_seg as (
    select customer_type, percentile_cont(0.5) within group (order by late_days) as m from paid group by 1
  ), by_all as (
    select percentile_cont(0.5) within group (order by late_days) as m from paid
  ), open_inv as (
    select p.project_id, p.customer_id, c.customer_type,
           ((p.invoice_sent_at at time zone 'Asia/Jerusalem')::date + v_terms) as due_d,
           round(m.revenue) as amt
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      left join public.customers c on c.customer_id = p.customer_id
      cross join lateral public.finance_project_money(p.project_id) m
     where p.invoice_sent = true and p.invoice_sent_at is not null and p.payment_date is null
       and coalesce(pf.written_off, false) = false
       and (p_customer_id is null or p.customer_id = p_customer_id)
  )
  select count(*)::integer, coalesce(sum(amt), 0)
    into v_exp_n, v_exp_sum
    from (
      select o.amt,
             (o.due_d + (coalesce(case when bc.n >= 3 then bc.m end, bs.m, ba.m))::integer) as expected_d
        from open_inv o
        left join by_cust bc on bc.customer_id = o.customer_id
        left join by_seg  bs on bs.customer_type = o.customer_type
        cross join by_all ba
    ) x
   where v_terms is not null and expected_d > v_to and expected_d <= v_to + 30;

  -- חצי-ההשוואה של אותו אריח: מה **נכנס בפועל** ב-30 הימים האחרונים. השוואה רטרוספקטיבית
  -- ולא אותה נוסחה — ולכן היא מוצהרת ככזו בתווית (הכרטיס ③).
  select count(*)::integer, coalesce(sum(round(m.revenue)), 0)
    into v_recv_n, v_recv_sum
    from public.projects p
    cross join lateral public.finance_project_money(p.project_id) m
   where p.payment_date > v_to - 30 and p.payment_date <= v_to
     and (p_customer_id is null or p.customer_id = p_customer_id);

  -- ── שני האריחים "החודש" — ר' הכותרת: קלנדרי מוצג, נגלל נמדד ומוחזר ב-`meta` ────
  with money as (
    select p.project_id, p.final_event_date, m.budget_deviation, m.planned_hours,
           (select coalesce(sum(a.hourly_rate_snapshot), 0) from public.assignments a
             where a.project_id = p.project_id and a.assignment_status = 'finally_approved') as rate_sum
      from public.projects p
      cross join lateral public.finance_project_money(p.project_id) m
     where p.project_status in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')
       and (p_customer_id is null or p.customer_id = p_customer_id)
  ), ratio as (
    select final_event_date,
           budget_deviation / nullif(planned_hours * rate_sum, 0) as r from money
  )
  select count(*) filter (where final_event_date >= date_trunc('month', v_to)::date
                            and final_event_date <= v_to and r > 0.15)::integer,
         count(*) filter (where final_event_date >= (date_trunc('month', v_to) - interval '1 month')::date
                            and final_event_date < date_trunc('month', v_to)::date and r > 0.15)::integer,
         count(*) filter (where final_event_date > v_to - 30 and final_event_date <= v_to and r > 0.15)::integer
    into v_dev_n, v_dev_prev_n, v_dev_roll_n
    from ratio;

  select coalesce(sum(a.actual_hours * a.hourly_rate_snapshot)
                    filter (where a.event_date >= date_trunc('month', v_to)::date and a.event_date <= v_to), 0),
         count(*) filter (where a.event_date >= date_trunc('month', v_to)::date and a.event_date <= v_to)::integer,
         coalesce(sum(a.actual_hours * a.hourly_rate_snapshot)
                    filter (where a.event_date >= (date_trunc('month', v_to) - interval '1 month')::date
                              and a.event_date < date_trunc('month', v_to)::date), 0),
         coalesce(sum(a.actual_hours * a.hourly_rate_snapshot)
                    filter (where a.event_date > v_to - 30 and a.event_date <= v_to), 0)
    into v_pay_sum, v_pay_shifts, v_pay_prev_sum, v_pay_roll_sum
    from public.assignments a
    join public.projects p on p.project_id = a.project_id
   where a.actual_hours > 0
     and (p_customer_id is null or p.customer_id = p_customer_id);

  -- ── הגרף: יתרת-החוב הפתוחה בסוף כל חודש, 12 נקודות אחורה (⏳ב1) ───────────────
  -- הנקודה האחרונה היא **"נכון להיום"** ולא סוף-חודש, ומסומנת `is_today` כדי שהעמודה
  -- תצויר חלולה-ומקווקוות (📐20 — מקטע שאינו שווה-אורך מצהיר על עצמו).
  with inv as (
    select (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date as sent_d,
           p.payment_date, round(m.revenue) as amt
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      cross join lateral public.finance_project_money(p.project_id) m
     where p.invoice_sent = true and p.invoice_sent_at is not null
       and coalesce(pf.written_off, false) = false
       and (p_customer_id is null or p.customer_id = p_customer_id)
  ), pts as (
    select (date_trunc('month', v_to) - ((11 - n) || ' month')::interval + interval '1 month'
              - interval '1 day')::date as asof, false as is_today
      from generate_series(0, 10) n
    union all select v_to, true
  )
  select jsonb_agg(jsonb_build_object(
           'month', to_char(asof, 'MM/YYYY'), 'asof', asof, 'is_today', is_today,
           'open_amount', coalesce((select sum(amt) from inv
                                     where inv.sent_d <= pts.asof
                                       and (inv.payment_date is null or inv.payment_date > pts.asof)), 0),
           'open_count', (select count(*) from inv
                           where inv.sent_d <= pts.asof
                             and (inv.payment_date is null or inv.payment_date > pts.asof))
         ) order by asof), min(coalesce((select sum(amt) from inv
                                          where inv.sent_d <= pts.asof
                                            and (inv.payment_date is null or inv.payment_date > pts.asof)), 0))
    into v_series, v_series_min
    from pts;

  -- חובות-אבודים: **שורת-הערה מתחת לטבלה, ב-₪** ומחוץ לשורת-האריחים (📑ב#6).
  select count(*)::integer, coalesce(sum(round(m.revenue)), 0)
    into v_written_n, v_written_sum
    from public.projects p
    join public.project_finance pf on pf.project_id = p.project_id
    cross join lateral public.finance_project_money(p.project_id) m
   where p.invoice_sent = true and p.payment_date is null and pf.written_off
     and (p_customer_id is null or p.customer_id = p_customer_id);

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_open_n,
      'label', 'אוכלוסייה: חשבוניות שנשלחו וטרם שולמו · הוצאו: חובות אבודים ('
               || v_written_n || ') ופרויקטים שטרם חויבו · n=' || v_open_n
               || ' חשבוניות. שני האריחים התחתונים נשענים על אוכלוסיית דוחות-הכסף: אירועים שהתקיימו '
               || 'ויצאה להם חשבונית — פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום.',
      'excluded', jsonb_build_object('חוב אבוד', v_written_n)),
    'window', jsonb_build_object('from', v_from, 'to', v_to,
      'label', to_char(v_from, 'DD/MM') || '–' || to_char(v_to, 'DD/MM/YYYY')),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'open_debt', 'label', 'יתרת-חוב פתוחה',
        'value', v_open_sum, 'format', 'money', 'count', v_open_n,
        'window', 'נכון ל-' || to_char(v_to, 'DD/MM') || ' · אינו מושפע ממסנן התקופה',
        'compare', jsonb_build_object('value', v_prev_sum, 'label', 'לפני חודש', 'count', v_prev_n,
          'direction', case when v_open_sum > v_prev_sum then 'up'
                            when v_open_sum < v_prev_sum then 'down' else 'flat' end),
        'target', jsonb_build_object('tab', 'כספים', 'report', 'report_m09_aging', 'drill', null)),
      jsonb_build_object('key', 'expected_30d', 'label', 'צפוי להיכנס ב-30 יום',
        'value', v_exp_sum, 'format', 'money', 'count', v_exp_n,
        'window', to_char(v_to, 'DD/MM') || '–' || to_char(v_to + 30, 'DD/MM'),
        'compare', jsonb_build_object('value', v_recv_sum, 'count', v_recv_n,
          'label', 'שנכנסו בפועל ב-30 הימים האחרונים',
          'direction', case when v_exp_sum > v_recv_sum then 'up'
                            when v_exp_sum < v_recv_sum then 'down' else 'flat' end),
        -- ‏`null` ולא הפניה: דוח "תזרים צפוי" (מ10) נדחה בהכרעה 30 ואינו נבנה.
        'target', null),
      jsonb_build_object('key', 'over_threshold_month', 'label', 'פרויקטים שחרגו מהתקציב החודש',
        'value', v_dev_n, 'format', 'int',
        'window', to_char(date_trunc('month', v_to), 'DD/MM') || '–' || to_char(v_to, 'DD/MM'),
        'compare', jsonb_build_object('value', v_dev_prev_n, 'label', 'בחודש הקודם',
          'direction', case when v_dev_n > v_dev_prev_n then 'up'
                            when v_dev_n < v_dev_prev_n then 'down' else 'flat' end),
        'target', jsonb_build_object('tab', 'כספים', 'report', 'report_m08_profitability', 'drill', null)),
      jsonb_build_object('key', 'hostess_pay_month', 'label', 'שכר דיילות החודש',
        'value', v_pay_sum, 'format', 'money', 'count', v_pay_shifts,
        'window', to_char(date_trunc('month', v_to), 'DD/MM') || '–' || to_char(v_to, 'DD/MM'),
        'compare', jsonb_build_object('value', v_pay_prev_sum, 'label', 'בחודש הקודם',
          'direction', case when v_pay_sum > v_pay_prev_sum then 'up'
                            when v_pay_sum < v_pay_prev_sum then 'down' else 'flat' end),
        -- דוח "שכר דיילות לפי חודש" (מ13) נדחה בהכרעה 30 ⇒ אין דלת.
        'target', null)),
    'chart', jsonb_build_object(
      'type', 'bar', 'title', 'יתרת-החוב הפתוחה בסוף כל חודש',
      'series', jsonb_build_array(jsonb_build_object('key', 'open_amount', 'label', 'יתרת-חוב פתוחה')),
      'data', coalesce(v_series, '[]'::jsonb), 'xKey', 'month',
      'domain', null, 'refLines', '[]'::jsonb, 'unit', '₪'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'project_id', 'label', 'פרויקט', 'format', 'int', 'align', 'start'),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'sent_date', 'label', 'נשלחה', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'amount', 'label', 'סכום', 'format', 'money', 'align', 'end'),
      jsonb_build_object('key', 'days_overdue', 'label', 'ימי איחור', 'format', 'days', 'align', 'end')),
    'rows', v_rows,
    -- 📐23: פעולה קודמת לעובדה, והפועל נגזר מסוג-הדוח. מחושב — לא משפט קפוא שיתיישן.
    'so_what', case when v_over60_n > 0 then
        'לגבות ' || round(v_over60_sum) || ' ₪ שממתינים מעל 60 יום ב-' || v_over60_n
        || ' חשבוניות — הוותיקה כבר ' || coalesce(v_oldest_days, 0) || ' יום, אצל '
        || coalesce(v_oldest_name, '—') || '; יתרת-החוב כולה עומדת על ' || round(v_open_sum) || ' ₪.'
      else 'אין חוב מעל 60 יום; יתרת-החוב הפתוחה עומדת על ' || round(v_open_sum) || ' ₪.' end,
    'definitions', 'יתרת-חוב פתוחה = חשבונית שנשלחה, טרם שולמה ולא נמחקה כחוב-אבוד · '
      || '"צפוי" = מועד חוזי (שליחה + ' || coalesce(v_terms::text, '—')
      || ' ימי תנאי-תשלום) ועוד חציון-האיחור של אותו לקוח — הערכה, לא התחייבות · '
      || 'יתרת-חוב בסוף חודש = אותה הגדרה, נכון לערב האחרון של אותו חודש; העמודה האחרונה היא נכון להיום.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(), 'missing_params', to_jsonb(v_missing), 'frozen_count', null,
      'notes', jsonb_build_array(
        'חובות אבודים: ' || v_written_n || ' חשבוניות · ' || round(v_written_sum)
          || ' ₪ — מוחרגים מהיתרה ומכל המדרגים.',
        'העמודה האחרונה בגרף היא נכון ל-' || to_char(v_to, 'DD/MM') || ' ואינה סוף-חודש.'),
      'open_items', jsonb_build_object(
        'card_8_7_5', jsonb_build_object(
          'question', 'חלון שני האריחים התחתונים: החודש הקלנדרי (המוקאפ · הכרטיס ③ · התווית) או 30 יום נגללים (§📑ב)?',
          'calendar_month', jsonb_build_object('over_threshold', v_dev_n, 'hostess_pay', v_pay_sum),
          'rolling_30', jsonb_build_object('over_threshold', v_dev_roll_n, 'hostess_pay', v_pay_roll_sum))),
      'series_min', v_series_min,
      'top_overdue_customer', jsonb_build_object('name', v_top_name, 'amount', v_top_sum),
      'open_invoice_count', v_open_n,
      'run', null)
  );
end;
$function$;

comment on function public.report_m07_finance_overview(date, date, integer, jsonb) is
  'מודול 11 · מבט-על כספים (מ7). אוכלוסייה: חשבוניות שנשלחו וטרם שולמו · הוצאו: חובות אבודים ופרויקטים שטרם חויבו. שני האריחים התחתונים נשענים על אוכלוסיית דוחות-הכסף (הכרעה 36): פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום. קריאה בלבד, מגודר על מודול כספים.';

revoke execute on function public.report_m07_finance_overview(date, date, integer, jsonb) from public, anon, authenticated;
grant execute on function public.report_m07_finance_overview(date, date, integer, jsonb) to authenticated;


-- =============================================================================
-- ‏② `report_m08_profitability` — רווחיות פרויקטים · "אילו פרויקטים דלפו מהתקציב?"
-- =============================================================================
-- **סוג:** בקרה (🧭) · **ההחלטה:** אילו פרויקטים לפתוח ולבדוק.
-- 🔴 **הדף אינו מציג פרויקטים פעילים** — נמדד שחתך "חריגה-בזמן-אמת" מחזיר 0 מתוך 63, כי
-- ‏`budget_deviation` על פרויקט פעיל שווה תמיד ל-‎−(planned_hours×Σrate). בוטל בהכרעה 24.
-- 🔴 **`budget_deviation` אינה מחושבת כאן** (§7.58 · §7.22) — `finance_project_money`
-- מחזירה אותה, וכאן רק היחס מול עלות-העבודה המתוכננת, **חתום**: "דלף" הוא חריגה כלפי-מעלה
-- בלבד, וחיסכון בפרויקט אחד אינו מקזז חריגה באחר.
-- **רצפת-מהותיות (📑ב#5):** פחות מ-4 שעות מתוכננות **או** פחות מ-1,000 ₪ עלות-עבודה
-- מתוכננת ⇒ מחוץ לדירוג, עם מונה גלוי — אחרת פרויקט של 500 ₪ עומד ראשון עם 300%.
create or replace function public.report_m08_profitability(
  p_from date default null,
  p_to date default null,
  p_customer_id integer default null,
  p_drill jsonb default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_today       date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to          date;
  v_from        date;
  v_prev_from   date;
  v_prev_to     date;
  v_threshold   numeric;
  v_missing     text[] := array[]::text[];
  v_n           integer;
  v_over        integer;
  v_over_sum    numeric;
  v_margin      numeric;
  v_median      numeric;
  v_frozen      integer;
  v_floor_n     integer;
  v_prev_n      integer;
  v_prev_over   integer;
  v_prev_sum    numeric;
  v_prev_margin numeric;
  v_chart       jsonb;
  v_rows        jsonb;
  v_top_id      integer;
  v_top_name    text;
  v_top_pct     numeric;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  v_to        := coalesce(p_to, v_today);
  v_from      := coalesce(p_from, date_trunc('year', v_to)::date);
  v_prev_from := (v_from - interval '1 year')::date;
  v_prev_to   := (v_to - interval '1 year')::date;

  select pa.param_value::numeric into v_threshold
    from public.params pa where pa.param_name = 'סף_סטיית_תקציב_אחוז';
  if v_threshold is null then
    v_missing := array['סף_סטיית_תקציב_אחוז'];
  end if;


  with money as (
    select p.project_id, p.final_event_date, c.company_name, p.feedback_score,
           pf.final_profit, m.gross_profit, m.revenue, m.budget_deviation,
           m.planned_hours, m.finally_approved_count,
           (select coalesce(sum(a.hourly_rate_snapshot), 0) from public.assignments a
             where a.project_id = p.project_id and a.assignment_status = 'finally_approved') as rate_sum,
           (select coalesce(sum(a.actual_hours), 0) from public.assignments a
             where a.project_id = p.project_id) as actual_team_hours
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      left join public.customers c on c.customer_id = p.customer_id
      cross join lateral public.finance_project_money(p.project_id) m
     -- הכרעה 36 — אוכלוסיית-הכסף: אירועים שהתקיימו ויצאה להם חשבונית.
     where p.project_status in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')
       and (p_customer_id is null or p.customer_id = p_customer_id)
  ), calc as (
    select mo.*,
           mo.planned_hours * mo.rate_sum as planned_labor,
           mo.planned_hours * mo.finally_approved_count as planned_team_hours,
           mo.budget_deviation / nullif(mo.planned_hours * mo.rate_sum, 0) as r
      from money mo
  ), win as (
    select * from calc where final_event_date >= v_from and final_event_date <= v_to
  ), prev as (
    select * from calc where final_event_date >= v_prev_from and final_event_date <= v_prev_to
  )
  select (select count(*) from win),
         (select count(*) from win where r > v_threshold / 100.0),
         (select coalesce(sum(budget_deviation), 0) from win where r > v_threshold / 100.0),
         (select sum(coalesce(final_profit, gross_profit)) / nullif(sum(revenue), 0) from win),
         (select percentile_cont(0.5) within group (order by r) from win),
         (select count(*) from win where final_profit is not null),
         (select count(*) from win where planned_hours < 4 or planned_labor < 1000),
         (select count(*) from prev),
         (select count(*) from prev where r > v_threshold / 100.0),
         (select coalesce(sum(budget_deviation), 0) from prev where r > v_threshold / 100.0),
         (select sum(coalesce(final_profit, gross_profit)) / nullif(sum(revenue), 0) from prev),
         -- הגרף: 15 הסטיות הגדולות ב-**₪** (📊 · 📑ב#5 — לא באחוזים), חתומות, ציר מאפס.
         (select coalesce(jsonb_agg(jsonb_build_object(
            'project_id', project_id, 'customer_name', company_name,
            'deviation', round(budget_deviation)) order by abs(budget_deviation) desc), '[]'::jsonb)
            from (select * from win order by abs(budget_deviation) desc limit 15) t),
         -- הטבלה: החורגים, **ממוינים לפי ₪-חריגה** (📑ב#5 נועל את המיון), מהותיים בראש.
         (select coalesce(jsonb_agg(jsonb_build_object(
            'project_id', project_id, 'customer_name', company_name,
            'revenue', round(revenue), 'profit', round(coalesce(final_profit, gross_profit)),
            'planned_team_hours', round(planned_team_hours, 1),
            'actual_team_hours', round(actual_team_hours, 1),
            'deviation', round(budget_deviation), 'deviation_pct', round(100 * r, 1),
            'feedback_score', feedback_score,
            'below_materiality', (planned_hours < 4 or planned_labor < 1000),
            'drill_key', jsonb_build_object('project_id', project_id))
            order by (planned_hours < 4 or planned_labor < 1000), budget_deviation desc), '[]'::jsonb)
            from win where r > v_threshold / 100.0),
         -- 🔴 כותרת-הפעולה נבחרת **מהשורות שבדירוג בלבד**. זו בדיוק הסיבה שרצפת-המהותיות
         --    קיימת (📑ב#5): נמדד חי 16/09/2026 שפרויקט 12 מציג **300%** סטייה על 1.5
         --    שעות-צוות ו-203 ₪ — הוא היה עומד ראשון בשורת-"אז מה" ושולח את מנהלת-הכספים
         --    לפתוח את הפרויקט הקטן ביותר במערכת.
         (select project_id from win where r > v_threshold / 100.0
            and not (planned_hours < 4 or planned_labor < 1000) order by r desc limit 1),
         (select company_name from win where r > v_threshold / 100.0
            and not (planned_hours < 4 or planned_labor < 1000) order by r desc limit 1),
         (select round(100 * r, 1) from win where r > v_threshold / 100.0
            and not (planned_hours < 4 or planned_labor < 1000) order by r desc limit 1)
    into v_n, v_over, v_over_sum, v_margin, v_median, v_frozen, v_floor_n,
         v_prev_n, v_prev_over, v_prev_sum, v_prev_margin, v_chart, v_rows,
         v_top_id, v_top_name, v_top_pct;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_n,
      'label', 'אוכלוסייה: אירועים שהתקיימו ויצאה להם חשבונית — פרויקט הסתיים · ממתין לסגירה · '
               || 'ממתין לחשבונית · ממתין לתשלום, אירוע ב-' || to_char(v_from, 'DD/MM/YYYY') || '–'
               || to_char(v_to, 'DD/MM/YYYY') || ' · הוצאו: פרויקטים פעילים ומבוטלים · n=' || v_n
               || '. הדף אינו מציג פרויקטים פעילים — לפני שהאירוע התקיים השעות-בפועל תמיד קטנות '
               || 'מהמתוכננות, ולכן אין בו חריגה למדוד.',
      'excluded', jsonb_build_object('מתחת לרצפת-המהותיות', v_floor_n)),
    'window', jsonb_build_object('from', v_from, 'to', v_to,
      'label', to_char(v_to, 'YYYY') || ' (' || to_char(v_from, 'DD/MM') || '–' || to_char(v_to, 'DD/MM') || ')'),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'projects_in_period', 'label', 'פרויקטים בתקופה',
        'value', v_n, 'format', 'int', 'window', 'התקופה שנבחרה',
        'compare', jsonb_build_object('value', v_prev_n, 'label', 'אשתקד',
          'direction', case when v_n > v_prev_n then 'up' when v_n < v_prev_n then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object('key', 'over_threshold', 'label', 'פרויקטים שחרגו מהתקציב',
        'value', v_over, 'format', 'int', 'window', 'התקופה שנבחרה',
        'share_pct', round(100.0 * v_over / nullif(v_n, 0), 1),
        'compare', jsonb_build_object('value', v_prev_over, 'label', 'אשתקד',
          'direction', case when v_over > v_prev_over then 'up' when v_over < v_prev_over then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object('key', 'sum_over_threshold', 'label', 'סך החריגה מעל הסף',
        'value', round(v_over_sum), 'format', 'money', 'window', 'התקופה שנבחרה',
        'compare', jsonb_build_object('value', round(v_prev_sum), 'label', 'אשתקד',
          'direction', case when v_over_sum > v_prev_sum then 'up' when v_over_sum < v_prev_sum then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח בתקופה',
        'value', round(100 * v_margin, 1), 'format', 'percent', 'window', 'התקופה שנבחרה',
        'compare', jsonb_build_object('value', round(100 * v_prev_margin, 1), 'label', 'אשתקד',
          'direction', case when v_margin > v_prev_margin then 'up' when v_margin < v_prev_margin then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object('key', 'median_deviation', 'label', 'חציון-סטייה',
        'value', round(100 * v_median, 1), 'format', 'percent', 'window', 'התקופה שנבחרה',
        'compare', null, 'target', null)),
    'chart', jsonb_build_object(
      'type', 'bar', 'title', '15 הסטיות הגדולות ב-₪',
      'series', jsonb_build_array(jsonb_build_object('key', 'deviation', 'label', 'סטיית-תקציב')),
      'data', v_chart, 'xKey', 'project_id', 'domain', null,
      'refLines', jsonb_build_array(jsonb_build_object('axis', 'y', 'value', 0, 'label', 'ללא סטייה')),
      'unit', '₪'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'project_id', 'label', 'פרויקט', 'format', 'int', 'align', 'start'),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'format', 'money', 'align', 'end'),
      jsonb_build_object('key', 'profit', 'label', 'רווח', 'format', 'money', 'align', 'end'),
      jsonb_build_object('key', 'planned_team_hours', 'label', 'שעות-צוות מתוכננות', 'format', 'ratio', 'align', 'end'),
      jsonb_build_object('key', 'actual_team_hours', 'label', 'שעות-צוות בפועל', 'format', 'ratio', 'align', 'end'),
      jsonb_build_object('key', 'deviation', 'label', 'סטייה ₪', 'format', 'money', 'align', 'end'),
      jsonb_build_object('key', 'deviation_pct', 'label', 'סטייה %', 'format', 'percent', 'align', 'end'),
      jsonb_build_object('key', 'feedback_score', 'label', 'ציון-משוב', 'format', 'int', 'align', 'end')),
    'rows', v_rows,
    'so_what', case when v_over > 0 and v_top_id is null then
        'חרגו ' || v_over || ' פרויקטים ב-' || round(v_over_sum)
        || ' ₪, אך כולם מתחת לרצפת-המהותיות — אין פרויקט שדורש פתיחה השבוע.'
      when v_over > 0 then
        'לפתוח את פרויקט ' || v_top_id || ' — ' || coalesce(v_top_name, '—')
        || ', החריגה הגדולה ביותר בתקופה: ' || v_top_pct || '% מעל התכנון; בסך-הכול חרגו '
        || v_over || ' פרויקטים ב-' || round(v_over_sum) || ' ₪, מול ' || v_prev_over
        || ' ו-' || round(v_prev_sum) || ' ₪ אשתקד.'
      else 'אין פרויקטים שחרגו מהתקציב בתקופה שנבחרה.' end,
    'definitions', 'סטיית-תקציב = צד-העבודה בלבד, ב-₪ · עלות-עבודה מתוכננת = שעות-האירוע × Σ תעריפי '
      || 'המשובצות-סופית · "דלף" = חריגה כלפי-מעלה בלבד · שעות-צוות מתוכננות = משך-האירוע × מספר '
      || 'המשובצות-סופית, ולכן הן באותו קנה-מידה של שעות-הצוות בפועל · רווח = הרווח הסופי היכן שקפא, '
      || 'אחרת רווח גולמי מחושב.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(), 'missing_params', to_jsonb(v_missing),
      -- 📑ב: `coalesce(final_profit, gross_profit)` מערבב מדד קפוא ומדד חי ⇒ מונה-הקפואים חובה.
      'frozen_count', v_frozen,
      'notes', jsonb_build_array(
        v_floor_n || ' פרויקטים מתחת לרצפת-המהותיות (פחות מ-4 שעות מתוכננות או פחות מ-1,000 ₪ '
          || 'עלות-עבודה מתוכננת) אינם בדירוג.',
        'רווח: ' || v_frozen || ' מתוך ' || v_n || ' בתקופה נושאים רווח סופי קפוא; בשאר מוצג הרווח הגולמי המחושב.'),
      'threshold_pct', v_threshold,
      'run', null)
  );
end;
$function$;

comment on function public.report_m08_profitability(date, date, integer, jsonb) is
  'מודול 11 · רווחיות פרויקטים (מ8). אוכלוסייה: אירועים שהתקיימו ויצאה להם חשבונית — פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום, שתאריך האירוע שלהם בתקופה · הוצאו: פרויקטים פעילים ומבוטלים. סטיית-התקציב נקראת מ-finance_project_money ואינה מחושבת כאן. קריאה בלבד, מגודר על מודול כספים.';

revoke execute on function public.report_m08_profitability(date, date, integer, jsonb) from public, anon, authenticated;
grant execute on function public.report_m08_profitability(date, date, integer, jsonb) to authenticated;


-- =============================================================================
-- ‏③ `report_m09_aging` — גיול חובות · "את מי לגבות השבוע?" 🔻 דוח-דריל (📐13)
-- =============================================================================
-- **סוג:** תומך-החלטה (🧭) · **ההחלטה:** את מי מרימים אליו טלפון השבוע.
--
-- 🔴 **זהו שער-הקבלה של המודול כולו.** ‏`spec.md` §🔢 מתעד **חמש** מדידות שגויות של אותו
-- דלי ביום אחד, כולן מאותה מחלקה — ספירת ימים **מיום-השליחה** במקום **ממועד-הפירעון**,
-- ואז דלי "שוטף" לא קיים והחשבונית נזקפת ל-1–30. **ההגדרה הנעולה:**
-- ימי-איחור = היום − (`invoice_sent_at` + `params.תנאי_תשלום_ימים`), שלילי נקטע ל-0 ⇒ "שוטף".
-- **המספרים שהפונקציה חייבת להחזיר על "היום"=10/09/2026:** ‏35 חשבוניות ·
-- שוטף 10 · 1–30 13 · 31–60 8 · 61–90 1 · 90+ 3 · 68,585 / 87,574 / 56,839 / 5,438 / 17,946
-- ⇒ **236,382 ₪** · מעל 60 יום **4 חשבוניות · 23,384 ₪**.
--
-- 🔻 **הקידוח (📐13):** מדרג ← לקוח ← חשבונית, **בפרמטר `p_drill` ולא בפונקציה שנייה**
-- (הכרעת צעד 1.0). האריחים, שורת-"אז מה", כותרת-הטבלה והפאג'ר **יורדים עם הרמה** — הם תמיד
-- מדברים על הרמה הפתוחה ולא על השורש.
-- ⚠️ **"שוטף" הוא מדרג לכל דבר בקידוח, אך אינו עמודה בגרף** (הכרעת-ישי 07/09): הגרף שואל
-- את מי לגבות השבוע, וחשבונית שטרם הגיע מועד תשלומה אינה חוב באיחור. ⇒ הגרף מצהיר
-- אוכלוסייה **צרה** מזו של הדף (25 מול 35), ושלוש ההצהרות מוחזרות כדי שייכתבו על המסך (📐2).
create or replace function public.report_m09_aging(
  p_from date default null,
  p_to date default null,
  p_customer_id integer default null,
  p_drill jsonb default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_today       date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to          date;
  v_from        date;
  v_terms       integer;
  v_missing     text[] := array[]::text[];
  v_bucket      text := nullif(p_drill ->> 'bucket', '');
  v_cust        bigint := (p_drill ->> 'customer_id')::bigint;
  v_level       integer := 0;
  v_bucket_name text;
  v_total_n     integer;
  v_total_sum   numeric;
  v_prev_n      integer;
  v_prev_sum    numeric;
  v_over60_n    integer;
  v_over60_sum  numeric;
  v_over60_cust integer;
  v_cur_n       integer;
  v_cur_sum     numeric;
  v_cur_prev    numeric;
  v_cur_prev_n  integer;
  v_p90_n       integer;
  v_p90_sum     numeric;
  v_median_pay  numeric;
  v_paid_n      integer;
  v_oldest_days integer;
  v_oldest_name text;
  v_oldest_sent date;
  v_written_n   integer;
  v_written_sum numeric;
  v_buckets     jsonb;
  v_chart       jsonb;
  v_series      jsonb;
  v_rows        jsonb;
  v_columns     jsonb;
  v_tiles       jsonb;
  v_lvl_n       integer;
  v_lvl_sum     numeric;
  v_lvl_cust    integer;
  v_lvl_oldest  integer;
  v_top_name    text;
  v_top_sum     numeric;
  v_so_what     text;
  v_cust_name   text;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  v_to   := coalesce(p_to, v_today);
  v_from := coalesce(p_from, date_trunc('year', v_to)::date);

  select pa.param_value::integer into v_terms
    from public.params pa where pa.param_name = 'תנאי_תשלום_ימים';
  if v_terms is null then
    v_missing := array['תנאי_תשלום_ימים'];
  end if;

  if v_bucket is not null then v_level := 1; end if;
  if v_bucket is not null and v_cust is not null then v_level := 2; end if;
  -- ✏️ 07/09: שם-הרמה. הנוסח האחיד ('מדרג ' || label || ' יום') ייצר על "שוטף" את
  --    "מדרג שוטף יום" — עברית שבורה בפירורים, בכותרות ובשורת-"אז מה", בשלוש הרמות.
  v_bucket_name := case v_bucket
                     when 'current' then 'שוטף'
                     when 'd1_30'  then 'מדרג 1–30 יום'
                     when 'd31_60' then 'מדרג 31–60 יום'
                     when 'd61_90' then 'מדרג 61–90 יום'
                     when 'd90p'   then 'מדרג 90+'
                   end;
  if v_bucket is not null and v_bucket_name is null then
    -- ערך-רמה לא-מוכר בכתובת-הדף ⇒ חזרה לשורש, בלי מסך-שגיאה (הכרטיס ⑦).
    v_bucket := null; v_cust := null; v_level := 0;
  end if;


  with open_inv as (
    select p.project_id, p.customer_id, c.company_name, c.customer_type,
           (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date as sent_d,
           round(m.revenue) as amt,
           (select ct.contact_name from public.customer_contacts ct
             where ct.customer_id = p.customer_id and ct.is_primary order by ct.contact_id limit 1) as contact_name
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      left join public.customers c on c.customer_id = p.customer_id
      cross join lateral public.finance_project_money(p.project_id) m
     where p.invoice_sent = true
       and p.invoice_sent_at is not null
       and p.payment_date is null
       and coalesce(pf.written_off, false) = false
       and (p_customer_id is null or p.customer_id = p_customer_id)
  ), scored as (
    select o.*,
           o.sent_d + v_terms as due_d,
           case when v_terms is null then null else greatest(v_to - (o.sent_d + v_terms), 0) end as dov
      from open_inv o
  ), tagged as (
    select s.*,
           case when s.dov is null then null
                when s.dov = 0 then 'current'
                when s.dov <= 30 then 'd1_30'
                when s.dov <= 60 then 'd31_60'
                when s.dov <= 90 then 'd61_90'
                else 'd90p' end as bucket_key
      from scored s
  )
  select (select count(*) from tagged),
         (select coalesce(sum(amt), 0) from tagged),
         (select count(*) from tagged where bucket_key in ('d61_90', 'd90p')),
         (select coalesce(sum(amt), 0) from tagged where bucket_key in ('d61_90', 'd90p')),
         (select count(distinct customer_id) from tagged where bucket_key in ('d61_90', 'd90p')),
         (select count(*) from tagged where bucket_key = 'current'),
         (select coalesce(sum(amt), 0) from tagged where bucket_key = 'current'),
         (select count(*) from tagged where bucket_key = 'd90p'),
         (select coalesce(sum(amt), 0) from tagged where bucket_key = 'd90p'),
         (select max(dov) from tagged),
         (select company_name from tagged order by dov desc nulls last limit 1),
         (select sent_d from tagged order by dov desc nulls last limit 1),
         (select company_name from tagged where bucket_key in ('d61_90', 'd90p') order by amt desc limit 1),
         (select amt from tagged where bucket_key in ('d61_90', 'd90p') order by amt desc limit 1),
         -- חמשת הדליים בסדר-הדליים הטבעי (📐7 — לא לפי ערך).
         (select jsonb_agg(jsonb_build_object('key', b.k, 'label', b.l, 'n', t.n, 'amount', t.s) order by b.o)
            from (values ('current', 'שוטף', 1), ('d1_30', '1–30', 2), ('d31_60', '31–60', 3),
                         ('d61_90', '61–90', 4), ('d90p', '90+', 5)) as b(k, l, o)
            cross join lateral (select count(*) as n, coalesce(sum(amt), 0) as s
                                  from tagged where bucket_key = b.k) t),
         -- הגרף: ארבעת דליי-האיחור בלבד, מוערמים לפי סוג-לקוח. "שוטף" **אינו** עמודה כאן.
         -- הערימה נפרשת כמפתחות ברמת-השורה (ולא כאובייקט מקונן), כי כך Recharts קורא סדרות.
         (select coalesce(jsonb_agg(
                   jsonb_build_object('bucket', b.l, 'bucket_key', b.k,
                     'total', coalesce(t.s, 0), 'n', coalesce(t.n, 0))
                   || coalesce(t.types, '{}'::jsonb) order by b.o), '[]'::jsonb)
            from (values ('d1_30', '1–30', 2), ('d31_60', '31–60', 3),
                         ('d61_90', '61–90', 4), ('d90p', '90+', 5)) as b(k, l, o)
            left join lateral (
              -- 🔴 ‏`n` ו-`total` נספרים על **החשבוניות**, לא על שכבות-הערימה. תת-שאילתה
              --    מקובצת-לפי-סוג מחזירה שורה לסוג ⇒ `count(*)` עליה היה מחזיר 3 במקום 13.
              select (select count(*) from tagged where bucket_key = b.k) as n,
                     (select coalesce(sum(amt), 0) from tagged where bucket_key = b.k) as s,
                     (select jsonb_object_agg(coalesce(customer_type, 'unclassified'), by_type)
                        from (select customer_type, sum(amt) as by_type
                                from tagged where bucket_key = b.k group by customer_type) g) as types
              ) t on true),
         -- הסדרות = סוגי-הלקוח שקיימים בפועל בדליי-האיחור (📐19: גוון אחד = משמעות אחת).
         -- 🔴 **המפתח הוא ערך-ה-enum, והתווית העברית אינה נכתבת כאן.** ‏`CUSTOMER_TYPE_LABELS`
         --    (`src/lib/customers.js`) הוא מקור-האמת היחיד לתוויות-סוג-הלקוח, בדיוק כפי ש-
         --    ‏`spec.md` §1.1 מורה על תוויות-הסטטוס: **נלקחות מהקוד, לא מתורגמות מחדש.**
         --    ארבע מחרוזות עברית כאן היו מקור שני שאיש לא יעדכן. ⇒ ‏`chart.label_source`
         --    אומר למסך במפורש דרך מה לפענח, כדי שלא ידפיס `private_company`.
         (select coalesce(jsonb_agg(jsonb_build_object('key', ct, 'label', ct) order by ct), '[]'::jsonb)
            from (select distinct coalesce(customer_type, 'unclassified') as ct
                    from tagged where bucket_key is not null and bucket_key <> 'current') d),
         case
           when v_level = 0 then
             (select coalesce(jsonb_agg(jsonb_build_object(
                'project_id', project_id, 'customer_name', company_name, 'owner', contact_name,
                'sent_date', sent_d, 'due_date', due_d, 'amount', amt,
                'days_overdue', dov, 'bucket', bucket_key,
                'drill_key', jsonb_build_object('project_id', project_id)
              ) order by dov desc nulls last, amt desc), '[]'::jsonb) from tagged)
           when v_level = 1 then
             (select coalesce(jsonb_agg(g.t order by (g.t ->> 'amount')::numeric desc), '[]'::jsonb)
                from (select jsonb_build_object(
                        'customer_id', customer_id, 'customer_name', company_name,
                        'owner', max(contact_name), 'invoices', count(*),
                        'amount', sum(amt), 'days_overdue', max(dov),
                        'drill_key', jsonb_build_object('bucket', v_bucket, 'customer_id', customer_id)) as t
                        from tagged where bucket_key = v_bucket
                       group by customer_id, company_name) g)
           else
             (select coalesce(jsonb_agg(jsonb_build_object(
                'project_id', project_id, 'customer_name', company_name, 'owner', contact_name,
                'sent_date', sent_d, 'due_date', due_d, 'amount', amt, 'days_overdue', dov,
                'drill_key', jsonb_build_object('project_id', project_id)
              ) order by dov desc nulls last), '[]'::jsonb)
                from tagged where bucket_key = v_bucket and customer_id = v_cust)
         end,
         (select count(*) from tagged where v_level > 0 and bucket_key = v_bucket
            and (v_level = 1 or customer_id = v_cust)),
         (select coalesce(sum(amt), 0) from tagged where v_level > 0 and bucket_key = v_bucket
            and (v_level = 1 or customer_id = v_cust)),
         (select count(distinct customer_id) from tagged where v_level > 0 and bucket_key = v_bucket),
         (select max(dov) from tagged where v_level > 0 and bucket_key = v_bucket
            and (v_level = 1 or customer_id = v_cust)),
         (select company_name from tagged where v_level = 2 and customer_id = v_cust limit 1)
    into v_total_n, v_total_sum, v_over60_n, v_over60_sum, v_over60_cust,
         v_cur_n, v_cur_sum, v_p90_n, v_p90_sum,
         v_oldest_days, v_oldest_name, v_oldest_sent, v_top_name, v_top_sum,
         v_buckets, v_chart, v_series, v_rows,
         v_lvl_n, v_lvl_sum, v_lvl_cust, v_lvl_oldest, v_cust_name;

  -- יתרת-החוב וה"שוטף" לפני חודש — חצי-ההשוואה של 📐1, מחושב ולא מוצהר כ-"—".
  select count(*)::integer, coalesce(sum(round(m.revenue)), 0),
         count(*) filter (where v_terms is not null
           and (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date + v_terms >= v_to - 30)::integer,
         coalesce(sum(round(m.revenue)) filter (where v_terms is not null
           and (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date + v_terms >= v_to - 30), 0)
    into v_prev_n, v_prev_sum, v_cur_prev_n, v_cur_prev
    from public.projects p
    left join public.project_finance pf on pf.project_id = p.project_id
    cross join lateral public.finance_project_money(p.project_id) m
   where p.invoice_sent = true and p.invoice_sent_at is not null
     and coalesce(pf.written_off, false) = false
     and (p_customer_id is null or p.customer_id = p_customer_id)
     and (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date <= v_to - 30
     and (p.payment_date is null or p.payment_date > v_to - 30);

  -- "ימים לתשלום (חציון)" — **אינו DSO**, ואינו מגיב למסנן-התקופה (📐3 · ח8-6).
  select count(*)::integer,
         percentile_cont(0.5) within group (order by (p.payment_date - (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date))
    into v_paid_n, v_median_pay
    from public.projects p
   where p.invoice_sent = true and p.invoice_sent_at is not null and p.payment_date is not null
     and (p_customer_id is null or p.customer_id = p_customer_id);

  select count(*)::integer, coalesce(sum(round(m.revenue)), 0)
    into v_written_n, v_written_sum
    from public.projects p
    join public.project_finance pf on pf.project_id = p.project_id
    cross join lateral public.finance_project_money(p.project_id) m
   where p.invoice_sent = true and p.payment_date is null and pf.written_off
     and (p_customer_id is null or p.customer_id = p_customer_id);

  -- ── האריחים, שורת-"אז מה" והעמודות — יורדים עם הרמה (📐13 ②) ────────────────
  if v_level = 0 then
    v_tiles := jsonb_build_array(
      jsonb_build_object('key', 'open_debt', 'label', 'יתרת-חוב פתוחה', 'value', v_total_sum,
        'format', 'money', 'count', v_total_n,
        'window', 'נכון ל-' || to_char(v_to, 'DD/MM') || ' · אינו מושפע ממסנן התקופה',
        'compare', jsonb_build_object('value', v_prev_sum, 'count', v_prev_n, 'label', 'לפני חודש',
          'direction', case when v_total_sum > v_prev_sum then 'up'
                            when v_total_sum < v_prev_sum then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object('key', 'over_60', 'label', 'מעל 60 יום', 'value', v_over60_sum,
        'format', 'money', 'count', v_over60_n, 'customers', v_over60_cust,
        'window', 'נכון ל-' || to_char(v_to, 'DD/MM'), 'compare', null,
        'target', jsonb_build_object('tab', 'כספים', 'report', 'report_m09_aging',
          'drill', jsonb_build_object('bucket', 'd90p'))),
      jsonb_build_object('key', 'bucket_90p', 'label', 'מדרג 90+', 'value', v_p90_sum,
        'format', 'money', 'count', v_p90_n, 'window', 'נכון ל-' || to_char(v_to, 'DD/MM'),
        'compare', null,
        'target', jsonb_build_object('tab', 'כספים', 'report', 'report_m09_aging',
          'drill', jsonb_build_object('bucket', 'd90p'))),
      jsonb_build_object('key', 'median_days_to_pay', 'label', 'ימים לתשלום (חציון)',
        'value', v_median_pay, 'format', 'days', 'count', v_paid_n,
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה', 'compare', null, 'target', null));
    v_columns := jsonb_build_array(
      jsonb_build_object('key', 'project_id', 'label', 'פרויקט', 'format', 'int', 'align', 'start'),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'sent_date', 'label', 'נשלחה', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'due_date', 'label', 'מועד-פירעון חוזי', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'amount', 'label', 'סכום', 'format', 'money', 'align', 'end'),
      jsonb_build_object('key', 'days_overdue', 'label', 'ימי איחור', 'format', 'days', 'align', 'end'),
      jsonb_build_object('key', 'bucket', 'label', 'מדרג', 'format', 'text', 'align', 'start'));
    v_so_what := case when v_over60_n > 0 then
        'לגבות ' || round(v_over60_sum) || ' ₪ מ-' || v_over60_cust
        || ' לקוחות — הכסף שממתין מעל 60 יום; הגדול שבהם ' || coalesce(v_top_name, '—')
        || ', ' || round(coalesce(v_top_sum, 0)) || ' ₪.'
      else 'אין חוב מעל 60 יום — כל החוב הפתוח בתוך התנאים או באיחור קצר.' end;
  else
    v_tiles := jsonb_build_array(
      jsonb_build_object('key', 'bucket_amount', 'label', 'חוב ב' || v_bucket_name,
        'value', v_lvl_sum, 'format', 'money', 'count', v_lvl_n, 'customers', v_lvl_cust,
        'window', 'נכון ל-' || to_char(v_to, 'DD/MM') || ' · אינו מושפע ממסנן התקופה',
        'compare', null, 'target', null),
      jsonb_build_object('key', 'share_of_open', 'label', 'חלק מסך-החוב הפתוח',
        'value', round(100.0 * v_lvl_sum / nullif(v_total_sum, 0), 1), 'format', 'percent',
        'window', 'נכון ל-' || to_char(v_to, 'DD/MM'), 'compare', null, 'target', null),
      jsonb_build_object('key', 'oldest_invoice', 'label', 'החשבונית הישנה ביותר',
        'value', v_lvl_oldest, 'format', 'days', 'window', 'נכון ל-' || to_char(v_to, 'DD/MM'),
        'compare', null, 'target', null),
      jsonb_build_object('key', 'median_days_to_pay', 'label', 'ימים לתשלום (חציון)',
        'value', v_median_pay, 'format', 'days', 'count', v_paid_n,
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה', 'compare', null, 'target', null));
    v_columns := case when v_level = 1 then jsonb_build_array(
        jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start'),
        jsonb_build_object('key', 'invoices', 'label', 'חשבוניות', 'format', 'int', 'align', 'end'),
        jsonb_build_object('key', 'amount', 'label', 'סכום', 'format', 'money', 'align', 'end'),
        jsonb_build_object('key', 'days_overdue', 'label', 'ימי איחור (הוותיקה)', 'format', 'days', 'align', 'end'))
      else jsonb_build_array(
        jsonb_build_object('key', 'project_id', 'label', 'פרויקט', 'format', 'int', 'align', 'start'),
        jsonb_build_object('key', 'sent_date', 'label', 'נשלחה', 'format', 'text', 'align', 'start'),
        jsonb_build_object('key', 'due_date', 'label', 'מועד-פירעון חוזי', 'format', 'text', 'align', 'start'),
        jsonb_build_object('key', 'amount', 'label', 'סכום', 'format', 'money', 'align', 'end'),
        jsonb_build_object('key', 'days_overdue', 'label', 'ימי איחור', 'format', 'days', 'align', 'end'))
      end;
    v_so_what := 'לגבות ' || round(v_lvl_sum) || ' ₪ ב' || v_bucket_name || ' — ' || v_lvl_n
      || ' חשבוניות אצל ' || v_lvl_cust || ' לקוחות; הוותיקה ממתינה כבר '
      || coalesce(v_lvl_oldest, 0) || ' ימים.';
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_total_n,
      'label', 'אוכלוסייה: חשבוניות שנשלחו, טרם שולמו ולא נמחקו כחוב-אבוד · הוצאו: חוב אבוד ('
               || v_written_n || ') ופרויקטים שטרם חויבו · n=' || v_total_n
               || ' · זהו צילום-רגע ולא סיכום-תקופה — אינו מושפע ממסנן התקופה. ולגרף שלמטה '
               || 'אוכלוסייה צרה יותר: הוא מציג חוב באיחור בלבד — ארבעת דליי-האיחור, '
               || (v_total_n - v_cur_n) || ' חשבוניות. "שוטף" (' || v_cur_n || ' חשבוניות · '
               || round(v_cur_sum) || ' ₪) הוצא מהגרף לאריח שלצידו, כי טרם הגיע מועד תשלומן — '
               || 'הן אינן חוב באיחור. האריחים והטבלה ממשיכים לכסות את כל ' || v_total_n || '.',
      'excluded', jsonb_build_object('חוב אבוד', v_written_n)),
    'window', jsonb_build_object('from', v_from, 'to', v_to, 'label', 'כל הזמנים · צילום-רגע'),
    'tiles', v_tiles,
    'chart', jsonb_build_object(
      'type', 'stackedBar', 'title', 'חוב באיחור לפי מדרג-גיול וסוג-לקוח',
      'series', coalesce(v_series, '[]'::jsonb), 'data', coalesce(v_chart, '[]'::jsonb),
      'xKey', 'bucket', 'domain', null, 'refLines', '[]'::jsonb, 'unit', '₪',
      -- מפתחות-הסדרה הם ערכי-ה-enum; התווית העברית מגיעה מהקוד ולא מהמסד (ר' ההערה בגוף).
      'label_source', 'CUSTOMER_TYPE_LABELS'),
    'columns', v_columns,
    'rows', coalesce(v_rows, '[]'::jsonb),
    'so_what', v_so_what,
    'definitions', 'מדרג-גיול נמדד מול מועד-הפירעון (יום השליחה + ' || coalesce(v_terms::text, '—')
      || ' ימי תנאי-תשלום), לא מול יום השליחה · "שוטף" = טרם הגיע מועד-הפירעון, לא "שולם" · '
      || '"ימים לתשלום (חציון)" = חציון (תאריך-תשלום − תאריך-חשבונית) על חשבוניות ששולמו, כל הזמנים, '
      || 'ואינו DSO · "חוב אבוד" מוחרג לגמרי מהיתרה ומכל המדרגים.',
    'drill', jsonb_build_object(
      'level', v_level,
      'levels', jsonb_build_array('מדרג', 'לקוח', 'חשבונית'),
      'crumbs', case v_level
        when 0 then jsonb_build_array(jsonb_build_object('label', 'גיול חובות', 'drill', null))
        when 1 then jsonb_build_array(jsonb_build_object('label', 'גיול חובות', 'drill', null),
                                      jsonb_build_object('label', v_bucket_name, 'drill', p_drill))
        else jsonb_build_array(jsonb_build_object('label', 'גיול חובות', 'drill', null),
                               jsonb_build_object('label', v_bucket_name,
                                 'drill', jsonb_build_object('bucket', v_bucket)),
                               jsonb_build_object('label', coalesce(v_cust_name, '—'), 'drill', p_drill))
        end,
      'buckets', coalesce(v_buckets, '[]'::jsonb),
      'echo', p_drill),
    'meta', jsonb_build_object(
      'measured_at', now(), 'missing_params', to_jsonb(v_missing), 'frozen_count', null,
      'notes', jsonb_build_array(
        'חובות אבודים: ' || v_written_n || ' חשבוניות · ' || round(v_written_sum)
          || ' ₪ — מוחרגים מהיתרה ומכל המדרגים.',
        'החשבונית הישנה ביותר: ' || coalesce(v_oldest_days, 0) || ' ימי איחור · '
          || coalesce(v_oldest_name, '—') || ' · נשלחה ' || coalesce(to_char(v_oldest_sent, 'DD/MM/YYYY'), '—') || '.'),
      -- 📑ב#6: מדרג עם 0 שורות **אינו לחיץ**; המסך זקוק ל-`n` פר-דלי כדי לדעת זאת.
      'current_tile', jsonb_build_object('label', 'שוטף — עוד לא באיחור', 'value', v_cur_sum,
        'count', v_cur_n, 'compare_value', v_cur_prev, 'compare_count', v_cur_prev_n,
        'drill', jsonb_build_object('bucket', 'current')),
      'overdue_only', jsonb_build_object('n', v_total_n - v_cur_n, 'amount', v_total_sum - v_cur_sum),
      'run', null)
  );
end;
$function$;

comment on function public.report_m09_aging(date, date, integer, jsonb) is
  'מודול 11 · גיול חובות (מ9), דוח-דריל. אוכלוסייה: חשבוניות שנשלחו, טרם שולמו ולא נמחקו כחוב-אבוד · הוצאו: חוב אבוד ופרויקטים שטרם חויבו · צילום-רגע שאינו מושפע ממסנן התקופה. ימי-איחור נמדדים מול מועד-הפירעון (invoice_sent_at + תנאי_תשלום_ימים) ולא מול יום השליחה, ושלילי נקטע לאפס = שוטף. קריאה בלבד, מגודר על מודול כספים.';

revoke execute on function public.report_m09_aging(date, date, integer, jsonb) from public, anon, authenticated;
grant execute on function public.report_m09_aging(date, date, integer, jsonb) to authenticated;


-- =============================================================================
-- ‏④ `report_m12_equipment` — צריכת ציוד · "כמה ציוד נצרך וכמה להזמין?"
-- =============================================================================
-- **סוג:** תומך-החלטה (🧭 · הכרעה 24 · ח5 הרחיבה מ"מה נצרך" ל"כמה להזמין").
-- 🔴 **בסיס-הכמות הוא `planned_qty` — המוזמן** (הכרעה 5 · §7.22), ו"הגיע בפועל" הוא
-- **עמודת-פער ושאלת-רכש**, לא בסיס-חיוב. הנימוק נמדד: `actual_qty` מסומן
-- `actual_qty_autofilled` ברוב-מוחלט של השורות, כלומר הועתק מהמתוכנן ואיש לא מדד ⇒ דוח
-- על "בפועל" היה מציג חיסכון שרובו העתקה. ‏**אריח-הפער נושא הצהרת-אוכלוסייה מפורשת**
-- (*"נמדד על N שורות מתוך M"*), **מחושבת חי** — מספר קפוא כאן היה מתיישן ומשקר.
-- **האריחים ב-₪ ולא בכמות** (📑ב#11): סכימת-כמויות חוצת-יחידות היא סכום חסר-משמעות —
-- יחידת-שירות אחת עולה כמו מאות תגים. הכמות נשארת פר-`sku` בטבלה.
-- **㉗ — שורה בלי מקור-עלות:** ‏`apply_scope_change` מכניסה שורת-לוגיסטיקה **לפני** ששורת
-- שינוי-התכולה קיימת ⇒ `project_change_id` נשאר `NULL` לצמיתות, ואין `update` שמשלים אותו.
-- 🚫 **לא למלא אחורה, לא לנחש עלות, לא להסתיר את השורה** — היא נספרת במונה גלוי, **עם ₪**
-- (3 שורות יכולות להיות 40 ₪ או 40,000 ₪), והמחיר מוערך לפי ממוצע-המוצר ומוצהר ככזה.
create or replace function public.report_m12_equipment(
  p_from date default null,
  p_to date default null,
  p_customer_id integer default null,
  p_drill jsonb default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_today        date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to           date;
  v_from         date;
  v_prev_from    date;
  v_prev_to      date;
  v_total_rows   integer;
  v_future_rows  integer;
  v_sku_n        integer;
  v_cost_window  numeric;
  v_rows_window  integer;
  v_cost_all     numeric;
  v_planned_w    bigint;
  v_actual_w     bigint;
  v_prev_planned bigint;
  v_prev_actual  bigint;
  v_prev_cost    numeric;
  v_nosrc_n      integer;
  v_nosrc_sum    numeric;
  v_measured_n   integer;
  v_chart_cost   jsonb;
  v_chart_gap    jsonb;
  v_rows         jsonb;
  v_order_rows   jsonb;
  v_nosrc_rows   jsonb;
  v_top_order    text;
  v_top_qty      bigint;
  v_top_events   integer;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  v_to        := coalesce(p_to, v_today);
  v_from      := coalesce(p_from, date_trunc('year', v_to)::date);
  v_prev_from := (v_from - interval '1 year')::date;
  v_prev_to   := (v_to - interval '1 year')::date;


  with lines as (
    select l.project_id, l.sku, pr.item_name, pr.category,
           l.planned_qty, l.actual_qty, l.actual_qty_autofilled,
           l.quote_service_line_id, l.project_change_id,
           qs.closing_unit_cost, pc.unit_cost_snapshot,
           p.final_event_date, p.project_status, p.customer_id
      from public.logistics l
      join public.projects p on p.project_id = l.project_id
      left join public.quote_services qs on qs.line_id = l.quote_service_line_id
      left join public.project_changes pc on pc.change_id = l.project_change_id
      left join public.products pr on pr.sku = l.sku
     where (p_customer_id is null or p.customer_id = p_customer_id)
  ), priced as (
    -- מסלול-העלות: הצעה ⇐ `closing_unit_cost`; שינוי-תכולה ⇐ `unit_cost_snapshot`;
    -- בלי שניהם ⇒ **אין מחיר**, והשורה נכנסת למונה ㉗ (R4 · ה17) ולא לעלות.
    select ln.*, coalesce(ln.closing_unit_cost, ln.unit_cost_snapshot) as unit_cost from lines ln
  ), sku_unit as (
    -- מחיר-יחידה מוערך לשורות ㉗: ממוצע-המוצר, מוצהר על המסך כ"מחיר מוערך".
    select sku, sum(planned_qty * unit_cost) / nullif(sum(planned_qty) filter (where unit_cost is not null), 0) as est
      from priced group by sku
  )
  select (select count(*) from priced),
         (select count(*) from priced where final_event_date > v_to),
         (select count(distinct sku) from priced),
         (select coalesce(sum(round(planned_qty * unit_cost)), 0) from priced
            where final_event_date >= v_from and final_event_date <= v_to),
         (select count(*) from priced where final_event_date >= v_from and final_event_date <= v_to),
         (select coalesce(sum(round(planned_qty * unit_cost)), 0) from priced),
         (select coalesce(sum(planned_qty), 0) from priced
            where final_event_date >= v_from and final_event_date <= v_to),
         (select coalesce(sum(actual_qty), 0) from priced
            where final_event_date >= v_from and final_event_date <= v_to),
         (select coalesce(sum(planned_qty), 0) from priced
            where final_event_date >= v_prev_from and final_event_date <= v_prev_to),
         (select coalesce(sum(actual_qty), 0) from priced
            where final_event_date >= v_prev_from and final_event_date <= v_prev_to),
         (select coalesce(sum(round(planned_qty * unit_cost)), 0) from priced
            where final_event_date >= v_prev_from and final_event_date <= v_prev_to),
         (select count(*) from priced where quote_service_line_id is null and project_change_id is null),
         (select coalesce(sum(round(pc2.planned_qty * su.est)), 0)
            from priced pc2 join sku_unit su on su.sku = pc2.sku
           where pc2.quote_service_line_id is null and pc2.project_change_id is null),
         -- ⚠️ "בפועל" נמדד באמת רק בשורות שאינן מילוי-אוטומטי. המספר הזה **חייב** להופיע
         --    לצד אריח-הפער, אחרת הפער נקרא כחיסכון שנמדד.
         (select count(*) from priced where not actual_qty_autofilled),
         -- גרף א' — עלות פר-מוצר, כל המק"טים, ממוין לפי המדד שהוא מציג (📐7).
         (select coalesce(jsonb_agg(t order by (t ->> 'cost')::numeric desc), '[]'::jsonb) from (
            select jsonb_build_object('sku', sku, 'item_name', coalesce(item_name, sku),
                     'cost', coalesce(sum(round(planned_qty * unit_cost)), 0)) as t
              from priced group by sku, item_name) s),
         -- גרף ב' — הוזמן מול הגיע, **בלי יחידות-השירות** (📑ב#11: 118 מול 58,490 ⇒ קו-אפס).
         (select coalesce(jsonb_agg(t order by (t ->> 'ordered')::numeric desc), '[]'::jsonb) from (
            select jsonb_build_object('sku', sku, 'item_name', coalesce(item_name, sku),
                     'ordered', sum(planned_qty), 'arrived', sum(actual_qty)) as t
              -- `products.category` הוא ההבחנה, לא רשימת-מק"טים קשיחה: `01WEB` הוא `site`
              -- (יחידת-`פרויקט`), ושמונת התגים והשרוכים הם `product` (יחידת-`יחידה`).
              from priced where coalesce(category, '') = 'product'
              group by sku, item_name) s),
         -- הטבלה הראשית: פר-מוצר, כולל **עמודת "עלות מוזמנת (₪)"** (⏳13, הוכרע 15/09).
         (select coalesce(jsonb_agg(t order by (t ->> 'ordered_cost')::numeric desc), '[]'::jsonb) from (
            select jsonb_build_object('sku', sku, 'item_name', coalesce(item_name, sku),
                     'ordered', sum(planned_qty), 'arrived', sum(actual_qty),
                     'gap_units', sum(planned_qty) - sum(actual_qty),
                     'gap_pct', round(100.0 * (sum(planned_qty) - sum(actual_qty))
                                        / nullif(sum(planned_qty), 0), 1),
                     'ordered_cost', coalesce(sum(round(planned_qty * unit_cost)), 0),
                     'drill_key', jsonb_build_object('sku', sku)) as t
              from priced group by sku, item_name) s),
         -- טבלת-ההחלטה: כמה להזמין ל-30 הימים הקרובים. **מבוטלים מוחרגים** — שורה שכללה
         -- אירוע מבוטל ניפחה בעבר את הכמות, וזו הטבלה שממנה יוצאת הזמנת-רכש בפועל.
         (select coalesce(jsonb_agg(t order by (t ->> 'qty')::numeric desc), '[]'::jsonb) from (
            select jsonb_build_object('sku', sku, 'item_name', coalesce(item_name, sku),
                     'qty', sum(planned_qty), 'events', count(distinct project_id),
                     'drill_key', jsonb_build_object('sku', sku, 'upcoming', true)) as t
              from priced
             where final_event_date > v_to and final_event_date <= v_to + 30
               and project_status <> 'cancelled'
             group by sku, item_name) s),
         (select coalesce(jsonb_agg(jsonb_build_object(
            'project_id', pc3.project_id, 'sku', pc3.sku,
            'item_name', coalesce(pc3.item_name, pc3.sku),
            'planned_qty', pc3.planned_qty, 'actual_qty', pc3.actual_qty,
            'estimated_cost', round(pc3.planned_qty * su.est),
            'drill_key', jsonb_build_object('project_id', pc3.project_id))), '[]'::jsonb)
            from priced pc3 join sku_unit su on su.sku = pc3.sku
           where pc3.quote_service_line_id is null and pc3.project_change_id is null),
         (select coalesce(item_name, sku) from priced
           where final_event_date > v_to and final_event_date <= v_to + 30 and project_status <> 'cancelled'
           group by sku, item_name order by sum(planned_qty) desc limit 1),
         (select sum(planned_qty) from priced
           where final_event_date > v_to and final_event_date <= v_to + 30 and project_status <> 'cancelled'
           group by sku order by sum(planned_qty) desc limit 1),
         (select count(distinct project_id)::integer from priced
           where final_event_date > v_to and final_event_date <= v_to + 30 and project_status <> 'cancelled'
           group by sku order by sum(planned_qty) desc limit 1)
    into v_total_rows, v_future_rows, v_sku_n, v_cost_window, v_rows_window, v_cost_all,
         v_planned_w, v_actual_w, v_prev_planned, v_prev_actual, v_prev_cost,
         v_nosrc_n, v_nosrc_sum, v_measured_n,
         v_chart_cost, v_chart_gap, v_rows, v_order_rows, v_nosrc_rows,
         v_top_order, v_top_qty, v_top_events;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_total_rows,
      'label', 'אוכלוסייה: כל ' || v_total_rows || ' שורות הלוגיסטיקה, כלל-הזמנים, כולל פרויקטים '
               || 'מבוטלים · הוצאו: אין · n=' || v_total_rows || ', מתוכן ' || v_future_rows
               || ' שייכות לאירועים שטרם התקיימו. בלוק ההזמנה למטה חותך לאירועים שטרם התקיימו ('
               || to_char(v_to, 'DD/MM') || '–' || to_char(v_to + 30, 'DD/MM') || ').',
      'excluded', jsonb_build_object()),
    'window', jsonb_build_object('from', v_from, 'to', v_to,
      'label', to_char(v_to, 'YYYY') || ' (' || to_char(v_from, 'DD/MM') || '–' || to_char(v_to, 'DD/MM') || ')'),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'cost_window', 'label', 'עלות ציוד בתקופה',
        'value', v_cost_window, 'format', 'money', 'count', v_rows_window,
        'window', 'התקופה שנבחרה',
        'compare', jsonb_build_object('value', v_prev_cost, 'label', 'אשתקד',
          'direction', case when v_cost_window > v_prev_cost then 'up'
                            when v_cost_window < v_prev_cost then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object('key', 'gap_pct', 'label', 'פער הוזמן מול הגיע',
        'value', round(100.0 * (v_planned_w - v_actual_w) / nullif(v_planned_w, 0), 1),
        'format', 'percent', 'window', 'התקופה שנבחרה',
        'compare', jsonb_build_object(
          'value', round(100.0 * (v_prev_planned - v_prev_actual) / nullif(v_prev_planned, 0), 1),
          'label', 'אשתקד',
          'direction', case when (v_planned_w - v_actual_w) * nullif(v_prev_planned, 0)
                               > (v_prev_planned - v_prev_actual) * nullif(v_planned_w, 0) then 'up'
                            else 'down' end),
        'target', null),
      jsonb_build_object('key', 'cost_all_time', 'label', 'עלות ציוד — כל הזמנים',
        'value', v_cost_all, 'format', 'money', 'window', 'כל הזמנים',
        'compare', null, 'target', null),
      jsonb_build_object('key', 'no_cost_source', 'label', 'שורות ציוד במחיר מוערך',
        'value', v_nosrc_n, 'format', 'int', 'amount', v_nosrc_sum, 'window', 'כל הזמנים',
        'compare', null, 'target', null)),
    'chart', jsonb_build_array(
      jsonb_build_object('type', 'bar', 'title', 'עלות לפי מוצר',
        'series', jsonb_build_array(jsonb_build_object('key', 'cost', 'label', 'עלות מוזמנת')),
        'data', v_chart_cost, 'xKey', 'item_name', 'domain', null,
        'refLines', '[]'::jsonb, 'unit', '₪'),
      jsonb_build_object('type', 'bar', 'title', 'הוזמן מול הגיע',
        'series', jsonb_build_array(
          jsonb_build_object('key', 'ordered', 'label', 'הוזמן'),
          jsonb_build_object('key', 'arrived', 'label', 'הגיע')),
        'data', v_chart_gap, 'xKey', 'item_name', 'domain', null,
        'refLines', '[]'::jsonb, 'unit', 'יחידות')),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'item_name', 'label', 'מוצר (מק"ט)', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'ordered', 'label', 'הוזמן', 'format', 'int', 'align', 'end'),
      jsonb_build_object('key', 'arrived', 'label', 'הגיע', 'format', 'int', 'align', 'end'),
      jsonb_build_object('key', 'gap_units', 'label', 'פער יחידות', 'format', 'int', 'align', 'end'),
      jsonb_build_object('key', 'gap_pct', 'label', 'פער %', 'format', 'percent', 'align', 'end'),
      jsonb_build_object('key', 'ordered_cost', 'label', 'עלות מוזמנת (₪)', 'format', 'money', 'align', 'end')),
    'rows', v_rows,
    'so_what', case when v_top_order is not null then
        'להזמין ' || v_top_qty || ' יחידות של "' || v_top_order || '" ל-' || v_top_events
        || ' האירועים שבחודש הקרוב — הכמות הגדולה ביותר בטבלת-ההזמנה.'
      else 'אין אירועים בחודש הקרוב שדורשים הזמנת ציוד.' end,
    'definitions', '"הוזמן" = הכמות המתוכננת, והיא בסיס-החיוב והעלות · "הגיע" = הכמות בפועל, '
      || 'והיא שאלת-רכש בלבד · "עלות מוזמנת" = הוזמן × מחיר-העלות הקפוא בסגירת ההצעה · '
      || '"פער" = הפרש יחידות, לא ₪ · "כמות להזמנה" = מה שהוזמן לאירועים שטרם התקיימו בחודש '
      || 'הקרוב, והיא תקרה עליונה — המערכת אינה יודעת מה כבר הוזמן מהספק · '
      || '"מחיר מוערך" = שורה בלי קישור להצעה ובלי קישור לשינוי-תכולה, שמחירה חושב לפי ממוצע-המוצר.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(), 'missing_params', '[]'::jsonb, 'frozen_count', null,
      'notes', jsonb_build_array(
        'נמדד על ' || v_measured_n || ' שורות מתוך ' || v_total_rows
          || ' — בשאר, "הגיע בפועל" הועתק מהמתוכנן ולא נמדד.',
        v_nosrc_n || ' שורות ציוד ללא מקור-עלות · כ-' || round(v_nosrc_sum)
          || ' ₪ — מחירן מוערך לפי ממוצע-המוצר ואינו נמדד.',
        '"כמות להזמנה" היא תקרה עליונה: יש להפחית ממנה הזמנות-רכש שכבר יצאו.'),
      -- חוזה-C8 נושא טבלה אחת לדף, ולדף הזה שלוש (הכרעה 24 · ח5 ו-㉗). השתיים המשניות
      -- יושבות כאן ולא בשורש, כדי לא להוסיף מפתח עליון שאינו בחוזה.
      'extra_tables', jsonb_build_array(
        jsonb_build_object('key', 'upcoming_orders', 'title', 'כמה להזמין לחודש הקרוב',
          'columns', jsonb_build_array(
            jsonb_build_object('key', 'item_name', 'label', 'מוצר (מק"ט)', 'format', 'text', 'align', 'start'),
            jsonb_build_object('key', 'qty', 'label', 'כמות להזמנה', 'format', 'int', 'align', 'end'),
            jsonb_build_object('key', 'events', 'label', 'אירועים', 'format', 'int', 'align', 'end')),
          'rows', v_order_rows),
        jsonb_build_object('key', 'no_cost_source', 'title', 'שורות ציוד במחיר מוערך',
          'columns', jsonb_build_array(
            jsonb_build_object('key', 'project_id', 'label', 'פרויקט', 'format', 'int', 'align', 'start'),
            jsonb_build_object('key', 'item_name', 'label', 'מוצר (מק"ט)', 'format', 'text', 'align', 'start'),
            jsonb_build_object('key', 'planned_qty', 'label', 'מתוכנן', 'format', 'int', 'align', 'end'),
            jsonb_build_object('key', 'actual_qty', 'label', 'בפועל', 'format', 'int', 'align', 'end'),
            jsonb_build_object('key', 'estimated_cost', 'label', 'עלות מוערכת (₪)', 'format', 'money', 'align', 'end')),
          'rows', v_nosrc_rows)),
      'measured_rows', v_measured_n,
      'run', null)
  );
end;
$function$;

comment on function public.report_m12_equipment(date, date, integer, jsonb) is
  'מודול 11 · צריכת ציוד (מ12). אוכלוסייה: כל שורות הלוגיסטיקה, כלל-הזמנים, כולל פרויקטים מבוטלים · הוצאו: אין. בלוק ההזמנה חותך לאירועים שטרם התקיימו ב-30 הימים הקרובים ומחריג מבוטלים. בסיס-הכמות הוא planned_qty (המוזמן) לפי הכרעה 5; actual_qty מוצג כעמודת-פער בלבד. קריאה בלבד, מגודר על מודול כספים.';

revoke execute on function public.report_m12_equipment(date, date, integer, jsonb) from public, anon, authenticated;
grant execute on function public.report_m12_equipment(date, date, integer, jsonb) to authenticated;
