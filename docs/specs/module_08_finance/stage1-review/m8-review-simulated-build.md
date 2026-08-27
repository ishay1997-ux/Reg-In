# Module 8 (Finance) — Simulated Build Review (Angle 3)

Reviewer context: fresh-context, read-only, **restricted to files inside
`docs/specs/module_08_finance/` only** (no other repo file, no DB). Role: act as the
builder who must plan module 8's migrations, RPCs, four screens (S1–S4), two mail flows
(M1/M2), and the profit-formula module from these files alone. Every place a real build
session would have to guess is listed below as a FINDING, most-severe first. No rulings
made — only findings + a suggested question each.

Files read (all of them, per the task's read-list):
`processes-approved.md` · `discovery-log.md` · `world-sources.md` ·
`stage0-sweeps/m8-sweep-db-columns.md` · `stage0-sweeps/m8-sweep-code-inventory.md` ·
`stage0-sweeps/m8-sweep-reverse-contracts.md` · `stage0-sweeps/m8-sweep-c5c6-requirements.md` ·
`stage0-sweeps/m8-sec6-debts.md` · `stage0-sweeps/m8-sec7-items.md` ·
`research/m8-research-{feedback,invoicing,jobcosting,payroll}.md` (spot-checked via grep
after confirming `world-sources.md` faithfully summarizes them — no build-relevant detail
found beyond the summary).

---

## 1. No `spec.md` and no `screens-approved.md` exist — all four screens are undrawn

**What:** The module-8 folder holds `processes-approved.md` (process cards) but no
`spec.md` and no `screens-approved.md`/mockups, unlike sibling modules this same folder's
sweeps repeatedly cite (`docs/specs/module_06_projects/{spec.md,screens-approved.md}`,
etc.). The status table's own tracking row confirms it: Stage 2 ("משטחים + מוקאפים") and
Stage 3 ("spec.md + מסירה") are both `⬜`, and all four surfaces S1–S4 are individually
marked `⬜ טרם צויר` ("not yet drawn").

**Evidence:** `processes-approved.md` status table — rows `| S1 | ... | ⬜ טרם צויר |`
through `| S4 | ... | ⬜ טרם צויר |`, and `| שלב 2 — משטחים + מוקאפים | ⬜ |`,
`| שלב 3 — spec.md + מסירה | ⬜ |`. Directory listing of `docs/specs/module_08_finance/`
confirms no `spec.md`/`screens-approved.md` file is present.

**Why it matters:** Every other module's build session works from an approved Hebrew
mockup or screen card for exact field order, button placement, copy strings, and error
messages. Here, a build session has zero anchor for any of that — every UI decision below
(layout of S1's three tabs, the closing-window's field order, the payroll screen's
month-picker, the feedback page's exact wording) is invention, not implementation of an
approved design.

**Suggested question:** Should the four surfaces go through a screens-approved.md +
mockup round (Stage 2) before any screen code is written, the way every other module did?

---

## 2. `salary_reports`/`salary_report_lines` structure is explicitly undefined

**What:** The only structural guidance for the two new/extended payroll tables is a
one-line decision that defers the actual column list to a later document.

**Evidence:** `processes-approved.md`, decision **ה9**: *"מבנה `salary_reports`: `period`
(חודש) UNIQUE + טבלת-שורות-snapshot (`salary_report_lines`) מוקפאות-בהפקה + סה"כ —
**נרשם ל-`db_roadmap`, הפירוט בבלופרינט**."* — "the detail [lives] in the blueprint,"
which does not exist in this folder.

**Why it matters:** A migration needs exact DDL. Nothing here says whether `period` is a
`date` (first-of-month), a `text` like `'2026-08'`, or split `year`/`month` integers; what
columns `salary_report_lines` carries beyond "a snapshot row per assignment" (does it
duplicate `hourly_rate_snapshot`, `actual_hours`, `personal_bonus`, `travel_amount` at
write time, or FK back to `assignments` and trust the frozen columns there?); or what the
"סה"כ" (total) column's precision/rounding rule is.

**Suggested question:** Is `period` a `date` truncated to month-start, or a text key —
and does `salary_report_lines` duplicate the paid figures or only FK to `assignments`?

---

## 3. `email_log.entity_type` — contradictory instruction on how many values to add

**What:** One sweep explicitly instructs adding **exactly one** new CHECK value, citing
the M6 precedent — but the same sentence notes M6 added **two** values (for two
attachment shapes), and module 8 has two structurally different mail flows (invoice email
with a mandatory PDF attachment vs. salary-report email with a mandatory XLSX attachment)
that the module's own live ledger already treats as two missing values.

**Evidence:** `stage0-sweeps/m8-sweep-code-inventory.md` §1: *"**EXTEND — add exactly one
value** (per top-mine instruction; precedent is M6, which added **two** because it had
two attachment-shapes)"*. `processes-approved.md` ledger row **ג10**: *"`email_log.entity_type`
CHECK = 4 ערכים; **אין `invoice`/`salary_report`**"* — plural, naming two distinct missing
values.

**Why it matters:** The CHECK constraint, the `ENTITY_REQUIRES_ATTACHMENT` map in the
(unreadable, out-of-folder) edge function, and the read policy all have to agree on the
final count. Building for "one" when the real need is "two" (or vice versa) breaks either
the invoice flow or the salary flow silently at the CHECK-constraint level.

**Suggested question:** Does module 8 add one shared `entity_type` value for both mails,
or two separate ones (`invoice` / `salary_report`) mirroring M6's two-value precedent?

---

## 4. The public `/feedback/:token` page (S4) is designed by analogy to a page this angle cannot read

**What:** S4 and P2's anonymous-token flow are repeatedly justified as "same pattern as
`/shift/:token`," but `/shift/:token`'s actual code lives outside `docs/specs/module_08_finance/`
and is out of this angle's reading permission.

**Evidence:** `processes-approved.md`, S4 row: *"התקדים: `/shift/:token` (§7.45, חי
ב-UAT)"*; P2 card: *"הרשאות: הדף — אנונימי-בטוקן + **הגבלת-קצב** (תקדים `/shift/:token`)"*.

**Why it matters:** Building S4 "the same way" requires knowing: where the token lives
(a new column on `projects`? a separate token table?), how/when it's generated, what the
rate-limiting mechanism actually is (a Postgres function? edge-function throttle? nothing
enforced today and only aspirational?), and what "invalid token" vs "already submitted"
responses look like at the API level. None of that is answerable from this folder.

**Suggested question:** Should the actual `/shift/:token` implementation be read (outside
this angle's restriction) before S4 is built, rather than re-deriving its mechanism from
description alone?

---

## 5. Shared email engine's payload field is literally named `pdf_base64` — salary report is `.xlsx`

**What:** The mail engine's documented field contract uses a PDF-specific field name for
the attachment payload; the salary-report mail's attachment is mandated Excel-only.

**Evidence:** `stage0-sweeps/m8-sweep-code-inventory.md` §1: `EMAIL_PAYLOAD_FIELDS =
['to', 'subject', 'body', 'filename', 'pdf_base64']`. `processes-approved.md`, decision
**ה4**: *"קובץ-השכר: **Excel (.xlsx) בלבד**"*.

**Why it matters:** If `pdf_base64` is validated/typed as PDF-only somewhere in the send
pipeline (not visible from this folder), the salary-report mail cannot ship through the
shared engine as documented and either the engine needs a generic-attachment field added
(a cross-module change, not module-8-only) or the field name is misleading and any base64
blob is accepted. Building the "ייצא ושלח" flow without knowing which is true risks a
silent send-failure or a shared-infra change nobody flagged.

**Suggested question:** Does `pdf_base64` in the mail payload accept any base64 binary
regardless of the field's name, or does the send pipeline enforce a PDF mime/signature
check that would reject an `.xlsx` payload?

---

## 6. Cancellation-fee schema: "final total only" vs. "three editable components" is unreconciled

**What:** The P1 card's "what is saved" line names one aggregate column plus a waiver
note. The same card's process description shows a UI with three independently correctable
line items.

**Evidence:** `processes-approved.md`, P1 card — **"מה נשמר"**: *"`cancellation_fee`
(הסכום הסופי) + ויתור-מנומק"* (final amount only) vs. the process line: *"מסלול
דמי-הביטול... מופיע... עם דגל 'דמי-ביטול' + **פירוט שלושת הרכיבים** (פיצוי-צוות · שורות-
`ordered`/`ready` במחיר-מלא · שורה-ידנית לשירותים-שבוצעו). **ניתן לתקן**..."*

**Why it matters:** If only the final ₪ figure is persisted, a later correction to one of
the three components has nothing to recompute from — the manager would have to re-derive
and re-enter the whole total by hand every time, defeating "ניתן לתקן" (correctable) as a
per-component operation. If the three components need their own columns, that's undocumented
schema, not a decision already made.

**Suggested question:** Should the three cancellation-fee components be stored
individually (so each is independently correctable) or is only the aggregate persisted
and "תיקון" means re-entering the whole number?

---

## 7. `cancel_type`'s literal enum values are never given in this folder

**What:** The cancellation-fee RPC needs a branch for "force-majeure ⇒ always 0%," which
depends on `projects.cancel_type` — a column confirmed to exist and to be an RPC parameter,
but whose actual string values are never enumerated anywhere in `module_08_finance/`.

**Evidence:** `stage0-sweeps/m8-sweep-db-columns.md` §8: `cancel_project(p_project_id,
p_cancel_type, p_cancel_reason)` — argument named, no values listed.
`stage0-sweeps/m8-sweep-reverse-contracts.md` A6 only names the percentage tiers
(`>72h⇒0%` etc.) and "force-majeure⇒always 0%" as a *concept*, not the column value that
signals it.

**Why it matters:** Coding the 0/50/100% + force-majeure branch requires matching against
the exact stored string (or discovering it's a separate boolean, not a `cancel_type`
value at all) — guessing wrong silently miscomputes every force-majeure cancellation fee.

**Suggested question:** What are `projects.cancel_type`'s actual CHECK values, and which
one (if any) represents force-majeure?

---

## 8. The "billing email" column for invoice-send is never named

**What:** The P1 card describes a hard stop when there's no billing email, without saying
which column holds it.

**Evidence:** `processes-approved.md`, P1 card, **"מה נשבר"**: *"אין מייל-לחיוב — נחסם עם
הפניה לכרטיס-הלקוח"*. No `customers.*` column is named anywhere in this folder's
sweeps for "מייל לחיוב."

**Why it matters:** Building the invoice-send RPC/screen requires knowing the exact
source field to validate against and read from — a dedicated `billing_email` column, or
reuse of a general `customers.email`, materially changes both the migration (if any) and
the empty-state check.

**Suggested question:** Is there already a dedicated billing-email field on `customers`,
or does "מייל לחיוב" reuse the customer's general contact email?

---

## 9. `hostess_bank_details` split (ה19) touches module-4 code this angle cannot see

**What:** The bank-details table split is ruled in principle, explicitly preserving "the
module-4 form keeps working" — but the actual read/write call sites that would need to
retarget the new table live in module 4's source, outside this folder.

**Evidence:** `processes-approved.md`, decision **ה19**: *"פיצול לטבלת-ילד
`hostess_bank_details`... כתיבה/קריאה לבעלות `edit` על 'דיילות' (**טופס-מ4 ממשיך לעבוד**)"*.
`stage0-sweeps/m8-sweep-code-inventory.md` §7 names the anchor `HostessFormDialog.jsx` and
`src/modules/04_hostesses/api.js:439` for the current bank-field reads, but neither file
is inside `docs/specs/module_08_finance/`.

**Why it matters:** "The form keeps working" is only true if the migration also updates
(or view-wraps) every one of those call sites in the same deploy step — a cross-module
ripple whose exact scope (how many call sites, whether a compatibility view suffices)
cannot be determined from this folder alone.

**Suggested question:** Should the module-4 form/API files actually be read as part of
this migration's design, rather than assumed compatible from the sweep's one-line note?

---

## 10. "Σ שינויי-תכולה" (scope-change revenue component, ה2) has no defined column or sign convention

**What:** The revenue formula adds "Σ project_changes" to the frozen quote total, but no
file in this folder states what column of `project_changes` is summed, whether rows carry
signed deltas or absolute new line totals, or whether a scope *reduction* subtracts.

**Evidence:** `processes-approved.md`, decision **ה2**: *"הכנסות-הפרויקט = preVat של
ההצעה + Σ שינויי-תכולה (לפני מע"מ)"*. `stage0-sweeps/m8-sweep-reverse-contracts.md` A7
only confirms the *requirement* to include scope changes in a displayed "סכום" column,
not `project_changes`'s schema. `world-sources.md` §ג notes the *AIA convention* for
crediting quantity reductions is "a negotiated convention, not our rule" — explicitly not
a REG-IN answer.

**Why it matters:** Getting the sign or the aggregated field wrong either double-counts or
silently drops scope-change revenue from every project's frozen profit number — a data
integrity error that would only surface once `project_changes` has real rows (currently 0,
per the sweep, so nothing today would catch it).

**Suggested question:** What column(s) on `project_changes` represent the revenue delta,
and do reductions (fewer items) subtract from revenue the same way additions add?

---

## 11. `planned_qty` (goods-cost basis, ה17) is never anchored to an actual column

**What:** The profit formula's goods-cost side is defined as "`planned_qty` (מעודכן-
שינויי-תכולה) × `closing_unit_cost`," but only `closing_unit_cost`/`closing_unit_price`
are confirmed live columns in this folder's DB sweep — `planned_qty` (and its
scope-change-adjustment mechanism) is not.

**Evidence:** `processes-approved.md`, decision **ה17**: *"בסיס-עלות הסחורה בנוסחת-הרווח
= הכמות המוזמנת (`planned_qty` מעודכן-שינויי-תכולה) × `closing_unit_cost`"*.
`stage0-sweeps/m8-sweep-db-columns.md` §4 lists only `closing_unit_price`/`closing_unit_cost`
on `quote_services` — no `planned_qty` row appears in that table's column list.

**Why it matters:** Without knowing the real column/table for "quantity as adjusted by
scope changes," the goods-cost half of the profit formula cannot be written with
confidence — it may need a join against `project_changes` per line, which is undocumented
here.

**Suggested question:** Which table/column holds the scope-change-adjusted planned
quantity per service line, and is it already computed anywhere, or does מ8 have to derive it?

---

## 12. "Over-budget" highlight threshold (א54) is undefined even though the deviation number itself (ה18) is

**What:** ה18 defines *how* budget deviation is computed; nothing defines *what magnitude*
should visually flag a project as "over budget" on S1 or the profitability report.

**Evidence:** `processes-approved.md`, ledger row **א54**: *"הדגשת חריגות: מעל-תקציב או
משוב-נמוך — **ספים לא הוגדרו**"* (marked 🔴, unresolved). ה18 defines only the deviation
formula, not a highlight threshold.

**Why it matters:** S1's "חיווי אדום לחריגות תקציביות" (per the C5/C6 sweep row 85, cited
in `m8-sweep-c5c6-requirements.md`) cannot be coded without a cutoff — any number chosen
by the builder is invention.

