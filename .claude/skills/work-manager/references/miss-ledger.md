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
