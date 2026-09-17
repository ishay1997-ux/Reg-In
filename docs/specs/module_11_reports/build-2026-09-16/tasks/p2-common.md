# Phase 2 · common brief for the four RPC builders (read this, then your tab file)

**Session type:** build, **test-first**, SQL + pure JS. **Repo:** `C:\Users\ishay\Reg-In`, branch `ishay/module-11-build`. Four builders run concurrently, one per tab, each writing ONE migration file + its own `src/lib/reports<Tab>*.js` files. **Never commit. Never apply a migration. Never run DDL** — you write the migration file; the orchestrator applies it.

## 🔴 The one top mine
**A number that matches a test you wrote yourself proves nothing.** The acceptance numbers already exist, measured on an independent channel before any code: `docs/specs/module_11_reports/spec.md §🔢` (aging: 35 · 10-13-8-1-3 · 236,382 ₪; Gini population variant: `1·2·3·4·10 ⇒ 0.40`) and `stage2-review/signoff-baseline-2026-09-10.md` (every other surface, each with the definition it was measured by). **Copy them digit for digit into your tests and into your live-query check. When your SQL disagrees, the SQL is wrong until proven otherwise — and if it is the baseline that is wrong, that is a FINDING you report with both numbers, never a number you edit.** Prove it: your report carries, per surface, `baseline value · your live value · match?`.

## Read first, in this order (MUST)
1. `docs/micro_guides/module-11.md` — **§2ב Build conventions C1–C8 in full** (C5 = the RPC shape, C8 = the payload contract and the fixed function names) · §3.3 (which rulings your surfaces must make visible) · §5 (DB design challenge) · §6 Phase 2 (steps 2.1, 2.2–2.n) · §7 QA matrix.
2. `docs/specs/module_11_reports/spec.md` — §🔒 (labels, status labels, the `assignments` triple key), §➡️, **§🔢 in full**, §🔗, §🚫.
3. `docs/specs/module_11_reports/processes-approved.md` — **§📐 the 23 rules (lines 772–810)** · **§📑 your surfaces' definition rows (table 831–854)** · **§📑ב your surfaces' critique corrections (861–883) — part of the definition, not a note** · **§📊 chart type per page (665–687)** · §🏷️ (743–770) · §🔒 (688–700) · the rulings your tab file names from **§🗳️ (899–944)**. Long single-line rows: read each row to its end.
4. Your tab's card file `stage2-cards/cards-<tab>.md` — **for each of your four surfaces, sections ① through ⑩ in full** (inline bold markers `**①**`…`**⑩**`; §③ "מקור לכל מספר" is the column/population/window/comparison/precision/empty-case spec; §⑤ interactions incl. drill levels; §⑧ the states). Line anchors are in your tab file.
5. `stage2-review/signoff-baseline-2026-09-10.md` — whole file (88 lines).
6. `stage2-review/m11-report-inclusion-rules.md` and `stage2-review/m11-inclusion-remeasure-2026-09-10.md` — the population rules per report (who is in/out), when your card refers to them.
7. Code precedents: `supabase/migrations/20260903182735_module7_dashboard_summary_rpc.sql` (RPC shape — copy it) · `20260814142440_module6_rpcs_writes.sql` (`assert_module_permission` definition) · `20260827144459_module8_finance_money_ssot_and_readers.sql` (how money is read: `finance_project_money`, `final_profit`/`gross_profit`) · `src/lib/projectFinance.js` (`deriveDaysOverdue`, `deriveDueDate` — the aging definition in JS; your SQL must be its twin) · `src/lib/dates.js` (Israel time) · `src/lib/projects.js` (`PROJECT_STATUS_LABELS`) · `src/lib/smartMatch.js` (reliability score, if your tab needs it) · `docs/schema.sql` (the snapshot, refreshed today — but **a column you rely on is verified with a live catalogue query**, spec §🚫.1).
8. `docs/db_roadmap.md` lines 278–306 (M11-2…M11-5 — the new tables/column/params you may read) and `supabase/migrations/*module11_a*.sql` / `*module11_b*.sql` / `*module11_c*.sql` (already authored; use the exact table/column names from those files).
Probably NOT needed (say so if opened): the mockups (the tab UI builder owns appearance), `design-contract.md` beyond §⑤ chart types, other tabs' cards.

