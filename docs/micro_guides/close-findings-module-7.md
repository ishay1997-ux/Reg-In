# Close findings — Module 7 (Home Dashboard)

> Working scratch file for the closing audit (module-close audit rule 5).
> RAW observations, appended at the moment of finding. No conclusions, no routing, no fixes here.
> Branch `ishay/module-7-dashboard`, worktree `.claude/worktrees/m7`, head at audit start: `1d10eca`.
> Audit started 03/09/2026 20:5X.

## State (for a session resuming from this file alone)
- **Scan: COMPLETE.** All audit sections ran 03/09/2026 20:5X–21:2X.
- **Verdict: [YES] — mergeable**, on branch head `1d10eca`. Awaiting Ishay's typed-echo sign-off (`מודול 7 DoD`).
- **§6 blockers: ZERO.** Nothing is broken today.
- **Fix round: NOT started, and not required** — the four findings are all latent (T-1…T-4), registered as `🚧 מ12 ← מ7` in `PROJECT_MASTER §6`. Two of them (T-1, T-2) were RECOMMENDED to Ishay as build-now-before-the-PR, ~10 lines each copying an existing pattern; **his ruling is pending.**
- **Regression run in this audit: YES.** `npm run gate` exit 0 (86 files / 2,264 tests). `dashboard`+`auth`+`smoke` E2E on a production build: 10 passed / 1 failed (module 2's seed-drift anchor). Full `test:e2e` deliberately NOT re-run — see F-e2e.
- **This file is deliberately NOT archived yet** (persistence step 6 would archive it on a clean YES): it is the context a fix session would need if Ishay rules "build T-1+T-2 now". Archive it to `docs/archive/` once he has ruled and the PR is open.
- Doc write-backs already persisted: micro-guide (status/QA-matrix/§9) · `PROJECT_MASTER §6` (measurement + new debt line + LOG-compaction number 1,582) · `db_roadmap §10ב` · `00_roadmap §3` · `CLAUDE_CODE_LOG` · `STATUS.md` · `claude_routines.md §2` (E2E coverage 20⇒24 files, growth trigger).

## Raw findings

### F-perf (item ① from Ishay's prompt) — get_dashboard_summary at seed scale: NOT slow
- Live row counts measured 03/09 20:5X: projects **832** (guide said 792 · originally 9), quotes 1,225,
  assignments 5,697, project_finance 745, seed_registry 2,250.
- `explain (analyze, buffers)` impersonated CEO (`set local request.jwt.claims`, in a rolled-back tx):
  - `get_dashboard_summary('2026-09-01')` cold ⇒ **139.470 ms**, shared hit=24,422.
  - `get_dashboard_summary('2025-12-01')` (the densest month, 44 events) warm ⇒ **39.467 ms**.
- The §9 prediction ("plausibly seconds at 900") did NOT materialise. Well under the ~1 s trigger.
- ⇒ no fix-forward migration needed on this ground. The `PROJECT_MASTER §6` scalability row needs its
  measurement updated (it currently carries only the 9-project 69 ms number).

### F-sec7 — §7 items 93–97 are still UNCOMMITTED; the §7.96 ↳ cannot be pasted from here
- This branch (`ishay/module-7-dashboard`): `grep -nE '^9[0-9]\. ' docs/PROJECT_MASTER_sec7.md` ⇒ **90, 91, 92 only**. Items 93–97 absent.
- Main checkout on `ishay/m7-blueprint-and-seed`: 93 · 94 · 95 · 96 · 97 present in the WORKING COPY (lines 348–356) but `git show HEAD:...` ⇒ only 3 matches (90/91/92). The file is `M` in that tree.
- ⇒ the micro-guide §9 condition ("once the seed session's diff is committed") is NOT met.
- 🔴 Rule 16 blocks fixing it from here: the seed session's files were written **20:39–20:42**, ~10 min before this audit started (`plan.mjs` 20:39, `STATUS.md` 20:42, `CLAUDE_CODE_LOG.md` 20:41). Another session is plausibly still writing there.
- ⇒ §7.96 ↳ write-back **carried forward, not done**. Needs Ishay's routing.

### F-rls-live — §2 security re-verification at SEED SCALE (independent, not trusting the pre-marked ✅)
All measured 03/09 20:5X on the live DB (832 projects), impersonated via `set local request.jwt.claims`, each in a rolled-back tx:
| identity | profit_visible | monthly_profit | quotes_visible | pending_quotes_count | project rows |
|---|---|---|---|---|---|
| CEO (ishay1997@gmail.com) | true | 159228.48 | true | 33 | 75 |
| finance.test | true | 159228.48 | true | 33 | 75 |
| projects.test | **false** | **null** | true | 33 | 75 |
| recruit.test | false | null | false | null | 75 |
| logistics.test | false | null | false | null | 75 |
- Negative control (unknown email): `42501 אין לך הרשאה לבצע פעולה זו במודול פרויקטים` — raised by `assert_module_permission` at line 20 of the function. ✅
- `pg_proc`: `prosecdef=true`, `provolatile='s'`, `proconfig={search_path=""}`, `proacl={postgres=X,service_role=X,authenticated=X}` — **no `anon`**, exactly one overload. ✅
- Acceptance oracle, separate hand query: `select count(*) from projects where project_status in ('not_started','in_progress','ready')` ⇒ **65** = the RPC's `active_projects_count` **65**. ✅
- Payload at seed scale: 75 project rows + 33 quote rows = **27 kB**. Not a payload problem.

### F-advisors — advisors after the seed
- security advisors total **49**. Exactly one mentions this module: `authenticated_security_definer_function_executable` on `get_dashboard_summary` — the expected class every DEFINER RPC here carries. No other module-7 finding.
- 🔴 whole-DB class `rls_enabled_no_policy` = 5 tables: `login_attempts` · `login_rpc_calls` · `feedback_rpc_calls` · `project_changes` (the four documented deny-alls, `docs/db_health_checks.md:90,92,200`) **+ `seed_registry` (new tonight, seed branch)**.
  - `seed_registry` IS a deliberate deny-all — the migration carries `comment on table … 'RLS דלוק בלי policies במכוון — גישה רק דרך seed_register / seed_backdate_* / seed_reset'` (`20260903180958…sql:73-75`). Not a leak.
  - **Gap:** `docs/db_health_checks.md` check-3 table still lists FOUR tables; the fifth is unlisted, and line 200 says "the four tables". Doc ripple owed by the SEED branch, not module 7.

### F-secscan — §2c general security scan (agent, scoped to this module's diff)
Seven categories, all "checked, clean": injection · XSS · secrets · client-only-authorization · unsafe input · error leakage · dependency risk. `git diff origin/dev -- package.json package-lock.json` **empty** — zero new packages. Key confirmation: `v_profit`/`v_pending` are assigned ONLY inside `if v_can_finance` / `if v_can_quotes`, so an unassigned plpgsql variable stays NULL and a client that ignores the flags still receives `null` — the flags are display hints, the wall is the body. Two hardening-only notes (no exploit path): `href` interpolation of integer PKs without `encodeURIComponent`; a hand-typed non-month-start `?month=2026-06-15` is cosmetically inconsistent client-side while the server `date_trunc`s it.

### F-rpccount (item ③ from Ishay's prompt) — the home screen sends the RPC exactly ONCE per entry
Measured, not reasoned. Temporary evidence-spec `e2e/_m7-rpc-count.spec.js` (deleted after the run), against a **production build** (`vite preview`, port 4176), real CEO login, counting every request to `/rest/v1/rpc/get_dashboard_summary`:
- `RPC_CALLS_AFTER_LOGIN=1`
- one click on `dashboard-cal-next` ⇒ `delta=1`
- navigate to `/projects` and back to `/` ⇒ `delta=1`
- exit 0, 1 passed.
⇒ **one call per entry, one per month-nav.** The `useEffect` in `DashboardPage.jsx:36-65` has stable deps `[monthParam, reloadTick]`; no second fetch. (In `npm run dev` React StrictMode double-invokes effects by design ⇒ 2 calls in dev only — that is React's dev behaviour, not a defect, and not what ships.)
- The "3 not 1" in the logistics guard is a different thing: `ALLOWED_WRITE_PATHS` (`e2e/logistics.spec.js:82-91`) is an **allow-list, not a counter** — 12 logistics tests failed because each one passes through `/` on the way in, so `get_dashboard_summary` appeared once per test, not three times per entry.

### F-gate — `npm run gate` exit **0** (measured this session, full log `/tmp/m7-gate.log`)
- `lint` clean (no output) · `format:check` "All matched files use Prettier code style!" · `test:run` **86 files / 2,264 tests passed**, 279.35 s · `build` ok
- `dup` (jscpd): **27 clones, ZERO involving any module-7 file** (`src/lib/dashboard.js`, `src/modules/07_dashboard/**` appear in none of the 27 pairs)
- `deadcode` (knip): clean, one config hint only
- `audit`: `✓ אין חולשות חמורות ללא פטור. (1 ממצאים בסך הכול, 0 מפוטרים)` + 5 stale-waiver housekeeping notes (pre-existing, `scripts/audit-gate.mjs`)
- `check:bidi` ✓ · `check:context` ✓ (flags one open §6 debt for **module 9**, not 7) · `check:docs-structure` ✓ 68 files, zero findings
- ⚠️ **count drift:** the guide's step 5.1 recorded **2,254** tests; this run measured **2,264**. Same tree, no commits since. The guide's number is the one to correct.

### F-silent — §3b silent-failure sweep (agent), each claim RE-VERIFIED by me against the live DB
The agent returned 4 findings. My independent re-check of reachability:
1. **`params` sub-field null ⇒ the attention panel silently says "✓ אין פריטים הדורשים טיפול"** — REAL as a design gap, NOT live today. `assertDashboardShape` (`api.js:86-91`) checks `hasOwn`/`undefined` on `params.*`, so a **null** sub-value passes. The SQL builds them as scalar sub-selects (`…184711…sql:165-169`), so a deleted `params` row yields `null`, not a missing key. Consequences: `dashboard.js:43` ⇒ calendar can never show red · `:164` `shortageRows` ⇒ `[]` · `:208` quote-expiry ⇒ `[]`. **Live check: all three rows exist** (`ימי_תוקף_הצעה`=30, `ימי_אזהרה_קדם_אירוע`=14, `ימי_אזהרה_הצעה_פגה`=7) ⇒ not firing now. **Precedent the module half-adopted:** `src/lib/quotes.js` `missingPricingParamsMessage` + the `QuotesPage` banner — module 7 took the "refuse to invent a default" half and left the "tell the user" half.
2. **All load failures collapse to `מסך הבית לא נטען.` + a retry that cannot help** (`DashboardPage.jsx:46-52`) — REAL as a design gap, the specific P0001 scenario the agent described is **NOT reachable**: `projects.quote_id` is `NOT NULL` (information_schema) and a live count gives **0** projects with no quote and **0** quotes with no `quote_services` rows (827 dated projects checked). `42501` is likewise pre-empted by module 1's sign-out gate. Precedent: `FinancePage.jsx:428-434` branches on `err?.code === '42501'` and passes `detail`.
3. `?? 0` on `active_projects_count` (`dashboard.js:81`) — **unreachable today** (the field is required + non-nullable in `assertDashboardShape`, which throws first). Latent lie-in-waiting.
4. `isStaffingComplete` (`CalendarGrid.jsx:45-51`) omits `required > 0` while its comment claims byte-identity with `staffingCell` — **unreachable**: `projects.required_hostess_count` is `NOT NULL` with `CHECK (> 0)`.
Clean, verified by the agent and consistent with my own reading: null never becomes 0 on the money/feedback cards · masked vs absent are two different renders · `assertDashboardShape`'s throw is not swallowed · the SQL `case when cancelled then 0` cannot zero a non-cancelled project · no empty catches anywhere (one `catch` in the whole module).

### F-e2e (item ② from Ishay's prompt) — the rotted anchors are the SEED session's, and it is fixing them right now
- Re-ran, on a production build (port 4176): `e2e/dashboard.spec.js` + `e2e/auth.spec.js` + `e2e/smoke.spec.js` ⇒ **10 passed · 1 failed**.
- The single failure is `smoke.spec.js:131` — `anchors.customers.revenues` against the "מדיטק" customer row. A hard-coded live revenue value. **Seed drift, module 2's anchor, not module 7's.** Every screen before it, including the home screen, passed.
- Note the 5.1 failure (`projects.knownEvent` matching 47 rows) did NOT recur ⇒ the seed session has already fixed at least that anchor.
- Evidence the seed session owns and is actively working these: the main checkout's uncommitted `e2e/quotes.spec.js` diff replaces `toHaveCount(REJECTED_COUNT)` with a runtime-read tab counter, citing `seed-build-handoff.md §7א ②`.
- 🔴 **I deliberately did NOT run the full `npm run test:e2e`**: several of its specs WRITE to the shared Supabase project, and a session was writing to that tree and that DB minutes before this audit. A full run would both measure a moving target and risk colliding with in-flight seed work (rule 16). Stated rather than glossed.
- ⚠️ **CI does not run E2E at all** (`.github/workflows/ci.yml` — lint · format · dup · deadcode · audit · test:run · build · deno check). So the m7 PR's CI is unaffected by the seed drift.

### F-scale — §6 row 717's commissioned re-measurement, now that the seed HAS landed
The §6 `🚧 מ12` row says "measure after the seed lands, fix only what measures >~1 s". Measured now (impersonated, rolled back):
- ① `list_projects_overview()` — **51.98 ms**, 827 rows. `get_dashboard_summary` (which calls it) — **139 ms** cold / **39 ms** warm.
- ④ `get_finance_overview()` — **194.19 ms**, 758 rows.
- ② Smart Match's unfiltered `assignments` read (5,697 rows) and ③ `listQuotes()` + `quote_services(*)` (1,225 quotes) are **client-side** queries — not measured here, still open in the §6 row.
⇒ nothing measured above 200 ms. No fix-forward migration warranted.

### F-arch — §3 free-hand notes (suggestions only)
- `AttentionPanel.jsx:29` recomputes `attentionRows(summary, today)` a second time just to find the first hidden row, after `attentionSummary` already built the full list. Returning `all` from `attentionSummary` would remove the duplicate pass. Cosmetic at this size.
- `docs/db_health_checks.md` check-3 lists FOUR deny-all tables and line 200 says "the four tables"; the live advisor now reports **five** (`seed_registry` joined tonight, deliberately, with a table comment saying so). Doc ripple owed by the SEED branch.
