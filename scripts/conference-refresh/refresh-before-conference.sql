-- ============================================================================
-- 🔴 רענון-זריעה לפני הכנס — להריץ ב-14/10/2026, יום לפני. חובה.
--
-- למה: הנתונים תלויי-זמן, ושלוש עבודות pg_cron רצות כל לילה:
--   · module3-quote-expiry  (01:00 UTC) — הצעה ב-`in_progress` שלא עודכנה
--     `ימי_תוקף_הצעה` ימים (=30) הופכת ל-`rejected` "פג תוקף"
--   · module6-event-finished (02:00 UTC) — פרויקט שתאריכו חלף → `event_finished`
--   · module1-login-attempts-cleanup (01:30 UTC) — לא נוגע לתצוגה
--
-- ⚠️ נמדד 10/09/2026: **כל 33 ההצעות הפתוחות יפוגו לפני 15/10.** בלי הרענון
--    מסך-הבית יציג ביום הכנס **"הצעות ממתינות: 0"** וצינור-המכירות ייראה מת.
--
-- 🔴 **הכלל, והוא לא "יום לפני הכנס":** הרענון חייב לרוץ **לפני** ש-`updated_at` +
--    `ימי_תוקף_הצעה` חולף על ההצעה הוותיקה ביותר. אחרי הרגע הזה עבודת-הלילה כבר הפכה
--    אותן ל"פג תוקף", ורענון שנוגע רק ב-`in_progress` לא ימצא אף שורה.
--    ⇒ **לפני כל ריצה, בדוק מתי התפוגה הקרובה** (שאילתת-העזר בסוף הקובץ).
--
-- 📏 **היסטוריית ריצות:**
--   · 24/09/2026 11:33 UTC — ריצה מוקדמת של שלב ① (הסגן, בטרנזקציה עם שער: 33 לפני, 33
--     אחרי). **הסיבה:** כל 33 ההצעות נשאו `updated_at` = 09/09/2026 23:32 UTC ⇒ היו פגות
--     בעבודת-הלילה של 10/10 01:00 UTC — ארבעה ימים *לפני* הריצה המתוכננת של 14/10, שהייתה
--     מעדכנת 0 שורות ומדווחת "0 פגות" כאילו הצליחה. **אחרי הריצה: התפוגה ב-24/10.**
--     (התגלה בכתיבת תסריט-ההדגמה, `docs/guides/conference-demo-script.md` §2.)
--   · 14/10/2026 — הריצה המתוכננת. היא הקובעת איך ההצעות ייראו ביום הכנס.
--     ‏🔴 **ושלב ④ רץ בה לראשונה — למדוד מחדש את `v_expected_*` שלו לפני הריצה.**
--
-- 🔑 **למה זה עובד, וזה לא מובן-מאליו:** טריגר על `quotes` דורס את `updated_at`
--    ומציב `now()` בכל עדכון. ⇒ **אי-אפשר לצייר תאריך עתידי מראש** (נוסה
--    10/09 ונכשל) — אבל *כל* נגיעה בשורה ביום הרענון מאפסת את שעון-התפוגה.
--    לכן הסקריפט אינו מחשב תאריכים: הוא רק נוגע בשורות, והטריגר עושה את השאר.
--
-- 🚫 מה הוא לא עושה: אינו נוגע בהיסטוריה, אינו משנה סטטוסים, אינו ממציא ישויות —
--    ✏️ **חוץ משלב ④ (נוסף 24/09/2026):** הוא סוגר אירועים שעברו לפני יותר משבוע. כלומר כותב נוכחות
--    ושעות, ומעביר את האירוע ל"ממתין לחשבונית", בדיוק כמו הזריעה. גיבוי לפני הכתיבה, ר' שם.
-- ============================================================================

-- ⓪+① שער ורענון — **בלוק אחד, בכוונה.** ⓪ ו-① יושבים באותו `do`, כך שכשל בשער עוצר
--    את הרענון בכל כלי-הרצה. (בקבצים נפרדים זה תלוי בכלי: psql בלי `ON_ERROR_STOP`
--    ממשיך לפקודה הבאה אחרי שגיאה.)
--
-- ⓪ השער. 🔴 **למה הוא קיים:** הבדיקה ② סופרת הצעות פתוחות שעומדות לפוג — ומחזירה 0 גם
--    כשאין הצעות פתוחות בכלל. "0" של רענון שהצליח ו-"0" של רענון שאיחר נראים זהים.
--    ⇒ השער סופר את ההצעות הפתוחות **לפני** הנגיעה, ועוצר אם יש פחות מהצפוי.
--    ✏️ **`v_expected` = 33, נמדד 24/09/2026.** שינוי מכוון במספר ההצעות הפתוחות (הצעה
--    שנוספה או אושרה) ⇒ לעדכן כאן, עם תאריך. אחרת — השער צודק, ולא עוקפים אותו.
do $refresh$
declare
  v_expected constant int := 33;
  v_open int;
  v_touched int;
