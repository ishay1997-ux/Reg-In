# Module Discovery — the full procedure

> **Read `SKILL.md` first** *(it carries the discipline pointer and the pre-flight)*. **This file is
> the procedure, and it is complete: everything a Discovery needs is here.** Where a ruling is
> Ishay's it is dated and quoted verbatim in Hebrew.

## How to read this file

**Two placeholders, and only two:** `[N]` = the module number as Ishay writes it · `[שם המודול]` =
its Hebrew name.
🔴 **A third thing is NOT a placeholder — it is resolved by listing:** the spec folder is
**`docs/specs/module_[NN]_*/`** where `NN` is **zero-padded** ⟦EX⟧ *(module 4 ⇒ `module_04_hostesses`
— the form, not the module)*.
**Never build it by substituting `[N]`** — `module_4_*` matches nothing, and Stage 0's very first
check then reports "no folder" for a module whose folder exists. **`ls docs/specs/` and read the
name off the listing.** The step-guide filename (`docs/guides/modules/module_NN_*.md`) is the same
form and is the tie-breaker.

**⟦EX⟧ marks evidence from a module whose Discovery already ran** *(modules 4 and 6 — the only two)*.
🔴 **The shape binds; the content does not.** A number, a screen count, a column name or a verdict
inside ⟦EX⟧ describes **that** module and is **false about yours until you measure it yourself.**
*(This convention exists because it was measured missing: a skill meant to run modules 5·6·7 untouched
carried 33 unlabelled module-specific references. The maintenance check is mechanical —
`grep -nE "module [0-9]|module_[0-9]|מ[0-9]|hostesses|Smart Match|דיילות" template.md`, and **every hit
outside an ⟦EX⟧ block is a finding.**)*

🔴 **And read `§7` (tools) · `§8` (journal) · `§9` (commits) BEFORE Stage 1, even though they sit after
the stages.** They *govern* the stages rather than following them, and reading them late is the same as
not reading them: **a capability that was never mentioned is a capability you will not use.** ⟦EX⟧ *(a
harvest table recorded three §7 items that never fired in a whole Discovery — the design skill, the
browser, and reading `src/` — all three simply because that section was read too late to matter.)*

**Every number in this file is a measurement recipe, not a value.** 🔴 **And every fact here is
contestable.** If you measured otherwise, correct it with the measurement — do not conform to what is
written here.

## Glossary — terms this file uses that are not defined anywhere else in it

| Term | What it is |
|---|---|
| **`C5` / `C6`** | the **frozen spec** — `docs/reference_spec/C5_clean_transcript.md` and `C6_clean_transcript.md`. 🔒 **Protected: an edit is blocked by a hook.** A citation `C5:NNN` is resolved through the `<!-- מקור C5/C6 L… -->` comments at the head of each section *(the section whose `L` is the largest ≤ `NNN`)*. **Verify both paths by listing `docs/reference_spec/` before you cite** — §2①. |
| **`§7`** | `PROJECT_MASTER §7` — the **open-questions register**, and it lives in its **own file**, `docs/PROJECT_MASTER_sec7.md` |
| **`§6`** | `PROJECT_MASTER §6` — the **debts register**, inside `docs/PROJECT_MASTER.md` |
| **`§5`** | `PROJECT_MASTER §5` — **screen descriptions**, one card per screen. ⚠️ **Not a consumer map** |
| **`🚧 מN`** | the debt token module N's opening greps for. ⚠️ **Read the token off the register, do not build it** — variants exist (`🚧 מ12 ← מ4`, `` `מ5/8` ``) |
| **`⑥0` / `⑥1`** | numbered paste blocks inside a step guide `docs/guides/modules/module_NN_*.md` |
| **`M`** | the **approved surface count** — it does not exist until Stage 1-א approves the list |
| **iron rules** | root `CLAUDE.md` + `docs/CLAUDE.md`. **13(א)** = §7 write-back first · **13(ב)** = a spec session records DB needs in `db_roadmap`, never a migration · **13(ז)** = recommend `regin-docs-sync`, never run it · **16** = one writing session at a time |
| **`deny-all`** | RLS enabled with **zero policies** ⇒ every read returns **zero rows with `error: null`**. **The screen lies; it does not fail** |

🔴 **`§N` is overloaded: this file's own §5/§6/§7 are NOT `PROJECT_MASTER`'s.** When you write one,
write which.

---

# §0 · What this session is, and what it produces

A **product-definition** session, not a build session. The distinction is not semantic and it costs
money:

**A build session needs the "what"** — what to implement; the reasoning was already settled, and
re-reading it wastes context.
**This session needs the "why"** — because its output is **the reasoning Ishay will defend out loud
in front of an audience.**

🔴 **Therefore: never inherit a reading instruction written for a different session type.** A document
whose header says *"building X? read §11 and that's it"* is talking **to a builder**. Obeying it here
means reading the build spec and missing the evidence the conference will ask about. **The test is
cheap: who is this instruction talking to?**
⟦EX⟧ *(05/08/2026 — a Discovery prompt quoted exactly such a sentence, the session obeyed it
precisely, and therefore never read the evidence sections. Ishay caught it. Self-catches that session:
zero.)*

## The frozen spec is raw material, not authority — this session's founding assumption

Ishay wrote it himself before he knew the domain. **His recorded words** *(assembled from
`docs/specs/module_04_hostesses/discovery-log.md` — the fragments are his, the connective is the log's
narration; do not re-quote this as one verbatim sentence)*:
> *"ישן, לא מעודכן, נכתב על ידי שאין לי ידע מספיק רחב בעולם הזה"* … take it *"בערבון מוגבל"* and doubt
> it … *"למרות שלדעתי רובו נכון."*

**The mockups are a limited-liability reference, and some of their details are wrong.**

🔴 **`C5` is evidence of what was once considered — never a prediction of what another module will
build.** **You may cite it for what exists:** a business process · a formula · a constraint ·
something already built. 🚫 **You may not derive from it what a screen whose Discovery has not yet run
will show.**
⟦EX⟧ *(13/08/2026 — a `C5` section was cited as if it governed how a not-yet-specified module would
filter; in the same file, tab counts for two other modules were taken from `C5` as fact, and one of
them was already contradicted by a ruling written two screens further down in that same document.
Ishay caught it:* > *"אתה ממשיך עם C5 כמו שהבנת הוא 80 אחוז נכון — ופה בדיוק הבעיה.")*
🔑 **The test, and it is cheap: am I quoting what *was once true*, or predicting what *someone else
will decide*?**

⚠️ **Consequently *"C5/C6/the mockup says so"* is not a justification — it is evidence.** The
justification is always **what is correct on screen and in the field**; agreement with the source is
at most **support**. **A claim that is nothing but a citation is copying, not deciding** — exactly
like a world convention adopted without a fit check (§5).
🔑 **The test: if all three sources said the opposite, would my answer change? If yes — I did not
decide, I quoted.**

### 🔴 Two triages, and they are different — do not merge them

**(a) `C5` itself sorts into three drawers:** what is **still correct** *(cite it)* · what is **wrong**
*(rule against it, and record the difference in chapter 10)* · and what is **a prediction about another
module** *(the rule above — do not use it at all)*.

**(b) And every requirement you extract lands in exactly one verdict:**

| Verdict | Meaning |
|---|---|
| ✅ **covered** | one of our rulings answers it |
| ✅ **reasoned rejection** | **we saw it, decided against it, and wrote down why** |
| 🔴 **unhandled** | **fell between the chairs — and only this one is a finding** |

🔑 **The middle drawer is the point, and without it the coverage check manufactures panic:**
`PROJECT_MASTER §1` holds that **a reasoned rejection is stronger than "I built everything"** ⇒ a
requirement knowingly declined is a ruling and a ready answer for the conference, not a hole.
⟦EX⟧ *(one module produced **three** reasoned rejections — colour-by-date · a stepper · a duplicate
survey — all of which would have been built had `C5` been treated as a specification.*
🔴 **And this number said "13" until a fresh-context reviewer checked it. It was a fabrication** — a
digit swapped inside a sentence inherited from elsewhere. **The check that caught it is one line —**
**and note it uses the RESOLVED folder, not the form:** `grep -rno 'נדחה מנומק' docs/specs/`.
🚫 **Written with the literal `module_NN_*` it errors out** *(`No such file or directory`, exit 2)* — the
same substitution trap this file opens with, committed inside the sentence that warns about counts.
**Recount before you cite it.**)

## What you produce

