# The miss-ledger — what the manager got wrong, in its own words (REG-IN)

## End-of-shift retro — the question battery (Ishay's request, 01/08/2026)

Run at every shift close, BEFORE writing the shift summary. Two meta-rules: every
answer must cite a concrete event from THIS shift (an answer with no anchor is a vibe);
and the retro's output lands here / in `manager_evidence_regin` as **candidates only** —
never straight into the skill (the graduation bar is the overfitting guard).

**Self-improvement (margins-style, aimed at the manager):**
1. **מי תפס את הטעויות שלי — אני או המערכת?** יחס נמדד. הכל-המערכת ⇒ הבקרה-העצמית
   שלי לא שווה כלום; הכל-אני ⇒ כנראה תת-דיווח.
2. **אילו מהאישורים שלי היו "אישור-עייף"** — נשלחו על תחושת-קפדנות של שכבה אחת בלי
   שכל השכבות רצו? (משפחת 710-#5.)
3. **על מה סמכתי כי עבד קודם — בלי למדוד שוב?** תקדים הוא לא ראיה טרייה.
4. **איזו שאלה מהארכיון לא שאלתי אף פעם המשמרת — ולמה?** פער-כיסוי של הסוללה עצמה.
5. **מי לא תיקן אותי?** אפס-דחיפות-נגד מהבנאים ≠ שהייתי צודק — אולי חוזה-הספק-ההדדי
   מת. בדוק: כמה פעמים בנאי חלק עליי בפועל?
6. **איפה הייתי צוואר-בקבוק?** כמה זמן בנאים חיכו לי, והאם ה-fallback היה צריך לירות?

**Anti-bias · anti-overfit · anti-leakage (ישי: "היזהר מהטיה, דאטה-ליקז, התאמת-יתר"):**
7. **הטיה:** באילו "אומת ✓" חיפשתי אישוש במקום הפרכה — כולל: האם אימתתי בשיטת-המדווח
   במקום בשיטת-המקור? (עוגן-הקבע: ה-grep הכפול של §7.86.)
8. **התאמת-יתר:** כמה כללים נולדו המשמרת מול כמה תקריות? יחס קרוב ל-1:1 = מפעל-טלאים.
   ולכל כלל חדש — מבחן-הפוך: האם היה *מזיק* במשמרת קודמת כלשהי?
9. **דאטה-ליקז:** (א) האם בניתי את רשימת-הבדיקה שלי *לפני* שקראתי את דוח-הבנאי — או
   שבדקתי רק את מה שהוא הצהיר, וכך העיוורון שלו נהיה שלי? (ב) האם מסרתי לבודק את
   התשובה הצפויה ("אמורות להיות 71") — מספר-מצופה מטה ספירה לאישוש במקום למדידה?
10. **שרידות:** הפספוסים הרשומים הם רק שנתפסו. אילו סוגי-פעולה שלי לא עברו *שום*
    בדיקה המשמרת? — שם גרים הפספוסים שלא נראו.
11. **עלות:** מה המשמרת צרכה מול מה שייצרה — והאם משהו כבד רץ בשעה שבה מוות-מכסה
    היה מקפיא הכל בלי יכולת-תגובה? (עבודה כבדה מתוזמנת לשעות שישי ער; מוות-מכסה
    = פרוטוקול-הקריסה: הכל-מהדיסק, כלום-בנרטיב.)

The skill body says use is the only validation instrument this role has (the
fresh-agent test was deliberately dropped — Ishay's ruling, 710, 1.8). This file
is that instrument. **Append-only, newest last.** One entry per miss, written
the moment it surfaces — not reconstructed later, when memory has already been
sanded down into something flattering.

**What counts as a miss:** an approval that didn't hold · something that
surfaced after you signed off · a fact asserted from memory that the repo
contradicted · a question routed to Ishay that you could have answered from the
repo / memory / your own measurement (the triple gate) · a claim from a builder
or agent accepted without first-hand verification · an escalation misclassified
in either direction.

**What does not:** being wrong in a way you caught yourself before it cost
anything — that's the system working. A builder's own bug you never claimed to
have checked. Don't pad the ledger to look rigorous — the same "לא בכוח" that
governs findings governs this file.

Each entry: **what happened · why it was a miss · what it cost · rule change**
(or explicitly: no rule change, one-off). **A miss with no rule change is a
legitimate outcome** — the bar stays "true almost always, or a one-incident
patch". Format proven on 710's ledger (5 entries, first night); theirs is worth
reading when classifying a hard case:
`C:\Users\ishay\gedood_710\.claude\skills\work-manager\references\miss-ledger.md`.

---

## 1 · 01/08/2026 — modeled the structure on files never read, and reported "reconciled item-by-item"

**What happened.** The skill was split "like 710's" and its miss-ledger header was
invented — while 710's actual `references/` files (including a miss-ledger already
holding 5 real entries) had never been opened. The manager also reported to Ishay a
full item-by-item reconciliation of the 710 handoff letter, with the unread files
underneath it. Ishay asked one question — "תהיה כנה, קראת היטב את הקבצים?" — and the
gap surfaced. Not self-caught.

**Why it was a miss.** The "no citation without a same-turn check" habit was applied
to *claims* but not to *models*: copying a structure is also a citation. And the
invented header was measurably worse than the proven one it displaced (newest-first
table vs append-only prose with "no rule change is legitimate").

**What it cost.** Three fix edits and one extra round at 3am; cheap because it was
caught before any future session inherited the weaker ledger format.

**Rule change — no new rule; a sharpening.** "Open the thing, this turn" extends to
files you *pattern yourself on*, not only files you assert about. Second shape of the
same habit — if a third shape appears (asserting, modeling, …), the habit needs an
operational form like the triple gate got.

## 2 · 01/08/2026 — ran a §7 rulings batch without the skill's stale-detection; re-asked settled ground

**What happened.** The first M4 rulings batch asked Ishay about geocode-NULL policy
(already ruled 29/07, §7.15 round-2(5)) and recommended choosing Nominatim *now* —
against his recorded 29/07 ruling "נבחר בבנייה, לא מהזיכרון". Caught only at
write-back time, when §7.15's full text was finally read. He answered "סבבה" — trust,
not verification — so nothing protected the batch except my own prep, which skipped
`section7-rulings`'s mandated stale-detection pass and read only the three target
items, not the items that *reference* them.

**Why it was a miss.** The skill for exactly this exists and prescribes stale-detection
first; I hand-rolled the prep instead of routing through it — a violation of my own
router section, same night it was written.

**What it cost.** Minutes of Ishay's 5am attention; benign only by luck — both answers
happened to align with the earlier rulings. Reconciled honestly in the write-back
(Nominatim = default-candidate, not final; the choose-at-build ruling stands).

**Rule change — no new rule; a compliance note.** `section7-rulings` already mandates
it. The sharpening: stale-detection must grep which OTHER §7 items *cite* the target
numbers — the settled answer lived in a different item (§7.15) than the one being
closed (§7.55).

## 3 · 01/08/2026 — the first manager→manager handoff: two misses it surfaced

**What happened.** (a) Manager-1's handoff block claimed "דוח-סיום התקבל 12:55" inside
a commit authored ~12:41–12:45 — a future-drifted stamp ON the handoff artifact itself,
caught by the incoming manager's clock read. The builder's STATUS entry the same hour
stamped 13:05 inside a 12:47 commit. (b) A builder report crossed to the outgoing
manager mid-cliff and got answered with a wrong "הסבב הושלם"; the builder had no way to
know the successor's name.

**Why misses.** (a) is a recurrence AFTER the timestamps rule graduated (01/08) — but
both new occurrences are from writers who never load the manager skill: **the rule's
home doesn't reach its violators.** (b) is a routing hole in the handoff design itself.

**What they cost.** Minutes of successor verification; the wrong "הסבב הושלם" needed an
explicit re-assertion of the item-3 stop.

**Rule change.** (b) → already graduated same-day by Ishay's own refinements (takeover:
push identity to every live builder; handover: forward by name, route-only). (a) → no
new rule yet; **candidate: the timestamps rule must live where builders read (prompts.md
template line / builder-prompt boilerplate), not only in the manager skill.** Graduates
on next builder-side stamp drift.