**Suggested question:** At what deviation size (e.g., ₪ amount, % of planned cost) should
a project be visually flagged as over-budget?

---

## 13. Project-manager's "relevant reports" visibility (א11) is unresolved and explicitly deferred to a stage that hasn't happened

**What:** C5 grants the project-manager role "view access to relevant reports" without
naming which ones; this module's own ledger flags it unresolved and defers it to "Stage 2"
— the screen/mockup stage that doesn't exist yet (see Finding 1).

**Evidence:** `processes-approved.md`, ledger row **א11**: *"מנהלת-פרויקטים חסומה
מריכוז-שכר; צפייה בדו"חות 'רלוונטיים' (לא הוגדר אילו)"* — marked 🔴, *"'רלוונטיים' לא
הוגדר — הרשאות-מסך בשלב 2."*

**Why it matters:** RLS/permission design for the profitability report and the salary
report needs a concrete answer for whether the project-manager role can view either — an
open item with no fallback stated.

**Suggested question:** Which of the finance reports (profitability, salary) should the
project-manager role be able to view, if any?

---

## 14. New columns implied by the 26/08 rulings are not yet in the live schema and their types are unstated

**What:** `invoice_sent_at`, `cancellation_fee`, and a write-off flag + reason (from the
"סגירה ללא תשלום" decision) are all referenced as data to be written, but none appear in
the exhaustive live `projects` column table this folder's own DB sweep produced.

