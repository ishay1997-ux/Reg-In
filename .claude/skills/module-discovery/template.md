# Module Discovery — the full procedure

> **Read `SKILL.md` first** — it carries the archetype classification, the outputs matrix, and the
> five cross-cutting disciplines. **This file is the procedure.** Everything here is a standing
> rule; where a ruling is Ishay's it is dated and quoted verbatim in Hebrew.
>
> **Fill in before starting:** `[N]` = module number · `[שם]` = its Hebrew name · `[eng]` = the
> English slug used by its step guide. **The spec folder is `docs/specs/module_[N]_[eng]/` —
> identical to the step-guide filename** (`docs/guides/modules/module_NN_*.md`).
>
> 🔴 **Every fact in this file is contestable.** If you measured otherwise, correct it with the
> measurement — do not conform to what is written here.

---

# §0 · What this session is, and what it produces

This is a **product-definition session**, not a build session. The distinction is not semantic and
it costs money:

**A build session needs the "what"** — what to implement; the reasoning was already settled, and
re-reading it wastes context.
**This session needs the "why"** — because its output is **the reasoning Ishay will defend out loud
in front of an audience.**

🔴 **Therefore: never inherit a reading instruction written for a different session type.**
A document whose header says *"building X? read §11 and that's it"* is talking **to a builder**.
Obeying it here means reading the build spec and missing the evidence the conference will ask about.
**The test is cheap: who is this instruction talking to?**
*(Measured 05/08/2026: module 4's Discovery prompt quoted exactly such a sentence, the session
obeyed it precisely, and therefore never read the evidence sections. Ishay caught it. Self-catches
that session: zero.)*

🔴 **And the frozen spec is not an authority here — it is raw material. That is this session's
founding assumption.** Ishay wrote it himself before he knew the domain, in his words:
> *"ישן, לא מעודכן, נכתב על ידי שאין לי ידע מספיק רחב בעולם הזה — לקחת אותו בערבון מוגבל ולהטיל
> בו ספק, למרות שלדעתי רובו נכון."*

**The mockups are tier 4, and some of their details are wrong.**

🔴 **Extension added 13/08/2026, because the rule above alone did not prevent the error: `C5` is
evidence of what was once considered — never a prediction of what another module will build.**
**You may cite it for what exists** — a business process, a formula, a constraint, something already
built. 🚫 **You may not derive from it what a screen whose Discovery has not yet run will show.**
*(Anchor: on 13/08 `C5 §5.8` was cited as if it governed how module 5 would filter — while module 5's
Discovery had not run, and exactly like module 6 it will find wrong things there. In the same file,
tab counts for מ6 and מ8 were taken from `C5` as fact — and the מ6 count was already contradicted by
a ruling written two screens further down in that same document. Ishay caught it:*
> *"אתה ממשיך עם C5 כמו שהבנת הוא 80 אחוז נכון — ופה בדיוק הבעיה."*)*

🔑 **The test, and it is cheap: am I quoting what *was once true*, or predicting what *someone else
will decide*?**

⚠️ **Consequently: *"C5/C6/the mockup says so"* is not a justification — it is evidence.** The
justification is always **what is correct on screen and in the field**; agreement with the source is
at most **support** for it. **A claim that is nothing but a citation is copying, not deciding** —
exactly like a world convention adopted without a fit check (§5).
🔑 **The test: if all three sources said the opposite, would my answer change? If yes — I did not
decide, I quoted.**

➕ **And check the list, not the item.** *(Measured 06/08/2026: one item was checked against the
sources, found consistent, and the topic closed — while **two other items in the same list were
missing from the mockup entirely.** Per-item checking produces a "consistent" that is both true and
misleading.)*

