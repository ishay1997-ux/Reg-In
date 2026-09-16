# Task P1-B · Author migrations A · B · C for module 11 (steps 1.2–1.4) — WRITE, do not apply

**Session type:** build. **Repo:** `C:\Users\ishay\Reg-In`, branch `ishay/module-11-build`. Several agents write to the same tree — write ONLY the files listed below. **Never commit. Never apply a migration** — the orchestrator applies through MCP after reading your report. Report in English; SQL comments in Hebrew per the migration protocol.

## 🔴 The one top mine
**A table with RLS on and zero policies returns zero rows with `error: null` — the screen lies, it does not fail.** Both new tables ship their read policies **in the same migration file that creates them**, gated on module `'דו"חות'` with the **inline** `exists(select 1 from public.permissions …)` predicate (there is no boolean helper function — verify that yourself with `grep -rn "has_module_permission" supabase/migrations/` and report the count). Verify by reading your own file: `grep -c "create policy" <file A>` must be ≥ 2 before you report.

## Read first, in this order (MUST)
1. `docs/micro_guides/module-11.md` — **`## 2ב. 🔒 Build conventions`** in full · §2.5 · §4 (security model) · §5 (DB design challenge) · §6 **Phase 1 blocker table T1–T7 and steps 1.2 · 1.3 · 1.4** in full.
2. `docs/db_roadmap.md` lines 278–306 — **M11-2 · M11-3 · M11-4 · M11-5**, each row read to its end (the status cell is at the END of the row).
3. `docs/specs/module_11_reports/spec.md` — `# 🔗 פריט-חוזה 4` and `# 🚫 מה אסור לבלופרינט לנחש` (.1 and .2).
4. `docs/specs/module_11_reports/processes-approved.md` — cards **ת2** (line 549–570) · **ת5** (580–590) · **ת6** (591–599) · **ת8** (608–617). Read the whole card; the ruling is at the end of each row.
5. `supabase/migrations/CLAUDE.md` — whole file (protocol, traps: `extensions.moddatetime`, `revoke … from public, anon, authenticated`, append-only).
6. Precedents to COPY the shape from (open all four):
   - `supabase/migrations/20260902211550_module9_b_notification_preferences.sql` — table + RLS + policies in one file.
   - `supabase/migrations/20260908221959_onboarding_mode.sql` — CEO `for all` policy with `(select current_user_role_id())`, `comment on`, moddatetime trigger style.
   - `supabase/migrations/20260827125155_module8_finance_tables_and_columns.sql` — policy `project_finance_select_by_permission` (module-permission predicate inside a policy).
   - `supabase/migrations/20260903182735_module7_dashboard_summary_rpc.sql` — RPC shape (`language plpgsql … security definer set search_path to ''`, `perform public.assert_module_permission(...)` first, revoke/grant lines).
7. `supabase/migrations/20260904233000_feedback_multi_select_reasons.sql` — the two CHECK lists (negative 5 · positive 5, `'אחר'` in both). **Copy them verbatim into the two topic-array CHECKs.**
8. `supabase/functions/send-email/index.ts` — how the edge function creates its Supabase client (anon key + user JWT, or service role?). **This decides whether the AI tables need `insert/update` policies for `authenticated`** (the future `classify-feedback` function writes the rows). Decide, and write the decision as a Hebrew `-- why:` comment in migration A.
9. `src/lib/paramsRegistry.js` — the entry shape (`name · label · hint · kind · unit · min · max · decimals · group · affects`) and the existing `control_alerts` rows; `src/lib/paramsRegistry.test.js` — how entries are tested.
10. `docs/PROJECT_MASTER_sec7.md` — item **§7.21** (RLS standard template; `grep -n "7.21" docs/PROJECT_MASTER_sec7.md`, read to its ✅) and **§7.83** (missing param ⇒ "חסר פרמטר מערכת", never a silent default).
Probably NOT needed (say so if you open them): the cards folder, the mockups, `processes-approved.md` outside the four cards.

## Tools
- Live DB, **read-only**: MCP `execute_sql` (ToolSearch `select:mcp__5c4d90c8-bdb0-4e4a-bd64-299d0299d315__execute_sql`, project `yfeovxppnfoafmfbdfvh`) — for catalogue lookups (types of `users.email` / `roles` / `params` columns and constraints, `pg_get_functiondef` of `assert_module_permission`, `pg_constraint` of `assignments`, whether `params.param_name` is unique). 🚫 **No DDL through `execute_sql`.** You MAY try a dry run `begin; <your DDL>; rollback;` in ONE call — if the tool refuses transaction control, say so and stop trying.
- Files: Read/Grep/Write/Edit/Bash. LF only: `perl -ne '$n+=tr/
//; END{print "CR=$n
"}' <file> prints CR=0 (measured 16/09: `grep -c $'
'` returns wrong numbers in this Git Bash — never use it)` for every file you touch. Timestamps for file names from the local clock: `date +%Y%m%d%H%M%S`, strictly A < B < C.

