---
name: skill-scan
description: REG-IN — scan an instruction artifact (a skill, CLAUDE.md, a micro-guide, a reference file) for rules that cannot fire, cannot be audited, do not earn their lines, or are filed where their reader never goes. Load whenever Ishay wants an instruction file examined rather than executed — "סרוק את הסקיל X", "תסרוק את CLAUDE.md", "בדוק את קובץ ההוראות", "האם הכללים האלה באמת עובדים?", "יש כאן כללים מיותרים / כפילויות?", "למה הכלל הזה אף פעם לא רץ?", "עשה ניקיון בסקילים", "scan this skill", "audit these instructions". Also load when a rule was written correctly and still failed to fire, or when a file has grown and nobody knows what to cut. This skill finds and reports; it never rewrites the file it scanned and never deletes anything. NOT for reviewing code (quality-audit), not for closing a module (module-close), not for writing a new skill (skill-creator).
---

# Skill scan — do these instructions actually work?

Read `.claude/skills/_shared/discipline.md` first (it points at the global doctrine).
The failure modes this scan hunts are catalogued in `.claude/skills/_shared/failure-modes.md` —
open it, because four of the five lenses below are one of those modes made checkable.

**What this scan is for.** A rule can be perfectly written, agreed by everyone, and still never
change a single decision. That is the dominant failure in this project: measured across four
consecutive shifts, the headline was never "a rule was missing" — it was **"the rule existed and
nobody ran it."** Reading an instruction file tells you whether it is *correct*. This scan asks
the different question: **can it fire, can a skip be seen, and is it worth its reading cost?**

**What it is not.** Not a rewrite, not a code review, not a judgement of whether the rule is a
good idea. Content is Ishay's. You examine *mechanism*.

---

## Before anything: two things that decide whether the scan is even valid

### 1. You cannot scan an artifact you wrote

This is failure mode 🅰️ — no layer can audit the layer above it — and it has been measured five
separate times in this project with a self-catch count of **zero**. A session reviewing its own
text finds confirmations, not defects.

⇒ **If the file you are asked to scan was written or edited in this same conversation, say so and
run the scan through a fresh subagent** that has not seen the reasoning behind it. If that is not
possible, run it anyway but **label the report "self-scanned — treat findings as a floor, not a
gate."** An unlabelled self-scan is worse than no scan, because it reads as verified.

---

## Measure outside the file first — three cheap measurements that change what you find

Reading the text alone gives you the author's view of the file. These three give you the reader's,
the historian's, and the field's — and in a measured comparison each of them produced findings that
a text-only pass missed entirely.

### a. Density — because line counts lie

`module-blueprint/template.md` is 119 lines and **4,990 words: 42 words per line, with one line
carrying 2,848 characters and six separate binding rules.** A scan scoped by `wc -l` mis-sized the
work several-fold.

⇒ Open the two or three longest lines and look. **Report scope in *rules examined*, never in files
or lines.** And note what a dense line costs: a dedicated fix-round once landed on exactly the right
line, corrected half of it, and missed the other half — the rule was buried too deep to see.

### b. The growth history — `git log` on the file itself

`git log --format='%ad %s' --date=short -- <file>` plus a word count at a few points answers the one
question the text cannot: **what was ever removed?**

One file measured here had grown roughly eightfold in a month while only two of its twenty-five
commits removed any text at all — the removals amounting to about one percent of what was added.
That is failure mode 🅳 with a number on it, and it reframes the scan: the problem is rarely one bad
rule, it is a ratchet.

🚫 **Deliberately no exact figures here.** Naming them would hand you an expected answer, and a
number you are about to verify is exactly the leakage defect lens 4 hunts. **Measure the file in
front of you and report what you get** — if it happens to match a figure you half-remember, that
agreement is worth less than a blind measurement, and you should say so.

**Also ask when the file last actually ran** — the date of the last real use, against the dates of
what was added since. Text written after a file's last real use has never been tried in the field,
and no amount of reading will validate it.

### c. The artifacts it produced — did the rules actually land?

