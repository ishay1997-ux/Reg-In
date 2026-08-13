# Writing prompts for other sessions

Read this when you sit down to write a prompt for another Claude session or for
browser-Claude. A prompt must let a fresh session work without this conversation.

> *(Rescued 05/08/2026 from `work-manager/references/prompts.md` when the work-manager role
> left the active track. **The original numbering is kept, gaps and all** — rules 0, 8, 9,
> 10, 14, 16, 17 and 18 were pure role-routing and were pruned; renumbering would have
> rotted every citation elsewhere in the repo that names a rule by number. The pre-removal
> original is preserved verbatim under `docs/archive/work-manager/`.)*

## The shape of a prompt — read this before the rules

A good prompt is not "more detail". It **turns every place the target session would guess into a
place where it must measure, declare, or stop.** Its reader has no memory and no access to this
conversation: what is not written does not exist, and what is written ambiguously gets filled in
**silently** — which is the failure mode that matters, because Ishay cannot read code to catch it.

### 1 · Name the session TYPE first — it changes what you give and what you demand back

| Type | What you give it | What you demand back | 🚫 Never hand over |
|---|---|---|---|
| **Discovery / spec** | the **why** · sources · the open questions | understanding-declarations · assumptions · gaps | an expected answer |
| **Build** | the **what** · the approved plan · fenced scope | evidence per step · what it deferred | a guessed product detail |
| **Review / audit** | the requirements + the artifact + the axes to check | ranked findings + one verdict | the number you expect to see |

*(Rule 20 below carries the five axes this splits on, and the anchor incident.)*

### 2 · The skeleton — the order is measured, not taste

```
1. Session type, and what it produces
2. 🔴 The one top mine — exactly one
3. The tools it has          ← BEFORE the stages, not after
4. What is already decided   — Ishay's words, verbatim
5. 🚫 What it must not touch or assume — each with its reason
6. The stages · the stop-points · and what each stage WRITES TO DISK
7. The exact output shape
8. "האם המשימה ברורה? יש לך שאלות?" — the first reply answers it
```

### 3 · The lessons, each with its anchor — not theory

