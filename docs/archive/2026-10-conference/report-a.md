## דוח בונה A: מסד הליבה של דוח השכר

לא הצלחתי לכתוב את `C:\Users\ishay\payroll-work\report-a.md`. הסביבה חוסמת כתיבת קובצי דוח מתת-סוכן. לכן הדוח המלא מופיע כאן בנספח, אחרי הסיכום.

**SHA-ים** (ענף `ishay/payroll-a`, לא נדחף ושום דבר לא הוחל על המסד החי):
- `83321cea` — מיגרציות 1–6 ו-6b, הרפליקה, בדיקות 00–06.
- `8b61c19b` — מיגרציות 8, 9, 14–17, השומר בסקריפט השחזור (F10), בדיקות 07–11.
- `367fb833` — `schema.sql` ו-`db_roadmap.md`.
- `79622f2d` — שלוש בדיקות כיסוי נוספות.
- ב-git אין אף תו CR באף קובץ.

**שערים:**
- `npm run gate` הסתיים בקוד יציאה 0: ‏`Test Files 141 passed (141) · Tests 3444 passed (3444)`. השער רץ לפני הקומיט האחרון, שהוסיף רק קובצי `.sql` שהשער לא בודק.
- בדיקות SQL: `node scripts/payroll-replica/run.mjs supabase/tests/payroll` עבר — 12/12 קבצים, 128 בדיקות.
- אותן בדיקות עוברות 12/12 גם עם מיגרציות 7, 10–13 האמיתיות של B, מה-worktree שלו.

**W0 (SELECT בלבד):**
- **1 — אוגוסט:** עובר. 83/83 שורות עם מועמד יחיד, 0 בלי מועמד, 0 עם כמה, 0 כפולים, 0 פערים.
- **2 — מקור השיוכים האבודים:** כנראה שחזור של תמונת המצב. בשתי תמונות המצב יש 0 שיבוצים משויכים.
- **5 — קוראים ישנים בקוד:** רק `api.js`.
- **9 — פונקציות הטוקן:** עובר.
- **12 — DDL על storage:** התקדים החי הוא `20260814110558`, לא המספר שבחוזה.
- **13:** ‏0 שורות שליליות.
- **14:** ‏0 משמרות באורך אפס, ו-25 משמרות חוצות חצות.

**נבדק לעומק:**
- הכותב הישן מחזיר בדיוק אותו JSON כמו הגוף החי, באותה הזמנה של נתונים.
- כל עמודה מוקפאת במשמרת משויכת נחסמת.
- גבולות חודש, ספי 24/72 שעות, כוח עליון, חוצה חצות ושתי משמרות של אותה דיילת באותו פרויקט.
- תיקון אוגוסט עם 83 שורות, וגם שלושה מסלולים שבהם הוא מסרב.
- כל מחזור ההפקה, כולל אידמפוטנטיות ותיקונים F1–F3.
- שומר השחזור נבדק על הסקריפט האמיתי.

**לא נבדק:**
- `PAYROLL_BUSY` ו-`CLAIM_MISMATCH` — צריך שני חיבורים, ול-PGlite יש אחד.
- `TOTAL_MISMATCH` — לא נגיש.

**הכרעות שלי (פירוט בנספח, סעיף 6):**
- הרפליקה נבנית מהקטלוג החי ולא מ-`schema.sql`.
- PGlite 0.4.6 (PG 17.5), כי 0.5.x הוא PG 18 והיה מסתיר את F4.
- `begin` לוקח את הנעילה הגלובלית, כדי למנוע תקיעה מול commit.
- סף פיצוי חסר יוצר פגם `COMP_HOURS_MISSING` במקום 100% שקט.
- אימצתי שבעה ממצאי רשות של בודק 1: 1, 2, 3, 4, 5, 13, 19.

**רשומות שאתה צריך לכתוב למסמכים המשותפים:**
- לדווח לישי על R1: ‏25 שורות פיצוי עוברות משעות שליליות לחיוביות.
- לפני מיגרציה 8: למשוך שוב את הגופים החיים ולבדוק md5.
- לפני מיגרציה 9: להריץ שוב את W0-1.
- מיגרציה 17 חסומה (שורה PAY-17 ב-§9א).
- ב-PROJECT_MASTER: 🚧 על F5 — רק מנכ"ל מחזיק את שתי ההרשאות.

