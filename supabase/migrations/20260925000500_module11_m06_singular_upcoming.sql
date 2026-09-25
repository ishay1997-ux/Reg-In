-- why: הכרעת הסגן, 25/09/2026 (מילה-במילה): *"יחיד ורבים: "1 אירועים" בכרטיס מסך-הבית ... **ו**-"1 אירועים
--      קרובים" (6ד) ⇐ "אירוע אחד". הכלל, לא רק שתי השורות: חפש את הדפוס "מספר + אירועים" בשאר הקוד."*
--      והסמכות מישי הערב (צ'אט הסגן, ~23:5X): *"בצע מה שאתה יכול עכשיו"*.
--      הממצא: הצלם קרא באתר החי (25/09 00:3X) את שורת "אז מה" של "איכות אירועים" (מ6), שמוצגת על הבמה
--      בכנס (שורת-הדמו 6ד): *"…בלעדיה הציון 2.1 מול 4.2; 1 אירועים קרובים עדיין בלי."* — עברית שבורה.
--      📏 נמדד לפני הכתיבה (25/09, קריאה בלבד, `pg_get_functiondef` חי, md5 `6c5546543b055829026eb75b6e83b0d1`,
--         ‏12,811 תווים; הגוף נקרא עד הסוף, 214 שורות):
--         · קריאה כמנכ"לית, ברירת-מחדל: `v_risk_lead` = 1 ⇐ *"; ⁦1⁩ אירועים קרובים עדיין בלי."* (שורה 134).
--         · שורת-ההיקף (`population.summary`, שורות 149–150 — התווית של שבב-ההיקף, `ReportSurface.jsx:67`):
--           בלי לקוח ⁦552⁩ מתוך ⁦743⁩. אבל בבורר-הלקוח: מתוך 61 לקוחות, ל-3 יש משוב אחד בדיוק, ול-2 מהם
--           גם אירוע אחד בדיוק שהתקיים. לקוח 226 ⇐ *"⁦1⁩ אירועים עם משוב · מתוך ⁦1⁩ שהתקיימו"* · לקוח 407 ⇐
--           *"⁦1⁩ אירועים עם משוב · מתוך ⁦3⁩ שהתקיימו"*. ⇐ אותו דפוס, גלוי, ומגיע ל-1 בשימוש אמיתי — מתוקן כאן.
--         · ביום הכנס (חלון 15/10–29/10, לפי השיבוץ של היום): 10 אירועים קרובים, ולכולם כבר ראש-משמרת
--           שאושרה סופית ⇐ אם השיבוץ לא ישתנה, הסיומת תהיה "." בלבד. התיקון מכסה את שלושת המצבים בכל מקרה.
--      ⚪ נשארו כמו שהם (נבדקו): שורה 164 — תת-השורה של האריח "⁦N⁩ אירועים" מוצגת רק כש-N ≥ 20 (`v_min_n`),
--         ולכן לעולם לא 1 · שורה 165 — "אין מספיק נתונים (N)": מספר בסוגריים, בלי שם-עצם · שורה 154 — המפתח
--         'אירועים בלי משוב שהושלם' ב-`population.excluded`: צורת תווית:ערך, ואף רכיב בלקוח אינו מציג אותו ·
--         שורות 186 ו-200 — מספרים קבועים (20 · 14 · 2 · 50), לא ספירה.
-- what: שלוש החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר. הדפוס:
--       `20260924213000_module11_m02_revenue_tile_no_door.sql`.
--       (1) הסיומת של "אז מה": 1 ⇐ "; אירוע קרוב אחד עדיין בלי." (בלי ספרה — "אחד" הוא המספר) ·
--           2 ומעלה ⇐ כמו היום · 0 ⇐ "." כמו היום.
--       (2)+(3) שורת-ההיקף: משוב אחד ⇐ "אירוע אחד עם משוב" · אירוע אחד שהתקיים ⇐ "· מתוך אחד שהתקיים" ·
--           כל מספר אחר (כולל 0) ⇐ המחרוזת של היום, תו-בתו.
--       📏 צפוי אחרי ההחלה: md5 `3af65969c9279ca4601a315d7264690a`, ‏13,013 תווים (חושב ב-SELECT שמחיל את
--          אותן שלוש החלפות על `pg_get_functiondef` החי, ושוחזר בבלוק-הדמה של 25/09).
-- reversible: כן — שלוש ההחלפות ההפוכות (או הגוף הקודם, md5 למעלה). אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m06s$
declare
  v_oid oid;
  v_def text;
  -- (1) הסיומת של "אז מה": אירועים קרובים בלי ראש-משמרת.
  v_old_risk text := $o$case when v_risk_lead > 0 then '; ' || v_lri || v_risk_lead || v_pdi || ' אירועים קרובים עדיין בלי.' else '.' end$o$;
  v_new_risk text := $n$case when v_risk_lead = 1 then '; אירוע קרוב אחד עדיין בלי.' when v_risk_lead > 1 then '; ' || v_lri || v_risk_lead || v_pdi || ' אירועים קרובים עדיין בלי.' else '.' end$n$;
  -- (2) שורת-ההיקף, החצי הראשון: כמה אירועים עם משוב.
  v_old_fb text := $o$'summary', v_lri || to_char(coalesce(v_fb_n, 0), 'FM999,999') || v_pdi || ' אירועים עם משוב · מתוך '$o$;
  v_new_fb text := $n$'summary', case when coalesce(v_fb_n, 0) = 1 then 'אירוע אחד עם משוב' else v_lri || to_char(coalesce(v_fb_n, 0), 'FM999,999') || v_pdi || ' אירועים עם משוב' end$n$;
  -- (3) שורת-ההיקף, החצי השני: מתוך כמה שהתקיימו.
  v_old_held text := $o$|| v_lri || to_char(coalesce(v_held_n, 0), 'FM999,999') || v_pdi || ' שהתקיימו',$o$;
  v_new_held text := $n$|| case when coalesce(v_held_n, 0) = 1 then ' · מתוך אחד שהתקיים' else ' · מתוך ' || v_lri || to_char(coalesce(v_held_n, 0), 'FM999,999') || v_pdi || ' שהתקיימו' end,$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m06_staffing';
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_risk, ''))) <> length(v_old_risk) then
    raise exception 'm06s: upcoming-no-lead suffix not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_fb, ''))) <> length(v_old_fb) then
    raise exception 'm06s: summary feedback-count segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_held, ''))) <> length(v_old_held) then
    raise exception 'm06s: summary held-count segment not exactly once'; end if;

  v_def := replace(v_def, v_old_risk, v_new_risk);
  v_def := replace(v_def, v_old_fb, v_new_fb);
  v_def := replace(v_def, v_old_held, v_new_held);
  execute v_def;
end $m06s$;
