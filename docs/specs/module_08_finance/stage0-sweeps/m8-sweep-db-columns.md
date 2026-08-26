# מ8 — סריקת-DB חיה (עמודות, RLS, RPCs, params, buckets)

**מקור:** Supabase MCP, project_id `yfeovxppnfoafmfbdfvh`, קריאה-בלבד (SELECT / information_schema / pg_catalog / pg_policies / storage.*).
כל שורה כאן **מהמסד החי**, לא מ-`docs/schema.sql`, אלא אם צוין אחרת במפורש עם התג `[schema.sql]`.
גרפ בקוד: `Grep` על `C:\Users\ishay\Reg-In\src` (Read-only, שום כתיבה בוצעה).

---

## 🚨 TOP MINE — RLS בפועל על טבלאות-הכספים (לא הנחה, לא schema.sql)

| טבלה | RLS enabled | policies חיות | תוצאה בפועל ל-client רגיל |
|---|---|---|---|
| `salary_reports` | true | **0 (אפס!)** — `pg_policies` לא מחזיר אף שורה עבור הטבלה | **deny-all מוחלט**: `select()`/`insert()`/`update()` כולם מחזירים `{data:[], error:null}` / `{data:null,error:null}` — לא שגיאה. אושר: `SELECT count(*) FROM pg_policies WHERE tablename='salary_reports'` → 0 שורות. |
| `projects` | true | **1 בלבד: `projects_select_by_permission` (SELECT)** | **אין policy-כתיבה כלל** — לא `UPDATE`, לא `INSERT`, לא `ALL`. `.from('projects').update(...)` מכל client (כולל מנכ"ל) ייכשל בשקט (0 שורות, error:null). כל כתיבה לעמודות-הכספים של projects **חייבת** לעבור RPC מסוג `SECURITY DEFINER` — ואומת: `src/modules/06_projects/CLAUDE.md` מצהיר את זה במפורש ("כל כתיבה היא RPC — אין ולו `.from().update()` אחד במודול"). |
| `assignments` | true | 2: `assignments_select_by_permission` (SELECT, מודול **'דיילות'**), `assignments_write_by_permission` (ALL, מודול **'דיילות'**) | קריאה/כתיבה ישירה **אפשריות** למי שיש לו `edit`/`view` על מודול 'דיילות' — **לא** על מודול 'כספים'. ⚠️ ראו ממצא למטה: עמודות-השכר (`personal_bonus`, `travel_amount`, `salary_report_id`) יושבות בטבלה שגודרת לפי הרשאת-דיילות, לא הרשאת-כספים. |
| `quotes` | true | 2: SELECT + ALL(write), שתיהן על מודול **'הצעות מחיר'** | אין policy על מודול 'כספים'. עמודות-ההקפאה (`vat_rate_snapshot` וכו') נקראות דרך הרשאת הצעות-מחיר. |
| `quote_services` | true | 2: SELECT + ALL(write), שתיהן על מודול **'הצעות מחיר'** | כנ"ל. |
| `params` | true | 2: `params_select_all_authenticated` (SELECT, `true` — כל authenticated) · `params_write_ceo_only` (ALL, מודול **'הגדרות מערכת'**) | קריאה פתוחה לכולם, כתיבה רק למנכ"ל/הגדרות-מערכת. |
| `email_log` | true | 3 SELECT-בלבד, מפוצלות לפי `entity_type`: `project`/`project_report`→מודול 'פרויקטים', `quote`→'הצעות מחיר', `shift`→'דיילות' | **אין policy-SELECT על `entity_type` עתידי כלשהו של מ8** (למשל אם ייווסף 'invoice'/'salary_report') ו**אין policy-כתיבה בכלל** — היומן נכתב רק ע"י Edge Function עם service-role (מתועד גם ב-COMMENT על הטבלה עצמה, ראו למטה). |

**מסקנה ל-TOP MINE:** ההערה ב-`src/CLAUDE.md` ("כרגע deny-all: `salary_reports` (מ8) · `logistics` (מ5)") **מאומתת נכונה, מילה במילה, נכון לרגע הסריקה** — אין policies על `salary_reports`, אפס. זו לא רק "הצהרה במסמך" — נבדק ישירות מול `pg_policies`.

---

## 1. `projects` — עמודות-כספים

מקור: `list_tables(verbose=true)` החי (לא schema.sql).

| column | type | who WRITES today (anchor) | who DISPLAYS today (anchor) | verdict |
|---|---|---|---|---|
| `invoice_sent` | boolean, default `false` | RPC `set_project_finance_fields(p_invoice_sent,...)` — **קיים חי ב-DB** (`prosecdef=true`, דורש `assert_module_permission('כספים', ['edit'])`) — אבל **grep `set_project_finance_fields` על כל `src/` = 0 תוצאות**. שום קומפוננטה לא קוראת ל-RPC הזה. | 0 תוצאות ל-`invoice_sent` בכל `src/modules/**` | **finding**: RPC מוכן ומגודר-הרשאה, אבל **אין קורא בכלל** — לא כתיבה, לא תצוגה. |
| `payment_date` | date, nullable | אותו RPC `set_project_finance_fields` — לא נקרא משום מקום | 0 תוצאות | **finding** — זהה לעיל |
| `feedback_status` | text, check `not_sent/sent/completed/no_response`, default `not_sent` | **RPC אחר**: `mark_feedback_survey_sent(p_project_id)` — קורא ל-DB דרך `src/modules/06_projects/api.js:397`, מודול **'פרויקטים'** (לא 'כספים'!) קובע רק `'sent'`. ⚠️ **אף RPC לא מוצא ב-DB שקובע `'completed'` או `'no_response'`** — חיפוש `prosrc ILIKE '%feedback_status%'` החזיר רק `close_project_operationally` (לא נוגע בעמודה זו בפועל, רק בשליפה), `get_shift_invite` (לא רלוונטי), `mark_feedback_survey_sent`. | `ClosingTab.jsx` (מודול 6) קורא ומציג | **finding**: שני ערכי-ה-CHECK `completed`/`no_response` **קיימים בסכימה אך אף קוד לא כותב אליהם** — מ8 צריך להחליט מי/מתי סוגר את הלולאה (אולי כשdohcon ה-feedback_score נשמר → completed?). |
| `feedback_score` | integer 1-5, nullable | RPC `set_project_finance_fields(p_feedback_score,...)` — 0 קוראים ב-src | 0 תוצאות | **finding** |
| `negative_feedback_reason` | text, check 5 ערכים+NULL | אותו RPC, 0 קוראים | 0 תוצאות | **finding** |
| `feedback_notes` | text, nullable | אותו RPC, 0 קוראים | 0 תוצאות | **finding** |
| `actual_guests` | integer, nullable | RPC `close_project_operationally(p_actual_guests,...)` — **נקרא בפועל**: `src/modules/06_projects/ClosingTab.jsx` (מודול 6, לא 8!) | `ClosingTab.jsx:1205` (`project?.actual_guests`) — תצוגה אחרי-נעילה. הערת-קוד ב-`ProjectCardPage.jsx:515` אומרת במפורש "actual_guests שייך למשטח 5 ואינו קלט-חיוב" | **ok** — אבל שייך למ6, לא נוגע ישירות במ8 (רק קלט-גלם אפשרי לנוסחת-רווח) |
| `actual_hours` | numeric, nullable | RPC `close_project_operationally(p_actual_hours,...)` — מ6 | `ClosingTab.jsx:1196,1202` | **ok** — שייך למ6 |
| `summary_report_url` | text, nullable | RPC `close_project_operationally(p_report_path,...)` — מ6, `closingApi.js` מעלה ל-bucket `reports` | `ClosingTab.jsx`, `closingApi.js` (`getReportSignedUrl`/`downloadReportAsBase64`) | **ok** — מ6, לא מ8 |
| `cancel_reason`, `cancelled_at`, `cancelled_by`, `cancel_type` | — | RPC `cancel_project` — מ6 | `CancelProjectDialog.jsx` — מ6 | **ok**, לא כספים |
| `operationally_closed_at`, `operationally_closed_by` | — | `close_project_operationally` — מ6 | `ClosingTab.jsx` | **ok**, לא כספים |

**שורת-אמת חיה יחידה** (הפרויקט היחיד שעבר סגירה-תפעולית, `project_id=12`, "כנס משקיעים שנתי"):
`invoice_sent=false, payment_date=null, feedback_status='sent', feedback_score=null, actual_guests=100, actual_hours=6, summary_report_url='12/1787260019354_e2e-summary-report.png'`.

---

## 2. `assignments` — חומר-הגלם לשכר

| column | type | who WRITES (anchor) | who DISPLAYS (anchor) | verdict |
|---|---|---|---|---|
| `hourly_rate_snapshot` | numeric | `src/modules/04_hostesses/api.js:483` — `hourly_rate_snapshot: hostess.hourly_rate` בזמן יצירת-שיבוץ (הקפאה חד-פעמית, מ4). **לעולם לא נכתב שוב** — `api.js:739` מעיר זאת במפורש. | `TeamTab.jsx:499` (`<Money amount={row.hourly_rate_snapshot}/>`), `src/lib/projectClosing.js:hostessActualCost()` (מ6, **מחשב עלות-שעות אבל לא מציג רווח**), `get_shift_invite` RPC (מציג לדיילת בזימון) | **ok** — אבל שימו לב: `hostessActualCost` ב-`projectClosing.js` **כן קיים ומחשב** `actualHours × hourlyRateSnapshot`, אך הפלט שלו **אינו מוצג בשום מסך** (grep על שם הפונקציה מוגבל ל-`projectClosing.js`/`.test.js` בלבד) — פונקציה יתומה מבחינת-UI, מוכנה לשימוש עתידי (כנראה מ8). |
| `personal_bonus` | numeric, default `0` | **אף אתר-קריאה** — `grep "personal_bonus" src/` = **0 תוצאות בכלל**, גם לא בהערה | **0 תוצאות** | **nobody-touches** — עמודה קיימת, כל 27 השורות החיות = `0`, שום קוד לא נוגע בה בכלל (לא UI, לא RPC prosrc). |
| `travel_amount` | numeric, default `0.00` | **0 כתיבות לעמודת-הטבלה עצמה.** קיים שימוש יחיד ב-`PublicConfirmPage.jsx:136` — אך זה קורא `invite?.travel_amount` מ-**תשובת ה-RPC `get_shift_invite`**, שמחזירה את **ערך-הפרמטר הגלובלי** `סכום_נסיעות_למשמרת` (params, כרגע `0`) — **לא** את עמודת `assignments.travel_amount` הפר-שיבוץ. | כנ"ל — מקור שונה מהעמודה עצמה | **finding**: עמודה פר-שיבוץ קיימת ב-DB (מאפשרת נסיעות שונות לכל דיילת), אבל כל הזרימה החיה משתמשת בפרמטר-גלובלי אחיד במקומה. ייתכן וזו בדיוק הפער שמ8 אמור לסגור (למשל: מ8 עורכת travel_amount פר-דיילת לפני שליחת-דוח-שכר). |
| `salary_report_id` | integer, nullable, FK→`salary_reports.report_id` | **0 תוצאות בכל src/**, וגם 0 תוצאות ב-`prosrc` של כל פונקציות ה-DB (`ILIKE '%salary_report_id%'` = ריק) | 0 תוצאות | **nobody-touches** — גם בקוד וגם באף RPC. כל 27 השורות החיות = `NULL`. |
| `attendance_status`, `lateness_level`, `no_show_reason` | text, check | `close_project_operationally` — מ6, per-row מתוך `p_rows` | `ClosingTab.jsx`, `projectClosing.js` (`ATTENDANCE_OPTIONS`) | **ok** — מ6, קלט-גלם למ8 |
| `actual_hours` (assignments, לא projects) | numeric, default `0` | `close_project_operationally` — מ6 | `TeamTab.jsx`, `closingDraft.js` | **ok** — מ6 |
| `is_shift_lead` | boolean | `src/modules/04_hostesses/api.js:710` (`.update({is_shift_lead})`) — מ4 | `TeamTab.jsx`, `SmartMatchPage.jsx` | **ok** — לא כספי, מ4/מ6 |

**שורת-אמת חיה:** 27 שיבוצים בכל בסיס-הנתונים, ובכולם `personal_bonus='0'`, `travel_amount='0.00'`, `salary_report_id=null` ללא יוצא מן הכלל — אין אף מקרה-בדיקה שממלא אותם.

---

## 3. `salary_reports` — מבנה מלא + RLS + rows

```
report_id        integer PK, identity
sent_date        date, NOT NULL (אין default)
report_file_url  text, NOT NULL (אין default)
created_at       timestamptz, default now()
updated_at       timestamptz, default now()
```
FK נכנס: `assignments.salary_report_id → salary_reports.report_id`.

- **RLS:** `rls_enabled=true`, **0 policies** (ראו TOP MINE למעלה).
- **rows חיות:** **0** (`SELECT count(*) FROM public.salary_reports` → 0).
- **קוד:** `grep "salary_reports" src/` → **קובץ יחיד: `src/CLAUDE.md`** (אזכור תיעודי בלבד, לא קוד-אפליקציה). אין `api.js`, אין קומפוננטה, אין query.
- **RPC:** אף פונקציה ב-`pg_proc` (סכימת `public`) לא מזכירה `salary_reports` בגוף שלה (`prosrc ILIKE '%salary_reports%'` → 0 שורות).

**verdict: nobody-touches — הטבלה שלמה (מבנה + כתיבה + קריאה + RPC) קיימת רק כ-DDL ריק. מ8 בונה הכול מאפס.**

---

## 4. `quotes` / `quote_services` — עמודות-הכנסה-קפואה (לנוסחת-רווח)

| טבלה.עמודה | type | הערה |
|---|---|---|
| `quotes.vat_rate_snapshot` | numeric, nullable, 0–100 | מע"מ קפוא בזמן ההצעה. **בשימוש חי נרחב** — `src/lib/quotes.js:565,696`, `ScopeChangeDialog.jsx:235,629`, `customers.js` (חישוב שווי-לקוח). "הצעה מאושרת נשענת על vat_rate_snapshot הקפוא, גם כשהמע״מ הנוכחי שונה" (§7.51, מצוטט ב-`customers.test.js:260`). |
| `quotes.applied_customer_discount`, `quotes.manual_discount` | numeric 0–100 | הנחות קפואות ברמת-הצעה. |
| `quote_services.closing_unit_price` | numeric | **מחיר-מכירה קפוא לשורה** — בשימוש נרחב (הכנסה: `ScopeChangeDialog`, `quotes.js`, `customers.js`). |
| `quote_services.closing_unit_cost` | numeric | **עלות-קנייה קפואה לשורה** (נקבעת בשרת מ-`product_costs.cost` בזמן אישור-הצעה, "הלקוח לעולם לא שולח/רואה את זה" — `quotes.js:229,370`). ⚠️ **grep מקיף מראה שהעמודה הזו כמעט ולא נקראת בשום מקום מלבד הערות-קוד ובדיקות** — אין אתר-קריאה יחיד שמצרף אותה לחישוב-רווח בפועל היום. |

**finding:** צד-ההכנסה (`closing_unit_price`) בשימוש עשיר בכל המערכת (LTV לקוח, שינויי-תכולה). צד-העלות (`closing_unit_cost`) **מוקפא בשרת ומעולם לא נצרך** — אין שום קוד שמחשב `Σ(price−cost)×qty`. תואם ישירות את ההערה המפורשת ב-`src/lib/projectClosing.js:7-8`:
> `"🚫 בכוונה: אין כאן שום חישוב-רווח, בונוס או נסיעות (AR-6 · ㉟ · R-2 — הכרעת-ישי). מ6 מקפיא קלטים בלבד; מ8 גוזר מהם רווח ושכר בחלון שלו."`
זו הכרעת-ישי **מצוטטת ומעוגנת בקוד עצמו** (לא רק בזיכרון) — מ8 היא, במפורש, החלון היחיד שאמור לחשב רווח-גולמי. שום מודול אחר לא עושה זאת ולא אמור.

---

## 5. `params` — שורות רלוונטיות-כספים (חי)

| param_name | param_value | param_type |
|---|---|---|
| `אחוז_מעמ` | `18` | pricing_timing |
| `שכר_מינימום_שעתי` | `35` | pricing_timing |
| `סכום_נסיעות_למשמרת` | `0` | pricing_timing |
| `מייל_משרד_רואי_חשבון` | `office@cpa-firm.co.il` | integration_tech |

### תבניות-מייל (param_type='templates') — שלוש הרלוונטיות למ8, מלל מלא + placeholders:

**`תבנית_מייל_חשבונית_מס`** (חשבונית ללקוח):
placeholders: `[שם_לקוח_חברה]`, `[שם_פרויקט]`. גוף קצר — "מצורפת בזאת חשבונית מס/קבלה עבור השירותים שסופקו באירוע...". חתומה "מחלקת כספים, REG-IN".

**`תבנית_מייל_משוב_לקוח`** (סקר-שביעות-רצון) — ⚠️ **זו נשלחת כבר היום ע"י מודול 6**, לא מ8 (ראו §8):
placeholders: `[שם_איש_קשר]`, `[שם_פרויקט]`, `[לינק_לשאלון_שביעות_רצון]`.

**`תבנית_מייל_דוח_שכר`** (דוח-שכר לרו"ח):
placeholders: `[שם_רואה_חשבון]`, `[חודש_דיווח_ושנה]`. גוף: "מצורף בזאת קובץ אקסל המרכז את שעות העבודה... כולל פירוט תעריפים, שעות בפועל ובונוסים, לאחר שעבר בקרה ואישור במערכת".

**verdict:** שלוש התבניות **קיימות ומלאות ב-DB** (לא צריך ליצור/לנסח אותן). **אף אחת מהשתיים (חשבונית / דוח-שכר) לא נשלחה אף פעם** — 0 שורות ב-`email_log` עבורן (ראו §6). המשוב-ללקוח **כן** נשלחה (5.08.2026, פעם אחת, ע"י מ6).

---

## 6. `email_log` — entity_type CHECK (חי) + היסטוריית-שימוש

**CHECK constraint בפועל (מ-`list_tables`, לא מ-snapshot):**
```
entity_type = ANY (ARRAY['quote'::text, 'shift'::text, 'project'::text, 'project_report'::text])
```
**אין ערך `invoice` / `salary_report` / `feedback` ברשימה.** מ8 שרוצה יומן-שליחה ייעודי (חשבונית/דוח-שכר) חייבת או להרחיב את ה-CHECK (מיגרציה) או לעשות-overload לערך קיים (`project`/`project_report`) כמו שה-feedback עושה כבר.

**כל 32 השורות החיות, לפי (entity_type, template_name):**
| entity_type | template_name | count |
|---|---|---|
| project | תבנית_מייל_משוב_לקוח | 1 |
| project_report | (null) | 1 |
| quote | תבנית_מייל_הצעת_מחיר | 5 |
| shift | תבנית_אישור_סופי_שיבוץ | 5 |
| shift | תבנית_זימון_משמרת | 19 |
| shift | תבנית_מייל_שחרור_משמרת | 1 |

שתי השורות הרלוונטיות ל-M8 (שתיהן מ-project_id=12, תרחיש E2E יחיד ב-20/08/2026, sent_by=`projects.test@regin.co.il`, recipient=`ishay1997@gmail.com`):
- `project_report` / subject "דוח-סיכום האירוע — E2E-תרחיש-סגירה" — **זהו מייל הדוח-לצרכן/לקוח שמ6 שולחת עם קובץ-הסגירה, לא דוח-שכר**.
- `project` + `תבנית_מייל_משוב_לקוח` / subject "סקר שביעות רצון — E2E-תרחיש-סגירה".

**finding:** `תבנית_מייל_חשבונית_מס` ו-`תבנית_מייל_דוח_שכר` — **0 מופעים ב-`email_log` אי-פעם**. שני ערוצי-המייל המרכזיים של מ8 מעולם לא נבדקו קצה-לקצה.

**COMMENT חי על הטבלה** (מ-`list_tables`): *"יומן שליחות מיילים — מקור-האמת ל'האם נשלח'. גנרי לפי (entity_type, entity_id). נכתב ע"י Edge Function בלבד (service-role); הלקוח קורא ולא כותב. הוקדם ממודול 10 בהכרעת-ישי 30/07/2026."*

---

## 7. Storage buckets (חי, `storage.buckets`)

| id | public | file_size_limit | allowed_mime_types | created_at | rows בפועל |
|---|---|---|---|---|---|
| `marketing` | **true** | (לא נבדק כאן — מחוץ לסקופ) | — | 10/07/2026 | — |
| `reports` | **false** (פרטי) | 2,097,152 (2MB) | pdf, jpeg, png | 14/08/2026 | **1** אובייקט, 70 bytes (קובץ-בדיקת E2E) |
| `finance` | **false** (פרטי) | 10,485,760 (10MB) | pdf, jpeg, png | 14/08/2026 | **0** אובייקטים |

שני ה-buckets `reports`/`finance` נוצרו **באותו רגע בדיוק** (14/08/2026 11:05:58) — כלומר הוקצו יחד מראש, לא אחד-אחרי-השני אד-הוק.

**RLS על `storage.objects` (חי, `pg_policies`):** ל-bucket `finance` יש **ארבע policies מלאות ותקינות** (SELECT/INSERT/UPDATE/DELETE), כולן מגודרות `bucket_id='finance' AND permission_level ON module 'כספים'` — **מבנה-הרשאות זהה בדיוק לתבנית של `reports`** (שם מגודר על מודול 'פרויקטים'). כלומר: **התשתית להעלאת/הורדת קבצי-כספים (חשבוניות, קובצי-שכר) כבר בנויה ומוכנה ב-100%**, ומחכה רק לקוד-לקוח שיקרא לה — בדיוק כמו שה-RPC `set_project_finance_fields` מוכן ומחכה.

---

## 8. RPCs/functions שנוגעים ב-close/invoice/payment/feedback/salary/finance/project (חי, `pg_proc`)

חיפוש `proname ILIKE` על כל אחת מהמילים `close/invoice/payment/feedback/salary/finance/project`:

| function | args | security definer | שייכת בפועל למודול | נקראת מ-src? |
|---|---|---|---|---|
| `approve_quote_and_create_project` | p_quote_id | ✅ | מ3→מ6 | כן (מ3) |
| `cancel_project` | p_project_id, p_cancel_type, p_cancel_reason | ✅ | מ6 (permission 'פרויקטים') | כן — `CancelProjectDialog.jsx` |
| `close_project_operationally` | p_project_id, p_actual_hours, p_actual_guests, p_report_path, p_rows | ✅ | מ6 (permission 'פרויקטים') | כן — `ClosingTab.jsx` |
| `list_project_changes` | p_project_id | ✅ | מ6 | כן |
| `list_projects_overview` | — | ✅ | מ6 | כן |
| `mark_feedback_survey_sent` | p_project_id | ✅ | מ6 (permission **'פרויקטים'**, לא 'כספים'!) | כן — `api.js:397` |
| `recompute_project_status` | p_project_id | ✅ | מכונת-סטטוסים | trigger-based |
| `set_project_coordinates` | p_project_id, p_lat, p_lng | ✅ | מ6 | כן |
| `set_project_finance_fields` | p_project_id, p_invoice_sent, p_payment_date, p_feedback_score, p_negative_feedback_reason, p_feedback_notes | ✅ | **מ8 בפועל** (permission **'כספים'** — היחיד מכל הרשימה שמגודר ככה!) | **❌ לא — 0 קריאות ב-src/** |
| `sync_assignments_on_project_date_change` | — | ✅ | טריגר פנימי | — |
| `trg_recompute_project_status` | — | ✅ | טריגר | — |
| `update_project_details` | p_project_id, p_event_date, p_location, p_start_time, p_end_time | ✅ | מ6 | כן |
| `enforce_hostess_min_wage` | — (טריגר) | ✅ | מ4 — אוכף `hostesses.hourly_rate ≥ params.שכר_מינימום_שעתי` בזמן INSERT/UPDATE של `hostesses` | trigger, לא קורא ל-src |
| `get_shift_invite` | p_token | ✅ | מ4 — מציג `hourly_rate_snapshot` + `travel_amount` (מ-params, לא מהעמודה) לדיילת | כן — `publicApi.js` |

**חיפוש נוסף שווה-ציון:** אף RPC לא נמצא עם שם שמכיל `assignment`/`attendance`/`payroll` שנוגע ב-`personal_bonus`/`travel_amount`/`salary_report_id` — אושר גם ב-`prosrc ILIKE`.
**חיפוש `insert into assignments`:** אף פונקציית-plpgsql לא מכניסה שורות ל-`assignments` (0 תוצאות) — יצירת-שיבוץ קורית ישירות מהלקוח (מ4, `assignments_write_by_permission` מרשה INSERT ישיר לבעלי edit על 'דיילות'), לא דרך RPC.

**finding מרכזי:** `set_project_finance_fields` הוא **ה-RPC היחיד בכל החיפוש שמגודר על מודול 'כספים'** (לא 'פרויקטים') — כלומר הוא **כבר** תוצר של תכנון מוקדם למ8 (מישהו — כנראה ישי בהכרעה קודמת, או תכנון-DB מודול-5-לוגיסטיקה שנספח — כבר בנה וגידר אותו נכון). הוא קיים, תקין, ומחכה לקורא.

---

## 9. סיכום-ממצאים "מפתיע" (לא רק טבלת-עמודות)

1. **גבול-מודולים מדויק כבר נחרט בקוד, לא רק במסמכים:** `src/lib/projectClosing.js` שורות 7-8 מכריזות במפורש שאין שם חישוב-רווח/בונוס/נסיעות, ומצטטות הכרעת-ישי (`AR-6 · ㉟ · R-2`) שזה תפקיד מ8. זה **עוגן קוד ישיר**, לא רק זיכרון.
2. **התשתית הטכנית של מ8 כבר בנויה במלואה בצד-השרת, אפס בצד-הלקוח:** RPC `set_project_finance_fields` (מגודר על מודול 'כספים', SECURITY DEFINER, תקין) + bucket `finance` (4 policies מלאות, מודול 'כספים') + 3 תבניות-מייל מלאות ב-params — **כולם קיימים ומוכנים, ואף לא אחד מהם נקרא/נצרך מ-`src/` אפילו פעם אחת.**
3. **מ6 כבר "גנבה" חלק מזרימת-המשוב:** שליחת סקר-השביעות-רצון ללקוח (`תבנית_מייל_משוב_לקוח`) קורית היום ב-`ClosingTab.jsx` (מודול 6, הרשאת 'פרויקטים'), כולל `mark_feedback_survey_sent`. מ8 יורשת רק את **קבלת** הציון בחזרה (`feedback_score` וכו') — לא את השליחה. שווה לוודא עם ישי שזו אכן החלוקה הרצויה, כי זו נקודת-תפר בין מודולים.
4. **`feedback_status` יש לו שני ערכי-CHECK יתומים:** `completed`/`no_response` מוגדרים בסכימה אבל **אף RPC בקוד החי לא כותב אליהם** — מ8 צריכה להחליט מי/מתי מסמן שהמשוב "הושלם" או "לא הגיע מענה".
5. **`assignments.travel_amount` (עמודה פר-שיבוץ) לעולם לא נקראת/נכתבת בפועל** — כל מה שקיים היום הוא פרמטר-גלובלי יחיד (`סכום_נסיעות_למשמרת=0`) שמוצג לדיילת בהזמנה. אם מ8 רוצה נסיעות משתנות-פר-דיילת, העמודה מוכנה אך לא בשימוש.
6. **`personal_bonus` ו-`salary_report_id` הן "עמודות-רפאים" מוחלטות** — לא רק nobody-touches מבחינת קוד, אלא 0 אזכורים בכל `pg_proc.prosrc` וב-`src/` גם יחד. 27/27 שורות `assignments` חיות נושאות את ה-default (`0`/`NULL`) בלי יוצא מן הכלל.
7. **`hostessActualCost()` קיים ומחשב, אבל יתום מ-UI** — `src/lib/projectClosing.js` מכילה פונקציה טהורה שמחשבת עלות-שעות (`actualHours × hourlyRateSnapshot`), עם בדיקת-יחידה, אך **אף מסך לא קורא לה** (רק הקובץ עצמו ובדיקתו). מועמד טבעי לשימוש חוזר במסך-שכר של מ8, לא לכתיבה-מחדש.
8. **projects הוא deny-write-מוחלט ב-RLS, לא רק "מוגן"** — גם למנכ"ל אין policy-כתיבה ישירה לטבלה; כל הכתיבה (כולל שדות-כספים עתידיים) **חייבת** RPC. זו לא המלצת-ארכיטקטורה — זו עובדת-DB קשיחה שנאכפת כבר.

---

## מתודולוגיה (מה נבדק, כדי ש"אין ממצאים" יהיה בר-אימות)

- **חיפוש דו-לשוני** לכל טענת-היעדר: עברית (שמות-עמודה/RPC בעברית כמו `שכר_מינימום_שעתי`, `אחוז_מעמ`) **וגם** אנגלית (`salary_reports`, `personal_bonus`, `feedback_status` וכו') — בוצע בשני הכיוונים בכל בדיקה.
- **RLS:** נבדק ישירות מול `pg_policies`, לא הוסק מ-`src/CLAUDE.md` (שהמידע בו רק אומת/אושר מול ה-DB).
- **RPC:** נבדק גם `proname` (חיפוש-שם) וגם `prosrc` (חיפוש-תוכן) בנפרד — כדי לתפוס RPC ששמו לא רומז על העמודה שהוא נוגע בה (כמו `close_project_operationally` שכותב `attendance_status` בלי שהשם מרמז).
- **קוד-לקוח:** `Grep` תמיד רץ על `C:\Users\ishay\Reg-In\src` בשלמותו (לא רק על תיקיית מודול משוערת), כדי לתפוס קריאות ממודולים "לא-צפויים" (למשל `04_hostesses` שקורא `hourly_rate_snapshot`).
- **לא נבדק** (מחוץ לסקופ המשימה): תוכן bucket `marketing`, RLS על `customers`/`hostesses` עצמן, ביצועי-שאילתה.
