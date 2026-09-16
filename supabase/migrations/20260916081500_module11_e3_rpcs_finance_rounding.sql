-- =============================================================================
-- מודול 11 · מיגרציה E3 · הכרעת-סדר-העיגול באריח "שכר דיילות החודש" (מ7)
-- =============================================================================
-- 🎯 **מה זה:** שינוי אחד, מוכרע, בפונקציה אחת. ‏`report_m07_finance_overview` נבנית מחדש
--    **מהגוף החי** — ‏`md5(prosrc)` נמשך והושווה לגוף שבקובץ E2 לפני הכתיבה והם זהים
--    (`03530a7043684c1cd0faf99378f7815e`, ‏23,071 תווים בשני הצדדים) ⇒ הגוף שלמטה הוא
--    הגוף החי, עם שלושה ביטויים ותיבת-הערה אחת שהוחלפו ותו לא.
--    **אין טבלה חדשה, אין עמודה חדשה, אין policy חדשה, אין שינוי-חתימה, אין כתיבה.**
--    ‏`20260916063400_module11_e2_rpcs_finance_fixes.sql` **אינו נערך** — הוא הוחל, ומיגרציה
--    שהוחלה מתוקנת אך ורק במיגרציה חדשה קדימה (`supabase/migrations/CLAUDE.md §2`).
--
-- 🔻 **אין `drop`, ולמה:** החתימה אינה משתנה — חמישה פרמטרים, בדיוק כפי ש-E2 השאירה אותה
--    (`date, date, integer, jsonb, date`) ⇒ ‏`create or replace` אינו יוצר עומס-יתר חדש,
--    ואין קריאת-PostgREST שעלולה להפוך ל-ambiguous. ‏`comment` · `revoke` · `grant` חוזרים
--    כאן מילה-במילה כפי ש-E2 כתבה אותם, כדי שהגדרת-הפונקציה תישאר שלמה בקובץ אחד.
--
-- 🧭 **ההכרעה (D-21 · `docs/micro_guides/module-11.md §9`) — טכנית והפיכה:**
--    ‏E2 (ממצא F10א) יישמה `hostess_pay_month = sum(round(actual_hours * hourly_rate_snapshot))`
--    לפי הניסוח המוקדם, **והצהירה על הפער בכנות**: ‏**19,257 ₪ לאוגוסט 2026 מול 19,253 ₪**
--    במוקאפ המאושר וב-`signoff-baseline-2026-09-10.md` (= `round(19,252.5)`). ההכרעה נהפכת
--    לטובת קו-הבסיס, על שלושה מקורות שמסכימים ביניהם:
--    ① **קו-הבסיס הוא קריטריון-הקבלה** — *"16 המשטחים מציגים את מספרי signoff-baseline"*
--       (תוכנית מודול 11 §5). פער מול קו-הבסיס הוא ממצא; כאן הוא הוכרע, לא הושתק.
--    ② **ה-SSOT של השכר במודול 8 מעגל פר-שורה לאגורות, לא לשקלים:**
--       ‏`generate_salary_report` מחשב `round(c.hours * c.rate + c.bonus + c.travel, 2)`
--       (נמשך מ-`prosrc` החי 16/09/2026; מתועד ב-`src/lib/salaryReport.js:32`) ⇒ **הסכום
--       ששולם בפועל נושא אגורות**, והשלם התואם אותו הוא `round(sum(...))` — עיגול פר-שורה
--       לשקל שלם ממציא עיגול שאיש לא שילם.
--    ③ **הכרטיס מבטיח "₪ בלי אגורות" בלבד** ואינו קובע סדר ⇒ אינו סותר.
--    ⇒ **`round(sum(actual_hours * hourly_rate_snapshot))` בשלושת המקומות:** ערך-האריח,
--       ההשוואה לחודש-הקודם, ומדידת 30-הימים-הנגללים ב-`meta.open_items`. שלושתם, כי שני
--       מספרים על אותו מסך שנמדדים בשתי שיטות הם הבאג הבא.
--
-- 🪤 **המלכודת שבהיפוך, למי שיקרא את ה-diff:** ‏`filter (where …)` נצמד ל**פונקציית-צבירה**
--    בלבד. ‏`round(sum(x)) filter (…)` **אינו נפרס** — ‏`round` אינה צוברת. לכן ההיפוך אינו
--    החלפת-אסימון אלא הזזת-סוגר: ‏`coalesce(round(sum(x) filter (…)), 0)`. שלוש הפעמים
--    נכתבו כך. ‏**`coalesce` נשאר במקומו ולא התייתר:** בלי שורות `sum` מחזירה `null`,
--    ‏`round(null)` הוא `null`, וה-`0` עדיין בא ממנו — הסמנטיקה של קבוצה-ריקה לא זזה.
--
-- 🚫 **מה שנבדק ו*לא* שונה — ‏`report_m09_aging`:** ההוראה הייתה להוסיף `meta.row_total`
--    ו-`columns[].sorted` **אם** רמת-השורש מחזירה מעל 50 שורות בלי תקרה. **נמדד חי
--    16/09/2026 בקריאה מזוהה כמנהלת-כספים: ‏`rows.length` = 35 = `population.n`**, והגוף
--    אינו נושא `limit` ברמת-השורש כלל ⇒ הפאג'ר כבר סופר בדיוק את מה שהטבלה מציגה (📐8),
--    ו-`meta.row_total` היה שדה כפול שאיש אינו קורא. **התנאי לא התקיים ⇒ מ9 לא נגעה.**
--
-- 🧮 **קונבנציות שלא השתנו:** "היום" = `(now() at time zone 'Asia/Jerusalem')::date` ·
--    מכנה אפס דרך `nullif` · חלון-תקופה קלנדרי סגור משני קצותיו וחלון נגלל חצי-פתוח (D-17) ·
--    ‏`security definer` + `search_path` ריק + שער `assert_module_permission` בשורה הראשונה.
--
-- 🔻 **אימות אחרי ההחלה** (קריאה-בלבד, בהתחזות, positive control קודם):
--   -- (א) ‏`md5(prosrc)` של מ7 == ‏`md5` של גוף-הפונקציה בקובץ הזה.
--   -- (ב) מנהלת-כספים · `p_from='2026-08-01'`, `p_to='2026-08-31'` ⇒ `hostess_pay_month.value`
--        = **19253** (היה 19,257), ‏`count` = **83** משמרות — לא זז.
--   -- (ג) `compare` של אותו אריח = יולי, מחושב **באותו סדר** (‏`round(sum(...))`).
--   -- (ד) ‏`meta.open_items.card_8_7_5.rolling_30.hostess_pay` נמדד באותו סדר.
--   -- (ה) מנהלת-גיוס ⇒ `42501`, ולא jsonb ריק.
-- =============================================================================


