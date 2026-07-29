# Module 3 — הצעות מחיר (Quotes) · Micro-Guide

> Machine-first build blueprint. Primary reader: a future Claude Code session with zero memory. Hebrew appears only as data (DB values, UI strings). Chat reports to Ishay are always in Hebrew. Hierarchy of truth: `docs/schema.sql` ➔ approved spec (C5/C6 via PROJECT_MASTER) ➔ mockups ➔ this guide.
> Approved by Ishay 15/07/2026 (blueprint session; fresh-context reviewer passed READY-WITH-FIXES, all 12 findings applied; 4 residual questions ruled in-session).

### 1. 🟢 Live Status Header

| Field | Value |
|---|---|
| Module | 3 — הצעות מחיר (Quotes) |
| Owner | ישי (sole developer — all rulings and build; guide `modules/module_03_quotes.md` §③) |
| Branch | `ishay/module-3-quotes-build` (cut 22/07 from dev `a35c92f`, after PR #9 merged; the old `ishay/module-3-quotes` is now an ancestor of `dev` — dead, iron rule 10) |
| Status | 🔨 **Phase 3 (UI) in progress. Step 3.1 (PDF engine) DONE 29/07/2026 14:34 — `npm run gate` exit 0, 139 tests, worked example renders 6,319 ₪ exactly, verified visually in Chrome's real PDF viewer.** Phase 1+2 closed (see done-tables below). |
| Last updated | 29/07/2026 18:19 (**3.3 mockup approved** — see the step-3.3 blockquote below for the 7 rulings + what was rejected; no 3.3 code written by this session) |
| **Active step** | **3.3** (mockup approved, 🔻👤 gate passed — build against `docs/mockups/quote-screen/09_quote_management_approved.html`). ⚠️ **Iron rule 16 — a PARALLEL session is live on this branch** (caught via the pre-commit hook on an in-progress, uncommitted `src/lib/quotes.test.js` that imports 3.3 helpers — `matchesQuoteFilters`/`sortQuotes`/`deriveQuoteExpiry`/`countRejectionReasons`). **Confirm with Ishay who is building 3.3 before touching it.** Details: `CLAUDE_CODE_LOG.md` 18:19 entry. |

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
| 2.1 | `src/lib/pricing.js` SSOT + unit tests (6,319 gate) 🔻🤖 | ✅ (TDD: test written first, failed on unresolved import, then implemented. 29 new tests green; **6,319 exact** — subtotal 6300 · discount 945 · preVat 5355 · vat 963.90 · total 6318.90 · display `6,319 ₪`. Suite 77→106, all pre-existing green. `npm run verify` green; `npm run deadcode` clean — the flagged knip risk did not materialise) |
| 2.2 | `src/lib/catalog.js` labels + validators.js additions + tests 🔻🤖 | ✅ (labels/PRODUCT_UNITS/LINE_COLORS pulled live via `pg_constraint` — not read off docs — byte-match to the 4 CHECKs; 6 new validators added to `validators.js`, additive-only; caught+fixed a `Number(null)===0` blank-as-valid-zero bug in the two "0-is-valid" validators before it shipped, regression test added. Suite 106→124, all pre-existing green) |
| 2.3 | `src/modules/03_quotes/api.js` (+ prices tab api) 🔻🤖 | ✅ (writes route through `create_quote`/`replace_quote_lines`/`approve_quote_and_create_project` RPCs only, per F17; `rejectQuote` is the sole direct-update exception, documented + why. Live-DB smoke test of every query shape: 11 active products, 40 tiers, VAT=18/ratio=50 match exactly. Uncovered a real gate gap along the way — see below) |
| 2.4 | Phase-2 gate: verify green + 6,319 evidence 🔻👤 | ✅ **CLOSED 29/07/2026 09:58 — `npm run gate` exits 0** (not just `verify`). 124 tests green (was 77 pre-Phase-2); 6,319 exact (subtotal 6300/discount 945/preVat 5355/vat 963.90/total 6318.90/display `6,319 ₪`). |
| 3.1 | PDF engine spike: lib choice + Hebrew/RTL proof 🗣️→🔻🤖 screenshot | ✅ (`@react-pdf/renderer` 4.5.1 + vendored Heebo **TTF**; 15 unit tests; 3 render cases — worked example / 14-line overflow / minimal — all verified visually in Chrome's pdfium. Two silent traps found and documented, plus 3 defects Ishay caught live — see §9) |
| 3.2 | Quote builder screen (create+edit) 🗣️→🔻🤖 | ✅ (mockup approved 15:45 + 6 rulings; **live UI renders 6,319 ₪ exactly**; **save→DB and edit→save round-trip both proven through the real screen** — line numbering 1..3, cost frozen server-side, `manual_discount`=10 not silently 0, atomic replace keeps 3 lines; `npm run gate` exit 0, 177 tests. Three layout defects found by measurement — §9) |
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

#### Phase 2 — Business logic (SSOT) ✅ **CLOSED 29/07/2026 (gate 2.4, `npm run gate` exit 0)**

> **Compacted 29/07/2026** per §8(i). The step-by-step build instructions are spent — the authoritative
> record of what was built is the files themselves (`src/lib/pricing.js`, `src/lib/catalog.js`,
> `validators.js` additions, `src/modules/03_quotes/api.js`, `src/modules/01_auth/pricesApi.js`) and
> their test suites. Full pre-compaction text: `docs/archive/module-3_full_2026-07-29.md`. Deviations
> and as-built notes stay in §9 below.

| Step | What landed | Evidence |
|---|---|---|
| 2.1 | `src/lib/pricing.js`+test — money SSOT, TDD (test-first, watched fail, then implemented): `resolveUnitPrice`/`computeLineTotal`/`computeQuoteTotals`/`recommendHostessCount`/`formatShekelWhole`/`PRICING_PARAM_NAMES`/`parseVatPercent`/`parseGuestsRatio`. Whole-agorot integer math throughout (float-precision trap avoided by design, §9) | 29 new tests; **6,319 exact** (6300/945/5355/963.90/6318.90 → `6,319 ₪`); suite 77→106 |
| 2.2 | `src/lib/catalog.js`+test (labels/PRODUCT_UNITS/LINE_COLORS) + 6 new `validators.js` exports (SKU/price/int/vat/ratio), additive-only | labels pulled live via `pg_constraint`, byte-match to the 4 CHECKs; suite 106→124; caught+fixed a blank-as-0 validator bug pre-ship (§9) |
| 2.3 | `src/modules/03_quotes/api.js` + `src/modules/01_auth/pricesApi.js` — writes route through `create_quote`/`replace_quote_lines`/`approve_quote_and_create_project` RPCs only (F17); `rejectQuote` is the sole direct-update exception (documented why). ⚠️ **as-built: `listQuotes()` has NO `filters` param** (blueprint said `listQuotes(filters)`) — client-side filtering per M2's pattern; deviation recorded in §9 | live-DB smoke test of every query shape: 11 active products, 40 tiers, VAT=18/ratio=50 match exactly |
| 2.4 | Phase gate | `npm run gate` exit 0 (verify+dup+deadcode+audit+check:context); 124 tests; two real gate gaps surfaced and resolved same-session, not deferred — §9 |

**⚠️ Carry-forward into Phase 3+ (do not re-derive):** `pricing.js` computes in **whole agorot
(integers)**, converting to shekels only at the return — never re-derive totals from float shekel math
in UI code. `computeQuoteTotals` takes lines shaped `{qty, unitPrice}`; DB rows (`closing_unit_price`)
must be mapped to this shape by the caller. `api.js`'s `create_quote`/`replace_quote_lines` calls send
`jsonb` keyed by exact column names — a typo'd key doesn't error, it silently becomes `NULL`/`0` server-side
(see `src/modules/03_quotes/CLAUDE.md`). `knip.jsonc` carries a **temporary, dated exception** for
`api.js`+`pricesApi.js` (no importing screen yet) — remove it when Phase 3 wires the imports (3.2/3.3/3.6).

#### Phase 3 — UI (each unit: 🗣️ experience-brief → build → 🤖 functional+visual evidence w/ screenshots)

**Step 3.1 — PDF spike FIRST (risk #1) 🗣️ → 🔻🤖 screenshot ⚠️ shared-surface (package.json).** Goal: de-risk Hebrew RTL PDF before any screen. Files: `src/modules/03_quotes/quotePdf.js`, package.json. What: evaluate client-side lib (candidate order: @react-pdf/renderer w/ embedded Hebrew font e.g. Heebo/Noto Sans Hebrew; fallback pdfmake w/ vfs font). **⚠️ Test worst-case content FIRST, not hello-world Hebrew (risk-mitigation, 15/07):** most RTL PDF bugs only surface with mixed-direction content in the same line — build the very first test render using the actual worked-example line (a Latin SKU like `B-REG-TAG`, a Hebrew color name, and a ₪-amount together), not a Hebrew-only sanity string; a pass on Hebrew-only text proves nothing about the real bidi risk. Build minimal doc: header (validity+30d per param · quote id · issue date), customer block (name/ח"פ/primary contact — §6 contacts note), project block, lines table (מק"ט·תיאור·כמות·צבע·הערות·מחיר-יחידה·סה"כ-שורה), pricing waterfall (subtotal→customer-disc%→manual-disc%→pre-VAT→VAT 18%→total; 2 discount lines F10), static terms placeholder (F15) — structure per §7.12/quote_template_draft.docx. **LOCAL-6 RULED (Ishay, 23/07): `quotes.notes` renders as a distinct "הערות" block placed AFTER the pricing waterfall and BEFORE the static "תנאים כלליים" terms — build to this, no longer an open brief question.** STANDALONE pure function (quote data⇒doc blob) — §6 מ3 requirement, M10 lifts it. Verify: rendered PDF screenshot showing correct RTL Hebrew, embedded font, waterfall numbers — attached in chat. **If RTL fails → stop, report to Ishay immediately (watch-list).**

**Step 3.2 — Quote builder 🗣️ → 🔻🤖 ⚠️ shared-surface (App.jsx).** Files: QuoteBuilderPage.jsx, QuoteLineEditor.jsx, QuoteSummaryPanel.jsx, App.jsx route. What: customer picker (forgiving search via src/lib/customers.js patterns; shows 3 identifiers; "+ לקוח חדש" → CustomerFormDialog F25, auto-select); on select: pull name+discount_percent snapshot (F12 — snapshot at creation, not re-pulled on edit); event fields: name, estimated date, location, start/end times (F23; hours auto-shown from diff, wrap-around +24h w/ "נמשך אל תוך הלילה" hint — LOCAL-2), guests; ratio field prefilled from param (F20, transient override) → recommendation (ceil) + manual qty override; lines: active-products picker (§7.34), qty, auto unit price (tiers via pricing.js — UI imports, never computes), color picker (circle+label+'ללא', §7.41), per-line notes, line totals rounded display (F18); **general quote-level notes field (`quotes.notes`, C6:157 — C5:227 says notes appear on the quote document)**; soft hint if hours vs shift SKU mismatch (F21 — non-blocking); live summary (subtotal/discounts/VAT/total via pricing.js); actions: שמור ושלח (create, status in_progress) / עדכן הצעה (edit via atomic RPC); validations (required fields per C6: all except color/notes; discounts 0–100 combined ≤100; qty>0) — spec-silent ones flagged in the 🗣️ brief. **💭 Raise in the 🗣️ brief (non-binding, `PROJECT_MASTER §6`, 29/07): a quote-profitability view in `QuoteSummaryPanel` — `closing_unit_cost` is already frozen per line (§7.28), so a margin figure is near-free data-wise. Ishay's call whether to show it at all, and to whom.** Verify: preview flow screenshots — create quote w/ worked-example data → summary shows 6,319; edit → totals update; validation states.

**Step 3.3 — Quote management 🗣️ → 🔻🤖 ⚠️ shared-surface (App.jsx).**
> 🟢 **THE 🗣️ GATE IS ALREADY PASSED — Ishay approved the mockup 29/07/2026 18:15. Do NOT re-open it.**
> **Build to `docs/mockups/quote-screen/09_quote_management_approved.html`** (committed; open it in a
> browser). The prose below is the 15/07 blueprint and is still correct on *scope*, but where it and
> the mockup differ, **the mockup wins** — it carries seven of Ishay's rulings made after it was written:
> **(1)** exactly **2 metrics** beside the page title — "שווי הצעות פתוחות" + "שיעור אישור" with
> "1 מתוך 4 שנסגרו" under it (he rejected "סכום בצנרת" as translated jargon, and a 3rd tile).
> **(2)** tabs are **underline tabs** copied from `project-management-screen/01_overview_reworked.html`
> — a pill/chip version was rejected as "looking like filters, not tabs" — **plus a `הכל` tab**.
> **(3)** "פג בקרוב" is a **filter button in the filter row**, not a metric tile, and is **disabled at 0**.
> **(4)** default sort **"הקרוב לפוג ראשון"** (identical ordering to oldest-untouched, better name).
> **(5)** contact column = name + phone **+ mailto button**; a `tel:` dial button was **dropped** (on
> desktop it usually does nothing). **(6)** **"אחרי X% הנחה"** under the amount, only when a discount
> exists — the point is reading it beside "נבחר מתחרה" in the נדחו tab. **(7)** rejection-reason
> breakdown line in the נדחו tab. **Explicitly rejected — do not add:** duplicate-quote, gross-margin
> column (8th column, no room), quote-send date (the expiry countdown says it better), guest count
> (no decision on this screen uses it). **Row actions:** in_progress = ✎ · PDF · ✓ · ✕ ; closed = 👁 · PDF.
> ⚠️ **Blocked sub-item — needs its own 👤 typed-echo migration before it can be built:** Ishay approved
> an **8th rejection reason `נפתחה בטעות`** (today a mistakenly-created quote can only be *rejected*,
> which then pollutes the approval rate). Requires: CHECK migration + exclusion from the approval-rate
> formula + a §7.82/F2 write-back. **Seed data already exists** (`node scripts/demo-seed.mjs`). Files: QuotesPage.jsx, RejectQuoteDialog, ApproveQuoteDialog, App.jsx. What: tabs by status w/ counts (F24 pattern from 01_overview_reworked.html): בתהליך/מאושרות/נדחו; ⭐ "פג בקרוב" highlighted filter chip w/ count (≤7 days to expiry, sorted by proximity — LOCAL-4); filters: customer, event-date range, quote-date range; rejection-breakdown counts in rejected tab (§7.82); sorts: amount/event date/expiry proximity; row actions per status: edit (in_progress), approve ✓ (green confirm modal §4), reject ✗ (red modal: 7-reason dropdown + notes required iff אחר), view (read-only QuoteReadOnlyView + הפק PDF). Verify: screenshots of tabs/filters/modals; counts match seeded test data.

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
- 29/07/2026 17:40 — **Step 3.3 🗣️ mockup, round 2 (`scratch.local/mockup_3_3.html`). Ishay's calls:**
  KPI strip cut 3 tiles → **2** ("שווי הצעות פתוחות" — he rejected "סכום בצנרת" as imported jargon —
  and "שיעור אישור" with "1 מתוך 4 שנסגרו" beside it, since a bare 25 % on four closed quotes
  misleads). **"פג בקרוב" appeared twice** (tile + chip); the tile went, the **chip stayed and moved
  into the filter row** — he reads it as an action trigger ("call them"), not a statistic.
  **"+ הצעה חדשה" moved into the tab bar.** Tabs were rebuilt as **underline tabs** copied from
  `01_overview_reworked.html` — my pill version "looked like filters, not tabs".
  **Added `הכל` as a 4th tab** (his own `quote-screen/01.png` has it, and it is the only extra tab our
  3-value status model can justify — see below). Contact column added with the customer's name, phone
  and a **mailto** action; the **tel: "dial" button was dropped after I said plainly that on desktop it
  usually does nothing** — same mechanism as M2's marketing mailto, no new infrastructure.
  Column padding unified to 14px with flush card edges.
  **↳ Why no more tabs (the reasoning, so it is not re-litigated):** tabs must be **mutually exclusive
  states of the same row**, and `quote_status` is frozen at 3 values (§7.82/F16). "טיוטה" would need a
  new status (DB + spec change; the app Ishay screenshotted has one, we deliberately do not).
  "פג תוקף" is a **rejection reason** here (§7.41), already visible inside נדחו with its reason — a tab
  would duplicate it. "פג בקרוב"/"אירוע קרוב" **cannot** be tabs: a quote is `בתהליך` *and* expiring at
  the same time, so they are filters by definition.
  **↳ Measurement pass caught two defects before hand-off:** the amount column was not right-aligned
  across rows (min-width + text-align fixed it, header included, per his request), and `class="ltr"`
  applied to a `<td>` set `display:inline-block`, dropping that cell out of the table layout — the
  "מס׳" column sat 10.4px off its header. `td.ltr{display:table-cell}` restores it. Both were invisible
  in a screenshot.
- 29/07/2026 16:21 — **Step 3.2 BUILT and self-verified. Three defects were found by *measuring* the
  live screen; none of them was visible in a screenshot, and one was invisible without scrolling.**
  Files: `QuoteBuilderPage.jsx` · `QuoteLineEditor.jsx` · `QuoteSummaryPanel.jsx` · `CustomerPicker.jsx`
  + shared `LtrFieldGroup.jsx`/`Money.jsx` + `src/lib/quotes.js`(+test) + `App.jsx` routes
  (`/quotes/new`, `/quotes/:quoteId/edit`; `/quotes` itself stays `UnderConstruction` until 3.3).
  **Verification (🤖):** a throwaway Playwright spec logged in as CEO, seeded a 5 %-discount customer,
  drove the full worked example through the real UI, asserted **`6,319 ₪` exactly**, then deleted the
  customer. Spec removed afterwards — the permanent suite is step 4.3.
  **↳ 17:13 — the picker bug that automated tests pass on, and Ishay caught by hand.** Selecting a
  customer did nothing, and neither did "+ לקוח חדש". Cause: the panel closed on `onBlur` via a 120 ms
  timer; a **human** mousedown→mouseup lasts longer than that, so the panel vanished mid-click and the
  `click` landed on a removed element. **Playwright clicks instantly and therefore always beat the
  timer — the suite was green on broken code.** Fixed with `onMouseDown → preventDefault()` on the
  panel so focus is never lost (no timer, no race). **Proven to fail, not just to pass** (Ishay's
  standard): the broken version was temporarily restored and the new slow-click spec (`mouse.down` →
  400 ms → `mouse.up`) failed on it, then passed on the fix. Swept `src/` for the pattern — this was
  the **only** floating panel of its kind; every other `setTimeout` is toast/copy-feedback/dialog-close
  and none races a click. Registered as a permanent mine in `src/CLAUDE.md`, including the rule that a
  test covering it must use down→wait→up.
  **↳ 17:20 — dialog corners (shared surface, module 2).** Full record in `module-2.md` §9: the fix
  lives in `components/ui/dialog.jsx` and the three M2 call sites lost their outer `overflow-y-auto`.
  ⚠️ The first attempt clipped the dialog's bottom — a flex child needs `min-h-0` to shrink below its
  content height. Ishay caught that within a minute too.
  **↳ 17:04 — customer-picker label shortened to "לקוח *".** The parenthetical listing the three search
  channels duplicated the placeholder inside the box itself; same information twice is noise by the
  rule the rest of this screen follows. Ishay also asked whether picking a customer actually fills the
  field — it does, and it was **re-proved rather than asserted** (selection shows the company name with
  a ✕ to swap, and the ח"פ / contact / 5 % discount chips populate from the chosen customer).
  **↳ Three more from Ishay driving the live screen (16:57) — all UX-friction he felt and I hadn't:**
  (a) numeric fields pre-loaded with a default (qty `1`, discount `0`, computed headcount) forced a
  **delete-then-type** on every edit. Fixed with select-on-focus, placed inside `LtrFieldGroup` (so every
  future numeric field inherits it) plus the qty input. Note the deliberate limit: re-clicking an
  **already-focused** field does not re-select — that click means "place the caret", not "wipe it".
  (b) The tier caption now renders **only when the tier actually beat the base price**. At 30 units
  "מדרגה 1–50" restates the list price and is pure noise; at 300 units (5 ₪ vs a 6 ₪ list price) it is
  the difference between "the system is wrong" and "the quantity earned a discount" — which is the
  capability this module exists for. Same rule as everything else: say something only when there is
  something to say.
  (c) My verification spec failed first and the failure was **in the spec, not the product** — it clicked
  an already-focused input and appended (`30` → `30030`). Fixed the test, not the code. Worth recording
  because the instinct on a red test is to "fix" the source.
  **↳ Two corrections from Ishay after he used the live screen (16:49):** (a) **hostess count must be
  directly editable** — "I don't want to work out in my head which ratio yields 7". He is right and it
  overrides my earlier objection (I had argued a second entry point would be ambiguous against the
  service lines). Resolution: the formula's third cell is now an input storing
  `recommended_hostess_count`; changing guests/ratio refreshes it, and a "back to the recommendation"
  shortcut appears **only** when the two differ. Safe because the field never feeds pricing and never
  determines the project — the approval RPC sums the actual hostess-line quantities (F22).
  Validation added: the field can now be emptied, and empty would reach the server as `NULL` and blow
  up on `CHECK recommended_hostess_count > 0` with an unreadable error. (b) **SKU removed from the
  line editor** — internal stock code, meaningless to whoever builds a quote; it stays on the customer
  PDF where it belongs to a formal document. Both verified live (manual 7 → saved 7 → reloaded as 7).
  **↳ A gap I admitted before Ishay hit it, then closed (16:40):** the first verification filled the
  form and asserted the total but **never clicked save** — so the single most important path ("does a
  quote actually persist?") was unproven, and edit mode had never been opened at all. Closed with a
  second throwaway spec: create-through-the-screen → assert the DB row (status, guests,
  `recommended_hostess_count`=6, **`manual_discount`=10 and not a silent 0** — the jsonb-key trap,
  `line_number` 1..3 with no gaps, `closing_unit_cost` frozen by the server, subtotal 6300) → reopen in
  edit mode (fields load, `applied_customer_discount` comes from the **quote**, F12) → change a qty →
  save → assert the atomic replace still yields exactly 3 lines numbered 1..3. Both specs deleted; the
  permanent suite is 4.3.
  **↳ Demo seed landed (`scripts/demo-seed.mjs`, reversible via `--reset`):** 4 customers + 8 quotes
  (4 in_progress · 1 approved · 3 rejected incl. 'פג תוקף'), all created through `create_quote`/
  `approve_quote_and_create_project` — never by direct table writes, so line numbering, cost freezing
  and RLS all behave exactly as for real data. The approved one proved the conversion end-to-end:
  project `not_started`, `required_hostess_count`=6, VAT snapshot 18.00, **2 logistics rows derived**.
  ⚠️ **Known limitation:** `updated_at` is set by the `moddatetime` trigger and cannot be back-dated,
  so nothing looks old and the "פג בקרוב" chip will legitimately show 0 — real ageing belongs to the
  M12 dataset. ⚠️ The tier-selection rule is **duplicated** inside the script (Node cannot import
  through Vite's `@/` alias); a change to `pricing.js`'s tier rule must be mirrored there.
  **↳ The three defects, and why eyeballing missed them:**
  (1) **Horizontal page overflow, 1456 px in a 1280 px window.** Cause is a CSS-grid subtlety worth
  keeping: a `1fr` column is `minmax(auto,1fr)` and therefore **refuses to shrink below its content**.
  The services table carries a `min-width` for readability, so the whole page grew and the table's own
  `overflow-x-auto` never engaged. Fix: `minmax(0,1fr)`. In RTL this is worse than usual — the hidden
  content sits on the side nobody scrolls to.
  (2) After the fix the table scrolled internally and pushed **`סה"כ שורה` out of view** — the one
  column the screen exists for. Fixed by re-tuning `min-w` 52rem → 40rem and the summary column 19 → 17rem.
  (3) `input[type=number]` spinners ate ~16 px and clipped `300` to `30` inside the narrow formula cell.
  **↳ as-built deviations:** (a) `LtrFieldGroup` renders the `<input>` itself (rather than accepting a
  child) so label/field id-pairing cannot be broken by a caller. (b) `Money` is a component, not a
  helper call, for the same reason — a raw `formatShekelWhole()` in JSX still flips by context.
  (c) `knip.jsonc`: `03_quotes/api.js` **removed** from the ignore list (3.2 imports it for real);
  `pricesApi.js` stays until 3.6. The four not-yet-consumed api exports carry scoped `/** @public */`
  tags naming their step — the same precedent as `renderQuotePdfBlob` in 3.1, not a blanket waiver.
  (d) Two constants I had added ahead of need (`EXPIRY_REJECTION_REASON`/`OTHER_REJECTION_REASON`)
  were **deleted** rather than tagged — knip was right, they belong to 3.3.
  **↳ A test caught a real bug in my own validator** and forced a distinction worth stating: `Number('')`
  is `0`, so a blank manual discount passed as a legitimate 0. The fix is **not** the reflex "blank is
  never 0" documented in `pricing.js` — that rule is about a **system parameter** that failed to load
  (a blank VAT is a fault that must scream). An **optional user field** left blank genuinely means 0.
  What must never happen is non-numeric text becoming 0 silently; that is now explicit, with tests for both.
  **↳ Ishay's demo-data ruling (29/07):** he needs a system that looks a month old for the submission
  demo. **Split: a small realistic set now** (4 customers + ~8 quotes across statuses) because 3.3's
  tabs/counters/expiry-chip cannot be built or verified against an empty table — **and the full
  "month of usage" dataset deferred to M12**, since it needs projects/hostesses/logistics from M4–M6
  and would otherwise have to be built twice. Names: generic but realistic (his ruling). Delivery: a
  runnable + reversible script, never hand-typed rows. 🚧 מ12 — see `PROJECT_MASTER §6`.
- 29/07/2026 15:52 — **Step 3.2 mockup approved after ~11 correction rounds. The direction bug hit for the
  FOURTH time, and is now fixed structurally rather than by discipline.**
  **Ishay's rulings (all 6 binding):** profitability panel **visible to edit-permission holders** (§6 idea,
  §7.28 data) · unit price **locked** — negotiation goes through the manual discount, which stays recorded
  (deviates from the old mockup 05, where the price was editable) · past event date **blocked at creation**,
  not only at approval (**he overruled my soft-warning recommendation** — worth remembering as a preference
  signal: he prefers a hard block over a warning) · colour selector only for `category='product'` ·
  customer picker searches company/contact/ח"פ via M2's `matchesCustomerFilters`, **active customers only** ·
  hostess quantity editable **only** in the service line — two hostess SKUs (04ST/06ST) can coexist in one
  quote, so a second entry point in the formula group would be ambiguous about which line it means.
  **↳ Direction incident #4 — the ₪ sign rendered on OPPOSITE sides within one screen:** right of the digits
  in the summary panel (elements carrying `direction:ltr`), left of them in the services table (inherited
  RTL). Measured per-glyph with `Range.getBoundingClientRect()`, not eyeballed: summary `shekelX 113 >
  firstDigitX 87`; table `585 < 595`. **Canonical form: number then ₪** — what `formatShekelWhole()` already
  emits and what `quotePdf.jsx` prints; a screen that disagrees with the document we sent the customer is
  precisely the failure the money SSOT exists to prevent.
  **⚠️ My first direction pass PASSED this screen** — it measured column alignment only. Glyph-order
  checking (currency symbol and minus sign relative to the digits) had to be added. Both now in `src/CLAUDE.md`.
  **↳ Shared parts introduced (reusable by every future module, which is what makes this session's cost
  one-time):** `src/components/LtrFieldGroup.jsx` (one `dir="ltr"` grid; label row and value row generated
  from the **same** items array, so a label cannot sit above the wrong value) · `src/components/Money.jsx`
  (the only sanctioned way to render ₪; `unicode-bidi: isolate` so surrounding context cannot flip it) ·
  `findMatchingTier` exported from `pricing.js` so the screen can explain *why* a price is 5 ₪ without
  duplicating tier selection · `src/lib/quotes.js` (form rules, jsonb-key SSOT, profitability, form↔row mapping).
  **↳ Process failure, mine:** I began editing `pricing.js` before the mockup was approved. Ishay stopped it;
  the tree was reverted clean and the change re-applied only after approval. The 🗣️→approval→code gate exists
  for exactly this, and no deadline pressure justifies crossing it.
- 29/07/2026 14:34 — **Step 3.1 done. Two failure modes here are SILENT — neither throws, both
  produce a wrong document that looks plausible. Do not re-derive them in 3.4.**
  **(1) `@react-pdf/renderer`'s fontkit reads TTF/OTF only.** `@fontsource/heebo` (and every
  modern font package) ships **woff/woff2 only**. Registering a woff **succeeds** — no error, no
  warning — and then prints scrambled glyphs; woff2 prints nothing at all. Both were rendered and
  looked at before the cause was known. Fix: the two Heebo weights are **vendored as `.ttf`** under
  `src/assets/fonts/` (SIL OFL, license file beside them) and inlined as data-URIs via Vite's
  `?inline`, so there is no network fetch that can fail silently either. Extracted once from
  `@expo-google-fonts/heebo` (the only npm source shipping Hebrew TTF); that package is **not** a
  dependency.
  **(2) Bidi reorders character runs, not logical tokens.** A compound LTR token concatenated into
  a Hebrew string flips: `18:00–22:00` prints `22:00–18:00` — syntactically fine, **business-wrong**,
  and a customer would read the event as ending before it starts. **Ishay caught this in the mockup.**
  Two fixes that do NOT work (both tested and rejected): a nested `<Text direction:'ltr'>`, and the
  Unicode isolate characters LRI/PDI (U+2066/U+2069) — those order correctly but Heebo has no glyph
  for them, so they print as garbage *inside* the text. **What works: the value in its OWN `<Text>`
  with `direction:'ltr'`.** Hence the `<Ltr>` component — every SKU, date, time range, phone, ID and
  money amount goes through it, and none is ever concatenated to a Hebrew label.
  **↳ as-built deviations from the blueprint:** (a) file is **`quotePdf.jsx`**, not `.js` — it emits
  React elements and Vite only applies the JSX transform to `.jsx`; keeping it `.js` would have meant
  `createElement` for a whole document template. (b) A one-file `react-refresh/only-export-components`
  exemption in `eslint.config.js` — this module never renders to the DOM, so Fast-Refresh cannot apply;
  reasoned in place. (c) A `/** @public */` knip tag on `renderQuotePdfBlob` (its caller arrives in 3.4)
  — scoped to the single export, unlike Phase 2's whole-file ignores.
  **↳ Ishay's rulings during the step:** (i) **page 2 is a generic market-standard terms page** rather
  than cramming everything onto one page — `QUOTE_TERMS` grew 2 → 7 entries and the section carries
  `break`; the 5 added terms are **placeholder wording awaiting a legal pass**. (ii) Spacing/proportions
  re-tuned to the approved mockup after he flagged the first render as too tight. (iii) He spotted the
  **logo being stretched** — the `<Image>` had a width but no height, and flex's default
  `alignItems: 'stretch'` sized it to the neighbouring block; fixed with the file's true 272×99 ratio
  (`height: 43.7`, `objectFit: 'contain'`) plus `alignItems: 'flex-start'` on the header row.
  **⚠️ Carry-forward for 3.4 — do NOT preview the PDF with pdf.js.** Chrome's built-in viewer (pdfium)
  renders these files perfectly; **pdf.js rejects react-pdf's embedded font subset** (`OTS parsing error:
  maxp: Bad maxZones`, `Invalid font data in ArrayBuffer`) and drops narrow glyphs — an hour was spent
  chasing a defect that only ever existed in the diagnostic viewer. This is a known react-pdf trait
  (react-pdf issue #3047: custom fonts fine in standard viewers, encoding issues under PDF parsers).
  The `PdfPreview` glue must therefore be an `<iframe src={blobURL}>` (native viewer), not a pdf.js canvas.
  **Not covered yet:** no E2E asserts PDF bytes (deliberate, per the 15/07 anti-gold-plating list), and
  the document has only been read in Chromium — the cross-browser sweep is still the pre-M5 item.
- 29/07/2026 10:30 — **DEVIATION from the approved contract, caught by Ishay in a blueprint-vs-code
  comparison — the design choice was deliberate, but it was NOT recognised as a deviation and so was
  never recorded. That recording failure is the real defect here, not the choice.** Blueprint (15/07)
  specified `listQuotes(filters)`; as-built is **`listQuotes()`** — no parameter, always fetches every
  quote. **Why the code is this way:** it follows M2's established pattern (`listCustomers()` +
  `matchesCustomerFilters` in `src/lib/customers.js`) — fetch the full set the RLS allows, filter and
  sort client-side. Step 3.3's own spec in this guide ("filters: customer, event-date range,
  quote-date range" + tab counts + the ⭐ proximity chip) reads naturally as a client-side view layer,
  so the two are consistent. **Ishay reviewed and did not require a change** — the deviation stands,
  now documented. ⚠️ **Boundary worth stating once:** unlike `customers` (a stable-size list), quotes
  **accumulate indefinitely**, and this call additionally pulls nested `quote_services(*)` for every
  row. Fine at project scale; **this is the first place that would need real server-side filtering**
  if the table ever grows large. **Process lesson (the actual takeaway):** a deliberate design choice
  that silently contradicts an approved signature is indistinguishable from an oversight to a future
  reader. When following a precedent from another module, check whether the precedent contradicts
  *this* module's approved contract before adopting it — and if it does, that is a §9 line, even when
  the choice itself is right.
- 29/07/2026 09:58 — **as-built (step 2.3) + real ruling: `npm run gate` surfaced two genuine
  gaps that the phase-2 plan hadn't foreseen, both resolved same-session, not deferred.**
  (1) **knip flagged `api.js` + `pricesApi.js` as unused files** — correct as far as the tool can
  see: rule 12 (DB/RLS before UI) means Phase 2's API layer has no importing screen yet, and
  won't until Phase 3. Presented to Ishay as a live fork (scoped-and-documented knip exception
  now, vs. leaving `npm run gate` red until Phase 3 wires the imports); Ishay deferred to
  architectural judgment ("תעשה מה שנראלך שארכיטקט מנוסה היה עושה"). **Decision: scoped exception,
  same pattern as the existing `react-router` audit waiver** (`scripts/audit-gate.mjs`) — reasoned,
  dated, and carrying its own removal trigger, not a blanket loosening of the gate. Mechanically:
  `knip.json` → `knip.jsonc` (comment support) with the two files added to `ignore`, reason +
  removal trigger written inline. **Remove when Phase 3 steps 3.2/3.3 (quotes api.js) and 3.6
  (pricesApi.js) actually import them** — grep `knip.jsonc` at those steps. (2) **`check:context`
  requires every `src/modules/NN_*/` directory to carry its own `CLAUDE.md`** (module-close §4c) —
  a rule that predates Phase 2 but had never fired mid-build before, since M1/M2 only hit it at
  close. `src/modules/03_quotes/CLAUDE.md` created now, documenting only what Phase 2 actually
  built (the RPC-routing convention in `api.js`, the `rejectQuote` direct-update exception, the
  jsonb-key-typo-becomes-silent-NULL trap in `create_quote`/`replace_quote_lines`) — explicitly
  marked partial, to grow through Phase 3 rather than be rewritten. **Neither gap was a build
  mistake — both are the gate correctly catching structural consequences of rule 12 (phased
  build) and module-close §4c (per-module mines file) that simply hadn't collided with a
  mid-build session until now.**
- 29/07/2026 09:37 — **as-built (step 2.1): three contract decisions the blueprint left open. Later steps depend on them, so they are recorded rather than re-derived.** (1) **Money is computed in whole agorot (integers) end-to-end**, converted back to shekels only in the `return` — not "round to 2dp after each float op". `0.1+0.2 !== 0.3` is exactly the class of bug that yields 6,318.89; integers cannot express it. The combined-discount guard likewise compares in integer hundredths, because `33.33+66.67` is `100.00000000000001` in float and would have rejected a quote the DB's `numeric` CHECK accepts. (2) **`computeQuoteTotals` takes lines shaped `{ qty, unitPrice }`** — the canonical form. DB rows (`closing_unit_price`) are mapped to it in `api.js` (step 2.3), never inside the engine. (3) **`resolveUnitPrice` self-filters tiers by `product.sku`**, so callers may pass the whole tier catalog unfiltered; a tier row with no `sku` field is treated as belonging to the product. Beyond the blueprint's wording, deliberately: the alternative silently prices a product off another product's tiers. Empty/`null` inputs are rejected explicitly everywhere, because `Number(null) === 0` would have let a missing VAT param masquerade as a legitimate 0% VAT.
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
