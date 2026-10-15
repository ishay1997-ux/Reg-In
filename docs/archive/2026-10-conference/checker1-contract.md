# בודק 1 — ערעור על חוזה השכר לפני בנייה

נבדק: `C:\Users\ishay\Reg-In-payroll-wt\docs\specs\module_08_finance\payroll-contract.md` (HEAD `8b3f967f`, כולל §9), מול התוכנית `docs/plans/2026-10-13-payroll-end-to-end.md` (A01–A32) ו-§7.104–108.
מדידות: SELECT בלבד על המסד החי `yfeovxppnfoafmfbdfvh` (PostgreSQL 17.6), 13.10.2026. לא נקראה אף פונקציה של המערכת, ולא נשלפו שורות עם פרטים אישיים. היוצא מן הכלל: `encode()` מובנית אחת על ערך קבוע.
סיכום: **10 חובה · 19 רשות**.

---

## א. מה המדידה סגרה (W0 וטענות החוזה)

| טענה / W0 | תוצאה | ראיה |
|---|---|---|
| W0-1 התאמת תיקון אוגוסט | **עובר** | דוח 15: 83 שורות, ל-83 בדיוק מועמד אחד, 0 בלי מועמד, 0 עם כמה מועמדים, 0 שיבוצים שתואמו פעמיים, 0 פערי שעות או תעריף, 0 שורות פיצוי, 0 שורות לפני אוגוסט. כרגע יש 0 שיוכים לדוח 15, וסכום השורות 22,508.30 שווה ל-`total_amount`. |
| W0-2 מקור השיוכים האבודים | **כנראה שחזור או זריעה מחדש** | שורות דוח 15 נוצרו ב-2026-09-09 22:20 UTC. ב-`seed_snapshot.assignments_20260915` יש 0 שורות משויכות מתוך 5,681. `restore-seed-snapshot.sql` מריץ `truncate … cascade` על `salary_report_lines`, `salary_reports` ו-`assignments` (שורות 34–57). ראו חובה 10. |
| W0-9 פונקציות הטוקן | **הפונקציות קיימות; קידוד base64url נכשל** | `gen_random_bytes(integer)` נמצאת ב-`extensions`, ו-`sha256(bytea)` ב-`pg_catalog`. אבל `encode('\x0102','base64url')` מחזיר `ERROR 22023: unrecognized encoding: "base64url"` (‏base64url נכנס רק ב-PG18). ראו חובה 4. |
| W0-10 | נמדד | `מייל_משרד_רואי_חשבון` קיים (`integration_tech`, בעלים: role 3). `תבנית_מייל_דוח_שכר` מסוג `templates`, בעלים: role 3 'מנהלת כספים ולקוחות'. |
| W0-11 תפקידים עם שתי ההרשאות | **רק מנכ"ל** | ל'מנהלת כספים ולקוחות' יש כספים=edit ופרויקטים=view. ל'מנהלת פרויקטים' יש פרויקטים=edit וכספים=blocked. ראו חובה 5. |
| W0-12 DDL על storage | **עובר; הבדיקה שהוצעה שגויה** | הבעלים של `storage.objects` הוא `supabase_storage_admin`, ו-`postgres` אינו חבר בו. בכל זאת התקדים הוחל בהצלחה, אך בגרסה החיה `20260814110558`. קובץ הריפו נקרא `20260814141049`, והגרסה הזו אינה ב-`schema_migrations`. `has_table_privilege(...,'INSERT')` לא אומר דבר על יצירת policy. |
| W0-13 | 0 | אין שורות עם `hours<0` או `line_total<0`. |
| W0-14 | 0 שעות שוות; **25 חוצי-חצות** | יש 25 מועמדי פיצוי עם `final_end_time<final_start_time`. הכותב החי היה נותן להם שעות שליליות, ו-D1 מתקן זאת. זה שינוי כסף מכוון, לא רגרסיה. |
| D1 | **אומת** | `finance_project_money` משתמש ב-`mod(extract(epoch …)+86400,86400)/3600.0`. |
| גוף H3 החי | **שקול לחוזה, חוץ מהשינויים המכוונים** | בפעולה בפועל: `project_status in ('awaiting_invoice','awaiting_payment','finished')`, `actual_hours>0 ⇒` נסיעות. בפיצוי: `released_from_status='finally_approved'` ופרויקט `cancelled`, ספים `>72 ⇒ 0`, `>=24 ⇒ 50%`, אחרת 100. `round(hours*rate+bonus+travel,2)` על השעות הלא-מעוגלות. הענף החי **לא** בודק `assignment_status='released'`, ותיקון אוגוסט (§1.1) כן. נמדד שאין הבדל: 0 שורות שבהן `released_from_status='finally_approved'` והסטטוס אינו `released`. |
| טריגר סנכרון event_date | **קיים בשני כיוונים** | `projects_sync_assignment_dates` (AFTER UPDATE OF final_event_date), וגם `assignments_sync_event_date`, BEFORE INSERT OR UPDATE על **כל** עדכון שיבוץ, כולל עדכון השיוך. ה-guard החדש (`assignments_payroll_guard`) רץ ראשון בסדר אלפביתי. אין התנגשות, כי event_date אינו מוקפא. |
| `trg_recompute_project_status` (נקודה עיוורת ב-§8) | **לא "בלתי מזיק" לגמרי** | `recompute_project_status` מבצע `select … from projects … for update` **לפני** היציאה המוקדמת לסטטוסים סגורים. לכן כל שורה שהשיוך מעדכן משדרגת את נעילת ה-FOR SHARE על הפרויקט ל-FOR UPDATE. ראו רשות 5. |
| אילוצים קיימים | אומת | `salary_reports_period_key UNIQUE(period)` קיים. CHECK ב-email_log: entity ∈ {quote, shift, project, project_report, invoice, salary_report}, status ∈ {sent, failed}. לשתי הטבלאות `salary_*` יש רק SELECT policy. |
| ACL לכותבים הישנים | `postgres, service_role, authenticated` | anon לא מופיע. `create or replace` שומר על ה-ACL. |
| פרמטרים ותבניות | 47 שורות params, 11 תבניות | מתאים ל-47→48 ו-11→12 שבחוזה. |
| נתוני קבלה | **יולי: 75 שורות בפועל, 32 דיילות, 0 פיצוי** | מתאים ל-P4 ול-P8. אחרי תיקון אוגוסט יישארו באוגוסט 8 שורות בפועל ושורת פיצוי אחת לא משויכות, כלומר יש בסיס ל-P11. |

