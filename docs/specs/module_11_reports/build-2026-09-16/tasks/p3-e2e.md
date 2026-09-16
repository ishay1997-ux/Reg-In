# P3-E2E · Playwright journeys for the reports module + smoke anchor + accessibility

**Repo:** `C:\Users\ishay\Reg-In`, branch `ishay/module-11-build`. **Files you own:** `e2e/reports.spec.js` (new) · `e2e/smoke-anchors.json` (add a `reports` block, same shape as the others) · `e2e/smoke.spec.js` (one stanza for `/reports`, copied from the neighbours) · `e2e/accessibility.spec.js` (add `/reports` to its route list). Nothing else. **Never commit.** Report in English. Credentials only from `.env.local` `E2E_*`, never printed.

## Read first
`e2e/CLAUDE.md` (the mines: floating surfaces close on blur ⇒ `mouse.down()`/`mouse.up()`; no shared login helper — each spec defines `login()` identically, copy it from `e2e/permissions.spec.js`; ports 5173 dev / 4173 preview) · `e2e/permissions.spec.js` and `e2e/dashboard.spec.js` (the idioms) · `e2e/smoke-anchors.json` + `e2e/smoke.spec.js` (the anchor contract) · `docs/micro_guides/module-11.md` §2ב + §5 ("what counts as working") + §9 D-9 (the live permission matrix is in `<scratchpad>/tasks/p3-common.md`) · `src/modules/11_reports/ReportsPage.jsx` + `reportsCatalog.js` (test ids: `report-<slug>`, `report-tiles`, `report-table-card`, `report-row-drillable`, `report-pager`, `report-population`, `report-so-what`, `report-missing-params`, `report-extra-table`; the tab buttons `role="tab"`; the URL state for tab/surface/drill/period — read how the page writes it) · the four builders' reports `<scratchpad>/results/p3-<tab>.json` (what exists on each surface, which test ids they added).

## Journeys (each its own `test`, serial where state is shared)
1. **CEO opens `/reports`:** four tabs, none masked; default surface renders tiles + population line + so-what; the period chips change the URL and the population/subtitle text; the customer filter shrinks a customer-filterable surface.
2. **STAFF (מנהלת לוגיסטיקה) opens `/reports`:** all four tabs are `role="tab"` with `aria-disabled`/masked text *"לא זמין בתפקידך"* — **the correct result, not a bug**; the default surface shows the no-permission envelope, never an empty table.
3. **FINANCE:** דיילות masked, the other three open. **RECRUIT:** only דיילות open.
4. **Drill on מ3 and מ9 (CEO):** click a `report-row-drillable` row ⇒ crumbs appear, tiles change, the URL carries the drill state; reload keeps the level; the crumb returns to the root; export caption names the level.
5. **Export:** the export button downloads an `.xlsx` (`page.waitForEvent('download')`) on a surface with rows; on a surface with 0 rows after a filter the button is disabled with *"אין שורות לייצא"*.
6. **Onboarding mode 0 vs 2:** set the mode through module 9's setter for the CEO identity (read + RESTORE the original value in `afterAll`; re-login after the change): at 2 at least one `Hint` text is visible on each tab's default surface; at 0 none — and the base elements (population, so-what, definitions, tiles, table) are still there (the deletion test).
7. **מ22 without a run (fixture, not live):** `page.route` the RPC `report_m22_notes` to return a payload whose `meta.export_blocked_reason` is *"אין שורות לייצא — טרם אושרה ריצת-ניתוח"* and no rows ⇒ the surface says *"טרם אושרה ריצת-ניתוח"* (take the exact text from the builder's report) and export is blocked with that reason. Do NOT click "הרץ ניתוח" against the live function (quota) — assert the button exists for CEO (`edit`) and is absent/disabled for RECRUIT (`view`).
8. **Network failure ⇒ "נסי שוב":** `page.route` abort on one RPC ⇒ error envelope with *"נסי שוב"*; un-route; click ⇒ the surface renders.
9. **Accessibility:** `/reports` added to `accessibility.spec.js` (axe or the existing checker — follow the file); zero serious/critical violations on the default surface of each tab as CEO.
10. **Smoke anchor:** `reports` block in `smoke-anchors.json` (the strings the smoke reads must exist on the page) + the stanza in `smoke.spec.js`.

## Run
`npx playwright test e2e/reports.spec.js e2e/accessibility.spec.js --reporter=line > <scratchpad>/results/e2e-reports.log 2>&1; echo exit=$?` against a dev server you start on **port 5173** (this spec is the only one allowed on 5173 — coordinate: if 5173 is busy, wait, do not kill anything); then `npm run smoke` (its own log + exit code); then `npx playwright test e2e/hostesses.spec.js e2e/smart-match.spec.js` once (m4 regression after the step-1.5 change) — report the exit codes from the logs, never from memory. Flakes: rerun once, report both results.

## Output (final message = data, also `<scratchpad>/results/p3-e2e.json`)
`{ "files": [...], "journeys": [ { "n", "name", "result": "pass|fail|flaky", "evidence" } ], "exit_codes": { "reports_spec", "accessibility", "smoke", "m4_specs" }, "test_ids_missing": [...], "not_verified": [...], "blind_spot": "..." }`
