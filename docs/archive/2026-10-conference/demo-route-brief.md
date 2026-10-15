# Brief — a thinking partner for the 10-minute REG-IN conference demo (15.10.2026)

Written by the REG-IN deputy session, 14.10.2026 ~11:20. You are a NEW session. Ishay asked for you in these words:
*"אני צריך עובד בשיחה חדשה שישב איתי ויחשוב איתי בדיוק מה המסלול שיהיה סיפור ברור והכל יכנס ב10 דקות"*

## Your role
Ishay, 14.10 ~11:25: *"גם שיעזור בחשיבה וגם יכין אותי לכנס וגם יסדר ויכין כל מה שצריך מבחינת נתונים ודברים שהכל יהיה מוכן מחר"*

Three jobs, in this order:
1. **Think with him.** Agree on ONE live demo route: a clear story that fits in 10 minutes.
2. **Prepare him.** Hold a rehearsal with a stopwatch. Give him the sentence for each step, answers to likely questions from the judges, and a backup for each live service.
3. **Prepare everything so it is ready tomorrow:**
   - the data each step needs: a client or quote to start from, a project that can become "ready", the payroll prep;
   - the logins;
   - the backups: PDF, screenshots, recording.

**Live writes are gated.** The live DB `yfeovxppnfoafmfbdfvh` serves the real site.
- **SELECT-only reads** are free. Use them to check what each screen will show tomorrow.
- **Data the demo needs** (closing a project, seeding a client or project, hours):
  - Write it as a script file in `C:\Users\ishay\payroll-work\demo-data\`.
  - Include a backup `seed_snapshot.*` table, a before/after count gate, and the reverse step.
  - Send it to the deputy session, which reviews and applies it. Root `CLAUDE.md` §2.4: only the deputy applies DB changes without a per-change approval.
- **Actions through the live site UI that write or send** (a test quote send, the payroll prep tomorrow morning):
  - First, one line in chat to Ishay: what, why, and what it touches.
  - Then act only on his explicit "אשר" in your chat.
- **You do not change code or settings, merge, or deploy.** Code fixes go to the deputy as a short message with the exact problem.
- **Your deliverable** is a file, `C:\Users\ishay\payroll-work\demo-route-15-10.md`. The deputy session moves it into the repo later. It holds:
  - a minute-by-minute table: presenter · screen URL · what is clicked · the one sentence said · the "wow" · the risk and the backup if a live service fails;
  - a "prep before going on stage" checklist with an owner and a time per item;
  - the open questions left.
- **Language:** Hebrew to Ishay, plain words, one question at a time, each with your recommendation (his rules are in `C:\Users\ishay\.claude\CLAUDE.md`).
- **Before writing ANY step,** ask yourself the screen-purpose question (what is this screen for, what does the audience take from it). Ishay's own insight, 14.10.

## Ishay's split of the presentation (verbatim, 14.10 ~11:20)
> בהצגת המערכת:
> עמית - לקוחות, הצעות מחיר, פרויקטים
> ישי - שיבוץ דיילות (פרויקט חדש + מוכן), כספים, דוחות, ניהול מערכת (בדגש על מחירים ופרפמטרים)
> עמית - מסך הבית כמה שניות

🔴 **His split wins** over the older split in the readiness plan. C01 there says "Amit 1–4, Ishay 5–12".

**The reports part, his words (14.10 ~11:25):** *"בדוחות אני חשבתי להראות את דוח השכר ו 2 משטחים בדוחות הנהלה"*.
- This means the payroll report plus 2 management-report surfaces (`/reports`, module 11).
- Help him choose the 2 by story value.

**There is no detailed 12-step list in the repo.** Only C01 mentions "12 steps", so build the list with him.

He also said the demo **starts from a NEW quote** (14.10 11:1x: *"אנחנו מתחילים בהצעת מחיר חדשה"*).

## Read first, in full, before your first question to him
1. `C:\Users\ishay\Reg-In\docs\plans\conference-readiness-and-follow-up.md`. It describes the chain (client → quote → project → staffing → hostess approval → readiness → closing → finance → report), a budget of about 9 minutes of demo plus 1 minute of transitions, and checks C01–C09. Use the copy on `origin/main` if the local file differs: `git -C C:\Users\ishay\Reg-In show origin/main:docs/plans/conference-readiness-and-follow-up.md`.
2. `docs/guides/conference-demo-script.md` (origin/main). This is the OLD 8-station route from 24.09. Take its traps, still valid unless re-measured:
   - quote "שלח" sends a REAL email through Make/Gmail;
   - projects 1620/1615 are frozen until the conference, so no staffing or invites to them;
   - do not scroll the quotes list on stage, because some open quotes are for past events;
   - log in before going on stage.
   Its numbers are from 24–25.09 and are stale.
3. `C:\Users\ishay\payroll-work\STATE.md`, only to know what the payroll link can show. Ask the deputy if unclear.

## Facts about payroll the route can rely on (measured by the deputy, 14.10 morning)
- The new payroll page `/finance/payroll` is live. The flow is:
  - draft, which is a one-to-one preview of the accountant file;
  - personal summary mail to each hostess, with a link to a page showing shifts and hours only, no money;
  - hostess approves or reports an error;
  - manager handles cases, can correct hours, and does "אשר לפי תיעוד" for non-responders after the deadline;
  - "הפק ושלח לרואה החשבון";
  - history.
- The old payroll dialog is removed.
- **September 2026 is the month to issue live.**
  - It is ended, untouched, and has 40 hostesses.
  - 21 of its shifts have no pay and are not in the file: 20 with no hours (did not show up), and 1 cancellation with no compensation.
- July (report 16) and August (report 15) are already issued and appear in history.
- **Every payroll mail goes only to Ishay's inbox** (server guard, invisible on screens). The accountant shown on screen is `office@levi-cpa.co.il`.
- **A NEW quote/project created on stage is for a future date, so it never reaches payroll tomorrow.** The payroll link stands on its own: "September ended, here is its report".
- **Live-demo constraints in the code:**
  - "אשר לפי תיעוד" is allowed only after the response deadline.
  - Sending or re-sending a hostess link needs the deadline in the future.
  - A hostess can still answer after the deadline.
  - So the realistic stage version is: everything prepared the morning before; on stage, show the draft, one hostess approves live from Ishay's phone, then "הפק ושלח", then the accountant mail with the file.
- **⏳ Landing today after 13:30 and NOT live yet:**
  - sheet 2 "סיכום לפי דיילת" in the file, plus a draft toggle;
  - bulk "אשר לפי תיעוד";
  - a clickable link in the hostess mail;
  - clearer wording.
  Check `git log origin/main` or ask the deputy before building a step on them.

## Traps found by a fresh-eyes review (14.10, against origin/main @ bffdfae3)
- **Live AI calls.** The quote follow-up AI is ON (`src/lib/quoteFollowup.js:30` `FOLLOWUP_AI_AVAILABLE = true`).
  - It works only on a quote that was already sent; otherwise the answer is 409.
  - A call can take up to 90–160 s.
  - On 24.09 three calls took 1.9–3.7 s, but three earlier calls that day returned no draft.
  - The "הריצי שוב" re-run in the customer-notes report is also a live Gemini call.
  - Each of these needs a backup screenshot, or the step is skipped.
- **Quote mail is real mail.** The server recipient guard covers `salary_report` ONLY (`supabase/functions/send-email/index.ts:177`). A quote or hostess-invite mail goes to whatever address is typed or stored.
  - A new quote on stage must use Ishay's own address.
  - Check the client and contact you start from.
  - See also C03, and the send dialog's editable recipient in `docs/plans/2026-10-11-pre-conference-fixes-plan.md`.
- **New-project traps.**
  - The approve-quote → create-project success path has no end-to-end test (`docs/guides/conference-uat-script.md`).
  - Moving an event date in the UI resets final approvals and kills invite links (`STATUS.md` ~line 362).
  - The DB blocks one hostess on two events on the same day.
  - No prepared "new + ready" project exists, and 1620 is frozen.
- **Payroll mail goes through Make.** It has a 25 s timeout, and a send can end as "לא ידוע אם נשלח". The backup is the issued XLSX, already downloaded, plus a screenshot of the accountant mail.
- **The 14.10 data refresh already ran.**
  - Steps ① and ④ ran this morning.
  - Steps ②, ③ and ⑤ were re-measured at 11:1x and pass.
  - Step ⑥, the 8 coherence tests in `docs/specs/module_11_reports/seed-coherence-tests.md`, is run by the deputy after 13:30.
  - Any number from before today in the old script is stale. Re-measure it.
- **Other docs to skim:**
  - `docs/guides/conference-uat-script.md`;
  - `docs/guides/conference/`, the 28.08 script and `amit-prep-guide.html` (for Amit's part);
  - `docs/plans/2026-10-11-pre-conference-fixes-plan.md`;
  - `docs/plans/2026-10-13-payroll-end-to-end.md` §"Conference recommendation".

## How to work with him
1. Start with a short mirror: the story you propose in 5–6 lines, ending with "תקן אותי". Do it only after reading the files above.
2. Then agree segment by segment, in this order: Amit's part, Ishay's part, then the closing home-screen seconds.
   - Before you put a number on stage, measure what each screen will show tomorrow, by SELECT or by reading the code.
3. Keep a running time budget. Mark every step 📏 (measured), 💭 (assumed) or ⏳ (depends on today's fixes).
4. Payroll questions go to the deputy session, not to Ishay. Find it with ListAgents; it is the REG-IN deputy. Send only short, concrete questions.
5. End with the file written, and the open-questions list in chat.