**Evidence:** `stage0-sweeps/m8-sweep-db-columns.md` §1 lists every finance-relevant
`projects` column live on 26/08/2026 (`invoice_sent`, `payment_date`, `feedback_status`,
`feedback_score`, `negative_feedback_reason`, `feedback_notes`) — none of `invoice_sent_at`,
`cancellation_fee`, or a write-off column appear. `processes-approved.md` P1 card names
`invoice_sent_at` and `cancellation_fee`; the P3 card's write-off paragraph describes
*"עמודת-דגל"* (a flag column) and a required reason, without naming either.

**Why it matters:** A migration has to invent exact names/types/nullability/precision for
all of these with no stated precedent to match (e.g., is `cancellation_fee` `numeric(12,2)`
like other money columns, or something else; is the write-off flag boolean or a new status
enum value; what's the write-off reason column's name and whether it has a CHECK).

**Suggested question:** Should these four new columns (`invoice_sent_at`,
`cancellation_fee`, a write-off boolean, and a write-off-reason text) be named/typed now as
part of the blueprint, rather than left to be improvised during migration-writing?

---

## 15. The "one extended RPC" for all status transitions (ה10) has an unspecified internal signature

**What:** ה10 states every status transition (invoice-sent+save, payment-date entry,
archive, and by extension the newly-added write-off path) goes through "one extended
finance RPC" — but the parameter set, branching logic, and how it reconciles with the
*existing* `set_project_finance_fields`'s documented "no lock check, full-replace
semantics" comment (which ה12 explicitly wants to add a status gate to) is undecided.

