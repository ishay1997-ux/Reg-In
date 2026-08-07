-- =====================================================================================
-- Module 3 (Quotes) — Migration 2: Seed products / price_tiers / params
-- =====================================================================================
-- why (blueprint-M3, ruled Ishay; seed per LOCKED doc reference_spec/products_and_params.md):
--   the catalog + pricing tiers + global params the pricing engine reads. Exact composition:
--   11 products, 40 price_tiers, 20 params. Locked decisions applied (NOT the raw table verbatim):
--   #1 English enums (category site/hostess/product; status active; 5 param_type enums)
--   #2 SKUs with NO leading hyphen (06ST/04ST/01WEB)
--   #3 services priced by base_price → NO price_tiers for 06ST/04ST/01WEB (tiers only for tags/lanyards)
--   #4 add שכר_מינימום_שעתי=35; drop the "fixed hostess billing rate" param
--   #5 Smart-Match W3 = מהימנות (not עומס); weights W1=0.4 / W2=0.3 / W3=0.3; name משקולת_3W_מהימנות
--   #6 top tier max_qty = NULL (= infinity), not 99999
--   #8 typo fixes: "שרוך כותנה עם לוגו"; param name "מייל_משרד_רואי_חשבון" (raw had a Latin 'm')
--   #10 param #4 (יום_הפקת_דוח_שכר) NOT seeded (§7.57 ghost param)
--   #11 params = exactly 20 rows (#1–20 minus #4 plus שכר_מינימום_שעתי)
--   #13 branded tag/lanyard SKUs canonical (B-REG-TAG/B-ECO-TAG/B-FAB-LAN/B-SAT-LAN)
--   #14 param קישור_בסיס_סקר_לקוחות = real Google-Form URL
--   #15 email-template bodies (#10–14) seeded verbatim from C5 §5.8.1–5; (#17–20) from C5 §5.8.6/7/9/10
--
-- ⚠️ typed-echo gate (DB protocol): shared Supabase project. Ishay typed the migration name to
--    authorize; applied via Supabase MCP apply_migration (MCP was restored mid-session after an
--    outage that forced migration 1 to be applied manually). Dollar-quoted bodies avoid '-escaping.
-- Note: template bodies are NOT load-bearing for M3 (per doc clarification #15 — email auto-send is M10;
--    they are tunable via params/Table-Editor before then). Framing quote-marks from the transcript
--    are dropped; the message text itself is verbatim.

-- ── products (11) ─────────────────────────────────────────────────────────────────
insert into products (sku, item_name, description, category, unit, base_price, cost, status, image_url) values
  ('06ST',      'שירותי דיילת (6 שעות)', 'דיילת רישום והכוונה', 'hostess', 'משמרת',  800,  500, 'active', 'png6.st/img/'),
  ('04ST',      'שירותי דיילת (4 שעות)', 'דיילת רישום והכוונה', 'hostess', 'משמרת',  500,  300, 'active', 'png4.st/img/'),
  ('01WEB',     'הקמת אתר רישום',        'מערכת רישום מתקדמת',  'site',    'פרויקט', 2500, 1200, 'active', 'png.web/img/'),
  ('REG-TAG',   'תג שם רגיל (חלק)',      'תג פלסטיק סטנדרטי',   'product', 'יחידה',    3,    1, 'active', 'png.r-tag/img/'),
  ('B-REG-TAG', 'תג שם רגיל - ממותג',    'תג פלסטיק מודפס',     'product', 'יחידה',    6,  2.5, 'active', 'png.rb-tag/img/'),
  ('ECO-TAG',   'תג שם אקולוגי (חלק)',   'תג נייר ממוחזר קשיח', 'product', 'יחידה',    5,  1.8, 'active', 'png.e-tag/img/'),
  ('B-ECO-TAG', 'תג שם אקולוגי - ממותג', 'תג ממוחזר מודפס',     'product', 'יחידה',    8,  3.5, 'active', 'png.eb-tag/img/'),
  ('FAB-LAN',   'שרוך בד (חלק)',         'שרוך כותנה פשוט',     'product', 'יחידה',    4,  1.5, 'active', 'png.f-lan/img/'),
  ('B-FAB-LAN', 'שרוך בד - ממותג',       'שרוך כותנה עם לוגו',  'product', 'יחידה',    7,    3, 'active', 'png.fb-lan/img/'),
  ('SAT-LAN',   'שרוך סאטן (חלק)',       'שרוך סאטן יוקרתי',    'product', 'יחידה',    6,    2, 'active', 'png.s-lan/img/'),
  ('B-SAT-LAN', 'שרוך סאטן - ממותג',     'שרוך סאטן עם לוגו',   'product', 'יחידה',    9,    4, 'active', 'png.sb-lan/img/');

