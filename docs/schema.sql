-- ============================================================
-- REG-IN — סכמת מסד הנתונים (Database Schema)
-- ============================================================
-- מה הקובץ הזה: תיאור **מלא ובזמן-הווה** של המסד החי — כל טבלה, עמודה, טיפוס, ברירת-מחדל,
-- אילוץ (בשמו האמיתי), אינדקס, מדיניות RLS, פונקציה, טריגר, עבודת cron ודלי-אחסון.
-- מקור-אמת לקריאה: כל קוד חייב להתאים בדיוק לשמות/טיפוסים/constraints כאן,
-- ואם יש סתירה בין האפיון/מדריך לסכמה — הסכמה גוברת.
--
-- ⚠️ זהו SNAPSHOT שנוצר מתוך שאילתות על המסד החי. **מקור-אמת לשינויים = `supabase/migrations/`**
--    (ולא הקובץ הזה). כל שינוי DB נכתב כקובץ מיגרציה חדש, מוחל, ואז הקובץ הזה נוצר מחדש.
--
-- 📅 נוצר: 14/08/2026 · **רוענן לאחרונה: 16/09/2026 19:4X** (מודול 11, פזה 4 — **הריענון-במקום השני**,
--    זה שצעד 1.1 הזמין לעצמו: "הסנפשוט הזה טעון ריענון-במקום נוסף אחרי שמיגרציות A–G ינחתו".
--    **גם הפעם במקום ולא מחדש** — הקובץ הוא סנפשוט מוער, וייצור-מחדש גורף היה מוחק את ההערות.
--    **מה נוסף, כולו נמדד מול `pg_catalog`/`information_schema` ב-16/09/2026 19:4X ולא נקרא מקובצי-המיגרציה:**
--    ① **שתי טבלאות חדשות** — `feedback_ai_runs` (סעיף 34) ו-`feedback_ai_insights` (סעיף 35), כל אחת
--      עם RLS דלוק ומדיניות-קריאה אחת גדורה על 'דו"חות' · ② **עמודה חדשה** `assignments.recommended_rank`
--      + האילוץ וההערה שלה (סעיף 18) · ③ **17 פונקציות חדשות** — 16 דוחות + `approve_feedback_ai_run` —
--      בבלוק חדש בסעיף 24, **וכותרת הסעיף 50 ⇒ 67** · ④ **7 אינדקסים חדשים** (4 על `feedback_ai_runs`
--      כולל האינדקס החלקי של H1, ו-3 על `feedback_ai_insights`) · ⑤ **טריגר חדש** `feedback_ai_runs_set_updated_at`
--      ⇒ 28 ⇒ 29 · ⑥ **2 מדיניות חדשות** ⇒ 63 ⇒ 65 · ⑦ **פסקת `bak_*` בסוף הכותרת עודכנה** — היא תיארה
--      את המצב **לפני** מיגרציה H0, שהוחלה באותו יום ב-04:5X וסגרה בדיוק את החשיפה שהיא מתארת ·
--      ⑧ ארבע שורות `params` חדשות (נתונים, לא DDL) — ר' סעיף 12.
--    **הספירות החיות:** 38 טבלאות-בסיס · 67 פונקציות · 65 מדיניות (53 ב-`public`, 12 על `storage.objects`) ·
--    77 אינדקסים · 29 טריגרים. **השאילתה שמחזירה את חמשתן בשורה אחת יושבת בסעיף 24, מעל ספירת-הפונקציות** —
--    כדי שהמספר הבא שייכתב כאן יימדד ולא ייגזר מהקודם.
--    ✏️ **23/09/2026 — L1 · L2 · L3 · L4 (מיגרציות-הטקסט של מ11 פזה ב׳) הוחלו: גופי-פונקציה בלבד ⇒ הספירות לא זזו.**
--    הפירוט בסעיף 24, בלוק מודול 11 (מעל `report_m02_exec_overview`).
--    ✅ ✏️ **תוקן-במקום 17/09/2026 (סבב J2):** הפסקה שעמדה כאן אמרה
--    ש-`20260916194500_module11_i2_rpc_round3.sql` **טרם הוחל**. הוא הוחל באותו ערב ב-20:4X,
--    ואחריו הוחלו גם J1 (`…005500`, סבב 4) ו-J2 (`…021500`, סבב 5) — שלושתם
--    מזיזים **גופי-פונקציה בלבד** (טקסט · פורמטים · יעדי-דלת) ואינם נוגעים בטבלה,
--    בעמודה, ב-policy או בחתימה ⇒ **הספירות שלמעלה לא זזו**, והמצביעים בסעיף 24
--    עודכנו. ‏🔴 **ואל תצטט גם את זה — הרץ:**
--      select name from supabase_migrations.schema_migrations where name like 'module11_%' order by version;
--    *(רוענן קודם: 16/09/2026 04:4X — מודול 11 צעד 1.1, **ריענון-במקום** מול הקטלוג
--    החי, בלי לייצר את הקובץ מחדש. הדלתא שנמצאה ותוקנה: ① שלוש עמודות-המשוב ב-`projects` +
--    שלושת ה-CHECK שלהן — `positive_feedback_reason` · `negative_feedback_reasons` ·
--    `positive_feedback_reasons` (מיגרציות `20260904230000` ו-`20260904233000`) · ② **בלוק הטבלה
--    `seed_registry` כולו חזר** — הוא נמחק בשוגג במיזוג `77a7e31b` (03/09) יחד עם **כותרת סעיף 24**,
--    ושתי השורות התמזגו לשורה אחת פגומה · ③ חתימות `submit_feedback` ו-`record_feedback`,
--    מספר-העמודות של `get_project_finance_detail`, ומצביע-הגוף של `replace_customer_contacts` ·
--    ④ ספירת-המדיניות 62 ⇒ 63 · ⑤ שש טבלאות-הגיבוי `bak_*`, שקיימות חי ולא הופיעו כאן כלל.
--    **אומת מול `pg_catalog`/`information_schema` 16/09/2026 04:3X:** 36 טבלאות-בסיס ב-`public` ·
--    50 פונקציות · 63 מדיניות · 70 אינדקסים · 28 טריגרים)* · רוענן קודם: 08/09/2026 22:5X (מצב-הטמעה, מיגרציה `20260908221959_onboarding_mode`:
--    סעיף 32 — עמודה `onboarding_mode integer` + אילוץ-בשם + הערת-עמודה + הערת-טבלה מעודכנת + מדיניות רביעית
--    `notification_preferences_ceo_all`; **אומת מול `pg_catalog` אחרי ההחלה** — 4 policies, 0 smallint בסכמה.
--    אפס טבלאות/פונקציות חדשות) · רוענן קודם: 03/09/2026 23:2X (מיזוג שני סשנים) (מודול 7, צעדים 1.2–1.3 — שתי מיגרציות,
--    `20260903182735_module7_dashboard_summary_rpc` + תיקון-קדימה `20260903184711_…_cancelled_on_calendar_and_profit`:
--    **פונקציה חדשה** `get_dashboard_summary(date)`,
--    סעיף 24 בלוק "מודול 7"; אפס טבלאות/עמודות/policies. ⚠️ **ובאותה שעה, מסשן מקביל:**
--    `20260903180958_seed_registry_and_helpers` (הוחלה 18:15) הוסיפה טבלה `seed_registry` + 4 פונקציות
--    `seed_*` + שינוי בגוף `enforce_quote_in_progress_lock` — **מתועדות בסעיף 33 ובבלוק "זריעת נתוני-ההדגמה" בסעיף 24** (מוזגו לכאן 03/09 23:2X). הספירה "45" בסעיף 24 היא
--    לכן 45 + 1 (כאן) + 4 (שם) = **50 חי, נמדד `pg_proc` 03/09 18:4X**) · רוענן קודם: 02/09/2026 (מודול 9, פזה 1 — שלוש מיגרציות; הדלתא
--    מפורטת בסוף הרשימה) · רוענן קודם: 27/08/2026 (צעד 1.8 — כל עשר מיגרציות פזה 1 של מודול 8; אחרי מיגרציה
--    `20260827125155_module8_finance_tables_and_columns`; הדלתא: טבלה חדשה `project_finance`
--    (+RLS +policy קריאה +טריגר), 2 עמודות ואילוץ-ייחודיות על `projects`, עמודה + CHECK
--    + אינדקס-C-1 על `assignments`, והידוק policy-הקריאה של `quote_services` (ה30)) ·
--    ואחרי מיגרציה B `20260827131033_module8_salary_report_document_model` (הדלתא:
--    `salary_reports` מריצה למסמך — 3 עמודות + 3 אילוצים + policy ראשונה אי-פעם, ושחרור
--    שתי עמודות-חובה; טבלה חדשה `salary_report_lines` +RLS +policy +3 אינדקסים +טריגר) ·
--    ואחרי C `20260827132708_module8_hostess_bank_details_split` (טבלה חדשה
--    `hostess_bank_details` +RLS +2 policies +טריגר + העתקת 26 שורות, ושחרור שלוש
--    עמודות-הבנק ב-`hostesses` מ-NOT NULL **בלי למחוק אותן** — ר' סעיף 29 ו-db_roadmap §9א) ·
--    ואחרי D `20260827132709_module8_email_log_finance_entities` (‏CHECK של `email_log`
--    מ-4 ל-6 ערכים + policy רביעית ל'כספים') ·
--    ואחרי E1 `20260827144459_module8_finance_money_ssot_and_readers` (‏3 פונקציות חדשות —
--    ‏`finance_project_money` הפנימית ושני הקוראים המגודרים — **וכתיבה-מחדש של
--    `list_projects_overview` הממוזגת של מ6**: ‏`planned_revenue` כולל מעכשיו גם
--    Σ שינויי-תכולה. עוגן-מ6 (#8 = 5,355.00) אומת זהה-ספרתית אחרי השכתוב) ·
--    ואחרי E2 `20260827150049_module8_finance_write_actions` (‏9 פונקציות חדשות —
--    ‏2 פנימיות ו-7 נקראות-מהלקוח — ו**הסרת `set_project_finance_fields` של מ6**;
--    שני מסעות מלאים אומתו בטרנזקציות שגולגלו אחורה: ארכוב הקפיא 230.00 וההצעה
--    החזירה 3,508.00 — שני עוגני-היד) ·
--    ואחרי E3 `20260827152840_module8_salary_report_transaction` + תיקון-קדימה
--    `20260827153725_module8_salary_report_temp_table_fix` (שתי פונקציות דוח-השכר) ·
--    ואחרי F `20260827155303_module8_public_feedback_rpc` (טבלה חדשה
--    `feedback_rpc_calls` — סעיף 30 — +RLS בלי policies ואינדקס; 4 פונקציות חדשות,
--    שתיים מהן נקראות בידי `anon`; ו**שער נוסף ל-`archive_project`** — ציון <3 בלי
--    סיבה חוסם ארכוב) ·
--    ואחרי G `20260827160357_module8_cancel_project_released_status_and_seeds`
--    (הרחבת `cancel_project` הממוזגת של מ6 בשורה אחת — שימור
--    `released_from_status`, הוכח ב-md5 על הגוף החי — ושני זרעי-פרמטרים:
--    `תנאי_תשלום_ימים`=30 ו-`סכום_נסיעות_למשמרת` 0→22.60) ·
--    ואחרי C2 `20260827175132_module8_c2_drop_legacy_bank_columns` (שלוש עמודות-הבנק
--    **נמחקו** מ-`hostesses` — ה19 נסגר) ·
--    ואחרי N1 `20260827183845_module8_n1_hostess_languages_additive` (טבלה חדשה
--    `hostess_languages` — סעיף 31 — +RLS +2 policies +אינדקס + העתקת 33 שורות
--    מ-20 דיילות, **והעמודה `languages` נמחקה ב-N1b**) ·
--
--    ── **מודול 9, פזה 1 (02/09/2026) — שלוש מיגרציות** ──
--    ואחרי A `20260902211549_module9_a_params_owner_types_seed` (‏`params` — סעיף 12:
--    עמודה חדשה `owner_role_id` + FK ל-`roles` + אינדקס `params_owner_role_id_idx`;
--    ‏`params_param_type_check` מ-5 ל-6 ערכים (`shift_invites`); ו**החלפת מדיניות-הכתיבה** —
--    ‏`params_write_ceo_only` (FOR ALL) ירדה, ובמקומה שלוש מדיניות פר-פקודה ⇒ **2 policies
--    הפכו ל-4**. בנוסף, שינויי-נתונים שאינם סכמה: 6 שורות-הגדרה חדשות, 2 שורות מתות נמחקו,
--    ‏38 שורות קיבלו בעלים) ·
--    ואחרי B `20260902211550_module9_b_notification_preferences` (‏**טבלה חדשה** —
--    ‏`notification_preferences`, סעיף 32 — +RLS +3 policies +טריגר `updated_at`;
--    ה-FK החמישי ל-`users(email)`) ·
--    ואחרי C `20260902211551_module9_c_threshold_functions_and_min_wage_rpc`
--    (‏**פונקציה חדשה** `list_hostesses_below_min_wage()`, ו**כתיבה-מחדש של
--    `record_feedback` ו-`archive_project`** של מ8 — סף שביעות-הרצון עבר מקבוע-בקוד
--    ל-`params.סף_שביעות_רצון`. **החתימות לא השתנו** ⇒ הקוד הפרוס לא נשבר) ·
--
--    ── **מרשם-הזריעה של מודול 7 (03/09/2026) — מיגרציה אחת** ──
--    ואחרי `20260903180958_seed_registry_and_helpers` (‏**טבלה חדשה** `seed_registry`, סעיף 33 —
--    ‏+RLS **בלי policies במכוון** +אינדקס; **4 פונקציות חדשות** `seed_register` ·
--    ‏`seed_backdate_quote` · `seed_backdate_project` · `seed_reset`, כולן DEFINER גדורות
--    ל-`edit` על 'הגדרות מערכת'; ו**כתיבה-מחדש של `enforce_quote_in_progress_lock`** מהגוף
--    החי — בלוק-`if` אחד בראשה: מעבר חופשי רק עם מפתח-סשן `regin.seed_bypass` **וגם**
--    הצעה רשומה במרשם. **החתימה לא השתנתה, הטריגרים לא נגעו**) ·
--    פרויקט Supabase `yfeovxppnfoafmfbdfvh` · Postgres 17.
--
-- 🔴 **לרענן את הקובץ הזה אחרי כל מיגרציה.** העותק הקודם לא רוענן חמישה חודשים והכריז על עמודה
--    (`assignments.id_number`) שאינה קיימת במסד — מפתח ראשי שגוי לטבלה שלמה, בקובץ שהוא דרגה 1
--    בהיררכיית-האמת.
--
-- 🚫 **גופי פונקציות אינם כאן במכוון** — לא חוסר, אלא החלטה: הם מאות שורות, וה-SSOT שלהם הוא
--    `supabase/migrations/`. סעיף 24 נותן לכל פונקציה חתימה מלאה, מצב אבטחה, הרשאות-הרצה
--    ומצביע לקובץ המיגרציה שבו הגוף הנוכחי חי.
--
-- 🚫 **אין כאן סעיף "היסטוריה"/"יומן שינויים"** — הקובץ מתאר הווה בלבד. ציר השינויים חי
--    ב-`supabase/migrations/` וב-`docs/db_roadmap.md`.
--
-- מוסכמות: כל 32 **טבלאות-המערכת** ב-`public` עם RLS **מופעל** (נמדד מחדש 16/09/2026 19:4X — היו 30,
--    ‏`feedback_ai_runs` ו-`feedback_ai_insights` של מודול 11 הצטרפו).
-- 🔴 **וב-`public` יושבות היום 38 טבלאות-בסיס, לא 32** — שש מהן `bak_*`; ר' הפסקה בסוף הכותרת.
-- כל 65 המדיניות (53 ב-public, 12 על `storage.objects`) הן PERMISSIVE ומוגדרות `to authenticated`.
--    ‏*(עד 16/09 בערב היה כתוב "63 (51 ב-public)"; שתי החדשות הן מדיניות-הקריאה של שתי טבלאות מ11.)*
--    (עד 16/09 היה כתוב כאן "62 (50 ב-public)" — ספירה שלא עודכנה כשנוספה המדיניות
--    `notification_preferences_ceo_all` ב-08/09. הקובץ עצמו החזיק 63 `create policy` כבר אז.)
-- 🔴 **PERMISSIVE = הן מתאחדות ב-OR.** שתי policies על אותה טבלה מרחיבות גישה, לא מצמצמות —
--    ולכן policy חדשה "מגודרת היטב" אינה מגבילה אף אחד שכבר עובר דרך policy אחרת.
-- 🔴 **אחת-עשרה טבלאות הן deny-all במכוון — חמש "עסקיות" ושש `bak_*`** *(עודכן 16/09/2026 19:4X:
--    מיגרציה H0 הוסיפה את השש)*. החמש: `project_changes` (נקראת רק דרך ה-RPC הממסך),
--    `login_attempts` ו-`login_rpc_calls` (רק דרך פונקציות ה-DEFINER של הכניסה), `feedback_rpc_calls`
--    (נוספה 27/08/2026 ב-F — אותו דפוס, לדף-המשוב הציבורי), ו-`seed_registry` (נוספה 03/09/2026 —
--    נכתבת ונקראת רק דרך ארבע פונקציות `seed_*`; סעיף 33). מ-27/08/2026
--    **אין יותר אף טבלה עסקית שחסומה מחוסר-בנייה** — `salary_reports` הייתה האחרונה. הפונקציה `moddatetime` (טריגר
-- `updated_at`) יושבת בסכמה `extensions`, לא ב-`public`.
--
-- 🔴 **שש טבלאות-גיבוי `bak_*` — חיות ב-`public`, RLS כבוי, ולא היו בקובץ הזה עד 16/09/2026.**
--    נוצרו בידי סשני תיקון-הזריעה של מודול 11 (09/09 ו-10/09/2026) כעותק-לפני-כתיבה, **לא דרך
--    מיגרציה** — אין להן קובץ ב-`supabase/migrations/`, ולכן הן לא הופיעו בשום ריענון קודם:
--    `bak_hostesses_20260909` (15 עמודות) · `bak_assignments_20260909` · `bak_assignments_20260910`
--    (21 עמודות כל אחת) · `bak_projects_20260909` · `bak_projects_20260910` (38 עמודות כל אחת) ·
--    `bak_project_finance_20260910` (10 עמודות). המבנה זהה לטבלת-המקור בזמן ההעתקה.
--    ✅ **נסגר באותו יום — מיגרציה `20260916045200_module11_h0_harden_backup_tables` (הוחלה 16/09/2026 04:5X).**
--    לכל שש: `revoke all` מ-`anon` ומ-`authenticated` + `enable row level security` **בלי policies**
--    (deny-all מכוון, דפוס `login_attempts`) + הערת-טבלה. **אומת אחרי ההחלה:** מנכ"ל מחובר ⇒ `42501` על select.
--    *(המצב שנמדד 16/09/2026 04:3X ושההידוק סגר, נשאר כאן כי הוא הנימוק:)* לכולן היה `relrowsecurity = false`,
--    אפס policies, ו-`anon` **וגם** `authenticated` החזיקו SELECT/INSERT/UPDATE/DELETE/TRUNCATE
--    (ברירת-המחדל של `public` ב-Supabase) — כלומר עותק מלא של `projects` (כולל משוב), של `assignments`,
--    של פרטי-הדיילות ושל כספי-הפרויקטים **לא היה מוגן במנגנון שמגן על טבלאות-המקור**, והוא נגיש דרך מפתח
--    ה-anon הציבורי. לא נבדק בקריאת-REST בפועל — נמדד בקטלוג בלבד. **אף קוד אינו קורא מהן** (grep ⇒ 0).
--    🚫 **מחיקת הטבלאות עצמן לא נעשתה והיא הכרעת-ישי** — הן העותק היחיד-בתוך-המסד של זריעת מ11.
--    ר' `docs/micro_guides/module-11.md` §9 D-8 ו-D-11, ו-`docs/db_roadmap.md §10ב`.
--
-- 🔐 **T2 · 17/09/2026 (מיגרציה J3) — ארבע מתוך החמש העסקיות הודקו באותו דפוס של ה-`bak_*`.**
--    ‏`login_attempts` · `feedback_rpc_calls` · `project_changes` · `seed_registry` עדיין החזיקו
--    **הרשאות-טבלה מלאות ל-`anon` ול-`authenticated`** (ברירת-המחדל של Supabase) בעוד RLS-בלי-מדיניות
--    חוסמת אותן. ‏**לא הייתה דרך-ניצול חיה** — הגרנט לבדו אינו קורא שורה — אבל הוא `alter table …
--    disable row level security` אחד ממצב עולם-קריא, בדיוק סיפור ה-`bak_*`. ⇒ `revoke all … from
--    anon, authenticated` על ארבעתן. ‏`login_rpc_calls` כבר הייתה הרמטית.
--    **לפני** *(נמדד ב-`pg_class.relacl`, 17/09/2026)*: `{postgres=arwdDxtm/postgres, anon=arwdDxtm/postgres,
--    authenticated=arwdDxtm/postgres, service_role=arwdDxtm/postgres}` · **אחרי**: `{postgres=arwdDxtm/postgres,
--    service_role=arwdDxtm/postgres}`.
--    🔑 **ולמה זה לא שבר דבר:** כל **14** הקוראות של ארבעתן הן `security definer` עם `search_path=''`
--    *(נמדד ב-`pg_proc`: `check_login_lock` · `register_failed_login` · `reset_login_attempts` ·
--    `feedback_rate_limit` · `apply_scope_change` · `finance_project_money` · `list_project_changes` ·
--    `list_projects_overview` · `report_m12_equipment` · חמש `seed_*`/`enforce_quote_in_progress_lock`)*,
--    ו-DEFINER רצה בהרשאות הבעלים. בקוד-הלקוח אין אף `.from('<טבלה>')` על ארבעתן (‏`grep` ב-`src/` וב-`e2e/` ⇒ 0).
--    ✅ **נבדק אחרי ההחלה, מחוברת כ-E2E_CEO:** ‏`check_login_lock` ו-`reset_login_attempts` מחזירות 200;
--    קריאה ישירה ל-`login_attempts` מחזירה עכשיו **42501** במקום מערך ריק שקט — שיפור, לא רגרסיה.
--    ר' `docs/PROJECT_MASTER.md §6` T2 ו-`docs/archive/close-findings-module-11.md` F-02.
-- ============================================================


-- ============================================================
-- 1. טבלת תפקידים — public.roles (מודול 1)
-- ============================================================
create table roles (
  role_id   serial not null,
  role_name text   not null,
  constraint roles_pkey          primary key (role_id),
  constraint roles_role_name_key unique (role_name)
);

alter table roles enable row level security;

-- אינדקסים
-- roles_pkey — unique btree (role_id) [נוצר ע"י האילוץ roles_pkey]
-- roles_role_name_key — unique btree (role_name) [נוצר ע"י האילוץ roles_role_name_key]

-- מדיניות RLS
create policy roles_select_all on roles
  for select to authenticated
  using (true);


-- ============================================================
-- 2. טבלת מודולים — public.modules (מודול 1; שורות המטריצה role→module)
-- ============================================================
create table modules (
  module_id   serial not null,
  module_name text   not null,
  constraint modules_pkey            primary key (module_id),
  constraint modules_module_name_key unique (module_name)
);

alter table modules enable row level security;

-- אינדקסים
-- modules_pkey — unique btree (module_id) [נוצר ע"י האילוץ modules_pkey]
-- modules_module_name_key — unique btree (module_name) [נוצר ע"י האילוץ modules_module_name_key]

-- מדיניות RLS
create policy modules_select_all on modules
  for select to authenticated
  using (true);


-- ============================================================
-- 3. טבלת הרשאות — public.permissions (מודול 1; רמת גישה לכל צמד תפקיד×מודול)
-- ============================================================
create table permissions (
  role_id          integer not null,
  module_id        integer not null,
  permission_level text    not null,
  constraint permissions_pkey                   primary key (role_id, module_id),
  constraint permissions_role_id_fkey           foreign key (role_id)   references roles (role_id)     on delete cascade,
  constraint permissions_module_id_fkey         foreign key (module_id) references modules (module_id) on delete cascade,
  constraint permissions_permission_level_check check (permission_level = any (array['edit'::text, 'view'::text, 'blocked'::text]))
);

alter table permissions enable row level security;

-- אינדקסים
-- permissions_pkey — unique btree (role_id, module_id) [נוצר ע"י האילוץ permissions_pkey]

-- מדיניות RLS
create policy permissions_select_all on permissions
  for select to authenticated
  using (true);

create policy permissions_write_ceo_only on permissions
  for all to authenticated
  using      (current_user_role_id() = (select role_id from roles where role_name = 'מנכ"ל'))
  with check (current_user_role_id() = (select role_id from roles where role_name = 'מנכ"ל'));


-- ============================================================
-- 4. טבלת משתמשי מערכת — public.users (מודול 1; המייל מקשר ל-Supabase Auth)
-- ============================================================
create table users (
  email     text    not null,
  role_id   integer not null,
  full_name text    not null,
  status    text    not null default 'active',
  phone     text,
  constraint users_pkey         primary key (email),
  constraint users_role_id_fkey foreign key (role_id) references roles (role_id) on delete restrict,
  constraint users_status_check check (status = any (array['active'::text, 'inactive'::text]))
);

alter table users enable row level security;

-- אינדקסים
-- users_pkey — unique btree (email) [נוצר ע"י האילוץ users_pkey]

-- מדיניות RLS
create policy users_select_self_or_ceo on users
  for select to authenticated
  using (
    email = (select auth.email())
    or (select current_user_role_id()) = (select role_id from roles where role_name = 'מנכ"ל')
  );

create policy users_update_self on users
  for update to authenticated
  using (email = (select auth.email()))
  with check (
    email = (select auth.email())
    and role_id = (select current_user_role_id())
    and status = 'active'
  );

create policy users_write_ceo_only on users
  for all to authenticated
  using      (current_user_role_id() = (select role_id from roles where role_name = 'מנכ"ל'))
  with check (current_user_role_id() = (select role_id from roles where role_name = 'מנכ"ל'));


-- ============================================================
-- 5. טבלת נעילת התחברות — public.login_attempts (מודול 1)
-- ============================================================
-- נכתבת ונקראת אך ורק דרך הפונקציות check_login_lock / register_failed_login /
-- reset_login_attempts (סעיף 24). RLS מופעל ואין לה אף policy ⇒ גישה ישירה מהלקוח חסומה.
create table login_attempts (
  email           text        not null,
  failed_count    integer     not null default 0,
  locked_until    timestamptz,
  last_attempt_at timestamptz not null default now(),
  constraint login_attempts_pkey primary key (email)
);

alter table login_attempts enable row level security;

-- אינדקסים
-- login_attempts_pkey — unique btree (email) [נוצר ע"י האילוץ login_attempts_pkey]

-- מדיניות RLS: אין (0 policies)


-- ============================================================
-- 6. טבלת קצב-קריאות ל-RPC של ההתחברות — public.login_rpc_calls (מודול 1)
-- ============================================================
-- ⚠️ אין לטבלה הזו מפתח ראשי. RLS מופעל ואין לה אף policy.
create table login_rpc_calls (
  ip        inet        not null,
  called_at timestamptz not null default now()
);

alter table login_rpc_calls enable row level security;

-- אינדקסים
create index login_rpc_calls_ip_time_idx on login_rpc_calls using btree (ip, called_at desc);

-- מדיניות RLS: אין (0 policies)


-- ============================================================
-- 7. טבלת לקוחות — public.customers (מודול 2)
-- ============================================================
-- העמודות מסודרות כאן בסדר הפיזי שלהן במסד. המפתח הראשי הוא customer_id (identity),
-- ו-company_number (ח"פ, 9 ספרות) הוא המזהה העסקי הייחודי.
create table customers (
  company_number    text        not null,
  customer_type     text        not null,
  company_name      text        not null,
  -- 🗑️ contact_name / phone / email — **נמחקו ב-N2ד (20260902173354), 02/09/2026.**
  -- איש-הקשר הראשי הוא שורה ב-customer_contacts עם is_primary. הן אינן קיימות; השורה הזו
  -- נשארת כהערה כדי שמי שמחפש אותן ימצא לאן הן הלכו במקום להסיק שהקובץ חסר.
  -- 🧭 הדרך: N2א הוסיפה ⇒ N2ב ה-RPC ⇒ N2ג ריככה והקוד הפסיק לכתוב ⇒ פריסה ⇒ N2ד מחקה.
  discount_percent  numeric     not null default 0,
  marketing_consent boolean     not null default false,
  status            text        not null default 'active',
  customer_id       bigint      not null generated always as identity,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint customers_pkey                   primary key (customer_id),
  constraint customers_company_number_key     unique (company_number),
  constraint customers_company_number_9_digits check (company_number ~ '^[0-9]{9}$'::text),
  constraint customers_customer_type_check    check (customer_type = any (array['private_company'::text, 'government'::text, 'production_company'::text, 'nonprofit'::text])),
  constraint customers_discount_range         check (discount_percent >= 0::numeric and discount_percent <= 100::numeric),
  constraint customers_status_check           check (status = any (array['active'::text, 'inactive'::text]))
);

alter table customers enable row level security;

-- אינדקסים
-- customers_pkey — unique btree (customer_id) [נוצר ע"י האילוץ customers_pkey]
-- customers_company_number_key — unique btree (company_number) [נוצר ע"י האילוץ customers_company_number_key]

-- טריגרים
create trigger customers_set_updated_at
  before update on customers
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy customers_select_by_permission on customers
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy customers_write_by_permission on customers
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 8. טבלת אנשי-קשר נוספים ללקוח — public.customer_contacts (מודול 2)
-- ============================================================
-- 🔴 עודכן 02/09/2026 (N2): **הראשי כבר אינו inline על customers** — הוא שורה כאן
-- כמו כל השאר, מסומנת ב-is_primary. שלוש העמודות על customers עדיין קיימות ועדיין
-- מקור-האמת עד מיגרציית-המחיקה (N2ג, טרם נכתבה) — ר' docs/db_roadmap.md §9א.
create table customer_contacts (
  contact_id   bigint      not null generated always as identity,
  customer_id  bigint      not null,
  contact_name text        not null,
  phone        text,
  email        text,
  is_primary   boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint customer_contacts_pkey             primary key (contact_id),
  constraint customer_contacts_customer_id_fkey foreign key (customer_id) references customers (customer_id) on update cascade on delete cascade
);

alter table customer_contacts enable row level security;

-- אינדקסים
create index customer_contacts_customer_id_idx on customer_contacts using btree (customer_id);
-- customer_contacts_pkey — unique btree (contact_id) [נוצר ע"י האילוץ customer_contacts_pkey]
-- N2, 02/09/2026 — "לכל היותר ראשי אחד ללקוח". אינדקס **חלקי**, ולכן אינו constraint
-- (אימות: contype='u' נשאר 11). ⚠️ "לפחות אחד" אינו ניתן לאכיפה כאן והוא חי ב-RPC למטה.
create unique index customer_contacts_one_primary_per_customer
  on customer_contacts using btree (customer_id) where is_primary;

-- טריגרים
create trigger customer_contacts_set_updated_at
  before update on customer_contacts
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy customer_contacts_select_by_permission on customer_contacts
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy customer_contacts_write_by_permission on customer_contacts
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 9. קטלוג מוצרים — public.products (אתר / דיילת / מוצר)
-- ============================================================
-- מחיר-המכירה כאן; **העלות חיה בטבלה נפרדת — product_costs (סעיף 10)**.
create table products (
  sku        text        not null,
  item_name  text        not null,
  description text        not null default '',
  category   text        not null,
  unit       text        not null,
  base_price numeric(12,2) not null,
  status     text        not null default 'active',
  image_url  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_pkey             primary key (sku),
  constraint products_base_price_check check (base_price >= 0::numeric),
  constraint products_category_check   check (category = any (array['site'::text, 'hostess'::text, 'product'::text])),
  constraint products_status_check     check (status = any (array['active'::text, 'out_of_stock'::text, 'inactive'::text])),
  constraint products_unit_check       check (unit = any (array['יחידה'::text, 'פרויקט'::text, 'משמרת'::text, 'מטר'::text]))
);

alter table products enable row level security;

-- אינדקסים
-- products_pkey — unique btree (sku) [נוצר ע"י האילוץ products_pkey]

-- טריגרים
create trigger products_set_updated_at
  before update on products
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy products_select_all_authenticated on products
  for select to authenticated
  using (true);

create policy products_write_ceo_only on products
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 10. עלויות מוצרים — public.product_costs
-- ============================================================
-- טבלה נפרדת מ-products כי הקריאה שלה מוגבלת: רק בעלי הרשאת edit ב'הצעות מחיר' או ב'כספים'.
create table product_costs (
  sku        text          not null,
  cost       numeric(12,2) not null,
  created_at timestamptz   not null default now(),
  updated_at timestamptz   not null default now(),
  constraint product_costs_pkey      primary key (sku),
  constraint product_costs_sku_fkey  foreign key (sku) references products (sku) on update cascade on delete cascade,
  constraint product_costs_cost_check check (cost >= 0::numeric)
);

alter table product_costs enable row level security;

-- אינדקסים
-- product_costs_pkey — unique btree (sku) [נוצר ע"י האילוץ product_costs_pkey]

-- טריגרים
create trigger product_costs_set_updated_at
  before update on product_costs
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy product_costs_select_by_permission on product_costs
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id in (select module_id from modules where module_name = any (array['הצעות מחיר'::text, 'כספים'::text]))
        and p.permission_level = 'edit'
    )
  );

create policy product_costs_write_ceo_only on product_costs
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 11. מדרגות מחיר — public.price_tiers (הנחות כמות למוצר)
-- ============================================================
create table price_tiers (
  sku           text          not null,
  min_qty       integer       not null,
  special_price numeric(12,2) not null,
  max_qty       integer,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now(),
  constraint price_tiers_pkey                primary key (sku, min_qty),
  constraint price_tiers_sku_fkey            foreign key (sku) references products (sku) on update cascade on delete cascade,
  constraint price_tiers_min_qty_check       check (min_qty > 0),
  constraint price_tiers_max_qty_check       check (max_qty is null or max_qty >= min_qty),
  constraint price_tiers_special_price_check check (special_price > 0::numeric)
);

alter table price_tiers enable row level security;

-- אינדקסים
-- price_tiers_pkey — unique btree (sku, min_qty) [נוצר ע"י האילוץ price_tiers_pkey]

-- טריגרים
create trigger price_tiers_set_updated_at
  before update on price_tiers
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy price_tiers_select_all_authenticated on price_tiers
  for select to authenticated
  using (true);

create policy price_tiers_write_ceo_only on price_tiers
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 12. פרמטרים גלובליים — public.params (מע"מ, יחסי-תכנון, משקולות Smart Match, תבניות)
-- ============================================================
-- 🔑 **`owner_role_id` — היוצא-מן-הכלל היחיד לכלל "בלי בעלות ברמת-רשומה" (§7.21).** הוא
--    קיים **רק** על `params`, ורק כדי שכל בעלת-תפקיד תוכל לערוך את ההגדרות שלה מתוך
--    "ההגדרות שלי" בלי הרשאת-`edit` על מודול 'הגדרות מערכת' כולו (§7.70↳ · R-2).
--    ‏NULL = ההגדרה שייכת למנכ"ל בלבד.
-- ⚠️ **ארבע מדיניות — אחת לכל פקודה, ולא `for all` אחת.** ‏SELECT פתוח לכל מחובר;
--    ‏UPDATE נפתח גם לבעלים (`owner_role_id`); INSERT ו-DELETE נשארו למחזיק-`edit` בלבד.
--    ⇒ **בעלת-תפקיד יכולה לשנות ערך, ולא ליצור או למחוק הגדרה.** לו נשארה `for all`
--    אחת, פתיחת-הבעלות הייתה פותחת גם יצירה ומחיקה.
create table params (
  param_id      serial      not null,
  param_name    text        not null,
  param_value   text        not null,
  param_type    text        not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  owner_role_id integer     null,
  constraint params_pkey            primary key (param_id),
  constraint params_param_name_key  unique (param_name),
  constraint params_owner_role_id_fkey
    foreign key (owner_role_id) references roles (role_id) on update restrict on delete set null,
  constraint params_param_type_check check (param_type = any (array['pricing_timing'::text, 'control_alerts'::text, 'smart_match'::text, 'templates'::text, 'integration_tech'::text, 'shift_invites'::text]))
);

alter table params enable row level security;

-- הערת-עמודה (comment on column)
-- owner_role_id — 'התפקיד שהוא "הבעלים הטבעי" של ההגדרה ורשאי לערוך אותה מ"ההגדרות שלי"
--   (§7.70↳ · R-2). NULL = מנכ"ל בלבד. מודול 9.'

-- אינדקסים
-- params_pkey — unique btree (param_id) [נוצר ע"י האילוץ params_pkey]
-- params_param_name_key — unique btree (param_name) [נוצר ע"י האילוץ params_param_name_key]
create index params_owner_role_id_idx on params using btree (owner_role_id);

-- טריגרים
create trigger params_set_updated_at
  before update on params
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS (4) — אחת לכל פקודה
create policy params_select_all_authenticated on params
  for select to authenticated
  using (true);

create policy params_update_settings_or_owner on params
  for update to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select m.module_id from modules m where m.module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
    or owner_role_id = (select current_user_role_id())
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select m.module_id from modules m where m.module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
    or owner_role_id = (select current_user_role_id())
  );

create policy params_insert_settings_only on params
  for insert to authenticated
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select m.module_id from modules m where m.module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  );

create policy params_delete_settings_only on params
  for delete to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select m.module_id from modules m where m.module_name = 'הגדרות מערכת')
        and p.permission_level = 'edit'
    )
  );
--   → supabase/migrations/20260902211549_module9_a_params_owner_types_seed.sql
--     (עמודת-הבעלות + FK + אינדקס · הטיפוס השישי `shift_invites` · שלוש מדיניות-הכתיבה
--      שהחליפו את `params_write_ceo_only`)
--
-- 🆕 **16/09/2026 — ארבע שורות של מודול 11, שינוי-נתונים ולא DDL** (ולכן אין כאן `alter`):
--    `מכפיל_מרווח_מתרחק`=1.5 · `סף_סטיית_תקציב_אחוז`=15 · `מקדם_אמינות_אדום`=0.87 ·
--    `מקדם_אמינות_ענבר`=0.95 — כולן `param_type = 'control_alerts'`, `owner_role_id` = מנכ"ל.
--    ‏`params` **43 ⇒ 47 שורות** (נמדד 16/09 19:4X).
--    → supabase/migrations/20260916043500_module11_c_report_params.sql · `db_roadmap` M11-5
-- ⚠️ **התקרה/הרצפה של פרמטר מספרי אינן כאן ואינן יכולות להיות כאן** — אין לטבלה עמודות כאלה.
--    הן כללי-טיפוס ב-`src/lib/paramsRegistry.js`, **שהערתו שלו אומרת ש-`min`/`max`/`decimals`
--    אינם נאכפים בשום מקום.** קוד שמניח אכיפה כאן מניח דבר שאינו קיים.
-- 🔴 **וחמש שורות `params` חיות הן `owner_role_id is null`** (נמדד 16/09) — כרטיס ת6 של מ11 מתאר
--    אחת כ"היחידה בלי בעלים". חוב רשום ב-`PROJECT_MASTER §6`; לא שונה כאן, כי זה משנה מי רשאית לערוך.


-- ============================================================
-- 13. הצעות מחיר — public.quotes (מודול 3)
-- ============================================================
create table quotes (
  quote_id                  serial      not null,
  customer_id               bigint      not null,
  event_name                text        not null,
  issue_date                date        not null default current_date,
  recommended_hostess_count integer     not null,
  estimated_guests          integer     not null,
  estimated_event_date      date        not null,
  estimated_location        text        not null,
  quote_status              text        not null default 'in_progress',
  pdf_url                   text,
  applied_customer_discount numeric(12,2) not null,
  manual_discount           numeric(12,2) not null default 0,
  rejection_reason          text,
  notes                     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  vat_rate_snapshot         numeric(5,2),
  rejection_notes           text,
  estimated_start_time      time        not null,
  estimated_end_time        time        not null,
  -- עמודה מחושבת ומאוחסנת: משך ההצעה בשעות; חוצה חצות ⇒ מוסיפה 24
  estimated_hours           numeric(4,2) generated always as (
    case
      when estimated_end_time > estimated_start_time
        then extract(epoch from (estimated_end_time - estimated_start_time)) / 3600::numeric
      else extract(epoch from (estimated_end_time - estimated_start_time)) / 3600::numeric + 24::numeric
    end
  ) stored,
  constraint quotes_pkey                        primary key (quote_id),
  constraint quotes_customer_id_fkey            foreign key (customer_id) references customers (customer_id) on delete restrict,
  constraint quotes_quote_status_check          check (quote_status = any (array['in_progress'::text, 'approved'::text, 'rejected'::text])),
  constraint quotes_estimated_guests_check      check (estimated_guests > 0),
  constraint quotes_recommended_hostess_count_check check (recommended_hostess_count > 0),
  constraint quotes_applied_discount_range      check (applied_customer_discount >= 0::numeric and applied_customer_discount <= 100::numeric),
  constraint quotes_manual_discount_range       check (manual_discount >= 0::numeric and manual_discount <= 100::numeric),
  constraint quotes_combined_discount_max       check (applied_customer_discount + manual_discount <= 100::numeric),
  constraint quotes_approved_requires_vat       check (quote_status <> 'approved'::text or vat_rate_snapshot is not null),
  constraint quotes_vat_snapshot_range          check (vat_rate_snapshot is null or (vat_rate_snapshot >= 0::numeric and vat_rate_snapshot <= 100::numeric)),
  constraint quotes_rejected_iff_reason         check ((quote_status = 'rejected'::text) = (rejection_reason is not null)),
  constraint quotes_rejection_reason_check      check (rejection_reason is null or rejection_reason = any (array['מחיר'::text, 'חוסר זמינות/לו"ז'::text, 'נבחר מתחרה'::text, 'תקציב לקוח'::text, 'האירוע בוטל אצל הלקוח'::text, 'פג תוקף'::text, 'נפתחה בטעות'::text, 'אחר'::text])),
  constraint quotes_rejection_notes_required    check (rejection_reason is distinct from 'אחר'::text or rejection_notes is not null)
);

alter table quotes enable row level security;

-- אינדקסים
create index quotes_customer_id_idx     on quotes using btree (customer_id);
create index quotes_status_updated_idx  on quotes using btree (quote_status, updated_at);
-- quotes_pkey — unique btree (quote_id) [נוצר ע"י האילוץ quotes_pkey]

-- טריגרים
create trigger quotes_lock_non_in_progress
  before delete or update on quotes
  for each row execute function enforce_quote_in_progress_lock();

create trigger quotes_set_updated_at
  before update on quotes
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy quotes_select_by_permission on quotes
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy quotes_write_by_permission on quotes
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 14. שורות ההצעה — public.quote_services (מודול 3)
-- ============================================================
-- המפתח הראשי הוא line_id (identity); (quote_id, line_number) הוא מפתח עסקי ייחודי.
-- line_id הוא גם היעד של logistics.quote_service_line_id (סעיף 20).
create table quote_services (
  quote_id           integer       not null,
  sku                text          not null,
  line_number        integer       not null,
  qty                integer       not null,
  closing_unit_price numeric(12,2) not null,
  color              text,
  notes              text,
  created_at         timestamptz   not null default now(),
  updated_at         timestamptz   not null default now(),
  line_id            bigint        not null generated always as identity,
  closing_unit_cost  numeric(12,2) not null,
  constraint quote_services_pkey                     primary key (line_id),
  constraint quote_services_quote_line_key           unique (quote_id, line_number),
  constraint quote_services_quote_id_fkey            foreign key (quote_id) references quotes (quote_id) on delete cascade,
  constraint quote_services_sku_fkey                 foreign key (sku)      references products (sku)    on update cascade on delete restrict,
  constraint quote_services_qty_check                check (qty > 0),
  constraint quote_services_closing_unit_price_check check (closing_unit_price >= 0::numeric),
  constraint quote_services_closing_unit_cost_check  check (closing_unit_cost >= 0::numeric),
  constraint quote_services_color_check              check (color is null or color = any (array['לבן'::text, 'שחור'::text, 'אפור'::text, 'טורקיז'::text, 'כחול'::text]))
);

alter table quote_services enable row level security;

-- אינדקסים
create index quote_services_quote_id_idx on quote_services using btree (quote_id);
create index quote_services_sku_idx      on quote_services using btree (sku);
-- quote_services_pkey — unique btree (line_id) [נוצר ע"י האילוץ quote_services_pkey]
-- quote_services_quote_line_key — unique btree (quote_id, line_number) [נוצר ע"י האילוץ quote_services_quote_line_key]

-- טריגרים
create trigger quote_services_lock_non_in_progress
  before delete or update on quote_services
  for each row execute function enforce_quote_in_progress_lock();

create trigger quote_services_set_updated_at
  before update on quote_services
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
-- ⚠️ הודקה 27/08/2026 (מ8, ה30, מיגרציה A): הקריאה דורשת עריכה — ב'הצעות מחיר'
-- או ב'כספים'. הצורה מועתקת מ-product_costs_select_by_permission (תקדים חי).
-- הסיבה: closing_unit_cost (עלות) היה קריא לכל מחזיק צפייה ב'הצעות מחיר'.
create policy quote_services_select_by_permission on quote_services
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id in (
          select module_id from modules
          where module_name = any (array['הצעות מחיר'::text, 'כספים'::text])
        )
        and p.permission_level = 'edit'::text
    )
  );

create policy quote_services_write_by_permission on quote_services
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 15. מאגר דיילות — public.hostesses (מודול 4)
-- ============================================================
-- המפתח הראשי הוא hostess_id (identity); id_number (ת"ז) הוא מפתח עסקי ייחודי בלבד.
create table hostesses (
  id_number    text        not null,
  full_name    text        not null,
  phone        text        not null,
  email        text        not null,
  city         text        not null,
  hourly_rate  numeric     not null,
  rating       integer,
  status       text        not null default 'active',
  -- ✅ מ8 ה19 **נסגר 27/08/2026 18:0X**: שלוש עמודות-הבנק (bank_name/branch/account)
  --    **נמחקו כאן** במיגרציה C2, אחרי מיזוג מ8 ופריסתו לייצור. הן חיות עכשיו
  --    **רק** ב-hostess_bank_details (סעיף 29), שנקראת ע"י 'דיילות' ו'כספים' בלבד.
  --    🔴 מי שמחפש אותן כאן — הן אינן, וזה מכוון: RLS הוא ברמת-שורה, ולכן
  --    עמודה על hostesses הייתה קריאה לכל מי שיש לו 'דיילות'. זו הייתה החשיפה.
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  hostess_id   bigint      not null generated always as identity,
  address      text,
  lat          numeric,
  lng          numeric,
  has_car      boolean     not null default false,
  -- ✅ מ8 · N1b **נמחקה 27/08/2026 19:3X**: העמודה `languages` (`text[]`) ירדה כאן.
  --    השפות חיות עכשיו **רק** ב-`hostess_languages` (סעיף 31), ביחס 1:N.
  --    🔑 **ומאז אין ולו עמודת-מערך אחת בכל המסד** — נמדד: `data_type='ARRAY'` ⇒ אפס.
  --    זו הייתה ההפרה היחידה של 1NF, והיא סגורה.
  constraint hostesses_pkey          primary key (hostess_id),
  constraint hostesses_id_number_key unique (id_number),
  constraint hostesses_rating_check  check (rating >= 1 and rating <= 5),
  constraint hostesses_status_check  check (status = any (array['active'::text, 'inactive'::text]))
);

alter table hostesses enable row level security;

-- אינדקסים
-- hostesses_pkey — unique btree (hostess_id) [נוצר ע"י האילוץ hostesses_pkey]
-- hostesses_id_number_key — unique btree (id_number) [נוצר ע"י האילוץ hostesses_id_number_key]

-- טריגרים
create trigger hostesses_enforce_min_wage
  before insert or update of hourly_rate on hostesses
  for each row execute function enforce_hostess_min_wage();

create trigger hostesses_set_updated_at
  before update on hostesses
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy hostesses_select_by_permission on hostesses
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy hostesses_write_by_permission on hostesses
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 16. אי-זמינות מוצהרת של דיילת — public.hostess_unavailability (מודול 4)
-- ============================================================
create table hostess_unavailability (
  unavailability_id bigint      not null generated always as identity,
  hostess_id        bigint      not null,
  start_date        date        not null,
  end_date          date        not null,
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint hostess_unavailability_pkey            primary key (unavailability_id),
  constraint hostess_unavailability_hostess_id_fkey foreign key (hostess_id) references hostesses (hostess_id) on update cascade on delete cascade,
  constraint hostess_unavailability_range_valid     check (end_date >= start_date)
);

alter table hostess_unavailability enable row level security;

-- אינדקסים
create index hostess_unavailability_hostess_id_idx on hostess_unavailability using btree (hostess_id);
-- hostess_unavailability_pkey — unique btree (unavailability_id) [נוצר ע"י האילוץ hostess_unavailability_pkey]

-- טריגרים
create trigger hostess_unavailability_set_updated_at
  before update on hostess_unavailability
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy hostess_unavailability_select_by_permission on hostess_unavailability
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy hostess_unavailability_write_by_permission on hostess_unavailability
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 17. העדפת לקוח לגבי דיילת — public.customer_hostess_preference (מודול 4)
-- ============================================================
-- הסימון צמוד ל**צמד** (לקוח, דיילת) — שורה אחת לכל צמד.
create table customer_hostess_preference (
  preference_id     bigint      not null generated always as identity,
  customer_id       bigint      not null,
  hostess_id        bigint      not null,
  preference        text        not null,
  preference_reason text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint customer_hostess_preference_pkey             primary key (preference_id),
  constraint customer_hostess_preference_unique           unique (customer_id, hostess_id),
  constraint customer_hostess_preference_customer_id_fkey foreign key (customer_id) references customers (customer_id) on update cascade on delete cascade,
  constraint customer_hostess_preference_hostess_id_fkey  foreign key (hostess_id)  references hostesses (hostess_id)  on update cascade on delete cascade,
  constraint customer_hostess_preference_preference_check check (preference = any (array['מצוינת'::text, 'בסדר'::text, 'לא_לשלוח'::text])),
  constraint customer_hostess_preference_negative_needs_reason check (preference <> 'לא_לשלוח'::text or preference_reason is not null)
);

alter table customer_hostess_preference enable row level security;

-- אינדקסים
create index customer_hostess_preference_hostess_id_idx on customer_hostess_preference using btree (hostess_id);
-- customer_hostess_preference_pkey — unique btree (preference_id) [נוצר ע"י האילוץ customer_hostess_preference_pkey]
-- customer_hostess_preference_unique — unique btree (customer_id, hostess_id) [נוצר ע"י האילוץ customer_hostess_preference_unique]

-- טריגרים
create trigger customer_hostess_preference_set_updated_at
  before update on customer_hostess_preference
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
create policy customer_hostess_preference_select_by_permission on customer_hostess_preference
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy customer_hostess_preference_write_by_permission on customer_hostess_preference
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 18. שיבוצי דיילות — public.assignments (מודול 4; נוכחות נוספה במודול 6)
-- ============================================================
-- 🔴 המפתח הראשי הוא (project_id, hostess_id, assignment_number). **אין כאן עמודת id_number** —
--    הקישור לדיילת הוא hostess_id bigint → hostesses(hostess_id).
-- event_date נכתב אוטומטית מהפרויקט ע"י הטריגר assignments_sync_event_date.
create table assignments (
  project_id           integer       not null,
  assignment_number    integer       not null,
  salary_report_id     integer,
  assignment_status    text          not null default 'pending',
  hourly_rate_snapshot numeric       not null,
  actual_hours         numeric       not null default 0,
  personal_bonus       numeric       not null default 0,
  reminder_sent        boolean       not null default false,
  created_at           timestamptz   not null default now(),
  updated_at           timestamptz   not null default now(),
  hostess_id           bigint        not null,
  responded_at         timestamptz,
  invite_token         text,
  invite_sent_at       timestamptz,
  travel_amount        numeric(12,2) not null default 0,
  is_shift_lead        boolean       not null default false,
  event_date           date          not null,
  attendance_status    text,
  lateness_level       text,
  no_show_reason       text,
  -- מ8 (27/08/2026): הסטטוס שקדם ל-released בביטול פרויקט; בסיס פיצוי §7.16.
  -- nullable במכוון — ביטולי-עבר נשארים NULL ואינם מניבים פיצוי (מגבלה מוצהרת).
  released_from_status text,
  -- מ11 (16/09/2026, M11-4): מיקום הדיילת בדירוג Smart Match ברגע יצירת שורת-הזימון.
  -- 🔴 כותב יחיד: `insertInviteRow` ב-src/modules/04_hostesses/api.js, **בהכנסה בלבד**.
  --    `writeInviteToken` (מסלול השליחה-החוזרת, מיובא גם ע"י מ6) אינו נוגע בה — דריסה בשליחה
  --    חוזרת הייתה סותרת את M11-4 עצמו. כתיבה שנכשלת אינה מפילה את הזימון: NULL + console.warn.
  -- ⚠️ אין מילוי-לאחור: כל 5,741 השורות הקיימות NULL, ודוח 14א מצהיר על ההיעדר במקום להציג 0%.
  recommended_rank integer,
  -- מ11 · J3 (17/09/2026, T9): מתי נחתם `recommended_rank`, **בשעון המסד**.
  -- 🔴 כותב יחיד: הטריגר `assignments_recommended_rank_stamp` — ‏**לא** הלקוח (`src/CLAUDE.md` §3,
  --    מלכודת-השעון: `new Date().toISOString()` במחשב עם שעון סוטה חותם תאריך שקרי).
  -- 🪤 והטריגר הוא `before insert or update of recommended_rank` ולא `update` לבדו: הדרג נכתב
  --    **בהכנסה בלבד** (ר' העמודה שמעל), ולכן טריגר-`update` היה עמודה שלעולם נשארת NULL.
  -- ⚠️ אין מילוי-לאחור: כל השורות שקדמו לטריגר נשארות NULL בשתי העמודות.
  recommended_rank_set_at timestamptz,
  constraint assignments_pkey                 primary key (project_id, hostess_id, assignment_number),
  constraint assignments_invite_token_key     unique (invite_token),
  constraint assignments_project_id_fkey      foreign key (project_id)       references projects (project_id)      on delete cascade,
  constraint assignments_hostess_id_fkey      foreign key (hostess_id)       references hostesses (hostess_id)     on update restrict on delete restrict,
  constraint assignments_salary_report_id_fkey foreign key (salary_report_id) references salary_reports (report_id) on delete restrict,
  constraint assignments_assignment_status_check check (assignment_status = any (array['pending'::text, 'confirmed_available'::text, 'declined'::text, 'finally_approved'::text, 'released'::text, 'approval_withdrawn'::text])),
  constraint assignments_attendance_status_check check (attendance_status = any (array['arrived'::text, 'late'::text, 'no_show'::text])),
  constraint assignments_lateness_level_check    check (lateness_level = any (array['light'::text, 'medium'::text, 'heavy'::text])),
  constraint assignments_no_show_reason_check    check (no_show_reason = any (array['sick'::text, 'approved_absence'::text, 'ghosted'::text])),
  -- צורת רשומת-הנוכחות: כל שילוב לגיטימי מנוי במפורש
  constraint assignments_attendance_shape check (
       (attendance_status is null      and lateness_level is null     and no_show_reason is null)
    or (attendance_status = 'arrived'::text and lateness_level is null     and no_show_reason is null)
    or (attendance_status = 'late'::text    and lateness_level is not null and no_show_reason is null)
    or (attendance_status = 'no_show'::text and lateness_level is null     and no_show_reason is not null)
  ),
  constraint assignments_no_show_zero_hours check (attendance_status is distinct from 'no_show'::text or actual_hours = 0::numeric),
  constraint assignments_released_from_status_check check (released_from_status is null or released_from_status = any (array['pending'::text, 'confirmed_available'::text, 'declined'::text, 'finally_approved'::text, 'released'::text, 'approval_withdrawn'::text])),
  constraint assignments_recommended_rank_check check (recommended_rank is null or recommended_rank >= 1)
);

alter table assignments enable row level security;

-- אינדקסים
create index assignments_hostess_id_idx on assignments using btree (hostess_id);
-- C-1 (שורת-מ8, 27/08/2026): אינדקס מכסה ל-FK salary_report_id
create index assignments_salary_report_id_idx on assignments using btree (salary_report_id);
-- דיילת מאושרת סופית לאירוע אחד ביום
create unique index assignments_one_event_per_day on assignments using btree (hostess_id, event_date)
  where (assignment_status = 'finally_approved'::text);
-- אחראית משמרת אחת לכל פרויקט
create unique index assignments_one_shift_lead_per_project on assignments using btree (project_id)
  where is_shift_lead;
-- assignments_pkey — unique btree (project_id, hostess_id, assignment_number) [נוצר ע"י האילוץ assignments_pkey]
-- assignments_invite_token_key — unique btree (invite_token) [נוצר ע"י האילוץ assignments_invite_token_key]

-- טריגרים
create trigger assignments_sync_event_date
  before insert or update on assignments
  for each row execute function sync_assignment_event_date();

create trigger assignments_set_updated_at
  before update on assignments
  for each row execute function moddatetime('updated_at');

create trigger assignments_recompute_project_status
  after insert or delete or update on assignments
  for each row execute function trg_recompute_project_status();

-- מ11 · J3 (17/09/2026, T9) — חותמת-הדרג. ‏`is distinct from` ולא `<>`: ‏`update` שמזכיר את
-- העמודה בלי לשנות אותה מפעיל את הטריגר, ו-NULL מול NULL ב-`<>` הוא NULL ולא `false`.
create trigger assignments_recommended_rank_stamp
  before insert or update of recommended_rank on assignments
  for each row execute function stamp_recommended_rank_set_at();

-- הערת-עמודה (comment on column)
-- recommended_rank — 'מיקום הדיילת בדירוג Smart Match (ranked) ברגע שנוצרה שורת-הזימון. נכתב פעם
--   אחת בלבד ע"י insertInviteRow, ואינו נדרס בשליחה-חוזרת. NULL = לא הייתה המלצה (זימון מחיפוש
--   ידני, או שיבוץ שקדם למיגרציה) — ואין מילוי-לאחור, כדי שדוח 14א לא יציג אחוז-אימוץ מומצא.
--   כרטיס ת5, M11-4.'
--   → supabase/migrations/20260916043400_module11_b_assignments_recommended_rank.sql
-- recommended_rank_set_at — 'מתי נחתם recommended_rank, בשעון המסד. נכתב אך ורק ע"י הטריגר
--   assignments_recommended_rank_stamp — לא ע"י הלקוח, כדי ששעון-דפדפן סוטה לא יחתום תאריך שקרי.
--   NULL = אין דרג (או שורה שקדמה לטריגר); אין מילוי-לאחור, מאותו טעם שהעמודה recommended_rank
--   עצמה אינה ממולאת לאחור. T9, M11-4, כרטיס ת5.'
--   ✅ **נבדק בטרנזקציה שגולגלה לאחור, 17/09/2026:** הכנסה עם דרג ⇒ נחתמה · הכנסה בלי דרג ⇒ NULL ·
--      עדכון דרג ⇒ נחתם · עדכון לאותו ערך ⇒ החותמת **לא זזה** · דרג ⇒ NULL ⇒ החותמת מתאפסת.
--   → supabase/migrations/20260917105300_module11_j3_money_gate_grants_rank_months.sql

-- מדיניות RLS
create policy assignments_select_by_permission on assignments
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy assignments_write_by_permission on assignments
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 19. דוחות שכר חודשיים — public.salary_reports (הורחבה למודול 8)
-- ============================================================
-- 🔴 עד 27/08/2026 הייתה deny-all מחוסר-בנייה (RLS דלוק, אפס policies) — הטבלה העסקית
--    האחרונה במצב הזה. מיגרציה B של מ8 פתחה אותה והפכה אותה ממריצה ל**מסמך**:
--    `period` (ראשון-לחודש, UNIQUE) הוא מנגנון מניעת ההפקה-הכפולה של §7.40ג/§7.68,
--    ושתי עמודות-החובה שוחררו כי הקובץ נוצר אחרי חישוב השורות (T4).
create table salary_reports (
  report_id       serial        not null,
  sent_date       date,                        -- שוחרר מ-NOT NULL במ8 (T4)
  report_file_url text,                        -- שוחרר מ-NOT NULL במ8 (T4)
  period          date          not null,      -- מ8 §7.40ג — תמיד ראשון-לחודש
  send_status     text          not null default 'pending',
  total_amount    numeric(12,2),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now(),
  constraint salary_reports_pkey primary key (report_id),
  constraint salary_reports_period_key unique (period),
  constraint salary_reports_period_first_of_month check (extract(day from period) = 1),
  constraint salary_reports_send_status_check check (send_status = any (array['pending'::text, 'sent'::text, 'failed'::text]))
);

alter table salary_reports enable row level security;

-- אינדקסים
-- salary_reports_pkey — unique btree (report_id) [נוצר ע"י האילוץ salary_reports_pkey]
-- salary_reports_period_key — unique btree (period) [נוצר ע"י האילוץ salary_reports_period_key]

-- טריגרים
create trigger salary_reports_set_updated_at
  before update on salary_reports
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS (מ8): קריאה בלבד. אין מדיניות-כתיבה — ההפקה היא טרנזקציית RPC.
create policy salary_reports_select_by_permission on salary_reports
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );


-- ============================================================
-- 28. שורות דוח השכר — public.salary_report_lines (מודול 8)
-- ============================================================
-- ה-snapshot הקפוא של מה שנחתם ונשלח לרו"ח (§7.68). שני מקורות-שורה (ה15):
-- עבודה בפועל בפרויקט שנסגר תפעולית, ופיצוי-§7.16 בפרויקט שבוטל — line_basis מפריד.
-- 🔴 אין כאן עמודות בנק במכוון (B-4): ההוכחה היא קובץ ה-xlsx בבאקט finance הפרטי;
--    שכפול פרטי-בנק לכאן היה פותח מחדש את החשיפה שמיגרציה C סוגרת.
-- 🔴 כל FK הוא RESTRICT בשני הכיוונים (T19) — אלה שורות שכר חתומות, ראיה חשבונאית;
--    ה-CASCADE של assignments→projects היה מוחק אותן יחד עם הפרויקט.
create table salary_report_lines (
  line_id           bigint        not null generated always as identity,
  report_id         integer       not null,
  hostess_id        bigint        not null,
  hostess_name      text          not null,   -- צילום-זהות ברגע החתימה
  id_number         text          not null,   -- צילום-זהות ברגע החתימה
  source_project_id integer       not null,
  line_basis        text          not null,
  hours             numeric(12,2) not null default 0,
  rate              numeric(12,2) not null,
  bonus             numeric(12,2),            -- NULL = לא-רלוונטי; המסך מציג "—" ולא 0.00
  travel            numeric(12,2),            -- NULL = לא-רלוונטי (ה29)
  line_total        numeric(12,2) not null,
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now(),
  constraint salary_report_lines_pkey primary key (line_id),
  constraint salary_report_lines_report_id_fkey         foreign key (report_id)         references salary_reports (report_id) on update restrict on delete restrict,
  constraint salary_report_lines_hostess_id_fkey        foreign key (hostess_id)        references hostesses (hostess_id)     on update restrict on delete restrict,
  constraint salary_report_lines_source_project_id_fkey foreign key (source_project_id) references projects (project_id)      on update restrict on delete restrict,
  constraint salary_report_lines_line_basis_check check (line_basis = any (array['actual'::text, 'cancellation_compensation'::text]))
);

alter table salary_report_lines enable row level security;

-- אינדקסים (מכסה לכל FK)
create index salary_report_lines_report_id_idx         on salary_report_lines using btree (report_id);
create index salary_report_lines_hostess_id_idx        on salary_report_lines using btree (hostess_id);
create index salary_report_lines_source_project_id_idx on salary_report_lines using btree (source_project_id);
-- salary_report_lines_pkey — unique btree (line_id) [נוצר ע"י האילוץ salary_report_lines_pkey]

-- טריגרים
create trigger salary_report_lines_set_updated_at
  before update on salary_report_lines
  for each row execute function extensions.moddatetime('updated_at');

-- מדיניות RLS
create policy salary_report_lines_select_by_permission on salary_report_lines
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );


-- ============================================================
-- 20. לוגיסטיקה — public.logistics (מודול 5)
-- ============================================================
-- כתיבה מתבצעת דרך פונקציות בלבד (סעיף 24 — מ-26/08 הכותב הוא `update_logistics_item`);
-- ללקוח יש policy קריאה + policy-כתיבה מגודרת edit (M5-1).
create table logistics (
  project_id            integer     not null,
  sku                   text        not null,
  serial_number         integer     not null,
  planned_qty           integer     not null,
  actual_qty            integer     not null default 0,
  item_status           text        not null default 'not_started',
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  quote_service_line_id bigint,
  project_change_id     bigint,
  color                 text,
  expected_arrival_date date,
  actual_arrival_date   date,
  actual_qty_autofilled boolean     not null default false,
  constraint logistics_pkey                     primary key (project_id, sku, serial_number),
  constraint logistics_project_id_fkey          foreign key (project_id)            references projects (project_id)            on delete cascade,
  constraint logistics_sku_fkey                 foreign key (sku)                   references products (sku)                   on update cascade on delete restrict,
  constraint logistics_quote_service_line_id_fkey foreign key (quote_service_line_id) references quote_services (line_id)        on delete restrict,
  constraint logistics_project_change_id_fkey   foreign key (project_change_id)     references project_changes (change_id)      on delete restrict,
  constraint logistics_item_status_check        check (item_status = any (array['not_started'::text, 'ordered'::text, 'ready'::text])),
  constraint logistics_planned_qty_check        check (planned_qty > 0),
  -- M5-2 — הרצפה של C6 §2.4.13
  constraint logistics_actual_qty_check         check (actual_qty >= 0),
  -- M5-5 — העתק-בייט של quote_services_color_check (⑱: הצבע נוסע עם השורה)
  constraint logistics_color_check              check (color is null or color = any (array['לבן'::text, 'שחור'::text, 'אפור'::text, 'טורקיז'::text, 'כחול'::text])),
  -- לכל היותר אחת משתי עמודות-המקור מלאה
  constraint logistics_origin_exactly_one check (
       (quote_service_line_id is null and project_change_id is null)
    or num_nonnulls(quote_service_line_id, project_change_id) = 1
  )
);

alter table logistics enable row level security;

comment on column logistics.quote_service_line_id is
  'מקור השורה: שורת ההצעה שהולידה אותה. מ-26/08/2026 (M5-3) ה-RPC של אישור-הצעה ממלא אותה, וה-backfill מילא את כל השורות הישנות החד-משמעיות.';
comment on column logistics.expected_arrival_date is
  'מתי הובטח שיגיע — היא ממלאת בהזמנה (㊶). הטריגר השני של סימון-הענבר ⑳ נשען עליו.';
comment on column logistics.actual_arrival_date is
  'מתי הגיע בפועל — נחתם ע"י update_logistics_item במעבר ל-ready, לעולם לא ידנית (M5-8).';
comment on column logistics.actual_qty_autofilled is
  'true כשהכמות-בפועל מולאה אוטומטית בסימון מוכן (㊵) — מספר שאיש לא ספר, והמסך מסמן זאת.';
comment on column logistics.project_change_id is
  'מקור השורה: שורת שינוי-התכולה שהולידה אותה. בדיוק אחת משתי עמודות-המקור מלאה, או שתיהן NULL.';

-- אינדקסים
create index logistics_sku_idx                   on logistics using btree (sku);
create index logistics_quote_service_line_id_idx on logistics using btree (quote_service_line_id);
create index logistics_project_change_id_idx     on logistics using btree (project_change_id);
-- logistics_pkey — unique btree (project_id, sku, serial_number) [נוצר ע"י האילוץ logistics_pkey]

-- טריגרים
create trigger logistics_set_updated_at
  before update on logistics
  for each row execute function moddatetime('updated_at');

create trigger logistics_recompute_project_status
  after insert or delete or update on logistics
  for each row execute function trg_recompute_project_status();

-- מדיניות RLS
create policy logistics_select_by_permission on logistics
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לוגיסטיקה')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

-- M5-1 (26/08/2026) — שער 'לוגיסטיקה', לעולם לא 'פרויקטים' (㉞)
create policy logistics_write_by_permission on logistics
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לוגיסטיקה')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לוגיסטיקה')
        and p.permission_level = 'edit'
    )
  );


-- ============================================================
-- 21. פרויקטים — public.projects (מודול 6; המחבר המרכזי, מכונת מצבים)
-- ============================================================
-- כתיבה מתבצעת דרך פונקציות בלבד (סעיף 24); ללקוח יש policy קריאה בלבד.
-- 🔴 **אין כאן עמודת project_bonus.**
create table projects (
  project_id                serial      not null,
  quote_id                  integer     not null,
  owner_email               text        not null,
  final_event_date          date        not null,
  final_location            text        not null,
  required_hostess_count    integer     not null,
  project_status            text        not null default 'not_started',
  invoice_sent              boolean     not null default false,
  feedback_status           text        not null default 'not_sent',
  actual_guests             integer,
  actual_hours              numeric,
  cancel_reason             text,
  payment_date              date,
  feedback_score            integer,
  negative_feedback_reason  text,
  feedback_notes            text,
  summary_report_url        text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  event_name                text,
  customer_id               bigint,
  final_start_time          time,
  final_end_time            time,
  lat                       numeric,
  lng                       numeric,
  customer_name             text,
  owner_name                text,
  owner_phone               text,
  -- חמש עמודות מודול 6: ביטול פרויקט וסגירה תפעולית
  cancelled_at              timestamptz,
  cancelled_by              text,
  cancel_type               text,
  operationally_closed_at   timestamptz,
  operationally_closed_by   text,
  -- שתי עמודות מודול 8 (27/08/2026): חותמת שליחת-החשבונית (ממנה נגזרים ימי-האיחור
  -- מול תנאי_תשלום_ימים) וטוקן דף-המשוב הציבורי (נטבע בשליחה, מאופס ל-NULL בארכוב).
  -- 🔴 הכסף עצמו אינו כאן — הוא בטבלת-הבת project_finance (סעיף 27, product-Q2).
  invoice_sent_at           timestamptz,
  feedback_token            text,
  -- שלוש עמודות המשוב הרב-ערכי (04/09/2026, מיגרציות 20260904230000 + 20260904233000):
  -- ההדגש החיובי (ציונים 4–5) נולד כערך-יחיד, ומיד אחריו הומרו שני הצדדים לבחירה-מרובה.
  -- 🔑 עמודות-היחיד **לא ירדו**: `submit_feedback` ו-`record_feedback` כותבות את שתיהן —
  --    את המערך המלא, ואת `[1]` שלו לעמודת-היחיד — כדי שקוד פרוס שקורא את הישנה לא יישבר
  --    (Expand-Contract). קורא חדש צריך את עמודות-המערך; עמודות-היחיד הן שארית-תאימות.
  -- ⚠️ המחיקה/ההוספה **אינה סימטרית בין הצדדים:** לשלילי יש `negative_feedback_reason`
  --    מאז מ8, ולחיובי נולדו השניים יחד ב-04/09.
  positive_feedback_reason  text,
  negative_feedback_reasons text[]      default '{}'::text[],
  positive_feedback_reasons text[]      default '{}'::text[],
  constraint projects_pkey                        primary key (project_id),
  constraint projects_quote_id_key                unique (quote_id),
  constraint projects_feedback_token_key          unique (feedback_token),
  constraint projects_quote_id_fkey               foreign key (quote_id)                references quotes (quote_id)       on delete restrict,
  constraint projects_customer_id_fkey            foreign key (customer_id)             references customers (customer_id),
  constraint projects_owner_email_fkey            foreign key (owner_email)             references users (email)           on delete restrict,
  constraint projects_cancelled_by_fkey           foreign key (cancelled_by)            references users (email)           on delete restrict,
  constraint projects_operationally_closed_by_fkey foreign key (operationally_closed_by) references users (email)          on delete restrict,
  constraint projects_project_status_check        check (project_status = any (array['not_started'::text, 'in_progress'::text, 'ready'::text, 'event_finished'::text, 'awaiting_invoice'::text, 'awaiting_payment'::text, 'finished'::text, 'cancelled'::text])),
  constraint projects_required_hostess_count_check check (required_hostess_count > 0),
  constraint projects_feedback_status_check       check (feedback_status = any (array['not_sent'::text, 'sent'::text, 'completed'::text, 'no_response'::text])),
  constraint projects_feedback_score_check        check (feedback_score >= 1 and feedback_score <= 5),
  constraint projects_negative_feedback_reason_check check (negative_feedback_reason is null or negative_feedback_reason = any (array['איחור דיילות'::text, 'תפקוד דיילות'::text, 'איכות תגים'::text, 'ניהול לקוי'::text, 'אחר'::text])),
  constraint projects_positive_feedback_reason_check check (positive_feedback_reason is null or positive_feedback_reason = any (array['מקצועיות הדיילות'::text, 'עמידה בזמנים'::text, 'איכות תגים וציוד'::text, 'ניהול ותקשורת'::text, 'אחר'::text])),
  -- 🔑 המערכים נבדקים ב-`<@` (הכלה), לא ב-`= any` — כל ערך במערך חייב להיות מהרשימה,
  --    ומערך ריק `{}` עובר. שתי הרשימות שונות זו מזו, ו-'אחר' מופיע בשתיהן.
  constraint projects_negative_feedback_reasons_check check (negative_feedback_reasons is null or negative_feedback_reasons <@ array['איחור דיילות'::text, 'תפקוד דיילות'::text, 'איכות תגים'::text, 'ניהול לקוי'::text, 'אחר'::text]),
  constraint projects_positive_feedback_reasons_check check (positive_feedback_reasons is null or positive_feedback_reasons <@ array['מקצועיות הדיילות'::text, 'עמידה בזמנים'::text, 'איכות תגים וציוד'::text, 'ניהול ותקשורת'::text, 'אחר'::text]),
  constraint projects_cancel_type_check           check (cancel_type is null or cancel_type = any (array['customer'::text, 'force_majeure'::text, 'other'::text])),
  -- שלושת הסטטוסים שאחרי הסגירה התפעולית מחייבים דוח-סיכום
  constraint projects_closed_needs_report check (
    project_status <> all (array['awaiting_invoice'::text, 'awaiting_payment'::text, 'finished'::text])
    or summary_report_url is not null
  )
);

alter table projects enable row level security;

-- אינדקסים
create index projects_customer_id_idx             on projects using btree (customer_id);
create index projects_owner_email_idx             on projects using btree (owner_email);
create index projects_cancelled_by_idx            on projects using btree (cancelled_by);
create index projects_operationally_closed_by_idx on projects using btree (operationally_closed_by);
-- projects_pkey — unique btree (project_id) [נוצר ע"י האילוץ projects_pkey]
-- projects_quote_id_key — unique btree (quote_id) [נוצר ע"י האילוץ projects_quote_id_key]
-- projects_feedback_token_key — unique btree (feedback_token) [נוצר ע"י האילוץ projects_feedback_token_key]

-- טריגרים
create trigger projects_set_updated_at
  before update on projects
  for each row execute function moddatetime('updated_at');

create trigger projects_recompute_on_required_count
  after update of required_hostess_count on projects
  for each row when (old.required_hostess_count is distinct from new.required_hostess_count)
  execute function trg_recompute_project_status();

create trigger projects_sync_assignment_dates
  after update of final_event_date on projects
  for each row when (old.final_event_date is distinct from new.final_event_date)
  execute function sync_assignments_on_project_date_change();

-- מדיניות RLS
create policy projects_select_by_permission on projects
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );
--   → supabase/migrations/20260904230000_feedback_positive_and_negative_reasons.sql
--     (‏`positive_feedback_reason` + ה-CHECK שלה + הערת-עמודה)
--   → supabase/migrations/20260904233000_feedback_multi_select_reasons.sql
--     (שתי עמודות-המערך + שני ה-CHECK + מילוי-ראשוני מהעמודות הבודדות)
-- 🔴 **שתי המיגרציות האלה אינן רשומות ב-`supabase_migrations.schema_migrations`** (נמדד
--    16/09/2026: הרשם קופץ מ-`20260903155157` ל-`20260906053752`), **והמסד בכל זאת מחזיק את
--    העמודות ואת האילוצים.** כלומר ה-SQL הורץ לא דרך `apply_migration`. הראיה הנוספת: הקובץ
--    מכיל `comment on column` לשתי עמודות-המערך, **ובמסד החי אין להן הערה** — רק ל-
--    `positive_feedback_reason` יש. ⇒ מה שרץ חי אינו זהה-בייט לקובץ. **טעון בדיקה של ישי:**
--    האם להריץ מיגרציית-תיקון-קדימה שמוסיפה את שתי ההערות ומיישרת את הרשם.


-- ============================================================
-- 22. שינויי תכולה בפרויקט — public.project_changes (מודול 6)
-- ============================================================
-- כתיבה מתבצעת דרך הפונקציה apply_scope_change בלבד (סעיף 24); ללקוח יש policy קריאה בלבד.
-- change_group_id מקבץ שורות שנשמרו יחד בפעולה אחת.
create table project_changes (
  change_id           bigint        not null generated always as identity,
  project_id          integer       not null,
  change_group_id     uuid          not null,
  sku                 text,
  color               text,
  change_target       text          not null,
  delta_qty           integer       not null,
  unit_price_snapshot numeric(12,2) not null,
  unit_cost_snapshot  numeric(12,2) not null,
  reason              text          not null,
  performed_by        text          not null,
  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now(),
  constraint project_changes_pkey              primary key (change_id),
  constraint project_changes_project_id_fkey   foreign key (project_id)   references projects (project_id) on delete cascade,
  constraint project_changes_sku_fkey          foreign key (sku)          references products (sku)        on update cascade on delete restrict,
  constraint project_changes_performed_by_fkey foreign key (performed_by) references users (email)         on delete restrict,
  constraint project_changes_change_target_check check (change_target = any (array['logistics'::text, 'hostess_count'::text])),
  constraint project_changes_delta_qty_check   check (delta_qty <> 0),
  constraint project_changes_reason_check      check (length(btrim(reason)) > 0),
  constraint project_changes_color_check       check (color is null or color = any (array['לבן'::text, 'שחור'::text, 'אפור'::text, 'טורקיז'::text, 'כחול'::text])),
  constraint project_changes_unit_price_snapshot_check check (unit_price_snapshot >= 0::numeric),
  constraint project_changes_unit_cost_snapshot_check  check (unit_cost_snapshot >= 0::numeric),
  -- שינוי לוגיסטי מחייב sku; שינוי כמות-דיילות אוסר sku וצבע
  constraint project_changes_target_shape check (
       (change_target = 'logistics'::text     and sku is not null)
    or (change_target = 'hostess_count'::text and sku is null and color is null)
  )
);

alter table project_changes enable row level security;

-- אינדקסים
create index project_changes_project_id_idx   on project_changes using btree (project_id, created_at desc);
create index project_changes_sku_idx          on project_changes using btree (sku);
create index project_changes_performed_by_idx on project_changes using btree (performed_by);
-- project_changes_pkey — unique btree (change_id) [נוצר ע"י האילוץ project_changes_pkey]

-- טריגרים
create trigger project_changes_set_updated_at
  before update on project_changes
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS
-- 🔴 אפס policies — **במכוון** (deny-all). המדיניות הרחבה `project_changes_select_by_permission`
--    הוסרה ב-`20260814152647_module6_project_changes_money_gated_reader.sql`: היא חשפה את
--    `unit_price_snapshot`/`unit_cost_snapshot` לכל מחזיקי 'פרויקטים' — בסתירה לכרטיסי-המסך
--    המאושרים (מנהלת לוגיסטיקה ומנהלת גיוס חסומות מנתונים פיננסיים). הקריאה היחידה מהדפדפן
--    היא דרך ה-RPC ‏`list_project_changes` (סעיף 24), שמחזיר את שדות-הכסף כ-NULL למי שאינו מורשה
--    ודגל `money_visible` כדי שהמסך יציג `—` במקום ריק.


-- ============================================================
-- 23. יומן שליחות מיילים — public.email_log (חוצה מודולים)
-- ============================================================
-- קריאה בלבד ללקוח, ומפוצלת לשלוש policies לפי entity_type ⇒ לפי המודול שבו הישות חיה.
create table email_log (
  email_log_id  bigint      not null generated always as identity,
  entity_type   text        not null,
  entity_id     bigint      not null,
  recipient     text        not null,
  template_name text,
  subject       text,
  status        text        not null,
  error_message text,
  sent_by_email text,
  created_at    timestamptz not null default now(),
  constraint email_log_pkey              primary key (email_log_id),
  constraint email_log_entity_type_check check (entity_type = any (array['quote'::text, 'shift'::text, 'project'::text, 'project_report'::text, 'invoice'::text, 'salary_report'::text])),
  constraint email_log_status_check      check (status = any (array['sent'::text, 'failed'::text]))
);

alter table email_log enable row level security;

comment on table email_log is
  'יומן שליחות מיילים — מקור-האמת ל"האם נשלח". גנרי לפי (entity_type, entity_id). נכתב ע"י Edge Function בלבד (service-role); הלקוח קורא ולא כותב. הוקדם ממודול 10 בהכרעת-ישי 30/07/2026.';

-- אינדקסים
create index idx_email_log_entity on email_log using btree (entity_type, entity_id, created_at desc);
-- email_log_pkey — unique btree (email_log_id) [נוצר ע"י האילוץ email_log_pkey]

-- מדיניות RLS
create policy email_log_select_quotes_module on email_log
  for select to authenticated
  using (
    entity_type = 'quote'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy email_log_select_shifts_module on email_log
  for select to authenticated
  using (
    entity_type = 'shift'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

-- מ8 (27/08/2026) — ה-policy הרביעית. ⚠️ ארבעתן PERMISSIVE, כלומר הן **מתאחדות ב-OR**:
-- מנהלת-הכספים אינה רואה *רק* את שתי השורות שלה — היא כבר רואה גם מיילי-הצעות
-- (view על 'הצעות מחיר') ומיילי-פרויקטים (view על 'פרויקטים'), דרך שתי ה-policies
-- הקיימות. נמדד 27/08/2026: 8 שורות = 6 quote + 1 project + 1 project_report.
-- ה-policy הזו רק **מוסיפה** לה את invoice/salary_report; היא אינה מצמצמת דבר.
create policy email_log_select_finance_module on email_log
  for select to authenticated
  using (
    entity_type = any (array['invoice'::text, 'salary_report'::text])
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy email_log_select_projects_module on email_log
  for select to authenticated
  using (
    entity_type = any (array['project'::text, 'project_report'::text])
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );


-- ============================================================
-- 27. כספי הפרויקט — public.project_finance (מודול 8)
-- ============================================================
-- טבלת-בת 1:1 לפרויקט. נוצרה 27/08/2026 במיגרציה
-- 20260827125155_module8_finance_tables_and_columns.
-- 🔴 למה בת ולא עמודות על projects (product-Q2): ה-policy של projects פותחת
--    את כל השורה לכל מחזיק 'פרויקטים' — רווח ודמי-ביטול אינם אמורים להיחשף כך.
-- 🔴 policy אחת בלבד, קריאה. **אין מדיניות-כתיבה במכוון** — כל כתיבה עוברת
--    ב-SECURITY DEFINER RPC שמאשר 'כספים' (§7.63/ה22). UPDATE ישיר = 0 שורות.
-- 🚧 מודול שיצטרך לקרוא מכאן (מ11/מ7/מ10) מוסיף policy מגודרת משלו — לא מרחיב
--    את של מ8 (תקדים email_log, db_roadmap A-20).
create table project_finance (
  project_id            integer     not null,
  final_profit          numeric(12,2),          -- §7.52 — רווח סופי קפוא בשקלים בארכוב
  cancellation_fee      numeric(12,2),          -- §7.20ג/ה28 — הסכום הסופי בלבד
  cancellation_fee_note text,                   -- ה28 — הערת-פירוט חופשית
  written_off           boolean     not null default false,
  written_off_reason    text,                   -- P3 — ה-RPC אוכף שאינה ריקה בחוב-אבוד
  invoice_file_url      text,                   -- B-8 — הקובץ שהועלה לבאקט finance
  archived_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint project_finance_pkey primary key (project_id),
  constraint project_finance_project_id_fkey foreign key (project_id) references projects (project_id) on update restrict on delete restrict
);

alter table project_finance enable row level security;

-- אינדקסים
-- project_finance_pkey — unique btree (project_id) [נוצר ע"י האילוץ project_finance_pkey]

-- טריגרים
create trigger project_finance_set_updated_at
  before update on project_finance
  for each row execute function extensions.moddatetime('updated_at');

-- מדיניות RLS
create policy project_finance_select_by_permission on project_finance
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

-- ============================================================
-- 29. פרטי בנק של דיילת — public.hostess_bank_details (מודול 8)
-- ============================================================
-- ה19: RLS ב-Postgres הוא ברמת-שורה ולא ברמת-עמודה ⇒ כל מחזיק 'דיילות' שראה דיילת
-- ראה גם את חשבון-הבנק שלה. הפיצול לטבלת-בת הוא התקדים החי של product_costs.
-- 🔴 קריאה: 'דיילות' עם עריכה (הטופס של מ4, ALL) + 'כספים' עם עריכה (דוח-השכר, SELECT
--    בלבד — היא לעולם לא עורכת פרטי בנק).
-- 🔴 שורה חסרה היא מצב תקין — דיילת בלי פרטי בנק. הקריאה היא LEFT JOIN, והיא מוצגת.
-- ✅ **הפיצול הושלם — C2 רצה 27/08/2026 18:0X ו-ה19 סגור.** שלוש העמודות המקוריות
--    **אינן קיימות יותר** על hostesses (ר' סעיף 15), ופרטי-בנק חיים **רק כאן**.
--    🔴 **תוקן 01/09/2026 באודיט-סגירת מ8:** עד כאן עמד "⏸️ הפיצול חצי-גמור בכוונה …
--    **עד אז חשיפת-ה19 עדיין פתוחה**" — נכון בזמן הכתיבה ושקרי מרגע ש-C2 רצה, **וסותר
--    את סעיף 15 באותו קובץ.** נמדד חי: אפס משלוש העמודות ב-information_schema, ו-26
--    שורות-בנק מול 26 דיילות. **קורא שהגיע לכאן ב-grep הסיק שחשיפת-PII פתוחה — והיא סגורה.**
create table hostess_bank_details (
  hostess_id   bigint      not null,
  bank_name    text        not null,
  bank_branch  text        not null,
  bank_account text        not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint hostess_bank_details_pkey primary key (hostess_id),
  constraint hostess_bank_details_hostess_id_fkey foreign key (hostess_id) references hostesses (hostess_id) on update restrict on delete cascade
);

alter table hostess_bank_details enable row level security;

-- אינדקסים
-- hostess_bank_details_pkey — unique btree (hostess_id) [נוצר ע"י האילוץ hostess_bank_details_pkey]

-- טריגרים
create trigger hostess_bank_details_set_updated_at
  before update on hostess_bank_details
  for each row execute function extensions.moddatetime('updated_at');

-- מדיניות RLS
create policy hostess_bank_details_all_hostesses_module on hostess_bank_details
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  );

create policy hostess_bank_details_select_finance_module on hostess_bank_details
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = 'edit'
    )
  );

-- ============================================================
-- 30. קצב-קריאות לדף-המשוב הציבורי — public.feedback_rpc_calls (מודול 8)
-- ============================================================
-- ⚠️ אין לטבלה הזו מפתח ראשי. RLS מופעל ואין לה אף policy — בדיוק כמו `login_rpc_calls`.
-- 🔴 הדף הציבורי `/feedback/:token` נפתח **בלי התחברות**; המונה הזה הוא
--    הדבר היחיד שמונע מניחוש-טוקנים בלולאה: 15 קריאות ל-IP לשעה.
create table feedback_rpc_calls (
  ip        inet        not null,
  called_at timestamptz not null default now()
);

comment on table feedback_rpc_calls is
  'מ8 — מונה הגבלת-קצב לדף-המשוב הציבורי (15/IP/שעה). דפוס `login_rpc_calls`. deny-all: הגישה רק דרך פונקציות DEFINER.';

alter table feedback_rpc_calls enable row level security;

-- אינדקסים
create index feedback_rpc_calls_ip_called_at_idx on feedback_rpc_calls using btree (ip, called_at);

-- מדיניות RLS: אין (0 policies)
--   → supabase/migrations/20260827155303_module8_public_feedback_rpc.sql

-- ============================================================
-- 31. שפות הדיילת — public.hostess_languages (מודול 8 · N1)
-- ============================================================
-- 🔴 **נרמול, לא אבטחה — וזה קובע את ההרשאות.** `hostesses.languages` היה `text[]`,
--    כלומר רשימה בתא אחד — ההפרה היחידה של 1NF במסד. הפיצול הזה שונה מ-ה19
--    (פרטי-הבנק): שם המטרה הייתה **לצמצם** מי רואה, וכאן אין צמצום כלל.
--    ⇒ שתי ה-policies כאן **זהות אחת-לאחת** לאלה של `hostesses`.
-- 🔑 **מפתח ראשי מורכב** `(hostess_id, language)` — כפילות בלתי-אפשרית בהגדרה.
--    המערך הישן קיבל `{'עברית','עברית'}` בשקט.
-- ⚠️ **האינדקס על `language` ולא על `hostess_id`** — המפתח כבר מכסה את השני
--    כעמודה מובילה; מה שחסר הוא "מי מדברת ערבית?".
create table hostess_languages (
  hostess_id bigint      not null,
  language   text        not null,
  created_at timestamptz not null default now(),
  constraint hostess_languages_pkey primary key (hostess_id, language),
  constraint hostess_languages_hostess_id_fkey
    foreign key (hostess_id) references hostesses (hostess_id) on delete cascade,
  constraint hostess_languages_not_blank check (btrim(language) <> '')
);

alter table hostess_languages enable row level security;

-- אינדקסים
create index hostess_languages_language_idx on hostess_languages using btree (language);

-- מדיניות RLS (2) — שיקוף מדויק של hostesses
create policy hostess_languages_select_by_permission on hostess_languages
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = any (array['edit', 'view'])
    )
  );

-- ⚠️ `for all` מכסה גם SELECT לבעל edit — מי שבודק "מה קורה בלי policy" חייב
--    להפיל את **שתיהן**.
create policy hostess_languages_write_by_permission on hostess_languages
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  );
--   → supabase/migrations/20260827183845_module8_n1_hostess_languages_additive.sql


-- ============================================================
-- 32. העדפות התראות של המשתמש — public.notification_preferences (מודול 9)
-- ============================================================
-- 🔑 **המפתח הראשי הוא המייל עצמו** — שורה אחת למשתמש, בלי מפתח-סינתטי. זהו ה-FK
--    **החמישי** במסד שמצביע ל-`users(email)` (הארבעה האחרים: שלושה על `projects`
--    ואחד על `project_changes`).
-- ⚠️ **`on update no action` נכתב במפורש, ואינו שכחה.** שינוי-מייל צריך להיכשל **בקול**
--    על ה-FK עד שיגיע סנכרון-Auth (§7.64, נדחה) — `cascade` היה הופך כשל רועש
--    לנעילה שקטה. ‏`on delete cascade`: משתמש שנמחק לוקח את ההעדפה איתו.
-- 🔴 **אין שורה = שתי העדפות-ההתראה כבויות ורמת-ההטמעה 0.** אין Seed ואין ברירת-מחדל
--    בצד המסד מעבר ל-`false`/`0` — קוד שלא מוצא שורה חייב להציג "כבוי", לא "לא ידוע".
--    *(✏️ 08/09/2026: היה "שני המתגים כבויים" — עכשיו שלוש עמודות-העדפה, אחת מהן רמה.)*
-- ⚠️ **`sms_last_minute` קיימת והערוץ אינו קיים** (R-4): המתג מוצג כבוי ונעול עם
--    "אין ערוץ SMS במערכת". העמודה נוצרה עכשיו כדי שלא תידרש מיגרציה כשהערוץ יגיע.
-- 🆕 **`onboarding_mode` — רמת "מצב הטמעה" 0/1/2** (מיגרציה `20260908221959_onboarding_mode`,
--    הכרעה 28⑭): `integer`, לא בוליאני — 0 נקי · 1 מכוון · 2 מודרך; אילוץ-בשם 0..2.
--    ברירת-המחדל 0 (הכרעת-ישי 28⑫(א)). `<Hint>` בכל מסך קורא אותה מ-`AuthContext`.
-- 🔴 **ארבע מדיניות — שלוש עצמי + אחת למנכ"ל (`for all`) — ואין DELETE.** *(✏️ 08/09/2026:
--    היה "שלוש מדיניות בלבד".)* הרביעית, `notification_preferences_ceo_all`, היא הדלת
--    שדרכה המנכ"ל קורא וכותב את רמת-ההטמעה של אחרת ממסך ניהול-המשתמשים (הכרעה 28⑨) —
--    אותו פרדיקט כמו `users_write_ceo_only` (סעיף 4). מחיקה מגיעה רק דרך ה-cascade של `users`.
create table notification_preferences (
  email              text        not null,
  email_new_projects boolean     not null default false,
  sms_last_minute    boolean     not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  onboarding_mode    integer     not null default 0,
  constraint notification_preferences_pkey primary key (email),
  constraint notification_preferences_email_fkey
    foreign key (email) references users (email) on update no action on delete cascade,
  constraint notification_preferences_onboarding_mode_check
    check (onboarding_mode >= 0 and onboarding_mode <= 2)
);

alter table notification_preferences enable row level security;

-- הערת-טבלה (comment on table)
-- 'העדפות פר-משתמשת: שתי העדפות-התראה (מודול 9 שומר, מודול 10 שולח) ורמת מצב-ההטמעה
--  (onboarding_mode). אין שורה = הכל כבוי ורמה 0. SMS: העמודה קיימת, הערוץ לא (R-4).'
-- הערת-עמודה (comment on column onboarding_mode)
-- 'רמת מצב-ההטמעה של המשתמשת: 0 נקי (ברירת-מחדל, אין שורה = 0) · 1 מכוון (מונח · מקור-המספר ·
--  נימוק-סידור, שורה לכל אחד — טרם נכתב) · 2 מודרך (ההסבר המלא). הכרעה 28⑭, 07/09/2026.'

-- אינדקסים
-- notification_preferences_pkey — unique btree (email) [נוצר ע"י האילוץ notification_preferences_pkey]
-- (אין אינדקס נוסף — ה-PK מכסה את כל שאילתות המסך)

-- טריגרים
create trigger notification_preferences_set_updated_at
  before update on notification_preferences
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS (4) — שלוש מדיניות-עצמי בתקדים users_update_self, ואחת למנכ"ל בתקדים users_write_ceo_only
create policy notification_preferences_select_self on notification_preferences
  for select to authenticated
  using (email = (select auth.email()));

create policy notification_preferences_insert_self on notification_preferences
  for insert to authenticated
  with check (email = (select auth.email()));

create policy notification_preferences_update_self on notification_preferences
  for update to authenticated
  using (email = (select auth.email()))
  with check (email = (select auth.email()));

create policy notification_preferences_ceo_all on notification_preferences
  for all to authenticated
  using      ((select current_user_role_id()) = (select role_id from roles where role_name = 'מנכ"ל'))
  with check ((select current_user_role_id()) = (select role_id from roles where role_name = 'מנכ"ל'));
--   → supabase/migrations/20260902211550_module9_b_notification_preferences.sql (הטבלה + 3 מדיניות-עצמי)
--   → supabase/migrations/20260908221959_onboarding_mode.sql (העמודה + האילוץ + ההערות + המדיניות הרביעית)


-- ============================================================
-- 33. מרשם-הזריעה — public.seed_registry (זריעת נתוני-ההדגמה, מודול 7)
-- ============================================================
-- 🎯 **"מדבקה" על כל שורה שגנרטור נתוני-ההדגמה (`scripts/demo-seed.mjs`) יצר** — לקוח ·
--    דיילת · הצעה · פרויקט — כדי ש-`seed_reset` תמחק בדיוק את מה שנזרע ו-`seed_backdate_*`
--    יזיזו תאריכים **רק** של שורות רשומות. הדמו הישן (לקוחות 46–49, פרויקטים 3/7/8/13/14,
--    חמש הדיילות) **אינו במרשם** ⇒ בלתי-נגיש לפונקציות האלה מבנייה.
-- 🔴 **RLS דלוק בלי policies במכוון** — הגישה רק דרך ארבע פונקציות ה-DEFINER (סעיף 24,
--    "זריעה"), באותו דפוס של `login_attempts`/`feedback_rpc_calls`. אף מסך אינו קורא אותה.
-- 🔑 **והשפעתה היחידה על טבלה קיימת:** `enforce_quote_in_progress_lock` (הטריגר של quotes/
--    quote_services) מתיר עדכון/מחיקה של הצעה **רשומה כאן** כשמפתח-הסשן `regin.seed_bypass`
--    דלוק — והמפתח נקבע רק בתוך `seed_backdate_quote`/`seed_reset`. הצעה אמיתית לעולם אינה
--    כאן ⇒ הנעילה עליה לא נחלשה.
create table seed_registry (
  entity_type text        not null,
  entity_id   bigint      not null,
  batch_id    text        not null,
  created_at  timestamptz not null default now(),
  constraint seed_registry_pkey              primary key (entity_type, entity_id),
  constraint seed_registry_entity_type_check check (entity_type = any (array['customer'::text, 'hostess'::text, 'quote'::text, 'project'::text]))
);

alter table seed_registry enable row level security;

-- הערת-טבלה (comment on table)
-- 'רישום שורות שנוצרו ע"י גנרטור נתוני-ההדגמה (scripts/demo-seed.mjs). RLS דלוק בלי policies
--  במכוון — גישה רק דרך seed_register / seed_backdate_* / seed_reset.'

-- אינדקסים
-- seed_registry_pkey      — unique btree (entity_type, entity_id) [נוצר ע"י האילוץ seed_registry_pkey]
-- seed_registry_batch_idx — btree (batch_id)  [המפתח של seed_reset]

-- טריגרים: אין (אין updated_at — שורת-רישום אינה נערכת, רק נוצרת ונמחקת)
-- מדיניות RLS: אין (deny-all במכוון)
--   → supabase/migrations/20260903180958_seed_registry_and_helpers.sql


-- ============================================================
-- 34. ריצות סיווג-AI של הערות-לקוח — public.feedback_ai_runs (מודול 11)
-- ============================================================
-- 🆕 נוספה 16/09/2026 (מיגרציה A של מודול 11). שורה אחת לכל ריצת-סיווג של הערות המשוב.
-- 🔴 **הכותבת היא פונקציית-הקצה `supabase/functions/classify-feedback` ב-service role, ולכן
--    לטבלה אין ולו מדיניות-כתיבה אחת** — בדיוק הדפוס של `email_log`, שגם לו רק policy קריאה.
--    הפעולה היחידה שמגיעה מהדפדפן היא **אישור-להצגה**, והיא RPC: `approve_feedback_ai_run`.
-- ⚠️ **ואם תתווסף כאן אי-פעם policy כתיבה — היא מתאחדת ב-OR עם הקריאה** (ר' כותרת הקובץ).
create table feedback_ai_runs (
  run_id       bigint      not null generated by default as identity,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text        not null,
  sent_count   integer     not null default 0,
  ok_count     integer     not null default 0,
  failed_count integer     not null default 0,
  model        text,
  run_by       text,
  approved_at  timestamptz,
  approved_by  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint feedback_ai_runs_pkey        primary key (run_id),
  constraint feedback_ai_runs_run_by_fkey      foreign key (run_by)      references users (email) on delete restrict,
  constraint feedback_ai_runs_approved_by_fkey foreign key (approved_by) references users (email) on delete restrict,
  constraint feedback_ai_runs_status_check check (status = any (array['running'::text, 'done'::text, 'partial'::text, 'failed'::text])),
  constraint feedback_ai_runs_counts_nonneg check (sent_count >= 0 and ok_count >= 0 and failed_count >= 0)
);

alter table feedback_ai_runs enable row level security;

-- הערת-טבלה (comment on table)
-- 'ריצת-סיווג אחת של הערות-לקוח (מודול 11, כרטיס ת2). הכתיבה היא של פונקציית-השרת
--  classify-feedback ב-service role; האישור להצגה הוא RPC מגודר edit על מודול הדוחות.
--  דף 20 מציג רק שורות מריצה מאושרת.'

-- הערות-עמודה (comment on column) — התמצית
-- status       — 'running בתחילת ריצה · done בסיום מלא · partial כשמכסה או פסק-זמן קטעו והסיווגים
--                 שכבר נעשו נשמרו · failed כשלא נשמר דבר.'
-- sent_count   — 'כמה הערות נשלחו למודל בריצה הזו; ok_count/failed_count הם הפילוח שלהן.'
-- model        — 'שם-הדגם שסיווג בפועל. נשמר כדי שהשוואת אדם-מול-מודל תדע איזה מודל היא משווה.'
-- run_by       — 'המייל של מי שלחצה "הרץ ניתוח" (auth.email(), תקדים projects.cancelled_by).'
-- approved_at  — 'רגע האישור להצגה. NULL = טרם אושרה, ואז דף 20 אומר "טרם אושרה ריצת-ניתוח"
--                 ואינו מציג דוח ריק.'
-- approved_by  — 'המייל של מי שאישרה להצגה. נכתב אך ורק ע"י approve_feedback_ai_run, לעולם לא מהדפדפן.'

-- אינדקסים
-- feedback_ai_runs_pkey — unique btree (run_id) [נוצר ע"י האילוץ feedback_ai_runs_pkey]
create index feedback_ai_runs_run_by_idx      on feedback_ai_runs using btree (run_by);
create index feedback_ai_runs_approved_by_idx on feedback_ai_runs using btree (approved_by);
-- 🔴 נעילת-המסד לשער הלחיצה-הכפולה (מיגרציה H1): לכל היותר ריצה אחת ב-'running' בכל רגע.
--    שער-התוכנה בפונקציית-הקצה הוא קריאה-ואז-כתיבה בלי נעילה ⇒ שתי לחיצות באותן מאות-מילישניות
--    היו פותחות שתי ריצות ושורפות מכסה. ההכנסה השנייה נופלת עכשיו ב-23505.
create unique index feedback_ai_runs_one_running_idx on feedback_ai_runs using btree ((true))
  where (status = 'running'::text);

-- טריגרים
create trigger feedback_ai_runs_set_updated_at
  before update on feedback_ai_runs
  for each row execute function moddatetime('updated_at');

-- מדיניות RLS (1 — קריאה בלבד; ר' ההערה בראש הסעיף)
create policy feedback_ai_runs_select_by_permission on feedback_ai_runs
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select m.module_id from modules m where m.module_name = 'דו"חות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );
--   → supabase/migrations/20260916043300_module11_a_feedback_ai_tables.sql (הטבלה · המדיניות · ה-RPC)
--   → supabase/migrations/20260916052500_module11_h1_one_running_ai_run.sql (האינדקס החלקי)


-- ============================================================
-- 35. תוצאות סיווג-AI פר-פרויקט — public.feedback_ai_insights (מודול 11)
-- ============================================================
-- 🆕 נוספה 16/09/2026 (מיגרציה A של מודול 11). שורה אחת לכל הערת-לקוח שסווגה.
-- 🔴 **`project_id` הוא UNIQUE** ⇒ סיווג אחד לכל פרויקט, וריצה חוזרת **מחליפה** ולא מצטברת.
--    ⚠️ ולכן סיווג-מחדש אחיד של שורות ישנות מחייב **מחיקה קודם** — `loadCandidates` של פונקציית-הקצה
--    מדלגת על פרויקט שכבר מסווג. (נמדד: 40 שורות של ריצה 5 סווגו בדגם שלא ישמש שוב.)
-- 🔴 **שתי רשימות-נושאים ולא אחת, וזו אינה קוסמטיקה:** הערך 'אחר' קיים בשתי הרשימות ⇒ מערך יחיד
--    לא היה יכול לומר אם 'אחר' היה תלונה או מחמאה — שזה בדיוק מה שדוח 20 קיים בשבילו.
--    שתי רשימות-ה-CHECK הן **העתק-בייט** משתי הרשימות של `projects` (מיגרציה 20260904233000),
--    וזה מה שמאפשר מטריצת-הסכמה אדם↔מודל צד-מול-צד.
-- ⚠️ **הטקסונומיה אינה ניתנת לעדכון ע"י המודל** — היא השפה שהלקוח בוחר ממנה (§4.5 של מדריך מ11).
create table feedback_ai_insights (
  insight_id      bigint      not null generated by default as identity,
  run_id          bigint      not null,
  project_id      integer     not null,
  sentiment       integer,
  negative_topics text[]      not null default '{}'::text[],
  positive_topics text[]      not null default '{}'::text[],
  free_topic      text,
  quote           text,
  red_flag        boolean     not null default false,
  unclassifiable  boolean     not null default false,
  classified_at   timestamptz not null default now(),
  constraint feedback_ai_insights_pkey           primary key (insight_id),
  constraint feedback_ai_insights_project_id_key unique (project_id),
  constraint feedback_ai_insights_run_id_fkey     foreign key (run_id)     references feedback_ai_runs (run_id) on delete cascade,
  constraint feedback_ai_insights_project_id_fkey foreign key (project_id) references projects (project_id)     on delete cascade,
  constraint feedback_ai_insights_sentiment_check check (sentiment >= 1 and sentiment <= 5),
  constraint feedback_ai_insights_negative_topics_check check (negative_topics <@ array['איחור דיילות'::text, 'תפקוד דיילות'::text, 'איכות תגים'::text, 'ניהול לקוי'::text, 'אחר'::text]),
  constraint feedback_ai_insights_positive_topics_check check (positive_topics <@ array['מקצועיות הדיילות'::text, 'עמידה בזמנים'::text, 'איכות תגים וציוד'::text, 'ניהול ותקשורת'::text, 'אחר'::text])
);

alter table feedback_ai_insights enable row level security;

-- הערת-טבלה (comment on table)
-- 'תוצאת-הסיווג של הערת-לקוח אחת, פרויקט אחד לכל היותר (כרטיס ת2). המודל מקבל טקסט וציון בלבד —
--  לא שם-לקוח ולא כסף (§4.5).'

-- הערות-עמודה (comment on column) — התמצית
-- sentiment       — 'סנטימנט 1–5 כפי שהמודל קרא את ההערה. NULL כשלא ניתן לסווג — ולעולם לא 0,
--                    שהוא ציון ולא "לא ידוע".'
-- negative_topics — 'נושאים שליליים מתוך חמש הקטגוריות שכבר במסד. מערך ריק = סווג ולא נמצא נושא.'
-- positive_topics — 'נושאים חיוביים מתוך חמש הקטגוריות שכבר במסד. הערך "אחר" קיים בשתי הרשימות,
--                    ולכן הן שתי עמודות ולא אחת.'
-- free_topic      — 'תג-נושא חופשי אחד (מילה–שתיים) שהמודל מוסיף כשהוא מסווג "אחר", כדי שדף 20
--                    יראה מה "אחר" מכיל. כרטיס ת2, הכרעה 11.'
-- quote           — 'משפט אחד מתוך ההערה, כלשונו — מה שמוצג ליד דגל אדום.'
-- red_flag        — 'ההערה מחייבת מבט אנושי. נספרת במבט-על הלקוחות.'
-- unclassifiable  — 'המודל לא הצליח לסווג (כולל שגיאת-פורמט בהערה בודדת). השורה נשמרת בכוונה —
--                    "לא ניתן לסווג" הוא מידע, ושורה חסרה הייתה נקראת כאילו ההערה לא נשלחה כלל.'

-- אינדקסים
-- feedback_ai_insights_pkey           — unique btree (insight_id) [נוצר ע"י האילוץ]
-- feedback_ai_insights_project_id_key — unique btree (project_id) [נוצר ע"י האילוץ]
create index feedback_ai_insights_run_id_idx on feedback_ai_insights using btree (run_id);

-- טריגרים: אין (שורת-סיווג נכתבת פעם אחת; אין updated_at)

-- מדיניות RLS (1 — קריאה בלבד; הכתיבה היא service role, ר' סעיף 34)
create policy feedback_ai_insights_select_by_permission on feedback_ai_insights
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select m.module_id from modules m where m.module_name = 'דו"חות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );
--   → supabase/migrations/20260916043300_module11_a_feedback_ai_tables.sql


-- ============================================================
-- 24. פונקציות בסכמה public — 68 פונקציות
-- ============================================================
-- 🚫 **הגופים אינם כאן במכוון** (ר' כותרת הקובץ). לכל פונקציה: חתימה · מצב אבטחה · search_path ·
--    למי יש EXECUTE · ומצביע לקובץ המיגרציה שבו הגוף הנוכחי חי.
-- ✏️ **50 ⇒ 67 ב-16/09/2026 19:4X** — 17 פונקציות של מודול 11 (16 דוחות + `approve_feedback_ai_run`).
-- ✏️ **67 ⇒ 68 ב-17/09/2026 10:5X** — מיגרציית J3 הוסיפה את `stamp_recommended_rank_set_at()`
--    (טריגר-החותמת של T9), ואיתה טריגר אחד: **29 ⇒ 30**.
-- 🔴 **המספר הזה נמדד, ואין לגזור אותו מהמספר הקודם.** השאילתה שמחזירה אותו ואת ארבע
--    הספירות האחרות של הכותרת בשורה אחת:
--      select (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
--                where n.nspname='public' and c.relkind='r')                        as base_tables,
--             (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--                where n.nspname='public')                                          as functions,
--             (select count(*) from pg_policies where schemaname in ('public','storage')) as policies,
--             (select count(*) from pg_indexes where schemaname='public')            as indexes,
--             (select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid
--                join pg_namespace n on n.oid=c.relnamespace
--                where n.nspname='public' and not t.tgisinternal)                    as triggers;
--    ⇒ 16/09/2026 19:4X: 38 · 67 · 65 · 77 · 29.
--    ⇒ **17/09/2026 10:5X (אחרי J3, הורצה מחדש ולא נגזרה): 38 · 68 · 65 · 77 · 30.**
-- לכל 67 הפונקציות `search_path = ""` — נמדד ב-`pg_proc.proconfig` 16/09/2026 19:4X: 67 מתוך 67, ערך זהה.
-- ♻️ **שוחזר 16/09/2026 (מודול 11 צעד 1.1):** שורת-הכותרת הזו **וכל בלוק `seed_registry` שמעליה**
--    נמחקו בשוגג במיזוג `77a7e31b` (03/09/2026) — שתי השורות התמזגו לשורה פגומה אחת ו-34 שורות
--    ירדו. המקור לשחזור: `git show 538d781a:docs/schema.sql`, ואז אימות מול הקטלוג החי
--    (הטבלה · 2 אילוצים · 2 אינדקסים · RLS דלוק · 0 policies — כולם קיימים חי כפי שכתוב כאן).
-- ⚠️ `moddatetime` (הטריגר של updated_at) **אינה כאן** — היא יושבת בסכמה `extensions`.
--
-- מקרא: SD = security definer · SI = security invoker · [רשימת התפקידים] = מי קיבל EXECUTE.

-- ── מודול 1 — הרשאות והתחברות ──────────────────────────────
-- current_user_role_id() returns integer
--   SD · stable · [authenticated, service_role]
--   → supabase/migrations/20260702195258_harden_current_user_role_id.sql
-- check_login_lock(p_email text) returns timestamptz
--   SD · sql · [anon, authenticated, service_role]
--   → supabase/migrations/20260703071534_module1_login_attempts_lockout.sql
-- register_failed_login(p_email text) returns timestamptz
--   SD · plpgsql · [anon, authenticated, service_role]
--   → supabase/migrations/20260731155511_round_g_db_hardening.sql
-- reset_login_attempts() returns void
--   SD · sql · [authenticated, service_role]
--   → supabase/migrations/20260703071534_module1_login_attempts_lockout.sql

-- ── מודול 3 — הצעות מחיר ───────────────────────────────────
-- create_quote(p_header jsonb, p_lines jsonb) returns integer
--   SI · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260731155511_round_g_db_hardening.sql
-- replace_quote_lines(p_quote_id integer, p_header jsonb, p_lines jsonb) returns void
--   SI · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260731155511_round_g_db_hardening.sql
-- approve_quote_and_create_project(p_quote_id integer) returns integer
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260826002446_module5_approve_rpc_origin_backfill.sql
-- enforce_quote_in_progress_lock() returns trigger
--   SD · plpgsql · [service_role]
--   🔑 **נכתבה מחדש 03/09/2026 (מרשם-הזריעה):** בלוק-`if` אחד בראשה — מפתח-סשן
--      `regin.seed_bypass` **וגם** הצעה ב-`seed_registry` ⇒ מעבר חופשי; אחרת הגוף המקורי
--      של מ3 ללא שינוי. החתימה זהה; שני הטריגרים (quotes / quote_services) לא נגעו.
--   → supabase/migrations/20260903180958_seed_registry_and_helpers.sql (הגוף הנוכחי)
--   → supabase/migrations/20260723115000_module3_lock_and_conversion_rpc.sql (הגוף המקורי)

-- ── מודול 4 — דיילות ומשמרות ───────────────────────────────
-- enforce_hostess_min_wage() returns trigger
--   SD · plpgsql · [service_role]
--   → supabase/migrations/20260809134237_module4_rls_and_public_rpc.sql
-- sync_assignment_event_date() returns trigger
--   SD · plpgsql · [service_role]
--   → supabase/migrations/20260809124327_module4_one_event_per_day_constraint.sql
-- stamp_recommended_rank_set_at() returns trigger
--   SD · plpgsql · search_path='' · [postgres, service_role]   ← **חדשה (מ11 · J3, 17/09/2026, T9)**
--   מחתימה `assignments.recommended_rank_set_at` ב-`now()` של המסד כשנכתב או משתנה
--   `recommended_rank`; מחיקת-דרג מאפסת גם את החותמת. **הטריגר הוא `before insert or update of`** —
--   הדרג נכתב בהכנסה בלבד, ולכן טריגר-`update` לבדו היה עמודה שלעולם נשארת NULL.
--   → supabase/migrations/20260917105300_module11_j3_money_gate_grants_rank_months.sql
-- sync_assignments_on_project_date_change() returns trigger
--   SD · plpgsql · [service_role]
--   → supabase/migrations/20260809124327_module4_one_event_per_day_constraint.sql
-- get_shift_invite(p_token text) returns jsonb
--   SD · plpgsql · [anon, authenticated, service_role]
--   → supabase/migrations/20260810004500_module4_public_shift_invite_read.sql
-- respond_to_shift_invite(p_token text, p_response text) returns jsonb
--   SD · plpgsql · [anon, authenticated, service_role]
--   → supabase/migrations/20260809134237_module4_rls_and_public_rpc.sql
-- set_project_coordinates(p_project_id integer, p_lat numeric, p_lng numeric) returns boolean
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260809172638_module4_project_coordinates_rpc.sql

-- ── מודול 6 — פרויקטים ─────────────────────────────────────
-- assert_module_permission(p_module text, p_level text[]) returns void
--   SD · plpgsql · [service_role]
--   → supabase/migrations/20260814142440_module6_rpcs_writes.sql
-- recompute_project_status(p_project_id integer) returns void
--   SD · plpgsql · [service_role]
--   → supabase/migrations/20260814141052_module6_status_machine_and_cron.sql
-- trg_recompute_project_status() returns trigger
--   SD · plpgsql · [service_role]
--   → supabase/migrations/20260814141052_module6_status_machine_and_cron.sql
-- list_projects_overview() returns table (project_id integer, event_name text, customer_name text,
--   final_event_date date, final_start_time time, final_end_time time, final_location text,
--   project_status text, required_hostess_count integer, hostesses_confirmed integer,
--   pending_invites integer, assignments_row_count integer, logistics_ready integer,
--   logistics_total integer, cancelled_at timestamptz, cancel_type text, planned_revenue numeric)
--   SD · stable · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260827144459_module8_finance_money_ssot_and_readers.sql
--     ⚠️ **הגוף הנוכחי הוא של מ8, לא של מ6.** מ8 הרחיב את `planned_revenue` כך שיכלול
--     גם Σ שינויי-תכולה (ה2/F16) — אחרת אותו פרויקט מוצג בשני סכומים במ6 ובמ8.
--     המקור המקורי: `20260814142439_module6_rpcs_reads_and_close.sql`.
-- update_project_details(p_project_id integer, p_event_date date, p_location text,
--   p_start_time time, p_end_time time) returns jsonb
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260814142440_module6_rpcs_writes.sql
-- apply_scope_change(p_project_id integer, p_lines jsonb, p_reason text) returns jsonb
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260826002448_module5_scope_change_reset_removal.sql
-- cancel_project(p_project_id integer, p_cancel_type text, p_cancel_reason text) returns jsonb
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260814142440_module6_rpcs_writes.sql
-- close_project_operationally(p_project_id integer, p_actual_hours numeric, p_actual_guests integer,
--   p_report_path text, p_rows jsonb) returns jsonb
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260814142439_module6_rpcs_reads_and_close.sql
-- mark_feedback_survey_sent(p_project_id integer) returns boolean
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260814142439_module6_rpcs_reads_and_close.sql
-- list_project_changes(p_project_id integer) returns table (change_id bigint, change_group_id uuid,
--   change_target text, sku text, color text, delta_qty integer, unit_price_snapshot numeric,
--   unit_cost_snapshot numeric, revenue_delta numeric, money_visible boolean, reason text,
--   performed_by text, created_at timestamptz)
--   SD · stable · plpgsql · [authenticated, service_role] — שדות-הכסף ממוסכים בגוף לפי הרשאת 'הצעות מחיר'
--   → supabase/migrations/20260814152647_module6_project_changes_money_gated_reader.sql

-- ── מודול 5 — לוגיסטיקה ────────────────────────────────────
-- update_logistics_item(p_project_id integer, p_sku text, p_serial_number integer, p_changes jsonb)
--   returns jsonb — {row, project_status}; מפתח-נוכח: item_status · actual_qty · notes ·
--   expected_arrival_date; שער פנימי edit על 'לוגיסטיקה' (㉞); שומר-סטטוס עם חריג ㊴;
--   מילוי-אוטומטי ㉕/㊵ + חתימת actual_arrival_date במעבר ל-ready (㊶)
--   SD · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260826002447_module5_checklist_rpc.sql
-- logistics_upcoming_orders() returns jsonb — {from, to, rows:[{sku,item_name,qty,events,drill_key}]};
--   "להזמין לחודש הקרוב" במסך הלוגיסטיקה; שער 'לוגיסטיקה' view/edit; החישוב ב-m11_upcoming_equipment_orders
--   SD · stable · plpgsql · [authenticated, service_role]
--   → supabase/migrations/20260924081000_module5_upcoming_orders.sql
-- m11_upcoming_equipment_orders(p_to date, p_customer_id integer default null) returns jsonb
--   פנימית (SSOT של "כמה להזמין" — 30 הימים שאחרי p_to, בלי מבוטלים); קוראות: report_m12_equipment · logistics_upcoming_orders
--   INVOKER · stable · sql · [service_role] (אין grant ל-authenticated/anon — נקראת רק מתוך SD של הבעלים)
--   → supabase/migrations/20260924081000_module5_upcoming_orders.sql


-- ── מודול 8 (27/08/2026) ──────────────────────────────────────────────────────
-- finance_project_money(p_project_id integer) returns table (revenue numeric,
--   goods_cost numeric, labor_cost numeric, travel_cost numeric, gross_profit numeric,
--   budget_deviation numeric, planned_hours numeric, paid_shift_count integer,
--   finally_approved_count integer)
--   SD · stable · plpgsql · [service_role]   ← 🔴 **פנימית: אין anon ואין authenticated**
--   → הגוף החי: supabase/migrations/20260906083345_module8_planned_hours_cross_midnight.sql
--     (06/09/2026: שעות-מתוכננות עם גלגול-חצות — קודם 20:00→01:00 נתן ‎-19; H7 לפניו)
--   🔑 **מקור-האמת היחיד של הכסף.** כל מסך של מ8 עובר דרכה, ולכן אי-אפשר ששני מסכים
--      יראו שני רווחים שונים לאותו פרויקט (F16/R1-4). אומתה מול עוגן-היד: #13 ⇒ 3,650.00.
--   🔴 **עודכנה ב-`H7` (01/09/2026) — ואם אתה נוגע בה, זה המוקש:** המשתנה `v_labor`
--      (שעות×תעריף **+ בונוס**) מזין **שלושה** ערכים — `labor_cost` · `gross_profit`
--      (ומשם `final_profit` הקפוא) · ו-`budget_deviation`. הבונוס **שייך** לשניים
--      הראשונים ו**מזהם** את השלישי, כי הצד-המתוכנן חסר איבר-בונוס. ⇒ קיים `v_labor_hours`
--      **נפרד** לצד-הביצוע של הסטייה בלבד. 🚫 **אל תאחד אותם** — גריעת הבונוס מ-`v_labor`
--      מזיזה את הרווח-הגולמי ושוברת את עוגן-הקבלה.
--   → supabase/migrations/20260827144459_module8_finance_money_ssot_and_readers.sql
--   → supabase/migrations/20260901233014_module8_h7_budget_deviation_excludes_bonus.sql
-- get_finance_overview() returns table (22 columns — S1's three tabs)
--   SD · stable · plpgsql · [authenticated, service_role] · gated 'כספים'
--   → supabase/migrations/20260827144459_module8_finance_money_ssot_and_readers.sql
-- get_project_finance_detail(p_project_id integer) returns table (34 columns — S2's balance)
--   SD · stable · plpgsql · [authenticated, service_role] · gated 'כספים'
--   → supabase/migrations/20260827144459_module8_finance_money_ssot_and_readers.sql
--   ✏️ **30 ⇒ 34 (נמדד 16/09/2026).** הגוף הנוכחי מ-`20260904233000_feedback_multi_select_reasons`:
--      נוספו `positive_feedback_reason` ואחריו `negative_feedback_reasons` · `positive_feedback_reasons`
--      (שניהם `text[]`, מוחזרים עטופים ב-`coalesce(..., '{}')` ⇒ לעולם לא NULL בצד-הלקוח).

-- ── מודול 8 · פעולות-הכתיבה (27/08/2026, E2) ────────────────────────
-- 🔴 `set_project_finance_fields` של מ6 **הוסרה** כאן (ה22, אפס אתרי-קריאה).
-- פנימיות — [service_role] בלבד, בלי anon ובלי authenticated:
-- finance_assert_writable(integer) returns text             SD · plpgsql
--   השער המשותף: 'כספים' edit + שער-הסטטוס ה12 + נעילת-`finished` (דפוס ㊙, לא טריגר)
-- finance_freeze_cancelled_profit(integer) returns numeric   SD · plpgsql
--   Q-3: דמי-ביטול − פיצוי-צוות − סחורה **בעלות**. ויתור ⇒ הפסד רשום אמיתי.
-- נקראות מהלקוח — [authenticated, service_role], כולן מגודרות 'כספים':
-- 🔴 **וה"כולן" הזה נכון רק מ-28/08/2026 10:4X.** עד אז `finance_cancellation_fee_proposal`
--    **לא נשאה שער כלל** — היא `security definer`, כל משתמש מחובר יכול היה לקרוא לה,
--    והיא מחזירה `goods_at_cost`. ⇒ **עקיפה של §7.34**, שקובע שעלות-רכש אינה נראית
--    לתפקידים שאינם 'כספים'/מנכ"ל, ושיש לו בדיקת-E2E ייעודית (`e2e/cost-visibility.spec.js`).
--    נסגר ב-`20260828102653_module8_h6_gate_fee_proposal_on_finance_permission`.
--    ⚠️ **הפגם היה מלידתה** (מיגרציה E2, 27/08) ולא נסיגה. **הכותרת הזו תיארה כוונה, לא מצב** —
--    ולכן היא נכתבת כאן עם התאריך שבו הפכה לנכונה. *(נתפס באודיט 28/08 של סוכן בלתי-תלוי,
--    שגם אימת חי: משתמשת בהרשאת-גיוס מקבלת `42501` על אותה קריאה בדיוק.)*
-- finance_cancellation_fee_proposal(integer) returns table (9 cols)   SD · stable
--   ↳ העמודה התשיעית `payout_compensation` נוספה ב-`20260828095633_module8_h5_...`
--     (28/08/2026). ⚠️ ההוספה חייבה `drop function`, וה-ACL אופס בדרך — הוחזר
--     במפורש, ו-`anon` הוסר בנפרד ב-`20260828102433_module8_h5b_...`.
--     ACL בפועל: {postgres, authenticated, service_role} — **בלי `anon`**.
--   ↳ ושער-ההרשאה עצמו נוסף ב-`20260828102653_module8_h6_...` — `assert_module_permission
--     ('כספים', ['edit','view'])`, ראשון בגוף. **אומת אחרי ההחלה משני הכיוונים בדפדפן.**
--   שלושת הרכיבים, **נגזרים ולא נשמרים** (ה28). אומתה: #14 ⇒ 3,508.00 = עוגן-היד.
-- record_invoice_sent(integer, text) returns jsonb           SD · plpgsql
-- record_payment(integer, date) returns jsonb                SD · plpgsql
--   🔴 אצל מבוטל — **זהו רגע הקפאת-הרווח** (Q-4), לא שמירת-הסכום ולא הארכוב.
-- record_feedback(integer, integer, text, text, boolean, text[]) returns jsonb   SD · plpgsql
--   ציון מתחת לסף מחייב סיבה; כתיבה על שורה `completed` מותרת עד הארכוב (B-15).
--   🔴 **הגוף הנוכחי מ-מודול 9 (מיגרציה C), לא מ-E2.** הסף אינו קבוע-בקוד יותר —
--      נקרא מ-`params.סף_שביעות_רצון`; שורה חסרה/לא-מספרית ⇒ `P0001` בעברית
--      הנוקבת בשם הפרמטר. ר' הסעיף האחרון של סעיף 24.
-- record_write_off(integer, text) returns jsonb              SD · plpgsql   ← הפעולה החמישית (B-13)
-- resolve_cancellation_fee(integer, text, numeric, text) returns jsonb   SD · plpgsql
--   bill / waive / write_off. הסטטוס נשאר `cancelled` תמיד (T1).
-- archive_project(integer) returns jsonb                     SD · plpgsql
--   שער כפול → הקפאה → `finished` → `feedback_token = NULL` (B-6) → חותמת. טרנזקציה אחת.
--   🔴 אוכפת `summary_report_url IS NOT NULL` **בעצמה** — האילוץ החי דורש זאת,
--      ובלי האכיפה ארכוב לגיטימי היה נופל על שגיאת-CHECK גולמית (תיקון T1).
--   → כל התשע: supabase/migrations/20260827150049_module8_finance_write_actions.sql

-- ── מודול 2 · N2 — החלפת אנשי-הקשר (02/09/2026) ────────────────
-- replace_customer_contacts(bigint, jsonb) returns table(...)   SD · plpgsql
--   מוחקת-ואז-מכניסה **בטרנזקציה אחת**. מותר כאן ואסור בצד-הלקוח: גוף-פונקציה הוא
--   טרנזקציה, ולכן אין "בין" שסגירת-טאב יכולה לנחות בו (הכרעת-30/07 מתקיימת, לא נעקפת).
--   אוכפת שלושה אינווריאנטים שהמסד לבדו אינו יכול: לפחות איש-קשר אחד · **בדיוק אחד ראשי** ·
--   ולא יותר מאחד. שער: assert_module_permission('לקוחות', ['edit']).
--   ACL בפועל: {postgres, authenticated, service_role} — **בלי `anon`** (נסגר באותה מיגרציה,
--   בגלל מוקש H5→H5b מ-28/08). → supabase/migrations/20260902141451_n2b_replace_customer_contacts_rpc.sql
--   ✏️ **הגוף החי כבר לא משם (נמדד 16/09/2026): הוא מ-**
--      `20260909183000_c01_replace_customer_contacts_feminine_imperative.sql` — **החתימה,
--      ההרשאות וה-RLS לא נגעו**; השינוי היחיד הוא מילה אחת בהודעת ה-`raise` של איש-הקשר
--      הראשי ("סמן" ⇒ "סמני", הכרעת-ישי 09/09/2026 על C-01).

-- ── מודול 8 · דוח-השכר (27/08/2026, E3) ────────────────────────
-- generate_salary_report(date) returns jsonb                 SD · plpgsql · [authenticated]
--   🔑 מנגנון מניעת התשלום-הכפול הוא **החתימה על השורה** (`salary_report_id`),
--      לא בדיקה — ולכן פרויקט שנסגר באיחור עולה מעצמו לדוח הבא (ה15).
--      שני מקורות: עבודה-בפועל + פיצוי-ביטול. נאספות `finally_approved` בלבד (Q-5).
--      פרטי-בנק **מוחזרים לאקסל ואינם נשמרים** (B-4).
--   → supabase/migrations/20260827152840_module8_salary_report_transaction.sql
--     ⚠️ **הגוף הנוכחי מ-**`20260827153725_module8_salary_report_temp_table_fix.sql`
--     (טבלה זמנית שלא נמחקה בין קריאות באותה טרנזקציה — שורה אחת)
-- finalize_salary_report(integer, text, text) returns jsonb  SD · plpgsql · [authenticated]
--   הדוח נשמר גם כשהמייל נכשל (P4) — "נכשל" הוא מצב מוצג עם שליחה-חוזרת.
--   → supabase/migrations/20260827152840_module8_salary_report_transaction.sql

-- ── מודול 8 · הדף הציבורי (27/08/2026, F) ───────────────────────
-- feedback_rate_limit() returns void                        SD · plpgsql · [service_role]
--   15/IP/שעה, דפוס login_rpc_calls. fail-open כשאין כותרת-פרוקסי תקינה (מכוון).
-- mint_feedback_token(integer) returns text                  SD · plpgsql · [authenticated]
--   מגודרת 'פרויקטים' — הקורא הוא מסלול-המייל של מ6. get-or-create; מסרבת רק ל-finished.
-- get_feedback_page(text) returns jsonb                      SD · plpgsql · [anon, authenticated]
-- submit_feedback(text, integer, text, text[], text[]) returns jsonb   SD · plpgsql · [anon, authenticated]
--   ✏️ **החתימה גדלה פעמיים ב-04/09/2026** — תחילה `(text, integer, text, text, text)` ואז
--      `(text, integer, text, text[], text[])`, שהיא החיה. שמות הארגומנטים: `p_token` ·
--      `p_score` · `p_notes` · `p_negative_reasons` · `p_positive_reasons` (שני האחרונים
--      `default '{}'`). הגוף מסנן כל ערך מול הרשימה של הצד שלו, מאפס את הצד השני, וכותב
--      גם את המערך וגם את `[1]` שלו לעמודת-היחיד.
--      → supabase/migrations/20260904230000_feedback_positive_and_negative_reasons.sql
--      → supabase/migrations/20260904233000_feedback_multi_select_reasons.sql (הגוף החי)
--   🔴 שתי הפונקציות היחידות של מ8 שאנונימי קורא להן. תשובת not_found **זהה
--      בייט-בבייט** לטוקן שגוי/ריק/מת — אומת. אין policy ל-anon על אף טבלה.
--   → supabase/migrations/20260827155303_module8_public_feedback_rpc.sql
--   ⚠️ ובאותה מיגרציה: `archive_project` קיבלה שער נוסף — ציון מתחת לסף בלי סיבה חוסם
--      ארכוב (P2). 🔴 **אך הגוף הנוכחי שלה כבר לא משם — הוא ממודול 9 (מיגרציה C).**

-- ── מודול 8 · G (27/08/2026) — נגיעה בפונקציה ממוזגת של מ6 ────────
-- cancel_project(integer, text, text) — **הגוף הנוכחי מ-G, לא מ-מ6.**
--   הדלתא מול הגוף שקדם לה: **שורה אחת** ב-`set` של שחרור-השיבוצים —
--   `released_from_status = a.assignment_status`. בלעדיה נמחק מי הייתה
--   מאושרת-סופית, ופיצוי-§7.16 אינו בר-חישוב (R4-F2).
--   🔑 הוכח אריתמטית: הסרת השורה מהגוף החדש מחזירה md5 זהה לגוף שלפני
--      (`b21ef3d8e53270dce52dcd3134f8b103`, 4,457 תווים).
--   → supabase/migrations/20260827160357_module8_cancel_project_released_status_and_seeds.sql
--     המקור המקורי: 20260814142440_module6_rpcs_writes.sql

-- ── מודול 9 · C (02/09/2026) — הסף יצא מהקוד, ורשימת "מי מתחת לרף" ──
-- 🔑 **שתי פונקציות של מ8 נכתבו מחדש, ואחת נוספה. החתימות לא השתנו** ⇒ הקוד הפרוס
--    ממשיך לעבוד (הערך שנזרע = 3 = המספר שהיה קשיח בגוף).
-- ✅ **ACL בפועל לשלושתן, נמדד 02/09/2026: `{postgres, service_role, authenticated}` —
--    בלי `anon`.** ההענקה נכתבה מפורשות גם לשתי הקיימות (`revoke … from public, anon,
--    authenticated` ואז `grant … to authenticated`), כדי שהמצב יהיה כתוב ולא מוסק.
-- record_feedback(integer, integer, text, text, boolean, text[]) returns jsonb   SD · plpgsql · [authenticated, service_role]
--   ✏️ **הארגומנט השישי `p_reasons text[] default null` נוסף ב-04/09/2026** (מיגרציה
--      `20260904233000_feedback_multi_select_reasons`) — **החתימה השתנתה**, וה-`drop function`
--      של הישנה נכתב באותה מיגרציה. הגוף כותב גם `negative_feedback_reasons` (המערך המנוקה)
--      וגם `negative_feedback_reason` (`[1]` שלו), ומאפס את הצד החיובי כשהציון מתחת לסף.
--   הדלתא מול הגוף שקדם: `p_score < 3` ⇒ `p_score < v_threshold` **בשני המקומות**
--   (השער וה-`case`), וההודעה נושאת מעכשיו את הסף בפועל. הקריאה ל-`params` יושבת
--   **אחרי** מסלול `p_mark_no_response` ואחרי בדיקת 1–5 — סימון "לא ענה לסקר" עובד
--   גם כששורת-הסף חסרה.
-- archive_project(integer) returns jsonb                     SD · plpgsql · [authenticated, service_role]
--   `v_score < 3` ⇒ `v_score < v_threshold`, והקריאה ל-`params` **בתוך**
--   `if v_score is not null` — ארכוב פרויקט בלי ציון לא נוגע בסף כלל.
-- list_hostesses_below_min_wage(p_threshold numeric default null) returns table(hostess_id bigint, full_name text, hourly_rate numeric)
--   (מיגרציה D `20260902230500`: NULL = הרף השמור ב-params · ערך = תצוגה-מקדימה מול הרף המוקלד; הגרסה בלי ארגומנט הוסרה)
--   SD · plpgsql · stable · [authenticated, service_role]   ← **חדשה**
--   🔴 **למה DEFINER ולא שאילתה מהלקוח:** מנהלת-הכספים היא הבעלים של
--      `שכר_מינימום_שעתי` אבל **חסומה על מודול 'דיילות'** — קריאה ישירה הייתה מחזירה
--      ‏`[]` בשקט. השער בגוף: **קודם בעלות** על הפרמטר, ואם לא — `assert_module_permission
--      ('הגדרות מערכת', ['edit'])` שמעלה `42501`.
--   דיילות **פעילות בלבד** (V-10). משלימה את טריגר-מ4 שחוסם שמירה מתחת לרף אך אינו
--   מראה מי כבר מתחתיו (§7.66 · ~~`🚧 מ9 ← מ4`~~ — שולם 03/09/2026).
--   🔴 **מיגרציה E `20260903032212` (אודיט-הסגירה, 03/09/2026) — תקרה ל-`p_threshold`:**
--      ‏D בדקה `p_threshold < 0` בלבד. נמדד חי בהתחזות למנהלת-הכספים: `(999999)` החזיר **26 שורות**
--      *(כל דיילת פעילה, שם + תעריף)* בעוד קריאתה הישירה ל-`hostesses` מחזירה **0** — הפונקציה
--      הייתה ניתנת להטיה משליפת-"מי-מתחת-לרף" לשליפת-הכול. עכשיו: `p_threshold < 0 or > 1000` ⇒ `P0001`.
--      אומת אחרי ההחלה: `(999999)`/`(1001)`/`(-1)` ⇒ `P0001` · `(1000)` מותר · `(40)` ⇒ 2 · `NULL` ⇒ 0
--      *(שניהם ללא שינוי)* · לוגיסטיקה ⇒ `42501` · overload יחיד · ACL ל-`authenticated` בלבד.
--      ⚠️ **ומה שהתקרה אינה עושה, כי הכותרת המקורית טענה יותר:** התעריף הגבוה שנמדד הוא 52 ₪,
--      ולכן **כל ערך בין 53 ל-1000 עדיין מחזיר את כל 26** — התקרה פוסלת קלט אבסורדי, היא אינה
--      מונעת שליפה-מלאה ממי שממילא זכאית לרשימה. סגירה אמיתית דורשת **מנגנון אחר** (תקרת-שורות,
--      או חסם יחסי לערך השמור) — **לא מספר קטן יותר.** רשום כחוב.
--   → C: supabase/migrations/20260902211551_module9_c_threshold_functions_and_min_wage_rpc.sql
--   → D: supabase/migrations/20260902230500_module9_d_min_wage_rpc_threshold_arg.sql
--   → E: supabase/migrations/20260903032212_module9_e_min_wage_rpc_threshold_ceiling.sql

-- ── זריעת נתוני-ההדגמה (מודול 7, 03/09/2026) — ארבע פונקציות, כולן על שורות רשומות בלבד ──
-- 🔐 שער משותף לכולן: `assert_module_permission('הגדרות מערכת', ['edit'])` — מודול-מערכת
--    שאינו ניתן למתן מהמסך ⇒ בפועל מנכ"ל בלבד, בלי לקודד שם-תפקיד.
-- seed_register(p_batch text, p_entity text, p_ids bigint[]) returns integer
--   SD · plpgsql · [authenticated, service_role]   ← **חדשה**
--   רושמת מזהים במרשם (`on conflict do nothing`); מחזירה כמה נרשמו.
-- seed_backdate_quote(p_quote_id integer, p_created_at timestamptz, p_issue_date date, p_estimated_event_date date, p_vat_rate_snapshot numeric default null) returns void
--   SD · plpgsql · [authenticated, service_role]   ← **חדשה**
--   מזיזה תאריכים של הצעה **רשומה** אחרי אישור/דחייה (מפתח-הסשן פותח את הנעילה לשורה זו בלבד).
--   ⚠️ `updated_at` נשאר now() — `moddatetime` דורס; מגבלה מוצהרת ("פג בקרוב" אינו ניתן לזריעה).
-- seed_backdate_project(p_project_id integer, p_created_at timestamptz default null, p_final_event_date date default null, p_cancelled_at timestamptz default null, p_operationally_closed_at timestamptz default null, p_invoice_sent_at timestamptz default null, p_archived_at timestamptz default null) returns text
--   SD · plpgsql · [authenticated, service_role]   ← **חדשה**
--   מזיזה חותמות של פרויקט **רשום** (`archived_at` ב-`project_finance`), ואז מחילה עליו בלבד את
--   כלל ה-cron `module6-event-finished`. מחזירה את הסטטוס אחרי ההזזה.
-- seed_reset(p_batch text) returns jsonb
--   SD · plpgsql · [authenticated, service_role]   ← **חדשה**
--   מוחקת אצווה רשומה בסדר ה-FK: project_finance → projects (cascade) → quotes (cascade)
--   → customers (cascade) → hostesses (cascade) → שורות-המרשם. FK-restrict שלא כוסה מפיל בקול.
--   → supabase/migrations/20260903180958_seed_registry_and_helpers.sql

-- ── מודול 7 · מסך הבית (03/09/2026) ────────────────────────────────────
-- get_dashboard_summary(p_month date default null) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** (ACL נמדד: בלי `anon`)
--   השער בכניסה: `assert_module_permission('פרויקטים', edit/view)` — כל חמשת התפקידים (§7.10:
--   המסך לכולם, אין שורת-מודול "מסך הבית"). **המיסוך (§7.97) בגוף, פר-שדה** — אותו predicate של
--   `project_finance_select_by_permission` ('כספים') ו-`quotes_select_by_permission` ('הצעות מחיר');
--   שדה חסום = NULL (לא 0) + דגל `profit_visible` / `quotes_visible`. **אין policy חדשה.**
--   מחזירה בקריאה אחת: 4 KPI (`active_projects_count` · `satisfaction_avg` 90-יום · `monthly_profit`
--   §7.96 · `pending_quotes_count`) · `projects` (חודש-היעד + כל הסטטוסים הפתוחים, **דרך
--   `list_projects_overview()`** — אותן ספירות-איוש/לוגיסטיקה כמו מסך-הפרויקטים) · `pending_quotes` ·
--   `params` (שלושת הספים). צבע-הלוח נגזר בלקוח (`src/lib/dashboard.js`), לא כאן — כלל 14.
--   אומת אחרי ההחלה בהתחזות ל-5 התפקידים: מנכ"ל/כספים רואות רווח · פרויקטים רואה הצעות ולא רווח ·
--   גיוס/לוגיסטיקה לא רואות שניהם · מייל לא-קיים ⇒ `42501` · הספירות תאמו ספירת-יד (4 · 6 · 5.00).
--   ↳ **תיקון-קדימה 03/09/2026 18:5X (הכרעות-ישי):** מבוטל **נשאר** בשורות-הלוח (הלקוח מצייר אותו
--     אפור-מחוק, כמו Monday) · מבוטל שדמי-הביטול שלו לא נפתרו תורם **0** ל-`monthly_profit` (עקיפת
--     §7.96 כלשונו, אחרי שנמדד #15 ⇒ 3,635 ₪ לאירוע שלא יתקיים). הגוף החי = הקובץ השני.
--   → supabase/migrations/20260903182735_module7_dashboard_summary_rpc.sql (המקור + הכותרת המלאה)
--   → supabase/migrations/20260903184711_module7_dashboard_cancelled_on_calendar_and_profit.sql (הגוף החי)

-- ── מודול 11 · דו"חות מנהלים (16/09/2026) — 17 פונקציות ──────────────────
-- 16 פונקציות-קריאה, אחת לכל משטח בנוי, + פונקציית-כתיבה אחת.
-- 🔑 **דפוס אחיד לכל ה-16, ושלושת חלקיו נבדקים יחד ולא לחוד:**
--    ‏(1) חתימה: `(p_from date default null, p_to date default null, p_customer_id integer default null,
--        p_drill jsonb default null) returns jsonb` — ‏`null` בתאריכים = חלון-ברירת-המחדל של הכרטיס,
--        מחושב **בשעון ישראל**. ‏`p_drill` הוא מה שהופך דוח-קידוח לפונקציה אחת ולא לשלוש.
--    ‏(2) ‏`security definer` · `stable` · `set search_path to ''` · כל רלציה מוסמכת `public.`.
--    ‏(3) ‏המשפט הראשון בגוף הוא `assert_module_permission('<המודול הבעלים>', array['edit','view'])`,
--        ואחריו `revoke execute … from public, anon, authenticated` ואז `grant execute … to authenticated`.
-- 🔴 **והשער הוא של המודול שמחזיק את הדאטה, לא של 'דו"חות'** (הכרעה 2): לשוניות הנהלה+כספים ⇐
--    ‏'כספים' · דיילות ⇐ 'דיילות' · לקוחות ⇐ 'לקוחות'. ‏**'דו"חות' שומר על המסלול ועל שתי טבלאות-ה-AI בלבד.**
--    ⇒ מנהלת-לוגיסטיקה שחסומה ב-'כספים' רואה לשונית ממוסכת, וזו ההתנהגות הנכונה ולא באג.
-- ⚠️ **שתי חריגות-חתימה, שתיהן מכוונות:** ‏`report_m07_finance_overview` ו-`report_m09_aging` נושאות
--    פרמטר חמישי `p_asof date default null` — **לשחזור אורקל-הקבלה בלבד; הלקוח אינו שולח אותו.**
--    השינוי נעשה במיגרציה E2 אחרי שנמדד ש-`origin/main` ו-`origin/dev` אינם מכירים את הפונקציות כלל.
-- 📐 **מטען-התשובה** (`population` · `window` · `tiles` · `chart` · `columns` · `rows` · `so_what` ·
--    `definitions` · `drill` · `meta`) נעול ב-`docs/micro_guides/module-11.md` §2ב C8 — **שם, לא כאן.**
-- 🔴 **הערת-הפונקציה של כל אחת מה-16 היא הצהרת-האוכלוסייה שלה** (📐2) — מי בפנים, מי בחוץ, ואיזה
--    חלון. זה הטקסט שמופיע גם על המסך, ולכן `comment on function` כאן אינו נוי אלא חוזה.
-- ✏️ **23/09/2026 — מיגרציית-הטקסט L1 הוחלה** (`supabase/migrations/20260923180000_module11_l1_report_copy.sql`;
--    במסד **שלוש** שורות — `module11_l1_report_copy_p1of3`…`p3of3` — כי הקובץ נשלח בשלושה חלקים רצופים).
--    ⇒ **לכל 13 הפונקציות פרט ל-m03/m04/m06, "הגוף החי" = הקובץ שבשורת "הגוף החי" למטה + החלפות-הטקסט של L1.**
--    חתימות · ACL · הערות-פונקציה — ללא שינוי (נמדד: 16 פונקציות, 0 כפילויות, proacl זהה).
--    חדש במטען: `population.summary` (שבב-ההיקף) בכל 13 · `drill_key` בדאטום-הגרף של m09 ·
--    `meta.period_filter_ignored` ב-m15 · m20 = 2 גרפים · m22 = 3 אריחים.
-- ✏️ **23/09/2026 — וסבב-הטקסט השני L2 הוחל** (`supabase/migrations/20260923200000_module11_l2_tile_copy.sql`, שורה אחת
--    במסד): תת-שורות אריחים ב-m07 · m14 · m15 · m16 · m17 · m19 · m20 · m22. ⇒ **"הגוף החי" של שמונתן = … + L1 + L2.**
--    חתימות · ACL · הערות — ללא שינוי (נמדד). מצב-הגוף המדויק ניתן לשחזור: `phase-b-migration/bodies.mjs` + `expect-md5.mjs`.
-- ✏️ **23/09/2026 — ו-L3 (`…210000_module11_l3_compare_notes.sql`: m08 · m14 · m17) ו-L4 (`…220000_module11_l4_frozen_note.sql`:
--    m08) הוחלו.** ⇒ הגוף החי = … + L1 + L2 + L3 + L4 (`bodies.mjs` postL4). חתימות · ACL — ללא שינוי.
-- report_m02_exec_overview(p_from date, p_to date, p_customer_id integer, p_drill jsonb, p_page integer, p_page_size integer) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'כספים'
--   → supabase/migrations/20260916052600_module11_d_rpcs_executive.sql (המקור)
--   → supabase/migrations/20260916083000_module11_d2_rpcs_executive_fixes.sql (סבב קודם)
--   → supabase/migrations/20260917021500_module11_j2_rpc_round5.sql (סבב 5 — חצאי-ההשוואה = 'אשתקד')
--   → supabase/migrations/20260917105300_module11_j3_money_gate_grants_rank_months.sql (J3 — תוויות-החודשים מקוצרות)
--   → supabase/migrations/20260917150000_module11_k1_pagination_params.sql (הגוף החי, K1 — p_page/p_page_size + drop-before-create + ACL/comment משוחזרים)
-- report_m03_trends(p_from date, p_to date, p_customer_id integer, p_drill jsonb) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'כספים' · **דוח-קידוח** (שנה←חודש←אירוע)
--   → supabase/migrations/20260916052600_module11_d_rpcs_executive.sql (המקור)
--   → supabase/migrations/20260916114500_module11_i1_rpc_formats_and_notes.sql (פורמטים ויחידות, סבב 2)
--   → supabase/migrations/20260916194500_module11_i2_rpc_round3.sql (סבב 3)
--   → supabase/migrations/20260917105300_module11_j3_money_gate_grants_rank_months.sql (הגוף החי, J3 — תוויות-החודשים מקוצרות)
-- report_m04_discounts(p_from date, p_to date, p_customer_id integer, p_drill jsonb, p_page integer, p_page_size integer) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'כספים'
--   → supabase/migrations/20260916083000_module11_d2_rpcs_executive_fixes.sql (סבב קודם)
--   → supabase/migrations/20260917021500_module11_j2_rpc_round5.sql (סבב 5 — חצאי-ההשוואה + מקרא-הגרף = 'אשתקד' · `quote_id` ב-`format:'id'`)
--   → supabase/migrations/20260917150000_module11_k1_pagination_params.sql (הגוף החי, K1 — p_page/p_page_size · drop-before-create · ACL/comment משוחזרים)
-- report_m06_staffing(p_from date, p_to date, p_customer_id integer, p_drill jsonb, p_page integer, p_page_size integer) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'כספים'
--   → supabase/migrations/20260916083000_module11_d2_rpcs_executive_fixes.sql (סבב קודם)
--   → supabase/migrations/20260917021500_module11_j2_rpc_round5.sql (סבב 5 — חצאי-ההשוואה = 'אשתקד')
--   → supabase/migrations/20260917150000_module11_k1_pagination_params.sql (הגוף החי, K1 — p_page/p_page_size · drop-before-create · ACL/comment משוחזרים)
-- report_m07_finance_overview(p_from date, p_to date, p_customer_id integer, p_drill jsonb, p_asof date, p_page integer, p_page_size integer) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'כספים' · **חתימה בת 5**
--   → supabase/migrations/20260916051950_module11_e_rpcs_finance.sql (המקור)
--   → supabase/migrations/20260916114500_module11_i1_rpc_formats_and_notes.sql (סבב קודם)
--   → supabase/migrations/20260917021500_module11_j2_rpc_round5.sql (סבב 5 — `project_id` ב-`format:'id'` · ציר-החודשים עברי (`xKey='label'`, המפתח `month` נשמר))
--   → supabase/migrations/20260917105300_module11_j3_money_gate_grants_rank_months.sql (J3 — תוויות-החודשים מקוצרות)
--   → supabase/migrations/20260917150000_module11_k1_pagination_params.sql (הגוף החי, K1 — פרמטר שישי p_page + שביעי p_page_size + row_total חדש (=open_invoice_count))
-- report_m08_profitability(p_from date, p_to date, p_customer_id integer, p_drill jsonb) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'כספים'
--   🔴 **רצפת-המהותיות מוצאת את השורות מ-`rows`** (📑ב#5 — *"אינו בדירוג"*), ולא רק ממיינת
--      אותן לסוף. ‏`meta.below_materiality` ממשיך למנות אותן על כל האוכלוסייה.
--   → supabase/migrations/20260916114500_module11_i1_rpc_formats_and_notes.sql (פורמטים ויחידות, סבב 2)
--   → supabase/migrations/20260917005500_module11_j1_rpc_round4.sql (סבב 4)
--   → supabase/migrations/20260917021500_module11_j2_rpc_round5.sql (הגוף החי, סבב 5 — חצאי-ההשוואה = 'אשתקד' · `project_id` ב-`format:'id'`)
-- report_m09_aging(p_from date, p_to date, p_customer_id integer, p_drill jsonb, p_asof date) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'כספים' · **דוח-קידוח** · **חתימה בת 5**
--   🔴 ימי-האיחור נמדדים מול **מועד-הפירעון** (`invoice_sent_at` + `תנאי_תשלום_ימים`), לא מול יום-השליחה.
--   → supabase/migrations/20260916114500_module11_i1_rpc_formats_and_notes.sql (פורמטים ויחידות, סבב 2)
--   → supabase/migrations/20260916194500_module11_i2_rpc_round3.sql (סבב 3)
--   → supabase/migrations/20260917005500_module11_j1_rpc_round4.sql (סבב 4)
--   → supabase/migrations/20260917021500_module11_j2_rpc_round5.sql (הגוף החי, סבב 5 — `project_id` ב-`format:'id'` (שתי הרמות) · פסקת-הגרף עוברת ל-'מדרג' (אין 'דלי' על המסך))
-- report_m12_equipment(p_from date, p_to date, p_customer_id integer, p_drill jsonb) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'כספים'
--   → supabase/migrations/20260916114500_module11_i1_rpc_formats_and_notes.sql (סבב קודם)
--   → supabase/migrations/20260917021500_module11_j2_rpc_round5.sql (סבב 5 — חצאי-ההשוואה = 'אשתקד' · `project_id` ב-`format:'id'` (ב-`meta.extra_tables`))
--   → supabase/migrations/20260924080000_module11_m3_walkthrough_fixes.sql (ⓘ-התקופה = תאריכים)
--   → supabase/migrations/20260924081000_module5_upcoming_orders.sql (הגוף החי — טבלת-ההזמנה קוראת ל-m11_upcoming_equipment_orders)
-- report_m14_hostess_overview(p_from date, p_to date, p_customer_id integer, p_drill jsonb) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'דיילות'
--   → supabase/migrations/20260916052359_module11_f_rpcs_hostesses.sql (המקור)
--   → supabase/migrations/20260916114500_module11_i1_rpc_formats_and_notes.sql (פורמטים ויחידות, סבב 2)
--   → supabase/migrations/20260916194500_module11_i2_rpc_round3.sql (סבב 3)
--   → supabase/migrations/20260917005500_module11_j1_rpc_round4.sql (סבב 4)
--   → supabase/migrations/20260917021500_module11_j2_rpc_round5.sql (סבב 5 — חצאי-ההשוואה = 'אשתקד' · 'חלון קבוע' במקום 'קפוא' · ציר-החודשים עברי)
--   → supabase/migrations/20260917105300_module11_j3_money_gate_grants_rank_months.sql (הגוף החי, J3 — תוויות-החודשים מקוצרות)
-- report_m15_reliability(p_from date, p_to date, p_customer_id integer, p_drill jsonb) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'דיילות'
--   הציון הוא `reliabilityScore` של Smart Match מילה-במילה (הכרעה 38); הספים 0.87/0.95 נקראים מ-`params`.
--   → supabase/migrations/20260916114500_module11_i1_rpc_formats_and_notes.sql (פורמטים ויחידות, סבב 2)
--   → supabase/migrations/20260916194500_module11_i2_rpc_round3.sql (סבב 3)
--   → supabase/migrations/20260917005500_module11_j1_rpc_round4.sql (סבב 4)
--   → supabase/migrations/20260917021500_module11_j2_rpc_round5.sql (הגוף החי, סבב 5 — חצאי-ההשוואה = 'אשתקד' · 'חלון קבוע' במקום 'קפוא' (תווית-החלון · ארבעה אריחים · ההגדרות))
-- report_m16_quality_cost(p_from date, p_to date, p_customer_id integer, p_drill jsonb) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'דיילות'
--   → supabase/migrations/20260916114500_module11_i1_rpc_formats_and_notes.sql (פורמטים ויחידות, סבב 2)
--   → supabase/migrations/20260917005500_module11_j1_rpc_round4.sql (הגוף החי, סבב 4)
-- report_m17_fairness(p_from date, p_to date, p_customer_id integer, p_drill jsonb) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'דיילות'
--   → supabase/migrations/20260916065642_module11_f2_rpcs_hostesses_fixes.sql (המקור)
--   → supabase/migrations/20260916114500_module11_i1_rpc_formats_and_notes.sql (פורמטים ויחידות, סבב 2)
--   → supabase/migrations/20260916194500_module11_i2_rpc_round3.sql (סבב 3)
--   → supabase/migrations/20260917021500_module11_j2_rpc_round5.sql (הגוף החי, סבב 5 — חצאי-ההשוואה = 'אשתקד')
-- report_m19_customers_overview(p_from date, p_to date, p_customer_id integer, p_drill jsonb, p_page integer, p_page_size integer) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'לקוחות'
--   🔒 **§7.100 (17/09/2026) — שער-כסף שני, בתוך הגוף ולא בלשונית:** קוראת שאין לה `view`/`edit`
--      על **'כספים'** מקבלת `rows[].revenue_12m = null` ו-`tiles[concentration_vs_drifting].detail`
--      בלי `top5_revenue`/`total_revenue`/`first_drifting.revenue`, ‏+ `meta.money_masked = true`.
--      שער 'לקוחות' עצמו לא זז (42501 למי שחסומה עליו). התת-שאילתה זהה לזו של
--      `get_dashboard_summary` — ‏`assert_module_permission` מעלה שגיאה ולכן אינה משמשת כאן.
--   → supabase/migrations/20260916052511_module11_g_rpcs_customers.sql (המקור)
--   → supabase/migrations/20260916114500_module11_i1_rpc_formats_and_notes.sql (פורמטים ויחידות, סבב 2)
--   → supabase/migrations/20260916194500_module11_i2_rpc_round3.sql (סבב 3)
--   → supabase/migrations/20260917021500_module11_j2_rpc_round5.sql (סבב 5 — תווית-החודש נושאת שנה רק כשהציר חוצה שנה קלנדרית)
--   → supabase/migrations/20260917105300_module11_j3_money_gate_grants_rank_months.sql (J3 — מיסוך-הכסף + תוויות-החודשים מקוצרות)
--   → supabase/migrations/20260917150000_module11_k1_pagination_params.sql (הגוף החי, K1 — p_page/p_page_size · row_total חדש (52, לקוחות עם הכנסה ב-12 החודשים — לא 61 שהוא כלל-הלקוחות) · ACL/comment משוחזרים)
-- report_m20_satisfaction(p_from date, p_to date, p_customer_id integer, p_drill jsonb) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'לקוחות'
--   → supabase/migrations/20260916114500_module11_i1_rpc_formats_and_notes.sql (פורמטים ויחידות, סבב 2)
--   → supabase/migrations/20260916194500_module11_i2_rpc_round3.sql (סבב 3)
--   → supabase/migrations/20260917005500_module11_j1_rpc_round4.sql (סבב 4)
--   → supabase/migrations/20260917021500_module11_j2_rpc_round5.sql (הגוף החי, סבב 5 — חצאי-ההשוואה = 'אשתקד' (המכנה נשמר בסוגריים))
-- report_m21_drifting(p_from date, p_to date, p_customer_id integer, p_drill jsonb) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'לקוחות'
--   🔒 **§7.100 (17/09/2026) — ר' מ19.** כאן ארבעה מקומות: אריח `marked_revenue_12m` (ערך · `sub` ·
--      `detail`) · `only_personal_cadence.sub` ו-`detail.revenue` · `rows[].revenue_12m` ·
--      **שורת-"אז מה"**, שבה הסכום מוחלף ב-*"(לא זמין בתפקידך)"* דרך אותה תבנית-רג'קס של
--      `MONEY_RUN` בלשונית. משפט-המדיניות ב-`meta.notes` (‏`₪` בלי ספרות) נשאר על המסך.
--   → supabase/migrations/20260916114500_module11_i1_rpc_formats_and_notes.sql (פורמטים ויחידות, סבב 2)
--   → supabase/migrations/20260916194500_module11_i2_rpc_round3.sql (סבב 3)
--   → supabase/migrations/20260917005500_module11_j1_rpc_round4.sql (סבב 4)
--   → supabase/migrations/20260917105300_module11_j3_money_gate_grants_rank_months.sql (הגוף החי, J3 — מיסוך-הכסף)
-- report_m22_notes(p_from date, p_to date, p_customer_id integer, p_drill jsonb) returns jsonb
--   SD · stable · plpgsql · [authenticated, service_role]   ← **חדשה** · שער 'לקוחות'
--   בלי ריצת-סיווג מאושרת: `rows` ריק · `meta.run` ריק · `meta.export_blocked_reason` נעול ·
--   אריח הדגלים האדומים מחזיר `null` **ולא 0** — "אין נתון" אינו "אפס".
--   → supabase/migrations/20260916114500_module11_i1_rpc_formats_and_notes.sql (פורמטים ויחידות, סבב 2)
--   → supabase/migrations/20260916194500_module11_i2_rpc_round3.sql (סבב 3)
--   → supabase/migrations/20260917005500_module11_j1_rpc_round4.sql (סבב 4 — `meta.run.approved_by` נושא שם-אדם, הדוא"ל ב-`approved_by_email`)
--   → supabase/migrations/20260917021500_module11_j2_rpc_round5.sql (הגוף החי, סבב 5 — `window.from = null` + `meta.period_filter_ignored` — הדף מפסיק להדהד תקופה שאינו שואל בה)
-- approve_feedback_ai_run(p_run_id bigint) returns jsonb
--   SD · **volatile** · plpgsql · [authenticated, service_role]   ← **חדשה** · שער **edit** על 'דו"חות'
--   🔴 **פונקציית-הכתיבה היחידה של מודול 11.** מסרבת לריצה ב-`running`, לריצה `failed` ולאישור שני
--   (`P0001 "ריצת-הניתוח כבר אושרה להצגה."`), ומאשרת `partial`. אומתה חי: מנכ"ל ✅ · גיוס `42501`.
--   → supabase/migrations/20260916043300_module11_a_feedback_ai_tables.sql
-- ✅ **`20260916194500_module11_i2_rpc_round3.sql` — הוחל במלואו 16/09/2026 (נמדד 20:4X).**
--    **תשע רשומות רשם, לפי סדר ההחלה:** `module11_i2_m17` · `_m21` · `_m20` · `_m22` · `_m14` ·
--    `_m15` · `_m19` · `_m03` · `_m09` *(האחרונה, גרסה `20260916171421`)*.
--    ⇒ **תשע הפונקציות שלמעלה נשאו שני מצביעים:** ‏I1 כמקור-הביניים (סבב 2) ו-I2 כגוף החי.
--    ⚠️ **המשפט הזה נכון ל-16/09 בלבד, וסבבי J1/J2 שמתחתיו עידנו אותו** —
--    המצביע הקובע הוא **השורה האחרונה של כל פונקציה למעלה**, ולא הסיכום הזה.
-- 🔑 **וההוכחה שהקובץ הוא באמת מה שרץ, כי "הוחל" לבדו אינו מוכיח זאת בקובץ שמוחל בחלקים:**
--    ‏`md5(prosrc)` החי הושווה ל-md5 של גוף ה-`$function$` שבקובץ — **9 מתוך 9 זהים** *(ובנוסף:
--    חתימה · `comment on function` · `revoke` · `grant` זהים-בייט ל-I1, 9/9)*. המקור:
--    ‏`<scratchpad>/results/p2-fixB2.json`, מפתח `gates.md5_after_apply`.
--    *(בין 19:4X ל-20:1X הקובץ היה באמצע ההחלה — 8 מתוך 9, בלי `_m09` — ולכן הסעיף הזה נשא
--     "טעון בדיקה" עד שנמדד שוב.)*
-- 🔴 **ואל תצטט את השורות האלה לסבב הבא — הרץ את הבדיקה:**
--      select name from supabase_migrations.schema_migrations where name like 'module11_i2%' order by version;
-- ✅ **`20260917021500_module11_j2_rpc_round5.sql` — הוחל במלואו 17/09/2026.**
--    **שלוש-עשרה רשומות רשם, לפי סדר ההחלה:** `module11_j2_m02` · `_m04` · `_m06` ·
--    `_m07` · `_m08` · `_m09` · `_m12` · `_m14` · `_m15` · `_m17` · `_m19` · `_m20` · `_m22`.
--    **שלוש שלא זזו:** `m03` · `m16` · `m21` — והנימוק לכל אחת כתוב בכותרת המיגרציה
--    (בסיס-ההשוואה שלהן אינו "אותו טווח שנה אחורה": שנה נקובה · חציון · חודש קודם).
-- 🔑 **וההוכחה:** ‏`md5(prosrc)` החי הושווה ל-md5 של גוף ה-`$function$` שבקובץ — **13 מתוך 13
--    זהים**, ו-`proacl` של כל שש-עשרה נשאר `postgres=X | service_role=X | authenticated=X` (אין PUBLIC, אין anon).
-- 🔴 **ואל תצטט גם את אלה — הרץ:**
--      select name from supabase_migrations.schema_migrations where name like 'module11_j2%' order by version;

-- ============================================================
-- 25. עבודות מתוזמנות — cron.job (3 עבודות, כולן active)
-- ============================================================
-- הגוף המלא של כל עבודה חי במיגרציה, כמו גופי הפונקציות.
--
-- module3-quote-expiry           · '0 1 * * *'  · פוסלת הצעות in_progress שעברו את ימי-התוקף
--   → supabase/migrations/20260731085335_module3_vat_and_expiry_param_guards.sql
-- module1-login-attempts-cleanup · '30 1 * * *' · מוחקת רשומות login_attempts ישנות מ-30 יום
--   → supabase/migrations/20260723120500_module3_pg_cron_expiry_and_cleanup.sql
-- module6-event-finished         · '0 2 * * *'  · מעבירה פרויקטים שתאריכם עבר ל-event_finished
--   → supabase/migrations/20260814141052_module6_status_machine_and_cron.sql


-- ============================================================
-- 26. אחסון — storage.buckets (3 דליים) ו-storage.objects (12 policies)
-- ============================================================
-- דלי       · public · תקרת-גודל  · סוגי-קובץ מותרים
-- marketing · true   · 10485760 B · application/pdf, image/jpeg, image/png
-- finance   · false  · 10485760 B · application/pdf, image/jpeg, image/png,
--                                  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
--            ↳ סוג-האקסל נוסף ב-`20260827221902_module8_h1_finance_bucket_allow_xlsx` (הוחלה 28/08/2026
--              אחרי הקלדת-ישי). בלעדיו קובץ דוח-השכר לא היה ניתן לאחסון כלל.
-- reports   · false  ·  2097152 B · application/pdf, image/jpeg, image/png

-- 12 policies על storage.objects — ארבע לכל דלי (select/insert/update/delete), כולן
-- to authenticated, וכולן מסננות לפי bucket_id + מטריצת ההרשאות של המודול הבעלים.

-- ── marketing (מודול 'לקוחות') ──────────────────────────────
create policy marketing_read_by_permission on storage.objects
  for select to authenticated
  using (
    bucket_id = 'marketing'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy marketing_insert_by_permission on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'marketing'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  );

create policy marketing_update_by_permission on storage.objects
  for update to authenticated
  using (
    bucket_id = 'marketing'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    bucket_id = 'marketing'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  );

create policy marketing_delete_by_permission on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'marketing'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'לקוחות')
        and p.permission_level = 'edit'
    )
  );

-- ── finance (מודול 'כספים') ─────────────────────────────────
create policy finance_read_by_permission on storage.objects
  for select to authenticated
  using (
    bucket_id = 'finance'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy finance_insert_by_permission on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'finance'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = 'edit'
    )
  );

create policy finance_update_by_permission on storage.objects
  for update to authenticated
  using (
    bucket_id = 'finance'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = 'edit'
    )
  )
  with check (
    bucket_id = 'finance'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = 'edit'
    )
  );

create policy finance_delete_by_permission on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'finance'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'כספים')
        and p.permission_level = 'edit'
    )
  );

-- ── reports (מודול 'פרויקטים') ──────────────────────────────
create policy reports_read_by_permission on storage.objects
  for select to authenticated
  using (
    bucket_id = 'reports'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
        and p.permission_level = any (array['edit'::text, 'view'::text])
    )
  );

create policy reports_insert_by_permission on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'reports'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
        and p.permission_level = 'edit'
    )
  );

create policy reports_update_by_permission on storage.objects
  for update to authenticated
  using (
    bucket_id = 'reports'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
        and p.permission_level = 'edit'
    )
  )
  with check (
    bucket_id = 'reports'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
        and p.permission_level = 'edit'
    )
  );

create policy reports_delete_by_permission on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'reports'::text
    and exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'פרויקטים')
        and p.permission_level = 'edit'
    )
  );
