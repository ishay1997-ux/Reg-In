# Task P1-A · Refresh `docs/schema.sql` in place (module 11, step 1.1)

**Session type:** build (mechanical, high care). **Repo:** `C:\Users\ishay\Reg-In`, branch `ishay/module-11-build`. You are one of several agents writing to the same tree — write ONLY the file named below. **Never commit.** Report in English.

## 🔴 The one top mine
`docs/schema.sql` is a **curated, annotated snapshot** (2,365 lines, 33+ numbered Hebrew sections, comments that later modules rely on). **Do NOT regenerate it wholesale** — you would delete the annotations. Refresh it **in place**: find every delta between the live catalogue and the snapshot, patch only the deltas in the file's own style, and log the refresh at the top in the existing "רוענן לאחרונה" format. Measure first, then edit.

## Read first, in this order
1. `docs/micro_guides/module-11.md` — section **`## 2ב. 🔒 Build conventions`** in full, then §6 Phase 1 **step 1.1** and trap **T1**.
2. `supabase/migrations/CLAUDE.md` — §2 "סנכרון סכמה אוטונומי" and §4.
3. `docs/schema.sql` lines 1–105 (the refresh-log convention at the head) and the `projects` block (`grep -n "create table projects (" docs/schema.sql`).
4. `supabase/migrations/20260904230000_feedback_positive_and_negative_reasons.sql` and `20260904233000_feedback_multi_select_reasons.sql` — the source of the three columns known to be missing (`projects.negative_feedback_reasons` · `positive_feedback_reasons` · `positive_feedback_reason`) and their CHECK constraints.
Probably NOT needed (open only on a real gap, and say so): the spec folder; other migrations.

## Tools
- Live DB, **read-only**: Supabase MCP `execute_sql` (load with ToolSearch `select:mcp__5c4d90c8-bdb0-4e4a-bd64-299d0299d315__execute_sql`), `project_id` = `yfeovxppnfoafmfbdfvh`. 🚫 No DDL, no writes, no `apply_migration`.
- Files: Read/Grep/Edit. Write with LF only — after editing run `grep -c $'\r' docs/schema.sql` and it must print `0`.

## Method
1. For every table in `information_schema.tables where table_schema='public'`, pull `(column_name, data_type/udt_name, is_nullable, column_default)` ordered by ordinal_position, and compare against the snapshot's `create table <name> (` block. Also compare `pg_constraint` names per table (conname, contype) and `pg_policies` (policyname per table), and count `pg_proc` functions in `public`.
2. List every delta (live has / snapshot lacks, and the reverse). Expected at least the three `projects` columns + their two CHECK constraints from step 4 above; report anything else you find.
3. Patch each delta into the snapshot **in the style of its neighbours** (indentation, Hebrew comment style, constraint naming). Add a refresh-log line at the head: `רוענן לאחרונה: 16/09/2026 HH:MM (מודול 11 צעד 1.1 — …)` naming exactly what changed, and demote the previous "רוענן לאחרונה" to "רוענן קודם" as the file already does for earlier refreshes.
4. **Verify, per column:** `grep -c 'negative_feedback_reasons' docs/schema.sql` ≥ 1 · `grep -c 'positive_feedback_reasons'` ≥ 1 · `grep -c 'positive_feedback_reason '` (singular, note the trailing space or use a word-boundary regex) ≥ 1 — **each separately**. And: live `count(*)` of `projects` columns **equals** the number of column lines in the snapshot's `projects` block — print both numbers.

## Output (final message = data, not prose)
- `deltas`: list of `{table, item, live, snapshot, action}`.
- `verify`: the four checks with their actual numbers.
- `refresh_line`: the exact line you added at the head.
- `not_verified` · `blind_spot` · `assumed` — three lines. Tag every claim `אומת-על-ידי` / `דווח-לי` / `הנחתי`.

כל עובדה כאן ניתנת לערעור — אם מדדת אחרת, תקן אותי עם המדידה.
