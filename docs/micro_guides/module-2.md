# REG-IN — Micro-Guide | Module 2: Customers (לקוחות)

> **Audience:** a future Claude Code session with zero memory. Humans (Ishay) only paste prompts, answer decision questions, and approve at phase boundaries.
> **Language rule:** guide in English; Hebrew appears only as data (DB values like 'לקוחות', UI strings). All chat reports to Ishay — always in Hebrew.
> **Model rule (CLAUDE.md):** Opus for thinking steps (Phase 1 RLS, security, closing audit) · Sonnet for generation steps (Phase 3 UI, forms).
> **Iron rule 3 (stated once):** every business rule in code gets a Hebrew why-first comment.

---

## 1. 🟢 Live Status Header

| Field | Value |
|---|---|
| Module | 2 — Customers (לקוחות) |
| Owner | **ישי (started 10/07)** · Amit (may continue — writer-handover on THIS branch, not a parallel branch) |
| Branch | `ishay/module-2-customers` (created from fresh `dev` 10/07/2026, after PR #5 merged — step 0.1 ✅) |
| **Status** | ✅ **MERGED to `dev` — PR #6, merge commit `e69383a`** *(re-verified 12/08/2026 13:5X by `regin-docs-sync`: `merge-base --is-ancestor` → true; this row still read "awaiting PR/merge" — the merge was only ever recorded in the "Last updated" row below and in `STATUS.md`)*. **The close itself, kept: 🔒 Closed (closing audit 11/07/2026 22:33, fresh session).** Verdict **[YES]**; DoD **typed-echo SIGNED by Ishay 11/07 22:39 ("לקוחות DoD")**; the 16:21/17:07 UX-rounds' 👤 visual pass **SIGNED by Ishay 22:55 ("אישרתי ויזואלית הכל מעולה")** — every human gate of the module is now closed. All phases 1–5 ✅. Test data cleaned with his approval (customers/contacts/marketing = **0/0/0**, live-verified). |
| Last updated | **30/07/2026 14:45 — ⚠️ THE MODULE IS CLOSED AND MERGED, BUT THREE OF ITS FILES WERE REWRITTEN BY MODULE 3 (step 3.5). Read the §9 entry dated 30/07 before trusting the file list below.** In one line: `CustomerDetailsCard.jsx` **no longer exists** — the customer card is now a full record page (`CustomerDetailsPage.jsx`, route `customers/:customerId`), the list row **navigates** instead of opening a dialog, a sortable "סה"כ הכנסות" column was added, and `CustomersPage`'s search/filters/status/sort moved from `useState` into **URL query params**. Everything below this row still describes the module's own build (11/07) and is unchanged. ⚠️ **10/08/2026 — one more cross-module touch, this time from Module 4's accessibility pass:** `CustomersPage.jsx`'s list-card title `<h2>רשימת לקוחות</h2>` → `<h1>` (the page had no other heading; `axe-core` flagged `page-has-heading-one`). One line, no logic, no `data-testid` touched. See §9 (10/08). |
| **Active step** | **DONE — module closed. Remaining (human): Ishay's visual OK → push the audit-session doc commit → open PR base `dev` ← compare `ishay/module-2-customers` (instructions printed by the closing session, iron rule 17 🧩).** |

| Phase / step | Status |
|---|---|
| 0.1 Preconditions: M1 merged + branch created | ✅ done (M1 in dev `3ba5c5f`; branch `ishay/module-2-customers`; `.env.local` present) |
| Phase 1 — DB & RLS (1.1–1.4) | ✅ done (1.1–1.4; migration applied+verified; RLS matrix 12/14 SQL, 11–12 UI→4.1; Ishay signed 1.4 10/07) |
| Phase 2 — Business logic (2.1–2.2) | ✅ done (2.1 customers.js+validators+32 tests · 2.2 api.js — 9 queries, lint 0-err, from('customers') confined) |
| Phase 3 — UI (3.1–3.6) | ✅ ALL (3.1 list · 3.2 add/edit+§7.11 · 3.3 search/filter/sort · 3.4 archive · 3.5 marketing · 3.6 card — ⚠️ **the card was replaced by a record page 30/07/2026, step 3.5 of module 3; see §9**) — 👤 visual gate ✅ SIGNED (Ishay 11/07 02:56) |
| Phase 3 — enhancements (11/07, Ishay) | ✅ built (review fixes · +3 filters · הצג-ארכיון toggle · marketing→dialog · card 5-metrics) — gate green 36/36 · lint 0 · build ✓ |
| Phase 3.7 — multi-contact (Option C) | ✅ **DONE** — migration applied + api CRUD (`listCustomerContacts`/`replaceCustomerContacts`) + form repeatable rows + card display + `matchesText` search; 37/37 · lint 0 · build ✓ |
| Phase 4 — Control & integration (4.1–4.2) | ✅ DONE — 🤖-verified 11/07 02:48 (4.1 hybrid matrix walk · 4.2 regression 37/37 + 8/8 + RLS 6/9 baseline) + 👤 end-of-phase SIGNED (Ishay 11/07 02:56) |
| Phase 5 — QA & handoff (5.1–5.4) | ✅ ALL — 5.1 E2E · 5.2 gate · 5.3 docs · **5.4 closing audit DONE (11/07 22:33, fresh session): verdict [YES], DoD typed-echo signed 22:39** |
| UX/a11y hardening round (11/07 16:21, Ishay audit) | ✅ built + gate green — 11 fixes on-branch **pre-5.4** (🔴 data-loss · contacts validation+redesign · card RTL align · 404 · inactive logout · keyboard upload/rows · load-retry · teal token · a11y attrs); deferred sweep → M12 backlog; committed+pushed in `dd014bb` (audit-verified); 👤 visual pass ✅ SIGNED (Ishay 11/07 22:55) |

## 2. 📦 Context Packet for Claude

**Purpose (≤3 lines):** Central B2B customer registry (CRM): add/edit/archive customers (active/inactive, never delete), filter/search, controlled marketing distribution (`marketing_consent` only). Spec screen 5.6.3. **First RLS policies on a business table in the project — this is the binding precedent (§7.21 template) for every later module.**

**Capabilities delivered vs deferred (cross-module contract):**

| Capability | M2 delivers | Completed by | Tracked in |
|---|---|---|---|
| Add/edit/archive customer, forgiving search, filters, permission gates | ✅ full | — | — |
| Marketing upload + `mailto:` send to consented | ✅ full (interim send model) | M10: real server-side email + tracking | PROJECT_MASTER §6 |
| Customer card — details | ✅ full | — | — |
| Customer card — project history | ~~🚧 מ6~~ **paid 19/08/2026 (M6 step 3.8)** — real "מתקרבים"/"התקיימו" tabs render actual project data, not an empty-state placeholder | ~~M6 (projects data + policies)~~ ✅ | PROJECT_MASTER §6 |
| Customer card — totalRevenue + avgFeedback metrics | ~~🚧 מ3~~ **paid 30/07/2026 (M3 step 3.5)** · ~~🚧 מ8~~ **paid 28/08/2026 (M8 step 4.2)** — `avgFeedback` is computed in `deriveCustomerMetrics` (`src/lib/customers.js`, and its ה8 population filter counts only `feedback_status='completed'`); struck 01/09/2026 at m8's close, against a code measurement | ~~M3 (pricing SSOT)~~ ✅ + M8 (feedback) | PROJECT_MASTER §6 |
| Customer card — cumulative gross-profit metric (C6 §2.4.1 derived attr; distinct from the M7 monthly-KPI §7-item) | 🚧 מ8 — **still open, and narrowed 01/09/2026 at m8's close:** the NUMBER is built (`cumulativeProfit` in `deriveCustomerMetrics`, §7.79) and is deliberately **not displayed on the customer card**; the DISPLAY belongs to M11 per m8's §2.2. What remains here is the display only | M8 (owns the gross-profit formula — spec 5.14; retargeted from M7 10/07 evening, reviewer finding — M7 is the display-only dashboard; see §7.79) | PROJECT_MASTER §6 |
| Satisfaction stars in list + satisfaction filter | ~~🚧 מ8 · present-but-inert~~ **paid 28/08/2026 (M8 step 4.2)** — `lowSatisfactionOnly` is live in `matchesCustomerFilters`, wired through `CustomersFilterSheet` + the `customers-preset-low-satisfaction` chip, with its own test file; struck 01/09/2026 at m8's close | M8 | PROJECT_MASTER §6 |

Rule (ENFORCED — iron rule 15 + Stop hook): every 🚧 row above carries a `🚧 מN` token (N = the target module that finishes it) and MUST have a byte-matching `🚧 מN` line in `PROJECT_MASTER.md` §6, written in the SAME session the 🚧 is created. The opening prompt of every module greps `🚧 מ<its-number>` in §6 to learn every debt owed to it — that is how future sessions know to come back and finish these. A 🚧 row with no matching §6 line is a silent-debt BUG that the Stop hook (`check-docs-updated.sh`, enforcement 0ג) blocks session end on. (🚧 = cross-module capability debt; distinct from ⏳ deferred-decision and 🕓 freshness-stamp.)

**Existing files to touch/reuse (verified on disk 06/07/2026):**

| Path | Role for this module |
|---|---|
| `src/App.jsx:59-66` | `/customers` route already exists (`ProtectedRoute allow="לקוחות"` wrapping `UnderConstruction`) — swap in `CustomersPage`. Sidebar is dynamic from `modules` table — no change needed. |
| `src/contexts/AuthContext.jsx:22` | `permissions` map `{ [module_name]: 'edit'|'view'|'blocked' }` — use `permissions['לקוחות'] === 'edit'` for edit-vs-view UI mode. |
| `src/lib/permissions.js:8` | `isAllowed(user, permissions, allow)` — client-side convenience only; real enforcement is RLS. |
| `src/lib/validators.js` | `EMAIL_REGEX`, `ISRAELI_MOBILE_REGEX` — extend with `COMPANY_ID_REGEX` (9 digits) **only**. ⚠️ **Customer phone = FREE-FORM (do NOT add/apply a customer phone regex).** Spec sets NO phone format for customers — the 10-digit/050-059 rule is the hostess screen only (C5 §5.6.17.4); the mockup `03-1234567` is a placeholder, not a constraint. Validate phone as non-empty only (decision-Ishay 10/07 — faithful to spec; reverses the earlier invented `ISRAELI_PHONE_REGEX`). |
| `src/lib/constants.js` | `CEO_ROLE_NAME`, `SYSTEM_MODULES` — pattern reference for canonical Hebrew strings. |
| `src/supabaseClient.js` | Import as `@/supabaseClient` (NOT `@/lib/`). sessionStorage persistence. |
| `src/modules/01_auth/UsersManagementPage.jsx` | The as-built pattern to copy: list + dialog CRUD + **bidirectional active/inactive with dimmed rows** (binding convention, module-1.md Deviations 02/07). |
| `e2e/auth.spec.js`, `e2e/permissions.spec.js` | Playwright patterns (env-gated creds, workers=1, Chromium). |

**Files to create:** `src/modules/02_customers/` → `api.js` (ALL Supabase queries of this module — iron rule 14), `CustomersPage.jsx`, `CustomerFormDialog.jsx`, `CustomerDetailsCard.jsx` (⚠️ **deleted 30/07/2026** → `CustomerDetailsPage.jsx`), `CustomersFilterSheet.jsx`, `MarketingPanel.jsx` · `src/lib/customers.js` + `src/lib/customers.test.js` · `e2e/customers.spec.js` · one migration (step 1.1).

**DB:** table `customers` (docs/schema.sql:41-51): `customer_id` **bigint surrogate PK (§7.64, 10/07)** + `company_number` text unique not null (=ח"פ; renamed from the old text PK), `customer_type` check in (`private_company`,`government`,`production_company`,`nonprofit`), `company_name`, `contact_name`, `phone`, `email` (all not null), `discount_percent` numeric default 0, `marketing_consent` bool default false, `status` check (`active`,`inactive`) default `active`. **Current RLS state: enabled live with ZERO policies (deliberate deny-all; live-verified 06/07 per module-1.md §2) — NOT yet codified in any migration; step 1.1 codifies it.** Relevant existing migrations: `20260629000000_baseline_schema.sql:43` (created `customers`) · `20260702195258_harden_current_user_role_id.sql` (hardened `current_user_role_id()` — docs/schema.sql:190-196 — the helper EVERY new policy calls). Related FK: `quotes.customer_id → customers` (schema.sql:86, on delete restrict; **type→bigint in 1.1 per §7.64**) — Module 3 depends on this table. `projects`/`quotes` are ALSO deny-all until M3/M6 → customer-card history queries legitimately return empty.

> ℹ️ **`customers` is EMPTY (clean state).** A dev-seed of 5 fictitious customers was briefly added (10/07) then **removed at Ishay's call** — back to the 0-row state the steps assume. The seed script `supabase/seed_dev_customers.sql` is kept **but is NOT applied**; run it only if sample data is wanted for UI dev (the identity sequence continues past 11, so re-seeded ids would be 12+ — gaps are normal for surrogate keys). See §9.

**Dependencies:** Module 1 auth infra (AuthContext, ProtectedRoute, matrix seed: roles=5/modules=9/permissions=45). Permission row for this module: `module_name='לקוחות'`; seed per PROJECT_MASTER §3 — מנכ"ל=edit, מנהלת פרויקטים=edit, מנהלת כספים ולקוחות=edit, מנהלת גיוס ושיבוץ=blocked, מנהלת לוגיסטיקה=blocked (no seeded `view` — hence view-tier scenarios 13–14).

**🔑 Test Identities (load-bearing — resolve ONCE here, reuse in steps 1.3 / 3.1 / 4.1 / 5.1):**
- **The 5 seeded test users (one per role).** Resolve the live `role → email → user_id` mapping from the seed — do NOT hard-code: `select u.user_id, u.email, r.role_name from users u join roles r on u.role_id = r.role_id order by r.role_name;` (MCP `execute_sql`, read-only).
- **Impersonation for RLS scenarios (step 1.3 — SQL, no password):** `select set_config('request.jwt.claims', json_build_object('sub', '<user_id-uuid>', 'email', '<email>', 'role', 'authenticated')::text, true); set local role authenticated;`. `current_user_role_id()` resolves the caller via `auth.uid()`←`sub` (and `auth.email()`←`email`) — **BOTH keys must be present or every RLS query silently returns 0 rows** (a broken-impersonation deny-all is indistinguishable from a working RLS deny-all).
- **Positive control (MANDATORY in step 1.3):** מנכ"ל (edit on every module) MUST return ≥1 row on the SELECT scenario — if it returns 0, the impersonation is broken, NOT the policy. Negative control: מנהלת לוגיסטיקה (blocked) returns 0. Both are already scenarios in step 1.3's table; treat CEO=1-row as the impersonation sanity gate before trusting any deny result.
- **UI login (steps 3.1 / 4.1 / 5.1 — needs a password):** creds live in `.env.local` as `E2E_<ROLE>_EMAIL` / `E2E_<ROLE>_PASSWORD`. ⚠️ Only `E2E_FINANCE_*` + `E2E_LOGISTICS_*` are provisioned (added at step 5.1, 👤). CEO / project-manager / recruiter UI-login (needed earlier by 3.1/4.1) is NOT provisioned by default — at the 4.1 👤 gate either reuse a same-tier provisioned role or have Ishay add the missing `E2E_*`; do NOT assume they exist.

**Spec & mockups:** PROJECT_MASTER §5.3; frozen spec C5 §1.5.3 (process + field list incl. Hebrew type labels) + §1.6.3 (screen); mockups `docs/mockups/customers-screen/01-06.png` (visual reference ONLY): 01 list+marketing area, 04 filter sheet (type/satisfaction/consent/min-discount), 05-06 add/edit dialog. Design language: PROJECT_MASTER §4 (teal `#14B8A6`, bg `#F8FAFC`, right sidebar) — approved and binding (iron rule 8).

**Environment facts:** Vite dev `npm run dev` (port 5173) · Windows + PowerShell (repo hooks are bash — run via Git Bash) · alias `@/`→`src/` · Hebrew RTL everywhere · shared Supabase project `Reg-In` (ref `yfeovxppnfoafmfbdfvh`, eu-west-3) — **every schema change coordinated, migrations only** · Vitest `npm run test:run` · Playwright `npm run test:e2e` (needs `E2E_*` in `.env.local`) · gate `npm run verify`.

## 3. 🧭 Decisions Ledger

| Item | Ruling | Who | Date | Unblocks |
|---|---|---|---|---|
| §7.21 | RLS = role→module matrix ONLY; standard 2-policy template (PROJECT_MASTER §7.21); `module_name='לקוחות'` for this table | Ishay | 06/07 | Step 1.1 |
| §7.3 | `customer_type` UI labels = frozen-spec wording (C5 §1.5.3), 1:1: `private_company`=חברה פרטית · `government`=חברה ממשלתית · `production_company`=חברת הפקה · `nonprofit`=עמותה. Mockup labels rejected | Ishay | 06/07 | Steps 2.1, 3.2, 3.3 |
| §7.11 | No merge feature. ח"פ (now `company_number`, UNIQUE — the surrogate `customer_id bigint` is the PK per §7.64) is the single canonical business identifier. UX requirement (refined 07/07): forgiving-but-unambiguous search — match by contact name alone, company name alone, or ח"פ prefix; every result displays company_name + contact_name + ח"פ so the user picks exactly the right one. Add-flow keys on ח"פ — existing active ח"פ ⇒ friendly error ("חברה זו כבר רשומה במערכת") + quick link to edit the existing card; existing **archived** ח"פ ⇒ explicit "restore from archive?" offer. Historical duplicate (if ever) ⇒ manual archive, no auto-fix script. Search logic lives in `src/lib/customers.js` for reuse by M3's quote-flow customer picker | Ishay | 06–07/07 | Steps 2.1, 3.2, 3.3 |
| local | Marketing "send" in M2 = upload to Supabase Storage + `mailto:` with BCC of consented emails + file link. Real server-side email = Module 10 (deviation logged, section 9) | Ishay | 06/07 | Steps 1.1 (bucket), 3.5 |
| local | Marketing bucket is **public** (permanent `getPublicUrl` links; signed-URL proposal explicitly rejected — accepted limitation, marketing material is non-sensitive) | Ishay | 06/07 | Steps 1.1, 3.5 |
| local | View-tier RLS scenarios 13–14 approved into step 1.3 (06/07); "restore from archive?" offer in the add-flow approved (07/07 — reconsidered after initial rejection) | Ishay | 06–07/07 | Steps 1.3, 3.2 |
| local | Customer card built in full with empty states ("אין נתונים עדיין") for project history & derived metrics; revenue formula NOT duplicated here (M3 SSOT owns pricing) | Ishay | 06/07 | Step 3.6 |
| inherited | Bidirectional active/inactive archive, dimmed rows, no "delete" framing (module-1.md binding pattern) | Ishay | 02/07 | Step 3.4 |
| **✅ RULED — nod bundle APPROVED (Ishay, 10/07/2026; live pre-checks all green: 0 NULL role_ids, 0 dup role/module names, RLS already live)** | **All four go into step-1.1 migration:** §7.40(א) — `unique` on `roles.role_name` + `modules.module_name`. §7.48 — `enable row level security` (idempotent) on the 10 remaining business tables (`customers` already in the base). §7.62 — `alter table users alter column role_id set not null` (ONLY the users.role_id part; quotes/projects stay for M3/M6). §7.73 — `created_at`/`updated_at timestamptz` + `moddatetime` trigger on all 11 business tables (needs `create extension if not exists moddatetime`). One infra migration bundled with the customers policies. | Ishay | 10/07 | Step 1.1 (write now) |
| **✅ RULED — §7.63 DEFERRED to M6/M8 (Ishay, 10/07/2026)** | Column-ownership direction NOT decided now — `customers` is single-module so §7.21 applies as-is for step 1.1. §7.63 stays OPEN, targeted at M6/M8 where finance actually writes columns on another module's table; the concrete case will shape the direction (child-table split / RPC / masked views). Do NOT blindly copy §7.21 to multi-module tables later — flag at M6/M8. | Ishay | 10/07 | (M6/M8 gate) |
| **✅ RULED — §7.64 (Ishay, 10/07/2026)** | **Surrogate PK adopted in M2 step 1.1:** `customer_id bigint generated always as identity` PK; ח"פ → `company_number text unique not null`. Fixes the FK-blocked-typo + dual-government-unit problems. **Deviation from frozen C6 §2.4.1** (which draws ח"פ as PK) — logged in §9. The canonical PRINCIPLE is also ruled for the rest: external/PII→surrogate, system-owned SKU→natural+`ON UPDATE CASCADE`, `users.email`→accept (sku=M3 · ת"ז=M4 · email=M9) | Ishay | 10/07 | Step 1.1 (write now) |
| **✅ RULED — Phase-3 P13 sweep (Ishay, 10/07/2026; all six recommendations approved after re-think)** | **(1) Search = ONE box** above the list driving the §7.11 forgiving search (mockup's dual global+in-list boxes REJECTED — spec requires only a filterable list). **(2) Column-header sorting = BUILD** (via the tested `sortCustomers`, 4 keys, asc/desc; cheap + zero new UI logic). **(3) Marketing panel: simple "החלף קובץ" + remove buttons = BUILD; drag-drop = REJECTED** (complexity without spec value). **(4) §7.80 M2-scope nodded:** inert stars + "אין נתונים עדיין", NO text-tag. **(5) §7.65 M2 ships WITHOUT email UNIQUE** — external `UNIQUE(email, company_number)` proposal rejected as a mathematical no-op (`company_number` alone is already unique). **(6) §7.34 M2 ships plain toggle, NO guard** — a guard now is untestable dead code (quotes/projects empty + deny-all); direction-leaning recorded for M3's ruling: warning-not-block. **FREE-HAND GRANT: search/filter/sort implementation details delegated to Claude's judgment (Ishay: "יד חופשית... לפי שיקול דעתך") — narrate 🗣️ what's being built, report deviations, but no per-detail approval wait.** | Ishay | 10/07 | Steps 3.1, 3.2, 3.3, 3.4, 3.5 |
| **CLOSED (M2 scope; full ruling = the "Phase-3 P13 sweep" row above)** | §7.65 — M2 ships `customers.email` WITHOUT UNIQUE. Hostesses-half stays **OPEN for M4** | Ishay | 10/07 | Step 3.2 ✓ |
| **CLOSED (M2 scope; full ruling = the "Phase-3 P13 sweep" row above)** | §7.34 — M2 ships the plain archive toggle, NO guard. Stays **OPEN for M3** (direction-leaning: warning, not block) | Ishay | 10/07 | Step 3.4 ✓ |
| **OPEN — deferred** | Customer-card metric wiring: totalRevenue ← M3 pricing SSOT (`src/lib/pricing.js`), avgFeedback ← `projects.feedback_score` (M8 data). Critical at M3/M8 | — | — | (placeholders only in M2) |
| **OPEN — deferred** | §7.23 audit trail — customer edits are last-write-wins by design; revisit after M12 | — | — | — |
| **OPEN — anchored (surfaces at step 3.5)** | §7.36 (already open in PROJECT_MASTER — NOT re-created) — upload↔DB atomicity: the marketing upload is the FIRST place a Storage-write + DB-write can half-fail (orphan file). Canonical order Storage→DB + orphan-cleanup on partial failure; anchored here per the spec tying it to M2 ("first arises here") | — | — | Step 3.5 note |
| **~~OPEN~~ RULED 26/08/2026 (m8 Discovery, Claude-by-delegation — placeholder in step 3.6; retargeted M7→M8 10/07 evening)** | §7.79 — per-customer cumulative gross-profit definition (population/formula): C6 §2.4.1 lists it as a derived customer attr (citation corrected — C5 §5.6.3 names only revenue+feedback), but no formula. M2 ships a placeholder ("אין נתונים עדיין"); **M8** wires it (owns the profit formula — spec 5.14, with §7.78 exec `מ3/6/8`). **Ruling: Σ frozen final profit over `finished` projects only; avg feedback over `feedback_status='completed'` only — `deriveCustomerMetrics` gains both filters at m8 build (§7.79 in the register carries the full wording)** | — | — | Step 3.6 (placeholder) |
| **CLOSED (M2 scope; full ruling = the "Phase-3 P13 sweep" row above)** | §7.80 — M2 ships inert stars + "אין נתונים עדיין", does NOT build the "מצוין" text-tag (mockup-only, spec-silent). Stays **OPEN for M8** (sets the thresholds) | Ishay | 10/07 | Step 3.1 ✓ |
| **RULED — §7.12 (07/07)** | quote-PDF = generated on-the-fly from data, NO stored file (`quotes.pdf_url` deprecated). Nothing for M2 to reserve against; the bucket stays named `marketing` for clarity, not collision-avoidance | Ishay | 07/07 | — |

## 4. 🛡️ Security & Auth Model Statement (iron rule 9)

- **RLS (the heart of this module):** the §7.21 standard template instantiated on `customers` with the exact policy `module_name` string **'לקוחות'** — `customers_select_by_permission` (SELECT for `edit`/`view`) + `customers_write_by_permission` (ALL for `edit`, USING+WITH CHECK). Both resolve the caller via `current_user_role_id()` (SECURITY DEFINER, hardened, module-1). This is the FIRST business-table instantiation — it must match §7.21 verbatim because later modules copy it.
- **UI gates (2nd layer, convenience only):** route `ProtectedRoute allow="לקוחות"` (already live, App.jsx:59-66); Sidebar hides `blocked` automatically; **edit-vs-view rendering**: all mutating controls (add/edit/archive/marketing-send/consent-toggle) render only when `permissions['לקוחות']==='edit'` — a `view` grant (possible via live matrix even though not seeded) gets a read-only screen instead of buttons that fail at RLS.
- **Storage:** **public** bucket `marketing` (ruling above): downloads via permanent public URL; API operations still governed by 4 `storage.objects` policies keyed to the SAME permission rows (list/read=edit/view, insert/update/delete=edit).
- **Session/OAuth:** unchanged — inherits Module 1 central gate (AuthContext signs out sessions without an active `users` row; sessionStorage persistence).
- **Accepted limitations (deliberate, documented):** no audit trail on customer edits — last-write-wins (§7.23) · `mailto:` send has no delivery guarantee/tracking, some clients mishandle `bcc`-only links, and total URL length is practically capped (~2,000 chars on Windows) — mitigated by copy-to-clipboard fallbacks (step 3.5); real send = M10 · marketing files are world-readable to anyone holding the link (public bucket — explicit ruling) · customer-card history/metrics empty until M3/M6/M8 add their policies+data · client-side validation duplicable — DB constraints are the real wall.

## 5. 🏗️ Phase & Step Plan

**Model & effort per phase (CLAUDE.md model rule, instantiated — pick before each build session):**

| Phase | Model | Effort | Why |
|---|---|---|---|
| Phase 1 — DB & RLS (1.1–1.4) | **Opus** | **High** | First business-table RLS in the project; the precedent every module copies. Security mistakes here propagate system-wide |
| Phase 2 — Business logic (2.1–2.2) | Sonnet | Medium | Mechanical extraction into `lib`/`api.js` following established patterns; unit tests keep it honest |
| Phase 3 — UI (3.1–3.6) | Sonnet | Medium | Generation work (tables, dialogs, RTL) copying Module-1's as-built screens; design language is fixed (§4) |
| Phase 4 — Control & integration (4.1–4.2) | **Opus** | **High** | Security-model regression (iron rule 9) — thinking work, adversarial mindset |
| Phase 5 — QA & handoff (5.1–5.3) | Sonnet | Medium | E2E specs mirror existing Playwright patterns; docs persistence is procedural |
| Step 5.4 — Closing audit | **Opus** | **High** | Formal audit + merge verdict (the closing template demands independent re-verification) |

### Step 0.1 — Preconditions 🔻👤
**Goal:** legal starting state before any work.
**Files:** none (git + env state).
**What:** (a) Module 1 merged to `dev` (Ishay's PR); (b) `git checkout dev && git pull && git checkout -b amit/module-2-customers`; (c) `.env.local` present with Supabase keys.
**Verify (run these before proceeding):** `git branch --show-current` → `amit/module-2-customers`; `git log --oneline dev -5` → shows the M1 merge commit; `Test-Path .env.local` → True.
**🔻👤 gate — stated justification (template allows adapting with a reason): the merge/PR is Ishay's manual GitHub action, and (c) touches secrets (`.env.local`) — the secrets human-gate applies.**

### Phase 1 — DB & RLS

#### Step 1.1 — Write the migration (first business-table RLS in the project) 🔻👤
**Goal:** one named migration: the 2 §7.21 policies + defense-in-depth constraints + marketing bucket & its 4 policies.
**Files:** `supabase/migrations/<YYYYMMDDHHMMSS>_module2_customers_rls_and_marketing.sql`.
**What — full SQL (exactness is load-bearing; §7.21 template verbatim, placeholders resolved):**
> 🔗 מראת §7.21 — SSOT: PROJECT_MASTER §7 (the two `customers` policies mirror the standard template incl. the `(select …)` initplan wrap; synced by regin-docs-sync — never hand-edit here without updating §7 first).
> **✅ RULED 10/07 — THIS migration (step 1.1) now bundles three sections (verbatim SQL = the migration file `20260710160735_module2_customers_surrogate_key_rls_and_marketing.sql`):** **SECTION 1** — §7.64 customers surrogate-key surgery (drop `quotes_customer_id_fkey`; drop PK; rename `customer_id`→`company_number` + `set not null`; add `customer_id bigint generated always as identity` PK; `company_number` unique + 9-digit check; alter `quotes.customer_id`→bigint; re-add FK). **SECTION 2** — the nod-bundle: §7.40(א) unique on `roles.role_name`/`modules.module_name`; §7.48 `enable row level security` on the 10 remaining business tables (customers already on); §7.62 `users.role_id SET NOT NULL` (0 NULLs live 10/07 ✓); §7.73 `created_at`/`updated_at` + `moddatetime` trigger on all 11 business tables. **SECTION 3** — the customers RLS policies + marketing bucket (below). One infra migration.
> **§7.63 awareness (08/07 audit):** `customers` is single-module, so the §7.21 template applies here as-is — but this migration is the project-wide precedent. At the 1.1 👤 gate, ask Ishay for the §7.63 *direction* (column-ownership for multi-module tables like `projects`/`hostesses`) so later modules don't copy this pattern blindly where it doesn't fit.

```sql
-- why: מודול 2 — ה-policies העסקיות הראשונות בפרויקט לפי תבנית §7.21 (הרשאה לפי מטריצה בלבד,
-- בלי בעלות-רשומה). ה-RLS על customers פעיל בפרויקט החי מאז מודול 1 אך לא קודד באף מיגרציה —
-- כאן הוא מקודד לראשונה (idempotent). בנוסף: constraints הגנה-לעומק, ו-bucket שיווקי ציבורי.
-- הערה על שורת ה-INSERT ל-storage.buckets: זהו Seed-תצורה חד-פעמי (מקביל לחריג המותר של
-- roles/modules/params בפרוטוקול ה-DB) — לא דאטה עסקי.
-- ===== SECTION 1 — §7.64 customers surrogate PK (RULED 10/07; deviation from frozen C6 §2.4.1) =====
-- why: ח"פ הוא מפתח חיצוני שיכול לזוז (תיקון-הקלדה) ולהתנגש (שתי יחידות של אותו גוף ממשלתי = אותו ח"פ);
-- PK חייב להיות קבוע-ופנימי. לכן מספר-רץ פנימי כ-PK, וח"פ יורד לעמודה עסקית unique. הטבלה ריקה (0 שורות) — זול.
alter table quotes drop constraint quotes_customer_id_fkey;
alter table customers drop constraint customers_pkey;            -- לאמת שם-PK חי לפני הרצה (default: customers_pkey)
alter table customers rename column customer_id to company_number;
alter table customers alter column company_number set not null;  -- ח"פ = חובה (§7.11)
alter table customers add constraint customers_company_number_key unique (company_number);
alter table customers add column customer_id bigint generated always as identity primary key;
alter table quotes alter column customer_id type bigint using customer_id::bigint;  -- טבלה ריקה
alter table quotes add constraint quotes_customer_id_fkey
  foreign key (customer_id) references customers(customer_id) on delete restrict;

-- ===== SECTION 2 — nod-bundle (§7.40א · §7.48 · §7.62 · §7.73), RULED 10/07 =====
-- why §7.40(א): role_name/module_name משמשים כמחרוזות בכל ה-RLS — UNIQUE מונע כפילות-שקטה ששוברת אבטחה.
alter table roles   add constraint roles_role_name_key     unique (role_name);
alter table modules add constraint modules_module_name_key unique (module_name);
-- why §7.48: קידוד enable-RLS (idempotent) ל-10 הטבלאות שנותרו (customers כבר פעיל; deny-all מכוון עד policies).
alter table products enable row level security;
alter table price_tiers enable row level security;
alter table params enable row level security;
alter table quotes enable row level security;
alter table quote_services enable row level security;
alter table projects enable row level security;
alter table hostesses enable row level security;
alter table salary_reports enable row level security;
alter table assignments enable row level security;
alter table logistics enable row level security;
-- why §7.62: כל שרשרת ה-RLS נשענת על role_id (משתמש בלי תפקיד = NULL = מסכים ריקים). 0 NULLs חי 10/07 ✓.
alter table users alter column role_id set not null;
-- why §7.73: created_at/updated_at + moddatetime לכל 11 הטבלאות העסקיות. דוגמה לטבלה אחת; המיגרציה חוזרת על
-- הבלוק ל-11: customers, products, price_tiers, params, quotes, quote_services, projects, hostesses,
-- salary_reports, assignments, logistics.
create extension if not exists moddatetime;
--   alter table <t> add column created_at timestamptz not null default now();
--   alter table <t> add column updated_at timestamptz not null default now();
--   create trigger <t>_set_updated_at before update on <t> for each row execute function moddatetime(updated_at);

-- ===== SECTION 3 — customers RLS (§7.21) + marketing bucket =====
alter table customers enable row level security; -- idempotent (כבר פעיל בפרויקט החי)

create policy "customers_select_by_permission" on customers for select to authenticated
  using (exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level in ('edit', 'view')
  ));

create policy "customers_write_by_permission" on customers for all to authenticated
  using (exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'
  ))
  with check (exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'
  ));

-- why: הגנה-לעומק מתחת לולידציית ה-UI — ח"פ (`company_number`) = בדיוק 9 ספרות (PROJECT_MASTER §5.3;
-- האפיון הקפוא 1.5.3 קובע ייחודיות בלבד), אחוז הנחה 0–100. מותנה באימות שהטבלה ריקה (צעד 1.2).
alter table customers add constraint customers_company_number_9_digits check (company_number ~ '^[0-9]{9}$');
alter table customers add constraint customers_discount_range check (discount_percent >= 0 and discount_percent <= 100);

-- why: אזור השיווק (מסך 5.6.3) — bucket ציבורי (הכרעת ישי 06/07: קישור קבוע, לא Signed URL);
-- פעולות ה-API עדיין נשלטות ב-policies הנגזרות מאותן שורות מטריצה של 'לקוחות'.
insert into storage.buckets (id, name, public) values ('marketing', 'marketing', true)
  on conflict (id) do nothing;

create policy "marketing_read_by_permission" on storage.objects for select to authenticated
  using (bucket_id = 'marketing' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level in ('edit', 'view')
  ));

create policy "marketing_insert_by_permission" on storage.objects for insert to authenticated
  with check (bucket_id = 'marketing' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'
  ));

create policy "marketing_update_by_permission" on storage.objects for update to authenticated
  using (bucket_id = 'marketing' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'
  ))
  with check (bucket_id = 'marketing' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'
  ));

create policy "marketing_delete_by_permission" on storage.objects for delete to authenticated
  using (bucket_id = 'marketing' and exists (
    select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'לקוחות')
      and p.permission_level = 'edit'
  ));
```

**Known fallback (write it into the migration header if hit):** on current Supabase projects the `storage` schema may be owned by `supabase_storage_admin` — if `create policy on storage.objects` fails with 42501 "must be owner of table objects", create the 4 policies with these exact definitions via Dashboard → Storage → Policies instead, and **comment them out** in the migration file as a documented block. ⚠️ Do NOT leave live `create policy on storage.objects` statements in the file — they will re-fail on every `db push` / clean replay and break reproducibility (the very gap §7.48 exists to close). Add an "↳ as-built" note here + a dated line in section 9. **Reproducibility note for the closing audit:** if this fallback is taken, the 4 storage policies live only in the Dashboard, so a fresh-environment replay yields `2 customers + 0 storage` policies — record this explicitly so the drift-check does not misread the legitimate difference as a defect.
**Verify 🤖 (pre-gate):** `Test-Path supabase/migrations/<name>.sql` → True; pass criterion: the two `customers` policy bodies are textually identical to PROJECT_MASTER §7.21's template after substituting `<table_name>`=customers, `<שם-המודול-המתאים>`='לקוחות' (side-by-side diff shows zero logic differences).
**🔻👤 gate — MANDATORY (typed-echo, DB protocol): shared Supabase project.** Ishay reviews the SQL text AND **types the migration name** (not "yes"/"approve") as the irreversible-apply confirmation — this is one of the two typed-echo gates in the project (CLAUDE.md DB protocol). That typed-echo IS the apply authorization consumed at step 1.2; a plain approval here is NOT sufficient to apply.

#### Step 1.2 — Apply migration + snapshot 🔻🤖
**Goal:** policies live in the shared project; snapshot + migration committed together (DB protocol).
**Files:** `docs/schema.sql` (update), the step-1.1 migration (commit).
**What:** (a) pre-check: `select count(*) from customers;` **and `select count(*) from quotes;`** (MCP execute_sql) → **both** must be `0` (the §7.64 surrogate surgery + `quotes.customer_id` type-change require empty tables); if non-zero — STOP, consult Ishay (fallback: add constraints as `not valid` + `validate constraint` after cleanup). (b) Apply via Supabase CLI (`supabase db push`) or MCP `apply_migration` (authorized by the **typed-echo** from the 1.1 gate — a plain 1.1 approval is not enough). (c) Update `docs/schema.sql` by appending the new DDL into the documented snapshot in its existing comment style (it is a curated, commented snapshot — do NOT overwrite it with a raw dump; Studio "Generate schema SQL" is the manual alternative). Note: `storage.*` objects won't appear in the public-schema snapshot — add them as a commented block; their source of truth is the migration file + CHANGELOG DB line. (d) Commit **migration + snapshot together**: `git commit -m "db: מודול 2 — RLS ללקוחות לפי תבנית §7.21 + bucket שיווק + עדכון schema snapshot"`.
**Verify 🤖:** `select policyname from pg_policies where tablename='customers';` → exactly `customers_select_by_permission`, `customers_write_by_permission` · `select policyname from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'marketing_%';` → exactly the 4 names from 1.1 · `select count(*) from storage.buckets where id='marketing';` → 1 · **PK check → `customer_id / bigint`; `company_number` unique+not-null+9-digit check present; FK `quotes_customer_id_fkey` on bigint** · `git show --stat HEAD` lists both the migration and `docs/schema.sql`.
**✅ AS-RUN 10/07/2026:** applied via MCP `apply_migration` (remote version `20260710132720`) after the typed-echo. Live-verified: customers PK=`customer_id`/**bigint** · `company_number` unique+not-null+9-digit ✓ · **2** customers policies + **4** `marketing_*` storage policies ✓ · `marketing` bucket=1 ✓ · `quotes.customer_id`=bigint + FK ✓ · **11** moddatetime triggers · `users.role_id` NOT NULL ✓. Storage policies applied live (no 42501). Committed with `schema.sql` in **`edaae68`**; follow-up **`2da6d5e`** moved moddatetime→`extensions` (advisor `extension_in_public` cleared; advisors = baseline accepted, zero new).

#### Step 1.3 — Run the deferred 12(+2)-scenario RLS matrix 🔻🤖
**Goal:** close Module 1's formally-deferred gate (module-1.md step 5.2b) — now possible because `customers` has policies; plus the approved view-tier scenarios 13–14.
**Files:** none (SQL Editor / MCP; results recorded in this table).
**Method — impersonation transactions (Module 1's proven method), skeleton:**
```sql
begin;
-- identities from the Test Identities block (§2); BOTH sub (uuid) and email are required
select set_config('request.jwt.claims',
  json_build_object('sub','<user_id-uuid>','email','<email>','role','authenticated')::text, true);
set local role authenticated;
-- scenario query here (current_user_role_id() resolves via auth.uid()←sub; auth.email()←email)
rollback;  -- no data persists; test inserts vanish
```
Run order: 4 → 1 inside one transaction (scenario 1 needs the row inserted in 4), then the rest. 5 real test users exist (one per role — resolve them via the §2 Test Identities query). Scenarios 13–14 run in one rolled-back transaction that first grants `view` on 'לקוחות' to a blocked role.
**⚠️ Impersonation sanity gate (do this FIRST, before trusting any deny):** scenario 1 (מנכ"ל SELECT) MUST return the row. If it returns 0, the claims are broken (missing/invalid `sub`) — a broken-impersonation deny-all is indistinguishable from a real RLS deny-all, so every "0 rows" below would be a false pass. CEO=1-row is the positive control; מנהלת לוגיסטיקה=0 (scenario 2) is the negative control.

| # | Action | Actor (role) | Expected | As-run evidence |
|---|---|---|---|---|
| 1 | `select * from customers` | מנכ"ל | returns the row from #4 | ✅ **1 row** (CEO sees own insert) |
| 2 | `select * from customers` | מנהלת לוגיסטיקה (blocked) | 0 rows | ✅ **0** (RLS filters the CEO row) |
| 3 | `insert into customers(...)` | מנהלת לוגיסטיקה (blocked) | RLS violation error | ✅ **42501** new-row-violates-RLS |
| 4 | `insert into customers(...)` | מנכ"ל | succeeds | ✅ **inserted** (count→1) |
| 5 | `select * from roles; select * from modules;` | every role | rows for all | ✅ **roles=5, modules=9** (logistics) |
| 6 | `update permissions set ...` | non-CEO | 0 rows updated | ✅ **0 rows** |
| 7 | same update | מנכ"ל | succeeds (inside rollback!) | ✅ **45 rows** (in rollback) |
| 8 | `select * from users where email = auth.email()` | any role | exactly own row | ✅ **1** (own row) |
| 9 | `select * from users` | non-CEO | own row only | ✅ **1** (own only) |
| 10 | `select * from users` | מנכ"ל | all users incl. inactive | ✅ **7** (all users) |
| 11 | Login attempt in the app | inactive user | blocked at LoginPage with red error (UI check) | ⏳ **UI → step 4.1** (covered by M1's green E2E) |
| 12 | Users management screen | מנכ"ל | inactive users shown **dimmed** (per M1 as-built ruling — supersedes the old table's "filtered out" wording) | ⏳ **UI → step 4.1** (covered by M1's green E2E) |
| 13 | grant `view` on 'לקוחות' (in txn) → `select * from customers` | granted role | rows returned | ✅ **1 row** (view grants SELECT) |
| 14 | same grant → `insert into customers(...)` | granted role | RLS violation (write needs `edit`) | ✅ **42501** denied (write needs edit) |

**Verify 🤖 — ✅ AS-RUN 10/07/2026 (MCP impersonation transactions, all rolled back; customers/quotes still 0 rows, logistics perm still `blocked`):**
1 CEO select=**1**✓ · 2 logistics select=**0** (same CEO row — RLS filters)✓ · 3 logistics insert=**42501 RLS violation**✓ · 4 CEO insert **ok**✓ · 5 logistics: roles=**5**/modules=**9**✓ · 6 non-CEO perm-update=**0 rows**✓ · 7 CEO perm-update=**45 rows**✓ · 8 own-user-row=**1**✓ · 9 non-CEO users-visible=**1**✓ · 10 CEO users-visible=**7**✓ · 13 view→select=**1**✓ · 14 view→insert=**42501 denied** (write needs edit)✓.
**11–12 = UI checks** (inactive-user login blocked · inactive rows dimmed) — deferred to step 4.1 (already covered by M1's 8 green E2E specs). **12/14 SQL-verified PASS.** Positive control (CEO=1) + negative control (logistics=0) on the SAME row prove the impersonation is real (not a broken-claims false-deny). Closes Module-1's deferred RLS gate (module-1.md step 5.2b — mark ✅ at step 5.3).

#### Step 1.4 — Phase 1 closure 🔻👤
**Goal:** human sign-off on the security foundation before code is built on it.
**Files:** this guide (status header + step table updated first — protocol section 8).
**What:** show Ishay the filled 14-row table + both pg_policies outputs.
**🔻👤 end-of-phase gate.**

### Phase 2 — Business Logic (iron rule 14: SSOT in `src/lib/`, queries in `api.js`, UI only imports)

> Placement note (stated reason, per template): guide modules/module_02_customers §⑤ lists "מיפוי enum" under Phase 1 — the DB side needs no work (the 4 enum values already exist as a CHECK, docs/schema.sql:43), so the mapping is deliberately implemented as code-side data here in Phase 2.

#### Step 2.1 — Pure logic + validators + unit tests 🔻🤖
**Goal:** every business rule of the module exists exactly once, unit-tested, before any UI.
**Files:** `src/lib/customers.js` (new), `src/lib/customers.test.js` (new), `src/lib/validators.js` + `src/lib/validators.test.js` (extend).
**What:** `CUSTOMER_TYPE_LABELS` (§7.3 ruling — the 4 spec labels keyed by enum) · `matchesCustomerFilters(customer, filters)` (type/consent/min-discount + free-text that matches company_name alone, contact_name alone, or a ח"פ **prefix** — the §7.11 forgiving-search ruling; written here so M3's quote-flow customer picker reuses it) · `sortCustomers(customers, key, dir)` (client-side sort by company_name/customer_type/discount_percent/status — consumed by step 3.3's column-header sort; unit-tested here so the UI never re-implements the comparator) · `deriveCustomerMetrics(projects)` → `{totalRevenue: null, grossProfit: null, avgFeedback: number|null}` (feedback avg from `projects.feedback_score` when data exists; **totalRevenue AND grossProfit return null** with a comment — totalRevenue → M3 pricing SSOT, grossProfit → M7 profitability (§7.79); NO revenue/profit formula here) · validators: `COMPANY_ID_REGEX = /^[0-9]{9}$/` + a discount 0–100 helper. ⚠️ **Customer phone = FREE-FORM — do NOT add/apply `ISRAELI_PHONE_REGEX` for customers** (spec sets no format; non-empty check only — decision-Ishay 10/07, §2 validators note).
**Verify 🤖 — ✅ AS-RUN 10/07/2026:** `npm run test:run` → **32 passed** (16 existing + 16 new: `CUSTOMER_TYPE_LABELS` · `matchesCustomerFilters` §7.11 · `sortCustomers` · `deriveCustomerMetrics` null-revenue/profit · `COMPANY_ID_REGEX` · `isValidDiscountPercent`). Files prettier-clean + eslint-clean (lint passed). ⚠️ **repo-wide `format:check` fails locally on Windows only** — `git ls-files --eol` = `i/lf w/crlf` (CRLF working-tree, LF in git); Prettier diff is line-endings only. **CI (Linux/LF) unaffected — do NOT mass-reformat.**

#### Step 2.2 — Module API layer 🔻🤖
**Goal:** all Supabase access of the module concentrated in one file (iron rule 14).
**Files:** `src/modules/02_customers/api.js` (new).
**What:** `listCustomers()`, `getCustomer(id)`, `createCustomer(c)`, `updateCustomer(id, patch)` (never changes `company_number`/ח"פ in M2; the surrogate `customer_id` PK is immutable by definition), `setCustomerStatus(id, status)`, `getCustomerProjects(id)` (via `quotes`→`projects`; legitimately empty until M3/M6), `uploadMarketingFile(file)` (bucket `marketing`; validates PDF/JPG/PNG ≤10MB per mockup), `getMarketingPublicUrl(path)` (permanent public URL — bucket ruling), `getConsentedCustomerEmails()` (`marketing_consent=true and status='active'`).
**Verify 🤖:** `npm run lint` → 0 errors; `grep -rnE "from\(['\"\`]customers['\"\`]\)" src/ --include=*.jsx --include=*.js` (covers single/double-quote + backtick — a naive single-quote-only grep passes while a double-quoted `from("customers")` hides) → matches ONLY inside `src/modules/02_customers/api.js`.
**✅ AS-RUN 10/07/2026 17:42:** `src/modules/02_customers/api.js` created with the 9 functions (`listCustomers`, `getCustomer`, `getCustomerProjects`, `getConsentedCustomerEmails`, `createCustomer`, `updateCustomer`, `setCustomerStatus`, `uploadMarketingFile`, `getMarketingPublicUrl`) + exported `MARKETING_ALLOWED_MIME`/`MARKETING_MAX_BYTES` consts. `npm run lint` → **0 errors** ✓ (fixed 2 first-pass lint errors: unused-destructure → `delete`-based strip; useless `\-` escape). Confinement grep → **all 6 `from('customers')` hits inside api.js only** ✓. `npx prettier --check api.js` → clean ✓. ↳ as-built notes: (a) `createCustomer` lets DB 23505 float up with `code` preserved (feeds §7.11 duplicate flow in 3.2) — the UI resolves active-vs-archived from the already-loaded `listCustomers()` state, so NO extra `getCustomerByCompanyNumber` was added (faithful to the 9-function plan). (b) `updateCustomer`/`setCustomerStatus` use `.select()` to catch silent RLS 0-row denial (module-1 pattern) and defensively `delete` `customer_id`/`company_number` from any patch (immutability §7.11/§7.64). (c) `getCustomerProjects` uses `projects … quotes!inner(customer_id)` — legitimately `[]` until M3/M6 add policies. (d) `uploadMarketingFile` is Storage-only in M2 (no paired DB write → no §7.36 orphan scenario here; note kept for 3.5). (e) **Traceability strengthening (10/07 17:52 + 19:25 + retarget ~20:00, Ishay's request):** grep-able `🚧 מN` tokens added to the CODE comments (not only this guide) so a dev reading the source is routed to the §6 register directly — `api.js` `getCustomerProjects` → `🚧 מ6`; `api.js` marketing block → `🚧 מ10`; `src/lib/customers.js` `deriveCustomerMetrics` → `🚧 מ3 · 🚧 מ8` (was מ3·מ7·מ8; the gross-profit token retargeted מ7→מ8 per the fresh-context reviewer finding — §6 carries a routing-tombstone for the historical `🚧 מ7`). All tokens are backed by §6 lines ("השלמות כרטיס לקוח" + "שליחת חומר שיווקי אמיתית") — no new debt created, only code-level traceability. (f) **`supabase/README.md` refreshed (Ishay's request):** the migrations table was stale at 8 rows — added the two module-2 rows AND a ⚠️ local↔remote version-drift note (MCP `apply_migration` stamps UTC: local `20260710160735`/`20260710164420`/`20260707163709` = remote `20260710132720`/`20260710134449`/`20260707133754` — live-verified via MCP `list_migrations` 10/07). The one-time `migration repair` instructions now account for it.
**🔻👤 end-of-phase gate.**

### Phase 3 — UI (design language PROJECT_MASTER §4 — binding; mockups = visual reference only; RTL)

#### Step 3.1 — CustomersPage (list) + route swap 🔻🤖
**Goal:** the module's main screen renders live data for permitted roles.
**Files:** `src/modules/02_customers/CustomersPage.jsx` (new); `src/App.jsx` (replace `UnderConstruction` in the customers route only).
**What:** table per mockup 01: שם לקוח · ח"פ · סוג לקוח (label via `CUSTOMER_TYPE_LABELS`) · איש קשר · טלפון · אימייל · % הנחה · תוכן שיווקי (toggle, edit-mode only) · שביעות רצון (stars; "אין נתונים עדיין" until M8) · פעולות. Empty state for zero customers. Edit-vs-view rendering per section 4. `data-testid` on rows/actions (M1 convention, e.g. `customer-row-{id}`).
> 🗣️ **confirm-intent — ✅ RESOLVED (Ishay, 10/07 P13 sweep — see Ledger):** **ONE search box** (mockup's dual boxes rejected) · **NO "מצוין" text-tag** (§7.80 nod — inert stars + "אין נתונים עדיין" only) · **column/ergonomic details = Claude free-hand** (Ishay grant). Still narrate 🗣️ what you build + which files before building (CLAUDE.md rule 1), but do NOT re-open these three for approval.
**Verify 🤖:** preview (dev server) as CEO — snapshot shows the table (or empty state); `preview_console_logs` → no errors.

#### Step 3.2 — Add/Edit dialog 🔻🤖
**Goal:** spec 1.5.3's full field set with §7.11's duplicate-proof add flow.
**Files:** `src/modules/02_customers/CustomerFormDialog.jsx` (new).
**What:** fields per mockup 05/06 + spec 1.5.3: שם לקוח, ח"פ (`company_number`; 9 digits; **read-only in edit** — kept immutable in M2 by choice; the surrogate PK now makes future ח"פ-correction schema-safe, §7.64), סוג לקוח (4 spec labels), אחוז הנחה (0–100), איש קשר, אימייל, טלפון, מאושר לדיוור (toggle). §7.11 duplicate flow on save: existing **active** ח"פ ⇒ friendly Hebrew error ("חברה זו כבר רשומה במערכת") naming the existing customer (company + contact) + quick action "ערוך את הכרטיס הקיים" that opens it; existing **archived** ח"פ ⇒ explicit offer "הלקוח קיים בארכיון — לשחזר?" that restores `status='active'` and opens the card for editing (approved 07/07). Validation via `src/lib/validators.js` only.
**Spec-mandated exact strings (C5 §5.6.17.4 — do not paraphrase):** ח"פ validation error = **"שגיאה: מספר ח.פ. חייב להכיל 9 ספרות בדיוק"** (verbatim; blocks save on partial input); edit-dialog title = **"עריכת לקוח: [company_name]"** (add-dialog title = "לקוח חדש").
**Validation UX (C5 §5.6.17.4 — two layers, spec-mandated, previously dropped):** (1) client-side on field-blur — instant inline feedback, no DB round-trip; (2) server-side on save — write only after ALL fields pass. Visual feedback: on success a green strip **"הנתונים נשמרו בהצלחה"** that auto-fades; on error a **red border + focused message under the offending field**, with all other valid fields retained in the form.
**Phone = free-form** (non-empty only — no regex; decision-Ishay 10/07). **§7.65 note (open — deferred):** `customers.email` has NO UNIQUE constraint in M2 — do NOT add email-uniqueness validation here; a later nod would add it via migration.
**Verify 🤖:** preview — create a customer → row appears; re-enter same ח"פ → the friendly duplicate error names the existing customer + edit link; enter a partial ח"פ → the exact spec error string blocks save; on a successful save the green strip appears; archive that customer, re-enter its ח"פ → the restore offer appears and restoring re-activates it (screenshot evidence for the flows).

#### Step 3.3 — Search + filter sheet + column sorting 🔻🤖
**Goal:** the spec's "רשימת לקוחות ניתנת לסינון" with §7.11 disambiguation, plus client-side column sorting (all list ergonomics land in this module).
**Files:** `src/modules/02_customers/CustomersFilterSheet.jsx` (new) + wiring in `CustomersPage.jsx`.
**What:** free-text search per the §7.11 forgiving-search ruling: matches contact name alone, company name alone, or ח"פ prefix; every result row shows שם חברה + איש קשר + ח"פ so the user picks exactly the intended customer. Advanced filter per mockup 04: סוג לקוח, ציון שביעות רצון (present-but-inert until M8 data), מאושר לדיוור, אחוז הנחה מינימלי; "נקה הכל". Column-header click sorts asc/desc (client-side — company_name, customer_type, discount_percent, status). Logic from `matchesCustomerFilters` + the `sortCustomers` helper created in step 2.1 (`src/lib/customers.js`, unit-tested) — UI does not re-implement predicates.
> 🗣️ **confirm-intent — ✅ RESOLVED (Ishay, 10/07 P13 sweep — see Ledger):** **column-sorting = BUILD** (approved; MUST use the §2.1 `sortCustomers` helper — do not re-implement in the component) · **ONE search box** (dual layout rejected) · **filter-sheet details = Claude free-hand** (Ishay grant; satisfaction filter renders present-but-inert until M8 — disabled with "אין נתונים עדיין"). Narrate 🗣️ before building; no re-approval needed.
**Verify 🤖:** preview — three searches on the same customer: by contact name only, by company name only, by ח"פ prefix → all three find it; apply type filter → list narrows; clear → full list returns; click discount header twice → order flips.

#### Step 3.4 — Bidirectional archive 🔻🤖
**Goal:** soft-delete per the binding M1 pattern (spec's "מחיקה" deviation — section 9).
**Files:** `src/modules/02_customers/CustomersPage.jsx` (action wiring; `api.js` already has `setCustomerStatus`).
**What:** archive/restore action: `status` toggle, archived rows dimmed (not hidden), "לא פעיל" pill, no "delete" wording anywhere. **Scope note (§7.34, open):** archiving a customer with live quotes/projects is deliberately unguarded in M2 (no such data exists yet); the open item surfaces for ruling when M3 lands — do not invent a guard here.
**Verify 🤖:** preview — archive → row dimmed with "לא פעיל"; restore → active again; page refresh persists both (DB round-trip).

#### Step 3.5 — Marketing panel 🔻🤖
**Goal:** spec 1.6.3's marketing area under the ruled send-model (mailto + public link).
**Files:** `src/modules/02_customers/MarketingPanel.jsx` (new).
**What:** upload area (PDF/JPG/PNG ≤10MB) → `uploadMarketingFile`; "שלח ללקוחות מאושרים" enabled only when a file is uploaded AND consented customers exist → builds `mailto:?bcc=<consented>&subject=...&body=<public URL>` — **subject and body MUST pass through `encodeURIComponent`** (a raw URL's `&`/`?` otherwise truncates the mailto body — load-bearing). Add two fallback buttons: "העתק קישור" and "העתק רשימת נמענים" (clipboard) for clients that mishandle bcc/long mailto URLs. Edit-permission only.
**⚠️ Silent-truncation guard (many consented recipients):** the OS caps `mailto:` length (~2,000 chars on Windows) — a long bcc list is silently cut, so some consented customers would NOT be mailed with no error. If the fully-encoded `mailto:` would exceed ~1,900 chars, do NOT render a truncated one — disable the send button and steer the user to "העתק רשימת נמענים" (real send = M10).
**§7.36 (upload↔DB atomicity, anchored):** this is the first Storage-write + DB-write pair in the project. Order = Storage first, then any DB record; on a partial failure (Storage succeeded, DB failed) delete the orphan file best-effort and surface an error — never leave a silent orphan.
> 🗣️ **confirm-intent — ✅ RESOLVED (Ishay, 10/07 P13 sweep — see Ledger):** simple **"החלף קובץ" + remove buttons = BUILD**; **drag-drop = REJECTED** (complexity without spec value). Narrate 🗣️ before building; no re-approval needed.
**Verify 🤖:** preview — upload a small PDF, then `select count(*) from storage.objects where bucket_id='marketing';` → ≥1; assert the rendered send-button `href` starts with `mailto:` AND that its `body` param, when `decodeURIComponent`'d, equals the exact public URL (assert the ENCODED body, not only bcc — a raw `&` in the body passes a bcc-only check while the body is silently truncated); bcc list equals exactly the consented+active customer emails.

#### Step 3.6 — Customer card 🔻🤖
**Goal:** spec 1.6.3's "כרטיס לקוח" with the ruled empty-state scope.
**Files:** `src/modules/02_customers/CustomerDetailsCard.jsx` (new). ⚠️ **This file was deleted 30/07/2026** — module 3 step 3.5 replaced the dialog with `CustomerDetailsPage.jsx` (route `customers/:customerId`); see §9.
**What:** row click → card: **open with a fresh `getCustomer(id)` read** (not stale list state — another user may have edited since load; also the api function's designated consumer, reviewer finding 2, 10/07) + project history (via `getCustomerProjects` — empty state "אין פרויקטים עדיין") + metrics (סה"כ הכנסות / **רווח גולמי מצטבר** / ממוצע משוב — all three "אין נתונים עדיין" placeholders via `deriveCustomerMetrics`). **Gross-profit (§7.79):** required by C6 §2.4.1 (derived customer attr; citation corrected 10/07 — C5 §5.6.3 itself names only revenue+feedback) — render it as a placeholder now (formula + population are open, wired in **M8** which owns the profit formula, spec 5.14; retargeted from M7); do NOT drop it silently as the pre-10/07 draft did.
**Verify 🤖:** preview — card opens showing details + all three metric empty states (revenue, gross-profit, feedback).
**🔻👤 end-of-phase gate: visual pass vs design language §4 (colors/layout untouched without approval — iron rule 8).**

### Phase 4 — Control & Integration

#### Step 4.1 — Permission matrix walk 🔻🤖 ✅ VERIFIED 11/07 02:48 (hybrid)
**Goal:** prove the module obeys the live matrix end-to-end (UI layer over the RLS already proven in 1.3).
**Files:** none (verification step).
**What:** login as each of the 5 test users: מנכ"ל/מנהלת פרויקטים/מנהלת כספים ולקוחות → full edit works; מנהלת גיוס/מנהלת לוגיסטיקה → 'לקוחות' absent from Sidebar AND direct `/customers` blocked by ProtectedRoute.
**Verify 🤖:** preview snapshot per role (5 pieces of evidence: 3 showing the working screen, 2 showing block/redirect).
↳ **as-built (hybrid — only CEO+STAFF UI creds exist; Claude does not type test passwords):** discharged via (a) live DB matrix (MCP) = 3×edit / 2×blocked as seeded, (b) role-generic code paths (`Sidebar.jsx:54` · `App.jsx:60-67` · `ProtectedRoute.jsx:32-40` · `MainLayout.jsx:24-25`), (c) live browser smoke (unauth `/customers`→login), (d) the credentialed live differentiation delivered by the M1 Playwright specs run in 4.2. Full per-role credentialed screenshots deferred to 5.1. See §9 (02:48).

#### Step 4.2 — Regression (iron rule 9: security-model regression at module close) 🔻🤖 ✅ VERIFIED 11/07 02:48
**Goal:** prove Module 1's guarantees survived Module 2.
**Files:** none (verification step).
**What:** `npm run test:run` (all unit) + `npm run test:e2e` (M1's 8 must stay green) + re-run RLS scenarios 6 and 9 (core tables untouched by this module — prove it).
**Verify 🤖:** all suites green (paste counts); scenarios 6/9 outputs match step 1.3's.
↳ **as-run 11/07 02:48:** `test:run` **37/37** (4 files) · `test:e2e` **8/8, 0 skipped** (M1 green) · RLS via MCP (rolled back) — CEO positive control **7 / 45**, logistics **scen 9 = 1** (users own-row only), **scen 6 = 0** (permissions locked) — matches 1.3 baseline. Impersonation resolves via `auth.email()` (schema keys users on email, not uuid). See §9 (02:48).
**🔻👤 end-of-phase gate.** ⟵ ✅ **SIGNED — Ishay 11/07 02:56** (approved the 4.2 regression evidence; also signed the end-of-Phase-3 visual-pass — "אימתתי ויזואלית הכל, עובד היטב").

### Phase 5 — QA & Handoff

#### Step 5.1 — Module E2E 🔻🤖 (creds sub-step 👤) ✅ VERIFIED 11/07 03:07
**Goal:** guide ⑦ acceptance automated.
**Files:** `e2e/customers.spec.js` (new); `.env.local` (creds — human).
**What:** Playwright specs mirroring guide ⑦: finance-role creates customer & sees it · logistics-role has no customers module (sidebar + direct URL) · filter works · archive is reversible. Needs `E2E_FINANCE_*` / `E2E_LOGISTICS_*` creds — **👤 Ishay adds them to `.env.local` (secrets gate; never committed)**; specs must `test.skip` gracefully when absent (existing convention, e2e/permissions.spec.js:20).
**Verify 🤖:** `npm run test:e2e` → 8 old + new all pass (paste the total).
↳ **as-built 11/07 03:07:** `e2e/customers.spec.js` written. **Coverage mapped to the two tiers we actually hold** (Ishay 11/07: creds are fine/academic-light, but Claude does not type test passwords → the framework injects env creds): `edit-tier (CEO)` runs the full lifecycle (create → save-success strip → see-via-search → filter no-results/back → archive→hidden-by-default → הצג-ארכיון→restore) · `blocked (STAFF=לוגיסטיקה)` = no 'לקוחות' sidebar link + direct `/customers` shows "אין הרשאה". **finance/logistics-named variants** included, `test.skip` gracefully until `E2E_FINANCE_*`/`E2E_LOGISTICS_*` exist. **Self-cleaning:** `afterAll` hard-deletes the unique-ח"פ test customer via a CEO-authenticated supabase-js client (no UI delete by design; `customer_contacts` FK cascade) — verified live after the run **customers=0 / contacts=0**. **Result: `npm run test:e2e` → 10 passed / 2 skipped** (8 M1 + 2 new active + 2 finance/logistics skipped). The 👤 creds sub-step is now optional (both tiers covered by CEO+STAFF); activating the finance/logistics creds later auto-runs the 2 skipped specs.

#### Step 5.2 — Full gate 🔻🤖 ✅ VERIFIED 11/07 03:07
**Goal:** repo-wide quality gate green before docs/PR.
**Files:** none (verification step).
**Verify 🤖:** `npm run verify` → lint 0 errors, format clean, all tests pass, build succeeds.
↳ **as-run 11/07 03:07:** lint **0** · build **✓** · `test:run` **37/37** · `test:e2e` **10/2-skip** · `prettier --check e2e/customers.spec.js` **clean**. ⚠️ repo-wide `npm run verify` still trips the **known Windows-CRLF `format:check`** noise on ~40 pre-existing files (documented §9 02:34/01:57 + CLAUDE_CODE_LOG מוקשים) — CI/Linux-LF unaffected; the new file is LF-clean. Gate is green on every component that reflects real quality.

#### Step 5.3 — Docs persistence 🔻🤖 ✅ VERIFIED 11/07 03:13
**Goal:** end-of-session protocol satisfied (Stop hook will enforce anyway) + cross-module debts registered where future modules will find them.
↳ **as-run 11/07 03:13:** this guide §1/6/9 finalized across the session · **backward write-back done** — `module-1.md` phase-table + step-5.2b marked ✅ CLOSED (M2 step 1.3's 14-scenario `customers` RLS matrix discharged M1's deferred gate) · **§6 🚧 check clean** — all M2 debt tokens (🚧 מ3/מ6/מ8/מ10) already carry matching PROJECT_MASTER §6 lines (§6 L262–265), nothing missing/new · CHANGELOG (5.1+5.2 code line; the Phase-1 DB line for the RLS/bucket migration already exists 10/07) + CLAUDE_CODE_LOG (snapshot + dated entries) + STATUS all updated. Remaining: **5.4 closing audit + PR — run in a FRESH session (Ishay's choice 11/07)** for independent re-verification.
**Files:** this guide (sections 1/6/9 finalized) → **`docs/micro_guides/module-1.md`** (backward write-back — see below) → `docs/PROJECT_MASTER.md` §6 → `docs/CHANGELOG.md` → `docs/CLAUDE_CODE_LOG.md` → `STATUS.md` (that order, per CLAUDE.md).
**What:** verify every 🚧 row of section 2's capabilities table has its byte-matching `🚧 מN` line in PROJECT_MASTER §6 (add/refresh any missing — the Stop hook blocks otherwise); **backward write-back (B8):** step 1.3 closed Module 1's deferred RLS gate (module-1.md step 5.2b) — mark that gate ✅ in `module-1.md` with a pointer to M2's 14-row matrix, since the forward-only 🚧 מN mechanism does NOT cover a debt repaid backward; CHANGELOG gets a DB line (policies+constraints+bucket, incl. the bucket-INSERT seed-exception note) + a code line; CLAUDE_CODE_LOG "מצב נוכחי" rewritten + dated session entry; STATUS module-2 row updated.
**Verify 🤖:** `grep -n "מודול 2" docs/PROJECT_MASTER.md` → §6 shows the deferred-completion lines; `bash .claude/hooks/check-docs-updated.sh` → exit 0; `git status --short` shows only the intended doc files as modified.

#### Step 5.4 — Closing audit + PR 🔻👤 ✅ DONE 11/07/2026 22:33–22:42
**Goal:** formal module closure (final DoD sign-off gate).
**Files:** none here — the closing template drives its own persistence.
**What:** run `.claude/skills/module-close/template.md` (the closing prompt in modules/module_02_customers ⑥) → DoD sign-off → PR base:`dev` ← compare:`amit/module-2-customers`.
**🔻👤 final gate.**
↳ **as-run 11/07 22:33 (fresh session, per Ishay's choice):** full template audit — verdict **[YES]**, **DoD typed-echo signed 22:39 ("לקוחות DoD")**. Branch name resolved from THIS header (`ishay/module-2-customers`) — the `amit/…` in What above was the blueprint-era placeholder. Full report in chat; §9 entry below. Test data cleaned with Ishay's approval (0/0/0 live). PR = after Ishay's post-signature visual pass (instructions + 🧩 printed by the audit session).

## 6. 📊 QA Matrix

| Test type | Planned | As-run (closing audit fills) |
|---|---|---|
| Unit | `customers.js` (labels, filters, `sortCustomers`, metrics incl. gross-profit null), validators (ח"פ 9-digit / discount 0–100; phone is free-form — no format assertion) — Vitest | ✅ 22:33 audit: `npm run test:run` **37/37** (4 files) — labels §7.3, `matchesCustomerFilters` §7.11 incl. contacts, `sortCustomers`, metrics 5-shape, validators |
| Integration | 14-scenario RLS matrix (SQL, live), storage-policy probe (blocked role upload → fails), duplicate-ח"פ round-trip | ✅ 1.3 as-run 12/14-SQL + **independent audit re-verification 22:33** (fresh MCP impersonation, rolled back): CEO positive-control select+insert ✓ · blocked 0/0+42501 · view-grant read 2/2, write 42501 (incl. `customer_contacts`) · scen-6/9 ≡ baseline · policy bodies ≡ §7.21 verbatim |
| E2E | `e2e/customers.spec.js` (acceptance ⑦) + M1 8 specs regression — Playwright, Chromium, workers=1 | ✅ 22:33 audit run: **10 passed / 2 skipped** (finance/logistics variants skip until creds — documented decision 03:07) |
| Regression | M1 unit+E2E suites green after every phase; core-RLS spot checks (scenarios 6/9) | ✅ 22:33: M1's 8 specs green inside the 10-passed run; scen-6 (perm-update=0) + scen-9 (own-row=1) re-run ≡ 1.3 baseline; core tables untouched |
| UAT | Amit manual pass vs guide ⑦ checklist; formal UAT stays Module 12 / milestone M5 "הגשה" (PROJECT_MASTER §6) | ⚠️ partial — Ishay's live reviews (11/07) served as informal UAT; formal UAT stays M12/M5 as planned |
| Security/Pen | impersonation matrix incl. view-tier (13–14), direct-URL, blocked-role sidebar, storage write as blocked role | ✅ full matrix 1.3 + audit re-verification 22:33; unauth `/customers`→login live-verified; advisors security triaged (0 unaddressed new) |
| Performance | N/A (tiny data; revisit ~M3) | N-A (audit note: `multiple_permissive_policies` + `quotes` FK index logged for M3 — db_roadmap) |
| Usability | RTL pass on all 6 new components, empty states, Hebrew errors | ✅ **11/07 UX & validation review** (= the review the creation/closing templates now mandate — done retroactively for M2; see §9 16:21 + the round-2 entry): §4 design · loading/empty/no-results/error+retry/success states · RTL · keyboard-basics · a11y attrs; **validation-completeness** — contacts שם+(טלפון-או-אימייל), ח"פ 9-digit, discount 0–100, phone free-form; spec-silent choices confirmed with Ishay. Closing-audit §2b (22:33) confirmed; final 👤 visual pass = Ishay post-signature |
| Compatibility | Chromium only (as M1); cross-browser before M5 | ⚠️ Chromium only (as planned); cross-browser = M12 sweep |

## 7. ✅ Definition of Done (instantiates docs/architecture_and_qa_roadmap.md)

- [x] Migration applied to the shared project; `pg_policies` shows exactly the 2 `customers` policies and exactly the 4 `marketing_*` storage policies; `docs/schema.sql` snapshot updated and committed **together** with the migration. *(Audit 22:33: live `pg_policies` = exactly 2+4 (+2 `customer_contacts`); `git show --name-only edaae68` = migration+snapshot together.)*
- [x] **§7.64 surrogate PK live:** `customers.customer_id` = `bigint` identity PK; `company_number` (ח"פ) is `unique not null` + 9-digit check; `quotes.customer_id` FK is `bigint`; the **deviation from frozen C6 §2.4.1** is logged in §9. *(Audit: live `list_tables` confirms all.)*
- [x] All 14 RLS scenarios pass with pasted evidence (closes M1's deferred gate 5.2b). *(1.3 as-run + independent audit re-verification 22:33 — see QA-matrix Integration cell.)*
- [x] `customer_type` UI shows the 4 frozen-spec labels (§7.3); duplicate ח"פ produces the §7.11 friendly flow (edit-link for active, restore-offer for archived); search finds a customer by contact name alone / company name alone / ח"פ prefix; ח"פ (`company_number`) immutable in edit by M2 choice (surrogate PK makes future correction schema-safe). *(Audit: 37/37 unit + E2E lifecycle + api.js strips `company_number` from patches.)*
- [x] Archive is bidirectional, dimmed, delete-free (M1 binding pattern). *(Audit note: as-ruled DEVIATION from the M1 dim-in-list pattern — archived rows live behind the single "ארכיון" button (hidden from the main list, dimmed inside the archive view) — Ishay's 11:41 ruling, §9; E2E covers archive→hidden→restore.)*
- [x] Marketing: upload lands in the public `marketing` bucket; send = `mailto:` (encodeURIComponent'd) with BCC of consented+active only; clipboard fallbacks present. *(Audit: `MarketingPanel.jsx:118-120` encoding · `api.js:69-70` consent+active · bucket live; since 17:07 the send uses the checked recipient subset.)*
- [x] Customer card renders with all three metric empty states (revenue / gross-profit §7.79 / feedback); no pricing/profit formula anywhere in module-2 code (`grep -rnE '0\.18|\bvat\b|מע"מ' src/modules/02_customers src/lib/customers.js` → 0 business-formula hits; word-boundary on `vat` because plain `-e vat` false-positives on the English word "pri**vat**e" — hit at the 19:25 Phase-2 full-check; `0\.18` escaped so `.` is literal). *(Audit: grep = 0 hits ✓. Checkbox text pre-dates the ruled 01:35 deviation — the card as-built shows **5 metrics WITHOUT gross-profit** (persona ruling, §9; §7.79 debt retargeted to M8 screens); all shown metrics render "אין נתונים עדיין".)*
- [x] Customer phone is free-form (no `ISRAELI_PHONE_REGEX` applied to customers — decision-Ishay 10/07); ח"פ shows the exact spec error string; edit-dialog title = "עריכת לקוח: [name]"; save shows the green success strip / red field-error per C5 §5.6.17.4. *(Audit: `CustomerFormDialog.jsx:40/:338/:284` — exact strings live; phone = free-form + char-guard + ≥4 digits per the later Ishay refinements.)*
- [x] Edit-vs-view rendering: `view` grant ⇒ read-only screen (verified via scenario 13 + UI probe with a temporary matrix change, reverted). *(Audit re-verified scenario 13/14 live: view reads 2/2, write 42501.)*
- [x] Guide ⑦ acceptance: finance creates+sees customer · logistics fully blocked · filter works · archive reversible · `npm run verify` green. *(Audit: E2E 10/2-skip — CEO=edit-tier runs the lifecycle, STAFF=logistics blocked; finance-named variant skips until creds [documented 03:07]. Verify green per-component; format:check = Windows-CRLF noise only, `git ls-files --eol` evidence.)*
- [x] `npm run test:run` + `npm run test:e2e` green (old + new). *(Audit run: 37/37 · 10 passed/2 skipped.)*
- [x] No secrets in code/docs (CI gitleaks green); `.env.local` untouched by git. *(Audit: `git ls-files .env.local` = empty; gitleaks = CI post-push, N/A-at-audit.)*
- [x] CHANGELOG + CLAUDE_CODE_LOG + STATUS current; this guide's header/table/deviations current. *(Finalized in the closing-audit persistence pass, 22:42 — incl. correcting the stale "uncommitted/not-pushed" claims with fresh git evidence.)*

**Post-merge (verified AFTER the closing audit — NOT audit-time checkboxes, since the audit must not merge; not Section-6 blockers):** PR to `dev` opened · CI green · merged. The closing audit confirms the module is *mergeable* (green verify + no blocker); the actual PR/CI/merge happen after, by Ishay.

## 8. 🔄 Self-Update Protocol (verbatim rules)

1. At every step transition, update section 1 (status header + step table) **in the same session, before moving on**.
2. Any deviation from plan → inline "↳ as-built" note on the step + a dated line in section 9.
3. The repo's Stop hook (`.claude/hooks/check-docs-updated.sh`) blocks session end if code under `src/modules/02_*/` changed but this guide didn't — keep this file current as you work, not as an afterthought.
4. The `CLAUDE.md` end-of-session protocol applies on top (CHANGELOG → CLAUDE_CODE_LOG → STATUS).
5. **On ENTERING a phase (template §8(h)):** sweep the Decisions Ledger for OPEN/nod-pending items anchored to this phase's steps and present them to Ishay for a consolidated ruling BEFORE the phase's first step — e.g. entering Phase 1, present the §7.40(א)/§7.48/§7.62/§7.73 nod bundle + the §7.63 direction; entering Phase 3, surface the §7.36/§7.79/§7.80 + confirm-intent (mockup) items. Deferred questions get settled at the phase door, not mid-step.
6. **(e)–(g) per CLAUDE.md iron rules 13/15/16 + end-of-session protocol** (new-open-question → stop+§7 · migration/DB-gap → db_roadmap same session · shared-surface change → name the affected future modules in the CHANGELOG line) — these apply automatically; not restated here (F1).

## 9. 📝 Deviations & Tech-Debt Log
  ↳ **as-built N2, 02/09/2026** — the files of this module that actually changed, measured not assumed:
  `api.js` *(three selects now carry `customer_contacts(... is_primary)`; `replaceCustomerContacts`
  became one `rpc('replace_customer_contacts')` call)* · `CustomerFormDialog.jsx` *(rebuilt to the
  approved mockup — one uniform card per contact, primary marked by chip+border, delete-primary
  blocked)* · `CustomersPage.jsx` **and** `CustomerDetailsPage.jsx` *(both read through
  `primaryContact()` now)* · new test files `api.test.js` and `CustomerFormDialog.test.jsx`
  *(neither existed before — module 2 was one of the two modules with no `api.js` test)*.
  🔴 **The assumption filled here, tagged `הנחתי` and NOT ruled by anyone:** the form **still mirrors**
  the primary contact back into `customers.contact_name/phone/email` on save. **Why:** those columns
  are still `NOT NULL` and still the source of truth until the drop migration. ⚠️ **The cost, stated
  plainly:** the write is now **two HTTP requests** (RPC for the child rows, `updateCustomer` for the
  parent columns) — if one lands and the other fails, the two diverge. **That divergence is exactly
  what `child_parent_mismatch` detects**, and it dies with the drop migration.
  🚫 **Do NOT "fix" this by removing the mirror before the columns are dropped** — that breaks every
  screen not yet rewired.

- ✅ `02/09/2026` — **N2 הושלם וסגור. איש-הקשר הראשי הוא שורה ב-`customer_contacts` עם `is_primary`,
  ושלוש העמודות `customers.contact_name/phone/email` **נמחקו** (`N2ד`, `20260902173354`).**
  **ארבע מיגרציות ולא שלוש**, והרביעית נולדה מגילוי: ‏`N2ג` ריככה את ה-`NOT NULL` **כי הטופס עדיין
  כתב לעמודות** — ‏🔑 **התנאי למחיקה אינו "הקוד כבר לא קורא" אלא "הקוד כבר לא כותב", והשניים נפרדו
  דווקא מפני שהעברת-הקריאות נעשתה היטב.**
  **מה שהשתנה בקבצים של המודול הזה:** ‏`api.js` — ‏`PRIMARY_CONTACT_EMBED` בכל select, והשמירה דרך
  ה-RPC ‏`replace_customer_contacts` *(טרנזקציה אחת; מחליף את insert-ואז-delete)* · `CustomerFormDialog`
  — רשימת אנשי-קשר אחידה עם צ'יפ "ראשי", **ו-`data-testid="contact-field-*"` בתוך `contact-row`** ·
  ‏`CustomersPage` — שלוש עמודות אוחדו לאחת + צ'יפ `✉ מייל` · ‏`CustomerDetailsPage` ו-`MarketingPanel`
  קוראים דרך `primaryContact()`.
  🩸 **וארבעה באגים נתפסו אחרי שהחיווט "הושלם", שלושה מהם מחוץ ל-`src/`:** ‏`lib/marketing.js` קרא
  `r.email` שטוח ⇒ **רשימת-הדיוור יצאה ריקה בייצור** *(אפס נזק — `mailto:` נפתח לעין המשתמשת)* ·
  באנר-הכפילות קרא את עמודת-האב · שני ספי-E2E · **וספק רביעי שהיה אדום שעות ואיש לא ידע, כי
  `test:e2e` אינו רץ ב-CI — נמצא רק בהרצה.**
  ⚠️ **פער מוצהר: לבאנר-הכפילות אין בדיקה** — הגישה אליו דורשת Radix Select שאינו נפתח ב-jsdom
  *(נמדד, כולל פוליפילים)*. מקומו ב-E2E.
  **החוזה המלא והמדידות:** ‏`docs/db_roadmap.md` §9א+§10 · **בדיקת-השריד המוכללת לכל מחיקה עתידית:**
  ‏`docs/db_health_checks.md` §10.

- 🔗 `02/09/2026` — **N2 (איחוד אנשי-הקשר) נוגע בקבצים של המודול הזה. הרשומה המלאה אינה כאן:**
  ‏`docs/db_roadmap.md §10ב` *(שתי המיגרציות והנימוק שלהן)* + ‏`PROJECT_MASTER §6`.
  **מה שהמודול הזה צריך לדעת במשפט אחד:** איש-הקשר **הראשי** מפסיק להיות שלוש עמודות על
  `customers` (`contact_name`/`phone`/`email`) והופך ל**שורה** ב-`customer_contacts` עם
  `is_primary`. ⇒ **כל קריאה של `customer.contact_name` בקוד של המודול הזה תחזיר `undefined`
  אחרי מיגרציית-המחיקה**, והבחירה עצמה מרוכזת ב-`primaryContact()` שב-`src/lib/customers.js`
  — **אין לממש אותה מקומית.**
  ⏸️ **מצב נכון לרגע הכתיבה: שתי המיגרציות הוחלו, שלוש העמודות עדיין קיימות ועדיין מקור-האמת**,
  והחיווט בעבודה על `ishay/n2-contacts-rewire`. **המחיקה תבוא רק אחרי חיווט מלא ופריסה.**


- 🔗 `28/08/2026 00:5X` — **M2 CODE IS BEING EDITED BY MODULE 8's PHASE-4 RIPPLE (step 4.2). This
  module stays CLOSED; the change is m8's, recorded here so a future m2 reader is not surprised by
  the diff — and because one of its edits deliberately REVERSES an m2 decision.**
  **Files:** `src/lib/customers.js` (`deriveCustomerMetrics`, `matchesCustomerFilters`) ·
  `src/lib/customerProjects.js` (`projectAmount`) · `src/modules/02_customers/api.js` ·
  `CustomersPage.jsx` · `CustomerDetailsPage.jsx`.
  **What it delivers — the m8 half of a debt this guide already carries:** the satisfaction stars +
  filter that §1's capability table records as *"🚧 מ8 · present-but-inert"* stop being inert, and
  the customer "סכום" column starts including approved scope changes (RC-6). §7.79's populations
  land with them: cumulative profit counts finished **and** resolved-cancelled projects; the average
  feedback counts **only** customers who actually answered.
  🔴 **The part that must not read as a silent edit:** m2 carries a deliberate PRIVACY comment
  narrowing what the customer-metrics read returns. m8's step widens that read on purpose, and the
  instruction given to the agent was explicit — **flip it into a deliberate-widening comment naming
  why and on whose authority, never delete it.** A future reader must be able to see that the
  narrowing was intentional and that the widening was too. Verified at the phase-4 gate.
  🔨 **Status `28/08 01:0X`: in flight.** Files already modified in the working tree —
  `customers.js` · `customerProjects.js` · `02_customers/api.js` · `CustomersPage.jsx` ·
  `CustomerDetailsPage.jsx`. **Not yet committed and not yet regression-verified**; m2's own suites
  are re-run at the gate, and a weakened m2 test counts as a regression, not as an accommodation.
  📌 **And one m2-relevant consequence of a ruling made in m8 the same night** *(the survey ruling,
  `module-8.md` §10, `28/08 01:1X`)*: the customer-satisfaction average this ripple lights up is fed
  by a **single** 1–5 score per project, and that will not change — the four-question Google Form was
  ruled out for good. ⇒ **§1's satisfaction filter has exactly one number to sort on**, and any later
  wish for per-dimension customer filtering would need a schema change in m8, not a screen change
  here. Recorded so a future m2 session does not plan around a richer score that is not coming.
- 🚧 מ6 — **12/08/2026 — the M6 half of the two deferred derived customer-list filters had no live token
  in this guide, only a trailing parenthetical.** §1's capability table carries the M8 half as a real row
  (*"Satisfaction stars in list + satisfaction filter — 🚧 מ8 · present-but-inert"*), but its twin —
  **`פרויקטים פעילים` / `רדומים`** (no event for X months, derived from `projects`, Ishay 11/07 *"מעוניין
  כשניתן"*) — appears only inside the 11/07/2026 01:35 entry's closing clause *"🚧 rows registered in §6:
  derived-filters (מ3/מ6/מ8)"*, with no `🚧 מ6` token of its own. ⚠️ **`grep '🚧 מ6'` on this guide does
  return a hit — but it is the *project-history* debt (§1), a different item** — so the dormant-filter half
  was invisible to a module-6 session reading this file. **What M6 owes:** extend `matchesCustomerFilters`
  (`src/lib/customers.js`) + `CustomersFilterSheet` with the active/dormant predicate once `projects` data
  and policies exist — **the filter is not built in M2 because there is no data**, not because it was
  dropped. Full text: `PROJECT_MASTER §6`, the `🚧 מ6 · 🚧 מ8` line opening **`פילטרים נגזרים
  ברשימת-הלקוחות`**. *(added 12/08/2026 — reverse-direction audit of §6, `regin-docs-sync`.)*

**↳ ✅ resolved 19/08/2026 (M6 step 3.8) — the M6 half only.** The dormant/active-projects filter is
live: `matchesCustomerFilters` (`src/lib/customers.js`) takes a `dormantOnly` filter key (line ~51)
and applies `if (dormantOnly === true && customer.is_dormant !== true) return false` (line ~60),
reading the derived `is_dormant` flag injected onto the row before filtering — same pattern as
`total_revenue`. `PROJECT_MASTER.md:399` already shows the central registry line struck through with
matching evidence (`סף_לקוח_רדום_ימים` param, seeded 120, not hardcoded). **The מ8 half — the
satisfaction filter — stays open; module 8 is not built.**

**↳ as-built 10/08/2026 — cross-module fix from Module 4's accessibility pass:
`CustomersPage.jsx`'s only heading, `<h2>רשימת לקוחות</h2>`, promoted to `<h1>`.** Ishay asked to
fix an `axe-core` finding surfaced while building/testing module 4's `e2e/accessibility.spec.js`
(`landmark-one-main`/`page-has-heading-one`/`region` reported across most scanned screens). Before
touching any code, re-ran the scan **in isolation** (no prior `page.goto()` in the same test) to
separate signal from artifact — and most of the original finding turned out to be a **test-timing
bug**, not a real defect: `page.goto()` between screens forces a full reload, and `axe` sometimes ran
during `MainLayout`'s `"טוען..."` loading flash (no landmarks yet, because it isn't the page). Cross-
checked every scanned route's source: `MainLayout.jsx` already wraps everything in one `<main>`, and
6 of the 7 flagged pages already had a real `<h1>` inside it. **`CustomersPage` was the one genuine
exception** — its only heading was an `<h2>`, no `<h1>` anywhere on the page — so it's fixed here.
(The test itself was also fixed, in module 4's `e2e/accessibility.spec.js`: added a `waitForReady()`
wait before scanning so the loading-flash false-positive can't recur — full account there and in
`docs/CLAUDE_CODE_LOG.md`'s 10/08 "Fifth addendum" entry.) One line changed, no logic, no
`data-testid` touched. `npm run gate` exit 0 after (750 unit tests, module 2's own tests unaffected).

**↳ as-built 08/08/2026 — `CustomerDetailsPage.jsx`'s stat-tile wrapper changed `grid
grid-cols-1 sm:grid-cols-3` → `flex flex-wrap`, closing the open verification item left by the
07/08 `StatTile` extraction below.** Same family of gap as that entry (two screens using the shared
`StatTile` component but drifting in the *wrapper*, not the tile): a full-width grid on only 3
short-value tiles left visible empty space inside each tile, while `QuotesPage.jsx`'s 2-tile strip
already used content-sized `flex` (Ishay's 29/07 ruling, quoted in that file: "a strip with only
two numbers measured near-empty at 100% width"). Market research (Ishay's explicit instruction,
before any mockup): Salesforce Lightning's Highlights Panel — the same UI slot, a key-field strip
atop a record page — documents fields that "wrap and stay visible" rather than stretch to fill the
row (4–6 field guideline). Presented both options as an HTML mockup (visualize tool, real values
from this page) before touching code, per the task's explicit no-code-before-approval instruction
on two closed/merged modules. **Ishay approved option A and ruled it canonical for every future
module**, not a one-off — recorded in `StatTile.jsx`'s own doc comment so it doesn't depend on
session memory. `data-testid`s unchanged (`metric-revenue`/`metric-open`/`metric-avg-deal` live on
`StatTile` itself). `npm run build` exit 0. ⚠️ **Still not verified visually in a browser** — the
Browser pane did not render on Ishay's side this session either (`viewport: 0x0`); reported as open
rather than assumed fine a second time.

**↳ as-built 07/08/2026 — `Highlight` removed from `CustomerDetailsPage.jsx`; stat tiles now come
from the shared `@/components/StatTile`.** Ishay's ruling, made while reviewing module 4's mockups:
the metric tile was defined twice in the repo (here, and inline in `QuotesPage.jsx`) and the two had
**drifted** — opposite label/value order, different value size, different sub-label shade, and a teal
fill here that violates the fill rule now written into `PROJECT_MASTER §4` (fill is reserved for the
one primary action or a real warning; a metric is a fact). **Module 2's form won as canonical**
(label above value) precisely because this module is the designated conventions reference. Visual
delta here is fill-color only — layout, order, and all three `data-testid`s (`metric-revenue` /
`metric-open` / `metric-avg-deal`, which `e2e/customer-page.spec.js` binds to) are unchanged.
Verified: `eslint` 0 · `vite build` 0 · 413 unit tests green · 8 new `StatTile` tests seen failing
under mutation before being accepted. ⚠️ **Not verified visually in a browser** — needs an
authenticated screen; recorded as the session's one open verification item. ⛔ Do not reintroduce a
local tile component here — `src/CLAUDE.md` now lists `StatTile` as mandatory-shared.

> ℹ️ **Checked 05/08/2026 during the `work-manager` removal — historical only, nothing to change.**
> The manager-N mentions in the entries below are dated records of who ruled what at the time.
> They are **not** live routing: no entry here instructs a session to contact anyone. Dated
> journal entries are never rewritten (`docs/CLAUDE.md`).
- 31/07/2026 09:05 — **One-line alignment in `CustomerDetailsPage.jsx` (M3 audit fix-round A).**
  The page passed the **raw `param_value` string** for `אחוז_מעמ` into `vatRate`, while
  `QuotesPage` passes `parseVatPercent(...)` — two screens feeding different types into the same
  prop of the same dialog. Now both call `parseVatPercent`. Behaviour on the happy path is
  unchanged (`paramNumber` in `lib/quotes.js` coerced the string anyway); what it closes is a
  param saved as e.g. `'150'`, which used to travel to the customer document as-is.
  Nothing else in M2 changed. Full context and the reader-trace: `module-3.md` §9 (31/07 09:05).
- 30/07/2026 23:30 — **🐞 Cross-module fix (ruled by Ishay, before M3's 3.7 gate):
  `replaceCustomerContacts` reordered from delete-then-insert to read-old-ids → insert → delete-old-ids.**
  Why now: the identical pattern **really deleted** the 5 seed price tiers of B-REG-TAG in M3's 3.6
  verification (browser closed between the two HTTP requests — they are not a transaction; the DELETE
  landed, the INSERT never fired). An interruption now leaves visible duplicates (old+new side by
  side, gone on next save), never an empty contact list. Upsert (the price_tiers fix) is impossible
  here — the only key is the generated `contact_id`. `contactsLoaded` guard untouched. The convention
  is now recorded in `src/modules/02_customers/CLAUDE.md`: **every future replace-style save, any
  module, is built insert-first.** Live-verified through the real form (add contact → fresh-read →
  remove → restore to 0 rows; `customer_contacts` was and remains 0 rows in production data).
- 30/07/2026 18:35 — **🐞 The §7.34 warning had a silent hole, found because my own E2E archived a
  real customer twice.** `revenueByCustomer` is loaded by a **second, separate request** after the
  customer list. Clicking "העבר לארכיון" in the window before it returns meant `openCount` was
  unknown, the warning **did not appear at all**, and the customer was archived silently — the exact
  failure class this feature exists to prevent. **Fix: "not yet known" ≠ "no open quotes"** — an
  unloaded map now produces its own confirm ("עדיין לא ידוע… להעביר בכל זאת?"). Same doctrine as the
  money module's "ריק אינו 0".
  ⚠️ **A second bug inside that fix, caught before it shipped:** a customer with **no quotes at all**
  is absent from the map, and `undefined` looked identical to "not loaded" — every clean customer
  would have got a spurious warning, defeating Ishay's 11/07 no-friction ruling. Absence is now
  normalised to `{openCount: 0}` explicitly.
  The rule moved to **`archiveWarningMessage` in `src/lib/customers.js` with 4 tests** — extracted
  rather than silenced when `sonarjs/cognitive-complexity` tripped at 21/20, because "unknown vs
  none" is a business classification, not wording. `customer-page.spec.js` now waits for the revenue
  column before clicking, so it exercises the intended branch instead of the unknown one.
  **Also unified:** `logistics-role` in `customers.spec.js` was **deleted** — a strict subset of the
  STAFF test (same user `logistics.test@regin.co.il`, same assertions minus one; its own skip note
  admitted "STAFF מכסה את שכבת ה-blocked"). It was a permanent skip demanding a second env pair for
  one identity. **A second name for the same identity is not extra coverage.** Result: 18/18 E2E,
  zero skips, and `E2E_LOGISTICS_*` is no longer needed at all.
- 30/07/2026 15:10 — **✅ §7.34 RULED AND BUILT (customers part): warn, don't block.** Ishay ruled on
  my recommendation. Archiving a customer **who has open quotes** now opens a confirm naming the
  count and their value ("לעיריית חדרה הצעה פתוחה אחת בשווי 16,520 ₪… להעביר לארכיון בכל זאת?").
  ⚠️ **The confirm is conditional and appears ONLY when open quotes exist** — his 11/07 ruling
  ("archive without confirmation, the action is reversible") still holds for the normal case, and
  a test asserts exactly that. **Why not block:** the open quote is usually the *reason* for
  archiving, so blocking would force rejecting a quote just to archive a customer. ⛔ **Explicitly
  rejected: auto-closing the quotes along with the archive** — that writes to money records the
  user never asked to touch. `openCount` was added to `deriveCustomerMetrics` (**0 is a real 0
  here, not `null`** — `null` would read as "unknown" and fire the warning on a clean customer).
  Costs no extra query: `CustomersPage` already loads quotes for the revenue column.
  **Verified both directions:** the warning appears with the real numbers and **"ביטול" actually
  leaves the customer active** (not merely displayed), and with no open quotes there is no dialog
  at all. Market grounding: Pipeliner / OctopusPro / Dynamics all prompt on linked records.
- 30/07/2026 14:56 — **🔔 §7.34's precondition became true, and this module owns it.** The archive
  comment in `CustomersPage.handleToggleStatus` used to say "no guard on live commitments — there is
  no `quotes`/`projects` data yet", and promised the guard would become a warning "once module 3
  exists". **Module 3 now exists with real quotes.** Verified in code: `setCustomerStatus`
  (`02_customers/api.js`) checks nothing, so a customer holding an open 16,520 ₪ quote can be
  archived with **no warning and no indication**. The comment was rewritten to say so plainly.
  ⚠️ **No guard was built** — §7.34 is an open §7 item and the ruling is Ishay's alone (iron rule 1);
  presented to him 30/07, not decided. Do not build one before he rules.
- 30/07/2026 14:30 — **⚠️ MODULE-2 SURFACE CHANGED BY MODULE 3 (step 3.5). The module is closed and
  merged, but three of its files were rewritten — read this before trusting anything below.**
  **`CustomerDetailsCard.jsx` NO LONGER EXISTS.** Ishay ruled (LOCAL-13 in `module-3.md`) that the
  512px customer dialog becomes a full record page — `CustomerDetailsPage.jsx` at route
  `customers/:customerId`. Reason: it could not hold 30 quotes, and M6 adds project cards on top.
  Structure follows the standard CRM record page (highlights strip → grouped details → related-list
  tabs), verified against Salesforce/ServiceNow docs rather than invented.
  **What else moved:** `CustomersPage` row-click now **navigates** instead of opening a dialog;
  a sortable **"סה"כ הכנסות"** column was added (values from `deriveCustomerMetrics`, which M3
  extended with `quotes`/`vatRate` **by parameter-addition only** — every old call still returns the
  four intentional `null`s, and the regression test for that is in `customers.test.js`).
  **🐞 The one that cost a real bug — do not undo it:** `CustomersPage`'s search/filters/status/sort
  moved from `useState` into **URL query params**, because a dialog preserved that state for free and
  a page does not: without it, "back" from a customer page silently wiped 5 filter values. ⚠️ The
  URL-backed setters **must** accept React's updater form (`set(v => …)`) — two existing call sites
  (archive toggle · consent toggle) use it, and when they got a value-only setter the function was
  stringified into the URL: **no error, no crash, the button simply stopped working.** Caught by the
  `customers.spec.js` archive test, not by lint or build. `resolveNext()` in `CustomersPage` is what
  keeps them working; removing it re-breaks both toggles silently.

- 29/07/2026 17:20 — **Post-close touch on this module's files, from M3 step 3.2 (Ishay caught it in
  the shared `CustomerFormDialog` while creating a customer from the quote screen).** The dialog's
  **left corners rendered square**: the scrollbar was painted into the rounded corner because
  `overflow-y-auto` sat on the same element as `rounded-xl`. Fixed **once, in the shared
  `components/ui/dialog.jsx`** rather than per-caller, so every dialog in the app benefits:
  `DialogContent` is now `flex flex-col max-h-[90vh] overflow-hidden` with an inner
  `flex-1 min-h-0 overflow-y-auto p-6` scroller. The three call sites here
  (`CustomerFormDialog:274`, `CustomerDetailsCard:89`, `CustomersPage:565`) had their
  `max-h-[90vh] overflow-y-auto` **removed** — leaving it would re-create the bug on the outer element.
  ⚠️ **The first attempt broke it worse and Ishay caught that too within a minute:** without `min-h-0`
  a flex child refuses to shrink below its content height, so the dialog **clipped** its bottom
  (the submit button disappeared) instead of scrolling. Verified after the fix: dialog inside the
  viewport, content scrolls, corner radius non-zero, submit button fully visible at the scroll bottom.
  **No behavioural change to this module** — visual only; its 37 tests and the full gate stayed green.
- 11/07/2026 22:55 — **Final 👤 visual pass SIGNED (Ishay: "אישרתי ויזואלית הכל מעולה")** — the 16:21/17:07 UX-rounds' pending visual gate, the module's last open human gate. Module fully closed; remaining = push doc commits + open the PR (human, instructions printed 22:42).
- 11/07/2026 22:33 — **Step 5.4 closing audit (fresh session) — verdict [YES]; DoD typed-echo signed by Ishay 22:39.** Independent re-verification: 13/13 DoD ✓ (evidence per checkbox above) · RLS re-probed live via rolled-back MCP impersonation (CEO/blocked/view on customers+customer_contacts + scen-6/9 ≡ baseline; policy bodies ≡ §7.21 verbatim) · gates in-session: lint 0 · 37/37 · build exit-0 · e2e 10/2-skip · format:check=CRLF-noise-only (`git ls-files --eol`) · advisors triaged (MPP=§7.21-template characteristic, accepted; `quotes` FK index→C-1/M3; 10×deny-all=deliberate) · zero schema drift · live smoke unauth→login+clean console (a11y-snapshot; pane screenshot failed technically — renderer). **Fact corrections (fresh git evidence):** the module was fully committed AND pushed pre-audit (`git ls-remote`=`dce7675`=HEAD, not merged) — the header's "uncommitted/not-yet-pushed" notes were stale, fixed. §7.81's "awaiting typed-echo" note in PROJECT_MASTER was stale (applied 11/07) — fixed. db_roadmap §10 got its missing 11/07 strike-line. **Test-data cleanup (Ishay-approved in-gate):** customers 16/17 + 2 contacts (SQL, cascade) + marketing PDF (Storage API via CEO-authenticated supabase-js client, E2E env pattern — SQL delete blocked by `protect_delete`) → 0/0/0 live-verified. **Tech-debt registered:** atomic-RPC candidate for `replaceCustomerContacts` + write-policy split (a §7.21-template question) — both flagged for M3; marketing-flow E2E → M10. **Also this session (Ishay's rulings, pre-persistence): 3 opening-template adjustments** — 🗣️→mandatory experience-brief (תקציר-חוויה) + PM approval before code · 🤖 self-verification = functional+visual with screenshots (👤 only end-of-phase/design) · new 🎤 PM-Interview section before blueprint approval — + CLAUDE.md rule-1 ripple. 📣 Amit (binds M3's blueprint; CHANGELOG line). The 16:21/17:07 👤 visual pass: Ishay verifying live post-signature.
- 11/07/2026 17:07 — **Marketing-screen redesign (recipient list + preview) + UX/validation gates added to BOTH templates (Ishay-directed).** Follow-on to the 16:21 UX round — same session/branch, before 5.4.
  - **Marketing (`MarketingPanel.jsx` + `api.js`):** the opaque consented-count is replaced by a **recipient list** — every consented+active customer as a row with a **per-send checkbox (default checked)** + name · contact · email · type · discount, so the manager sees & picks WHO receives. Unchecking excludes **for this send only** (`excludedIds` local Set; the standing `marketing_consent` toggle in the list is untouched — Ishay's ruling). The mailto BCC + "copy recipients" use only the checked subset (deduped on email, §7.65). Added a **file preview** after upload (`<img>` for image, `<embed>` for PDF, medium size). New api `getConsentedCustomers()` (full rows, consent+active) **replaces** `getConsentedCustomerEmails` (removed — F1; it was only used here); BCC derived from it. The temporary mailto send-model is unchanged (🚧 מ10). e2e untouched (the spec doesn't exercise marketing). Gate: lint 0.
  - **Future idea (blocked on M6 data — NOT a committed `🚧` debt):** a "customers with no project in the last N months" recipient filter — needs project/last-event data that doesn't exist until M6 (`getCustomerProjects` returns [] under deny-all). Logged as a marketing-filter idea only; M2 was never spec'd to deliver it, so it carries no §6 token.
  - **Templates (governance — Ishay deliberately opened the freeze: M3 is Amit's and imminent, so the templates must be right BEFORE M3, not at the M4 checkpoint):** `create_micro_guide_template.md` — extended the 🗣️ confirm-intent to spec-silent **validations** (flag + show visually); added a named **🎨 UX & functional review 👤 gate at end of Phase 3** (design/states/RTL/keyboard/validation-completeness/redesign-review); added a UX-&-validation **DoD checkbox** + a Usability QA-matrix note. `create_module_final_test_template.md` — added a **binding §2b "UX & Validation Audit"** section, and F1-subtracted the now-redundant soft UX bullet from §3. **The 16:21 UX round is retroactively the very review these gates mandate** (Usability as-run cell ticked in §6). 📣 **Amit:** these template changes bind YOUR module 3.
- 11/07/2026 16:21 — **UX/a11y hardening round (Ishay-directed audit — plan `~/.claude/plans/dazzling-hugging-quill.md`).** A comprehensive UX audit (3 parallel agents: M2 UI · shell/auth/shared · spec+§7 cross-check) on the committed module (`49882b0`); findings triaged against §7 + this log to separate real defects from ruled decisions. Applied on-branch **before** step 5.4 (the closing audit covers them):
  - **🔴 Data-loss fix (`CustomerFormDialog`):** a silent `listCustomerContacts` failure left `contacts=[]`, and save ran `replaceCustomerContacts` unconditionally → delete-then-insert **wiped all existing additional contacts**. Added a `contactsLoaded` guard (true in add-mode; set true only on successful load); on load failure the editor is hidden behind a visible warning and the `replace` is **skipped** (DB untouched). Happy path unchanged.
  - **Additional-contact validation → name + (phone OR email)** (Ishay 11/07 PM) — supersedes the 12:06 "name + valid email required" rule (it blocked name+phone-only, inconsistent with the null-allowing API). Each provided field validated via `validateField` (SSOT — same phone char-guard/≥4 + `EMAIL_REGEX`). Error value is now `{field, msg}` to red-outline the correct field.
  - **Additional-contacts redesigned as per-contact cards** (Ishay-approved mockup): "איש קשר N" header + remove, full-width name, phone/email 2-col, per-field labels — replaces the flat cramped 3-input row.
  - **`CustomerDetailsCard` — uniform RTL right-alignment (Ishay: option A):** ח"פ/phone/email keep `dir="ltr"` (char order) but gain `text-align:right` so all values align right consistently (was a ragged left/right "checkerboard"). Applied to `DetailRow` + additional-contacts rows; label contrast `slate-400→500`.
  - **Catch-all route + 404** (`App.jsx` + new `src/components/NotFound.jsx`): unknown paths rendered a blank page (no `path="*"` ⇒ `<Routes>` returns null). Now a 404 inside the shell with a back-home link (unauth still bounced to `/login` by MainLayout).
  - **Inactive-account dead-end fixed** (`MainLayout`): the "חשבון לא פעיל" card had no exit (session lives in sessionStorage) — added a התנתקות button (`signOut` ⇒ null user ⇒ `/login`).
  - **Marketing upload keyboard-operable** (`MarketingPanel`): the file input was `display:none` (out of tab-order) ⇒ the panel's primary action was mouse-only. Now `sr-only` (kept in tab-order) + `focus-within` ring on the label + `aria-label`. Recipients-load failure now shows a distinct error (was indistinguishable from "no consented customers").
  - **Load-error retry** (`CustomersPage` + M1 `UsersManagementPage`): full-screen load errors had no recovery but a browser refresh — added a "נסה שוב" button (re-runs the loader). *(Left the silent background-reload as-is — a full-page spinner on every save-reload would be worse UX than the in-place refresh.)*
  - **Context-aware empty copy** (`CustomersPage`): the no-results state showed "change your search" even with no search active (empty archive / no actives) — now branches on search-active vs archive vs no-actives.
  - **Keyboard-operable customer rows** (`CustomersPage`): the row opened the card on mouse only — added `tabIndex`/Enter-Space `onKeyDown` + focus ring + `aria-label`. (Full row-as-button ARIA semantics → M12 a11y pass, to preserve table-row semantics for now.)
  - **Primary teal design token** (`index.css`): `--primary` was near-black; brand teal appeared only via per-button `bg-teal-*` overrides, so a plain `<Button>` would render black (drift risk). Repointed `--primary: #0d9488` (grep-audited — only default-Button/`link`/input-selection consume it; all should be teal). `PROJECT_MASTER §4` hex note updated `~#14B8A6→#0D9488` (Ishay: keep the approved shade, align the doc).
  - **a11y attributes (additive):** `aria-label` on icon-only buttons (edit/archive/restore/contact-remove/marketing-remove); `role="alert"` on form/duplicate/recipients errors; per-toast live-region (`ToastProvider`) — error=`role=alert`/assertive, success/info=`role=status`/polite (was one polite container).
  - **Deferred to M12** (logged, not built — Ishay: "just make sure nothing's missed"): systemic label↔field association + `input.jsx` id-gen, `aria-invalid` on main form fields, full contrast sweep, Hebrew webfont (Geist is Latin-only — Ishay: yes, in the M12 typography pass), topbar disabled-search hint, toast timeout/stack cap, tab-pattern consistency, `aria-sort`, shell edges (session-expiry msg, dead `.dark` theme), cross-browser/mobile. All enumerated in `architecture_and_qa_roadmap.md` → "אצוות UX/נגישות ל-M12".
  - **Confirmed intentional, NOT touched** (cross-checked §7/§9): no-delete/archive, hidden archive, chip icons, marketing-in-dialog, free-form phone, 5 placeholder metric cards + inert stars (§7.79/§7.80), no audit-trail (§7.23), the 3 parked items, teal (not red) confirms (no irreversible action in M1/M2).
  - Verified: **lint 0 · build ✓ · test:run 37/37 · test:e2e 10/2-skip · prettier clean (changed files)**. Live: unknown-route→login redirect confirmed (no blank page), zero console errors, login renders. Authenticated-screen visuals (contact cards, card alignment, teal default buttons) go to the 👤 visual gate. 📣 **Amit** (shared surfaces): `--primary` token now teal (plain `<Button>` = teal, overrides no longer needed), `ToastProvider` per-toast live-region, `App.jsx` catch-all + `NotFound`. **Uncommitted — folds into the 5.4 delivery.**
- 11/07/2026 12:53 — **UX insights 4 + 6 built + phone letters bug (Ishay).**
  - **Phone bug — letters now rejected** (`validateField` phone): "ן9999999" was saved because the ≥4-digit check ignored the non-digit letter. Added an allowed-chars guard `^[\d\s+()\-.]+$` (digits + phone punctuation only) before the digit-count. Still free-form, no rigid pattern.
  - **(#4) Form shortened** (`CustomerFormDialog`): short fields paired into 2-col rows — איש-קשר‖טלפון, אימייל‖אחוז-הנחה (long fields שם/ח"פ/סוג stay full-width). Less scrolling to the submit button; collapses to 1-col on narrow screens.
  - **(#6) Consent-filter duplication removed** (`CustomersFilterSheet`): dropped the panel's "מאושר לדיוור בלבד" switch — the prominent "קהל דיוור" toolbar chip (active + consented) already covers it, more visibly. Panel is now type/recent/has-discount/satisfaction; `Switch` import removed.
  - **(#5)** — already shipped 12:39 (`consentedPhrase` grammar); no-op here.
  - Verified: lint 0 · test:run 37/37 · build ✓ · `test:e2e` 10/2-skip. **Committed at end of session (Ishay's request) — single module commit.**
- 11/07/2026 12:45 — **External-AI UX recommendations — critically triaged (Ishay: "בערבון מוגבל, ביקורתי אבל שקול").** Applied the valid ones + Ishay's 2 direct asks; rejected the wrong/conflicting ones with reasons:
  - **APPLIED:** (a) **removed the min-discount filter** (`CustomersFilterSheet`) — real duplication with the "הנחה" (יש/אין) dropdown; Ishay agreed. Kept the dropdown (KISS). (b) **"אירוע אחרון (רדום?)" → "אירוע אחרון"** (`CustomerDetailsCard`) — the "(רדום?)" read as noise. (c) **search box capped `max-w-md`** so the toolbar buttons breathe. (d) **secondary columns (סוג לקוח, איש קשר) → `text-slate-600`** so the name (only `font-medium` cell) leads the hierarchy.
  - **REJECTED (with reason):** • "3 bold columns / reduce weights" — **factually wrong**: only שם לקוח is emphasized; the rec was based on a misread. Salvaged the valid core (lighten secondary cols) as (d). • "arrange filters 2×2 grid" — **conflicts with Ishay's "make it smaller"**: the current single wrapping row is more compact than a 2-row grid. • "toggle detached / align to label" — **already fixed** in the 12:39 compact redesign (label-above pattern). • "default 0 looks like an active value" — **moot** (min-discount removed; and it was a gray placeholder, not a value). • broad column-centering + larger action hitboxes — considered, declined (churn vs low value near close; right-align is consistent RTL, `dir="ltr"` already on ח"פ/phone/email).
  - Verified: lint 0 · test:run 37/37 · build ✓ · `test:e2e` 10/2-skip.
- 11/07/2026 12:39 — **UX review follow-through (Ishay picked 3 of 6 insights to build).**
  - **(2) Table horizontal scroll:** wrapped the customers `<table>` in `overflow-x-auto` + `min-w-[56rem]` (`CustomersPage`) — 11 columns now scroll on mobile instead of squishing.
  - **(5) Recipient-count grammar:** `MarketingPanel` `consentedPhrase(n)` — `0`→"אין לקוחות…", `1`→"לקוח אחד אישר…", `n`→"n לקוחות אישרו…" (fixes "1 לקוחות אישרו").
  - **(3) Filter panel → truly compact:** redesigned `CustomersFilterSheet` from a full-width 2-col grid (≈5 rows tall) to a **single wrapping row of narrow, content-width controls** (`flex flex-wrap`, per-field `w-24/w-32/w-44`). Verified visually — the panel is now ~1 row. Filter logic/testids unchanged.
  - Ishay **declined** insight #1 (collapse the card's 5 empty metric cards — stays per §7.79/§7.80), #4 (form 2-col), #6 (consent-control overlap) — parked.
  - Verified: lint 0 · test:run 37/37 · build ✓ · `test:e2e` 10/2-skip.
- 11/07/2026 12:27 — **Two corrections (Ishay) + live visual UX review.**
  - **Satisfaction filter RESTORED** (`CustomersFilterSheet`): Ishay — "important filter, don't let me forget it exists." Undoes the 12:06 removal; **re-aligns with §7.80** (show-but-disabled until M8). Kept in the slimmed/compact styling.
  - **Phone check relaxed 9→4 digits** (`validateField`): Ishay noted some businesses have shorter numbers (service `*XXXX`, short business lines) — a 9-digit floor false-rejected them. Now just a minimal ≥4-digit sanity check (rejects empty/garbage, allows short legit numbers); still free-form, no pattern. Generic message.
  - **Live visual UX review** (captured the real logged-in screens via a throwaway Playwright screenshot spec — now deleted — since I can't hand-type the login). Insights logged for Ishay's triage (none built without his call): **(a)** customer card shows 5 empty "אין נתונים עדיין" metric cards — reads unfinished in M2 (no data till M3/M6/M8); candidate to collapse into one note (touches §7.79/§7.80). **(b)** filter panel still a large 2-col full-width footprint even after slimming — a true fix is narrower/inline controls or a quick-chip bar. **(c)** add-customer form is tall (scrolls past submit) — a 2-col layout for short fields would shorten it. **(d)** customers table has no `overflow-x` wrapper — 11 columns overflow on mobile. **(e)** "1 לקוחות אישרו" — Hebrew plural agreement for count=1. **(f)** "קהל דיוור" chip + "מאושר לדיוור בלבד" filter overlap.
  - Verified: lint 0 · test:run 37/37 · build ✓ · `test:e2e` 10/2-skip.
- 11/07/2026 12:17 — **Shared toast system + filter shrink (Ishay approved).**
  - **Toast notifications** (`src/components/ToastProvider.jsx` — `ToastProvider` in `App.jsx` + `useToast()` → `toast.success/error/info`): styled, RTL, §4 colors, **bottom-center snackbar** (market convention), auto-dismiss 4s + manual X, stackable. **All 4 `window.alert` sites converted** to `toast.error`: M2 `CustomersPage` (consent/status fail), `MarketingPanel` (copy fail), M1 `UsersManagementPage` (deactivate fail) — see `module-1.md` §9. **Zero native `alert`/`confirm` left in the app.** Also added **success toasts on archive/restore** (`הלקוח הועבר לארכיון`/`הלקוח שוחזר`) — restores the non-blocking feedback that was lost when the archive confirm was removed (12:06). Now the two shared UI primitives: `useConfirm` (blocking, critical actions) + `useToast` (non-blocking feedback).
  - **Filter panel shrunk further** (Ishay: still too big): control padding `p-3→p-2`, labels `text-sm→text-xs`, field gaps `1.5→1`, panel `p-4→p-3`/`gap→2.5`. Noticeably more compact without a full quick-chip redesign.
  - Verified: lint 0 · test:run 37/37 · build ✓ · `test:e2e` 10/2-skip.
  - ℹ️ **Answered for Ishay (not a code issue): the "app refreshes every few seconds" is Vite HMR reacting to my live file edits** on his dev server — no polling/interval/realtime/`location.reload` exists in the app (`autoRefreshToken` is an ~hourly token refresh, not a page reload). Zero auto-refresh in the built app.
- 11/07/2026 12:06 — **UX batch (Ishay live review, judgment delegated "בצע לפי שיקול דעתך") — 4 changes:**
  - **(1) Additional-contact validation** (`CustomerFormDialog`, §7.81): a contact row with ANY content now requires a **name + valid email** (was saving partial/emailless contacts). Per-row inline error (`contact-row-error`), cleared on typing, checked on save. Phone stays optional for additional contacts.
  - **(2) Customer phone — light length check** (`validateField`): phone stays free-form (no format regex — the 10/07 decision holds) but now requires **≥9 digits** (strips separators), catching truncated numbers (Ishay: "deleted 2 digits in edit and it saved"). Applies on blur + save, to add + edit.
  - **(3) Archive confirm REMOVED** (Ishay: archiving is trivially reversible → confirm is needless friction). `CustomersPage` archives directly now; `useConfirm` unwired from M2. **Principle set: confirm only for critical/high-impact actions.** ⟹ the shared `ConfirmDialog` (11:53 entry) now backs **only M1's user-deactivation** (login-blocking = critical) + future real deletes — still worth the infra, just not for reversible archive. E2E updated (no confirm click on archive).
  - **(4) Filter panel slimmed** (`CustomersFilterSheet`, Ishay: "המשבצת גדולה מדי"): tighter padding/gaps (`p-5→p-4`, `gap-4→gap-3`, `rounded-2xl→xl`) **and the disabled "ציון שביעות רצון" filter removed** — it was inert until M8 and pure bulk. **↳ deviation from §7.80** (which had it shown-but-disabled to mirror mockup 04): the *filter* returns in **M8** with real data (🚧 מ8); the list stars column is untouched. *(Answer to "which filters are yes/no like consent": only `marketing_consent` (already a switch) and `hasDiscount` are binary-natural; type/min-discount/recent are multi-value. Left the has-discount tri-state select as-is — a full quick-chip redesign was judged disproportionate at module close; slimming addressed the size complaint.)*
  - Verified: lint 0 · test:run 37/37 · build ✓ · `test:e2e` 10/2-skip.
- 11/07/2026 11:53 — **Shared `ConfirmDialog` — styled confirm modal replacing native `window.confirm` (Ishay approved, "צריכים להיות עקביים במערכת").** New app-level infra `src/components/ConfirmDialog.jsx`: `<ConfirmProvider>` (mounted once in `App.jsx` inside `AuthProvider`) + imperative `useConfirm()` hook returning `confirm(options) ⇒ Promise<boolean>` — so `if (window.confirm(msg))` migrates ~1:1 to `if (await confirm({ message: msg }))`. RTL, §4 teal (or red when `danger:true` — reserved for real deletes; archive/deactivate stay teal since reversible). **Wired both existing `window.confirm` sites for system-wide consistency:** M2 `CustomersPage` archive + **M1 `UsersManagementPage` deactivate-user** (see `module-1.md` §9 — same-session cross-adoption; both are Ishay's modules, no Amit surface). **E2E updated** (`customers.spec.js`): archive now clicks `confirm-dialog-confirm` instead of relying on the native-dialog handler. Verified: lint 0 · test:run 37/37 · build ✓ · `test:e2e` 10/2-skip.
  - 📋 **Consistency map (Ishay asked to note where else it's needed):** the 4 remaining `window.alert` sites (error notices — `CustomersPage` consent/status fail ×2, `MarketingPanel` copy-fail, `UsersManagementPage` status-fail) are **NOT** converted here — they want a *notification/toast* pattern (a different component than a confirm), a bigger consistency pass. Logged as the next UI-consistency item, not built now.
  - 🔎 **UX review (final pass on all 5 customer screens) — minor, non-blocking observations, none built without Ishay:** (1) archive-view empty state reuses the search "אין תוצאות" copy — slightly off when the archive is simply empty (could be context-aware). (2) The customer card shows 5 "אין נתונים עדיין" metric cards at once (M3/M6/M8 data) — deliberate per §7.79/§7.80 but reads as sparse; fine as ruled. (3) `אירוע אחרון (רדום?)` label wording is a bit dense. All three are polish-only; parked, not changed.
- 11/07/2026 11:41 — **UX tweaks (Ishay review, post-visual-gate): archive navigation + action-icon affordance.** Two changes to `CustomersPage.jsx`, both Ishay-decided during a live review (with two injected test customers, ids 16/17):
  - **(a) Archive list toggle → single "ארכיון" button.** The `הצג ארכיון` toggle confused (its name implied "archive only" but it showed active+archived together). *(Intermediate: a 3-state `פעילים/בארכיון/הכל` segment was tried, then Ishay chose simpler.)* **Final:** a **single button** — in the active list it reads `ארכיון` (Archive icon) and leads to the archive; in the archive it reads `חזרה לפעילים` (ArrowRight) and returns. `statusView` is 2-valued (`active`/`inactive`) and `visibleCustomers` always sends exactly one (`status: statusView`) — the two lists are never shown together (deliberate; deviation from M1 show-all+dim). The `קהל דיוור` preset resets it to `active`. No lib change (`matchesCustomerFilters` exact-matches `status`).
  - **(b) Action icons → colored chips (option ב).** Archive/restore were two near-identical box icons. Now each sits in a **color-coded chip**: archive = amber (`bg-amber-50/text-amber-700`), restore = teal (`bg-teal-50/text-teal-700`). **Deliberately NOT a red trash** — archive is a reversible move, not deletion (the no-delete convention). Titles/testids unchanged.
  - **E2E updated** (`customers.spec.js`): the archive-reversible spec drives the single `customers-archive-toggle` (into the archive then back) instead of the removed toggle/segment. **Verified: lint 0 · build ✓ · `test:e2e` 10/2-skip.** Supersedes the `הצג ארכיון` toggle (01:35 entry stays as history).
  - *(Also confirmed for Ishay, not a change: marketing send already excludes inactive — `getConsentedCustomerEmails` filters `consent AND status='active'`, api.js:63.)*
  - 🎨 **Open polish idea (Ishay asked "when do we build a designed confirmation dialog?"):** the archive step uses the native `window.confirm` (also true in M1's `UsersManagementPage`). A styled RTL confirm modal (shadcn `Dialog`, §4) would be a **shared** component both modules adopt — NOT spec-required, pure polish. Not scheduled to a step; candidate for a shared-UI pass or M12 integration. Logged here as a deferred idea, not built now.
- 11/07/2026 03:13 — **Phase 5 · step 5.3 done 🤖 (docs persistence + backward write-back).** `module-1.md` phase-table row + step-5.2b marked ✅ CLOSED — M1's deferred `customers` RLS gate was discharged by M2 step 1.3's 14-scenario matrix (the forward-only 🚧 מN mechanism doesn't cover a backward-repaid debt, hence the explicit mark). §6 🚧 audit: all M2 tokens (מ3/מ6/מ8/מ10) already carry matching §6 lines — clean, nothing to add. Per Ishay's choice, **step 5.4 (closing audit + PR) will run in a fresh session** (the closing template wants an independent re-verification, and this session built the module). Module still uncommitted — the closing session runs `regin-pr-gate` (commit+push on green) then opens the PR.
- 11/07/2026 03:07 — **Phase 5 · steps 5.1 + 5.2 done 🤖.** `e2e/customers.spec.js` written (4 specs). ↳ **coverage/creds decision (Ishay 11/07 — "creds fine, academic-light security"):** the guide names finance/logistics identities, but the two active creds (`E2E_CEO_*`+`E2E_STAFF_*`) already cover both permission tiers — CEO=edit runs the full lifecycle (create → save-success → search → filter no-results → archive→hidden → הצג-ארכיון→restore), STAFF=logistics covers blocked (no sidebar link + `/customers` "אין הרשאה"). finance/logistics-named specs `test.skip` gracefully until those creds exist. **Claude does not type test passwords** (fixed safety guardrail, independent of the project's light-security posture) — the framework injects env creds, same as all existing specs. ↳ **self-cleaning:** `afterAll` hard-deletes the unique-ח"פ test customer via a CEO-authenticated `supabase-js` client (no UI delete by design — archive convention; `customer_contacts` FK cascade covers contacts). Verified live post-run: **customers=0 / contacts=0** (shared-DB 0-row invariant restored). **`test:e2e` → 10 passed / 2 skipped.** 5.2 gate: lint 0 · build ✓ · `test:run` 37/37 · new file prettier-clean; repo-wide `format:check` = the known Windows-CRLF noise only (CI/Linux clean). The 👤 creds sub-step of 5.1 is now optional.
- 11/07/2026 02:56 — **👤 GATES SIGNED (Ishay).** Both open human gates closed in one confirmation ("מאשר, אימתתי ויזואלית הכל, הכל עובד היטב"): (1) **end-of-Phase-3 visual-pass** vs §4 design — Ishay visually verified all screens; (2) **end-of-Phase-4** sign-off on the 4.2 security-regression evidence. Phases 1–4 now fully closed + signed. Next = Phase 5 (QA & handoff), starting at the Phase-5 door (Ledger sweep for OPEN 5.x items, notably the E2E-creds reconciliation) → step 5.1. Nothing committed yet (single module commit at close).
- 11/07/2026 02:48 — **Phase 4 (Control & Integration) — steps 4.1 + 4.2 verified 🤖; awaiting the 👤 end-of-phase gate.** No source files changed (both steps are verification-only). **Step 4.1 (permission-matrix walk — HYBRID, Ishay-approved, because only CEO+STAFF UI creds exist):** (a) live DB matrix via MCP — all 5 roles→'לקוחות' = מנכ"ל / מנהלת פרויקטים / מנהלת כספים ולקוחות **edit**, מנהלת גיוס ושיבוץ / מנהלת לוגיסטיקה **blocked** (= the seeded §3 tiers); (b) code-path proof the gate is role-generic — `Sidebar.jsx:54` filters `blocked` out of the sidebar, `App.jsx:60-67` wraps `/customers` in `ProtectedRoute allow='לקוחות'`, `ProtectedRoute.jsx:32-40` renders "אין לך הרשאה" on a direct-URL hit by a non-allowed role, `MainLayout.jsx:24-25` bounces unauth→`/login`; (c) live browser smoke — `/customers` while unauthenticated redirected to the login screen (`read_page` confirmed the login form rendered). ↳ **as-built / deviation from the literal "5 preview snapshots":** I do **not** type the E2E test passwords (safety — entering passwords to authenticate is off-limits, test account or not); the credentialed live role-differentiation is delivered instead by the **executed M1 Playwright specs in 4.2** (the framework injects the env creds) exercising the identical `ProtectedRoute` mechanism. Full per-'לקוחות'-role credentialed screenshots stay scheduled for step 5.1 (`customers.spec.js`). The §2/L75 claim that `E2E_FINANCE_*`/`E2E_LOGISTICS_*` are provisioned is still stale — reality is `E2E_CEO_*`+`E2E_STAFF_*` only (already flagged 10/07 20:13). **Step 4.2 (security regression, iron rule 9):** `npm run test:run` → **37/37** (4 files, 2.2s); `npm run test:e2e` → **8/8, 0 skipped** (M1 green — incl. unauth→login redirect, CEO login, logistics/STAFF blocked from the CEO-only screen, matrix self-lockout); RLS scenarios **6 & 9** re-run via MCP impersonation (rolled back) — CEO positive control **users=7 / perm-update=45**, logistics **users=1 (scen 9) / perm-update=0 (scen 6)** — matches the step-1.3 baseline exactly ⇒ core `permissions`/`users` untouched by M2. ⚠️ **schema note:** `current_user_role_id()` resolves via **`auth.email()`** (`public.users` keys on `email`, no uuid) — the guide's §2 `user_id`/`sub` impersonation reference is stale for this schema; used the `email` claim.
- 11/07/2026 02:34 — **step 3.7 built + verified: multi-contact wiring (Option C).** `api.js`: `listCustomerContacts` + `replaceCustomerContacts` (delete-all + insert; empty/nameless rows filtered) · `listCustomers` now selects `customer_contacts(contact_name)` for search. `src/lib/customers.js`: `matchesText` extended to match the primary contact **and** every additional contact's name (§7.11 forgiving search now spans all contacts) + unit test (37 total). `CustomerDetailsCard`: loads + renders an "אנשי קשר נוספים" section (added to the existing Promise.all). `CustomerFormDialog`: repeatable "אנשי קשר נוספים" rows — add/remove via a **stable `_rk` key** (module counter, not index), loaded via a fetch effect in edit mode, saved via `replaceCustomerContacts` after the customer save. Gate: **lint 0 · 37/37 · prettier-content clean · build ✓** (applied the earlier prettier/purity lessons — no surprises). Live browser check blocked by the login wall (no credentials); compilation+logic covered by build+tests. **Also — CLAUDE.md DB-protocol CLARIFIED (Ishay 11/07):** typed-echo gate = **double-confirmation (Claude explains impact → user types the migration name) → Claude applies via MCP `apply_migration`**; the user does NOT run SQL manually. This session over-corrected (handed SQL to the browser Claude, which hit RTL-corruption pain); the rule now says migrations are Claude-applied-via-MCP after the gate, with browser/CLI fallback + a comment-stripped ASCII SQL only when the MCP is unavailable.
- 11/07/2026 02:18 — **`customer_contacts` migration APPLIED + verified live.** Applied via Supabase SQL Editor. ⚠️ **RTL-SQL lesson:** direct typing into the editor failed repeatedly — the Hebrew comments' bidi + autocomplete garbled characters into keyboard shortcuts / a mangled policy name; it succeeded only when inserted via Monaco's API (content-verified before run). **Fix for next time: hand the SQL runner a comment-stripped ASCII version** (only the load-bearing `'לקוחות'` literal stays) — added to `CLAUDE_CODE_LOG` מוקשים. Verified live (MCP `list_tables`+`execute_sql` AND the browser agent): table `customer_contacts` + 7 columns + FK `customer_contacts_customer_id_fkey` + covering index + `extensions.moddatetime` trigger (worked — no schema-less fallback needed) + RLS + both policies (`select` view/edit, `write` edit); 0 rows. `docs/schema.sql` snapshot updated with the block. Transient Supabase status-banner during apply was a platform issue, unrelated (queries succeeded). **Next: step 3.7 — api CRUD + repeatable contact rows in `CustomerFormDialog` + card display + `matchesText` search over contacts, against the live schema.**
- 11/07/2026 01:57 — **verify-gate fix (triggered by the other session reporting "the build failed").** `vite build` never actually failed (198 modules ✓); what failed was `npm run verify`, from two of this session's edits — **both now fixed:** **(1)** `Date.now()` inside `CustomersPage`'s `useMemo` → `react-hooks/purity` **lint** error (⚠️ `vite build`/dev-server do NOT catch this — the project uses plain `@vitejs/plugin-react`, no React Compiler, so purity is lint-only; easy to miss). Fixed: the `createdAfter` cutoff is computed in `CustomersFilterSheet`'s onValueChange **event handler** and passed via `filters` — `matchesCustomerFilters` stays pure. **(2)** 4 files had over-`printWidth` lines → `format:check` failed. Fixed with `prettier --write --end-of-line auto` (customers.js/.test.js, CustomerFormDialog.jsx, MarketingPanel.jsx). `format:check` still fails **locally** on Windows for ~40 files on CRLF only (known, CI/Linux-LF unaffected). **Final state: lint 0 · 36/36 · prettier-content clean · `vite build` ✓.** Both traps added to `CLAUDE_CODE_LOG` מוקשים (purity + printWidth). No behavior change — formatting/lint only.
- 11/07/2026 01:35 — **Phase-3 enhancements (Ishay) + multi-contact migration authored.** Trigger: another chat reviewed the Phase-3 WIP and proposed 14 recommendations; each was verified against the code (most "critical" ones were wrong / contradicted frozen decisions — full analysis in the approved plan `~/.claude/plans/wiggly-cooking-pearl.md`). **Applied (4 endorsed fixes):** `updateCustomer` now also strips `status` (archive/restore only via `setCustomerStatus`); submit button disabled on a §7.11 duplicate; `getConsentedCustomerEmails` deduped (`[...new Set]` — `email` is non-unique §7.65 ⇒ no double-BCC); the dialog `key` uses an **open-counter** (`dialogSeq`) instead of `dialogOpen` so Radix's exit animation plays without losing the form-reset-on-open. **Rejected (with reason):** BigInt `String()` coercion (both compare sides are same-serializer server values — no real mismatch), restore-`onOpenChange(false)` (the dialog is *meant* to stay open→edit per §7.11 "שחזר ופתח לעריכה"), Hebrew-filename regex (the ASCII-safe path is deliberate; the "fix" injects non-ASCII Storage keys). **Ishay's new requests, all built:** **(a)** 3 filters in `matchesCustomerFilters` (`src/lib/customers.js`) + `CustomersFilterSheet` — "קהל דיוור" preset (active+consent, header chip), "נוספו לאחרונה" (`createdAfter` — computed in the sheet's **event-handler, not render**, per react-hooks/purity), "יש/אין הנחה" (`hasDiscount`). **(b)** "הצג ארכיון" toggle — default active-only (`status='active'` filter in the page memo). ↳ **DEVIATION from the M1 binding convention** (show-all + dim): M2 now *hides* archived by default behind the toggle (still dims when shown). **(c)** Marketing panel moved from the page bottom to a **header-button dialog** — `MarketingPanel` gained an `embedded` prop (drops its own card/heading; reused otherwise as-is). ↳ **deviation from mockup 01** (marketing card at the top of the list); rationale: with 50+ customers an inline panel (top or bottom) buries either the list or itself. **(d)** Customer card → **5 metrics** (הכנסות · מספר אירועים · אירוע אחרון/רדום · גודל עסקה ממוצע · ממוצע משוב); **gross-profit dropped from the card** (persona decision — account-manager, not finance/P&L). ↳ **deviation from C6 §2.4.1** (lists gross-profit as a customer derived-attr). `deriveCustomerMetrics` now returns the 5-shape (no `grossProfit` key); 16 lib tests updated/added (total suite 36). **(e) Multi-contact (Option C — Ishay 11/07, new §7 item):** primary contact stays inline on `customers` (spec-faithful, zero backfill, M3 quote-picker/PDF unaffected); *additional* contacts in a new child table `customer_contacts` (FK→`customers` `on delete cascade on update cascade`, RLS §7.21 same 'לקוחות' gate, `moddatetime`, covering index). Migration `20260711013517_module2_customer_contacts.sql` **WRITTEN — pending 👤 typed-echo apply**; api/UI/lib/search wiring follows AFTER apply (DB-first, rule 12). ↳ **deviation from C6 §2.4.1** (single inline contact). **Verify:** `npm run test:run` **36/36** · `npm run lint` **0** · `npm run build` **✓ (198 modules)**. All work stacked on the other session's uncommitted Phase-3 files (single module commit to follow). 🚧 rows registered in §6: derived-filters (מ3/מ6/מ8) + additional-contacts (מ3).
- 11/07/2026 01:01 — **Step 3.6 done + Phase 3 COMPLETE + test-data cleanup.** New file `CustomerDetailsCard.jsx` (Dialog). Verified live: clicking a row opens "כרטיס לקוח: [name]" with a **fresh `getCustomer(id)` read** (not stale list state) — all details, **3 metric placeholders all "אין נתונים עדיין"** (סה"כ הכנסות / **רווח גולמי מצטבר** §7.79 / ממוצע משוב), and project history empty state "אין פרויקטים עדיין" (`getCustomerProjects` → [] until M3/M6). ↳ as-built: (a) row `onClick` opens the card; the consent-`td` and actions-`td` `stopPropagation` so their controls don't also open it. (b) card is remounted via `key={customerId}` for fresh per-customer load (no sync-setState effect — same react-hooks pattern as the other components). (c) two JSX labels with a `"` (ח"פ / סה"כ) use `{'…'}` expressions. **Full gate after 3.6: `npm run test:run` 32/32 · `npm run lint` 0 · `npm run build` ✓ · DoD business-formula grep 0 hits.** **Test-data cleanup (restores the empty state the guide assumes):** the 2 verification customers (ids 13/14) deleted via MCP `execute_sql`; the 2 marketing files removed via the Storage API (`supabase.storage.from('marketing').remove` in-browser — SQL delete on `storage.objects` is blocked by `protect_delete`). Live-verified: **0 customers, 0 marketing objects**; empty state re-renders ("אין לקוחות במערכת עדיין", marketing "0 מאושרים"). **Phase 3 awaits the 👤 visual-pass gate (Ishay vs §4) before Phase 4.**
- 11/07/2026 00:53 — **Step 3.5 done (marketing panel; preview-verified as CEO).** New file `MarketingPanel.jsx` (separate card under the list, edit-only). Verified live: header shows the consented-recipient count ("1 מאושרים"); upload of a small PDF → **Storage write confirmed via MCP** (`select count(*) … bucket_id='marketing'` = 1); the send button is an `<a href>` whose href **starts with `mailto:`**, `bcc`=exactly the consented+active email (`dana@intel-il.co.il`), and `subject`/`body` are `encodeURIComponent`'d — decoded `body` carries the **full public URL intact** (the `&`/`?` didn't truncate it — the load-bearing check); "החלף קובץ"/"הסר" swap correctly (uploaded→removed returns send to disabled); copy-link/copy-recipients present (disabled until file/recipients exist). ↳ as-built: (a) consented list comes from `getConsentedCustomerEmails()` (api SSOT for the consent+active predicate — not re-derived); parent passes a `refreshKey` (a cheap cache-key signature of consented-active ids) so the panel refetches after a consent/archive change — **not** a duplicated predicate. (b) §7.36 orphan note honored — M2 upload is Storage-only (no paired DB write), so no orphan scenario; comment kept. (c) ⚠️ **clipboard `readText` freezes the automation** (permission prompt) — the component uses `writeText` only; verification avoided `readText`. (d) ⚠️ **live test artifacts:** 2 files now in the `marketing` bucket (promo_test.pdf, promo2.pdf) — clean up at session end with the 2 test customers.
- 11/07/2026 00:43 — **Step 3.4 done (bidirectional archive; preview-verified as CEO).** Archive icon (active) / restore icon (inactive) in the actions column via `setCustomerStatus`; `window.confirm` before archive only (restore friction-free — M1 pattern). Verified live: archive → row `opacity-60` + "לא פעיל" pill + restore button swaps in; restore → un-dimmed + "פעיל" + archive button back; **persists across page reload** (DB round-trip). No "delete" wording anywhere. §7.34 stays OPEN — NO guard on live-obligations (no quotes/projects data exists), M3-leaning = warning-not-block (Ledger). **Also closed the 3.2-deferred §7.11 archived-restore flow live:** adding a customer whose ח"פ matches an archived one shows "הלקוח [name] (ח"פ …) קיים בארכיון — לשחזר?" + "שחזר מהארכיון ופתח לעריכה" → restores to active AND opens the edit dialog (title "עריכת לקוח: [name]"). No `edit-existing` button on the archived branch (correct — that's the active-duplicate branch).
- 11/07/2026 00:38 — **Step 3.3 done (search + filter sheet + column sorting; preview-verified as CEO with 2 test customers).** New file `CustomersFilterSheet.jsx` (hand-rolled collapsible panel — no shadcn Sheet exists; free-hand grant). Verified live: **ONE search box** driving the §7.11 forgiving search — found the same set by contact-name-only ("רות"), company-name-only ("אינטל"), and ח"פ-prefix ("500"); no-match ("999") shows the `customers-no-results` state. **Column sorting** via the tested `sortCustomers` — discount header: 1st click ascending (5%→15%), 2nd click descending (15%→5%), teal active-arrow indicator. **Filter sheet**: type filter (חברה ממשלתית → only משרד החינוך), min-discount (≥10 → only אינטל 15%), consent-only (→ only the consented row), "נקה הכל" restores all. **Satisfaction filter renders present-but-disabled** ("אין נתונים עדיין", §7.80). ↳ as-built: (a) search state is separate from the advanced-filter object, merged into one `filters` arg for `matchesCustomerFilters` — the UI re-implements no predicate. (b) placeholder string with `ח"פ` uses a `{'…'}` JS-string expression (a `"`-delimited JSX attribute breaks on the gershayim). (c) `SortableHeader` is a top-level component (react-hooks static-components rule). (d) type/satisfaction use a `__any__` sentinel value because Radix `SelectItem` forbids an empty-string value.
- 11/07/2026 00:27 — **Step 3.2 done (CustomerFormDialog; preview-verified as CEO).** Verified live: create→row · exact ח"פ error "שגיאה: מספר ח.פ. חייב להכיל 9 ספרות בדיוק" blocks partial input · field retention on error · §7.11 duplicate notice naming existing customer (company+contact+ח"פ) + "ערוך את הכרטיס הקיים" that switches the dialog to edit mode (title "עריכת לקוח: [name]", ח"פ read-only) · edit save updates the row + green "הנתונים נשמרו בהצלחה" strip → auto-close → reload. ↳ as-built notes: **(1)** dialog is initialized from props via `useState(initializer)` + a `key` remount on the parent (NOT a sync effect) — the new react-hooks `set-state-in-effect` rule rejects the M1 open-dialog-effect pattern; the parent passes `key={`${dialogOpen}-${editingCustomer?.customer_id ?? 'new'}`}`. **(2)** `FieldError` is a top-level component taking a `message` prop (react-hooks `static-components` rule bans in-render component definitions). **(3)** duplicate detection is against the loaded list (`customers` prop) per plan; DB 23505 kept as the race-safety net. **(4) archived-restore branch of §7.11 not yet UI-verified** — needs an archived customer, which arrives with step 3.4's archive toggle; will verify then. **(5) ⚠️ live test data:** one customer (אינטל ישראל / 514123456, id 12) created in the shared DB during verification — to be removed at session end to restore the empty state the guide assumes.
- 10/07/2026 20:13 — **Step 3.1 done (CustomersPage list + route swap; preview-verified: empty state, RTL, teal sidebar item, console clean).** Two ↳ as-built notes: **(1) E2E creds reality differs from §2:** `.env.local` holds `E2E_CEO_*` + `E2E_STAFF_*` (logistics) — there are NO `E2E_FINANCE_*`/`E2E_LOGISTICS_*` vars (the §2 Test-Identities claim and e2e spec env-names need reconciling at step 5.1's 👤 creds gate). Phase-3 preview verification therefore runs as **CEO** (edit tier — equivalent gate for edit-mode checks). **(2) New react-hooks lint rules** (`set-state-in-effect`, declaration-order) reject M1's load-function pattern in new code — CustomersPage uses the canonical cancelled-flag effect + `reloadTick` state for refresh; M1 files pass only because their function is declared after the effect (analyzer doesn't resolve forward refs). Consent Switch is live from the list (edit-only); add-button/actions land in 3.2/3.4.
- 10/07/2026 19:52 — **Phase-3 P13 sweep RULED (Ishay approved all recommendations after re-think) + fresh-context adversarial audit (Ishay's "extra eye" request) → 4 findings, all fixed same-session.** Rulings (full text = Ledger row): one search box · sorting=build · marketing replace/remove yes, drag-drop no · §7.80 M2-scope nod · §7.65 no email-UNIQUE (composite `UNIQUE(email,company_number)` rejected as no-op) · §7.34 plain toggle (M3 leaning: warning-not-block) · **free-hand grant** on search/filter/sort details. Audit findings fixed: **(1) gross-profit `🚧 מ7`→`🚧 מ8` retarget** — M7 is the display-only dashboard; the profit formula is authored in M8 (spec 5.14; §7.78 exec `מ3/6/8`); §6 carries a routing-tombstone for the historical token; §7.79 module-target + citation corrected (C5 §5.6.3 names only revenue+feedback — the gross-profit source is C6 §2.4.1). **(2) `getCustomer` wired** into step 3.6 (fresh single-row read on card open — was an unconsumed api surface). **(3) read-path requirement registered in §6** for M3/M6: projects+quotes SELECT must stay `view`-tier (§7.21 template) or the card history silently empties; M6 regression named. **(4) feedback-averaging note** for M8: spec 5.7.3 averages past events only — filter completed projects before averaging (noted in §6 + `deriveCustomerMetrics` comment). Verified after fixes: all `🚧` tokens ↔ §6 backed · 32/32 tests · lint 0-err.
- 10/07/2026 17:34 — **Dev-seed REMOVED (Ishay).** The 5 fictitious customers were deleted (`delete from customers` → 0 rows verified live); `customers` is empty again — the state all steps assume. Reason: Ishay deemed them unnecessary and a confusion risk for the fresh session doing 2.2/3.x/5.1. The seed file `supabase/seed_dev_customers.sql` is kept (idempotent) — re-runnable if sample data is ever wanted.
- 10/07/2026 17:00 — **Dev-seed: 5 fictitious customers** added to the shared DB (`supabase/seed_dev_customers.sql`; customer_id 7–11 — the gap from 1 is the rolled-back RLS-matrix test inserts advancing the identity sequence, which is normal/non-transactional). Covers all 4 `customer_type`s + consent/discount variety + one `inactive` (archive demo). ⚠️ **`customers` is NO LONGER empty** — step 3.x UI verifies and step 5.1 E2E must not assume a 0-row table (create-and-find still works; prefer relative/count-delta assertions). 📣 Amit: dev customers available for M3 quote-linking. **↳ הוסרו 10/07 17:34 (הכרעת-ישי) — `customers` ריקה שוב; ר' הרשומה שמעליה.**
- 10/07/2026 16:07 — **§7.64 RULED (Ishay) — customers surrogate PK.** `customer_id` changed from `text` (=ח"פ) to `bigint generated always as identity`; ח"פ moved to `company_number text unique not null`. Fixes FK-blocked-typo + dual-government-unit (two units, same ח"פ). **Deviation from frozen C6 §2.4.1** (draws ח"פ as customers PK) — logged here per iron rule 8; C6/C5 require only *uniqueness*, preserved by `company_number unique`. `quotes.customer_id` FK type→bigint (consequence; its SET NOT NULL stays M3). **Canonical principle also ruled** for the rest (external/PII→surrogate; system-owned SKU→natural+`ON UPDATE CASCADE`; users.email→accept): products.sku=M3, hostesses.id_number=M4 (own C6 deviation), users.email=M9. Migration `20260710160735_module2_customers_surrogate_key_rls_and_marketing.sql` authored (SECTION 1 surgery + SECTION 2 nod-bundle + SECTION 3 RLS/bucket); pending typed-echo apply.
- 10/07/2026 10:44 — **Semantic-review pass (llm-council + 2 adversarial critics + spec-fidelity A→B audit; Ishay-approved plan, decisions ①ב/②א/③/④א).** Content/fidelity fixes: (a) **Test Identities** block added to §2 (5 users, claims-forging, positive-control) — dissolves the RLS-matrix/UI-login gaps; (b) **customer phone → FREE-FORM** — reversed the invented `ISRAELI_PHONE_REGEX` (spec sets no customer-phone format; the 050-059 rule is the hostess screen only, C5 §5.6.17.4); (c) **cumulative gross-profit** metric restored to the card as a placeholder + 🚧 מ7 + new §7.79 (C5 §5.6.3 shows it; the draft had dropped it silently); (d) **validation UX** (green success strip / red field-error, C5 §5.6.17.4) + **exact spec strings** (ח"פ error, edit title) added to 3.2; (e) mockup-only details (two search boxes, column sort, upload replace/remove, satisfaction text-tag §7.80) re-marked **🗣️ confirm-intent** — narrated + confirmed before build, not built blindly (mockups = limited-liability). Coherence fixes: `sortCustomers` created in 2.1 (was referenced-but-uncreated); storage-42501 fallback → **comment-out** (was "keep as documentation", re-failing replay); **typed-echo** enforced at the 1.1/1.2 apply gate; step-1.3 impersonation skeleton uses `sub`+`email` with a **positive-control sanity gate**; step-3.5 verify asserts the **encoded body** + silent-truncation guard; partial-nod path added to 1.1; module-1.md **backward write-back** added to 5.3; brittle greps fixed; DoD split into audit-time vs post-merge; header timestamp → HH:MM. New §7 items 79 (gross-profit) + 80 (satisfaction tag) registered; §7.36 (upload↔DB atomicity) **anchored** (already open — not re-created).
- 07/07/2026 22:08 — Synced to the adversarial spec-audit (§7.48–60) + new doc conventions: (a) two nod-pending gates added to the Decisions Ledger and wired to step 1.1 — §7.40(א) unique constraints and §7.48 enable-RLS codification (the step-1.1 migration is their natural home once nodded); (b) §7.34 (archive-with-live-obligations) noted on step 3.4 as deliberately unguarded in M2; (c) the step-1.1 SQL block tagged as a 🔗 mirror of §7.21 per the new mirror convention (CLAUDE.md rule 13).
- 07/07/2026 16:37 — Blueprint SQL updated in lockstep with the §7.21 template: all 8 `current_user_role_id()` calls in the Step-1.1 draft migration wrapped as `(select current_user_role_id())` (Supabase `auth_rls_initplan` lint fix — behavior-identical, perf-only; retroactively applied to Module 1's `users` policies in migration `20260707163709`). The Step-1.1 verify gate (textual identity with §7.21) remains valid — both sides updated together.
- 06/07 — Frozen spec 1.6.3 mentions a "delete" button; implemented as bidirectional archive per spec 1.5.3's own "ניתן להפוך ללא פעיל" + M1 binding convention. Frozen spec untouched.
- 06/07 — "Send marketing material" implemented as `mailto:` + permanent public URL (no server-side email until Module 10; signed-URL variant explicitly rejected). Temporary, documented deviation.
- Deferred backlog (target): revenue metric wiring (M3 pricing SSOT → M8) · satisfaction stars/filter go live with feedback data (M8) · real marketing email send (M10) · §7.23 audit trail (after M12) · merge tool for historical duplicates (only if ever needed — §7.11 says none planned). *(§7.12 quote-PDF removed from backlog — ruled 07/07: no stored file.)*
- 25/07/2026 — **Dedup pass (`npm run dup` flagged a 15-line clone): `CustomersPage`'s loading/error/retry gate adopted the new shared `src/components/LoadingOrError.jsx`.** The 16:21-round "load-error retry" pattern (see §9 16:21 entry above) turned out byte-identical to M1's `UsersManagementPage` copy of the same fix — jscpd caught it. Extracted a single component (`{loading, error, onRetry, retryTestId}` props; when `onRetry` is omitted it renders the bare error paragraph — covers M1's `PermissionsMatrixPage`, which has the same loading-gate but no retry button). `CustomersPage`: `if (loading) return <LoadingOrError loading />` / `if (loadError) return <LoadingOrError error={loadError} onRetry={reloadCustomers} retryTestId="customers-load-retry" />` — same `data-testid`, behavior-identical. Cross-module edit: `UsersManagementPage` + `PermissionsMatrixPage` (M1) also migrated in the same pass — see `module-1.md` §9 25/07/2026. No state/logic change, no shared surface beyond the new `src/components/` file. Verified: `npm run dup` → 0 clones (was 1, 0.31% total dup); `npx eslint` clean on the 4 changed files (1 pre-existing unrelated `sonarjs/cognitive-complexity` warning at `CustomersPage.jsx:56`, not touched by this change); `e2e/customers.spec.js` 2/2 (+2 skipped, pre-existing) passed post-change.

- 28/07/2026 — **Module gotchas file added: `src/modules/02_customers/CLAUDE.md`** (context-architecture overhaul). A short Hebrew file that loads automatically ONLY when a session touches this module's directory — REG-IN's living code map: it sits next to the code so it cannot drift far, and costs nothing until needed. It carries only the non-obvious traps (silent-failure paths, coupled edits, deliberate deviations that look like bugs, the module's RLS surface, E2E contract strings) — never a tour of the code. המודול הזה הוא מודול-הייחוס למוסכמות (api.js נקי, לוגיקה טהורה ב-src/lib) — הקובץ מציין זאת במפורש כדי שמודול חדש יחקה אותו ולא את מודול 1. Sourced from a verified read-only review of all 45 files under `src/` (28/07). `module-close` §4c now makes writing/refreshing this file binding for every module.

- 29/07/2026 00:32 — **Open-findings session (Ishay-approved triage): dead E2E dialog handler removed + 2 of the 3 complexity hotspots cleared by moving pure logic to the SSOT.** Cross-module edits made from `ishay/module-3-quotes-build`; M2 is closed+merged, so these are expected M2 files in a future diff. **(a) `e2e/customers.spec.js:67-68`** carried `page.on('dialog', d => d.accept())` plus a comment claiming "ארכוב מפעיל window.confirm". Verified false: archiving has no confirmation at all (Ishay's 11/07 ruling — the action is reversible; `CustomersPage.jsx:201`) and `window.confirm` appears nowhere under `src/`. Both lines deleted; a replacement comment records *why no handler belongs here* — a stray one would silently accept an unintended dialog instead of letting the test fail on it. **(b) Complexity — Ishay reversed his own earlier deferral (29/07) for the two tractable spots**, keeping `MarketingPanel` (26, whole-component split) for M3 close. Both fixes are the same move, and it is the module's own convention rather than arbitrary code-shuffling: pure logic living inside components moved into `src/lib/customers.js`, where it gains unit tests (rule 14). `CustomersPage` (21 → under threshold): the 5-term `activeFilterCount` expression became `countActiveFilters(filters)`, placed beside `matchesCustomerFilters` so the badge cannot drift from the fields actually filtered. `CustomerFormDialog` (33 → under threshold): `validateField` → `validateCustomerField`, the main-field validation loop → `validateCustomerForm(form)`, and the 5-branch extra-contacts loop (§7.81, the bulk of the complexity) → `validateExtraContacts(contacts)`; `handleSubmit` keeps only the flow. **Deliberately avoided a new silent-coupling trap:** `EMPTY_FORM` was NOT moved and no separate field list was exported — `validateCustomerForm` iterates `Object.keys(form)` and relies on `validateCustomerField` returning `''` for unknown names, so behavior is byte-identical to the old `Object.keys(EMPTY_FORM)` loop while adding no list that could silently drift when a field is added. 15 new Vitest cases cover the four functions (empty contact row skipped · name without phone/email · letters in phone · `hasDiscount:false` and `minDiscount:0` both counted). **Verified:** `npm run lint` 3 warnings → **1** (`MarketingPanel` only, as ruled) · `npm run verify` green (51 Vitest tests, build ok) · `npm run test:e2e` 10 passed / 2 skipped — `customers.spec.js` edit-tier test (creates a customer through the refactored `handleSubmit`, filters, archives and restores) passed; the 2 skips are the optional `E2E_FINANCE_*`/`E2E_LOGISTICS_*` role variants, not configured and pre-existing.

- 29/07/2026 08:45 — **`MarketingPanel` split (26 → 7): the last complexity holdout cleared, which unblocked flipping `sonarjs` to `'error'` repo-wide.** Cross-module edit from `ishay/module-3-quotes-build` (M2 is closed+merged). The flagged function was the whole component, so this is a component split, not a helper extraction — but it used the module's own convention for the pure part. **(a) New `src/lib/marketing.js` (SSOT, rule 14)** with six exports, all imported by the panel so `knip` — now blocking — stays green: `disabledSendReason`, `buildMarketingMailtoHref`, `isMailtoTooLong`, `marketingPreviewKind`, `selectRecipients`, `dedupeEmails`. `MAILTO_MAX_CHARS` and `SUBJECT` moved there as **module-private** consts, deliberately not exported — that is exactly how `MARKETING_MAX_BYTES` became a knip finding. 26 new Vitest cases. **(b) Two module-level, non-exported sub-components** appended to `MarketingPanel.jsx` — `MarketingPreview` (2) and `RecipientsSection` (3), matching the existing pattern in `CustomersPage.jsx:48/589/616` and `CustomerDetailsCard.jsx:19/33`. The three-way recipients ternary became early returns; DOM is unchanged. **Measured attribution** (the initial plan mis-attributed 2 points to `marketingPreviewKind` — it removes 0; those points live in the preview JSX block): `title` chain −9, recipients block −6, preview block −3, `mailtoHref` ternary −1 = −19. **Neither sub-component is optional** — dropping either lands at 10 or 13, still over. **(c) `MARKETING_MAX_BYTES` is now the single source for the "עד 10MB" label** (`MARKETING_MAX_BYTES / 1024 / 1024`), closing both the knip export finding and the two-places-to-edit trap. **Verified:** `npx eslint --rule cognitive-complexity:0` reports component **7**, subcomponents 3 and 2 · `npm run gate` **green end-to-end** · `npm run test:e2e` 10 passed / 2 skipped (same pre-existing optional-role skips) · **five before/after screenshots of the real app came out byte-identical** (sha256 match on all five: no-file · file+all-recipients · file+zero-selected · mailto-too-long · real-data-no-consented) — Ishay required paired before/after, since an "after" shot alone proves the screen looks reasonable, not that it is unchanged. The four disabled-send `title` strings were additionally asserted through the live DOM, because a `title` attribute is invisible in a screenshot — the strings were extracted from `git show HEAD:` rather than retyped, and the U+2014 em dash survives. **Still uncovered:** the panel has no unit or E2E test of its own (`marketing-flow E2E → M10`, already registered above); the screenshots were the only regression evidence and were taken with a throwaway spec that was deleted afterwards.

- **`19/08/2026 13:5X` — CROSS-MODULE EDIT by module 6 (step 3.8, session D; module 2 is closed and this entry is the required ripple record).** Module 6's surface 8 lives on this module's customer page. What changed, all additive/bounded: **①** `CustomerDetailsPage.jsx` — the projects tab is REAL now (two sections `מתקרבים`/`התקיימו`, two new StatTiles); the `אין פרויקטים עדיין — יתמלא במודול 6` placeholder and the stale `:440-441` "deny-all until module 6" comment are GONE (false since `20260809134237`). **②** `api.js` — `getCustomerProjects` re-shaped per A12: direct `projects.customer_id` filter, LEFT quote join (was `!inner` — a quote-less project vanished silently), explicit columns; + two new reads (`listProjectsForCustomerMetrics`, `getCustomerScreenParams`). **③ E3 (Ishay 14/08): the label `סה"כ הכנסות` renamed to `סה"כ הצעות מאושרות` in BOTH render sites** (the card tile here + the list column in `CustomersPage.jsx`); the computation in `src/lib/customers.js` unchanged. **④** `matchesCustomerFilters` gained the `רדומים` clause (threshold from `params` `סף_לקוח_רדום_ימים`, ruled 120). **⑤** This module's `CLAUDE.md` corrected (A13 — the "always returns `[]`" claim). **⑥** `e2e/customer-page.spec.js:51` label expectation updated. New pure logic lives in `src/lib/customerProjects.js` (module-6-owned). M2's own tests: green unchanged (suite 1265). Full detail: `module-6.md` step 3.8 + §10.
