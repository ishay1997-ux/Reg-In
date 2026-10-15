# Payroll build — live state (deputy). Updated 14.10.2026 00:40

**Read order on resume:**
1. This file.
2. Plan: `C:\Users\ishay\.claude\plans\2026-10-13-payroll-end-to-end-md-vast-dusk.md`.
3. Contract: `C:\Users\ishay\Reg-In-payroll-wt\docs\specs\module_08_finance\payroll-contract.md`, §9 first.
4. `contract-fixes.md` here (F1–F13, R1–R3, leftovers sweep, viewer-purpose gate). It overrides the contract.
5. `briefs.md`, `ux-guide.md`, `checker1-contract.md`, `report-a.md`, `report-b.md`, `report-c.md`.

## Quota (measured 00:37)
- 5-hour window 92%, resets 03:30. Weekly 10%.
- Deputy context 65% (652K).
- A cron fires at 03:33 to resume.

## Branches and worktrees (all local, nothing pushed, nothing applied live)
| Item | Worktree | Branch | State |
|---|---|---|---|
| Integration | `Reg-In-payroll-wt` | `ishay/payroll-end-to-end` | contract `8b3f967f`, plus STATUS line `dff82362` (base `ishay/conference-follow-up` f38887eb) |
| A (DB core) | `Reg-In-payroll-a` | `ishay/payroll-a` | DONE `79622f2d`. Gate 0; 128 SQL tests on PGlite (`node scripts/payroll-replica/run.mjs supabase/tests/payroll`) |
| B (review loop) | `Reg-In-payroll-b` | `ishay/payroll-b` | DONE `4f4c05cf` (merged A). 74 SQL + 50 vitest. Gate fails only on knip (A's pglite devDep; recheck after integration). Screenshots `payroll-work/screens-b/` |
| C (edge, XLSX, mail) | `Reg-In-payroll-c` | `ishay/payroll-c` | `167d7607` done. Resumed for F12 (XLSX columns) and F13 (invisible redirect); paused 00:38 — report pending |
| D (finance UI) | `Reg-In-payroll-d` | `ishay/payroll-d` | still building; paused 00:38 — report pending |

## Agent ids (resume with SendMessage)
- A `abaf5b9b5beaff633` (done)
- B `a5997f7f0c60f7076` (done)
- C `acd6d18be2eafaba9`
- D `acf4e5e0adf6ef34c`
- UI/UX manager `a8208cbfa8d1af671`: waits for the screens review and the viewer-purpose gate
- Checker 1 `accb51317484dc360` (done)

## Owner rulings this session (verbatim in playbook and contract-fixes)
- "Done" means in production and verified.
- July 2026 is the production proof.
- September untouched (conference 15/10).
- Mail only to ishay1997@gmail.com, and the redirect is invisible (F13).
- No mockups.
- Opus medium for workers.
- Minimal stops.
- Academic project: the flow comes first, edge cases within reason.
- The hostess sees shifts and hours only (F11).
- No ₪ totals in any screen.
- The XLSX has no total column and gains a date column (F12).
- The follow-up table shows hours.
- Calmer status column.
- Correction allowed to finance through a case (F5b).
- Viewer-purpose gate before any screenshot reaches him.

## Next steps (in order)
1. **03:30:** resume C and D. Each finishes and reports.
2. **Integration** in `Reg-In-payroll-wt`: merge a, b, c, d; resolve conflicts; run `npm run gate` and all PGlite SQL tests.
3. **UI/UX manager** runs the screens review and the viewer-purpose gate on D's and B's screens, which need fresh screenshots of the integrated build. Only then does anything visual go to Ishay.
4. **Checker 2:** two agents (money/logic with `/quality-audit`; security with `/security-review`) plus the leftovers sweep and test-coverage check. Then a fix round.
5. **14.10 morning:** run `scripts/conference-refresh/refresh-before-conference.sql` (the STATUS 14/10 blocker) **before** the payroll migrations.
6. **Production:**
   - Apply migrations in contract order (1–6, 6b, 7, 8, 9, 10–13, 14–15; 16 at acceptance; 17 is blocked until after the conference).
   - Each with a chat line before, a backup for 8 and 9, and check ① after (md5 + proacl).
   - Re-pull the live bodies of generate and finalize before 8; rerun W0-1 before 9.
   - Deploy `send-email` after migrations 1 and 3. Deploy `payroll` with the secret `PAYROLL_ALLOWED_ORIGINS`.
   - Merge to dev, then main; prove the Vercel deployment.
7. **Acceptance P1–P10 on July** (contract §7 as amended by §9.2: distribute to 3, approve 29 by documentation). Then Checker 3 (`/human-walkthrough` + DB read-back + XLSX).
8. **Docs:** STATUS, CHANGELOG, LOG, §7.104–108 closed, `module-8.md`, CODE_MAP, 🚧 debts (invoice branch unguarded; projects-only manager cannot reach the page; concurrency ◐; migration 17 after the conference).
9. **Report to Ishay**, including R1: 25 cross-midnight compensation rows now positive.

## Update 00:45
- C paused at `d48db872`. F12 and F13 are done on its side; the full gate after F13 has not run yet. **C's next step:** run the gate, merge D's F12 commit, run the parity tests.
- **Cross-builder gap, assigned to A at 03:30:** `payroll_operation_snapshot` (migration 15) must return `event_date` (DD/MM/YYYY-ready ISO date) per line. F12 needs it, and without it C blocks every final issue. Resume A (`abaf5b9b5beaff633`) with that one item plus a test.
- D paused at `2c0c14b2`, with a clean tree. Gate 0 before its last commit. Done: F5b, F6, F11, F12 (salaryReport.js `f1e64b42`), F13, the calm table, and a first pass of the viewer-purpose gate. **D's next step:** final screenshots at 1280 and 1024, the second pass of the viewer-purpose gate, and the report with its coverage table. D does not write a report file (subagents can't) — it returns the report as text and the deputy saves it.
- **At 03:30, in order:** (1) A: `event_date` in the snapshot. (2) C: gate, then merge `ishay/payroll-d` and run parity against `f1e64b42`. (3) D: screenshots and report. In parallel, the deputy starts integration once A and C are done.
- **At 03:30 first, in parallel with A, C and D (owner, 00:45):** resume the UI/UX manager (`a8208cbfa8d1af671`). It runs the screens review plus the viewer-purpose gate on D's committed code (`ishay/payroll-d` `2c0c14b2`) and B's (`4f4c05cf`), with fresh screenshots from a local Vite dev server using the mock fixtures (never the live DB). Findings go straight to D as a fix list, so D fixes them in the same round.
- 03:5x A done `5cee8f07`: new migration `20261014002110_module8_payroll_snapshot_event_date.sql` (after 15) adds event_date+assignment_number to snapshot lines; gate 0; 131 SQL tests.
- 04:1x integration (a+b+c, incl d@2c0c14b2) merged on ishay/payroll-end-to-end dedff2f6: gate 0, SQL A 12/12, SQL B 7/7.
- 04:2x B UX fixes done c8a4aa5c (tip 5c677589), gate 0, SQL 19/19.
- 05:1x A checker-2 fixes 8353e7b0 (migration 002120), gate 0, SQL 13/13. NOTE: after August repair, seed restore always blocked (by design).
- 05:2x C fixes db72a160 (webhook URL sanitize, resume newest attempt test, README F13), gate 0.
- 05:3x B fixes c24a5bf2 (last_case shown, finance-only hours-only, recipient recompute, accept_corrected removed), gate 0, SQL 19/19. Migrations 11-13 edited in place (never applied) — integration must re-merge B.
- 04:4x integration round 2 (a+b+c+d all fix rounds) + plain lazy import fix: gate 0 (155 files, 3894 tests), SQL A 13/13, SQL B 7/7. Integration-shape checker running (a6a8991ac4edeb463). Pace: 76% at 04:41, no new dispatch until 08:30 reset.

