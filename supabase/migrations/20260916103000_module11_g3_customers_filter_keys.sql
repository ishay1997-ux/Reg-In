-- =============================================================================
-- מודול 11 · מיגרציה G3 · מפתחות-סינון-צולב לשני משטחי "לקוחות" (מ20 · מ22)
-- =============================================================================
-- 🎯 **מה זה:** תיקון-קדימה **תוספתי בלבד** לשתי פונקציות-שרת. **אין טבלה חדשה, אין
--    עמודה חדשה, אין policy, אין שינוי-חתימה, ואין ולו כתיבה אחת.** הקבצים G ו-G2
--    אינם נערכים — מיגרציה שהוחלה מתוקנת אך ורק במיגרציה חדשה קדימה
--    (`supabase/migrations/CLAUDE.md §2`). שתי הפונקציות נבנות מהגוף **החי**:
--    `md5(prosrc)` נמשך מ-`pg_proc` והושווה לגוף שבקובץ G2 **לפני** שנכתבה שורה —
--    `report_m20_satisfaction` `84393f08...` (18,928 תווים) ·
--    `report_m22_notes` `1386a8ee...` (26,264 תווים), שניים מתוך שניים זהים.
--    `comment on function`, `revoke`, `grant` והחתימות מועתקים מ-G2 ללא שינוי.
--
-- 🧭 **הבעיה שזה פותר — ולמה היא לא נראתה:** המעטפת המשותפת
--    (`src/modules/11_reports/components/ReportSurface.jsx`) מסננת את הטבלה בלחיצה על
--    גרף אך ורק כאשר `chart.filter_key` נוקב בשדה-שורה **סקלרי** שערכיו נפגשים עם
--    `datum[chart.xKey]`. **נמדד 16/09/2026 על המטענים החיים:** ארבעת הגרפים של מ20
--    מפתחים על `score`/`reason`/`year` ומטריצת מ22 על `human_tag` — **ואף אחד מהם
--    אינו שם של עמודה או של שדה-שורה** ⇒ שתי הלשוניות קיבלו אפס סינון-צולב, בשקט,
--    בלי שגיאה ובלי שהמסך יראה שמשהו חסר.
--
-- 🔑 **המבחן שהופעל על כל גרף, ובו ההכרעה כולה:** *האם המספר שכתוב על העמודה שווה
--    למספר השורות שהלחיצה תציג?* גרף שהתשובה בו "כן" — נדלק; גרף שהתשובה בו "לא"
--    כובה **במפורש** (`filter_key: false`) ולא הושאר לזיהוי-אוטומטי שייכשל בשקט.
--
-- 📊 **חמש ההכרעות, כל אחת עם המדידה שלה:**
--    G3-1 · ✅ מ20 · גרף "מה מכעיס" ⇐ `filter_key: 'negative_reason'` (שדה-שורה נסתר
--           חדש). אוכלוסיית-הגרף = אוכלוסיית-הטבלה: 3+3+3+0+10 = 19 = כל שורות הטבלה.
--    G3-2 · ✅ מ22 · מטריצת-ההסכמה ⇐ `filter_key: 'human_tag'` (שדה-שורה נסתר חדש).
--           חמישה דאטומים, חמישה עם שורות: 12 · 10 · 6 · 2 · 33 = 63 מתוך 426.
--    G3-3 · 🚫 מ20 · גרף המגמה השנתית ⇐ `false`. **הכרטיס עצמו** אומר "לא לחיצה".
--    G3-4 · 🔴 מ20 · התפלגות-הציונים ⇐ `false`. **הכרטיס מבקש אותו, והמדידה מסרבת:**
--           לכל משוב עם סיבה שלילית יש ציון 2 או 3 — אפס עם 4 או 5 (70 מתוך 70, כל
--           הזמנים). לחיצה על עמודת "4" (כתוב עליה 67) או "5" (77) הייתה מציגה
--           טבלה ריקה. **סתירת-מקורות לישי, לא תיקון.**
--    G3-5 · 🔴 מ20 · "מה משמח" ⇐ `false`. אפס משובים בטבלה נושאים סיבה חיובית
--           (נמדד: החיתוך שלילי∩חיובי = 0 בכל הזמנים) ⇒ 0 מתוך 5 דאטומים.
--
-- ⚠️ **מה שאינו נפתר כאן ומדווח:** ① כרטיס מ22 ① מבקש סינון לפי **תא** (תגית×נושא);
--    המעטפת יודעת ערך אחד בלבד ⇒ נמסר ברמת-התגית. ② כרטיס מ20 ① כותב שבסינון-צולב
--    **גם האריחים מתעדכנים**; המעטפת מסננת את הטבלה בלבד. שתיהן שאלות-מעטפת, לא SQL.
--    ③ `negative_reason`/`human_tag` הם האיבר הראשון של מערך; ה-CHECK במסד מתיר יותר
--    מאחד, ונמדד 16/09/2026 שאין ולו אחד כזה (`max(array_length(...)) = 1`). אם יתווסף
--    משוב רב-סיבתי — העמודה תספור אותו פעמיים והשורה תיפגש עם סיבה אחת.
--    ④ **שינוי טכני מוצהר:** ארבעה-עשר תווי U+200F (RLM) שישבו בהערות `--`
--    של G2 (אחד במ20, שלושה-עשר במ22, ואף לא אחד במחרוזת) הוסרו. **תו בלתי-נראה
--    בתוך גוף שחייב לעבור העתקה ביית-בביית הוא מלכודת שקטה**, והוא אינו משנה
--    דבר במה שהפונקציה מחזירה. החתימה, `comment on function`, `revoke` ו-`grant`
--    נשארו זהים-בביית ל-G2.
--
-- 📦 **החלה בשני נתחים** (§9 D-20 — נתח < 60 KB, שורת-רשם אחת לנתח):
--    ① `module11_g3_customers_m20` · ② `module11_g3_customers_m22`.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- נתח ① · module11_g3_customers_m20
-- ----------------------------------------------------------------------------
create or replace function public.report_m20_satisfaction(
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
  v_today     date := (now() at time zone 'Asia/Jerusalem')::date;
  -- why (G2-בידוד): בידוד-כיווניות לכל רצף-ספרות בתוך משפט עברי — התאום של `isolateLtr`
  -- (`src/lib/reportsFormat.js`) ושל `v_lri`/`v_pdi` במיגרציות E2/F2. **נמדד 16/09/2026:**
  -- "2,786,544 ₪" חזר מהשרת בתוך משפט עברי בלי בידוד, וזה בדיוק המקרה ש-F5 של E2 תיקן.
  v_lri        constant text := chr(8294);   -- U+2066 LRI
  v_pdi        constant text := chr(8297);   -- U+2069 PDI
  v_to        date;
  v_from      date;
  v_p_from    date;
  v_p_to      date;
  v_notes     jsonb := '[]'::jsonb;
  v_completed integer;
  v_satisfied integer;
  v_no_resp   integer;
  v_not_sent  integer;
  v_held      integer;
  v_avg       numeric;
  v_with_neg  integer;
  v_with_pos  integer;
  v_p_comp    integer;
  v_p_sat     integer;
  v_p_no      integer;
  v_p_avg     numeric;
  v_p_neg     integer;
  v_dist      jsonb;
  v_pos       jsonb;
  v_neg       jsonb;
  v_years     jsonb;
  v_rows      jsonb;
  v_max_tags  integer;
  v_top_neg   text;
  v_top_neg_n integer;
  v_other_n   integer;
  v_rest_n    integer;
begin
  perform public.assert_module_permission('לקוחות', array['edit', 'view']);

  v_to     := coalesce(p_to, v_today);
  v_from   := coalesce(p_from, date_trunc('year', v_to)::date);
  -- 📐1 — תקופה-קודמת **אמיתית**: אותו טווח בדיוק, שנה אחורה. "—" מותר רק כשאין שינוי,
  -- לא כשלא נמדד; ולכן אין כאן אריח בלי בסיס-השוואה.
  v_p_from := (v_from - interval '1 year')::date;
  v_p_to   := (v_to   - interval '1 year')::date;

  -- ── האריחים ושורת-האוכלוסייה, בתקופה ובתקופה הקודמת ─────────────────────────
  select count(*) filter (where p.feedback_status = 'completed'),
         count(*) filter (where p.feedback_status = 'completed' and p.feedback_score >= 4),
         count(*) filter (where p.feedback_status = 'no_response'),
         count(*) filter (where p.feedback_status = 'not_sent' and p.project_status <> 'cancelled'),
         count(*) filter (where p.project_status <> 'cancelled'),
         round((avg(p.feedback_score) filter (where p.feedback_status = 'completed'))::numeric, 2),
         count(*) filter (where p.feedback_status = 'completed'
                            and coalesce(array_length(p.negative_feedback_reasons, 1), 0) > 0),
         count(*) filter (where p.feedback_status = 'completed'
                            and coalesce(array_length(p.positive_feedback_reasons, 1), 0) > 0)
    into v_completed, v_satisfied, v_no_resp, v_not_sent, v_held, v_avg, v_with_neg, v_with_pos
    from public.projects p
   where p.final_event_date between v_from and v_to
     and (p_customer_id is null or p.customer_id = p_customer_id);

  select count(*) filter (where p.feedback_status = 'completed'),
         count(*) filter (where p.feedback_status = 'completed' and p.feedback_score >= 4),
         count(*) filter (where p.feedback_status = 'no_response'),
         round((avg(p.feedback_score) filter (where p.feedback_status = 'completed'))::numeric, 2),
         count(*) filter (where p.feedback_status = 'completed'
                            and coalesce(array_length(p.negative_feedback_reasons, 1), 0) > 0)
    into v_p_comp, v_p_sat, v_p_no, v_p_avg, v_p_neg
    from public.projects p
   where p.final_event_date between v_p_from and v_p_to
     and (p_customer_id is null or p.customer_id = p_customer_id);

  -- ── התפלגות 1–5 · **ציון שלא ניתן אף פעם מצויר בגובה אפס** (כרטיס ④③) ───────
  select coalesce(jsonb_agg(jsonb_build_object('score', s.score, 'n', coalesce(d.n, 0))
                            order by s.score), '[]'::jsonb)
    into v_dist
    from generate_series(1, 5) as s(score)
    left join (select p.feedback_score as score, count(*)::integer as n
                 from public.projects p
                where p.feedback_status = 'completed' and p.feedback_score is not null
                  and p.final_event_date between v_from and v_to
                  and (p_customer_id is null or p.customer_id = p_customer_id)
                group by p.feedback_score) d on d.score = s.score;

  -- ── סיבות חיוביות ושליליות · 📐7: ספירה יורדת, **"אחר" אחרון תמיד** ──────────
  -- ⚠️ קטגוריה קיימת שאיש לא בחר בה נשארת ברשימה עם 0 — היא **נאמרת** ואינה נעלמת בשקט.
  select coalesce(jsonb_agg(jsonb_build_object('reason', t.reason, 'n', t.n)
                            order by (t.reason = 'אחר'), t.n desc, t.reason), '[]'::jsonb)
    into v_pos
    from (select r.reason, count(p.project_id)::integer as n
            from unnest(array['מקצועיות הדיילות', 'עמידה בזמנים', 'איכות תגים וציוד',
                              'ניהול ותקשורת', 'אחר']) as r(reason)
            left join public.projects p
              on p.feedback_status = 'completed'
             and r.reason = any (p.positive_feedback_reasons)
             and p.final_event_date between v_from and v_to
             and (p_customer_id is null or p.customer_id = p_customer_id)
           group by r.reason) t;

  select coalesce(jsonb_agg(jsonb_build_object('reason', t.reason, 'n', t.n)
                            order by (t.reason = 'אחר'), t.n desc, t.reason), '[]'::jsonb)
    into v_neg
    from (select r.reason, count(p.project_id)::integer as n
            from unnest(array['איחור דיילות', 'תפקוד דיילות', 'איכות תגים',
                              'ניהול לקוי', 'אחר']) as r(reason)
            left join public.projects p
              on p.feedback_status = 'completed'
             and r.reason = any (p.negative_feedback_reasons)
             and p.final_event_date between v_from and v_to
             and (p_customer_id is null or p.customer_id = p_customer_id)
           group by r.reason) t;

  select (v_neg #>> '{0,reason}'), (v_neg #>> '{0,n}')::integer into v_top_neg, v_top_neg_n;

  select coalesce(sum(case when e.value ->> 'reason' = 'אחר' then (e.value ->> 'n')::integer else 0 end), 0),
         coalesce(sum(case when e.value ->> 'reason' = 'אחר' then 0 else (e.value ->> 'n')::integer end), 0)
    into v_other_n, v_rest_n
    from jsonb_array_elements(v_neg) as e(value);

  -- ── מגמה שנתית · **מתעלמת ממסנן התקופה במפורש** (📑ב#17 · 📐3) ───────────────
  select coalesce(jsonb_agg(jsonb_build_object(
           'year', t.y, 'satisfied_share', t.share, 'n', t.n,
           'partial', t.y = extract(year from v_to)::integer) order by t.y), '[]'::jsonb)
    into v_years
    from (select extract(year from p.final_event_date)::integer as y,
                 count(*)::integer                              as n,
                 round(100.0 * count(*) filter (where p.feedback_score >= 4)
                       / nullif(count(*), 0), 1)                as share
            from public.projects p
           where p.feedback_status = 'completed' and p.feedback_score is not null
             and p.final_event_date <= v_to
             and (p_customer_id is null or p.customer_id = p_customer_id)
           group by 1) t;

  -- ── הטבלה · המשובים שסימנו סיבה שלילית, **ציון עולה** (📐7 — הנמוך ראשון) ────
  -- ⚠️ `feedback_notes` הוא טקסט שגורם חיצוני כתב. הוא חוזר כדאטה; הלשונית מרנדרת
  -- אותו כטקסט (`{note}`) ולעולם לא כ-HTML (כרטיס ⑨ מ20).
  select coalesce(jsonb_agg(t.row order by t.feedback_score, t.final_event_date desc, t.project_id), '[]'::jsonb)
    into v_rows
    from (select p.project_id, p.feedback_score, p.final_event_date,
                 jsonb_build_object(
                   'drill_key',        jsonb_build_object('kind', 'project', 'id', p.project_id),
                   'project_id',       p.project_id,
                   'event_name',       p.event_name,
                   'company_name',     c.company_name,
                   'final_event_date', p.final_event_date,
                   'feedback_score',   p.feedback_score,
                   'reasons',          to_jsonb(p.negative_feedback_reasons),
                   -- why (G3): שדה-החיבור של הסינון-הצולב מגרף "מה מכעיס". המעטפת משווה
                   -- `String(row[filter_key]) === String(datum[xKey])` — סקלר מול סקלר,
                   -- ולכן `reasons` (מערך) אינו יכול לשמש. נמדד 16/09/2026 על כל הטבלה:
                   -- `max(array_length(negative_feedback_reasons,1)) = 1`, אפס משובים
                   -- רב-סיבתיים ⇒ האיבר הראשון הוא הסיבה. השדה אינו מוצהר ב-`columns[]`
                   -- (`ReportTable` מרנדר רק עמודות מוצהרות) — הוא שדה-שורה נסתר בלבד.
                   'negative_reason',  p.negative_feedback_reasons[1],
                   'feedback_notes',   nullif(btrim(coalesce(p.feedback_notes, '')), '')) as row
            from public.projects p
            left join public.customers c on c.customer_id = p.customer_id
           where p.feedback_status = 'completed'
             and coalesce(array_length(p.negative_feedback_reasons, 1), 0) > 0
             and p.final_event_date between v_from and v_to
             and (p_customer_id is null or p.customer_id = p_customer_id)) t;

  -- ── 📐11 · הצהרת-רב-ערכיות **מותנית במדידה ולא מוצהרת מראש** ────────────────
  -- 🔴 הכלל נוקב במשפט "סכום הספירות עולה על מספר המשובים", והמדידה של 10/09/2026
  -- הראתה שזה **אינו נכון כאן** — בכל המשובים נבחרה בדיוק סיבה אחת. כתיבת המשפט
  -- כלשונו הייתה אמירה שקרית על המסך, ולכן הוא נגזר ממה שנמדד עכשיו.
  select coalesce(max(greatest(coalesce(array_length(p.negative_feedback_reasons, 1), 0),
                               coalesce(array_length(p.positive_feedback_reasons, 1), 0))), 0)
    into v_max_tags
    from public.projects p
   where p.feedback_status = 'completed'
     and p.final_event_date between v_from and v_to
     and (p_customer_id is null or p.customer_id = p_customer_id);

  v_notes := v_notes || to_jsonb(
    case when v_max_tags > 1
      then 'הטופס מאפשר יותר מסיבה אחת, ובפועל יש משוב שסימן יותר מאחת — ולכן סכום הספירות עולה על מספר המשובים.'
      else 'הטופס מאפשר יותר מסיבה אחת; בפועל, בכל המשובים בתקופה נבחרה בדיוק אחת.'
    end::text);
  v_notes := v_notes
    || to_jsonb('גרף המגמה השנתית מתעלם ממסנן התקופה במכוון ומציג את כל השנים.'::text)
    || to_jsonb('הספירות מוצגות כ"N מתוך M" ולא באחוזים (📐11).'::text);
  if p_drill is not null then
    v_notes := v_notes || to_jsonb('הדף אינו דוח-קידוח (📐13) — פרמטר הקידוח לא הופעל.'::text);
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_completed,
      'label', 'אוכלוסייה: משובים שהלקוח מילא · הוצאו: ' || v_lri || to_char(v_no_resp, 'FM999,999,999') || v_pdi
               || ' שנשלחו ולא נענו ו-' || v_lri || to_char(v_not_sent, 'FM999,999,999') || v_pdi || ' שלא נשלחו כלל · '
               || v_lri || 'n=' || to_char(v_completed, 'FM999,999,999') || v_pdi || ', מתוך ' || v_lri || to_char(v_held, 'FM999,999,999') || v_pdi
               || ' האירועים שהתקיימו בתקופה. שיעור המענה מחושב על אוכלוסייה אחרת — מילאו ועוד לא-נענו, '
               || v_lri || to_char((v_completed + v_no_resp), 'FM999,999,999') || v_pdi || ' משובים.',
      'excluded', jsonb_build_object('נשלח ולא נענה', v_no_resp, 'לא נשלח כלל', v_not_sent)),
    'window', jsonb_build_object(
      'from', v_from, 'to', v_to,
      'label', v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi
               || ' · ' || case when p_customer_id is null then 'כל הלקוחות' else 'לקוח נבחר' end),
    'tiles', jsonb_build_array(
      jsonb_build_object(
        'key', 'satisfied_share',
        'label', 'שיעור המרוצים (4–5)',
        'value', round(100.0 * v_satisfied / nullif(v_completed, 0), 1),
        'format', 'percent',
        'sub', v_lri || to_char(v_satisfied, 'FM999,999,999') || v_pdi || ' מתוך ' || v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' משובים',
        'detail', jsonb_build_object('satisfied', v_satisfied, 'completed', v_completed),
        'window', v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi,
        'compare', jsonb_build_object(
          'value', round(100.0 * v_p_sat / nullif(v_p_comp, 0), 1),
          'label', 'אשתקד באותו טווח (' || v_lri || to_char(v_p_sat, 'FM999,999,999') || v_pdi || ' מתוך '
                   || v_lri || to_char(v_p_comp, 'FM999,999,999') || v_pdi || ')',
          'direction', case
            when v_p_comp = 0 or v_completed = 0 then 'flat'
            when 1.0 * v_satisfied / v_completed > 1.0 * v_p_sat / v_p_comp then 'up'
            when 1.0 * v_satisfied / v_completed < 1.0 * v_p_sat / v_p_comp then 'down'
            else 'flat' end),
        'target', null),
      jsonb_build_object(
        'key', 'response_rate',
        'label', 'שיעור המענה למשוב',
        'value', round(100.0 * v_completed / nullif(v_completed + v_no_resp, 0), 1),
        'format', 'percent',
        'sub', v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' מולאו מתוך '
               || v_lri || to_char((v_completed + v_no_resp), 'FM999,999,999') || v_pdi || ' שנשלחו',
        'detail', jsonb_build_object('completed', v_completed, 'sent', v_completed + v_no_resp),
        'window', v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi,
        'compare', jsonb_build_object(
          'value', round(100.0 * v_p_comp / nullif(v_p_comp + v_p_no, 0), 1),
          'label', 'אשתקד באותו טווח (' || v_lri || to_char(v_p_comp, 'FM999,999,999') || v_pdi || ' מתוך '
                   || v_lri || to_char((v_p_comp + v_p_no), 'FM999,999,999') || v_pdi || ')',
          'direction', case
            when v_p_comp + v_p_no = 0 or v_completed + v_no_resp = 0 then 'flat'
            when 1.0 * v_completed / (v_completed + v_no_resp) > 1.0 * v_p_comp / (v_p_comp + v_p_no) then 'up'
            when 1.0 * v_completed / (v_completed + v_no_resp) < 1.0 * v_p_comp / (v_p_comp + v_p_no) then 'down'
            else 'flat' end),
        'target', null),
      jsonb_build_object(
        'key', 'average_score',
        'label', 'ממוצע הציון (1–5)',
        'value', v_avg,
        'format', 'ratio',
        'sub', 'על ' || v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' משובים · מדד משני לשיעור-המרוצים',
        'detail', jsonb_build_object('completed', v_completed),
        'window', v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi,
        'compare', jsonb_build_object(
          'value', v_p_avg,
          'label', 'אשתקד באותו טווח',
          'direction', case when v_avg is null or v_p_avg is null then 'flat'
                            when v_avg > v_p_avg then 'up'
                            when v_avg < v_p_avg then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object(
        'key', 'with_negative_reason',
        'label', 'משובים שסימנו סיבה שלילית',
        'value', v_with_neg,
        'format', 'int',
        'sub', 'מתוך ' || v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' — ו-'
               || v_lri || to_char(v_with_pos, 'FM999,999,999') || v_pdi || ' סימנו סיבה חיובית',
        'detail', jsonb_build_object('with_negative', v_with_neg, 'completed', v_completed),
        'window', v_lri || to_char(v_from, 'DD/MM/YYYY') || '–' || to_char(v_to, 'DD/MM/YYYY') || v_pdi,
        'compare', jsonb_build_object(
          'value', v_p_neg,
          'label', 'אשתקד באותו טווח: ' || v_lri || to_char(v_p_neg, 'FM999,999,999') || v_pdi || ' מתוך '
                   || v_lri || to_char(v_p_comp, 'FM999,999,999') || v_pdi,
          'direction', case when v_with_neg > v_p_neg then 'up'
                            when v_with_neg < v_p_neg then 'down' else 'flat' end),
        'target', null)),
    -- 🔴 **ארבעה גרפים ולא שניים** — ר' "פער 2" בכותרת הקובץ: המוקאפ המאושר מצייר
    -- ארבעה, ו-📑ב#17 אוסר במפורש לאחד את שני גרפי-הסיבות לציר אחד.
    'chart', jsonb_build_array(
      jsonb_build_object(
        'type', 'bar',
        'title', 'התפלגות הציונים · ' || v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' משובים',
        'series', jsonb_build_array(jsonb_build_object('key', 'n', 'label', 'משובים')),
        'data', v_dist, 'xKey', 'score', 'domain', null, 'refLines', '[]'::jsonb, 'unit', 'משובים',
        -- 🔴 **כבוי, והנימוק מדוד — לא זהירות.** הכרטיס ① מבקש סינון-צולב לציון,
        -- אבל **אוכלוסיית הגרף אינה אוכלוסיית הטבלה**: הגרף סופר את כל המשובים
        -- שמילאו (163 בחלון), והטבלה מחזיקה רק את מי שסימן סיבה שלילית (19).
        -- נמדד על כל הטבלה: לכל משוב עם סיבה שלילית יש ציון 2 או 3 — אף לא
        -- אחד עם 4 או 5 (26 + 44 = 70 מתוך 70). ⇒ לחיצה על 4 (עמודה שכתוב
        -- עליה 67) או על 5 (77) הייתה מסננת ל**אפס שורות** בלי שגיאה ובלי רמז —
        -- בדיוק המלכודת שתיעדה `ReportSurface.autoFilterKey` על מ8 ומ9, ובדיוק מה
        -- שכרטיס ⑦ אוסר (*"סיבה עם 0 שורות ⇒ העמודה אינה לחיצה, לא טבלה ריקה"*).
        -- ⚖️ **סתירת-מקורות, מדווחת ולא מוכרעת כאן:** להדליק צריך שהטבלה תחזיק
        -- את כל 163 המשובים — שינוי-אוכלוסייה, לא הצהרת-מפתח. הכרעת-ישי.
        'filter_key', false),
      jsonb_build_object(
        'type', 'bar',
        'title', 'מה משמח · ' || v_lri || to_char(v_with_pos, 'FM999,999,999') || v_pdi || ' משובים סימנו סיבה חיובית',
        'series', jsonb_build_array(jsonb_build_object('key', 'n', 'label', 'משובים')),
        'data', v_pos, 'xKey', 'reason', 'domain', null, 'refLines', '[]'::jsonb, 'unit', 'משובים',
        -- 🔴 **כבוי, והמדידה חותכת:** אין ולו שורה אחת בטבלה שנושאת סיבה חיובית.
        -- נמדד 16/09/2026: מספר המשובים שסימנו גם סיבה שלילית וגם סיבה חיובית = **0**
        -- (בתקופה ובכל הזמנים). ⇒ חמשת הדאטומים היו מסננים כולם לאפס שורות.
        -- ⚖️ אותה סתירת-מקורות של גרף-הציונים, בגרסה חריפה יותר: 0 מתוך 5 ולא 3 מתוך 5.
        'filter_key', false),
      jsonb_build_object(
        'type', 'bar',
        'title', 'מה מכעיס · ' || v_lri || to_char(v_with_neg, 'FM999,999,999') || v_pdi || ' משובים סימנו סיבה שלילית',
        'series', jsonb_build_array(jsonb_build_object('key', 'n', 'label', 'משובים')),
        'data', v_neg, 'xKey', 'reason', 'domain', null, 'refLines', '[]'::jsonb, 'unit', 'משובים',
        -- ✅ **הסינון-הצולב היחיד שהמפגש שלו מדויק.** אוכלוסיית הגרף היא בדיוק
        -- אוכלוסיית הטבלה: כל שורה בטבלה סימנה סיבה שלילית אחת, וסכום העמודות
        -- (3+3+3+0+10) שווה ל-19 שורות הטבלה. **המספר שעל העמודה הוא מספר השורות**
        -- שהלחיצה תציג — וזה התנאי שמפריד בין סינון-צולב אמיתי לבין טבלה ריקה.
        -- `filter_key` הוא שם **שדה-השורה** ולא שם ה-`xKey`, והמעטפת משווה
        -- `row['negative_reason']` מול `datum['reason']` (`ReportSurface` §מפתח-הסינון ②).
        'filter_key', 'negative_reason'),
      jsonb_build_object(
        'type', 'bar',
        'title', 'שיעור המרוצים לפי שנה — אינו מושפע ממסנן התקופה',
        'series', jsonb_build_array(jsonb_build_object('key', 'satisfied_share', 'label', 'שיעור מרוצים')),
        'data', v_years, 'xKey', 'year',
        'domain', jsonb_build_array(0, 100), 'refLines', '[]'::jsonb, 'unit', '%',
        -- 🚫 **כבוי במפורש לפי הכרטיס עצמו** ① (*"לא לחיצה — הגרף מתעלם
        -- ממסנן-התקופה בכוונה, ולחיצה עליו הייתה סותרת את ההצהרה שלו"*). ההצהרה
        -- כתובה כאן ואינה נשענת על כך שהזיהוי-האוטומטי ממילא ייכשל — זיהוי-שנכשל
        -- וכיבוי-מכוון נראים זהים על המסך ושונים לגמרי בקוד.
        'filter_key', false)),
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'event_name',       'label', 'אירוע',           'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'company_name',     'label', 'לקוח',            'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'final_event_date', 'label', 'תאריך',           'format', 'text',  'align', 'start'),
      -- 📐9 · הטבלה ממוינת בציון עולה (הנמוך ראשון) — וזה מה ש-`aria-sort` חייב לומר.
      jsonb_build_object('key', 'feedback_score',   'label', 'ציון',            'format', 'int',   'align', 'end',
                         'sorted', 'ascending'),
      jsonb_build_object('key', 'reasons',          'label', 'הסיבה שסומנה',    'format', 'text',  'align', 'start'),
      jsonb_build_object('key', 'feedback_notes',   'label', 'ההערה שנכתבה',    'format', 'text',  'align', 'start')),
    'rows', v_rows,
    -- 📐23 · דוח-בקרה ⇒ הפועל "לפתוח את X", **והחריגה בשם** (ק4). המשפט נגזר ממה
    -- שנמדד: "גדולה מכל הקטגוריות יחד" נאמר רק כשזה נכון בפועל.
    'so_what', case
      when v_with_neg = 0 then 'אין משוב שלילי בתקופה שנבחרה.'
      when v_other_n > 0 and v_other_n >= v_rest_n
        then 'לפתוח את ' || v_lri || to_char(v_other_n, 'FM999,999,999') || v_pdi
             || ' המשובים שתויגו "אחר" — הם הסיבה השלילית הגדולה בתקופה, גדולה מכל הקטגוריות הקיימות יחד ('
             || v_lri || to_char(v_rest_n, 'FM999,999,999') || v_pdi || '), ואיש לא קרא את הטקסט שבהם.'
      else 'לברר את ' || v_lri || to_char(v_top_neg_n, 'FM999,999,999') || v_pdi || ' המשובים שסימנו "' || v_top_neg
           || '" — זו הסיבה השלילית השכיחה בתקופה.' end,
    'definitions', 'הגדרות: שיעור המרוצים = משובים בציון 4 או 5, חלקי כל המשובים שמולאו · שיעור המענה = משובים שמולאו חלקי (מולאו + נשלחו ולא נענו). משוב שלא נשלח כלל אינו במכנה · ממוצע הציון = ממוצע חשבוני על סולם 1–5; מוצג כמדד משני כי הסולם הוא סולם סדר ולא סולם רציף · סיבה = מה שהלקוח סימן בטופס מתוך רשימה סגורה של חמש קטגוריות לכל כיוון, כולל "אחר" · "אחר" = הלקוח לא מצא קטגוריה מתאימה וכתב בטקסט חופשי.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', '[]'::jsonb,
      'frozen_count', null,
      'notes', v_notes,
      -- הדף מגיב למסנן-הלקוח במלואו ⇒ הרשימה ריקה **ונאמרת**, ולא נעדרת.
      'export_blocked_reason', null,
      'customer_filter_ignored', '[]'::jsonb,
      'drill_echo', p_drill,
      'run', null));
end;
$function$;

comment on function public.report_m20_satisfaction(date, date, integer, jsonb) is
  'שביעות רצון (מ20) — קריאה בלבד, מגודר על מודול לקוחות. אוכלוסייה: משובים שהלקוח מילא בתקופה; הוצאו משובים שנשלחו ולא נענו ומשובים שלא נשלחו כלל, ואירועים מבוטלים אינם מועמדים למשוב. שיעור המענה מחושב על אוכלוסייה אחרת (מילאו + לא-נענו). גרף המגמה השנתית מתעלם ממסנן התקופה. כל שאר הדף מגיב למסנני התקופה והלקוח. חלון התקופה סגור משני קצותיו.';

revoke execute on function public.report_m20_satisfaction(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m20_satisfaction(date, date, integer, jsonb) to authenticated;
-- ----------------------------------------------------------------------------
-- נתח ② · module11_g3_customers_m22
-- ----------------------------------------------------------------------------
create or replace function public.report_m22_notes(
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
  v_today     date := (now() at time zone 'Asia/Jerusalem')::date;
  -- why (G2-בידוד): בידוד-כיווניות לכל רצף-ספרות בתוך משפט עברי — התאום של `isolateLtr`
  -- (`src/lib/reportsFormat.js`) ושל `v_lri`/`v_pdi` במיגרציות E2/F2. **נמדד 16/09/2026:**
  -- "2,786,544 ₪" חזר מהשרת בתוך משפט עברי בלי בידוד, וזה בדיוק המקרה ש-F5 של E2 תיקן.
  v_lri        constant text := chr(8294);   -- U+2066 LRI
  v_pdi        constant text := chr(8297);   -- U+2069 PDI
  v_to        date;
  v_from      date;
  v_notes     jsonb := '[]'::jsonb;
  v_run       record;
  v_run_json  jsonb;
  -- 🔴 **תיקון G2-1, והוא החוסם של הקובץ.** הגוף הקודם קרא **ריצה מאושרת אחת**
  -- (`order by approved_at desc limit 1`). **נמדד חי 16/09/2026:** שתי ריצות מאושרות —
  -- 5 (`partial`, 40 שורות, gemini-3.8-flash) ו-6 (`done`, 386, gemini-3.5-flash-lite),
  -- **זרות זו לזו, ויחד בדיוק 426 הפרויקטים** שהאריח הראשון מכריז עליהם. ⇒ הדוח הציג
  -- 386 שורות ו-24 דגלים אדומים במקום 426 ו-25, **בלי לומר שחסרות 40** — ובאותו מסך
  -- שורת-האוכלוסייה כן אמרה 426. הכרטיס ⑥ נוקב במפורש ב*"הדוח מציג רק ריצות מאושרות"*
  -- (רבים). ⇒ **איחוד כל הריצות המאושרות, שורה אחת לפרויקט** (המאושרת האחרונה גוברת).
  v_run_ids   bigint[];
  v_run_cnt   integer;
  v_runs      jsonb;
  v_models    text[];
  v_models_j  jsonb;
  v_sent      integer;
  v_ok        integer;
  v_failed    integer;
  v_completed integer;
  v_with_note integer;
  v_distinct  integer;
  v_other     integer;
  v_other_txt integer;
  v_rest      integer;
  v_other_yr  jsonb;
  v_quotes    jsonb;
  v_matrix    jsonb;
  v_rows      jsonb;
  v_flags     integer;
  v_unclass   integer;
  v_classified integer;
  v_free      jsonb;
  v_free_one  integer;
  v_top_pair  jsonb;
  -- ⑧ מ25 · **פס-הניתוח חי גם כשאין אישור.** השורות והאריחים נעולים לריצות מאושרות
  -- (וזה נכון — תוצאת-מודל אינה עולה למסך לפני שאדם ראה אותה), אבל ריצה `running` /
  -- `partial` / `done`-שטרם-אושרה הייתה **בלתי-נראית לחלוטין** למטען ⇒ הפס היה מצייר
  -- *"טרם סווגו"* עם כפתור חי, ולחיצה עליו נופלת על אינדקס H1 (ריצה-רצה-יחידה). ⇒
  -- הריצה הלא-מאושרת האחרונה חוזרת **בנפרד**, ואינה נוגעת בשורות ובאריחים.
  v_prog      jsonb;
begin
  perform public.assert_module_permission('לקוחות', array['edit', 'view']);

  v_to   := coalesce(p_to, v_today);
  v_from := coalesce(p_from, date_trunc('year', v_to)::date);

  -- ── הריצה המאושרת האחרונה. אין אחת ⇒ כל מה שמתחתיה מאופס-במפורש ──────────────
  -- הריצה המאושרת **האחרונה** — היא שנושאת את חותמת-הדף (⑧22.4: *"מציג את הריצה
  -- מ-DD/MM/YYYY, אושרה ע"י X"*). היא אינה מגדירה עוד את אוכלוסיית-השורות.
  select r.run_id, r.status, r.model, r.finished_at, r.approved_at, r.approved_by,
         r.sent_count, r.ok_count, r.failed_count
    into v_run
    from public.feedback_ai_runs r
   where r.approved_at is not null
   order by r.approved_at desc, r.run_id desc
   limit 1;

  -- **כל** הריצות המאושרות — הן, יחד, אוכלוסיית-הסיווג של הדף.
  select count(*)::integer,
         array_agg(r.run_id order by r.approved_at desc, r.run_id desc),
         coalesce(sum(r.sent_count), 0)::integer,
         coalesce(sum(r.ok_count), 0)::integer,
         coalesce(sum(r.failed_count), 0)::integer,
         coalesce(jsonb_agg(jsonb_build_object(
           'run_id', r.run_id, 'status', r.status, 'model', r.model,
           'finished_at', r.finished_at, 'approved_at', r.approved_at,
           'approved_by', r.approved_by, 'sent_count', r.sent_count,
           'ok_count', r.ok_count, 'failed_count', r.failed_count)
           order by r.approved_at desc, r.run_id desc), '[]'::jsonb)
    into v_run_cnt, v_run_ids, v_sent, v_ok, v_failed, v_runs
    from public.feedback_ai_runs r
   where r.approved_at is not null;

  -- 🔑 **שני מודלים מעורבים בפועל**, ולכן הדף אומר אילו ועל כמה שורות כל אחד —
  -- "המודל" ביחיד היה הסתרה של הרכב-הנתונים שעליו האדם מסתכל.
  select coalesce(jsonb_agg(jsonb_build_object('model', t.model, 'runs', t.runs, 'rows', t.rows)
                            order by t.rows desc, t.model), '[]'::jsonb),
         array_agg(t.model order by t.rows desc, t.model)
    into v_models_j, v_models
    from (select r.model,
                 count(distinct r.run_id)::integer as runs,
                 count(i.project_id)::integer      as rows
            from public.feedback_ai_runs r
            left join public.feedback_ai_insights i on i.run_id = r.run_id
           where r.approved_at is not null
           group by r.model) t;

  select jsonb_build_object(
           'run_id', r.run_id, 'status', r.status, 'model', r.model,
           'sent_count', r.sent_count, 'ok_count', r.ok_count, 'failed_count', r.failed_count,
           'started_at', r.started_at, 'finished_at', r.finished_at)
    into v_prog
    from public.feedback_ai_runs r
   where r.approved_at is null
   order by r.run_id desc
   limit 1;

  -- ── מה שידוע **בלי** המודל — כל הזמנים, ואינו מגיב למסנן התקופה ──────────────
  select count(*),
         count(*) filter (where nullif(btrim(coalesce(p.feedback_notes, '')), '') is not null),
         count(distinct nullif(btrim(coalesce(p.feedback_notes, '')), ''))
    into v_completed, v_with_note, v_distinct
    from public.projects p
   where p.feedback_status = 'completed';

  select count(*) filter (where r.reason = 'אחר'),
         count(*) filter (where r.reason <> 'אחר')
    into v_other, v_rest
    from public.projects p
    cross join lateral unnest(p.negative_feedback_reasons) as r(reason)
   where p.feedback_status = 'completed';

  select count(*) into v_other_txt
    from public.projects p
   where p.feedback_status = 'completed'
     and 'אחר' = any (p.negative_feedback_reasons)
     and nullif(btrim(coalesce(p.feedback_notes, '')), '') is not null;

  select coalesce(jsonb_object_agg(t.y::text, t.c), '{}'::jsonb) into v_other_yr
    from (select extract(year from p.final_event_date)::integer as y, count(*)::integer as c
            from public.projects p
           where p.feedback_status = 'completed'
             and 'אחר' = any (p.negative_feedback_reasons)
             and p.final_event_date <= v_today
           group by 1) t;

  -- שמונה ההערות שתויגו "אחר" — **טקסט מדוד מהמסד, בלי ולו פלט-מודל אחד** (⑧22.2).
  -- הן אינן `rows` (אלה נעולות לריצה מאושרת), אלא הבסיס למצב-הריק שהמוקאפ מצייר.
  -- ⚠️ `feedback_notes` הוא טקסט שגורם חיצוני כתב ⇒ מוצג כטקסט, לעולם לא כ-HTML (⑨).
  select coalesce(jsonb_agg(t.row order by t.final_event_date desc, t.project_id desc), '[]'::jsonb)
    into v_quotes
    from (select p.project_id, p.final_event_date,
                 jsonb_build_object(
                   'project_id',       p.project_id,
                   'company_name',     c.company_name,
                   'final_event_date', p.final_event_date,
                   'feedback_score',   p.feedback_score,
                   'feedback_notes',   btrim(p.feedback_notes)) as row
            from public.projects p
            left join public.customers c on c.customer_id = p.customer_id
           where p.feedback_status = 'completed'
             and 'אחר' = any (p.negative_feedback_reasons)
             and nullif(btrim(coalesce(p.feedback_notes, '')), '') is not null
             and (p_customer_id is null or p.customer_id = p_customer_id)
           order by p.final_event_date desc, p.project_id desc
           limit 8) t;

  if v_run.run_id is not null then
    -- ── מטריצת-ההסכמה אדם↔מודל · **הצד השלילי** ('אחר' קיים בשתי הרשימות ⇒ שתי עמודות) ──
    -- 🔑 **"מספר-הסכמה בודד אינו מדד"** (📑ב#20): המטריצה היא תגית-לקוח × נושא-מודל,
    -- עם מכנה גלוי לכל שורה. 📐7 — "אחר" אחרון תמיד.
    with pick as (
      -- שורה אחת לפרויקט מתוך **כל** הריצות המאושרות; אם פרויקט סווג פעמיים,
      -- המאושרת האחרונה גוברת. (16/09/2026 אין חפיפה — 426 שורות, 426 פרויקטים.)
      select distinct on (i.project_id) i.*
        from public.feedback_ai_insights i
        join public.feedback_ai_runs r on r.run_id = i.run_id
       where r.approved_at is not null
       order by i.project_id, r.approved_at desc, i.run_id desc
    )
    select coalesce(jsonb_agg(t.row order by (t.human_tag = 'אחר'), t.total desc, t.human_tag), '[]'::jsonb)
      into v_matrix
      from (select h.reason as human_tag,
                   count(*)::integer as total,
                   count(*) filter (where i.unclassifiable)::integer as unclassifiable,
                   count(*) filter (where h.reason = any (i.negative_topics))::integer as agreed,
                   jsonb_build_object(
                     'human_tag',      h.reason,
                     'total',          count(*),
                     'agreed',         count(*) filter (where h.reason = any (i.negative_topics)),
                     'unclassifiable', count(*) filter (where i.unclassifiable),
                     'by_topic', (select coalesce(jsonb_object_agg(m.topic, m.n), '{}'::jsonb)
                                    from (select tt.topic, count(*)::integer as n
                                            from public.projects p2
                                            join pick i2 on i2.project_id = p2.project_id
                                            cross join lateral unnest(i2.negative_topics) as tt(topic)
                                           where h.reason = any (p2.negative_feedback_reasons)
                                             and (p_customer_id is null or p2.customer_id = p_customer_id)
                                           group by tt.topic) m)) as row
              from public.projects p
              join pick i on i.project_id = p.project_id
              cross join lateral unnest(p.negative_feedback_reasons) as h(reason)
             where (p_customer_id is null or p.customer_id = p_customer_id)
             group by h.reason) t;

    with pick as (
      -- שורה אחת לפרויקט מתוך **כל** הריצות המאושרות; אם פרויקט סווג פעמיים,
      -- המאושרת האחרונה גוברת. (16/09/2026 אין חפיפה — 426 שורות, 426 פרויקטים.)
      select distinct on (i.project_id) i.*
        from public.feedback_ai_insights i
        join public.feedback_ai_runs r on r.run_id = i.run_id
       where r.approved_at is not null
       order by i.project_id, r.approved_at desc, i.run_id desc
    )
    select count(*) filter (where i.red_flag),
           count(*) filter (where i.unclassifiable),
           count(*)
      into v_flags, v_unclass, v_classified
      from pick i
      join public.projects p on p.project_id = i.project_id
     where (p_customer_id is null or p.customer_id = p_customer_id);

    -- `free_topic` — **הכרעה 11 של ת2**: מה "אחר" מכיל. 📑ב#20 מציג רק `n≥3`,
    -- והשאר נספרים יחד תחת "תגיות בודדות".
    with pick as (
      -- שורה אחת לפרויקט מתוך **כל** הריצות המאושרות; אם פרויקט סווג פעמיים,
      -- המאושרת האחרונה גוברת. (16/09/2026 אין חפיפה — 426 שורות, 426 פרויקטים.)
      select distinct on (i.project_id) i.*
        from public.feedback_ai_insights i
        join public.feedback_ai_runs r on r.run_id = i.run_id
       where r.approved_at is not null
       order by i.project_id, r.approved_at desc, i.run_id desc
    )
    select coalesce(jsonb_agg(jsonb_build_object('topic', t.topic, 'n', t.n)
                              order by t.n desc, t.topic) filter (where t.n >= 3), '[]'::jsonb),
           coalesce(sum(t.n) filter (where t.n < 3), 0)::integer
      into v_free, v_free_one
      from (select btrim(i.free_topic) as topic, count(*)::integer as n
              from pick i
              join public.projects p on p.project_id = i.project_id
             where nullif(btrim(coalesce(i.free_topic, '')), '') is not null
               and (p_customer_id is null or p.customer_id = p_customer_id)
             group by btrim(i.free_topic)) t;

    -- שורות הדוח — **רק מהריצה המאושרת**, עם `free_topic` על כל שורה.
    with pick as (
      -- שורה אחת לפרויקט מתוך **כל** הריצות המאושרות; אם פרויקט סווג פעמיים,
      -- המאושרת האחרונה גוברת. (16/09/2026 אין חפיפה — 426 שורות, 426 פרויקטים.)
      select distinct on (i.project_id) i.*
        from public.feedback_ai_insights i
        join public.feedback_ai_runs r on r.run_id = i.run_id
       where r.approved_at is not null
       order by i.project_id, r.approved_at desc, i.run_id desc
    )
    select coalesce(jsonb_agg(t.row order by t.red_flag desc, t.final_event_date desc, t.project_id desc), '[]'::jsonb)
      into v_rows
      from (select p.project_id, p.final_event_date, i.red_flag,
                   jsonb_build_object(
                     'drill_key',        jsonb_build_object('kind', 'project', 'id', p.project_id),
                     'project_id',       p.project_id,
                     'company_name',     c.company_name,
                     'final_event_date', p.final_event_date,
                     'feedback_score',   p.feedback_score,
                     'customer_tags',    to_jsonb(p.negative_feedback_reasons),
                     -- why (G3): שדה-החיבור של הסינון-הצולב ממטריצת-ההסכמה. אותו נימוק
                     -- כמו במ20: המעטפת משווה סקלר מול סקלר, ו-`customer_tags` הוא מערך.
                     -- הערך נגזר **מאותו מקור בדיוק** שממנו נבנית המטריצה
                     -- (`unnest(p.negative_feedback_reasons)`) ⇒ המפגש מדויק לפי בנייה.
                     -- הערה ללא תגית-לקוח מקבלת `null` ואינה נתפסת באף דאטום. נסתר.
                     'human_tag',        p.negative_feedback_reasons[1],
                     'feedback_notes',   nullif(btrim(coalesce(p.feedback_notes, '')), ''),
                     'model_topics',     to_jsonb(i.negative_topics),
                     'free_topic',       nullif(btrim(coalesce(i.free_topic, '')), ''),
                     'sentiment',        i.sentiment,
                     'quote',            i.quote,
                     'red_flag',         i.red_flag,
                     'unclassifiable',   i.unclassifiable) as row
              from pick i
              join public.projects p on p.project_id = i.project_id
              left join public.customers c on c.customer_id = p.customer_id
             where (p_customer_id is null or p.customer_id = p_customer_id)) t;

    -- הזוג הגדול ביותר "מה הלקוח תייג ⇒ מה המודל מצא", לשורת-"אז מה" של 📑#20.
    with pick as (
      -- שורה אחת לפרויקט מתוך **כל** הריצות המאושרות; אם פרויקט סווג פעמיים,
      -- המאושרת האחרונה גוברת. (16/09/2026 אין חפיפה — 426 שורות, 426 פרויקטים.)
      select distinct on (i.project_id) i.*
        from public.feedback_ai_insights i
        join public.feedback_ai_runs r on r.run_id = i.run_id
       where r.approved_at is not null
       order by i.project_id, r.approved_at desc, i.run_id desc
    )
    select jsonb_build_object('human_tag', t.human_tag, 'model_topic', t.model_topic, 'n', t.n)
      into v_top_pair
      from (select h.reason as human_tag, mt.topic as model_topic, count(*)::integer as n
              from public.projects p
              join pick i on i.project_id = p.project_id
              cross join lateral unnest(p.negative_feedback_reasons) as h(reason)
              cross join lateral unnest(i.negative_topics) as mt(topic)
             where h.reason <> mt.topic
               and (p_customer_id is null or p.customer_id = p_customer_id)
             group by 1, 2
             order by 3 desc, 1, 2
             limit 1) t;

    -- `model` נשאר מפתח-מחרוזת (לא משנים צורת-מפתח), אך הוא נוקב בשני המודלים
    -- שמאחורי השורות; הפירוט המלא ב-`models` וב-`runs`.
    v_run_json := jsonb_build_object(
      'run_id', v_run.run_id, 'status', v_run.status,
      'model', array_to_string(v_models, ' + '),
      'models', v_models_j,
      'runs', v_runs,
      'run_count', v_run_cnt,
      'finished_at', v_run.finished_at, 'approved_at', v_run.approved_at,
      'approved_by', v_run.approved_by,
      'sent_count', v_sent, 'ok_count', v_ok, 'failed_count', v_failed,
      'classified', v_classified, 'unclassifiable', v_unclass);
  else
    v_matrix := '[]'::jsonb;
    v_rows   := '[]'::jsonb;
    v_free   := '[]'::jsonb;
    v_notes  := v_notes || to_jsonb('טרם אושרה ריצת-ניתוח — הדף אינו מציג סיווג שלא אושר.'::text);
  end if;

  v_notes := v_notes
    || to_jsonb('הדף אינו מגיב למסנן התקופה — הוא מציג את תוצאת כל ריצות-הניתוח שאושרו.'::text)
    -- 🔴 **ההצהרה הקודמת הייתה שקרית על אריח אחד מארבעה.** *"אריחי המצאי … אינם
    -- מושפעים ממסנן הלקוח"* נכון לשלושת אריחי-המצאי, **ולא ל"דגלים אדומים"** — שהוא
    -- כן מסונן (נמדד: 24 ⇐ 5 עם `p_customer_id=401`). המשפט נוקב עכשיו בשלושה,
    -- ו-`meta.customer_filter_ignored` מונה אותם במפורש.
    || to_jsonb('שלושת אריחי המצאי — הערות, "אחר", ו"אחר" מול הקטגוריות — נספרים על כל הזמנים ואינם מושפעים ממסנן הלקוח; אריח הדגלים האדומים והטבלה כן מושפעים ממנו.'::text);
  if v_run_cnt > 1 then
    v_notes := v_notes || to_jsonb((v_lri || to_char(v_run_cnt, 'FM999,999,999') || v_pdi
      || ' ריצות-ניתוח מאושרות מוצגות יחד, שורה אחת לכל פרויקט; המודלים: '
      || array_to_string(v_models, ', ') || '.')::text);
  end if;
  if p_drill is not null then
    v_notes := v_notes || to_jsonb('הדף אינו דוח-קידוח (📐13) — פרמטר הקידוח לא הופעל.'::text);
  end if;

  return jsonb_build_object(
    'population', jsonb_build_object(
      'n', v_with_note,
      'label', 'אוכלוסייה: הערות חופשיות שלקוחות כתבו בטופס המשוב · '
               || v_lri || to_char(v_with_note, 'FM999,999,999') || v_pdi || ' הערות מתוך '
               || v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi
               || ' משובים שהושלמו, כל הזמנים · הוצאו: משובים שנשלחו ולא נענו ומשובים בלי טקסט. הדף אינו מגיב למסנן התקופה — הוא מציג את תוצאת כל ריצות-הניתוח שאושרו.',
      'excluded', jsonb_build_object('משוב שהושלם בלי טקסט', v_completed - v_with_note)),
    'window', jsonb_build_object(
      'from', v_from, 'to', v_to,
      'label', 'כל הזמנים · נכון ל-' || v_lri || to_char(v_today, 'DD/MM/YYYY') || v_pdi),
    'tiles', jsonb_build_array(
      jsonb_build_object(
        'key', 'free_notes',
        'label', 'הערות חופשיות שנכתבו',
        'value', v_with_note,
        'format', 'int',
        'sub', 'מתוך ' || v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' משובים שהושלמו ('
               || v_lri || coalesce(to_char(round(100.0 * v_with_note / nullif(v_completed, 0), 1), 'FM999990.0'), '—')
               || '%' || v_pdi || ' כתבו משהו) · ' || v_lri || to_char(v_distinct, 'FM999,999,999') || v_pdi || ' נוסחים שונים',
        'detail', jsonb_build_object('notes', v_with_note, 'completed', v_completed, 'distinct_notes', v_distinct),
        'window', 'כל הזמנים · נכון ל-' || v_lri || to_char(v_today, 'DD/MM') || v_pdi,
        'compare', jsonb_build_object(
          'value', null,
          'label', 'אין תקופה קודמת להשוואה — זהו המצאי המצטבר, לא מדד תקופתי',
          'direction', 'flat'),
        'target', null),
      jsonb_build_object(
        'key', 'other_tagged_notes',
        'label', 'מהן שייכות למשוב שתויג "אחר"',
        'value', v_other,
        'format', 'int',
        'sub', case when v_other_txt = v_other
                    then 'לכל ' || v_lri || to_char(v_other, 'FM999,999,999') || v_pdi || ' יש טקסט — אין ולו אחת ריקה'
                    else v_lri || to_char(v_other_txt, 'FM999,999,999') || v_pdi || ' מתוך ' || v_lri || to_char(v_other, 'FM999,999,999') || v_pdi
                         || ' נושאות טקסט' end,
        'detail', jsonb_build_object('other', v_other, 'with_text', v_other_txt,
                                     'by_year', v_other_yr, 'sample_quotes', v_quotes),
        'window', 'כל הזמנים · נכון ל-' || v_lri || to_char(v_today, 'DD/MM') || v_pdi,
        'compare', jsonb_build_object('value', v_other, 'label', 'פילוח לפי שנה', 'direction', 'up'),
        'target', null),
      jsonb_build_object(
        'key', 'other_vs_categories',
        'label', 'גודל "אחר" מול הקטגוריות',
        'value', v_other,
        'format', 'int',
        'sub', '"אחר" מול ארבע הקטגוריות הקיימות יחד (' || v_lri || to_char(v_rest, 'FM999,999,999') || v_pdi || ')',
        'detail', jsonb_build_object('other', v_other, 'categories', v_rest, 'negative_total', v_other + v_rest),
        'window', 'כל הזמנים · נכון ל-' || v_lri || to_char(v_today, 'DD/MM') || v_pdi,
        'compare', jsonb_build_object(
          'value', v_rest,
          'label', 'מתוך ' || v_lri || to_char((v_other + v_rest), 'FM999,999,999') || v_pdi || ' המשובים השליליים בסך הכול',
          'direction', case when v_other > v_rest then 'up' when v_other < v_rest then 'down' else 'flat' end),
        'target', null),
      jsonb_build_object(
        'key', 'red_flags',
        'label', 'דגלים אדומים',
        -- 🔴 **`null` ולא `0`** — אפס כאן היה נקרא "אין בעיות", וזו אמירה שאיש לא בדק.
        'value', case when v_run.run_id is null then null else v_flags end,
        'format', case when v_run.run_id is null then 'text' else 'int' end,
        'sub', case when v_run.run_id is null
                    then 'טרם אושרה ריצה — לא 0. אפס כאן היה נקרא "אין בעיות", וזו אמירה שאיש לא בדק'
                    else 'מתוך ' || v_lri || to_char(v_classified, 'FM999,999,999') || v_pdi || ' הערות מסווגות · '
                         || v_lri || to_char(v_unclass, 'FM999,999,999') || v_pdi || ' לא ניתן לסווג'
                         || case when v_run_cnt > 1
                                 then ' · ' || v_lri || to_char(v_run_cnt, 'FM999,999,999') || v_pdi || ' ריצות מאושרות'
                                 else '' end end,
        'detail', jsonb_build_object(
          'red_flags', case when v_run.run_id is null then null else v_flags end,
          'classified', case when v_run.run_id is null then null else v_classified end,
          'unclassifiable', case when v_run.run_id is null then null else v_unclass end,
          'free_topics', v_free,
          'free_topics_singletons', case when v_run.run_id is null then null else v_free_one end,
          'models', case when v_run.run_id is null then null else v_models_j end),
        'window', case
          when v_run.run_id is null then '—'
          when v_run_cnt = 1
            then 'הריצה מ-' || v_lri
                 || to_char(v_run.approved_at at time zone 'Asia/Jerusalem', 'DD/MM/YYYY') || v_pdi
          else v_lri || to_char(v_run_cnt, 'FM999,999,999') || v_pdi || ' ריצות מאושרות · האחרונה מ-' || v_lri
               || to_char(v_run.approved_at at time zone 'Asia/Jerusalem', 'DD/MM/YYYY') || v_pdi end,
        'compare', jsonb_build_object('value', null, 'label', 'יימדד אחרי הריצה הראשונה', 'direction', 'flat'),
        'target', null)),
    -- §📊 לדוח 20: *"עמודות לפי נושא (מודל) לצד עמודות לפי תגית (לקוח) — ההשוואה היא הגרף"*.
    -- בלי ריצה מאושרת אין מה להשוות, ולכן `null` — ולא גרף ריק שנראה כמו תקלה.
    'chart', case when v_run.run_id is null then null else jsonb_build_object(
      'type', 'bar',
      'title', 'מטריצת ההסכמה · מה הלקוח תייג מול מה המודל מצא · מתוך '
               || v_lri || to_char(v_classified, 'FM999,999,999') || v_pdi || ' הערות מסווגות',
      'series', jsonb_build_array(
        jsonb_build_object('key', 'total',          'label', 'תויג ע"י הלקוח'),
        jsonb_build_object('key', 'agreed',         'label', 'המודל הסכים'),
        jsonb_build_object('key', 'unclassifiable', 'label', 'לא ניתן לסווג')),
      'data', v_matrix,
      'xKey', 'human_tag',
      -- ✅ **הסינון-הצולב של הכרטיס** ①: *"הטבלה מתכווצת להערות שבצירוף תגית×נושא"*.
      -- נמסר **ברמת-התגית** ולא ברמת-התא: המעטפת בוחרת ערך אחד (`datum[xKey]`)
      -- ומשווה אותו לשדה-שורה אחד, ואין בה בחירת-צירוף דו-ממדית. ⇒ לחיצה
      -- על עמודת "אחר" מכווצת ל-33 ההערות שהלקוח תייג "אחר", וטור-הנושא
      -- של המודל (`model_topics`) נקרא בעין בתוך הטבלה המכווצת.
      -- **פער-תא מדווח לפזה 4, לא הוכרע כאן.** כיסוי מדוד: חמישה דאטומים,
      -- חמישה עם שורות (12 · 10 · 6 · 2 · 33 = 63 מתוך 426).
      'filter_key', 'human_tag',
      'domain', null,
      'refLines', '[]'::jsonb,
      'unit', 'הערות') end,
    'columns', jsonb_build_array(
      jsonb_build_object('key', 'company_name',     'label', 'לקוח',            'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'final_event_date', 'label', 'תאריך',           'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'feedback_score',   'label', 'ציון (לקוח)',     'format', 'int',  'align', 'end'),
      jsonb_build_object('key', 'feedback_notes',   'label', 'ההערה שנכתבה',    'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'model_topics',     'label', 'נושא (מודל)',     'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'free_topic',       'label', 'תג חופשי (מודל)', 'format', 'text', 'align', 'start'),
      jsonb_build_object('key', 'sentiment',        'label', 'סנטימנט (מודל)',  'format', 'int',  'align', 'end'),
      -- 📐9 · הטבלה ממוינת דגל-אדום תחילה ואז תאריך יורד.
      jsonb_build_object('key', 'red_flag',         'label', 'דגל אדום',        'format', 'text', 'align', 'start',
                         'sorted', 'descending')),
    'rows', v_rows,
    -- 📐23 · כשאין ריצה, האמירה היא **מה חסר** — ולא ממצא-מודל מומצא (⑧22.2).
    'so_what', case
      when v_run.run_id is null
        then 'להריץ את הניתוח על ' || v_lri || to_char(v_with_note, 'FM999,999,999') || v_pdi || ' ההערות — '
             || v_lri || to_char(v_other, 'FM999,999,999') || v_pdi
             || ' מהן שייכות למשובים שתויגו "אחר", והן הדלי השלילי הגדול במערכת ואיש עדיין לא קרא אותן.'
      when v_top_pair is null
        then 'לעבור על ' || v_lri || to_char(v_classified, 'FM999,999,999') || v_pdi
             || ' ההערות המסווגות — המודל לא מצא ולו נושא אחד ששונה ממה שהלקוח תייג.'
      else 'לשקול קטגוריה חדשה בטופס-המשוב — המודל מצא "' || (v_top_pair ->> 'model_topic')
           || '" ב-' || v_lri || to_char((v_top_pair ->> 'n')::integer, 'FM999,999,999') || v_pdi || ' הערות שהלקוח תייג "'
           || (v_top_pair ->> 'human_tag') || '".' end,
    'definitions', 'הגדרות: הערה חופשית = טקסט שהלקוח כתב בשדה הפתוח של טופס המשוב, בנוסף לציון ולסיבה · ריצת ניתוח = מעבר של מודל שפה על ההערות, באצווה ולא בזמן אמת. הוא מקבל טקסט וציון בלבד — לא שם לקוח ולא סכומים · ריצה מאושרת = ריצה שמישהו בדק בה 20 דוגמאות ואישר להצגה. הדוח מציג רק ריצות מאושרות · נושא (מודל) = הקטגוריה שהמודל בחר, מתוך אותה רשימה סגורה שהלקוח בוחר ממנה — כדי שאפשר יהיה להשוות · תג חופשי = מילה–שתיים שהמודל מוסיף כשהוא מסווג "אחר", כדי שנדע מה "אחר" מכיל · לא ניתן לסווג = המודל לא הצליח לשייך את ההערה לאף קטגוריה. זו תשובה תקינה, לא תקלה · דגל אדום = הערה שהמודל סימן כדורשת התייחסות מיידית.',
    'drill', null,
    'meta', jsonb_build_object(
      'measured_at', now(),
      'missing_params', '[]'::jsonb,
      'frozen_count', null,
      'notes', v_notes,
      -- C8: *"`meta.export_blocked_reason` — report 22 before an approved run"*, בנוסח
      -- הנעול של `EXPORT_NO_APPROVED_RUN` (`src/lib/reportsExport.js`), מילה במילה.
      'export_blocked_reason', case when v_run.run_id is null
                                    then 'אין שורות לייצא — טרם אושרה ריצת-ניתוח'
                                    else null end,
      'customer_filter_ignored', jsonb_build_array(
        'free_notes', 'other_tagged_notes', 'other_vs_categories'),
      'drill_echo', p_drill,
      'models', v_models_j,
      -- הריצה הלא-מאושרת האחרונה — **לפס של מ25 בלבד**. `null` כשאין אחת.
      'run_in_progress', v_prog,
      'run', v_run_json));
end;
$function$;

comment on function public.report_m22_notes(date, date, integer, jsonb) is
  'ניתוח הערות (מ22) — קריאה בלבד, מגודר על מודול לקוחות. אוכלוסייה: הערות חופשיות שלקוחות כתבו בטופס המשוב, כל הזמנים; הוצאו משובים שנשלחו ולא נענו ומשובים בלי טקסט. הדוח מציג שורות מכל ריצות-הסיווג שאושרו, שורה אחת לכל פרויקט (המאושרת האחרונה גוברת); בלי ריצה מאושרת הוא מחזיר rows ריק, meta.run ריק, meta.export_blocked_reason נעול, ואריח הדגלים האדומים מחזיר null ולא 0. שלושת אריחי המצאי אינם מגיבים למסנן הלקוח; אריח הדגלים האדומים והטבלה כן. הדף אינו מגיב למסנן התקופה.';

revoke execute on function public.report_m22_notes(date, date, integer, jsonb) from public, anon, authenticated;
grant  execute on function public.report_m22_notes(date, date, integer, jsonb) to authenticated;
