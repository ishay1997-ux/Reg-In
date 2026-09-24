-- why: הכרעת-ישי, 24/09/2026 (צ'אט הסגן, ~21:5X), מילה-במילה: *"לדעתי בסגירת אירוע השעות אמורות להסגר
--      נראלי גג שבוע סוגרים אירוע? נשמע סביר? ובטח שסוף חודש צריך לסגור זריז כדי להעביר דוח בזמן לרואה
--      חשבון ולשלם בזמן ב10 לחודש לא?"* ⇐ הסגן: אירוע שעבר לפני יותר מ-7 ימים — השעות שלו מוזנות.
--      📏 הבעיה (מעבר-הדוחות, 24/09, אומת במסד): 26 אירועים בסטטוס `event_finished` (31/08–23/09) ללא שעה אחת
--         וללא נוכחות ⇒ בלי עלות-דיילות ⇒ שולי-הרווח במ2 59.1% (על 222 האירועים עם שעות: 57.3%), 14 מ-15 עמודות
--         "הסטיות הגדולות" במ8, ושני אריחי-החודש במ7 = 0. הזריעה (03/09) לא סגרה אירועים שתאריכם עוד לא עבר.
-- what: **סגירה תפעולית של 20 האירועים 31/08–16/09 — באותה שיטה שבה הזריעה סגרה את כל השאר** (הסגן, #1 "א"):
--       · הפונקציה: `close_project_operationally` — בדיוק מה ש-`scripts/demo-seed.mjs` `closeAndSettle` (שורות 264–290)
--         קורא לו. היא כותבת: `projects` (שעות · אורחים · דוח-סיכום · סטטוס ⇐ `awaiting_invoice` · סוגר) ·
--         `assignments` (נוכחות · איחור · סיבת-היעדרות · שעות) · `customer_hostess_preference` (upsert). **ושום דבר אחר.**
--       · הנוסחאות (`scripts/seed-lib/plan.mjs`): שעות-האירוע = שעות-המשמרת + אחד מ-[-0.5, 0, 0, 0, 0.5, 1] (שורה 814) ·
--         אורחים = המוערך בהצעה × 0.8–1.05 (815) · שעות-דיילת = שעות-האירוע + אחד מ-[0, 0, 0, 0.5, -0.5], ‏0 למי שלא הגיעה
--         (1169–1172) · סימון-איכות 20 "מצוינת" / 78 "בסדר" / 2 "לא_לשלוח" + אחת משתי הסיבות (1174–1181) ·
--         תאריך-הסגירה = האירוע + 1–4 ימים, 12:30 שעון-ישראל (811 · `demo-seed.mjs` `atLocal(closedAt, 12, 30)`),
--         דרך `seed_backdate_project` — אותה פונקציה שהזריעה משתמשת בה.
--       · ⚠️ **קירוב מוצהר (הסגן אישר):** בזריעה הנוכחות נקבעת מ"פרופיל" הדיילת (`plan.mjs:253–306`), והפרופיל **לא
--         שמור במסד**. כאן: לפי **ההתפלגות ההיסטורית של הדיילת עצמה** (הגיעה · איחרה קל/בינוני/כבד · לא-הגיעה
--         ghosted/sick/approved_absence), ומי שיש לה פחות מ-3 סימוני-נוכחות — לפי ההתפלגות הכללית (11 בלי היסטוריה,
--         8 עם 1–2, נמדד 24/09). האירועים שנסגרים כאן **מוחרגים מההיסטוריה**, כדי שסדר-הלולאה לא ישנה תוצאה.
--       · ⚠️ ובזריעה חלק מהזימונים הפכו ל-`approval_withdrawn` ברגע-הסגירה — **לא כאן**: `close_project_operationally`
--         אינו נוגע בסטטוס-הזימון.
--       · **קבוע (deterministic):** כל הגרלה = `md5('seed-close-2026-09-24|<פרויקט>|<דיילת>|<מה>')` ⇒ הרצה חוזרת
--         על אותו מצב נותנת אותה תוצאה.
--       · 🔑 **זהות:** `set_config('request.jwt.claims', …)` של `ishay1997@gmail.com` (מנכ"ל) בתוך הטרנזקציה בלבד —
--         **זריעה סינתטית, אותה זהות שסגרה 716 מתוך 717 האירועים הסגורים** (נמדד 24/09). ‏`close_project_operationally`
--         דורשת 'פרויקטים' edit, ו-`seed_backdate_project` — 'הגדרות מערכת' edit; למנכ"ל שתיהן.
--       · 🚫 **מוחרגים:** 1620 (קפוא עד 15/10; ממילא לא בטווח) · אירועי 17–23/09 (7 הימים האחרונים — "בסגירה") ·
--         תסריט-ההדגמה ותסריט-ה-UAT (`origin/ishay/module-12-reports-review`) לא סוגרים ולא מציגים אף אחד מ-20
--         האירועים כ"ממתין לסגירה" (נבדק 24/09); `e2e/project-closing.spec.js` בוחר רק פרויקט `E2E-*`.
--       · `seed_registry`: אין שורה חדשה — הזריעה רושמת ישויות שנוצרו, וסגירה לא יוצרת ישות. כל 20 כבר רשומים
--         (`entity_type = 'project'`) — וזה גם תנאי של `seed_backdate_project`.
-- 🛟 גיבוי: שלוש טבלאות ב-`seed_snapshot`, **באותה מיגרציה, לפני כל כתיבה** — ר' ②. שחזור: `restore.sql` בתיקייה הזו.
-- 📏 "בדיוק מה שצפוי": ① עוצר אם לפני ≠ 20 פרויקטים / 105 זימונים · ③ עוצר אם אחרי ≠ 20 ⇐ `awaiting_invoice`,
--    105 זימונים עם נוכחות, והמונים הכלליים זזו בדיוק ב-20.
-- reversible: כן, דרך `restore.sql` (חוץ מ-`updated_at`, שטריגר `moddatetime` דורס בכל עדכון).
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

-- ① השער — לפני כל כתיבה.
do $gate$
declare
  v_projects int;
  v_rows int;
begin
  select count(*) into v_projects
    from public.projects p
   where p.project_status = 'event_finished' and p.operationally_closed_at is null
     and p.final_event_date between date '2026-08-31' and date '2026-09-16' and p.project_id <> 1620;
  select count(*) into v_rows
    from (select distinct on (a.project_id, a.hostess_id) a.assignment_status
            from public.assignments a
            join public.projects p on p.project_id = a.project_id
           where p.project_status = 'event_finished' and p.operationally_closed_at is null
             and p.final_event_date between date '2026-08-31' and date '2026-09-16' and p.project_id <> 1620
           order by a.project_id, a.hostess_id, a.assignment_number desc) l
   where l.assignment_status = 'finally_approved';
  if v_projects <> 20 or v_rows <> 105 then
    raise exception 'close-2026-09: צפוי 20 פרויקטים ו-105 זימונים, נמצאו % ו-% — עוצר.', v_projects, v_rows;
  end if;
end
$gate$;

-- ② הגיבוי — השורות שישתנו, במצבן לפני.
create table seed_snapshot.projects_close_20260924 as
  select p.* from public.projects p
   where p.project_status = 'event_finished' and p.operationally_closed_at is null
     and p.final_event_date between date '2026-08-31' and date '2026-09-16' and p.project_id <> 1620;
create table seed_snapshot.assignments_close_20260924 as
  select a.* from public.assignments a
   where a.project_id in (select project_id from seed_snapshot.projects_close_20260924);
create table seed_snapshot.customer_hostess_preference_close_20260924 as
  select c.* from public.customer_hostess_preference c
   where exists (select 1
                   from seed_snapshot.assignments_close_20260924 a
                   join seed_snapshot.projects_close_20260924 p on p.project_id = a.project_id
                  where a.assignment_status = 'finally_approved'
                    and a.hostess_id = c.hostess_id and p.customer_id = c.customer_id);
revoke all on seed_snapshot.projects_close_20260924, seed_snapshot.assignments_close_20260924,
              seed_snapshot.customer_hostess_preference_close_20260924 from public, anon, authenticated;

-- ③ הסגירה + הבדיקה שאחריה.
do $close$
declare
  c_batch constant text := 'seed-close-2026-09-24';
  v_ef_before int; v_ai_before int; v_ef_after int; v_ai_after int;
  v_closed int := 0;
  v_n int;
  r record;
  v_ph numeric;
  v_guests int;
  v_lag int;
  v_rows jsonb;
begin
  perform set_config('request.jwt.claims',
                     json_build_object('email', 'ishay1997@gmail.com', 'role', 'authenticated')::text, true);

  select count(*) filter (where project_status = 'event_finished'),
         count(*) filter (where project_status = 'awaiting_invoice')
    into v_ef_before, v_ai_before from public.projects;

  for r in
    select p.project_id, p.final_event_date, p.final_start_time, p.final_end_time, q.estimated_guests
      from seed_snapshot.projects_close_20260924 p
      left join public.quotes q on q.quote_id = p.quote_id
     order by p.project_id
  loop
    -- שעות-האירוע: המשמרת (חוצה-חצות ⇒ ‎+24) ועוד אחד מ-[-0.5, 0, 0, 0, 0.5, 1].
    v_ph := round(((extract(epoch from (r.final_end_time - r.final_start_time)) / 3600.0 + 24)::numeric % 24), 2)
            + (array[-0.5, 0, 0, 0, 0.5, 1])[1 + floor(6 * (('x' || substr(md5(c_batch || '|' || r.project_id || '|ph'), 1, 8))::bit(32)::bigint / 4294967296.0))::int];
    v_guests := greatest(0, round(coalesce(r.estimated_guests, 0)
                  * (0.8 + 0.25 * (('x' || substr(md5(c_batch || '|' || r.project_id || '|guests'), 1, 8))::bit(32)::bigint / 4294967296.0))))::int;
    v_lag := 1 + floor(4 * (('x' || substr(md5(c_batch || '|' || r.project_id || '|lag'), 1, 8))::bit(32)::bigint / 4294967296.0))::int;

    select jsonb_agg(jsonb_build_object(
             'hostess_id',        f.hostess_id,
             'assignment_number', f.assignment_number,
             'attendance_status', o.attendance_status,
             'lateness_level',    o.lateness_level,
             'no_show_reason',    o.no_show_reason,
             'actual_hours',      case when o.attendance_status = 'no_show' then 0
                                       else v_ph + (array[0, 0, 0, 0.5, -0.5])[1 + floor(5 * f.u_hrs)::int] end,
             'preference',        case when o.attendance_status = 'no_show' then null
                                       when f.u_pref < 0.20 then 'מצוינת'
                                       when f.u_pref < 0.98 then 'בסדר'
                                       else 'לא_לשלוח' end,
             'preference_reason', case when o.attendance_status <> 'no_show' and f.u_pref >= 0.98
                                       then (array['הלקוח ביקש לא לשבץ שוב — יחס לאורחים',
                                                   'איחרה פעמיים אצל הלקוח הזה'])[1 + floor(2 * f.u_why)::int] end)
             order by f.hostess_id)
      into v_rows
      from (select l.hostess_id, l.assignment_number,
                   ('x' || substr(md5(c_batch || '|' || r.project_id || '|' || l.hostess_id || '|att'),  1, 8))::bit(32)::bigint / 4294967296.0 as u_att,
                   ('x' || substr(md5(c_batch || '|' || r.project_id || '|' || l.hostess_id || '|hrs'),  1, 8))::bit(32)::bigint / 4294967296.0 as u_hrs,
                   ('x' || substr(md5(c_batch || '|' || r.project_id || '|' || l.hostess_id || '|pref'), 1, 8))::bit(32)::bigint / 4294967296.0 as u_pref,
                   ('x' || substr(md5(c_batch || '|' || r.project_id || '|' || l.hostess_id || '|why'),  1, 8))::bit(32)::bigint / 4294967296.0 as u_why
              from (select distinct on (a.hostess_id) a.hostess_id, a.assignment_number, a.assignment_status
                      from public.assignments a
                     where a.project_id = r.project_id
                     order by a.hostess_id, a.assignment_number desc) l
             where l.assignment_status = 'finally_approved') f
      cross join lateral (
        -- ההתפלגות: של הדיילת עצמה (3+ סימונים), אחרת הכללית. בלי האירועים שנסגרים כאן.
        select d.attendance_status, d.lateness_level, d.no_show_reason
          from (select s.*,
                       sum(s.n) over (order by s.attendance_status, s.lateness_level nulls first, s.no_show_reason nulls first) as cum,
                       sum(s.n) over () as tot
                  from (select h.attendance_status, h.lateness_level, h.no_show_reason, count(*) as n
                          from public.assignments h
                         where h.attendance_status is not null
                           and h.project_id not in (select project_id from seed_snapshot.projects_close_20260924)
                           and (h.hostess_id = f.hostess_id
                                or (select count(*) from public.assignments x
                                     where x.hostess_id = f.hostess_id and x.attendance_status is not null
                                       and x.project_id not in (select project_id from seed_snapshot.projects_close_20260924)) < 3)
                         group by 1, 2, 3) s) d
         where d.cum > f.u_att * d.tot
         order by d.cum
         limit 1) o;

    perform public.close_project_operationally(
      r.project_id, v_ph, v_guests,
      'seed/close-2026-09-24/p' || r.project_id || '_summary-report.pdf', v_rows);
    perform public.seed_backdate_project(
      r.project_id,
      p_operationally_closed_at => ((r.final_event_date + v_lag) + time '12:30') at time zone 'Asia/Jerusalem');
    v_closed := v_closed + 1;
  end loop;

  -- "בדיוק מה שצפוי".
  select count(*) filter (where project_status = 'event_finished'),
         count(*) filter (where project_status = 'awaiting_invoice')
    into v_ef_after, v_ai_after from public.projects;
  if v_closed <> 20 or v_ef_after <> v_ef_before - 20 or v_ai_after <> v_ai_before + 20 then
    raise exception 'close-2026-09: נסגרו %; event_finished % ⇐ %; awaiting_invoice % ⇐ % — עוצר.',
      v_closed, v_ef_before, v_ef_after, v_ai_before, v_ai_after;
  end if;

  select count(*) into v_n from public.projects p
   where p.project_id in (select project_id from seed_snapshot.projects_close_20260924)
     and p.project_status = 'awaiting_invoice' and p.operationally_closed_at < now()
     and p.operationally_closed_by = 'ishay1997@gmail.com' and p.actual_hours between 0.5 and 24;
  if v_n <> 20 then
    raise exception 'close-2026-09: רק % מ-20 הפרויקטים במצב הצפוי אחרי הסגירה — עוצר.', v_n;
  end if;

  select count(*) into v_n from public.assignments a
   where a.project_id in (select project_id from seed_snapshot.projects_close_20260924)
     and a.attendance_status is not null;
  if v_n <> 105 then
    raise exception 'close-2026-09: % זימונים קיבלו נוכחות, צפוי 105 — עוצר.', v_n;
  end if;
end
$close$;
