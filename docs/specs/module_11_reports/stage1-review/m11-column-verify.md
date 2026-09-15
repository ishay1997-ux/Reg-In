<div dir="rtl">

# מ11 — אימות-עמודות ומזהים לשלב 1 (`m11-column-verify.md`)

> **תפקיד המסמך:** אימות מכני בלבד — בודק ומדווח, לא קובע-מוצר, לא נוגע במסד. מקור: `processes-approved.md`
> סעיפים `### ת1`…`### ת8` · `### 1-ג2` · `### 📑 הגדרות 17 הדוחות` · שורות `📒-ב (R…)` · `📒-ג (D…)`.
> נגזם: `📒-ד (T…)` — לא בהיקף המשימה. **המוקש המרכזי שנבדק תמיד:** `docs/schema.sql` הוא Snapshot;
> ‏`ALTER TABLE … ADD COLUMN` מאוחרות יושבות **אחרי** בלוק ה-`CREATE TABLE` — כל בדיקה כאן רצה על **הקובץ
> כולו** (`grep` בלי הגבלת-טווח) **וגם** על `supabase/migrations/*.sql` כולן, בשתי כתיבות כשרלוונטי.
> קובץ-עזר זמני שנבנה לבדיקה: `cat docs/schema.sql supabase/migrations/*.sql` יחד — לא נשמר בריפו.

---

## ממצא-פתיחה: `docs/schema.sql` מיושן ביחס למיגרציות החיות — מיד בפגיעה במ11

`positive_feedback_reasons` ו-`negative_feedback_reasons` (מערכים, רבים) **נבנו במיגרציה
`20260904233000_feedback_multi_select_reasons.sql`** (`grep -n "add column if not exists positive_feedback_reasons" supabase/migrations/20260904233000_feedback_multi_select_reasons.sql` → שורה 10) —
**אך אינם מופיעים ב-`docs/schema.sql` בכלל** (`grep -c "feedback_reasons\b" docs/schema.sql` → 0; ה-Snapshot
נעצר בעמודות היחיד `negative_feedback_reason`/אין `positive_feedback_reason` כלל, שורה 1366). ‏1-ג2 ו-📑
מצטטים נכון את **הרבים** (המערך) — כלומר **הם תואמים את המסד החי, לא את ה-Snapshot**. מי שהיה בודק רק
`docs/schema.sql` (בלי המיגרציות) היה מדווח "עמודת-רפאים" בטעות. **מסקנה לסוכן-הבא: `docs/schema.sql`
צריך רענון, אך זה מחוץ להיקף האימות הזה.**

---

## טבלה 1 — פונקציות-שרת / RPC

