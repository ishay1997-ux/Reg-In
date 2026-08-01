# Writing prompts for other sessions

Loaded from work-manager SKILL.md when you sit down to write a prompt for a
builder session or browser-Claude. A prompt must let a fresh session work
without this conversation.

1. **Verify every factual claim against the code the same day it ships**, and
   stamp it (`🕓 אומת מול הקוד DD/MM HH:MM`). A stale claim sends a session
   hunting a solved problem — caught twice in one day (31/07).
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
   blocked/unsure→you · done→you before the closing report · **no reply from you
   within a reasonable time → the builder stops and asks Ishay directly**.
9. **A time estimate** — it feeds the ~120% silence threshold
   (references/watching.md).
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