The Hebrew spec set, **each file written in its own stage** *(⚠️ **not one assembled PRD** — that was
cancelled by Ishay's ruling 06/08/2026)*, the approved mockups, and a journal the next stage reads.
**Which of them are conditional: the outputs matrix in Stage 0.**

🔴 **And what these become — this is what determines how detailed they must be:** the spec and mockups
you produce become the **sole source of truth for the build**, replacing the frozen spec. **Someone
new, with zero context from this conversation, will build from them — and will not ask you questions.**
⇒ **Every hole, guess and assumption you leave becomes a silent decision no one will see.**
*(This is precisely why this conversation exists: previously the blueprint leaned on the frozen spec,
and that is where the misses and the mid-build stalls came from. Ishay's ruling, 06/08/2026.)*

## What you never do

No product code · no blueprint · no writes to the DB · **no migration, not even a test row** *(one
live Supabase project, no test environment; data contamination has already happened and required a
restore)* · no `git add -A` · no PR and no merge.

---

# §1 · The top mine — the most important thing in this file

🔴 **You will filter on Ishay's behalf, and the filtering is invisible to him.**

Through the session you will face large bodies of material — research findings, spec items, register
rows, design options — and bring him what you judge relevant. **That is correct and desirable.** But
**a wrong question he catches; a wrong filter he cannot catch by definition** — he never saw what you
dropped.

⇒ **Every time you reduce N items to M, print all N with a verdict for each: in / out and why /
already exists here. And report both numbers.** Not a summary — **a full table.**

⟦EX⟧ *(05/08/2026 — 18 research findings were filtered to four decisions. Ishay asked
"כתבת סינון — למה התכוונת?", the full table was shown, **and three dropped items resurfaced because of
it** — one of them a deviation-from-world-practice that would have gone undocumented. **He caught it by
chance. That cannot be by chance.)*
⟦EX⟧ *(and the same rule failed again in a screen stage: ~28 mockup gaps were reduced to 3, and Ishay
was handed **a number instead of a table.**)*

➕ **And check the LIST, not the item.** ⟦EX⟧ *(one item was checked against the sources, found
consistent, and the topic closed — while **two other items in the same list were missing from the
mockup entirely**.)* **Per-item checking produces a "consistent" that is both true and misleading.**

🔑 **This is not a rule of one stage. It fires in every stage in which you reduce N to M — including
the register sweeps of Stage 0**, which is exactly the invisible filtering this section exists to
prevent; the old wording simply never named the registers.

## 🚫 Forbidden — each with its reason, because "don't" without a reason gets rationalised away

- **Do not ask Ishay a question that already has an answer.** *(→ §3 — this starts with a search, not
  with a question.)* **Reason:** it burns his energy on what he already decided, and teaches him the
  registers are unreliable.
- **Do not decide for him on product, process, permission, scope or UX.** **Reason:** only he knows how
  it works in the field, and **he cannot review code** — if you decide quietly, it enters the spec as
  though it were measured.
- **Do not write to disk before approval** — except this list, **and it is all one logic: you record
  what was already approved, you do not propose something new.**
  ① the journal · ② write-back of a ruling to the registers (`PROJECT_MASTER §7`, debts `§6`) ·
  ③ `STATUS` + the main log at the end · ④ mockups he approved · ⑤ **the stage drafts** —
  `processes-approved.md` · `screens-approved.md` · `spec.md` — **each only after its content was
  approved in chat** · ⑥ `world-sources.md` · ⑦ `docs/db_roadmap.md` — a DB requirement that arose
  from an approved surface.
  🔴 **One exception: the skeleton file (Stage 0ד) is created empty *before* approval**, because it is
  the session's memory, not a proposal. **Content still enters it only once approved.**
  🚫 **Everything else — specs, documents, skills, code — is not written without explicit approval.**
- **Do not dispatch an agent or a research task without Ishay's explicit approval** — not even a single
  agent. **Reason:** he pays and waits in real time. One line: *"שווה לשלוח סוכן שיבדוק X?"* and wait.
  ⟦EX⟧ *(he said "אתה יודע שאתה יכול" about agents; it was read as standing permission and was not —
  two agents ran while he waited.)*

---

# §2 · Measurement discipline — eight rules, each of which has failed in practice

**① Never accept a number from this file or from any document — measure it yourself and report what
you found.** A number in a document is **evidence that someone once counted**, not a current fact.
**The live DB > `schema.sql` · the code > the docs.**
🔴 **And the snapshot trap that broke two measurements in one day:** `schema.sql` is a snapshot in
which **late `ALTER` statements sit after the `CREATE TABLE` block** ⇒ reading only the block returns
"the column does not exist" for a column that exists.

**② Read every register item to its end, not just the tag at its head.** 🔴 **Status tags go stale.**
⟦EX⟧ *(two items were tagged "open" at the head and carried "closed" at the foot — both ruled a week
earlier. A session that reads only the tag brings Ishay two settled questions.)*
**And a contradiction inside a document is a signal to read more of it — not a question for Ishay.**

**③ 🔴 "Not built" ≠ "not decided".** An item can be **fully ruled and exist zero times in code**. A
build spec's dependency list enumerates **what is missing in the implementation**, not what is open
for decision.

**④ 🔴 An "open" marker that *you* write into an approved file carries its own check — otherwise it is
an assumption, not a finding.**
> **Mandatory format:** `🔵 פתוח — נבדק מול <המקורות> · DD/MM`
> **Without that line the marker is inadmissible**, and whoever reads it will bring Ishay a question
> he already answered.

**The sources that must be checked, all three:** the open-questions register · the debts register ·
**and every research/rulings document belonging to the module — in full, not only the section you were
pointed at.**
🔴 **Why this is a rule and not advice:** §2① forbids taking a number from a document and §3 forbids
asking what was already answered — **both govern what you *read*. Neither governs what you *write*.**
⟦EX⟧ *(an approved spec file marked two items "to be ruled" while both were ruled — one of them 379
lines above **in the same file** — and three later sessions inherited the marker. That lesson was
already written there as prose, and the items were added 140 lines below it. Hence it lives here as a
greppable format, not as a warning.)*
✅ **The converse holds equally: do not mark "open" what you are entitled to decide.** A reversible
technical decision is yours — **manufacturing openness that does not exist is the same disease in a
mirror.**

**⑤ 🔴 "We'll learn from usage" / "the pool is empty anyway" is never a justification here.**
**There are no users.** `PROJECT_MASTER §1`, verbatim: *"אין לקוח בקצה ואין משתמשים אמיתיים ⇒ המבחן
הוא קוהרנטיות — 'שהכל יהיה הגיוני'"* ⇒ **any argument that leans on future usage is invalid in this
project**, and the replacement is plausibility measured against **internal consistency and against the
frozen spec** — does it contradict another ruling, another screen, another file? *(Wider than "no
invented KPIs in `spec.md`": it bans the reasoning move, anywhere in the Discovery.)*
⚠️ **And note the direction: `PROJECT_MASTER §1` calls coherence a HIGH bar, not a low one** — *"מסך
שלא מתחבר לסיפור שובר את השעה, ואף בדיקה אוטומטית לא תופסת את זה."*

**⑥ 🔴 A reading list is a floor, not a ceiling.**
⟦EX⟧ *(a session's reading list named 7 sources and omitted the screen sections of `C5`, because the
session that wrote the list had not read them. Reading them anyway turned two recorded "deviations"
into non-deviations.)* ⇒ **A blind spot travels by inheritance, through a reading list.** Always read
the spec sections of the surfaces themselves, whether or not anyone listed them.

**⑦ 🔴 A retracted claim is retracted in writing, in the file — and you `grep` the old wording.**
**Corrected yourself in chat? It does not count.** ⟦EX⟧ *(a claim withdrawn by a later ruling **survived
in three other places in the same file** until a reviewer found it; five instances of the same class in
one day.)* ⇒ **A fix that adds a line without cleaning the old one is the single most repeated failure
in this repo.** **A declaration in a file is not a closure — the token in the register is.**

**⑧ 🔴 A claim about the repo, written into an approved file, carries its anchor — or it is an assumption wearing a fact's clothes.**
> **Mandatory format:** `<the claim> (<file> · <grep-anchor>, נמדד DD/MM)`
> 🔴 **A GREP ANCHOR, NOT A LINE NUMBER.** The project's iron rule 1 defines an anchor as *"מקום בקובץ **(עוגן-גריפ, לא מספר-שורה)**"* — and the reason is mechanical: **a line number goes stale silently on the next edit above it**, so it rots into a confident wrong citation, which is worse than none. *(Caught 14/08/2026 by a fresh reviewer: this rule's first draft mandated `file:line` and would have institutionalised the forbidden form across every future Discovery.)*
> **Applies to:** a column existing or not existing · a file existing · the wording of a constraint, index or policy · a file path · a function or RPC name · a seeded `params` value.
> **Without the anchor the claim is inadmissible** — and unlike an unanchored *number*, an unanchored *fact* does not look uncertain to the next reader. It looks settled.

🔑 **Why this rule is the mirror of ④, and why ④ alone was not enough.** ④ already says an *"open"* marker you write must carry its own check. **Its own text names the gap it does not close:** *"§2① forbids taking a number from a document and §3 forbids asking what was already answered — **both govern what you read. Neither governs what you write.**"* ⇒ ④ closed that asymmetry for **exactly one** marker. **⑧ closes it for the claim itself.**

⟦EX⟧ *(Measured `14/08/2026` while auditing an approved spec set: **six of nine verification findings were one shape** — a repo fact asserted with no anchor. Two columns named that **exist nowhere in the schema** · a **file cited nine times that was never created** · a column **denied** while it sits in `schema.sql` · a partial unique index **quoted without its `where` predicate**, which silently converts a narrow rule into a blanket one · a column claimed to be written by an RPC **that does not exist** · and a wrong path for a real file. **Every one of them was written by someone who believed it.** The two that would have reached production silently: the phantom name columns **mis-key a closing form to the wrong hostess**, and the missing predicate **forbids legal actions.*)*

⚠️ **And the honest limit of ⑧ — do not oversell it.** It catches a fact that was **wrong when written**. It does **not** catch a fact that was **right when written and went stale later** — that is rule 13's ripple protocol, a different mechanism. **Nor** does it catch two approved artefacts that disagree with *each other* while both cite correctly. ⇒ **⑧ is one of at least three defences; treating it as the whole answer recreates the "register that reads as complete" failure.**

## ⚠️ And the warning for a file whose entire enforcement layer is `grep`

⟦EX⟧ *(four times in one day a measuring tool nearly produced a false finding: PowerShell reading
UTF-8 as ANSI · `Measure-Object -Line` skipping blank lines · `grep "אנגלית"` against a field stored as
`speaks_english` · and `grep` on a Hebrew string returning 0 while the string sat in a heading.)*
🔴 **⇒ An absence claim is checked in at least two variations — in the human's language and in the
code's.** This repo is Hebrew-in-documents and English-in-schema; a single-variation "not found" here
is a coin toss, not a measurement.

---

# §3 · Before any question — search

Before you phrase any question for Ishay, search for it in three places: **the open-questions
register** · **the debts register** · **and every research/rulings document that exists for this
module**. **A question that already has an answer is not a question — it is a read that did not
happen.**
**Found that it was ruled?** Say so explicitly, quote the ruling and its date, and move on. **Do not
reopen it.**
⚠️ **One exception:** a ruling found by grep is evidence that a decision was made — **not that it is
still correct**. If something has changed since that might void it — **surface it to Ishay, and whether
it stands is his call.**

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
between. **Recommendation before options. 3–4 decisions per round, no more.** One background line
each, full detail only on *"פרט לי"*. **His default should be one tap on the recommendation, not an
analysis exercise.** *(The batching mechanics themselves are operationalised in `section7-rulings` and
`feature-acceptance` — see `_shared/discipline.md`; they are not restated here.)*

**"מספיק להיום" is legitimate at every stop point** — and at the end of every round write
**"סגרנו N מתוך M · הבא בתור: X · ומה שעדיין פתוח: …"**. ⚠️ **The tail is not decoration:** measured
three times that Ishay asked *"עניתי על הכל?"* — **that check should not be on him.**

**🔴 An idea is not a ruling.** When he says *"אולי כדאי ש…"* / *"לדעתי"* — that is an **idea**. Record
it under `/רעיונות-לבדיקה` in the journal and test it like any other option, **including when it
conflicts with a previous ruling of his.** **A ruling is quoted verbatim and binds; an idea gets
tested.** Without that separation you become a yes-man.
⟦EX⟧ *(a register recorded an idea of his as "הכרעת-ישי" — the exact failure this paragraph exists to
prevent, on the exact example already flagged as dangerous.)*

**🆕 And the third category, which was the majority in practice — a delegated ruling.** When he says
*"מה שתמליץ"* / *"תחסוך לי החלטות שאני לא באמת יודע"* / *"זורם איתך"* — **you rule, and mark three
things:** ① `הכרעת-קלוד בהאצלה` · ② the reasoning and the anchor · ③ `מותר לפתוח מחדש בלי טקס`.
⇒ **That is what lets him approve in one word without giving up control**, and in practice it was a large
share of the rulings.
⚠️ **The exact ratio is deliberately not given here, because it was not cleanly measurable** — ⟦EX⟧ *(a
"17 of 38" figure was written and **withdrawn the same evening**: it came from a session summary, not from
a count. The markers themselves were inconsistent — two different wordings across the approved set.)*
🔑 **⇒ The actionable rule is the marking, not the ratio: mark every delegated ruling identically, so the
next module can measure what this one could not.**

**A real edge case versus an invented one.** **Real** arises from the business process *(a client
cancels · a worker no-shows · a date moves)* · **invented** from imagination *("what if two users click
at the same instant?" when nobody asked whether that happens)*. 🔑 **The filter that closes an item in
one line:** *"קורה אצלך ש…?"* — **and "לא קורה" is a dated ruling of his.**

**Every number and date carries its source in parentheses.** It costs two words, and lets him catch a
wrong **source** rather than only a wrong reading.
---

# §5 · World-practice check — when, and how not to come back with recall

> 🔗 **This section is the SSOT for the research protocol.** `_shared/discipline.md` deliberately does
> not duplicate it and points here. **If you renumber this section, fix that pointer in the same turn.**

**When:** where there is a real gap or a real choice — not as ceremony on every detail.
**In addition:** in every process declaration, **one anchor line even when there is no gap** —
*"במערכות דומות זה נראה כך (מקור), ואצלנו כך"*; identical ⇒ write **"זהה למקובל"**; no actual search ⇒
**"מהידע שלי, לא אומת"**.
**Why even without a gap:** the gap clause fires from **Claude's own doubt**. A process that seems
reasonable to you gets no comparison, **and Ishay never learns there was anything to compare.**

**🔴 The answer is always two-part:** *"this is the convention **and it fits here because X**"* — or,
stronger, *"this is the convention, **and I deliberately deviated, because X**"*. **A convention
adopted without a fit check is copying, not deciding** — some conventions solve problems that do not
exist here (scale, multi-tenancy, regulatory audit). **A conscious deviation must be recorded**,
because the conference will ask about it.

**Three rules for a research agent** *(only after Ishay's approval — §1)*: **(a)** demand a cited
source or the sentence *"מהידע שלי, לא אומת"* — an agent returns **recall, not search**, unless you
demand otherwise · **(b)** split by **domain**, not by repetition — two agents with the same question
return the same thing · **(c)** what it **searched for and did not find** is worth as much as what it
found, sometimes more.

**Output — `world-sources.md`**, organised **by the ruling each source supports** *(Ishay presents at a
conference: "ככה מקובל" without a source is not an answer there)*, **plus an explicit rejection list** —
conventions considered and declined, with the reason. 🔑 **The rejection list is the part that proves
judgement rather than collection.**

---

# §6 · The persistence law — it governs every stage

🔴 **This conversation is longer than one session, therefore every stage ends by writing to disk — not
at the end of the process.** **The test: a fresh session, with no context whatsoever, opens the closed
stage's draft and continues from the next item without asking anything.** *(Ishay's ruling
07/08/2026.)*

**🏷️ Each draft carries one tracking table, maintained at every stop — not only when the stage ends:**
**item (process / surface / chapter) · state (✅ approved / 🔶 draft / ⬜ not yet) · pointer (mockup or
section).** 🔴 **In `screens-approved.md` this table sits at the head of the file and its heading is
the Hebrew word `מצב`** — that exact string is what Ishay's own stage-2 paste block tells a session to
read. **Mark explicitly in the file's opening line where you stopped and what the next item is**,
otherwise a fresh session cannot tell "finished" from "interrupted".
⚠️ *(Corrected 07/08/2026 — a previous wording, a "five-line status header", was never produced in
practice: grep on both approved files of a completed module returned zero matches for each of its five
components. **An instruction that does not actually happen is not a continuity mechanism; it is a
hope.** The simple table above is the one that did work.)*

🔴 **One status table per file.** **A document built by accretion produces items that are
simultaneously open and closed.** ⟦EX⟧ *(six such items, and a 172-line structural repair.)* **One
table, one place, and every state change updates it in the same turn.**

**✍️ Who may edit a previous stage's draft:** **Stage 2 may correct `processes-approved.md`** when a
surface exposes a process error · **Stage 3 may correct both** when assembly exposes a contradiction ·
**a session continuing within the same stage may complete cards, not rewrite an approved card.**
🔴 **In every case: a dated line, out loud — never silently.**

**🔤 Letter-to-number mapping.** ⚠️ **The letters are held up by less than it looks:** measured 13/08/2026,
one module's `processes-approved.md` cites "שלב ו" — **2 hits, and that is the whole file-side
justification**; the other approved files returned **0**. Ishay's playbook navigates Stage 1 by א · ב · ג,
so those three stay. **A future Discovery may drop the rest once those 2 hits are rewritten.**
**Stage 1 = א · ב · ג** · **Stage 2 = ד** · **Stage 3 = ו · ז** · **and "ה" is no longer a stage** *(it
became the budget rule below)*.

## ⏱️ The session-budget rule — not a stage, and it applies to all of them

🔴 **This is the rule whose absence cost the most. The problem was never the length of the
instructions — it was the amount of work in one session.**

**Measure, do not guess:** ⟦EX⟧ *(one surface ≈ 85K tokens in a measured run — **re-measure for your
module, a dense surface costs more**).*
⇒ **2–3 process cards per session · 2–3 surfaces per session. Not eight.**
⇒ **Stop at a clean card boundary — never at a stage transition** ⟦EX⟧ *(the session that was a
loop-continuation was 2.4× denser in product decisions; the compaction landed exactly at the
transition).*
⇒ **Commit after every approved card** ⇒ an interruption costs half a turn.

**🔴 The rotation line is mechanical, and it is not Ishay's sentence.** *(Ishay's ruling, 06/08/2026:
rotate at **600K** of the context window — finish the card, commit, stop. The general guidance behind it:
**50–60% of the window is the working range; above 60% is "an area whose work you will have to redo".**)*
⚠️ **The two limits are not the same limit, and the tighter one wins.** The rotation line is a **ceiling
you must not cross**; 2–3 cards / 2–3 surfaces is the **working load**, and it is lower on purpose —
a surface costs more than its own tokens, it costs the rulings that get lost when the conversation gets
dense. 🚫 **Never read "600K ÷ 85K = seven surfaces" off these two numbers.**
⚠️ **The old wording made Ishay the detector** — *"אתה קצת מציף אותי ואנחנו מאבדים דברים בשיחה"* —
**and conceded that by then the budget had run out several turns earlier. A detector that fires late,
and only if a human happens to say something, is not a mechanism.** Keep the sentence as a
**backstop**: if he says it, you are already over. **The line above is the primary.**

🚫 **And no compaction: a fresh session + an acceptance test.** **Compaction does not filter errors —
it replicates them faithfully.** ⟦EX⟧ *(a summary carried a wrong "deviation from C5"; what fixed it
was reading the source.)*

### 🔀 The handover between rounds — and the acceptance test, defined

**A handover points, it does not paste.** **The file gets updated; a paste goes stale.** It carries:
`Continues from: <file> · <the next item from the status table>`.
🔴 **And it lives in a named file inside the spec folder** — ⟦EX⟧ *(one module shipped it as
`next-session-prompt.md`)* — **which is why §ז names it as an exception to "no extra file".**

**The acceptance test is four parts, and the fourth is what makes it work:**
1. **What was closed** — read off the status table, not off memory.
2. **What is open** — with §2④'s marker format.
3. **What to read next** — full paths. *(A reading list is a floor: §2⑥.)*
4. 🔴 **Four factual questions whose answers are in what was just written to disk** — the new session
   answers them **before** doing anything else. 🔑 **A reading list says *what to open*; the four
   questions say *what you must be able to answer*.** ⚠️ **And at least one of the four must target a
   claim the file makes *about itself*** *(«this is recorded in db_roadmap» · «this section is
   complete» · «nothing was deferred»)* — **because a claim that contradicts another claim in the same
   file is the one thing no `grep` catches, and only a fresh reader does.**
   ➕ **End the handoff with `"האם המשימה ברורה? ההודעה הראשונה שלך עונה על זה"`** — so a lost handoff shows
   up in the first reply instead of after half an hour of work on a wrong basis.
⚠️ **A wrong answer to one of the four means the handoff failed — not that the new session should
improvise.** *(The measured numbers behind the rotation line live in `~/.claude/references/session-handoff-guide.md`.)*

**🔑 The attribution test that prevents the root cause:** **if the answer is layout · sorting · colour ·
what-you-see — that is Stage 2. Record it and move on.** ⟦EX⟧ *(a substantial part of one module's
process stage was spent designing an overview screen **inside** the process stage, and that is what made
it feel endless.)*

---

# 🚦 Stage 0 · Intake — all mechanical, all before any conversation

> 🔴 **There are no questions for Ishay in this stage. There is `ls`, `grep`, `SQL`, and reading.**
> **Everything this stage finds was, in the run that produced it, found late and in reaction to Ishay's
> questions.**

## 0א · Two thirty-second checks

**🅰️ Does the spec folder already exist?** `ls docs/specs/` **and read the name off the listing** —
`module_[NN]_*` is zero-padded (see "How to read this file"). 🚫 **Never `ls docs/specs/module_[N]_*`.**
**Exists ⇒ read its status table and continue from "the next item". Does not exist ⇒ you are starting
from zero — regardless of what `STATUS.md` or the log claim.**
🔴 **Why this is a check and not an assumption:** ⟦EX⟧ *(13/08/2026 — both `STATUS` and the log declared
that a module's stage 1-א had been "presented to Ishay, approved". The folder did not exist. Zero bytes
had been written.)*

**🅱️ Classify the module — say the archetype out loud, and therefore which outputs apply.**

### The archetypes — classify by the test, never by the module number

🚫 **This table deliberately carries no "examples" column.** A module whose Discovery has not run has
no established archetype, and predicting it is the `C5`-as-prediction error of §0 committed by the file
that loads first. ⟦EX⟧ *(the previous version of this table did carry one, and a fresh-context reviewer
found **two of its rows wrong**: a deployment milestone filed as an engine — a session obeying it would
have produced a trigger map and an email template for a deploy — and an engine filed as "no screens"
while its own guide required a public password-reset screen, i.e. `M ≥ 1`.)*
🔑 **The archetype comes from reading the module's own step guide. Never from a table.**

| Archetype | What distinguishes it | What it fires / skips |
|---|---|---|
| **🖥️ Screens** | owns a table · has surfaces · changes data | **everything** |
| **👁️ Read-only** | 🔴 **owns no table — reads and displays** | screens and mockups **yes** · processes **few** · 🚫 no column sweep ⇒ **source sweep** |
| **🔀 Others' columns** | 🔴 **writes into another module's table** | **the surface security section ⑨ fires on nearly everything** · contracts are most of the work |
| **⚙️ Engine** | 🔴 **its core has no screen — it fires on time or on an event** | 🚫 no mockups **for the engine part** ⇒ **work card · trigger map · rendered email template.** ⚠️ **Check the guide for a human-facing edge (a reset screen, a public link) — that makes `M ≥ 1` and Stage 2 applies** |
| **🎛️ Settings** | tiny · a parameter table · one role only | sweep **row by row over the parameters** · "no numbers" is a legitimate output |
| **🏁 Milestone** | 🔴 **not a feature at all** — E2E coverage · seed · UI polish · deploy · UAT · a demo script | 🚫 **no Discovery in this shape.** No process cards, no mockups, no `db_roadmap` rows. **If this classification comes out — stop and say so to Ishay** |

🔑 **The test that decides a borderline case: what does the module *change* in the world?** Data ⇒
screens · display ⇒ read-only · time/event ⇒ engine · configuration ⇒ settings · **nothing, it ships what
already exists ⇒ milestone.** **A module can be two or three — then all their sets apply, and where two
rows conflict** *(engine says "no mockups", screens says "everything")* **the wider one wins and you say
so out loud.**
⚠️ **And a classification is not an exemption.** **"I have no screens" does not cancel
`processes-approved.md`** — **an engine has a process, it is simply invisible.** ⟦EX⟧ *("מי מתחיל אותו
— ואף אחד": a process whose only initiator is `pg_cron`.)*

### 📦 The outputs matrix

| Output | When | What breaks without it |
|---|---|---|
| **`processes-approved.md`** | **always** | no product source of truth; the build rules for itself |
| **`spec.md` §"מה אסור לנחש"** | **always** | 🔴 **the one output whose content is measured facts that break a build silently** |
| **One status table** per file | **always** | a build session stops on work already done ⟦EX⟧ *(6 items both "closed" and "open")* |
| **Locked vocabulary** | **always** | two names for one thing ⇒ two entities in code |
| **DB requirements ⇒ `docs/db_roadmap.md`** | **always** | 🔴 **this is the register the blueprint reads — not the spec** |
| **Cross-module contracts** | **always** *(count varies)* | for a read-only module this is nearly the whole module |
| **`world-sources.md`** | **always — in inverse weight** | 🔑 **the less internal anchor there is, the more it matters** ⟦EX⟧ *("את הדוחות אני המצאתי" — a module with no spec section at all)* |
| **`screens-approved.md` + mockups** | **`M ≥ 1`** | — |
| **Column sweep** | **owns a table** | otherwise: **source sweep** — for every number on screen, who writes the column feeding it |
| **Reverse coverage vs `C5`/`C6`** | **has a section** | otherwise against whatever exists — **and resolve that list by listing, not from this file**: the module's `🚧` debts, its `§7` items, its triggers, and any parameter rows it owns. ⚠️ *(This cell named `§1.8` until it was checked: that string resolves nowhere in `PROJECT_MASTER.md`, `C5` or `C6` — it survives only as a legacy citation inside §7 items.)* |
| **`discovery-log.md`** | **always** | 🚫 **the build session does not read it.** Its reader is **the next Discovery**. 🔴 **It is *not* the maintenance input for this skill** — that is `docs/guides/discovery_lessons.md`, and the difference was measured: a 381-line `discovery-log.md` contained **zero** of four central method lessons, because it records *what was decided in that module*, and skill maintenance needs *how one works* |

## 0א2 · 🔴 Resolve the inputs by listing — print this table before any sweep

**Nothing here is built by string substitution. Every row is read off the filesystem or off a file.**
*(This is the single change that most reduces guessing: the folder name was already resolved this way;
every other input deserves the same treatment.)*

| Input | Resolved by | Write the resolved value here |
|---|---|---|
| **step guide** | `ls docs/guides/modules/` | |
| **spec folder + slug** | the step guide's filename stem *(`module_05_logistics.md` ⇒ `docs/specs/module_05_logistics/`)* | |
| **frozen spec** | `ls docs/reference_spec/` — and state which file `C5` and `C6` are | |
| **debt token** | `grep -oE '🚧 מ[0-9]+' docs/PROJECT_MASTER.md \| sort -u` — **read the token off the file** | |
| **the module's table(s)** | the live DB, cross-checked against `docs/schema.sql` | |
| **DB access** | name the MCP tool and the project you are reading from — **if you cannot reach the live DB, say so out loud and mark every column claim `מ-schema.sql, לא מהמסד החי`** | |
| **code root** | `ls src/modules/` — ⚠️ **"no directory for this module" is a legitimate and common answer**; do not treat it as a failed read | |

🚫 **An unresolvable row is not skipped — it is reported at Stop 1 as a blocker.** ⟦EX⟧ *(a simulated run
of this stage could not locate the frozen spec, so the requirement sweep never ran — and that sweep feeds
the requirements ledger, which is Stage 0's only deliverable and the denominator of Stage 3's sixth
cross-check.)*

## 0ב · 🔴 The three sweeps — together, now, output as a table

**① Register sweep, in both directions. `grep`, not reading by eye** ⟦EX⟧ *(reading by eye missed 12
items)*:
```
# §6 only — the debts register. A whole-file grep is defective: the token also appears
# inside §5 screen cards, and §6 is the only place that makes it a debt.
awk '/^## 6\./{f=1} /^## 7\./{f=0} f' docs/PROJECT_MASTER.md | grep -F '🚧 מ<N>'
grep -E 'מ<N>([^0-9]|$)' docs/PROJECT_MASTER_sec7.md              # its §7 items
grep -rn 'מ<N>' docs/micro_guides/ src/ --include='CLAUDE.md'      # debts living only in code docs
```
🔴 **Substitute the digits literally — never write `מ[N]`, and never stop at one digit.**
*(`[10]` is the character class "1 or 0", not the number ten; and bare `מ1` prefix-matches מ10 · מ11 ·
מ12.)* ⇒ **For a single-digit module, anchor the end:** `grep -E '🚧 מN([^0-9]|$)'`.
🔴 **And `src/` is searched whole, not `src/modules/*/`** — ⟦EX⟧ *(the single most consequential line
about one module — that its table is under deny-all — sits in `src/CLAUDE.md`, one directory above the
per-module files, and the narrower glob returns zero.)*

**Output a table of every line with a verdict — covered / not covered — and report both numbers**
(§1 applies here in full).
⚠️ **Two variations, always** (§2's grep warning): the debt token **and** the module's name in Hebrew and
in English/slug. ⟦EX⟧ *(a prescribed token sweep returned **1** row for a module; the name-variation
control returned **89+**, and the token that did exist was in a different shape — `` `מ5/8` `` inside a
backticked tag, not `🚧 מ5`.)*
⚠️ **And a capped search is not an absence claim.** If the tool truncates *(«showing 0–299 of 460»)*,
narrow the path and re-run — do not report the visible slice as the total.

🔴 **And the reverse direction, which no register holds: what must this module *supply* so that others
can work?** **There is no single register for it — build it from three:** `PROJECT_MASTER §6` *(lines of
the form `🚧 מX ← מN` — the arrow direction is invisible to a `🚧 מN` grep)* · **`PROJECT_MASTER §5`
screen cards belonging to other modules that display this module's data** *(§5 is a screen catalogue, not
a consumer map — you derive the consumers from it, card by card)* · **and the approved spec folders of
modules whose Discovery already ran** *(`docs/specs/module_NN_*/processes-approved.md` — a sibling's
cross-module contracts section names what it expects from you, and it is in no register at all).*
⟦EX⟧ *(the first direction missed **an entire surface** — a module owed work inside another module's
client card, and the surface list went 7→8 — plus a §7 item closed that same session without anyone
knowing it existed. **Ishay caught both with one question: "אספת הכל הכל?"** The second direction found
three debts that lived only in code-doc files.)*

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
⟦EX⟧ *(after the register sweep had already caught 12 items, Ishay asked "התייחסנו לזה?" about four
feedback columns — and **15 of that table's 30 columns turned out to appear nowhere in the spec**, on
the module's own table. Three real gaps surfaced, one of them a column with no write path at all.
**Ishay caught it; the sweep that did run could not have.**)*
⚠️ **The output is not "no findings" but a table:** every column, and against it who writes and who
displays. **A column with neither is a finding — either it is redundant, or a surface is missing.**

**③ Requirement extraction** from the frozen spec *(or from whatever does exist, if the module has no
section)* **at the resolution of a single requirement** — field · action · number · validation · rule ·
enforcement · status transition. 🔴 **One sentence sometimes contains three requirements. Break it
apart.** ⚠️ **And read the spec sections of the surfaces themselves even if no list named them** (§2⑥).

## 0ג · 📒 The requirements ledger — Stage 0's output, and what holds everything else together

**One table at the head of `processes-approved.md`. One row per requirement from all three sweeps:**

| # | Requirement | Source | Verdict | Where handled |
|---|---|---|---|---|
| | *(short quote + exact source)* | `C5:NNN` / `🚧 מN` / column name | ⬜ / ✅ covered / ✅ **reasoned rejection** / 🔴 unhandled | the ruling, or "—" |

*(The three verdicts are §0's three drawers. **"Reasoned rejection" is a success, not a hole.**)*

⚠️ **Why a ledger and not a check at the end:** ⟦EX⟧ *(a module ran without one, so coverage was only
measurable at the end — the reverse-coverage check ran **after** `spec.md` had been handed off and found
2 requirements that had fallen through.)* **The ledger makes coverage measurable at any moment.**

🔴 **Every "deferred to module N" that Ishay approves is recorded immediately as a `🚧 מN` line in
`PROJECT_MASTER §6`.** That is the only register module N's opening reads (`grep '🚧 מN'`), and
`module-blueprint` mandates it explicitly. **A rejection without a §6 line is a silent debt** — it lives
only in your draft, and module N will never find it.

## 0ד · Create the skeleton now

Create `docs/specs/module_[NN]_<slug>/processes-approved.md` containing **the requirements ledger · an
empty status table · and a heading that says where we stopped.**
🔑 **This is what §1's exception means by "empty": empty of *product content*, not an empty file.** The
ledger and the status table are a transcription of what the sweeps returned — **not a proposal**, so they
may be written before Stop 1. **A process card, a ruling, a recommendation — those wait for approval.**
🔴 **From here on, every ruling is written into it the moment it is spoken.** *(§8 already mandates
recording a ruling immediately — **but its target is `discovery-log.md`, which is in English and Ishay
does not read it.*** ⟦EX⟧ *he asked "מזה ה-3 שורות של שינוי תכולה?" — the rulings were recorded, in a
place he does not read.)*
⇒ **The Hebrew file is the conversation's memory, not its summary.** Without it the conversation is the
only memory, and it gets erased.

**🛑 Stop 1 — the first, and short:** present the classification · the three sweeps as tables · and the
requirements ledger. **Ask exactly one question: "מה מהרשימה הזאת מפתיע אותך?"** — that is the question
that returns the most.
---

# 🧭 Stage 1 · Processes ⟵ produces `processes-approved.md` + `world-sources.md`

## א · Reading and overview map

Read the module's spec sections, the registers, the **live** schema (not only the snapshot), the DB
change map, the mockups, and the existing code. **The list you were given is a floor** (§2⑥). Present
in Hebrew: the module's purpose · the process map · **every surface** · what exists and what does not ·
what is settled versus open. **End with at most 3 questions, only if needed to choose where to start.**

⚠️ **"Surface" is not only a screen:** tabs · popups · public pages with no login · **and email
templates** ⟦EX⟧ *(a module needed two new templates, and two existing ones **lied**)*.
🔴 **And the surface list is derived from the requirements ledger, not from the spec** ⟦EX⟧ *(a list
derived from the spec **grew** once the sweep ran)*.

**🛑 Stop — he approves the surface list. Blocking.** Without approval there is no `M` — the round line
says "סגרנו N מתוך **M**", stage 2 builds a card per surface, and stage 3 audits coverage against this
list. **An unapproved list is a denominator nobody agreed to.**
**➕ The approved list goes straight into `processes-approved.md`** as the status table — item · state
(✅/🔶/⬜) · pointer. ⚠️ **Verify yourself that it is actually there** — ⟦EX⟧ *(grep for this table in a
completed module's `processes-approved.md` returned zero rows despite this same instruction)*. **Do not
assume it was written because it is written here.**

## ב · Aligning the process map

**Before describing a single process — agree on the list.** Bring the processes and sub-processes that
are **missing** — including what you found in the world and we do not have — each with a verdict:
in / out and why / deferred to another module. **🛑 Stop: he approves the list.**
🔴 **Every approved "deferred to module N" ⇒ a `🚧 מN` line, immediately** (Stage 0ג). **This applies
equally to the reasoned rejections in Stage 3.**

## ג · Process by process

For each process: **a full story from beginning to end** *(not an arrow diagram — a diagram gets a
nod)* · who starts it and when · what gets saved · permissions · **what can go wrong and what the user
sees then** *(real edge cases from the business process — §4's test)* · a world-anchor line (§5) · and
its relation to the others. 🔑 **This is the only place the story is written; nothing downstream
re-tells it.**

🔴 **➕ In every process card, a separate line: every status the process needs · who writes each
transition · and its time anchor.** **Why this is mandatory and not nice-to-have:** the blueprint runs a
DB challenge that explicitly requires *"every status the processes need exists; **state transitions have
defined writers** and time anchors"* — **and if you have not ruled who writes a transition, it will rule
for you, or discover the gap mid-phase 1.** *(This is also the one hard demand Ishay's own playbook makes
of Stage ג.)*

🔴 **➕ And a status transition is validated against how the row is actually born.**
⟦EX⟧ *(a rule "first human action = an `assignments` row **or** a logistics row" would have fired at
birth, because logistics rows are created automatically by the approval RPC — making the initial status
unreachable. The fix: "a logistics item that **left** `not_started`".)* **A trigger rule never checked
against the creating RPC is a guess.**

**⚙️ For an engine module** there is still a process card — it is simply invisible. **"Who starts it —
and nobody" is a legitimate answer.** The card carries: what fires it · what it writes · what happens on
failure · and what a human sees if it never ran.

**🛑 Stop per process:** *"כך הבנתי את ההחלטה: …"* and wait. Do not move on without explicit approval.

## ג2 · Cross-module contracts

For every module this one touches: **what we read · what we write in their tables · and what we dictate
to them.** 🔴 **Every dictation becomes a `🚧 מX` line in `PROJECT_MASTER §6` in the same turn.**
**For a read-only module this is nearly the entire module.**

## 📁 Written at the end of Stage 1

- **`docs/specs/module_[NN]_<slug>/processes-approved.md`** — a card per process, in Hebrew, at the level
  of detail from which screens are built. **The card carries:** name and purpose · who starts it and when ·
  the flow as a story · what is saved · **statuses + transition writer + time anchor** · permissions ·
  what breaks and what the user sees · relation to other processes.
- **`world-sources.md`** — §5. 🔴 **It is not optional and not conditional** — it is one of the two files
  Stage 1 emits.

---

# 🖼️ Stage 2 · Surfaces ⟵ written per surface, not at the end of the stage

> **Conditional — runs when `M ≥ 1`.** An engine module with no surfaces produces instead: a work card ·
> a trigger map · **and a rendered email template** wherever it sends mail.
>
> **Resumable on its own.** A stage-2 session reads `screens-approved.md`'s `מצב` table at the head of the
> file, continues from the next surface, and does **not** re-run Stages 0–1. Before drawing any surface it
> reads **that process's card in `processes-approved.md` in full** — not only the screen card.

## ד · Surface = mockup

**🔴 Stages ד and ה were merged — Ishay's ruling 06/08/2026, after two verbal screen cards that were not
understood.** In his words:
> *"מודה שלא כל כך הבנתי… אתה רוצה אולי **תמיד לעשות מוקאפ כפי שאתה מבין**, ואז מקסימום אתקן אותך?"*

⇒ **Draw first. There is no "verbal card then mockup", and no separate stage deciding whether a mockup is
needed.** **HTML, not PNG** *(so Claude can read it back)* · **real data at real scale** · **and a palette
pulled from `src/`, not from a previous mockup:**
```
grep -rhoE "(bg|text|border)-[a-z]+-[0-9]{2,3}" src/ | sort | uniq -c | sort -rn
```
*(⚠️ Deliberately without a hardcoded family list: a closed list **confirms what is already known and
cannot discover a sixth family** — "do not hand the checker the expected answer".)*
🔑 **The design language is read from `src/`, never from the previous approved mockup** — that one is
itself an approximation, and copying it perpetuates drift.

⚠️ **The caveat that must survive the merge: a mockup alone hides the rules** — it shows *what it looks
like*, not *how it is counted*. ⇒ **Alongside it, only the rulings a picture cannot show.**

### ⚖️ The precedence order — three branches, and the third is a stop point

| The disagreement is about… | Who wins |
|---|---|
| **appearance** — layout · order · density · colour · emphasis | 🖼️ **the mockup**, and the card does not describe them at all |
| **behaviour and data** — what is counted, from which column, in which window, who may | 📄 **the approved spec** *(`processes-approved.md`, and `C5` only per §0)* |
| **neither** — the two contradict on something that is both | 🛑 **stop and ask Ishay** |

🚫 **The third branch is not optional.** Without it a session silently breaks the tie, and a silent
tie-break is exactly the class of decision §12 exists to register.

### 🏷️ The sources line — on every card and every mockup

🌱 pulled from the DB · 🎭 invented demo · 📐 derived from a model. **The reason is structural, not
"because they'll ask at the conference":** a mockup with invented data **looks identical** to one showing
real behaviour, and a build session reads both with equal trust.
⚠️ **And you mark against the source, not from memory** ⟦EX⟧ *(in the first card that carried this line,
**two of four** details marked "from the DB" were not there)*. 🚫 **And you do not change the demo — you
label it.**
➕ **Every mockup showing time states its own "today", and the dates must line up against it.**

## 🌊 2א · The contract wave — before any drawing

**Two agents in parallel, both writing to a file** *(dispatch only after Ishay approves — §1)*:

| | What |
|---|---|
| **Design contract** | palette **from `src/`** · font · semantic colour rules · RTL rules · **and an HTML skeleton to copy** |
| **Data set** | real data from the DB · labelled demo · **and one shared "today" for all surfaces** |

🔴 **Without a contract: N drawers ⇒ N designs.** **Without a data set: a project that appears in one
screen vanishes in another.**
⚠️ **And a working file that an approved document cites must enter the repo.** ⟦EX⟧ *(a shared data set was
cited ~11 times across approved files while living only in a scratchpad; it was rescued into the spec
folder afterwards — and **one stale reference to its scratchpad name survived** even then. Grep both name
forms.)*
🔴 **And the design contract itself must be written to a file in the spec folder before the production
wave** — ⟦EX⟧ *(it once lived only inside the dispatching agent's prompt, so when it turned out to be
defective there was no source anyone could open.)*
🔴 **The design contract is itself a defect source:** ⟦EX⟧ *(one bidi rule in it produced the same
directional bug in **4** mockups, **14** occurrences.)* **A contract defect multiplies by N. Have the
contract reviewed before the production wave, not after.**

### 🌊 The agent law, and the three waves

> **The one law: rulings happen in the conversation with Ishay. Everything else — agents.**

🔑 **The sharpening without which it misleads: the agents are not an execution arm but a *discovery*
arm.** ⟦EX⟧ *(a control wave returned 21 findings on a file Claude had written; a production wave found a
bug in a ruling made the same day.)* **The main value is not what they produce — it is what they find.**
🔴 **The precondition without which it all collapses: the conversation comes first.** The agents build
from `processes-approved.md` and the rulings in it. **Without the document, 8 agents invent 38 rulings of
their own, each differently.** ⇒ **Waves are a multiplier on the conversation, never a shortcut past it.**

| Wave | When | 🔴 The failure it prevents |
|:-:|---|---|
| **1 · Foundations** | Stage 1 closed, **before anything is drawn** | N drawers with no contract ⇒ N designs; no shared data set ⇒ a record that appears in one screen and vanishes in another |
| **2 · Production** | Stage 2 | the cross-surface pass — **the only thing no per-surface verifier can see** |
| **3 · Closing** | after Stage 2 | 🔴 **there will always be rulings made *after* the drawing** ⟦EX⟧ *(eight in one module — and retrofitting them cost an entire 9-agent wave)*. **Without a closing wave they live only in the document and never reach the mockups** |

**How to brief any agent:** the prompt skeleton and its numbered rules live in
**`.claude/skills/_shared/writing-prompts.md`** — **not restated here, so there is only one copy to keep
current.** *(Checked 13/08/2026: that file carries an 8-item ordered skeleton — session type · the one
top mine · the tools · what is already decided in Ishay's words · what it must not touch, each with a
reason · the stages, the stop points and what each writes to disk · the exact output shape · and
"האם המשימה ברורה?" — plus its numbered rules. 🔴 **Re-check before relying on this sentence** — §2①.)*
**What this skill adds on top of it, and none of it is in that file — I checked:**
- 🚫 **In every agent prompt: "do not spawn sub-agents."**
- 🔴 **Name the output file path.** *(Output to chat only = work that will vanish.)*
- 🔴 **Say what NOT to do, with the reason** — *"אתה מעדכן, לא מעצב מחדש"* · *"אל תתקן, דווח"* ·
  *"אל תיגע במסד"*.
- ➕ **For every agent:** *"'אין ממצאים' היא תשובה לגיטימית ועדיפה על המצאה — אבל רק אחרי שתאמר אילו
  בדיקות הרצת."*
- 🔴 **What must not be delegated:** a product ruling · a §7 ruling · surface approval · mockup approval.
  ⚠️ **And an agent that returns a ruling you did not ask for has produced a *finding to check*, not a
  decision.**
- ✅ **A good agent refuses to rule and brings the question back.** ⟦EX⟧ *(an agent wrote "🚫 לא הכרעתי
  לבד" three times — that is the sign the prompt was good.)*
- ⚠️ **Verify what an agent returns.** Ishay, 13/08/2026: > *"שים לב שלפעמים סוכן לא מכיר כל מה שדיברנו
  או ראית אז בדוק היטב מה שהוא אומר."*
- 🔴 **Before every wave, tell Ishay how many agents and the rough cost.** He pays and waits in real time.

## 📐 The card written beside the mockup — nine sections, and that is all that is written

| # | Section | Why a picture is not enough |
|:-:|---|---|
| **1** | 🔴 **Click map: what is clickable · what it does · where it leads** *(a table, one row per interactive element — including navigation, tabs and filters)* | **A button, a link and bold text look alike — and the difference between "acts" and "routes" is a product decision.** ⟦EX⟧ *(Ishay: "שלא יהיה בלבול מה כפתור ומה מוביל למה?", then "זה לא כפתור נכון?" — **the picture could not tell him**)* |
| **2** | **The one decision + who makes it** ⇒ any element not serving it — justify or remove | A picture shows **what there is**, not **what for**. *(The only answer that beats "יותר מדי מידע פה, לא?")* |
| **3** | **A source for every number** — named column · explicit calculation · **and the time window** | A picture shows `45`, not *"events in the last quarter, computed from `assignments`"*. **A number without a home is a blocking finding.** |
| **4** | **States not on screen** — loading · **truly empty vs empty-after-filter** · error · blocked action · success | **A mockup draws only the happy state** |
| **5** | **Permissions** — who sees · who edits · **and what disappears for whom** | Cannot be drawn |
| **6** | **Definitions behind a word on screen** — *"דחוף = 72 שעות"* | **A word on screen does not reveal the rule behind it — and the blueprint will build the rule** |
| **7** | **Validations, per field:** what must be valid · what happens when it is not · **and exactly what the screen says** | `module-blueprint/template.md` — **item 7 of its "Required Micro-Guide Structure"**, *not* a `§7`: that file has no `§` numbering, and `§7` inside it always means `PROJECT_MASTER §7` — carries a dedicated **UX-and-validation checkbox** ⇒ an omission here falls through at module close |
| **8** | **Every detail whose only source is the mockup, or on which the spec is silent — marked "מהמוקאפ / אפיון-שותק — לאישורך"** | Mockups are a **limited-liability** reference: neither reproduced blindly nor dropped silently |
| **9** | 🔴 **Conditional — only if the surface writes to the DB without normal permission / role / login: a dedicated security section** — who writes · to which rows · to which fields · under what conditions | A picture does not show a write mechanism; such a surface is usually the only path that departs from the per-role RLS model |

🚫 **What is deliberately not written: the appearance row of the precedence table above.** A card
describing layout, order, density, colour or emphasis inflates itself **and may contradict the picture
beside it.**

## 🗄️ At the end of every surface, before moving on — what it requires from the DB

One question: **"מה המשטח הזה דורש מהמסד שעדיין לא רשום?"** — a new column · a new table · a policy · a
constraint. **What comes up goes into `docs/db_roadmap.md` in the same turn, not at the end** *(iron rule
13ב: a spec session does not write migrations, so the target is `db_roadmap`)*. 🚫 **You do not write a
migration and do not touch the DB — only record what will be required.**

🔴 **If the new mechanism is anon-callable / public / reachable without permission — read
`db_roadmap.md` in full (not a targeted grep) and look for a precedent for that risk shape before writing
the line.** ⟦EX⟧ *(this is exactly the mechanism that found that a new function of that kind needed rate
limiting — because an exact precedent sat a few lines above in the same file. A targeted grep at the
insertion point would not have exposed it; a full read did.)*

🔴 **And do not write "recorded" without verifying by grep that it is there** — **in two variations**
(§2's grep warning). ⟦EX⟧ *(a "what this implies for the DB" section explicitly declared that the day's
additions were recorded in `db_roadmap`, listing two columns — **both were 0 there and 0 in
`schema.sql`.** The blueprint would have read "recorded" and not checked.)*

➕ **And in the same turn — four checks proven to catch findings in practice:** every column name in the
card against `schema.sql` *(mind the late-`ALTER` trap, §2①)* · every label against the mockup, word for
word · every displayed number with an explicit column/calculation · every clickable element in the mockup
present in ① the click map. **Output: a findings table, reported to Ishay, corrected only with his
approval — never silently.**

**🛑 Stop per surface.** He looks, says "תקן X", looks again, approves.

## 🌊 2ג · Cross-surface pass — what no per-surface verifier can see

🔴 **Two mechanical checks on the mockup FILES, which no content verifier covers and which the six
pre-handoff cross-checks do not look at — nothing there examines where a file lives, so it fails
silently:**
**①** every approved mockup sits in `approved/` under its approved name — **not in `drafts/`**.
**②** no draft banner survives inside an approved file: `grep -rl 'טיוטה' docs/mockups/**/approved/` must
return nothing. ⟦EX⟧ *(one module shipped this defect at **8 of 8**; another at 1 of 8.)*
⚠️ **And sweep for an orphan** — a mockup at the parent level that nothing cites. ⟦EX⟧ *(one such file was
deliberate pre-Discovery legacy.)* **Know which is which before you touch anything.**

**Locked vocabulary** ⟦EX⟧ *(10 phrasing contradictions were found this way in one module)* · visual
consistency · coverage against `M`.
⟦EX⟧ *(a round covering four surfaces at once found 5 findings that each surface's own approval had
missed — a per-surface run would have caught them more cheaply.)*

## 📁 Written at the end of every surface — immediately after its approval

- **`screens-approved.md`** — the card in the nine-section structure, **and the `מצב` table at the head of
  the file updated in the same turn** (⬜→🔶/✅ + mockup pointer) — **this is not a separate action, it is
  part of "approving the screen".**
- **The mockup:** draft in `docs/mockups/<topic>-screen/` · **approved in `approved/` inside it**, named
  `NN_<name>_approved.html`. 🔴 **Promotion into `approved/` is part of "he approved it", not a tidy-up
  afterwards.** ⟦EX⟧ *(one module left all 8 approved mockups sitting in `drafts/` under draft names for
  hours, while `module-build` states flatly that approved mockups live under `approved/`; promoted the same
  evening on Ishay's ruling, with every pointer repointed.)* ⚠️ **The blueprint walks
  `docs/mockups/<folder>/approved/*.html`, and an empty result reads exactly like "this module has no
  mockups".**
- **🔄 And Stage 2 may correct `processes-approved.md`** when a surface exposes a process error — **in a
  dated line, out loud, never silently.**
---

# 📦 Stage 3 · Handoff ⟵ produces `spec.md`

> **Runs standalone.** Stages 0–2 have already run; **do not repeat them.** What you need from them is
> on disk: the requirements ledger, the two approved files, the mockups, and the registers.

## ו · Assembly — in Hebrew

🔴 **Remember who the reader is: Claude, who will silently fill every hole you leave.**
⚠️ **And "assembly", not "writing from scratch":** most of the content was written in Stages 1–2. **Here
you verify every chapter has a home, and write only what has none.**
**What does not go in:** numeric success metrics — there are no real users, and an invented KPI is
exactly what he would have to defend *(§2⑤)*. In its place: **"מה ייחשב עובד"**, in words.

**🔴 Every chapter opens with 2–3 lines of plain Hebrew — "what this is and why" — with the precise
detail beneath.** Ishay reads the top layer and understands the module; Claude reads everything.

**Every chapter has a home — otherwise it is written, approved, and disappears** *(Ishay's ruling
07/08/2026)*:

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

## 🔴 `spec.md` is five things, and no more

*(The 12-chapter PRD was cancelled by Ishay's ruling 06/08/2026; expanded from three to five on
07/08/2026, because "three only" left chapters 9 and 11 — two of the things Ishay approves himself — with
no file at all.)*

**① A pointer** to the approved files and the mockups — **without duplicating a line** ·
**② A 3-line opening paragraph** — what the module is and for whom ·
**③ The contract items** *(§11)* — **this is the real work of this stage** ·
**④ "מה ייחשב עובד"** and **"מה הוכרע מול מה נשאר פתוח בכוונה"** ·
**⑤ "מה אסור לבלופרינט לנחש"** — **in full.**

**The rationale:** the spec in the repo **is not an academic artefact — it is a working tool with one
job: that Claude builds without guessing.** ⇒ **Its quality measure is falsifiable and is not
readability: if the build came out right, it sufficed.**

🔑 **⑤ is the output without which the rest has no value**, because its content is **measured facts that
break a build silently.** *(The sharp example: a table under deny-all returns **zero rows with
`error: null`** ⇒ **the screen lies, it does not fail**, and no test will catch it.)*

🔴 **`spec.md` must not tell the blueprint which registers to skip.** ⟦EX⟧ *(a spec instructed the
blueprint not to read `db_roadmap`, claiming it was "deliberately empty of this module". It was already
wrong when written — 3 rows at 17:00 and 14 more the same evening. **A compliant blueprint would have
skipped 17 DB requirements.** ⚠️ **And that count itself read "18" for a day before it was recounted, and
the wrong figure had already propagated to four files** — which is the same lesson twice.)* ⇒ **A register is always read. Never tell the next session to skip one.**
✅ **But `spec.md §①` DOES say what not to read, and must** — `module-build` states that §① names what to
open, in order, **and what not to read**. 🔑 **The line between them: a superseded or working artefact may
be excluded by name** *(the old mockups · the English journal · a draft)*; **a live register — `§6` · `§7` ·
`db_roadmap` · `schema.sql` — never may.** *(This distinction was measured missing on 13/08: as written,
the flat rule would have deleted a section the next skill depends on.)*

➕ **And in the same turn: a line in the step guide §⑥1 pointing at the spec folder** — that is the file
Ishay actually pastes from, and the pointer makes the spec an entry point even for someone who opens the
guide and not the skill. 🔴 **Verify yourself whether the line is already there.**

## 🛡️ Cross-check before handoff — a closed list

🔴 **Stage 3 is the last control before the blueprint** — whatever remains contradictory or missing here
**becomes code.** ⚠️ **Therefore the check is defined and not left to interpretation.** In his words:
> *"זה נתון לפרשנות, כל אחד יעשה בקרה מסוג אחר וככה דברים יתפספסו."*

**Six cross-checks. Each produces "found / not found", not a feeling. Do them as written; do not invent
your own.**

1. **Label vs label** — a term appearing in two files with different wording *(`processes-approved` vs
   `screens-approved` vs the mockups)*. **Locked vocabulary is contract item ①.**
2. **Number vs number** — the same datum in two places with different values *(counts, thresholds,
   weights, quotas)*.
3. **A ruling with no expression** — a process ruling with no trace in any screen card. 🔑 **This is the
   check that returned the most:** ⟦EX⟧ *(in one round it produced **nine** findings, all of them
   "already-ruled-elsewhere" — i.e. **none was visible on a normal read**)*.
4. **Column name vs `docs/schema.sql`** — exists? spelled right? on the right table? *(contract item ④)*
   🔴 **Mind the late-`ALTER` trap** (§2①).
5. **DB requirement vs `docs/db_roadmap.md`** — every column/table/policy the spec assumes exists:
   **verify by grep, in two variations, not by declaration.** ⚠️ **Measured that a declaration lies.**
6. **Reverse coverage — against the requirements ledger.** Every ledger row must map to a ruling or to a
   recorded rejection. **A row with neither is a silent omission.** *(With the ledger in place from Stage
   0 this is a lookup rather than an excavation.)*

🚫 **What you do with a finding: report it to Ishay and fix it with his approval. Do not fix silently and
do not decide alone.**
⚠️ **And "zero findings" is a legitimate output** — but only after all six ran in fact, and you said they
ran.

## 🔴 Fresh-context reviewers — mandatory, and three distinct angles

**Why it is not negotiable, and the two measurements are separate — do not merge them into one number:**
**(a) self-catch rate `0 / 5` on a self-authored artefact — measured in the sister project (710), and
directionally confirmed here but never counted here.** **(b) On one REG-IN Discovery file, Claude's own
re-read returned `0` findings and a fresh-context reviewer returned `21`, six of them blocking.**
⇒ **Every mechanism that ever worked compared against an external anchor.** 🚫 **Never substitute your own
re-read.** *(Both figures are `⟦EX⟧`. Cite them with their provenance or not at all.)*

**When: ① at the end of Stage 1** *(before drawing — ambiguity there multiplies by N)* · **② before
handoff.**
**What they get:** the approved files and the mockups — **without the conversation, without the reasoning
that produced them.**

**🔴 Give each agent ONE angle, not all three.** *(Ishay's standing approval, 08/08/2026:*
> *"מרשה לך גם 2 סוכנים ליתר ביטחון זה מסמך ממש חשוב"*.)

| # | Angle | The prompt it gets | What it found ⟦EX⟧ |
|:-:|---|---|---|
| **①** | **Source auditor** | *"אילו טענות כאן חסרות מקור — אמת כל אחת מול הריפו בעצמך"* + *"מה האפיון לא מזכיר שהבלופרינט יצטרך?"* | a whole email layer nobody had mentioned · 5 label mismatches |
| **②** | **Independent calculator** | *"חשב מחדש מהנוסחאות בלבד, וקרא את התוצאה שלי רק אחרי שכתבת את שלך"* | confirmed 14/14 — **and found one term ambiguous**, with the second reading giving a tie |
| **③** | 🔑 **Simulated build session** | *"אתה בונה. **מותר לך לקרוא רק את הקבצים ברשימת-הקריאה.** כל מקום שתצטרך לנחש — זה ממצא"* | **two wrong claims Claude had written himself** · a phantom column · an unimplementable constraint |

🔑 **③ found the most, because it is the only one constrained to the real consumer's field of view.**
🔑 **And angle ① works only if the agent goes and searches — not if it reads the document.**

## ➕ A blind-spot pass — a separate block, before the final question

*"הנה מה שאני לא בטוח לגביו / מה שיכול להפתיע אותנו במודול הזה"* — **what a senior engineer would think
to check here that Ishay did not think to ask.** Then: **"על מה לא שאלתי ושווה שתספר לי?"**
⚠️ **A separate block, not folded into the final question** — folded, it disappears.
🔴 **A blind spot must name something concrete and checkable** — a file, a mechanism, a scenario someone
could go verify true or false. **"אין" is a legitimate and preferred answer over invention.**

## ז · Saving and closing

**The path is named, not "by convention": `docs/specs/module_[NN]_<slug>/`** — the folder name identical
to the step guide, **zero-padded, resolved by listing** (see "How to read this file"). **What the folder must
contain:** `processes-approved.md` · `world-sources.md` · `discovery-log.md` · **`spec.md`** · **and, when
`M ≥ 1`:** `screens-approved.md` **+ the shared data set + the design contract — the last two are required,
not optional**, because the approved cards cite them (2א).
⇒ **4 files for a module with no surfaces; 7 for one with surfaces.**
🚫 **Nothing beyond that list without approval** — this folder is what the blueprint opens.
✅ **Two named exceptions:** **the handoff file** *(the acceptance test's home — §6)*, and
**a research / algorithm document** — ⟦EX⟧ *(one module's research file is registered in `docs/CLAUDE.md`
as a source to read before any discussion of that module)*. **What does not belong: a private note or a
draft.** **List what is in the folder and say which category each file is in.**

**🛑 Handoff in two turns:** first a **key list** — one line per chapter, "what is inside and what differs
from what you approved". Only then **three separate rulings: scope boundaries · "מה ייחשב עובד" · "מה אסור
לנחש"** — **because these were born inside the document and were never approved**, while everything else
was approved item by item along the way. **12 chapters for one approval, at the end of a long session,
turn "מאשר" into the path of least resistance.**

**Then:** report in one line what was saved and where — **without asking approval for the path** *(he has
no way to prefer one folder over another and would approve blind, which trains the habit that his approval
is not understanding)*. Then: **① print every surface from Stage 1-א with covered / not covered / not
required** · **② close the journal: what remains open, and what you would do differently.**

⚠️ **And on the closing report.** Ishay's paste block asks for a *"דוח מרגיע מבוסס-נתונים"* — that the
blueprint will find everything and lack nothing on DB, logic, screens and tests. 🔴 **The data are
mandatory and the reassurance is derivative, never the reverse:** enumerate which checks ran and what each
returned, then let the conclusion follow. **The reassuring answer is the one failure that cannot be
repaired afterwards** *(«אז סגרנו באמת את כל הפינות?» — the honest answer was "לא, נשארו ארבע")*.

## 🔴 The write-back — this is what makes a spec a thing that exists

| To… | What |
|---|---|
| **`PROJECT_MASTER §7`** *(the file: `docs/PROJECT_MASTER_sec7.md`)* | every closed item — **the token, not only the narrative.** The `grep` other modules run sees only the token |
| **`§6`** | every `🚧 מX` created |
| **`docs/db_roadmap.md`** | **every DB requirement.** 🔴 **This is the register the blueprint reads — not the spec** |
| **The tally line in §7** | recount and verify |
| 🔴 **The step guide `§⑥0`** | **create the Discovery launcher block if the guide has none.** ⟦EX⟧ *(measured 13/08/2026: `⑥0` existed in **2 of 8** step guides; the rest still read "שלושת הפרומפטים להדבקה" and carried no occurrence of `⑥0`, of `module-discovery`, or of the word "Discovery".)* **This skill's own trigger list names that block — so for most of its target modules the trigger does not exist until a Discovery writes it.** Write it at the END, describing what actually ran. **Re-measure the count yourself** — §2① |
| **`docs/guides/module_playbook.md`** | 🔑 **Ishay's Hebrew door — it holds the trigger sentence, the mid-Discovery resume prompt and the stage-3-only prompt.** **If this Discovery changed the shape of anything those blocks name, they are now stale.** ⟦EX⟧ *(measured: zero references in either direction between the playbook and the skill.)* |

⚠️ **The measured failure:** 3 items were declared closed in the spec **and remained 🟡 in the register**,
and one was **half-closed** — the narrative said "closed", the token did not. **Caught by a fresh-context
agent, not by re-reading.**
🔴 **And this is iron rule 13(א): §7 first, verbatim, before any ledger or citation that reflects it.**

---

# §7 · The tools you have — a capability not mentioned is a capability you will not use

- **The DB MCP — the most important tool here.** The schema snapshot goes stale; **the live DB is the
  truth.** Read from it directly to verify columns, policies and row counts **before** you state them.
  🚫 **Read only.**
- **The browser — use it yourself.** Open the system and look at existing screens to match the design
  language, **and verify browser-visible facts yourself — do not delegate the check to Ishay.**
- **The front-end design skill — raise it in Stage 2** (surface = mockup), especially for RTL.
  ⚠️ *(It is named for Stage 2 deliberately: a previous wording pointed at a stage that no longer existed
  after ד+ה merged, and the harvest ledger recorded it not firing — twice. **An instruction pointing at a
  stage that does not exist never fires.**)*
- 🚫 **Do not raise a style/palette library.** The system has an **approved** design language, and changing
  colours or layout without Ishay's approval is forbidden. A mockup that "looks impressive" in a new style
  is exactly what is not allowed here.
- **Read `docs/toolbox.md` before raising a tool that is not on the list** — dispatching to a disabled
  plugin **fails silently.**

# §8 · Journal, persistence, interruption

🔴 **Keep a journal as you go — `docs/specs/module_[NN]_<slug>/discovery-log.md`, beside the spec.**
**In English** *(repo convention: reader = Claude ⇒ English; Hebrew only as data — Ishay quotes, screen
names, UI strings. The approved files, by contrast, are in Hebrew — their reader is Ishay, and the spec is
**his only control surface over the module**, because he cannot review code)*.
After each process and surface: **what was covered · what Ishay corrected · where it got stuck · what
surprised you.**

🔴 **But the journal is not the primary target for a ruling.** **The Hebrew file —
`processes-approved.md` — is** (Stage 0ד). The journal holds the evidence trail; the Hebrew file holds the
ruling.

**Every ruling touching the open-questions register is written to it in the same session** — not "later".
🔴 **And even when the item is already closed: a number or rule you write that overrides what the §7 item
says updates §7 in the same turn.** **A closed item is not a correct item** — it records what was ruled
**then**, and if something else has been ruled since, the register lies silently. **And that is the
register the blueprint opens.** ⟦EX⟧ *(a closed §7 item carried algorithm weights that were replaced **22
days** later in a research document; nobody updated it. Caught only when Ishay asked for an explicit
cross-check.)*

**Feel the context running out?** Stop at a clean point, write the handover (§6, the four-part acceptance
test), close the journal, and tell Ishay explicitly that you are stopping and why.
🚫 **Do not compress Stage 3 in order to "finish" — a spec written in haste is worse than one that stopped
midway.**

# §9 · When to commit, and on which paths

**When:** at the end of every meaningful work block, **and before you report to Ishay that you are done** —
not "at the end of the day".
**How:** `git commit -- <explicit paths>` **only.** 🔴 **Never `git add -A`** — the working tree is shared,
and a blanket commit sweeps in other sessions' files ⟦EX⟧ *(a one-file commit swept nine foreign files)*.
**What to record:** the spec documents · the journal · the registers you touched · the approved mockups ·
`STATUS` and the main log.
**Pushing:** a personal branch is allowed. 🚫 **`dev`/`main` never, and PR/merge are Ishay's action only.**
⚠️ **Update `STATUS` and the main log last, right before the commit** — the end-of-session check requires
them to be the newest, and any edit after them returns them to "stale".

# §10 · Stopping rule

At any stage, **stop** if you are about to: complete an unapproved product detail · ask a question you can
decide yourself · create a mockup without an approved brief · create a document with no clear use in the
next stage · expand the module beyond what was approved · or add a skill/hook/agent without a proven need.

**And when you finish a reply — if something is unclear to you, say so explicitly. "לא ברור לי" is a good
answer.**
---

# §11 · Contract items — what the spec must produce so the blueprint does not guess

**The rationale, and it is not stylistic:** the next prompt **does not need to "understand" the spec — it
needs to check itself against it.** Prose can be read several ways; these **either match or they do not.**

**1. 🔒 Locked vocabulary** — one table: every status · every entity · **every on-screen label**, word for
word. 🔴 **And before you lock a term — `grep` it across the module's documents and the open-questions
register, in two variations** (§2). **Internal locking is not enough: it ensures you are consistent with
yourself, not with what already exists.** **A term already defined elsewhere is adopted or explicitly
cancelled; you do not invent a second name for it.** ⟦EX⟧ *(the same thing had **three** names in three
files — one of them a closed §7 item, one an algorithm document, one the spec ruling. **And that is the
file the builder reads.**)*

**2. ➡️ Decided order** — who starts · what is saved · what happens before what. *(This is what lets a
screen be derived rather than invented.)*

**3. 🔢 At least one checkable number — this is the heart of Stage 3.** A full case with real values,
**hand-computed by Claude from the formulas.** ⟦EX⟧ *(five candidates, two disqualified at the gate, and
the expected result `0.67 · 0.66 · 0.64`.)*
🔑 **The chain that turned a spec into a checkable blueprint:** ⟦EX⟧ *(one value appeared **once** in the
frozen spec ⇒ **33 times** in the build guide ⇒ then into the permanent regression anchors.)*
🔴 **If this module's sections carry no computed output value, you must produce one.** *(No numeric value
at all? Produce a different kind: **"the 03:00 run flips exactly `#7` and nobody else"**.)*
🔑 **The boundary** *(Ishay's ruling 07/08/2026)*: **the spec supplies one hand-computed expectation · the
blueprint builds the test from it.** 🚫 **Do not list which tests to implement** — the blueprint has a
`Verify` field in every step, and a list here is both duplication and something that will rot.
⚠️ **Why the expectation must come from here:** a blueprint session **can** invent a test, but **cannot**
invent the correct result — that requires reading the formulas and computing. **And if it computes it
itself, the test compares the code to itself** — a guard that guards nothing.

**4. 🔗 A cross-module line** — what this module reads/writes in others' tables, **with the exact column
name.** 🔴 **And verify every column name against `docs/schema.sql` before writing it into the spec.**
⟦EX⟧ *(a spec wrote `projects.hostess_count`; the real column is `required_hostess_count` — and it is
exactly the one another module writes.)*

**Mechanical enforcement for three of the four:** `grep` on a label appearing in two forms · `grep` on
`[a-z_]+\.[a-z_]+` against `schema.sql` · and the checkable number is a test that ran.

---

# §12 · 🔇 The silent-decision register — the one nobody keeps

🔴 **Written because it was measured absent.** ⟦EX⟧ *(at Ishay's demand, before closing a module, Claude
listed **fourteen** things it had decided alone. None had been asked about. None had a register.)*

🔑 **The pattern behind almost all of them: they were either *wording* or *demo data* — and both look
"non-product", which is exactly why they are never raised.**
⚠️ **But wording on a screen *is* the product** — a build session implements the string verbatim — **and
demo data goes to the conference.**

**⇒ At every stop point, alongside the findings table, one short block: "מה הכרעתי לבד מאז העצירה
הקודמת".** One line each, with the class:

| Class | Examples of what belongs here |
|---|---|
| **✍️ wording** | button text · chip and badge labels · empty-state copy · column headers · error text |
| **🎭 demo data** | invented people, companies, dates · the shared "today" · scale and row counts |
| **🔀 tie-breaks** | a mockup-vs-spec contradiction you resolved yourself instead of stopping (Stage 2, the third branch) |
| **⚙️ reversible technical** | query shape · component split · file naming — **listed, not asked about** |

🚫 **This is not a request for approval** — a reversible technical decision is yours (§2④) and asking about
it is the over-asking failure. **It is a register**, so that a decision he would have made differently is
visible **while it is still cheap**, instead of arriving at the conference inside an approved mockup.

🔴 **And one entry type is not a register line but a task: a check you wrote and did not wire.** ⟦EX⟧ *(a
`check:docs-structure` rule was written as a passage in a document instead of a script under `scripts/`;
**a check that is not wired will not run**, and the rule turned back into a rule-that-was-written inside
the same turn.)* **If a check earned its place, wire it in the same turn or record it as a debt.**

---

# §13 · Repo mechanisms this session will hit — and that live in files this skill does not otherwise name

**Read `CLAUDE.md` (root) and `docs/CLAUDE.md` — they load first and they govern this session too.** The
items below are the ones a Discovery collides with; **verify each against those files rather than trusting
this list** (§2①).

| What | Why it hits a Discovery |
|---|---|
| **Plan Mode (iron rule 2)** | mandatory for **opening a module · closing a module · a §7 ruling · any material deviation.** A Discovery rules §7 items ⟦EX⟧ *(one closed ten)* ⇒ **Plan Mode applies here, not only to builds** |
| **The Stop hook** *(`.claude/hooks/check-docs-updated.sh`, wired in `.claude/settings.json`)* | it **blocks the end of the session** until the documents it requires are updated. **Know what it demands before you get there**, including the main log `docs/CLAUDE_CODE_LOG.md`. ⚠️ **It hard-codes skill paths — read it and confirm which path it expects** |
| **The frozen spec is write-protected** *(`protect-frozen-files.sh`)* | any edit to `docs/reference_spec/*` returns `exit 2`. **You read C5/C6. You never touch them** |
| **The truth hierarchy** *(root `CLAUDE.md`)* | the approved spec outranks `C5`/`C6` **per item, not per folder** — *"גובר על C5/C6 בכל מה שהוא מכסה **בפועל**"*. ⇒ **"sole source of truth" means: on what it actually covers.** A gap in your spec does not silently outrank anything |
| **`§7` has a counting protocol with measured traps** *(`docs/PROJECT_MASTER_sec7.md`, "🔢 איך סופרים")* | count the status glyphs at line-start; **never count `§7.N` occurrences**; a hidden `U+200F` breaks a count silently; **`⚪ ממתין-לביצוע` is not closed.** §ז tells you to recount the tally — **recount it their way** |
| **The 🔗 mirror convention** *(`docs/CLAUDE.md`)* | restating a §7 ruling's **content** elsewhere is allowed **only** with `🔗 מראת §7.N — SSOT: PROJECT_MASTER §7 (לא לערוך כאן ידנית)`. A Hebrew spec that quotes rulings trips this on the first card |
| **The emoji set is frozen** *(`docs/CLAUDE.md` — no addition without Ishay's approval + deleting one)* | ⚠️ **and 🔵 already means "להנהון" in §7**, while §2④ of this file uses `🔵 פתוח`. **Raise the collision with Ishay rather than inventing a third meaning** |
| **Rule 13(ז)** | at the end — **recommend `regin-docs-sync`, say why now, and wait. Routines are run by Ishay only** |
| **`docs/delete/` is the deletion protocol** | a file that should not exist is **moved there with a reason. The deletion itself is Ishay's** |
| **The deadline, and the default under pressure** *(`STATUS.md` + root `CLAUDE.md`)* | scope pressure is a Discovery decision. **The recorded default is to defer whole modules, not to trim content** — read the current dates in `STATUS.md`, do not carry a date from here |
| **`_shared/ishay-calibration.md`** | reached through `_shared/discipline.md`'s list, and it is **scoped to exactly this path** — *"§1–§6 are calibration from a **Discovery** session"*. §4 of this file is a summary; **that file is the owner** |
| 🔴 **An active plan in `docs/plans/`** | **Check it before Stage 0**, and it bites twice. *(1)* A live plan may already dictate this module's work order — the retired procedure opened with this check for exactly that reason. *(2)* **`.claude/hooks/check-docs-updated.sh` lists this template in its `PLAN_STD` set** ⇒ a plan in `docs/plans/` with no pointer from one of those standard files **blocks the end of the session** with a message naming this file. **Either point at the plan or mark it `תוכנית סגורה` — but know it before the Stop hook tells you** |
| **A sibling module mid-flight** | a module whose Discovery already ran may have written cross-module contracts that name yours. **Read its `processes-approved.md`** — Stage 0ב's reverse direction |

---

# 🌾 The harvest ledger — four lines at the end of every stage, not at the end of the session

**Every stage, and that includes Stage 0.**
**①** how many rounds · and which stop point Ishay **actually** used, versus which he passed with a nod ·
**② 🔴 which section of this file did not fire at all in that stage, by name** ·
**③** where this file was wrong or missing, **quoting Ishay verbatim** ·
**④ 🔴 who caught each structural finding — Ishay or Claude — one line per finding, then the ratio.**

🔑 **④ is the only measure that shows whether the skill is improving.** ② measures **sections that fired**;
④ measures **outcome** — **and a section can fire and catch nothing.**
🔴 **And ④ is not a scoreboard, it is a work queue: every row that says "ישי" is a candidate to become a
`grep` or a checklist line in this file.** **The measure of a revision is how much of that column moved
from "ישי" to "מכני".**
📊 **The baseline to beat, and it is written down so it does not get forgotten:** ⟦EX⟧ *(in the two
measured shifts, **5 of 6** and **4 of 4** structural findings were caught by Ishay, and none by Claude on
its own initiative.)* **A ratio that does not change means the fixes did not work, even if every section
fired.**

🔴 **② is the important one and nobody does it: a skill must shed what never fired.** **Without
measurement, skills only swell** ⟦EX⟧ *(one repo skill died at ~230 lines; another stands at ~296 and is
already flagged.)*

**Where it goes:** `docs/guides/discovery_lessons.md` — the Hebrew retrospective file, whose readers are
Ishay and the session that maintains this skill. 🚫 **Not `discovery-log.md`** — that one records what was
decided in *this* module; the ledger records *how one works*, and the difference was measured (Stage 0,
outputs matrix).

---

# 🔧 Maintaining this skill

**Not part of a run.** If you are revising this skill rather than executing it, read
**`maintenance.md`** beside this file: the build-from-the-transcript rule, the no-trimming ruling, the
splits already evaluated and rejected with their reasons, the two-file contract with Ishay's playbook,
and the mechanical generic-law check.
