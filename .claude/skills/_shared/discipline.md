# Shared discipline doctrine — read by every repo-local REG-IN skill

> **SSOT split (23/07/2026, after Ishay wrote `~/.claude/CLAUDE.md`):** the *universal*
> doctrine — language, talk style, PM authority, citation/resume discipline — now lives
> in **`~/.claude/CLAUDE.md`** (cross-project, loads every session regardless of repo).
> Read it first; it applies here unchanged. **This file now holds only the REG-IN-specific
> instantiation on top of it** — which file/tool to check for which kind of claim, and
> what "resume from disk" concretely means in this repo. (History: this file originally WAS
> the doctrine in full, extracted from ×3 inline duplication on 23/07 — see the Session Log.
> The doctrine was then generalized into the global file the same day, on Ishay's own
> initiative, and this file narrowed to the instantiation layer — the sync tax of
> maintaining the general principle in two places was paid once already; no reason to pay
> it a third time. `feature-acceptance` — originally the sixth skill sharing this kernel —
> moved OUT of the repo entirely the same night, to Ishay's global `~/.claude/skills/`,
> being project-agnostic; it now carries its own self-contained discipline section instead
> of pointing here. **Consolidated further 24/07/2026 (skill-creator structural review):**
> the repo-local skills used to each carry their own copy of the kernel paragraph
> below, with a comment asking whoever edits it to keep every one of them + this file in sync
> by hand — a real drift risk with no single source of truth. Now each of them carries
> only a one-line pointer to this file; the kernel paragraph itself lives HERE ONCE.)

## The shared kernel (every repo-local skill reads this first)
Read **`~/.claude/CLAUDE.md`** (loads every session, every project) for the universal doctrine: plain-Hebrew communication · Ishay is the product manager — understanding-declarations invited for correction, product/design decisions are his · no citation without a same-turn check · resume from disk, not from narration. Read and apply it. Then continue reading the rest of this file for the REG-IN-specific instantiation below — which file/tool verifies which kind of claim, and what "resume from disk" concretely means in this repo.

## REG-IN's citation-check targets (instantiates the global "no citation without a same-turn check")