---

## ב. ממצאי חובה

**חובה 1: שליחה שתוצאתה לא ידועה לא ניתנת לשליחה חוזרת, ומצב "לא ידוע" לא נשמר אף פעם.** (§1 מיגרציה 3, האינדקס החלקי · §2.1 `_payroll_attempt_effective_state`, `payroll_attempt_complete` · §2.3 `payroll_accountant_retry_reserve`, `payroll_review_resend_reserve` · §3.2 השורה האחרונה)
- **מה פתוח:** מצב `unknown` הוא מצב *אפקטיבי* בלבד: נגזר מ-`sending` שעברו עליו 120 שניות, וקורא אותו הוא "Read-only". השורה נשארת `sending` במסד. האינדקס הייחודי החלקי `(report_id) where kind='accountant' and state in ('queued','sending')` (ובאותו אופן לפי `recipient_id`) חוסם לכן כל `_payroll_attempt_reserve` חדש, וזה הופך ל-`DELIVERY_ACTIVE`. המסלול היחיד שהחוזה מציע ל"לא ידוע" ("retry_accountant with acknowledge_unknown") לא יכול להצליח, ו-A09, A27 ו-A29 נתקעים. בנוסף, `salary_reports.delivery_state` נשאר `queued` לנצח כשה-edge קורס, כי אף פונקציה לא כותבת `sending` או `unknown`. §4.3 מחזיר את השדה הזה ל-D, ולכן המסך יציג "בתור" במקום "לא ידוע".
- **המלצה:** `retry_reserve` ו-`resend_reserve` נועלים את הניסיון הקודם (`for update`) וכותבים אותו כ-`unknown` לפני ההזמנה החדשה. `payroll_attempt_complete` מקבל גם `unknown` כמצב מוצא, אבל מעדכן את `salary_reports` רק לניסיון החדש ביותר (כבר כתוב). `payroll_report_list` ו-`payroll_operation_status` מחזירים מצב אפקטיבי, ומוגדר במפורש ש-`delivery_state` הוא מצב שמור בלבד.
- **נימוק:** אחרת הכפתור היחיד שהתוכנית מתירה במצב לא ידוע מחזיר תמיד שגיאה, והמסך מציג מצב שגוי.

