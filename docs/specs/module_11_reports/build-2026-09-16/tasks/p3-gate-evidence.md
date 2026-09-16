# P3-G · Gate agent and P3-S · Evidence agent (two agents, one brief — your dispatch names which you are)

**Repo:** `C:\Users\ishay\Reg-In`, branch `ishay/module-11-build`. Both READ-ONLY on the repo (temporary scripts only in `<scratchpad>`; credentials from `.env.local` `E2E_*` never printed). Report in English. **Exit codes come from the log files, never from memory** — the dialect hook blocks piping gate output to `head`/`tail`: redirect to a file, then `echo exit=$?`.

## P3-G · Gate
1. `npm run gate > <scratchpad>/results/gate.log 2>&1; echo exit=$?` — the full gate (lint · prettier · unit · build · jscpd 3 % · knip · audit · bidi · check:context · check:docs-structure). If `format:check` dies on memory (STATUS 11/09 precedent), run `npx prettier --check` per top-level folder and say so.
2. `npm run check:declared-counts` · `npm run check:iron-rules` (if present in `package.json`) — each to its own log.
3. `npx vitest run > <scratchpad>/results/unit.log 2>&1; echo exit=$?` — the whole suite; report the totals line and every failing test name.
4. `npm run build` output size line for the main chunk (recharts is the first chart library in the repo — report the delta vs `git stash`-free baseline is NOT required; just the number).
5. For every failure: file, line, the exact message, and **which agent owns the file** (map by `tasks/p3-tab-*.md` ownership; `components/**` and `ReportsPage.jsx` = the orchestrator). Do not fix.
Output (final message = data, also `<scratchpad>/results/p3-gate.json`): `{ "gate_exit", "steps": [ { "name", "exit", "failures": [ { "file", "line", "message", "owner" } ] } ], "unit": { "files", "tests", "failed": [...] }, "jscpd": { "percent", "clones_in_m11": [...] }, "knip": [...], "build_main_chunk_kb", "not_verified", "blind_spot" }`.

## P3-S · Evidence
Dev server on port **5189** (`npx vite --port 5189 --strictPort`); Playwright script (not a spec) with the `login()` pattern from `e2e/permissions.spec.js`; viewport 1280×800.
1. **Screenshots:** every one of the 16 surfaces × identities CEO · FINANCE · RECRUIT · STAFF × onboarding modes 0 · 2 (set the mode through module 9's setter per identity; read + RESTORE the original values; re-login after each change) ⇒ `<scratchpad>/results/evidence/<identity>-m<mode>-<surface>.png` (masked/no-permission screens count — they are the expected result for blocked identities). Plus: מ3 and מ9 at drill level 1 and 2 (CEO); the export caption open; the error envelope (`page.route` abort) once; the empty-after-filter envelope once.
2. **The 5-pass table of `src/CLAUDE.md §4`** per surface (direction · inventory · consistency · copy · empty input) as CEO mode 2 — from the screenshots and the DOM, with one line of evidence each.
3. **Measurements per surface (CEO):** `scrollWidth − clientWidth` (must be 0) · console error count (must be 0) · number of `<Hint>` texts visible at mode 2 vs 0 · number of charts (≤ 2) · number of tiles · table row count on page 1 vs the pager total.
4. **A contact sheet:** one HTML file `<scratchpad>/results/evidence/index.html` that lists the PNGs with captions (the orchestrator looks at this once).
Output (final message = data, also `<scratchpad>/results/p3-evidence.json`): `{ "screenshots": n, "surfaces": [ { "id", "identity_matrix": { "CEO": "rendered|masked", … }, "scroll_overflow_px", "console_errors", "hints_m2", "hints_m0", "charts", "tiles", "rows_page1", "pager_total", "five_pass": { "direction", "inventory", "consistency", "copy", "empty_input" } } ], "anomalies": [ { "surface", "what", "evidence" } ], "not_verified", "blind_spot" }`.
