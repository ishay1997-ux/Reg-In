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

<!-- shared kernel — identical in all five repo-local skills (feature-acceptance moved to ~/.claude/skills/ 23/07 night — no longer part of this set); a change here updates all five + _shared/discipline.md in the same session -->
## Discipline (mandatory — shared doctrine)
The universal doctrine lives in **`~/.claude/CLAUDE.md`** (loads every session, every project): plain-Hebrew communication · Ishay is the product manager — understanding-declarations invited for correction, product/design decisions are his · no citation without a same-turn check · resume from disk, not from narration. Read and apply it. Then read **`.claude/skills/_shared/discipline.md`** for the REG-IN instantiation — which file/tool verifies which kind of claim, and what "resume from disk" concretely means in this repo.
<!-- end shared kernel -->
