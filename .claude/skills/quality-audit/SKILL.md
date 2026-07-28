---
name: quality-audit
description: REG-IN — comprehensive whole-codebase quality review (NOT a single-PR diff review). Load whenever Ishay asks to assess overall code health: "עשה סקירת קוד", "בדוק את איכות הקוד", "איך הקוד נראה / איך מהנדס תוכנה יתרשם", "סקירה מקיפה של כל המערכת", "יש כפילויות / קוד ספגטי?", "בדיקה כוללת לפני מיזוג/אבן-דרך", "האם הטקסטים בממשק ברורים", "האם הבדיקות שלנו מכסות נכון", or code review / quality audit of the entire codebase. Dispatches parallel agents by dimension (silent failures · tests · testing strategy · comments · security · DB/RLS · accessibility · UI copy · architecture · duplication/should-be-shared), verifies every finding AND its recommended fix itself, and returns a ranked Hebrew report + an ordered fix work-plan (recommendation-only). Read-only — writes nothing, decides nothing. Not for a single PR diff (use code-review) or one module's close (module-close).
---

# quality-audit — REG-IN whole-codebase health review

Comprehensive code-quality assessment of the entire REG-IN codebase. The goal: understand how this code would hold up under review by an **experienced software engineer seeing it for the first time** — what is genuinely good, what is weak, and what would raise the biggest concerns. Ishay's core worries this skill answers: **code spaghetti**, **duplicated functions doing the same thing**, and **components that should be shared but were re-implemented**.

