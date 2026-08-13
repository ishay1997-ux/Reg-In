---
name: module-discovery
description: REG-IN — run a module's Discovery end-to-end and produce its approved spec set. Opens the product-definition phase of a module ("אנחנו עושים Discovery מלא למודול N" · "פתח דיסקברי למודול N" · "בוא נאפיין את מודול N" · the ⑥0 block of a step guide). Produces `docs/specs/module_NN_*/` — processes-approved.md · world-sources.md · spec.md · discovery-log.md · and, when the module has surfaces, screens-approved.md + approved mockups — together with the write-backs to `PROJECT_MASTER §6`/`§7` and `db_roadmap.md` that other modules actually read. This file is a thin routing layer; the full procedure lives verbatim in `template.md` beside it — read and execute it. NOT for building (module-build), opening a blueprint (module-blueprint), closing a module (module-close), or ruling §7 items outside a Discovery (section7-rulings).
---

# module-discovery — define a REG-IN module before anything is built

> 🟨 **Candidate under test.** The live skill is `.claude/skills/module-discovery/`. Both exist on
> purpose; this one is deliberately not model-invocable so the two cannot fire at once. **If Ishay is
> comparing them, say which one you loaded in your first line.**

*(Rewritten 13/08/2026 from the live `module-discovery` skill, which itself replaced the retired
procedure archived at `docs/archive/prompt_module_discovery_retired_2026-08-13.md`. Built out of one
module's Discovery — and equally out of the after-the-fact repairs that session needed. **Re-measure any
census you find quoted inside; several were corrected twice in one day.**)*

You are running a **product-definition** session. **No product code · no blueprint · no writes to the
DB · no migrations.** Your deliverable is the module's approved spec set, and it becomes the **sole
source of truth for the build**, replacing the frozen spec.

## Discipline (mandatory — shared doctrine, read first)
Read **`.claude/skills/_shared/discipline.md`** before anything else here. It is the single copy of the
shared kernel — it opens by pointing at `~/.claude/CLAUDE.md` for the universal doctrine, and it lists
the other `_shared/` files. 🔴 **`_shared/*` has no frontmatter and never auto-loads**; it is reachable
only through this pointer. Losing this line takes the whole kernel dark.
➕ **And two of them are load-bearing here but are not on that list, or are easy to skip — read them:**
**`_shared/ishay-calibration.md`** *(its §1–§6 are calibration from a Discovery session — this path is
exactly its scope)* and **`_shared/failure-modes.md`** *(measured: no file in `_shared/` points at it)*.
**Then read root `CLAUDE.md` and `docs/CLAUDE.md`** — the iron rules, Plan Mode, and the hooks that will
block the end of this session. `template.md` §13 lists which of them a Discovery collides with.

## Pre-flight
1. **Rule 16 — one writing session at a time.** Unsure whether another session is writing? Ask Ishay
   before touching files. *(`_shared/parallel-sessions.md`.)*
2. **Model.** Long conversation, product judgement, cross-document reading ⇒ **Opus, high effort.**
   **Sonnet will execute the stages and miss the judgement**, and that is the one thing that cannot be
   repaired afterwards. On a lighter model, say so in Hebrew before proceeding.
3. **Resume from disk, not from narration** — Stage 0's first command is **`ls docs/specs/`**, and you
   read the folder name off the listing (it is zero-padded). It outranks whatever `STATUS.md` or the log
   claim.

## Execute the template verbatim
Read **`.claude/skills/module-discovery/template.md`** (beside this file) and perform it exactly
as written. It is the SSOT for the whole procedure: the archetype classification and the outputs
matrix, the three sweeps, the requirements ledger, the process and surface cards, the six
cross-checks, the fresh-context reviewers, the write-back, and the harvest ledger. **Do not restate
or paraphrase any of it here — read it and follow it.**

🚫 **Do not load `module-blueprint` / `module-build` / `module-close`.** Their triggers are similar
enough to fire by accident and they lead to an entirely different flow.
