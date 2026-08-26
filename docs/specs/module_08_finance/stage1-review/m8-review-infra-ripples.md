# M8 Discovery — Review R4: Infrastructure-Ripple Audit

**Reviewer:** fresh-context agent, read-only. **Repo:** `C:/Users/ishay/Reg-In`, branch `ishay/module-5-logistics`, HEAD `e3b55b8` (26/08/2026 13:57).
**All DB measurements taken 26/08/2026 13:55–14:10** against project `yfeovxppnfoafmfbdfvh` (live, read-only SQL via MCP).
**Source read in full:** `docs/specs/module_08_finance/processes-approved.md` (339 lines).
**Timestamp caveat (per brief):** module 5 is being built on this branch. `public.logistics` policies were measured at **26/08/2026 ~14:00** and stood at exactly **2** (`logistics_select_by_permission`, `logistics_write_by_permission`), both gated on module `'לוגיסטיקה'`. Latest m5 migrations on disk: `20260826002448_module5_scope_change_reset_removal.sql`. If m5 lands more RLS work, re-measure F1 before acting.

**I rule on nothing.** Every item below is a finding with a suggested question for Ishay.

---

## Method / anchors used (so absence claims are checkable)

SQL run live: `pg_proc.prosrc` + `prosecdef` (all 26 public functions), `pg_constraint` (CHECK/FK/UNIQUE on projects, assignments, email_log, quotes, quote_services, logistics, project_changes, salary_reports, hostesses), `pg_trigger` (all 24 non-internal triggers), `pg_policies` (public + storage), `pg_class.relrowsecurity` + policy counts (all 23 public tables), `information_schema.columns` (8 tables), `permissions ⋈ roles ⋈ modules` (all 45 rows), `params` (all 38 rows).
Repo greps (Hebrew **and** English vocabularies): `bank_name|bank_branch|bank_account|bankName|bankBranch|bankAccount`; `deriveCustomerMetrics|matchesCustomerFilters|hostessActualCost|computeQuoteTotals|set_project_finance_fields|ENTITY_REQUIRES_ATTACHMENT|FEEDBACK_TEMPLATE|קישור_בסיס_סקר_לקוחות`; `סקר|survey|feedback`; `entity_type|attachment|bucket`; `profit|רווח|bank-column|salary_report` in `docs/db_roadmap.md`. Scopes: `src/`, `e2e/`, `supabase/`, `docs/schema.sql`.

**Credit where due — the spec is largely right.** These held up against the live DB exactly as written: ג1 (`salary_reports` RLS on, 0 policies), ג2 (`projects` 1 SELECT policy, zero write policies), ג3 (`personal_bonus`/`salary_report_id` untouched by code), ג5 (`set_project_finance_fields` exists, gated `'כספים'`, **0 call sites in `src/`** — grep confirms), ג6 (finance bucket + 4 storage policies live), ג9 (no RPC writes `awaiting_payment`/`finished`), ג10 (`email_log_entity_type_check` = exactly 4 values, no finance SELECT policy), ג12 (`hostessActualCost` live in `closingDraft.js`), ג13 (params values), א13 (finance role holds `view` on `'פרויקטים'` + `edit` on `'כספים'`), א33 (`close_project_operationally` writes `awaiting_invoice`), א43 (`hourly_rate_snapshot` + `actual_hours` live). `db_roadmap.md` lines 351–352 already carry a real m8 write-back including `invoice_sent_at`, `cancellation_fee`, `written_off`, `final_profit`, `feedback_token`, the `תנאי_תשלום_ימים`=30 seed, and the `salary_reports` restructure — that is good discipline and it removes several items from this list before I wrote them.

---

# FINDINGS — ranked most-severe first

---

## F1 · The finance role is `blocked` on logistics — P1's cancellation fee and P3's goods cost read **zero rows, silently**

**What.** Two approved rulings require reading `public.logistics` as the finance manager: P1's cancellation fee ("שורות `ordered`/`ready` במחיר מלא") and ה17's profit cost basis ("הכמות המוזמנת × closing_unit_cost"). She cannot read that table at all.

**Evidence (live, 26/08 ~14:00).**
- `pg_policies`: `logistics` has exactly 2 policies. `logistics_select_by_permission` qual requires a `permissions` row for `modules.module_name = 'לוגיסטיקה'` with level `edit|view`.
- `permissions ⋈ roles ⋈ modules`: role `מנהלת כספים ולקוחות` → module `לוגיסטיקה` → **`blocked`**. (Her full live row set: `דו"חות`=edit · `דיילות`=**blocked** · `הגדרות מערכת`=blocked · `הצעות מחיר`=view · `כספים`=edit · `לוגיסטיקה`=**blocked** · `לקוחות`=edit · `ניהול הרשאות`=blocked · `פרויקטים`=view.)
- `pg_class.relrowsecurity` = true on `logistics`.

**Why it matters.** RLS denial is not an error — PostgREST returns `[]`. A cancellation fee computed from a client-side select would silently come out **₪0 for every project**, and the goods line of the gross profit would silently come out **₪0**, on the one screen whose entire purpose is that number. Nothing in the spec's ledger flags this: ג-part scanned `salary_reports`, `projects`, `email_log` policies but never `logistics` against the finance role. The precedent for the fix already exists in this codebase — `list_projects_overview` (SECURITY DEFINER) reads `public.logistics` counts and returns them to the finance manager today, so a DEFINER reader is the established pattern, not a new invention.

