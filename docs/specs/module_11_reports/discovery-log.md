# Module 11 — Reports · Discovery log (English; reader = the next Discovery, not the build)

> Rulings live in `processes-approved.md` (Hebrew). This file holds the evidence trail: what was
> covered, what Ishay corrected, where it got stuck, what surprised us. Never the primary target of a ruling.

## Session 1 — 06/09/2026 08:5X–09:2X · Stage 0 (intake)

**Position on disk at start:** `docs/specs/module_11_reports/` held only `research/` (Ishay's draft v3.1 + the
06/09 review). No `processes-approved.md` ⇒ Stage 0 had not run, whatever the log said. Branch
`ishay/module-11-reports`, clean, ahead of `origin/dev` by docs commits only (not merged, not fresh).

**Read in full by the main session (Fable):** SKILL.md + template.md · `_shared/discipline.md` ·
`_shared/ishay-calibration.md` · `_shared/failure-modes.md` · root + docs `CLAUDE.md` · the draft (973 lines) ·
the review (319 lines) · step guide · §6 `🚧 מ11` items to their end · §7 items 58 · 79 · 82 · 93 · 95 · 96 · 99 to
their end · m8 rows ה1·ה8·ה17·ה18·ה27 · m6 `OPEN_PROJECT_STATUSES` paragraph · m5 ㉗ · `db_roadmap` m11 rows ·
mockups 01–02.png · Stop hook header · playbook paste blocks.

**Live DB (project `yfeovxppnfoafmfbdfvh`, read-only):** permission matrix for 'דו"חות' (recruitment still
`blocked` — Ishay's 06/09 ruling "גיוס רואה" is NOT yet applied in the matrix; it is his click in the permissions
screen) · row counts · params · pg_policies for 14 tables · `has_function_privilege` for 10 RPCs
(`finance_project_money` + `assert_module_permission` not executable by `authenticated`) · cron jobs (3, SQL-only) ·
feedback-reason CHECK taxonomies · column lists for 14 tables.

