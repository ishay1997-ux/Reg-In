---
name: module-blueprint
description: REG-IN — open a new module and produce its micro-guide blueprint. Load whenever Ishay starts a module: "פתח מודול N", "פתיחת מודול", "בוא נעשה בלופרינט", "מתחילים מודול חדש", or pastes the opening prompt (⑥1) from a step guide (docs/guides/modules/module_NN_*.md). This skill is a thin routing+discipline layer; the full blueprint procedure lives verbatim in template.md beside this file — read and execute it. Not for continuing an in-progress build (that is module-build) or closing (module-close).
---

# module-blueprint — open a REG-IN module

You are Lead Software Architect opening a module. Your deliverable this turn is the module's **micro-guide** (`docs/micro_guides/module-N.md`) — the machine-actionable blueprint a future zero-memory session will execute. **No code is written in this turn.** Plan Mode applies (iron rule 2): present everything in chat for approval; write the guide to disk only after Ishay approves.

## Pre-flight (do this before anything else)
1. **Rule 16 — one writing session at a time.** If you are unsure whether another Claude session is writing code/docs, ask Ishay before touching files. A parallel read/plan session is fine; two writers are not.
2. **Branch.** Confirm you are on the module's feature branch `ishay/module-N-<topic>`, freshly cut from `dev`. Run `git fetch origin` and verify `dev` is current before branching. Never blueprint on `main`/`dev`.
3. **Model.** Blueprinting is high-effort thinking (spec reading, DB design, RLS). Recommended: **Opus/Fable, high effort**. If the session is on a lighter model, say so to Ishay in Hebrew before proceeding — don't silently blueprint on Sonnet.

## Read order (ground everything — rule 4, no memory)
1. `CLAUDE.md` (iron rules) → `STATUS.md` (current state, active step).
2. **The step guide `docs/guides/modules/module_NN_*.md` — its section ⑥1 is THIS module's context packet:** the template parameters (MODULE_NUMBER/NAME/BRANCH/RELEVANT_SECTIONS), the ruled §7 items, the scope decisions, the acceptance targets. Treat ⑥1 as if it were pasted here — it carries the per-module context this generic skill cannot.
3. 🔴 **`docs/specs/module_NN_*/` — the module's APPROVED SPEC, and it outranks C5/C6 on everything it covers.** ‏`NN` is **zero-padded** (module 4 ⇒ `module_04_*`) — **resolve it by listing `docs/specs/`, never by string-substitution.** Start at its `spec.md`, which carries its own numbered reading list. **Folder genuinely absent ⇒ STOP and tell Ishay** — the module has no Discovery output, and the 🎤 PM interview then applies. *(⚠️ **Added 08/08/2026:** `docs/specs` appeared **zero** times in this file, which is the one that loads first and routes everything else. It worked only because the module-4 step guide happened to carry the pointer — per-module luck, not a mechanism.)*
4. Then everything ⑥1 and the template tell you to read: `docs/PROJECT_MASTER.md` (§7 registry + §6 debt), `docs/schema.sql`, `docs/db_roadmap.md`, `docs/architecture_and_qa_roadmap.md`, the current codebase, and `docs/micro_guides/module-1.md` as the format exemplar.

## Execute the template verbatim
Read **`.claude/skills/module-blueprint/template.md`** (beside this file) and perform it exactly as written. It is the SSOT for the whole procedure: the plain-Hebrew capabilities summary, the sequence/dependency + integration-impact assessment, the 🗡️ DB Design Challenge, the 🛑/⏳ triage, the 🎤 PM Interview, the fresh-context blueprint review, and the 9-section micro-guide structure. Do not restate or paraphrase any of it here — read it and follow it.

## Council wiring (root `CLAUDE.md` → `🧰 ארגז הכלים — מדיניות שיקול-דעת`)
<!-- Citation fixed 08/08/2026: this pointed at a CLAUDE.md heading "כלי-עזר להחלטות" that was deleted in the 28/07 pruning (grep: 0 live hits, survives only in docs/archive/). The RULE is intact under the heading above — "llm-council … מציעים וממתינים לאישור, לעולם לא מריצים ביוזמה" — and it is a toolbox policy, not a numbered iron rule. -->

If a real trade-off surfaces (a contested §7 ruling, a DB-design fork, a pricing/Smart-Match formula), **offer** Ishay `council this` and wait for his approval before running it. Never run the council on your own initiative. The council feeds the decision; the decision itself is Ishay's (rule 1).

<!-- shared kernel — single line; the doctrine text lives ONLY in _shared/discipline.md (consolidated 24/07/2026, was duplicated in all five) -->
## Discipline (mandatory — shared doctrine)
Read **`.claude/skills/_shared/discipline.md`** first, before anything else in this skill — it is the single copy of the shared kernel (which itself opens by pointing to `~/.claude/CLAUDE.md` for the universal doctrine), plus the REG-IN-specific instantiation.
<!-- end shared kernel -->
