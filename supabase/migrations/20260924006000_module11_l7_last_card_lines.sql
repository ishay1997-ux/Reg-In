-- why: מ11 · סבב-טקסט אחרון (L7, 24/09/2026) — שתי חריגות שבדיקת-הצפיפות מצאה אחרי מעבר-הרשת:
--      ① מ19 · "ימים לתשלום, הסוג האיטי": ההשוואה "על 675 חשבוניות ששולמו: 675" חזרה על המספר שבשורת-ההקשר
--         (L5 קיצר את שורת-ההקשר ולא הסיר את ההשוואה). אין לה בסיס-השוואה ⇒ null; הפילוח המלא נשאר בגילוי שמתחת.
--      ② ה2 · הערת-הגרף 64 תווים (≤60, כלל 0.6) — חלק-הסף יורד (הוא כתוב בהגדרות).
-- how: החלפות-טקסט "בדיוק פעם אחת" על הגוף החי, execute. אותה חתימה ⇒ ACL נשמר.
-- reversible: כן — ההחלפות ההפוכות.
-- ישי 23/09 לילה: "לא לבקש אישור להכיל מיגרציות בסשן הזה. תכיל בעצמך ותאמת לבד".
do $m11$
declare
  v_oid oid;
  v_def text;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m19_customers_overview';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, $o0$'compare', jsonb_build_object(
          'value', v_pay_n, 'format', 'int',
          'label', 'על ' || v_lri || to_char(v_pay_n, 'FM999,999') || v_pdi || ' חשבוניות ששולמו',
          'direction', 'flat'),$o0$, ''))) <> length($o0$'compare', jsonb_build_object(
          'value', v_pay_n, 'format', 'int',
          'label', 'על ' || v_lri || to_char(v_pay_n, 'FM999,999') || v_pdi || ' חשבוניות ששולמו',
          'direction', 'flat'),$o0$) then
    raise exception 'm11 l7 m19 #0: not exactly once'; end if;
  v_def := replace(v_def, $o0$'compare', jsonb_build_object(
          'value', v_pay_n, 'format', 'int',
          'label', 'על ' || v_lri || to_char(v_pay_n, 'FM999,999') || v_pdi || ' חשבוניות ששולמו',
          'direction', 'flat'),$o0$, $n0$'compare', null,$n0$);
  execute v_def;
end $m11$;

do $m11$
declare
  v_oid oid;
  v_def text;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m04_discounts';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, $o0$'סגירה: לקוחות ישירים · רווח: כל הלקוחות · מתחת ל-20 — בלי עמודה.'$o0$, ''))) <> length($o0$'סגירה: לקוחות ישירים · רווח: כל הלקוחות · מתחת ל-20 — בלי עמודה.'$o0$) then
    raise exception 'm11 l7 m04 #0: not exactly once'; end if;
  v_def := replace(v_def, $o0$'סגירה: לקוחות ישירים · רווח: כל הלקוחות · מתחת ל-20 — בלי עמודה.'$o0$, $n0$'סגירה: לקוחות ישירים · רווח: כל הלקוחות.'$n0$);
  execute v_def;
end $m11$;
