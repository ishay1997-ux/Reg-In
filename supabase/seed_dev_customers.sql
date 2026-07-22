-- ============================================================
-- Dev-seed: 5 לקוחות פיקטיביים (מודול 2) — נתוני-פיתוח בלבד, לא נתונים אמיתיים
-- ============================================================
-- מטרה: סאמפל-דאטה לפיתוח ה-UI של מודול 2 (Phase 3) ולבוחר-הלקוח של מודול 3.
-- ⚠️ זהו **לא** קובץ מיגרציה ו**לא** ה-seed האוטומטי של Supabase (`supabase/seed.sql`) — הרצה ידנית בלבד
--    (הפרויקט מחיל דרך MCP).
-- 🔴 **סטטוס: אינו מוחל כרגע — `customers` ריקה.** הורץ 10/07/2026 (הלקוחות קיבלו customer_id 7–11)
--    ואז **הוסר באותו יום (הכרעת-ישי — נתוני-דמה מיותרים/מבלבלים לסשן הבנייה)**. הקובץ נשמר להרצה-עתידית
--    אם יידרש סאמפל-דאטה ל-UI; רצף-הזהות ממשיך מ-11 → ids חדשים יהיו 12+ (פערים תקינים ב-surrogate).
-- idempotent: on conflict על company_number (המפתח העסקי) — הרצה חוזרת לא משכפלת.
-- מכסה את 4 סוגי-הלקוח + מגוון: הסכמת-דיוור (3/5), הנחות (0–15%), ואחד `inactive` (הדגמת ארכיון).

insert into customers (company_number, customer_type, company_name, contact_name, phone, email, discount_percent, marketing_consent, status) values
  ('514000001','private_company','טכנולוגיות אלפא בע"מ','דנה כהן','03-5551234','dana@alpha-tech.co.il',5,true,'active'),
  ('500000002','government','עיריית תל אביב-יפו','יוסי לוי','03-7240000','yossi@mail.tel-aviv.gov.il',0,false,'active'),
  ('514000003','production_company','הפקות אור בע"מ','מיכל ברק','052-5559876','michal@or-productions.co.il',10,true,'active'),
  ('580000004','nonprofit','עמותת יד לילד','רות שמעוני','02-6543210','ruth@yadlayeled.org.il',15,true,'active'),
  ('514000005','private_company','מסעדות הגליל בע"מ','אבי מזרחי','04-8887766','avi@galil-rest.co.il',0,false,'inactive')
on conflict (company_number) do nothing;
