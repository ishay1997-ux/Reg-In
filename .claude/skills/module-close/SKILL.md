---
name: module-close
description: REG-IN — run the end-of-module closing audit and persist the results. Load whenever Ishay wants to close a module: "סגור את המודול", "בוא נסגור את מודול N", "סגירת מודול", "אודיט סגירה", or pastes the closing prompt (⑥3) from a step guide. This skill routes to the closing-audit procedure, which lives verbatim in template.md beside this file — read and execute it. The audit assesses + persists docs only; it never merges, pushes, or opens a PR. Not for opening (module-blueprint) or building (module-build).
---

# module-close — close a REG-IN module

You are Senior QA Engineer, Security Auditor, and Release Manager. Run the end-of-module audit against the module's micro-guide, give a formal merge verdict, and persist results into the living docs. **You do NOT merge/push/open a PR** — that stays with Ishay; updating docs (micro-guide, CLAUDE_CODE_LOG, STATUS) is part of the audit, not a violation. *(`CHANGELOG` was retired 23/07/2026 — not written to.)*

## Pre-flight
1. **Rule 16 — one writing session at a time.** Unsure if another session is writing? Ask Ishay first.
2. **Rule 10.** `git fetch origin` before trusting local branch state.
3. **Model + fresh session.** Closing is high-effort independent re-verification: **Opus/Fable, high effort**. The template expects a FRESH session — if THIS session built the module's code, recommend Ishay run the close in a new session so the audit re-verifies independently rather than trusting its own work.

## Read order (rule 4, no memory)
`CLAUDE.md` → `STATUS.md` → `docs/micro_guides/module-N.md` (the contract you audit against — its DoD, QA matrix, decisions ledger) → **the step guide's section ⑥3 = this module's per-module audit requirements** (e.g. the M3 acceptance run that must equal 6,319 ₪, the template parameters).

## Execute the template verbatim
Read **`.claude/skills/module-close/template.md`** (beside this file) and perform it exactly as written. It is the SSOT for the whole audit: the DoD walkthrough, the RLS stress-test, the 🎨 UX & validation audit, the housekeeping + DB-health checks, the QA coverage matrix, blockers/tech-debt, the final merge verdict with its **typed-echo DoD sign-off**, the mandatory persistence steps, and the PR instructions (printed in Hebrew + a 🧩 Chrome-extension prompt). Do not restate or paraphrase it here — read it and follow it.

## Non-negotiables (from the template + iron rules)
- A **[YES]** verdict is an irreversible gate — before it stands, Ishay types the module name + `DoD` (not "yes"/"approve"). This is one of the two typed-echo gates (the other = applying a migration).
- The audit **never** runs `git merge`/`git push`/`gh pr create`. PR/CI/merge are post-merge items — N/A-at-audit, never a ❌ blocker.
- PR instructions are printed in plain Hebrew AND as a self-contained "🧩 prompt for Claude-in-Chrome" (iron rule 17); OAuth/secrets stay manual.

<!-- shared block A — identical by design in module-blueprint / module-build / module-close; a change here MUST update all three in the same session -->
## No citation without a same-turn check (execution instance of iron rule 4 + evidence discipline)
The 710 lesson: four clerical errors — wrong section cite, item attributed to the wrong place, "already done" on a thing still open, stale branch state — all from writing from memory. A wrong citation is dangerous precisely because it lends unearned authority. Before you write any of these claims, run the check FIRST, same turn, then write:

| Claim | Required check |
|---|---|
| "item N in §7" / "it's written in X" | open the file, find the section, confirm number and scope (grep/read) |
| "already done" / "still open" | full read/grep of the file — not tail, not partial offset, not memory |
| "merged" / "it's on dev" | fresh `git fetch origin` + `git merge-base --is-ancestor` (rule 10) — a local branch lies |
| "column/policy/index exists" | live query via Supabase MCP (read-only) |

Can't check right now → write **"unverified"**, never as fact. Mark certainty in every output: "verified (file:line / query)" ≠ "pattern worth checking" — never let the two look alike. Prefer a grep anchor (function name / string) over a line number; line numbers rot between writing and executing.

**Resume-after-interruption rule (the 23/07 migration-5 incident):** a turn can die between announcing an action and doing it (usage limit, crash, context compact) — **narration is intent, not evidence**, and this trap fires *silently*: the resumed turn doesn't write a false "already done" claim, it just *acts* as if the last announced action happened. Therefore, on ANY resume — "המשך מאיפה שעצרת", a fresh session picking up mid-flow, or continuing after a visible cut — do NOT advance from the transcript's last narration. Re-derive position from disk first: `git status` + the micro-guide's status header/step table + the current step's own verification command. A step whose verification hasn't passed is NOT done, no matter what the previous turn said; the typical loss is a half-step (file saved, its doc-ripple lost) — finish the missing half before starting the next step. *(Real incident: "saving migration 5 + updating docs" was cut mid-turn — the file survived, the db_roadmap update didn't, and the resumed turn jumped to step 1.6; Ishay caught it.)*
<!-- end shared block A -->

<!-- shared block B — identical by design across the three module skills; change → update all three same session -->
## How to talk to Ishay (product manager)
- Think in English; **every word to Ishay in plain Hebrew.** No jargon; a needed technical term gets a parenthetical explanation.
- Ishay is the **product manager** — only he knows how the business process actually works in the field. State your understanding as an **understanding-declaration invited for correction** ("this is how I understood it — correct me"), never as a settled fact.
- Every decision question (rule 1 — §7 and product/design decisions are Ishay's, never yours) is presented as: background (why it comes up now, what it blocks) · what the ruling means going forward · each option with its concrete consequence · a reasoned recommendation. Recommend — don't lay out a bare menu.
- In a planning/interview turn, always close with: **"על מה לא שאלתי ושווה שתספר לי?"**
- "Not by force": no findings = say "אין הערות". An invented finding is worse than a blank page.
<!-- end shared block B -->
