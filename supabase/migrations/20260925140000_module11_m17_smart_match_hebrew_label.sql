-- why: באריח של דוח "הוגנות בשיבוץ" (מ17) כתוב "אימוץ המלצת Smart Match" — שם באנגלית שאינו שם המסך. המנהלת
--      מכירה את המסך כ"שיבוץ חכם". משימת הסגן 25/09 14:XX, אחרי ישי בשיחת הסגן 14:0X: *"מאשר הכל לפי המלצתך"*.
--      הטקסט נולד ב-`20260923180000_module11_l1_report_copy.sql`.
-- what: החלפה "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר.
--       תווית האריח `rank1_adoption`: "אימוץ המלצת Smart Match" ⇐ "אימוץ המלצת השיבוץ החכם".
--       🚫 לא נוגע: הערך · שאר האריחים · הטבלה · ההערות. (📏 25/09: זו ההופעה היחידה של "Smart Match" בגוף.)
-- 📏 הגוף החי לפני: md5 `16314e547de0f0a7495eae620e7a3c51`, ‏23,273 תווים (נמדד 25/09 ~14:3X).
-- 📏 הגוף הצפוי אחרי: ר' db_roadmap.md §10ב (בלוק-ניסיון מתגלגל, כמנכ"ל).
-- reversible: כן — ההחלפה ההפוכה, או הגוף הקודם (md5 למעלה). אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m17h$
declare
  v_oid oid;
  v_def text;
  v_old_label text := $o$'label', 'אימוץ המלצת Smart Match',$o$;
  v_new_label text := $n$'label', 'אימוץ המלצת השיבוץ החכם',$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m17_fairness';
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_label, ''))) <> length(v_old_label) then
    raise exception 'm17h: label segment not exactly once'; end if;

  v_def := replace(v_def, v_old_label, v_new_label);
  execute v_def;
end $m17h$;
