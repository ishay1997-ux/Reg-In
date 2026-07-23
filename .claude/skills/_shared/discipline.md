# Shared discipline doctrine — read by ALL six REG-IN skills

> **SSOT (created 23/07/2026, Ishay's suggestion):** this file is the single home of the discipline
> doctrine shared by `module-blueprint` / `module-build` / `module-close` / `section7-rulings` /
> `post-merge` / `feature-acceptance`. Each skill carries only a short identical kernel pointing here;
> skill-specific discipline instances stay in each skill. A change to the doctrine is made HERE once —
> not in six places. (History: the blocks lived inline ×3 in the module skills; the sync tax was paid
> in practice on 23/07 — the resume rule required three synchronized edits — and extraction won.)
> This file is not itself a skill (no SKILL.md, `_shared/` is not a skill directory) — it is read
> on demand by the skills that cite it.

## Block A — No citation without a same-turn check (execution instance of iron rule 4 + evidence discipline)
The 710 lesson: four clerical errors — wrong section cite, item attributed to the wrong place, "already done" on a thing still open, stale branch state — all from writing from memory. A wrong citation is dangerous precisely because it lends unearned authority. Before you write any of these claims, run the check FIRST, same turn, then write:

| Claim | Required check |
|---|---|
| "item N in §7" / "it's written in X" | open the file, find the section, confirm number and scope (grep/read) |
| "already done" / "still open" | full read/grep of the file — not tail, not partial offset, not memory |
| "merged" / "it's on dev" | fresh `git fetch origin` + `git merge-base --is-ancestor` (rule 10) — a local branch lies |
| "column/policy/index exists" | live query via Supabase MCP (read-only) |

Can't check right now → write **"unverified"**, never as fact. Mark certainty in every output: "verified (file:line / query)" ≠ "pattern worth checking" — never let the two look alike. Prefer a grep anchor (function name / string) over a line number; line numbers rot between writing and executing.

**Resume-after-interruption rule (the 23/07 migration-5 incident):** a turn can die between announcing an action and doing it (usage limit, crash, context compact) — **narration is intent, not evidence**, and this trap fires *silently*: the resumed turn doesn't write a false "already done" claim, it just *acts* as if the last announced action happened. Therefore, on ANY resume — "המשך מאיפה שעצרת", a fresh session picking up mid-flow, or continuing after a visible cut — do NOT advance from the transcript's last narration. Re-derive position from disk first: `git status` + the micro-guide's status header/step table + the current step's own verification command. A step whose verification hasn't passed is NOT done, no matter what the previous turn said; the typical loss is a half-step (file saved, its doc-ripple lost) — finish the missing half before starting the next step. *(Real incident: "saving migration 5 + updating docs" was cut mid-turn — the file survived, the db_roadmap update didn't, and the resumed turn jumped to step 1.6; Ishay caught it.)*

## Block B — How to talk to Ishay (product manager)
- Think in English; **every word to Ishay in plain Hebrew.** No jargon; a needed technical term gets a parenthetical explanation.
- Ishay is the **product manager** — only he knows how the business process actually works in the field. State your understanding as an **understanding-declaration invited for correction** ("this is how I understood it — correct me"), never as a settled fact.
- Every decision question (rule 1 — §7 and product/design decisions are Ishay's, never yours) is presented as: background (why it comes up now, what it blocks) · what the ruling means going forward · each option with its concrete consequence · a reasoned recommendation. Recommend — don't lay out a bare menu. **Multi-item rulings rounds are the exception (Ishay's ruling 23/07):** recommendation-first, one-line background, full detail only on request ("פרט לי") — batches of 3–4, "מספיק להיום" always available (see `section7-rulings`).
- In a planning/interview turn, always close with: **"על מה לא שאלתי ושווה שתספר לי?"**
- "Not by force": no findings = say "אין הערות". An invented finding is worse than a blank page.
