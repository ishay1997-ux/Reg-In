# Writing prompts for other sessions

Loaded from work-manager SKILL.md when you sit down to write a prompt for a
builder session or browser-Claude. A prompt must let a fresh session work
without this conversation.

0. **Open with the ⚡ manager banner — first lines, not buried in a contract
   section** (recurred 3× on 01/08 until made structural): "⚡ קיים סשן-מנהל פעיל.
   תוכנית → אליו לפני קוד · תקוע/ספק → אליו · 'סיימתי' → אליו · שאלות-מוצר → אליו,
   לא לישי. התקשורת ב-send_message (טען ToolSearch: mcp__ccd_session_mgmt — כלי
   נדחה). אין מענה זמן סביר → עצור ופנה לישי." A builder that doesn't know a
   manager exists builds silently and surfaces only at the end. (`module-build`
   now carries the full ⚡ section — the banner arms it.)

1. **Verify every factual claim against the code the same day it ships**, and
   stamp it (`🕓 אומת מול הקוד DD/MM HH:MM`). A stale claim sends a session
   hunting a solved problem — caught twice in one day (31/07).
1ב. **And say out loud, in the prompt, that the worker may doubt any fact in it.**
   One explicit line: "כל עובדה כאן ניתנת לערעור — אם מדדת אחרת, תקן אותי עם
   המדידה." Rule 4ב already demands a counted verification of the ONE top mine;
   this covers everything else, which is where it actually failed — on 01/08 a
   builder caught a false E2E blast-radius claim (ledger #4) **outside the mine,
   only because he chose to check**. ⚠️ An earlier wording of this rule also
   counted a wrong `canSend` assumption as a second local anchor; it isn't one —
   the manager had explicitly asked him to verify that. Corrected the same day:
   **one real local anchor + 710's two**, not two local. A generous
   classification neutralises the graduation gate exactly like a fabricated
   count, and is easier to swallow because each anchor does exist.
   SKILL.md already asserts builders are told this; until now no prompt
   rule carried it — the claim existed without its mechanism. Converges
   independently with 710's version, where it caught their manager twice.
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
   write "מדוד בעצמך" — never assert. See references/concurrency.md.
6. **Free rein is always fenced**, Ishay-style: "יד חופשית ב-X **בלבד**" — never
   open-ended. Free rein = do-what's-right + report-what-you-deferred.
7. **Name the tools the task needs** (Chrome, MCPs, Playwright-spec for
   credentialed screens…). Sessions forget their own capabilities — an
   unmentioned capability is an unused capability. **Always remind builders they
   can connect to Claude in Chrome and check browser-visible facts themselves** —
   recurred multiple times in 710 (Ishay, 01/08): unreminded builders route
   checks to Ishay that they could run. Consult `docs/toolbox.md` first —
   dispatch to a disabled plugin fails silently.
8. **The checkpoint contract + your fallback**: plan→you before code ·
   blocked/unsure→you · done→you before the closing report · **🚫 product questions
   go to YOU, never directly to Ishay** (you answer from the playbook or escalate
   once — that is the replacement mandate; a builder asking Ishay re-opens answered
   ground and costs trust, proven 710 1.8) · **no reply from you within a
   reasonable time → the builder stops and asks Ishay directly** (the one exception
   to the routing rule) · **Ishay spoke to the builder directly? Legitimate and
   binding — but the builder's next message to you MUST open with "ישי אמר לי X"**
   (day-mode loop-closure, Ishay 01/08: he is a second channel by right; the
   manager's picture must not desync silently — the burden is the builder's,
   never his).
9. **A time estimate** — it feeds the ~120% silence threshold
   (references/watching.md).
9א. **Demand the blind-spot section in their plan** (Ishay, 01/08: "בפרומפט במיוחד
   טוב לכתוב — מה הבליינד-ספוט? על מה לא חשבתי?"): the plan they send you must
   answer "מה הבליינד-ספוט שלי? על מה לא חשבתי? מה עוד לא בדקתי?" — it forces the
   builder to dig before submitting. ⚠️ Their answer never replaces YOUR layer-2
   probing (same mind wrote both — 710 ledger #5); it's a floor, not the gate.
9ב. **A model + effort recommendation, with the reason** — per the work-type table in
   `docs/guides/reference/claude_code_setup.md` §⑨ (Ishay's request, 01/08: "לכתוב לי
   גם איזה מודל להשתמש"). Routine guide-driven build → Sonnet/high; DB-schema,
   complex business logic, module open/close → Opus/Fable high–xhigh.
10. **Route deliberately**: follow-up fixes to the session that owns the context;
    fresh rounds to fresh sessions; hold a prompt while in-flight work could
    invalidate it — and re-verify it when the hold lifts.
11. Steps Claude cannot do (browser, OAuth, dashboards, secrets) get the 🧩
    treatment per iron rule 17: Hebrew step-by-step for Ishay **plus** a
    self-contained browser-Claude prompt. Secrets never in chat or a field —
    `Set-Clipboard` → he pastes.
12. **Every prompt handed to Ishay is preceded by 2–3 plain-Hebrew lines** — מה
    הסשן הולך לעשות, למה עכשיו, ובמה הוא נוגע (his request, 01/08: "לפני פרומפט
    אשמח בקצרה שתסביר לי מה אתה שולח אותו לעשות"). He pastes with understanding,
    not on faith — the prompt itself is written for Claude, the preface for him.

*(13–17 were adjudicated ADOPT on 01/08 ~11:30 with an execution slot that passed
silently; measured absent twice — by manager-3 and again by manager-4 — and landed
02/08. Their absence is ledger 7 and ledger 11.)*

13. **Open with the item ID and the state you read** — "לגבי שורה N, לפי מצב X
    שראיתי ב-<file>". **Message and file disagree ⇒ read the file, not the
    message.** (≥5 message crossings in a single night, 01/08.)
14. **Every claim in your report carries its source** — `אומת-על-ידי` (you ran it)
    vs `דווח-לי` (someone told you). Extends the manager's own מדדתי/על-דיווחו
    split downward, and converges with the §7.86 lesson.
15. **Close the prompt with "האם המשימה ברורה? יש לך שאלות?" — and the worker's
    FIRST message answers it** before anything else. Fires *earlier* than the plan
    gate, so a wrong understanding never reaches a plan. (Ishay's own habit; it
    caught a real inversion on 01/08 that a plan would have carried silently.)
16. **The builder's standing pull-question to you: "על אילו מוקשים לא חשבת?"** —
    mines are approach-specific and the prompt predates the approach, so the pull
    fires when the plan exists. 🔴 **Your verdict MUST answer it explicitly,
    including "אין"** — an unanswered standing question dies within a week.
    (Rule 9א is the other direction: his blind spots, not yours.)
17. **The gap protocol — never silent-fill an under-specified spot.** Technical gap
    ⇒ decide, mark "הכרעתי, הפיך", report · product-flavoured ⇒ a question to you.
    (Ishay's pain, 01/08: "הבלופרינט לא תמיד מפורט מספיק עבורו ואז הוא מנחש לפעמים".)
18. **Terse in his own window, detailed to you.** Ishay reads the manager, not the
    builder's session — **prose written there is quota spent on text nobody reads.**
    (His ruling 02/08.)

🚫 **Considered and rejected — heartbeat file + receipt-ack on every message**
(the sixth of that 01/08 batch): measured here, **zero messages have ever been lost**
— the platform queues across session death, proven in the 05:28 crash. It solves a
problem this arena does not have and adds noise to every exchange. **Recorded as
rejected-with-evidence so a future manager does not re-adopt it as "missing".**
