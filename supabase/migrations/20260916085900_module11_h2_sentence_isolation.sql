-- =============================================================================
-- מודול 11 · מיגרציה H2 · משפטים שהשרת בונה: ‏`n=` בתוך הבידוד · מפריד-אלפים
-- =============================================================================
-- 🎯 **מה זה:** מיגרציית תיקון-קדימה אחת, חוצת-לשוניות, על **שבע** פונקציות-דוח:
--    ‏`report_m07_finance_overview` · `report_m08_profitability` · `report_m09_aging` ·
--    ‏`report_m12_equipment` (כספים) · `report_m14_hostess_overview` ·
--    ‏`report_m15_reliability` · `report_m17_fairness` (דיילות).
--    **רק מחרוזות זזות.** אין טבלה חדשה, אין עמודה, אין policy, אין שינוי-חתימה,
--    אין כתיבה, ואף ערך מספרי ב-`tiles[].value` אינו משתנה.
--
-- 🔻 **אין `drop`, ולמה:** אף חתימה אינה משתנה ⇒ ‏`create or replace` אינו יוצר עומס-יתר
--    חדש ואין קריאת-PostgREST שעלולה להפוך ל-ambiguous. ‏`comment` · `revoke` · `grant`
--    חוזרים כאן מילה-במילה כפי שהמיגרציה הקודמת של כל פונקציה כתבה אותם, כדי שהגדרת
--    הפונקציה תישאר שלמה בקובץ אחד.
--
-- 📐 **מקור הגוף — נמדד, לא זכור:** לכל אחת מהשבע נמשך `md5(prosrc)` מ-`pg_proc` החי
--    ‏16/09/2026 08:5X והושווה ל-`md5` של גוף ה-`$function$` בקובץ המקור, **לפני** שנגענו
--    בתו אחד. שבע מתוך שבע זהות באורך וב-md5 ⇒ הגוף שלמטה **הוא** הגוף החי:
--      ‏m07 ⇐ `20260916081500_module11_e3_rpcs_finance_rounding.sql` (E3 שינתה אותה ב-08:1X;
--             קובץ E2 היה מיושן לה) · m08 · m09 · m12 ⇐ `..._e2_rpcs_finance_fixes.sql`
--             ‏· m14 · m15 · m17 ⇐ `..._f2_rpcs_hostesses_fixes.sql`.
--    שלוש המיגרציות האלה **אינן נערכות** — הן הוחלו, ומיגרציה שהוחלה מתוקנת אך ורק
--    במיגרציה חדשה קדימה (`supabase/migrations/CLAUDE.md §2`).
--
-- 🧾 **שורות `schema_migrations` שהקובץ הזה מייצר — תשע (`§9 D-20`):**
--    ‏`module11_h2_m07` · `module11_h2_m08` · `module11_h2_m09` · `module11_h2_m12` ·
--    ‏`module11_h2_m14` · `module11_h2_m15` · `module11_h2_m17` · ועוד שתיים:
--    ‏`module11_h2_m07_cols` · `module11_h2_m09_cols`. ‏**למה שתי החוזרות:** הפריט השלישי
--    למטה (‏`columns[].format`) הגיע מהמתזמר **אחרי** ש-m07 ו-m09 כבר הוחלו, והן הוחלו שוב
--    מאותו קובץ — תיקון-קדימה באותה טיוטה שטרם נקמטה, בדיוק המקרה ש-D-20 מתאר.
--    ‏MCP `apply_migration` קוטמת סביב 90KB, ולכן הקובץ מוחל פר-פונקציה. **הקובץ הוא
--    מקור-האמת**, וכל גוף שהוחל אומת ב-`md5(prosrc)` מול גוף ה-`$function$` שבו.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- 🪤 **ממצא D1 — הבאג שהמיגרציה הזו קיימת בשבילו.** מקור: הבודק-מחדש של לשונית
--    הדיילות (`scratchpad/results/p2fix-hostesses.json` → `defects_found_outside_f3_gate`),
--    שמדד אותו ב-Chromium אמיתי עם `Range.getBoundingClientRect` ולא הסיק אותו מהקוד.
--    **מה קרה:** הכתיב היה `'… n=' || v_lri || <ערך> || v_pdi` — כלומר ה-`n=` **מחוץ**
--    לבידוד ורק המספר בתוכו. בפסקה `dir="rtl"`, האובייקט-המבודד נחשב **ניטרלי** לרמה
--    שסביבו; לכן ה-`=` שבין ה-`n` (תו לטיני, L) לבינו מקבל את רמת-הפסקה (RTL) ונזרק
--    שמאלה. **הקוראת רואה `106=n` במקום `n=106`.** ‏(`=` אינו נחשב חלק מהמספר אלא אם
--    יש EN משני צדדיו — כאן מימינו יש `n` ומשמאלו ניטרל.)
--    **התיקון:** ‏`'…' || v_lri || 'n=' || <ערך> || v_pdi` — ה-`n=` **בתוך** הבידוד.
--    **שבעה אתרים:** ‏m07 · m08 · m09 · m12 (‏`population.label`) · m17 (`population.label`
--    ושתי הפעמים ב-`tiles[0].compare.label`).
--    ⚠️ **מה במכוון לא נגענו בו:** ב-m14 וב-m15 ה-`n=` יושב ליד מספר **חשוף** בלי בידוד
--    כלל — ואותה מדידה בדפדפן הראתה שהצורה החשופה מתרנדרת **נכון** (`n=1699`), כי כלל
--    ‏W7 הופך את ה-EN ל-L אחרי ה-`n` והניטרל שביניהם נבלע. פתרנו מה שנמדד שבור.
--
-- 🔢 **ממצא D3 — מפריד-אלפים לא עקבי בתוך לשונית אחת.** באותו מקור: ‏m14 הדפיסה
--    ‏`1482 מתוך 1699` ו-`n=1699`, ‏m15 הדפיסה `1482 מתוך 1699` ו-`1683 שיבוצים`, בעוד
--    ‏m17 באותה לשונית מדפיסה `1,869` ו-`2,479`. ‏C5 קובע שמספרים מעוצבים, ולשונית הכספים
--    כבר טיפלה במחלקה הזו בשורת `module11_e2c_finance_m12_population_separators`.
--    **התיקון:** כל מונה בן 4 ספרות ומעלה במשפט שהשרת בונה עובר דרך
--    ‏`to_char(x, 'FM999,999,999')`. **ארבעה משפטים, שישה ביטויים:** ‏m14 `population.label`
--    ‏(`v_pop_n`) ו-`tiles[0].sub` (`v_on_time` · `v_obs`) · m15 `population.label`
--    ‏(`v_shifts_in`) ו-`tiles[0].sub` (`v_on_time` · `v_obs`).
--    🚫 **לא שנים ולא מזהים** — ‏`2025` בהשוואות ו-`1427` (מזהה-פרויקט) ב-`so_what` של m08
--    נשארים חשופים בכוונה. 🚫 **וגם לא מוני-בני-אדם** (‏`98 דיילות`, `87 דיילות`): הם
--    חסומים במאות, והכלל שנמדד מדבר על מוני-שיבוצים.
--    ✅ ארבע פונקציות הכספים כבר עקביות (`1,771` · `130,092` · `236,382` · `700,697`)
--    ולכן לא נגענו בהן כאן מלבד תיקון ה-`n=`.
--
-- 🧱 **פריט שלישי, אדיטיבי — `columns[].format` שמשקר לרנדרר (המתזמר, 16/09/2026 10:1X,
--    מבוני-הלשוניות).** רק **ערכי-`format` בהצהרות-העמודות** זזים; לא מפתח, לא ערך-שורה.
--    **כל עמודה נבדקה מול ערך-השורה החי לפני שנגענו בה** — לא לפי שמה:
--    ‏① **ציון-אמינות:** ‏`format: 'ratio'` הוא ספרה עשרונית אחת ⇒ כל שש הדיילות האדומות
--       הופיעו כ-`0.8` ליד סף שהוא `0.833771`. ‏⇒ `'score'` (שלוש ספרות אצל הלקוח).
--       ‏`report_m14_hostess_overview` (‏`reliability`) · `report_m15_reliability` (`reliability`).
--    ‏② **תאריכים:** ‏`format: 'text'` מרנדר ‏ISO (`2025-01-14`) במקום `DD/MM/YYYY` ⇒ `'date'`.
--       ‏`report_m07_finance_overview` `sent_date` · `report_m09_aging` `sent_date` + `due_date`
--       **בשתי הרמות** (שורש ורמה-2, ולכן ארבע הצהרות) · `report_m14_hostess_overview`
--       ‏`last_shift_date` (ערך חי `2026-08-20`).
--    🚫 **ולא שונה:** ‏m08 · m12 · m15 · m17 **אין בהן עמודת-תאריך כלל** (נבדק על כל
--       הצהרות-העמודות, כולל `meta.extra_tables[].columns`), ו-m17 אין בה עמודת-ציון-אמינות.
--       ‏מ16 מופיעה בהוראה אך **אינה בקובץ הזה** — היא בבעלות סוכן אחר.
--
-- 🧪 **ה"נקודה העיוורת" השלישית — נמדדה, ו*לא* נפתחה, כי אין מה לתקן.** הבודק-מחדש הותיר
--    שאלה בדוקה: האם ה-Gini של m14 נחתך ל-`least(v_to, v_today)` כמו זה של m17, או שעל
--    חלון עתידי שני המסכים יצטטו שני מספרים. **נמדד חי כמנכ"ל 16/09/2026 עם
--    ‏`{p_from:'2025-09-16', p_to:'2027-09-16'}`: ‏m14 = 0.4581 · m17 = 0.4581** — שווים,
--    ושווים גם לחלון ברירת-המחדל (0.4581), כלומר שניהם באמת נחתכים. גם בקוד: ה-CTE של
--    ‏m14 נושא `and a.event_date <= least(v_to, v_today)` בדיוק כמו זה של m17.
--    ⇒ **שום חיתוך לא נוסף כאן.** (והקריאה לא הייתה ריקה: על אותו חלון עתידי מונה
--    ההחרגה `סירובים` של m14 זז 343 ⇐ 409, כלומר הפרמטר אכן שינה התנהגות.)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- ↩️ **ביטול (לא מורץ — כאן כדי שההפיכוּת תהיה כתובה ולא מסופרת):** אין `drop`.
--    להחזרה — להחיל מחדש את גוף הפונקציה מקובץ-המקור שלה שלמעלה (‏E3 ל-m07 · E2 ל-m08
--    ‏· m09 · m12 · F2 ל-m14 · m15 · m17), שהוא בדיוק הגוף שקדם לקובץ הזה.
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
               || v_lri || v_written_n || v_pdi || ') ופרויקטים שטרם חויבו · '
               || v_lri || 'n=' || v_open_n || v_pdi
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
      jsonb_build_object('key', 'sent_date', 'label', 'נשלחה', 'format', 'date', 'align', 'start'),
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
               || v_lri || v_excl_status || v_pdi || ') · ' || v_lri || 'n=' || v_n || v_pdi
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
      jsonb_build_object('key', 'sent_date', 'label', 'נשלחה', 'format', 'date', 'align', 'start'),
      jsonb_build_object('key', 'due_date', 'label', 'מועד-פירעון חוזי', 'format', 'date', 'align', 'start'),
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
        jsonb_build_object('key', 'sent_date', 'label', 'נשלחה', 'format', 'date', 'align', 'start'),
        jsonb_build_object('key', 'due_date', 'label', 'מועד-פירעון חוזי', 'format', 'date', 'align', 'start'),
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
               || v_lri || v_written_n || v_pdi || ') ופרויקטים שטרם חויבו · '
               || v_lri || 'n=' || v_total_n || v_pdi
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
               || ' שורות הלוגיסטיקה, כלל-הזמנים, כולל פרויקטים מבוטלים · הוצאו: אין · '
               || v_lri || 'n=' || to_char(v_total_rows, 'FM999,999,999') || v_pdi || ', מתוכן '
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

