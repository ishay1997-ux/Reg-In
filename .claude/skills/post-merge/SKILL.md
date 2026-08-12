---
name: post-merge
description: REG-IN — post-merge verification and doc flip. Load whenever Ishay reports a merge/PR event: "מיזגתי", "עשיתי merge", "ה-PR אושר", "מחקתי את הענף", or pastes a PR link/summary after merging. Verifies the merge with FRESH git evidence (never memory), flips the STATUS row with the evidence cited, marks dead branches, and prints Ishay's next step. Never merges, pushes, or opens a PR itself. Not for running the closing audit (module-close) — this runs AFTER Ishay merged.
---

# post-merge — absorb a merge event with evidence, flip the docs, point forward

**Why this skill exists:** the PR-confusion incident — PR facts written from memory (PR #2 vs #3 mixed up) survived in STATUS until Ishay caught them; stale local git misleads silently. CLAUDE.md's PR-checklist rule is binding here: **a PR/merge/branch fact is written ONLY with same-session git output quoted** — no fresh citation, no write.

## Pre-flight
**Rule 16 — one writing session at a time.** This skill writes to `STATUS.md` and `CLAUDE_CODE_LOG.md` — the same shared files `module-build`/`module-close` write to. Unsure if another session is writing right now? Ask Ishay first, before touching either file.

## Steps
1. **Ingest Ishay's report as a first-class event** (CLAUDE.md evidence discipline): quote his exact words in the journal entry at absorption, BEFORE interpreting. Human testimony about an external system outranks stale local git — but both get reconciled next.
2. **Fresh evidence, same turn:** `git fetch origin` → `git log --oneline origin/dev -3` → `git merge-base --is-ancestor <branch> origin/dev` (+ `gh pr view <N>` when the PR number is known). Quote the outputs verbatim. If git contradicts his report → fetch again, then surface the discrepancy to him — never silently pick a side. ⚠️ **Mandatory caveat before trusting the result: the check also succeeds on a freshly-cut branch with zero commits** — the discriminator is `git log origin/dev..HEAD --oneline` (empty ⇒ fresh branch, not merged). Full wording: iron rule 10 in root `CLAUDE.md`.
3. **STATUS flip:** before flipping, check the row was actually in "ממתין ל-PR/merge" (module-close's closing-audit persistence step sets this) — that's the evidence the closing audit ran. If the row shows something else (still mid-build, or no closing-audit trace), STOP and tell Ishay: this branch may be merging without ever having gone through `module-close`. Otherwise flip to ✅ merged, with PR number + the cited evidence line (e.g. `` `state: MERGED`, checks `SUCCESS` `` — match the existing rows' style). No other STATUS surgery beyond what the merge changed.
3ב. 🔴 **The merged module's OWN micro-guide header — flip it in the same turn** *(added 12/08/2026, Ishay's ruling, after `regin-docs-sync` measured the gap)*. `docs/micro_guides/module-N.md`'s Live Status Header carries its own `Status` and `Active step` rows, and **this skill never touched them** — so a module stayed "🔒 Closed — awaiting PR/merge" in its own guide long after it shipped. **Measured, twice, in one run:** `module-3.md` still said *"CLOSED 05/08/2026 — awaiting PR/merge"* **a week after** PR #10 landed (`792456f`), and `module-2.md` said the same after PR #6 (`e69383a`). **What to write:** `✅ MERGED to dev DD/MM/YYYY HH:MM — PR #X, merge commit <sha>`, keeping the original close line beside it, and clear the `Active step` row of any "remaining action: Ishay's PR". ⚠️ **And cite the evidence you already have from step 2 — `git merge-base --is-ancestor <sha> origin/dev` — not the fact that Ishay said so;** the guide is read by memoryless sessions, and "the human told me" does not survive.
4. **Dead-branch marking (iron rule 10):** the merged branch is history — never stack commits on it. Record it as merged-and-dead in STATUS/journal; offer (not execute unprompted) local branch deletion.
5. **Next step for Ishay, in Hebrew:** one concrete line derived from STATUS/roadmap — "הצעד הבא שלך: …" (e.g. open the next module with "פתח מודול N", or pull `dev` fresh before cutting the next branch).
6. **Milestone / doc-heavy merges:** recommend running `regin-docs-sync` (Run now — Ishay's click) as the cross-file consistency pass (rule 13(ז)).
7. **End-of-session protocol** (CLAUDE_CODE_LOG entry with the quoted evidence → STATUS "עודכן לאחרונה").

## Hard limits
Never `git merge` / `git push` / `gh pr merge` / `gh pr create` — the merge belongs to Ishay. Never rewrite dated journal entries; a wrong past claim gets a dated correction entry, not an edit.

<!-- shared kernel — single line; the doctrine text lives ONLY in _shared/discipline.md (consolidated 24/07/2026, was duplicated in all five) -->
## Discipline (mandatory — shared doctrine)
Read **`.claude/skills/_shared/discipline.md`** first, before anything else in this skill — it is the single copy of the shared kernel (which itself opens by pointing to `~/.claude/CLAUDE.md` for the universal doctrine), plus the REG-IN-specific instantiation.
<!-- end shared kernel -->
Skill-specific instance: this whole skill is essentially the doctrine's "merged / it's on dev" check turned into a procedure; if the flow is interrupted mid-way, re-derive from `git status`/`git log` + STATUS, not from the transcript.