**נקודות העיוורון:**
- מקביליות לא נבדקה בכלל.
- `seed_reset`, `close_project_operationally` ו-`cancel_project` לא נטענו לרפליקה, ולא בדקתי אותם מול השומר החדש.
- רק ארבעה גופים חיים אומתו ב-md5.
- storage ברפליקה הוא stub.
- לא השוויתי את הודעות השגיאה בעברית לטבלאות הנוסחים.

---

## נספח — הדוח המלא

### 0. ‏W0
- **W0-1:** דוח 15, ‏83 שורות. Σ השורות = 22,508.30 = `total_amount`. כרגע יש 0 שיוכים, ובכל המסד יש דוח שכר אחד בלבד.
- **W0-2:** ב-`seed_snapshot.assignments_20260915` יש 0/5,681 משויכים, וב-`assignments_close_20260924` ‏0/123.
- **W0-5:** הקריאות היחידות הן ב-`api.js` שורות 627, 693, 768.
- **W0-9:** `gen_random_bytes@extensions`, `sha256@pg_catalog`.
- **W0-12:** הבעלים של `storage.objects` הוא `supabase_storage_admin`. התקדים הוחל כגרסה `20260814110558`.
- **W0-13:** ‏0 שורות שליליות.
- **W0-14:** ‏0 משמרות באורך אפס, ו-25 חוצות חצות.
- **גופים חיים:** generate ‏`d8d58ba0ed5c2076fc14d19ce0e0c907`, finalize ‏`8af8f09f9cb60904f7ac0feb45e28111`. ההעתק ברפליקה זהה בייט לבייט — הבדיקה `00` מאמתת את זה.

### 3. קובצי בדיקה (‏`supabase/tests/payroll/`)

| קובץ | בדיקות |
|---|---:|
| `00_replica_smoke` | 2 |
| `01_config_and_helpers` | 12 |
| `02_report_identity` | 8 |
| `03_mail_attempts_and_email_log` | 5 |
| `04_storage_policies` | 7 |
| `05_collect_and_preview` | 27 |
| `06_attempts_and_history` | 17 |
| `07_guard_and_legacy_writer` | 15 |
| `08_august_claim_repair` | 4 |
| `09_august_claim_repair_refuses` | 3 |
| `10_operations_and_commit` | 24 |
| `11_seed_restore_guard` | 4 |

### 4. כיסוי פונקציות וקודי שגיאה

**פונקציות — כולן מכוסות:**
- עזרי מיגרציה 1 → בדיקה 01.
- `payroll_collect`, הזהות, הגרסה, תקינות רו"ח, מראת השומר, pending closure, `payroll_preview`, `payroll_delivery_address` → בדיקה 05.
- פונקציות הניסיון, claim, complete, report list ו-detail → בדיקה 06.
- השומר, generate ו-finalize → בדיקה 07.
- מיגרציה 9 → בדיקות 08 ו-09.
- כל פונקציות הפעולה, commit ו-retry → בדיקה 10.
- טריגרי אי-השינוי → בדיקה 02.

