-- why: מ11 · גיבוי לפני תיקון ההערות הסותרות (24/09/2026, הכרעת-ישי "מאשר הכל לפי המלצתך").
--      הזריעה הממוקדת (m1) הורידה ציונים מ-4–5 ל-1–3 אבל לא שינתה את טקסט ההערה ⇒ שבח ליד ציון 1.
-- what: שני עותקים בסכמה seed_snapshot (לא חשופה ל-API): ההערה הנוכחית של 43 הפרויקטים, ושורות
--       הסיווג של ה-AI שלהם (נמחקות כדי שהסיווג ירוץ מחדש על הטקסט החדש).
-- reversible: כן — החזרה = update מתוך הגיבוי + insert של שורות הסיווג.
-- ⚠️ הוחל ע"י הסגן דרך MCP (`module11_m2_feedback_notes_backup`), 24/09/2026. השינוי עצמו (43 update ·
--    מחיקת 43 שורות-סיווג · ריצת-AI 7 שאושרה) היה כתיבת-נתונים ולא מיגרציה — מתועד ב-
--    docs/plans/2026-09-24-system-polish.md §6 חבילה 0ג.
create table if not exists seed_snapshot.projects_feedback_notes_20260924 as
select p.project_id, p.feedback_notes, now() as captured_at
  from public.projects p
  join seed_snapshot.projects_feedback_20260924 s using (project_id)
 where s.feedback_score >= 4 and p.feedback_score <= 3 and coalesce(p.feedback_notes, '') <> '';

create table if not exists seed_snapshot.feedback_ai_insights_20260924 as
select i.*, now() as captured_at
  from public.feedback_ai_insights i
 where i.project_id in (select project_id from seed_snapshot.projects_feedback_notes_20260924);
