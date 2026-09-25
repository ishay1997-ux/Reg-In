-- why: הכלל של ישי, 25/09/2026 02:2X, בצ'אט הסגן, מילה-במילה (הועבר ע"י הסגן): *"רק לשים לב להשאיר את המערכת נקיה
--      ובוגרת... ואולי רק במצב הטמעה שיהיו הסברים מובנים מנוסחים היטב לפי עקרונות הUCD"*. והסגן: *"שינוי אחד בעקבות זה:
--      המשפט "4 ב-30 הימים הקרובים — הם הראשונים ברשימה" במ14 עובר לרמז של האריח. שורת-המשנה לא משתנה."*
--      ‏20260925010300 הוסיף לשורת-המשנה של "אירועים עם חוסר" את *" · במסך הדיילות, ב"הציגי חסרים בלבד", הם הראשונים
--      ברשימה"*. ⇒ יורד מכאן, ונכנס לרמז `reports.hostessOverview.gapEvents` (מצב 2, `onboardingCopy.m11.hostesses.js`).
--      היחיד/רבים של 010300 נשאר — הוא מצב, לא הסבר.
--      🧱 קובץ נפרד ולא עריכה: 010300 כבר קומט, וה-hook `protect-frozen-files.sh` אוסר לערוך מיגרציה שקומטה (fix-forward).
-- what: שתי החלפות "בדיוק פעם אחת" על הגוף שאחרי 010300, אותה חתימה ⇒ ה-ACL נשמר: הסיומת יורדת, וההערה בקוד מתעדכנת.
-- 📏 הגוף לפני: md5 `4fbd074d0e850ec89d58904c3021e99b`, ‏32,233 תווים (= הצפוי של 20260925010300). סדר: אחריו,
--    ולפני 20260925010350 (הדלת — אחרי העלייה לאוויר; ה-md5 שלה מחושב מחדש על הבסיס הזה).
-- 📏 הגוף הצפוי אחרי: md5 `eae6970dd391098550ac4240bbcf0272`, ‏31,940 תווים — בלוק-ניסיון משורשר (25/09 ~02:2X, כמנכ"ל,
--    pg_temp, מתגלגל; md5 הבלוק נבדק במסד): 010300 ואחריו הקובץ הזה. שורת-המשנה אחרי: "4 מתוך 21 אירועים · 14 מקומות ·
--    0 זימונים ממתינים" (הנוסח שלפני הלילה) · בלי חץ.
-- 🔴 **ה-md5 בכותרת של 20260925010350 (הדלת) כבר לא נכון:** הוא חושב על 010300 בלבד. עם הקובץ הזה, הצפוי של הדלת הוא
--    md5 `af0ecb180488e715e4a65aaf88a47174`, ‏32,205 תווים (בלוק-ניסיון משורשר 010300 ⇐ 010800 ⇐ 010350, 25/09 ~02:2X;
--    target אחרי = {"path": "/hostesses?filter=missing", "module": "דיילות"}). 010350 קומט ולכן אינו נערך.
-- reversible: כן — ההחלפות ההפוכות. אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל, אחרי 20260925010300.

do $m14g$
declare
  v_oid oid;
  v_def text;
  v_old_note text := $o$        -- ✏️ 25/09/2026 (הכרעת הסגן): יחיד כשהמספר 1, ובסוף — איפה רואים אותם. במסך הדיילות אין אופק
        --    (16 חסרים ב-25/09), ולכן המשפט אומר שהאירועים שבאריח הם הראשונים שם.$o$;
  v_new_note text := $n$        -- ✏️ 25/09/2026 (הכרעת הסגן): יחיד כשהמספר 1. איפה רואים אותם — ברמז
        --    reports.hostessOverview.gapEvents (מצב 2), לא כאן (הכלל של ישי 02:2X).$n$;
  v_old_tail text := $o$                       || case when coalesce(v_gap_events, 0) = 0 then ''
                               when v_gap_events = 1 then ' · במסך הדיילות, ב"הציגי חסרים בלבד", הוא הראשון ברשימה'
                               else ' · במסך הדיילות, ב"הציגי חסרים בלבד", הם הראשונים ברשימה' end end)),$o$;
  v_new_tail text := $n$                  end)),$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m14_hostess_overview';
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_note, ''))) <> length(v_old_note) then
    raise exception 'm14g: sub-comment segment not exactly once (is 20260925010300 applied?)'; end if;
  if (length(v_def) - length(replace(v_def, v_old_tail, ''))) <> length(v_old_tail) then
    raise exception 'm14g: sub-suffix segment not exactly once (is 20260925010300 applied?)'; end if;

  v_def := replace(v_def, v_old_note, v_new_note);
  v_def := replace(v_def, v_old_tail, v_new_tail);
  execute v_def;
end $m14g$;
