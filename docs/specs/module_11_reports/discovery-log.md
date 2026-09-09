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
- **15:5X — rulings 5–8** (his answers to the five-decision batch): cost basis = ordered qty with actual as a gap
  column · no profit target (median comparison) · four conference stories + his method instruction ("חשיבה
  מעמיקה… בונים תוכנית זריעה וזורעים וזהו לא להתרגש") · old C5 mockups moved to `docs/delete/` (PROJECT_MASTER
  §5.17 repointed, README entry written; deletion itself is his). Item 5 (🔵 collision) — "לא הבנתי": explained
  as a 3-column comparison table per calibration §7③; his answer pending. Harvest ④: a batch of five decisions
  was answered in one message — batching works; the one that did not land was the meta/emoji one.
- **16:0X — ruling 9:** 🔵 keeps both meanings (§7 = nod-pending · specs = open). Ishay: "אני רוצה לפי המלצתך אבל
  לא בשקט" ⇒ written where a future reader looks — `docs/CLAUDE.md` emoji legend — not only in this module's file.
  Template §13's "raise the collision" row can now point at that ruling (harvest ③).

## Session 1 (cont.) — 06/09/2026 16:0X–17:0X · Ishay: "תכנן ובצע" here · Stage 1-ג/ג2/ד in delegation

- Ishay reaffirmed continuing in this session despite the rotation warning ⇒ persistence law applied hard: every
  ruling to disk + commit per block. Written by me (not agents): cards ת4–ת8 · 1-ג2 contracts · 17 report
  definitions (`aced42e`).
- **Four Sonnet agents in parallel** (230K + 323K + 279K + 369K ≈ 1.2M): column verify (68 ids, 0 ❌) · live
  anchors (13 measurements, 2 discrepancies vs earlier figures) · world-sources (11 practices / 12 rejections; one
  honest tension: arXiv 2606.26595 argues for open topics) · seed-plan draft (17 + 4 stories; found the
  seed-registry migration header still says "not applied" though 2,250 rows live).