create or replace function public.report_m14_hostess_overview(
  p_from        date    default null,
  p_to          date    default null,
  p_customer_id integer default null,
  p_drill       jsonb   default null
) returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  -- שעון-ישראל ולא UTC: אחרי חצות `current_date` עדיין "אתמול" — המוקש שנמדד 26/08/2026.
  v_today       date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to          date;
  v_from        date;
  v_prev_to     date;
  v_prev_from   date;
  v_missing     text[] := array[]::text[];
  v_notes       jsonb  := '[]'::jsonb;
  v_m           numeric;
  v_min_sample  numeric;
  v_red_coef    numeric;
  v_amber_coef  numeric;
  v_c           numeric;
  v_c_prev      numeric;
  v_obs         integer;
  v_on_time     integer;
  v_on_time_pct numeric;
  v_prev_obs    integer;
  v_prev_on     integer;
  v_prev_pct    numeric;
  v_red         integer;
  v_amber       integer;
  v_red_active  integer;
  v_in_report   integer;
  v_prev_red    integer;
  v_gini        numeric;
  v_gini_prev   numeric;
  v_gini_n      integer;
  v_gini_prev_n integer;
  v_shifts      integer;
  v_top_q_pct   numeric;
  v_top_q_n     integer;
  v_bottom_pct  numeric;
  v_active      integer;
  v_registered  integer;
  v_worked      integer;
  v_gap_events  integer;
  v_upcoming    integer;
  v_gap_places  integer;
  v_gap_pending integer;
  v_prev_gap    integer;
  v_prev_upcom  integer;
  v_chart       jsonb;
  v_rows        jsonb;
  v_excluded    jsonb;
  v_unmarked    jsonb;
  v_pop_n       integer;
  v_pop_hosts   integer;
  v_order_note  text;
  v_bands_on    boolean;
  -- 🔴 **חלון-התור קפוא** (F2, 16/09/2026): 12 חודשים אחורה מהיום, ואינו נגרר אחרי
  --    מסנן-התקופה — כרטיס `cards-hostesses.md` ③ שורת "דיילות אדומות" נוקב
  --    *"חלון קפוא 12 חודשים (📑ב#13)"*. שאר אריחי-הדף כן זזים עם המסנן.
  v_frz_to      date;
  v_frz_from    date;
  v_frz_prev    date;
  v_c_frozen    numeric;
  -- 📐3 · **תווית-החלון נגזרת מהחלון, ולא קבועה בקוד** (F2): נמדד 16/09/2026 שעל
  --    הפריסט "חודש אחרון" אריח "הגעה בזמן" הציג ‏93.9%‏ עם התווית *"12 החודשים
  --    האחרונים"* — אותה מחלקה בדיוק של אריח-התור, תו אחד משם.
  v_win_text    text;
  v_win_full    text;
