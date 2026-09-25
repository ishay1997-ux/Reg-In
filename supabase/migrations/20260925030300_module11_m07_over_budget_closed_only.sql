-- why: הכרעת הסגן, 25/09/2026 ~03:2X: האריח "פרויקטים שחרגו מהתקציב החודש" (הדלת שלו פותחת את מ8) — אותו כלל "גג שבוע"
--      (הכרעת-ישי) כמו מ12 (20260924230000) ומ8 (20260925010100): **אירוע נספר רק אם `final_event_date < היום − 7` ולא בוטל.**
--      אירוע מהשבוע האחרון עוד בסגירה — השעות שלו עוד מדווחות, ו-0 שעות נראות כחיסכון (הסטייה שלילית) אבל נכנסות
--      למכנה. דווח ב-010600 כשאלה פתוחה: "האריח סופר גם אירועים מהשבוע האחרון, ואחרי 010100 מ8 כבר לא".
-- what: החלפה אחת, "בדיוק פעם אחת", אותה חתימה ⇒ ה-ACL נשמר: ב-CTE `money` של שני האריחים "החודש" נוסף
--       `and p.final_event_date < v_today - 7`. ‏"לא בוטל" כבר נאכף שם (רשימת הסטטוסים לא כוללת `cancelled`).
--       התנאי חל על שלוש הספירות שנשענות על ה-CTE: החודש · החודש הקודם · 30 הימים הנגללים (meta).
--       🚫 לא נוגע: מי "חורג" (הסף), הנוסח, ושאר האריחים.
-- 📏 בסיס: תיקון-קדימה אחרי 20260925010600 (בונה מ12) — md5 `3d403c08a6b981944b46f310b2aa157a`, ‏24,848 תווים.
--    בגוף החי (25/09) עוד `8627ddc1de2f308867f1bb487709328d` — 010600 טרם הוחל.
-- 📏 הגוף הצפוי אחרי: md5 `48be3f80119a7da2f06766e88ee79703`, ‏24,972 תווים — בלוק-ניסיון משורשר (25/09 ~03:3X, DO אחד שמריץ את הקבצים ב-EXECUTE ומסתיים ב-raise; אחריו נבדק שהגופים החיים לא זזו): חי ⇐ 010600 = `3d403c08` ⇐ הקובץ הזה.
--    ההשפעה היום (25/09): מכנה-החודש 25 ⇐ 21 — יוצאים 1591 (18/09) · 1594 (22/09) · 1595 · 1596 (23/09).
-- reversible: כן — ההחלפה ההפוכה. אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל, אחרי 20260925010600.

do $m07c$
declare
  v_oid oid;
  v_def text;
  v_old text := $o$     where p.project_status in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')
       and (p_customer_id is null or p.customer_id = p_customer_id)
  ), ratio as ($o$;
  v_new text := $n$     where p.project_status in ('finished', 'awaiting_payment', 'awaiting_invoice', 'event_finished')
       and (p_customer_id is null or p.customer_id = p_customer_id)
       -- ✏️ 25/09/2026 (הכרעת הסגן · "גג שבוע"): רק אירוע שנסגר — כמו מ12 ומ8.
       and p.final_event_date < v_today - 7
  ), ratio as ($n$;
begin
  v_oid := 'public.report_m07_finance_overview(date,date,integer,jsonb,date,integer,integer)'::regprocedure;
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, v_old, ''))) <> length(v_old) then
    raise exception 'm07c: money-CTE segment not exactly once (is 20260925010600 applied?)'; end if;
  v_def := replace(v_def, v_old, v_new);
  execute v_def;
end $m07c$;
