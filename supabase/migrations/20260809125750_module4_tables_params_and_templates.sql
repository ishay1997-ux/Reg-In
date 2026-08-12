-- =====================================================================================
-- מודול 4 (דיילות) — מיגרציה C: שתי טבלאות חדשות + 14 פרמטרים + תבנית מייל-השחרור
-- =====================================================================================
-- why — `hostess_unavailability` (§2.1(3) באפיון המאושר, הכרעת-ישי): המנהלת מזינה **טווח
--   תאריכים + הערה**, ומאותו רגע Smart Match פשוט לא מציע אותה — **התנאי החמישי בשער.**
--   🔑 **ולמה זה לא נוחות:** בלעדיו הדיילת מקבלת ארבעה זימונים בזמן שהיא בחו"ל, מסרבת
--   לארבעתם, **והמערכת רושמת אותה כלא-אמינה** — כי ההיענות היא 40% מהציון.
--   הטווח **כולל את יום-הסיום** (הנחה 9 במדריך-המיקרו; עקבי עם §7.30 ועם כל תוויות-הממשק).
--
-- why — `customer_hostess_preference` (§7.15↳ · `db_roadmap:145`): הסימון התלת-מצבי צמוד
--   ל**לקוח**, לא לדיילת. 🔴 **מודול 4 יוצר וקורא (שכבות 1 ו-2 של Smart Match); מודול 6 כותב**
--   (`🚧 מ6 ← מ4`). **בלי הטבלה, לתנאי השלישי בשער אין מה לקרוא** — הוא היה מחזיר ריק ומדלג
--   בשקט. היא נשארת **ריקה** עד מ6, וזה תקין.
--   ➕ **`לא_לשלוח` מחייב נימוק כתוב** — אילוץ CHECK, לא ולידציה בטופס: סימון שלילי בלי סיבה
--   הוא בדיוק מה שאיש לא יוכל להסביר בעוד חצי שנה (תקדים-שוק: TempWorks/Avionté).
--
-- why — `params`: 🔴 **הרשימה נגזרה, לא הועתקה ממספר.** נמדד 09/08/2026 שארבעה רשמים נוקבים
--   בארבעה מספרים שונים ואף אחד אינו נכון (`db_roadmap:135` כותרת "שנים-עשר" מול גוף שמונה
--   שלושה-עשר · `processes-approved.md:308` "עשרה" · `PROJECT_MASTER.md:444` "~14").
--   **הגזירה:** כל שורה ב-`module4_smart_match_research §11.1` שהתא "חי ב־" שלה קורא `params`
--   *(10 שורות; שורת "עיגול לפני מיון" קוראת `קוד` ⇒ מחוץ לרשימה)*, כאשר **שורת חלון-החישוב
--   מתפצלת לשתיים** — ערך אחד לשורה, כי `param_value` הוא `text` יחיד ולא זוג ⇒ **11**;
--   ‏**+ שתי התוספות ➕ מ-`db_roadmap:135`** (`לא_ענתה_ל_N` · `מרכיב_אמינות_פעיל`) ⇒ 13;
--   ‏**+ `סכום_נסיעות_למשמרת`** (local-3) ⇒ **14**.
--   ⛔ **`תקרת_דיילות_מומלצת` אינה ברשימה — בוטלה בהכרעת-ישי 09/08/2026** *("אין צורך בתקרה,
--   מיותר"). היפוך מודע של הכרעתו-שלו מ-07/08; שתיהן מצוטטות ומתוארכות ב-§7.14 וב-`db_roadmap:135`.
--
--   🔴 **ושלוש השורות הקיימות `משקולת_1W_דירוג`/`2W_קרבה`/`3W_מהימנות` נמחקות, לא משנות שם** —
--   לאלגוריתם החדש **אין מרכיב "דירוג" כלל** (`research §6.2`: דירוג ידני 1–5 מתמוטט בפועל;
--   ‏85% מהדירוגים = 5★). ההתרשמות היא שדה-תצוגה, והעדפת-הלקוח פועלת דרך שכבה 2.
--   ⚠️ **שינוי-שם היה משאיר שם שקרי על ערך חדש** — הדבר היחיד שגרוע משורה חסרה.
--
--   ⚠️ **שלושת המשקלים חייבים לסכום ל-1.0** (§11.1). ‏`מרכיב_אמינות_פעיל` נזרע **כבוי** (§7.90),
--   ולכן בזמן-ריצה **מנרמלים מחדש את שני הנותרים** — 🚫 אין לקודד את הפיצול הדו-כיווני קשיח.
--
-- why — תבנית מייל-השחרור: `processes-approved.md §ב6` מחייב **הודעה משלה**, ו-🚫 אוסר לעשות
--   שימוש חוזר ב-`תבנית_מייל_ביטול_משמרת` — היא אומרת "המשמרת שלך בוטלה", **וזה שקר**: הדיילת
--   מעולם לא שובצה. המשפט מועתק **מילה-במילה** מ-`:264-266`, **ועטוף בפנייה ובחתימה כמו ארבע
--   התבניות האחיות — הכרעת-ישי 09/08/2026** (בלי המעטפת זו הייתה התבנית היחידה מבין החמש
--   שיוצאת בלי פנייה בשם ובלי חותם).
--
-- reversibility: הפיכה במלואה — `drop table` ×2 (שתיהן נולדות ריקות) + `delete from params`
--   על 15 שמות + החזרת שלוש שורות-המשקולות הישנות בערכיהן (0.4 / 0.3 / 0.3). שום טבלה קיימת
--   אינה משנה מבנה.

-- ===== SECTION 1 — אי-זמינות מוצהרת =====
create table public.hostess_unavailability (
  unavailability_id bigint generated always as identity primary key,
  hostess_id bigint not null references public.hostesses(hostess_id)
    on delete cascade on update cascade,
  start_date date not null,
  end_date   date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hostess_unavailability_range_valid check (end_date >= start_date)
);
-- ⚠️ ‏`extensions.moddatetime` ולא `moddatetime` — ההרחבה הוזזה לסכמת `extensions` ב-20260710164420.
create trigger hostess_unavailability_set_updated_at before update on public.hostess_unavailability
  for each row execute function extensions.moddatetime (updated_at);
create index hostess_unavailability_hostess_id_idx on public.hostess_unavailability (hostess_id);  -- C-1
alter table public.hostess_unavailability enable row level security;   -- policies = מיגרציה D

-- ===== SECTION 2 — הסימון התלת-מצבי, צמוד ללקוח =====
create table public.customer_hostess_preference (
  preference_id bigint generated always as identity primary key,
  customer_id bigint not null references public.customers(customer_id)
    on delete cascade on update cascade,
  hostess_id  bigint not null references public.hostesses(hostess_id)
    on delete cascade on update cascade,
  preference text not null check (preference in ('מצוינת', 'בסדר', 'לא_לשלוח')),
  preference_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_hostess_preference_unique unique (customer_id, hostess_id),
  -- סימון שלילי חייב נימוק כתוב — אילוץ, לא ולידציה בטופס.
  constraint customer_hostess_preference_negative_needs_reason
    check (preference <> 'לא_לשלוח' or preference_reason is not null)
);
create trigger customer_hostess_preference_set_updated_at before update on public.customer_hostess_preference
  for each row execute function extensions.moddatetime (updated_at);
-- ‏`customer_id` מכוסה כבר ע"י ה-UNIQUE (עמודה מובילה) ⇒ אינדקס נפרד היה כפילות מתה.
create index customer_hostess_preference_hostess_id_idx on public.customer_hostess_preference (hostess_id);
alter table public.customer_hostess_preference enable row level security;   -- policies = מיגרציה D

-- ===== SECTION 3 — שלוש שורות-המשקולות הישנות יורדות =====
delete from public.params
 where param_name in ('משקולת_1W_דירוג', 'משקולת_2W_קרבה', 'משקולת_3W_מהימנות');

-- ===== SECTION 4 — 14 הפרמטרים, לפי הגזירה שבכותרת =====
insert into public.params (param_name, param_value, param_type) values
  -- שלושת המשקלים (§11.1) — חייבים לסכום ל-1.0
  ('משקולת_היענות',              '0.40', 'smart_match'),
  ('משקולת_אמינות',              '0.35', 'smart_match'),
  ('משקולת_קרבה',                '0.25', 'smart_match'),
  -- מרחק: שער-פסילה וגולפוסט (§11.1)
  ('שער_מרחק_קמ',                '80',   'smart_match'),
  ('גולפוסט_מרחק_קמ',            '40',   'smart_match'),
  -- ריסון בייסיאני (§11.1)
  ('קבוע_ריסון_m',               '3',    'smart_match'),
  -- חלון-החישוב — שתי שורות, כי `param_value` הוא ערך יחיד ולא זוג
  ('חלון_חישוב_חודשים',          '12',   'smart_match'),
  ('חלון_חישוב_מורחב_חודשים',    '24',   'smart_match'),
  ('מינימום_תשובות_להצגת_ציון',  '3',    'smart_match'),
  -- מנוף-ההוגנות (§11.1; השיעור הורד מ-0.05 בהכרעת-ישי 08/08/2026)
  ('שיעור_בונוס_הוגנות_לשבוע',   '0.02', 'smart_match'),
  -- ⚠️ התקרה הזאת משמשת **שני** צרכנים — המנוף וגם הצ'יפ "עבדה לאחרונה לפני X שבועות".
  -- מספר קשיח בשניהם היה נסדק בשקט ביום שאחד מהם ישתנה.
  ('תקרת_שבועות_הוגנות',         '8',    'smart_match'),
  -- הצ'יפ/מסנן "לא ענתה ל-N האחרונים" (הכרעה ⑦ ב-`processes-approved.md`)
  ('לא_ענתה_ל_N',                '4',    'smart_match'),
  -- §7.90 — המתג שמדליק את מרכיב אמינות-ההגעה כשמ6 יתחיל לייצר סימוני-נוכחות.
  -- 🚫 נדחתה במפורש גזירה-אוטומטית מ"אין שורות-נוכחות": היא משנה את הדירוג **בשקט**
  -- ביום שנוחתת שורת-הנוכחות הראשונה.
  ('מרכיב_אמינות_פעיל',          'false', 'smart_match'),
  -- §7.69 + local-3: הסכום עצמו עדיין פתוח (מאומת מול רואה-החשבון לפני שמ10 שולח מייל אמיתי).
  -- כל עוד הוא `0`, המסך והמייל מדפיסים "+ נסיעות" **בלי מספר**.
  ('סכום_נסיעות_למשמרת',         '0',    'pricing_timing');

-- ===== SECTION 5 — תבנית מייל-השחרור =====
insert into public.params (param_name, param_value, param_type) values
  ('תבנית_מייל_שחרור_משמרת',
   'היי [שם_דיילת],
תודה שהתפנית — המשרה כבר אוישה לאירוע הזה. נשמח לפנות אלייך בפעם הבאה.
בברכה,
צוות הגיוס, REG-IN.',
   'templates');
