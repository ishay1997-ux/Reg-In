# Module 8 — כספים וסגירת אירוע · Build Micro-Guide

> Written for a future Claude session with zero memory of the blueprint conversation. English
> throughout; Hebrew only as data (DB values, UI strings, §7 quotes). **This guide IS the approved
> plan** — build sessions execute it directly (iron rule 2: no extra planning round).

## 1. 🟢 Live Status Header

| | |
|---|---|
| **Module** | 8 — כספים וסגירת אירוע (Finance & event closing) |
| **Branch** | `ishay/module-8-phase-2` — ✅ **CUT `27/08/2026 19:5X` from fresh `origin/dev` (`ed353bc`)**, after phase 1 shipped to production. Fresh-branch discriminator at cut: `git log origin/dev..HEAD` ⇒ **empty** *(fresh, NOT merged-and-dead — iron rule 10's caveat)*. 🧹 **Seven merged branches were deleted the same minute** (remote + local), SHAs recorded in `CLAUDE_CODE_LOG` before deletion: `module-8-finance` `e41be2b` · `module-8-c2-and-n1` `3593bf9` · `module-8-n1b` `5e0bf45` · `fix-flaky-checklist-focus` `c3b2eaf` · `module-5-logistics` `3822a47` · `post-merge-m5-flip` `89f830b` · `reconcile-main-into-dev` `8e63da9`. **Remote now holds `dev` and `main` only.** *(Was: `ishay/module-8-finance`, cut 12:4X from `585ad27` — merged to production 17:4X and deleted.)* |
| **Owner** | Ishay (sole developer) |
| **Status** | 📘 **BLUEPRINT APPROVED — Ishay, `26/08/2026 22:43`** (*"מבחינתי אחרי הבדיקה הזו יש אישור"*, after the migrations-impact check; Q-1…Q-5 ruled 22:40 — *"מאשר את חמשתן לפי ההמלצות"*; N-1…N-6 approved within the same word — each reopenable without ceremony). Discovery CLOSED 26/08/2026. 🖥️ **BUILD OPENED 27/08/2026 12:4X.** ✅ **PHASE 1 COMPLETE 27/08/2026 16:5X — all ten migrations applied and verified, and the 1.8 gate passed.** *(This row read "Zero migrations applied" until the gate; corrected there.)* |
| **Last updated** | `27/08/2026 20:45` *(system clock)* |
| **Active step** | **3.6 — the 🎨 gate, which is Ishay's single consolidated review. ✅ PHASE 3 COMPLETE `28/08/2026 00:2X`: all four surfaces + the route swap, suite `1,697 / 64 exit 0` (was 1,572/59 ⇒ **+125, zero regressions**), `npm run gate` **exit 0**.** Built by a 12-agent workflow (3 leaf surfaces ‖ → S1 → routes → 3 adversarial lenses → 4 fixers; 0 errors, 3.28M tokens, ~2h). **The panel raised 16 findings; the mechanical lens returned ZERO in both phases; the fixers — who were explicitly allowed to reject — refuted NONE, though they rejected three suggested FIXES** (one would have destroyed the recorded anchor `292.60`, one would have printed `בוטל ע"י הלקוח ביטל`, one contradicted a recorded ruling). ⏸️ **Awaiting Ishay: the 🎨 review, the 17 undrawn S2 controls, the S3-preview product question, and the two unapplied migrations.** *(Previously: 3.1/3.5 in flight; before that 3.0 — the Phase-3 door.)* **✅ PHASE 2 COMPLETE `27/08/2026 22:1X`: six new files, 117 new tests, suite 1,572/59 exit 0, `gate` exit 0, zero regressions.** Built by a 9-agent workflow (3 builders · 3 adversarial lenses · 3 fixers, 0 errors, 2.06M tokens, 64 min) and then re-verified independently by the orchestrator. 🔴 **Two REAL defects in already-shipped Phase-1 work were found by the lenses and are NOT fixed — both need Ishay's typed echo and both are recorded in §10 under `27/08 22:1X`: (a) the `finance` bucket rejects xlsx ⇒ the salary file can never be stored; (b) the cancellation-fee band pays 0% instead of 50% at exactly 72.0h.** ⏸️ Neither was applied — the 28/08 interim presentation runs on this same Supabase project. *(Previous: `2.1`. Door 2.0 closed `27/08/2026 20:45`* (baseline re-measured **1,454 tests / 56 files, exit 0** — identical to hand-off; ledger sweep found **nothing new for Ishay**: Q-1…Q-5 ruled 26/08 22:40, N-1…N-6 approved 26/08 22:43, A-1…A-10 recorded — but **two measured findings did land, both in §10 under `27/08/2026 20:4X`**: step 2.1's function list is superseded by what Phase 1 actually built, and two of the four acceptance anchors do not reproduce from a plain read of the live DB). 🎉 **PHASE 1 IS DONE AND IN PRODUCTION**, and so is every debt it created. **Shipped 27/08/2026:** ten migrations (A–G) · the 1.8 gate · **`C2` — ה19 CLOSED** (the three bank columns are gone; bank details live only in `hostess_bank_details`) · **`N1`+`N1b` — the languages normalization COMPLETE** *(🔑 `data_type='ARRAY'` across `public` now returns **zero** columns — the single 1NF violation is gone)* · plus a flaky m5 test fixed with proof. **Production is `c1a3306`, deploy verified by fetching the live bundle and asserting its contents** — not by trusting the pipeline's word. **Battery at hand-off: `gate` exit 0 / 1,454 tests · `smoke` exit 0 · m4 suites 32/32.** ⏸️ **ONE debt remains and it is NOT m8's to build: `N2`** (`customer_contacts` consolidation — 46 occurrences / 16 production files across `src/lib` and modules 2·3·6, **plus a screen**). **Ishay approved it 27/08; the measured recommendation is a fresh branch AFTER the 28/08 interim presentation**, because it runs through the quote→project→email chain. Registered in `db_roadmap` §9א · `PROJECT_MASTER §6` · the session-start banner. 🔄 **Seed refresh 28/08 morning, before the presentation.** |
| **Deadline** | conference **01/10** (target: 100%) · end 20/10. m8 is the last *process* module before reports — the conference's "closing the loop" story leans on it. |

**Legend:** 🔻 stop-point · 🤖 Claude verifies alone · 👤 human (Ishay) gate · 🚧 cross-module debt (§6) · ⏳ deferred decision · 🕓 freshness stamp · 🔗 tagged §7 mirror · 🧩 handoff prompt · 🧊 frozen file · 🔮 future checkpoint · 🗡️ DB Design Challenge
**Step status set:** ⬜ pending · 🔨 in progress · ✅ done · ⏸️ deferred (with target module) · ❌ blocked (with reason)

| Step | Title | Status |
|---|---|:--:|
| **1.0** | 🔻👤 Phase-1 door — branch cut · ledger sweep · live re-measurement · baseline · **Ishay checkpoint** | ✅ |
| **1.1** | Migration A — `project_finance` child + `projects` finance columns + `assignments.released_from_status` + C-1 index | ✅ |
| **1.2** | Migration B — `salary_reports` document model + `salary_report_lines` + RLS | ✅ |
| **1.3** | Migration C + same-step client rewire — `hostess_bank_details` split (ה19) | ✅ *(both halves; `drop column` deferred to C2 — §8.4)* |
| **1.4** | Migration D — `email_log` CHECK +2 values + 'כספים' SELECT policy → **then** `send-email` deploy | ✅ *(both halves; deploy = v6)* |
| **1.5** | Migration E — the finance RPC family (E1 SSOT+readers+m6 ripple · E2 7 write actions · E3 salary + fix-forward) | ✅ |
| **1.6** | Migration F — public feedback RPC pair `/feedback/:token` + rate limit | ✅ |
| **1.7** | Migration G — `cancel_project` extension (live-body pull) + params seeds | ✅ |
| **1.8** | 🔻👤 Phase-1 gate — advisors · schema.sql regen · db_roadmap §10 · commit | ✅ |
| **1.9** | 👤 **Ishay: merge → promote → deploy → then the drops.** ✅ **ALL DONE 27/08/2026.** PR [#68](https://github.com/ishay1997-ux/Reg-In/pull/68)→`dev`, [#69](https://github.com/ishay1997-ux/Reg-In/pull/69)→`main` ⇒ **`C2` applied 18:0X, ה19 CLOSED**. Then [#70](https://github.com/ishay1997-ux/Reg-In/pull/70)/[#71](https://github.com/ishay1997-ux/Reg-In/pull/71) ⇒ **`N1` + rewire**, and [#73](https://github.com/ishay1997-ux/Reg-In/pull/73)/[#74](https://github.com/ishay1997-ux/Reg-In/pull/74) ⇒ **`N1b`, normalization complete**. Production **`c1a3306`**, live bundle asserted. *(Also merged on the way: [#72](https://github.com/ishay1997-ux/Reg-In/pull/72) — the flaky m5 test.)* | ✅ |
| **2.0** | Phase-2 door — ledger sweep | ✅ *(`27/08 20:45`; findings → §10)* |
| **2.1** | `src/lib/projectFinance.js` — display derivations + shape guards + tests vs hand anchors ⚠️ shared-surface | ✅ *(38 tests)* |
| **2.2** | `src/lib/salaryReport.js` — aggregation model + line building + xlsx assembly + tests ⚠️ shared-surface | ✅ *(30 tests)* |
| **2.3** | `src/modules/08_finance/api.js` — reads, RPC calls, mail sends + tests | ✅ *(49 tests)* |
| **2.4** | 🔻👤 Phase-2 gate — full unit suite + anchors reproduced | ✅ *(`27/08 22:1X` — suite **1,572/59 exit 0** vs baseline 1,454/56, **zero regressions** · `npm run gate` **exit 0** · orchestrator cross-check 8/8 · sign-flip mutation reddened **7** tests across two files, file restored byte-identical)* |
| **3.0** | Phase-3 door — shared-component checkpoint + OPEN-item sweep | ✅ *(`27/08 22:1X` — done serially by the orchestrator: `StatusTag` `danger` tone added, `RatingStars` confirmed present, `assertFinanceShape` call-site rule ruled)* |
| **3.1** | S1 — `/finance` overview page | ✅ *(38 tests)* |
| **3.2** | S2 — closing-window dialog, **4 states** (Q-1 added the fourth) | ✅ *(49 tests; **17 undrawn controls declared** — see §10)* |
| **3.3** | S3 — salary-report dialog + history | ✅ *(20 tests)* |
| **3.4** | S4 — public feedback page `/feedback/:token` | ✅ *(9 tests)* |
| **3.5** | Route + nav registration ⚠️ shared-surface | ✅ *(`App.jsx` swap + the public route)* |
| **3.6** | 🔻👤 Phase-3 🎨 gate — UX & functional review **with Ishay** | 🔨 **awaiting his single consolidated review** |

> 🗣️ **Approval model for phase 3, changed by Ishay `27/08/2026 ~21:0X`:** the per-unit 🗣️ gate is
> **consolidated into ONE review at the end**, on the built screens, in his words — *"אני יאשר בסוף
> את המסכים פעם אחת אחרי שאראה את כולם"*. ⚠️ **This overrides his own Q-1 note that S2's added
> controls would each get a small mockup before code** — put to him explicitly with both sides
> quoted (`27/08 ~21:3X`), and he ruled: build them, and **mark every undrawn control when you
> present the screen**. Each surface agent therefore returns a structured `undrawn_controls` list,
> which is what he will be shown at review. *(Recorded here because a future session reading the
> Q-1 row alone would conclude the gate was skipped.)*
| **3.6** | 🔻👤 Phase-3 gate — 🎨 UX & functional review | ⬜ |
| **4.0** | S3 preview state (Ishay-approved `28/08 00:3X`) + S2 footer layout fix | 🔨 S2 polish ✅ *(49 tests)*; S3 preview building |
| **4.1** | M6 ripple — survey-link → token URL (mint-before-send) ⚠️ shared-surface | 🔨 in flight *(cross-ref logged in `module-6.md` §10)* |
| **4.2** | M2 ripple — customer metrics filters + "סכום" column (RC-6) ⚠️ shared-surface | 🔨 in flight *(cross-ref logged in `module-2.md` §9, incl. the deliberately-reversed privacy comment)* |
| **4.3** | Doc ripples — §6 debt consumption · registers · ripple sweep | ⬜ *(orchestrator's; the §7.52/§7.68 flips are Ishay's per rule 13(ו))* |
| **4.4** | E2E + smoke + accessibility for the 4 surfaces; full regression | 🔨 in flight |
| **4.5** | 🔻👤 Phase-4 gate | ⬜ |

> 🗣️ **Ishay delegated the survey ruling to Claude, `28/08/2026 ~01:0X`** — *"תציג את האפשרויות
> ותחליט בעצמך עם סיבה וזהו… תנסה להקל עלי ולא להוסיף לי עבודה"*. ⇒ **the A/B/C question does NOT
> go back to him as a question.** The morning report presents the options, the decision, and the
> reason; he overrides if he disagrees. **The condition he attached is the real instruction —**
> *"כל עוד באמת ביררת ושקלת אפשרויות"* — so the ruling is only legitimate once the dispatched
> research returns and its sources are read, not summarised.
| **5.1** | Live acceptance journeys on real data (credentialed; mails land in Ishay's inbox) | ⬜ |
| **5.2** | 🔻👤 Closing audit — `module-close` in a FRESH session | ⬜ |

---

## 2. 📦 Context Packet for Claude

### 2.1 Purpose (≤3 lines)

The finance manager closes the loop the rest of the system opens: an operationally-closed project
flows to her → invoice (upload-and-send, never generated — §7.38) → payment tracking with derived
days-overdue → feedback capture (automatic via a public page) → archive that freezes final profit
in ₪ and locks the file. Beside it: the monthly salary report to the accountant (signed snapshot,
including cancellation compensation) and three-component cancellation fees.

### 2.2 Capabilities delivered vs deferred

| Capability | What m8 delivers | Completed by | Tracked where |
|---|---|---|---|
| Collection flow (P1) | S1 3-tab worklist · invoice upload+send (M1 mail) · `invoice_sent_at` stamp · derived days-overdue vs `תנאי_תשלום_ימים` | ✅ complete here. Automatic payment reminders — ❌ not now (M10's dispatch engine; already parked in §6/M10 rows) | this guide |
| Feedback capture (P2) | S4 public page + token pair · manual-entry fallback · <3 phone-clarification gate · `completed`/`no_response` writers (closes ג7) | ✅ complete here. Survey SENDING stays m6's (§7.39/§7.92 — m8 sends nothing) | this guide |
| Closing & freeze (P3) | S2 balance view · dual-gate archive · `final_profit` frozen-₪ (§7.52) · full lock + token kill · bad-debt path (`written_off`) | ✅ complete here | this guide |
| Cancellation fee (§7.20ג) | 3-component proposal (ה23/ה24/ה25/ה29) · editable final amount + waive (ה28) · immediate billing via P1 · cancelled-profit freeze at fee resolution (product-Q1) | ✅ complete here | this guide |
| Salary report (P4) | S3 month picker + preview + "ייצא ושלח" (M2 mail) · `salary_reports`+`salary_report_lines` snapshot (§7.68) · double-generation block (`period` UNIQUE) · travel stamped at generation (ה14) — **pays the `🚧 מ8 ← מ4` salary-report debt** | ✅ complete here. Travel AMOUNT verification with the CPA — ⏳ §7.69 🟠, before M10 sends real mail | this guide · §6 |
| Bank-details protection (ה19) | `hostess_bank_details` child split, read 'דיילות'-edit + 'כספים'; **pays the `🚧 מ8 ← מ4` bank-validation cross-check debt** (real cross-check = payroll consumption; no format validation, Ishay 12/08) | ✅ complete here | this guide · §6 |
| Customer-card finance metrics | avg feedback ("מאלה שענו") + satisfaction filter + "סכום" incl. scope changes (RC-6) — **pays the m2-card `🚧 מ8` debts** | ✅ complete here. Cumulative-profit DISPLAY on finance/report surfaces — M11 consumes the number | this guide · §6 |
| Reports & KPI feed | `final_profit` per project (incl. resolved-cancelled, §7.79↳) · expected profit (ה27) · budget deviation (ה18) — the NUMBERS | 🚧 **מ11** + 🚧 **מ7** — **both supply-contract lines ALREADY EXIST in §6** (written 26/08/2026 at Discovery close: `🚧 מ11 ← מ8` · `🚧 מ7 ← מ8` · `🚧 מ10 ← מ8`); M11 adds its OWN read policies on m8's tables (the `email_log` per-module-policy precedent — the existing מ11 line says exactly this) | **§6 — existing lines, CITED not duplicated** |
| Cost-read tightening (ה30) | `quote_services.closing_unit_cost` SELECT narrowed to edit-'הצעות מחיר'-or-'כספים' (`product_costs` pattern) — **pays the `🚧 מ8 · 🚧 מ9` token** | ✅ complete here | this guide · §6 |

**Rule:** every `🚧 מN` token above must have a byte-matching `🚧 מN` line in `PROJECT_MASTER.md` §6
(iron rule 15; Stop-hook enforced). **This module creates ZERO new tokens** — the three outbound
supply contracts (`🚧 מ11 ← מ8` · `🚧 מ10 ← מ8` · `🚧 מ7 ← מ8`) were all written at Discovery close
(26/08/2026) and are cited, not re-created *(the draft's first version planned a "new" מ11 line —
the fresh-context reviewer measured it already on disk; a second line for one debt is exactly the
drift §6 exists to prevent)*. Inbound `🚧 מ8` debts consumed here are marked paid at 4.3.

### 2.3 Existing files to touch (the module's whole non-additive surface)

| File | Change | Step |
|---|---|---|
| `supabase/functions/send-email/index.ts` | `ENTITY_MODULE` + `ENTITY_REQUIRES_ATTACHMENT` gain `invoice` + `salary_report` (both 'כספים', both attachment-required) — **deployed immediately AFTER migration D, never before** | 1.4 |
| merged m6 RPC `cancel_project` | extended to persist `assignments.released_from_status` before flipping to `released` (R4-F2) — **pull live `pg_get_functiondef` first** (migrations/CLAUDE.md rule) | 1.7 |
| `src/modules/04_hostesses/HostessFormDialog.jsx` (4 sites) + `HostessViewCard.jsx` (1 site) | bank fields → `hostess_bank_details` child (F13 mapped the exact anchors) — **same step as migration C**, or every new-hostess save breaks | 1.3 |
| `src/modules/04_hostesses/api.js` | `createHostess`/`updateHostess` write bank rows to the child table (LEFT-join read; a hostess without a bank row still renders) | 1.3 |
| `src/lib/shiftEmails.js` (2 anchors: `:254,:300` era) + `src/modules/06_projects/ClosingTab.jsx` + `ClosingTab.test.jsx` | survey link: `קישור_בסיס_סקר_לקוחות` → `/feedback/:token` URL; token minted lazily (get-or-create RPC) at mail-send; `close_project_operationally` untouched (R4-F11) | 4.1 |
| `src/lib/customers.js` (`deriveCustomerMetrics`, `matchesCustomerFilters`) + `src/modules/02_customers/api.js` (`getCustomerProjects`, `listProjectsForCustomerMetrics`) + `CustomersPage.jsx` + `customers.test.js` | ה8 population filters (finished-or-resolved-cancelled · `feedback_status='completed'`) + satisfaction filter key + widened selects — reverses a deliberate m2 privacy comment: flip it to a deliberate-widening comment, not a silent edit | 4.2 |
| `src/lib/customerProjects.js` (`projectAmount`) | "סכום" = quote + Σ scope changes (ה2/RC-6); read path stays permission-safe (§7.21 route) | 4.2 |
| `src/App.jsx` + `src/lib/constants.js` (if path missing) | `/finance` route under `<ProtectedRoute allow="כספים">` + `/feedback/:token` public route OUTSIDE `MainLayout` (the `/shift/:token` precedent) | 3.5 |
| `e2e/smoke.spec.js` + `e2e/smoke-anchors.json` | smoke coverage for `/finance` (house rule: every new module adds screen+anchor) | 4.4 |
| `e2e/accessibility.spec.js` | S1 + S4 added to the axe scan list | 4.4 |

Everything else is additive (new files/tables/policies only). **Cross-module collision check (run at
1.0):** no other micro-guide is OPEN at draft time — m5 stands at its closing steps (5.1/5.2) with
its remaining files (`STATUS.md`, `CLAUDE_CODE_LOG.md`, m5 sources) uncommitted on the m5 branch;
m8's build starts only after the m5 merge, so no live file overlap. Re-verify at 1.0.

### 2.4 Files to create

| Path | What |
|---|---|
| `supabase/migrations/<ts>_module8_*.sql` × ~7 | migrations A–G (steps 1.1–1.7) |
| `src/lib/projectFinance.js` + `.test.js` | the money SSOT (§2.8 below; iron rule 14 — UI never re-derives a formula) |
| `src/lib/salaryReport.js` + `.test.js` | salary aggregation + line building + xlsx assembly |
| `src/modules/08_finance/api.js` + `api.test.js` | reads + RPC calls + mail sends (house pattern) |
| `src/modules/08_finance/FinancePage.jsx` (S1) · `ClosingWindowDialog.jsx` (S2) · `SalaryReportDialog.jsx` (S3) | the three internal surfaces |
| `src/modules/08_finance/PublicFeedbackPage.jsx` (S4) | public page, `PublicConfirmPage.jsx` structure |
| `src/modules/08_finance/CLAUDE.md` | module gotchas file (module-close §4c makes it binding) |
| `e2e/finance.spec.js` + `e2e/public-feedback.spec.js` | E2E for the internal flow + the public page |

### 2.5 DB tables and migrations

**Owns:** `salary_reports` (upgraded) · `salary_report_lines` (new) · `project_finance` (new) ·
`hostess_bank_details` (new). **Writes on others' tables:** `projects` (5 existing feedback/invoice
columns + new `invoice_sent_at`, `feedback_token`) · `assignments` (`salary_report_id`,
`travel_amount`, `personal_bonus`, new `released_from_status`) — all via DEFINER RPCs gated
'כספים' (§7.63/㉘). **Reads (RPC-DEFINER only, never client-side):** `logistics` (item_status for
the fee's goods component — finance is BLOCKED on 'לוגיסטיקה'; client read = silent `[]`, R4-F1) ·
`hostesses`+`assignments` (salary flow — blocked on 'דיילות', R4-F5). **Reads (client, existing
policies):** `quotes`/`quote_services` (finance holds 👁 on 'הצעות מחיר'; ה30 narrows only the
`closing_unit_cost` column-carrying table read to edit-or-'כספים' — finance KEEPS cost read) ·
`project_changes` via `list_project_changes` (money visible to 'הצעות מחיר' holders — finance has 👁 ✓).
**Storage:** `finance` bucket — private, 10MB, 4 policies, LIVE and empty (ג6/ה13); invoices +
salary xlsx files live there; delivery = download-and-attach, never a signed URL in mail (§7.61).

### 2.6 Dependencies

- **m6 (merged):** `close_project_operationally` feeds the queue (`awaiting_invoice`) ·
  `cancel_project` stamps `cancelled_at`/`cancel_type` · `set_project_finance_fields` exists,
  0 call sites, replaced here (ה22) · `recompute_project_status` proven not to fight m8's
  transitions (R4-F15) · `projects_closed_needs_report` CHECK physically blocks cancelled→finished.
- **m5 (merge pending — build waits for it):** `logistics.item_status` (`ordered`/`ready`) is the
  fee's goods trigger · B13 limitation neutralized by ה17/ה26 (cost base = quote lines, not logistics).
- **m4 (merged):** `hourly_rate_snapshot` · `actual_hours` (written by m6 close) · `travel_amount`
  column (no writer yet — m8 is first) · `personal_bonus` (m8-owned, first writer) · the
  `/shift/:token` public-RPC + rate-limit precedent (§7.45).
- **m3 (merged):** `computeQuoteTotals`/`preVat` (revenue base, ה2) · `closing_unit_price`/`_cost`
  frozen at approval · `quoteEmailSubject` pattern for M1's subject.
- **Mail engine (m3, shared):** `src/lib/email.js` + `src/api/email.js` + `send-email` — consumed
  as-is; m8 adds only placeholders/subject/recipient + its two `entity_type` values. Attachment
  ceiling: `MAX_ATTACHMENT_BASE64_CHARS = 4,000,000` ⇒ hard binary wall ~2.86MB — an xlsx of a few
  hundred rows is far below; the 10MB bucket admits invoice files bigger than mail can carry —
  invoice send must surface the engine's size error (it exists) rather than assume fit.
- **NEW runtime dependency: an xlsx writer** (SheetJS `xlsx` or equivalent). Nothing in
  `package.json` builds Excel today; ה4 mandates `.xlsx` only. Technical-execution decision
  (no product meaning), flagged here so the builder doesn't rediscover it. The PDF precedent
  (`quotePdf.jsx` builds the document in-browser) is the shape to copy: build in browser → upload
  to bucket → attach base64 to the mail payload.

### 2.7 🔑 Test Identities (MANDATORY — RLS + role-gated UI)

Copy m5 §2.7's recipe wholesale; the m8-specific facts:
- The role that owns this module: **מנהלת כספים ולקוחות** (edit on 'כספים', 👁 on 'הצעות
  מחיר'/'פרויקטים', **blocked** on 'דיילות'/'לוגיסטיקה' — the two silent-`[]` traps R4-F1/F5).
- Impersonation for RLS tests: `set_config('request.jwt.claims', …)` carrying BOTH `sub` and
  `email`, **plus `set local role authenticated`** (G3 lesson: MCP runs as `postgres` with
  `rolbypassrls` — without the role switch every negative control silently passes).
- **Positive control first:** a known-edit role must return ≥1 row before any 0-row result is
  read as "RLS works".
- UI-login creds: `E2E_<ROLE>_*` pairs in `.env.local`. ✅ **Counted at step 1.0, 27/08/2026: five
  pairs exist — CEO · FINANCE · PROJECTS · RECRUIT · STAFF. `E2E_FINANCE_*` IS configured**, so the
  door's "raise it to Ishay" branch did not fire. ⚠️ **The 29/07 note that it was "optional, not
  configured" (module-1.md §9) was already stale when this guide was written** — it was carried
  forward unverified; the correction is measured, not inherited. 🔴 **Still unproven: that the
  credential actually LOGS IN** — presence is not a working identity, and the first thing that
  exercises it is 4.4/5.1. If it fails there, creating/repairing a login is Ishay's (iron rule,
  prohibited-actions).
- Resolve `role→email→user_id` LIVE from the seed at test time, never hard-code.

### 2.8 Product source of truth

**Tier 2 — the approved spec (PRIMARY; overrides C5/C6 per item):**
`docs/specs/module_08_finance/spec.md` (entry; its §① reading list is binding) →
`processes-approved.md` (SSOT: ledger, P1–P4 cards, ה1–ה30, review-wave constraints, 3 product
answers) → `screens-approved.md` (6 surface cards + cross-surface resolutions #1–#6) → the 6
approved mockups in `docs/mockups/finance-screen/approved/` (appearance wins on what-is-seen;
behaviour stays the spec's) → `design-contract.md` (measured palette/components/RTL; §⑥ maps every
surface to its code precedent) → `data-set.md` (the shared cast; **the 4 hand-computed acceptance
anchors — never re-derive**) → `world-sources.md` (the conference "why") →
`stage1-review/m8-review-infra-ripples.md` §"THE COMPLETE CHANGE-LIST TO MERGED CODE" (16 rows,
binding). **Registers (always read live):** `PROJECT_MASTER_sec7.md` (the 16 module items) ·
`PROJECT_MASTER.md` §6 (`grep '🚧 מ8'`) **+ §3 (the permission matrix — the RLS policies' role
truth; the spec's own list never reaches it, measured by the simulated-build pass)** ·
`db_roadmap.md` (M8 rows + §1 checklist + §6 per-table) · `docs/schema.sql` (exact column/
constraint names for every drop/alter — the bank columns, the 6-arg signature, the CHECK names) ·
`docs/reference_spec/products_and_params.md` (the `param_type` convention for the two seeds).
**Tier 3 background where the spec is silent:** C5 §5.5.10/§5.6.13/§5.6.14/§5.7.4/§5.7.5/§5.8.3/
§5.8.10 · C6 §2.4.4/§2.4.10. Known-bad C5 passages: `db_roadmap.md` §9 (esp. #4 — the C6 two-value
cancel enum is superseded by the live 3-value `cancel_type`).

### 2.9 Environment facts

`@/supabaseClient` (NOT `@/lib/`) · dev server 5173 · full RTL: physical utilities only, `<Money>`
for every ₪, `<Ltr>` for every non-Hebrew value, split consecutive numbers with a Hebrew word
(design-contract §3.3) · every portal surface gets explicit `dir="rtl"` · all m8 UI strings are
feminine (S-28) · `LoadingOrError` needs explicit `retryLabel="נסי שוב"` per call site ·
Supabase project `yfeovxppnfoafmfbdfvh`, Postgres 17; **MCP availability must be verified at 1.0**
(it was unauthenticated in the blueprint session — every live claim here is dated 26/08/2026 from
the Discovery's measurements, same day, not re-measured at blueprint time) · typed-echo gate before
every `apply_migration` (supabase/migrations/CLAUDE.md — the SSOT) · `moddatetime` lives in schema
`extensions` · new-function grants: `revoke … from public, anon, authenticated` then grant by name.

---

## 3. 🧭 Decisions Ledger

### 3.1 §7 items of this module (16 — read each to its tail in `PROJECT_MASTER_sec7.md`)

| Item | State | What it binds here | Lands in |
|---|---|---|---|
| §7.19 🟢 | pay = `actual_hours × hourly_rate_snapshot + personal_bonus` per row; no event-spread; `project_bonus` deleted | 2.2 · 1.5 |
| §7.20 🟢 | (א) days-overdue minimal scope: `invoice_sent_at` + `תנאי_תשלום_ימים`=30, derived display, no reminders/interest · (ב) refunds out of scope; credit-note display flag · (ג) 3-component cancellation fee | 1.1 · 1.5 · 2.1 · 3.1 · 3.2 |
| §7.37 🟡 half | no weighting formula in-system (ה6); ONLY the KPI quarter window stays open — **M7's, not ours; do not touch** | — (deferral) |
| §7.38 🟢 | system never generates invoices — upload+send; free-text filename, no numbering | 3.2 · 1.5 |
| §7.46 🟢 | unsigned-rows model absorbs the late-closure edge; double-pay = the FK signature | 1.2 · 2.2 |
| §7.52 ⚪→exec | final profit frozen-₪ at the FINANCIAL closing (m8's window); expected derived live; % always display-derived | 1.5 · 2.1 · 3.1 |
| §7.57 🟢 | salary generation is manual; the ghost param stays unseeded | 3.3 |
| §7.58 🟢 | budget deviation: one ₪ number, labor side only (ה18) | 2.1 · 3.2 |
| §7.61 🟢 | `finance` bucket (live); download-and-attach delivery | 1.5 · 2.3 |
| §7.63 🟢 | RPC is the authorization unit; the bank half closes via ה19's split | 1.3 · 1.5 |
| §7.68 ⚪→exec | `period` UNIQUE + `salary_report_lines` frozen snapshot + total | 1.2 |
| §7.69 🟠 | travel = param per shift, stamped at generation (ה14); **AMOUNT stays open until CPA, before M10** — seed 22.60 (ה20) is demo-grade, not final | 1.7 · 2.2 |
| §7.78 🟢 | freeze framework ratified (ה21): approval → operational close → **financial archive (built here)**; no fourth window | 1.5 |
| §7.79 🟢 | cumulative profit = finished + resolved-cancelled; avg feedback = completed only; `deriveCustomerMetrics` gets both filters | 4.2 |
| §7.80 🟢 | score→tag: 5=מצוין · 4=טוב · 3=בינוני · 1–2=טעון-בירור; green 4–5 · yellow 3 · red <3 | 2.1 · 3.1 |
| §7.92 🟢 | m6 sends the survey mail; **m8 sends NOTHING, builds no send/resend button** (ה11) | constraint on 3.2 |

### 3.2 Delegated rulings ה1–ה30 + the three product answers

SSOT: `processes-approved.md` §ה + §"גל-ביקורת" + §"שלוש שאלות-המוצר". All reopenable without
ceremony; none re-litigated here. The ruling-coverage ledger (§3.8) maps every one to its owning
step. Three that shape the ARCHITECTURE and are restated as managed mirrors:
- 🔗 מראת ה22 — SSOT: processes-approved.md: the finance RPC splits into **four assertive actions**
  (invoice · payment · feedback · archive); the existing 6-arg `set_project_finance_fields` gets an
  explicit `drop function` (0 call sites, measured). ה12's status gate (writes only from
  `awaiting_invoice` onward) applies to all four.
- 🔗 מראת product-Q2 — SSOT: processes-approved.md: `final_profit` · `cancellation_fee` ·
  `written_off` live in child table **`project_finance`** (read-gated 'כספים'); the five existing
  feedback/invoice columns stay on `projects` (feedback deliberately shared — ㉞);
  `invoice_sent_at` stays on `projects` (process status, not money).
- 🔗 מראת ה15+product-Q1 — SSOT: processes-approved.md: salary aggregation covers BOTH op-closed
  rows (actual hours) AND cancelled rows (§7.16 compensation % × planned hours × frozen rate);
  cancelled projects' profit freezes at FEE RESOLUTION (payment/write-off/waive), never at archive
  (the `projects_closed_needs_report` CHECK physically forbids cancelled→finished).

### 3.3 Anchored self-closures made at blueprint (Ishay may override any)

| # | Closure | Anchor |
|---|---|---|
| B-1 | **"דו"חות רלוונטיים" for מנהלת-פרויקטים (א11/R3-13, left open by the S1 card): she does NOT see S1/S2/S3.** | The live permission matrix (Ishay-ruled seed, PROJECT_MASTER §3): מנהלת-פרויקטים = ➖ on 'כספים'. Her feedback read stays in the m6 project card (㉞, built); her reports window is M11 (👁 on 'דו"חות') — carried by the EXISTING `🚧 מ11 ← מ8` §6 line (Discovery close). |
| B-2 | **S2 has no direct-URL exposure** (the card's §⑤ ⬜). | S2 is a dialog inside `/finance`, not a route — exactly m5's checklist-dialog pattern. `/finance` itself sits behind `<ProtectedRoute allow="כספים">`; a blocked role never reaches the click. |
| B-3 | **M11's read of m8 tables = M11 adds its own gated SELECT policies** (the ripples file's blind-spot #2). | The `email_log` forward-notice precedent (db_roadmap A-20): each consuming module ships its own module-gated policy; never widen m8's. |
| B-4 | **`salary_report_lines` snapshots identity+numbers, NOT bank details.** | Proof-of-what-was-sent (§7.68) is carried by the xlsx file in the private `finance` bucket; duplicating bank columns into a second table would re-open the ה19 exposure it just closed. Lines carry: hostess_id, name+ת"ז snapshot, source project, basis (actual/compensation), hours, rate, bonus, travel, line total. |
| B-5 | **xlsx generation happens in-browser via a new `xlsx` dependency; upload to bucket; base64-attach to mail.** | The `quotePdf.jsx` precedent (browser-built document → attach); ה4 mandates xlsx; no server runtime exists for file generation (Edge function only sends). |
| B-6 | **The feedback-token kill at archive = `feedback_token` set NULL** (token dies, page shows "הקישור אינו בתוקף"). | Simplest mechanism satisfying P3's "המתת טוקן"; the get-RPC's not-found answer already renders state ד'. A dead-flag column would add state with no reader. |
| B-7 | **`invoice_sent_at` is `timestamptz`.** | §7.56 (timestamptz only) — even though display is date-level, the stamp anchors "ימי איחור" and audit. |
| B-8 | **The uploaded invoice file's home = `project_finance.invoice_file_url`** (§7.38 deferred "עמודת URL לקובץ" to this build). | All m8-only artifacts live in the read-gated child (product-Q2's logic); the bucket's own 4 policies gate the file itself. |
| B-9 | **Tab membership for cancelled projects (the reader's derivation):** tab 1 = `cancelled` AND fee unresolved OR resolved-but-not-yet-billed; tab 2 = fee billed (`invoice_sent`) and unpaid; the row LEAVES the worklist at freeze (Q-4's moment); never tab 3. | product-Q1 verbatim: "מבוטל ב-1/2 לפי מצב-הפה עם תג 'בוטל', לעולם לא ב-3" + P1: "עם פתרונם השורה יורדת". |
| B-10 | **No invoice-number input field** — the dropzone's own filename is the only identity the system keeps. | §7.38 (the system never tracks invoice numbers) + the approved S2 drawing (dropzone only); `data-set.md §6`'s "שדה-קלט חופשי" is satisfied by the file-picker itself. |
| B-11 | **"קוד-הפקה ייחודי" (C5:472) = the report row's `report_id`, displayed in the Excel header; `period` is the uniqueness mechanism.** | ה9/§7.68 — the UNIQUE lives on `period`; C5's "code" needs a display identity, not a second key. |
| B-12 | **Change-list rows 5 and 13 of `m8-review-infra-ripples.md` are PRE-RULING snapshots** — product-Q2 (child table) and product-Q1+Q-3/Q-4 (cancelled freeze) override them. | The rulings are dated AFTER the list froze, same day; the register (`db_roadmap.md:352`) already carries the ruled shape. |
| B-13 | **ה22 extends to a FIFTH action, `record_write_off(project_id, reason)`** — the regular-project bad-debt writer. | ה22 ("ארבע פעולות") is a delegated-Claude ruling, reopenable without ceremony — and P3's Ishay-approved bad-debt path ("סגור ללא תשלום … סיבה-חובה") plus `data-set.md §4ב` (applying it to regular #15) REQUIRE a writer ה22's four don't contain. The rehearsal surfaced the two sources side by side; extension disclosed at approval. |
| B-14 | **The §7.20ב credit-note flag's trigger = a billed cancellation fee later waived or written off** (`cancelled AND invoice_sent AND (fee=0 OR written_off)`). | Measured: the live `cancel_project` refuses cancellation from `awaiting_invoice` onward — "cancelled after invoicing" cannot occur; the corrected-after-billing case is the flag's only reachable scenario. Display-only, per the ruling. |
| B-15 | **Feedback fields stay manager-editable (via the RPC) until archive** — including writes onto an already-`completed` row. | P2's phone path REQUIRES it (the public page writes `completed` with no reason; the manager adds the reason after the call — refusing completed-row writes would deadlock the <3 archive gate). P2's own words: "עד אז אין ארכוב". |
| B-16 | **Travel is stamped only where `actual_hours > 0`; "shifts" in the profit travel term = finally-approved rows with hours > 0.** | ה29's own rationale — the reimbursement covers a trip that HAPPENED; a no-show didn't travel. CPA-visible, so listed for Ishay's eye; anchor strong enough to close. |

### 3.4 🛑/🔵 Ishay's items — presented at blueprint approval (each anchored to its step)

**🛑 Must-rule-now — ✅ ALL FIVE RULED by Ishay, `26/08/2026 22:40`, his words: "מאשר את חמשתן
לפי ההמלצות" — each recommendation below is now THE ruling (cited as Q-N through the guide;
overridable by him like any ruling). The Q-notes on steps 3.1/3.2 and the Q-3/Q-4/Q-5
indirections in 1.5 now resolve to these texts:**

| # | Item | **The ruling (was: recommendation; approved as-is 26/08/2026)** | Anchored to |
|---|---|---|---|
| Q-1 | **S2's "ממתין לתשלום" state was never drawn** — no payment-date control exists on any approved surface, and "סגור ללא תשלום" is drawn only in the cancellation view while `data-set.md §4ב` applies it to a regular project (#15). **Manual feedback ENTRY is also undrawn** — view א' shows an already-entered score; the phone path (א24: score 1–5 entry) and the "לא ענה לסקר" action (א27) have no drawn control. **And the mirror gap (reviewer F-9): a BILLED cancellation has no drawn continuation** — view ג' carries fee controls only, while P1 routes the fee through invoice→payment. | A FOURTH S2 state completes the dialog: view א'-layout with the invoice block collapsed-done (file name + sent date), a `תאריך קבלת תשלום` date field + save, and "סגור ללא תשלום" available here too. Feedback block becomes state-dependent: no score yet ⇒ 1–5 entry (`RatingStars`) + "לא ענה לסקר" button; score<3 ⇒ the drawn reason+notes; resolved ⇒ the drawn tag view. **Cancelled continuation: after "שמור דמי-ביטול", view ג' gains the same invoice block, then the payment-date field — the P1 route, same controls, cancellation banner stays.** Each lands via the 🗣️ brief (a small mockup before code) — but the EXISTENCE of these controls is ruled here, not at build. | 3.2 |
| Q-2 | **No navigation path to S3** — S1 was approved explicitly without a header action button; S3's backdrop was deliberately not drawn. How the manager reaches salary-report generation is undefined. | A secondary `btn-outline` "הפקת דוח-שכר" in S1's header row (not a primary/filled action — doesn't contradict the one-primary-action rule; the history card sits on the same screen below, per the S3 mockup's own structure). | 3.1 · 3.3 |
| Q-3 | **The frozen-profit FORMULA for resolved-cancelled projects was never stated** (product-Q1 ruled only the WHEN — "ברגע פתרון-הפה"; P3 gestures "חיוב מול עלויות ≈ 0"). | `frozen_profit(cancelled) = cancellation_fee_final − Σ team-compensation (§7.16 rows) − Σ ordered/ready goods at frozen COST (the cost side of component ②)`. Waive ⇒ fee 0 ⇒ a real recorded loss (accrual truth); manual-services line has no cost tracking (declared boundary) so it adds revenue only. World anchor: accrual accounting — the P3 "חיוב מול עלויות" sentence, made computable. | 1.5 · 2.1 |
| Q-4 | **Freeze MOMENT for a billed cancellation fee** — product-Q1 says "פתרון-הפה (תשלום/חוב-אבוד/ויתור)"; a billed fee is only "resolved" at payment. | Freeze fires at: payment recorded (billed path) · write-off · waive — never at fee-save alone, never at archive (the CHECK forbids it anyway, T1). The row leaves the worklist at the same moment. | 1.5 |
| Q-5 | **Salary-collection population for an op-closed project (the rehearsal's "single most likely to build wrong"):** ה15 says "**כל** שורת-שיבוץ לא-חתומה" — read literally, `declined`/`released`/`approval_withdrawn` rows of a closed project also collect, each becoming a permanently-SIGNED ₪0.00 line in the CPA's document. Nothing pins it. | Collect-and-sign **`finally_approved` rows only** — the staff who actually worked; a declined invite carries no pay claim and must never be signed (signing is irreversible). Mirrors A-7 (the compensation side) and §7.19's own derivation. | 1.5 · 2.2 |

**🔵 String nods — ✅ ALL SIX APPROVED within the blueprint approval (Ishay, `26/08/2026 22:43`);
each row's recommendation is now the ruling, reopenable without ceremony:**

| # | Item | Recommendation | Anchored to |
|---|---|---|---|
| N-1 | **M1 + M2 mail SUBJECT lines** — drawn in the approved mockups but tagged "🎭 מהמוקאפ — לאישור" by their own authors (M1: "חשבונית מס/קבלה מ-REG-IN — <שם אירוע>" per `quoteEmailSubject` pattern; M2: "דוח שכר דיילות — <חודש> <שנה>") | lock as drawn | 2.3 (subject builders) |
| N-2 | **S4's new copy strings** (kicker "REG-IN · משוב על האירוע" · "איך היה האירוע?" · "געו בכוכב כדי לדרג" · placeholder · thank-you text) — drawn+approved as package, flagged "טרם נעולים" by the card | lock as drawn | 3.4 |
| N-3 | **S1 empty-state / filter strings** (the card's ⬜ list: "אין פרויקט התואם לסינון שבחרת", filter labels, "נקי סינון") | lock as drawn (feminine, m5's precedent for the same strings) | 3.1 |
| N-4 | **Zero-amount salary rows** — ה15's literal collection rule pulls #13-style rows (op-closed, `actual_hours=0`, i.e. finally-approved staff who ended with zero recorded hours) into the report as ₪0.00 lines; `data-set.md §5` flagged it and excluded them from the DISPLAYED table ("0.00 לא מוסיף מידע") without ruling. CPA-visible. | Sign them + record them in `salary_report_lines` (so they never re-collect and the proof is complete) but OMIT them from the xlsx body; the file's total is unchanged. Anchor: the data-set's own display choice. ⚠️ Reaches into Phase 1 (the 1.5 transaction signs) — an override here rewrites Migration E, not just the screen. | **1.5** · 2.2 · 3.3 |
| N-5 | **S4 network-fail state** — the approved card EXCLUDED it ("הבריף ביקש בדיוק ארבעה מצבים") while the design-contract's S4 row mandates the precedent's `saveFailed`+"נסי שוב" separation. Two approved sources, opposite readings. | Build it — a public page with no retry on a dropped connection silently loses the customer's feedback; behaviour (contract) over drawing-scope (card), the standing split rule. | 3.4 |
| N-6 | **Consequence check, not a question (reviewer O-1):** per your recorded rulings ("מבוטל … לעולם לא ב-3" + "עם פתרונם השורה יורדת"), a cancellation whose fee was paid/waived/written-off leaves the worklist entirely — "כמה גבינו מהביטול של הייטק גרופ?" has no on-screen answer until M11. | Accept for v1 (the worklist is a worklist; M11 is the history's home — the existing `🚧 מ11 ← מ8` contract). Flagged so the consequence is chosen, not discovered. | — |

### 3.5 Assumptions (spec-silent) — surfaced, never silently resolved

| # | Assumption | Why needed / the trap |
|---|---|---|
| A-1 | **S4 submit with no rating chosen:** "שלח" stays disabled until a star is picked (helper text under the stars). | Card §⑦ says no source defines it. Disabled-with-reason is the house pattern (FilterPill/disabled gate-note); an error-toast alternative would be the first public-page toast in the system. |
| A-2 | **S1 filter with from>to dates:** no error state — the filter simply yields the standard empty-after-filter state with "נקי סינון". | Card §⑦: no source defines filter validation. Building a validation UI the spec never asked for = invention. |
| A-3 | **S2 "הערות המנהלת" is editable while the clarification is being entered**, read-only after archive (view ב' locks everything). | The mockup shows it `readonly` only because #12's note was already filled (card §① flags the ambiguity). |
| A-4 | **Skeletons:** S1 table → `LoadingOrError skeleton={{variant:'table'}}`; S2/S3 dialogs → `fields`; S4 → the `PublicConfirmPage` Skeleton precedent. | Cards' §④ "not drawn" lists; the shared component is mandatory (src/CLAUDE.md). |
| A-5 | **`cancellation_fee_note` is a single free-text column** on `project_finance` (ה28's "הערת-פירוט"). | ה28 names "note" without a home; three-component breakdown is re-derived for display, never stored. |
| A-6 | **`released_from_status` CHECK ∈ the assignment-status set, nullable** (filled only for post-m8 cancellations; old cancelled rows stay NULL and yield no compensation — R4-F2's "new cancellations only"). | Without the CHECK a typo silently zeroes compensation. |
| A-7 | **Compensation population = rows whose `released_from_status = 'finally_approved'` only.** A pending/declined invite carries no commitment. | The approved S3 mockup's 4 compensation rows are exactly #14's finally-approved staff; ה24 sums "תעריפי 4 הדיילות"; A-15's uniqueness enforcement point is `finally_approved`. Money-visible ⇒ listed here for Ishay's eye, not decided silently. |
| A-8 | **Null planned hours (T7) behavior:** a compensation row whose project has NULL `final_start/end_time` is EXCLUDED from the auto-proposal and from salary collection, with a loud on-screen line ("לא ניתן לחשב פיצוי — חסרות שעות סופיות"), never a silent 0 and never a crash. | Spec §⑤6 defines only the write side ("שמירת-null מפורשת"); silent-zero is this module's cardinal sin (§4.3). |
| A-9 | **The "נדרשת חשבונית זיכוי" display flag (§7.20ב)** renders as a sub-line in S1's row + a note line in S2's cancellation view — wording locked at the 🗣️ brief. | Ruled display-only; drawn nowhere; smallest-footprint placement. |
| A-10 | **Default sort orders:** tab 2 by days-overdue desc (the drawn emphasis) · tab 1 by operational-close date asc (oldest debt first) · tab 3 by archive date desc. | Only tab 2's emphasis is drawn; the others follow "oldest actionable first" worklist logic. |

### 3.6 ⏳ Deferred (recorded; the phase door asks only if newly relevant)

| Item | Target |
|---|---|
| Travel AMOUNT vs CPA (§7.69 🟠) | before M10 |
| KPI quarter window (§7.37 remainder) | M7 |
| Payment reminders / dunning | M10 |
| PDF rendering of the salary report | future (spec §④ "פתוח בכוונה") |
| Report screens over m8's numbers | M11 (`🚧 מ11 ← מ8`) |

### 3.7 🔤 Locked UI strings — the build session copies, never re-derives

From the approved cards/mockups (byte-exact):
- Negative-feedback reasons (the live CHECK, 5 values): `איחור דיילות` · `תפקוד דיילות` ·
  `איכות תגים` · `ניהול לקוי` · `אחר`.
- Status labels (via `PROJECT_STATUS_TONES`, already live): `ממתין לחשבונית`(muted) ·
  `ממתין לתשלום`(muted) · `פרויקט הסתיים`(ok) · `בוטל`(dashed) · `ממתין לסגירה` for
  `event_finished` (⑲ — same label m6 shows).
- Bad-debt tag: `הסתיים — לא שולם`.
- Score tags (ה16): `מצוין`/`טוב`/`בינוני`/`טעון בירור` — **S1 format: label only, no number
  inside the tag** (cross-surface resolution #4).
- S4 public strings: `המשוב כבר התקבל, תודה` · `הקישור אינו בתוקף` (both quoted from
  processes-approved) + the N-2 strings once nodded.
- S2 gate notes: `חסום: יש לבחור קובץ — שליחה בלי חשבונית אינה אפשרית (כרטיס-P1).` ·
  the archive gate-note pattern (`🔒 חסום: … שער-הארכוב דורש גם תשלום וגם משוב-פתור`).
- S3 double-generation block: `דוח לחודש <חודש> <שנה> כבר הופק. נשלח ב-<תאריך> אל <מייל>. לא ניתן
  להפיק פעמיים אותו חודש …`.
- Error/empty states: `לא ניתן לטעון את הנתונים.` + `נסי שוב` (locked in
  `PermissionAwareEmpty`) · denied counter = `—` never `0`.
- Compensation rows in S3: bonus/travel cells show `—` not `0.00 ₪` (ה24/ה29 — not applicable ≠ zero).
- Attachment filename pattern: `<MM>_<YYYY>_Payroll_Report.xlsx` (month as NUMBER — resolution #5).

### 3.8 🔴 Ruling-coverage ledger — the decision-coverage back-check (denominator = the registry)

**Every ruling in `processes-approved.md` — ה1…ה30, the P1–P4 card rules, the review-wave
constraints (R4-F*/R3/R2/R1), the three product answers, and the reality register — maps to exactly
one of: an owning step · already-delivered · an explicit deferral · a not-a-build-item note.**
Walked ruling-by-ruling 26/08/2026:

| Rulings | Owner |
|---|---|
| ה1 (salary flow = m8; m11 view-only) | 1.2 + 3.3 (+ `🚧 מ11 ← מ8` for m11's view) |
| ה2 (revenue = preVat + Σ changes) · ה26 (cost from quote lines, logistics only for "הוזמן") | 2.1 (SSOT) · 1.5 (reader) · 4.2 (RC-6 mirror) |
| ה3 ("לא ענה" passes the archive gate) · ה5 (completed/no_response writers) | 1.5 (gate logic) · 3.2 (UI) |
| ה4 (xlsx only) | 2.2 (B-5) |
| ה6 (no weighting formula; §7.37 half) | not-a-build-item (deferral note 3.6) |
| ה7 (§7.19 derivation) | 2.2 |
| ה8 + §7.79↳ (metric populations) | 4.2 |
| ה9 + R4-F6 (document model + nullable sent_date + status) | 1.2 |
| ה10 (transition writers; archive = freeze+lock+token-kill) | 1.5 |
| ה11 (no resend button) | constraint on 3.2 (checked at 🎨 gate) |
| ה12 (status gate on all finance writes) | 1.5 |
| ה13 (bucket 10MB as-is) | already-delivered (bucket live) — consumed by 2.3 upload |
| ה14 (travel stamped per-shift at generation) | 1.2 + 2.2 |
| ה15 incl. the cancellation amendment (two salary sources) | 2.2 + 1.5 |
| ה16 (score tags/colors) | 2.1 + 3.1/3.2 |
| ה17 (goods cost base = planned qty) · ה18 (deviation, labor only) | 2.1 |
| ה19 (bank split) + R4-F13 (5 sites + NOT NULL drop + LEFT join) | 1.3 |
| ה20 (seed 22.60) · R2-F4 (`תנאי_תשלום_ימים` seed) | 1.7 |
| ה21 (freeze framework — m8's window) | 1.5 |
| ה22 (4-way RPC split + explicit drop) | 1.5 |
| ה23 ("מחיר מלא" = closing_unit_price) · ה24 (§7.16 scale mirror) · ה25 (cancel_type mapping; `other` ⇒ manual) · ה29 (no travel in compensation rows) | 2.1 (fee SSOT) · 3.2 (display) · 2.2 (salary rows) |
| ה27 (expected-profit formula; "טרם שובצו" marker) | 2.1 |
| ה28 (store final amount + note only; components re-derived) | 1.1 (columns) · 1.5 (write) · 3.2 (display) |
| ה30 (cost-read tightening) | 1.1 (policy migration rider) |
| product-Q1 (cancelled in reports; freeze at fee resolution) | 1.5 + 4.2 |
| product-Q2 (`project_finance` child) | 1.1 |
| product-Q3 (scope changes at list price; down-before-order = full credit — already built) | already-delivered (m6) — regression only, 4.4 |
| P1 card ("שמור ושלח" file-gate · mail-fail ⇒ not marked sent · no billing mail ⇒ blocked with pointer · fee flag in tab · waive = explicit) | 1.5 + 2.3 + 3.2 |
| P2 card (public flow · <3 gate · dorse-after-no_response · token life) | 1.5 + 1.6 + 3.4 |
| P3 card (balance view · dual gate · confirm dialog · lock · bad-debt path) | 1.5 + 3.2 |
| P4 card (unsigned-rows collection · one transaction · fail-states · history+resend) | 1.2 + 1.5 + 2.2 + 3.3 |
| R4-F1/F5 (DEFINER readers for logistics + salary flow) | 1.5 |
| R4-F2 (`released_from_status` + cancel_project extension + nullable planned hours) | 1.1 + 1.7 |
| R4-F9 (fail-loud revenue guard) | 2.1 |
| R4-F11 (lazy token mint; `sent` timing unchanged) | 1.6 + 4.1 |
| R4-F12 (email_log 2 values + policy + order) | 1.4 |
| R4-F15 (status machine doesn't fight; salary write moves no status — regression test) | 4.4 |
| R4-F16/R1-4 (ONE revenue number; new m8 reader; "רווח הצעה" ≠ "רווח פרויקט") | 1.5 + 2.1 + 3.1 |
| R3 rows (billing mail = customers.email · xlsx in `pdf_base64` field + live delivery test · thresholds = ה16 colors) | 2.3 + 5.1 |
| R4-F8 (metrics wiring is size-M, mapped) | 4.2 |
| Cross-surface resolutions #1–#6 (finished-row click → S2 locked · icons · MOCKUP-META banners/mail shells · tag format · filename) | 3.1–3.4 (build constraints) |
| R3-10 (signed-sum convention) · R3-13/א11 ("דו"חות רלוונטיים") | 1.5/2.1 (the sum) · B-1 (the resolution) — own rows added per the reviewer's nit |
| Reality register (`מסלולים שנשללו`) | **empty — nothing to map** (verified 26/08) |

---

## 4. 🛡️ Security & Auth Model Statement (iron rule 9)

### 4.1 Policy table — exact `module_name` strings

| Table | Policy | Gate |
|---|---|---|
| `project_finance` | SELECT | `module_name = 'כספים'`, level `edit`/`view`, §7.21 template with `(select …)` wrap |
| `project_finance` | writes | **none — RPC only** (DEFINER archive/fee actions) |
| `salary_reports` + `salary_report_lines` | SELECT | `'כספים'` (opens today's deny-all) |
| `salary_reports` + `salary_report_lines` | writes | **none — RPC only** (generation transaction) |
| `hostess_bank_details` | ALL | `'דיילות'` level `edit` (m4's form keeps working) |
| `hostess_bank_details` | SELECT (2nd policy) | `'כספים'` level `edit` (the salary report) |
| `quote_services` (ה30 rider) | SELECT narrowed | cost read = `edit` on 'הצעות מחיר' OR 'כספים' — the exact `product_costs` split precedent; **the tightening is a policy change on an m3 table: regression-test m3's quote screens after apply** |

### 4.2 The RPC layer (why policies alone are not the model)

Finance is **blocked** on 'לוגיסטיקה' and 'דיילות' at Ishay's matrix — and RLS returns `[]` with
`error: null` for blocked reads (the project's central silent failure). Therefore EVERY read the
money math needs from those tables, and every salary write, runs in SECURITY DEFINER RPCs that
assert `'כספים'` via `assert_module_permission` (m6's live helper):
- `record_invoice_sent(project_id, file_url)` — stamps `invoice_sent`, `invoice_sent_at`; gate ה12.
- `record_payment(project_id, payment_date)`.
- `record_feedback(project_id, score, reason, notes | mark_no_response)` — enforces the <3-requires-
  reason CHECK path; writes `completed`/`no_response` (ה5).
- `archive_project(project_id)` — dual gate (payment OR `written_off`) AND feedback resolved; one
  transaction: compute+freeze `final_profit` ₪ → `project_status='finished'` → kill token. Refusals
  are Hebrew `P0001` messages (the `SERVER_MESSAGE_RULES` contract pattern — the exact strings are
  the builder's, matched in the UI mapper).
- `resolve_cancellation_fee(project_id, amount, note | waive | write_off)` — persists ה28's pair,
  freezes cancelled-profit at resolution (product-Q1); `written_off` branch shared with the
  bad-debt path.
- `get_finance_overview()` / `get_project_finance_detail(project_id)` — DEFINER readers producing
  S1 rows and S2's balance (revenue incl. scope changes, goods via logistics check, labor from
  assignments) so ONE revenue number feeds every surface (F16). Fail-loud: any unreadable component
  ⇒ raise, never a partial sum (R4-F9).
- `generate_salary_report(period)` — the P4 transaction; returns the line data; the client builds
  xlsx, uploads, then `finalize_salary_report(report_id, file_url, status)` records the file and
  send outcome (`sent`/`failed` — R4-F6's status column; resend keeps the report row).
- Public pair: `get_feedback_page(token)` / `submit_feedback(token, score, notes)` — anon-
  executable, generic single not-found answer, one-submission rule with the dorse-after-
  `no_response` exception (P2), rate-limited by the `login_rpc_calls` counter pattern (§7.45's
  lesson — the /shift precedent shipped WITHOUT rate limiting and logged it as a known gap; m8
  does not repeat it). `revoke from public, anon, authenticated` + explicit grants, per the
  migrations/CLAUDE.md mine.
- Token mint `mint_feedback_token(project_id)` — get-or-create, called by m6's mail path (4.1),
  gated 'פרויקטים' (the sender's module), NOT 'כספים'.

### 4.3 The silent-zero doctrine (this module's core risk)

A wrong number here is not a crash — it is a smaller invoice or an inflated profit, silent.
Defenses, in order: hand-computed anchors as test oracles (§③3: 3,650.00 · 3,508.00 · 292.60 ·
69% · 620.60/598.00) — tests are written TO these numbers, never re-derived from code · fail-loud
readers (R4-F9) · `—` vs `0` discipline (a blocked/missing value never renders as zero) · the
`.select()`+row-count rule on every write (src/CLAUDE.md) · positive controls before every
negative RLS proof.

### 4.4 UI gates

`/finance` behind `<ProtectedRoute allow="כספים">` (route-guard test `App.routes.test.jsx` will
enforce). `/feedback/:token` deliberately OUTSIDE `MainLayout` + ProtectedRoute (the `/shift/:token`
precedent; the routes-guard test's public exceptions list gains this route — extend the test's
allowlist consciously, not silently).

### 4.5 Declared limitations

① No payment reminders/interest (§7.20א — M10). ② Invoice numbering/identity lives in the external
accounting software (§7.38); the file name is free input. ③ Travel amount is demo-grade until CPA
verification (§7.69 🟠). ④ A feedback-token holder can re-read the event name/date until archive
(same exposure model as `get_shift_invite`; token dies at archive; rate-limited). ⑤ Old cancelled
projects (pre-m8) have NULL `released_from_status` ⇒ no compensation rows — R4-F2's "new
cancellations only", stated to Ishay. ⑥ The salary xlsx contains bank details by design — it
travels by mail to the CPA (the business requirement); system-side exposure is what ה19 closes.
⑦ `feedback_token` lives on `projects`, readable by every 'פרויקטים' view/edit holder — internal
staff could open a customer's feedback link (the `invite_token` trust class, one ring wider;
rehearsal observation). Accepted: internal tool, five trained users; revisit only if a real misuse
is ever observed.

---

## 5. 🗡️ DB Design Challenge (mandatory output — one line per sub-check, including "אין ממצאים")

| Sub-check | Examined | Finding |
|---|---|---|
| Keys & mutability | `project_finance` PK=`project_id` (1:1 child, FK cascade-restrict) · `salary_report_lines` identity PK + FK to report · `hostess_bank_details` PK=`hostess_id` (1:1 child) · `feedback_token` unique, crypto-random (`gen_random_uuid()`, the invite_token precedent) | אין ממצאים — all follow §7.64's surrogate policy; no PII in any key |
| Relationships & lineage | every salary line → its `assignment` rows via the signature FK; every fee → its frozen inputs (`cancelled_at`, logistics statuses, the scale params) re-derivable; scope-change revenue via `project_changes` signed sum | ה28 deliberately stores the RESULT (amount+note), not the derivation — recorded, Ishay-ruled |
| Lifecycle | `awaiting_invoice → awaiting_payment → finished` had NO writer (ג9) — the four RPCs are now the only writers; `cancelled` never transitions (fee resolution is columnar, not a status); locked states DB-enforced (ה12 gates + the archive lock refusing further writes) | **the lock after `finished` must live in the RPCs' preconditions (m6's ㉙ pattern), not in a trigger** — stated in 1.5 |
| Screen-to-column audit | walked S1/S2/S3/S4+M1/M2 cards §③ ("מקור לכל מספר") against the schema + new columns | **every displayed figure has a named home**; the two that had none — `תנאי_תשלום_ימים` (param, unseeded) and `cancellation_fee`/`final_profit`/`written_off` (no columns) — are exactly migrations G and A |
| 🔮 Answerable-later | (א) overwritten-instead-of-accumulated: re-sending a failed salary mail keeps one report row + `email_log` appends — covered; invoice RE-upload overwrites the file pointer — the old file stays in the bucket unreferenced, accepted (no re-send flow in v1) · (ב) when-questions: `invoice_sent_at` (new) · `payment_date` · archive time = `updated_at`? — **`project_finance.archived_at` added (one line in migration A)** so "how long from invoice to archive" stays computable · (ג) join-back keys: salary lines keyed by report+hostess+project — reports can join everything | one added column (`archived_at`), zero cost |
| Derived-vs-stored coherence | frozen: `final_profit` (archive/resolution) · `cancellation_fee` (resolution) · salary lines (generation) · travel stamp (generation). Live-derived: expected profit · days overdue · % display · fee components display | matches §7.78's three-window framework exactly; no fourth freeze |
| Permissions↔RLS mapping | m8 writes on `projects`/`assignments` (m6/m4-owned tables) — all via 'כספים'-gated DEFINER RPCs (§7.63) | אין ממצאים — the ruled pattern, no new table-split needed beyond the two ruled ones |
| Files/Storage | `finance` bucket live (private, 10MB, 4 policies); invoices + salary files; download-and-attach | אין ממצאים |
| Temporal columns | all new time columns `timestamptz` (B-7); `period` stored as `date` (first-of-month) with UNIQUE — unambiguous ordering + native month math | אין ממצאים |
| Migration checklist (db_roadmap §1) | embedded per step below; advisors run after every apply | אין ממצאים |
| Known reference-spec defects (§9) | #4 (two cancel-reason fields): live 3-value `cancel_type` + free-text `cancel_reason` are canonical; C6's 2-value enum is superseded — ה25 maps them; **no reconciliation migration needed** | recorded so nobody "fixes" the C6 shape back |

---

## 6. 🏗️ Phase & Step Plan

### Model & effort per phase

| Phase | Model | Effort | Why |
|---|---|---|---|
| 1 — DB | Opus/Fable | High | ~7 migrations incl. a PII table split with a coupled client rewire, a rewrite of a merged m6 RPC, a public anon-writable RPC pair, and the module's whole authorization model |
| 2 — logic | Opus/Fable | High | every formula is money; anchors must reproduce digit-for-digit |
| 3 — UI | Opus/Fable | Medium | 4 surfaces, all drawn and approved — fidelity + states |
| 4 — ripples & integration | Opus/Fable | Medium | touches merged m6+m2 code + their tests; E2E authoring |
| 5 — closing audit | Opus/Fable | High | independent re-verification in a fresh session |

**Agent-batching — a RECOMMENDATION the build session OFFERS Ishay at each phase door, never a
decided default** *(his standing ruling, 26/08: "צבא-סוכנים = שאלה אליך בכל משימה מתאימה, עם
המלצה — ואתה בוחר יעיל או חסכוני; לעולם לא ברירת-מחדל" — the fresh-context reviewer caught this
block reading as pre-decided)*: the recommendation to offer — Phase 1 = ONE session, sequential
(typed-echo gates serialize; agents may draft SQL). Phase 2 = one workflow (2.1+2.2 parallel, then
2.3, adversarial read-only panel after — m5's pattern). Phase 3 = build agents per surface +
adversarial panel, then 3.5. Phase 4 = two agents (4.1+4.2 ‖ 4.4-prep). Phase 5 = fresh session.
Each dispatch carries an explicit reading list (mandatory + not-sure-needed) and the verbatim
conflict-question rule.

**Global conventions for every step below**
- **Seven fields per build-unit step:** Goal in the title · **Files** · **What to do** ·
  **🔻 Verify** (command + expected output) · 🤖/👤 · **`מה ייחשב עובד`** (quoted from the approved
  spec, never re-authored) · empty **`🗣️ אושר —`** slot · plus the **`🌊 אדוות —`** slot (closed
  with ripples or `אין` before the step closes).
- `⚠️ shared-surface` steps: grep every other OPEN micro-guide for the file first; shape changes
  additively.
- Hebrew why-first code comments (iron rule 3). Baseline before Phase 1: `npm run test:run` —
  record the live passing count; every later step compares against it.
- **DB steps embed the Migration Design Checklist (db_roadmap §1) and end with a Supabase advisors
  run** (zero new findings or a written triage note). Typed-echo before every apply. After every
  apply: schema.sql refresh by catalog queries + same-commit rule.
- 🔴 Run gates without a pipe or with `set -o pipefail`.
- 🔴 Any `CREATE OR REPLACE` on an existing function starts from live `pg_get_functiondef`.

---

### Phase 1 — DB

> 🛑 **Phase-1 blocker table — everything the plan ASSUMES possible that a live lock/constraint
> forbids or constrains. Seeded at blueprint from measured facts; the execution rehearsal extends
> it; Phase 1 does not open until every row is closed into its owning step:**
>
> | # | The trap | Owning step |
> |---|---|---|
> | T1 | `projects_closed_needs_report` CHECK **physically blocks** cancelled→`finished` ⇒ cancelled-profit freezes at FEE RESOLUTION, never via archive. 🔴 **↳ Wording corrected 27/08/2026 at step 1.0 — the live constraint does not mention `cancelled` at all.** Measured body: `CHECK ((project_status <> ALL (ARRAY['awaiting_invoice','awaiting_payment','finished'])) OR (summary_report_url IS NOT NULL))`. **What it really enforces: you cannot enter ANY of those three statuses while `summary_report_url IS NULL`.** The conclusion is unchanged — a cancelled project never went through the operational close, so it has no summary URL and `finished` is unreachable — but the **mechanism** matters for 1.5: `archive_project`'s real precondition is **`summary_report_url IS NOT NULL`**, so it must assert that itself and refuse with the Hebrew `P0001` contract, or a legitimate archive fails with a raw CHECK error instead of a spoken message. Verified against the live cast the same turn: **#12 (`awaiting_invoice`) has the URL ⇒ m6's operational close does set it**; #13/#14/#15 do not yet | 1.5 |
> | T2 | §7.50's lock trigger raises on ANY quotes/quote_services row UPDATE ⇒ m8 only READS quote rows; ה30 is a policy (DDL), not a row write | 1.1 |
> | T3 | `hostesses.bank_*` are NOT NULL ⇒ the split migration must copy-then-drop in ONE migration, and the client rewire lands in the SAME step, or every new-hostess save breaks in the window | 1.3 |
> | T4 | `salary_reports.sent_date`/`report_file_url` are NOT NULL today ⇒ relax to nullable FIRST (same migration B) or the generation transaction cannot insert before the file exists | 1.2 |
> | T5 | `email_log` CHECK rejects `invoice`/`salary_report` until migration D ⇒ migration BEFORE `send-email` deploy; reverse order = mail out, journal silently failing | 1.4 |
> | T6 | `cancel_type` live values are `customer/force_majeure/other` — NOT C6's `standard` (defect §9#4) ⇒ ה25's mapping uses the live values | 1.5 · 2.1 |
> | T7 | `final_start_time`/`final_end_time` are nullable ⇒ planned-hours derivation carries an explicit null guard (compensation shows "—"+flag, never crashes or invents hours) | 1.5 · 2.2 |
> | T8 | new-function grants: `revoke … from public` alone leaves `anon` EXECUTE ⇒ `from public, anon, authenticated` + verify `proacl` | 1.5 · 1.6 |
> | T9 | `moddatetime` lives in `extensions` schema; `public.moddatetime` is broken SQL | 1.1 · 1.2 |
> | T10 | `recompute_project_status` measured NOT to fight `awaiting_*`→`finished` writes (R4-F15) — trust the measurement, but the regression test that proves salary writes move no status is mandatory | 4.4 |
> | T11 | MCP was unauthenticated at blueprint time ⇒ 1.0 re-verifies MCP live before anything. ✅ **CLOSED 27/08/2026 12:4X** — MCP answered live (PostgreSQL 17.6); all of §2.9's dated-26/08 claims were re-measured at 1.0 and **every one held** | 1.0 ✅ |
> | T12 | `feedback_status` transition to `completed` must also work from `no_response` (the dorse rule) — the CHECK allows it; the RPC logic must not block it | 1.5 · 1.6 |
> | T13 | Change-list rows 5+13 (`m8-review-infra-ripples.md`) predate the same-day product rulings — the ruled shapes (child table · Q-3/Q-4 freeze) override them (B-12); do not "restore" the projects-columns version | 1.1 · 1.5 |
> | T14 | **The `/shift/:token` "precedent" has NO rate limiter** (measured — §6's `🚧 מ12 ← מ4` row records it as a known gap). The only live rate-limit precedent is module-1's `login_rpc_calls` counter (15/IP/hour). The spec's pointer means "the §7.45 LESSON", not "copy the shift RPC" | 1.6 |
> | T15 | *(rehearsal G-9→Q-5)* Which assignment rows of an op-closed project COLLECT-AND-SIGN in the salary report is unstated in ה15/P4 — signing is the irreversible double-pay proof. Ruled at Q-5; the collection filter implements his answer | 1.5 · 2.2 |
> | T16 | *(rehearsal G-11→B-13)* ה22's "four actions" omit the regular-project bad-debt writer P3 approved — a FIFTH action `record_write_off` extends the delegated ruling (disclosed; ה22 is reopenable-without-ceremony) | 1.5 |
> | T17 | *(rehearsal G-13→B-15)* The <3 phone-reason path REQUIRES writing to an already-`completed` row — refusing writes on `completed` deadlocks the archive gate. Feedback fields stay manager-editable until archive | 1.5 |
> | T18 | *(rehearsal G-12→B-14)* The live `cancel_project` REFUSES cancellation from `awaiting_invoice` onward ⇒ "cancelled after invoice" is unreachable; the §7.20ב flag's only real trigger is a billed fee later waived/written-off | 1.5 · 3.1 |
> | T19 | *(rehearsal G-4/G-5)* `salary_report_lines` FKs = RESTRICT everywhere (payroll evidence — the nearest precedent's CASCADE would delete it) · `period` carries a first-of-month CHECK (a mid-month date would silently split a month into two "periods" past the UNIQUE) | 1.2 |
> | T20 | *(rehearsal G-3/G-8)* Policy levels stated: salary tables + email_log 4th policy = `edit\|view` on 'כספים' (matches `project_finance` + the three existing email_log policies) | 1.2 · 1.4 |
> | T21 | *(rehearsal G-10/G-14→B-16)* Travel is stamped/counted ONLY where `actual_hours > 0` — a no-show didn't travel (ה29's own rationale); "shifts" in the profit travel term = finally-approved rows with hours > 0 | 1.5 · 2.1 |
> | T22 | *(rehearsal G-18)* `תנאי_תשלום_ימים` seeds with `param_type='pricing_timing'` (the type of `סכום_נסיעות_למשמרת`, the closest money-mechanics param). ⚠️ `products_and_params.md` carries NEITHER new param — §2.8's pointer to it answers the enum only, not these names | 1.7 |

**Step 1.0 · 🔻👤 Phase door — branch, sweep, re-measure, and the Ishay checkpoint**
*(Retagged 🤖→👤 by the execution rehearsal — its top finding: three of this door's own duties are
Ishay-interactions, and the 🤖 legend would have sent a zero-memory session past them alone.)*
**🤖 half (measurements, self-verified):** verify m5 merged (`git fetch origin` +
`git merge-base --is-ancestor` on the m5 branch vs `origin/dev`; the discriminator
`git log origin/dev..HEAD` per iron rule 10's caveat) · cut `ishay/module-8-finance` from fresh
`origin/dev` · verify `docs/specs/module_08_finance/` exists on the new branch · verify Supabase
MCP live (T11) · re-measure live: `salary_reports` still deny-all+minimal ·
`set_project_finance_fields` still 0 call sites · bank columns still on `hostesses` · `email_log`
CHECK still 4 values · `params` still missing `תנאי_תשלום_ימים` · the statuses of the 4 demo
projects **#12–#15** (the `data-set.md` cast — named here so nobody re-measures the wrong rows) —
**if anything moved since 26/08, update this guide first** · count existing `E2E_*` pairs (§2.7) ·
record the unit baseline count.
**👤 half (the door does NOT open without it):** ① if `E2E_FINANCE_*` is absent — raise to Ishay
(creating a login is his) · ② OFFER the phase's agent-batching recommendation (his standing 26/08
ruling — he picks efficient vs economical, never a default) · ③ sweep §3.4/§3.5/§3.6 for items
anchored to Phase 1 and settle any still-open one with him (Q-3/Q-4/Q-5 and N-4 are anchored HERE —
normally ruled at blueprint approval; re-ask only if still open) — §9(h).
**🔻👤 Verify:** the measurements reported + Ishay's checkpoint answered.

**↳ as-built · the 🤖 half, run `27/08/2026 12:39–12:4X` (every row a same-turn measurement):**

| # | Checked | Result |
|---|---|---|
| — | m5 merged | ✅ `merge-base --is-ancestor origin/ishay/module-5-logistics origin/dev` ⇒ yes; discriminator `git log origin/dev..origin/ishay/module-5-logistics` ⇒ **empty** |
| — | branch cut | ✅ `ishay/module-8-finance` from `origin/dev` = `585ad27`; `git log origin/dev..HEAD` ⇒ empty (**fresh**, not dead) |
| — | spec on branch | ✅ `docs/specs/module_08_finance/spec.md` + `docs/micro_guides/module-8.md` both present |
| T11 | Supabase MCP live | ✅ `select current_database(), version()` ⇒ `postgres`, **PostgreSQL 17.6** — T11 CLOSED |
| — | `salary_reports` deny-all + minimal | ✅ RLS on, **0 policies**; columns = `report_id`, `sent_date`/NN, `report_file_url`/NN, `created_at`, `updated_at` (**T4 confirmed live**); `salary_report_lines` absent |
| — | `set_project_finance_fields` | ✅ **0 call sites** (`grep -rn` over `src/ e2e/ supabase/functions/`); live signature still the 6-arg `(integer,boolean,date,integer,text,text)` |
| — | bank columns on `hostesses` | ✅ `bank_account`/NN · `bank_branch`/NN · `bank_name`/NN — **all three NOT NULL (T3 confirmed)**; `hostess_bank_details` absent |
| — | `email_log` CHECK | ✅ still **4 values** (`quote`,`shift`,`project`,`project_report`) + 3 SELECT policies (m8 adds the 4th) — **T5 confirmed** |
| — | `params` | ✅ `תנאי_תשלום_ימים` **absent**; `סכום_נסיעות_למשמרת` present at **0** (ה20 seeds it to 22.60) |
| — | `project_finance` | ✅ absent (nothing pre-exists) |
| — | demo cast #12–#15 | ✅ **unchanged from `data-set.md`**: #12 `awaiting_invoice` (🌱) · #13 `event_finished` · #14 `in_progress` (its cancellation is 🎭 demo-only, exactly as the data-set states) · #15 `in_progress`. No drift since 26/08 |
| — | `E2E_*` pairs | ✅ **five pairs** in `.env.local`: CEO · **FINANCE** · PROJECTS · RECRUIT · STAFF. **`E2E_FINANCE_*` EXISTS** ⇒ the 👤 item ① does not fire (§2.7's "not configured" note was stale — corrected there). ⚠️ *Presence ≠ a working login; the credential itself is first exercised at 4.4/5.1.* `E2E_LOGISTICS_*` is referenced only inside a deleted-variant comment (`e2e/customers.spec.js:152`) — not a gap |
| — | unit baseline | ✅ `npm run test:run` (no pipe) ⇒ **exit 0 · 56 files · 1,440 tests passed**. Every later step compares against **1,440/56** |
| — | `finance` bucket (§2.5's dated claim, not on the door's list — checked anyway) | ✅ live: private, `file_size_limit`=10,485,760, **4 policies**, **0 objects** |
| — | live CHECKs backing §3.7's locked strings | ✅ `negative_feedback_reason` = the five strings **byte-exact** · `cancel_type` = `customer`/`force_majeure`/`other` (**T6 confirmed**, C6's `standard` really is superseded) |
| — | cross-module collision (§2.3) | ✅ no other micro-guide is live-OPEN; m5 is merged. **One stale row found, NOT fixed here** (another module's surface): `module-5.md`'s **Active step** and **Branch** rows still read "pending typed-echo" / "NOT merged" while its own Status row says MERGED — reported to Ishay, his call |

**🔻🤖 door measurements: PASS** — nothing moved since 26/08, so no pre-emptive guide rewrite was needed.
**↳ as-built · the 👤 half, answered by Ishay `27/08/2026 12:5X`:**
- **① `E2E_FINANCE_*`** — did not fire; the pair exists (measured above).
- **② Agent-batching** — offered per his 26/08 standing ruling; **he chose `חסכוני` — ONE session,
  sequential.** Matches this guide's own Phase-1 recommendation (typed-echo gates serialize the work
  and no agent can apply a migration).
- **③ Phase-1 ledger sweep (§3.4/§3.5/§3.6) — result: ZERO still-open items.** Anchored to Phase 1:
  **Q-3 · Q-4 · Q-5** (all → 1.5) and **N-4** (→ 1.5) — all four ruled at blueprint approval
  26/08 22:40–22:43, so per the door's own instruction they were NOT re-asked. §3.5's Phase-1
  assumptions **A-5 · A-6 · A-7 · A-8** were re-shown to Ishay for his eye (A-7 and A-8 are the
  money-visible pair) with no action requested; none overridden. §3.6 holds nothing newly relevant
  to Phase 1 (§7.69's travel AMOUNT stays deferred; 1.7 seeds the demo-grade 22.60 as ruled).
- **④ 🔴 The presentation-risk item (§10, this date) — RULED BY ISHAY: `הכל היום, כרגיל`.** The
  concern was raised with its anchor (`00_roadmap.md` §3 row א׳ / §4 row M2.5, 28/08 = tomorrow) and
  the recommendation was the safe split; **he reaffirmed the full plan and that is the decision.**
  Phase 1 runs complete, in plan order. **The one thing this adds to the plan:** each of the four
  migrations that touch live merged code (**the ה30 rider in 1.1 · 1.3 · 1.4 · 1.7**) gets its
  targeted regression run and REPORTED before the next step opens — the steps already carry those
  checks; this makes "no silent progression past a red one" explicit.

**🔻👤 door: CLOSED.** **🌊 אדוות —** §1 header (Branch · Status · Last-updated · Active-step) + step-table row · §2.7 (stale `E2E_FINANCE` note) · 🛑 T1 (the CHECK's real text) + T11 (closed) · §10 dated entry ×2. **No DoD checkbox and no Ledger row moved** — 1.0 implements no ruling and delivers no code.
**🗣️ אושר —** `27/08/2026 12:5X` (Ishay: `הכל היום, כרגיל` + `חסכוני — סשן אחד`).

**Step 1.1 · Migration A — `module8_finance_tables_and_columns`**
**Files:** `supabase/migrations/<ts>_module8_finance_tables_and_columns.sql`
**What to do (one migration, Hebrew why-header):**
1. `create table project_finance` — `project_id int PK references projects on delete restrict` ·
   `final_profit numeric(12,2)` · `cancellation_fee numeric(12,2)` · `cancellation_fee_note text` ·
   `written_off boolean not null default false` · `written_off_reason text` (P3's "וידוא +
   סיבה-חובה" — the RPC enforces non-empty when writing off) · `invoice_file_url text` (B-8) ·
   `archived_at timestamptz` · timestamps + `extensions.moddatetime` trigger · RLS on · ONE SELECT
   policy gated `'כספים'` (§7.21 template, `(select …)` wrap) · **no write policy**.
2. `projects`: `add column invoice_sent_at timestamptz` · `add column feedback_token text unique`.
3. `assignments`: `add column released_from_status text` + CHECK (∈ the six status values, nullable)
   (A-6) · `create index assignments_salary_report_id_idx` (closes C-1's **m8 row** — two other
   C-1 FKs remain open, owned by other modules' first-touch).
4. ה30 rider: narrow the cost read on `quote_services` — replace the SELECT policy so row access =
   `edit` on 'הצעות מחיר' OR `edit` on 'כספים'. **The ruled shape lives in `PROJECT_MASTER.md` §6
   (the struck `~~🚧 מ8 · 🚧 מ9~~` line) + `processes-approved.md` ה30 — NOT in db_roadmap (the
   draft's first pointer was false; measured `grep "ה30" db_roadmap.md` → 0).** ⚠️ RLS is
   row-level, so "שאר העמודות ללא שינוי" cannot be literal: the tightening removes WHOLE-ROW access
   from any future view-only-quotes role. Today the only view-holder on quotes is the finance
   manager, who qualifies via the 'כספים' OR-branch ⇒ zero live loss — state exactly this in the
   migration's why-header so a future role-grant isn't surprised.
**🔻👤 Typed-echo gate, then apply via MCP.**
**🔻🤖 Verify:** `pg_policies` on `project_finance` = exactly 1 · impersonated SELECT: finance ⇒
allowed (positive control), logistics-manager ⇒ 0 rows · direct client UPDATE on `project_finance`
⇒ 0 rows (`.select()` count) · columns exist with right types · **ה30 regression on BOTH personas
(the reviewer's contrarian catch — the draft's first version tested only the wrong one):**
‏מנהלת כספים (the only view-on-quotes role — her access CHANNEL is what changes) still reads
`quote_services` rows incl. cost ≥1 row via the OR-branch, AND מנהלת פרויקטים (edit) still reads —
positive controls both; a role with neither ⇒ 0 rows · advisors: no new findings.
**מה ייחשב עובד** *(spec §⑤2/§⑤8, quoted)*: the columns exist for P1/P3/S4's data; nothing
user-visible yet.

**↳ as-built · APPLIED `27/08/2026 12:5X`** — file
`supabase/migrations/20260827125155_module8_finance_tables_and_columns.sql`; typed-echo received
(`module8_finance_tables_and_columns`). **Built exactly as planned — no deviation.**
**🔻🤖 Verify — every assertion of this step, measured:**

| Assertion | Measured |
|---|---|
| `pg_policies` on `project_finance` = exactly 1 | **1** ✅ |
| SELECT — finance (POSITIVE CONTROL first) | **1 row** ✅ *(a seeded probe row; without it a 0-vs-0 result proves nothing — §2.7)* |
| SELECT — logistics-manager / projects-manager | **0 / 0** ✅ |
| direct client UPDATE on `project_finance` (as finance) | **0 rows** ✅ — the RPC-only model holds at the DB, not only in the UI |
| columns + types | ✅ money = `numeric(12,2)` (§7.74), all times `timestamptz` (§7.56), 4 constraints present, `assignments_salary_report_id_idx` created |
| `moddatetime` binding (T9) | **`extensions.moddatetime`** ✅ — verified through `pg_trigger→pg_proc→pg_namespace`, **not** by grepping `pg_get_triggerdef`, which prints the name unqualified (the documented sub-mine in `supabase/migrations/CLAUDE.md`) |
| **ה30 regression, BOTH personas** (the contrarian catch) | מנהלת כספים **44** rows incl. **44** cost-bearing — she still reads cost, now via the 'כספים' OR-branch · מנהלת פרויקטים (edit) **44** · מנהלת גיוס (neither) **0** ✅ |
| advisors | **26 findings = the m5 baseline of 26. Zero new.** `project_finance` absent from `rls_enabled_no_policy` ✅ |
| probe cleanup | `project_finance` left at **0 rows** ✅ |

🔴 **Said out loud, per the standing rule: this step changed a policy on a MERGED m3 table**
(`quote_services`). Before writing the SQL, all five roles were measured against the live
permissions matrix ⇒ **zero live loss**: the only `view`-on-quotes holder today is מנהלת כספים,
and she qualifies through `edit` on 'כספים'. A FUTURE view-only-quotes role would read zero
`quote_services` rows — **intended, and written into the migration's why-header** so a later
role-grant is not surprised by it.

**🌊 אדוות —** `docs/db_roadmap.md` §10 (⏳→✅ Done row, with the C-1 caveat that two FKs stay open) ·
`docs/schema.sql` (new §27 `project_finance` block · `projects` +2 cols +unique · `assignments`
+col +CHECK +index · the `quote_services` policy body · header counts 23→24 tables, 49→50 policies,
and the §24 heading 25→26 functions — **the last one was stale before this session**, found while
cross-checking) · §1 header + step table. **No `🚧` token created or consumed** — m8 creates zero
new tokens (§2.2), and the inbound ones are marked paid at 4.3, not here. **No DoD checkbox moved**
— none of §8's checkboxes counts migrations.
**🗣️ אושר —** typed-echo `27/08/2026 12:5X`.

**Step 1.2 · Migration B — `module8_salary_report_document_model`**
**Files:** `supabase/migrations/<ts>_module8_salary_report_document_model.sql`
**What to do:** `salary_reports`: `alter column sent_date drop not null` · `report_file_url` drop
not null (T4) · `add column period date not null` + `unique (period)` (§7.40ג/§7.68) ·
`add column send_status text not null default 'pending'` CHECK (`pending`/`sent`/`failed`) ·
`add column total_amount numeric(12,2)` · **`period` also carries a first-of-month CHECK** (T19 —
a mid-month value would split one month into two "periods" straight past the UNIQUE). New
`salary_report_lines`: identity PK · `report_id` FK + covering index · `hostess_id` FK ·
identity snapshot (`hostess_name`, `id_number`) · `source_project_id` FK · `line_basis` CHECK
(`actual`/`cancellation_compensation`) · `hours numeric` · `rate numeric(12,2)` ·
`bonus numeric(12,2)` · `travel numeric(12,2)` · `line_total numeric(12,2)` — **no bank columns
(B-4)** · 🔴 **every FK = ON DELETE/UPDATE RESTRICT** (T19 — the lines are payroll EVIDENCE;
copying the neighbouring assignments→projects CASCADE would delete it with the project). RLS on
both: SELECT gated `'כספים'` level **`edit|view`** (T20), no write policies. moddatetime via
`extensions.`.
**🔻👤 Typed-echo → apply. 🔻🤖 Verify:** constraint list live · UNIQUE proven by a rolled-back
double-insert · impersonated read matrix (positive first) · advisors.
**מה ייחשב עובד** *(§7.68 quoted)*: `"period UNIQUE + טבלת שורות-snapshot מוקפאות-בהפקה + סה"כ"`.

**↳ as-built · APPLIED `27/08/2026 13:1X`** — file
`supabase/migrations/20260827131033_module8_salary_report_document_model.sql`; typed-echo received.
**Built as planned, with one addition worth naming:** the migration does NOT re-`enable row level
security` on `salary_reports` — RLS was already on (measured); what was missing was a *policy*.
Writing a redundant `enable` would read as though m8 turned RLS on, which is false.
**🔻🤖 Verify:**

| Assertion | Measured |
|---|---|
| T4 — the two NOT NULLs released | `sent_date=YES`, `report_file_url=YES` ✅ |
| constraints live | `salary_reports_period_key` · `..._period_first_of_month` · `..._send_status_check` · `salary_report_lines_pkey` · `..._line_basis_check` ✅ |
| **UNIQUE proven by a real double-insert** | second report for `2026-08-01` ⇒ **`unique_violation`** ✅ — *the double-generation block is proven by a write that failed, not by reading the DDL* |
| **T19 first-of-month proven the same way** | `period = 2026-09-15` ⇒ **`check_violation`** ✅ — the silent month-split is genuinely impossible |
| T19 — every `salary_report_lines` FK RESTRICT both ways | all three measured `del=r/upd=r` ✅ |
| covering index per FK (checklist §1: applies to ANY new FK) | 3 of 3 ✅ |
| T9 moddatetime | `extensions.moddatetime` ✅ (via `pg_trigger→pg_proc→pg_namespace`) |
| T20 — impersonated read matrix, positive control first | כספים **1 row** — *the table had never returned a row to any client before this* · לוגיסטיקה **0** · גיוס **0** ✅ |
| direct client UPDATE as כספים | **0 rows** ✅ |
| probe cleanup | both tables back to **0 rows** ✅ |
| advisors | **26 → 25.** The finding that left is `rls_enabled_no_policy` on `salary_reports` ✅ |
| unit regression | **1,440 / 56, exit 0** — identical to baseline ✅ |

⚠️ **Stated triage, not a silent skip:** the full `get_advisors` sweep was not re-run here. Migration
B creates **zero functions**, so the only category it can move is `rls_enabled_no_policy`, measured
directly against `pg_class`/`pg_policies`. The full sweep is required at the **1.8** phase gate and
runs there.

🔑 **A fact this step retires, worth knowing before 1.8:** `salary_reports` was the **last** business
table that was deny-all for want of being built. The three that remain (`project_changes`,
`login_attempts`, `login_rpc_calls`) are deny-all **by design**. 🚧 **The
`supabase/migrations/CLAUDE.md` section "טבלה חדשה בשימוש ראשון" still names `salary_reports` as the
open one and is now stale** — left untouched on purpose (another module's instruction surface);
flagged in `db_roadmap` §10 so whoever next edits that file finds it.

**🌊 אדוות —** `db_roadmap` §10 Done row · **`db_roadmap` §7.40ג row struck** (the four-unique-
constraints item is now 4/4 — it had read *"אין לסמן את השורה כבוצעה"* since 12/08) ·
`docs/schema.sql` (§19 rewritten + new §28 + header counts 24→25 tables, 50→52 policies + the
no-business-table-deny-all note) · §1 header + step table. **No `🚧` created or consumed.**
**🗣️ אושר —** typed-echo `27/08/2026 13:1X`.

**Step 1.3 · Migration C + SAME-STEP client rewire — `module8_hostess_bank_details_split`** ⚠️ shared-surface
**Files:** migration + `src/modules/04_hostesses/HostessFormDialog.jsx` · `HostessViewCard.jsx` ·
`src/modules/04_hostesses/api.js` (+ their tests)
**What to do:** migration: `create table hostess_bank_details` (`hostess_id` PK/FK cascade,
`bank_name`/`bank_branch`/`bank_account` NOT NULL, timestamps+moddatetime) · copy all rows ·
`alter table hostesses drop column bank_name, drop column bank_branch, drop column bank_account`
(T3) · policies per §4.1. Client, same step: the F13-mapped 5 sites — form reads/writes via the
child (upsert on save), view card reads LEFT-joined (a hostess without a bank row still renders,
bank cells show `—`).
**🔻👤 Typed-echo → apply → immediately land the client rewire in the same commit.**
**🔻🤖 Verify:** row counts child == pre-split parent count · 🔴 **MANDATORY, screenshot-attached:
create a hostess through the REAL m4 form and see her saved with bank details** (then remove via
its own path or leave as demo per e2e/CLAUDE.md's narrow exception — declare which). This is the
least-covered write surface in the repo (§6's `🚧 מ12 ← מ4` row: zero automated coverage on
`04_hostesses/api.js` writes) — the live check is the ONLY net between this schema change and 4.4 ·
impersonation: recruitment-manager reads bank ✓ (edit on 'דיילות'), finance reads ✓,
logistics-manager ⇒ 0 rows · m4 unit tests green · advisors.
**מה ייחשב עובד** *(ה19 quoted)*: `"כתיבה/קריאה לבעלות edit על 'דיילות' (טופס-מ4 ממשיך לעבוד) +
קריאה ל'כספים' (הדוח); חסום לכל השאר"`.

**↳ as-built · DB HALF APPLIED `27/08/2026 13:5X` — `20260827132708_module8_hostess_bank_details_split`.
🔴 DEVIATION: the `drop column` did NOT run and is deferred to C2 (see §10, this date, and §8.4).**
The client rewire is the remaining half of this step and is NOT done yet.
**🔻🤖 Verify — the DB half:**

| Assertion | Measured |
|---|---|
| rows copied == parent count | **26 of 26** ✅ |
| parent columns after C | all three still **present**, all now **nullable** ✅ — this is what keeps production alive |
| child FK + trigger | `hostess_id_fkey del=c` (cascade — a deleted hostess takes her bank row) · `extensions.moddatetime` ✅ |
| impersonated reads (positive control first) | גיוס/דיילות **26** · כספים **26** · לוגיסטיקה **0** ✅ |
| impersonated writes | גיוס/דיילות **26 rows** updatable (she owns the form) · כספים **0 rows** — read-only by design ✅ |
| 🔴 **production-safety proof** — the point of the whole split | An INSERT shaped exactly as `origin/main` writes it (bank values into the PARENT) **SUCCEEDED**; the UPDATE path **SUCCEEDED**; the READ path returned `לאומי · 002 · 12345`, not NULL. **Probe row deleted, 0 left.** ✅ |
| unit regression | **1,440 / 56, exit 0** ✅ |

⚠️ **First attempt at that production probe FAILED and the failure was MINE, not the migration's** —
the probe omitted `city`, a pre-existing NOT NULL column. Re-run complete; recorded because a
green-looking table that silently never ran the decisive check is exactly the failure this guide
warns about elsewhere.
**↳ as-built · CLIENT HALF DONE `27/08/2026 14:1X`.**
🔑 **DEVIATION IN PLACEMENT, and it is deliberate:** the plan said "the F13-mapped 5 sites — form
reads/writes via the child, view card reads LEFT-joined". **The split landed in `api.js` alone**
(`splitBankFields` / `flattenBankDetails`): the hostess object stays FLAT to its consumers
(`hostess.bank_name`), so the form's data contract did not change and **the form was not touched at
all**. Only `HostessViewCard` changed, by one line, to render `—` instead of `" ·  · "` when a
hostess has no bank row. **Why smaller is righter here:** this form is the lowest-automated-coverage
write surface in the repo AND it deploys to production tonight — every UI line not touched is a
regression that cannot happen. Same behaviour, same child table, a third of the blast radius.
**🔻🤖 Verify — the client half:**

| Assertion | Evidence |
|---|---|
| unit tests for the split | **6 new tests** in `04_hostesses/api.test.js` — bank fields absent from the `hostesses` insert · written to the child with the new id · RLS-blocked bank write throws **naming the hostess** instead of reporting success · `upsert` (not `update`) with `onConflict` · flatten on read · **a hostess with NO bank row loads with empty strings, not null and not a crash** |
| 🔴 the tests actually BITE | Broke `splitBankFields` deliberately (removed the `delete`) ⇒ **exactly 2 of the 6 went red**; restored ⇒ green. *A guard never seen failing is not a guard.* |
| `npm run gate` | **exit 0** — lint · prettier · **1,446 unit tests** · build · jscpd · knip · audit · check:bidi · check:context · check:docs-structure |
| 🔴 **live browser, credentialed** *(the step's mandatory check)* | Logged in as מנהלת גיוס, opened `נועה שגיא` in the REAL form: values loaded **from the child table** (`לאומי · 782 · 1184530`) → changed the branch → saved → **re-opened after a full reload and read back `783`** → the view card rendered `לאומי · 783 · 1184530` → restored to `782` and re-verified. **4 screenshots** in the session scratchpad. |
| the `e2e/CLAUDE.md` narrow exception, honoured in full | Announced in chat BEFORE running · a value-update on an existing seeded demo row · **zero rows created or deleted** · restored immediately · **restore verified against the live DB** (`לאומי · 782 · 1184530`, and 26/26 hostesses still hold a bank row) · the temporary probe spec **deleted before committing** (`git status` clean of `e2e/`) |

⚠️ **A measurement worth keeping:** the probe's first run FAILED on `getByLabel('סניף')` — the
form's `Field` component renders a `<label>` **with no `htmlFor`**, so Playwright cannot associate
it. Not a bug in the form, but any future test of this form hits it; the working locator is the
innermost `div` containing the label, then its `input`.
**🌊 אדוות —** `db_roadmap` §10 + **new §9א (the pending-removals list)** · `supabase/migrations/CLAUDE.md`
(the new deploy rule) · `docs/schema.sql` §15 + new §29 · §8.4 (C2's contract) · §10. **§6's bank-debt
row is NOT consumed yet** — ה19 is not closed until C2. **🗣️ אושר —** typed-echo `27/08/2026 13:5X`.

**Step 1.4 · Migration D + ordered deploy — `module8_email_log_finance_types`**
**Files:** migration + `supabase/functions/send-email/index.ts`
**What to do:** widen the CHECK to 6 values (+`invoice`, +`salary_report`) · add the FOURTH
module-gated SELECT policy (`'כספים'` level `edit|view` — matching the three existing email_log
policies, T20; never widen an existing one — A-20's forward notice) ·
then update `ENTITY_MODULE` (+2 → 'כספים') and `ENTITY_REQUIRES_ATTACHMENT` (+2 → true) and
**deploy the Edge function immediately after the migration applies** (T5; the m6 precedent order).
**🔻👤 Typed-echo → apply → deploy. 🔻🤖 Verify:** CHECK def live shows 6 · `npx deno check` on the
function · a `send-email` dry call with `entity_type='invoice'` and no attachment refuses (floor
proven) · advisors.
**מה ייחשב עובד** *(R4-F12 quoted)*: `"שני ערכים חדשים … שניהם attachment-חובה … מיגרציה לפני
דיפלוי, לעולם לא הפוך"`.

**↳ as-built · MIGRATION APPLIED `27/08/2026 13:5X` — `20260827132709_module8_email_log_finance_entities`.
🔴 The Edge-function deploy — the second half of this step — has NOT run yet. T5's order is therefore
still intact and must stay that way.**
**🔻🤖 Verify — the migration half:** CHECK live shows **6 values** ✅ · `email_log` policy count **4** ✅ ·
recruitment-manager still reads her shift mails, **27 rows, unchanged by D** ✅ · unit regression
**1,440/56 exit 0** ✅.

🔴 **A CLAIM OF MINE THAT THE VERIFICATION DISPROVED — recorded because the migration file is
committed and append-only, so the correction can only live here.** The migration's own why-comment
says the finance manager *"will see only her two m8 rows — not the quote, shift or project mails."*
**That is false. Measured: she sees 8 `email_log` rows right now** (`quote`=6 + `project`=1 +
`project_report`=1), and zero of them are m8's, because no invoice/salary rows exist yet.
**The mechanism: RLS policies are PERMISSIVE, so they combine with OR.** She already qualified
through `email_log_select_quotes_module` (she holds `view` on 'הצעות מחיר') and
`email_log_select_projects_module` (`view` on 'פרויקטים'). **A new, tightly-gated policy can only
ADD rows to what someone sees — it can never subtract.** Nothing is broken and nothing needs
changing; the *description* was wrong, not the SQL. 📌 The corrected statement now sits in
`docs/schema.sql` beside the four policies, where the next reader will actually be.
🔑 **Generalise it, because it will bite again in 1.5/1.6:** when reasoning about who can see what,
count **every** policy on the table, not just the one being added.
**↳ as-built · DEPLOY DONE `27/08/2026 14:4X` — `send-email` is now **version 6, ACTIVE**,
`verify_jwt` still true.** T5's order was honoured and is now provable: the migration went first
(CHECK live at 6 values), the deploy second.
**🔻🤖 Verify — behaviour, not text.** *(A source diff would only have shown the maps were edited,
not that they LOADED and that the gate judges against the right module.)* A temporary credentialed
probe made five calls to the DEPLOYED function with real JWTs:

| # | Call | Result | What it proves |
|:-:|---|---|---|
| ① | כספים · `invoice` · no attachment | **400** `חסרים נתונים לשליחה.` | `invoice` is a KNOWN entity gated on 'כספים' — an unknown one is refused **403** by deny-by-default, so a 400 can only be reached *past* the gate. And the attachment floor is live. |
| ② | כספים · `salary_report` · no attachment | **400**, same | idem |
| ③ | כספים · `not_a_real_entity` | **403** | the map did not become permissive — deny-by-default still holds |
| ④ | **גיוס** · `invoice` | **403** `אין לך הרשאה לשלוח.` | 🔴 the mapping really is 'כספים' and **not a recycled `quote`/`shift`** — the exact trap m6 documented on this same line |
| ⑤ | גיוס · `shift` · empty body | **400** | **positive control**: her login works, so ④'s 403 is a permission decision and not broken auth |

🚫 **Zero mails were sent and zero rows written:** every call dies at the gate or at body-validation,
**before** the `fetch` to Make. Confirmed after the run — `email_log` still holds **33** rows
(`quote`=6 · `shift`=25 · `project`=1 · `project_report`=1), unchanged.
✅ **`deno check` PASSES — exit 0.**
🔴 **A correction I owe, because my first report of this step got it wrong.** I ran
`npx deno check <file>`, hit `Could not find a matching package for 'npm:@supabase/realtime-js'`,
confirmed the identical failure on the unmodified committed file, and concluded *"a pre-existing
local environment gap; it cannot pass locally today"*. **The first half was right and the conclusion
was wrong.** The correct command is the one CI already uses —
`deno check --node-modules-dir=none supabase/functions/send-email/index.ts` — and it exits 0 on this
change. **The cause was diagnosed and written down in this repo on 05/08/2026**, in
`.github/workflows/ci.yml` directly above the job: with a `package.json` at the root and no
`deno.json`, Deno 2 defaults to `nodeModulesDir: "manual"` and demands the package from a
`node_modules` that was never installed; the flag forces resolution from the global cache, which is
also how Supabase's Edge runtime resolves.
🔑 **The lesson, and it is not "remember the flag":** *"the same failure on the unmodified file"*
proves the change is innocent — **it does not diagnose the failure**, and I stopped at the first
conclusion. The repo already held the answer, one file away, next to the job that runs it.
📌 **A stale comment inside the function was corrected in the same edit:** it read *"🚫 אין כאן
`invoice`/`salary_report`"* — true until today, false the moment the values landed. It now records
the order that was actually followed, and keeps the 🚧 note for מ11, which still has to do the same.

**🌊 אדוות —** `docs/schema.sql` (CHECK + the 4th policy + the PERMISSIVE/OR note in the header) ·
`db_roadmap` §10 · §10 below · the Edge function's own header comment. **§6's mail-engine row: m8's
share is now paid** — the two entity types exist end-to-end. **🗣️ אושר —** typed-echo `27/08/2026 13:5X`.

**Step 1.5 · Migration E — `module8_finance_rpc_family`**
**Files:** one migration (or two if the reader family earns its own — builder's call, stated in
the why-header)
**What to do:** implement §4.2's family — **now FIVE actions (B-13): invoice · payment · feedback ·
write-off · archive** + fee resolution + readers + the salary transaction. ⚠️ **Q-3/Q-4/Q-5/N-4
indirection:** this step's formulas implement **Ishay's ACTUAL answers from the approval round**,
not the recommendations as-written — if he overrode any, the override is the contract (the
rehearsal caught the draft baking recommendations in as if ruled). Contracts the phases must agree
on (the rest is the builder's):
- `drop function public.set_project_finance_fields(<the live 6-arg signature>)` — explicit, cited.
- Every action: `assert_module_permission('כספים')` + ה12's status gate (`project_status in
  ('awaiting_invoice','awaiting_payment','finished','cancelled')` per action semantics; `finished`
  accepts NO further writes except none — the lock is the preconditions, ㉙ pattern).
- `record_feedback`: writes stay allowed on a `completed` row until archive (B-15 — the phone-reason
  path requires it; refusing would deadlock the <3 gate).
- `record_write_off(project_id, reason)` — the fifth action (B-13): regular project in
  `awaiting_invoice`/`awaiting_payment` → `written_off=true` + mandatory reason; the archive gate's
  written_off branch then opens.
- Salary collection (the generation transaction): **source (א) collects-and-signs per Q-5's ruling**
  (recommended: `finally_approved` only) + source (ב) per A-7 · zero-amount rows per N-4's ruling ·
  travel stamped only where `actual_hours > 0` (B-16) · compensation-scale time anchor = event
  start (`final_event_date + final_start_time`, Asia/Jerusalem — the live `get_shift_invite`/
  `apply_scope_change` precedents).
- The overview reader emits `credit_note_flag` per B-14's derivation.
- `archive_project`: dual gate `(payment_date is not null OR written_off) AND feedback_status in
  ('completed','no_response')` → freeze `final_profit` (computed server-side from the same SSOT
  the reader uses) → `finished` → `feedback_token = null` (B-6) → `archived_at = now()`. One
  transaction. Refusal messages: Hebrew P0001, builder-authored, UI-mapped.
- `resolve_cancellation_fee`: writes amount+note / waive (amount 0 + mandatory note) / write-off
  (mandatory `written_off_reason`); leaves `project_status='cancelled'` (T1). **Freeze moment per
  Q-4: waive/write-off freeze immediately; a BILLED fee freezes when its payment is recorded** —
  `record_payment` on a cancelled project triggers the freeze (formula per Q-3), and the row leaves
  the worklist (B-9).
- Readers (`get_finance_overview` · `get_project_finance_detail`): DEFINER; revenue = frozen
  preVat + Σ `project_changes` signed (ה2; sum as-is, no abs — R3-10); goods cost from quote
  lines+changes (ה17/ה26); labor from assignments; fail-loud (R4-F9). Tab membership implements
  B-9's derivation (cancelled rows by fee-state, never tab 3). Return shapes are a CONTRACT:
  document the JSON keys in the migration header comment; `api.js` consumes them by name.
- **F16 coherence — the change-list #14 fork is DECIDED here: EXTEND `list_projects_overview`**
  (live-body pull) so its revenue term includes Σ scope changes — otherwise m6's overview and m8's
  screens show two different revenues for the same project (#15: 6,060 vs 5,985 — the reviewer's
  measured example), which is exactly what F16/R1-4 forbid. m6's hand-computed oracle (#8 →
  5,355.00) has zero scope changes ⇒ must stay digit-identical after the rewrite — that IS the
  regression proof. This is a ripple into merged m6 SQL: say it out loud in the report.
- Compensation math for cancelled rows: `%(scale params) × planned_hours(final_end−final_start,
  null-guarded T7) × hourly_rate_snapshot` — only rows with `released_from_status='finally_approved'`
  (the ruled §7.16 population; R4-F2).
- `generate_salary_report(period)` + `finalize_salary_report(...)` per §4.2; signature =
  `salary_report_id` stamp + `travel_amount` stamp (ה14) in the SAME transaction as line creation.
**🔻👤 Typed-echo → apply. 🔻🤖 Verify (each proven in a rolled-back transaction where write-
bearing):** old function gone (`\df`-equivalent catalog check) · finance impersonation: invoice→
payment→feedback→archive happy path on a COPY-safe demo row flips statuses and freezes profit ·
negative: archive without payment ⇒ P0001 with the gate text · cancelled project: archive refused
(T1) but fee resolution freezes profit · salary generation on a test period inside a rollback:
lines snapshot + signatures + travel stamps present, second call raises on UNIQUE · `proacl` shows
no anon on internal functions (T8) · advisors (expect +N DEFINER WARNs — the accepted class;
predict, then reconcile).
**מה ייחשב עובד** *(spec §④ quoted)*: `"מסע #12 מקצה-לקצה … מפיק רווח-קפוא שתואם חישוב-יד"` —
the DB half.

**↳ as-built · SPLIT INTO E1 + E2** (the step's own text permits it). **E1 APPLIED
`27/08/2026 14:5X` — `20260827144459_module8_finance_money_ssot_and_readers`.** E2 (the five write
actions, fee resolution, archive, salary transaction) is next and consumes what E1 built.

🔑 **The formula was proven against the hand-computed anchor BEFORE a line of SQL was written** —
run against live data, not against a test I would author later: #13 ⇒ revenue **5,300.00** · goods
**1,650.00** · labour **0** · **profit 3,650.00** = `spec.md §③3`.
🔴 **And the anchor settled a design question that no self-authored test could have caught.** The
hostess quote line (`04ST`) carries its own `closing_unit_cost` of 300.00/unit. Counting it inside
the goods term adds 1,200 ₪ of cost and yields **2,450**, not 3,650. ⇒ **hostess-category lines are
excluded from goods; labour comes from the assignment rows alone.** A test written beside the
implementation would have encoded the same misreading and passed green on top of a wrong invoice.

**🔻🤖 Verify:**

| # | Assertion | Measured |
|:-:|---|---|
| R1 | 🔴 **m6 regression — `list_projects_overview` #8** | **5,355.00** — digit-identical to m6's own hand anchor. The merged-SQL rewrite did not move it ✅ |
| R2 | m6 #15, which HAS a scope change | 6,060.00 → **5,985.00**, the reviewer's predicted number (−25 × 3.00). **A visible change to a merged module's screen, and the point of the fix** — m6 and m8 now report one revenue. Swept: **no test pins the old value** |
| R3 | #13 profit via `get_project_finance_detail` | **3,650.00** = the hand anchor ✅ |
| R4 | #12 coherence end-to-end | revenue 500.00 · goods 0.00 · labour 270.00 · deviation **202.50** (6 actual hours vs 1.5 planned @45) · travel 0.00 — correct, the travel param is still 0 until G |
| R5 | gate, positive control first | כספים reads ≥1 row · **לוגיסטיקה and גיוס RAISE** (not an empty set — the difference that matters) ✅ |
| R6 | **T8** — `finance_project_money` grants | `postgres`, `service_role` only. **No `anon`, no `authenticated`** ✅ |
| R7 | unit regression | **1,446 / 56, exit 0** ✅ |

📌 **A contract for phases 2–3, stated here because `api.js` will consume it by name:** both readers
return **facts**, not display values. Due date, days-overdue, the profit **%** and the score tag are
derived in `src/lib/projectFinance.js` (step 2.1) — the S1 card says "נגזר בזמן-תצוגה", and §7.52
says ₪ is stored while % is always derived. `payment_terms_days` comes back **NULL** until G seeds
`תנאי_תשלום_ימים`; the screen must render `—`, never "0 days overdue".

**🌊 אדוות —** `db_roadmap` §10 · `docs/schema.sql` (3 new functions, count 26→29, **and the m6
function's source pointer now names THIS migration with the reason**) · §1 header + step table.
**No `🚧` created or consumed.** **🗣️ אושר —** typed-echo `27/08/2026 14:5X`.

**↳ as-built · E2 APPLIED `27/08/2026 15:1X` — `20260827150049_module8_finance_write_actions`.**
Seven functions + the explicit drop of m6's `set_project_finance_fields` (**0 call sites, measured**).
**Split note:** step 1.5 runs as **E1 + E2 + E3** rather than the two first announced — the salary
transaction is P4 and shares nothing with P1/P3's collection flow; one migration would have made
neither half verifiable alone. The step's own text grants the builder that call.

**🔻🤖 Verify — two complete journeys driven through the real functions, each inside a transaction
that was then ROLLED BACK**, so real projects were exercised and **nothing persisted**. *(The report
travels in the rollback exception's message: a rollback destroys any result table.)*

| Journey A — regular project #12 | Result |
|---|---|
| old m6 function gone | **0** ✅ |
| ה12 — write to a not-yet-closed project | blocked ✅ |
| invoice without a file | blocked ✅ |
| invoice sent | ⇒ **`awaiting_payment`** ✅ |
| archive without payment | blocked, **with the gate's own wording** ✅ |
| future payment date | blocked ✅ |
| score 2 without a reason | blocked ✅ |
| archive paid but no feedback | **still blocked** ✅ |
| 🔴 **archive** | succeeds, **`final_profit = 230.00`** — **identical to what E1's reader computes for #12**, so the frozen number and the live number agree ✅ |
| after archive | `finished` · **`feedback_token = NULL`** (B-6's token kill) ✅ |
| write after archive | **locked** ✅ |

| Journey B — cancellation on #14 | Result |
|---|---|
| 🔴 **fee proposal** | pct **50** · hours **30.0** · compensation **328.00** · goods@price **3,180.00** ⇒ **fee 3,508.00** — **the hand anchor, produced by the function itself**, not by a query written to match ✅ |
| archive a cancelled project | blocked (T1) ✅ |
| waive without a note | blocked ✅ |
| **billing alone** | **does NOT freeze** — `frozen_profit` NULL (Q-4) ✅ |
| **recording the payment** | **freezes at 1,680.00** = 3,508 − 328 − 1,500 (goods at cost) ✅ |
| status afterwards | **stays `cancelled`** — m6's state machine untouched (T1) ✅ |

**Rollback proven clean:** #12 back to `awaiting_invoice`/`sent`/no payment · #14 back to
`in_progress`, `cancelled_at` NULL · zero `released_from_status` values · `project_finance` **0 rows**.
**T8:** the three internal functions are `postgres`+`service_role` only — **no `anon`, no
`authenticated`**; the nine client-callable ones all carry `authenticated`; **the anon-callable
DEFINER set did not grow.**
**Advisors — predicted then measured:** predicted **+8 net** on the `authenticated`-DEFINER class
(9 added, 1 dropped); measured **17 → 25**, exactly +8 ⇒ total findings 25 → **33**, all the accepted
class. ⚠️ Measured against `pg_proc`/`proacl` directly; the **full `get_advisors` sweep runs at the
1.8 gate**, which requires it anyway.
**🌊 אדוות —** `db_roadmap` §10 · `docs/schema.sql` · §1 header + step table. **🗣️ אושר —** typed-echo
`27/08/2026 15:1X`.

**↳ as-built · E3 APPLIED `27/08/2026 15:3X` + a same-minute FIX-FORWARD
(`20260827153725_module8_salary_report_temp_table_fix`).** Step 1.5 is now COMPLETE as E1+E2+E3.

🐞 **E3 shipped with a defect that my own verification caught, and the shape of it is worth keeping.**
`generate_salary_report` created a temp table with `on commit drop`; that fires at COMMIT, so a
**second call inside one transaction** died on `relation "_collect" already exists`.
**Production would never have shown it** — every Supabase RPC runs in its own transaction.
🔑 **What it DID break is the checker:** this project verifies write functions by running them on
real data inside a transaction that is then rolled back, so the defect made the function
**unverifiable by the only method available**. It surfaced on the first attempt to generate August
and then September in sequence — the very test meant to prove the signature prevents double payment.
**A salary function that cannot be verified must not ship**, so this was fixed rather than noted.
The original migration was NOT edited (applied + committed = history); the fix went forward, and the
new body was **extracted from the original file programmatically rather than retyped** — a
line-by-line comparison excluding the added lines reports **141 before, 141 after, identical**.

**🔻🤖 Verify — a real August report inside a rolled-back transaction:**

| Assertion | Measured |
|---|---|
| August report | **1 line · total 270.00** ✅ |
| the line | **אפרת דהן** · basis `actual` · **6.00h × 45.00** · total **270.00** · `show_in_file=true` ✅ |
| §3.7's `—` rule | bonus and travel come back **NULL, not 0.00** ✅ |
| **B-4, both directions** | the bank triple is **returned for the xlsx** (`הפועלים / 601 / 2047199`) **and `salary_report_lines` has no bank columns at all** ✅ |
| ה14 signature | **1 assignment signed**, travel stamped **0.00** (correct until G) ✅ |
| double-generation | second August report **refused, naming the existing report number**; a mid-month date normalises to the 1st so it cannot slip past ✅ |
| 🔴 **the anti-double-pay mechanism** | **September collects 0 lines** — the signature already consumed her ✅ |
| finalize | row moves to `sent` ✅ |
| rollback | **0 reports · 0 lines · 0 signatures · 0 travel stamps** ✅ |

🔴 **And the run caught the project's central silent failure inside MY OWN probe.** One step reported
"**0 assignments signed**" while another proved the signature had been written — and the
contradiction was the tell. My check read `assignments` **directly while impersonating the finance
manager**, who is RLS-blocked on 'דיילות' ⇒ the `0` meant **"no permission", not "no rows"**. That is
R4-F5 exactly, the trap this entire migration family exists to route around. Re-checked outside the
impersonation: **1 assignment, אפרת דהן / project 12**, and the same query demonstrated **side by
side in one run** returning **1** as `postgres` and **0** as the finance manager.
🔑 **The lesson generalises past this step: a verification query is subject to the same trap as
production code.** Reading a blocked table directly makes the checker lie **in the reassuring
direction** — it reports absence, which reads as "nothing to worry about".

**🌊 אדוות —** `db_roadmap` §10 (both E3 rows) · `docs/schema.sql` · §1 header + step table.
**🗣️ אושר —** typed-echo ×2, `27/08/2026 15:3X`.

**Step 1.6 · Migration F — `module8_public_feedback_rpc`**
**Files:** one migration
**What to do:** `mint_feedback_token(project_id)` (get-or-create, gated 'פרויקטים') ·
`get_feedback_page(token)` / `submit_feedback(token, score, notes)` — anon-EXECUTE by name,
generic single not-found response (state ד'), completed ⇒ "already" (state ג'), submit writes
score+notes+`completed` (dorse over `no_response` allowed — T12), rate limit via a
`login_rpc_calls`-shape counter (its own table or reuse — builder decides, limit 15/IP/hour —
**T14: the shift RPCs have NO limiter to copy; module 1's counter is the only live precedent**).
No table policy for anon anywhere — the functions are the only door. Edge contracts (rehearsal
G-16/G-17): `mint` refuses only `finished` (token dead — never re-mint); `submit` accepts a
`not_sent` project (mail failed after mint — the customer holding a working link still counts).
**🔻👤 Typed-echo → apply. 🔻🤖 Verify:** in rolled-back transactions: valid pending token returns
event fields · submitted token returns "already" shape · null/garbage token returns the generic
shape byte-identical to expired · submit writes the three fields · anon `select` on `projects` ⇒
0 rows while the RPC answers (positive+negative pair) · rate-limit counter proven by loop ·
advisors (+2 anon-fn WARNs expected — the /shift class).
**מה ייחשב עובד** *(P2 card quoted)*: `"הלקוח פותח /feedback/:token — בלי התחברות … שולח פעם
אחת"` — the DB half.

**↳ as-built · APPLIED `27/08/2026 15:5X` — `20260827155303_module8_public_feedback_rpc`.**
🔴 **T14 confirmed the hard way:** m4's `/shift/:token` has **no rate limiter to copy**, so the
shape came from module 1's login counter — the only live one. **Builder's call the step left open:
a SEPARATE counter table**, not a reuse of `login_rpc_calls`. Sharing it would have let a customer
refreshing the feedback page **eat into the login-attempt budget for that IP** and the reverse;
behind a shared office NAT that reads as "the system locked me out" with no connection to anything.

**🔻🤖 Verify — 19 assertions in rolled-back transactions, driven from the attacker's seat too:**

| Assertion | Measured |
|---|---|
| mint as מנהלת פרויקטים (the real caller) | 32-char token ✅ |
| mint again | **same token** — get-or-create, so a re-sent mail never kills a live link ✅ |
| anon + valid token | `{state: ok}` with event name and date ✅ |
| anon + garbage / empty / NULL | each `{state: not_found}` — **and the three asserted byte-identical**, not eyeballed ✅ |
| 🔴 anon reading tables directly | `projects` **0 rows** · `feedback_rpc_calls` **0 rows** — the functions are the only door ✅ |
| score 6 / score 2+notes / submit again | `invalid` / `ok` (notes trimmed) / **`already`**, and the page then reports `already` too ✅ |
| 🔴 **the new archive gate, end-to-end** | customer submits **2 with no reason** → manager records payment → **archive BLOCKED**, message names the score → she enters a reason → **passes**. An **invented** reason string is refused by the live CHECK ✅ |
| 🔴 rate limit | **proven by a 20-call loop: exactly 15 allowed, 5 blocked**, spoken Hebrew message ✅ |
| rollback | #12 back to `awaiting_invoice`/`sent`, no score, **no token**; 0 rows in both new-touched tables ✅ |
| anon surface after F | **exactly `get_feedback_page` + `submit_feedback`** added to the four login/shift ones — the +2 predicted, nothing else ✅ |

🔑 **A gap this step exposed in the PREVIOUS one, and the shape is worth keeping:** `archive_project`
(E2) checked that feedback was *resolved* but not that a low score had a **reason**. It was
unreachable until F existed — **the public page has no reason field at all**, because the reason is
chosen by the manager after a phone call. The moment F shipped, a customer giving **2** would let the
file close **without the phone call ever happening**, against `"עד אז אין ארכוב"` (P2). Fixed forward
in F; E2's migration was not edited. ⚠️ **The lesson: a harmless-looking step can arm an older
defect** — the gap existed for an hour and only became dangerous when its trigger was built.

**🌊 אדוות —** `db_roadmap` §10 · `docs/schema.sql` · §1 header + step table. **No `🚧`.**
**🗣️ אושר —** typed-echo `27/08/2026 15:5X`.

**Step 1.7 · Migration G — `module8_cancel_project_released_status_and_seeds`**
**Files:** one migration
**What to do:** pull `cancel_project`'s LIVE body (`pg_get_functiondef`) → add ONE thing: before
flipping active assignments to `released`, stamp `released_from_status = assignment_status` (new
cancellations only) · seed `params`: `תנאי_תשלום_ימים = 30`, **`param_type='pricing_timing'`**
(T22 — the type of `סכום_נסיעות_למשמרת`; note `products_and_params.md` carries NEITHER new param —
the enum is all it answers) · update `סכום_נסיעות_למשמרת` 0→22.60 (ה20; the §7.69 CPA rider
stands).
**🔻👤 Typed-echo → apply. 🔻🤖 Verify:** full-body diff vs the pre-edit live def = exactly the one
addition · cancel a throwaway demo project inside a rollback: `released_from_status` filled ·
params live values 30/22.60 · advisors.
**מה ייחשב עובד** *(R4-F2 quoted)*: `"עמודה משמרת-סטטוס-קדם-ביטול … לביטולים חדשים בלבד"`.

**↳ as-built · APPLIED `27/08/2026 16:1X` — `20260827160357_module8_cancel_project_released_status_and_seeds`.
PHASE 1's MIGRATIONS ARE COMPLETE — all ten m8 migrations live.**

🔑 **The "one line" claim was PROVEN rather than asserted, and the method is the point.** Before
touching anything, the live body was fingerprinted: **md5 `b21ef3d8e53270dce52dcd3134f8b103`,
length 4,457, zero occurrences of `released_from_status`.** After applying, the new live body was
taken back through the single edit — the added `set` line removed — and re-hashed: **same md5, same
length.** ⇒ **arithmetic proof that nothing else in a merged m6 function moved.** A char-diff of a
transcription would have proven only that my transcription matched itself; this compares the
database to the database.
*(The mine this defends against is expensive and real: 12/08/2026, a migration built from a pre-fix
version of a function broke live quote approval **silently for three days**, found only at a demo
rehearsal.)*

**🔻🤖 Verify:**

| Assertion | Measured |
|---|---|
| 🔴 delta = exactly the one addition | **md5 match** `b21ef3d8…`, length 4,457 ✅ · `released_from_status` occurs **once** ✅ |
| behaviour — cancel #14 through the live function | `released_rows=4`, and **all four now carry `released<-finally_approved`** ✅ — the fact §7.16 depends on is preserved instead of erased |
| the fee becomes computable | proposal returns a number where it previously could not ✅ |
| 🔑 **third hand anchor** | **אפרת דהן — 6.00h × 45.00 + travel 22.60 = 292.60** = `spec §③3` ✅ |
| `payment_terms_days` | **30** (was NULL from both readers before G) ⇒ due date and days-overdue are computable at all ✅ |
| rollback | #14 back to `in_progress`, no signatures, no reports ✅ · **the two params correctly persist** — the migration's own effect, not probe data |

⚠️ **One probe number stated precisely rather than smoothed over:** the fee proposal returned
**3,836.00**, not the 3,508.00 anchor — because the probe cancelled **now**, and #14's event is today
at 17:00, i.e. **under 24 hours ⇒ 100%**, where the anchor assumes 30 hours before ⇒ 50%. **The
formula is unchanged** — simulating the anchor's timing still yields 328.00 + 3,180.00 = 3,508.00
exactly. **A different input, not a different rule**, and worth writing down so nobody later reads
3,836 as a regression.

**🌊 אדוות —** `db_roadmap` §10 · `docs/schema.sql` · §1 header + step table. **🗣️ אושר —** typed-echo
`27/08/2026 16:1X`.

**Step 1.8 · 🔻👤 Phase-1 gate**
Advisors full triage (predicted vs measured, every delta explained) · `docs/schema.sql` regenerated
by catalog queries + cross-checked · db_roadmap §10 Done-entry + M8 register rows flipped ·
`git commit` (pathspec!) of migrations+schema together · unit baseline unchanged · report to Ishay
in Hebrew with the evidence table.

**↳ as-built · GATE RUN `27/08/2026 16:5X`. The DB half of module 8 is closed.**

**🔻🤖 The battery, each suite reported SEPARATELY — `test:e2e` silently excludes the smoke suite
(`--grep-invert בדיקת-עשן`), so one green line for "E2E" would be a false all-clear:**

| Suite | Result |
|---|---|
| `npm run gate` | **exit 0** — lint · format · **1,446 unit / 56 files** · build · jscpd · knip · audit · bidi · context · docs-structure |
| ⚠️ one FLAKE, diagnosed not waved away | a mid-gate re-run showed **1 failed / 1,445 passed**: `src/modules/05_logistics/ChecklistDialog.test.jsx › "הצלחה רגילה — שלושת האפקטים יחד"`, which asserts **focus** after a sort jump. **Not a regression and not m8's:** the same file run alone is **34/34 exit 0**, and the failing run had a dev server competing for CPU — vitest reported `environment 629.53s` against **1.53s** in isolation. Re-run with the dev server stopped: **1,446/56 exit 0.** 📌 Worth knowing that this one test is timing-sensitive under load |
| `npm run test:e2e` | **143 passed · 6 skipped · 0 failed · exit 0** (12.9 min) |
| `npm run smoke` | **exit 0** — every main screen up on the REAL data |
| browser walkthrough | 3 surfaces, **0 console errors** (below) |

🐞 **`gate` was RED on its first run today, and the cause was mine — worth keeping because the
failure mode is invisible.** `format:check` failed on `ci.yml` and `send-email/index.ts`. Cause:
Python's `io.open(...,'w')` on Windows rewrites every newline as CRLF; the repo is LF
(`.gitattributes`). **Eleven files were contaminated.** 🔴 **And `git status` was clean and
`git diff` empty the entire time** — `core.autocrlf` normalises before comparing — so there was
**no signal at all** until the gate fell, and even then the message says "code style", not
"line endings". **The committed blobs were always LF ⇒ CI would have stayed green**; only a local
gate could ever catch this. Normalised, `gate` re-run end-to-end green, and the mine is now in root
`CLAUDE.md` beside the `Measure-Object` one.

**🔻🤖 Browser walkthrough — the three PRODUCTION surfaces the migrations touched.** Driven by a
throwaway Playwright spec (credentials injected from `.env.local`, never through chat; **zero
writes — no "save" is ever clicked**; file deleted before the commit).

| Surface | What it proves | Measured |
|---|---|---|
| מאגר הדיילות — כרטיס + טופס (ה19: C + the `api.js` rewire) | bank details now come from `hostess_bank_details`, and the form's data contract is unchanged | card renders **`מזרחי טפחות · 512 · 449…`**, form fields load the same three values ✅ |
| הצעות מחיר (ה30: A narrowed `quote_services` SELECT) | the merged m3 screens still read | list renders all **17** quotes with amounts and statuses ✅ · and the stronger proof is in `test:e2e`: `cost-visibility.spec.js` — מנהלת פרויקטים still sees cost, **מנהלת גיוס gets 0 cost rows straight from REST** |
| פרויקטים — מבט-על (E1 rewrote merged m6 `list_projects_overview`) | the rewrite did not break the screen that consumes it | tabs **6 בעבודה / 2 לסגירה / 9 הכול**, real rows, **no error state** ✅ |
| console | — | **`[]` — zero errors across all three** ✅ |

**🔻🤖 Advisors, predicted vs measured, every delta explained:** SECURITY **33 → 41**
(E3 +2 · F +6 · **G +0**) · `authenticated`-DEFINER **30** · `anon`-DEFINER **6** — the four
login/shift ones plus exactly `get_feedback_page` and `submit_feedback`, **the +2 predicted and
nothing else** · `rls_enabled_no_policy` **4**, all deny-all by design · one pre-existing Auth
setting. 🔴 **T8 holds: `finance_project_money`, `finance_assert_writable` and `feedback_rate_limit`
appear in NEITHER list** — `service_role` only. PERFORMANCE **28**, of which m8 added **exactly 4**,
each expected. ⚠️ Counts re-derived from `pg_proc`/`pg_policies`/`pg_class` directly as well as
from the advisor output — same numbers twice, which is the point.

🔴 **`docs/schema.sql` cross-checked object-by-object (54 m8 identifiers) — FOUR real gaps, fixed:**
① **`feedback_rpc_calls` was missing entirely** — 26 `create table` blocks for 27 live tables; F's
ripple added the functions and not the table. Now §30. ② **`set_project_finance_fields` was still
listed in §24 as a live m6 function**, with signature and file pointer, twelve lines above the note
saying it had been dropped. Entry deleted (the file is present-tense by its own rule — no
tombstone). ③ the deny-all roll-call said **three** tables; four since F. ④ the refresh header
stopped at **E2** while the body already carried F and G.

🔴 **The deploy rule was re-run as a COMMAND against `origin/main`, not recalled from this morning:**
`set_project_finance_fields` ⇒ **zero call sites** (the drop was safe) · the three bank columns ⇒
**still written at `HostessFormDialog.jsx:217-219`, read at `HostessViewCard.jsx:315`** ⇒ **C2 must
keep waiting** · `hostess_bank_details` ⇒ **unknown to `origin/main`**, which is exactly why the live
site still works.

🔴 **A defect was found in C2's own contract — the debt this module still owes, and it was wrong in
BOTH registers.** It said `insert … on conflict do update`, unqualified. **The window has two halves
and they run in opposite directions:** before the deploy `origin/main` writes the PARENT and the
child goes stale; **after** the deploy m8's `api.js` writes ONLY the child (`splitBankFields`) and
the parent goes stale. An unqualified overwrite runs **after** the deploy and therefore pushes
**stale parent values over fresh child rows** — the same data loss the re-copy exists to prevent,
pointed backwards, surfacing as **wrong bank numbers in a CPA salary report**. Contract corrected in
§8.4 and `db_roadmap` §9א to guard the conflict action on `updated_at`; **N1 inherits the guard.**

**🌊 אדוות —** `db_roadmap` §10 (the gate entry) + §9א (C2/N1 contracts) · `docs/schema.sql` (4
fixes) · `PROJECT_MASTER_sec7.md` §7.69 (a dated ↳: the DB now holds 22.60 where the item says
"הסכום לא נקבע" — **status unchanged, CPA verification before M10 stands**) · root `CLAUDE.md` (the
CRLF mine) · §1 header + step table · `STATUS.md` · `CLAUDE_CODE_LOG.md`. **§7.20 needed nothing** —
it already names `תנאי_תשלום_ימים` default 30, exactly what G seeded. **No `🚧` created or consumed.**
**🗣️ אושר —**

---

### Phase 2 — Business logic

> 🔑 **READ THIS BEFORE STEP 2.1 — the DB layer already exists, and phase 2 CONSUMES it.**
> *(Moved here 27/08/2026 from the ⑥2 paste-block, per iron rule 15: knowledge still true in a
> month belongs in the guide; only freshness stamps belong in a prompt. The block had grown to
> ~85 lines against a house pattern of 21–25 — and module 4's own ⑥2 records that rules parked in
> a paste-block **contradicted the skill within nine hours**. Ishay caught the same drift here.)*
>
> **🔴 Do not re-derive the money formulas in JavaScript.** `finance_project_money` is the single
> calculator, and it is **internal** (`service_role` only) precisely so no screen can bypass it.
> Two screens computing their own profit for the same project is the failure it exists to prevent
> (F16/R1-4). Phase 2's job is to **call, shape and test** — not to reimplement.
>
> **Client-callable (14):** `get_finance_overview` · `get_project_finance_detail` ·
> `finance_cancellation_fee_proposal` · `record_invoice_sent` · `record_payment` · `record_feedback` ·
> `record_write_off` · `resolve_cancellation_fee` · `archive_project` · `generate_salary_report` ·
> `finalize_salary_report` · `mint_feedback_token` · `get_feedback_page` · `submit_feedback`.
> **Internal — never from the client (4):** `finance_project_money` · `finance_assert_writable` ·
> `finance_freeze_cancelled_profit` · `feedback_rate_limit`.
> *(Names read from `pg_proc` on 27/08/2026, not from memory. **Return shapes live in the E1/E2/E3/F
> migration headers** — read them there; this guide deliberately does not copy them, because a
> copied contract goes stale and its reader never knows.)*
>
> **🔑 Three of the four hand anchors are already produced by the database itself** (verified
> 27/08): profit #13 **3,650.00** · cancellation fee #14 **3,508.00** · Efrat's salary line
> **292.60**. ⇒ **If your JS disagrees with them, the JS is wrong** — they are no longer only
> paper numbers. *(The fourth, the 69% display, is derived in the UI and lands in phase 3.)*
>
> ⚠️ **`deriveProfitability` (m3's "רווח הצעה") is a DIFFERENT entity — do not import, do not
> merge** (R1-4).
>
> 🔴 **And the trap that will bite a verification query, not just production code:** the finance
> manager is RLS-blocked on 'לוגיסטיקה' and 'דיילות', and a blocked read returns
> `{data: null, error: null}` — **"no permission" is byte-identical to "no rows"**. Measured
> 27/08: the same query returned **1** as `postgres` and **0** impersonating her. It lies in the
> reassuring direction, so an empty result is a reason to suspect RLS before suspecting the UI.

**Step 2.0 · 🔻🤖 Phase door** — sweep §3.4/§3.5 items anchored here (N-1 subjects needed by 2.3);
re-read the return-shape contracts from 1.5's migration headers.

**Step 2.1 · `src/lib/projectFinance.js` + tests** ⚠️ shared-surface (new file in shared lib)

> 🔴 **↳ SCOPE CORRECTED `27/08/2026 20:45` at the 2.0 door — read this before the list below, which
> was written 26/08 (blueprint) and is now partly superseded by what Phase 1 actually shipped on 27/08.**
> **The measurement:** `finance_project_money` — read live from `pg_proc` and from its own migration
> header (`20260827144459_…_finance_money_ssot_and_readers.sql`) — **already computes revenue ·
> goods_cost · labor_cost · travel_cost · gross_profit · budget_deviation · planned_hours**, and
> `finance_cancellation_fee_proposal` already computes the fee's three components. That migration's
> own header states the division of labour in writing: *"מחזיר **עובדות**; הגזירות לתצוגה
> (מועד-פירעון, ימי-איחור, %, תגית-ציון) חיות ב-`src/lib/projectFinance.js`"*.
> ⇒ **`deriveRevenue` / `deriveGoodsCost` / `deriveLaborCost` / `deriveTravelCost` /
> `deriveBudgetDeviation` / `deriveCancellationFee` are NOT re-implemented in JS.** Building them
> would create the second profit number F16/R1-4 exist to forbid — and the phase preamble above
> already says so; only this step's own list had not been updated to match.
> **What 2.1 genuinely owns (all of it invisible to the DB):**
> `deriveDaysOverdue(invoiceSentAt, termsDays, today)` · `deriveExpectedProfit` — **and its formula
> is `gross_profit + budget_deviation`**, because the DB's `gross_profit` uses ACTUAL labor while
> ה27's expected uses PLANNED, and `budget_deviation = actual_labor − planned_labor` is exactly that
> difference (verified live 27/08 against all three hand anchors: #13 `3650 + (−692) = 2,958.00` ·
> #15 `3635 + (−164) = 3,471.00` · #12 `207.40 + 202.50 = 409.90`) · `scoreTag(score)` (ה16) ·
> percent display incl. the zero-denominator ⇒ `—` rule · the `—`-vs-`0` discipline · fail-loud
> shape guards (R4-F9) · **and a null `budget_deviation` (T7) must propagate to a null expected
> profit — never to `gross_profit` alone**, or a project with no final hours silently reports the
> actual-labor number as its forecast.
> 🔑 **The anchor tests do not shrink** — they now assert that the JS agrees with numbers the DB
> already produces, which is a STRONGER oracle than a JS-only test, not a weaker one.
> *(`הכרעתי, הפיך` — technical execution with no product-visible meaning; disclosed to Ishay in the
> same message, overridable.)*

**What to do:** pure functions, no Supabase: `deriveRevenue(quoteTotals, changes)` (ה2) ·
`deriveGoodsCost(lines, changes)` (ה17/ה26) · `deriveLaborCost(assignments)` (§7.19) ·
`deriveTravelCost(param, shiftCount)` · `deriveExpectedProfit(...)` (ה27 incl. "טרם שובצו" marker) ·
`deriveFinalProfitInputs(...)` · `deriveBudgetDeviation(...)` (ה18) · `deriveDaysOverdue(invoiceSentAt,
termsDays, today)` (§7.20א) · `deriveCancellationFee(...)` → the 3 components + subtotal
(ה23/ה24/ה25/ה29; `other` ⇒ no auto proposal; **band boundaries INCLUSIVE at the 50% band —
exactly 24.0h and exactly 72.0h both ⇒ 50%** — stated so two builders don't diverge on a
money-visible edge) · `scoreTag(score)` (ה16) · **percent display with a zero denominator ⇒ `—`,
never NaN/∞** (m5's zero-denominator rule; hits the waived-cancellation whose revenue is 0) ·
fail-loud null guards (R4-F9: throw typed errors, never partial sums). **"רווח הצעה" (`deriveProfitability`, m3) is a
DIFFERENT entity — do not import, do not merge (R1-4).**
**🔻🤖 Verify:** unit tests reproduce the hand anchors digit-for-digit — `3,650.00` (**#13 FROZEN
profit** — ✏️ spec §③3 labels it "רווח-צפוי", but its own arithmetic is the frozen derivation with
`actual_hours=0`; `data-set.md §2` documents the tension explicitly. The dated correction note goes
into spec.md at guide save; the true EXPECTED-profit formula (ה27, subtracts planned labor) is
tested against #15's hand-computed `3,471.00 / 3,448.40` from `data-set.md §4`) · `3,508.00` (#14
fee subtotal) · `292.60` (Efrat's row with travel 22.60) · `69%` (display derivation 3,650/5,300) ·
`598.00/620.60` (both travel variants) · `-75.00` (the #15 change) · `5,985.00` (#15 revenue) ·
deviation `−692.00` (**source: the approved S2 mockup's deviation tile,
`02_closing_window_approved.html` — not data-set; named so the "typed, never computed" rule holds
for it too**). ⚠️ **The ה27 oracle must NOT be degenerate (reviewer's catch):** #15's
3,471/3,448.40 were computed with actual=planned hours, so expected and frozen formulas COINCIDE
on that fixture — a planned↔actual swap would stay green. Add the fixtures that distinguish them,
hand-derived at blueprint (presented to Ishay in the approval package): **#13 expected = 2,958.00**
(5,300 − 1,650 goods − 692 planned labor — the calculator's own spec-literal value) and **#12
expected = 432.50 / 409.90** (500 − 1.5h×45 = 67.50 planned labor − travel 0/22.60; #12's
actual 6h vs planned 1.5h is exactly the divergence the mutation must redden on). Test values are
typed from the registers/this table, NEVER computed by the code under test.
**מה ייחשב עובד** *(spec §③3 quoted)*: `"המספרים ב-③3 הם חוזה-הקבלה — הבדיקות נכתבות אליהם,
לא מחושבות מהקוד"`. **🌊 אדוות —** · **🗣️ אושר —**

**Step 2.2 · `src/lib/salaryReport.js` + tests** ⚠️ shared-surface
**What to do:** the ה15 collection model as pure logic (given rows → report lines: two sources,
`—` semantics for bonus/travel on compensation rows, totals) · xlsx assembly via the new dependency
(columns per א48: ת"ז · שם · פרטי-בנק · תעריף · שעות · בונוס · נסיעות · סה"כ + timestamp header +
total row — bank values ARRIVE from the RPC read, not stored in lines) · filename builder
`<MM>_<YYYY>_Payroll_Report.xlsx`.
**🔻🤖 Verify:** unit tests: the aug-2026 fixture reproduces the 5-line table + both totals; a
generated xlsx re-parsed has the exact header set and the total row.
**מה ייחשב עובד** *(P4 card quoted)*: `"לכל דיילת שורה … שורת-סה"כ"`. **🌊 אדוות —** package.json
+lockfile noted in §10. **🗣️ אושר —**

**Step 2.3 · `src/modules/08_finance/api.js` + tests**
**What to do:** reads (overview per tab · detail · salary preview · history) via the 1.5 readers ·
the four action calls + fee resolution + generate/finalize · mail sends via `src/api/email.js`
(M1: recipient=`customers.email`, subject per N-1, template `תבנית_מייל_חשבונית_מס`, attachment =
the uploaded invoice file, `entity_type='invoice'` · M2: recipient=`params.מייל_משרד_רואי_חשבון`,
template `תבנית_מייל_דוח_שכר`, attachment = the xlsx base64 in the generic base64 field,
`entity_type='salary_report'`) · three-state send outcomes (sent/failed/unknown — the engine's
contract; "unknown" never marks sent) · bucket upload helpers (invoice + report file).
**🔻🤖 Verify:** unit tests with mocked client: every write path checks row-count/RPC error; the
mail-fail path leaves `invoice_sent` untouched (P1) and salary `send_status='failed'` with resend
available (P4).
**מה ייחשב עובד** *(P1 card quoted)*: `"מייל נכשל — הסימון לא נרשם 'נשלח' … שליחה-חוזרת זמינה"`.
**🌊 אדוות —** · **🗣️ אושר —**

**Step 2.4 · 🔻👤 Phase-2 gate** — full suite green (baseline + new, zero regressions) · anchors
table shown to Ishay · a control mutation (flip one formula constant, watch the exact anchor test
redden, restore) proves the oracles bite.

---

### Phase 3 — UI

**Step 3.0 · 🔻🤖 Phase door + shared-component checkpoint**
Repeats-across-surfaces census (already drafted; verify against cards): reuse `TabsBar` pattern ·
`Th`/`Td` · `Cell`/`Val`/`Sub` · `StatTile` · `LtrFieldGroup` (balance + fee breakdown) · `Money` ·
`StatusTag` (+ ONE tone extension: `danger` for the <3 tag — red100/red700, the S2-mockup-ruled
extension; extend `StatusTag`, don't fork) · `FilterPill` · `PermissionAwareEmpty` ·
`LoadingOrError` · `ToastProvider` · `ConfirmDialog` (the P3 "חלונית-וידוא") · **`RatingStars` (EXISTS —
`src/components/RatingStars.jsx`, editable `onChange` mode; S4's entry row + S1's display reuse
it. The draft's first census called it "no precedent" — a false measurement the fresh-context
reviewer caught; do not rebuild it)**. **New, no precedent (build once, locally):** file dropzone
(S2) · month picker (S3 — custom button, no native `<input type="month">`, no prev/next arrows —
the mockup's ruling) · history card (S3 — plain `Th`/`Td` table). Nod-sweep: Q-1/Q-2/Q-3/Q-4 +
N-1…N-5 must be ruled by now (they gate 3.1–3.4's content).

**Steps 3.1–3.4 · one per surface (🗣️ brief → build → verify each)**
Fidelity source: the approved mockup (appearance) + the card (behaviour/data) + §3.7 strings.
**Shared 🔻🤖 Verify for all four:** functional AND visual (drive the flow in the live preview,
screenshots attached) · the directionality pass (label/value rects + glyph-order Range checks;
split-number rule on "5 ימים", "24–72 שעות" as a single LTR token, % pairs) · the inventory/
consistency/wording/empty-input passes (src/CLAUDE.md's five) · unit/component tests per surface.

**Step 3.1 · S1 — `FinancePage.jsx`**
**What to do:** 3 tabs with `<Ltr>` counters (shown even at 0) · per-tab column sets (the card's) ·
amber rows = actionable items only (#15 overdue · #12 clarification · #14 unresolved fee),
finished rows plain · profit column: % primary + ₪ sub-line (resolution #4's sibling — the in-file
correction) · row click → S2 (ALL tabs, incl. finished→locked view — resolution #1) · filter bar
(dates/company/number) + "נקי סינון" · the three empty/blocked/error states (permission first;
counters show `—`) · no KPI tiles (mockup ruling).
⚠️ **Q-2 note (question-anchoring):** the drawn S1 has no header action button; **Ishay's Q-2
ruling at blueprint approval decides the S3 entry control** — build per his answer (recommended:
secondary `btn-outline` "הפקת דוח-שכר" in the header row). If somehow still unruled at 3.0's door,
the door ASKS before this step opens.
**מה ייחשב עובד** *(S1 card §② quoted)*: `"לאיזה פרויקט לפנות עכשיו, ובאיזה שלב-טיפול הוא נמצא"` —
the queue answers it live for the seeded cast (tab counters, amber emphasis, days-overdue).
**🌊 אדוות —** · **🗣️ אושר —**

**Step 3.2 · S2 — `ClosingWindowDialog.jsx`**
**What to do:** `sm:max-w-lg` · identity cells locked (`Cell`/`Val`) · §7.38 banner + dropzone +
disabled "שמור ושלח" until a file is chosen (gate-note string) · feedback block per state (score
tag S1-format · reason select = the 5 CHECK strings · notes) · balance via `LtrFieldGroup` +
deviation tile + goods-shortfall tile ("אינו משפיע על הרווח") · archive button disabled with the
dual-gate note · `ConfirmDialog` before archive (א37) · cancellation view: 3 components + editable
final amount + note + "ויתור על החוב" + "סגור ללא תשלום" (`btn-outline`, NOT red — P3 rules it a
legitimate path) · credit-note flag line (A-9) · remount-on-open via `key` (house rule).
⚠️ **Q-1 note (question-anchoring):** the DRAWN states are three (active א' / locked ב' /
cancellation ג'). **Ishay's Q-1 ruling adds the awaiting-payment state + manual feedback entry +
"לא ענה" control, and its F-9 extension defines the billed-cancellation continuation** (after fee
save, view ג' gains the invoice block, then payment date — the P1 route). Build the ruled set; the
🗣️ brief renders each added state as a small mockup BEFORE code.
**מה ייחשב עובד** *(S2 card §② quoted)*: `"מה חסר כדי לסגור את הפרויקט הזה, ומה הצעד הבא"` — every
state names its missing gate; the locked view edits nothing.
**🌊 אדוות —** · **🗣️ אושר —**

**Step 3.3 · S3 — `SalaryReportDialog.jsx` + history card**
**What to do:** `sm:max-w-3xl` · month picker (custom button — mockup ruling) · preview table
(8 columns per the mockup; `—` cells per ה24/ה29; travel footnote with both variants until ה20 is
live) · "ייצא ושלח" → generate→xlsx→upload→finalize→mail→toast per outcome · **empty-month state:
"אין שעות לתשלום החודש" (P4's own words — add to §3.7 at build)** · history card below (period ·
sent date · recipient · total · download from bucket) + empty state · failed-send row with resend ·
double-generation blocked state with the locked string + "צפייה בדוח הקיים" · zero-amount rows per
N-4's ruling.
**מה ייחשב עובד** *(P4 card quoted)*: `"לשלם לדיילות נכון, פעם אחת, כל חודש — ולתת לרו"ח את
הרכיבים הגולמיים"` — the preview reproduces §③3's table; a second generation is blocked.
**🌊 אדוות —** · **🗣️ אושר —**

**Step 3.4 · S4 — `PublicFeedbackPage.jsx`**
**What to do:** outside MainLayout · `PublicConfirmPage` structure (kicker · event card · question ·
5 stars 1→5 visual order as mocked · optional textarea · big submit) · stars via the EXISTING
`RatingStars` component (editable mode — reuse, don't rebuild; extend only if its API genuinely
cannot render the mocked look, and say so) · four states א–ד with the mocked tones (ok/teal/dead) ·
submit disabled until a star (A-1) · network-fail state per N-5's ruling (the precedent's
`saveFailed` + "נסי שוב").
**Verification tokens:** mint via the 1.6 RPC manually for a live pending token (the m6 mail path
only arrives at 4.1 — don't wait for it).
**מה ייחשב עובד** *(P2 card quoted)*: `"הלקוח פותח /feedback/:token — בלי התחברות — … ושולח פעם
אחת"` — all four states reachable live; a second submit shows state ג'.
**🌊 אדוות —** · **🗣️ אושר —**

**Step 3.5 · Route + nav registration** ⚠️ shared-surface
**Measured 26/08:** `/finance` ALREADY EXISTS in `App.jsx` behind `<ProtectedRoute allow="כספים">`
serving `<UnderConstruction/>`, and `BUSINESS_MODULES` already maps 'כספים'→`/finance` ⇒ this step
is a SWAP (m5's 3.3 pattern — replace UnderConstruction with `FinancePage`, guard untouched) plus
ONE new public route `/feedback/:token` OUTSIDE MainLayout (guard-test allowlist extended
consciously).
**🔻🤖 Verify:** `App.routes.test.jsx` green AND proven able to fail (remove the wrapper, watch it
redden on exactly `finance`, restore byte-identical) · direct-URL as logistics manager ⇒ blocked
screen · both routes load live.
**מה ייחשב עובד:** the guard test names `finance` when the wrapper is removed — the screen is not
open-by-default. **🌊 אדוות —** · **🗣️ אושר —**

**Step 3.6 · 🔻👤 Phase-3 🎨 gate** — design conformance · functional states on every surface ·
keyboard operability + focus rings · validation completeness (every spec'd validation implemented;
A-1/A-2/A-3 confirmed) · the real design question ("מה לשפר?") with concrete proposals · live
screenshots of all four surfaces + both mails rendered.

---

### Phase 4 — Ripples & integration

**Step 4.1 · m6 survey-link ripple** ⚠️ shared-surface (merged m6 code + tests)
Change-list #10: `shiftEmails.js` survey-mail path fills the token URL (mint via RPC get-or-create
at send; `close_project_operationally` untouched; `sent` timing unchanged — AR-5/R4-F11) ·
`ClosingTab.jsx` + its test · **`src/lib/shiftEmails.test.js`** (locks the survey-link path at
three anchors — the change-list omitted it, the reviewer measured it) · 🔴 **flip the stale comment
at `shiftEmails.js` ("הקישור קבוע — הכרעת-ישי 13/08")** — it asserts the OLD behaviour; rule 13(ח)
class · Google-Forms param stays, orphaned (spec's ripple ②).
**🔻🤖 Verify:** m6 + shiftEmails suites green · a real operational close in the live app produces
a mail whose link opens S4 state א' (screenshot).
**מה ייחשב עובד** *(spec ripple ① quoted)*: `"מילוי-הלינק במייל-מ6 עובר מ-קישור_בסיס_סקר_לקוחות
ל-URL-הטוקן"`. **🌊 אדוות —** · **🗣️ אושר —**

**Step 4.2 · m2 customer-metrics ripple** ⚠️ shared-surface
Change-list #11 + RC-6: `deriveCustomerMetrics` gains the two ה8 filters (finished-or-resolved-
cancelled profit population was §7.79↳'s extension; avg feedback = completed only) · satisfaction
filter in `matchesCustomerFilters` + `CustomersPage` pill · widened selects in the two api readers
(flip the privacy comment deliberately) · `projectAmount` += Σ changes (A-9/A-10 land where drawn) ·
stars activate on the customer card (`RatingStars` display mode).
**🔻🤖 Verify:** m2 unit tests (the 5 files the change-list names) green with new fixtures ·
customer card of #13's owner shows the avg + the filter finds them.
**מה ייחשב עובד** *(ה8 quoted)*: `"רווח-מצטבר = פרויקטים ב-finished בלבד; ממוצע-משוב = בעלי
feedback_status='completed' בלבד"` *(+ §7.79↳'s resolved-cancelled extension)*.
**🌊 אדוות —** · **🗣️ אושר —**

**Step 4.3 · Doc ripples, register write-backs & debt consumption**
§6: mark m8's shares paid on the consumed rows (salary-report debt · bank cross-check · mail-engine
share · m6-dictations · RC-6 · ה30 token) — the three outbound contracts (מ11/מ10/מ7) already exist:
cite, never duplicate · 🔴 **§7 write-backs (rule 13(א)/(ו) — WITH Ishay, never alone): §7.52 and
§7.68 flip ⚪→🟢 now that 1.5/1.2 executed them; snapshot line re-counted** · db_roadmap M8 rows
flipped + §10 entry · spec.md §③3 gets the dated ✏️ anchor-label correction (disclosed at approval) ·
`docs/automations.md` if the send flows touch it · micro-guide + STATUS/LOG per end-of-session
protocol · recommend `regin-docs-sync` (13(ז) — Ishay clicks).
**מה ייחשב עובד:** every register a fresh session reads agrees with the code on disk.
**🌊 אדוות —** (this step IS the ripple sweep). **🗣️ אושר —**

**Step 4.4 · E2E + smoke + accessibility + full regression**
New `e2e/finance.spec.js` (S1 tabs render with live anchors · S2 opens · gate-notes present ·
salary history renders) + `e2e/public-feedback.spec.js` (network-intercepted: the four states) ·
smoke anchors for `/finance` · axe scan rows for S1+S4 · **pre-check: `grep -rn
"awaiting_invoice\|awaiting_payment" e2e/` — any existing assertion that m8's new transitions
could break is fixed WITH its spec, not silenced** (the ripples blind-spot) · the R4-F15 regression
test (salary write moves no project status) · full four-name run: `test:run` · `smoke` · `test:e2e`
· `gate` — each reported by name with counts vs baseline · the F16 oracle re-run (`#8 → 5,355.00`
digit-identical after the overview extension).
**מה ייחשב עובד** *(spec §④ quoted)*: `"gate+רגרסיה ירוקים — בלי שדוח-שכר מזיז סטטוס-פרויקט
(בדיקת-R4-F15)"`. **🌊 אדוות —** · **🗣️ אושר —**

**Step 4.5 · 🔻👤 Phase-4 gate** — regression evidence + ripple summary + honest open-items list.

---

### Phase 5 — QA & handoff

**Step 5.1 · Live acceptance journeys (credentialed, screenshots at every station)**
Per spec §④ "מה ייחשב עובד", on the live app with the finance identity:
1. **מסע #12 end-to-end:** upload a real (dummy PDF) invoice → "שמור ושלח" → the mail LANDS in
   Ishay's real inbox (`ishay1997@gmail.com` — the test-mails convention) → tab flips → payment
   date → feedback via the REAL public link (token minted by 4.1's flow) → archive → frozen profit
   equals the hand-derived number for #12's data → the row in "הסתיימו".
2. **Cancellation fee:** cancel a throwaway demo project through m6's real dialog → it appears
   immediately in "ממתין לחשבונית" flagged → the proposed components match hand math → resolve.
3. **Salary report:** generate for a month with unsigned rows → xlsx opens with the exact columns ·
   totals match §③3's variant table → mail lands → double-generation blocked → history row +
   download works.
**Demo-data note:** journeys run through REAL mechanisms (no synthetic DB writes — e2e/CLAUDE.md's
rule); any demo-row realignment for the conference is proposed to Ishay separately, not improvised.

**Step 5.2 · 🔻👤 Closing audit** — `module-close` template in a FRESH session; independent
re-verification → DoD typed-echo → PR instructions + 🧩 browser prompt (iron rule 17).

---

## 7. 📊 QA Matrix

| Test type | Planned | As-run (closing audit fills) |
|---|---|---|
| Unit | `projectFinance` (anchors!) · `salaryReport` · `api.js` · ripple suites (m2/m6) | |
| Integration | RPC round-trips under impersonation (rolled-back), incl. negative gates | |
| E2E | `finance.spec.js` · `public-feedback.spec.js` · smoke anchors | |
| Regression | full four-name run vs baseline · R4-F15 status test · m3 quote screens after ה30 · m4 form after bank split | |
| UAT | Ishay drives journey 1 himself at the 🎨/closing gate (his stop) | |
| Security/Pen | RLS matrix on 4 new/changed tables (positive control first) · anon exposure pair on the public RPCs · rate-limit proof · token-death proof | |
| Performance | N/A at this scale — S1 reads ≤ dozens of rows; note only if the overview reader exceeds 1s | |
| Usability | the 🎨 gate (3.6) + closing UX audit | |
| Compatibility | Chromium (house config); cross-browser = M12 | |

### 🔴 The measured boundary of the automated gates
`npm run test:e2e` silently excludes smoke (`--grep-invert בדיקת-עשן`); E2E does not run in CI at
all; `check:bidi` misses `N/M` shapes and everything needing a live Range measurement; ESLint is
not a compile gate (build before commit). Every gate result is reported BY NAME.

## 8. ✅ Definition of Done

### 8.1 Canonical (instantiated)
- [ ] `npm run verify` green · full suite ≥ baseline, zero regressions
- [ ] every migration applied via MCP after typed-echo · `docs/schema.sql` regenerated by catalog
      queries · migration+snapshot committed together
- [ ] `db_roadmap.md` M8 rows flipped + §10 entries · §6 inbound debts marked paid (the three
      outbound contracts already exist — cited, not duplicated)
- [ ] §7.52 + §7.68 flipped ⚪→🟢 with Ishay (rule 13(א)/(ו)) · snapshot line re-counted
- [ ] CLAUDE_CODE_LOG + STATUS current

### 8.2 Module-specific (each with its measurement)
- [ ] The four §③3 anchors reproduced by tests AND by the live screens (3,650.00 · 3,508.00 ·
      292.60 · 69%) — checked against the spec's numbers, never against the code's own output
- [ ] Journey 1 (#12 end-to-end) completed live; both mails opened in Ishay's real inbox
- [ ] `salary_reports` UNIQUE blocks a second generation (proven live once, rolled back or on a
      sacrificial period)
- [ ] Salary write moves NO project status (R4-F15 test red-proven once by inverting, then restored)
- [ ] Bank details: logistics/recruitment impersonation reads `hostess_bank_details` ⇒ 0 rows;
      recruitment still edits via the m4 form (positive)
- [ ] Feedback token dies at archive (live proof: state ד' after archiving)
- [ ] `%` primary / `₪` sub-line on every list; frozen ₪ is what's stored (`project_finance` row
      inspected live)
- [ ] Cancelled project with resolved fee appears in customer cumulative profit (§7.79↳) — one
      fixture proves it
- [ ] Zero new unexplained advisor findings (predicted-vs-measured table written)

### 8.3 UX & validation
- [ ] The 🎨 gate passed: §4 design · states (loading/empty/no-results/error+retry/success) on all
      four surfaces · keyboard operability + focus rings · every spec'd validation present ·
      spec-silent validations (A-1/A-2/A-3) confirmed with Ishay

### 8.4 Post-merge note — NOT audit checkboxes
PR opened base:`dev` · CI green · merged — after the closing audit's YES; the audit confirms
*mergeable*, never merges (module-close boundary).

🔴 **AND ONE REAL POST-MERGE MIGRATION IS OWED — `C2`. This is a work item, not a note.**
**What:** `alter table hostesses drop column bank_name, bank_branch, bank_account` — the destructive
half of ה19, deliberately split out of migration C on 27/08/2026 (§10, that date).
**Why it could not run with C:** the code live on `origin/main` writes those three columns directly
(`HostessFormDialog.jsx:217-219`) and reads them (`HostessViewCard.jsx:315`), and production and
development share ONE Supabase project — so dropping them would have broken the live hostess form
from the moment of apply until m8 merged and deployed, days later, with the 28/08 interim
presentation in between. **Measured, not assumed** (`git show origin/main:…`, 27/08/2026).
**When:** after m8 is merged to `dev`, promoted, and the deploy is confirmed live.
**Its contract, which is more than a `drop`:**
1. **Re-copy first.** In the window, production's old code keeps writing bank details to the PARENT
   columns; a hostess created or edited through the live site during it will have no child row.
   C2 must copy `hostesses` → `hostess_bank_details` **before** dropping anything, or that hostess
   silently loses her bank details.
   🔴 **AND THE CONFLICT CLAUSE MUST BE GUARDED — a bare `on conflict do update` corrupts data
   in the other direction, found 27/08/2026 at the 1.8 gate.** The window has TWO halves and they
   run opposite ways: **before** the deploy, `origin/main` writes the PARENT and the child goes
   stale; **after** the deploy, m8's `api.js` writes ONLY the child (`splitBankFields`) and the
   PARENT goes stale. An unguarded `do update` runs after the deploy and therefore **overwrites
   fresh child rows with stale parent values** — the exact failure the re-copy exists to prevent,
   pointed backwards, and it would surface as wrong bank numbers on a salary report to the CPA.
   ⇒ **the copy overwrites only where the parent is genuinely newer:**
   ```sql
   insert into hostess_bank_details (hostess_id, bank_name, bank_branch, bank_account)
   select h.hostess_id, h.bank_name, h.bank_branch, h.bank_account
     from hostesses h
    where coalesce(h.bank_name, h.bank_branch, h.bank_account) is not null
   on conflict (hostess_id) do update
      set bank_name    = excluded.bank_name,
          bank_branch  = excluded.bank_branch,
          bank_account = excluded.bank_account
    where hostesses_updated_at_is_newer;   -- see below
   ```
   The `where` on the conflict action compares the two `updated_at` columns — both tables carry one,
   both maintained by `extensions.moddatetime` — so a row m8's code just wrote is left alone.
   ⚠️ **`excluded` cannot see the parent's `updated_at`** unless it is selected into the insert, so
   either add it to the column list or re-join `hostesses` in the `where`. **Decide that when C2 is
   written, against the live DDL — not from this snippet.**
2. Then drop the three columns.
3. Then delete the three `⚠️ … תימחק במיגרציה C2` column comments' subject matter from
   `docs/schema.sql`, and strike this block.
🔑 **Until C2 runs, ה19 is NOT closed** — the exposure it exists to fix (anyone with 'דיילות' can
read bank details, because RLS is row-level) is still open. **§2.2's "Bank-details protection (ה19)
… ✅ complete here" row is therefore NOT yet true**, and the closing audit must check C2's state
rather than trusting that row. *(Registered in three places on purpose — here, `db_roadmap` §10,
and §10 below — because a debt with one home is a debt that gets lost.)*

## 9. 🔄 Self-Update Protocol

(a) At every step transition, update §1 (header + step table) in the same session, before moving
on. (b) Any deviation → inline `↳ as-built` on the step + a dated §10 line. (c) The Stop hook
blocks session end if `src/modules/08_finance/**` changed but this guide didn't. (d) The
`CLAUDE.md` end-of-session protocol applies (LOG → STATUS). (e)–(g): per CLAUDE.md iron rules
13/15/16 + the end-of-session protocol. (h) On ENTERING a phase: sweep §3.4/§3.5/§3.6 for items
anchored to it and settle them with Ishay at the phase door, not mid-step.
(i) Compaction: a closed phase compacts to a done-table + carry-forward; never the active phase,
§3, or §10; archive the pre-compaction copy first.

## 10. 📝 Deviations & Tech-Debt Log

### Pre-build verification of the approved spec — run 26/08/2026, before a single step was written
- **Simulated-build session** (constrained to spec.md §①'s reading list only): **5 blockers ·
  ~16 divergence points · 5 conflicts · verdict: the list alone is INSUFFICIENT** (needs
  `schema.sql`, the §3 matrix, an `e2e/` transition sweep, `products_and_params.md` — all added to
  §2.8). Blockers → §3.4's Q-1…Q-4 (Ishay) + B-8…B-12/A-7…A-10 (anchored closures/assumptions) +
  T13/T14 (the 🛑 table). The stale change-list rows (5/13) and the false rate-limit pointer are
  recorded so no build session re-imports them.
- **Fresh-context blueprint reviewer** (+ Contrarian + Outsider lenses): **11 findings · 4
  conflicts · 5 contrarian · 4 outsider — ALL folded into this draft** (the load-bearing ones:
  the `🚧 מ11` line already existed — cite-not-create · per-build-unit fields added to every
  Phase-3/4 step · Q-1 extended to the billed-cancellation continuation · the ה30 pointer and
  regression persona corrected · `RatingStars` reuse · F16 decided as overview-extension · §7
  flips owned by 4.3 · the ה27 oracle de-degenerated with #12/#13 hand values · N-4/N-5/N-6
  added). Its denominator walk independently confirmed: every ruling in `processes-approved.md`
  has an owner. Its 14 fact spot-checks: 10 held, 4 were the findings above.
- **Execution rehearsal** (the template's third pass — wrote ALL of Phase 1's SQL on paper,
  apply-ready): **verdicts: 5 steps BUILDABLE-AS-WRITTEN · 2 BUILDABLE-WITH-GUESSES · door
  procedure sound. 3 red gaps + 12 smaller — ALL CLOSED into owning steps + 🛑 rows T15–T22:**
  the unmarked-👤 door (1.0 retagged, its Ishay-checkpoint written out) · the missing fifth action
  (B-13, ה22 extended with disclosure) · the unstated salary-collection population (→ **Q-5**, the
  rehearsal's "single most likely to build wrong") · N-4 re-anchored into 1.5 · feedback-editable-
  until-archive (B-15) · the credit-note trigger measured reachable-only-one-way (B-14) · travel
  only-where-worked (B-16) · FK/CHECK/policy-level/param_type contracts (T19/T20/T22) · the
  `feedback_token` staff-exposure line added to §4.5. Its Phase-1 SQL remains in the blueprint
  conversation as the builder's reference sketch — the GUIDE stays the contract, the builder
  writes the code (Ishay's 14/08 rule).

### Dated entries
- 🔴 `28/08/2026 00:5X` — **AN OPEN PRODUCT QUESTION ISHAY RAISED, AND A CITATION THAT DOES NOT
  RESOLVE. Neither is closed; both are his to rule after the conference.**
  **What he asked:** *"איפה השאלון שבניתי עם 3 שאלות?"* — he remembered building a customer survey
  and could not find it on the new page.
  **He was right.** `params.קישור_בסיס_סקר_לקוחות` is seeded with a **live Google Form**
  (`https://forms.gle/YFJobqmgpBCqf1x87`) carrying **four** 1–5 rating questions (staff
  professionalism · manager communication · registration experience · product quality — C5 §5.8.8).
  m6 mails a link to it at operational close. **m8's Discovery replaced it** with a single star
  rating + free text, recorded at `processes-approved.md` as a *"סטייה מנומקת"* and marked
  **reopenable without ceremony**.
  🔴 **AND THE PART THAT MATTERS FOR THE REGISTERS: that deviation cites *"מקורות ב-`world-sources.md`"*
  and a *"~75 שניות לשאלה יחידה"* figure — and `world-sources.md` CONTAINS NO SUCH ENTRY.** Measured
  27/08 00:5X: its only CSAT row is about the **<3 phone-clarification threshold**, a different
  decision. ⇒ **the "this is the world standard" half of that justification is unsourced.** The
  *internal* half is sound and independently checkable, and is what the recommendation now rests on:
  **the schema stores ONE score, so four questions need a collapse rule — and that rule is §7.37,
  which is still open.** Four questions without it cannot enter the system at all.
  ⚠️ **The mechanism difference Ishay had not connected, and it is the real decision driver:** with
  the Google Form the four answers **never reach REG-IN** — someone reads the form and types one
  number by hand. With the built page the score lands automatically and unblocks the archive gate.
  So this is not "richer vs simpler", it is **manual-and-detached vs automatic-and-integrated**.
  **‏✅ RULED `28/08/2026 01:1X` — by Claude, under Ishay's explicit delegation** (*"תציג את
  האפשרויות ותחליט בעצמך עם סיבה… תנסה להקל עלי ולא להוסיף לי עבודה"*). **The one-question page
  STAYS — and the reason it stays is not the reason originally written.**
  🔴 **The research killed our own argument, and that is the most useful thing it did.** The claim
  that short surveys get materially better response rates **does not survive at this magnitude**:
  **Sandelin 2022** (SOM Institute, U. Gothenburg — the full PDF was read, not a snippet) measured
  **205 vs 149 questions** and found a **2.7-point** gap (48.5% vs 45.8%) with **no effect at all
  among web respondents**, and no data-quality loss. Rolstad 2011's meta-analysis calls the
  association heterogeneous and advises deciding **on content, not length**. Cochrane MR000008:
  direction holds, **I²≈91%**. The dramatic figures in circulation (83%↔42%) are survey-vendor
  marketing, and two major vendors disagree by **37 points**. ⇒ **anyone defending our design on
  response rates would lose to one question at the conference.**
  🟢 **What replaces it — internal, and checkable by Ishay himself:** the OLD path already threw away
  everything four questions bought. The customer filled four ratings ⇒ **a human read them and typed
  ONE number in.** So option A paid a long form's full price — an external tool, customer burden, and
  **a manual transcription step standing between the event and its financial closing** — and banked
  none of it. This is not survey theory; it is an incoherence in A *as it was actually built*.
  🔑 **And the steelman's real objection — "a bare 3 does not say what broke" — is ALREADY answered
  in this system, and not by free text.** A score <3 forces a phone clarification, and the manager
  picks from **five structured reasons enforced by a live DB CHECK**
  (`projects_negative_feedback_reason_check`, verified 28/08: `איחור דיילות` · `תפקוד דיילות` ·
  `איכות תגים` · `ניהול לקוי` · `אחר`). ⇒ **the middle pattern the research recommends — one score
  plus diagnostic tags on low scores — already exists here**, with the tag chosen by the manager
  after a call rather than by the customer. A customer-facing tag picker would **duplicate** it.
  ⏳ **Declared gaps, not filled by invention:** **no industry body publishes any standard for
  client-side post-event feedback** — the EIC's canonical `APEX Post-Event Report` contains **zero
  satisfaction fields** and prescribes a **face-to-face debrief** instead; and there is **no academic
  literature at all** on agency→corporate-client event surveys (it is all about attendees).
  **Write-backs done the same session:** the unsourced clause struck in `processes-approved.md` with
  a dated ✏️ note · the real sources added to `world-sources.md`, which is the file the dead citation
  pointed at · the negative finding recorded in its §ה.
  *(Cross-referenced in `module-6.md` §10 — m6's guide is what proved the page was a 🔮 candidate
  there and never a ruling, so the ruling is m8's to own.)*
- 🟢 `28/08/2026 00:3X` — **ISHAY RULED, mid-run, on two items this build had escalated:**
  **‏① The S3 preview state is APPROVED FOR BUILD** (*"מאשר את התצוגה המקדימה"*). It was the
  mockup-fidelity lens's top finding: S3 rendered its 8-column table only AFTER
  `generate_salary_report`, **which is irreversible** — so the manager pressed "ייצא ושלח" without
  ever seeing what she was about to send the accountant. Owned by a dedicated agent in the phase-4
  workflow.
  **‏② BOTH fix migrations are approved in principle** (*"מאשר את 2 המיגרציות… קראתי היטב על מה
  מדובר"*), **and he offered to let them run tonight or at 11:00 after the presentation.**
  🔴 **They were NOT applied on that approval, and the reason is a rule, not caution:** the DB
  protocol's typed-echo gate states that *a plain approval is not sufficient to apply*. Ishay types
  the migration name; that is the gate. **Recommendation given: wait until after the 28/08
  presentation** — the payoff is asymmetric. Applying tonight buys only the ability to verify one
  upload path; what it risks, however small, is the demo he has been building toward. **Measured, so
  the "small" is not a feeling:** H2 replaces a function with **zero production callers** (module 8
  is not merged or deployed), and H1 only widens a MIME whitelist that nothing currently uses for
  xlsx — so neither can affect the demo, and neither is urgent enough to spend the risk.
- `27/08/2026 23:1X` — **PHASE 3 IN FLIGHT (12-agent workflow). Three leaf surfaces built; S1 and the
  route step still running; verification not yet run.** Recorded mid-run because the Stop hook fired
  and a half-built tree must not read as a finished one.
  ⚠️ **Deviation to check at the gate — TWO FILES EXIST THAT NO AGENT WAS GIVEN OWNERSHIP OF:**
  `src/lib/feedback.js` (+ test) and `src/modules/08_finance/publicApi.js`. The S4 task named exactly
  `PublicFeedbackPage.jsx` + its test. **The architectural reason is plausible and may well be right**
  — the public page is unauthenticated and cannot share the `'כספים'`-gated `api.js`, so a separate
  anon client path plus pure feedback logic is a sensible split, and neither file collided with
  another agent. **But it was not authorised, and "plausible" is not "verified":** the orchestrator
  must confirm at the gate that (a) both are genuinely reachable and used, (b) `publicApi.js` does not
  quietly widen what an anonymous caller can reach, and (c) neither duplicates something `api.js`
  already exports. **Logged as `הנחתי` on the agent's behalf** — it filled a structural gap the task
  file did not describe.
- 🔴 `27/08/2026 22:1X` — **PHASE 2 COMPLETE — and the adversarial panel found TWO REAL DEFECTS IN
  ALREADY-SHIPPED PHASE-1 WORK. Neither is fixed; both have a migration written and NOT applied.**
  **Built by a 9-agent workflow** (3 builders · 3 read-only adversarial lenses · 3 fixers; 0 errors,
  2.06M tokens, 64 min), then re-verified independently by the orchestrator.
  **Evidence, by name:** suite **1,572 / 59 files exit 0** (baseline 1,454 / 56 ⇒ **+118, zero
  regressions**) · `npm run gate` **exit 0** · orchestrator cross-check **8/8** · a sign-flip mutation
  on the deviation term reddened **7 tests across two files**, then the file was restored
  **byte-identical** (`sha256sum -c` OK).
  🔑 **The cross-check is the part worth keeping:** it fed the LIVE DATABASE's measured outputs
  through the AGENT-written functions and compared against the SPEC's hand-computed anchors. Three
  sources, none of which saw the other two — a strictly stronger oracle than any test the same
  session could author.
  **‏🐛 DEFECT H1 — the `finance` bucket rejects xlsx, so the salary file can never be stored.**
  Measured live: `allowed_mime_types = {application/pdf, image/jpeg, image/png}`. ⇒
  `uploadSalaryReportFile` cannot succeed, `report_file_url` stays NULL, and **three explicit P4
  promises die silently** — history-with-download, resend, and §7.68's proof-of-what-was-sent.
  **Not a recorded decision that anyone made:** the m6 migration that created the bucket carries
  *"לא הוכרע (M8 יחליט)"* on the `finance` row — the MIME list was a declared placeholder and m8 is
  the module that owes the ruling. ה13 fixed only the SIZE; ה4 mandates xlsx. Migration written:
  `20260827221902_module8_h1_finance_bucket_allow_xlsx.sql`.
  **‏🐛 DEFECT H2 — the cancellation-fee band pays 0% instead of 50% at exactly 72.0 hours.**
  ה24 reads *">72 = 0% · **24–72 = 50%** · <24 = 100%"* ⇒ 72.0 sits INSIDE the 50% band. The shipped
  body evaluates `when v_hours >= v_part_h then 0` first, so exactly 72.0 falls to 0%. (24.0 is
  correct.) Verified three independent ways: the approved ה24 · step 2.1's own wording · the live
  params (24/72/50). **Severity, honestly: only fires at exactly 72.000000h**, which a
  microsecond timestamp makes near-impossible in real use — but it is a money error against the
  customer, on a boundary the spec defines explicitly. One operator. Migration written:
  `20260827221903_module8_h2_fix_cancellation_band_72h.sql` (body pulled live from
  `pg_get_functiondef`, per the migrations rule; the only diff is `>=` ⇒ `>`).
  ⏸️ **Why neither was applied:** applying needs Ishay's typed echo, and the **28/08 interim
  presentation runs on this same Supabase project**. **Proven not applied, not merely asserted:**
  `list_migrations` ends at `20260827163737_module8_n1b_drop_hostesses_languages`; neither new
  version appears.
  **‏🔧 Two more things the lenses caught, both fixed inside phase 2:** `scoreTagText`'s `withScore`
  option reproduced a tag format that cross-surface resolution #4 had **retired** — deleted, and the
  test now BLOCKS the retired shape · `deriveDueDate` swallowed `undefined` (shape drift) into a
  measured `—`, contradicting the file's own header — now throws, matching `deriveExpectedProfit`.
  **‏🛡️ And one fixer REFUSED its instruction, correctly:** a verifier's suggested fix would have
  rewritten Efrat's fixture to bonus 250 / total 542.60 — **overwriting the recorded acceptance
  anchor 292.60**. The fixer applied the finding's INTENT additively (a separate
  `efratWithPersonalBonus` variant) and left all three anchors byte-identical. This is the
  conflict-question rule working in the direction nobody tests for: a review being wrong.
  **‏🎨 Shared-component change made serially by the orchestrator** (four parallel phase-3 agents
  would collide on it): `StatusTag` gains the `danger` tone. Colours read from the approved mockup's
  own declaration (`.tag.danger{background:var(--red100); color:var(--red700)}`), not chosen by eye.
  Without it `scoreTag()`'s `danger` fell through `?? TONES.muted` and rendered **grey with no
  error** — "טעון בירור" would have looked like a neutral status.
  **‏📦 Dependency, decided and de-risked before three agents were sent to depend on it:**
  `write-excel-file` (runtime) + `read-excel-file` (dev). The npm `xlsx` package is stuck at 0.18.5
  with known advisories and its fixed line is CDN-only. A round trip was PROVEN before use — Hebrew
  survives, decimals survive, and **a ת"ז written as a String type comes back a string**, which is
  the one that matters: an ID silently converted to a number loses a leading zero on a document that
  goes to the accountant. Its browser entry graph was traced and reaches no Node builtins.
  **‏⏭️ Two open items carried into phase 3:** `assertFinanceShape` has ZERO production call sites ⇒
  **orchestrator ruling: every screen calls it on an RPC row before deriving** (one shape gate at the
  boundary is the design; that is why the leaf derivations stay simple) · an empty payroll month
  still mails a header-only xlsx to the CPA — P4 calls that case *"תקין"*, and the only clean guard
  lives inside `generate_salary_report`, i.e. a phase-1 migration **and a product question for
  Ishay**, so it was escalated rather than patched.
- `27/08/2026 20:45` — **PHASE-2 DOOR (step 2.0) CLOSED. Baseline re-measured: 1,454 tests / 56
  files, exit 0** — byte-identical to the Phase-1 hand-off figure, so Phase 2 starts from a clean,
  re-verified floor. **Ledger sweep result: nothing new for Ishay** — every §3.4 item (Q-1…Q-5,
  N-1…N-6) was ruled 26/08 and every §3.5 assumption (A-1…A-10) is recorded; the door's "settle with
  Ishay" branch legitimately did not fire. **Two measured findings did land:**
  **① `הכרעתי, הפיך` — step 2.1's function list was superseded by Phase 1** and has been corrected
  in place above (see the boxed `↳ SCOPE CORRECTED` note on step 2.1). The list was written 26/08 at
  blueprint, *before* the DB existed; `finance_project_money` now owns every money formula it names.
  A builder obeying the step's literal text would have re-implemented the calculator in JavaScript —
  **the exact second-profit-number failure F16/R1-4 forbid**, and it would have passed its own tests.
  The phase preamble (added 27/08) already forbade it; only the step's own text still contradicted
  it. Technical execution, no product-visible meaning ⇒ decided, logged, disclosed, overridable.
  **② `אומת-על-ידי` — two of the four acceptance anchors DO NOT reproduce from a plain read of the
  live DB, and the phase preamble's claim that three of four are "already produced by the database
  itself" is therefore not reproducible as written.** Measured 27/08 20:4X:
  · **#13 `3,650.00` ✅ reproduces** on a plain read (`finance_project_money(13)`), and so do
    `−692.00` deviation, `#15 5,985.00` revenue, and all three expected-profit anchors.
  · **#14 `3,508.00` ❌ does not.** `finance_cancellation_fee_proposal(14)` returns
    `proposed_fee = NULL` — because **no project in the live seed is `cancelled`**: #14 is
    `in_progress` with `cancelled_at IS NULL`. Only the goods half (`goods_at_price = 3,180.00`)
    reproduces. **This is not a defect** — `data-set.md §0` tags the whole #14 cancellation 🎭
    (demo scenario, "26/08 11:00 🎭 #14 מבוטל … בדיוק 30 שעות לפני"); the seed was never meant to
    carry it. But the fee's compensation half is unverifiable against the live DB **without first
    writing a cancellation**.
  · **Efrat's `292.60` ❌ does not** either. Her `assignments.travel_amount` is `0.00`, so her row
    totals `270.00` today. That is CORRECT per ה14 — travel is *stamped at generation* — so 292.60
    only exists after `generate_salary_report` runs, and that call **signs rows irreversibly**.
  🔴 **The consequence for Phase 2, and it changes nothing about the test values:** the acceptance
  numbers are typed from the registers either way (§4.3: "tests are written TO these numbers, never
  re-derived from code"), so the unit tests are unaffected. What IS affected is any plan to
  *cross-check* those two anchors live — that needs a **live-DB write**, which is on the ask-first
  boundary (`_shared/discipline.md` (ג)) and, with the **28/08 interim presentation tomorrow**, was
  NOT run. Recommended: defer both probes to after the presentation, as part of 5.1's live journeys.
- 🔴 `27/08/2026 13:2X` — **DEVIATION FROM THE APPROVED PLAN: migration C split into C (safe half,
  now) + C2 (the column drop, post-merge). Presented to Ishay at the gate; nothing applied before
  his ruling.**
  **The plan said** (step 1.3 / 🛑 T3): copy-then-drop in ONE migration, with the client rewire in
  the same step, "or every new-hostess save breaks in the window".
  **What that missed, measured 27/08/2026:** T3 reasons about the BRANCH's code. **Production runs
  its own, older copy** — `git show origin/main:src/modules/04_hostesses/HostessFormDialog.jsx`
  writes `bank_name`/`bank_branch`/`bank_account` straight into `hostesses` at lines 217–219, and
  `HostessViewCard.jsx:315` reads them — **and there is ONE Supabase project for production and
  development** (`.env.local` → `yfeovxppnfoafmfbdfvh`, the same ref every migration in this session
  was applied to). ⇒ the drop breaks the LIVE hostess form the instant it applies, and keeps it
  broken until m8 merges and deploys — days, with the **28/08 interim presentation** in between.
  **The split:** C creates the child, copies the 26 rows, adds both policies, and **relaxes the three
  parent columns from NOT NULL while leaving them in place** — relaxing a constraint never breaks a
  writer that still supplies a value, so production is untouched. C2 (§8.4) does the drop later,
  after a re-copy.
  **What the split COSTS, stated rather than buried:** ה19's actual exposure stays open until C2
  (status quo, not a regression), and during the window bank details live in two places — a hostess
  edited through production writes to the parent only. C2's re-copy step exists for exactly that.
  ⚠️ **This also means §2.2's `Bank-details protection (ה19) … ✅ complete here` is not true on
  merge day** — the closing audit must verify C2, not that row.
- `27/08/2026 12:39–12:4X` — **BUILD OPENED · step 1.0's 🤖 half complete; standing at its 👤 gate.**
  Branch `ishay/module-8-finance` cut from `origin/dev` `585ad27`. **All 8 door re-measurements held
  — zero drift since 26/08**, so no pre-emptive guide rewrite was needed. Baseline **1,440 tests /
  56 files, exit 0**. **Three corrections landed from live measurement** (the ⑥2 block's own rule —
  a measurement beats its dated facts): ① **T1's stated mechanism was wrong** — the live
  `projects_closed_needs_report` body never mentions `cancelled`; it requires
  `summary_report_url IS NOT NULL` for `awaiting_invoice`/`awaiting_payment`/`finished`. Same
  conclusion, different mechanism, and 1.5's `archive_project` must assert that precondition itself
  or a legitimate archive dies on a raw CHECK instead of the Hebrew `P0001` contract. ② **§2.7's
  `E2E_FINANCE_*` "not configured" note was stale** — the pair exists; the 👤 branch that would have
  gone to Ishay did not fire. ③ T11 closed (MCP live).
- 🔴 `27/08/2026` — **A RISK THE BLUEPRINT DID NOT CARRY, raised at the 1.0 door: the 28/08 interim
  presentation is TOMORROW** (`00_roadmap.md` §3 row א׳ + §4 row M2.5 — *"תהליך אחד מקצה-לקצה עובד
  באתר החי"*), and Phase 1 applies **7 migrations to the live production project**, three of which
  touch code that is already merged, demoed and in the live path: the **ה30 rider inside 1.1**
  (narrows an existing `quote_services` read → m3's quote screens), **1.3** (drops three NOT NULL
  bank columns and rewires 5 m4 client sites in the same step), **1.4** (redeploys the shared
  `send-email` function), **1.7** (rewrites the merged m6 `cancel_project`). Neither the blueprint,
  the 🛑 table, nor the ⑥2 block mentions the presentation date. 1.1-without-the-rider and 1.2 are
  provably additive (new table · new nullable columns · relaxing NOT NULL on a deny-all table with
  no reader) and carry no demo risk. **Ishay's call — presented at the door; nothing applied.**
- `26/08/2026 22:43` — **BLUEPRINT APPROVED** (Ishay: *"מבחינתי אחרי הבדיקה הזו יש אישור"*).
  Sequence of the approval: Q-1…Q-5 ruled per recommendations (22:40) → his migrations-impact
  question answered by a walked check (zero table/column/policy changes — all five land in RPC
  bodies/UI the plan already carries; only N-4 touches the 1.5 transaction and it was approved
  as recommended) → full approval incl. N-1…N-6. Saved as `module-8.md`; ⑥2/⑥3 rewritten in the
  step guide; the spec §③3 anchor-label ✏️ correction landed (disclosed pre-approval).