**חובה 2: חסם `OPERATION_ACTIVE` בבדיקת המוכנות חוסם את ה-commit עצמו.** (§2.2 רשימת החסמים · §2.3 `payroll_commit` שלב 5 · `payroll_operation_begin`)
- **מה פתוח:** ה-commit רץ כשהפעולה במצב `prepared`, כלומר פעילה. `_payroll_review_assert_ready_locked(bigint,text)` מחשב את החסמים כולל `OPERATION_ACTIVE`, ולא מקבל את מזהה הפעולה כדי להחריג אותה. התוצאה: `REVIEW_NOT_READY` לנצח, ו-P8 נכשל. גם ב-`begin` לא מוגדר הסדר: אם בדיקת המוכנות המוקדמת רצה לפני "same version ⇒ existing", חידוש אחרי תשובה שאבדה יקבל `REVIEW_NOT_READY` במקום `{existing:true}`.
- **המלצה:** להוסיף `p_operation_id uuid` לחתימה (`_payroll_review_assert_ready_locked(bigint,text,uuid)`) ולהחריג את הפעולה הזו. ב-`begin` לקבוע סדר: אידמפוטנטיות, אחריה טיפול בפעולה פעילה, ורק אז בדיקה מוקדמת שמתעלמת מ-`OPERATION_ACTIVE`.
- **נימוק:** זו חתימה בין A ל-B שהחוזה נועל ("with this exact signature"), כלומר שני בונים יבנו אותה שגויה בדיוק באותה צורה.

**חובה 3: סדר "אוסף, נועל, מחשב גרסה מחדש" ב-commit, שתי קריאות שהאחת מקפיאה ערכים לא עדכניים.** (§2.3 שלב 6 מול D4)
- **מה פתוח:** שלב 6 אוסף מערך, אחר כך נועל מקורות, ואז "Recompute the version". D4 אומר שהגיבוב, השורות והשיוך באים כולם מאותו מערך. ב-READ COMMITTED, שינוי ששוריין בין האיסוף לנעילה (עריכה ישירה של שיבוץ, שינוי שם, שינוי בנק, שינוי פרמטר) לא ייכלל במערך. הגיבוב שיחושב מהמערך עדיין יתאים ל-expected, והשורה תוקפא עם הערך הישן בזמן שבשיבוץ יש ערך אחר. הכותבים האלה לא לוקחים את `_payroll_lock`. נמדד: ל-`assignments_write_by_permission` יש ALL למשתמשי 'דיילות' edit.
- **המלצה:** לכתוב במפורש. איסוף 1 קובע רק את קבוצת הנעילה. אחריו נועלים, ואז איסוף 2 (הצהרה חדשה, תמונת מצב אחרי הנעילות). איסוף 2 הוא *המערך היחיד* לגיבוב, לשורות ולשיוך. אם המפתחות באיסוף 2 אינם תת-קבוצה של מה שננעל, התוצאה היא `PREVIEW_CHANGED`.
- **נימוק:** בונה מוכשר יקרא את D4 ("אוספים פעם אחת") ויגבב את המערך הראשון, וזה פער שקט בין השורה המוקפאת לבין המקור.

