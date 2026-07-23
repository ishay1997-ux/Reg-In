---
name: module-build
description: REG-IN — continue building the active module from its live micro-guide. Load whenever Ishay wants to keep building: "תמשיך לבנות", "המשך בנייה", "בוא נעשה צעד K", "ממשיכים במודול", or pastes the continue-build prompt (⑥2) from a step guide. This skill routes to the module's micro-guide and enforces the build discipline; there is no template file — the micro-guide (docs/micro_guides/module-N.md) IS the plan. Not for opening a module (module-blueprint) or closing it (module-close).
---

# module-build — continue a REG-IN module build

The active module's `docs/micro_guides/module-N.md` is the approved plan and your memory — continue from its "Active step". This is normal build flow, NOT Plan Mode (iron rule 2): the micro-guide already IS the approved plan and its 🔻🤖/👤 stop-points are the control. Build directly; DB/RLS before UI.

## Pre-flight
1. **Rule 16 — one writing session at a time.** Unsure if another session is writing? Ask Ishay before editing.
2. **Rule 10 — mid-session merge check.** Run `git fetch origin`, then `git merge-base --is-ancestor HEAD origin/dev`. If the branch is already merged into `origin/dev`, STOP — don't pile commits on a dead branch; tell Ishay and offer a fresh branch from `dev`.
3. **Model.** Follow the "Model & effort per phase" table at the top of the micro-guide's §5 (default: Sonnet for build phases, Opus/Fable for DB/RLS and control phases). If the current model differs from what the active phase needs, say so before proceeding.

## Read order (rule 4, no memory)
`CLAUDE.md` → `STATUS.md` (which module is active) → `docs/micro_guides/module-N.md` (the whole thing: Live Status Header, step table, Decisions Ledger, §5 steps, §8 self-update protocol).

## Build loop (behaviour of ⑥2, anchored to the micro-guide + iron rules)
- Continue from the **Active step** in the status header.
- **Entering a new phase?** First sweep the Decisions Ledger for OPEN/nod-pending items anchored to this phase's steps and present them to Ishay for a consolidated ruling (P13 style) BEFORE the phase's first step (micro-guide §8(h)).
- **Each build-unit:** post the 🗣️ experience-brief (simple Hebrew: understanding-declaration invited for correction · planned validations · screen/mockup · every mockup-only or spec-silent detail flagged "מהמוקאפ / אפיון-שותק — לאישורך") and **wait for Ishay's approval before writing the unit's code** (a 👤 product-intent gate).
- **Verify every 🔻🤖 yourself** with a concrete mechanism + evidence (SQL count / unit / E2E / preview screenshot), report it, and continue. Mid-phase visual evidence is 🤖-with-screenshot, never a human wait.
- **Stop at every 👤 gate and at end-of-phase** (incl. the end-of-Phase-3 🎨 UX & functional review). **Before applying any migration:** the typed-echo gate (Ishay types the migration name — DB protocol); a plain approval is not sufficient to apply, and it is not pre-granted at an earlier step.
- **Update the micro-guide as you go** (iron rule 15): step transitions update the status header + step table in the same session; deviations get a "↳ as-built" note + a §9 line. The Stop hook blocks session end if `src/modules/NN_*/` changed without the guide being updated.
- **End of session:** run the CLAUDE.md end-of-session protocol (CLAUDE_CODE_LOG → STATUS; `CHANGELOG` was retired 23/07/2026) and explain to Ishay in plain Hebrew where you stopped and what's next.

## Size-gate for change requests (Ishay's standing request — he shouldn't have to estimate size himself)
On ANY non-trivial change request that arrives mid-build (design / feature / behaviour), classify OUT LOUD before building, per the CLAUDE.md triage rule (rule 1):
- **Small → build now:** data/tables/deps exist, it's in-spec, needed now, and it's a bounded change within this module's surface.
- **Big / out-of-place → stop:** it needs a blueprint round, belongs to a future module/step, is a §7 decision, touches another module's surface, or is gold-plating/premature. Say `בנה-עכשיו` / `דחה-ל-X` / `לא-נדרש-כי-Y` with a reasoned recommendation — **Ishay decides.** With the 07/08 M3 deadline, a non-blocking, non-spec request while the module is behind defaults to `דחה-ל-אחרי-19/09`.

## Council wiring
Real trade-off with two sensible product-affecting directions? **Offer** `council this` and wait for Ishay's approval — never on your own initiative. The council feeds the decision; the decision is his (rule 1).

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