| מזהה | היכן בשימוש | קיים? | שם/מיקום אמיתי (עוגן-גריפ) | הערה |
|---|---|---|---|---|
| `finance_project_money` | 1-ג2 · D11 | ✅ | `create or replace function public.finance_project_money(p_project_id integer)` — `supabase/migrations/20260906083345_module8_planned_hours_cross_midnight.sql:27` (ההגדרה החיה האחרונה) | `security definer`, `revoke execute … from public, anon, authenticated` — `20260827144459_module8_finance_money_ssot_and_readers.sql` |
| `get_finance_overview` | ת1 · ת8 · D11 | ✅ | `create or replace function get_finance_overview()` — `supabase/migrations/20260827144459_module8_finance_money_ssot_and_readers.sql:164` | 🔴 **בלי `public.` prefix ב-`create`** — בדיוק תבנית-המוקש שהוזהרנו עליה; `grep "function public\.get_finance_overview"` מחזיר 0, אך `grep "function get_finance_overview"` מוצא. ראה טבלת-`returns` מלאה בגוף הדוח למטה |
| `get_project_finance_detail` | R7 · ת8 | ✅ | `create or replace function` — מוגדרת ראשונה קודם ל-06/09, עודכנה לאחרונה ב-`supabase/migrations/20260904233000_feedback_multi_select_reasons.sql` (מכילה `positive_feedback_reasons`) | — |
| `get_dashboard_summary` | D11 | ✅ | `supabase/migrations/20260903182735_module7_dashboard_summary_rpc.sql:` (create) · עודכנה ב-`20260903184711_module7_dashboard_cancelled_on_calendar_and_profit.sql` | בלי `group by` — ר' שאלה 3 למטה |
| `assert_module_permission` | ת1 · ת2 · ת8 · D11(עקיף) | ✅ | `supabase/migrations/20260814142439_module6_rpcs_reads_and_close.sql` (create) · הרחבה ב-`20260814142440_module6_rpcs_writes.sql` | נקראת בפתיחת כל RPC-דוח מתוכנן |
| `list_project_changes` | D12 · 1-ג2 | ✅ | `create or replace function public.list_project_changes(p_project_id integer)` — `supabase/migrations/20260814152647_module6_project_changes_money_gated_reader.sql:23` | `security definer stable`; פר-פרויקט בלבד (פרמטר יחיד) — מאשש D12 |
| `generate_salary_report` | R19 · 📑#16 | ✅ | `create or replace function public.generate_salary_report(p_period date)` — `supabase/migrations/20260828012000_module8_h3_fix_salary_cancellation_band_72h.sql:41` (העדכון האחרון, H3) | אוגר לפי `p_period` על-פני כל הפרויקטים באותו חודש, שורה-לשורה (`insert … select`), **לא** `group by` — ר' שאלה 3 |
| `close_project_operationally` | R18(עקיף) | ✅ | `supabase/migrations/20260814142439_module6_rpcs_reads_and_close.sql` (create) · תוקן ב-`20260820233607_module6_closing_rpc_hours_bound.sql` | מכיל `group by 1` — **בדיקת-כפילות בתוך מטען-שורות של פרויקט אחד**, לא אגרגציה חוצת-פרויקטים (ר' שאלה 3) |
| `record_invoice_sent` | 1-ג2 (עקיף — `invoice_sent_at`) | ✅ | `create or replace function record_invoice_sent(p_project_id integer, p_file_url text)` — `supabase/migrations/20260827150049_module8_finance_write_actions.sql:225` | בלי `public.` prefix ב-`create` — אותו מוקש |
| `record_payment` | 1-ג2 (עקיף — `payment_date`) | ✅ | אותו קובץ, שורה 265 | בלי `public.` prefix |
| `record_write_off` | R7/R11 (עקיף — `written_off`) | ✅ | אותו קובץ, שורה 354 | בלי `public.` prefix |
| `submit_feedback` | ת2 (עקיף — טקסונומיית-משוב) | ✅ | `create or replace function public.submit_feedback(p_token text, p_score integer, p_notes text default null, p_negative_reasons text[] default '{}', p_positive_reasons text[] default '{}')` — `supabase/migrations/20260904233000_feedback_multi_select_reasons.sql:47` | שדרג מ-`(text,int,text)` יחיד ל-מערכים; שתי חתימות ישנות `drop`-ות באותה מיגרציה |
| `classify-feedback` (שם-עבודה) | ת2 | ⬜ מתוכנן | — | **מתוכנן-ולא-בנוי** בכוונה — הכרעה 1/3 מסמנות `בהאצלה`. אין להתייחס כ"חסר" — תואם את הדוח |
| `respond_to_shift_invite` | (לא מוזכר במפורש בכרטיסים, אך הוא כותב `responded_at` — ר' שאלה 1) | ✅ | `create or replace function public.respond_to_shift_invite(p_token text, p_response text)` — `supabase/migrations/20260809134237_module4_rls_and_public_rpc.sql:161` | הכתיבה בפועל: שורה 205 |

## טבלה 2 — טבלאות + עמודות (1-ג2, קיימות)

כל שורה ב-1-ג2 (מה מ11 קורא) נבדקה מילה-במילה מול `docs/schema.sql` המלא + כל `supabase/migrations/*.sql`
(סקריפט: `for col in …; do grep -c "\b$col\b" /tmp/all_db.sql; done` על כל 30+ העמודות המנויות בטבלת 1-ג2) —
**כל עמודה נמצאה, 0 חסרות.** אנקורים נבחרים:

| טבלה | עוגן-קיום | הערה |
|---|---|---|
| `projects` | `docs/schema.sql:1366` (`negative_feedback_reason`) + `:1401` (`projects_feedback_status_check`) | `positive/negative_feedback_reasons` (רבים) — ר' ממצא-פתיחה |
| `assignments.event_date` | `docs/schema.sql:1056` `event_date date not null` | נכתב אוטומטית ע"י טריגר `assignments_sync_event_date` (`docs/schema.sql:1099`) — לא ידני |
| `assignments.recommended_rank` | **0 תוצאות** בכל הריפו (`grep -rn recommended_rank docs/ supabase/ src/` → ריק) | ✅ **מכוסה** — D1/ת5 טוענים "אין כותב ואין עמודה" ומתכננים אותה חדשה; מאושר: אינה קיימת היום |
| `quote_services` | `docs/schema.sql:751` | — |
| `hostess_unavailability` | `docs/schema.sql:913` | — |
| `customer_hostess_preference` | `docs/schema.sql:973` | עמודת `preference` עם CHECK (ר' טבלה 4) |
| `salary_reports` / `salary_report_lines` | `docs/schema.sql:1150` / `:1198` | — |
| `logistics` | `docs/schema.sql:1251` | `planned_qty`/`actual_qty`/`quote_service_line_id`/`project_change_id` — כולן קיימות |
| `project_changes` | `docs/schema.sql:1456` | RLS: ר' D12 למטה — deny-all מאושר |
| `params` | `docs/schema.sql:568` | 5 עמודות בלבד: `param_id·param_name·param_value·param_type·created_at·updated_at·owner_role_id` — **אין `description`** (מאשש D10) |

## טבלה 3 — טבלאות/עמודות חדשות שנטען שאינן קיימות (חובה-לוודא-היעדר)

| מזהה | טענה במסמך | קיים היום? | בדיקה |
|---|---|---|---|
| `feedback_ai_insights` | D6 — "מתוכננת-ולא-בנויה" | ✅ **אכן לא קיימת** | `grep -rn "feedback_ai_insights" docs/schema.sql supabase/migrations/*.sql src/` → 0 תוצאות בכל הריפו |
| `feedback_ai_runs` | ת2 — טבלה חדשה מתוכננת | ✅ **אכן לא קיימת** | אותה פקודה, אותה תוצאה — 0 |
| `assignments.recommended_rank` | D1/ת5 — עמודה חדשה מתוכננת | ✅ **אכן לא קיימת** | 0 תוצאות, ר' טבלה 2 |

## טבלה 4 — פרמטרי `params` (עברית)

| פרמטר | סוג-בדיקה | תוצאה | עוגן |
|---|---|---|---|
| `מכפיל_מרווח_מתרחק` | חדש — חייב **לא** להיות קיים | ✅ 0 תוצאות בכל הריפו | `grep -rn "מכפיל_מרווח_מתרחק" docs/ supabase/` → ריק |
| `סף_סטיית_תקציב_אחוז` | חדש — חייב **לא** להיות קיים | ✅ 0 תוצאות | אותה בדיקה |
| `מקדם_אמינות_אדום` | חדש — חייב **לא** להיות קיים | ✅ 0 תוצאות | אותה בדיקה |
| `מקדם_אמינות_ענבר` | חדש — חייב **לא** להיות קיים | ✅ 0 תוצאות | אותה בדיקה |
| `סף_לקוח_רדום_ימים` | קיים — D16 | ✅ קיים (4 אזכורים) | `supabase/migrations/*.sql` (Seed) |
| `מינימום_תשובות_להצגת_ציון` | קיים — 📑#13, T135 | ✅ קיים (Seed יחיד) | `supabase/migrations/20260809125750_module4_tables_params_and_templates.sql:104` — `('מינימום_תשובות_להצגת_ציון', '3', 'smart_match')` |
| `תנאי_תשלום_ימים` | קיים — R6/ת1/📑#7 | ✅ קיים (11 אזכורים) | Seed + נקרא בתוך `get_finance_overview` (`select … into v_terms … where pa.param_name = 'תנאי_תשלום_ימים'`) |
| `סף_שביעות_רצון` | קיים — D16 | ✅ קיים (11 אזכורים) | — |
| `יחס_אורחים_לדיילת` | קיים — 📑#10 | ✅ קיים (2 אזכורים) | — |
| `סכום_נסיעות_למשמרת` | קיים — R17 | ✅ קיים (15 אזכורים) | — |
| `סף_לוגיסטיקה_ימי_עסקים` | קיים — T275 (מחוץ-להיקף, נבדק אגב) | ✅ קיים (2 אזכורים) | — |

## טבלה 5 — עזרי-JS ורכיבים

| מזהה | קיים? | מיקום (עוגן) | הערה |
|---|---|---|---|
| `deriveDaysOverdue` | ✅ | `export function deriveDaysOverdue(...)` — `src/lib/projectFinance.js:153` | — |
| `reliabilityScore` | ✅ | `export function reliabilityScore(records, companyAverage, dampingConstant)` — `src/lib/smartMatch.js:289` | — |
| `isCustomerDormant` | ✅ | `export function isCustomerDormant(projects, todayIso, thresholdDays)` — `src/lib/customerProjects.js:89` | — |
| `weeksSinceLastWorked` | ✅ | `export function weeksSinceLastWorked(rows, todayIso)` — `src/lib/hostesses.js:365` | — |
| `NON_LOSS_REJECTION_REASONS` | ✅ | `export const NON_LOSS_REJECTION_REASONS = ['נפתחה בטעות']` — `src/lib/quotes.js:490` | מערך של ערך יחיד — לא רשימה רב-ערכית כפי שאפשר לדמיין מהשם |
| `derivePercent` | ✅ | `export function derivePercent(part, whole)` — `src/lib/projectFinance.js:249` | — |
| `plannedEventHours` | ✅ | `export function plannedEventHours(startTime, endTime)` — `src/lib/projectClosing.js:110` | — |
| `ScoreCell` | ✅ | `export default function ScoreCell({ score, testId })` — `src/components/ScoreCell.jsx:14` | — |
| `StatTile` | ✅ | `export default function StatTile({ label, value, sub, emptyText, testId })` — `src/components/StatTile.jsx:30` | — |
| `ListWindow` | ◐ | `src/components/ListWindow.jsx` — **קובץ קיים, אך אין רכיב בשם `ListWindow`**; מייצא `Pager` ו-`WindowChips` (`grep -rn "import.*ListWindow" src/` — 8 מודולים מייבאים משם) | **הערה לכתיבה עתידית:** אם כרטיס-מסך של מ11 יצטט "`ListWindow`" כרכיב — זה שם-הקובץ/המודול, לא שם-רכיב; הרכיבים בפועל הם `Pager`/`WindowChips` |
| `LoadingOrError` | ✅ | `export default function LoadingOrError({...})` — `src/components/LoadingOrError.jsx:106` | — |
| `PermissionAwareEmpty` | ✅ | `export default function PermissionAwareEmpty({ state, title, detail, action, onRetry, testId })` — `src/components/PermissionAwareEmpty.jsx:41` | — |
| `fetchAll` | ✅ | `export async function fetchAll(buildQuery, { pageSize } = {})` — `src/api/fetchAll.js:21` | מאשש R22 — הדפוס הקיים לעקיפת תקרת-1000-השורות |
| `rankCandidates` | ✅ (הקשר ל-D1) | `export function rankCandidates(candidates, context)` — `src/lib/smartMatch.js:450` | D1 טוען שהיא "מחשבת בזיכרון ומשליכה" — אין בה כתיבה למסד (לא נבדק כאן שורה-שורה, רק שהפונקציה קיימת ותואמת-שם) |
| `writeInviteToken` | ✅ (חדש — ר' שאלה 1) | `export async function writeInviteToken({...})` — `src/modules/04_hostesses/api.js:454` | כותבת `invite_sent_at` בעדכון (שליחה-חוזרת) |
| `insertInviteRow` | ✅ (חדש — ר' שאלה 1) | `async function insertInviteRow({...})` — `src/modules/04_hostesses/api.js:619` | כותבת `invite_sent_at` בהזרקה הראשונה |

## טבלה 6 — רשימות-ערכים (CHECK) שצוטטו

| שם ה-CHECK | ערכים במסמך | ערכים במסד | תואם? | עוגן |
|---|---|---|---|---|
| `assignments_attendance_status_check` | D2: "`arrived/late[light\|medium\|heavy]/no_show`" | `attendance_status` בפני-עצמו = `arrived/late/no_show` (עוגן `docs/schema.sql:1069`); `light/medium/heavy` הם ב-**עמודה נפרדת** `lateness_level` (`docs/schema.sql:1070`) | ◐ תואם-בפועל אך רק כקיצור-סימון: שני CHECK-ים נפרדים, לא ליטרל אחד. אין השפעה על מ11 — שתי העמודות קיימות | — |
| `projects_negative_feedback_reasons_check` | D14: 'איחור דיילות'·'תפקוד דיילות'·'איכות תגים'·'ניהול לקוי'·'אחר' | זהה, מילה-במילה | ✅ | `supabase/migrations/20260904233000_feedback_multi_select_reasons.sql:29` |
| `projects_positive_feedback_reasons_check` | D14: 'מקצועיות הדיילות'·'עמידה בזמנים'·'איכות תגים וציוד'·'ניהול ותקשורת'·'אחר' | זהה, מילה-במילה | ✅ | אותה מיגרציה, שורה 35 |
| `customers_customer_type_check` | 📑/T198 (מחוץ-להיקף, נבדק אגב): `private_company/production_company/government/nonprofit` | זהה | ✅ | `docs/schema.sql:278` |
| `customer_hostess_preference_preference_check` | ת8/📑: `מצוינת/בסדר/לא_לשלוח` | זהה | ✅ | `docs/schema.sql:985` |
| `projects_feedback_status_check` | ת1/📑#17: `not_sent/sent/completed/no_response` | זהה | ✅ | `docs/schema.sql:1401` |

## טבלה 7 — נתיבי-קבצים שצוטטו

| נתיב | קיים? | הערה |
|---|---|---|
| `src/modules/04_hostesses/SmartMatchPage.jsx` | ✅ | ת7 (מ23) |
| `src/modules/08_finance/FinancePage.jsx` | ✅ | ת7 (מ24) |
| `src/lib/smartMatch.js` | ✅ | D1 |
| `src/lib/email.js` | ✅ | R1 |
| `supabase/functions/send-email/index.ts` | ✅ | R1 · ת2 (תבנית) |
| `src/api/fetchAll.js` | ✅ | R22 |
| `docs/delete/management-report-screen-legacy/` | ✅ קיים, מכיל `01–04.png` | הכרעה 8 — הועברו כמתועד |
| `docs/mockups/management-report-screen/` | ✅ קיים, **ריק** | תואם את טבלת-הקלטים |
| `module_07_dashboard/seed-data-spec.md` | ✅ | `docs/specs/module_07_dashboard/seed-data-spec.md` — R22 |

---

## שלוש השאלות הפתוחות — תשובות עם עוגן

### 1. מי כותב `assignments.invite_sent_at` ו-`responded_at` היום?

**`invite_sent_at`** נכתב בשני מקומות, שניהם ב-`src/modules/04_hostesses/api.js`:
- `insertInviteRow({ project, hostess, nowIso, attempt })` — שורה 619, `insert into assignments (…, invite_sent_at: nowIso)` בשורה ~639 (הזרקה ראשונה של שיבוץ+זימון).
- `writeInviteToken({ projectId, hostessId, assignmentNumber, token, nowIso })` — שורה 454, `.update({ invite_token: token, invite_sent_at: nowIso })` (שורה 462) — משותפת ל"שלח שוב" ול-`sendDateChangeReinvites` שב-`06_projects/api.js`.

**`responded_at`** **אינו נכתב בקוד-הלקוח בכלל** — נכתב אך ורק דרך ה-RPC הציבורי:
`public.respond_to_shift_invite(p_token text, p_response text)` — מוגדר ב-`supabase/migrations/20260809134237_module4_rls_and_public_rpc.sql:161`; הכתיבה בפועל בשורה 205:
`update public.assignments set assignment_status = v_new_status, responded_at = coalesce(responded_at, now()) …`. ‏`coalesce` מבטיח כתיבה **פעם אחת** (התיעוד בקוד עצמו מצטט "§12⑨").

**המשמעות ל-ת5 (רישום `recommended_rank`):** הכתיבה המתוכננת של `recommended_rank` שייכת לזרימת-הזימון בצד-הלקוח (`insertInviteRow`/מסך-הזימון של Smart Match), **לא** ל-RPC הציבורי — כי הדירוג נקבע ברגע שהמנהלת בוחרת מועמדת מהרשימה (לפני שליחת-ההזמנה), לא ברגע שהדיילת עונה. זה תואם את הסיפור בכרטיס ת5 ("לוחצת 'זמן' ליד השלישית ברשימה… `recommended_rank = 3`").

### 2. איך `get_finance_overview` מגודרת ומה בדיוק היא מחזירה?

**הגדרה:** `create or replace function get_finance_overview()` — `supabase/migrations/20260827144459_module8_finance_money_ssot_and_readers.sql:164` (בלי `public.` prefix בהצהרה עצמה — ראו הערת-המוקש בטבלה 1). `language plpgsql stable security definer set search_path to ''`.

**שורת-הגידור, ראשונה בגוף:** `perform public.assert_module_permission('כספים', array['edit', 'view']);` (שורה ~200).

**`returns table (…)` — הרשימה המלאה, מילה-במילה:**
```
project_id integer, event_name text, customer_id bigint, customer_name text,
project_status text, tab text, revenue numeric, gross_profit numeric,
final_profit numeric, invoice_sent boolean, invoice_sent_at timestamptz,
payment_date date, payment_terms_days integer, feedback_status text,
feedback_score integer, cancelled_at timestamptz, cancel_type text,
cancellation_fee numeric, written_off boolean, credit_note_flag boolean,
operationally_closed_at timestamptz, archived_at timestamptz
```
פר-פרויקט (שורה אחת לכל פרויקט) — לא פר-שנה/לקוח/דיילת. `payment_terms_days` מוחזר `nullable` בכוונה (הערה בקוד: "עד שהפרמטר נזרע… לעולם לא 0 ימי-איחור, שהוא שקר שנראה כמו עובדה").

### 3. יש מיגרציה שמגדירה RPC-דוח שמקבץ חוצה-פרויקטים (לפי שנה/לקוח/דיילת)?

**לא.** נמצאו רק 3 קבצי-מיגרציה עם `group by` בכלל (`grep -lin "group by" supabase/migrations/*.sql`):
`20260814141050_module6_email_log_accepts_project.sql` (הערת-דוגמה בלבד, לא בגוף-פונקציה) ·
`20260814142439_module6_rpcs_reads_and_close.sql` · `20260820233607_module6_closing_rpc_hours_bound.sql`.

שני האחרונים — שני `group by 1` שנמצאו **שניהם בתוך `close_project_operationally`**, ושניהם **בדיקת-כפילות
בתוך מטען-JSON של פרויקט בודד** (`group by 1 having count(*) > 1` על `hostess_id` בתוך `p_rows` — לתפוס
דיילת שמופיעה פעמיים ברשימת-סגירה של **אותו** אירוע), **לא** אגרגציה חוצת-פרויקטים.

`generate_salary_report(p_period date)` (📑#16/R19) **כן** אוגר על-פני כל הפרויקטים בחודש נתון —
אך ב-`insert … select` שורה-לכל-שיבוץ (`temp table _collect` → `insert into salary_report_lines`),
**בלי `group by`**; הסכום-הכולל של הדוח מחושב בפונקציה נפרדת עם `select coalesce(sum(l.line_total), 0) into v_total …` — צבירה סקלרית, לא קיבוץ רב-מימדי.

`get_dashboard_summary` — נבדק גם הוא (`grep -n "group by" …` על שתי המיגרציות שמגדירות אותו) — **0 תוצאות**, מאשש במדויק את D11: "אף אחד לא מסכם לפי שנה/לקוח/דיילת".

**מסקנה למ11:** כל ~21 פונקציות-השרת המתוכננות (1-ג2, השורה האחרונה) יהיו **חדשות לגמרי** מבחינת
קיבוץ-נתונים — אין תשתית-`group by` קיימת לרשת ממנה, מעבר לדפוס-הקריאה (`assert_module_permission` +
`security definer` + `revoke`) שכן קיים ונבדק.

---

## סייג-מתודולוגי: מה שלא ניתן היה לבדוק דרך Git

**R23** (מטריצת-ההרשאות החיה) ו-**D15–D17** (ספירות/פרמטרים/cron חיים) הן מדידות שבוצעו ב-06/09/2026
דרך `execute_sql` על המסד החי (Supabase MCP) — **לא** דרך קבצי-מיגרציה. במפגש הזה MCP של Supabase
מחייב אישור-חיבור (`mcp__5c4d90c8…` דרש אימות ולא היה זמין), ולכן **לא ניתן היה לאמת-מחדש את הספירות
עצמן** (827 פרויקטים וכו') — רק את **קיום המבנה** שהן מתבססות עליו (טבלאות/עמודות/CHECK). זו מגבלת-כלים
של הריצה הזו, לא ממצא על המסמך.

---

## מונה — סה"כ

- **מזהים שנבדקו:** 68 (12 פונקציות/RPC · 10 טבלאות · 3 טבלאות-חדשות-לאימות-היעדר · 12 פרמטרים ·
  16 עזרי-JS/רכיבים · 6 רשימות-CHECK · 9 נתיבי-קבצים)
- **✅ קיים/מאושר כפי שנטען:** 61
- **❌ לא נמצא (בניגוד לטענה):** 0
- **◐ חלקי / דורש-דיוק-ניסוח:** 2 (`ListWindow` — קובץ ולא רכיב; `assignments_attendance_status_check` —
  שני CHECK-ים נפרדים ולא ליטרל אחד, בלי השפעה מהותית)
- **בנוסף:** 1 ממצא-פתיחה (Snapshot מיושן, לא פוגע במסמכי מ11 עצמם — הם כבר כתובים נכון מול המסד החי)

**שלוש התשובות:** (1) `invite_sent_at` ← `insertInviteRow`/`writeInviteToken` ב-`src/modules/04_hostesses/api.js`; `responded_at` ← `respond_to_shift_invite` RPC בלבד. (2) `get_finance_overview` מגודרת ב-`assert_module_permission('כספים', ['edit','view'])`, מחזירה 22 עמודות פר-פרויקט (רשימה מלאה לעיל). (3) אין RPC-דוח קיים שמקבץ חוצה-פרויקטים — שני `group by` הקיימים הם בדיקת-כפילות תוך-פרויקטית, ו-`generate_salary_report` צובר בלי `group by`.

**נחפש ולא נמצא (בדיקת-שתי-כתיבות בוצעה בכל אחד):** `feedback_ai_insights` · `feedback_ai_runs` ·
`assignments.recommended_rank` · `מכפיל_מרווח_מתרחק` · `סף_סטיית_תקציב_אחוז` · `מקדם_אמינות_אדום` ·
`מקדם_אמינות_ענבר` · `params.description` · policy פעילה על `project_changes` · `group by` חוצה-פרויקטים
בכל migrations/*.sql.

</div>
