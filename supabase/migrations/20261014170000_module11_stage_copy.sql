-- why: ניסוח הדוחות לפני הבמה ב-15/10 — שמונה החלפות-נוסח שישי אישר ב-14/10 ~16:5X ("מאשר הכל לפי המלצתך").
--      נוסח בלבד: אף מספר, אף שדה, אף חתימה ואף חישוב אינם משתנים.
-- what: ① report_m02_exec_overview — "שולי-רווח" ⇒ "שולי רווח" בשלושת המופעים הנראים: תווית האריח ("שולי רווח גולמי"),
--          כותרת העמודה בטבלה, והגדרה בשורת ה-definitions. (המופעים "שולי-הרווח" עם ה"א — בשורת-ההחלטה — לא בהחלטה ולא נוגעים.)
--       ② report_m03_trends:
--          #4 תווית האריח "סך הצעות שפג תוקפן" ⇒ "הצעות שפג תוקפן" (ובאותה מילה — המונח בשורת ה-definitions, כדי שהמילון לא יציג שם שאינו על המסך)
--          #5 תווית האריח "סגירה, לקוח חדש" ⇒ "שיעור סגירה – לקוחות חדשים" (מקף en), ותת-השורה "אין מספיק נתונים (12)" ⇒ "(12 הצעות)" · "(1 הצעה)" ביחיד
--          #6 כותרת גרף 2 "שיעור סגירה לפי מאפיין" ⇒ "שיעור סגירה לפי סוג לקוח ומועד ההצעה"
--          #7 שורת-ההחלטה "… — 10 פגו בלי מענה, 53,024 ₪." ⇒ "… — 10 הצעות פגו בלי מענה, בשווי 53,024 ₪." · ביחיד "הצעה אחת פגה בלי מענה, בשווי …"
--          #8 הערת-הגרף "13 הצעות פתוחות שתאריך האירוע שלהן עבר — לא נספרו." ⇒ "… — לא נכללו בחישוב." (וכך גם הביחיד: "לא נכללה בחישוב")
--       #2 (הערת "החודש האחרון עוד לא הסתיים") ו-#3 (תווית "שנה מלאה") הם צד-לקוח בלבד — אין להם מופע ב-SQL: מחרוזת החודש-החלקי נבנית ב-chartShape.js,
--       והתווית ב-FiltersBar.jsx. (נמדד: ב-report_m02_exec_overview "החודש האחרון חלקי" מופיע פעם אחת, בהערת SQL בלבד.)
--       לא נוגע: "לשים לב", החצים ▲▼, "שהוכרעו", "על מה מפסידים הצעות" (ישי השאיר).
-- how: הטכניקה של 20261014151000 (L1): pg_get_functiondef החי + replace מדויק, כל מחרוזת-מקור נבדקת שהיא מופיעה
--      **בדיוק פעם אחת** (אחרת raise), ואז execute. אותה חתימה ⇒ CREATE OR REPLACE ⇒ ההרשאות נשמרות; assert בסוף לכל פונקציה.
--      העוגנים הם טקסט ה-SQL החי, לא הטקסט המוצג.
-- measured before writing (14/10/2026, SELECT בלבד): כל 12 העוגנים מופיעים פעם אחת בדיוק ·
--      md5(pg_get_functiondef) m02 = 095b6db56e21f65f4e60e50a494d7788 · m03 = 27077526ad6b913ad3ef9784db52e4da ·
--      proacl (שתיהן) = {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
-- not touched, by card: report_m04_discounts (4 מופעים) ו-report_m08_profitability (1 מופע) של "שולי-רווח" — מחוץ לכרטיס.
-- reversible: כן — החלפה הפוכה (new ⇒ old) מחזירה את הגוף הקודם.

create or replace function pg_temp.m11_replace_once(p_def text, p_old text, p_new text, p_tag text)
returns text language plpgsql as $f$
begin
  if (length(p_def) - length(replace(p_def, p_old, ''))) <> length(p_old) then
    raise exception 'm11 stage copy %: expected exactly one occurrence', p_tag;
  end if;
  return replace(p_def, p_old, p_new);
end
$f$;

do $m11$
declare
  v_def text;
  v_acl constant text := '{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}';
begin
  -- ═══ report_m02_exec_overview ═══════════════════════════════════════════════════════
  v_def := pg_get_functiondef('public.report_m02_exec_overview(date,date,integer,jsonb,integer,integer)'::regprocedure);

  -- #1 · תווית האריח
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'key', 'margin', 'label', 'שולי-רווח גולמי',$o$,
    $n$'key', 'margin', 'label', 'שולי רווח גולמי',$n$,
    'm02 margin tile');

  -- #1 · כותרת העמודה
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'label', 'שולי-רווח', 'format', 'percent'$o$,
    $n$'label', 'שולי רווח', 'format', 'percent'$n$,
    'm02 margin column');

  -- #1 · שורת ה-definitions
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'שולי-רווח = סך הרווח$o$,
    $n$'שולי רווח = סך הרווח$n$,
    'm02 margin definition');

  -- ✏️ הסגן, 14/10 ~17:1x: גם "שולי-הרווח" (עם ה"א) בשורת-ההחלטה ⇒ "שולי הרווח". אותה הכרעה (אין מקף בצירוף הזה),
  -- ובלי זה האריח אומר "שולי רווח" והמשפט שמעליו "שולי-הרווח" — על אותו מסך שמוצג בבמה. נמדד: 5 מופעים בדיוק.
  if (length(v_def) - length(replace(v_def, 'שולי-הרווח', ''))) <> 5 * length('שולי-הרווח') then
    raise exception 'm11 stage copy: expected exactly 5 occurrences of שולי-הרווח in m02';
  end if;
  v_def := replace(v_def, 'שולי-הרווח', 'שולי הרווח');

  execute v_def;

  if (select p.proacl::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = 'report_m02_exec_overview') <> v_acl then
    raise exception 'm11 stage copy: report_m02_exec_overview proacl changed';
  end if;

  -- ═══ report_m03_trends ══════════════════════════════════════════════════════════════
  v_def := pg_get_functiondef('public.report_m03_trends(date,date,integer,jsonb)'::regprocedure);

  -- #4 · תווית האריח
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'label', 'סך הצעות שפג תוקפן',$o$,
    $n$'label', 'הצעות שפג תוקפן',$n$,
    'm03 expired tile label');

  -- #4 · המונח בשורת ה-definitions
  v_def := pg_temp.m11_replace_once(v_def,
    $o$סך הצעות שפג תוקפן = הצעות שהמערכת$o$,
    $n$הצעות שפג תוקפן = הצעות שהמערכת$n$,
    'm03 expired definition');

  -- #5 · תווית האריח
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'label', 'סגירה, לקוח חדש',$o$,
    $n$'label', 'שיעור סגירה – לקוחות חדשים',$n$,
    'm03 new customer tile label');

  -- #5 · תת-השורה "אין מספיק נתונים (N הצעות)" — ביטוי ה-N נשאר, ביחיד "הצעה"
  v_def := pg_temp.m11_replace_once(v_def,
    $o$coalesce(v_new_dec, 0) || v_pdi || ')' end,$o$,
    $n$coalesce(v_new_dec, 0) || v_pdi
                         || case when coalesce(v_new_dec, 0) = 1 then ' הצעה' else ' הצעות' end || ')' end,$n$,
    'm03 new customer sub');

  -- #6 · כותרת גרף 2
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'type', 'bar', 'labelKey', 'bar_label', 'title', 'שיעור סגירה לפי מאפיין',$o$,
    $n$'type', 'bar', 'labelKey', 'bar_label', 'title', 'שיעור סגירה לפי סוג לקוח ומועד ההצעה',$n$,
    'm03 chart 2 title');

  -- #7 · שורת-ההחלטה — "N הצעות פגו בלי מענה, בשווי X ₪" · ביחיד "הצעה אחת פגה בלי מענה, בשווי X ₪"
  v_def := pg_temp.m11_replace_once(v_def,
    E'v_lri || v_exp_n || v_pdi\n      || case when v_exp_n = 1 then '' פגה'' else '' פגו'' end || '' בלי מענה, ''',
    E'case when v_exp_n = 1 then ''הצעה אחת פגה''\n             else v_lri || v_exp_n || v_pdi || '' הצעות פגו'' end || '' בלי מענה, בשווי ''',
    'm03 so_what expired');

  -- #8 · הערת "לא נכללו בחישוב" — רבים ויחיד
  v_def := pg_temp.m11_replace_once(v_def,
    $o$שלהן עבר — לא נספרו.'$o$,
    $n$שלהן עבר — לא נכללו בחישוב.'$n$,
    'm03 open past plural');

  v_def := pg_temp.m11_replace_once(v_def,
    $o$שלה עבר — לא נספרה.'$o$,
    $n$שלה עבר — לא נכללה בחישוב.'$n$,
    'm03 open past singular');

  execute v_def;

  if (select p.proacl::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = 'report_m03_trends') <> v_acl then
    raise exception 'm11 stage copy: report_m03_trends proacl changed';
  end if;
end
$m11$;
