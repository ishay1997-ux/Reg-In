**דוח בודק: התאמה בין המסכים (D) ופונקציית השרת (C) לבין המסד האמיתי (A, B)**

הרצתי את כל 31 ה-RPC (19 של `payrollApi.js` ושל הדף הציבורי, ועוד 13 של `pipeline.ts`, כש-`payroll_operation_status` משותף לשניהם) על הרפליקה עם המיגרציות `20261014*`, לאורך המסע המלא. שתי פונקציות רצו רק במסלול הסירוב: `payroll_operation_abandon` ו-`payroll_operation_fail`. את הפלט השוויתי לנתוני הבדיקה של D (`testFixtures.js`). את בונה המסמך ואת בונה המייל של C (`document.ts`, `mail.ts`) הרצתי ישירות על ה-snapshot וה-claim האמיתיים, ושניהם עברו.

**אי-התאמות**

1. **`payroll_review_find` · שם פרמטר (חובה, מתקן D).** הלקוח שולח `p_original`, והמסד מגדיר `p_original_report_id` (אומת מול `pg_proc`). דרך PostgREST זו שגיאת "פונקציה לא נמצאה" שמתורגמת ל-`UNEXPECTED`. כלומר כל טעינה של מרחב השכר תיכשל בשליפת הבדיקה.

2. **`payroll_accountant_retry_reserve` · `confirmed_recipient` (חובה, מתקנים A ו-D).** D שולח את `intended_recipient` של הניסיון הישן. אם הכתובת שונתה בהגדרות (התיקון הטבעי אחרי כשל), המסד מחזיר `STALE_VERSION`. הרצתי: הכתובת הישנה נדחתה והחדשה עברה. "רענן" לא עוזר, כי `payroll_report_detail` ו-`payroll_operation_status` לא מחזירים את הכתובת הנוכחית. התיקון: A מחזיר אותה, ו-D מציג ושולח אותה.

3. **`resend_review` / `retry_accountant` · `attempt.state` (חובה, מתקן D).** C מחזיר `ok:true` גם כשהניסיון נכשל או שמצבו לא ידוע. D מציג "נשלח שוב" בלי לבדוק את המצב (`ReviewTable.jsx:250`, `AccountantResend.jsx:52`), כלומר הודעת הצלחה שקרית.

4. **`payroll_review_case_detail` · `current_rows[].hours` (חובה, מתקן D).** המסד מחזיר `actual_hours` בלבד. העמודה "שעות כעת" ב-`CasePanel.jsx:388` תציג תמיד "לא רלוונטי".

5. **`failure_code` של הפעולה · ערכי enum (רשות, מתקן D).** ב-`STORAGE_FAILURES` (`payrollModel.js:382`) כתוב `STORAGE_FAILED` ו-`BUILD_FAILED`, אבל C כותב `STORAGE_UPLOAD_FAILED` ו-`XLSX_BUILD_FAILED`. התוצאה: מוצגת ההודעה הכללית במקום "שמירת הקובץ נכשלה".

6. **קודי שגיאה בלי נוסח אצל D (רשות, מתקן D).** הקודים: `OPERATION_NOT_FOUND`, `REVIEW_NOT_OPEN` (גם כשגיאה וגם כחוסם במוכנות), `INVALID_TRANSITION`, `SALARY_LINE_DATE_MISSING`, `SALARY_*` (16 קודים), `MAIL_NOT_CONFIGURED`, `INVALID_REQUEST`, `RPC_ERROR`. כולם מקבלים "הפעולה נכשלה. נסה שוב", גם כשניסיון חוזר לא יעזור. D מתעלם מה-`message` העברי ש-C מחזיר.

7. **`current_rows[].line_basis` לא קיים במסד (רשות, מתקן D או A).** הסינון ב-`CorrectionForm.jsx:47` לא חוסם שורת פיצוי ביטול. המסד יסרב בעצמו, אבל רק אחרי שהטופס כבר מולא.

8. **`payroll_report_detail.report` (רשות, מתקן D).** חסרים בו `artifact_available` ו-`line_count` (שנמצא ברמה העליונה). לכן `needsReconstruction` יחזיר `true` לכל דוח ישן (`legacy`). בנוסף, ה-fixtures סטו מהמסד: `affected_rows` שם הם מחרוזות ובמסד אובייקטים, וב-`report` יש שדות שלא קיימים במסד.

**מה תואם בפועל:** `version_current` (בוליאני), `revision` שחוזר מ-refresh, `total_hours`, `attempts[].completed_at`, `delivery: null` לסיכום שלא נשלח, כל מצבי התשובה של הדף הציבורי ושמות שדות הוולידציה. גם ערכי ה-enum תואמים: קטגוריות הפנייה, outcomes, `next_action` ו-`delivery_state`. מבנה השגיאה `PAYROLL:<CODE>` עם hint ב-JSON ותשובות `{ok:false}` מטופל נכון ב-C וב-D.

**נקודות העיוורון שלי**
- אין PostgREST ברפליקה. ממצא 1 נגזר מ-`pg_proc` ומהכלל של PostgREST (שמות הפרמטרים חייבים להתאים), לא מקריאת HTTP אמיתית.
- לא רינדרתי קומפוננטות. קריאת השדות נבדקה ב-grep ובקריאת קוד, כך ששדה שנקרא דרך משתנה ביניים עלול להיות שפספסתי.
- זרעתי רק נתיב רגיל של יולי. לא בדקתי השלמה עם שורות, שורת פיצוי, דוח ישן (`legacy`), פעולה שנכשלה (`failed`) או החלפה (`superseded`), ואת ה-`blockers` של התצוגה המקדימה כשיש חוסמים.
- לא נבדקה צורת שאר התשובות הקטנות מול הנחות הזיופים של C, מעבר לשדות שהוא קורא.

הסקריפטים (לא בריפו): `C:\Users\ishay\AppData\Local\Temp\claude\C--Users-ishay-Reg-In\03938c00-2c0c-4651-8a38-775408880e94\scratchpad\probe.mjs`, ובאותה תיקייה גם `compare.mjs`, `args.mjs`, `doc.mjs` ו-`out.json`.