-- =============================================================================
-- ‏① `report_m07_finance_overview` — מבט-על כספים · "מה מצב הכסף?"
-- =============================================================================
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

  -- why (E3 · D-21): ‏₪ בלי אגורות **בפיילוד ולא רק בתצוגה**, ו**הסדר הוא `round(sum(...))`**
  --            ולא `sum(round(...))`. ‏E2 עיגל פר-שורה והחזיר 19,257 ₪ לאוגוסט 2026, בעוד
  --            קו-הבסיס (`signoff-baseline-2026-09-10.md`) והמוקאפ המאושר כותבים 19,253 ₪
  --            (= `round(19,252.5)`) — והפער, 4 ₪, הוא כולו הסדר. שלושה מקורות מכריעים לסדר
  --            הזה: ① קו-הבסיס הוא קריטריון-הקבלה של המשטחים · ② ה-SSOT של השכר (מ8) מעגל
  --            **פר-שורה לאגורות** — ‏`generate_salary_report` מחשב
  --            `round(c.hours * c.rate + c.bonus + c.travel, 2)` (נמשך מ-`prosrc` החי 16/09,
  --            ומתועד ב-`src/lib/salaryReport.js:32`) ⇒ השלם שתואם את מה ש**משולם בפועל**
  --            הוא עיגול-הסכום · ③ הכרטיס מבטיח "₪ בלי אגורות" בלבד ואינו קובע סדר.
  --            🔴 שלושת המקומות יחד — האריח, ההשוואה לחודש-הקודם, ומדידת 30-הימים-הנגללים
  --            ב-`meta.open_items` — אחרת שני מספרים על אותו מסך נמדדים בשתי שיטות.
  select coalesce(round(sum(a.actual_hours * a.hourly_rate_snapshot)
                    filter (where a.event_date >= date_trunc('month', v_to)::date and a.event_date <= v_to)), 0),
         count(*) filter (where a.event_date >= date_trunc('month', v_to)::date and a.event_date <= v_to)::integer,
         coalesce(round(sum(a.actual_hours * a.hourly_rate_snapshot)
                    filter (where a.event_date >= v_prev_month
                              and a.event_date < date_trunc('month', v_to)::date)), 0),
         count(*) filter (where a.event_date >= v_prev_month
                            and a.event_date < date_trunc('month', v_to)::date)::integer,
         coalesce(round(sum(a.actual_hours * a.hourly_rate_snapshot)
                    filter (where a.event_date > v_to - 30 and a.event_date <= v_to)), 0)
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
