-- =============================================================================
-- מודול 11 · מיגרציה E2 · תיקון-קדימה לארבע פונקציות-השרת של לשונית "כספים"
-- =============================================================================
-- 🎯 **מה זה:** תיקון-קדימה ל-12 הממצאים של סבב-האימות על מיגרציה E
--    (`20260916051950_module11_e_rpcs_finance.sql`). ‏**הקובץ ההוא אינו נערך** — הוא הוחל,
--    ומיגרציה שהוחלה מתוקנת אך ורק במיגרציה חדשה קדימה (`supabase/migrations/CLAUDE.md §2`).
--    **אין טבלה חדשה, אין עמודה חדשה, אין policy חדשה, אין כתיבה.** ארבע הפונקציות נבנות
--    מחדש מהגוף החי — `md5(prosrc)` נמשך והושווה לגוף שבקובץ E לפני הכתיבה, וארבעתם זהים.
--
-- 🔻 **שינוי-חתימה, ולמה הוא מותר כאן:** ‏`report_m09_aging` ו-`report_m07_finance_overview`
--    מקבלות פרמטר חמישי `p_asof date default null`. שינוי-חתימה יושב בצד ההרסני של
--    Expand-Contract ומותר רק כשהקוד הפרוס אינו קורא לפונקציה. **נבדק באותו סשן:**
--    ‏`git ls-tree origin/main` אינו מכיל את מיגרציה E, ו-`git grep report_m09_aging
--    origin/main -- src e2e` מחזיר 0 קבצים — וכך גם `origin/dev`. **אף קוד פרוס אינו מכיר אותן.**
--    ‏🔴 **וה-`drop` אינו נוחוּת אלא חובה:** ‏`create or replace` על חתימה בת חמישה פרמטרים
--    היה מותיר את בת-הארבעה בחיים כעומס-יתר (overload), וקריאת PostgREST בת ארבעה פרמטרים
--    הייתה נכשלת כ-ambiguous. לכן הסדר: `drop` ⇐ `create` ⇐ `comment` ⇐ `revoke`/`grant`.
--
-- 🧭 **הכרעות התיקון (F1–F10), כל אחת עם ה-why שלה בגוף:**
--    F1 · **תאריך-הייחוס של הגיול הוא "היום בישראל" ולא `p_to`.** מסנן-התקופה הזיז את
--         ימי-האיחור בשקט בעוד האריח הכריז "אינו מושפע ממסנן התקופה". ⇒ `v_asof`, ופרמטר
--         `p_asof` שקיים כדי שהאורקל המחושב-ביד (10/09/2026) יישאר בר-שחזור. **הלקוח אינו
--         שולח אותו לעולם** (`callReport` שולח ארבעה) — רק מאמת.
--    F2 · מ7 קראה `0.15` מוקשח. ⇒ קוראת `params.סף_סטיית_תקציב_אחוז` כמו מ8; חסר ⇒
--         ‏`meta.missing_params` וערך-אריח `null` (§7.83 · C5 — אין ברירת-מחדל שקטה).
--    F3 · חמישה אריחים החזירו `compare: null` אף שיש להם בסיס-השוואה מדיד. ⇒ צילום-רגע
--         של לפני חודש, מדורג לדליים, מוחזר במלואו (📐1).
--    F4 · ברמת-קידוח 2 מונה-הלקוחות לא ירד עם הרמה (3 במקום 1). ⇒ סייג `customer_id` שהיה
--         חסר בביטוי אחד מתוך ארבעה, והתאמת-מספר בעברית.
--    F5 · ₪ בתוך משפטי-שרת חזרו בלי מפרידי-אלפים ובלי בידוד-כיווניות. ⇒ אותה תבנית בדיוק
--         של מיגרציית ההנהלה: `to_char(round(x),'FM999,999,999') || ' ₪'` עטוף LRI…PDI.
--    F6 · `tiles[].sub` ו-`compare.count` נוספו (תיקון C8 מ-05:5X, שנרשם אחרי כתיבת E).
--    F7 · `drill_key` בצורה האחידה `{kind, …}` בכל שורה בארבעת המשטחים.
--    F8 · ‏`population.excluded` של מ8 הצהיר על 123 שהם **בתוך** n=236. ⇒ המונה עבר ל-
--         ‏`meta.below_materiality`, ו-`excluded` מצהיר את מה שבאמת הוצא.
--    F9 · פרמטר חסר ⇒ `so_what: null`. משפט-"אז מה" אינו אריח ולכן לא נחסם, והוא הצהיר
--         "אין חוב מעל 60 יום" על סמך חישוב שכולו `null`.
--    F10 · ₪ בלי אגורות בשכר-הדיילות · `direction` עם ענף `flat` ו-`null` במכנה-אפס ·
--         חלון מ9 = "נכון להיום" ו-`from`/`to` ריקים · `meta.sku_count` · תוויות-הקידוח.
--
-- 🧮 **קונבנציות שלא השתנו:** "היום" = `(now() at time zone 'Asia/Jerusalem')::date` ·
--    ₪ שלמים בעיגול-פר-שורה-ואז-סכימה · מכנה אפס דרך `nullif` · חלון-תקופה קלנדרי סגור
--    משני קצותיו וחלון נגלל חצי-פתוח (D-17) · `security definer` + `search_path` ריק +
--    שער `assert_module_permission` בשורה הראשונה.
-- ⚠️ **חריגה מודעת אחת, מדווחת:** ‏F10 מורה לעגל את שכר-הדיילות **פר-שורה** ⇒ אוגוסט 2026
--    מחזיר 19,257 ₪, בעוד המוקאפ המאושר וקו-הבסיס כותבים 19,253 ₪ (עיגול-הסכום). שתי
--    השיטות נותנות "₪ בלי אגורות", והן נפרדות ב-4 ₪. **המספר לא "תוקן" בשקט** — הוא מיושם
--    כפי שהוכרע, ומדווח לצד המספר שבמוקאפ (C5 · C7).
--
-- 🔻 **אימות אחרי ההחלה** (קריאה-בלבד, בהתחזות, positive control קודם):
--   -- (א) מ9 עם `p_asof = 10/09/2026` ⇒ 35 · 10-13-8-1-3 · 236,382 ₪ · מעל 60 יום 4 · 23,384 ₪.
--   -- (ב) מ9 עם `p_to = 30/06/2026` ⇒ **אותם דליים בדיוק** (מסנן-התקופה אינו מזיז צילום-רגע).
--   -- (ג) `position('0.15' in prosrc)` על מ7 ⇒ 0, ושם-הפרמטר נוכח.
--   -- (ד) מ9 בקידוח `{bucket:d90p, customer_id:401}` ⇒ `customers` = 1.
--   -- (ה) מנהלת-גיוס ⇒ `42501` בארבעתן, ולא jsonb ריק.
-- =============================================================================


