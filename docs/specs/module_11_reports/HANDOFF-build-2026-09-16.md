# HANDOFF — module 11 build, 16/09/2026

> **Continues from:** `docs/specs/module_11_reports/HANDOFF-stage3-2026-09-10-02.md` (spec stage; its §2
> blockers are all closed — see `STATUS.md`, which says so explicitly. Do **not** read state from it;
> its §5 traps and §7 "how to work with Ishay" still hold).
> **Written by:** the orchestrating session `719c2c51` at 16/09/2026 ~08:3X, while eight agents were in flight.
> **Language:** English body per `docs/CLAUDE.md`; Hebrew appears only as data — quotes, UI strings, role names.
> **Source marks used throughout:** 🌐 quoted from another file/chat · 📏 measured by me this turn · 💭 my
> conjecture or inherited-unverified. **A claim without a mark is not written.**

---

## 0 · Measurement line (§4ג of the handoff guide)

> 📏 נקרא לפני הכתיבה: כל מה ששני הצדדים כתבו בשיחה — 03:42 → 08:19 ·
> 10 הודעות של ישי (22KB) ו-14 שלי (5KB) · יחד 27KB.
> 274 קריאות-כלי נשמרו כשורות-סימון; פלטיהן (8762KB) לא נטענו במכוון —
> הראיה למה שנעשה היא `git log`, לא נרטיב. 0.3% מהתמליל הוא השיחה עצמה.

📏 **And the honest limit of that extract, measured this turn — it matters for §2.**
`grep -n "^===== \[" <extract>` returns exactly **ten** Ishay turns: 03:42 · 04:39 · 04:40 · 05:08 · 05:09 ·
05:19 · 05:20 · 05:22 · 07:33 · 08:01 — and **four of those ten are Stop-hook feedback or the
compaction/limit system messages, not Ishay typing.** The rulings made at ~04:0X–04:3X (the Gemini key,
the merge authorisation, the typed-echo waiver, the mockup correction) and the ~06:0X handoff request
**do not appear as their own turns in the extract.** They survive in two first-hand places, and this
document marks which one each quote came from:
- 🌐 the approved plan `C:\Users\ishay\.claude\plans\cuddly-tinkering-kazoo.md` §2 / §2ב — written *during*
  that exchange, quoting him word for word;
- 🌐 the compaction summary's own "All user messages" list, reproduced verbatim inside the extract
  (`grep -n "מסמך מסירה לעצמך" <extract>`).

⚠️ **So: a quote in §2 tagged "compaction summary" is a second-hand copy of his words. It is the best
record that exists, and it is not the same thing as the transcript.** Treat a disagreement between a
plan-file quote and a summary quote as a finding, not as noise.

---

## 1 · Who reads this, and where we are in one paragraph

**The reader is this same session after an automatic context compaction** (one already fired at ~07:3X),
or — if that fails — a genuinely new session. Ishay ruled out the second option out loud
(*"סשן חדש אמיתי זו לא אופציה אני רוצה שאתה תצליח לסיים הכל לפי התוכנית שלך"*), so this file exists to make
the first option survivable. **Read §3 in the order given, re-derive §4 from disk with the commands
beside each claim, then resume at the top of §5. Ask Ishay nothing — he authorised the whole path to
production in advance (§2), and the only things that still stop for him are named in §5.**

