# Review of demo-route-brief.md (against origin/main bffdfae3, 14.10 10:57)

## 1. Claims without a source

**Verified**
- `conference-readiness-and-follow-up.md` exists. The chain is at line 13. The budget is 9 min demo + 1 min transitions, also line 13. C01-C09 are at lines 32-40.
- Old script `docs/guides/conference-demo-script.md` is the 24.09 8-station route. Traps:
  - Make/Gmail real send: line 130 (it says "שלחי"; the label became "שלח" in commit 9834c6db).
  - 1620/1615 frozen: lines 71-76.
  - Quotes list: lines 80-86 (15 of 33 for past events; quotes 30 and 31 carry real addresses).
  - Log in before going on stage: line 41.
- Routes: `/finance/payroll` is at `src/App.jsx:227-230` under `ProtectedRoute allow="כספים"`. `/payroll-review/:token` is at line 100, public, outside MainLayout.
- Legacy payroll dialog removed: commit 68cc4e20.
- Mail guard to ishay1997@gmail.com: `supabase/functions/payroll/guard.ts` (`OWNER_ADDRESS`). Redirect is invisible: guard.ts header.
- August = report 15: `STATUS.md:5`.
- Deadline rules: `payroll-contract.md:167` (deadline must be at least now+5 min) and `:173` (`אשר לפי תיעוד` needs `now() > deadline`).

**Unverifiable in the repo** (DB only)
- 40 hostesses and the 21 unpaid shifts in September.
- July = report 16.
- Accountant `office@levi-cpa.co.il` (`git grep levi-cpa` finds nothing).
- Items that were not live at the time of writing.

**Weak**
- "12 steps" appears only in C01 (plan line 32). No 12-step list exists in the repo.
- The plan's split (Amit steps 1-4, Ishay 5-12) differs from Ishay's verbatim split in the brief. The brief should say which one wins.

## 2. Missing from the brief

1. **The old script is stale on AI.** It says the follow-up AI button is hidden. Now `src/lib/quoteFollowup.js:30` has `FOLLOWUP_AI_AVAILABLE = true` (re-enabled 25.09).
   - The button needs a quote that was already sent (`draft-followup/README`, 409 otherwise).
   - Server budget is 90 s and the dialog timeout is 160 s.
   - The only live measurements: 24.09, 3 calls at 1.9-3.7 s. The first three calls on that day failed.
   - A second AI feature, the "הריצי שוב" re-run in the customer-notes report, is a live Gemini call with a shared quota. The old script says never press it.
2. **Quote email is now a feature, not only a trap.** Pre-conference plan WP-3 and C03: send dialog with an editable recipient, verified to ishay1997@gmail.com.
   - The old script says "the script never sends mail". The brief's "do not send" conflicts with a demo that starts from a new quote.
   - The recipient guard covers `salary_report` only (`send-email/index.ts:177`). Quote and hostess-invite mails are NOT guarded. They go to whatever address is typed or seeded.
   - Backup for mail/PDF, from the old script §5: PDF saved on the desktop, hotspot, screenshots, full screen recording. C06 says the old backup may not match the new route.
3. **Refresh of 14.10.** `STATUS.md` (blocking task) and `scripts/conference-refresh/refresh-before-conference.sql`: they run after payroll go-live.
   - Step 4 closes about 15 events and writes attendance and hours. This moves the home screen and the report numbers.
   - It also covers the 32 open quotes and the 24.10 expiry.
   - Every number measured before it is stale.
4. **New-project traps.**
   - Approving a quote to create a project: no e2e covers the success path (`conference-uat-script.md`, module 3 row).
   - Moving an event date through the UI resets all final approvals and invalidates invite links (`STATUS.md:362`).
   - The DB blocks one hostess on two events on the same day (migration `20260814142440`).
   - Staffing "new + ready" has no prepared record. The only known one is the frozen 1620.
5. **Other conference docs not mentioned:** `conference-uat-script.md`, `docs/guides/conference/` (the 28.08 script and `amit-prep-guide.html`), `2026-10-11-pre-conference-fixes-plan.md`, `2026-10-13-payroll-end-to-end.md` §Conference recommendation, and C05/C08.
6. **Payroll mail goes through Make.** `MAKE_EMAIL_WEBHOOK_URL`, 25 s timeout, a possible "unknown" state (`payroll/transport.ts`). The brief lists no backup if Make is slow.