begin
  select count(*) into v_open from public.quotes where quote_status = 'in_progress';

  if v_open = 0 then
    raise exception 'אין אף הצעה פתוחה — הרענון לא יעזור. ההצעות כנראה כבר פגו (עבודת-הלילה module3-quote-expiry הפכה אותן ל"פג תוקף"). צריך קודם לשחזר אותן לסטטוס in_progress, ורק אז לרענן.'
      using errcode = 'P0001';
  elsif v_open < v_expected then
    raise exception 'יש % הצעות פתוחות, והצפי הוא %. ייתכן שחלקן כבר פגו — הרענון לא יחזיר אותן. לבדוק אילו עברו ל"פג תוקף" ולשחזר; או, אם השינוי מכוון, לעדכן את v_expected בקובץ הזה.',
      v_open, v_expected
      using errcode = 'P0001';
  end if;

  -- ① מרענן את שעון-התפוגה של כל ההצעות הפתוחות. no-op לוגי, אפקט אמיתי.
  update public.quotes set notes = notes where quote_status = 'in_progress';
  get diagnostics v_touched = row_count;

  if v_touched <> v_open then
    raise exception 'הרענון נגע ב-% הצעות במקום ב-% — עוצר, והעדכון מתבטל.', v_touched, v_open
      using errcode = 'P0001';
  end if;

  raise notice 'רוענו % הצעות פתוחות.', v_touched;
end
$refresh$;

