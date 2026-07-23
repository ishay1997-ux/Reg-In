---
name: section7-rulings
description: REG-IN — run a batched §7 open-questions rulings session with Ishay (pre-module rounds or ad-hoc). Load whenever Ishay wants to close open questions: "בוא נסגור שאלות פתוחות", "סבב הכרעות", "בוא נכריע", "נסגור את השאלות של מודול N". The skill does all the hard work alone first (stale-detection, reality-checks, drafted recommendations) and brings Ishay only real decisions, in small easy batches. Rulings are ALWAYS Ishay's (iron rule 1) — this skill only makes deciding easy. Not for the module lifecycle itself (module-blueprint / module-build / module-close).
---

# section7-rulings — make deciding easy for Ishay

**Why this skill exists (Ishay, 23/07/2026):** closing open questions is *exhausting* for him. The skill's single success metric is **Ishay's effort per ruling** — everything hard happens before he is involved; he meets only what genuinely needs him, pre-chewed. Two of his explicit requirements are load-bearing here: **(1)** verify the business process is understood as HE thinks it works, before asking anything; **(2)** never treat a hypothetical edge case as a decision — first ask whether it even happens in reality.

## Step 0 — Preparation (alone; Ishay sees none of this)
1. Scope the sweep: `grep '·מN·' docs/PROJECT_MASTER.md` (§7 items tagged for the target module) + the step guide's §② open-questions list + the micro-guide's Decisions Ledger (OPEN/nod-pending) if one exists. Ad-hoc sessions: whatever scope Ishay named.
2. For EVERY candidate item, verify live before it reaches him (block-A discipline): is it already resolved in code/schema/docs? Obsolete? Duplicated? A stale-open item gets a **proposed closure with evidence** — not a question.
3. Classify the survivors into four buckets:
   - **(a) stale** → closure proposal with the evidence line.
   - **(b) reality-unknown edge case** → an existence question (Step 2), NOT a decision card.
   - **(c) engineering call with an existing parent policy** (e.g. a §7.64-style precedent) → the nod list (Step 4).
   - **(d) genuine business fork** → a decision card (Step 3) with a drafted one-line background + a reasoned recommendation.

## Step 1 — Understanding declaration (Hebrew, before ANY question)
Open with 2–4 sentences per topic-cluster: "כך הבנתי שהתהליך עובד אצלך בשטח: … — תקן אותי". Only the product manager knows how the process really runs; a question built on a wrong model wastes his energy twice. If he corrects → re-triage the affected items before continuing.

## Step 2 — Reality filter (kills invented edge cases)
For bucket (b), ask plain yes/no existence questions in one small batch: "קורה אצלך ש‑…?". An answer of "לא קורה" closes the item as **non-existent by Ishay's ruling** (dated, attributed — it IS a ruling, record it in §7). Never design for a case whose existence was never confirmed.

## Step 3 — Decision rounds (bucket d)
- **Batch size: 3–4 per round (Ishay's ruling 23/07)** via AskUserQuestion. After each batch offer: המשך / "מספיק להיום". Stopping mid-list is a first-class outcome — record exactly where the round stopped so the next session resumes cleanly.
- **Presentation: recommendation-first, detail-on-demand (Ishay's ruling 23/07 — deliberately overrides the default full background·meaning·options format for THIS flow):** each question = one-line background + what it unblocks + options with **the recommendation FIRST, labeled (מומלץ)**. The full format (background · what the ruling means · per-option consequences) is provided only when he asks "פרט לי" or picks an unexpected option. His default action should be one tap on the recommendation — not analysis.
- Hardest genuinely-contested items: flag them as such so he can defer them to a fresher moment; a real trade-off may deserve offering `council this` (CLAUDE.md — offer and wait, never run uninvited).

## Step 4 — Nod list (bucket c)
One consolidated Hebrew list: "את אלה אני סוגר כך-וכך לפי המדיניות הקיימת [cite §7.N] — עצור אותי אם משהו מפריע". A single approval covers the whole list; any item he stops moves to a Step-3 decision card. (This is the nod mechanism — the ruling is still his; silence after an explicit stop-invitation on a policy-derived item, plus his one approval, is the documented consent.)

## Step 5 — Write-back (alone) + summary
Per iron rule 13(א) — **§7 FIRST, same turn** (the nod-drift lesson: the SSOT never lags a ruling recorded elsewhere): mark each ruled item in `PROJECT_MASTER.md` §7 (date + owner ישי), then ripple: Decisions Ledger / guide citations / STATUS open-items counter + narrative / db_roadmap rows for schema-bound items. On a substantive gate — recommend running `regin-docs-sync` before session end (rule 13(א) safety net). Close with a 3-line Hebrew summary: נסגר (N) · נדחה (N, לאן) · נשאר (N, מתי) — plus where the next round picks up.

<!-- shared kernel — identical in all five repo-local skills (feature-acceptance moved to ~/.claude/skills/ 23/07 night — no longer part of this set); a change here updates all five + _shared/discipline.md in the same session -->
## Discipline (mandatory — shared doctrine)
The universal doctrine lives in **`~/.claude/CLAUDE.md`** (loads every session, every project): plain-Hebrew communication · Ishay is the product manager — understanding-declarations invited for correction, product/design decisions are his · no citation without a same-turn check · resume from disk, not from narration. Read and apply it. Then read **`.claude/skills/_shared/discipline.md`** for the REG-IN instantiation — which file/tool verifies which kind of claim, and what "resume from disk" concretely means in this repo.
<!-- end shared kernel -->
Skill-specific instances: a §7 number is cited only after opening the registry this turn; a rulings session cut mid-batch re-derives position from §7's own markers, never from the transcript; NEVER close an item on your own authority — including "obviously stale" ones (those are *proposals* with evidence; his word closes them); an existence-answer ("לא קורה") is attributed to Ishay with its date like any ruling.