**חובה 4: base64url לא קיים ב-PostgreSQL 17.** (D10)
- **מה פתוח:** נמדד `ERROR 22023: unrecognized encoding: "base64url"` על המסד החי (17.6). גם PGlite הוא PG17.
- **המלצה:** לכתוב בחוזה את הנוסחה: `translate(encode(extensions.gen_random_bytes(32),'base64'),'+/=','-_')`, שמחזירה 43 תווים. לקבוע שהגיבוב הוא `sha256(convert_to(token,'UTF8'))`, על הטקסט, כדי ש-mint ו-lookup יתאימו (ראו גם רשות 14).
- **נימוק:** החוזה מציג את זה כעובדה, ו-mint ייכשל בהרצה הראשונה.

**חובה 5: מסלול "קבל ובקש תיקון" מגיע למבוי סתום.** (§2.2 `payroll_review_resolve_case`, `correct_unclaimed_assignment` · §4.1 סעיף 3)
- **מה פתוח:** `accept` מעביר פנייה ל-`correction_pending`. המעבר היחיד משם הוא `correct_unclaimed_assignment(p_case_id)`, שתומך רק ב-`actual_hours` ו-`personal_bonus` של שיבוץ `finally_approved`, ומוגבל ל'פרויקטים' edit. נמדד: רק מנכ"ל מחזיק גם כספים וגם פרויקטים. מנהלת הפרויקטים חסומה בכספים, ולכן אין לה גישה ל-`/finance/payroll`, ואין משטח במודול הפרויקטים. הקטגוריות `rate`, `bonus_travel` (נסיעות), `missing_shift` וכל פנייה על שורת פיצוי לא ניתנות לתיקון בכלל. בכל המקרים האלה הפנייה נשארת `correction_pending`, החסם `OBJECTION_OPEN` נשאר, וההפקה חסומה לצמיתות. לא מוגדר אם אפשר לעבור מ-`correction_pending` ל-`reject`.
- **המלצה:** (א) להוסיף מעבר `correction_pending → resolved_accepted` עם סיבה וראיה, בלי תיקון במערכת ("תוקן במקור אחר" או "השיבוץ נוסף"), כשהשינוי מתגלה דרך ה-digest. (ב) להתיר `reject` גם מ-`correction_pending`. (ג) לקבוע היכן מנהלת פרויקטים מבצעת את התיקון: משטח במודול 6 או ב-ProtectedRoute מורחב. אחרת לכתוב במפורש שבשלב הזה רק מנכ"ל מתקן.
- **נימוק:** זו סתירה ל-§7.107 ("טיפול ותיקון לפי הרשאות") ומסלול שחוסם תשלום שכר.

**חובה 6: לפנייה אחרי הפקה אין משטח אצל המנהלת.** (§2.2 public_respond במצב `issued` · §4.1 סעיף 5 · §4.3 `payroll_report_detail`)
- **מה פתוח:** התוכנית (צעד 10 וחוזה הקישור האישי) קובעת: "After issue, record a post-issue case and notify its manager". החוזה שומר את הפנייה, אבל ההיסטוריה מחזירה רק `review:{review_id, counts}` ואין בה רשימת פניות. `view=review` לא מוגדר לביקורת שכבר הופקה. אין התראה. נמדד ב-grep: אין "task view" קיים ב-`src`. פנייה של דיילת אחרי הפקה תישמר ואיש לא יראה אותה. A28 ("post-issue records a case") יעבור בבדיקת המסד, והפנייה לא תטופל.
- **המלצה:** `payroll_report_detail` מחזיר `post_issue_cases[]` (מזהה, דיילת, קטגוריה, תאריך, סטטוס). בשורת ההיסטוריה יש מונה "פניות פתוחות". סעיף 5 של D כולל את פאנל הפנייה עם `close`.
- **נימוק:** סתירה לתוכנית, ופנייה שנבלעת היא בדיוק הכשל שהתוכנית אוסרת ("cannot silently disappear").

