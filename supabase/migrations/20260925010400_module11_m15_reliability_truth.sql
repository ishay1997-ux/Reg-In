-- why: הכרעות הסגן, 25/09/2026 ~01:3X (סבב תיקוני-אמת) ו-01:3X (ממצאי-העיניים של צלם-דוחות), מילה-במילה:
--      *"מ15 F3: "מוצגות —" סותר את "אינן בדוח" (15 דיילות / 20 שיבוצים)."* ·
--      *"מ15 F2, "מצב-יום מרוקן את הציון": לא נמדד. תבדוק. אם זה באג, הוא בפנים."* ·
--      *"① "מעל שני הספים" מופיע ב-38 שורות, וזה ז'רגון. ⇐ "תקינה". זה אותו קובץ-מיגרציה של מ15 שאתה כבר כותב."* ·
--      ויחיד/רבים: *"כל מספר שיכול להיות 1"*.
--      📏 נמדד 25/09 ~01:3X, כמנכ"ל, report_m15_reliability(25/09/2025–25/09/2026) עם p_drill {"dow":0} ובלעדיו:
--         · F2 — מצב-יום: 79 מתוך 90 שורות. "ציון אמינות" ו"הגיעה בזמן" ריקים בכל השורות — בכוונה (הערה בגוף:
--           "במצב-יום עמודות-החלון מציגות —"). מה שמשקר: **כותרת העמודה "הבריזה · ב-12 חודשים" נשארת, והערך הוא של
--           אותו יום** (מעיין קדוש: 4 ⇐ 1). ההערה בתחתית מסבירה רק חצי ("הספירות… של אותו יום"), ולא למה הציון ריק.
--           האריחים ושורת-"אז מה" לא זזים — והם גם לא טוענים שזזו. ⇒ באג-ניסוח, בפנים.
--         · F3 — שורת-האוכלוסייה: "הוצאו: 15 דיילות עם פחות מ-3 משמרות מסומנות (מוצגות "—" ולא אחוז)", וההערה בתחתית
--           "…אינן בדוח (20 שיבוצים)". הן באמת לא בטבלה (90 שורות).
--         · "מעל שני הספים" = הסימון של 78 דיילות (recheck 01:1X).
-- what: שבע החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר.
--       (1) עמודת "סימון": "מעל שני הספים" ⇐ "תקינה".
--       (2) הערת מצב-יום: אומרת גם למה "הגיעה בזמן" ו"ציון אמינות" ריקים.
--       (3) שורת-האוכלוסייה: "(מוצגות "—" ולא אחוז)" ⇐ "(אינן בדוח)", ויחיד כשהוצאה דיילת אחת.
--       (4) שורת-המשנה של "דיילות מסומנות": "‹1› אדומה" ביחיד.
--       (5) כותרת העמודה: במצב-יום "הבריזה · ביום הזה".
--       (6) שורת-"אז מה": יחיד לאדומה אחת / ענבר אחת / פעילה אחת.
--       (7) הערת-השוליים "מתחת לסף המדגם": יחיד כשהמספר 1.
--       🚫 לא נוגע: הציון, הספים, הטבלה הנוספת "אי-הגעה לפי דירוג" (הערתה — קוד-לקוח, ReportSurface), עמודת "ביטלה
--          אחרי אישור" ולא-פעילות כברירת-מחדל (טעם, לבוקר). צבע לתגית-הסימון: אין פורמט כזה בטבלה — לבוקר.
-- 📏 הגוף החי לפני: md5 `fa878407a7beef4162de932e2f9c53ff`, ‏30,357 תווים (= אחרי 20260925000200).
-- 📏 הגוף הצפוי אחרי: md5 `e655f8421ead09fa5ae6e33ee62203b2`, ‏32,193 תווים — בלוק-הניסיון (25/09, בין 01:40 ל-01:56, כמנכ"ל,
--    pg_temp, מתגלגל; md5 הבלוק נבדק במסד מול הקובץ). בלי יום: 90 שורות (כמו החי) · "סימון": אדומה 5 · ענבר 7 ·
--    תקינה 78 · שורת-האוכלוסייה "…הוצאו: 15 דיילות עם פחות מ-3 משמרות מסומנות (אינן בדוח)…" · "אז מה" ללא שינוי
--    (5 אדומות, 5 פעילות, 7 ענבר). ביום ראשון ({"dow":0}): 79 שורות · הכותרת "הבריזה · ביום הזה" · ההערה אומרת למה
--    "הגיעה בזמן" ו"ציון אמינות" ריקים.
-- reversible: כן — ההחלפות ההפוכות, או הגוף הקודם (md5 למעלה). אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m15c$
declare
  v_oid oid;
  v_def text;
  -- (1) "תקינה".
  v_old_band text := $o$                                   when v_bands_on       then 'מעל שני הספים' end,$o$;
  v_new_band text := $n$                                   -- ✏️ 25/09/2026 (הכרעת הסגן): "מעל שני הספים" היה ז'רגון (78 שורות).
                                   when v_bands_on       then 'תקינה' end,$n$;
  -- (2) הערת מצב-יום.
  v_old_day text := $o$      ('הספירות בטבלה הן של אותו יום בלבד; עמודת "אי-הגעה · אי-פעם" אינה תלוית-יום ונשארת כפי שהיא.')::text);$o$;
  v_new_day text := $n$      -- ✏️ 25/09/2026: ההערה אמרה רק חצי — הציון וההגעה-בזמן ריקים במצב-יום (נמדד), והמסך לא אמר למה.
      ('הספירות בטבלה הן של אותו יום בלבד; "הגיעה בזמן" ו"ציון אמינות" נמדדים על כל ימי השבוע ולכן ריקים כאן; '
       || 'עמודת "אי-הגעה · אי-פעם" אינה תלוית-יום ונשארת כפי שהיא.')::text);$n$;
  -- (3) שורת-האוכלוסייה.
  v_old_pop text := $o$               to_char(coalesce(v_shifts_in, 0), 'FM999,999,999') || ' שיבוצים · הוצאו: ' || to_char(coalesce(v_below, 0), 'FM999,999,999') ||
               ' דיילות עם פחות מ-' || coalesce(to_char(v_min_sample, 'FM999,999,999'), '—') ||
               ' משמרות מסומנות (מוצגות "—" ולא אחוז) · היעדרויות באישור מראש ומחלה — לא במונה ולא במכנה, כדי שדיילת שהודיעה מראש לא תיענש כמי שהבריזה.',$o$;
  v_new_pop text := $n$               -- ✏️ 25/09/2026 (הכרעת הסגן): "(מוצגות "—" ולא אחוז)" סתר את ההערה "אינן בדוח" — והן אינן בטבלה.
               to_char(coalesce(v_shifts_in, 0), 'FM999,999,999') || ' שיבוצים · הוצאו: ' ||
               case when v_below = 1 then 'דיילת אחת' else to_char(coalesce(v_below, 0), 'FM999,999,999') || ' דיילות' end ||
               ' עם פחות מ-' || coalesce(to_char(v_min_sample, 'FM999,999,999'), '—') ||
               ' משמרות מסומנות (אינן בדוח) · היעדרויות באישור מראש ומחלה — לא במונה ולא במכנה, כדי שדיילת שהודיעה מראש לא תיענש כמי שהבריזה.',$n$;
  -- (4) שורת-המשנה של "דיילות מסומנות".
  v_old_flag text := $o$        'sub', to_char(coalesce(v_red, 0), 'FM999,999,999') || ' אדומות · ' || to_char(coalesce(v_amber, 0), 'FM999,999,999') || ' ענבר מתוך ' ||$o$;
  v_new_flag text := $n$        'sub', to_char(coalesce(v_red, 0), 'FM999,999,999') || case when v_red = 1 then ' אדומה · ' else ' אדומות · ' end
                  || to_char(coalesce(v_amber, 0), 'FM999,999,999') || ' ענבר מתוך ' ||$n$;
  -- (5) כותרת עמודת ההבריזה במצב-יום.
  v_old_col text := $o$      jsonb_build_object('key', 'no_show_12m',   'label', 'הבריזה · ב-12 חודשים', 'format', 'int',   'align', 'end'),$o$;
  v_new_col text := $n$      -- ✏️ 25/09/2026: במצב-יום הערך הוא של אותו יום (נמדד: מעיין קדוש 4 ⇐ 1), והכותרת אמרה "ב-12 חודשים".
      jsonb_build_object('key', 'no_show_12m',
                         'label', case when v_dow is null then 'הבריזה · ב-12 חודשים' else 'הבריזה · ביום הזה' end,
                         'format', 'int',   'align', 'end'),$n$;
  -- (6) שורת-"אז מה".
  v_old_sw text := $o$      when coalesce(v_red, 0) = 0 then 'להזהיר את ' || to_char(coalesce(v_amber, 0), 'FM999,999,999') || ' דיילות הענבר — אף אחת אינה אדומה החודש.'
      else 'לא לשלוח את ' || to_char(coalesce(v_red, 0), 'FM999,999,999') || ' הדיילות האדומות — ' || to_char(coalesce(v_red_active, 0), 'FM999,999,999') ||
           ' מהן פעילות ומוצעות היום בשיבוץ; ' || to_char(coalesce(v_amber, 0), 'FM999,999,999') || ' דיילות ענבר לאזהרה.' end,$o$;
  v_new_sw text := $n$      -- ✏️ 25/09/2026 (הכרעת הסגן): יחיד כשהמספר 1 — "1 הדיילות האדומות — 1 מהן פעילות" היה אפשרי.
      when coalesce(v_red, 0) = 0 then
        case when v_amber = 1 then 'להזהיר את דיילת הענבר — אף אחת אינה אדומה החודש.'
             else 'להזהיר את ' || to_char(coalesce(v_amber, 0), 'FM999,999,999') || ' דיילות הענבר — אף אחת אינה אדומה החודש.' end
      else case when v_red = 1 then 'לא לשלוח את הדיילת האדומה — '
                                    || case when coalesce(v_red_active, 0) >= 1 then 'היא פעילה ומוצעת היום בשיבוץ; '
                                            else 'היא אינה פעילה היום; ' end
                else 'לא לשלוח את ' || to_char(coalesce(v_red, 0), 'FM999,999,999') || ' הדיילות האדומות — '
                     || case when coalesce(v_red_active, 0) = 1 then 'אחת מהן פעילה ומוצעת היום בשיבוץ; '
                             else to_char(coalesce(v_red_active, 0), 'FM999,999,999') || ' מהן פעילות ומוצעות היום בשיבוץ; ' end end
           || case when coalesce(v_amber, 0) = 0 then 'אין דיילות ענבר.'
                   when v_amber = 1 then 'דיילת ענבר אחת לאזהרה.'
                   else to_char(v_amber, 'FM999,999,999') || ' דיילות ענבר לאזהרה.' end end,$n$;
  -- (7) הערת-השוליים "מתחת לסף המדגם".
  v_old_note text := $o$        ('מתחת לסף המדגם: ' || to_char(coalesce(v_below, 0), 'FM999,999,999') || ' דיילות עם פחות מ-' ||
         coalesce(to_char(v_min_sample, 'FM999,999,999'), '—') || ' משמרות מסומנות אינן בדוח (' ||
         to_char(coalesce(v_shifts_out, 0), 'FM999,999,999') || ' שיבוצים).')::text),$o$;
  v_new_note text := $n$        -- ✏️ 25/09/2026: יחיד כשהמספר 1.
        ('מתחת לסף המדגם: '
         || case when v_below = 1 then 'דיילת אחת עם פחות מ-' || coalesce(to_char(v_min_sample, 'FM999,999,999'), '—')
                                       || ' משמרות מסומנות אינה בדוח ('
                 else to_char(coalesce(v_below, 0), 'FM999,999,999') || ' דיילות עם פחות מ-'
                      || coalesce(to_char(v_min_sample, 'FM999,999,999'), '—') || ' משמרות מסומנות אינן בדוח (' end
         || case when v_shifts_out = 1 then 'שיבוץ אחד).'
                 else to_char(coalesce(v_shifts_out, 0), 'FM999,999,999') || ' שיבוצים).' end)::text),$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m15_reliability';
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_band, ''))) <> length(v_old_band) then
    raise exception 'm15c: band-label segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_day, ''))) <> length(v_old_day) then
    raise exception 'm15c: day-note segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_pop, ''))) <> length(v_old_pop) then
    raise exception 'm15c: population segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_flag, ''))) <> length(v_old_flag) then
    raise exception 'm15c: flagged-sub segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_col, ''))) <> length(v_old_col) then
    raise exception 'm15c: ghosted-column segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_sw, ''))) <> length(v_old_sw) then
    raise exception 'm15c: so-what segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_note, ''))) <> length(v_old_note) then
    raise exception 'm15c: below-sample note segment not exactly once'; end if;

  v_def := replace(v_def, v_old_band, v_new_band);
  v_def := replace(v_def, v_old_day, v_new_day);
  v_def := replace(v_def, v_old_pop, v_new_pop);
  v_def := replace(v_def, v_old_flag, v_new_flag);
  v_def := replace(v_def, v_old_col, v_new_col);
  v_def := replace(v_def, v_old_sw, v_new_sw);
  v_def := replace(v_def, v_old_note, v_new_note);
  execute v_def;
end $m15c$;
