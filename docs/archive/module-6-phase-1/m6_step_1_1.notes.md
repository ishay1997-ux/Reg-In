<div dir="rtl">

# צעד 1.1 — מיגרציה A · הערות נלוות
**נכתב 14/08/2026 11:50 · כל המדידות רצו מול המסד החי `yfeovxppnfoafmfbdfvh` באותו תור.**
**קובץ ה-SQL:** `m6_step_1_1.sql` · **שם-קובץ מוצע למיגרציה:** `<ts>_module6_projects_columns_and_constraints.sql`

---

## מה זה עושה

טבלת `projects` מקבלת חמש עמודות חדשות שהמודול צריך כדי לזכור **מתי ומי** ביטל פרויקט ו**מתי ומי**
סגר אותו תפעולית, ועוד עמודה שאומרת **מאיזה סוג** היה הביטול (לקוח · כוח עליון · אחר) — שלושה ערכים,
כפי שהכרעת ב-13/08. בנוסף נוספים שני "שומרים" שהמסד יאכוף לבד: אחד מוודא שסיבת-משוב-שלילי היא אחת
מחמש הסיבות המוכרות ולא טקסט חופשי, והשני מוודא שפרויקט לא יכול להגיע למצב-סגירה בלי קובץ דוח-סיכום.
העמודה `project_bonus` — שמעולם לא היה לה מקור ולא היה לה קורא — נמחקת. ולבסוף, שתי עמודות שהיו
"רשות" הופכות ל"חובה": מספר הצעת-המחיר ואימייל מנהל-האירוע, כך שאי-אפשר יותר ליצור פרויקט בלעדיהם.

## הפיכוּת

- **הפיך במלואו:** חמש העמודות החדשות (`drop column`) · שלושת ה-CHECKים ושתי ה-FK
  (`drop constraint`) · שני האינדקסים (`drop index`) · שני ההידוקים (`alter column … drop not null`).
- 🔴 **בלתי-הפיך:** `alter table public.projects drop column project_bonus` — **הנתונים נמחקים.**
  מה שהופך אותו לבטוח כאן: כל ארבע השורות החיות מחזיקות `0` (`אומת-על-ידי`, פעמיים, למטה) ⇒ אין מה
  לאבד. ⛔ **ולכן הוספתי בלוק-שומר לפני המשפט הזה** שסופר בזמן ההחלה עצמה ומפיל את המיגרציה כולה
  בשגיאה עברית אם ולו שורה אחת אינה `0`. מדידה שרצה לפני עשר דקות אינה ערובה; השומר כן.