**חובה 7: ב-`resend_review` לא נמסרים שם הדיילת ומועד התגובה לתבנית.** (§3.1 `resend_review` · §2.1 צורת ההחזרה של `payroll_attempt_claim` · §2.3 `payroll_review_resend_reserve`)
- **מה פתוח:** התבנית האישית דורשת `[שם_דיילת]` ו-`[מועד_אחרון_לתגובה]`. ב-`processQueued` הם מגיעים מ-`payroll_review_queued_attempts`. ב-`resend_review` הבונה מקבל רק `{attempt_id}`, ו-`claim` מחזיר את `intended_recipient`, `recipient_id`, `period` ו-`template_name` בלי שם ובלי מועד. C ימציא קריאה, או ישלח עם שדות ריקים. במקרה השני `fillEmailTemplate` לא נכשל, כי הוא סורק את התבנית ולא את התוצאה.
- **המלצה:** `payroll_attempt_claim` יחזיר עבור ניסיון אישי גם `{hostess_name, deadline, supplement_seq}`, מתוך תמונת המצב של הנמען, כך ששני המסלולים ישתמשו באותו מקור.
- **נימוק:** חוסר התאמה בממשק בין B ל-C.

**חובה 8: סדר המיגרציות סותר את "B יכול לבדוק לבד".** (§1 מיגרציות 11 ו-14 · §5 שורת B · §7 שלב 5)
- **מה פתוח:** `payroll_review_cancel` (`OPERATION_ACTIVE`) וחישוב המוכנות (`OPERATION_ACTIVE`) של B במיגרציה 11 קוראים את `payroll_operations`, שנוצרת במיגרציה 14 של A. הטבלה הזו תלויה ב-7 בלבד. §5 אומר שבודקים את B על "Replica with A's migrations 1–6", ושם הקריאות האלה נכשלות ב-`relation does not exist`. plpgsql מקמפל בעצלות, אז ה-CREATE עצמו עובר. גם בייצור (§7 שלב 5) יש חלון בין 10–13 ל-14.
- **המלצה:** להעביר את ה-DDL של `payroll_operations` למיגרציה נפרדת של A שמספרה בין 7 ל-11 (למשל `…000750`), ולהשאיר ב-14 רק את ה-RPC.
- **נימוק:** אחרת B ישים stub או יוותר על החסם.

**חובה 9: התקינות של תבנית רואה החשבון ושל הנמען מוגדרת בשני מקומות, ובלי כלל.** (§4.3 `payroll_preview.accountant.{recipient_valid,template_valid}` של A · §2.2 חסמי `RECIPIENT_INVALID` ו-`TEMPLATE_INVALID` של B)
- **מה פתוח:** החוזה לא אומר מה הופך את תבנית רואה החשבון לתקינה. נמדד: ב-`TEMPLATE_PLACEHOLDERS` של הקליינט ה-required הוא `[חודש_דיווח_ושנה]`, ו-`[שם_רואה_חשבון]` מוסר. לא מוגדר גם מה הופך נמען לתקין: מבנה, או מעבר ב-guard? ולא ברור אם `RECIPIENT_INVALID` מתייחס לנמען רואה החשבון או לדיילות בלי מייל. A ו-B יממשו כל אחד כלל משלו, והתצוגה המקדימה תאמר "תקין" בזמן שהמוכנות חוסמת, או להפך.
- **המלצה:** פונקציה אחת של A, `_payroll_accountant_check() returns jsonb {recipient, recipient_valid, template_valid, unknown_tokens[]}`: ‏required `[חודש_דיווח_ושנה]`, optional `[שם_רואה_חשבון]`, וכל `\[[^\]\n]+\]` אחר לא תקין. גם `payroll_preview` וגם המוכנות קוראים לה. `RECIPIENT_INVALID` מתייחס לנמען רואה החשבון בלבד, וחסר מייל אצל דיילת נשאר `CONTACT_MISSING` בהפצה.
- **נימוק:** שני שערים לאותה עובדה, שכל אחד מהם בונה אחר.