**Evidence:** `processes-approved.md`, decision **ה10**: *"הכול ב-RPC-כספים אחד מורחב"*.
Decision **ה12**: *"כתיבת-כספים רק מ-`awaiting_invoice` ואילך"* (a new constraint on the
existing RPC). `stage0-sweeps/m8-sweep-code-inventory.md` §4 quotes the existing RPC's own
header comment: *"✅ ממשיכה לעבוד אחרי הסגירה התפעולית... **אין כאן בדיקת-נעילה**"* — i.e.,
the RPC as built was deliberately written to have no lock check, which ה12 now overrides.

**Why it matters:** Two build paths are both plausible and materially different: (a) alter
`set_project_finance_fields` in place, changing its documented contract, or (b) add a new
wrapping RPC and leave the old one as dead code the client stops calling. Neither is stated.

**Suggested question:** Does building ה12's status-gate mean altering
`set_project_finance_fields` directly, or wrapping it in a new RPC and retiring the old one?

---

## 16. Class-level risk: every DB fact here is a same-day snapshot this angle cannot re-verify

**What:** All "live DB" claims (RLS states, RPC signatures, row counts, column lists) in
the sweeps are dated 26/08/2026 and were gathered via direct Supabase MCP queries — a
method this angle's task explicitly disallows re-running.

