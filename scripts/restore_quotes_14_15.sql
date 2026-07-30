-- גיבוי-שחזור לשתי הצעות-הבדיקה שנמחקו בסקירת 3.7 (31/07/2026, הכרעת-ישי "כן לכל ההמלצות").
--
-- למה הקובץ הזה קיים: מחיקה במסד חי אינה הפיכה, וההצעות האלה נמחקו רק כי הן זיהמו את עמוד
-- הלקוח של מדיטק (חצי מרשימת ההצעות שלה) ועמדו לעלות לאוויר בפריסה ל-Vercel. אם יתברר שהיו
-- להן תלויות שלא נראו — ההרצה כאן מחזירה אותן בית-בבית.
--
-- אומת לפני המחיקה: אפס שורות ב-`email_log` ואפס שורות ב-`projects` שמצביעות עליהן.
-- ⚠️ טריגר-הנעילה (§7.50) חוסם INSERT? לא — הוא חוסם UPDATE/DELETE. הכנסה חוזרת עוברת חופשי,
--    אבל היא תיצור מזהים חדשים אם לא כופים במפורש את quote_id/line_id, ולכן הם כתובים כאן.

begin;

insert into quotes (
  quote_id, customer_id, event_name, issue_date, quote_status,
  estimated_guests, estimated_event_date, estimated_location,
  estimated_start_time, estimated_end_time,
  recommended_hostess_count, applied_customer_discount, manual_discount,
  rejection_reason, rejection_notes, notes, vat_rate_snapshot,
  created_at, updated_at
) values
  (14, 46, 'בדיקת שמירה 1785332141457', '2026-07-29', 'rejected',
   300, '2026-10-20', 'מרכז הכנסים, תל אביב', '18:00:00', '22:00:00',
   6, 5, 10, 'נפתחה בטעות', null, null, null,
   '2026-07-29T13:35:52.74642+00', '2026-07-29T16:18:08.682902+00'),
  (15, 46, 'בדיקת דיילות ידנית 1785332918430', '2026-07-29', 'rejected',
   300, '2026-10-25', 'מרכז הכנסים', '18:00:00', '22:00:00',
   7, 5, 0, 'נפתחה בטעות', null, null, null,
   '2026-07-29T13:48:47.401777+00', '2026-07-29T16:18:08.682902+00');

insert into quote_services (
  line_id, quote_id, sku, qty, line_number, closing_unit_price, closing_unit_cost,
  color, notes, created_at, updated_at
) values
  (28, 14, '04ST',      8,   1, 500, 300, null, null, '2026-07-29T13:35:55.143209+00', '2026-07-29T13:35:55.143209+00'),
  (29, 14, 'B-REG-TAG', 300, 2, 5,   2.5, null, null, '2026-07-29T13:35:55.143209+00', '2026-07-29T13:35:55.143209+00'),
  (30, 14, 'B-FAB-LAN', 300, 3, 6,   3,   null, null, '2026-07-29T13:35:55.143209+00', '2026-07-29T13:35:55.143209+00'),
  (31, 15, '04ST',      7,   1, 500, 300, null, null, '2026-07-29T13:48:47.401777+00', '2026-07-29T13:48:47.401777+00');

-- הרצפים חייבים לדלג מעל המזהים שהוחזרו ידנית, אחרת ההצעה הבאה תתנגש.
select setval(pg_get_serial_sequence('quotes', 'quote_id'), (select max(quote_id) from quotes));
select setval(pg_get_serial_sequence('quote_services', 'line_id'), (select max(line_id) from quote_services));

commit;