| Claim | Where to check, in THIS repo |
|---|---|
| "item N in §7" / "it's written in X" | open `docs/PROJECT_MASTER.md`, find the section, confirm number and scope (grep/read) |
| "already done" / "still open" | full read/grep of the file — not tail, not partial offset, not memory |
| "merged" / "it's on dev" | fresh `git fetch origin` + `git merge-base --is-ancestor` (iron rule 10) — a local branch lies | ⚠️ **Mandatory caveat before trusting the result: the check also succeeds on a freshly-cut branch with zero commits** — the discriminator is `git log origin/dev..HEAD --oneline` (empty ⇒ fresh branch, not merged). Full wording: iron rule 10 in root `CLAUDE.md`.
| "column/policy/index exists" | live query via Supabase MCP (read-only) |
| 🆕 **"ישי הכריע X" — where the ruling also names a MECHANISM** *("the contact is read from `users` via `owner_email`", "it runs in a trigger", "the flag lives in `params`")* | **Run the mechanism as the role that will run it, before citing the ruling as closed.** 🔑 **The two halves have different authors and different reliability: the PRODUCT half is his and is authoritative; the mechanism half in the same sentence is almost always something *Claude* drafted and he approved as part of the whole — so it carries no more weight than any other unverified claim of mine.** *(Anchor 09/08/2026: `local-2` ruled the mail's field contact = shift lead, else the project manager, **"via `users.full_name`/`users.phone`"**. The product half was right and still stands. The mechanism was never executable — `users_select_self_or_ceo` lets a user read only their own row, so מנהלת גיוס got `200` + `[]` and the mail would have printed an empty contact **with no error**; `fillEmailTemplate` cannot catch it because the placeholder is *known*. I had already declared the hole "closed" in the guide **on the strength of the ruling alone**, hours before measuring. Cost: an 8th migration mid-phase.)* 🔴 **The sentence to keep: a ruling that exists is not a ruling that works** — and the failure is silent, because a recorded decision reads as settled to everyone who comes after. |
| "it works" / "the tests are green" / "this is what the screen looks like" | run it through the **production path** — the real browser, the served asset, and the E2E suites. 🔴 **And `npm run test:e2e` is NOT the whole suite: it is `playwright test --grep-invert בדיקת-עשן`, so it silently excludes the smoke journey — the excluded specs do not even appear as "skipped". The smoke suite is `npm run smoke`, and neither it nor E2E runs in CI at all** *(measured `package.json` + root `CLAUDE.md`, 07/08/2026; this row predated that measurement and was corrected 08/08)*. **Report both, by name, or say which one you did not run — and **say which path produced the artifact you are judging**. *(Anchor `ba2d41e`: the quote PDF was defective in its **production**, not its code — rendered under vitest instead of fetched from the browser blob, so the verification method lied while the code was fine.)* |

Prefer a grep anchor (function name / string) over a line number — line numbers rot between writing and executing.

## Adopting a world practice — the fit check and the price tag

> **When this fires:** root `CLAUDE.md` iron rule 1 says that with **no internal anchor** you go fetch an
> external one — world practice + business sense — and come back with a recommendation. **This is what
> "fit" concretely means.** Ishay, 08/08/2026: *"להתאים למערכת שלנו זה עמום"* — so it is decomposed here,
> each part with a place to check it, not a feeling. **Not a closed list** — the full project profile is
> the 🎓 block at the top of root `CLAUDE.md` and `PROJECT_MASTER §1`.

🔴 **And the rule that governs what you bring back: import the PRACTICE, not the JUSTIFICATION.**
*(Graduated 01/08/2026 — two independent occurrences in two arenas on the same day. Ishay struck an
"this is how aviation and medicine do it" rationale here; the sister project (710) independently found
it had justified a read-back rule the same way and replaced it with a local reason.)* **A borrowed
rationale collapses the moment someone asks "but we are not them"** — and here the disanalogy is real:
a pilot has continuous memory, a session has none. ⇒ **Adopt the mechanism, then state why it earns its
place in THIS project, in this project's terms.** An outside source proves a practice **exists**; it
never proves it fits. *(Restored 12/08/2026 by `regin-docs-sync` — this rule was deleted in the log
compaction `bf5b3fc` and had neither text nor anchor left anywhere in the repo.)*

**Four fit questions, each with a verification target:**

| # | Question | Where to check it |
|:-:|---|---|
| **1 · ערוץ** | Does it assume a channel we do not have? | **There is no hostess app** — every path runs through the manager (`docs/specs/module_04_hostesses/processes-approved.md §א3`). What exists: email, and the manager's phone |
| **2 · דאטה** | Does it assume data nobody collects? | `docs/schema.sql` + `docs/db_roadmap.md` — **read, don't recall.** *(Anchor: the `0.35` reliability component is switched off for exactly this reason — the attendance marks it needs are created by M6.)* |
| **3 · תפקיד** | Does it assume a person who is not in the matrix? | `PROJECT_MASTER §3` — five roles, one person per domain, no ops team |
| **4 · נפח** | Does its rationale rest on a different order of magnitude? | 50 hostesses · 2–5 per shift ⇒ **you re-sort, you don't filter** — already the documented rationale for the four sort-angles |

**Then, and only then:** *what does it solve that we don't have?* Complexity built for a problem that is
not here is a **loss** — it will have to be defended at the conference.

🔴 **And the answer is always two-part** — *"this is the convention **and it fits here because X**"* or,
stronger, *"this is the convention, **and I deliberately deviated, because X**"*. A convention adopted
without a fit check is copying, not deciding. *(Full research protocol — when to dispatch, sourcing rules:
`docs/guides/prompt_module_discovery.md` §5. Not duplicated here.)*

➕ **Every world proposal ships with its implementation price here, not just its source:** what actually
changes — column · table · screen · migration · existing code — **and how complex.**
🔴 **This is a gate, not a courtesy.** Ishay, 08/08/2026: *"אם לא מורכב סיכוי גבוה שפשוט אסכים למה
שימליץ כי לי אין ידע מספיק רחב בנושא"* ⇒ **the complexity estimate is what actually decides, not him.**
⚠️ **So an understated estimate is a silent ruling** — it must also state what it does **not** cover
*(tests · ripples to other screens · what could break)*, and **"simple" may only be said after checking,
never after guessing.**

🆕 **Three provenance tags on every claim you report — `אומת-על-ידי` · `דווח-לי` · `הנחתי`** *(added 07/08/2026 on Ishay's request; the canonical wording and the reasoning live in `module-build/SKILL.md`)*. The third exists because two tags cannot express a filled gap: **an untagged claim reads as verified, so an assumption is indistinguishable from a measurement.** 🚫 **Provenance only — never a confidence percentage**; verbalized confidence is measurably overconfident and would hand Ishay the feeling of control instead of control.

- 🔴 **A claim about anything OUTSIDE this file is written as a measurement method, not as a value.** Counts · paths · line numbers · status · "this was done" — **all go stale silently, because a file cannot see the world move.** Must state a value? It carries a date and the command that produced it. ⛔ **And when it rots — REMOVE the number, do not update it** (updating reproduces the defect in two weeks). **The highest-risk form is "moved / registered / done"** — it reads as a completed action, and nobody re-checks a completed action ⇒ **grep in the same turn, or write "טעון בדיקה". There is no third option.** ⚠️ **And a file is not audited by re-reading it — it is audited by RUNNING it:** the two rules below survived a full coherence pass and broke the moment someone executed them. *(06/08/2026: 20+ contradictions found across four independent scans and one external tool; **zero** caught by re-reading. A line number written that evening was already wrong within hours. The two rules that follow are instances of this one.)*
- **An absence-claim is verified the way the SOURCE writes it, not the way the reporter searched.**
  *(Anchor 08/08/2026: searched `db_roadmap.md` for `approval_withdrawn` and "נעיצה" — words borrowed
  from two OTHER files — got zero hits, reported "not registered." Both were registered, three lines
  apart, just in `db_roadmap.md`'s own Hebrew phrasing ("ששת הסטטוסים", "העדפת-לקוח"). Caught only by
  reading the file, not by re-running the same `grep`. ⇒ Before reporting an absence, search the
  TARGET file's own vocabulary — words already sitting in it — not the vocabulary you arrived with.)*
- 🔴 **And an absence claim from a CAPPED search is not an absence claim.** Truncating your own
  output — `head -N`, a result limit, reading only the first screen of a long match list — produces
  the identical false *"it does not exist"*, except here the repo is innocent and **the tool did it
  to you.** *(Anchor: a finding was published off a search deliberately cut to three results — **the
  line was the fourth.** It was the fourth false-absence of that same day; the other three came from
  the source's phrasing, this one came purely from the harness.)* ⇒ **a search that DECIDES something
  runs uncapped**, and a capped one is reported as "top N of an unknown total", never as zero.
  *(Restored 12/08/2026 by the prune audit — deleted in the 08/08 STATUS prune, found nowhere else in
  the repo; the bullet above covers the wrong-vocabulary half of this failure, not the truncation half.)*
- **Never hand a checker an expected number — only a measurement method.**
- **A fix is not done until you have checked where else the same defect lives.**
- 🔴 **When you RELOCATE an instruction — pruning a file, splitting a doc, moving a rule to where its
  reader stands — verify the destination CONTAINS THE TEXT, not that a pointer exists.** A pointer is
  a *claim* about another file's contents, and this repo's whole doctrine ("a rule not stated here is
  still in force, it just lives where it loads at the right time") is exactly what makes an unlanded
  rule invisible: it reads as relocated, so nobody looks. **The dangerous residue is the chain of
  citations that keeps pointing at the old address and now resolves to nothing.** ⇒ **grep the
  destination for the moved text, and grep the repo for whatever cited the old home, in the same
  turn.** *(Anchor 28–29/07/2026: a root-`CLAUDE.md` prune moved rules 2, 13(ז) and 15 out — and
  landed their text **only in `docs/archive/`**, which the repo counts as nowhere. **~12 live
  citations kept pointing at them**, and rule 15 had a **three-way circular deferral**: the blueprint
  template said "rule 15 is the SSOT, don't restate", root pointed at the hook + `module-build`, and
  `claude_routines` said "defined in rule 15, this only audits it" — three files each deferring to
  another, and the text in none of them. The root file's own promise was **false for exactly those
  three**, and it took a fresh-context audit over 25 governing files to find it — a re-read did not.)*
  ⚠️ **This is the writer's half of `skill-scan`'s "Harvest before you shrink"**: that rule states the
  intent, this one states what proves it happened.
  *(Restored 12/08/2026 by the compaction audit — deleted in `64d7971`, found nowhere else in the repo.)*
- 🔴 **The source must answer DIRECTLY. A derivation, a stretch, or "it probably implies" is a
  guess wearing a citation.** In doubt whether the source truly answers ⇒ **that IS "no source"**,
  and it goes to Ishay as a story-question. *(A wasted question costs him seconds; a guessed
  intent costs a build.)* **The table above checks whether a citation is ACCURATE; this checks
  whether it ANSWERS** — a citation can be perfectly accurate and still not support the claim
  resting on it. *(Anchor 05/08/2026: a removal report stated "steps 1–3 live **almost verbatim**
  in `module-blueprint/template.md`" carrying a `[מדדתי בעצמי]` tag. Measured string by string:
  **zero shared strings between the two files.** The overlap was real and conceptual; the wording
  was an inference wearing a measurement's tag.)*

- 🔴 **In a council / multi-advisor run, the value is the DISSENT — never the tally.** *(Anchor
  08/08/2026, the `ready`-ownership question: **four of five advisors reached the same conclusion by
  pattern-matching an existing precedent** — which would have produced a *graceful-degradation* fix
  for what was actually an *ownership* bug. **The lone dissenter forced the re-read that found the
  real answer.**)* ⇒ read the minority opinion first, and treat agreement among advisors as an
  **echo of shared training, not as corroboration** — the same reason a second agent given the same
  lens returns the same thing. ⚠️ **And the omission all five reviewers flagged independently: not
  one advisor noted that the decision was Ishay's to make, not the council's.** A council output is
  an input to iron rule 1, never a substitute for it. *(Restored 12/08/2026 by the compaction audit
  — deleted in `bf5b3fc`, found nowhere else in the repo.)*

### 🔴 When Ishay corrects a fact you gave him — the correction is not the point, the SWEEP is

**Trigger:** he says something you told him is wrong.
**Fix the sentence — then sweep.**

> **Sweep boundary: everything you SAID · WROTE to disk · DISPATCHED to another session · or
> RULED — from the moment the wrong fact entered.**

**Name what you swept, out loud.** A sweep nobody can see is indistinguishable from no sweep.
*(Anchor 01/08/2026: corrected twice on dates. The sentences were fixed — **and nobody ever swept
what rested on them.** Two recommendations stayed standing on a base that had collapsed. Repeated
05/08: a wrong line count was corrected in the sentence, and the ranking built on top of it was
not re-derived until Ishay supplied the missing criterion himself.)*

**Resume-after-interruption, in THIS repo (the 23/07 migration-5 incident):** on any resume ("המשך מאיפה שעצרת", a fresh session picking up mid-flow, continuing after a visible cut) — re-derive position from disk before advancing: `git status` + the active micro-guide's status header/step table + the current step's own verification command. A step whose verification hasn't passed is NOT done, no matter what the previous turn narrated; the typical loss is a half-step (file saved, its doc-ripple lost) — finish the missing half before starting the next step. *(What actually happened: "saving migration 5 + updating docs" was cut mid-turn — the file survived, the db_roadmap update didn't, and the resumed turn jumped to step 1.6; Ishay caught it. The general principle this taught is now stated in the global file — this paragraph is just REG-IN's answer to "what counts as disk here.")*

## The other files beside this one in `_shared/` (read when they apply)

- **`_shared/parallel-sessions.md`** — more than one session alive: pathspec commits, the shared
  index, stale arena facts, direct session-to-session messaging. Iron rule 16, operationalized.
- **`_shared/writing-prompts.md`** — writing a prompt for another session: the intent pass, the
  ONE top mine, self-containment, the model/effort recommendation, the closing clarity question.
- **`_shared/ishay-calibration.md`** — before you present decisions to Ishay or write him a
  spec/advisory message: how he works, what "מעולה" means (understanding, **not** verification),
  present-the-basis-before-he-asks (§7), the four over-asking categories (§9). ⚠️ **§1–§6 are
  calibration from a *Discovery* session** — apply them on the spec/Discovery path, NOT to a
  build/close session, where he DOES stop on visual and UX. *(Pointer added 06/08/2026 — the file
  had zero load path from any skill; this list is loaded by 9/10 repo-local skills.)*

## How to talk to Ishay
Fully covered by `~/.claude/CLAUDE.md` — no REG-IN-specific override remains (the old "rulings-rounds recommendation-first" carve-out is now the global default too). The one place the style becomes a concrete *procedure* rather than a rule of thumb is the batching mechanics (3–4 per round, "מספיק להיום", recommendation-first, reality filter before designing for an edge case) — see `section7-rulings` (repo-local) and `feature-acceptance` (now global, `~/.claude/skills/`), which operationalize it end-to-end.

### 🔴 When he names a CATEGORY instead of a single fix — say what you understood, before you sweep

**Trigger, and it is observable:** he answers a finding with *"סרוק עוד כאלה"* / *"תחפש עוד כאלה"* /
*"יש עוד חורים כאלה?"* — a **class**, not the one item in front of you.

**Why it matters more than it looks:** this is his highest-yield move — measured 29/07/2026 on the
step-3.2 mockup round, **one such instruction produced six fixes**, while ~8 of the ~11 review rounds
that day were things I should have caught alone. **But the category is mine to infer, and I can infer
it wrong** — and a wrong inference is invisible: I go sweep the wrong class, come back with findings
that look like work, and the class he meant is still unswept.

⇒ **State the interpretation in ONE sentence before sweeping**, e.g. *"הבנתי: כל אלמנט שמאשר מצב תקין
במקום להתריע על חריגה — סורק עכשיו."* **Right guess ⇒ he stays silent and nothing is lost. Wrong guess
⇒ two words from him instead of a whole wasted round.** 🔑 **The point is that the guess becomes
visible instead of hiding inside the work** — the same reason every other inference here carries a
provenance tag. *(His own question is what produced this: "כשאני אומר 'סרוק עוד כאלה', איך תדע למה
אני מתכוון?" — the honest answer was "I infer it, and I can be wrong", and this is the fix that costs
him nothing.)*
*(Restored 12/08/2026 by the compaction audit — deleted in `64d7971`, found nowhere else in the repo.)*