**Evidence:** `stage0-sweeps/m8-sweep-db-columns.md` header: *"מקור: Supabase MCP,
project_id `yfeovxppnfoafmfbdfvh`, קריאה-בלבד"*, dated throughout to 26/08/2026.

**Why it matters:** This repo's own project-wide discipline (visible project-wide, not
specific to this folder) explicitly warns against citing external state without a
same-turn check. A build session picking up this folder days later inherits every one of
these DB facts on faith unless it re-runs the same live queries — not a defect in the
sweep itself, but a real staleness risk baked into "plan from this folder alone."

**Suggested question:** N/A — flagged as a standing risk for whoever executes the build,
not a decision to make now; the mitigation is simply re-verifying the live DB at build time
rather than trusting the 26/08 snapshot silently.

---

## Checks run for the "no guess omitted" discipline

- Searched this folder (both Hebrew and English vocabulary) for: `spec.md`,
  `screens-approved`, `salary_report_lines`, `period`, `entity_type`, `pdf_base64`,
  `cancellation_fee`, `cancel_type`, `written_off`/`write_off`, `planned_qty`,
  `billing_email`/`מייל לחיוב`, `hostess_bank_details`, `project_changes` — every hit read
  in full surrounding context across all nine module-8 files.
- Confirmed via directory listing that only `processes-approved.md`, `discovery-log.md`,
  `world-sources.md`, four `research/` files, and six `stage0-sweeps/` files exist — no
  `spec.md`, no `screens-approved.md`, no design-contract file.
- Spot-checked all four `research/` files with targeted grep (`salary_report_lines`,
  `period.*UNIQUE`, `snapshot`, `xlsx`, `CSV`, `PDF`) after reading `world-sources.md` in
  full, to confirm the summary file doesn't omit a build-relevant specific — none found.
- Did not open any file outside `docs/specs/module_08_finance/` and ran no SQL — per this
  angle's restriction; every "not confirmable" claim above names exactly what would need
  to be read/queried to resolve it.
