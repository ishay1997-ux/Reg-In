-- ניקוי שתי הצעות-הבדיקה שנתפסו בסקירת 3.7 (הכרעת-ישי 31/07/2026, "כן לכל ההמלצות").
--
-- מה זה מוחק: הצעה 14 ("בדיקת שמירה 1785332141457") והצעה 15 ("בדיקת דיילות ידנית 1785332918430"),
-- שתיהן של לקוח 46 (מדיטק) ושתיהן `rejected` עם סיבה 'נפתחה בטעות'. הן חצי מרשימת ההצעות
-- של מדיטק ועמדו לעלות לאוויר בפריסה ל-Vercel.
--
-- אומת לפני הכתיבה של הקובץ הזה: אפס שורות ב-`email_log` שמצביעות עליהן, ואפס שורות
-- ב-`projects`. אין תלויות.
--
-- ⚠️ למה צריך לכבות טריגר: `quotes_lock_non_in_progress` (§7.50) חוסם UPDATE **וגם** DELETE
-- על כל הצעה שאינה `in_progress`. זו התנהגות נכונה ומכוונת — ולכן היא לא משתנה כאן, רק
-- מושהית לרגע בתוך טרנזקציה אחת. כל כשל בדרך מגלגל אחורה את הכול, כולל את ההשהיה.
--
-- 🔙 שחזור, אם יתברר שהיה צורך: `scripts/restore_quotes_14_15.sql` מחזיר אותן בית-בבית.

begin;

alter table public.quote_services disable trigger quote_services_lock_non_in_progress;
alter table public.quotes disable trigger quotes_lock_non_in_progress;

delete from public.quote_services where quote_id in (14, 15);
delete from public.quotes where quote_id in (14, 15);

alter table public.quotes enable trigger quotes_lock_non_in_progress;
alter table public.quote_services enable trigger quote_services_lock_non_in_progress;

commit;

-- אימות אחרי ההרצה — שלוש השורות האלה צריכות להחזיר בדיוק: 8 · 0 · O/O
select count(*) as quotes_left from quotes;                                 -- מצופה 8
select count(*) as test_rows_left from quotes where quote_id in (14, 15);   -- מצופה 0
select
  (select tgenabled from pg_trigger where tgname = 'quotes_lock_non_in_progress')         as quotes_trigger,
  (select tgenabled from pg_trigger where tgname = 'quote_services_lock_non_in_progress') as lines_trigger;
  -- מצופה O ו-O (‏O = enabled; אם מופיע D — הטריגר נשאר כבוי וצריך להדליק ידנית)
