# Contract fixes after Checker 1 (deputy, 13.10.2026 ~23:55): override contract §0–8, after §9

Source: `C:\Users\ishay\payroll-work\checker1-contract.md`, which has 10 MUST and 19 optional findings. Every MUST below is resolved. Builders: read the optional findings in that report too. Adopt an optional finding when it is cheap and inside your files; otherwise list it in your report as "not taken" with the reason.

## MUST fixes

**F1 — An unknown delivery blocks resend; `delivery_state` is never `unknown`.**
- `payroll_accountant_retry_reserve` and `payroll_review_resend_reserve` take `p_acknowledge_unknown=true` when the prior attempt's *effective* state is `unknown`.
- Inside the same transaction, they first persist the prior attempt as `state='unknown'`, with `error_code='LEASE_EXPIRED'`. This applies only while it is still `sending` and older than the lease. Only after that do they reserve the new attempt, so the partial unique index no longer blocks.
- `payroll_attempt_complete` on an attempt already persisted `unknown` is a `STALE_ATTEMPT` no-op.
- `payroll_report_list` and `payroll_report_detail` derive `delivery_state` from the latest attempt's effective state. They never read a stored value that could be stale. `salary_reports.delivery_state` remains a cache, written by complete and by the persist step above.

**F2 — Readiness counts the commit's own operation.**
- The signature becomes `_payroll_review_assert_ready_locked(p_review_id bigint, p_version text, p_exclude_operation_id uuid default null)`.
- The `OPERATION_ACTIVE` blocker ignores `p_exclude_operation_id`. Commit and `operation_begin` pass their own id.
- `payroll_operation_begin` runs in this fixed order:
  1. gate and `ISSUE_DISABLED`
  2. identity check
  3. `MONTH_NOT_ENDED`
  4. review exists, is `open` and matches the identity
  5. same UUID returns the existing operation, or `IDEMPOTENCY_MISMATCH`
  6. an active operation for the identity: a different version is superseded; the same version returns `existing`
  7. readiness pre-check, excluding this operation
  8. insert

**F3 — Commit order.**
1. `_payroll_lock()`
2. operation row `for update`
3. state, actor, `ISSUE_DISABLED`, month, identity
4. readiness, locked and excluding this operation
5. lock the sources in fixed order. Candidates come from the same membership predicate as `payroll_collect`: projects `for share`, then hostesses `for share`, then `hostess_bank_details` `for share`, then assignments `for update` in primary-key order, then params `for share`.
6. **Only now** collect once into an array.
7. Compute the version from that array and compare it with the expected version.
8. Insert lines and claims from that same array.

A row that becomes eligible concurrently changes the collected array, so it produces `PREVIEW_CHANGED`. It is never silently included or left out.

**F4 — `base64url` does not exist in PostgreSQL 17.** The token is built as `rtrim(translate(encode(extensions.gen_random_bytes(32),'base64'),'+/','-_'),'=')`, which gives 43 characters.

**F5 — An accepted case gets stuck.** `payroll_review_resolve_case` outcomes:
- `reject`: the case becomes `resolved_rejected`. A reason of at least 5 characters is required, and the hostess sees it.
- `accept_corrected`: allowed only when a `payroll_source_corrections` row exists with `case_id` = this case. The case becomes `resolved_accepted`. `correct_unclaimed_assignment` with `p_case_id` does this transition itself.
- `accept_noted` (new): the manager records that the claim is accepted but handled outside this report, for example later work in a supplement or a correction by the accountant. A reason of at least 10 characters is required. The case becomes `resolved_noted`, and the recipient becomes `manager_resolved` when no other case is open. **The screen label is `טופל מחוץ לדוח`, never "corrected".**
- `correction_pending` remains as an intermediate state. The manager can move it back to `open` with `reopen`.
- `correct_unclaimed_assignment` keeps the gate 'פרויקטים' edit. Measured: only the CEO role holds both permissions. A Projects-only manager cannot enter Finance, so record this as a 🚧 limitation in the report; do not add a new path.

**F6 — Post-issue objections are invisible.**
- `payroll_report_detail` adds `post_issue_cases:[{case_id, hostess_name, category, description, suggested_value, status, created_at, resolution_reason}]`.
- `payroll_report_list` items add `open_post_issue_cases int`.
- D shows a badge `פניות אחרי ההפקה: N` on the history row, and a list in the detail view.
- The manager closes a post-issue case with `resolve_case(outcome='close', reason)`. It never changes money.

**F7 — Resend lacks render data.** `payroll_attempt_claim` returns, for `personal_review`: `{hostess_name, response_deadline, period, report_kind, supplement_seq, review_id, recipient_id}`. For `accountant`: `{period, report_kind, supplement_seq, artifact}`. Initial sends, reminders and resends all render only from the claim result.

