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
- **Presentation: recommendation-first, detail-on-demand (the standing default in `~/.claude/CLAUDE.md`; every rulings surface uses it — blueprint template aligned 29/07/2026):** each question = one-line background + what it unblocks + options with **the recommendation FIRST, labeled (מומלץ)**. The full format (background · what the ruling means · per-option consequences) is provided only when he asks "פרט לי" or picks an unexpected option. His default action should be one tap on the recommendation — not analysis.
- Hardest genuinely-contested items: flag them as such so he can defer them to a fresher moment; a real trade-off may deserve offering `council this` (CLAUDE.md — offer and wait, never run uninvited).

## Step 4 — Nod list (bucket c)
**Format: one bulleted line per item, each with its own citation** — never merge items into a shared paragraph (a paragraph is easy to skim past; a bulleted list makes the eye stop on each item). Each line: "סוגר X כך-וכך לפי המדיניות הקיימת [cite §7.N]". Close with one shared "עצור אותי אם משהו מפריע" for the whole batch. A single approval covers the batch; any item he stops moves to a Step-3 decision card. (This is the nod mechanism — the ruling is still his; silence after an explicit stop-invitation on a policy-derived item, plus his one approval, is the documented consent.)

**Soft cap: ~8 items per batch (Ishay's ruling 24/07/2026 — deliberately lighter than Step 3's 3-4, since these aren't fresh decisions, just a scan-and-veto over already-classified items; a hard 3-4 cap here would defeat the point of bundling).** If a module has more than ~8 nod-worthy items, split into batches and offer "מספיק להיום" between them exactly like Step 3 — never one wall-of-text list.

## Step 5 — Write-back (alone) + summary
Per iron rule 13(א) — **§7 FIRST, same turn** (the nod-drift lesson: the SSOT never lags a ruling recorded elsewhere): mark each ruled item in `PROJECT_MASTER.md` §7 (date + owner ישי), then ripple through rule 13's FULL checklist, not just the citing docs: **the code/DB where the ruling is already encoded, if it is** (13ב — e.g. a value live in `src/lib/**`, a migration, `params`) · every other place that cites or mirrors it — Decisions Ledger / guide citations (13ג) · `architecture_and_qa_roadmap.md` if the ruling is QA/CI/DoD-related (13ד) · `STATUS.md`'s open-items counter + narrative **and** `CLAUDE_CODE_LOG.md` together, per end-of-session (13ה) · `db_roadmap.md` rows for schema-bound items. On a substantive gate — run `regin-docs-sync` before session end (rule 13(ז) safety net — this is exactly a "§7-ruling gate"). Close with a 3-line Hebrew summary: נסגר (N) · נדחה (N, לאן) · נשאר (N, מתי) — plus where the next round picks up.

<!-- shared kernel — single line; the doctrine text lives ONLY in _shared/discipline.md (consolidated 24/07/2026, was duplicated in all five) -->
## Discipline (mandatory — shared doctrine)
Read **`.claude/skills/_shared/discipline.md`** first, before anything else in this skill — it is the single copy of the shared kernel (which itself opens by pointing to `~/.claude/CLAUDE.md` for the universal doctrine), plus the REG-IN-specific instantiation.
<!-- end shared kernel -->
Skill-specific instances: a §7 number is cited only after opening the registry this turn; a rulings session cut mid-batch re-derives position from §7's own markers, never from the transcript; NEVER close an item on your own authority — including "obviously stale" ones (those are *proposals* with evidence; his word closes them); an existence-answer ("לא קורה") is attributed to Ishay with its date like any ruling.
