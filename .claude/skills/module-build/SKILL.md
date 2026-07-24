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
- **Write the test first (`superpowers:test-driven-development`)** for new business logic in `src/lib/` (iron rule 14) — the failing unit test before the implementation, not after. A test written after the code tends to confirm what was built rather than catch what was missed; this is especially load-bearing for pricing/Smart-Match formulas, where a wrong test-after can rubber-stamp a wrong calculation.
- **Verify every 🔻🤖 yourself** with a concrete mechanism + evidence (SQL count / unit / E2E / preview screenshot), report it, and continue. Mid-phase visual evidence is 🤖-with-screenshot, never a human wait.
- **Stop at every 👤 gate and at end-of-phase** (incl. the end-of-Phase-3 🎨 UX & functional review). **Before applying any migration:** the typed-echo gate (Ishay types the migration name — DB protocol); a plain approval is not sufficient to apply, and it is not pre-granted at an earlier step.
- **After a migration is applied, the DB protocol isn't done — finish the other half in the same session:** apply it via MCP `apply_migration` → verify it actually applied (MCP read) → update `docs/schema.sql` (Supabase SQL Editor → SQL → Snapshots → "Generate schema SQL" → paste in) → commit the migration file **and** `docs/schema.sql` together in one commit. A migration that reaches a PR without its `schema.sql` snapshot updated is not DB-protocol-compliant.
- **Update the micro-guide as you go** (iron rule 15): step transitions update the status header + step table in the same session; deviations get a "↳ as-built" note + a §9 line. The Stop hook blocks session end if `src/modules/NN_*/` changed without the guide being updated.
- **§8 is a checklist to RUN, not background reading.** The micro-guide's own §8 (already in the Read order above) is the SSOT for what a mid-build change ripples into — its (a)-(d)/(h) are restated verbatim there and (e)-(g) cite CLAUDE.md iron rules 13/15/16; don't duplicate any of it here. Concretely: the moment a step transition, a deviation, a new open question, an applied migration, or a change touching a future module actually happens, stop and match it to its §8 letter **right then** — not only when the guide is first read at session start, and not deferred to end-of-session.
- **End of session:** run the CLAUDE.md end-of-session protocol (CLAUDE_CODE_LOG → STATUS; `CHANGELOG` was retired 23/07/2026) and explain to Ishay in plain Hebrew where you stopped and what's next.

## Size-gate for change requests (Ishay's standing request — he shouldn't have to estimate size himself)
On ANY non-trivial change request that arrives mid-build (design / feature / behaviour), classify OUT LOUD before building, per the CLAUDE.md triage rule (rule 1):
- **Small → build now:** data/tables/deps exist, it's in-spec, needed now, and it's a bounded change within this module's surface.
- **Big / out-of-place → stop:** it needs a blueprint round, belongs to a future module/step, is a §7 decision, touches another module's surface, or is gold-plating/premature. Say `בנה-עכשיו` / `דחה-ל-X` / `לא-נדרש-כי-Y` with a reasoned recommendation — **Ishay decides.** Check `STATUS.md` for the active module's current deadline; a non-blocking, non-spec request while the module is behind schedule defaults to `דחה-ל-אחרי-<the deadline>` — never a hardcoded date, since it changes module to module.

## Council wiring
Real trade-off with two sensible product-affecting directions? **Offer** `council this` and wait for Ishay's approval — never on your own initiative. The council feeds the decision; the decision is his (rule 1).

<!-- shared kernel — single line; the doctrine text lives ONLY in _shared/discipline.md (consolidated 24/07/2026, was duplicated in all five) -->
## Discipline (mandatory — shared doctrine)
Read **`.claude/skills/_shared/discipline.md`** first, before anything else in this skill — it is the single copy of the shared kernel (which itself opens by pointing to `~/.claude/CLAUDE.md` for the universal doctrine), plus the REG-IN-specific instantiation.
<!-- end shared kernel -->
