# REG-IN — Micro-Guide | Module 2: Customers (לקוחות)

> **Audience:** a future Claude Code session with zero memory. Humans (Ishay/Amit) only paste prompts, answer decision questions, and approve at phase boundaries.
> **Language rule:** guide in English; Hebrew appears only as data (DB values like 'לקוחות', UI strings). All chat reports to Ishay/Amit — always in Hebrew.
> **Model rule (CLAUDE.md):** Opus for thinking steps (Phase 1 RLS, security, closing audit) · Sonnet for generation steps (Phase 3 UI, forms).
> **Iron rule 3 (stated once):** every business rule in code gets a Hebrew why-first comment.

---

## 1. 🟢 Live Status Header

| Field | Value |
|---|---|
| Module | 2 — Customers (לקוחות) |
| Owner | **ישי (started 10/07)** · Amit (may continue — writer-handover on THIS branch, not a parallel branch) |
| Branch | `ishay/module-2-customers` (created from fresh `dev` 10/07/2026, after PR #5 merged — step 0.1 ✅) |
| **Status** | **🔨 In progress — Phase 1 (DB & RLS); 0.1–1.2 ✅. Migration 1.1 APPLIED + live-verified (10/07 16:32; §7.64 surrogate + nod-bundle + RLS/bucket). Active: step 1.3 (14-scenario RLS matrix).** |
| Last updated | 10/07/2026 16:35 (migration 1.1 APPLIED via MCP + live-verified + `schema.sql` snapshot; §7.64 surrogate PK live. moddatetime-in-public WARN accepted. Prior history — see §9) |
| **Active step** | **1.3 — Run the deferred 14-scenario RLS matrix (1.1 migration applied+verified, 1.2 snapshot+commit done). §7.63 deferred M6/M8.** |

| Phase / step | Status |
|---|---|
| 0.1 Preconditions: M1 merged + branch created | ✅ done (M1 in dev `3ba5c5f`; branch `ishay/module-2-customers`; `.env.local` present) |
| Phase 1 — DB & RLS (1.1–1.4) | 🔨 in progress (1.1 ✅ applied+verified · 1.2 ✅ snapshot+commit · 1.3 RLS matrix next · 1.4 phase-close) |
| Phase 2 — Business logic (2.1–2.2) | ⬜ pending |
| Phase 3 — UI (3.1–3.6) | ⬜ pending |
| Phase 4 — Control & integration (4.1–4.2) | ⬜ pending |
| Phase 5 — QA & handoff (5.1–5.4) | ⬜ pending |

## 2. 📦 Context Packet for Claude

**Purpose (≤3 lines):** Central B2B customer registry (CRM): add/edit/archive customers (active/inactive, never delete), filter/search, controlled marketing distribution (`marketing_consent` only). Spec screen 5.6.3. **First RLS policies on a business table in the project — this is the binding precedent (§7.21 template) for every later module.**

**Capabilities delivered vs deferred (cross-module contract):**

| Capability | M2 delivers | Completed by | Tracked in |
|---|---|---|---|
| Add/edit/archive customer, forgiving search, filters, permission gates | ✅ full | — | — |
| Marketing upload + `mailto:` send to consented | ✅ full (interim send model) | M10: real server-side email + tracking | PROJECT_MASTER §6 |
| Customer card — details | ✅ full | — | — |
| Customer card — project history | 🚧 מ6 · frame + empty state | M6 (projects data + policies) | PROJECT_MASTER §6 |
| Customer card — totalRevenue + avgFeedback metrics | 🚧 מ3 · 🚧 מ8 · placeholder ("אין נתונים עדיין") | M3 (pricing SSOT) + M8 (feedback) | PROJECT_MASTER §6 |
| Customer card — cumulative gross-profit metric (C6 §2.4.1 derived attr; distinct from the M7 monthly-KPI §7-item) | 🚧 מ7 · placeholder ("אין נתונים עדיין") | M7 (profitability calc) | PROJECT_MASTER §6 |
| Satisfaction stars in list + satisfaction filter | 🚧 מ8 · present-but-inert | M8 | PROJECT_MASTER §6 |

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

**Files to create:** `src/modules/02_customers/` → `api.js` (ALL Supabase queries of this module — iron rule 14), `CustomersPage.jsx`, `CustomerFormDialog.jsx`, `CustomerDetailsCard.jsx`, `CustomersFilterSheet.jsx`, `MarketingPanel.jsx` · `src/lib/customers.js` + `src/lib/customers.test.js` · `e2e/customers.spec.js` · one migration (step 1.1).

**DB:** table `customers` (docs/schema.sql:41-51): `customer_id` **bigint surrogate PK (§7.64, 10/07)** + `company_number` text unique not null (=ח"פ; renamed from the old text PK), `customer_type` check in (`private_company`,`government`,`production_company`,`nonprofit`), `company_name`, `contact_name`, `phone`, `email` (all not null), `discount_percent` numeric default 0, `marketing_consent` bool default false, `status` check (`active`,`inactive`) default `active`. **Current RLS state: enabled live with ZERO policies (deliberate deny-all; live-verified 06/07 per module-1.md §2) — NOT yet codified in any migration; step 1.1 codifies it.** Relevant existing migrations: `20260629000000_baseline_schema.sql:43` (created `customers`) · `20260702195258_harden_current_user_role_id.sql` (hardened `current_user_role_id()` — docs/schema.sql:190-196 — the helper EVERY new policy calls). Related FK: `quotes.customer_id → customers` (schema.sql:86, on delete restrict; **type→bigint in 1.1 per §7.64**) — Module 3 depends on this table. `projects`/`quotes` are ALSO deny-all until M3/M6 → customer-card history queries legitimately return empty.

**Dependencies:** Module 1 auth infra (AuthContext, ProtectedRoute, matrix seed: roles=5/modules=9/permissions=45). Permission row for this module: `module_name='לקוחות'`; seed per PROJECT_MASTER §3 — מנכ"ל=edit, מנהלת פרויקטים=edit, מנהלת כספים ולקוחות=edit, מנהלת גיוס ושיבוץ=blocked, מנהלת לוגיסטיקה=blocked (no seeded `view` — hence view-tier scenarios 13–14).

**🔑 Test Identities (load-bearing — resolve ONCE here, reuse in steps 1.3 / 3.1 / 4.1 / 5.1):**
- **The 5 seeded test users (one per role).** Resolve the live `role → email → user_id` mapping from the seed — do NOT hard-code: `select u.user_id, u.email, r.role_name from users u join roles r on u.role_id = r.role_id order by r.role_name;` (MCP `execute_sql`, read-only).
- **Impersonation for RLS scenarios (step 1.3 — SQL, no password):** `select set_config('request.jwt.claims', json_build_object('sub', '<user_id-uuid>', 'email', '<email>', 'role', 'authenticated')::text, true); set local role authenticated;`. `current_user_role_id()` resolves the caller via `auth.uid()`←`sub` (and `auth.email()`←`email`) — **BOTH keys must be present or every RLS query silently returns 0 rows** (a broken-impersonation deny-all is indistinguishable from a working RLS deny-all).
- **Positive control (MANDATORY in step 1.3):** מנכ"ל (edit on every module) MUST return ≥1 row on the SELECT scenario — if it returns 0, the impersonation is broken, NOT the policy. Negative control: מנהלת לוגיסטיקה (blocked) returns 0. Both are already scenarios in step 1.3's table; treat CEO=1-row as the impersonation sanity gate before trusting any deny result.
- **UI login (steps 3.1 / 4.1 / 5.1 — needs a password):** creds live in `.env.local` as `E2E_<ROLE>_EMAIL` / `E2E_<ROLE>_PASSWORD`. ⚠️ Only `E2E_FINANCE_*` + `E2E_LOGISTICS_*` are provisioned (added at step 5.1, 👤). CEO / project-manager / recruiter UI-login (needed earlier by 3.1/4.1) is NOT provisioned by default — at the 4.1 👤 gate either reuse a same-tier provisioned role or have Ishay/Amit add the missing `E2E_*`; do NOT assume they exist.

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
| **OPEN — deferred (surfaces at step 3.2)** | §7.65 (08/07 audit) — `customers.email` uniqueness unruled (spec silent; shared contact across two companies may be legitimate). M2 ships without UNIQUE; a later nod adds it via migration | — | — | Step 3.2 note |
| **OPEN — deferred (surfaces at step 3.4)** | §7.34 — archiving a customer with live obligations (active quotes/projects) is unruled; M2 ships the plain status toggle with NO guard. When M3 exists this becomes real — flag at the 3.4 build if Ishay wants a warning/block behavior earlier | — | — | Step 3.4 note |
| **OPEN — deferred** | Customer-card metric wiring: totalRevenue ← M3 pricing SSOT (`src/lib/pricing.js`), avgFeedback ← `projects.feedback_score` (M8 data). Critical at M3/M8 | — | — | (placeholders only in M2) |
| **OPEN — deferred** | §7.23 audit trail — customer edits are last-write-wins by design; revisit after M12 | — | — | — |
| **OPEN — anchored (surfaces at step 3.5)** | §7.36 (already open in PROJECT_MASTER — NOT re-created) — upload↔DB atomicity: the marketing upload is the FIRST place a Storage-write + DB-write can half-fail (orphan file). Canonical order Storage→DB + orphan-cleanup on partial failure; anchored here per the spec tying it to M2 ("first arises here") | — | — | Step 3.5 note |
| **OPEN — deferred (placeholder in step 3.6)** | §7.79 (new 10/07 fidelity audit) — per-customer cumulative gross-profit definition (population/formula): C6 §2.4.1 lists it as a derived customer attr and C5 §5.6.3 shows it, but no formula. M2 ships a placeholder ("אין נתונים עדיין"); M7 wires it (profitability, with §7.78) | — | — | Step 3.6 (placeholder) |
| **OPEN — deferred (mockup-sourced, surfaces at step 3.1)** | §7.80 (new 10/07 fidelity audit) — satisfaction numeric→text-tag ("מצוין") thresholds: mockup-only, spec-silent. M2 shows inert stars + "אין נתונים עדיין" and does NOT build the tag (confirm-intent — mockup detail with no spec source); M8 sets thresholds | — | — | Step 3.1 note |
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
**🔻👤 gate — MANDATORY (typed-echo, DB protocol): shared Supabase project.** Ishay/Amit reviews the SQL text AND **types the migration name** (not "yes"/"approve") as the irreversible-apply confirmation — this is one of the two typed-echo gates in the project (CLAUDE.md DB protocol). That typed-echo IS the apply authorization consumed at step 1.2; a plain approval here is NOT sufficient to apply.

#### Step 1.2 — Apply migration + snapshot 🔻🤖
**Goal:** policies live in the shared project; snapshot + migration committed together (DB protocol).
**Files:** `docs/schema.sql` (update), the step-1.1 migration (commit).
**What:** (a) pre-check: `select count(*) from customers;` **and `select count(*) from quotes;`** (MCP execute_sql) → **both** must be `0` (the §7.64 surrogate surgery + `quotes.customer_id` type-change require empty tables); if non-zero — STOP, consult Ishay (fallback: add constraints as `not valid` + `validate constraint` after cleanup). (b) Apply via Supabase CLI (`supabase db push`) or MCP `apply_migration` (authorized by the **typed-echo** from the 1.1 gate — a plain 1.1 approval is not enough). (c) Update `docs/schema.sql` by appending the new DDL into the documented snapshot in its existing comment style (it is a curated, commented snapshot — do NOT overwrite it with a raw dump; Studio "Generate schema SQL" is the manual alternative). Note: `storage.*` objects won't appear in the public-schema snapshot — add them as a commented block; their source of truth is the migration file + CHANGELOG DB line. (d) Commit **migration + snapshot together**: `git commit -m "db: מודול 2 — RLS ללקוחות לפי תבנית §7.21 + bucket שיווק + עדכון schema snapshot"`.
**Verify 🤖:** `select policyname from pg_policies where tablename='customers';` → exactly `customers_select_by_permission`, `customers_write_by_permission` · `select policyname from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'marketing_%';` → exactly the 4 names from 1.1 · `select count(*) from storage.buckets where id='marketing';` → 1 · **PK check → `customer_id / bigint`; `company_number` unique+not-null+9-digit check present; FK `quotes_customer_id_fkey` on bigint** · `git show --stat HEAD` lists both the migration and `docs/schema.sql`.

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
| 1 | `select * from customers` | מנכ"ל | returns the row from #4 | ☐ |
| 2 | `select * from customers` | מנהלת לוגיסטיקה (blocked) | 0 rows | ☐ |
| 3 | `insert into customers(...)` | מנהלת לוגיסטיקה (blocked) | RLS violation error | ☐ |
| 4 | `insert into customers(...)` | מנכ"ל | succeeds | ☐ |
| 5 | `select * from roles; select * from modules;` | every role | rows for all | ☐ |
| 6 | `update permissions set ...` | non-CEO | 0 rows updated | ☐ |
| 7 | same update | מנכ"ל | succeeds (inside rollback!) | ☐ |
| 8 | `select * from users where email = auth.email()` | any role | exactly own row | ☐ |
| 9 | `select * from users` | non-CEO | own row only | ☐ |
| 10 | `select * from users` | מנכ"ל | all users incl. inactive | ☐ |
| 11 | Login attempt in the app | inactive user | blocked at LoginPage with red error (UI check) | ☐ |
| 12 | Users management screen | מנכ"ל | inactive users shown **dimmed** (per M1 as-built ruling — supersedes the old table's "filtered out" wording) | ☐ |
| 13 | grant `view` on 'לקוחות' (in txn) → `select * from customers` | granted role | rows returned | ☐ |
| 14 | same grant → `insert into customers(...)` | granted role | RLS violation (write needs `edit`) | ☐ |

**Verify 🤖:** every row's "As-run evidence" filled with the actual output — then report the table in Hebrew.

#### Step 1.4 — Phase 1 closure 🔻👤
**Goal:** human sign-off on the security foundation before code is built on it.
**Files:** this guide (status header + step table updated first — protocol section 8).
**What:** show Ishay/Amit the filled 14-row table + both pg_policies outputs.
**🔻👤 end-of-phase gate.**

### Phase 2 — Business Logic (iron rule 14: SSOT in `src/lib/`, queries in `api.js`, UI only imports)

> Placement note (stated reason, per template): guide amit/06 §⑤ lists "מיפוי enum" under Phase 1 — the DB side needs no work (the 4 enum values already exist as a CHECK, docs/schema.sql:43), so the mapping is deliberately implemented as code-side data here in Phase 2.

#### Step 2.1 — Pure logic + validators + unit tests 🔻🤖
**Goal:** every business rule of the module exists exactly once, unit-tested, before any UI.
**Files:** `src/lib/customers.js` (new), `src/lib/customers.test.js` (new), `src/lib/validators.js` + `src/lib/validators.test.js` (extend).
**What:** `CUSTOMER_TYPE_LABELS` (§7.3 ruling — the 4 spec labels keyed by enum) · `matchesCustomerFilters(customer, filters)` (type/consent/min-discount + free-text that matches company_name alone, contact_name alone, or a ח"פ **prefix** — the §7.11 forgiving-search ruling; written here so M3's quote-flow customer picker reuses it) · `sortCustomers(customers, key, dir)` (client-side sort by company_name/customer_type/discount_percent/status — consumed by step 3.3's column-header sort; unit-tested here so the UI never re-implements the comparator) · `deriveCustomerMetrics(projects)` → `{totalRevenue: null, grossProfit: null, avgFeedback: number|null}` (feedback avg from `projects.feedback_score` when data exists; **totalRevenue AND grossProfit return null** with a comment — totalRevenue → M3 pricing SSOT, grossProfit → M7 profitability (§7.79); NO revenue/profit formula here) · validators: `COMPANY_ID_REGEX = /^[0-9]{9}$/` + a discount 0–100 helper. ⚠️ **Customer phone = FREE-FORM — do NOT add/apply `ISRAELI_PHONE_REGEX` for customers** (spec sets no format; non-empty check only — decision-Ishay 10/07, §2 validators note).
**Verify 🤖:** `npm run test:run` → all green (existing 16 + new).

#### Step 2.2 — Module API layer 🔻🤖
**Goal:** all Supabase access of the module concentrated in one file (iron rule 14).
**Files:** `src/modules/02_customers/api.js` (new).
**What:** `listCustomers()`, `getCustomer(id)`, `createCustomer(c)`, `updateCustomer(id, patch)` (never changes `company_number`/ח"פ in M2; the surrogate `customer_id` PK is immutable by definition), `setCustomerStatus(id, status)`, `getCustomerProjects(id)` (via `quotes`→`projects`; legitimately empty until M3/M6), `uploadMarketingFile(file)` (bucket `marketing`; validates PDF/JPG/PNG ≤10MB per mockup), `getMarketingPublicUrl(path)` (permanent public URL — bucket ruling), `getConsentedCustomerEmails()` (`marketing_consent=true and status='active'`).
**Verify 🤖:** `npm run lint` → 0 errors; `grep -rnE "from\(['\"\`]customers['\"\`]\)" src/ --include=*.jsx --include=*.js` (covers single/double-quote + backtick — a naive single-quote-only grep passes while a double-quoted `from("customers")` hides) → matches ONLY inside `src/modules/02_customers/api.js`.
**🔻👤 end-of-phase gate.**

### Phase 3 — UI (design language PROJECT_MASTER §4 — binding; mockups = visual reference only; RTL)

#### Step 3.1 — CustomersPage (list) + route swap 🔻🤖
**Goal:** the module's main screen renders live data for permitted roles.
**Files:** `src/modules/02_customers/CustomersPage.jsx` (new); `src/App.jsx` (replace `UnderConstruction` in the customers route only).
**What:** table per mockup 01: שם לקוח · ח"פ · סוג לקוח (label via `CUSTOMER_TYPE_LABELS`) · איש קשר · טלפון · אימייל · % הנחה · תוכן שיווקי (toggle, edit-mode only) · שביעות רצון (stars; "אין נתונים עדיין" until M8) · פעולות. Empty state for zero customers. Edit-vs-view rendering per section 4. `data-testid` on rows/actions (M1 convention, e.g. `customer-row-{id}`).
> 🗣️ **confirm-intent (mockup-sourced — mockups are limited-liability, CLAUDE.md):** before building, narrate what + which files, and confirm with Ishay/Amit any list detail whose ONLY source is mockup 01 (not C5/C6): the **two search boxes** (global + in-list), the satisfaction **text-tag "מצוין"** beside the stars (§7.80 — NOT built in M2; inert stars + "אין נתונים עדיין" only), and column details. Do not silently reproduce the mockup — it may not be what was intended.
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
> 🗣️ **confirm-intent (mockups are limited-liability):** **column-sorting** and the **two-search-box** layout are NOT required by C5 for this screen (mockup/ergonomics only). Before building, narrate what + which files and confirm with Ishay/Amit — they may not be wanted as drawn. If kept, use the §2.1 `sortCustomers` helper (do not re-implement in the component).
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
> 🗣️ **confirm-intent (mockups 02/03 — limited-liability):** the "החלף קובץ" / remove-(X) controls and drag-drop are mockup-only — narrate + confirm before building.
**Verify 🤖:** preview — upload a small PDF, then `select count(*) from storage.objects where bucket_id='marketing';` → ≥1; assert the rendered send-button `href` starts with `mailto:` AND that its `body` param, when `decodeURIComponent`'d, equals the exact public URL (assert the ENCODED body, not only bcc — a raw `&` in the body passes a bcc-only check while the body is silently truncated); bcc list equals exactly the consented+active customer emails.

#### Step 3.6 — Customer card 🔻🤖
**Goal:** spec 1.6.3's "כרטיס לקוח" with the ruled empty-state scope.
**Files:** `src/modules/02_customers/CustomerDetailsCard.jsx` (new).
**What:** row click → card: full details + project history (via `getCustomerProjects` — empty state "אין פרויקטים עדיין") + metrics (סה"כ הכנסות / **רווח גולמי מצטבר** / ממוצע משוב — all three "אין נתונים עדיין" placeholders via `deriveCustomerMetrics`). **Gross-profit (§7.79):** C5 §5.6.3 shows a cumulative gross-profit figure on the card — render it as a placeholder now (formula + population are open, wired in M7); do NOT drop it silently as the pre-10/07 draft did.
**Verify 🤖:** preview — card opens showing details + all three metric empty states (revenue, gross-profit, feedback).
**🔻👤 end-of-phase gate: visual pass vs design language §4 (colors/layout untouched without approval — iron rule 8).**

### Phase 4 — Control & Integration

#### Step 4.1 — Permission matrix walk 🔻🤖
**Goal:** prove the module obeys the live matrix end-to-end (UI layer over the RLS already proven in 1.3).
**Files:** none (verification step).
**What:** login as each of the 5 test users: מנכ"ל/מנהלת פרויקטים/מנהלת כספים ולקוחות → full edit works; מנהלת גיוס/מנהלת לוגיסטיקה → 'לקוחות' absent from Sidebar AND direct `/customers` blocked by ProtectedRoute.
**Verify 🤖:** preview snapshot per role (5 pieces of evidence: 3 showing the working screen, 2 showing block/redirect).

#### Step 4.2 — Regression (iron rule 9: security-model regression at module close) 🔻🤖
**Goal:** prove Module 1's guarantees survived Module 2.
**Files:** none (verification step).
**What:** `npm run test:run` (all unit) + `npm run test:e2e` (M1's 8 must stay green) + re-run RLS scenarios 6 and 9 (core tables untouched by this module — prove it).
**Verify 🤖:** all suites green (paste counts); scenarios 6/9 outputs match step 1.3's.
**🔻👤 end-of-phase gate.**

### Phase 5 — QA & Handoff

#### Step 5.1 — Module E2E 🔻🤖 (creds sub-step 👤)
**Goal:** guide ⑦ acceptance automated.
**Files:** `e2e/customers.spec.js` (new); `.env.local` (creds — human).
**What:** Playwright specs mirroring guide ⑦: finance-role creates customer & sees it · logistics-role has no customers module (sidebar + direct URL) · filter works · archive is reversible. Needs `E2E_FINANCE_*` / `E2E_LOGISTICS_*` creds — **👤 Ishay/Amit adds them to `.env.local` (secrets gate; never committed)**; specs must `test.skip` gracefully when absent (existing convention, e2e/permissions.spec.js:20).
**Verify 🤖:** `npm run test:e2e` → 8 old + new all pass (paste the total).

#### Step 5.2 — Full gate 🔻🤖
**Goal:** repo-wide quality gate green before docs/PR.
**Files:** none (verification step).
**Verify 🤖:** `npm run verify` → lint 0 errors, format clean, all tests pass, build succeeds.

#### Step 5.3 — Docs persistence 🔻🤖
**Goal:** end-of-session protocol satisfied (Stop hook will enforce anyway) + cross-module debts registered where future modules will find them.
**Files:** this guide (sections 1/6/9 finalized) → **`docs/micro_guides/module-1.md`** (backward write-back — see below) → `docs/PROJECT_MASTER.md` §6 → `docs/CHANGELOG.md` → `docs/CLAUDE_CODE_LOG.md` → `STATUS.md` (that order, per CLAUDE.md).
**What:** verify every 🚧 row of section 2's capabilities table has its byte-matching `🚧 מN` line in PROJECT_MASTER §6 (add/refresh any missing — the Stop hook blocks otherwise); **backward write-back (B8):** step 1.3 closed Module 1's deferred RLS gate (module-1.md step 5.2b) — mark that gate ✅ in `module-1.md` with a pointer to M2's 14-row matrix, since the forward-only 🚧 מN mechanism does NOT cover a debt repaid backward; CHANGELOG gets a DB line (policies+constraints+bucket, incl. the bucket-INSERT seed-exception note) + a code line; CLAUDE_CODE_LOG "מצב נוכחי" rewritten + dated session entry; STATUS module-2 row updated.
**Verify 🤖:** `grep -n "מודול 2" docs/PROJECT_MASTER.md` → §6 shows the deferred-completion lines; `bash .claude/hooks/check-docs-updated.sh` → exit 0; `git status --short` shows only the intended doc files as modified.

#### Step 5.4 — Closing audit + PR 🔻👤
**Goal:** formal module closure (final DoD sign-off gate).
**Files:** none here — the closing template drives its own persistence.
**What:** run `docs/templates/create_module_final_test_template.md` (the closing prompt in amit/06 ⑥) → DoD sign-off → PR base:`dev` ← compare:`amit/module-2-customers`.
**🔻👤 final gate.**

## 6. 📊 QA Matrix

| Test type | Planned | As-run (closing audit fills) |
|---|---|---|
| Unit | `customers.js` (labels, filters, `sortCustomers`, metrics incl. gross-profit null), validators (ח"פ 9-digit / discount 0–100; phone is free-form — no format assertion) — Vitest | |
| Integration | 14-scenario RLS matrix (SQL, live), storage-policy probe (blocked role upload → fails), duplicate-ח"פ round-trip | |
| E2E | `e2e/customers.spec.js` (acceptance ⑦) + M1 8 specs regression — Playwright, Chromium, workers=1 | |
| Regression | M1 unit+E2E suites green after every phase; core-RLS spot checks (scenarios 6/9) | |
| UAT | Amit manual pass vs guide ⑦ checklist; formal UAT stays Module 12 / milestone M5 "הגשה" (PROJECT_MASTER §6) | |
| Security/Pen | impersonation matrix incl. view-tier (13–14), direct-URL, blocked-role sidebar, storage write as blocked role | |
| Performance | N/A (tiny data; revisit ~M3) | |
| Usability | RTL pass on all 6 new components, empty states, Hebrew errors | |
| Compatibility | Chromium only (as M1); cross-browser before M5 | |

## 7. ✅ Definition of Done (instantiates docs/architecture_and_qa_roadmap.md)

- [ ] Migration applied to the shared project; `pg_policies` shows exactly the 2 `customers` policies and exactly the 4 `marketing_*` storage policies; `docs/schema.sql` snapshot updated and committed **together** with the migration.
- [ ] **§7.64 surrogate PK live:** `customers.customer_id` = `bigint` identity PK; `company_number` (ח"פ) is `unique not null` + 9-digit check; `quotes.customer_id` FK is `bigint`; the **deviation from frozen C6 §2.4.1** is logged in §9.
- [ ] All 14 RLS scenarios pass with pasted evidence (closes M1's deferred gate 5.2b).
- [ ] `customer_type` UI shows the 4 frozen-spec labels (§7.3); duplicate ח"פ produces the §7.11 friendly flow (edit-link for active, restore-offer for archived); search finds a customer by contact name alone / company name alone / ח"פ prefix; ח"פ (`company_number`) immutable in edit by M2 choice (surrogate PK makes future correction schema-safe).
- [ ] Archive is bidirectional, dimmed, delete-free (M1 binding pattern).
- [ ] Marketing: upload lands in the public `marketing` bucket; send = `mailto:` (encodeURIComponent'd) with BCC of consented+active only; clipboard fallbacks present.
- [ ] Customer card renders with all three metric empty states (revenue / gross-profit §7.79 / feedback); no pricing/profit formula anywhere in module-2 code (`grep -rn -e '0.18' -e 'vat' -e 'מע"מ' src/modules/02_customers src/lib/customers.js` → 0 business-formula hits; single-quoted `-e` args so the Hebrew `"` does not break the shell).
- [ ] Customer phone is free-form (no `ISRAELI_PHONE_REGEX` applied to customers — decision-Ishay 10/07); ח"פ shows the exact spec error string; edit-dialog title = "עריכת לקוח: [name]"; save shows the green success strip / red field-error per C5 §5.6.17.4.
- [ ] Edit-vs-view rendering: `view` grant ⇒ read-only screen (verified via scenario 13 + UI probe with a temporary matrix change, reverted).
- [ ] Guide ⑦ acceptance: finance creates+sees customer · logistics fully blocked · filter works · archive reversible · `npm run verify` green.
- [ ] `npm run test:run` + `npm run test:e2e` green (old + new).
- [ ] No secrets in code/docs (CI gitleaks green); `.env.local` untouched by git.
- [ ] CHANGELOG + CLAUDE_CODE_LOG + STATUS current; this guide's header/table/deviations current.

**Post-merge (verified AFTER the closing audit — NOT audit-time checkboxes, since the audit must not merge; not Section-6 blockers):** PR to `dev` opened · CI green · merged. The closing audit confirms the module is *mergeable* (green verify + no blocker); the actual PR/CI/merge happen after, by Ishay/Amit.

## 8. 🔄 Self-Update Protocol (verbatim rules)

1. At every step transition, update section 1 (status header + step table) **in the same session, before moving on**.
2. Any deviation from plan → inline "↳ as-built" note on the step + a dated line in section 9.
3. The repo's Stop hook (`.claude/hooks/check-docs-updated.sh`) blocks session end if code under `src/modules/02_*/` changed but this guide didn't — keep this file current as you work, not as an afterthought.
4. The `CLAUDE.md` end-of-session protocol applies on top (CHANGELOG → CLAUDE_CODE_LOG → STATUS).
5. **On ENTERING a phase (template §8(h)):** sweep the Decisions Ledger for OPEN/nod-pending items anchored to this phase's steps and present them to Ishay for a consolidated ruling BEFORE the phase's first step — e.g. entering Phase 1, present the §7.40(א)/§7.48/§7.62/§7.73 nod bundle + the §7.63 direction; entering Phase 3, surface the §7.36/§7.79/§7.80 + confirm-intent (mockup) items. Deferred questions get settled at the phase door, not mid-step.
6. **(e)–(g) per CLAUDE.md iron rules 13/15/16 + end-of-session protocol** (new-open-question → stop+§7 · migration/DB-gap → db_roadmap same session · other-developer change → 📣) — these apply automatically; not restated here (F1).

## 9. 📝 Deviations & Tech-Debt Log

- 10/07/2026 16:07 — **§7.64 RULED (Ishay) — customers surrogate PK.** `customer_id` changed from `text` (=ח"פ) to `bigint generated always as identity`; ח"פ moved to `company_number text unique not null`. Fixes FK-blocked-typo + dual-government-unit (two units, same ח"פ). **Deviation from frozen C6 §2.4.1** (draws ח"פ as customers PK) — logged here per iron rule 8; C6/C5 require only *uniqueness*, preserved by `company_number unique`. `quotes.customer_id` FK type→bigint (consequence; its SET NOT NULL stays M3). **Canonical principle also ruled** for the rest (external/PII→surrogate; system-owned SKU→natural+`ON UPDATE CASCADE`; users.email→accept): products.sku=M3, hostesses.id_number=M4 (own C6 deviation), users.email=M9. Migration `20260710160735_module2_customers_surrogate_key_rls_and_marketing.sql` authored (SECTION 1 surgery + SECTION 2 nod-bundle + SECTION 3 RLS/bucket); pending typed-echo apply.
- 10/07/2026 10:44 — **Semantic-review pass (llm-council + 2 adversarial critics + spec-fidelity A→B audit; Ishay-approved plan, decisions ①ב/②א/③/④א).** Content/fidelity fixes: (a) **Test Identities** block added to §2 (5 users, claims-forging, positive-control) — dissolves the RLS-matrix/UI-login gaps; (b) **customer phone → FREE-FORM** — reversed the invented `ISRAELI_PHONE_REGEX` (spec sets no customer-phone format; the 050-059 rule is the hostess screen only, C5 §5.6.17.4); (c) **cumulative gross-profit** metric restored to the card as a placeholder + 🚧 מ7 + new §7.79 (C5 §5.6.3 shows it; the draft had dropped it silently); (d) **validation UX** (green success strip / red field-error, C5 §5.6.17.4) + **exact spec strings** (ח"פ error, edit title) added to 3.2; (e) mockup-only details (two search boxes, column sort, upload replace/remove, satisfaction text-tag §7.80) re-marked **🗣️ confirm-intent** — narrated + confirmed before build, not built blindly (mockups = limited-liability). Coherence fixes: `sortCustomers` created in 2.1 (was referenced-but-uncreated); storage-42501 fallback → **comment-out** (was "keep as documentation", re-failing replay); **typed-echo** enforced at the 1.1/1.2 apply gate; step-1.3 impersonation skeleton uses `sub`+`email` with a **positive-control sanity gate**; step-3.5 verify asserts the **encoded body** + silent-truncation guard; partial-nod path added to 1.1; module-1.md **backward write-back** added to 5.3; brittle greps fixed; DoD split into audit-time vs post-merge; header timestamp → HH:MM. New §7 items 79 (gross-profit) + 80 (satisfaction tag) registered; §7.36 (upload↔DB atomicity) **anchored** (already open — not re-created).
- 07/07/2026 22:08 — Synced to the adversarial spec-audit (§7.48–60) + new doc conventions: (a) two nod-pending gates added to the Decisions Ledger and wired to step 1.1 — §7.40(א) unique constraints and §7.48 enable-RLS codification (the step-1.1 migration is their natural home once nodded); (b) §7.34 (archive-with-live-obligations) noted on step 3.4 as deliberately unguarded in M2; (c) the step-1.1 SQL block tagged as a 🔗 mirror of §7.21 per the new mirror convention (CLAUDE.md rule 13).
- 07/07/2026 16:37 — Blueprint SQL updated in lockstep with the §7.21 template: all 8 `current_user_role_id()` calls in the Step-1.1 draft migration wrapped as `(select current_user_role_id())` (Supabase `auth_rls_initplan` lint fix — behavior-identical, perf-only; retroactively applied to Module 1's `users` policies in migration `20260707163709`). The Step-1.1 verify gate (textual identity with §7.21) remains valid — both sides updated together.
- 06/07 — Frozen spec 1.6.3 mentions a "delete" button; implemented as bidirectional archive per spec 1.5.3's own "ניתן להפוך ללא פעיל" + M1 binding convention. Frozen spec untouched.
- 06/07 — "Send marketing material" implemented as `mailto:` + permanent public URL (no server-side email until Module 10; signed-URL variant explicitly rejected). Temporary, documented deviation.
- Deferred backlog (target): revenue metric wiring (M3 pricing SSOT → M8) · satisfaction stars/filter go live with feedback data (M8) · real marketing email send (M10) · §7.23 audit trail (after M12) · merge tool for historical duplicates (only if ever needed — §7.11 says none planned). *(§7.12 quote-PDF removed from backlog — ruled 07/07: no stored file.)*
