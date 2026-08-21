# Module 5 (Logistics) — Discovery journal

Reader: Claude (English). The Hebrew ruling record is `processes-approved.md`.

## Session 1 — 21/08/2026 — Stage 0 intake

- Ran on Sonnet (Claude Sonnet 5), not the skill-recommended Opus. Disclosed to Ishay before proceeding.
  His call: stay on Sonnet as the live driver; dispatch Opus subagents specifically at the skill's
  mandatory fresh-context-reviewer checkpoints (end of Stage 1, before handoff) rather than switching
  the whole session. Recorded so a resuming session doesn't re-litigate this.
- `ls docs/specs/` — module 5 had no folder. Confirmed zero Discovery work exists, contradicting the
  branch name/STATUS narrative in places. `git log origin/dev..origin/ishay/module-5-logistics` — empty,
  branch is fresh with 0 commits.
- Verified the "3 Discovery/blueprint safeguards" STATUS.md flagged as blocking module 5's opening
  (commit d0d99f1, PR #43) are in fact already merged into dev/main long ago — that STATUS.md line is
  stale. Not yet corrected in STATUS.md (flag for write-back).
- Read `docs/guides/modules/module_05_logistics.md` in full. Archetype: 🖥️ Screens (owns `logistics`
  table). Confirmed order-of-build note: module 6 was built before module 5 despite the guide's original
  intent (5 before 6) — explicitly acknowledged and reasoned in module 6's own processes-approved.md
  ("6-core → 5 → 6-integration", no Discovery dependency).
- Read `docs/specs/module_06_projects/processes-approved.md:601-690` in full — the mandatory "what
  module 6 dictates to module 5" section (7 items) plus the status-machine process card. Cross-checked
  against `PROJECT_MASTER §6`'s `🚧 מ5 ← מ6` transcription (lines 627-629) — content matches, except
  item 5 (cancellation cascade / §7.31): the source doc (written 13/08 same day) still says "open",
  but `PROJECT_MASTER §7` item 31 (also 13/08, later same day) shows it was resolved: no cascade,
  logistics rows are left untouched as billing evidence. Flagged this staleness to Ishay directly when
  he asked about the open question — corrected in the ledger.
- Live DB verification (Supabase MCP, project yfeovxppnfoafmfbdfvh), not schema.sql snapshot:
  - `logistics` columns: project_id, sku, serial_number, planned_qty, actual_qty, item_status, notes,
    created_at, updated_at, quote_service_line_id, project_change_id. **No `line_id` column** —
    confirms the module 6 debt item's finding still holds.
  - Only one RLS policy: `logistics_select_by_permission` (SELECT). No write policy exists.
  - 6 live rows, item_status values in use: not_started, ready (no "ordered" rows yet).
  - quote_service_line_id / project_change_id: 0/6 filled — no writer exists yet.
  - Constraints: PK (project_id,sku,serial_number) · planned_qty>0 · item_status 3-value CHECK ·
    logistics_origin_exactly_one (quote_service_line_id XOR project_change_id, or both null) · 3 FKs.
    **No CHECK on actual_qty ≥ 0** — confirms the §7 "bundle of technical rulings" (item 41) gap is
    still real, not fixed.
- Read C5 §5.6.8 (overview screen) and §5.6.9 (checklist screen), C6 §2.4.13 (data model) in full.
  Extracted 30 ledger rows total (7 from the module-6 contract, 4 from §7 items, 19 from C5/C6).
  Coverage: 14 already covered (mostly inherited from module 6's work, not new module-5 work needed) ·
  9 unhandled (real gaps: line_id, no writer for actual_qty/item_status, no write RLS policy, §7.22
  open) · 7 not yet discussed (mostly the overview screen's own UX).
- Created the Stage 0 skeleton: `processes-approved.md` (requirements ledger + resolved-inputs tables +
  empty status table + empty "לא-קורה" register), per §0ד — pre-approval content only (transcription of
  what the sweeps returned).
- Not yet done: full register-sweep in both Hebrew-name-variation forms across `docs/`/`src/` (§2's grep
  warning — only did the token-anchored sweep so far); Stop 1 presentation to Ishay has not happened yet.

## Session 1, continued — 21/08/2026 — four research agents + Ishay's rulings

- **Ishay's methodological ruling, and it invalidated a chunk of my analysis:** the unapproved mockups
  under `docs/mockups/logistics-screen/` are *"חארטה… רק רעיון כללי עם 0 אמינות"*. Approved mockups are
  born only AFTER Discovery (module 6 is the pattern). I had spent a round analysing them and surfacing
  "suppliers" and "fixed equipment checklist" as product decisions — **both are noise from a throwaway
  artefact, not his intent.** Dropped. Lesson for the skill: the outputs matrix says mockups are a
  limited-liability reference, but nothing in the procedure says *unapproved* mockups from a
  pre-Discovery era should be excluded from the requirement sweep entirely. They should be.
- **I also over-corrected in the other direction earlier in the same round:** I told Ishay "actual_qty has
  no input surface in your spec", then found the mockup had one, and reported that as a self-correction —
  which was itself built on the worthless artefact. Net: the original statement about **C5** was right.
- **Ishay's push-back on framing, and he was right:** "מיגרציות זה לא פער זה פשוט העבודה". My "9 gaps"
  count conflated *work to be done* with *holes in the thinking*. Recounted: 4 are simply the work, 3 are
  real planning gaps. Also caught two of my own ledger rows (#4, #12) marked `unhandled` when the
  mechanism they describe demonstrably works — corrected in the file.
- **Four agents dispatched** (Ishay authorised agents at session open; cost stated before dispatch):
  duplication scan · module 3 → logistics handoff · module 4 as structural precedent · module 6 DB
  contract. All four returned. Key findings folded into `processes-approved.md` §"עובדות-מסד" and
  §"תקדים-המבנה". The highest-consequence ones:
  - `apply_scope_change` refuses `qty <= 0` with a Hebrew message that **explicitly routes item removal
    to the logistics manager** — a surface module 6 promised the user and module 5 must build. Not in C5.
  - Writing logistics on a `cancelled`/`event_finished` project **succeeds silently** — the status guard
    returns without error and without effect. The DB does not enforce module 6's status rules on direct
    writes; only module 6's RPC bodies do, and a new screen bypasses them.
  - The recompute trigger has no `WHEN`/`OF` clause ⇒ every row write, including `notes`-only, runs a
    full recompute holding `FOR UPDATE` on the parent project row. Bulk saves serialize. Design
    consequence: prefer per-row instant save over a form-with-save-button.
  - `logisticsMetric()` in `src/lib/projects.js` is written, unit-tested, and has **zero production
    callers** — built for module 5 and left waiting.
  - `db_roadmap` M6-5 created `quote_service_line_id` explicitly to solve "same SKU in two colours ⇒
    indistinguishable rows" and calls it *a fulfilment problem, not a money one*. The column exists with
    no writer. This is exactly the scenario Ishay raised independently (yellow vs red tags).
  - Module 4's drill-down **replaces the page** (not a dialog, not a route) with a documented reason;
    `C5 §5.6.9` says "חלון". Real precedent-vs-spec conflict for module 5 to rule on.
  - Gender: module 4 is mixed (feminine sentences, masculine buttons, `נסה שוב`); module 6 ruled S-28
    (all feminine). Module 5 should follow module 6.
- **Ishay's process question at the end of the round** — *"לא צריך להתחיל מהגדרת המשטחים? או שקודם עונים
  על שאלות?"* — is correct and caught a real sequencing error: I had gone from Stage 0 straight into
  process debate without ever presenting the surface list, which the template makes a **blocking** Stage
  1-א approval (no `M` without it). Surface list drafted in `processes-approved.md` and presented.

## Open for next session / next turn

- Stop 1 not yet reached — need to present classification + sweep tables + ledger to Ishay and ask
  "מה מהרשימה הזאת מפתיע אותך?"
- STATUS.md's stale line about the safeguards PR blocking module 5 — needs a write-back fix (not done
  yet, flagged only in chat).