**F8 — Migration order.**
- New A migration `20261014000650_module8_payroll_operations_table.sql` creates `payroll_operations` **without** the `review_id` FK.
- Migration 14 becomes `alter table … add constraint … foreign key (review_id) references payroll_reviews`, plus anything else in the old 14 that is not the table itself.
- B can now test on A's migrations 1–6 plus 6b.

**F9 — Accountant validity is defined in one place.**
- A, migration 5: `_payroll_accountant_config() returns jsonb` gives `{recipient, recipient_valid, template_name, template_valid, template_sha256, missing_tokens[], unknown_tokens[]}`.
  - Valid recipient: it matches `^[^@\s]+@[^@\s]+\.[^@\s]+$`.
  - Valid template: it contains `[חודש_דיווח_ושנה]`, and every `\[[^\]\n]+\]` it contains is in the set {`[חודש_דיווח_ושנה]`, `[שם_רואה_חשבון]`}.
  - Both the preview accountant section and readiness (`RECIPIENT_INVALID`, `TEMPLATE_INVALID`) call it.
- B, migration 11: `_payroll_review_template_config()` has the same shape for `תבנית_מייל_סיכום_שעות_דיילת`, with the 4 required tokens.

**F10 — The seed restore can undo claims** (`truncate … cascade`). A edits `scripts/seed-snapshot/restore-seed-snapshot.sql`:
- Add one guard **before** the stamp check: raise if `to_regclass('public.payroll_operations') is not null and exists(select 1 from public.payroll_operations)`, **or** if the live `salary_reports` row count is greater than the snapshot's. The message says, in Hebrew, that restoring would erase payroll claims and pay shifts twice.
- Add a warning paragraph to `scripts/seed-snapshot/README.md`. This is the likely root cause of the null August claims (W0-2, dates only).

## Other deputy rulings
- **R1 — D1 cross-midnight changes money.** 25 cancellation-compensation candidates move from negative hours to positive hours. This is accepted: negative hours cannot be right, and other modules already use the same rule (D1). A writes it in the migration's `-- why:` and in the report; the deputy reports it to Ishay.
- **R2 — UX guide against contract.**
  - The **route stays `/finance/payroll` with search-param state**, per the contract and the project's URL-state convention (`CLAUDE.md` §4.2). The UX guide's `:period` path is not adopted.
  - The FinancePage button `דוח שכר` opens the new page. The old dialog is a secondary action until cutover (contract D13), so the UX guide's "dialog stays the entry" is not adopted.
  - **Every copy change in the UX guide is adopted**, including `אושר לפי תיעוד` instead of `אושר בידי המנהלת`, `שלח סיכומים לדיילות`, the single "unknown delivery" sentence with `בדוק אם נשלח`, `הופק` instead of `נחתם`, and `formatTimestampFull` in history.
- **R3 — The orphan object** `finance/salary_reports/13_08_2026_Payroll_Report.xlsx` belongs to deleted report 13, not to August's report 15. It is not linked. August uses the labelled reconstruction (brief D).

**F11 — Owner product ruling, 14.10 00:10: the hostess confirms shifts and hours only.**
- The public review page and `payroll_review_public_get` show and send date, day, event name, hours per shift and total hours for the month. **They contain no money field of any kind.**
- The digest is built from worker-visible fields only. A change to rate, bonus or travel therefore does not invalidate her approval.
- Case categories are `hours`, `missing_shift`, `not_worked` and `other`. `suggested_value` is allowed for `hours` only, in the range 0–24.
- The owner's words: *"זו טעות להציג שכר.... זה מטעה את הדיילת"* · and his choice: *"רק משמרות ושעות"*.

## Leftovers sweep: a mandatory lens for Checker 2 and Checker 3 (owner, 14.10 00:15: *"שמישו יבדוק שהתיקונים נעשו כמו שצריך ואין שאיריות"*)
For every mid-build ruling, check that it was applied **everywhere** and that no trace of the old rule is left. Cover code, SQL, tests, fixtures, copy, emails, docs and the contract text itself.
- **F11 (no money for the hostess).**
  - Search for `rate`, `bonus`, `travel`, `line_total`, `total`, `₪` and `Money` in the public page, its api and tests, `payroll_review_public_get`, the personal email template and its render, and the D "what the hostess saw" view.
  - Search for `bonus_travel` and a `rate` category everywhere: the CHECK constraint, respond validation, D labels and fixtures.
  - The digest excludes money fields. A test proves that changing only the rate keeps the digest.