**חובה 10: שחזור מתמונת מצב של זריעה מוחק את ראיות השכר ומבטל שיוכים, וזה מסלול לתשלום כפול.** (W0-2 · §1.2 · §7)
- **מה פתוח:** נמדד ש-`restore-seed-snapshot.sql` מריץ `truncate table public.%I cascade` על `salary_report_lines`, `salary_reports` ו-`assignments`. כל הטבלאות החדשות שיש להן FK ל-`salary_reports` או ל-`payroll_reviews` (attempts, reviews, recipients, tokens, cases, operations) יימחקו ב-CASCADE. TRUNCATE לא מפעיל את טריגר ה-guard. שחזור מ-`assignments_20260915` (0 משויכים) אחרי הפקת יולי יחזיר את 75 השורות של יולי למצב לא משויך. השלמת יולי תשלם אותן שוב. החוזה מסתפק בהערת README ובבדיקה ידנית של הסגן. סביר שזה בדיוק מה שקרה לאוגוסט: שורות נוצרו ב-09.09, ובתמונת המצב מ-15.09 יש 0 שיוכים.
- **המלצה:** (א) טריגר `BEFORE TRUNCATE` ברמת המשפט על `assignments`, `salary_reports` ו-`salary_report_lines` שמסרב אלא אם `_payroll_is_writer()` או GUC תחזוקה מפורש. (ב) רשת ביטחון בתוך `payroll_collect`: להחריג שיבוץ שיש לו שורה מוקפאת עם אותו `(source_project_id, hostess_id, assignment_number)`. השדה הזה נשמר משורות חדשות. (ג) סקריפט השחזור יסרב כשטבלאות השכר אינן ריקות.
- **נימוק:** כסף כפול דרך מסלול שכבר קרה פעם אחת (`n=1`, אבל הראיה ישירה). בדיקה ידנית אינה מנגנון.

---

## ג. ממצאי רשות