A rule can be perfectly written and simply never reach the output. If the file produces something
(a guide, a report, a prompt), **open two or three real outputs and check.**

*Measured: the blueprint template's structural rules all landed in the three guides it produced —
so the core is proven, not merely plausible. But three of its mandated gates (a contrarian lens, an
outsider lens, a blind-spot pass) had **zero occurrences anywhere in `docs/`**: no evidence they ever
ran, and no way to tell.*

⇒ This is the sharpest instrument available to a scan, and it cuts both ways: it tells you what to
protect as well as what to doubt. **A rule with no trace in any artifact is not proof it was skipped
— it is proof you cannot tell**, which is itself lens-2 finding.

---

## Scoping a run

**The cluster decides the size, never a constant.** It may be one file or ten. Files that reference
each other travel together — splitting a tightly-coupled cluster breaks exactly the pointer the scan
exists to protect, and the damage will look like the next worker's mistake rather than yours.

*(Ishay struck an early draft that hardcoded "~3 files": "אולי 1 אולי 10 — לא יודע.")*

**Measure first, ask second.** Present the scope choice to Ishay **after** you have counted what is
there — rules per file, density, which files point at which. Asking "skills or docs?" with no
numbers makes him choose blind.

---

## The five lenses

Run every lens over every rule in scope. **Each lens produces either a finding or an explicit
"אין ממצאים"** — that is what lets Ishay see the whole scan ran without reading the file himself
(failure mode 🅰️, the counter).

### Lens 1 — Can the trigger be seen from outside?

*A rule whose trigger needs judgement never fires.* The person who should notice is precisely the
one whose attention is already on the next thing (failure mode 🅲).

**The test:** could someone who is not you — or a script — point at the moment this rule started
applying? If the answer needs an inference, the trigger is not observable.

**What a good fix looks like:** hang the rule on an artifact — a commit, a file appearing, a
required output shape, a specific word from Ishay. Never on "when you notice that…".

*Anchor: six written, correct procedures had never once run — not one of them had a sign anyone
could see.*

### Lens 2 — Would a skip be visible?

Ishay cannot read code and does not read most of these files. If a rule is silently skipped, what
would tell him?

**The test:** name the artifact where the skip would show. No artifact ⇒ finding.

**What a good fix looks like:** the rule requires a line in an output — including an explicit
"אין הערות" when there is nothing. A missing line is the only audit available to someone who
cannot read the work itself.

### Lens 3 — Does it earn its lines?

Failure mode 🅳: everything here is read every session, and nothing removes anything.

**The sharpest test, and it is decisive:** *what would a session do **differently** because of this
paragraph?* If the honest answer is "understand the background better", the paragraph belongs to
Ishay or to an archive — **not to a file that loads on every turn.** A diagram is the most inert
form of text: it commands nothing.

**Also flag:** two rules that overlap (one should become a pointer to the other — never delete one
of a pair) · history written as if it were instruction · a rule restated in two files, which will
drift apart within weeks. ⚠️ **A duplicate is worse than wasteful once the copies diverge** — check
which copy is *older*, because the stale one is the one that will be read into new work.

**And the inverse test, which catches the opposite defect from everything above — overfitting.**
A rule that does nothing fails lens 3 loudly. A rule fitted to one incident **does** something: the
wrong thing, in every situation that is not the one that produced it.

⇒ **Ask of any rule anchored to a single incident: would this have been HARMFUL in some earlier
situation?** *(Anchor: a session-archiving rule born from one moment killed the outgoing-consult
that the handover protocol itself requires — the inverse test would have stopped it before it was
written.)* A rule that survives the inverse test earns its generality; one that does not belongs to
its incident, as a dated note.

### Lens 4 — Does the measurement know when it lies?

Failure mode 🅴, and it fired five times in a single shift. Any rule that tells a session to count,
measure, compare or quote a number gets this lens.

**The test:** does the rule state what the number measures and what would make it wrong?

