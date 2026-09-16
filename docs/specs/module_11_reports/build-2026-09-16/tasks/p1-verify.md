# Task P1-V · Verify Phase 1 after the migrations were applied (read-only + test runs)

**Session type:** review/verify. **Repo:** `C:\Users\ishay\Reg-In`, branch `ishay/module-11-build`. **Read-only on the tree** (you run tests, you never edit source). Report in English. You may not trust any builder report — measure everything yourself.

## 🔴 The one top mine
**Zero rows with `error: null` is the failure this module fears most.** For each new table, the blocked identity must get **zero rows AND no error**, and that must be *asserted*, not observed in passing; the allowed identity must get rows (or, if the table is empty, a `200` with `[]` — say which). A policy that exists but is wrong shows up only here.

## Read first
1. `docs/micro_guides/module-11.md` §2ב (C1–C8) · §4 · §6 Phase 1 (T1–T7, steps 1.1–1.5 Verify lines).
2. The three migration files `supabase/migrations/*module11_a*.sql`, `*_b_*`, `*_c_*` (Glob) — what they claim to create.
3. The migrations builder's report at `<scratchpad>/results/p1-migrations-report.md` (if present) — its `post_apply_verification_sql` block is a starting list, **not** the answer.
4. `e2e/CLAUDE.md` (no test rows in the live DB, ever) · `e2e/hostesses.spec.js` and `e2e/smart-match.spec.js` headers (what they need in `.env.local`).

## Tools
- MCP `execute_sql` read-only (ToolSearch `select:mcp__5c4d90c8-bdb0-4e4a-bd64-299d0299d315__execute_sql`, project `yfeovxppnfoafmfbdfvh`) for catalogue checks (`pg_policies`, `information_schema.columns`, `pg_constraint`, `pg_proc`/`proacl`, `params`).
- MCP `get_advisors` (ToolSearch `select:mcp__5c4d90c8-bdb0-4e4a-bd64-299d0299d315__get_advisors`) for `security` and `performance` — list every finding touching `feedback_ai_runs`, `feedback_ai_insights`, `assignments`, `params`, `approve_feedback_ai_run`; and separately list every `rls_enabled_no_policy` finding **on the whole DB** (the closing audit judges that class whole-DB).
- **Signed-in RLS check through the real client:** write a temporary Node script in the scratchpad (NOT in the repo) that reads `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `E2E_*`) with `dotenv`-style parsing, signs in with `@supabase/supabase-js` as **CEO** and as **STAFF** (מנהלת לוגיסטיקה — expected `blocked` on `'דו"חות'`; confirm her level with a `permissions` query first) and runs `select` on both tables and `rpc('approve_feedback_ai_run', { p_run_id: 0 })`. **Never print credentials or tokens.** Expected: CEO ⇒ rows/`[]` with no error; STAFF ⇒ `[]` with **no error** on select (assert `error === null && data.length === 0`) and an **error** (42501) on the RPC. Delete the script when done.
- Tests: `npx vitest run src/modules/04_hostesses src/modules/06_projects src/lib/paramsRegistry.test.js src/lib/reportsParams.test.js` · then the m4 E2E regression: `npx playwright test e2e/hostesses.spec.js e2e/smart-match.spec.js --config=playwright.config.js` (dev server on 5173 is started/reused by the config; if it fails, re-run once before attributing a regression — `e2e/CLAUDE.md` §4.2). Read the exit code **from the output**, not from a wrapper.

## Checks (each with its actual output in the report)
1. `pg_policies` for `feedback_ai_runs` and `feedback_ai_insights`: names, `cmd`, `qual` contains `'דו"חות'`.
2. `feedback_ai_insights.project_id` unique constraint exists; `run_id` FK exists; the two topic CHECKs quote exactly the five negative / five positive strings of `projects` CHECKs (compare `pg_get_constraintdef` side by side).
3. `assignments.recommended_rank` exists, nullable, `count(*) where recommended_rank is not null` = 0, PK still `(project_id, hostess_id, assignment_number)`.
4. `params`: the four rows, `param_type='control_alerts'`, `owner_role_id` = the CEO role id, values `1.5 · 15 · 0.87 · 0.95`; `paramsRegistry.js` has the four entries.
5. `approve_feedback_ai_run`: exists, `proacl` shows execute only for `authenticated` (no `PUBLIC`, no `anon`), `prosecdef = true`, `proconfig` has `search_path=`.
6. `docs/schema.sql`: contains `negative_feedback_reasons`, `positive_feedback_reasons`, `positive_feedback_reason` (each separately) and the two new tables + the new column + the four params (grep counts).
7. Advisors as above.
8. The signed-in RLS check as above.
9. Unit + E2E runs as above.

## Output (final message = data)
`{ "checks": [ { "id", "expected", "observed", "pass" } ], "advisors": { "introduced_by_m11": [...], "rls_enabled_no_policy_whole_db": [...] }, "e2e_m4": { "exit_code", "summary", "reran": bool }, "unit": "<summary>", "findings": [ { "severity", "what", "evidence" } ], "not_verified", "blind_spot" }`