1. **הכותב הישן בודק לפני הנעילה** (§2.1 `generate_salary_report` שלבים 2–5). הבדיקות `PERIOD_EXISTS` ו-`PERIOD_IN_REVIEW` רצות לפני `_payroll_lock`. הכסף מוגן בזכות האינדקס הייחודי והשיוך המותנה, אבל ביקורת שנוצרת במקביל תיתקע מול דוח רגיל שכבר הופק. המלצה: לחזור על הבדיקות אחרי הנעילה. בנוסף, בדיקת המרוץ §6 #1 מצפה ל-`PAYROLL_BUSY` מהכותב הישן, אבל אין לו `lock_timeout` ולא מיפוי של `55P03`. צריך להוסיף את שניהם.
2. **`bonus` ו-`travel` של שורות פיצוי: null או 0?** (§2.1 `payroll_collect` מול §4.3: "null for compensation rows"). אם `payroll_collect` יחזיר null, הנוסחה `round(hours_raw*rate+bonus+travel,2)` תחזיר null. המלצה: ב-collect הערך הוא 0, ו-null רק בהצגה. לקבוע גם אם שורות ה-commit נשמרות עם `nullif(…,0)` כמו בכותב הישן. אחרת ההיסטוריה תציג 0 בדוחות חדשים ו-`—` בישנים.
3. **ה-commit לא מעדכן את `travel_amount`** (§2.3 שלב 8). הכותב הישן עדכן אותו. ה-guard מקפיא אותו אחרי השיוך, ו-`get_shift_invite` ו-`PublicConfirmPage` קוראים אותו (נמדד). המלצה: `set salary_report_id=…, travel_amount=<line travel>` באותו UPDATE.
4. **`project_status` בגיבוב הגרסה.** מעבר שגרתי מ-awaiting_invoice ל-awaiting_payment ל-finished (חשבונית או תשלום) מבטל את אישור המנהלת ואת ה-commit, בלי שום שינוי בכסף. המלצה: בשורת "actual" לגבב רק נתונים שמשפיעים על הכסף. `project_status` נשאר רק לשורות פיצוי.
5. **שדרוג נעילה דרך הטריגר.** נמדד: `recompute_project_status` מבצע `for update` על הפרויקט לפני היציאה המוקדמת. ה-commit מחזיק FOR SHARE, ולכן כל שיוך משדרג את הנעילה אחרי שכבר ננעלו טבלאות אחרות, וזה שובר את "fixed lock order". המלצה: לנעול את הפרויקטים החברים `for update` כבר בשלב 6. כך נסגרת גם הנקודה העיוורת ב-§8.
6. **`PERIOD_INVALID` לשנים לפני 2025** (§2.1 `_payroll_identity_check`). נמדד: בחודשים 2024-01 עד 2024-12 יש כ-1,500 שורות לא משויכות. אין להן אף מסלול, אפילו לא תצוגה מקדימה. זה עשוי להיות מכוון (נתוני זריעה), אבל התוכנית מתארת "Past period" ו-A15. המלצה: לכתוב את ההחלטה במפורש.
7. **הגבלת קצב לפי ה-IP הראשון ב-x-forwarded-for**, שנשלט בידי הלקוח (התקדים `feedback_rate_limit`, נמדד). עם טוקן של 256 ביט ההשפעה נמוכה. המלצה: לקחת את ה-IP האחרון ברשימה, או לתעד שזה מכוון.
8. **כתיבה ישירה לשיבוצים בידי 'דיילות' edit** (`assignments_write_by_permission`, ALL). תיקון שעות עוקף את `correct_unclaimed_assignment` ואת האודיט. הגיבוב תופס את הכסף אבל לא את מסלול הביקורת. המלצה: לתעד כמגבלה, או להקפיא שדות כסף בשורות של פרויקט סגור.
9. **ענף החשבוניות ב-send-email לא מוגן.** משתמש כספים edit יכול לשלוח כל XLSX לכל כתובת עם `entity_type:'invoice'`. ה-guard (D11) מכסה רק את `salary_report`. המלצה: לתעד, או לבדוק בענף invoice שהקובץ אינו בשם `*_Payroll_Report*`.
10. **זמן ריצה של ה-edge:** ‏8 × 25 שניות abort הם 200 שניות, יותר מ-150 שניות (הערך שהחוזה מצטט מהזיכרון). במקרה הגרוע ניסיונות ייתקעו כ-`sending`, ואחריהם `unknown`. המלצה: גודל אצווה לפי המקרה הגרוע, `floor((wall-20)/25)`, ולא לפי p95.
11. **המצב `issuing` של ביקורת לא נקבע בשום פונקציה.** גם `approve_no_response` ו-`resolve_case` לא בודקים `status='open'`, כך שאפשר לשנות החלטות אחרי הפקה. המלצה: להוריד את `issuing` או להגדיר אותו, ולהוסיף בדיקת `open`.
12. **"no sent attempt for the current revision"** (ב-distribute וב-approve_no_response): בניסיונות אין עמודת revision. לא מוגדר מה עושה `p_recipient_ids` מפורש במצב `initial`. דיילת שכתובת המייל שלה תוקנה, ושכבר יש לה ניסיון `sent` לכתובת הישנה, מגיעה רק דרך `reminder`. המלצה: "לרשומת הנמען הנוכחית", ורשימה מפורשת עוקפת את הסינון.
13. **`next_action` לא ממופה, ואין דופק.** אין דרך להבחין בין `preparing` שרץ לבין `preparing` שקרס, ו-D יציג "wait" לנצח. המלצה: `updated_at` מתעדכן בכל שלב, ו-`preparing` שלא התעדכן מעל 120 שניות מחזיר `resume`.
14. **הקלט לגיבוב הטוקן לא מוגדר** (בתים או טקסט). ההגדרה נכללת בחובה 4.
15. **מקורות ה-parity של C:** `templateWithoutAccountantName` ו-`salaryReportEmailSubject` נמצאים ב-`src/modules/08_finance/api.js:383,430`, לא ב-`src/lib/email.js`, ו-`formatTimestampFull` נמצא ב-`src/lib/dates.js:72`. צריך להוסיף אותם לרשימת הקריאה בלבד של C ב-§5.
16. **ב-W0-12** צריך לתקן את הבדיקה ואת מספר התקדים (ראו טבלה א).
17. **ב-W0-15 ברירת המחדל שגויה:** `listSalaryReports` (api.js:150–157) לא מסנן לפי `status`, ולכן ניסיון `unknown` יוצג כ"נשלח אל". גם השלמות יופיעו בדיאלוג הישן לפי period. המלצה: לסנן ל-`sent`, או להשאיר כמגבלה עד A3.
18. **פיצוי עם `cancelled_at` null, או בלי פרמטר נסיעות:** בכותב החי, null חוסם, ופרמטר חסר נותן 0 בשקט. החוזה לא מגדיר. המלצה: `COMP_HOURS_MISSING`, ו-`TRAVEL_PARAM_MISSING` כחסם.
19. **חידוש בידי משתמש אחר:** לא מוגדר מי ייכתב ב-`issued_by` (מי שהתחיל או מי שחידש). המלצה: `issued_by` הוא מי שעשה את ה-commit, ו-`actor_email` של הפעולה הוא מי שהתחיל.