**The three shapes seen here so far, worth checking by name:**
- **the metric that runs before the data it measures exists** (a growth ratio read before the
  shift's evidence was written — reported 8:1 instead of 2.2:1);
- **the formula that counts more than it claims** (a velocity count that swept inherited history —
  returned 24 work-days instead of 8);
- **the absence-claim narrower than its own conclusion** ("zero of six exist" was a measurement of
  one file; three were in another). ⇒ **An absence-claim is only as wide as the set of places
  searched — the rule must name the places first, and search the way the SOURCE writes it, not the
  way the reader remembers writing it.**

**And the fourth shape, which is leakage rather than error: does the rule hand its reader the
expected answer instead of a way to measure?** *"Run it and report the count"* produces a
measurement. *"There should be 71"* produces a confirmation — the reader stops looking the moment
the number matches, and a real change goes unseen. Any rule that states a count, a version, a
duration or a threshold as a fact the reader is about to verify has this defect; the fix is to
delete the number and keep the method. *(This has already fired here: a verification prompt was
handed three candidate test counts, which is three anchors where there should have been none.)*

### Lens 5 — What is missing?

The only lens that does not converge — you can always imagine another scenario, which is exactly why
it needs brakes (below).

**How to run it productively:** take a concrete scenario the file does not obviously cover and walk
it step by step. The most valuable scenarios are **interruptions**, not clean runs: the procedure
written for a shift that *ends* had four separate ordering defects the moment someone asked what
happens when one is *interrupted* — and four independent reviewers each found a **different** one.

🔴 **Send the scenario alone, without your own findings**, if you use a second reader. Sending the
findings with it produces agreement instead of evidence.

---

## The wrong-home class — hunted explicitly, not left to the lenses

A rule filed where its reader never goes. **Three occurrences in one day, two caught by Ishay** —
which is why this is its own pass rather than something the lenses are trusted to notice.

**Distinguish it from a gate placed after the work it governs:** that is about *order within* a
file; this is about *which file at all*.

**The pass:** for each rule, name **the artifact its reader actually opens.** A rule about how to
write a prompt filed in a file about prompt *contents*; a pre-build shape filed in a memory file
that is not on any read list; a builder-facing rule living only in a manager-facing skill — all the
same class. **The rule was correct in every case. The defect is purely one of reach.**

---

## The three brakes — remove one and the scan stops converging

Measured on a real run: pass 1 produced 6 findings, pass 2 produced 1. **A file reaches zero in two
or three passes** — because four of the five lenses are binary. Once "the trigger is observable" is
true, it is true forever and no further finding can be generated.

**The danger was never inflation. It is someone removing a brake.**

1. **The filter.** A finding must name the rule, the lens, and what breaks in practice. "This could
   be clearer" is not a finding. *(On the measured second pass, the filter rejected one — it works.)*
2. **The subtraction quota.** Every scan proposes at least one thing to **remove or merge**, or says
   in one line why nothing qualifies. A scan that only adds is failure mode 🅳 with extra steps.
   ⚠️ **But the quota is never a licence to merge on suspicion** *(measured 06/08/2026: merges proposed
   as duplicates turned out to guard different things)*. A proposed merge is a citation like any other
   (`discipline.md`) — verify against the source that the "duplicate" guards the **same** thing before it
   enters the report. **Carry the proof in the finding's row: what the duplicate protects, and the
   `file:anchor` where the survivor covers it — a merge without that line reads as unverified, because it
   is.** Cannot verify this session (no MCP, a contested file)? It is not a candidate: mark it
   טעון-בדיקה and keep both.
3. **The stop condition.** Two consecutive passes producing nothing new ⇒ the file is done. Say so
   and stop. Do not go looking for a third.

---

## Output

**Report in Hebrew. Never edit the scanned file.**

```
## סריקה — <קובץ/אשכול> · <תאריך ושעה מקריאת שעון>
היקף: N כללים ב-M קבצים · סריקה עצמית: כן/לא
המדידות שמחוץ לקובץ: צפיפות <נדגמה/לא> · היסטוריית-גדילה <נוסף X, נגרע Y, רץ לאחרונה DD/MM> ·
תוצרים שנבדקו <כמה, ומה נמצא בהם / "אין תוצרים לבדוק">
(מדידה שלא בוצעה — נאמרת במפורש. "לא בדקתי" הוא דיווח; שתיקה היא דילוג)

### ממצאים
| # | הכלל (ציטוט קצר) | עדשה | מה נשבר בפועל | ההצעה | איך נדע שזה עבד |

### חמש העדשות — מעבר מלא
עדשה 1 — <ממצא / אין ממצאים>
… (כל חמשן, כולל "אין ממצאים" מפורש)
מחלקת "הבית הלא-נכון" — <ממצא / אין ממצאים>

### חיסור
מה מוצע להסיר או לאחד — או שורה אחת למה כלום לא מתאים.

### הכרעות שהן של ישי
מה שנוגע בתוכן ולא במנגנון.
```

🔴 **Every finding carries "how will we know the fix worked?"** — or is explicitly flagged
**unverifiable**. This exists because a whole shift of scan output was theory: not one line written
that day had ever run, and nothing marked it as unproven. A future reader must be able to tell a
proven fix from a plausible one.

**"לא בכוח."** No findings ⇒ **"אין ממצאים"**, plainly. A manufactured finding is worse than a
blank page — and it is the likelier failure once everyone knows the scan is expected to produce
something.

---

## Step 2 — the fix prompt. Gated, and it does not run with the scan

A scan that ends in findings and nothing else leans on somebody remembering to act, which is
failure mode 🅲. So the scan has a second step that turns findings into a prompt another session can
execute — **but it is a separate step, and it does not start until Ishay has said which findings are
in.**

🔴 **Never emit both in one pass.** Two reasons, and the second is the real one:

1. **A finding is not a decision.** Some are mechanism (yours), some are content (his). A prompt
   generated from every finding smuggles content decisions past him inside a technical wrapper.
2. **It corrupts the scan itself.** Once you know you will also be writing the fix, the incentive
   shifts toward findings that are *easy to prompt* rather than findings that are *true*. The scan's
   value is that it has nothing to sell.

*(This is the project's existing pattern, not a new rule: `queue.md` already says "write the prompt
only AFTER he chooses — writing three means discarding two." The estimate is enough for him to
decide.)*

**When he has chosen, the prompt covers exactly those findings and not one more.** It carries:
- **the finding, its lens, and what breaks in practice** — so the executor can refuse it if the
  premise is wrong rather than implementing a defect faithfully;
- **the file and a grep anchor, never a line number** — line numbers rot between writing and running;
- **"how will we know it worked"**, copied from the finding — a fix whose verification was never
  stated is a fix nobody can confirm;
- **the three gates below, verbatim** — deletion goes to `docs/delete/`, harvest before shrink,
  `~/.claude/**` stays out;
- 🔴 **and an explicit line that the executor may refute any factual claim in the prompt**: *"כל
  עובדה כאן ניתנת לערעור — אם מדדת אחרת, תקן אותי עם המדידה."* Scan findings are measurements taken
  at one moment; the file may have moved since.

**What the prompt must NOT carry:** findings he did not pick · the scan's own reasoning as
justification (the executor should re-derive) · and **no expected numbers** — say "count it and
report", never "there should be N", for the reason lens 4 gives.

---

## Three gates you never pass alone

1. **Deletion.** Never remove a file. Move it to `docs/delete/` and Ishay deletes. The file leaves
   the path immediately, nothing is lost, and the irreversible act stays his.
2. **Harvest before you shrink.** Any fact still binding moves to a permanent home **before** the
   line comes out — otherwise "shrinking" is losing. And a closed section often *contains* a live
   warning ("never restore this filter"): scan for those before anything is archived.
3. **`~/.claude/**` is never in a REG-IN batch.** The global `CLAUDE.md`, the canonical playbook and
   the personal skills change other projects too.

**Never cut the *why* and leave the rule** — a prohibition without a reason gets optimised away by
the next session that thinks it knows better. **Never cut a rare rule**; "no test caught it" is not
"safe to cut". In doubt — keep, and say you kept it.

**Numbers every run:** rules examined · findings · lines proposed for removal · lines proposed to
move elsewhere. If lines would vanish that were neither moved nor ruled on, the number shows it.