**קודים מכוסים, לפי בדיקה:**
- **01:** ‏PERMISSION_DENIED (גם 06, 10), ‏CONFIG_MISSING.
- **02:** ‏PAYROLL_LINE_IMMUTABLE, ‏PAYROLL_REPORT_IMMUTABLE.
- **05:** ‏PERIOD_INVALID, ‏FUTURE_PERIOD, ‏PERIOD_EXISTS (שלושתם גם 07; PERIOD_EXISTS גם 10), ‏PERIOD_LOCKED, ‏ORIGINAL_INVALID, ‏COMP_HOURS_MISSING ו-IDENTITY_MISSING (שניהם גם 07).
- **06:** ‏DELIVERY_ACTIVE, ‏NOT_CLAIMABLE, ‏STALE_ATTEMPT, ‏OUTCOME_INVALID, ‏ATTEMPT_NOT_FOUND, ‏RECIPIENT_INVALID, ‏REPORT_NOT_FOUND, ‏ISSUE_DISABLED (גם 10).
- **07:** ‏MONTH_NOT_ENDED (גם 10), ‏PERIOD_IN_REVIEW, ‏LEGACY_DISABLED, ‏ARTIFACT_IMMUTABLE, ‏STATUS_TRANSITION_INVALID, ‏LEGACY_REPORT_MISMATCH (גם 10), ‏PAYROLL_CLAIM_IMMUTABLE (גם 08).
- **10:** ‏REVIEW_NOT_FOUND, ‏IDEMPOTENCY_MISMATCH, ‏REVIEW_NOT_READY, ‏PREVIEW_CHANGED, ‏BLOCKERS_PRESENT, ‏OPERATION_STATE, ‏OPERATION_NOT_FOUND, ‏ARTIFACT_INVALID, ‏STALE_VERSION, ‏NOT_RETRYABLE, ‏DELIVERY_UNKNOWN.

**לא מכוסים:**
- PAYROLL_BUSY ו-CLAIM_MISMATCH — צריך חיבור שני.
- TOTAL_MISMATCH — לא נגיש: הסכום והשורות נבנים מאותו מערך באותה טרנזקציה.
- PREVIEW_CHANGED כשמספר ההשלמה זז בין snapshot ל-commit — המסלול קיים בקוד, אבל לא נבדק.

### 5. אחיות לכל הגנה

**משמרת ששולמה לא משתנה:**
- מכוסים: UPDATE ממשתמש עם הרשאת דיילות-edit, insert של שורה משויכת, ביטול שיוך, מחיקה, מחיקת פרויקט ב-cascade, סימן כותב מזויף (כולם 07).
- TRUNCATE עוקף את הטריגר, ולכן ההגנה היא השומר בסקריפט השחזור (11). אין TRUNCATE אחר בריפו.
- לא נבדקו: `seed_reset`, `close_project_operationally`, `cancel_project`, `update_project_details`.
- `correct_unclaimed_assignment` שייך ל-B.

**דוח רגיל אחד לחודש:**
- הכותב הישן (07), ‏commit ‏(10), ‏insert ישיר (02).
- preview ו-begin אחרי שהחודש הופק (10).

**שורות חתומות קבועות:** לכל תפקיד, כולל הכותב (02). TRUNCATE מכוסה בשומר (11).

**קובץ וראיה נכתבים פעם אחת:**
- finalize ‏(07), ‏UPDATE ישיר (02).
- כל ארבע דרכי האחסון: insert, update, delete, upsert (04).

**"לא ידוע" לא נשלח שוב בשקט:**
- retry לרו"ח (10), ‏complete מאוחר (06), ‏finalize ישן (07, 10).
- שליחה חוזרת אישית — של B.

**הפקה כפולה:**
- אותו UUID, ‏UUID חדש עם אותה גרסה, גרסה אחרת, הכותב הישן אחרי ההפקה (כולם 10).
- שני חיבורים במקביל — לא נבדק.

### 6. הכרעות הפיכות שלי
1. הרפליקה נבנית מהקטלוג החי: 14 טבלאות ו-11 פונקציות. `schema.sql` הוא תמונה מוערת מ-16/09 ולא SQL שרץ.
2. PGlite 0.4.6 (PG 17.5). גרסה 0.5.x היא PG 18, שבה base64url קיים — היא הייתה מסתירה את F4.
3. `payroll_report_list` מחזיר `{ok, reports}`. ‏D מקבל את שתי הצורות — בדקתי ב-`payrollApi.js` שלו.
4. דוח ישן: מצב השליחה הוא sent→sent, ‏failed→failed, ‏pending→unknown. ‏`issued_at` שלו הוא `created_at`.
5. סף פיצוי חסר בפרמטרים יוצר פגם `COMP_HOURS_MISSING`. זו ההחמרה היחידה מול הכותב החי.
6. ממצאי רשות של בודק 1 שאימצתי:
   - 1 — בדיקות חוזרות אחרי הנעילה, ו-`lock_timeout` שמחזיר PAYROLL_BUSY.
   - 2 — ‏0 באיסוף, null רק בתצוגה.
   - 3 — `travel_amount` נכתב גם ב-commit.
   - 4 — `project_status` נכנס לגיבוב רק בשורות פיצוי.
   - 5 — הפרויקטים ננעלים `for update`.
   - 13 — פעולה ב-`preparing` מעל 120 שניות מחזירה resume.
   - 19 — `issued_by` הוא מי שחתם.
