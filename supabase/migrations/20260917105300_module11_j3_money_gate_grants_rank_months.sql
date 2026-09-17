-- =============================================================================
-- מודול 11 · מיגרציה J3 — ארבע הכרעות של ישי מ-17/09/2026 06:5X, בקובץ אחד
-- =============================================================================
-- why: ארבעה פריטים שנפתחו באודיט-הסגירה של מ11 וישי הכריע בהם היום *"בצע"* / *"תקן"*.
-- כל בלוק כאן נושא בכותרתו את ההכרעה שהוא מבצע, ואת המקום שבו היא כתובה.
--
-- ‏① **§7.100 · מיסוך-הכסף עובר אל תוך המסד** (`docs/PROJECT_MASTER_sec7.md` פריט 100,
--    אפשרות (ב); הראיה: `docs/archive/close-findings-module-11.md` F-12 · `PROJECT_MASTER §6` T4).
--    ‏`report_m19_customers_overview` ו-`report_m21_drifting` מחזירות `null` בשדות-הכסף
--    ו-`meta.money_masked = true` לקוראת שאינה `view`/`edit` על **'כספים'**.
--    🔴 **שער 'לקוחות' לא זז:** מי שחסומה עליו מקבלת 42501 בדיוק כמו קודם.
--    🔑 **המיסוך בלשונית נשאר** (`tabs/customers/payload.jsx` `maskMoney`) — הוא שכבת-**תצוגה**
--    (*"לא זמין בתפקידך"*), והוא פועל על `format` ולא על הערך, ולכן `null` מהשרת מצייר
--    את המשפט ולא `—`. שתי השכבות מסכימות; אף אחת אינה מיותרת.
--
-- ‏② **T2 · שלילת הרשאות-הטבלה מארבע טבלאות ה-deny-all** (`PROJECT_MASTER §6` T2 ·
--    ‏`close-findings-module-11.md` F-02). ‏RLS-בלי-מדיניות כבר חוסמת אותן היום, אבל הגרנט
--    ‏מ-`anon`/`authenticated` עומד במרחק `disable row level security` אחד מעולם-קריא —
--    בדיוק סיפור ה-`bak_*` ש-D-11 מצא ו-H0 תיקן. התבנית ההרמטית כבר קיימת במסד הזה
--    (‏`login_rpc_calls` · ששת ה-`bak_*`): לשלול גם את הגרנט.
--
-- ‏③ **T9 · `assignments.recommended_rank_set_at`** (`PROJECT_MASTER §6` T9 · F-19(ג)) —
--    עמודה תוספתית nullable + טריגר שמחתים אותה **בשעון-המסד**.
--
-- ‏④ **תוויות-החודשים בצירי הגרפים מתקצרות** (הכרעת ישי *"תקן"*, 17/09/2026) — `v_months_he`
--    בחמש הפונקציות שיש בהן ציר-חודשים. השנה נשארת **בדיוק** כפי ש-J2 הכריע.
--
-- 🔻 **שער-האישור:** ההסבר-בעברית ניתן וישי אישר בצ'אט *"בצע"*/*"תקן"*; ה-typed-echo מושהה
--    למודול הזה בלבד (`micro_guides/module-11.md` §9 D-9).
--
-- 🧱 **אופן ההחלה (D-20):** ‏`apply_migration` קוטמת סביב ~90 KB ⇒ הקובץ מוחל **פר פונקציה**,
--    כל נתח < 60 KB, בשמות `module11_j3_*`. הקובץ הוא מקור-האמת; אחרי ההחלה הושווה
--    ‏`md5(prosrc)` החי לגוף-ה-`$function$` שבקובץ.
--
-- 🔁 **הפיכוּת:** ①+④ — החלת הגוף הקודם (J2 / J1 / I2) מחזירה את המצב · ② —
--    ‏`grant all on table … to anon, authenticated` · ③ — `drop trigger` + `drop column`.
-- =============================================================================


-- =============================================================================
-- בלוק 1 · §7.100 — מיסוך-הכסף בתוך המסד (מ19 · מ21)
-- =============================================================================
-- ‏`report_m19_customers_overview` נושאת כאן **גם** את שינוי ④ (תוויות-החודשים),
-- כי גוף אחד אינו יכול להיכתב פעמיים.

