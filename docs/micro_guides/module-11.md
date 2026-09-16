# REG-IN — Micro-Guide | Module 11: Management Reports

> ✅ **APPROVED AND ACTIVE — renamed from `module-11.draft.md` on 11/09/2026.** From this moment
> iron rule 15 is enforced for m11: step transitions update the status header **in the same session**,
> and a deviation gets an `↳ as-built` note plus a line in §9.
> **Nothing in it has been executed yet** — phase 0, step 1.0 is the next action.
>
> **What it went through before the rename:** a fresh-context reviewer on three lenses (compliance ·
> Contrarian · Outsider) and an **execution rehearsal** that walked it as the builder and stopped at
> **12 of ~30 steps**. Both sets of findings are closed in the text, and the ones deliberately left
> open are named in §9 rather than removed.
>
> **Reader:** a future zero-memory Claude session. **Language:** English, per `docs/CLAUDE.md`; Hebrew
> appears only as data — UI strings, module/role names, §7 quotes, migration names.

---

## 1. 🟢 Live Status Header

| | |
|---|---|
| **Phase** | **3 — UI, started 16/09/2026 08:2X** (four tab builders + three RPC verifier-fixers + one rounding fix, all concurrent; Phase 2 checkpoint = commit `0d520fcd`: 16 RPCs applied and byte-equal to the DB, classification 426/426 approved, `ReportSurface` extension slots). *(history:)* **2 — Logic, started 16/09/2026 05:1X** · ⏸️ **quota pacing (Ishay, 05:1X: the 5-hour usage window was at ~40 % and resets ~08:00; *"ממליץ אולי לפני פאזה 3 לחכות לאיפוס המכסה"*) ⇒ Phase 2 finishes on the current window (builders · verifiers · applies · schema refresh), the Phase-3 tab-builder army (~20 agents) launches only after the reset.** Estimated finish moved to 14:00–19:00. (Phase 1 steps 1.1–1.5 built and applied; P1 verifier + m4 E2E regression running in parallel — see §9 D-10…D-13). *(was:)* **1 — DB, started 16/09/2026 04:2X** (step 1.0 done: branch cut · MCP live `PostgreSQL 17.6` · `params`=43 · AI tables 0 · `recommended_rank` 0 · m11 params 0 · 35 open invoices). ✏️ *(was: 0 — not started)* |
| **Branch** | ✅ **`ishay/module-11-build`, cut 16/09/2026 04:2X from `origin/dev` @ `9b5ea534` (0 ahead · 0 behind at cut).** *(history:)* 🔴 ✏️ **16/09/2026 — cut a FRESH branch from `dev`.** `ishay/dashboard-legend-ucd` is **merged and dead**: `git rev-list --left-right --count ishay/dashboard-legend-ucd...origin/dev` ⇒ **0 ahead · 6 behind**, and the six it lacks include this module's own rulings. **Building on it reads stale spec files with no symptom.** See §9 D-1. |
| **Spec** | `docs/specs/module_11_reports/spec.md` — approved 11/09/2026 |
| **Surfaces** | **16**, in **4** files under `docs/mockups/management-report-screen/approved/` |
| **Deadline** | 🔴 **Conference 15/10/2026.** m11 is zero lines of code today. |
| **DB items owed** | **4** — `db_roadmap.md` M11-2 … M11-5 |
| **§7 items** | **0 open — and there are SIX, not four.** ‏§7.22 · §7.58 · §7.83 · §7.93 · §7.95 · §7.97, all 🟢 (verified 11/09). ✏️ **Corrected 11/09 — this row still listed four after §3.1 was fixed, i.e. the correction never travelled up to the header a resuming session reads first.** The two it dropped are the two that matter to step 1.4. |

---

## 2. 📦 Context Packet for Claude

### 2.1 Purpose (≤3 lines)
One screen — **"דו"חות"** — four role tabs, each an overview plus three report pages: **16 surfaces**.
**Read-only**: it changes no business datum and replaces no existing screen. It answers what the
operational screens were never built to answer — *"את מי לגבות השבוע" · "את מי לא לשלוח" · "למי להתקשר החודש"*.

