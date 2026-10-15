# Worker card — payroll pre-conference fixes (fresh builder, deputy 14.10 ~11:05)

Mirror seen by Ishay: 14.10 11:2x, in chat. He asked for a fresh builder because the old one's context was large.
Model: Opus, medium effort (Ishay's rule for build work).

## Where
- Repo worktree: `C:\Users\ishay\Reg-In-payroll-d`, which already has node_modules.
- Run `git fetch origin` and then `git switch -c ishay/payroll-prefinal origin/main`. main is @ bffdfae3, which is production.
- Commit by explicit pathspec only (`git commit -- <paths>`).
- You may NOT:
  - push, merge or deploy;
  - apply migrations;
  - write to the live DB (SELECT-only reads are allowed);
  - send mail;
  - touch September 2026 data.

## Read first (in full)
- `C:\Users\ishay\payroll-work\contract-fixes.md`, which holds the binding owner rulings F11–F15. The ones that matter here:
  - no money on hostess screens;
  - no ₪ totals on manager screens;
  - the draft table is a one-to-one preview of the accountant file;
  - the mail redirect stays invisible.
- `src/modules/08_finance/CLAUDE.md` and root `CLAUDE.md` §3: RTL utilities and LF line endings.
- Copy rules:
  - hostess-facing text is feminine;
  - manager-facing text is masculine or neutral (PR #177).
  - Every visible string passes the viewer gate before you finish:
    - (0) What is this screen for?
    - (1) Which decision does the viewer take with this element?
    - (2) Does it look real in front of judges?

## The 6 fixes (all found in today's production acceptance on July)
1. **Clickable link in the hostess review mail.** Today the link is plain text wrapped in bidi isolates (`supabase/functions/payroll/mail.ts` `plainTextToEmailHtml`), so Gmail may or may not auto-link it.
   - Render it as a real `<a href="…">` whose visible text is the URL or a short Hebrew label of your choice that passes the gate.
   - The href must be the exact URL.
   - No isolate characters may appear inside the href.
   - Keep `mail.parity.test.js` green. Update it only where the review mail is new behaviour; accountant mail parity with `src/lib/email.js` stays.
   - Add a test asserting the href equals `${origin}/payroll-review/${token}`.
   - The deputy redeploys the `payroll` edge function after merge.
2. **Follow-up table, recipients never sent a summary.**
   - Today they show "יש לשלוח סיכום מעודכן". That is wrong, because they never got one.
   - The "פעולה אחרונה" column shows the review-creation time as if it were an action.
   - Never-sent ⇒ a status or label that says it was not sent, and "פעולה אחרונה" shows `—`.
   - Files: `src/modules/08_finance/payroll/payrollModel.js` (`actionReason`, `recipientStatus`), `ReviewTable.jsx`.
3. **Second tab after a successful issue.**
   - The other tab stays on "מוכן להפקה", shows "ההפקה לא נמצאה. יש לרענן…", and polls status 23 times with HTTP 400.
   - When the server answers "already issued" or "operation not found" after an issue elsewhere: reload the workspace data and stop polling.
   - Files: `FinalSection.jsx` and the polling hook.
4. **XLSX sheet 2, "סיכום לפי דיילת"**, in every builder of the accountant file:
   - browser `src/lib/salaryReport.js`: draft and reconstruction;
   - server `supabase/functions/payroll/document.ts` + `xlsx.ts`.
   - Columns: `ת"ז`, `שם`, `פרטי-בנק`, `משמרות`, `סה"כ שעות`.
   - Rows: one per hostess over the lines that are in the file (showInFile), sorted by name. Add a footer row with the total shifts and total hours.
   - No ₪ column (F12).
   - Sheet 1 stays exactly as it is.
   - Extend `document.parity.test.js` to cover sheet 2 cell by cell.
   - **Prove it under Deno** before you finish: write-excel-file@2.3.10 multi-sheet output in Deno, read back with read-excel-file. Both sheets must be present, RTL, and the ID kept as text. Use a scratch script; `deno` is installed. Then run `deno check --node-modules-dir=none` from `supabase/functions/payroll`.
5. **Draft screen mirrors sheet 2.**
   - Add a switch above the draft table: `לפי משמרת | סיכום לפי דיילת`. The second view shows exactly sheet 2's columns and rows.
   - Keep the URL-state convention for the toggle (root `CLAUDE.md` §4.2).
   - The final step's preview follows the same rule.
6. **The zero-row line must say why.**
   - Today it reads "N משמרות ללא תשלום אינן נכללות בקובץ".
   - Split it by basis, e.g. `21 משמרות לא נכללות בקובץ: 20 בלי שעות עבודה, וביטול אחד בלי דמי ביטול`.
   - Actual-basis zero lines = "בלי שעות עבודה". Compensation-basis zero lines = "ביטול … בלי דמי ביטול".
   - Handle singular and plural, and omit a part whose count is 0.
   - No DB change.

7. **Bulk "אשר לפי תיעוד"** (deputy 11:1x, for the conference: 40 hostesses).
   - Today it is per-row only (`ReviewTable.jsx:156`).
   - Add one action on the follow-up view: `אשר לפי תיעוד את כל מי שלא השיבו (N)`. It is enabled only after the deadline, same as the row action.
   - It opens `ReasonDialog` once: one reason, plus a contact note required for recipients never sent a summary. The dialog lists the count and the names.
   - It then calls the existing `payroll_review_approve_no_response` per recipient, sequentially, using the same RPC. No DB change.
   - It shows progress, and a final toast with counts. If some rows fail (for example STALE), it keeps the successful ones and lists the failed names.
   - Test it.

8. **Cross-midnight notice in the quote builder** (Ishay 14.10 ~12:4x: the moderator asked about an end time earlier than the start time).
   - The project edit dialog already shows `CROSS_MIDNIGHT_NOTICE` ("האירוע חוצה חצות", `src/lib/projectCard.js:30`, used at `EditProjectDetailsDialog.jsx:349`).
   - `QuoteBuilderPage.jsx` (~line 687, the "משך האירוע" field) does not.
   - Show the same notice under the duration field when end < start. It informs and never blocks (S-17).
   - Reuse the constant and the existing duration helper (`src/lib/quotes.js:442`).
   - Use the same visual style as the project dialog.
   - Test it.
   - **Plus soft time validations** (Ishay 14.10 ~12:5x: *"הם אוהבים בדיקות תקינות זה לא כמה שורות ולידציה פשוטות?"*). They are informative, never block, and appear right under the duration field. Apply them in BOTH places that set event times: the quote builder AND `EditProjectDetailsDialog` (sibling doors). Also any other screen that sets start/end; grep for it.
     - **Duration > threshold:** `משך ארוך מהרגיל — כדאי לוודא את השעות`.
       - **The threshold is a system parameter, default 10 hours** (Ishay 14.10 ~13:0x: *"תגדיר 10 כברירת מחדל ואם ישלך כח להוסיף פרמטר בהגדרות"*).
       - Add it the way existing params are added: read how params are seeded, typed, categorised, bounded and shown in the settings screen (module 9, "ההגדרות שלי" / system params), and how screens read them. Follow the newest precedent, e.g. the numeric-ceilings params.
       - Name it in the existing naming style, e.g. `סף_אזהרת_משך_אירוע_שעות`, with a Hebrew label and description, and bounds 4–24 if the system supports bounds.
       - Write the seed as a NEW migration file in `supabase/migrations/` (insert only, idempotent with `on conflict do nothing`). Do NOT apply it; the deputy applies it.
       - **The UI must still work if the param is missing:** fall back to 10 in code, with a why-comment.
       - Wire the param through every screen that hosts this validation.
     - **Start == end (0 h):** `שעת הסיום זהה לשעת ההתחלה`.
     - **Cross-midnight** combined with a long duration: show both lines.
   - Put the pure helper in `src/lib/`, taking the threshold as an argument, with unit tests:
     - threshold exactly vs threshold + 1 minute;
     - 0 h;
     - cross-midnight 22:00→02:00 (4 h, notice only);
     - param missing ⇒ 10.

9. **Show each hostess's usual response time on the smart-match candidate row** (Ishay 14.10 ~13:1x asked for a per-hostess response-time KPI).
   - `medianResponseHours` is already computed per candidate (`src/lib/smartMatchCandidates.js:85,241`). It drives the "תענה הכי מהר" sort angle, but the number is never shown; the only use is `SmartMatchPage.jsx:224`.
   - Show one short secondary line on the candidate row, e.g. `עונה בדרך כלל תוך 6 שעות`.
   - Round sensibly: under 1 h ⇒ `תוך פחות משעה`, 1–48 h ⇒ hours, more ⇒ days.
   - When the value is null (too few answers), show nothing.
   - Viewer gate: the manager decides whom to invite when the event is close.
   - Add a test for the rounding helper.
   - NOT on the hostess profile card today; that is after the conference.

## Done means
- One test or more per fix.
- `npm run gate` passes with exit 0. Run it as `npm run gate > file 2>&1; echo exit=$?`, never piped.
- Vitest for `supabase/functions/payroll` passes.
- The Deno proof for fix 4 is pasted in your report.
- Report, short:
  - SHAs;
  - per fix, what changed and its test;
  - the gate exit code and test count;
  - every new visible string, verbatim;
  - anything you did not do, and why.
