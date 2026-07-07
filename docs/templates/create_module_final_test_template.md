Hi Claude,

We have completed the implementation phase of **Module [MODULE_NUMBER]: [MODULE_NAME]** on branch `[BRANCH_NAME]`.
Act as Senior QA Engineer, Security Auditor, and Release Manager: run the end-of-module audit, give a formal merge verdict, and **persist the results** into the living docs.

### ⚠️ Audit Rules
1. **Read the micro-guide first:** `docs/micro_guides/module-[MODULE_NUMBER].md` is the contract you audit against — its Definition of Done, its QA matrix, its decisions ledger. Do not audit against a generic checklist.
2. **Assessment + doc persistence only:** do NOT run `git merge`/`git push`/`gh pr create` — the PR and merge stay with Ishay/Amit. Updating documentation (micro-guide, CHANGELOG, CLAUDE_CODE_LOG, STATUS) is part of this audit, not a violation.
3. **Grounding & Citations:** every claim about RLS, code state, or test results cites the exact file+line or the exact query/command you ran and its actual output in this turn.
4. Chat report to Ishay/Amit — in **Hebrew**. Doc updates — English in micro-guides, Hebrew in the human docs (per each file's existing language).

Structure your audit exactly as follows:

### 1. 📋 Definition-of-Done Walkthrough
Go through every checkbox in the micro-guide's DoD section, one by one. Mark ✅/❌ with specific evidence (file/line, query result, or test output) — not impressions.

### 2. 🛡️ Security & RLS Stress-Test
- Verify the module's policies against the §7.21 standard template (`PROJECT_MASTER.md`): can a role with `blocked` on this module read/write its table? Can `view` write?
- Soft-delete protocol: `status='inactive'` rows excluded/handled everywhere (UI filters + DB queries).
- **Auth regression:** the Module-1 security model still holds — OAuth authorization gate (unknown/inactive accounts signed out), account lockout, session handling.
- For the highest-risk scenarios in the micro-guide's QA matrix, independently re-verify against the live policy definitions — never trust a pre-marked ✅.
- Call out any leak/bypass found.

### 3. 🧠 Architectural Review & Pro-Tips (free hand)
Refactoring/perf/state-management proposals; UX smoothness (loading states, error boundaries, RTL, responsiveness); messy spots that accumulated during fixes. Suggestions only — no code edits in this audit.

### 4. 🧹 Housekeeping Check
- `npm run verify` (lint + format:check + unit tests + build) — must be green.
- `npm run test:e2e` — run and report pass/fail/skipped (env-var skips are OK, say so).
- `git status` clean of debug/temp files; no stray `console.log`/commented-out blocks in the diff.
- **No loose ends in the micro-guide:** no step left 🔨 without an explanatory note; status header current.
- `docs/CHANGELOG.md` has this module's DB+code lines; migrations committed together with an updated `docs/schema.sql`.
- Live preview smoke test of the module's key flows (per the verification workflow) with proof (screenshot/log/network).
- Explicit list of every file changed in this module (code, DB, docs).

### 5. 📊 QA Coverage Matrix (fill the micro-guide's "as-run" column)
For each type — Unit · Integration · E2E · Regression · UAT · Security/Pen · Performance/Load · Usability · Compatibility — mark ✅ done / ⚠️ partial / ❌ none / N-A with one-line evidence. Be honest; over-claiming here poisons the academic report. Acceptable gaps get a target module/milestone; real gaps go to Section 6.

### 6. 🛑 Blockers — MUST FIX NOW
Critical bugs, failed matrix scenarios, RLS gaps that must be resolved before this code touches a shared branch. If none: "None".

### 7. ⏳ Tech Debt — HANDLE LATER
Deferred improvements, each with the future module/stage where it must be reopened. These get appended to the micro-guide's Deviations & Tech-Debt Log (section 9) **AND registered as lines in `docs/PROJECT_MASTER.md` §6 with their target module** — §6 is mandatory reading in every module's opening prompt; a debt that lives only in this module's own log will never be found by the module that must repay it.

### 👑 Final Merge Verdict
Binary: **[YES]** — stable, secure, DoD-compliant, mergeable into `dev` now / **[NO]** — at least one Section-6 blocker. Two-sentence justification.

### 💾 Persistence (mandatory — the audit is not done until these are written)
0. **§6 debt registration check:** verify every Section-7 item AND every 🕗 row of the micro-guide's "Capabilities delivered vs deferred" table appears in `docs/PROJECT_MASTER.md` §6 with a target module — add any missing line now.
1. **Micro-guide:** tick the DoD checkboxes you verified; fill the QA matrix "as-run" column; append Section-7 items to its Deviations & Tech-Debt Log; set the status header to `🔒 Closed — awaiting PR/merge` (on YES) with today's date.
2. **`docs/CHANGELOG.md`:** dated line — "מודול [MODULE_NUMBER] נסגר — verdict [YES/NO]" + one-line scope.
3. **`docs/CLAUDE_CODE_LOG.md`:** session entry summarizing the audit result and any blockers.
4. **`STATUS.md`:** module row → "ממתין ל-PR/merge" (the ✅ flip happens only after the actual merge); refresh "עודכן לאחרונה".

### 🚀 PR Instructions (print at the very end, in Hebrew)
Print for Ishay/Amit, concretely, as numbered steps:
0. **Push first (the audit never pushes):** run the `regin-pr-gate` routine (Run now — it commits+pushes on a green verify, feature branches only), or ask Claude in-session to commit+push per the end-of-session state.
1. GitHub → Pull requests → New → base: `dev` ← compare: `[BRANCH_NAME]` → short description (provide a ready-to-paste one) → Create. What to watch in CI (quality-gate + secret-scan/gitleaks); on red — paste the failing log back to Claude.
2. Merge rules: if the partner is at the PR-review stage, wait for their approval; otherwise merge alone and Claude has already noted the ⚠️ "merged without partner review" line in CHANGELOG.
3. After merge: pull `dev` fresh, ask Claude to flip the module row to ✅, and run the `regin-docs-sync` routine (Run now) as the final cross-file consistency pass (CLAUDE.md rule 13(ד)).
(`npm run verify` and `npm run test:e2e` are NOT extra steps for the human — the audit above already ran them; `regin-e2e-check`/`regin-health-pulse` stay optional.)

Run the audit now and output the full report.
