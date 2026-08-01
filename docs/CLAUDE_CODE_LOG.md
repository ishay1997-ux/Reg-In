<div dir="ltr">

# CLAUDE_CODE_LOG — Claude Code's internal work journal

> This file is **not** for Ishay to maintain — it is for my (Claude Code) own creation and self-update between sessions, so context isn't lost. Ishay may read it, but keeping it current is my responsibility. Update it at the end of every meaningful session.
> Language: **English** (this is a Claude-facing file, like `micro_guides/` and the templates; Hebrew appears only as data — role/module names, UI strings, §7 refs, migration names). Other truth-sources not duplicated here: `docs/PROJECT_MASTER.md` (schema/permissions/screens + §7 open questions), `../CLAUDE.md` + the directory-scoped `CLAUDE.md` files (iron rules; the DB protocol lives in `supabase/migrations/CLAUDE.md`), `../STATUS.md` (module status board, Hebrew), `docs/guides/00_roadmap.md` (operational roadmap), `docs/archive/` (pre-28/07 full versions). *(`docs/CHANGELOG.md` was frozen 23/07/2026 — archive only, never written to.)*

## Maintenance policy (read before editing)
- **"Current State"** = a snapshot **rewritten** every time to reflect reality. Not append; never let it go stale. **No internal dates (rule F4, 09/07/2026):** a date inside Current State signals dated narrative leaked in (its place is the Session Log below). The snapshot answers "what is true now" briefly (**target ~15 lines**), not "what happened when"; dense details → reference sections / journal.
- **"Session Log"** = append-only, newest first. Detail budget: the 2–3 latest sessions in full · the next ones shortened to 1–3 lines · **a session older than 3 days that isn't among the latest 2–3 → merged into a weekly/thematic super-bucket** (header `### 📦 Week DD/MM–DD/MM — topic`), after migrating any evergreen fact to the reference sections · older/generic than that — one archive line, or deleted if all its evergreen facts already moved to the reference sections.
  > 📌 **OUTSTANDING DEBT — updated 01/08/2026 (dedicated compaction session, per Ishay's 31/07 ruling below).** The 29/07–30/07 mass this note originally flagged (measured 31/07 12:50 at 34 entries / ~325 lines, out of a 534-line narrative) is now compressed into `### 📦 Week 25–30/07/2026` (also folded in the two small adjacent 28/07 + 25/07 entries — both were already "older than 3 days" and mostly redundant with the Reference paragraphs). Every evergreen fact it carried was verified to already have a durable home (`module-3.md` §9 · `module4_smart_match_research.md` §11 · `PROJECT_MASTER` §6/§7 · the Reference paragraphs below) **before** deleting, not assumed — see the compaction session's report for the spot-checks. **Remaining debt, deliberately NOT touched this pass:** the 31/07 mass. It sits inside the 3-day freshness window (rule: keep the 2–3 latest sessions in full) and a parallel builder session was still landing entries into it the same night — compressing a moving target risks a rule-16 collision. Revisit once those entries age past 3 days.
  > **Ishay's ruling 31/07/2026 (why this needed its own session):** judgement work, not cleanup — "harvest before you delete" means a separate call per entry on which evergreen facts move to the reference sections first — and **Ishay cannot review the result** (English, written for Claude), so Claude is the only gate. Mitigation that makes it safe: **every compressed entry stays fully recoverable from `git log`**, so compaction here is reversible. *(This refines, and does not cancel, `module-close` step 💾2b ownership below: module close still guarantees it happens if a dedicated session never does.)*
- **Size self-check (measure before editing):** narrative = `awk '/^## Session Log/{f=1;next} /^## Reference/{f=0} f' docs/CLAUDE_CODE_LOG.md | wc -l` (target ≤150) · snapshot = the lines between `## Current State` and the next `---` (target ~15). `regin-docs-sync` measures and flags both on every run (measure-and-flag only). **The compaction itself is OWNED by the `module-close` skill, step 💾2b** (Ishay's ruling 31/07/2026 — the flag previously had no owner and the narrative reached 457 lines). Do NOT grant the routine compaction authority: "harvest before you delete" needs to know what the NEXT modules will need, which a memoryless routine run cannot, and its English output is unreviewable by Ishay — so a routine doing it would have no gate. Any session may of course compact when asked; module close is what guarantees it happens.
- **Realistic threshold (fixed F3, 09/07/2026): the journal NARRATIVE** (Session Log only — excluding the reference sections and Current State) **over ~180 lines → compress the old tail back toward ~150.** Never compress the 2–3 newest sessions or Current State. This is a *utility-and-cost* limit: the read tool reads 2000 lines/call, and when stuck, old narrative buries the knowledge. **The metric: bound the narrative, not the reference.** *(The old "whole-file ~250→~200" threshold was never honored — it counted the exempt reference sections and thus silently "overflowed" forever; the new threshold measures what actually gets compressed.)*
- **The trigger is measured on the whole file, but compression touches only the narrative.** If the file is large because the reference grew legitimately and the narrative is already minimal — that's fine, don't sacrifice reference to get under 250.
- **The reference sections (Gotchas / Tech-debt / DB / Templates-hooks) are exempt from the count and are never compressed** — they are the long-term memory for solving problems. Keeping them current is mandatory.
- **Golden rule — "harvest before you delete":** before shrinking a session record, every fact still relevant going forward (a debt, a DB/schema decision, an open flag, a solved gotcha/trap + how) **first migrates to the appropriate reference section**, and only then do you compress. That way shortening never loses useful knowledge. Compression is the ONLY way an old dated record changes (a deliberate exception to "never rewrite records").
- **Repeated routine records = first to shrink:** green runs of `regin-health-pulse`/`regin-docs-sync` ("all green"/"no drift") are merged into one rolling line (e.g. `health-pulse: green ×5, last 07/07/2026`), not a line per run. A run that found something stays standalone.

---

## Current State (snapshot — rewritten, not appended)
<!-- target ~15 lines · no internal dates (F4) · over budget? compress / move to journal -->
✅ Sync-verified: gate green end-to-end (31/07/2026 10:47 — gate exit 0 · 353 unit · E2E 24/24, 0 skips)
✅ אומת-סנכרון: 31/07/2026 01:02 (regin-docs-sync — 0 conflicts; 3 LOG reference lines + 4 section stamps refreshed)

**Where we stand:** Modules 1 (users/permissions) and 2 (customers) are **closed, merged to `dev`, promoted to `main`** — milestone 1 (tag `milestone-1`). **Module 3 (quotes) — Phases 1 (DB) and 2 (money SSOT) both CLOSED.** Phase 3 (UI): **steps 3.1 (PDF engine) · 3.2 (quote builder) · 3.3 (quote management) · 3.4 (real email send) · 3.5 (customer record page) · 3.6 (prices tab in /system) all DONE**, gate green (`npm run gate` exit 0), 324 unit tests, 18 permanent E2E, 6,319 ₪ exact live on screen and in the PDF. Migrations at 9. `scripts/demo-seed.mjs` seeds 4 customers + 8 quotes through the real RPCs (reversible, `--reset`). **Phase 3 is CLOSED; Phase 4's steps are all done (4.1–4.4) but its own gate (4.5) is still open for Ishay. Phase 5 started early (work-manager authorization) — 5.1 (binding acceptance scenario) CLOSED (01/08/2026). Active: 5.2.** `npm run gate` exit 0 incl. `knip` · 376 unit · **E2E 71 permanent tests**, all green. `eslint.config.js` now excludes `playwright-report`/`test-results` from lint scope (`d016c93`). ⚠️ Demo data: quote **#21** (מדיטק, approved, 6,319 ₪) and project **#7** (`not_started`) were created live by 5.1 — on top of the 3.7-close baseline (`quotes`=8 rows pre-5.1, customer 46 had 2 quotes pre-5.1). `RowAction` is shared at `src/components/RowAction.jsx`. Branch `ishay/module-3-quotes-build`, cut fresh from `dev` (`a35c92f`) after PR #9. Module 4's pre-decision round waits until M3 is done.

**Hook mechanism (29/07/2026, iron rule 16):** `check-docs-updated.sh`'s module-guide check now attributes per-file to the session that actually touched it (`protect-frozen-files.sh`'s marker stores real relative paths, not a bare flag) — see tonight's Session Log entry for why and how it was verified. Two-sessions-on-one-branch is now *survivable without cross-blaming*; it does **not** prevent two sessions building the same feature concurrently (a separate, deferred idea: per-step ownership claim).

**Governance:** single developer (Ishay), submission deadline **19/09/2026**, per-module schedule in `00_roadmap.md` §3. Overflow policy: **whole modules defer, nothing is trimmed** (leaf order M10→M11→M7; the 3→4→6+5 core, M8 and M12 never defer). **Infra freeze retired 29/07/2026** — replaced by the subtraction principle (F1): before adding governance, name what it replaces, out loud, logged.

**Quality gates (hardened 29/07/2026):** `npm run gate` = verify+dup+knip+audit+check:context, **all blocking** (was warn-only). `knip.jsonc` (renamed from `.json` for comment support) carries **no live exceptions** — the M3 not-yet-wired-API waiver was removed at 3.6 exactly as its own comment prescribed (the pattern for future waivers: dated, reasoned, self-removing — like the `react-router` audit waiver in `scripts/audit-gate.mjs`).

**Context architecture (28/07/2026):** `CLAUDE.md` is a thin root + **directory-scoped files that load on demand** — `supabase/migrations/CLAUDE.md` (DB protocol), `src/CLAUDE.md` (security/SSOT model), `docs/CLAUDE.md` (iron rule 13 + emoji legend), plus per-module `src/modules/NN_*/CLAUDE.md` (mechanically required by `check:context`/module-close §4c). `STATUS.md` holds only live state. Plugins scoped per-project (`docs/toolbox.md`).

**Branch tree:** `main` / `dev` / `ishay/module-3-quotes-build`. `ishay/module-3-quotes` and `ishay/solo-reorg` are ancestors of `dev` — **dead (rule 10), never stack on them.**

**Truth-sources:** schema `docs/schema.sql` (17 tables) · frozen spec `reference_spec/C5_clean_transcript.md`+`C6_clean_transcript.md` (grade 2) · future DB changes `docs/db_roadmap.md` · open questions `PROJECT_MASTER §7` (count always via grep) · cross-module debt `§6`. **Live module status = `STATUS.md`.**

**Stack:** React 19 + Vite 8 · **JavaScript (not TS)** · Tailwind 4 + shadcn/ui over Radix · Lucide · Supabase (Auth + Postgres 17 + RLS) · react-router-dom v7 · full RTL · alias `@/`→`src/` · session in `sessionStorage`.

**Pointers:** module 3 detail → `micro_guides/module-3.md` (Phases 1–2 compacted) · module 2 → `micro_guides/module-2.md` (🔒 closed) · module 1 RBAC → `micro_guides/module-1.md` + the DB-journal reference below · traps + tech-debt → **the reference sections at the bottom** · pre-16/07 history → `docs/archive/session_log_2026-07.md`.

---

## Session Log (newest first)
<!-- 2–3 newest in full · older than 3 days and not among them → weekly bucket '### 📦 Week DD/MM–DD/MM — topic' (after migrating evergreen facts to the reference sections, "harvest before you delete") · narrative (up to '## Reference') >180 lines → compress toward 150. Reference sections are exempt. -->

### 01/08/2026 — **Panel-lock guard: closing the hole I reported against my own item-2 work** (manager-approved)
- **The gap:** reinstating `?? 0` in `repriceLine` (`QuoteLineEditor.jsx`) failed **no test** — the four
  item-2 unit tests cover `src/lib/quotes.js`, but that fourth site sits inside a component, unexported
  and unrendered by any test.
- **E2E chosen over unit deliberately**, despite E2E not running in CI: the gap is in the *composition*
  (catalog → repriceLine → computeLinesCost → panel); only a rendered-panel assertion sees it.
- Two tests: stripped-cost ⇒ 3 dashes + product named + `not.toContainText('₪')` (a panel showing
  "0 ₪" beside the notice would otherwise pass — that *is* the bug) + an interception-counter sanity
  check; plus a **positive control** so "always dashes" cannot pass. **Watched failing on a restored
  `?? 0`**, green after restore.
- ⚠️ **Two measurement notes:** a failure in the seconds right after restoring a file was **HMR serving
  stale code**, not a verdict — re-check in isolation before concluding. And the full suite flaked once
  on two consecutive runs on a *different* rejection test each time (`:96`, then `:71`), each green in
  isolation, third full run **75/75 clean** — the documented load-flake, now with a "victim moves
  between runs" signature.
- 📌 **Doc-drift noted, no action needed:** `cf6db70` (manager) dropped my 01/08 journal entry on the
  vitest-vs-browser render trap. Verified before flagging that every evergreen fact from it survives in
  its durable home — `03_quotes/CLAUDE.md` (the rule + the 32,978/34,808/34,836 byte evidence),
  `module-3.md` §9, and `STATUS.md`. So "harvest before you delete" held; recording it so the removal
  reads as a deliberate call rather than an accident.

### 01/08/2026 — **Manager-2 shift open: handoff protocol landed, item-2 landing judged, item-3 no-revert independently confirmed** (management)
- Manager→manager takeover+handover protocol added to `work-manager` skill (`42f94a8` + follow-up;
  Ishay's addition, both directions) and recommended to 710's manager by cross-session message.
- **Item-2 (`84c59bb`) landing sequence run by the manager:** full diff read · save path unaffected
  (client sends 5 fields, cost is server-frozen) · **384/384 unit reproduced** · E2E measured fresh:
  **73 registered · 72 run under `test:e2e` (1 smoke-excluded) · 71 passed + 1 login-timeout flake,
  rerun 7/7 green (load-flake recurrence 3).** So "73/73" in recent reports is a registered-count,
  not a run-count — the 73-vs-71 doubt the builder flagged is now reconciled by measurement.
- **Item-3 no-revert confirmed independently:** quote #21 re-rendered through the real browser by the
  manager — **byte-identical 34,808** to the builder's figure; all six glyph-drop symptoms absent at
  text level. Pixel rendering unavailable in this env (pdftoppm absent, toolkit canvas broken) —
  the visual look remains Ishay's open eye-check, PDF delivered to his preview pane.
- **13:16 — Ishay closed the PDF eye: "אני מאשר את ה-PDF"** (browser-render of #21, the one the
  manager reproduced byte-identical). DoD "PDF RTL" box → closable; micro-guide flip assigned to
  the fix-builder with its current round.
- **Email-path live test approved by Ishay ("מאשר מייל") and released to the builder:** temp swap of
  the מדיטק contact email → send quote #6 → restore + read-back; event name untouched (ruled).
  Panel-lock test approved (must be watched failing on a reintroduced `?? 0`); builder editing
  `e2e/quotes.spec.js` at write time.
- Handoff protocol gained Ishay's anti-confusion refinements (`87dab3b`): outgoing manager forwards
  by successor's name, incoming manager pushes identity to every live builder. Ledger entry #3
  records the first handoff's two misses; 710 exchange rerouted to their new manager mid-flight —
  the mechanism worked on its first live test.
- **710 contact-card consult adjudicated (Ishay-directed):** adopted same-day (2nd routing
  occurrence — REG-IN↔710 traffic landed on their released manager): the incoming manager's
  identity broadcast covers peer managers, not only builders. `current-manager.txt` + the builder
  dead-manager clock stay candidates in `manager_evidence_regin` with the evidence against urgency
  (fresh prompts per shift; platform queues across session death).
- **Shift-number convention codified (Ishay's design):** successor = predecessor + 1 via the
  handoff block header; the number rides every artifact stamp and identity broadcast. Numbers
  disambiguate for humans/documents; machine routing stays by session name/ID.
- **Successor opening prompt (Ishay's design, step 2½ of handover):** the outgoing manager hands
  Ishay a fixed 3-line identity-only paste for the new session (number · boot-from-disk · broadcast
  order). Deliberately NOT a context prompt — F1's mega-prompt subtraction stands; context boots
  from the disk handoff block.
### 01/08/2026 — **Ishay surfaced a real process gap: save and send were never connected** (finding, manager-verified)
- His words: a new quote should open a summary/send screen after saving — same on edit. **Frozen spec agrees**
  (C5 §5.5.4 L230 + §5.6.4 L478/L480: one button `שמור ושלח`, saves → produces PDF → sends), and the
  blueprint copied it (`micro_guides/module-3.md` step 3.2). **Built reality:** `QuoteBuilderPage.jsx:688`
  labels it `שמור הצעה`; `handleSave` (285-308) saves then `navigate('/quotes')`. No deviation note exists
  anywhere in the repo — the gap fell between step 3.2 (screen) and 3.4 (email, built later). Ishay named the
  cause himself: the label was chosen before email automation existed.
- **His product model, corrected in this session:** `in_progress` means **sent, awaiting the customer's reply** —
  not "draft"; and quotes are built in ~10 minutes off a phone call or a spec email, so **no save-without-send
  case exists in the field**. Market check (Salesforce CPQ · DealHub · Xero · HubSpot — all carry a draft state)
  cited to him with the honest verdict: the market has drafts because quotes span days and approvals there;
  his scale doesn't, and today's system has an **unnamed** de-facto draft, which is strictly worse.
  Recommendation: no draft status — unify save+send.
- **His hypothesis "the screens are built, something in the wiring is stuck" — verified true.**
  `QuoteDocumentDialog` is ALREADY mounted on the builder page (`:709-717`) but fed `formToPreviewQuote`
  (no status ⇒ `isQuoteSendable` false) and never opened after save.
- **Builder's read-only investigation (manager-verified) found three more disconnects:** `getQuote` doesn't join
  `customers` (documented+test-locked — inject from outside, don't widen) · the builder page omits
  `emailTemplate`/`canEdit` though `emailTemplate` is already loaded there · `createQuote`'s returned id is
  discarded at `:306`. Plus the one nobody asked for: **`getSentQuoteIds` has exactly one call site**
  (`CustomerDetailsPage.jsx:221`) — the "טרם נשלחה" marker does not exist on the main quotes screen at all.
- **Make "filtered bundle" screenshot Ishay pasted — measured, NOT ours.** REG-IN's team (2049106) holds
  exactly one scenario (6759079): **8 executions, 24 operations, 0 errors**, latest `2026-07-30T23:12:06Z`,
  every run 3 operations / ~46 KB (webhook → Gmail → respond). The screenshot shows **1 operation, 149 B,
  31/07 23:41**, and the current blueprint carries **no filter on the Gmail module at all** (its id is 4;
  the screenshot shows 3). Conclusion: a different Make scenario/account — 710's is the likely owner.
  Recorded so nobody re-opens this as a REG-IN email defect.
- Manager rulings (reversible, logged): URL stays `/quotes/new` after create (a replace-navigate would unmount
  and kill the dialog just opened) — behavior to be documented · document-render code must sit OUTSIDE the
  save `try`, or a render failure reports as "save failed" on a quote that did save.
- **Live email test: automation refused by BOTH sessions' safety layers (builder + manager),
  neither bypassed** — live-data write + real outgoing mail is a human action. Execution handed
  to Ishay (4 steps in the manager chat); on his "שלחתי" the builder runs read-verifications
  (a)–(d) against the captured baseline (original email · updated_at · email_log=1), manager
  re-reads independently. Inter-session message language ruled by Ishay: stays Hebrew (he audits
  raw traffic irregularly but really — "אין כללים קבועים").
- The work-manager's document-pass on the PDF I supplied showed dropped glyphs and a near-blank
  visual render, and proposed reverting `8506720`. **Two variables isolated instead of arguing:**
- **Code:** re-rendered quote #21 from the **pre-fix** commit `73f6f25`, same path, same reader ⇒
  **5 of 6 symptoms already present**, incl. the missing qty `6`. Not caused by the change.
- **Render path (root cause):** my file was rendered under **vitest/node**; re-rendered through the
  **real browser** (production path) ⇒ **34,808 B vs 32,978 B**, and the historical clean 5.1 file is
  **34,836 B** — also a browser render. The browser output is fully clean and fully renders; bullets
  right-aligned, every terms line ends with its period, waterfall reads **6,319 ₪**. The fix works.
- **My error, stated plainly:** I reported "measured on a real PDF" without knowing it was not the
  production render path. The manager reasoned correctly from a defective artefact I gave him.
- **New rule in `03_quotes/CLAUDE.md`:** any PDF a human will look at is verified via the browser
  blob, never a vitest render; unit tests assert on the element tree, not bytes. Also recorded:
  `pdftoppm` is absent here, so this environment has no PDF page→image rendering.
- Outcome: **no revert**; corrected PDF re-sent for Ishay's eye.

### 01/08/2026 — **Fix-round item 2: `cost ?? 0` — four sites that undid the source's own "unknown ≠ zero" discipline** (fix, Ishay's delegated ruling)
- **Reported as a DORMANT guard before building, not oversold as a live bug.** Live DB: 0 products
  lack a cost row, 0 of 23 quote_services lack a frozen cost, and the panel is gated on the same
  group the cost policy admits. Recommended fixing anyway — asymmetric failure cost, and both
  protecting facts are fragile (`createProduct` is two writes without a transaction; M8 will hold
  `edit` on 'כספים' without 'הצעות מחיר').
- **Ruling (Ishay, delegated → option ב'):** dashes on all three profitability fields when cost is
  unknown, **plus the offending product named**; no partial profitability. Aligned to the existing
  `deriveQuoteMetrics.openValue` precedent.
- **TDD — the failing output was the argument:** pre-fix, `deriveProfitability(5355, null)` returned
  `{cost: 0, grossProfit: 5355, marginPercent: 100}`. Four tests written first, all watched failing.
- **`sonarjs` caught me duplicating an existing helper** (`numberOrNull` ≡ `paramNumber`); reused the
  existing one and generalised its comment rather than suppressing the rule.
- **First live probe proved NOTHING and was not reported as a pass:** intercepting the catalog on a
  saved quote's *edit* screen showed identical numbers in both arms, because `quoteToFormState`
  correctly falls back to the frozen `closing_unit_cost`. The unknown path exists only on a **new**
  quote — re-run there with a positive control (2 requests intercepted vs 0).
- **A copy defect surfaced only in the screenshot:** `ל-תג שם רגיל - ממותג` put two hyphens in
  different roles; reworded to `למוצר:`/`למוצרים:` with `·` separators.
- **384 unit · 73/73 E2E · lint+format clean · zero DB writes.**
- Full narrative: `docs/micro_guides/module-3.md` §9 (01/08, fix-round item 2).

### 01/08/2026 — **Fix-round item 3: PDF BiDi — three reported defects, one root cause, and a planned fix that would have been a no-op** (fix, work-manager-approved plan)
- **The plan's own hypothesis was half-wrong, and reading the library caught it before any code.**
  Plan said "add `direction:'rtl'` to `styles.page`". `@react-pdf/layout`'s
  `BASE_INHERITABLE_PROPERTIES` contains `textAlign` but **not** `direction`, and `getFragments`
  reads it off each `<Text>`'s own style with a hard `'ltr'` default ⇒ the Page-level fix would
  have changed **nothing, silently**, and the visual check afterwards could easily have been
  read as "partly worked". Correct fix: a `RTL` const spread into every Hebrew text style.
- **All three defects were one mechanism.** `textAlign:'right'` is alignment, not direction;
  with no RTL base, neutrals (period, parens, digits) migrate to the wrong edge. Measured
  before→after: terms periods moved line-start→line-end, "הנדון" reordered, "30 יום" clean.
- **The fix introduced a real bug, caught by measurement.** `<Ltr>` built `[{direction:'ltr'},
  style]` — so `styles.pairVal`'s new `rtl` **won**, flipping ח"פ/טלפון/תאריך/שעות at once (the
  double-flip the work-manager predicted). `<Ltr>` now writes its direction last; `CELL_GAP`
  deliberately excluded from `RTL` for the same reason.
- **2 new unit guards, both watched failing on mutations** (7 texts flagged / the 4 latin values
  flagged by name). They verify the **mechanism**, not glyph order — stated in the test file, because
  an assertion pretending to measure visual order from the text layer would pass on a broken document.
- **Money re-verified per the manager's condition:** real quote #21 re-rendered read-only —
  6,300→-315→-630→5,355→964→**6,319 ₪** verbatim. **378 unit · 73/73 E2E** · lint/format clean.
  A `quote-email` flake was **not** waved away (that test asserts on real PDF bytes) — re-run twice, both green.
- **DoD "PDF RTL" box deliberately left UNCHECKED** — closes only on Ishay's own eye, per the standing condition.
- Full narrative: `docs/micro_guides/module-3.md` §9 (01/08, fix-round item 3).

### 01/08/2026 — **Quote builder: fix-round item 1, silent-panel bug on discount>100%** (fix, work-manager-scoped)
- **What:** audit finding, scoped down by Ishay before the fix ("no-draft is intentional, the
  save-block on illegal discount numbers is correct and stays — only the missing explanation was
  the bug"). `computeQuoteTotals` (`pricing.js`) throws when the two discounts sum past 100% (a
  typo like 100 instead of 10). `QuoteBuilderPage.jsx`'s catch turned that into `totals=null`, and
  `{totals && <QuoteSummaryPanel/>}` made the **whole panel — including the Save button — vanish
  with zero explanation**, and the existing `errors.manualDiscount` message could never reach the
  screen either (it's gated on `submitAttempted`, only set by the Save button that had just
  disappeared).
- **Fix:** render a red explanatory box (`data-testid="quote-totals-blocked"`) in the panel's slot
  instead of nothing; Save stays unreachable in that state (unchanged, was already correct).
- **Proof:** new `e2e/quotes.spec.js` test — watched it **fail on the pre-fix code** (`git stash`
  of the one-line-scoped diff, re-run, confirmed red), then pass after restoring the fix. Full
  `quotes.spec.js` suite (12 tests) green. Live-verified logged in as CEO in the browser: message
  renders in RTL, panel/Save return once the discount is corrected. `eslint` clean.
- Full narrative: `docs/micro_guides/module-3.md` §9 (01/08, fix-round item 1).

### 01/08/2026 06:4X — **Steps 5.2+5.3 closed: migration recount, security-doc update, QA/DoD honest fill** (build)
- **What:** work-manager's combined task list for 5.2+5.3. Closed the two items 5.1 left open first (quote #6 confirmed untouched via SQL; grepped E2E for count/id assertions the 5.1 delta broke — found and fixed 3 real ones in `customer-page.spec.js` + `smoke-anchors.json`'s revenue anchor, all values read from the live screen not hand-computed, commit `be00744`).
- **Migration recount surfaced something bigger than a stale number:** the `schema_migrations` registry doesn't 1:1 match files on disk. Before treating it as new, checked `PROJECT_MASTER.md`/`db_roadmap.md` — already ruled (§7.86, 31/07) as `apply_migration`'s own version-stamping behavior. Independently re-verified the two "missing" migrations are genuinely applied (`customer_contacts` table exists, `quote_services.line_id` exists) rather than trusting the old note blind. Declared definition adopted: `module3_`-prefixed files on disk = **10**, reconciled across 3 docs.
- **§4 security statement** gained round-G's `products`→`product_costs` RLS-split note (was only in `src/CLAUDE.md`). **§6 מ3 debts** checked and found already closed by a prior session — no edit needed. `module-1.md`'s params-UI note checked and found accurate, left alone.
- **§6 QA Matrix + §7 DoD updated with tonight's own new evidence only** (not a full historical re-audit — that's 5.4's job). The 6,319-live-UI-and-PDF DoD box closed. **The PDF-RTL box deliberately left unchecked** — the work-manager's own visual document review found two real BiDi defects (mixed-content "הנדון" field scrambling, terms-page bullet direction) that this session's own PDF check had missed (verified numbers/content, not character-order); documented, not fixed, pending Ishay.
- **Flagged not silently skipped:** `db_roadmap.md` rows A-9/A-11/A-14/A-17 still lack their own inline "✅ APPLIED" tag (fact already recorded narratively elsewhere) — judged lower priority within this round's time budget.
- Full narrative: `docs/micro_guides/module-3.md` §9 (01/08 06:4X).

### 01/08/2026 06:1X — **Step 5.1 closed: binding acceptance scenario built live, approved, 6,319 ₪ confirmed** (build)
- **What:** built the spec's binding worked example through the real screen (not SQL-injected) — מדיטק (5% fixed), 300 guests/50 ratio = 6 hostesses, 4h, lines 6×`04ST`+300×`B-REG-TAG`+300×`B-FAB-LAN` — and read `6,319 ₪` back from the live `quote-total` DOM element before approving. Approval is irreversible; split into two script runs deliberately so the totals were visually confirmed before that write fired. Approved → project born complete (`not_started`, `required_hostess_count=6`, dates/identity inherited).
- **PDF verified on real bytes** (34,836, `%PDF` header, waterfall exact) fetched from the live blob per the documented headless-iframe gotcha — then saved to disk and opened with the Read tool for a genuine visual page-by-page check, not just a byte-count assertion.
- **Two own-script bugs caught before they mattered:** wrong product-label source (`description` collides between `04ST`/`06ST`; `item_name` disambiguates) caused a 30s timeout on the first attempt; Node's `Buffer` doesn't exist inside `page.evaluate`'s browser context, fixed with a chunked `btoa` encode.
- **Demo-data delta:** `quotes` #21, `quote_services` #35–37, `projects` #7 — all read back live via Supabase MCP. Full narrative: `docs/micro_guides/module-3.md` §9 (01/08 06:1X). Phase 5 started before Phase 4's own 👤 gate (4.5) closed — an explicit work-manager authorization (parallel track, not a skip; 4.5 needs Ishay regardless of when it's scheduled).

### 01/08/2026 05:5X — **Steps 4.3b + 4.4 closed: gate green incl. `knip`, 71/71 E2E, M1/M2 smoke** (build)
- **What:** re-ran `npm run gate` clean (post-crash restart) — `knip` finally passed once concurrent-session load dropped, closing 4.3b's sole blocker. Found+fixed a real ESLint scope bug en route (`d016c93`): `eslint.config.js`'s `globalIgnores` never excluded `playwright-report`/`test-results`, so any leftover Playwright report broke `lint` as source — every post-E2E `gate` would have failed the same way, not a one-off. First full `test:e2e` run: 70/71, `quotes.spec.js:68` timed out on the shared `login()` redirect — same symptom family as the known `quote-email.spec.js` flake, different file. Per protocol: stopped, reported, isolated the file (11/11 clean, 3.8s not 30s), documented the flake beside 4.4 in the guide, re-ran the full suite once more clean: **71/71**.
- **M1/M2 manual smoke:** Browser-pane screenshots unavailable in this unattended session (pane not displayed); fell back to a disposable Playwright script (chromium) — 5 screenshots to `scratchpad/`, all visually inspected (not just "exited 0"). First M1 capture caught a loading state (own script timing bug, not an app defect), fixed and re-verified.
- **Full narrative + evidence:** `docs/micro_guides/module-3.md` §9 (01/08 05:5X). Built solo overnight under the manager's live direction (cross-session messages, not a one-shot prompt) — Ishay asleep throughout, per his own go-ahead.

### 01/08/2026 12:42 — **Manager shift-1 hands off** (manager)
- Item-2 (cost-null) landed `84c59bb` with a 4-point self-review incl. a documented edit-screen testing trap — adjudication handed to manager-2 (context exhausted). The builder's "round complete" crossed the BiDi stop — reaffirmed: glyph-measurement first, no 5.4 until manager-2 introduces itself. Handoff block in `docs/work_plan.md` (7e0d42c) holds the full in-air state; the builder is measuring now. Shift-1 totals: 6 steps closed + audit + gate-4 signed · 2 ledger entries + 3 graduated rules · 8-item contract queue for round-close · probe scoreboard 8/9.

### 01/08/2026 12:38 — **BiDi fix STOPPED at the manager's document pass — glyphs dropping; contract-upgrade queue grows to 8** (manager)
- **The item-3 (BiDi) commit `8506720` reported clean by the builder's own deep verification (mutation-tested, money re-verified) — and the manager's full-page document pass found the AFTER-PDF WORSE than before:** systematic first-letter glyph drops ("הנחת"→"נחת", "מע"מ"→"ע"מ"), a vanished quantity, near-empty visual render. Item frozen, Ishay's eye-pass held, builder measuring with three hypotheses (glyph-subset breakage / stale-code render / reader-side false alarm — must also explain why BEFORE reads clean in the same reader). Possible revert. Second time today the document pass beat green self-verification ⇒ graduated into the numbered done-sequence (Job B step 5).
- **Governance:** flowchart question ruled (both managers converged independently): no node-graph — thin moment-map at SKILL.md top (`376d917`) + the 710 sharpening adopted: repeated mechanical sequences become NUMBERED checklists (Job B done-sequence numbered). Contract-upgrade queue for round-close now 8 items incl. Plan-Mode-with-loop-test (Ishay: "לא להכניס אותי ללולאה"), comprehension-close, gap-protocol. E2E count discrepancy found (list=73 vs recorded 71, verified by both) — resolved at round-close with a three-number report (listed·ran·skipped).

### 01/08/2026 12:05 — **Gate-4 signed · M4 mini-round closes §7.15 · fix-round mid-flight** (manager · §7)
- **Gate 4.5 SIGNED** ("מאשר שער 4") on Ishay's own 3-click eye-pass against the live app (dev server raised for him). Recorded in guide/plan/here.
- **M4 mini-round — first run of the understanding-first format, and it fired:** Ishay shot the manager's declared model ("לא קורה — לאירוע יש מספר דיילות וזהו") ⇒ dual-role events aren't reality ⇒ **§7.15 fully closed** (one candidate list per event; only geocode-identity stays a build-time technicality). Half-shifts: "לא קורה". Cost-display: delegated ⇒ dashes-not-partial (openValue precedent). ⚠️ Ripple flagged openly: §7.67's shift-entity main justification voided — ruling stands, scope re-examined at the M4 blueprint with Ishay.
- **Fix-round:** item 1 landed (`ed2ca89`, Ishay eye-verified via click-4); items 2-3 approved as two plans (builder read the PDF traps first; BiDi root-hypothesis = missing page-level `direction:rtl`; money-table re-verification is the manager's condition). Builder self-idle caught at 42min and woken — sessions don't self-wake; narration isn't a trigger. Prompt-craft research (Ishay's suggestion) validated the architecture against 2026 practice — no gaps adopted, "לא בכוח".

### 01/08/2026 10:42 — **Morning governance round with Ishay + fix-round launched** (manager · skill)
- **What:** the manager system absorbed a morning's worth of Ishay's refinements, each anchored and committed: shift-close retro battery (10 questions + cost-Q11, self-run mandate — first live pass produced 2 real candidates: manager-authored task lists lack independent review; hand builders measurement METHODS, never expected numbers) · three blind-spots he probed for (quota-death protocol, day-mode loop-closure "ישי אמר לי X", calibration expiry) · self-coaching question refined ("מקצועי" + persona-swap + fit-tail) · **layer 6½, the intent-filter**: product-touching findings answered from recorded intent WITH a direct source or climbed as a story-question — born from the panel-finding being over-scoped until Ishay's "אין אפשרות לטיוטה, לא?" (the no-draft answer sat in the schema's 3-status CHECK all along) · prompt-preface rule (2-3 plain-Hebrew lines before every paste).
- **Fix round launched (~10:30):** session "הודעת שגיאה בהנחות חורגות" — re-scoped item 1 (feedback message only; save-blocking stays by design) + cost??0 + 3 PDF BiDi fixes (Ishay ruled: fix now). Manager SQL-read lane proven working (the night's failure was a guessed project_id — mine).

### 01/08/2026 05:34 — **Claude-wide crash (network) + full re-orchestration; 4.4 relaunched** (manager)
- **What:** ~05:28 network failure forced a Claude restart, killing every session mid-flight. Manager resumed from disk (zero loss: tree clean, all commits pushed, HEAD `6e2423f`), re-armed the git monitor (full-hash base — fixes the short-hash false-positive from 04:45), and re-issued "צא לדרך" for step 4.4 to the dedicated builder ("מודול 3 שלבים 4–5"), which had died ~6min into 4.4 before committing anything.
- **Roles reconfirmed after restart, per Ishay's check-ins:** 4.3b session — released for good · hot-spare manager — back on watch · audit session — granted a read-only interim task (pre-verifying close-claims independent of the running steps: migration count, §6 מ3 debts, §3-vs-policies). Double-builder collision avoided a second time (4.4 stays with the dedicated session).
- **Open watch item:** `eslint.config.js` showed modified in the live tree during 4.4 — a "Files: none" step; to be raised at the builder's 4.4 report (never judge mid-work).
- **07:02 — night's build lane complete; audit running:** 5.2+5.3 closed after one corrective ruling (the four APPLIED tags were guide-mandated, not discretionary — builder then verified each LIVE before tagging and honestly marked A-14 "partial", refusing the convenient lie). Builder released with credit: 4 steps in one night, zero verification findings against it, the closing probe surfaced something real all 3 times it was asked of it. Audit session (5.4, module-close) launched 06:45 with the night's accumulated context; DoD typed-echo + PR instructions held for Ishay's morning per the night limits. Housekeeping: a stray 54-byte `nul` redirect-artifact removed from the repo root (untracked; admission — its content was not read before deletion, verify+delete were wrongly chained in one command).
- **06:25 — 4.4+5.1 adjudicated, 5.2+5.3 launched (manager side; the builder's own entries carry the build detail):** both closes verified independently (my own full-gate green incl. knip — first first-hand green of the night; PDF opened and eye-read by the manager). **The document pass found what every automated check missed: two customer-visible BiDi flaws in the quote PDF** (mixed-language subject scrambles; terms-page periods sit at line-start) — 4th incident of the RTL-pairing family, parked for Ishay's morning ruling (product-visible; recommended: small fix in-round on his word). The 4.4 closing probe surfaced a suppressed observation (6/6 tonight — Buffer console-warning ×40, adjudicated: document-don't-investigate, landed `e15ce4c`); 5.1's demo-delta broke exactly the coupled assertions the entry predicted — builder's fix verified line-by-line (9,865+6,319=16,184 ✓, `be00744`).
- **05:41 — audit-prep round adjudicated:** the audit session's 🔴 "§7.86 missing from PROJECT_MASTER" was REFUTED (entry exists, line 581 — its grep searched the citation-format `7.86` while the registry writes `86.`; the manager's "verification" re-ran the same wrong pattern and a duplicate registry entry was averted only at the write-anchor read). Second occurrence of the verify-against-the-source's-own-format family (710 ledger #4) ⇒ the rule GRADUATED into work-manager Job A layer 1 (`4fc959d`). Survived from the round: a real migration-count contradiction (9/11/8/22 across guide·audit·db_roadmap·folder) routed to 5.2/5.3 as recount-with-definition, plus the §4 security-declaration gap; both parked on work_plan row 6.

### 01/08/2026 05:34 — **Step 4.3b landed and pushed; session released, checked back in per Ishay, confirmed no further work** (test + docs)
- **What:** the 05:09 entry below closed out — manager verified the commit independently (`8f4f317`, tree clean), confirmed `knip`'s OOM crash reproduces on their own machine on the same tree (environment, not code), and released the session. Two commits pushed to `ishay/module-3-quotes-build`: `8f4f317` (5 tests + docs) and `5009f55` (a stale `STATUS.md` "current step" pointer — still said "4.1 closed, next 4.2", found on a deliberate final re-check before signing off, not part of the original landing).
- **Manager's rulings on the two self-flagged gaps** (quote-email flake root-cause never dug into; no A/B knip control test run): both accepted as-is — the flake is tracked-by-name and becomes an investigation item only if it recurs in 4.4; the knip A/B test was explicitly waived ("not by force") given the manager's own reproduction plus every other gate step passing clean.
- **Ishay asked the session to check with the manager for follow-up work.** Manager: released, no task — step 4.4 is already running in a dedicated "module 3 steps 4-5" session, and the closing audit belongs to a fresh session; two builders on one step is the exact collision the process avoids. Only recall trigger: if 4.4's regression run breaks one of this session's 5 new tests.

### 01/08/2026 05:09 — **Step 4.3b built: 5 new E2E tests close the coverage-map gaps found in 4.2+4.3** (test, in progress — awaiting manager on one gate step)
- **What:** all four gaps from the coverage-residue table closed. ① `quote_services_lock_non_in_progress` (the never-exercised branch of `enforce_quote_in_progress_lock`) proven live — one real REST call each for UPDATE and DELETE on line_id=19 (quote #11), both P0001, read-back unchanged; the manager's plan-gate added the DELETE half (the guide's table only listed UPDATE) and required a precondition read instead of trusting last night's measurement. ② `param-vat`/`param-ratio`/`params-save` covered: happy-path save of both params + a real validator-boundary negative (`ratio=0`, `isValidGuestsRatio` needs `n>0`). ③ 'אחר' rejection notes proven **delivered**, not just proven blocked. ④ product-status toggle proven to PATCH the right sku+value.
- **Plan-gate correction (manager, 01/08):** the guide's box above step 4.3b said "item ④ inside a transaction that rolls itself back" — the builder's own reading (page.route can't reach Postgres, so only the lock-trigger item needs a real DB call) was right; it was a stale edit and should read "item ①". Fixed in `module-3.md:402-411` with an `↳ as-built` note.
- **Evidence:** baseline 376 unit / 66 E2E (0 skips) measured fresh, not assumed. After: 376 unit (unchanged, E2E-only work) / **71 E2E** (0 skips) on a clean second run — first run had 1 unrelated pre-existing flake in `quote-email.spec.js` (login redirect timeout), reran green. Post-battery read-back via Supabase MCP: `quote_services` lines 19/20, quote #11, both pricing params, `products.B-REG-TAG` — all byte-identical to pre-run. `npm run gate`'s lint/format/376-unit/build/jscpd all green.
- **Open at this timestamp:** `npm run gate`'s `knip` step crashed 3× with `RangeError: Array buffer allocation failed` inside `oxc-parser` — measured 1.4GB/15.73GB system RAM free (other concurrent sessions on the machine), not a code issue (no `src/` exports touched, only `e2e/*.spec.js`). Reported to the manager session, awaiting a retry-now-vs-later call before closing 4.3b's step-table row.

### 01/08/2026 03:10 — **work-manager skill split + verified 710 imports; two manager memory containers opened** (skill)
- **What:** SKILL.md restructured per Ishay's ruling (core file + `references/`: watching · concurrency · prompts · decision-guarding · miss-ledger). New content entered only with an anchor: persistent monitor (local anchor: 31/07 landings were multi-commit, 21:46→21:55→22:21 — supersedes the 31/07 one-shot design), tool-inventory at boot, pipe-masking, ~120% cadence (principle only — durations calibrate locally), direct session messaging + digests, triple gate before asking Ishay, escalation ladder (merges stay Ishay's — 710's grant explicitly NOT imported).
- **Why:** Ishay ran the same manager-pilot process in 710; its 01/08 rewrite held lessons postdating REG-IN's 31/07 skill. Instead of bulk-copying, each item was re-derived or rejected against REG-IN reality (rejections recorded in `manager_evidence_regin` memory).
- **Memory (outside repo):** `ishay_response_playbook` (seeded from 710 — anchor is Ishay himself) + `manager_evidence_regin` (evidence container; his 4 rulings 01/08 ~02:50 quoted there). Open residue: whether the llm-council rung loosens here (REG-IN rule is stricter than 710's); playbook elevation to user level (two copies will drift).
- **Honesty round (Ishay: "קראת היטב?" — no):** 710's references/ had never been read; reading them + a skill-creator audit yielded 3 fixes — miss-ledger header replaced with 710's *proven* format (append-only newest-last, prose entries, "no rule change is legitimate"), and Job A gained ledger-entry-4/5 lessons (verify against the *defining* file; the plan's own "מה לא בדקתי" is not layer 2; layer-1-only verdict = partial shipped as full).
- **Rolling work plan established (04:05, Ishay's request — reversing the same night's "rejected" call):** `docs/work_plan.md` — two-week window, 5–10 rows, INDEX pointing at micro-guide steps (no duplication); each row: route · parallel-safety · model+effort per setup-guide §⑨ · estimate. Also: demo-script+rehearsal line added to module_12 guide (his approval) · velocity-check-at-module-close added to work-manager · prompts now carry a model recommendation.
- **Night close (~04:55):** first two managed items ran end-to-end — log compaction (889→471 narrative, both landings manager-verified, `64d7971`+`b13164a`) and 4.3b (plan gate caught a DELETE-coverage gap + builder caught a guide typo ④→①; built+self-verified ~05:09 — 66→71 E2E green, DB read-back zero-net-change; knip env-blocked (memory), retry after closure docs; not closed until gate fully green). First §7-מ4 round: 7.67 shift-entity · 7.55 lat/lng+NULL · 7.69 travel mechanism — ripples done same session (§5.12/§5.14/§7.15). Honest ledger entries #1-2 (patterned-on-unread-files; batch ran without stale-detection — Nominatim recorded as candidate only, choose-at-build ruling stands). docs/CLAUDE.md gained 4 nav rows (Ishay's index suggestion, no new file). After a 3rd same-family occurrence (smart-match doc cited unread, his "קראת?" probe), the located-citation rule graduated into the skill (`72677c3`): a shipped citation names where it was read, or it doesn't ship.
- **Later rulings (04:00–04:40):** graduation bar — a mistake enters the skill only on 2nd–3rd occurrence, story stays in the ledger · replacement mandate encoded (manager answers as Ishay; playbook = model of him) · router section (repo skills invoke directly; plugin/personal propose-and-wait) · playbook elevated to a single user-level canonical (`~/.claude/references/ishay-response-playbook.md`, moment-organized per Ishay's own collection; REG-IN memory = pointer + deltas) · 👤-stop split (plan-approvals/continue → manager; irreversible/product/secrets/DoD → Ishay; wired via prompts until proven) · first managed item = step 4.3b, builder prompt written, manager conducts.

### 31/07/2026 21:43 — **Steps 4.2+4.3 closed as one round — E2E 44 ⇒ 66, zero DB change** (test + docs)
- **Baseline measured first** (44/44, exit 0) so any later red was attributable. Rejection/expiry
  guards proven in a rolled-back SQL battery: both CHECKs returned `23514`, the lock trigger fired on
  `update` **and** `delete`, and the **expiry job body ran verbatim** (param 30⇒1 ⇒ exactly quotes
  6–9 flip to `פג תוקף`); param emptied ⇒ raises. Read back **outside** the transaction: identical.
- New: `e2e/quotes.spec.js` (9) · `e2e/prices.spec.js` (7) · **`e2e/quote-email.spec.js` (6)** — the
  latter pays 3.4's two booked debts (permanent email-path test; finance refused **by the Edge
  Function**, 403, with a CEO control returning 400 because the gate runs before the body is parsed).
- **4 mutations watched failing** before any green was reported; 17 unrelated tests stayed green, so
  each red was attributable. All reverted and grep-verified.
- 🔑 **The real lesson — "passes when run alone" is the symptom, not the verdict.** Two full runs
  failed on *different* tests, and both instincts ("known flake", "pre-existing") were wrong: the
  cause was `route.fallback()` on read paths in my own interception, taxing every passing request
  while the prices screen fetches tiers **per product** (12 reads). Switched to `route.continue()`
  ⇒ **66/66 and the run got faster (7.2m ⇒ 5.7m)** — speed is what proved the diagnosis.
- One additive src change: `data-testid="access-denied"` on `ProtectedRoute` (four suites pinned that
  screen by Hebrew string while E2E never runs in CI). Gate exit 0 · 376 unit · live DB byte-identical.

### 31/07/2026 22:18 — **Step 4.3b scheduled before 4.4; last M3 debt ruled "not required"** (docs)
- Ishay asked the build session *"what didn't you check"* right after 4.2+4.3 closed with a coverage
  map claiming nothing was uncovered. **Four gaps surfaced inside that declared scope.** I re-verified
  all four against the code before scheduling, and **moved two severities**.
- 🔴 **The one the build session under-rated:** `enforce_quote_in_progress_lock` branches on
  `TG_TABLE_NAME` — `quotes` reads `OLD.quote_status`, **everything else runs a subquery** against the
  parent quote. Two triggers, one per table ⇒ the `quote_services` path is a **separate code path that
  has never executed**, and it is what keeps an approved quote's lines frozen (⇒ old PDFs reproducible).
- Measured worse than reported: `param-ratio` and `params-save` appear in **no** spec at all;
  `param-vat` appears once, read-only, in `smoke.spec.js`. Downgraded the product-status toggle to 🟡 —
  round D already covers the *consequence* of disabling, only the action is bare.
- **Sequencing is the substance:** 4.4 *is* the regression step, so 4.3b runs before it or the 4.5 gate
  signs an incomplete suite. Recorded as a step **plus** header/table rows — the same fix this file
  logged at 21:06, applied to my own addition.
- ✅ Last `🚧 מ3` (extra contacts in the quote picker/PDF) ruled **not required** — optional by its own
  wording, M3 does not break, and choosing a recipient is a new request. `check-context` now reports
  **zero** open M3 debts.

### 31/07/2026 21:55 — **"Verified" is not "recorded" — the context checker caught the manager's own overclaim** (docs)
- I ran `npm run gate` myself to verify the 4.2+4.3 round (**exit 0**). Its `check:context` step reported
  **2 open `🚧 מ3` debts** — while the board line I had written at 21:20 said *"חובות מודול 3 נסגרו כולם"*.
- **Both were true at once, and that is the failure.** I *verified* three debts as built (revenue metrics ·
  PDF-engine purity · contacts-optional) but only *marked* one closed (the revenue filter). Verification
  lived in my report; the registry never heard about it — so every future reader would still see them open.
- Fixed: the M3 share of the customer-card line and the PDF-engine line now carry their closure **with the
  evidence inline**. Checker re-run: **2 ⇒ 1**. The remaining one (extra contacts in the quote picker/PDF)
  is genuinely optional by its own wording and is Ishay's call, not a measurement.
- 🔑 **A verification that is not written into the registry has not happened.** The mechanical checker is
  the only reason this surfaced tonight instead of at the 4.5 gate — where "all debts settled" would have
  been rubber-stamped from my own board line.

### 31/07/2026 21:17 — **Module-3 debt audit before the 4.5 gate: 4 settled, 1 ruled "not required"** (docs)
- Ran read-only against the live 4.2+4.3 round. Of the five `🚧 מ3` lines in §6: one was already
  closed 30/07; **revenue + avg-deal-size are built and route through the pricing SSOT** (no formula
  duplication — `sumQuoteTotals` → `deriveQuoteAmount` → `computeQuoteTotals`); **the PDF engine is
  genuinely pure** (`buildQuoteDocument(quote)`, no hooks/context/screen state); extra contacts were
  never owed (§6 defines them as optional).
- 🔴 The one real gap: the **"מובילים לפי הכנסה"** filter was never built — `matchesCustomerFilters`
  takes five keys and none is revenue. **Ishay's ruling: *"נסגור אותו לא נדרש"*.** Reason: step 3.5
  answered the need differently — `total_revenue` is a live sort key, and a descending sort *is*
  "who are my biggest customers". Reopen trigger recorded in §6 (list outgrows one screen, or
  M9/M11 need revenue as a segment rather than an ordering).
- 🔑 Recorded in §6 **as a measured closure, not a silent one** — the evidence that it is unbuilt sits
  in the same line, so a later reader cannot mistake "closed" for "shipped".
- ⚠️ Also written into the M10←M3 debt: the PDF engine is liftable **except** its three Vite `?inline`
  asset imports (fonts + logo), which no server runtime provides. The one thing that would otherwise
  surface only mid-lift.

### 31/07/2026 21:06 — **The 4.2+4.3 merge decision reached the three lines a session reads first** (docs)
- The 🔗 box was committed at 20:25 (`c32fb6d`) — **27 insertions, zero deletions**: the Live Status
  Header, the Active-step row and the step table were untouched and still read *"Next: 4.2"*.
- So a session following the guide faithfully would start at Active step, build 4.2 alone, mark it ✅
  and stop — closing half a round and writing the rejection path twice, which is exactly what the
  decision existed to prevent. Found by checking the header against the box, not by reading either.
- Fixed in `c9dc34b`: all three now say **4.2+4.3 AS ONE ROUND**, the header points to **both** boxes
  (🧰 + 🔗), and the 4.3 row carries the pointer to the two 3.4 debts.
- 🔑 **A decision written only in the body of a long guide is not yet in effect** — check that it
  reached the lines that are read *first* (status header · active step · step table).
- Verified before staging: `git diff` was exactly 4 lines, all mine — no pending lines from the
  parallel session were swept in (the failure that mixed two rounds earlier today).

### 31/07/2026 20:05 — **Skill prune measured and declined; growth-control added instead** (skill + docs)
- **Measured, not felt.** `work-manager` is 237 lines — ~2.9× the next-largest repo skill, and it
  grew 150 → 237 in six hours with nothing ever removed. Two prunes were drafted (170 and 136
  lines) and three role-based evals run against both — sequencing/absorption · decision-guarding ·
  knowing-when-*not*-to-act. **Both prunes scored identically on all three.**
- **Ishay's ruling: do not prune.** The cost was never measured before assuming it: 237 lines is
  ~3–4K tokens loaded once per management conversation. No measurable harm, the skill demonstrably
  works, and module 3's deadline is 7 days out. Both drafts kept in the session scratchpad so a
  later prune starts from measured ground.
- 🔑 **The epistemics Ishay supplied, now written into the skill:** *"a prune that leaves the evals
  green proves only that the evals do not look there — absence of evidence is not evidence of
  absence."* Evals can **falsify** a prune, never authorise one; every deletion needs its own
  reason. Two cuts flagged as especially costly: removing the **why** and keeping the rule, and
  removing a **rare** rule (nothing catches its absence until the day it mattered).
- **What went in instead of a prune** — two questions that stop the growth rather than reverse it:
  *"is this true almost always, or am I patching a single incident?"* before adding, and
  *"which paragraph here has never once changed a decision?"* occasionally, in reverse.
- **Byproduct worth more than the experiment:** the eval agents, working on unrelated questions,
  surfaced four real repo defects — the lost warning-3 (above), the `19:2x` placeholder, the
  future-dated STATUS header, and **E2E never running in CI while 81 selectors match literal
  Hebrew strings**. The last one is unresolved and needs Ishay.

### 31/07/2026 19:55 — **A rule that guarded us all day had lost its home — caught by the skill's own eval agents**
- **The failure, and it is the exact one the rule warns about.** "אזהרה 3 — שומר שלא נצפה נכשל
  אינו שומר" lived only inside `docs/audit_2026-07-31_fix_plan.md`. When that file was compacted
  to a tombstone this evening (315→164→33 lines) the warning went with it, while `STATUS.md:502`
  kept naming it as the rule's home. Verified absent from `src/CLAUDE.md`,
  `architecture_and_qa_roadmap.md` and `_shared/discipline.md`. **Now homed in `src/CLAUDE.md`**
  atop §"בדיקה ירוקה אינה הוכחה" — auto-loaded for anyone working in `src/`, i.e. read when
  relevant — with the broken pointer in STATUS corrected to say so.
- **How it surfaced — worth recording, because nobody looked for it.** Six subagents were running
  a pruning experiment on the `work-manager` skill (three role-based scenarios × two prune depths).
  Two of them, independently, ran `git show` on the pre-compaction file to answer a *different*
  question and noticed the rule was gone. Neither was asked to audit documentation.
- **Also fixed in the same pass:** the literal placeholder `19:2x` (with the letter x) in 5 places
  across STATUS/LOG/micro-guide — the digit was never filled in; set to `19:40`, the commit time
  of `1087e74`. And `STATUS.md` header claimed "עודכן לאחרונה 20:00" while the clock read 19:49 —
  a board declaring the future is exactly what breaks "who wrote last" reasoning between sessions.
- **A finding that turned out already handled — withdrawn:** an agent reported STATUS/micro-guide
  disagreeing on the E2E baseline (39 vs 38). STATUS line 192 is a *dated* round-F record; line
  266 already carries the correction. Nothing to fix.
- 🔴 **Left open deliberately, needs Ishay:** E2E never runs in CI (measured: zero `playwright`
  references in `ci.yml`) while **81 selectors across the suite match on literal Hebrew strings**.
  A copy edit breaks tests and the gate stays green. Two agents independently recommended running
  any UI-copy pass *before* 4.2/4.3 freeze more strings into permanent suites.

### 31/07/2026 19:40 — **Step 4.1 (approval-flow edges) CLOSED — proven without approving a single quote**
- **Why it looks unusual:** approval is irreversible and there is one live DB, so the proof is a
  rolled-back SQL battery + screen tests, with the DB read back after to show it did not move.
- All 7 DB guards **returned their failure** (incl. today-is-allowed, the half that actually proves
  §7.32). `closing_unit_cost` proven frozen **in both directions** — equality with the catalog only
  proves *populated*. Full battery, outputs and the reusable pattern: `micro_guides/module-3.md` §9.
- **NEW `e2e/quote-approval.spec.js` (6 tests)**, additive to round D's. The one test touching the real
  RPC runs on a non-existent id, with a CEO control call proving the 42501 comes from the role.
- Corrected two stale claims: E2E baseline is **38, not 39**; the RAISE-contract comment in
  `src/lib/quotes.js` named a superseded migration and 11 P0001 sites (live: `20260731155511`, **9**).
- ⚠️ **The stale "11 P0001 sites" was in two more files** (`db_roadmap` §6, `03_quotes/CLAUDE.md`) —
  found only when Ishay asked what I hadn't checked. I had cleared the `db_roadmap` line earlier by
  checking its *filename* and never its *count*. **When a fact drifts, grep the number too.**
- `npm run gate` **exit 0** · **376 unit** (unchanged by design — no new `src/lib` logic) · E2E
  **44/44** · `smoke` green · finance-role screens screenshot-reviewed (whole, actions column = eye only).

### 31/07/2026 17:55 — **Audit rounds E+F closed — the 31/07 fix-plan is empty and deleted**
- **E (cleanup, `2687447`) — three comments that contradicted the code beneath them, five copies
  merged.** The dangerous one: `PriceTiersDialog` presented delete-then-insert as "the convention",
  i.e. the exact ordering that wiped 5 live `B-REG-TAG` tiers on 30/07 — a future session could have
  "aligned" the code to it. Merges: `toError` + the 8-site `RLS_DENIED` idiom → `src/lib/apiError.js`
  (⛔ `toWriteError` deliberately stayed in module 3 — it injects quote-only server wording) ·
  `QUOTE_STATUS_LABELS` revived as the single home for the three labels · `LoadingOrError` replacing
  hand-written JSX (**outer guard kept** — its error branch returns unconditionally and would emit an
  empty red `<p>`) · four action labels + two toasts → shared constants · `validateTierRows` now
  imports the validators that had tests but no production consumer.
- **F (test gaps, `c14bf32`).** `send-email/index.ts` was outside every automated check — ESLint skips
  it as a *warning*, no unit test, not in `npm run build`; only Prettier saw it, i.e. format without
  types. New CI job `edge-function-check` runs `deno check` **without `npm ci`** (with the repo's
  `node_modules` present, deno demands every npm transitive locally and fails falsely). Two blind
  tests opened: the injected-totals PDF test asserted only `not.toThrow()`, and `sortQuotes` gave
  A and B identical values in both sort fields.
- **Why this session is worth re-reading: the "watch it fail" rule paid off twice.**
  ① The old F2 test, with the bug deliberately injected, passed **26/26** — that is the proof it was
  blind, not an argument that it was. ② It also *corrected the finding*: F3 was written as "a reversed
  comparator would stay green", and measurement showed a full reversal **was** caught. The real,
  narrower defect: positions 2–3 of `[3,1,2]` came from **input order under a stable sort**, not from
  the comparator — reordering the input array alone flipped `3,1,2 ⇄ 3,2,1` with zero code change.
  **A finding can be right about the smell and wrong about the mechanism; only running it separates them.**
- **Evidence:** gate exit 0 · 373 unit (from 366) · E2E 39/39 · four before/after screenshots
  **byte-identical by md5** — that is what "E changed no screen" rests on, not on looking similar.
  ⚠️ Baselines had to be captured with `git stash`, because Playwright wipes `test-results/` per run.

### 31/07/2026 18:35 — **Step 4.1 re-tagged 🤖→👤, and the rule that made the fix belong in the guide** (docs only)
- **The defect:** step 4.1 was tagged 🔻🤖 ("Claude verifies alone and continues") in both the
  step table and the step body — while a successful approval is **irreversible**. Measured:
  trigger `quotes_lock_non_in_progress` blocks `update` **and** `delete` once status leaves
  `in_progress`, and `projects.quote_id … on delete restrict` locks it from the other side.
  No un-approve path exists, and there is one live Supabase project. A session following the
  guide faithfully would have approved a quote "to check" and changed the demo data forever.
- **Fixed in the guide, not in a prompt** — and that distinction is the actual lesson. I had
  written a long hand-off prompt carrying this warning; Ishay pushed back: *"corrections to
  future steps belong in the guide, not the prompt."* He was right, and it exposed an
  inconsistency in my own work an hour apart — I fixed the 4.3 gap **in the guide** and then
  fixed the 4.1 gap **in a prompt**. Same class of problem, opposite treatments.
- **Ruling recorded next to iron rule 15** (`docs/CLAUDE.md`): a discovery affecting a step that
  hasn't started goes into the guide, same session. The practical test: knowledge still true in
  a month (how the DB behaves, what is irreversible, what was removed) → guide; only a freshness
  stamp (numbers that moved today) → prompt. What it subtracts: the long repeated prompts, and
  the dependency on someone remembering to attach them.
- The step body now splits 4.1 explicitly: **failure paths are safe to build unasked** (every
  rejected approval ends in `raise exception` ⇒ transaction rolls back, zero DB change), while
  the **success path is a 👤 stop** — and the seed's one already-approved quote can prove
  "project born complete" read-only, without creating anything.

### 31/07/2026 18:20 — **Monitor discipline + a status board, from gedood-710's field use** (skill file only)
- **Self-monitoring replaced waiting to be told.** Ishay asked "can't you check yourself?" — he
  was right, and the skill had been built around him relaying "the session finished", i.e. making
  him a courier between two sessions. Now: a background loop exiting on **two conditions
  together** (HEAD moved *and* clean tree, `--untracked-files=no`). Neither alone is sufficient.
- **`git fetch` removed from the loop** — both sessions share one disk, so a commit is local the
  instant it lands. It was the only costly step and the only reason to poll slowly; without it
  the interval is chosen by how fast you want to know (~2 min per fix round).
- 🔴 **Trap that is worse here than at 710: every commit in this repo carries the same git
  identity**, mine and the builders'. Author-based filtering — the obvious fix — does not exist
  as an option. Discipline instead: re-arm `BASE` after any commit of my own, and `git log -1`
  before reporting "it landed". **Measured near-miss:** the monitor was armed 17:47, I committed
  `9e35272` at 17:49 — HEAD moved, so condition one fired. The alert stayed silent **only because
  the builder's tree was dirty**. The two-condition rule absorbed it; that is luck, not a
  guarantee — it would fail if I committed during a quiet moment.
- **Adopted an "איפה עומדים" closing board** (4–6 measured rows: running · just closed · free to
  start now · deadline · needs-Ishay), with the constraint that makes it safe: **every row
  measured the same turn or marked טעון בדיקה.** Written into the skill as the most dangerous
  artifact of the role — it reads authoritative, Ishay acts on it directly, and a stale
  "free to start" row sends him into a collision with a live session.

### 31/07/2026 18:15 — **Two silent debts given a home, after the manager review of rounds E+F** (docs only)
- **Round E+F reviewed — no findings.** Verified by running, not reading: 376 unit tests green,
  lint clean, temp baseline spec deleted. Checked the two spots that could have broken quietly:
  the validator swap in `validateTierRows` is **equivalent across ten hand-checked edge cases**
  (`''`/`null`/`undefined`/`'abc'`/`'5.5'`/`'0'`/`'-3'`/whitespace/`Infinity`), and the
  `LoadingOrError` extraction kept its outer `loading || loadError` guard — the builder went
  further and verified all eight consumers, calling it a house convention. F2 asserts the
  injected 99,999 is absent in **both** formatted and raw form (one was asked for).
- **Debt 1 — the pointer this session owed.** When round F was absorbed into phase 4 on Ishay's
  "no harm to the result" condition, I claimed phase 4 covered what F gave up. Measured after:
  **`send-email` appears zero times in the phase-4 step bodies.** The two 3.4 debts (no permanent
  E2E for the email path · no test proving the Edge Function itself refuses a `view` user) live
  in the DoD table — a place nobody reads mid-step. Now repeated inside step 4.3 itself.
- **Debt 2 — a precondition that expired today.** `STATUS.md` line 383 (written 30/07) said *"on
  deploy day, rotate the 5 test passwords — §7.24 assumed a local system"*, while another line in
  the same file said they never would be. **Today was that day** (Vercel is live, Google sign-in
  confirmed). Ishay's ruling: **rotate before submission (19/09), not now** — rotating today
  breaks all five `E2E_*` pairs, the E2E suite and `smoke` mid-flight, for a risk that is still
  theoretical (private repo). Booked to `§6` with an early trigger (repo goes public / anyone
  else gets access) and the contradiction in STATUS resolved in both directions.
- **Note:** today's §7.24 re-confirmation (`67b22c6`) asked the right question about *git history*
  and answered it correctly — the deploy opened a **different** exposure (a public front door),
  which that pass wasn't looking for.

### 31/07/2026 17:45 — **`work-manager` absorbs three cross-project inputs from gedood-710** (skill file only)
- **Taken (2/3).** ① *Push is not deploy* — a push can succeed while the host keeps serving the
  previous build, silently. Landed as a Job-B rule with their sharp detail: **count the assets**,
  because a broken extraction returns zero results and reads exactly like success. Timely: REG-IN
  had **no deploy at all** until today, so the first one sets the habit instead of inheriting
  trust from `git push`. Also folded into the Vercel 🧩 prompt before Ishay ran it.
  ② *Closed sections hide live warnings* — generalized into Job C as **archiving and
  self-deletion are the same risk in different clothes**; scan before either, and confirm each
  still-binding instruction lives in the directory `CLAUDE.md` beside its code. We hit this same
  failure today (the `listQuotes` §6 line).
- **Declined (1/3): a separate merge-review skill.** Verified `module-close` already emits a
  formal merge verdict and `post-merge` verifies after — no gap. But their framing exposed
  something real: **`module-close` is run by the session that built the module**, i.e. it is a
  self-audit. Recorded in Job B as "re-verify the closing audit's load-bearing claims yourself"
  rather than as a new skill (F1 — the role already existed, it just wasn't written down).
- **Measured while checking their rolling-window idea, and NOT acted on (needs Ishay):**
  `STATUS.md` is **472 lines with ~30 dated history blocks**, while line 223 of that same file
  declares it "now-only, not an archive". The rule exists and is unenforced. The LOG got an
  owner for compaction today (`module-close`); STATUS has none — that is the actual gap, not a
  missing mechanism. Open question put to Ishay; **not** decided here.

### 31/07/2026 17:00 — **Fix-plan registry consolidated: 7 rounds → 2** (manager session, docs only)
- **§C deleted** — all three rulings executed: (1) rate-limit and (3) cost-split were built inside
  round G itself (`b3470f2`, §7.8↳/§7.83↳); (2) the email engine lives in `PROJECT_MASTER §6:275↳`
  in a wording more precise than the plan's draft. Nothing was left to open a session for.
- **The `listQuotes` §6 line landed** (`§6:276↳`). It had existed ONLY inside the self-deleting
  plan file — grep of PROJECT_MASTER returned 0 matches. Found by the work-manager skill's own
  Job-C rule during its first eval run, i.e. the guardianship rule caught a real gap unprompted.
- **§F shrunk, not deleted** — most of it duplicates module-3 phase 4 (4.1/4.2/4.3 already own
  RLS/RPC/server-permission tests); running it standalone would have written the same tests twice.
  The three items phase 4 does NOT cover stay: no deno/CI step for `send-email` (verified again:
  eslint still reports "File ignored"), the 99,999 ₪ injection test that asserts no output string,
  and the sort tests whose fixtures are identical on both sort keys. A ⚠️ header states the
  shrink was approved on the condition of no loss, and names where the residue must land.
- **Only E and F remain.** Ishay's condition ("no harm to the result") is why F was shrunk rather
  than dropped — a self-deleting registry may only lose an item once it is genuinely covered.

### 31/07/2026 16:35 — **New skill: `work-manager`** (the manager/plan-critic role, extracted from a full day of live use)
- **What:** `.claude/skills/work-manager/SKILL.md` — the seventh repo-local skill. Codifies the
  role this session performed all day: boot-from-disk, plan critique against code (symbol-anchored,
  silent-failure-first), work review that *runs* tests rather than trusting counts, ruling
  guardianship ("a self-deleting artifact must never be a decision's only home"), sequencing/batching
  doctrine, rule-16 concurrency ops, and verified self-contained prompts for other sessions.
- **F1 subtraction:** replaces the hand-carried continuation mega-prompt for manager sessions.
- **Cross-pollinated from gedood-710's work-manager** (5 adopted: verbatim-quote rulings ·
  bundle-inherits-least-urgent-visibility · same-file⇒same-session · pathspec-only staging with
  the *real* 31/07 shared-file lesson · scratchpad-queue for deferred writes; rest skipped —
  covered by global CLAUDE.md/rule 17/post-merge, or gedood-specific like deploy-proof).
- **Doc-writes were queued ~30 min** while round G's builder held STATUS/LOG (rule 16); landed
  here in one commit after `b3470f2` cleared the arena. The Stop hook looped meanwhile — correct
  behavior, deliberate wait. Skill evals: offered, pending Ishay's call.

### 31/07/2026 16:30 — **Round G DONE and verified** (commit `b3470f2`) — rate limit · cost split · bucket limits · description default
- **Applied + client + tests + docs all landed.** §7 write-backs went in FIRST (§7.8↳ · §7.83↳ — **both were round-C rulings that had never been written back anywhere** — plus new **§7.86**, the migrations-folder ruling). Gate exit 0 · 366 unit (+6) · E2E 36/36 + 3 new (`e2e/cost-visibility.spec.js`). ⏳ **One handoff left: `docs/schema.sql` snapshot refresh** (browser step, rule 17 prompt given to Ishay).
- **🔴 The incident, recorded because the lesson generalizes:** the MCP connector timed out twice on the full migration payload (state verified untouched after each — no half-apply). I re-sent it **compacted**, and the compaction silently dropped two function bodies while `drop column cost` did run — so `approve_quote_and_create_project` and `replace_quote_lines` referenced a dead column for a few minutes. Caught by verifying instead of assuming, fixed forward in two migrations, all three re-read from `pg_get_functiondef`. **Generalized lesson: shrinking a payload IS an edit and needs a re-read against the source** — the same class of failure this whole round exists to model. Registered as 3 rows in `schema_migrations`; the file header carries the full account.
- **Verification worth reusing — the rate limit was proven with ZERO permanent rows.** Ishay had approved test-row injection into the live DB; it turned out to be unnecessary. A single `DO` block sets `request.headers` **transaction-locally** (`set_config(..., true)`), calls the RPC 16×, then `raise`s to roll itself back. Output: *"הקריאה הראשונה שנחסמה: 16 … אחרי איפוס היומן: עברה ✅"* — 15 pass, the 16th is blocked, and **deleting the log rows removes the block**, which is what proves causation rather than coincidence. **This pattern replaces live-row injection for anything that reads `request.headers`.**
- **Embed shape was measured, not assumed** (the plan-review flagged it): PostgREST returns an **object or null** for the one-to-one `product_costs` embed. An array would have made every cost `null` **with no error** — profit = full revenue. `flattenProductCost` (`src/lib/catalog.js`, shared by both API layers per rule 14) maps a missing cost to **`null`, never `0`** — same "unknown ≠ zero" distinction as the VAT guard, and both new unit tests were watched failing on a `?? 0` version.
- **Follow-up worth knowing:** a full E2E run makes exactly one failed login, so 15/IP/hour permits 15 full runs per hour — the suite cannot rate-limit itself.

### 31/07/2026 16:55 — **Self-audit on Ishay's "what else didn't you check?" — five real gaps** (commit `3be1df2`)
- **The prompt I had handed him was wrong.** `docs/schema.sql` is a **hand-annotated Hebrew snapshot**, not generator output — Studio's "Generate schema SQL" would have wiped every comment. Patched surgically instead (round-G delta block) and **verified column-by-column against the live DB**; both historical `products.cost` definitions now carry an inline ⛔ pointer so a reader of line 64 isn't misled. *(Found by actually opening Studio in Chrome — the browser trip paid for itself by invalidating the plan, not by executing it.)*
- **`supabase/README.md` contradicted a ruling made the same day**: it claimed "baseline + migrations in order reproduces the current state" — exactly what §7.86 established is false. A future session would have trusted it. Retracted with the measured numbers.
- Three more doc drifts: `PROJECT_MASTER` §2 still attributed `cost` to `products` and knew neither new table · `src/CLAUDE.md`'s deny-all list omitted `login_rpc_calls` (added the two silent-break invariants there too) · `micro_guides/module-3.md` §9 had no round-G entry.
- **Untested path found and closed:** every verification so far had been a READ. Product create/update through the split write was never exercised — tested live (insert → cost row → upsert → `moddatetime` bumps → cascade delete), fully reversible, zero residue.
- ⚠️ **Near-miss worth recording:** my first write probe reported a 23505 on the upsert. It was **the probe** that was wrong (raw REST without the `resolution=merge-duplicates` header supabase-js sends), not the code. Re-ran it the way the app actually calls it before reporting anything — a false bug report to Ishay would have cost him a decision he didn't need to make.
- **Generalized lesson: "the gate is green" and "I verified it" are different claims.** The suite was green while an entire write path had never run once post-migration.
- **Live re-measure replaced the stale audit numbers** (the audit prompt's own warning fired): migrations are **21 files / 18 registered / 12 renamed**, not 20/17/11 — round A's migration joined the drift. Ruled §7.86: MCP is the only apply path, the folder is documentation. One-time repair rejected because the next MCP apply re-opens the gap.
- **Gap proven BEFORE the fix** (`scratchpad/cost-exposure-probe.mjs`, read-only, signs in as all five roles from `.env.local`): **all five** — including מנהלת גיוס and מנהלת לוגיסטיקה, fully blocked on 'הצעות מחיר' — read `products.cost`. That is the evidence the post-apply run must invert.
- **Fresh-context plan review caught two real defects before build** (worth keeping as a pattern, not just this instance): (1) the new "no cost row" RAISE would have fallen silently to the generic fallback because `SERVER_MESSAGE_RULES` in `src/lib/quotes.js` is prefix-matched — the migration and the mapper must ship together; (2) the plan named `20260723115000` as the approve-RPC's file, but the **live** body is `20260731085335` — rebuilding from the file would have silently reverted round A's VAT guard. Both are now explicit in the migration header.
- **Self-caught before showing Ishay:** wrote `%s` instead of `%` in a plpgsql RAISE — would have printed "לא מוגדרת עלות למוצר X s" to the user.
- **Two 👤 approvals outstanding:** typed-echo `round_g_db_hardening`, and sign-off on the rate-limit test rows (1 row in `login_attempts` for `ratelimit.test@example.invalid` + ≤32 in `login_rpc_calls`, with the exact cleanup queries shown up-front rather than reported after — Ishay's explicit instruction on the plan).

### 31/07/2026 15:40 — **Market-standard spot-check of the BUILT money/security rulings — zero defects found** (read-only, no code touched)
- **Why:** Ishay asked "is everything built to what's standard?" Measured answer: of **85 §7 rulings, exactly 1 cites an external source** — the market-check habit only started 30/07. So the 13 money/security rulings already live in modules 1–3 were spot-checked retroactively. Ishay's calibration, applied as a third filter: *"בערבון מוגבל — בסוף זה פרויקט אקדמי."*
- **Verified sound:** §7.25 (agorot stored / whole shekels displayed) · §7.26 (additive discounts, ≤100%, enforced in **both** `pricing.js` and DB CHECK — above the usual bar) · §7.27 (highest `min_qty ≤ qty` wins; the PK kills the only ambiguous case) · §7.49/50/51 (atomic conversion + post-approval lock + VAT snapshot = the "quote is a frozen snapshot" standard, re-confirmed against Salesforce CPQ the same day).
- **§7.1 VAT — re-verified against live 2026 sources, not memory:** Israel is still **18%** (rose Jan-2025, no 2026 change). Live DB `אחוז_מעמ = 18`. **Zero hardcoded `18` in `src/lib/pricing.js`** — a future rate change is a data edit, which is itself the market-standard design.
- **Deliberate deviations, judged CORRECT for this context (do not "fix"):** §7.21 (no record-level ownership — module-level permissions only; enterprise CRMs add row ownership, unjustified for a 5-person company) · §7.24 (exposed test passwords not rotated — private repo, test users only). ⚠️ **§7.24's precondition was re-asked and CONFIRMED the same session:** Ishay — *"בהגשה אני רבע שעה מציג את המערכת, אין קוד."* The submission is a **live 15-minute demo**, no code handed over, so the git history never leaves the private repo and the ruling stands in full. Written back into §7.24 with a ⛔ not to re-raise unless the delivery model changes (public repo / code handed over / a real user on the system).
- **↳ Worth carrying forward for planning:** the graded deliverable is a **live walkthrough**, not a code read. So for the remaining rounds and for M4+, "does it work on screen with real data" outranks internal polish — while correctness stays non-negotiable, since a demo failure is the one thing that cannot be recovered in the room.
- **Already in flight, not a new finding:** §7.8's 5-attempt account lockout is the pattern OWASP now de-emphasizes in favour of IP rate-limiting — exactly what round **G** already carries (15/IP/hour).
- ⛔ **Explicitly NOT done:** re-auditing the 72 non-money/non-security rulings against the market. Weeks of work, mostly business-specific, deadline 19/09. The habit is worth applying **forward** (module 4's pre-decision round), not backward.

### 31/07/2026 14:45 — **Audit fix-round D: DB messages reach the screen · inactive product never zeroes a line** — CLOSED (both 👤 approvals given; §D prompt deleted, C/E/F/G remain)
- **What changed:** (1) `quoteServerErrorMessage` mapper in `src/lib/quotes.js` — 11 P0001 RAISE
  sites distinguished by Hebrew prefix (SQLSTATE only separates 42501/P0002/rest); wired via
  `toWriteError` into the 3 write paths of `03_quotes/api.js`. English enums translated, unknown →
  fallback. (2) `getPricingCatalog` now fetches ALL products; §7.34 filter moved into
  `QuoteLineEditor` (+ amber "מוצר מושבת" tag, reprice keeps prior values — never `: 0`).
  §7.34 write-back done FIRST (ruling delegated to market standard — Salesforce CPQ keeps
  deactivated products on existing quotes). Details + evidence: `module-3.md` §9 (14:20).
- **Why:** six different approval/edit failures all surfaced as one "אישור ההצעה נכשל."
  (`e.cause` nobody rendered); a product disabled after entering a quote silently repriced its
  line to 0 ₪ and blocked save with an unactionable message.
- **Proven by returning the failure** (warning 3): mapper broken → 5 unit tests fail; guards
  reverted → E2E fails on the generic text; the first inactive-product interceptor **passed
  against the broken code** and was rewritten to mimic the server-side `active` filter. Gate
  exit 0 · 360 unit · E2E 32/32 ×2.
- **Bonus:** fixed a pre-existing intermittent E2E failure in `load-failure-guards.spec.js`
  (signOut→loadUser remount wipes login inputs mid-test under load; recovery now starts from a
  fresh `goto`). Not the documented module-1 matrix flake — a different one.
- **🐞 Follow-up 15:00, and the most useful part of the round:** Ishay asked *"what didn't you
  check?"* and the answer contained a real defect **I had introduced**. The picker list was derived
  once per table from all in-use skus ⇒ the disabled product appeared as a plain option in **every**
  row, so it could be added to a NEW line — the exact inverse of §7.34. Nothing caught it: unit tests
  don't render Radix, and every screenshot showed the select **closed**. Screenshotting the **open**
  list is what exposed it. Fixed to `productGroupsFor(currentSku)`; E2E now locks both directions and
  was watched failing against the broken version. The same follow-up added the **edit-save toast**
  test that the approved plan promised and the first pass silently skipped — a different render path
  from the approve dialog, so "works in approve" never covered it. E2E 34/34.
  **Two durable lessons:** (1) *a screenshot of a closed control proves nothing about its list*;
  (2) when a plan enumerates N verification sites, tick them off explicitly — the dropped one here
  was invisible until asked about.

### 31/07/2026 12:01 — **Two of Ishay's rulings had no build site; moved into round G** (`d7e71bd`, docs only)
- **The failure mode, and it is structural — worth remembering:** `docs/audit_2026-07-31_fix_plan.md` is self-deleting by design (round closes ⇒ its prompt is deleted). Round **C was a rulings round**, so Ishay's two DB rulings — rate-limit `register_failed_login` to **15/IP/hour**, and **split `products.cost`** into a child table — lived *only inside the prompt scheduled for deletion*. Neither D/E/F/G referenced them (verified: `register_failed_login` appears only under §C). Had the seven rounds run to completion, both rulings would have evaporated with their own prompt. **Generalized: a self-deleting plan must never be the only home of a decision** — rulings belong in a section that outlives the work item.
- **Fix:** both copied **in full** into §G — self-contained, with sources (OWASP · Auth0 10/IP default) and the "why 15, not 10" reasoning (five test users share one Wi-Fi; 20 calls/hr is what perpetual lockout needs, so 15 breaks the chain). Explicitly *no* pointer back to §C, since §C may no longer exist when G runs. §G's title and task line now say "decision + execution"; all four DB items land in one migration = one typed approval.
- **§F corrected — half its claim had expired:** "no test asserts 6,319 ₪ appears in the document" was true at audit time and **round A fixed it same-day** (`quotePdf.test.jsx`, asserts `מע"מ (18%)` · `5,355 ₪` · `964 ₪` · `6,319 ₪` · `not.toContain('מע"מ (0%)')`). Left as a dated correction rather than a deletion, because **the other half stands and is worse than written**: `'מתעלם מסכומים שמוזרקים מבחוץ'` injects `total: 99999` and asserts only `not.toThrow()` — it asserts **no string in the output at all**, so it stays green even if 99,999 ₪ reaches the client's PDF.
- **Scope discipline:** Ishay approved the rate-limit move; I added the `cost` split on my own judgement (identical defect, same round) and said so explicitly so he can revert it. **Not touched:** `PROJECT_MASTER.md` (the M4 session is editing it live) · the inaccurate justification comment at `e2e/load-failure-guards.spec.js:34` (build session touched that file an hour ago; low urgency, still open).

### 31/07/2026 12:45 — **Three M4 §7 rulings closed, in parallel with another live session** (docs only)
- **What changed & why:** §7.64 (keys) · §7.66 (minimum wage) · §7.65 (hostess email uniqueness) all ruled and committed **one file, one commit each**, while a second session was closing audit round B. Ishay proposed a staging file to buffer rulings until the coast was clear; **declined with reasons** — it is precisely the deferred write-back rule 13(א) exists to prevent, and measurement showed it was unnecessary: `PROJECT_MASTER.md` has **zero** overlap with a phase-4 build session (which writes `e2e/`, `src/`, `micro_guides/module-3.md`). The only shared files are `STATUS.md` + `CLAUDE_CODE_LOG.md` — so this session simply **did not touch them until the end**. Zero collisions; the other session committed `1761e12` between mine without incident.
- **§7.66 — minimum wage:** DB trigger on `hostesses` + form validation, **blocking** (a legal floor, not a business judgement — a deliberate divergence from the warn-don't-block pattern used for below-cost pricing, and Ishay was shown the distinction before ruling). The guard pattern is **copied verbatim from `20260731085335`** (round A's VAT guard, built the same morning): null → blank → numeric regex → range, each with a Hebrew `raise exception`. Existing rows are **not** auto-raised (that is a silent pay change) ⟹ booked `🚧 מ9` for a "who is below the floor" report, without which raising the parameter at M9 creates silent non-compliance. Live: `params.שכר_מינימום_שעתי` = 35.
- **§7.65 — ruled AGAINST the item's own written default** (`hostesses = UNIQUE`), which matters more than the ruling: (1) its stated justification — "target of the invite link §7.45" — **had expired**, since §7.45 closed 07/07 on a per-assignment `invite_token`, so identity rides the token, not the email; (2) the duplicate it guards against is already prevented, better, by `id_number unique not null`; (3) extended-workforce literature documents that field/seasonal staff often lack a unique email and shared household addresses are normal — two sisters working events would be blocked at signup. Soft form warning instead.
- **Self-caught inconsistency (found only because Ishay said "בדוק" rather than accepting the summary):** I had flipped §7.66/§7.65 to ⚪ but left §7.64 at 🟡, though all three are in the identical state — nothing left to decide, only to execute. Fixed. Day's net: 🟡 32→30 · 🔵 6→5 · ⚪ 13→16.
- **Method change Ishay ruled and confirmed as standing:** every ruling is presented as ① what comparable systems do (with a cited source) ② fit to an academic project's scope ③ fit to the existing code — then **one** recommendation. Already recorded in memory `feedback-market-research-first`; step ③ earned its keep twice today (it caught the stale `customers` claim, and the expired §7.45 justification).
- **Still owed for M4, deliberately deferred to the pre-round:** §7.67 (assignment↔shift lineage) · §7.55 (event coordinates) · §7.15 (terminology). Not because they are hard — because each is better ruled with M4's blueprint open, not as an abstract chat question.

### 31/07/2026 11:25 — **§7.64 key policy: two of four stages closed** (docs only — no code, no migration)
- **What changed:** two of §7.64's four stages closed. **(1) `products.sku`=M3 — verified DONE**, not merely planned: all three FKs return `update_rule=CASCADE`. **(2) ת"ז → surrogate APPROVED** as M4's first migration. Direction was ruled 10/07; this session added the measurement and the ripple list. Also: Ishay ruled a **fixed shape for every ruling** — ① world practice ② academic-scope fit ③ existing-code fit → one recommendation.
- **Why it was cheap-and-certain (measured live, none inferred):** `hostesses`/`assignments` = **0 rows** ⟹ no data migration · `id_number` = **zero occurrences in `src/`** (two independent repo-wide searches) · all **six** dependants are *structural*, so `hostess_id` is a mechanical rename, not a logic change.
- **The finding that mattered:** four of the six lived in M4's **planning docs**, and research-doc §11 is declared "the only section a build session reads" — a future session would have built ת"ז-as-key faithfully to the doc, never seeing the ruling. §11 now opens with a 🔑 banner; normative lines renamed in place. Dated entries (§3.3, §9.11, §11.3) **not** rewritten per the docs rule — the banner names §11.3 explicitly and overrides it.
- **What I got wrong:** claimed `customers` was still a natural (ח"פ) key — I read `docs/schema.sql`, a *snapshot*. Live it is already `bigint identity` (M2, `20260710160735`). Corrected in-session; it improved the picture — §7.64 is a four-stage plan already running (customers=M2 ✅ · sku=M3 ✅ · ת"ז=M4 ← now · email=M9 accept) with a template migration to copy.
- **NOT done:** the migration (M4's first step, needs typed approval) · `docs/schema.sql` (snapshot — updates when the migration lands) · any code (`id_number` is absent from `src/`). Gate: `check:context` exit 0; §7 counts unchanged.

### 31/07/2026 10:47 — Audit round **B** CLOSED: three `catch` blocks that silently disabled safety nets
- **What changed & why:** in all three, a *load failure* was indistinguishable from *"loaded, nothing here"* — and each one thereby switched off a guard built after a real incident. (1) `CustomersPage`'s revenue `catch` wrote `{}`, so `handleToggleStatus` mapped every customer to `openCount:0`, `archiveWarningMessage` returned null, and the §7.34 archive warning **vanished entirely** — now an explicit `null` (not "leave as-is": the effect re-runs on every `reloadTick`) + `revenueLoadFailed` + a non-blocking amber banner with retry. (2) `QuoteDocumentDialog`'s `.catch(() => {})` made the window declare "not sent yet" **on the strength of a failure** — `previousSend` is now tri-state (`undefined`/`null`/row) and unknown opens a confirm; the three strings live in `src/lib/email.js` as an engine contract for M4/M8/M11. (3) `AuthContext` never captured the permissions error ⇒ empty map ⇒ `ProtectedRoute` said "אין לך הרשאה" — a screen identical to a real denial, on a code path that re-runs on **every token refresh**.
- **Sibling path handled, not deferred:** `send-email` logged `email_log` insert failures to `console.error` and still returned `ok:true` — the mail went out and the double-send guard died unseen. Response now carries `log_failed` (additive; old clients unaffected), surfaced in the dialog. Deployed as **version 3**, verified by diffing the source the server returns.
- **Bonus fix in the same function, same failure family and worse:** any error on the `users` query triggered a full `signOut` + "your account is not authorized" — a one-second network blip **ejected a working user and blamed them**. Only `PGRST116` (no row) now signs out.
- **Every guard proven by returning the failure, per warning 3** — not by watching it pass. With `{}` restored, the archive confirm never appears (the customer would be silently archived); with `previousSend` back at `null`, **no question is asked at all and the click goes straight to sending** (that negative run was executed with `functions/v1` blocked so no real mail could leave); with the permissions branch disabled, the old denial screen returns. All three restored and re-verified green.
- **Regression:** `npm run gate` **exit 0** · **353 unit** (was 345) · **E2E 24/24, zero skips** (was 21) · new permanent spec `e2e/load-failure-guards.spec.js` — route-interception only, plus one test customer created and deleted, because all four live customers hold an open quote so there was no "clean customer" case for the regression half.
- ⚠️ **A screenshot nearly produced a false finding.** The permissions-failure capture showed an almost-empty sidebar, contradicting my own plan note that the sidebar does *not* empty (`Sidebar.jsx` filters only `'blocked'`). Measured instead of assumed: the `modules` request returns **200 with all 7 rows** and the sidebar renders all 8 links — the screenshot had caught it mid-load. The plan's correction stands; the artifact was timing.
- **A 4th site of the same family, fixed after Ishay pushed back on deferring it — and he was right.** I had classified `getSentQuoteIds` in `CustomerDetailsPage` as display-only. It isn't: an empty Set on failure renders **"טרם נשלחה ללקוח" on a quote that was in fact sent**, and that amber line is precisely the cue that makes a person open the dialog and send. `sentIds` is now `null`-when-unknown, both badges disappear, and a notice takes their place. Proven the same way: with `new Set()` restored the test fails. **The lesson: "display-only" is not a property of the data, it's a claim about what the user does next** — a label that drives an irreversible action is a guard.
- **A 5th site, found only because I tried to test the 4th.** Writing the E2E for the transient-`users` branch, it failed against my own new code: `LoginPage` **queries `users` itself** right after Auth, so it hits the failure first and `AuthContext`'s branch is never reached on the login path. Its `if (dbError || !userData)` told a legitimate user *"משתמש זה אינו מורשה במערכת"* and signed them out — the same accusation, one layer earlier and more visible. Both now split on `PGRST116`, verified empirically against the live DB (`.single()` on zero rows returns exactly that code). **Evergreen: a fix you cannot reach from the UI is not a fix — the test that tries to reach it is what proves the path.**
- **Two assumptions turned into facts rather than left as reasoning:** `PGRST116` is what `.single()` returns for zero rows (queried live), and `functions.invoke` parses `application/json` into `data` (read in `@supabase/functions-js`), which is what makes `fnData.log_failed` readable at all.
- **Not done, said out loud:** the server's `log_failed` branch was never observed live — there is no safe way to fail an `insert` in the single live project, so only its strings are unit-tested. The transient-`users`-error branch (no longer signs the user out) is **the least-proven change in the round**: reasoned from the `PGRST116` contract and reviewed, but not exercised by any test.
- **Live data verified untouched after ~10 spec runs:** 4 customers / 0 archived / 0 test leftovers, 8 quotes, `email_log` still 1 row whose newest entry predates this session.

### 31/07/2026 09:06 — Reviewing round A's plan + capturing Ishay's round-C ruling (no repo writes to code/migrations)
- **Reviewed round A's execution plan before Ishay approved it**, independent of the session running it: verified the caller-graph claims (`buildQuoteDocument` has zero production callers; single path via `renderQuotePdfBlob`) and the quoted RPC body against the live migration file — both checked out. Flagged two things back to Ishay to relay: (1) diff the unchanged parts of the RPC body after `CREATE OR REPLACE`, since a full-body copy of a security-definer function is the highest-risk step in the round; (2) the DO-block failure-injection test (step 7 row 3) must pick a quote that already passes the RPC's four earlier checks (permission/status/date/hostess-line), or it "succeeds" for the wrong reason.
- **Round C, item 1 (anon-callable `register_failed_login` — remote account-lockout DoS): Ishay delegated the numeric threshold** after saying he didn't know current practice. Researched rather than guessed — OWASP Authentication Cheat Sheet + Auth0's brute-force-protection default (10 calls/IP). Ruled and written into `docs/audit_2026-07-31_fix_plan.md` §C: **15 calls/IP/hour**, chosen against a concrete fact Ishay confirmed (all 5 test users share one office Wi-Fi) — high enough that ordinary shared-IP mistakes won't trip it, low enough that an attacker can't sustain the 20/hr steady rate a permanent lockout requires. Stated plainly in the file: this reduces severity, doesn't close the hole (A-22/Auth Hook is the full fix, deferred).
- **No writes to `src/`, `supabase/migrations/`, or any file round A owns** — held off on `STATUS.md`/this file while round A was actively mid-edit (repeated Stop-hook fires while its files were still changing); this entry only lands now that they've been stable for 9+ minutes.
- **Round C, item 2 (shared email engine unusable by M4/M8/M11) — RULED at 09:20 and written back to `PROJECT_MASTER §6` (rule 13 ripple).** Researched first at Ishay's explicit request: the governing principle across Curity/Supabase/Auth0 is *the server derives authorization from the resource; it never trusts a client-declared scope* — which makes the intuitive fix (client sends the module name, server allow-lists it) the **wrong** one. **Ruled: build it as module 4's FIRST step**, not before M3 closes (M3 is nearly done; and M4 cannot send anything without it, so it is that module's natural step 1). Scope fixed to three things — a **closed server-side** `entity_type ⇒ required module` map (a natural extension of `email_log.entity_type`, polymorphic by design since `20260730095439`), attachment becomes **optional** on both sides (3 of the 6 templates carry none), and the two quote-specific strings move out of `src/lib/email.js` into `src/lib/quotes.js`. **Explicitly NOT built now** (Ishay's call — academic project, 19/09 deadline): having the server derive recipient+body from `entity_id` instead of accepting them from the client; risk is low because all 5 users are identified employees, and it is recorded as a future item rather than silently dropped.
- **The §6 entry it amends was itself wrong.** The existing email-engine row told M4/M8/M11 to "consume the engine as-is" — impossible today. The `↳` correction names all three blockers with file evidence, so the next module reads the corrected instruction rather than the original one.
- **Round C, item 3 (`products.cost` readable by every authenticated user) — I was about to hand Ishay a question he had already answered.** Presented it as an open §7.28 product decision; reading the code first (the standing "step 3 — fit it to the existing code" rule he set this session) surfaced the comment above `computeLinesCost`: *"§7.28 + הכרעת-ישי 29/07: מוצג לבעלי הרשאת-עריכה, לעולם לא ב-PDF ללקוח"* — already ruled and built. Recommending "restrict it from the projects manager" would have contradicted his own ruling. **Reframed to what actually remains: the DB is more permissive than the ruling** (`products_select_all_authenticated using (true)` exposes `cost` to roles fully blocked on quotes). Ishay approved aligning the DB to the existing decision — a gap-closure, not a new ruling.
- **🔴 My own bad citation, corrected by the round-A session and verified here.** I wrote in `STATUS.md` that round A's commit ran `git add -A`. **It did not** — I inferred the cause from seeing my files staged instead of checking it. The disproof was in front of me the whole time: `docs/PROJECT_MASTER.md` was *not* in the commit, which `add -A` would have swept in (verified: `git show --name-only 2f8824c | grep -c PROJECT_MASTER` = **0**). What *was* true is narrower — `STATUS.md` and the fix-plan were edited by **both** sessions, so round C's rulings rode into round A's commit. Also verified their second correction: `7ac1e47` (the hash I recorded) exists as an object but is **on no branch** — they amended the message after I had already cited it. Real hash: `2f8824c`, 18 files. **The lesson is mine and it is the project's own rule 4:** a claim about external state gets checked in the same turn, not inferred from a symptom.
- **Precondition block written at the head of prompt B** (outside the copy-paste fence, so it is read before pasting rather than swallowed): one live writing session only — with *this* incident named as the evidence, since B touches two of the same files round A did · working tree clean first (`docs/PROJECT_MASTER.md` is still dangling from the §6 email-engine write and must be committed before or with B) · the baseline it departs from (`2f8824c`, gate 0, 345 tests, E2E 21/21) · **and the known-flaky `permissions.spec.js` test**, flagged explicitly so that if it fails during B nobody hunts a regression that isn't there.
- **And he corrected my proposed fix.** I had written "a view without `cost`"; he asked whether splitting in two would help. Checked: **Supabase explicitly recommends *against* column-level privileges**, and their core discussions land on *"splitting sensitive columns into separate tables with RLS policies"* as the clearest approach — a `security_invoker` view **cannot** restrict columns, so my direction would not have worked. Fix-plan §C(3) rewritten to the split (⚠️ the **table**, not the screen — the leak is at REST level, and the prices screen is already CEO-only), with the three read sites flagged, plus the one the split must not miss: `approve_quote_and_create_project` reads `products.cost` directly.

### 31/07/2026 09:2x — Audit round **A** (VAT guard) CLOSED — code + migration, every guard proven failing
- **What changed & why:** one `params` row (`אחוז_מעמ` / `ימי_תוקף_הצעה`) deleted, renamed or saved blank became `0`/`NULL` in three consumers that all bypassed `pricing.js`'s "empty is not 0". Landed in `src/`: `quotePdf.jsx` drops `?? 0` in **both** places and `buildQuoteDocument` now throws `MISSING_VAT_MESSAGE` with `code:'MISSING_VAT'` (validated by the *existing* `parseVatPercent`); `QuoteDocumentDialog` distinguishes that code and shows what to fix (`data-testid="quote-document-error"`); `CustomerDetailsPage` aligned to `parseVatPercent`; new `missingPricingParamsMessage()` + amber banner on `QuotesPage` (Ishay's ruling — a loud cron failure nobody reads is a silent one).
- **Reader-trace before touching the engine (the prompt demanded it):** `buildQuoteDocument` has **zero** production callers; the only path is `renderQuotePdfBlob` → `QuoteDocumentDialog` (single call site) ← 3 screens, one of which already blocked. Download/send were **already** dead when `blobUrl` is empty — verified, not rebuilt. `emailSendDisabledReason` deliberately untouched (generic engine, M4/M8/M11).
- **Guard proven by returning the failure:** restoring `?? 0` turned **8 new tests red**; restoring the guard → 24/24. Repo-wide: **341 tests pass, `eslint .` clean**.
- **DB (migration `20260731085335`, applied via MCP after typed-echo):** the approval RPC now validates `אחוז_מעמ` **before any write** (no orphan project), two CHECKs on `quotes`, and the expiry cron raises instead of reporting `UPDATE 0` nightly. Three checks Ishay asked for by name all passed: `security definer set search_path = ''` **re-read from `pg_get_functiondef` after apply** (the project has a whole migration born from that line's absence); `cron.job` = **exactly 2 rows, jobid=1 preserved**; and the RPC injection ran only after a **control** proved the quote clears the four older gates first — otherwise an old failure would have masqueraded as the new guard. Both injections returned the **specific** Hebrew message and self-rolled-back; DB verified byte-identical after.
- **A 4th site of the same family, found by looking at the screenshot:** `deriveQuoteMetrics` summed `total ?? 0` ⇒ the tile read "שווי הצעות פתוחות: **0 ₪**" right under the banner saying pricing is impossible. Now `null` ⇒ `—`. Same screenshot caught "יש להוסיף את **השורות**" for one missing row (number agreement).
- **Asked "what haven't you checked" ⇒ three real gaps closed after the round looked done:** (a) nothing proved the **correct** VAT prints — added a tree-walk assertion on `מע"מ (18%)`/`5,355`/`964`/`6,319` (props too, not just children: the totals text arrives as `label`/`value` props), mutation-proven with `${vatRate * 0}`; (b) the two CHECKs were proven to **exist**, not to **reject** — first attempt was worthless (INSERT died on `recommended_hostess_count` first), redone with a passing control ⇒ `23514` by constraint name; (c) the RPC now also proven to reject **out-of-range** (`'150'`), not only missing. Lesson worth keeping: *"the guard refuses"* and *"the guard lets the right value through"* are two different tests, and only the first one was written.
- **Regression:** 345 unit · lint clean · build ok · `npm run gate` **exit 0** · E2E **21/21** on the 2nd full run. New permanent spec `e2e/quote-document.spec.js` (route-interception, **zero DB writes**), whose happy-path half exists so the blocked-path half cannot pass on a screen that renders nothing. ⚠️ Run 1 had **1 `permissions.spec.js` failure** — passes isolated and on re-run, unrelated files, DB confirmed at baseline ⇒ logged as a **pre-existing flake**, not a regression.

### 31/07/2026 04:2x — `quality-audit`: first whole-codebase review on record (read-only)
- **Scope/method:** 10 parallel reviewers, one dimension each (silent failures · test quality · testing architecture · comment accuracy · OWASP security · DB/RLS live via MCP · a11y · Hebrew UI copy · architecture+debt · duplication). Ran on `f1c1f57`, clean tree, after Ishay chose to wait ~2h for the parallel 3.7 session to close (its `e2e/zz-*.spec.js` were being written 1 min before the first check). **Zero code/DB writes.** Every top-tier finding re-opened and confirmed by me against the file before it entered the report.
- **Gates measured, not quoted:** lint **0** (10 `sonarjs` rules at `error`, **0 inline disables** — verified) · jscpd **3 clones / 0.33%** · knip **clean** · audit **2, both the waived `react-router`** · **327 tests / 10 files** · E2E **19 tests / 5 specs, all 5 cred pairs present in `.env.local` ⇒ 0 skips**.
- **🔴 Top findings (all confirmed at file:line):** (1) **one missing `params` row breaks 3 paths silently** — `quotePdf.jsx` `?? 0` prints `מע"מ (0%)` in the customer's PDF, `approve_quote_and_create_project` freezes a **NULL** `vat_rate_snapshot` into quote+project, and the expiry cron compares against `NULL` ⇒ **quotes never expire, reporting success nightly**. (2) three `catch` blocks disable safety nets built after real incidents — archive warning (`{}` reads as "zero open quotes"), double-send guard (`.catch(() => {})` + a server-side `console.error`-only path), and `AuthContext` silently degrading a working user to deny-all. (3) **`register_failed_login` is granted to `anon`** and takes the email as a parameter ⇒ any unauthenticated caller can lock any known account indefinitely; the victim cannot self-unlock (reset requires auth). Not the documented fail-open — the opposite direction, undocumented. (4) the "generic" email engine is **unusable by M4/M8/M11**: `send-email` hard-codes `'הצעות מחיר'`+`edit` (recruitment mgr is **blocked**, finance **view** per §3) and both sides require a PDF attachment while 3 of 6 templates have none — **this contradicts the §6 instruction to consume it as-is**.
- **🟡 Also confirmed:** RPC Hebrew error messages discarded by `toError` (4 distinct failures → one string; `ApproveQuoteDialog`'s comment claims the opposite) · permissions tested 3× at the UI layer, **0× at RLS/RPC/Edge** — and `eslint` **ignores** `supabase/functions/` with no `deno` step in CI · migrations dir **not re-runnable** (3 unregistered + 11 timestamp drifts ⇒ no automated restore) · deactivated product silently zeroes a quote line · M2↔M3 circular imports with no boundary lint · `listQuotes()` unbounded and **absent from §6** · `products.cost` readable by every authenticated user.
- **Comments that lie (dangerous class):** `PriceTiersDialog`'s opening comment describes the **delete-then-insert order that caused the 30/07 data loss** as the current convention (code is upsert-then-delete) · `pricesApi` declares `replaceCustomerContacts` unfixed (it was fixed same day) · `CustomersPage` holds two adjacent contradictory §7.34 comments, the first ordering "do not build a guard" that the second builds.
- **Doc drift found:** `src/CLAUDE.md` says 7 `supabaseClient` importers (**10**) and 45 files reviewed (**61**), and its "duplication is no longer an open finding" claim holds for complexity/dead-code but **not** duplication (jscpd threshold 3% vs 0.33% actual leaves real headroom) · `architecture_and_qa_roadmap.md` still describes E2E as "module 1 only, 2 specs".
- **Ishay asked whether to build a general bug-fix skill (`skill-creator`). Recommended NOT now, and he took the recommendation.** Reasoning, per the context-engineering reference's principle 1 (*don't add a standing rule for a one-off*) and principle 7 (*an instruction file is a claim, not proof*): one audit wave is an event, not a pattern, and every level is already owned — `module-build` (routine fix) · `superpowers:systematic-debugging` (stubborn bug; **off with a written trigger in `toolbox.md`**) · `_shared/discipline.md` + `src/CLAUDE.md` (verification discipline) · the 7 prompts (these specific bugs). Building a 7th skill now would also pre-empt the 🔮 post-M4 checkpoint that exists to measure whether the 6 existing ones earn their keep.
- **F1 declared out loud (addition without subtraction):** the ONE thing not already covered — *a guard never observed failing is not a guard* — was added as **warning 3** in the fix-plan file, not as a skill, with the 29/07 audit-gate precedent (Ishay demanded it be proven to fail) cited inline. **A design flaw in my own file, caught while writing:** prompts are pasted individually into fresh sessions, so a header the copier leaves behind is not read — each of the 7 now opens with an explicit pointer back to the three warnings. Revisit-trigger parked in STATUS's 🔮 checkpoint: **build the skill only if the same discipline paragraph gets rewritten across 3–4 fix rounds** — evidence, not a guess.
- **Output:** `docs/audit_2026-07-31_fix_plan.md` — 7 ready-to-paste Hebrew prompts (A VAT guard · B the three silent catches · C Ishay's 3 rulings · D server messages+deactivated product · E lying comments + 5 verified-safe merges · F tests at the real layer · G migration-restore path), self-deleting as rounds close, plus 2 §6-ready lines. **Prompts state problem+evidence+acceptance, never the code change** — several findings were explicitly "direction only", and line numbers drift once round A lands.

### 31/07/2026 01:28 — Step 3.7 🎨 gate: the machine half ran; 4 findings are with Ishay (👤)
- **Method:** three throwaway Playwright specs (review sweep · direction/validation measurement · dialogs), network-level read-only guard — **0 write requests reached Supabase in any run** — all three deleted after use.
- **Passed, measured not eyeballed** (`/quotes` · `/quotes/new` · `/customers/:id` · `/system/prices`): loading/error+retry/empty/no-results on every screen · **~200 real Tab stops, 0 focused elements without a focus indicator** · 0 horizontal overflow · ₪ same side everywhere · 0 console errors · Esc closes the document dialog, focus starts inside the reject dialog, and reject-without-reason is blocked **before the network**. Two of the three pre-booked 3.7 items were already fixed 30/07 evening and re-verified in code.
- **Findings (rulings pending):** (1) the quote builder marks only the customer field as invalid — event-name/date/location get red text but a plain slate border and no `aria-invalid`/`aria-describedby` (measured `oklch(0.869…)` vs the picker's `oklch(0.577…)`); root cause is the local `Field` component never wiring the error to its input. (2) Test quotes **#14/#15** are stuck in live data on customer 46 (half of מדיטק's list, will ship to Vercel) and the §7.50 lock trigger blocks both DELETE and UPDATE — a mistakenly-created quote can never be removed by anyone. (3) `מ-1 הצעות שאושרו` / `1 ממתינות להחלטה` — number agreement on the customer-page metrics. (4) `jscpd` 4 clones / 0.65% (gate green): `RowAction` is byte-identical in `CustomerDetailsPage.jsx` and `QuotesPage.jsx`.
- **Honestly not provable by machine:** the `<iframe src={blobUrl}>` PDF preview does not paint in an automated screenshot (headless or headed) — environment, already documented in `03_quotes/CLAUDE.md`. The blob IS produced (both dialog buttons render enabled) and the bytes were proven in 3.1/3.3. **One human click on 👁 closes it.**
- **Ishay ruled mid-turn ("כן לכל ההמלצות") — 3 of the 4 are BUILT and verified.** (1) marking is injected by the container, never written per call site: `Field` clones its child with `aria-invalid`/`aria-describedby`, `LtrFieldGroup` grew a per-item `invalid` + `errorId` (the time range and the guests÷ratio formula were the last unmarked fields), and `CustomerPicker` now **forwards** `aria-describedby` — it doesn't spread props, so an unnamed attribute vanishes silently. No new colour: `aria-invalid:border-destructive` already lives in `ui/input.jsx` and its attribute selector outranks the call site's `border-slate-300`. (3) `approvedQuotesLabel`/`pendingQuotesLabel` in `src/lib/quotes.js`, TDD (3 tests first, watched fail). (4) `RowAction` → `src/components/RowAction.jsx`, consumed by both screens; the dialogs-wiring clone deliberately left (handlers and `canEdit` differ — a wrapper with two behaviours is worse than 0.44% duplication).
- **Verified after the fixes:** `npm run gate` exit 0 · **327 unit** (was 324) · **all 18 E2E green** · `npm run smoke` green · jscpd **4 clones/0.60% → 3/0.44%** · live measurement showing all 7 invalid fields red + `aria-invalid` + a describedby that resolves, while the valid `יחס` cell stays slate.
- **Second sweep (Ishay: "יש עוד משהו שלא בדקת?") — four more gaps, all clean:** narrow viewports **1024 and 1366** across the three screens (0 overflow — the filter row sits at 893px in a 912px card, so this was a real risk) · **מנהלת כספים's eyes**: 4 rows + the 👁 document button and nothing else, both blocked routes answering in plain Hebrew · **"נסה שוב" actually recovers** (quotes fetch aborted at the network layer → error state → route restored → one click brings the real table back incl. `6,319`; until now only the markup had been proven) · **focus trap**: 25 Tabs inside the reject dialog, 0 escapes. ⚠️ **Probe bug worth keeping:** the finance run first reported `viewBtns: 0` and looked like a real defect — the testid is `quote-document-<id>`, not `quote-view-<id>`. My probe was wrong, the product was right; the **screenshot** is what settled it.
- **Finding (2) — Claude could not run it: this environment's safety classifier refuses DDL/destructive SQL through the Supabase MCP** (deleting #14/#15 needs `quotes_lock_non_in_progress` briefly disabled). Not worked around; handed over as `scripts/cleanup_test_quotes_14_15.sql` + `scripts/restore_quotes_14_15.sql` (byte-for-byte restore from a snapshot taken first; `email_log`/`projects` confirmed to hold zero references). **Ishay ran it** and pasted the trigger check (`O`/`O`). Verified independently same-turn: `quotes` 10→8 · rows 14/15 = 0 · `quote_services` 24→20 (3+1, exactly the backup's count) · מדיטק 4→2.
- **👁 came back too — "רואים מעולה".** The PDF preview paints for a human; that closes the one item no automated screenshot could reach, and **3.7 + all of Phase 3 are signed.**
- **🐞 The cleanup broke an E2E test, and the proactive regression is what caught it — CI never runs E2E.** `customer-page.spec.js` asserted מדיטק has 4 quotes and that `customer-quote-14` carries `נפתחה בטעות`; the second row no longer exists. **Fixed without weakening either claim:** count 4→2 (the datum changed legitimately — `smoke-anchors.json`'s own rule is "update the anchor, never soften the assertion"), and the rejection-reason assertion **moved to a customer that still has a rejected quote** (עיריית חדרה #11 / `תקציב לקוח`) rather than being deleted — it exists precisely because the PDF omits the reason, so the row is the only place a human can read it. 18/18 green again. **Evergreen lesson: an E2E suite asserting on real seed rows is coupled to them — `grep` the suite for the id BEFORE deleting data.**

### 📦 Week 25–30/07/2026 — Module 3 Phase 3 (PDF · builder · quotes mgmt · email engine · prices) + Smart Match (M4) architecture research + context-architecture overhaul + quality tooling round 2

Evergreen facts already harvested to their SSOT homes as each session closed (rule 13/§9 discipline), so nothing below is the only copy: DB decisions → `PROJECT_MASTER §7` · module-3 as-built/deviations → `micro_guides/module-3.md` §9 · code gotchas → `src/CLAUDE.md` + `src/modules/03_quotes/CLAUDE.md` · Smart Match formula/architecture → `docs/module4_smart_match_research.md` §11 (self-contained build spec) · migrations 6–9 → `db_roadmap.md` §10 · context-tree split + quality-tooling roster → the two Reference sections below (already dated 28/07 and 23–29/07). Kept here as the index:

- **29/07 09:58–19:10 — Module 3 Phase 2 (money SSOT) closed; Phase 3 built through step 3.3** (PDF engine · quote builder · quotes management screen). TDD throughout; the `6,319 ₪` acceptance scenario exact end-to-end. Two silent PDF-render traps (fontkit TTF-only, bidi character-run reversal) and a Radix-picker onBlur/click race are permanent entries in `src/modules/03_quotes/CLAUDE.md`/`src/CLAUDE.md`. Two sessions collided on the branch (rule 16), resolved by evidence not assumption — led directly to the hook fix below.
- **29/07 19:30 — Migration 6:** 8th rejection reason `נפתחה בטעות` (corrects Ishay's own 12/07 "exactly 7" ruling), forced by the discovery that the DB **categorically refuses to delete a quote in any status** (the lock trigger blocks cascading delete too).
- **29/07 19:55 — Validation-message bug fixed:** the error map was `state`, so a corrected field kept its red message until the next save; now derived every render (cross-field rules made per-field clearing unsafe).
- **29/07 22:41 — Iron rule 16 hardened:** the Stop hook could not tell *which* session changed a file, only *that* it changed. `protect-frozen-files.sh` now records real per-edit paths; `check-docs-updated.sh` attributes staleness per-file. Reviewed by an independent agent before shipping, verified live against the real repo.
- **29/07 23:05–30/07 00:05 — Smart Match (M4) architecture ruled from evidence, not the frozen spec's formula.** All three original score components (rating/distance/reliability) were unbuildable today (`hostesses.rating` never written anywhere, `actual_hours` fills only at M6 close, no project coordinates). Ruled: **gate → pin → score → fairness**, three components **acceptance-likelihood · show-reliability · proximity**, weights **0.40/0.35/0.25** (a blind two-persona role-play contradicted the initial equal-weighting). Score stays hidden; UI shows "reason chips" instead. Full spec: `module4_smart_match_research.md §11`. One item left open: which sort angles to build (deferred to M4 opening).
- **30/07 09:05–12:30 — Step 3.4: real email send built** (Make.com webhook → Supabase Edge Function `send-email` → Gmail), replacing the originally-planned mailto. Built as a **generic engine** (`src/lib/email.js`) since M4/M8/M11 all need it (`🚧 מ4/מ8/מ11` in §6). `email_log` pulled forward from M10 (migration 8). Four defects only a live send exposed, incl. a corrupt attachment from Make's `toBinary()` needing an explicit `"base64"` flag and a `using(true)` permissions policy silently 403-ing everyone. All Make/Gmail API gotchas (connection-type mismatch, the working `sendAnEmail` v4 module) already live in `module-3.md` §9 (lines ~1070–1250) — not duplicated here.
- **30/07 09:13–12:15 — Pre-M4 §7 rulings + a doc consistency sweep.** One-event-per-day superseded the old short-event/gap rule (unified into one DB-level UNIQUE constraint); sixth assignment status `approval_withdrawn` ratified; a reliability-formula blind spot fixed (a client-cancelled project must not read as a no-show). A full top-to-bottom read of the 863-line research doc caught a "still open" section that had already been closed elsewhere in the same file.
- **30/07 13:55–14:45 — Step 3.5 built: customer card → full `/customers/:id` record page** (scope grew ~1.5× mid-brief: dialog→page, header actions, sent/not-sent marker, sort control). §7.34 ruled **warn, don't block** on archiving a customer with open quotes. Two bugs a green gate would not have caught: a `useState`→custom-setter swap silently broke a second call site using the updater form, and "+ הצעה חדשה" navigated but never read the query string, silently dropping the preselected customer — both now permanent entries in `02_customers/CLAUDE.md`/`src/CLAUDE.md`. New standing practice from this session: every 🗣️ brief ends with **"מה ייחשב עובד"** (concrete outcome sentences), now in `module-build`.
- **30/07 17:40–18:35 — Two more of the same defect family:** `revenueByCustomer`'s async load meant "not yet known" and "no open quotes" were indistinguishable, silently skipping the §7.34 warning in a race window (fixed: unknown is its own state). A template field added via the Table Editor but missing from code shipped literal brackets to a customer — the near-miss was that the first fix scanned the **filled** body (would have blocked every demo customer, whose names all contain `[דמו]`); fixed to scan the template before injection.
- **30/07 18:20–23:40 — Step 3.6 (prices tab) built and closed; smoke check added.** One dead-on-arrival upsert (Postgres validates NOT NULL before conflict resolution) and one **real data-loss incident** — delete-then-insert really deleted 5 live seed tiers on a closed browser tab; reordered to upsert-then-delete-stale, matching module 2's earlier fix on the same defect family. **The general "replace-style save = insert-first, never delete-then-insert" rule had no permanent home until this compaction pass — now harvested into `src/CLAUDE.md`** (see this session's report). `npm run smoke` added as a thin, CI-excluded read-only layer. Finance E2E credentials provisioned, closing the last real coverage gap.
- **28/07 22:52–23:55 — Context-architecture overhaul planned and executed** (per-project plugin scoping, `CLAUDE.md` split into a thin root + directory-scoped files, hooks shortened, journal reform). Full detail already lives in the "Context-architecture overhaul" paragraph in Reference: Templates & hooks below — not re-summarized here.
- **25/07 21:01–21:38 — Quality-gates round 2** (`knip` + Dependabot + `npm audit` gate added; `eslint-plugin-jsx-a11y` tried and reverted on a real ESLint-10 incompatibility) **+ the `LoadingOrError` cross-module dedup fix** (M1+M2). Full detail already lives in the "Code-quality tooling" paragraph in Reference: Templates & hooks below.

### 📦 Week 22–23/07/2026 — solo reorg + PR #9 + module-flow skills + M3 Phase-1 DB + quality guardrails (bucketed 28/07)

Evergreen facts already harvested into the reference sections below (skills roster, quality tooling, hooks, the PowerShell/CRLF/English-sweep traps); DB detail lives in `docs/db_roadmap.md` §10 + `docs/schema.sql` + `docs/micro_guides/module-3.md`. Kept here as the index:

- **22/07 — solo reorganization** (Ishay: "עמית יוצא מהתמונה… מהיום אני המפתח היחיד"). Guides regrouped `guides/modules/` + `guides/reference/`; CLAUDE.md rewritten solo with **rule numbering 1–17 preserved**; 📣 retired (subtraction, F1); **deadline 19/09/2026 set** with a per-module schedule. Ishay's overriding ruling: **"לא לקצץ כלום! אפשר לדחות להמשך"** — whole modules defer (leaf modules M10→M11→M7 first), nothing gets trimmed, because a deferred module is clean while a trimmed one is rework debt (written into `00_roadmap.md` §3).
- **22/07 21:00 — PR #9 merged** by Ishay (`gh pr view 9` → `state=MERGED mergeCommit=a35c92f`); `origin/main` stayed at `4b09d2f`. `ishay/solo-reorg` and `ishay/module-3-quotes` became ancestors of `dev` = **dead branches (rule 10)**; `ishay/module-3-quotes-build` cut fresh from `dev`.
- **23/07 — three module prompts → skills** (`module-blueprint`/`module-build`/`module-close`), templates `git mv`d into them byte-identical, `docs/templates/` deleted. Later that day **+3 helper skills** (`section7-rulings`/`post-merge`/`feature-acceptance`), then the discipline kernel extracted to `_shared/discipline.md`, then de-duplicated again against Ishay's new global `~/.claude/CLAUDE.md`, and `feature-acceptance` moved out to his global folder (a real name collision was found and resolved).
- **23/07 — CHANGELOG retired in place** (Ishay's ruling B, after I honestly corrected my own "~10 refs" estimate to ~50 across ~20 files): retirement banner + removed from every forward protocol; the one genuinely-orphaned `§TODO` debt (the active/inactive-no-"delete" convention, binding on M4) rehomed to `PROJECT_MASTER §6`. The freeze then got **real enforcement** in `protect-frozen-files.sh` (it had been documentation-only — Ishay asked "is it actually blocked?" and it wasn't).
- **23/07 — M3 Phase 1 (DB) COMPLETE: 5/5 migrations applied + live-verified**, gate 1.7 approved by Ishay. Migration 1 was applied manually via Studio during a **full Supabase-MCP outage** (`-32600 permission-denied`), with Ishay acting as a read-only `execute_sql` proxy; the MCP was restored mid-session and migrations 2–5 went through `apply_migration` behind typed-echo. Step 1.6's RLS impersonation matrix passed; `schema.sql` synced. Committed `fbe2287`, pushed.
- **23/07 — the resume-after-interruption rule** was added to the shared discipline after a real incident: a turn cut by a usage limit right after announcing "saving migration 5 + updating docs" — the file survived, the `db_roadmap` update didn't, and the resumed turn advanced as if it had. Ishay caught it. **Narration is intent, not evidence.**
- **23/07 — code-quality guardrails** (Ishay's ask, all four built): jscpd · sonarjs · `module-close` §4b duplication check · the `quality-audit` skill. Gates deliberately `warn`, hardening tracked in three findable homes.
- **23/07 14:22 — a live rule-16 collision:** `module-3.md` changed **between two reads in the same turn** — direct proof of a concurrent writing session. Stopped, surfaced the evidence, went read-only.

### 📦 15/07/2026 and earlier — archived
Sessions up to and including 15/07/2026 (M3 blueprint, milestone-1 promotion, module-2 close, the infrastructure-immunization wave, module-1 merge, and the 02–09/07 buckets) live in **`docs/archive/session_log_2026-07.md`**. Evergreen facts from them were already harvested into the reference sections below — read those first, not the archive.

---

> 🔧 **Stuck / something not working?** First read the three reference sections below (Operational Gotchas · Tech-debt · DB journal) and "Current State" above — the operational knowledge for solving it is there, not in the Session Log.

## Reference: Operational Gotchas (read when something doesn't work) · 🕓 reviewed 31/07/2026 01:02
> The scan stamp is refreshed whenever this section is checked (a session / `regin-docs-sync`). A much older stamp = suspected drift, dig deeper.

- **Running a routine needs a manual "Run now" in the UI** — `list_scheduled_tasks` **does show** the 4 routines (`enabled`, valid `taskId`/`lastRunAt`; verified 08/07/2026 — the old display bug from 06/07, where the tool returned empty, is gone). I have no direct run tool (create/update/list only) — end-to-end verification that a routine ran = running `regin-health-pulse` in the UI and seeing a new journal line. Absence from the list (if it happens) is not a creation failure.
- **Open REG-IN sessions from `C:\Users\ishay\Reg-In`** — a session running from another directory works on absolute paths and may miss hooks/CLAUDE.md.
- **Editing `.claude/settings.json`/`.local.json` is categorically blocked for Claude** (auto-mode "Self-Modification") — even inside an approved plan. Hand over ready text, Ishay pastes it manually.
- **The add-user screen only creates a `users` row** — the Auth account + password are created separately in the Supabase Dashboard (Authentication→Users, Auto-Confirm). A knowledge gap that recurred twice.
- **Two sessions writing on the same worktree = collision** (crossing commits/edits; one session's `git add -A` sweeps up the other's files). Iron rule 16: one writing session at a time.
- **Network-dependent npm hangs (up to 17 min)** — a TLS failure against the registry (proxy/AV injecting a root CA). Verified fix: `NODE_OPTIONS="--use-system-ca"` before every `npm install`/`update`/`outdated`.
- **E2E on a slow network:** a matrix cell click must wait for the PATCH response before `reload()`, otherwise the write is cancelled in flight (`clickCellAndAwaitWrite`); login flows = up to 8 network calls → 30s timeout.
- **react-hooks (new, caught in module 2 — 10–11/07):** `set-state-in-effect`/`static-components` reject module-1's open-in-dialog effect pattern — use `useState(initializer)` + `key`-remount on the parent, and error/header components as top-of-file components (not defined inside render) · `react-hooks/purity` forbids `Date.now()`/an impure call inside a `useMemo`/render body — breaks `lint` (and thus `npm run verify`) but **not** `vite build`/dev-server (no React Compiler, plain `@vitejs/plugin-react`) — compute a time-dependent value in an event handler and pass it as a prop.
- **Prettier `printWidth` in CI:** long lines (tests/JSX) pass `lint` but fail `format:check`; run `prettier --write --end-of-line auto <file>` on new files before commit (`--end-of-line auto` preserves local CRLF without causing git noise).
- **A migration with Hebrew comments + the browser SQL editor = corruption risk:** typing/pasting directly garbles RTL/bidi (chars interpreted as keyboard shortcuts, policy names break). The MCP `apply_migration` (after typed-echo) avoids the problem entirely — fallback to browser/CLI only if the MCP is unavailable, and then hand over SQL clean of Hebrew comments (keep only load-bearing strings like `'לקוחות'`).
- **`clipboard.readText()` freezes browser automation** (a permission prompt blocks) — components that need to read the clipboard use `writeText` only in product code; auto-verification avoids `readText`.
- **`"` (double quotes) inside a Hebrew string inside attribute-JSX breaks parsing** (e.g. "ח\"פ") — wrap as `{'…'}` (a JS string expression), don't write it directly inside the attribute's quotes.
- **Never round-trip a UTF-8 Hebrew file through PowerShell `Get-Content -Raw | Set-Content -Encoding utf8`** (harvested 22–23/07) — it reads as ANSI and **corrupts every emoji**, and it silently flips CRLF→LF on all lines (a 705/705 diffstat gave it away once). Use `sed`, or Python/.NET `WriteAllText` with explicit no-BOM UTF-8. Caught both times only by re-Reading the file afterwards.
- **CRLF noise is local-only, and `format:check` is now a blocking CI step** (23/07). Root cause was Ishay's global `core.autocrlf=true` (never touched — git config is his) checking files out as CRLF while Prettier defaults to LF; committed content was always clean LF (proved via `git show HEAD:<file> | prettier`). Fixed by generalizing `.gitattributes` to `* text=auto eol=lf`. **If `format:check` fails locally on files you never touched — suspect the working-tree checkout, not the repo.**
- **A Hebrew-only grep misses live English instructions** (22/07 lesson) — when sweeping the docs for a retired concept, run an **English-layer sweep too** (`amit|partner|other developer|second dev`). The Hebrew pass missed three *live* template instructions that would have misled a future module session.

## Reference: Tech-debt & open flags · 🕓 reviewed 31/07/2026 01:02

> 🗺️ **DB debts (since 08/07/2026):** the unified view — `docs/db_roadmap.md` (the DB lines here are cited there in Lane A2/C; the decisions live only in PROJECT_MASTER §7).

- **Missing RLS on tables whose module isn't built yet** — deny-all until the module is built. M2 (built+closed 11/07): `customers`+`customer_contacts` policied. M3 (built on branch, mig 3 `20260723113500` + mig 8): `quotes`/`quote_services` (§7.21) + `products`/`price_tiers`/`params` (§7.83 open-read/CEO-write) + `email_log` policied. **Remaining deny-all = 5 tables** (`projects`/`hostesses`/`salary_reports`/`assignments`/`logistics`, built M4–M8).
- ✅ **14 RLS scenarios on `customers` (the original 12 + 2 view-tier) — completed and closed M1's deferred gate** (module 2 step 1.3, 10/07; independently re-verified in the 11/07 22:33 closing audit). *(The previous line here said "deferred to M2" — update: done.)*
- **Self email-change intentionally omitted** — `users.email` = PK + RLS key (`auth.email()`) + FK-target (`projects.owner_email`, no cascade). A temporary desync would lock a user out of all RLS. Future implementation: `on update cascade` + syncing `auth.users.email`↔`public.users.email`.
- **Account lockout at app/DB level** (not an Auth Hook) — bypassable via a direct API call. Upgrading to a Hook requires a Team plan.
- **Leaked-Password Protection** off (module 10). **Topbar search** placeholder. **UI for `params`** (module 9). **Error Boundary** at Router level (module 3). **Module mapping by Hebrew string** (`MODULE_META`/`GROUPS`) — a module name changed in the DB would break silently; move to `module_id`/slug when touching the schema.
- **Binding convention:** the bidirectional active/inactive status (no "delete" framing) applies to `customers` (M2 — **a ruled deviation**: hidden behind an archive button, not dimmed in a shared list like M1; see module-2.md §9 11:41) and `hostesses` (M4, when built).
- **Accrued advisors (accepted, not new-untreated):** `multiple_permissive_policies` on `customers`/`customer_contacts`/`permissions`/`users` — an inherent trait of the §7.21 pattern (2 separate SELECT/ALL policies); `unindexed_foreign_keys` — `quotes.customer_id` scheduled as C-1 in M3's first migration; `assignments`/`projects`/`logistics` FKs — M4–6 when built.
- **Open flags** — the only live registry = `PROJECT_MASTER` §7 (85 items as of 31/07 — **the exact count always via grep, not hand-maintained here**; items 82–85 added 12–14/07 in the M3 pre-decision/ground-closing rounds; current mix 🟢34/🟡32/🔵6/⚪13 — shifted since the 15/07 snapshot as M3 steps closed §7.29→superseded/§7.54/§7.84 etc.). **Don't keep a manual list here — it goes stale.** §7 is **queryable-by-type/module** via the status lines: `grep -E '🟡|🔵' docs/PROJECT_MASTER.md` (all open) · `grep 'פתוח·אוטומציה'` · `grep 'פתוח·[^·]*·מ4'` (module 4 — next pre-decision round, after M3).

## Reference: DB journal (module 1) · 🕓 reviewed 31/07/2026 01:02 (module-1 content verified still correct; module-2's extended DB journal lives in `docs/db_roadmap.md` §10 + `docs/schema.sql`, not duplicated here)

- **Functions:** `current_user_role_id()→int` (SECURITY DEFINER, `search_path=''`, returns role_id only for `status='active'`, EXECUTE to authenticated only) · `check_login_lock(text)`, `register_failed_login(text)`, `reset_login_attempts()` (lockout, SECURITY DEFINER, `reset` to authenticated only).
- **New tables:** `login_attempts` (email PK, failed_count, locked_until, RLS-on without policies — access only via the functions).
- **RLS:** `roles`/`modules`/`permissions` SELECT-to-all-authenticated (permissions write to CEO) · `users` self-or-CEO + `users_update_self`. **Triggers:** none.
- **Central migrations:** soft-delete (frozen→inactive) · `users_update_self` · `harden_current_user_role_id` · `module1_login_attempts_lockout` · `module1_reset_login_attempts_revoke_anon`.
- ✅ **The initplan debt closed (07/07/2026):** the `(select …)` wrap was applied in migration `20260707163709_module1_users_rls_initplan_select_wrap` — advisors clean. *(The original record's wording, folded here from the old macro-guide 06/07, described the debt as open — updated in the 07/07 open-items audit.)*

## Reference: Templates & hooks · 🕓 reviewed 31/07/2026 01:02

**Templates** — **relocated 23/07/2026** from `docs/templates/` into the module-flow skills (`git mv`, byte-identical): the blueprint template is now `.claude/skills/module-blueprint/template.md` and the closing-audit template `.claude/skills/module-close/template.md`, each invoked by its skill (`module-blueprint`/`module-close`; `module-build` has no template — the micro-guide is its engine). `docs/templates/` no longer exists. Output = a micro-guide **in English, written for Claude** (9 sections, 🤖/👤 tags, self-update). **Substantially hardened 07–08/07** (over the 06/07 version): cross-module blueprint cross-check (was cross-dev until 22/07/2026) · question-anchored-to-step + phase scan · DB-Design-Challenge + mandatory db_roadmap read · shared-surface marker · §7-ripple-check + forward-notice at close (the 📣 cross-developer convention and the two-owner shared-module header were retired 22/07/2026 — single developer). **+ 09/07:** the 🚧 mechanism (mandatory `🚧 מN`↔§6 pairing as a 🔻🤖 ripple) · typed-echo for DoD signing and migration apply · fresh-context reviewer for the blueprint (rule 2b). **+ 17:07 (Ishay's ruling, M2):** a mandatory "🎨 UX & functional review" gate at end-of-Phase-3 (opening) + a mandatory "§2b UX & Validation Audit" section (closing) — the infra freeze was deliberately opened before M3. **+ 11/07 22:33–22:42 (Ishay's rulings, in the M2 close — 3 opening-template changes):** (1) 🗣️ went from "narrate-and-continue" to a **mandatory "experience brief" + wait-for-PM-approval-before-code** (invited-correction understanding statement · validations · screen/mockup description · "for-your-approval" flags); (2) 🤖 gates = functional+visual self-verification **with screenshots**, full 👤 only at phase-end/design (not mid-build); (3) a new **🎤 "PM interview" section** before blueprint approval — a full user journey + focused questions + "what didn't I ask about?". Ripple: CLAUDE.md rule 1 updated accordingly.
**Skills (as of 28/07/2026) — 6 repo-local:** `module-blueprint` · `module-build` · `module-close` · `section7-rulings` · `post-merge` · `quality-audit`. The first five read `.claude/skills/_shared/discipline.md` first (the kernel was consolidated there 24/07 — each skill now carries only a one-line pointer, no duplicated paragraph); `quality-audit` deliberately opts out with its own verify-the-recommendation doctrine. `feature-acceptance` moved OUT to Ishay's global `~/.claude/skills/` (23/07 — project-agnostic).

**Code-quality tooling (built 23/07, extended 25/07, hardened 29/07)** — `npm run dup` (jscpd, `.jscpd.json`) · `eslint-plugin-sonarjs` curated set in `eslint.config.js` · `npm run deadcode` (knip, `knip.jsonc`) · `npm run audit` (npm audit, `scripts/audit-gate.mjs`) · Dependabot (`.github/dependabot.yml`) · a duplication/should-be-shared step in `module-close` §4b. **The gates are now BLOCKING** — hardening completed 29/07/2026 08:45 (`sonarjs`→error · `continue-on-error` removed from jscpd/knip/audit); `npm run gate` = verify+dup+knip+audit+check:context, all blocking. `gitleaks` and `format:check` were already blocking. Sole accepted-risk waiver: `react-router` GHSA (RSC-only, unused) in `scripts/audit-gate.mjs`.

**Context-architecture overhaul (28/07/2026)** — `CLAUDE.md` split into a thin root + directory-scoped files that load on demand: **`supabase/migrations/CLAUDE.md` now holds the full DB protocol including the typed-echo gate** · `src/CLAUDE.md` the code/security model · `docs/CLAUDE.md` iron rule 13 + the emoji legend. Full pre-split originals in `docs/archive/`. Plugins scoped per-project via `enabledPlugins` in `.claude/settings.json` (11 off in REG-IN only) — registry + re-enable triggers in `docs/toolbox.md`.

**The hooks live in scripts** (`.claude/hooks/`, settings.json only points) — **3 hooks as of 09/07:** (1) **PreToolUse** `protect-frozen-files.sh` — protects the frozen C5/C6 **+ committed migrations (append-only) + closes a tool hole** (runs on Edit/Write/Bash/PowerShell/Desktop-Commander; fail-open; tests in `test-protect-frozen.sh` 14/14). (2) **Stop** `check-docs-updated.sh` — blocks session end until the journal+`STATUS` are updated · if code under `src/modules/NN_*/` changed without `module-N.md` · if a migration changed without `db_roadmap.md` · **if a micro-guide contains `🚧 מN` without a matching §6 line (enforcement-0c, 09/07)**. (3) **SessionStart** `session-start-context.sh` — a banner: branch + current step + deadline + active-plan line + concurrency reminder. *(Collapsed to a single track 22/07/2026 — the machine-identity branch and the second developer's track line were removed with the move to a single developer.)*

</div>
