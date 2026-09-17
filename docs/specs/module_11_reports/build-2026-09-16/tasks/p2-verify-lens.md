# P2-V · Adversarial verifier for one tab's four RPCs — READ-ONLY. Your job is to REFUTE, not to confirm.

**Session type:** review. **Repo:** `C:\Users\ishay\Reg-In`, branch `ishay/module-11-build`. You do not edit any file. You do not trust the builder's report — you re-measure. Report in English.

## 🔴 The one top mine
**A real measurement of the wrong population is the error class that survived every "I checked" in this module** (`spec.md §🔢`: five wrong aging buckets in one day, all from measuring a reconstruction of the definition instead of the definition). For every number the RPC returns, open the card's §③ line that defines it — population · window `(from, to]` · exclusions · comparison basis · precision — and derive the expected value from that definition with your own live query, **then** compare with the RPC's SQL. Report `definition · your value · RPC value · baseline value` per metric.

## Read first
1. `docs/micro_guides/module-11.md` §2ב (C5 · C7 · C8 especially) · §3.3 (the rulings that must be visible) · §5 · §7.
2. Your tab's builder task file `<scratchpad>/tasks/p2-tab-<tab>.md` and its report `<scratchpad>/results/p2-<tab>.json` — the claims you will try to refute.
3. The migration file the builder wrote (`supabase/migrations/*module11_<letter>_rpcs_<tab>.sql`) and its lib files `src/lib/reports<Tab>*.js`.
4. The card file for the tab (line anchors in the tab task file): **every surface's §③ and §⑤ in full.**
5. `docs/specs/module_11_reports/spec.md §🔢` · `stage2-review/signoff-baseline-2026-09-10.md` · `processes-approved.md §📐` (772–810) and `§📑ב` rows for the tab.
6. 🔴 **The conflict-question rule, verbatim (`.claude/skills/_shared/discipline.md`):** *A finding that contradicts a RECORDED decision is not a fix instruction — it is a conflict question. Before a reviewer/verifier reports a defect, it searches the decision registers in its field of view (the module's rulings registry · the ledger · declared limitations · why-comments); a contradiction is reported as the TWO sources side by side, never patched. The boundary this must not blur: a MECHANISM measured broken is a real defect even with a recorded ruling behind it; what may not be "fixed" on a reviewer's own authority is the recorded PRODUCT decision.*

## Tools
- MCP `execute_sql` **read-only** (ToolSearch `select:mcp__5c4d90c8-bdb0-4e4a-bd64-299d0299d315__execute_sql`, project `yfeovxppnfoafmfbdfvh`). The functions are already applied: call them **as the postgres role will fail on `assert_module_permission`** (no `auth.uid()`) — so run the function BODIES as queries (copy the SQL from the migration, substitute literal params) and run your own independent queries from the definitions. No writes.
- `npx vitest run src/lib/reports<Tab>.test.js` — run it, and then **mutation-probe by reasoning only** (you may not edit files): for each test, state what wrong implementation would still pass it.

## Lenses (answer each, per surface)
1. **Population:** does the SQL's `where` equal the §③ population sentence and the 📐2 text the RPC returns? Exclusions present? `n` in `population.n` equals your count?
2. **Window:** half-open `(from, to]`? Israel time before date truncation? Default window = the card's?
3. **Definition:** aging vs DUE date (not send date), negative ⇒ 0 ⇒ שוטף; Gini population variant; `coalesce(final_profit, gross_profit)` with `frozen_count`; `planned_qty`; median not mean where the card says median; `nullif` on denominators; 📐12 minimum sample.
4. **Permission:** first statement is `assert_module_permission('<correct owning module>', …)`; grants revoked from `public, anon, authenticated` and granted to `authenticated`; `security definer` + `set search_path to ''`; every relation `public.`-qualified.
5. **Contract (C8):** every top-level key present; tile labels byte-equal to `spec.md §1.4`; `compare` present on every tile (ruling 4/📐1); `so_what` action-first (📐23); `definitions` line (📐16); `meta.missing_params` populated when a param is absent (test by reasoning: what happens if the row is missing — is there a silent default anywhere?).
6. **Baseline:** every baseline number for the tab reproduced by your own query — `match / mismatch` with the reason.
7. **Rulings:** each ruling the tab file lists — where in the payload is it visible? Missing ⇒ finding.

## Output (final message = data)
`{ "tab", "findings": [ { "surface", "severity": "blocker|major|minor", "lens", "claim_refuted", "evidence": "<query + result>", "conflict_question": null | { "source_a", "source_b" } } ], "baseline_table": [ { "metric", "definition_ref", "independent_value", "rpc_value", "baseline", "verdict" } ], "tests_pass_but_would_not_catch": [...], "not_verified", "blind_spot" }`
Empty `findings` is a legitimate answer — say so explicitly with what you measured.
