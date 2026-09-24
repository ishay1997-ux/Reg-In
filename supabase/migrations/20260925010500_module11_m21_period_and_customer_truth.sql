-- why: הכרעת הסגן, 25/09/2026 ~01:3X (סבב תיקוני-אמת), מילה-במילה:
--      *"מ21 F1: מסנן-התקופה לא עושה כלום (ספטמבר = השנה). אם הדוח מוגדר "נכון להיום", המסנן לא מוצג, וכתוב "נכון להיום".
--      מ21 F2: customer_filter_ignored על האריחים. אם המסך לא אומר את זה למנהלת, זה שקר."* ·
--      *"יחיד/רבים: מ21 "1 מהם עומדים" … כל מספר שיכול להיות 1."*
--      📏 נמדד (explain\מ21-drifting.json, recheck 25/09 01:1X): ספטמבר בלבד (01/09–25/09) מחזיר אותם 4 אריחים בדיוק כמו
--         "השנה" (13 · 346,224.59 ₪ · 4 · 382). ‏`v_from` מופיע בגוף רק בהשמה ובהד-החלון (`'from', v_from`, פעם אחת —
--         נספר 25/09). הדוח מוגדר "נכון להיום": ‏`window.label` = "נכון ל-‹היום› · …".
--      🔑 איך המעטפת מזהה דוח שמתעלם מהתקופה — בלי שינוי-לקוח: ‏`readScope` (`src/modules/11_reports/ReportsPage.jsx:139–146`,
--         זהה ב-`main` 94db912d): ‏`periodIgnored = window.from == null || meta.period_filter_ignored != null` ⇒ הגלולות
--         מוחלפות בעובדה `periodFact(window.label)` = "נכון ל-‹היום›". ⇒ ‏`'from', null` מספיק, והקוד שבייצור כבר קורא אותו.
--      📏 F2: ‏`meta.customer_filter_ignored` = מערך של 4 האריחים; ‏`readScope` קורא רק `=== true` ⇒ המסך לא אומר דבר.
--         גם שורת-"אז מה" מחושבת על כל הלקוחות (‏`v_call` — אין בו `p_customer_id`). ⇒ כשנבחר לקוח: שורת-"אז מה" נפתחת
--         ב"כל הלקוחות, לא רק הלקוח שנבחר:", והערת-שוליים אומרת מה מסונן ומה לא. (בענף גם שורה מעל האריחים — קוד-לקוח.)
-- what: חמש החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר.
--       (1) ‏`window.from` ⇐ null (הדוח "נכון להיום"; `to` נשאר).
--       (2) שורת-"אז מה": קידומת כשנבחר לקוח · יחיד כשמתרחק לקוח אחד בענף "כולם מעבר לסף".
--       (3) הערת-שוליים חדשה כשנבחר לקוח.
--       (4) הערת "פחות משלושה אירועים": ‏"‹1› מהם עומדים" ⇐ "אחד מהם עומד", ויחיד ללקוח אחד.
--       (5) שורת-האוכלוסייה: יחיד ללקוח אחד בשתי ההוצאות.
--       🚫 לא נוגע: האריחים, הטבלה, הגרף, ההגדרות, המיסוך (§7.100) — הקידומת בשורת-"אז מה" אינה נושאת ₪.
-- 📏 הגוף החי לפני: md5 `89ebc5edeff7893a775ffa01d1ae49d4`, ‏30,370 תווים (= אחרי 20260925000100).
-- 📏 הגוף הצפוי אחרי: md5 `2d79dd5e80026131f8d7eeb9709a27d7`, ‏32,147 תווים — בלוק-הניסיון (25/09, בין 01:40 ל-01:56, כמנכ"ל,
--    pg_temp, מתגלגל; md5 הבלוק נבדק במסד מול הקובץ בריצה נפרדת — אותו md5). בלי לקוח: ‏window = {from: null,
--    to: 2026-09-25, label: "נכון ל-25/09/2026 · כל הלקוחות"} · האריחים והטבלה זהים לחי · ההערה "2 לקוחות … אחד מהם
--    עומד בתנאי "רדום"" · "אז מה" ללא שינוי. עם לקוח (213): "אז מה" נפתח ב"כל הלקוחות, לא רק הלקוח שנבחר:", והערה
--    "נבחר לקוח: הטבלה מציגה רק אותו. ארבעת האריחים ושורת "מה זה אומר" מחושבים על כל הלקוחות.".
-- reversible: כן — ההחלפות ההפוכות, או הגוף הקודם (md5 למעלה). אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m21d$
declare
  v_oid oid;
  v_def text;
  -- (1) החלון: "נכון להיום".
  v_old_win text := $o$    'window', jsonb_build_object(
      'from', v_from, 'to', v_to,$o$;
  v_new_win text := $n$    'window', jsonb_build_object(
      -- ✏️ 25/09/2026 (הכרעת הסגן): ‏`from` = null — הדוח "נכון להיום" ואינו מסנן לפי תקופה (ספטמבר = השנה, נמדד).
      --    ‏`readScope` במעטפת מחליף את גלולות-התקופה בעובדה "נכון ל-‹היום›" (מ-`label`).
      'from', null, 'to', v_to,$n$;
  -- (2) שורת-"אז מה".
  v_old_sw text := $o$    'so_what', case
      when v_drift_n = 0 then 'אין לקוח מתרחק כרגע.'
      when jsonb_array_length(v_call) = 0
        then 'להתקשר השבוע ללקוחות שברשימה — ' || v_lri || to_char(v_drift_n, 'FM999,999,999') || v_pdi
             || ' מתרחקים, וכולם כבר מעבר לסף ' || v_lri || coalesce(v_dormant::text, '—') || v_pdi
             || ' הימים הקיים.'$o$;
  v_new_sw text := $n$    -- ✏️ 25/09/2026 (הכרעת הסגן, F2): המשפט מחושב על כל הלקוחות — גם כשנבחר לקוח. אז הוא אומר את זה.
    'so_what', case when p_customer_id is null then '' else 'כל הלקוחות, לא רק הלקוח שנבחר: ' end || case
      when v_drift_n = 0 then 'אין לקוח מתרחק כרגע.'
      -- ✏️ 25/09/2026: יחיד כשמתרחק לקוח אחד (היה: "1 מתרחקים, וכולם").
      when jsonb_array_length(v_call) = 0 and v_drift_n = 1
        then 'להתקשר השבוע ללקוח שברשימה — הוא מתרחק, וכבר מעבר לסף ' || v_lri || coalesce(v_dormant::text, '—') || v_pdi
             || ' הימים הקיים.'
      when jsonb_array_length(v_call) = 0
        then 'להתקשר השבוע ללקוחות שברשימה — ' || v_lri || to_char(v_drift_n, 'FM999,999,999') || v_pdi
             || ' מתרחקים, וכולם כבר מעבר לסף ' || v_lri || coalesce(v_dormant::text, '—') || v_pdi
             || ' הימים הקיים.'$n$;
  -- (3)+(4) ההערות.
  v_old_notes text := $o$    || to_jsonb((v_lri || to_char((v_counts ->> 'below_min')::integer, 'FM999,999,999') || v_pdi
                 || ' לקוחות עם פחות משלושה אירועים שהתקיימו אינם בדוח; '
                 || v_lri || to_char(v_dorm_lt3, 'FM999,999,999') || v_pdi || ' מהם עומדים בתנאי "רדום".')::text)$o$;
  v_new_notes text := $n$    -- ✏️ 25/09/2026 (הכרעת הסגן): יחיד כשהמספר 1 (נמדד: "‹1› מהם עומדים בתנאי "רדום"").
    || to_jsonb((case when (v_counts ->> 'below_min')::integer = 1
                      then 'לקוח אחד עם פחות משלושה אירועים שהתקיימו אינו בדוח; '
                      else v_lri || to_char((v_counts ->> 'below_min')::integer, 'FM999,999,999') || v_pdi
                           || ' לקוחות עם פחות משלושה אירועים שהתקיימו אינם בדוח; ' end
                 || case when v_dorm_lt3 = 0 then 'אף אחד מהם אינו עומד בתנאי "רדום".'
                         when v_dorm_lt3 = 1 and (v_counts ->> 'below_min')::integer = 1 then 'הוא עומד בתנאי "רדום".'
                         when v_dorm_lt3 = 1 then 'אחד מהם עומד בתנאי "רדום".'
                         else v_lri || to_char(v_dorm_lt3, 'FM999,999,999') || v_pdi || ' מהם עומדים בתנאי "רדום".' end)::text)
    -- ✏️ 25/09/2026 (הכרעת הסגן, F2): כשנבחר לקוח — מה מסונן ומה לא.
    || case when p_customer_id is null then '[]'::jsonb
            else to_jsonb('נבחר לקוח: הטבלה מציגה רק אותו. ארבעת האריחים ושורת "מה זה אומר" מחושבים על כל הלקוחות.'::text) end$n$;
  -- (5) שורת-האוכלוסייה.
  v_old_pop text := $o$               || v_lri || to_char((v_counts ->> 'no_held')::integer, 'FM999,999,999') || v_pdi || ' לקוחות בלי אף אירוע שהתקיים · '
               || v_lri || to_char((v_counts ->> 'below_min')::integer, 'FM999,999,999') || v_pdi
               || ' עם פחות משלושה · אירועים מבוטלים ואירועים עתידיים אינם נספרים בקצב.',$o$;
  v_new_pop text := $n$               -- ✏️ 25/09/2026: יחיד כשהמספר 1.
               || case when (v_counts ->> 'no_held')::integer = 1 then 'לקוח אחד בלי אף אירוע שהתקיים · '
                       else v_lri || to_char((v_counts ->> 'no_held')::integer, 'FM999,999,999') || v_pdi || ' לקוחות בלי אף אירוע שהתקיים · ' end
               || case when (v_counts ->> 'below_min')::integer = 1 then 'אחד עם פחות משלושה'
                       else v_lri || to_char((v_counts ->> 'below_min')::integer, 'FM999,999,999') || v_pdi || ' עם פחות משלושה' end
               || ' · אירועים מבוטלים ואירועים עתידיים אינם נספרים בקצב.',$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m21_drifting';
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_win, ''))) <> length(v_old_win) then
    raise exception 'm21d: window segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_sw, ''))) <> length(v_old_sw) then
    raise exception 'm21d: so-what segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_notes, ''))) <> length(v_old_notes) then
    raise exception 'm21d: notes segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_pop, ''))) <> length(v_old_pop) then
    raise exception 'm21d: population segment not exactly once'; end if;

  v_def := replace(v_def, v_old_win, v_new_win);
  v_def := replace(v_def, v_old_sw, v_new_sw);
  v_def := replace(v_def, v_old_notes, v_new_notes);
  v_def := replace(v_def, v_old_pop, v_new_pop);
  execute v_def;
end $m21d$;
