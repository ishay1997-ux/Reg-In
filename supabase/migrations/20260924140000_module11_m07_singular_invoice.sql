-- why: מבקרים טריים (דרך הסגן), 24/09/2026 — ניסוח ביחיד בשורת-"אז מה" של מ07 "מבט-על כספים".
--      מיגרציה `20260924080000_module11_m3_walkthrough_fixes` (0ג-2 — ישי: "מאשר הכל לפי המלצתך") כתבה
--      *"לפתוח את "גיול חובות" — X ₪ ממתינים מעל 60 יום ב-N חשבוניות."* — וכשיש **חשבונית אחת** יוצא
--      *"… ב-1 חשבונית."* ⇒ ביחיד בלי מספר: *"… מעל 60 יום בחשבונית אחת."*; ברבים — כמו היום.
--      📏 נמדד לפני הכתיבה (24/09, `pg_get_functiondef` חי): הקטע הישן מופיע ב-`report_m07_finance_overview`
--         בדיוק פעם אחת, ואין מיגרציה מאוחרת יותר ב-`schema_migrations` (האחרונה: `20260924130000`).
-- what: החלפה "בדיוק פעם אחת" על הגוף החי (`pg_get_functiondef`), אותה חתימה ⇒ ה-ACL נשמר.
--      הדפוס: `20260924130000_module11_singular_so_what.sql`.
-- reversible: כן — ההחלפה ההפוכה. טקסט בלבד; אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m07s$
declare
  v_oid oid;
  v_def text;
  v_old text := $o$' יום ב-' || v_lri || v_over60_n || v_pdi
        || case when v_over60_n = 1 then ' חשבונית.' else ' חשבוניות.' end$o$;
  v_new text := $n$' יום '
        -- ✏️ 24/09/2026: ביחיד בלי מספר — "בחשבונית אחת" (היה: "ב-1 חשבונית").
        || case when v_over60_n = 1 then 'בחשבונית אחת.'
                else 'ב-' || v_lri || v_over60_n || v_pdi || ' חשבוניות.' end$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m07_finance_overview';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, v_old, ''))) <> length(v_old) then
    raise exception 'm07s: so-what invoice segment not exactly once'; end if;
  execute replace(v_def, v_old, v_new);
end $m07s$;