begin
  perform public.assert_module_permission('דיילות', array['edit', 'view']);

  -- חלון חצי-פתוח `(from, to]`, ברירת-מחדל 12 חודשים עד היום (שעון-ישראל).
  v_to        := coalesce(p_to, v_today);
  v_from      := coalesce(p_from, (v_to - interval '12 months')::date);
  v_prev_to   := v_from;
  v_prev_from := (v_from - (v_to - v_from))::date;

  -- 🔴 **חלון-התור, קפוא — אותה אריתמטיקה בדיוק של `report_m15_reliability`**
  --    (‏`v_to := v_today` · 12 חודשים אחורה · תקופה-קודמת 12 חודשים לפניה), כדי ששני
  --    המסכים יראו את אותו תור ואת אותו ממוצע-חברה. **בלי זה, על הפריסט "חודש אחרון"
  --    האריח החזיר 0 אדומות בעוד דף-האמינות הראה 6, והתווית עדיין אמרה "חלון קפוא"** —
  --    נמדד 16/09/2026 (0 מתוך 4 דיילות, במקום 6 מתוך 87).
  v_frz_to    := v_today;
  v_frz_from  := (v_frz_to - interval '12 months')::date;
  v_frz_prev  := (v_frz_from - interval '12 months')::date;

  v_win_text  := case when v_from = (v_to - interval '12 months')::date then '12 החודשים האחרונים'
                      else to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') end;
  v_win_full  := v_win_text || case when v_from = (v_to - interval '12 months')::date
                                    then ' (' || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || ')'
                                    else '' end;

  -- ── פרמטרים, בזמן-ריצה. שורה חסרה = שם ב-`missing_params`, לא ברירת-מחדל שקטה.
  select nullif(btrim(pa.param_value), '')::numeric into v_m
    from public.params pa where pa.param_name = 'קבוע_ריסון_m';
  if v_m is null then v_missing := v_missing || 'קבוע_ריסון_m'; end if;

  select nullif(btrim(pa.param_value), '')::numeric into v_min_sample
    from public.params pa where pa.param_name = 'מינימום_תשובות_להצגת_ציון';
  if v_min_sample is null then v_missing := v_missing || 'מינימום_תשובות_להצגת_ציון'; end if;

  select nullif(btrim(pa.param_value), '')::numeric into v_red_coef
    from public.params pa where pa.param_name = 'מקדם_אמינות_אדום';
  if v_red_coef is null then v_missing := v_missing || 'מקדם_אמינות_אדום'; end if;

  select nullif(btrim(pa.param_value), '')::numeric into v_amber_coef
    from public.params pa where pa.param_name = 'מקדם_אמינות_ענבר';
  if v_amber_coef is null then v_missing := v_missing || 'מקדם_אמינות_ענבר'; end if;

  -- 🔴 שומר-סדר-המקדמים: היפוך שקט של שני הצבעים על המסך שכל עניינו את מי לא לשלוח.
  if v_red_coef is not null and v_amber_coef is not null and v_red_coef >= v_amber_coef then
    v_order_note := 'סימון האמינות כבוי: מקדם_אמינות_אדום (' || v_red_coef ||
                    ') אינו נמוך ממקדם_אמינות_ענבר (' || v_amber_coef ||
                    '), ולכן שני התגים היו מתהפכים. תקני את הערכים בהגדרות המערכת כדי להחזיר את הצבעים.';
    v_notes := v_notes || to_jsonb(v_order_note);
  end if;

  if p_customer_id is not null then
    v_notes := v_notes || to_jsonb(
      'הדף אינו מושפע ממסנן הלקוח — ציון-האמינות והספים נמדדים מול ממוצע כלל המאגר, וחתך לפי לקוח היה מגדיר מחדש את הממוצע עצמו.'::text);
  end if;

  v_bands_on := v_red_coef is not null and v_amber_coef is not null and v_red_coef < v_amber_coef;

  -- 📐3 · 📑ב#13 — האריח מצהיר את חלונו, וזה המשפט שהמסך מציג לידו.
  v_notes := v_notes || to_jsonb(
    ('אריח "דיילות אדומות" נמדד תמיד על 12 החודשים האחרונים ואינו זז עם מסנן התקופה — בחודש גרוע במיוחד כל הדיילות היו נראות מסתדרות, וגם ממוצע החברה היה נע איתן. שאר האריחים בדף כן זזים עם המסנן.')::text);

  -- ── בסיס-הנוכחות: `attendanceCounts` מילה-במילה, בחלון ובחלון המקביל.
  --    ‏`val is null` = **מדולג** — בדיוק כמו `if (value === undefined) continue` בקוד:
  --    "חולה"/"אישור-מראש" מוחרגים במכוון, וצירוף לא-מוכר מדולג בשקט ואינו מפיל את הדף.
  with obs as (
    select a.hostess_id, a.event_date,
           case
             when a.assignment_status = 'approval_withdrawn' then 0.5
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'light'  then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'medium' then 0.75
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'heavy'  then 0.5
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 0.0
           end as val,
           case
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 'on_time'
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level in ('light', 'medium', 'heavy') then 'late'
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 'ghosted'
           end as outcome,
           a.assignment_status, a.attendance_status, a.no_show_reason,
           (a.event_date > v_from) as is_cur
      from public.assignments a
      join public.projects p on p.project_id = a.project_id
     where p.project_status <> 'cancelled'
       and a.event_date > v_prev_from
       and a.event_date <= v_to
  ), totals as (
    select count(*) filter (where is_cur and val is not null)                         as obs_cur,
           count(*) filter (where is_cur and outcome = 'on_time')                     as on_time_cur,
           count(*) filter (where not is_cur and val is not null)                     as obs_prev,
           count(*) filter (where not is_cur and outcome = 'on_time')                 as on_time_prev,
           avg(val) filter (where is_cur)                                             as c_cur,
           avg(val) filter (where not is_cur)                                         as c_prev,
           count(distinct hostess_id) filter (where is_cur and val is not null)       as hosts_cur
      from obs
  ), excluded as (
    -- שורת-ההחרגות של 📐2 — מי לא נספר ולמה. **מונים, לא אחוזים.**
    select jsonb_build_object(
             'היעדרות באישור מראש ומחלה', count(*) filter (where attendance_status = 'no_show'
                                                            and no_show_reason in ('sick', 'approved_absence')),
             'סירובים',                   count(*) filter (where assignment_status = 'declined'),
             -- 🔴 **רק אירוע שכבר עבר** (F2): זימון שממתין לתשובה לאירוע שעוד לפנינו
             --    **אינו "הוצא" מאוכלוסיית-הנוכחות** — הוא מעולם לא היה כשיר להיכנס
             --    אליה, ואין בו דבר ש"נוכחותו טרם סומנה". בלי הסייג הזה שורת-📐2 סופרת
             --    את העתיד כחוסר-דאטה של ההווה. אותו כלל לשתי השורות.
             --    ⚠️ 'סירובים' נשאר כפי שהוא — לא הוכרע, ומדווח.
             'זימונים שלא נענו',          count(*) filter (where assignment_status = 'pending'
                                                            and event_date <= v_today),
             'נוכחות טרם סומנה',          count(*) filter (where attendance_status is null
                                                            and event_date <= v_today
                                                            and assignment_status not in ('declined', 'pending', 'approval_withdrawn'))
           ) as j
      from obs where is_cur
  ), by_month as (
    -- הגרף: שיעורים לפי חודש, עם `n` פר-חודש (📐12).
    -- **חודש בלי אף שיבוץ מסומן אינו עמודה ריקה** — הוא פשוט אינו בסדרה (⑧ H8).
    select jsonb_agg(x order by x->>'month') as j
      from (
        select jsonb_build_object(
                 'month',   to_char(date_trunc('month', event_date), 'YYYY-MM'),
                 'n',       count(*),
                 'late',    round(100.0 * count(*) filter (where outcome = 'late')    / nullif(count(*), 0), 1),
                 'no_show', round(100.0 * count(*) filter (where outcome = 'ghosted') / nullif(count(*), 0), 1)
               ) as x
          from obs where is_cur and val is not null
         group by date_trunc('month', event_date)
      ) s
  ), marked_months as (
    select distinct date_trunc('month', event_date) as mk from obs where is_cur and val is not null
  ), unmarked as (
    -- חודש שהאירועים בו כבר עברו אך אף שיבוץ בו לא סומן ⇒ נאמר במילים, לא כעמודה ריקה.
    select coalesce(jsonb_agg(to_jsonb(
             'החודש ' || m || ' אינו בגרף: ' || c ||
             ' שיבוצים באירועים שכבר התקיימו טרם נסגרה בהם נוכחות, ואין מה למדוד.')), '[]'::jsonb) as j
      from (
        select to_char(date_trunc('month', event_date), 'MM/YYYY') as m, count(*) as c
          from obs
         where is_cur and val is null and event_date <= v_today
           and attendance_status is null
           and assignment_status not in ('declined', 'pending', 'approval_withdrawn')
           and date_trunc('month', event_date) not in (select mk from marked_months)
         group by date_trunc('month', event_date)
      ) s
  )
  select t.obs_cur, t.on_time_cur, t.obs_prev, t.on_time_prev, t.c_cur, t.c_prev, t.hosts_cur,
         e.j, m.j, u.j
    into v_obs, v_on_time, v_prev_obs, v_prev_on, v_c, v_c_prev, v_pop_hosts,
         v_excluded, v_chart, v_unmarked
    from totals t, excluded e, by_month m, unmarked u;

  v_pop_n       := v_obs;
  v_on_time_pct := round(100.0 * v_on_time / nullif(v_obs, 0), 1);
  v_prev_pct    := round(100.0 * v_prev_on / nullif(v_prev_obs, 0), 1);
  v_notes       := v_notes || coalesce(v_unmarked, '[]'::jsonb);

  -- ── התור: ציון פר-דיילת, סף-מדגם (📐12), ואז שני הספים היחסיים (הכרעה 35).
  with obs as (
    select a.hostess_id, a.event_date,
           case
             when a.assignment_status = 'approval_withdrawn' then 0.5
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'light'  then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'medium' then 0.75
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'heavy'  then 0.5
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 0.0
           end as val,
           (a.attendance_status = 'no_show' and a.no_show_reason = 'ghosted') as is_ghosted,
           (a.event_date > v_frz_from) as is_cur
      from public.assignments a
      join public.projects p on p.project_id = a.project_id
     where p.project_status <> 'cancelled'
       and a.event_date > v_frz_prev
       and a.event_date <= v_frz_to
  ), c_frz as (
    -- 🔴 **ממוצע-החברה של החלון הקפוא, ולא של חלון-הקורא.** הוא המכנה של שני הספים,
    --    ולכן חייב לצאת מאותה אוכלוסייה בדיוק שממנה יוצא הציון — אחרת הסף נמדד על שנה
    --    אחת והציון על אחרת. זהה ל-`report_m15_reliability.meta.company_average`,
    --    ומוחזר כאן ב-`meta.company_average` כדי שההשוואה תהיה שאילתה ולא אמון.
    select avg(val) filter (where is_cur) c_cur, avg(val) filter (where not is_cur) c_prev
      from obs
  ), per as (
    select hostess_id, is_cur, count(*)::numeric n_shifts, sum(val) sum_val,
           count(*) filter (where is_ghosted) ghosted, max(event_date) last_shift
      from obs where val is not null group by hostess_id, is_cur
  ), scored as (
    select p.*, (p.sum_val + v_m * case when p.is_cur then f.c_cur else f.c_prev end)
                / (p.n_shifts + v_m) as score,
           case when p.is_cur then f.c_cur else f.c_prev end as base
      from per p cross join c_frz f
     where v_m is not null and v_min_sample is not null and p.n_shifts >= v_min_sample
  ), tagged as (
    select s.*, (v_bands_on and s.base is not null and s.score < v_red_coef   * s.base) as is_red,
                (v_bands_on and s.base is not null and s.score >= v_red_coef * s.base
                                                  and s.score <  v_amber_coef * s.base) as is_amber
      from scored s
  )
  select count(*) filter (where t.is_cur),
         count(*) filter (where t.is_cur and t.is_red),
         count(*) filter (where t.is_cur and t.is_amber),
         count(*) filter (where t.is_cur and t.is_red and h.status = 'active'),
         count(*) filter (where not t.is_cur and t.is_red),
         max(t.base) filter (where t.is_cur),
         jsonb_agg(jsonb_build_object(
           -- ‏`drill_key` אחיד בכל הלשוניות — `{kind, id}` ולא מזהה עירום (תיקון-חוזה C8).
           'drill_key',       jsonb_build_object('kind', 'hostess', 'id', t.hostess_id),
           'hostess_name',    h.full_name,
           'status',          case when h.status = 'active' then 'פעילה' else 'לא פעילה' end,
           'shifts',          t.n_shifts,
           'ghosted',         t.ghosted,
           'reliability',     round(t.score, 4),
           'last_shift_date', t.last_shift
         ) order by t.score asc, h.full_name asc) filter (where t.is_cur and t.is_red)
    into v_in_report, v_red, v_amber, v_red_active, v_prev_red, v_c_frozen, v_rows
    from tagged t join public.hostesses h on h.hostess_id = t.hostess_id;

  -- ── ג'יני והריכוזיות (§ח8-1): ספירת משמרות `finally_approved` פר-דיילת, אירוע שעבר.
  -- 🔴 **גרסת-אוכלוסייה, בלי `n/(n−1)`** (`spec.md §🔢 3.3`) — הצורה הממוינת
  --    `G = (2·Σ i·xᵢ)/(n·Σxᵢ) − (n+1)/n` שקולה לנוסחת ההפרשים הכפולים ורצה ב-O(n log n).
  -- 🚫 **בלי קיפול-שלישייה** — נמדד: ספירת השורות הגולמיות מחזירה את העוגן בדיוק.
  with counted as (
    select a.hostess_id, count(*)::numeric as shifts,
           (a.event_date > v_from) as is_cur
      from public.assignments a
     where a.assignment_status = 'finally_approved'
       and a.event_date > v_prev_from and a.event_date <= least(v_to, v_today)
     group by a.hostess_id, (a.event_date > v_from)
  ), ranked as (
    select is_cur, shifts,
           row_number() over (partition by is_cur order by shifts, hostess_id)      as rn_asc,
           row_number() over (partition by is_cur order by shifts desc, hostess_id) as rn_desc,
           count(*)  over (partition by is_cur) as n,
           sum(shifts) over (partition by is_cur) as total
      from counted
  ), agg as (
    select is_cur, max(n)::numeric n, max(total) total, sum(rn_asc * shifts) weighted
      from ranked group by is_cur
  )
  select (select n from agg where is_cur)::integer,
         (select total from agg where is_cur)::integer,
         (select case when n >= 2 and total > 0 then (2 * weighted) / (n * total) - (n + 1) / n end
            from agg where is_cur),
         (select ceil(n / 4.0)::integer from agg where is_cur),
         (select round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) from ranked r
           where r.is_cur and r.rn_desc <= ceil(r.n / 4.0)),
         (select round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) from ranked r
           where r.is_cur and r.rn_asc <= floor(r.n / 2.0)),
         (select n from agg where not is_cur)::integer,
         (select case when n >= 2 and total > 0 then (2 * weighted) / (n * total) - (n + 1) / n end
            from agg where not is_cur)
    into v_gini_n, v_shifts, v_gini, v_top_q_n, v_top_q_pct, v_bottom_pct,
         v_gini_prev_n, v_gini_prev;

  -- ── מונה-מצב: פעילות · רשומות · ומי שבאמת עבדה (המספר המעניין מבין השלושה).
  select count(*) filter (where status = 'active'), count(*)
    into v_active, v_registered
    from public.hostesses;
  v_worked := v_gini_n;

  -- ── אירועים עם חוסר, 30 ימים קדימה (הכרעה 24 · ח2).
  -- 🔴 **הקיפול הוא חובה** — `assignments` הוא מפתח-שלישייה ו-797 כפילויות-זוג קיימות
  --    (‏`spec.md §1.3`); בלעדיו דיילת שסירבה-וזומנה-שוב נספרת פעמיים.
  -- ⚠️ ‏`overviewHasGap` (`src/lib/projects.js:203`) מחזירה `true` גם על `event_finished`
  --    וגם על לוגיסטיקה לא-שלמה; **שורת-הכרטיס מגדירה כאן את חצי-האיוש בלבד**, וזה
  --    מה שממומש. מדווח.
  with folded as (
    select a.project_id, a.assignment_status
      from public.assignments a
     where a.assignment_number = (select max(a2.assignment_number) from public.assignments a2
                                   where a2.project_id = a.project_id and a2.hostess_id = a.hostess_id)
  ), conf as (
    select project_id, count(*) filter (where assignment_status = 'finally_approved') as c from folded group by project_id
  ), pend as (
    select project_id, count(*) filter (where assignment_status = 'pending') as p from public.assignments group by project_id
  ), scope as (
    select p.project_id, p.required_hostess_count, coalesce(conf.c, 0) c, coalesce(pend.p, 0) pending_count,
           case when p.final_event_date <= v_today + 30 then 'near' else 'far' end as horizon
      from public.projects p
      left join conf on conf.project_id = p.project_id
      left join pend on pend.project_id = p.project_id
     where p.project_status in ('not_started', 'in_progress', 'ready')
       and p.final_event_date > v_today
       and p.final_event_date <= v_today + 60
  )
  select count(*) filter (where horizon = 'near'),
         count(*) filter (where horizon = 'near' and c < required_hostess_count),
         coalesce(sum(greatest(required_hostess_count - c, 0)) filter (where horizon = 'near'), 0),
         coalesce(sum(pending_count) filter (where horizon = 'near' and c < required_hostess_count), 0),
         count(*) filter (where horizon = 'far'),
         count(*) filter (where horizon = 'far' and c < required_hostess_count)
    into v_upcoming, v_gap_events, v_gap_places, v_gap_pending, v_prev_upcom, v_prev_gap
    from scope;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', coalesce(v_pop_n, 0),
      'label', 'אוכלוסייה: שיבוצים שסומנה בהם נוכחות, באירוע שכבר התקיים ובפרויקט שלא בוטל · n=' ||
               to_char(coalesce(v_pop_n, 0), 'FM999,999,999') || ' שיבוצים אצל ' || coalesce(v_pop_hosts, 0) ||
               ' דיילות · הוצאו: ' || coalesce((v_excluded->>'היעדרות באישור מראש ומחלה'), '0') ||
               ' היעדרויות באישור מראש ומחלה (לא נספרות לא במונה ולא במכנה) · ' ||
               coalesce((v_excluded->>'סירובים'), '0') || ' סירובים · ' ||
               coalesce((v_excluded->>'זימונים שלא נענו'), '0') || ' זימונים שלא נענו · ' ||
               coalesce((v_excluded->>'נוכחות טרם סומנה'), '0') || ' שיבוצים שנוכחותם טרם סומנה.',
      'excluded', coalesce(v_excluded, '{}'::jsonb)),
    'window', jsonb_build_object('from', v_from, 'to', v_to, 'label', v_win_full),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'on_time', 'label', 'הגעה בזמן', 'value', v_on_time_pct, 'format', 'percent',
        'window', v_win_text,
        'compare', case when v_prev_pct is null then null else jsonb_build_object(
          'value', v_prev_pct, 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_on_time_pct > v_prev_pct then 'up' when v_on_time_pct < v_prev_pct then 'down' else 'flat' end) end,
        'target', null,
        'sub', to_char(coalesce(v_on_time, 0), 'FM999,999,999') || ' מתוך ' ||
                  to_char(coalesce(v_obs, 0), 'FM999,999,999') || ' שיבוצים'),
      jsonb_build_object('key', 'red_hostesses', 'label', 'דיילות אדומות', 'value', v_red, 'format', 'int',
        'window', 'חלון קפוא · 12 חודשים',
        'compare', case when v_prev_red is null then null else jsonb_build_object(
          'value', v_prev_red, 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_red > v_prev_red then 'up' when v_red < v_prev_red then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'אמינות והתייצבות', 'drill', null),
        'sub', coalesce(v_red, 0) || ' מתוך ' || coalesce(v_in_report, 0) || ' דיילות עם ' ||
                  coalesce(v_min_sample::text, '—') || ' משמרות ומעלה · ' || coalesce(v_amber, 0) ||
                  ' בענבר · ' || coalesce(v_red_active, 0) || ' מהאדומות פעילות'),
      jsonb_build_object('key', 'gini', 'label', 'ריכוזיות המשמרות', 'value', round(v_gini, 4), 'format', 'gini',
        'window', v_win_text,
        'compare', case when v_gini_prev is null then null else jsonb_build_object(
          'value', round(v_gini_prev, 4), 'label', 'התקופה המקבילה אשתקד (n=' || v_gini_prev_n || ')',
          'direction', case when v_gini > v_gini_prev then 'up' when v_gini < v_gini_prev then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'הוגנות השיבוץ', 'drill', null),
        'sub', 'מדד ג''יני · רבע הדיילות העמוסות ביותר מקבלות ' || coalesce(v_top_q_pct::text, '—') ||
                  '% מהמשמרות; מחצית המאגר מקבלת ' || coalesce(v_bottom_pct::text, '—') || '%'),
      jsonb_build_object('key', 'active_hostesses', 'label', 'דיילות פעילות', 'value', v_active, 'format', 'int',
        'window', 'נכון ל-' || to_char(v_today, 'DD/MM/YYYY'),
        'compare', null,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'איכות מול עלות', 'drill', null),
        'sub', 'מתוך ' || coalesce(v_registered, 0) || ' רשומות · ' || coalesce(v_worked, 0) || ' עבדו בחלון'),
      jsonb_build_object('key', 'gap_events', 'label', 'אירועים עם חוסר', 'value', v_gap_events, 'format', 'int',
        'window', '30 הימים הקרובים',
        'compare', case when v_prev_upcom = 0 then null else jsonb_build_object(
          'value', v_prev_gap, 'label', '31–60 הימים הבאים',
          'direction', case when v_gap_events > v_prev_gap then 'up' when v_gap_events < v_prev_gap then 'down' else 'flat' end) end,
        'target', null,
        'sub', case when v_upcoming = 0 then 'אין אירועים ב-30 הימים הקרובים'
                  else v_gap_events || ' מתוך ' || v_upcoming || ' אירועים · ' || v_gap_places ||
                       ' מקומות · ' || v_gap_pending || ' זימונים ממתינים' end)),
    'chart', jsonb_build_object(
      'type', 'bar', 'title', 'איחור ואי-הגעה לפי חודש',
      'series', jsonb_build_array(
        jsonb_build_object('key', 'late', 'label', 'איחור'),
        jsonb_build_object('key', 'no_show', 'label', 'אי-הגעה (הבריזה)')),
      'data', coalesce(v_chart, '[]'::jsonb), 'xKey', 'month',
      'domain', null, 'refLines', '[]'::jsonb, 'unit', 'percent'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'hostess_name',    'label', 'דיילת',          'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'status',          'label', 'סטטוס',          'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'shifts',          'label', 'משמרות',         'format', 'int',  'align', 'end'),
      jsonb_build_object('key', 'ghosted',         'label', 'הבריזה',         'format', 'int',  'align', 'end'),
      jsonb_build_object('key', 'reliability',     'label', 'ציון אמינות',     'format', 'score', 'align', 'end'),
      jsonb_build_object('key', 'last_shift_date', 'label', 'משמרת אחרונה',   'format', 'date', 'align', 'end')),
    'rows', coalesce(v_rows, '[]'::jsonb),
    'so_what', case
      when v_red is null or v_red = 0 then 'אין דיילות אדומות בחלון — אין תור לטפל בו החודש.'
      else 'לא לשלוח את ' || v_red || ' הדיילות האדומות לאירועים הקרובים — ' || v_red_active ||
           ' מהן פעילות ומוצעות היום בשיבוץ.' end,
    'definitions', 'הגדרות: הגעה בזמן = שיבוצים שסומן בהם "הגיעה" בלי דרגת-איחור, מתוך כל השיבוצים שסומנה בהם נוכחות · ' ||
      -- ‏`trim_scale` ולא `::text` גולמי: ‏`(0.87*100)::text` מרנדר **"87.00"** והמסך היה
      -- אומר *"נמוך מ-87.00%"* במקום *"נמוך מ-87%"* — נתפס בהרצת המטען מול המסד 16/09/2026.
      -- 🔴 **ממוצע-החברה כאן הוא זה של החלון הקפוא, בשש ספרות** — אותו מספר בדיוק
      --    ש-`report_m15_reliability` מחזיר ב-`meta.company_average`. עד F2 הודפס כאן
      --    ממוצע חלון-הקורא, ואותו מונח נשא שלושה ערכים שונים בלשונית אחת (0.9587 ·
      --    0.958358 · 0.958815).
      'דיילת אדומה = ציון-אמינות נמוך מ-' || coalesce(trim_scale(v_red_coef * 100)::text, '—') || '% מממוצע החברה (' ||
      coalesce(round(v_c_frozen, 6)::text, '—') || ') — כלומר מתחת ל-' || coalesce(round(v_red_coef * v_c_frozen, 6)::text, '—') ||
      '; ענבר = מתחת ל-' || coalesce(trim_scale(v_amber_coef * 100)::text, '—') || '% ממנו (' ||
      coalesce(round(v_amber_coef * v_c_frozen, 6)::text, '—') || ') · ' ||
      'ג''יני = מדד ריכוזיות בין 0 (כל דיילת מקבלת אותו מספר משמרות) ל-1 (דיילת אחת מקבלת הכול), על ' ||
      coalesce(v_gini_n::text, '0') || ' הדיילות שעבדו בחלון · ' ||
      'דיילת פעילה = הסטטוס ''פעילה'' בכרטיס שלה — אינו "עבדה לאחרונה" · ' ||
      'אירוע עם חוסר = אירוע שטרם התקיים ומספר המשובצות-סופית בו קטן ממספר הדיילות הנדרש.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', to_jsonb(v_missing),
      'frozen_count', null,
      'notes', v_notes,
      'run', null,
      -- 📌 מצב-מוצהר עם מקורו: אותם שלושה מספרים בדיוק ש-`report_m15_reliability`
      --    מחזיר, כדי שאפשר יהיה להשוות בשאילתה אחת במקום להאמין לשני מסכים.
      'company_average', round(v_c_frozen, 6),
      'red_threshold', case when v_bands_on then round(v_red_coef * v_c_frozen, 6) end,
      'amber_threshold', case when v_bands_on then round(v_amber_coef * v_c_frozen, 6) end,
      'frozen_window', jsonb_build_object('from', v_frz_from, 'to', v_frz_to),
      -- ‏📐9: `aria-sort` יושב על עמודה אחת בלבד, וה-RPC הוא שיודע איזו (מיון לפי ציון
      --    עולה — סדר-הטיפול, לא אלף-בית). 🔴 **הקורא בפועל הוא `meta.sort`** — נמדד
      --    16/09/2026: `ReportSurface.jsx:253` מעביר `sort={payload.meta?.sort}` ו-
      --    `ReportTable.jsx:44-49` משווה `sort.key` לעמודה. ‏`columns[].sorted` של
      --    תיקון-C8 אינו נקרא באף קובץ — מדווח, לא מתוקן כאן.
      'sort', jsonb_build_object('key', 'reliability', 'direction', 'ascending'),
      -- ‏C8: ההצהרה היא תכונה של המשטח ולא של הקריאה — ארבעת דפי-הלשונית אינם מסוננים
      --    לפי לקוח **אף פעם**, ולכן `true` קבוע ולא `p_customer_id is not null`.
      'customer_filter_ignored', true,
      'drill_echo', p_drill));
