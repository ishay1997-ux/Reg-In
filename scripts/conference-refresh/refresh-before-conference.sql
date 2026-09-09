-- ============================================================================
-- 🔴 רענון-זריעה לפני הכנס — להריץ ב-14/10/2026, יום לפני. חובה.
--
-- למה: הנתונים תלויי-זמן, ושלוש עבודות pg_cron רצות כל לילה:
--   · module3-quote-expiry  (01:00) — הצעה ב-`in_progress` שלא עודכנה
--     `ימי_תוקף_הצעה` ימים (=30) הופכת ל-`rejected` "פג תוקף"
--   · module6-event-finished (02:00) — פרויקט שתאריכו חלף → `event_finished`
--   · module1-login-attempts-cleanup (01:30) — לא נוגע לתצוגה
--
-- ⚠️ נמדד 10/09/2026: **כל 33 ההצעות הפתוחות יפוגו לפני 15/10.** בלי הרענון
--    מסך-הבית יציג ביום הכנס **"הצעות ממתינות: 0"** וצינור-המכירות ייראה מת.
--
-- 🔑 **למה זה עובד, וזה לא מובן-מאליו:** טריגר על `quotes` דורס את `updated_at`
--    ומציב `now()` בכל עדכון. ⇒ **אי-אפשר לצייר תאריך עתידי מראש** (נוסה
--    10/09 ונכשל) — אבל *כל* נגיעה בשורה ביום הרענון מאפסת את שעון-התפוגה.
--    לכן הסקריפט אינו מחשב תאריכים: הוא רק נוגע בשורות, והטריגר עושה את השאר.
--
-- 🚫 מה הוא לא עושה: אינו נוגע בהיסטוריה, אינו משנה סטטוסים, אינו ממציא ישויות.
-- ============================================================================

-- ① מרענן את שעון-התפוגה של כל ההצעות הפתוחות. no-op לוגי, אפקט אמיתי.
update public.quotes set notes = notes where quote_status = 'in_progress';

-- ② אימות ① — חייב להחזיר 0.
select count(*) as quotes_expiring_before_conference
  from public.quotes
 where quote_status = 'in_progress'
   and updated_at < date '2026-10-15'
       - ((select param_value from public.params where param_name = 'ימי_תוקף_הצעה')::int
          * interval '1 day');

-- ③ מצב הלוח ביום הכנס. עובר: ≥12 אירועים בחלון, ופחות משליש חסרי-דיילות.
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
       round(100.0 * count(*) filter (where approved < req) / nullif(count(*),0), 0) pct_short;

-- ④ אופק-ההזמנות. ⚠️ נמדד 10/09: האחרון הוא 29/11/2026 — 45 יום בלבד אחרי
--    הכנס, ודצמבר ריק. אם זה עדיין המצב — לזרוע 8–12 אירועים בדצמבר–ינואר.
select max(final_event_date) last_event_in_system,
       count(*) filter (where final_event_date > date '2026-11-15') events_beyond_a_month
  from public.projects where project_status <> 'cancelled';

-- ⑤ ואז להריץ את שמונת מבחני-הקוהרנטיות:
--    docs/specs/module_11_reports/seed-coherence-tests.md
