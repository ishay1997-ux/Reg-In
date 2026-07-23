---
name: feature-acceptance
description: REG-IN — guided PM acceptance walkthrough of built features, against what Ishay actually meant. Load whenever Ishay wants to verify built-reality vs his intent: "בוא נעבור על מה שבנית", "בדיקת קבלה", "תראה לי מה בנית", "בוא נבדוק שזה מה שהתכוונתי", or when he reports "זה לא מה שהתכוונתי" about a built feature. Claude drives the live preview station-by-station against the approved experience-briefs and spec; Ishay only confirms or flags. Output = a recorded gap list turned into fixes/deferrals. Complements — does not replace — module-build's end-of-phase 🎨 gate and the closing audit's §2b.
---

# feature-acceptance — scripted walkthrough: what-was-built vs what-Ishay-meant

**Why this skill exists (Ishay, 23/07/2026):** a recurring gap no existing gate covers head-on — technical tests pass, the pre-code 🗣️ experience-brief was approved, and still, feature after feature, he manually pokes the UI and discovers "זה לא בדיוק מה שהתכוונתי". This skill replaces that unstructured poking with a **guided acceptance session**: Claude prepares and drives; Ishay only judges. His effort per station should be one word.

## Step 1 — Scope + script (alone, before involving him)
1. Determine scope: a single build-unit, a screen, a phase, or the whole module. If ambiguous, ask in ONE short line ("על מה עוברים — מסך X בלבד או כל פזה 3?").
2. Collect the intent sources for that scope: the approved 🗣️ experience-briefs (what he OK'd pre-code), the spec sections (C5 screens/process via the micro-guide's citations), the mockups, and any 🎨-gate rulings already given.
3. Derive the **acceptance script**: numbered stations, each = *action to perform* + *what should happen* (cited from brief/spec — never invented). Order them as a user's real journey through the feature, not by file structure.

## Step 2 — The walkthrough (with him, station by station)
- Drive the flow in the LIVE preview (dev server, seeded test data): perform the action for real, capture a screenshot.
- Per station, in Hebrew: "**תחנה N:** עשיתי X → זה מה שקרה [screenshot] → לפי מה שאישרת, אמור להיות Y". He answers: ✔️ "זה זה" / ✖️ "לא — מה ששונה: …".
- **Max 3–4 stations per message** (the same fatigue principle as the rulings skill) and offer "מספיק להיום" between batches — an interrupted walkthrough records exactly which station it stopped at.
- Do NOT editorialize mid-walkthrough ("this looks good to me") — his judgment is the whole point; your opinion arrives only if he asks.

## Step 3 — Gap handling (every ✖️, immediately)
1. Classify OUT LOUD through the size-gate (triage rule 1): small in-scope fix → propose "מתקן עכשיו" and fix on his OK; bigger/architectural/other-module → route to a step / §7 / a `🚧 מN` deferral — his call.
2. **Nothing lives only in chat:** every gap lands in the micro-guide the same session — an "↳ as-built" note on the step it changes, or a §9 line for deferrals (+§6 for cross-module debts, rule 15).
3. Re-verify each fixed gap at the same station before closing it (evidence, not assumption).

## Step 4 — Summary + wiring
Hebrew close: תחנות שעברו (N) · פערים שתוקנו (N) · פערים שנדחו (N, לאן נרשמו). When run at phase/module scope, this walkthrough's results feed the QA-matrix **Usability/UAT** as-run cells and can serve as the walkthrough half of the 🎨 end-of-Phase-3 gate — say so explicitly so the gate isn't double-run. End-of-session protocol applies.

## Relationship to existing gates (do not duplicate)
🗣️ experience-brief = intent BEFORE code · 🤖 evidence = built correctly technically · 🎨 phase gate / closing §2b = design & states audit at fixed points · **this skill = the on-demand intent-vs-reality diff, whenever Ishay wants it**. It never replaces the fixed gates; it is how Ishay triggers that comparison at will.

## Discipline
Shared blocks A+B of the module skills apply (read `.claude/skills/module-build/SKILL.md` if not loaded). Skill-specific instances: "אמור להיות Y" is always CITED (brief/spec/mockup — flag mockup-only expectations as limited-liability); never claim a station passed without having actually driven it this session (screenshot = the evidence); resume rule — an interrupted walkthrough resumes from the recorded station, not from memory.