## Tools
- Live DB **read-only**: MCP `execute_sql` (ToolSearch `select:mcp__5c4d90c8-bdb0-4e4a-bd64-299d0299d315__execute_sql`, project `yfeovxppnfoafmfbdfvh`). Use it to (a) verify every column you reference exists (`information_schema.columns`), (b) run the BODY of each report as a plain `select` with literal parameters and compare with the baseline, (c) measure populations. 🚫 No DDL, no writes, no `create function`. Note: `assert_module_permission` cannot be exercised here (no `auth.uid()`); the orchestrator's verifier does that through a signed-in client.
- Files: Read/Grep/Glob/Write/Edit/Bash. LF only (`perl -ne '$n+=tr/
//; END{print "CR=$n
"}' <file> prints CR=0 (measured 16/09: `grep -c $'
'` returns wrong numbers in this Git Bash — never use it)`). `npx vitest run <your test files>` · `npx eslint <your js files>` · `npx prettier --check <files>`.

## What you write (and nothing else)
1. `supabase/migrations/<ts>_module11_<letter>_rpcs_<tab>.sql` — your four functions (names from C8), each: Hebrew `-- why:` header naming the card and rulings · a function comment stating the **population exactly as 📐2 states it on screen** · `language plpgsql stable security definer set search_path to ''` · every relation `public.`-qualified · first statement `perform public.assert_module_permission('<owning module>', array['edit','view'])` · returns the C8 jsonb · `revoke execute … from public, anon, authenticated; grant execute … to authenticated`. Timestamp from `date +%Y%m%d%H%M%S` (must be later than the module11_c file). Use `nullif(denominator, 0)`, `at time zone 'Asia/Jerusalem'` before day/month truncation, half-open windows `(from, to]`, medians via `percentile_cont(0.5)`, and **read the four `params` rows at runtime** — a missing row goes into `meta.missing_params`, never a default.
2. `src/lib/reports<Tab>.js` + `src/lib/reports<Tab>.test.js` — the **pure** functions your surfaces need on the client (bucketing · Gini · quartile shares · Lorenz points · histogram bins · reliability score · per-customer cadence …) with tests written FIRST from the hand-computed cases (§🔢) and from the card's §③ definitions. Where the same computation also lives in SQL, the JS test is the oracle the orchestrator compares the SQL against — say so in the file header. Do not duplicate helpers that already exist in `src/lib/` (grep first; iron rule 14).
3. `<scratchpad>/results/p2-<tab>.json` — your report (below), so the orchestrator and the verifier read one file.

## Verify before reporting
- For each surface: run the report body live with the baseline's window/params; put `baseline · live · match` in the report. Explain every mismatch with the definition line that produces it (do not "fix" the baseline).
- `grep -c "assert_module_permission" <migration>` = 4 · `grep -c "revoke execute"` = 4 · `grep -c "grant execute"` = 4 · `grep -c "set search_path to ''"` = 4 · `perl -ne '$n+=tr/
//; END{print "CR=$n
"}' <file> prints CR=0 (measured 16/09: `grep -c $'
'` returns wrong numbers in this Git Bash — never use it)`.
- Tests green, eslint clean, prettier clean on your JS files.

## Output (final message = the same JSON you wrote to `results/p2-<tab>.json`)
`{ "tab", "migration_file", "functions": [ { "name", "surface", "owning_module", "population_sentence", "params_read": [...], "drill_levels": [...] | null, "baseline_checks": [ { "metric", "baseline", "live", "match", "note" } ], "columns_verified_live": true } ], "lib_files": [...], "tests": "<summary line>", "rulings_made_visible": ["<ruling # → where in payload>"], "conflicts": [ { "source_a", "source_b", "what" } ], "assumed": [...], "not_verified": [...], "blind_spot": "..." }`

כל עובדה כאן ניתנת לערעור — אם מדדת אחרת, תקן אותי עם המדידה.
