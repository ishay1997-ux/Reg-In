# Phase 3 · common brief for the four tab UI builders (read this, then your tab file)

**Session type:** build. **Repo:** `C:\Users\ishay\Reg-In`, branch `ishay/module-11-build`. Four builders run concurrently, one per tab, each owning ONLY its files: `src/modules/11_reports/tabs/<Tab>Tab.jsx` (+ any `tabs/<tab>/*.jsx` files you create) · `src/modules/11_reports/tabs/<Tab>Tab.test.jsx` · `src/lib/onboardingCopy.m11.<tab>.js`. **Never** touch `ReportsPage.jsx`, `api.js`, `components/*`, `reportsCatalog.js`, `onboardingCopy.js`, other tabs, `src/lib/reports*.js`, migrations. **Never commit.** Report in English; UI strings in Hebrew.

## 🔴 The one top mine
**Copy the onboarding layer from the card's §⑩ table, never from the mockup HTML.** The four approved mockups use four different markup conventions for the same layer (`.hint/data-onb` · `data-key/.oa` · `data-hint/.imh` · `.hint-line/.hm`) and none of them is the production shape — the production shape is `<Hint id="reports.<slug>.<field>" />` + a key in your copy file. **A wrong key renders `null` silently in production.** Prove it: your report lists every key you placed, and `npx vitest run` includes a test that every `<Hint id>` in your tab resolves to an entry in your copy file (import the file and assert). And: **no data count enters the copy** (C3) — only structural numbers; convert every `<span class="ltr">X</span>` to LRI…PDI.

## Read first, in this order (MUST — the reading floor)
1. `docs/micro_guides/module-11.md` — **§2ב C1–C8 in full** · §3.3(ג) (the rulings each surface must make visible) · §6 steps 3.1–3.5 (your tab's row in the table; the trap on where to copy from) · §7.
2. **The foundation handoff:** `<scratchpad>/results/p3-foundation-handoff.md` — the tab component props contract, `callReport`, the shared components' props (`KpiTile` · `ChartCard` · `ReportTable` · `ExportBar` · `Envelope` · `DrillCrumbs`), how copy files are registered, what not to touch. Then read the actual components in `src/modules/11_reports/components/` and `ReportsPage.jsx` (the truth is the code, the handoff is the map).
3. Your tab's card file, **all four surfaces, sections ①–⑩ in full** (anchors in your tab file) — §③ (every number's source and precision) · §④ · **§⑤ interactions (drill levels, clickable rows, export, filters)** · §⑥ definitions · §⑦ · **§⑧ states** · **§⑩ onboarding keys + sentences**.
4. Your tab's **approved mockup** in full (by ranges): structure and order of tiles/charts/tables per surface, the "אז מה" line, the population line, the definitions footer, the empty/masked states. Appearance ⇐ mockup (C2); labels ⇐ `spec.md §1.4` (verify each label in your tab's row there, byte for byte).
5. The RPC payloads you render: the migration `supabase/migrations/*module11_<letter>_rpcs_<tab>.sql` (what each function actually returns — keys, tile keys, chart shape, columns) and `<scratchpad>/results/p2-<tab>.json`.
6. `processes-approved.md` — §📐 (772–810) · §🏷️ (743–770) · §🔒 (688–700) · §📊 chart per page (667–686) · your §📑ב rows.
7. `design-contract.md` §① · §② · §③ · §⑤ (chart principles; the 16/09 verification notes the foundation wrote back) · §⑧.
8. `onboarding-layer-contract.md` §3 · §4ב · §5ב · §5ג · `docs/plans/ui-copy-styleguide.md` + `stage2-review/m11-copy-rules.md` §1 and **§4** ("what I did not change, and why" — read before you touch any wording).
9. `src/components/Hint.jsx` · `src/lib/onboardingCopy.js` header (entry shape: `{ guided: '…' }`) · `src/lib/reportsFormat.js` · `src/lib/reports<Tab>.js` (pure helpers you may call) · `src/modules/07_dashboard/DashboardPage.jsx` (how a page consumes `PermissionAwareEmpty`).
10. `~/.claude/references/ishay-visual-taste.md`.
Probably NOT needed (say so if opened): other tabs' cards/mockups · `processes-approved.md` beyond the sections named.

