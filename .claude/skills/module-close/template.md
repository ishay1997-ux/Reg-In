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
**Different lens from §2 — that audits RLS/auth/session specifically; this audits the code itself for OWASP-class issues.** Dispatch a general-purpose agent scoped ONLY to this module's new/changed files (the micro-guide's "Files to create/touch" list, or `git diff` against the branch's base) — NOT the whole codebase (that periodic sweep is `quality-audit`'s job; don't re-run it here). Give it this rubric verbatim, and require a file:line citation for every finding plus an explicit "checked, clean" for every empty category:

> 1. **Injection** — SQL built by string concatenation instead of Supabase query builders / parameterized RPC args; any user-controlled value reaching `.rpc()` or a raw filter string. 2. **XSS** — `dangerouslySetInnerHTML`, `eval`, `new Function`, `innerHTML`, or user text rendered as markup. 3. **Secrets** — keys/tokens/passwords/service-role keys in source, tests, comments, or committed fixtures; anything that belongs in `.env.local`. 4. **Authorization in the client only** — a check that exists in React but has no matching RLS policy or RPC-internal check (in this project RLS is the real wall; the UI is convenience). 5. **Unsafe external input** — file uploads without type/size validation, `mailto`/URL construction without encoding, redirects built from user input. 6. **Error leakage** — raw DB/Postgres errors surfaced to the user, stack traces in production paths. 7. **Dependency risk** — run `npm run audit` and read the output; report high-severity findings introduced by this module's new packages (pre-existing ones are tracked in STATUS, don't re-litigate them).

*(This used to dispatch the `security-auditor` agent of the **code-modernization** plugin. That plugin is disabled in REG-IN (28/07/2026) — it exists for legacy COBOL/.NET migration and cost far more context than this one agent was worth. The rubric above **is** the auditor's checklist, made explicit — which is also more auditable than a vendor agent's hidden prompt.)*
Findings route like §4b: a real, exploitable vulnerability is a **§6 blocker**; a hardening suggestion with no live exploit path is a **§7 tech-debt** line with its target module.

### 3. 🧠 Architectural Review & Pro-Tips (free hand)
Refactoring/perf/state-management proposals; messy spots that accumulated during fixes. Suggestions only — no code edits in this audit. (UX & validation quality is now the binding **§2b** audit above — not a free-hand suggestion; F1 subtraction: it lived here as a soft bullet before, and moved up to a real gate.)

### 3b. 🤫 Silent-Failure Sweep (binding)
**Different from §3 — that is free-hand architectural suggestions; this is a targeted hunt.** Dispatch `pr-review-toolkit:silent-failure-hunter`, scoped ONLY to this module's new/changed files. Look for: swallowed errors (empty or log-only `catch` blocks), misleading fallback values that present a failure as a success, and error paths that silently return default data instead of surfacing the problem — high-risk in a system handling real pricing/financial data.
Findings route like §4b: a swallowed error on a live user-facing path is a **§6 blocker**; a defensive-but-noisy pattern worth tightening later is a **§7 tech-debt** line.

### 4. 🧹 Housekeeping Check
- **`npm run gate`** — must exit 0. This is the project's blocking gate since 29/07/2026:
  `verify` (lint + format:check + unit tests + build) **plus** `dup` (jscpd), `deadcode` (knip),
  `audit`, and `check:context`. ⚠️ Closing a module on `verify` alone would certify it on a **weaker
  bar than every individual build step already passes** — duplication, dead code and a broken
  context tree would all slip through the most important gate in the project.
- `npm run test:e2e` — run and report pass/fail/skipped (env-var skips are OK, say so).
- `npm run audit` — different from §2c (that's this module's own code; this is third-party package CVEs, project-wide). If this module added any new dependency, confirm it introduced no new high/critical finding. Pre-existing findings (not caused by this module) are not this module's blocker — note them and move on.
- `git status` clean of debug/temp files; no stray `console.log`/commented-out blocks in the diff.
- **No loose ends in the micro-guide:** no step left 🔨 without an explanatory note; status header current.
- migrations committed together with an updated `docs/schema.sql`; every DB change has its `db_roadmap §10` Done-row. *(The `docs/CHANGELOG.md` DB+code line is no longer required — the file was retired 23/07/2026.)*
- **DB health:** run Supabase advisors (MCP, read-only — security + performance): zero findings introduced by this module, or a written triage note per finding. Verify no drift between the live DB and `docs/schema.sql` for the tables this module touched (spot-check via `list_tables`).
  🔴 **ONE finding class is exempt from "introduced by this module" — `rls_enabled_no_policy` is judged whole-DB, never filtered to this module's tables** (added 06/08/2026, Ishay's ruling; this is where the rejected gate-check idea 1.7 actually lands — the advisor already runs this check across the whole database, so the fix is here, in what the reviewer is told to do with the result, not a new script). Do **not** wave such a hit through as "pre-existing / not mine." **Why the per-module filter is wrong for this class specifically:** a table with RLS on and zero policies returns `error:null` + empty rows — a silent blank screen for whatever module reads it — and the 5 tables that carried exactly this defect for weeks (`projects · hostesses · salary_reports · assignments · logistics`) were created in **module 2's** migration yet belong to modules **4/5/6/8**, so every per-module reviewer correctly saw "not mine" and moved on. A deliberate DEFINER-only deny-all (`login_attempts`, `login_rpc_calls`) is fine — note it and move on. Any other `rls_enabled_no_policy` table blocks close until it has a policy or a written, reasoned triage note.
