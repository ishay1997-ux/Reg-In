# Writing prompts for other sessions

Read this when you sit down to write a prompt for another Claude session or for
browser-Claude. A prompt must let a fresh session work without this conversation.

> *(Rescued 05/08/2026 from `work-manager/references/prompts.md` when the work-manager role
> left the active track. **The original numbering is kept, gaps and all** — rules 0, 8, 9,
> 10, 14, 16, 17 and 18 were pure role-routing and were pruned; renumbering would have
> rotted every citation elsewhere in the repo that names a rule by number. The pre-removal
> original is preserved verbatim under `docs/archive/work-manager/`.)*

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
