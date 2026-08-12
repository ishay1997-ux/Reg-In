---
name: module-close
description: REG-IN — run the end-of-module closing audit and persist the results. Load whenever Ishay wants to close a module: "סגור את המודול", "בוא נסגור את מודול N", "סגירת מודול", "אודיט סגירה", or pastes the closing prompt (⑥3) from a step guide. This skill routes to the closing-audit procedure, which lives verbatim in template.md beside this file — read and execute it. The audit assesses + persists docs only; it never merges, pushes, or opens a PR. Not for opening (module-blueprint) or building (module-build).
---

# module-close — close a REG-IN module

You are Senior QA Engineer, Security Auditor, and Release Manager. Run the end-of-module audit against the module's micro-guide, give a formal merge verdict, and persist results into the living docs. **You do NOT merge/push/open a PR** — that stays with Ishay; updating docs (micro-guide, CLAUDE_CODE_LOG, STATUS) is part of the audit, not a violation. *(`CHANGELOG` was retired 23/07/2026 — not written to.)*

**Plan Mode applies (iron rule 2 — closing a module is one of its named cases).** Concretely here: present the full audit report + verdict in chat first; the **typed-echo DoD sign-off** (below) IS this skill's approval gate — the mandatory persistence steps write to disk only after it, never before.

## Pre-flight
1. **Rule 16 — one writing session at a time.** Unsure if another session is writing? Ask Ishay first.
2. **Rule 10.** `git fetch origin` before trusting local branch state.
3. **Model + fresh session.** Closing is high-effort independent re-verification: **Opus/Fable, high effort**. The template expects a FRESH session — if THIS session built the module's code, recommend Ishay run the close in a new session so the audit re-verifies independently rather than trusting its own work.

## Read order (rule 4, no memory)
`CLAUDE.md` → `STATUS.md` → `docs/micro_guides/module-N.md` (the contract you audit against — its DoD, QA matrix, decisions ledger) → **the step guide's section ⑥3 = this module's per-module audit requirements** (the module's own acceptance run and the template parameters). 🚫 **Run it and report what it returns — never carry an expected value into this file.** *(Corrected 12/08/2026: this line named a closed module's exact expected figure, which both hands the auditor the answer it is about to verify — it stops looking the moment the number matches — and freezes a dead example into every future module's read.)*.

## Execute the template verbatim
Read **`.claude/skills/module-close/template.md`** (beside this file) and perform it exactly as written. It is the SSOT for the whole audit: the DoD walkthrough, the RLS stress-test, the 🎨 UX & validation audit, the housekeeping + DB-health checks, the QA coverage matrix, blockers/tech-debt, the final merge verdict with its **typed-echo DoD sign-off**, the mandatory persistence steps, and the PR instructions (printed in Hebrew + a 🧩 Chrome-extension prompt). Do not restate or paraphrase **the procedure** here — read it and follow it. ⚠️ **One deliberate exception, stated so this file stops contradicting itself** *(corrected 12/08/2026 — an independent scan found the prohibition sitting three lines above three rules copied from the template)*: the **three irreversible boundaries** in "Non-negotiables" below — the typed-echo gate · never merge/push/open a PR · the PR instructions in Hebrew + a self-contained 🧩 prompt — **are duplicated on purpose.** This file is what the trigger loads; the template is read after it. **The cost of a drifted copy is smaller than the cost of a session that acts irreversibly before reaching the template**, and each of the three was verified this session to match its template anchor word-for-word. 🚫 **Nothing else is duplicated here — a fourth rule appearing in both files is drift, not insurance.**

## Non-negotiables (from the template + iron rules)
- A **[YES]** verdict is an irreversible gate — before it stands, Ishay types the module name + `DoD` (not "yes"/"approve"). This is one of the two typed-echo gates (the other = applying a migration).
- The audit **never** runs `git merge`/`git push`/`gh pr create`. PR/CI/merge are post-merge items — N/A-at-audit, never a ❌ blocker.
- PR instructions are printed in plain Hebrew AND as a self-contained "🧩 prompt for Claude-in-Chrome" (iron rule 17); OAuth/secrets stay manual.

<!-- shared kernel — single line; the doctrine text lives ONLY in _shared/discipline.md (consolidated 24/07/2026, was duplicated in all five) -->
## Discipline (mandatory — shared doctrine)
Read **`.claude/skills/_shared/discipline.md`** first, before anything else in this skill — it is the single copy of the shared kernel (which itself opens by pointing to `~/.claude/CLAUDE.md` for the universal doctrine), plus the REG-IN-specific instantiation.
<!-- end shared kernel -->
