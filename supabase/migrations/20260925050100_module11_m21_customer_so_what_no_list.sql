-- why: בדיקת-ניסוח עצמאית של מחרוזות הלילה (Reg-In-evidence/reports-review-2026-09-25/night/tonight-copy-review.md,
--      ממצא 0-3, "מבלבל"). כשנבחר לקוח, הטבלה מציגה רק אותו — ושורת "אז מה" פותחת ב"כל הלקוחות, לא רק הלקוח שנבחר:"
--      ומיד שולחת את המנהלת "ללקוחות שברשימה — 13 מתרחקים". ברשימה יש שורה אחת. מתחת לאריחים כבר עומדת שורת-הסייג
--      "האריחים מחושבים על כל הלקוחות, לא רק על הלקוח שנבחר" (customerIgnoredTilesLine), ולכן אותו סייג נאמר פעמיים ברצף.
-- what: החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר.
--       (1) הקידומת "כל הלקוחות, לא רק הלקוח שנבחר: " יורדת.
--       (2) שני ענפי "להתקשר השבוע ללקוחות שברשימה" (יחיד ורבים): כשנבחר לקוח הם אומרים "בכל העסק" במקום "שברשימה" —
--           "להתקשר השבוע ל-‹13› הלקוחות המתרחקים בכל העסק — וכולם כבר מעבר לסף ‹120› הימים הקיים."
--           בלי לקוח — הנוסח הקיים, מילה במילה.
--       🔑 הענפים שנוקבים בשם איש-קשר ("להתקשר השבוע לדנה מ…") לא משתנים: השם עצמו אומר על מי מדובר.
--       🚫 לא נוגע: האריחים · השורות · ההערות · שורת-האוכלוסייה.
-- 📏 הגוף החי לפני: md5 `edbba94e7ed2f32ae4fdaee4058d3c43`, ‏32,063 תווים (= אחרי 20260925011000; נמדד 25/09 06:1X).
-- 📏 הגוף הצפוי אחרי: md5 `c406930e658d66bdd0397e722750073a`, ‏32,412 תווים — בלוק-ניסיון (25/09 06:2X, כמנכ"ל,
--    pg_temp, מתגלגל; md5 הבלוק `523015a8…` נבדק במסד מול הקובץ). בלי לקוח: אפס שינויים בכל חלקי הדוח.
--    עם לקוח 213: השתנה רק "אז מה" — הקידומת ירדה ("להתקשר השבוע לענבר אשכנזי מגלובל שיפינג… ולאביגיל לוי…").
--    ⚠️ שני הענפים ששונו (בלי שם איש-קשר) לא הופעלו בנתונים החיים — היום יש שמות להתקשר אליהם.
-- reversible: כן — ההחלפות ההפוכות, או הגוף הקודם (md5 למעלה). אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — ממתין לאישור ישי.

do $m21n$
declare
  v_oid oid;
  v_def text;
  -- (1) הקידומת.
  v_old_pre text := $o$    -- ✏️ 25/09/2026 (הכרעת הסגן, F2): המשפט מחושב על כל הלקוחות — גם כשנבחר לקוח. אז הוא אומר את זה.
    'so_what', case when p_customer_id is null then '' else 'כל הלקוחות, לא רק הלקוח שנבחר: ' end || case
$o$;
  v_new_pre text := $n$    -- ✏️ 25/09/2026 (בדיקת-ניסוח 0-3): המשפט מחושב על כל הלקוחות. כשנבחר לקוח, הסייג יושב פעם אחת —
    --    בשורה שמעל האריחים — והענפים שמפנים לרשימה אומרים "בכל העסק" במקום "שברשימה".
    'so_what', case
$n$;
  -- (2א) יחיד.
  v_old_one text := $o$        then 'להתקשר השבוע ללקוח שברשימה — הוא מתרחק, וכבר מעבר לסף ' || v_lri || coalesce(v_dormant::text, '—') || v_pdi
$o$;
  v_new_one text := $n$        then case when p_customer_id is null then 'להתקשר השבוע ללקוח שברשימה — הוא מתרחק, וכבר מעבר לסף '
                  else 'להתקשר השבוע ללקוח המתרחק היחיד בכל העסק — הוא כבר מעבר לסף ' end
             || v_lri || coalesce(v_dormant::text, '—') || v_pdi
$n$;
  -- (2ב) רבים.
  v_old_many text := $o$        then 'להתקשר השבוע ללקוחות שברשימה — ' || v_lri || to_char(v_drift_n, 'FM999,999,999') || v_pdi
             || ' מתרחקים, וכולם כבר מעבר לסף ' || v_lri || coalesce(v_dormant::text, '—') || v_pdi
$o$;
  v_new_many text := $n$        then case when p_customer_id is null then 'להתקשר השבוע ללקוחות שברשימה — ' else 'להתקשר השבוע ל-' end
             || v_lri || to_char(v_drift_n, 'FM999,999,999') || v_pdi
             || case when p_customer_id is null then ' מתרחקים, וכולם כבר מעבר לסף '
                     else ' הלקוחות המתרחקים בכל העסק — וכולם כבר מעבר לסף ' end
             || v_lri || coalesce(v_dormant::text, '—') || v_pdi
$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m21_drifting';
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_pre, ''))) <> length(v_old_pre) then
    raise exception 'm21n: prefix segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_one, ''))) <> length(v_old_one) then
    raise exception 'm21n: singular segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_many, ''))) <> length(v_old_many) then
    raise exception 'm21n: plural segment not exactly once'; end if;

  v_def := replace(v_def, v_old_pre, v_new_pre);
  v_def := replace(v_def, v_old_one, v_new_one);
  v_def := replace(v_def, v_old_many, v_new_many);
  execute v_def;
end $m21n$;