- **F5b (correction gate).** Finance-only users can correct only through a case and only for its own assignment. The UI and the server agree.
- **Mail guard (D11).** Every send path goes through the guard, and no path can bypass it: payroll actions, the send-email `salary_report` branch, reminders, resends and retries.
- **September 2026 untouched.** No migration, seed, test against live, or acceptance step touches it.
- **R2 copy (the UX guide's wording).** No old strings are left, such as `אושר בידי המנהלת`, `נחתם`, or the three different "unknown" sentences.
- **Contract text.** Wherever the contract or plan still describes an overridden rule, it is flagged for the deputy to annotate. Code must not follow it.
Output: one row per ruling, ✅ clean or ❌ with file:line of the leftover.

**F12 — Owner ruling 14.10 00:30: no ₪ totals anywhere, and the accountant file follows Israeli practice (the owner delegated the file decision: *"לפי מה שמקובל בישראל תברר ותחליט"*).**
- **Manager screens (D).** The draft, follow-up, case panel, final confirmation and history show hours plus the components (rate, bonus, travel). **No computed ₪ total is shown anywhere**: no per-row total, no grand total, no "סה"כ לתשלום". Summaries are in hours, for example `יולי: 75 משמרות · 412 שעות · 32 דיילות`. The DB keeps computing `line_total` and `total_amount` internally for reconciliation and the frozen record; they are just not displayed.
- **Accountant XLSX (C `document.ts` + D `src/lib/salaryReport.js`, regular, draft and reconstruction builders, in parity).**
  - Columns, in order: `ת"ז`, `שם`, `פרטי-בנק`, `תאריך` (new, the shift's event date `DD/MM/YYYY`), `תעריף`, `שעות`, `בונוס`, `נסיעות`.
  - **The `סה"כ` column is removed.** The footer row is `סה"כ שעות` under the hours column only.
  - Header rows are unchanged.
  - Internal reconciliation (sum of lines = report total, line count) still runs before writing the file, with the same error codes.
  - The N-4 zero-row omission is unchanged.
  - The legacy dialog keeps the old builder until cutover, but it uses the same updated `salaryReport.js`. The legacy path therefore produces the new columns too, which is acceptable.
- **Why.** In Israel the payroll office or accountant computes gross pay from hours, rate and additions, applying overtime premiums (125%/150%), tax and deductions. A total of hours × rate ignores overtime premiums, so it can be wrong and misleading. Per-day dates let the accountant compute overtime by day.

**F13 — Owner 14.10 00:40: the redirect is invisible.** *"אני לא יכול להציג ככה בכנס זה צריך להראות אמיתי"*. The mail guard still redirects everything to ishay1997@gmail.com, fail-closed, but **no banner and no subject prefix appear in the mail, and no screen ever shows the test address**. Every screen shows the intended recipient. `intended_recipient`, `delivered_recipient` and `redirected` stay in the DB as internal audit only.
**Leftovers sweep also covers:** `כתובת הבדיקה`, `הופנה`, `הודעת בדיקה`, `applyRedirectNotice`, `guardedSubject`, and `payroll_delivery_address` used for display.

## Viewer-purpose gate: mandatory before ANY screen or screenshot reaches the owner (deputy, 14.10 00:40)
Owner, after four visible misses in one hour (money on the hostess page, money in the manager table, too many colours, the "test address" label): *"שלא יקרה יותר"*.
Every visible element (column, label, secondary line, chip, email line) must pass **both** questions:
1. **Which decision or action does this viewer take with it?** If none, remove it.
2. **Does it look real in a demo in front of judges?** No internal mechanism, technical value, id, test address, error code or DB term may appear on the screen.
The UI/UX manager runs this gate on **all** built screens and emails (B's screenshots and D's) **before** the deputy shows the owner anything. Checker 3 repeats it on production.

**F14 — Security-review findings (deputy, 14.10 04:3x).**
1. The hostess must see the outcome of her case. `payroll_review_public_get` adds `last_case {category, status, resolution_reason, resolved_at}`, and the page shows it in feminine-form copy. Before this, D's case panel promised something false.
2. In the Finance-only correction path (F5b), only `actual_hours` may be corrected. The Projects-edit path is unchanged.
3. (F14) The old dialog must show `intended_recipient` when present (D). `send-email` must sanitize `err.message` before returning or logging it, because it may contain the Make webhook URL (C).
4. (F14, 🚧 debt, accepted) Generic `send-email` entity types (`invoice`, `quote`, `shift`, `project`) can carry any attachment to any address for a user who already has edit rights. This existed before the build, and the owner said all demo addresses are fictitious. It is recorded as debt and not changed the day before the conference.

**F15 — Owner ruling 14.10 09:15: the draft table IS the accountant-file preview.** *"למה שהטיוטה לא תציג את הטיוטה שתשלח לרואה חשבון והיא תהיה התצוגה המקדימה"*. The on-screen draft table mirrors the XLSX one-to-one: same columns, including ת"ז and bank (this overrides UX item D1), same rows under N-4, and a total-hours footer. Anything that is not part of the file stays outside the table.