create or replace function public.report_m19_customers_overview(
  p_from        date    default null,
  p_to          date    default null,
  p_customer_id integer default null,
  p_drill       jsonb   default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  -- שעון-ישראל ולא `current_date` (UTC): אחרי חצות ה-UTC עדיין "אתמול" — המוקש שנמדד
  -- בסיד של מודול 5 ב-26/08/2026 וחוזר בכל RPC של המודול.
  v_today      date := (now() at time zone 'Asia/Jerusalem')::date;
  -- why (G2-בידוד): בידוד-כיווניות לכל רצף-ספרות בתוך משפט עברי — התאום של `isolateLtr`
  -- (`src/lib/reportsFormat.js`) ושל `v_lri`/`v_pdi` במיגרציות E2/F2. **נמדד 16/09/2026:**
  -- ‏"2,786,544 ₪" חזר מהשרת בתוך משפט עברי בלי בידוד, וזה בדיוק המקרה ש-F5 של E2 תיקן.
  v_lri        constant text := chr(8294);   -- U+2066 LRI
  v_pdi        constant text := chr(8297);   -- U+2069 PDI
  v_to         date;
  v_from       date;
  v_y_from     date;
  v_mult       numeric;
  v_min_n      numeric;
  v_missing    text[] := array[]::text[];
  v_notes      jsonb  := '[]'::jsonb;
  v_buckets    jsonb;
  v_below      integer;
  v_in_buckets integer;
  v_other      integer;
  v_neg_total  integer;
  v_other_year jsonb;
  -- סבב 3 · פילוח-השנים כמחרוזת מוכנה לחצי-ההשוואה.
  v_other_year_txt text;
  -- שמות-החודשים, אותה רשימה שבמיגרציית ההנהלה (`to_char` מחזיר אנגלית).
  v_months_he constant text[] := array['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני',
    'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
  v_conc       jsonb;
  v_pay        jsonb;
  v_pay_top    numeric;
  v_pay_n      integer;
  v_chart      jsonb;
  v_ref_avg    numeric;
  v_ref_n      integer;
  v_rows       jsonb;
  v_pop_n      integer;
  v_pop_sent   integer;
  v_pop_cust   integer;
  v_cust_all   integer;
  v_pop_no     integer;
  v_sat_med    numeric;
  v_mid_med    numeric;
  v_uns_med    numeric;
  v_sat_cnt    integer;
  v_uns_cnt    integer;
  -- 🔒 §7.100 — המיסוך עבר אל תוך המסד; `v_out` קיים כדי שהמטען יהיה ניתן-לעריכה
  --    אחרי בנייתו, במקום לפצל כל ביטוי-כסף לשני ענפים.
  v_can_money  boolean;
  v_out        jsonb;
begin
  -- השער, ראשון ולפני כל קריאה למסד (C5 · ת8 · הכרעה 2).
  perform public.assert_module_permission('לקוחות', array['edit', 'view']);

  -- 🔒 §7.100 — שער-הכסף, בצד-השרת (הכרעת ישי 17/09/2026 06:5X, *"בצע"* על אפשרות (ב)).
  -- **אינו מעלה שגיאה** — שער 'לקוחות' שלמעלה הוא זה שחוסם; זה כאן קובע רק אם המספרים
  -- יוצאים מהמסד. 🔑 **אותה תת-שאילתה בדיוק** של `report_m07_finance_overview`
  -- (`20260903182735_module7_dashboard_summary_rpc.sql:111-116`) — ולא עוזר חדש:
  -- ‏`assert_module_permission` היא העוזר היחיד בריפו והיא **מעלה** 42501, ולכן אינה
  -- משמשת כאן. טעות-הקלדה בת תו אחד ב-'כספים' הופכת את התת-שאילתה ל-NULL ⇒ הכסף נמסך
  -- לכולן; זהו כיוון-הכשל הבטוח.
  select exists (
    select 1 from public.permissions p
     where p.role_id = (select public.current_user_role_id())
       and p.module_id = (select m.module_id from public.modules m where m.module_name = 'כספים')
       and p.permission_level = any (array['edit', 'view'])
  ) into v_can_money;

  v_to   := coalesce(p_to, v_today);
  -- ברירת-המחדל היא **השנה הקלנדרית** — `processes-approved.md` §536 (סטייה מוצהרת
  -- מ-§7.98: דוח הוא השוואה תקופתית ולא רשימת-עבודה, §7.95).
  v_from := coalesce(p_from, date_trunc('year', v_to)::date);
  -- חלון 12 החודשים של הכסף מעוגן ל"היום" ולא למסנן — הוא מדד-מלאי, לא מדד-תקופה.
  v_y_from := (v_today - interval '12 months')::date;

  -- ── פרמטרים בזמן-ריצה; שורה חסרה נאמרת ואינה הופכת לברירת-מחדל ──────────────
  select case when pa.param_value ~ '^\s*-?\d+(\.\d+)?\s*$' then btrim(pa.param_value)::numeric end
    into v_mult from public.params pa where pa.param_name = 'מכפיל_מרווח_מתרחק';
  if v_mult is null then v_missing := v_missing || 'מכפיל_מרווח_מתרחק'; end if;

  select case when pa.param_value ~ '^\s*-?\d+(\.\d+)?\s*$' then btrim(pa.param_value)::numeric end
    into v_min_n from public.params pa where pa.param_name = 'מינימום_תשובות_להצגת_ציון';
  if v_min_n is null then v_missing := v_missing || 'מינימום_תשובות_להצגת_ציון'; end if;

  -- ── שורת-האוכלוסייה (📐2) — המספרים של התקופה הנבחרת ────────────────────────
  select count(*) filter (where p.feedback_status = 'completed'),
         count(*) filter (where p.feedback_status in ('completed', 'no_response')),
         count(*) filter (where p.feedback_status = 'no_response')
    into v_pop_n, v_pop_sent, v_pop_no
    from public.projects p
   where p.final_event_date between v_from and v_to
     and (p_customer_id is null or p.customer_id = p_customer_id);

  -- 🔴 **תיקון G2-5 — אוכלוסייה שנמדדה נכון על העולם הלא-נכון.** הספירה כאן הייתה
  -- ‏`count(*) from customers` = **כל** הלקוחות במערכת (61), בתוך משפט שכל שאר מספריו
  -- הם משובי-התקופה ⇒ *"n=163 משובים מתוך 217 שנשלחו, אצל 61 לקוחות"* נקרא כאילו 163
  -- המשובים באו מ-61 לקוחות. **נמדד 16/09/2026: 42 לקוחות עומדים מאחורי 163 המשובים**
  -- (‏47 קיבלו טופס). ⇒ המונה הוא לקוחות-האוכלוסייה, ומספר-המערכת נאמר בנפרד וכהקשר.
  select count(distinct p.customer_id)::integer into v_pop_cust
    from public.projects p
   where p.final_event_date between v_from and v_to
     and p.feedback_status = 'completed'
     and p.customer_id is not null
     and (p_customer_id is null or p.customer_id = p_customer_id);

  select count(*)::integer into v_cust_all from public.customers c
   where (p_customer_id is null or c.customer_id = p_customer_id);

  -- ── אריח ① · חתך-הלקוחות: 4.5+ · 3.5–4.4 · מתחת ל-3.5, על ≥ סף-המדגם (📐12) ──
  -- 🔴 **"לקוחות מרוצים" ואינו "שיעור המרוצים"** (הכרעת-ישי 10/09/2026): כאן המונה הוא
  -- **לקוחות** שממוצעם 4.5+, שם הוא **משובים** בציון 4–5. שני שמות, שתי הגדרות.
  -- החלון הוא **כל הזמנים** ואינו מגיב למסנן — משוב אחד לחודש הוא מדגם קטן מדי לכיוון.
  with fb as (
    select p.customer_id,
           avg(p.feedback_score)::numeric as avg_score,
           count(*)::integer              as n
      from public.projects p
     where p.feedback_status = 'completed'
       and p.feedback_score is not null
       and p.customer_id is not null
     group by p.customer_id
  ), last_held as (
    select p.customer_id, max(p.final_event_date) as last_event
      from public.projects p
     where p.project_status <> 'cancelled'
       and p.customer_id is not null
       and p.final_event_date < v_today
     group by p.customer_id
  ), bucketed as (
    select case when f.avg_score >= 4.5 then 'satisfied'
                when f.avg_score >= 3.5 then 'middle'
                else 'unsatisfied' end                as bucket,
           (v_today - lh.last_event)::numeric         as days_since
      from fb f
      left join last_held lh on lh.customer_id = f.customer_id
     where f.n >= v_min_n
  )
  select coalesce(jsonb_object_agg(b.bucket, jsonb_build_object(
           'customers', b.customers, 'median_days', b.median_days)), '{}'::jsonb),
         coalesce(sum(b.customers)::integer, 0)
    into v_buckets, v_in_buckets
    -- 🔴 **`::numeric` לפני `round`, וזו מלכודת שקטה שנמדדה 16/09/2026:**
    -- ‏`percentile_cont` מחזירה **`double precision`**, ו-`round(double precision)` היא
    -- עיגול-בנקאים (חצי-לזוגי) ⇒ `round(14.5)` = **14**. חציון-המרוצים הוא בדיוק 14.5,
    -- והמסך המאושר אומר **15**. בלי ההמרה הדוח היה מציג 14 בלי שום שגיאה.
    from (select bucket,
                 count(*)::integer as customers,
                 round((percentile_cont(0.5) within group (order by days_since))::numeric)::integer as median_days
            from bucketed group by bucket) b;

  -- מונה-החוץ הגלוי (📐12): מי שיש לו משוב אך פחות מהסף — **לא** נעלם בשקט.
  select count(*)::integer into v_below
    from (select p.customer_id, count(*) n
            from public.projects p
           where p.feedback_status = 'completed' and p.feedback_score is not null
             and p.customer_id is not null
           group by p.customer_id) t
   where t.n < v_min_n;

  v_sat_med := (v_buckets #>> '{satisfied,median_days}')::numeric;
  v_mid_med := (v_buckets #>> '{middle,median_days}')::numeric;
  v_uns_med := (v_buckets #>> '{unsatisfied,median_days}')::numeric;
  v_sat_cnt := (v_buckets #>> '{satisfied,customers}')::integer;
  v_uns_cnt := (v_buckets #>> '{unsatisfied,customers}')::integer;

  -- ── אריח ② · "אחר" מול ארבע הקטגוריות, כל הזמנים (📐11 — מערך, לא ערך יחיד) ──
  select count(*) filter (where r.reason = 'אחר'), count(*)
    into v_other, v_neg_total
    from public.projects p
    cross join lateral unnest(p.negative_feedback_reasons) as r(reason)
   where p.feedback_status = 'completed';

  select coalesce(jsonb_object_agg(t.y::text, t.c), '{}'::jsonb) into v_other_year
    from (select extract(year from p.final_event_date)::integer as y, count(*)::integer as c
            from public.projects p
           where p.feedback_status = 'completed'
             and 'אחר' = any (p.negative_feedback_reasons)
             and p.final_event_date <= v_today
           group by 1) t;

  -- 🪤 I1 · **חצי-ההשוואה חזר על ערך-האריח עצמו** (`▲פילוח לפי שנה: 33`),
  --    בעוד המוקאפ המאושר מצייר באותו מקום את הפילוח לפי שנה.
  --    המספרים ישבו כבר ב-`detail.by_year` ולא הגיעו למסך.
  -- 🔑 **המחרוזת נקייה מעברית במכוון:** ‏`KpiTile` עוטף את `compare.value`
  --    ב-`<Ltr dir="ltr">`, ומילה עברית בתוכו היתה מתהפכת. הסייג יושב בתווית.
  select string_agg(v_lri || e.key || v_pdi || ': ' || v_lri || e.value || v_pdi, ' · ' order by e.key)
    into v_other_year_txt
    from jsonb_each_text(coalesce(v_other_year, '{}'::jsonb)) as e(key, value);

  -- ── אריח ③ · ריכוזיות מול נטישה (הכרעה 24·ח7 · 🔒) ──────────────────────────
  -- 🔴 **ההגדרה שמופיעה כאן פעם שנייה — §🧾ח7, ומקורה שם ולא כאן.** שינוי בה חייב
  -- לגעת גם ב-`report_m21_drifting` למטה. **אין אירוע עתידי · וגם ימים-מאז > מכפיל ×
  -- חציון-המרווח האישי · ≥ 3 אירועים שהתקיימו.** אירועים מבוטלים אינם נספרים.
  -- ⚠️ `nullif(median_gap, 0)` — חציון 0 (שני אירועים באותו יום) היה הופך את התנאי
  -- ל-`days > 0` ומסמן כמעט כל לקוח; הכרטיס ⑦ קובע "היחס '—', והלקוח נשפט ברדום בלבד".
  with held as (
    select p.customer_id, p.final_event_date
      from public.projects p
     where p.project_status <> 'cancelled'
       and p.customer_id is not null
       and p.final_event_date < v_today
  ), gaps as (
    select h.customer_id,
           h.final_event_date - lag(h.final_event_date) over (
             partition by h.customer_id order by h.final_event_date) as gap_days
      from held h
  ), per_cust as (
    select h.customer_id, count(*)::integer as held_count, max(h.final_event_date) as last_event
      from held h group by h.customer_id
  ), med as (
    select g.customer_id,
           (percentile_cont(0.5) within group (order by g.gap_days))::numeric as median_gap
      from gaps g where g.gap_days is not null group by g.customer_id
  ), fut as (
    select distinct p.customer_id
      from public.projects p
     where p.project_status <> 'cancelled'
       and p.customer_id is not null
       and p.final_event_date >= v_today
  ), drift as (
    select pc.customer_id,
           (v_today - pc.last_event)::numeric as days_since,
           m.median_gap
      from per_cust pc
      join med m on m.customer_id = pc.customer_id
      left join fut f on f.customer_id = pc.customer_id
     where pc.held_count >= 3
       and f.customer_id is null
       and v_mult is not null
       and (v_today - pc.last_event)::numeric > v_mult * nullif(m.median_gap, 0)
  ), rev as (
    -- אוכלוסיית-הכסף של הכרעה 36 — ארבעת הסטטוסים, לא `finished` לבדו.
    select p.customer_id, sum(fm.revenue) as revenue
      from public.projects p
      cross join lateral public.finance_project_money(p.project_id) fm
     where p.project_status in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')
       and p.customer_id is not null
       and p.final_event_date >= v_y_from
       and p.final_event_date <= v_today
     group by p.customer_id
  ), ranked as (
    select r.customer_id, r.revenue,
           row_number() over (order by r.revenue desc, r.customer_id) as rnk
      from rev r
  )
  select jsonb_build_object(
           'top5_drifting',   (select count(*)::integer from ranked k join drift d on d.customer_id = k.customer_id where k.rnk <= 5),
           'top5_revenue',    (select sum(k.revenue) from ranked k where k.rnk <= 5),
           'total_revenue',   (select sum(r.revenue) from rev r),
           'producing_count', (select count(*)::integer from rev r where r.revenue > 0),
           'drifting_count',  (select count(*)::integer from drift),
           'first_drifting',  (select jsonb_build_object(
                                 'customer_id', k.customer_id,
                                 'company_name', c.company_name,
                                 'rank', k.rnk,
                                 'revenue', k.revenue,
                                 'days_since', d.days_since,
                                 'cadence', d.median_gap)
                                 from ranked k
                                 join drift d on d.customer_id = k.customer_id
                                 join public.customers c on c.customer_id = k.customer_id
                                order by k.rnk limit 1)
         )
    into v_conc;

  -- ── אריח ④ · חציון ימים מחשבונית לתשלום, לפי סוג-לקוח (כל הזמנים) ───────────
  -- 🔑 **המפתח חוזר, לא התווית** — `CUSTOMER_TYPE_LABELS` הוא SSOT של `src/lib/customers.js`,
  -- ומחרוזת-עברית שנכתבת גם כאן הייתה נפרדת ממנו ביום שהמילון ישתנה (כלל 14).
  -- `invoice_sent_at` הוא `timestamptz` ⇒ מומר לשעון-ישראל לפני שנגזר ממנו יום.
  select coalesce(jsonb_agg(t.row order by t.median_days desc, t.customer_type), '[]'::jsonb),
         max(t.median_days), sum(t.invoice_count)::integer
    into v_pay, v_pay_top, v_pay_n
    from (select g.customer_type, g.invoice_count, g.median_days,
                 jsonb_build_object(
                   'customer_type',  g.customer_type,
                   'median_days',    g.median_days,
                   'invoice_count',  g.invoice_count,
                   'customer_count', g.customer_count) as row
            from (select c.customer_type,
                         count(*)::integer                      as invoice_count,
                         count(distinct c.customer_id)::integer as customer_count,
                         -- אותו `::numeric` לפני `round` — ר' ההערה באריח ①.
                         round((percentile_cont(0.5) within group (
                           order by (p.payment_date - (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date)::numeric
                         ))::numeric) as median_days
                    from public.projects p
                    join public.customers c on c.customer_id = p.customer_id
                   where p.payment_date is not null and p.invoice_sent_at is not null
                   group by c.customer_type) g) t;

  -- ── הגרף · ממוצע לפי חודש בתקופה, `domain` נעול 1–5 (📐6) ────────────────────
  -- ⚠️ **חודש בלי משובים אינו נקודה בגובה אפס** — הוא נעדר, וההיעדר כתוב בכיתוב-הגרף.
  select coalesce(jsonb_agg(jsonb_build_object(
           -- 🪤 I1 · ציר-הקטגוריה חסר-פורמטר **במכוון** (`ChartCard.categoryAxis`),
           --    ולכן `xKey` הצביע על `2026-01` והודפס כמות-שהוא — גם בציר וגם
           --    בטבלת קורא-המסך. אותו פתרון של מ3: מפתח `label` עברי, ו-`xKey` עליו.
           --    `month` נשמר — שום מפתח לא נמחק.
           'month', t.ym, 'label', t.he_label,
           'avg_score', t.avg_score, 'n', t.n) order by t.ym), '[]'::jsonb)
    into v_chart
    from (select to_char(date_trunc('month', p.final_event_date), 'YYYY-MM') as ym,
                 -- 🪤 J2 · **השנה נאמרת רק כשהיא מבדילה.** הציר הזה הדפיס
                 --    'ינואר ⁦2026⁩' גם על טווח שכולו בתוך 2026, בעוד מ2/מ3 מדפיסים
                 --    'ינואר' לבדו על ציר חד-שנתי. הכלל האחד: שם-חודש עברי,
                 --    ‏+ שנה רק כשהחלון חוצה יותר משנה קלנדרית אחת — ואז גם
                 --    אין שתי שורות שנושאות אותה תווית.
                 v_months_he[extract(month from p.final_event_date)::integer]
                   || case when to_char(v_from, 'YYYY') = to_char(v_to, 'YYYY') then ''
                           else ' ' || v_lri || to_char(p.final_event_date, 'YYYY') || v_pdi
                      end as he_label,
                 round(avg(p.feedback_score)::numeric, 2)                    as avg_score,
                 count(*)::integer                                           as n
            from public.projects p
           where p.feedback_status = 'completed' and p.feedback_score is not null
             and p.final_event_date between v_from and v_to
             and (p_customer_id is null or p.customer_id = p_customer_id)
           group by 1, 2) t;

  -- קו-הייחוס (📐15) — הערך **המדוד** של השנה הקודמת המלאה, לא סף מומצא.
  select round(avg(p.feedback_score)::numeric, 2), count(*)::integer
    into v_ref_avg, v_ref_n
    from public.projects p
   where p.feedback_status = 'completed' and p.feedback_score is not null
     and p.final_event_date >= (date_trunc('year', v_to) - interval '1 year')::date
     and p.final_event_date <  date_trunc('year', v_to)::date
     and (p_customer_id is null or p.customer_id = p_customer_id);

  -- ── הטבלה · 8 הלקוחות הגדולים ב-12 החודשים (📐7 — מיון לפי המדד המוצג) ───────
  with rev as (
    select p.customer_id, sum(fm.revenue) as revenue
      from public.projects p
      cross join lateral public.finance_project_money(p.project_id) fm
     where p.project_status in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')
       and p.customer_id is not null
       and p.final_event_date >= v_y_from
       and p.final_event_date <= v_today
     group by p.customer_id
  ), fb as (
    select p.customer_id, round(avg(p.feedback_score)::numeric, 2) as avg_score, count(*)::integer as n
      from public.projects p
     where p.feedback_status = 'completed' and p.feedback_score is not null and p.customer_id is not null
     group by p.customer_id
  ), last_held as (
    select p.customer_id, max(p.final_event_date) as last_event
      from public.projects p
     where p.project_status <> 'cancelled' and p.customer_id is not null and p.final_event_date < v_today
     group by p.customer_id
  ), next_event as (
    select p.customer_id, min(p.final_event_date) as next_event
      from public.projects p
     where p.project_status <> 'cancelled' and p.customer_id is not null and p.final_event_date >= v_today
     group by p.customer_id
  )
  select coalesce(jsonb_agg(t.row order by t.revenue desc, t.customer_id), '[]'::jsonb) into v_rows
    from (select r.customer_id, r.revenue,
                 jsonb_build_object(
                   -- C8: `drill_key` אחיד `{kind, …}` בכל הלשוניות; שתים-עשרה הפונקציות
                   -- האחרות כבר מחזירות אובייקט, וזו הייתה היחידה שהחזירה סקלר.
                   'drill_key',     jsonb_build_object('kind', 'customer', 'id', r.customer_id),
                   'customer_id',   r.customer_id,
                   'company_name',  c.company_name,
                   'customer_type', c.customer_type,
                   'revenue_12m',   r.revenue,
                   'avg_feedback',  f.avg_score,
                   'feedback_n',    coalesce(f.n, 0),
                   -- 🪤 I1 · המוקאפ מצייר `4.63 · n=129`; העמודה הוצהרה `ratio`
                   --    (ספרה אחת) ובלי גודל-מדגם. **אותו דפוס של `score_pair` במ21**:
                   --    תא אחד מורכב, ושני המספרים הגולמיים נשארים במטען ללא שינוי.
                   'avg_feedback_pair', case when f.avg_score is null then null
                     else v_lri || to_char(f.avg_score, 'FM990.00') || v_pdi
                          || ' · ' || v_lri || 'n=' || coalesce(f.n, 0) || v_pdi end,
                   'last_event',    lh.last_event,
                   'next_event',    ne.next_event) as row
            from rev r
            join public.customers c on c.customer_id = r.customer_id
            left join fb f on f.customer_id = r.customer_id
            left join last_held lh on lh.customer_id = r.customer_id
            left join next_event ne on ne.customer_id = r.customer_id
           where (p_customer_id is null or r.customer_id = p_customer_id)
           order by r.revenue desc, r.customer_id
           limit 8) t;

  -- ── מה שהמסך חייב לומר על עצמו (📐3 · 📐11 · 22.5) ──────────────────────────
  v_notes := v_notes
    || to_jsonb('ארבעת האריחים נמדדים על כל הזמנים ואינם מושפעים ממסנן התקופה; הגרף והטבלה כן.'::text)
    || to_jsonb('ארבעת האריחים הם חתכים בין-לקוחיים ואינם מושפעים ממסנן הלקוח.'::text);
  if p_drill is not null then
    v_notes := v_notes || to_jsonb('הדף אינו דוח-קידוח (📐13) — פרמטר הקידוח לא הופעל.'::text);
  end if;

  v_out := jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_pop_n,
      'label', 'אוכלוסייה: משובים שהלקוח מילא · הוצאו: משובים שנשלחו ולא נענו ('
               || v_lri || to_char(v_pop_no, 'FM999,999,999') || v_pdi || ') ומשובים שלא נשלחו · '
               || v_lri || 'n=' || to_char(v_pop_n, 'FM999,999,999') || v_pdi || ' משובים מתוך '
               || v_lri || to_char(v_pop_sent, 'FM999,999,999') || v_pdi || ' שנשלחו, אצל '
               || case when v_pop_cust = 1 then 'לקוח אחד'
                       else v_lri || to_char(v_pop_cust, 'FM999,999,999') || v_pdi || ' לקוחות' end
               || ' (מתוך ' || v_lri || to_char(v_cust_all, 'FM999,999,999') || v_pdi || ' במערכת).',
      'excluded', jsonb_build_object(
        'נשלח ולא נענה', v_pop_no,
        'מתחת לסף המדגם (לקוחות)', v_below)),
    'window', jsonb_build_object(
      'from', v_from, 'to', v_to,
      'label', v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi
               || ' · ' || case when p_customer_id is null then 'כל הלקוחות' else 'לקוח נבחר' end),
    'tiles', jsonb_build_array(
      jsonb_build_object(
        'key', 'satisfaction_vs_return',
        'label', 'שביעות-רצון מנבאת חזרה',
        'value', v_sat_med,
        'format', 'days',
        'sub', 'חציון ימים מאז האירוע האחרון: לקוחות מרוצים (ממוצע 4.5+) מול לקוחות לא-מרוצים (ממוצע מתחת ל-3.5) · הבינוניים באמצע: '
               || v_lri || coalesce(v_mid_med::text, '—') || v_pdi || ' ימים',
        'detail', jsonb_build_object('buckets', v_buckets, 'in_buckets', v_in_buckets, 'below_min_sample', v_below),
        'window', 'כל הזמנים · ' || v_lri || to_char(v_in_buckets, 'FM999,999,999') || v_pdi || ' לקוחות עם '
                  || v_lri || coalesce(v_min_n::text, '—') || '+' || v_pdi
                  || ' משובים · אינו מושפע ממסנן התקופה',
        'compare', case when v_uns_med is null then null else jsonb_build_object(
          'value', v_uns_med,
          -- 🪤 I2 · התווית הייתה משפט שלם שנושא מספר משלו, והערך נדבק אחריה
          --    עם נקודתיים שניות. התווית מתקצרת לבסיס-ההשוואה בלבד,
          --    וחציון-הבינוניים עובר ל-`sub` (וכבר יושב ב-`detail.buckets`).
          'label', 'לקוחות לא-מרוצים',
          'direction', 'flat') end,
        'target', jsonb_build_object('tab', 'לקוחות', 'report', 'report_m20_satisfaction', 'drill', null)),
      jsonb_build_object(
        'key', 'biggest_negative_is_other',
        'label', 'הסיבה השלילית הגדולה אינה קטגוריה',
        'value', v_other,
        'format', 'int',
        'sub', 'משובים שליליים שתויגו "אחר" מתוך ' || v_lri || to_char(v_neg_total, 'FM999,999,999') || v_pdi
               || ' — הדלי הגדול מכל ארבע הקטגוריות',
        'detail', jsonb_build_object('other', v_other, 'negative_total', v_neg_total, 'by_year', v_other_year),
        'window', 'כל הזמנים · לכל ' || v_lri || to_char(v_other, 'FM999,999,999') || v_pdi
                  || ' יש הערה חופשית · אינו מושפע ממסנן התקופה',
        'compare', jsonb_build_object(
          'value', coalesce(v_other_year_txt, '—'),
          'label', 'פילוח לפי שנה (השנה הנוכחית חלקית)', 'direction', 'flat'),
        'target', jsonb_build_object('tab', 'לקוחות', 'report', 'report_m22_notes', 'drill', null)),
      jsonb_build_object(
        'key', 'concentration_vs_drifting',
        'label', 'הריכוזיות והנטישה עוד לא נפגשות',
        'value', (v_conc ->> 'top5_drifting')::integer,
        'format', 'int',
        'sub', v_lri || to_char((v_conc ->> 'top5_drifting')::integer, 'FM999,999,999') || v_pdi
               || ' מחמשת הלקוחות הגדולים — יחד '
               || v_lri || coalesce(to_char(round(100 * (v_conc ->> 'top5_revenue')::numeric
                          / nullif((v_conc ->> 'total_revenue')::numeric, 0), 1), 'FM999990.0'), '—')
               || '%' || v_pdi || ' מהכנסת ' || v_lri || '12' || v_pdi
               || ' החודשים — מסומנים "מתרחק"',
        'detail', v_conc,
        'window', v_lri || '12' || v_pdi || ' החודשים האחרונים ('
                  || v_lri || to_char(v_y_from, 'DD/MM/YYYY') || '–' || to_char(v_today, 'DD/MM/YYYY') || v_pdi
                  || ') · הדגל נכון ל-' || v_lri || to_char(v_today, 'DD/MM') || v_pdi
                  || ' · אינו מושפע ממסנן התקופה',
        'compare', case when v_conc -> 'first_drifting' is null then null else jsonb_build_object(
          'value', (v_conc #>> '{first_drifting,rank}')::integer,
          -- 🪤 I2 · התווית הדפיסה 'מקום N' והערך הוא אותו N. המספר
          --    נשאר פעם אחת בלבד, בערך, והתווית מסתיימת בשם-המדד.
          'label', 'הגדול הראשון שכן: ' || (v_conc #>> '{first_drifting,company_name}')
                   || ' — שקטה ' || v_lri || (v_conc #>> '{first_drifting,days_since}') || v_pdi
                   || ' ימים מול קצב של ' || v_lri || (v_conc #>> '{first_drifting,cadence}') || v_pdi
                   || ' · מקומו ברשימת המניבים',
          'direction', 'flat') end,
        'target', jsonb_build_object('tab', 'לקוחות', 'report', 'report_m21_drifting', 'drill', null)),
      jsonb_build_object(
        'key', 'payment_cadence_by_type',
        'label', 'קצב-התשלום תלוי בסוג הלקוח',
        'value', v_pay_top,
        'format', 'days',
        'sub', 'חציון ימים מחשבונית לתשלום, לפי סוג הלקוח',
        -- C8: *"A legend showing `private_company` is the failure this line prevents"* —
        -- המפתח חוזר גולמי, ושם-הקבוע העברי נאמר כאן כדי שהלשונית תמפה דרכו.
        'detail', jsonb_build_object('rows', v_pay, 'label_source', 'CUSTOMER_TYPE_LABELS'),
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה',
        -- 🪤 I1 · **חצי-ההשוואה נושא ספירת-חשבוניות, והאריח הוא `days`** ⇒
        --    ‏`CompareLine` נפל ל-`tile.format` והמסך הדפיס *"על 675 חשבוניות ששולמו: 675 ימים"*.
        --    ‏`format: 'int'` — הערך הוא מניין, לא יחידת-זמן.
        'compare', jsonb_build_object(
          'value', v_pay_n, 'format', 'int',
          'label', 'על ' || v_lri || to_char(v_pay_n, 'FM999,999') || v_pdi || ' חשבוניות ששולמו',
          'direction', 'flat'),
        -- הכרעה 33 — דלת חוצת-לשונית. ⚠️ ⑧19.2 עדיין 🔵 פתוח: למי שממוסכת על 'כספים'
        -- ההמלצה בכרטיס היא להסתיר את שורת-היעד ולהשאיר את הנתון. **ההכרעה של ישי**,
        -- והמיסוך הוא של הלשונית — ה-RPC מחזיר את היעד ואינו מחליט עליו.
        'target', jsonb_build_object('tab', 'כספים', 'report', 'report_m09_aging', 'drill', null))),
    'chart', jsonb_build_object(
      'type', 'line',
      'title', 'ממוצע שביעות-הרצון לפי חודש · '
               || v_lri || to_char(v_from, 'MM/YYYY') || '–' || to_char(v_to, 'MM/YYYY') || v_pdi,
        -- 🪤 I1 · `series[].format` הוא הקודם ל-`unit` בגזירת תו-הסימון
        --    ובטולטיפ, והוא היה `null`. הערכים עצמם אינם זזים.
      'series', jsonb_build_array(jsonb_build_object('key', 'avg_score', 'label', 'ממוצע שביעות-רצון',
                                                    'format', 'ratio')),
      'data', v_chart,
      'xKey', 'label',
      'domain', jsonb_build_array(1, 5),
      'refLines', case when v_ref_avg is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object(
        'axis', 'y', 'value', v_ref_avg,
        'label', 'ממוצע ' || v_lri || to_char(date_trunc('year', v_to) - interval '1 year', 'YYYY') || v_pdi
                 || ' המלאה: ' || v_lri || v_ref_avg || v_pdi
                 || ' על ' || v_lri || to_char(v_ref_n, 'FM999,999,999') || v_pdi || ' משובים')) end,
      -- 🪤 I1 · **`chart.unit` הוא שם-פורמט של C8, לא מחרוזת-תצוגה.**
      --    ‏`ChartCard.valueFormat` מחזיר `series[0].format ?? unit` ומזין את
      --    ‏`formatAxisTick`, ו-`HebrewTooltip` מזין את `formatByType` — שניהם מצפים
      --    ל-`money|percent|int|ratio|score|days|text|date`. מחרוזת-תצוגה היא **פורמט
      --    לא-מוכר** ⇒ הציר נופל לקיבוץ-אלפים חשוף והטולטיפ ל-`text`.
      --    הכיתוב העברי נשמר ב-`unit_label` (תוספתי; **אין לו קורא היום** — מדווח).
      'unit', 'ratio', 'unit_label', 'ציון'),
    -- I1 · §9 D-30 ③ — ערך-החוזה של `target.report` הוא **שם ה-RPC**; ארבעת היעדים למעלה
    -- נשאו את השם העברי. הנתב מקבל את שניהם, ולכן זו יישור-חוזה ולא תיקון-שבר.
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'company_name',  'label', 'לקוח',                'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'customer_type', 'label', 'סוג הלקוח',           'format', 'text',  'align', 'start',
                         'label_source', 'CUSTOMER_TYPE_LABELS'),
      -- 📐9 · `aria-sort` על העמודה הממוינת. `ReportSurface` גוזר אותו **אך ורק** מ-
      -- ‏`columns[].sorted` (C8, תוספת 16/09) — בלי המפתח אין `aria-sort` על המסך כלל.
      jsonb_build_object('key', 'revenue_12m',   'label', 'הכנסת 12 החודשים',    'format', 'money', 'align', 'end',
                         'sorted', 'descending'),
      -- 🪤 I1 · העמודה מצביעה על התא המורכב; `avg_feedback` ו-`feedback_n` נשארים במטען.
      jsonb_build_object('key', 'avg_feedback_pair', 'label', 'ממוצע המשוב שלו', 'format', 'text', 'align', 'end'),
      -- 🪤 I1 · שתי העמודות נושאות `date` של Postgres ⇒ במטען הן `"2026-09-15"`, ו-`text`
      --    הדפיס את ה-ISO כמות-שהוא. ‏`date` מנתב ל-`formatIsraelDate` ⇒ `15/09/2026`.
      jsonb_build_object('key', 'last_event',    'label', 'אירוע אחרון',         'format', 'date',  'align', 'start'),
      jsonb_build_object('key', 'next_event',    'label', 'האירוע הבא',          'format', 'date',  'align', 'start')),
    'rows', v_rows,
    -- 📐23 · מבט-על הוא שער ⇒ הפועל נגזר מהדף שהאריח הראשון פותח (מ20, דוח בקרה).
    'so_what', case when v_uns_cnt is null or v_uns_cnt = 0
      then 'לפתוח את "שביעות רצון" ולראות מה מכעיס — אין כרגע לקוח שממוצעו מתחת ל-3.5.'
      else 'לפתוח את "שביעות רצון" ולראות מה מכעיס את ' || v_lri || to_char(v_uns_cnt, 'FM999,999,999') || v_pdi
           || ' הלקוחות הלא-מרוצים (ממוצע מתחת ל-' || v_lri || '3.5' || v_pdi || ') — הם לא הזמינו כבר '
           || v_lri || v_uns_med || v_pdi || ' ימים (חציון), מול ' || v_lri || v_sat_med || v_pdi
           || ' ימים אצל ' || v_lri || to_char(v_sat_cnt, 'FM999,999,999') || v_pdi || ' הלקוחות המרוצים (ממוצע '
           || v_lri || '4.5+' || v_pdi || ').' end,
    'definitions', 'הגדרות: ממוצע שביעות-רצון = ממוצע ציון 1–5 על משובים שהלקוח מילא בלבד; משוב שנשלח ולא נענה אינו נספר · לקוח מרוצה / בינוני / לא-מרוצה = ממוצע הציונים של אותו לקוח, על 3 משובים לפחות: 4.5+ · 3.5–4.4 · מתחת ל-3.5. זהו חתך של לקוחות ואינו "שיעור המרוצים", שנמדד על משובים בציון 4–5 — שני מונים שונים, ולכן שני שמות · ימים מאז האירוע האחרון = היום פחות תאריך האירוע האחרון שהתקיים ולא בוטל · הכנסת 12 החודשים = סך ההכנסה מאירועים שהתקיימו ויצאה להם חשבונית, שתאריך האירוע שלהם ב-12 החודשים האחרונים · ימים לתשלום (חציון) = חציון (תאריך-תשלום פחות תאריך-חשבונית) על חשבוניות ששולמו, כל הזמנים · סכומים ב-₪ שלמים.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      -- §7.100 · דגל-החוזה: הלשונית ממסכת לפי `format` ממילא, וזה כאן אומר לה **למה**
      --    הערך חסר — כדי ש-`—` ("אין נתון") ו"לא זמין בתפקידך" לא יתחלפו.
      'money_masked', not v_can_money,
      'missing_params', to_jsonb(v_missing),
      'frozen_count', null,
      'notes', v_notes,
      -- C8 · תוספות-מטא שהחוזה מכיר ושהמשטח הזה לא החזיר: הן `null`/רשימה ולעולם לא חסרות.
      'export_blocked_reason', null,
      'customer_filter_ignored', jsonb_build_array(
        'satisfaction_vs_return', 'biggest_negative_is_other',
        'concentration_vs_drifting', 'payment_cadence_by_type'),
      'drill_echo', p_drill,
      'run', null));

  -- 🔒 §7.100 — שני מקומות-כסף במ19, ולא אחד (נמדד 17/09/2026 על גוף-J2 החי):
  --    ① `rows[].revenue_12m` — עמודת-הכסף היחידה · ② `tiles[concentration_vs_drifting].detail`
  --      — ‏`top5_revenue` · `total_revenue` · `first_drifting.revenue` הם **סכומים גולמיים**.
  --    🔴 **② נתפס בבדיקה החתומה ולא בקריאת-הקוד:** ההרצה כ-E2E_PROJECTS החזירה
  --      ‏`top5_revenue: 1224613.9` אחרי ש-① כבר מוסך, **והלשונית אינה ממסכת `detail` כלל**.
  --    🚫 **מה שאינו נמסך, ובכוונה:** שורת-המשנה של אותו אריח היא **אחוז** ולא סכום ·
  --      ‏`so_what` של מ19 אינו נושא ₪ · ב-`definitions` יושב *"סכומים ב-₪ שלמים"*, שהוא
  --      **משפט-מדיניות** בלי נתון. `null` ולא 0 ולא מחרוזת — הלשונית מחליטה מה נראה.
  if not v_can_money then
    v_out := jsonb_set(v_out, '{rows}', coalesce((
      select jsonb_agg(jsonb_set(r, '{revenue_12m}', 'null'::jsonb) order by o)
        from jsonb_array_elements(v_out -> 'rows') with ordinality x(r, o)), '[]'::jsonb));
    v_out := jsonb_set(v_out, '{tiles}', coalesce((
      select jsonb_agg(
               case when t ->> 'key' = 'concentration_vs_drifting'
                 -- ‏`create_missing = false` בפרמטר האחרון: כשאין לקוח-מתרחק ברשימת
                 -- המניבים `first_drifting` הוא `null`, והנתיב פשוט אינו קיים.
                 then jsonb_set(
                        t || jsonb_build_object('detail',
                               (t -> 'detail')
                               || jsonb_build_object('top5_revenue', null, 'total_revenue', null)),
                        '{detail,first_drifting,revenue}', 'null'::jsonb, false)
                 else t
               end order by o)
        from jsonb_array_elements(v_out -> 'tiles') with ordinality x(t, o)), '[]'::jsonb));
  end if;

  return v_out;
end;
$function$;

comment on function public.report_m19_customers_overview(date, date, integer, jsonb) is
  'מבט-על לקוחות (מ19) — קריאה בלבד, מגודר על מודול לקוחות. אוכלוסייה: משובים שהלקוח מילא בתקופה שנבחרה; הוצאו משובים שנשלחו ולא נענו ומשובים שלא נשלחו. מונה-הלקוחות בשורת-האוכלוסייה הוא הלקוחות שמאחורי אותם משובים (distinct), ומספר לקוחות-המערכת נאמר בסוגריים כהקשר. ארבעת האריחים הם חתכים כלל-לקוחיים על כל הזמנים ואינם מגיבים למסנני התקופה והלקוח; הגרף והטבלה כן. חלון התקופה סגור משני קצותיו.';

revoke execute on function public.report_m19_customers_overview(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m19_customers_overview(date, date, integer, jsonb) to authenticated;

create or replace function public.report_m21_drifting(
  p_from        date    default null,
  p_to          date    default null,
  p_customer_id integer default null,
  p_drill       jsonb   default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_today    date := (now() at time zone 'Asia/Jerusalem')::date;
  -- why (G2-בידוד): בידוד-כיווניות לכל רצף-ספרות בתוך משפט עברי — התאום של `isolateLtr`
  -- (`src/lib/reportsFormat.js`) ושל `v_lri`/`v_pdi` במיגרציות E2/F2. **נמדד 16/09/2026:**
  -- ‏"2,786,544 ₪" חזר מהשרת בתוך משפט עברי בלי בידוד, וזה בדיוק המקרה ש-F5 של E2 תיקן.
  v_lri        constant text := chr(8294);   -- U+2066 LRI
  v_pdi        constant text := chr(8297);   -- U+2069 PDI
  v_to       date;
  v_from     date;
  v_y_from   date;
  v_prev     date;
  v_mult     numeric;
  v_dormant  numeric;
  v_missing  text[] := array[]::text[];
  v_notes    jsonb  := '[]'::jsonb;
  v_pop      jsonb;
  v_counts   jsonb;
  v_hist     jsonb;
  v_rows     jsonb;
  v_all_rows jsonb;
  v_oldest   jsonb;
  v_call     jsonb;
  v_drift_n  integer;
  v_prev_n   integer;
  v_elig     integer;
  v_rev      numeric;
  v_rev_all  numeric;
  v_only_n   integer;
  v_only_rev numeric;
  v_dorm_n   integer;
  v_dorm_lt3 integer;
  -- 🔒 §7.100 — ר' ההערה הזהה במ19.
  v_can_money boolean;
  v_out       jsonb;
  -- 🔑 **אותה תבנית בדיוק של `MONEY_RUN`** ב-`src/modules/11_reports/tabs/customers/payload.jsx:59`,
  --    כתובה כאן דרך `v_lri`/`v_pdi` כדי ש**לא** יישבו בקובץ תווים בלתי-נראים
  --    (`src/CLAUDE.md`, מוקש U+200F). היא תופסת **סכום** ולא את הסימן: `₪` לבדו הוא
  --    משפט-מדיניות (*"עמודות ואריחי ה-₪ בדף זה…"*) ונשאר על המסך.
  v_money_pat text;
  v_mask_amt  constant text := '(לא זמין בתפקידך)';
begin
  perform public.assert_module_permission('לקוחות', array['edit', 'view']);

  -- 🔒 §7.100 — שער-הכסף, בצד-השרת (הכרעת ישי 17/09/2026 06:5X, *"בצע"* על אפשרות (ב)).
  -- **אינו מעלה שגיאה** — שער 'לקוחות' שלמעלה הוא זה שחוסם; זה כאן קובע רק אם המספרים
  -- יוצאים מהמסד. 🔑 **אותה תת-שאילתה בדיוק** של `report_m07_finance_overview`
  -- (`20260903182735_module7_dashboard_summary_rpc.sql:111-116`) — ולא עוזר חדש:
  -- ‏`assert_module_permission` היא העוזר היחיד בריפו והיא **מעלה** 42501, ולכן אינה
  -- משמשת כאן. טעות-הקלדה בת תו אחד ב-'כספים' הופכת את התת-שאילתה ל-NULL ⇒ הכסף נמסך
  -- לכולן; זהו כיוון-הכשל הבטוח.
  select exists (
    select 1 from public.permissions p
     where p.role_id = (select public.current_user_role_id())
       and p.module_id = (select m.module_id from public.modules m where m.module_name = 'כספים')
       and p.permission_level = any (array['edit', 'view'])
  ) into v_can_money;

  v_to     := coalesce(p_to, v_today);
  v_from   := coalesce(p_from, date_trunc('year', v_to)::date);
  v_y_from := (v_today - interval '12 months')::date;
  -- "לפני חודש" — ההשוואה של 📐1 על אריח שאין לו תקופה-קודמת טבעית: אותה נוסחה בדיוק,
  -- מורצת מול עוגן אחר. **לא** מדד אחר.
  v_prev   := (v_today - interval '1 month')::date;

  select case when pa.param_value ~ '^\s*-?\d+(\.\d+)?\s*$' then btrim(pa.param_value)::numeric end
    into v_mult from public.params pa where pa.param_name = 'מכפיל_מרווח_מתרחק';
  if v_mult is null then v_missing := v_missing || 'מכפיל_מרווח_מתרחק'; end if;

  select case when pa.param_value ~ '^\s*-?\d+(\.\d+)?\s*$' then btrim(pa.param_value)::numeric end
    into v_dormant from public.params pa where pa.param_name = 'סף_לקוח_רדום_ימים';
  if v_dormant is null then v_missing := v_missing || 'סף_לקוח_רדום_ימים'; end if;

  -- ═══ ההגדרה של §🧾ח7, **ועותק שני שלה** — הראשון ב-`report_m19_customers_overview` ═══
  -- **אין אירוע עתידי · וגם ימים-מאז > מכפיל × חציון-המרווח האישי · ≥ 3 אירועים שהתקיימו.**
  -- אירועים מבוטלים אינם נספרים, ואירועים עתידיים אינם נספרים בקצב.
  -- ⚠️ `nullif(median_gap, 0)` — ר' ההערה בעותק הראשון.
  -- 🔑 **שני עוגנים בשאילתה אחת** (היום · לפני חודש), כדי שההשוואה תהיה אותה נוסחה.
  with anchors as (
    select v_today as anchor, true as is_now
    union all
    select v_prev, false
  ), held as (
    select p.customer_id, p.final_event_date, a.anchor
      from public.projects p
      cross join anchors a
     where p.project_status <> 'cancelled'
       and p.customer_id is not null
       and p.final_event_date < a.anchor
  ), gaps as (
    select h.customer_id, h.anchor,
           h.final_event_date - lag(h.final_event_date) over (
             partition by h.customer_id, h.anchor order by h.final_event_date) as gap_days
      from held h
  ), per_cust as (
    select h.customer_id, h.anchor, count(*)::integer as held_count, max(h.final_event_date) as last_event
      from held h group by h.customer_id, h.anchor
  ), med as (
    select g.customer_id, g.anchor,
           (percentile_cont(0.5) within group (order by g.gap_days))::numeric as median_gap
      from gaps g where g.gap_days is not null group by g.customer_id, g.anchor
  ), fut as (
    select distinct p.customer_id, a.anchor
      from public.projects p
      cross join anchors a
     where p.project_status <> 'cancelled'
       and p.customer_id is not null
       and p.final_event_date >= a.anchor
  ), scored as (
    select pc.customer_id, pc.anchor, pc.held_count, pc.last_event, m.median_gap,
           (pc.anchor - pc.last_event)::numeric as days_since,
           (f.customer_id is not null)          as has_future
      from per_cust pc
      left join med m on m.customer_id = pc.customer_id and m.anchor = pc.anchor
      left join fut f on f.customer_id = pc.customer_id and f.anchor = pc.anchor
  ), drift as (
    select s.*,
           round(s.days_since / nullif(s.median_gap, 0), 1) as ratio,
           (s.days_since > coalesce(v_dormant, 'infinity'::numeric)) as dormant
      from scored s
     where s.held_count >= 3
       and not s.has_future
       and v_mult is not null
       and s.days_since > v_mult * nullif(s.median_gap, 0)
  )
  select jsonb_build_object(
           'drifting_now',  (select count(*)::integer from drift where anchor = v_today),
           'drifting_prev', (select count(*)::integer from drift where anchor = v_prev),
           'eligible',      (select count(*)::integer from scored where anchor = v_today and held_count >= 3),
           'below_min',     (select count(*)::integer from scored where anchor = v_today and held_count between 1 and 2),
           'no_held',       (select count(*)::integer from public.customers c
                              where not exists (select 1 from scored s
                                                 where s.customer_id = c.customer_id and s.anchor = v_today)),
           'customers',     (select count(*)::integer from public.customers),
           'only_personal', (select count(*)::integer from drift where anchor = v_today and not dormant),
           'dormant_all',   (select count(*)::integer from scored
                              where anchor = v_today and not has_future
                                and days_since > coalesce(v_dormant, 'infinity'::numeric)),
           'dormant_lt3',   (select count(*)::integer from scored
                              where anchor = v_today and not has_future and held_count < 3
                                and days_since > coalesce(v_dormant, 'infinity'::numeric))
         )
    into v_counts;

  v_drift_n  := (v_counts ->> 'drifting_now')::integer;
  v_prev_n   := (v_counts ->> 'drifting_prev')::integer;
  v_elig     := (v_counts ->> 'eligible')::integer;
  v_only_n   := (v_counts ->> 'only_personal')::integer;
  v_dorm_n   := (v_counts ->> 'dormant_all')::integer;
  v_dorm_lt3 := (v_counts ->> 'dormant_lt3')::integer;

  -- ── הטבלה · 📐7 ו-הכרעה 24·ח7: מיון ראשוני הכנסת-12-החודשים יורד, משני פי-כמה ──
  -- 📐18 — בעל-שם על השורה החורגת: איש-הקשר הראשי, אותו דפוס בדיוק של `getBillingContact`.
  with held as (
    select p.customer_id, p.final_event_date from public.projects p
     where p.project_status <> 'cancelled' and p.customer_id is not null and p.final_event_date < v_today
  ), gaps as (
    select h.customer_id, h.final_event_date - lag(h.final_event_date) over (
             partition by h.customer_id order by h.final_event_date) as gap_days from held h
  ), per_cust as (
    select h.customer_id, count(*)::integer as held_count, max(h.final_event_date) as last_event
      from held h group by h.customer_id
  ), med as (
    select g.customer_id, (percentile_cont(0.5) within group (order by g.gap_days))::numeric as median_gap
      from gaps g where g.gap_days is not null group by g.customer_id
  ), fut as (
    select distinct p.customer_id from public.projects p
     where p.project_status <> 'cancelled' and p.customer_id is not null and p.final_event_date >= v_today
  ), rev as (
    select p.customer_id, sum(fm.revenue) as revenue
      from public.projects p
      cross join lateral public.finance_project_money(p.project_id) fm
     where p.project_status in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')
       and p.customer_id is not null
       and p.final_event_date >= v_y_from and p.final_event_date <= v_today
     group by p.customer_id
  ), fb as (
    select p.customer_id,
           round(avg(p.feedback_score)::numeric, 2) as avg_score,
           count(*)::integer                        as n,
           (array_agg(p.feedback_score order by p.final_event_date desc, p.project_id desc))[1] as last_score
      from public.projects p
     where p.feedback_status = 'completed' and p.feedback_score is not null and p.customer_id is not null
     group by p.customer_id
  ), contact as (
    select distinct on (cc.customer_id) cc.customer_id, cc.contact_name, cc.phone
      from public.customer_contacts cc where cc.is_primary order by cc.customer_id
  ), drift as (
    select pc.customer_id, pc.last_event, m.median_gap,
           (v_today - pc.last_event)::numeric as days_since
      from per_cust pc
      join med m on m.customer_id = pc.customer_id
      left join fut f on f.customer_id = pc.customer_id
     where pc.held_count >= 3 and f.customer_id is null and v_mult is not null
       and (v_today - pc.last_event)::numeric > v_mult * nullif(m.median_gap, 0)
  )
  -- 🔑 **שני מערכים ולא אחד:** האריחים נמדדים על **כל** המסומנים (הם חתך כלל-לקוחי),
  -- והטבלה בלבד מצטמצמת למסנן-הלקוח. איגוד השניים היה הופך את אריח-הספירה למספר
  -- שמשתנה עם המסנן בלי שנאמר על כך דבר.
  select coalesce(jsonb_agg(t.row order by t.revenue desc nulls last, t.ratio desc, t.customer_id), '[]'::jsonb),
         coalesce(jsonb_agg(t.row order by t.revenue desc nulls last, t.ratio desc, t.customer_id)
                  filter (where p_customer_id is null or t.customer_id = p_customer_id), '[]'::jsonb),
         sum(t.revenue),
         sum(t.revenue) filter (where not t.dormant),
         (select sum(r.revenue) from rev r)
    into v_all_rows, v_rows, v_rev, v_only_rev, v_rev_all
    from (select d.customer_id,
                 coalesce(r.revenue, 0) as revenue,
                 round(d.days_since / nullif(d.median_gap, 0), 1) as ratio,
                 (d.days_since > coalesce(v_dormant, 'infinity'::numeric)) as dormant,
                 jsonb_build_object(
                   'drill_key',    jsonb_build_object('kind', 'customer', 'id', d.customer_id),
                   'customer_id',  d.customer_id,
                   'company_name', c.company_name,
                   'contact_name', coalesce(ct.contact_name, 'אין איש קשר ראשי'),
                   'contact_phone', ct.phone,
                   'revenue_12m',  coalesce(r.revenue, 0),
                   'last_event',   d.last_event,
                   'days_since',   d.days_since,
                   'cadence',      d.median_gap,
                   'ratio',        round(d.days_since / nullif(d.median_gap, 0), 1),
                   'last_score',   f.last_score,
                   'avg_score',    f.avg_score,
                   'feedback_n',   coalesce(f.n, 0),
                   -- 🪤 I1 · העמודה נקראת "ציון אחרון · ממוצעו" ומבטיחה **שני** מספרים,
                   --    והתא נשא אחד. המוקאפ המאושר (`#c3`) מצייר תא אחד: הציון האחרון
                   --    (ככוכבים) ואחריו `· 2.90 (n=10)`. ‏G-ל5 נועל **תשע** עמודות ⇒ עמודה
                   --    עשירית הייתה סותרת הכרעה רשומה, ולכן זהו תא-טקסט מורכב אחד.
                   --    שלושת המספרים הגולמיים נשארים במקומם ואף אחד מהם לא זז.
                   'score_pair',   case when f.last_score is null and f.avg_score is null then null
                                        else v_lri || coalesce(f.last_score::text, '—') || v_pdi || ' · '
                                             || v_lri || coalesce(to_char(f.avg_score, 'FM990.00'), '—') || v_pdi
                                             || ' (' || v_lri || 'n=' || coalesce(f.n, 0) || v_pdi || ')' end,
                   'dormant',      (d.days_since > coalesce(v_dormant, 'infinity'::numeric)),
                   -- 🔒 המילון נועל: "מתרחק" הוא דגל **בשורה**; "מתרחקים" הוא אריח-הספירה בלבד.
                   'flag',         case when d.days_since > coalesce(v_dormant, 'infinity'::numeric)
                                        then 'מתרחק · גם רדום' else 'מתרחק בלבד' end) as row
            from drift d
            join public.customers c on c.customer_id = d.customer_id
            left join rev r  on r.customer_id  = d.customer_id
            left join fb f   on f.customer_id  = d.customer_id
            left join contact ct on ct.customer_id = d.customer_id) t;

  -- אריח "הוותיק שברשימה" — השורה עם הכי הרבה ימים מאז האירוע האחרון.
  select jsonb_build_object(
           'company_name', e.value ->> 'company_name',
           'days_since',   (e.value ->> 'days_since')::numeric,
           'ratio',        (e.value ->> 'ratio')::numeric,
           'cadence',      (e.value ->> 'cadence')::numeric,
           'last_event',   e.value ->> 'last_event',
           'avg_score',    (e.value ->> 'avg_score')::numeric,
           'feedback_n',   (e.value ->> 'feedback_n')::integer,
           -- הטענה "הנמוך ברשימה" נבדקת ואינה מוצהרת: היא נאמרת רק אם היא נכונה.
           'lowest_avg',   (e.value ->> 'avg_score')::numeric is not null
                           and (e.value ->> 'avg_score')::numeric
                               = (select min((x.value ->> 'avg_score')::numeric) from jsonb_array_elements(v_all_rows) x))
    into v_oldest
    from jsonb_array_elements(v_all_rows) e
   order by (e.value ->> 'days_since')::numeric desc limit 1;

  -- שורת-"אז מה" (📐23, תומך-החלטה ⇒ "להתקשר") — שתי השורות הגדולות **שנתפסות רק בקצב האישי**.
  select coalesce(jsonb_agg(x.value order by (x.value ->> 'revenue_12m')::numeric desc), '[]'::jsonb)
    into v_call
    from (select e.value from jsonb_array_elements(v_all_rows) e
           where (e.value ->> 'dormant')::boolean is false
           order by (e.value ->> 'revenue_12m')::numeric desc limit 2) x;

  -- ── היסטוגרמת-הקצב · **רוחב-דלי 30 מוצהר, הדלי האחרון פתוח** (📑ב#18) ────────
  -- 🔴 **כאן, ורק כאן, הגבול חצי-פתוח `(lo, hi]`** — ‏`ceil` ולא `floor`. ר' "פער 1"
  -- בכותרת: `floor` מחזיר 399·96·64·35·20·17·45 במקום 401·98·61·36·20·16·44 שנמדדו.
  -- ⚠️ מרווח 0 (שני אירועים באותו יום — **קיים בדאטה**) נספר בדלי הראשון.
  with held as (
    select p.customer_id, p.final_event_date from public.projects p
     where p.project_status <> 'cancelled' and p.customer_id is not null and p.final_event_date < v_today
  ), gaps as (
    select (h.final_event_date - lag(h.final_event_date) over (
             partition by h.customer_id order by h.final_event_date))::integer as gap_days
      from held h
  ), bucketed as (
    select least(greatest(ceil(g.gap_days / 30.0)::integer, 1), 7) as bucket, count(*)::integer as n
      from gaps g where g.gap_days is not null group by 1
  )
  select jsonb_build_object(
           'data', coalesce(jsonb_agg(jsonb_build_object(
                     'bucket', s.bucket,
                     'label', case when s.bucket = 7 then '181+'
                                   else format('%s–%s', case when s.bucket = 1 then 0 else (s.bucket - 1) * 30 + 1 end,
                                                       s.bucket * 30) end,
                     'open', s.bucket = 7,
                     'n', coalesce(b.n, 0)) order by s.bucket), '[]'::jsonb),
           'total', (select coalesce(sum(n), 0) from bucketed),
           'max_gap', (select max(g.gap_days) from gaps g where g.gap_days is not null))
    into v_hist
    from generate_series(1, 7) as s(bucket)
    left join bucketed b on b.bucket = s.bucket;

  v_pop := jsonb_build_object(
    'eligible', v_elig,
    'below_min', (v_counts ->> 'below_min')::integer,
    'no_held', (v_counts ->> 'no_held')::integer,
    'customers', (v_counts ->> 'customers')::integer);

  v_notes := v_notes
    || to_jsonb('האריחים וההיסטוגרמה נמדדים על כלל הלקוחות ואינם מושפעים ממסנני התקופה והלקוח; הטבלה כן.'::text)
    || to_jsonb((v_lri || to_char((v_counts ->> 'below_min')::integer, 'FM999,999,999') || v_pdi
                 || ' לקוחות עם פחות משלושה אירועים שהתקיימו אינם בדוח; '
                 || v_lri || to_char(v_dorm_lt3, 'FM999,999,999') || v_pdi || ' מהם עומדים בתנאי "רדום".')::text)
    -- ⑤ מ21: עמודות/אריחי-ה-₪ הן הרשאת מודול **'כספים'** ולא 'לקוחות'.
    -- 🔒 §7.100 (הכרעת ישי 17/09/2026) — **המיסוך עבר אל תוך המסד**, ולכן החצי השני של
    -- המשפט (*"המיסוך מתבצע בלשונית"*) חדל להיות נכון ו**ירד מהמסך**. משפט-המדיניות
    -- עצמו נשאר, והוא זה שאינו נמסך (‏`₪` בלי ספרות).
    -- ⚠️ `cards-customers.md ⑤ מ21` עדיין מצטט את הנוסח הישן — **מדווח, לא נערך מכאן.**
    || to_jsonb('עמודות ואריחי ה-₪ בדף זה כפופים להרשאת מודול כספים.'::text);
  if p_drill is not null then
    v_notes := v_notes || to_jsonb('הדף אינו דוח-קידוח (📐13) — פרמטר הקידוח לא הופעל.'::text);
  end if;

  v_out := jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_elig,
      'label', 'אוכלוסייה: ' || v_lri || to_char(v_elig, 'FM999,999,999') || v_pdi || ' לקוחות שקיימו '
               || v_lri || '3' || v_pdi || ' אירועים לפחות שכבר התקיימו, מתוך '
               || v_lri || to_char((v_counts ->> 'customers')::integer, 'FM999,999,999') || v_pdi || ' · הוצאו: '
               || v_lri || to_char((v_counts ->> 'no_held')::integer, 'FM999,999,999') || v_pdi || ' לקוחות בלי אף אירוע שהתקיים · '
               || v_lri || to_char((v_counts ->> 'below_min')::integer, 'FM999,999,999') || v_pdi
               || ' עם פחות משלושה · אירועים מבוטלים ואירועים עתידיים אינם נספרים בקצב.',
      'excluded', jsonb_build_object(
        'בלי אף אירוע שהתקיים', (v_counts ->> 'no_held')::integer,
        'פחות משלושה אירועים', (v_counts ->> 'below_min')::integer)),
    'window', jsonb_build_object(
      'from', v_from, 'to', v_to,
      'label', 'נכון ל-' || v_lri || to_char(v_today, 'DD/MM/YYYY') || v_pdi || ' · '
               || case when p_customer_id is null then 'כל הלקוחות' else 'לקוח נבחר' end),
    'tiles', jsonb_build_array(
      jsonb_build_object(
        'key', 'drifting_count',
        'label', 'לקוחות מתרחקים',
        'value', v_drift_n,
        'format', 'int',
        'sub', 'מתוך ' || v_lri || to_char(v_elig, 'FM999,999,999') || v_pdi || ' לקוחות עם ' || v_lri || '3+' || v_pdi
               || ' אירועים (' || v_lri
               || coalesce(to_char(round(100.0 * v_drift_n / nullif(v_elig, 0), 1), 'FM999990.0'), '—')
               || '%' || v_pdi || ')',
        'detail', v_pop,
        'window', 'נכון ל-' || v_lri || to_char(v_today, 'DD/MM') || v_pdi
                  || ' · אינו מושפע ממסנן התקופה',
        'compare', jsonb_build_object(
          'value', v_prev_n,
          'label', 'לפני חודש (' || v_lri || to_char(v_prev, 'DD/MM/YYYY') || v_pdi || ')',
          'direction', case when v_drift_n > v_prev_n then 'up'
                            when v_drift_n < v_prev_n then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object(
        -- 🔒 **"הכנסת 12 החודשים של הלקוחות המסומנים"** — ולא "הכנסה-בסיכון". זהו סכום
        -- שכבר **הורווח**, לא סכום שצפוי להיאבד; המילון נועל את הניסוח.
        'key', 'marked_revenue_12m',
        'label', 'הכנסת 12 החודשים של הלקוחות המסומנים',
        'value', v_rev,
        'format', 'money',
        'sub', v_lri || coalesce(to_char(round(100 * v_rev / nullif(v_rev_all, 0), 1), 'FM999990.0'), '—')
               || '%' || v_pdi || ' מ-'
               || v_lri || coalesce(to_char(round(v_rev_all), 'FM999,999,999'), '—') || ' ₪' || v_pdi
               || ' שהעסק הכניס ב-' || v_lri || '12' || v_pdi || ' החודשים',
        'detail', jsonb_build_object('marked_revenue', v_rev, 'company_revenue', v_rev_all),
        'window', v_lri || to_char(v_y_from, 'DD/MM/YYYY') || '–' || to_char(v_today, 'DD/MM/YYYY') || v_pdi,
        'compare', jsonb_build_object(
          'value', null,
          'label', 'זהו סכום שכבר הורווח — לא סכום שצפוי להיאבד',
          'direction', 'flat'),
        'target', null),
      jsonb_build_object(
        'key', 'only_personal_cadence',
        'label', 'נתפסים רק בקצב האישי',
        'value', v_only_n,
        'format', 'int',
        'sub', v_lri || coalesce(to_char(round(coalesce(v_only_rev, 0)), 'FM999,999,999'), '0') || ' ₪' || v_pdi
               || ' בשנה האחרונה',
        'detail', jsonb_build_object('only_personal', v_only_n, 'revenue', coalesce(v_only_rev, 0),
                                     'dormant_rule_finds', v_dorm_n),
        'window', 'נכון ל-' || v_lri || to_char(v_today, 'DD/MM') || v_pdi,
        -- 🪤 J1 · **המשפט הבטיח מספר אחד והערך נשא אחר.** התווית אומרת *"…ואת אלה
        --    הוא מפספס"*, והערך היה `v_dorm_n` — כלומר מה שכלל-120-הימים **מוצא**,
        --    אותו מספר שהתווית עצמה כבר הדפיסה שורה לפניו (⁦11⁩ ואז ⁦11⁩). מה שהוא
        --    מפספס הם הלקוחות שנתפסים רק בקצב האישי — `only_personal` = `not dormant`
        --    בתוך `drift`, וזה בדיוק הערך שעל האריח עצמו.
        'compare', jsonb_build_object(
          'value', v_only_n,
          'label', 'כלל ' || v_lri || coalesce(v_dormant::text, '—') || v_pdi
                   || ' הימים לבדו מוצא ' || v_lri || to_char(v_dorm_n, 'FM999,999,999') || v_pdi
                   || ' לקוחות, ואת אלה הוא מפספס',
          'direction', 'flat'),
        'target', null),
      jsonb_build_object(
        'key', 'oldest_in_list',
        'label', 'הוותיק שברשימה',
        'value', v_oldest ->> 'company_name',
        'format', 'text',
        'sub', case when v_oldest is null then 'אין לקוח מתרחק כרגע'
          else v_lri || to_char((v_oldest ->> 'days_since')::integer, 'FM999,999,999') || v_pdi || ' ימים מאז האירוע האחרון — פי '
               || v_lri || (v_oldest ->> 'ratio') || v_pdi || ' מהקצב שלו ('
               || v_lri || (v_oldest ->> 'cadence') || v_pdi || ' ימים)' end,
        'detail', v_oldest,
        'window', case when v_oldest is null then '—'
          else 'אירוע אחרון ' || v_lri || to_char((v_oldest ->> 'last_event')::date, 'DD/MM/YYYY') || v_pdi end,
        'compare', case when v_oldest is null or (v_oldest ->> 'avg_score') is null then null
          else jsonb_build_object(
            'value', (v_oldest ->> 'avg_score')::numeric,
            -- 🪤 I2 · התווית הדפיסה את הציון, והערך הוא אותו ציון (`2.43: 2.43`).
            'label', 'ממוצע המשוב שלו על ' || v_lri || to_char((v_oldest ->> 'feedback_n')::integer, 'FM999,999,999') || v_pdi || ' משובים'
                     || case when (v_oldest ->> 'lowest_avg')::boolean then ' — הנמוך ברשימה' else '' end,
            'direction', 'flat') end,
        'target', null)),
    'chart', jsonb_build_object(
      'type', 'histogram',
      'title', 'הקצב שבו לקוחות חוזרים · ' || v_lri || to_char((v_hist ->> 'total')::integer, 'FM999,999') || v_pdi
               || ' מרווחים בין אירועים עוקבים, בדליים של ' || v_lri || '30' || v_pdi || ' יום',
        -- 🪤 I1 · `series[].format` הוא הקודם ל-`unit` בגזירת תו-הסימון
        --    ובטולטיפ, והוא היה `null`. הערכים עצמם אינם זזים.
      'series', jsonb_build_array(jsonb_build_object('key', 'n', 'label', 'מספר מרווחים', 'format', 'int')),
      'data', v_hist -> 'data',
      'xKey', 'label',
      'domain', null,
      'refLines', '[]'::jsonb,
      -- 🪤 I1 · **`chart.unit` הוא שם-פורמט של C8, לא מחרוזת-תצוגה.**
      --    ‏`ChartCard.valueFormat` מחזיר `series[0].format ?? unit` ומזין את
      --    ‏`formatAxisTick`, ו-`HebrewTooltip` מזין את `formatByType` — שניהם מצפים
      --    ל-`money|percent|int|ratio|score|days|text|date`. מחרוזת-תצוגה היא **פורמט
      --    לא-מוכר** ⇒ הציר נופל לקיבוץ-אלפים חשוף והטולטיפ ל-`text`.
      --    הכיתוב העברי נשמר ב-`unit_label` (תוספתי; **אין לו קורא היום** — מדווח).
      'unit', 'int', 'unit_label', 'מרווחים'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'company_name', 'label', 'לקוח',              'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'contact_name', 'label', 'איש קשר',           'format', 'text',  'align', 'start'),
      -- 📐7 · מיון ראשוני הכנסת-12-החודשים יורד ⇒ 📐9 מחייב `aria-sort` עליה.
      jsonb_build_object('key', 'revenue_12m',  'label', 'הכנסת 12 החודשים',  'format', 'money', 'align', 'end',
                         'sorted', 'descending'),
      -- 🪤 I1 · `date` במטען ⇒ `"2026-06-22"`; `date` מנתב ל-`formatIsraelDate`.
      jsonb_build_object('key', 'last_event',   'label', 'אירוע אחרון',       'format', 'date',  'align', 'start'),
      jsonb_build_object('key', 'days_since',   'label', 'ימים מאז האירוע',   'format', 'days',  'align', 'end'),
      jsonb_build_object('key', 'cadence',      'label', 'הקצב שלו',          'format', 'days',  'align', 'end'),
      jsonb_build_object('key', 'ratio',        'label', 'פי כמה מהקצב',      'format', 'ratio', 'align', 'end'),
      -- 🪤 I1 · העמודה מצביעה עכשיו על `score_pair` (ר' ההערה בבניית-השורה). `last_score`
      --    ו-`avg_score` נשארים במטען כמספרים — שום מפתח לא נמחק, ומספר העמודות נשאר תשע.
      jsonb_build_object('key', 'score_pair',   'label', 'ציון אחרון · ממוצעו', 'format', 'text',  'align', 'end'),
      jsonb_build_object('key', 'flag',         'label', 'דגל',               'format', 'text',  'align', 'start')),
    'rows', v_rows,
    'so_what', case
      when v_drift_n = 0 then 'אין לקוח מתרחק כרגע.'
      when jsonb_array_length(v_call) = 0
        then 'להתקשר השבוע ללקוחות שברשימה — ' || v_lri || to_char(v_drift_n, 'FM999,999,999') || v_pdi
             || ' מתרחקים, וכולם כבר מעבר לסף ' || v_lri || coalesce(v_dormant::text, '—') || v_pdi
             || ' הימים הקיים.'
      when jsonb_array_length(v_call) = 1
        then 'להתקשר השבוע ל' || (v_call #>> '{0,contact_name}') || ' מ' || (v_call #>> '{0,company_name}')
             || ' — שקטה פי ' || v_lri || (v_call #>> '{0,ratio}') || v_pdi || ' מהקצב שלה, '
             || v_lri || to_char(round((v_call #>> '{0,revenue_12m}')::numeric), 'FM999,999,999') || ' ₪' || v_pdi
             || ' בשנה האחרונה, ועדיין אינה נחשבת "רדומה".'
      else 'להתקשר השבוע ל' || (v_call #>> '{0,contact_name}') || ' מ' || (v_call #>> '{0,company_name}')
           || ' ול' || (v_call #>> '{1,contact_name}') || ' מ' || (v_call #>> '{1,company_name}')
           || ' — שתיהן שקטו פי ' || v_lri || (v_call #>> '{0,ratio}') || v_pdi
           || ' ופי ' || v_lri || (v_call #>> '{1,ratio}') || v_pdi || ' מהקצב שלהן, יחד '
           || v_lri || to_char(round((v_call #>> '{0,revenue_12m}')::numeric
                                     + (v_call #>> '{1,revenue_12m}')::numeric), 'FM999,999,999') || ' ₪' || v_pdi
           || ' בשנה האחרונה, ושתיהן עדיין לא נחשבות "רדומות".' end,
    'definitions', 'הגדרות: מתרחק = שני תנאים יחד: אין לו אף אירוע עתידי במערכת, וגם עברו מאז האירוע האחרון יותר מפי '
                   || v_lri || coalesce(v_mult::text, '—') || v_pdi
                   || ' מהמרווח הרגיל שלו. נדרשים ' || v_lri || '3' || v_pdi
                   || ' אירועים שהתקיימו לפחות · הקצב שלו = חציון המרווחים בימים בין אירועים עוקבים של אותו לקוח, כל הזמנים · פי כמה מהקצב = ימים מאז האירוע האחרון, חלקי הקצב שלו · רדום = הדגל הקיים במערכת: אין אירוע עתידי וגם עברו יותר מ-'
                   || v_lri || coalesce(v_dormant::text, '—') || v_pdi
                   || ' ימים. הוא חל על כל הלקוחות, גם על אלה עם פחות משלושה אירועים · אירוע = פרויקט שתאריך האירוע שלו כבר עבר ולא בוטל · הכנסת '
                   || v_lri || '12' || v_pdi
                   || ' החודשים = סך ההכנסה מאירועים שהתקיימו בשנה האחרונה ויצאה להם חשבונית — לא רק מאלה שכבר שולמו במלואם. זהו סכום שכבר הורווח, לא סכום שצפוי להיאבד.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      -- §7.100 · דגל-החוזה — ר' ההערה במ19.
      'money_masked', not v_can_money,
      'missing_params', to_jsonb(v_missing),
      'frozen_count', null,
      'notes', v_notes,
      'export_blocked_reason', null,
      'customer_filter_ignored', jsonb_build_array(
        'drifting_count', 'marked_revenue_12m', 'only_personal_cadence', 'oldest_in_list'),
      'drill_echo', p_drill,
      'run', null));

  -- 🔒 §7.100 — ארבעת מקומות-הכסף של מ21, כל אחד בשמו (נמדד 17/09/2026 על גוף-J1 החי):
  --    ① אריח `marked_revenue_12m` (`format:'money'`) — ערך, שורת-משנה ו-`detail`
  --      (‏`detail.company_revenue` הוא סכום שלם, ו**הלשונית אינה ממסכת `detail` כלל**) ·
  --    ② אריח `only_personal_cadence` — שורת-המשנה נושאת ₪ והאריח אינו אריח-כסף ⇒ הסכום
  --      לבדו מוחלף והמשפט נשאר, בדיוק כמו `maskTile` בלשונית; `detail.revenue` יורד ·
  --    ③ `rows[].revenue_12m` · ④ שורת-"אז מה" — **וזו הדליפה שסבב-הביקורת תפס**:
  --      הדף הסתיר את הסכום בשלושה מקומות והדפיס אותו במקום רביעי.
  if not v_can_money then
    v_money_pat := v_lri || '[^' || v_lri || v_pdi || ']*₪[^' || v_lri || v_pdi || ']*' || v_pdi
                   || '|\d[\d,.]*\s?₪';
    v_out := jsonb_set(v_out, '{tiles}', coalesce((
      select jsonb_agg(
               case t ->> 'key'
                 when 'marked_revenue_12m'
                   then t || jsonb_build_object('value', null, 'sub', null, 'detail', null)
                 when 'only_personal_cadence'
                   then t || jsonb_build_object(
                          'sub', regexp_replace(t ->> 'sub', v_money_pat, v_mask_amt, 'g'),
                          'detail', (t -> 'detail') || jsonb_build_object('revenue', null))
                 else t
               end order by o)
        from jsonb_array_elements(v_out -> 'tiles') with ordinality x(t, o)), '[]'::jsonb));
    v_out := jsonb_set(v_out, '{rows}', coalesce((
      select jsonb_agg(jsonb_set(r, '{revenue_12m}', 'null'::jsonb) order by o)
        from jsonb_array_elements(v_out -> 'rows') with ordinality x(r, o)), '[]'::jsonb));
    -- ‏`is not null` ולא `coalesce`: ‏`jsonb_set` עם ערך-NULL מחזיר NULL על **כל** המטען.
    if v_out ->> 'so_what' is not null then
      v_out := jsonb_set(v_out, '{so_what}',
        to_jsonb(regexp_replace(v_out ->> 'so_what', v_money_pat, v_mask_amt, 'g')));
    end if;
  end if;

  return v_out;
end;
$function$;

comment on function public.report_m21_drifting(date, date, integer, jsonb) is
  'לקוחות מתרחקים (מ21) — קריאה בלבד, מגודר על מודול לקוחות. אוכלוסייה: לקוחות שקיימו שלושה אירועים לפחות שכבר התקיימו; הוצאו לקוחות בלי אף אירוע שהתקיים ולקוחות עם פחות משלושה. אירועים מבוטלים ואירועים עתידיים אינם נספרים בקצב. האריחים וההיסטוגרמה אינם מגיבים למסנני התקופה והלקוח; הטבלה כן. מכפיל_מרווח_מתרחק ו-סף_לקוח_רדום_ימים נקראים בזמן ריצה ואין להם ברירת-מחדל.';

revoke execute on function public.report_m21_drifting(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m21_drifting(date, date, integer, jsonb) to authenticated;

-- =============================================================================
-- בלוק 2 · T2 — שלילת הרשאות-הטבלה מארבע טבלאות ה-deny-all
-- =============================================================================
-- 🔻 **מה נמדד לפני השלילה, בסשן הזה ולא מהמסירה:**
-- ‏(א) ‏`relacl` של ארבעתן = `{postgres=arwdDxtm/postgres, anon=arwdDxtm/postgres,
--     authenticated=arwdDxtm/postgres, service_role=arwdDxtm/postgres}` ו-`relrowsecurity = true`.
-- ‏(ב) **כל 14 הקוראות הן `security definer` עם `search_path=""`** — נמדד ב-`pg_proc`
--     (‏`prosecdef` · `proconfig`): ‏`login_attempts` ⇐ `check_login_lock` ·
--     ‏`register_failed_login` · `reset_login_attempts` · `feedback_rpc_calls` ⇐
--     ‏`feedback_rate_limit` · `project_changes` ⇐ `apply_scope_change` · `finance_project_money` ·
--     ‏`list_project_changes` · `list_projects_overview` · `report_m12_equipment` ·
--     ‏`seed_registry` ⇐ `enforce_quote_in_progress_lock` · `seed_backdate_project` ·
--     ‏`seed_backdate_quote` · `seed_register` · `seed_reset`.
--     ‏**SECURITY DEFINER רצה בהרשאות הבעלים ⇒ שלילת הגרנט מהתפקידים אינה נוגעת בה.**
-- ‏(ג) **אפס קריאות-לקוח ישירות:** ‏`grep -rn "from('<טבלה>'"` ב-`src/` וב-`e2e/` מחזיר
--     ‏**0** לארבעתן; כל האזכורים הם הערות ומסמכים שמתעדים בדיוק את ה-deny-all הזה
--     (‏`src/modules/06_projects/CLAUDE.md:23,43` · `src/modules/02_customers/api.js:106`).
--     ‏`scripts/seed-lib/db.mjs` נוגעת ב-`seed_registry` **רק דרך `rpc('seed_register')`** (‏`:122`).
-- 🔑 **ולכן זו שלילה בלי קורא** — ולא "נראה שאף אחד לא משתמש".

revoke all on table public.login_attempts      from anon, authenticated;
revoke all on table public.feedback_rpc_calls from anon, authenticated;
revoke all on table public.project_changes    from anon, authenticated;
revoke all on table public.seed_registry      from anon, authenticated;

-- =============================================================================
-- בלוק 3 · T9 — `assignments.recommended_rank_set_at` + הטריגר שמחתים אותה
-- =============================================================================
-- why: ‏`recommended_rank` נכתב ואין לצדו תאריך ⇒ *"ממתי אנחנו מאמצים את המלצת
-- Smart Match?"* אינה נענית. דוח 14א/17 מצהיר על החֶסֶר, וזו ההשלמה.
--
-- 🔴 **למה טריגר ולא כתיבה מהלקוח** (`src/CLAUDE.md` §3, מלכודת-השעון): שעון-הדפדפן
-- אינו מקור-אמת — `new Date().toISOString()` במחשב שהשעון בו סוטה היה חותם תאריך שקרי
-- על שורה במסד. הטריגר חותם ב-`now()` של המסד. ⇒ **אפס שינוי בקוד הלקוח**
-- (‏`src/modules/04_hostesses/api.js` `insertWithRank` לא נגעה).
--
-- 🪤 **וכאן תוקנה הנחה שגויה בניסוח-המשימה, אחרי קריאת מסלול-הכתיבה בפועל:** ההצעה
-- הייתה `before update of recommended_rank`. **הדרג אינו מתעדכן לעולם** — הוא נכתב
-- **פעם אחת, על ה-`insert`** (`api.js:677` `insertWithRank`; מיגרציה B ו-M11-4 אומרים
-- במפורש *"ואינו נדרס בשליחה-חוזרת"*). טריגר-`update` בלבד היה עמודה שלעולם נשארת NULL —
-- כלומר תיקון שנראה עשוי ואינו עובד. ⇒ `before insert or update of recommended_rank`.
--
-- 🔑 **`is distinct from` ולא `<>`:** ‏`update` שמזכיר את העמודה בלי לשנות אותה מפעיל את
-- הטריגר, ו-NULL מול NULL ב-`<>` הוא NULL (לא `false`) ⇒ החתימה הייתה נדרסת בלי שינוי-ערך.
-- ומחיקת-דרג (‏`... := null`) מוחקת גם את החותמת — חותמת בלי דרג היא שקר קטן.
--
-- 🚫 **אין מילוי-לאחור:** ‏5,741 השורות הקיימות נשארות NULL בשתי העמודות, מאותו טעם
-- שמיגרציה B נימקה — תאריך ממולא-לאחור הוא המצאה שהדוח מציג כאחוז-אימוץ.

alter table public.assignments
  add column if not exists recommended_rank_set_at timestamptz;

comment on column public.assignments.recommended_rank_set_at is
  'מתי נחתם recommended_rank, בשעון המסד. נכתב אך ורק ע"י הטריגר assignments_recommended_rank_stamp — לא ע"י הלקוח, כדי ששעון-דפדפן סוטה לא יחתום תאריך שקרי. NULL = אין דרג (או שורה שקדמה לטריגר); אין מילוי-לאחור, מאותו טעם שהעמודה recommended_rank עצמה אינה ממולאת לאחור. T9, M11-4, כרטיס ת5.';

create or replace function public.stamp_recommended_rank_set_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  -- ‏insert: הדרג נכתב כאן ורק כאן (‏`insertWithRank`), ולכן זהו המסלול האמיתי.
  if tg_op = 'INSERT' then
    if new.recommended_rank is not null then
      new.recommended_rank_set_at := now();
    end if;
  -- ‏update: היום אין מסלול כזה בקוד, והטריגר קיים כדי שלא ייווצר אחד **בלי** חותמת.
  elsif new.recommended_rank is distinct from old.recommended_rank then
    new.recommended_rank_set_at :=
      case when new.recommended_rank is null then null else now() end;
  end if;
  return new;
end
$function$;

comment on function public.stamp_recommended_rank_set_at() is
  'מחתים assignments.recommended_rank_set_at בשעון המסד כשנכתב או משתנה recommended_rank. T9.';

drop trigger if exists assignments_recommended_rank_stamp on public.assignments;
create trigger assignments_recommended_rank_stamp
  before insert or update of recommended_rank on public.assignments
  for each row
  execute function public.stamp_recommended_rank_set_at();

-- =============================================================================
-- בלוק 4 · תוויות-החודשים בצירי הגרפים — שם-חודש עברי **מקוצר**
-- =============================================================================
-- why: הכרעת ישי 17/09/2026 — *"תקן"*. ציר שנושא 12 תוויות באורך *"אוקטובר"* נדחס,
-- והמוסכמה בשוק (Excel · Google Sheets · ספריות-גרפים) היא קיצור בגרש.
-- ‏**הגרש הוא `U+05F3` (׳) ולא אפוסטרוף ASCII** — אפוסטרוף בתוך מחרוזת-SQL עברית הוא
-- גם תו שגוי טיפוגרפית וגם סגירת-מחרוזת.
--
-- 🔑 **מה לא זז:** ‏`month` נשאר מפתח-המכונה · **השנה נשארת בדיוק כפי ש-J2 הכריע** —
-- ‏מ2 בלי שנה (ציר חד-שנתי) · מ7 ומ14 עם שנה (חלון 12 חודשים חוצה שנתיים תמיד) ·
-- ‏מ19 עם שנה **רק** כשהחלון חוצה יותר משנה קלנדרית אחת · מ3 כפי שהוא.
-- ‏**הטבלה ה-sr-only והייצוא קוראים את אותו `label`** ⇒ אותה תווית בשלושת המקומות.
--
-- ⚠️ **תופעת-לוואי מדווחת ולא מוסתרת:** ‏`v_months_he` משמש גם בכמה משפטי-פרוזה
-- (‏מ7: *"אירועים שהתקיימו ב<חודש>"* · מ14: *"החודש <חודש> אינו בגרף"* · מ2: שורת-"אז מה"
-- ותוויות-ההשוואה). אלה יקראו עכשיו *"בספט׳"* במקום *"בספטמבר"*. **ההכרעה דיברה על
-- הצירים**; הפרדה בין שני מערכים הייתה יוצרת שתי צורות לאותו מושג על אותו מסך — בדיוק
-- מה ש-J2 איחד. ⇒ נבחרה צורה אחת, והפריט נרשם לשולחן-הבוקר.

create or replace function public.report_m02_exec_overview(
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
  -- הכרעה 36 — ארבעת הסטטוסים, בשמותיהם במסד. טעות-הקלדה כאן אינה שגיאה אלא דוח ריק.
  v_statuses constant text[] :=
    array['finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished'];
  v_months_he constant text[] := array['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני',
    'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
  v_lri constant text := chr(8294);   -- U+2066 LRI — כמו `isolateLtr` ב-reportsFormat.js
  v_pdi constant text := chr(8297);   -- U+2069 PDI
  v_today date := (now() at time zone 'Asia/Jerusalem')::date;
  v_from date;
  v_to date;
  v_prev_from date;
  v_prev_to date;
  v_n integer;
  v_rev numeric;
  v_prof numeric;
  v_frozen integer;
  v_prev_n integer;
  v_prev_rev numeric;
  v_prev_prof numeric;
  v_ncust integer;
  v_total_rev numeric;
  v_top5 numeric;
  v_prev_ncust integer;
  v_prev_total numeric;
  v_prev_top5 numeric;
  v_chart jsonb;
  v_rows jsonb;
  v_customers_all integer;
  v_projects_all integer;
  v_excl_status integer;
  v_excl_window integer;
  v_customer_name text;
  v_margin numeric;
  v_prev_margin numeric;
  v_top5_pct numeric;
  v_prev_top5_pct numeric;
  v_growth numeric;
  v_window_text text;
  v_notes jsonb := '[]'::jsonb;
  v_so_what text;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  v_to   := coalesce(p_to, v_today);
  v_from := coalesce(p_from, date_trunc('year', v_to)::date);
  -- "אשתקד" = אותו טווח-ימים בדיוק, שנה אחורה (⑥ מ2) — לא שנה קלנדרית מלאה, אחרת
  -- השנה הרצה תיראה תמיד קטנה.
  v_prev_from := (v_from - interval '1 year')::date;
  v_prev_to   := (v_to   - interval '1 year')::date;

  with scoped as materialized (
    -- מעבר-lateral אחד על כל האוכלוסייה עד `v_to`; כל השאר נגזר ממנו בזיכרון.
    -- 🔴 `scoped` **אינו** מסונן לפי לקוח: אריח נתח-5 הוא מדד-ריכוזיות חברתי, ונתח של
    -- לקוח יחיד מול עצמו הוא תמיד 100%. הסינון מוחל ב-`cur`/`prev`/`rows` בלבד.
    select p.project_id,
           p.customer_id,
           p.event_name,
           p.final_event_date,
           fm.revenue,
           fm.gross_profit,
           (pf.final_profit is not null) as frozen
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      cross join lateral public.finance_project_money(p.project_id) fm
     where p.project_status = any (v_statuses)
       and p.final_event_date is not null
       and p.final_event_date <= v_to
  ),
  cur as (
    select * from scoped
     where final_event_date >= v_from
       and (p_customer_id is null or customer_id = p_customer_id)
  ),
  prev as (
    select * from scoped
     where final_event_date >= v_prev_from
       and final_event_date <= v_prev_to
       and (p_customer_id is null or customer_id = p_customer_id)
  ),
  cust_now as (select customer_id, sum(revenue) rev from scoped group by 1),
  cust_prev as (
    select customer_id, sum(revenue) rev from scoped
     where final_event_date <= v_prev_to group by 1
  ),
  top5_now as (
    select count(*)::integer ncust,
           coalesce(sum(rev), 0) total,
           coalesce(sum(rev) filter (where rn <= 5), 0) top5
      from (select rev, row_number() over (order by rev desc) rn from cust_now) t
  ),
  top5_prev as (
    select count(*)::integer ncust,
           coalesce(sum(rev), 0) total,
           coalesce(sum(rev) filter (where rn <= 5), 0) top5
      from (select rev, row_number() over (order by rev desc) rn from cust_prev) t
  ),
  axis as (
    select generate_series(date_trunc('month', v_from), date_trunc('month', v_to),
                           interval '1 month')::date m
  ),
  m_cur as (
    select date_trunc('month', final_event_date)::date m, count(*)::integer n,
           sum(revenue) rev, sum(gross_profit) prof
      from cur group by 1
  ),
  m_prev as (
    select date_trunc('month', final_event_date)::date m, sum(revenue) rev
      from prev group by 1
  ),
  chart as (
    select jsonb_agg(jsonb_build_object(
             'month',           a.m,
             'label',           v_months_he[extract(month from a.m)::integer],
             'revenue_cur',     coalesce(c.rev, 0),
             'profit_cur',      coalesce(c.prof, 0),
             'revenue_prev',    coalesce(pv.rev, 0),
             'event_count_cur', coalesce(c.n, 0),
             -- 📐20: החודש האחרון חלקי כשהחלון נגמר לפניו — הצהרת-אורך, לא עמודה שקרית.
             'partial',         a.m = date_trunc('month', v_to)::date
                                and v_to < (a.m + interval '1 month' - interval '1 day')::date
           ) order by a.m) j
      from axis a
      left join m_cur c on c.m = a.m
      left join m_prev pv on pv.m = (a.m - interval '1 year')::date
  ),
  top_rows as (
    select jsonb_agg(jsonb_build_object(
             'project_id',       t.project_id,
             'event_name',       t.event_name,
             'customer_name',    cu.company_name,
             'final_event_date', t.final_event_date,
             'revenue',          t.revenue,
             'profit',           t.gross_profit,
             'margin',           100 * t.gross_profit / nullif(t.revenue, 0),
             'drill_key',        jsonb_build_object('kind', 'project', 'id', t.project_id)
           ) order by t.revenue desc, t.project_id) j
      from (select * from cur order by revenue desc, project_id limit 8) t
      left join public.customers cu on cu.customer_id = t.customer_id
  ),
  counts as (
    select (select count(*) from public.customers)::integer customers_all,
           -- 🔴 D2 · שלושת המונים האלה נספרו על **כל** המערכת בעוד `n` מסונן לפי לקוח, ולכן
           --    הצהרת-האוכלוסייה (📐2) הציגה על מסנן-לקוח 401 את «‏n=50 · 500 מחוץ לחלון ·
           --    101 בסטטוס אחר» — פירוק שאינו מסתכם באוכלוסייה שהוא מתיימר לפרק. שלושתם
           --    מסוננים עכשיו יחד עם `cur`. `customers_all` נשאר גלובלי **בכוונה**: הוא משרת
           --    רק את אריח נתח-5, שמוצהר כמדד-כלל-חברתי שאינו מגיב למסנן (⑧ 2.4).
           (select count(*) from public.projects
             where (p_customer_id is null or customer_id = p_customer_id))::integer projects_all,
           (select count(*) from public.projects
             where not (project_status = any (v_statuses))
               and (p_customer_id is null or customer_id = p_customer_id))::integer excl_status,
           (select count(*) from public.projects
             where project_status = any (v_statuses)
               and (p_customer_id is null or customer_id = p_customer_id)
               and (final_event_date is null
                    or final_event_date < v_from
                    or final_event_date > v_to))::integer excl_window
  )
  select (select count(*)::integer from cur),
         (select coalesce(sum(revenue), 0) from cur),
         (select coalesce(sum(gross_profit), 0) from cur),
         (select count(*) filter (where frozen)::integer from cur),
         (select count(*)::integer from prev),
         (select coalesce(sum(revenue), 0) from prev),
         (select coalesce(sum(gross_profit), 0) from prev),
         tn.ncust, tn.total, tn.top5,
         tp.ncust, tp.total, tp.top5,
         coalesce(chart.j, '[]'::jsonb),
         coalesce(top_rows.j, '[]'::jsonb),
         counts.customers_all, counts.projects_all, counts.excl_status, counts.excl_window
    into v_n, v_rev, v_prof, v_frozen, v_prev_n, v_prev_rev, v_prev_prof,
         v_ncust, v_total_rev, v_top5, v_prev_ncust, v_prev_total, v_prev_top5,
         v_chart, v_rows, v_customers_all, v_projects_all, v_excl_status, v_excl_window
    from top5_now tn, top5_prev tp, chart, top_rows, counts;

  select c.company_name into v_customer_name
    from public.customers c where c.customer_id = p_customer_id;

  -- 🚫 כל מכנה עובר `nullif` — "אין אירועים" ו"שוליים 0%" אינם אותה אמירה (📐12).
  v_margin        := 100 * v_prof / nullif(v_rev, 0);
  v_prev_margin   := 100 * v_prev_prof / nullif(v_prev_rev, 0);
  v_top5_pct      := 100 * v_top5 / nullif(v_total_rev, 0);
  v_prev_top5_pct := 100 * v_prev_top5 / nullif(v_prev_total, 0);
  v_growth        := 100 * (v_rev / nullif(v_prev_rev, 0) - 1);

  v_window_text := v_lri || to_char(v_from, 'DD/MM') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi;

  if p_customer_id is not null then
    v_notes := v_notes || to_jsonb(
      'אריח «נתח 5 הלקוחות הגדולים» נמדד על כל הלקוחות ואינו מושפע ממסנן-הלקוח — נתח של לקוח יחיד מול עצמו הוא תמיד 100%.'::text);
  end if;
  if p_drill is not null then
    v_notes := v_notes || to_jsonb('מבט-על הנהלה אינו דוח-קידוח (📐13) — פרמטר הקידוח מתעלמים ממנו.'::text);
  end if;

  -- 📐23 + סייג-מבט-על: הפועל נגזר מהדף שהשורה פותחת (מגמות רב-שנתיות — אסטרטגי),
  -- ולכן *"לשים לב ש…"*. 🔴 **והמשפט מחושב ולא מוקלד** — שלושת הענפים קיימים כי דף
  -- שאומר "הצמיחה לא באה על חשבון הרווח" בשנה שבה השוליים ירדו הוא שקר על המסך.
  if v_growth is null or v_prev_margin is null then
    v_so_what := 'לשים לב שאין טווח מקביל אשתקד למדוד מולו — ' ||
      v_lri || to_char(round(v_rev), 'FM999,999,999') || ' ₪' || v_pdi || ' מתחילת התקופה, שולי-רווח ' ||
      v_lri || to_char(round(v_margin, 1), 'FM990.0') || '%' || v_pdi || '.';
  elsif v_margin >= v_prev_margin and v_growth >= 0 then
    v_so_what := 'לשים לב שהצמיחה השנה לא באה על חשבון הרווח — ' ||
      v_lri || to_char(round(v_rev), 'FM999,999,999') || ' ₪' || v_pdi || ' עד ' ||
      v_lri || to_char(v_to, 'DD/MM') || v_pdi || ', גידול של ' ||
      v_lri || to_char(round(v_growth, 1), 'FM990.0') || '%' || v_pdi ||
      ' מול אותו טווח אשתקד, ושולי-הרווח דווקא עלו ל-' ||
      v_lri || to_char(round(v_margin, 1), 'FM990.0') || '%' || v_pdi || '. הפירוט בדוח «מגמות רב-שנתיות».';
  elsif v_growth >= 0 then
    v_so_what := 'לשים לב שהצמיחה השנה באה על חשבון הרווח — ' ||
      v_lri || to_char(round(v_rev), 'FM999,999,999') || ' ₪' || v_pdi || ' עד ' ||
      v_lri || to_char(v_to, 'DD/MM') || v_pdi || ', גידול של ' ||
      v_lri || to_char(round(v_growth, 1), 'FM990.0') || '%' || v_pdi ||
      ' מול אותו טווח אשתקד, אך שולי-הרווח ירדו ל-' ||
      v_lri || to_char(round(v_margin, 1), 'FM990.0') || '%' || v_pdi ||
      ' מול ' || v_lri || to_char(round(v_prev_margin, 1), 'FM990.0') || '%' || v_pdi ||
      '. הפירוט בדוח «מגמות רב-שנתיות».';
  else
    v_so_what := 'לשים לב שההכנסות נמוכות מאותו טווח אשתקד — ' ||
      v_lri || to_char(round(v_rev), 'FM999,999,999') || ' ₪' || v_pdi || ' מול ' ||
      v_lri || to_char(round(v_prev_rev), 'FM999,999,999') || ' ₪' || v_pdi ||
      ', ושולי-הרווח על ' || v_lri || to_char(round(v_margin, 1), 'FM990.0') || '%' || v_pdi ||
      '. הפירוט בדוח «מגמות רב-שנתיות».';
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_n,
      'label', 'אוכלוסייה: אירועים שכבר התקיימו וסגורים תפעולית — פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום · הוצאו: אירועים שטרם התקיימו, אירועים בתהליך ואירועים מבוטלים · ' ||
        v_lri || 'n=' || to_char(v_n, 'FM999,999,999') || v_pdi || ' (מתוך ' || v_lri || to_char(v_projects_all, 'FM999,999,999') || v_pdi ||
        case when p_customer_id is null then ' אירועים במערכת).' else ' אירועים של הלקוח).' end,
      'excluded', jsonb_build_object(
        'אינם באחד מארבעת המצבים', v_excl_status,
        'מחוץ לחלון-התקופה', v_excl_window)
    ),
    'window', jsonb_build_object(
      'from', v_from, 'to', v_to,
      'label', v_lri || extract(year from v_to)::integer || v_pdi || ' (' ||
        v_lri || to_char(v_from, 'DD/MM') || '–' || to_char(v_to, 'DD/MM') || v_pdi || ') · ' ||
        coalesce(v_customer_name, 'כל הלקוחות')
    ),
    'tiles', jsonb_build_array(
      jsonb_build_object(
        'key', 'revenue', 'label', 'הכנסות מתחילת השנה', 'value', v_rev, 'format', 'money',
        'sub', v_lri || to_char(v_n, 'FM999,999,999') || v_pdi || ' אירועים שהסתיימו',
        'window', v_window_text,
        'compare', case when v_prev_rev = 0 then null else jsonb_build_object(
          'value', v_prev_rev,
          'label', 'אשתקד',
          'note', v_lri || to_char(v_prev_n, 'FM999,999,999') || v_pdi || ' אירועים',
          'direction', case when v_rev > v_prev_rev then 'up' when v_rev < v_prev_rev then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'הנהלה', 'report', 'report_m03_trends', 'drill', null)),
      jsonb_build_object(
        'key', 'margin', 'label', 'שולי-רווח גולמי', 'value', v_margin, 'format', 'percent',
        'sub', v_lri || to_char(round(v_prof), 'FM999,999,999') || ' ₪' || v_pdi || ' רווח מתוך ' ||
               v_lri || to_char(round(v_rev), 'FM999,999,999') || ' ₪' || v_pdi || ' הכנסה',
        'window', v_window_text,
        'compare', case when v_prev_margin is null then null else jsonb_build_object(
          'value', v_prev_margin,
          'label', 'אשתקד',
          'note', null,
          'direction', case when v_margin > v_prev_margin then 'up' when v_margin < v_prev_margin then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'הנהלה', 'report', 'report_m04_discounts', 'drill', null)),
      jsonb_build_object(
        'key', 'finished_events', 'label', 'אירועים שהסתיימו', 'value', v_n, 'format', 'int',
        'sub', 'ארבעת המצבים — פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום',
        'window', v_window_text,
        'compare', jsonb_build_object(
          'value', v_prev_n,
          'label', 'אשתקד',
          'note', null,
          'direction', case when v_n > v_prev_n then 'up' when v_n < v_prev_n then 'down' else 'flat' end),
        'target', jsonb_build_object('tab', 'כספים', 'report', 'report_m08_profitability', 'drill', null)),
      jsonb_build_object(
        'key', 'top5_share', 'label', 'נתח 5 הלקוחות הגדולים', 'value', v_top5_pct, 'format', 'percent',
        -- 📑ב (מבט-על הנהלה): המכנה גלוי, ולצידו תת-שורה בשקלים. בלעדיהם 45.5% הוא מספר בלי עולם.
        'sub', v_lri || to_char(round(v_top5), 'FM999,999,999') || ' ₪' || v_pdi || ' מתוך ' ||
               v_lri || to_char(round(v_total_rev), 'FM999,999,999') || ' ₪' || v_pdi || ' · אצל ' ||
               v_lri || to_char(v_ncust, 'FM999,999,999') || v_pdi || ' לקוחות עם הכנסה (מתוך ' || v_lri || to_char(v_customers_all, 'FM999,999,999') || v_pdi || ' רשומים)',
        -- ⑧ 2.4: בסיס אחר מיתר האריחים, **ומוצהר** — מדד-ריכוזיות על חתך של שמונה חודשים אינו מדד.
        'window', 'כל הזמנים · אינו מושפע ממסנן התקופה',
        'compare', case when v_prev_top5_pct is null then null else jsonb_build_object(
          'value', v_prev_top5_pct,
          'label', 'אשתקד',
          'note', 'אז ' || v_lri || to_char(v_prev_ncust, 'FM999,999,999') || v_pdi || ' לקוחות עם הכנסה',
          'direction', case when v_top5_pct > v_prev_top5_pct then 'up' when v_top5_pct < v_prev_top5_pct then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'לקוחות', 'report', 'report_m21_drifting', 'drill', null))
    ),
    'chart', jsonb_build_object(
      'type', 'bar',
      'title', 'הכנסה ורווח לפי חודש · ' || v_lri || extract(year from v_to)::integer || ' מול ' ||
               extract(year from v_prev_to)::integer || v_pdi,
      'series', jsonb_build_array(
        jsonb_build_object('key', 'revenue_cur', 'label', 'הכנסה ' || extract(year from v_to)::integer, 'kind', 'bar', 'axis', 'left', 'format', 'money'),
        -- 📐19 · 📑ב: סדרת-אשתקד היא המשמעות היחידה של `slate-400` בדף.
        jsonb_build_object('key', 'revenue_prev', 'label', 'הכנסה ' || extract(year from v_prev_to)::integer, 'kind', 'bar', 'axis', 'left', 'format', 'money'),
        -- ⑧ 2.1: הרווח כ**קו** ולא כעמודה שלישית — 27 עמודות בתשעה חודשים אינן נקראות.
        jsonb_build_object('key', 'profit_cur', 'label', 'רווח גולמי ' || extract(year from v_to)::integer, 'kind', 'line', 'axis', 'left', 'format', 'money')),
      'data', v_chart,
      -- 🔴 D2 · ציר-ה-X היה `month`, שהוא **תאריך-ISO**: `ChartCard` מעביר את `xKey` ישירות
      --    ל-`<XAxis dataKey>` הקטגוריאלי, ולכן על המסך התנוססו `2026-01-01` במקום «ינואר».
      --    השדה `month` נשאר בשורות (הוא המיון ומפתח-הנתונים); הציר עובר ל-`label` העברי.
      'xKey', 'label',
      'domain', null,
      'refLines', '[]'::jsonb,
      -- 🔴 D2 · `unit` אינו סימן-מטבע אלא **שם-פורמט**: `formatByType(v, unit)`
      --    (`src/lib/reportsFormat.js:121`) מחפש אותו במפת-הפורמטים, ו-`'₪'` אינו בה ⇒
      --    נופל ל-`text` ⇒ הטולטיפ וטבלת-קורא-המסך הציגו `237414.51` גולמי במקום `237,415 ₪`.
      'unit', 'money'
    ),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'event_name', 'label', 'אירוע', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'final_event_date', 'label', 'תאריך', 'format', 'date', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'format', 'money', 'align', 'end', 'sorted', 'desc'),
      jsonb_build_object('key', 'profit', 'label', 'רווח', 'format', 'money', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'format', 'percent', 'align', 'end', 'sorted', null)
    ),
    'rows', v_rows,
    'so_what', v_so_what,
    'definitions', 'שולי-רווח = סך הרווח הגולמי חלקי סך ההכנסה על כל האוכלוסייה יחד, לא ממוצע של אחוזים · רווח גולמי = הכנסה פחות עלויות ישירות (דיילות · ציוד · נסיעות); הוצאות המשרד אינן נכללות · נתח 5 הלקוחות הגדולים = הכנסת חמשת הגדולים חלקי הכנסת כל הלקוחות, על כל ההיסטוריה · "אשתקד" = אותם ימים בדיוק בשנה שעברה.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', '[]'::jsonb,
      -- 📑ב#1 · ⑧ G3: מ2 מציג `gross_profit` המחושב (ולא `coalesce(final_profit, …)`),
      -- וההצהרה כמה מהאירועים כבר ננעלו כספית נשארת גלויה.
      'frozen_count', v_frozen,
      'row_total', v_n,
      'notes', v_notes,
      'run', null,
      -- 🔴 D2 · **הקורא בפועל של המיון הוא `meta.sort`** ולא `columns[].sorted`:
      --    `ReportSurface.jsx:297` מעדיף `payload.meta?.sort`, ונופל ל-`sortFromColumns`
      --    שממפה כל ערך שאינו `'ascending'` ל-`'descending'` (שורה 110) — כלומר
      --    `sorted:'asc'` היה מכריז `aria-sort="descending"` על עמודה עולה. הכרזה מפורשת.
      'sort', jsonb_build_object('key', 'revenue', 'direction', 'descending'),
      -- C8 · תאומי E2/F2: הצהרה מפורשת במקום היעדר-מפתח.
      'customer_filter_ignored', false,
      'drill_echo', p_drill)
  );
end;
$function$;

comment on function public.report_m02_exec_overview(date, date, integer, jsonb) is
'מ11 · מבט-על הנהלה (בקרה). אוכלוסייה: אירועים שכבר התקיימו וסגורים תפעולית — finished · awaiting_payment · awaiting_invoice · event_finished (הכרעה 36) — עם final_event_date שאינו null. הוצאו: אירועים שטרם התקיימו, בתהליך ומבוטלים. חלון-לוח סגור [from, to] (§9 D-17), ברירת-מחדל השנה הקלנדרית עד היום בשעון ישראל. הכנסה ורווח גולמי נקראים מ-finance_project_money(); אין כאן חישוב-רווח שני. אריח "נתח 5 הלקוחות הגדולים" נמדד על כל ההיסטוריה ועל כל הלקוחות, ואינו מגיב למסנן-התקופה ולא למסנן-הלקוח (⑧ 2.4).';

revoke execute on function public.report_m02_exec_overview(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m02_exec_overview(date, date, integer, jsonb) to authenticated;

create or replace function public.report_m03_trends(
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
  v_statuses constant text[] :=
    array['finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished'];
  v_months_he constant text[] := array['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני',
    'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
  v_lri constant text := chr(8294);
  v_pdi constant text := chr(8297);
  v_today date := (now() at time zone 'Asia/Jerusalem')::date;
  v_to date;
  v_this_year integer;
  v_year integer;
  v_month integer;
  v_level integer := 0;
  v_pop_n integer;
  v_min_year integer;
  v_customer_name text;
  v_years jsonb;
  v_tiles jsonb;
  v_chart jsonb;
  v_columns jsonb;
  v_rows jsonb;
  v_row_total integer;
  v_so_what text;
  v_frozen integer;
  v_range_label text;
  v_crumbs jsonb;
  v_notes jsonb;
  v_sort jsonb;
  -- שנת-המוקד ושנת-ההשוואה, כסקלרים ולא כ-`record`: ‏plpgsql אינו מאפשר לכתוב לשדה של
  -- משתנה-`record` שטרם קיבל צורת-שורה, והרמות כאן ממלאות אותם בשלבים.
  v_y_year integer;   v_y_n integer;      v_y_rev numeric;   v_y_prof numeric;
  v_y_margin numeric; v_y_hours numeric;  v_y_price numeric; v_y_cost numeric;
  v_y_frozen integer;
  v_p_year integer;   v_p_n integer;      v_p_rev numeric;   v_p_prof numeric;
  v_p_margin numeric; v_p_hours numeric;  v_p_price numeric; v_p_cost numeric;
  v_m_n integer;      v_m_rev numeric;    v_m_prof numeric;  v_m_margin numeric;
  v_pm_n integer;     v_pm_rev numeric;   v_pm_prof numeric; v_pm_margin numeric;
begin
  perform public.assert_module_permission('כספים', array['edit', 'view']);

  -- ⑧ G5: הדף אינו מגיב למסנן-התקופה — `p_from` נזרק, `p_to` נשאר תקרת "נכון-לתאריך".
  v_to := coalesce(p_to, v_today);
  v_this_year := extract(year from v_to)::integer;
  v_notes := jsonb_build_array(
    'הדף אינו מגיב למסנן התקופה — הוא ציר-שנים בהגדרתו, ונמדד על כל ההיסטוריה עד התאריך הנוכחי.',
    'מקור-הרווח: רווח סופי היכן שקפא, אחרת רווח גולמי מחושב.');

  -- ⑦ מ3 · ⑨ מ3 — אימות פרמטר-הקידוח **בשרת** ולא רק בדפדפן, אחרת רמה-שלישית בכתובת
  -- הופכת לשאילתה חופשית. שנה בלי אירועים באוכלוסייה, או חודש מחוץ ל-1–12, מפילים
  -- לרמת-השורש **בלי מסך-שגיאה**.
  v_year  := nullif(p_drill ->> 'year', '')::integer;
  v_month := nullif(p_drill ->> 'month', '')::integer;
  if v_year is not null and not exists (
    select 1 from public.projects p
     where p.project_status = any (v_statuses)
       and p.final_event_date is not null
       and p.final_event_date <= v_to
       and extract(year from p.final_event_date)::integer = v_year
       and (p_customer_id is null or p.customer_id = p_customer_id)
  ) then
    v_year := null;
  end if;
  if v_year is null then
    v_month := null;
  elsif v_month is not null and (v_month < 1 or v_month > 12) then
    v_month := null;
  end if;
  v_level := case when v_year is null then 0 when v_month is null then 1 else 2 end;

  select c.company_name into v_customer_name
    from public.customers c where c.customer_id = p_customer_id;

  -- ── השכבה המשותפת: שנה אחר שנה, מעבר-lateral אחד ───────────────────────────
  with scoped as materialized (
    select p.project_id,
           extract(year from p.final_event_date)::integer yr,
           fm.revenue,
           coalesce(pf.final_profit, fm.gross_profit) profit,
           (pf.final_profit is not null) frozen
      from public.projects p
      left join public.project_finance pf on pf.project_id = p.project_id
      cross join lateral public.finance_project_money(p.project_id) fm
     where p.project_status = any (v_statuses)
       and p.final_event_date is not null
       and p.final_event_date <= v_to
       and (p_customer_id is null or p.customer_id = p_customer_id)
  ),
  labour as (
    -- 🔴 המפתח של `assignments` הוא שלישייה `(project_id, hostess_id, assignment_number)`;
    -- הצירוף כאן הוא `projects → assignments` בלבד (1:N) ואין בו קיפול פר-דיילת.
    -- ‏`actual_hours > 0` חותך את **שני** צדי השבר: שיבוץ בלי שעות אינו נספר במכנה ולא
    -- במונה, אחרת העלות-לשעה יורדת מלאכותית (⑦ מ3).
    select s.yr,
           sum(a.actual_hours) hrs,
           sum(a.actual_hours * a.hourly_rate_snapshot) wage,
           sum(coalesce(a.personal_bonus, 0)) bonus
      from scoped s
      join public.assignments a on a.project_id = s.project_id
     where a.actual_hours is not null and a.actual_hours > 0
     group by s.yr
  ),
  per_year as (
    select s.yr,
           count(*)::integer n,
           sum(s.revenue) rev,
           sum(s.profit) prof,
           count(*) filter (where s.frozen)::integer frozen,
           max(l.hrs) hrs,
           max(l.wage) wage,
           max(l.bonus) bonus
      from scoped s left join labour l on l.yr = s.yr
     group by s.yr
  )
  select jsonb_agg(jsonb_build_object(
           'year',            yr,
           'event_count',     n,
           'revenue',         rev,
           'profit',          prof,
           'margin',          100 * prof / nullif(rev, 0),
           'hours',           hrs,
           'price_per_hour',  rev / nullif(hrs, 0),
           'cost_per_hour',   (wage + bonus) / nullif(hrs, 0),
           'margin_per_hour', rev / nullif(hrs, 0) - (wage + bonus) / nullif(hrs, 0),
           'frozen',          frozen,
           -- 📑ב#1: השנה הרצה מסומנת חלקית — דפוס-מילוי שונה, ו**אין** קצב-שנתי מומצא.
           'partial',         yr = v_this_year,
           'drill_key',       jsonb_build_object('kind', 'year', 'year', yr)
         ) order by yr),
         sum(n)::integer,
         sum(frozen)::integer,
         min(yr)::integer
    into v_years, v_pop_n, v_frozen, v_min_year
    from per_year;

  v_years := coalesce(v_years, '[]'::jsonb);
  v_pop_n := coalesce(v_pop_n, 0);

  -- שנת-המוקד: ברמה 0 היא השנה הרצה, ברמה 1 השנה שנבחרה.
  select (e ->> 'year')::integer, (e ->> 'event_count')::integer, (e ->> 'revenue')::numeric,
         (e ->> 'profit')::numeric, (e ->> 'margin')::numeric, (e ->> 'hours')::numeric,
         (e ->> 'price_per_hour')::numeric, (e ->> 'cost_per_hour')::numeric, (e ->> 'frozen')::integer
    into v_y_year, v_y_n, v_y_rev, v_y_prof, v_y_margin, v_y_hours, v_y_price, v_y_cost, v_y_frozen
    from jsonb_array_elements(v_years) e
   where (e ->> 'year')::integer = coalesce(v_year, v_this_year);

  select (e ->> 'year')::integer, (e ->> 'event_count')::integer, (e ->> 'revenue')::numeric,
         (e ->> 'profit')::numeric, (e ->> 'margin')::numeric, (e ->> 'hours')::numeric,
         (e ->> 'price_per_hour')::numeric, (e ->> 'cost_per_hour')::numeric
    into v_p_year, v_p_n, v_p_rev, v_p_prof, v_p_margin, v_p_hours, v_p_price, v_p_cost
    from jsonb_array_elements(v_years) e
   where (e ->> 'year')::integer = coalesce(v_year, v_this_year) - 1;

  if v_level = 0 then
    -- ── רמה 0 · כל השנים ────────────────────────────────────────────────────
    v_range_label := v_lri || coalesce(v_min_year::text, '') || '–' || v_this_year || v_pdi ||
      ' · ' || coalesce(v_customer_name, 'כל הלקוחות');

    v_sort := jsonb_build_object('key', 'year', 'direction', 'ascending');
    v_tiles := jsonb_build_array(
      jsonb_build_object('key', 'price_per_hour', 'label', 'מחיר לשעה',
        'value', v_y_price, 'format', 'money',
        'sub', v_lri || to_char(round(coalesce(v_y_rev, 0)), 'FM999,999,999') || ' ₪' || v_pdi || ' ÷ ' ||
               v_lri || to_char(round(coalesce(v_y_hours, 0)), 'FM999,999') || v_pdi || ' שעות-בפועל',
        'window', 'שנת ' || v_lri || v_this_year || v_pdi || ' עד ' || v_lri || to_char(v_to, 'DD/MM') || v_pdi,
        'compare', case when v_p_price is null then null else jsonb_build_object(
          'value', v_p_price, 'label', v_lri || v_p_year || v_pdi, 'note', null,
          'direction', case when v_y_price > v_p_price then 'up'
                            when v_y_price < v_p_price then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'cost_per_hour', 'label', 'עלות לשעה',
        'value', v_y_cost, 'format', 'money',
        'sub', 'שכר הדיילות ובונוסים אישיים ÷ אותן ' ||
               v_lri || to_char(round(coalesce(v_y_hours, 0)), 'FM999,999') || v_pdi ||
               ' שעות · נסיעות אינן נכללות',
        'window', 'שנת ' || v_lri || v_this_year || v_pdi || ' עד ' || v_lri || to_char(v_to, 'DD/MM') || v_pdi,
        'compare', case when v_p_cost is null then null else jsonb_build_object(
          'value', v_p_cost, 'label', v_lri || v_p_year || v_pdi, 'note', null,
          'direction', case when v_y_cost > v_p_cost then 'up'
                            when v_y_cost < v_p_cost then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח',
        'value', v_y_margin, 'format', 'percent',
        'sub', v_lri || to_char(round(coalesce(v_y_prof, 0)), 'FM999,999,999') || ' ₪' || v_pdi ||
               ' רווח מתוך ' || v_lri || to_char(round(coalesce(v_y_rev, 0)), 'FM999,999,999') || ' ₪' || v_pdi,
        'window', 'שנת ' || v_lri || v_this_year || v_pdi || ' עד ' || v_lri || to_char(v_to, 'DD/MM') || v_pdi,
        'compare', case when v_p_margin is null then null else jsonb_build_object(
          'value', v_p_margin, 'label', v_lri || v_p_year || v_pdi || ' המלאה', 'note', null,
          'direction', case when v_y_margin > v_p_margin then 'up'
                            when v_y_margin < v_p_margin then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'finished_events', 'label', 'אירועים שהסתיימו',
        'value', v_y_n, 'format', 'int',
        'sub', 'בכל השנים יחד: ' || v_lri || to_char(v_pop_n, 'FM999,999,999') || v_pdi,
        'window', v_lri || to_char(date_trunc('year', v_to)::date, 'DD/MM') || '–' ||
                  to_char(v_to, 'DD/MM/YYYY') || v_pdi,
        'compare', case when v_p_n is null then null else jsonb_build_object(
          'value', v_p_n, 'label', v_lri || v_p_year || v_pdi || ' המלאה', 'note', null,
          'direction', case when v_y_n > v_p_n then 'up' when v_y_n < v_p_n then 'down' else 'flat' end) end,
        'target', null));

    -- ✏️ I2 · ההערה שעמדה כאן אמרה *"שני גרפים ולא שלושה … ותקרת C8 היא שני
    --    גרפים לדף"* — **ושתי הרגליים שלה נפלו מאז:** `CHART_CAP` עלה ל-4
    --    (`api.js:132`, D-28), והמוקאפ המאושר אומר במילים שהפיצול לשני לוחות
    --    הוא בדיוק מה שנדרש. הערה שסותרת את הקוד שמתחתיה גרועה מאין-הערה.
    v_chart := jsonb_build_array(
      jsonb_build_object(
        'type', 'bar', 'title', 'הכנסה, רווח ושולי-רווח לפי שנה',
        'series', jsonb_build_array(
          jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'kind', 'bar', 'axis', 'left', 'format', 'money'),
          jsonb_build_object('key', 'profit', 'label', 'רווח גולמי', 'kind', 'bar', 'axis', 'left', 'format', 'money'),
          -- §5.2 #15: ציר-האחוזים נעול 0–100, אחרת תנודה של נקודה וחצי נראית כמפולת.
          jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'kind', 'line', 'axis', 'right', 'format', 'percent')),
        -- 🔴 D2 · `domain` היה `[0,100]` — והוא **לא** נעילת-ציר-האחוזים של ⑧ 3.4:
        --    `ChartCard.BarBody` מחזיק ציר-Y **אחד** ומעביר לו את `domain` (שורה 402), ולכן
        --    עמודות של 1.9 מיליון ₪ נחתכו לתקרה 100 — גרף ריק על המסך, בלי שגיאה. נעילת
        --    ה-0–100 שייכת לציר-הימני, והיא קבועה ברכיב (כמו ב-`ParetoBody`), לא במטען.
        --    ⚠️ הציר-השני עצמו עדיין אינו מרונדר — `BarBody` מתעלם מ-`series[].kind/.axis`;
        --    זה פגם-רכיב שדווח לבונה-הלשונית ואינו ניתן לתיקון מתוך מיגרציה.
        'data', v_years, 'xKey', 'year', 'domain', null,
        'refLines', '[]'::jsonb, 'unit', 'money'),
      jsonb_build_object(
        -- 🪤 I2 · **שלוש סדרות-₪ בשני סדרי-גודל על ציר אחד** — מחיר 254–305,
        --    עלות 44–47 ⇒ עקומת-העלות נמעכת לקו שטוח. **והמוקאפ המאושר אומר
        --    בדיוק את זה, במילים שלו:** "שני צירים נפרדים בכוונה, וכל אחד מתחיל
        --    באפס … איור שלהם על ציר אחד היה מצייר את העלות כקו שטוח"
        --    (`02_tab_executive_approved.html:657-659`, לוחות `מחיר לשעה (₪)`
        --    ו-`עלות לשעה (₪)`). ⇒ שני אובייקטי-גרף.
        --    **המרווח יושב עם המחיר ואינו נמחק** — במיגרציה הזו שום מפתח אינו
        --    נמחק, וסדר-הגודל שלו (209–258) הוא של המחיר ולא של העלות.
        -- 🔑 **"מאפס" אינו מפתח חדש — נמדד:** `valueDomain(null)` מחזיר
        --    ‏`[0,'auto']` (`ChartCard.jsx:200-202`), ולכן `domain: null` **הוא** הציר המאפס.
        -- ✅ `CHART_CAP` = 4 (`api.js:132`, D-28) ⇒ שלושה גרפים ברמה 0 נכנסים.
        'type', 'line', 'title', 'מחיר לשעה ומרווח לשעה, לפי שנה',
        'series', jsonb_build_array(
          jsonb_build_object('key', 'price_per_hour', 'label', 'מחיר לשעה', 'kind', 'line', 'axis', 'left', 'format', 'money'),
          jsonb_build_object('key', 'margin_per_hour', 'label', 'מרווח לשעה', 'kind', 'line', 'axis', 'left', 'format', 'money')),
        'data', v_years, 'xKey', 'year', 'domain', null,
        'refLines', '[]'::jsonb, 'unit', 'money'),
      jsonb_build_object(
        -- לוח-העלות, עם ציר משלו — זה כל העניין של הפיצול.
        'type', 'line', 'title', 'עלות לשעה, לפי שנה',
        'series', jsonb_build_array(
          jsonb_build_object('key', 'cost_per_hour', 'label', 'עלות לשעה', 'kind', 'line', 'axis', 'left', 'format', 'money')),
        'data', v_years, 'xKey', 'year', 'domain', null,
        'refLines', '[]'::jsonb, 'unit', 'money'));

    v_columns := jsonb_build_array(
      -- 🪤 I1 · שנה אינה כמות: `int` מרנדר `Math.round(n).toLocaleString('he-IL')`
      --    (`reportsFormat.js`) ⇒ העמודה הציגה `2,024`. ‏`text` מחזיר את הספרות כמות-שהן.
      --    **הערך בשורה נשאר מספר** — רק ההכרזה משתנה. זו העמודה היחידה של שנה
      --    בשלוש הרמות (רמה 1 ממוינת ב-`label` החודש, רמה 2 ב-`final_event_date` שכבר `date`).
      jsonb_build_object('key', 'year', 'label', 'שנה', 'format', 'text', 'align', 'start', 'sorted', 'asc'),
      jsonb_build_object('key', 'event_count', 'label', 'אירועים', 'format', 'int', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'format', 'money', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'profit', 'label', 'רווח', 'format', 'money', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'format', 'percent', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'price_per_hour', 'label', 'מחיר לשעה', 'format', 'money', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'cost_per_hour', 'label', 'עלות לשעה', 'format', 'money', 'align', 'end', 'sorted', null));
    v_rows := v_years;
    v_row_total := jsonb_array_length(v_years);
    v_crumbs := jsonb_build_array(jsonb_build_object('label', 'כל השנים', 'drill', null));

    -- 📐23 · אסטרטגי ⇒ *"לשים לב ש…"*, **והכיוון נמדד ולא מוקלד**: דף שאומר "המחיר עלה
    -- מהר מהעלות" בשנה שבה קרה ההפך הוא שקר על המסך.
    v_so_what := case
      when v_p_price is null or v_y_price is null then
        'לשים לב שאין שנה קודמת למדוד מולה — מחיר לשעה ' ||
        v_lri || to_char(round(coalesce(v_y_price, 0)), 'FM999,999,999') || ' ₪' || v_pdi ||
        ' מול עלות לשעה ' ||
        v_lri || to_char(round(coalesce(v_y_cost, 0)), 'FM999,999,999') || ' ₪' || v_pdi || '.'
      when v_y_price / nullif(v_p_price, 0) >= v_y_cost / nullif(v_p_cost, 0) then
        'לשים לב שהמחיר לשעה עלה מהר מהעלות — מ-' ||
        v_lri || to_char(round(v_p_price), 'FM999,999,999') || ' ₪' || v_pdi || ' ל-' ||
        v_lri || to_char(round(v_y_price), 'FM999,999,999') || ' ₪' || v_pdi ||
        ' לשעה, מול עלייה מ-' || v_lri || to_char(round(v_p_cost), 'FM999,999,999') || ' ₪' || v_pdi ||
        ' ל-' || v_lri || to_char(round(v_y_cost), 'FM999,999,999') || ' ₪' || v_pdi ||
        ' בעלות; זו הסיבה ששולי-הרווח עמדו על ' ||
        v_lri || to_char(round(v_y_margin, 1), 'FM990.0') || '%' || v_pdi || '.'
      else
        'לשים לב שהעלות לשעה עולה מהר מהמחיר — מ-' ||
        v_lri || to_char(round(v_p_cost), 'FM999,999,999') || ' ₪' || v_pdi || ' ל-' ||
        v_lri || to_char(round(v_y_cost), 'FM999,999,999') || ' ₪' || v_pdi ||
        ', בעוד המחיר לשעה עלה מ-' || v_lri || to_char(round(v_p_price), 'FM999,999,999') || ' ₪' || v_pdi ||
        ' ל-' || v_lri || to_char(round(v_y_price), 'FM999,999,999') || ' ₪' || v_pdi ||
        '; שולי-הרווח עמדו על ' || v_lri || to_char(round(v_y_margin, 1), 'FM990.0') || '%' || v_pdi || '.'
    end;

  elsif v_level = 1 then
    -- ── רמה 1 · חודשי שנה אחת ───────────────────────────────────────────────
    with scoped as materialized (
      select extract(year from p.final_event_date)::integer yr,
             extract(month from p.final_event_date)::integer mo,
             fm.revenue, coalesce(pf.final_profit, fm.gross_profit) profit
        from public.projects p
        left join public.project_finance pf on pf.project_id = p.project_id
        cross join lateral public.finance_project_money(p.project_id) fm
       where p.project_status = any (v_statuses)
         and p.final_event_date is not null
         and p.final_event_date <= v_to
         and extract(year from p.final_event_date)::integer in (v_year, v_year - 1)
         and (p_customer_id is null or p.customer_id = p_customer_id)
    ),
    per_month as (
      select mo, count(*)::integer n, sum(revenue) rev, sum(profit) prof
        from scoped where yr = v_year group by mo
    ),
    prev_month as (
      select mo, sum(revenue) rev from scoped where yr = v_year - 1 group by mo
    ),
    axis as (
      select generate_series(1, case when v_year = v_this_year
                                     then extract(month from v_to)::integer else 12 end) mo
    )
    select jsonb_agg(jsonb_build_object(
             'month',        a.mo,
             'label',        v_months_he[a.mo],
             'event_count',  coalesce(c.n, 0),
             'revenue',      coalesce(c.rev, 0),
             'profit',       coalesce(c.prof, 0),
             'margin',       100 * c.prof / nullif(c.rev, 0),
             'revenue_prev', pv.rev,
             -- ④ מ3 (א): חודש שכולו אפס **מצויר** ואינו נעלם מהסדרה.
             'partial',      v_year = v_this_year and a.mo = extract(month from v_to)::integer,
             'drill_key',    jsonb_build_object('kind', 'month', 'year', v_year, 'month', a.mo)
           ) order by a.mo)
      into v_rows
      from axis a
      left join per_month c on c.mo = a.mo
      left join prev_month pv on pv.mo = a.mo;

    v_rows := coalesce(v_rows, '[]'::jsonb);
    v_row_total := jsonb_array_length(v_rows);
    v_frozen := v_y_frozen;
    v_range_label := v_lri || v_year || v_pdi ||
      case when v_year = v_this_year
           then ' (שנה חלקית, עד ' || v_lri || to_char(v_to, 'DD/MM') || v_pdi || ')' else '' end ||
      ' · ' || coalesce(v_customer_name, 'כל הלקוחות');

    v_tiles := jsonb_build_array(
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה בשנה', 'value', v_y_rev, 'format', 'money',
        'sub', v_lri || to_char(v_y_n, 'FM999,999,999') || v_pdi || ' אירועים',
        'window', 'שנת ' || v_lri || v_year || v_pdi,
        'compare', case when v_p_rev is null then null else jsonb_build_object(
          'value', v_p_rev, 'label', v_lri || (v_year - 1) || v_pdi || ' המלאה', 'note', null,
          'direction', case when v_y_rev > v_p_rev then 'up' when v_y_rev < v_p_rev then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'profit', 'label', 'רווח גולמי בשנה', 'value', v_y_prof, 'format', 'money',
        'sub', 'מתוך ' || v_lri || to_char(round(coalesce(v_y_rev, 0)), 'FM999,999,999') || ' ₪' || v_pdi || ' הכנסה',
        'window', 'שנת ' || v_lri || v_year || v_pdi,
        'compare', case when v_p_prof is null then null else jsonb_build_object(
          'value', v_p_prof, 'label', v_lri || (v_year - 1) || v_pdi || ' המלאה', 'note', null,
          'direction', case when v_y_prof > v_p_prof then 'up' when v_y_prof < v_p_prof then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח בשנה', 'value', v_y_margin, 'format', 'percent',
        'sub', 'סך הרווח חלקי סך ההכנסה בשנה',
        'window', 'שנת ' || v_lri || v_year || v_pdi,
        'compare', case when v_p_margin is null then null else jsonb_build_object(
          'value', v_p_margin, 'label', v_lri || (v_year - 1) || v_pdi, 'note', null,
          'direction', case when v_y_margin > v_p_margin then 'up' when v_y_margin < v_p_margin then 'down' else 'flat' end) end,
        'target', null),
      -- 🪤 I2 · **תעריפי-שעה בשקלים שלמים** (📐4 — ₪ בלי אגורות) —
      --    אותה הכרעה של קו-הייחוס במ16. התא הזה הדפיס `305.1 ₪ / 47.4 ₪`,
      --    ושורת-"אז מה" הדפיסה `47.4 ₪` ליד טבלה שמדפיסה שלמים.
      --    **הערכים הגולמיים ב-`tiles[].value` וב-`rows[]` לא זזו** — רק הטקסט.
      jsonb_build_object('key', 'price_vs_cost', 'label', 'מחיר לשעה מול עלות לשעה',
        -- 🏷️ אריח מורכב: שני מספרים בתא אחד ⇒ `format` הוא `text` והערך נבנה כאן.
        'value', case when v_y_price is null then null else
                 v_lri || to_char(round(v_y_price), 'FM999,999,999') || ' ₪ / ' ||
                 to_char(round(coalesce(v_y_cost, 0)), 'FM999,999,999') || ' ₪' || v_pdi end,
        'format', 'text',
        'sub', v_lri || to_char(round(coalesce(v_y_hours, 0)), 'FM999,999') || v_pdi || ' שעות-בפועל בשנה',
        'window', 'שנת ' || v_lri || v_year || v_pdi,
        -- 🪤 I1 · האריח הזה הוא `text` (שני מספרים בתא אחד), אבל **חצי-ההשוואה שלו הוא כסף**
        --    יחיד. ‏`CompareLine` נופל ל-`tile.format` כשאין `compare.format` (`KpiTile.jsx`)
        --    ⇒ המסך הציג `259.7790478394169` גולמי. ההכרזה המפורשת היא התיקון (תוספת C8).
        'compare', case when v_p_price is null then null else jsonb_build_object(
          'value', v_p_price, 'format', 'money', 'label', v_lri || (v_year - 1) || v_pdi || ': מחיר לשעה',
          'note', 'עלות לשעה ' || v_lri || to_char(round(coalesce(v_p_cost, 0)), 'FM999,999,999') || ' ₪' || v_pdi,
          'direction', case when v_y_price > v_p_price then 'up'
                            when v_y_price < v_p_price then 'down' else 'flat' end) end,
        'target', null));

    v_chart := jsonb_build_object(
      'type', 'bar', 'title', 'הכנסה ורווח לפי חודש · ' || v_lri || v_year || v_pdi,
      'series', jsonb_build_array(
        jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'kind', 'bar', 'axis', 'left', 'format', 'money'),
        jsonb_build_object('key', 'profit', 'label', 'רווח גולמי', 'kind', 'bar', 'axis', 'left', 'format', 'money'),
        jsonb_build_object('key', 'revenue_prev', 'label', 'הכנסה ' || (v_year - 1), 'kind', 'bar', 'axis', 'left', 'format', 'money')),
      'data', v_rows, 'xKey', 'label', 'domain', null, 'refLines', '[]'::jsonb, 'unit', 'money');

    v_columns := jsonb_build_array(
      jsonb_build_object('key', 'label', 'label', 'חודש', 'format', 'text', 'align', 'start', 'sorted', 'asc'),
      jsonb_build_object('key', 'event_count', 'label', 'אירועים', 'format', 'int', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'format', 'money', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'profit', 'label', 'רווח', 'format', 'money', 'align', 'end', 'sorted', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'format', 'percent', 'align', 'end', 'sorted', null));
    v_crumbs := jsonb_build_array(
      jsonb_build_object('label', 'כל השנים', 'drill', null),
      jsonb_build_object('label', v_lri || v_year || v_pdi, 'drill', jsonb_build_object('year', v_year)));
    v_sort := jsonb_build_object('key', 'label', 'direction', 'ascending');

    v_so_what := 'לשים לב ששולי-הרווח ב-' || v_lri || v_year || v_pdi || ' עמדו על ' ||
      v_lri || to_char(round(coalesce(v_y_margin, 0), 1), 'FM990.0') || '%' || v_pdi || ' על ' ||
      v_lri || to_char(coalesce(v_y_n, 0), 'FM999,999,999') || v_pdi || ' אירועים, עם מחיר לשעה של ' ||
      v_lri || to_char(round(coalesce(v_y_price, 0)), 'FM999,999,999') || ' ₪' || v_pdi ||
      ' מול עלות לשעה של ' ||
      v_lri || to_char(round(coalesce(v_y_cost, 0)), 'FM999,999,999') || ' ₪' || v_pdi || '.';

  else
    -- ── רמה 2 · אירועי חודש אחד ─────────────────────────────────────────────
    -- §7.98 נועל 50 שורות לעמוד; הפאג'ר סופר את **כל** אירועי החודש (📐8 · ⑧ 3.3).
    with scoped as materialized (
      select p.project_id, p.event_name, p.customer_id, p.final_event_date,
             extract(year from p.final_event_date)::integer yr,
             fm.revenue, coalesce(pf.final_profit, fm.gross_profit) profit
        from public.projects p
        left join public.project_finance pf on pf.project_id = p.project_id
        cross join lateral public.finance_project_money(p.project_id) fm
       where p.project_status = any (v_statuses)
         and p.final_event_date is not null
         and p.final_event_date <= v_to
         and extract(year from p.final_event_date)::integer in (v_year, v_year - 1)
         and extract(month from p.final_event_date)::integer = v_month
         and (p_customer_id is null or p.customer_id = p_customer_id)
    ),
    cur as (select * from scoped where yr = v_year),
    prev as (select * from scoped where yr = v_year - 1)
    select coalesce((select jsonb_agg(jsonb_build_object(
             'project_id',       t.project_id,
             'event_name',       t.event_name,
             'customer_name',    cu.company_name,
             'final_event_date', t.final_event_date,
             'revenue',          t.revenue,
             'margin',           100 * t.profit / nullif(t.revenue, 0),
             'drill_key',        jsonb_build_object('kind', 'project', 'id', t.project_id)
           ) order by t.revenue desc, t.project_id)
           from (select * from cur order by revenue desc, project_id limit 50) t
           left join public.customers cu on cu.customer_id = t.customer_id), '[]'::jsonb),
           (select count(*)::integer from cur),
           (select coalesce(sum(revenue), 0) from cur),
           (select coalesce(sum(profit), 0) from cur),
           (select count(*)::integer from prev),
           (select coalesce(sum(revenue), 0) from prev),
           (select coalesce(sum(profit), 0) from prev)
      into v_rows, v_m_n, v_m_rev, v_m_prof, v_pm_n, v_pm_rev, v_pm_prof;

    v_m_margin  := 100 * v_m_prof / nullif(v_m_rev, 0);
    v_pm_margin := 100 * v_pm_prof / nullif(v_pm_rev, 0);
    v_row_total := v_m_n;
    v_frozen := null;
    v_range_label := v_months_he[v_month] || ' ' || v_lri || v_year || v_pdi || ' · ' ||
      coalesce(v_customer_name, 'כל הלקוחות');

    -- 📐1 · ④ מ3 (ב): חודש בלי מקבילה אינו "—" — הוא **משפט**, כי "—" פירושו "אין שינוי".
    v_tiles := jsonb_build_array(
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה בחודש', 'value', v_m_rev, 'format', 'money',
        'sub', v_lri || to_char(v_m_n, 'FM999,999,999') || v_pdi || ' אירועים',
        'window', v_months_he[v_month] || ' ' || v_lri || v_year || v_pdi,
        'compare', case when v_pm_n = 0 then null else jsonb_build_object(
          'value', v_pm_rev, 'label', v_months_he[v_month] || ' ' || v_lri || (v_year - 1) || v_pdi, 'note', null,
          'direction', case when v_m_rev > v_pm_rev then 'up' when v_m_rev < v_pm_rev then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'profit', 'label', 'רווח גולמי בחודש', 'value', v_m_prof, 'format', 'money',
        'sub', 'מתוך ' || v_lri || to_char(round(v_m_rev), 'FM999,999,999') || ' ₪' || v_pdi || ' הכנסה',
        'window', v_months_he[v_month] || ' ' || v_lri || v_year || v_pdi,
        'compare', case when v_pm_n = 0 then null else jsonb_build_object(
          'value', v_pm_prof, 'label', v_months_he[v_month] || ' ' || v_lri || (v_year - 1) || v_pdi, 'note', null,
          'direction', case when v_m_prof > v_pm_prof then 'up' when v_m_prof < v_pm_prof then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח בחודש', 'value', v_m_margin, 'format', 'percent',
        'sub', 'סך הרווח חלקי סך ההכנסה בחודש',
        'window', v_months_he[v_month] || ' ' || v_lri || v_year || v_pdi,
        'compare', case when v_pm_margin is null then null else jsonb_build_object(
          'value', v_pm_margin, 'label', v_months_he[v_month] || ' ' || v_lri || (v_year - 1) || v_pdi, 'note', null,
          'direction', case when v_m_margin > v_pm_margin then 'up' when v_m_margin < v_pm_margin then 'down' else 'flat' end) end,
        'target', null),
      jsonb_build_object('key', 'event_count', 'label', 'אירועים בחודש', 'value', v_m_n, 'format', 'int',
        'sub', 'אירועים שהסתיימו',
        'window', v_months_he[v_month] || ' ' || v_lri || v_year || v_pdi,
        'compare', case when v_pm_n = 0 then null else jsonb_build_object(
          'value', v_pm_n, 'label', v_months_he[v_month] || ' ' || v_lri || (v_year - 1) || v_pdi, 'note', null,
          'direction', case when v_m_n > v_pm_n then 'up' when v_m_n < v_pm_n then 'down' else 'flat' end) end,
        'target', null));

    if v_pm_n = 0 then
      v_notes := v_notes || to_jsonb(
        ('אין חודש מקביל למדוד מולו — ' || v_months_he[v_month] || ' ' || (v_year - 1) ||
         ' ריק באוכלוסייה. זו אינה "אין שינוי", ולכן לא נכתב "—".')::text);
    end if;

    v_chart := null;
    v_columns := jsonb_build_array(
      jsonb_build_object('key', 'event_name', 'label', 'אירוע', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'customer_name', 'label', 'לקוח', 'format', 'text', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'final_event_date', 'label', 'תאריך', 'format', 'date', 'align', 'start', 'sorted', null),
      jsonb_build_object('key', 'revenue', 'label', 'הכנסה', 'format', 'money', 'align', 'end', 'sorted', 'desc'),
      jsonb_build_object('key', 'margin', 'label', 'שולי-רווח', 'format', 'percent', 'align', 'end', 'sorted', null));
    v_crumbs := jsonb_build_array(
      jsonb_build_object('label', 'כל השנים', 'drill', null),
      jsonb_build_object('label', v_lri || v_year || v_pdi, 'drill', jsonb_build_object('year', v_year)),
      jsonb_build_object('label', v_months_he[v_month] || ' ' || v_lri || v_year || v_pdi,
                         'drill', jsonb_build_object('year', v_year, 'month', v_month)));
    v_sort := jsonb_build_object('key', 'revenue', 'direction', 'descending');

    v_so_what := 'לשים לב ששולי-הרווח ב' || v_months_he[v_month] || ' ' || v_lri || v_year || v_pdi ||
      ' עמדו על ' || v_lri || to_char(round(coalesce(v_m_margin, 0), 1), 'FM990.0') || '%' || v_pdi ||
      ' על ' || v_lri || to_char(v_m_n, 'FM999,999,999') || v_pdi || ' אירועים' ||
      case when v_pm_margin is null then '.'
           else ', מול ' || v_lri || to_char(round(v_pm_margin, 1), 'FM990.0') || '%' || v_pdi ||
                ' באותו חודש אשתקד.' end;
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_pop_n,
      'label', 'אוכלוסייה: אירועים שכבר התקיימו וסגורים תפעולית — פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום · הוצאו: אירועים שטרם התקיימו, אירועים בתהליך ואירועים מבוטלים · ' ||
        v_lri || 'n=' || to_char(v_pop_n, 'FM999,999,999') || v_pdi || ' בכל השנים. השנה הנוכחית חלקית — עד ' ||
        v_lri || to_char(v_to, 'DD/MM') || v_pdi || ' — ואינה ברת-השוואה לשנים מלאות.',
      'excluded', jsonb_build_object(
        -- 🔴 D2 · מסונן לפי הלקוח, כמו `n` עצמו (ר' ההנמקה במ2).
        'אינם באחד מארבעת המצבים',
        (select count(*)::integer from public.projects
          where not (project_status = any (v_statuses))
            and (p_customer_id is null or customer_id = p_customer_id)))
    ),
    'window', jsonb_build_object('from', null, 'to', v_to, 'label', v_range_label),
    'tiles', v_tiles,
    'chart', v_chart,
    'columns', v_columns,
    'rows', v_rows,
    'so_what', v_so_what,
    'definitions', 'שנה = השנה שבה התקיים האירוע, לא זו שבה נשלחה החשבונית · מחיר לשעה = כל הכנסת השנה חלקי כל שעות-העבודה שדווחו בה · עלות לשעה = שכר-הבסיס והבונוסים האישיים חלקי אותן שעות; נסיעות אינן נכללות, כי הן סכום קבוע למשמרת ולא תשלום לפי שעה · מרווח לשעה = מחיר לשעה פחות עלות לשעה · רווח = הרווח שקפא בסגירה הכספית היכן שקפא, אחרת הרווח שהמערכת מחשבת עכשיו.',
    'drill', jsonb_build_object(
      'level', v_level,
      'levels', jsonb_build_array('כל השנים', 'שנה', 'חודש'),
      'crumbs', v_crumbs,
      'echo', p_drill),
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', '[]'::jsonb,
      'frozen_count', v_frozen,
      'row_total', v_row_total,
      'notes', v_notes,
      'run', null,
      -- 🔴 D2 · ר' ההנמקה במ2: `meta.sort` הוא הקורא בפועל, ו-`sorted:'asc'` של רמה 0/1
      --    היה מתורגם ל-`aria-sort="descending"` על עמודה עולה.
      'sort', v_sort,
      'customer_filter_ignored', false,
      'drill_echo', p_drill)
  );
end;
$function$;

comment on function public.report_m03_trends(date, date, integer, jsonb) is
'מ11 · מגמות רב-שנתיות (אסטרטגי, דוח-קידוח שנה←חודש←אירוע). אוכלוסייה: אותם ארבעה סטטוסים של הכרעה 36 עם final_event_date שאינו null, בכל השנים עד p_to (ברירת-מחדל היום בשעון ישראל). p_from מתעלמים ממנו — הדף הוא ציר-שנים בהגדרתו (⑧ G5). הרווח כאן הוא coalesce(final_profit, gross_profit) — ולא gross_profit לבדו כמו במ2 (📑#1). עלות-לשעה = (שכר-בסיס + בונוסים אישיים) ÷ שעות-בפועל, על שיבוצים עם actual_hours > 0 בלבד; נסיעות אינן נכללות (⑧ G6). p_drill פגום נופל לרמת-השורש בלי מסך-שגיאה.';

revoke execute on function public.report_m03_trends(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m03_trends(date, date, integer, jsonb) to authenticated;

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
  v_months_he    constant text[] := array['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני',
    'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
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
           -- 🪤 J2 · **ציר-החודשים הדפיס `09/2025`** בעוד מ19 מדפיס 'ינואר ⁦2026⁩'
           --    ומ14 הדפיס `2025-09` — שלוש צורות לאותו מושג. הצורה שנשארת:
           --    **שם-חודש עברי**, ‏+ שנה כשהציר חוצה יותר משנה אחת
           --    (כאן: 12 נקודות אחורה ⇒ תמיד). ‏`month` נשאר **מפתח-מכונה**
           --    ו-`label` הוא מה שהעין קוראת — בדיוק התבנית של מ19/מ3
           --    (`xKey` מצביע על `label`). שום מפתח לא נמחק.
           'month', to_char(asof, 'MM/YYYY'),
           'label', v_months_he[extract(month from asof)::integer]
                    || ' ' || v_lri || to_char(asof, 'YYYY') || v_pdi,
           'asof', asof, 'is_today', is_today,
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
      -- 🪤 I1 · **`chart.unit` הוא שם-פורמט של C8, לא מחרוזת-תצוגה.**
      --    ‏`ChartCard.valueFormat` מחזיר `series[0].format ?? unit` ומזין את
      --    ‏`formatAxisTick`, ו-`HebrewTooltip` מזין את `formatByType` — שניהם מצפים
      --    ל-`money|percent|int|ratio|score|days|text|date`. מחרוזת-תצוגה היא **פורמט
      --    לא-מוכר** ⇒ הציר נופל לקיבוץ-אלפים חשוף והטולטיפ ל-`text`.
      --    הכיתוב העברי נשמר ב-`unit_label` (תוספתי; **אין לו קורא היום** — מדווח).
      'series', jsonb_build_array(jsonb_build_object('key', 'open_amount', 'label', 'יתרת-חוב פתוחה',
                                                    'format', 'money')),
      'data', coalesce(v_series, '[]'::jsonb), 'xKey', 'label',
      'domain', null, 'refLines', '[]'::jsonb, 'unit', 'money'),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'project_id', 'label', 'פרויקט', 'format', 'id', 'align', 'start'),
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
  -- 🪤 J2 · שני הקבועים האלה **לא היו בפונקציה הזו כלל** — היא היחידה
  --    בקובץ שכתבה רצפי-ספרות בתוך עברית בלי בידוד. הם נוספים כאן
  --    עבור תווית-החודש בלבד (ר' הגרף למטה), ולא כדי לשכתב את שאר
  --    המשפטים — זה סבב אחר, והוא מדווח.
  v_lri         constant text := chr(8294);   -- U+2066 LRI
  v_pdi         constant text := chr(8297);   -- U+2069 PDI
  v_months_he   constant text[] := array['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני',
                                         'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
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
                 -- 🪤 J2 · **הציר הדפיס `2025-09` — צורת-מכונה על מסך של מנהלת.**
                 --    ‏`month` נשאר המפתח (וגם מפתח-המיון של `jsonb_agg` מתחת),
                 --    ו-`label` הוא שם-החודש העברי + שנה — החלון כאן הוא 12
                 --    חודשים ולכן הוא **תמיד** חוצה שתי שנים, והשנה אינה מיותרת.
                 'month',   to_char(date_trunc('month', event_date), 'YYYY-MM'),
                 'label',   v_months_he[extract(month from date_trunc('month', event_date))::integer]
                            || ' ' || v_lri || to_char(date_trunc('month', event_date), 'YYYY') || v_pdi,
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
        -- 🪤 J2 · המשפט הזה יושב **מתחת לאותו גרף** ואמר `09/2025` בזמן
        --    שהציר מעליו אומר 'ספטמבר ⁦2025⁩'. אותה צורה, אותו מסך.
        select v_months_he[extract(month from date_trunc('month', event_date))::integer]
               || ' ' || v_lri || to_char(date_trunc('month', event_date), 'YYYY') || v_pdi as m, count(*) as c
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
      -- 🪤 I1 · **מחלקת-הכמות עוברת דרך `to_char` בלי קשר לגודל.** H2 טיפלה ברצפי
      --    4+ ספרות בלבד, ולכן ארבעת מוני-ההוצאה וספירת-הדיילות נשארו חשופים.
      --    השינוי הוא **no-op על הערכים היום** (כולם תלת-ספרתיים ומטה) — והוא מונע
      --    מהמספר הבא שיעבור אלף להופיע כ-`1234` באותו משפט שבו `1,234` כבר נכון.
               to_char(coalesce(v_pop_n, 0), 'FM999,999,999') || ' שיבוצים אצל ' || to_char(coalesce(v_pop_hosts, 0), 'FM999,999,999') ||
               ' דיילות · הוצאו: ' || to_char(coalesce((v_excluded->>'היעדרות באישור מראש ומחלה')::integer, 0), 'FM999,999,999') ||
               ' היעדרויות באישור מראש ומחלה (לא נספרות לא במונה ולא במכנה) · ' ||
               to_char(coalesce((v_excluded->>'סירובים')::integer, 0), 'FM999,999,999') || ' סירובים · ' ||
               to_char(coalesce((v_excluded->>'זימונים שלא נענו')::integer, 0), 'FM999,999,999') || ' זימונים שלא נענו · ' ||
               to_char(coalesce((v_excluded->>'נוכחות טרם סומנה')::integer, 0), 'FM999,999,999') || ' שיבוצים שנוכחותם טרם סומנה.',
      'excluded', coalesce(v_excluded, '{}'::jsonb)),
    'window', jsonb_build_object('from', v_from, 'to', v_to, 'label', v_win_full),
    'tiles', jsonb_build_array(
      jsonb_build_object('key', 'on_time', 'label', 'הגעה בזמן', 'value', v_on_time_pct, 'format', 'percent',
        'window', v_win_text,
        'compare', case when v_prev_pct is null then null else jsonb_build_object(
          'value', v_prev_pct, 'label', 'אשתקד',
          'direction', case when v_on_time_pct > v_prev_pct then 'up' when v_on_time_pct < v_prev_pct then 'down' else 'flat' end) end,
        -- 🪤 I2 · לאריח הזה יש יעד טבעי —
        --    דף-האמינות, שמפרק את אותה הגעה-בזמן לאיחור/הבריזה ולציון פר-דיילת.
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'report_m15_reliability', 'drill', null),
        'sub', to_char(coalesce(v_on_time, 0), 'FM999,999,999') || ' מתוך ' ||
                  to_char(coalesce(v_obs, 0), 'FM999,999,999') || ' שיבוצים'),
      jsonb_build_object('key', 'red_hostesses', 'label', 'דיילות אדומות', 'value', v_red, 'format', 'int',
        'window', 'חלון קבוע · 12 חודשים',
        'compare', case when v_prev_red is null then null else jsonb_build_object(
          'value', v_prev_red, 'label', 'אשתקד',
          'direction', case when v_red > v_prev_red then 'up' when v_red < v_prev_red then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'report_m15_reliability', 'drill', null),
        'sub', to_char(coalesce(v_red, 0), 'FM999,999,999') || ' מתוך ' || to_char(coalesce(v_in_report, 0), 'FM999,999,999') || ' דיילות עם ' ||
                  coalesce(to_char(v_min_sample, 'FM999,999,999'), '—') || ' משמרות ומעלה · ' || to_char(coalesce(v_amber, 0), 'FM999,999,999') ||
                  ' בענבר · ' || to_char(coalesce(v_red_active, 0), 'FM999,999,999') || ' מהאדומות פעילות'),
      jsonb_build_object('key', 'gini', 'label', 'ריכוזיות המשמרות', 'value', round(v_gini, 4), 'format', 'gini',
        'window', v_win_text,
        'compare', case when v_gini_prev is null then null else jsonb_build_object(
          'value', round(v_gini_prev, 4), 'label', 'אשתקד (n=' || v_gini_prev_n || ')',
          'direction', case when v_gini > v_gini_prev then 'up' when v_gini < v_gini_prev then 'down' else 'flat' end) end,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'report_m17_fairness', 'drill', null),
        'sub', 'מדד ג''יני · רבע הדיילות העמוסות ביותר מקבלות ' || coalesce(v_top_q_pct::text, '—') ||
                  '% מהמשמרות; מחצית המאגר מקבלת ' || coalesce(v_bottom_pct::text, '—') || '%'),
      jsonb_build_object('key', 'active_hostesses', 'label', 'דיילות פעילות', 'value', v_active, 'format', 'int',
        'window', 'נכון ל-' || to_char(v_today, 'DD/MM/YYYY'),
        'compare', null,
        'target', jsonb_build_object('tab', 'דיילות', 'report', 'report_m16_quality_cost', 'drill', null),
        'sub', 'מתוך ' || to_char(coalesce(v_registered, 0), 'FM999,999,999') || ' רשומות · ' || to_char(coalesce(v_worked, 0), 'FM999,999,999') || ' עבדו בחלון'),
      jsonb_build_object('key', 'gap_events', 'label', 'אירועים עם חוסר', 'value', v_gap_events, 'format', 'int',
        'window', '30 הימים הקרובים',
        'compare', case when v_prev_upcom = 0 then null else jsonb_build_object(
          'value', v_prev_gap, 'label', '31–60 הימים הבאים',
          'direction', case when v_gap_events > v_prev_gap then 'up' when v_gap_events < v_prev_gap then 'down' else 'flat' end) end,
        -- 🪤 I2 · דלת חוצת-לשונית — תקדים D-18 (נתח-5). המעטפת מסתירה דלת
        --    שהלשונית שלה ממוסכת, ולכן למשתמשת דיילות-בלבד הדלת פשוט אינה מוצגת.
        'target', jsonb_build_object('tab', 'הנהלה', 'report', 'report_m06_staffing', 'drill', null),
        'sub', case when v_upcoming = 0 then 'אין אירועים ב-30 הימים הקרובים'
                  else to_char(coalesce(v_gap_events, 0), 'FM999,999,999') || ' מתוך ' || to_char(coalesce(v_upcoming, 0), 'FM999,999,999') || ' אירועים · ' || to_char(coalesce(v_gap_places, 0), 'FM999,999,999') ||
                       ' מקומות · ' || to_char(coalesce(v_gap_pending, 0), 'FM999,999,999') || ' זימונים ממתינים' end)),
    'chart', jsonb_build_object(
      'type', 'bar', 'title', 'איחור ואי-הגעה לפי חודש',
      'series', jsonb_build_array(
        -- 🪤 I1 · `series[].format` הוא הקודם ל-`unit` בגזירת תו-הסימון
        --    ובטולטיפ, והוא היה `null`. הערכים עצמם אינם זזים.
        jsonb_build_object('key', 'late', 'label', 'איחור', 'format', 'percent'),
        jsonb_build_object('key', 'no_show', 'label', 'אי-הגעה (הבריזה)', 'format', 'percent')),
      'data', coalesce(v_chart, '[]'::jsonb), 'xKey', 'label',
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
      else 'לא לשלוח את ' || to_char(coalesce(v_red, 0), 'FM999,999,999') || ' הדיילות האדומות לאירועים הקרובים — ' || to_char(coalesce(v_red_active, 0), 'FM999,999,999') ||
           ' מהן פעילות ומוצעות היום בשיבוץ.' end,
    'definitions', 'הגדרות: הגעה בזמן = שיבוצים שסומן בהם "הגיעה" בלי דרגת-איחור, מתוך כל השיבוצים שסומנה בהם נוכחות · ' ||
      -- ‏`trim_scale` ולא `::text` גולמי: ‏`(0.87*100)::text` מרנדר **"87.00"** והמסך היה
      -- אומר *"נמוך מ-87.00%"* במקום *"נמוך מ-87%"* — נתפס בהרצת המטען מול המסד 16/09/2026.
      -- 🔴 **ממוצע-החברה כאן הוא זה של החלון הקפוא, בשש ספרות** — אותו מספר בדיוק
      --    ש-`report_m15_reliability` מחזיר ב-`meta.company_average`. עד F2 הודפס כאן
      --    ממוצע חלון-הקורא, ואותו מונח נשא שלושה ערכים שונים בלשונית אחת (0.9587 ·
      --    0.958358 · 0.958815).
      -- 🪤 J1 · **שש ספרות כאן וארבע במ15 — שתי דיוקויות לאותם שלושה מספרים בלשונית
      --    אחת** (0.958358 מול 0.9584 · 0.833771 מול 0.8338 · 0.910440 מול 0.9104).
      --    מיושר לארבע, שהיא הדיוקוּת של מ15, ו-`meta` להלן ממשיך לשאת שש — שם זה
      --    ערך-מכונה להשוואה בשאילתה אחת, כאן זה טקסט שאדם קורא.
      --    ➕ ו-'ענבר' לבדה מול 'דיילת ענבר' במ15: אותו מונח, נוסח אחד.
      'דיילת אדומה = ציון-אמינות נמוך מ-' || coalesce(trim_scale(v_red_coef * 100)::text, '—') || '% מממוצע החברה (' ||
      coalesce(round(v_c_frozen, 4)::text, '—') || ') — כלומר מתחת ל-' || coalesce(round(v_red_coef * v_c_frozen, 4)::text, '—') ||
      '; דיילת ענבר = מתחת ל-' || coalesce(trim_scale(v_amber_coef * 100)::text, '—') || '% ממנו (' ||
      coalesce(round(v_amber_coef * v_c_frozen, 4)::text, '—') || ') · ' ||
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
