# Module 3 — הצעות מחיר (Quotes) · Micro-Guide

> Machine-first build blueprint. Primary reader: a future Claude Code session with zero memory. Hebrew appears only as data (DB values, UI strings). Chat reports to Ishay are always in Hebrew. Hierarchy of truth: `docs/schema.sql` ➔ approved spec (C5/C6 via PROJECT_MASTER) ➔ mockups ➔ this guide.
> Approved by Ishay 15/07/2026 (blueprint session; fresh-context reviewer passed READY-WITH-FIXES, all 12 findings applied; 4 residual questions ruled in-session).

### 1. 🟢 Live Status Header

| Field | Value |
|---|---|
| Module | 3 — הצעות מחיר (Quotes) |
| Owner | ישי (sole developer — all rulings and build; guide `modules/module_03_quotes.md` §③) |
| Branch | `ishay/module-3-quotes-build` (cut 22/07 from dev `a35c92f`, after PR #9 merged; the old `ishay/module-3-quotes` is now an ancestor of `dev` — dead, iron rule 10) |
| Status | ✅ **Phase 1 (DB) CLOSED — gate 1.7 approved by Ishay 23/07/2026 evening** (chat: "פאזה 2 אני ממשיך שבוע הבא"). Next: Phase 2 (business logic). Work resumes next week. |
| Last updated | 28/07/2026 23:40 (Phase-1 section compacted per §8(i) — context-architecture overhaul; no engineering change. Pre-compaction copy: `docs/archive/module-3_full_2026-07-28.md`) |
| **Active step** | **2.1** (`src/lib/pricing.js` SSOT + unit tests — the 6,319 gate) |

Step table (⬜ pending · 🔨 in progress · ✅ done · ⏸️ deferred · ❌ blocked):

| Step | Title | Status |
|---|---|---|
| 1.0 | Phase-1 preflight (branch, MCP, db_roadmap §1, ledger sweep) | ✅ |
| 1.1 | Migration 1: structure & constraints (quote_services rebuild §7.85 + quotes columns + CHECKs + numeric(12,2) + UNIQUE(param_name) + indexes C-1/C-6 + projects snapshot/time columns) 🔻👤 typed-echo | ✅ (MCP restored mid-session; advisors: −6 unindexed-FK cleared, +7 unused-index INFO [empty-table, benign], 0 new WARN) |
| 1.2 | Migration 2: Seed products(11)/price_tiers(40)/params(20) 🔻👤 typed-echo | ✅ (via MCP; 11/40/20 verified; templates=10 incl. survey-URL) |
| 1.3 | Migration 3: RLS policies (quotes/quote_services §7.21 · params/products/price_tiers §7.83) 🔻👤 typed-echo | ✅ (via MCP; 10 policies, 2/table; 5 tables cleared from rls_enabled_no_policy; §7.70 role-ownership map recorded for M9) |
| 1.4 | Migration 4: lock trigger (F5/§7.50) + conversion RPC (§7.49/76/F22) + atomic edit RPC (F17) 🔻👤 typed-echo | ✅ (via MCP; full battery: happy/double-click/lock/permission/no-orphan all pass; lock-fn revoke folded into mig 5) |
| 1.5 | Migration 5: pg_cron install + expiry job (§7.42/F4/§7.56) + login_attempts cleanup (§7.75) 🔻👤 typed-echo | ✅ (via MCP; 2 cron jobs active; expiry+cleanup logic verified; lock-fn revoke cleared the 2 advisor findings) |
| 1.6 | RLS + RPC verification battery (impersonation matrix + positive control) 🔻🤖 | ✅ (matrix passed: CEO/projmgr[edit]+finance[view] see quotes, logistics[blocked]=0; catalog open-read to all 4 roles=11 products; products write CEO-only [logistics DENIED, CEO ALLOWED]) |
| 1.7 | Phase-1 gate: schema.sql snapshot + advisors + db_roadmap update + report 🔻👤 | ✅ (all gate inputs done in-session [snapshot synced, advisors run, db_roadmap §10 row, report]; **Ishay approved 23/07 evening via chat — "פאזה 2 אני ממשיך שבוע הבא"**) |
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
| LOCAL-6 | ✅ RULED: quotes.notes renders as a distinct "הערות" block on the PDF **after the pricing waterfall, before the static "תנאים כלליים" terms** (so the money flow reads uninterrupted: lines → totals → notes → terms; C5:227 satisfied — notes ARE customer-facing). Ishay picked this over "under the lines table" (the blueprint's original recommendation) | ישי | 23/07 | 3.1 |
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

#### Phase 1 — DB, Seed, RLS, engine-room ✅ **CLOSED 23/07/2026 (gate 1.7 approved by Ishay)**

> **Compacted 28/07/2026** per §8(i). The step-by-step build instructions are spent — the authoritative
> record of what was built is the five migration files themselves (`supabase/migrations/20260723*.sql`),
> `docs/schema.sql` (module-3 delta block), and `docs/db_roadmap.md` §10. Full pre-compaction text:
> `docs/archive/module-3_full_2026-07-28.md`. Deviations and as-built notes stay in §9 below.

| Step | What landed | Evidence |
|---|---|---|
| 1.0 | Preflight: branch not merged · MCP · db_roadmap §1+§6 · ledger sweep · **early E2E-credential risk check resolved** (approval role `מנהלת פרויקטים` = edit; `.env.local` covers CEO-edit + logistics-blocked; projects-mgr/finance verified by SQL impersonation, no invented creds) | §9 (23/07 14:15) |
| 1.1 | `20260723111005_module3_quotes_structure_and_constraints` — `quote_services` rebuilt in-place to `line_id` identity PK (§7.85) · `quotes` VAT snapshot + times + `estimated_hours` GENERATED with +24h wrap (LOCAL-2/F23) + 7 rejection reasons + discount CHECKs · `projects` identity/time snapshot cols (§7.76/LOCAL-1/LOCAL-5) · 7 C-1/C-6 indexes · `params` UNIQUE | advisors: −6 unindexed-FK, +7 unused-index INFO (empty-table), 0 new WARN |
| 1.2 | `20260723112000_module3_seed_products_tiers_params` — 11 products / 40 tiers / 20 params, per the locked `products_and_params.md` | counts + spot checks (VAT 18 · ratio 50 · 04ST 500.00 · B-REG-TAG@201 5.00 · B-FAB-LAN@201 6.00); `templates`=10 (9 emails + survey URL) |
| 1.3 | `20260723113500` — 10 RLS policies: quotes/quote_services per §7.21, catalog open-read + CEO-write per §7.83 | `pg_policies` 2/table; 5 tables cleared from `rls_enabled_no_policy` |
| 1.4 | `20260723115000` — lock trigger (F5/§7.50, plain OLD-status check) + `approve_quote_and_create_project` (§7.49, SECURITY DEFINER) + `replace_quote_lines` (F17) | rolled-back battery: happy path · double-click → friendly error · UPDATE-on-approved → lock error · view-role → permission error · forced mid-RPC failure → no orphan project |
| 1.5 | `20260723*_module3_pg_cron_expiry_and_cleanup` — quote-expiry job 01:00 (§7.42/F4/§7.56) + login_attempts cleanup 01:30 (§7.75) + lock-fn revoke | 2 active `cron.job` rows; backdated test quote flips to rejected+'פג תוקף'; revoke cleared 2 advisor findings |
| 1.6 | RLS/RPC impersonation matrix | CEO + projects-mgr (edit) and finance (view) see quotes; logistics = 0; catalog open-read to all 4 roles = 11 products; products write CEO-only |
| 1.7 | Phase gate | `schema.sql` synced · advisors run · db_roadmap §10 row · commit `fbe2287` pushed · **Ishay: "פאזה 2 אני ממשיך שבוע הבא"** |

**⚠️ Carry-forward into Phase 2+ (do not re-derive):** the RPC bodies live **only** in the migration file —
`schema.sql` carries signatures only. Two `pg_cron` jobs are **live in production right now** and mutate
`quotes` daily. The lock trigger fails **loudly** (`P0001`, Hebrew message) on any UPDATE/DELETE of a
non-`in_progress` quote — unlike every RLS denial, which fails silently as an empty result.

#### Phase 2 — Business logic (SSOT)

**Step 2.1 — pricing.js 🔻🤖.** Goal: the money SSOT (iron rule 14). Files: `src/lib/pricing.js`, `src/lib/pricing.test.js`. What: pure functions (no Supabase): `resolveUnitPrice(product, tiers, qty)` (§7.27 tie-break; base_price when no tiers); `computeLineTotal` (exact 2dp); `computeQuoteTotals(lines, appliedDiscount, manualDiscount, vatRate)` → {subtotal, discountAmount, preVat, vatAmount, total} all exact agorot (§7.25), additive discounts w/ validation ≤100 (§7.26); `recommendHostessCount(guests, ratio)` = ceil (F14); display helpers `formatShekelWhole` (F18); PRICING_PARAM_NAMES + parseVatPercent/parseGuestsRatio (from design notes — folded here, LOCAL-3). **F26 INVARIANT stated in file header comment: this engine knows only item×qty×price — no shift/hour semantics ever.** Tests: the 6,319 scenario EXACT (subtotal 6300.00, discount 945.00, preVat 5355.00, vat 963.90, total 6318.90, display 6,319) as the canonical test; tier boundaries (50/51, 200/201, 400/401, 1000/1001); unsorted tiers; qty below lowest tier → base_price; discount edge 0/100/101-rejected; combined >100 rejected; ceil recommendation (300/50=6, 301/50=7). Verify: `npm run test:run` → all green incl. 6,319 exact.

**Step 2.2 — catalog.js + validators 🔻🤖.** Files: `src/lib/catalog.js`+test, `src/lib/validators.js`+test (⚠️ shared-surface: additive block only — no other module's build is active). What: PRODUCT_CATEGORY_LABELS/STATUS_LABELS/COLOR options (matching DB CHECKs); validators per design-notes §5 (SKU_REGEX no leading hyphen, prices, ints, vat 0–100, ratio). Verify: tests green; labels byte-match DB CHECK values.

**Step 2.3 — api.js surfaces 🔻🤖.** Files: `src/modules/03_quotes/api.js`, `src/modules/01_auth/pricesApi.js`. What (pattern 02_customers/api.js toError): quotes: listQuotes(filters), getQuote(id) w/ lines, **createQuote + saveQuoteEdit both route through the atomic txn/RPC path (F17 — creation included, no half-states)**, approveQuote→rpc, rejectQuote(id, reason, notes), listQuotesByCustomer(customerId) (customer-card history §6), getPricingCatalog() (products active + tiers + 2 params); pricesApi per design-notes §3 (upsertPricingParam now SAFE to `.upsert()` — UNIQUE landed in 1.1; note deviation from notes). Verify: unit-less — exercised by E2E later; smoke via dev console against seeded DB (CEO login) showing catalog fetch 11 products.

**Step 2.4 — Phase-2 gate 🔻👤.** verify green + 6,319 test evidence + Hebrew report.

#### Phase 3 — UI (each unit: 🗣️ experience-brief → build → 🤖 functional+visual evidence w/ screenshots)

**Step 3.1 — PDF spike FIRST (risk #1) 🗣️ → 🔻🤖 screenshot ⚠️ shared-surface (package.json).** Goal: de-risk Hebrew RTL PDF before any screen. Files: `src/modules/03_quotes/quotePdf.js`, package.json. What: evaluate client-side lib (candidate order: @react-pdf/renderer w/ embedded Hebrew font e.g. Heebo/Noto Sans Hebrew; fallback pdfmake w/ vfs font). **⚠️ Test worst-case content FIRST, not hello-world Hebrew (risk-mitigation, 15/07):** most RTL PDF bugs only surface with mixed-direction content in the same line — build the very first test render using the actual worked-example line (a Latin SKU like `B-REG-TAG`, a Hebrew color name, and a ₪-amount together), not a Hebrew-only sanity string; a pass on Hebrew-only text proves nothing about the real bidi risk. Build minimal doc: header (validity+30d per param · quote id · issue date), customer block (name/ח"פ/primary contact — §6 contacts note), project block, lines table (מק"ט·תיאור·כמות·צבע·הערות·מחיר-יחידה·סה"כ-שורה), pricing waterfall (subtotal→customer-disc%→manual-disc%→pre-VAT→VAT 18%→total; 2 discount lines F10), static terms placeholder (F15) — structure per §7.12/quote_template_draft.docx. **LOCAL-6 RULED (Ishay, 23/07): `quotes.notes` renders as a distinct "הערות" block placed AFTER the pricing waterfall and BEFORE the static "תנאים כלליים" terms — build to this, no longer an open brief question.** STANDALONE pure function (quote data⇒doc blob) — §6 מ3 requirement, M10 lifts it. Verify: rendered PDF screenshot showing correct RTL Hebrew, embedded font, waterfall numbers — attached in chat. **If RTL fails → stop, report to Ishay immediately (watch-list).**

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
(a) Every step transition updates the status header + step table in the same session, before moving on. (b) Any deviation gets an inline "↳ as-built" note on the step + a line in §9. (c) The repo's Stop hook (`.claude/hooks/check-docs-updated.sh`) blocks session end if module code under `src/modules/03_*/` changed but this guide didn't — keep it current, not as an afterthought. (d) End-of-session protocol in `CLAUDE.md` applies (this guide → CLAUDE_CODE_LOG → STATUS; the CHANGELOG was frozen 23/07/2026 and is never written to). (e)–(g): per CLAUDE.md iron rules 13/15/16 + end-of-session protocol (new §7 questions → presented in Ishay's question style and registered, never self-answered; migrations/DB gaps ⇒ db_roadmap same session; schema/shared-surface changes name the FUTURE modules they land on in the CHANGELOG line). (i) **Compaction (added 28/07/2026 — this guide is read in full on every "תמשיך לבנות" turn, so it must not grow without bound):** when a phase closes, replace its step-by-step build instructions with a compact done-table — one row per step: what landed + the evidence that proved it — plus a short "carry-forward" note for anything later phases must not re-derive. **Never compact the active phase.** §9 (deviations/tech-debt) and the Ledger are **never** compacted; they are the memory. Archive the pre-compaction text under `docs/archive/` first. At module close the whole guide compacts to an as-built summary. (h) On ENTERING a phase: sweep this Ledger for OPEN/nod-pending items anchored to this phase's steps and present them to Ishay for a consolidated ruling (P13 style) BEFORE the phase's first step — as of 23/07 **0 OPEN items remain** (LOCAL-6 ruled 23/07: notes block after totals, before terms).

### 9. 📝 Deviations & Tech-Debt Log
- ✅ **CLOSED 29/07/2026 08:45 — the quality gates are now blocking; `npm run gate` exits 0.** Supersedes the two 🔴 entries below (kept verbatim for the record). Done **before** M3 close rather than at it, because the gates were blocking further M3 work. What landed: (1) all 10 `sonarjs/*` rules → `'error'` in `eslint.config.js`; (2) `continue-on-error: true` removed from the jscpd, knip and audit steps in `ci.yml`, and **four** stale comments updated — including the Lint step's own comment (`ci.yml:26-28`), which announced the flip as still-future; (3) every pre-existing finding resolved, not waived, **except one**: the last complexity holdout `MarketingPanel` was split 26 → 7 (`module-2.md` §9, same date); the three orphan devDependencies were removed with `npm uninstall` — **not** by hand-editing `package.json`, since CI runs `npm ci`, which fails hard when `package-lock.json` is out of sync (verified with `npm ci --dry-run`); `MARKETING_MAX_BYTES` was kept and *put to use* rendering the "עד 10MB" label, closing the export finding and a documented two-places-to-edit trap in one move. **`@testing-library/user-event` removal was Ishay's explicit call** (29/07) — unused by every test, one command to reinstall. **npm audit: 6 → 2**, and the remaining 2 rows are a single advisory — see the waiver entry below. **Verified:** `npm run gate` green end-to-end (verify → dup 0 clones → knip 0 findings → audit-gate → check:context) · 77 Vitest tests · E2E 10 passed / 2 skipped (pre-existing optional-role skips).
- ⏸️ **ACCEPTED RISK 29/07/2026 — `react-router` GHSA-qwww-vcr4-c8h2 (high), waived in `scripts/audit-gate.mjs`.** The advisory states verbatim: *"This only affects your application if you are using the unstable RSC APIs."* REG-IN is a client-side SPA — `BrowserRouter` at `src/App.jsx:38`, no server entry, no `react-router.config`, zero `unstable_`/RSC references anywhere in `src/`. The patched version is **8.3.0 (a major jump)**, and what npm actually offers is a **downgrade** to 7.11.0; we are on 7.18.1. Neither is worth doing for a vulnerability that cannot reach this app. **Mechanism (rule F1 — this replaces `npm audit --audit-level=high` in `package.json`, it is not an addition):** `npm run audit` now runs `scripts/audit-gate.mjs`, which blocks on every unwaived high/critical, prints each waiver with its reason on every run, and flags waivers that no longer match anything. **The gate was proven to fail, not just to pass** (Ishay's condition): removing the waiver temporarily → `exit=1` naming both packages; restoring it → `exit=0`. A gate that fails silently is worse than no gate. **Review trigger: adopting react-router 8.x, or the 19/09/2026 submission — whichever comes first.** Precedent for this record type: `module-1.md` §4 "Advisor acceptances".
- 🔴 *(superseded by the ✅ entry above — kept as the original wording)* **AT M3 CLOSE — harden the quality gates (deferred by Ishay's ruling 23/07/2026 22:35; extended 25/07/2026 22:35 when `knip` was added):** the code-quality tooling (jscpd `npm run dup` + `eslint-plugin-sonarjs` in `eslint.config.js` + `knip` `npm run deadcode`) was introduced in **warn-only / non-blocking** mode so it wouldn't block M3's existing code mid-build. **When this module closes, flip all three to blocking:** (1) in `eslint.config.js`, change the `sonarjs/*` rule levels from `'warn'` to `'error'`; (2) in `.github/workflows/ci.yml`, remove `continue-on-error: true` from both the "Duplication scan (jscpd)" step **and** the "Dead code scan (knip)" step; (3) first run `npm run lint` + `npm run dup` + `npm run deadcode`, resolve or explicitly waive each existing finding, so the newly-blocking gates start green. **jscpd's original clone (`UsersManagementPage.jsx`↔`CustomersPage.jsx`) was already fixed 25/07/2026** (extracted `src/components/LoadingOrError.jsx` — see `module-1.md`/`module-2.md` §9). **knip's first run (25/07/2026) found 4 real findings still open:** unused devDependencies `@testing-library/user-event`, `autoprefixer`, `postcss` (leftover from pre-Tailwind-v4 setup — the `@tailwindcss/vite` plugin handles PostCSS internally now); and an unnecessarily-exported `MARKETING_MAX_BYTES` in `src/modules/02_customers/api.js` (used only within that file). None fixed yet — Ishay's call at M3-close whether to remove/waive each. Tracked also in STATUS reminders.
- 🔴 *(superseded by the ⏸️ waiver entry above)* **Separate hardening item (25/07/2026 21:46) — `npm run audit` (CI step "Dependency vulnerability scan"), NOT tied to M3-close timing:** added `continue-on-error: true` like the other gates, but its trigger to remove that is different — **when the 4 existing high-severity findings (react-router/postcss/shadcn's own transitive deps, all pre-dating this session) are fixed or explicitly waived**, whichever session that happens in. `npm audit fix --force` would resolve some via breaking changes (e.g. downgrading `react-router-dom`) — needs a deliberate upgrade decision, not a reflexive `--force`.
- 23/07/2026 14:34 — **MCP restored mid-session; migration 2 (Seed) applied via `apply_migration`** (typed-echo: Ishay typed the name). Verified 11/40/20 + spot-checks. Note for future readers: `param_type='templates'` count = **10**, not 9 — `קישור_בסיס_סקר_לקוחות` is a `templates` row per the raw spec ("תבניות תוכן"), so 9 email templates + 1 survey URL. Asymmetry: migration 1 stays applied-but-untracked (manual, during the outage) while migration 2 is in `schema_migrations` (via MCP) — harmless, the repo files + live DB are the record (db_roadmap notes it).
- 23/07/2026 14:15 — **Phase-1 running under a Supabase-MCP outage (process deviation, not scope).** Every MCP call this session returned `-32600 permission-denied` (list_tables/execute_sql/get_advisors — confirmed consistent). Per the DB-protocol browser/CLI fallback: Ishay applies each migration manually via Studio SQL Editor, and — since he can run SQL — Claude uses him as a read-only `execute_sql` proxy (author query → he pastes result) to recover the live-verification the MCP normally provides. Step 1.0's live checks (16→**17** tables = the 16 + `customer_contacts`; quotes/quote_services=0; wrap-formula=6/3) and Migration-1 post-apply verification were all done this way. **Advisors run after each migration is DEFERRED** to when the MCP returns (or Studio→Advisors) — tracked; migration 1 net-removes 6 `unindexed_foreign_keys` findings and adds none.
- 23/07/2026 14:15 — **as-built (Migration 1): `quote_services` rebuilt IN-PLACE via ALTER** (drop composite PK → add `line_id` identity PK → re-add FKs/CHECKs), not DROP+CREATE. Same ruled §7.85 shape, but preserves the table's RLS-enabled state + `created_at`/`updated_at` + moddatetime trigger (which a DROP+CREATE would have had to reconstruct). Safe because the table was empty (verified 0 rows). The paste-version Ishay ran carried English comments + a `BEGIN/COMMIT` wrapper (paste-safety during the outage); the repo migration file + `schema.sql` delta block carry the canonical Hebrew comments — **DDL byte-identical**, comments don't affect the schema.
- 23/07/2026 14:15 — **Step 1.0 early-risk check RESOLVED (E2E credential coverage).** Live matrix: quote-approval role `מנהלת פרויקטים` has **edit** on 'הצעות מחיר' (as does מנכ"ל; finance=view; logistics/recruitment=blocked). UI-login creds in `.env.local` = `E2E_CEO`(מנכ"ל, edit) + `E2E_STAFF`(logistics, **blocked**). Coverage plan (no invented creds, per guide): happy path (create→approve→convert) via CEO (F19 — edit covers approve+convert); negative path via logistics-STAFF; the projects-mgr and finance-view paths are exercised by SQL-impersonation in step 1.6, which needs no login. **No blocking gap.**
- 15/07/2026 01:05 — **5 risk-mitigation additions (Ishay's request, "how do we reduce failure odds") baked into steps, not scope changes:** (1) step 1.0 — resolve LIVE which test role = 'מנהלת פרויקטים' + confirm E2E credential coverage NOW instead of discovering the gap at step 4.3; (2) step 1.1 — sandbox-test the `estimated_hours` wrap-around `extract(epoch…)/3600` expression via `execute_sql` against the 20:00→02:00→6.00 example before it goes into DDL (Postgres `time−time` returns an interval, easy to get wrong); (3) step 1.4 — mechanical `information_schema.columns` cross-check of every NOT-NULL-no-default column on `projects`/`logistics` against the RPC's INSERT list, instead of relying on re-reading this guide from memory (this exact class of gap was already caught once by the fresh-context reviewer); (4) step 1.5 — `search_docs` for pg_cron-on-Supabase specifics (execution role, RLS interaction) before authoring, since M3 is the first pg_cron consumer with zero local precedent; (5) step 3.1 — test worst-case MIXED-direction PDF content (Latin SKU + Hebrew color + ₪ amount) as the FIRST render, not Hebrew-only text, since bidi bugs don't show up in Hebrew-only strings. Explicitly declined as gold-plating: a second PDF-library fallback beyond the two already listed, deep E2E content-assertion of PDF bytes, and pre-building role-credential infrastructure beyond flagging the gap.
- 22/07/2026 20:45 — **as-built (solo reorg ripple, docs only — no engineering change):** ownership/path wording updated (Owner cell, guide path `amit/07`→`modules/module_03_quotes.md`, two retired 📣 instructions in steps 5.3/§8). Step 1.0's branch check was made **name-agnostic** — it verified `ishay/module-3-quotes` by name, which breaks the moment PR #9 merges and the build moves to a fresh branch; it now checks whatever branch is current against `origin/dev`. Step count (28), §7 citations (35) and the 6,319 ₪ acceptance case are unchanged.
- 15/07/2026 00:50 — **as-built lesson (FK-index coverage):** FK columns added mid-blueprint via a PM-interview/AskUserQuestion ruling (e.g. LOCAL-5's `projects.customer_id`) don't automatically inherit db_roadmap's C-1 coverage — the pre-existing C-1 list predates them. **Cross-check C-1 explicitly whenever a blueprint ruling adds a new FK column.** (Ishay caught the missing `projects.customer_id` index post-approval; a live FK-vs-index audit then confirmed the 8 pre-existing unindexed FKs all match C-1, and that M3 is the first writer to `projects`/`logistics` so `projects.owner_email` + `logistics.sku` covering indexes were pulled into migration 1.1 too. The mechanical backstop is C-4: the "zero new advisor findings" gate on every migration would flag any brand-new unindexed FK regardless of memory.)
- 15/07/2026 00:29 — Blueprint approved (fresh-context reviewer READY-WITH-FIXES → 12 findings applied; LOCAL-1/2/5 + §7.56 ruled by Ishay in-session). Known deviations from frozen spec carried in: 7 rejection reasons vs C6's 4 (§7.82 F2/F3, documented deviation) · PDF 2 discount lines vs C5 single-line example (F10) · prices tab = approved addition beyond spec (§7.84) · quote history in customer card = approved addition (§6, "אפיון-שותק — אושר ע"י ישי 11/07") · pdf_url unused (deprecated §7.12; DROP = M12 §7.71) · canonical SKUs per seed decision #2/13 vs C5 variant spellings (known defect #5) · projects time columns pulled forward from M4 to M3 (LOCAL-1 ruling, §7.47 updated).
- Deferred: §7.67 (M4) · §7.72 (M6) · §7.77 (M6/8) · full params screen (M9) · auto email send (M10, 🚧 §6 line added 15/07) · cross-browser (pre-M5) · UAT (M12).