-- ── price_tiers (40; NO service tiers per decision #3; top tier max_qty = NULL per #6) ──────────
insert into price_tiers (sku, min_qty, special_price, max_qty) values
  ('REG-TAG',   1, 3.0,   50), ('REG-TAG',   51, 2.8,  200), ('REG-TAG',   201, 2.5,  400), ('REG-TAG',   401, 2.2, 1000), ('REG-TAG',   1001, 1.8, null),
  ('B-REG-TAG', 1, 6.0,   50), ('B-REG-TAG', 51, 5.5,  200), ('B-REG-TAG', 201, 5.0,  400), ('B-REG-TAG', 401, 4.5, 1000), ('B-REG-TAG', 1001, 4.0, null),
  ('ECO-TAG',   1, 5.0,   50), ('ECO-TAG',   51, 4.7,  200), ('ECO-TAG',   201, 4.3,  400), ('ECO-TAG',   401, 3.8, 1000), ('ECO-TAG',   1001, 3.2, null),
  ('B-ECO-TAG', 1, 8.0,   50), ('B-ECO-TAG', 51, 7.5,  200), ('B-ECO-TAG', 201, 7.0,  400), ('B-ECO-TAG', 401, 6.2, 1000), ('B-ECO-TAG', 1001, 5.5, null),
  ('FAB-LAN',   1, 4.0,   50), ('FAB-LAN',   51, 3.7,  200), ('FAB-LAN',   201, 3.3,  400), ('FAB-LAN',   401, 2.8, 1000), ('FAB-LAN',   1001, 2.3, null),
  ('B-FAB-LAN', 1, 7.0,   50), ('B-FAB-LAN', 51, 6.5,  200), ('B-FAB-LAN', 201, 6.0,  400), ('B-FAB-LAN', 401, 5.2, 1000), ('B-FAB-LAN', 1001, 4.5, null),
  ('SAT-LAN',   1, 6.0,   50), ('SAT-LAN',   51, 5.6,  200), ('SAT-LAN',   201, 5.0,  400), ('SAT-LAN',   401, 4.5, 1000), ('SAT-LAN',   1001, 3.8, null),
  ('B-SAT-LAN', 1, 9.0,   50), ('B-SAT-LAN', 51, 8.4,  200), ('B-SAT-LAN', 201, 7.8,  400), ('B-SAT-LAN', 401, 7.0, 1000), ('B-SAT-LAN', 1001, 6.0, null);

-- ── params (20) — scalar rows first, then the 9 email-template bodies (dollar-quoted) ──────────
insert into params (param_name, param_value, param_type) values
  ('ימי_תוקף_הצעה',        '30',                                   'pricing_timing'),
  ('אחוז_מעמ',             '18',                                   'pricing_timing'),
  ('יחס_אורחים_לדיילת',    '50',                                   'pricing_timing'),
  ('שכר_מינימום_שעתי',     '35',                                   'pricing_timing'),
  ('ימי_אזהרה_קדם_אירוע',  '14',                                   'control_alerts'),
  ('שעות_תזכורת_לדיילת',   '24',                                   'control_alerts'),
  ('משקולת_1W_דירוג',      '0.4',                                  'smart_match'),
  ('משקולת_2W_קרבה',       '0.3',                                  'smart_match'),
  ('משקולת_3W_מהימנות',    '0.3',                                  'smart_match'),
  ('קישור_בסיס_סקר_לקוחות', 'https://forms.gle/YFJobqmgpBCqf1x87', 'templates'),
  ('מייל_משרד_רואי_חשבון', 'office@cpa-firm.co.il',                'integration_tech'),
  ('תבנית_מייל_הצעת_מחיר', $tpl$שלום [שם_איש_קשר],
בהמשך לפנייתך, מצורפת בזאת הצעת מחיר לאירוע '[שם_פרויקט]' המתוכנן להתקיים בתאריך [תאריך_אירוע].
ההצעה כוללת את מפרט הדיילות והשירותים שסיכמנו. לאישור ההצעה והתנעת הפרויקט, אנא השב למייל זה או צור קשר עם מנהלת הפרויקטים.
בברכה,
צוות REG-IN.$tpl$, 'templates'),
  ('תבנית_זימון_משמרת', $tpl$היי [שם_דיילת],
התאמת לאירוע חדש של REG-IN!
אירוע: [שם_פרויקט]
תאריך: [תאריך_אירוע]
שעות: [שעת_התחלה] עד [שעת_סיום]
מיקום: [עיר_אירוע]
תעריף: [תעריף_שעתי_דיילת] ש"ח לשעה + נסיעות
לאישור הגעה או דחייה, לחצי על הלינק הבא: [לינק_אישור_משמרת]
שימי לב: השיבוץ הינו על בסיס כל הקודם זוכה.$tpl$, 'templates'),
  ('תבנית_מייל_משוב_לקוח', $tpl$שלום [שם_איש_קשר],
שמחנו לקחת חלק בהפקת האירוע '[שם_פרויקט]'! כדי שנוכל להמשיך להשתפר ולהעניק לך את השירות הטוב ביותר, נודה לך אם תקדיש דקה מזמנך למילוי סקר שביעות רצון קצר:
[לינק_לשאלון_שביעות_רצון]
תודה רבה ולהתראות באירוע הבא,
צוות REG-IN.$tpl$, 'templates'),
  ('תבנית_מייל_חשבונית_מס', $tpl$שלום [שם_לקוח_חברה],
מצורפת בזאת חשבונית מס/קבלה עבור השירותים שסופקו באירוע '[שם_פרויקט]'.
אנו מודים לכם על שיתוף הפעולה.
בברכה,
מחלקת כספים, REG-IN.$tpl$, 'templates'),
  ('תבנית_מייל_ביטול_משמרת', $tpl$היי [שם_דיילת],
אנו מעדכנים כי חל שינוי בתכולת האירוע '[שם_פרויקט]' בתאריך [תאריך_אירוע], ולצערנו המשמרת שלך בוטלה.
אנו מתנצלים על אי הנוחות ונשמח לראותך באירועים הבאים שלנו!
לשאלות ובירורים ניתן לפנות אלינו חזרה.
בברכה,
צוות הגיוס, REG-IN.$tpl$, 'templates'),
  ('תבנית_אישור_סופי_שיבוץ', $tpl$היי [שם_דיילת],
אנו שמחים לעדכן כי שיבוצך לאירוע '[שם_פרויקט]' אושר ונסגר סופית!
להלן פרטי האירוע המלאים:
תאריך: [תאריך_אירוע]
שעות משמרת: [שעת_התחלה] עד [שעת_סיום]
מיקום האירוע: [כתובת_אירוע_מלאה]
איש קשר בשטח: מנהלת הפרויקט -[שם_מנהלת_פרויקט], טלפון: [טלפון_מנהלת_פרויקט]
אנא ודאי הגעה בזמן (15 דקות לפני תחילת משמרת) והקפידי על קוד לבוש שחור-לבן קלאסי (אלא אם צוין אחרת).
נתראה באירוע!
צוות הגיוס, REG-IN.$tpl$, 'templates'),
  ('תבנית_תזכורת_משמרת', $tpl$היי [שם_דיילת],
זוהי תזכורת אוטומטית למשמרת שלך מחר באירוע '[שם_פרויקט]'.
אנו מזכירים כי המשמרת תחל בשעה [שעת_התחלה] בדיוק במיקום: [כתובת_אירוע_מלאה].
לכל מקרה של בלת"ם או עיכוב של הרגע האחרון, חובה ליצור קשר מידי טלפוני עם [שם_מנהלת_פרויקט] במספר: [טלפון_מנהלת_פרויקט].
שיהיה אירוע מוצלח,
מערכת REG-IN.$tpl$, 'templates'),
  ('תבנית_איפוס_סיסמה', $tpl$שלום [שם_משתמש],
התקבלה בקשה לאיפוס הסיסמה שלך במערכת REG-IN.
קוד האימות שלך לשחזור הסיסמה הוא: [קוד_אימות_6_ספרות]
אנא הזן קוד זה במסך השחזור כדי לבחור סיסמה חדשה. אם לא ביקשת לאפס את סיסמתך, אנא התעלם מהודעה זו.
בברכה,
מערכת REG-IN.$tpl$, 'templates'),
  ('תבנית_מייל_דוח_שכר', $tpl$שלום לצוות הנהלת חשבונות / [שם_רואה_חשבון],
מצורף בזאת קובץ אקסל המרכז את שעות העבודה של צוות הדיילות של חברת REG-IN עבור חודש [חודש_דיווח_ושנה].
הקובץ כולל פירוט תעריפים, שעות בפועל ובונוסים, לאחר שעבר בקרה ואישור במערכת. בכל שאלה או בירור בנוגע לנתונים, ניתן לפנות למחלקת הכספים.
בברכה,
מערכת REG-IN.$tpl$, 'templates');