end;
$function$;

comment on function public.report_m14_hostess_overview(date, date, integer, jsonb) is
'מ11 · מבט-על דיילות (בקרה). אוכלוסייה: שיבוצים שסומנה בהם נוכחות, באירוע שכבר התקיים ובפרויקט שלא בוטל. הוצאו: היעדרות באישור-מראש ומחלה (לא במונה ולא במכנה), סירובים, זימונים שלא נענו, ושיבוצים שנוכחותם טרם סומנה. חלון חצי-פתוח (from, to], ברירת-מחדל 12 חודשים בשעון ישראל — למעט אריח "דיילות אדומות", שחלונו קפוא על 12 החודשים האחרונים ואינו נגרר אחרי מסנן-התקופה (זהה ל-report_m15_reliability, כולל ממוצע-החברה). ג''יני: גרסת-אוכלוסייה על ספירת המשמרות המאושרות פר-דיילת (§ח8-1). ספי-האמינות נקראים מ-params בזמן-ריצה ואינם קבועי-קוד (הכרעה 35).';

revoke execute on function public.report_m14_hostess_overview(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m14_hostess_overview(date, date, integer, jsonb) to authenticated;

create or replace function public.report_m15_reliability(
  p_from        date    default null,
  p_to          date    default null,
  p_customer_id integer default null,
  p_drill       jsonb   default null
) returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_today       date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to          date;
  v_from        date;
  v_prev_to     date;
  v_prev_from   date;
  v_dow         integer;
  v_missing     text[] := array[]::text[];
  v_notes       jsonb  := '[]'::jsonb;
  v_m           numeric;
  v_min_sample  numeric;
  v_red_coef    numeric;
  v_amber_coef  numeric;
  v_bands_on    boolean;
  v_c           numeric;
  v_c_prev      numeric;
  v_obs         integer;
  v_prev_obs    integer;
  v_on_time     integer;
  v_prev_on     integer;
  v_late        integer;
  v_late_heavy  integer;
  v_prev_late   integer;
  v_ghosted     integer;
  v_prev_ghost  integer;
  v_withdrew    integer;
  v_in_report   integer;
  v_below       integer;
  v_flagged     integer;
  v_prev_flag   integer;
  v_red         integer;
  v_amber       integer;
  v_red_active  integer;
  v_shifts_in   integer;
  v_shifts_out  integer;
  v_chart       jsonb;
  v_rows        jsonb;
  v_order_note  text;
  -- 🆕 הכרעה 37 בחתך-דירוג — שני השיעורים, והדוח אינו בוחר ביניהם (F2, 16/09/2026).
  v_ns12        jsonb;
  v_ns_ever     jsonb;
  v_ns_rows     jsonb;
begin
  perform public.assert_module_permission('דיילות', array['edit', 'view']);

  -- 🔴 החלון קפוא: `p_from`/`p_to` מתקבלים אך אינם גוררים את בסיס-הציון (📑ב#13).
  v_to        := v_today;
  v_from      := (v_to - interval '12 months')::date;
  v_prev_to   := v_from;
  v_prev_from := (v_from - interval '12 months')::date;

  if p_from is not null or p_to is not null then
    v_notes := v_notes || to_jsonb(
      'החלון כאן קבוע על 12 חודשים ואינו זז עם מסנן התקופה — בחודש גרוע במיוחד כל הדיילות היו נראות מסתדרות, וגם ממוצע החברה היה נע איתן.'::text);
  end if;
  if p_customer_id is not null then
    v_notes := v_notes || to_jsonb(
      'הדף אינו מושפע ממסנן הלקוח — הציון והספים נמדדים מול ממוצע כלל המאגר.'::text);
  end if;

  select nullif(btrim(pa.param_value), '')::numeric into v_m
    from public.params pa where pa.param_name = 'קבוע_ריסון_m';
  if v_m is null then v_missing := v_missing || 'קבוע_ריסון_m'; end if;

  select nullif(btrim(pa.param_value), '')::numeric into v_min_sample
    from public.params pa where pa.param_name = 'מינימום_תשובות_להצגת_ציון';
  if v_min_sample is null then v_missing := v_missing || 'מינימום_תשובות_להצגת_ציון'; end if;

  select nullif(btrim(pa.param_value), '')::numeric into v_red_coef
    from public.params pa where pa.param_name = 'מקדם_אמינות_אדום';
  if v_red_coef is null then v_missing := v_missing || 'מקדם_אמינות_אדום'; end if;

  select nullif(btrim(pa.param_value), '')::numeric into v_amber_coef
    from public.params pa where pa.param_name = 'מקדם_אמינות_ענבר';
  if v_amber_coef is null then v_missing := v_missing || 'מקדם_אמינות_ענבר'; end if;

  -- 🔴 שומר-סדר-המקדמים — ר' כותרת-הקובץ. הצבע כבוי, והמשפט מוצג במקומו.
  v_bands_on := v_red_coef is not null and v_amber_coef is not null and v_red_coef < v_amber_coef;
  if v_red_coef is not null and v_amber_coef is not null and not v_bands_on then
    v_order_note := 'סימון האמינות כבוי: מקדם_אמינות_אדום (' || v_red_coef ||
                    ') אינו נמוך ממקדם_אמינות_ענבר (' || v_amber_coef ||
                    '), ולכן שני התגים היו מתהפכים. תקני את הערכים בהגדרות המערכת כדי להחזיר את הצבעים.';
    v_notes := v_notes || to_jsonb(v_order_note);
  end if;

  -- בחירת-יום מהגרף (סינון-צולב): 0–6, ערך מחוץ לטווח מתעלמים ממנו (⑦).
  v_dow := nullif(btrim(coalesce(p_drill->>'dow', '')), '')::integer;
  if v_dow is not null and (v_dow < 0 or v_dow > 6) then v_dow := null; end if;

  -- ── בסיס-הנוכחות, פעם אחת: אגרגטים · ממוצע-החברה · גרף יום-בשבוע.
  --    **יום בלי אף שיבוץ מסומן אינו עמודה** — שבת אינה בסדרה כי אין אירועים בשבת.
  with obs as (
    select a.hostess_id, extract(dow from a.event_date)::integer as dow,
           case
             when a.assignment_status = 'approval_withdrawn' then 0.5
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'light'  then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'medium' then 0.75
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'heavy'  then 0.5
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 0.0
           end as val,
           case
             when a.assignment_status = 'approval_withdrawn' then 'withdrew'
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 'on_time'
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'light'  then 'late_light'
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'medium' then 'late_medium'
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'heavy'  then 'late_heavy'
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 'ghosted'
           end as outcome,
           (a.event_date > v_from) as is_cur
      from public.assignments a
      join public.projects p on p.project_id = a.project_id
     where p.project_status <> 'cancelled'
       and a.event_date > v_prev_from
       and a.event_date <= v_to
  ), totals as (
    select count(*) filter (where is_cur and val is not null)                 obs_cur,
           count(*) filter (where not is_cur and val is not null)             obs_prev,
           count(*) filter (where is_cur and outcome = 'on_time')             on_cur,
           count(*) filter (where not is_cur and outcome = 'on_time')         on_prev,
           count(*) filter (where is_cur and outcome like 'late\_%')          late_cur,
           count(*) filter (where is_cur and outcome = 'late_heavy')          heavy_cur,
           count(*) filter (where not is_cur and outcome like 'late\_%')      late_prev,
           count(*) filter (where is_cur and outcome = 'ghosted')             gh_cur,
           count(*) filter (where not is_cur and outcome = 'ghosted')         gh_prev,
           count(*) filter (where is_cur and outcome = 'withdrew')            wd_cur,
           avg(val) filter (where is_cur)                                     c_cur,
           avg(val) filter (where not is_cur)                                 c_prev
      from obs
  ), by_dow as (
    -- 🔴 **שמות-הימים אינם נכתבים כאן.** ‏`WEEKDAY_NAMES_HE` ב-`src/lib/dates.js:97` כבר
    --    מחזיקה את שבעת המחרוזות; עותק שני ב-SQL הוא בדיוק הכפילות שכלל-ברזל 14 אוסר,
    --    והוא מתפצל בשקט ביום שמישהו מתקן ניסוח בצד אחד. ⇒ מוחזר **המספר 0–6**,
    --    ו-`chart.label_source` אומר לממשק דרך איזה קבוע למפות אותו.
    select jsonb_agg(x order by (x->>'dow')::int) j
      from (
        select jsonb_build_object(
                 'dow', dow,
                 'n', count(*),
                 'late',    round(100.0 * count(*) filter (where outcome like 'late\_%') / nullif(count(*), 0), 1),
                 'no_show', round(100.0 * count(*) filter (where outcome = 'ghosted')    / nullif(count(*), 0), 1)
               ) as x
          from obs where is_cur and val is not null group by dow
      ) s
  )
  select t.obs_cur, t.obs_prev, t.on_cur, t.on_prev, t.late_cur, t.heavy_cur, t.late_prev,
         t.gh_cur, t.gh_prev, t.wd_cur, t.c_cur, t.c_prev, d.j
    into v_obs, v_prev_obs, v_on_time, v_prev_on, v_late, v_late_heavy, v_prev_late,
         v_ghosted, v_prev_ghost, v_withdrew, v_c, v_c_prev, v_chart
    from totals t, by_dow d;

  -- ── התור עצמו. **מיון לפי ציון עולה — סדר-הטיפול, לא אלף-בית** (📐7 · 📑ב#13).
  -- ‏**השורה שמעל הסף נשארת בכוונה** (⑧15.5): היא מראה איפה עובר הסף במקום להצהיר עליו.
  -- 🔴 **שתי עמודות אי-הגעה (הכרעה 37) — והדוח אינו בוחר:** `no_show_12m` היא הגדרת-הציון
  --    (הבריזה בלבד, בחלון הקפוא), ו-`no_show_ever` היא כל סיבות אי-ההגעה על כל ההיסטוריה.
  --    ‏**"אי-פעם" אינה תלוית-חלון ואינה תלוית-יום**, ולכן היא אינה משתנה בסינון-הצולב (⑧15.6).
  with obs as (
    select a.hostess_id, extract(dow from a.event_date)::integer as dow,
           case
             when a.assignment_status = 'approval_withdrawn' then 0.5
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'light'  then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'medium' then 0.75
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'heavy'  then 0.5
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 0.0
           end as val,
           case
             when a.assignment_status = 'approval_withdrawn' then 'withdrew'
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 'on_time'
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level in ('light', 'medium', 'heavy') then 'late'
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 'ghosted'
           end as outcome,
           (a.event_date > v_from) as is_cur
      from public.assignments a
      join public.projects p on p.project_id = a.project_id
     where p.project_status <> 'cancelled'
       and a.event_date > v_prev_from
       and a.event_date <= v_to
  ), per as (
    select o.hostess_id, count(*)::numeric n_shifts, sum(o.val) sum_val,
           count(*) filter (where o.outcome = 'on_time')     on_time,
           count(*) filter (where o.outcome = 'late')        late_all,
           count(*) filter (where o.outcome = 'ghosted')     ghosted,
           count(*) filter (where o.outcome = 'withdrew')    withdrew
      from obs o where o.is_cur and o.val is not null group by o.hostess_id
  ), per_prev as (
    select o.hostess_id, count(*)::numeric n_shifts, sum(o.val) sum_val
      from obs o where not o.is_cur and o.val is not null group by o.hostess_id
  ), ever as (
    select a.hostess_id,
           count(*) filter (where a.attendance_status is not null)                 marked_ever,
           count(*) filter (where a.attendance_status = 'no_show')                 no_show_ever
      from public.assignments a group by a.hostess_id
  ), day_slice as (
    select o.hostess_id, count(*) n_day,
           count(*) filter (where o.outcome = 'late')     late_day,
           count(*) filter (where o.outcome = 'ghosted')  ghost_day,
           count(*) filter (where o.outcome = 'withdrew') withdrew_day
      from obs o
     where o.is_cur and o.val is not null and v_dow is not null and o.dow = v_dow
     group by o.hostess_id
  ), eligible as (
    select p.*, (p.sum_val + v_m * v_c) / (p.n_shifts + v_m) as score
      from per p
     where v_m is not null and v_c is not null and v_min_sample is not null
       and p.n_shifts >= v_min_sample
  ), banded as (
    select e.*,
           case when not v_bands_on then null
                when e.score <  v_red_coef   * v_c then 'red'
                when e.score <  v_amber_coef * v_c then 'amber'
           end as band
      from eligible e
  ), prev_flagged as (
    select count(*) filter (where v_m is not null and v_c_prev is not null and v_bands_on
                              and v_min_sample is not null and n_shifts >= v_min_sample
                              and (sum_val + v_m * v_c_prev) / (n_shifts + v_m) < v_amber_coef * v_c_prev) c
      from per_prev
  ), sample as (
    select count(*) filter (where v_min_sample is not null and n_shifts >= v_min_sample)      in_rep,
           count(*) filter (where v_min_sample is null or  n_shifts <  v_min_sample)          below,
           coalesce(sum(n_shifts) filter (where v_min_sample is not null and n_shifts >= v_min_sample), 0) sh_in,
           coalesce(sum(n_shifts) filter (where v_min_sample is null or  n_shifts <  v_min_sample), 0)     sh_out
      from per
  ), table_rows as (
    -- **מיון לפי ציון עולה — סדר-הטיפול, לא אלף-בית** (📐7 · 📑ב#13); הדפדוף בצד-הלקוח.
    select jsonb_agg(jsonb_build_object(
             -- ‏`drill_key` אחיד בכל הלשוניות — `{kind, id}` (תיקון-חוזה C8).
             'drill_key',     jsonb_build_object('kind', 'hostess', 'id', b.hostess_id),
             'hostess_name',  h.full_name,
             'status',        case when h.status = 'active' then 'פעילה' else 'לא פעילה' end,
             'band',          b.band,
             -- 🔴 במצב-יום עמודות-החלון מציגות "—" ולא ספירה שמשקרת (⑧15.1):
             --    "11 משמרות" ליד "יום חמישי" היה אומר דבר שלא קרה.
             'shifts',        case when v_dow is null then b.n_shifts else d.n_day end,
             'on_time_pct',   case when v_dow is null
                                   then round(100.0 * b.on_time / nullif(b.n_shifts, 0), 1) end,
             'late',          case when v_dow is null then b.late_all else d.late_day end,
             'no_show_12m',   case when v_dow is null then b.ghosted  else d.ghost_day end,
             'withdrew',      case when v_dow is null then b.withdrew else d.withdrew_day end,
             -- 🔴 "אי-פעם" אינה תלוית-חלון ואינה תלוית-יום ⇒ אינה משתנה בסינון-הצולב (⑧15.6).
             'no_show_ever',  e.no_show_ever,
             'no_show_ever_denominator', e.marked_ever,
             'reliability',   case when v_dow is null then round(b.score, 4) end
           ) order by b.score asc, h.full_name asc) j
      from banded b
      join public.hostesses h on h.hostess_id = b.hostess_id
      left join ever e on e.hostess_id = b.hostess_id
      left join day_slice d on d.hostess_id = b.hostess_id
     where v_dow is null or d.hostess_id is not null
  ), tallies as (
    select count(*) filter (where b.band = 'red')                              red,
           count(*) filter (where b.band = 'amber')                            amber,
           count(*) filter (where b.band is not null)                          flagged,
           count(*) filter (where b.band = 'red' and h.status = 'active')      red_active
      from banded b join public.hostesses h on h.hostess_id = b.hostess_id
  )
  select r.j, t.red, t.amber, t.flagged, t.red_active, pf.c, s.in_rep, s.below, s.sh_in, s.sh_out
    into v_rows, v_red, v_amber, v_flagged, v_red_active, v_prev_flag,
         v_in_report, v_below, v_shifts_in, v_shifts_out
    from table_rows r, tallies t, prev_flagged pf, sample s;

  -- ── 🆕 **הכרעה 37 בחתך-דירוג** (כרטיס ③ מ15 שורת "אי-הגעה לפי דירוג" · ⑧15.4).
  -- 🔴 **שני שיעורים ושני מכנים שונים — ולכן אינם ניתנים להשוואה זה לזה, רק בין דירוגים:**
  --    *"12 חודשים"* = הבריזה בלבד, על אוכלוסיית-הנוכחות של החלון הקפוא (מחלה והיעדרות
  --    באישור מוחרגות משני צדי השבר — בדיוק `attendanceCounts`); *"אי-פעם"* = כל סיבות
  --    אי-ההגעה, על כל ההיסטוריה ובלי חלון. אלה בדיוק שתי העמודות שכבר יושבות בטבלה,
  --    באגרגציה אחרת. ⇒ מוחזרים כאן **מוכנים**, כדי שהלשונית לא תגזור אותם מהשורות
  --    (כלל-ברזל 14) — ואי-אפשר בכלל, כי `rows` אינו נושא `rating`.
  with obs as (
    select a.hostess_id,
           case
             when a.assignment_status = 'approval_withdrawn' then 0.5
             when a.attendance_status = 'arrived' and a.lateness_level is null and a.no_show_reason is null then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'light'  then 1.0
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'medium' then 0.75
             when a.attendance_status = 'late'    and a.no_show_reason is null and a.lateness_level = 'heavy'  then 0.5
             when a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted' then 0.0
           end as val,
           (a.attendance_status = 'no_show' and a.lateness_level is null and a.no_show_reason = 'ghosted') as ghosted
      from public.assignments a
      join public.projects p on p.project_id = a.project_id
     where p.project_status <> 'cancelled'
       and a.event_date > v_from and a.event_date <= v_to
  ), w12 as (
    select h.rating, count(*) n, count(*) filter (where o.ghosted) gh
      from obs o join public.hostesses h on h.hostess_id = o.hostess_id
     where o.val is not null group by h.rating
  ), ever_rated as (
    select h.rating,
           count(*) filter (where a.attendance_status is not null) n,
           count(*) filter (where a.attendance_status = 'no_show')  ns
      from public.assignments a join public.hostesses h on h.hostess_id = a.hostess_id
     group by h.rating
  ), rating_keys as (
    -- 🔴 **`full join … on … is not distinct from …` נכשל בזמן-ריצה, לא בקומפילציה:**
    --    ‏`0A000 FULL JOIN is only supported with merge-joinable or hash-joinable join
    --    conditions`. ‏`create or replace` עבר בירוק, והפונקציה מתה רק בקריאה הראשונה —
    --    בדיוק המחלקה שהמיגרציה הזו באה לתקן. ⇒ איחוד-מפתחות ושני `left join`
    --    (‏`left join` **כן** נתמך עם תנאי לא-מיזוגי, דרך לולאה מקוננת), ו-`union`
    --    ממזג גם את המפתח הריק (חסרות-דירוג). נמדד ותוקן 16/09/2026.
    select rating from w12 union select rating from ever_rated
  ), merged as (
    select k.rating, w.n n12, w.gh gh12, e.n n_ever, e.ns ns_ever,
           round(100.0 * w.gh / nullif(w.n, 0), 1) pct12,
           round(100.0 * e.ns / nullif(e.n, 0), 1) pct_ever
      from rating_keys k
      left join w12        w on w.rating is not distinct from k.rating
      left join ever_rated e on e.rating is not distinct from k.rating
  )
  select jsonb_object_agg(rating::text, pct12)    filter (where rating is not null and pct12 is not null),
         jsonb_object_agg(rating::text, pct_ever) filter (where rating is not null and pct_ever is not null),
         jsonb_agg(jsonb_build_object(
           -- ⚠️ **רצועת חסרות-הדירוג נשארת בטבלה במכוון** — אלה מאות תצפיות, והשמטתן
           --    מטבלה ששמה "אי-הגעה לפי דירוג" היא בדיוק ההשמטה-בשקט של 📐2. באובייקט
           --    `no_show_by_rating` היא אינה, כי שם המפתחות הם דירוגים.
           'rating_label', case when rating is null then 'ללא דירוג' else rating::text end,
           'rating', rating,
           'months12', pct12, 'months12_n', n12,
           'ever', pct_ever, 'ever_n', n_ever)
           order by case when rating is null then -1 else rating end desc)
    into v_ns12, v_ns_ever, v_ns_rows
    from merged;

  if v_dow is not null then
    v_notes := v_notes || to_jsonb(
      ('הספירות בטבלה הן של אותו יום בלבד; עמודת "אי-הגעה · אי-פעם" אינה תלוית-יום ונשארת כפי שהיא.')::text);
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', coalesce(v_in_report, 0),
      'label', 'אוכלוסייה: דיילות עם ' || coalesce(v_min_sample::text, '—') ||
               ' משמרות מסומנות ומעלה בחלון · n=' || coalesce(v_in_report, 0) || ' דיילות, ' ||
               to_char(coalesce(v_shifts_in, 0), 'FM999,999,999') || ' שיבוצים · הוצאו: ' || coalesce(v_below, 0) ||
               ' דיילות עם פחות מ-' || coalesce(v_min_sample::text, '—') ||
               ' משמרות מסומנות (מוצגות "—" ולא אחוז) · היעדרויות באישור מראש ומחלה — לא במונה ולא במכנה, כדי שדיילת שהודיעה מראש לא תיענש כמי שהבריזה.',
      'excluded', jsonb_build_object('מתחת לסף המדגם', coalesce(v_below, 0))),
    'window', jsonb_build_object('from', v_from, 'to', v_to, 'label', 'חלון קפוא · 12 החודשים האחרונים'),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'on_time', 'label', 'הגעה בזמן',
        'value', round(100.0 * v_on_time / nullif(v_obs, 0), 1), 'format', 'percent',
        'window', 'חלון קפוא · 12 חודשים',
        'compare', case when v_prev_obs = 0 then null else jsonb_build_object(
          'value', round(100.0 * v_prev_on / nullif(v_prev_obs, 0), 1), 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_on_time * v_prev_obs > v_prev_on * v_obs then 'up'
                            when v_on_time * v_prev_obs < v_prev_on * v_obs then 'down' else 'flat' end) end,
        'target', null, 'sub', to_char(coalesce(v_on_time, 0), 'FM999,999,999') || ' מתוך ' ||
                                  to_char(coalesce(v_obs, 0), 'FM999,999,999')),
      jsonb_build_object('key', 'late', 'label', 'איחור',
        'value', round(100.0 * v_late / nullif(v_obs, 0), 1), 'format', 'percent',
        'window', 'חלון קפוא · 12 חודשים',
        'compare', case when v_prev_obs = 0 then null else jsonb_build_object(
          'value', round(100.0 * v_prev_late / nullif(v_prev_obs, 0), 1), 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_late * v_prev_obs > v_prev_late * v_obs then 'up'
                            when v_late * v_prev_obs < v_prev_late * v_obs then 'down' else 'flat' end) end,
        'target', null, 'sub', coalesce(v_late, 0) || ' שיבוצים, מהם ' || coalesce(v_late_heavy, 0) || ' באיחור רב'),
      jsonb_build_object('key', 'no_show', 'label', 'אי-הגעה (הבריזה)',
        'value', round(100.0 * v_ghosted / nullif(v_obs, 0), 1), 'format', 'percent',
        'window', 'חלון קפוא · 12 חודשים',
        'compare', case when v_prev_obs = 0 then null else jsonb_build_object(
          'value', round(100.0 * v_prev_ghost / nullif(v_prev_obs, 0), 1), 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_ghosted * v_prev_obs > v_prev_ghost * v_obs then 'up'
                            when v_ghosted * v_prev_obs < v_prev_ghost * v_obs then 'down' else 'flat' end) end,
        'target', null, 'sub', coalesce(v_ghosted, 0) || ' שיבוצים · ' || coalesce(v_withdrew, 0) || ' ביטלו אחרי אישור'),
      jsonb_build_object('key', 'flagged', 'label', 'דיילות מסומנות', 'value', v_flagged, 'format', 'int',
        'window', 'חלון קפוא · 12 חודשים',
        'compare', case when v_prev_flag is null then null else jsonb_build_object(
          'value', v_prev_flag, 'label', 'התקופה המקבילה אשתקד',
          'direction', case when v_flagged > v_prev_flag then 'up' when v_flagged < v_prev_flag then 'down' else 'flat' end) end,
        'target', null,
        'sub', coalesce(v_red, 0) || ' אדומות · ' || coalesce(v_amber, 0) || ' ענבר מתוך ' ||
                  coalesce(v_in_report, 0) || ' · ' || coalesce(v_red_active, 0) || ' מהאדומות פעילות')),
    'chart', jsonb_build_object(
      'type', 'bar', 'title', 'איחור ואי-הגעה לפי יום בשבוע',
      'series', jsonb_build_array(
        jsonb_build_object('key', 'late', 'label', 'איחור'),
        jsonb_build_object('key', 'no_show', 'label', 'אי-הגעה (הבריזה)')),
      'data', coalesce(v_chart, '[]'::jsonb), 'xKey', 'dow',
      -- הממשק ממפה `dow` (0–6) דרך `WEEKDAY_NAMES_HE` — ר' הערת ה-CTE למעלה.
      'label_source', 'WEEKDAY_NAMES_HE',
      'domain', null, 'refLines', '[]'::jsonb, 'unit', 'percent'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'hostess_name',  'label', 'דיילת',                'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'status',        'label', 'סטטוס',                'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'shifts',        'label', 'משמרות',               'format', 'int',   'align', 'end'),
      jsonb_build_object('key', 'on_time_pct',   'label', 'הגיעה בזמן',           'format', 'percent', 'align', 'end'),
      jsonb_build_object('key', 'late',          'label', 'איחור',                'format', 'int',   'align', 'end'),
      jsonb_build_object('key', 'no_show_12m',   'label', 'הבריזה · ב-12 חודשים', 'format', 'int',   'align', 'end'),
      jsonb_build_object('key', 'no_show_ever',  'label', 'אי-הגעה · אי-פעם',     'format', 'int',   'align', 'end'),
      jsonb_build_object('key', 'reliability',   'label', 'ציון אמינות',           'format', 'score', 'align', 'end')),
    'rows', coalesce(v_rows, '[]'::jsonb),
    'so_what', case
      when not v_bands_on then 'אין סימון אמינות עד שהמקדמים בהגדרות המערכת יתוקנו.'
      when coalesce(v_flagged, 0) = 0 then 'אין דיילות מתחת לסף בתקופה שנבחרה.'
      when coalesce(v_red, 0) = 0 then 'להזהיר את ' || v_amber || ' דיילות הענבר — אף אחת אינה אדומה החודש.'
      else 'לא לשלוח את ' || v_red || ' הדיילות האדומות — ' || coalesce(v_red_active, 0) ||
           ' מהן פעילות ומוצעות היום בשיבוץ; ' || coalesce(v_amber, 0) || ' דיילות ענבר לאזהרה.' end,
    'definitions', 'הגדרות: ציון אמינות = (סכום ערכי-הנוכחות + ' || coalesce(v_m::text, '—') || ' × ' ||
      coalesce(round(v_c, 4)::text, '—') || ') ÷ (מספר המשמרות + ' || coalesce(v_m::text, '—') ||
      ') — ממוצע ממותן אל ממוצע החברה · איחור נספר לפי דרגה: קל אינו מוריד מהציון, בינוני מוריד רבע, רב מוריד חצי · ' ||
      'שתי עמודות אי-ההגעה, ואף אחת מהן אינה "הנכונה": "הבריזה · ב-12 חודשים" היא ההגדרה שהציון עצמו עובד לפיה — רק אי-הגעה בלי הודעה, ורק בחלון הקפוא · ' ||
      '"אי-הגעה · אי-פעם" היא כל סיבות אי-ההגעה — כולל מחלה והיעדרות באישור — ועל כל ההיסטוריה. שתיהן נכונות בהגדרתן, והדוח אינו בוחר ביניהן · ' ||
      'הבריזה = לא הגיעה ולא הודיעה — רק היא מאפסת את הציון של אותה משמרת · ' ||
      'ביטלה אחרי אישור = הודיעה שלא תגיע אחרי שכבר אושרה סופית — נספר כחצי משמרת · ' ||
      'החלון = 12 חודשים אחורה מהיום, קפוא ואינו נגרר אחרי מסנן-התקופה.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', to_jsonb(v_missing),
      'frozen_count', null,
      'notes', v_notes || to_jsonb(
        ('מתחת לסף המדגם: ' || coalesce(v_below, 0) || ' דיילות עם פחות מ-' ||
         coalesce(v_min_sample::text, '—') || ' משמרות מסומנות אינן בדוח (' ||
         coalesce(v_shifts_out, 0) || ' שיבוצים).')::text),
      'run', null,
      'company_average', round(v_c, 6),
      'red_threshold', case when v_bands_on then round(v_red_coef   * v_c, 6) end,
      'amber_threshold', case when v_bands_on then round(v_amber_coef * v_c, 6) end,
      'selected_dow', v_dow,
      -- 🆕 הכרעה 37 בחתך-דירוג: האובייקט למכונה, והטבלה למסך — אותם מספרים, פעם אחת.
      'no_show_by_rating', jsonb_build_object(
        'months12', coalesce(v_ns12, '{}'::jsonb),
        'ever',     coalesce(v_ns_ever, '{}'::jsonb)),
      'extra_tables', jsonb_build_array(jsonb_build_object(
        'title', 'אי-הגעה לפי דירוג',
        'columns', jsonb_build_array(
          jsonb_build_object('key', 'rating_label', 'label', 'דירוג',      'format', 'text',    'align', 'start'),
          jsonb_build_object('key', 'months12',     'label', '12 חודשים',  'format', 'percent', 'align', 'end'),
          jsonb_build_object('key', 'ever',         'label', 'אי-פעם',     'format', 'percent', 'align', 'end')),
        'rows', coalesce(v_ns_rows, '[]'::jsonb),
        'note', 'שתי העמודות נמדדות על מכנים שונים: "12 חודשים" סופרת הבריזה בלבד מתוך השיבוצים שסומנה בהם נוכחות בחלון הקפוא, ו"אי-פעם" סופרת כל סיבות אי-ההגעה מתוך כל ההיסטוריה המסומנת. אפשר להשוות בין דירוגים בתוך עמודה, לא בין העמודות.',
        'sort', jsonb_build_object('key', 'rating_label', 'direction', 'descending'))),
      -- ‏📐9 · הקורא בפועל הוא `meta.sort` (‏`ReportSurface.jsx:253`) — ר' ההערה במ14.
      'sort', jsonb_build_object('key', 'reliability', 'direction', 'ascending'),
      -- ‏C8: תכונה של המשטח, לא של הקריאה — הדף אינו מסונן לפי לקוח אף פעם.
      'customer_filter_ignored', true,
      'drill_echo', p_drill));