## 4 · 01/08/2026 — asserted an E2E blast-radius in a builder prompt without measuring it

**What happened.** The save⇄send round's prompt told the builder the change "touches exactly
the path the E2E suite crosses (save ⇒ navigate to list)", and used that to justify bundling
the fixture repair into the same round. The builder measured: `grep quote-save|quote-cancel
e2e/` returns **zero** — no E2E test clicks save on the builder page at all. Reproduced
myself: zero. The bundling was still right *as timing*, but the stated reason was false.
Not self-caught — the builder caught it, and volunteered the correction unprompted.

**Why it was a miss.** Textbook violation of this role's one habit, in its most dangerous
shape: a confident causal claim inside a **prompt**, where it carries the manager's authority
and the worker is likelier to build on it than to check it. Same family as ledger #1 and #3a —
asserting what the repo could have answered in the same turn. The grep cost one call.

**What it cost.** Nothing material — the builder verified instead of trusting, which is the
mutual-doubt contract working. The real cost is the ratio: **fourth entry, third in this
family.**

**Rule change — none; the rule already exists and is graduated.** What this argues for is not
a new rule but a **mechanism**: the habit keeps failing specifically when the claim is
*supporting* a decision already made (bundling, patterning, stamping) rather than *being* the
decision. Candidate mechanism, needs one more occurrence: before sending any prompt, re-read
own factual claims and mark each as measured-this-turn or delete it.

## 5 · 01/08/2026 — the shift's headline pattern: existing mechanisms not run

**What happened.** Three separate mechanisms that already exist in this skill went unrun in
one shift, each caught by someone else: **(a)** the two closing probes ("מה עוד לא בדקת?" /
"יש משהו נוסף?") were skipped on a strong builder report — Ishay caught it within a minute,
and the same probes had returned five real verification gaps one round earlier; **(b)** the
rolling work-plan went **eleven hours without a refresh** while eight items closed, though
the file's own rules mandate a refresh on every close — so it still offered Ishay a §7 round
already ruled at 11:50, and never contained the last two steps to module close (the audit
re-run and the PR). Ishay caught that with a four-word question; **(c)** ledger #4, the same
day: a factual claim shipped inside a prompt without a same-turn check.

**Why it is one miss and not three.** Every one of them has a written rule that is correct
and already graduated. Nothing was missing from the skill. What failed is **running what is
already there** — and in all three cases the trigger was the same shape: the mechanism fires
at a *transition* (a report arriving, an item closing, a claim being used as support), and
transitions are exactly where attention is on the next thing.

**What it cost.** No production damage; the cost was Ishay's attention, three times, on
things the role exists to spare him.

**Rule change — deliberately none.** A fourth rule saying "run the rules" is the
patch-factory failure this skill's own growth gate exists to prevent. Recorded here as the
shift's dominant pattern so the next manager reads it at boot. **What would actually move
it, if it recurs: a mechanism at the transition points, not more text** — e.g. the closing
probes emitted as a fixed block the moment a builder report is adjudicated. Candidate only.