**Suggested question.** "שורות הסחורה שהוזמנה — מנהלת הכספים חסומה מלוגיסטיקה במסד. שתי דרכים: RPC ייעודי שקורא בשמה (כמו `list_projects_overview` שכבר עושה בדיוק את זה), או לפתוח לה `view` על 'לוגיסטיקה'. הראשונה שומרת על 'חסומה מעריכת לוגיסטיקה' של C5 §5.4.3 — מאשר?"

---

## F2 · `cancel_project` destroys the `finally_approved` flag — ה15's cancellation compensation is not computable against merged code

**What.** ה15(ב) and P4 pay cancelled-project compensation as `§7.16% × planned hours × frozen rate` — which requires knowing **which hostesses were finally approved at the moment of cancellation**. `cancel_project` overwrites exactly that.

**Evidence (live `prosrc` of `cancel_project`, SECURITY DEFINER).**
- It sets `project_status='cancelled'`, stamps `cancelled_at`/`cancelled_by`/`cancel_type`, then:
  `update public.assignments a set assignment_status = 'released' where a.project_id = p_project_id and a.assignment_status in ('finally_approved','pending','confirmed_available');`
- The pre-release status is returned only inside the function's JSON payload (`'was_finally_approved', w.assignment_status = 'finally_approved'`) — **to the caller, never persisted**.
- Column dump of `assignments`: no `released_from_status`, no `status_before_cancel`, no audit column. Grep for `was_finally_approved` in `src/` → it exists only as a transient response field consumed by the cancellation dialog.
- `assignments.actual_hours` is `NOT NULL default 0`, and a cancelled project never runs `close_project_operationally`, so actual hours stay 0.

**Why it matters.** After cancellation, a `released` row is indistinguishable from a hostess who declined or was released for an unrelated reason. Paying 50%/100% compensation to everyone with a `released` row over-pays; paying no one under-pays and silently drops the §7.16 obligation the spec just built. The §7.16 inputs that *do* exist are fine — `cancelled_at`, `cancel_type` live on `projects`, and params `שעות_פיצוי_ביטול_מלא`=24, `שעות_פיצוי_ביטול_חלקי`=72, `אחוז_פיצוי_ביטול_חלקי`=50 are all seeded. The missing piece is only "who".

**Second half of the same gap — planned hours.** ה15(ב) and ה18 both need "שעות מתוכננות". The live column dump shows **no `planned_hours` anywhere** — not on `projects`, not on `assignments`. The only derivation is `projects.final_end_time − projects.final_start_time`, and both columns are **nullable** (`information_schema.columns`, `is_nullable='YES'`).

**Suggested question.** "פיצוי-ביטול לפי §7.16 צריך לדעת מי הייתה מאושרת-סופית ברגע הביטול — ו-`cancel_project` של מ6 מוחק את הסימון הזה (הכל הופך ל-`released`). מציע עמודה שמשמרת את הסטטוס-שלפני, במיגרציה של מ8, ורק לביטולים חדשים. ומה עושים עם ביטולים קיימים בדמו? וגם: 'שעות מתוכננות' לא קיימות כעמודה — לגזור משעות ההתחלה/סיום של האירוע, שהן nullable?"

---

## F3 · ה2's revenue formula mixes a discounted base with an undiscounted addition

**What.** ה2 rules: "הכנסות-הפרויקט = preVat של ההצעה + Σ שינויי-תכולה (לפני מע"מ)". The two terms are not on the same discount basis.

**Evidence (live).**
- `list_projects_overview` computes the quote term as `s.sub − round(s.sub * (q.applied_customer_discount + q.manual_discount) / 100.0, 2)` — i.e. **after both discounts**.
- `apply_scope_change` inserts the change row with `unit_price_snapshot := qs.closing_unit_price` — the quote **line** price, read straight from `quote_services`, with **no discount applied**.
- `list_project_changes` returns the money as `round(c.delta_qty * c.unit_price_snapshot, 2)` — undiscounted.
- `quotes` CHECK `quotes_combined_discount_max` allows the two discounts to sum to 100.

**Why it matters.** For a customer with `applied_customer_discount + manual_discount = 15`, every scope change is credited at full list price while the base is at 85%. The frozen profit number — the one figure P3 calls "המספר שכל שאר המערכת ניזונה ממנו" — would be systematically overstated, and it is frozen forever. A conference question "why does a discounted customer pay full price for an added badge?" has no good answer today.

**Also note:** `project_changes_change_target_check` allows `'logistics'` **or** `'hostess_count'`. ה2 says "Σ שינויי-תכולה" without distinguishing them, and a `hostess_count` change carries `unit_price_snapshot` = the hostess line price. Whether that belongs on the revenue side (it does, commercially) is fine — but ה17's cost side counts only goods, and the added hostess's cost arrives via `assignments`. Worth stating explicitly so the two sides can't double-count or miss.

**Suggested question.** "שינוי-תכולה נרשם היום במחיר-המחירון, בלי ההנחות של ההצעה. הרווח שנקפיא ייצא מנופח אצל כל לקוח עם הנחה. להחיל את אותן שתי הנחות גם על שינויי-התכולה בנוסחה — מאשר?"

---

## F4 · Spec states "אין CHECK במסד" on the negative-feedback reason — the live DB has one

**What.** Ledger א26, contract B4, and the P2 card all state that the five negative-feedback reasons are enforced only in the m8 form because there is no DB CHECK. There is a CHECK.

