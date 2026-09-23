-- זריעה ממוקדת — ציון-משוב שמגיב לאיכות-האירוע (מ11 · ה3 "איכות אירועים"), 24/09/2026.
--
-- 🔑 למה בכלל: הנתונים סינתטיים, והמחולל כתב ציוני-משוב שאינם תלויים בשום דבר שקרה באירוע —
--    נמדד 23/09: יחס אורחים-לדיילת, היעדרויות ואיחורים לא הזיזו את הציון (4.34 כמעט בכל קבוצה).
--    דוח "מה הורס אירוע" על נתונים כאלה היה אומר "לא נמצא קשר" בכל שורה — נכון על הנתונים, ושקרי
--    על העולם שהמערכת מדמה. ⇒ שלושה כללים מוצהרים, שדה אחד, ובלי לגעת בשום דבר אחר.
-- 🚫 זריעה מלאה נפסלה (docs/plans/2026-09-23-module-11-decision-reports.md §4): היא מוחקת את
--    סיפורי-הכנס שנכתבו ביד. 🚫 לא נוגעים ב-quotes / assignments / הנחות.
--
-- הכללים (הכרעה 2 בשלב 1 — התוכנית §9ב), על משובים שהושלמו באירועים שלא בוטלו:
--   −1 לכל כלל שמתקיים, רצפה 1:
--   ① אין ראש-משמרת בין הדיילות שהגיעו  ② 2 דיילות ומעלה לא הגיעו  ③ 50 אורחים ומעלה לכל דיילת שהגיעה
--   ציון שירד מ-4+ ל-3 ומטה מקבל סיבה-שלילית קוהרנטית (ובלי סיבה-חיובית), כמו בשאר הנתונים:
--   ① ⇒ "ניהול לקוי" · ②/③ ⇒ "תפקוד דיילות". ציון שנשאר 4+ — הסיבות שלו לא זזות.
--
-- 🔒 גיבוי לפני: המיגרציה 20260924001000_module11_m1_feedback_backup.sql יוצרת
--    seed_snapshot.projects_feedback_20260924 (ציון · שתי רשימות-הסיבות · updated_at).
-- 🔙 חזרה: חלק ③ למטה.
-- ⚙️ `session_replication_role = replica` — כדי ש-projects_set_updated_at לא ידרוס את updated_at:
--    הזריעה משנה משוב, לא "פרויקט שנערך עכשיו".

-- ═══ ① dry-run — מה ישתנה (קריאה-בלבד) ═══════════════════════════════════════════════
with f as (
  select p.project_id, p.feedback_score old_score,
         (not coalesce(bool_or(a.is_shift_lead) filter (where a.attendance_status in ('arrived', 'late')), false))::int r_lead,
         (count(*) filter (where a.attendance_status = 'no_show') >= 2)::int r_noshow,
         coalesce((p.actual_guests::numeric
                   / nullif(count(*) filter (where a.attendance_status in ('arrived', 'late')), 0) >= 50)::int, 0) r_ratio
    from public.projects p
    left join public.assignments a on a.project_id = p.project_id
   where p.feedback_status = 'completed' and p.project_status <> 'cancelled' and p.feedback_score is not null
   group by p.project_id
), k as (
  select *, r_lead + r_noshow + r_ratio k, greatest(1, old_score - (r_lead + r_noshow + r_ratio)) new_score from f
)
select count(*) filter (where k > 0) rows_changed,
       count(*) filter (where k > 0 and old_score >= 4 and new_score <= 3) reasons_changed,
       round(avg(old_score), 2) avg_before, round(avg(new_score), 2) avg_after
  from k;

-- ═══ ② הכתיבה ════════════════════════════════════════════════════════════════════════
-- begin;
-- set local session_replication_role = replica;
-- with f as ( …אותו CTE כמו ①… ), k as ( … )
-- update public.projects p
--    set feedback_score = k.new_score,
--        negative_feedback_reasons = case when k.old_score >= 4 and k.new_score <= 3
--          then array[case when k.r_lead = 1 then 'ניהול לקוי' else 'תפקוד דיילות' end]
--          else p.negative_feedback_reasons end,
--        positive_feedback_reasons = case when k.old_score >= 4 and k.new_score <= 3
--          then '{}'::text[] else p.positive_feedback_reasons end
--   from k where k.project_id = p.project_id and k.k > 0;
-- commit;

-- ═══ ③ חזרה (מהגיבוי) ════════════════════════════════════════════════════════════════
-- begin;
-- set local session_replication_role = replica;
-- update public.projects p
--    set feedback_score = b.feedback_score,
--        negative_feedback_reasons = b.negative_feedback_reasons,
--        positive_feedback_reasons = b.positive_feedback_reasons
--   from seed_snapshot.projects_feedback_20260924 b where b.project_id = p.project_id;
-- commit;