This is a **repo-local REG-IN skill** and is NOT part of the shared-kernel set of the other five (`module-blueprint`/`module-build`/`module-close`/`section7-rulings`/`post-merge`). It carries its own discipline section below — its signature rule (*verify the recommendation, not only the finding*) is stronger than the generic kernel. It still obeys the universal doctrine in `~/.claude/CLAUDE.md` (plain Hebrew to Ishay, he's the product manager, no citation without a same-turn check) and the REG-IN instantiation in `.claude/skills/_shared/discipline.md`.

**When to run:** after a wave of work has *settled* — end of a phase, before a milestone, when Ishay wants a health read. **Not mid-build:** a review over half-done code manufactures phantom findings. If `git status` shows another session's uncommitted work in progress, tell Ishay and prefer to postpone.

**The chat report to Ishay is in plain Hebrew** — he has no coding background; every technical term gets a short parenthetical explanation.

## Step 0 — orient before judging anything

Read, in this order:
1. `STATUS.md` — current module status, active step, what just settled.
2. `CLAUDE.md` — the project's iron rules. **You judge against these, not against generic best practice.** RTL Hebrew, SSOT for business logic (rule 14), `src/lib/` layer, module RLS (§7.21), server-side enforcement, no secrets, Hebrew why-first comments. Generic best practice that contradicts a stated project rule loses.
3. `docs/PROJECT_MASTER.md` — **§6 (cross-module debt registry) and §7 (open questions + rulings)**. These, plus each `docs/micro_guides/module-N.md`'s **§9 Deviations & Tech-Debt Log** and **§4 "Accepted limitations"**, are REG-IN's **do-not-re-raise list**: deliberate deviations from the spec, ruled by Ishay, with reasons. ⚠️ **Do not report any of them again as defects.** If you believe one became wrong for a NEW reason, say so explicitly and explain what changed — do not silently re-raise it.
4. `docs/architecture_and_qa_roadmap.md` — the Definition-of-Done + engineering standard the code is held to.

⚠️ **Counts in the docs go stale.** Never quote a test count, file length, migration count, or policy count from a doc. Measure them yourself (`npm run test:run`, `wc -l`, `ls supabase/migrations/`, Supabase MCP). Where the docs and reality disagree, **that discrepancy is itself a finding.**

## Scope
`src/lib/`, `src/modules/`, `src/components/` (**excluding** `src/components/ui/` — vendored shadcn, not our code), `supabase/migrations/`, and `e2e/` (for the test dimension). **Whole current state of the files, not a diff** — do NOT run `git diff` (the working tree is usually clean, so a diff review finds nothing). REG-IN is **JavaScript, not TypeScript** — skip type-system dimensions entirely.

## How to dispatch
Run independent reviews **in parallel**, one per dimension. **Do not let a reviewing agent spawn its own sub-agents** — each does its own reading and reports its own findings. Tell every agent explicitly: **read-only**, no `git diff`, no DB writes, no sub-agents, and it must read the do-not-re-raise sources (Step 0.3) before reporting.

| Dimension | How to dispatch |
| --- | --- |
| Swallowed errors, misleading fallbacks, silent failures | `pr-review-toolkit:silent-failure-hunter` |
| Test coverage and its trade-offs (unit + E2E) | `pr-review-toolkit:pr-test-analyzer` |
| Testing architecture — coverage *shape*, not individual test quality (pyramid balance; are the highest-risk business-logic paths protected at the right layer). Do NOT re-grade individual test files — that's the row above. | `general-purpose` agent told to invoke the `engineering:testing-strategy` skill, pointed explicitly at REG-IN's highest-risk logic: `src/lib/pricing.js`, Smart Match, permission/RLS enforcement |
| Comment accuracy (the dense Hebrew why-first comments) | `pr-review-toolkit:comment-analyzer` |
| Security, authorization, secrets | A general-purpose agent given the **OWASP rubric verbatim from `.claude/skills/module-close/template.md` §3b** (injection · XSS · secrets · client-only authorization · unsafe external input · error leakage · dependency risk) — require file:line per finding and an explicit "checked, clean" per empty category. Also run `npm run audit` and read its output for known dependency CVEs (a different signal from code-level review: third-party package vulnerabilities, not code we wrote). *(Was the `security-auditor` agent of the **code-modernization** plugin; that plugin is disabled in REG-IN since 28/07/2026 — see `docs/toolbox.md`.)* |
| DB / RLS / indexes / migrations (against §7.21 + the ruled model) | `general-purpose` agent told to invoke the `supabase:supabase-postgres-best-practices` skill + read live DB via Supabase MCP (read-only) |
| Accessibility & field usability (Hebrew RTL, the real use context) | `general-purpose` agent told to invoke the `design:accessibility-review` skill |
| Hebrew UI copy quality — error messages, empty states, CTAs, field labels. NOT technical a11y (contrast/keyboard-nav) — that's the row above. | `general-purpose` agent told to invoke the `design:ux-copy` skill, scoped to user-facing strings in `src/modules/` + `src/components/` (excluding `src/components/ui/`) |
| Module boundaries, layering, SSOT adherence, debt | `general-purpose` agent told to invoke `engineering:architecture` + `engineering:tech-debt` |
| **Duplication & should-be-shared (Ishay's emphasis)** | `general-purpose` agent — see the dedicated protocol below |

**Verify dispatch targets exist first** (agent + skill names) — concretely: check each named agent type against the available-agents listing, and each named skill against the available-skills listing, both already surfaced in this session's system context (or load via `ToolSearch` if a skill's schema isn't resolved yet). Record a one-line dated confirmation ("dispatch targets verified present, DD/MM/YYYY") in the report. If one is missing in this environment, say so in the report — **do not silently drop the dimension.**

### The duplication & should-be-shared dimension (the one Ishay cares most about)
Give this agent four concrete jobs, in order:
1. **Textual clones:** run `npm run dup` (jscpd) and read its clone list. Every clone is a candidate for extraction to `src/lib/` or a shared component.
2. **Complexity (spaghetti):** run `npm run lint` and collect the `sonarjs/cognitive-complexity` + `sonarjs/no-identical-functions` warnings — these are the objective spaghetti/duplicate-function signals.
3. **Dead code / orphaned exports (a different question — not duplication, but adjacent):** run `npm run deadcode` (knip) and read its output — unused files, unused exports, and dependencies nothing imports anymore. Each is a candidate for deletion (an unused export is also a small SSOT-clarity issue: a function reachable from outside the file that nothing outside the file actually calls).
4. **Semantic duplication jscpd CANNOT see:** hunt for functions/components/validators that duplicate the *intent* of code elsewhere without being textual copies — a formatter, a picker, a permission check, a money/date helper re-derived instead of imported from `src/lib/` (iron rule 14 says each such concept has exactly ONE home). This is where the real "should-be-shared but isn't" findings live.

⚠️ **The careful part (Ishay's explicit instruction — "maybe there's a reason they're separated; check well"):** for every should-be-shared candidate, **do NOT reflexively recommend merging.** Separation is sometimes deliberate and correct. Trace BOTH sites first: same invariants? would they change together or independently? Only recommend unifying when they genuinely must move in lockstep. If separation is intentional, **say so and say why** (so it becomes a do-not-re-raise item, not a repeated finding). A confident wrong "share this" that couples two things which must evolve apart is worse than leaving the duplication.

## Verify before you relay — findings AND recommendations
**Do not pass an agent's output through untouched.**

- **Every finding you keep in the top tier: open the file yourself and confirm it** (read lines N–M). If you cannot confirm by reading, label it **"pattern worth checking"** and say so plainly. Never let an unverified claim sit next to a verified one without a marker.
- **Verify the recommendation, not only the finding — this is the failure mode that actually bites.** A finding can be factually true while the fix it implies is wrong, impossible, or harmful. Before writing any recommendation: (1) read the function you're telling someone to change — not just the call site; (2) trace what the change does to *every* existing caller, including ones the finding isn't about; (3) if the fix touches a shared helper, state which other call-paths it changes — that's part of the finding, not a footnote; (4) if you haven't traced it, write **"direction only — the concrete fix needs design at fix-time."** A confident wrong fix is worse than none. *(This matches how Ishay wants it: each problem and its fix are examined separately at fix-time — the audit proposes direction and order, it does not pre-commit fixes.)*

## What to produce — a ranked Hebrew report
1. **Genuine strengths** — what an experienced engineer would find above-average, with file references. Real ones only; **do not pad** — an empty-ish strengths section is a legitimate outcome.
2. **What would concern a reviewer**, ranked by severity. Each with `file:line`, why it matters **concretely for REG-IN** (not in the abstract), and a specific fix (or "direction only").
3. **Change since the last assessment** — if a prior audit is on record (CLAUDE_CODE_LOG / §6), state plainly what was fixed, what still stands, and **what regressed.** A regression is the most valuable thing here.
4. **An honest overall read** — if a senior engineer opened this repo cold, what's their first impression, and the two or three changes that would most move it.
5. **📋 Ordered fix work-plan (Ishay's explicit requirement — recommendation only).** A prioritized, ordered list of fix-*sessions* (not tasks — group items that are one session's worth into one line). Order by: blockers/bug-risk first → then safety (a live-ish system: safe-in-one-pass before risky) → then dependency (fixes that unblock others) → then polish. For each row: what it is · severity gate (🔴 must-fix-before-next-module / 🟡 soon / ⚪ someday) · whether it needs a conversation with Ishay (💬) or is ready to prompt (▶️) · what blocks it. **Each problem and its fix are examined separately when actually fixed — this plan is the order and the direction, never a pre-approved change.**

## Where the findings go — read-only, Ishay decides
⚠️ **Findings that live only in the chat evaporate.** But this skill **writes nothing itself** — it is read-only and Ishay decides what enters the plan. Produce the report so it can be filed with no further digging:
- REG-IN's durable homes are `docs/PROJECT_MASTER.md` **§6** (cross-module debt, mandatory reading at every module's opening) and **§7** (open questions/rulings). For each keep-worthy finding, give a **§6-ready one-line row** (with target module) or a §7-style question if it's a genuine open decision — shaped so Ishay (or a follow-up session he authorizes) can paste it in.
- If a finding replaces or shrinks an item already in §6/§7, **say which one** — items that quietly go obsolete are how the registry drifts.

## End of session
**Log that this audit ran — the one write this read-only skill does make.** Append a dated `CLAUDE_CODE_LOG.md` entry (date, scope, the ranked findings' one-line headlines) even though the codebase itself gets zero writes: this is what a FUTURE quality-audit run means by "a prior audit is on record" ("What to produce" item 3, above) — without this, that check always resolves to nothing, no matter how many audits actually ran. This is the same end-of-session logging every other skill in this project does; it doesn't touch code/DB and isn't a decision about the codebase.

## Rules
- **Read-only.** Modify nothing, touch no database with writes. Check `git status` first; if another session has uncommitted work in progress, prefer to postpone (say why).
- **Be honest, not flattering.** Do not soften findings; a review tuned to produce praise is worthless. But **do not manufacture findings to look thorough** ("לא בכוח") — a short report of confirmed problems beats a long padded one. No findings in a dimension = say "אין הערות" for it.
- **Judge against `CLAUDE.md`** — the iron rules win over generic best practice when they conflict.
- **The owner wins on operational reality.** If Ishay's real-world process contradicts a static-analysis conclusion, he's right — and offer to record it as a do-not-re-raise item (§6/§9) so nobody raises it again.
