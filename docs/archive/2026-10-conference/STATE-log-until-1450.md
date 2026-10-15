# Payroll build — LIVE STATE (deputy). Rewritten 14.10.2026 ~11:45 for controlled compaction #2

**HEAD:** `ishay/payroll-end-to-end` @ `28426c1f`, pushed. Worktree `C:\Users\ishay\Reg-In-payroll-wt`. origin/main (PR #180, #182) already merged in (f5acf53c).
**Gate on f5acf53c:** 0 (3,920 tests) · SQL 14/14 + 7/7. After it: only 28426c1f (payroll origins default; vitest payroll 222/222, deno check OK with `--node-modules-dir=none` from the function dir).
**Quota (11:4x):** 5-hour window ~50%, resets **13:30 Israel** (resetsAt 10:30Z). Weekly ~25%. Cron e8f1d819 :17/:47 (88% stop) — recreate if session restarted.
**Deputy context before compaction:** ~68%.

## Read order after compaction (all in full)
0. 🔴 Before ANY talk about the conference demo: `docs/plans/conference-readiness-and-follow-up.md` (main) — one 12-step chain starting from a NEW quote; payroll is one link (Ishay 14.10 11:1x: "ממש לא. אנחנו מתחילים בהצעת מחיר חדשה"). Old 8-station script `docs/guides/conference-demo-script.md` has no payroll.
1. This file. 2. `STATE-log-until-1145.md` (this morning's detailed log, incl. LIVE PROGRESS). 3. playbook end section (`~/.claude/references/ishay-response-playbook.md`, last ~10 entries). 4. `contract-fixes.md` (F1–F15). 5. Contract §7 + §9 (`Reg-In-payroll-wt/docs/specs/module_08_finance/payroll-contract.md` lines 560–679).

## LIVE now (verified)
- **All 19 payroll migrations applied** (000100…002130; 001100 in 3 parts, 002100 in 2 parts). Check ①: 75/75 function bodies md5 = files (aggregate 67dd0924…); anon EXECUTE only on payroll_review_public_get/respond. NOT applied: 003000 (enable — at acceptance start), 20261016000000 (cutover — after conference).
- August repair: 83 claims on report 15, backup seed_snapshot.assignments_payroll_claim_20261014. Legacy fn backup seed_snapshot.payroll_legacy_functions_20261014.
- Legacy probes: Oct → MONTH_NOT_ENDED, Aug → PERIOD_EXISTS.
- send-email deployed v8 (guard + legacy refusal + sanitize).
- Conference refresh: step ① ran (32 open quotes; gate 33→32 commit 141f4016). **Step ④ ran 11:4x** (Ishay asked Sept to look normal): 15 projects closed, 76 rows; backups seed_snapshot.*_close_20261014; Sept now 152/152 closed, 40 hostesses, 0 claimed.
- payroll edge function: **NOT deployed yet** (next step).

## Ishay rulings this session (new since 09:00; verbatim in playbook where noted)
- Refresh: first "לדעתי אל תריץ בא נסיים מה שהתחלתנו", then asked months to look normal ⇒ ④ ran for Sept.
- Data: "לא נורא אם יש 8 משמרות לדיילת זה גם הגיוני" ⇒ no rebalancing (Jun 44 hostesses max 7; Jul 32/5; Aug 34/5 issued; Sep 40/8). "כל החודשים" question open — my rec: not before the conference (M11 stories quote numbers).
- Gmail: "כן כנס למייל שלי אני מאשר" — read-only, payroll mails by subject only.
- Viewer gate question 0 = screen purpose (his insight 09:2x).
- "שלח סוכן שיעשה מה אתה מפיל עלי עבודה" ⇒ no hands steps: origins allowlist defaulted in code (28426c1f). Record in playbook.
- Control band: keep step names STABLE across reports (it flags renamed steps as removed).

## Agents
- UI/UX manager `a8208cbfa8d1af671`: local phase DONE (3 MUST + 6 SHOULD → fixed by D 838f3ab0). Waiting for my **go-prod**. Its prod run = acceptance P1–P10 (contract §7 + §9.2: 3 personal links, 29 "אשר לפי תיעוד" reason exactly `בדיקת קבלה`). Hard stops before P4 (first mail) and P8 (הפק ושלח). User E2E_FINANCE_* via Playwright from .env.local. Gmail read allowed (tell it). P7 note: deadline ≥5 min ahead, then wait; no-mail recipients need contact note.
- D `acf4e5e0adf6ef34c` done (838f3ab0). A/B/C done.


## LIVE PROGRESS after compaction #2 (14.10, real Israel clock; earlier "11:4x" stamps in this file were off by ~+2h)
- 10:0x payroll edge fn deployed v1 (ezbr 53adc7e6…); byte-identical 9/9 (agent, script extraction + my cmp). Probes: no auth 401, anon 401 PERMISSION_DENIED, OPTIONS 200.
- Gate r6 on 28426c1f: exit 0, 3,922 tests (1 pre-existing lint warning UsersManagementPage).
- Merged: PR #184 → dev (5a78f30b), PR #185 → main (315cf170). Vercel production success; live /payroll-review bad token → expired text; /finance/payroll → login.
- 003000 applied: final_issue_enabled=true, review_mail_enabled=true (legacy_writer enabled).
- go-prod sent to UI/UX a8208cbfa8d1af671 (P1–P3 now, hard stops before P4 and P8).
- 10:3x UI/UX P1–P3 PASS; P4: July review 1 created, 3 mails sent (redirected), deadline 10:36.
- Polish (D, 726d32eb): file-row tiles, open-month first, no invented hour. Gate 0 (3,930). PR #186 → dev, #187 → main @ 89974235, Vercel success.
- Ishay 10:5x: "והכל תעשה לפי המלצתך" ⇒ (a) accountant param changed ishay1997@gmail.com → office@levi-cpa.co.il (old value recorded here; revert = same update reversed); (b) "כל החודשים" closed = NOT before conference.
- His question "טופל מחוץ לדוח — להוסיף שעות לחודש הבא?" answered: system = supplement for original month; issued-line adjustment not supported → 🚧 debt candidate (post-issue hours adjustment via supplement line).
- 10:4x P8 PASS: July report 16, 75 lines/claims, total 22,578.00 = sum, sha cfbebb92, sent (redirected); 1 operation. P9/P10 cheap probes pass; storage upsert/remove + role matrix NOT run (quota) → Checker 3.
- 10:5x Ishay saw old dialog on Sept ("מזה??? צריך למחוק") ⇒ cutover 20261016000000 APPLIED NOW (legacy_writer=disabled) — his ruling overrides "after conference". D removing old dialog UI on ishay/payroll-legacy-removal.
- Ishay asked if per-shift XLSX is standard: decided keep per-shift rows + add sheet 2 "סיכום לפי דיילת" (law: daily records, overtime per day; payslip needs per-employee totals). D after 13:30 with: mail clickable link, follow-up copy for never-sent, 2nd tab after issue.
- 11:2x Legacy dialog removed: D 68cc4e20, my gate exit 0 (3,865); PR #188 → dev, #189 → main @ bffdfae3, Vercel success. TODO docs: src/modules/08_finance/CLAUDE.md lines 35, 64 still name the dialog.
- After-13:30 fix list for D (one batch): (1) mail clickable link (mail.ts + parity → redeploy payroll); (2) follow-up wording for never-sent + "last action"; (3) 2nd tab after issue → reload, stop polling; (4) XLSX sheet 2 "סיכום לפי דיילת" in both builders + parity; (5) draft screen toggle showing sheet 2 too (Ishay 11:2x asked; F15 mirror); (6) zero-rows line explains why: "N לא הגיעו · M ביטול בלי דמי ביטול" (Sept: 20 no_show + 1 comp 0).
- 11:1x Refresh script remaining steps measured read-only: ② open 32 / expiring 0 ✅ · ③ 20 events in 15/10–15/11, 2 short ✅ · ⑤ last event 24/01/2027, 20 beyond 15/11 ✅ · ⑥ 8 coherence tests (docs/specs/module_11_reports/seed-coherence-tests.md) NOT run yet → after 13:30 (July report 16 + Sept closures changed numbers).
- 12:0x Demo session "תכנון הדגמת הכנס" (local_fdcffc5c…): Ishay approved route. Stage 15.10 09:00. Deputy commitments: (1) apply its data script from payroll-work/demo-data/ after 13:30 (REH+STAGE projects, 4 hostesses → ishay1997+tag, OpenU contact 321 + 1605 contact → ishay+tags; restore after 15.10); (2) payroll fixes live ~16:00 → message it main SHA; (3) Sept payroll review round ~17:00 via UI (deadline 15.10 08:30; corrected case tonight; 2 non-responders left for on-stage bulk approve) — needs Ishay "מאשר" in that session; (4) fresh UI/UX agent (role skill) for the rehearsal, bounded brief (route screens, 4 lenses, ≤10 findings), CEO creds E2E_CEO_*.
- 13:0x Ishay: validation everywhere ("זה חשוב לי") ⇒ at 13:33 ALSO dispatch read-only audit (Sonnet high) with card payroll-work/card-validation-audit.md; then today-batch (rank 1–2, size S, client/copy) to a builder, rest = 🚧 after conference. Builder card-prefinal now has #8: cross-midnight + soft time checks in quote builder AND project dialog, threshold = new param (default 10h, migration file by builder, deputy applies).
- 13:2x Ishay: customer surfaces — missing customer_type, "מה משמח" unprofessional, manager can't see what to improve ⇒ at 13:33 dispatch Opus-medium agent with card payroll-work/card-customer-reports.md (phase 1 investigate+stop; phase 2 on deputy go). Tell demo session (these may be its 2 M11 surfaces). Builder prefinal now has #9: response-time line on smart-match rows.
- 13:3x Ishay presents M11 surfaces "הנהלה — מבט על" + "הצעות שנסגרו" (verbatim: "אצתרך לדעת היטב כל דבר... שהמסך ישרת את מטרתו"). Demo session writes per-element explainer for him; fresh UI/UX rehearsal agent gets a deep purpose-fit lens on these two; coherence ⑥ checks their numbers. Customer-reports card = LOWER priority (not on route): phase 1 still runs, today only copy.
- Demo session: reports explainer done → payroll-work/demo-reports-explainer.md (מ2 מבט-על, מ3 סגירת הצעות; measured live). Feed to UI/UX rehearsal lens: מ2 top-8 table adds little; מ3 dense (4 tiles, 2 charts, table); v_today moves מ2 margin; stage+REH quotes move מ3 close rate ~0.1.
- 12:5x Ishay ruling (reports): wording is THE priority ("זה הדבר שאני הכי מקבל עליו הערות"); NO change to reports without his approval unless obviously what he wants ⇒ UI/UX rehearsal lens on מ2/מ3 = copy-first (ui-copy-and-onboarding-levels), output = before→after verbatim list for Ishay; deputy brings them to him, builds only approved.
- REH2 script ready: demo-data/demo-data-REH2-20261015.sql (1650 required 1→2 + approx lat/lng; contacts 234, 221 → +tags). Apply ONLY after the UI/UX rehearsal agent cancels 1648 (GATE0 enforces). Then message demo session "applied + agent done". Plan file: payroll-work/PLAN-14-15.md (shared).
- 🔴 FREEZE 19:45–21:00 (general rehearsal Ishay+Amit 20:00 on REH2). Before 19:30: REH2 applied + September round open. Any later fix waits until 21:00.
- 🔴 Rehearsal agent brief: in smart-match select the 4 demo hostesses BY NAME (נועה שגיא, דנה לוין, נטע הרוש, שלי אלקיים) — never "top N": customer_hostess_preference pins real-looking gmail hostesses to the top (1648: 505, 492 · 1638: 380, 435, 532 · 1650: 467, 496). Ishay may want "top 4" on stage → demo session asks him; possible data change on 1638 via deputy.
- Ishay "בסדר": stage = select 4 by name, no pin data change. Owe demo session a "READY for general rehearsal" message (target before 19:00): REH2 applied (after 1648 cancel) + Sept round open + rehearsal findings in hand + fix-today deployed.
- 13:3x Quota reset 0%. demo-data-20261015.sql APPLIED (gates pass; 1638/1648 stay in_progress; proof sent to demo session). Dispatched (bg): Builder A a09adb9c9d473c826 (opus, card-prefinal, branch ishay/payroll-prefinal in Reg-In-payroll-d) · Audit V a6c7bcc969f468c48 (sonnet) · Coherence C a045674912b88a094 (sonnet, read-only) · Agent K a8ff442453f283c5a (opus, phase 1 only).
- 13:4x Coherence ⑥ (16 tests): 12 pass, 3 fail (מ8 by design — payroll keeps zero no-show lines, omitted from file, claimed → update test doc in docs step; מ5 seed not monotone → no stage claim; מ16 reused notes in reports 17/20 → after conference), 1 partial (מ7: 304→314). Sent to demo session. 🚧 docs: update seed-coherence-tests.md מ8 definition.
- 13:5x Ishay: "אני מאשר הכל ואם יש זמן אולי תכניס את מה שדחית" + "מאשר הכל לפי המלצתך". Corrections: no duplicate-product warning (row 3); discount soft warning >30% as param סף_אזהרת_הנחה_אחוז. UAT customers renamed LIVE (492→אופק מערכות מידע, 493→נתיב לוגיסטיקה; backup seed_snapshot.customers_uat_rename_20261015). Dispatched Builder B a1b9641fa75cdb870 (opus, card-validations-B.md, worktree Reg-In-payroll-e, branch ishay/validations). Agent K resumed phase 2 (worktree Reg-In-payroll-f, branch ishay/reports-polish; NO customer-type filter today). Builder A asked to add audit rows 17,18. Quota 13% @13:52 (pace ~40%/h with 4 agents) · deputy context 66% → controlled compaction likely ~16:00–17:00, before freeze.
- NEXT: answer its P4/P8 stops after checking state → Checker 3 → docs → report. Cutover (20261016000000) after conference = step "סגירת המסלול הישן".

## NEXT STEPS (exact)
1. **Deploy payroll edge function** via MCP deploy_edge_function, name `payroll`, verify_jwt true, files from `supabase/functions/payroll/`: index.ts, pipeline.ts, document.ts, mail.ts, guard.ts, dates.ts, money.ts, transport.ts, xlsx.ts (no tests/README). Then get_edge_function compare. No secret needed (defaults in code).
2. **Merge** integration → dev → main (deputy grant; "ממזג עכשיו" line). Prove Vercel production deployment for that SHA (gh api deployments) and smoke reg-in-umber.vercel.app/finance/payroll loads.
3. **Apply 003000** (enable) with a chat line + check.
4. **go-prod** to UI/UX manager (SendMessage) with: deployed SHA, Gmail allowed (read-only, subjects only), stop points. Approve its P4 and P8 stops after checking state.
5. **Checker 3** (`/human-walkthrough` + DB read-back + XLSX opened + leftovers sweep + viewer gate) on production.
6. **Docs**: STATUS, CHANGELOG, LOG, §7.104–108 closed, module-8.md, CODE_MAP, 🚧 debts (concurrency ◐; invoice/quote send-email unguarded F14.4; projects-only manager no payroll page; cutover after conference; restore script always blocked after Aug repair; date-as-text in XLSX), annotate overridden contract text.
7. **Report to Ishay** incl. R1 (25 cross-midnight compensation rows now positive), Sept ready for live issue, "יש משהו נוסף".
