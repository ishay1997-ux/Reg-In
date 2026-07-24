# Shared discipline doctrine — read by all five repo-local REG-IN skills

> **SSOT split (23/07/2026, after Ishay wrote `~/.claude/CLAUDE.md`):** the *universal*
> doctrine — language, talk style, PM authority, citation/resume discipline — now lives
> in **`~/.claude/CLAUDE.md`** (cross-project, loads every session regardless of repo).
> Read it first; it applies here unchanged. **This file now holds only the REG-IN-specific
> instantiation on top of it** — which file/tool to check for which kind of claim, and
> what "resume from disk" concretely means in this repo. (History: this file originally WAS
> the doctrine in full, extracted from ×3 inline duplication on 23/07 — see the Session Log.
> The doctrine was then generalized into the global file the same day, on Ishay's own
> initiative, and this file narrowed to the instantiation layer — the sync tax of
> maintaining the general principle in two places was paid once already; no reason to pay
> it a third time. `feature-acceptance` — originally the sixth skill sharing this kernel —
> moved OUT of the repo entirely the same night, to Ishay's global `~/.claude/skills/`,
> being project-agnostic; it now carries its own self-contained discipline section instead
> of pointing here. **Consolidated further 24/07/2026 (skill-creator structural review):**
> the five repo-local skills used to each carry their own copy of the kernel paragraph
> below, with a comment asking whoever edits it to keep all five + this file in sync by
> hand — a real drift risk with no single source of truth. Now each of the five carries
> only a one-line pointer to this file; the kernel paragraph itself lives HERE ONCE.)

## The shared kernel (every repo-local skill reads this first)
Read **`~/.claude/CLAUDE.md`** (loads every session, every project) for the universal doctrine: plain-Hebrew communication · Ishay is the product manager — understanding-declarations invited for correction, product/design decisions are his · no citation without a same-turn check · resume from disk, not from narration. Read and apply it. Then continue reading the rest of this file for the REG-IN-specific instantiation below — which file/tool verifies which kind of claim, and what "resume from disk" concretely means in this repo.

## REG-IN's citation-check targets (instantiates the global "no citation without a same-turn check")

| Claim | Where to check, in THIS repo |
|---|---|
| "item N in §7" / "it's written in X" | open `docs/PROJECT_MASTER.md`, find the section, confirm number and scope (grep/read) |
| "already done" / "still open" | full read/grep of the file — not tail, not partial offset, not memory |
| "merged" / "it's on dev" | fresh `git fetch origin` + `git merge-base --is-ancestor` (iron rule 10) — a local branch lies |
| "column/policy/index exists" | live query via Supabase MCP (read-only) |

Prefer a grep anchor (function name / string) over a line number — line numbers rot between writing and executing.

**Resume-after-interruption, in THIS repo (the 23/07 migration-5 incident):** on any resume ("המשך מאיפה שעצרת", a fresh session picking up mid-flow, continuing after a visible cut) — re-derive position from disk before advancing: `git status` + the active micro-guide's status header/step table + the current step's own verification command. A step whose verification hasn't passed is NOT done, no matter what the previous turn narrated; the typical loss is a half-step (file saved, its doc-ripple lost) — finish the missing half before starting the next step. *(What actually happened: "saving migration 5 + updating docs" was cut mid-turn — the file survived, the db_roadmap update didn't, and the resumed turn jumped to step 1.6; Ishay caught it. The general principle this taught is now stated in the global file — this paragraph is just REG-IN's answer to "what counts as disk here.")*

## How to talk to Ishay
Fully covered by `~/.claude/CLAUDE.md` — no REG-IN-specific override remains (the old "rulings-rounds recommendation-first" carve-out is now the global default too). The one place the style becomes a concrete *procedure* rather than a rule of thumb is the batching mechanics (3–4 per round, "מספיק להיום", recommendation-first, reality filter before designing for an edge case) — see `section7-rulings` (repo-local) and `feature-acceptance` (now global, `~/.claude/skills/`), which operationalize it end-to-end.