**Evidence (live `pg_constraint`).**
`projects_negative_feedback_reason_check` = `CHECK ((negative_feedback_reason IS NULL) OR (negative_feedback_reason = ANY (ARRAY['איחור דיילות','תפקוד דיילות','איכות תגים','ניהול לקוי','אחר'])))`.

**Why it matters.** Small in effort, real in consequence: a build session reading "אין CHECK" will design form-only validation and will be surprised by a `23514` from the DB with a raw Postgres message in English on Ishay's screen. It also means the m8 form's dictionary must match these five strings **byte-for-byte** — that is now a hard contract, not a soft one. The spec's derived claim ("אכיפה בטופס של מ8") is still the right UX; only the premise is wrong.

**Suggested question.** Not a product question — a correction. Suggest fixing א26 / B4 / the P2 card to read "CHECK קיים במסד עם חמישה ערכים; הטופס חייב להתאים לו מילה-במילה".

---

## F5 · The salary report cannot read hostesses or assignments as the finance role — and ה19 covers only the bank columns

**What.** P4's salary line needs, per hostess: ת"ז · שם · bank details · rate · hours · bonus. ה19 solves **only** the bank details (child table readable by `'כספים'`). The rest sits on tables the finance role is `blocked` from.

**Evidence (live).**
- `hostesses_select_by_permission` requires `'דיילות'` `edit|view`; `assignments_select_by_permission` requires `'דיילות'` `edit|view`; `assignments_write_by_permission` requires `'דיילות'` `edit`.
- Finance role → `'דיילות'` = **`blocked`** (permissions dump above).
- P4 also **writes** `assignments.salary_report_id` and `assignments.travel_amount` (ה14) — same blocked write policy.

**Why it matters.** Every read and every write in the salary flow must go through `SECURITY DEFINER` RPCs. That is achievable — 24 of 26 live functions are already DEFINER — but it changes the shape of the build: there is no "select the assignments and render the table" path. ה19's phrasing ("קריאה ל'כספים' (הדוח)") reads as if the bank split is the last permission problem; it is one of four. Left unstated, a build session will write a client-side select, get `[]`, and ship a salary report with zero rows and no error.

**Bonus, same area:** writing `salary_report_id` to N assignment rows fires `assignments_recompute_project_status` **per row** (`AFTER INSERT OR DELETE OR UPDATE ... FOR EACH ROW`). The inner `recompute_project_status` does `select ... from public.projects where project_id = ... for update` **before** its early-return guard — so a salary run takes a row lock on every touched project even though it correctly changes nothing (the guard `if v_status not in ('not_started','in_progress','ready') then return;` fires afterwards). Correctness is fine; the lock footprint is real and worth a `db_roadmap` note.

**Suggested question.** "כל דוח-השכר חייב לעבור דרך פונקציות-שרת, כי מנהלת הכספים חסומה מ'דיילות' — לא רק פרטי-הבנק. זה בדיוק הדפוס הקיים במערכת. מאשר שכך נבנה?"

---

## F6 · `salary_reports` as it stands live cannot record the failed-send state P4 requires

**What.** P4's failure mode says: "המייל נכשל — **הדוח נשמר**, סטטוס 'נכשל' מוצג, שליחה-חוזרת מההיסטוריה". The live table cannot hold that row.

**Evidence (live `information_schema.columns`).** `salary_reports` = `report_id` (identity PK) · `sent_date date NOT NULL` · `report_file_url text NOT NULL` · `created_at` · `updated_at`. No `period`, no status column, no total. `pg_constraint` shows **no UNIQUE** on the table. `pg_policies` shows **0 policies** with `relrowsecurity=true` → deny-all.

**Why it matters.** A report saved after a failed send has no send date — but `sent_date` is `NOT NULL`, so the build must either stamp a lie or the migration must relax it. ה9 specifies `period` UNIQUE + `salary_report_lines` + total, and `db_roadmap.md:351` records that faithfully — but neither mentions the `NOT NULL` relaxation or a status column, and P4's three-state email contract needs both. `db_roadmap.md:138` independently confirms the UNIQUE is still owed to m8 (§7.40(ג)), and `:308` confirms `assignments.salary_report_id` still has no covering index (C-1).

**Suggested question.** "דוח שנשלח ונכשל — לפי הכרטיס הוא נשמר עם סטטוס 'נכשל'. במסד היום `sent_date` ו-`report_file_url` הם חובה, ואין עמודת-סטטוס. מציע: `sent_date` נעשה nullable + עמודת סטטוס שליחה. מאשר?"

---

## F7 · Cancelled projects never reach `finished` — so P3's "גם מבוטלים מקבלים רווח-קפוא" has no writer, and ה8 excludes them

**What.** Three approved statements do not compose.

**Evidence.**
- P1 (line 307), explicit: "🔴 **סטטוס-הפרויקט נשאר `בוטל` — מכונת-מ6 לא נגעת**".
- P3 (line 325): "**גם מבוטלים מקבלים רווח-קפוא** בפתרון דמי-הביטול".
- P3 (line 326): "מי-כותב-מעבר: ממתין-לתשלום→הסתיים = RPC-הארכוב בלבד" — the only described writer of the frozen profit is the archive action, and archive is only reachable from `awaiting_payment`.
- ה8: "רווח-מצטבר = פרויקטים ב-`finished` בלבד".
- Live `pg_constraint`: `projects_project_status_check` includes `'cancelled'` as a terminal peer of `'finished'`, and `projects_closed_needs_report` = `CHECK ((project_status <> ALL (ARRAY['awaiting_invoice','awaiting_payment','finished'])) OR (summary_report_url IS NOT NULL))` — a cancelled project has no summary report, so it **could not** be moved to `finished` even if someone tried.

