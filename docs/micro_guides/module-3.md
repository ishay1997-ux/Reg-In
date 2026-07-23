# Module 3 — הצעות מחיר (Quotes) · Micro-Guide

> Machine-first build blueprint. Primary reader: a future Claude Code session with zero memory. Hebrew appears only as data (DB values, UI strings). Chat reports to Ishay are always in Hebrew. Hierarchy of truth: `docs/schema.sql` ➔ approved spec (C5/C6 via PROJECT_MASTER) ➔ mockups ➔ this guide.
> Approved by Ishay 15/07/2026 (blueprint session; fresh-context reviewer passed READY-WITH-FIXES, all 12 findings applied; 4 residual questions ruled in-session).

### 1. 🟢 Live Status Header

| Field | Value |
|---|---|
| Module | 3 — הצעות מחיר (Quotes) |
| Owner | ישי (sole developer — all rulings and build; guide `modules/module_03_quotes.md` §③) |
| Branch | `ishay/module-3-quotes-build` (cut 22/07 from dev `a35c92f`, after PR #9 merged; the old `ishay/module-3-quotes` is now an ancestor of `dev` — dead, iron rule 10) |
| Status | 📘 Blueprint approved — build not started |
| Last updated | 22/07/2026 21:00 |
| **Active step** | **1.0** |

Step table (⬜ pending · 🔨 in progress · ✅ done · ⏸️ deferred · ❌ blocked):

| Step | Title | Status |
|---|---|---|
| 1.0 | Phase-1 preflight (branch, MCP, db_roadmap §1, ledger sweep) | ⬜ |
| 1.1 | Migration 1: structure & constraints (quote_services rebuild §7.85 + quotes columns + CHECKs + numeric(12,2) + UNIQUE(param_name) + indexes C-1/C-6 + projects snapshot/time columns) 🔻👤 typed-echo | ⬜ |
| 1.2 | Migration 2: Seed products(11)/price_tiers(40)/params(20) 🔻👤 typed-echo | ⬜ |
| 1.3 | Migration 3: RLS policies (quotes/quote_services §7.21 · params/products/price_tiers §7.83) 🔻👤 typed-echo | ⬜ |
| 1.4 | Migration 4: lock trigger (F5/§7.50) + conversion RPC (§7.49/76/F22) + atomic edit RPC (F17) 🔻👤 typed-echo | ⬜ |
| 1.5 | Migration 5: pg_cron install + expiry job (§7.42/F4/§7.56) + login_attempts cleanup (§7.75) 🔻👤 typed-echo | ⬜ |
| 1.6 | RLS + RPC verification battery (impersonation matrix + positive control) 🔻🤖 | ⬜ |
| 1.7 | Phase-1 gate: schema.sql snapshot + advisors + db_roadmap update + report 🔻👤 | ⬜ |
| 2.1 | `src/lib/pricing.js` SSOT + unit tests (6,319 gate) 🔻🤖 | ⬜ |
| 2.2 | `src/lib/catalog.js` labels + validators.js additions + tests 🔻🤖 | ⬜ |
| 2.3 | `src/modules/03_quotes/api.js` (+ prices tab api) 🔻🤖 | ⬜ |
| 2.4 | Phase-2 gate: verify green + 6,319 evidence 🔻👤 | ⬜ |
| 3.1 | PDF engine spike: lib choice + Hebrew/RTL proof 🗣️→🔻🤖 screenshot | ⬜ |
| 3.2 | Quote builder screen (create+edit) 🗣️→🔻🤖 | ⬜ |
| 3.3 | Quote management screen (tabs F24 + ⭐ + filters + actions) 🗣️→🔻🤖 | ⬜ |
| 3.4 | Quote PDF render + download + mailto flow 🗣️→🔻🤖 screenshot | ⬜ |
| 3.5 | Customer-card integration (quote history §6 + metrics + income filter) 🗣️→🔻🤖 | ⬜ |
| 3.6 | Prices tab in /system (§7.84) 🗣️→🔻🤖 | ⬜ |
| 3.7 | Phase-3 gate: 🎨 UX & functional review 🔻👤 | ⬜ |
| 4.1 | Approval flow E2E (date guard §7.32, RPC, project born complete, locks) 🔻🤖 | ⬜ |
| 4.2 | Rejection + expiry flows E2E (7 reasons, notes, cron simulation) 🔻🤖 | ⬜ |
| 4.3 | e2e/quotes.spec.js + e2e/prices.spec.js suites 🔻🤖 | ⬜ |
| 4.4 | Regression: full verify + existing E2E + M1/M2 screens 🔻🤖 | ⬜ |
| 4.5 | Phase-4 gate 🔻👤 | ⬜ |
| 5.1 | Acceptance scenario from spec (6,319 in live UI) 🔻🤖 screenshot | ⬜ |
| 5.2 | QA matrix as-run fill + DoD walkthrough 🔻🤖 | ⬜ |
| 5.3 | Docs: §6 wiring, module-1.md correction, db_roadmap §10, CLAUDE_CODE_LOG/STATUS 🔻🤖 | ⬜ |
| 5.4 | Closing audit + PR (FRESH session, final-test template, DoD typed-echo) 🔻👤 | ⬜ |

### 2. 📦 Context Packet for Claude

**Purpose (≤3 lines):** Build the pricing module — the money engine: seed the product catalog/tiers/params, price quotes (tiered pricing, additive discounts, 18% VAT, agora precision), manage quote lifecycle (in_progress→approved/rejected incl. auto-expiry), convert approved quotes atomically into projects, generate Hebrew RTL PDF in real time, and add the CEO "מחירים" maintenance tab. Spec: C5 §5.5.4–5.5.5 (process), §5.6.4–5.6.5 (screens); C6 §2.4.2/3/9/11/12 (tables).

**Capabilities delivered vs deferred:**

| Capability | This module delivers | Completed by | Tracked |
|---|---|---|---|
| Quote creation/edit screen (customer pull, event data incl. start/end times, hostess recommendation w/ override, catalog lines w/ tiers+colors+notes, live totals) | ✅ full | — | — |
| Quote management screen (status tabs, ⭐ expiring view, filters, approve/reject/edit) | ✅ full | — | — |
| Pricing engine SSOT (`src/lib/pricing.js`, item×qty×price only — F26 invariant) | ✅ full | — | — |
| PDF: real-time render, download, mailto + manual attach | ✅ engine + manual flow | 🚧 מ10 auto server-send w/ template #10 | §6 line added 15/07/2026 ✓ |
| Approval → project born complete (RPC; date/times/identity inherited; logistics rows derived; required_hostess_count=Σ hostess qty) | ✅ RPC + DB rows | project UI/lifecycle = מ6 · logistics UI = מ5 (no 🚧 — their spec'd scope, not a debt M3 leaves) | — |
| Auto-expiry 30d (pg_cron daily, from updated_at, param-driven) | ✅ full | — | — |
| Customer-card: quote history + revenues + avg-deal-size + income filter | ✅ (closes 4 of 5 §6 מ3 debts) | — | §6 lines get ✅ strikethrough on close |
| Prices tab /system (products+tiers+2 params, CEO write) | ✅ full (§7.84) | full params screen = מ9 (§7.70) | §7.70 |
| Quote-pending KPI on dashboard | ❌ not now | מ7 | C5:210 |
| Win-rate / loss analytics reports | ❌ not now | מ11 | §7.82 filters note |
| Scope changes after approval | ❌ not now | מ6 (§7.72) | §7.72 |

**Existing files to touch/reuse:**
- `src/App.jsx:75-82` — swap `<UnderConstruction moduleName="הצעות מחיר"/>` for `QuotesPage` (pattern: customers route App.jsx:67-74); add `/system/prices` nested route (pattern App.jsx:52-64). ⚠️ shared-surface.
- `src/modules/01_auth/SystemManagementPage.jsx:8-12` — add `{ path: 'prices', label: 'מחירים' }` to TABS. ⚠️ shared-surface.
- `src/modules/02_customers/CustomerFormDialog.jsx:103-110` — REUSED AS-IS via props (open/onOpenChange/editingCustomer=null/customers/onSaved) for F25; remount-by-key convention (CustomerFormDialog.jsx:100-102).
- `src/modules/02_customers/CustomerDetailsCard.jsx` — add quote-history section + wire revenue metrics. ⚠️ shared-surface.
- `src/lib/customers.js` — `deriveCustomerMetrics` (5 metrics: revenues + avgDealSize come alive) + `matchesCustomerFilters` (income filter). ⚠️ shared-surface.
- `src/lib/validators.js:1-16` — append SKU/price/int/vat/ratio validators. ⚠️ shared-surface.
- `src/lib/permissions.js` (`isAllowed`), `src/components/layout/ProtectedRoute.jsx` — reuse unchanged.
- `src/supabaseClient.js` — import as `@/supabaseClient` (NOT `@/lib/`).
- `src/modules/02_customers/api.js:23-192` — pattern for api.js (toError w/ code preservation; 23505 branching).

**Files to create:**
- `supabase/migrations/` — 5 named migrations (steps 1.1–1.5).
- `src/lib/pricing.js` + `pricing.test.js` — money SSOT.
- `src/lib/catalog.js` + `catalog.test.js` — display labels (category/status/color), PRICING_PARAM_NAMES.
- `src/modules/03_quotes/`: `api.js` · `QuotesPage.jsx` (tabs list) · `QuoteBuilderPage.jsx` (create/edit) · `QuoteLineEditor.jsx` · `QuoteSummaryPanel.jsx` · `RejectQuoteDialog.jsx` · `ApproveQuoteDialog.jsx` · `QuoteReadOnlyView.jsx` (reused by customer card history) · `quotePdf.js` (standalone pure engine, §7.12↳) + `PdfPreview` glue.
- `src/modules/01_auth/`: `PricesManagementPage.jsx` · `ProductFormDialog.jsx` · `PriceTiersDialog.jsx` · `PricingParamsCard.jsx` · `pricesApi.js` (per design-notes, weighed in DB challenge).
- `e2e/quotes.spec.js` · `e2e/prices.spec.js`.

**DB tables + migrations:** quotes, quote_services (rebuild §7.85), products, price_tiers, params (current defs schema.sql:57-117; all RLS-on/0-policies deny-all per schema.sql:344-353), projects+logistics written by RPC only. Existing migrations context: `20260710160735` (surrogate PK + nod bundle), `20260711013517` (customer_contacts).

**Dependencies:** M1 auth (current_user_role_id, permissions matrix, ProtectedRoute) · M2 customers (picker data, CustomerFormDialog, discount_percent, primary contact only — §6 מ3 contacts note).

**🔑 Test Identities (MANDATORY):**
- 5 seeded test users (one per role). Resolve LIVE, never hard-code: `select u.email, u.user_id, r.role_name from users u join roles r on r.role_id = u.role_id;` and permission levels: `select r.role_name, p.permission_level from permissions p join roles r using(role_id) join modules m using(module_id) where m.module_name = 'הצעות מחיר';`
- RLS impersonation (SQL, per module-2.md §2 pattern): `select set_config('request.jwt.claims', json_build_object('sub', '<auth uuid>', 'email', '<email>', 'role', 'authenticated')::text, true);` — BOTH `sub` AND `email` required; missing one ⇒ all queries return 0 rows and *look* like perfect RLS.
- **Positive control:** a role with `edit` on 'הצעות מחיר' (per matrix: מנהלת פרויקטים / מנכ"ל — verify live) MUST see ≥1 quote after seed-test insert; 0 ⇒ broken impersonation, NOT working RLS.
- UI-login creds: `.env.local` has ONLY `E2E_CEO_*` + `E2E_STAFF_*` (verified 14/07; module-2.md §9 documents finance/logistics creds were never provisioned). E2E specs use these two tiers; if a quote-edit role isn't covered by them, resolve live and flag — do NOT invent creds.
- ⚠️ **Never print secrets** (iron rule 6).

**Spec sections:** C5 §5.5.4 (C5:225–262 process + worked example), §5.5.5 (C5:265–273 lifecycle), §5.6.4 (C5:561–590 builder screen), §5.6.5 (C5:591–611 management screen); C6 §2.4.2 quotes, §2.4.3 products, §2.4.9 params, §2.4.11 quote_services, §2.4.12 price_tiers. Mockups: `docs/mockups/quote-screen/01–07.png` (05 shows 17% VAT — stale, spec 18% wins) + `quote_template_draft.docx` (PDF structure, §7.12). Tabs pattern: `docs/mockups/project-management-screen/01_overview_reworked.html` (F24).

**Environment facts:** Vite dev :5173 · alias `@/`→`src/` · supabase import `@/supabaseClient` · RTL Hebrew UI · design language PROJECT_MASTER §4 (primary teal #0D9488 `--primary`; success ~#22C55E approve modal; danger ~#EF4444 reject modal; warning ~#F59E0B in_progress pill; bg #F8FAFC) · Vitest via vite.config.js (`npm run test:run`) · Playwright serial workers=1 (`npm run test:e2e`) · `npm run verify` = lint+format+tests+build · Windows/PowerShell (`Get-Date` for timestamps) · Supabase MCP for read-verification + `apply_migration` (typed-echo gate first) · Hebrew why-first comments in code (iron rule 3, stated once here).

### 3. 🧭 Decisions Ledger

| Item | Ruling | Who | Date | Unblocks |
|---|---|---|---|---|
| §7.1 | VAT=18%; canonical param string `אחוז_מעמ`; verify all 20 seed names = code lookup strings | ישי | 07+12/07 | 1.2, 2.1 |
| §7.25+§7.74 | Agorot (2dp) in calc/storage, whole-₪ display; `numeric(12,2)`; 5,355 reconstructs from lines | ישי | 07/07 | 1.1, 2.1 |
| §7.26+F7 | Discounts additive; CHECK 0–100 each + combined ≤100 in DB AND pricing.js | ישי | 07/07+12/07 | 1.1, 2.1 |
| §7.27 | Tier tie-break code-only: highest min_qty ≤ qty wins; max_qty display-only; no DB constraint | ישי | 07/07 | 2.1 |
| §7.28 | `closing_unit_cost` frozen at approval, symmetric to closing_unit_price | ישי | 07/07 | 1.1, 1.4 |
| §7.12(+↳) | PDF real-time, no storage; pdf_url deprecated (no reads/writes); standalone pure engine; flow: download→mailto→manual attach; structure per quote_template_draft.docx | ישי | 07+11/07 | 3.1, 3.4 |
| §7.13 + seed clarifications 1–15 | Seed per locked doc: 11 products · 40 tiers · 20 params exactly (minus #4 §7.57, plus שכר_מינימום_שעתי=35); W 0.4/0.3/0.3 + W3=מהימנות; templates #10–14 verbatim from C5 §5.8; **param #15** (`קישור_בסיס_סקר_לקוחות`) gets the real URL `https://forms.gle/YFJobqmgpBCqf1x87` (clarification-decision #14 — do NOT touch template-param #14); fix #16 name `מייל_משרד_רואי_חשבון` | ישי | 03–14/07 | 1.2 |
| §7.32 (M3 part) | Approve blocked if final_event_date < today (today allowed); validation on approve action | ישי | 12/07 | 1.4, 4.1 |
| §7.34 (M3 part) | Product picker filters to `status='active'` only | ישי | 12/07 | 3.2 |
| §7.40ב+§7.70 | `UNIQUE(params.param_name)` before seed; typed params screen = M9 | ישי | 12/07 | 1.1 |
| §7.41 (M3 nods) | color CHECK (NULL or 5 values); line_number=max+1; expiry→`rejected`+'פג תוקף', no revival; PDF Hebrew/RTL/font = DoD w/ screenshot | ישי | 12/07 | 1.1, 3.1 |
| §7.42+F4 | pg_cron daily expiry; counts from `updated_at`; days from param `ימי_תוקף_הצעה` | ישי | 07/07+12/07 | 1.5 |
| §7.49+F1+§7.76+F22 | Atomic conversion RPC, SECURITY DEFINER + internal edit-check on 'הצעות מחיר'; approver=מנהלת פרויקטים (finance=view); project born complete (identity snapshot, date inheritance, logistics derivation, required_hostess_count=Σ hostess-line qty); approval human-only | ישי | 11–12/07 | 1.4 |
| §7.50+F5 | DB lock trigger: UPDATE/DELETE rejected on quotes+quote_services in ANY status ≠ in_progress | ישי | 11/07+12/07 | 1.4 |
| §7.51 | `vat_rate_snapshot` frozen inside RPC at approval | ישי | 11/07 | 1.1, 1.4 |
| §7.53 | CHECK >0 hostess counts stays (no equipment-only events) | ישי | 11/07 | 1.1 |
| §7.56 | ✅ NODDED: cron at fixed UTC hour ≈01:00 Israel (Supabase cron.timezone=GMT; date-granular job delivers the ruled behavior); new time columns = timestamptz/time as appropriate | ישי | 15/07 | 1.5 |
| §7.62 (M3 part) | `quotes.customer_id SET NOT NULL` | ישי | 12/07 | 1.1 |
| §7.64 (M3 part) | `products.sku` stays natural PK + `ON UPDATE CASCADE` on FKs | ישי | 10/07 | 1.1 |
| §7.75 | login_attempts cleanup job (>30d) rides pg_cron install | ישי | 12/07 | 1.5 |
| §7.82 F2/F3+F16 | rejection_reason CHECK 7 values + rejection_notes (required iff 'אחר'); CHECK rejected⇔reason; status stays 3 values | ישי | 12–14/07 | 1.1 |
| §7.82 F8–F15 | quote number=quote_id; branded=SKU; PDF 2 discount lines; hostess recommendation=ceil; customer discount snapshot at creation (not re-pulled on edit); terms=static placeholder; F13 products.unit CHECK | ישי | 12/07 | 2.1, 3.2, 3.4 |
| §7.82 F17 | Edit save = atomic delete+insert (RPC/txn); no half-states | ישי | 14/07 | 1.4 |
| §7.82 F18 | Line display rounded ₪; totals always from exact agorot | ישי | 14/07 | 2.1, 3.2 |
| §7.82 F19 | No separation of duties: edit on module covers create+edit+approve+convert | ישי | 14/07 | — |
| §7.82 F20 | Ratio param = default, overridable per quote (transient, NOT stored); manual hostess qty entry allowed; recommended_hostess_count stores the computed recommendation | ישי | 14/07 | 3.2 |
| §7.82 F21 | Hours↔SKU no enforcement; soft UI hint allowed | ישי | 14/07 | 3.2 |
| §7.82 F23 | `estimated_start_time`+`estimated_end_time` on quotes; estimated_hours derived from diff, not typed | ישי | 14/07 | 1.1, 3.2 |
| §7.82 F24 | Management screen tabs by status + ⭐ expiring view; sorts/filters delegated ("לא מעמיס בעין") | ישי | 14/07 | 3.3 |
| §7.82 F25 | "+ לקוח חדש" opens M2 CustomerFormDialog, auto-select on save | ישי | 14/07 | 3.2 |
| §7.82 F26 | Pricing model = packages. INVARIANT: pricing.js never encodes "shift" — item×qty×price only | ישי (llm-council) | 14/07 | 2.1 |
| §7.83 | RLS: select open to authenticated on params/products/price_tiers; write CEO-only via 'הגדרות מערכת' (replaces §7.21 for these 3) | ישי | 14/07 | 1.3 |
| §7.84 | Prices tab in /system (products+tiers+2 pricing params; CEO write; maintenance role — seed runs first); design notes = input not gospel | ישי | 14/07 | 3.6 |
| §7.85 | quote_services PK = `line_id bigint generated always as identity`; quote_id/sku/color/line_number regular columns; quote_id FK cascade | ישי | 14/07 | 1.1 |
| LOCAL-1 | ✅ RULED: projects gets own `final_start_time`+`final_end_time` (time), seeded from quote in RPC, editable on project (quote locked §7.50); §7.47 M4 row narrows to short/long classification | ישי | 15/07 | 1.1, 1.4 |
| LOCAL-2 | ✅ RULED: estimated_hours = GENERATED column, wrap-around formula (end<start ⇒ +24h; §7.30 preserved); UI hint "נמשך אל תוך הלילה" | ישי | 15/07 | 1.1 |
| LOCAL-5 | ✅ RULED: identity snapshot = event_name + customer_id copied to projects | ישי | 15/07 | 1.1, 1.4 |
| LOCAL-6 | ❓ OPEN — quotes.notes (general) lands on PDF where? §7.12 docx has no notes block but C5:227 requires notes on the document — ask at step 3.1 🗣️ brief (recommendation: "הערות" block under the lines table) | — | — | 3.1 |
| LOCAL-3 | Tier math lives in pricing.js (not catalog.js) — deviation from design-notes file split, same behavior (approved w/ blueprint 15/07) | ישי | 15/07 | 2.1 |
| LOCAL-4 | ⭐ expiring = highlighted filter chip w/ count, not 4th tab (F24 delegated; approved w/ blueprint 15/07) | ישי | 15/07 | 3.3 |
| ⏳ §7.71 | pdf_url DROP — deferred M12 | — | — | — |
| ⏳ §7.72 | scope-change model — deferred M6 (candidate direction recorded in §7) | — | — | — |
| ⏳ §7.67 | assignment↔line linkage — deferred M4 (line_id makes it 1-column) | — | — | — |

### 4. 🛡️ Security & Auth Model Statement (iron rule 9)
- **quotes + quote_services:** §7.21 standard template, `module_name = 'הצעות מחיר'` exactly; select for edit|view, write for edit; `(select current_user_role_id())` initplan wrap mandatory.
- **params/products/price_tiers:** 🔗 מראת §7.83 — SSOT: PROJECT_MASTER §7 — `for select to authenticated using (true)`; write gated on `module_name = 'הגדרות מערכת'` edit (CEO). Replaces §7.21 for these 3 tables (ruled).
- **Conversion RPC:** SECURITY DEFINER (writes quotes+projects+logistics across module boundaries) with EXPLICIT internal permission check (edit on 'הצעות מחיר') before acting — no blind bypass (§7.49/F1). `search_path` pinned (advisor hygiene).
- **Edit RPC (F17):** SECURITY INVOKER (RLS applies) — atomicity only, no privilege elevation; verify quote is in_progress inside.
- **Lock trigger (F5):** DB-level, blocks UPDATE/DELETE on non-in_progress quotes and their lines regardless of role — protects §7.12 PDF-reconstruction + §7.28 profitability data even from edit-role API calls.
- **UI gates:** route `<ProtectedRoute allow="הצעות מחיר">`; prices tab under SYSTEM_MODULES route + write-UI hidden unless `permissions['הגדרות מערכת']==='edit'` — convenience layer; RLS is the wall (App.jsx:14 doctrine).
- **Read-path guard (§6 מ3):** quotes SELECT policy MUST keep plain §7.21 view-level access — `getCustomerProjects` (02_customers/api.js) reads quotes; narrowing would silently empty customer-card history.
- **Accepted limitations:** module-level RLS (no row ownership, §7.21); session in sessionStorage (M1); logistics rows created by DEFINER RPC while logistics module RLS stays deny-all until M5 (rows invisible until M5 policies — accepted, spec'd order).

### 5. 🏗️ Phase & Step Plan

**Model & effort per phase:**

| Phase | Model | Effort | Why |
|---|---|---|---|
| 1 DB/RLS/Seed | Opus (or Fable) | High | 5 migrations, RPC/trigger/RLS design, irreversible shared-DB applies |
| 2 Business logic | Opus | High | Money SSOT; 6,319-exact correctness is the module's core |
| 3 UI | Sonnet | Medium | Screens follow M2 patterns; PDF spike step 3.1 = Opus/High (RTL risk #1) |
| 4 Control & integration | Opus | High | RPC edges, E2E, regression |
| 5 QA & handoff | Opus | High | Independent re-verification |
| 5.4 closing audit | Opus | High | Fresh-session template run (mandatory row) |

Canonical rules for every step: Goal · Files · What · Verification+expected · 🔻🤖/👤. Migration steps embed the Migration Design Checklist (db_roadmap §1) in What; their Verification includes an MCP advisors run (zero new findings or written triage). 🗣️ experience-brief (Hebrew) + PM approval before each significant build-unit; 🤖 visual evidence = screenshots, no human wait mid-phase; 👤 at phase ends, migration typed-echoes, §7/product decisions.

#### Phase 1 — DB, Seed, RLS, engine-room (all server-side)

**Step 1.0 — Preflight 🔻🤖.** Goal: safe start + surface known failure-risks early (risk-mitigation pass, 15/07). What: `git fetch origin` + confirm the CURRENT branch (whatever it is named) is not already merged (`git merge-base --is-ancestor HEAD origin/dev` **fails** = good; if it succeeds the branch is dead — stop and cut a fresh one from `dev`, iron rule 10) and record its name in the header; MCP alive (`list_tables` shows 16+ tables); read db_roadmap §1+§6 rows for the 5 tables; sweep this Ledger for Phase-1 OPEN items → all Phase-1 items already ruled 15/07 (LOCAL-1/2/5, §7.56); if new OPEN items appeared since, present to Ishay for consolidated ruling (P13 style, §8(h)). **Early risk check (moved forward, not deferred to step 4.3):** resolve LIVE which of the 5 seeded roles maps to 'מנהלת פרויקטים' (the quote-approval role, §7.49) and confirm whether it has a provisioned E2E credential in `.env.local` — module-2.md §9 already documented that only `E2E_CEO_*`/`E2E_STAFF_*` exist; if the approval role isn't one of those two, flag to Ishay NOW (cheap to resolve at the start of the module, expensive to discover mid-Phase-4 while writing E2E specs). Verify: checklist output in chat + role/credential-coverage line.

**Step 1.1 — Migration 1: structure & constraints 🔻👤 typed-echo** *(the Hebrew typed-echo explanation doubles as this unit's 🗣️ brief — applies to all migration steps)*. Goal: bring the tables to their ruled shape before any data. Files: `supabase/migrations/<ts>_module3_quotes_structure_and_constraints.sql`, `docs/schema.sql`. What (Hebrew why-header; per-item §7 cites in comments):
- Pre-check: `select count(*) from quotes; select count(*) from quote_services;` → expect 0/0 (rebuild safety; if ≠0 STOP and report).
- `quote_services` rebuild (§7.85): add `line_id bigint generated always as identity primary key`; drop composite PK; keep `quote_id` FK on delete cascade (now plain column), `sku` FK on delete restrict **+ on update cascade** (§7.64); UNIQUE(quote_id, line_number) to keep display numbering sane (**local addition, not part of §7.85** — compatible with replace-lines RPC: delete precedes insert in one txn); add `closing_unit_cost numeric(12,2) not null check (>=0)` (§7.28); color CHECK — 🔗 מראת §7.41 — NULL or ('לבן','שחור','אפור','טורקיז','כחול'); retype money cols numeric(12,2) (§7.74).
- **C-1 covering indexes (db_roadmap C-1):** index on `quotes(customer_id)` + `quote_services(sku)` + `quote_services(quote_id)` + **`projects(customer_id)`** (new LOCAL-5 FK — see the projects block below) + **`projects(owner_email)`** + **`logistics(sku)`**. Rationale for the last two: M3's conversion RPC is the **first writer** to both `projects` and `logistics` (both empty/deny-all until now), so per C-1's "with each module's first migration touching that table" they belong here; indexing them also clears their pre-existing `unindexed_foreign_keys` advisor findings.
- `quotes`: add `vat_rate_snapshot numeric(5,2)` (NULL until approval, §7.51); `rejection_reason` CHECK — 🔗 מראת §7.82/F2‑F3 — 7 values ('מחיר','חוסר זמינות/לו"ז','נבחר מתחרה','תקציב לקוח','האירוע בוטל אצל הלקוח','פג תוקף','אחר'); `rejection_notes text` + CHECK (reason='אחר' ⇒ notes not null); CHECK (quote_status='rejected') = (rejection_reason is not null) (F16); `estimated_start_time time not null` + `estimated_end_time time not null` + `estimated_hours` **GENERATED column, wrap-around formula (LOCAL-2 ruled): `case when end>start then extract(epoch from (end−start))/3600 else extract(epoch from (end−start))/3600+24 end` in hours, numeric(4,2)** (F23; replaces the typed column — table empty, safe). **⚠️ Pre-flight sandbox check (risk-mitigation, 15/07): `time − time` in Postgres returns an `interval`, not a number — before this DDL goes into the migration, verify the exact `extract(epoch from …)/3600` expression via `execute_sql` against the worked example (20:00→02:00 must yield exactly 6.00) to avoid a syntax/semantics failure only surfacing at Apply-time.** `customer_id SET NOT NULL` (§7.62); discount CHECKs 0–100 each + combined ≤100 (F7/A-9); money/percent cols → numeric(12,2); index `quotes(quote_status, updated_at)` (C-6).
- `projects`: add `event_name text` + `customer_id bigint references customers(customer_id)` (identity snapshot targets, §7.76 + LOCAL-5 ruled — RPC fills them) + `final_start_time time` + `final_end_time time` (LOCAL-1 ruled: seeded from quote by the RPC, editable on the project thereafter; §7.47's M4 row narrows to short/long classification only). **Covering index on `projects(customer_id)`** — this is a NEW FK (LOCAL-5), so it needs its own C-1-style index, same as any FK; the customer-card history (getCustomerProjects) and future M6/M7/M8 customer→projects screens scan by it, and the `unindexed_foreign_keys` advisor flags it otherwise.
- `products`: unit CHECK IN ('יחידה','פרויקט','משמרת','מטר') (F13); base_price/cost → numeric(12,2); `price_tiers`: special_price numeric(12,2), CHECK min_qty>0, CHECK (max_qty is null or max_qty>=min_qty) (§7.41 bundle); FKs to products.sku get on update cascade (§7.64) — **including `logistics.sku`** (M3's RPC populates logistics; without CASCADE the first conversion blocks future SKU fixes).
- `params`: `UNIQUE(param_name)` (§7.40ב).
Gate: explain in Hebrew what/impact/reversibility → Ishay types migration name → apply via MCP `apply_migration`. Verify 🤖: MCP reads — information_schema shows line_id PK, CHECK list; advisors = 0 new findings; update db_roadmap rows (A-9/A-14/A-17/C-1/C-6/§7.85) same session.

**Step 1.2 — Migration 2: Seed 🔻👤 typed-echo.** Goal: locked catalog data. Files: `<ts>_module3_seed_products_tiers_params.sql`, schema.sql. What: INSERTs per `products_and_params.md` locked decisions 1–15: products 11 rows (SKUs 06ST/04ST/01WEB no leading hyphen, English enums, statuses active); price_tiers 40 rows (NO service tiers; max_qty NULL at top tier); params 20 rows exactly (#1–20 minus #4 plus שכר_מינימום_שעתי=35; W 0.4/0.3/0.3 W3=מהימנות `משקולת_3W_מהימנות`; templates #10–14 verbatim from C5 §5.8.1–5; #17–20 verbatim from the doc; **param #15 = real survey URL per clarification #14**; #16 fixed name `מייל_משרד_רואי_חשבון`; param_type per locked enum). 🔗 מראת §7.13 + הבהרות-Seed — SSOT: products_and_params.md (locked doc). Verify 🤖: counts 11/40/20 via MCP; spot checks: `אחוז_מעמ`=18 · `יחס_אורחים_לדיילת`=50 · 04ST base_price=500.00 · REG-TAG tier(201)=2.5 · B-REG-TAG tier(201)=5.0 · B-FAB-LAN tier(201)=6.0 (worked-example inputs); zero tiers for 06ST/04ST/01WEB; **name-match audit: 20 param names byte-equal to PRICING_PARAM_NAMES/code lookups (§7.1 build step)**.

**Step 1.3 — Migration 3: RLS 🔻👤 typed-echo.** Goal: open the doors correctly. Files: `<ts>_module3_rls_quotes_and_catalog.sql`, schema.sql. What: quotes+quote_services per §7.21 template (`module_name='הצעות מחיר'`, initplan wrap, select edit|view / write edit); params/products/price_tiers per §7.83 (select `using (true)` to authenticated; write via 'הגדרות מערכת' edit — 3 policy pairs; design-notes §6 SQL is the reference skeleton). Verify 🤖: policy count via MCP (`pg_policies`): quotes 2, quote_services 2, +6 for the 3 catalog tables; advisors clean.

**Step 1.4 — Migration 4: lock + RPCs 🔻👤 typed-echo.** Goal: lifecycle integrity in the DB. Files: `<ts>_module3_lock_and_conversion_rpc.sql`, schema.sql. **⚠️ Mandatory pre-write check (risk-mitigation, 15/07 — the fresh-context reviewer already caught one missing-column blocker here at blueprint time; make the check mechanical, not memory-based):** before authoring the RPC's INSERT statements, query `information_schema.columns` for `projects` and `logistics` to enumerate every `NOT NULL` column with no default, and cross-check that list line-by-line against the INSERT's column list — do not rely on re-reading this guide's prose from memory. What:
- Lock trigger (F5/§7.50): **plain OLD-status check** — BEFORE UPDATE OR DELETE on quotes: `OLD.quote_status ≠ 'in_progress' ⇒ raise exception`; on quote_services: parent quote's status ≠ 'in_progress' ⇒ raise. In_progress rows stay freely updatable (so the moddatetime trigger, the edit RPC, the approval flip, and the cron expiry UPDATE — all acting on OLD=in_progress — need NO exemption machinery). **Load-bearing RPC order: freeze lines/vat FIRST, flip status LAST** (once flipped, the row is frozen).
- Conversion RPC `approve_quote_and_create_project(quote_id)` (§7.49): SECURITY DEFINER, pinned search_path; internal check: caller has edit on 'הצעות מחיר' (else raise); validate status='in_progress' + final date guard (estimated_event_date ≥ current_date, §7.32); freeze `vat_rate_snapshot` from live `אחוז_מעמ` (§7.51); freeze `closing_unit_cost` per line from products.cost (§7.28); THEN flip status approved; insert projects row born complete: quote_id, **event_name + customer_id (identity snapshot §7.76 + LOCAL-5 ruled — columns added in 1.1)**, final_event_date := estimated_event_date (C5:267), **final_start_time/final_end_time := estimated times (LOCAL-1 ruled — editable on project thereafter)**, **final_location := estimated_location (NOT NULL in projects, schema.sql:125)**, owner_email := caller email, required_hostess_count := Σ qty of category='hostess' lines (F22), status 'not_started'; derive logistics rows from category != 'hostess' lines (§7.41 rule; qty→planned_qty, **serial_number := row_number() per project — NOT NULL, no default, schema.sql:183**); all-or-nothing; double-click safe (projects.quote_id UNIQUE → friendly error mapping).
- Edit RPC `replace_quote_lines(quote_id, header jsonb, lines jsonb)` (F17): SECURITY INVOKER txn — verify in_progress, delete lines, insert new (line_number sequential), update quotes header fields; updated_at refresh restarts expiry clock (F4 by design). **Create path uses the same atomic shape** (insert header+lines in one txn/RPC — F17 rationale applies to creation: no lines-less quote on mid-failure).
Verify 🤖: SQL battery — approve happy path creates project+logistics rows (counts); double-call → friendly error, no dup; UPDATE on approved quote → exception; view-role RPC call → permission exception; rollback proof: force failure mid-RPC (e.g. temp constraint) → quote stays in_progress, no orphan project.

**Step 1.5 — Migration 5: pg_cron 🔻👤 typed-echo.** Goal: time-based transitions. Files: `<ts>_module3_pg_cron_expiry_and_cleanup.sql`, schema.sql. **⚠️ Pre-authoring check (risk-mitigation, 15/07 — M3 is the FIRST pg_cron consumer in this project, so nothing here is battle-tested locally):** run `search_docs` (Supabase MCP) for pg_cron-on-Supabase specifics — schema location of `cron.job`/`cron.schedule`, which role a scheduled job executes as, and whether that role's queries are subject to RLS — before assuming any of it; do not guess. What: enable pg_cron extension; daily job (per §7.56 nod: cron.timezone GUC is GMT on Supabase — schedule at a fixed UTC hour ≈01:00 Israel; job is date-granular so this delivers the ruled behavior): `update quotes set quote_status='rejected', rejection_reason='פג תוקף' where quote_status='in_progress' and updated_at < now() - (select param_value from params where param_name='ימי_תוקף_הצעה')::int * interval '1 day'` (uses index C-6; no lock-trigger exemption needed — expiry acts on OLD=in_progress rows, which the plain-status trigger permits); second job: `delete from login_attempts where last_attempt_at < now() - interval '30 days'` (§7.75). Verify 🤖: `cron.job` shows 2 jobs w/ correct schedule; manual run test: insert a stale test quote **with explicit backdated `updated_at` in the INSERT itself** (moddatetime resets updated_at on any UPDATE — post-insert backdating silently un-backdates), execute job function once → row flips rejected+'פג תוקף'; cleanup: stale login_attempts row removed.

**Step 1.6 — RLS+RPC verification battery 🔻🤖.** Goal: prove the security model per Test Identities block. What: impersonation matrix — for each role: quotes select (edit/view roles ≥1 row, blocked 0), quotes insert (edit only), catalog select (ALL authenticated roles ≥11 products — §7.83), products write (CEO only, others RLS-denied), positive control first. Verify: matrix table pasted as evidence; failures stop the phase.

**Step 1.7 — Phase-1 gate 🔻👤.** Goal: human end-of-phase review. What: schema.sql snapshot refreshed (MCP/Studio handoff 🧩 if needed) + committed with migrations; advisors summary; db_roadmap rows updated (Stop hook); Hebrew report: what exists now in the DB, evidence links. Ishay approves → Phase 2.

#### Phase 2 — Business logic (SSOT)

**Step 2.1 — pricing.js 🔻🤖.** Goal: the money SSOT (iron rule 14). Files: `src/lib/pricing.js`, `src/lib/pricing.test.js`. What: pure functions (no Supabase): `resolveUnitPrice(product, tiers, qty)` (§7.27 tie-break; base_price when no tiers); `computeLineTotal` (exact 2dp); `computeQuoteTotals(lines, appliedDiscount, manualDiscount, vatRate)` → {subtotal, discountAmount, preVat, vatAmount, total} all exact agorot (§7.25), additive discounts w/ validation ≤100 (§7.26); `recommendHostessCount(guests, ratio)` = ceil (F14); display helpers `formatShekelWhole` (F18); PRICING_PARAM_NAMES + parseVatPercent/parseGuestsRatio (from design notes — folded here, LOCAL-3). **F26 INVARIANT stated in file header comment: this engine knows only item×qty×price — no shift/hour semantics ever.** Tests: the 6,319 scenario EXACT (subtotal 6300.00, discount 945.00, preVat 5355.00, vat 963.90, total 6318.90, display 6,319) as the canonical test; tier boundaries (50/51, 200/201, 400/401, 1000/1001); unsorted tiers; qty below lowest tier → base_price; discount edge 0/100/101-rejected; combined >100 rejected; ceil recommendation (300/50=6, 301/50=7). Verify: `npm run test:run` → all green incl. 6,319 exact.

**Step 2.2 — catalog.js + validators 🔻🤖.** Files: `src/lib/catalog.js`+test, `src/lib/validators.js`+test (⚠️ shared-surface: additive block only — no other module's build is active). What: PRODUCT_CATEGORY_LABELS/STATUS_LABELS/COLOR options (matching DB CHECKs); validators per design-notes §5 (SKU_REGEX no leading hyphen, prices, ints, vat 0–100, ratio). Verify: tests green; labels byte-match DB CHECK values.

**Step 2.3 — api.js surfaces 🔻🤖.** Files: `src/modules/03_quotes/api.js`, `src/modules/01_auth/pricesApi.js`. What (pattern 02_customers/api.js toError): quotes: listQuotes(filters), getQuote(id) w/ lines, **createQuote + saveQuoteEdit both route through the atomic txn/RPC path (F17 — creation included, no half-states)**, approveQuote→rpc, rejectQuote(id, reason, notes), listQuotesByCustomer(customerId) (customer-card history §6), getPricingCatalog() (products active + tiers + 2 params); pricesApi per design-notes §3 (upsertPricingParam now SAFE to `.upsert()` — UNIQUE landed in 1.1; note deviation from notes). Verify: unit-less — exercised by E2E later; smoke via dev console against seeded DB (CEO login) showing catalog fetch 11 products.

**Step 2.4 — Phase-2 gate 🔻👤.** verify green + 6,319 test evidence + Hebrew report.

#### Phase 3 — UI (each unit: 🗣️ experience-brief → build → 🤖 functional+visual evidence w/ screenshots)

**Step 3.1 — PDF spike FIRST (risk #1) 🗣️ → 🔻🤖 screenshot ⚠️ shared-surface (package.json).** Goal: de-risk Hebrew RTL PDF before any screen. Files: `src/modules/03_quotes/quotePdf.js`, package.json. What: evaluate client-side lib (candidate order: @react-pdf/renderer w/ embedded Hebrew font e.g. Heebo/Noto Sans Hebrew; fallback pdfmake w/ vfs font). **⚠️ Test worst-case content FIRST, not hello-world Hebrew (risk-mitigation, 15/07):** most RTL PDF bugs only surface with mixed-direction content in the same line — build the very first test render using the actual worked-example line (a Latin SKU like `B-REG-TAG`, a Hebrew color name, and a ₪-amount together), not a Hebrew-only sanity string; a pass on Hebrew-only text proves nothing about the real bidi risk. Build minimal doc: header (validity+30d per param · quote id · issue date), customer block (name/ח"פ/primary contact — §6 contacts note), project block, lines table (מק"ט·תיאור·כמות·צבע·הערות·מחיר-יחידה·סה"כ-שורה), pricing waterfall (subtotal→customer-disc%→manual-disc%→pre-VAT→VAT 18%→total; 2 discount lines F10), static terms placeholder (F15) — structure per §7.12/quote_template_draft.docx. **🗣️ brief question (LOCAL-6, spec-gap, do not self-rule): the §7.12 docx structure has no general-notes block, but C5:227 says quote notes appear on the document — where do `quotes.notes` land on the PDF? (recommendation: a "הערות" block under the lines table).** STANDALONE pure function (quote data⇒doc blob) — §6 מ3 requirement, M10 lifts it. Verify: rendered PDF screenshot showing correct RTL Hebrew, embedded font, waterfall numbers — attached in chat. **If RTL fails → stop, report to Ishay immediately (watch-list).**

**Step 3.2 — Quote builder 🗣️ → 🔻🤖 ⚠️ shared-surface (App.jsx).** Files: QuoteBuilderPage.jsx, QuoteLineEditor.jsx, QuoteSummaryPanel.jsx, App.jsx route. What: customer picker (forgiving search via src/lib/customers.js patterns; shows 3 identifiers; "+ לקוח חדש" → CustomerFormDialog F25, auto-select); on select: pull name+discount_percent snapshot (F12 — snapshot at creation, not re-pulled on edit); event fields: name, estimated date, location, start/end times (F23; hours auto-shown from diff, wrap-around +24h w/ "נמשך אל תוך הלילה" hint — LOCAL-2), guests; ratio field prefilled from param (F20, transient override) → recommendation (ceil) + manual qty override; lines: active-products picker (§7.34), qty, auto unit price (tiers via pricing.js — UI imports, never computes), color picker (circle+label+'ללא', §7.41), per-line notes, line totals rounded display (F18); **general quote-level notes field (`quotes.notes`, C6:157 — C5:227 says notes appear on the quote document)**; soft hint if hours vs shift SKU mismatch (F21 — non-blocking); live summary (subtotal/discounts/VAT/total via pricing.js); actions: שמור ושלח (create, status in_progress) / עדכן הצעה (edit via atomic RPC); validations (required fields per C6: all except color/notes; discounts 0–100 combined ≤100; qty>0) — spec-silent ones flagged in the 🗣️ brief. Verify: preview flow screenshots — create quote w/ worked-example data → summary shows 6,319; edit → totals update; validation states.

**Step 3.3 — Quote management 🗣️ → 🔻🤖 ⚠️ shared-surface (App.jsx).** Files: QuotesPage.jsx, RejectQuoteDialog, ApproveQuoteDialog, App.jsx. What: tabs by status w/ counts (F24 pattern from 01_overview_reworked.html): בתהליך/מאושרות/נדחו; ⭐ "פג בקרוב" highlighted filter chip w/ count (≤7 days to expiry, sorted by proximity — LOCAL-4); filters: customer, event-date range, quote-date range; rejection-breakdown counts in rejected tab (§7.82); sorts: amount/event date/expiry proximity; row actions per status: edit (in_progress), approve ✓ (green confirm modal §4), reject ✗ (red modal: 7-reason dropdown + notes required iff אחר), view (read-only QuoteReadOnlyView + הפק PDF). Verify: screenshots of tabs/filters/modals; counts match seeded test data.

**Step 3.4 — PDF flow 🗣️ → 🔻🤖 screenshot.** Files: wire quotePdf into builder/management/read-only view. What: הפק PDF button → generate+download; שלח ללקוח → download + mailto (prefilled subject/body, manual attach — §7.12↳ flow, like M2 marketing). Verify: full-quote PDF screenshot (worked example, 6,319) + mailto opens.

**Step 3.5 — Customer-card integration 🗣️ → 🔻🤖.** Files: CustomerDetailsCard.jsx, src/lib/customers.js, CustomersFilterSheet.jsx/CustomersPage.jsx (⚠️ shared-surface ×3 — additive sections; regression: customers tests+E2E stay green). What: (a) quote history collapsible section: ALL customer quotes (date·event·status pill incl. פג-תוקף distinction via reason) → click = read-only view + הפק PDF ("אפיון-שותק — אושר ע"י ישי 11/07"); (b) revenues ("סה"כ הכנסות") = Σ approved-quote totals via pricing.js + avgDealSize = revenues÷approved-count → deriveCustomerMetrics wiring; (c) customers-list filter "מובילים לפי הכנסה" → matchesCustomerFilters extension (§6 line 264). Primary contact only in picker/PDF (§6 line 265). Verify: card screenshot w/ history+metrics; filter works; `npm run test:run` customers tests green.

**Step 3.6 — Prices tab 🗣️ → 🔻🤖 ⚠️ shared-surface (SystemManagementPage.jsx, App.jsx).** Files: PricesManagementPage.jsx, ProductFormDialog.jsx, PriceTiersDialog.jsx, PricingParamsCard.jsx, pricesApi.js, SystemManagementPage.jsx, App.jsx. What: per design-notes (weighed: placement 01_auth ✓ consistent w/ system pages; stacked sections not sub-tabs ✓; status <Select> 3-value ✓ — flagged "מהמוקאפ/עיצוב-רקע — לאישורך" in the 🗣️ brief): products table + add/edit dialog (sku immutable on edit) + status select w/ optimistic rollback; tiers dialog (min_qty unique client check, max≥min, replace-all save); 2-param card (now plain upsert — UNIQUE exists). Verify: CEO flow screenshots; STAFF/blocked role sees read-only/RLS-denied evidence.

**Step 3.7 — 🎨 Phase-3 gate 🔻👤.** UX & functional review per template §5: (a) §4 design conformance; (b) states loading/empty/no-results/error+retry/success on every screen; (c) keyboard operability + focus ring; (d) validation completeness (spec'd all implemented; spec-silent all confirmed); (e) "מה לעצב אחרת?" — proposals presented, Ishay rules. Findings → steps or §9 deferrals.

#### Phase 4 — Control & integration

**Step 4.1 — Approval flow edges 🔻🤖.** Goal: prove the conversion's integrity edges. Files: none new (SQL + live UI). What: E2E+SQL: approve → project 'טרם החל' born complete (event_name, customer_id, date, times, location, required_hostess_count=Σ, logistics rows count = non-hostess lines w/ serial numbers); vat_rate_snapshot=18.00 + closing_unit_cost frozen; past-date quote → blocked w/ friendly message (§7.32, today allowed); double-click → single project + friendly error; view-role sees no approve button AND direct RPC denied. Verify: evidence per assertion.

**Step 4.2 — Rejection & expiry 🔻🤖.** Goal: prove the rejection/expiry lifecycle. Files: none new. What: reject w/o reason blocked; 'אחר' w/o notes blocked; rejected quote fully locked (edit UI hidden + direct UPDATE errors); expiry job simulation → rejected+'פג תוקף' appears in נדחו tab + breakdown; ⭐ chip counts quotes ≤7d. Verify: evidence.

**Step 4.3 — E2E suites 🔻🤖.** Files: e2e/quotes.spec.js, e2e/prices.spec.js. What: CEO+STAFF journeys per Test Identities (create→edit→reject; create→approve→locked; prices CRUD as CEO; denied as non-CEO). Serial (workers=1 config). Verify: `npm run test:e2e` all green (existing 3 suites too).

**Step 4.4 — Regression 🔻🤖.** Goal: nothing existing broke. Files: none. What: `npm run verify` green; manual smoke M1 (login/permissions matrix) + M2 (customers list/card). Verify: command output + screenshots.

**Step 4.5 — Phase-4 gate 🔻👤.** Hebrew report + evidence.

#### Phase 5 — QA & handoff

**Step 5.1 — Acceptance scenario 🔻🤖 screenshot.** Goal: the binding spec test. Files: none. What (`modules/module_03_quotes.md` ⑤): existing customer 5% fixed discount, 300 guests, 4h, 300 B-REG-TAG + 300 B-FAB-LAN, 10% manual → UI shows **6,319 ₪ exactly**; PDF matches; approve → project 'טרם החל'. Verify: screenshots + SQL of frozen rows.

**Step 5.2 — QA matrix + DoD walkthrough 🔻🤖.** Goal: honest closure inputs. Files: this guide. What: fill as-run; every DoD box evidenced or ❌-with-reason (honest reporting). Verify: updated §6/§7 of this guide.

**Step 5.3 — Docs closure 🔻🤖.** Goal: leave the doc-system consistent. Files: PROJECT_MASTER.md, docs/micro_guides/module-1.md, docs/db_roadmap.md, CLAUDE_CODE_LOG/STATUS. What: §6: mark the 4 delivered מ3 debts done (strikethrough+date; the 🚧 מ10 auto-email line was already added 15/07/2026 at blueprint save) — **and name the FUTURE modules each change lands on (M6/M10) in the §6 line + db_roadmap §10 Done-row, so their opening session finds it** (`CHANGELOG` was retired 23/07/2026 — this replaces the old "name modules in the CHANGELOG line"); fix module-1.md "params UI → M9" note (design-notes risk #7); db_roadmap rows (A-9/11/12/14/17/19, C-1, C-6, §7.85, §6 table rows) marked applied; CLAUDE_CODE_LOG; STATUS. Verify: greps + diff review.

**Step 5.4 — Closing audit + PR 🔻👤.** FRESH session runs the `module-close` skill (its `template.md` — the ex-`create_module_final_test_template.md`, relocated 23/07) with MODULE_NUMBER=3 · MODULE_NAME=הצעות מחיר · BRANCH_NAME=ishay/module-3-quotes-build: independent re-verification → DoD **typed-echo** sign-off → PR instructions (base:dev ← ishay/module-3-quotes-build) + 🧩 Chrome prompt. Post-merge items (PR/CI/merge) are NOT audit checkboxes. ↳ as-built (23/07): template path moved into `.claude/skills/module-close/`; branch corrected to the live `-build` branch.

### 6. 📊 QA Matrix

| Type | Planned | As-run |
|---|---|---|
| Unit | pricing.js (6,319 exact, tiers, discounts, ceil), catalog labels vs DB CHECKs, validators | |
| Integration | RPC battery (approve/double-click/rollback/permission), lock trigger, expiry job manual run, impersonation RLS matrix | |
| E2E | quotes.spec.js + prices.spec.js (CEO+STAFF journeys) + existing 3 suites | |
| Regression | `npm run verify` + M1/M2 smoke screenshots | |
| UAT | Deferred to M12 (§6 ruling); Ishay's phase gates = interim UAT | |
| Security/Pen | RLS positive+negative controls, §7.83 open-read proof, DEFINER RPC internal check, advisors after every migration | |
| Performance | Index C-6 used by expiry scan (EXPLAIN evidence); no further targets (internal tool) | |
| Usability | Filled from step 3.7 🎨 review + closing UX audit | |
| Compatibility | Chromium only now; cross-browser sweep = pre-M5 (§6 ruling) | |

### 7. ✅ Definition of Done
Canonical (architecture_and_qa_roadmap.md:32-41) instantiated:
- [ ] `npm run verify` green.
- [ ] Unit tests exist for all new `src/lib` logic (pricing/catalog/validators).
- [ ] 5 migrations applied via MCP after typed-echo; `docs/schema.sql` snapshot refreshed; committed together.
- [ ] CLAUDE_CODE_LOG + STATUS updated (end-of-session protocol each session; `CHANGELOG` retired 23/07/2026).
- [ ] No secrets in code (CI gitleaks green locally).

Module-specific:
- [ ] Seed counts exactly 11/40/20 + name-match audit (20 param names = code strings).
- [ ] 6,319 ₪ EXACT in unit test AND live UI AND PDF.
- [ ] Policies: quotes 2 · quote_services 2 · catalog 3×2; impersonation matrix evidence.
- [ ] Lock: UPDATE/DELETE on non-in_progress errors (SQL evidence).
- [ ] RPC: born-complete project + logistics rows + freezes + double-click safe + permission-checked.
- [ ] pg_cron: 2 jobs scheduled (fixed UTC hour per §7.56 nod) + simulated-run evidence.
- [ ] PDF: Hebrew RTL + embedded font screenshot (§7.41 — real verification, no rubber-stamp).
- [ ] Rejection requires reason (7 values); 'אחר' requires notes; expiry lands as 'פג תוקף'.
- [ ] §6 מ3 debts closed (history/metrics/filter/contacts-note) + module-1.md correction + db_roadmap updated.
- [ ] UX-&-validation checkbox: 🎨 review passed (design/states/RTL/keyboard) + validation-completeness (spec'd implemented, spec-silent confirmed).

Post-merge (NOT audit checkboxes): PR opened, CI green, merged to dev.

### 8. 🔄 Self-Update Protocol
(a) Every step transition updates the status header + step table in the same session, before moving on. (b) Any deviation gets an inline "↳ as-built" note on the step + a line in §9. (c) The repo's Stop hook (`.claude/hooks/check-docs-updated.sh`) blocks session end if module code under `src/modules/03_*/` changed but this guide didn't — keep it current, not as an afterthought. (d) End-of-session protocol in `CLAUDE.md` applies (CHANGELOG → CLAUDE_CODE_LOG → STATUS). (e)–(g): per CLAUDE.md iron rules 13/15/16 + end-of-session protocol (new §7 questions → presented in Ishay's question style and registered, never self-answered; migrations/DB gaps ⇒ db_roadmap same session; schema/shared-surface changes name the FUTURE modules they land on in the CHANGELOG line). (h) On ENTERING a phase: sweep this Ledger for OPEN/nod-pending items anchored to this phase's steps and present them to Ishay for a consolidated ruling (P13 style) BEFORE the phase's first step — currently only LOCAL-6 is OPEN (anchored to step 3.1).

### 9. 📝 Deviations & Tech-Debt Log
- 15/07/2026 01:05 — **5 risk-mitigation additions (Ishay's request, "how do we reduce failure odds") baked into steps, not scope changes:** (1) step 1.0 — resolve LIVE which test role = 'מנהלת פרויקטים' + confirm E2E credential coverage NOW instead of discovering the gap at step 4.3; (2) step 1.1 — sandbox-test the `estimated_hours` wrap-around `extract(epoch…)/3600` expression via `execute_sql` against the 20:00→02:00→6.00 example before it goes into DDL (Postgres `time−time` returns an interval, easy to get wrong); (3) step 1.4 — mechanical `information_schema.columns` cross-check of every NOT-NULL-no-default column on `projects`/`logistics` against the RPC's INSERT list, instead of relying on re-reading this guide from memory (this exact class of gap was already caught once by the fresh-context reviewer); (4) step 1.5 — `search_docs` for pg_cron-on-Supabase specifics (execution role, RLS interaction) before authoring, since M3 is the first pg_cron consumer with zero local precedent; (5) step 3.1 — test worst-case MIXED-direction PDF content (Latin SKU + Hebrew color + ₪ amount) as the FIRST render, not Hebrew-only text, since bidi bugs don't show up in Hebrew-only strings. Explicitly declined as gold-plating: a second PDF-library fallback beyond the two already listed, deep E2E content-assertion of PDF bytes, and pre-building role-credential infrastructure beyond flagging the gap.
- 22/07/2026 20:45 — **as-built (solo reorg ripple, docs only — no engineering change):** ownership/path wording updated (Owner cell, guide path `amit/07`→`modules/module_03_quotes.md`, two retired 📣 instructions in steps 5.3/§8). Step 1.0's branch check was made **name-agnostic** — it verified `ishay/module-3-quotes` by name, which breaks the moment PR #9 merges and the build moves to a fresh branch; it now checks whatever branch is current against `origin/dev`. Step count (28), §7 citations (35) and the 6,319 ₪ acceptance case are unchanged.
- 15/07/2026 00:50 — **as-built lesson (FK-index coverage):** FK columns added mid-blueprint via a PM-interview/AskUserQuestion ruling (e.g. LOCAL-5's `projects.customer_id`) don't automatically inherit db_roadmap's C-1 coverage — the pre-existing C-1 list predates them. **Cross-check C-1 explicitly whenever a blueprint ruling adds a new FK column.** (Ishay caught the missing `projects.customer_id` index post-approval; a live FK-vs-index audit then confirmed the 8 pre-existing unindexed FKs all match C-1, and that M3 is the first writer to `projects`/`logistics` so `projects.owner_email` + `logistics.sku` covering indexes were pulled into migration 1.1 too. The mechanical backstop is C-4: the "zero new advisor findings" gate on every migration would flag any brand-new unindexed FK regardless of memory.)
- 15/07/2026 00:29 — Blueprint approved (fresh-context reviewer READY-WITH-FIXES → 12 findings applied; LOCAL-1/2/5 + §7.56 ruled by Ishay in-session). Known deviations from frozen spec carried in: 7 rejection reasons vs C6's 4 (§7.82 F2/F3, documented deviation) · PDF 2 discount lines vs C5 single-line example (F10) · prices tab = approved addition beyond spec (§7.84) · quote history in customer card = approved addition (§6, "אפיון-שותק — אושר ע"י ישי 11/07") · pdf_url unused (deprecated §7.12; DROP = M12 §7.71) · canonical SKUs per seed decision #2/13 vs C5 variant spellings (known defect #5) · projects time columns pulled forward from M4 to M3 (LOCAL-1 ruling, §7.47 updated).
- Deferred: §7.67 (M4) · §7.72 (M6) · §7.77 (M6/8) · full params screen (M9) · auto email send (M10, 🚧 §6 line added 15/07) · cross-browser (pre-M5) · UAT (M12).
