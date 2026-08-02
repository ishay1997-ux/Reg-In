---
name: module-build
description: REG-IN — continue building the active module from its live micro-guide. Load whenever Ishay wants to keep building: "תמשיך לבנות", "המשך בנייה", "בוא נעשה צעד K", "ממשיכים במודול", or pastes the continue-build prompt (⑥2) from a step guide. This skill routes to the module's micro-guide and enforces the build discipline; there is no template file — the micro-guide (docs/micro_guides/module-N.md) IS the plan. Not for opening a module (module-blueprint) or closing it (module-close).
---

# module-build — continue a REG-IN module build

The active module's `docs/micro_guides/module-N.md` is the approved plan and your memory — continue from its "Active step". This is normal build flow, NOT Plan Mode (iron rule 2): the micro-guide already IS the approved plan and its 🔻🤖/👤 stop-points are the control. Build directly; DB/RLS before UI.

## ⚡ When a manager session exists (Ishay said so, or your prompt names one)

The approval addressee for *technical* gates changes — wired 01/08/2026 per Ishay's
replacement mandate (the manager answers in his place what he delegated):

- **Send step-plans and 🗣️ briefs to the manager session** via `send_message` (load
  `ToolSearch: mcp__ccd_session_mgmt` — it is deferred, not auto-available; the manager
  normally contacts you first, else find it with `list_sessions`). It verifies your
  claims against the repo itself and answers approve / fix / stop. Pre-empt its
  standing probes in the plan: *מה עוד לא בדקת* · *מה הבליינד-ספוט — על מה לא חשבתי*
  · world-standard fit — and include a time estimate (it feeds the manager's silence
  threshold).
- **The contract — three checkpoints, so nothing falls between the chairs:** (1) plan
  before code · (2) blocked or unsure — including "מה ישי היה עונה?" questions, which
  the manager answers from recorded precedent or escalates to him once · (3) done,
  before your closing report. **Product questions go to the manager, never to Ishay
  directly.** Going quiet is the failure mode — the contract is yours.
- **What stays Ishay's, never absorbed** (the manager routes it, by default through
  its own chat): mockup/visual approval — the 🔒 Plan-Mode gate below still holds, and
  approval arrives as Ishay's word relayed by the manager (or given directly in your
  window; both binding) · typed-echo migration application · secrets/OAuth · DoD.
- **No manager reply within a reasonable time → stop and ask Ishay directly.**
  With no manager session, everything below is unchanged.