end;
$function$;

comment on function public.report_m15_reliability(date, date, integer, jsonb) is
'מ11 · אמינות והתייצבות (תומך-החלטה). אוכלוסייה: דיילות עם מינימום_תשובות_להצגת_ציון משמרות מסומנות ומעלה בחלון הקפוא של 12 חודשים. הוצאו: דיילות מתחת לסף המדגם (מונה גלוי, לא אחוז), והיעדרות באישור-מראש ומחלה — לא במונה ולא במכנה. הציון הוא reliabilityScore של Smart Match מילה-במילה (הכרעה 38), והספים 0.87/0.95 מממוצע-החברה נקראים מ-params בזמן-ריצה (הכרעה 35). אי-הגעה מוצגת בשתי עמודות והדוח אינו בוחר ביניהן (הכרעה 37). החלון קפוא ואינו נגרר אחרי מסנן-התקופה.';

revoke execute on function public.report_m15_reliability(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m15_reliability(date, date, integer, jsonb) to authenticated;

create or replace function public.report_m17_fairness(
  p_from        date    default null,
  p_to          date    default null,
  p_customer_id integer default null,
  p_drill       jsonb   default null
) returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_today        date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to           date;
  v_from         date;
  v_prev_to      date;
  v_prev_from    date;
  v_notes        jsonb := '[]'::jsonb;
  v_speed_rows   jsonb;
  v_gini         numeric;
  v_gini_prev    numeric;
  v_n            integer;
  v_n_prev       integer;
  v_shifts       integer;
  v_shifts_prev  integer;
  v_registered   integer;
  v_top_q_n      integer;
  v_top_q_pct    numeric;
  v_bottom_pct   numeric;
  v_top_dec_pct  numeric;
  v_max_shifts   integer;
  v_med_shifts   numeric;
  v_avg_shifts   numeric;
  v_invites      integer;
  v_answered     integer;
  v_prev_inv     integer;
  v_prev_ans     integer;
  v_med_hours    numeric;
  v_p90_hours    numeric;
  v_prev_med     numeric;
  v_prev_p90     numeric;
  v_rank_total   integer;
  v_rank_first   integer;
  v_rank_from    date;
  v_lorenz       jsonb;
  v_rows         jsonb;
  v_min_sample   numeric;
  v_missing      text[] := array[]::text[];
  v_resp_rating  jsonb;
  -- 📐3 · תווית-החלון נגזרת מהחלון ולא קבועה בקוד — ר' ההערה במ14 (F2).
  v_win_text     text;
  v_win_full     text;
  -- בידוד-כיווניות למספרים בתוך משפט עברי — התאום של `isolateLtr` ב-`reportsFormat.js`
  -- ושל `v_lri`/`v_pdi` במיגרציית-ההנהלה. בלעדיו טווח-תאריכים מתהפך והסימן נודד.
  v_lri constant text := chr(8294);   -- U+2066 LRI
  v_pdi constant text := chr(8297);   -- U+2069 PDI
begin
  perform public.assert_module_permission('דיילות', array['edit', 'view']);

  v_to        := coalesce(p_to, v_today);
  v_from      := coalesce(p_from, (v_to - interval '12 months')::date);
  v_prev_to   := v_from;
  v_prev_from := (v_from - (v_to - v_from))::date;

  v_win_text  := case when v_from = (v_to - interval '12 months')::date then '12 החודשים האחרונים'
                      else v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi end;
  v_win_full  := v_win_text || case when v_from = (v_to - interval '12 months')::date
                                    then ' (' || v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' ||
                                         to_char(v_to, 'DD/MM/YYYY') || v_pdi || ')'
                                    else '' end;

  select nullif(btrim(pa.param_value), '')::numeric into v_min_sample
    from public.params pa where pa.param_name = 'מינימום_תשובות_להצגת_ציון';
  if v_min_sample is null then v_missing := v_missing || 'מינימום_תשובות_להצגת_ציון'; end if;

  if p_customer_id is not null then
    v_notes := v_notes || to_jsonb(
      'הדף אינו מושפע ממסנן הלקוח — ההוגנות נמדדת על חלוקת המשמרות בכל המאגר.'::text);
  end if;

  -- ── אזור ההוגנות: ספירת משמרות `finally_approved` פר-דיילת, אירוע שעבר (§ח8-1).
  -- 🔴 **ג'יני גרסת-אוכלוסייה**, בלי `n/(n−1)` — `spec.md §🔢 3.3`, והאורקל ב-
  --    `src/lib/reportsHostesses.test.js` (‏1·2·3·4·10 ⇒ 0.40 · המדגם ⇒ 0.50).
  -- **עקומת-לורנץ נגזרת מאותה סדרה בדיוק** ⇒ המדד והעקומה לעולם לא סותרים זה את זה.
  -- ‏`(i·100)/n` ולא `(i/n)·100`: השנייה מחזירה 60.00000000000001 ומגיעה לטבלת-ה-`sr-only`.
  with counted as (
    select a.hostess_id, count(*)::numeric shifts, (a.event_date > v_from) as is_cur
      from public.assignments a
     where a.assignment_status = 'finally_approved'
       and a.event_date > v_prev_from and a.event_date <= least(v_to, v_today)
     group by a.hostess_id, (a.event_date > v_from)
  ), ranked as (
    select is_cur, hostess_id, shifts,
           row_number() over (partition by is_cur order by shifts, hostess_id)      rn_asc,
           row_number() over (partition by is_cur order by shifts desc, hostess_id) rn_desc,
           sum(shifts)   over (partition by is_cur order by shifts, hostess_id
                               rows between unbounded preceding and current row)    cum,
           count(*)      over (partition by is_cur)                                 n,
           sum(shifts)   over (partition by is_cur)                                 total
      from counted
  ), agg as (
    select is_cur, max(n)::numeric n, max(total) total, sum(rn_asc * shifts) weighted,
           max(shifts) max_shifts, avg(shifts) avg_shifts,
           (percentile_cont(0.5) within group (order by shifts))::numeric med_shifts
      from ranked group by is_cur
  ), lorenz as (
    select jsonb_build_array(jsonb_build_object('x', 0, 'y', 0)) ||
           coalesce(jsonb_agg(jsonb_build_object(
             'x', round((rn_asc * 100.0) / nullif(n, 0), 4),
             'y', round((cum * 100.0) / nullif(total, 0), 4)) order by rn_asc), '[]'::jsonb) j
      from ranked where is_cur
  )
  select (select n from agg where is_cur)::integer,
         (select total from agg where is_cur)::integer,
         (select case when n >= 2 and total > 0 then (2 * weighted) / (n * total) - (n + 1) / n end
            from agg where is_cur),
         (select ceil(n / 4.0)::integer from agg where is_cur),
         (select round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) from ranked r
           where r.is_cur and r.rn_desc <= ceil(r.n / 4.0)),
         (select round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) from ranked r
           where r.is_cur and r.rn_asc <= floor(r.n / 2.0)),
         (select round(100.0 * sum(r.shifts) / nullif(max(r.total), 0), 1) from ranked r
           where r.is_cur and r.rn_desc <= ceil(r.n / 10.0)),
         (select n from agg where not is_cur)::integer,
         (select total from agg where not is_cur)::integer,
         (select case when n >= 2 and total > 0 then (2 * weighted) / (n * total) - (n + 1) / n end
            from agg where not is_cur),
         (select max_shifts from agg where is_cur)::integer,
         (select med_shifts from agg where is_cur),
         (select round(avg_shifts, 1) from agg where is_cur),
         (select j from lorenz),
         (select count(*) from public.hostesses)
    into v_n, v_shifts, v_gini, v_top_q_n, v_top_q_pct, v_bottom_pct, v_top_dec_pct,
         v_n_prev, v_shifts_prev, v_gini_prev,
         v_max_shifts, v_med_shifts, v_avg_shifts, v_lorenz, v_registered;

  -- ── אזור המהירות: זימונים שנשלחו, על פי תאריך-האירוע שבחלון.
  -- ‏🔴 **מי שלא ענתה כלל נספרת במכנה של אחוז-ההיענות** (§ח8-6 · ⑥), ואינה נכנסת לחישוב-הזמן.
  select count(*), count(*) filter (where a.responded_at is not null),
         (percentile_cont(0.5) within group (order by extract(epoch from (a.responded_at - a.invite_sent_at)) / 3600.0)
           filter (where a.responded_at is not null))::numeric,
         (percentile_cont(0.9) within group (order by extract(epoch from (a.responded_at - a.invite_sent_at)) / 3600.0)
           filter (where a.responded_at is not null))::numeric
    into v_invites, v_answered, v_med_hours, v_p90_hours
    from public.assignments a
   where a.invite_sent_at is not null and a.event_date > v_from and a.event_date <= v_to;

  select count(*), count(*) filter (where a.responded_at is not null),
         (percentile_cont(0.5) within group (order by extract(epoch from (a.responded_at - a.invite_sent_at)) / 3600.0)
           filter (where a.responded_at is not null))::numeric,
         (percentile_cont(0.9) within group (order by extract(epoch from (a.responded_at - a.invite_sent_at)) / 3600.0)
           filter (where a.responded_at is not null))::numeric
    into v_prev_inv, v_prev_ans, v_prev_med, v_prev_p90
    from public.assignments a
   where a.invite_sent_at is not null and a.event_date > v_prev_from and a.event_date <= v_prev_to;

  -- ── אימוץ ההמלצה: היעדר מוצהר. `v_rank_from` = המשמרת הראשונה שבה בכלל נרשם דרג.
  select count(*) filter (where a.recommended_rank is not null),
         count(*) filter (where a.recommended_rank = 1),
         min(a.event_date) filter (where a.recommended_rank is not null)
    into v_rank_total, v_rank_first, v_rank_from
    from public.assignments a
   where a.event_date > v_from and a.event_date <= v_to;

  if coalesce(v_rank_total, 0) = 0 then
    v_notes := v_notes || to_jsonb(
      'אימוץ המלצת Smart Match — אין עדיין נתון: המערכת התחילה לרשום את הדרג שהמליצה רק מעכשיו, ועד שייצברו שיבוצים המדד מציג "—" ולא 0%.'::text);
  end if;

  -- ── שתי הטבלאות: ההוגנות ב-`rows`, המהירות ב-`meta.extra_tables` (⑧17.1 · ⑧17.6).
  -- **שתיהן מוחזרות במלואן וממוינות** — המוקאפ מצייר 8 שורות כמוסכמת-ציור (‏`cards-finance.md` G3:
  -- *"8 שורות = מוסכמת-מוקאפ; בבנייה 50"*), והפאג'ר הוא שסופר את מה שהטבלה מציגה (📐8).
  -- 🔴 **סף-המדגם אינו נופל לברירת-מחדל:** בלי `מינימום_תשובות_להצגת_ציון` אין טבלת-מהירות
  --    כלל, והבאנר *"חסר פרמטר מערכת"* מסביר למה — `coalesce(…, 3)` היה ממציא סף בשקט.
  with cur as (
    select a.hostess_id, count(*)::numeric shifts
      from public.assignments a
     where a.assignment_status = 'finally_approved'
       and a.event_date > v_from and a.event_date <= least(v_to, v_today)
     group by a.hostess_id
  ),
  ranked as (
    select hostess_id, shifts,
           row_number() over (order by shifts desc, hostess_id) rn,
           -- ✒️ **"אחוז מצטבר" הוא עמודה במוקאפ המאושר** (‏`04_tab_hostesses_approved.html`
           --    §p4, הכותרת החמישית בטבלת-העמוסות), ושורת-ה-`tnote` שמתחתיה נשענת עליה
           --    במילים: *"שמונה הדיילות העמוסות ביותר מחזיקות יחד 19.5%"*. בלעדיה הטבלה
           --    אינה יכולה לומר את המשפט שהיא כתובה כדי לומר. מצטבר **מהעמוסה ומטה**.
           sum(shifts) over (order by shifts desc, hostess_id
                             rows between unbounded preceding and current row) cum
      from cur
  ), busiest as (
    select r.hostess_id, r.shifts, r.rn,
           round(100.0 * r.shifts / nullif(v_shifts, 0), 1) pct,
           round(100.0 * r.cum    / nullif(v_shifts, 0), 1) cum_pct
      from ranked r
  ), slowest as (
    select a.hostess_id, count(*) invites,
           count(*) filter (where a.responded_at is not null) answered,
           (percentile_cont(0.5) within group (order by extract(epoch from (a.responded_at - a.invite_sent_at)) / 3600.0)
             filter (where a.responded_at is not null))::numeric med_hours
      from public.assignments a
     where a.invite_sent_at is not null and a.event_date > v_from and a.event_date <= v_to
     group by a.hostess_id
    having count(*) >= v_min_sample
  ), fairness_rows as (
    select coalesce(jsonb_agg(jsonb_build_object(
             'drill_key', jsonb_build_object('kind', 'hostess', 'id', b.hostess_id),
             'hostess_name', h.full_name,
             'status', case when h.status = 'active' then 'פעילה' else 'לא פעילה' end,
             'shifts', b.shifts, 'share_pct', b.pct, 'cum_pct', b.cum_pct,
             'rank', b.rn) order by b.rn), '[]'::jsonb) j
      from busiest b join public.hostesses h on h.hostess_id = b.hostess_id
  ), speed_rows as (
    -- 🔴 **הסוגר שהפיל את הפונקציה כולה (נמדד 16/09/2026):** ‏`coalesce(` נפתח כאן ולא
    --    נסגר — הסגירה האחרונה הייתה של `jsonb_agg` ואחריה `j` — ולכן ה-CTE **בלע את כל
    --    ה-`return` שאחריו**, והקומפילציה מתה ב-`42601 unexpected end of function
    --    definition at end of input` **על הפונקציה כולה**. שגיאת-תו אחת מחקה משטח שלם,
    --    ו-32 בדיקות-היחידה נשארו ירוקות כי אינן נוגעות ב-SQL. התאום `fairness_rows`
    --    מעליה סוגר נכון; ההבדל הוא בדיוק `), '[]'::jsonb) j`.
    select coalesce(jsonb_agg(jsonb_build_object(
             'drill_key', jsonb_build_object('kind', 'hostess', 'id', s.hostess_id),
             'hostess_name', h.full_name,
             'status', case when h.status = 'active' then 'פעילה' else 'לא פעילה' end,
             'rating', h.rating, 'invites', s.invites, 'answered', s.answered,
             -- ✒️ שתי העמודות האלה מצוירות במוקאפ ("זומנה · ענתה · אחוז היענות") ולא היה
             --    להן בית במטען. ‏`הנחתי` — מדווח.
             'response_rate', round(100.0 * s.answered / nullif(s.invites, 0), 1),
             -- ‏`::numeric` לפני `round` — ל-`percentile_cont` **אין וריאנט numeric**,
             -- היא מחזירה `double precision`, ו-`round(double precision, int)` אינה קיימת
             -- ‏(‏`42883`). המשתנים למעלה ניצלו רק כי ההשמה לטיפוס-המשתנה ממירה בשקט.
             'median_response_hours', round(s.med_hours, 1))
             order by s.med_hours desc, h.full_name), '[]'::jsonb) j
      from slowest s join public.hostesses h on h.hostess_id = s.hostess_id
     where s.med_hours is not null
  )
  select f.j, s.j into v_rows, v_speed_rows from fairness_rows f, speed_rows s;

  -- ✒️ חציון-התגובה לפי דירוג — שורת-ה-`tnote` של טבלת-האיטיות נוקבת בו במילים
  --    (*"26.5 · 10.1 · 4.0 שעות"* לדירוגים 3/4/5, כרטיס ③ מ17), והוא הדפוס שמסביר
  --    למה כל השמונה האיטיות הן דירוג 3. מוחזר מוכן כדי שהלשונית לא תגזור אותו מחדש.
  select jsonb_object_agg(rating::text, med) filter (where rating is not null)
    into v_resp_rating
    from (
      select h.rating,
             round((percentile_cont(0.5) within group (
               order by extract(epoch from (a.responded_at - a.invite_sent_at)) / 3600.0))::numeric, 1) med
        from public.assignments a
        join public.hostesses h on h.hostess_id = a.hostess_id
       where a.invite_sent_at is not null and a.responded_at is not null
         and a.event_date > v_from and a.event_date <= v_to
       group by h.rating
    ) s;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', coalesce(v_n, 0),
      'label', 'אוכלוסייה: כל דיילת עם משמרת מאושרת אחת לפחות בחלון — ' ||
               v_lri || 'n=' || coalesce(v_n, 0) || v_pdi || ' דיילות, ' ||
               v_lri || to_char(coalesce(v_shifts, 0), 'FM999,999') || v_pdi || ' משמרות · הוצאו: ' ||
               v_lri || coalesce(v_registered - coalesce(v_n, 0), 0) || v_pdi ||
               ' דיילות רשומות שלא עבדה אף משמרת בחלון (מי שאינה במשחק אינה יכולה להיות מקופחת בו) · אזור המהירות נמדד על אוכלוסייה אחרת: ' ||
               v_lri || to_char(coalesce(v_invites, 0), 'FM999,999') || v_pdi ||
               ' זימונים שנשלחו בחלון, ולא על דיילות — שני n נפרדים, מוצהרים בכל אזור.',
      'excluded', jsonb_build_object('לא עבדה בחלון', coalesce(v_registered - coalesce(v_n, 0), 0))),
    'window', jsonb_build_object('from', v_from, 'to', v_to, 'label', v_win_full),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'gini', 'label', 'ריכוזיות המשמרות', 'value', round(v_gini, 4), 'format', 'gini',
        -- תת-השורה מועתקת מהמוקאפ המאושר: המדד מוסבר בקצוות שלו, לא בסף שאין לו.
        'sub', 'מדד ג''יני · ' || v_lri || '0' || v_pdi || ' = חלוקה שווה בין הדיילות · ' ||
               v_lri || '1' || v_pdi || ' = דיילת אחת מקבלת הכול',
        'window', v_win_text,
        'compare', case when v_gini_prev is null then null else jsonb_build_object(
          'value', round(v_gini_prev, 4),
          'label', 'התקופה המקבילה אשתקד · ' || v_lri || 'n=' || coalesce(v_n_prev, 0) || v_pdi ||
                   ' מול ' || v_lri || 'n=' || coalesce(v_n, 0) || v_pdi || ' היום',
          'note', 'חלק מהשינוי הוא שינוי-אוכלוסייה ולא שינוי-התנהגות',
          'direction', case when v_gini > v_gini_prev then 'up' when v_gini < v_gini_prev then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'top_quarter', 'label', 'רבע הדיילות העמוסות', 'value', v_top_q_pct, 'format', 'percent',
        'sub', v_lri || coalesce(v_top_q_n, 0) || v_pdi || ' דיילות מתוך ' ||
               v_lri || coalesce(v_n, 0) || v_pdi || ' · מחצית המאגר מקבלת ' ||
               v_lri || coalesce(v_bottom_pct::text, '—') || '%' || v_pdi || ' · העשירון העליון ' ||
               v_lri || coalesce(v_top_dec_pct::text, '—') || '%' || v_pdi,
        'window', v_win_text,
        'compare', null, 'target', null),
      jsonb_build_object('key', 'rank1_adoption', 'label', 'אימוץ המלצת Smart Match',
        -- ‏`nullif` ולא הסתמכות על קיצור-ה-CASE: המכנה הוא **0 היום** בכל השורות
        -- (‏`recommended_rank` נולדה ריקה), וזו הזרוע היחידה בקובץ שחילקה בו.
        'value', case when coalesce(v_rank_total, 0) = 0 then null
                      else round(100.0 * v_rank_first / nullif(v_rank_total, 0), 1) end,
        'format', 'percent',
        'sub', 'דרג ' || v_lri || '1' || v_pdi || ' = הדיילת שהמערכת דירגה ראשונה · ' ||
               case when coalesce(v_rank_total, 0) = 0
                    then 'נמדד מ-— · אין עדיין נתון: המערכת התחילה לרשום את הדרג שהמליצה רק מעכשיו, ועד שייצברו שיבוצים המדד מציג "—" ולא ' ||
                         v_lri || '0%' || v_pdi
                    else 'נמדד מ-' || v_lri || to_char(v_rank_from, 'DD/MM/YYYY') || v_pdi || '; ' ||
                         v_lri || v_rank_total || v_pdi || ' שיבוצים' end,
        'window', case when coalesce(v_rank_total, 0) = 0 then 'טרם נמדד'
                       else 'נמדד מ-' || v_lri || to_char(v_rank_from, 'DD/MM/YYYY') || v_pdi end,
        'compare', null, 'target', null),
      jsonb_build_object('key', 'median_response', 'label', 'זמן-תגובה חציוני לזימון',
        'value', round(v_med_hours, 1), 'format', 'days',
        'sub', 'שעות, מרגע שליחת הזימון האחרון ועד שהדיילת ענתה · ' ||
               v_lri || to_char(coalesce(v_answered, 0), 'FM999,999') || v_pdi || ' תשובות',
        'window', v_win_text,
        'compare', case when v_prev_med is null then null else jsonb_build_object(
          'value', round(v_prev_med, 1), 'label', 'התקופה המקבילה אשתקד', 'note', null,
          'direction', case when v_med_hours > v_prev_med then 'up' when v_med_hours < v_prev_med then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'p90_response', 'label', 'זמן-תגובה, אחוזון 90',
        'value', round(v_p90_hours, 1), 'format', 'days',
        'sub', 'אחת מכל עשר תשובות מגיעה לאט מזה — שם יושב הכאב של איוש שנתקע, לא בחציון',
        'window', v_win_text,
        'compare', case when v_prev_p90 is null then null else jsonb_build_object(
          'value', round(v_prev_p90, 1), 'label', 'התקופה המקבילה אשתקד', 'note', null,
          'direction', case when v_p90_hours > v_prev_p90 then 'up' when v_p90_hours < v_prev_p90 then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'response_rate', 'label', 'אחוז היענות לזימון',
        'value', round(100.0 * v_answered / nullif(v_invites, 0), 1), 'format', 'percent',
        'sub', v_lri || to_char(coalesce(v_answered, 0), 'FM999,999') || v_pdi || ' ענו מתוך ' ||
               v_lri || to_char(coalesce(v_invites, 0), 'FM999,999') || v_pdi || ' שזומנו · ' ||
               v_lri || to_char(coalesce(v_invites, 0) - coalesce(v_answered, 0), 'FM999,999') || v_pdi ||
               ' לא ענו כלל — והן נספרות במכנה',
        'window', v_win_text,
        'compare', case when coalesce(v_prev_inv, 0) = 0 then null else jsonb_build_object(
          'value', round(100.0 * v_prev_ans / nullif(v_prev_inv, 0), 1), 'label', 'התקופה המקבילה אשתקד',
          'note', v_lri || to_char(coalesce(v_prev_ans, 0), 'FM999,999') || v_pdi || ' מתוך ' ||
                  v_lri || to_char(coalesce(v_prev_inv, 0), 'FM999,999') || v_pdi,
          'direction', case when v_answered * v_prev_inv > v_prev_ans * v_invites then 'up'
                            when v_answered * v_prev_inv < v_prev_ans * v_invites then 'down' else 'flat' end) end,
        'target', null)),
    'chart', jsonb_build_object(
      'type', 'lorenz', 'title', 'עקומת לורנץ · חלוקת המשמרות בין הדיילות',
      'series', jsonb_build_array(jsonb_build_object('key', 'y', 'label', 'אחוז-משמרות מצטבר')),
      'data', coalesce(v_lorenz, '[]'::jsonb), 'xKey', 'x',
      'domain', jsonb_build_array(0, 100),
      'refLines', jsonb_build_array(
        jsonb_build_object('axis', 'y', 'value', v_bottom_pct,
          'label', 'מחצית הדיילות = ' || v_lri || coalesce(v_bottom_pct::text, '—') || '%' || v_pdi || ' מהמשמרות')),
      'unit', 'percent'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'hostess_name', 'label', 'דיילת',        'format', 'text',    'align', 'start'),
      jsonb_build_object('key', 'status',       'label', 'סטטוס',        'format', 'text',    'align', 'start'),
      jsonb_build_object('key', 'shifts',       'label', 'משמרות',       'format', 'int',     'align', 'end'),
      jsonb_build_object('key', 'share_pct',    'label', 'חלק מהמשמרות', 'format', 'percent', 'align', 'end'),
      jsonb_build_object('key', 'cum_pct',      'label', 'אחוז מצטבר',   'format', 'percent', 'align', 'end')),
    'rows', coalesce(v_rows, '[]'::jsonb),
    'so_what', case
      when v_gini is null then 'אין מספיק דיילות שעבדו בחלון כדי למדוד ריכוזיות.'
      else 'לפתוח את מסך השיבוץ עם רבע הדיילות התחתון — ' || v_lri || coalesce(v_top_q_n, 0) || v_pdi ||
           ' דיילות מקבלות ' || v_lri || coalesce(v_top_q_pct::text, '—') || '%' || v_pdi ||
           ' מהמשמרות בעוד מחצית המאגר מקבלת ' || v_lri || coalesce(v_bottom_pct::text, '—') || '%' || v_pdi || '.' end,
    'definitions', 'הגדרות: מדד ג''יני = מדד ריכוזיות בין ' || v_lri || '0' || v_pdi || ' ל-' ||
      v_lri || '1' || v_pdi || ', כאן על מספר המשמרות לכל דיילת · ' ||
      'עקומת לורנץ = אותו נתון כגרף: לכל אחוז דיילות (מהפחות-עמוסה), כמה אחוז מהמשמרות הצטברו · ' ||
      'משמרת = שיבוץ שאושר סופית ושתאריך האירוע שלו כבר עבר · ' ||
      'זמן-תגובה = מרגע שליחת הזימון האחרון ועד שהדיילת ענתה, בשעות — לא מרגע פתיחת האירוע · ' ||
      'אחוזון ' || v_lri || '90' || v_pdi || ' = הערך שתשע מכל עשר תשובות מהירות ממנו · ' ||
      'אחוז היענות = ענו ÷ זומנו; מי שלא ענתה כלל נספרת במכנה.',
    -- 🔴 14א הוא דוח-**בקרה** ואינו אחד מארבעת דוחות-הקידוח של 📐13 (§9 D-14) ⇒
    --    `drill` **תמיד** `null`, ו-`p_drill` חוזר כהד בלבד ואינו משנה דבר.
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', to_jsonb(v_missing),
      'frozen_count', null,
      'notes', v_notes || to_jsonb(
        ('זמן-התגובה נמדד מאז הזימון האחרון ולא מהראשון — שליחה חוזרת דורסת את שעת הזימון, ולכן הזמן שרואים כאן קצר מהזמן שבאמת חיכית.')::text),
      'run', null,
      -- אזור-המהירות: טבלה שנייה על אוכלוסייה אחרת (זימונים, לא דיילות) ⇒ `extra_tables`.
      'extra_tables', jsonb_build_array(jsonb_build_object(
        'title', 'הדיילות שעונות הכי לאט',
        'columns', jsonb_build_array(
          jsonb_build_object('key', 'hostess_name',  'label', 'דיילת',       'format', 'text',    'align', 'start'),
          jsonb_build_object('key', 'status',        'label', 'סטטוס',       'format', 'text',    'align', 'start'),
          jsonb_build_object('key', 'rating',        'label', 'דירוג',       'format', 'int',     'align', 'end'),
          jsonb_build_object('key', 'invites',       'label', 'זומנה',       'format', 'int',     'align', 'end'),
          jsonb_build_object('key', 'answered',      'label', 'ענתה',        'format', 'int',     'align', 'end'),
          jsonb_build_object('key', 'response_rate', 'label', 'אחוז היענות', 'format', 'percent', 'align', 'end'),
          jsonb_build_object('key', 'median_response_hours', 'label', 'זמן-תגובה חציוני (שעות)',
                             'format', 'ratio', 'align', 'end')),
        'rows', coalesce(v_speed_rows, '[]'::jsonb),
        'sort', jsonb_build_object('key', 'median_response_hours', 'direction', 'descending'))),
      'shift_stats', jsonb_build_object('max', v_max_shifts, 'median', v_med_shifts, 'mean', v_avg_shifts),
      'top_decile_pct', v_top_dec_pct,
      'response_median_by_rating', coalesce(v_resp_rating, '{}'::jsonb),
      'previous', jsonb_build_object('n', v_n_prev, 'shifts', v_shifts_prev, 'gini', round(v_gini_prev, 4)),
      -- ‏📐9 · הקורא בפועל הוא `meta.sort` (‏`ReportSurface.jsx:253`) — ר' ההערה במ14.
      'sort', jsonb_build_object('key', 'shifts', 'direction', 'descending'),
      -- ‏C8: תכונה של המשטח, לא של הקריאה.
      'customer_filter_ignored', true,
      'drill_echo', p_drill));
end;
$function$;

comment on function public.report_m17_fairness(date, date, integer, jsonb) is
'מ11 · הוגנות השיבוץ (בקרה). שתי אוכלוסיות: ההוגנות נמדדת על כל דיילת עם משמרת מאושרת אחת לפחות בחלון (הוצאו הדיילות שלא עבדה אף משמרת בו), והמהירות על הזימונים שנשלחו בחלון — שני n נפרדים. ג''יני הוא גרסת-האוכלוסייה על ספירת המשמרות פר-דיילת, בחלון חצי-פתוח (from, to]. זמן-התגובה נמדד מאז הזימון האחרון, כי שליחה חוזרת דורסת את invite_sent_at (R2). אימוץ המלצת Smart Match מציג היעדר מוצהר ולא 0% כל עוד recommended_rank ריקה.';

revoke execute on function public.report_m17_fairness(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m17_fairness(date, date, integer, jsonb) to authenticated;
