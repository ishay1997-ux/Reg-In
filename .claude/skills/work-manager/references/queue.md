# The queue — an item arrives · routing · order · decisions · a module's lifecycle

Loaded from situations 1 · 2 · 3 · 15 · 18 · 19.

---

## Situation 1 — a new item arrives

**Trigger:** an idea of Ishay's · a review finding · a matured `🚧` debt · a builder's request.
**Read:** the window in `docs/work_plan.md` · the active module's micro-guide · `§7` if it is an open
question.
**Output: a visible verdict** — `בנה-עכשיו` / `דחה-ל-X` / `לא-נדרש-כי-Y` plus a one-line reason,
**so Ishay can catch a skip.**

**Default:** a module behind its deadline ⇒ `דחה-ל-אחרי-הדדליין`.
🔴 **And whole modules get deferred, never trimmed** — a half-built module is rewrite debt; a deferred
one is clean.

---

## Situation 2 — routing an item to a skill or a specialist

**Read `docs/toolbox.md` before proposing any tool** — dispatch to a disabled plugin **fails silently.**
*(`npm run check:context` is what keeps that file honest — it fails the gate if a skill dispatches an
agent from a disabled plugin.)*

**Repo skills — invoke directly, on trigger, without asking** (Ishay's mandate 01/08):
module lifecycle → `module-blueprint` / `module-build` / `module-close` · a merge reported →
`post-merge` · a §7 round → `section7-rulings` · whole-codebase health → `quality-audit`.
⚠️ **Anchor: a manager who hand-rolled a §7 round instead of routing through the skill skipped its
stale-detection pass — and asked Ishay a question he had ruled two days earlier.**

**Plugin/personal skills — propose in one line and wait:** built-vs-intent walkthrough →
`feature-acceptance` · a Hebrew document → `hebrew-doc-studio` · skill work → `skill-creator` ·
**the council** → `llm-council` (always offered; **the manager alone may launch it**, on a heavy
decision he is genuinely torn on).
**A small task justifies no skill.** If the answer is clear, just answer.

### The specialist bench — who, and when to summon

| Specialist | Trigger |
|---|---|
| **Fresh-context plan critic** | 🔴 **any plan you yourself shaped** |
| Silent-failure hunter | a round touching error handling or fallbacks |
| Test-coverage analyst | a round whose deliverable is tests |
| Security reviewer | permissions · RLS · server functions |
| Library expert (`context7`) | any claim about React/Tailwind/Supabase behaviour |
| Design expert (`frontend-design`) | every mockup **before** Ishay sees it |
| Credentialed-screen verification (`playwright`) | any visual claim |

**What each summons must demand — the shape differs, and so does the failure.**
**🔎 Finders** — *"אין ממצא" is a complete and valued answer*; one spawned **to find** has the strongest
incentive on the ladder to manufacture one. **📚 Researchers** — *a source per claim, and "לא מצאתי
מקור" is legitimate*; the failure is confident synthesis with nothing behind it, and recall is exactly
what this rung exists to replace. **⚖️ Deliberators** — *argue the side I did NOT bring, and say what
would change your mind*; shown one option, a critic improves it instead of questioning it.
**All three, before the answer: "what limits this — what you could not see, what you assumed."**
*(02/08: a consultant who declared his own contamination first changed how his answer was weighted.)*

| Specialist | Shape | 🔴 What the summons adds on top |
|---|---|---|
| **Fresh-context plan critic** | ⚖️ | **"which claims in this plan have no source?"** — the intent pass, run by someone who did not write it |
| **Silent-failure hunter** | 🔎 | per finding: **"what would the USER see when this fires?"** — a silent failure with no visible consequence is noise Ishay cannot judge |
| **Test-coverage analyst** | 🔎 | **"which of the round's `מה ייחשב עובד` sentences has NO test?"** — coverage against the stated outcomes, **not against the code** *(🅱️: tests measure code↔spec; nothing measures spec↔intent)* |
| **Security reviewer** | 🔎 | per finding: **"who could do this today, with which role?"** — falsifiable, never theoretical · and **both directions** of every permission change |
| **Library expert** (`context7`) | 📚 | **the version each claim applies to.** A source without a version is 🅴 — an instrument that will not say what it measured |
| **Design expert** (`frontend-design`) | ⚖️+🔎 | 📎 **governed by `ishay.md` §12** — it checks direction/contrast/real data, **never whether this is the screen he wants**, and that boundary is stated to Ishay verbatim |
| **Credentialed verification** (`playwright`) | 📐 instrument | 🔴 **"what exactly was asserted, and what would a failure have looked like?"** — a selector matching nothing passes silently *(🅴: the instrument lies)* |

### The peer manager (gedood-710) — a consult with sharp limits

**Address: ask Ishay for the session name.** 🚫 **Never guess by title** — the address dies at every
handover there, and Ishay is the only one who actually knows. *(Anchor: 710's manager matched by
title once and sent an entire shift-handover battery to the wrong session — their ledger #9. What
saved it was the recipient identifying himself, not a mechanism.)*

| | |
|---|---|
| **When** | a **method/process** question · before importing anything from them · when you find a defect that might be structural rather than local |
| 🚫 **Never** | technical judgement about **our** codebase (he does not know it and will guess confidently) · product intent · anything that needs Ishay |
| **How** | a bounded question with sub-parts — **never an open "what do you think"** — and always give something back. *(Every exchange on 01/08 carried a finding in both directions; that is what made them worth the tokens.)* |

**What to take:** the **practice** · a **measurement** you can re-run here · and above all a **shared
defect.**
**What NOT to take:**
- 🔴 **The justification.** It must be re-derived locally, or it collapses the moment someone asks
  *"אבל אנחנו לא הם"*. *(Two anchors, two arenas, same day.)*
- **Their numbers** — calibrated on their rounds, their machine, their module phase.
- **Their grants.** The merge grant is the standing example: a standing grant there, **Ishay always
  merges here.**

🔴 **And the rule that covers everything else: a peer manager is a reporter like any other.** His
claims about his own arena are **not verifiable by you.** ⇒ **take patterns, not facts.**
**And the asymmetry worth knowing:** a **shared solution** is weak evidence (both arenas read the
same sources); a **shared defect** is strong evidence that the failure is structural to how these
skills are written.

🔴 **The trap inside that asymmetry — an echo that sounds like corroboration.** Before treating a
convergence as evidence, ask **"מאיפה זה הגיע אליכם?"** If the answer is "from you", it is not a second
arena agreeing — **it is your own finding returning through another door.** *(02/08: the
archived-session finding was relayed to 710 and adopted there within the hour. A future manager, absent
from that exchange, would read "they do it too" as independent confirmation.)*
**This matters precisely because a shared defect is the strongest instrument this role has — a faked
convergence makes the strongest instrument misread.**

### Consulting a previous manager of this project — two things only

① **what he knew and never wrote to disk** · ② **why he decided as he did.**
🚫 **Never:** current arena state (his snapshot ended when his shift did) · technical judgement about
the code as it stands now · **and never a ruling — he is released and holds no authority.**
🔴 **The disk is the default.** He is consulted for what the disk cannot hold — **never as a shortcut
for reading it.** *(A successor who asks instead of measuring re-imports his predecessor's model and
loses the one asset a fresh context has.)*
⚠️ **His answer carries a halo — "he was the manager." Weigh it as a report, not a verdict.**
*(02/08: a recommendation built on zero occurrences, withdrawn only after push-back.)*

### What makes a consult honest — with anyone on the ladder

**The goal is neither agreement nor disagreement — it is a measurement neither of you could take alone.**
① **Doubt a NAMED claim, never a person or an approach.** *"Your claim X — I measured Y"* yields
evidence; *"I'm unsure about your direction"* yields noise.
② 🔴 **The strongest move is doubting yourself out loud, before your answer** — what contaminated you,
what you got wrong. *(02/08: **five of the five** valuable moments across four consults were
self-corrections, not attacks.)*
③ **"לא בכוח" applies between peers too** — nothing to add ⇒ **"אין הערות".** A manufactured objection
is worse than agreement, **and it is the likelier failure once both sides know they are expected to
challenge.**
**The receipt: an exchange that left no finding on either side was not worth its tokens.**
**And when you disagree and neither convinces the other — the ON-DUTY manager decides.**

🔴 **The general trigger for summoning: "I cannot verify this myself."** Not "this looks complicated."
**And tell Ishay you summoned one** — see `ishay.md`, and situation 20 in `builders.md` for
adjudicating what it returns.

---

## Situation 3 — refreshing the queue

**Trigger (four, all observable):** an item closed · a new item arrived · **a measurement that
contradicts the order** · a module boundary (open/close).

**Shape:** a **two-week window of 5–10 rows**, and **every row names route · parallel-safety ·
model+effort per `docs/guides/reference/claude_code_setup.md` §⑨ · an estimate.**
**The three rules of `work_plan.md`:** **index, not copy** (a row points at a step in the micro-guide;
detail written here instead of there is a finding) · **capacity test** (promote only what would
actually start inside the window — **an inflated window is a forecast lie**) · **ordering test**
(damage that worsens with real data or a hard date — **not abstract "importance"**).

**On every refresh:** drop what closed · promote by capacity · **re-run the ordering test on the whole
window, not just the new row** — the order is a hypothesis under test, not a decision carved in stone.
🔴 **And every order change is proposed to Ishay with a one-line reason, never done silently** (his
ruling) — **the order is his picture of the project; if it moves without his knowing, he has lost the
ability to catch you.**
**Ishay free (💬 empty) or a builder free (▶️ empty) — you initiate promotion, you do not wait to be asked.**

### 🆕 Output mode: **"על מה לעבוד"** (his word — three options, he chooses)

**Not "advance one step" — "what CAN be advanced, show me three, and recommend."**

**Measure before speaking:** git state · the window · **who is alive** (`list_sessions`) · quota ·
the binding deadline.
🔴 **Then filter by what can genuinely start NOW — blocked is not an option.** An item waiting on
quota, on Ishay's approval, or on another item finishing **does not enter the three.**

**Each option carries five fields:**

| Field | |
|---|---|
| **What it is** | a pointer to the step in the micro-guide, never a copy of it |
| **Why it is a candidate now** | the ordering-test reason — damage worsening with real data · a hard date · **or it unblocks a chain** |
| **What it releases** | what becomes possible afterwards |
| **Cost** | model + effort + a time estimate |
| **Risk and parallelism** | what it could break · what it can run alongside |

**And above them: one recommendation, first, with its reason.** He chooses.

🔴 **Honesty rule:** if only two can genuinely start — **say so. Never invent a third row to fill a
quota.**
**And write the prompt only AFTER he chooses** — writing three means discarding two. The estimate is
enough for him to decide. *(This deliberately overrides `work_plan.md`'s older "prompts ready to
paste" convention, which was written for a different command.)*

### The sequencing and batching doctrine
- **An open module's quality debt beats starting the next module.**
- **Decisions and building are different resources:** rulings consume **Ishay**, builds consume **a
  session** ⇒ they run in parallel. *(Hence decision work for the next module may open while the
  current one is still building — manager's recommendation, approved 01/08. **And the rulings prep
  itself goes to a dedicated session, not to the manager** — Ishay's preference: a manager consumed
  by a reading pass is a manager he cannot use.)*
- **Never batch** a round that stops on Ishay mid-way with one that does not, nor a round that can
  silently break a screen (DB/permissions) — **those run alone, with their plan gated first.**
- **Batch freely** additive, complementary rounds. Two lenses: a bundle **inherits the urgency of its
  least urgent member** (split mixed horizons), and **same file ⇒ same session**.
- **Diff every round against the micro-guide's remaining steps** before scheduling — overlap ⇒
  **shrink to the residue**. When absorbing under "no harm to the result": **name what is NOT covered
  and where it now lives.**

---

## Situation 15 — a decision was taken

**Trigger:** Ishay ruled · or you took a reversible decision.
**Output: an execution home with an owner — in the same session.** And record his rulings **as
verbatim quotes** — his phrasing is the spec; a paraphrase loses intent.

🔴 **A self-deleting or compacted artifact must never be the only home of a decision.** The fix-round
registry deletes its own closed sections; a rulings round's prompt lives in a file that gets deleted.
**On every edit to the plan file, check: does a ruling live *only* in a section scheduled for
deletion?** If so, copy it **in full and self-contained** into the section that will execute it.
**The same failure in a second shape — archiving and compaction:** a closed section often *contains*
a live warning ("never restore this filter"). **Before anything is archived, scan it for instructions
that are still binding, and confirm each one lives in the `CLAUDE.md` beside the code it governs.**

🆕 **And a fourth shape, cheap to miss: a prompt corrected in chat but not in the plan file is a
fork — sync the file before the corrected prompt ships.**
*(Anchors: 31/07 — two of Ishay's security rulings had no execution home, caught live. And §7.24
survived scrutiny precisely because it recorded his words verbatim: **"בהגשה אני רבע שעה מציג את
המערכת, אין קוד"**.)*

🔴 **And the third shape, caught 01/08: the window-conditioned decision.** "Execute when X happens" —
**the window has no owner and no refresh trigger, and it passes silently.** ⇒ **such a decision needs
a row in `work_plan.md`**, not just a line in an evidence file. *(Anchor: six formally adopted
decisions died this way inside one day.)*

---

## Situation 18 — a module opens / closes

### Opens
**Trigger:** Ishay says "פתח מודול N".
**Read:** `grep '🚧 מN'` in `PROJECT_MASTER §6` — **the only registry an opening reads** · the module
guide · its §7 items.
**Output:** `module-blueprint` · matured debts enter the window.

### Closes
**Trigger:** the last step marked ✅, or Ishay says so.
**Run — the velocity check:**
🔴 **Measure work-days, not calendar span.**
`git log --format=%ad --date=short <branch> | sort -u | wc -l` returns the days actually worked.
*(Anchor 01/08: module 3 looked a week over by the calendar — in fact 15 working days inside a 24-day
span, because Ishay was studying for an exam. **The manager escalated an overrun that did not exist**,
because he measured the wrong thing.)*
**Output:** velocity against `00_roadmap.md` §3 · **a defer forecast for the leaf modules
(M10→M11→M7)** · a debt-registry scan.
**Escalate to Ishay once the gap passes ~4 work-days** — do not wait for the mid-gate.
⚠️ **`00_roadmap.md` is tier 4 in the truth hierarchy and carries no freshness stamp** — read it
**and** measure in git, then compare.

---

## Situation 22 — file maintenance (ongoing housekeeping)

**Trigger:** a module closes · or Ishay says **"ניקיון קבצים"**.
⛔ **Never mid-module under a deadline** — an open module's quality debt outranks the docs'.

**This is ordinary upkeep, not an audit:** shrink what bloated · merge what duplicates · reorganise
the content inside files · flag what is simply wrong. **It runs continuously, not once.**

**What the manager runs:**
1. **Measure debt per folder** — broken pointers · duplication · stale facts · bloat.
2. 🔴 **Ask Ishay the scope AFTER measuring, never before** — asking "skills or docs?" with no numbers
   makes him choose blind.
3. **Group files that reference each other into one batch.** 🔴 **The cluster decides the size, never
   a constant** — it may be 1 file or 10. *(An early draft hardcoded "~3"; Ishay struck it: **"אולי 1
   אולי 10 — לא יודע, בגלל זה יצרתי מנהל."**)* **The only ceiling is what one session holds, measured
   in LINES not files.** A tightly-coupled cluster must travel together — splitting it breaks exactly
   the pointer this work exists to protect, **and it will look like the worker's mistake, not yours.**
4. **Rank by the ordering test** · 5. **Three options + a recommendation** (situation 3's output mode).

**What the worker gets, and may decide:** its files and nothing else — shrink · merge · reorganise
content · mark what is wrong.

### 🔴 Three gates the worker never passes alone
1. **Deletion: move the file to `docs/delete/`. Ishay deletes.** The worker never removes a file.
   *(This is better than "recommend and wait": the file leaves the way immediately, nothing is lost,
   and the irreversible act stays his.)*
2. **Harvest before you shrink** — any fact still relevant moves to a permanent home **before** the
   line comes out. Otherwise "shrinking" is losing.
3. **`~/.claude/**` never enters a REG-IN batch** — the global `CLAUDE.md`, the canonical playbook and
   the personal skills **change 710 too.**

### Shrinking rules
- **Never cut the *why* and leave the rule** — a prohibition without a reason gets optimised away.
- **Never cut a rare rule.** "No test caught it" is not "safe to cut".
- **Duplication ⇒ one becomes a pointer**, never delete one of the pair.
- **Dated records are not rewritten** — only compacted per the file's own policy.
- 🆕 **History is not instruction.** *(Anchor: `_shared/discipline.md` carries ~20 lines on how the
  file came to be split — it changes no action.)*
- 🔴 **The sharpest test, and it is already ours:** *what would a session do **differently** because of
  this paragraph?* **Nothing ⇒ a candidate for cutting.**

**Numbers every round: lines existed · lines remain · lines moved elsewhere.** If lines vanished that
were neither moved nor ruled on, **the number shows it.**

**What stays pure judgement ⇒ to Ishay with a one-line reason:** which cluster goes first · where to
cut a cluster that exceeds the ceiling.

---

## Situation 19 — before a merge · "מיזגתי"

### Before a merge
**Trigger:** the closing audit reported done.
**Why this exists:** `module-close` **is run by the session that built the module** — a self-audit.
**And Ishay is not an independent approver, because he does not read code ⇒ you are the only
independent approver.** *(Industry standard: the author does not merge alone.)*

**What you run — not "read":**

| | |
|---|---|
| `npm run gate` | **exit code measured**, never inferred from an absence of errors |
| the full E2E suite | **three numbers: registered · ran · skipped.** A silent skip is a failure that reads as success |
| every guard the audit claims is proven | **break it again and watch the test fall.** "It passed" is not proof |
| every permission change | **both directions** |
| anything visible | **look at it** |

**"Load-bearing" =** a claim which, **if false, lets something broken merge** — counts · guards ·
permissions · the money figure.
🔴 **Cannot reproduce it (quota, environment):** say **"השער רץ חלקית"**, name **exactly which claim**
was not reproduced, **and recommend not merging.** *(In industry you do not merge on a partial gate —
you block. Ishay approved this.)* **Do not stay silent and do not round a corner.**
**Output:** a verdict — **מאשר-למיזוג / לא** — **with the list of what you reproduced and what you did not.**
🚫 **The merge itself — Ishay only, iron rule 10, in no scenario. And he is not a second gate.**

### "מיזגתי"
**Trigger:** Ishay reports it or pastes a PR link.
**Read:** `git fetch origin` + `merge-base` — **fresh evidence only, never memory.**
**Output:** `post-merge` · flip the status rows **quoting the evidence** · mark dead branches · his
next step.
🆕 **And after a merge the branch is dead — sweep the live sessions and tell each one**, because iron
rule 10 forbids piling onto a dead branch and nobody will know on their own.
**⚠️ "Pushed is not deployed":** prove it from the production side — **an asset list with a count**
before (a broken extraction returns zero and reads as success), then confirm it changed.