- 🔴 **The gap protocol — never silent-fill.** The blueprint is not always detailed enough, and the
  failure mode is guessing quietly (Ishay's own words, 01/08: *"הבלופרינט לא תמיד מפורט מספיק עבורו
  ואז הוא מנחש לפעמים"*). A **technical** gap ⇒ decide, mark it `הכרעתי, הפיך`, and report it. A gap
  with any **product flavour** ⇒ a question to the manager. **Filling it silently is the one
  unacceptable option** — it turns a guess into an unreviewable fact.
- 🆕 🧭 **A clearly-written instruction is not a confirmed one.** The gap protocol above covers a spot
  that is **under-specified**; it produces no signal at all for one that is **perfectly clear and was
  never confirmed with Ishay** — you will simply build it well and wrong. ⇒ **An instruction that
  encodes process or product (timing · who is notified · what is permitted · what a status means ·
  what happens when X) and cites no source ⇒ ask the manager whether Ishay confirmed it**, before
  building. *(Ishay, 02/08: the spec itself can be wrong, and the save⇄send gap confused nobody —
  everyone understood it perfectly and built the wrong thing.)*
- **Tag every claim in your reports** as `אומת-על-ידי` (you measured it) or `דווח-לי` (someone told
  you). It extends the manager's own מדדתי/על-דיווחו split downward, and it is what lets a reader
  know where to dig.
- 🔴 **Two standing questions you owe the manager, aimed at his prompt — not at your plan:**
  **① אילו מוקשים המנהל לא זיהה? ② מה המנהל לא בדק לפני שכתב לך את זה?** These force you to
  investigate the prompt instead of receiving it. **"הכל בסדר" without having looked is the failure
  they exist to prevent** — a prompt is often built substantially on your own earlier reports, so its
  blind spots are yours too.

## Pre-flight
0. 🔴 **Read `docs/current_manager.md`.** If a manager is listed there, **the ⚡ contract below applies —
   even if nobody told you a manager exists.** *(Before this line the ⚡ section was conditional on
   "Ishay said so, or your prompt names one" — so a session started with a bare trigger built with no
   plan gate and routed everything straight to Ishay.)* The file also carries the manager's **exact
   session name**, which changes at every handover — never hard-code it from a prompt.
1. **Rule 16 — one writing session at a time.** Unsure if another session is writing? Ask Ishay before editing.
2. **Rule 10 — mid-session merge check.** Run `git fetch origin`, then `git merge-base --is-ancestor HEAD origin/dev`. If the branch is already merged into `origin/dev`, STOP — don't pile commits on a dead branch; tell Ishay and offer a fresh branch from `dev`.
3. **Model.** Follow the "Model & effort per phase" table at the top of the micro-guide's §5 (default: Sonnet for build phases, Opus/Fable for DB/RLS and control phases). If the current model differs from what the active phase needs, say so before proceeding.

## Read order (rule 4, no memory)
`CLAUDE.md` → `STATUS.md` (which module is active) → `docs/micro_guides/module-N.md` (the whole thing: Live Status Header, step table, Decisions Ledger, §5 steps, §8 self-update protocol).

## Build loop (behaviour of ⑥2, anchored to the micro-guide + iron rules)
- Continue from the **Active step** in the status header.
- **Entering a new phase?** First sweep the Decisions Ledger for OPEN/nod-pending items anchored to this phase's steps and get a consolidated ruling BEFORE the phase's first step (micro-guide §8(h)). ⚠️ **When a manager session exists, that sweep goes to the MANAGER, not directly to Ishay** — this is the same rule as the ⚡ section above ("product questions go to the manager, never to Ishay directly"), and the two used to contradict each other here. The manager batches, pre-chews, and answers from recorded precedent what he can; only what genuinely needs Ishay reaches him.
- **Each build-unit:** post the 🗣️ experience-brief (simple Hebrew: understanding-declaration invited for correction · planned validations · screen/mockup · every mockup-only or spec-silent detail flagged "מהמוקאפ / אפיון-שותק — לאישורך") and **wait for Ishay's approval before writing the unit's code** (a 👤 product-intent gate).
- **🎯 The brief MUST end with "מה ייחשב עובד" — 3–5 Hebrew sentences, approved together with the mockup (added 30/07/2026).** Each sentence states **one outcome the user can observe after acting**, with **real values from the real data**. Verification is then written against THIS list, never against my memory of what I built — a test written by the same mind that wrote the code inherits its blind spots.
  ⚠️ **Two failure modes, and the second is the likelier one:**
  **(a) Naming a control instead of an outcome.** "יש כפתור X" / "המסך נטען" describe what I built, so they pass while the feature is broken.
  **(b) Vague sentences that satisfy the rule on paper.** "המסך עובד", "הסינון תקין" — a list like that is worse than no list, because it looks done. **The real-values requirement is what prevents this**; a sentence with no concrete number or string is not finished.
  **What it REPLACES (F1):** inventing the verification list after the fact. Not an extra gate — the same gate, written earlier.
  📎 The incident that produced this rule is recorded once, in `docs/micro_guides/module-3.md` §9 (30/07/2026) — **not duplicated here**, because this file is re-read on every build turn of every module while §9 is read only by module 3. **For anything visual, the default is a live HTML mockup with his real data, not a verbal screen description** (added 28/07/2026) — Claude reads structure from markup, Ishay reacts to a picture, and both are better served than by prose. A written description is the fallback when the unit has no visual surface.
- **🔒 A unit with a 🗣️ mockup is built in Plan Mode until Ishay approves (added 29/07/2026 — after this gate was breached).** The rule above already existed and was still broken: mid-mockup-iteration a file under `src/` was edited before approval, and **Ishay is the one who caught it**. Text did not hold, so the enforcement moves out of Claude's judgement and into the tool layer: **enter Plan Mode before posting the 🗣️ brief, and leave it only after Ishay's explicit approval.** In Plan Mode the harness itself refuses file edits — a lapse becomes impossible rather than unlikely. Say so when posting the brief ("אני במצב תכנון — לא ייכתב קוד עד שתאשר"), so Ishay can see the guarantee rather than trust a promise. ⚠️ **Do not weaken this into a self-check**: any marker or hook whose state Claude itself controls is a reminder, not a wall. *(Refines iron rule 2, which exempts routine building from Plan Mode — the exemption assumes an already-approved plan, and a 🗣️ unit is precisely the case where approval does not yet exist. F1: this addition removes the reliance on Claude's discipline for the 🗣️ gate.)*
- **Write the test first** for new business logic in `src/lib/` (iron rule 14) — write the unit test, watch it fail for the right reason, then implement until it passes. Not after. A test written after the code tends to confirm what was built rather than catch what was missed; this is especially load-bearing for pricing/Smart-Match formulas, where a wrong test-after can rubber-stamp a wrong calculation.
- **Verify every 🔻🤖 yourself** with a concrete mechanism + evidence (SQL count / unit / E2E / preview screenshot), report it, and continue. Mid-phase visual evidence is 🤖-with-screenshot, never a human wait.
- **Stop at every 👤 gate and at end-of-phase** (incl. the end-of-Phase-3 🎨 UX & functional review). **Before applying any migration:** the typed-echo gate (Ishay types the migration name — DB protocol); a plain approval is not sufficient to apply, and it is not pre-granted at an earlier step.
- **After a migration is applied, the DB protocol isn't done — finish the other half in the same session:** apply it via MCP `apply_migration` → verify it actually applied (MCP read) → update `docs/schema.sql` (Supabase SQL Editor → SQL → Snapshots → "Generate schema SQL" → paste in) → commit the migration file **and** `docs/schema.sql` together in one commit. A migration that reaches a PR without its `schema.sql` snapshot updated is not DB-protocol-compliant.
- **Update the micro-guide as you go** (iron rule 15): step transitions update the status header + step table in the same session; deviations get a "↳ as-built" note + a §9 line. The Stop hook blocks session end if `src/modules/NN_*/` changed without the guide being updated.
- **§8 is a checklist to RUN, not background reading.** The micro-guide's own §8 (already in the Read order above) is the SSOT for what a mid-build change ripples into — its (a)-(d)/(h) are restated verbatim there and (e)-(g) cite CLAUDE.md iron rules 13/15/16; don't duplicate any of it here. Concretely: the moment a step transition, a deviation, a new open question, an applied migration, or a change touching a future module actually happens, stop and match it to its §8 letter **right then** — not only when the guide is first read at session start, and not deferred to end-of-session.
- **Turn cap on fix loops (added 28/07/2026):** when a verification fails, you get **3 attempts** to fix it. After the third, STOP — report to Ishay in plain Hebrew: what fails, what you tried, and your best hypothesis. Do not keep iterating; a fourth blind attempt has never been the one that worked, and the cost is real.
- **Closing a phase? Compact it** (micro-guide §8(i)): replace the finished phase's step-by-step instructions with a done-table (what landed + the evidence) plus a carry-forward note. Archive the pre-compaction copy under `docs/archive/`. Never compact the active phase, §9, or the Ledger. **Why:** this guide is read in full on every "תמשיך לבנות" turn — an uncompacted guide taxes every future turn of the module.
- **End of session:** run the CLAUDE.md end-of-session protocol (this guide → CLAUDE_CODE_LOG → STATUS; `CHANGELOG` was retired 23/07/2026) and explain to Ishay in plain Hebrew where you stopped and what's next.

## Size-gate for change requests (Ishay's standing request — he shouldn't have to estimate size himself)
On ANY non-trivial change request that arrives mid-build (design / feature / behaviour), classify OUT LOUD before building, per the CLAUDE.md triage rule (rule 1):
- **Small → build now:** data/tables/deps exist, it's in-spec, needed now, and it's a bounded change within this module's surface.
- **Big / out-of-place → stop:** it needs a blueprint round, belongs to a future module/step, is a §7 decision, touches another module's surface, or is gold-plating/premature. Say `בנה-עכשיו` / `דחה-ל-X` / `לא-נדרש-כי-Y` with a reasoned recommendation — **Ishay decides.** ⚠️ **Where the deadline actually is: `docs/guides/00_roadmap.md` §3 — NOT `STATUS.md`** (this pointer used to say STATUS, and a builder looking there finds nothing and proceeds without one). And the roadmap is tier 4 in the truth hierarchy with no freshness stamp, so **read it and ask the manager to confirm it still binds** rather than quoting it as fact. A non-blocking, non-spec request while the module is behind schedule defaults to `דחה-ל-אחרי-<the deadline>` — never a hardcoded date, since it changes module to module.

## Council wiring
Real trade-off with two sensible product-affecting directions? **Offer** `council this` and wait for Ishay's approval — never on your own initiative. The council feeds the decision; the decision is his (rule 1).

<!-- shared kernel — single line; the doctrine text lives ONLY in _shared/discipline.md (consolidated 24/07/2026, was duplicated in all five) -->
## Discipline (mandatory — shared doctrine)
Read **`.claude/skills/_shared/discipline.md`** first, before anything else in this skill — it is the single copy of the shared kernel (which itself opens by pointing to `~/.claude/CLAUDE.md` for the universal doctrine), plus the REG-IN-specific instantiation.
<!-- end shared kernel -->
