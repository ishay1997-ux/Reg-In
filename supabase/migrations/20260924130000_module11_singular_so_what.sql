-- why: ביקורת-קוד (דרך הסגן), 24/09/2026 — ניסוח ביחיד בשתי שורות-"אז מה" שהוכרעו היום.
--      ① מ14 (מיגרציה `20260924080000`, 0ג-2 — ישי: "מאשר הכל לפי המלצתך"): כשיש **דיילת אדומה אחת**
--         יצא *"דיילת אדומה אחת, 1 מהן פעילות ומוצעות היום בשיבוץ."* — וגם ברבים, "1 מהן פעילות" ו-"0 מהן
--         פעילות". ⇒ ביחיד: *"דיילת אדומה אחת, והיא פעילה ומוצעת היום בשיבוץ."* / *"…, והיא אינה פעילה היום."*;
--         ברבים: *"אחת מהן פעילה…"* / *"אף אחת מהן אינה פעילה היום."* / *"N מהן פעילות…"* (לפי `v_red_active`).
--      ② מ12 (מיגרציה `20260924120000` הפכה את הענף לחי): *"להזמין 997 יחידות של "…" ל-1 האירוע שבחודש
--         הקרוב"* ⇒ *"…" לאירוע שבחודש הקרוב"*. ברבים — כמו היום.
--      📏 היום v_red = 6 ⇒ המסך של מ14 לא משתנה; הענף ביחיד נבדק אחרי ההחלה בהרצת הביטוי מהגוף החי עם
--         ערכים מדומים (`db_roadmap.md` §10ב).
-- what: החלפות "בדיוק פעם אחת" על הגופים החיים (`pg_get_functiondef`), אותן חתימות ⇒ ה-ACL נשמר.
-- reversible: כן — החלפות הפוכות. טקסט בלבד; אין שינוי-סכמה ואין נתונים.

do $m14s$
declare
  v_oid oid;
  v_def text;
  v_old text := $o$           || case when v_red = 1 then 'דיילת אדומה אחת'
                   else to_char(coalesce(v_red, 0), 'FM999,999,999') || ' דיילות אדומות' end
           || ', ' || to_char(coalesce(v_red_active, 0), 'FM999,999,999') ||
           ' מהן פעילות ומוצעות היום בשיבוץ.' end,$o$;
  v_new text := $n$           -- ✏️ 24/09/2026: יחיד/רבים גם לדיילת האדומה וגם ל"פעילות" (היה: "דיילת אדומה אחת, 1 מהן פעילות").
           || case when v_red = 1 then 'דיילת אדומה אחת, '
                     || case when coalesce(v_red_active, 0) >= 1 then 'והיא פעילה ומוצעת היום בשיבוץ.'
                             else 'והיא אינה פעילה היום.' end
                   else to_char(coalesce(v_red, 0), 'FM999,999,999') || ' דיילות אדומות, '
                     || case when coalesce(v_red_active, 0) = 0 then 'אף אחת מהן אינה פעילה היום.'
                             when v_red_active = 1 then 'אחת מהן פעילה ומוצעת היום בשיבוץ.'
                             else to_char(v_red_active, 'FM999,999,999') || ' מהן פעילות ומוצעות היום בשיבוץ.' end
              end end,$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m14_hostess_overview';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, v_old, ''))) <> length(v_old) then
    raise exception 'm14s: so-what segment not exactly once'; end if;
  execute replace(v_def, v_old, v_new);
end $m14s$;

do $m12s$
declare
  v_oid oid;
  v_def text;
  v_old text := $o$        || v_top_order || '" ל-' || v_lri || v_top_events || v_pdi
        || case when v_top_events = 1 then ' האירוע שבחודש הקרוב' else ' האירועים שבחודש הקרוב' end$o$;
  v_new text := $n$        -- ✏️ 24/09/2026: ביחיד בלי מספר — "לאירוע שבחודש הקרוב" (היה: "ל-1 האירוע").
        || v_top_order || case when v_top_events = 1 then '" לאירוע שבחודש הקרוב'
                               else '" ל-' || v_lri || v_top_events || v_pdi || ' האירועים שבחודש הקרוב' end$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m12_equipment';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, v_old, ''))) <> length(v_old) then
    raise exception 'm12s: so-what events segment not exactly once'; end if;
  execute replace(v_def, v_old, v_new);
end $m12s$;