## 04:56 — integration-shape check (report: payroll-work/integration-check-1.md) → fix round queued for 08:30
- **MUST (D):**
  1. `payroll_review_find` param `p_original` → `p_original_report_id`.
  2. retry_accountant must send the current accountant param (needs A).
  3. resend/retry success toast only when `attempt.state==='sent'`; otherwise show the real state.
  4. CasePanel reads `current_rows[].actual_hours`.
- **MUST (A):** `payroll_report_detail` and `payroll_operation_status` return the current accountant recipient (`accountant_recipient_current`).
- **Optional (D, do it):**
  5. `STORAGE_FAILURES` codes are `STORAGE_UPLOAD_FAILED` / `XLSX_BUILD_FAILED`.
  6. Wording for every code, falling back to C's Hebrew `message`.
  7. CorrectionForm blocks compensation rows (A adds `line_basis` to `current_rows`, or D derives it).
  8. `needsReconstruction` and the fixtures match the real detail shape (`artifact_available`, `line_count` location, `affected_rows` objects).
- **Then:**
  - rerun the integration-shape probe script (`scratchpad/probe.mjs`) via one checker;
  - re-merge into integration; run the gate and SQL;
  - then the controlled compaction with Ishay;
  - then production.
- Pace ruling 04:41: no new dispatch until 08:30 (80% at 04:55).
- 08:4x A 7566fd0f migration 002130 (accountant_recipient_current; case current_rows.line_basis — rewrites B's payroll_review_case_detail; must apply after B's 11). gate 0, SQL 14/14.