**Why it matters.** Either cancelled projects get a frozen profit and ה8's `finished`-only population silently drops them from every customer's cumulative profit and from מ11's report, or they never get one and P3 line 325 is a sentence with no implementation. Both are defensible products; they cannot both be true. The DB CHECK also means "just set them to finished" is not available as a shortcut.

**Suggested question.** "פרויקט שבוטל וגבינו עליו דמי-ביטול — הכסף הזה נכנס לרווח המצטבר של הלקוח, או נשאר מחוץ לדוחות? היום שתי ההכרעות אומרות דברים שונים, ומבוטל לא יכול בכלל להפוך ל'הסתיים' במסד."

---

## F8 · `deriveCustomerMetrics`'s average is dead today — its caller never fetches the score

**What.** ג15 says `deriveCustomerMetrics` averages every project with a score and that the gap is live. Measured, the gap is currently **inert** — for a different reason than stated, and that changes the fix.

**Evidence.**
- `src/lib/customers.js` `deriveCustomerMetrics`: `const scores = projects.map((p) => p?.feedback_score).filter(...)` — no status filter. Confirmed.
- Call site 1, `src/modules/02_customers/CustomerDetailsPage.jsx:363` — `deriveCustomerMetrics(projects, quotes, vatRate)`, where `projects` comes from `getCustomerProjects` in `src/modules/02_customers/api.js`, whose **explicit** column list is `'project_id, event_name, final_event_date, project_status, customer_id, quote_id, cancelled_at, cancel_type, cancelled_by, cancel_reason, quotes(...)'`. **`feedback_score` and `feedback_status` are not selected.** The file's own comment says so deliberately: *"עמודות מפורשות — לא `select('*')`: projects נושאת שדות-כספים (payment_date, invoice_sent, feedback_*) שאין להם מקום בלשונית-הלקוח"*.
- Call site 2, `src/modules/02_customers/CustomersPage.jsx:168` — `deriveCustomerMetrics([], list, vatRate)`: projects array is **empty by construction**, so `avgFeedback` is always `null` in the customer list.
- `matchesCustomerFilters` (`src/lib/customers.js:42`) destructures exactly `text, customerType, marketingConsent, minDiscount, hasDiscount, status, createdAfter, dormantOnly` — **no feedback filter of any kind**.
- `listProjectsForCustomerMetrics` selects only `customer_id, final_event_date, project_status`.