## Files to write (and nothing else)
1. `supabase/migrations/<ts>_module11_a_feedback_ai_tables.sql` — **M11-2 + M11-3 + the approve RPC**:
   - `public.feedback_ai_runs`: identity PK · `started_at timestamptz not null default now()` · `finished_at timestamptz` · `status text not null check (status in ('running','done','partial','failed'))` · `sent_count`/`ok_count`/`failed_count integer not null default 0` · `model text` · `run_by` (type matches how this repo identifies users — measure `users` and existing `*_by` columns, do not guess) · `approved_at timestamptz` · `approved_by` (same type) · `created_at`/`updated_at` + `extensions.moddatetime('updated_at')` trigger.
   - `public.feedback_ai_insights`: identity PK · `run_id` → `feedback_ai_runs` (on delete cascade) · `project_id integer not null unique` → `projects` · `sentiment smallint check (1..5)` (nullable when unclassifiable) · `negative_topics text[]` CHECK `<@` the negative list · `positive_topics text[]` CHECK `<@` the positive list · `quote text` · `red_flag boolean not null default false` · `unclassifiable boolean not null default false` · `classified_at timestamptz not null default now()`.
   - `enable row level security` on both + **select policies** gated on `'דו"חות'` `['edit','view']` (inline predicate) · write policies per your step-8 decision · `comment on table/column` in Hebrew · **`create or replace function public.approve_feedback_ai_run(p_run_id bigint) returns jsonb`** — `perform public.assert_module_permission('דו"חות', array['edit'])` first; refuse (raise with a Hebrew message) when the run is `running` or `failed` or already approved; set `approved_at = now()`, `approved_by = <current identity>`; return `jsonb_build_object('ok', true, 'run_id', …, 'approved_at', …)`; revoke/grant lines exactly like the precedent. Header `-- why:` in Hebrew (M11-2/M11-3, ruling 1, card ת2).
2. `supabase/migrations/<ts>_module11_b_assignments_recommended_rank.sql` — **M11-4**: `alter table public.assignments add column recommended_rank integer null` + optional `check (recommended_rank >= 1)` (mark it `הנחתי` in the comment) + Hebrew `comment on column` saying: written once at invite time by `insertInviteRow`, never on resend, no back-fill, `NULL` = no recommendation existed. **No `update`, no back-fill.**
3. `supabase/migrations/<ts>_module11_c_report_params.sql` — **M11-5**: insert the four rows `('מכפיל_מרווח_מתרחק','1.5') · ('סף_סטיית_תקציב_אחוז','15') · ('מקדם_אמינות_אדום','0.87') · ('מקדם_אמינות_ענבר','0.95')`, `param_type = 'control_alerts'`, `owner_role_id = (select role_id from public.roles where role_name = 'מנכ"ל')`, idempotent (`on conflict do nothing` if `param_name` is unique — measure; otherwise `where not exists`). `param_value` is `text`. Header cites ruling 14 (why exactly four) and ruling 35 (0.87/0.95, NOT 0.8/0.9).
4. `src/lib/paramsRegistry.js` — add the four entries in `group: 'control_alerts'` with Hebrew `label`/`hint`/`affects` (write them from card ת6's wording; `kind`: reuse an existing numeric kind with `min`/`max`/`decimals` — say which). Keep the file's own comment style.
5. `src/lib/paramsRegistry.test.js` — extend: the four names exist, their groups, and that their expected values validate under their `kind`.
6. `src/lib/reportsParams.js` (new, pure) + `src/lib/reportsParams.test.js`: export `REPORT_PARAM_NAMES` (the four) and `missingReportParamsMessage(paramsMap)` that returns `null` when all present, else a Hebrew sentence in the exact §7.83 / m7 shape — **copy the shape from `missingDashboardParamsMessage` in `src/lib/dashboard.js`**, do not invent wording. Test: all present ⇒ null · one missing ⇒ sentence names it · two missing ⇒ both named.

## Then
- Run `npx vitest run src/lib/paramsRegistry.test.js src/lib/reportsParams.test.js` and `npx eslint src/lib/paramsRegistry.js src/lib/reportsParams.js src/lib/reportsParams.test.js` and `npx prettier --check` on the same files — paste the tail of each output.
- For each migration file: `grep -c "create policy"`, `grep -c "revoke execute"`, `grep -c "grant execute"`, `perl -ne '$n+=tr/\r//; END{print "CR=$n\n"}'` — print the numbers.

## Output (final message = data)
- `files`: the six paths.
- `decisions`: write-policy decision (with the `send-email` evidence line) · `run_by`/`approved_by` type (with the catalogue evidence) · idempotency mechanism for C · any `הנחתי`.
- `post_apply_verification_sql`: the exact read-only queries the orchestrator's verifier should run after apply (pg_policies per table · column exists/nullable · `count(*) where recommended_rank is not null` = 0 · PK triple unchanged · 4 params rows with types · function `proacl`).
- `not_verified` · `blind_spot` · `assumed`. Tag claims `אומת-על-ידי` / `דווח-לי` / `הנחתי`.

כל עובדה כאן ניתנת לערעור — אם מדדת אחרת, תקן אותי עם המדידה.
