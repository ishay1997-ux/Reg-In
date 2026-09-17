# Task P2-FIX · Finance tab RPCs — fix-forward migration E2 for the verifier's findings, apply it, re-verify each finding specifically

**Repo:** `C:\Users\ishay\Reg-In`, branch `ishay/module-11-build`. You write ONE new migration file + edits to `src/lib/reportsFinance.js` / `.test.js` only. **You apply the migration through MCP** (waiver, `module-11.md §9 D-9`). Never commit. Report in English.

## Read first
1. `docs/micro_guides/module-11.md` §2ב (C5 · C7 · C8 **including all amendments** — `tiles[].sub`, `compare.note`, `drill_key {kind,…}`, `meta.extra_tables`, `label_source`, the window rule, `export_blocked_reason`).
2. `<scratchpad>/results/p2v-finance.json` — the findings (12) and the `tests_pass_but_would_not_catch` list. **Each finding gets a specific re-verification in your report.**
3. The applied migration `supabase/migrations/20260916051950_module11_e_rpcs_finance.sql` (do NOT edit it — append-only; it is applied) and the executive migration `20260916052600_module11_d_rpcs_executive.sql` as the pattern for money formatting (`to_char(round(x),'FM999,999,999') || ' ₪'` wrapped `chr(8294)…chr(8297)`), `tiles[].sub`, `drill_key` with `kind`.
4. `supabase/migrations/CLAUDE.md` (fix-forward rule; pull the live body with `pg_get_functiondef` before `create or replace`).

## Orchestrator rulings for this fix (technical, reversible — record each as a Hebrew `-- why:` line)
- **F1 (blocker) — aging as-of date.** מ9 and מ7's aging parts are snapshots as of **Israel today**; `p_to` must NOT move them. To keep the hand-computed oracle reproducible, add a fifth parameter `p_asof date default null` to `report_m09_aging` and `report_m07_finance_overview` (`v_asof := coalesce(p_asof, v_today)`); the client never passes it, verifiers do. Because the 4-parameter overloads exist, `drop function public.report_m09_aging(date,date,integer,jsonb)` (and m07's) **before** creating the 5-parameter version — these functions are not yet called by any deployed code, so Expand-Contract allows it; say so in the header. Revoke/grant lines again for the new signatures. The window text and the population line say *"נכון להיום"* and never a filter date.
- **F2 — m07 hardcoded 0.15** ⇒ read `סף_סטיית_תקציב_אחוז` like m08; missing ⇒ `meta.missing_params` + the tile `value: null`.
- **F3 — five `compare: null` tiles** ⇒ fill them with the previous-period values the mockup shows (the verifier's as-of-11/08 numbers: over-60 3 / 17,946 · 90+ 1 / 2,899 · L1 bucket 2 / 15,047 · 7.3 % · m08 median deviation vs 2025), with `compare.count` where the mockup prints a count.
- **F4 — m09 level-2 customer count** ⇒ add the missing `v_level = 1 or customer_id = v_cust` guard; Hebrew number agreement: `1 חשבונית` / `חשבונית אחת`, `לקוח אחד` (follow the mockup's strings, lines ~1008).
- **F5 — money in server sentences** ⇒ every ₪ number inside `so_what`, `population.label`, `meta.notes`, `tiles[].sub`, `compare.note` formatted with thousands separators and LRI/PDI isolation, exactly like the executive migration.
- **F6 — `tiles[].sub` + `compare.count`** for m07 (13 · 18 · 83) and m12 (`4,182 יחידות מתוך 126,650 מתוכננות`), per the C8 amendment.
- **F7 — `drill_key` shape** ⇒ `{ "kind": "project"|"bucket"|"customer"|"sku", … }` on every row (uniform with executive).
- **F8 — m08 `population.excluded`** ⇒ the 123 below-materiality projects are inside n=236; move the counter to `meta.below_materiality` (count + ₪) and keep `excluded` truthful.
- **F9 — `so_what` with a missing param** ⇒ `so_what: null` (the tab shows the missing-param message instead of a sentence).
- **F10 — minor:** `hostess_pay_month` values rounded per row then summed (₪ without agorot everywhere) · `gap_pct.compare.direction` gets a `flat` branch and `null` when the previous denominator is 0 · m09 `window.label` = *"נכון להיום"* and `from`/`to` = `null` (the tab must not build a period subtitle from them) · m12 returns `meta.sku_count` · level-2 tile label `חוב הלקוח במדרג …` and `מדרג 90+ יום` per the mockup.
- **Tests (`reportsFinance.test.js`)** ⇒ add: the rounding-order guard through `summariseAging` (a fixture with `.4` fractions where sum-then-round ≠ per-row-round) · bucket labels equal `AGING_BUCKETS` (export the list the SQL uses as a JS constant and assert equality with the payload fixture) · the threshold comparison `>` vs `>=` for one boundary value.

## After applying E2
Re-run every finding's own evidence query/call (signed-in Node script as FINANCE + RECRUIT; delete it after): F1 with `p_to = '2026-06-30'` ⇒ buckets unchanged 10/13/8/1/3 and `p_asof = '2026-09-10'` reproduces the oracle · F2 `position('0.15' in prosrc)` = 0 and the param name present · F3 the five `compare` objects present with the numbers above · F4 level-2 `customers` = 1 · F5 grep the payload for `\d{4,}` digits without a separator inside sentences ⇒ none · F6/F7/F8/F9/F10 each shown. `md5(prosrc)` of the four functions equals the new file's bodies. `npx vitest run src/lib/reportsFinance.test.js src/lib/projectFinance.test.js` green · eslint · prettier · CR = 0 (perl).

## Output (final message = data, also written to `<scratchpad>/results/p2fix-finance.json`)
`{ "migration": "...", "applied": true, "signature_change": "...", "per_finding": [ { "id": "F1"…, "fix", "reverified_by", "result" } ], "tests", "not_verified", "blind_spot", "assumed" }`
