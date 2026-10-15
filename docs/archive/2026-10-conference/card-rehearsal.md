# Card: the UI/UX rehearsal agent, 14.10 ~16:00 (the deputy dispatches it; a fresh Opus agent)

Role: **screen checker (בודק-מסכים)**. You run the conference stage route once as a rehearsal on the LIVE site, take backup screenshots, time each step and report what would hurt on stage. You never build or fix anything.

Live site: `https://reg-in-umber.vercel.app`. main @83d34eaa; reports and validations went live today.

## Role skill (added 16:0x after Ishay caught the omission)
Invoke `/ui-ux-release-manager` through the Skill tool, and run the rehearsal as that role. The card stays binding where they overlap. The skill must not open or message other sessions, and must not write board or state files.

## Read first, in full
1. `C:\Users\ishay\payroll-work\demo-route-15-10.md`: the stage route; §2 is the table, §5 is the fallbacks.
2. `C:\Users\ishay\payroll-work\demo-reports-explainer.md`: what each report number means.
3. `C:\Users\ishay\payroll-work\PLAN-14-15.md`: the "Hard rules for everyone today" section.

## Tool: a Playwright spec you write, never a browser you type a password into
- Copy the login pattern from `C:\Users\ishay\Reg-In\e2e\reports.spec.js:55-66`. `playwright.config.js` loads `E2E_CEO_EMAIL` / `E2E_CEO_PASSWORD` from `.env.local`. The secret never passes through you: do not print it, echo it or read `.env.local`.
- Put the spec in `C:\Users\ishay\Reg-In\e2e\zz-rehearsal-tmp.spec.js` and run it with:
  `E2E_BASE_URL=https://reg-in-umber.vercel.app npx playwright test e2e/zz-rehearsal-tmp.spec.js --reporter=list > <log> 2>&1; echo exit=$?`
  Never pipe it into head/tail; a hook blocks that.
- Use `test.use({ channel: 'chrome' })` and a 1536×960 viewport.
- To keep the login across runs, save storageState to `C:\Users\ishay\AppData\Local\Temp\rehearsal-state.json`.
- **Delete the spec when you finish.** `git status --short e2e` must be empty. No commits, no push.
- Screenshots go to `C:\Users\ishay\payroll-work\demo-data\backup\NN-<step>.png` (create the folder).
  - Take VIEWPORT shots, not `fullPage`. A full-page shot resizes the page, and the chart animation restarts empty. Measured today.
  - 🔴 **Check Hebrew on an enlarged crop, never on the whole downscaled image.** Small Hebrew in a downscaled image reads letter-reversed to a model; the file is fine. Measured today, `live-check/crop-title.png`. Before the rest, crop and enlarge one label from your first shot with PIL and confirm by eye that it reads correctly.
- DB: SELECT only, through the Supabase MCP `execute_sql`, project `yfeovxppnfoafmfbdfvh`. Never `apply_migration`, never INSERT/UPDATE/DELETE.

## The rehearsal route: these writes on the live site are allowed, and ONLY these
| # | Stage step | What you do instead |
|---|---|---|
| 1–3 | New quote → send → approve | Customer **הדר מערכות רפואיות (416)**. The recipient is **contact 322**, the address already filled in. **Never type another address.** Add a tag product in **two lines of 50 each** (the same product). Screenshot the tier note "מחיר מדרגה לפי 100 יחידות בסך הכל בהצעה". It may wrap to 3 lines in the price column: is it readable? Send by mail, download the PDF, approve and open the project. |
| 4 | Project card | Screenshot it. |
| 5 | Smart match | **Project 1648** (30.11), not 1638. "פתח שיבוץ חכם". Find the 4 hostesses **BY NAME**: נועה שגיא, דנה לוין, נטע הרוש, שלי אלקיים. Never "top N": the pinned rows on top have real gmails. Note where each one sits in the list. Send the coordination mail. |
| 6 | Hostess replies | Their mail goes to Ishay's inbox, which you cannot read. Instead, SELECT `invite_token` from `assignments` where `project_id=1648` and the hostess is one of the 4. Then open `/shift/<token>` (public, no login): נועה, דנה and נטע confirm; שלי declines. |
| 7 | Final approval | Back in smart match: "אשר סופית" for נועה and דנה. Confirm that נטע is released automatically. |
| 8 | Ready | `/projects`: does 1648 show "מוכן לביצוע"? If logistics block it, write down what the screen says. Do not fix it. |
| 9 | Closing | **Project 1605**, not 1651. Take hours and guests from `demo-data/files/event-summary-premium-launch-REHEARSAL.html`. Upload `demo-data/files/event-summary-premium-launch-REHEARSAL.pdf`. Attendance and quality for its hostesses. "שמור ושלח". |
| 10 | Finance | `/finance` → "ממתין לחשבונית": is 1605 there? Look only. |
| 11 | Payroll | `/finance/payroll` → **September: LOOK ONLY**. Screenshot the draft. 🔴 **Do not click** "צור סבב" / "שלח" / "אשר לפי תיעוד" / "הפק ושלח". September is issued only on stage. |
| 12 | Reports | מבט-על הנהלה + סגירת הצעות. Look only; do not click "הכול" (it is hidden). See the copy lens below. |
| 13 | System | `/system/permissions` → `/system/prices` → `/system/params` "תבנית_זימון_משמרת". **Look only, never save.** |
| 14 | Home | `/`. |
| LAST | Cancel 1648 | Through the UI, cancel project 1648 (release mails go to Ishay's +tag addresses; this is planned). Then SELECT that no `finally_approved` assignment is left on 1648. |

🔴 **Never touch:** projects 1638, 1651, 1649, 1650 (the stage and Ishay's rehearsal), 1620, 1615. Never act on September payroll. Never send mail to anyone except through the steps above.

## Four lenses, at 1536px
1. **Purpose in 10 seconds:** can a judge tell what the screen is for?
2. **Blockers:** anything that stops the step.
3. **Copy:** every visible string is professional, natural Hebrew; no technical term or column name leaks through.
   - On מ2/מ3 do a deep copy lens: invoke `/ui-copy-and-onboarding-levels` through the Skill tool, for these two surfaces only.
   - Ishay's ruling: *"ממש חשוב ניסוחים... זה הדבר שאני הכי מקבל עליו הערות"*, and nothing in the reports changes without his approval. So write a "today → proposed" list, verbatim. Do not change anything.
4. **Stage risks:** slow loads, a toast covering the button, anything a projector shows badly.

Plus Ishay's viewer gate (14.10): for every visible element ask "what decision does the viewer make with it?" and "does it look real to an outside viewer?" (an internal mechanism, a technical value or a test address ⇒ a finding).

## Report (as your final message; you cannot write report files)
- Per step: seconds taken, the screenshot path, ✅ / ⚠️ / ❌.
- **At most 10 findings**, each tagged **fix-today** (copy or CSS, under 30 min) or **after the conference**, with the screen, verbatim text and the fix.
- The מ2/מ3 copy list: today → proposed, verbatim.
- The places of the 4 hostesses in the smart-match list; Shelly's card text.
- The final SELECT after cancelling 1648.
- What you did NOT do, and why.

## Stop
- Stop at **17:15 Israel time** whatever remains (check `date` in bash, without TZ=). Cancel 1648 even if you stop early, unless step 5 never ran.
- If the deputy messages "stop", finish the current step, cancel 1648 and report.