- Live preview smoke test of the module's key flows (per the verification workflow) with proof (screenshot/log/network).
- Explicit list of every file changed in this module (code, DB, docs).
- **`npm run gate`** — the composite (verify + dup + deadcode + audit + check:context). Run it once and report its output rather than reasoning about which checks apply; it also covers the context-integrity check, so there is no separate step for that. Run it once and report the output rather than reasoning about which checks apply. *(It is expected to fail on `deadcode`/`audit` until the quality-gate hardening task lands — see STATUS. **`npm run gate` green is that task's definition of done.**)*

### 4c. 🧨 Module Gotchas File (binding — added 28/07/2026)
**Write or refresh `src/modules/NN_name/CLAUDE.md`** — a short Hebrew file that loads automatically only when a future session touches this module's directory. This is REG-IN's living code map: it sits next to the code, so it cannot drift far, and it costs nothing until it is needed.

**Include ONLY what a competent engineer would get *wrong* without being told** — the traps, not the tour:
- Silent-failure paths (a function that strips fields, a flag whose removal deletes data, a query that legitimately returns empty).
- Coupled edits — "change X and you must also change Y or Z breaks quietly".
- Deliberate deviations that *look* like bugs (so nobody "fixes" them back).
- This module's RLS surface and any deny-all table it reads.
- Anything in the E2E contract (`data-testid`, Hebrew `title` strings) that renaming would break.

**Exclude** anything visible from reading the code, anything already enforced by ESLint/CI/hooks, and anything already in `src/CLAUDE.md` (the cross-module layer). Cite `file:line`. Two worked examples to match in tone and density: `src/modules/01_auth/CLAUDE.md` and `src/modules/02_customers/CLAUDE.md`.

**Also compact the micro-guide** (its §8(i)): the whole guide collapses to an as-built summary — what was built, the deviations (§9, never compacted), and the Ledger. Archive the pre-compaction copy under `docs/archive/`.

### 4b. 🔁 Duplication & Shared-Component Check (binding — keeps the codebase reviewable)
Guard against copy-paste and against logic that *should* be shared but was re-implemented — so an experienced engineer opening the repo finds one home per concept (iron rule 14 SSOT), not five near-copies.
- **Mechanical (textual clones):** run `npm run dup` (jscpd). For every clone that involves this module's files, decide: **extract to `src/lib/`** (or a shared component) if it's genuine shared logic, OR record why it stays separate. jscpd only catches textual clones — it is the floor, not the ceiling.
- **Complexity (spaghetti):** run `npm run lint` and review this module's `sonarjs/cognitive-complexity` + `sonarjs/no-identical-functions` warnings. Each is fixed now (small + safe) or logged as a §7 tech-debt line with its target.
- **Dead code (a different question — not duplication, but the same "keep it reviewable" spirit):** run `npm run deadcode` (knip) and review any unused files/exports/dependencies this module introduced. Delete what's genuinely dead now (cheap, safe), or log why it's kept (e.g. deliberately built ahead of a dependent module).
- **Semantic "should-be-shared but isn't" (the careful one — Ishay's explicit ask):** actively hunt for functions/components/validators in this module that duplicate the *intent* of code elsewhere even when jscpd does NOT flag them (a formatter, a picker, a permission check, a money/date helper re-derived instead of imported from `src/lib/`). For each candidate, **do NOT reflexively recommend merging** — separation is sometimes deliberate and correct. First trace BOTH sites: do they share the same invariants, and would they change together or independently? Only recommend unifying when they genuinely must stay in lockstep; otherwise **record why the separation is intentional** so no future audit re-raises it. A confident wrong "share this" that couples two things which must evolve apart is worse than leaving the duplication (same verify-the-recommendation discipline as the `quality-audit` skill — read the function you'd change and every caller before proposing the change).
- Findings route to §7 tech-debt (with target module) — or §6 if a duplication is an active bug risk (two copies that must agree and already drifted).

### 5. 📊 QA Coverage Matrix (fill the micro-guide's "as-run" column)
For each type — Unit · Integration · E2E · Regression · UAT · Security/Pen · Performance/Load · Usability · Compatibility — mark ✅ done / ⚠️ partial / ❌ none / N-A with one-line evidence. Be honest; over-claiming here poisons the academic report. Acceptable gaps get a target module/milestone; real gaps go to Section 6.

### 6. 🛑 Blockers — MUST FIX NOW
Critical bugs, failed matrix scenarios, RLS gaps that must be resolved before this code touches a shared branch. If none: "None".

### 7. ⏳ Tech Debt — HANDLE LATER
Deferred improvements, each with the future module/stage where it must be reopened. These get appended to the micro-guide's Deviations & Tech-Debt Log (section 9) **AND registered as lines in `docs/PROJECT_MASTER.md` §6 with their target module** — §6 is mandatory reading in every module's opening prompt; a debt that lives only in this module's own log will never be found by the module that must repay it.

🔴 **And the reverse sweep, which must PRINT its count — closing module N pays debts other modules are still advertising** (Ishay's approved rule, 05/08/2026). Iron rule 15 enforces one direction only (a guide's token must have a §6 line); it catches a *silent* debt and cannot catch a *paid* one. So grep `🚧 מN` across **all four surfaces where the token lives** — `PROJECT_MASTER §6` · `docs/micro_guides/**` · **`src/**` comments** · `docs/*design_notes*` — and emit one mandatory line:

> `🚧 מN swept — K tokens found across §6 · micro-guides · src comments · design notes; each struck-with-date or justified as still open. (K may be 0 — say so.)`

**Why an output line and not a hook:** a sweep with no output is indistinguishable from a sweep that never ran, and Ishay is the only gate. *(Measured 05/08/2026: module 3's close swept §6 correctly and left live `🚧 מ3` tokens in `micro_guides/module-2.md:45` and `src/lib/customers.js:219` — the same class the journal already recorded at `CLAUDE_CODE_LOG:1007` and §6:393/394. Fourth occurrence. A blocking hook was considered and rejected: it would have to parse STATUS.md's prose module table to learn which modules are closed, and a false block teaches sessions to route around hooks — the principle `block-shell-dialect-mixup.sh` states about itself.)*

### 👑 Final Merge Verdict
Binary: **[YES]** — stable, secure, DoD-compliant, mergeable into `dev` now / **[NO]** — at least one Section-6 blocker. Two-sentence justification.
**Typed-echo DoD sign-off (irreversible-gate safeguard):** a **[YES]** verdict is an irreversible gate — before it stands, print a 👤 gate where the human (Ishay) types the module name + `DoD` (NOT just "yes"/"approve") to confirm they reviewed the DoD checklist. This is one of only two typed-echo gates (the other = applying a migration, DB protocol in `CLAUDE.md`); every other 👤 gate takes an ordinary approval.

### 📄 The report itself — publish it as an HTML artifact, not a wall of chat text (added 29/07/2026)

**Why this is binding and not a nicety:** Ishay cannot read code. A closing audit delivered as 200 lines of Hebrew chat with `file:line` citations is a format that almost guarantees he skims it — and skimming the close report is exactly how "זה לא מה שהתכוונתי" survives to the merge. The context-engineering doctrine is explicit that a rendered artifact is a **richer reference than prose**; here it is also the difference between a review that happens and one that doesn't.

**How:** load the `artifact-design` skill first (required before the first publish), write the page to a file, then publish it with the `Artifact` tool. It is private to Ishay by default.

**What the page must contain, in this order** — the reader is a product manager, not an engineer:
1. **The verdict**, large and first: ✅ mergeable / ⛔ blocked, with the one-sentence reason.
2. **What this module now does**, in plain Hebrew — the capabilities as a user experiences them, not the file list.
3. **The evidence, shown not claimed** — the preview screenshots, the test counts you actually ran, the RLS matrix result. A number with no command behind it does not go on the page.
4. **What was deliberately NOT built** and where it went (§6 debt lines, deferred §7 items, the target module for each).
5. **Blockers** (if any) and **tech-debt** — separated, never mixed.
6. **The comprehension quiz** (below).

Keep the chat message itself short: the verdict, the link, and "תעבור על הדף ותגיד לי אם משהו לא כמו שהתכוונת".

### 🎓 Comprehension quiz — 3 questions, before the merge (added 29/07/2026)

At the bottom of the artifact, ask Ishay **three questions in plain Hebrew** about how the module actually behaves. Not trivia about the code — **behaviour he will have to live with**, phrased as concrete situations with real names and times:

> *"דיילת מבטלת יומיים לפני האירוע. מה קורה עכשיו במערכת, ומה אתה צריך לעשות ידנית?"*

**Why this exists:** Ishay's standing fear is that something broke silently and he won't know. He cannot verify that by reading a diff. A question he cannot answer is the cheapest possible signal that the built behaviour and his intent diverged — and it costs five minutes. It also serves the learning layer his instructions require: understanding the behaviour is a precondition to signing off on it.

**Rules:** exactly three, one per riskiest behaviour of this module · each must have a definite answer that is visible in the artifact above it · **this is a signal, not a gate** — a wrong answer means "stop and walk him through it", never "merge blocked". Record in the micro-guide §9 anything the quiz revealed as a genuine intent gap.

### 🪞 Self-review — four questions, answered before the verdict (added 05/08/2026)

**Why here and nowhere else:** a module close is the only moment in this project that fires on an
artifact rather than on someone remembering. These four are the questions that **measurably produced
findings** when they were run; the two that never did were dropped. Full set and evidence:
`.claude/skills/_shared/failure-modes.md`.

🔴 **Every answer names a concrete event from THIS audit. An answer with no anchor is a vibe, and a
vibe here is worse than skipping the question** — it manufactures the feeling that the check ran.

1. **Who caught the mistakes in this module — me, or someone else?** *(Measured across five shifts in
   two arenas, self-catch was **zero** every time. Zero is the expected answer. If you report that you
   caught your own, say exactly how, because that would be the first time.)*
2. **Which of my own actions in this audit got no check at all?** Not "what did I find" — **what did
   I never look at.** That is where the misses that were never caught still live.
3. **Where did I look for confirmation instead of refutation?** Including: did I verify a claim the
   way the *reporter* searched, or the way the **source** writes it?
4. **What is the general shape of what I found — how many of these are really the same defect?**
   *(This is the question that collapses a list of symptoms into causes; run it before writing the
   tech-debt section, because it changes what gets registered.)*

**Output: four short answers, each with its anchor. "אין" is a complete answer where it is true.**

### 💾 Persistence (mandatory — the audit is not done until these are written)
0. **§6 debt registration check (iron rule 15):** verify every Section-7 item (the audit report's tech-debt section — NOT `PROJECT_MASTER.md` §7) AND every 🚧 row of the micro-guide's "Capabilities delivered vs deferred" table has its byte-matching `🚧 מN` line in `docs/PROJECT_MASTER.md` §6 (`grep '🚧 מN' docs/PROJECT_MASTER.md` per target module N) — add any missing line now. This is the closing audit's belt-and-suspenders re-check of the rule-15 mechanism the Stop hook (`check-docs-updated.sh` 0ג) already enforces.
0b. **§7 ripple check — run iron rule 13(א)-(ג) explicitly (not just 13(ז)) for every `PROJECT_MASTER.md` §7 item this module ruled or implemented.** The load-bearing audit action: the §7 item itself marked ruled (date+owner, batch note updated if it was the cluster's last open item); the ruled value reflected in the code/DB where it lives; and `grep '§7.N'` AND `'מראת §7.N'` across `docs/guides/**` + `docs/micro_guides/**` — every citation current and every tagged mirror (🔗) matching §7 verbatim. Fix what doesn't.
0c. **DB-roadmap check:** in `docs/db_roadmap.md` — mark every row this module executed as Done (dated strike-list, §10 there), and add rows for newly-discovered deferred DB work. Then verify that every schema/§7/shared-surface change from this module that lands on a FUTURE module's tables or surface is named in its `db_roadmap §10` Done-row **and** a `PROJECT_MASTER §6` line (module numbers listed), so the session that opens that module finds it. *(The old `CHANGELOG` forward-notice was retired with the file, 23/07/2026; the cross-developer 📣 tag, 22/07/2026 — single developer.)*
1. **Micro-guide:** tick the DoD checkboxes you verified; fill the QA matrix "as-run" column; append Section-7 items to its Deviations & Tech-Debt Log; set the status header to `🔒 Closed — awaiting PR/merge` (on YES) with today's date+time (`DD/MM/YYYY HH:MM`, from the system clock — all dated doc entries below use this format too).
2. **`docs/CLAUDE_CODE_LOG.md`:** session entry summarizing the audit result and any blockers (this is where the "module closed — verdict" record lives now; `docs/CHANGELOG.md` was retired 23/07/2026 and is not written to).
2b. **LOG compaction — this session OWNS the job (ruled by Ishay 31/07/2026).** Measure the narrative: `awk '/^## Session Log/{f=1;next} /^## Reference/{f=0} f' docs/CLAUDE_CODE_LOG.md | wc -l`. Over ~180 ⇒ compact toward ~150 **now, in this session** — do not merely flag it.
  **Why it lives here and not in `regin-docs-sync`** *(Ishay's ruling, after that routine's flag had no owner and the narrative reached 457 lines)*: compaction's core rule is **"harvest before you delete"** — every fact still useful going forward migrates to a reference section BEFORE its dated entry is shortened. That judgement needs to know **what the next modules will need**, which a memoryless routine run cannot; and its output is English and technical, so Ishay cannot review it — meaning a routine doing this would have **no gate at all**. A module close is the natural moment: the finished module's blow-by-blow narrative is spent, this session has just read everything, and it reports to Ishay. `regin-docs-sync` keeps measuring and flagging only — **do not grant it compaction authority.**
  **How:** archive the pre-compaction copy under `docs/archive/` first · never touch the 2–3 newest sessions, the reference sections, or `## Current State` · fold older dated entries into `### 📦 Week DD/MM–DD/MM — topic` buckets **after** their evergreen facts (gotchas, tech-debt, DB decisions, solved traps + how) are in the reference sections · state in the audit report how many lines went out and where the harvested facts landed.
  *(F1 subtraction: this replaces an orphaned warning nobody owned — the routine's flag — with a step inside a flow that already runs. It does not add a new mechanism.)*
3. **`STATUS.md`:** module row → "ממתין ל-PR/merge" (the ✅ flip happens only after the actual merge); refresh "עודכן לאחרונה".
4. **Routine growth-triggers check:** consult the growth-triggers table in `docs/claude_routines.md` §4 — did this module trip a routine-update trigger (new `e2e/*.spec.js` files, a new/removed key doc, changed hook logic, a new check tool)? If yes, update the canonical routine text AND (in Ishay's session) his live SKILL.md copies per the dual-update protocol there; if no, state "no routine triggers" in the audit report.

### 🚀 PR Instructions (print at the very end, in Hebrew)
Print for Ishay, concretely, as numbered steps:
0. **Push first (the audit never pushes) — in the mandatory pre-PR order** (`docs/claude_routines.md` §1): if docs may have drifted, **recommend Ishay run** `regin-docs-sync` FIRST (routines are his click — iron rule 13(ז), `docs/CLAUDE.md`) (it edits docs; running it after pr-gate leaves its fixes uncommitted), then run the `regin-pr-gate` routine (Run now — it stages EVERYTHING, commits+pushes on a green verify, feature branches only), or ask Claude in-session to commit+push per the end-of-session state.
1. GitHub → Pull requests → New → base: `dev` ← compare: `[BRANCH_NAME]` → short description (provide a ready-to-paste one) → Create. What to watch in CI (quality-gate + secret-scan/gitleaks); on red — paste the failing log back to Claude. **Also print a "🧩 prompt for Claude-in-Chrome" (iron rule 17): a self-contained Hebrew prompt Ishay can paste into the Chrome extension to open this exact PR (repo, base, compare, title, one-line description) and report CI status — no secrets in it.**
2. Merge rules: review the `Files changed` diff yourself, wait for CI to go green, then merge. On red — paste the failing log back to Claude before merging. *(Deliberately no 🧩 handoff block here — reviewed and confirmed with Ishay 24/07/2026: the merge decision is his alone, never Claude's, and opening the diff yourself is a trivial click — a 🧩 prompt would add ceremony without saving real effort. This is intentional, not an oversight; don't re-flag it.)*
3. After merge: pull `dev` fresh, ask Claude to flip the module row to ✅, and run the `regin-docs-sync` routine yourself (Ishay's click) (Run now — the deep sync-audit) as the final cross-file consistency pass (CLAUDE.md rule 13(ז)).
(`npm run gate` and `npm run test:e2e` are NOT extra steps for the human — the audit above already ran them; `regin-e2e-check`/`regin-health-pulse` stay optional.)

Run the audit now and output the full report.
