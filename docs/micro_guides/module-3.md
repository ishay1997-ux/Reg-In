# Module 3 — הצעות מחיר (Quotes) · Micro-Guide

> Machine-first build blueprint. Primary reader: a future Claude Code session with zero memory. Hebrew appears only as data (DB values, UI strings). Chat reports to Ishay are always in Hebrew. Hierarchy of truth: `docs/schema.sql` ➔ approved spec (C5/C6 via PROJECT_MASTER) ➔ mockups ➔ this guide.
> Approved by Ishay 15/07/2026 (blueprint session; fresh-context reviewer passed READY-WITH-FIXES, all 12 findings applied; 4 residual questions ruled in-session).

### 1. 🟢 Live Status Header

| Field | Value |
|---|---|
| Module | 3 — הצעות מחיר (Quotes) |
| Owner | ישי (sole developer — all rulings and build; guide `modules/module_03_quotes.md` §③) |
| Branch | `ishay/module-3-quotes-build` (cut 22/07 from dev `a35c92f`, after PR #9 merged; the old `ishay/module-3-quotes` is now an ancestor of `dev` — dead, iron rule 10) |
| Status | 🔨 **Phase 4 CLOSED — gate 4.5 SIGNED by Ishay 01/08/2026 ~11:00 ("מאשר שער 4"), after his own 3-click live-eye pass: rejected-quote display ("עובד") · approved-quote lock ("עובד") · customer-page data flow ("עובד", incl. the open-quotes-value and avg-deal metrics he pointed out). Phase 5: 5.1+5.2+5.3 CLOSED. The 5.4 audit RAN (verdict [NO]-near-YES) — fix round in progress (item 1 of 3 landed, `ed2ca89`); remaining: items 2-3 → gate+E2E rerun → DoD typed-echo → PR.** Phase 1+2+3 closed (see done-tables below). |
| Last updated | 01/08/2026 (fix-round item 2) — **`cost ?? 0` closed: unknown purchase-cost now stays `null` end-to-end** (Ishay's delegated ruling — dashes on all three profitability fields + name the product; no partial profitability). Reported honestly as a **dormant** guard first (live DB: 0 products without cost). TDD — the pre-fix output was literally `{cost: 0, grossProfit: 5355, marginPercent: 100}`. First live probe **proved nothing** (edit-screen falls back to the frozen `closing_unit_cost` — real logic); redone on `/quotes/new` with a positive control. 384 unit · 73/73 E2E. See §9 (01/08, fix-round item 2). *(previous entry: 01/08/2026 (fix-round item 3) — **PDF BiDi fixed: all three defects were one root cause** (`direction` is not inheritable in react-pdf, so the originally-planned Page-level fix would have been a silent no-op — caught by reading the library source before writing code). `<Ltr>` hardened so no call-site can flip it. 2 new unit guards, both watched failing on mutations. **Money re-verified on real quote #21: 6,300→-315→-630→5,355→964→6,319 ₪ verbatim.** 378 unit · 73/73 E2E. ⚠️ DoD "PDF RTL" box **stays open** pending Ishay's eye. See §9 (01/08, fix-round item 3). *(previous entry: 01/08/2026 (fix-round item 1) — **quote-builder silent-panel bug fixed** (discounts >100% now show a clear Hebrew message instead of the summary panel/Save button silently vanishing; save stays blocked). E2E test added and watched fail-then-pass; live-verified in browser. See §9 (01/08, fix-round item 1). *(previous entry: 01/08/2026 06:4X — **steps 5.2+5.3 CLOSED (QA matrix as-run + docs closure).** Migration-count reconciled across 3 docs to one declared definition (`module3_` files = 10); §7.86 folder/registry drift re-measured live (22/21, confirmed same ruled pattern, not new); §4 gained round-G's cost-RLS-split note; §6 מ3 debts verified already closed by a prior session; §6 QA Matrix + §7 DoD updated with tonight's real evidence — **6,319-live-UI-and-PDF box closed**, **PDF-RTL box deliberately left open** (two real BiDi defects the work-manager found by visual review, pending Ishay). See §9 (01/08 06:4X). *(previous entry: 01/08/2026 06:1X — **step 5.1 CLOSED (the binding acceptance scenario, built live through the real screen, approved — irreversible).** מדיטק/300 guests/4h/6×`04ST`+300×`B-REG-TAG`+300×`B-FAB-LAN`/15% combined discount ⇒ **`6,319 ₪`** read back from the live `quote-total` element before saving; PDF fetched from the real blob (34,836 bytes, waterfall verbatim) — not screenshotted, per the documented headless-iframe gotcha. Approval → **project #7 born `not_started`**, `required_hostess_count=6`. New rows this step: `quotes` #21, `quote_services` #35–37, `projects` #7 — all read back live via MCP. See §9 (01/08 06:1X). *(previous entry: 01/08/2026 05:5X — **step 4.4 CLOSED (regression).** `npm run gate` exit 0 incl. `knip` (376 unit · build · dup · audit · check:context) · **E2E 71/71 green** (one load-related flake-and-recover documented, not silently retried) · M1+M2 manual smoke 5 screenshots. Real ESLint scope bug found+fixed en route (`d016c93`, `playwright-report` was leaking into lint). **4.3b also flips to ✅ here** — its sole blocker (`knip` green) is now met. Both steps built solo overnight by the dedicated build session per the work-manager's go-ahead; the work-manager verified the eslint diff and set the flake-vs-bug protocol live, in real time, via cross-session messages — not after the fact. See §9 (01/08 05:5X). *(previous entry: 31/07/2026 21:43 — **steps 4.2+4.3 CLOSED as one round.** `npm run gate` **exit 0** (376 unit) · **E2E 44 ⇒ 66, all green, 0 skips** · 22 new tests in 3 files, **4 of them watched failing on deliberately broken code** before any green was reported · the rejection/expiry guards proven in a rolled-back SQL battery · **the live DB read back byte-identical afterwards**. See §9 (31/07 21:43). *(previous entry: 31/07/2026 09:35 — **audit fix-round A (VAT guard) CLOSED.** Code + migration `20260731085335` both landed (typed-echo given, applied via MCP). `npm run gate` **exit 0** (343 unit tests) · E2E **21/21** (2nd run; see §9 on the 1 pre-existing `permissions.spec.js` flake in run 1). Every guard proven by **returning the failure**, not by watching it pass. See §9 (31/07 09:05). *(previous entry: 30/07/2026 22:52 — 3.6 CLOSED; `npm run gate` exit 0, 324 tests, 25 E2E green 0 skips, live DB byte-identical to Seed — 40 tiers · VAT 18 · ratio 50 · quote #6 = 6,319 ₪.)*)* |
| **Active step** | **5.2+5.3 ✅ CLOSED 01/08/2026 06:4X — NEXT IS 5.4 (closing audit + PR), which per the guide runs in a FRESH session. 4.5 (Phase-4 👤 gate) still separately open for Ishay's morning; both gates are 👤-only, nothing further for this build session to do without a person.** Carry-forward: (a) migration count for M3 = **10** (`module3_`-prefixed files), a declared definition — don't recount ad hoc, cite `db_roadmap.md` §0.0; (b) the PDF has **two known BiDi defects** (mixed-content "הנדון" field, terms-page bullet direction) pending Ishay's ruling — don't "fix" them without his product call, don't re-discover them as new; (c) `db_roadmap.md` rows A-9/A-11/A-14/A-17 still lack their own inline "✅ APPLIED" tag (fact already recorded narratively in the 23/07 log entry — cosmetic gap, not a missing fact, low priority for 5.4. *(previous: 5.1 ✅ CLOSED 01/08/2026 06:1X. Carry-forward from 5.1: (a) demo data grew — `quotes` now has **#21** (מדיטק, approved, 6,319 ₪), `projects` now has **#7** (`not_started`, linked to quote #21) — an E2E suite asserting row-counts on these tables is now coupled to them (same trap as the 3.7 carry-forward below); (b) the acceptance scenario's hostess SKU is **`04ST`** ("שירותי דיילת (4 שעות)", base_price 500, no tiers — hostess products price off `base_price` directly, not a tier ladder) — don't confuse with `06ST` ("...6 שעות", 800), same description text in `products.description`, only `item_name` disambiguates; (c) headless-Chromium PDF verification pattern confirmed again: fetch the blob via `page.evaluate`, never screenshot the iframe (empty, documented in `03_quotes/CLAUDE.md`) — the Read tool can open the resulting PDF file directly for a real visual check, which is what closed this step's screenshot requirement. *(previous: 4.3b+4.4 ✅ CLOSED 01/08/2026 05:5X. *(previous: 4.2+4.3 ✅ CLOSED 31/07/2026 21:43. *(previous: 4.1 ✅ CLOSED 19:40 — NEXT IS 4.2+4.3 AS ONE ROUND (🔗 box beside step 4.2 — the decision lives there with its measurement; 4.4 stays a verification step and 4.5 is a 👤 gate, neither is part of this round). ⚠️ Carry-forward from 4.1: (a) the E2E baseline is **38, not 39** — the older figure is off by one; (b) `closing_unit_cost` freeze must be tested by **moving the catalog and watching the line not move** — an equality check against the catalog passes on a broken freeze; (c) sequences do not roll back, so `projects.project_id` has burned 5 and 6. *(previous: 3.7 ✅ CLOSED 31/07/2026 — Phase 3 done.)* ⚠️ Read before 4.x: (1) the demo data **changed tonight** — quotes #14/#15 were deleted, so `quotes` is 8 rows / `quote_services` 20, and מדיטק (customer 46) has **2** quotes, not 4. **An E2E suite that asserts on real seed rows is coupled to them — `grep` the suite for an id before deleting it** (this bit once, and only the proactive regression caught it; CI never runs E2E). (2) The rejection-reason-on-row assertion now lives on עיריית חדרה's quote #11, not מדיטק's #14. (3) `RowAction` is now shared at `src/components/RowAction.jsx` — consume it, don't re-declare it. Evidence: §9 entry 31/07 01:28. *(3.6 ✅ complete 30/07 22:52 — details kept below.)* **3.6 ✅ COMPLETE — built and verified live 30/07 22:52.** Mockup approved (`docs/mockups/system-settings-screen/05_prices_tab_approved.html`), plan `~/.claude/plans/resilient-purring-bear.md`, rulings **LOCAL-19..21**. ⚠️ Read §9 (30/07 evening) before touching `replacePriceTiers` or any delete-then-insert save: a real data-loss incident happened and the fixed ordering (upsert→delete-stale) is load-bearing. **Next: 3.7 (Phase-3 gate — 🎨 UX & functional review, a 👤 stop).** |
| 🆕 **Read this before 3.5 — what changed in 3.4 that a fresh session would not guess** | (1) **A generic email engine now exists** — `src/lib/email.js` + Edge Function `send-email` + table `email_log`. It is **not** quote-specific; M4/M8/M11 reuse it (`src/CLAUDE.md` §"שליחת מייל" · §6 🚧 מ4·מ8·מ11). (2) **Migrations are at 9, not 5** — 6 (8th rejection reason) · 7+9 (email wording + sender signature: **deliberate deviations from FROZEN C5 §5.8.1**, `params` value only) · 8 (`email_log`). (3) **The project now has an external dependency** on Make.com (scenario 6759079) and its **first Edge Function**; the webhook URL is a Supabase secret and must never enter the repo. (4) **Direction incident #5** happened in an *outgoing email*, not a screen — `src/CLAUDE.md` now requires every outgoing Hebrew artefact to run its own direction pass. (5) **Two debts booked to 4.3:** no permanent E2E for the email path, and no test proving a `view`-level user is refused **by the function** rather than by a hidden button. (6) ✅ **DONE 31/07/2026** — Ishay deleted BOTH unused connections (`regin-gmail` 9406233 + `regin-gmail-send` 9406719) via browser-Claude; verified live via `connections_list` (only `regin-google-restricted` + Make's default remain) and `scenarios_get` 6759079 (`isActive: true`, connection 9407092 intact, onerror pair in place). |
| ⚠️ Concurrency | 29/07 19:10 — the **ownership question from the 18:19–18:57 entries is RESOLVED by evidence**: the uncommitted 3.3 code was this build session's, it is now complete and gate-green. The other conversation wrote **no code** (its two commits `f67cb98`/`512184c` are docs only) and correctly stood down per iron rule 16. **Ishay must close the second conversation before the next step** — two sessions on one branch nearly caused a `git add -A` cross-commit. |

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
| 3.3 | Quote management screen (tabs F24 + ⭐ + filters + actions) 🗣️→🔻🤖 | ✅ (built to the approved mockup `09_quote_management_approved.html`. TDD on 5 new `quotes.js` helpers — 34 tests written first, watched fail on unresolved imports, then implemented. Live-verified as CEO: 0 horizontal overflow, ₪ on the same side in all 12 amounts, all 7 columns aligned to **0.0px**, `6,319 ₪` + "אחרי 15% הנחה" on quote #6, chip filters toggle 6→1→6, rejection breakdown 3 reasons, reject-dialog validation, PDF blob 34,026 bytes whose extracted text carries the full 6,300→5,355→**6,319 ₪** waterfall. `npm run gate` exit 0, 219 tests. Three defects found by measurement — §9) |
| 3.4 | Quote PDF render + real email send (Make→Edge Function→Gmail) 🗣️→🔻🤖 screenshot | ✅ (proven on the real inbox: `REG-IN-quote-6.pdf` **33KB** = the known PDF size ⇒ base64 decoded, `<div dir="rtl">` body, 4 line breaks. `npm run gate` exit 0, **279 tests**; 10 existing E2E green. Six defects found by real-send, five of them mine — §9) |
| 3.5 | ~~Customer-card integration~~ → **Customer RECORD PAGE** (`/customers/:id`, tabs, quote history + metrics + sort/search/chips + revenue column) 🗣️→🔻🤖 | ✅ (gate 0, 290 unit + 13 E2E; 9,865 ₪ / 6,319 ₪ live; direction pass 0 findings; 30-quote view proven **without a single DB write**) |
| 3.6 | Prices tab in /system (§7.84) 🗣️→🔻🤖 | ✅ (mockup approved w/ real data + 2 proactive additions [LOCAL-19/20]; gate 0, **324 unit** [was 290, 18 written first + watched fail]; **25 E2E green incl. all 18 pre-existing, 0 skips**; direction pass measured live [0 overflow · ₪ same side ×22 · price col 0.0px]; write-wall proven by SQL impersonation both directions; **2 real bugs caught by verification + 1 real data-loss incident, §9**) |
| 3.7 | Phase-3 gate: 🎨 UX & functional review 🔻👤 | ✅ **CLOSED 31/07/2026 02:4x** — 2 sweeps, 4 findings ruled by Ishay and all 4 resolved (3 built + the DB cleanup he ran); both 👤 items returned (trigger check `O`/`O` + "רואים מעולה" on the PDF preview). Gate exit 0 · **327 unit** · **18/18 E2E** (one broke on the cleanup and was fixed without weakening it) · smoke green · jscpd 0.60%→0.44%. §9 31/07 |
| 4.1 | Approval flow E2E (date guard §7.32, RPC, project born complete, locks) 🔻👤 ⬅️ **re-tagged 31/07: a successful approval is irreversible** | ✅ (rolled-back SQL battery: all 7 guards **returned their failure** · `e2e/quote-approval.spec.js` NEW, 6 tests, 3 of them mutation-proven · **zero net DB change, verified after**) |
| 4.2 | Rejection + expiry flows E2E (7 reasons, notes, cron simulation) 🔻🤖 — 🔗 **ONE ROUND with 4.3** | ✅ (rolled-back SQL battery: both rejection CHECKs + the lock trigger on `update` **and** `delete` + the **expiry job body run verbatim** [param 30⇒1 ⇒ exactly 4 rows flip] + the param guard returning its failure; zero net DB change, read back outside the transaction. Screen side in `quotes.spec.js`, coverage map below the step) |
| 4.3 | e2e/quotes.spec.js + e2e/prices.spec.js suites 🔻🤖 — 🔗 **ONE ROUND with 4.2** (+ the two 3.4 debts below) | ✅ (**22 new tests, suite 44 ⇒ 66, all green, 0 skips**: `quotes.spec.js` 9 · `prices.spec.js` 7 · **`quote-email.spec.js` 6 — the two 3.4 debts, both paid**. 4 mutations watched failing before any green was reported. Every write intercepted — the live DB was read back byte-identical after the full run) |
| 4.3b | Coverage residue: `quote_services` lock branch 🔴 · both pricing params 🔴 · 'אחר' notes delivered 🟡 · product-status toggle 🟡 — ⛔ **BEFORE 4.4** | ✅ **CLOSED 01/08/2026 05:4X** — the one blocking condition (`npm run gate` fully green incl. `knip`) is met: `knip` ran clean in the 4.4 regression run (see 4.4 row) once machine load dropped. 5 new tests stand, 71 E2E |
| 4.4 | Regression: full verify + existing E2E + M1/M2 screens 🔻🤖 — **runs only after 4.3b**. ⚠️ **Known flake, 2nd occurrence 01/08 (1st: `quote-email.spec.js` night of 4.3b):** the shared `login()` helper's redirect-wait can time out under machine load — `quotes.spec.js:68` failed on a 30s timeout to `/`, then passed clean (4.3s) alone with a quieter machine. Documentation only, not auto-retry logic (a retry policy is Ishay's product call, if he ever wants one) — a single re-run is legitimate before treating it as a real bug; a **second consecutive** failure on the same test is not the flake anymore, stop and investigate. | ✅ **CLOSED 01/08/2026 05:5X** — `npm run gate` full green **incl. `knip`** (376 unit · build · dup 0.43% pre-existing · audit 2 waived · check:context clean). ⚠️ **Real ESLint gap found+fixed en route** (commit `d016c93`): `globalIgnores` never excluded `playwright-report`/`test-results`, so a leftover Playwright HTML report broke `lint` as if it were source — every post-E2E `gate` would have failed the same way. **E2E: 71/71 green** on the clean run (one flake-and-recover on the first run, see ⚠️ note — isolated file + full-suite re-run both clean). **M1+M2 manual smoke: 5 screenshots**, `docs/CLAUDE_CODE_LOG.md` §9 lists paths — login, post-login home, permissions matrix (full render, all 8 modules × 5 roles), customers list (4 rows), customer record page (highlights strip + 2-quote history). Captured via a disposable Playwright script (Browser-pane screenshot was unavailable — pane not displayed in this unattended session — verified before falling back), never committed. |
| 4.5 | Phase-4 gate 🔻👤 | ✅ **SIGNED 01/08/2026 ("מאשר שער 4")** — Hebrew gate report delivered in the manager chat (built + verified overnight); Ishay's own eye-pass: 3 live clicks, all "עובד"; declared boundaries recorded (flake root-cause unexplored · CEO-only manual smoke · BiDi flaws → fixed in the post-audit round) |
| 5.1 | Acceptance scenario from spec (6,319 in live UI) 🔻🤖 screenshot | ✅ **CLOSED 01/08/2026 06:1X** — built live through the real screen (not SQL-injected): מדיטק (customer 46, 5% fixed) · 300 guests ÷ 50 = 6 hostesses · 4h (10:00→14:00) · lines 6×`04ST`(500) + 300×`B-REG-TAG`(5, tier 201–400) + 300×`B-FAB-LAN`(6, tier 201–400) = 6,300 subtotal · 5%+10%=15% discount (-945) · 5,355 pre-VAT · 964 VAT · **`quote-total` read back as the literal string `6,319 ₪`** before saving. Approved through the UI (irreversible, per plan-gate authorization) → **project born complete**: `project_status='not_started'` ("טרם החל"), `required_hostess_count=6` (F22, summed from the actual hostess line, not the recommendation field), date/time/identity all correctly inherited. Real PDF fetched from the live blob (not screenshotted — iframe is empty in headless Chromium, documented gotcha) — **34,836 bytes, `%PDF` header, waterfall reads 6,300→-315→-630→5,355→964→6,319 ₪ verbatim**, read via the Read tool (PDF support), both pages inspected. **Demo-data delta this step created — not a rollback, matches 3.7's pattern:** `quotes` +1 row (**quote_id 21**, `in_progress`→`approved`), `quote_services` +3 rows (line_id 35/36/37), `projects` +1 row (**project_id 7**, `not_started`). All four read back via `execute_sql` (MCP) as the frozen-row evidence. 4 screenshots (`06`–`09`) + the PDF itself (`10`) in scratchpad. |
| 5.2 | QA matrix as-run fill + DoD walkthrough 🔻🤖 | ✅ **CLOSED 01/08/2026 06:4X** — §6 QA Matrix rows (Unit/Integration/E2E/Regression) filled with tonight's evidence (376 unit · 71 E2E · gate green incl. `knip` · CEO-only smoke scope · the documented load-flake). §7 DoD: the 6,319-live-UI-and-PDF box closed (5.1); the PDF-RTL box **deliberately left unchecked** — two real BiDi defects found on the work-manager's visual pass, pending Ishay, not fixed this round. Full historical DoD re-audit (every box, not just tonight's) is 5.4's job (fresh session) — not repeated here. |
| 5.3 | Docs: §6 wiring, module-1.md correction, db_roadmap §10, CLAUDE_CODE_LOG/STATUS 🔻🤖 | ✅ **CLOSED 01/08/2026 06:4X** — migration-count recount with one explicit declared definition (`module3_`-prefixed files = 10), reconciled across `module-3.md`/`db_roadmap.md`/`PROJECT_MASTER.md`; the folder-vs-registry drift (§7.86) re-measured live and confirmed as the same ruled pattern continuing (22/21 now vs 21/18 at 31/07), not a new incident. §4 security statement gained round-G's `product_costs` RLS-split note (was only in `src/CLAUDE.md`). §6 מ3 debts: **verified already fully closed** by a prior session (all 4 struck through with dates, forward-debts already name their target modules) — no new edit needed. `module-1.md`'s "params UI → M9" note: checked, found accurate as-is (M3 only delivered a narrow 2-param tab, the full params screen genuinely stays M9's scope). ⚠️ **Not done this round, flagged not silently skipped:** `db_roadmap.md` rows A-9/A-11/A-14/A-17 lack their own inline "✅ APPLIED" tag (A-12/A-19/§7.85/C-1/C-6 already have one) — the underlying fact is already recorded in the detailed 23/07 migration-1 log entry, so this is a consistency/polish gap, not a missing fact. |
| 5.4 | Closing audit + PR (FRESH session, final-test template, DoD typed-echo) 🔻👤 | ⬜ |

### 2. 📦 Context Packet for Claude

**Purpose (≤3 lines):** Build the pricing module — the money engine: seed the product catalog/tiers/params, price quotes (tiered pricing, additive discounts, 18% VAT, agora precision), manage quote lifecycle (in_progress→approved/rejected incl. auto-expiry), convert approved quotes atomically into projects, generate Hebrew RTL PDF in real time, and add the CEO "מחירים" maintenance tab. Spec: C5 §5.5.4–5.5.5 (process), §5.6.4–5.6.5 (screens); C6 §2.4.2/3/9/11/12 (tables).

**Capabilities delivered vs deferred:**

| Capability | This module delivers | Completed by | Tracked |
|---|---|---|---|
| Quote creation/edit screen (customer pull, event data incl. start/end times, hostess recommendation w/ override, catalog lines w/ tiers+colors+notes, live totals) | ✅ full | — | — |
| Quote management screen (status tabs, ⭐ expiring view, filters, approve/reject/edit) | ✅ full | — | — |
| Pricing engine SSOT (`src/lib/pricing.js`, item×qty×price only — F26 invariant) | ✅ full | — | — |
| ~~PDF: real-time render, download, mailto + manual attach~~ → **PDF + REAL server-side email send** (Edge Function `send-email` → Make webhook → Gmail, PDF attached, template #10 from `params`, primary contact only, `in_progress` only) | ✅ full — **`mailto` was dropped, not deferred** | 🚧 מ10 keeps only: send **without** a third-party automation platform (own mail provider), delivery tracking, and auto-send on a trigger rather than a human click | §6 🚧 מ10 (narrowed 30/07) · §6 🚧 מ4·מ8·מ11 (the generic engine they reuse) |
| Email send-journal `email_log` (generic `entity_type`/`entity_id`; server-written only) — the source of truth for "was this already sent" | ✅ full (**pulled forward from מ10**, Ishay 30/07) | — | `db_roadmap` A-20 |
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
- `supabase/migrations/` — ~~5~~ **10 named `module3_` migrations** (1.1–1.5 in Phase 1; **6** rejection reason `נפתחה בטעות` 29/07; **7** quote-email wording 30/07; **8** `email_log` 30/07; **9** sender signature 30/07; **10** VAT+expiry param guards 31/07). ↳ as-built: 6–10 were not foreseen by the blueprint; each is recorded in `db_roadmap` §10 + §9 here. ⚠️ **Count re-verified 01/08/2026 (step 5.3) by an explicit declared definition** — filename-prefix `module3_` on disk = **10** (this excludes `round_g_db_hardening`, a cross-module hardening migration that also touches M3-owned `product_costs` but isn't `module3_`-named; full reconciliation of the 4 different live counts found tonight is in `db_roadmap.md` §0.0).
- `src/lib/pricing.js` + `pricing.test.js` — money SSOT.
- `src/lib/catalog.js` + `catalog.test.js` — display labels (category/status/color), PRICING_PARAM_NAMES.
- **`src/lib/email.js` + `email.test.js` — ↳ as-built 30/07, NOT in the blueprint: the generic email engine (template fill · 5-field Make contract · attachment ceiling · disabled-reason · three send outcomes · plain-text→RTL-HTML). Shared with M4/M8/M11 — see `src/CLAUDE.md` §"שליחת מייל".**
- **`supabase/functions/send-email/index.ts` — ↳ as-built 30/07, NOT in the blueprint: the project's FIRST Edge Function. Holds the Make webhook URL (secret `MAKE_EMAIL_WEBHOOK_URL`), authenticates the caller, checks `edit` on 'הצעות מחיר' **against the DB**, forwards to Make, and writes `email_log` with service-role.**
- `src/modules/03_quotes/`: `api.js` · `QuotesPage.jsx` (tabs list) · `QuoteBuilderPage.jsx` (create/edit) · `QuoteLineEditor.jsx` · `QuoteSummaryPanel.jsx` · `RejectQuoteDialog.jsx` · `ApproveQuoteDialog.jsx` · `QuoteReadOnlyView.jsx` (reused by customer card history) · `quotePdf.js` (standalone pure engine, §7.12↳) + `PdfPreview` glue. ↳ as-built: the file is **`quotePdf.jsx`** (JSX transform) and the preview glue is **`QuoteDocumentDialog.jsx`**, not a `PdfPreview`; `QuoteActionDialog.jsx` + `CustomerPicker.jsx` were added beyond the list.
- `src/modules/01_auth/`: `PricesManagementPage.jsx` · `ProductFormDialog.jsx` · `PriceTiersDialog.jsx` · `PricingParamsCard.jsx` · `pricesApi.js` (per design-notes, weighed in DB challenge).
- `e2e/quotes.spec.js` · `e2e/prices.spec.js`.

**DB tables + migrations:** quotes, quote_services (rebuild §7.85), products, price_tiers, params (current defs schema.sql:57-117; all RLS-on/0-policies deny-all per schema.sql:344-353), projects+logistics written by RPC only, **`email_log` (new table, migration 8 — generic send-journal, server-written only)**. Existing migrations context: `20260710160735` (surrogate PK + nod bundle), `20260711013517` (customer_contacts).

**⚠️ External dependency added 30/07 (not in the blueprint — a new class of dependency for this project):** email delivery runs through **Make.com** (free plan, team 2049106): data structure `regin-quote` 511348 · webhook `regin-quote-email` 3471390 · scenario "REG-IN — שליחת מייל" 6759079 (ACTIVE, `immediately`) using connection `regin-google-restricted` 9407092, with a `Webhook response` 200-after-send / 502-on-error pair and a **Skip** error handler. Free-plan limits that bound this: 2 scenarios · 1,000 ops/month (≈500 sends) · 5MB attachment. 🔒 The webhook URL is a credential and lives **only** in the Supabase secret — never in this repo.

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
| LOCAL-7 | ✅ RULED 30/07: **real email send replaces the `mailto` flow of §7.12↳.** App → Edge Function → Make webhook → Gmail with the PDF attached. Reason: `mailto` cannot attach a file, so it added almost nothing over the download button. `mailto` **dropped, not deferred** | ישי | 30/07 | 3.4 |
| LOCAL-8 | ✅ RULED 30/07: the email engine is **generic**, not quote-specific (`src/lib/email.js` + `send-email`) — `params` holds **6** email templates and M4/M8/M11 will send too. Enforcement: `src/CLAUDE.md` + §6 🚧 מ4·מ8·מ11 + `jscpd` in CI | ישי | 30/07 | 3.4, מ4/מ8/מ11 |
| LOCAL-9 | ✅ RULED 30/07: **`email_log` pulled forward from מ10** — the only anti-double-send guard that survives a page refresh or a second user. Generic `(entity_type, entity_id)`; **server-written only** (a journal the browser can write to is not evidence) | ישי | 30/07 | 3.4 |
| LOCAL-10 | ✅ RULED 30/07: quote-email wording — **"והתנעת הפרויקט" removed** ("לאישור ההצעה, אנא השב…"). ⚠️ deliberate deviation from FROZEN C5 §5.8.1; the frozen file is untouched, only the seeded `params` value | ישי | 30/07 | 3.4 (migration 7) |
| LOCAL-11 | ✅ RULED 30/07: the mail is **signed by the actual sender** (name · role · phone if present · email) and not by a fixed "project manager" — the system already authenticates who clicked, so the customer always reaches the person who knows the quote. Phone line omitted when empty (2 of 3 CEO users have none) | ישי | 30/07 | 3.4 (migration 9) |
| LOCAL-12 | ✅ RULED 30/07: **deploy to Vercel right after M3 closes**, not at M12 as `00_roadmap`/module_12 say — no recorded reason was found for the M12-only rule. ⚠️ Rotate the 5 test passwords the same day (§7.24 assumed a local-only app) | ישי | 30/07 | post-M3 |
| §7.82 F19↳ | Re-confirmed live 30/07 against the DB (Ishay asked whether finance sends quotes): 'הצעות מחיר' = **edit** for מנהלת פרויקטים + מנכ"ל · **view** for מנהלת כספים · **blocked** for גיוס/לוגיסטיקה. Sending is an edit-level action and the Edge Function enforces it server-side | ישי (12/07, re-verified 30/07) | 30/07 | 3.4 |
| LOCAL-13 | ✅ RULED 30/07: **the customer card becomes a full RECORD PAGE** (`/customers/:customerId`), not a dialog. Ishay's reason: a 512px dialog cannot hold 30 quotes, and M6 adds project cards on top. His guiding principle, verbatim: **"כל המידע שיש במערכת על הלקוח, מסודר, עם חיפוש וסינון נוחים."** Structure follows the standard CRM record page (verified, not invented — Salesforce compact-layout/record-page docs + ServiceNow Horizon): highlights strip → grouped details → related-list tabs. **`CustomerDetailsCard.jsx` is deleted**, content moves to `CustomerDetailsPage.jsx` | ישי | 30/07 | 3.5 |
| LOCAL-14 | ✅ RULED 30/07: **highlights strip = 3 LIVE metrics only** (הכנסות · שווי הצעות פתוחות · גודל עסקה ממוצע). The 3 still unwired (מספר אירועים · אירוע אחרון ← M6 · ממוצע משוב ← M8) drop to one muted line naming the module they wait for. ⚠️ Presentation-only deviation from Ishay's 11/07 "exactly 5 equal tiles" — **no metric was removed.** Reason: the strip must carry decision-driving facts, not 3 "אין נתונים עדיין" boxes | ישי | 30/07 | 3.5 |
| LOCAL-15 | ✅ RULED 30/07: **the page carries actions, not just data** — header `✎ עריכת פרטים` (reuses `CustomerFormDialog` as-is) + `+ הצעה חדשה` (Ishay: "אהבתי את התוספת שלך"), and **all four row actions** on quote rows (✎ · 👁 · ✓ · ✕) exactly as `QuotesPage`. ⚠️ **TWO SEPARATE PERMISSION GATES on one page** — `permissions['לקוחות']` for the edit button, `permissions['הצעות מחיר']` for the quote actions. Verified live: **מנהלת כספים is `edit` on לקוחות but `view` only on הצעות מחיר**, so a single page-level gate would hand her approve/reject. Ishay offered to simplify ("זה רק פרויקט אקדמי") — **declined with reasoning:** it is one extra `const`, RLS refuses her anyway so a shared gate would only make the button lie, and the permissions matrix is a graded feature of his project | ישי | 30/07 | 3.5 |
| LOCAL-16 | ✅ RULED 30/07: **"sent to customer" is shown as yes/no, WITHOUT a date.** Ishay's challenge: "אין אצלנו טיוטה, אז תאריך השליחה זה פשוט תאריך ההצעה לא?" — **he is right that there is no draft status** (verified live: `quotes_quote_status_check` = exactly `in_progress`/`approved`/`rejected`), and in practice build+send happen in one sitting, so the date is usually redundant. But the dates are **not** the same fact (send can lag, a quote can be re-sent, and a quote may never be sent at all), so the signal kept is the binary. **`⚠ טרם נשלחה` renders only on `in_progress` rows** — on a closed quote it is no longer an open action. Source: `email_log` (M3, 3.4), ONE batched query on `entity_id in (…)`, never `getLastSuccessfulSend` per row (N+1 on 30 quotes) | ישי | 30/07 | 3.5 |
| LOCAL-18 | ✅ RULED 30/07: **sort control on the quotes tab** — `החדשות ראשונות` (default) · `סכום — מהגבוה` · `תאריך האירוע — הקרוב`. Labels are **byte-identical to the management screen** so one action doesn't have two vocabularies, and the comparator is the existing tested `sortQuotes`. ⚠️ `recent` deliberately bypasses `sortQuotes`: it IS the query order (`issue_date desc, quote_id desc`), and re-sorting client-side would drop the tiebreak that makes it deterministic. **Rejected in the same round:** an "ארכיון" tab (`לא-נדרש` — `נדחו` already IS the archive; in CRMs archive is a filter value, not a tab) and date-range filtering (status + search already cover 30 rows). **Registered to M6:** an upcoming-vs-past split for the projects tab — the right axis for an events company, built when the rows and policies exist | ישי | 30/07 | 3.5, 🚧 מ6 |
| LOCAL-17 | ✅ RULED 30/07: **no `draft` quote status.** `in_progress` already IS the draft (nothing leaves the system without a human clicking send), and the only thing a draft status would add — "what hasn't gone out yet" — is exactly what LOCAL-16's marker delivers with no migration and no ripple into the lock trigger, the tabs, or the approval-rate formula. Verdict `לא-נדרש`; a formal draft status defers past the deadline if ever wanted | ישי | 30/07 | 3.5 |
| LOCAL-19 | ✅ RULED 30/07 (approved with the 3.6 mockup, proposed proactively): **margin column ("שולי רווח")** on the products table — `(base_price−cost)/base_price`, both operands already stored so the column is free; negative margin renders red. CEO-only screen, so profitability exposure is a non-issue (consistent with the 3.2 profitability ruling) | ישי | 30/07 | 3.6 |
| LOCAL-20 | ✅ RULED 30/07 (same round): **below-cost tier price = warning, not error.** `validateTierRows` flags `special_price < cost` in a separate `warnings` channel; save proceeds (a loss price may be deliberate — promo, clearing stock). Errors block, warnings inform | ישי | 30/07 | 3.6 |
| LOCAL-21 | ✅ RULED 30/07 22:18 (Ishay opened the question himself before 3.6): **the prices screen and the ratio *default* stay CEO-only** — §7.84 reconfirmed, write-back done on its §7 line first (rule 13a). His question was "maybe finance + projects manager too, and for the hostess ratio?"; answered `לא-נדרש-כי` on three grounds he then ruled by: **(a)** his own cadence estimate — **once per half-year**; **(b)** per-quote ratio override is **already open** to the projects manager (§7.82 F20, transient field) — only the system-wide default is gated, and that is a policy decision; **(c)** there is no "prices only" grant — the key is the `הגדרות מערכת` module permission, which also carries the email templates and the rest of the system screen. 🔁 Reopen trigger recorded on §7.84: the M9 params screen (§7.70), if the CEO turns out to be a bottleneck | ישי | 30/07 | 3.6 |
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
- **↳ ADDED 30/07 — `email_log` (migration 8):** ONE policy only — `select` for edit|view on 'הצעות מחיר' (§7.21 shape, `entity_type='quote'` scoped). **No client write policy at all, by design:** only the Edge Function writes, with service-role. A journal the browser can write to is not evidence — anyone forging a request could log "sent" for a mail that never left. ⚠️ M4/M8/M11 each add their **own** module-gated SELECT policy and widen the `entity_type` CHECK; **never widen this policy to "any authenticated"**.
- **↳ ADDED 30/07 — Edge Function `send-email` (the project's first):** it is the **only** holder of the Make webhook URL (Supabase secret `MAKE_EMAIL_WEBHOOK_URL`) — REG-IN is a client-only SPA, so any URL in client code ships in the public bundle and would be an open mail relay in the company's name. Two gates before it forwards anything: (1) `auth.getUser()` on the caller's JWT (`verify_jwt: true`); (2) a permission check **run as that user** so RLS applies — resolve their `users` row (`role_id` + `status='active'`) and require `edit` on 'הצעות מחיר'. ⚠️ **Both steps are mandatory and the second was got wrong once:** policy `permissions_select_all` is `using (true)`, so filtering by module alone returns all 45 rows and the check collapses — **a `using(true)` read policy means server code must scope by role itself.** Sending a document to a customer is an edit-level business action; the UI's disabled button is convenience, this is the wall (iron rule 9).
- **Accepted limitations:** module-level RLS (no row ownership, §7.21); session in sessionStorage (M1); logistics rows created by DEFINER RPC while logistics module RLS stays deny-all until M5 (rows invisible until M5 policies — accepted, spec'd order). **↳ 30/07: mail delivery depends on an external automation platform (Make.com, free plan) whose webhook URL is a bearer-style secret — anyone holding it can send mail as the company. Accepted for now because the URL lives only in a Supabase secret and Make's own API-key option is available if it ever leaks; revisit at M10 when sending moves to an owned provider.**
- **↳ ADDED 31/07 (round G, §7.83↳) — product cost moved OUT of `products` into its own table `product_costs`.** Postgres RLS is row-level, not column-level, and all authenticated roles share one `select` on `products` — so hiding a single column from some roles required splitting it into a separate table with its **own** policy: `select` on `product_costs` requires `edit` on 'הצעות מחיר' OR 'כספים'. Reads join `product_costs(cost)` and flatten via `flattenProductCost` (`src/lib/catalog.js`). ⛔ **The join MUST stay `LEFT` and a missing cost MUST stay `null`, never coerce to `0`** — a product invisible in the join (no cost-read permission) is not a free product; `cost:0` would turn "I can't see the cost" into "profit = 100% of revenue" with no error anywhere (the exact §7.34 zero-price failure class, one layer up). This is a live security boundary, re-verified tonight (01/08, step 5.1): the acceptance-scenario quote's lines all froze `closing_unit_cost` correctly (300/2.5/3 for the three lines) under the CEO role, which has both `edit` grants.

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

**Step 3.4 — PDF flow 🗣️ → 🔻🤖 screenshot.** ⚠️ **SUPERSEDED 30/07/2026 — see §9's 30/07 entry for the full reasoning; this paragraph is the original 15/07 blueprint, kept for the "what/why" that's still true.** Files: `src/lib/quotes.js` (done) · `QuoteDocumentDialog.jsx` (done) · `QuoteBuilderPage.jsx` (not started) · new: `supabase/functions/send-quote-email/index.ts`. What: view+download already shipped in 3.3; **real send** replaces the §7.12↳ mailto flow — dialog → Edge Function `send-quote-email` → Make webhook → Gmail, PDF attached, primary contact only, `in_progress` rows only (both rulings unchanged from 29/07). Verify: full-quote PDF screenshot (worked example, 6,319) + an actual inbox check (Claude has Gmail-read access this session) showing the mail with the attachment.

**Step 3.5 — Customer-card integration 🗣️ → 🔻🤖.**
> ⚠️ **SUPERSEDED 30/07/2026 — read LOCAL-13..17 in the Ledger FIRST.** The paragraph below is the
> 15/07 blueprint and is still correct on *what data* gets wired (history · revenue · avg deal size ·
> revenue in the list), but **wrong on the container**: Ishay ruled the card becomes a full
> **record page** at `/customers/:customerId` with tabs, header actions, and all four row actions.
> The approved plan is `~/.claude/plans/polished-stargazing-reddy.md` (includes a verified
> blind-spot sweep: back-button loses 5 list-state values · `issue_date` is identical across all 10
> demo quotes so the sort needs a `quote_id` tiebreak · **there is no separate test DB — never inject
> test rows to try the 30-quote view**). The approved mockup is
> `docs/mockups/customers-screen/07_customer_page_approved.html`.
> Where this paragraph and the plan differ, **the plan wins.**

Files: CustomerDetailsCard.jsx, src/lib/customers.js, CustomersFilterSheet.jsx/CustomersPage.jsx (⚠️ shared-surface ×3 — additive sections; regression: customers tests+E2E stay green). What: (a) quote history collapsible section: ALL customer quotes (date·event·status pill incl. פג-תוקף distinction via reason) → click = read-only view + הפק PDF ("אפיון-שותק — אושר ע"י ישי 11/07"); (b) revenues ("סה"כ הכנסות") = Σ approved-quote totals via pricing.js + avgDealSize = revenues÷approved-count → deriveCustomerMetrics wiring; (c) customers-list filter "מובילים לפי הכנסה" → matchesCustomerFilters extension (§6 line 265). Primary contact only in picker/PDF (§6 line 266; re-confirmed 30/07/2026 in step 3.4's email-send scope — `customer_contacts` still 0 rows live). Verify: card screenshot w/ history+metrics; filter works; `npm run test:run` customers tests green.

**Step 3.6 — Prices tab 🗣️ → 🔻🤖 ⚠️ shared-surface (SystemManagementPage.jsx, App.jsx).** Files: PricesManagementPage.jsx, ProductFormDialog.jsx, PriceTiersDialog.jsx, PricingParamsCard.jsx, pricesApi.js, SystemManagementPage.jsx, App.jsx. What: per design-notes (weighed: placement 01_auth ✓ consistent w/ system pages; stacked sections not sub-tabs ✓; status <Select> 3-value ✓ — flagged "מהמוקאפ/עיצוב-רקע — לאישורך" in the 🗣️ brief): products table + add/edit dialog (sku immutable on edit) + status select w/ optimistic rollback; tiers dialog (min_qty unique client check, max≥min, replace-all save); 2-param card (now plain upsert — UNIQUE exists). Verify: CEO flow screenshots; STAFF/blocked role sees read-only/RLS-denied evidence.

**Step 3.7 — 🎨 Phase-3 gate 🔻👤.** UX & functional review per template §5: (a) §4 design conformance; (b) states loading/empty/no-results/error+retry/success on every screen; (c) keyboard operability + focus ring; (d) validation completeness (spec'd all implemented; spec-silent all confirmed); (e) "מה לעצב אחרת?" — proposals presented, Ishay rules. Findings → steps or §9 deferrals.

#### Phase 4 — Control & integration

**Step 4.1 — Approval flow edges 🔻👤 (re-tagged from 🤖 on 31/07/2026 — see the box).**

> 🔴 **A SUCCESSFUL APPROVAL CANNOT BE UNDONE. Split this step in two.**
> Measured 31/07/2026: trigger `quotes_lock_non_in_progress` (migration `20260723115000`) blocks
> **`update` AND `delete`** on any quote whose status is not `in_progress`, and
> `projects.quote_id … on delete restrict` (`20260629000000_baseline_schema.sql:119`) locks it
> from the other side. **There is no "un-approve" path** — not in the UI, not in plain SQL. Every
> test approval persists forever, and there is one live Supabase project (no test environment).
> - ■ **Failure paths — safe, build them without asking.** Every rejected approval ends in
>   `raise exception`, which rolls the transaction back: **zero DB change.** That covers the
>   past-date guard (§7.32, today itself allowed), view-role denial (button absent *and* direct
>   RPC refused), double-click (`projects.quote_id` is UNIQUE), already-handled, no-hostess-line,
>   and round A's two VAT guards. Their messages route through `quoteServerErrorMessage`
>   (`src/lib/quotes.js`, round D) — assert the **mapped** text reaches the screen, not the raw.
> - ■ **The success path — 👤 stop.** The seed already contains **one approved quote with its
>   project**: prove "project born complete" against it **read-only**. Only if that genuinely
>   cannot cover an assertion, show Ishay exactly what would be created and on which quote, and
>   wait. Do not approve to "just check".
>
> 🔴 **`products.cost` no longer exists on `products`** — round G moved it to `product_costs`
> (`20260731155511`, §7.83↳). Three migrations define `approve_quote_and_create_project`; the
> **last one wins**. Read the live definition, never copy a body from an older file.

Goal: prove the conversion's integrity edges. Files: none new (SQL + live UI). What: E2E+SQL: approve → project 'טרם החל' born complete (event_name, customer_id, date, times, location, required_hostess_count=Σ, logistics rows count = non-hostess lines w/ serial numbers); vat_rate_snapshot=18.00 + closing_unit_cost frozen; past-date quote → blocked w/ friendly message (§7.32, today allowed); double-click → single project + friendly error; view-role sees no approve button AND direct RPC denied. Verify: evidence per assertion.

> 🧰 **THE VERIFICATION PATTERN FOR EVERY 4.x STEP — built and proven in 4.1, do not re-invent it.**
> A single `do $$ … $$` block that ends in an unconditional `raise exception` carrying the whole
> report: Postgres aborts the statement, so **every write inside rolls back as a language guarantee**,
> and the report still reaches you as the error text. Impersonate with
> `set_config('request.jwt.claims', json_build_object('sub',…,'email',…,'role','authenticated')::text, true)`
> — the MCP connection is `postgres` with **no JWT**, so `auth.email()` is null and the RPC's very
> first guard would fire before anything else. Catch each expected failure in a nested
> `begin … exception when others then` so one guard firing does not end the battery. Full working
> battery + its measured output: §9, entry 31/07 19:1x. Prove the rollback first with a harmless
> marker write, then read the row back — cheap, and it is the only thing standing between a typo
> and a permanent change.
> ⚠️ **The environment's safety classifier refuses DDL/destructive SQL through the Supabase MCP**
> (measured 31/07 on the 14/15 cleanup: both `alter table … disable trigger` and the delete were
> blocked). Plain `update`/`insert`/RPC inside the rolled-back block are **not** affected — 4.1 ran
> them fine. If a future step does need DDL, the established fallback is a `scripts/*.sql` file with
> the expected answers written in + a 🧩 handover prompt for Ishay to run in the SQL Editor.

> 🔗 **RUN 4.2 AND 4.3 AS ONE ROUND — decided 31/07/2026, measured not felt.** 4.2 is defined
> `Files: none new`, i.e. it produces tests with no file to put them in; 4.3 is what creates
> `e2e/quotes.spec.js` and `e2e/prices.spec.js` (verified 31/07: neither exists yet). And 4.3's
> journey is `create→edit→**reject**` — **the same rejection path that is the heart of 4.2**.
> Run separately, one of them writes that path twice. ⇒ **Put 4.2's rejection tests inside the
> `quotes.spec.js` you are creating anyway.** ⛔ Merging saves *writing*, never *coverage* — on
> close, list which 4.2 item each test covers, and say out loud if one is uncovered.
> **4.4 stays a verification step, not a round. 4.5 is a 👤 gate and is NOT part of this** —
> finish, report, stop.
>
> 🔴 **Mine measured 31/07: E2E never runs in CI** (zero `playwright` references in
> `.github/workflows/ci.yml`) **and 81 selectors across the suite match literal Hebrew strings.**
> So a copy edit breaks tests while the gate stays green. Ishay ruled *not* to add E2E to CI
> (it would require uploading the five `E2E_*` credential pairs as GitHub secrets — another home
> for passwords already scheduled for rotation, §6 — for regression coverage that the manual
> per-round run already provides). **What you must do instead: new tests select on `data-testid`,
> not on text.** The 81 existing ones stay — reworking them is a whole round for no gain. Any
> Hebrew string you *do* pin, mark in a comment as a contract.
> ⚠️ And never touch the wording in `SERVER_MESSAGE_RULES` (`src/lib/quotes.js`) — it matches
> server errors by Hebrew **prefix**; a reworded string drops the screen to a generic fallback
> with no test failing.
>
> ♻️ **Don't rebuild the rollback battery — it is written verbatim in §9 (31/07 19:40).** Rejection
> is nearly irreversible (`quotes_lock_non_in_progress` blocks `update` *and* `delete` on any
> quote not `in_progress`), so 4.2 needs the same transaction-that-rolls-back pattern 4.1 used.
> It has now been rebuilt from scratch three times (phase 1, round A, step 4.1). Copy and adapt.

**Step 4.2 — Rejection & expiry 🔻🤖.** Goal: prove the rejection/expiry lifecycle. Files: none new. What: reject w/o reason blocked; 'אחר' w/o notes blocked; rejected quote fully locked (edit UI hidden + direct UPDATE errors); expiry job simulation → rejected+'פג תוקף' appears in נדחו tab + breakdown; ⭐ chip counts quotes ≤7d. Verify: evidence.

**Step 4.3 — E2E suites 🔻🤖.** Files: e2e/quotes.spec.js, e2e/prices.spec.js. What: CEO+STAFF journeys per Test Identities (create→edit→reject; create→approve→locked; prices CRUD as CEO; denied as non-CEO). Serial (workers=1 config). Verify: `npm run test:e2e` all green (existing 3 suites too).
> 🔴 **PLUS two debts booked here from step 3.4 — they are NOT in the line above, and a session that builds only the two named suites will close 4.3 without them.** They live in the DoD table below (rows "E2E" and "Security/Pen") — a place nobody reads while executing a step, which is why they are repeated here: **(1)** the email path has **no permanent E2E** (3.4 used five throwaway specs, all deleted); **(2)** no test proves a `view`-level user (finance) is refused **by the Edge Function itself** rather than by a hidden button. *(Pointer added 31/07/2026 by the manager session: audit round **F** was absorbed into this phase on Ishay's condition of "no harm to the result", and these two are exactly the part phase 4 did not already cover. Round F's own residue — the deno CI gate and two blind unit tests — was built separately in `c14bf32`.)*

> ✅ **4.2+4.3 CLOSED 31/07/2026 — coverage map, item by item.** The 🔗 box warns that merging saves
> *writing*, never *coverage*, and requires this list on close. Every 4.2 item and every 4.3 item is
> named here with the test that covers it; **nothing is uncovered.**
>
> | 4.2 item | Covered by |
> |---|---|
> | reject w/o reason blocked | SQL battery §1 (`quotes_rejected_iff_reason`, 23514) + `quotes.spec.js` "בלי לבחור סיבה" (0 writes) |
> | 'אחר' w/o notes blocked | SQL battery §2 (`quotes_rejection_notes_required`) + `quotes.spec.js` "אחר בלי פירוט" (0 writes) |
> | rejected quote fully locked — UI hidden | `quotes.spec.js` "אין פעולות-עריכה על השורה" (edit/approve/reject = 0, document still present as positive control) |
> | rejected quote fully locked — direct UPDATE errors | `quotes.spec.js` same test: a **real** PATCH on #11 with a CEO JWT ⇒ `P0001 הצעה נעולה` · SQL battery §3b (update) and the separate §3c (delete) |
> | expiry job simulation ⇒ rejected+'פג תוקף' | SQL battery §4: param 30⇒1 then the **job body verbatim** ⇒ exactly 4 rows (#6–#9) flipped; §5 proves the param guard by returning its failure |
> | …appears in נדחו tab + breakdown | `quotes.spec.js` "לשונית נדחו" (3 rows + all three reasons) and "אינה ניתנת להחייאה" (§7.41 — no action on an expired row) |
> | ⭐ chip counts quotes ≤7d | `quotes.spec.js` ×2 — real data ⇒ chip **disabled at 0** (measured: all quotes 2 days old, validity 30) · fabricated rows ⇒ counts 2 of 3 and filters to them |
>
> | 4.3 item | Covered by |
> |---|---|
> | `e2e/quotes.spec.js` | NEW — 9 tests |
> | `e2e/prices.spec.js` | NEW — 7 tests |
> | CEO + non-CEO journeys | CEO throughout; **מנהלת פרויקטים** on both screens (sees the 3 row actions; blocked from `/system/prices`) |
> | prices CRUD as CEO / denied as non-CEO | `prices.spec.js` — catalog 11 · tiers 5 real values · two validation paths · `access-denied` + a **real** RLS-refused PATCH |
> | debt (1): permanent E2E for the email path | NEW `e2e/quote-email.spec.js` — 6 tests |
> | debt (2): `view` user refused by the **Edge Function** | `quote-email.spec.js` — finance ⇒ **403**, CEO control with the same empty body ⇒ **400** (the gate runs before the body is read, so no mail can leave) |
>
> ⚠️ **Deliberately NOT covered, say it out loud:** a real `create→edit` write journey through the
> builder. 3.2 already proved save→DB and edit→save round-trips **live**, and repeating them
> permanently would mean writing real quote rows into the one live project on every run — rows that
> can never be deleted once closed. The permanent test asserts the **jsonb key contract** instead
> (the silent-NULL trap); the write path itself stays proven by 3.2 + the rolled-back RPC battery.

**Step 4.3b — Coverage residue 🔻🤖. ⛔ RUNS BEFORE 4.4 — Ishay approved 31/07/2026 22:18.**
Files: none new (extends `e2e/prices.spec.js`, `e2e/quotes.spec.js`, and the §9 rolled-back battery).
Additive only: **no product-code change, no DB writes** — every write path via `page.route`
interception, item ① inside a transaction that rolls itself back.
↳ as-built (01/08/2026): the line above named "item ④" — an editing slip caught by the build
session and confirmed by the manager. It is item **①** (the `quote_services` lock-trigger branch)
that inherently needs a real DB call: `page.route` mocks the browser's network layer and never
reaches Postgres, so it cannot prove anything about trigger behavior. Item ④ (status toggle) is a
pure UI-payload check and route interception is exactly right for it. Built as: item ① = one real
REST call per operation (PATCH + DELETE) against a no-op value, mirroring the existing pattern in
`quotes.spec.js:147-171` — not the heavier `do $$ … raise$$` battery, since a single guaranteed-fail
REST call already IS "a transaction that rolls itself back" once the trigger raises.

> 🔎 **Why this step exists.** 4.2+4.3 closed with a coverage map that said *"nothing is uncovered"*.
> Ishay then asked the build session *"what didn't you check"*, and four gaps surfaced **inside the
> scope already declared closed**. All four were re-verified against the code by the manager session
> on 31/07 22:05–22:12 before being scheduled. **The lesson is the step's real content:** a
> self-authored coverage map cannot see what its author did not think to test.
>
> | # | Gap | Severity | The measurement behind it |
> |---|---|---|---|
> | ① | **Lock trigger never exercised on `quote_services`** | 🔴 **highest** | `enforce_quote_in_progress_lock` (`20260723115000_…`) branches on `TG_TABLE_NAME`: for `quotes` it reads `OLD.quote_status`; **else it runs a subquery** `select q.quote_status … where q.quote_id = OLD.quote_id`. Two triggers exist, one per table — so the `quote_services` path is **a different code path that has never run**. It is the branch that keeps an approved quote's line items frozen, i.e. the thing that makes an old customer PDF reproducible (§7.12) |
> | ② | **Both pricing params have no permanent test** | 🔴 | Measured: `param-vat` appears **once** in all of `e2e/` — read-only, inside `smoke.spec.js`. `param-ratio` and `params-save` appear **nowhere**. §7.84 defines the screen as products + tiers + **2 params**; only the first two are covered. History: param save **could never have worked** until the 3.6 fix, and a broken VAT prints "מע"מ (0%)" on a customer document — the exact failure round A was built to stop |
> | ③ | **'אחר' notes proven blocked, never proven delivered** | 🟡 | `quotes.spec.js:122` asserts a non-'אחר' reason sends `rejection_notes: null`. Nothing asserts that filled notes **reach** the row — and the נדחו breakdown reads exactly that column |
> | ④ | **Product status toggle + its rollback** | 🟡 | `prices-status-select` appears in zero specs. *(Downgraded from the build session's 🔴 by the manager: the **consequence** of disabling is already covered by round D; only the action itself is bare.)* |
>
> ⛔ **Sequencing is the point, not a preference.** 4.4 **is** the regression step. Run it before this
> and either the regression runs twice, or the 4.5 gate signs an incomplete suite.
> ✅ **Deliberately NOT built** (build session's call, manager concurs): duplicate tier · duplicate SKU
> in-screen · rendering all reasons in the dialog — the array is already checked value-by-value
> against the DB CHECK at unit level. ⚠️ They are **8** reasons, not 7 ('נפתחה בטעות' included).

> ✅ **Built 01/08/2026 — 5 new tests, coverage map.** All four gaps closed, `e2e/quotes.spec.js` +2 /
> `e2e/prices.spec.js` +3, no new files (as the step's `Files:` line required).
>
> | Gap | Covered by |
> |---|---|
> | ① `quote_services` lock branch, never exercised | `quotes.spec.js` "טריגר-הנעילה על quote_services … חוסם UPDATE וגם DELETE" — real REST PATCH+DELETE on line_id=19 (quote #11), precondition-read first (no trusting last night's measurement — manager's plan-gate condition), both P0001, read-back byte-identical |
> | ② both pricing params untested | `prices.spec.js` "שמירת שני הפרמטרים יחד…" (happy path, both upserts asserted by URL+body) + "יחס-אורחים לא-תקין (0) חוסם שמירה" (real `isValidGuestsRatio` boundary, not a guessed value) |
> | ③ 'אחר' notes proven blocked, never delivered | `quotes.spec.js` "סיבה 'אחר' עם פירוט — הטקסט מגיע בפועל לעמודה" |
> | ④ product-status toggle bare | `prices.spec.js` "שינוי סטטוס-מוצר שולח PATCH עם המק"ט והערך הנכונים" |
>
> **Evidence:** baseline measured fresh (not assumed): 376 unit / 66 E2E, 0 skips — matches this
> guide's own numbers. After: 376 unit (unchanged — E2E-only work) / **71 E2E, 0 skips** on a clean
> run. ⚠️ **First run had 1 failure** in `quote-email.spec.js` (pre-existing test, untouched by this
> step — login-redirect timeout); **second full run: 71/71 green**, confirmed flake not regression
> (manager's condition: name it, don't disappear it). Post-battery read-back via Supabase MCP:
> `quote_services` lines 19/20, quote #11 (`rejected`/`תקציב לקוח`/`notes=null`), both pricing params
> (18/50), `products.B-REG-TAG.status=active` — all byte-identical to pre-run. `npm run gate`:
> lint/format/376-unit/build/jscpd (0.43%, 3 pre-existing clones, none in `e2e/`) all green.
> **`knip` blocked 4× by `RangeError: Array buffer allocation failed`** — measured 1.4GB/15.73GB
> system RAM free (concurrent sessions on the machine), not a parsing issue in the touched files (no
> `src/` exports added/removed, only `e2e/*.spec.js`). Per manager's ruling: **step stays 🔨, not ✅,
> until `knip` runs clean** — a "green except knip" verdict is a partial verdict.

**Step 4.4 — Regression 🔻🤖.** Goal: nothing existing broke. Files: none. What: `npm run verify` green; manual smoke M1 (login/permissions matrix) + M2 (customers list/card). Verify: command output + screenshots.

**Step 4.5 — Phase-4 gate 🔻👤.** Hebrew report + evidence. ✅ **SIGNED 01/08/2026 —
"מאשר שער 4" (Ishay, manager chat), on the overnight gate report + his own 3-click
eye verification against the live app (dev server raised for him by the manager).**

#### Phase 5 — QA & handoff

**Step 5.1 — Acceptance scenario 🔻🤖 screenshot.** Goal: the binding spec test. Files: none. What (`modules/module_03_quotes.md` ⑤): existing customer 5% fixed discount, 300 guests, 4h, 300 B-REG-TAG + 300 B-FAB-LAN, 10% manual → UI shows **6,319 ₪ exactly**; PDF matches; approve → project 'טרם החל'. Verify: screenshots + SQL of frozen rows.

**Step 5.2 — QA matrix + DoD walkthrough 🔻🤖.** Goal: honest closure inputs. Files: this guide. What: fill as-run; every DoD box evidenced or ❌-with-reason (honest reporting). Verify: updated §6/§7 of this guide.

**Step 5.3 — Docs closure 🔻🤖.** Goal: leave the doc-system consistent. Files: PROJECT_MASTER.md, docs/micro_guides/module-1.md, docs/db_roadmap.md, CLAUDE_CODE_LOG/STATUS. What: §6: mark the 4 delivered מ3 debts done (strikethrough+date; the 🚧 מ10 auto-email line was already added 15/07/2026 at blueprint save) — **and name the FUTURE modules each change lands on (M6/M10) in the §6 line + db_roadmap §10 Done-row, so their opening session finds it** (`CHANGELOG` was retired 23/07/2026 — this replaces the old "name modules in the CHANGELOG line"); fix module-1.md "params UI → M9" note (design-notes risk #7); db_roadmap rows (A-9/11/12/14/17/19, C-1, C-6, §7.85, §6 table rows) marked applied; CLAUDE_CODE_LOG; STATUS. Verify: greps + diff review.

**Step 5.4 — Closing audit + PR 🔻👤.** FRESH session runs the `module-close` skill (its `template.md` — the ex-`create_module_final_test_template.md`, relocated 23/07) with MODULE_NUMBER=3 · MODULE_NAME=הצעות מחיר · BRANCH_NAME=ishay/module-3-quotes-build: independent re-verification → DoD **typed-echo** sign-off → PR instructions (base:dev ← ishay/module-3-quotes-build) + 🧩 Chrome prompt. Post-merge items (PR/CI/merge) are NOT audit checkboxes. ↳ as-built (23/07): template path moved into `.claude/skills/module-close/`; branch corrected to the live `-build` branch.

### 6. 📊 QA Matrix

| Type | Planned | As-run |
|---|---|---|
| Unit | pricing.js (6,319 exact, tiers, discounts, ceil), catalog labels vs DB CHECKs, validators | **376 tests green** as of 4.4 (324 at 3.6, 290 at 3.5). ↳ 3.6 added 18 (written first, watched fail): `validateTierRows` incl. the real seed tiers · `computeMarginPercent` from real catalog numbers · `formatShekelExact`. ↳ 4.3b added 5 (coverage-map gaps) on top of 4.2/4.3's E2E-only work — unit count unaffected 01/08 (5.1 was a live-screen scenario, no new unit tests) |
| Integration | RPC battery (approve/double-click/rollback/permission), lock trigger, expiry job manual run, impersonation RLS matrix | Phase-1 battery done (§1 table). **↳ 3.4 added a live server-side chain: Edge Function auth+permission gate → Make → Gmail, plus the `email_log` write** — verified by real sends, see §9. **↳ 4.1 re-ran the approve battery on the ROUND-G function and all 7 guards returned their failure, plus a two-directional `closing_unit_cost` freeze proof; zero net DB change, read back after** (§9 31/07 19:40). **↳ 4.2 CLOSED THE LAST GAP — the expiry job was run for real** inside a rolled-back transaction: the two rejection CHECKs, the lock trigger on both `update` and `delete`, the **job body verbatim** driven by the param (30⇒1 ⇒ exactly 4 rows flip to `rejected`+'פג תוקף'), and the param guard returning its Hebrew failure. Zero net change, read back **outside** the transaction (§9 31/07 21:43). **↳ 4.3b closed the one remaining lock-trigger gap** — the `quote_services` branch of `quotes_lock_non_in_progress` had never actually run (only the `quotes` branch had); proven live for both `UPDATE` and `DELETE`. **↳ 5.1 (01/08) ran the full RPC chain for real, NOT rolled back** (by design — this is the binding acceptance scenario, not a guard-proof): `create_quote` → `approve_quote_and_create_project`, both through the live UI, both read back via `execute_sql` as frozen evidence (quote #21 `approved`, `vat_rate_snapshot`/discounts frozen; project #7 born `not_started` with `required_hostess_count` correctly summed from the real hostess line, not the recommendation field) |
| E2E | quotes.spec.js + prices.spec.js (CEO+STAFF journeys) + existing 3 suites | ✅ **DELIVERED 31/07 (4.2+4.3): `quotes.spec.js` 9 · `prices.spec.js` 7 · `quote-email.spec.js` 6 — suite 44 ⇒ 66.** The `prices.spec.js` warning below was **obeyed**: every write path is `page.route`-intercepted, the live catalog is never touched (read back after the full run: 11 products · 40 tiers · `B-REG-TAG` still 6.00/5.50/5.00/4.50/4.00). **↳ 3.4's five throwaway specs are now replaced by a permanent one** — the 8-field wire contract (incl. the 3 meta fields whose absence leaves `email_log` silently empty), the attachment proven by **bytes** (`JVBERi0…` = `%PDF-`), `dir="rtl"` in the body, all three outcome states, and the "already sent" indicator read from the journal across a page reload. *(History: 3.4 used five throwaway specs — send · resend · body-format · RTL · builder-preview + refresh-survival — and 3.6 one more with 7 tests, all deleted after use.)* **↳ 4.3b (01/08) added 5: suite 66 ⇒ 71** — the `quote_services` lock-branch (real gap, never exercised before), both pricing params (save + a validator-boundary negative), 'אחר' rejection notes proven *delivered* not just blocked, product-status toggle payload. **↳ 5.1's demo-data delta (quote #21, project #7) broke 3 real assertions in `customer-page.spec.js` + the smoke-anchor revenue value — found by grep, fixed with live re-verification, all specs re-run green (see `e2e/customer-page.spec.js`'s own ↳ notes and commit `be00744`).** |
| Regression | `npm run verify` + M1/M2 smoke screenshots | `npm run gate` exit 0 at every step end. **↳ 30/07: 10 existing E2E specs re-run green after 3.4's shared-file edits** (`api.js`, dialogs). **↳ 01/08 (4.4) — full gate green INCLUDING `knip`** (its OOM crash is confirmed environment-load, not code: it passed clean once concurrent-session count dropped) **· E2E baseline 66→71 · M1 (permissions matrix)/M2 (customers list+record page) manual smoke, 5 screenshots, CEO role only** (scope boundary, not an oversight — E2E already covers the other 4 roles in depth; manual smoke is a visual spot-check, not permission coverage). **⚠️ One documented load-sensitive flake** (`quotes.spec.js:68`, shared `login()` redirect wait timed out under heavy concurrent-session load, recovered clean in isolation and in a full re-run) — tracked beside step 4.4, not silently retried. |
| UAT | Deferred to M12 (§6 ruling); Ishay's phase gates = interim UAT | |
| Security/Pen | RLS positive+negative controls, §7.83 open-read proof, DEFINER RPC internal check, advisors after every migration | Phase-1 matrix done. **↳ 3.4: the Edge Function's two gates (JWT + `edit` on 'הצעות מחיר' resolved per-role) — the role-scoping half was got wrong first and fixed; `email_log` has no client write policy; advisors after migration 8 = zero new findings.** **↳ 4.1 closed HALF of the debt:** finance is proven refused by the **conversion RPC itself** (`42501`, with a CEO control returning `P0002`). **↳ 4.3 CLOSED THE OTHER HALF — and the debt is now fully paid:** finance calling `send-email` directly with her JWT gets **403**, and the discriminating control is a CEO call with the **same empty body** returning **400** — chosen because the permission gate runs *before* the body is parsed (`index.ts:71` vs `:84`), so the control cannot send mail. **↳ 4.3 also added a third wall:** מנהלת פרויקטים PATCHing `products` directly ⇒ **0 rows** — asserted on the row count, not on an error, because an RLS refusal returns `[]` with `error: null` |
| Performance | Index C-6 used by expiry scan (EXPLAIN evidence); no further targets (internal tool) | |
| Usability | Filled from step 3.7 🎨 review + closing UX audit | |
| Compatibility | Chromium only now; cross-browser sweep = pre-M5 (§6 ruling) | |

### 7. ✅ Definition of Done
Canonical (architecture_and_qa_roadmap.md:32-41) instantiated:
- [ ] `npm run verify` green.
- [ ] Unit tests exist for all new `src/lib` logic (pricing/catalog/validators/**email**).
- [x] ~~5~~ **10** `module3_` migrations applied via MCP after typed-echo; `docs/schema.sql` snapshot refreshed; committed together. **(re-counted 01/08/2026, step 5.3, explicit definition — see §2 "Files to create" note above and `db_roadmap.md` §0.0)**
- [ ] CLAUDE_CODE_LOG + STATUS updated (end-of-session protocol each session; `CHANGELOG` retired 23/07/2026).
- [ ] No secrets in code (CI gitleaks green locally).

Module-specific:
- [ ] Seed counts exactly 11/40/20 + name-match audit (20 param names = code strings).
- [x] 6,319 ₪ EXACT in unit test AND live UI AND PDF. **(unit: `pricing.test.js` since 2.1. Live UI + PDF both closed together 01/08/2026, step 5.1 — the binding acceptance scenario built through the real screen, `6,319 ₪` read from the live `quote-total` DOM element before saving, and the same figure verbatim in the fetched real PDF bytes, both pages visually reviewed.)**
- [ ] Policies: quotes 2 · quote_services 2 · catalog 3×2; impersonation matrix evidence.
- [ ] Lock: UPDATE/DELETE on non-in_progress errors (SQL evidence).
- [x] RPC: born-complete project + logistics rows + freezes + double-click safe + permission-checked. **(4.1, 31/07 — rolled-back battery, every guard returned its failure; `closing_unit_cost` freeze proven in both directions, not by equality.)**
- [x] pg_cron: 2 jobs scheduled (fixed UTC hour per §7.56 nod) + simulated-run evidence. **(4.2, 31/07 — the expiry job body was run verbatim inside a rolled-back transaction, driven by the real param: 30⇒1 flipped exactly the 4 open quotes to `rejected`+'פג תוקף'; emptying the param made it raise instead of silently updating 0 rows. Both jobs' scheduling was already evidenced in 1.5.)**
- [ ] PDF: Hebrew RTL + embedded font screenshot (§7.41 — real verification, no rubber-stamp). **❌ NOT checked, 01/08/2026 — two real BiDi defects found by the work-manager's own visual document-pass of the 5.1 PDF** (both pages, methodically — a pass the build session's own review missed, having verified content/numbers but not character-order): **(1)** the "הנדון" (subject) field scrambles mixed Hebrew/Latin/punctuation content — an event name containing English text + parentheses (`תרחיש-קבלה 5.1 (מדריך-מיקרו §Step 5.1)`) reorders unreadably; **(2)** the bullet points on the terms page (`QUOTE_TERMS`) sit at the start of the line rather than the RTL-correct position. Font-embedding itself is fine (3.1 already verified TTF/Heebo rendering). **Both are pending Ishay's ruling — explicitly NOT fixed this round** (out of scope for 5.2/5.3, a documentation-only round). This box stays open until he rules and a fix (if any) is verified.
  **↳ 01/08/2026 (fix-round item 3) — Ishay ruled "fix now"; the code fix has LANDED and is
  measured, but this box DELIBERATELY STAYS OPEN.** Root cause turned out to be one mechanism
  behind all three reported defects (`direction` is not an inheritable style in react-pdf, so
  every Hebrew `<Text>` needs it on itself — see §9 and `03_quotes/CLAUDE.md`). Measured
  before→after on rendered PDFs: terms-page periods moved to line-end, "הנדון" reorders
  correctly, "30 יום" clean; real quote #21's waterfall re-verified verbatim
  (6,300→-315→-630→5,355→964→**6,319 ₪**). **Why still open:** every check so far is *mine*
  (rendered-PDF reads + 2 mutation-proven unit guards that verify the mechanism, not glyph
  order). §7.41 asks for real verification of what the customer sees, and the work-manager's
  standing condition is that **Ishay's own eye on the corrected document** closes it. Check
  this box only after he confirms — not on the strength of the tests.
- [x] Rejection requires reason (~~7~~ **8** values, incl. 'נפתחה בטעות'); 'אחר' requires notes; expiry lands as 'פג תוקף'. **(4.2, 31/07 — proven on BOTH layers: the two DB CHECKs returned `23514` in the rolled-back battery, and the dialog blocks each case with 0 network writes counted; 'פג תוקף' reaches the נדחו tab and its breakdown.)**
- [ ] **↳ ADDED 30/07 — email send (step 3.4), five separate boxes because each failed at least once:**
  - [ ] the mail **arrives**, and the attachment **opens** — verified by size/bytes, not by filename or MIME type;
  - [ ] the body is **RTL** and keeps the template's line breaks (direction incident #5 — an artefact leaving the system runs its own direction pass);
  - [x] `email_log` gets a row per send (**including failures**), and the dialog's "נשלח כבר" indicator **survives a page refresh**; **(3.4 proved the row is written by real sends; 4.3 made the refresh-survival permanent — `quote-email.spec.js` reads the REAL journal row of quote #6, reloads the page, and finds the indicator again, with quote #7 as the negative control. The `log_failed` path — mail out, journal write dead — is asserted as its own state.)**
  - [x] the Edge Function refuses a `view`-level user **server-side** (not just a hidden button); **(4.3, 31/07 — finance's own JWT ⇒ 403 `אין לך הרשאה`; CEO control with the identical empty body ⇒ 400 `חסרים נתונים`, which is what proves the 403 came from the role and not from the payload. Permanent test: `e2e/quote-email.spec.js`.)**
  - [ ] the Make scenario answers 200 **only after** the mail module succeeded, and carries a Skip error handler so one bad recipient cannot disable it.
- [ ] §6 מ3 debts closed (history/metrics/filter/contacts-note) + module-1.md correction + db_roadmap updated.
- [ ] UX-&-validation checkbox: 🎨 review passed (design/states/RTL/keyboard) + validation-completeness (spec'd implemented, spec-silent confirmed).

Post-merge (NOT audit checkboxes): PR opened, CI green, merged to dev.

### 8. 🔄 Self-Update Protocol
(a) Every step transition updates the status header + step table in the same session, before moving on. (b) Any deviation gets an inline "↳ as-built" note on the step + a line in §9. (c) The repo's Stop hook (`.claude/hooks/check-docs-updated.sh`) blocks session end if module code under `src/modules/03_*/` changed but this guide didn't — keep it current, not as an afterthought. (d) End-of-session protocol in `CLAUDE.md` applies (this guide → CLAUDE_CODE_LOG → STATUS; the CHANGELOG was frozen 23/07/2026 and is never written to). (e)–(g): per CLAUDE.md iron rules 13/15/16 + end-of-session protocol (new §7 questions → presented in Ishay's question style and registered, never self-answered; migrations/DB gaps ⇒ db_roadmap same session; schema/shared-surface changes name the FUTURE modules they land on in the CHANGELOG line). (i) **Compaction (added 28/07/2026 — this guide is read in full on every "תמשיך לבנות" turn, so it must not grow without bound):** when a phase closes, replace its step-by-step build instructions with a compact done-table — one row per step: what landed + the evidence that proved it — plus a short "carry-forward" note for anything later phases must not re-derive. **Never compact the active phase.** §9 (deviations/tech-debt) and the Ledger are **never** compacted; they are the memory. Archive the pre-compaction text under `docs/archive/` first. At module close the whole guide compacts to an as-built summary. (h) On ENTERING a phase: sweep this Ledger for OPEN/nod-pending items anchored to this phase's steps and present them to Ishay for a consolidated ruling (P13 style) BEFORE the phase's first step — as of 23/07 **0 OPEN items remain** (LOCAL-6 ruled 23/07: notes block after totals, before terms).

### 9. 📝 Deviations & Tech-Debt Log
- 01/08/2026 (fix-round item 2) — **`cost ?? 0`: the four sites that undid `flattenProductCost`'s
  own discipline. Ishay's ruling (delegated, option ב'): dashes everywhere + name the product;
  no partial profitability.**
  **(1) Reported honestly before building: this was a DORMANT guard, not a live bug.** Measured
  on the live DB — `products LEFT JOIN product_costs WHERE null` ⇒ **0 rows**;
  `quote_services WHERE closing_unit_cost IS NULL` ⇒ **0 of 23**; and the profitability panel is
  gated on the same `canEdit` group the `product_costs` policy admits. Recommended fixing anyway
  (asymmetric cost of the failure; the two facts protecting it are fragile — `createProduct` is
  **two writes without a transaction**, and M8 will hold `edit` on 'כספים' without 'הצעות מחיר').
  **(2) TDD, and the failing output stated the bug better than prose could:** before implementing,
  `deriveProfitability(5355, null)` returned **`{ cost: 0, grossProfit: 5355, marginPercent: 100 }`**
  — profit equal to the entire revenue, 100% margin, no error. 4 tests written first, all watched failing.
  **(3) `sonarjs` caught me duplicating an existing helper.** The `numberOrNull` I added was
  byte-identical to `paramNumber` already in the file. Deleted mine, reused the existing one, and
  generalised its comment (it now serves cost as well as system params) — rule 14, not a suppression.
  **(4) Live verification with a positive control, after a first attempt that proved NOTHING.**
  First run intercepted the catalog on a *saved* quote's edit screen and showed **identical numbers
  in both arms** — because `quoteToFormState` correctly falls back to the row's frozen
  `closing_unit_cost`, which is a legitimate known cost. That is real logic, not a broken probe, and
  **the unknown path only exists on a NEW quote**. Re-ran on `/quotes/new`: intercepted arm ⇒ 3 dashes
  + `לא ניתן לחשב רווחיות — חסרה עלות רכש למוצר: …` (2 catalog requests intercepted); control arm ⇒
  real numbers, 0 intercepted, no notice. Both screenshotted.
  **(5) A copy defect caught in the screenshot, not by any test:** the first wording was
  `…עלות רכש ל-תג שם רגיל - ממותג`, i.e. **two hyphens doing different jobs** (prefix vs. part of the
  product's own name). Reworded to `למוצר:` / `למוצרים:` with `·` between names — `src/CLAUDE.md`'s
  own "מעבר-ניסוח" rule. Plural form verified live with two cost-less products.
  **384 unit** (was 378) · **73/73 E2E** · lint+prettier clean. Zero DB writes throughout.
- 01/08/2026 (fix-round item 3) — **PDF BiDi: all three defects were ONE root cause, and the
  first proposed fix would have been a silent no-op.**
  **(1) The hypothesis was right about the cause, wrong about the location — caught by reading
  the library, not by trying it.** The plan said "add `direction:'rtl'` to `styles.page`".
  Before writing it, checked `@react-pdf/layout`'s source: `BASE_INHERITABLE_PROPERTIES`
  contains `textAlign` but **not** `direction`, and `getFragments` reads it from the `<Text>`'s
  own `instance.style` with a hard `'ltr'` default. **Setting it on the Page would have changed
  nothing, silently** — and the visual check afterwards might well have been read as "partly
  helped". Fix: `const RTL = { direction: 'rtl' }` spread into every Hebrew-bearing text style.
  **(2) All three reported defects are one mechanism, not three.** `textAlign:'right'` is
  alignment, not direction; without an RTL base every Hebrew paragraph is treated as a run
  embedded in an LTR paragraph, so neutrals (period, parens, digits) migrate to the wrong edge.
  Measured before→after on a rendered PDF: terms-page periods moved from line-**start** to
  line-**end** (`.IN-REG ...מול` ⇒ `...מול REG-IN.`), the mixed-content "הנדון" field reordered
  correctly, and the "30 יום" line reads clean. Manager's third defect needed no separate fix.
  **(3) A real bug was introduced by the fix and caught by measurement, not by luck.**
  `styles.pairVal` gained `direction:'rtl'` — and `<Ltr>` built its style as
  `[{direction:'ltr'}, style]`, i.e. **the passed style wins**. ח"פ, טלפון, תאריך and שעות all
  flipped at once (the exact double-flip the work-manager warned about). Structural fix:
  `<Ltr>` now writes its own direction **last**, so no call-site can override the one thing it
  exists to do. `CELL_GAP` deliberately left without `RTL` for the same reason.
  **(4) Tests: 2 new, both watched failing on deliberate mutations before any green was
  reported.** Removing `RTL` from one Hebrew style ⇒ 7 texts flagged; restoring the old `<Ltr>`
  order ⇒ the 4 latin values flagged by name. **What they deliberately do NOT claim:** they
  verify the *mechanism*, not glyph order on the page — that is unreachable from a unit test,
  and an assertion pretending to measure it from the text layer would be a guard that passes on
  a broken document. Stated in the test file itself, not just here.
  **(5) Money regression, per the work-manager's explicit condition:** real quote **#21**
  re-rendered read-only from live DB data — waterfall reads **6,300 → -315 → -630 → 5,355 →
  964 → 6,319 ₪** verbatim, identical to 5.1's recorded evidence; `<Ltr>` values unchanged
  byte-for-byte vs. the pre-change baseline. **378 unit** (was 376) · **73/73 E2E** ·
  `eslint`+`prettier` clean. One E2E flake-and-recover on `quote-email` (the documented
  load-flake) — **not waved away**: because that test asserts on real PDF bytes it was re-run
  twice, both green, before being called a flake.
  **(6) Open, NOT closed by me:** the §7 DoD "PDF RTL + font" box stays unchecked pending
  Ishay's own eye on the corrected document — the work-manager's standing condition. Also
  observed, not fixed: a pathological event name (deliberately built for the repro) still wraps
  awkwardly across two lines. Real event names are short; flagged rather than engineered around.
- 01/08/2026 (fix-round item 1) — **Quote builder: silent-panel bug fixed (audit finding, scoped
  down by Ishay — "אין-טיוטה is intentional, the save-block on illegal numbers is correct and
  stays").** `computeQuoteTotals` (`pricing.js`) throws when the sum of the two discounts exceeds
  100% (classic typo: 100 instead of 10). Before the fix, `QuoteBuilderPage.jsx`'s `try/catch`
  around it (line ~228) returned `totals=null`, and `{totals && <QuoteSummaryPanel/>}` (line ~672)
  made the **entire panel — including the Save button — vanish with zero explanation.** Worse: the
  existing inline validation (`errors.manualDiscount`, "סכום ההנחות חורג מ-100%") could never
  surface for this case either, because it's gated on `submitAttempted`, which is only set by
  clicking the Save button that had just disappeared — a dead end with no escape hatch visible on
  screen. **Fix:** when `totals` is `null`, render a red `data-testid="quote-totals-blocked"` box
  in the panel's place (`ההנחות חורגות מ-100% (X% + Y%) — לא ניתן לחשב סיכום ולא ניתן לשמור. תקנו
  את ההנחה הנוספת.`) instead of nothing. Save stays blocked (there is no Save button in this state,
  same as before — that part was correct and untouched). Reproduced the failure first: new
  `e2e/quotes.spec.js` test fills `#quote-manual-discount`=150 on `/quotes/new` and asserts the
  message; **watched it fail on the pre-fix code** (`quote-totals-blocked` never appears, `git
  stash` of the one-file fix + re-run), then watched it pass after `git stash pop`. Also verified
  live in the browser (logged in as CEO): message renders correctly in RTL, panel/Save button
  return once the discount is corrected back under 100%. Full `e2e/quotes.spec.js` suite (12 tests)
  green, no regressions; `eslint` clean. Files: `src/modules/03_quotes/QuoteBuilderPage.jsx`,
  `e2e/quotes.spec.js`.
- 01/08/2026 06:4X — **Steps 5.2+5.3 closed (combined round, work-manager's explicit task list).**
  **(1) Two open items from 5.1 closed first, per instruction:** quote #6 confirmed untouched
  (`quote_status`/discounts/`updated_at` all identical to pre-5.1, its 3 lines' prices/costs
  unchanged) via `execute_sql`, not assumed. `grep`-swept the E2E suite for count/id-coupled
  assertions the 5.1 delta could break — found 3 real ones in `customer-page.spec.js`
  (`metric-revenue` 9,865→16,184, `metric-avg-deal` 9,865→8,092, `customer-tab-quotes` 2→3, all
  driven by quote #21 joining מדיטק's approved set) plus `smoke-anchors.json`'s revenue anchor.
  Every new value read from the **live screen**, not hand-computed — avoided a rounding mismatch.
  All touched specs re-run green (commit `be00744`).
  **(2) Migration recount — the work-manager's flagged 4-different-live-numbers finding (9/11/8/22)
  resolved with one declared, explicit definition.** Investigation surfaced something bigger than a
  stale count: the `schema_migrations` registry (21 rows) doesn't 1:1 match files on disk (22) —
  `module3_quotes_structure_and_constraints` has **no** registry row at all. Before treating this as
  a new incident, checked `PROJECT_MASTER.md` §86/`db_roadmap.md` §0.0: **already ruled** (§7.86,
  31/07/2026) — `apply_migration` stamps its own UTC version, and this exact file (plus
  `module2_customer_contacts`) were already documented as applied-but-unregistered. Independently
  re-verified tonight rather than trusting the old note blind: `customer_contacts` table exists,
  `quote_services.line_id` column exists — both genuinely live. **Declared definition adopted:**
  `module3_`-prefixed filenames on disk = **10** (was stuck at 9, missing the VAT-guard migration).
  `round_g_db_hardening` excluded from the M3 count (cross-module, not `module3_`-named) though it
  touches M3-owned `product_costs` — tracked as its own fact. Reconciled across `module-3.md` (§2 +
  DoD), `db_roadmap.md` (§0.0, re-measured live: 22 files/21 rows now vs 21/18 at 31/07 — the gap
  **grew by exactly the expected amount**, confirming the pattern continues rather than resolving),
  and `PROJECT_MASTER.md` (§86, added a dated ↳ re-measurement rather than overwriting the original).
  **(3) §4 security statement — round G's cost-RLS split was undocumented at the module level.**
  `src/CLAUDE.md` already had it (products.cost → product_costs, LEFT-join-never-becomes-0
  discipline); module-3.md's own §4 (the file iron rule 9 points to for this module) didn't.
  Added, citing tonight's own evidence that the freeze survived correctly (5.1's three lines froze
  costs 300/2.5/3 under the CEO role).
  **(4) §6 מ3 debts — checked, not re-done.** All four (מ3-inbound: leaderboard-by-revenue ruled
  not-needed, extra-contacts ruled not-needed, quote-history delivered, PDF-engine-as-pure-function
  delivered) were already struck through with dates from 30–31/07, by a prior session. The two
  forward debts (מ3→מ4/מ8/מ11's shared email engine, מ3→מ10's auto-send) already correctly name
  their target modules. No edit needed — verified by direct read, not assumed from the step-table
  description.
  **(5) `module-1.md`'s "params UI → M9" note — checked, found accurate, left alone.** M3 only
  delivered a narrow 2-param "מחירים" tab (§7.84); the general params-table editor genuinely
  remains M9's scope. Editing a note that isn't actually wrong would have been a false "fix."
  **(6) §6/§7 QA-matrix-and-DoD update scoped to tonight's own new evidence, not a full historical
  re-audit** — that's explicitly 5.4's job (a FRESH session, independent re-verification). Filled:
  unit-test count (376), the E2E-count progression (66→71→still-71-after-fixes), the gate-green-
  incl.-`knip` fact, and the two DoD boxes tonight's work directly changed the truth of: **6,319 in
  live UI AND PDF — now checked** (5.1 closed it); **PDF RTL+font — deliberately left UNCHECKED**,
  documenting the two BiDi defects instead of a rubber-stamp (the work-manager's own catch — see
  their 06:2X-ish cross-session message — after this session's PDF review had checked content/
  numbers but not character-order, the exact gap `src/CLAUDE.md`'s own "מעבר-כיווניות" protocol
  exists to catch).
  **(7) Explicitly NOT done, flagged not silently skipped:** `db_roadmap.md` rows A-9/A-11/A-14/
  A-17 lack their own inline "✅ APPLIED" tag (the fact is already in the 23/07 migration-1 log
  entry narratively) — a polish/consistency gap, judged lower priority than the items above given
  the round's time budget; left for 5.4 or a future pass, not hidden.
- 01/08/2026 06:1X — **Step 5.1 (the binding acceptance scenario) closed — built live through the
  real screen, not a shortcut through SQL, and approved (irreversible) with the work-manager's
  explicit authorization mid-4.5-gate (Phase 5 started before Phase 4's own 👤 gate, a deliberate
  parallel-track call, not a skip — see the Status line).**
  **(1) Customer + lines resolved from live data, not assumed.** מדיטק (customer_id 46) confirmed
  the only customer at exactly 5% via `execute_sql`. The hostess SKU took two tries: `04ST` has **no
  price_tiers row at all** (hostess products price straight off `base_price=500`, not a tier ladder
  like the branded products) — a first query joining `products`↔`price_tiers` for `04ST` came back
  empty and looked like a seed gap before checking `products.base_price` directly. `06ST` (800, "6
  שעות") shares the identical `description` text with `04ST` ("דיילת רישום והכוונה") — only
  `item_name` ("שירותי דיילת (4/6 שעות)") disambiguates, and that's what the Select renders.
  **(2) Built via a disposable Playwright script (chromium), same reasoning as 4.4's M1/M2 smoke** —
  the interactive Browser pane still can't composite frames in this unattended session. First attempt
  used `products.description` for the SKU-select labels and timed out 30s on `getByRole('option')`
  for both branded lines — wrong label source, not a real bug; fixed by reading `item_name` instead
  ("תג שם רגיל - ממותג" / "שרוך בד - ממותג"), confirmed via `execute_sql` before the retry, no
  guessing a second label blind.
  **(3) The exact total was read back from the live DOM (`quote-total` text) BEFORE clicking save
  or approving** — split into two separate script runs deliberately, so the irreversible approval
  only fired after the totals screenshot was visually confirmed as `6,319 ₪` byte-for-byte, matching
  `computeQuoteTotals`'s worked example in `pricing.test.js` (subtotal 6300 → -945 → 5355 preVat →
  963.9 VAT → 6318.9 → displayed `6,319 ₪`).
  **(4) PDF verified on real bytes, not a screenshot of the empty iframe** — `03_quotes/CLAUDE.md`
  already documents that headless Chromium has no built-in PDF viewer, so `<iframe src="blob:...">`
  renders blank; the existing E2E pattern (`customer-page.spec.js`) fetches the blob and checks
  `%PDF` header + size. Extended here: the fetched bytes were also **saved to a `.pdf` file and
  opened with the Read tool**, which can render PDF pages directly — giving a genuine visual
  confirmation of the waterfall (both pages), not just a byte-count assertion. **One real bug caught
  in my own script, not the app:** the first draft used Node's `Buffer` inside `page.evaluate`
  (browser context) — `Buffer` doesn't exist there (the same class of gap as 4.4's undocumented
  "Buffer is not defined" console warning, though unrelated in cause); fixed with a chunked
  `String.fromCharCode`+`btoa` browser-side encode before handing the base64 back to Node.
  **(5) Demo-data delta, read back live (pattern from 3.7):** `quotes` **#21** (מדיטק, 300 guests,
  `approved`, `vat_rate_snapshot=18.00`) · `quote_services` **#35–37** (04ST/B-REG-TAG/B-FAB-LAN,
  prices+costs frozen: 500/300 · 5/2.5 · 6/3) · `projects` **#7** (`quote_id=21`, `project_status=
  'not_started'`, `required_hostess_count=6` — F22, summed from the actual hostess line qty, not
  the form's recommendation field — `final_event_date/start_time/end_time/event_name/customer_id`
  all correctly inherited from the quote). Zero rows touched outside this one quote+project pair.
- 01/08/2026 05:5X — **Steps 4.3b+4.4 closed, built solo overnight by the dedicated build session
  under live direction from the work-manager session (cross-session messages, not a one-shot
  prompt) — Ishay asleep throughout, per his own go-ahead.**
  **(0) Session survived a hard crash mid-step.** A general Claude outage (~05:28) hit right after
  the first `npm run gate` attempt (which had already failed on `knip`'s OOM — see below). On
  resume, re-derived truth from disk rather than trusting pre-crash context (global discipline):
  `git log`/`git status` confirmed HEAD=`6e2423f`, tree clean, **nothing lost** — no commit had
  landed yet, so 4.4 restarted clean from the top. The work-manager independently verified the same
  HEAD before re-issuing the go-ahead.
  **(1) `knip` finally green — the 4.3b blocker resolved itself.** Two OOM crashes across the
  session (`Array buffer allocation failed`, same signature as the 4.3b night) both happened while
  4+ Reg-In sessions were live; the crash cut that down, and the very next `knip` run (post-resume)
  passed clean with only a benign `.css` config hint. **Environment-load issue, not a code issue** —
  documented at 4.3b/4.4's carry-forward rather than "fixed."
  **(2) 🔴 Real ESLint scope bug found and fixed, not just worked around (commit `d016c93`).**
  `npm run lint` failed on `playwright-report/trace/assets/*.js` — a minified third-party bundle
  (Playwright's trace viewer) scanned as source, throwing `no-undef`/`no-cond-assign`/etc. Root
  cause: `eslint.config.js`'s `globalIgnores` only ever listed `dist`; `playwright-report` and
  `test-results` are gitignored but were never excluded from ESLint's own file matcher. Any `gate`
  run after any `test:e2e` run would have failed the same way — this was not a one-off. Fixed by
  adding both to `globalIgnores`. Reported to the work-manager before committing; the work-manager
  independently verified the diff against the description before approving it as its own commit.
  **(3) The known `quote-email.spec.js` login-redirect flake recurred — but in a different file,
  proving it's systemic, not file-specific.** First full `test:e2e` run: 70/71, with
  `quotes.spec.js:68` timing out (30s) waiting for the post-login redirect inside the shared
  `login()` helper — while `quote-email.spec.js`'s own login-dependent tests had just passed clean
  moments earlier. Per the work-manager's protocol (agreed live, not improvised): stopped and
  reported rather than silently retrying; isolated the single file (`npx playwright test
  e2e/quotes.spec.js`) — 11/11 green, that same test now taking 3.8s instead of timing out at 30s.
  Documented as a known load-sensitive flake beside step 4.4 (not built into auto-retry logic — a
  retry policy is Ishay's product call). Full 71-test suite then re-run clean end to end: **71/71,
  4.3m.**
  **(4) M1/M2 manual smoke — Browser-pane screenshots unavailable in this unattended session
  (pane not displayed, confirmed after retrying, not assumed).** Fell back to a disposable Playwright
  script (chromium, same engine `test:e2e` already uses) that logs in as CEO and screenshots M1
  (`/system/permissions`) and M2 (`/customers` list + a record page) to
  `scratchpad/{01_login,02_home_after_login,03_M1_permissions_matrix,04_M2_customers_list,
  05_M2_customer_record_page}.png`. The script ran from a temporary copy inside the repo tree
  (Node module resolution needs it there) and was deleted immediately after — never committed,
  `git status` confirmed clean. **First M1 capture caught the page mid-loading** ("טוען…", empty
  matrix) — own timing bug in the smoke script, not an app defect; fixed by waiting on the
  `מטריצת הרשאות` heading + `networkidle` instead of a fixed delay, then re-captured and visually
  confirmed the full matrix (8 modules × 5 roles, teal design language, RTL correct). All 5
  screenshots visually inspected before reporting — not just "the script exited 0."
- 31/07/2026 21:43 — **Steps 4.2+4.3 built as ONE round. 22 new E2E tests, and not one row of the
  live DB changed.** Baseline measured **first**, before touching anything: `npm run test:e2e` =
  **44 passed, exit 0** (zero flakes that run — including the known `permissions.spec.js` one).
  **(1) The rolled-back SQL battery — every guard returned its failure** (pattern copied from 4.1,
  not re-invented; full text in the round's git history):
  · no reason ⇒ `23514 | quotes_rejected_iff_reason`
  · reason `אחר` without notes ⇒ `23514 | quotes_rejection_notes_required`
  · legit reject of #6 ⇒ `rejected / תקציב לקוח`, then any further update ⇒
  `P0001 | הצעה נעולה: … (נמצא: rejected)`; a separate block proved `delete` on #11 fails the same way
  — ⚠️ **and the MCP safety classifier did NOT block it**, unlike the 14/15 cleanup earlier today
  · **expiry job**: `ימי_תוקף_הצעה` 30⇒1 inside the transaction, then the job body **verbatim from
  the migration** ⇒ `4 quotes flipped` — #6,#7,#8,#9 all `rejected/פג תוקף`
  · param emptied ⇒ `P0001 | פרמטר ימי_תוקף_הצעה חסר או אינו מספר שלם…` (the guard, proven by
  returning its failure — not by watching it pass)
  · **read back OUTSIDE the transaction:** 8 quotes `6..9 in_progress · 10 approved · 11/12/13 rejected`,
  param back at 30, 1 project. Byte-identical to the pre-state.
  🔑 **Why the param and not the timestamp:** the obvious way to simulate expiry is to backdate
  `updated_at` — and it **cannot work**: `quotes_set_updated_at` (moddatetime) overwrites it on the
  very same UPDATE. Measured before writing the battery, not discovered by a failing run.
  **(2) `e2e/quotes.spec.js` (9) · `e2e/prices.spec.js` (7) · `e2e/quote-email.spec.js` (6).**
  The third file is not in the blueprint's step line — it is 3.4's two booked debts, which the 🔴
  box beside 4.3 says a session would otherwise close without.
  **(3) 🔬 Four mutations, four reds — the tests were watched failing on broken code:**
  · deleted the "reason required" line in `RejectQuoteDialog` ⇒ "בלי לבחור סיבה" red
  · `EXPIRING_SOON_DAYS` 7⇒60 ⇒ **both** chip tests red
  · dropped `dir="rtl"` from `plainTextToEmailHtml` ⇒ the email-contract test red
  · below-cost warning ⇒ error in `validateTierRows` ⇒ the LOCAL-20 test red
  17 other tests stayed green throughout, so each red is attributable to its own mutation. All four
  reverted and verified by grep.
  **(4) One src change, additive:** `data-testid="access-denied"` on `ProtectedRoute`'s denial
  screen. Four existing suites pin that screen by **Hebrew string** while E2E never runs in CI —
  a copy edit there breaks tests silently. The string itself is untouched.
  ⚠️ **Two of my own test bugs, both caught by the tests failing (recorded because both are the
  same species — asserting the shape I imagined instead of the shape that exists):** the tier
  warning is computed **on save only** (typing clears it), and the wire field is **`pdf_base64`**,
  not the `attachmentBase64` the builder function accepts. The second is exactly the Make-contract
  drift the test exists to catch.
  **(5) 🔴 A THIRD test bug that only the FULL run could expose — worth more than the two above.**
  Two separate full runs failed on *different* tests (once two existing `server-messages` ones, once
  mine), each passing alone. The cause was not flakiness: `interceptCatalogWrites` let reads through
  with **`route.fallback()`**, which re-runs route matching for every passing request — and the
  prices screen fetches tiers **per product** (12 reads on load). Alone it is invisible; in the
  66-test serial run the added latency crossed the 10s expect ceiling. Fixed to **`route.continue()`**
  in both suites; the full run then went **66/66** *and* got faster (7.2m ⇒ 5.7m), which is the
  evidence that the diagnosis was right and not a lucky re-roll.
  ⛔ **The lesson, for any future interception:** `route.fallback()` on a read path is a hidden
  per-request tax. Use `continue()` unless you deliberately want another handler to see the request.
  🔑 **And the meta-lesson: "passes when run alone" is not a verdict, it is the symptom.** Both
  earlier instincts — "known flake" and "pre-existing" — were wrong, and the baseline run measured
  *before touching anything* (44/44, zero flakes) is what made that provable rather than arguable.
  **(6) Final evidence:** `npm run gate` **exit 0** · **376 unit** · **E2E 66/66, 0 skips** ·
  live DB read back after everything: 8 quotes in the same statuses · 11 products · 40 tiers
  (`B-REG-TAG` still 6.00/5.50/5.00/4.50/4.00 — the 0.01 the test types never landed) · 1 project ·
  1 `email_log` row · `ימי_תוקף_הצעה` = 30. ⚠️ **In fairness: the first `gate` invocation returned 1.**
  Every stage was then run individually (lint · format · 376 tests · build · dup · knip · audit ·
  check:context — all clean) and a full re-run returned 0; recorded rather than quietly re-rolled.
- 31/07/2026 19:40 — **Step 4.1 CLOSED — the approval edges are proven, and not one existing row
  was changed.** Baselines measured first, not assumed: **376 unit** · **38 E2E** (⚠️ the 39 quoted
  in the 17:55 entry and by the manager session is **off by one** — statically 4+3+7+3+5+4+2+10 = 38
  excluding the smoke suite, and the run agrees; corrected here rather than propagated).
  **(1) The rolled-back SQL battery — all seven guards RETURNED their failure**, on quote #6, CEO
  impersonated, one aborted `do` block (pattern now written up beside step 4.2):
  · past date ⇒ `P0001 | לא ניתן לאשר הצעה שתאריך-האירוע שלה עבר (2026-07-30)`
  · **today itself ⇒ approved** — the half that actually proves "today allowed" (§7.32) rather than
  only "yesterday blocked"; both halves in one run, on the same quote.
  · born complete ⇒ `name=כנס לקוחות שנתי | cust=46 | date=2026-07-31 | loc=אקספו תל אביב, ביתן 2 |
  18:00:00-22:00:00 | hostess=6 | status=not_started | owner=<caller>` · logistics
  `B-REG-TAG#1 x300, B-FAB-LAN#2 x300` (exactly the 2 non-hostess lines, serials 1..N) ·
  `vat_rate_snapshot = 18.00`
  · double-click ⇒ `ההצעה כבר טופלה (סטטוס approved)` **and `projects` count for the quote = 1**
  · lock trigger ⇒ `הצעה נעולה: … (נמצא: approved)`
  · view-role (finance) on a still-open quote ⇒ `42501 | אין הרשאה: נדרשת עריכה על הצעות מחיר`
  **🔬 `closing_unit_cost` was proven FROZEN in both directions, which equality alone cannot do.**
  Reading the seed rows shows the line cost equal to the catalog cost — that proves *populated*, not
  *frozen*. So inside the transaction the catalog was moved **before** approval (`04ST` 300 ⇒ 999):
  the approved line became **999**, proving the RPC reads `product_costs` at approval; then the
  catalog was moved again (⇒ 111) and the line **stayed 999**, proving it is frozen after. ⛔ A future
  session must not "simplify" this to a single equality check — that check passes on a broken freeze.
  **Post-battery read-back:** 8 quotes (4/1/3) · 1 project · 2 logistics rows · quote #6 back at
  `2026-08-22 / in_progress / notes intact / vat null` · `product_costs(04ST) = 300.00`. Identical
  to the pre-state. ⚠️ **What does NOT roll back: sequences.** `projects.project_id` 6 was consumed
  (5 was already burned by round A's control run). Internal id, not the customer-facing quote number.
  **(2) `e2e/quote-approval.spec.js` — NEW, 6 tests, deliberately additive.** Checked first what
  round D's spec already covers on screen (double-click · no-hostess · 42501 · P0002 · unknown-error ·
  lock-on-reject) and built only the gaps: the §7.32 date message (its failRpc string is the
  **verbatim live output** measured in (1), not an invented one) · view-role has no approve control
  on `/quotes` **and** on `/customers/:id` · the RPC itself refuses her · a closed quote shows no
  approve control even for the CEO.
  🔒 **The one test that touches the real RPC runs on `p_quote_id = 999999`** — the permission guard
  executes *before* the row lookup, so a healthy system answers `42501` and a broken one answers
  `P0002`; either way there is no row to approve. **And that discrimination is itself a test:** the
  identical call as CEO returns `P0002`, which is what stops the 42501 assertion from passing for the
  wrong reason.
  **🔬 Three of the six were mutation-proven (watched failing):** dropping the past-date rule from
  `SERVER_MESSAGE_RULES` ⇒ the alert reads `"אישור ההצעה נכשל."` · widening both permission gates to
  `!== 'blocked'` ⇒ **4 approve buttons appear for finance on `/quotes` and 1 on the customer page** ·
  forcing `isOpen = true` ⇒ the approved quote #10 grows an approve button. All three reverted;
  `git status` verified clean of them before the gate.
  **(3) A second staleness in the same comment block** (`src/lib/quotes.js`): it named
  `20260731085335` as the live RAISE source **and** claimed 11 P0001 sites. Measured live via
  `pg_get_functiondef`: the three RPCs live in `20260731155511` (round G rewrote all of them), the
  lock trigger in `20260723115000`, and P0001 is **9** sites, not 11. Both numbers were true for
  round A that morning and wrong by evening. The comment now says so explicitly — **a pointer to a
  migration file ages; a measurement from the DB does not.**
  **↳ (3b) and the same stale count was hiding in two MORE places** — found only because Ishay asked
  "what didn't you check": `db_roadmap.md` §6 (quotes row) and `src/modules/03_quotes/CLAUDE.md` both
  also said 11. ⚠️ **I had explicitly cleared the `db_roadmap` line earlier in the session** — I
  checked it for the migration *filename* and never for the *count*. Lesson worth carrying: when a
  fact drifts, `grep` the **number** too, not just the identifier you happened to be chasing. Dated
  journal entries that quote 11 were left alone (they were true when written — records are not rewritten).
  **Final numbers:** `npm run gate` **exit 0** · **376 unit** (unchanged by design — 4.1 added no
  `src/lib` logic, so it honestly added no unit tests) · full-suite E2E **44/44** (38 + 6) ·
  `npm run smoke` green · `projects_project_id_seq.last_value = 6`, confirming the burned-sequence
  claim by measurement rather than arithmetic.
  📸 **Visual pass (throwaway spec, deleted):** the finance user's `/quotes` and `/customers/46`
  screenshotted and reviewed — both screens fully intact (tabs 8/4/1/3, metrics, all 7 columns,
  `6,319 ₪` live), with **only the eye icon** in the actions column. The customer page shows LOCAL-15
  in one frame: "עריכת פרטים" present (she is `edit` on לקוחות) beside quote rows with no approve/
  reject (she is `view` on הצעות מחיר). A DOM-count assertion alone cannot show a screen is whole.
- 31/07/2026 17:55 — **Rounds E+F landed — the audit fix-plan is now empty and deleted.** Commits
  `2687447` (E, cleanup) and `c14bf32` (F, test gaps). Gate exit 0 · **373 unit tests** (from 366) ·
  E2E 39/39 · four before/after screenshots **byte-identical (md5)**, which is what "E changed no
  screen" rests on.
  **What a future session must not undo:**
  · `toError` + the `RLS_DENIED` idiom now live in **`src/lib/apiError.js`** (`assertRowsAffected`),
  consumed by all three `api.js`. ⛔ **`toWriteError` deliberately stayed in `03_quotes/api.js`** —
  it injects `quoteServerErrorMessage`, a module-3-only map; moving it would leak quote wording into
  modules 1 and 2.
  · `QUOTE_STATUS_LABELS`, `QUOTE_ACTION_LABELS`, `QUOTE_REJECTED_TOAST`, `quoteApprovedToast`
  (`src/lib/quotes.js`) are the single home for those strings. The four action labels are an **E2E
  contract** (`title=`) — changing the wording breaks two screens at once. The `פגה` branch and the
  tab labels (`מאושרות`/`נדחו`) stayed local **on purpose**.
  · `LoadingOrError` replaced hand-written JSX in `PricingParamsCard` and `PriceTiersDialog`, but the
  **outer `loading || loadError` guard stayed**. ⛔ Its error branch returns unconditionally, so an
  unguarded render emits an empty red `<p>` on every healthy screen. All 10 consumers now guard.
  · `validateTierRows` (`pricing.js`) imports `isValidPositiveInt`/`isValidPositivePrice` instead of
  restating the rules — the validators had tests but zero production consumers.
  **New CI job `edge-function-check`** (`deno check` on `send-email/index.ts`). ⚠️ It runs **without
  `npm ci`** on purpose: with the repo's `node_modules` present, deno demands every npm transitive be
  installed there and fails falsely. `deno.lock` is gitignored — the function floats on
  `jsr:@supabase/supabase-js@2`, same as the deployed runtime.
  **A correction worth carrying:** the F3 finding was stated as "a reversed comparator would keep the
  tests green". Measured, that is not quite right — a full reversal *was* caught. The real defect was
  narrower and still worth fixing: with A and B sharing `quoteRow()` defaults, the `[3,1,2]` assertion
  for positions 2–3 was produced by **input order under a stable sort**, not by the comparator.
  Proof: reordering the input array alone flipped the result `3,1,2 ⇄ 3,2,1` with no code change.
  The rows now differ in every sort field, and the two sorts return **different** orders.
- 31/07/2026 16:30 — **Round G (DB hardening) landed — `products.cost` no longer exists.** Commit
  `b3470f2`; migration `20260731155511_round_g_db_hardening` (+2 fix-forward). What a future M3
  session must know: the catalog query is now `select('*, product_costs(cost)')` and every consumer
  still reads a flat `product.cost` because `flattenProductCost` (`src/lib/catalog.js`) normalizes
  it in **both** API layers. ⛔ **Two invariants that break silently if touched:** the embed must
  stay LEFT (an `!inner` drops disabled products → the §7.34 0 ₪ bug returns), and a missing cost
  must stay `null` — `0` would read as "this product is free" and report revenue as pure profit.
  Both are locked by unit tests that were watched failing on the broken version. Writes are now two
  calls (`products` then `product_costs`), non-transactional by decision — this is a CEO-only
  maintenance screen used ~twice a year (§7.84), and a half-write shows as "—" and is fixable by
  re-saving. `create_quote`/`replace_quote_lines` raise a Hebrew `P0001` naming the **item** when a
  SKU has no cost row, and that prefix is mapped in `SERVER_MESSAGE_RULES`.
  ⚠️ **Process deviation worth not repeating:** the MCP connector timed out twice on the full
  payload; the compacted retry silently dropped two function bodies while the column drop DID run,
  briefly breaking quote approval and edit-save. **Compacting a payload is an edit and needs a
  re-read against the source.** Full account in the migration file header.
- 31/07/2026 15:20 — **⏸️ Ishay called the gold-plating, correctly — scope closed on round D.**
  His words: *"אתה מתאר מקרה קצה ממש, אולי פעם בחצי שנה משביתים מוצר ומה הסיכוי שבדיוק רוצים
  להשתמש בו"*. Applied his own reality filter and he is right about the **dropdown leak**
  (needs: disabled product × sitting on a quote × someone adding a line to that same quote ×
  picking it). Dropped: a viewport-layout test for the tag — an edge case of an edge case on a
  desktop-only internal tool; a `⏸️` comment in the spec says so and forbids re-adding it silently.
  **Kept** (already written, all passing, no extra design cost): the 3 error-path tests
  (42501 / P0002 / lock-trigger-on-reject) and the `aria-describedby` link — those are not the
  same probability class: the lock message fires on a stale tab or two people acting, which is
  ordinary. ⚠️ **And one honest disagreement recorded:** the *core* round-D bug is NOT rare —
  a disabled sku doesn't need anyone to "want to use it", it silently breaks **every existing
  quote already holding it** (measured: disabling `04ST` would have broken 2 open quotes on the
  spot). Rare trigger × certain damage ≠ edge case. Final: gate 0 · 360 unit · E2E **36/36**.
- 31/07/2026 15:00 — **🐞 Round-D follow-up: a §7.34 hole I introduced, caught by Ishay asking
  "what didn't you check" — not by any test.** The picker list was computed **once for the whole
  table** from the set of all in-use skus, so the disabled product showed up as a normal option in
  **every** row — i.e. it could be added to a NEW line, which is exactly what the 12/07 ruling
  forbids. Found by screenshotting the OPEN dropdown (the earlier shots only showed it closed).
  Fixed: `productGroupsFor(currentSku)` per row — the exception is now the row's **own** sku only.
  New E2E locks the direction (allowed in its own row, absent in another) and was **watched failing**
  against the global-filter version. Also landed in the same follow-up: the planned-but-skipped E2E
  for the **edit-save** error path (a toast, a different render path from the approve dialog's inline
  row) — also watched failing with the mapper broken. Gate exit 0 · 360 unit · E2E **34/34**.
  ⚠️ Generalized lesson: *a screenshot of a closed control proves nothing about the control's list.*
- 31/07/2026 14:45 — **Fix-round D CLOSED.** Both 👤 visual approvals given by Ishay (the amber
  "מוצר מושבת" tag as laid out, and the PDF showing product NAME instead of sku for a disabled
  product). §D prompt deleted from `docs/audit_2026-07-31_fix_plan.md` per its lifecycle;
  remaining rounds: C · E · F · G. Details below.
- 31/07/2026 14:20 — **Audit fix-round D LANDED (server messages + inactive product).** Source:
  `docs/audit_2026-07-31_fix_plan.md` §D. Plan: `~/.claude/plans/memoized-splashing-pearl.md`.
  **(1) DB failure messages now reach the screen.** New pure mapper `quoteServerErrorMessage`
  (`src/lib/quotes.js`): code-classes 42501/P0002 + Hebrew-prefix rules for the P0001 family
  (11 RAISE sites across 2 migrations; prefixes are a **byte-exact contract** with the RAISE
  strings — bidirectional contract comments at the mapper and `db_roadmap.md` §6). `api.js` writes
  (`approveQuote`/`saveQuoteEdit`/`rejectQuote`) route through `toWriteError`; reads deliberately
  keep the old fallbacks. `ApproveQuoteDialog`'s lying header comment ("displayed as-is") fixed.
  English enum values are translated, never displayed; unknown errors → `null` → old fallback.
  **(2) Inactive product no longer zeroes a line.** `getPricingCatalog` fetches ALL products;
  §7.34 filtering moved into `QuoteLineEditor` (active + the line's own sku); existing line gets
  an amber "מוצר מושבת — לא יוצע בהצעות חדשות" tag; `repriceLine` keeps prior values when the
  product is truly absent (never `: 0`). §7.34 PROJECT_MASTER updated first (rule 13a) — ruling
  delegated by Ishay to market standard, verified: Salesforce CPQ keeps deactivated products on
  existing quotes (help.salesforce.com id=000381969). Side effect flagged to Ishay: `productsBySku`
  in QuotesPage/CustomerDetailsPage now resolves inactive skus, so an old quote's PDF will show
  the product NAME instead of the raw sku — **zero documents affected today** (all 11 products
  active, measured live).
  **Verification per warning 3 (failure returned on purpose, all watched failing):** unit — mapper
  broken → 5/128 fail; E2E — all 3 guards reverted → mapped-message tests fail with the old generic
  text, and the inactive-product test fails only after the interceptor was taught to mimic the
  server-side `status=eq.active` filter (first interceptor version passed against the broken code —
  itself a warning-3 catch). Gate exit 0 (360 unit tests) · full E2E **32/32 twice**.
  **↳ Bonus fix, pre-existing flake (NOT mine, NOT the documented module-1 flake):**
  `load-failure-guards.spec.js` "תקלה רגעית בשליפתו" failed 2/3 full-suite runs (passed alone and
  passed on a clean tree — isolated by stashing). Root cause: after "תקלה זמנית" the screen runs
  `signOut` → `AuthContext.loadUser` remounts LoginPage (documented mine in `01_auth/CLAUDE.md`),
  wiping the controlled inputs between the test's `fill` and `click` under load → empty form
  submitted. Fix in the TEST (recovery from a fresh `goto('/login')`); screen code untouched.
- 31/07/2026 09:05 — **Audit fix-round A (VAT guard) — app code LANDED, migration WRITTEN BUT NOT
  APPLIED.** Source: `docs/audit_2026-07-31_fix_plan.md` §A. Plan: `~/.claude/plans/temporal-greeting-torvalds.md`.
  **Root cause, one family:** a `params` row that is deleted/renamed/blank turns into `0` or `NULL`
  in three consumers that all bypass the `pricing.js` "empty is not 0" doctrine.
  **What landed in `src/` (all green: 341 unit tests, `eslint .` clean):**
  (1) `quotePdf.jsx` — `quote?.vatRate ?? 0` **deleted in both places** (the `computeQuoteTotals`
  call and the `מע"מ (…%)` label). `buildQuoteDocument` now validates via the *existing*
  `parseVatPercent` and throws `MISSING_VAT_MESSAGE` carrying `code: 'MISSING_VAT'` (same synthetic
  -code pattern as `RLS_DENIED` in `02_customers/api.js`). ⚠️ **Reader-trace done before changing it:**
  `buildQuoteDocument` has ZERO production callers — the only path is `renderQuotePdfBlob` →
  `QuoteDocumentDialog.jsx` (one call site), reached from `QuotesPage` · `CustomerDetailsPage` ·
  `QuoteBuilderPage` (the last already blocks earlier). So the throw surfaces in exactly one dialog,
  and M10's future server-side lift gets an error instead of a wrong document.
  (2) `QuoteDocumentDialog.jsx` — the blind `catch {}` now distinguishes `MISSING_VAT` and shows the
  message that says *what to fix*; the error `<p>` gained `data-testid="quote-document-error"`.
  Download/send were **already** dead when `blobUrl` is empty — verified, not rebuilt; the reason
  string was added to both `title`s. ⚠️ `emailSendDisabledReason` was deliberately NOT touched — it
  is the generic engine shared with M4/M8/M11.
  (3) `CustomerDetailsPage.jsx:228` passed the **raw `param_value` string** where `QuotesPage` passes
  `parseVatPercent(...)`; aligned. Two screens feeding different types into one prop is a latent bug.
  (4) NEW `missingPricingParamsMessage()` in `src/lib/quotes.js` + amber banner on `QuotesPage`
  (`data-testid="quotes-missing-params"`, style copied from `CustomerFormDialog`, not invented).
  **Ishay's ruling 31/07:** the expiry cron failing loudly is not enough on its own —
  `cron.job_run_details` is a place nobody opens, so the same failure must be visible on screen.
  (5) Tests: `quotePdf.test.jsx` had ONLY `not.toThrow()` and both cases passed `vatRate: 18`, so the
  `?? 0` path was never covered. Added 8 guard assertions + a `0%`-is-legal case.
  🔬 **Guard proven by RETURNING the failure** (not by watching it pass): temporarily restoring
  `parseVatPercent(...) ?? 0` turned **8 tests red**; restoring the guard returned 24/24 green.
  (6) **A fourth site of the same family, found while screenshotting** (not in the audit's list of
  three): `deriveQuoteMetrics` summed `total ?? 0`, so the header tile read **"שווי הצעות פתוחות:
  0 ₪"** directly beneath the banner saying pricing is impossible. Now `null` ⇒ `—`
  (`formatShekelWhole(null)`), same convention as `approvalRate`. Also caught by eye in the same
  screenshot: the banner said "יש להוסיף את **השורות**" for a single missing row — number agreement
  now follows the count (a translated-sounding label is a `src/CLAUDE.md` wording-pass failure).
  ✅ **DB side — migration `20260731085335_module3_vat_and_expiry_param_guards.sql` APPLIED**
  (typed-echo given). Full evidence in `docs/db_roadmap.md` §10; the three things worth carrying:
  (a) `security definer set search_path = ''` **survived the body copy** — re-read from
  `pg_get_functiondef` after apply, not eyeballed (Ishay's explicit demand; the project has a whole
  migration born from that line's absence). (b) `cron.job` = **exactly 2 rows with jobid=1 preserved**
  — proof that `cron.schedule` upserted by name rather than leaving the old unguarded job firing.
  (c) The RPC injection needed an **entry condition**: the function checks permission → status →
  past date → hostess lines *before* the VAT guard, so a control run first proved quote #6 gets all
  the way through (it created project 5, rolled back); only then did the injection on quote #7 return
  the **VAT-specific** Hebrew message. DB verified byte-identical afterwards.
  ✅ **E2E — `e2e/quote-document.spec.js` (NEW, permanent, 2 tests).** Network interception
  (`page.route` on `/rest/v1/params`) removes the row on the way back — **zero DB writes**, the
  mandatory pattern here. The happy-path test is part of the proof, not an appendix: without it the
  blocked-path test would pass on a screen that never renders a document at all.
  📸 Screenshot-reviewed both states; direction pass measured (`dir: rtl` on banner and message).
  ✅ **The other half of the coin, added after Ishay asked "what haven't you checked":** every guard
  test above proves the document is **not** produced; none proved that when VAT *is* present the
  right number is printed — a guard that accidentally froze 0% would have passed the whole suite
  green. `collectStrings` walks the returned element tree (**props too, not just children** — the
  totals rows receive their text as `label`/`value` props on `TotalRow`, so a children-only walk
  missed exactly the VAT label) and asserts `מע"מ (18%)` · `5,355 ₪` · `964 ₪` · `6,319 ₪`, plus
  `0%` printing as `0%`. **Mutation-proven:** changing the label to `${vatRate * 0}` turned it red.
  ✅ **The two CHECK constraints were also proven to REJECT, not merely to exist** — first attempt
  was worthless (the INSERT died on `recommended_hostess_count NOT NULL` before reaching them, so
  "it failed" proved nothing); redone with a **control insert that succeeds**, then
  `23514 / quotes_approved_requires_vat` and `23514 / quotes_vat_snapshot_range` by name. The RPC
  was additionally proven to reject an **out-of-range** param (`'150'` ⇒ *"שיעור המע\"מ שבהגדרות
  המערכת אינו חוקי (150)"*), not just a missing one. All rolled back; DB re-verified clean.
  **Regression — final numbers, measured after every edit including the Prettier pass on
  `quotePdf.jsx`:** `npm run gate` **exit 0** (lint · format · **345** unit tests · build · jscpd ·
  knip · audit · check:context) · **full E2E 21/21 on the second run**.
  ⚠️ The first full E2E run had **1 failure in `permissions.spec.js`** (matrix cell cycling) — passes
  in isolation and on the re-run, touches none of the changed files, and the DB was verified still at
  its baseline (`מנהלת לוגיסטיקה × פרויקטים = edit`). Recorded as a **pre-existing flake**, not a
  regression — the spec's own comment documents an earlier race of the same shape (08/07/2026).
- 31/07/2026 01:28 — **Step 3.7 🎨 gate — the machine half is DONE; the rulings are Ishay's (👤).**
  Method: three throwaway Playwright specs (`zz-review-37` · `zz-measure-37` · `zz-dialogs-37`),
  network-level read-only guard (0 write requests reached Supabase in any run), **all three deleted
  after use** — same convention as 3.4/3.6.
  **What PASSED, measured not eyeballed** (across `/quotes` · `/quotes/new` · `/customers/:id` ·
  `/system/prices`): every screen has loading + error-with-retry + empty + no-results states ·
  **~200 real Tab stops, 0 focused elements without a visible focus indicator** · 0 horizontal
  overflow · ₪ on the same side in every amount (`start=0 end=5` on the management screen) · every
  mixed digit+Hebrew text node computes `direction: rtl` · **0 console/page errors** · Esc closes the
  document dialog · focus lands inside the reject dialog on open · rejecting with no reason is
  blocked **before the network** (0 requests). Two of the three pre-booked 3.7 items were already
  fixed on 30/07 evening and re-verified here in code: `replaceCustomerContacts` is now
  insert-then-delete-by-ids (`02_customers/api.js:146-180`) and the status `<Select>` is disabled
  while its save is in flight (`PricesManagementPage.jsx:210`).
  **⚠️ Not provable by machine (environment, not a bug — already documented in
  `03_quotes/CLAUDE.md`):** the `<iframe src={blobUrl}>` PDF preview does not paint in an automated
  screenshot, headless or headed. The blob IS produced (both dialog buttons are `disabled={!blobUrl}`
  and render enabled) and the PDF bytes were proven in 3.1/3.3. **One human click on 👁 in `/quotes`
  is the only way to close this — it stays a 👤 item.**
  **↳ RULED 31/07/2026 01:3x — Ishay: "כן לכל ההמלצות". 3 of 4 BUILT + verified; the 4th is DB
  cleanup that this environment refuses to run (see below).** Post-fix state: `npm run gate` exit 0 ·
  **327 unit tests** (was 324) · **all 18 E2E green** · `npm run smoke` green · `jscpd` **4 clones
  0.60% → 3 clones 0.44%**. Findings (1)+(3)+(4) below are DONE; (2) is handed over.
  **FINDINGS (4) — presented to Ishay 31/07 01:2x:**
  **(1) Error marking is inconsistent in the quote builder.** Measured after an empty save:
  the customer picker gets `border-color oklch(0.577 0.245 27.325)` (red) + `aria-invalid="true"`,
  while `quote-event-name` / `quote-event-date` / `quote-location` get
  `oklch(0.869 0.022 252.894)` (plain slate) and **no `aria-invalid`, no `aria-describedby`** — red
  helper text only. Every other form in the repo marks the field itself
  (`CustomerFormDialog`, `PriceTiersDialog`, `ProductFormDialog` via `border-red-500`). Root cause:
  the local `Field` component (`QuoteBuilderPage.jsx:69-83`) renders the error `<p>` but never wires
  it to its child input. One-component fix; no new colour (iron rule 8 safe).
  **(2) Two test quotes are permanently stuck in the live data.** `#14 בדיקת שמירה 1785332141457`
  and `#15 בדיקת דיילות ידנית 1785332918430`, both on customer 46 (מדיטק), both
  `rejected/'נפתחה בטעות'` — they are **half of מדיטק's quote list** and will ship in the Vercel
  deploy (LOCAL-12). The lock trigger (§7.50) blocks UPDATE **and** DELETE on a non-`in_progress`
  quote, so they can be neither renamed nor removed from the app. Surfaces a real capability gap:
  a mistakenly-created quote can never be removed by anyone.
  **(3) Hebrew number agreement** on the customer page metrics: `` `מ-${approvedCount} הצעות שאושרו` ``
  and `` `${counts.in_progress} ממתינות להחלטה` `` render as "מ-1 הצעות שאושרו" / "1 ממתינות להחלטה"
  (`CustomerDetailsPage.jsx:363,371`).
  **(4) The third pre-booked item, confirmed:** `jscpd` = 4 clones, 0.65% jsx (threshold 3%, gate
  green). Two are between `CustomerDetailsPage.jsx` and `QuotesPage.jsx`: `RowAction` is
  **byte-identical** in both (~20 lines), and the three quote dialogs are wired with an identical
  prop/`key` block. `RowAction` is a genuine should-be-shared component.
  **AS-BUILT (what actually landed for 1/3/4):**
  **(1)** the marking is injected by the container, not written at each call site — `Field`
  (`QuoteBuilderPage.jsx`) clones its child with `aria-invalid` + `aria-describedby` when an error
  exists, and `LtrFieldGroup` grew a per-item `invalid` flag + an `errorId` prop (the time range and
  the guests÷ratio=hostesses formula were the two remaining unmarked fields, and they live in a
  shared shell whose border belongs to the cell, not the input). `CustomerPicker` had to be taught to
  **forward** `aria-describedby` explicitly — it does not spread props, so an attribute not named
  there vanishes silently. **No new colour:** `aria-invalid:border-destructive` already exists on
  `ui/input.jsx:13`, and the attribute selector outranks the call site's `border-slate-300`.
  Measured live after the fix: all 7 invalid fields at `oklch(0.577 0.245 27.325)` with
  `aria-invalid="true"` and a describedby that resolves to their own error `<p>`; the valid `יחס`
  cell stays slate, so the marking discriminates rather than painting the whole group.
  **(3)** `approvedQuotesLabel` / `pendingQuotesLabel` added to `src/lib/quotes.js` **TDD** (3 tests
  written first, watched fail on `is not a function`, then implemented) — the rule lives in `lib` so
  the next screen that counts quotes inherits the same Hebrew instead of re-deriving it.
  **(4)** `RowAction` extracted to `src/components/RowAction.jsx` and consumed by both screens; the
  second clone (the three quote dialogs' prop/`key` block) was **deliberately left** — the handlers
  and `canEdit` differ per screen, so extracting it would trade duplication for a wrapper with two
  behaviours. jscpd is 0.44% against a 3% threshold; this is a judgement call, not an oversight.
  **⚠️ (2) IS NOT DONE — handed to Ishay, and this is the honest boundary.** The delete needs to
  briefly disable `quotes_lock_non_in_progress`, and **this environment's safety classifier refuses
  DDL/destructive SQL through the Supabase MCP** — it blocked both the trigger lookup and the
  transaction. Not worked around. What exists instead: `scripts/cleanup_test_quotes_14_15.sql`
  (one transaction: disable → delete → re-enable, plus three verification queries whose expected
  answers are written in) and `scripts/restore_quotes_14_15.sql` (byte-for-byte restore, built from
  a live `to_jsonb` snapshot taken **before** anything was attempted; `email_log` and `projects`
  were both verified to hold zero references first). Ishay runs it in the Supabase SQL Editor.
  **Until he does, quotes #14/#15 are still in the live DB** — do not report this step as closed on
  the strength of the script existing.
  **↳ SECOND SWEEP 31/07 02:1x, after Ishay asked "יש עוד משהו שלא בדקת?" — four more gaps closed,
  all clean:** (a) **narrow viewports 1024 + 1366** on `/quotes` · `/quotes/new` · `/system/prices`
  — **0 horizontal overflow** at either width (the filter row is calibrated to 893px in a 912px card,
  so this was a real risk, not a formality); (b) **the screens through מנהלת כספים's eyes**
  (`view` on quotes) — she gets the 4 rows and the 👁 document button and **nothing else**: no ✎/✓/✕,
  no "+ הצעה חדשה", no ניהול-מערכת in the sidebar, and the actions column still reads as a column
  rather than an empty gap; `/quotes/new` → "אין לך הרשאת עריכה להצעות מחיר.", `/system/prices` →
  "אין לך הרשאה לצפות במסך זה."; (c) **"נסה שוב" actually recovers** — the quotes fetch was aborted
  at the network layer, the error state rendered, the route was restored, one click brought the real
  table back including `6,319`. Until now only the *markup* had been proven to exist; the button had
  never been clicked. (d) **focus trap** — 25 consecutive Tabs inside the open reject dialog, **0
  escapes** to the background.
  ⚠️ **A probe bug worth remembering:** the first finance run reported `viewBtns: 0` and looked like
  a real defect (a view-level user who cannot open the document). The button's testid is
  `quote-document-<id>`, not `quote-view-<id>` — **my probe was wrong, the product was right.** The
  screenshot is what settled it; a testid-only assertion would have produced a false finding.
  **Still NOT checked, declared rather than implied:** the builder in **edit** mode with real lines
  loaded (this round only opened an empty `/quotes/new`; 3.2 covered the loaded state) · a real
  screen reader (the aria wiring is measured, not heard) · browser zoom 150/200% · widths below
  1024 (desktop internal tool — the sidebar layout assumes it) · מנהלת פרויקטים's eyes specifically
  (same `edit` level as CEO on quotes, so covered by inference, not by observation).
  **↳ CLOSED 31/07/2026 02:4x — both 👤 items came back from Ishay:**
  **(a)** he ran `cleanup_test_quotes_14_15.sql` and pasted the trigger check (`O`/`O` = both locks
  re-armed). Verified independently from here, same turn: `quotes_total` **10→8** · rows 14/15 = 0 ·
  their lines = 0 · `quote_services` **24→20** (3+1, exactly the backup's line count) · מדיטק
  **4→2** quotes. **(b)** the PDF preview paints for him — "רואים מעולה". That closes the one thing
  no automated screenshot could reach, and the DoD's PDF box is now human-evidenced.
  **🐞 The cleanup broke a test, and the proactive regression is what caught it** (not CI, which
  never runs E2E): `customer-page.spec.js` asserted מדיטק has **4** quotes and that
  `customer-quote-14` carries `נפתחה בטעות` — the second row no longer exists at all. **Fixed
  without weakening either claim:** the count moved 4→2 (the datum changed legitimately; the rule
  from `smoke-anchors.json`'s header is "update the anchor, never soften the assertion"), and the
  rejection-reason assertion **moved to a customer that still has a rejected quote** —
  עיריית חדרה's `customer-quote-11` / `תקציב לקוח`. Coverage preserved, not deleted: that assertion
  exists because the PDF deliberately omits the rejection reason, so the row is the only place a
  human can read it. **18/18 E2E green again.** ⚠️ **Lesson for future data cleanups: an E2E suite
  asserting on real seed rows is coupled to them — grep the suite for the ids BEFORE deleting**
  (a `grep` for `quote-14` would have found this in one second, pre-emptively).
- 30/07/2026 22:52 — **Step 3.6 verification caught two real bugs AND caused one real data-loss
  incident (immediately repaired). All three are worth remembering:**
  **(1) `upsertPricingParam` could never have worked** — first real save from the screen returned
  `23502: null value in column "param_type"`. The 2.3-era comment claimed "the rows always exist ⇒
  upsert always hits UPDATE ⇒ param_type not needed"; **Postgres builds and NOT-NULL-validates the
  candidate INSERT row BEFORE discovering the conflict**, so an existing row does not save you.
  Replaced with `updatePricingParam` (update-only + 0-rows→RLS_DENIED); update-only is deliberate —
  a typo'd param name fails loudly instead of silently creating a ghost params row. The unit tests
  could not have caught this (api layer, live constraint) — only the real save did.
  **(2) 🔴 DATA LOSS: the 5 seed tiers of B-REG-TAG were really deleted from the live DB** during
  E2E verification. Root cause: `replacePriceTiers` was delete-then-insert (module-2's
  `replaceCustomerContacts` pattern), and the test ended — closing the browser — between the two
  requests: the DELETE landed, the INSERT never fired. Two HTTP requests are not a transaction;
  **the ORDER decides what an interruption costs.** Fixed structurally: upsert-then-delete-stale
  (same request count; worst interruption now leaves one stale row visible on screen instead of an
  empty catalog). Rows restored from the locked seed doc + verified byte-identical
  (`1→6.00 · 51→5.50 · 201→5.00 · 401→4.50 · 1001→4.00`, 40 total). ⚠️ **The same weakness still
  exists in `replaceCustomerContacts` (module 2, merged)** — an Ishay closing the tab right after
  "שמור" can wipe a customer's extra contacts. Not fixed here (closed module's surface); **booked
  as a 3.7-review item.** Test-side lesson added to the spec: any click that triggers a save must
  await the save's outcome before the test ends.
  **(3) The 14/07 design-notes were stale in a load-bearing way** — they prescribed a free-text
  `unit` input "since there is no CHECK"; `products_unit_check` exists (4 values) and free text
  would fail on save. Built as a closed Select from `PRODUCT_UNITS`. (Also: their defensive 0/1/>1
  upsert advice was already obsolete — UNIQUE landed in migration 1.1.) Design-notes are input,
  not gospel — this is why.
  **Environment note:** `knip` crashed twice with `Array buffer allocation failed` (machine had
  0.8GB free RAM, 104 node processes); passed unchanged later. Not a code finding.
- 30/07/2026 23:09 — **Ishay's "מה עוד לא בדקת?" round closed 5 untested paths and caught bug #3
  of the day, same family as the params one:** `ProductFormDialog` sent `description: null` for an
  empty description, but `products.description` is **NOT NULL with no default** — so **creating any
  product without a description could never work** (23502 before the PK check, generic error shown).
  Fixed: empty string, not null. Then live-verified end-to-end: **(א)** product edit round-trip
  (rename → fresh-read shows it → revert); **(ב)** status select survives a full page reload both
  directions; **(ג)** duplicate-SKU shows the friendly "מק"ט כבר קיים" and creates nothing (row
  count stays 11); **(ד)** tiers on a tier-less product (04ST): add → "1 מדרגות" → remove →
  empty-list save → "ללא מדרגות"; **(ה)** successful create incl. default `active` status and live
  margin column — the one path needing a test row (`ZZZ-TEST`), removed by SQL immediately after
  (products has no FK referrers for a fresh SKU; DB verified byte-identical to seed after).
  **🎨 3.7 review item found by a race:** the status `<Select>` saves silently (optimistic, no
  "saving" indicator) — an immediate reload can kill the PATCH mid-flight and the change silently
  reverts. Observed as a test flake (passed once, failed once); consider disabling the select while
  the save is in flight.
- 30/07/2026 17:40 — **Self-review after 3.4 closed ("what haven't I checked?", Ishay's standing prompt)
  found a silent customer-facing failure, and the fix nearly introduced a worse one.**
  **The defect:** `§7.70` states that in M3 params are tuned **through the Table Editor** (the typed
  params screen is M9) — so hand-editing a template is the *planned* path, not an edge case. A field
  added to the template but not to the code shipped to the customer **as literal brackets**
  (`שלום [שם_חברה],`) with no error anywhere. **Fix:** `findUnknownPlaceholders` in the generic engine;
  `fillEmailTemplate` **refuses** to produce a body when the template carries an unknown field (so the
  send cannot happen), and the dialog names the offending field so the fix is one line in the DB.
  Refusal over warning because a bracketed document reaching a paying customer is irreversible, while a
  blocked button with a precise message costs thirty seconds.
  **⚠️ The near-miss worth keeping:** my first design scanned the **filled body**. Every demo customer is
  named `… בע"מ [דמו]`, and a customer with no contact name falls back to the company name — so that
  design would have **blocked sending to every demo customer**. The scan must run on the **template**,
  before values are injected: injected values are data and may legitimately contain brackets; only the
  template is a contract. There is now a test for exactly that case.
  **Two more defects surfaced by the same pass:** (a) the template constants in **both** test files were
  **stale** after migration 9 — still ending in "צוות REG-IN" while the DB had `[חתימת_שולח]`, so the
  comment promising "a test will fail if the template changes" had quietly stopped being true; both are
  now byte-synced to the DB and carry a warning that any template migration must update them. (b) the
  assertion "no placeholder remains" passed **vacuously** on an empty string — it would have stayed green
  even while the engine refused to send; a length assertion was added.
  **Regression evidence (Ishay's explicit concern — 3.5 was already built and working):** the only callers
  of the changed functions are in `QuoteDocumentDialog.jsx` (grep-verified; nothing in 3.5 touches them),
  `npm run gate` exit 0 with **291 tests**, and **all 18 E2E specs pass — including the 6 new ones from
  step 3.5**. jscpd reports 2 clones (0.44%, threshold 3%) — both between the other session's
  `CustomerDetailsPage.jsx` and `QuotesPage.jsx`, i.e. **pre-existing to this change**, worth folding into
  the 3.7 UX/quality gate.
  **Still unverified and honestly declared:** the Make failure branch (502 → Skip) was configured and
  read back from the blueprint but **never observed**. I deliberately did not manufacture a bogus send —
  an invented address would be accepted by Gmail and bounce asynchronously, so it would prove nothing
  while risking a real bounce. The right test belongs in 4.3: stub `functions.invoke` to reject and assert
  the UI copy, plus a manual Make check by temporarily breaking the connection.
- 30/07/2026 15:45 — **⏩ `e2e/customer-page.spec.js` PULLED FORWARD from 4.3, and the working method
  changed — both on Ishay's ruling after he asked "how do we prevent these problems?".**
  **The method change (`module-build` SKILL.md):** every 🗣️ brief now ends with **"מה ייחשב עובד"** —
  3–5 Hebrew sentences stating observable end-to-end outcomes **with real numbers**, approved
  alongside the mockup, and **verification is written against that list instead of against my memory
  of what I built**. It replaces (F1 subtraction) the step where I invented the check-list after the
  fact — the step that produced BUG 3. ⚠️ A sentence naming a control ("יש כפתור X") is explicitly
  wrong; that is exactly what already passed while the feature was broken.
  **The suite (6 tests, all green):** revenue column + sort + **filter surviving back-navigation** ·
  live metrics + tabs + rejection reason + actions-by-status · **"+ הצעה חדשה" preselecting the
  customer AND his discount** · a real PDF from the customer page (bytes, not a screenshot) ·
  §7.34's archive warning **stopping the action on "ביטול"** · blocked role refused by direct URL.
  ⚠️ **Two invariants a future editor must not break:** (1) **zero DB writes** — there is one live
  Supabase and no test environment, so absent data is created by intercepting the response, never by
  inserting rows; (2) the archive test covers **the cancel branch only** — the confirm branch would
  mutate a real customer's status.
  **🧪 The suite was mutation-tested, not just run green:** the discount-snapshot line was deleted on
  purpose, the "+ הצעה חדשה" test went **red**, and the line was restored. A suite that has never
  been seen failing is not evidence that it protects anything.
- 30/07/2026 15:25 — **🐞 BUG 3, and the reason it matters more than the bug: Ishay asked "is there
  anything you haven't checked?" and the answer was yes — a feature he had explicitly approved was
  half-broken.** `+ הצעה חדשה` on the customer page navigated to `/quotes/new?customerId=46`, but
  **`QuoteBuilderPage` never read the query string at all** (`grep useSearchParams` = 0 hits). The
  button reached the right screen and **silently dropped the customer**. I had verified the button
  *rendered*; I never verified what it *did*.
  ⚠️ **The fix had a trap of its own:** preselecting the customer must go through the same discount
  snapshot as `handleSelectCustomer` (F12) — setting `customerId` alone would create a quote at
  **0% discount** for a customer whose card says 5%, silently. Both are now asserted.
  **Three previously-unexercised paths verified in the same pass:** the document dialog opened
  *from the customer page* really produces a valid PDF (33,738 bytes, `%PDF` header — proving the
  `customers` injection works, without which the document ships with no "לכבוד" and no ח"פ);
  a blocked role (logistics) is refused at `/customers/46` **by direct URL**, confirming the
  `<ProtectedRoute>` wrapper actually holds; and lint is now at **zero warnings** (the new
  `useSearchParams` read is lifted to a stable primitive so the load effect doesn't refetch).
  ⚠️ **Still unverified and worth naming:** the two-permission-gate behaviour for **finance**
  (`edit` on לקוחות + `view` on הצעות מחיר) — `.env.local` has no finance credentials, so the
  branch where the edit button shows but approve/reject do not **has never been run**. It is
  reasoned and RLS-backed, not observed. Add finance creds or cover it in 4.3.
- 30/07/2026 14:30 — **Step 3.5 built. Three as-built deviations + two bugs caught by verification.**
  **↳ as-built (1): `QuoteReadOnlyView.jsx` was NOT built** (the blueprint listed it). The existing
  `QuoteDocumentDialog` already *is* "read-only view + generate PDF" — it renders the spec, prices,
  discounts and total, with a download button. Building a second viewer would have been a second
  place for the same numbers to drift. ⚠️ `listQuotesByCustomer` does **not** join `customers`, and
  the PDF engine needs it for "לכבוד"+ח"פ — the page injects the already-loaded customer
  (`{...quote, customers: customer}`), same pattern as `formToPreviewQuote`.
  **↳ as-built (2): `CustomerDetailsCard.jsx` deleted**, replaced by `CustomerDetailsPage.jsx`
  (LOCAL-13). Full ripple recorded in `module-2.md` §9 — that module is closed, so its guide is
  where a future reader will look.
  **↳ as-built (3): highlights strip carries 3 metrics, not 6** (LOCAL-14) — presentation only.
  **🐞 BUG 1, found by the regression suite and NOT by lint/build/types:** moving `CustomersPage`'s
  filter state into the URL broke **two** toggles (archive · marketing-consent) because both call
  their setter with React's updater form (`set(v => …)`), and a value-only setter stringified the
  *function* into the query string. **Zero errors, zero crashes — the buttons just stopped doing
  anything.** `customers.spec.js`'s archive test caught it; the consent toggle had the identical
  break and **no test covers it**, so it would have shipped. Fixed via `resolveNext()`.
  ⚠️ **Lesson worth keeping: replacing a `useState` setter with a custom one silently changes its
  contract.** Grep every call site for the `(v) => …` form before swapping.
  **🐞 BUG 2, found by reading the screen as a document, not by any assertion:** the quote rows
  rendered raw ISO dates (`2026-10-25`) while the management screen **and the PDF the customer
  receives** both print `DD/MM/YYYY` via `formatDate`. Two formats for the same date in one system.
  Fixed by importing the same `formatDate`.
  **Verification actually run:** `npm run gate` exit 0 · 290 unit tests (283 before; 7 written first
  and watched fail on `undefined`) · **13 E2E green including all 3 pre-existing suites** ·
  direction pass measured in-browser (0 misalignment, all ₪ on one side, 0 horizontal overflow) ·
  live as CEO: 9,865 ₪ revenue / 6,319 ₪ open / 9,865 ₪ avg on מדיטק.
  ⚠️ **The 30-quote check wrote NOTHING to the database** — the rows were fabricated by intercepting
  the REST response in Playwright. There is only one live Supabase project and no test environment;
  injecting rows would have polluted real data (it did once already, in 3.4).
  🚧 **Registered for M6:** the projects tab is deliberately empty with no controls, and Ishay's
  idea of an **upcoming-vs-past** split for projects is the right axis for an events company —
  it gets built together with the rows and the RLS policies, not before.
- 30/07/2026 14:05 — **🐞 LIVE BUG IN ALREADY-SHIPPED CODE (step 3.3), found while planning 3.5:
  the management screen's default sort is non-deterministic.** `listQuotes()` orders by
  `updated_at desc` **only**, and ties are already present in production data — verified:
  `select updated_at, count(*) from quotes group by updated_at having count(*)>1` returns
  **2 quotes sharing `2026-07-29 16:18:08.682902+00`**. Postgres guarantees no order within a tie,
  so those two rows can swap position between refreshes with no cause the user can see.
  **It will get worse, structurally:** the daily expiry job (`pg_cron`, §7.42/F4) updates many
  quotes **inside one transaction**, and every row written in a transaction gets the identical
  `now()` — so one expiry run produces a whole block of quotes with byte-identical `updated_at`.
  **Fix (both call sites, one line each): add `quote_id desc` as a tiebreaker** —
  `listQuotes()` (sort key of the management screen) and `listQuotesByCustomer()` (which orders by
  `issue_date desc`, where **all 10 demo quotes share `2026-07-29`** — that one is not a tie, it is
  a total collapse of the sort key). ⚠️ **This is invisible to every kind of test we run**: a
  single-run assertion sees *an* order and passes. Ishay has not seen it manifest yet.
  Scheduled with step 3.5's build.
- 30/07/2026 09:31 — **Step 3.4 REVISED MID-BUILD: the ruled `mailto` design is superseded by real
  sending. Full evidence chain, so a future reader doesn't re-litigate it.**
  Ishay saw the planned flow (download→mailto→manual-attach) and asked "why not just send it".
  **My first cost estimate was wrong** — I priced an external provider (Resend/SendGrid, ~a day) before
  checking what he already has. He pointed at his own other project, `gedood_710`; reading it
  (`src/lib/inventory.functions.ts` `postToMakeWebhook`) showed a **Make.com webhook** pattern
  already in daily use there — the real cost is hours, not a day.
  **Two gaps found by reading, not assumed:** (a) gedood sends **JSON only, never an attachment**
  (grepped: no `base64`/`attachment` in that file) — the PDF-attach leg is new, not copied;
  (b) REG-IN is a **pure client SPA** (unlike gedood's TanStack-Start server) — any `VITE_*` value
  ships in the public bundle, so the Make webhook URL cannot live in client code. Resolution: a
  **Supabase Edge Function** (`send-quote-email`) proxies the call — this is also exactly where
  `PROJECT_MASTER §6` 🚧 מ10 already said the real auto-send belongs, so it's that module's home
  built early in minimal form, not throwaway work.
  **Deliberately NOT reusing gedood's Make account/scenario** — its own code documents a real 18/07
  incident (one bad address made Make disable the *entire* scenario for every battalion), and the
  free-plan 1,000-ops/month quota is shared account-wide; coupling an academic submission to a live
  operational system was rejected on both grounds. A **fresh, empty Make team** (org 8213371, team
  `2049106`) was verified live and used instead.
  **`mailto` is dropped, not deferred** — it added almost nothing over the download button 3.3
  already ships (both require a manual attach), so nothing of value was thrown away.
  **Built so far, via the Make API (MCP), not the UI:** data structure `regin-quote` (id 511348, 5
  text fields: to/subject/body/filename/pdf_base64) → webhook `regin-quote-email` (**hook id 3471390**
  — 🔒 the URL itself is a credential and is deliberately NOT written in this repo: anyone holding it
  can send mail from Ishay's Gmail. Retrieve it when needed via Make `hooks_get`, and store it only as
  the Supabase secret `MAKE_QUOTE_WEBHOOK_URL`) → scenario blueprint (`gateway:CustomWebHook`
  → `google-email:ActionSendEmail`, `attachments.data = toBinary({{1.pdf_base64}})`) with an
  **`onerror: builtin:Ignore`** handler on the Gmail module — this is the direct fix for the incident
  above: one bad recipient now discards *that* bundle and the scenario keeps running, instead of
  disabling itself for every future send.
  **❌ BLOCKED at `scenarios_create`:** `regin-gmail` (Ishay's first connection) was authorized via
  Make's "Watch emails" module and only carries `gmail.send`/`gmail.readonly` scopes; `ActionSendEmail`
  requires the broader `https://mail.google.com/` scope. Verified live via `connections_get` before
  guessing. Fix in flight: Ishay re-authorizing through the **"Send an email"** module specifically
  (a 🧩 prompt was given, name `regin-gmail-send`) — connection swap, not a redesign.
  **Code landed regardless (independent of the Make blocker):** `src/lib/quotes.js` — TDD, 26 tests
  written first and watched fail on `is not a function`, then implemented:
  `fillQuoteEmailTemplate`/`quoteEmailSubject`/`isQuoteSendable`/`quoteEmailDisabledReason`/
  `buildQuoteEmailPayload`/`formToPreviewQuote`, plus `quoteEmailTemplate` added to
  `QUOTE_SCREEN_PARAM_NAMES`. `QuoteDocumentDialog.jsx` now sends via
  `supabase.functions.invoke('send-quote-email', …)` instead of `window.location` mailto; a
  blob→base64 helper was added locally (browser-only, doesn't belong in the pure PDF engine).
  ⚠️ **as-built:** the dialog's send/error/sent state resets via **`key={quote?.quote_id}`
  remount at the call site**, not an effect — a synchronous `setState` in the load-effect tripped
  `react-hooks/set-state-in-effect` (hard error in this config), same family of trap as the
  dialog-reset convention already documented in `src/CLAUDE.md`.
  ⚠️ Renamed the row's plain mailto link "✉ שליחת מייל" → "✉ מייל לאיש הקשר" so it doesn't read as
  the same action as the new real-send button — different mechanism, different label.
  **Ruled unchanged from 29/07 and re-confirmed live 30/07:** primary contact only (`customer_contacts`
  checked again — still 0 rows), send only on `in_progress` quotes.
  **Also ruled 30/07 (Ishay, unprompted): deploy to Vercel right after M3 closes**, not at M12 as
  `00_roadmap.md`/module_12 guide currently say — no recorded reason was found for the M12-only rule
  when asked; the one real risk it protects (`§7.24`'s 5 unrotated test passwords, reasoned only for a
  local-only app) becomes live-internet-exposed once deployed, so **rotate those 5 passwords the same
  day as the early deploy**. Not yet written into `00_roadmap.md`/module_12 — do that when the deploy
  is actually scheduled, not now (§6-style "name it when you act on it").
  **↳ 30/07 09:45 — blind-spot sweep at Ishay's request ("handle the blind spots I didn't think of").
  Eight findings; seven closed. Recorded because most of them are invisible in a screenshot:**
  **(1) 🔒 MY OWN LEAK, caught minutes after making it:** I had written the full Make webhook URL into
  this guide — a repo-committed file. Anyone holding that URL can send mail from Ishay's Gmail.
  Removed; `grep` over the whole repo confirms zero occurrences. Only the hook **id** stays.
  **(2) The success toast would have LIED.** A Make custom webhook answers `200 Accepted` the moment
  the request arrives — **before** the email module runs — and the `Ignore` error handler then swallows
  a genuine failure. Net effect: green "✓ נשלח" on mail that never left. Fixed in the scenario design:
  `gateway:WebhookRespond` **200 only after** the Gmail module succeeds, `502` on the error branch, and
  `builtin:Ignore` placed *after* that error response so the scenario still refuses to disable itself
  (Ishay's 710 requirement). Blueprint validated via `validate_blueprint_schema`; creation still blocked
  on the connection. ⚠️ Also corrected: scheduling must be `immediately`, **not** the `on-demand` I first
  attempted — an instant webhook trigger cannot respond synchronously under on-demand.
  **(3) No timeout** — `functions.invoke` has none, so "שולח..." could hang forever. Now 30s.
  **(4) THREE outcomes, not two** — the subtle one. Ishay asked for "if it wasn't sent, toast to retry",
  but on a timeout/network cut **we do not know**. Claiming "not sent" causes a duplicate mail to a real
  customer; claiming "sent" hides a quote nobody got. So the unknown branch says exactly what is known:
  check your Sent folder before re-sending. Detected via `err.message === 'TIMEOUT' || FunctionsFetchError`.
  **(5) Malformed address blocked client-side** via the same `EMAIL_REGEX` the customer card validates
  with — directly from Ishay's 710 lesson (one bad address disabled Make's whole scenario there).
  **(6) AUTHORIZATION GAP nobody asked about:** send was gated on quote status only, so a **view-level**
  role (finance) could email quotes to customers. Now also requires `edit` on 'הצעות מחיר'.
  ⚠️ **Honest boundary:** that is the UI convenience layer. The wall must live **inside** the Edge
  Function (check the caller's permission against the DB with their JWT) — not yet written; it is a
  requirement of the function, not an optional extra (iron rule 9: RLS/server is the wall).
  **(7) Attachment size ceiling** — Make free allows 5MB/file and rejects overflow **on its side**, i.e.
  after the user saw "sent". `isPdfTooLargeToSend` blocks at 4MB of base64 (base64 inflates ~33%);
  a typical quote is ~46KB, so the ceiling is nowhere near normal use.
  **(8) ⚠️ NOT FIXED — declared debt: duplicate send across a page refresh or a second user.** The three
  in-dialog guards (`sending` lock · `sent` disables the button and changes its colour · a `confirm()`
  only on an already-sent quote) all live in component state. Real dedup needs a **send log in the DB** —
  there is no other source of truth for "was this already sent". That is already **🚧 מ10**'s registered
  debt ("ישות יומן-שליחות"), where sending moves server-side and is logged anyway. Pulling it forward
  would be a scope increase and is **Ishay's ruling**, offered — **and RULED YES the same hour**:
  migration `20260730095439_module3_email_log.sql` is authored and awaiting typed-echo (see
  `db_roadmap` **A-20** for the full design + forward notice to M4/M8/M11). So #8 is now *decided and
  pending apply*, not open.
  **↳ Also ruled 30/07 (Ishay, on my recommendation): the email path is built as a GENERIC engine, not
  a quote-specific one** — `send-email` Edge Function (not `send-quote-email`) + `src/lib/email.js`
  holding template-fill/payload/size/state logic with its tests, and a thin per-module wrapper on top.
  **Why it matters here:** `params` already carries **6** email templates (#10 quote · #11 shift invite ·
  #12 customer feedback · #13 invoice · #14 shift cancellation · #20 salary report), i.e. M4/M8/M11 will
  each send mail. **How it is enforced rather than hoped for:** a line in `src/CLAUDE.md` (auto-loads for
  any session touching `src/`) + a `🚧` line in `PROJECT_MASTER §6` naming M4/M8/M11 (the registry a
  module-open sweeps) + `jscpd`, which already **blocks** duplication in CI.
  **↳ Correction worth keeping — I misdiagnosed the Make blocker twice before reading the spec.** I told
  Ishay a Gmail *scope* was missing and sent him through two browser rounds. Wrong: `app-module_get` on
  `google-email:ActionSendEmail` v2 declares its connection parameter as **`account:google-restricted`**,
  while both connections he created are type `google-email` ("Gmail") — identical 5 scopes, wrong *type*.
  `connections_list` filtered on `google-restricted` returns `[]`. **Lesson:** Make's "account X is not
  compatible with module Y" is about the declared parameter **type** first and scopes second — read the
  module spec before instructing a human to re-authorize. Also corrected: a webhook-triggered scenario
  needs `scheduling: immediately`, not `on-demand`. And settled for good: using 710's Make account would
  **not** have helped (same API, same type requirement) — the separate-account decision stands on the
  quota + 18/07-shutdown grounds alone.
  **Tests: 219 → 253** (34 new, all written before the code and watched fail); lint clean.
  **↳ 📋 SCOPE-EXPANSION REGISTER (Ishay's explicit request 30/07: "record every scope expansion with
  its reason, so nothing gets built twice").** Step 3.4 grew **three** times beyond its 15/07 blueprint.
  Each row = what was added · why · where it is now registered so a future module finds it:
  | # | Added | Why (short) | Registered in |
  |---|---|---|---|
  | 1 | Real sending (Make→Edge Function→Gmail) **replacing** `mailto` | Ishay: "why download at all". `mailto` cannot attach a file; it added almost nothing over the download button 3.3 already had | this §9 · `STATUS.md` · §6 🚧 מ10 (auto-send) |
  | 2 | **Generic** engine `src/lib/email.js` + `send-email` (not quote-specific) | `params` already holds **6** email templates ⇒ M4/M8/M11 will send too; a per-module engine = 4 copies, and every fix must remember all 4 | `src/CLAUDE.md` §"שליחת מייל" (auto-loads for any `src/` session) · **§6 🚧 מ4·מ8·מ11** · `jscpd` blocks copies in CI |
  | 3 | Table `email_log` pulled forward from M10 | the only one of 8 blind-spot findings client code cannot close — anti-double-send guards die on a page refresh / second user | `db_roadmap` **A-20** + Done row · `docs/schema.sql` · §6 line above |
  **Cost paid, stated plainly:** these three are why 3.4 is ~half-done at 10:15 instead of finished.
  Ishay was told, and ruled to proceed. **The anti-duplication mechanism is not a promise** — it is
  three registries that a module-opening session actually reads (`grep '🚧 מN'` on §6 · the auto-loaded
  `src/CLAUDE.md` · a CI duplication gate).
  **↳ ✅ 30/07 11:10 — THE CHAIN IS PROVEN END TO END. Verified on the real inbox, not by a green test.**
  A throwaway Playwright spec drove the real UI as CEO (`/quotes` → 👁 on #6 → send), and the message
  was then read back **through the Gmail MCP**: `filename: REG-IN-quote-6.pdf`, `mimeType:
  application/pdf` (⇒ Make's `toBinary()` really produced a file, not text), correct subject, and a body
  carrying migration 7's wording (no "התנעת"). `email_log` row: `entity_id 6 · status sent · sent_by_email`.
  `npm run gate` **exit 0, 270 tests**. Temp spec + `test-results/` deleted; the permanent suite is 4.3.
  ⚠️ **Test-data method:** the demo customer's email is `ron@meditech-demo.co.il` — an invented domain
  that can never receive mail, so receipt was unverifiable. Customer 46's email was **temporarily**
  set to Ishay's own address for the run and **restored immediately after** (verified by re-select).
  **↳ Two real defects the E2E caught that unit tests could not — both mine:**
  **(1) A 403 for everyone, including the CEO.** My permission gate queried `permissions` filtered by
  module only. But policy `permissions_select_all` is `using (true)`, so an authenticated user sees
  **all 45 rows** (5 roles × 9 modules) — the query returned 5, `maybeSingle()` failed, and the function
  answered "no permission" to every caller. Fix: resolve the caller's `users` row first (`role_id` +
  `status='active'`, exactly what `AuthContext` does) and filter permissions by that role. **Lesson
  worth keeping: a read policy of `using(true)` means server code must scope by role itself — RLS is
  not doing it for you here.**
  **(2) The mail went out and the journal stayed empty — the exact silent failure `email_log` exists to
  prevent.** The client sent only the 5 Make-contract fields; `entity_id` is `NOT NULL`, so every insert
  failed while the send succeeded. Anti-double-send protection was therefore *not* in force, with no
  error anywhere. Fix: the dialog now sends `entity_type`/`entity_id`/`template_name` **alongside** the
  contract (kept separate on purpose — the 5 fields belong to Make, these belong to our journal).
  **↳ A contradiction in my own design, caught by the E2E assertion:** I had documented the post-send
  button as *disabled* **and** as opening a re-send `confirm()` — mutually exclusive. Resolved in favour
  of **enabled + confirm**, relabelled "שליחה חוזרת" and dropped from teal to outline: a customer saying
  "I didn't get it" is a real case, and forcing a close-and-reopen is friction with no benefit, while the
  grey "disabled-looking" button was itself misleading (`src/CLAUDE.md` pass 3).
  **↳ Root cause of the three failed API attempts, now known exactly:** the Make UI builds
  **`google-email:sendAnEmail` v4**, whose connection parameter is `account:google-email` — the type
  Ishay's connections actually have. I kept trying **`ActionSendEmail`** (v1 wants `account:google`, v2
  wants `account:google-restricted`), which nothing in his account could satisfy. **It was never a scope
  or connection-type problem — it was the wrong module name.** Once the UI had created the scenario I
  fixed its broken attachment expression via `scenarios_update` in one call
  (`toBinary("1.pdf_base64")` → `toBinary(2.pdf_base64)`: wrong module number *and* quoted, so Make
  would have attached the literal string). **For M4/M8/M11: scenario creation via API is possible —
  use `google-email:sendAnEmail` version 4.**
  **↳ Make assets now live (team 2049106):** data structure `regin-quote` (511348) · webhook
  `regin-quote-email` (3471390) · scenario **"REG-IN — שליחת מייל"** (6759079, `immediately`, ACTIVE)
  with connection `regin-google-restricted` (9407092). 🧹 **Owed cleanup:** two unused Gmail connections
  (`regin-gmail` 9406233, `regin-gmail-send` 9406719 — `scenarioUsages: []`) and the still-missing
  **error handler** ("Skip" in the UI, `builtin:Ignore` in the API) on the Gmail module; availability on
  the free plan was **proved** by creating and deleting a throwaway scenario carrying one.
  **↳ ✅ 12:30 — STEP 3.4 CLOSED. What landed after the first end-to-end proof, and the four further
  defects that only a real send could reveal:**
  **(a) The attachment was a corrupt file, and my earlier verification had MISSED it.** I had written
  "`mimeType: application/pdf` ⇒ the attachment really worked" — **false**: Gmail derives the type from
  the filename extension, not the content. Ishay opened it and got "corrupted or unsupported". Root
  cause: **`toBinary()` in Make defaults to UTF-8 and does NOT decode base64** — the attachment was the
  base64 *string* stored under a `.pdf` name. Fixed to `toBinary(2.pdf_base64; "base64")` (verified
  against Make's own docs + a community thread on this exact symptom, not guessed). **Now byte-level
  proof exists:** Gmail reports the attachment as **33KB**, matching step 3.1's known 34,026-byte PDF —
  the broken version was ~46KB (the string). **Lesson: filename and MIME type are metadata, not
  content. Verifying an attachment means verifying its size or bytes.**
  **(b) The body rendered as one run-on paragraph** — the templates are plain text and the mail module
  sends HTML, where `\n` means nothing.
  **(c) ⚠️ DIRECTION INCIDENT #5 — the first one OUTSIDE a screen.** The Hebrew body rendered LTR at the
  recipient, punctuation on the wrong side. Ishay caught it. **Notable: the attached PDF was already
  correct — a correct document proves nothing about the mail carrying it.** Both (b) and (c) fixed
  structurally in one function, `plainTextToEmailHtml`, which emits **direction wrapper + escaped
  content + line breaks together** so no future caller can get one without the others (same principle as
  `Money`/`LtrFieldGroup`). Generalised rule written into `src/CLAUDE.md`: **every Hebrew artefact that
  leaves the system (mail · PDF · file · print) runs the direction pass itself** — it does not inherit
  `<html dir="rtl">`, because it is read in a different tool entirely.
  **(d) Verified in the sent mail, not asserted:** `htmlBody` = `<div dir="rtl" style="text-align:right">…`
  with exactly 4 `<br>`, attachment present.
  **Also landed:** builder-page "צפייה במסמך" (edit mode only, renders from the **live form** — proven
  by typing an unsaved event name and finding it in the dialog title) · `getLastSuccessfulSend` +
  the "נשלח כבר ב-… אל …" indicator, **proven to survive a page refresh** (a fresh page load shows it,
  so it comes from `email_log` and not from component state — this is the half of finding #8 the table
  was added for; the button also opens as "שליחה חוזרת") · the Make **error handler** (502 response then
  "Skip", so a bad recipient can never disable the scenario again — his 710 incident).
  🧹 **Test residue cleaned:** 4 `email_log` rows pointing at Ishay's personal address were deleted
  (they would have made the demo show "sent to ishay1997@gmail.com"); customer 46's email was restored
  to `ron@meditech-demo.co.il` after each of the five verification sends; all temp specs deleted.
  ⏳ **One item left for Ishay (no API exists for it):** delete the unused Gmail connection
  `regin-gmail-send` (9406719, `scenarioUsages: []`) in the Make UI. **Do NOT delete
  `regin-google-restricted` (9407092) — it is the one the scenario uses.** `regin-gmail` is already gone.
  **↳ 12:45 — migration 9 applied (typed-echo): the mail is signed by the ACTUAL sender.** Ishay asked
  to add the project manager's phone/email "just in case"; I checked the matrix live and recommended
  signing as **whoever sent it** instead — send permission belongs to both מנהלת פרויקטים and מנכ"ל, so
  fixed details would point the customer at someone who does not know the quote. He approved the exact
  wording. **One placeholder `[חתימת_שולח]`, not three:** `buildSenderSignature` assembles name · role ·
  phone · email from `AuthContext` and **omits an empty phone line** — 2 of 3 CEO users have no phone in
  the DB, and "טלפון:" with nothing after it is worse than no phone line; a text template cannot express
  that condition, which is exactly why the composition lives in code and only the slot lives in `params`.
  **Verified in the delivered mail** (not asserted): body contains `ישי אטיאס | מנכ"ל, REG-IN` ·
  `טלפון: 050-1241223` · `מייל: …`, inside the RTL wrapper, with the PDF attached. `gate` exit 0, 283 tests.
  **Answered while at it (his open question):** מנהלת כספים is **`view`** on 'הצעות מחיר' and therefore
  **cannot send** — his own 12/07 ruling (§7.82/F19), now enforced server-side by the Edge Function.
- 29/07/2026 19:55 — **Fix carried back into step 3.2: the red validation messages did not clear until the
  next save.** Ishay found it while driving the live builder, diagnosed the behaviour himself out loud
  ("so the check runs only when you press save"), and chose not to block on it — then asked for it anyway.
  **Cause:** the error map was `state`, written once in `handleSave`; a corrected field kept its message
  until the next click. **Fix:** the map is now *derived* every render — `submitAttempted ? validateQuoteForm(...) : {}`.
  ⚠️ Deliberately **not** "clear the error of the field just touched": three rules here are cross-field
  (combined discount ≤100% · at-least-one-hostess-line · past date), and per-field clearing would strand
  them on a screen that is already valid. `todayIso` also moved into `handleSave` so a form left open
  overnight is not validated against yesterday.
  **Verified live, both directions:** a new form opens with **0** messages; saving it empty raises **7**;
  typing the event name clears *that* message with **no second save** and leaves the rest (**6**), then
  the location clears its own (**5**). **Regression on the path I actually changed:** quote #6 opened in
  edit mode → `quote-save` → `replace_quote_lines` returned **204** → navigated back to `/quotes`.
  **↳ A metric that lied and was corrected:** counting `.text-red-600` elements reported "3 errors" on a
  freshly loaded, perfectly valid edit form. They were the three row **delete icons** and the two discount
  amounts (`-315 ₪`), all legitimately red. Enumerated them rather than trusting the count — "how many red
  things are on screen" was never the question.
- 29/07/2026 19:30 — **Migration 6 applied (typed-echo given): 8th rejection reason `נפתחה בטעות`.**
  Full record in `docs/db_roadmap.md` + the §7.82/F2 write-back. Two things came out of it that belong here:
  **(a) A quote cannot be deleted at all — proven, not assumed.** Ishay approved deleting the two leftover
  test quotes; the DB refused. The lock trigger (§7.50) also guards `quote_services`, and on a cascading
  DELETE the parent quote is already gone, so its status lookup returns NULL and the trigger raises `P0001`
  ("נמצא: unknown"). **Deletion was never actually available** — which retroactively makes the 8th-reason
  ruling the only workable answer, not merely the tidier one. Any future delete-quote feature must drop or
  exempt that trigger first. Resolution taken instead: both quotes marked `rejected` + `'נפתחה בטעות'`,
  which doubles as live end-to-end proof of the new feature.
  **(b) The exclusion is honest, and measurable:** the נדחו tab now shows 5 rows and its breakdown leads with
  "2 נפתחה בטעות", while the approval rate stayed **25% — 1 of 4** and "שווי הצעות פתוחות" returned to
  **30,445 ₪**, the exact figures on the approved mockup.
  **↳ Chip visibility refined after Ishay asked "if there is data, will they appear?"** — a fair challenge to a
  blanket per-tab rule. Now per-chip and data-aware: **"פג בקרוב"** is hidden only where its count is
  *structurally* 0 (expiry is defined for `in_progress` only), and **"אירועים קרובים"** — which measures the
  *customer's* date, not our document's age — is shown wherever it has something to show. His own rule is
  preserved untouched: when a chip is visible and its count is 0, it renders **disabled**, not hidden. Nothing
  here switches a filter off permanently; real data lights them up on its own.
- 29/07/2026 19:10 — **Step 3.3 BUILT. Two sessions were live on this branch at once (iron rule 16), and the
  ownership question the other one raised is now answered by evidence: the uncommitted 3.3 code was mine.**
  The other conversation wrote **no code** — its commits `f67cb98`/`512184c` are docs only — and it correctly
  refused to build. Its own finding is worth keeping: **`git add -A` from one session sweeps another
  session's in-progress files into its commit**; stage explicit paths whenever a parallel session is live.
  Files: `QuotesPage.jsx` · `RejectQuoteDialog.jsx` · `ApproveQuoteDialog.jsx` · `QuoteActionDialog.jsx` ·
  `QuoteDocumentDialog.jsx` + `quotes.js`(+test) + `api.js` + `App.jsx` route.
  **↳ Three defects found by measuring, none visible in a screenshot — the same family as 3.2:**
  (1) **The filter row silently wrapped to two lines.** Measured: five controls totalling **1,071px inside a
  912px card**, so the two chips dropped to their own line and read as a different control. Root cause is
  specific and worth keeping: two native `input[type=date]` occupy **258px** and cannot be shrunk below their
  intrinsic width — the approved mockup draws a single narrow dropdown there. Fixed by making the date range a
  **button that opens a panel** (the pattern `CustomersPage` already uses for "סינון") plus trimming the search
  and customer controls; re-measured at 893px. (2) **My own assertion was wrong before the layout was.** The
  fix looked like it had failed because I compared `getBoundingClientRect().top` — a 30px chip centred inside a
  38px row legitimately sits 4px lower. Comparing **centres** showed all six controls at `centerY 291`. Same
  lesson as 3.2's `30`→`30030`: on a red check, suspect the check. (3) **A blank white screen from a
  temporal-dead-zone `const`** — `showChips` was declared *after* the line that used it. React rendered
  nothing and the automated tests reported only "element not found"; the cause was invisible without reading
  the order of declarations.
  **↳ Deliberate deviations from the mockup, each with its reason:** (a) the date filter is a button+panel, not
  two inline fields (above); (b) the two quick-filter chips are **hidden** on מאושרות/נדחו — a rejected quote
  can never expire, so a permanently-disabled control there is noise by `src/CLAUDE.md` pass (2), and when
  hidden they also stop filtering, so no invisible filter can hide rows; (c) the ⭳ download-arrow became an
  **eye** labelled "צפייה במסמך" (Ishay's ruling: an icon that promises a download but opens a preview is
  "same look, different job"); (d) row action buttons are the mockup's bordered 30px squares rather than the
  project's `variant="link"` icon button — up to four actions share one row and need separation.
  **↳ Pulled forward from 3.4 on purpose:** the document dialog ships here with **view + download**, because a
  button rendered per the mockup that does nothing is worse than either alternative. What stays in 3.4 is the
  actual new work: "שלח במייל" from the `תבנית_מייל_הצעת_מחיר` param, primary contact only, `in_progress` rows
  only, and wiring the same dialog into the builder page.
  **↳ Verification note — the PDF preview could not be eyeballed by the automated browser.** The `<iframe>`
  renders blank in headless Chromium (no bundled PDF viewer) — the same class of viewer-artifact that cost an
  hour in 3.1. Rather than chase it, the blob was fetched from the live page and written to disk: **34,026
  bytes, `%PDF-` header**, and its extracted text carries quote #6, מדיטק, `18:00–22:00` in the correct order,
  the three catalogue item names, and the full waterfall to **6,319 ₪**. Visual glyph rendering of this exact
  engine was already proven in real Chrome in 3.1. **Still unverified by human eye: this dialog on Ishay's
  screen** — one click at `/quotes` → 👁.
  **↳ Shared-component review Ishay asked for, and what it found.** `jscpd` flagged two real clones between the
  approve and reject dialogs; both are gone, folded into `QuoteActionDialog` (the shell owns saving-state and
  error display, the caller owns validation and the action). Three near-duplicates that jscpd **cannot** see
  because their strings differ: the right-side-magnifier search box (**4 files**), the three-branch empty state
  (**2 files**), and the fact that `ConfirmDialog`/`useConfirm` — a shared confirm mechanism that already
  exists — takes only plain text and therefore cannot carry either of these bodies. **Not extracted on purpose:**
  two examples is where the wrong abstraction gets born; 3.5/3.6 will add the third and fourth, and step 3.7
  (the Phase-3 UX gate) is the right moment. Merging `ConfirmDialog` with `QuoteActionDialog` touches modules 1
  and 2, which are merged and closed — recommend deferring past the deadline.
  **↳ Demo-data pollution to clean:** quotes **#14/#15** ("בדיקת שמירה …", "בדיקת דיילות ידנית …") are leftovers
  from 3.2's throwaway verification specs. They inflate "שווי הצעות פתוחות" to 41,690 ₪ and the בתהליך tab to 6.
  Deleting them is Ishay's call (they are data, and this repo has no delete-quote flow).
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
