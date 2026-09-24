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
--
-- 🔑 **למה זה עובד, וזה לא מובן-מאליו:** טריגר על `quotes` דורס את `updated_at`
--    ומציב `now()` בכל עדכון. ⇒ **אי-אפשר לצייר תאריך עתידי מראש** (נוסה
--    10/09 ונכשל) — אבל *כל* נגיעה בשורה ביום הרענון מאפסת את שעון-התפוגה.
--    לכן הסקריפט אינו מחשב תאריכים: הוא רק נוגע בשורות, והטריגר עושה את השאר.
--
-- 🚫 מה הוא לא עושה: אינו נוגע בהיסטוריה, אינו משנה סטטוסים, אינו ממציא ישויות.
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

-- ④ אופק-ההזמנות. ⚠️ נמדד 10/09: האחרון הוא 29/11/2026 — 45 יום בלבד אחרי
--    הכנס, ודצמבר ריק. אם זה עדיין המצב — לזרוע 8–12 אירועים בדצמבר–ינואר.
select max(final_event_date) last_event_in_system,
       count(*) filter (where final_event_date > date '2026-11-15') events_beyond_a_month
  from public.projects where project_status <> 'cancelled';

-- ⑤ ואז להריץ את שמונת מבחני-הקוהרנטיות:
--    docs/specs/module_11_reports/seed-coherence-tests.md

-- 🔎 שאילתת-עזר, קריאה-בלבד: **מתי התפוגה הקרובה?** להריץ לפני כל ריצה של הקובץ,
--    ובכל פעם שתאריך-הכנס זז. עבודת-הלילה הראשונה (01:00 UTC) שאחרי `first_expiry_after`
--    תתחיל להפוך הצעות ל"פג תוקף" — הרענון חייב לרוץ לפניה.
-- select min(updated_at) + ((select param_value from public.params
--                            where param_name = 'ימי_תוקף_הצעה')::int * interval '1 day') first_expiry_after,
--        count(*) open_quotes
--   from public.quotes where quote_status = 'in_progress';