-- ② אימות ① — עובר רק אם open_quotes = 33 **וגם** expiring_before_conference = 0.
--    🔴 שתי העמודות יחד: 0 פגות לבדו עובר גם כשאין הצעות פתוחות בכלל (ר' ⓪).
select count(*) as open_quotes,
       count(*) filter (
         where updated_at < date '2026-10-15'
               - ((select param_value from public.params where param_name = 'ימי_תוקף_הצעה')::int
                  * interval '1 day')
       ) as expiring_before_conference
  from public.quotes
 where quote_status = 'in_progress';

-- ③ מצב הלוח ביום הכנס. עובר: ≥12 אירועים בחלון, ופחות משליש חסרי-דיילות.
--    ✏️ 24/09/2026: חסר כאן `from staffing` — השאילתה נפלה על "column approved does not exist".
with staffing as (
  select p.project_id, p.required_hostess_count req,
         count(*) filter (where a.assignment_status = 'finally_approved') approved
    from public.projects p
    left join public.assignments a on a.project_id = p.project_id
   where p.project_status <> 'cancelled'
     and p.final_event_date between date '2026-10-15' and date '2026-11-15'
   group by p.project_id, p.required_hostess_count
)
select count(*) events_in_view,
       count(*) filter (where approved < req) short_staffed,
       round(100.0 * count(*) filter (where approved < req) / nullif(count(*),0), 0) pct_short
  from staffing;

-- ④ סגירה תפעולית של אירועים שעברו לפני יותר משבוע. ✏️ נוסף 24/09/2026 (הסגן; טיוטת היועץ).
--    🔑 למה: הכרעת-ישי 24/09 ("גג שבוע סוגרים אירוע"). ⇐ ביום הכנס (15/10) אף אירוע מלפני 08/10 לא עומד
--    "ממתין לסגירה" בלי שעות. אחרת אין לו עלות-דיילות, ושולי-הרווח (מ2 · מ4 · מ8) ושכר-החודש (מ7) מנופחים.
--    אותה שיטה בדיוק כמו `supabase/migrations/20260924233000_seed_close_events_2026_09.sql` (שם ה-why המלא:
--    `close_project_operationally` + `seed_backdate_project`, נוסחאות `plan.mjs`, קירוב-הנוכחות המוצהר).
--    הטווח: `final_event_date` בין 17/09/2026 ל-07/10/2026 (ביום הכנס "לפני יותר מ-7 ימים" = עד 07/10).
--
-- 🔴🔴 **לפני הריצה ב-14/10: למדוד מחדש את `v_expected_projects` ואת `v_expected_rows`** (שאילתת-העזר בסוף
--    השלב) ולעדכן אותם כאן, עם תאריך. 📏 נמדד 24/09/2026: 15 פרויקטים (6 event_finished · 7 ready · 2
--    in_progress; עבודת-הלילה `module6-event-finished` תעביר את כולם ל-event_finished כשתאריכם יעבור) ·
--    76 זימונים מאושרים-סופית · 0 בלי דיילת מאושרת · כולם ב-`seed_registry` · 1620 לא בטווח.
--    שיבוץ שישתנה עד אז (דיילת שנוספה או בוטלה) משנה את המספרים. השער צודק, ולא עוקפים אותו.
-- 🚫 פרויקט בלי אף דיילת מאושרת-סופית — מדלגים, כמו הזריעה (`demo-seed.mjs:278`, "נשאר ממתין לסגירה").
-- ⏳ **הלוגיסטיקה של הטווח — לא בשלב הזה, בכוונה:** 2 שורות-ציוד "מוכן" עם "הגיע" = 0 (1594 SAT-LAN 420 ·
--    1597 FAB-LAN 100, מאותה ריצת-אופק של 10/09) מתוקנות מראש ב-
--    `supabase/migrations/20260924234000_seed_logistics_arrived_horizon_rest.sql` (הסגן, #1: "מתקנים עכשיו,
--    לא ב-14/10"; ממתין להחלה). ⇐ שלב ④ לא נוגע בלוגיסטיקה.
-- 🛟 שחזור: `scripts/seed-focused/2026-09-24-close-events-restore.sql`, עם הטבלאות `…_20261014` ועם מספר
--    הפרויקטים של הריצה במקום 20 (השערים שם כתובים ל-20).
do $close_refresh$
declare
  c_batch    constant text := 'seed-close-2026-10-14';
  c_from     constant date := '2026-09-17';
  c_to       constant date := '2026-10-07';
  v_expected_projects constant int := 15;   -- ✏️ לעדכן ב-14/10
  v_expected_rows     constant int := 76;   -- ✏️ לעדכן ב-14/10
  v_ids int[];
  v_n int; v_n2 int; v_closed int := 0;
  v_ef_before int; v_ai_before int; v_ef_after int; v_ai_after int;
  r record; v_ph numeric; v_guests int; v_lag int; v_rows jsonb;
begin
  -- ⓪ השער.
  select array_agg(p.project_id order by p.project_id) into v_ids
    from public.projects p
   where p.project_status = 'event_finished' and p.operationally_closed_at is null
     and p.final_event_date between c_from and c_to and p.project_id <> 1620
     and exists (select 1 from public.assignments a where a.project_id = p.project_id and a.assignment_status = 'finally_approved');
  v_n := coalesce(array_length(v_ids, 1), 0);
  select count(*) into v_n2
    from (select distinct on (a.project_id, a.hostess_id) a.assignment_status
            from public.assignments a where a.project_id = any(v_ids)
           order by a.project_id, a.hostess_id, a.assignment_number desc) l
   where l.assignment_status = 'finally_approved';
  if v_n <> v_expected_projects or v_n2 <> v_expected_rows then
    raise exception 'refresh ④: צפוי % פרויקטים ו-% זימונים, נמצאו % ו-% — למדוד ולעדכן את v_expected_*, או לברר למה.',
      v_expected_projects, v_expected_rows, v_n, v_n2;
  end if;

  -- ① הגיבוי — לפני כל כתיבה.
  execute format('create table seed_snapshot.projects_close_20261014 as select p.* from public.projects p where p.project_id = any(%L::int[])', v_ids);
  execute 'create table seed_snapshot.assignments_close_20261014 as select a.* from public.assignments a where a.project_id in (select project_id from seed_snapshot.projects_close_20261014)';
  execute 'create table seed_snapshot.customer_hostess_preference_close_20261014 as select c.* from public.customer_hostess_preference c where exists (select 1 from seed_snapshot.assignments_close_20261014 a join seed_snapshot.projects_close_20261014 p on p.project_id = a.project_id where a.assignment_status = ''finally_approved'' and a.hostess_id = c.hostess_id and p.customer_id = c.customer_id)';
  execute 'revoke all on seed_snapshot.projects_close_20261014, seed_snapshot.assignments_close_20261014, seed_snapshot.customer_hostess_preference_close_20261014 from public, anon, authenticated';

  -- ② הסגירה — זהה ל-③ של `20260924233000_seed_close_events_2026_09.sql`, עם c_batch וטבלאות-הגיבוי של 14/10.
  perform set_config('request.jwt.claims', json_build_object('email', 'ishay1997@gmail.com', 'role', 'authenticated')::text, true);
  select count(*) filter (where project_status = 'event_finished'), count(*) filter (where project_status = 'awaiting_invoice')
    into v_ef_before, v_ai_before from public.projects;

  for r in
    select p.project_id, p.final_event_date, p.final_start_time, p.final_end_time, q.estimated_guests
      from seed_snapshot.projects_close_20261014 p left join public.quotes q on q.quote_id = p.quote_id
     order by p.project_id
  loop
    v_ph := round(((extract(epoch from (r.final_end_time - r.final_start_time)) / 3600.0 + 24)::numeric % 24), 2)
            + (array[-0.5, 0, 0, 0, 0.5, 1])[1 + floor(6 * (('x' || substr(md5(c_batch || '|' || r.project_id || '|ph'), 1, 8))::bit(32)::bigint / 4294967296.0))::int];
    v_guests := greatest(0, round(coalesce(r.estimated_guests, 0)
                  * (0.8 + 0.25 * (('x' || substr(md5(c_batch || '|' || r.project_id || '|guests'), 1, 8))::bit(32)::bigint / 4294967296.0))))::int;
    v_lag := 1 + floor(4 * (('x' || substr(md5(c_batch || '|' || r.project_id || '|lag'), 1, 8))::bit(32)::bigint / 4294967296.0))::int;

    select jsonb_agg(jsonb_build_object(
             'hostess_id', f.hostess_id, 'assignment_number', f.assignment_number,
             'attendance_status', o.attendance_status, 'lateness_level', o.lateness_level, 'no_show_reason', o.no_show_reason,
             'actual_hours', case when o.attendance_status = 'no_show' then 0 else v_ph + (array[0, 0, 0, 0.5, -0.5])[1 + floor(5 * f.u_hrs)::int] end,
             'preference', case when o.attendance_status = 'no_show' then null when f.u_pref < 0.20 then 'מצוינת' when f.u_pref < 0.98 then 'בסדר' else 'לא_לשלוח' end,
             'preference_reason', case when o.attendance_status <> 'no_show' and f.u_pref >= 0.98
                                       then (array['הלקוח ביקש לא לשבץ שוב — יחס לאורחים', 'איחרה פעמיים אצל הלקוח הזה'])[1 + floor(2 * f.u_why)::int] end)
             order by f.hostess_id)
      into v_rows
      from (select l.hostess_id, l.assignment_number,
                   ('x' || substr(md5(c_batch || '|' || r.project_id || '|' || l.hostess_id || '|att'),  1, 8))::bit(32)::bigint / 4294967296.0 as u_att,
                   ('x' || substr(md5(c_batch || '|' || r.project_id || '|' || l.hostess_id || '|hrs'),  1, 8))::bit(32)::bigint / 4294967296.0 as u_hrs,
                   ('x' || substr(md5(c_batch || '|' || r.project_id || '|' || l.hostess_id || '|pref'), 1, 8))::bit(32)::bigint / 4294967296.0 as u_pref,
                   ('x' || substr(md5(c_batch || '|' || r.project_id || '|' || l.hostess_id || '|why'),  1, 8))::bit(32)::bigint / 4294967296.0 as u_why
              from (select distinct on (a.hostess_id) a.hostess_id, a.assignment_number, a.assignment_status
                      from public.assignments a where a.project_id = r.project_id
                     order by a.hostess_id, a.assignment_number desc) l
             where l.assignment_status = 'finally_approved') f
      cross join lateral (
        select d.attendance_status, d.lateness_level, d.no_show_reason
          from (select s.*, sum(s.n) over (order by s.attendance_status, s.lateness_level nulls first, s.no_show_reason nulls first) as cum,
                       sum(s.n) over () as tot
                  from (select h.attendance_status, h.lateness_level, h.no_show_reason, count(*) as n
                          from public.assignments h
                         where h.attendance_status is not null
                           and h.project_id not in (select project_id from seed_snapshot.projects_close_20261014)
                           and (h.hostess_id = f.hostess_id
                                or (select count(*) from public.assignments x
                                     where x.hostess_id = f.hostess_id and x.attendance_status is not null
                                       and x.project_id not in (select project_id from seed_snapshot.projects_close_20261014)) < 3)
                         group by 1, 2, 3) s) d
         where d.cum > f.u_att * d.tot order by d.cum limit 1) o;

    perform public.close_project_operationally(r.project_id, v_ph, v_guests,
      'seed/close-2026-10-14/p' || r.project_id || '_summary-report.pdf', v_rows);
    -- ⚠️ תאריך-סגירה = האירוע + 1–4 ימים — ובלבד שאינו אחרי היום (אירוע של 06/10 + 4 = 10/10 < 14/10 ✓).
    perform public.seed_backdate_project(r.project_id,
      p_operationally_closed_at => least(((r.final_event_date + v_lag) + time '12:30') at time zone 'Asia/Jerusalem', now()));
    v_closed := v_closed + 1;
  end loop;

  -- ③ "בדיוק מה שצפוי".
  select count(*) filter (where project_status = 'event_finished'), count(*) filter (where project_status = 'awaiting_invoice')
    into v_ef_after, v_ai_after from public.projects;
  if v_closed <> v_expected_projects or v_ef_after <> v_ef_before - v_expected_projects or v_ai_after <> v_ai_before + v_expected_projects then
    raise exception 'refresh ④: נסגרו %; event_finished % ⇐ %; awaiting_invoice % ⇐ % — עוצר.', v_closed, v_ef_before, v_ef_after, v_ai_before, v_ai_after;
  end if;
  select count(*) into v_n from public.assignments a
   where a.project_id in (select project_id from seed_snapshot.projects_close_20261014) and a.attendance_status is not null;
  if v_n <> v_expected_rows then
    raise exception 'refresh ④: % זימונים קיבלו נוכחות, צפוי % — עוצר.', v_n, v_expected_rows;
  end if;
  raise notice 'refresh ④: נסגרו % אירועים, % זימונים קיבלו נוכחות.', v_closed, v_n;
end
$close_refresh$;

-- שאילתת-העזר (קריאה בלבד) — להריץ ב-14/10 לפני הבלוק, ולעדכן את v_expected_*:
-- select count(*) as projects,
--        (select count(*) from (select distinct on (a.project_id, a.hostess_id) a.assignment_status
--                                 from public.assignments a join public.projects p2 on p2.project_id = a.project_id
--                                where p2.project_status = 'event_finished' and p2.operationally_closed_at is null
--                                  and p2.final_event_date between '2026-09-17' and '2026-10-07' and p2.project_id <> 1620
--                                order by a.project_id, a.hostess_id, a.assignment_number desc) l
--          where l.assignment_status = 'finally_approved') as rows
--   from public.projects p
--  where p.project_status = 'event_finished' and p.operationally_closed_at is null
--    and p.final_event_date between '2026-09-17' and '2026-10-07' and p.project_id <> 1620
--    and exists (select 1 from public.assignments a where a.project_id = p.project_id and a.assignment_status = 'finally_approved');

-- ⑤ אופק-ההזמנות. ⚠️ נמדד 10/09: האחרון הוא 29/11/2026 — 45 יום בלבד אחרי
--    הכנס, ודצמבר ריק. אם זה עדיין המצב — לזרוע 8–12 אירועים בדצמבר–ינואר.
select max(final_event_date) last_event_in_system,
       count(*) filter (where final_event_date > date '2026-11-15') events_beyond_a_month
  from public.projects where project_status <> 'cancelled';

-- ⑥ ואז להריץ את שמונת מבחני-הקוהרנטיות:
--    docs/specs/module_11_reports/seed-coherence-tests.md

-- 🔎 שאילתת-עזר, קריאה-בלבד: **מתי התפוגה הקרובה?** להריץ לפני כל ריצה של הקובץ,
--    ובכל פעם שתאריך-הכנס זז. עבודת-הלילה הראשונה (01:00 UTC) שאחרי `first_expiry_after`
--    תתחיל להפוך הצעות ל"פג תוקף" — הרענון חייב לרוץ לפניה.
-- select min(updated_at) + ((select param_value from public.params
--                            where param_name = 'ימי_תוקף_הצעה')::int * interval '1 day') first_expiry_after,
--        count(*) open_quotes
--   from public.quotes where quote_status = 'in_progress';