**What you produce:** ① the Hebrew spec set — `processes-approved.md` · `screens-approved.md` ·
`world-sources.md` · `spec.md`, **each written in its own stage** *(⚠️ **not one PRD** — assembly
into a single file was cancelled by Ishay's ruling 06/08/2026)* · ② approved mockups · ③ a journal
the next stage reads. **Which of these are conditional on the module's archetype: `SKILL.md`
§outputs matrix.**

**What you do not do:** no product code · no blueprint · no writes to the DB · no migrations.

🔴 **And what these outputs actually become — this is what determines how detailed they must be:**
**the spec and mockups you produce become the *sole source of truth* for the build, replacing the
frozen spec. Someone new, with zero context from this conversation, will build from them — and will
not ask you questions.**
⇒ **Every hole, guess and assumption you leave becomes a silent decision no one will see.**
*(This is precisely why this conversation exists: previously the blueprint leaned on the frozen
spec — and that is where the misses and the mid-build stalls came from. Ishay's ruling, 06/08/2026.)*

🚫 **Do not load `module-blueprint` / `module-build` / `module-close`.** Their triggers are similar
enough to fire by accident, and they will take you into an entirely different flow.

---

# §1 · The top mine — the most important thing in this file

🔴 **You will filter on Ishay's behalf, and the filtering is invisible to him.**

Through the session you will face large bodies of material — research findings, spec items, design
options — and bring him what you judge relevant. **That is correct and desirable.** But **a wrong
question he catches; a wrong filter he cannot catch by definition** — he never saw what you dropped.

⇒ **Every time you reduce N items to M, print all N with a verdict for each: in / out and why /
already exists here. And report both numbers.** Not a summary — **a full table.**

*(Anchor: on 05/08/2026, 18 research findings were filtered to four decisions. Ishay asked
"כתבת סינון — למה התכוונת?", the full table was shown, **and three dropped items resurfaced because
of it** — one of them a deviation-from-world-practice that would have gone undocumented. **He caught
it by chance. That cannot be by chance.)*

🔑 **And this applies to the register sweeps too** — §Stage 0. Register filtering is exactly the same
invisible filtering this section exists to prevent; the old wording simply never named the registers.

## 🚫 Forbidden — with the reason, because "don't" without a reason gets rationalised away

- **Do not ask Ishay a question that already has an answer.** *(→ §3 — this starts with a search,
  not with a question.)* **Reason:** it burns his energy on what he already decided, and teaches him
  the registers are unreliable.
- **Do not decide for him on product, process, permission or UX.** **Reason:** only he knows how it
  works in the field, and **he cannot review code** — if you decide quietly, it enters the spec as
  though it were measured.
- **Do not write to disk before approval** — except this list, **and it is all one logic: you record
  what was already approved, you do not propose something new.**
  ① the journal · ② write-back of a ruling to the registers (`PROJECT_MASTER §7` and debts §6) ·
  ③ `STATUS` + the main log at the end · ④ mockups he approved ·
  ⑤ **the stage drafts** — `processes-approved.md` · `screens-approved.md` · `spec.md` — **each only
  after its content was approved in chat** · ⑥ `world-sources.md` · ⑦ `docs/db_roadmap.md` — a DB
  requirement that arose from an approved surface.
  🔴 **Exception added 13/08/2026 — the skeleton file (Stage 0ד) is created empty *before* approval**,
  because it is the session's memory, not a proposal. **Content still enters it only once approved.**
  🚫 **Everything else — specs, documents, skills, code — is not written without explicit approval.**
- **Do not write to the DB, run a migration, or inject test rows.** **Reason:** one live Supabase
  project, no test environment, and data contamination has already happened and required a restore.
- **Do not dispatch an agent or research without Ishay's explicit approval** — not even a single
  agent. **Reason:** he pays and waits in real time. One line: "שווה לשלוח סוכן שיבדוק X?" and wait.

---

# §2 · Measurement discipline — four rules, each of which has failed in practice

**① Never accept a number from this file or from any document — measure it yourself and report what
you found.** A number in a document is **evidence that someone once counted**, not a current fact.

**② Read every register item to its end, not just the tag at its head.**
🔴 **Status tags go stale.** *(Measured: two items were tagged "open" at the head and carried "closed"
at the foot — both had been ruled a week earlier. A session that reads only the tag brings Ishay two
settled questions.)*

**③ 🔴 "Not built" ≠ "not decided".** An item can be **fully ruled and exist zero times in code**.
A build spec's dependency list enumerates **what is missing in the implementation**, not what is open
for decision. *(Measured in one session: two things were presented to Ishay as open questions, and
both had been ruled earlier. Same error class twice in one day.)*

**And a contradiction inside a document is a signal to read more of it — not a question for Ishay.**

**④ 🔴 An "open" marker that *you* write into an approved file carries its own check — otherwise it
is an assumption, not a finding.** *(Added 07/08/2026 after this was the day's recurring failure.)*
> **Mandatory format:** `🔵 פתוח — נבדק מול <sources> · DD/MM`
> **Without that line the marker is inadmissible**, and whoever reads it will bring Ishay a question
> he already answered.

**The sources that must be checked, all three:** the open-questions register · the debts register ·
**and every research/rulings document belonging to the module — in full, not only the section you
were pointed at.**
🔴 **Why this is a rule and not advice:** §2① forbids taking a number from a document, and §3 forbids
asking what was already answered — **both govern what you *read*. Neither governs what you *write*.**
*(Measured 07/08/2026: an approved spec file marked two items "to be ruled" while both were ruled —
one of them 379 lines above **in the same file** — and three later sessions inherited the marker.
⚠️ **That lesson was already written there as prose, and the items were added 140 lines below it.**
Hence it lives here as a greppable format, not as a warning.)*
✅ **And the converse holds equally: do not mark "open" what you are entitled to decide.** A reversible
technical decision is yours — **manufacturing openness that does not exist is the same disease in a
mirror.**

---

# §3 · Before any question — search

Before you phrase any question for Ishay, search for it in three places: **the open-questions
register** · **the debts register** · **and every research/rulings document that exists for this
module**.
**A question that already has an answer is not a question — it is a read that did not happen.**
**Found that it was ruled?** Say so explicitly, quote the ruling and its date, and move on. **Do not
reopen it.**
⚠️ **One exception:** a ruling found by grep is evidence that a decision was made — **not that it is
still correct**. If something changed since that might void it — **surface it to Ishay, and whether it
stands is his call.**

---

# §4 · How to talk to him — this governs more than the stages do

**🔴 Uncertainty about a *process* is never a question.** How it works in the field, who gets what,
when — **declare your understanding and invite correction**, with a **concrete scenario**: a real name
from the data · a clock time · a number · a click · and the trap the person could fall into.
**An abstract declaration gets a nod; a concrete one gets knocked down in one line — and that is the
entire point.**
⚠️ **Ishay is a student, not a domain practitioner.** A process question forces him to **invent** an
answer he does not have, and an invented answer enters the spec as though it were measured.

**A question is reserved for a genuine product fork** — two legitimate options only he can choose
between.

**Recommendation before options. 3–4 decisions per round, no more.** One background line each, full
detail only on "פרט לי". **His default should be one tap on the recommendation, not an analysis
exercise.**
**"מספיק להיום" is legitimate at every stop point** — and at the end of every round write
**"סגרנו N מתוך M · הבא בתור: X"**, otherwise he has nothing on which to base a decision to stop.

**🔴 An idea is not a ruling.** When he says "אולי כדאי ש…" — that is an **idea**. Record it under
`/רעיונות-לבדיקה` in the journal and test it like any other option, **including when it conflicts
with a previous ruling of his.** **A ruling is quoted verbatim and binds; an idea gets tested.**
Without that separation you become a yes-man.

**And every number and date carries its source in parentheses.** It costs two words, and lets him
catch a wrong **source** rather than only a wrong reading.

---

# §5 · World-practice check — when, and how not to come back with recall

**When:** where there is a real gap or a real choice — not as ceremony on every detail.
**In addition:** in every process declaration, **one anchor line even when there is no gap** —
"במערכות דומות זה נראה כך (מקור), ואצלנו כך"; identical ⇒ write **"זהה למקובל"**; no actual search
⇒ **"מהידע שלי, לא אומת"**.
**Why even without a gap:** the gap clause fires from **Claude's own doubt**. A process that seems
reasonable to you gets no comparison, **and Ishay never learns there was anything to compare.**

**🔴 And the answer is always two-part:** *"this is the convention **and it fits here because X**"* —
or, stronger, *"this is the convention, **and I deliberately deviated, because X**"*. **A convention
adopted without a fit check is copying, not deciding** — and some conventions solve problems that do
not exist here (scale, multi-tenancy, regulatory audit). **A conscious deviation must be recorded**,
because the conference will ask about it.

**Three rules for a research agent** *(only after Ishay's approval — §1)*: **(a)** demand a cited
source or the sentence "מהידע שלי, לא אומת" — an agent returns **recall, not search**, unless you
demand otherwise · **(b)** split by **domain**, not by repetition — two agents with the same question
return the same thing · **(c)** what it **searched for and did not find** is worth as much as what it
found, sometimes more.

**Output:** `world-sources.md`, **organised by the ruling each source supports** *(Ishay presents at
a conference: "ככה מקובל" without a source is not an answer there)*, **plus an explicit rejection
list** — conventions considered and declined, with the reason. 🔑 **The rejection list is the part
that proves judgement rather than collection.**

---

# §6 · The stages — and the persistence law that governs all of them

🔴 **This conversation is longer than one session, therefore every stage ends by writing to disk —
not at the end of the process.**
**The test: a fresh session, with no context whatsoever, opens the closed stage's draft and continues
from the next stage without asking anything.** *(Ishay's ruling 07/08/2026.)*

**🏷️ Each draft carries one tracking table, maintained at every stop — not only when the stage ends:**
**item (process/surface/chapter) · state (✅ approved / 🔶 draft / ⬜ not yet) · pointer (mockup/section).**
**This is the table that already works in practice** — `screens-approved.md` §"מצב" in module 4 — **not
a new table to invent.** Without it a fresh session reads content and does not know what needs
approval — **and reopens what was already ruled.** **Mark explicitly in the file's opening line where
you stopped and what the next item is**, otherwise a fresh session cannot tell "finished" from
"interrupted".
⚠️ *(Corrected 07/08/2026 — the previous wording, a "five-line status header", was never produced in
practice: grep on both approved files of module 4 returned zero matches for each of its five
components. **An instruction that does not actually happen is not a continuity mechanism; it is a
hope.**)*

🔴 **One status table per file** *(added 13/08/2026)*. **A document built by accretion produces items
that are simultaneously open and closed** — measured: six such items, and a 172-line structural repair.
**One table, one place, and every state change updates it in the same turn.**

**✍️ Who may edit a previous stage's draft:** **Stage 2 may correct `processes-approved.md`** when a
surface exposes a process error · **Stage 3 may correct both** when assembly exposes a contradiction ·
**and a session continuing within the same stage may complete cards, not rewrite an approved card.**
🔴 **In every case: a dated line, out loud — never silently.**

**🔤 Letter-to-number mapping** *(the letters א–ז are retained as sub-stages because
`processes-approved.md` and `screens-approved.md` cite "שלב ו" and the journal cites "Stage א";
replacing them would break those)*:
**Stage 1 = א · ב · ג** · **Stage 2 = ד** · **Stage 3 = ו · ז** · **and "ה" is no longer a stage**
*(it became the session-budget rule)*.

---

## 🚦 Stage 0 · Intake — all mechanical, all before any conversation

> 🔴 **This is the stage that was absent on 13/08/2026, and everything it would have found was found
> late and in reaction to Ishay's questions.** **There are no questions for Ishay here. There is
> `grep`, `SQL`, and reading.**

### 0א · Two thirty-second checks

**🅰️ Does the spec folder already exist?** `ls docs/specs/module_[N]_*/`
**Exists ⇒ read its status table and continue from "the next item". Does not exist ⇒ you are starting
from zero** — **regardless of what `STATUS.md` or the log claim.**
🔴 **Why this is a check and not an assumption:** **on 13/08/2026 both `STATUS` and the log declared
that module 6's stage 1-א had been "presented to Ishay, approved" — and the folder did not exist.
Zero bytes had been written.** *(This is the specific form of "resume from disk, not narration" in
this flow — the global file states the principle; this is the command.)*

**🅱️ Classify the module** — `SKILL.md` §0א. **State out loud which archetype, and therefore which
conditional outputs apply.**

### 0ב · 🔴 The three sweeps — together, now, output as a table

**① Register sweep, in both directions. `grep`, not reading by eye** *(reading by eye missed 12 items)*:
```
grep '🚧 מ[N]' docs/PROJECT_MASTER.md              # debts owed to / by this module
grep -E 'מ[N]' docs/PROJECT_MASTER_sec7.md         # its §7 items
grep -rn 'מ[N]' docs/micro_guides/ src/modules/*/CLAUDE.md   # debts that live only in code docs
```
**Output a table of every line with a verdict — covered / not covered — and report both numbers**
(§1 applies here in full).

🔴 **And the reverse direction, which no register holds: what must this module *supply* so that others
can work?** **Sweep `PROJECT_MASTER §5`** — who consumes its data, and what do they expect to receive.
*(Measured: the first direction missed **an entire surface** — module 6 owes work inside module 2's
client card, and the surface list went 7→8 — plus a §7 item that was closed that same session without
anyone knowing it existed. **Ishay caught both with one question — "אספת הכל הכל?".** The second
direction found three debts that lived only in code-doc files.)*

**② Data sweep — the form depends on the archetype:**

| Archetype | What you sweep |
|---|---|
| **🖥️ owns a table** | **Column by column from the live DB:** for each — **who writes it · who displays it · and if nobody, is that deliberate** |
| **👁️ read-only** | **Source-per-number:** for every number that will be displayed — which column feeds it, **and who writes to that column today** |
| **🎛️ settings** | **Row by row over the parameter table** |
| **⚙️ engine** | **Trigger by trigger:** what fires it · what it writes · what happens on failure |

🔴 **Why this is separate from ① and not a duplicate:** **the register sweep answers *"what has someone
already recorded"*; the data sweep answers *"what exists that nobody has touched"*. A column nobody
recorded anything about cannot appear in any register — by definition.**
*(Measured 13/08/2026: after the register sweep had already caught 12 items, Ishay asked "התייחסנו
לזה?" about four feedback columns — and **15 of `projects`' 30 columns turned out to appear nowhere
in the spec**, on the module's own table. **Three real gaps** surfaced: the feedback fields ·
`project_bonus`, which had no write path at all · and the project owner. **Ishay caught it; the sweep
that did run could not have.**)*
⚠️ **The output is not "no findings" but a table:** every column, and against it who writes and who
displays. **A column with neither is a finding — either it is redundant, or a surface is missing.**

**③ Requirement extraction from the frozen spec** *(or from whatever does exist, if it has no section)*
**at the resolution of a single requirement** — field · action · number · validation · rule ·
enforcement · status transition.
🔴 **One sentence in `C5` sometimes contains three requirements. Break it apart.**

### 0ג · 📒 The requirements ledger — Stage 0's output, and what holds everything else together

**One table at the head of `processes-approved.md`. One row per requirement from all three sweeps:**

| # | Requirement | Source | Classification | Where handled |
|---|---|---|---|---|
| | *(short quote + exact source)* | `C5:NNN` / `🚧 מN` / column | ⬜ / ✅ covered / ✅ **reasoned rejection** / 🔴 unhandled | ruling or "—" |

🔑 **Three classifications, and "reasoned rejection" is a success, not a hole:** `PROJECT_MASTER §1`
holds that **a reasoned rejection is stronger than "I built everything"**. *(In module 6: **13 reasoned
rejections** — all of which would have been built had `C5` been treated as a specification.)*

⚠️ **Why a ledger and not a check at the end:** module 6 had none, so coverage was only measurable at
the end — the reverse-coverage check ran **after** `spec.md` had already been handed off, and found 2
requirements that had fallen through. **The ledger makes coverage measurable at any moment.**

🔴 **Every "deferred to module N" that Ishay approves is recorded immediately as a `🚧 מN` line in
`PROJECT_MASTER §6`.** That is the only register module N's opening reads (`grep '🚧 מN'`), and
`module-blueprint` mandates it explicitly. **A rejection without a §6 line is a silent debt** — it
lives only in your draft, and module N will never find it.

### 0ד · Create the skeleton now

Create `processes-approved.md` containing: **the requirements ledger · an empty status table · and a
heading that says where we stopped.**
🔴 **From here on, every ruling is written into it the moment it is spoken.**
*(§8 already mandates recording a ruling immediately — **but its target is `discovery-log.md`, which is
in English and Ishay does not read it.** Measured: on 13/08 he asked "מזה ה-3 שורות של שינוי תכולה?" —
the rulings were recorded, in a place he does not read.)*
⇒ **The Hebrew file is the conversation's memory, not its summary.** Without it the conversation is
the only memory, and it gets erased.

**🛑 Stop 1 — the first, and short:** present the classification · the three sweeps as tables · and
the requirements ledger. **Ask exactly one question: "מה מהרשימה הזאת מפתיע אותך?"** — that is the
question that returns the most.

---

## 🧭 Stage 1 · Processes ⟵ produces `processes-approved.md` + `world-sources.md`

### א · Reading and overview map

Read the module's spec sections, the registers, the **live** schema (not only the snapshot), the DB
change map, the mockups, and the existing code. Present in Hebrew: the module's purpose · the process
map · **every surface** · what exists and what does not · what is settled versus open.
**End with at most 3 questions, only if needed to choose where to start.**

⚠️ **"Surface" is not only a screen:** tabs · popups · public pages with no login · **and email
templates** *(module 6 proved email is a surface: two templates were required, and two existing ones
**lie**)*.
🔴 **And the surface list is derived from the requirements ledger, not from the spec** *(measured: a
list derived from the spec **grew** once the sweep ran)*.

**🛑 Stop — he approves the surface list. Blocking.** Without approval there is no `M` — the round
line says "סגרנו N מתוך **M**", stage 2 builds a card per surface, and stage 3 audits coverage against
this list. **An unapproved list is a denominator nobody agreed to.**
**➕ The approved list goes straight into `processes-approved.md`** as the status table — item · state
(✅/🔶/⬜) · pointer. ⚠️ **Verify yourself that it is actually there** — grep for this table in module
4's `processes-approved.md` returned zero rows despite this same instruction; do not assume it was
written because it is written here.

### ב · Aligning the process map

**Before describing a single process — agree on the list.** Bring the processes and sub-processes that
are **missing** — including what you found in the world and we do not have — each with a verdict:
in / out and why / deferred to another module. **🛑 Stop: he approves the list.**
🔴 **Every approved "deferred to module N" ⇒ a `🚧 מN` line, immediately** (see Stage 0ג).
**This applies equally to the reasoned rejections in chapter 8 of stage 3.**

### ג · Process by process

For each process: **a full story from beginning to end** *(not an arrow diagram — a diagram gets a
nod)* · who starts it and when · what gets saved · permissions · **what can go wrong and what the user
sees then** *(real edge cases from the business process — not invented ones to look thorough)* · a
world-anchor line · and its relation to the others.

🔴 **➕ In every process card, a separate line: every status the process needs · who writes each
transition · and its time anchor.** **Why this is mandatory and not nice-to-have:** the blueprint runs
a DB challenge that explicitly requires *"every status the processes need exists; **state transitions
have defined writers** and time anchors"* — **and if you have not ruled who writes a transition, it
will rule for you, or discover the gap mid-phase 1.**

🔴 **➕ And a status transition is validated against how the row is actually born** *(added 13/08/2026)*.
*(Measured: the rule "first human action = an `assignments` row **or** a logistics row" would have
fired at birth, because logistics rows are created automatically by the approval RPC — making the
initial status unreachable. The fix: "a logistics item that **left** `not_started`". **A trigger rule
never checked against the creating RPC is a guess.**)*

**⚙️ For an engine module** there is still a process card — it is simply invisible. **"Who starts it —
and nobody" is a legitimate answer** *(module 6 set the precedent: a process whose only initiator is
`pg_cron`)*. The card carries: what fires it · what it writes · what happens on failure · and what a
human sees if it never ran.

**🛑 Stop per process:** "כך הבנתי את ההחלטה: …" and wait. Do not move on without explicit approval.

### ג2 · Cross-module contracts

For every module this one touches: **what we read · what we write in their tables · and what we dictate
to them.** 🔴 **Every dictation becomes a `🚧 מX` line in `PROJECT_MASTER §6` in the same turn.**
**For a read-only module this is nearly the entire module.**

### 📁 Written at the end of Stage 1

- **`docs/specs/module_[N]_[eng]/processes-approved.md`** — a card per process, in Hebrew, at the level
  of detail from which screens are built. **The card carries:** name and purpose · who starts it and
  when · the flow as a story · what is saved · **statuses + transition writer + time anchor** ·
  permissions · what breaks and what the user sees · relation to other processes.
- **`world-sources.md`** — §5.

---

## ⏱️ Session budget rule — not a stage, applies to all of them

🔴 **This is the rule whose absence cost the most.** **The problem was never the prompt's length — it
was the amount of work in one session.** **A surface ≈ 85K tokens.**

⇒ **2–3 process cards per session, and after each one — stop, write to disk, commit.**
⇒ **2–3 surfaces per session. Not eight.**
· **Stop at a clean card boundary — never at a stage transition** *(measured: the session that was a
loop-continuation was 2.4× denser in product decisions; the compaction landed exactly at the
transition)*
· **Commit after every approved card** ⇒ an interruption costs half a turn
· 🚫 **And no compaction: a fresh session + an acceptance test.** **Compaction does not filter errors —
it replicates them faithfully** *(measured: a summary carried a wrong "deviation from C5"; what fixed
it was reading the source)*.

⚠️ **The signal that the budget broke is not the clock — it is Ishay's sentence:**
> *"אתה קצת מציף אותי ואנחנו מאבדים דברים בשיחה."*

**When that is said, the budget ran out several turns ago.**

🔑 **And the attribution test that prevents the root cause:** **if the answer is layout · sorting ·
colour · what-you-see — that is Stage 2. Record it and move on.** *(Measured: a substantial part of
module 6's session was spent designing the overview screen **inside** the process stage, and that is
what made it feel endless.)*

**And at the end of every round, one line:** "סגרנו N מ-M · הבא בתור: X · 'מספיק להיום' לגיטימי ·
ומה שעדיין פתוח: …" ⚠️ **The tail is not decoration:** measured 3 times that Ishay asked "עניתי על
הכל?" — **that check should not be on him.**

---

## 🖼️ Stage 2 · Surfaces ⟵ written per surface, not at the end of the stage

> **Conditional — runs when `M ≥ 1`.** An engine module with no surfaces produces instead: a work card ·
> a trigger map · **and a rendered email template** where it sends mail.

### ד · Surface = mockup

**🔴 Stages ד and ה were merged — Ishay's ruling 06/08/2026, after two verbal screen cards that were
not understood.** In his words:
> *"מודה שלא כל כך הבנתי… אתה רוצה אולי **תמיד לעשות מוקאפ כפי שאתה מבין**, ואז מקסימום אתקן אותך?"*

⇒ **Draw first. There is no "verbal card then mockup", and no separate stage deciding whether a mockup
is needed.**
**HTML, not PNG** *(so Claude can read it back)* · **real data at real scale** · **and a palette pulled
from `src/`, not from a previous mockup** —
`grep -rhoE "(bg|text|border)-[a-z]+-[0-9]{2,3}" src/ | sort | uniq -c | sort -rn`.
*(⚠️ Deliberately without a hardcoded family list: a closed list **confirms what is already known and
cannot discover a sixth family** — exactly "do not hand the checker the expected answer".)*

⚠️ **The caveat that must survive the merge: a mockup alone hides the rules** — it shows *what it looks
like*, not *how it is counted*. ⇒ **Alongside it, only the rulings a picture cannot show** (definitions ·
time windows · what is counted by what · permissions · states not on screen).

**🏷️ Every card and every mockup carries a sources line:** 🌱 pulled from the DB · 🎭 invented demo ·
📐 derived from a model. **The reason is structural, not "because they'll ask at the conference":** a
mockup with invented data **looks identical** to one showing real behaviour, and a build session reads
both with equal trust. ⚠️ **And you mark against the source, not from memory** *(measured: in the first
card that carried this line, **two of four** details marked "from the DB" were not there)*. 🚫 **And you
do not change the demo — you label it.**
➕ **Every mockup showing time states its own "today", and the dates must line up against it.**

### 🌊 2א · The contract wave — before any drawing

**Two agents in parallel, both writing to a file:**

| | What |
|---|---|
| **Design contract** | palette **from `src/`** · font · semantic colour rules · RTL rules · **and an HTML skeleton to copy** |
| **Data set** | real data from the DB · labelled demo · **and one shared "today" for all surfaces** |

🔴 **Without a contract: N drawers ⇒ N designs.** **Without a data set: a project that appears in one
screen vanishes in another.**
⚠️ **And a working file that an approved document cites must enter the repo.** *(Measured:
`_mockup-data.md` was cited **12 times** in approved files and **did not exist in the repo at all**.)*
🔴 **And the design contract itself is a defect source:** *(measured — a bidi rule in §6 of the contract
produced the same directional bug in 5 mockups; 14 occurrences fixed.)* **A contract defect multiplies
by N. Have the contract reviewed before the production wave, not after.**

### 📐 The card structure written beside the mockup — eight sections, and that is all that is written

| # | Section | Why a picture is not enough |
|:-:|---|---|
| **1** | 🔴 **Click map: what is clickable · what it does · where it leads** *(a table, one row per interactive element — including navigation, tabs and filters)* | **A button, a link and bold text look alike — and the difference between "acts" and "routes" is a product decision.** *(Ishay, 06/08: "שלא יהיה בלבול מה כפתור ומה מוביל למה?", then "זה לא כפתור נכון?" — **the picture could not tell him.**)* |
| **2** | **The one decision + who makes it** ⇒ any element not serving it — justify or remove | A picture shows **what there is**, not **what for**. *(This is the only answer that beats "יותר מדי מידע פה, לא?")* |
| **3** | **A source for every number** — named column · explicit calculation · **and the time window** | A picture shows `45`, not *"events in the last quarter, computed from `assignments`"*. **A number without a home is a blocking finding.** |
| **4** | **States not on screen** — loading · **truly empty vs empty-after-filter** · error · blocked action · success | **A mockup draws only the happy state** |
| **5** | **Permissions** — who sees · who edits · **and what disappears for whom** | Cannot be drawn |
| **6** | **Definitions behind a word on screen** — "דחוף = 72 שעות" | **A word on screen does not reveal the rule behind it — and the blueprint will build the rule** |
| **7** | **Validations, per field:** what must be valid · what happens when it is not · **and exactly what the screen says** | `module-blueprint/template.md` §7 holds a dedicated DoD box for validations ⇒ an omission here falls through at module close |
| **8** | **Every detail whose only source is the mockup, or on which the spec is silent — marked "מהמוקאפ / אפיון-שותק — לאישורך"** | Mockups are a **limited-liability** reference: neither reproduced blindly nor dropped silently |
| **9** | 🔴 **Conditional — only if the surface writes to the DB without normal permission/role/login: a dedicated security section — who writes · to which rows · to which fields · under what conditions** | A picture does not show a write mechanism; such a surface is usually the only path that departs from the per-role RLS model |

🚫 **What is deliberately not written: layout · order · density · colour · emphasis — the mockup is the
source and it prevails.** A card describing them inflates itself **and may contradict the picture beside
it.**

### 🗄️ At the end of every surface, before moving on — what it requires from the DB

One question: **"מה המשטח הזה דורש מהמסד שעדיין לא רשום?"** — a new column · a new table · a policy · a
constraint. **What comes up goes into `docs/db_roadmap.md` in the same turn, not at the end**
*(iron rule 13ב: in a spec session, which does not write migrations, the target is `db_roadmap`)*.
🚫 **You do not write a migration and do not touch the DB — only record what will be required.**

🔴 **If the new mechanism is anon-callable / public / reachable without permission — read `db_roadmap.md`
in full (not a targeted grep) and look for a precedent for that risk shape before writing the line.**
*(This is exactly the mechanism that found, in module 4, that a new function of that kind needed rate
limiting — because `login_rpc_calls`, an exact precedent, already sat a few lines above in the same
file. A targeted grep at the insertion point would not have exposed it; a full read did.)*

🔴 **And do not write "recorded" without verifying by grep that it is there.** *(Measured 06/08/2026: a
"what this implies for the DB" section explicitly declared that the day's additions were recorded in
`db_roadmap`, listing two columns — **both were 0 there and 0 in `schema.sql`.** **The blueprint would
have read "recorded" and not checked.**)*

➕ **And in the same turn — four checks proven to catch findings in practice:** every column name in the
card against `schema.sql` · every label against the mockup, word for word · every displayed number with
an explicit column/calculation · every clickable element in the mockup present in ① the click map.
Output: a findings table, reported to Ishay, corrected only with his approval — never silently.

**🛑 Stop per surface.**

### 🌊 2ג · Cross-surface pass — what no per-surface verifier can see

**Locked vocabulary** *(**10 phrasing contradictions** were found this way in module 6)* · visual
consistency · coverage against `M`.
*(Measured: a round covering four surfaces at once found 5 findings that each surface's own approval
had missed — a per-surface run would have caught them more cheaply.)*

### 📁 Written at the end of every surface — immediately after its approval

- **`screens-approved.md`** — the card in the eight/nine-section structure, **and the status table at
  the head of the file updated in the same turn** (⬜→🔶/✅ + mockup pointer) — **this is not a separate
  action, it is part of "approving the screen".**
- **The mockup:** draft in `docs/mockups/<topic>-screen/` · **approved in `approved/` inside it**, named
  `NN_<name>_approved.html`.
- **🔄 And stage 2 may correct `processes-approved.md`** when a surface exposes a process error — **in a
  dated line, out loud, never silently.**

---

## 📦 Stage 3 · Handoff ⟵ produces `spec.md`

### ו · Assembly — in Hebrew

🔴 **Remember who the reader is: Claude, who will silently fill every hole you leave.**
⚠️ **And "assembly", not "writing from scratch":** most of the content was written in stages 1–2. **Here
you verify every chapter has a home, and write only what has none.**
**What does not go in:** numeric success metrics — there are no real users, and an invented KPI is
exactly what he would have to defend. In its place: **"מה ייחשב עובד"**, in words.

**🔴 Every chapter opens with 2–3 lines of plain Hebrew — "what this is and why" — with the precise
detail beneath.** Ishay reads the top layer and understands the module; Claude reads everything.

**The chapters, and every one has a home — otherwise it is written, approved, and disappears**
*(Ishay's ruling 07/08/2026)*:

| Chapter | Home | Written in |
|---|---|---|
| **3 · 4** processes | `processes-approved.md` | Stage 1 |
| **2 · 5** permissions and screens | `screens-approved.md` | Stage 2 |
| **7** data model | **`docs/db_roadmap.md`** *(rule 13ב)* | Stage 2, per surface |
| **8** scope boundaries and rejections | **`PROJECT_MASTER §6`, a `🚧 מN` line per rejection** | at approval |
| **10** what differs from the frozen spec | `discovery-log.md` | throughout |
| **0+1 · 6 · 9 · 11 · 12** | **`spec.md`** | Stage 3 |

📌 **Chapter 6 (algorithms + the why):** if the module has a dedicated algorithm document, that is the
home and `spec.md` only points at it.

### 🔴 `spec.md` is not a 12-chapter PRD — five things, and no more

*(Cancelled by Ishay's ruling 06/08/2026; expanded from three to five on 07/08/2026, because "three
only" left chapters 9 and 11 — two of the things Ishay approves himself — with no file at all.)*

**① A pointer** to the approved files and the mockups — **without duplicating a line** ·
**② A 3-line opening paragraph** — what the module is and for whom ·
**③ The contract items** *(§11 below)* ·
**④ "מה ייחשב עובד"** and **"מה הוכרע מול מה נשאר פתוח בכוונה"** ·
**⑤ "מה אסור לבלופרינט לנחש"** — **in full.**

**The rationale:** the spec in the repo **is not an academic artefact — it is a working tool with one
job: that Claude builds without guessing.** ⇒ **Its quality measure is falsifiable and is not
readability: if the build came out right, it sufficed.**

🔑 **⑤ is the output without which the rest has no value**, because its content is **measured facts that
break a build silently.** *(The sharp example: a table under deny-all returns **zero rows with
`error: null`** ⇒ **the screen lies, it does not fail**, and no test will catch it.)*

🔴 **`spec.md` must not tell the blueprint which registers to skip.** *(Measured 13/08/2026: it
instructed the blueprint not to read `db_roadmap`, claiming it was "deliberately empty of this module".
It was already wrong when written — 3 rows at 17:00 and 14 more at 18:58. **A compliant blueprint would
have skipped 18 DB requirements.**)* ⇒ **State what to read. Never what to skip.**

➕ **And in the same turn: a line in the step guide §⑥1 pointing at the folder** — that is the file
Ishay actually pastes from. 🔴 **Verify yourself whether the line is already there.**

### 🛡️ Cross-check before handoff — a closed list *(Ishay's ruling 07/08/2026)*

🔴 **Stage 3 is the last control before the blueprint** — whatever remains contradictory or missing here
**becomes code.**
⚠️ **Therefore the check is defined and not left to interpretation.** In his words:
> *"זה נתון לפרשנות… כל אחד יכול לעשות בקרה מסוג אחר וככה דברים אולי יתפספסו."*

**Six cross-checks. Each produces "found / not found", not a feeling:**
1. **Label vs label** — a term appearing in two files with different wording *(`processes-approved` vs
   `screens-approved` vs the mockups)*. **Locked vocabulary is contract item ①.**
2. **Number vs number** — the same datum in two places with different values *(counts, thresholds,
   weights, quotas)*.
3. **A ruling with no expression** — a process ruling with no trace in any screen card. 🔑 **This is the
   check that returned the most:** in the 07/08 round it produced **nine** findings, all of them
   "already-ruled-elsewhere" — i.e. **none was visible on a normal read.**
4. **Column name vs `docs/schema.sql`** — exists? spelled right? on the right table? *(contract item ④)*
   🔴 **And the snapshot trap: late `ALTER` statements sit *after* the `CREATE TABLE` block** ⇒ reading
   only the block returns "the column does not exist" for a column that exists. *(This broke two
   measurements in one day.)*
5. **DB requirement vs `docs/db_roadmap.md`** — every column/table/policy the spec assumes exists:
   **verify by grep, not by declaration.** ⚠️ **Measured that a declaration lies:**
   `processes-approved.md` explicitly declared "what was added today is recorded in `db_roadmap`" and
   listed two fields — **both were 0 there.**
6. **➕ Reverse coverage — against the requirements ledger** *(added 13/08/2026)*. Every ledger row must
   map to a ruling or to a recorded rejection. **A row with neither is a silent omission.**
   *(Measured: this check ran **after** handoff in module 6 and found 2 requirements that had fallen.
   With the ledger in place from stage 0, it is a lookup rather than an excavation.)*

🚫 **What you do with a finding: report it to Ishay and fix it with approval. Do not fix silently and do
not decide alone** (rule 1).
⚠️ **And "zero findings" is a legitimate output** — but only after all six ran in fact, and you said
they ran.

### 🔴 A fresh-context reviewer — mandatory, and twice

**When: ① at the end of Stage 1** *(before drawing — ambiguity there multiplies by N)* · **② before
handoff.**
**What it gets:** the approved files and the mockups — **without the conversation, without the reasoning
that produced them.**
**And two questions only, because "check this" returns "looks fine":**
> **① Which claims here lack a source — verify each one against the repo yourself.**
> **② What does this spec not mention, that the blueprint will need?**

🔑 **The second is what finds omissions, and it works only if the reviewer goes and searches — not if it
reads the document.**
⚠️ **And do not substitute your own re-read for it:** measured that Claude catches **0** defects in an
artefact it wrote itself, against **21 (6 blocking)** from a fresh-context reviewer. **Every mechanism
that did work compared against an external anchor.**

### ➕ A blind-spot pass — a separate block, before the final question

"הנה מה שאני לא בטוח לגביו / מה שיכול להפתיע אותנו במודול הזה" — **what a senior engineer would think to
check here that Ishay did not think to ask.** Then: **"על מה לא שאלתי ושווה שתספר לי?"**
⚠️ **A separate block, not folded into the final question** — folded, it disappears.
🔴 **And a blind spot must name something concrete and checkable** — a file, a mechanism, a scenario
someone could go verify true or false. **"אין" is a legitimate and preferred answer over invention.**

### ז · Saving and closing

**The path is named, not "by convention": `docs/specs/module_[N]_[eng]/`** — the folder name identical
to the step guide. **Inside it, and this is the complete list:** `processes-approved.md` ·
`world-sources.md` · `screens-approved.md` *(when `M ≥ 1`)* · `discovery-log.md` · **and `spec.md`**.
🚫 **No additional file without approval** — this folder is what the blueprint opens; a one-off handoff
prompt, a draft or a note do not belong in it.
⚠️ **But a working file that an approved document cites is not "additional" — it is required** (see 2א).

**🛑 Handoff in two turns:** first a **key list** — one line per chapter, "what is inside and what
differs from what you approved". Only then **three separate rulings: scope boundaries · "מה ייחשב עובד" ·
"מה אסור לנחש"** — **because these were born inside the document and were never approved**, while
everything else was approved item by item along the way.
**12 chapters for one approval, at the end of a long session, turn "מאשר" into the path of least
resistance.**

**Then:** report in one line what was saved and where — **without asking approval for the path**
*(Ishay has no way to prefer one folder over another, and would approve blind — which trains the habit
that his approval is not understanding)*. Then: **① print every surface from stage 1-א with covered /
not covered / not required** · **② close the journal: what remains open, and what you would do
differently.**

### 🔴 The write-back — this is what makes a spec a thing that exists

| To… | What |
|---|---|
| **`PROJECT_MASTER §7`** *(the file: `docs/PROJECT_MASTER_sec7.md`)* | every closed item — **the token, not only the narrative.** The `grep` other modules run sees only the token |
| **`§6`** | every `🚧 מX` created |
| **`db_roadmap`** | **every DB requirement.** 🔴 **This is the register the blueprint reads — not the spec** |
| **The tally line in §7** | recount and verify |

⚠️ **The measured failure:** 3 items were declared closed in the spec **and remained 🟡 in the register**,
and one was **half-closed** — the narrative said "closed", the token did not. **Caught by a
fresh-context agent, not by re-reading.**
🔴 **And this is iron rule 13(א): §7 first, verbatim, before any ledger or citation that reflects it.**

---

# §6ב · 🌊 The agent-wave playbook

**The one law: rulings happen in the conversation with Ishay. Everything else — agents.**
🔑 **The sharpening without which it misleads: the agents are not an execution arm but a *discovery*
arm.** *(A control wave returned 21 findings on a file Claude wrote; a production wave found **a bug in
a ruling made the same day**.)*
🔴 **The precondition: the conversation comes first.** Without the document, 8 agents will invent 38
rulings of their own.

| Wave | When | The failure it prevents |
|:-:|---|---|
| **Foundations** | end of Stage 1 | N drawers with no contract ⇒ N designs |
| **Production** | Stage 2 | the cross-pass — the only thing a per-surface verifier cannot see |
| **Closing** | after Stage 2 | **there will always be rulings added after the drawing** *(module 6: eight)* |

**🧬 Anatomy of an agent prompt — five parts, all mandatory:**
**①** base context + **who the reader of the output is** + 🚫 *"do not spawn sub-agents"* · **②** the task
in one line, and for a surface: **"the one decision this screen makes"** · **③** what to read, **in full
paths** · **④** what to produce **and to which file** *(output to chat = work that will vanish)* ·
**⑤ and what not to do, with the reason.**
**+ for every agent:** *"'no findings' is legitimate and preferred over invention — after you state
which checks you ran."*

**🔴 What must not be delegated:** a product ruling · a §7 ruling · surface approval · mockup approval.
✅ **And a good agent refuses to rule and brings the question back** — *(in module 6 an agent wrote
"🚫 לא הכרעתי לבד" three times. That is the sign the prompt was good.)*

⚠️ **And verify what an agent returns.** In Ishay's words *(13/08/2026)*:
> *"שים לב שלפעמים סוכן לא מכיר כל מה שדיברנו או ראית אז בדוק היטב מה שהוא אומר."*

---

# §6ג · Ruling discipline inside a Discovery

**① `C5` — three drawers, not two:** what is **still correct** *(cite it)* · what is **wrong** *(rule
against it, and record the difference in chapter 10)* · and what is **a prediction about another
module** *(§0 — do not use it at all)*.

**② What Claude rules alone, what it does not, and what lies between** — the full rule is
`CLAUDE.md` rule 1. **The Discovery-specific part:**
- **A reversible technical decision is yours.** Marking it "open" is the mirror image of the same
  disease (§2④).
- **A product / process / permission / UX decision is his.**
- 🆕 **And the third category, which was the majority in practice: a delegated ruling.** When he says
  "מה שתמליץ" — **you rule, and mark three things: ① "הכרעת-קלוד בהאצלה" ② the reasoning and the
  anchor ③ "מותר לפתוח מחדש בלי טקס".** *(**17 of 38** rulings in module 6.)*

**③ A real edge case vs an invented one — the test:** **real** arises from the business process ·
**invented** from imagination. 🔑 **The filter that closes an item in one line:** "קורה אצלך ש…?" —
**and "לא קורה" is a dated ruling of his.**

**④ 🔴 The self-catch count is zero.** Measured again on 13/08: a self re-read returned **0** findings;
a fresh-context reviewer returned **21**. ⇒ **Never rely on re-reading your own artefact.**

**⑤ A retracted claim is retracted in writing, in the file.** 🔴 **And grep for the old wording** — a fix
that adds a line without cleaning the old one is the single most repeated failure *(five instances in
one day, including a claim that was retracted in one place and survived in three others)*.

---

# §7 · The tools you have — a capability not mentioned is a capability you will not use

- **The DB MCP — the most important tool here.** The schema snapshot goes stale; **the live DB is the
  truth.** Read from it directly to verify columns, policies and row counts **before** you state them.
  🚫 **Read only.**
- **The browser — use it yourself.** Open the system and look at existing screens to match the design
  language, **and verify browser-visible facts yourself — do not delegate the check to Ishay.**
- **The front-end design skill — raise it in Stage 2** (surface = mockup), especially for RTL.
- 🚫 **Do not raise a style/palette library.** The system has an **approved** design language, and
  changing colours or layout without Ishay's approval is forbidden. A mockup that "looks impressive" in
  a new style is exactly what is not allowed here.
- **Read `docs/toolbox.md` before raising a tool that is not on the list** — dispatching to a disabled
  plugin **fails silently.**

---

# §8 · Journal, persistence, interruption

🔴 **Keep a journal as you go — `docs/specs/module_[N]_[eng]/discovery-log.md`, beside the spec.**
**In English** *(repo convention: reader = Claude ⇒ English; Hebrew only as data — Ishay quotes, screen
names, UI strings. The approved files, by contrast, are in Hebrew — their reader is Ishay.)*
After each process and surface: **what was covered · what Ishay corrected · where it got stuck · what
surprised you.**

🔴 **But the journal is not the primary target for a ruling.** **The Hebrew file — `processes-approved.md`
— is** (Stage 0ד). The journal holds the evidence trail; the Hebrew file holds the ruling.

**Every ruling touching the open-questions register is written to it in the same session** — not "later".
🔴 **And even when the item is already closed: a number or rule you write that overrides what the §7 item
says updates §7 in the same turn.** **A closed item is not a correct item** — it records what was ruled
**then**, and if something else has been ruled since, the register lies silently. **And that is the
register the blueprint opens.**
*(Anchor: a closed §7 item carried algorithm weights that were replaced **22 days** later in a research
document; nobody updated it. Caught only when Ishay asked for an explicit cross-check.)*

**Feel the context running out?** Stop at a clean point, close the journal, and tell Ishay explicitly
that you are stopping and why.
🚫 **Do not compress Stage 3 in order to "finish" — a spec written in haste is worse than one that
stopped midway.**

---

# §9 · When to commit, and on which paths

**When:** at the end of every meaningful work block, **and before you report to Ishay that you are
done** — not "at the end of the day".
**How:** `git commit -- <explicit paths>` **only.** 🔴 **Never `git add -A`** — the working tree is
shared, and a blanket commit sweeps in other sessions' files *(it happened: a one-file commit swept nine
foreign files)*.
**What to record:** the spec document · the journal · the registers you touched · the approved mockups ·
`STATUS` and the main log.
**Pushing:** a personal branch is allowed. 🚫 **`dev`/`main` never, and PR/merge are Ishay's action only.**
⚠️ **And update `STATUS` and the main log last, right before the commit** — the end-of-session check
requires them to be the newest, and any edit after them returns them to "stale".

---

# §11 · Contract items — what the spec must produce so the blueprint does not guess

**The rationale, and it is not stylistic:** the next prompt **does not need to "understand" the spec — it
needs to check itself against it.** Prose can be read several ways; these **either match or they do not.**

**1. 🔒 Locked vocabulary** — one table: every status · every entity · **every on-screen label**, word for
word. 🔴 **And before you lock a term — `grep` it across the module's documents and the open-questions
register.** **Internal locking is not enough: it ensures you are consistent with yourself, not with what
already exists.** **A term already defined elsewhere is adopted or explicitly cancelled; you do not
invent a second name for it.** *(Anchor 07/08/2026: the same thing had **three** names in three files.)*

**2. ➡️ Decided order** — who starts · what is saved · what happens before what.

**3. 🔢 At least one checkable number** — a full case with real values.
🔑 **This is the chain that turned a spec into a checkable blueprint:** `6,319` appears **once** in `C5`
⇒ **33 times** in `module-3.md` ⇒ in `e2e/smoke-anchors.json` **permanently.**
🔴 **And if this module's sections have no computed output value, you must produce one.** *(No numeric
value in the module? Produce a different one: **"the 03:00 run flips exactly `#7` and nobody else"**.)*
🔑 **The boundary** *(Ishay's ruling 07/08/2026)*: **the spec supplies one hand-computed expectation · the
blueprint builds the test from it.** 🚫 **Do not list which tests to implement** — the blueprint has a
field for that in every step.
⚠️ **Why the expectation must come from here:** a blueprint session **can** invent a test, but **cannot**
invent the correct result — that requires reading the formulas and computing. **And if it computes it
itself, the test compares the code to itself.**

**4. 🔗 A cross-module line** — what this module reads/writes in others' tables, **with the exact column
name.** 🔴 **And verify every column name against `docs/schema.sql` before writing it into the spec.**
*(Measured: module 4's spec wrote `projects.hostess_count`; the real column is `required_hostess_count` —
and it is exactly the one module 3 writes.)*

**Mechanical enforcement for three of the four:** `grep` on a label appearing in two forms · `grep` on
`[a-z_]+\.[a-z_]+` against `schema.sql` · and the checkable number is a test that ran.

---

# §10 · Stopping rule

At any stage, **stop** if you are about to: complete an unapproved product detail · ask a question you
can decide yourself · create a mockup without an approved brief · create a document with no clear use in
the next stage · expand the module beyond what was approved · or add a skill/hook/agent without a proven
need.

**And when you finish a reply — if something is unclear to you, say so explicitly. "לא ברור לי" is a good
answer.**

---

# 🌾 The harvest ledger — four lines at the end of every stage, not at the end of the session

**①** how many rounds · and which stop point Ishay **actually** used · **② 🔴 which section did not fire,
by name** · **③** where the skill was wrong, **quoting Ishay** · **④ 🔴 who caught each structural finding
— Ishay or Claude — and then the ratio.**

🔑 **④ is the only measure that shows whether the skill is improving.** ② measures **sections that fired**;
④ measures **outcome** — **and a section can fire and catch nothing.**
📊 **The baseline, module 6: 4 of 6 structural findings were caught by Ishay. A ratio that does not change
means the fixes did not work.**

**Where it goes:** `docs/guides/discovery_lessons.md` — the Hebrew retrospective file, whose reader is
Ishay and the session that maintains this skill. 🔴 **The ledger grows from every module that runs — and
also sheds what never fires.**
