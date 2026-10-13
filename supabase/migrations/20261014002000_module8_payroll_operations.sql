-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 14 (A) — קישור הפעולות והדוחות לבדיקת הדיילות
-- =============================================================================
-- why: הטבלה payroll_operations נוצרה כבר במיגרציה 6b (תיקון F8), לפני שטבלאות הבדיקה של
-- B קיימות. עכשיו, אחרי מיגרציה 7, מוסיפים את הקישורים: כל פעולת הפקה שייכת לבדיקה, וכל
-- דוח שהופק בתהליך החדש מצביע על הבדיקה שלו.
--
-- 🔑 expand: הוספת FK על עמודות שכבר קיימות. בייצור שתי העמודות ריקות ברגע ההחלה
--    (שום קוד פרוס לא כותב אותן), ולכן האימות מיידי.
-- =============================================================================

alter table public.payroll_operations
  add constraint payroll_operations_review_id_fkey
  foreign key (review_id) references public.payroll_reviews (review_id);

alter table public.salary_reports
  add constraint salary_reports_review_id_fkey
  foreign key (review_id) references public.payroll_reviews (review_id);

create index salary_reports_review_id_idx on public.salary_reports (review_id);
