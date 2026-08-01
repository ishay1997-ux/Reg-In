# Boot and handover — the two rarest situations, and therefore **READ-DO**

Loaded from situations 16 · 17. 📖 **Open this file and read line by line. Never from memory.**
**Why:** a situation that happens once a shift lives in a file that may never be opened — unlike one
that recurs several times a day, whose pattern is live in context. *(Anchor 01/08: four out of four
manager failures happened at moments like these, all run from memory.)*

---

## Situation 16 — boot / taking over a shift

### The read list — in this order, before a word of substance

1. 🔴 **Measure independently — FIRST, before any narrative:** `git status` + `git log --oneline -5` +
   mtimes of the shared files + **the clock**
2. **The handover document** if one exists (`docs/handoff_manager_N.md`) — it carries the full read list
3. `STATUS.md` — the top block
4. `docs/work_plan.md` — the window
5. `references/miss-ledger.md` — **including the newest entries**
6. **Both memory files:** `manager_evidence_regin` · `ishay_response_playbook`
7. **`~/.claude/references/ishay-response-playbook.md`** — the full playbook

*(The measurement was item 7 until 01/08 22:3X — i.e. the numbered order prescribed exactly what the
rule below forbids, in a file marked READ-DO, where the numbering is what actually wins. Found by 710's
manager reviewing this file; **it had already fired on them that same morning.**)*

🔴 **Measure git yourself *before* you believe the document.** Reading a narrative before measuring
means entering with a model, and the later measurement only **confirms** it. *(Both arenas confirmed
this about themselves on 01/08.)*
**An mtime younger than ~10 minutes ⇒ a live session is writing ⇒ open read-only and say so.**

### 🔴 The read receipt — and it is the **stop condition**, not a courtesy

> **Boot ends when the read-receipt line has been said. Not when you reported "עליתי".**

**To Ishay — one line in Hebrew:** *"קראתי שישה מתוך שבעה — לא פתחתי את X, כי Y."*
**To disk — the full detail**, including **which range was not read** in any file read partially.
*(Anchor 01/08: a manager reported "עליתי" within four minutes and then worked for 40 more without
opening the memory files or the playbook. The fast report created a sense of completion backed by
nothing.)*

### Three more things at boot
- **Load tools before you need them.** Deferred tools — Chrome · MCPs · **the session-messaging
  tools** — do not load themselves. **"אין לי גישה ל-X" is a claim like any other: check before you
  say it.**
- 🔴 **Ask Ishay what this session is called.** `list_sessions` returns every session **except the one
  you are in** — you cannot see your own name. **Without it there is no contact card in prompts and no
  handover document.**
- **Measure the binding deadline** — and never quote it from a guide without checking the guide is
  maintained.

### Shift numbers
**Successor = predecessor + 1**, learned from the handover document's header. With no orderly handover,
take the highest number visible in `STATUS`/`work_plan` and add 1. **The number appears in every stamp**
("(מנהל-N)").
**Identity ≠ address:** `מנהל-N` is stable but you cannot send a message to it; the session name is
messageable but dies at every handover. **The mapping lives in `docs/current_manager.md` — read it,
never guess by title.**

### Taking over from an outgoing manager
**Disk first.** Then, **before acting on anything**, message the outgoing manager directly with
**exactly three requests**:
① **the in-air delta that is not on disk** — open expectations · promises to Ishay · silenced doubts ·
and any message sent to a builder **after** the handover document was written · ② **a current-state
snapshot with a clock-read timestamp from his own turn** (stamps inside the document may be drift —
the first handover caught one) · ③ **explicit release.**
🚫 **Do not ask for "the full context"** — a narrative dump tempts you to trust story over disk.
**His answers are claims like any other** — verify against disk; where they conflict, **disk wins.**
**No reply within ~10 minutes ⇒ the handover document is authoritative and the shift starts from it alone.**
**And never assume the document is complete** — it was written before your predecessor's final turns.

### Then report position in a few lines and **wait**
🔴 **Boot ends in a stop, not in action.** *(This does not contradict "you initiate promotion, you do
not wait to be asked" in `queue.md` §3 — that governs a **running** shift with a free builder or a
free Ishay. At boot you have not yet earned the picture that would justify initiating.)*

### 🔊 Identity broadcast — immediately after boot
**To every live builder session and every peer-project manager:** *"אני מנהל-N, הסשן הזה, כל
התעבורה אליי."*
**Builders and sister-project managers cannot discover the successor's name on their own.** *(Anchors:
a report crossed to a dead shift on day one; and cross-project traffic landed on a released manager.)*
🔴 **The only mechanism that held in both arenas is that the recipient identifies himself and pushes
back** — which is why broadcasting is worth more than any attempt to guess.

🔴 **But "every LIVE session" is not measurable — so broadcast narrowly.** Measured 01/08 22:1X:
`list_sessions` returns **no live/dead signal at all** — `isRunning:false` came back for three sessions
that answered within two minutes, and `isArchived:false` for **all 25**, because nobody archives.
**Every message wakes a session and spends Ishay's quota.** ⇒ **Message only who you need right now** —
a builder you are about to dispatch can wait until you dispatch him.
🚫 **And closing sessions is Ishay's, never yours.** *(Anchor 01/08: the manager read his "I can't
remember to close five windows" as authorisation to archive, archived three, and an hour later could
not reach the one Ishay then asked him to consult — `Session … is archived; unarchive it first`.
His actual intent was one sentence long: **"שלא תעיר סשנים."**)*