---

## ד. תשובות לשש השאלות

1. **ממשקים פתוחים בין A, B, C ו-D:** חובה 2 (חתימת A↔B), חובה 7 (C↔B), חובה 9 (A↔B), חובה 8 (סדר), חובה 1 (`delivery_state` ל-D), רשות 2, 12, 13.
2. **מה שהמסד מכריע:** טבלה א. נסגרו W0-1, 9, 10, 11, 12, 13, 14, D1, גוף H3, טריגרים ונתוני יולי ואוגוסט.
3. **נכונות הכסף:** האיסוף שקול ל-H3 החי, חוץ מ-(a) חודש בלבד, (b) D1, שמשנה 25 שורות פיצוי חוצות-חצות משלילי לחיובי, ו-(c) השינויים בעיגול. הנעילות מונעות כפילות בין הכותבים החדש והישן ומול `close_project_operationally`: הפרויקטים זרים, כי הסגירה פועלת רק על `event_finished`. החורים: חובה 3 (ערך לא עדכני), חובה 10 (שחזור), רשות 1 ו-5.
4. **אבטחה:** טוקן 256 ביט וגיבוב בלבד, GET בלי כתיבת החלטות, ‏`{state:'invalid'}` גנרי, בלי מזהים, בנק או ת"ז. RLS ו-revoke מוגדרים לכל הטבלאות החדשות. storage מצומצם ל-`payroll/` ול-`salary_reports/`. ה-guard לא נעקף בנתיבי השכר. מגבלות: רשות 7, 8, 9.
5. **ענפים שלא צוירו:** חובה 5 (תיקון שאינו שעות או בונוס, ומי מתקן), חובה 6 (פנייה אחרי הפקה), רשות 6 (2024), רשות 12 (נמען שתוקן).
6. **קריאה כפולה:** חובה 3, רשות 2, 11, 12, 14, 19.

---

## ה. נקודות עיוורון של הבודק

- לא קראתי את מדריך ה-UX (`ux-guide.md`), את `SalaryReportDialog.jsx` במלואו, את `TemplateEditor.jsx` ואת סקריפט הרענון (רק grep).
- לא השוויתי את קובץ H3 בריפו לגוף החי, וקראתי רק את הגוף החי.
- את ניתוח המקביליות עשיתי בהיגיון ולא בהרצה. בפרט, ההתנהגות של `FOR SHARE` מול בדיקות FK (`FOR KEY SHARE`) בזמן ה-commit לא נבדקה.
- את מגבלות ה-edge (זמן ריצה, CPU) ואת תצורת Make לא מדדתי.
- את הקשר בין השחזור לאובדן השיוכים של אוגוסט הסקתי מתאריכים בלבד, `n=1`. הסבר מתחרה שלא נשלל: עדכון ידני.
- לא בדקתי את התנהגות PGlite מול advisory locks ו-GUC.
