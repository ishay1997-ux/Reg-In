# Card: the "judge's tour", every main screen as a judge might ask to see it (14.10 ~19:0x, READ ONLY)

**First action:** invoke `/ui-ux-release-manager` through the Skill tool and work as that role (screen checker).
- For the copy lens, also invoke `/ui-copy-and-onboarding-levels` through the Skill tool.
- The role skill must NOT open or message other sessions, and must NOT write board or state files.

**Why this exists.** Ishay, 14.10:
> "בעשר דקות שאלות יכולים להתעניין פתאום דווקא על מסכים שלא הצגנו"
>
> "ובעיקר ניסוחים עמומים לא ברורים או ארוכים בלי סיבה גם לשים לב"

Tomorrow at 09:00, a judge may ask "show me screen X". Every main screen must open cleanly, look professional and read clearly.

## Hard limits
- **READ ONLY.** No saves, no sends, no status changes, no "create". Open dialogs only to look, then close them with ✕ or Escape. DB access is SELECT only (Supabase MCP `execute_sql`, project `yfeovxppnfoafmfbdfvh`).
- 19:45–21:00 is a live freeze, and Ishay and Amit rehearse at 20:00. Reading is fine, but nothing that writes.
- Never touch projects 1638, 1649, 1650, 1651, 1652 or 1605, or September payroll review #2. Looking is fine.
- The stage route screens were already checked today (see `demo-route-15-10.md`). Spend your time on the screens **outside** the route; give the route screens one quick look each.
- **Browser:**
  - A Playwright spec at `C:\Users\ishay\Reg-In\e2e\zz-judge-tour-tmp.spec.js`, with `test.use({ channel: 'chrome' })` and a 1536×960 viewport.
  - Log in as the CEO (`E2E_CEO_*`, loaded by `playwright.config.js` from `.env.local`; never print or read them). Copy the login from `e2e/reports.spec.js:55-66`.
  - Run with `E2E_BASE_URL=https://reg-in-umber.vercel.app npx playwright test <spec> --reporter=list > <log> 2>&1; echo exit=$?`. Never pipe it into head/tail.
  - Take viewport screenshots, never fullPage: full-page shots make charts render empty.
  - Check Hebrew on an **enlarged crop**, never on the downscaled image.
  - Delete the spec at the end; `git status --short e2e` must be empty. No commits.
- Screenshots go to `C:\Users\ishay\payroll-work\judge-tour\NN-<screen>.png`.

## Which screens
Every route in `src/App.jsx` that a manager can open, including list, detail and each tab:
- customers (list, one customer card with each of its tabs);
- quotes (list tabs, one existing quote);
- projects (list tabs, one project card with each tab);
- hostesses (overview, repository, one hostess card);
- logistics;
- finance (3 tabs and the payroll workspace);
- reports (all 4 tabs and every surface in each; do NOT open reports 17 and 20 — stage rule);
- system/settings (permissions, prices, params, users, my settings);
- home.

Pick real existing records for detail pages, by SELECT. Avoid the protected projects.

## The lenses, in this order of importance
1. **Copy (Ishay's emphasis).** Wording that is vague, unclear, or long for no reason. Also flag:
   - technical terms or column names leaking through;
   - hyphen-compounds that read like code ("שולי-רווח" style);
   - feminine imperatives addressed to the manager (the system's manager copy is masculine/neutral since 11.10; hostess-facing text stays feminine);
   - an empty state that does not say what to do.

   For each, give **today → proposed**, verbatim, and keep the proposed text shorter or clearer.
2. **Opens cleanly.** No error banner, endless spinner or blank area. Note load time if it is above about 3 s.
3. **Believable data.** No test or UAT names, no "test", no obviously fake phone numbers or emails (like 1234567), no impossible numbers, no empty tables where the business would have data.
4. **Visual noise.** Too many colours, crowded tables, stretched cards.
   Status tags were calmed today:
   - gray for done or finished;
   - colour only for "needs attention".

   Flag anything that still shouts.

## Report (your final message)
- A table with one row per screen: the screenshot path, opens cleanly ✅/❌, load seconds, and a **one-sentence "what this screen is for"** in plain Hebrew. That sentence is what Ishay can say if a judge asks.
- **Findings**, ranked by how likely a judge sees them. Each one gives the screen, today → proposed (verbatim for copy), and a fix class:
  - **(A) copy or style, about 10 min each**;
  - **(B) data, a SELECT-proven cause**;
  - **(C) not tonight**: the answer to give if asked.
- Finish by **20:15 Israel time** (`date` in bash). The deputy fixes A/B after 21:00.
