Hi Claude,

We have completed the implementation phase of **Module [MODULE_NUMBER]: [MODULE_NAME]** on branch `[BRANCH_NAME]`.
Act as Senior QA Engineer, Security Auditor, and Release Manager: run the end-of-module audit, give a formal merge verdict, and **persist the results** into the living docs.

### ⚠️ Audit Rules
1. **Read the micro-guide first:** `docs/micro_guides/module-[MODULE_NUMBER].md` is the contract you audit against — its Definition of Done, its QA matrix, its decisions ledger. Do not audit against a generic checklist.
2. **Assessment + doc persistence only:** do NOT run `git merge`/`git push`/`gh pr create` — the PR and merge stay with Ishay. Updating documentation (micro-guide, CLAUDE_CODE_LOG, STATUS) is part of this audit, not a violation.
3. **Grounding & Citations:** every claim about RLS, code state, or test results cites the exact file+line or the exact query/command you ran and its actual output in this turn.
4. Chat report to Ishay — in **Hebrew**. Doc updates — English in micro-guides, Hebrew in the human docs (per each file's existing language).

Structure your audit exactly as follows:

### 1. 📋 Definition-of-Done Walkthrough
Go through every checkbox in the micro-guide's DoD section, one by one. Mark ✅/❌ with specific evidence (file/line, query result, or test output) — not impressions. **Post-merge items** (PR opened / CI green / merged) are NOT audit-time checkboxes and NOT Section-6 blockers — mark them **N/A-at-audit (post-merge)**, never ❌: the audit must not merge, so it confirms the module is *mergeable*, and the PR/CI/merge happen afterward.

### 2. 🛡️ Security & RLS Stress-Test
- Verify the module's policies against the §7.21 standard template (`PROJECT_MASTER.md`): can a role with `blocked` on this module read/write its table? Can `view` write?
- Soft-delete protocol: `status='inactive'` rows **handled per the module's OWN ruling** (audit against the guide, not a generic "exclude everywhere") — e.g. this module's binding pattern is **dimmed-not-hidden in the list** + excluded only from the marketing send + offered-for-restore in the add-flow; a `status='active'` filter on the list would be a REGRESSION here, not compliance. Verify inactive is handled correctly at each surface the guide specifies.
- **Auth regression:** the Module-1 security model still holds — OAuth authorization gate (unknown/inactive accounts signed out), account lockout, session handling.
- For the highest-risk scenarios in the micro-guide's QA matrix, independently re-verify against the live policy definitions — never trust a pre-marked ✅.
- Call out any leak/bypass found.

### 2b. 🎨 UX & Validation Audit
**Binding — not "suggestions only" (that is §3).** Audit the module's screens against its spec + the §4 design language:
- **Phase-3 UX review honored:** the micro-guide's end-of-Phase-3 🎨 UX & functional review actually ran and its rulings were applied — check §9 / the status header for it.
- **Design & functional states:** §4 palette/layout/RTL conformance; every screen has its loading · empty · no-results · error-with-retry · success states; every primary action is keyboard-operable with a visible focus ring. Verify live where feasible (the §4 preview smoke test).
- **Validation-completeness:** walk the module's spec'd validation rules (fields, formats, cross-field, business rules — from its C5 process/screens + C6 tables) and confirm each is implemented AND covered; confirm every spec-silent validation choice was surfaced to Ishay (not silently invented or omitted).
- **Redesign judgement:** flag anything that should be redesigned / added / removed. A real UX defect (a missing/broken state, an unreachable primary action, misleading copy) is a **§6 blocker**; a polish/scope item is a **§7 tech-debt** line with its target module.
Results feed the §5 **Usability** as-run cell and the §1 DoD UX-&-validation checkbox. (System-wide RTL/cross-browser/mobile stay the M12 usability sweep — this audit is the module's own gate, not that.)

### 2c. 🔒 General Security Scan (binding — beyond RLS)
**Different lens from §2 — that audits RLS/auth/session specifically; this audits the code itself for OWASP-class issues.** Dispatch `code-modernization:security-auditor`, scoped ONLY to this module's new/changed files (the micro-guide's "Files to create/touch" list, or `git diff` against the branch's base) — NOT the whole codebase (that periodic sweep is `quality-audit`'s job; don't re-run it here). Look for: injection (SQL/XSS), secrets committed to code, insecure deserialization, unsafe `dangerouslySetInnerHTML`/`eval`-style patterns, and other OWASP-class issues §2's RLS-focused check does not cover.
Findings route like §4b: a real, exploitable vulnerability is a **§6 blocker**; a hardening suggestion with no live exploit path is a **§7 tech-debt** line with its target module.

### 3. 🧠 Architectural Review & Pro-Tips (free hand)
Refactoring/perf/state-management proposals; messy spots that accumulated during fixes. Suggestions only — no code edits in this audit. (UX & validation quality is now the binding **§2b** audit above — not a free-hand suggestion; F1 subtraction: it lived here as a soft bullet before, and moved up to a real gate.)

### 3b. 🤫 Silent-Failure Sweep (binding)
**Different from §3 — that is free-hand architectural suggestions; this is a targeted hunt.** Dispatch `pr-review-toolkit:silent-failure-hunter`, scoped ONLY to this module's new/changed files. Look for: swallowed errors (empty or log-only `catch` blocks), misleading fallback values that present a failure as a success, and error paths that silently return default data instead of surfacing the problem — high-risk in a system handling real pricing/financial data.
Findings route like §4b: a swallowed error on a live user-facing path is a **§6 blocker**; a defensive-but-noisy pattern worth tightening later is a **§7 tech-debt** line.

### 4. 🧹 Housekeeping Check
- `npm run verify` (lint + format:check + unit tests + build) — must be green.
- `npm run test:e2e` — run and report pass/fail/skipped (env-var skips are OK, say so).
- `git status` clean of debug/temp files; no stray `console.log`/commented-out blocks in the diff.
- **No loose ends in the micro-guide:** no step left 🔨 without an explanatory note; status header current.
- migrations committed together with an updated `docs/schema.sql`; every DB change has its `db_roadmap §10` Done-row. *(The `docs/CHANGELOG.md` DB+code line is no longer required — the file was retired 23/07/2026.)*
- **DB health:** run Supabase advisors (MCP, read-only — security + performance): zero findings introduced by this module, or a written triage note per finding. Verify no drift between the live DB and `docs/schema.sql` for the tables this module touched (spot-check via `list_tables`).
- Live preview smoke test of the module's key flows (per the verification workflow) with proof (screenshot/log/network).
- Explicit list of every file changed in this module (code, DB, docs).

### 4b. 🔁 Duplication & Shared-Component Check (binding — keeps the codebase reviewable)
Guard against copy-paste and against logic that *should* be shared but was re-implemented — so an experienced engineer opening the repo finds one home per concept (iron rule 14 SSOT), not five near-copies.
- **Mechanical (textual clones):** run `npm run dup` (jscpd). For every clone that involves this module's files, decide: **extract to `src/lib/`** (or a shared component) if it's genuine shared logic, OR record why it stays separate. jscpd only catches textual clones — it is the floor, not the ceiling.
- **Complexity (spaghetti):** run `npm run lint` and review this module's `sonarjs/cognitive-complexity` + `sonarjs/no-identical-functions` warnings. Each is fixed now (small + safe) or logged as a §7 tech-debt line with its target.
- **Semantic "should-be-shared but isn't" (the careful one — Ishay's explicit ask):** actively hunt for functions/components/validators in this module that duplicate the *intent* of code elsewhere even when jscpd does NOT flag them (a formatter, a picker, a permission check, a money/date helper re-derived instead of imported from `src/lib/`). For each candidate, **do NOT reflexively recommend merging** — separation is sometimes deliberate and correct. First trace BOTH sites: do they share the same invariants, and would they change together or independently? Only recommend unifying when they genuinely must stay in lockstep; otherwise **record why the separation is intentional** so no future audit re-raises it. A confident wrong "share this" that couples two things which must evolve apart is worse than leaving the duplication (same verify-the-recommendation discipline as the `quality-audit` skill — read the function you'd change and every caller before proposing the change).
- Findings route to §7 tech-debt (with target module) — or §6 if a duplication is an active bug risk (two copies that must agree and already drifted).

### 5. 📊 QA Coverage Matrix (fill the micro-guide's "as-run" column)
For each type — Unit · Integration · E2E · Regression · UAT · Security/Pen · Performance/Load · Usability · Compatibility — mark ✅ done / ⚠️ partial / ❌ none / N-A with one-line evidence. Be honest; over-claiming here poisons the academic report. Acceptable gaps get a target module/milestone; real gaps go to Section 6.

### 6. 🛑 Blockers — MUST FIX NOW
Critical bugs, failed matrix scenarios, RLS gaps that must be resolved before this code touches a shared branch. If none: "None".

### 7. ⏳ Tech Debt — HANDLE LATER
Deferred improvements, each with the future module/stage where it must be reopened. These get appended to the micro-guide's Deviations & Tech-Debt Log (section 9) **AND registered as lines in `docs/PROJECT_MASTER.md` §6 with their target module** — §6 is mandatory reading in every module's opening prompt; a debt that lives only in this module's own log will never be found by the module that must repay it.

### 👑 Final Merge Verdict
Binary: **[YES]** — stable, secure, DoD-compliant, mergeable into `dev` now / **[NO]** — at least one Section-6 blocker. Two-sentence justification.
**Typed-echo DoD sign-off (irreversible-gate safeguard):** a **[YES]** verdict is an irreversible gate — before it stands, print a 👤 gate where the human (Ishay) types the module name + `DoD` (NOT just "yes"/"approve") to confirm they reviewed the DoD checklist. This is one of only two typed-echo gates (the other = applying a migration, DB protocol in `CLAUDE.md`); every other 👤 gate takes an ordinary approval.

### 💾 Persistence (mandatory — the audit is not done until these are written)
0. **§6 debt registration check (iron rule 15):** verify every Section-7 item (the audit report's tech-debt section — NOT `PROJECT_MASTER.md` §7) AND every 🚧 row of the micro-guide's "Capabilities delivered vs deferred" table has its byte-matching `🚧 מN` line in `docs/PROJECT_MASTER.md` §6 (`grep '🚧 מN' docs/PROJECT_MASTER.md` per target module N) — add any missing line now. This is the closing audit's belt-and-suspenders re-check of the rule-15 mechanism the Stop hook (`check-docs-updated.sh` 0ג) already enforces.
0b. **§7 ripple check — run iron rule 13(א)-(ג) explicitly (not just 13(ז)) for every `PROJECT_MASTER.md` §7 item this module ruled or implemented.** The load-bearing audit action: the §7 item itself marked ruled (date+owner, batch note updated if it was the cluster's last open item); the ruled value reflected in the code/DB where it lives; and `grep '§7.N'` AND `'מראת §7.N'` across `docs/guides/**` + `docs/micro_guides/**` — every citation current and every tagged mirror (🔗) matching §7 verbatim. Fix what doesn't.
0c. **DB-roadmap check:** in `docs/db_roadmap.md` — mark every row this module executed as Done (dated strike-list, §10 there), and add rows for newly-discovered deferred DB work. Then verify that every schema/§7/shared-surface change from this module that lands on a FUTURE module's tables or surface is named in its `db_roadmap §10` Done-row **and** a `PROJECT_MASTER §6` line (module numbers listed), so the session that opens that module finds it. *(The old `CHANGELOG` forward-notice was retired with the file, 23/07/2026; the cross-developer 📣 tag, 22/07/2026 — single developer.)*
1. **Micro-guide:** tick the DoD checkboxes you verified; fill the QA matrix "as-run" column; append Section-7 items to its Deviations & Tech-Debt Log; set the status header to `🔒 Closed — awaiting PR/merge` (on YES) with today's date+time (`DD/MM/YYYY HH:MM`, from the system clock — all dated doc entries below use this format too).
2. **`docs/CLAUDE_CODE_LOG.md`:** session entry summarizing the audit result and any blockers (this is where the "module closed — verdict" record lives now; `docs/CHANGELOG.md` was retired 23/07/2026 and is not written to).
3. **`STATUS.md`:** module row → "ממתין ל-PR/merge" (the ✅ flip happens only after the actual merge); refresh "עודכן לאחרונה".
4. **Routine growth-triggers check:** consult the growth-triggers table in `docs/claude_routines.md` §4 — did this module trip a routine-update trigger (new `e2e/*.spec.js` files, a new/removed key doc, changed hook logic, a new check tool)? If yes, update the canonical routine text AND (in Ishay's session) his live SKILL.md copies per the dual-update protocol there; if no, state "no routine triggers" in the audit report.

### 🚀 PR Instructions (print at the very end, in Hebrew)
Print for Ishay, concretely, as numbered steps:
0. **Push first (the audit never pushes) — in the mandatory pre-PR order** (`docs/claude_routines.md` §1): if docs may have drifted, run `regin-docs-sync` FIRST (it edits docs; running it after pr-gate leaves its fixes uncommitted), then run the `regin-pr-gate` routine (Run now — it stages EVERYTHING, commits+pushes on a green verify, feature branches only), or ask Claude in-session to commit+push per the end-of-session state.
1. GitHub → Pull requests → New → base: `dev` ← compare: `[BRANCH_NAME]` → short description (provide a ready-to-paste one) → Create. What to watch in CI (quality-gate + secret-scan/gitleaks); on red — paste the failing log back to Claude. **Also print a "🧩 prompt for Claude-in-Chrome" (iron rule 17): a self-contained Hebrew prompt Ishay can paste into the Chrome extension to open this exact PR (repo, base, compare, title, one-line description) and report CI status — no secrets in it.**
2. Merge rules: review the `Files changed` diff yourself, wait for CI to go green, then merge. On red — paste the failing log back to Claude before merging. *(Deliberately no 🧩 handoff block here — reviewed and confirmed with Ishay 24/07/2026: the merge decision is his alone, never Claude's, and opening the diff yourself is a trivial click — a 🧩 prompt would add ceremony without saving real effort. This is intentional, not an oversight; don't re-flag it.)*
3. After merge: pull `dev` fresh, ask Claude to flip the module row to ✅, and run the `regin-docs-sync` routine (Run now — the deep sync-audit) as the final cross-file consistency pass (CLAUDE.md rule 13(ז)).
(`npm run verify` and `npm run test:e2e` are NOT extra steps for the human — the audit above already ran them; `regin-e2e-check`/`regin-health-pulse` stay optional.)

Run the audit now and output the full report.
