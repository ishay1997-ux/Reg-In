-- why: מ11 · גיבוי לפני הזריעה-הממוקדת של ציוני-המשוב (scripts/seed-focused/2026-09-24-feedback-quality-signal.sql).
--      התוכנית §4: "לפני: snapshot" — ולא capture-seed-snapshot המלא, שהיה דורס את צילום 15/09 (הזריעה המקורית).
-- what: טבלה אחת בסכמה seed_snapshot (לא חשופה ל-API, לא נכנסת ל-docs/schema.sql של public) — עותק של השדות
--       שהזריעה משנה, לכל משוב שהושלם: project_id · feedback_score · negative/positive_feedback_reasons · updated_at.
-- reversible: כן — drop table מבטל; החזרת-הנתונים עצמה היא חלק ③ בקובץ-הזריעה.
create table if not exists seed_snapshot.projects_feedback_20260924 as
select project_id, feedback_score, negative_feedback_reasons, positive_feedback_reasons, updated_at, now() as captured_at
  from public.projects
 where feedback_status = 'completed';

comment on table seed_snapshot.projects_feedback_20260924 is
'גיבוי ציוני-משוב לפני הזריעה-הממוקדת של 24/09/2026 (מ11 · ה3). חזרה: scripts/seed-focused/2026-09-24-feedback-quality-signal.sql חלק ③.';
