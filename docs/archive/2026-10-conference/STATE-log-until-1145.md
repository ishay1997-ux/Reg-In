# Payroll build — LIVE STATE (deputy). Rewritten 14.10.2026 09:0x for a controlled compaction

**HEAD:** `ishay/payroll-end-to-end` @ `5feb4327`, pushed to origin. Worktree `C:\Users\ishay\Reg-In-payroll-wt`.
**Quota (08:47):** 5-hour window 13%, resets 10:30. Weekly 20%.
**Deputy context before compaction:** 77%.
**Nothing is applied live yet.** No migration, no edge deploy, no merge to dev/main.

## Read order after compaction (all in full)
1. This file.
2. `~/.claude/references/ishay-response-playbook.md`, the end section with tonight's rulings.
3. Plan: `~/.claude/plans/2026-10-13-payroll-end-to-end-md-vast-dusk.md`.
4. `contract-fixes.md` (F1–F14, R1–R3, leftovers sweep, viewer-purpose gate). Overrides the contract.
5. Contract: `Reg-In-payroll-wt/docs/specs/module_08_finance/payroll-contract.md`, with §7 and §9 for production.
6. The detailed log of the night: `STATE-log-until-0900.md`.

## Verified state at 09:00
- **Gate** on the integration HEAD: exit 0 (155 test files, 3,901 tests).
- **SQL (PGlite replica):** `node scripts/payroll-replica/run.mjs supabase/tests/payroll` passes 14/14; `…/payroll_review` passes 7/7.
- **Checker 1** (contract): 10 MUST, all resolved.
- **Checker 2** (money/logic and security): 8 MUST plus security items, all fixed.
- **Integration-shape check:** 8 mismatches, re-run 8/8 closed (09:00).
- **UI/UX review:** 18 fixes done.
- **Accepted debts (🚧):**
  - Concurrency was verified by design only (PGlite has one connection), so it is ◐.
  - The generic `send-email` `invoice`/`quote` types are unguarded; this existed before the build (F14.4).
  - A Projects-only manager cannot reach `/finance/payroll`.
  - Migration 17 (cutover) is blocked until after the conference.

## Owner rulings (verbatim in the playbook; do not re-ask)
- "Done" means in production and verified.
- July 2026 is the production proof.
- **September untouched** (conference 15/10).
- Mail goes only to ishay1997@gmail.com, and the redirect is invisible (F13).
- No mockups. Workers run Opus medium; light work runs Sonnet high.
- Minimal stops. The flow comes first; edge cases within reason.
- The hostess sees shifts and hours only.
- No ₪ totals in any screen. The XLSX has a date column and no total column.
- The follow-up table shows hours, with a calm status column.
- Correction is allowed to Finance through a case, hours only.
- The viewer-purpose gate runs before any screenshot reaches him.
- Quota: measure every 30 minutes and stop at about 90%. The cron at :17/:47 must be recreated after a session restart.

## NEXT STEPS (exact)
1. **Pre-conference refresh**, the STATUS blocker for 14/10: read `scripts/conference-refresh/refresh-before-conference.sql` in full, re-measure its `v_expected_*` gates (step ④ runs for the first time), and run it before the payroll migrations.
2. **Apply migrations live**, deputy only, through MCP `apply_migration`, in this order:
   1. 000100, 000200, 000300, 000400, 000500, 000600, 000650, 000700
   2. 000800: re-pull the live bodies of `generate_salary_report` and `finalize_salary_report` first and compare md5 with A's notes. Back up.
   3. 000900 (August repair): rerun W0-1 first (83/83 lines, each with exactly one match). Back up inside.
   4. 001000, 001100, 001200, 001300, 002000, 002100, 002110, 002120, 002130
   5. 003000 (enable) only at the start of acceptance.
   6. **NOT** 20261016000000 (cutover, after the conference).
   - For each: one chat line before; check ① after (live md5 = file; proacl has no anon except the two public RPCs).
3. **Deploy edge functions** through MCP `deploy_edge_function`: `send-email` after 000100 and 000300; `payroll` with the secret `PAYROLL_ALLOWED_ORIGINS` = the Vercel production URL plus `http://localhost:5173`. Check whether the secret can be set by MCP; otherwise ask Ishay for one hands step. Verify with `get_edge_function` against the repo.
4. **Merge** `ishay/payroll-end-to-end` → `dev` → `main` (deputy merge grant). Prove the Vercel production deployment for that SHA.
5. **Production acceptance on July** (contract §7 P1–P10 as amended by §9.2): distribute to 3 hostesses, approve 29 "לפי תיעוד" with reason "בדיקת קבלה", issue and send. All mail arrives at Ishay's inbox, looking real.
6. **Checker 3** (`/human-walkthrough` + DB read-back + opened XLSX + leftovers sweep + viewer-purpose gate), then **the UI/UX manager** on the live screens.
7. **Docs:** STATUS, CHANGELOG, LOG, §7.104–108 closed, `micro_guides/module-8.md`, CODE_MAP, 🚧 debts, the annotate list from checker 2 item 8.
8. **Report to Ishay:** what was built and why; how to check it in ≤3 steps; blind spots; R1 (25 cross-midnight compensation rows now positive). Then ask "יש משהו נוסף".

## Agent ids (resume with SendMessage if needed; they keep their context)
| Role | Id |
|---|---|
| A | `abaf5b9b5beaff633` |
| B | `a5997f7f0c60f7076` |
| C | `acd6d18be2eafaba9` |
| D | `acf4e5e0adf6ef34c` |
| UI/UX manager | `a8208cbfa8d1af671` |
| Checker 2 money/logic | `aa085fd9f295c4a01` |
| Checker 2 security | `a5ba543ea23fa44c9` |

## LIVE PROGRESS 14.10 (deputy, after compaction)
- 09:2x Ishay: refresh step ① ran (32 open quotes, gate re-measured 33→32, commit 141f4016). **Step ④ NOT run — Ishay: "לדעתי אל תריץ בא נסיים מה שהתחלתנו"**. Consequence told: Sept pending-closure shifts stay out of the Sept demo report; ④ can still run later (guard only freezes claimed rows).
- Ishay approved Gmail read: "כן כנס למייל שלי אני מאשר" — read-only, only system payroll mails by subject.
- Ishay insight (09:2x): "אם היית שואל את עצמך מה המטרה של המסך הזה" → viewer gate question 0 = screen purpose (sent to UI/UX).
- Quota reset is 13:30 Israel (resetsAt 10:30Z) — the "10:30" above was UTC.
- D finished (0301698f final download, 1636d7f9 F15); merged → integration 61981891, gate 0 (3,904), SQL 14/14 + 7/7, pushed.
- UI/UX plan approved with changes; LOCAL phase running (a8208cbfa8d1af671); prod phase waits for my go-prod; hard stops before P4 and P8.
- LIVE applied + check ① (md5 = file, no anon): 000100 ✓ 000200 ✓ 000300 ✓ 000400 ✓ 000500 ✓ 000600 ✓ 000650 ✓ 000700 ✓ 000800 ✓ (backup seed_snapshot.payroll_legacy_functions_20261014; live legacy md5 matched d8d58ba0/8af8f09f) 000900 ✓ (W0-1 83/83, 83 claims, backup 83 rows, Sept claimed 0). Probe: Oct legacy → MONTH_NOT_ENDED, Aug → PERIOD_EXISTS.
- send-email deployed v8 (live v7 matched main e67494b0 before).
