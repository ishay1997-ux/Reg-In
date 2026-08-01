# Learning — the miss-ledger · the retro · the growth gate

Loaded when a miss surfaces, and at shift close (steps 1–5).
**This is the only file that stops the role from accumulating confidence instead of skill.**

---

## The miss-ledger — `references/miss-ledger.md`

🔴 **Written the moment the miss surfaces, not at session end** — by then memory has already sanded it
into something flattering.
**Append-only, newest last.** Each entry: **what happened · why it was a miss · what it cost · rule
change** (or explicitly: no rule change, one-off).

**What counts as a miss:** an approval that did not hold · something that surfaced after you signed
off · a fact asserted from memory that the repo contradicted · a question routed to Ishay you could
have answered from the repo, memory or your own measurement · a builder's or agent's claim accepted
without first-hand verification · an escalation misclassified — **in either direction.**
**What does not:** being wrong in a way you caught before it cost anything — **that is the system
working.** A builder's own bug you never claimed to have checked.
🚫 **And do not pad the ledger to look rigorous** — the same "לא בכוח" that governs findings governs
this file.

---

## The retro — at shift close, before the board

**The 11 questions live at the top of `miss-ledger.md`.** Two meta-rules:
🔴 **Every answer must cite a concrete event from THIS shift** — an answer with no anchor is a vibe.
**And its output lands in the ledger and in `manager_evidence_regin` as candidates only.**
**A retro that produced zero candidates and zero withdrawn rules is suspect** — reread the
survivorship question.

---

## The growth gate — the most important rule in this file

> 🔴 **The skill is edited once per shift, at its close.** *(Ishay's instruction 01/08, addressed to
> every future manager: "לפני שאתה מסיים משמרת אתה אוסף את כל הדברים שאספת... ומעדכן את הסקיל" ·
> the why: **"כדי שהוא לא יצמח בלי גבול וכך נמנע מדאטה ליקז הטיה והתאמת יתר."**)*

- **During the shift you collect, you do not legislate.** Every insight · ruling of his · correction ·
  miss goes **immediately** into the ledger or the evidence file, **dated and quoted verbatim.** That
  is dated raw material: it binds no future session, and it must survive a mid-turn context death.
  **Nothing is lost by waiting — including his exact phrasing.**
- **At close:** retro → take the pile **as one set** → each item through the four questions →
  **one editing pass.** ⚠️ **Seeing the whole shift at once is the point** — it is what lets you notice
  that three items are the same item, or that two cancel out.
- **No exceptions, including rules Ishay designs himself.** *(An earlier version carved out exactly
  that; **he cancelled it the same hour** — three of that day's six rules were his, so the carve-out
  would have permitted half the growth it existed to stop.)*

### The four entry questions — per item, at close
1. **Does an existing rule already cover this?** — overlap costs reconciliation time **every turn**
   (his 28/07 reasoning).
2. **What does it subtract?** — if it makes nothing else unnecessary, justify it as pure addition.
3. **Where does it belong** — the skill body / a file loaded at its moment / the ledger / **or to
   Ishay, or nowhere?**
   🆕 **The test:** *what will a session do **differently** because of this line?* If the answer is
   "understand better" ⇒ **it is for Ishay, not for the skill.** *(A diagram is the most inert form of
   text — it commands nothing.)*
4. **The inverse test:** would this rule have been **harmful** in some past shift? If yes, it is
   overfitted to one incident.

### The graduation bar
**A mistake earns a rule only on its second or third occurrence** (Ishay's ruling: *"רק אם טעות
קוראת פעמיים-שלוש תוסיף תיקון בסקיל"*). **A first occurrence lives in the ledger as a candidate —
the ledger is its home, not a lesser one.**
**When a rule does graduate, its anchor here is a short dated pointer, not a told story** — the story
stays in the ledger.
⚠️ **A generous classification neutralises the gate exactly like a fabricated count, and is easier to
swallow because each anchor does exist.**
**And the inverse:** once you go looking for inflation you find it where there is none. **Any
classification made in momentum is the same defect** — pessimistic or optimistic.

### 🚫 Three prohibitions on pruning
- ⚠️ **"No test caught it" is not "safe to cut"** — absence of evidence is not evidence of absence
  (Ishay, 31/07).
- **Never cut the *why* and leave the rule.** A prohibition without a reason gets optimised away.
- **Never cut a rare rule.** In doubt — **keep.**
**And occasionally, in reverse:** *which paragraph here has never once changed a decision?*

---

## Two metrics that run at close

**① The growth ratio** — `wc -l` on the skill and references against the boot commit.
> **Evidence must grow faster than rules. A ratio approaching 1 means the manager is legislating
> rather than learning.**
*(Measured 01/08: rules +21% vs evidence +44%. In 710 the same day: +12% vs +86%.)*

**② Round-duration calibration** — `manager_evidence_regin`, a table of round type · estimate · actual.
🔴 **And a module's pace is measured in work-days, not calendar days:**
`git log --format=%ad --date=short <branch> | sort -u | wc -l`.
⚠️ **Every calibration number carries its date and conditions** (machine · module phase · parallel
load). An August number spoken confidently in September is exactly the lie this line prevents.

---

## Maintaining the playbook

**The loop:** a worker asks → you are unsure how **Ishay** would answer → **one story-question to
him** → record his answer **verbatim with its trigger** → answer the worker → next time answer
directly, citing the precedent. **Every escalation happens at most once.**
🚫 **Harvest only from real exchanges — never invent "what he would probably say".** His own
overfitting warning applies to his sentences too.
**Grow it proactively too, not only on escalation:** from every exchange · from **transcript mining**
(`search_session_transcripts`) · and from the calibration game.
**The canonical home: `~/.claude/references/ishay-response-playbook.md`** (a single copy, cross-project).
🔴 **The `ishay_response_playbook` memory file holds REG-IN deltas ONLY** — new universal rows land in
the canonical file, never duplicated into the memory. *(Per-project copies were drifting; that is why
it was elevated.)*
⚠️ **Two managers write to that file — re-read immediately before writing and merge on top, never
from a stale copy.**

**And probe hygiene:** his sentences are subject to "לא בכוח" too. A probe that produces confusion
instead of digging is **recorded and dropped.** *(Pilot metric: 45 of his questions → 19 changed an
actual outcome.)*
