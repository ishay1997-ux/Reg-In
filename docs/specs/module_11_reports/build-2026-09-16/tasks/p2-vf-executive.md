# P2-VF executive · Adversarial verification of the four הנהלה RPCs (already applied) + ONE fix-forward migration D2 + specific re-verification

**Repo:** `C:\Users\ishay\Reg-In`, branch `ishay/module-11-build`. **Never commit.** Report in English.
**Your write scope:** ONE new migration file `supabase/migrations/20260916<HHMMSS>_module11_d2_rpcs_executive_fixes.sql` (append-only; do NOT edit the applied D file) · `src/lib/reportsExecutive.js` + `.test.js` (yours) · the migration apply through MCP `apply_migration` (Ishay's typed-echo waiver, `module-11.md §9 D-9`) · a temporary signed-in Node script in `<scratchpad>` (deleted after; never print credentials). Nothing else.

## State you inherit (measured by the orchestrator 16/09 08:0X — re-check, do not trust)
- `20260916052600_module11_d_rpcs_executive.sql` IS applied (registry row `module11_d_rpcs_executive`); md5(prosrc) of `report_m02_exec_overview` · `report_m03_trends` · `report_m04_discounts` · `report_m06_staffing` equals the file's `$function$` bodies (4/4). The previous verifier was killed by a quota limit before writing any finding — **nothing about D has been verified beyond the builder's own report** `<scratchpad>/results/p2-management.json`.
- A tab builder is building `ExecutiveTab.jsx` **in parallel, against the live payloads** — so every change you make is **ADDITIVE ONLY** (new keys, fixed values, fixed labels; never rename or remove a key, never change a tile key). List every payload change in your report under `payload_changes` — the tab builder reads it before finishing.

## Read first
1. `docs/micro_guides/module-11.md` §2ב — C1–C8 **with all amendments** (`tiles[].sub` · `drill_key {kind,…}` incl. `sku` · `meta.extra_tables` · `chart.label_source` · `chart.series[].kind/axis` · `refLines[].axis='diagonal'` · `meta.row_total` · `columns[].sorted` · **the window rule D-17: calendar presets closed `[from,to]`, rolling half-open `(from,to]`**) · §3.3 · §9 (D-10…D-19).
2. `<scratchpad>/tasks/p2-verify-lens.md` — the lenses and the conflict-question rule (verbatim in it) · `<scratchpad>/tasks/p2-apply-and-verify.md` steps 1–5 (skip the apply — done; DO the live calls).
3. `<scratchpad>/tasks/p2-tab-management.md` + `<scratchpad>/results/p2-management.json` — the claims to refute.
4. **The two finished fix-forward migrations as the pattern to copy:** `20260916063400_module11_e2_rpcs_finance_fixes.sql` (header: registry-rows trap, `p_asof`, LRI/PDI money via `to_char(round(x),'FM999,999,999') || ' ₪'` inside `chr(8294)…chr(8297)`, `tiles[].sub`, `compare.count/note`, `drill_key {kind,…}`, `comment on function` with the declared population) and `20260916065642_module11_f2_rpcs_hostesses_fixes.sql`. Pull live bodies with `pg_get_functiondef` before `create or replace` (`supabase/migrations/CLAUDE.md`).
5. `src/modules/11_reports/components/ChartCard.jsx` — the **ScatterBody contract** (`series[0]` = the X column, `series[1]` = the Y column, `xKey`) and the composed-chart contract (`series[].kind`, `.axis`). `src/modules/11_reports/components/ReportSurface.jsx` — how the payload is rendered (slots, `meta.extra_tables`, `columns[].sorted`).
6. `stage2-cards/cards-management.md` — מ2 (89) · מ3 (236) · מ4 (388) · מ6 (523): §③ §⑤ §⑧ in full · `spec.md §1.4` הנהלה row · `spec.md §🔢` · `signoff-baseline-2026-09-10.md` · `processes-approved.md §📐` (772–810), §📑ב rows for הנהלה.

## Known suspects (check each; fix in D2 if confirmed)
- **m03 scatter series (mirror of the hostesses F3 blocker):** the mockup's scatter needs `series = [{ key:'<x>', label }, { key:'<y>', label }]` + `xKey` — the hostesses builder had the mirror mistake (a single Y series, no X). Verify m03's chart against ChartCard's contract; fix if wrong.
- **No `comment on function` on any of the four** (measured: `obj_description` null for all four) — C5/C8 require the declared population in the function comment (E2/G do it). Add in D2.
- Server-built sentences (`so_what`, `population.label`, `definitions`, `tiles[].sub`, `compare.label/note`, `meta.notes`): every number LRI…PDI-isolated, money `1,250 ₪` with thousands separators, percent `12.5 %` — scan the live payloads for runs of 4+ digits (excluding years) exactly as the finance fixer did.
- `drill_key` on every row as `{ kind, … }` (מ3 is a drill surface — level 1 and level 2 keys must equal the next level's `p_drill`); `tiles[].compare` on every tile (ruling 4/📐1, `null` allowed only where the card says no comparison exists — then `sub` says why); `tiles[].sub` where the mockup shows a sub-row; `meta.drill_echo` (null when unused) and `meta.customer_filter_ignored`; `meta.missing_params` reasoning; `columns[].sorted` on the 📐7 column; `meta.row_total` when rows are capped.
- **Window rule D-17** applied to every window-driven number (calendar closed, rolling half-open) and Israel time before date truncation.
- **Ruling 39** tiers `0 · 1–5 · 6–10 · 10+` visible in m04; **§7.82** (the 15 quotes removed from the approval-rate denominator); ruling 36; ruling 22.
- **Performance (from the original task):** `explain (analyze, buffers)` of m04 and m06 bodies with literal params — report the totals; if > 1 s, propose (do not add) an index.

## Live calls (signed-in Node script, `@supabase/supabase-js`, identities from `.env.local` `E2E_*`)
CEO and FINANCE ⇒ 200 on all four; RECRUIT and STAFF ⇒ `42501` (never an empty object). Default window and the baseline window (the card's 10/09 window) — save payloads to `<scratchpad>/results/payloads/report_m0<N>_<case>.json`. מ3 drill: level 1 and level 2 with the `drill_key` the previous level returned. One call with a real `p_customer_id` (401 is used elsewhere) — coherent shrink or `meta.customer_filter_ignored: true`.

## D2 rules
- Apply in chunks < 60 KB (`apply_migration` truncates ~90 KB) — one registry row per chunk is ACCEPTED (§9 D-20, recorded by the orchestrator): name them `module11_d2_executive_m02`, … and list them in the file header.
- After apply: `md5(prosrc)` of each live body == md5 of the file's `$function$` body (write a 10-line Python that extracts the body between the dollar tags and hashes it; the orchestrator's script is `<scratchpad>/fn_md5.py` — you may run it).
- `npx vitest run src/lib/reportsExecutive.test.js` green · `npx eslint` + `npx prettier --check` on the lib files · CR = 0 via `perl -ne '$n+=tr/\r//; END{print "CR=$n\n"}' <file>` (never `grep -c $'\r'`).

## Output (final message = data, also `<scratchpad>/results/p2vf-management.json`)
`{ "tab": "management", "findings": [ { "surface", "severity", "lens", "claim_refuted", "evidence", "conflict_question": null|{...}, "fixed_in_d2": bool, "reverified_by", "result" } ], "baseline_table": [ { "metric", "definition_ref", "independent_value", "rpc_value", "baseline", "verdict" } ], "d2": { "file", "applied_as": [...], "md5_match": "4/4" }, "payload_changes": [ { "rpc", "key", "change" } ], "live_calls": [...], "perf": { "m04_ms", "m06_ms" }, "tests_pass_but_would_not_catch": [...], "not_verified": [...], "blind_spot": "...", "assumed": [...] }`
Empty `findings` is a legitimate answer — say so with what you measured. A finding that contradicts a recorded ruling (§9) is a **conflict question**, not a fix.