-- =============================================================================
-- ‏① `report_m07_finance_overview` — מבט-על כספים · "מה מצב הכסף?"
-- =============================================================================
-- ‏🔻 החתימה גדלה ב-`p_asof`; הישנה נמחקת קודם (ר' הכותרת).
drop function if exists public.report_m07_finance_overview(date, date, integer, jsonb);

create or replace function public.report_m07_finance_overview(
  p_from date default null,
  p_to date default null,
  p_customer_id integer default null,
  p_drill jsonb default null,
  p_asof date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  -- why: בידוד-כיווניות לכל רצף-ספרות בתוך משפט עברי — התאום של `isolateLtr`
  --      (`reportsFormat.js`), שם תועד ש-"46,400 ₪" נראה הפוך בדפדפן אמיתי ב-16/09/2026.
  v_lri          constant text := chr(8294);
  v_pdi          constant text := chr(8297);
  -- why: שם-החודש נכתב על האריח ("מתוך 13 אירועים שהתקיימו בספטמבר"). `to_char` היה מחזיר
  --      אנגלית; הרשימה כאן היא אותה רשימה שבמיגרציית ההנהלה.
  v_months_he    constant text[] := array['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  v_today        date := (now() at time zone 'Asia/Jerusalem')::date;
  -- why (F1): תאריך-הייחוס של כל מה שהוא צילום-רגע. `p_to` הוא מסנן-תקופה ואינו מזיז אותו.
  v_asof         date;
  v_to           date;
  v_from         date;
  v_prev_month   date;
  v_terms        integer;
  v_threshold    numeric;
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
  v_dev_den      integer;
  v_dev_prev_n   integer;
  v_dev_prev_den integer;
  v_dev_roll_n   integer;
  v_dev_roll_den integer;
  v_pay_sum      numeric;
  v_pay_shifts   integer;
  v_pay_prev_sum numeric;
  v_pay_prev_n   integer;
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

  v_asof       := coalesce(p_asof, v_today);
  v_to         := coalesce(p_to, v_today);
  v_from       := coalesce(p_from, date_trunc('year', v_to)::date);
  v_prev_month := (date_trunc('month', v_to) - interval '1 month')::date;

  select pa.param_value::integer into v_terms
    from public.params pa where pa.param_name = 'תנאי_תשלום_ימים';
  if v_terms is null then
    v_missing := v_missing || 'תנאי_תשלום_ימים'::text;
  end if;

  -- why (F2): הסף נקרא מהפרמטר, כמו במ8. סף מוקשח בגוף הפונקציה היה נותן לאריח של מ7
  --           ולדף מ8 שאליו הוא דלת שני מספרים שונים ביום שבו ישי יעדכן את הפרמטר,
  --           ומחיקת שורת-הפרמטר הייתה מחזירה את הסף הישן בשקט במקום "חסר פרמטר מערכת".
  --           🔁 ואין כאן ספרות בכוונה: הבדיקה המכנית מחפשת את הליטרל שהוסר בתוך `prosrc`,
  --           והערה שמצטטת אותו הייתה מפילה אותה בשקט — על טקסט, לא על קוד.
  select pa.param_value::numeric into v_threshold
    from public.params pa where pa.param_name = 'סף_סטיית_תקציב_אחוז';
  if v_threshold is null then
    v_missing := v_missing || 'סף_סטיית_תקציב_אחוז'::text;
  end if;

  -- ── האוכלוסייה: חשבוניות שנשלחו, טרם שולמו, ולא נמחקו כחוב-אבוד ──────────────
  -- ‏`p_customer_id` מצמצם את כל הדף (מסנן-לקוח גלובלי); `null` = כל הלקוחות.
  -- why (F1): ימי-האיחור נמדדים מול `v_asof` ולא מול `v_to`. האוכלוסייה עצמה היא
  --           "טרם שולמה **עכשיו**", ומדידת ימיה מול קצה-התקופה הייתה שני תאריכי-ייחוס
  --           באריח אחד.
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
                else greatest(v_asof - (o.sent_d + v_terms), 0) end as dov
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
           -- why (F7): צורת-`drill_key` אחידה בין הלשוניות — `{kind, id}`, כמו בהנהלה.
           'drill_key', jsonb_build_object('kind', 'project', 'id', project_id)
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
     and (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date <= v_asof - 30
     and (p.payment_date is null or p.payment_date > v_asof - 30);

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
   where v_terms is not null and expected_d > v_asof and expected_d <= v_asof + 30;

  -- חצי-ההשוואה של אותו אריח: מה **נכנס בפועל** ב-30 הימים האחרונים. השוואה רטרוספקטיבית
  -- ולא אותה נוסחה — ולכן היא מוצהרת ככזו בתווית (הכרטיס ③). חלון נגלל ⇒ חצי-פתוח (D-17).
  select count(*)::integer, coalesce(sum(round(m.revenue)), 0)
    into v_recv_n, v_recv_sum
    from public.projects p
    cross join lateral public.finance_project_money(p.project_id) m
   where p.payment_date > v_asof - 30 and p.payment_date <= v_asof
     and (p_customer_id is null or p.customer_id = p_customer_id);

  -- ── שני האריחים "החודש" — ר' הכותרת: קלנדרי מוצג, נגלל נמדד ומוחזר ב-`meta` ────
  -- why (F6): המכנה נמדד ומוחזר. "0 חרגו" בלי "מתוך 13 אירועים שהתקיימו" הוא מספר בלי עולם,
  --           והמוקאפ המאושר מדפיס את שניהם.
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
                            and final_event_date <= v_to)::integer,
         count(*) filter (where final_event_date >= date_trunc('month', v_to)::date
                            and final_event_date <= v_to and r > v_threshold / 100.0)::integer,
         count(*) filter (where final_event_date >= v_prev_month
                            and final_event_date < date_trunc('month', v_to)::date)::integer,
         count(*) filter (where final_event_date >= v_prev_month
                            and final_event_date < date_trunc('month', v_to)::date
                            and r > v_threshold / 100.0)::integer,
         count(*) filter (where final_event_date > v_to - 30 and final_event_date <= v_to)::integer,
         count(*) filter (where final_event_date > v_to - 30 and final_event_date <= v_to
                            and r > v_threshold / 100.0)::integer
    into v_dev_den, v_dev_n, v_dev_prev_den, v_dev_prev_n, v_dev_roll_den, v_dev_roll_n
    from ratio;

  -- why (F10): ‏₪ בלי אגורות **בפיילוד ולא רק בתצוגה** — עיגול פר-שורה ואז סכימה, אותה
  --            קונבנציה שכבר נועלת את 236,382 ₪ בגיול. ‏`19252.5` היה הערך היחיד בלשונית
  --            שנשא אגורות. ⚠️ ר' הערת-החריגה בכותרת: התוצאה 19,257 ולא 19,253.
  select coalesce(sum(round(a.actual_hours * a.hourly_rate_snapshot))
                    filter (where a.event_date >= date_trunc('month', v_to)::date and a.event_date <= v_to), 0),
         count(*) filter (where a.event_date >= date_trunc('month', v_to)::date and a.event_date <= v_to)::integer,
         coalesce(sum(round(a.actual_hours * a.hourly_rate_snapshot))
                    filter (where a.event_date >= v_prev_month
                              and a.event_date < date_trunc('month', v_to)::date), 0),
         count(*) filter (where a.event_date >= v_prev_month
                            and a.event_date < date_trunc('month', v_to)::date)::integer,
         coalesce(sum(round(a.actual_hours * a.hourly_rate_snapshot))
                    filter (where a.event_date > v_to - 30 and a.event_date <= v_to), 0)
    into v_pay_sum, v_pay_shifts, v_pay_prev_sum, v_pay_prev_n, v_pay_roll_sum
    from public.assignments a
    join public.projects p on p.project_id = a.project_id
   where a.actual_hours > 0
     and (p_customer_id is null or p.customer_id = p_customer_id);

  -- ── הגרף: יתרת-החוב הפתוחה בסוף כל חודש, 12 נקודות אחורה (⏳ב1) ───────────────
  -- why (F1): הנקודה האחרונה נושאת `is_today` **רק כשהיא באמת היום**. קודם היא נשאה את
  --           הדגל גם על תקופה שנבחרה בעבר, ואז המסך צייר עמודת-"היום" מקווקוות על 30/06.
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
    union all select v_to, (v_to = v_asof)
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
               || v_lri || v_written_n || v_pdi || ') ופרויקטים שטרם חויבו · n='
               || v_lri || v_open_n || v_pdi
               || ' חשבוניות, נכון להיום — צילום-רגע שאינו מושפע ממסנן התקופה. '
               || 'שני האריחים התחתונים נשענים על אוכלוסיית דוחות-הכסף: אירועים שהתקיימו '
               || 'ויצאה להם חשבונית — פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום.',
      'excluded', jsonb_build_object('חוב אבוד', v_written_n)),
    'window', jsonb_build_object('from', v_from, 'to', v_to,
      'label', v_lri || to_char(v_from, 'DD/MM') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'open_debt', 'label', 'יתרת-חוב פתוחה',
        'value', v_open_sum, 'format', 'money', 'count', v_open_n,
        'sub', v_lri || v_open_n || v_pdi
               || case when v_open_n = 1 then ' חשבונית פתוחה' else ' חשבוניות פתוחות' end,
        -- why (F1): אין כאן תאריך-מסנן. האריח הצהיר "אינו מושפע ממסנן התקופה" והדפיס
        --           "נכון ל-30/06" באותה נשימה.
        'window', 'נכון להיום · אינו מושפע ממסנן התקופה',
        'compare', jsonb_build_object('value', v_prev_sum, 'label', 'לפני חודש', 'count', v_prev_n,
          'note', null,
          'direction', case when v_open_sum > v_prev_sum then 'up'
                            when v_open_sum < v_prev_sum then 'down' else 'flat' end),
        'target', jsonb_build_object('tab', 'כספים', 'report', 'report_m09_aging', 'drill', null)),
      jsonb_build_object('key', 'expected_30d', 'label', 'צפוי להיכנס ב-30 יום',
        'value', v_exp_sum, 'format', 'money', 'count', v_exp_n,
        'sub', v_lri || v_exp_n || v_pdi
               || case when v_exp_n = 1 then ' חשבונית' else ' חשבוניות' end
               || ' · הערכה לפי התנהגות-תשלום היסטורית, לא התחייבות של הלקוח',
        'window', v_lri || to_char(v_asof, 'DD/MM') || '–' || to_char(v_asof + 30, 'DD/MM') || v_pdi,
        'compare', jsonb_build_object('value', v_recv_sum, 'count', v_recv_n,
          'label', 'שנכנסו בפועל ב-30 הימים האחרונים',
          'note', 'אינה אותה נוסחה — השוואה רטרוספקטיבית; התחזית של לפני חודש לא שוחזרה',
          'direction', case when v_exp_sum > v_recv_sum then 'up'
                            when v_exp_sum < v_recv_sum then 'down' else 'flat' end),
        -- ‏`null` ולא הפניה: דוח "תזרים צפוי" (מ10) נדחה בהכרעה 30 ואינו נבנה.
        'target', null),
      jsonb_build_object('key', 'over_threshold_month', 'label', 'פרויקטים שחרגו מהתקציב החודש',
        -- why (F2 · C5): הסף חסר ⇒ האריח אינו מצויר. `0` היה נראה כמדידה.
        'value', case when v_threshold is null then null else v_dev_n end,
        'format', 'int',
        'sub', case when v_threshold is null then null
                    else 'מתוך ' || v_lri || v_dev_den || v_pdi || ' אירועים שהתקיימו ב'
                         || v_months_he[extract(month from v_to)::integer]
                         || case when v_dev_n = 0 then ' — אף אחד לא חרג' else '' end end,
        'window', v_lri || to_char(date_trunc('month', v_to), 'DD/MM') || '–' || to_char(v_to, 'DD/MM') || v_pdi,
        'compare', case when v_threshold is null then null else jsonb_build_object(
          'value', v_dev_prev_n, 'count', v_dev_prev_den,
          'label', v_months_he[extract(month from v_prev_month)::integer],
          'note', v_lri || v_dev_prev_n || v_pdi || ' מתוך ' || v_lri || v_dev_prev_den || v_pdi || ' אירועים',
          'direction', case when v_dev_n > v_dev_prev_n then 'up'
                            when v_dev_n < v_dev_prev_n then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'כספים', 'report', 'report_m08_profitability', 'drill', null)),
      jsonb_build_object('key', 'hostess_pay_month', 'label', 'שכר דיילות החודש',
        'value', v_pay_sum, 'format', 'money', 'count', v_pay_shifts,
        'sub', v_lri || v_pay_shifts || v_pdi
               || case when v_pay_shifts = 1 then ' משמרת בתשלום' else ' משמרות בתשלום' end,
        'window', v_lri || to_char(date_trunc('month', v_to), 'DD/MM') || '–' || to_char(v_to, 'DD/MM') || v_pdi,
        'compare', jsonb_build_object('value', v_pay_prev_sum, 'count', v_pay_prev_n,
          'label', v_months_he[extract(month from v_prev_month)::integer],
          'note', v_lri || v_pay_prev_n || v_pdi
                  || case when v_pay_prev_n = 1 then ' משמרת' else ' משמרות' end,
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
    -- why (F9): בלי `תנאי_תשלום_ימים` כל ימי-האיחור הם `null` ⇒ "אין חוב מעל 60 יום" הוא
    --           הצהרה על מדידה שלא בוצעה. משפט-"אז מה" אינו אריח, ולכן הוא נשתק כאן במפורש.
    'so_what', case when v_terms is null then null
      when v_over60_n > 0 then
        'לגבות ' || v_lri || to_char(round(v_over60_sum), 'FM999,999,999') || ' ₪' || v_pdi
        || ' שממתינים מעל ' || v_lri || '60' || v_pdi || ' יום ב-' || v_lri || v_over60_n || v_pdi
        || case when v_over60_n = 1 then ' חשבונית' else ' חשבוניות' end
        || ' — הוותיקה כבר ' || v_lri || coalesce(v_oldest_days, 0) || v_pdi
        || case when coalesce(v_oldest_days, 0) = 1 then ' יום' else ' ימים' end
        || ', אצל ' || coalesce(v_oldest_name, '—') || '; יתרת-החוב כולה עומדת על '
        || v_lri || to_char(round(v_open_sum), 'FM999,999,999') || ' ₪' || v_pdi || '.'
      else 'אין חוב מעל ' || v_lri || '60' || v_pdi || ' יום; יתרת-החוב הפתוחה עומדת על '
        || v_lri || to_char(round(v_open_sum), 'FM999,999,999') || ' ₪' || v_pdi || '.' end,
    'definitions', 'יתרת-חוב פתוחה = חשבונית שנשלחה, טרם שולמה ולא נמחקה כחוב-אבוד · '
      || '"צפוי" = מועד חוזי (שליחה + ' || v_lri || coalesce(v_terms::text, '—') || v_pdi
      || ' ימי תנאי-תשלום) ועוד חציון-האיחור של אותו לקוח — הערכה, לא התחייבות · '
      || 'יתרת-חוב בסוף חודש = אותה הגדרה, נכון לערב האחרון של אותו חודש; העמודה האחרונה היא נכון להיום.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(), 'missing_params', to_jsonb(v_missing), 'frozen_count', null,
      'notes', jsonb_build_array(
        'חובות אבודים: ' || v_lri || v_written_n || v_pdi
          || case when v_written_n = 1 then ' חשבונית · ' else ' חשבוניות · ' end
          || v_lri || to_char(round(v_written_sum), 'FM999,999,999') || ' ₪' || v_pdi
          || ' — מוחרגים מהיתרה ומכל המדרגים.',
        'העמודה האחרונה בגרף היא נכון ל-' || v_lri || to_char(v_to, 'DD/MM') || v_pdi || ' ואינה סוף-חודש.',
        'יתרת-החוב, "צפוי להיכנס" וטבלת-הישנות הן צילום-רגע נכון להיום, ואינן זזות עם מסנן התקופה.'),
      'open_items', jsonb_build_object(
        'card_8_7_5', jsonb_build_object(
          'question', 'חלון שני האריחים התחתונים: החודש הקלנדרי (המוקאפ · הכרטיס ③ · התווית) או 30 יום נגללים (§📑ב)?',
          'calendar_month', jsonb_build_object('over_threshold', v_dev_n, 'denominator', v_dev_den,
            'hostess_pay', v_pay_sum, 'shifts', v_pay_shifts),
          'rolling_30', jsonb_build_object('over_threshold', v_dev_roll_n, 'denominator', v_dev_roll_den,
            'hostess_pay', v_pay_roll_sum))),
      'threshold_pct', v_threshold,
      'series_min', v_series_min,
      'top_overdue_customer', jsonb_build_object('name', v_top_name, 'amount', v_top_sum),
      'open_invoice_count', v_open_n,
      'asof', v_asof,
      'export_blocked_reason', null,
      'run', null)
  );
end;
$function$;

comment on function public.report_m07_finance_overview(date, date, integer, jsonb, date) is
  'מודול 11 · מבט-על כספים (מ7). אוכלוסייה: חשבוניות שנשלחו וטרם שולמו · הוצאו: חובות אבודים ופרויקטים שטרם חויבו. יתרת-החוב, הצפי וטבלת-הישנות הם צילום-רגע נכון להיום ואינם מושפעים ממסנן התקופה; p_asof קיים לשחזור האורקל בלבד והלקוח אינו שולח אותו. שני האריחים התחתונים נשענים על אוכלוסיית דוחות-הכסף (הכרעה 36): פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום. סף-החריגה נקרא מ-params. קריאה בלבד, מגודר על מודול כספים.';

revoke execute on function public.report_m07_finance_overview(date, date, integer, jsonb, date) from public, anon, authenticated;
grant execute on function public.report_m07_finance_overview(date, date, integer, jsonb, date) to authenticated;


-- =============================================================================
-- ‏② `report_m08_profitability` — רווחיות פרויקטים · "אילו פרויקטים דלפו מהתקציב?"
-- =============================================================================
-- החתימה **לא** השתנתה (אין כאן צילום-רגע) ⇒ `create or replace` בלבד, בלי `drop`.
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
  v_lri         constant text := chr(8294);
  v_pdi         constant text := chr(8297);
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
  v_floor_sum   numeric;
  v_excl_status integer;
  v_prev_n      integer;
  v_prev_over   integer;
  v_prev_sum    numeric;
  v_prev_margin numeric;
  v_prev_median numeric;
  v_chart       jsonb;
  v_rows        jsonb;
  v_top_id      integer;
  v_top_name    text;
  v_top_pct     numeric;
  v_share_pct   numeric;
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

  -- why (F8): מי באמת הוצא מ-n. עד כה `excluded` נשא את 123 שמתחת לרצפת-המהותיות, והם
  --           **בתוך** האוכלוסייה ורק מחוץ לדירוג — מסך שמרנדר `excluded` היה מדפיס
  --           "הוצאו: מתחת לרצפת-המהותיות 123" ליד תווית שאומרת את ההפך.
  select count(*)::integer into v_excl_status
    from public.projects p
   where p.final_event_date >= v_from and p.final_event_date <= v_to
     and p.project_status not in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')
     and (p_customer_id is null or p.customer_id = p_customer_id);

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
         -- why (F8): הרצפה מוצהרת גם ב-₪. "123 פרויקטים" בלי סכום אינו אומר אם מוסתרים
         --           כאן 5,000 ₪ או 700,000 ₪, וזה ההבדל בין הערת-שוליים לבין ממצא.
         (select coalesce(sum(round(revenue)), 0) from win where planned_hours < 4 or planned_labor < 1000),
         (select count(*) from prev),
         (select count(*) from prev where r > v_threshold / 100.0),
         (select coalesce(sum(budget_deviation), 0) from prev where r > v_threshold / 100.0),
         (select sum(coalesce(final_profit, gross_profit)) / nullif(sum(revenue), 0) from prev),
         -- why (F3): חציון-הסטייה אשתקד — אותה נוסחה, אותו חלון, שנה אחורה. הוא היה
         --           `compare: null` בעוד המוקאפ המאושר מדפיס לצידו "2025: 0.0%".
         (select percentile_cont(0.5) within group (order by r) from prev),
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
            'drill_key', jsonb_build_object('kind', 'project', 'id', project_id))
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
    into v_n, v_over, v_over_sum, v_margin, v_median, v_frozen, v_floor_n, v_floor_sum,
         v_prev_n, v_prev_over, v_prev_sum, v_prev_margin, v_prev_median, v_chart, v_rows,
         v_top_id, v_top_name, v_top_pct;

  v_share_pct := round(100.0 * v_over / nullif(v_n, 0), 1);

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_n,
      'label', 'אוכלוסייה: אירועים שהתקיימו ויצאה להם חשבונית — פרויקט הסתיים · ממתין לסגירה · '
               || 'ממתין לחשבונית · ממתין לתשלום, אירוע ב-' || v_lri || to_char(v_from, 'DD/MM/YYYY')
               || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi || ' · הוצאו: פרויקטים פעילים ומבוטלים ('
               || v_lri || v_excl_status || v_pdi || ') · n=' || v_lri || v_n || v_pdi
               || '. הדף אינו מציג פרויקטים פעילים — לפני שהאירוע התקיים השעות-בפועל תמיד קטנות '
               || 'מהמתוכננות, ולכן אין בו חריגה למדוד. ' || v_lri || v_floor_n || v_pdi
               || ' מהם מתחת לרצפת-המהותיות — בתוך האוכלוסייה, מחוץ לדירוג.',
      -- why (F8): רק מה שבאמת מחוץ ל-n.
      'excluded', jsonb_build_object('פרויקטים פעילים ומבוטלים', v_excl_status)),
    'window', jsonb_build_object('from', v_from, 'to', v_to,
      'label', v_lri || to_char(v_to, 'YYYY') || ' (' || to_char(v_from, 'DD/MM') || '–'
               || to_char(v_to, 'DD/MM') || ')' || v_pdi),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'projects_in_period', 'label', 'פרויקטים בתקופה',
        'value', v_n, 'format', 'int', 'window', 'התקופה שנבחרה',
        'sub', 'אירועים שהתקיימו ויצאה להם חשבונית',
        'compare', jsonb_build_object('value', v_prev_n,
          'label', v_lri || to_char(v_prev_to, 'YYYY') || v_pdi || ' באותו טווח', 'note', null,
          'direction', case when v_n > v_prev_n then 'up' when v_n < v_prev_n then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object('key', 'over_threshold', 'label', 'פרויקטים שחרגו מהתקציב',
        -- why (F2 · C5): שלושת האריחים התלויים בסף אינם מצוירים בלי הפרמטר.
        'value', case when v_threshold is null then null else v_over end,
        'format', 'int', 'window', 'התקופה שנבחרה',
        'share_pct', case when v_threshold is null then null else v_share_pct end,
        'sub', case when v_threshold is null then null
                    else 'מעל סף ' || v_lri || v_threshold::text || '%' || v_pdi || ' · '
                         || v_lri || to_char(v_share_pct, 'FM990.0') || '%' || v_pdi || ' מתוך '
                         || v_lri || v_n || v_pdi || ' האירועים' end,
        'compare', case when v_threshold is null then null else jsonb_build_object(
          'value', v_prev_over, 'count', v_prev_n,
          'label', v_lri || to_char(v_prev_to, 'YYYY') || v_pdi,
          'note', v_lri || to_char(round(100.0 * v_prev_over / nullif(v_prev_n, 0), 1), 'FM990.0')
                  || '%' || v_pdi || ' מהאירועים',
          'direction', case when v_over > v_prev_over then 'up'
                            when v_over < v_prev_over then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'sum_over_threshold', 'label', 'סך החריגה מעל הסף',
        'value', case when v_threshold is null then null else round(v_over_sum) end,
        'format', 'money', 'window', 'התקופה שנבחרה',
        'sub', 'חריגה כלפי-מעלה בלבד — חיסכון בפרויקט אחד אינו מקזז חריגה באחר',
        'compare', case when v_threshold is null then null else jsonb_build_object(
          'value', round(v_prev_sum), 'label', v_lri || to_char(v_prev_to, 'YYYY') || v_pdi, 'note', null,
          'direction', case when v_over_sum > v_prev_sum then 'up'
                            when v_over_sum < v_prev_sum then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח בתקופה',
        'value', round(100 * v_margin, 1), 'format', 'percent', 'window', 'התקופה שנבחרה',
        'sub', 'סך הרווח חלקי סך ההכנסה, על אותה אוכלוסייה',
        'compare', jsonb_build_object('value', round(100 * v_prev_margin, 1),
          'label', v_lri || to_char(v_prev_to, 'YYYY') || v_pdi, 'note', null,
          'direction', case when v_margin > v_prev_margin then 'up'
                            when v_margin < v_prev_margin then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object('key', 'median_deviation', 'label', 'חציון-סטייה',
        'value', round(100 * v_median, 1), 'format', 'percent', 'window', 'התקופה שנבחרה',
        -- why: תת-השורה **עובדתית ולא פרשנית**. "רוב הפרויקטים סביב התכנון" הוא משפט
        --      שיישאר על המסך גם ביום שבו החציון יקפוץ ל-40%.
        'sub', 'החציון של כל ' || v_lri || v_n || v_pdi || ' הפרויקטים בתקופה — חצי מעליו וחצי מתחתיו',
        -- why (F3): יש בסיס-השוואה אמיתי ומדיד, ולכן "—" אסור (📐1).
        'compare', case when v_prev_median is null then null else jsonb_build_object(
          'value', round(100 * v_prev_median, 1),
          'label', v_lri || to_char(v_prev_to, 'YYYY') || v_pdi, 'note', null,
          'direction', case when v_median > v_prev_median then 'up'
                            when v_median < v_prev_median then 'down' else 'flat' end) end,
        'target', null)),
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
    -- why (F9): בלי הסף אין "חרגו" ואין "לא חרגו" — יש "לא נמדד". המשפט נשתק, והמסך מציג
    --           במקומו את הודעת הפרמטר החסר.
    'so_what', case when v_threshold is null then null
      when v_over > 0 and v_top_id is null then
        'חרגו ' || v_lri || v_over || v_pdi || ' פרויקטים ב-'
        || v_lri || to_char(round(v_over_sum), 'FM999,999,999') || ' ₪' || v_pdi
        || ', אך כולם מתחת לרצפת-המהותיות — אין פרויקט שדורש פתיחה השבוע.'
      when v_over > 0 then
        'לפתוח את פרויקט ' || v_lri || v_top_id || v_pdi || ' — ' || coalesce(v_top_name, '—')
        || ', החריגה הגדולה ביותר בתקופה: ' || v_lri || to_char(v_top_pct, 'FM999,990.0') || '%' || v_pdi
        || ' מעל התכנון; בסך-הכול חרגו ' || v_lri || v_over || v_pdi || ' פרויקטים ב-'
        || v_lri || to_char(round(v_over_sum), 'FM999,999,999') || ' ₪' || v_pdi || ', מול '
        || v_lri || v_prev_over || v_pdi || ' ו-'
        || v_lri || to_char(round(v_prev_sum), 'FM999,999,999') || ' ₪' || v_pdi || ' אשתקד.'
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
        v_lri || v_floor_n || v_pdi || ' פרויקטים · '
          || v_lri || to_char(round(v_floor_sum), 'FM999,999,999') || ' ₪' || v_pdi
          || ' מתחת לרצפת-המהותיות (פחות מ-' || v_lri || '4' || v_pdi || ' שעות מתוכננות או פחות מ-'
          || v_lri || '1,000' || ' ₪' || v_pdi || ' עלות-עבודה מתוכננת) — הם בתוך האוכלוסייה '
          || 'ומחוץ לדירוג בלבד.',
        'רווח: ' || v_lri || v_frozen || v_pdi || ' מתוך ' || v_lri || v_n || v_pdi
          || ' בתקופה נושאים רווח סופי קפוא; בשאר מוצג הרווח הגולמי המחושב.'),
      -- why (F8): המונה חי כאן, ולא ב-`population.excluded`, כי הוא **בתוך** n.
      'below_materiality', jsonb_build_object('count', v_floor_n, 'amount', round(v_floor_sum)),
      'threshold_pct', v_threshold,
      'export_blocked_reason', null,
      'run', null)
  );
end;
$function$;

comment on function public.report_m08_profitability(date, date, integer, jsonb) is
  'מודול 11 · רווחיות פרויקטים (מ8). אוכלוסייה: אירועים שהתקיימו ויצאה להם חשבונית — פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום, שתאריך האירוע שלהם בתקופה · הוצאו: פרויקטים פעילים ומבוטלים. פרויקטים מתחת לרצפת-המהותיות נמצאים בתוך האוכלוסייה ומחוץ לדירוג, ומונם יושב ב-meta.below_materiality. סטיית-התקציב נקראת מ-finance_project_money ואינה מחושבת כאן. קריאה בלבד, מגודר על מודול כספים.';

revoke execute on function public.report_m08_profitability(date, date, integer, jsonb) from public, anon, authenticated;
grant execute on function public.report_m08_profitability(date, date, integer, jsonb) to authenticated;


-- =============================================================================
-- ‏③ `report_m09_aging` — גיול חובות · "את מי לגבות השבוע?" 🔻 דוח-דריל (📐13)
-- =============================================================================
-- 🔴 **הממצא החוסם שנסגר כאן (F1):** הדף מכריז על עצמו *"זהו צילום-רגע ולא סיכום-תקופה —
-- אינו מושפע ממסנן התקופה"*, ובפועל `v_to` (קצה מסנן-התקופה) היה תאריך-הייחוס של
-- ימי-האיחור. נמדד חי: `p_to = 30/06/2026` הזיז את הדליים מ-10/13/8/1/3 ל-32/1/1/0/1
-- בעוד `population.n` נשאר 35 והאריח המשיך להדפיס "אינו מושפע ממסנן התקופה".
-- ⇒ **תאריך-הייחוס הוא `v_asof` = היום בישראל.** ‏`p_asof` קיים כדי שהאורקל המחושב-ביד
-- (`spec.md` §🔢, "היום" = 10/09/2026) יישאר בר-שחזור אחרי שהיום יזוז; **הלקוח אינו שולח
-- אותו** — `callReport` שולח ארבעה פרמטרים בלבד.
--
-- **המספרים שהפונקציה חייבת להחזיר על `p_asof = 10/09/2026`:** ‏35 חשבוניות ·
-- שוטף 10 · 1–30 13 · 31–60 8 · 61–90 1 · 90+ 3 · 68,585 / 87,574 / 56,839 / 5,438 / 17,946
-- ⇒ **236,382 ₪** · מעל 60 יום **4 חשבוניות · 23,384 ₪**.
drop function if exists public.report_m09_aging(date, date, integer, jsonb);

create or replace function public.report_m09_aging(
  p_from date default null,
  p_to date default null,
  p_customer_id integer default null,
  p_drill jsonb default null,
  p_asof date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_lri             constant text := chr(8294);
  v_pdi             constant text := chr(8297);
  v_today           date := (now() at time zone 'Asia/Jerusalem')::date;
  -- why (F1): תאריך-הייחוס היחיד של הדף. `p_from`/`p_to` נשארים בחתימה כי C8 נועל אותה,
  --           ומוחזרים ב-`meta` בלבד — הדף אינו סיכום-תקופה ואין לו חלון.
  v_asof            date;
  v_terms           integer;
  v_missing         text[] := array[]::text[];
  v_bucket          text := nullif(p_drill ->> 'bucket', '');
  v_cust            bigint := (p_drill ->> 'customer_id')::bigint;
  v_level           integer := 0;
  v_bucket_name     text;
  v_total_n         integer;
  v_total_sum       numeric;
  v_prev_n          integer;
  v_prev_sum        numeric;
  v_over60_n        integer;
  v_over60_sum      numeric;
  v_over60_cust     integer;
  v_prev_over60_n   integer;
  v_prev_over60_sum numeric;
  v_cur_n           integer;
  v_cur_sum         numeric;
  v_cur_prev        numeric;
  v_cur_prev_n      integer;
  v_p90_n           integer;
  v_p90_sum         numeric;
  v_p90_cust        integer;
  v_prev_p90_n      integer;
  v_prev_p90_sum    numeric;
  v_prev_lvl_n      integer;
  v_prev_lvl_sum    numeric;
  v_median_pay      numeric;
  v_paid_n          integer;
  v_oldest_days     integer;
  v_oldest_name     text;
  v_oldest_sent     date;
  v_written_n       integer;
  v_written_sum     numeric;
  v_buckets         jsonb;
  v_chart           jsonb;
  v_series          jsonb;
  v_rows            jsonb;
  v_columns         jsonb;
  v_tiles           jsonb;
  v_lvl_n           integer;
  v_lvl_sum         numeric;
  v_lvl_cust        integer;
  v_lvl_oldest      integer;
  v_top_name        text;
  v_top_sum         numeric;
  v_so_what         text;
  v_cust_name       text;
  v_cust_phrase     text;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  v_asof := coalesce(p_asof, v_today);

  select pa.param_value::integer into v_terms
    from public.params pa where pa.param_name = 'תנאי_תשלום_ימים';
  if v_terms is null then
    v_missing := array['תנאי_תשלום_ימים'];
  end if;

  if v_bucket is not null then v_level := 1; end if;
  if v_bucket is not null and v_cust is not null then v_level := 2; end if;
  -- ✏️ 07/09: שם-הרמה. הנוסח האחיד ('מדרג ' || label || ' יום') ייצר על "שוטף" את
  --    "מדרג שוטף יום" — עברית שבורה בפירורים, בכותרות ובשורת-"אז מה", בשלוש הרמות.
  -- why (F10): ‏`d90p` חוזר ל-'מדרג 90+ יום'. הוא היה הדלי היחיד שאיבד את ' יום', בעוד
  --            `agName` שבמוקאפ המאושר מייצר אותו כמו יתר המספריים.
  v_bucket_name := case v_bucket
                     when 'current' then 'שוטף'
                     when 'd1_30'  then 'מדרג 1–30 יום'
                     when 'd31_60' then 'מדרג 31–60 יום'
                     when 'd61_90' then 'מדרג 61–90 יום'
                     when 'd90p'   then 'מדרג 90+ יום'
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
           -- why (F1): `v_asof`, לא `v_to`.
           case when v_terms is null then null else greatest(v_asof - (o.sent_d + v_terms), 0) end as dov
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
         (select count(distinct customer_id) from tagged where bucket_key = 'd90p'),
         (select max(dov) from tagged),
         (select company_name from tagged order by dov desc nulls last limit 1),
         (select sent_d from tagged order by dov desc nulls last limit 1),
         (select company_name from tagged where bucket_key in ('d61_90', 'd90p') order by amt desc limit 1),
         (select amt from tagged where bucket_key in ('d61_90', 'd90p') order by amt desc limit 1),
         -- חמשת הדליים בסדר-הדליים הטבעי (📐7 — לא לפי ערך). התוויות כאן חייבות להישאר
         -- זהות ל-`AGING_BUCKETS` ב-`src/lib/reportsFinance.js` — בדיקת-היחידה משווה ביניהן.
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
         --    (`src/lib/customers.js`) הוא מקור-האמת היחיד לתוויות-סוג-הלקוח ⇒ `chart.label_source`
         --    אומר למסך דרך מה לפענח, כדי שלא ידפיס `private_company`.
         (select coalesce(jsonb_agg(jsonb_build_object('key', ct, 'label', ct) order by ct), '[]'::jsonb)
            from (select distinct coalesce(customer_type, 'unclassified') as ct
                    from tagged where bucket_key is not null and bucket_key <> 'current') d),
         case
           when v_level = 0 then
             (select coalesce(jsonb_agg(jsonb_build_object(
                'project_id', project_id, 'customer_name', company_name, 'owner', contact_name,
                'sent_date', sent_d, 'due_date', due_d, 'amount', amt,
                'days_overdue', dov, 'bucket', bucket_key,
                -- why (F7): שורת-שורש פותחת כרטיס-פרויקט ⇒ `kind: project`.
                'drill_key', jsonb_build_object('kind', 'project', 'id', project_id)
              ) order by dov desc nulls last, amt desc), '[]'::jsonb) from tagged)
           when v_level = 1 then
             (select coalesce(jsonb_agg(g.t order by (g.t ->> 'amount')::numeric desc), '[]'::jsonb)
                from (select jsonb_build_object(
                        'customer_id', customer_id, 'customer_name', company_name,
                        'owner', max(contact_name), 'invoices', count(*),
                        'amount', sum(amt), 'days_overdue', max(dov),
                        -- why (F7): שורת-רמה-1 יורדת רמה ⇒ `kind: customer`, ושדותיה הם
                        --           בדיוק ה-`p_drill` של הרמה הבאה.
                        'drill_key', jsonb_build_object('kind', 'customer',
                          'bucket', v_bucket, 'customer_id', customer_id)) as t
                        from tagged where bucket_key = v_bucket
                       group by customer_id, company_name) g)
           else
             (select coalesce(jsonb_agg(jsonb_build_object(
                'project_id', project_id, 'customer_name', company_name, 'owner', contact_name,
                'sent_date', sent_d, 'due_date', due_d, 'amount', amt, 'days_overdue', dov,
                'drill_key', jsonb_build_object('kind', 'project', 'id', project_id)
              ) order by dov desc nulls last), '[]'::jsonb)
                from tagged where bucket_key = v_bucket and customer_id = v_cust)
         end,
         (select count(*) from tagged where v_level > 0 and bucket_key = v_bucket
            and (v_level = 1 or customer_id = v_cust)),
         (select coalesce(sum(amt), 0) from tagged where v_level > 0 and bucket_key = v_bucket
            and (v_level = 1 or customer_id = v_cust)),
         -- 🔴 why (F4): הסייג `(v_level = 1 or customer_id = v_cust)` היה חסר **כאן בלבד**,
         --    מתוך ארבעת הביטויים שיורדים עם הרמה. התוצאה שנמדדה חי: ברמה 2 המסך הראה
         --    חשבונית אחת של לקוח אחד ושורת-"אז מה" אמרה "אצל 3 לקוחות".
         (select count(distinct customer_id) from tagged where v_level > 0 and bucket_key = v_bucket
            and (v_level = 1 or customer_id = v_cust)),
         (select max(dov) from tagged where v_level > 0 and bucket_key = v_bucket
            and (v_level = 1 or customer_id = v_cust)),
         (select company_name from tagged where v_level = 2 and customer_id = v_cust limit 1)
    into v_total_n, v_total_sum, v_over60_n, v_over60_sum, v_over60_cust,
         v_cur_n, v_cur_sum, v_p90_n, v_p90_sum, v_p90_cust,
         v_oldest_days, v_oldest_name, v_oldest_sent, v_top_name, v_top_sum,
         v_buckets, v_chart, v_series, v_rows,
         v_lvl_n, v_lvl_sum, v_lvl_cust, v_lvl_oldest, v_cust_name;

  -- ── צילום-הרגע של לפני חודש, **מדורג לדליים** (📐1) ───────────────────────────
  -- why (F3): חמישה אריחים חזרו `compare: null` אף שהמוקאפ המאושר מצייר לכל אחד חצי-השוואה,
  --           וכל החמישה מדידים באותה הגדרה בדיוק, חודש אחורה. ‏📐1: *"'—' מותר רק כשאין
  --           שינוי, לא כשלא נמדד."* הצילום מחושב פעם אחת ומשרת את כל חמשת האריחים.
  with prev_open as (
    select p.customer_id,
           (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date as sent_d,
           round(m.revenue) as amt
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      cross join lateral public.finance_project_money(p.project_id) m
     where p.invoice_sent = true and p.invoice_sent_at is not null
       and coalesce(pf.written_off, false) = false
       and (p_customer_id is null or p.customer_id = p_customer_id)
       and (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date <= v_asof - 30
       and (p.payment_date is null or p.payment_date > v_asof - 30)
  ), prev_tagged as (
    select o.*,
           case when v_terms is null then null
                else greatest((v_asof - 30) - (o.sent_d + v_terms), 0) end as dov
      from prev_open o
  ), prev_b as (
    select t.*,
           case when t.dov is null then null
                when t.dov = 0 then 'current'
                when t.dov <= 30 then 'd1_30'
                when t.dov <= 60 then 'd31_60'
                when t.dov <= 90 then 'd61_90'
                else 'd90p' end as bucket_key
      from prev_tagged t
  )
  select (select count(*) from prev_b),
         (select coalesce(sum(amt), 0) from prev_b),
         (select count(*) from prev_b where bucket_key = 'current'),
         (select coalesce(sum(amt), 0) from prev_b where bucket_key = 'current'),
         (select count(*) from prev_b where bucket_key in ('d61_90', 'd90p')),
         (select coalesce(sum(amt), 0) from prev_b where bucket_key in ('d61_90', 'd90p')),
         (select count(*) from prev_b where bucket_key = 'd90p'),
         (select coalesce(sum(amt), 0) from prev_b where bucket_key = 'd90p'),
         (select count(*) from prev_b where v_level > 0 and bucket_key = v_bucket),
         (select coalesce(sum(amt), 0) from prev_b where v_level > 0 and bucket_key = v_bucket)
    into v_prev_n, v_prev_sum, v_cur_prev_n, v_cur_prev,
         v_prev_over60_n, v_prev_over60_sum, v_prev_p90_n, v_prev_p90_sum,
         v_prev_lvl_n, v_prev_lvl_sum;

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
        'sub', v_lri || v_total_n || v_pdi
               || case when v_total_n = 1 then ' חשבונית פתוחה' else ' חשבוניות פתוחות' end,
        'window', 'נכון להיום · אינו מושפע ממסנן התקופה',
        'compare', jsonb_build_object('value', v_prev_sum, 'count', v_prev_n, 'label', 'לפני חודש',
          'note', null,
          'direction', case when v_total_sum > v_prev_sum then 'up'
                            when v_total_sum < v_prev_sum then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object('key', 'over_60', 'label', 'מעל 60 יום', 'value', v_over60_sum,
        'format', 'money', 'count', v_over60_n, 'customers', v_over60_cust,
        'sub', v_lri || v_over60_n || v_pdi
               || case when v_over60_n = 1 then ' חשבונית אצל ' else ' חשבוניות אצל ' end
               || case when v_over60_cust = 1 then 'לקוח אחד'
                       else v_lri || v_over60_cust || v_pdi || ' לקוחות' end,
        'window', 'נכון להיום',
        'compare', case when v_terms is null then null else jsonb_build_object(
          'value', v_prev_over60_sum, 'count', v_prev_over60_n, 'label', 'לפני חודש', 'note', null,
          'direction', case when v_over60_sum > v_prev_over60_sum then 'up'
                            when v_over60_sum < v_prev_over60_sum then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'כספים', 'report', 'report_m09_aging',
          'drill', jsonb_build_object('bucket', 'd90p'))),
      jsonb_build_object('key', 'bucket_90p', 'label', 'מדרג 90+', 'value', v_p90_sum,
        'format', 'money', 'count', v_p90_n, 'customers', v_p90_cust,
        'sub', v_lri || v_p90_n || v_pdi
               || case when v_p90_n = 1 then ' חשבונית אצל ' else ' חשבוניות אצל ' end
               || case when v_p90_cust = 1 then 'לקוח אחד'
                       else v_lri || v_p90_cust || v_pdi || ' לקוחות' end,
        'window', 'נכון להיום',
        'compare', case when v_terms is null then null else jsonb_build_object(
          'value', v_prev_p90_sum, 'count', v_prev_p90_n, 'label', 'לפני חודש', 'note', null,
          'direction', case when v_p90_sum > v_prev_p90_sum then 'up'
                            when v_p90_sum < v_prev_p90_sum then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'כספים', 'report', 'report_m09_aging',
          'drill', jsonb_build_object('bucket', 'd90p'))),
      jsonb_build_object('key', 'median_days_to_pay', 'label', 'ימים לתשלום (חציון)',
        'value', v_median_pay, 'format', 'days', 'count', v_paid_n,
        'sub', 'על ' || v_lri || v_paid_n || v_pdi || ' חשבוניות ששולמו, כל הזמנים · אינו '
               || v_lri || 'DSO' || v_pdi,
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה', 'compare', null, 'target', null));
    v_columns := jsonb_build_array(
      jsonb_build_object('key', 'project_id', 'label', 'פרויקט', 'format', 'int', 'align', 'start'),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'sent_date', 'label', 'נשלחה', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'due_date', 'label', 'מועד-פירעון חוזי', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'amount', 'label', 'סכום', 'format', 'money', 'align', 'end'),
      jsonb_build_object('key', 'days_overdue', 'label', 'ימי איחור', 'format', 'days', 'align', 'end'),
      jsonb_build_object('key', 'bucket', 'label', 'מדרג', 'format', 'text', 'align', 'start'));
    -- why (F9): בלי `תנאי_תשלום_ימים` אין דליים בכלל, ו-"אין חוב מעל 60 יום" הוא הצהרה
    --           על מדידה שלא בוצעה. ⇒ המשפט נשתק, והמסך מציג את הודעת הפרמטר החסר.
    v_so_what := case when v_terms is null then null
      when v_over60_n > 0 then
        'לגבות ' || v_lri || to_char(round(v_over60_sum), 'FM999,999,999') || ' ₪' || v_pdi || ' '
        || case when v_over60_cust = 1 then 'מלקוח אחד'
                else 'מ-' || v_lri || v_over60_cust || v_pdi || ' לקוחות' end
        || ' — הכסף שממתין מעל ' || v_lri || '60' || v_pdi || ' יום; הגדול שבהם '
        || coalesce(v_top_name, '—') || ', '
        || v_lri || to_char(round(coalesce(v_top_sum, 0)), 'FM999,999,999') || ' ₪' || v_pdi || '.'
      else 'אין חוב מעל ' || v_lri || '60' || v_pdi
        || ' יום — כל החוב הפתוח בתוך התנאים או באיחור קצר.' end;
  else
    -- why (F10): ברמה 2 התווית הייתה זהה לרמה 1 ("חוב במדרג 90+"). המוקאפ המאושר בונה
    --            ברמה 2 מחרוזת אחרת — 'חוב הלקוח ' + agIn(bk) — והיא מה שמבדיל את המסכים.
    v_cust_phrase := case when v_lvl_cust = 1 then 'מלקוח אחד'
                          else 'מ-' || v_lri || v_lvl_cust || v_pdi || ' לקוחות' end;
    v_tiles := jsonb_build_array(
      jsonb_build_object('key', 'bucket_amount',
        'label', case when v_level = 2 then 'חוב הלקוח ב' || v_bucket_name
                      else 'חוב ב' || v_bucket_name end,
        'value', v_lvl_sum, 'format', 'money', 'count', v_lvl_n, 'customers', v_lvl_cust,
        'sub', v_lri || v_lvl_n || v_pdi
               || case when v_lvl_n = 1 then ' חשבונית · ' else ' חשבוניות · ' end
               || case when v_level = 2 then coalesce(v_cust_name, '—')
                       when v_lvl_cust = 1 then 'לקוח אחד'
                       else v_lri || v_lvl_cust || v_pdi || ' לקוחות' end,
        'window', 'נכון להיום · אינו מושפע ממסנן התקופה',
        -- why (F3): ברמה 1 יש תקופה-קודמת מדידה (אותו דלי, חודש אחורה). ברמה 2 אין —
        --           והמוקאפ אומר זאת במפורש ("אין תקופה-קודמת ברמת-לקוח").
        'compare', case when v_level = 1 and v_terms is not null then jsonb_build_object(
          'value', v_prev_lvl_sum, 'count', v_prev_lvl_n, 'label', 'לפני חודש במדרג זה', 'note', null,
          'direction', case when v_lvl_sum > v_prev_lvl_sum then 'up'
                            when v_lvl_sum < v_prev_lvl_sum then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'share_of_open', 'label', 'חלק מסך-החוב הפתוח',
        'value', round(100.0 * v_lvl_sum / nullif(v_total_sum, 0), 1), 'format', 'percent',
        'sub', v_lri || to_char(round(v_lvl_sum), 'FM999,999,999') || ' ₪' || v_pdi || ' מתוך '
               || v_lri || to_char(round(v_total_sum), 'FM999,999,999') || ' ₪' || v_pdi,
        'window', 'נכון להיום',
        'compare', case when v_level = 1 and v_terms is not null and coalesce(v_prev_sum, 0) > 0
          then jsonb_build_object(
            'value', round(100.0 * v_prev_lvl_sum / nullif(v_prev_sum, 0), 1), 'label', 'לפני חודש',
            'note', v_lri || to_char(round(v_prev_lvl_sum), 'FM999,999,999') || ' ₪' || v_pdi || ' מתוך '
                    || v_lri || to_char(round(v_prev_sum), 'FM999,999,999') || ' ₪' || v_pdi,
            'direction', case
              when round(100.0 * v_lvl_sum / nullif(v_total_sum, 0), 1)
                 > round(100.0 * v_prev_lvl_sum / nullif(v_prev_sum, 0), 1) then 'up'
              when round(100.0 * v_lvl_sum / nullif(v_total_sum, 0), 1)
                 < round(100.0 * v_prev_lvl_sum / nullif(v_prev_sum, 0), 1) then 'down'
              else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'oldest_invoice', 'label', 'החשבונית הישנה ביותר',
        'value', v_lvl_oldest, 'format', 'days',
        'sub', 'ימים מעבר למועד-הפירעון החוזי',
        'window', 'נכון להיום', 'compare', null, 'target', null),
      jsonb_build_object('key', 'median_days_to_pay', 'label', 'ימים לתשלום (חציון)',
        'value', v_median_pay, 'format', 'days', 'count', v_paid_n,
        'sub', 'על ' || v_lri || v_paid_n || v_pdi || ' חשבוניות ששולמו, כל הזמנים · אינו '
               || v_lri || 'DSO' || v_pdi,
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
    -- why (F4 · F5): התאמת-מספר בעברית ומפרידי-אלפים. הנוסח הקודם ייצר "1 חשבוניות אצל
    --                3 לקוחות" על מסך שהראה חשבונית אחת של לקוח אחד.
    v_so_what := case when v_terms is null then null else
        'לגבות ' || v_lri || to_char(round(v_lvl_sum), 'FM999,999,999') || ' ₪' || v_pdi || ' '
        || case when v_level = 2 then 'מהלקוח ' || coalesce(v_cust_name, '—') else v_cust_phrase end
        || ' ב' || v_bucket_name || ' — ' || v_lri || v_lvl_n || v_pdi
        || case when v_lvl_n = 1 then ' חשבונית, שממתינה' else ' חשבוניות, והוותיקה ממתינה' end
        || ' כבר ' || v_lri || coalesce(v_lvl_oldest, 0) || v_pdi
        || case when coalesce(v_lvl_oldest, 0) = 1 then ' יום' else ' ימים' end || '.' end;
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_total_n,
      'label', 'אוכלוסייה: חשבוניות שנשלחו, טרם שולמו ולא נמחקו כחוב-אבוד · הוצאו: חוב אבוד ('
               || v_lri || v_written_n || v_pdi || ') ופרויקטים שטרם חויבו · n='
               || v_lri || v_total_n || v_pdi
               || ' · נכון להיום — זהו צילום-רגע ולא סיכום-תקופה, ואינו מושפע ממסנן התקופה. '
               || 'ולגרף שלמטה אוכלוסייה צרה יותר: הוא מציג חוב באיחור בלבד — ארבעת דליי-האיחור, '
               || v_lri || (v_total_n - v_cur_n) || v_pdi || ' חשבוניות. "שוטף" ('
               || v_lri || v_cur_n || v_pdi || ' חשבוניות · '
               || v_lri || to_char(round(v_cur_sum), 'FM999,999,999') || ' ₪' || v_pdi
               || ') הוצא מהגרף לאריח שלצידו, כי טרם הגיע מועד תשלומן — הן אינן חוב באיחור. '
               || 'האריחים והטבלה ממשיכים לכסות את כל ' || v_lri || v_total_n || v_pdi || '.',
      'excluded', jsonb_build_object('חוב אבוד', v_written_n)),
    -- why (F10): ‏`from`/`to` ריקים. לשונית שבונה כותרת-משנה של תקופה מ-`window` הייתה
    --            מדפיסה על הדף הזה טווח שהוא עצמו מצהיר שהוא מתעלם ממנו.
    'window', jsonb_build_object('from', null, 'to', null, 'label', 'נכון להיום'),
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
    'definitions', 'מדרג-גיול נמדד מול מועד-הפירעון (יום השליחה + '
      || v_lri || coalesce(v_terms::text, '—') || v_pdi
      || ' ימי תנאי-תשלום), לא מול יום השליחה, ונכון להיום · "שוטף" = טרם הגיע מועד-הפירעון, '
      || 'לא "שולם" · "ימים לתשלום (חציון)" = חציון (תאריך-תשלום − תאריך-חשבונית) על חשבוניות '
      || 'ששולמו, כל הזמנים, ואינו DSO · "חוב אבוד" מוחרג לגמרי מהיתרה ומכל המדרגים.',
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
        'חובות אבודים: ' || v_lri || v_written_n || v_pdi
          || case when v_written_n = 1 then ' חשבונית · ' else ' חשבוניות · ' end
          || v_lri || to_char(round(v_written_sum), 'FM999,999,999') || ' ₪' || v_pdi
          || ' — מוחרגים מהיתרה ומכל המדרגים.',
        'החשבונית הישנה ביותר: ' || v_lri || coalesce(v_oldest_days, 0) || v_pdi || ' ימי איחור · '
          || coalesce(v_oldest_name, '—') || ' · נשלחה '
          || v_lri || coalesce(to_char(v_oldest_sent, 'DD/MM/YYYY'), '—') || v_pdi || '.',
        'כל מספרי הדף הם צילום-רגע נכון להיום; מסנן-התקופה אינו מזיז אותם.'),
      -- 📑ב#6: מדרג עם 0 שורות **אינו לחיץ**; המסך זקוק ל-`n` פר-דלי כדי לדעת זאת.
      'current_tile', jsonb_build_object('label', 'שוטף — עוד לא באיחור', 'value', v_cur_sum,
        'count', v_cur_n, 'compare_value', v_cur_prev, 'compare_count', v_cur_prev_n,
        'drill', jsonb_build_object('bucket', 'current')),
      'overdue_only', jsonb_build_object('n', v_total_n - v_cur_n, 'amount', v_total_sum - v_cur_sum),
      'previous_snapshot', jsonb_build_object('asof', v_asof - 30, 'n', v_prev_n, 'amount', v_prev_sum),
      'asof', v_asof,
      -- `p_from`/`p_to` מוחזרים כאן ולא ב-`window`, כדי שיהיה גלוי שהתקבלו ולא שימשו.
      'period_filter_ignored', jsonb_build_object('p_from', p_from, 'p_to', p_to),
      'export_blocked_reason', null,
      'run', null)
  );
end;
$function$;

comment on function public.report_m09_aging(date, date, integer, jsonb, date) is
  'מודול 11 · גיול חובות (מ9), דוח-דריל. אוכלוסייה: חשבוניות שנשלחו, טרם שולמו ולא נמחקו כחוב-אבוד · הוצאו: חוב אבוד ופרויקטים שטרם חויבו. צילום-רגע נכון להיום: p_from/p_to מתקבלים ואינם משפיעים (הם מוחזרים ב-meta.period_filter_ignored), ו-p_asof קיים לשחזור האורקל בלבד — הלקוח אינו שולח אותו. ימי-איחור נמדדים מול מועד-הפירעון (invoice_sent_at + תנאי_תשלום_ימים) ולא מול יום השליחה, ושלילי נקטע לאפס = שוטף. קריאה בלבד, מגודר על מודול כספים.';

revoke execute on function public.report_m09_aging(date, date, integer, jsonb, date) from public, anon, authenticated;
grant execute on function public.report_m09_aging(date, date, integer, jsonb, date) to authenticated;


-- =============================================================================
-- ‏④ `report_m12_equipment` — צריכת ציוד · "כמה ציוד נצרך וכמה להזמין?"
-- =============================================================================
-- החתימה **לא** השתנתה ⇒ `create or replace` בלבד.
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
  v_lri          constant text := chr(8294);
  v_pdi          constant text := chr(8297);
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
  v_gap_pct      numeric;
  v_prev_gap_pct numeric;
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
                     -- why (F7): צורת-`drill_key` אחידה — `kind` + השדה המזהה.
                     'drill_key', jsonb_build_object('kind', 'sku', 'sku', sku)) as t
              from priced group by sku, item_name) s),
         -- טבלת-ההחלטה: כמה להזמין ל-30 הימים הקרובים. **מבוטלים מוחרגים** — שורה שכללה
         -- אירוע מבוטל ניפחה בעבר את הכמות, וזו הטבלה שממנה יוצאת הזמנת-רכש בפועל.
         (select coalesce(jsonb_agg(t order by (t ->> 'qty')::numeric desc), '[]'::jsonb) from (
            select jsonb_build_object('sku', sku, 'item_name', coalesce(item_name, sku),
                     'qty', sum(planned_qty), 'events', count(distinct project_id),
                     'drill_key', jsonb_build_object('kind', 'sku', 'sku', sku, 'upcoming', true)) as t
              from priced
             where final_event_date > v_to and final_event_date <= v_to + 30
               and project_status <> 'cancelled'
             group by sku, item_name) s),
         (select coalesce(jsonb_agg(jsonb_build_object(
            'project_id', pc3.project_id, 'sku', pc3.sku,
            'item_name', coalesce(pc3.item_name, pc3.sku),
            'planned_qty', pc3.planned_qty, 'actual_qty', pc3.actual_qty,
            'estimated_cost', round(pc3.planned_qty * su.est),
            'drill_key', jsonb_build_object('kind', 'project', 'id', pc3.project_id))), '[]'::jsonb)
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

  -- why (F10): הפער ותאומו אשתקד מחושבים פעם אחת לתוך משתנים, כדי שכיוון-ההשוואה יהיה
  --            השוואה בין שני מספרים ולא ביטוי מוצלב. הענף `else 'down'` הקודם החזיר
  --            "ירד" גם כשהמכנה של אשתקד היה 0, כלומר כשלא היה מה להשוות אליו.
  v_gap_pct      := round(100.0 * (v_planned_w - v_actual_w) / nullif(v_planned_w, 0), 1);
  v_prev_gap_pct := round(100.0 * (v_prev_planned - v_prev_actual) / nullif(v_prev_planned, 0), 1);

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_total_rows,
      -- why (F5): גם מונה-שורות הוא מספר בתוך משפט. ‏1771 בלי מפריד-אלפים הוא בדיוק
      --           הדפוס שהממצא מצא, ולא רק ב-₪.
      'label', 'אוכלוסייה: כל ' || v_lri || to_char(v_total_rows, 'FM999,999,999') || v_pdi
               || ' שורות הלוגיסטיקה, כלל-הזמנים, כולל פרויקטים מבוטלים · הוצאו: אין · n='
               || v_lri || to_char(v_total_rows, 'FM999,999,999') || v_pdi || ', מתוכן '
               || v_lri || to_char(v_future_rows, 'FM999,999,999') || v_pdi
               || ' שייכות לאירועים שטרם התקיימו. בלוק ההזמנה למטה חותך לאירועים שטרם התקיימו ('
               || v_lri || to_char(v_to, 'DD/MM') || '–' || to_char(v_to + 30, 'DD/MM') || v_pdi || ').',
      'excluded', jsonb_build_object()),
    'window', jsonb_build_object('from', v_from, 'to', v_to,
      'label', v_lri || to_char(v_to, 'YYYY') || ' (' || to_char(v_from, 'DD/MM') || '–'
               || to_char(v_to, 'DD/MM') || ')' || v_pdi),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'cost_window', 'label', 'עלות ציוד בתקופה',
        'value', v_cost_window, 'format', 'money', 'count', v_rows_window,
        'sub', v_lri || v_rows_window || v_pdi
               || case when v_rows_window = 1 then ' שורת-לוגיסטיקה בתקופה' else ' שורות-לוגיסטיקה בתקופה' end,
        'window', 'התקופה שנבחרה',
        'compare', jsonb_build_object('value', v_prev_cost,
          'label', v_lri || to_char(v_prev_to, 'YYYY') || v_pdi || ' באותו טווח', 'note', null,
          'direction', case when v_cost_window > v_prev_cost then 'up'
                            when v_cost_window < v_prev_cost then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object('key', 'gap_pct', 'label', 'פער הוזמן מול הגיע',
        'value', v_gap_pct, 'format', 'percent',
        -- why (F6): שני המספרים שהמוקאפ מדפיס מתחת ל-3.3% לא היו קיימים בפיילוד כלל.
        --           אחוז בלי מונה ומכנה הוא בדיוק מה ש-📑ב אוסר.
        'sub', v_lri || to_char(v_planned_w - v_actual_w, 'FM999,999,999') || v_pdi || ' יחידות מתוך '
               || v_lri || to_char(v_planned_w, 'FM999,999,999') || v_pdi || ' מתוכננות',
        'window', 'התקופה שנבחרה',
        'compare', case when v_prev_gap_pct is null then null else jsonb_build_object(
          'value', v_prev_gap_pct,
          'label', v_lri || to_char(v_prev_to, 'YYYY') || v_pdi || ' באותו טווח',
          'note', v_lri || to_char(v_prev_planned - v_prev_actual, 'FM999,999,999') || v_pdi
                  || ' יחידות מתוך ' || v_lri || to_char(v_prev_planned, 'FM999,999,999') || v_pdi,
          'direction', case when v_gap_pct is null then null
                            when v_gap_pct > v_prev_gap_pct then 'up'
                            when v_gap_pct < v_prev_gap_pct then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'cost_all_time', 'label', 'עלות ציוד — כל הזמנים',
        'value', v_cost_all, 'format', 'money',
        'sub', 'סכום ' || v_lri || v_sku_n || v_pdi || ' המוצרים בטבלה למטה',
        'window', 'כל הזמנים',
        'compare', null, 'target', null),
      jsonb_build_object('key', 'no_cost_source', 'label', 'שורות ציוד במחיר מוערך',
        'value', v_nosrc_n, 'format', 'int', 'amount', v_nosrc_sum,
        'sub', 'מתוך ' || v_lri || to_char(v_total_rows, 'FM999,999,999') || v_pdi || ' שורות · כ-'
               || v_lri || to_char(round(v_nosrc_sum), 'FM999,999,999') || ' ₪' || v_pdi
               || ' שהמחיר שלהן מוערך',
        'window', 'כל הזמנים',
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
        'להזמין ' || v_lri || to_char(v_top_qty, 'FM999,999,999') || v_pdi
        || case when v_top_qty = 1 then ' יחידה של "' else ' יחידות של "' end
        || v_top_order || '" ל-' || v_lri || v_top_events || v_pdi
        || case when v_top_events = 1 then ' האירוע שבחודש הקרוב' else ' האירועים שבחודש הקרוב' end
        || ' — הכמות הגדולה ביותר בטבלת-ההזמנה.'
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
        'נמדד על ' || v_lri || to_char(v_measured_n, 'FM999,999,999') || v_pdi || ' שורות מתוך '
          || v_lri || to_char(v_total_rows, 'FM999,999,999') || v_pdi
          || ' — בשאר, "הגיע בפועל" הועתק מהמתוכנן ולא נמדד.',
        v_lri || v_nosrc_n || v_pdi
          || case when v_nosrc_n = 1 then ' שורת ציוד ללא מקור-עלות · כ-' else ' שורות ציוד ללא מקור-עלות · כ-' end
          || v_lri || to_char(round(v_nosrc_sum), 'FM999,999,999') || ' ₪' || v_pdi
          || ' — מחירן מוערך לפי ממוצע-המוצר ואינו נמדד.',
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
      -- why (F10): הכרטיס כותב "9 מק"טים" ולמספר לא היה בית בפיילוד. הוא חושב ולא הוחזר.
      'sku_count', v_sku_n,
      'gap_units', jsonb_build_object('planned', v_planned_w, 'actual', v_actual_w,
        'gap', v_planned_w - v_actual_w),
      'export_blocked_reason', null,
      'run', null)
  );
end;
$function$;

comment on function public.report_m12_equipment(date, date, integer, jsonb) is
  'מודול 11 · צריכת ציוד (מ12). אוכלוסייה: כל שורות הלוגיסטיקה, כלל-הזמנים, כולל פרויקטים מבוטלים · הוצאו: אין. בלוק ההזמנה חותך לאירועים שטרם התקיימו ב-30 הימים הקרובים ומחריג מבוטלים. בסיס-הכמות הוא planned_qty (המוזמן) לפי הכרעה 5; actual_qty מוצג כעמודת-פער בלבד. קריאה בלבד, מגודר על מודול כספים.';

revoke execute on function public.report_m12_equipment(date, date, integer, jsonb) from public, anon, authenticated;
grant execute on function public.report_m12_equipment(date, date, integer, jsonb) to authenticated;