**Situation:** module 11 (דו"חות מנהלים — 16 report surfaces, 4 role tabs, one page at `/reports`) is being
built end to end in one night, from zero lines of code to production. Phases 0–2 are done and committed:
the database side is live (5 structural migrations + 16 read RPCs + 1 write RPC, all applied), the
AI-classification engine is deployed and its 426 notes are classified and approved, and the UI
foundation (shell · chart card · export · table · the shared `ReportSurface` renderer) is on the branch.
Phase 3 — the four tab UIs — started at 08:2X with eight concurrent agents. Everything after that
(lens verifiers, copy evaluators, E2E, gates, docs, closing audit, two merges, production verification)
is still ahead and is listed in order in §5.

---

## 2 · Ishay's words

### 2.1 His first prompt, verbatim and in full

🌐 **16/09/2026 03:42, the opening message of this session** (first-hand: it is turn 1 of the extract):

```
קרא את כל הקבצים הרלוונטים תפקידך הוא להיות החוקר המתכנן, הבנאי רק אם צריך (עדיף שלא תכף תבין) והמאמת ושער הבקרה הראשי.
העזר בishay וחשוב שתבין היטב כל סקיל מה הוא עושה ואיך עובד ומה התוצרים כדי שתשתמש נכון וגם הסוכנים שלך ישתמשו נכון.
כל האמצעים לרשותך. עד 100 סוכנים (עדיפות לסונאט או אופוס) שים לב שאתה בוחר רמת מאמץ מתאימה וכותב להם פרומט מתאים (יכול להתאים גם בסאלש שם הסקיל) שים לב שאתה לא נותן להם דברים שצריכים את הנקודת עצירה מולי.
משימתך לבנות מההתחלה עד הסוף את מודול דוחות  כולל הכל ,לכן חשוב שתשמור על הקונטקסט שלך.
התעלם מהכלל של אני צריך לכתוב מיגרציות חד פעמי.
אתה עצמאי וכוח השיפוט נמצא אצלך. אתה יכול לדבר איתי עכשיו בתכנון אחר כך אתה רץ לבד עד הסוף. (המכסה התחדשה)
מה שמוביל אותי בעבודה אם תתקע בלי קיצורי דרך בונים את זה נכון בצורה נכונה שלא יהיו טעויות נגררות, חשוב לנסות על כל הדברים מראש גם מה שאנחנו לא מודעים אליהם. ולבקש אפילו מהסוכנים מהן הנקודון העיוורון שלך וכו.
אתה יכול לשלוח סוכנים וורקפלואו אחד או כמה מה שתבחר.
העיקר ותקשיב טוב אין נקודות עצירה בסשן הזה אחרי שאני מאשר את התוכנית אתה ממשיך עד הסוף כולל הכל זה אומר גם אודיט סגירת מודול לפי נוהל (בדוק שהפרומט שהוא קורא הוא נכון ומעודכן) ואתה ממזג לדב וממזג לייצור בלי אישור נוסף ממני.
אני מחר רוצה לראות את המודול בייצור זו מטרתך.
כמובן בלי לוותר על איכות העבודה, ואם אתה חושב שבאמת צריך אותי ואתה לא יכול להמשיך אז תעצור לא אמנע ממך אבל אני רוצה שתהיה עצמאי בסשן הזה ושיהיה לך יכולת שיפוט טובה
```

### 2.2 RULINGS — binding, quoted, with their source

| Time | His words (verbatim) | What it decides | Source |
|---|---|---|---|
| 03:42 | *"אין נקודות עצירה בסשן הזה אחרי שאני מאשר את התוכנית… ואתה ממזג לדב וממזג לייצור בלי אישור נוסף ממני"* | No stop points after plan approval, including both merges | 🌐 extract turn 1 |
| 03:42 | *"התעלם מהכלל של אני צריך לכתוב מיגרציות חד פעמי"* | The typed-echo migration gate is waived for this session only | 🌐 extract turn 1 |
| ~04:1X | *"כן — מזג ל-dev וגם ל-main בלי לשאול"* | **The merge authorisation.** Explicit, first-person, in this chat, for **both** branches. Iron rule 10's `dev`-only carve-out is extended to `main` **for this module only, not a precedent** | 🌐 plan §2 ✅2 · 🌐 guide §9 D-9 |
| ~04:1X | *"על כולם — מיגרציות (~8) · חתימת-DoD · ריצת-הזריעה של הסיווג"* | Typed-echo waived on all three gates | 🌐 plan §2 ✅3 · 🌐 D-9 |
| ~04:1X | *"יש לי מפתח — אכניס אותו בעצמי"* + *"אסור שהמפתח יעבור דרכי"* | The Gemini key is installed by him in Supabase Secrets. **It never passes through Claude or the chat.** Never print secrets, tokens or `E2E_*` values; `.env.local` is read by scripts only, never echoed | 🌐 plan §2 ✅1 + §8 · 🌐 compaction summary |
| ~04:0X | *"המוקאפים לא מחייבים והם רק להמחשה אבל סך הכל אהבתי את המבנה"* → corrected: *"התבלבתי בשאלה האחרונה"* … *"רציתי לפי המלצתך אבל שכן תיקח את המוקאפ בחשבון מסוים אבל במידה"* | **The correction wins.** Structure/order/which tiles ⇐ mockup · labels ⇐ `spec.md §1.4` · pixels ⇐ design-contract + his taste · behaviour/data/population ⇐ the cards. Operationalised in guide §2ב C2 | 🌐 plan §2 ✅4 + §2ב |
| ~04:0X | *"מצב הטמעה צריך מצבים 0 ו-2"* | Onboarding modes 0 and 2 only; every m11 `<Hint>` carries `guided` text only; at mode 0 the page is fully usable | 🌐 plan §2ב · guide C3 |
| ~04:0X | *"רק אתה כותב היום ומנהל הכל"* | Iron rule 16 closed: one writing session. Agents never commit; the orchestrator commits by pathspec. `.agents/` and `.codex/` are not mine — do not touch | 🌐 plan §4 · §8 item 6 |
| ~04:0X | *"הייתי מנסה לצמצם לך את העבודה אם ניתן עוד טיפה עזרה מול הסוכנים"* | I manage, agents build. Every heavy read, every file written, every test run ⇒ an agent | 🌐 plan §4 preamble |
| ~04:0X | *"לא לשכוח למדוד לפני המשימה"* | Estimation record #12 opened before starting | 🌐 compaction summary · `docs/guides/01_estimation_log.md` |
| 05:19 | *"המכסה… מתאפסת עוד כ2.75 שעות, כרגע היא על כ40 אחוז… ממליץ אולי לפני פאזה 3 לחכות לאיפוס המכסה אבל לשיקולך"* | A recommendation he explicitly left to my judgement — **accepted**: Phase 3's army waited for the ~08:00 reset. Finish estimate moved to 14:00–19:00 | 🌐 extract, first-hand |
| ~06:0X | *"צריך לכתוב מסמך מסירה לעצמך, צריך להיות בו כל מה שצריך אולי אפילו תעתיק את הפרומט הראשון ששלחתי אם עוזר לך מצוטט. הכוונה לאילו קבצים לקרוא ממש חשוב ממש כמו מסמך מסירה לסשן חדש"* … *"אחרי שתכתוב אותו בצע קומפקט בצורה חכמה ונכונה"* … *"וחשוב שתכתוב לך בקומפקט מה אתה צריך לקרוא אחר כך זה מאוד חשוב"* … *"סשן חדש אמיתי זו לא אופציה אני רוצה שאתה תצליח לסיים הכל לפי התוכנית שלך"* | **This file, and what follows it:** write the handoff → compact deliberately → the compaction note must itself say what to read. The reader is me, not a new session | 🌐 compaction summary's "All user messages" list — see §0's caveat |

### 2.3 IDEAS — offered, not binding

- 🌐 *"תעזר בסוכני פייבל אם זה נותן לך יותר ביטחון אבל בקמצנות"* (compaction summary) — Fable agents are
  permitted, sparingly. **Not an instruction to use them.** The plan §3 model table is what actually governs:
  Opus/high for builders and judges, Sonnet for mechanical verification, Fable only where it earns it.
- 🌐 *"מניסיון אפשר לעשות קומפקט מוצלח פשוט צריך להכין טוב את הקרעקע לפני"* — his own experience, offered as
  encouragement for the compaction step.
- 🌐 *"רעיון טוב או שהיית משכלל אותו?"* — he invited improvement of his own handoff plan. He was not asking
  for agreement.

### 2.4 QUESTIONS he asked (answered; here so they are not re-answered as if new)

- 04:39 *"תמשיך כמו שסיכמנו לפי בתוכנית ורק מה העניין עם מודול 4?"* — answered: m11 needs
  `assignments.recommended_rank` written at invite time by module 4's Smart Match screen, so report מ17 can
  measure recommendation adoption. Two small changes, no user-visible change in m4, full m4 regression run.
- 04:40 *"הערכה לסיום וכו?"* — answered: 8–14 wall hours from approval (~04:20) ⇒ 12:30–18:30; revised to
  14:00–19:00 after the quota pacing ruling.
- ~04:0X *"הדבקתי בסאפבייס את המפתח איפה בדיוק להדביק בקוד?"* — answered: nowhere in code; the secret lives
  in Supabase Secrets and the edge function reads it from there.
- 🌐 *"הבנתי, אגב היה צריך לעשות זריעה בסוף או שהכל יסתדר?"* (compaction summary) — 💭 **I do not have my own
  answer to this recorded anywhere on disk.** If it comes up again, the substance is: the m11 seed is live
  DB rows with no re-seed script (guide §9 D-8), so nothing needs re-seeding now, but that debt is real.

---

## 3 · Reading list for the resumed session — numbered, in order, with what to take from each

**Reading rule (`session-handoff-guide.md §4א 📖):** *grep only to find WHERE, never to ANSWER; read in the
largest ranges the tool allows; a definition a number rests on gets read to its end.* The two 300 KB files
below exceed the read tool's 256 KB ceiling — grep for the anchor, then read the range.

### Must read, in this order

| # | File | What to take from it |
|:-:|---|---|
| **1** | **this file, §4 → §5 → §6** | Where we are, what runs next, what will bite. §4's commands are how you re-derive state; do not trust §4's values, re-run them |
| **2** | `docs/micro_guides/module-11.md` — **§1 status header** (top ~30 lines), then **§2ב C1–C8 in full** (grep `^## 2ב`), then **§9** (grep `^## 9`) | §1 = which phase and which branch · **§2ב is the contract every agent brief opens with** — session mode, what binds appearance vs behaviour, onboarding 0/2, RTL rules, the RPC pattern, the gates, and **C8: the exact RPC↔UI payload shape plus its amendments** · §9 = every deviation D-1…D-24 with its reasoning. **§9 runs D-1…D-24 and you need more than the six a first draft of this file named — the full map is in §3.1 below** |
| **3** | `C:\Users\ishay\.claude\plans\cuddly-tinkering-kazoo.md` | The approved plan. §2 = the four permissions in his words · §3 = my technical build rulings · §4 = phases 0–5 with who does what and how it is verified · §5 = "what counts as working" · §7 = the estimate. **This is the authority for what is still owed**; §5 of this handoff is its ordered remainder, not a replacement |
| **4** | `<scratchpad>/tasks/*.md` — see §5 for which | The agent briefs. Every one is self-contained and already carries C1–C8, the live permission matrix, and the blind-spot requirement. **Re-dispatching a phase means handing the agent its task file, not re-writing the brief** |
| **5** | `<scratchpad>/results/*.json` | What returned. **Read `not_verified` · `blind_spot` · `assumed` first** — that is where the real findings are. 📏 **10 of the 12 files carry all three; `p2v-finance.json` and `p2v-hostesses.json` have `not_verified` and `blind_spot` but no `assumed` key** — do not read their absence as "nothing assumed". Check with `python3 -c "import json,io,glob;[print(p,list(json.load(io.open(p,encoding='utf-8')).keys())) for p in glob.glob('results/*.json')]"` |
| **6** | `STATUS.md` (the top block) | The conference-day blocking task (14/10 refresh script) and the pointer discipline. **It still points at the stage-3 handoff — update it to point here in Phase 4** |
| **7** | `docs/guides/01_estimation_log.md` §12 | Record #12 is **open**. It must close with two clock times and the verdict on two falsifiable predictions |

### 3.1 · The §9 rulings you must carry — **all of them, not a favourite six**

📏 A fresh-eyes reviewer diffed the D-numbers in `docs/micro_guides/module-11.md` §9 against the ones this
file cited and found **ten missing**. Three of them are load-bearing for work that has not run yet.

| # | One line | Why the next step needs it |
|---|---|---|
| **D-15** | 🔴 **Eight conflicts between cards, mockup, spec and live data — reported by the finance builder and deliberately NOT patched** (rounding order 236,382 vs 236,380 · card מ8 stale on three numbers · the §📑ב#5 materiality floor excluding 123 of 236 projects · card מ9 self-inconsistent · bad-debt ₪ ambiguous · 80 `logistics` rows that moved between 15 and 16/09 · calendar-month vs rolling-30 · three tile labels fuller in the mockup) | **The closing audit will re-find all eight as fresh defects unless it is told they are ruled.** Each is Ishay's to rule or a Phase-4 doc reconciliation |
| **D-18** | **Ruling-33 door targets are the builders' own derivation, tagged `הנחתי`** — the ruling says every overview tile is a door, never where to. Two finance tiles are `target: null` because their pages are deferred | **This is exactly what the 12 lens verifiers are about to judge.** A verifier not told these are assumptions will report them as spec violations |
| **D-19** | **`spec.md §1.4` counts 74 tile labels and מ3's 12 are missing from it** — the 11/09 extraction read static markup and מ3's mockup renders them in JS; `check:declared-counts` cannot see it because it counts the table against itself | `spec.md` is one of the five files `check:declared-counts` polices. The Phase-4 fix must annotate §1.4 **and keep declared == counted** |
| **D-10** | Rank source is `ranked` **filtered by `assignedIds`**, before `sortByAngle` — an orchestrator ruling reconciling card ת5 with step 1.5 | Checkable: invite the first shown hostess on an event whose #1 is already assigned ⇒ stored rank must be `1` |
| **D-13** | **Stale facts in tier-2/3 docs, reported not fixed:** `assignments` 5,741 live vs 5,674 written · `params` 43⇒47 · a wrong §7.83 citation · a wrong §2/§3 pointer · "the only owner-less param" is actually five · three 04–05/09 migrations missing from `schema_migrations` | Phase 4 annotates each. **Do not "correct" the live number to match the doc** |
| **D-1 · D-2 · D-4 · D-5 · D-6 · D-7** | Closed or historical: the dead branch · the shell having no mockup (closed, Ishay deleted it) · `schema.sql` missing three columns (fixed) · the step guide's "5 דו"חות" (fixed) · a withdrawn `מתחילי` claim · מ23/מ24 deferred with a return trigger | Read them **before the closing audit** so a closed row is not reopened as a finding. D-7's lesson is the one that generalises: *an enumeration is only a control if its parts sum to the whole* |
| **D-9 · D-14 · D-17 · D-20 · D-21 · D-22 · D-23 · D-24** | His rulings · drill set = מ3·מ9 only · the window rule · rows-per-file · the rounding flip · `ReportSurface`'s five slots · the four classification facts the audit must not reopen · the quota kill | The ones a resumed session gets wrong fastest. Full wording in §9 |

### 🟡 Probably not needed — open only on a real gap, and say that you opened it

- `docs/specs/module_11_reports/processes-approved.md` (📏 **307 KB / 1,072 lines — over the read tool's
  256 KB ceiling**; grep for the anchor first). §🗳️ rulings ≈ lines 899–944 · §📐 the 23 principles ≈ 772–810 ·
  §🏷️ names ≈ 743–770.
- `docs/specs/module_11_reports/stage2-cards/cards-{finance,hostesses,customers,executive}.md` — only when a
  number or a population is in dispute. The builders already extracted what they needed.
- `docs/specs/module_11_reports/design-contract.md` §⑤ — the recharts behaviours, **already verified in a real
  browser and written back** by the foundation agent. Do not re-verify.
- `supabase/migrations/CLAUDE.md` — the DB protocol. §3 is its traps register (see §6 below for the ones that
  matter). ⚠️ **Read it with §5 step C open:** its §2 bullet *"סנכרון סכמה אוטונומי"* tells you to
  **regenerate** `docs/schema.sql`, and for this module that instruction **loses** — the ruling and the
  reason are in step C. An agent that follows the bullet deletes the curated annotations silently.

---

## 4 · State — snapshot taken **16/09/2026 08:5X**, and every claim carries the command that re-checks it

🔴 **Do not repeat any row below without running its command.** This is the rule that failed hardest in this
project's history (`~/.claude/CLAUDE.md`: a PR reported "not merged" in five consecutive reports, two hours
after it merged). **An inherited status is a claim you are making again.**

🪤 **And a measured warning about this section specifically.** 📏 A fresh-eyes reviewer checked the 08:3X
version of this table and found **4 rows already stale and 3 wrong**; by the time I re-derived them at 08:5X,
**the reviewer's own corrected numbers had gone stale too** — a commit landed, two migrations were written,
five registry rows appeared. ⇒ **Every number below is a timestamp, not a fact. The column that keeps its
value is the right-hand one.** Do not quote a number from here into a report to Ishay without re-running it.

| # | Claim (08:5X) | Mark | Re-check |
|:-:|---|:-:|---|
| 1 | **Commits ahead of `origin/dev`: RUN THE COMMAND.** 📏 Observed inside one hour: **7 (wrong when written) → 8 → 9 → 11.** The branch is `ishay/module-11-build` | 📏 | `git fetch origin -q; git rev-list --count origin/dev..HEAD` |
| 2 | **Commits not yet pushed to the branch's own remote: RUN THE COMMAND.** 📏 Observed in the same hour: **5 → 0 (fully pushed) → 1 → 3.** Any single number written here is wrong by the time you read it | 📏 | `git rev-list --count origin/ishay/module-11-build..HEAD` — **`git fetch origin` first, or it lies** |
| 3 | Working tree: modified tracked files are `src/lib/dates.js` (row 22) + the four `src/lib/onboardingCopy.m11.*.js` + the four `tabs/*Tab.jsx`; untracked are `.agents/` `.codex/` (not mine — do not touch, ruling *"רק אתה כותב היום"*), `supabase/.temp/`, four `tabs/*Tab.test.jsx`, four `tabs/<tab>/` directories, and **the uncommitted migrations (g2, d2 at 08:5X)** | 📏 | `git status --short` — 🔴 **the set changes every few minutes as the P3 builders write. Build every commit pathspec from a FRESH run, never from this row** |
| 4 | **14 migration files** `supabase/migrations/20260916*` — A·B·C·D·D2·E·E2·E3·F·F2·G·G2·H0·H1 | 📏 | `ls supabase/migrations/20260916*` |
| 5 | The live registry holds **27 m11 rows for those 14 files** (E2→3 · F→3 · F2→7 · D2→5 · the rest 1 each). Accepted, D-20 | 📏 | MCP `list_migrations` on `yfeovxppnfoafmfbdfvh`, filter `module11_` |
| 5ב | 🔴 **`20260916082900_module11_g2_rpcs_customers_fixes.sql` is on disk with NO registry row — it is written but NOT applied.** Every other m11 file has at least one row | 📏 | compare `ls supabase/migrations/20260916*` against the registry **by `name`**; a file with no matching row is unapplied |
| 6 | 🔴 **Registry `version` ≠ file timestamp.** File `20260916043300_module11_a_…` ↔ row `20260916020111 module11_a_feedback_ai_tables`: a ~3-hour UTC skew. **Compare by `name`, never by `version`** | 📏 (confirms the documented trap) | `supabase/migrations/CLAUDE.md` §3, row *"אי-התאמה בין שם קובץ המיגרציה למספר ב-DB"* |
| 7 | **16 `report_m*` RPCs + `approve_feedback_ai_run` are live** | 📏 count | `select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'report_m%'` |
| 7ב | ⚠️ **"16/16 bodies md5-equal to their files" is INHERITED from D-20's 08:0X run and I did not re-prove it — and it is now provably false for at least one function.** E3 flipped `report_m07_finance_overview` to `round(sum(…))` and D2 rewrote four executive functions; those migration files are on disk, one of them (g2) is not even applied. **The live DB is ahead of the last commit** | 💭 inherited · 📏 the E3/D2 applies are real | re-run `python3 "<scratchpad>/fn_md5.py"` **after** g2 is applied and everything is committed — that is the only moment the claim can be true |
| 8 | `feedback_ai_insights` = **426** rows; runs 5 and 6 carry `approved_at`/`approved_by` | 📏 | `select run_id,status,ok_count,model,(approved_at is not null) as approved from feedback_ai_runs order by run_id` |
| 9 | 🪤 **Approval does NOT change `status`.** Run 5 is still `partial`, run 6 is `done`; approval lives only in `approved_at`/`approved_by`. **`where status='approved'` returns 0 and looks like "nothing was approved"** — I made exactly this mistake writing this file | 📏 | the query in row 8 — read both columns, never `status` alone |
| 10 | `params` = **47** · `assignments` = **5,741** · `recommended_rank` non-null = **0** (no back-fill, by design; the first Smart Match invite after deploy writes the first one) | 📏 | one `select count(*)` each |
| 11 | 🔴 **`docs/schema.sql` does NOT yet contain the new objects** — `report_m02_exec_overview`, `feedback_ai_runs`, `recommended_rank`, `approve_feedback_ai_run` all return **0**. The second in-place refresh is genuinely owed | 📏 | `for s in report_m02_exec_overview feedback_ai_runs recommended_rank approve_feedback_ai_run; do echo "$s $(grep -c $s docs/schema.sql)"; done` |
| 12 | 🔴 **`docs/db_roadmap.md` M11-2…M11-5 all still read ⬜ "not written"** — the Phase-4 write-back has not happened | 📏 | `grep -n "M11-[2-5]" docs/db_roadmap.md` |
| 13 | `e2e/reports.spec.js` **does not exist**; `/reports` is not in `accessibility.spec.js`; `smoke-anchors.json` has no `reports` block | 📏 | `ls e2e/` · `grep -n reports e2e/smoke-anchors.json` |
| 14 | `docs/CLAUDE_CODE_LOG.md`'s newest entry is from the **previous** session (calendar colours). No m11 build entry yet | 📏 | `grep -n "^### " docs/CLAUDE_CODE_LOG.md \| head -3` |
| 15 | Estimation record #12 is **🔓 open**, ending *"בפועל: (ייסגר בסוף)"* | 📏 | `grep -n "#12" docs/guides/01_estimation_log.md` |
| 16 | Local `main` is **13 behind** `origin/main`; local `dev` is level with `origin/dev` @ `9b5ea534` | 📏 | `git branch -vv` |
| 17 | Of the eight agents launched at 08:2X: **P2-E3 finance and P2-RV hostesses have returned** (`results/p2-e3-finance.json`, `results/p2fix-hostesses.json`, both folded into commit `b3104ce2`); **P2-VF executive** has applied D2 (5 registry rows) but written no report; **P2-VF customers** has written g2 but not applied it and written no report; the **four P3 tab builders are actively writing** (nine modified files, four new test files, four new directories) | 📏 | `ls -la <scratchpad>/results/` + `git status --short` — a returned agent has written its JSON; a *working* one shows up only in the tree |
| 18 | 🪤 **The scratchpad is live and changes under you.** `tasks/p3-lens.md` appeared at 08:22, between two `ls` calls in this very session | 📏 | always `ls` the directory; never trust a file list copied into a document |
| 19 | 🔴 **TWO gate steps are RED right now.** ① `npm run check:bidi` — one hit, `src/lib/reportsCustomers.js`, the JSDoc line containing `days > 1.5×0`: a digit glued to `×` inside a **comment**, committed in `0d520fcd`, **my own line, not inherited**; the checker says explicitly that a waiver is not the fix. ② `npm run deadcode` (knip) — unused exports in files the P3 builders are writing **right now**; at 08:5X they were `medianOf` (`src/lib/reportsExecutive.js`) and `inheritCompareFormat` (`tabs/hostesses/payloadTransforms.jsx`), **but the set changed between the reviewer's run and mine, so do not carry that list — carry the command** | 📏 both run this turn, exit 1 | `npm run check:bidi > /tmp/b.log 2>&1; echo exit=$?` · `npm run deadcode > /tmp/k.log 2>&1; echo exit=$?`. **Fix both before step B's gate agent runs, or it burns a whole gate cycle** |
| 20 | Green this turn: `check:docs-structure` ✅ (115 files) · `check:declared-counts` ✅ (6 numbers) · **`check:iron-rules` ✅ (17 rules)** · **`audit` ✅ (0 findings)** · `check:context` ✅ · `npx prettier --check` on this handoff ✅ | 📏 ran this turn | re-run each; **see §5 step B for the full nine-step gate chain — two of its steps were missing from this file's first draft** |
| 21 | 🪤 **Agents write scratch files to the REPO ROOT, outside the scratchpad — check every time.** 📏 At 08:5X there were two (`header_d2.txt`, `.tmp-p3h/` with three `.mjs` files); by 09:0X **both had been cleaned up by whoever made them.** The pattern is what persists, not the filenames: they dirty the tree for the Stop hook and sit one banned `git add -A` away from being committed | 📏 | `git status --short \| grep -v '^ M'` — anything at the root that is not a known project path is agent scratch. **Delete it; never commit it** |
| 22 | `src/lib/dates.js` is modified — a **shared library outside module 11**. 📏 I read the diff: it is exactly the sanctioned change, `WEEKDAY_NAMES_HE` made `export` with a why-comment, needed because `report_m15_reliability` returns `dow` 0–6 with `chart.label_source: 'WEEKDAY_NAMES_HE'`. Nothing else in the file changed | 📏 | `git diff -- src/lib/dates.js` — **any other `src/lib/**` edit by a tab builder is out of contract** (§6) |

### How to refresh this whole section in one pass

```bash
cd /c/Users/ishay/Reg-In
git fetch origin -q; git branch -vv | grep -E 'module-11-build|^  dev|^  main'
git rev-list --count origin/dev..HEAD; git rev-list --count origin/ishay/module-11-build..HEAD
git log --oneline origin/dev..HEAD; git status --short
ls supabase/migrations/20260916* ; ls -la <scratchpad>/results/ ; ls -la <scratchpad>/tasks/
for s in report_m02_exec_overview feedback_ai_runs recommended_rank approve_feedback_ai_run; do
  echo "$s $(grep -c "$s" docs/schema.sql)"; done
grep -n "M11-[2-5]" docs/db_roadmap.md | cut -c1-120
npm run check:bidi > /tmp/b.log 2>&1; echo "bidi exit=$?"
npm run deadcode > /tmp/k.log 2>&1; echo "knip exit=$?"
```
plus the MCP calls: `list_migrations` (compare to the file list **by `name`** — a file with no row is
unapplied, §4 row 5ב), the run/insight/params counts in rows 8–10, and — before judging any number
mismatch — `select jobid, jobname, schedule, active from cron.job` (§6).

---

## 5 · What is still ahead — owners, task files, and the exact order

**Plan authority: `cuddly-tinkering-kazoo.md` §4 phases 3–5.** Nothing below needs Ishay.

### Step A — collect the eight in-flight agents (Phase 2 close-out + Phase 3 build)

| Agent | Task file | Expected result file | What to do with it |
|---|---|---|---|
| P2-VF executive | `tasks/p2-vf-executive.md` | **`results/p2vf-management.json`** (📏 read out of the brief — *not* `p2vf-executive.json`) | Findings ⇒ its own D2 fix-forward (additive only, already authorised in the brief). Known open item: m03's scatter `series` must be `[x, y]`. **D2 is applied (5 registry rows) but no report has been written** |
| P2-VF customers | `tasks/p2-vf-customers.md` | `results/p2vf-customers.json` | Same shape, migration G2 — 🔴 **written and NOT applied** (§4 row 5ב) |
| P2-RV hostesses | `tasks/p2-rv-hostesses.md` | `results/p2fix-hostesses.json` | ✅ **returned**; folded into `b3104ce2` together with `src/lib/reportsHostesses.test.js` |
| P2-E3 finance | `tasks/p2-e3-finance.md` | `results/p2-e3-finance.json` | ✅ **returned**; the ruled rounding flip to `round(sum(…))` = 19,253 ₪ (D-21) + `meta.row_total` / `columns[].sorted` on m09 |
| P3 tab builders ×4 | `tasks/p3-common.md` + **`tasks/p3-common-addendum.md`** + `tasks/p3-tab-{management,finance,hostesses,customers}.md` | `results/p3-<tab>.json` | The addendum wins wherever it disagrees with `p3-common.md`. **Actively writing right now** — nine modified files, four new test files, four new directories |
| P2-H2 sentences | `tasks/p2-h2-sentences.md` (written 08:48) | — | The most recently written brief; read it before assuming step A's list is complete |

**Then, in this order:** apply **g2** (§4 row 5ב — it is written but unapplied) · record every ruling in guide
§9 · **re-run `git status --short` and build the commit pathspec from THAT, not from §4 row 3** · sweep any
agent scratch out of the repo root (§4 row 21) · commit by explicit pathspec · push.

🔴 **The pathspec must account for `src/lib/dates.js`** (§4 row 22) — a shared library outside the module.
It is the one sanctioned cross-boundary edit; **any other `src/lib/**` change by a tab builder is out of
contract and is a finding, not a file to sweep in.**

### Step B — Phase 3b, verification (plan §4 phase 3 items 3–3ב)

🔴 **All four briefs already exist on disk. Hand the agent its file; do not re-write the brief** (§3 row 4).
📏 A first draft of this section described three of them in prose as if no file existed — the reviewer's
catch, and it would have cost three rewritten briefs plus whatever the originals had already corrected.

1. **12 lens verifiers** — 3 lenses × 4 tabs, brief **`tasks/p3-lens.md`** (08:22): spec fidelity · RTL /
   a11y / the five states · tests. **Tell them D-18's door targets are `הנחתי`** (§3.1) or they will report
   assumptions as violations.
2. **4 copy evaluators split by onboarding state** — brief **`tasks/p3-copy-eval.md`** (08:23): 2 × mode 0,
   2 × mode 2, none receiving the change log; one verdict table. Phase F of
   `ui-copy-and-onboarding-levels`, **as evaluators only**. A finding on a locked label is a row in Ishay's
   morning table, **not** a change (ruling ✅4).
3. **E2E agent** — brief **`tasks/p3-e2e.md`** (08:23): `e2e/reports.spec.js`, the `smoke-anchors.json`
   `reports` block + its `smoke.spec.js` stanza, `/reports` added to `accessibility.spec.js`.
   ⚠️ **Brief it on the triggers (§6)** — its writes fire `trg_recompute_project_status`.
4. **Gate + evidence agents** — brief **`tasks/p3-gate-evidence.md`** (08:24) ⇒ `results/p3-gate.json` +
   `results/p3-evidence.json`. Screenshots of 16 surfaces × 4 identities × 2 onboarding modes;
   **I look once**, at the screenshots and the table.

📏 **Expected result filenames, read out of the briefs themselves** (so a resumed session waits on the right
files): `p3v-<tab>-<lens>.json` ×12 · `p3-copy-<state>-<n>.json` ×4 · `p3-e2e.json` · `p3-gate.json` ·
`p3-evidence.json`. **Do not guess these** — I guessed two of step A's four and got both wrong.

🔴 **The gate is NINE steps, and a first draft of this file named five of them.** 📏 From `package.json`:

```
gate = verify && dup && deadcode && audit && check:bidi && check:context && check:docs-structure
       && check:iron-rules && check:declared-counts
verify = lint && format:check && test:run && build
```

⇒ the full chain is **lint · format:check · test:run · build · dup (jscpd 3 %, the real risk on 16 similar
surfaces) · deadcode (knip) · audit (`scripts/audit-gate.mjs`, the security-waiver gate) · check:bidi ·
check:context · check:docs-structure · check:iron-rules · check:declared-counts**. Plus `npm run test:e2e`
(⚠️ which `--grep-invert`s the smoke group — §6) and `npm run smoke` separately.
**A gate agent briefed on a five-item list reports green and then `npm run gate` fails on a step nobody
told it about — burning the exact cycle this section exists to protect.**
**Two of the nine are RED right now** (§4 row 19): `check:bidi` and `deadcode`. **Fix them first.**
**Exit codes are read out of a log file, never piped** (§6).

### Step C — the second `docs/schema.sql` refresh

🔴 **Two live instructions contradict each other here, and you are pointed at both. The ruling:**

| Source | What it says | Status |
|---|---|---|
| `supabase/migrations/CLAUDE.md` §2, bullet *"סנכרון סכמה אוטונומי"* | *"מיד לאחר החלת מיגרציה, קלוד **מייצר מחדש** את `docs/schema.sql`"* — **regenerate** from `pg_catalog` | **The older, general instruction. It loses here** |
| `docs/micro_guides/module-11.md` step 1.1 `as-built` | Refreshed **in place**, *"not regenerated — the file is a curated, annotated snapshot and a wholesale regen would have deleted the annotations"* | ✅ **This wins for m11.** It is the more specific and more recent ruling, and step 1.1 already executed it — 16 deltas patched by hand, including a 34-line `seed_registry` block that a merge had destroyed and that a regen would have silently dropped again |

⇒ **Refresh IN PLACE.** Must add: the two AI tables, `recommended_rank`, the four params, the 17 functions,
the new indexes. **Verify with §4 row 11's command returning non-zero for all four probes.**
*(If anyone later wants regeneration to become the rule, that is a change to `supabase/migrations/CLAUDE.md`
and Ishay's call — not something an agent decides mid-refresh.)*

### Step D — Phase 4, documentation ripples

Agent brief `tasks/p4-docs.md`.

🔴 **The Stop hook dictates the ORDER, and writing this list top-to-bottom gets the session blocked.**
📏 From `.claude/hooks/check-docs-updated.sh`: `docs/CLAUDE_CODE_LOG.md` and `STATUS.md` must carry the
**newest mtime** — editing any other file after them fails the check — and **any change under
`supabase/migrations/**` additionally requires `docs/db_roadmap.md` to be updated in the same session.
Three migrations (e3, g2, d2) are uncommitted right now, so that clause is already armed.**

**Write in this order:**

1. `docs/db_roadmap.md` — M11-2…M11-5 flipped ✅ + §10 rows (**mandatory, the migrations demand it**).
2. `docs/PROJECT_MASTER_sec7.md` — the m11 RLS matrix row, corrected **once**, with all three writes (D-3).
3. `docs/PROJECT_MASTER.md §6` debts: re-seed script · schema-diff gate · the `bak_*` drop decision ·
   the five owner-less params · the migration-ledger gap · **the stale CR idiom in
   `docs/guides/prompt_library.md`** (🔴 **not** root `CLAUDE.md` — see §6 and §7) · the gated customer
   list (D-16) · the four D-23 classification items.
4. `docs/CODE_MAP.md` · `src/modules/11_reports/CLAUDE.md` · the micro-guide's status header, `as-built`
   lines and §9.
5. **Last, and in this order:** `docs/CLAUDE_CODE_LOG.md`, then `STATUS.md` — **including re-pointing
   STATUS's handoff pointer at this file** (§6: a new session's opening banner is built from it).

### Step E — Phase 5, closing audit and merge

1. **Closing audit in a fresh Opus agent** — `tasks/p5-close.md`, which runs
   **`.claude/skills/module-close/template.md`** (📏 verified present, 57 KB) verbatim. **Check first that
   the template it reads is current** (Ishay asked for this in his first prompt:
   *"בדוק שהפרומט שהוא קורא הוא נכון ומעודכן"*). **Hand it §3.1** so it does not reopen D-15's eight
   conflicts or D-23's four classification facts as fresh defects. DoD typed echo is waived (D-9). It writes
   `close-findings-module-11.md`, publishes an HTML report as an Artifact, and **does not merge**. Its sweep
   must cover the whole DB's `rls_enabled_no_policy`, including the six `bak_*` tables and
   `project_changes` / `seed_registry` — each gets a policy or a written triage.
2. **One fix round** ⇒ full regression ⇒ verdict.
3. **Me, the irreversible half:** `gh pr create` ⇒ `dev` · CI green ⇒ `gh pr merge` · pull · `gh pr create`
   `dev`⇒`main` · CI green ⇒ merge · `gh api` shows a **Production** deployment on the merge SHA.
4. **Post-merge agent:** flip the STATUS row with the evidence cited, the guide header to `✅ MERGED`, the LOG,
   and **close estimation record #12 with two clock times** — (a) green commit on the branch + the report,
   (b) merged to `main` + Production deployment green — plus the verdict on both falsifiable predictions
   (*"verifiers find ≥3 defects the builders missed"* — already true several times over; *"jscpd trips at
   least once"* — not yet, re-measure per §8 item 7 rather than quoting a figure).

### The only things that still stop for Ishay

- A product gap that blocks a **whole surface** (C1: everything smaller gets the most spec-faithful reading,
  a `הנחתי` tag, a §9 row, and a line in his morning table).
- Anything touching existing data, permissions, or an irreversible action **beyond** what §2 authorises —
  his standing rule, and the merges are already authorised so they do not qualify.
- Dropping the six `bak_*` tables. **His decision, recorded, not mine** (D-11).

---

## 6 · 🪤 Traps — built by grepping the mechanisms, not from memory

*(`session-handoff-guide.md §4א`: what this session did not hit is exactly what the next one will. Every row
below was found by reading the mechanism this turn, and names where to re-read it.)*

| Trap | Why it survives everything | What to do |
|---|---|---|
| 🔴 **The Stop hook exits 0 when the tree is clean** | `.claude/hooks/check-docs-updated.sh` — its own comment says so: *"סשן שקימט הכול לפני הסיום **עוקף את כל אכיפות-התיעוד** בשקט"*. **Committing everything before finishing silently disables the LOG/STATUS/micro-guide/db_roadmap enforcement** | The enforcement is not a safety net for this session. Phase 4 (step D) is the safety net, and it is on me |
| 🔴 **The same Stop hook enforces an ORDER, by mtime** | Same file, enforcements 1–3: `docs/CLAUDE_CODE_LOG.md` and `STATUS.md` must be **newer than every other changed file**. Touch anything after them and the session is blocked at Stop. Enforcement 0ב adds: **any change under `supabase/migrations/** requires `docs/db_roadmap.md` in the same session** | **Write LOG and STATUS last, in that order** — §5 step D is sequenced for exactly this. Three uncommitted migrations already arm the db_roadmap clause |
| 🔴 **Three pg_cron jobs mutate the tables the reports read, overnight** | 📏 `select jobid, jobname, schedule, active from cron.job` returns three **active** jobs: `module3-quote-expiry` (01:00 daily — expires quotes, reads `params`) · `module1-login-attempts-cleanup` (01:30) · `module6-event-finished` (02:00 daily — **updates `projects.project_status`**). Every acceptance number in this build (19,253 ₪ · the mockup's four anchors · the aging snapshot · the Gini figures) was measured against live data, and this session runs past 01:00–02:00 | **A baseline that moved overnight is not a regression the code caused.** Before treating any number mismatch as a defect, check whether a cron job touched its population. Re-check: the query above |
| 🔴 **Row-level triggers fire on the same tables, on every write** | 📏 `select … from pg_trigger where not tgisinternal`: **`trg_recompute_project_status` fires on `assignments`, `logistics` AND `projects`** · `sync_assignments_on_project_date_change` (projects) · `sync_assignment_event_date` (assignments) · `enforce_hostess_min_wage` (hostesses) · `enforce_quote_in_progress_lock` (quotes, quote_services) | **The E2E agent and `npm run smoke` write real rows to the real database.** Inserting one assignment silently recomputes a project's status, moving the population of several report surfaces between the write and the assertion — **a flake that will read as a report bug.** Brief the E2E agent on this |
| 🪤 **A new session's opening banner will contradict this file** | 📏 `.claude/hooks/session-start-context.sh` (registered `SessionStart` in `.claude/settings.json`) extracts the **ACTIVE STEP straight out of `STATUS.md`** — which still points at the stage-3 handoff — and separately prints *"⚠️ סשן אחר ערך קבצים בשעתיים האחרונות — כלל 16… הישאר בקריאה/Plan Mode"* whenever mutation markers are recent, **which our own agents produce** | **Do not obey a banner that names the stage-3 handoff or tells you another session is writing.** The rule-16 warning here is our own agents' footprint. Fixing the banner = fixing `STATUS.md`, which is §5 step D item 5 |
| **Shared `src/lib/**` is not a tab builder's to edit** | D-22 forbids builders touching `components/**`; **nothing in the briefs forbids `src/lib/**`**, and an edit there is a cross-module regression no m11 test would catch | Exactly one such edit is sanctioned: `src/lib/dates.js` exporting `WEEKDAY_NAMES_HE` (§4 row 22). **Verify every other `src/lib` entry in `git status` before committing** |
| **The Stop hook fires while agents are writing** | Agents writing under `src/modules/11_reports/` mark the tree; the hook then demands a micro-guide update on **my** turn | Record a real checkpoint line in the guide (not a timestamp refresh), and hold the turn with `<scratchpad>/wait_results.py <seconds>` |
| **Bash-dialect hook blocks piping** | `.claude/hooks/block-shell-dialect-mixup.sh` blocks PowerShell syntax in the Bash tool, and gate output piped to `tail`/`head` has been refused | Redirect to a log file, then `echo exit=$?`, then read the file |
| **`protect-frozen-files.sh` blocks edits to committed migrations** | append-only enforcement; a **draft** migration not yet committed is freely editable | Fix forward in a **new** file, never edit a committed one |
| **`grep -c $'\r'` is not a CR gate in this Git Bash** | Returns 0 on a real CRLF file (measured by two independent agents with truth-table fixtures, D-12) | `perl -ne '$n+=tr/\r//; END{print "CR=$n\n"}' <file>` — must print `CR=0`. 🔴 **And the stale idiom lives in `docs/guides/prompt_library.md`, NOT in root `CLAUDE.md`** — root §3 says only *"אימות כמות בתי CR בקובץ: חייב להיות 0"* and quotes no idiom at all. Locate with `grep -rn "grep -c \$'" --include=*.md .` The Phase-4 ripple must aim at `prompt_library.md` (§5 step D item 3) |
| **MCP `apply_migration` truncates at ~90 KB** | 📏 measured this session (D-20). Silent: the statement simply ends | Apply per function, < 60 KB per call, and **hash every applied body against the file** (`<scratchpad>/fn_md5.py`). This is why 11 files produced 21 registry rows |
| **Registry `version` ≠ file name timestamp** | 3-hour UTC skew; a future CLI compare by version would re-run applied migrations | `supabase/migrations/CLAUDE.md` §3: **compare by `name`** |
| **`REVOKE … FROM PUBLIC` does not block `anon`** | Supabase grants to `anon` by name, not through `PUBLIC` | Always `revoke execute … from public, anon, authenticated` explicitly, then grant to `authenticated` |
| **RLS on with no policy returns 0 rows and `error: null`** | `supabase/migrations/CLAUDE.md` §3 + `src/modules/11_reports/CLAUDE.md` §3 | Never render a network/permission failure as "no data" — tri-state, `PermissionAwareEmpty state="error"` + *"נסי שוב"* |
| **`check:declared-counts` is hard-coded to five m11 files** | 📏 read this turn in `scripts/check-declared-counts.mjs`: `screens-approved.md` · `spec.md` · `docs/guides/modules/module_11_reports.md` · `design-contract.md` · `docs/micro_guides/module-11.md` | Any edit to those five must keep every declared number equal to the counted one |
| **`lint-staged` rewrites `*.{js,jsx}` on commit** | `.husky/pre-commit` → `eslint --fix` + `prettier --write` | Code is reformatted at commit time; never `git add -A` — always `git commit -- <paths>` (iron rule 10: a shared index once swept 9 foreign files including a migration) |
| **`npm run test:e2e` excludes a whole group** | 📏 the script is `playwright test --config=playwright.e2e.config.js --grep-invert בדיקת-עשן` — **the smoke tests are deliberately excluded** | `npm run smoke` is a separate gate. "E2E green" is not "smoke green" |
| **`format:check` OOMs on the whole tree** | Measured 11/09 (estimation record #11) | Run per directory and say so |
| **`check:context` fails without a module `CLAUDE.md`** | It walks the instruction tree | `src/modules/11_reports/CLAUDE.md` exists (created minimal, now real); the close audit refreshes it |
| **`recharts` has never rendered in jsdom here** | Component tests `vi.mock('recharts')`; real rendering is only proved in Playwright | A green unit suite proves nothing about the chart |
| 🔴 **Approval is in `approved_at`, not `status`** | §4 row 9 — I tripped on it while writing this | Read both columns |
| **`ReportSurface` refetches on `requestKey`** | The drill object is serialised with `JSON.stringify`; unstable key order ⇒ a refetch loop | Build drill objects in a fixed key order; count network calls when drilling |
| **The customer filter is a second RLS-gated read** | `listCustomers()` on `'לקוחות'` ⇒ RECRUIT/STAFF get `[]` with `error: null` | Degrades honestly to *"כל הלקוחות"*; the real fix is a registered debt (D-16), not a patch |
| **A totally failed AI run returns HTTP 200** | `classify-feedback` reports failure in the body | Branch on `body.status`, never on `res.ok` |
| **`.agents/` and `.codex/` are not mine** | Untracked, another tool's | Never stage them; iron rule 16 |

---

## 7 · What Claude got wrong today — and the corrected wording

*(The section only a reader of the conversation can write. Each was verified against the guide or the
conversation before being listed.)*

| The claim I made | What was actually true | Corrected wording |
|---|---|---|
| The surface catalogue listed **מ17** as a drill report | 📐13 names reports 1·6·16·4 = מ3·מ9·מ13·מ5, and *"ריכוזיות"* in `spec.md §✅` is מ5 (customer concentration), not מ17's shift concentration | **Drill set = מ3 · מ9 only** for this conference; מ13/מ5 return with the deferred set (D-14). Caught by the foundation agent as a C7 conflict, not by me |
| `grep -c $'\r'` is the CR gate | It returns 0 on a real CRLF fixture in this Git Bash | The perl idiom (§6). Two agents measured it with truth-table fixtures; D-12 |
| *"Root `CLAUDE.md` §3 still quotes the old CR idiom"* — written here as fact, and it scheduled a Phase-4 doc ripple against that file | 📏 **False.** Root §3's CRLF row says only *"אימות כמות בתי CR בקובץ: חייב להיות 0"* — the idiom appears nowhere in `CLAUDE.md`. It lives in `docs/guides/prompt_library.md` | **The ripple target is `docs/guides/prompt_library.md`.** 🔑 **And the failure mode is the one that matters:** I copied the sentence out of micro-guide §9 D-12 without checking it — *"restating an item from a handoff or an earlier message is making the claim again, at full confidence, with none of the checking"* (`~/.claude/CLAUDE.md`). **The wrong half of that rule is the inherited half, and this is it.** The error is also still live in D-12 itself — Phase 4 fixes the register, not just this sentence |
| 🔴 **The first draft's own acceptance test (§9) carried hard numbers — "7 ahead of `origin/dev`, only 1 pushed" — and both were wrong** | 📏 It was 8 ahead when written (and internally contradicted this file's own row 2, which said 3 pushed + 5 unpushed = 8), and 3 commits were pushed, not 1 | **The acceptance test would have REJECTED a correct answer and ACCEPTED a false one** — it is the gate the resumed session grades itself against, so a wrong expected-answer is worse than no test. **Structural fix, now applied: §9 asks for the COMMAND and its freshly-run output, never a memorised number.** This is `session-handoff-guide.md §4ב` rule 3 — *"a hard number goes stale fast; write the command that measures, not the result"* — and I broke it in the one section where breaking it does the most damage |
| `ReportTable` could key rows on `drill_key` | `drill_key` is an **object** (`{kind:…}`) — React stringifies it to `[object Object]` and every row collides | `rowKey()` returns a stable string: `row_key` → `JSON.stringify(drill_key)` for objects → `page-index`. Fixed in `cd6869b5` |
| The hostess-pay tile should round per row | My earlier wording produced **19,257 ₪** against the baseline's **19,253 ₪** | **`round(sum(actual_hours × hourly_rate_snapshot))`** — the baseline is the acceptance criterion, and m8's salary SSOT rounds per row to agorot, so the whole-shekel figure that matches what is paid is round-of-sum. D-21. **The fixer was right to report the divergence rather than reconcile it** |
| The Gemini 500s were a temperature problem | They were transient provider capacity; the function was **discarding the provider's error body**, so nothing could be diagnosed | Capture 600 chars of the provider error, retry 5xx. The guide's documented Gemini request shape was also stale |
| The free-tier limit would clear if we waited | 📏 It is a **daily** quota, not a per-minute one — waiting could never have helped | Switch model and enlarge the batch. Recorded in step 2ב.4's as-built |
| `p3-common.md` told four builders to read `results/p3-foundation-handoff.md` | **That file never existed** | `tasks/p3-common-addendum.md` corrects it and wins wherever the two disagree. **A dead path in a brief handed to four concurrent agents is the §3🅐 mechanical check catching a real failure** |
| The foundation's single `renderExtras` slot was enough | Four concurrent builders were about to invent four different ways to place §⑩ hints, chip filters, label mapping and the run bar — or copy the shell and trip jscpd | Five documented slots + automatic `meta.extra_tables` and `columns[].sorted` rendering, covered by `ReportSurface.test.jsx`. **Builders never touch `components/**`** (D-22) |
| (while writing this file) *"nothing is approved"* — `status='approved'` returned 0 | Runs 5 and 6 **are** approved; approval is `approved_at`/`approved_by` | §4 row 9. 🔑 **I measured my reconstruction of the definition instead of the definition** — the exact failure class `~/.claude/CLAUDE.md` names, caught here only because the number contradicted a commit message |

---

## 8 · Blind spots — concrete, checkable, and not decoration

1. **D and G were applied by agents that were then killed, and nothing verified them.** 📏 `results/` contains
   no `p2v-management.json` and no `p2v-customers.json`; the registry shows `module11_d_rpcs_executive` and
   `module11_g_rpcs_customers` applied. **Eight of the sixteen RPCs are live on the builders' own word only.**
   The 08:2X re-dispatch (P2-VF executive / customers) closes this — **if it does not return, this gap is
   still open and must not be treated as closed by the fact that the functions exist.**
   Check: `ls <scratchpad>/results/ | grep -E 'p2vf|p2v-(management|customers)'`.
2. **`p2fix-finance.json`'s own blind spot, in its author's words: the previous-month snapshot filling five
   finance tiles is a reconstruction nothing external checks.** It agrees with a second query the same agent
   wrote minutes earlier — *"the agreement proves the two runs are consistent, not that the definition of
   'the aging snapshot one month ago' is right."* The open question is `v_asof - 30` vs the same calendar day
   of the previous month. Check: read `per_finding` in that file, then the mockup's four anchor numbers.
3. **`feedback_ai_insights.project_id` is globally unique and `loadCandidates` skips already-classified
   projects** ⇒ run 5's 40 rows, classified by a model that will never be used again, **cannot be
   re-classified without deleting them first**, and nothing in the repo documents that. D-23 ③.
   Check: `select constraint_name from information_schema.table_constraints where table_name='feedback_ai_insights'`.
4. **One quote in 426 is not a substring of its note** — project 1249, one homoglyph (Arabic YEH U+064A where
   the note has Hebrew YOD U+05D9). If report 20 presents the quote as the customer's own words, that claim
   is 99.8 % true and no CHECK constraint or human eye will find the 0.2 %. D-23 ②.
   Check: `select project_id from feedback_ai_insights i join projects p using (project_id) where position(i.quote in p.feedback_notes)=0`.
5. **`SUPABASE_ACCESS_TOKEN` in `.env.local` returns 401 from the Management API** — the CLI deploy path is
   dead; only the MCP deploy works. If a later step reaches for the CLI it will fail in a way that looks like
   a code problem. D-23 ④.
6. **No role is `blocked` on `'דו"חות'`** — all five hold view or edit, so the page gate's deny path is
   provable only for `anon`. The tab masking is where real blocks exist (STAFF = מנהלת לוגיסטיקה sees four
   masked tabs — **the correct result, not a bug**). Measured by the P1 verifier; recorded, not fixed, because
   the permission matrix is Ishay's.
7. **The estimate's second prediction ("jscpd trips at least once") is not yet falsified but is trending
   false.** 📏 Do not carry a figure: the foundation agent reported 0.82 %, the 04:46 `dup.log` says 0.84 %,
   a reviewer measured 0.78 % — three numbers for one metric, none reproducible from the others.
   Re-measure with `npm run dup > /tmp/dup.log 2>&1; echo exit=$?`. If it never trips, record #12 must say
   the prediction **failed**, not quietly drop it.
8. ✅ **This was my blind spot, and it has now been closed — with the result the guide predicted.** The first
   draft said *"a fresh-eyes agent on this file would be the real test, and I did not spend one."* One was
   then spent. 📏 **It returned 43 claims holding, 6 wrong, 4 stale, 5 unverifiable and 11 missing** — and
   the worst was §9's own acceptance test carrying two wrong numbers, i.e. **the gate this file grades
   itself against would have failed a correct answer** (§7). My own re-read had found none of them.
   ⇒ **`session-handoff-guide.md`'s measurement holds: self-catch on one's own artefact is zero, and it is
   structure, not talent.** 🔴 **The live consequence for the reader: this second version has not been
   reviewed either.** Everything above was re-derived from disk this turn, but nobody else has checked
   *these* sentences. Treat §4 as a snapshot, §5 as the plan, and re-run before quoting.
9. 💭 **What the reviewer could not settle, and I could not either:** five claims are marked unverifiable
   because they cannot be reproduced read-only — the CRLF fixture behaviour (D-12, two agents measured it,
   neither re-ran it), the ~90 KB `apply_migration` truncation, the `format:check` OOM, and the diagnosis
   that the Gemini 500s were transient capacity. **They are consistent with everything observed and none is
   proven.** If one turns out false, the cost is a wasted workaround, not a wrong number on screen.

---

## 9 · Acceptance test — answer these four before acting

*(Per `session-handoff-guide.md §3🅓: the outgoing session writes the questions, the incoming one answers cold.
Mark each answer **"from this file"** or **"from memory"** — a "from memory" answer is the signal that the
compaction dropped something.)*

1. **How many commits are on the branch, how many are unpushed — and did you RUN something to find out?**
   🔴 **There is deliberately no expected number here.** The correct answer is the freshly-run output of
   `git fetch origin && git rev-list --count origin/dev..HEAD` and
   `git rev-list --count origin/ishay/module-11-build..HEAD`. **Any answer quoted from this document, from
   §4, or from memory is a FAIL even if the number happens to be right.** 📏 This question carried hard
   numbers in the first draft and both were wrong within the hour — see §7's last row. The three values
   this session has already passed through are 5 unpushed → 0 → 1.
2. **Runs 5 and 6 of the classification engine — are they approved, and which column proves it?**
   *(Expected: yes; `approved_at`/`approved_by`. **`status` still says `partial` and `done`.** Anyone who
   answers by `status` has just reproduced the error in §7's last row.)*
3. **What are the next three actions, in order, and who performs each?** *(Expected: finish step A — apply
   the unapplied g2 migration, collect the remaining agents, rebuild the commit pathspec from a fresh
   `git status`, delete the two root scratch artefacts, commit and push (me) → dispatch step B from the
   four briefs that already exist in `tasks/` — `p3-lens` · `p3-copy-eval` · `p3-e2e` ·
   `p3-gate-evidence` (agents) → the second **in-place** `docs/schema.sql` refresh (agent).
   **Not** "start Phase 3" — its builders are already running. **Not** "write the step-B briefs" — they
   exist. **Not** "regenerate schema.sql" — see §5 step C.)*

4. 🔴 **Bonus, and it is the real test: name the two gate steps that are RED right now, and say how many
   steps `npm run gate` actually has.** *(Expected: `check:bidi` and `deadcode`, and **nine** steps —
   `verify` itself expanding to four more. An answer of "five steps" means you are reading the first
   draft's list, which is the exact failure §5 step B now warns about.)*

**And the mechanical half (§3🅐), which takes under a minute:** open every path this file names — a dead path
means stop and report. Confirm `git status` and the branch match §4. Confirm no unfilled
placeholder survives above.

## §4ב · State refresh — 16/09/2026 17:5X (written by the orchestrator after the second usage-limit kill; supersedes §4 where they differ)

> Every line below carries its re-check command. Inherited lines in §4 are older.

| # | Claim | Re-check |
|---|---|---|
| 1 | Code HEAD is `b199fa22 m11 guide: D-33 ג€” second usage-limit kill, pacing rule (ג‰₪7 concurrent agents, one lens verifier per tab, resume not restart)` — the last CODE commit is `af4ef4b9` (tabs reconciled + G3); later commits are guide rows D-30…D-33 only | `git log --oneline -8` |
| 2 | Branch fully pushed as of 08:5X; commits after that are local until the next push | `git fetch origin && git log --oneline origin/ishay/module-11-build..HEAD` |
| 3 | **Phase 2 is complete**: 17 functions live, every body md5-equal to its LATEST file (D2 executive · E3+H2 finance m07 · E2+H2 m08/m09/m12 · F2+H2 m14/m15/m17 · F2 m16 · G3 m20/m22 · G2 m19/m21) | `python3 <scratchpad>/fn_md5.py` vs `select proname, md5(prosrc) from pg_proc …` (MCP execute_sql) |
| 4 | Migration files on disk: A B C H0 H1 D D2 E E2 E3 F F2 G G2 G3 H2 (16); registry rows ≈ 32 for 16 files (D-20) — a Phase-4 `db_roadmap §10` row per FILE | `ls supabase/migrations/20260916*` · MCP `list_migrations` filtered `module11` |
| 5 | Phase 3: four tabs built, reconciled to the shared shell; module suite 208/208 at `af4ef4b9`; uncommitted in the tree = the resumed shell fixer's partial edits (`reportsFormat.js`, `ChartCard.jsx`, `KpiTile.jsx`, new `ReportsShellContext.jsx`) | `git status --short` · `npx vitest run src/modules/11_reports` |
| 6 | Running at 17:5X (resumed after the 11:5X kill, they keep their context): P3-FIX-A shell (8 items incl. the rolling 12-month preset + per-tab default) · P2-FIX-B server migration `i1` (12 items over 10 functions) · P3-E2E (`e2e/reports.spec.js` etc., nothing on disk yet) · lens Workflow v2 (`wf_192e6b91-531`, 4 per-tab verifiers + refuters) · M4 hostess deep-link (`?hostess=<id>`) | `ls <scratchpad>/results/` for `p3-fixA.json`, `p2-fixB.json`, `p3-e2e.json`, `p3v-<tab>.json`; the Workflow notification |
| 7 | Not yet started: fix round from lens findings (resume the four tab builders by SendMessage — ids in the orchestrator's transcript; else re-dispatch from `tasks/p3-tab-*.md` + a findings list) · copy evaluators ×2 (`tasks/p3-copy-eval.md`, mode via PostgREST intercept, never a DB write) · gate + evidence agents (`tasks/p3-gate-evidence.md`) · Phase 4 docs (`tasks/p4-docs.md`, incl. schema.sql refresh IN PLACE and the ripples listed there) · Phase 5 close (`tasks/p5-close.md`) · PR ⇒ dev ⇒ main · post-merge · close record #12 | this table |
| 8 | Ishay's rulings of 17:4X: *"לפי המלצות"* on the eight morning-table items (module-11.md §9 D-27, D-28, D-29, D-30, D-31 and the H-4/⑧19.2/⑧H2 items) and *"בלי פינות פתוחות"* — the 12-month default pill and the hostess-card door are built today, not deferred | this file; the orchestrator's transcript at 17:4X |
| 9 | Pacing after two kills (D-33): ≤ 7 concurrent agents; killed agents resumed, not restarted | `docs/micro_guides/module-11.md` §9 D-33 |

## §4ג · STOP 16/09/2026 20:3X — Ishay: *"תעצור בנחת… המכסה מתחדשת עוד שעתיים"*

| # | Claim | Re-check |
|---|---|---|
| 1 | Code + docs HEAD `988adeb7 m11 phase 4 + i2: i2 migration (9 RPCs: m03 split panels + whole-₪ rates, m09 label rows/textLtr/owner column/over_60, m14 doors, m15 thresholds + ruling 38, m17 wording, customers compare labels — applied, byte-equal), docs ripples (schema.sql refreshed in place with 17 functions and the live counts, db_roadmap ledger + RLS matrix row, PROJECT_MASTER §6 debts, CODE_MAP, step guide, spec §1.4 labels, card corrections, HANDOFF story ④ ✅, estimation record, module-9 ripple, LOG, STATUS); finance tab: bucket mapping deleted (server labels), 📐18 contact column tests. Suites 469/469.`, pushed; working tree clean (the killed E2E re-run left no partial edit — `git diff -- e2e/reports.spec.js` empty at 20:3X; HEAD 731969e7's spec is the green one) | `git status --short` · `git log origin/ishay/module-11-build..HEAD` |
| 2 | Every agent was STOPPED at 20:3X on Ishay's word (evidence · copy 0 · copy 2 · E2E re-run · gate) — none wrote its report; only partial logs under `<scratchpad>/results/` (`gate.log` is the gate's log, its npm process may have run to the end — read the exit line before trusting it) | `ls <scratchpad>/results/p3-evidence.json p3-copy-*.json p3-gate.json` ⇒ absent |
| 3 | **What remains, in order, when the quota resets (~22:3X):** ① gate agent (`tasks/p3-gate-evidence.md` P3-G, Sonnet) · ② evidence agent (P3-S, Opus, mode 2 via the PostgREST intercept, never a DB write) · ③ two copy evaluators (`tasks/p3-copy-eval.md`, modes 0 and 2) · ④ E2E re-run on the settled tree + two durable cases (bidi order on מ9 with the contact column; chart-card wait before each axe scan) — re-dispatch from `tasks/p3-e2e.md` with those two additions · ⑤ one fix round if ①–④ find anything (resume the builders by SendMessage where the session still holds them; else re-dispatch from `tasks/p3-tab-*.md` + a findings list) · ⑥ closing audit: `tasks/p5-close.md` + `tasks/p5-close-addendum.md` (fresh Opus agent; DoD typed-echo waived D-9; writes `close-findings-module-11.md` incrementally) · ⑦ one fix round · ⑧ `gh pr create` ⇒ dev, CI green ⇒ merge · PR dev ⇒ main ⇒ merge · `gh api` Production deployment on main (Ishay's authorization is D-9, verbatim) · ⑨ post-merge STATUS/guide flips · ⑩ close estimation record #12 with the two clock times | this table; `docs/micro_guides/module-11.md` status header |
| 4 | Pacing: ≤ 5 concurrent agents from here (D-33); a Workflow fan-out is charged all at once | §9 D-33 |