**Agents (Ishay's in-session instruction: "העזר בסוכני אופוס וסונאט בהתאם למשימה"):** three Sonnet agents,
mechanical only, no rulings — ledger extraction (313 rows) · source-per-number (50 measure rows · 10 no-writer ·
28 phantom columns) · register sweep both directions (8 §6 debts · 20 §7 items read to the end · 0 debts owed BY
m11 · 9 head≠tail instances). **Cost: 303K + 269K + 237K ≈ 809K subagent tokens** — my pre-estimate to Ishay said
~200K; it was wrong by 4×. Recorded so the next Discovery budgets honestly.
**Spot-check of agent output by the main session:** 4 checks on the source sweep — 3 confirmed, 1 agent error
caught (`finalize_salary_report` reported "not found"; it exists in
`20260827152840_module8_salary_report_transaction.sql:207`, declared without a `public.` prefix — the known
"0 in grep ≠ does not exist" mine). Register sweep cross-read against my own earlier reads: consistent.

**What surprised me (candidates for Stop 1):**
1. Recruitment manager still `blocked` on reports in the live matrix despite the 06/09 ruling.
2. `db_roadmap` §7 RLS row for m11 says "none (5 reports as Views/RPC, read-only)" — stale twice (5 came from C5;
   AI adds a table).
3. No existing RPC aggregates across projects (by year / customer / hostess) — every gated reader is per-project
   or per-month ⇒ the whole module rides on new summary RPCs, not on reuse.
4. `סף_לקוח_רדום_ימים` has `owner_role_id = NULL` while every other threshold has an owner.
5. `hostess_unavailability` = 5 rows; `salary_reports` = 0; `project_changes` = 16 — three reports would be
   visibly empty at the conference without seeding (already in §ח8 #10 for two of them).
6. Ishay's draft §2 (table map) is almost entirely correct while §9.2 (code) is almost entirely wrong — the
   draft is a product document wearing a developer-blueprint costume; treat §9 as intent, not spec.

**Harvest ledger (Stage 0) — MOVED to `docs/guides/discovery_lessons.md` §🌾 מודול 11 (the template's destination; a fresh reviewer caught the mis-routing). The four lines below are the original draft, superseded there:**
① Rounds: 0 with Ishay so far (Stop 1 is the first). ② Sections that did not fire in Stage 0: §5 (world check —
by design, Stage 1) · §2⑧ anchors partly (the ledger cites grep anchors, agents' files still carry some line
numbers) · the design skill / browser (Stage 2). ③ Where the template was wrong/missing: it says "the module's
table(s)" — for a read-only module that is planning to grow a table, the row needs a "planned tables" cell; it says
"tell Ishay agent count and cost before every wave" — I estimated 200K and it was 809K, so the estimate needs a
measured per-agent number, not a guess. ④ Who caught what: the agent error on `finalize_salary_report` — Claude
(spot-check); nothing else structural yet — Ishay has not seen Stop 1.

**Open at end of this entry:** Stop 1 presented → waiting for "מה מפתיע אותך" · Ishay's action: grant recruitment
`view` on 'דו"חות' (his click) · STATUS/LOG updated at session end.

## Session 1 (cont.) — 06/09/2026 09:3X · Stop 1 passed silently · Stage 1-א presented · ruling 1

- Stop 1 ("מה מפתיע אותך") — Ishay answered "המשך" with no surprise named; his one question was a COUNT question
  ("כמה דוחות זה בעצם") — the "19" label was loose. Re-counted: 21 draft cards − 12 (killed) − 3 merged (3→7, 9→5,
  19→18) = **17 report pages**, + 4 tab overviews = **21 pages**. Lesson for the template: a scope number inherited
  from a review must be recounted in units the reader sees (pages), not items in a source list.
- Stage 1-א presented: 8 processes (3 invisible), surface list M=25 (unit = report page, recommended over tab),
  settled vs open. Approval of M still pending.
- **Ruling 1 (Ishay: "לפי המלצה")** — reopened his own 06/09 04:3X AI ruling on his initiative ("אני עדיין לא
  סגור… מגניב או מיותר?"). Recommendation given with the four tests: keep comment classification (answers a
  question no table can, measurable vs customer tag, batch-stored ⇒ demo-safe), drop LLM weekly narration
  (unmeasurable, live-demo risk, value already covered by computed "אז מה" lines). He took (א).
  Written to `processes-approved.md` §🗳️ first (rule 13א), ledger verdicts flipped (11 rows), review §ח4 got a
  dated ✏️ pointer. World anchor was given as "מהידע שלי, לא אומת" — to be sourced in `world-sources.md` (Stage 1).
- Caught by: Ishay (reopening the AI scope) — the file had it as settled; I would not have reopened it. Row for ④.
- **M = 25 approved** (Ishay: "מאשר את המשטחים", 06/09/2026 09:3X); unit = report page (recommendation taken
  without objection). Written as the surface table in `processes-approved.md` in the same turn — verified by grep
  before reporting.
- **Ishay's question on the seeding plan** ("באיזה שלב אתה מכניס את זה?"): added a named stage **1-ד "סיפור-הכנס
  והדאטה"** (`seed-plan.md`, Hebrew, spec folder — the m7 `seed-data-spec.md` precedent) between the process
  cards and drawing, because Stage 2's data set (2א) must come from it and the blueprint's phase 1 seeding
  (§ח8 #10) executes it. Caught by: Ishay — the template has no seeding stage; the harvest ledger gets this.
- **Stage 1-ב** (06/09 09:4X): 10 items, verdict each. Ishay answered the two reality questions with **"שניהם לא
  קורה"** (tablet in the field · feedback edited after sending) — both written to the killed-paths register
  verbatim. Ishay then approved the table explicitly ("מאשר את הטבלה"); the interim "assumed approval" note was replaced by the quote. Item 4 (scheduled digest) deliberately NOT written as `🚧 מ10`: nobody asked for a
  digest; §7.57 already holds the "if ever — m10" pointer; a debt line would manufacture work.
- **Cards ת1 + ת2 + ruling 2 (tab gating by data-owner permission) approved** ("מאשר לפי המלצה", 09:5X) and written.
- **Ruling 3 — blanket delegation** (verbatim in §🗳️). Consequence: the rest of the Discovery runs as an
  orchestrator + agent waves in a FRESH session (this one is at the rotation line). Ishay's question "אתה מתכנן
  אותו אינטראקטיבי כמו איש BI אמיתי?" answered as ruling 4 (level-1 interactivity + period comparison + computed
  "so what" line; no further market research — §ח3 already has 5 sources; one Recharts/RTL/a11y check in Stage 2).
- **Handoff written** (`next-session-prompt.md`) and put through a fresh-context Opus reviewer with the two
  questions (unsourced claims · omissions): **28 claims checked — 19 ✅ · 8 ◐ · 1 ❌** (acceptance Q4 would have
  fired a false alarm: three `### ת` headings, not two) · **16 omissions**, all fixed into the prompt (1-ג2
  contracts · screens-approved `מצב` · sources line · mockup mechanics + 4 orphan PNGs · Stop-hook ordering ·
  pathspec commits · Plan Mode · 🔵 collision · §11 hand-computed number · blind-spot pass · playbook says six
  cross-checks vs seven · 4 stale spots in the step guide · §ז closing · mirror-tag wording · harvest destination).
  Reviewer cost: 206K tokens. Self-catch on re-read: 0 (as always).
- Killed-paths table formatting fixed (a blank line had split it); stale `מצב` row for Stage 2 fixed.