| Lesson | Anchor |
|---|---|
| **Declare, don't ask.** Uncertainty about a *process* is a concrete declaration inviting correction; a question is reserved for a real product fork. | 🌐 *External, not measured here:* an agent instructed to ask whenever unsure raised its ask-rate to 72% and dropped Pass@1 on clean tasks **65.6% ⇒ 27.5%** (HumanEvalComm). Declaring has no measured cost. |
| **Content outside the pasted block does not exist.** | `docs/delete/prompt_module_discovery.md` *(retired 13/08/2026 into the `module-discovery` skill; the measurement below is on that retired file, which is still readable there)* carries ~80 lines *after* its closing ``` fence — among them a 🔴-marked "three lines at the end of every stage" mandate that no pasting session has ever seen. Check it yourself: `grep -n '^\`\`\`$'` for the fence, then read past it. *(07/08/2026 — line numbers deliberately omitted per rule 3 below; they rotted within the hour.)* |
| **An instruction pointing at a stage that no longer exists never fires.** | The same file told sessions to raise the design skill "at stage ה" after ד+ה merged — **its own harvest table recorded the non-firing twice.** |
| **A mechanism with no consumer is debt, not protection.** Before adding one, name who reads its output. | That harvest register existed to feed a skill; when the skill was cancelled the register kept its cost and lost its purpose. *(07/08/2026)* |
| **A number that rotted gets REMOVED, not updated.** Updating reproduces the defect in two weeks. | "The four contract items" — there were five. |
| **The reviewer must not be the builder, and the cross-check anchor must be external.** | Self-catch rate on a self-authored artifact: **0 of 5 — measured in the sister project (710), recorded in `docs/archive/work-manager/skill/references/miss-ledger.md`, not here.** Directionally confirmed in REG-IN (04–05/08: three prompts each carried a defect; none was caught by re-reading — root `CLAUDE.md`), but that run was never counted. |

| **A "this may be stale" banner becomes wallpaper within a week — and it tells the reader nothing to DO.** Replace it with what was *measured wrong*, what was *never checked*, and **the action**. | A tier-4 guide got a dated staleness banner; the useful version instead named the unchecked surfaces (reading lists · the ⑥ blocks · entry-state assumptions) and the action ("run Discovery for that module when you reach it"). *(Restored 12/08/2026 by the compaction audit — deleted in `bf5b3fc`, found nowhere else in the repo.)* |
| **Constrain a reviewer to the CONSUMER's actual field of view — that is what surfaces what the consumer cannot see.** A reviewer allowed to read everything answers from context the real reader will never have. | Measured 08/08/2026: of three fresh-context agents, **the two errors in my own text were found by the agent forbidden from reading anything outside the list** — not by the two that could read everything. *(Restored 12/08/2026 by the compaction audit — deleted in `bf5b3fc`, found nowhere else in the repo.)* |
| **The test separating a MECHANISM fix from a POINT fix: does the next instance light up with no further edit?** If the fix must be repeated per module/per file, it is a point fix wearing a mechanism's clothes. | The `docs/specs/` routing fix: modules 5–12 light up the same path the moment their spec folder exists — **no further skill edit**. *(Restored 12/08/2026 by the compaction audit — deleted in `bf5b3fc`, found nowhere else in the repo.)* |

**That is the skeleton. The rules below are the checks you run against it.**

---

## 🔴 Before a single line of the prompt is written — the intent pass over the step

**Sort every instruction in the step. The boundary is NOT "is it on screen" — it is
"does this encode how his business actually works?"** *(Ishay, 02/08: a process is
often invisible — timing, who is notified, what a status means — and getting it wrong
costs exactly as much.)*

- **🔧 Truly mechanical** — a rename · a test for behaviour that already exists · a
  refactor. Nothing about the business ⇒ **proceed.**
- **🧭 Process or product, on screen OR behind it** ⇒ **stop, and take it to Ishay in the
  four-part shape** (declaration in his world · what comparable systems do · what fits
  THIS project · one recommendation) — **the full text is `docs/PROJECT_MASTER.md` §1,
  "ארבעת החלקים"** *(rescued there 05/08/2026; this line used to point into
  `docs/archive/**`, which the repo counts as a finding — and the archived copy is
  pre-rescue, i.e. missing Ishay's 02/08 correction "brevity is not clarity")*.

🔴 **A recorded source does not exempt it — it only shortens it.** A source proves a
decision was **made**; not that it is still right, and not that he understood what he
approved (*"אני זהיר כי אין לי יכולת בקרה באמת"*; and the mockup anchor — **a verbal
description of his is a spec, not an approval**).
**In doubt whether something counts ⇒ it goes to him.**
🔴 **The output is not a nod — it is a written, confirmed process statement, quoted
verbatim into the prompt.** That is what stops the target session guessing where the guide is
silent: it builds from a confirmed model, not from an absence. **Nobody guesses.**
**He is unavailable?** Queue the declaration, dispatch the 🔧 parts meanwhile, and for a
**small and reversible** item decide, mark `הכרעתי, הפיך`, and bring it to him after.
**No answer within ~5 minutes ⇒ proceed on that basis** (his calibration, 02/08) —
🚫 **never for a migration, a merge, or a look: there "no answer" is not approval.**
⚠️ **This catches only what the step SAYS.** A guide silent about a process leaves
nothing to sort — which is why the user-walk before "done" is a separate gate.
**And the prompt carries one line showing the pass ran:** *"מעבר-כוונה: N מכניים · M הובאו
לישי"* — a prompt without it shows Ishay the pass was skipped.

1. **Verify every factual claim against the code the same day it ships**, and
   stamp it (`🕓 אומת מול הקוד DD/MM HH:MM`). A stale claim sends a session
   hunting a solved problem — caught twice in one day (31/07).
1ב. **And say out loud, in the prompt, that the worker may doubt any fact in it.**
   One explicit line: "כל עובדה כאן ניתנת לערעור — אם מדדת אחרת, תקן אותי עם
   המדידה." Rule 4ב already demands a counted verification of the ONE top mine;
   this covers everything else, which is where it actually failed — on 01/08 a
   builder caught a false E2E blast-radius claim **outside the mine,
   only because he chose to check**. ⚠️ An earlier wording of this rule also
   counted a wrong `canSend` assumption as a second local anchor; it isn't one —
   the prompt had explicitly asked him to verify that. Corrected the same day:
   **one real local anchor + 710's two**, not two local. A generous
   classification neutralises the graduation gate exactly like a fabricated
   count, and is easier to swallow because each anchor does exist.
2. **What's decided — "✅ הוכרע, אל תשאל שוב"**, with Ishay's exact quotes. His
   phrasing is the spec; a paraphrase loses intent. The inverse for open ground:
   describe the **problem, not the prescription**, wherever the fix-shape depends
   on code the target session will read fresh.
3. **Self-contained**: quote code and symbol names, never line numbers (they rot
   between writing and execution). Open with the pointer to the plan file's
   warnings section when one exists.
4. **Only the traps the target doesn't already have.** If its own plan already
   covers three of your five mines, send the two it lacks — known information
   costs their context and your credibility.
4ב. **One 🔴 "הדבר הכי חשוב בפרומפט הזה"** — a single top mine, with exact
   files/symbols, the *silent* consequence spelled out, and a
   verify-yourself-and-report-a-COUNT demand ("grep בעצמך ודווח כמה מצאת") so the
   verification is measurable, not nodded at. And a 🚫 do-not-touch section where
   order matters, WITH the reason order matters — a bare "don't" gets optimized
   away by a session that thinks it knows better. (Pattern proven across the 710
   pilot prompts; exemplar saved by Ishay 01/08.)
5. **Volatile facts** (arena, deploy state, who holds a file): timestamp them or
   write "מדוד בעצמך" — never assert. See `_shared/parallel-sessions.md`.
6. **Free rein is always fenced**, Ishay-style: "יד חופשית ב-X **בלבד**" — never
   open-ended. Free rein = do-what's-right + report-what-you-deferred.
7. **Name the tools the task needs** (Chrome, MCPs, Playwright-spec for
   credentialed screens…). Sessions forget their own capabilities — an
   unmentioned capability is an unused capability. **Always remind the target session it
   can connect to Claude in Chrome and check browser-visible facts itself** —
   recurred multiple times in 710 (Ishay, 01/08): unreminded sessions route
   checks to Ishay that they could run. Consult `docs/toolbox.md` first —
   dispatch to a disabled plugin fails silently.
   **Recommend, don't assume it'll check.** You read `docs/toolbox.md` before writing — the
   target session didn't. If a specific enabled skill there genuinely fits this task (a design
   decision, a DB-heavy step, a security-sensitive change…), name it in the prompt with one line
   of reasoning. One line, phrased as a recommendation the session weighs — not a mandate.
9א. **Demand the blind-spot section in their plan** (Ishay, 01/08: "בפרומפט במיוחד
   טוב לכתוב — מה הבליינד-ספוט? על מה לא חשבתי?"): the plan it returns must
   answer "מה הבליינד-ספוט שלי? על מה לא חשבתי? מה עוד לא בדקתי?" — it forces the
   session to dig before submitting. ⚠️ Its answer never replaces an outside layer-2
   probe (same mind wrote both — 710 ledger #5); it's a floor, not the gate.
9ב. **A model + effort recommendation, with the reason** — per the work-type table in
   `docs/guides/reference/claude_code_setup.md` §⑨ (Ishay's request, 01/08: "לכתוב לי
   גם איזה מודל להשתמש"). Routine guide-driven build → Sonnet/high; DB-schema,
   complex business logic, module open/close → Opus/Fable high–xhigh.
11. Steps Claude cannot do (browser, OAuth, dashboards, secrets) get the 🧩
    treatment per iron rule 17: Hebrew step-by-step for Ishay **plus** a
    self-contained browser-Claude prompt. Secrets never in chat or a field —
    `Set-Clipboard` → he pastes.
12. **Every prompt handed to Ishay is preceded by 2–3 plain-Hebrew lines** — מה
    הסשן הולך לעשות, למה עכשיו, ובמה הוא נוגע (his request, 01/08: "לפני פרומפט
    אשמח בקצרה שתסביר לי מה אתה שולח אותו לעשות"). He pastes with understanding,
    not on faith — the prompt itself is written for Claude, the preface for him.
13. **Open with the item ID and the state you read** — "לגבי שורה N, לפי מצב X
    שראיתי ב-<file>". **Message and file disagree ⇒ read the file, not the
    message.** (≥5 message crossings in a single night, 01/08.)
15. **Close the prompt with "האם המשימה ברורה? יש לך שאלות?" — and the worker's
    FIRST message answers it** before anything else. Fires *earlier* than the plan
    gate, so a wrong understanding never reaches a plan. (Ishay's own habit; it
    caught a real inversion on 01/08 that a plan would have carried silently.)
20. 🔴 **Name the session TYPE first, and derive the reading rule from what it must PRODUCE
    — never inherit a reading shortcut written for a different type** (Ishay's ruling,
    05/08/2026: *"צריך להפריד בין פרומפט לסשן בנייה לבין פרומפטים אחרים"*).
    The types differ on five axes, and only the first one is easy to get wrong invisibly:
    **① the reading LAYER — the *why* or the *what*** · ② who releases each stop-point
    (Ishay / self-verification / nobody) · ③ the output shape (a decision · a map · code ·
    findings · a verdict) · ④ what must never be handed over (an expected answer to a
    checker · a guessed product detail to a builder · a number to a verifier) · ⑤ the
    commit moment (rule 19).
    **A Discovery/spec session needs the WHY** — it is producing the reasoning Ishay will
    defend out loud. **A build session needs the WHAT** — the reasoning is already settled
    and re-reading it costs context. **So a "read only §N" shortcut is correct for one and
    destructive for the other.**
    🔴 **The test, and it is cheap: whose reader is this instruction addressed to?**
    A pointer lifted from a file that speaks to a builder does not transfer to a session
    that is writing the spec — **and quoting it makes the wrong instruction look sourced.**
    *(Anchor 05/08/2026, my own defect: the module-4 Discovery prompt said
    `module4_smart_match_research`: **§9 ו-§11 בלבד**, justified by quoting that file's own
    line "בונה את האלגוריתם? קרא §11 ודי" — a sentence addressed to a **builder**. §11 is a
    build spec: it states what to implement and deliberately omits why. The Discovery
    session obeyed exactly and therefore never read §3 and §5–§6, which hold the reasoning
    the conference hour will ask about. **Ishay caught it; the session had already flagged
    that its own self-catch count here is zero.** Two companion lines the same fix needs:
    "before bringing Ishay a question, search the research doc and §7 — a question that
    already has an answer is a reading that was not done" and "a contradiction inside a
    document is a signal to read more of it, not a question for Ishay".)*
19. 🔴 **Say WHEN to commit, and with which pathspec** (Ishay's recommendation,
    05/08/2026). Iron rule 10 already says *how* — `git commit -- <paths>`, never
    `git add -A` — and **no prompt has ever said when**, so the worker finishes,
    reports, and stops. The work is then stranded: the next session must either
    guess ownership or sweep foreign files into its own commit, which is the exact
    incident rule 10 exists for. Three lines, and they must be explicit:
    **the moment** (after the gate passes and before reporting / only after Ishay
    approves — pick one and say which) · **the exact paths**, listed, because the
    worker does not know what else is dirty in a shared tree · **and push or not**
    (a personal `ishay/...` branch may be pushed; `dev`/`main` never, and PR/merge
    are Ishay's alone). *(Measured the day this was written: a handed-over prompt
    produced a correct one-line edit, a green gate, and a clean report — and left
    the edit uncommitted, so Ishay had to be told to tell the worker to commit.
    The same prompt's target file was one of six that a Discovery-stage prompt
    writes without a single commit instruction.)*

🚫 **Considered and rejected — heartbeat file + receipt-ack on every message**
(the sixth of that 01/08 batch): measured here, **zero messages have ever been lost**
— the platform queues across session death, proven in the 05:28 crash. It solves a
problem this arena does not have and adds noise to every exchange. **Recorded as
rejected-with-evidence so a future session does not re-adopt it as "missing".**