**Why it matters.** A8's "ממוצע-משוב לכרטיס-לקוח" is not a one-line filter change as ה8 implies. It requires: widening `getCustomerProjects`'s select (and reversing a deliberate m2 privacy comment — that is a decision, not a refactor), adding the filter, adding a feedback filter key to `matchesCustomerFilters`, widening `listProjectsForCustomerMetrics` for the list page, and updating `src/lib/customers.test.js` (which asserts today's unfiltered behaviour at lines 149/163/166/167/294).

**Also unreconciled:** live param `מינימום_תשובות_להצגת_ציון` = **3** exists in `params` and appears nowhere in the spec. It reads exactly like a rule for when a customer's average may be shown. ה8 defines the population and never mentions it.

**Suggested question.** "ממוצע-המשוב בכרטיס-הלקוח לא עובד היום — מודול 2 בכוונה לא מושך את עמודות-המשוב, בהערה מפורשת על פרטיות. להרחיב את השליפה? וגם: יש פרמטר חי `מינימום_תשובות_להצגת_ציון=3` שלא מוזכר באפיון — הוא אמור לחסום הצגת ממוצע מתחת ל-3 תשובות?"

---

## F9 · `project_changes` is deny-all — the read path exists but only through one RPC, with a permission coupling worth naming

**What.** ה2 reads `project_changes`. The table is `relrowsecurity=true` with **0 policies** — deny-all to every client.

**Evidence.** `pg_class`/`pg_policies`: `project_changes` → `relrowsecurity=true`, `n_policies=0`. The only door is `list_project_changes` (SECURITY DEFINER), whose source asserts `'פרויקטים'` `edit|view` and then gates the money columns behind a second check on `'הצעות מחיר'` `edit|view`, returning `case when v_can_read_money then c.unit_price_snapshot end` etc.

**Why it matters.** This one actually **works** for the finance role today (she holds `view` on both) — which is the good news, and it is worth writing down so nobody "fixes" it. The finding is the fragility: the m8 revenue formula now silently depends on the finance role keeping `view` on `'הצעות מחיר'`. If that permission is ever narrowed (and C5 §5.4.3 describes her as a finance person, not a sales one), `unit_price_snapshot` comes back `NULL`, and a naive `sum()` over nulls yields a **smaller revenue with no error**. Same coupling applies to `quotes`/`quote_services` (both gated on `'הצעות מחיר'`) which ה2's first term needs directly. B14 in the ledger gestures at this ("אזהרת-עקביות להרשאות-מ8") but does not name the failure mode.

**Suggested question.** "נוסחת-ההכנסות של מ8 תלויה בכך שמנהלת הכספים רואה 'הצעות מחיר'. היום כן. אם אי-פעם נצמצם לה את זה — הרווח יקטן בשקט בלי שגיאה. להוסיף שומר שמפיל שגיאה מפורשת במקום להחזיר מספר חלקי?"

---

## F10 · Missing param `תנאי_תשלום_ימים` — P1's "ימי איחור" has nothing to compare against

**What.** P1: "'ימי איחור' נגזר מול `תנאי_תשלום_ימים` (שוטף+30)". That param does not exist.

**Evidence.** Full live `params` listing, all 38 names: `אחוז_מעמ | אחוז_פיצוי_ביטול_חלקי | גולפוסט_מרחק_קמ | חלון_חישוב_חודשים | חלון_חישוב_מורחב_חודשים | יחס_אורחים_לדיילת | ימי_אזהרה_קדם_אירוע | ימי_תוקף_הצעה | לא_ענתה_ל_N | מייל_משרד_רואי_חשבון | מינימום_תשובות_להצגת_ציון | מרכיב_אמינות_פעיל | משקולת_אמינות | משקולת_היענות | משקולת_קרבה | סכום_נסיעות_למשמרת | סף_לקוח_רדום_ימים | קבוע_ריסון_m | קישור_בסיס_סקר_לקוחות | שיעור_בונוס_הוגנות_לשבוע | שכר_מינימום_שעתי | שעות_פיצוי_ביטול_חלקי | שעות_פיצוי_ביטול_מלא | שעות_תזכורת_לדיילת | שער_מרחק_קמ | תבנית_איפוס_סיסמה | תבנית_אישור_סופי_שיבוץ | תבנית_זימון_משמרת | תבנית_מייל_אירוע_בוטל | תבנית_מייל_ביטול_משמרת | תבנית_מייל_דוח_שכר | תבנית_מייל_הצעת_מחיר | תבנית_מייל_חשבונית_מס | תבנית_מייל_משוב_לקוח | תבנית_מייל_פרטי_האירוע_השתנו | תבנית_מייל_שחרור_משמרת | תבנית_תזכורת_משמרת | תקרת_שבועות_הוגנות`. No `תנאי_תשלום_ימים`. Also: the live `customers` column dump has **no per-customer payment-terms column** — so terms are global-only, with no per-customer override.

**Why it matters.** Low severity because `db_roadmap.md:352` **already records the seed** ("param `תנאי_תשלום_ימים`=30 seed"), so the mechanism to catch it exists. Flagged so the build session seeds it in the same migration rather than discovering an empty `getParamValue` at runtime — note that `getParamValue` (`src/modules/06_projects/closingApi.js:105`) throws a Hebrew error on a missing param, so this would surface as a hard failure on the collection tab, not a silent zero.

**Suggested question.** Confirm 30 days is right as a **global** default, and confirm no per-customer override is wanted for v1 (there is no column for one today).

---

## F11 · The survey-link swap (S4) is a three-file change with a sequencing constraint, and `feedback_status='sent'` timing survives it

**What.** The spec's "אדוות-מחויבות ①" — moving the survey mail's link from the Google-Forms param to the token URL — is precisely locatable. I verified where, and that the `sent` timing is unaffected.

**Evidence (merged m6 code).**
- `src/lib/shiftEmails.js:253-254`: `export const FEEDBACK_TEMPLATE_NAME = 'תבנית_מייל_משוב_לקוח'` and `export const SURVEY_LINK_PARAM_NAME = 'קישור_בסיס_סקר_לקוחות'`.
- `src/lib/shiftEmails.js:300`: `buildFeedbackSurveyPayload({ template, surveyUrl, contact, project })` — guard `if (!contact?.email || !surveyUrl) return null`; fill map `'[לינק_לשאלון_שביעות_רצון]': surveyUrl`. **This is the single fill point.**
- `src/modules/06_projects/ClosingTab.jsx:134-148` `trySendSurveyMail`: `Promise.all([getEmailTemplate(FEEDBACK_TEMPLATE_NAME), getParamValue(SURVEY_LINK_PARAM_NAME)])` → `buildFeedbackSurveyPayload(...)` → `sendEmail({ entityType: 'project', ... })`.
- Live param today: `קישור_בסיס_סקר_לקוחות` = `https://forms.gle/YFJobqmgpBCqf1x87` — a **constant** URL with no per-project component.
- `ClosingTab.jsx:306-319`: `feedback_status='sent'` is written **only** on `surveyResult === null`, with the comment *"AR-5: feedback_status='sent' נכתב רק אחרי שליחת-סקר שהצליחה בפועל — 'לא ידוע' אינו הצלחה"*.

**Why it matters / what changes.** The current call site fetches a **project-independent** constant. A token URL is **per-project**, and the token must exist *before* the mail is composed. So the change is not "swap one string": `trySendSurveyMail` must first obtain/mint the project's `feedback_token`, then build `${base}/feedback/${token}`. That is a new call inside m6's merged closing flow — the riskiest kind of edit, since m6 is closed and `ClosingTab.test.jsx` mocks these functions. Good news: the `sent`-timing contract (AR-5) is orthogonal and holds unchanged — the mark still happens only after a confirmed successful send. Also note the token must be minted **before or during** `close_project_operationally`, and `mark_feedback_survey_sent` (asserting `'פרויקטים'` `edit`) is untouched by any of this.

**Suggested question.** "החלפת הלינק במייל-הסקר נוגעת בקוד של מודול 6 שכבר סגור וממוזג, ובבדיקות שלו. מציע שהטוקן ייווצר בסגירה התפעולית עצמה, כדי שהמייל ימצא אותו מוכן. מאשר שנוגעים במ6?"

---

## F12 · `email_log` extension — the deploy-order rule is documented in the server file itself, and is asymmetric

**What.** B11 is right, and the merged code states the rule more sharply than the spec does. Recording it so the build session cannot get the order wrong.

**Evidence.**
- Live `pg_constraint`: `email_log_entity_type_check = CHECK (entity_type = ANY (ARRAY['quote','shift','project','project_report']))`.
- `supabase/functions/send-email/index.ts:32-51`: `ENTITY_MODULE` = `{quote:'הצעות מחיר', shift:'דיילות', project:'פרויקטים', project_report:'פרויקטים'}` and `ENTITY_REQUIRES_ATTACHMENT` = `{quote:true, shift:false, project:false, project_report:true}`.
- The file's own comment (lines 26-31): *"🚫 **אין כאן `invoice`/`salary_report`**: ה-CHECK של `email_log.entity_type` אינו מכיר אותם עדיין, וכשל בכתיבת-היומן **נבלע** … מ8/מ11 יוסיפו את הערך שלהם **יחד עם המיגרציה שמרחיבה את ה-CHECK**, לא לפניה."* — and: *"הכיוון אינו סימטרי: פריסה לפני המיגרציה ⇒ המייל יוצא, כתיבת-היומן נדחית, **והכשל נבלע**."*
- `email_log` has 3 SELECT policies, gated on `'הצעות מחיר'` / `'דיילות'` / `'פרויקטים'`. **None on `'כספים'`** — the finance manager cannot read her own send journal today.
- `db_roadmap.md:186` (A-20) independently records "M8 and M11 remain owed", one value each, in the same migration as the code.

**m8's two new values, with their required map entries:** `invoice` → module `'כספים'`, `REQUIRES_ATTACHMENT: true` (P1 blocks send without a file). `salary_report` → module `'כספים'`, `REQUIRES_ATTACHMENT: true` (the .xlsx). Plus a fourth `email_log` SELECT policy gated on `'כספים'` for those two entity types — **do not widen an existing policy**, per A-20's explicit instruction.

**Suggested question.** None — this is a build constraint, not a decision. Suggest it be lifted verbatim into the micro-guide as an ordering gate: migration first, deploy second.

---

## F13 · The bank-details split (ה19) — complete touch-point list, and one column-level obstacle the ruling does not mention

**What.** ה19 rules the split to `hostess_bank_details`. Here is every place that must change, plus a NOT NULL problem.

**Evidence (exhaustive grep, Hebrew + English identifier spellings, over `src/`, `e2e/`, `supabase/`, `docs/schema.sql`).**

| Touch-point | File | Nature |
|---|---|---|
| Field labels | `src/modules/04_hostesses/HostessFormDialog.jsx:63-65` | `bank_name:'בנק'`, `bank_branch:'סניף'`, `bank_account:'מס׳ חשבון'` |
| Empty-form defaults | `src/modules/04_hostesses/HostessFormDialog.jsx:76-78` | initial state |
| Submit payload | `src/modules/04_hostesses/HostessFormDialog.jsx:217-219` | `bank_*: form.bank_*.trim()` — flat on the hostess object |
| Three required inputs | `src/modules/04_hostesses/HostessFormDialog.jsx:388-412` | `<Field required>` × 3 |
| Read display | `src/modules/04_hostesses/HostessViewCard.jsx:315` | `` `${hostess.bank_name} · ${hostess.bank_branch} · ${hostess.bank_account}` `` |
| Baseline DDL | `supabase/migrations/20260629000000_baseline_schema.sql:149-151` | `text not null` × 3 |
| Snapshot | `docs/schema.sql:714-716` | mirror, must be regenerated |

**Zero hits** for `bank_*` in `e2e/`, in `src/modules/04_hostesses/api.js`, and in any RPC's `prosrc` (checked all 26 functions) — so **no API select-list and no test enumerates these columns**, which makes the split smaller than feared. That is a genuine finding in the spec's favour, and it narrows ה19's scope to five code sites plus the migration.

**The obstacle ה19 does not mention.** Live: all three columns are `is_nullable='NO'` on `hostesses`. A child-table split must therefore, in one migration: create the child, copy the data, drop the three parent columns (not merely stop using them — leaving `NOT NULL` columns in place makes every future hostess insert fail unless the form keeps writing them, which defeats the entire PII purpose). And `HostessFormDialog` currently sends one flat object — it must become a two-step write, which means an RPC (the form is the `'דיילות'`-`edit` path, and the child table's write policy per ה19 is also `'דיילות'` `edit`, so a plain two-call sequence is possible but non-atomic).

**Precedent check — ה19's anchor holds.** `docs/db_roadmap.md:339` confirms `product_costs` was split from `products` for exactly this reason, with read = `edit` on `'הצעות מחיר'` **or** `edit` on `'כספים'`, and lists a real trap from that split: *"the catalog embed must stay a LEFT join — an inner join drops disabled products"*. The same trap applies here: a hostess with no bank row must still appear in the hostess list.

**Suggested question.** "פיצול פרטי-הבנק דורש למחוק את שלוש העמודות מהטבלה הראשית — אחרת הן נשארות חובה וכל דיילת חדשה תיכשל. זה אומר לגעת בטופס-הדיילות של מודול 4 (חמישה מקומות בקוד). מאשר? ומתי — לפני דוח-השכר או יחד איתו?"

---

## F14 · `set_project_finance_fields` — extend vs. split, and exactly what breaks

**What.** The brief's question 1. Measured answer: the existing RPC is **not extensible in place** without changing its semantics, and it has no current callers, which makes a clean replacement cheap.

**Evidence (live `prosrc`, `prosecdef=true`).** Signature: `(p_project_id integer, p_invoice_sent boolean, p_payment_date date, p_feedback_score integer, p_negative_feedback_reason text, p_feedback_notes text)`. Body: `assert_module_permission('כספים', array['edit'])` → `if p_invoice_sent is null then raise 'חובה לציין אם החשבונית נשלחה.'` → one `update public.projects set invoice_sent=…, payment_date=…, feedback_score=…, negative_feedback_reason=…, feedback_notes=…` → `return row_count = 1`. **No status gate, no lock check, no `updated_at` concern (a trigger handles it), full-replace semantics (a NULL argument blanks the column).** Grep: **0 call sites** anywhere in `src/`.

**Why extension in place is wrong.** Three of m8's writers have genuinely different authority and different gates:
1. The public feedback submit (S4) is **anonymous by token** — it cannot call a function that asserts `'כספים'` `edit`.
2. The archive action is **irreversible** (freezes profit, locks the file, kills the token) — full-replace semantics on an irreversible action is a foot-gun: one screen sending a stale null blanks a field.
3. The invoice save transitions status; the feedback save must not.

Adding `invoice_sent_at`, `cancellation_fee`, `written_off` and a status gate (ה12) to the existing 6-arg signature produces a 10-arg full-replace function that does four unrelated jobs behind one permission check.

**What breaks if it is replaced outright:** measurably, **nothing** — 0 call sites in `src/`, and `pg_proc` shows no other function calls it. The only cost is that a same-name/different-signature `create or replace` will not work (Postgres treats it as an overload), so the migration must `drop function public.set_project_finance_fields(integer, boolean, date, integer, text, text)` explicitly. That is the whole blast radius.

**Suggested question.** "הפונקציה הקיימת לכתיבת שדות-הכספים לא נקראת משום מסך — אפס. מציע לפרק אותה לארבע פעולות נפרדות (חשבונית · תשלום · משוב · ארכוב), כל אחת עם השער שלה, במקום לנפח אותה לפונקציה אחת שעושה הכל. מאשר?"

---

## F15 · `recompute_project_status` does **not** fight the new transitions — verified, and the guard is load-bearing

**What.** The brief's question 2. Answer: no conflict. Recording the evidence so nobody re-litigates it, and naming the one thing that must not be touched.

**Evidence (live).**
- Triggers that call it: `assignments_recompute_project_status` (AFTER INSERT/DELETE/UPDATE on `assignments`), `logistics_recompute_project_status` (AFTER INSERT/DELETE/UPDATE on `logistics`), `projects_recompute_on_required_count` (AFTER UPDATE OF `required_hostess_count`, guarded by `WHEN old IS DISTINCT FROM new`). All three route through `trg_recompute_project_status()`.
- The guard, verbatim from `recompute_project_status`: `-- 🔗 מראת §7.44 — recompute ONLY while the project is on the active axis.` / `if v_status not in ('not_started','in_progress','ready') then return; end if;`
- `projects_project_status_check` = `'not_started','in_progress','ready','event_finished','awaiting_invoice','awaiting_payment','finished','cancelled'` — all three of m8's target states are **outside** the guard's set, and already in the CHECK. **No CHECK widening is needed for m8's transitions.**

**The one caution.** m8 writes `assignments.salary_report_id`, `personal_bonus`, `travel_amount` — all three fire the assignments trigger. The early return protects correctness **only because** the project is by then in `awaiting_*`/`finished`/`cancelled`. If ה15's retro path ever writes an assignment row belonging to a project still in `ready` (it can: a cancelled project's rows are fine, but the guard set includes `ready`), the trigger will recompute and could move that project's status. Worth an explicit test.

**Suggested question.** None — this is a green light with a note. Suggest the micro-guide carry a regression test asserting that a salary-report write leaves `project_status` unchanged.

---

## F16 · S1's list revenue and P3's closing-window revenue will disagree

**What.** Two different revenue numbers will render on two m8 surfaces for the same project.

**Evidence.** `list_projects_overview` (SECURITY DEFINER, the natural source for S1's three tabs — it already returns `project_status`, `cancelled_at`, `cancel_type` and a revenue figure) computes revenue as the quote's discounted preVat **only** — its `case when v_can_read_quotes ...` branch reads `quotes` + `quote_services` and never touches `project_changes`. ה2 defines project revenue as that **plus** Σ scope changes.

**Why it matters.** A project with a ₪3,000 scope change shows one number in the tab list and a different one in the closing window — the exact class of incoherence the project's own north star ("המבחן הוא קוהרנטיות") is measured on, and the kind of thing a conference question lands on. Either `list_projects_overview` gains the changes term (it is m6-owned and merged — a ripple), or S1 must not display revenue, or S1 calls a new m8 reader.

**Suggested question.** "סכום ההכנסות ברשימה ובחלון-הסגירה ייצאו שונים בפרויקט עם שינוי-תכולה, כי הפונקציה הקיימת של מודול 6 לא סופרת שינויים. לתקן את הפונקציה של מ6, או שמסך-הכספים יקרא דרך פונקציה חדשה משלו?"

---

# THE COMPLETE CHANGE-LIST TO MERGED CODE

| # | What changes | Where (file / object · anchor) | Why (spec item) | Size | Risk |
|---|---|---|---|---|---|
| 1 | New DEFINER reader for logistics rows (status + qty + cost) usable by `'כספים'` | new RPC · pattern of `list_projects_overview` | P1 cancellation fee · ה17 | M | **H** — silent ₪0 if skipped |
| 2 | Persist pre-cancellation assignment status | `cancel_project` (`update ... set assignment_status='released'`) + `assignments` new column | ה15(ב) · §7.16 | M | **H** — touches merged m6 RPC |
| 3 | Apply quote discounts to scope-change revenue | new profit SSOT in `src/lib/` · reads `list_project_changes` | ה2 | S | **H** — wrong frozen number |
| 4 | Split `set_project_finance_fields` into 4 gated actions; `drop function` the 6-arg original | live RPC (0 call sites) | ה10 · ה12 · P1 · P3 | L | M |
| 5 | New `projects` columns: `invoice_sent_at`, `cancellation_fee`, `written_off`, `final_profit`, `feedback_token` | migration · already in `db_roadmap.md:352` | P1 · P3 · S4 | M | L |
| 6 | `salary_reports`: add `period` UNIQUE + status + total; relax `sent_date`/`report_file_url` NOT NULL; new `salary_report_lines`; open RLS; index `assignments.salary_report_id` (C-1) | migration · `db_roadmap.md:138,308,351` | ה9 · P4 | L | M |
| 7 | DEFINER RPCs for the whole salary flow (reads `hostesses`+`assignments`, writes `salary_report_id`+`travel_amount`) | new RPCs | P4 · ה14 | L | **H** — `[]` if done client-side |
| 8 | `hostess_bank_details` child table + drop 3 parent columns + rewire 5 m4 code sites | `HostessFormDialog.jsx:63-65,76-78,217-219,388-412` · `HostessViewCard.jsx:315` · `docs/schema.sql:714-716` | ה19 · §7.63 | M | M — merged m4 form |
| 9 | `email_log` CHECK +`invoice`,+`salary_report`; `ENTITY_MODULE`/`ENTITY_REQUIRES_ATTACHMENT` +2 each; new `'כספים'` SELECT policy | migration **then** `supabase/functions/send-email/index.ts:32-51` | B11 · P1 · P4 | S | M — **order is asymmetric** |
| 10 | Survey link → token URL; mint token before mail | `shiftEmails.js:254,300` · `ClosingTab.jsx:137-141` + `ClosingTab.test.jsx` | S4 ripple ① | M | M — merged m6 + tests |
| 11 | `deriveCustomerMetrics` status filter + widen `getCustomerProjects` select + feedback key in `matchesCustomerFilters` + widen `listProjectsForCustomerMetrics` | `customers.js:42,252` · `02_customers/api.js:52,67` · `CustomersPage.jsx:168` · `customers.test.js:149,163,166,167,294` | ה8 · A1 · A3 · ג15 | M | M — reverses an m2 privacy comment |
| 12 | Seed `תנאי_תשלום_ימים`=30; re-seed `סכום_נסיעות_למשמרת` 0→22.60 | migration · `db_roadmap.md:352` | P1 · ה20 | S | L |
| 13 | Decide + implement frozen profit for cancelled projects (or exclude explicitly) | archive RPC · ה8 population | P3:325 vs ה8 vs P1:307 | M | M — needs a ruling first |
| 14 | Add scope-change term to `list_projects_overview`, or a new m8 list reader | merged m6 RPC | F16 coherence | M | M |
| 15 | Public token RPC pair + rate limiting (precedent `get_shift_invite` / §7.45) | new RPCs | S4 · P2 | M | **H** — anonymous write path |
| 16 | Correct the spec: `negative_feedback_reason` **has** a live CHECK (5 values) | `processes-approved.md` א26 · B4 · P2 card | F4 | S | L |

---

# Blind spots — things I could not settle

- **`שעות_פיצוי_ביטול_*` semantics.** Params are `24` and `72` and named "hours", so I read the §7.16 scale as hours-before-event. I did **not** find the code that applies them (grep for these names in `src/` returns nothing), so whether 24h means "≤24h before event ⇒ 100%" is inference, not measurement. Checkable: read §7.16 in `docs/PROJECT_MASTER_sec7.md` in full.
- **מ11's read of `salary_reports`.** ה1 says מ11 is view-only over past reports. I verified the table is deny-all but did **not** check whether מ11's role (`דו"חות`=edit for finance, `view` for מנהלת פרויקטים) needs its own policy. Checkable: the new RLS policy's gate module.
- **`e2e/` coverage of the finance path.** I grepped `e2e/` for bank fields (0 hits) but did not enumerate which existing E2E specs touch `projects.project_status`; a new transition could break an existing assertion. Checkable: `grep -rn "awaiting_invoice\|awaiting_payment" e2e/`.
- **What I did not find, having looked:** no `planned_hours` column on any table; no per-customer payment-terms column on `customers`; no `feedback_token` column today; no code anywhere reading `quote_services.closing_unit_cost` (confirming ג11); no `invoice`/`salary_report` string in `supabase/functions/send-email/index.ts` outside the explanatory comment.