- **Opus fresh-context reviewer (291K)** on the set: 32 claims — 6 ❌ · 8 ◐ · 18 ✅; 14 gaps. Fixed in the SSOT this
  turn: the **Gini triple** (0.526 was the REJECTED active-only population; locked to 0.4556 n=106 with
  `event_date ≤ today`) · **reliability** (0.852/7/4 → replicated formula 0.96/1/2 of 86) · **deviation triple**
  (61/81/175 → locked signed ratio = 81 · 11.6%; % marked as display-derivation over §7.58) · §7.98 list-window +
  pager brought into ת1 with a declared deviation on the default window · LTR time axis + shared-today rule into ת1
  · card completeness for ת4–ת8 · מ25 clarified (surface counted, drawn inside page-20 file) · six R-rows routed
  (R1 לא-נדרש · R2/R6 reasoned rejection · R3/R4/R7 covered) · delegated §ח rulings restated in the SSOT (so it
  no longer depends on `research/`) · chart type per page · locked-vocabulary core · paramsRegistry rows for the
  4 params · "53 params" → 43 · stale ceilings-branch sentence removed (PR #104 merged) · finance_project_money
  return list completed · salary lines join via report_id · acceptance denominator locked to the array column ·
  Cyrillic ч→ח in seed-plan (30) · mirror tags added to world-sources block 11 and seed-plan §0 · live-anchors
  false attribution corrected. Left for Stage 2 by design: design-contract.md · data-set.md with one "today".
- **Caught by whom (harvest ④):** Gini population mismatch, deviation-definition split, §7.98 omission, card gaps,
  Cyrillic letters — **fresh reviewer**; agent-vs-agent number conflicts — **agents** (surfaced, not resolved);
  nothing by re-reading. Ishay's own catch this block: none yet (batch pending).
- Ishay's question "האם צריך להוסיף פרמטרים למודול?" answered: yes, exactly the four already ruled + their
  registry rows; nothing else earns a param (windows/chart choices stay formulas).
- **17:3X — disk check at Ishay's request ("יש עוד דברים בשיחה שצריך לכתוב בדיסק? בדוק").** Found and written now:
  ruling 14 (the params rule he asked about) · ruling 13's quote upgraded from "assumed" to his words · the §🔇
  silent-decision register extended with the Stage-1 items · this log: (a) **written-off already seeded** — measured
  live: 7 projects (01/2024–06/2026) with three realistic reasons; report 6 shows them as a separate counter, no
  seeding needed; (b) **palette drift** found by the design-contract agent: `rose-*` ×5 and `emerald-*` ×3 crept
  into `02_customers/CustomersPage.jsx` (28/08) and `06_projects/ProjectCardPage.jsx` (05/09) — not in the approved
  language; m11 does not copy them; a cleanup candidate for a polish session (not a §6 debt — no module will grep
  for it); (c) the handoff file refreshed to the real position (Stage 2 contract wave running here).
  Already on disk before the check: rulings 1–12, cards, definitions, contracts, killed paths, the 17/21 recount,
  the agents' costs, the reviewer findings.

## 06/09/2026 18:4X–20:4X · Stage 2 production wave — interrupted by the session quota

- Contract wave closed first: design-contract + data-set fixed after the fresh-context review (24 claims, 9 false,
  17 gaps) and re-verified by a closure agent — **0 OPEN**. Ruling 15 (visual grammar) was born from that review.
- Drawing wave dispatched as **5 parallel agents (4×Opus + 1×Sonnet)**. **Only one finished**:
  `drafts/03_tab_finance.html` (7 pages, 1,264 lines, verified in the browser). The other four and all five card
  files died on `rate_limit` — the user's whole session quota was consumed at once.
- 🔴 **Measured lesson for the skill:** a drawing agent that is told to read four long files "in full"
  (~2,900 lines combined) costs ~200K input before it draws a line; five in parallel is a session. **Draw
  sequentially and hand each drawer only its own slice.** Recorded in the handoff.
- Ishay's own words on it: *"אשמתי, נגמר מכסת הטוקנים… לא אשמתך ולא אחריותך לנהל את מכסת הטוקנים"* — but the
  estimate-before-a-wave rule (`feedback_estimate_before_heavy_runs`) says the wave's cost should have been
  measured, not guessed: I said "1.5–2M" and it was more.
- **Next:** Ishay reviews the one landed file (shape is shared by all five) → fix → draw the remaining four one
  at a time → 5 card files → cross-surface pass → his approval of all 25 → seeding → Stage 3.
- **20:5X — rulings 16–18, all three overriding me.** (16) Ishay rejected my "draw sequentially" lesson:
  *"זה דווקא טוב עבודה במקביל"* — parallelism stays, quota is his to watch; the real cost fix (sliced briefs)
  stays. (17) He caught that I brought him a **UI decision for a seeding problem** (the zero tiles) and asked
  for the business profile instead. Measured on the spot: R11 per month in 2026 = 31·35·38·24·37·31·**14·5·0** —
  the last three months collapse, because the seed never closed events near "today". That is the real defect, an
  order of magnitude bigger than two tiles, and it would have shown a *dying* business at the conference. Written
  as the profile block in `seed-plan.md §0א` + ruling 17, including the point nobody had stated: **the target date
  is conference day (~01/10), not today.** (18) He rejected question-titles in the nav as unprofessional; world
  practice (Power BI / Tableau style guides, searched this turn) says short descriptive page names, never codes and
  never sentences ⇒ short name in the picker, question as the page subtitle. **This overrides delegated ruling
  ח8-9** — the delegation mechanism working exactly as designed.
- Caught by: **Ishay, all three.** Claude caught none of them. Harvest ④ row.
- **21:0X — rulings 19–20, both Ishay's catches.** (19) He spotted a column of identical "פתח שיבוצים" links in
  the drawn mockup and asked whether they all lead to the same place. Checked the code: every list screen in the
  system (`FinancePage` · `ProjectsPage` · `CustomersPage`) makes the **row** clickable (`cursor-pointer`) and has
  **zero** repeated "open" links. The mockup broke the house pattern 66 times. Neither the design contract nor the
  spec had stated it — a genuine gap in both, found by eye. (20) He rejected my "sliced brief" cost fix:
  *"נראלי הסכנה יותר גדולה מהרווח"* — and he is right, with the repo's own rule behind him (template §2⑥: a
  reading list is a floor; blind spots travel by inheritance). Cost is managed by concurrency and model, never by
  narrowing what a drawer may read. My own residual point kept on the record: the SSOT file itself must stay tight.
