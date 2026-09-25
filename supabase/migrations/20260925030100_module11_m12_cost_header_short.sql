-- why: הכרעת הסגן, 25/09/2026 ~03:2X, בעקבות כשל בדיקת-הצפיפות (`e2e/report-density.spec.js`, מצב 0, ענף-האיחוד):
--      *"מ12 · עלות מוזמנת (₪) · באירועים שנסגרו▼ · כותרת-עמודה ≤3 מילים · 4"*. ‏"באירועים שנסגרו" נכנס לכותרת
--      ב-20260924230000_module11_m12_measured_held_only.sql:77. הכלל של ישי (02:2X): המסך הרגיל נקי.
-- what: החלפה אחת, "בדיוק פעם אחת", על הגוף החי — אותה חתימה ⇒ ה-ACL נשמר. הכותרת חוזרת ל"עלות מוזמנת (₪)".
--       ‏"באירועים שנסגרו" כבר כתוב בשורת-האוכלוסייה של אותו דוח (נבדק בגוף החי 25/09): *"טבלת-המוצרים, הגרף
--       'הוזמן מול הגיע' ואריח-הפער כוללים רק אירועים שנסגרו: התקיימו לפני יותר משבוע ולא בוטלו"* ⇒ לא נוסף שם דבר.
-- 📏 הגוף החי לפני: md5 `dd3ebac8808d9ac99d1fdb626689a794`, ‏18,904 תווים (25/09; = הצפוי של 20260924230000).
-- 📏 הגוף הצפוי אחרי: md5 `c9f9348e835b8d7547a59ed18f1f6654`, ‏18,886 תווים — בלוק-ניסיון משורשר (25/09 ~03:3X, DO אחד שמריץ את הקבצים ב-EXECUTE ומסתיים ב-raise; אחריו נבדק שהגופים החיים לא זזו).
--    הכותרת החדשה נמצאת, הישנה לא.
-- reversible: כן — ההחלפה ההפוכה. אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m12h$
declare
  v_oid oid;
  v_def text;
  v_old text := $o$'label', 'עלות מוזמנת (₪) · באירועים שנסגרו', 'format', 'money'$o$;
  v_new text := $n$'label', 'עלות מוזמנת (₪)', 'format', 'money'$n$;
begin
  v_oid := 'public.report_m12_equipment(date,date,integer,jsonb)'::regprocedure;
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, v_old, ''))) <> length(v_old) then
    raise exception 'm12h: cost-header segment not exactly once (is 20260924230000 applied?)'; end if;
  v_def := replace(v_def, v_old, v_new);
  execute v_def;
end $m12h$;
