---
name: post-merge
description: REG-IN — post-merge verification and doc flip. Load whenever Ishay reports a merge/PR event: "מיזגתי", "עשיתי merge", "ה-PR אושר", "מחקתי את הענף", or pastes a PR link/summary after merging. Verifies the merge with FRESH git evidence (never memory), flips the STATUS row with the evidence cited, marks dead branches, and prints Ishay's next step. Never merges, pushes, or opens a PR itself. Not for running the closing audit (module-close) — this runs AFTER Ishay merged.
---

# post-merge — absorb a merge event with evidence, flip the docs, point forward

**Why this skill exists:** the PR-confusion incident — PR facts written from memory (PR #2 vs #3 mixed up) survived in STATUS until Ishay caught them; stale local git misleads silently. CLAUDE.md's PR-checklist rule is binding here: **a PR/merge/branch fact is written ONLY with same-session git output quoted** — no fresh citation, no write.

## Steps
1. **Ingest Ishay's report as a first-class event** (CLAUDE.md evidence discipline): quote his exact words in the journal entry at absorption, BEFORE interpreting. Human testimony about an external system outranks stale local git — but both get reconciled next.
2. **Fresh evidence, same turn:** `git fetch origin` → `git log --oneline origin/dev -3` → `git merge-base --is-ancestor <branch> origin/dev` (+ `gh pr view <N>` when the PR number is known). Quote the outputs verbatim. If git contradicts his report → fetch again, then surface the discrepancy to him — never silently pick a side.
3. **STATUS flip:** module/track row → ✅ merged, with PR number + the cited evidence line (e.g. `` `state: MERGED`, checks `SUCCESS` `` — match the existing rows' style). No other STATUS surgery beyond what the merge changed.
4. **Dead-branch marking (iron rule 10):** the merged branch is history — never stack commits on it. Record it as merged-and-dead in STATUS/journal; offer (not execute unprompted) local branch deletion.
5. **Next step for Ishay, in Hebrew:** one concrete line derived from STATUS/roadmap — "הצעד הבא שלך: …" (e.g. open the next module with "פתח מודול N", or pull `dev` fresh before cutting the next branch).
6. **Milestone / doc-heavy merges:** recommend running `regin-docs-sync` (Run now — Ishay's click) as the cross-file consistency pass (rule 13(ז)).
7. **End-of-session protocol** (CLAUDE_CODE_LOG entry with the quoted evidence → STATUS "עודכן לאחרונה").

## Hard limits
Never `git merge` / `git push` / `gh pr merge` / `gh pr create` — the merge belongs to Ishay. Never rewrite dated journal entries; a wrong past claim gets a dated correction entry, not an edit.

<!-- shared kernel — identical in all six skills; a change here updates all six + _shared/discipline.md in the same session -->
## Discipline (mandatory — shared doctrine)
Read **`.claude/skills/_shared/discipline.md`** and apply it as part of this skill — it is the single source of the shared doctrine: **no citation without a same-turn check** (§7/file/merge/DB claims verified before written) · **resume-after-interruption** (narration is intent, not evidence — re-derive position from disk) · **how to talk to Ishay** (plain Hebrew, understanding-declarations invited for correction, reasoned recommendations).
<!-- end shared kernel -->
Skill-specific instance: this whole skill is essentially the doctrine's "merged / it's on dev" check turned into a procedure; if the flow is interrupted mid-way, re-derive from `git status`/`git log` + STATUS, not from the transcript.
