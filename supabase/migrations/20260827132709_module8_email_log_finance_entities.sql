-- =============================================================================
-- מודול 8 · מיגרציה D · צעד 1.4 — יומן-המיילים מכיר בשני סוגי מ8
-- =============================================================================
-- למה: מ8 שולח שני מיילים — החשבונית ללקוח (M1) ודוח-השכר לרו"ח (M2). היומן
-- `email_log` חוסם היום כל ערך מחוץ לארבעה (quote/shift/project/project_report),
-- ומנהלת-הכספים אינה יכולה לראות אף שורה בו — שלוש ה-policies הקיימות מגודרות
-- ל'הצעות מחיר', 'דיילות' ו'פרויקטים'.
--
-- 🔴🔴 סדר-הפריסה א-סימטרי, וזה מוקש T5 — המיגרציה הזו חייבת לנחות **לפני**
-- הדיפלוי של `supabase/functions/send-email/index.ts`, לעולם לא הפוך.
-- למה זה שובר בשקט בסדר ההפוך: הפונקציה שולחת את המייל **ואז** רושמת ביומן.
-- אם היא תדע לשלוח `invoice` בזמן שה-CHECK עוד דוחה אותו — **המייל יוצא ללקוח,
-- והרישום נכשל.** אין למי להתלונן: המייל כבר בדרך, והמערכת תחשוב שלא נשלח.
-- ⇒ הסדר: המיגרציה הזו → אימות → ואז דיפלוי הפונקציה.
--
-- שני הערכים החדשים הם attachment-חובה (חשבונית בלי קובץ ודוח בלי אקסל הם
-- חסרי-משמעות) — אבל זה נאכף בפונקציה, לא כאן; ל-`email_log` אין עמודת-קובץ.
-- =============================================================================

alter table email_log drop constraint email_log_entity_type_check;

alter table email_log add constraint email_log_entity_type_check
  check (entity_type = any (array[
    'quote'::text,
    'shift'::text,
    'project'::text,
    'project_report'::text,
    'invoice'::text,          -- מ8 M1 — חשבונית ללקוח
    'salary_report'::text     -- מ8 M2 — דוח שכר לרו"ח
  ]));

-- ה-policy הרביעית, בדיוק בצורת שלוש הקיימות: מסננת לפי entity_type ואז
-- דורשת את הרשאת-המודול. מנהלת-הכספים תראה רק את שתי השורות של מ8 —
-- לא את מיילי ההצעות, המשמרות או הפרויקטים.
create policy email_log_select_finance_module on email_log
  for select to authenticated
  using (
    entity_type = any (array['invoice'::text, 'salary_report'::text])
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );
