-- why: סבב-נוסח שני לדוחות — ההחלפות שישי אישר ב-14/10 ~19:2X ("מאשר הכל"). נוסח בלבד:
--      אף מספר, אף שדה, אף חתימה ואף חישוב אינם משתנים. כל מספר נשאר מחושב בדיוק כמו היום.
-- what:
--   ① report_m04_discounts — שורת-ההחלטה "לא לתת מעל N% הנחה כדי לסגור — הסגירה בה A% מול B% בלי הנחה, והרווח יורד ל-C%."
--        ⇒ "הנחה מעל N% לא משתלמת: נסגרות A% מההצעות (B% בלי הנחה), והשוליים יורדים ל-C%."
--        (הענף "רק כדי לסגור — הסגירה כמעט זהה" אינו בכרטיס ואינו נוגע.)
--   ② report_m14_hostess_overview + report_m15_reliability — שמות-הקטגוריה "אדומה/אדומות" ⇒ "בסיכון גבוה",
--        "ענבר" ⇒ "במעקב", בכל טקסט שהמשתמשת רואה (אריח, תת-שורה, עמודת "סימון", שורת-ההחלטה, ההגדרות).
--        מ15: "… N הדיילות האדומות — … ; M דיילות ענבר לאזהרה." ⇒ "… N הדיילות בסיכון גבוה — … ; M נוספות במעקב."
--        שם-הפרמטר מקדם_אמינות_ענבר (מזהה) והערות-הקוד — לא נוגעים.
--   ③ report_m21_drifting — "שתיהן שקטו פי X ופי Y מהקצב שלהן" ⇒ "שתיהן לא הזמינו כבר פי X ופי Y מהזמן הרגיל אצלן";
--        וביחיד "שקטה פי X מהקצב שלה" ⇒ "לא הזמינה כבר פי X מהזמן הרגיל אצלה".
--   ④ report_m14_hostess_overview + report_m17_fairness — תווית האריח "רבע הדיילות העמוסות" ⇒ "רבע מהדיילות עשו"
--        (האריח במ14: "רבע מהדיילות עשו 57.0% מהמשמרות"). פורמט האחוז ('percent') אינו משתנה כאן.
--   ⑤ מקפים-של-קוד בתוויות גלויות, רק בתוך מחרוזת שמוצגת למשתמשת — לעולם לא בהערה, מזהה, שם-עמודה או מפתח JSON:
--        m04 שולי-רווח ×4 · שביעות-הרצון ×2 | m06 ראש-משמרת ×7 ⇒ "אחראית משמרת" · מבט-על ×1 | m07 יתרת-חוב ×4 |
--        m08 שולי-רווח · חציון-סטייה · שעות-צוות ×3 (מתוך 5; 2 בהערות) · ציון-משוב | m09 יתרת-חוב · מדרג-גיול ×2 ·
--        סוג-לקוח ×1 (מתוך 2; 1 בהערה) | m14 אי-הגעה ×2 | m15 אי-הגעה ×8 (מתוך 11; 3 בהערות) | m19 שביעות-הרצון ×1 |
--        m22 טופס-המשוב ×1.
--   לא נמצאו בשום פונקציית report_*: מסנני-דף · באיחור-תשלום · דמי-ביטול · שיעור-היענות · דוח-סיכום · שינויי-תכולה ·
--        פרטי-בנק (דמי-ביטול חי ב-get_finance_overview, דוח-סיכום ב-close_project_operationally — מחוץ ל-report_*).
--   "מול 41 אצל המרוצה": הגוף החי של report_m19_customers_overview כבר אומר "אצל המרוצים" — אין מה להחליף.
--   מבט-על במ02 (×2) ובמ19 (×1), ימי-האיחור במ07 (×2), ראש-משמרת במ14 (×1) — כולם בהערות-קוד בלבד ⇒ לא נוגעים.
-- how: הטכניקה של 20261014170000: pg_get_functiondef החי + pg_temp.m11_replace_once — כל עוגן חייב להופיע
--      **בדיוק פעם אחת** (אחרת raise). replace סופר (pg_temp.m11_replace_n) רק למילה/מחרוזת שכל N מופעיה בתוך
--      מחרוזות גלויות, עם assert על N. אחרי ההחלפות — assert על מספר המופעים שנותרו (ההערות בלבד), ואז execute,
--      ו-assert על proacl לכל פונקציה. אותה חתימה ⇒ CREATE OR REPLACE ⇒ ההרשאות נשמרות.
--      העוגנים הם טקסט ה-SQL החי (עם v_lri/v_pdi/||), לא הטקסט המוצג.
-- measured before writing (14/10/2026, SELECT בלבד), md5(pg_get_functiondef):
--      m04_discounts            = 2c92b1fd628b00dd4c978cb19ee80f89
--      m06_staffing             = 8e44dc98c59af282e9ad80250aa09bdb
--      m07_finance_overview     = 74074d4e9cf14194e6761189f143e69e
--      m08_profitability        = 2d443b5cd84ca8b10e4026553acf4f2c
--      m09_aging                = 4b545a222a04b062a014dabe90b6f9f7
--      m14_hostess_overview     = 85b595b4495ad6fa50a7a6acc6df9eb2
--      m15_reliability          = d162caf3c1d537ee09f1f4bf02a9c3b2
--      m17_fairness             = 23c00d62c353675f69748cc150e1699c
--      m19_customers_overview   = 5a89660680addbe3426bcd26bff617c1
--      m21_drifting             = 3661fe4abc43e1674ab7f7a94ef28c5a
--      m22_notes                = d6ba163c87f524658a3bfd7b4c3960b1
--      proacl (כולן) = {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
-- reversible: כן — החלפה הפוכה (new ⇒ old) מחזירה את הגוף הקודם.

create or replace function pg_temp.m11_replace_once(p_def text, p_old text, p_new text, p_tag text)
returns text language plpgsql as $f$
begin
  if (length(p_def) - length(replace(p_def, p_old, ''))) <> length(p_old) then
    raise exception 'm11 report copy 2 %: expected exactly one occurrence', p_tag;
  end if;
  return replace(p_def, p_old, p_new);
end
$f$;

create or replace function pg_temp.m11_replace_n(p_def text, p_old text, p_new text, p_n integer, p_tag text)
returns text language plpgsql as $f$
begin
  if (length(p_def) - length(replace(p_def, p_old, ''))) <> p_n * length(p_old) then
    raise exception 'm11 report copy 2 %: expected exactly % occurrences', p_tag, p_n;
  end if;
  return replace(p_def, p_old, p_new);
end
$f$;

create or replace function pg_temp.m11_assert_left(p_def text, p_word text, p_n integer, p_tag text)
returns void language plpgsql as $f$
begin
  if (length(p_def) - length(replace(p_def, p_word, ''))) <> p_n * length(p_word) then
    raise exception 'm11 report copy 2 %: expected % occurrences left (comments only)', p_tag, p_n;
  end if;
end
$f$;

create or replace function pg_temp.m11_assert_acl(p_name text)
returns void language plpgsql as $f$
begin
  if (select p.proacl::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = p_name)
     <> '{postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}' then
    raise exception 'm11 report copy 2: % proacl changed', p_name;
  end if;
end
$f$;

do $m11$
declare
  v_def text;
begin
  -- ═══ report_m04_discounts ═══════════════════════════════════════════════════════════
  v_def := pg_get_functiondef('public.report_m04_discounts(date,date,integer,jsonb,integer,integer)'::regprocedure);

  -- ① שורת-ההחלטה — שלושה עוגנים באותו ענף (v_c10 < v_c0)
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'לא לתת מעל ' || v_lri || '10%' || v_pdi || ' הנחה כדי לסגור — הסגירה בה '$o$,
    $n$'הנחה מעל ' || v_lri || '10%' || v_pdi || ' לא משתלמת: נסגרות '$n$,
    'm04 so_what head');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$|| ' מול ' || v_lri || to_char(v_c0, 'FM990.0') || '%' || v_pdi || ' בלי הנחה'$o$,
    $n$|| ' מההצעות (' || v_lri || to_char(v_c0, 'FM990.0') || '%' || v_pdi || ' בלי הנחה)'$n$,
    'm04 so_what base');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$', והרווח יורד ל-'$o$,
    $n$', והשוליים יורדים ל-'$n$,
    'm04 so_what margin');

  -- ⑤ מקפים — כל המופעים בתוך מחרוזות גלויות (תוויות, ציר, עמודה, הגדרות)
  v_def := pg_temp.m11_replace_n(v_def, 'שולי-רווח', 'שולי רווח', 4, 'm04 שולי-רווח');
  v_def := pg_temp.m11_replace_n(v_def, 'שביעות-הרצון', 'שביעות הרצון', 2, 'm04 שביעות-הרצון');

  execute v_def;
  perform pg_temp.m11_assert_acl('report_m04_discounts');

  -- ═══ report_m06_staffing ════════════════════════════════════════════════════════════
  v_def := pg_get_functiondef('public.report_m06_staffing(date,date,integer,jsonb,integer,integer)'::regprocedure);

  -- ⑤ ראש-משמרת ⇒ אחראית משמרת: 7 מופעים, כולם במחרוזות (גורם, השוואה, סיכון, שורת-ההחלטה, עמודה, הגדרות ×2)
  v_def := pg_temp.m11_replace_n(v_def, 'ראש-משמרת', 'אחראית משמרת', 7, 'm06 ראש-משמרת');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$במבט-על לקוחות.'$o$,
    $n$במבט על לקוחות.'$n$,
    'm06 מבט-על');

  execute v_def;
  perform pg_temp.m11_assert_acl('report_m06_staffing');

  -- ═══ report_m07_finance_overview ════════════════════════════════════════════════════
  v_def := pg_get_functiondef('public.report_m07_finance_overview(date,date,integer,jsonb,date,integer,integer)'::regprocedure);

  -- ⑤ יתרת-חוב: 4 מופעים, כולם במחרוזות (אריח, סדרה, הגדרות ×2). ימי-האיחור — רק בהערות, לא נוגעים.
  v_def := pg_temp.m11_replace_n(v_def, 'יתרת-חוב', 'יתרת חוב', 4, 'm07 יתרת-חוב');

  execute v_def;
  perform pg_temp.m11_assert_acl('report_m07_finance_overview');

  -- ═══ report_m08_profitability ═══════════════════════════════════════════════════════
  v_def := pg_get_functiondef('public.report_m08_profitability(date,date,integer,jsonb)'::regprocedure);

  v_def := pg_temp.m11_replace_once(v_def,
    $o$'label', 'שולי-רווח בתקופה',$o$,
    $n$'label', 'שולי רווח בתקופה',$n$,
    'm08 שולי-רווח');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'label', 'חציון-סטייה',$o$,
    $n$'label', 'חציון סטייה',$n$,
    'm08 חציון-סטייה');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'label', 'שעות-צוות מתוכננות',$o$,
    $n$'label', 'שעות צוות מתוכננות',$n$,
    'm08 שעות-צוות planned col');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'label', 'שעות-צוות בפועל',$o$,
    $n$'label', 'שעות צוות בפועל',$n$,
    'm08 שעות-צוות actual col');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$· שעות-צוות מתוכננות = משך-האירוע$o$,
    $n$· שעות צוות מתוכננות = משך-האירוע$n$,
    'm08 שעות-צוות definition');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'label', 'ציון-משוב',$o$,
    $n$'label', 'ציון משוב',$n$,
    'm08 ציון-משוב');
  perform pg_temp.m11_assert_left(v_def, 'שעות-צוות', 2, 'm08 שעות-צוות');

  execute v_def;
  perform pg_temp.m11_assert_acl('report_m08_profitability');

  -- ═══ report_m09_aging ═══════════════════════════════════════════════════════════════
  v_def := pg_get_functiondef('public.report_m09_aging(date,date,integer,jsonb,date)'::regprocedure);

  v_def := pg_temp.m11_replace_once(v_def,
    $o$'label', 'יתרת-חוב פתוחה',$o$,
    $n$'label', 'יתרת חוב פתוחה',$n$,
    'm09 יתרת-חוב');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'חוב באיחור לפי מדרג-גיול וסוג-לקוח'$o$,
    $n$'חוב באיחור לפי מדרג גיול וסוג לקוח'$n$,
    'm09 chart title');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'definitions', 'מדרג-גיול נמדד$o$,
    $n$'definitions', 'מדרג גיול נמדד$n$,
    'm09 definitions');
  perform pg_temp.m11_assert_left(v_def, 'סוג-לקוח', 1, 'm09 סוג-לקוח');
  perform pg_temp.m11_assert_left(v_def, 'מדרג-גיול', 0, 'm09 מדרג-גיול');

  execute v_def;
  perform pg_temp.m11_assert_acl('report_m09_aging');

  -- ═══ report_m14_hostess_overview ════════════════════════════════════════════════════
  v_def := pg_get_functiondef('public.report_m14_hostess_overview(date,date,integer,jsonb)'::regprocedure);

  -- ② קטגוריות
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'label', 'דיילות אדומות',$o$,
    $n$'label', 'דיילות בסיכון גבוה',$n$,
    'm14 red tile label');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$' בענבר'),$o$,
    $n$' במעקב'),$n$,
    'm14 red tile sub amber');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'אין דיילות אדומות בחלון — $o$,
    $n$'אין דיילות בסיכון גבוה בחלון — $n$,
    'm14 so_what none');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'דיילת אדומה אחת, '$o$,
    $n$'דיילת אחת בסיכון גבוה, '$n$,
    'm14 so_what one');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$' דיילות אדומות, '$o$,
    $n$' דיילות בסיכון גבוה, '$n$,
    'm14 so_what many');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'דיילת אדומה = ציון-אמינות$o$,
    $n$'דיילת בסיכון גבוה = ציון-אמינות$n$,
    'm14 definition red');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'; דיילת ענבר = מתחת ל-'$o$,
    $n$'; דיילת במעקב = מתחת ל-'$n$,
    'm14 definition amber');

  -- ④ אריח רבע-הדיילות
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'label', 'רבע הדיילות העמוסות',$o$,
    $n$'label', 'רבע מהדיילות עשו',$n$,
    'm14 top quarter tile');

  -- ⑤ אי-הגעה: 2 מופעים, שניהם במחרוזות (כותרת הגרף, סדרה)
  v_def := pg_temp.m11_replace_n(v_def, 'אי-הגעה', 'אי הגעה', 2, 'm14 אי-הגעה');

  -- מה שנשאר — הערות-קוד ושם-הפרמטר מקדם_אמינות_ענבר בלבד
  perform pg_temp.m11_assert_left(v_def, 'אדומות', 2, 'm14 אדומות');
  perform pg_temp.m11_assert_left(v_def, 'אדומה', 2, 'm14 אדומה');
  perform pg_temp.m11_assert_left(v_def, 'ענבר', 5, 'm14 ענבר');

  execute v_def;
  perform pg_temp.m11_assert_acl('report_m14_hostess_overview');

  -- ═══ report_m15_reliability ═════════════════════════════════════════════════════════
  v_def := pg_get_functiondef('public.report_m15_reliability(date,date,integer,jsonb)'::regprocedure);

  -- ② קטגוריות — עמודת "סימון"
  v_def := pg_temp.m11_replace_once(v_def,
    $o$then 'אדומה'$o$,
    $n$then 'בסיכון גבוה'$n$,
    'm15 band_label red');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$then 'ענבר'$o$,
    $n$then 'במעקב'$n$,
    'm15 band_label amber');

  -- ② תת-השורה של אריח "דיילות מסומנות"
  v_def := pg_temp.m11_replace_once(v_def,
    $o$then ' אדומה · ' else ' אדומות · ' end$o$,
    $n$then ' בסיכון גבוה · ' else ' בסיכון גבוה · ' end$n$,
    'm15 flagged sub red');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$' ענבר מתוך '$o$,
    $n$' במעקב מתוך '$n$,
    'm15 flagged sub amber');

  -- ② שורת-ההחלטה
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'להזהיר את דיילת הענבר — אף אחת אינה אדומה כרגע.'$o$,
    $n$'להזהיר את הדיילת במעקב — אף אחת אינה בסיכון גבוה כרגע.'$n$,
    'm15 so_what amber one');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$' דיילות הענבר — אף אחת אינה אדומה כרגע.'$o$,
    $n$' הדיילות במעקב — אף אחת אינה בסיכון גבוה כרגע.'$n$,
    'm15 so_what amber many');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'לא לשלוח את הדיילת האדומה — '$o$,
    $n$'לא לשלוח את הדיילת בסיכון גבוה — '$n$,
    'm15 so_what red one');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$' הדיילות האדומות — '$o$,
    $n$' הדיילות בסיכון גבוה — '$n$,
    'm15 so_what red many');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'אין דיילות ענבר.'$o$,
    $n$'אין דיילות במעקב.'$n$,
    'm15 so_what amber none');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'דיילת ענבר אחת לאזהרה.'$o$,
    $n$'אחת נוספת במעקב.'$n$,
    'm15 so_what amber tail one');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$' דיילות ענבר לאזהרה.'$o$,
    $n$' נוספות במעקב.'$n$,
    'm15 so_what amber tail many');

  -- ② ההגדרות
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'דיילת אדומה = ציון-אמינות$o$,
    $n$'דיילת בסיכון גבוה = ציון-אמינות$n$,
    'm15 definition red');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$' · דיילת ענבר = מתחת ל-'$o$,
    $n$' · דיילת במעקב = מתחת ל-'$n$,
    'm15 definition amber');

  -- ⑤ אי-הגעה: 8 מופעים במחרוזות (3 נוספים בהערות-קוד — לא נוגעים)
  v_def := pg_temp.m11_replace_once(v_def,
    $o$עמודת "אי-הגעה · אי-פעם" אינה$o$,
    $n$עמודת "אי הגעה · אי-פעם" אינה$n$,
    'm15 day note');
  v_def := pg_temp.m11_replace_n(v_def,
    $o$'אי-הגעה (הבריזה)'$o$,
    $n$'אי הגעה (הבריזה)'$n$,
    2, 'm15 tile + series label');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'איחור ואי-הגעה לפי יום בשבוע'$o$,
    $n$'איחור ואי הגעה לפי יום בשבוע'$n$,
    'm15 chart title');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'label', 'אי-הגעה · אי-פעם',$o$,
    $n$'label', 'אי הגעה · אי-פעם',$n$,
    'm15 column');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$רק אי-הגעה בלי הודעה$o$,
    $n$רק אי הגעה בלי הודעה$n$,
    'm15 definition no-show');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'"אי-הגעה · אי-פעם" היא$o$,
    $n$'"אי הגעה · אי-פעם" היא$n$,
    'm15 definition ever');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'title', 'אי-הגעה לפי דירוג'$o$,
    $n$'title', 'אי הגעה לפי דירוג'$n$,
    'm15 extra table title');

  -- מה שנשאר — הערות-קוד ושם-הפרמטר מקדם_אמינות_ענבר בלבד
  perform pg_temp.m11_assert_left(v_def, 'אי-הגעה', 3, 'm15 אי-הגעה');
  perform pg_temp.m11_assert_left(v_def, 'אדומות', 2, 'm15 אדומות');
  perform pg_temp.m11_assert_left(v_def, 'אדומה', 1, 'm15 אדומה');
  perform pg_temp.m11_assert_left(v_def, 'ענבר', 4, 'm15 ענבר');

  execute v_def;
  perform pg_temp.m11_assert_acl('report_m15_reliability');

  -- ═══ report_m17_fairness ════════════════════════════════════════════════════════════
  v_def := pg_get_functiondef('public.report_m17_fairness(date,date,integer,jsonb)'::regprocedure);

  -- ④ אריח רבע-הדיילות (אותו אריח כמו במ14)
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'label', 'רבע הדיילות העמוסות',$o$,
    $n$'label', 'רבע מהדיילות עשו',$n$,
    'm17 top quarter tile');

  execute v_def;
  perform pg_temp.m11_assert_acl('report_m17_fairness');

  -- ═══ report_m19_customers_overview ══════════════════════════════════════════════════
  v_def := pg_get_functiondef('public.report_m19_customers_overview(date,date,integer,jsonb,integer,integer)'::regprocedure);

  -- ⑤ שביעות-הרצון: מופע אחד, בכותרת הגרף. (סוג-לקוח ומבט-על כאן — בהערות בלבד.)
  v_def := pg_temp.m11_replace_once(v_def,
    $o$'ממוצע שביעות-הרצון לפי חודש · '$o$,
    $n$'ממוצע שביעות הרצון לפי חודש · '$n$,
    'm19 chart title');

  execute v_def;
  perform pg_temp.m11_assert_acl('report_m19_customers_overview');

  -- ═══ report_m21_drifting ════════════════════════════════════════════════════════════
  v_def := pg_get_functiondef('public.report_m21_drifting(date,date,integer,jsonb)'::regprocedure);

  -- ③ לקוחה אחת
  v_def := pg_temp.m11_replace_once(v_def,
    $o$' — שקטה פי '$o$,
    $n$' — לא הזמינה כבר פי '$n$,
    'm21 one head');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$' מהקצב שלה, '$o$,
    $n$' מהזמן הרגיל אצלה, '$n$,
    'm21 one tail');

  -- ③ שתיים
  v_def := pg_temp.m11_replace_once(v_def,
    $o$' — שתיהן שקטו פי '$o$,
    $n$' — שתיהן לא הזמינו כבר פי '$n$,
    'm21 two head');
  v_def := pg_temp.m11_replace_once(v_def,
    $o$' מהקצב שלהן.'$o$,
    $n$' מהזמן הרגיל אצלן.'$n$,
    'm21 two tail');

  execute v_def;
  perform pg_temp.m11_assert_acl('report_m21_drifting');

  -- ═══ report_m22_notes ═══════════════════════════════════════════════════════════════
  v_def := pg_get_functiondef('public.report_m22_notes(date,date,integer,jsonb)'::regprocedure);

  v_def := pg_temp.m11_replace_once(v_def,
    $o$בטופס-המשוב — המודל$o$,
    $n$בטופס המשוב — המודל$n$,
    'm22 so_what');

  execute v_def;
  perform pg_temp.m11_assert_acl('report_m22_notes');
end
$m11$;