- **הערה על החלה:** שער ה-typed-echo נמחל לפזה 1 (`14/08/2026 11:2X`, במילותיו: *"חד פעמי שאני לא
  חייב להדביק לך את שם המיגרציה"*) — **אבל אישור בעל-פה אחרי הסבר בעברית עדיין נדרש**, וכל ארבעת
  הצעדים שאחרי ההחלה (אימות בקריאה · רענון `docs/schema.sql` · עדכון `db_roadmap` · קומיט בפאת'ספק)
  לא נמחלו.

## מה מדדתי

כל השאילתות רצו דרך `execute_sql` (קריאה בלבד) על `yfeovxppnfoafmfbdfvh`, ‏`14/08/2026 11:4X–11:50`.

| # | מה נבדק | השאילתה | מה חזר | תג |
|:-:|---|---|---|---|
| 1 | מבנה `projects` | `information_schema.columns … table_name='projects'` | **29 עמודות.** ‏`cancelled_at`/`cancelled_by`/`cancel_type`/`operationally_closed_at`/`operationally_closed_by` — **אף אחת לא קיימת.** ‏`project_bonus numeric NOT NULL default 0` **קיימת**. ‏`quote_id integer` ו-`owner_email text` שתיהן `is_nullable=YES` | `אומת-על-ידי` |
| 2 | **חמש ספירות-הקדם** | השאילתה של המדריך, מילה-במילה | `null_quote_id=0` · `null_owner_email=0` · `nonzero_bonus=0` · `bad_feedback_reason=0` · `closed_without_report=0` · `total_rows=4` | `אומת-על-ידי` |
| 3 | **אימות עצמאי שני** של אותן ספירות, הפעם דרך **הפרדיקטים של ה-CHECKים עצמם** (`not (…)`) | ראו למטה | `viol_feedback=0` · `viol_report=0` · `nonzero_bonus_guard=0` · `null_quote_id=0` · `null_owner_email=0` על 4 שורות | `אומת-על-ידי` |
| 4 | האם `users(email)` ייחודית — בלי זה ה-FK לא נוצרת | `pg_constraint … conrelid='public.users'` | **`users_pkey PRIMARY KEY (email)`** ⇒ ייחודית. **ה-FK תיווצר.** | `אומת-על-ידי` |
| 5 | תבנית ה-FK הקיימת ל-`users(email)` | `pg_constraint … confrelid='public.users'` | **FK אחת בלבד בכל המסד:** `projects_owner_email_fkey … ON DELETE RESTRICT` | `אומת-על-ידי` |
| 6 | אילוצים קיימים על `projects` (התנגשות-שמות) | `pg_constraint … conrelid='public.projects'` | 9 אילוצים; **אף אחד** מהשמות שאני יוצר אינו תפוס | `אומת-על-ידי` |
| 7 | אינדקסים קיימים על `projects` | `pg_indexes … tablename='projects'` | `projects_customer_id_idx` · `projects_owner_email_idx` · `projects_pkey` · `projects_quote_id_key` — **כל עמודת-FK נושאת אינדקס, אפס חריגים** | `אומת-על-ידי` |
| 8 | **התנגשות-שמות גלובלית** לחמשת השמות החדשים | `pg_class where relname in (…)` | **ריק** ⇒ כל השמות פנויים | `אומת-על-ידי` |
| 9 | **תלויות ב-`project_bonus`** לפני ההפלה | איחוד על `pg_policies` · `pg_proc.prosrc` · `pg_get_viewdef` · `pg_indexes` · `pg_constraint` | **ריק לחלוטין** — אפס policies, אפס פונקציות, אפס views, אפס אינדקסים, אפס אילוצים ⇒ ההפלה לא תדרוש `cascade` ולא תשבור שום אובייקט | `אומת-על-ידי` |

**שאילתת האימות העצמאי (#3), מילה-במילה:**
```sql
select count(*) as rows_total,
       count(*) filter (where not (negative_feedback_reason is null or negative_feedback_reason in
              ('איחור דיילות','תפקוד דיילות','איכות תגים','ניהול לקוי','אחר')))       as viol_feedback,
       count(*) filter (where not (project_status not in
              ('awaiting_invoice','awaiting_payment','finished') or summary_report_url is not null))
                                                                                      as viol_report,
       count(*) filter (where project_bonus is distinct from 0)                       as nonzero_bonus_guard,
       count(*) filter (where quote_id is null)                                       as null_quote_id,
       count(*) filter (where owner_email is null)                                    as null_owner_email
  from public.projects;
```
⇒ `{"rows_total":4,"viol_feedback":0,"viol_report":0,"nonzero_bonus_guard":0,"null_quote_id":0,"null_owner_email":0}`

🟢 **מסקנה: אני מאשר באופן עצמאי את `0/0/0/0/0` שמדד המתזמן.** ‏`bad_feedback_reason` ו-`closed_without_report`
שניהם אפס ⇒ **אין חסם, המיגרציה יכולה לצאת ככתבה.** בדקתי אותם פעמיים בשתי ניסוחי-שאילתה שונים
(פעם כרשימת-ערכים חוקיים, פעם כשלילת הפרדיקט של ה-CHECK עצמו) — לא כדי להיות יסודי, אלא כי אלה שני
המספרים שאם הם אינם אפס המיגרציה **נופלת באמצע**.

### 🔴 שאלת-האינדקס — ההיגיון של המדריך שגוי, וזה נמדד

צ'קליסט המדריך כותב: *"no new FK index needed (`users(email)` is unique)"*. **הנימוק הפוך:**
יועץ-הביצועים של Supabase בוחן את **העמודה המפנה** (`projects.cancelled_by`), לא את המופנית
(`users.email`). ‏**העוגן שסוגר את הוויכוח נמצא באותה טבלה:** ‏`projects_owner_email_idx` **קיים**
(מדידה #7) אף ש-`users(email)` הוא ה-PK — כלומר לו הנימוק היה נכון, האינדקס הזה לא היה צריך להיווצר
מעולם. שורה 🛑#8 בטבלת-החסמים של המדריך כבר אמרה זאת במפורש.

⇒ **הכרעתי: שתי העמודות החדשות מקבלות אינדקס מפורש-שם.** ‏`ביצוע-טכני בלי משמעות מוצרית`, והעוגן הוא
**עקביות מלאה של הטבלה** — היום כל עמודת-FK ב-`projects` נושאת אינדקס, אפס חריגים.

⚠️ **ומה שזה משנה במקום אחר, ואני אומר את זה בקול:** צעד **1.10** צופה **11 ממצאי-יועץ חדשים** לפזה,
מהם **2 מצעד 1.1** (`unindexed_foreign_keys`). ‏**עם האינדקסים האלה הצפי יורד ל-9**, ושורת-הטריאז' של
1.10 חייבת להתעדכן. ➕ **והמחיר ההפוך, בכנות:** אינדקס שלעולם לא נסרק מופיע בהמשך כממצא
`unused_index` — כלומר לא "אפס ממצאים" אלא ממצא מסוג אחר. **ביטול ההכרעה הוא מחיקת שתי שורות
בסוף הקובץ, לפני ההחלה** — אין לזה אף השלכה אחרת.

### ⚠️ שני דיוקים קטנים במדריך שנתקלתי בהם (לא חוסמים)

1. **בלוק ה-`Verify` של צעד 1.1 מצפה ל-"six rows"** — הרשימה שלו מונה **שמונה** שמות-עמודות, ואחרי
   ההפלה `project_bonus` נעדרת ⇒ **התוצאה הנכונה היא שבע שורות, לא שש.** בונה שיקרא "שש" יחשוב
   שמשהו נכשל.
2. **`AR-1` מנסחת את העמודה `not null`** בעוד גוף צעד 1.1 מנמק במפורש שהיא **nullable** והחובה נאכפת
   ב-`cancel_project`. **הלכתי אחרי גוף-הצעד** — הוא המאוחר, הוא המנומק, ו-`not null` על עמודה שריקה
   בכל ארבע השורות פשוט אינו ניתן להוספה בלי ברירת-מחדל שקרית.

## הנחות

| תג | ההנחה | למה |
|---|---|---|
| `הנחתי` | **`on delete restrict` על שתי ה-FK החדשות** — טיוטת המדריך כותבת `references public.users(email)` יחף (= `NO ACTION`) | העוגן: `projects_owner_email_fkey`, **ה-FK היחידה ל-`users(email)` בכל המסד**, היא `ON DELETE RESTRICT` (מדידה #5). ‏`RESTRICT` ו-`NO ACTION` כמעט זהים בהתנהגות; בחרתי בתקדים הקיים כדי שלא יהיו שתי צורות לאותו קשר. **לבטל = להסיר שתי מילים** |
| `הנחתי` | **בלוק-השומר לפני `drop column`** — המדריך מורה לספור לפני ומאשר לעצור, אבל לא מבקש שומר בתוך המיגרציה | המשפט הזה הוא **היחיד הבלתי-הפיך בפזה כולה**, והוא גם היחיד שנכשל **בשקט** (השאר נופלים לבד על `23514`/`23502`). הוויתור על ה-typed-echo נשען מפורשות על *"כל ארבע השורות מחזיקות 0"* — השומר הופך את הנשענוּת הזו לנאכפת בזמן ההחלה |
| `הנחתי` | **שני אינדקסי-ה-FK** — ראו הסעיף למעלה; מסומן כהנחה ולא כעובדה כי המדריך אומר את ההפך | |
| `הנחתי` | ניסוח ה-CHECK כ-`X is null or X in (…)` ולא `X in (…)` בלבד | **זהה סמנטית** (‏`NULL in (…)` מחזיר `NULL` ⇒ CHECK עובר), ומפורש יותר לקורא. זו העדפת-ניסוח, לא שינוי-התנהגות |
| `הנחתי` | **לא הוספתי `comment on column`** | נמדד: `comment on` מופיע ב-**2 קבצי-מיגרציה מתוך ~50** ⇒ אינו דפוס-הבית. ה-"why" חי בכותרת העברית, כמו בכל שאר המיגרציות |

## 🛑 צריך את ישי

**אין.** כל ההכרעות המוצריות שהצעד הזה נשען עליהן כבר הוכרעו ומתוארכות: ⑩ ו-⑭ ו-㉟ (ישי, 13/08/2026) ·
`AR-1`/`AR-6`/`AR-9` (14/08/2026) · `B11` — *"מספר בלבד"* (ישי, 14/08/2026 10:4X). **חמש ספירות-הקדם
חזרו אפס** ⇒ אף אחד משני מסלולי-העצירה שהמדריך מגדיר (`bad_feedback_reason > 0` / `closed_without_report > 0`)
לא נפתח. **מה שכן צריך אותו הוא לא הכרעה אלא אישור:** ההחלה עצמה, אחרי הסבר בעברית — וזה קיים בפרוטוקול.

**מה שכן נמנעתי מלעשות, כדי שלא ייקרא כשכחה:**
🚫 **אין `actual_start_time`/`actual_end_time`** — ‏`B11` הוכרעה "מספר בלבד" ⇒ `actual_hours` עומדת לבדה.
🚫 **אין עמודת `final_gross_profit`** — ‏`AR-6` (ישי, 14/08/2026 01:17): ההקפאה הפיננסית היא של מודול 8.
🚫 **אין `ready_at`** — ⑭: בדיוק שתי חותמות-זמן.

## שמות שהקוד יסתמך עליהם

> 🔴 **כל אחד מהשמות האלה הוא חוזה.** ‏`SERVER_CONSTRAINT_RULES` (`src/lib/hostesses.js:603-613`) מזהה
> שגיאות-מסד **לפי שם-האילוץ**, לא לפי נוסח ההודעה — ולכן שינוי-שם בלי עדכון-מיפוי מפיל את ההודעה
> העברית להודעת-fallback גנרית. **אף אחד מהשמות אינו אוטומטי.**

**אילוצי CHECK (3):**
- `projects_cancel_type_check` — ‏`cancel_type` הוא `null` או אחד מ-`customer` / `force_majeure` / `other`
- `projects_negative_feedback_reason_check` — חמשת הערכים של `C6 §2.4.4` (M6-13)
- `project_closed_needs_report` — סטטוס-סגירה מחייב `summary_report_url` (㉛, סוגר §7.36)

**מפתחות זרים (2):**
- `projects_cancelled_by_fkey` — ‏`projects.cancelled_by` → `public.users(email)`, ‏`on delete restrict`
- `projects_operationally_closed_by_fkey` — ‏`projects.operationally_closed_by` → `public.users(email)`, ‏`on delete restrict`

**אינדקסים (2):**
- `projects_cancelled_by_idx`
- `projects_operationally_closed_by_idx`

**עמודות שנוצרו (5):** `cancelled_at` · `cancelled_by` · `cancel_type` · `operationally_closed_at` · `operationally_closed_by`
**עמודה שהופלה (1):** `project_bonus`
**עמודות שהודקו ל-NOT NULL (2):** `quote_id` · `owner_email`

**פונקציות / policies / טריגרים שנוצרו:** אין. *(בלוק ה-`do $$` הוא אנונימי — אין לו שם ואינו נשאר במסד.)*

---

## מה תוקן בסבב הבקרה

> **‏14/08/2026 · סבב-בקרה יריב על תשע טיוטות פזה-1 (‏32 ממצאים).** לקובץ הזה נגעו **שני**
> ממצאים; שניהם טופלו, ואף אחד מהם לא נדחה.

### ① ‏[minor] שם-האילוץ `project_closed_needs_report` → `projects_closed_needs_report` ✅ תוקן

**הממצא:** זה היה **השם היחיד** מבין החדשים שהשמיט את שם-הטבלה המלא — הוא נקרא כאילו הוא
שייך לטבלה בשם `project`, שאינה קיימת.

**איך אומת:** שאילתה חיה על **כל** אילוצי-ה-CHECK בסכמה `public`:
```sql
select c.conrelid::regclass::text as tbl, c.conname,
       (c.conname like c.conrelid::regclass::text || '\_%') as has_table_prefix
from pg_constraint c
where c.connamespace='public'::regnamespace and c.contype='c';
```
**התוצאה: 44 מתוך 44 — `has_table_prefix = true`. אפס חריגים.** וזה כולל בדיוק את המקרים
שהיו יכולים להצדיק חריגה — אילוצים שנוסחם פרוזה ולא `<עמודה>_check`:
`quotes_approved_requires_vat` · `quotes_rejected_iff_reason` ·
`customers_company_number_9_digits` · `hostess_unavailability_range_valid` ·
`customer_hostess_preference_negative_needs_reason`. כולם שומרים את שם-הטבלה המלא.
⇒ הצורה הישנה הייתה נעשית **החריג היחיד במסד כולו**.

**גם אומת שאין התנגשות:** `select count(*) from pg_constraint where conname in
('project_closed_needs_report','projects_closed_needs_report')` ⇒ **0**. אף אחד מהשמות
אינו תפוס.

**שונה בשלושה מקומות — כל מה שבבעלות הסשן הזה:**
`m6_step_1_1.sql` (הצהרת ה-`add constraint` + הערת ה-why) · `m6_step_1_10.sql` (רשימת
`exp_con`) · `m6_step_1_5.sql:16` (אזכור בהערה). **שלושתם חייבים להישאר זהים** — אם אחד
ישונה בלי השני, השער יחפש שם שלא נוצר.

🔴 **ושני מופעים שנשארו בשם הישן ואינם בבעלות הסשן הזה — לתשומת המתזמר:**
`m6_step_1_8a_reads_and_close.sql` **שורות 347 ו-468** מזכירות את
`project_closed_needs_report` בהערות. **שתיהן הערות בלבד — אין שם `add constraint` ואין
תלות ביצועית**, ולכן הפער אינו יכול להפיל את המיגרציה; אבל הוא **כן** ישאיר קורא עתידי
עם שני שמות לאותו אילוץ. ⇒ **החלפת-מחרוזת מכנית, ובעליו של 1.8a הוא שיבצע אותה.**

### ② 🌊 אדוות התיעוד של שינוי-השם — **14 מופעים בשישה קבצים** ⏳ חוב פתוח

🔴 **הסשן הזה קריאה-בלבד על הריפו ולכן לא נגע באף אחד מהם. זו רשימת-העבודה המלאה,
ולא "בערך":** *(נמדד בחיפוש על כל הריפו, 14/08/2026)*

| הקובץ | שורות |
|---|---|
| `docs/db_roadmap.md` | 191 · 281 |
| `docs/micro_guides/module-6.md` | 278 · 566 · 663 · 879 · 1108 |
| `docs/specs/module_06_projects/processes-approved.md` | 481 · 1055 |
| `docs/specs/module_06_projects/spec.md` | 411 · 627 |
| `docs/specs/module_06_projects/screens-approved.md` | 1543 · 2350 |
| `docs/mockups/…/approved/05_tab_closing_approved.html` | 576 |

✅ **ולמה זה בטוח למרות שהמוקאפ מאושר:** המופע במוקאפ **אינו טקסט שמשתמשת רואה**. הוא יושב
בבלוק-הביאור למפתח בתחתית העמוד (*"➕ חדש (דורש db_roadmap)"*), לצד `assignments.attendance_status`
ו-`bucket reports` — כלומר רשימת מה-שהמסד-צריך, לא עותק-מסך. ⇒ **אין כאן שינוי במשהו שישי
אישר ויזואלית**, ולכן זו החלפת-מחרוזת מכנית ולא הכרעה מחודשת.

### ③ ‏[major] תשעת שמות-האילוצים החדשים אינם ב-`SERVER_CONSTRAINT_RULES` — 🚫 **לא שונה במיגרציה** ⏳ חוב פזה 2/3

**הממצא נכון, והמסקנה שלו היא שאין מה לתקן כאן:** השמות במיגרציה **נכונים ומפורשים** —
הבעיה היא בצד הלקוח, ש`src/lib/hostesses.js:603-613` מחזיק היום **שתי** רשומות בלבד
(`assignments_one_event_per_day` · `assignments_one_shift_lead_per_project`).
⇒ כל אחד מהתשעה שמשתמשת יכולה להפיל יציג לה היום את הטקסט האנגלי הגולמי של Postgres
(*"new row for relation \"projects\" violates check constraint …"*).

**התשעה, בשמם, לפי הצעד שיוצר אותם:**

| # | שם-האילוץ | צעד | מתי משתמשת נתקלת בו |
|:-:|---|:-:|---|
| 1 | `projects_closed_needs_report` | 1.1 | סוגרת אירוע בלי להעלות דוח |
| 2 | `projects_cancel_type_check` | 1.1 | סוג-ביטול שאינו אחד משלושה |
| 3 | `projects_negative_feedback_reason_check` | 1.1 | סיבת-משוב שלילי מחוץ לחמש |
| 4 | `project_changes_delta_qty_check` | 1.2 | שינוי-תכולה בכמות אפס |
| 5 | `project_changes_reason_check` | 1.2 | שינוי-תכולה בלי סיבה |
| 6 | `project_changes_target_shape` | 1.2 | שינוי-לוגיסטיקה בלי מק"ט |
| 7 | `project_changes_color_check` | 1.2 | צבע מחוץ לחמישה |
| 8 | `assignments_attendance_shape` | 1.3 | דרגת-איחור בלי איחור |
| 9 | `assignments_no_show_zero_hours` | 1.3 | "לא הגיעה" עם שעות > 0 |

🔴 **ועשירי שאינו אילוץ חדש אלא אילוץ חי שנעשה נגיש:** `customer_hostess_preference_preference_check`
(‏`preference in ('מצוינת','בסדר','לא_לשלוח')` — נמדד חי). הוא הופך לנגיש דרך RPC-הסגירה של
צעד 1.8, ולכן הוא **חוב של 1.8, לא של הקובץ הזה** — נרשם כאן רק כדי שלא ייפול בין הכיסאות.

### ④ מה נבדק מחדש בקובץ הזה ועבר ✅

- **שער-ההפלה של `project_bonus`:** ‏`select count(*) from public.projects where
  project_bonus is distinct from 0` ⇒ **0** (נמדד שוב 14/08/2026 בסבב-הבקרה). בלוק
  ה-`do $$` יעבור, וההפלה הבלתי-הפיכה בטוחה.
- **שני ההידוקים ל-NOT NULL:** ‏`select count(*) from public.projects where quote_id is null
  or owner_email is null` ⇒ **0**. ‏`SET NOT NULL` לא ייכשל.
- **ספירת-העמודות:** ‏`projects` נושאת **29** עמודות היום ⇒ 29 − 1 + 5 = **33**, בדיוק
  כפי ש-`A-CNT` ב-1.10 מצפה.
- **`timestamptz` ולא `timestamp`:** שתי חותמות-הזמן החדשות הן `timestamptz`. ✅
- **כל אילוץ, אינדקס ו-FK בשם מפורש:** ✅ — אפס שמות שנגזרים אוטומטית.
- **שני אינדקסי-ה-FK החדשים** (`projects_cancelled_by_idx` · `projects_operationally_closed_by_idx`)
  הם הסיבה שתחזית-יועץ-הביצועים ב-1.10 נשארת **20 → 20** ולא עולה. ראה שם.

</div>
