# מ8 (כספים וסגירת אירוע) — Existing-Code Capability Inventory

READ-ONLY sweep. No files written in the repo, no DB writes. All claims carry file+grep-anchor;
absence claims name the searches run in both Hebrew and English vocabulary.

---

## 1. Email engine — the top mine (PROJECT_MASTER §6)

| capability | where it lives (anchor) | verdict for מ8 | notes/quote |
|---|---|---|---|
| Template-fill + 5-field Make contract + attachment-size cap + 3 result states | `src/lib/email.js` — `export const EMAIL_PAYLOAD_FIELDS = ['to', 'subject', 'body', 'filename', 'pdf_base64']`; `export const EMAIL_SEND_RESULT = { SENT: 'sent', FAILED: 'failed', UNKNOWN: 'unknown' }` | **CONSUME as-is** | File header states it explicitly: "מנוע גנרי... מודולים 4, 8 ו-11 ישלחו מיילים גם הם." Pure — no Supabase, no clock, no DOM. |
| `fillEmailTemplate`, `plainTextToEmailHtml` (RTL/bidi wrapper — mandatory for any Hebrew body going to a customer/accountant) | `src/lib/email.js:70` / `:120` | **CONSUME as-is** | `src/CLAUDE.md` §"בידוד רצף לטיני" makes this non-optional: any new template (מ8's incl.) inherits the fix automatically only if sent through `plainTextToEmailHtml` — hand-rolling the body re-introduces the bug. |
| Transport (`sendEmail`, 30s timeout, 3 required meta fields) + template fetch (`getEmailTemplate`) + send-history reads (`getLastSuccessfulSend`, `getSentEntityIds`) | `src/api/email.js` (whole file) | **CONSUME as-is** | Header: "⛔ מודול שצריך... מייבא **מכאן**, ולא ממודול אחר ולא בהעתקה." `getEmailTemplate(name)` throws a spoken Hebrew error if the param row is missing — no silent empty send. |
| `email_log.entity_type` CHECK — currently 4 values | `supabase/migrations/20260814141050_module6_email_log_accepts_project.sql:67` — `check (entity_type in ('quote', 'shift', 'project', 'project_report'))` | **EXTEND — add exactly one value** (per top-mine instruction; precedent is M6, which added *two* because it had two attachment-shapes) | Live-measured constraint definition is quoted in the migration itself (`pg_get_constraintdef`, 14/08). מ8 needs its own value(s) for invoice-email / salary-report-email — **not** `'project'` (that's gated on module 'פרויקטים', wrong owner) and **not** `'shift'` (gated on 'דיילות', also wrong). |
| Read policy on `email_log` for the new entity_type value(s) | Same file, lines 76-81 — `create policy "email_log_select_projects_module" on public.email_log for select ... using (entity_type in ('project','project_report') and exists (... module_name = 'פרויקטים' ...))` | **EXTEND — copy this exact pattern, gated on module `'כספים'`** | This is the literal template the top-mine instruction refers to ("add a read policy"). Same file also documents the two-step deploy order that is load-bearing: **migration first, edge-function deploy (`send-email/index.ts`) second, same step** — deploying the function first means "the mail goes out and the log stays empty, silently" (line 34-38 of that file). |
| `ENTITY_REQUIRES_ATTACHMENT` map (per-entity_type attachment requirement) | Lives in `supabase/functions/send-email/index.ts` (edge function, not in `src/`) — referenced from the migration comments (`index.ts:34-36`) | **EXTEND (server-side, in the edge function, same deploy step as the migration)** | Not found under `src/`; this repo's Discovery-sweep scope is `src/` + `supabase/migrations/` per the task brief, so the edge-function file itself was **not read** — flagging as a place מ8's blueprint session will need to touch, since invoice email plausibly needs the attachment (mandatory, like `quote`) while salary-report email may not. |

**Absence check for a second mail engine:** searched `src/` for a second `functions.invoke(` call site and a second template-fill implementation (English: `sendMail`, `mailer`, `smtp`; Hebrew: `שלח מייל`, `הנדסת מייל`) — none found outside `src/api/email.js` / `src/lib/email.js` and the per-module thin wrappers (`quotes.js`, `shiftEmails.js`). No second engine exists to duplicate.

---

## 2. Email templates already seeded and their live code-read status

| template `param_name` | seeded in | read by code today? | verdict |
|---|---|---|---|
| `תבנית_מייל_משוב_לקוח` (customer feedback survey email) | `supabase/migrations/20260723112000_module3_seed_products_tiers_params.sql:79` | **YES** — `src/lib/shiftEmails.js:253` — `export const FEEDBACK_TEMPLATE_NAME = 'תבנית_מייל_משוב_לקוח'`, consumed by M6's `ClosingTab.jsx` (sends the survey mail as part of "שמור ושלח") | **CONSUME as-is** for מ8 if it ever needs to resend the same survey; the send-and-mark flow already lives in M6, not מ8 |
| `קישור_בסיס_סקר_לקוחות` (survey base URL param) | Same seed file, line 63 — real value `https://forms.gle/YFJobqmgpBCqf1x87` | **YES** — `src/lib/shiftEmails.js:254` `SURVEY_LINK_PARAM_NAME`, fetched via `getParamValue` in `src/modules/06_projects/closingApi.js:107` | **CONSUME** — the survey is an **external Google Form**, not a REG-IN screen |
| `תבנית_מייל_חשבונית_מס` (tax invoice email) | Same seed file, line 84 | **NO** — grepped `src/` for the literal string, zero hits outside the migration file | **MISSING — מ8 builds the send-flow** (template already exists in `params`, engine already exists; only the screen/wiring is absent) |
| `תבנית_מייל_דוח_שכר` (monthly salary report → accountant email) | Same seed file, line 117 — subject line addressed "לצוות הנהלת חשבונות / [שם_רואה_חשבון]" | **NO** — zero hits in `src/` | **MISSING — מ8 builds** |

**Absence check, two vocabularies:** searched `src/` for `חשבונית` (Hebrew) and `invoice` (English) — only hits are the `projects.invoice_sent` column name and its RPC parameter (`set_project_finance_fields`, §4 below); no invoice-sending UI exists yet. Searched for `דוח_שכר`/`salary_report` — only the `salary_reports` table/RPC-parameter names, no sending UI.

---

## 3. Module 6's closing RPC — what it writes, and what it explicitly does NOT do

**File:** `supabase/migrations/20260814142439_module6_rpcs_reads_and_close.sql`, function `close_project_operationally` (starts line 270).

**What it freezes at operational close** (the `update public.projects` at line 471-480):
```
actual_hours, actual_guests, summary_report_url,
project_status = 'awaiting_invoice',   -- the status hand-off point to מ8
operationally_closed_at = now(), operationally_closed_by
```
Per-hostess rows in `assignments` also get `attendance_status`/`lateness_level`/`no_show_reason`/`actual_hours` written row-by-row in the same transaction (loop starting line 487).

**What it explicitly refuses to touch — quoted verbatim (lines 245-246):**
> `🚫 אפס חישובי-רווח ואפס עמודת-רווח (AR-6, הבהרת-ישי 14/08/2026 01:17) — ההקפאה הפיננסית היא של מ8. 🚫 אינה כותבת feedback_status ואינה שולחת דבר (AR-5).`

Translation for the finding: M6's closing RPC computes **zero profit**, writes **zero profit column**, and does **not** send the feedback survey itself or mark it sent — that is `mark_feedback_survey_sent`, called from the client (`ClosingTab.jsx`) only after the survey email genuinely succeeds.

**Status machine values on `projects`** (CHECK, `supabase/migrations/20260629000000_baseline_schema.sql:126`):
```
'not_started', 'in_progress', 'ready', 'event_finished',
'awaiting_invoice', 'awaiting_payment', 'finished', 'cancelled'
```
`close_project_operationally` moves `event_finished → awaiting_invoice`. **No RPC anywhere in `supabase/migrations/` moves a project out of `awaiting_invoice`/`awaiting_payment`/into `finished`** — searched (English `finished`/`awaiting_payment`, Hebrew none applicable — these are enum literals) — that transition is **MISSING and is מ8's to build** (presumably driven by `invoice_sent`/`payment_date` becoming non-null, but no RPC or trigger currently does this).

---

## 4. `set_project_finance_fields` — מ8's write window ALREADY EXISTS

This is the single biggest finding of the sweep: **module 6 already built the RPC that module 8 will write through.**

**File:** `supabase/migrations/20260814142439_module6_rpcs_reads_and_close.sql:693-726`

```sql
create or replace function public.set_project_finance_fields(
  p_project_id               integer,
  p_invoice_sent             boolean,
  p_payment_date             date,
  p_feedback_score           integer,
  p_negative_feedback_reason text,
  p_feedback_notes           text
) returns boolean
  ...
  perform public.assert_module_permission('כספים', array['edit']);
  update public.projects p
     set invoice_sent             = p_invoice_sent,
         payment_date             = p_payment_date,
         feedback_score           = p_feedback_score,
         negative_feedback_reason = nullif(btrim(coalesce(p_negative_feedback_reason, '')), ''),
         feedback_notes           = nullif(btrim(coalesce(p_feedback_notes, '')), '')
   where p.project_id = p_project_id;
```

Header comments (lines 682-692, quoted):
- `🔴 השער הוא 'כספים' ולא 'פרויקטים'.` — gated on the **'כספים'** module, not 'פרויקטים'; live-measured that `מנהלת כספים ולקוחות` = view-only on 'פרויקטים' + edit on 'כספים', so without this exact RPC she'd have no legal write path at all.
- `✅ ממשיכה לעבוד אחרי הסגירה התפעולית — זה בדיוק חלון-העבודה שלה. אין כאן בדיקת-נעילה.` — no lock check; this RPC is meant to keep working after M6's operational close locks everything else.
- `⚠️ סמנטיקה: כתיבה מלאה של ששת השדות כפי שהתקבלו... null פירושו "רוקני", לא "אל תיגעי".` — **full-replace semantics, not partial patch**: the caller (מ8's form) must send all six fields together every time; a field passed as `null` blanks it, it does not mean "leave alone".
- `🚫 אינה כותבת feedback_status` — deliberately excluded; feedback_status is M6's to send (`mark_feedback_survey_sent`), the *score* is מ8's to enter.

**Verdict: CONSUME as-is.** This is a **built, granted, revoked-from-anon** RPC (`revoke ... from public, anon` / `grant ... to authenticated`, line 744-745) sitting unused today because no screen calls it. מ8 does not need a migration for this write path — it needs a screen that calls `supabase.rpc('set_project_finance_fields', {...})`.

**§7.63 ("finance-column ownership — hard case") is already closed** per `docs/db_roadmap.md:347` — quoted: *`~~finance-column ownership 🔴 (§7.63)~~ ✅ closed 14/08/2026 — set_project_finance_fields gated 'כספים' (M6-9)`.* The remaining open half of §7.63 is **hostesses' bank columns** (§7 below), not projects.

---

## 5. `pricing.js` — the pricing SSOT, exact return shapes

**File:** `src/lib/pricing.js`

| function | returns | what it means for מ8's profit formula |
|---|---|---|
| `computeQuoteTotals(lines, appliedDiscount, manualDiscount, vatRate)` (line 110) | `{ subtotal, discountAmount, preVat, vatAmount, total }` — all in ₪ (shekels, not agorot) | **`preVat`** is exactly "net revenue after discounts, before VAT" — the number the task brief describes. `total` is *with* VAT. |
| `deriveQuoteAmount(quote, defaultVatRate)` (`src/lib/quotes.js:559`, not `pricing.js` — see note below) | `{ total, discountPercent }` — **`total` includes VAT** (test: `deriveQuoteAmount(quoteRow(), 18).total → 6318.9`, the full C5 worked example) | ⚠️ **This is a different basis than `list_projects_overview.planned_revenue`** (§6 below), which is explicitly pre-VAT. A profit calc that mixes the two silently compares apples to oranges. |
| `sumQuoteTotals(rows, vatRate)` (`src/lib/customers.js:239`, **not** `pricing.js`) | sum of `deriveQuoteAmount(row, vatRate).total` across rows, or `null` if any row can't be priced | Post-VAT total, used today only for the customer-card's "total revenue" stat. |

**Correction to the task brief's assumption:** `deriveQuoteAmount` and `sumQuoteTotals` do **not** live in `src/lib/pricing.js` — `pricing.js` holds only the low-level `computeQuoteTotals`/`computeLineTotal`/`toShekels` primitives (verified via `export function`/`export const` grep on the file, 15 exports, none named `deriveQuoteAmount` or `sumQuoteTotals`). `deriveQuoteAmount` lives in `src/lib/quotes.js:559` (wraps `computeQuoteTotals` and additionally resolves frozen-vs-live VAT), and `sumQuoteTotals` is a private (non-exported) helper inside `src/lib/customers.js:239`. מ8 should import `deriveQuoteAmount` from `quotes.js`, not from `pricing.js`.

**The cost side already exists and is frozen at quote-approval, same place as revenue:** `docs/schema.sql:641` — `quote_services.closing_unit_cost numeric(12,2) not null` (CHECK `>= 0`, line 648). So **planned gross profit** (`Σ qty·closing_unit_price − Σ qty·closing_unit_cost`, net of discount, pre-VAT) is fully computable today from data that already exists — nothing to build for the *planned* half.

**Server already computes the planned-revenue half live, per-viewer-permission-gated:** `list_projects_overview()` (`supabase/migrations/20260814142439...sql:220-232`) returns `planned_revenue` = `s.sub − round(s.sub × (applied_discount+manual_discount)/100, 2)` — pre-VAT, `NULL` (not 0) when the viewer lacks 'הצעות מחיר' permission or the project has no quote. This is the exact same formula as `pricing.js`'s `preVat`, reproduced server-side because `list_projects_overview` is `SECURITY DEFINER` and must not leak revenue to a viewer RLS would otherwise block (comment quoted at line 103-108: *"‏planned_revenue — NULL ולא 0 (S-2)"*). **Already displayed on the project card** — `src/modules/06_projects/ProjectCardPage.jsx:526` — `<Cell label="הכנסה מתוכננת" testId="project-cell-revenue">`.

**Verdict: revenue-and-cost-at-quote-time = CONSUME (fully built). Actual gross profit after the event = MISSING** — see §8 (two-number model) below.

---

## 6. `customers.js` — `deriveCustomerMetrics` feedback-average stub, confirmed live

**File:** `src/lib/customers.js:252-260`

```js
export function deriveCustomerMetrics(projects = [], quotes = null, vatRate = null) {
  const projectCount = projects.length > 0 ? projects.length : null
  const scores = projects
    .map((p) => p?.feedback_score)
    .filter((s) => typeof s === 'number' && !Number.isNaN(s))
  const avgFeedback =
    scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null
```

**Verdict: CONFIRMED — the stub averages every project passed in that happens to carry a numeric `feedback_score`, with no filter on `project_status` or `feedback_status` at all.** There is no `finished`/`awaiting_payment` status filter, no `feedback_status === 'completed'` filter — any project row with a non-null numeric score counts, regardless of where it sits in the pipeline. Whether this is currently a live bug or is harmless *today* depends on whether any non-finished project can carry a `feedback_score` — and it can: `set_project_finance_fields` (§4 above) writes `feedback_score` with **no status check at all** ("✅ ממשיכה לעבוד אחרי הסגירה התפעולית... אין כאן בדיקת-נעילה" — no lock check of any kind, so it is callable even on a project that never reached `awaiting_invoice`, e.g. by data-entry mistake). **This is a real, checkable, currently-live gap** — not a hypothetical — and its precise fix (should `deriveCustomerMetrics` filter on `project_status`, on `feedback_status`, or should the RPC itself gate on status?) is a product decision, not something this sweep rules on.

`matchesCustomerFilters`'s satisfaction-filter stub — **searched and not found**: grepped `src/lib/customers.js` for `satisfaction`/`שביעות` — zero hits in that file. The only satisfaction-adjacent code is §7 item 80 in `docs/PROJECT_MASTER_sec7.md:272`, an **open, unbuilt** product question ("מיפוי ציון-שביעות → תגית-מלל... הספים נקבעים עם נתוני-המשוב במודול 8" — the star-to-label mapping thresholds are explicitly deferred to מ8's Discovery). **Verdict: MISSING**, and not yet a stub in code — it's a §7 open question, not a function.

---

## 7. `hostesses` module — salary-relevant surfaces

| capability | anchor | verdict |
|---|---|---|
| `hourly_rate` display in the repository | `src/modules/04_hostesses/api.js:439` — `.select('hostess_id, full_name, email, hourly_rate')` | **CONSUME (read)** — but see the snapshot note below, this is the *current* rate, not what was actually paid. |
| `hourly_rate_snapshot` — the actually-paid rate, frozen per-assignment | `src/modules/04_hostesses/api.js:417-419` (quoted): `🔴 hourly_rate_snapshot מוקפא כאן ולא נקרא מאוחר יותר (§א2): "הבטחנו לה תעריף במייל, ומייל הוא הבטחה". עדכון תעריף במאגר מחר אינו משנה זימון שכבר יצא.` | **CONSUME — this, not `hostesses.hourly_rate`, is the correct source for a salary calculation.** A later change to a hostess's base rate must not retroactively change what a past shift owes her. |
| `actual_hours` per assignment, frozen at closing | `close_project_operationally` writes `assignments.actual_hours` per row (§3 above) | **CONSUME** — `salary owed for one shift = assignments.hourly_rate_snapshot × assignments.actual_hours`, both already frozen by the time מ8 would read them. |
| `assignments.personal_bonus` | `docs/schema.sql` (baseline, `assignments` table) — column exists, `numeric not null default 0` | **CONSUME (read) — explicitly reserved for מ8**: `supabase/migrations/20260814140015_module6_projects_columns_and_constraints.sql:40` (quoted) — *"`assignments.personal_bonus` נשארת — היא של מודול 8."* (This is the project-level `project_bonus` column that was **dropped** in the same migration because it had no reader/writer — `personal_bonus` on `assignments` was kept for exactly this reason.) |
| `assignments.salary_report_id` — FK to `salary_reports`, already in the schema | `docs/schema.sql` baseline; `docs/db_roadmap.md:349` — *"`salary_report_id` FK index (C-1, M8)"* still pending | **EXTEND (add the missing index) / CONSUME (the column+FK already exist)** — the link from an individual paid shift to the monthly report it was rolled into is already modeled; only its index is flagged as outstanding, owned by מ8. |
| Bank details (`bank_name`, `bank_branch`, `bank_account`) — PII | `docs/schema.sql` baseline `hostesses` table; column-level protection status | 🔴 **MISSING / open, and it is a currently-live gap, not hypothetical.** `docs/db_roadmap.md:348` (quoted): *"bank-column protection 🔴 (§7.63, deferred M6/M8)"* — this is the **one half of §7.63 that did NOT close** on 14/08 (the `projects`-column half did, via `set_project_finance_fields`, §4 above). RLS in this project is **row-level only** (`src/CLAUDE.md`, "עלות-הרכש אינה ב-products יותר" section, quoted: *"RLS ב-Postgres הוא ברמת-שורה ולא ברמת-עמודה, וכל המחוברים חולקים role אחד"*) — meaning **today, anyone with `view` or `edit` on module 'דיילות' (measured live 09/08: that's `hostesses`/`assignments`/etc. policies) can read every hostess's bank account number**, including roles that have nothing to do with payroll (e.g. a recruitment or logistics manager). The precedent for fixing this already exists in the codebase: `product_costs` was split out of `products` into its own table specifically to get column-level secrecy via table-level RLS (same file, "עלות-הרכש אינה ב-products" section) — the same technique (a `hostess_bank_details` child table gated on 'כספים') is the checkable precedent מ8's Discovery should weigh against, not a from-scratch design. |

**Absence check for a salary calculator today:** searched `src/lib/` and `src/modules/04_hostesses/` for `salary`/`שכר` (excluding column/table names already covered above) — no calculation function exists; `salary_reports.report_file_url` (baseline schema) implies the report is an **uploaded document**, not a computed-and-rendered screen — consistent with `salary_reports` being `deny-all` RLS today (below).

---

## 8. `salary_reports` table + open DB-design questions already logged

**Schema** (`supabase/migrations/20260629000000_baseline_schema.sql:154-159`) — minimal, as-yet unextended by any later migration (grepped `supabase/migrations/*.sql` for `alter table.*salary_reports` — zero hits):
```sql
create table salary_reports (
  report_id serial primary key,
  sent_date date not null,
  report_file_url text not null
);
```
No `month` column, no total-amount column, no customer/project linkage of its own (the only linkage is the reverse FK from `assignments.salary_report_id`).

**RLS status — confirmed live, 18/08/2026 (`supabase/migrations/CLAUDE.md`, "מוקש: טבלה חדשה בשימוש ראשון" section, quoted):**
> *"טבלה עסקית אחת בלבד נותרה `deny-all` מחוסר-בנייה — **`salary_reports`** (מ8 יפתח אותה)."*

**Open DB-design items already logged, not yet ruled** — `docs/db_roadmap.md:351` (quoted): *"salary_reports | month-id UNIQUE (§7.40/§7.47-mirror) · document model (§7.68) · storage (§7.61)"*. These three are genuinely open (a UNIQUE constraint on a month identifier to prevent double-filing the same month; whether the "document model" is upload-only vs. computed; which Storage bucket). The `finance` Storage bucket already exists and is pre-provisioned for exactly this (§9 below) — the "storage (§7.61)" half of this open item already has its bucket built, just unused.

**Verdict: table exists but is empty of real structure and fully deny-all — MISSING, מ8 builds the extension migration(s).**

---

## 9. `finance` Storage bucket — already provisioned, unused

`supabase/migrations/20260814141049_module6_storage_reports_and_finance.sql` (lines 53-58, 106-148):
- `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values (..., ('finance', 'finance', false, 10485760, array['application/pdf','image/jpeg','image/png']), ...)` — **private**, 10 MiB, PDF/JPG/PNG.
- Four RLS policies already created (`finance_read_by_permission`, `finance_insert_by_permission`, `finance_update_by_permission`, `finance_delete_by_permission`), all gated on module **'כספים'**, `edit` for write / `edit`-or-`view` for read.
- Explicit comment (line 111, quoted): *"מודול 6 אינו כותב לכאן כלל — מודול 8 הוא הכותב (AS-4)."*
- The 10 MiB size **was never ruled** — quoted (line 26-27): *"⚠️ finance לא הוכרע — רק reports הוכרע... finance שומר על תקדים marketing (10 MiB). האסימטריה היא החלטה, לא טעות-הקלדה."* — i.e., מ8's Discovery inherits an un-reviewed default it may want to revisit, not a locked decision.

**Verdict: CONSUME as-is** (bucket + all four policies exist and are correctly gated) — מ8 needs zero Storage migration work, only client code that uploads to `finance` the same way M6's `closingApi.js` uploads to `reports` (same pattern: `supabase.storage.from('finance').upload(...)`).

---

## 10. `src/CLAUDE.md` — every finance/מ8 mine recorded there, quoted verbatim

- **RLS deny-all list** (current section "🚨 RLS — הכשל השקט המרכזי"): *"כרגע deny-all (RLS פעיל, אפס policies): `salary_reports` (מ8) · `logistics` (מ5)."*
- **9 email templates, not 6** — the file's own §"📧 שליחת מייל" note (which the sweep found is itself internally stale — it says "9" in the header sentence but the surrounding prose still enumerates only what's needed for a 6-template world): quoted, *"ב-params יש 9 תבניות-מייל (נמדד חי 09/08/2026)... הצעת-מחיר · זימון-משמרת · אישור-סופי-שיבוץ · ביטול-משמרת · תזכורת-משמרת (ארבע של דיילות) · משוב-לקוח · חשבונית · דוח-שכר · איפוס-סיסמה — כלומר מודולים 4, 8 ו-11 שולחים גם הם."* — this confirms the invoice (`חשבונית`) and salary-report (`דוח-שכר`) templates are counted among the canonical 9 and are named exactly as found in §2 above.
- **Entity-type extension discipline** (same section, quoted): *"`entity_type ⇒ מודול-נדרש` היא מפה סגורה בשרת... ערך חדש נוסף **יחד עם המיגרציה שמרחיבה את ה-CHECK של email_log** — לא לפניה, אחרת המייל יוצא והיומן נכשל בשקט."* — directly matches what §1 above found in the M6 migration comments; this is now confirmed as a standing rule, not a one-off M6 note.
- **jscpd duplication gate** — not a quoted line specific to מ8, but the standing rule ("⛔ אל תעתיק את הלוגיקה למודול חדש... jscpd חוסם ב-CI") is the enforcement mechanism behind the top-mine instruction; confirmed present in the same email section.
- **Money/RTL discipline applies to מ8's screens too** — `<Money>`, `<StatTile>`, `<LtrFieldGroup>` components are cross-module and mandatory for any new finance figure (gross profit, salary totals) — no מ8-specific carve-out exists in the file.

---

## Summary table (top-level, per the requested format)

| capability | where it lives | verdict for מ8 | notes |
|---|---|---|---|
| Email engine (`email.js`+`api/email.js`) | `src/lib/email.js`, `src/api/email.js` | **CONSUME as-is** | Zero duplication found anywhere in `src/` |
| `email_log.entity_type` CHECK | `20260814141050_module6_email_log_accepts_project.sql` | **EXTEND by one value + one read policy** (top-mine instruction) | Copy the exact M6 pattern, gate on 'כספים' |
| Invoice/salary-report email templates | `params` seed, `20260723112000...sql` | **already seeded; CONSUME the template, MISSING the send-screen** | Zero code reads them today |
| `close_project_operationally` (M6) | `20260814142439_module6_rpcs_reads_and_close.sql:270` | **CONSUME (read its outputs) — do not touch** | Writes `awaiting_invoice`; explicitly zero profit math (AR-6 quote) |
| `set_project_finance_fields` (M6, gated 'כספים') | same file, line 693 | **CONSUME as-is — already built, granted, unused** | Full-replace semantics on 6 fields; no lock check |
| `pricing.js` (`computeQuoteTotals`) | `src/lib/pricing.js:110` | **CONSUME `preVat`** for net-revenue-before-VAT | `deriveQuoteAmount`/`sumQuoteTotals` live in `quotes.js`/`customers.js`, not `pricing.js` |
| `quote_services.closing_unit_cost` | `docs/schema.sql:641` | **CONSUME** — planned gross profit fully computable today | Frozen at quote approval, same discipline as price |
| `list_projects_overview().planned_revenue` | `20260814142439...sql:220` | **CONSUME** — pre-VAT, permission-safe, already on the project card | `ProjectCardPage.jsx:526` |
| `deriveCustomerMetrics` avg-feedback stub | `src/lib/customers.js:252` | **CONFIRMED defect** — averages every scored project, no status filter | Fix is a product decision, not ruled here |
| `matchesCustomerFilters` satisfaction stub | searched, not found in code | **MISSING** — currently a §7 open question (item 80), not a stub | |
| Hostess wage source for salary calc | `assignments.hourly_rate_snapshot` × `assignments.actual_hours` | **CONSUME**, not `hostesses.hourly_rate` | Both frozen already by M4/M6 |
| `assignments.personal_bonus` | baseline schema | **CONSUME (read) — reserved for מ8 explicitly** | `project_bonus` (project-level) was dropped instead |
| Hostess bank-detail column protection | `hostesses.bank_*` | 🔴 **MISSING, live gap today** | Anyone with 'דיילות' view/edit can read bank accounts now; `product_costs` split is the precedent |
| `salary_reports` table | baseline schema | **MISSING structure, deny-all RLS** | month-UNIQUE / document-model / storage still open per db_roadmap |
| `finance` Storage bucket + 4 policies | `20260814141049...sql` | **CONSUME as-is** | Gated 'כספים', unused; 10MiB size never explicitly ruled |
| Feedback-survey response write-back (`feedback_status → 'completed'/'no_response'`) | searched, not found | 🔴 **MISSING — no RPC or code path sets these values anywhere** | Survey is an external Google Form; nothing currently closes the loop when a customer responds |