## The live permission matrix (measured 16/09/2026 05:2X — the truth for masking and for E2E expectations)
| role (E2E env) | דיילות | כספים | לקוחות | דו"חות (page gate) |
|---|---|---|---|---|
| מנכ"ל (`CEO`) | edit | edit | edit | edit |
| מנהלת כספים ולקוחות (`FINANCE`) | **blocked** | edit | edit | edit |
| מנהלת גיוס ושיבוץ (`RECRUIT`) | edit | **blocked** | **blocked** | view |
| מנהלת לוגיסטיקה (`STAFF`) | **blocked** | **blocked** | **blocked** | view |
| מנהלת פרויקטים (`PROJECTS`) | edit | **blocked** | edit | view |
⇒ everyone enters `/reports`; the הנהלה and כספים tabs open on `'כספים'`; FINANCE sees דיילות masked; RECRUIT sees only דיילות; STAFF sees all four masked (the no-permission envelope) — **the expected result, not a bug**. `view` on `'דו"חות'` means: no "אשר להצגה"/"הרץ ניתוח" for RECRUIT/STAFF/PROJECTS.

## What each surface must have (the checklist you tick per surface in your report)
- Title + question from the catalog (rendered by the shell — do not repeat) · **population line (📐2)** · **period in subtitle (📐17)** · tiles with the 📐1 comparison half and 📐3 window · ≤ 2 charts (`⏳10`) through `ChartCard` with the §📊 type · table through `ReportTable` sorted by the displayed metric (📐7), **whole row clickable** where a drill/door exists (ruling 19), 📐18 owner column where the card says · **"אז מה" line (📐23)** · **definitions line (📐16)** · **export** through `ExportBar` with the two caption lines and the three empty states · **five envelope states (📐10)** through `Envelope` · **every overview tile is a door** (ruling 33, `tiles[].target` → navigate via the shell's URL state) · `meta.missing_params` ⇒ *"חסר פרמטר מערכת: X"* and no dependent tile · drill (📐13) for your drill surface: crumbs, tiles/so-what follow the level, export exports the level, state in URL (all via the shell's `onDrill`) · `<Hint>`s from §⑩ at the anchors the card names · **deletion test:** at onboarding mode 0 everything above still renders.

## Tests you write (`<Tab>Tab.test.jsx`, `vi.mock('@/supabaseClient')`, `vi.mock('recharts')`, mock `../api`)
Per surface with a fixture payload in the C8 shape (build fixtures from the baseline numbers): renders the tiles with the §1.4 labels and formatted values · population line text · so-what line · table rows and the clickable row calls `onDrill`/navigates · empty payload ⇒ the card's §⑧ empty state text · api error ⇒ the error envelope with *"נסי שוב"* and retry re-calls · `missing_params` ⇒ the Hebrew message · every `<Hint id>` resolves · export button disabled on no rows with *"אין שורות לייצא"*.

## Gates you run before reporting
`npx vitest run src/modules/11_reports/tabs/<Tab>Tab.test.jsx src/modules/11_reports` · `npx eslint src/modules/11_reports/tabs src/lib/onboardingCopy.m11.<tab>.js` (cognitive complexity ≤ 20 — split surfaces into small components) · `npx prettier --check` same · `npm run dup` (**jscpd — if your tab trips it, factor into a component under `tabs/<tab>/`, never copy between surfaces**) · `grep -rc $'\r' <your files>` all 0.

## Output (final message = the JSON you write to `<scratchpad>/results/p3-<tab>.json`)
`{ "tab", "files", "surfaces": [ { "id", "checklist": { "population": bool, "tiles_compare": bool, "charts": int, "table_sorted": bool, "row_clickable": bool, "so_what": bool, "definitions": bool, "export": bool, "states": bool, "doors": bool, "drill": bool|null, "hints": ["reports.…"], "deletion_test": bool } , "deviations_from_mockup": [ { "what", "why", "rule" } ], "labels_changed": [ { "from", "to", "rule" } ] } ], "strings_authored": [ { "text", "rule" } ], "tests": "<summary>", "gates": {...}, "assumed" (each tagged הנחתי with the source you checked), "not_verified", "blind_spot" }`

כל עובדה כאן ניתנת לערעור — אם מדדת אחרת, תקן אותי עם המדידה.