---

## Situation 17 — closing a shift

🔑 **Trigger: Ishay says "סגור משמרת" / "סיום משמרת" / "סוף משמרת" — all three are the same.**
**A similar phrasing not on that list ⇒ ask, do not guess.**
**This is also the only moment anything is written to the skill.** During the shift you **collect**
into an events file only.

### The twelve steps

| # | Step | Output |
|---|---|---|
| 1 | **Measure the growth ratio** — `wc -l` on the skill and references against the boot commit | how much rules grew vs how much evidence grew |
| 2 | **Run the retro on yourself** — the 11 questions atop `miss-ledger.md` | answers **anchored to a real event** |
| 3 | **Collect the pile** — the ledger + the evidence file | one candidate list |
| 4 | **Filter through the four entry questions** | in / dropped / stays a candidate |
| 5 | 🔴 **One editing pass** | **one write. Not two.** |
| 6 | **The documentation protocol** | micro-guide → `CLAUDE_CODE_LOG.md` → `STATUS.md` |
| 7 | **The handover document** | see below |
| 8 | **Update `docs/current_manager.md`** | identity + address + stamp — **before switching to routing-only** |
| 9 | **A closing log entry** | commit |
| 10 | **The successor note for Ishay** | see below |
| 11 | **The "איפה עומדים" board** | 4–6 rows, **each measured in the same turn** |
| 12 | **Answer the successor's three delta questions when they arrive**, then **identity broadcast**, then **routing only** | — |

🔴 **Step 12's first half is an obligation, not a courtesy.** The incoming manager is required to ask
for the in-air delta, the clock-stamped snapshot, and explicit release — **and that protocol only
works if the outgoing side answers.** *(Anchor 01/08: manager-2 answered all three, and his second
answer — a silenced doubt about the E2E count — was not derivable from any file.)*

🚫 **What is NOT here: ordering, merging or promoting rows in the queue.** That is **a decision, not a
record**, and it runs **at the next shift's boot.** *(Closing time is both when you draw the line and
when Ishay is most tired — the worst moment to decide what comes first.)*
🔴 **Step 12, the reason:** a rule written after a successor exists is **legislation by someone who is
no longer the manager, binding somebody else.** From that moment every message is **forwarded by
session name**, and the sender is given the new address in the same breath. At most a one-line read on
the way, **explicitly marked "ניתוב בלבד, לא פסיקה".**

### The three handover artifacts — one job each

| Artifact | Where | What's in it |
|---|---|---|
| **The Hebrew preface** | **in chat** — Ishay reads it, does not paste it | who the new session is · open · paste · **close the old one** · and the title to give it carries the shift number |
| **The paste block** | Ishay copies it | **identity + path + a distrust instruction.** Nothing else |
| **The handover document** | **in the repo**, `docs/handoff_manager_N.md` | all the load. **The successor deletes it once read** |

🔴 **Why the block is minimal:** it **passes through Ishay** — every line is a tax he pays, and every
unnecessary line tempts him to edit it.
🔴 **And therefore the load must move to the document — with the read list at its top.** A block naming
**one** file says, without words, *"this is what you need."* *(Anchor: manager-3 received a block
naming only `work_plan.md` — and read one file, working 40 minutes without the memory files or the
playbook. The same hole was found in 710 the same day.)*

### The handover document's structure
- **At the top: the full read list** + the demand for a **read receipt** before the first turn to Ishay.
- **⏳ The volatile half — with an explicit expiry:** *"תקף רק אם אתה עולה תוך ~4 שעות; אחרת התעלם
  וגזור מהדיסק."* (Which builders are alive · what you instructed them · the quota state.)
- **🧱 The durable half:** where the module stands · the next step · what is undecided.
- 🆕 **A "monitor: armed on X / none" field.** If it says "none" **and there was live work** ⇒ the
  successor **must re-arm before doing anything else.** *(A dead monitor looks exactly like a builder
  at work.)*
- 🔴 **The condition that makes deletion safe:** everything that must survive forever — **rulings ·
  lessons · traps** — moves into the repo **before** the document is written. **The document holds only
  moment-state**, so deleting it loses nothing by definition. *(Without that condition the document
  becomes a shadow archive — which is exactly how window-conditioned decisions are born.)*
- **The successor is coming in two days rather than in an hour?** One extra requirement: **the arena
  must be completely clean** — no work mid-flight, no expectation resting on a live session.
  **There will be nobody to answer.**

### The paste block's wording
```
אתה מנהל-N של REG-IN (מחליף את מנהל-N-1).

התחל מ-docs/handoff_manager_N-1.md — הוא מכיל את רשימת-הקריאה המלאה שלך.
עלה לפי סקיל work-manager. מדוד git בעצמך לפני שאתה מאמין למסמך.

מיד אחרי העלייה: שדר את זהותך לכל סשן-בנאי ולכל מנהל-עמית חי,
ומחק את מסמך-המסירה ברגע שסיימת לקרוא אותו.
```
**And if anything in the skill is incomplete at that moment — a fifth line saying so.** *(Anchor
01/08: the skill was mid-reorganisation; without such a line the successor would have read it as
complete.)*
