# Card: the September 2026 payroll review round (the deputy dispatches; a fresh agent)

**Role: operator.** You run one real payroll review round on the LIVE site, through the UI only, so that tomorrow's stage shows a September with these states:
- most hostesses approved;
- one hostess who reported an hours error, which the manager corrected and she re-approved;
- **exactly 2 hostesses who never answered.**

**September is NOT issued.** "אשר לפי תיעוד" and "הפק ושלח" are clicked by Ishay on stage tomorrow, never by you.

Live site: `https://reg-in-umber.vercel.app`, page `/finance/payroll`.

## Read first, in full
- `C:\Users\ishay\Reg-In-payroll-e\docs\specs\module_08_finance\payroll-contract.md`: the review flow, states and rules. If the path differs, find it with Glob.
- The screens in `C:\Users\ishay\Reg-In-payroll-e\src\modules\08_finance\payroll\`: `ReviewSection.jsx`, `ReviewTable.jsx`, `CasePanel.jsx`, `CorrectionForm.jsx`, `DraftSection.jsx`. They hold the exact labels.
- The public page `PublicPayrollReviewRoute.jsx`: what a hostess clicks.

## Tools
- **Browser:** a Playwright spec you write at `C:\Users\ishay\Reg-In\e2e\zz-september-tmp.spec.js`.
  - Use `test.use({ channel: 'chrome' })` and a 1536×960 viewport.
  - Log in as **`E2E_FINANCE_EMAIL` / `E2E_FINANCE_PASSWORD`**. `playwright.config.js` loads them from `.env.local`; never print them or read that file.
  - Copy the login pattern from `C:\Users\ishay\Reg-In\e2e\reports.spec.js:55-66`.
  - Run with `E2E_BASE_URL=https://reg-in-umber.vercel.app npx playwright test e2e/zz-september-tmp.spec.js --reporter=list > <log> 2>&1; echo exit=$?`. Never pipe it into head/tail.
  - **Delete the spec at the end.** `git status --short e2e` must be empty. No commits.
- **The hostesses' personal links:** every payroll mail is redirected by the server to Ishay's inbox (ishay1997@gmail.com), with the intended hostess named inside.
  - Read them with the Gmail MCP tools, **read-only**: search_threads, get_message and get_thread only. Search by the payroll review subject.
  - **Never** send, reply, forward, label, trash or draft anything.
  - The link is `/payroll-review/<token>`. Tokens are stored hashed, so the DB cannot give them to you.
- **DB:** SELECT only (Supabase MCP `execute_sql`, project `yfeovxppnfoafmfbdfvh`). Use it to read states and to prove the result. Never write.

## The run
1. **Draft:** open September 2026 and screenshot the draft. Do the draft-approval step the screen requires before a review can start, if there is one.
2. **Create the review:**
   - deadline **15/10/2026 08:30**;
   - send the personal summaries to all hostesses in the month;
   - none of the 4 demo hostesses (נועה שגיא, דנה לוין, נטע הרוש, שלי אלקיים) should be in September. If one is, stop and report.
3. **Pick, by SELECT, and write down before acting:**
   - **H1, the hostess who reports an error:** one with a single September shift, a short Hebrew name, and a valid mail.
   - **N1 and N2, who never answer:** two others.
4. **Approve:** open the personal link of every other hostess and click approve. Wait between hostesses if the page rate-limits; never hammer it.
5. **H1:**
   - Open her link and report an error, in her words, e.g. `עבדתי 6 שעות ולא 5 — יצאתי שעה אחרי הסיום`. Make it +1 hour on her one shift.
   - As the manager, open her case, use the correction form to set her actual hours +1, with the reason `תיקון לפי דיווח הדיילת — אושר מול מנהלת האירוע`, and resolve the case as the screen requires.
   - Re-send her summary. The new link arrives in Gmail.
   - Open the new link and approve.
6. **Leave N1 and N2 untouched.**
7. **Prove it by SELECT and a screenshot of the follow-up screen:**
   - the counts: approved / manager-approved / open cases / awaiting;
   - H1's hours before → after;
   - the review is still `open`;
   - nothing is issued: there is no new salary report for September;
   - the deadline is 15/10/2026 08:30.

## Never
- "אשר לפי תיעוד" (bulk or single), "הפק ושלח", or anything that issues.
- Any month other than September 2026.
- Projects 1638, 1651, 1648, 1649, 1650, 1620 or 1615.
- Changing hours of anyone except H1.
- Any write by SQL.

## Report (your final message)
- H1's name, her shift (project and date), and her hours before → after.
- The names of N1 and N2.
- The final counts as the screen shows them, verbatim.
- The review id and the deadline.
- Screenshot paths, saved to `C:\Users\ishay\payroll-work\demo-data\backup\sept-NN-<step>.png`. Verify Hebrew on an enlarged crop, not on the downscaled shot.
- Every step not done, and why.

## Stop
- Stop at **19:15 Israel time** (`date` in bash) whatever remains, and report.
- If the deputy messages "stop", finish the current hostess and report.