### 2.2 Capabilities delivered vs deferred
**Delivered (16):** ‏4 overviews *(מ2 · מ7 · מ14 · מ19)* + 12 report pages
*(מ3 · מ4 · מ6 · מ8 · מ9 · מ12 · מ15 · מ16 · מ17 · מ20 · מ21 · מ22)*.
**⏸️ Deferred by ruling 30, drawn and kept in the spec with a return trigger:** מ5 · מ10 · מ11 · מ13 ·
מ18 · מ26. **מ13 is the first replacement.**
🆕 **⏸️ Deferred by Ishay's ruling 15/09/2026, same return-trigger treatment: מ23 · מ24.**
*(‏מ23 = the no-show risk dot beside a hostess's name in m4's `SmartMatchPage` · מ24 = the
"פירעון צפוי" column in m8's `FinancePage`, tab "ממתין לתשלום".)* 🔴 **Why this row had to be
written at all: they had no step in ANY phase, and three files disagreed about whether they
were m11's job** — `processes-approved.md` §1-ג2 called each *"אדווה לקוד מוזג = **פריט-בנייה של
מ11**"*, `data-set.md` §summary marked both *"מחוץ-להיקף (§מ2–§מ22 בלבד)"*, and
`processes-approved.md` §⏳ג item 1 stated flatly *"מ23 · מ24 — **אין להם בית**"*. **Ruling 30
counted 16 built and 6 deferred = 22 of the 26 rows; these two were in neither list**, which is
how they stayed invisible. ⚠️ **And the cost is what settled it, not the code size:** each is a
handful of lines, but each lands in **merged, working code** ⇒ a full E2E regression of m4 and
of m8 respectively, plus its own approval gate — the exact expense ruling 30 cut scope to avoid.
**Return trigger: after the conference, together with the other six.**
**⬜ No standalone mockup file:** **מ1 — the shell** *(4 tabs · report chip row · global filters · the five
envelope states)*, מ23, מ24, מ25. ✏️ **11/09 — and מ1 is NOT a gap, which is the opposite of what this line said until today.**
Its markup is `design-contract §⑥` *(401 lines, five states included)* + §⑥.1, **and all four approved
mockups render the live shell** *(measured: each carries `side`·`tabs`·`picker`·`filters`·`stamp`; three of
four carry the masked tab)*. **A fifth file was built, shown to Ishay and deleted on his ruling** — `§⑥.2`
carries the reasoning. **See §9 D-2.**

### 2.3 Existing files this module touches (non-additive surface)
| File | Why | Risk |
|---|---|---|
| `src/App.jsx` | ✏️ **the route already exists** — `App.jsx:216`, `path="reports"`, wrapped in `<ProtectedRoute allow='דו"חות'>` around `UnderConstruction`. ⇒ **this is a replacement, not an addition** | the guard is already there; `App.routes.test.jsx` keeps it |
| ~~`src/components/Sidebar.jsx`~~ ✏️ **wrong path** | the file is `src/components/layout/Sidebar.jsx`, and it derives from `BUSINESS_MODULES` — **the `'דו"חות'` row with `/reports` is already at `src/lib/constants.js:24`** | **nothing to add here.** Two facts this guide had wrong until 11/09 |
| `src/modules/09_settings/**` | 4 new `params` rows surface in the existing screen | none new |
| `src/modules/04_hostesses/api.js` | `insertInviteRow` · `writeInviteToken` gain `recommended_rank` | 🔴 **merged m4 code ⇒ full m4 regression** |
| `src/lib/onboardingCopy.js` | +70 keys | wrong key ⇒ `null`, silent in production |

### 2.4 Files to create
`src/modules/11_reports/` — `ReportsPage.jsx` (shell) · `api.js` (all queries) · one component per tab ·
`src/lib/reports*.js` for pure logic + its `*.test.js` beside it.

### 2.5 DB tables and migrations — **the only four**
`db_roadmap.md` **M11-2** `feedback_ai_runs` · **M11-3** `feedback_ai_insights` ·
**M11-4** `assignments.recommended_rank integer null` · **M11-5** four `params` rows
*(`מכפיל_מרווח_מתרחק`=1.5 · `סף_סטיית_תקציב_אחוז`=15 · `מקדם_אמינות_אדום`=**0.87** ·
`מקדם_אמינות_ענבר`=**0.95**)*.
🔴 **The last two were 0.8/0.9 in `db_roadmap` until 11/09** — ruling 35 moved them after measuring
that at 0.8 the queue was empty and at 0.9 amber had zero members. **Use 0.87/0.95.**

### 2.6 Dependencies
m6 (projects) and m8 (finance) merged and live. m9 owns the settings screen the params appear in.
m4 owns `assignments`. **m11 owns none of them** — it reads.

### 2.7 🔑 Test identities (MANDATORY — RLS + role-gated UI)
Each tab opens on the module that owns its data *(ruling 2)*: הנהלה+כספים ⇐ `'כספים'` ·
דיילות ⇐ `'דיילות'` · לקוחות ⇐ `'לקוחות'`. **Test with at least: מנכ"ל · מנהלת כספים ולקוחות ·
מנהלת גיוס · מנהלת לוגיסטיקה** — the last one is the ⏳1 case, **closed 10/09 23:0X**: she is `blocked` on
module 6, so the finance tab does not open for her and **report 11 is correctly unreachable**. ✅ **That is
the expected result, not a bug** — the matrix stays, she works through her own m5 logistics screen, and the
page declares the gap on screen *(`cards-finance.md` ⑧12.7)*. 🔴 **Test that she is masked out, and that the
declaration is visible — do not "fix" it by granting a permission.**

### 2.8 Product source of truth
`docs/specs/module_11_reports/spec.md` → its numbered reading list. **Nothing else.**

### 2.9 Environment facts
`@/supabaseClient` *(not `@/lib/`)* · Vite on **5173** · Tailwind v4 with **no config file** ·
Radix is the unified `radix-ui` package · timestamps `DD/MM/YYYY HH:MM` from the clock.

---

## 2ב. 🔒 Build conventions — ruled 16/09/2026 (every agent task file opens with "read this section in full")

> **Source:** Ishay's rulings in the planning chat of 16/09/2026 (quoted verbatim where they are his) + the approved spec set.
> **Precedence:** on behaviour · data · population · permissions the approved spec (tier 2) wins over this section; on *how we work* this section wins.

### C1 · Session mode
- **One writing session — this one.** Agents write only the files their task file names; **agents never commit** — the orchestrator commits by explicit pathspec.
- **No stop-points, by Ishay's rulings 16/09/2026:** *"כן — מזג ל-dev וגם ל-main בלי לשאול"* · typed-echo waived *"על כולם — מיגרציות (~8) · חתימת-DoD · ריצת-הזריעה של הסיווג"* · **one-time, not a precedent.**
- **Product-flavoured gaps:** the most spec-faithful reading + tag `הנחתי` + a row in §9 + the morning table for Ishay; stop only if a gap blocks a whole surface.

### C2 · What binds appearance vs behaviour (Ishay: *"רציתי לפי המלצתך אבל שכן תיקח את המוקאפ בחשבון מסוים אבל במידה"*)
- **Structure · order · which tiles/charts/tables ⇐ the approved mockup** (`docs/mockups/management-report-screen/approved/0N_tab_*.html`; surfaces are `section.page#p1..p4`, customers `#c1..c4`).
- **Labels ⇐ `spec.md §1.4` verbatim** (74 tile labels · 19 page titles). A label changes **only** when it breaks a written copy rule (`stage2-review/m11-copy-rules.md` כ1–כ20 or `docs/plans/ui-copy-styleguide.md`) — and the change is logged with the rule that fired.
- **Pixels** (spacing · sizes · radii · card widths) ⇐ `design-contract.md` + Ishay's taste (`~/.claude/references/ishay-visual-taste.md`: controls hug their content · no over-information · real colours, teal `#0F766E`).
- **Behaviour · data · population · permissions · states ⇐ the cards** (`stage2-cards/cards-*.md` §③ · §⑤ · §⑧ · §⑩) and `processes-approved.md` — **always, even against the drawing.**
- Status labels from `PROJECT_STATUS_LABELS` (`src/lib/projects.js`), never re-translated. Report names from `processes-approved.md §🏷️` (short name = chip · question = subtitle · no report numbers on screen).
- ⏸️ Deferred surfaces (מ5 · מ10 · מ11 · מ13 · מ18 · מ26 · מ23 · מ24) are **not built** even where they are drawn in the finance file.

### C3 · Onboarding layer — modes 0 and 2 only (Ishay: *"מצב הטמעה צריך מצבים 0 ו-2"*)
- Every m11 `<Hint id="reports.<slug>.<field>" />` carries **`guided` text only**; no `pointer` text is authored.
- Keys copied **verbatim from each card's §⑩ table** (never from the mockup HTML — the four files use four different markup conventions). `<span class="ltr">X</span>` ⇒ `U+2066 X U+2069` (LRI…PDI). **No data counts in copy** — structural numbers only (thresholds · windows · scales · formula constants). The Gini comparison hint injects both `n` from the query.
- **Deletion test per surface:** at mode 0 the page is fully usable. The population line (📐2), the "אז מה" line (📐23) and the metric-definitions line (📐16) are **base**, never hints.
- m11 copy lives in `src/lib/onboardingCopy.m11.<tab>.js` (one file per tab, owned by that tab's builder) and is spread into `src/lib/onboardingCopy.js` by the foundation step.

### C4 · RTL and numbers
- Physical Tailwind utilities only (`mr-`, `pr-`, `right-0`); never `ms-/me-/ps-/pe-/start-/end-`. Every Radix portal surface gets `dir="rtl"`.
- Money `1,250 ₪` (amount · NBSP · sign) through the existing formatter; ₪ without agorot · % one decimal · Gini two decimals (📐4).
- Charts: `<div dir="ltr">` around `ResponsiveContainer`; Hebrew title outside it; tooltip box `dir="rtl"`; the time axis runs LTR inside the RTL page (ruled) — the 12 principles of `design-contract §⑤` bind, and its `לא אומת` items are verified in a real browser by the foundation step.

### C5 · Data access
- **One RPC per surface:** `report_m<NN>_<slug>(p_from date, p_to date, p_customer_id integer default null, p_drill jsonb default null) returns jsonb` = `{population, tiles, chart, rows, meta}` · `language plpgsql stable security definer set search_path to ''` · every relation `public.`-qualified · first statement `perform public.assert_module_permission('<owning module>', array['edit','view'])` — הנהלה+כספים ⇐ `'כספים'` · דיילות ⇐ `'דיילות'` · לקוחות ⇐ `'לקוחות'` · then `revoke execute … from public, anon, authenticated; grant execute … to authenticated`. **Precedent to copy:** `supabase/migrations/20260903182735_module7_dashboard_summary_rpc.sql`.
- Client: `src/modules/11_reports/api.js` `callReport(fn, params)` → `supabase.rpc` → `toError` (`src/lib/apiError.js`); tri-state loading; a network failure is **never** rendered as "no data" (`PermissionAwareEmpty state="error"` + *"נסי שוב"*).
- Missing `params` row ⇒ *"חסר פרמטר מערכת: <name>"* (pattern `missingDashboardParamsMessage`, `src/lib/dashboard.js`), never a silent default.
- Money population = ruling 36 · aging measured against the **due date** (`deriveDaysOverdue`, `src/lib/projectFinance.js`) · Gini = **population** variant (`spec.md §🔢 3.3`) · cost basis `planned_qty` (ruling 5) · comparison = company median (ruling 6).
- **Acceptance oracle:** `spec.md §🔢` and `stage2-review/signoff-baseline-2026-09-10.md` — copied digit for digit. **A mismatch is a finding to report, never a number to "fix".**

### C6 · Code shape and gates
- Shared components (`ChartCard` · `KpiTile` · `ReportTable` · `ExportBar` · `Envelope` · `DrillCrumbs` · `ReportChips` · `FiltersBar`) are the only way those things are rendered — **jscpd fails at 3 %** and sixteen similar surfaces will trip it if code is copied between pages. Cognitive complexity ≤ 20 per function (SonarJS error). knip: no unused export/file (a stub must be imported).
- Tests: pure logic in `src/lib/reports*.js` with `*.test.js` beside it, **test first**; components `vi.mock('@/supabaseClient')` and `vi.mock('recharts')`; E2E in `e2e/reports.spec.js` (login helper copied from `e2e/permissions.spec.js`; identities `E2E_CEO` · `E2E_FINANCE` · `E2E_RECRUIT` · `E2E_STAFF` = מנהלת לוגיסטיקה).
- No secrets in code or chat · LF only — CR count 0 measured with `perl -ne '$n+=tr/\r//; END{print "CR=$n\n"}' <file>` (🔴 measured 16/09/2026: `grep -c $'\r'` returns 0 on a CRLF file and the line count inside `$( )` in this Git Bash — never a gate) · Prettier-formatted (lint-staged rewrites on commit) · `format:check` may OOM on the whole tree — run it per directory and say so.
- The five `check:declared-counts` files (screens-approved · `spec.md §1.4` · the step guide · this guide's `לא אומת` count · `design-contract`) keep every declared number equal to the counted one.

### C7 · Reporting discipline for every agent
- Tag every claim `אומת-על-ידי` / `דווח-לי` / `הנחתי`, and state the method behind every number.
- 🔴 **A finding that contradicts a RECORDED decision is not a fix instruction — it is a conflict question.** Before reporting a defect, search the decision registers in your field of view (`processes-approved.md §🗳️` · this guide §3 and §9 · `spec.md §🎯` · why-comments); a contradiction is reported as the TWO sources side by side, never patched. A MECHANISM measured broken is a real defect even with a recorded ruling behind it; what may not be "fixed" on your own authority is the recorded PRODUCT decision.
- End every report with three lines: **what I did not verify · my blind spot · what I assumed.**

### C8 · The RPC ↔ UI payload contract (locked 16/09/2026 so the SQL builders and the tab builders speak one shape)

**Function names — fixed, used by both `reportsCatalog.js` and the migrations:**
`report_m02_exec_overview` · `report_m03_trends` · `report_m04_discounts` · `report_m06_staffing` (הנהלה ⇐ `'כספים'`) ·
`report_m07_finance_overview` · `report_m08_profitability` · `report_m09_aging` · `report_m12_equipment` (כספים ⇐ `'כספים'`) ·
`report_m14_hostess_overview` · `report_m15_reliability` · `report_m16_quality_cost` · `report_m17_fairness` (דיילות ⇐ `'דיילות'`) ·
`report_m19_customers_overview` · `report_m20_satisfaction` · `report_m21_drifting` · `report_m22_notes` (לקוחות ⇐ `'לקוחות'`) ·
write: `approve_feedback_ai_run(p_run_id bigint)` (`'דו"חות'` edit).

**Every read RPC returns one `jsonb` object with exactly these top-level keys** (a key with nothing to say is `null` or `[]`, never absent):

| key | type | what |
|---|---|---|
| `population` | object | `{ "n": int, "label": "<the 📐2 sentence: who is in · who is out · n>", "excluded": { "<reason>": int } }` |
| `window` | object | `{ "from": "YYYY-MM-DD", "to": "YYYY-MM-DD", "label": "<📐17 period text>" }` — half-open `(from, to]` as the cards define |
| `tiles` | array | `{ "key", "label": "<spec §1.4 label verbatim>", "value", "format": "money|percent|gini|int|days|ratio|text", "window": "<📐3>", "compare": { "value", "label": "<e.g. אשתקד / חציון-החברה>", "direction": "up|down|flat" } | null, "target": { "tab", "report", "drill" } | null }` — the `compare` half is the 📐1 comparison; `target` is the ruling-33 door |
| `chart` | object∣null | `{ "type": "bar|line|stackedBar|scatter|histogram|lorenz|pareto", "title", "series": [{ "key", "label" }], "data": [ {...} ], "xKey", "domain": [min,max] | null, "refLines": [{ "axis": "x|y", "value", "label" }], "unit" }` — at most **2** charts per page ⇒ `chart` may be an array of ≤ 2 such objects |
| `columns` | array | `{ "key", "label", "format", "align": "start|end" }` for the table |
| `rows` | array | table rows, already sorted per 📐7, each with the keys of `columns` plus `"drill_key"` when the row is a drill door (ruling 19: the whole row is the link) and `"owner"` where 📐18 applies |
| `so_what` | string∣null | the 📐23 line, action first |
| `definitions` | string | the 📐16 metric-definitions line |
| `drill` | object∣null | `{ "level": int, "levels": ["<name of level 0>", …], "crumbs": [{ "label", "drill": {...} }] }` — **only for מ3 · מ9** (✏️ corrected 16/09/2026 05:5X: 📐13 = reports 1·6·16·4 = מ3·מ9·מ13·מ5; מ17 was listed here by mistake — the foundation agent caught it; מ13 and מ5 are deferred); `p_drill` echo |
| `meta` | object | `{ "measured_at": timestamptz, "missing_params": ["<param_name>", …], "frozen_count": int | null, "notes": [ "<data caveat the card requires on screen, e.g. 'נמדד על 162 שורות מתוך 1,771'>" ], "run": { … } | null }` — `missing_params` non-empty ⇒ the UI shows *"חסר פרמטר מערכת: X"* and paints no tile that depends on it |

**Parameters:** `p_from date default null`, `p_to date default null` (null ⇒ the card's default window, computed in Israel time), `p_customer_id integer default null` (the global customer filter — ignored by surfaces the card says are not customer-filterable, and `meta.notes` says so), `p_drill jsonb default null`.
**Numbers are returned raw** (numeric, not formatted strings) — the UI formats per 📐4 through `reportsFormat.js`. Labels are Hebrew strings copied from `spec.md §1.4`; nothing English reaches the UI except keys.

**C8 amendments — conventions the builders established and every tab must follow (16/09/2026 05:5X):**
- `meta.extra_tables: [{ "title", "columns", "rows" }]` — a surface that needs more than one table (מ12: the order block and the ㉗ *"ללא מקור-עלות"* rows) keeps its main table in `columns`/`rows` and puts the others here; the tab renders each through `ReportTable`.
- `chart.label_source: '<CONST in src/lib>'` — when series keys are English DB enums (`customers.customer_type` in the aging stacked bar) the RPC returns the enum and names the Hebrew-label constant (`CUSTOMER_TYPE_LABELS`, `src/lib/customers.js`); the tab maps through it. **A legend showing `private_company` is the failure this line prevents.**
- `meta.export_blocked_reason: string|null` — the export bar's locked sentence when the table may not be exported (report 22 before an approved run: *"אין שורות לייצא — טרם אושרה ריצת-ניתוח"*).
- `meta.open_items: { "<card item>": {...} }` — a measurement the card left as 🔵 open for Ishay, returned so the morning table can carry numbers (מ7 `card_8_7_5`: calendar month vs rolling 30).
- Tile labels on screen come **from the payload** (the RPC copies them from the approved mockup where §1.4 and the mockup differ, e.g. `צפוי להיכנס ב-30 יום`); the tab does not re-derive them.
- **Six additive fields the executive builder needed for elements that exist in the approved mockup and had no home** (all optional, none changes a locked key): `tiles[].sub` (the 📑ב visible-denominator sub-row) · `tiles[].compare.note` · `columns[].sorted` (📐9 `aria-sort`) · `meta.row_total` (📐8 — the pager counts what the table shows; payload rows are capped at 50) · `chart.series[].kind` + `.axis` (line vs bar in one composed chart; left/right axis) · `chart.refLines[].axis = 'diagonal'` (the y=x line). Tab builders render them when present.
- `drill_key` shape: `{ "kind": "project|quote|year|month|tier|bucket|customer|hostess|sku", … }` — uniform across tabs. *(`sku` added 16/09 07:2X — מ12 rows key on the equipment SKU; the finance fixer used it under an explicit ruling and asked for this one-word amendment.)*
- ⚠️ **`spec.md §🔗` is wrong about `project_finance`:** `gross_profit` and `budget_deviation` are fields of the `finance_project_money(p_project_id)` return table, not columns of `project_finance` (which holds `final_profit`, `written_off`, …). Measured 16/09 by the executive builder; a doc annotation for Phase 4.
- 🔴 **Window rule (ruled 16/09/2026 06:2X after all four RPC builders measured it — §9 D-17): a CALENDAR period (the user's period filter — year/quarter/month, the cards' `01/01–10/09`) is CLOSED on both ends `[from, to]`; a ROLLING look-back window (12 months, 30 days, `(10/09/2025, 10/09/2026]` of `cards-hostesses.md:413`) is HALF-OPEN `(from, to]`.** All four migrations as written already obey it (executive/customers/finance calendar = closed; hostesses rolling = half-open). A verifier flagging a closed calendar window as a defect is applying the wrong half of the rule.
- `tiles[].detail` (customers builder) — a structured breakdown behind a tile (e.g. the מ22 sample quotes, the 'אחר' roll-up); rendered by the tab as a disclosure, never as a second tile. The ≤ 2-charts cap is `⏳10`'s measurement on the **finance** pages only; a page whose approved mockup draws more (מ20: four, and 📑ב#17 forbids merging the two reason charts) returns them all as an array.
- Dates: on `date` columns `p_from` is **inclusive** (the cards' windows `01/01–10/09` and the baseline were measured so); internal rolling windows stay half-open. A totally failed AI run returns **HTTP 200 with `status:'failed'`** — the report-22 bar branches on `body.status`, never on `res.ok`.

---

## 3. 🧭 Decisions Ledger

### 3.1 §7 items — **six, all closed, verified 11/09/2026**
✏️ **Corrected 11/09 — this listed four; the tag count is six, and a reviewer caught it.**
`§7.22` cost basis for profitability · `§7.58` budget-deviation formula · `§7.83` the read policy for
`params` · `§7.93` which profit types are shown · `§7.95` the KPI window · `§7.97` who sees the money
cards. **All 🟢, each read to its tail. No §7 item blocks this module.**
🔴 **And the two that the short list was hiding are the ones that matter to step 1.4:** `§7.22`
(which quantity is the cost basis — closed by ruling 5 as `planned_qty`) and `§7.83` (a missing
`params` row must surface as *"חסר פרמטר מערכת"*, never a silent default).

### 3.2 The rulings this guide is built on
**39 dated rulings in `processes-approved.md §🗳️`.** Load-bearing here: **30** (scope = 16) ·
**36** (money population = four statuses) · **23** (quality bar + drill-down) · **28** (onboarding
layer, two modes) · **35** (reliability coefficients) · **18** (report names) · **19** (clickable row) ·
**22** (report type determines the lens) · **2** (tab opens by the owning module's permission).

### 3.3 🔴 Ruling-coverage back-check — **RUN 11/09/2026, and this is the result**
> ⚠️ **This section previously said "enumerate all 39 and prove each maps to a step" — and the
> enumeration was never run.** A reviewer sampled ten and found six unmapped. **A check described but
> not executed is worse than no check: it manufactures assurance.** It has now been walked, all 39.

**Denominator: 39 rulings + 3 `הכרעות-מציאות` rows.** Each maps to exactly one of —
**(א) not a build item** *(process, seeding, agent method)*: **3 · 8 · 9 · 10 · 11 · 12 · 13 · 16 · 17 ·
20 · 21 · 26 · 27 · 29 · 31 · 32** — sixteen. ⚠️ **Except ruling 25's phase ב, which IS a build item and
now owns step 2ב.4.**
**(ב) has an owning step:** **1** ⇒ 2ב · **2** ⇒ §4.1–4.2 · **5** ⇒ 1.4/§7.22 · **14 · 35** ⇒ 1.4 ·
**23** ⇒ 📐13 in phase 3 · **28** ⇒ 3.5 · **30** ⇒ §2.2 · **34** ⇒ open, §3.5 · **36** ⇒ §2.5/RPC
populations.
**(ג) 🔴 surface content with no step of its own — the gap this check exists to find:**

| Ruling | What it decides | Where it must land |
|:-:|---|---|
| **4** | interactivity level: cross-filter · drill-through · global filters · a comparison half in **every** tile · an "אז מה" line on **every** page | **phase 3, every tab step** |
| **6** | no target colouring; the comparison is the **company median** | phase 3 + the RPCs that return it |
| **15** | **the shell's visual grammar — eleven items** (chip labels · the uncoloured ▲/▼ · the "אז מה" line · cross-filter colours · masked tab · the five states · the date stamp · number formats · chart colours · the customer filter · the pager) | 🔴 **step 3.0 — this IS the מ1 spec, and 3.0 pointed only at `design-contract §⑥`** |
| **19** | one drill target per page, **the whole row clickable**, no repeated "פתח…" link | phase 3, every tab step |
| **22** | the report's **type** determines the lens it is judged by | phase 3 + the closing audit |
| **24** | five in-scope decisions: report 11's scope · a column in 18 · a tile in 1/2 · a tile in 14 | the owning tab steps |
| **33** | every overview tile is **a door to a page**, including across tabs | phase 3, the four overview surfaces |
| **37** | report 13 shows no-show in **two columns** and does not choose between them | the hostesses tab step |
| **38** | the reliability component in Smart Match **stays on** — same score, two screens | phase 2, the reliability RPC |
| **39** | the discount tiers `0 · 1–5 · 6–10 · 10+` are a **ruling**, not an inheritance | the executive tab step |

🔑 **They all reach the builder through the surface cards — but "it arrives through a card" is not "a
step owns it".** ⇒ **Every phase-3 tab step reads its surface's card in full, nine sections, and the
step is not closed until each of the rulings above that touches that surface is visible on screen.**

⚠️ **And one count to settle before phase 2:** this guide says **"~16 RPCs"**; `processes-approved.md`
says **"~21 פונקציות-שרת"** and marks the choice `⚙️ הכרעת-בלופרינט`. **The guide changed the number
silently.** Decide it at step 1.0 and write it down — a drill report may need one function with
parameters or three.
✅ **Decided at step 1.0, 16/09/2026: 17 functions** — 16 read RPCs (one per built surface; drill = a `p_drill jsonb` parameter on the same function, never a second function) + 1 write RPC (`approve_feedback_ai_run`). The classification runner is an edge function, not an RPC. *(Orchestrator ruling, technical, reversible — §2ב C5 carries the signature.)*

### 3.4 🚧 Cross-module debts targeted at m11 — **every one mapped**
✏️ **Mapped 11/09.** 🔑 **And first, the arithmetic, because `grep '🚧 מ11'` on §6 returns 10 lines and
there are not 10 debts:** ‏**8 distinct items** — 7 standalone `🚧 מ11 ←` rows, plus **one embedded inside
m4's row** *(the shared email engine, `🚧 מ11 ← מ3`)*. The other two hits are a **continuation line** of
that same item and a **forward pointer** from an m5 row. ⇒ **counting the grep gives 10 and hides that one
of the eight lives inside someone else's bullet.** All eight are below.

| The debt | Where it lands here |
|---|---|
| `🚧 מ11 ← מ4` — two data holes | step 1.5 · `invite_sent_at` overwrite noted in §5 🔮 |
| `🚧 מ11 ← מ6` — the reports were invented without a guiding question | answered by the Discovery; `spec.md` is the product truth |
| `🚧 מ11 ← מ5` — cost basis | ruling 5 ⇒ `planned_qty`; §7.22, step 1.4 |
| `🚧 מ11 ← מ6` — "when did it change" | §5 🔮 row, accepted |
| `🚧 מ11 ← מ8` — the supply contract | §🔗 in `spec.md`, the profitability + salary RPCs |
| `🚧 מ11 ← (scope)` — no operating/net profit | §7.93, closed; m11 gets cash-flow instead |
| 🔴 **`🚧 מ11 ← מ5` — scope-change logistics rows** | **was unmapped. Now: phase 2, the equipment and additions RPCs** |
| ✏️ **`🚧 מ11 ← מ3` — the shared email engine + `email_log`** | 🟢 **NOT REQUIRED — and it looks required if you only read §6.** Ruled `לא-נדרש` by `processes-approved.md` **R1**: m11 sends no mail at all. The only file-producing action is *"ייצוא לאקסל"*, a **browser download, not a send** ⇒ no `email_log` entity, nothing to add to the CHECK or to `ENTITY_MODULE`. **The §6 row now says so** *(written back 11/09 — R1 mandated it and it had never been done)*. 🚫 **Do not extend `email_log` for m11.** |

🔴 **The seventh, in full, because it looks like a bug and is not:** `apply_scope_change` inserts the
`logistics` row **before** the `project_changes` row exists in the same iteration ⇒ `change_id` is not
yet available and **the function structurally cannot fill `logistics.project_change_id`**. There is no
later `update` that completes it. ⇒ **a logistics row born from a scope change carries a permanent
`NULL` there**, and "planned vs actual" is not computable on it.
✅ **And the spec already answers it — the builder must not invent a second answer:** §📑 report 11
routes scope-change rows through `project_changes.unit_cost_snapshot`, and **a row with no pointer
increments a visible *"ללא מקור-עלות"* counter** *(ruling ㉗)*. **Do not back-fill, do not guess a cost,
do not hide the row.** The counter carries ₪ as well as a count — 3 rows can be 40 ₪ or 40,000 ₪.

### 3.5 ⏳ Deferred, recorded — the phase door asks only if newly relevant
~~**⏳1** report 11 vs the logistics manager's permission~~ ✅ **CLOSED 10/09 23:0X** *(§2.7 carries the ruling; this line missed it until 16/09)* · **⏳2** "queue memory" *(first write path in a
read-only module)* · **⏳3** click-to-sort on all 22 pages. **All three are Ishay's.**

---

## 4. 🛡️ Security & Auth Model Statement (iron rule 9)

### 4.1 The gate
`<ProtectedRoute allow='דו"חות'>` on the route — **note the single quotes in JSX**, the string carries
a double-quote glyph. A typo denies everyone **silently** (deny-by-default).

### 4.2 Per-tab masking
Tabs are **masked, not hidden** *(ruling 2 + 15-ה)*: greyed name + 🔒 + the visible sentence
*"לא זמין בתפקידך"*, and `role="tab"` keeps `aria-selected` **always**.

### 4.3 🔴 The silent-failure doctrine — this module's core risk
**A table with RLS on and zero policies returns zero rows with `error: null`.** The screen lies; it
does not fail. ⇒ **`feedback_ai_runs` and `feedback_ai_insights` ship their read policy in the same
migration that creates them.** Both are gated on `'דו"חות'`.
➕ **And every write path checks row count, not just absence of error** — `.select()` after
insert/update/delete; a blocked write returns `{data:null, error:null}` on all three verbs.

### 4.4 The one write RPC
"אשר להצגה" is an **RPC gated `edit` on `'דו"חות'`**, never a client write. The classification runner
is an edge function in the `send-email` shape: JWT → `assert_module_permission('דו"חות', ['edit'])` →
Gemini key from Supabase Secrets *(🧩 Ishay step, iron rule 17)*.

### 4.5 Declared limitations
The model receives **text and score only** — no customer name, no money. The taxonomy is the DB CHECK
and is **not** model-updatable; without that there is no human↔model agreement matrix, which is
report 20's entire point.

---

## 5. 🗡️ DB Design Challenge (one line per sub-check, including "אין ממצאים")

| Sub-check | Examined | Finding |
|---|---|---|
| Keys & mutability | `feedback_ai_insights.project_id` **unique** ⇒ one classification per project, re-run replaces | אין ממצאים |
| Relationships & lineage | `insights.run_id` → `runs`; approval lives on the **run**, not the row ⇒ one flip reveals a whole batch | אין ממצאים |
| Lifecycle | `running` → `done`/`partial`/`failed`, then a separate approval. **Quota/timeout mid-run ⇒ `partial`, what was classified is kept** | אין ממצאים |
| Screen-to-column audit | every displayed figure traces to `§③` of its card; the four params are read at runtime, never defaulted | 🔴 **`recommended_rank` has no data until M11-4 ships — report 14א declares the absence and must not print `0%`** |
| 🔮 Answerable-later | re-sending an invite overwrites `invite_sent_at` (R2, m4's accepted hole) ⇒ the page says *"מאז הזימון האחרון"*, never *"הראשון"* | recorded, accepted |
| Derived-vs-stored | `coalesce(final_profit, gross_profit)` mixes a frozen and a live measure ⇒ **📑ב requires the footnote and the per-year "how many frozen" count** | covered by 📑ב |
| Permissions↔RLS | m11 writes only its own two tables + one m4 column; §7's RLS matrix row for m11 is **stale** and is corrected once, in the step that creates them | see §9 D-3 |
| Temporal columns | `timestamptz` only | אין ממצאים |
| Migration checklist | `db_roadmap §1` runs per migration; advisors after every apply | — |
| 🔴 **Snapshot integrity** | `docs/schema.sql` is **missing three `projects` feedback columns** that exist live | **see §9 D-4 — fix in step 1.1** |

---

## 6. 🏗️ Phase & Step Plan

### Model & effort per phase
| Phase | Model | Effort | Why |
|---|---|---|---|
| 1 DB | Opus/Fable | High | two new tables with RLS from birth; a column written by merged m4 code |
| 2 Logic | Sonnet | High | ~16 RPCs + pure lib functions; the acceptance numbers are hand-computed and must not be re-authored |
| 3 UI | Sonnet | High | 16 surfaces, RTL, drill-down, the onboarding layer, five envelope states |
| 4 Ripples | Sonnet | Medium | doc ripples · m4 regression · E2E |
| 5 QA & handoff | Opus/Fable | High | closing audit in a fresh session |

### Phase 1 — DB
> 🛑 **Phase-1 blocker table — each row closes into an owning step before Phase 1 opens:**
>
> | # | The trap | Owning step |
> |---|---|---|
> | T1 | `docs/schema.sql` lacks `negative_feedback_reasons` · `positive_feedback_reasons` · `positive_feedback_reason`, which **exist live**. Verifying a column against the snapshot will reject a real one | **1.1** |
> | T2 | RLS-on with zero policies = deny-all returning `error: null`. Both new tables ship their read policy **in the same migration** | 1.2 |
> | T3 | ✏️ **Corrected 11/09 — the original said "one `topics[]` over the ten categories" and that CHECK cannot be written.** They are **two lists of five** and **`'אחר'` is in both** ⇒ 9 unique strings with no sign. **Two columns — `negative_topics` and `positive_topics`** — each with its own existing list. **Still do not invent a new list** | 1.2 |
> | T4 | `assignments` PK is a **triple**; 797 duplicate pairs exist. Pull it from `pg_constraint` | 1.3 |
> | T5 | The four `params` need ceiling/floor like every other numeric param (pattern merged in PR #104) **and** a row each in `paramsRegistry.js` | 1.4 |
> | T6 | `moddatetime` lives in `extensions` — `execute function extensions.moddatetime('updated_at')` | 1.2 |
> | T7 | New functions: `revoke … from public, anon, authenticated` then grant `authenticated`; verify `proacl` | 1.2 |
> | ~~T8~~ | ✅ **Done 11/09/2026** — renamed to `module-11.md`; rule 15 is live for m11 from now on | approval |

**Step 1.0 · 🔻👤 Phase door**
**🤖 half:** `git fetch origin` · `git log origin/dev..HEAD` · MCP live (`select version()`) ·
re-measure: `params` count · policies on the two new tables (expect 0, they do not exist yet) ·
**and re-read `db_roadmap` M11-2…M11-5 to their tails.**
**👤 half:** ask Ishay whether another session is writing (rule 16). ✏️ **16/09: ⏳1 was here as "if still open" — it closed 10/09, so there is nothing to ask.**
**🔻👤 Verify:** measurements reported.

**Step 1.1 · Regenerate `docs/schema.sql`** ✏️ **method and Verify fixed 11/09.**
**Goal:** the top of the truth hierarchy stops lying before anything is built on it.
🔴 **How — it is not obvious and there is no script:** the snapshot is produced from catalogue queries
against the live DB. **The procedure is in `supabase/migrations/CLAUDE.md §3`** — read it there; it is
the only place that carries it, **and it is not on `spec.md`'s reading list.**
⚠️ **The original Verify was defective:** `grep -c 'feedback_reasons' > 0` passes on **one** match and
would never catch `positive_feedback_reason` *(singular)* — one of the three columns it exists for.
**Verify, per column:** all three of `negative_feedback_reasons` · `positive_feedback_reasons` ·
`positive_feedback_reason` present, **and** a live `information_schema` count of `projects` columns equals
the snapshot's. **A gate that only confirms the healthy state is not a gate.**
↳ **as-built 16/09/2026 04:4X (agent P1-A, Opus, 241K):** refreshed **in place**, not regenerated — the file is a curated, annotated snapshot and a wholesale regen would have deleted the annotations. **16 deltas patched:** the three `projects` feedback columns + their three CHECKs · a **34-line `seed_registry` block destroyed by merge `77a7e31b`** and the §24 header, restored from `538d781a` and re-verified live · four function-catalogue corrections (`submit_feedback`, `record_feedback` ×2, `get_project_finance_detail` = 34 cols, `replace_customer_contacts` pointer) · 62⇒63 policies · 36 base tables · six `bak_*` tables documented. Verify: three columns present each (5 · 4 · 6 hits) · `projects` 38 = 38 columns · CR = 0. **Two findings routed onward:** (a) 🔴 the six `bak_*` tables had RLS off and full `anon`/`authenticated` grants ⇒ migration H0 (§9 D-11) · (b) `schema_migrations` has no rows for `20260904230000` / `20260904233000` / `20260905004500` — that SQL ran outside `apply_migration` (§9 D-13). ⚠️ **This snapshot needs a second in-place refresh after migrations A–G land** (new tables · column · params · 17 functions) — scheduled as the last Phase-2 step. ✏️ The step text says the procedure is in `supabase/migrations/CLAUDE.md §3`; it is **§2 (last bullet) + §4 step 6** — §3 is the traps register.

**Step 1.2 · Migration A — the two AI tables + their policies**
**Files:** `supabase/migrations/<ts>_module11_a_feedback_ai.sql`.
**Verify:** `pg_policies` shows a read policy on each, gated on `'דו"חות'`; a query as a
`'לקוחות'`-only identity returns rows; as a blocked identity returns **zero with no error**, and that
is *asserted*, not observed.
↳ **as-built 16/09/2026 05:05 — APPLIED through MCP** (`20260916043300_module11_a_feedback_ai_tables.sql`, authored by agent P1-B, Opus, 328K; typed echo waived by Ishay, §9 D-9). Deviations recorded in the file header: **`free_topic text` added** (card ת2 ruling 11 requires it; `db_roadmap` M11-3 omitted it) · `sentiment integer` not `smallint` (0 smallint columns in the DB) · `run_by`/`approved_by` = `text` FK → `users(email)` · **no write policies** — the edge function writes with the service role (`send-email` precedent, `email_log` has SELECT-only policies) · `approve_feedback_ai_run(bigint)` refuses `running`, `failed` and double approval, approves `partial`. Grants revoked from `public, anon, authenticated`, granted to `authenticated`. Verification (agent P1-V, Sonnet, 257K, 05:05–05:25): policies ✅ (2 SELECT, `to authenticated`, qual on `'דו"חות'`) · constraints ✅ (topic CHECK lists byte-identical to `projects`') · `proacl` ✅ (no PUBLIC/anon) · advisors: only the expected `security_definer` WARN + 3 unused-index INFO on empty tables · signed-in probe: CEO reads ✅, RPC edit-gate refuses `view` (42501) ✅ · 🔴 **finding: no role is `blocked` on `'דו"חות'` — all five hold view/edit** (measured), so the SELECT policy's deny path is provable only for `anon` (0 rows, no error ✅), not for a real signed-in user; recorded, not fixed (the matrix is Ishay's). Tab masking uses the owning modules, where real blocks exist (matrix in §2ב… see P3 task files). H0 ✅ (six `bak_*`: RLS on, zero grants, CEO select ⇒ 42501). m4 E2E: 31/32 first pass, the one failure a login timeout under load, 2/2 on isolated rerun (protocol §4.2) ⇒ **step 1.5 regression green.** Also applied 05:2X: **H1** `20260916052500_module11_h1_one_running_ai_run.sql` (unique partial index — at most one `running` AI run; the edge-function builder's blind spot).

**Step 1.3 · Migration B — `assignments.recommended_rank`**
**Verify:** column exists, nullable; **the 5,674 seeded rows stay `NULL`** (no back-fill);
`pg_constraint` confirms the PK triple is untouched.
↳ **as-built 16/09/2026 05:05 — APPLIED** (`20260916043400_module11_b_assignments_recommended_rank.sql`). Column `integer null` + `check (recommended_rank is null or recommended_rank >= 1)` (tagged `הנחתי` in the file) + column comment. No back-fill. ✏️ **`assignments` holds 5,741 rows live, not the 5,674 this step and `db_roadmap` M11-4 state** — docs stale, DB right; all rows `NULL` either way.

**Step 1.4 · Migration C — the four `params` + registry rows** ✏️ **re-specified 11/09: it would have
aborted on apply.**
🔴 **`params.param_type` is `not null` with a CHECK on six values** *(`schema.sql:583`)*, and no source
said which one these four take. An insert without the column fails; with a guessed value it fails the
CHECK. **The anchor, read from the existing rows rather than chosen by taste:** display/alert thresholds
carry `control_alerts` *(`ימי_אזהרה_קדם_אירוע` · `שעות_תזכורת_לדיילת`)*, while `smart_match` is the
weights group *(`משקולת_*`)*.
⇒ **all four are `control_alerts`** — they are thresholds a report paints by, not scoring weights.

| `param_name` | value | `param_type` | `owner_role_id` |
|---|:-:|---|---|
| `מכפיל_מרווח_מתרחק` | `1.5` | `control_alerts` | מנכ"ל |
| `סף_סטיית_תקציב_אחוז` | `15` | `control_alerts` | מנכ"ל |
| `מקדם_אמינות_אדום` | `0.87` | `control_alerts` | מנכ"ל |
| `מקדם_אמינות_ענבר` | `0.95` | `control_alerts` | מנכ"ל |

🔴 **And the ceiling/floor do NOT live in `params`** — that table has no such columns. They live in
`src/lib/paramsRegistry.js` as type rules, and **its own comment says `min`/`max`/`decimals` are not
enforced anywhere.** ⇒ **"with ceiling/floor" means a registry row, not a DB constraint.** Say which, or
the step is a guess. *(If enforcement is wanted, that is a new decision and not this step.)*
**Verify:** four rows exist with those exact types · four matching registry rows · **a missing row
surfaces as *"חסר פרמטר מערכת: X"*, never a silent default** *(§7.83)*.
↳ **as-built 16/09/2026 05:05 — APPLIED** (`20260916043500_module11_c_report_params.sql`): four rows, `control_alerts`, owner מנכ"ל, `on conflict (param_name) do nothing` on the live unique constraint, loud guard if the CEO role row is missing. `params` 43 ⇒ **47**. Registry: four entries (`decimal` 1–5 · `percent` 1–100 · `weight` 0–1 ×2). New pure helper `src/lib/reportsParams.js` (`REPORT_PARAM_NAMES`, `missingReportParamsMessage` — shape copied from `src/lib/quotes.js` `missingParamsMessage`; the guide's §7.83 citation for this rule is **wrong** — item 83 is the read policy for three base tables; the rule's real sources are card ת6 and §2ב C5). 🚫 Card ת6's side-fix (give `סף_לקוח_רדום_ימים` an owner) was **not** done: it changes who may edit an existing row, and live there are **five** owner-less params, not one — Ishay's call (§9 D-13). Three stale "43" comments remain in `ParamsTab.jsx:2`, `ParamsTab.test.jsx:49`, `e2e/settings.spec.js:5` (comments only; Phase 4 removes the number).

**Step 1.5 · 🔴 The m4 write — MOVED HERE from Phase 4, and RE-SPECIFIED** *(11/09 — an execution
rehearsal found the original version not executable; the Contrarian lens moved it)*

🔑 **Why it moved:** it touches the path that produces an **irreversible** side effect — an invite that
went out — in a module that closed in August. Leaving its regression in Phase 4 means that if it fails,
it fails the week before the conference with all the UI already built on top of it.

🔴 **And why it had to be re-specified — measured 11/09 in `src/modules/04_hostesses/api.js`:**
| What the old version said | What is actually there |
|---|---|
| "write in `insertInviteRow` **and** `writeInviteToken`" | `writeInviteToken` is the **resend / token** path — and M11-4 itself says the rank is *"not overwritten on resend"*. **The two instructions contradict each other.** |
| — | ‏`writeInviteToken` is **imported by m6** (`06_projects/api.js:34,311`, `sendDateChangeReinvites`), where no rank exists at all ⇒ writing there is a **third** ripple into merged code, unnamed anywhere |
| "the rank" | **Two different orders exist.** `ranked` = `rankCandidates(...)` (the system's score order) · `candidates` = `sortByAngle(ranked.filter(...))` (the lens the manager picked). Report 14א asks *"did she take the system's #1"* ⇒ **`ranked` is the source. `candidates` is not.** |
| — | ‏`createShiftInvites({ projectId, hostessIds, origin })` takes **ids only**; `insertInviteRow({ project, hostess, nowIso })` never sees a rank. **A signature has to change, and no step allowed that.** |

**⇒ The executable version:**
1. **`createShiftInvites` gains one optional argument** — `ranks`, a `hostessId → rank` map derived from
   **`ranked`** in `SmartMatchPage`, before `sortByAngle`. Absent ⇒ every row `NULL`.
2. **`insertInviteRow` writes it once, on insert.** 🚫 **`writeInviteToken` is not touched at all.**
3. **An invite from the row menu (`NEW_INVITE`) for a hostess filtered out of the list gets `NULL`** —
   correct, and exactly what report 14א means: adoption is measured only where a recommendation existed.
4. A failed rank write **must not fail the invite** — `NULL` + `console.warn`.

**Verify:** a Smart-Match invite writes the rank from `ranked` · a **resend leaves it unchanged** ·
a row-menu invite for a filtered-out hostess is `NULL` · **m6's `sendDateChangeReinvites` still compiles
and its path is untouched** · a forced write failure still sends the invite · **m4's full E2E green.**
↳ **as-built 16/09/2026 04:5X (agent P1-C, Opus, 211K; commit `3d64b0da`):** built as specified with one shape decision the step left open — the `hostessId → rank` map is produced by a new exported helper `buildRecommendedRanks(ranked)` in `04_hostesses/api.js` (unit-testable shape of the `ranks` argument). The rank-failure fallback retries the insert **without** the rank column (Postgres `42703` · PostgREST `PGRST204` · any error naming the column) and `console.warn`s; `23505` is excluded so the existing race retry is untouched. The row-menu `NEW_INVITE` path passes no `ranks` (every target there already has a row on the event ⇒ filtered out by construction). `writeInviteToken` byte-identical to HEAD; m6 import intact. 9 new unit tests; full suite 2,475 green. 🔴 **Orchestrator ruling (technical, reversible — §9 D-10):** the rank is measured on `ranked` **after** filtering hostesses already on the event (`assignedIds`), i.e. the system's score order over the invitable pool — reconciling card ת5 ("השלישית ברשימה") with this step ("`ranked` not `candidates`"); the agent had flagged the conflict rather than patching it. **E2E regression (`hostesses.spec` · `smart-match.spec`) runs in agent P1-V now that the column is live.**

### Phase 2 — Logic
**Step 2.1 · The aging function, first, test-first** *(iron rule 14)*
🔴 **Write the test from `spec.md §🔢`, watch it fail, then implement.** The three hand-computed rows
(92 ⇒ 90+ · 69 ⇒ 61–90 · −1 ⇒ 0 ⇒ שוטף) and the aggregate **35 / 10-13-8-1-3 / 236,382 ₪**.
🚫 **Do not compute the expectation in the same session that writes the query** — that guards nothing.

**Steps 2.2–2.n · One RPC per report**, each gated on its owning module, each with its population
declared in the function comment exactly as §📐2 states it on screen.

### Phase 2ב — 🔴 The classification engine *(added 11/09; a reviewer found it had NO owning step)*
> **Why this was a blocker:** ruling 1 (`processes-approved.md`) makes comment classification **the
> entire AI layer of this module**, and report 20 is one of the 16 surfaces. §4.4 and §4.5 described
> the engine's gates and limits — **but no step built it**, so one surface in sixteen was not
> buildable from this guide.

**Step 2ב.1 · 🧩 Ishay step — the Gemini key into Supabase Secrets** *(iron rule 17)*
**Two things, both required:** Hebrew instructions step by step, **and** a self-contained
"🧩 פרומפט לקלוד בדפדפן" block. 🚫 **No secret printed in chat or in a guide.**
**Verify:** the function reads the key; a missing key surfaces as
*"מפתח ה-AI לא הוגדר במערכת — פנה למנכ"ל"*, and **no run row is created.**

**Step 2ב.2 · The edge function `classify-feedback`** ✏️ **specified 11/09 — a rehearsal listed eight
unknowns here, and "in the `send-email` shape" answered none of them.**

🔴 **First, what the template actually is — read, not assumed** *(`supabase/functions/send-email/index.ts`,
214 lines, the repo's **only** edge function)*: it is a **webhook relay with no LLM call anywhere**, there
is no `supabase/config.toml`, no `_shared/`, and no test. ⇒ **what it gives you is the request skeleton;
everything model-related is new.**
🔴 **And one thing the old text got wrong: it does NOT call `assert_module_permission`.** That is a
plpgsql helper used by the RPCs. The function does a **manual two-stage check**, and the order is a
written contract, not style:

| From the template — copy this, it is load-bearing | Why it is written there |
|---|---|
| missing secret ⇒ **`500` with a Hebrew message, before anything else** | *"a missing secret is a configuration fault, not a user fault"* — returning success here would confirm an action that never happened |
| `Authorization` header → `auth.getUser()` ⇒ `401` | without it the function is an open relay to anyone who knows its address |
| **the permission gate runs BEFORE body validation** | otherwise a blocked user gets `400` instead of `403` and learns she *would* have passed. `e2e/quote-email.spec.js` locks both halves |
| the permission lookup is **two queries, filtered by the user's `role_id`** | `permissions_select_all` is `using (true)`; filtering by module alone returns 5 rows, `maybeSingle()` fails, and **everyone** gets 403 — the bug caught on 30/07 |
| `status='active'` is part of the check | a soft-deleted user gets an empty map in the client; the server must refuse equally |

**What this step must decide, and the anchor for each:**
- **Secret name `GEMINI_API_KEY`** — the template's convention *(`MAKE_EMAIL_WEBHOOK_URL`)*: purpose-named,
  read with `Deno.env.get`, **never printed**. 🧩 Ishay installs it in step 2ב.1.
- **Batch = 20 comments per call** — card **ת2** says *"~20 הערות לקריאה"*.
- **`temperature 0`** — ת2. Classification must be reproducible across runs.
- **Who writes `partial`:** the function itself, in the `catch`/timeout path, **before it returns** — so a
  quota hit leaves a readable run rather than a row stuck on `running`.
- **How a run starts:** a client call from the report-20 bar, by a user with `edit` on `'דו"חות'` (ת2).
  **No scheduler exists in this project** *(D17)* — do not invent one.
- **Response schema** — one object per comment: `sentiment` 1–5 · `negative_topics` **enum-constrained to
  the five negative reasons** · `positive_topics` **enum-constrained to the five positive** · `quote`
  (one sentence) · `red_flag` · or `unclassifiable`. 🔑 **The enums are the DB CHECK lists, verbatim** —
  that is what makes the human↔model agreement matrix possible at all.

⚠️ **And the provider call is the one thing NOT frozen here.** As of 11/09/2026 the Developer API takes
the key in an **`x-goog-api-key` header**, and structured output is requested with a **JSON mime type plus
a response schema carrying `enum` and array fields** — but Google moved this surface at least once
*(a newer `interactions` endpoint alongside the legacy `generateContent`)*.
🔴 **⇒ Step 1 of this step is to open the current doc and confirm endpoint · model id · and the exact
config field names before writing the call.** **Do not copy the shape above as fact** — it is a
starting point with a date on it, and a model id in particular will be stale.
**Sources:** [Structured outputs — Gemini API](https://ai.google.dev/gemini-api/docs/structured-output) ·
[Generating content](https://ai.google.dev/api/generate-content)

**Writes rows one at a time, immediately** *(a mid-run quota hit must keep what was classified)*.
**Verify the failure paths, not the happy one:** quota/timeout ⇒ run goes `partial`, the bar reads
*"נעצר: N/M · [המשך]"*, and **the continue sends only the remainder** · invalid JSON for one comment ⇒
that comment is *"לא ניתן לסווג (שגיאת-פורמט)"* **and the run continues** · double-click ⇒ the second
run is refused while the first is `running`.

**Step 2ב.3 · The approve RPC** — `edit` on `'דו"חות'`, sets `approved_at`/`approved_by` on the **run**.
**Verify:** report 20 shows nothing until a run is approved; a blocked identity calling it is refused
**with an error, not with zero rows.**

**Step 2ב.4 · 🔴 Seeding phase ב — the data path ruling 25 owns**
> **The second thing the reviewer found:** ruling 25 splits seeding in two and puts **phase ב in the
> blueprint** — *"דרג-שיבוץ (עמודה חדשה) · סיווגי-AI (טבלה חדשה)"*. Step 1.5 covers the rank. **The AI
> classifications had no path to data at all**, so report 20 would ship empty and the conference story
> ④ — *"the model read what the tag missed"* — would have nothing behind it.
**What this step is:** run the engine over the existing comments, **approve the run**, and verify
against the numbers already measured: **33 "אחר"**, and the 20 complaints carrying no negative tag
*(`cards-customers.md` item 20.7)*.
🔐 **Every write goes through Ishay's gate.** ⚠️ **And the run is done and approved BEFORE the
conference** *(card ת2: on stage there is no live call).*

> ↳ **as-built 16/09/2026 07:3X (Ishay's typed-echo waiver, §9 D-9):** ✅ **DONE.** `feedback_ai_insights` = **426/426**
> (0 unclassifiable) across two approved runs: run 5 = 40 rows by `gemini-3.8-flash`, run 6 = 386 rows by
> `gemini-3.5-flash-lite` (13 requests of 30 notes, 0 quota refusals, ~10 s per batch), both approved by CEO at
> 04:28 UTC; RECRUIT's approval refused `42501`; a second approval refused `P0001 "ריצת-הניתוח כבר אושרה להצגה."`.
> **Two deviations, recorded as `הנחתי` in `index.ts`'s header:** batch 20⇒30 (card ת2's *"~20"* is approximate; the
> resource that ran out is REQUESTS — the big model's free tier is **20 requests per DAY**, which is why waiting never
> helped) and the model switch (per-model free-tier bucket; `GEMINI_MODEL` env override kept; `thinking_level` is a
> per-model map, `minimal` for flash-lite). **Measured against the card:** the 33 human-"אחר" rows reproduce exactly and
> the model named a real topic on 28 of them; the card-20.7 population (104) reproduces to the row, but its keyword
> filter returns **16 / 13 texts**, not the card's 20 / 17 (§9 D-23) — 16 of 16 got a model negative topic.
> **Story ④ is true and demonstrable** — the ⚠️ row in `HANDOFF-stage3-2026-09-10-02.md §6` (line ~117) is flipped in
> Phase 4 (`p4-docs`), not yet. Quote verbatimness: 425/426 by `position(quote in feedback_notes) > 0`; the one miss
> (project 1249) is an Arabic YEH for a Hebrew YOD — invisible to the eye (§9 D-23).

🔴 **Two things this step owes beyond the data, added 11/09/2026 — they are what make story ④ *scheduled*
rather than *hoped for*:**
**‏① When this step lands, flip the story.** Conference story ④ — *"the model read what the tag missed"* —
**is false until this step runs**, because מ22 declares four times that no run exists. ⇒ **the last action of
this step is to change the ⚠️ row in `HANDOFF-stage3-2026-09-10-02.md §6` to ✅ and say so to Ishay.**
Without that, the story stays flagged forever and nobody knows it became true.
**‏② And it has a dependency Claude cannot discharge: the Gemini key is step 2ב.1, a 🧩 Ishay step.**
⇒ **If the run is not approved by `08/10/2026` — a week before the conference — story ④ is replaced, not
postponed.** 🔑 **The replacement needs nothing and is true today**, straight off the approved מ22:
> *"‏426 הערות חופשיות נכתבו במשוב. ‏**33 מהן יושבות על משוב שתויג 'אחר'** — הדלי השלילי הגדול ביותר
> במערכת, **ואיש עדיין לא קרא אותן.** זה בדיוק מה שדוח ניתוח-ההערות נבנה בשבילו."*
**Both figures are on screen** *(`05_tab_customers_approved.html`, the מ22 tiles)*, it passes all five story
rules in `seed-plan.md §1`, and it sets up the AI layer as **the answer** rather than claiming it already ran.
*(Date is my recommendation, not a ruling — Ishay may move it.)*

### Phase 3 — UI
**Step 3.0 · Build מ1 — the shell — FIRST.**
↳ **as-built 16/09/2026 05:5X (agent P3-F, Opus, 583K, 4,671 s):** shell · chip row (horizontal, beneath the four role tabs, 992 px, one `<aside>` — the top mine proven in a screenshot) · four masked-not-hidden tabs · filters (period presets + customer) · five envelope states · URL state via `resolveNext` · `ChartCard` (recharts, LTR wrapper, sr-only twin table, custom RTL tooltip) · `KpiTile` · `ReportTable` · `DrillCrumbs` · `ReportChips` · `FiltersBar` · `Envelope` · `ExportBar` · **`ReportSurface`** (the shared renderer every tab delegates to; `renderExtras(payload)` for surface-specific UI) · `reportsCatalog.js` (16 surfaces, RPC names verbatim from C8) · `reportsPeriod.js` · `api.js` (`callReport` with the C8 shape guard, `approveFeedbackAiRun`) · `src/lib/reportsExport.js` (`write-excel-file`, `rightToLeft: true`) · `src/lib/reportsFormat.js` (money/percent/gini/delta with LRI…PDI) · four `onboardingCopy.m11.*.js` stubs spread into `onboardingCopy.js` · `App.jsx` route swap. **98 unit tests green · jscpd 0.82 % · eslint 0 · check:declared-counts green.** Browser evidence at 1280 px for CEO · FINANCE · RECRUIT · STAFF (`scratchpad/results/foundation/`): overflow 0, masking per the live matrix, STAFF sees the no-permission envelope with an `<h1>`. **3.0ב — every `לא אומת` item of `design-contract §⑤` measured in Chromium and written back at the line** (count stays 10): inherited `dir` ✅ · default tooltip is LTR (custom box needed) ✅ · no Lorenz/histogram primitives ✅ · `orientation="right"` works inside the LTR wrapper ✅ · ❌ `ReferenceLine label={{…}}` renders nothing — workaround: child `<Label/>`. **Three defects the browser caught that no gate did:** `₪` left of the digits in the tooltip/sr-table (fixed at source in `reportsFormat`, regression test) · React key-spread warnings · no `<h1>` on the all-masked screen (a11y scan would hang). **Deviations (`הנחתי`):** tab stubs call the real RPC and show the error envelope until the RPCs exist (honest, not a fake empty) · `isFiltered = customerId || period !== 'all'` · `DEFAULT_PERIOD = 'year'` (ח8-7) · `meta.export_blocked_reason` as the transport for report 22's locked sentence (now in C8). **Conflict reported, resolved by the orchestrator (§9 D-14):** drill set. **Two blind spots recorded:** `ReportSurface` refetches on `requestKey` (drill serialised with `JSON.stringify` — key-order instability would loop) · the customer picker reads `listCustomers()` (RLS on `'לקוחות'`) so RECRUIT/STAFF get an empty list with `error: null` — degrades to *"כל הלקוחות"*; the right fix is a gated list from the report RPC (§9 D-16). `UnderConstruction.jsx` lost its last usage ⇒ deleted (knip). `src/modules/11_reports/CLAUDE.md` created minimal so `check:context` passes; the close audit refreshes it.
for role, pills for report)* · global filters · **the five envelope states**, which §📐10 requires every page
to know.
✏️ **11/09 — "it was never drawn" is struck; it was wrong.** **Copy `design-contract §⑥`** — a 401-line
skeleton written for this step, with **real markup for all five states** — **and §⑥.1** for the four pickers,
**then cross-check against any one of the four approved mockups**, which all render the live shell.
🔴 **And the one thing to get right, because the skeleton carried it wrong until 11/09:** the report picker is
a **horizontal chip row above the page** *(`flex-wrap:wrap; width:100%`)*, **not a 220px vertical rail.**
Ishay caught it by eye within minutes of seeing it rendered. **Clicking a chip opens that report** — the page
`<h1>` becomes the short name and the line beneath it the question *(ruling 18)*.
**Step 3.0ב · 🔴 The first chart in this repository** *(added 11/09 — the guide never mentioned it)*
‏`recharts@3.10.1` is in `package.json` and has **zero usages in `src/`** — measured. ⇒ **every chart
convention is established here, not inherited.** Read `design-contract §⑤` *(the 12 binding chart
principles + the primitive map for Lorenz · Pareto · stacked · scatter · histogram)* and
`stage2-review/m11-charts-rtl-a11y.md` **before the first `<BarChart>`**, and build **one** chart-card
shell that all the others reuse. 🔴 **RTL is the risk:** the time axis runs LTR inside an RTL page, and
that is a ruled decision, not an invention.
🆕 🪤 **And read `design-contract §⑤` for what it does NOT promise, not only for what it rules**
*(added 15/09/2026)*: **ten of its items carry `לא אומת`** *(✏️ counted 16/09; "twelve" was written from memory on 15/09)* — among them `orientation="right"` under
RTL, whether `dir` is inherited into the tooltip box, and keyboard-equivalence for `onClick` on
`<Bar>`/`<Cell>`. **They are marked unverified because recharts has never run in this repo**, so there
was nothing to verify them against. ⇒ **this step verifies them in a real browser and writes the answer
back into `§⑤`** — do not treat an unverified line as a specification, and do not treat it as a gap
either. 🔑 **Why it matters here specifically: a chart that renders mirrored is not a red test** — it
looks plausible, and the first person to notice is a judge.

**Step 3.0ג · 🔴 The Excel export — one mechanism, reused by all 16** *(added 11/09 — the word "ייצוא"
appeared **zero** times in this guide, while all four card files spec the button on every page)*
**It is not an afterthought and it is not per-page.** Each of the four `cards-*.md` §⑤ row 5 defines the
same control: it downloads **the level currently on screen** — filters and drill state included *(ת4)* —
and **two caption lines under the filter row say what will come down before the click**: the expected
filename and `#xlsxCols`, the column names read from the visible table's DOM.
🔑 **The mechanism is already in the repo and must be reused, not re-chosen** *(iron rule 14)*:
‏**`write-excel-file`** *(`package.json`, `^2.3.10`)*, the browser entry — **the one existing caller is
`src/lib/salaryReport.js:39`**, `writeSalaryReportXlsx`.
🔴 **Copy one option from it deliberately: `rightToLeft: true`.** Its own comment says why — *"otherwise
Excel opens a Hebrew document with column A on the left"*. **A Hebrew export without it is wrong in a way
no test in this repo would catch.**
⚠️ **And m11's export is NOT m8's.** m8 builds a fixed document and uploads it to the `finance` bucket;
m11 downloads **what the RPC already returned — no second query** *(`processes-approved.md §📤`)*, filtered
and drilled to the screen state. ⇒ **shared library, new call site; do not route it through m8's code.**
**Empty and table-less states are specified, not invented:** a table with no rows ⇒ the button is
**disabled** with *"אין שורות לייצא"* · a page with no table at all ⇒ the column line reads
*"אין טבלה לייצוא בדף הזה"* · report 20 before an approved run ⇒ *"אין שורות לייצא — טרם אושרה ריצת-ניתוח"*
*(`cards-customers.md` G-ל8, locked verbatim to ת4)*.
🚫 **No separate export permission** — whoever can see the page can export it *(§📤, ⚙️ delegated)*.
**Verify:** one shared export helper with its own `*.test.js` · the file opens RTL · a drilled, filtered
export contains exactly the visible rows · the two caption lines match the file that actually lands ·
all three empty states.

**Steps 3.1–3.4 · One tab per step.** ✏️ **The surface→step map is written out 11/09 — until then it was
only implied by the order the files sit in, and a builder had to infer it.**

| Step | The approved file it builds from | Surfaces | Their cards |
|---|---|---|---|
| **3.1** | `approved/02_tab_executive_approved.html` | **מ2** מבט-על הנהלה · **מ3** מגמות רב-שנתיות · **מ4** הנחות ורווחיות · **מ6** קהל מול צוות | `cards-management.md` |
| **3.2** | `approved/03_tab_finance_approved.html` | **מ7** מבט-על כספים · **מ8** רווחיות פרויקטים · **מ9** גיול חובות · **מ12** צריכת ציוד | `cards-finance.md` |
| **3.3** | `approved/04_tab_hostesses_approved.html` | **מ14** מבט-על דיילות · **מ15** אמינות והתייצבות · **מ16** איכות מול עלות · **מ17** הוגנות השיבוץ | `cards-hostesses.md` |
| **3.4** | `approved/05_tab_customers_approved.html` | **מ19** מבט-על לקוחות · **מ20** שביעות רצון · **מ21** לקוחות מתרחקים · **מ22** ניתוח הערות *(מ25 lives inside it)* | `cards-customers.md` |

⚠️ **The finance file also carries מ10 · מ11 · מ13, deferred by ruling 30** — they are drawn, verified,
and **not built for the conference.** They sit there with a return trigger; **מ13 is the first
replacement.** 🚫 **Do not build them because they are in the file.**

**Each step ends with the 🎨 UX gate and a 🗣️ screenshot to Ishay.**
⚠️ **And each of these is four full surfaces — charts, drill-down, five states, the onboarding anchors.**
A rehearsal flagged the granularity as optimistic. **Split a tab into per-surface sub-steps the moment
one of them slips**; the phase door is the tab, the work unit may be the surface.
🔑 **Each tab step reads its surface cards in full** — nine sections each — **and is not closed until
every ruling in §3.3(ג) that touches those surfaces is visible on screen.**
🆕 🪤 **Step 3.5's first trap is WHERE you copy from, before it is what you copy** *(added 15/09/2026)*:
**the four approved mockups carry four different markup conventions for the same layer** — `.hint`/
`.hint-line` · `data-onb`/`data-key`/`data-hint` · `.hl`/`.oa`/`.imh`/`.hm` · body classes `onb-2`/
`onb-guided`/`onb`. **This was measured and deliberately NOT unified** (`screens-approved.md` §🗂️,
the "Two Facts" note) **because none of the four ever reaches production** — the production shape is
`<Hint id="…" />` + a key in `onboardingCopy.js`. ⇒ **copy the layer from each card's §⑩, never from a
mockup's HTML.** ⚠️ **The failure is silent in both directions:** a mockup class renders nothing, and a
wrong key renders `null`.

**Step 3.5 · The onboarding layer** — 70 keys copied **verbatim** from each card's §⑩ into
`onboardingCopy.js`. 🔴 **Convert every `<span class="ltr">` to LRI…PDI** *(`onboarding-layer-contract §5ב`)*.
🔴 **And no data count enters the copy file** *(`§5ג`, Ishay's ruling 11/09 — 23 were stripped from the
cards and mockups that day)*. **A number stays only if it is structural** — a threshold *(`3 משמרות ומעלה`)*,
a window *(`12 החודשים`)*, a scale *(`1 עד 5`, `אחוזון 90`), a formula constant *(`שלוש משמרות דמיוניות`)*.
⚠️ **The migration is exactly where this breaks:** in the mockup a live count is a **dated picture** and is
fine; the same string inside `onboardingCopy.js` is a **hard-coded literal no query updates** ⇒ it becomes a
quiet lie, and **no test covers a hint sentence.** ✅ **One declared exception:** the Gini comparison hint
must carry both `n` *(📑ב#14א)* — **inject it from the same query that feeds the tile, never type it.**

### Phase 4 — Ripples & integration
✏️ **The m4 write moved out of here to step 1.5** — see the reasoning there.
Doc ripples per iron rule 13 · the §7 RLS matrix row corrected **once, with all three writes** ·
a re-run of m4's E2E **as a regression**, now that the UI sits on top of the 1.5 change.

### Phase 5 — QA & handoff
Closing audit in a **fresh** session (`module-close`).

---

## 7. 📊 QA Matrix

| Layer | What it covers here |
|---|---|
| Unit (`src/lib/*.test.js`) | every pure function: aging buckets · Gini · reliability score · the median helpers |
| RPC assertions | population per report — the `n` on screen equals the `n` the function returns |
| RLS | **the four test identities of §2.7**, and the blocked case asserted as *zero rows with no error* |
| E2E | one journey per tab + the masked-tab case; the drill-down on all four drill reports |
| Visual | 1280px, zero console errors, `scrollWidth − clientWidth = 0`, both onboarding modes |
| 🎤 **Conference stories** | ✏️ **Added 11/09 — this matrix had no row for the thing the whole hour rests on.** **Four sentences Ishay says aloud while the screen is behind him**, and **no automated test can catch a story that contradicts its screen** — a test checks that the number is right, not that the sentence said about it is right. 📏 **Measured 11/09: two of four did not hold.** ⇒ **Check each against the five rules in `seed-plan.md §1`** *(number on screen character-for-character · the sentence's population = the population the page declares · the label means what the sentence says · what it claims happened has happened · **the page is a page that gets built**)*. **The per-story sentence, page, and what to check: the step guide §⑦ב.** 🔴 **And rule ⑤ has a standing consequence: any scope ruling triggers a pass over the four stories** — that is exactly how story ② broke, a month after it was written, with nobody noticing. |
| 🔴 Acceptance oracle | the hand-computed numbers of `spec.md §🔢` — **never a test this session authored** |
| 🔴 Formula **variant** | ✏️ **Added 11/09.** The cards give every figure its population, columns, window, comparison, precision and empty case — **that part is not missing.** What they do not give is **which variant of a formula**, where more than one is standard. **Gini is the one such metric in the sixteen**, and it is already symptomatic: `cards-hostesses.md` ⑧17.3 holds **two measurements of the same `n=95`** — `0.4329` recorded vs `0.4299` measured, with the seeding explanation already ruled out. ⇒ **`spec.md §🔢 3.3` now pins it:** population Gini, no `n/(n−1)`, with a five-value hand case expecting **0.40** *(the sample variant returns 0.50 on the same input — a 25% gap)*, and the window convention `(10/09/2025, 10/09/2026]`. **Write that unit test before the RPC.** |
| ⚠️ Oracle coverage | ✏️ **`spec.md §🔢` covers the aging report** *(and, from 11/09, Gini)*. The other fifteen surfaces are anchored in `signoff-baseline-2026-09-10.md`, **which is a measurement register, not a hand-computed expectation** — it is an independent channel (live SQL) and that is what makes it usable, but **it is not the same guarantee.** ⇒ **before building a surface whose headline number matters, hand-compute one case from its card's §③ the way §🔢 does for aging.** |
| 🔵 One near-miss, recorded | a rehearsal reported Gini as contradictory between files. **Measured: `processes-approved` carries `0.4556` (06/09) and `signoff-baseline` carries `0.4559` (10/09) — two dated measurements, not a contradiction, and both render `0.46` under 📐4.** ~~The same report also claimed a `0.4299`; it appears **zero** times in the repo.~~ 🔴 **✏️ WITHDRAWN 11/09/2026 — that half was itself wrong, and a sweep caught it.** `0.4299` appears **five times**: `cards-hostesses.md:107,413,451,587` and `spec.md §🔢 3.3`. It is the **re-measurement of the previous window on the same `n=95`** that ⑧17.3 records against the `0.4329` on file, still open, with the reseeding explanation already ruled out. 🔑 **And the irony is the lesson: this row exists to say *"half a finding is not a finding — check both halves"*, and the half I wrote to disprove was the half I did not check.** The first half stands: `0.4556`/`0.4559` are two dated measurements of the current window, not a contradiction. |

---

## 8. ✅ Definition of Done
`docs/architecture_and_qa_roadmap.md`'s six gates, unchanged: `npm run verify` green · unit test for
pure logic · migration applied **and `docs/schema.sql` regenerated** · journal + `db_roadmap §10` +
`STATUS.md` · no secrets · merged to `dev` through a PR.
➕ **And this module's own seventh:** **every one of the 39 rulings maps to a step, a deferral, or a
reality-kill row** *(§3.3)*.

---

## 9. 📝 Deviations & Tech-Debt Log

| # | Deviation | Why it is recorded, not silently accepted |
|---|---|---|
| **D-1** | Branch is `ishay/dashboard-legend-ucd`, not the `ishay/module-11-reports` the step guide names | That branch **does not exist** — verified 11/09. ✏️ **16/09/2026 — and this row is now HISTORY, not instruction: `ishay/dashboard-legend-ucd` was merged to `dev` (PRs #131/#133/#134) and is 0 ahead / 6 behind. The build starts from a fresh branch off `dev`.** The "73 commits" figure here was never re-measured; at merge time it was 97. Cutting a new branch now either fragments the work or needs a 73-commit merge first. The blueprint's actual requirement — *not on `main`/`dev`* — holds. |
| ~~**D-2**~~ | ~~🔴 **מ1, the shell, has no mockup** — the single largest guess in this guide~~ | ✅ **CLOSED 11/09/2026, and the original wording was wrong twice over.** ① **"No drawn reference" was false:** `design-contract §⑥` is a **401-line copyable HTML skeleton written for מ1** — sidebar, four tabs, chip row, filters, the "אז מה" line, and **real markup for all five envelope states** — plus §⑥.1 with the four pickers. ② **"It has no mockup" was true but irrelevant:** measured across the four approved files, **every one renders `side` · `tabs` · `picker` · `filters` · `stamp`, and three of four render the masked tab.** ⇒ **the shell is drawn four times over; a fifth file would have shown the same screen a fifth time.** **Ishay ruled it deleted** *(11/09: "המעטפת לא טובה תמחק לדעתי מיותרת גם")*, and `§⑥.2` records the reasoning. 🔑 **What the exercise did produce, and it was the real defect:** the skeleton rendered the picker as a **220px vertical rail** while the approved mockups render a **horizontal chip row** — and **§⑥ is what the build copies**, so it would have shipped with no visible symptom. **Fixed in §⑥.** ⚠️ **The lesson, not the file: a gap recorded once as "no reference" is never re-checked, and it kept being repeated to Ishay as a blocker.** |
| **D-3** | §7's RLS matrix row for m11 reads *"none (5 reports as Views/RPC, read-only)"* | Written before the Discovery. **Corrected once, in Phase 4**, with all three writes — correcting it now would describe tables that do not exist. |
| **D-4** | `docs/schema.sql` missing three live columns | Fixed in step 1.1 before anything depends on it. |
| 🆕 **D-17** | **Window convention decided once for all tabs** — calendar periods closed `[from, to]`, rolling look-backs half-open `(from, to]` | Three builders measured that the baselines reproduce only closed on calendar windows (executive: one event on 01/01/2026 = 5,610 ₪, two on 01/01/2025; customers: project 1221 on 10/09/2025 = 2,056 ₪ flips 163⇒162, 53⇒52) while Gini/rate/response reproduce only half-open (`cards-hostesses.md:413` locks it). `cards-hostesses.md §③` mixed `>=` (attendance: 1,730 · C=0.958815) and `>` (Gini) on the same day ⇒ the on-screen 'הגעה בזמן' is **87.2 %** (rolling, half-open), not the card's 87.3 % — a record fix for Ishay, not a code change. Also: `0.4329` (previous-window Gini, `§ח8-1`/`📑#14א`) does not reproduce under either convention (live 0.4299/0.4295 on the same n=95); both round to 0.43 — record fix. |
| 🆕 **D-18** | **Ruling-33 door targets are the builders' derivation (`הנחתי`)** — the ruling says every overview tile is a door, not where to | Executive: הכנסות⇒מ3 · שולי-רווח⇒מ4 · אירועים שהסתיימו⇒מ8 (same `'כספים'` gate) · **נתח 5⇒מ21 (cross-tab, `'לקוחות'` gate — a user without it sees a door to a masked tab)** · Finance: יתרת-חוב⇒מ9 · חרגו החודש⇒מ8 · **two tiles `target: null`** because their pages (מ10 תזרים · מ13 שכר) are deferred — *a door to a screen that does not exist is worse than no door*. For the morning table. |
| 🆕 **D-19** | **`spec.md §1.4` counts 74 tile labels — מ3's 12 labels (4 per drill level) are missing from it** because the mockup renders them in JS and the 11/09 extraction read static markup only; `check:declared-counts` cannot see it (it counts the table against itself) | Labels for מ3 were copied verbatim from the approved mockup's JS by the executive builder. Doc reconciliation for Phase 4 (annotate §1.4, keep the declared count equal to the counted one). |
| 🆕 **D-14** | **Drill set = מ3 · מ9 only.** C8 listed מ17; `processes-approved.md §📐13` names reports **1 · 6 · 16 · 4** = מ3 · מ9 · מ13 · מ5, and `spec.md §✅`'s *"ריכוזיות"* is מ5 (customer concentration, deferred) — not מ17's shift concentration | Caught by the foundation agent as a C7 conflict. Orchestrator ruling 16/09 05:5X: two drill reports are built for the conference; מ13/מ5 return with the deferred set. `reportsCatalog.js`, C8 and the hostesses task file corrected. |
| 🆕 **D-15** | **Eight conflicts between cards, mockup, spec and live data, found by the finance RPC builder — all reported, none patched** (`scratchpad/results/p2-finance.json` → the morning table): rounding order (per-row-then-sum reproduces 236,382; sum-then-round gives 236,380 — **the definition must say which**) · card מ8 §③ stale on three numbers (−0.1 % vs −1.7 %; 21 vs 17; 2/5 vs 4/18) · **§📑ב#5 materiality floor excludes 123 of 236 projects** (118 are below 1,000 ₪ planned labour — the threshold looks too high for this data; implemented as written, counter shown, action headline chosen from ranked rows) · card מ9 §③ says 3 over-60 where its own rows sum to 4 · bad-debt ₪ ambiguous (revenue excluded vs `final_profit`) · **`logistics` data moved between 15/09 and 16/09: autofilled 1,609 ⇒ 1,689 (162 ⇒ 82 measured rows)** — the on-screen sentence is computed live, never hard-coded; *who changed 80 rows is unknown* · calendar month vs rolling 30 for two overview tiles (measured both: 0/0 ₪ vs 3/12,987 ₪, returned in `meta.open_items`) · three tile labels fuller in the mockup than in §1.4 (payload carries the mockup's). | Each is Ishay's to rule or a doc reconciliation for Phase 4; none blocks the build. |
| 🆕 **D-16** | **Customer filter list is a second, RLS-gated read** (`listCustomers()`, `'לקוחות'`) — RECRUIT/STAFF get `[]` with `error: null` | The foundation degrades honestly (picker shows only *"כל הלקוחות"*, reports still run). The right fix — a gated customer list from a report RPC — is a decision, registered as `🚧 מ11` debt in Phase 4, not patched. |
| 🆕 **D-20** | **One migration file may carry several `schema_migrations` rows** — E2 = 3 rows (`module11_e2_rpcs_finance_fixes` · `_e2b_…` · `_e2c_…`), F = 3 (`_m14/_m15/_m16`), F2 = 7 (`_m17 · _m16 · _m15 · _m14 · _m15_fix · _m14_winlabel · _m17_winlabel`) | **Accepted 16/09/2026 08:1X (orchestrator, technical).** Cause: MCP `apply_migration` truncates ~90 KB, so files are applied per function (< 60 KB each), and a post-apply defect found by the applier's own verification is fixed forward in the same uncommitted draft. **The file is the source of truth**: every applied body was hashed — `md5(prosrc)` == md5 of the file's `$function$` body, 16/16 at 08:0X (`<scratchpad>/fn_md5.py`; the check belongs in the close audit). Each file's header lists its rows. **Not for the ledger** (`db_roadmap`): rows-per-file is bookkeeping, the ledger tracks files. |
| 🆕 **D-21** | **Hostess-pay tile (מ7) rounds the SUM, not the rows: `round(sum(actual_hours × hourly_rate_snapshot))`** — the E2 fixer implemented `sum(round(…))` per the orchestrator's earlier wording and declared the divergence: **19,257 ₪ vs 19,253 ₪** (approved mockup and `signoff-baseline-2026-09-10.md`) for August 2026 | **Flipped 16/09/2026 08:1X (E3).** Three sources agree on the order: the baseline is the acceptance criterion (plan §5); module 8's salary SSOT (`src/lib/salaryReport.js:32`) rounds to agorot **per row**, so the whole-shekel figure that matches what is paid is `round(sum(…))`; the card says only "₪ without agorot". A baseline mismatch was reported, not reconciled — the right behaviour. |
| 🆕 **D-22** | **`ReportSurface` grew five extension slots (16/09 08:1X)** — `transformPayload` · `renderTop` · `renderBeforeChart` · `renderBeforeTable` · `renderExtras` — plus automatic rendering of `meta.extra_tables` and `columns[].sorted` ⇒ `aria-sort` | The foundation left one slot (`renderExtras`, bottom only), and four concurrent tab builders would have invented four ways to place §⑩ hints, chip filters (מ16 *"רק בלי דירוג"*), label mapping (`chart.label_source`) and the מ25 run bar — or copied the shell and tripped jscpd. Contract documented in the component's JSDoc and covered by `ReportSurface.test.jsx` (slots receive the transformed payload; error path never transforms; extra tables render with title + pager). Builders never touch `components/**`. |
| 🆕 **D-23** | **Classification facts the closing audit must not reopen:** ① card 20.7's keyword filter returns 16 rows / 13 texts today vs the card's 20 / 17, while its denominator 104 reproduces exactly (`cards-customers.md` ~343; either the phrase list in the prose is not the one run on 10/09, or the notes changed) · ② project 1249's quote differs from the note by one homoglyph (Arabic YEH U+064A for Hebrew YOD U+05D9) — `position()` misses it, the eye cannot; a write-time guard in the edge function is a debt · ③ run 5's 40 rows were classified by a model that will not be used again; `feedback_ai_insights.project_id` is globally unique and `loadCandidates` skips classified projects, so a uniform re-classification requires deleting those 40 first — nothing documents that · ④ `SUPABASE_ACCESS_TOKEN` in `.env.local` returns 401 from the Management API (the CLI deploy path is dead; MCP deploy works) | Recorded 16/09/2026 08:2X from the finisher's report (`<scratchpad>/results/p2b-finish.json`). ①③④ go to PROJECT_MASTER §6 in Phase 4; ② is a debt on `classify-feedback`. |
| 🆕 **D-24** | **Three verification agents were killed mid-work by the account's 5-hour usage limit (07:3X–08:00)** — the executive verifier right after applying D, the customers verifier right after applying G, the hostesses fixer right after its last apply — none wrote a report | Re-derived from disk at 08:0X: D and G applied (registry rows), F2 applied in 7 rows, all 16 bodies byte-equal to the files; nothing verified for D/G beyond the builders' own reports. Re-dispatched at 08:2X as verifier-fixers (D2/G2 fix-forward allowed, additive only) and a hostesses re-verifier, concurrent with the four tab builders — the tab builders re-fetch payloads and reconcile the `payload_changes` lists before finishing. Lesson for the estimation log: a quota kill loses the agent's *report*, not its *writes* — the registry and the files survive, the findings do not; **a verifier that writes findings incrementally to its results file would have lost nothing.** |
| 🆕 **D-25** | **Row cap declared through two keys:** m02/m03/m04/m06/m16 emit `meta.row_total` (rows capped at 8 or 50); m07's 4-row preview declares its total as `meta.open_invoice_count` (35). `meta.row_total` had no reader in the shared shell (the executive tab built a local `RowCapNote`). | **Ruled 16/09/2026 10:0X:** 📐8 stays — the pager counts what is shown — and the shared shell renders ONE cap note *"מוצגות N מתוך M שורות"* from `meta.row_total` (P3-shared); m07 keeps its bespoke key and the finance tab renders its own note from it. Card texts that pin *"1–8 מתוך 236"* as the pager total are a documented conflict with 📐8 (executive verifier) — morning table. |
| 🆕 **D-26** | **`n=⁦N⁩` rendered as "N=n" in RTL** — measured in Chromium by the hostesses re-verifier: the `=` sat outside the bidi isolate and took the RTL level (m17 population/compare, m07/m08/m09/m12 population labels). Also bare 4-digit counts in m14/m15 sentences. | **Fixed 16/09/2026 (H2 migration, seven functions; D2/G2 carry the same rule for theirs):** `chr(8294) || 'n=' || value || chr(8297)`; every 4+ digit count through `to_char(x,'FM999,999,999')`. Lesson: payload-level checks cannot see rendering order — a Chromium probe with `Range.getBoundingClientRect` is the measurement. |
| 🆕 **D-27** | **Open product item the E3 fixer surfaced:** m07's two bottom tiles (hostess pay · over-threshold) are computed for the calendar month AND for a rolling 30 days (`meta.open_items.card_8_7_5`); today both give 19,253 ₪ because August's 83 shifts are the same set either way. Card 8.7.5 leaves the window undecided. | Recorded 16/09/2026 10:0X for Ishay's morning table — the moment shifts land in the first days of a month the two numbers separate, and only one of them is the baseline's. No code change; the tile shows the calendar month (the card's default). |
| 🆕 **D-28** | **Chart cap 2 vs the approved customers mockup (מ20 draws four charts).** `spec.md ⏳10` ruled *"2 לדף"* on 15/09 after measuring the four FINANCE pages; Ishay's 16/09 ✅4 (*"מבנה · סדר · אילו אריחים/גרפים/טבלאות ⇐ המוקאפ"*) is newer and names *which charts* as the mockup's call. | **Ruled 16/09/2026 09:3X (technical reading of the two sources, reversible):** `CHART_CAP` in `api.js` raised 2⇒4; finance pages still carry ≤ 2 because their RPCs return ≤ 2. **Conflict question for Ishay's morning table** — one word flips it back. |
| 🆕 **D-29** | **`reports.aging.whyAndFirst`: the card's §⑩ sentence opens with *"נמדדת מיום שליחתה"* while the metric is defined from the DUE date** (`deriveDaysOverdue`, hint ב, the definitions line); the approved mockup's sentence is correct. C3 says keys are copied from the card. | **Ruled 16/09/2026 10:2X: the mockup's wording wins for this one key** (the card's own §⑩ note records that the "send date" implication misled a build session twice). The finance tab applied it; the card's §⑩ row is corrected in Phase 4. Also for the morning table from the tab builders (all tagged `הנחתי` in their reports): masked-target doors close silently (⑧19.2 option א) · מ21 sort falls to the secondary column without כספים (⑧21.4) · hourly rates shown whole-₪ (📐4) beside a 43.27 ₪ reference line (hostesses H-4) · the hostesses tab opens on the calendar year while its cards are defined over 12 months (⑧H2) · spec §1.4 says *"נתח 5"*, payload/mockup/card say *"נתח 5 הלקוחות הגדולים"* (D-19 class). |
| 🆕 **D-30** | **Shared-shell rulings from the P3-SHARED round (16/09 10:5X–11:1X), each a technical reading, reversible:** ① chart→table cross-filter is ONE mechanism in `ReportSurface`: `chart.filter_key` (string) is the RPC's declaration, `false` turns it off, otherwise the shell auto-detects a chart `xKey` that is also a row field **and whose values actually meet the rows** (this caught m09's label-vs-key bucket and m08's disjoint top-15) — never on drill surfaces (📐13). Live auto-detections: מ4 `tier` (turned OFF by the tab: its chip row filters server-side via `p_drill`, one mechanism only) · מ6 `estimated` (OFF: the card records no cross-filter) · מ12 `item_name` (KEPT: 📐13 gives cross-filter to the non-drill pages; the card's "not clickable" reads drill, not filter — `הנחתי`, morning table) · מ16 `hourly_rate` (OFF: a rate filter is not the product's meaning). מ20/מ22 get `chart.filter_key` + join fields from G3. ② The clear chip reads *"× נקה בחירה"* (ruling 15-ד) and sits directly above the table (15-ד says the filters row, cards-management #7 says the pager row — the nearer place inside the surface; morning table). ③ `target.report` is not uniform (מ2/מ7/מ9 return the RPC name, מ14/מ16/מ19 the Hebrew name); the router accepts both; **the contract value is the RPC name** — Phase 4 writes it into C8, no migration today. ④ Hostess row doors land on `/hostesses` (the list): the hostess card has no address (module 4 opens it from local state) — a module-4 debt (`?hostess=<id>`), PROJECT_MASTER §6. ⑤ `quote` joined the door kinds (`/quotes/:id/edit`). ⑥ Row-cap wording is D-25's; the executive builder's objection (מ2's 8 rows are a complete top-list, not a cap) is a wording question for the morning table. | Recorded 16/09/2026 11:2X from `<scratchpad>/results/p3-shared.json` (`crossfilter_surfaces`, `crossfilter_off`, `conflicts_reported_not_decided`). Every tab builder was told which workaround to delete (`workarounds_now_unnecessary`) — two mechanisms for one behaviour is the defect class this round removed. |
| 🆕 **D-31** | **G3 (מ20/מ22 cross-filter keys) refused two card-required cross-filters on measurement, and the refusal is a conflict question, not a fix:** ① מ20 *"התפלגות הציונים"* counts all 163 completed feedbacks while the table holds only the 19 with a negative reason — measured all-time, every negative-reason feedback scores 2 or 3 (70/70), so a click on the "4" or "5" bar would filter to zero rows; ② מ20 *"מה משמח"* — feedbacks carrying both a positive and a negative reason = 0, so every datum filters to nothing. `filter_key:false` on both; *"מה מכעיס"* (negative_reason, 19/19 rows covered) and מ22's matrix (`human_tag`, 63/426) are ON. Also from the card: מ20 §① wants the TILES to update on a cross-filter (the shell filters the table only) and מ22 §① wants a cell-level (tag×topic) filter (delivered at tag level). | **Recorded 16/09/2026 12:0X (`<scratchpad>/results/p2-g3-filterkeys.json`) for Ishay's morning table:** turning ① on requires the מ20 table to carry all 163 feedbacks (a population change), not a key. The join field is a hidden scalar (`negative_reason` = `negative_feedback_reasons[1]`); max array length is 1 today — if a feedback ever carries two reasons the bar counts it twice while the row joins once (declared in the migration header). |
| 🆕 **D-32** | **Reconcile round of 16/09 11:1X–11:5X — what the four tabs deleted and what only one tab measured:** every tab-level workaround duplicated by the shell was removed (`surfaceDoors.jsx` deleted; tab routers, sub-folding, compare-format, date-format, sorted-injection, export-reason fallback, excess-chart renderer, `surface.drill=true` gone); the module suite is 208/208 at `af4ef4b9`. **Onboarding mode 2 has been seen in a browser on the דיילות tab only** (38 hints; page +5–19 % taller; no overflow) — the builder intercepted the one PostgREST GET that carries `onboarding_mode` instead of writing the row; the other three tabs' mode-2 screens are still unseen and belong to the evidence agent. Two first-browser-pass defects fixed in tabs: מ9's מדרג column printed raw bucket keys (`d90p`) beside a chart printing `90+`; מ21's contact phone broke at the ASCII hyphen (`· -055` / `1794584`) — now U+2011. | Recorded 16/09/2026 12:0X from the four `reconcile_round` blocks. Routed to fixers in parallel with the lens round (P3-FIX-A shell · P2-FIX-B server, see the task briefs): axis tick separators · `compare.note` · masked-target door hidden (⑧19.2 א) · `chart.layout:'horizontal'` · testid collision · 0-count bars not clickable · cap note hidden under a selection · מ3 year format · מ3 level-1 compare format · customers date columns · מ17 hours unit · מ21 two-number cell · מ9 `chart.note` (⑧9.8) · מ20 horizontal layouts. |
| 🆕 **D-33** | **Second usage-limit kill of the day (11:5X, reset 13:00, session resumed only at 17:3X on Ishay's message):** the 12-agent lens Workflow (Opus, 3 lenses × 4 tabs, all concurrent) consumed **2.8 M tokens in 23 minutes and returned zero reports**; with it died the shell fixer (mid-KpiTile, partial edits left uncommitted in the tree), the server format fixer (nothing written), the E2E agent (nothing written) and four copy evaluators (nothing written). **≈5.5 wall-clock hours lost.** | **Pacing rule from here (orchestrator, 17/09 17:4X):** ≤ 7 concurrent agents; one lens verifier per tab (all three lenses in one agent) instead of twelve; refuters only per finding; copy evaluators after the fix round, two not four; killed agents are RESUMED (they keep their context) after re-deriving the tree from disk, never restarted blind. For the estimation log: a Workflow fan-out is charged all at once — its size must be set from the remaining window, not from the parallelism the machine allows. |
| 🆕 **D-10** | **Rank source = `ranked` filtered by `assignedIds`** (before `sortByAngle`), not raw `ranked` | Card ת5 says *"השלישית ברשימה"* (on-screen position); step 1.5 says *"`ranked` is the source, `candidates` is not"*. Raw `ranked` is not filtered by hostesses already on the event, so an already-assigned #1 would shift every invitee one rank down and report 14א would count a first-available pick as non-adoption. The filtered list is still the system's score order (no manager lens). **Orchestrator ruling 16/09/2026, technical, reversible; the agent reported the conflict per C7 instead of patching.** Checkable: invite the first shown hostess on an event whose #1 is already assigned ⇒ stored rank must be `1`. |
| 🆕 **D-11** | **Six `bak_*` tables were world-readable through the anon key** (RLS off, all privileges granted to `anon` and `authenticated`; full copies of `projects`, `assignments`, `hostesses` incl. PII, `project_finance`) | Found by step 1.1's catalogue diff. **Migration H0 `20260916045200_module11_h0_harden_backup_tables.sql` APPLIED 16/09/2026 04:5X**: revoke all from both roles + enable RLS (deliberate deny-all, like `login_attempts`) + table comments. Protective, additive, no code reads them (grep = 0). **Dropping them is Ishay's decision** (they are the only in-DB recovery of the m11 seed, D-8). The closing audit's `rls_enabled_no_policy` sweep will list all six — triage: deliberate DEFINER-only deny-all. |
| 🆕 **D-12** | **`grep -c $'\r'` is not a CR gate in this Git Bash** — it returned 0 on a real CRLF fixture and the line count inside `$( )` | Measured independently by two agents (P1-B, P1-C) with truth-table fixtures. Replacement written into §2ב C6 and every task file: `perl -ne '$n+=tr/\r//; END{print "CR=$n\n"}' <file>` (or `tr -cd '\r' < file | wc -c`). Root `CLAUDE.md` §3 still quotes the old idiom — a doc ripple for Phase 4, not this module's scope to rewrite. |
| 🆕 **D-13** | **Stale facts found in tier-2/3 documents while building Phase 1 — reported, not silently fixed:** `assignments` 5,741 live vs 5,674 in M11-4/step 1.3 · `params` 43⇒47 (three m9 comments) · guide §3.1 cites §7.83 for the missing-param rule but item 83 is a read policy · step 1.1 points at `supabase/migrations/CLAUDE.md §3` instead of §2 · card ת6 calls `סף_לקוח_רדום_ימים` *"הסף היחיד בלי בעלים"* while **five** params have `owner_role_id is null` · `schema_migrations` lacks rows for the three 04–05/09 feedback migrations (ran outside `apply_migration`) · live `projects` lacks the two `comment on column` lines those migrations carry. | Each is a `🔴 גובר:` annotation or a §6 line for Phase 4; none changes what is built. |
| 🆕 **D-9** | **Ishay's 16/09/2026 session rulings — one-time, not precedent:** *"כן — מזג ל-dev וגם ל-main בלי לשאול"* · typed-echo waived *"על כולם — מיגרציות (~8) · חתימת-DoD · ריצת-הזריעה של הסיווג"* · mockups *"בחשבון מסוים אבל במידה"* · product gaps ⇒ faithful reading + `הנחתי` + morning table · onboarding modes 0 and 2 only · *"רק אתה כותב היום ומנהל הכל"* (rule 16) | Recorded so the closing audit and any resuming session know why this module merged without a typed echo and why `main` was merged by Claude. **Full conventions: §2ב.** Iron rule 10's `dev`-only carve-out was extended to `main` **for this module only**, in Ishay's own words in chat. |
| 🆕 **D-7** | **‏מ23 and מ24 had no owning step in any phase, and three files disagreed about whether they were m11's job at all** | ✅ **RULED 15/09/2026 — Ishay: defer both, with a return trigger** *(§2.2)*. **The defect was not the scope — it was that the scope was never stated:** ruling 30 enumerated **16 built + 6 deferred = 22** of the 26 surface rows, and **these two fell in the gap between the two lists**, so every later sweep read past them. `processes-approved.md` §1-ג2 billed them as m11 build items, `data-set.md` marked them out-of-scope, and `processes-approved.md` §⏳ג recorded plainly that they *"have no home"* — **three live statements, in the same spec folder, never reconciled.** 🔑 **The lesson for the closing audit: an enumeration is only a control if its parts sum to the whole** — 22 of 26 looked complete because nobody subtracted. |
| 🆕 **D-8** | **The module-11 seed exists only as live rows in the production database — no migration, no script** | Recorded 15/09/2026. The `seed(m11):` commits touch **markdown only** — measured with `git show --name-only`; **zero SQL**. In-database snapshots exist (`bak_projects_20260910` · `bak_assignments_20260910` · `bak_project_finance_20260910`) but **no copy outside the database**. ⇒ **every number the sixteen surfaces display, and all four conference stories, rest on state that `supabase db reset` + migrations cannot rebuild.** **Ishay's ruling 15/09: snapshot now, and a real re-seed script is a debt for after the conference** — see `PROJECT_MASTER §6` and `db_roadmap`. ⚠️ **Not a blocker for the build**; it is a blocker for recovery. |
| ~~**D-5**~~ | ~~The step guide §① still says **"5 דו"חות"**~~ | ✅ **CLOSED 11/09/2026 — verified this turn, not remembered.** The guide was rewritten end to end: §① now reads **16**, and the old sentence survives only struck through with its correction note *(`module_11_reports.md:15–16`)*. ⚠️ **Left as a closed row rather than deleted, because a builder who inherits "the guide says 5" from anywhere else needs to see it was checked and when.** |
| ~~**D-6**~~ | ~~`מתחילי` appears twice in live `src/` strings~~ | ❌ **WITHDRAWN 11/09/2026 — the claim was wrong, and a fresh-context reviewer caught it.** Re-measured: **zero** occurrences in `src/` and `e2e/`. The three hits are `מתחילים`, a valid word, **all inside code comments**. The cause is the error class this guide keeps warning about: a `grep` on a **prefix** matched a different word — I measured my reconstruction of the search instead of the word. It was inherited from `spec.md`, now corrected there too. **No debt.** |