- **21:1X — Ishay's plan, approved: polish the finance tab to done BEFORE replicating**, and an explicit budget of
  **up to 20 agents** (Sonnet/Opus per task). He also asked four review questions that turned into three research
  agents: professional BI standard (details) · decision-support quality per report · how to annotate interactivity
  in a static mockup so the builder implements it. Plus the polish agent on the finance file. 4 running.
  My own answer to "how do I review a report" was given in chat as four rules (the decision · the number's home ·
  the action in one click · the one-sentence conference answer) + three questions he asks per page; if that survives
  his use, it belongs in the skill as the review protocol.
- **21:2X — ruling 21** (*"כאילו פשוט תתקן רק תציין מה תיקנת ולמה"*): review findings are fixed directly and
  reported as a what-changed list, not brought back as a decision table. Scope expansion, contradictions between
  two of his own rulings, and user-visible novelty still come to him.
- **21:2X — his question on drill-down** ("אנחנו בונים דוחות אינטראקטיביים עם דריל דאון אמיתי? איך זה אמור
  להתנהג?"). Honest answer given: what ruling 4 specified is cross-filter + drill-**through**, not true
  drill-**down** (hierarchical descent inside the chart). Recommendation put to him as a scope question with the
  behaviour spec (breadcrumb, tiles follow the level, export follows the level, state in the URL) — pending.
- **21:3X — ruling 22, an Ishay catch that lands mid-flight.** *"יש דוחות בנאליים שהם לא תומכי החלטה וזה בסדר
  כי הם סטנדרטים"* — and the decision-support audit agent was briefed to be ruthless, so it would have condemned
  the operational reports (payroll, equipment) for failing a lens that is not theirs. Four report types recorded
  with the lens each is judged by, and all 21 pages classified (5 decision · 8 monitoring · 4 strategic ·
  2 operational). **The running agent's output must be read through this table before any of its findings is
  applied** — noted in ruling 22's ripple column so a later session cannot miss it.
- **21:4X — ruling 23, and he asked me to write it into my own memory**: *"מקצועי ונאמן לסטנדרטים בהייטק היום…
  פעם אחת נכון בלי לחסוך עבודה"* + *"תכתוב לעצמך שזה מה שמוביל אותי"*, calibrated one message later with
  *"זה פרויקט אקדמי, לא חייב להגזים אבל לא להתעצל"*. Written to `~/.claude/projects/…/memory/` as a cross-project
  feedback memory (over-engineering and laziness cost him equally; the default proposal is the standard version).
  **This ruling also answers the pending drill-down question: build it** — true hierarchical drill-down in four
  reports, cross-filter in the rest. Twice today I had recommended the cheaper half (draw without drill-down;
  sliced agent briefs) and he rejected both — that pattern is what the memory records.
- **22:0X — ruling 24, and Ishay corrected my instinct again.** I had narrowed the 7 missing decisions to 1,
  claiming two were covered elsewhere. He pushed back (*"אני לא מפחד להרחיב את ההיקף, זוכר את הכיוון שלי?"*) and
  I went to check my own claim instead of defending it: **ח3 really is covered** (`QuotesPage.jsx` has the
  expiring-soon filter with a params threshold) · **ח2 is only partly covered** (the dashboard attention strip has
  a gap branch per event, capped — no cross-horizon count) · **ח1 is not covered at all** (`SmartMatchPage` shows
  `pending` per project only). Result: **5 of 7 enter scope**, 1 as a tile, 1 declined **with code evidence**.
  M goes 25 → 26. The pattern in `feedback_professional_standard_once` fired for the third time today: my default
  proposal was the smaller half, and it was wrong.
- **22:2X — ruling 25: Ishay overturned my ruling-13 sequencing, and he was right.** He asked whether a full
  seeding run now would not have prevented a lot of confusion. Audited honestly: four separate confusions today
  (zero tiles presented as a UI question · every finance tile with no comparison anchor · four charts undrawable ·
  the Jul/Aug/Sep collapse found late) all trace to the same missing data. My error was assuming ALL seeding
  depends on report definitions — only the feature seeding does (`recommended_rank`, AI classifications need new
  schema). The profile seeding (close past events, volume, bonuses, one payroll report, scope changes) depends
  only on ruling 17 and could have run from the start. Split into phase A (now, parallel) and phase B (blueprint).
  **Fourth time today my default was the smaller/later option and he corrected it** — the memory entry is earning
  its place.
- **22:3X–22:4X — rulings 26 + the ח4 reversal.** Two agent claims were verified by me before use and one was
  wrong: the data agent said active projects have no `actual_hours` (false — 446 assignments do); the real reason
  ח4 fails is structural (before an event happens, actual < planned always ⇒ 0 overspend on all 63 active
  projects, max deviation 0 ₪). Dropped with Ishay's agreement. The seeding plan then produced three
  assumption-breaking findings: **the seeding is not reversible** (no un-archive exists — my own ruling 25 said it
  was), **a single August payroll report sweeps 3,887 lines / 919,048 ₪**, and **24 of 29 September events cannot
  be closed today** (status + future-date gates) ⇒ phase A splits into two runs. Also: the "don't touch project 8"
  instruction is empty — projects 3/7/8/13/14 no longer exist; live anchors are 11·12·15·16 (write-back owed to
  `seed-data-spec.md` and `demo-seed.mjs`). Scope-change volume raised from 1.6% to ~25% of projects, anchored on
  an internal measurement (18.7% of finished events had more guests than the quote estimated).
- **07/09 00:2X — wave 2 dispatched: the four verifiers on the rewritten mockup, which nobody had reviewed.**
  Ishay asked which review eyes the finance mockup had passed. Checked instead of answering from memory, and the
  honest answer was worse than my earlier reply implied: **the file has three versions** (20:41 / 1,264 lines →
  21:20 / 1,298 → 00:02 / 2,141), and **every existing critique examined an earlier one or examined something
  else entirely**. `m11-charts-rtl-a11y.md` (17:26) was written *before any mockup existed* — it reviews the chart
  contract. `m11-bi-professional-critique.md` (21:39) reviewed v2, a file 843 lines shorter than what exists now.
  `m11-decision-support-audit.md` audited the 21 report *definitions*, not the file. `m11-interaction-annotation.md`
  *built* the marker convention and never checked its application. ⇒ **their findings were applied to v3, but nobody
  verified the application.** My own check tonight was mechanical presence-counting (113/113 `scope`, 30/30 tiles
  with a comparison, 26 markers, ruling-18 names, ruling-19 rows) — it cannot see correctness, data fidelity, or
  whether the drill-down actually works when clicked.
  **Wave 2 (already in the approved polish plan, marked ⬜, never run) launched now — four agents in parallel,
  reading every source in full (ruling 20):** contract compliance (Opus → `m11-contract-compliance.md`) · data
  fidelity with live DB re-measurement (Sonnet → `m11-data-fidelity.md`) · a11y + RTL verified in the browser at
  1280px including a verdict on the open G7 item (Sonnet → `m11-a11y-rtl-verify.md`) · product eye in the browser,
  the three questions per page, and whether the new drill-down works at all (Opus → `m11-product-eye.md`).
  Each brief carries the head-then-tail mine, "you do not rule", "one file rules", the LF-newline gate, and the
  two lever questions (claims with no source / what is missing). Budget: 7 of Ishay's 20 agents used before this
  wave; 11 after.
  **Also written this turn:** the stage-2 status row, which still claimed "1 of 5 files landed, cards folder
  empty" — three hours stale · and a structural gap found re-reading `module-discovery/template.md` §📁:
  **`screens-approved.md` does not exist.** The template, the handoff file and `module_playbook.md` all name it as
  the home of the screen cards; `module-blueprint`/`module-build` open it *by name*, and a missing file reads to
  them as "this module has no screen cards". Ruled by delegation: it will be created at the end of stage 2 as the
  parent file (the `מצב` table for all 26 surfaces + a pointer per tab file), with the per-tab card files kept.