7. `begin` לוקח את הנעילה הגלובלית, כדי למנוע תקיעה (deadlock) מול commit.
8. מספר השלמה שזז בין snapshot ל-commit מחזיר PREVIEW_CHANGED.
9. `_payroll_attempt_persist_unknown` הוא עזר משותף ל-F1, ש-B יכול להשתמש בו.
10. קודים שלא בחוזה: STATUS_TRANSITION_INVALID, ‏OUTCOME_INVALID, ‏ATTEMPT_NOT_FOUND, ‏ARTIFACT_INVALID, ‏OPERATION_NOT_FOUND, ‏REPORT_NOT_FOUND, ‏TOTAL_MISMATCH, ‏CONFIG_MISSING, ‏PAYROLL_REPORT_IMMUTABLE, ‏ABANDONED.
11. בדיקת-האחרי של אוגוסט מוודאת גם "שווה למספר השורות" וגם "שווה ל-83".
12. שומר השחזור: חלק הפעולות רץ לפני בדיקת ה-stamp. חלק ספירת הדוחות רץ מיד אחריה, כי הוא צריך את ה-stamp.
13. לא חסמתי מחיקה של `salary_reports`. החוזה דורש חסימה על update בלבד.
14. `payroll_preview` לחודש שכבר הופק זורק PERIOD_EXISTS, עם `report_id` ב-hint.

### 7. ממצאי רשות שלא אומצו
- 10(א) ו-10(ב) — טריגר TRUNCATE והחרגה באיסוף. F10 בחר בשומר בסקריפט, וגם הכיול שלך מ-23:45.
- 18 — פרמטר נסיעות חסר נשאר 0, כמו בכותב החי.
- 6 — שנת 2024 נשארת PERIOD_INVALID, לפי החוזה.
- 7, 11, 12, 14 שייכים ל-B. ‏9, 10, 15 שייכים ל-C. ‏17 שייך ל-D.

### 8. רשומות למסמכים המשותפים
1. לדווח לישי על R1.
2. אחרי החלה:
   - בסעיף 36 של `schema.sql` להסיר את ⏳ ולעדכן את הספירות בכותרת.
   - ב-`db_roadmap.md §10ב` להפוך ⏳ ל-✅.
3. לפני מיגרציה 8: למשוך שוב את שני הגופים החיים ולבדוק md5.
4. לפני מיגרציה 9: להריץ שוב את W0-1.
5. ‏B 7 חייבת לרוץ לפני מיגרציה 8.
6. ‏PAY-17 חסומה.
7. רשומות CHANGELOG ו-LOG על הרפליקה ועל שומר השחזור.
8. ‏🚧 על F5 ב-PROJECT_MASTER.
9. הבדיקות של B רצות רק ב-worktree שלו.

### 9. נקודות העיוורון
- מקביליות לא נבדקה.
- ‏58 פונקציות חיות לא נטענו לרפליקה.
- רק ארבעה גופים חיים אומתו ב-md5.
- storage ברפליקה הוא stub.
- PGlite 17.5 מול 17.6 בחי.
- בדיקות שתלויות בתאריך הנוכחי.
- הנוסחים בעברית לא הושוו לטבלאות הנוסחים.

**קבצים מרכזיים:**
- `C:\Users\ishay\Reg-In-payroll-a\supabase\migrations\20261014000100…20261016000000_module8_payroll_*.sql`
- `C:\Users\ishay\Reg-In-payroll-a\scripts\payroll-replica\`
- `C:\Users\ishay\Reg-In-payroll-a\supabase\tests\payroll\`
- `C:\Users\ishay\Reg-In-payroll-a\scripts\seed-snapshot\restore-seed-snapshot.sql`