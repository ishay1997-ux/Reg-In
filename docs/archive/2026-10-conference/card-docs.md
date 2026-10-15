# Card: documentation sync for today's releases (14.10.2026), dispatched by the deputy

Your role is **builder (docs)**. You write documentation only: no code, no DB writes (SELECT only), no push or merge.

- **Worktree:** `C:\Users\ishay\Reg-In-payroll-e`. Create the branch `ishay/docs-14-10` from `origin/main` (4c5e223e).
- Commit by explicit pathspec.

## Read first, in full
1. `docs/CLAUDE.md`: the documentation and ripple protocol (§4). Follow it.
2. `C:\Users\ishay\payroll-work\STATE.md`: today's log. It is the source for what happened.
3. The top of `STATUS.md` and of `CHANGELOG.md`, for their exact formats.

## Releases to record, from git; verify each SHA with `git log`
| PR | What | main SHA |
|---|---|---|
| #188/#189 | old payroll dialog removed | (see git) |
| #190/#191 | Builder A: payroll pre-final fixes, event-duration notice + param | 85b0df7e |
| #192/#193 | reports polish: מ2/מ3/מ19/מ20 | 0dada211 |
| #194/#195 | input validations + tier price by total product quantity | 83d34eaa |
| #196/#197 | stage copy: 8 report strings, hostess no-show line, feminine leftovers | 4c5e223e |

Also record:
- the edge function `payroll` v2;
- the migrations applied live today: `20261016000000` cutover, `20261016000100`, `20261016000200`, `20261014150000/151000/152000`, `20261014170000`;
- the params added: `סף_אזהרת_משך_אירוע_שעות` = 10 and `סף_אזהרת_הנחה_אחוז` = 30, so params now total 50;
- the invite template text change (a data change, with a backup table).

## Files to update
1. `STATUS.md`: a new top entry for 14.10 with the state as of now. September review #2 is open, deadline 15.10 08:30, NOT issued; it is issued on stage 15.10.
2. `CHANGELOG.md`: one entry per release above.
3. `CLAUDE_CODE_LOG.md`: one short entry. Do not expand it; it is already over its size target.
4. `docs/schema.sql` and `docs/db_roadmap.md`: the two new params, and the report-function changes (same signatures, text and fields only). Check against the live DB by SELECT.
5. `src/modules/08_finance/CLAUDE.md` lines ~35 and ~64. They still describe the old payroll dialog, which is removed (cutover). Fix them to the new flow.
6. `docs/specs/module_11_reports/seed-coherence-tests.md`, test מ8. Add a note: payroll keeps zero-hour no-show lines by design, so מ8 counts them.
7. The module-8 micro-guide (`docs/micro_guides/module-8.md` or wherever it lives; find it with Glob) and `docs/CODE_MAP.md`. Add the new files today:
   - `src/components/EventTimeNotices.jsx`
   - `src/lib/eventTimeChecks.js`
   - `src/modules/08_finance/payroll/BulkNoResponse.jsx`
   - any validation helpers Builder B added (use `git log --stat 85b0df7e..4c5e223e`)
8. §7.104–108 in `docs/PROJECT_MASTER_sec7.md`: mark them closed, with the release SHAs, **only if** that file exists on main. If it does not, report it.
9. A 🚧 debts list. Put it where the docs protocol says debts live, and if unclear, in STATUS. Copy it from `STATE.md` NEXT STEPS step 10 plus the "Debts" lines in the 16:5x section.

## Done means
- `npm run gate > C:\Users\ishay\payroll-work\gate-docs.log 2>&1; echo exit=$?` gives exit 0. Run `check:docs-structure` too; it is part of the gate.
- Report: the SHAs, the files changed, and anything not done and why.
- Finish by **19:00**. The deputy merges before the 19:45 freeze.
