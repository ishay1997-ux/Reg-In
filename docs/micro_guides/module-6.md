# Module 6 — Projects · Build Micro-Guide

## 1. 🟢 Live Status Header

| | |
|---|---|
| **Module** | 6 — פרויקטים (Projects) |
| **Branch** | `ishay/module-6-projects` *(cut from a fresh `dev`; carries the approved spec)* |
| **Owner** | Ishay (sole developer) |
| **Status** | 🔨 **Phase 1 IN PROGRESS — the Phase-1 door is CLOSED and the build is approved** (`14/08/2026 11:29`). Reviewed, corrected and routing-audited `03:12`; renamed out of `.draft` at `10:20`. **Still no migration applied** — the 12 🛑 blockers below are being closed first, by a 14-agent fan-out Ishay approved at `11:2X`. |
| **Last updated** | `14/08/2026 11:29` *(system clock, `Get-Date`)* |
| **Active step** | **1.1 — pending the 🛑 blocker sweep.** Step 1.0 is ✅ done; **typed-echo is waived for Phase 1** (see step 1.0). 🔴 **The nine migrations are applied ONE AT A TIME, in order A→I, each verified live before the next.** |

**Legend (verbatim):** 🔻 stop-point · 🤖 Claude verifies alone · 👤 human (Ishay) gate · 🚧 cross-module debt (§6) · ⏳ deferred decision · 🕓 freshness stamp · 🔗 tagged §7 mirror · 🧩 handoff prompt · 🧊 frozen file · 🔮 future checkpoint · 🗡️ DB Design Challenge
**Step status set:** ⬜ pending · 🔨 in progress · ✅ done · ⏸️ deferred (with target module) · ❌ blocked (with reason)

| Step | Title | Status |
|---|---|:--:|
| **1.0** | 🔻👤 Phase-1 door: consolidated ruling round (Ledger OPEN items A1–A10) | ✅ **done `14/08/2026 11:30`** — every item ruled *(A1·A5 by anchor · A6·B11·B13·E3 by Ishay 10:43 · item ד by Ishay 11:30)*; **typed-echo waived for Phase 1 by Ishay**; Phase-1 build approved |
| **1.1** | Migration **A** — `projects` columns, `project_bonus` drop, `NOT NULL` tightening, CHECKs | ⬜ pending |
| **1.2** | Migration **B** — `project_changes` table + RLS + index | ⬜ pending |
| **1.3** | Migration **C** — `assignments` attendance columns + consistency CHECKs | ⬜ pending |
| **1.4** | Migration **D** — `logistics` read policy + origin-pointer columns + CHECK | ⬜ pending |
| **1.5** | Migration **E** — Storage: `reports` + `finance` buckets + 8 `storage.objects` policies | ⬜ pending |
| **1.6** | Migration **F** — `email_log` CHECK widening + third SELECT policy + Edge-Function deploy | ⬜ pending |
| **1.7** | Migration **G** — `params` seed: **2 mail templates + dormant threshold (`120`) + cancellation tiers**. 🚫 **NO survey-link row** — it is already live as `קישור_בסיס_סקר_לקוחות` | ⬜ pending |
| **1.8** | Migration **H** — the four RPCs (`update_project_details`, `apply_scope_change`, `cancel_project`, `close_project_operationally`) + `mark_feedback_survey_sent` + `list_projects_overview` | ⬜ pending |
| **1.9** | Migration **I** — status-machine trigger (3 sources) + daily `pg_cron` job | ⬜ pending |
| **1.10** | 🔻👤 Phase-1 gate: advisors clean + `docs/schema.sql` refreshed + `db_roadmap` rows flipped | ⬜ pending |
| **2.0** | 🔻👤 Phase-2 door: Ledger sweep for phase-2-anchored OPEN items | ⬜ pending |
| **2.1** | `src/lib/projects.js` — status label + tone map, readiness metrics, gap sentences, active-status SSOT | ⬜ pending |
| **2.2** | `src/lib/projectChanges.js` — scope-change arithmetic + late-change marker | ⬜ pending |
| **2.3** | `src/lib/projectClosing.js` — attendance vocabulary, per-hostess cost, closing validation summary | ⬜ pending |
| **2.4** | `src/lib/dates.js` extension — `weekdayOf` ⚠️ shared-surface | ⬜ pending |
| **2.5** | `src/modules/06_projects/api.js` — every read + every RPC call | ⬜ pending |
| **2.6** | `OPEN_PROJECT_STATUSES` migration to shared home ⚠️ shared-surface | ⬜ pending |
| **2.7** | `smartMatch.js` alignment to the real attendance column names ⚠️ shared-surface | ⬜ pending |
| **2.8** | Mail builders — cancellation + details-changed ⚠️ shared-surface | ⬜ pending |
| **2.9** | 🔻👤 Phase-2 gate: `npm run test:run` green + hand-computed anchors reproduced | ⬜ pending |
| **3.0** | 🔧 Shared-component checkpoint (all 8 approved cards + 8 mockups) | ⬜ pending |
| **3.1** | Surface 1 — projects overview | ⬜ pending |
| **3.2** | Surface 2 — project card shell + identity area | ⬜ pending |
| **3.3** | Surface 3 — logistics & products tab | ⬜ pending |
| **3.4** | Surface 4 — hostess team tab | ⬜ pending |
| **3.5** | Surface 5 — event-closing tab | ⬜ pending |
| **3.6** | Surface 6 — scope-change dialog | ⬜ pending |
| **3.7** | Surface 7 — project-cancellation dialog | ⬜ pending |
| **3.8** | Surface 8 — customer card projects tab ⚠️ shared-surface | ⬜ pending |
| **3.9** | 🔻👤 🎨 UX & functional review (end of Phase 3) | ⬜ pending |
| **4.0** | 🔻👤 Phase-4 door: Ledger sweep | ⬜ pending |
| **4.1** | Route wiring — `/projects` replaces `UnderConstruction` ⚠️ shared-surface | ⬜ pending |
| **4.2** | Cross-module ripples — M2 `getCustomerProjects`, M4 overview, stale code comment ⚠️ shared-surface | ⬜ pending |
| **4.3** | 🔻👤 Phase-4 gate: `npm run gate` exit 0 | ⬜ pending |
| **5.1** | E2E + smoke specs for module 6 | ⬜ pending |
| **5.2** | 🔻👤 Closing audit — FRESH session, `module-close` skill | ⬜ pending |

---

## 2. 📦 Context Packet

### 2.1 Purpose (≤3 lines)

Module 6 owns `projects` — the entity every other module hangs off. It carries a project from birth (M3 quote approval) through staffing (M4) and logistics (M5) to the **operational closing** that hands it to finance (M8).
The one decision it serves, in the approved spec's words: *"לאיזה אירוע אני נכנסת עכשיו — ומה בדיוק חסר בו."* (`spec.md` §②)
Governing principle, verbatim (`spec.md` §②): *"המערכת לא דוחפת, לא מנקדת ולא מחליטה במקום מנהלת הפרויקטים. היא מציגה לה את האמת בסדר שהופך את הפעולה הבאה למובנת מאליה."*

### 2.2 Capabilities delivered vs deferred

| # | Capability | M6 delivers | Deferred | §6 twin |
|:-:|---|---|---|---|
| 1 | Projects overview (surface 1) with two separate readiness metrics | ✅ full | — | — |
| 2 | Project card shell + identity area (surface 2) | ✅ full | — | — |
| 3 | Logistics tab (surface 3) — read + scope-change history | ✅ read + the read policy M5 owes | Item-status editing stays M5's screen | `🚧 מ5 ← מ6` (contract item 7) |
| 4 | Hostess team tab (surface 4) — read + round history | ✅ full | Invitation/release actions stay M4's screen | — |
| 5 | Operational closing (surface 5) | ✅ full — attendance, quality mark, per-hostess hours, report upload | 🚧 **Final gross profit is NOT frozen here** (Ishay 14/08/2026 01:17 — §7.52 means the *financial* closing) | `🚧 מ8 ← מ6` |
| 6 | Scope change (surface 6) | ✅ full | 🚧 **מ5** — logistics-side UI for the resulting `planned_qty` change | `🚧 מ5 ← מ6` (contract item 4) |
| 7 | Project cancellation (surface 7) | ✅ full — status, release, mail, stamp, type | 🚧 **מ8** — the 0/50/100 compensation computation itself | `🚧 מ8 ← מ6` |
| 8 | Customer projects tab (surface 8) | ✅ full — `מתקרבים`/`התקיימו` split, 2 tiles, dormant filter | — | `🚧 מ6` A1 · A2 · A3 · A12 · A13 |
| 9 | Attendance → Smart-Match reliability | ✅ M6 **writes** the three columns and aligns `smartMatch.js` | 🚧 **מ9** — flipping `מרכיב_אמינות_פעיל` to `true` is a params change, not M6's | `🚧 מ9 ← מ4` (`PROJECT_MASTER:465`) |
| 10 | Email send + journal for 4 mail types | ✅ send + `email_log` rows | 🚧 **מ10** — retry engine for a failed send (`§7.36`) | `🚧 מ10` |
| 11 | Finance-owned columns on `projects` | ✅ the dedicated RPC (M6-9) exists and is gated on `'כספים'` | 🚧 **מ8** — the screen that calls it | `🚧 מ8 ← מ6` |
| 12 | Public feedback page `/feedback/:token` | ❌ **not built** | 🔮 **מ8** — candidate, not a ruling | `🔮 🚧 מ8 ← מ6` |
| 13 | Reports (5 of them) | ❌ **not built** | 🚧 **מ11** — Discovery starts from the question, not the report | `🚧 מ11 ← מ6` |
| 14 | E2E fixture de-pinning | ✅ must be checked before 28/08 | — | `🚧 מ6 ← מ3` (A10) |

### 2.3 Existing files to touch

| Path | Line anchor | Why |
|---|---|---|
| `src/App.jsx` | `:138-145` — `<Route path="projects">` wrapping `<UnderConstruction moduleName="פרויקטים"/>` | The `<ProtectedRoute allow="פרויקטים">` gate is **already wired correctly**; only the page is missing. Replace the element, do not touch the guard. ⚠️ shared-surface |
| `src/modules/04_hostesses/api.js` | `:54-56` (`OPEN_PROJECT_STATUSES`), `:141` (`.in(...)`) | M6-14 / ⑫ — widen and move to a shared home. ⚠️ shared-surface |
| `src/lib/smartMatch.js` | `:43-52`, `:56-63`, `:195`, `:207` | The record field names are self-declared as *"הנחה שלי"*; M6 fixes them. ⚠️ shared-surface. 🔴 **The file is at `src/lib/`, NOT under `src/modules/04_hostesses/`** — `spec.md:527` gives a wrong path. |
| `src/lib/dates.js` | `:61-66` | `weekdayOf` lands here; the existing formatter already returns `22:00–02:00` without an order check. ⚠️ shared-surface |
| `src/lib/customers.js` | `matchesCustomerFilters` | A3 — the `רדומים` filter. ⚠️ shared-surface |
| `src/modules/02_customers/api.js` + `src/modules/02_customers/CLAUDE.md` | `getCustomerProjects` | A12 (direct `customer_id`, `LEFT` not `!inner`) + A13 (the code comment claiming it always returns `[]` is false since `20260809134237`). ⚠️ shared-surface |
| `supabase/functions/send-email/index.ts` | `:29-32` `ENTITY_MODULE` · `:35-39` `ENTITY_REQUIRES_ATTACHMENT` · `:116` the `edit` check | Two new entity types, both mapped to `'פרויקטים'`. ⚠️ shared-surface |
| `src/lib/shiftEmails.js` | `:72` `resolveShiftContact` | Reused unchanged by the details-changed mail; **must not** be depended on by the cancellation mail. ⚠️ shared-surface |
| `src/components/StatusTag.jsx` | `:29-42` `TONE_BY_LABEL` · `:50` the fallback | **Owned by step 3.0.** 🔴 **Spread `PROJECT_STATUS_TONES` in from `src/lib/projects.js` — never retype the eight labels here.** The map key is the **displayed Hebrew label**, and `:50` (`?? TONES.muted`) makes a miss **silent and visually identical to `ממתינה למענה`**. ⚠️ shared-surface |
| `src/components/StatTile.jsx` | `:29` | **Owned by step 3.0.** 🔴 **One word — add `items-start` to the column-flex container.** Without it the label and the value split apart under RTL; the approved mockup measured this in a browser and fixed it with `align-items:flex-start`. **This is live today and affects module 2 now**, so the fix ships in step 3.0, not at the Phase-3 direction pass. ⚠️ shared-surface |
| `src/components/Money.jsx` | `:23-24` | **Owned by step 3.0.** Extract the inline LTR wrapper into a shared `<Ltr>` component and re-consume it here. **Why a component and not a lint rule:** `check:bidi`'s regex only fires on a digit touching `₪ ★ ×` — it cannot see `1/6` or `חסרות 5`, which is most of what M6 renders. ⚠️ shared-surface |
| `src/components/LoadingOrError.jsx` | its `retryLabel`/default | **Owned by step 3.0.** M6 passes a **feminine** `retryLabel`; 🚫 **do not edit the shared default** — that is a cross-system change (`🚧 מ12`). ⚠️ shared-surface |
| `src/lib/smartMatchCandidates.js` | `:81` | **Owned by step 2.7.** It hard-codes `attendance: []`, so the moment M9 flips the reliability flag **every hostess returns "no data"** — a silent zero, not an error. ⚠️ shared-surface |
| `src/modules/04_hostesses/SmartMatchPage.jsx` | `:506` | **Owned by step 4.2** (iron rule 13(ח)). Its banner sentence becomes false once M6 ships, and it is gated on **M9's** flag rather than on M6's data. ⚠️ shared-surface |
| `docs/automations.md` | the four sections | **Owned by step 4.2.** The automation register — born as module 4's DoD requirement — must gain M6's `pg_cron` job, its three triggers, its seven RPCs and its two new `entity_type` values. **A register that is not updated is worse than none**, because it reads as complete. |
| `docs/schema.sql` | whole file | Snapshot refresh after every migration. ⚠️ shared-surface |
| `docs/db_roadmap.md` | rows `M6-1`…`M6-14`, §5 Storage rows, `A-14` | Flip state in the same session as each migration (Stop hook enforces). |

### 2.4 Files to create

```
src/modules/06_projects/
  api.js                      — all reads + all RPC calls
  ProjectsPage.jsx            — surface 1 (overview, 3 tabs)
  ProjectCardPage.jsx         — surface 2 (shell + identity area + tab router)
  LogisticsTab.jsx            — surface 3
  TeamTab.jsx                 — surface 4
  ClosingTab.jsx              — surface 5
  ScopeChangeDialog.jsx       — surface 6
  CancelProjectDialog.jsx     — surface 7
  EditProjectDetailsDialog.jsx— surface 2's edit dialog
  CLAUDE.md                   — module-local mines (written at close)
src/components/
  Ltr.jsx                     — the shared LTR wrapper, extracted from Money.jsx:23-24
  PermissionAwareEmpty.jsx    — the ONE component that renders the three states: empty · no-permission · load-failure
src/lib/
  projects.js                 — status labels + tone map + readiness metrics + gap sentences + ACTIVE_PROJECT_STATUSES
  projects.test.js
  projects.guards.test.js     — the enforcement scans (§6 step 2.1); shaped like `src/App.routes.test.jsx`
  projectChanges.js           — scope-change arithmetic
  projectChanges.test.js
  projectClosing.js           — attendance vocabulary + per-hostess cost + closing-validation summary
  projectClosing.test.js
e2e/
  projects.spec.js            — overview + card + permissions
  project-closing.spec.js     — the closing journey
supabase/migrations/
  <ts>_module6_projects_columns_and_constraints.sql        (A)
  <ts>_module6_project_changes_table.sql                   (B)
  <ts>_module6_assignments_attendance.sql                  (C)
  <ts>_module6_logistics_policy_and_origin.sql             (D)
  <ts>_module6_storage_reports_and_finance.sql             (E)
  <ts>_module6_email_log_accepts_project.sql               (F)
  <ts>_module6_params_seed.sql                             (G)
  <ts>_module6_rpcs.sql                                    (H)
  <ts>_module6_status_machine_and_cron.sql                 (I)
```

### 2.5 DB tables and migrations

**Read:** `projects` · `quotes` · `quote_services` · `products` · `customers` · `assignments` · `hostesses` · `logistics` · `params` · `permissions`/`modules`/`roles`/`users` · `email_log`
**Written (only through RPCs):** `projects` · `project_changes` (new) · `assignments` · `logistics` · `customer_hostess_preference`
**Migration letters:** A–I, nine of them. Each is `applied **<timestamp-id>**` once the typed-echo gate passes; the running counter is reconciled in the DoD.

### 2.6 Dependencies

- **M1** — auth, `current_user_role_id()`, `permissions × modules`. Everything leans on it.
- **M2** — `customers`, and surface 8 lives inside M2's customer page.
- **M3** — `quotes` / `quote_services` (frozen prices, frozen costs, colour, `line_id`, `vat_rate_snapshot`); the approve-RPC that births `projects` and `logistics` rows.
- **M4** — `assignments`, `hostesses`, `customer_hostess_preference`, `smartMatch.js`.
- **M5** — **does not exist.** `src/modules/05_logistics/` is absent. M6 opens `logistics`'s read policy itself (contract item 7); it does not wait.
- **M8/M10/M11** — consumers, not prerequisites.

### 2.7 🔑 Test Identities

**Five seeded users, five `E2E_` pairs — ten keys total, and these are the only ones that exist** *(measured: `.env.example` + `e2e/*.spec.js`)*:

| Env pair | Role it logs in as |
|---|---|
| `E2E_CEO_EMAIL` / `E2E_CEO_PASSWORD` | מנכ"ל |
| `E2E_PROJECTS_EMAIL` / `E2E_PROJECTS_PASSWORD` | מנהלת פרויקטים |
| `E2E_FINANCE_EMAIL` / `E2E_FINANCE_PASSWORD` | מנהלת כספים ולקוחות |
| `E2E_RECRUIT_EMAIL` / `E2E_RECRUIT_PASSWORD` | מנהלת גיוס ושיבוץ |
| `E2E_STAFF_EMAIL` / `E2E_STAFF_PASSWORD` | **מנהלת לוגיסטיקה** — `logistics.test@regin.co.il` *(the name is historical; `e2e/customers.spec.js:152-156` documents that `E2E_LOGISTICS_*` was deleted as a duplicate of this pair)* |

🔴 **Resolve `role → email → user_id` LIVE from the seed at test time. Never hard-code a `user_id` or an email into a spec, a migration, or a SQL check.** The pattern:

```sql
-- resolve, never assume
select u.user_id, u.email, r.role_name
  from public.users u join public.roles r on r.role_id = u.role_id
 where r.role_name = 'מנהלת לוגיסטיקה' and u.status = 'active';
```

**Impersonation must carry BOTH claims.** `current_user_role_id()` resolves through `public.users`, which is keyed on `email`; RLS itself runs under `auth.uid()`. A `set local request.jwt.claims` that carries only `sub` (or only `email`) produces a *half-authenticated* session whose failure mode is indistinguishable from a working policy:

```sql
set local role authenticated;
set local request.jwt.claims = '{"sub":"<user_id>","email":"<email>","role":"authenticated"}';
```

🔴 **Positive control — run it before you trust any zero.** Impersonate a role that **has** `edit` (מנכ"ל on every module; מנהלת לוגיסטיקה on `'לוגיסטיקה'`) and assert the query returns **≥ 1 row**. A `0` there does not mean "RLS works" — it means the impersonation is broken, or `status <> 'active'` (`current_user_role_id()` filters on it, `docs/schema.sql:197-205`), and **a disabled user sees every table empty with the exact signature of "no policies at all"**.

🔴 **And the negative control is only meaningful after the positive one passes.** `{data: null, error: null}` is what a blocked read returns (`src/CLAUDE.md:285-319`) — the client reports "no rows", never "denied".

### 2.8 Product source of truth

**Tier 2 — the approved spec — outranks C5/C6 and outranks `docs/mockups/`, per-item, for everything it actually covers:**

- `docs/specs/module_06_projects/spec.md` — entry point; locked vocabulary (§1.1–§1.8), the ordered decisions (§2), the hand-computed numbers (§3), the cross-module contract (§4), the acceptance chapter (`# ✅ מה ייחשב עובד`, lines 432–452), and **§"🚫 מה אסור לבלופרינט לנחש"** (lines 483–652) — read that chapter before every phase.
- `docs/specs/module_06_projects/processes-approved.md` — the 38 rulings ①–㊳, six process cards, five cross-module contracts, the status machine and formulas (§🔄4), the closing card (§🏁).
- `docs/specs/module_06_projects/screens-approved.md` — eight screen cards. **Line ranges:** surface 1 = 69–374 · 2 = 375–679 · 3 = 680–976 · 4 = 977–1190 · 5 = 1191–1545 · 6 = 1546–1752 · 7 = 1753–2015 · 8 = 2016–2300 · consolidated DB table = 2301–2377 · wording-contradiction appendix = 2378–2467.
- `docs/specs/module_06_projects/mockup-data.md` — the dataset the mockups are drawn on. 🔴 **It is cited as an anchor by `screens-approved:279` and was left off `spec.md §①`'s reading list. Read it.**
- `docs/mockups/project-management-screen/approved/*.html` — **eight files, all approved by Ishay 13/08/2026 (*"אין לי תיקונים בכלל"*).** For **appearance** (layout · order · colour · label wording · emphasis) the approved mockup wins and is built as drawn. For **behaviour, data and settings** the spec wins even against the drawing. 🚫 The mockups in the *parent* directory (`01_overview_reworked.html`, `02.png`, `03.png`, `04.png`) are tier 4 and are **not** input.
- `docs/db_roadmap.md` block `A-M6` (rows M6-1…M6-14) **+ §5 Storage (3 live rows)** **+ `A-14`, which sits in table A1 *outside* the `A-M6` block** — the `SET NOT NULL` of §7.62. 🔴 **A session that reads only the block misses a ruled migration item.**
- `docs/PROJECT_MASTER.md` §3 (permissions matrix, lines 184–196) and §6 (debt register, lines 371–613) · `docs/PROJECT_MASTER_sec7.md`.

🚫 **What not to read as a product source:** `discovery-log.md` (historical "why") · `PROJECT_MASTER §5.6`/§5.7 (describes four status tabs the Discovery replaced, and points at retired PNGs) · module 4's approved mockups (they colour by date proximity — the exact opposite of `F20` — and their hexes are Tailwind 3 while the app runs 4.3.3 in `oklch`). **The rule is directional, not a reading ban:** read C5/C6 only for what the approved spec does not answer, and anything there that contradicts it loses.

### 2.9 Environment facts

- **Supabase client import: `@/supabaseClient`** — the file is `src/supabaseClient.js`. ⚠️ **NOT `@/lib/supabaseClient`** (does not exist).
- Alias `@/` → `src/`. Dev server: `npm run dev`, port **5173**.
- **Full Hebrew RTL.** `dir="rtl"` on `<html>`. **Physical Tailwind utilities only** — `right-0`, `mr-60`, `pr-9`, `text-right`. There is not one `ms-`/`me-`/`ps-`/`pe-` in all of `src/`; a logical `ms-60` under `dir="rtl"` renders *under* the sidebar — looks fine in preview, broken in the app.
- **JavaScript, not TypeScript.** Vite 8 + React 19 + Tailwind 4 + shadcn/ui (hand-edited for RTL — ⛔ `npx shadcn add` overwrites back to LTR with no error and no failing test).
- **Baseline before module 6, measured `14/08/2026 01:23`:** `npm run test:run` → **`Test Files 26 passed (26)` · `Tests 752 passed (752)`**, exit 0.
- **Timestamps:** PowerShell `Get-Date`; Bash `date +"%d/%m/%Y %H:%M"`. Never mix. Never guess.
- **Line counting:** `(Get-Content -LiteralPath X).Count`. ⚠️ Not `Measure-Object -Line` — it silently skips blank lines.

---

## 3. 🧭 Decisions Ledger

> **Reading key.** `Ishay` = his ruling, quoted and dated — binding, not reopened without a new ruling from him. `Claude (delegated)` = ruled under his explicit delegation (*"מה שתמליץ אני מסכים"*, 13/08) — **may be reopened without ceremony**. `Claude (technical)` = a column name or an implementation shape with no product meaning. `OPEN` = still his, and the step it blocks says so inline.

### 3.1 Product & process rulings

| # | Item | Ruling | Who | Date | Unblocks |
|:-:|---|---|---|---|:--:|
| ① | Scope change edits quantities only | No retroactive unit-price editing. An addition is a new line with its own price, never an edit of a line the customer approved. *"כן ברור, משנים רק כמויות"* | Ishay | 13/08/2026 | 1.2 · 3.6 |
| ② | `project_changes` is a new table | One row per change: what · by how much (positive = addition / negative = reduction) · **frozen price and cost** · **reason (mandatory)** · who · when. The quote stays frozen. *"מסכים, טבלה חדשה. זה תיעוד חשוב גם לדוחות בהמשך"* | Ishay | 13/08/2026 | 1.2 · 3.3 · 3.6 |
| ③ | An addition inherits the original quote's terms | Including the discount that was given | Ishay | 13/08/2026 | 2.2 |
| ③ↄ | **Tier-crossing does not reprice** | A quantity increase that crosses into a cheaper catalogue tier is still billed at the **frozen** quote price. Anchors: `AIA A201-2017 §9.1.2` (a tier crossing is not by itself a pricing event) · `FAR 52.216-2(c)(3)` (forward-looking only) · Shopify B2B (volume discounts are per-order, not cumulative). 🔴 **The decisive reason: repricing down on increase forces repricing *up* on decrease, and ⑯ measured that the most common last-minute change is a *reduction*.** The dialog line, shown only when the new total crosses into a cheaper tier: *"420 יחידות נכנסות בקטלוג למדרגת מחיר זולה יותר. התוספת מחויבת לפי המחיר שאושר בהצעה — לא לפי מחיר הקטלוג של היום."* 🚫 **No ₪ figure in that line** — the dialog already shows "השפעה על ההכנסה", and two numbers in a row fires bidi trap #9. | Claude (research, under ①+③) | 14/08/2026 | 2.2 · 3.6 |
| ④ | No profit give-back on a scope change | Not as a "goodwill gesture" | Ishay | 13/08/2026 | 2.2 |
| ⑤ | Cancellation releases every hostess automatically | All of them, together, no picking. *"לגבי שחרור דיילות זה אוטומטי ברגע שהאירוע בוטל לדעתי"* 🔑 Do not confuse with a scope **reduction** (6→4), where **the recruitment manager picks who** — that is M4's screen | Ishay | 13/08/2026 | 1.8 · 3.7 |
| ⑥ | No notifications anywhere in the system | The shared screen is the channel. *"אני חשבתי כדי לפשט שלא יהיו נוטיפיקציות במערכת"* | Ishay | 13/08/2026 | 3.1 |
| ⑦ | Derived from ⑥ — a screen never hides a state that needs someone's attention | | Ishay | 13/08/2026 | 3.1 |
| ⑧ | No computed urgency score | One sorted list, and every row says in words why it is there. Three independent research domains returned the same answer | Ishay | 13/08/2026 | 2.1 · 3.1 |
| ⑨ | Staffing and logistics stay **two separate metrics** | Never merged into one percentage. World anchor: Rentman is the only system measured that tracks both dimensions and deliberately keeps them separate | Ishay | 13/08/2026 | 2.1 · 3.1 |
| ⑩ | Three cancellation reasons, not four | *"בעיית איוש"* is removed. *"שמעת על עסק שמבטל ללקוח כי אין לו עובדים?"* | Ishay | 13/08/2026 | 1.1 · 3.7 |
| ⑪ | `כוח עליון` carries a mandatory explanatory line | *"מלחמה · אסון טבע · צו ממשלתי. **לא**: שינוי דעה של הלקוח."* — it is the only option that takes money away from hostesses | Claude (delegated) | 13/08/2026 | 3.7 |
| ⑫ | M6 owns the definition of "active project" | **`not_started` · `in_progress` · `ready`** — everything before `event_finished`. 🔴 **`cancelled` is NOT active.** Written once, imported everywhere. *"מודול 6 מגדיר את הרשימה הקנונית פעם אחת, וכל מודול מייבא אותה"* | Ishay | 13/08/2026 | 2.1 · 2.6 |
| ⑬ | A logistics row carries a pointer to the quote line that produced it | Same SKU in two colours ⇒ two indistinguishable rows, because `quote_services` has `color` and `logistics` does not | Ishay | 13/08/2026 | 1.4 |
| ⑭ | **Exactly two timestamps: cancellation · operational closing** | 🚫 **No `ready_at`, no stamp per transition.** Both chosen stamps have a proven consumer today; `ready_at` has none, not even a hypothetical | Ishay | 13/08/2026 | 1.1 |
| ⑮ | "Budget variance" drops out of C6 §2.4.4's derived attributes | *"סבבה תוריד, המלצה טובה"* | Ishay | 13/08/2026 | — |
| ⑯ | **Time informs, never blocks** | Every change is recorded, at any time, until closing. A late change is **marked in text** (*"שינוי 18 שעות לפני האירוע"*). 🚫 **No time threshold anywhere. Not `T-36`, not any other.** *"מאשר"* | Ishay | 13/08/2026 | 2.2 · 3.6 |
| ⑰ | Overview is three tabs named after **what Dana does**, not after statuses | `בעבודה` · `לסגירה` · `הכול` | Claude (delegated) | 13/08/2026 | 3.1 |
| ⑱ | A cancelled project lives in `הכול` behind a filter, not in its own tab | Cancellation is not work | Claude (delegated) | 13/08/2026 | 3.1 |
| ⑲ | `event_finished` reads **`ממתין לסגירה`** on screen | The DB value does not move. 🚫 **`אירוע הסתיים` must not appear anywhere in the UI, on any screen** | Claude (delegated) | 13/08/2026 | 2.1 |
| ⑳ | `actual_guests` is not a billing input | Goods are billed as ordered; labour as performed. 300 printed ⇒ 300 billed even if 250 arrived | Ishay | 13/08/2026 | 3.5 |
| ㉑ | **Moving the date resets every final approval and re-invites** | And the screen shows the consequence **before** confirmation | Claude (delegated) | 13/08/2026 | 1.8 · 3.2 |
| ㉒ | Moving the location does **not** reset approvals — an update mail goes out — **and `lat`/`lng` reset to `NULL` in the same operation** | ⚠️ **The coupling that must be written down:** `ensureProjectCoordinates` (`04_hostesses/api.js:87-99`) returns early when both columns are filled, so **the re-geocode happens only because M6 nulls them.** Make the null conditional and the map pin freezes on the old address forever | Claude (delegated) | 13/08/2026 | 1.8 · 3.2 |
| ㉓ | A project reaching 100% **after** the event date goes to `event_finished`, not `ready` | *"סבבה"* | Ishay | 13/08/2026 | 1.9 |
| ㉔ | A scope change discovered after the event enters through the **closing screen**, not the scope dialog | *"צודק וזה הגיוני, בגלל זה מזינים נתונים כאלו בסגירת אירוע"* | Ishay | 13/08/2026 | 3.5 |
| ㉕ | **Cancellation does not touch logistics rows** | No fourth item status, no cascade. *"מאשר לפי המלצתך"* — an item marked `ordered` at the moment of cancellation **is the evidence for billing; changing it deletes the proof** | Ishay | 13/08/2026 | 1.8 |
| ㉖ | **No stepper in the project card** — not 5 stages, not 8 | Replaced by the status tag (⑲) + the two separate metrics (⑨). *"מאשר, חשבתי שזה נחמד אבל אתה צודק כי הוא מטעה"* | Ishay | 13/08/2026 | 3.2 |
| ㉗ | A logistics row has an **origin**: quote line **or** change line — two columns, exactly one filled | ⚠️ Scope self-corrected: this is a **fulfilment** problem, not a money one. The money lives in `quote_services` + `project_changes` | Ishay | 13/08/2026 | 1.4 |
| ㉘ | **The RPC is the unit of authorisation, not the column** | The finance manager writes `invoice_sent`/`payment_date`/`feedback_*` through a dedicated function requiring `'כספים'` — **without `edit` on `'פרויקטים'`**. Closes §7.63 | Claude (delegated) | 13/08/2026 | 1.8 |
| ㉙ | **Locking is a precondition inside the RPC, not a column property** | After the operational closing the operational RPCs refuse; the finance RPCs keep working. Same shape as the live `enforce_quote_in_progress_lock`, which throws `P0001` in Hebrew. Closes §7.77 | Claude (delegated) | 13/08/2026 | 1.8 |
| ㉚ | The move to `event_finished` is written by a **daily `pg_cron` job** | Not a trigger — "the date passed" is a passage of time, not a data event. `pg_cron` is installed and already runs two jobs. Closes §7.32 | Claude (delegated) | 13/08/2026 | 1.9 |
| ㉛ | **Three buckets** — `marketing` (exists, public) · `reports` (new, private) · `finance` (new, private) | By number of distinct access rules, not by number of file types. Plus the `project_closed_needs_report` CHECK, because **there is no transactional guarantee between Storage and Postgres**. Closes §7.61 and §7.36 | Claude (delegated) | 13/08/2026 | 1.5 |
| ㉜ | **M6 sends the customer survey, at the operational closing. M8 does not send at all** | The strong reason is not response rate — it is **score distortion**: delay correlates negatively with the score in 3 of 6 scales (n=10,912). Closes §7.39 | Claude (delegated) | 13/08/2026 | 3.5 |
| ㉝ | Changing event **hours** behaves like location (㉒), not like date (㉑) | Approvals stand, an update mail naming the new hours goes out. 🚫 No extension/shortening distinction was built — that is logic for a case never observed | Claude (delegated) | 13/08/2026 | 1.8 · 3.2 |
| ㉞ | Feedback fields split three ways | **Sending the survey ⇒ writing `feedback_status`** is M6's. **Entering the score and reason** is M8's. **Displaying** is M2/M7/M8 — and M6 shows it **read-only** on the card, because *"זהו תיק-האירוע"* | Claude (delegated) | 13/08/2026 | 1.8 · 3.2 |
| ㉟ | **`projects.project_bonus` is dropped** | *"לא עשינו בהצעת מחיר בונוס לפרויקט, בוא נמחק את זה"* — measured: no bonus line in any quote, zero references in `src/`. `assignments.personal_bonus` stays, **owned by M8**. 🚫 **M6's closing screen does not touch bonus** | Ishay | 13/08/2026 | 1.1 |
| ㊱ | `owner_email` / `owner_name` / `owner_phone` are shown read-only in the card identity area | | Claude (delegated) | 13/08/2026 | 3.2 |
| ㊳ | The survey **send** is already automatic; only the **return** of the score is manual | And in any future automation, the "score < 3 ⇒ mandatory phone follow-up" obligation must survive | Claude (delegated) | 13/08/2026 | 3.5 |
| ט4-א | A hostess who did not arrive: the quality field is **disabled, not empty** | *"אי-אפשר לשפוט מי שלא ראית."* 🔑 Empty looks like forgetting; disabled-and-explained looks like a decision | Claude (delegated), re-tested and confirmed final | 13/08/2026 | 3.5 |
| ט4-ב | Per-hostess hours default from the event hours and are **overridable** | M6 **records** the hours; **deriving payment from them is `§7.19`, still open, and M8's** | Claude (delegated) | 13/08/2026 | 2.3 · 3.5 |
| ט4-ג | `actual_guests` is stored and changes no billing | | Claude (delegated) | 13/08/2026 | 3.5 |
| ט4-ד | `שמור ושלח` is **one atomic action** | A mid-way failure must roll everything back, or a project "closes" with half its data | Claude (delegated) | 13/08/2026 | 1.8 · 3.5 |
| **R-1** | 🔴 **No draft-save on the closing screen — no table, no columns, no autosave, no navigation guard** | Asked as a field-reality question — *"does Dana ever close an event across two sittings?"* — and answered **`לא`**. ⇒ **the whole two-sitting model is deleted, not deferred.** The in-memory draft of ט4-ד is the only draft there is. 🚫 **Do not build a navigation guard "just in case"** — that is logic for a case whose existence was denied. *(This closes what was open item **B1**; B1 is removed from §3.5 rather than left dangling.)* | **Ishay** | **14/08/2026** | 3.5 |
| **R-2** | 🔴 **`assignments.travel_amount` is not on the closing screen** | Asked as a field-reality question — *"is travel reimbursement ever agreed in the field?"* — and answered **`לא קורה`**. ⇒ **it is a fixed `params` sum, owned by M8 (§7.69)**, and M6's closing form neither shows nor writes it. *(This closes what was open item **B14**; B14 is removed from §3.5.)* | **Ishay** | **14/08/2026** | 2.3 · 3.5 |

> 🔑 **Why R-1 and R-2 are recorded as rulings and not as deletions.** Both are **reality rulings** — the cheapest kind, because they close an item permanently at the cost of one question. Their danger is that they leave **no artefact**: a later session re-reads the spec, sees an unhandled two-sitting case or an unwritten `travel_amount` column, and re-opens work Ishay already killed. **The quoted `לא קורה` is the guard.** *(`CLAUDE.md` iron rule 1's reality filter: "A plain `לא קורה` **closes** the item: it's his ruling, dated and his.")*

### 3.2 Architecture rulings (14/08/2026)

| # | Item | Ruling | Who | Anchor | Unblocks |
|:-:|---|---|---|---|:--:|
| **AR-1** | Cancellation-type column | **`projects.cancel_type text not null check (cancel_type in ('customer','force_majeure','other'))`** — **one column**, alongside the existing `cancel_reason`. **The money type is derived in code, never stored** (`other` behaves as `customer`) | Claude (architecture) | `grep "create type"` across the repo ⇒ **zero**; `check (… in (…))` appears **19 times** in `schema.sql`. And the precedent for a value that is a pure function of a stored value is *derive, don't store* — `src/lib/hostesses.js:36-37`. ⚠️ Overrides `spec.md:474`'s two-column suggestion; its motive (that `other` survives into reports) is fully served by a three-value label column | 1.1 · 2.1 · 3.7 |
| **AR-2** | `logistics` read policy gate | **`'לוגיסטיקה'`, not `'פרויקטים'`** | The measured rule: a policy hangs on the module that **owns the table**, not on the module whose screen reads it. M4 proved it on the same shape — `20260809134237` hangs its four tables on `'דיילות'` and, when it needed `projects`, hung that on `'פרויקטים'` (`schema.sql:938`). **Dana reads under either choice; a `'פרויקטים'` gate would additionally leak logistics to מנהלת כספים and מנהלת גיוס, whom the matrix blocks from `'לוגיסטיקה'`** | 1.4 |
| **AR-3** | How the two overview metrics reach the client | **A dedicated `SECURITY DEFINER` RPC `list_projects_overview()`**, gate `'פרויקטים'` at the top of the function, returning one row per project with the metrics **already counted** (`hostesses_confirmed`/`hostesses_required`, `logistics_ready`/`logistics_total`). 🚫 **Not a browser-side join, not a `view`.** 🔴 **And therefore: DELETE `screens-approved:200,336`'s "widen `assignments_select_by_permission` to `'פרויקטים'` holders" — widening would hand hostess names, rates and phone numbers to every 👁-on-projects holder** | Claude (architecture) | `grep "create view"` ⇒ **zero across the repo**; `src/lib/hostesses.js:255` says so in code. And the browser-join is exactly what `listStaffingOverview()` does (`04_hostesses/api.js:135-146`) — which works only because *its* user has view on `'דיילות'`. ⚠️ Cost: the `MAX(assignment_number)` fold gets a **second implementation** (`DISTINCT ON` in SQL beside the JS); §3.2's numbers (`1/6`, `0/1`) are the test that pins both | 1.8 · 2.5 · 3.1 |
| **AR-4** | Reducing a logistics item to zero | **Zero is forbidden.** `check (planned_qty > 0)` stays, the row is never deleted, the dialog blocks before submit | Claude (architecture) | ㉕ verbatim: *"השורות עצמן הן הראיה לחיוב… לשנות אותו = למחוק את ההוכחה."* Deleting the row destroys more than ㉕ already rejected. And the wording is already written and approved (`screens-approved:848`): *"הכמות חייבת להיות גדולה מאפס. להסרת פריט לגמרי — פני למנהלת הלוגיסטיקה."* | 3.6 |
| **AR-5** | 🔴 **The atomic-vs-email boundary — the heaviest one** | **Inside the transaction: everything that is a fact about what happened. Outside, after commit, in client code: every send.** A DB transaction cannot send mail (`§7.33`: *"טריגר במסד אינו יכול לשלוח מייל"*), and `feedback_status='sent'` written inside the transaction is a **lie the moment the send fails**. ⇒ **Flow:** RPC closes the facts ⇒ commit ⇒ download the report + send it ⇒ send the survey ⇒ **only on success** a second, narrow RPC `mark_feedback_survey_sent` writes `feedback_status='sent'` **and nothing else**. **When the DB closes and the send fails: the closing stands** — it recorded facts. `feedback_status` stays `'not_sent'`, **which is now true rather than decorative**, and the screen names which mail failed. 🔴 **⇒ ㉙ must be written as a whitelist of the operational RPCs, not as "any RPC touching a closed project"** — otherwise there is no path back to retry the send | Claude (architecture) | The measured pattern: `04_hostesses/api.js:523-570` — writes first, then `sendFinalApprovalMails`, with a `{sent, unknown, failed}` counter. **Three send outcomes, not two** (`email.js:205`). ⚠️ M6 does **not** build a retry engine — that is `§7.36`, 🟡, owned by M10 | 1.8 · 3.5 · 3.7 |
| **AR-6** | 🔴 **Final gross profit — M6 does NOT freeze it** | **M6 freezes only the inputs it owns:** `assignments.actual_hours` per hostess · the three attendance columns · `projects.actual_hours`/`actual_guests` · the operational-closing timestamp. **No `final_gross_profit` column in M6's migration, and no profit computation in M6's code.** The freeze moves to M8's closing window | **Ishay, 14/08/2026 01:17** — clarifying `§7.52`: *"בסגירת-האירוע"* means the **financial** closing (M8), not the operational one (M6). `db_roadmap` row **M6-8** was re-scoped the same day to match | 1.1 · 2.3 · 3.5 |
| **AR-7** | Attendance → reliability mapping | 📏 **The two constants, counted `14/08/2026` — and "seven" is wrong in both directions, so do not carry it:** `ATTENDANCE_OUTCOMES` (`smartMatch.js:43-52`) holds **EIGHT** members — `ARRIVED · SLIGHTLY_LATE · MODERATELY_LATE · VERY_LATE · WITHDREW · NO_SHOW · SICK · EXCUSED`; `ATTENDANCE_VALUES` (`:56-63`) holds **SIX** scored entries — `SICK` and `EXCUSED` are **deliberately unscored** (`:54-55`: excluded from numerator *and* denominator). ⇒ 🚫 **Any instruction of the form "the seven weights, byte-for-byte" is false and must not be written into a step.** **The numbers M6 must not move are the six in `ATTENDANCE_VALUES`.** ⚠️ **And `ATTENDANCE_VALUES` is `const`, not exported** — a test cannot import it; assert through the scoring function. **Why it still cannot be wired as-is, three measured reasons:** ① `:43-52` keys on **Hebrew in a single `outcome` field** while M6 defines **three English columns** (the code declares this itself at `:195`) · ② 🔴 **`WITHDREW` is not an attendance value at all** — it maps to `approval_withdrawn`, an **`assignment_status`**; a hostess who cancelled is **not on the closing list**, so her `0.5` must come from `assignment_status`, on a separate branch · ③ two booleans must be derived: `projectCancelled`, `eventPassed`. ⚠️ **Silent-failure risk: `smartMatch.js:207` is `if (value === undefined) continue`** — a mis-mapped value drops the row silently instead of throwing. ⚠️ **And a second, larger silent zero: `src/lib/smartMatchCandidates.js:81` hard-codes `attendance: []`** — see step 2.7 | Claude (architecture) | measured 14/08/2026 | 1.3 · 2.7 |
| **AR-8** | `email_log` design | **Two new `entity_type` values: `'project'`** *(no attachment)* **and `'project_report'`** *(attachment required)*, **both mapped to `'פרויקטים'`**, covered by **one** new SELECT policy. 🔴 **Why not reuse `'shift'`: measured 403.** `index.ts:116` requires `permission_level === 'edit'` and `ENTITY_MODULE.shift = 'דיילות'` — **Dana has 👁, not V, on `'דיילות'`** ⇒ every cancellation mail she sends would be rejected 403, silently, and no hostess would hear anything. 🔴 **The CHECK ships in the same migration as the code** (`index.ts:31-34`: not before it, or *"המייל יוצא והיומן נשאר ריק"*) | Claude (architecture) | `index.ts:35` — making the attachment optional globally *"הייתה מוחקת שומר חי מנתיב הצעת-המחיר… ואף בדיקה קיימת לא הייתה נופלת על כך."* ⚠️ **`db_roadmap A-20` says only "M4/M8/M11 widen by one value each" — M6 is not on that list and widens by two. Fix the row** | 1.6 |
| **AR-9** | `projects.quote_id` / `owner_email` `NOT NULL` | **`SET NOT NULL` on both, in M6's migration.** §7.62 was fully nodded by Ishay 13/08/2026 evening; `spec.md` was stale and is now corrected. **Preconditions, in this order:** ① live NULL count · ② **non-zero ⇒ stop and report. Do not delete, do not silently backfill.** · ③ the `SET NOT NULL` runs **after** `DROP project_bonus` and after every row-creating step | Ishay (13/08) + Claude (execution order) | The executing row is `db_roadmap` **`A-14`**, outside the `A-M6` block | 1.1 |
| **AR-10** | The `unique_violation` message | **A pre-query is the primary mechanism; constraint-name mapping is the backstop.** 🔑 **And the correction that must not be missed: if the RPC implements ㉑ correctly the violation is unreachable in the normal flow** — ㉑ resets every final approval first, and the index is **partial** (`where assignment_status='finally_approved'`), so after the reset it no longer covers those rows. ⇒ **The pre-query is what actually warns; the error handler is the backstop.** 🔴 **And the spec cites the wrong pattern:** `spec.md:301` and `screens-approved:550` point at `SERVER_MESSAGE_RULES` (`quotes.js:334`), which keys on **message prefixes** — the wrong tool for a constraint violation. **The right one is `SERVER_CONSTRAINT_RULES` (`src/lib/hostesses.js:603-613`)**, which keys on the **index name** and already carries this index. Reason given there (`:600-602`): *"את הנוסח PostgreSQL מנסח, ואילו השם הוא חוזה שאנחנו כתבנו במיגרציה."* **Wording (extended from the approved text, with the conflicting event `spec.md:301` demands):** *"`{full_name}` כבר מאושרת סופית ל\"`{event_name}`\" בתאריך הזה. בחרי תאריך אחר, או שחררי אותה מהאירוע ההוא."* **Backstop, without a name** (at that point there is nothing to interpolate): *"אחת הדיילות המאושרות כבר משובצת סופית לאירוע אחר בתאריך היעד. בחרי תאריך אחר, או שחררי אותה מהאירוע ההוא."* ⚠️ **The statement order inside `update_project_details` is a build decision this guide states explicitly — reverse it and a legal date move becomes a hard failure** | Claude (architecture) | 1.8 · 2.5 · 3.2 |

### 3.3 Surface-level rulings

| # | Item | Ruling | Who | Anchor |
|:-:|---|---|---|---|
| **S-1** | 🔴 **Status tone map — RULED, all eight labels, one home** | **The map, and it is complete — a build session copies it, it does not re-derive it:** `טרם החל`→`muted` · **`בתהליך`→`muted`** · **`מוכן לביצוע`→`teal`** · **`ממתין לסגירה`→`warn`** · `ממתין לחשבונית`→`muted` · `ממתין לתשלום`→`muted` · `פרויקט הסתיים`→`ok` · `בוטל`→`dashed`. **Home: `PROJECT_STATUS_TONES` in `src/lib/projects.js`, spread into `StatusTag.jsx` — never retyped there.** 🔑 **Why `מוכן לביצוע` is not green:** 🔄6② rules it **reversible**, and `ok` is defined *"סגור, אין מה לעשות"* — painting a reversible state green contradicts the ruling printed two lines beneath it in the card itself. 🔑 **Why `בתהליך` is not teal:** on the overview **most rows are `בתהליך`**, and a tone that paints the majority stops separating. *(This closes what was cited as open item **A8**. **A8 never existed as a §3.5 row** — it was cited in three places and had nowhere to be answered, which is exactly the routing defect this revision was run to remove.)* | Claude (architecture) | **The baseline is surface 8's §⑥ table** (`screens-approved.md:2178-2193`), which proposes: `not_started`→`muted` · `in_progress`→`teal` · `ready`→`ok` · `event_finished`→`warn` · `awaiting_invoice`/`awaiting_payment`→`muted` · `finished`→`ok` · `cancelled`→`dashed`. **Measured against all eight mockups:** `בתהליך` is `tag muted` in `01`, `04`, `06` and **`tag teal`** in `02`, `03`, `08` — **3 against 3** · `מוכן לביצוע` is `tag teal` in `01` but `ok` in the table · **`ממתין לסגירה` is `tag warn` in `01` and `08` but `tag teal` in `05`**. **Why it escaped visual approval of all eight: no single artefact shows the same status twice.** Reasons for the two ruled: `teal` means *"a positive interim state waiting for you"*, but on the overview **most rows are `בתהליך`**, and a tone that paints the majority stops separating; and §⑥ itself rules two lines later that *"מוכן לביצוע ≠ הישג — מצב רגעי והפיך"* (🔄6②) while `ok` is defined *"סגור, אין מה לעשות"* — painting a reversible state green contradicts the ruling printed beneath it. **And surface 8's card says so itself:** *"שמונת משטחי מ6 מציגים את אותם סטטוסים, ושני משטחים שיצבעו אותם אחרת הם סתירה, לא בחירה"* |
| **S-2** | 🔴 **The `0.00 ₪` trap** | **`הכנסה מתוכננת` must distinguish three cases — no quote · no permission · genuine zero — and only the first two render `—`.** | Claude (architecture) | The figure is `Σ(quote_services.qty × closing_unit_price)` through `projects.quote_id`. `quote_services` is gated on `'הצעות מחיר'` (`20260723113500:34-38`) and **מנהלת גיוס and מנהלת לוגיסטיקה are `➖` there** (`PROJECT_MASTER:193-194`) ⇒ **the DB already hides it, no UI work needed** — 🔴 **but `Σ` over zero rows is `0`, not `null`**, so both tiles would render **`0.00 ₪`** and **`0 אורחים`** as facts. `StatTile.jsx:25` names this failure exactly: *"⚠️ `null` אינו `0` — מדד שאין לו נתון מציג טקסט ולא מספר, אחרת «0 ₪» נקרא כעובדה שקרית."* The card covered only the "no quote" case |
| **S-3** | `set_project_coordinates` needs no permission fix | ㉒ **is** the fix and it costs nothing: M6's RPC is itself `SECURITY DEFINER` on `projects`, so nulling `lat`/`lng` in the same transaction needs no M4 permission at all. The refill happens by itself — `04_hostesses/api.js:87-99` geocodes on every Smart-Match entry when the columns are empty | Claude (architecture) | ⚠️ **The one coupling that must be written into the build:** `ensureProjectCoordinates` returns early when both are filled ⇒ **the refill happens only because M6 nulls them** |
| **S-4** | The `0/N` victim was misidentified in the card | **מנהלת פרויקטים holds `👁` on `'דיילות'` ⇒ her metric works.** The ones who see `0/6` on every row are **מנהלת כספים ולקוחות and מנהלת לוגיסטיקה** — and logistics is the role whose whole job is on that screen | Claude (measurement) | `PROJECT_MASTER:184-196` |
| **S-5** | Zero primary buttons in the overview header | **Precedent, not deviation** — M4's approved overview is `<h1>דיילות</h1>` alone, and its single action is **amber, not teal**, inside the filter row | Claude (delegated) | ⑧1 |
| **S-6** | Red row = **zero `assignments` rows** | Counted: `tr.block` appears **once** in `בעבודה`, inside the budget `01_overview:125` declares (*"1–2 למסך"*). Adding the 1-of-6 case pushes `הכול` out of budget | Claude (delegated) | 🔁 one line to change |
| **S-7** | "Event proximity" for past dates = **absolute distance both ways** | `mockup-data.md:164` verbatim: *"🚫 אל תשים אותו בראש רשימה — הוא ייראה כמו באג-עיצוב."* ⚠️ **And `:293-294` numbers the same two rows in the opposite order — an internal contradiction in the data file; fix it** | Claude (delegated) | 3.1 |
| **S-8** | No location column in the overview | ⚠️ **The deviation is stronger than the card said: not only the mockup — M4's *built* screen shows location** (`OverviewTab.jsx:225,301`). **What reconciles them:** in M4 location **is** a ranking input (0.25 of the score); in M6 it has no consumer that separates projects. **This sentence must appear in the build**, or the first engineer to open both screens reads it as an oversight | Claude (delegated) | 3.1 |
| **S-9** | A counter in every tab | Two built screens already do it with the same pill (`CustomerDetailsPage:119-127` · `QuotesPage:374`). ⚠️ M4 has none ⇒ the system is 2-to-1 and M6 joins the majority | Claude (delegated) | 3.1 |
| **S-10** | Tiles count **events**, not hostesses; both on ⑫'s active list | ⚠️ **Not zero-cost:** the counter is wrong until `OPEN_PROJECT_STATUSES` is fixed (`api.js:56` — missing `ready`, `db_roadmap M6-14`), **and the fix must move the constant to a shared home** or M6 holds a third definition | Claude (delegated) | 2.6 · 3.1 |
| **S-11** | Pill counters; a 0-pill is dimmed and explained, never removed | `FilterPill.jsx:14-17` verbatim. ⚠️ **A mine no gate catches:** `check:bidi` flags a digit adjacent to `₪`/`★`/`×` **but not a digit after a Hebrew word** ⇒ **a missing `.ltr` on a counter passes green** | Claude (delegated) | 3.1 |
| **S-12** | "כהן" drops — render the logged-in user | `Topbar.jsx:51-55` **already does the right thing**. "דנה" is the persona; "כהן" came from the missing design-contract skeleton | Claude (measurement) | 3.1 |
| **S-13** | 🔴 **Do not link the customer name** *(rejects the card's recommendation)* | **Measured: there is not one entity→entity link in the built application.** `QuotesPage:626` renders a customer name as a `<div>` with **no `onClick`, deliberately**. ➕ **And the blocker the card missed:** גיוס and לוגיסטיקה are `➖` on **customers** ⇒ **a link that rejects 2 of 5 users is worse than no link.** The "one line" estimate is a third of the real price | Claude (architecture) | 3.2 |
| **S-14** | `ביטול פרויקט` lives on the card **shell** | The closing tab is gated on `event_finished`, and cancellation is allowed *"בכל שלב פעיל"* ⇒ **C5's placement makes the control unreachable in exactly the window it is needed.** ⚠️ **Requires a "סטייה מ-5.6.7" note in the living docs — not optional** | Claude (architecture) | 3.2 |
| **S-15** | `שינוי תכולה` is the primary action | Built detail-page pattern: solid teal beside `variant="outline"` (`CustomerDetailsPage:318-331`) | Claude (architecture) | 3.2 |
| **S-16** | Stat tiles are not clickable | Measured **all 15 `StatTile` usages** — none inside an `onClick`/`Link`/`button`. **Zero exceptions** | Claude (measurement) | 3.2 |
| **S-17** | Past date and cross-midnight: **inform, do not block** | ⑯ + `dates.js:61-66` already returns `22:00–02:00` with no ordering check ⇒ **blocking is new code fighting an existing helper.** ⚠️ **And no red:** a past date is a fact ⇒ `calm`; only cross-midnight gets amber | Claude (architecture) | 3.2 |
| **S-18** | Default tab = **the first one**, and state lives in `useSearchParams`, not `useState` | `src/CLAUDE.md` verbatim: *"מצב שחי בקומפוננטה מת יחד איתה… מצב-התצוגה שייך ל**כתובת**."* ⚠️ **And this already bit:** swapping a setter for a URL **silently breaks every `setX(v => …)`** — it happened in `CustomersPage` on 30/07 and only one had a test | Claude (architecture) | 3.2 |
| **S-19** | `שבת` stays, and `weekdayOf` moves to `src/lib/dates.js` | A Hebrew weekday array **already exists in production**: `shiftInvite.js:117`. ⚠️ **The forms differ**, so the temptation is to copy — **and this project has already paid twice for two functions with one name.** ⚠️ **Must use the same `Date.UTC(y,m-1,d)`** — a local `new Date(iso)` shifts the day into Asia/Jerusalem **for a subset of dates only** | Claude (architecture) | 2.4 · 3.2 |
| **S-20** | The project owner stays in the identity area | `F20` permits colouring *"אין מנהל-אירוע משובץ"* — **a field that is not rendered cannot look missing** | Claude (delegated) | 3.2 |
| **S-21** | One feedback cell, not four tiles | ㉞: *"זהו **תיק-האירוע**"* — a file to read on a phone, not a form. Four tiles = four "no data yet" lines on the drawn project | Claude (delegated) | 3.2 |
| **S-22** | Four `feedback_status` phrasings, with one correction | 🔴 **`completed` cannot be "the score itself"** — `feedback_status` and `feedback_score` are **independent in the schema**, and `completed` + `NULL` is a legal row ⇒ it needs its own wording (*"הסקר מולא"*) when there is no score | Claude (architecture) | 3.2 |
| **S-23** | `owner_email` on its own line | `src/CLAUDE.md`, the ninth incident: *"לרצף בן שני ערכים **אין סדר נכון בכלל** ⇒ **התיקון הוא לפרק את הרצף**, לא לבודד אותו"* | Claude (architecture) | 3.2 |
| **S-24** | The tone map lives in **one place**, and `StatusTag.jsx` gets an **owning step** | `src/lib/projects.js` holds `PROJECT_STATUS_TONES`; **step 3.0 owns the `StatusTag.jsx` edit** and spreads the map in. Tested with `describe.each` over all eight labels. ⚠️ **Mine: the key is the displayed Hebrew label and a miss falls to `muted` silently** (`StatusTag.jsx:50` — `?? TONES.muted`) ⇒ **the key for `event_finished` must be `'ממתין לסגירה'`**; `'אירוע הסתיים'` yields a grey tag with no error. 🔴 **And the failure is worse than "grey": `TONES.muted` is byte-identical to the tone of `ממתינה למענה`**, so an unmapped label is **visually indistinguishable from a real status.** ⇒ **the test must fail on an unmapped label, not merely assert the eight present ones.** 📏 **Measured `14/08/2026`: `TONE_BY_LABEL` holds exactly TEN entries — 2 hostess states + 6 assignment statuses + 2 derived (`פג תוקף`, `הושלם`) — and ZERO project statuses.** ⚠️ **Five of the ten keys are unquoted object keys, so a grep for `'…':` undercounts by five.** M6 adds 8 ⇒ 18 | Claude (architecture) | 2.1 · 3.0 |
| **S-25** | **`StatTile` is missing the approved mockup's `align-items:flex-start` — align it, and measure before/after** | 📏 **What is measured and certain:** `StatTile.jsx:29`'s className is `rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-0.5` — **no `items-*` token anywhere in the file** · and the approved mockup rules `.cell, .tile{align-items:flex-start}` (`02_project_card_approved.html:227`) on the back of a **browser measurement dated 13/08/2026**, quoted: *"‏`.cell` ו-`.tile` הם `flex-direction:column` ⇒ הילדים עוברים blockification: `.ltr` מאבד את ה-`inline-block` שלו, נמתח לרוחב מלא, ו-`direction:ltr` מיישר את הטקסט לשמאל — בעוד התווית שמעליו מיושרת לימין. נמדד: התווית והערך נחתו על `right:992px` מול תיבת-ערך ברוחב `224px`."* ⇒ **add `items-start` in step 3.0 so the component matches the approved shape.** 🔴 **And what is NOT established — do not repeat it as fact:** that the *React* `StatTile` visibly splits today. The measured mechanism needs the `.ltr` element to be a **direct** flex child; in `StatTile.jsx:36-38` `<Money>` sits **one level in**, inside the value `<span>`, so the blockification does not obviously reach it. **I did not open a browser on this.** ⇒ **step 3.0 measures `getBoundingClientRect().left` of label vs value on a live module-2 tile before and after the change**, and records both numbers. *(Ishay: the brief this revision was run from asserted this as a live module-2 defect. It may well be — but it is not derivable from the code, and I will not hand a build session a measurement I did not take.)* | Claude (measurement + honest boundary) | 3.0 |
| **S-26** | 🔴 **Three states, not two — `empty` · `no permission` · `load failure`** | **One shared component (`PermissionAwareEmpty.jsx`), used on every surface that reads a gated table.** 🔑 **Why two states are unimplementable here:** the discriminator for "legally empty" is `quote_services`, which is gated on `'הצעות מחיר'` — **and both מנהלת גיוס and מנהלת לוגיסטיקה are `➖` there** ⇒ a blocked read is **byte-identical** to zero rows (`{data:null, error:null}`), so no code can tell the two apart. **The third state is what makes the distinction expressible at all.** 🔴 **And the denied counter shows `—`, never `0`** — `0` is a lie. ⚠️ **The module already builds this shape on surface 8 and nowhere else** (`screens-approved` מסך 8's `🔒` state); **make it shared instead of building it twice** | Claude (architecture) | 3.0 · 3.1 · 3.3 · 3.4 · 3.8 |
| **S-27** | `<Ltr>` is a **component**, not a class you remember to type | Extracted from `Money.jsx:23-24` into `src/components/Ltr.jsx`. 🔑 **Why the scanner cannot replace it:** `check:bidi`'s regex only fires on a digit adjacent to `₪ ★ ×`, so **`1/6`, `0/2` and `חסרות 5` pass green** — and those are most of what M6 renders. **A component is the only enforcement that survives a forgetful author** | Claude (architecture) | 3.0 |
| **S-28** | 🔴 **Module 6 is entirely feminine, in every string it authors** | All five users are women and the approved cards are already written that way. ⇒ **pass a feminine `retryLabel` to `LoadingOrError`; 🚫 do not edit the shared default** — that is a cross-system change, registered as **`🚧 מ12`**, not M6's to make. *(This closes what was open item **A7**, whose recommendation — "follow the masculine system majority" — is **reversed**: the majority is an artefact of screens written before the persona was settled, and M6's own approved copy is the newer evidence.)* | Claude (architecture) | 3.0 |
| **S-29** | `ביטול` dismisses everywhere; **`חזרה` only in the cancellation dialog** | One vocabulary for one action across the whole module. 🔑 **The single exception earns itself:** in surface 7 the word `ביטול` is also the name of the destructive action, so a `ביטול` button beside `בטל את הפרויקט` means two opposite things in one footer | Claude (architecture) | 3.2 · 3.6 · 3.7 |
| **S-30** | **Cancellation reason gets a ninth cell in the identity area**, shown only when the project is cancelled | The dialog promises the user *"ההסבר היחיד שיישאר אחרי הביטול"* and **no screen in the module renders it.** ⇒ **a broken promise, not a design choice.** Cell label `סיבת הביטול`, with `cancel_type`'s label and the `cancelled_at`/`cancelled_by` stamp beneath it | Claude (architecture) | 3.2 |
| **S-31** | **Shift-lead badge is `StatusTag` with `tone="outline"` — 🚫 no ★** | `★` already means **"rating"** in this system (`RatingStars.jsx`), and a glyph that means two things means neither. One component, no new primitive | Claude (architecture) | 3.4 |

### 3.4 🔗 §7 mirrors (content restated for execution)

| Mirror | Restated content | Tag |
|---|---|---|
| §7.16(ב) | Cancellation compensation tiers: `>72h` ⇒ **0%** · `24–72h` ⇒ **50%** · `<24h` ⇒ **100%** · `force_majeure` ⇒ **0%** always | 🔗 מראת §7.16ב — SSOT: PROJECT_MASTER §7 |
| §7.43 | `ready` is a **derived, reversible** state with **no lock column**; the metric is **`≥`, not `=`** | 🔗 מראת §7.43 — SSOT: PROJECT_MASTER §7 |
| §7.44↳ | The status trigger **recomputes only when the current status is one of the three active ones** — 🔴 **`spec.md §2.1` omits this guard entirely**, so a session reading only the entry point ships the exact bug §7.44 warns about | 🔗 מראת §7.44 — SSOT: PROJECT_MASTER §7 |
| §7.52 | Two profit figures: **expected** derived live while the project is active; **final** frozen in ₪ **at the financial closing (M8)** — clarified by Ishay 14/08/2026 01:17 | 🔗 מראת §7.52 — SSOT: PROJECT_MASTER §7 |
| §7.62 | `projects.quote_id` and `projects.owner_email` get `SET NOT NULL` in M6's migration, after a live zero-NULL count | 🔗 מראת §7.62 — SSOT: PROJECT_MASTER §7 |

### 3.5 OPEN — still Ishay's, each anchored to the step it blocks

> 🔴 **THIS TABLE IS THE ONLY ROUTE TO A RULING. Read this before adding anything to §10.**
> A finding recorded in §10 and nowhere else **never reaches Ishay** — §10 is an append-only *log*, and no phase door, no step and no gate reads it. ⇒ **a finding that needs a decision belongs HERE (or in a named phase-door sweep list); a finding that needs an action belongs in a STEP.** 🚫 **Adding a second §10 note about a §10 note is the defect, not the fix.**
> ⚠️ **And an id cited from a step must EXIST in this table.** *(Measured `14/08/2026`: **A8 · B4 · B7 · B10** were cited in step bodies, in §3.3 and in §3.6 while having no row here at all — four dead ends. A8 and B10 are now ruled (S-1 · AS-3), B4 was already ruled (2.3's `ATTENDANCE_OPTIONS`), and only **B7** was genuinely open — it has a row below.)*
>
> **Closed since the draft, and deliberately NOT left as rows: A7** → S-28 (feminine) · **A8** → S-1 (tone map) · **B1** → R-1 (*"לא"* — no draft-save) · **B4** → ט4/2.3 (flat 7-option select) · **B10** → AS-3 (2 MiB, `db_roadmap` §5) · **B14** → R-2 (*"לא קורה"* — travel is M8's).

> ### 🔑 Triaged `14/08/2026 10:29` — eleven rows, but only FOUR are actually Ishay's
> **The test applied to each row, from iron rule 1:** *"יש עוגן ⇒ הכרע לבד, הצג את העוגן, והוא יכול לעקוף."*
> A row whose recommendation rests on **a measured anchor, an existing precedent, or a structural fact** is **decided** — carrying it to him as a question is the `שאלה-שיש-לי-עליה-תשובה` failure. A row that needs **a business judgement or a number only he holds** is genuinely his.
>
> **🟢 DECIDED — build as recommended; Ishay can override any of these in one line. Do NOT open a ruling round for them:**
> **A1 · A2 · A3** *(all three governed by `AR-2`/`AR-3`, and A2 is a security answer: widening `assignments_select_by_permission` leaks hostess names, rates and phones to every 👁-on-projects holder)* · **A5** *(`AR-1` already ruled it)* · **A9** *(structural — surface 2 owns the shell, so the tab is disabled, not routing)* · **A10** *(`screens-approved` row 27 **already merged** the two RPCs and says so)* · **B7** *(reuse surface 6's dialog — it already carries the mandatory reason, the frozen-price arithmetic, `AR-4`'s zero-guard and the tier-crossing notice; an inline form re-implements all four)*.
> ⚠️ **A5 · A9 · A10 carried a `⬜ Confirm` mark pointing at a ruling that already existed elsewhere in this guide — the marks are replaced below with `🟢 RULED`.** *(Corrected 14/08/2026: an earlier version of this block CLAIMED they were removed while all three tokens were still in the table — a false statement about the file's own state, in the block a reader trusts to tell them what is open. `⬜` is what a sweep greps for.)* **`A10` in particular was carried to Ishay on 14/08 and he pushed back with *"מה בעצם אתה צריך אותי?"* — correctly.**
>
> **👤 GENUINELY HIS — four, and each needs something no measurement can supply:**
> **A6** *(the dormant-customer threshold — a real contradiction: the card says 180 days, the mockup draws a 146-day-old customer as dormant. **Both cannot hold.**)* · **B11** *(does `שעות ביצוע בפועל` keep the clock times, or only the number)* · **B13** *(does a repeat quality mark keep history, or overwrite)* · **E3** *(does a cancelled project's revenue still count toward the customer's total — a **definition**, and it surfaces existing M3 behaviour nobody chose)*.
> 🔴 **None of the four blocks Phase 1.** A6 blocks 1.7/3.8 · B11 blocks 1.1/3.5 · B13 and E3 block 3.5/3.8 — **all inside Phase 1 and 3, not at the Phase-1 door.**

> ### ✅ RULED `14/08/2026 10:4X` — all four, by Ishay, delegated with *"בוא נעשה מה שהכי נכון פה"*
> **He asked one question back that reframed the first item, and it is worth keeping:** *"זה רק מוקאפ, כמה זה משפיע בבנייה? הזנת נתונים זה בסוף לא?"* — **measured: no.** `סף_לקוח_רדום_ימים` is seeded at **step 1.7, inside Phase 1.** 🔑 **But it is a `params` row** ⇒ changing it later is one edit, no migration and no code. **That is what made it decidable without him, and it is the general test: a value that lives in `params` is not a gate.**
>
> | # | Ruled | The anchor, and why not the alternative |
> |:-:|---|---|
> | **A6** | **`סף_לקוח_רדום_ימים = 120`** *(four months)* | **The constraint is ≤146**, because the approved mockup draws a customer idle **146 days** with the amber hint *"רדום · לפני 146 ימים"* — at `180` **the screen Ishay approved does not reproduce**, and `PROJECT_MASTER §1` makes reproducing it the test. 🚫 **Not `146`** — that is an artifact of one mockup row, unexplainable on stage. 🚫 **Not `90`** *(the CRM default)* — at ~20–40 events/year a customer running 3 events a year would show as dormant between them, i.e. a permanently-amber screen. **`120` is a round business number, satisfies the mockup, and answers in one sentence: *"לקוח שלא הפיק אירוע ארבעה חודשים שווה טלפון."*** |
> | **B11** | **Store the number only** — `actual_hours numeric`. 🚫 **No `time` columns.** | The clock range `16:00–22:30` **has no consumer**: nothing computes from it, and the cost/profit path reads only `6.5`. Two columns for display-only text is the *"column nobody asked for"* this guide already rejected twice *(§10: `project_status_history`; ⑭'s rejection of per-transition stamps)*. ✅ **And it is NOT a deviation from the approved mockup — the mockup already agrees.** *(Measured 14/08: `05_tab_closing_approved.html` has no `22:30`; its per-hostess `שעות בפועל` inputs are bare `6.5`, and `16:00–22:00` appears only as the **planned** helper line.)* 🔴 **The `6.5 (16:00–22:30)` string lives in ONE place — `docs/specs/module_06_projects/mockup-data.md`** *(grep `שעות ביצוע`)* — **which is `docs/specs/`, living and editable, and is the file a build session opens for its demo numbers.** ⇒ **Step 3.5 renders the number alone, and the same step corrects `mockup-data.md`.** *(An earlier version of this row claimed the approved mockup was contradicted. It was not — and falsely tagging an approved artefact as contradicted is the mirror of ignoring one.)* |
> | **B13** | **Keep the overwrite. 🚫 No history table.** The UI shows the previous mark when it is about to be replaced — *"סימון קודם: מצוינת"*. 🔴 **Owned by step 3.5**, in the quality-pills section | **The module-4 research defines the table as a per-pair STATE, not a log:** *"טבלת-העדפה `(customer_id, hostess_id, preference)` **3-מצבית**"* (`module4_smart_match_research.md:882`, and `:393`). **Smart Match reads only the current value** — layer 2 pins whoever is `מצוינת` *for this customer* (`:766`). **No consumer reads history**, and B13's own note says so. ➕ **And the three states are not two:** `מצוינת · בסדר · לא_לשלוח` — **all three mandatory at closing**, because of the finding Ishay himself gave in the M4 interview: *"אחרי אירוע גרוע אני כותבת שורה, אחרי אירוע טוב אני **שוכחת** לתעד"* ⇒ a voluntary mark collects only negatives and `מצוינת` is never set (`:501-503`). |
> | **E3** | **Do not change the computation. Change the LABEL — in BOTH places it is rendered**, to `סה"כ הצעות מאושרות`, with the cancelled count beside it. 🔴 **Owned by step 3.8** | 🔑 **The number was never wrong — the word was.** The metric counts approved quotes, so *"approved quotes"* is exactly true. 🚫 **Excluding cancelled projects was rejected because the arithmetic has ONE home and TWO consumers:** `src/lib/customers.js` computes it once (grep `const totalRevenue`), and **both** `CustomerDetailsPage.jsx` (the card tile) and `CustomersPage.jsx` (the list column) render it under the **same** label `סה"כ הכנסות`. ⇒ changing the sum changes M3's screen too. ⚠️ **CORRECTED 14/08: an earlier version of this row said *"M6 does not edit M3"* — false. Step 3.8's own `Files:` line already names `src/lib/customers.js` and `src/modules/02_customers/CustomerDetailsPage.jsx`.** 🔑 **And that correction changes the fix: rename BOTH labels, not just the tile** — renaming one leaves the other saying `סה"כ הכנסות` for the identical number, which is the two-screen disagreement this ruling exists to prevent, moved from arithmetic into wording. ➕ **The cancellation compensation is real revenue and is M8's** (`§7`/M8 derives `פיצוי-ביטול`) ⇒ a **`🚧 מ8`** line, not a number M6 invents. **On stage, one sentence:** *"המספר הוא שווי ההצעות שאושרו; ביטולים מוצגים בנפרד, כי הפיצוי מחושב במודול הכספים."* |
>
> ⚠️ **A6 · B11 · E3 each carry a visible consequence — record them where they land:** A6 changes no screen *(the mockup still reproduces)* · **B11 and E3 both change what a surface shows**, so each needs its `↳ as-built` note in its step and a §10 line, per rule 15.

> ### ✅ RULED `14/08/2026 11:30` by Ishay — **item ד: WHEN the `שינוי מאוחר` marking appears**
> **The ruling, and it is the recommended option he chose:** the marking is **conditional, per changed line** —
> **hostess quantity ⇒ marked only under 24 hours · printed goods ⇒ marked only under 3 business days ·
> a REDUCTION is never marked, at any distance.** Everything else renders no banner at all.
>
> 🔑 **What it fixes, in his own scenario:** Dana adds 20 tags **45 days** before the event. Unconditional marking
> renders *"‏⚠ שינוי 1,080 שעות לפני האירוע"* with copy telling her to phone a hostess — **false, on a screen he
> approved.** The approved mockup draws this banner inside *"ארבעה מצבים שהדיאלוג התקין אינו יכול להראות"*, i.e. as
> an **exceptional** state; unconditional marking makes the exception the norm and the banner stops meaning anything.
>
> 🚫 **This is NOT a time threshold in the ⑯ sense, and the distinction is the whole ruling.** ⑯ forbids a clock that
> **blocks** — its words are *"ולעולם אינה חוסמת לפי שעון"*. **Nothing here blocks: every change is still recorded,
> at any time, and the save button stays enabled in every case.** The condition governs **whether a sentence is
> displayed**, not whether an action is permitted. ⇒ ⑯ and this ruling are consistent; a session that reads ⑯ alone
> and concludes "no condition anywhere" ships the false banner.
>
> **Lands in:** step **2.2** (`isLateChange` — the pure function and its tests) · step **3.6** (surface 6's banner
> state ①). **Both carry an `↳ as-built` note**, because the mockup draws the banner without a condition.

| # | Question | Recommendation carried into the ruling round | Blocks |
|:-:|---|---|:--:|
| **A1** | Which module gates the `logistics` read policy | **AR-2 rules `'לוגיסטיקה'` with a measured anchor. Present it as decided-with-an-anchor; he can override in one line.** | 1.4 |
| **A2** | Does `assignments_select_by_permission` get widened | **No — AR-3 replaces it with the RPC.** Widening leaks hostess names, rates and phones to every 👁-on-projects holder | 1.8 |
| **A3** | How the two metrics reach the client | **AR-3: dedicated `SECURITY DEFINER` RPC.** This ruling also governs A1 and A2 | 1.8 |
| **A5** | Does `other` need its own stored value | **AR-1 says yes — a three-value label column, money type derived.** ⬜ Confirm | 1.1 |
| **A6** | `סף_לקוח_רדום_ימים` | Card recommends **180**; ⚠️ **the mockup draws 146 days as dormant**, i.e. a threshold ≤146. **Unresolved contradiction — needs his number** | 1.7 · 3.8 |
| **A9** | Is the `סגירת אירוע` tab **disabled** (surface 2) or **routing** (surfaces 3 and 4) | **Surface 2 owns the shell ⇒ disabled.** ⬜ Confirm | 3.2 |
| **A10** | Scope-change RPC — one or two | **One** (`screens-approved` row 27 already merged them, and reports it as an assembly decision). ⬜ Confirm | 1.8 |
| **B7** | The `רישום שינוי שהתגלה באירוע` control on the closing tab (㉔) — does it **open surface 6's dialog**, or is it an **inline form** in the closing tab | **Recommendation: reuse surface 6's dialog.** It already carries the mandatory reason, the frozen-price arithmetic, the zero-guard (AR-4) and the tier-crossing notice — an inline form would be a second implementation of all four, and ⑯ means there is no timing rule that would make the closing-time case behave differently. **The one honest cost:** the dialog opens over the closing draft, and R-1 rules there is no draft-save ⇒ **the draft must survive the dialog in memory**, which is a build constraint, not a product one. ⬜ **His call** | 3.5 |
| **B11** | `שעות ביצוע בפועל` is a number, not a range | `actual_hours` is `numeric`; the dataset writes `"6.5 (16:00–22:30)"` and **`22:30` has nowhere to be stored.** **Recommendation: store the number only and drop the parenthetical from the UI**, or add two `time` columns. ⬜ His call | 1.1 · 3.5 |
| **B13** | A repeat quality mark overwrites the previous one with no history | `unique (customer_id, hostess_id)`. Michal marked `מצוינת` in Hadera and `בסדר` at the next Hadera event — **the first disappears.** **Recommendation: keep the overwrite and warn in the UI** (*"סימון קודם: מצוינת"*), because a history table has no reader today | 3.5 |
| **E3** | Does a cancelled project's revenue count in the customer's total | **Today yes** — the metric counts approved quotes. 🔴 **Existing M3 behaviour the card did not choose; it surfaces for the first time now that projects exist** | 3.8 |

### 3.6 Assumptions (spec-silent)

| # | Assumption | Why it is needed | How to kill it |
|:-:|---|---|---|
| **AS-1** | The status trigger fires `AFTER INSERT OR UPDATE OR DELETE` on `assignments` and `logistics`, and `AFTER UPDATE OF required_hostess_count` on `projects`, each `FOR EACH ROW`, all funnelling into one `recompute_project_status(p_project_id)` | The spec names the three sources (`🔄3`) but never the trigger shape | Ishay does not rule trigger shapes; if the advisors flag a performance finding, revisit |
| **AS-2** | `project_changes` gets **no client write policy at all** — writes go only through the scope-change RPC, and a SELECT policy gated on `'פרויקטים'` | 🔴 **Measured gap: RLS for `project_changes` is defined nowhere in the approved spec.** This mirrors `projects` itself, which is the house pattern | If M5's screen needs to write changes, it calls the same RPC |
| **AS-3** | 🟢 **NO LONGER AN ASSUMPTION — RULED.** `reports` bucket: **`file_size_limit = 2097152` (2 MiB)**, and every helper text on screen reads **`עד 2MB`**. `allowed_mime_types = {application/pdf, image/jpeg, image/png}` **remains an assumption** — see the note | **Ruled in `db_roadmap` §5's `reports` row** *(Ishay delegated, 14/08/2026 — "מה שנראלך")*, quoted: *"🚫 NOT the 10 MiB copied from `marketing`, and the on-screen helper text reads `עד 2MB`, not `עד 10MB`."* 🔴 **And 3 MiB was explicitly rejected, with the arithmetic:** `src/lib/email.js:29` caps at `MAX_ATTACHMENT_BASE64_CHARS = 4_000_000`; base64 is 3 bytes → 4 chars, so **the hard binary wall is exactly 3,000,000 bytes ≈ 2.86 MiB** ⇒ a 3 MiB bucket (3,145,728) **would still admit a file that fails at send.** 2 MiB leaves ~900 KB for the JSON envelope | ⚠️ **The mime types are M6's assumption, not the register's** — `db_roadmap` §5 names `allowed_mime_types` only on the `marketing` row. **Kill it by:** ruling them explicitly at step 1.5's typed-echo. 🔴 **Client-side twin, mandatory:** a new `REPORT_MAX_BYTES = 2 * 1024 * 1024` beside the `MARKETING_MAX_BYTES` pattern (`02_customers/api.js:180`), with the helper text **derived from the constant**, never typed *(`MarketingPanel.jsx:200` is the pattern to copy)*. 🚫 **Do not reuse `MARKETING_MAX_BYTES` — it is 10 MB and belongs to a different bucket** |
| **AS-4** | The `finance` bucket is created with policies but **zero writers in M6** | ㉛ rules three buckets; M8 is the writer | — |
| **AS-5** | `mark_feedback_survey_sent(p_project_id)` is a separate, narrow RPC that writes `feedback_status` and nothing else, and is **exempt from ㉙'s post-closing refusal** | Follows directly from AR-5 | — |
| **AS-6** | Every M6 UPDATE/INSERT path calls `.select()` and asserts a row count, throwing a synthetic `RLS_DENIED` when zero — the `02_customers/api.js` pattern | `src/CLAUDE.md:310-313`; **no lint rule enforces it** | — |
| **AS-7** | The `logistics` origin columns are named `quote_service_line_id` (→ `quote_services.line_id`) and `project_change_id` (→ `project_changes.change_id`), with `check (num_nonnulls(quote_service_line_id, project_change_id) = 1)` | ⑬/㉗ rule the shape, never the names | Claude (technical) — no product meaning |
| **AS-8** | `project_changes` PK is `change_id bigint generated always as identity`, and the delta column is **`delta_qty`** | `spec.md` §14② ruled `delta_qty` over `qty_delta`; `db_roadmap M6-1` was corrected to match on 14/08 | Claude (technical) |

### 3.7 🔤 Locked UI strings — the one place a build session copies from

> 🔴 **Why this table exists.** The eight approved cards disagree with each other, and with the mockups, on roughly twenty strings — three different *"reason is required"* messages, three *"cannot load"* strings, two loading-skeleton patterns, two *"no permission"* phrasings, a success toast **forbidden** on one card and **mandatory** on two, `≥0` against `>0`. **Each disagreement was recorded in §10 and resolved nowhere**, which left every one of them to be re-decided by whichever build session reached it first — i.e. **eight surfaces re-inventing the same six sentences.**
> **The rule applied: one string per concept. Majority across the eight cards wins, unless a card gives a MEASURED reason to differ — and where it does, the reason is in the row.**
> 🚫 **A build session does not re-derive these. It copies them.** A surface step that needs a string not listed here uses its card's verbatim text and **adds a row**.

| Concept | 🔒 The one string | Why this one |
|---|---|---|
| Reason field empty (cancellation) | *"חובה לכתוב סיבה. היא נשמרת בכרטיס והיא ההסבר היחיד שיישאר אחרי הביטול."* | Card-verbatim, and **the promise it makes is now kept** by S-30's ninth identity cell |
| Reason field empty (scope change) | *"חובה למלא סיבה — היא מה שיסביר את החיוב הזה בעוד חודש."* | Card-verbatim. **Deliberately different from the row above** — different consequence, not a wording drift |
| Cannot load (any surface) | *"לא ניתן לטעון את הנתונים."* + a per-surface second line naming what is missing + **`נסי שוב`** | **Feminine (S-28).** The three competing variants differed only in the noun; the second line is where the surface-specific information belongs |
| No permission | 🔒 + *"אין לך הרשאה לצפות ב…"* + the counter renders **`—`** | Card-verbatim from surface 8, the only card that specified it. 🔴 **`0` is a lie** |
| Loading | `LoadingOrError` with a `skeleton` variant — **never a spinner, never a bare "טוען"** | `src/CLAUDE.md`: it is **the only shared skeleton in the project**. Two patterns appeared across the cards; the shared component is the tiebreak |
| Retry label | **`נסי שוב`** — passed as `retryLabel`, **not** by editing the shared default | S-28 · step 3.0 ε |
| Dismiss button | **`ביטול`** everywhere · **`חזרה`** only in surface 7 | S-29 — the single exception earns itself |
| Empty after filtering | **`סינון`** on surfaces 1–7 · 🔴 **`חיפוש` on surface 8** | **Not a drift: surface 8 filters by a search box and the other seven by pills.** `screens-approved §נספח⑧` counted the split; the control's own name is what makes each correct |
| Past-date phrase | **`התקיים לפני N ימים`**, in **both** overview tabs | The bare `לפני N ימים` in `הכול` was almost certainly column-width truncation, not a choice; the fuller phrase is the one that reads alone |
| `מה חסר` sentences | The seven verbatim sentences in **step 2.1**, identical in every tab | One home, one function (`gapSentence`), iron rule 14 |
| Success feedback | **A toast on save-and-send actions; 🚫 none on a pure navigation or filter** | Two cards mandate it, one forbids it — **and the one that forbids it is describing a read-only screen**, so the rule is per-action, not per-card |
| Readiness comparison | 🔴 **`≥`, never `=`** | 🔗 מראת §7.43 — an over-staffed event (7 of 6) **is** ready. `=` silently excludes it |
| Report size helper | *"‏PDF · JPG · PNG · עד 2MB…"* — the number rendered from `REPORT_MAX_BYTES` | Ruled 2 MiB (AS-3). ⚠️ Supersedes `screens-approved.md:1398`'s `עד 10MB` |
| `event_finished` on screen | **`ממתין לסגירה`** | ⑲. 🚫 `אירוע הסתיים` appears nowhere — enforced by step 2.1's scan ② |

⚠️ **`docs/mockups/**/approved/*.html` is NOT hook-protected** — an edit there succeeds with no error and no failing test. 🚫 **Resolving a contradiction by editing an approved mockup is forbidden.** Supersessions are recorded as **dated pointers in §10**, never as edits to the approved artefact.

---

## 4. 🛡️ Security & Auth Model Statement

**Leans entirely on module-1 auth. RLS is the enforcement; the UI is convenience.**

### 4.1 Policy table — every row names the exact `module_name` string

| Table | Policy gate (§7.21 template, `(select …)`-wrapped) |
|---|---|
| `projects` | **`projects_select_by_permission`** — SELECT only, `module_name = 'פרויקטים'`, `permission_level in ('edit','view')`. `docs/schema.sql:938-942`. 🔴 **There is no write policy, deliberately** — `schema.sql:943` carries the comment saying so. **M6 adds none.** |
| `project_changes` **(new)** | **`project_changes_select_by_permission`** — SELECT only, `module_name = 'פרויקטים'`, `('edit','view')`. **No write policy** — writes go only through the scope-change RPC. *(AS-2 — the approved spec is silent on this table's RLS.)* |
| `logistics` | **`logistics_select_by_permission`** — SELECT only, **`module_name = 'לוגיסטיקה'`** *(AR-2, not `'פרויקטים'`)*, `('edit','view')`. Today: **RLS enabled, zero policies, deny-all**. M5's write policies are M5's to add. |
| `assignments` | **Unchanged.** `assignments_select_by_permission` / `assignments_write_by_permission` stay gated on **`'דיילות'`** (`20260809134237:67-83`). 🚫 **M6 does not widen them** (AR-3). |
| `hostesses` · `hostess_unavailability` | **Unchanged**, `'דיילות'`. |
| `customer_hostess_preference` | **Unchanged in gate, verified in fact.** Both policies are gated on **`'דיילות'`** (`20260809134237:105-121`) even though `schema.sql:877` declares "M6 writes it". M6 writes it **only through the closing RPC**, which is `SECURITY DEFINER` — so the gate does not need to move. 🔴 **Step 1.4 must verify this claim live before relying on it** (`m6-OPEN-ITEMS` #5 marks it 🟡 unmeasured). |
| `quote_services` · `quotes` | **Unchanged**, `'הצעות מחיר'` (`20260723113500:34-38`). ⇒ **מנהלת גיוס and מנהלת לוגיסטיקה read zero rows there, by design** — this is what produces the `0.00 ₪` trap (S-2). |
| `email_log` | **New third SELECT policy** `email_log_select_projects_module` — `using (entity_type in ('project','project_report') and exists (… module_name = 'פרויקטים' …))`. 🚫 **Not a widening of an existing policy** (`schema.sql:656-657`, `db_roadmap A-20`) — widening would open the quote journal to the recruitment manager. **No client write policy at all**; only the Edge Function writes, via service-role. |
| `storage.objects` — bucket `reports` | **Four policies** (select · insert · update · delete), each testing `bucket_id = 'reports'` **before** the `exists` on permissions, gated on **`'פרויקטים'`**. Template: `20260710160735:117-153` (bucket `marketing`). |
| `storage.objects` — bucket `finance` | **Four policies**, same shape, `bucket_id = 'finance'`, gated on **`'כספים'`**. |
| `params` | **Unchanged.** `params_select_all_authenticated USING (true)` (`schema.sql:555`) · `params_write_ceo_only` on `'הגדרות מערכת'` (`:566-570`). M6 seeds rows in a migration, never from the client. |

🔴 **The template is copied verbatim from `20260809134237:49-65`, and the `(select …)` wrapper is mandatory** — it turns the permission lookup into an initplan evaluated once per query instead of once per row:

```sql
create policy "logistics_select_by_permission" on public.logistics for select to authenticated
  using (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'לוגיסטיקה')
      and p.permission_level in ('edit', 'view')));
```

⚠️ **`module_name` is a Hebrew string literal compared byte-for-byte.** The `modules` rows were seeded by hand in Supabase, not by a migration — **no file in this repo carries the canonical spelling of `'לוגיסטיקה'`.** Step 1.4 therefore starts by reading it live (`select module_id, module_name from public.modules order by module_id;`) and pasting the returned bytes. A one-character difference makes the table deny-all again, **silently**.

### 4.2 Why `projects` has SELECT-only and no write policy — and what follows

`projects` carries ~29 columns spanning three ownership domains: operational (M6), finance (M8), and identity snapshots (M3). Postgres RLS is **row-level, not column-level** — a fact this system already paid for once, when `product_costs` had to be split into its own table (`src/CLAUDE.md`). A second table split on the system's central entity would be worse.

⇒ **㉘ and ㉙ make the RPC the unit of authorisation and the unit of locking.** ⇒ **Every M6 write is an RPC:**

| RPC | Gate | Post-closing behaviour (㉙) |
|---|---|---|
| `update_project_details(p_project_id, p_event_date, p_location, p_start_time, p_end_time)` | `edit` on `'פרויקטים'` | **refuses** |
| `apply_scope_change(p_project_id, p_lines jsonb, p_reason text)` | `edit` on `'פרויקטים'` | **refuses** |
| `cancel_project(p_project_id, p_cancel_type text, p_cancel_reason text)` | `edit` on `'פרויקטים'` | **refuses** |
| `close_project_operationally(p_project_id, p_actual_hours, p_actual_guests, p_report_path, p_rows jsonb)` | `edit` on `'פרויקטים'` | **refuses** (it is what sets the lock) |
| `mark_feedback_survey_sent(p_project_id)` | `edit` on `'פרויקטים'` | ✅ **keeps working — it exists to run after the closing** (AR-5) |
| `set_project_finance_fields(p_project_id, …)` | **`edit` on `'כספים'`** — 🚫 **not** `'פרויקטים'` (㉘) | ✅ **keeps working** |
| `list_projects_overview()` | `view` or `edit` on `'פרויקטים'` | read-only, always works |

🔴 **㉙ is a whitelist, not a blanket.** Write it as *"these four operational functions refuse once `operationally_closed_at is not null` or `project_status = 'cancelled'`"* — **never** as *"any function touching a closed project refuses"*, which would strand a failed survey send with no retry path.

🚫 **Do not add `projects_write_by_permission`.** It would open all ~29 columns to every `edit`-on-`'פרויקטים'` holder and destroy ㉘ and ㉙ in one line.

### 4.3 Why the closing RPC needs `SECURITY DEFINER`

The closing writes to three tables under **three different gates**:

| Write target | Gate on that table | Dana's level |
|---|---|---|
| `projects` (hours, guests, report path, status, stamp) | no write policy at all | — |
| `assignments` (`attendance_status`, `lateness_level`, `no_show_reason`, `actual_hours`) | `assignments_write_by_permission` requires **`edit` on `'דיילות'`** | **`👁` view** ⇒ **denied** |
| `customer_hostess_preference` (`preference`, `preference_reason`) | requires **`edit` on `'דיילות'`** | **`👁` view** ⇒ **denied** |

⇒ **מנהלת הפרויקטים cannot write two of the three tables under her own permissions.** `SECURITY DEFINER` is not a hardening choice here — **it is the reason the function exists at all** (`spec.md` §12③). The same applies to `cancel_project` (writes `assignments.assignment_status`) and to `update_project_details` (㉑ resets final approvals).

**Every `SECURITY DEFINER` function in M6 must:**
1. Open with an explicit permission check against `permissions × modules × current_user_role_id()` and `raise exception` in Hebrew when it fails. **A `SECURITY DEFINER` function without its own gate is an open door.**
2. Declare `set search_path = public, pg_temp`.
3. `revoke execute … from anon` explicitly — the precedent is `20260809174501_module4_revoke_anon_from_coordinates_rpc.sql`, a fix-forward migration that exists because the first version did not.

### 4.4 UI gates

- Route: `src/App.jsx:139-145` already carries `<ProtectedRoute allow="פרויקטים">`. **The guard is correct; only the element changes.**
- `allow` accepts a module name **or** a role name (`ProtectedRoute.jsx`). The value here is the byte-identical Hebrew literal `"פרויקטים"`. **A typo blocks everyone, silently.**
- 🔴 **A control the user may not use is NOT RENDERED — never rendered-disabled.** *(The one deliberate exception is a control disabled for a **state** reason rather than a permission reason: the `סגירת אירוע` tab before `event_finished`, and the quality pills on a no-show row — both are disabled **and carry their reason in text**, per ט4-א's "מושבת ומנומק, לא ריק".)*
- Sidebar already filters blocked modules (`Sidebar.jsx`); the route guard is the second layer, and both are required.
- Per-role UI differences M6 must build and test **in both directions**:
  - **מנהלת לוגיסטיקה** sees surfaces 1, 2, 3 and reads `logistics`; she must **not** see the `שינוי תכולה` or `ביטול פרויקט` buttons, and `הכנסה מתוכננת` renders `—` for her (S-2), not `0.00 ₪`.
  - **מנהלת גיוס ושיבוץ** sees surfaces 1, 2, 4; `logistics` returns zero rows for her under AR-2 ⇒ the logistics tab must say so, not show "ready".
  - **מנהלת כספים ולקוחות** has `👁` on projects and `➖` on both `'דיילות'` and `'לוגיסטיקה'`.
  - **מנכ"ל** sees and does everything — **this is the positive control** (§2.7).

### 4.5 Session / OAuth

Unchanged from module 1: Supabase Auth (Google), session in `sessionStorage`, `current_user_role_id()` filters `status='active'`. **M6 introduces no new auth surface, no public route, and no anonymous access.** 🚫 **The `/feedback/:token` public page is explicitly NOT built here** — it is a 🔮 candidate for M8.

### 4.6 `Declared limitation:`

> **`Declared limitation:` the report file's read policy on the `reports` bucket is gated on `'פרויקטים'`, which means every holder of `view` on projects — including מנהלת גיוס ושיבוץ and מנהלת לוגיסטיקה — can download any project's customer-facing summary report.** Narrowing it would require either a per-project ownership check inside the storage policy (a path-condition, which `㉛` explicitly rejected as the failure mode that leaks payroll) or a separate module gate that does not exist in the permissions matrix. **This is accepted, not a hole to plug**: the report is a document the company itself sends to its customer, it contains no salary and no personal hostess data, and the matrix already grants both roles read access to the project it belongs to. **Recorded so the closing audit does not re-discover it as a finding.**
>
> **Second declared limitation:** `gitleaks` runs only on PR/push to `dev`/`main`, and is **not installed locally**; pre-commit runs eslint + prettier only. A secret pushed to a personal branch is already on GitHub and stays in history. **The protection is on the merge, not on the commit** — this is discipline, not a tool.

---

## 5. 🗡️ DB Design Challenge

> **One line per sub-check, including the ones that found nothing, so a session that ran all seven is distinguishable from one that skipped them.**

| Sub-check | What was examined | Finding |
|---|---|---|
| **Keys & mutability** | `project_changes` PK · `logistics` PK vs the new origin pointer · `quote_services.line_id` as an FK target · `hostesses.hostess_id` vs the retired `id_number` | 🔴 **Finding:** three names circulated for one column — `delta_qty` (`spec.md` §14②) · `change_qty` (`db_roadmap M6-1`) · `qty_delta` (`screens-approved` surfaces 3/6). → **`delta_qty` wins** (`spec.md`'s ruling); `db_roadmap` was corrected 14/08; **grep both dead names before writing any code** (Ledger AS-8). 🔴 **Second finding:** `screens-approved:2327` and `§נספח③` claim `quote_services` has no single-column key and propose a three-column FK. **They are wrong** — `line_id bigint generated always as identity primary key` exists at `docs/schema.sql:457`. → §10 verification #1; the pointer is one `bigint` FK, no new surrogate key. |
| **Relationships & lineage** | `logistics` → its origin · `project_changes` → `projects`/`products` · `assignments` → `projects`/`hostesses` · `projects` → `quotes`/`customers` | 🔴 **Finding:** existing `logistics` rows **cannot be back-filled** with an origin. The approve-RPC runs `row_number() over (order by qs.line_number)` **after** filtering out hostess lines, so `serial_number` is offset — on `#8`, `B-REG-TAG` is quote line **2** and `serial_number = 1`. → the CHECK admits all-NULL for legacy rows; **no positional backfill**, recorded in §10. 🔴 **Second finding:** the writer of the new column is **M3's merged approve-RPC**, not M5 and not M6 ⇒ **a three-module ripple, not two.** → `🚧 מ5 ← מ6` contract item 1; M6 does not edit merged M3 code in this module. |
| **Lifecycle & writers** | who writes `project_status`; who writes `feedback_status`; who writes `personal_bonus` / `travel_amount`; idempotence of the closing and of the cancellation | 🔴 **Finding:** `feedback_status = 'sent'` written inside the closing transaction is **false the moment the send fails**, and ㉙ then blocks the retry path. → AR-5: facts inside, sends outside, plus a separate `mark_feedback_survey_sent` exempt from the lock. 🔴 **Second finding:** ㉙ phrased as *"any RPC touching a closed project refuses"* strands the failed send with no way back. → **㉙ is a whitelist of the four operational RPCs**, written explicitly in §4.2. ⚠️ **Probe (ג) — journal duplication:** `email_log` has no uniqueness on `(entity_type, entity_id, recipient)`, so a double click after a partial failure could double-log. **Not guarded at the DB level here, and that is deliberate** — the closing RPC's own precondition (`operationally_closed_at is null`) makes the second attempt refuse, **but the mail path has no such guard**, so the client must disable the button for the whole send phase. Recorded in §10. ⚠️ **Probe (א) — repeat action:** the quality mark is `unique (customer_id, hostess_id)` and a second event overwrites the first with no history (open item B13). |
| **Screen-to-column audit** | all 8 approved cards read column-by-column against `projects` (29 columns), `assignments`, `logistics`, `quote_services` | ✅ **אין ממצאים.** **And the reason there are none is not that the check was skipped:** the Discovery ran exactly this sweep at Ishay's demand and found **15 of 30 `projects` columns absent from the spec**, producing ㉞ (feedback split), ㉟ (`project_bonus` dropped) and ㊱ (`owner_*`). **The sweep was re-run here against the same list and produced no new orphan.** ⚠️ **One count correction that follows from re-running it:** `projects` has **29** columns, not 30 (`spec.md:476` · `processes-approved:1077` both say 30). |
| **Derived vs stored** | what freezes, when, what stays live (§7.78) | 🔴 **Finding, and it is the module's heaviest:** a final gross profit frozen by M6 today would carry `personal_bonus = 0` (M8-owned by Ishay's 13/08 ruling, §7.19) and `travel_amount = 0` (**measured 14/08: no code in the repo writes that column**, §7.69 🟠) — **inflated by exactly the amount `PROJECT_MASTER §5.14` warns about, and frozen forever.** → **AR-6, ruled by Ishay 14/08/2026 01:17: §7.52's *"בסגירת-האירוע"* means the *financial* closing (M8). M6 freezes only its own inputs; no `final_gross_profit` column.** ✅ Everything M8 needs exists the moment M6 commits: revenue frozen in `quote_services` + `project_changes`, hours and rates frozen in `assignments`. ✅ **And the two readiness metrics are correctly derived-not-stored** — no columns, no trigger; only `project_status` is ever written. |
| **Permissions ↔ RLS** | does M6 write columns on tables another module owns? (§7.63 + `db_roadmap` §7 rollout matrix) | 🔴 **Finding: yes, on two of them** — `assignments` and `customer_hostess_preference` are both gated on `'דיילות'`, where Dana holds `👁` and not `V`. → this is *why* the closing RPC is `SECURITY DEFINER`; it is not hardening (§4.3). 🔴 **Second finding:** the naive fix — widening `assignments_select_by_permission` to `'פרויקטים'` holders, which `screens-approved:200,336` proposes — **leaks hostess names, hourly rates and phone numbers to every 👁-on-projects holder.** → **AR-3 replaces it with a `SECURITY DEFINER` overview RPC, and those two spec lines are to be deleted.** 🟡 **And one claim is still unverified:** `customer_hostess_preference`'s two policies are *believed* gated on `'דיילות'` from reading the migration file; **the live `pg_policies` check runs in step 1.4** and its result goes to §10 either way. |
| **Files/Storage · temporal · migration checklist** | two new private buckets, 8 `storage.objects` policies, `timestamptz` on both new stamps, the checklist per migration | 🔴 **Finding:** **there is no transactional guarantee between Storage and Postgres** (documented by Supabase). → enforced in the DB instead, via `project_closed_needs_report`, plus the ordered upload → RPC → delete-on-failure flow (`spec.md` §2.2). 🔴 **Second finding:** `createSignedUrl` appears **0 times in all of `src/`** ⇒ M6 builds this path first, with no precedent to copy. → steps 1.5 and 3.5, and the report to the customer is **downloaded and attached, never a signed link** (an expired link at the customer's end reads as a fault). 🔴 **Third finding:** the attachment ceiling in code is **~3 MB of binary** while the closing screen's own approved text promises **10 MB** — see §10 verification #6. ⚠️ **Known environment risk:** in some projects `storage` is owned by `supabase_storage_admin` and `create policy` fails `42501` (`20260710160735:9-10`) ⇒ dashboard fallback, recorded. ✅ Both new stamps are `timestamptz` (§7.56). |

**Before deriving anything from C5/C6, read `db_roadmap.md` §9 — the register of known reference-spec defects — so a known-bad passage is not re-derived into a schema.**

---

## 6. 🏗️ Phase & Step Plan

### Model & effort per phase

| Phase | Model | Effort | Why |
|---|---|---|---|
| 1 — DB/RLS | Opus | High | nine irreversible migrations on a shared live project, including a column **drop**, two `SET NOT NULL`, a trigger state machine and a cron job |
| 2 — business logic | Opus | High | three hand-computed anchors must reproduce **exactly**; the `MAX(assignment_number)` fold now has two implementations that must agree |
| 3 — UI | Opus | Medium | 8 surfaces, all drawn and approved — appearance is settled, so the work is fidelity plus states |
| 4 — wiring | Sonnet | Medium | mechanical, but it touches `App.jsx` and two other modules' files |
| 5 — QA & handoff | Opus | High | independent re-verification in a fresh session |

**Global conventions for every step below**
- **Seven fields per build-unit step:** the Goal lives in the step title · **Files** · **What to do** · **🔻 Verify** (command + expected output) · stop-point tagged 🤖 or 👤 · **`מה ייחשב עובד`** (quoted from the approved spec, never re-authored) · **empty `🗣️ אושר —`**.
- `⚠️ shared-surface` tags any step touching a file outside `src/modules/06_projects/`. Such a step must (a) grep every other open micro-guide for that file and stop if it is declared there too, and (b) shape the change **additively** as a bounded per-module block.
- Hebrew code comments are why-first (iron rule 3) — stated once here, not repeated per step.
- **Baseline to compare against:** `npm run test:run` → `Test Files 26 passed (26)` / `Tests 752 passed (752)`, measured `14/08/2026 01:23`.

---

### Phase 1 — DB / RLS

> # 🛑 READ FIRST — Phase 1 is NOT executable as written. Measured `14/08/2026` by a simulated build.
> **The test that produced this:** a fresh session was told to *actually write* Phase 1's SQL from this guide alone and report every place it had to guess. **It counted 41.** 🔑 **This is a different test from every review this guide has passed** — those checked CONSISTENCY, this checked SUFFICIENCY. **The guide is strong on *why* and weak on *what to type*.**
> ⚠️ **Do not start Phase 1 until the 🛑 rows below are closed.** Each names its owning step, so it is fixed where the builder stands — not recorded here and forgotten.
>
> ## 🔴 RE-TRIAGED `14/08/2026` — Ishay's correction, and it demotes four of the twelve
> **His words:** *"הבלופרינט לא אמור לכתוב קוד, הבנאי בונה. זו תוכנית עבודה ברורה, חוזה ברור — אבל ה'איך'? זה הבנאי. זה רק מדריך עבורו."*
> ⇒ **The original list was written against the wrong standard** — it treated "the guide does not contain the SQL" as a defect. **It is not.** A blueprint carries **what · in what order · under which constraints · what "done" means · and every CONTRACT another phase must agree with.** The builder writes the code.
> **The separating question: *would two competent builders working alone produce INCOMPATIBLE results?*** **Yes ⇒ contract, belongs here. No ⇒ the builder's.**
>
> | | Verdict after re-triage |
> |:--:|---|
> | ~~**3**~~ ✅ *(closed — contract written into 1.8)* · **6** · **7** · **8** · **10** · **12** | 🛑 **REAL, unchanged.** A contract two phases must agree on · a contradiction inside the plan · an expectation that is unreachable · an acceptance gate that cannot pass · names other code keys on · undeclared constraints that change behaviour. **None of these is "write my code for me".** |
> | **1** | 🛑 **REAL, but RECLASSIFIED.** The defect is **not** "the trigger function is unwritten" — it is that **the plan never declares the wrapper exists as a work item at all**, while handing over the other function complete. **An undeclared dependency ≠ "the plan didn't type it for me."** |
> | **2** | ◐ **SPLIT.** The seven **bodies are the builder's — demoted.** ‏**But `returns setof record` stays 🛑**: it is a contract, and it is *wrong* — supabase-js cannot call that shape at all. |
> | **5** | ◐ **SPLIT.** Writing the eight policies is the builder's — **demoted.** **The eight NAMES and the read/write permission split stay 🛑** — a name other code references, and a security decision. |
> | **4** · **9** · **11** | ⬇️ **DEMOTED to minor.** ‏**4** — the plan *does* state the policy requirement, just in a code comment rather than in the plan text; move it, do not write the policy. **9** — the guide supplies a `Verify` snippet and it is invalid, so fix the snippet, but a builder would catch it in one run. **11** — the seed statement is the builder's; the template texts are already in `db_roadmap M6-12`. |
>
> ⚠️ **And a measurement RETRACTED in full:** code-block density per phase *(Phase 1 = 25 blocks, Phase 3 = 0)* was read as a risk signal for phases 2–5. **It is meaningless under the rule above** — a UI phase legitimately carries almost no literal code. **Sufficiency is measurable only by rehearsing a phase, never by counting what is in it.**
>
> | # | Step | What actually happens if you run it as written | Fix owed |
> |:-:|:--:|---|---|
> | **1** | **1.9** | 🛑 **The migration ABORTS.** Three `create trigger` statements call **`public.trg_recompute_project_status()` — a function this guide never writes.** ⇒ `42883 function does not exist`. **Its `DELETE` branch is real work** (`OLD.project_id`, since `NEW` is null on delete). | Write the trigger function into 1.9, with the `TG_OP = 'DELETE'` split and its `revoke`. |
> | **2** | **1.8** | 🛑 **Seven RPCs, seven prose paragraphs, ZERO bodies.** And `list_projects_overview()` is specified `returns setof record` — **PostgREST/supabase-js cannot call that**; the caller must supply a column-definition list the JS client has no way to send. All 16 column types are absent. | Rewrite as `returns table(...)` with types; write all seven bodies, signatures and eight `revoke` lines. |
> | **3** | **1.8** | ✅ **CLOSED `14/08/2026` — the two payload contracts are now written into step 1.8, every field measured live against the DB.** *(Original finding kept below so the reason survives.)* 🛑 ~~**The two `jsonb` payload shapes are undefined**~~ — `apply_scope_change(p_lines)` and `close_project_operationally(p_rows)`. 🔴 **This is the single highest-risk gap in the phase, because it fails LATE and QUIETLY on both sides:** an invented shape applies cleanly, passes 1.8, passes the 1.10 gate, and only surfaces in Phase 3 when the dialog is built against a *different* invented shape. ⚠️ **`logistics` has a THREE-column PK `(project_id, sku, serial_number)`** — nothing says which of the three the payload carries, so the failure mode is *updating the wrong logistics row*. | Define both element shapes verbatim in 1.8, and make Phase 3's dialog step cite them. |
> | **4** | **1.2** | 🛑 **`project_changes` ships RLS-ON with ZERO POLICIES — deny-all.** The code block ends at `enable row level security`; **the policy exists only as a trailing `--` comment.** ⇒ the exact `{data:null, error:null}` silent failure this guide quotes a whole acceptance line about for `logistics`. | Move the policy INTO the code block. |
> | **5** | **1.5** | **8 storage policies described, 0 written** — including their **names** and the read/write permission split. ⚠️ **Not inferable:** the template it points at names its SELECT policy `marketing_read_by_permission` — ***read*, not *select***. A wrong permission level here is a leak no test catches. | Write all eight, with names and levels. |
> | **6** | **1.8 · AR-10** | 🔴 **A design contradiction that silently disables the backstop.** AR-10 routes errors through `SERVER_CONSTRAINT_RULES`, which **keys on the constraint/index NAME**. 1.8 then says *"wrap the body in `exception when unique_violation then raise exception …`"* — **re-raising converts `23505` to `P0001` and DISCARDS the name** ⇒ the backstop can never fire. ➕ And `SERVER_CONSTRAINT_RULES` already holds an entry for `assignments_one_event_per_day` **with different wording than AR-10's**, unmentioned. | Decide: catch-and-map, or let `23505` through. Then reconcile the duplicate wording. |
> | **7** | **1.9** | **The step's own Expected output is unreachable from its own instructions.** It expects `#7 → event_finished`; traced, `recompute_project_status(7)` writes **`not_started`** (`#7` has **zero** assignment rows, `required=6`, both logistics rows `not_started` ⇒ no human action). **Only the cron body moves `#7`, and the checklist never tells you to run it.** ⇒ the builder concludes the status machine is broken when it is correct. ➕ `cron.timezone = GMT` ⇒ *"02:00"* is **05:00 Israel**. | Correct the expectation, or add the one-time `UPDATE`. |
> | **8** | **1.10** | **The gate demands "zero new advisor findings" and Phase 1 structurally guarantees ELEVEN** — 2 unindexed FKs from 1.1 *(and its checklist's stated reason is wrong: the advisor looks at the **referencing** column, which is why `projects_owner_email_idx` exists)*, 2 more from 1.2 (`sku`, `performed_by`), 7 `SECURITY DEFINER` functions from 1.8. **Compare `20260809174501`, which predicted its own delta with a number.** | Make 1.10 predict its delta and pre-write the triage note. |
> | **9** | **1.3** | **The Verify block is invalid SQL** — `update … where project_id=8 limit 1` — **`UPDATE … LIMIT` is not PostgreSQL.** Errors `42601` before the CHECK is ever evaluated, so the step's stated proof never runs. | Rewrite with a subselect on the PK tuple. |
> | **10** | **1.1/1.2** | **Constraint and index NAMES the code will later key on are unstated, and one is relied on while auto-generated:** 1.2's Verify expects `23514` on **`project_changes_delta_qty_check`** — a name Postgres derives and the DDL never writes. | Name every constraint the UI maps. |
> | **11** | **1.7** | **Contains no SQL at all** — payload text only. Dollar-quoting, `on conflict`, the whole `insert` are the builder's. | Write the statement. |
> | **12** | **1.8 ⑤** | **`customer_hostess_preference_negative_needs_reason` is live (`schema.sql:889`) and Phase 1 never mentions it** ⇒ a closing payload without `preference_reason` fails `23514` at runtime. ➕ `projects.customer_id` is **nullable** and the preference upsert needs it — no guard. | Name both in 1.8. |
>
> ### ✅ And what the same test found GOOD — recorded so it is not "fixed" away
> **Steps 1.4 and 1.6 are complete, correct and independently verifiable — nothing to add to either; 1.6 is the model every step should look like.** ‏**1.1**'s five-way pre-count with *"non-zero ⇒ stop and report, do not clean the data to fit a constraint"* is better discipline than most migrations already in the repo. **`recompute_project_status`'s birth-trap guard is right** and was confirmed to reproduce all three of `spec.md §3.2`'s anchors. **AR-2's leak analysis holds against the live matrix, and AS-3's 2 MiB arithmetic checks out to the byte.**
>
> ### 🔴 The gates are INVERTED — the finding behind the findings
> **Three points genuinely require a human answer and NONE is marked 👤:** the two `jsonb` shapes · whether `preference_reason` is required at closing and what the UI does · the eight storage policy names and their permission split. **Meanwhile the four items step 1.0 DOES mark as human gates were already ruled.** ⇒ **the guide asks Ishay about what it already decided, and decides for itself the things nobody has decided.** *(Small measured drifts, non-blocking: §2.8 cites `spec.md` acceptance at 432–452, actual **436**; "מה אסור לנחש" at 483–652, actual **487**; §5 cites `schema.sql:728`, the comment is **727**; 1.10 says "three §5 Storage rows", there are **five** M6-touching, two struck.)*

**Phase gate (§9h):** at entry, sweep §3.5 for every OPEN item anchored to a Phase-1 step (**A1 · A5 · A6 · B11**) and bring them to Ishay as one consolidated round **before step 1.1**.

**🔴 Migration protocol — applies to every step 1.1 through 1.9, without exception:**
1. **Before any `CREATE OR REPLACE FUNCTION` on a function that already exists**, run `select pg_get_functiondef('public.<name>(<types>)'::regprocedure);` and build **from that output**. *(Anchor: `20260809193353` was built on a stale copy and **every real quote approval failed silently with `42703` from 09/08 to 12/08**. E2E would not have caught it — it intercepts the network and never runs a real RPC.)*
2. **Typed-echo gate (👤).** Claude explains in Hebrew — tables · columns · RLS · dependencies · **reversibility** — then **Ishay types the migration name** (not "כן"), then **Claude applies it itself** via MCP `apply_migration`. A plain approval is not sufficient and the gate is never pre-granted at an earlier step.
3. **After apply, four steps:** apply ⇒ verify by reading ⇒ **refresh `docs/schema.sql`** (Supabase Studio → SQL → Snapshots) ⇒ **update the matching `db_roadmap` row in the same session** (the Stop hook blocks otherwise).
4. **Commit together:** `git commit -- supabase/migrations/<file>.sql docs/schema.sql docs/db_roadmap.md docs/micro_guides/module-6.md`. 🔴 **Explicit pathspec always — never `git add -A`.** A migration that reaches a PR without a refreshed `schema.sql` is not approved.
5. ⚠️ **Filename is local clock; `apply_migration` records UTC ⇒ a constant 3-hour gap.** Match by `name`, never by `version`.
6. **Append-only.** A committed migration is history; a fix is a new forward migration.

**Migration Design Checklist (`db_roadmap` §1) — embedded in every Phase-1 step's What-to-do:**
`[ ]` reversible? (and if not, say so out loud at the typed-echo) · `[ ]` does it lock a table, and for how long? · `[ ]` any existing row that violates the new constraint? (**count first, always**) · `[ ]` does an index exist for every new FK? · `[ ]` `timestamptz`, never `timestamp` (§7.56) · `[ ]` Seed impact (roles/modules/params exception only) · `[ ]` Storage impact (§5 lane) · `[ ]` does it change a function another module already calls?

---

**Step 1.0 · 🔻👤 Phase-1 door — consolidated ruling round**
**Files:** none (chat only).
> ## 🔴 UPDATED `14/08/2026` — **A1 · A5 · A6 · B11 ARE ALREADY RULED. Do not carry them to Ishay.**
> All four were ruled on `14/08/2026` *(A1/A5 by anchor, A6 and B11 by Ishay's delegation *"בוא נעשה מה שהכי נכון פה"*)* — **see the RULED block at the head of §3.5.** ‏**`A6 = 120` · `B11` = store the number only · `A1` = `'לוגיסטיקה'` (AR-2) · `A5` = AR-1's three-value column.**
> 🚫 **Carrying a settled question to this door is the `שאלה-שיש-לי-עליה-תשובה` failure**, and `A10` already cost Ishay exactly that once — his words: *"מה בעצם אתה צריך אותי?"*
> ⚠️ **This block exists because the ruling session updated §3.5 and did NOT update this door** — **the same routing defect §10 documents, committed one hour after documenting it.** ⇒ **Whoever rules an item updates BOTH: the §3.5 row AND every phase door that sweeps for it.** *(Doors that sweep: this one, and the Phase-3 door.)*
>
> **✅ What this door still does — and it is not nothing:** it is the gate at which Ishay approves **the Phase-1 migration itself** (iron rule 12 + the typed-echo protocol), and it presents **S-1 as decided**, below. ~~**One genuinely open item remains for it: `screens-approved`'s item ד**~~ 🟢 **RULED `14/08/2026 11:30` — the door has NO open item left.** See §3.5's RULED block; it landed in steps 2.2 and 3.6.
>
> ### 🔓 Typed-echo waived for Phase 1 — `14/08/2026 11:2X`, Ishay's explicit words: *"חד פעמי שאני לא חייב להדביק לך את שם המיגרציה"*
> **Scope: Phase 1's nine migrations only.** It does **not** carry into Phase 2–5 and it does not carry into any later module.
> **What still happens before every apply:** Claude explains in Hebrew what the migration does and its reversibility, and applies on a plain approval. **What is given up:** the proof-of-reading that typing the name provides.
> 🔑 **And the anchor that made it safe to grant — measured `14/08/2026 11:2X`, not assumed:** **all nine migrations are reversible** (a column, a trigger, a cron job, a bucket, a policy and a function can each be dropped), **and the one statement that truly destroys data — `alter table projects drop column project_bonus` — destroys none**, because all four live rows hold `project_bonus = 0`. ⇒ the gate's own reason (irreversibility) is absent here.
> 🔴 **What is NOT waived and must not be read as waived:** the migration protocol's other five clauses — `pg_get_functiondef` before any `CREATE OR REPLACE`, the four post-apply steps, the pathspec commit, `append-only`, and **any step whose pre-count comes back non-zero still STOPS and reports.**

**What to do:** present, recommendation-first, 3–4 per round, one line of background each, full detail only on *"פרט לי"*, with *"מספיק להיום"* offered between rounds:
- ~~**A1** · **A5** · **A6** · **B11**~~ 🟢 **RULED 14/08/2026 — removed from this round.** Present them **only** as a one-line confirmation list he can override, not as questions.
- ~~🔴 **`screens-approved` item ד — WHEN the `שינוי מאוחר` marking appears.**~~ 🟢 **RULED `14/08/2026 11:30` — Ishay chose the recommended option below verbatim. Removed from this round; see §3.5's RULED block, and the `↳ as-built` notes in steps 2.2 and 3.6. The reasoning is kept here because it is what he ruled ON:** ⑯ *(13/08)* rules out a threshold that **BLOCKS** — its words are *"ולעולם אינה חוסמת לפי שעון"* — **it does not rule on when the marking shows.** The approved mockup draws this banner inside *"ארבעה מצבים שהדיאלוג התקין אינו יכול להראות"*, i.e. as an **exceptional** state. ⇒ **Unconditional marking makes a change 45 days out render `⚠ שינוי 1,080 שעות לפני האירוע` with copy telling her to phone a hostess — false in that case, on a screen he approved.** **Recommend the deleted proposal:** hostess `<24h` · printed goods `<3` business days · reductions never marked. **This is genuinely his.**
- **S-1 — present as DECIDED, not as a question.** The tone map is ruled for all eight labels (§3.3 S-1). 🔴 **Show it as one table of all eight labels × the tone each approved mockup drew**, because the 3–3 and 2–1 splits are only visible that way — then the ruled column beside them. **He can override any row in one line.** 🚫 **Do not re-open it as an open question** — that is what "A8" was, and A8 had no row to be answered in.
**🔻👤 Stop:** nothing is written until he rules. Record each ruling in §3 with his words and the date, **and only then** write it back to `PROJECT_MASTER §7` / `db_roadmap` per iron rule 13(א).
**מה ייחשב עובד** *(`CLAUDE.md` iron rule 1, quoted)*
1. *"שאל כשלא חד-משמעי — ההכרעה תמיד של ישי."*
2. *"הפריט מגיע מעוכל, עם ראיה, ועם המלצה מנומקת — וסמן במפורש מה עוגן ומה המלצה."*
3. *"ועוגן שהוא אינו יכול לבדוק בעצמו אינו עוגן — הוא טענה בתחפושת."* ⇒ every anchor is translated into a screen, a mockup, one of his own rulings, or a named scenario with numbers.
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 1.1 · Migration A — `projects` columns, the `project_bonus` drop, `NOT NULL`, CHECKs**
**Files:** `supabase/migrations/<ts>_module6_projects_columns_and_constraints.sql` · `docs/schema.sql` ⚠️ shared-surface · `docs/db_roadmap.md` rows M6-2 · M6-3 · M6-7 · M6-13 · **A-14**
**What to do — in this exact order, because the order is load-bearing:**

```sql
-- ① measure before you touch anything. Non-zero on ANY of the five ⇒ STOP and report.
-- 🔴 Rows 4 and 5 exist because steps ③ and ④ below add CHECKs, and a CHECK added over a
--    violating row fails the whole migration. The Design Checklist says "count first, always"
--    and until 14/08 this query counted only the three columns the OTHER statements touch.
select count(*) filter (where quote_id is null)      as null_quote_id,
       count(*) filter (where owner_email is null)   as null_owner_email,
       count(*) filter (where project_bonus <> 0)    as nonzero_bonus,
       count(*) filter (where negative_feedback_reason is not null
                          and negative_feedback_reason not in
                              ('איחור דיילות','תפקוד דיילות','איכות תגים','ניהול לקוי','אחר'))
                                                     as bad_feedback_reason,   -- blocks ③
       count(*) filter (where project_status in ('awaiting_invoice','awaiting_payment','finished')
                          and summary_report_url is null)
                                                     as closed_without_report  -- blocks ④
  from public.projects;

-- ② new columns (⑭: exactly two timestamps, AR-1: one cancel_type column)
alter table public.projects add column cancelled_at            timestamptz;
alter table public.projects add column cancelled_by            text references public.users(email);
alter table public.projects add column cancel_type             text
  check (cancel_type in ('customer','force_majeure','other'));
alter table public.projects add column operationally_closed_at timestamptz;
alter table public.projects add column operationally_closed_by text references public.users(email);

-- ③ the missing CHECK (M6-13) — C6 §2.4.4's five closed values
alter table public.projects add constraint projects_negative_feedback_reason_check
  check (negative_feedback_reason is null or negative_feedback_reason in
    ('איחור דיילות','תפקוד דיילות','איכות תגים','ניהול לקוי','אחר'));

-- ④ the closing-needs-report constraint (㉛, closes §7.36)
alter table public.projects add constraint project_closed_needs_report
  check (project_status not in ('awaiting_invoice','awaiting_payment','finished')
         or summary_report_url is not null);

-- ⑤ the drop (㉟) — AFTER the count above proved nothing depends on it
alter table public.projects drop column project_bonus;

-- ⑥ the tightening (§7.62 / A-14) — LAST, after every row-creating step
alter table public.projects alter column quote_id    set not null;
alter table public.projects alter column owner_email set not null;
```
**Also:** 🟢 **B11 is RULED: number only.** 🚫 **Do NOT add `actual_start_time`/`actual_end_time`** — `actual_hours numeric` stands alone. *(This line previously read "if Ishay ruled B11 toward a range…"; a session reading the step and not §3.5 would have shipped two dead `time` columns.)*
🔴 **`cancel_type` is deliberately nullable** — a live project has no cancellation type. **The NOT-NULL-ness is enforced inside `cancel_project`, not by the column**, because `not null` on a column that is empty for every existing row cannot be added without a default, and a default would be a lie.
🚫 **Do not add a `final_gross_profit` column** (AR-6, Ishay 14/08/2026 01:17). **Do not add `ready_at`** (⑭).
**Migration Design Checklist:** reversible except the `drop column` (say this out loud at the typed-echo — **the data is gone**) · brief `ACCESS EXCLUSIVE` on one small table · 🔴 **counts run first, and they now cover all FIVE things this migration can trip on — the two CHECKs included** · no new FK index needed (`users(email)` is unique) · both new stamps are `timestamptz` · no Seed impact · no Storage impact · no function signature changes.
🔴 **`bad_feedback_reason > 0` ⇒ the value set in ③ is wrong, not the data.** C6 §2.4.4's five values are a *spec* list; a live row outside them means the spec and the DB disagree ⇒ **stop, report the actual distinct values to Ishay, and do not "clean" the data to fit a constraint.**
🔴 **`closed_without_report > 0` ⇒ ④ cannot ship as written.** Real projects already sit past `event_finished` without a report path; adding the constraint would fail. **Stop and report** — the options (backfill · `not valid` + later `validate` · narrow the constraint to rows closed after M6) are Ishay's, and none of them is a silent choice.
**🔻👤 Verify:**
```sql
select column_name, data_type, is_nullable from information_schema.columns
 where table_name='projects' and column_name in
   ('cancelled_at','cancelled_by','cancel_type','operationally_closed_at',
    'operationally_closed_by','project_bonus','quote_id','owner_email')
 order by column_name;
```
**Expected:** six rows; `project_bonus` **absent**; `quote_id` and `owner_email` both `is_nullable = NO`; all three new text/timestamp columns `YES`.
Then `mcp get_advisors (security + performance)` → **zero new findings**, or a written triage note naming each one.
**מה ייחשב עובד** *(`spec.md` §11 + ㉟, quoted)*
1. *"‏§7.62 הונהן במלואו ע"י ישי ב-13/08/2026 בערב ⇒ `projects.quote_id` ו-`owner_email` מקבלים `SET NOT NULL` במיגרציית מ6."*
2. *"ותנאי-ביצוע שטרם רץ: לספור NULLים חי לפני ההידוק — יש שורות ריקות ⇒ לעצור ולדווח, לא למחוק."*
3. *"מה שהבלופרינט בונה: `SET NOT NULL` על שתיהן, ואין מצב-ריק ל'אורחים מוערכים' ול'הכנסה מתוכננת'."*
4. ㉟: *"לעמודה אין מקור ואין קורא"* — and `assignments.personal_bonus` stays, owned by M8.
5. **AR-6 (Ishay, 14/08/2026 01:17):** M6 freezes only the inputs it owns. **No `final_gross_profit` column.**
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 1.2 · Migration B — `project_changes` table**
**Files:** `supabase/migrations/<ts>_module6_project_changes_table.sql` · `docs/schema.sql` ⚠️ shared-surface · `db_roadmap` row M6-1
**What to do:**
```sql
create table public.project_changes (
  change_id           bigint generated always as identity primary key,
  project_id          int  not null references public.projects(project_id) on delete cascade,
  change_group_id     uuid not null,                 -- one dialog submit = one group (screens row 9)
  sku                 text          references public.products(sku) on update cascade,
  color               text          check (color is null or color in ('לבן','שחור','אפור','טורקיז','כחול')),
  change_target       text not null check (change_target in ('logistics','hostess_count')),
  delta_qty           int  not null check (delta_qty <> 0),        -- ② + spec §14②: delta_qty, not qty_delta
  unit_price_snapshot numeric(12,2) not null check (unit_price_snapshot >= 0),
  unit_cost_snapshot  numeric(12,2) not null check (unit_cost_snapshot  >= 0),
  reason              text not null check (length(btrim(reason)) > 0),   -- ②: reason is MANDATORY
  performed_by        text not null references public.users(email),
  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now(),
  constraint project_changes_target_shape check (
    (change_target = 'logistics'     and sku is not null) or
    (change_target = 'hostess_count' and sku is null and color is null))
);
create index project_changes_project_id_idx on public.project_changes (project_id, created_at desc);
-- 🔴 `extensions.moddatetime`, NOT `public.moddatetime`. The extension was moved out of
--    `public` by `20260710164420_module2_moddatetime_to_extensions_schema.sql:7`, so
--    `public.moddatetime` does not resolve and this statement would FAIL on apply.
--    (Measured 14/08/2026: the ONLY executable `public.moddatetime` in the whole repo was
--     this very statement. No migration uses that form. The prose mentions above and in §10
--     are the correction, not further call sites.)
--    ⚠️ The 11 bare-name triggers in `20260710160735` still work only because they bound
--    to the function OID before the move; a NEW trigger cannot copy their form either.
create trigger project_changes_set_updated_at before update on public.project_changes
  for each row execute function extensions.moddatetime(updated_at);
alter table public.project_changes enable row level security;
-- SELECT only, gated on 'פרויקטים'. NO write policy — writes go through apply_scope_change (AS-2).
```
🔴 **The `color` CHECK must be byte-identical to `quote_services`'s** (`docs/schema.sql:460-461`) — copy it, do not retype it.
**Migration Design Checklist:** fully reversible (`drop table`) · no lock on existing tables beyond the FK validation · new table, no existing rows to violate anything · **index on `project_id` present** · `timestamptz` · no Seed impact · no Storage impact.
**🔻👤 Verify:**
```sql
select policyname, cmd from pg_policies where tablename='project_changes';
insert into public.project_changes (project_id, change_group_id, change_target, delta_qty,
       unit_price_snapshot, unit_cost_snapshot, reason, performed_by)
values (8, gen_random_uuid(), 'hostess_count', 0, 1, 1, 'x', '<ceo email>');
```
**Expected:** one policy, `cmd = SELECT`. The insert **fails** with `23514` on `project_changes_delta_qty_check` — proving `delta_qty <> 0` is live. *(Run the insert as the CEO through `execute_sql`, i.e. bypassing RLS, so the failure you see is the CHECK and not the missing write policy.)*
**מה ייחשב עובד** *(`processes-approved.md` ①–④, quoted)*
1. ②: *"טבלה חדשה `project_changes` — שורה לכל שינוי: מה · בכמה (חיובי=תוספת / שלילי=הפחתה) · **מחיר ועלות מוקפאים** · **סיבה (חובה)** · מי ביצע · מתי. **ההצעה נשארת קפואה**"* — Ishay: *"מסכים, טבלה חדשה. זה תיעוד חשוב גם לדוחות בהמשך"*.
2. ①: *"משנים כמויות בלבד. אין עריכת מחיר-יחידה בדיעבד."*
3. *"‏`project_changes` היא הבית היחיד לשינוי, כי למקור אין דלת"* — the quote is locked by a DB trigger that throws `P0001` in Hebrew.
4. `spec.md` §14②: the column is **`delta_qty`**, not `qty_delta`.
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 1.3 · Migration C — `assignments` attendance columns**
**Files:** `supabase/migrations/<ts>_module6_assignments_attendance.sql` · `docs/schema.sql` ⚠️ shared-surface · `db_roadmap` row M6-4
**What to do:** the three columns from `spec.md` §1.4's table — **these names are M6's ruling and M4 already assumed different ones** (AR-7):
```sql
alter table public.assignments add column attendance_status text
  check (attendance_status in ('arrived','late','no_show'));
alter table public.assignments add column lateness_level text
  check (lateness_level in ('light','medium','heavy'));
alter table public.assignments add column no_show_reason text
  check (no_show_reason in ('sick','approved_absence','ghosted'));

-- consistency across the three (screens row 21) — the seven legal combinations and no others
alter table public.assignments add constraint assignments_attendance_shape check (
  attendance_status is null
  or (attendance_status = 'arrived' and lateness_level is null     and no_show_reason is null)
  or (attendance_status = 'late'    and lateness_level is not null and no_show_reason is null)
  or (attendance_status = 'no_show' and lateness_level is null     and no_show_reason is not null));

-- no_show ⇒ zero hours (screens row 22)
alter table public.assignments add constraint assignments_no_show_zero_hours check (
  attendance_status is distinct from 'no_show' or actual_hours = 0);
```
🔴 **All three are nullable** — an assignment that has not been closed yet has no attendance, and there is no sensible default. The mandatory-ness is enforced by the closing RPC and by the form, per `screens-approved` מסך 5 §⑦.
**Migration Design Checklist:** reversible · `assignments` is small · **count violating rows first**: `select count(*) from assignments where actual_hours <> 0;` — the `no_show` constraint cannot be violated by existing rows because `attendance_status` starts NULL, but run it anyway · no new FK · no timestamps · no Seed/Storage impact.
**🔻👤 Verify:**
```sql
-- all seven legal shapes must pass and the eighth must fail
update public.assignments set attendance_status='late', lateness_level=null
 where project_id=8 limit 1;   -- expect 23514 on assignments_attendance_shape
```
**Expected:** error `23514`, constraint `assignments_attendance_shape`. Then advisors → zero new findings.
**מה ייחשב עובד** *(`spec.md` §1.4 + §12⑤, quoted)*
1. §1.4: *"שבע אפשרויות-הנוכחות — פקד אחד שטוח על המסך, שלוש עמודות במסד"*, with the exact seven-row mapping table.
2. §12⑤: *"שמות שלוש עמודות-הנוכחות הם הכרעה של מ6 — ומודול 4 כבר הניח שמות אחרים… שם שונה ⇒ `reliabilityScore` תקבל `undefined` ותחזיר ציון שגוי, בשקט."*
3. §12⑤ execution item: *"אחרי המיגרציה, ליישר את `smartMatch.js`"* — step 2.7.
4. `db_roadmap M6-4`: these are *"the only source for the reliability component, weight `0.35`, the largest one currently switched off."*
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 1.4 · Migration D — `logistics` read policy + origin pointer**
**Files:** `supabase/migrations/<ts>_module6_logistics_policy_and_origin.sql` · `docs/schema.sql` ⚠️ shared-surface · `db_roadmap` rows M6-5 · M6-6
**What to do:**
```sql
-- ⓪ FIRST: read the canonical module_name bytes. Do not type them from memory.
select module_id, module_name from public.modules order by module_id;

-- ① the read policy (AR-2 — gated on 'לוגיסטיקה', NOT 'פרויקטים')
create policy "logistics_select_by_permission" on public.logistics for select to authenticated
  using (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'לוגיסטיקה')
      and p.permission_level in ('edit', 'view')));

-- ② the origin pointer (⑬ + ㉗) — two nullable columns, exactly one filled (AS-7)
alter table public.logistics add column quote_service_line_id bigint
  references public.quote_services(line_id) on delete restrict;
alter table public.logistics add column project_change_id bigint
  references public.project_changes(change_id) on delete restrict;
alter table public.logistics add constraint logistics_origin_exactly_one check (
  quote_service_line_id is null and project_change_id is null            -- legacy rows, pre-M6
  or num_nonnulls(quote_service_line_id, project_change_id) = 1);
create index logistics_quote_service_line_id_idx on public.logistics (quote_service_line_id);
create index logistics_project_change_id_idx     on public.logistics (project_change_id);
```
🔴 **`quote_services.line_id` EXISTS and is a single-column primary key** (`docs/schema.sql:457`) — see §10 verification #1. `screens-approved §נספח③` and `screens-approved:2327` claim otherwise and are **wrong**; they read the original `CREATE TABLE` block and not the `ALTER` that replaced it. **There is no need for a new surrogate key and no need for a three-column FK.**
⚠️ **The CHECK admits all-NULL deliberately** — every `logistics` row that exists today was born before M6 and has no origin. Backfilling them is **not** possible reliably: the approve-RPC runs `row_number() over (order by qs.line_number)` **after** filtering out hostess lines, so `serial_number` is offset and cannot be joined back. 🔴 **Do not attempt a positional backfill** — on project `#8`, `B-REG-TAG` is line **2** in the quote and `serial_number = 1` in logistics.
⏳ **Who fills the column going forward is `🚧 מ5 ← מ6` contract item 1** — the writer is M3's **merged** approve-RPC. **M6 does not edit merged M3 code in this module** (that is the M5 Discovery's input); the column exists and stays NULL for new rows until then. **Record this in §10.**
**Migration Design Checklist:** reversible · two FKs added → **both get indexes, above** · existing rows all-NULL and the CHECK permits it · policy addition takes no lock · no Seed/Storage impact.
**🔻👤 Verify:**
```sql
select policyname, cmd, qual from pg_policies where tablename='logistics';
```
**Expected:** exactly one row, `cmd = SELECT`, and `qual` containing the literal `'לוגיסטיקה'`.
Then the **role matrix check, both directions, with the positive control first** (§2.7):
| Impersonated role | `select count(*) from logistics` | Meaning |
|---|:--:|---|
| מנכ"ל | **≥ 1** | ✅ positive control — impersonation works |
| מנהלת לוגיסטיקה | **≥ 1** | ✅ the role whose job this is |
| מנהלת פרויקטים | **≥ 1** | ✅ she has `👁` on `'לוגיסטיקה'` |
| מנהלת כספים | **0** | ✅ correctly blocked |
| מנהלת גיוס | **0** | ✅ correctly blocked |
🔴 **A `0` in the first row means the impersonation is broken, not that RLS works.** Re-check `sub` + `email` in the JWT claims and `users.status='active'`.
**Also verify, because §4.1 flags it as unmeasured:** `select policyname, qual from pg_policies where tablename='customer_hostess_preference';` → expect two policies both naming `'דיילות'`. Record the actual result in §10 either way.
**מה ייחשב עובד** *(`spec.md` §12② + `screens-approved` מסך 3, quoted)*
1. §12②: *"`logistics` היא `deny-all` — אפס policies, ומ6 פותח אותה בעצמו… וזה נכשל בצורה הגרועה ביותר האפשרית: השאילתה מחזירה אפס שורות עם `error: null`, וכלל 'אפס שורות ⇒ הושלם' יסמן *כל* פרויקט כמוכן-לוגיסטית. **המסך משקר, לא נכשל.**"*
2. §12②: *"אין להמתין למודול 5 — זו שורה אחת בתבנית שכבר רצה על 6 טבלאות."*
3. `screens-approved` מסך 3, the error-state text the screen must render: *"לא ניתן לטעון את נתוני הלוגיסטיקה של הפרויקט."* + *"להצעה שאושרה יש פריטי מוצר, ולכן רשימה ריקה כאן היא תקלה ולא מצב תקין."* + `נסי שוב` — **as distinct from** the legal empty state *"לא הוזמנו מוצרים לאירוע הזה — ההצעה כללה שירותי דיילות בלבד."*
4. ⑬: *"‏`quote_services` מחזיקה `color`; `logistics` אינה ⇒ שתי שורות-לוגיסטיקה זהות, ואי-אפשר לדעת איזו עלות מוקפאת שייכת לאיזו."*
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 1.5 · Migration E — Storage: `reports` + `finance` buckets and 8 policies**
**Files:** `supabase/migrations/<ts>_module6_storage_reports_and_finance.sql` · `docs/schema.sql` ⚠️ shared-surface · `db_roadmap` §5 rows
**What to do:** replicate `20260710160735:117-153` exactly — **four separate policies per bucket** (select · insert · update · delete), each testing `bucket_id = '<name>'` **before** the `exists` on permissions:
```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reports','reports', false, 2097152,          -- 🔴 2 MiB — RULED, see below
        array['application/pdf','image/jpeg','image/png']),
       ('finance','finance', false, 10485760,          -- 10 MiB — see the note, NOT ruled
        array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;
-- then 4 policies for 'reports' gated on 'פרויקטים', and 4 for 'finance' gated on 'כספים'
```
🔴 **`reports` = `2097152` (2 MiB), and this is a ruling, not a preference** (`db_roadmap` §5's `reports` row, Ishay 14/08/2026). 🚫 **Not `10485760`** — that number was copied from `marketing` and never checked against the path the file actually travels. 🚫 **And not 3 MiB either:** `MAX_ATTACHMENT_BASE64_CHARS = 4_000_000` (`src/lib/email.js:29`) with base64's 3-bytes→4-chars ratio puts the **hard binary wall at exactly 3,000,000 bytes ≈ 2.86 MiB**, so a 3 MiB bucket still admits a file that fails at send. **2 MiB leaves ~900 KB for the JSON envelope.**
⚠️ **`finance` was NOT ruled** — only `reports` was, because only `reports`'s files travel by mail. `finance` keeps the `marketing` precedent (10 MiB) and **has zero writers in M6** (AS-4). **Say this split out loud at the typed-echo**, so the asymmetry reads as a decision rather than a typo.
🔴 **The on-screen text is derived from a constant, never typed:** add `export const REPORT_MAX_BYTES = 2 * 1024 * 1024` to `src/modules/06_projects/api.js` and render `עד {REPORT_MAX_BYTES / 1024 / 1024}MB` — the exact pattern of `MARKETING_MAX_BYTES` (`02_customers/api.js:180`) and `MarketingPanel.jsx:200`. 🚫 **Do not reuse `MARKETING_MAX_BYTES`** (10 MB, different bucket). ⚠️ **The SQL literal and the JS constant are TWINS with no mechanical link** — `docs/schema.sql:728` already carries that warning for `marketing`; **write the same twin comment here**, in both places.
⚠️ **Known failure mode** (`20260710160735:9-10`): in some projects the `storage` schema is owned by `supabase_storage_admin` and `create policy` fails with **`42501`**. **If that happens, do not work around it in SQL** — create the policies through the Supabase dashboard and record it in §10 with the exact error text.
**Migration Design Checklist:** reversible (`delete from storage.buckets` + `drop policy`) · no lock on business tables · no existing objects in either bucket · no FK · no timestamps · **Storage impact: yes, this is the Storage lane item** · Seed impact: the `buckets` insert is a one-off configuration seed, the same exception as roles/modules/params.
**🔻👤 Verify:**
```sql
select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id;
select policyname, cmd from pg_policies where schemaname='storage' and tablename='objects' order by policyname;
```
**Expected:** three buckets, all with `public = false` for the two new ones and three MIME types each — 🔴 **`reports` → `file_size_limit = 2097152`** · **`finance` → `10485760`** · `marketing` unchanged. And **twelve** policies on `storage.objects` (4 existing for `marketing` + 8 new).
**מה ייחשב עובד** *(`processes-approved.md` ㉛, quoted)*
1. ㉛: *"שלושה buckets, לא ארבעה ולא אחד — לפי מספר כללי-הגישה השונים, לא לפי מספר סוגי-הקבצים."*
2. *"‏bucket ציבורי עוקף בקרת-גישה בקריאה — מי שיש לו הקישור רואה. ⇒ מתאים לשיווק בלבד. השניים החדשים פרטיים."*
3. *"אין ערובה טרנזקציונית בין Storage ל-Postgres, וזה מתועד ⇒ הפתרון אינו לקוות אלא לאכוף במסד"* — the `project_closed_needs_report` CHECK, already added in step 1.1.
4. `spec.md` §2.2: *"השורה קיימת מראש ⇒ מעלים את הקובץ ל-`reports/<project_id>/…` ⇒ RPC אחד כותב את הנתיב ומעביר סטטוס באותה טרנזקציה ⇒ נכשל ⇒ מוחקים את הקובץ."*
5. §12⑬: *"`createSignedUrl` מופיע `0` פעמים בכל `src/`"* ⇒ M6 builds this path first.
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 1.6 · Migration F — `email_log` accepts `project` + `project_report`, and the Edge Function ships with it** ⚠️ shared-surface *(`supabase/functions/send-email/index.ts`)*
**Files:** `supabase/migrations/<ts>_module6_email_log_accepts_project.sql` · `supabase/functions/send-email/index.ts` · `docs/schema.sql` · `db_roadmap` row A-20
**What to do:**
```sql
alter table public.email_log drop constraint email_log_entity_type_check;
alter table public.email_log add  constraint email_log_entity_type_check
  check (entity_type in ('quote','shift','project','project_report'));

create policy "email_log_select_projects_module" on public.email_log for select to authenticated
  using (entity_type in ('project','project_report') and exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'פרויקטים')
      and p.permission_level in ('edit','view')));
```
And in the Edge Function, **additively**:
```ts
const ENTITY_MODULE = { quote: 'הצעות מחיר', shift: 'דיילות',
                        project: 'פרויקטים', project_report: 'פרויקטים' }
const ENTITY_REQUIRES_ATTACHMENT = { quote: true, shift: false,
                                     project: false, project_report: true }
```
🔴 **Two entity types, not one, and this is AR-8's whole point:** `ENTITY_REQUIRES_ATTACHMENT` is per-`entity_type`, and M6 sends **both kinds** — the customer summary report **with** a file, the three hostess/survey mails **without**. Making the attachment optional globally *"הייתה מוחקת שומר חי מנתיב הצעת-המחיר… ואף בדיקה קיימת לא הייתה נופלת על כך"* (`index.ts:35`).
🔴 **Do not reuse `'shift'`.** `index.ts:116` requires `permission_level === 'edit'` and `ENTITY_MODULE.shift = 'דיילות'`, where **Dana holds `👁`, not `V`** ⇒ every cancellation mail she sends returns **403, silently**, and no hostess hears anything.
🔴 **The CHECK ships in the same migration as the code**, per `index.ts:31-34` — *"לא לפניה, אחרת המייל יוצא והיומן נשאר ריק."* ⇒ **the function deploy and the migration are one step, and the deploy is a 👤 action.**
🔧 **Also fix `db_roadmap A-20`**, which says only *"M4/M8/M11 each widen the `entity_type` CHECK by one value"* — M6 is not on that list and widens by **two**.
**Migration Design Checklist:** reversible (restore the two-value CHECK — but **only if no `project*` rows exist yet**; say so at the typed-echo) · brief lock while the CHECK revalidates all `email_log` rows · existing rows are all `quote`/`shift` and pass · no FK, no timestamps · no Seed/Storage impact · **it changes a constraint another module's code writes through** ⇒ deploy the function in the same step.
**🔻👤 Verify:**
```sql
select conname, pg_get_constraintdef(oid) from pg_constraint
 where conrelid='public.email_log'::regclass and contype='c';
select policyname from pg_policies where tablename='email_log' order by policyname;
```
**Expected:** the CHECK lists all four values; **three** SELECT policies (`…_quotes_module`, `…_shifts_module`, `…_projects_module`).
Then `npx deno check --node-modules-dir=none supabase/functions/send-email/index.ts` → **exit 0** (this is exactly what CI's `edge-function-check` job runs).
**מה ייחשב עובד** *(`spec.md` §12④, quoted)*
1. *"שכבת-המיילים — ואף אחד משמונת הכרטיסים, מהאפיון ומחוזה-העיצוב לא מזכיר אותה… זה הפער החמור ביותר שנמצא בשלב 3 — מ6 שולח ארבעה סוגי-מייל: ביטול · פרטים-השתנו · סקר-משוב · ודוח-הסיכום ללקוח."*
2. *"‏`ENTITY_REQUIRES_ATTACHMENT` הוא פר-`entity_type`, ומ6 שולח את שני הסוגים ⇒ או שני `entity_type` נפרדים, או רצפת-מצורף פר-תבנית. 🚫 לא לגלוש לרשות גורפת — זה מוחק שומר חי מנתיב הצעת-המחיר."*
3. *"‏`email_log` דורשת policy-קריאה משלה לפי שער-המודול של מ6 — 🚫 לא הרחבה של אחת הקיימות, אחרת יומן-ההצעות נפתח למנהלת הגיוס."*
4. *"ומה ש*לא* צריך להיבנות: תבנית סקר-המשוב כבר קיימת ומאוכלסת — `תבנית_מייל_משוב_לקוח`, וגם הקישור `קישור_בסיס_סקר_לקוחות`. שתי התבניות שכן חסרות הן `'האירוע בוטל'` ו-`'פרטי האירוע השתנו'`, ותו לא."*
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 1.7 · Migration G — `params` seed**
**Files:** `supabase/migrations/<ts>_module6_params_seed.sql` · `db_roadmap` row M6-12 + §5 rows
**What to do — seed exactly these rows. 🔴 The two template texts below are Ishay's approved copy (`db_roadmap` M6-12, "TEXT APPROVED BY ISHAY 14/08/2026"). They are not drafts. Do not edit a word, do not add a line, do not add a placeholder.**

```
param_name:  תבנית_מייל_אירוע_בוטל          param_type: templates
```
```
היי [שם_דיילת],
האירוע '[שם_פרויקט]' בתאריך [תאריך_אירוע] בוטל, והמשמרת שלך מבוטלת יחד איתו.
האירוע כולו לא יתקיים — כל הדיילות ששובצו אליו שוחררו. אין צורך להגיע.
הזכאות לתשלום על משמרת שבוטלה נקבעת לפי מועד הביטול. מחלקת הכספים תבדוק ותעדכן אותך בהמשך.
נשמח לשבץ אותך לאירוע הבא. לשאלות ניתן להשיב למייל זה.
בברכה,
צוות הגיוס, REG-IN.
```
**3 placeholders:** `[שם_דיילת]` · `[שם_פרויקט]` · `[תאריך_אירוע]`. **Subject, built in code:** `` `ביטול האירוע — ${event_name}` ``
🔑 **Three copy decisions not to re-litigate:** ① **no contact placeholders, deliberately** — `resolveShiftContact` (`src/lib/shiftEmails.js:72`) returns `null` when name *or* phone is missing and the caller must then refuse to send; a mail that must reach every hostess cannot depend on a nullable `projects.owner_phone`. Reply-to is the house pattern for bad news in both existing templates. ② **no attribution** — `cancel_type` has three values, the template is one fixed string, and `fillEmailTemplate` cannot branch or omit a line, so *"בוטל על ידי הלקוח"* would be **false** under force majeure. ③ 🔴 **`אין צורך להגיע` is financially load-bearing in Israel** — under the event-hall extension order a hostess who *arrives* and does not work is owed half a day; one told in time is not.

```
param_name:  תבנית_מייל_פרטי_האירוע_השתנו   param_type: templates
```
```
היי [שם_דיילת],
חל שינוי בפרטי האירוע '[שם_פרויקט]'. השיבוץ שלך בתוקף ואנחנו מצפים לראותך.
אלה הפרטים המעודכנים, והם הקובעים:
תאריך: [תאריך_אירוע]
שעות: [שעת_התחלה] עד [שעת_סיום]
מיקום: [כתובת_אירוע_מלאה]
אם הפרטים החדשים אינם מתאימים לך, עדכני אותנו בהקדם.
איש קשר: [שם_מנהלת_פרויקט], טלפון: [טלפון_מנהלת_פרויקט]
בברכה,
צוות הגיוס, REG-IN.
```
**8 placeholders — the identical set to `תבנית_אישור_סופי_שיבוץ`**, so the builder reuses `resolveShiftContact` unchanged. **Subject:** `` `עדכון פרטי האירוע — ${event_name}` ``
⚠️ **The trigger is narrower than it reads: a *date* change never sends this mail** — ㉑ resets every final approval and re-invites instead. **Only location (㉒) and hours (㉝) send an update while her confirmation stands.**
⚠️ **The sources say state old→new; we state only the new**, because no old-value placeholder exists in the vocabulary. `והם הקובעים` does the override work.

**Plus TWO more rows — not three.** 🔴 **The survey link is NOT seeded here. It already exists, and seeding a second row for it is the defect this line used to contain:**

> 🔴 **Three names circulated for one value; only ONE is real. Measured `14/08/2026`:**
> **‏① `קישור_בסיס_סקר_לקוחות` — the live `params` row.** Seeded at **`20260723112000_module3_seed_products_tiers_params.sql:63`**, `param_type = 'templates'`, value `https://forms.gle/YFJobqmgpBCqf1x87` — **a real URL, already on disk.**
> **‏② `[לינק_לשאלון_שביעות_רצון]` — a PLACEHOLDER**, not a param. It is the token inside the body of `תבנית_מייל_משוב_לקוח` (`:79-81`) that `fillEmailTemplate` substitutes ① into.
> **‏③ `קישור_שאלון_שביעות_רצון` — does not exist and must never be created.** It was this guide's own invention. **Seeding it would give the system two rows for one Google Form, and the mail builder would read whichever one it was told about.**
> ⇒ 🚫 **Do not seed a survey-link row. Do not ask Ishay for the URL** — it is on disk, it is his, and asking implies it is missing. *(Step 1.6's acceptance item 4 already said so verbatim — *"תבנית סקר-המשוב כבר קיימת ומאוכלסת — `תבנית_מייל_משוב_לקוח`, וגם הקישור `קישור_בסיס_סקר_לקוחות`"* — and step 1.7 contradicted it two screens later.)*
> ⚠️ **What M6 does owe:** `mark_feedback_survey_sent` runs after the send, and the send uses ① via ②. **Zero `src/` files reference either name today** — M6 is the first consumer, so the read path is new even though the data is not.

- `סף_לקוח_רדום_ימים` — 🟢 **RULED `120` (14/08/2026, Ishay delegated).** Seed exactly `'120'`. *(The card recommended 180; the approved mockup draws a 146-day-idle customer as dormant ⇒ the constraint is **≤146** and 180 would stop the approved screen reproducing. `90` would paint a 3-events-a-year customer permanently amber.)* `param_type = 'control_alerts'`, following the precedent of `ימי_אזהרה_קדם_אירוע=14`.
- **Cancellation compensation thresholds** — `שעות_פיצוי_ביטול_מלא = 24` · `שעות_פיצוי_ביטול_חלקי = 72` · `אחוז_פיצוי_ביטול_חלקי = 50`, `param_type = 'control_alerts'`. 🔗 מראת §7.16ב — SSOT: PROJECT_MASTER §7. **Why params and not code:** `spec.md` §12⑫ measured 31 distinct param names across every migration and found **not one compensation threshold**; the precedent (`ימי_אזהרה_קדם_אירוע`, `שעות_תזכורת_לדיילת`) is unambiguous. ⚠️ **Every `params` value is `text`, including booleans** (`schema.sql:79-84`) — cast on read.
🚫 **M6 does not compute compensation** — the numbers are seeded so M8 has a source. The cancellation dialog **displays** the resulting percentage (surface 7's `₪` banner row); it does not persist it.
**Migration Design Checklist:** fully reversible (`delete from params where param_name in (…)`) · no lock · `on conflict (param_name) do nothing` so a re-run is safe · no FK/timestamps · **Seed impact: yes — `params` is the declared exception** · no Storage impact.
**🔻👤 Verify:**
```sql
select param_name, param_type, length(param_value) from public.params
 where param_name in ('תבנית_מייל_אירוע_בוטל','תבנית_מייל_פרטי_האירוע_השתנו',
   'סף_לקוח_רדום_ימים','שעות_פיצוי_ביטול_מלא',
   'שעות_פיצוי_ביטול_חלקי','אחוז_פיצוי_ביטול_חלקי') order by param_name;

-- 🔴 And the negative check that proves the survey link was NOT duplicated:
select param_name, param_value from public.params where param_name like '%סקר%' or param_name like '%שאלון%';
```
**Expected:** **six** rows from the first query. From the second: **exactly one** row — `קישור_בסיס_סקר_לקוחות` → `https://forms.gle/YFJobqmgpBCqf1x87`. 🔴 **Two rows means a duplicate link was seeded; delete the new one before continuing.**
Then read both template bodies back and **diff them character-by-character against this guide** — a template is copy that goes to real hostesses.
**מה ייחשב עובד** *(`db_roadmap` M6-12, quoted)*
1. *"**✅ TEXT APPROVED BY ISHAY 14/08/2026 01:2X. Seed exactly as written; this is his approved copy, not a draft.**"*
2. *"‏`תבנית_מייל_ביטול_משמרת` הקיימת פותחת ב-'חל **שינוי בתכולת האירוע**'… ⇒ מנוסחת לצמצום-תכולה. דיילת שתקבל אותה בביטול-אירוע **תסיק שהאירוע מתקיים בלעדיה**."*
3. *"‏`שחרור_משמרת` אומרת 'תודה שהתפנית — **המשרה כבר אוישה**' (שקר: המשרה לא אוישה, האירוע מת)."*
4. §12⑫: *"מדרג-פיצוי-הביטול אינו קיים בשום מקום שהמערכת יכולה לקרוא ממנו… נסרקו 31 שמות-פרמטרים — אין ולו סף-פיצוי אחד. והתקדים במערכת חד-משמעי."*
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 1.8 · Migration H — the RPCs**
**Files:** `supabase/migrations/<ts>_module6_rpcs.sql` · `docs/schema.sql` ⚠️ shared-surface · `db_roadmap` rows M6-9 · M6-10

> ## 📜 PAYLOAD CONTRACTS — binding on Phase 1, Phase 2 and Phase 3 alike
> **Added `14/08/2026` (Ishay: *"סבבה תוסיף"*). Every field below was measured live against the DB the same day — not read from `schema.sql`, which is a snapshot.**
> 🔑 **Why this is in the plan and not left to the builder:** it is the one thing **two competent builders working alone would get incompatibly wrong.** Phase 1 writes the receiver, Phase 3 writes the sender, **and they only meet weeks later.** Both sides pass every check in the meantime, because each is internally consistent. 🚫 **And the failure is silent, not loud** — nothing throws; the wrong row is updated and the screen says *"נשמר"*.
> ⚠️ **`p_project_id` is ALWAYS a separate scalar parameter and NEVER a field inside a line/row object.** Trusting a per-line project id lets one call write across projects, and the permission check at the top guards one project only.
>
> ### ① `apply_scope_change(p_project_id int, p_lines jsonb, p_reason text)`
> *(Parameter order matches the two existing declarations in this guide — §4's RPC table and step 1.8 ③. Corrected on write: the contract was first drafted with `p_reason` second, which would have been a third variant of the same signature.)*
> **‏`p_lines` is an ARRAY of objects. One shape, discriminated by `target`:**
>
> | field | type | when | meaning |
> |---|---|---|---|
> | `target` | `text` | always | `'logistics'` or `'hostess_count'` — matches `project_changes.change_target` |
> | `sku` | `text` | `target='logistics'` | **measured:** `logistics_pkey = (project_id, sku, serial_number)` |
> | `serial_number` | `int` | `target='logistics'`, existing line | the **third** PK part. 🔴 **Without it, an event holding several lines of the same `sku` gets the WRONG one updated — or all of them.** ⚠️ **Omit it for a NEW line; the RPC allocates `max(serial_number)+1` server-side.** 🚫 **The client never invents a serial number** — two concurrent adds would collide on the PK. |
> | `target_qty` | `int` | always | 🔴 **THE TARGET, NOT THE DELTA.** The delta is derived server-side (`target_qty − planned_qty`) and stored in `project_changes.delta_qty`. **Sending a delta double-bills on retry.** For `hostess_count` this is the new `projects.required_hostess_count`. |
>
> 🔴 **And the constraint that shapes the whole reduction path, measured live: `logistics_planned_qty_check = CHECK (planned_qty > 0)`.** ⇒ **`target_qty = 0` means DELETE the row, never `update … set planned_qty = 0`** — the update raises `23514` and the scope change fails. **`target_qty < 0` is rejected outright.**
> ⚠️ **`logistics` has NO `color` column** *(measured: its columns are `project_id · sku · serial_number · planned_qty · actual_qty · item_status · notes · created_at · updated_at`)* — **so a line carries no colour.** ‏`project_changes.color` is the **audit record's** copy, taken from the quote line, **not a key.**
>
> ### ② `close_project_operationally(p_project_id int, p_actual_hours numeric, p_actual_guests int, p_report_path text, p_rows jsonb)`
> **‏`p_rows` is an ARRAY — one object per assigned hostess:**
>
> | field | type | required | measured anchor / rule |
> |---|---|:--:|---|
> | `hostess_id` | `bigint` | ✅ | with `assignment_number`, completes `assignments_pkey = (project_id, hostess_id, assignment_number)` |
> | `assignment_number` | `int` | ✅ | 🔴 **the third PK part** — a hostess can hold more than one row on a project; without it the wrong row is written **and it fails silently** |
> | `attendance_status` | `text` | ✅ | `arrived` / `late` / `no_show` (M6-4) |
> | `lateness_level` | `text` | only when `late` | `null` otherwise — `assignments_attendance_shape` enforces it |
> | `no_show_reason` | `text` | only when `no_show` | `null` otherwise |
> | `actual_hours` | `numeric` | ✅ | 🔴 **forced to `0` when `no_show`** (ט4-א). **B11: the number only — 🚫 no clock times** |
> | `preference` | `text` | ✅ | **measured `CHECK`: `מצוינת` · `בסדר` · `לא_לשלוח`** — exactly these three, `לא_לשלוח` with an underscore |
> | `preference_reason` | `text` | **when `לא_לשלוח`** | 🔴 **measured live: `CHECK ((preference <> 'לא_לשלוח') OR (preference_reason IS NOT NULL))`.** Phase 1 never mentioned this constraint; a payload without it fails `23514` **at runtime, after the user pressed save.** |
>
> 🔴 **And the guard nobody declared: `projects.customer_id` is NULLABLE, while the preference upsert keys on `customer_hostess_preference_unique = (customer_id, hostess_id)`** ⇒ **if the project carries no customer, skip the preference upsert and complete the closing** — do not fail the whole transaction over an optional side-effect.
> ✅ **The upsert target is that unique pair — which is exactly why B13 ruled overwrite-with-warning: the table is a per-pair STATE, not a log.**
>
> 🚫 **Neither payload carries money.** No price, no cost, no profit — M6 freezes inputs only (`§7.52`, and `AR-6`).
> ➡️ **Phase 2's API wrappers and Phase 3's two dialogs cite THIS table. Any change here is a change to all three phases and gets a `↳ as-built` note in each.**

**What to do — seven functions. Every one: `security definer`, `set search_path = public, pg_temp`, an explicit Hebrew permission check at the top, and `revoke execute … from anon`.**

```sql
-- shared helper, written once and called by all four operational functions
create or replace function public.assert_module_permission(p_module text, p_level text[])
  returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.permissions p
                 where p.role_id = (select public.current_user_role_id())
                   and p.module_id = (select module_id from public.modules where module_name = p_module)
                   and p.permission_level = any(p_level))
  then raise exception 'אין לך הרשאה לבצע פעולה זו במודול %', p_module using errcode = 'P0001';
  end if;
end $$;
```

**① `list_projects_overview()` → `setof record`** *(AR-3)*
Gate: `assert_module_permission('פרויקטים', array['edit','view'])`.
Returns one row per project: `project_id, event_name, customer_name, final_event_date, final_start_time, final_end_time, final_location, project_status, required_hostess_count, hostesses_confirmed, logistics_ready, logistics_total, assignments_row_count, cancelled_at, cancel_type, planned_revenue`.
🔴 **`hostesses_confirmed` is counted with the de-dup fold, in SQL:**
```sql
select count(*) from (
  select distinct on (a.hostess_id) a.assignment_status
    from public.assignments a
   where a.project_id = p.project_id
   order by a.hostess_id, a.assignment_number desc) w
 where w.assignment_status = 'finally_approved'
```
🔴 **`planned_revenue` must be `null`, not `0`, when the caller cannot read `quote_services`** (S-2). Because the function is `SECURITY DEFINER` it *can* read them — so **compute the caller's own visibility explicitly**: return the sum only when `assert`-style permission on `'הצעות מחיר'` holds for the caller, else `null`. Return `null` also when the project has no quote. **`0` is reserved for a genuine zero.**
⚠️ **This is the second implementation of the `MAX(assignment_number)` fold** (the first is `finalAssignmentRows`, `src/lib/hostesses.js:250-272`). `spec.md` §3.2's numbers — `#8` ⇒ `1/6`, `#11` ⇒ `0/1` — are the test that pins both to each other.

> 🔴 **`ממתין לסגירה` is unguarded in BOTH directions, and neither is covered by ㉙ as written. Both fixes live in this step.**
> **‏(א) Entry — the RPCs must refuse from `event_finished` onward, not only after the closing stamp.** ㉙ as drafted keys on `operationally_closed_at is not null`, so a project sitting in `event_finished` — **the entire window between the event and the closing** — still accepts `apply_scope_change` and `update_project_details`. ⚠️ **That contradicts two existing rulings:** ⑦'s own precondition, and **㉔, which rules that a change discovered after the event enters through the CLOSING screen** — the scope dialog is precisely the door ㉔ closed. ⇒ **the refusal predicate is `project_status in ('event_finished','awaiting_invoice','awaiting_payment','finished','cancelled') OR operationally_closed_at is not null`**, for the four operational RPCs. *(`mark_feedback_survey_sent` and `set_project_finance_fields` stay exempt — the whitelist, §4.2.)*
> **‏(ב) Exit — a project can get STUCK in `ממתין לסגירה`, and this one has no error at all.** The `pg_cron` job only moves projects **forward** (`final_event_date < current_date` ⇒ `event_finished`), and `recompute_project_status`'s guard returns early for any status outside the three active ones. ⇒ **push an event's date into the future after it has already flipped, and nothing moves it back**: it is not active, so the trigger ignores it; its date is no longer past, so the cron ignores it. **It sits in `ממתין לסגירה` forever, showing in the `לסגירה` tab as an event awaiting closure that has not happened yet.** 🔴 **The fix, in `update_project_details`:** when the new `final_event_date >= current_date` **and** the project is `event_finished` **and** `operationally_closed_at is null`, **move it back onto the active axis and call `recompute_project_status`** so it lands on the right one of the three. 🚫 **Never from a closed or cancelled project** — those are terminal. ⚠️ **And this is why (א) must say `event_finished` and not "any non-active status": the date move is exactly the legal write that has to survive it.** *(Build (א) and (b) together, in one function, and test the pair — a guard that blocks the escape hatch is worse than no guard.)*

**② `update_project_details(...)`** *(㉑ · ㉒ · ㉝ · AR-10)*
Gate `edit` on `'פרויקטים'`; refuse per (א) above — 🔴 **from `event_finished` onward, not only after the closing stamp** — with the one exception (ב) defines.
🔴 **Statement order inside the function, and reversing it turns a legal date move into a hard failure:**
1. **Pre-query first** — if the date changed, find any hostess who is `finally_approved` on the **target** date for a **different** project, and `raise exception` with AR-10's Hebrew message naming her `full_name` and the conflicting `event_name`. *(The index alone carries neither name.)*
2. **Then reset the approvals** — `update assignments set assignment_status = 'pending' … where project_id = p and assignment_status = 'finally_approved'` (㉑). **After this the partial index no longer covers those rows**, which is why the pre-query is the real warning and the `unique_violation` handler is only the backstop.
3. **Then update `projects`** — and if `final_location` changed, `lat = null, lng = null` **in the same statement** (㉒ / A9). 🔴 **Unconditionally when the location changed** — a conditional null freezes the map pin on the old address forever, because `ensureProjectCoordinates` returns early when both columns are filled (S-3).
4. **Then return** which hostesses need re-inviting and which need an update mail, so the **client** can send them (AR-5).
Wrap the whole body in an `exception when unique_violation then raise exception '<AR-10 backstop text>'` block.

**③ `apply_scope_change(p_project_id, p_lines jsonb, p_reason text)`** *(② · ⑯ · AR-4)*
One function, not two (A10). One `change_group_id` per call. In one transaction:
insert a `project_changes` row per changed line **with `unit_price_snapshot`/`unit_cost_snapshot` read server-side from `quote_services`** (never from the client payload) ⇒ update `logistics.planned_qty` and/or `projects.required_hostess_count` ⇒ let the status trigger re-run.
🔴 **`p_lines` carries the NEW QUANTITY, not the delta — and the delta is computed server-side as `new_qty − current_qty`. State this explicitly in the function's comment, because getting it wrong is silent and doubles money.** ⚠️ **The scenario, and it needs no bug to happen:** Dana clicks `שמור` twice — a slow network, a double-click, a retry after a timeout that actually succeeded. **If `p_lines` carried a delta, the second call adds it again**: `planned_qty` goes 300 → 380 → 460, a second `project_changes` row books a second `+80 × 5.00 ₪`, and **the customer is billed twice for one change.** Nothing throws; the CHECK is satisfied; the history reads as two genuine changes. **With a target quantity the second call computes `380 − 380 = 0` and is a no-op** *(and `delta_qty <> 0` from step 1.2 makes the empty row impossible to insert).* 🔑 **Idempotence here is bought by the parameter's meaning, not by a lock.**
🔴 `raise exception` if any resulting `planned_qty <= 0` (AR-4) — the `CHECK` would catch it, but the Hebrew message is ours: *"הכמות חייבת להיות גדולה מאפס. להסרת פריט לגמרי — פני למנהלת הלוגיסטיקה."*
🚫 **No time threshold anywhere in this function** (⑯).

**④ `cancel_project(p_project_id, p_cancel_type, p_cancel_reason)`** *(⑤ · ⑩ · ⑭ · ㉕)*
In one transaction: `project_status = 'cancelled'` · `cancelled_at = now()` · `cancelled_by = auth.jwt()->>'email'` · `cancel_type` · `cancel_reason` · **every** assignment that is `finally_approved` or `pending` or `confirmed_available` ⇒ `released` (⑤ — all of them, no picking).
🚫 **Does not touch `logistics` at all** (㉕). 🚫 **Does not send mail** — it returns the hostess list, and the client sends (AR-5).
Refuse if already `cancelled` (a cancelled project does not come back to life — Ishay: *"בא נניח שלא"*).

**⑤ `close_project_operationally(...)`** *(ט4-ד · ㉙ · AR-5 · AR-6)*
Preconditions: `project_status = 'event_finished'` · not already closed · `p_report_path` not null.
In **one** transaction: three project-level fields + the report path + `project_status = 'awaiting_invoice'` + `operationally_closed_at`/`_by` ⇒ per-hostess `attendance_status`/`lateness_level`/`no_show_reason`/`actual_hours` on `assignments` ⇒ upsert `customer_hostess_preference` per hostess (`on conflict (customer_id, hostess_id) do update`).
🚫 **No profit computation and no profit column** (AR-6, Ishay 14/08/2026 01:17).
🚫 **No mail, and it does NOT write `feedback_status`** (AR-5) — writing `'sent'` here would be a lie the moment the send fails.
🔴 The `project_closed_needs_report` CHECK from step 1.1 makes the status transition *impossible* without a report path, even if the UI breaks.

**⑥ `mark_feedback_survey_sent(p_project_id)`** *(AR-5 · AS-5)*
Writes `feedback_status = 'sent'` and nothing else. 🔴 **Exempt from ㉙'s refusal** — it exists precisely to run after the closing. The value is **English**: `('not_sent','sent','completed','no_response')` (`schema.sql:131`); ㉞'s Hebrew `'נשלח'` would be rejected by the CHECK (`spec.md` §12⑥).

**⑦ `set_project_finance_fields(p_project_id, p_invoice_sent, p_payment_date, p_feedback_score, p_negative_feedback_reason, p_feedback_notes)`** *(㉘)*
🔴 **Gate is `edit` on `'כספים'` — NOT `'פרויקטים'`.** ✅ **Keeps working after the operational closing.** M6 ships it with **zero callers**; M8 is the caller. *(Build it anyway — it is what makes ㉘ true, and its absence would leave `projects` with no legal write path for finance.)*

**Migration Design Checklist:** all `create or replace`, so reversible by replacing with the previous body — **but `assert_module_permission` and the six others are new**, so reversal is `drop function` · no table locks · no data touched at creation · no FK/timestamps · no Seed/Storage impact · 🔴 **it does NOT replace any existing function** — verify with `select proname from pg_proc where pronamespace='public'::regnamespace order by proname;` **before** writing, and if any name collides, `pg_get_functiondef` it first.
**🔻👤 Verify:**
```sql
select p.proname, p.prosecdef, pg_get_function_identity_arguments(p.oid)
  from pg_proc p where p.pronamespace='public'::regnamespace
   and p.proname in ('assert_module_permission','list_projects_overview','update_project_details',
     'apply_scope_change','cancel_project','close_project_operationally',
     'mark_feedback_survey_sent','set_project_finance_fields') order by 1;
select r.rolname, has_function_privilege(r.rolname,'public.list_projects_overview()','execute')
  from pg_roles r where r.rolname in ('anon','authenticated');
```
**Expected:** eight rows, every `prosecdef = true`; `anon` → **false**, `authenticated` → true.
Then the **anchor test, run live** (`spec.md` §3.2): `select * from list_projects_overview() where project_id in (3,8,11);` ⇒ `#8` shows `hostesses_confirmed = 1`, `required = 6`, `logistics_ready = 0`, `logistics_total = 2` · `#11` shows `0` of `1` and `logistics_total = 0` · `#3` shows `0` of `6`. 🔴 **`#8` has 9 assignment rows and 6 hostesses — a naive `COUNT(*)` returns more than 1 and fails this check.** Then advisors → zero new findings.
**מה ייחשב עובד** *(`spec.md` §12① + §3.2, quoted)*
1. §12①: *"ל-`projects` אין policy-כתיבה, וזו ארכיטקטורה ולא חסר… ⇒ כל פעולה של מ6 היא RPC: עריכת-פרטים · שינוי-תכולה · ביטול · סגירה. 🚫 אל תוסיף `projects_write_by_permission` — היא תפתח את כל 30 העמודות לכל מי שיש לו `edit` על 'פרויקטים', ותהרוס את ㉘ ואת ㉙ באותה שורה."*
2. §12③: *"‏`assignments_write_by_permission` דורשת `edit` על 'דיילות' ⇒ מסך-הסגירה שלה לא יוכל לכתוב `attendance_status` ולא `preference`. ⇒ ה-RPC של הסגירה חייב `SECURITY DEFINER`. **זו אינה החמרה — זו הסיבה שהוא בכלל קיים.**"*
3. §3.2: *"‏`#8` הוא הבדיקה של ה-de-dup: 9 שורות ו-6 דיילות ⇒ ספירה נאיבית של `COUNT(*)` תמנה דיילת שסירבה-ואז-זומנה-שוב פעמיים. `MAX(assignment_number)` פר-דיילת הוא הנוסחה."*
4. §3.2: *"ו-`#11` הוא הבדיקה של ⑨: לוגיסטיקה 100%, שיבוץ 0%. מיזוג לאחוז אחד היה מציג '50% מוכן' — מספר חסר-משמעות."*
5. §2.5(א): *"דחיית תאריך *יכולה להיכשל*, וזו התנהגות נכונה… הפרדיקט שהושמט הוא ההבדל: רק שורות מאושרות-סופית מתנגשות ⇒ זימון ממתין או דיילת שאישרה זמינות בלבד אינם חוסמים הזזת-תאריך. מימוש שיניח חסימה גורפת יחסום פעולות לגיטימיות."*
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 1.9 · Migration I — status-machine trigger + daily `pg_cron` job**
**Files:** `supabase/migrations/<ts>_module6_status_machine_and_cron.sql` · `docs/schema.sql` ⚠️ shared-surface · `db_roadmap` rows M6-11 · row 32 of the screens table
**What to do:**
```sql
create or replace function public.recompute_project_status(p_project_id int)
  returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_status text; v_required int; v_confirmed int; v_log_total int; v_log_ready int;
        v_any_human_action boolean;
begin
  select project_status, required_hostess_count into v_status, v_required
    from public.projects where project_id = p_project_id for update;

  -- 🔗 מראת §7.44↳ — SSOT: PROJECT_MASTER §7.
  -- 🔴 THE GUARD. Recompute ONLY while the project is on the active axis.
  -- Without it, a closed / cancelled / invoiced project gets dragged backwards by a late edit.
  if v_status not in ('not_started','in_progress','ready') then return; end if;

  -- staffing: MAX(assignment_number) per hostess, then count finally_approved
  select count(*) into v_confirmed from (
    select distinct on (a.hostess_id) a.assignment_status from public.assignments a
     where a.project_id = p_project_id order by a.hostess_id, a.assignment_number desc) w
   where w.assignment_status = 'finally_approved';

  select count(*), count(*) filter (where item_status = 'ready')
    into v_log_total, v_log_ready from public.logistics where project_id = p_project_id;

  -- 🔴 "first human action" = an assignments row exists OR an item LEFT not_started.
  -- 🚫 NOT "a logistics row was created" — logistics rows are born automatically with the
  -- project, so that reading makes `not_started` an unreachable status. (spec.md §12⑨)
  select exists (select 1 from public.assignments where project_id = p_project_id)
      or exists (select 1 from public.logistics   where project_id = p_project_id
                   and item_status <> 'not_started')
    into v_any_human_action;

  if v_confirmed >= v_required                                  -- 🔴 ≥, never = (§7.43)
     and (v_log_total = 0 or v_log_ready = v_log_total)         -- zero rows ⇒ complete
  then
    -- ㉓: 100% AFTER the date has passed ⇒ event_finished, not ready
    update public.projects
       set project_status = case when final_event_date < current_date
                                 then 'event_finished' else 'ready' end
     where project_id = p_project_id;
  elsif v_any_human_action then
    update public.projects set project_status = 'in_progress' where project_id = p_project_id;
  else
    update public.projects set project_status = 'not_started'  where project_id = p_project_id;
  end if;
end $$;
```
**Three triggers, because there are three sources and the third is the one people forget** (`spec.md` §2.1, `🔄3`):
```sql
create trigger assignments_recompute_project_status
  after insert or update or delete on public.assignments
  for each row execute function public.trg_recompute_project_status();
create trigger logistics_recompute_project_status
  after insert or update or delete on public.logistics
  for each row execute function public.trg_recompute_project_status();
create trigger projects_recompute_on_required_count      -- 🔴 the third source
  after update of required_hostess_count on public.projects
  for each row execute function public.trg_recompute_project_status();
```
🔴 **The `projects` trigger must not recurse.** `recompute_project_status` writes `projects.project_status`, and the third trigger is `AFTER UPDATE OF required_hostess_count` — so it fires only on that column and the status write does not re-trigger it. **Verify this explicitly**, because `AFTER UPDATE` without the `OF` clause is an infinite loop.
**And the cron job** (㉚, closes §7.32), following `20260723120500`'s pattern exactly:
```sql
select cron.schedule('module6-event-finished', '0 2 * * *', $job$
  update public.projects set project_status = 'event_finished'
   where project_status in ('not_started','in_progress','ready')
     and final_event_date < current_date;
$job$);
```
⚠️ **`0 2 * * *` deliberately, after M3's `0 1` and M1's `30 1`** — no overlap. ⚠️ **`< current_date`, not `<=`** — `spec.md` §2.1's boundary is that *today's* event is still shown (A14).
⚠️ **Known gap, and it is acceptable:** ㉓ writes `event_finished` immediately when a project reaches 100% after its date, but a project that reaches 100% **on** the event day sits at `ready` until 02:00 the next morning. **This is correct** — the event has not passed yet.
**Migration Design Checklist:** reversible (`drop trigger` × 3, `drop function`, `cron.unschedule`) · triggers take a brief `SHARE ROW EXCLUSIVE` on three tables · **existing rows: all four real projects sit on `not_started` and the trigger does not backfill them** — 🔴 **run a one-time `select public.recompute_project_status(project_id) from public.projects;` at the end of the migration and state that you are doing it at the typed-echo, because it changes visible data** · no new FK · no timestamps · no Seed/Storage impact.
**🔻👤 Verify:**
```sql
select project_id, project_status, final_event_date from public.projects order by project_id;
select jobname, schedule from cron.job order by jobname;
```
**Expected:** `#8` ⇒ `in_progress` (9 assignment rows, 1 approved of 6) · `#11` ⇒ `in_progress` · `#3` ⇒ `not_started` (zero assignment rows, logistics all `not_started`) · `#7` ⇒ `event_finished` (date passed 12 days ago). **Three cron jobs**, including `module6-event-finished`.
🔴 **This is the moment `spec.md` §"מה ייחשב עובד" #2 becomes checkable** and the moment the `לסגירה` tab stops being empty forever.
**מה ייחשב עובד** *(`spec.md` §"מה ייחשב עובד" #2/#3 + §12⑨, quoted)*
1. *"פרויקט שהתאריך שלו עבר מופיע בלשונית `לסגירה` בלי שאיש נגע בו — כלומר עבודת ה-`pg_cron` רצה. (היום `#7` עבר לפני 12 יום ועדיין `טרם החל`.)"*
2. *"שני מדדי-המוכנות מוצגים בנפרד ולעולם אינם ממוצעים — `#11` מראה `0/1` שיבוץ ולוגיסטיקה מושלמת, ואף מסך אינו אומר '50%'."*
3. §12⑨: *"מלכודת-הלידה… `C5 §5.5.7` אומר 'שורת שיבוץ **או** לוגיסטיקה' — אבל שורות-הלוגיסטיקה נולדות אוטומטית עם הפרויקט ⇒ הטריגר היה יורה בלידה, ו-`טרם החל` היה הופך לסטטוס בלתי-נגיש לחלוטין. ✅ התיקון: המדד הלוגיסטי נספר כ'פעולה' רק כשפריט *יצא* מ-`not_started`."*
4. §12⑩: *"`מוכן לביצוע` אינו הישג ואינו נעילה — הוא מצב רגעי והפיך… 🚫 אסור לתלות בו שום פעולה חד-פעמית."*
5. `🔄5`: over-staffed (7 of 6) reaches `ready` because the metric is `≥`; a customer increase 6→8 sends it back to `בתהליך`; an item going backwards from `ready` does too.
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 1.10 · 🔻👤 Phase-1 gate**
**Files:** `docs/schema.sql` · `docs/db_roadmap.md` · this guide
**What to do:** refresh `docs/schema.sql` from Supabase Studio; flip every `A-M6` row (M6-1…M6-14), the three §5 Storage rows, and **`A-14`** from "absent" to applied-with-timestamp; add the `db_roadmap §10` strike entries; reconcile the migration-letter counter (A–I = **nine** applied).
**🔻👤 Verify:** `mcp get_advisors` security **and** performance → **zero new findings**, or a written triage line per finding in §10. `git status` shows `schema.sql` staged **together with** every migration file. **Re-measure `🚧 מ6` and compare against the count you took at the START of this phase** — the requirement is that **none was silently dropped**, not that it equals a number written in this guide (step 4.2 explains why any pinned number here is already stale).
**מה ייחשב עובד** *(migration protocol, quoted from `supabase/migrations/CLAUDE.md`)*
1. *"אחרי ההחלה, ארבעה צעדים: החלה ⇒ אימות בקריאה ⇒ **רענון `docs/schema.sql`** ⇒ **עדכון `db_roadmap §10` באותו סשן**."*
2. *"מיגרציה שמגיעה ל-PR בלי `schema.sql` מעודכן אינה מאושרת."*
3. All nine migrations are append-only history from this point; every correction is a new forward migration.
**🌊 אדוות —**
**🗣️ אושר —**

---

### Phase 2 — Business logic (`src/lib/` + `src/modules/06_projects/api.js` + unit tests)

**Iron rule 14 applies throughout: the UI never duplicates a formula.** Every number on every screen comes from a pure function in `src/lib/` or from the overview RPC. A component that computes a ratio, a cost or a gap sentence inline is a defect.

---

**Step 2.0 · 🔻👤 Phase-2 door — Ledger sweep**
**Files:** none (chat only).
**What to do:** sweep **§3.5** for every OPEN item anchored to a Phase-2 step and bring them as one consolidated round **before step 2.1**.
🟢 **Anchored set today: NONE.** The item that used to sit here — **A7, verb gender** — is **ruled** (S-28: module 6 is entirely feminine; `LoadingOrError` gets a new optional `retryLabel` prop and its shared default is untouched; the cross-system sweep is registered as `🚧 מ12`). ⇒ **say `אין` out loud and proceed.**
🔴 **Do not skip the sweep because the answer is `אין`.** §9(h) exists so a deferred question is settled at the door rather than mid-step; **a door that reports `אין` and a door that was never opened are indistinguishable afterwards**, and this guide's own §3.5 gained four dead ids precisely because nobody re-read it. **Re-read §3.5 as it stands now** — a Phase-1 ruling may have moved an item into this phase.
**🔻👤 Stop** only if the sweep finds something; otherwise this is a 🤖 confirmation and the phase starts.
**מה ייחשב עובד** *(`module-blueprint/template.md` §8(h), quoted)*
1. *"on ENTERING a phase: sweep the Decisions Ledger for OPEN/nod-pending items anchored to this phase's steps and present them to Ishay for a consolidated ruling BEFORE the phase's first step — deferred questions get settled at the phase door, not mid-step where they ambush the build."*
2. §3.5's own routing rule: an id cited from a step must exist in the table; **A7 · A8 · B1 · B4 · B10 · B14 are closed and were removed, not left dangling.**
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 2.1 · `src/lib/projects.js` — labels, tone map, readiness, gap sentences, active-status SSOT**
**Files:** `src/lib/projects.js` (new) · `src/lib/projects.test.js` (new)
**What to do — five exports, and every Hebrew string below is copied from the approved vocabulary (`spec.md` §1.1/§1.8), never re-worded:**

```js
export const PROJECT_STATUS_LABELS = {
  not_started:     'טרם החל',
  in_progress:     'בתהליך',
  ready:           'מוכן לביצוע',
  event_finished:  'ממתין לסגירה',   // 🔴 ⑲ — NOT 'אירוע הסתיים', anywhere, on any screen
  awaiting_invoice:'ממתין לחשבונית',
  awaiting_payment:'ממתין לתשלום',
  finished:        'פרויקט הסתיים',
  cancelled:       'בוטל',
}
// 🔴 RULED in full (S-1). Keyed by the DISPLAYED label, because that is what StatusTag looks up.
export const PROJECT_STATUS_TONES = {
  'טרם החל':        'muted',
  'בתהליך':         'muted',   // 🔴 not teal: most overview rows are בתהליך, and a tone that
                               //    paints the majority stops separating
  'מוכן לביצוע':    'teal',    // 🔴 not ok/green: 🔄6② rules it REVERSIBLE, and `ok` means
                               //    "סגור, אין מה לעשות"
  'ממתין לסגירה':   'warn',
  'ממתין לחשבונית': 'muted',
  'ממתין לתשלום':   'muted',
  'פרויקט הסתיים':  'ok',
  'בוטל':           'dashed',  // 🔴 never red — a valid terminal state, not a failure
}
export const ACTIVE_PROJECT_STATUSES = ['not_started', 'in_progress', 'ready']   // ⑫ — the SSOT
export function staffingMetric(assignmentRows, requiredCount) { /* ≥, and MAX(assignment_number) per hostess */ }
export function logisticsMetric(logisticsRows) { /* zero rows ⇒ complete */ }
export function gapSentence(project) { /* the `מה חסר` column — words, never a score */ }
```
🔴 **`PROJECT_STATUS_TONES` is keyed by the *displayed Hebrew label*, because that is what `StatusTag.jsx:29-42` looks up** — and a miss falls through to `muted` **silently**. ⇒ **the key for `event_finished` must be `'ממתין לסגירה'`**; `'אירוע הסתיים'` produces a grey tag with no error. **Test with `describe.each` over all eight labels** (S-24), asserting the tone is defined and is not the fallback.
🔴 **`gapSentence` returns one of the approved sentences verbatim** — `'לא נשלח אף זימון — איש לא נגע בפרויקט מאז שנוצר'` · `'הכול סגור — אין מה לעשות'` · `'ממתין להזנת שעות בפועל, כמות אורחים ודוח-סיכום'` · `'האירוע עבר ולא נסגר — לא נשלח בו אף זימון מעולם'` · `'אצל מנהלת הכספים — אינו דורש ממך פעולה'` · `'הדיילת היחידה אישרה זמינות וממתינה לאישור סופי ממך'` · `'2 זימונים ממתינים למענה — וגם אם שתיהן יאשרו, עדיין חסרות 3'`. ⚠️ **The mockup uses two phrasings for some of these between tabs** (e.g. `התקיים לפני N ימים` in `לסגירה` vs `לפני N ימים` in `הכול`) — that is a card-vs-mockup conflict recorded in §10; **pick one, use it in both, and note the choice**.
🚫 **No urgency score, no numeric ranking, no `50/30/20`** (⑧, and `§7.9`'s formula was cancelled).

**🔴 Three enforcement tests, in `src/lib/projects.guards.test.js` — and they must be UNIT tests, not scanner scripts.**
> ⚠️ **Why unit tests and nothing else. Measured `14/08/2026`:** CI (`.github/workflows/ci.yml`) runs exactly **seven** npm scripts — `lint · format:check · dup · deadcode · audit · test:run · build`. **`check:bidi`, `check:docs-structure` and `check:context` are in `gate` and NOT in CI**, and `gate` itself is never invoked by CI. ⇒ **a rule enforced by a scanner is enforced only when a human remembers to run `gate` locally.** `test:run` is the only gate that fires by itself. **Shape them like `src/App.routes.test.jsx`:** a pure exported analyzer taking a **source string**, the real file read via `fs.readFileSync(path.resolve(process.cwd(), …))`, an explicit allow-list `Set`, a `throw` if the structure it depends on disappears, and `expect(violations).toEqual([])` — **plus a controlled RED case on synthetic source proving the guard actually bites** (Ishay's 29/07 requirement; a guard never observed failing is not a guard).
> **‏① Unmapped-label guard.** `describe.each` over all eight labels asserting the tone resolves — **and one case with a label that is NOT in the map asserting it is REPORTED, not silently toned.** 🔴 **This is the whole point:** `StatusTag.jsx:50` is `TONES[tone ?? TONE_BY_LABEL[label]] ?? TONES.muted`, and `TONES.muted` is **byte-identical** to the tone of `ממתינה למענה` ⇒ a missing key is invisible on screen. **A test that only checks the eight present labels proves nothing about the failure mode.**
> **‏② `אירוע הסתיים` source scan.** Fails if the literal `אירוע הסתיים` appears anywhere under `src/modules/06_projects/**` (⑲ — the DB value never surfaces, the label is `ממתין לסגירה`).
> **‏③ `OPEN_PROJECT_STATUSES` scan.** Fails if that identifier survives anywhere in `src/` after step 2.6 — the constant moves to `ACTIVE_PROJECT_STATUSES` here and must not be left behind as a second definition.

**🔻🤖 Verify:** `npm run test:run` → **`Tests 752 + N passed`** with the new files green; the `describe.each` proves all eight tones resolve **and the RED case proves the unmapped-label guard fails when it should.** Then, against live data, `staffingMetric` on `#8`'s 9 rows returns **`1/6`** and on `#11` returns **`0/1`**; `logisticsMetric` on `#11`'s zero rows returns **complete**, not `0/0`.
**מה ייחשב עובד** *(`spec.md` §1.1 + §1.8 + §"מה ייחשב עובד" #1, quoted)*
1. §1.1: *"‏`event_finished` ⇒ `ממתין לסגירה`, וזו ההכרעה שקל ביותר לשבור… 🚫 אין לכתוב 'אירוע הסתיים' בשום מקום בממשק, באף מסך."*
2. §1.8: *"‏`מה חסר` (משטח 1) — 🚫 ולא 'דחיפות' ולא 'ציון'. ⑧ ביטלה את הציון, והעמודה נושאת **משפט במילים**. שם אחר יחזיר את הציון מהדלת האחורית."*
3. §"מה ייחשב עובד" #1: *"דנה פותחת את מבט-העל ויודעת מיד לאיזה אירוע להיכנס — הסדר והעמודה `מה חסר` עונים על זה, **ולא ציון**."*
4. `🔄4`: *"מדד שיבוץ = `COUNT(finally_approved) ≥ required_hostess_count` — ונספר לפי `MAX(assignment_number)` פר-דיילת"* · *"אפס שורות לוגיסטיקה ⇒ נספר כהושלם"*.
5. ⑫: *"פעיל = `not_started` · `in_progress` · `ready`… 🔴 `cancelled` אינו פעיל."*
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 2.2 · `src/lib/projectChanges.js` — scope-change arithmetic**
**Files:** `src/lib/projectChanges.js` (new) · `src/lib/projectChanges.test.js` (new)
**What to do:** pure functions computing, per changed line, `delta_qty` and `סכום השינוי = delta_qty × unit_price_snapshot`; then the dialog's money block — `סכום השינוי` ⇒ `הנחה N% — כמו בהצעה המקורית` ⇒ `לפני מע"מ` ⇒ `מע"מ N%` ⇒ `תוספת לחיוב`.
🔴 **Reuse `src/lib/pricing.js:106-132`'s order and its integer-agorot arithmetic. Do not re-derive it.** Discounts **add, they do not chain**: `5% + 10% = 15%` off the subtotal. Chaining gives `14.5%` and **`6,313 ₪` instead of `6,319 ₪`** — small enough to pass a reading, large enough to break a report.
🔴 **The frozen price comes from `quote_services.closing_unit_price`, the frozen cost from `closing_unit_cost` — never from today's catalogue** (③ⁿ / ③ↄ). A new item that was **not** in the quote enters at today's catalogue tier and inherits the quote's discount (mockup 06 panel ④).
**The late-change marker** (⑯): a pure function returning the hours-until-event and the exact banner text *"⚠ שינוי 18 שעות לפני האירוע."* + *"דיילת נוספת כמעט אינה ניתנת לגיוס בטווח כזה, ותגים מודפסים דורשים ימים."* + *"הרימי טלפון — אל תסתמכי על מייל."* 🚫 **It marks; it never disables anything.**
🔴 **↳ as-built — the marker is CONDITIONAL, and this is a deviation from the mockup, which draws it unconditionally.** *(Ishay ruled `14/08/2026 11:30`, item ד — full reasoning in §3.5's RULED block.)* **`isLateChange(line, eventDate)` returns true only for: a hostess-quantity line under 24 hours · a printed-goods line under 3 business days. A negative `delta_qty` (a reduction) is NEVER marked, at any distance.** Everything else returns false and renders no banner.
🚫 **This does not reopen ⑯.** ⑯ forbids a clock that **blocks**; nothing here blocks — every change is still recorded at any time and the save button stays enabled in every case. The condition governs **whether a sentence is displayed**. ⚠️ **Without it, a change 45 days out renders `⚠ שינוי 1,080 שעות לפני האירוע` telling her to phone a hostess — false, on a screen Ishay approved.**
⚠️ **"3 business days" needs a real implementation, not `days > 3`** — `weekdayOf` lands in `src/lib/dates.js` at step 2.4 and Friday/Saturday are the weekend here. **Test it across a Wednesday→Sunday boundary**, which is where a naive subtraction is wrong by two.
**The tier-crossing notice** (③ↄ), shown only when the new total crosses into a cheaper catalogue tier: *"420 יחידות נכנסות בקטלוג למדרגת מחיר זולה יותר. התוספת מחויבת לפי המחיר שאושר בהצעה — לא לפי מחיר הקטלוג של היום."* 🚫 **No ₪ figure in that string.**
**🔻🤖 Verify:** `npm run test:run` green, and the mockup's worked example reproduces exactly: 6→8 hostesses at `500.00 ₪` and 300→380 tags at `5.00 ₪` ⇒ `סכום השינוי = 1,400.00 ₪` ⇒ `−210.00 ₪` (15%) ⇒ `1,190.00 ₪` ⇒ `214.20 ₪` (18%) ⇒ **`1,404.20 ₪`**. A chaining implementation misses this.
**מה ייחשב עובד** *(`processes-approved.md` ①–④ + ⑯, quoted)*
1. ③: *"התוספת יורשת את תנאי ההצעה המקורית (ההנחה שניתנה)"* — and `screens-approved §⑥`: *"השפעה על ההכנסה = הכמות שהשתנתה **כפול המחיר הקפוא של ההצעה** — **לא** כפול מחיר הקטלוג של היום."*
2. ④: *"לא מורידים את הרווח בשינוי-תכולה כ'מחווה של רצון טוב'."*
3. ⑯: *"המערכת מתעדת כל שינוי, בכל זמן, עד רגע סגירת האירוע — ולעולם אינה חוסמת לפי שעון. מה שהיא כן עושה: מסמנת שהשינוי מאוחר."* And: *"🚫 אין סף-זמן במערכת. לא `T-36` ולא אחר."*
4. `spec.md` §3.1①: *"מימוש שמשרשר הנחות (`6,300 × 0.95 × 0.90 = 5,386.50`) ייתן מספר אחר ב-`31.50 ₪` — פער קטן מספיק כדי לעבור בקריאה, וגדול מספיק לשבור דוח."*
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 2.3 · `src/lib/projectClosing.js` — attendance vocabulary, per-hostess cost, closing validation**
**Files:** `src/lib/projectClosing.js` (new) · `src/lib/projectClosing.test.js` (new)
**What to do:**
- `ATTENDANCE_OPTIONS` — the seven flat options in mockup order, each mapping to the three-column tuple of `spec.md` §1.4: `הגיעה` → `('arrived', null, null)` · `איחרה — קל` → `('late','light',null)` · `איחרה — בינוני` → `('late','medium',null)` · `איחרה — רב` → `('late','heavy',null)` · `לא הגיעה — חולה` → `('no_show',null,'sick')` · `לא הגיעה — אישור מראש` → `('no_show',null,'approved_absence')` · `לא הגיעה — הבריזה` → `('no_show',null,'ghosted')`.
- `QUALITY_MARKS` — display label → DB value: `מצוינת` → `'מצוינת'` · `בסדר` → `'בסדר'` · **`לא לשלוח שוב` → `'לא_לשלוח'`** 🔴 **underscore, and without the word "שוב"** (`schema.sql:883`). A code path sending `not_send` or `לא לשלוח` is rejected by the CHECK.
- `hostessActualCost(actualHours, hourlyRateSnapshot)` — 🔴 **`hourly_rate_snapshot` from `assignments`, never `hostesses.hourly_rate` of today.**
- `closingValidationSummary(draft)` — returns the single blocking sentence: *"לא ניתן לסגור: חסרים 2 סימוני-איכות ודוח-סיכום."*
- `defaultHoursForRow(eventHours, wasManuallyOverridden)` — ט4-ב: derived from the event hours, overridable per row, **and a row that was typed into is detached from the default permanently** (until page refresh).
- A no-show row: **hours forced to `0` and the field disabled**; the quality field **disabled, not empty** (ט4-א).
🚫 **No profit function, no `finalGrossProfit`, no bonus, no travel** (AR-6 · ㉟ · **R-2**). *(Cited `B14` until 14/08 — an id with no §3.5 row; it is now Ishay's ruling `לא קורה`, R-2.)*
**🔻🤖 Verify:** `npm run test:run` green, and `spec.md` §3.3's table reproduces **exactly**: `273.00` + `253.00` + `286.00` + `273.00` + `0.00` = **`1,085.00 ₪`**, with Keren's row at `0` hours because she is `no_show`.
**מה ייחשב עובד** *(`spec.md` §3.3 + `processes-approved` §🏁3/ט4, quoted)*
1. §3.3: *"ושורת קרן מוכיחה שלושה דברים במסך אחד: ① שדה-האיכות שלה **מושבת ולא ריק** · ② שעותיה **מתאפסות ל-`0` ומושבתות** · ③ האירוע רץ עם **4 מתוך 5** ⇒ 'מוכן לביצוע' אינו ערובה."*
2. §🏁3: *"והסימון התלת-מצבי הוא חובה, לא רשות — הכרעת-ישי 29/07/2026: 'אחרי אירוע גרוע אני כותבת שורה, אחרי אירוע טוב אני שוכחת לתעד' ⇒ סימון וולונטרי אוסף רק דאטה שלילית."*
3. §🏁2 / §② of the closing card: *"'הגיעה?' היא **עובדה** ⇒ ציון… 'הייתה טובה?' היא **שיפוט** ⇒ סינון ונעיצה. 🚫 אסור שאחת תיבנה בלי השנייה, ואסור למזג אותן לשדה אחד."*
4. §1.5: *"התווית על המסך אינה הערך במסד"* — `לא לשלוח שוב` on screen, **`לא_לשלוח`** in the DB.
5. ט4-ב, as sharpened 13/08: *"מ6 **מזין** את השעות; **גזירת התשלום מהן היא `§7.19`, שעדיין פתוח ושייך למ8**."*
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 2.4 · `weekdayOf` moves into `src/lib/dates.js`** ⚠️ shared-surface *(`src/lib/dates.js`)*
**Files:** `src/lib/dates.js` · `src/lib/dates.test.js`
**What to do:** add one exported `weekdayOf(isoDate)` returning the Hebrew weekday used in surface 2's `שבת · בעוד 9 ימים` sub-line.
🔴 **A Hebrew weekday array already exists in production at `src/lib/shiftInvite.js:117` — the forms differ, so the temptation is to copy it. This project has already paid twice for two functions with one name.** Export **one** function from `dates.js` and have `shiftInvite.js` import it, or leave `shiftInvite.js` alone and document why — **but do not create a second array.**
🔴 **Must use `Date.UTC(y, m-1, d)`.** A local `new Date(iso)` shifts the day into Asia/Jerusalem **for a subset of dates only** — the worst kind of bug, because it passes most tests.
**Grep before editing:** `grep -rn "dates.js" docs/micro_guides/` — if another open guide declares this file, stop and reconcile.
**🔻🤖 Verify:** `npm run test:run` green with a test that walks a full week **and** crosses a DST boundary; `22/08/2026` returns `שבת`.
**מה ייחשב עובד** *(S-19's anchors, quoted)*
1. `src/CLAUDE.md`'s shared-logic rule: one home per function, and a duplicate name is the failure this project already had twice.
2. The mockup renders `שבת · בעוד 9 ימים` under the date — the weekday is *half the information* in an events company.
3. `dates.js:61-66` already returns `22:00–02:00` with no ordering check ⇒ **cross-midnight informs, never blocks** (S-17).
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 2.5 · `src/modules/06_projects/api.js`**
> 📜 **BINDS TO THE PAYLOAD CONTRACTS in step 1.8** — the `p_lines` / `p_rows` field lists. 🚫 **Do not invent a field, rename one, or omit `serial_number` / `assignment_number`.** **Those two are the third part of a three-column primary key**, and dropping either writes the WRONG row **without raising anything.** ⚠️ **If this step needs a field the contract does not have, the contract changes FIRST — in 1.8 — and every other consumer gets an `↳ as-built` note in the same session.**

**Files:** `src/modules/06_projects/api.js` (new)
**What to do:** every read and every RPC call for the module. **Import from `@/supabaseClient`** — ⚠️ **not `@/lib/supabaseClient`**, which does not exist.
- `listProjectsOverview()` → `supabase.rpc('list_projects_overview')` (AR-3). 🚫 **No browser-side join across `projects` + `assignments` + `logistics`.**
- `getProject(projectId)` — identity area. 🔴 **`event_name` and `customer_name` are read from `projects` as snapshots** (`schema.sql:502`, `:799`), **never joined to `customers`** — the recruitment manager is blocked on `'לקוחות'` and the join would return `null` **without an error** on three approved screens.
- `getProjectLogistics(projectId)` · `getProjectChanges(projectId)` · **`getProjectAssignments(projectId)` — 🔴 selects `hostesses.full_name` and `hostesses.hostess_id`.** 🚫 **NOT `first_name`/`last_name`**: `screens-approved.md:1270` (surface 5 §③) names those two columns and **neither exists anywhere in the schema** — `full_name text not null` is `docs/schema.sql:145`, and the PK moved to `hostess_id` (`:746-747`, `id_number` dropped). `spec.md` §1.7 already has it right. *(§10 verification #8.)*
- One wrapper per RPC.
🔴 **Every write path calls `.select()` and asserts the row count**, throwing a synthetic `RLS_DENIED` on zero — the `02_customers/api.js` pattern (AS-6). Without it a blocked write returns `{data:null, error:null}` and the button says "נשמר" having changed nothing. **No lint rule enforces this.**
🔴 **Every read distinguishes three outcomes: rows · zero rows · could-not-read.** For `logistics` this is not cosmetic — *"רשימת-לוגיסטיקה ריקה **אינה נראית כשגיאה, היא נראית כ-100% מוכן**, כי 'אפס שורות ⇒ הושלם'"* (`spec.md` §"מה ייחשב עובד" #8).
**Server-error mapping:** extend **`SERVER_CONSTRAINT_RULES`** (`src/lib/hostesses.js:603-613`), which keys on the **index/constraint name**. 🚫 **Not `SERVER_MESSAGE_RULES`** (`quotes.js:334`), which keys on message prefixes and is the wrong tool for a constraint violation — `spec.md:301` and `screens-approved:550` both point at the wrong one (AR-10).
**🔻🤖 Verify:** `npm run test:run` green. Then, in the live preview signed in as **מנהלת לוגיסטיקה** (`E2E_STAFF_*`), the overview loads with real logistics numbers and `הכנסה מתוכננת` renders **`—`, not `0.00 ₪`** — screenshot both. Then as **מנהלת גיוס**, the logistics tab shows the *"לא ניתן לטעון"* error state, **not** *"לא הוזמנו מוצרים"*.
**מה ייחשב עובד** *(`spec.md` §"מה ייחשב עובד" #8 + §12⑧, quoted)*
1. #8: *"מסך שלא הצליח לטעון אומר זאת. לעולם לא רשימה ריקה בשקט."*
2. §12⑧: *"‏`event_name` · `customer_id` · `final_start_time`/`final_end_time` · `lat`/`lng` · `customer_name` · `owner_name`/`owner_phone` — **כולם בו**, שורות 502 · 503 · 504-505 · 797-798 · 799 · 1037-1038, כ-`ALTER` שיושבים **אחרי** בלוק ה-`CREATE TABLE`."*
3. `04_hostesses/api.js:128-130`, the same decision already taken once: *"שם-הלקוח נלקח מ-`projects.customer_name` ולא בצירוף ל-`customers` — מנהלת הגיוס **חסומה** על מודול 'לקוחות', והצירוף היה מחזיר `null` **בלי שגיאה** בשלושה מסכים מאושרים."*
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 2.6 · `OPEN_PROJECT_STATUSES` — widen and move to the shared home** ⚠️ shared-surface *(`src/modules/04_hostesses/api.js`)*
**Files:** `src/modules/04_hostesses/api.js` · `src/lib/projects.js`
**What to do:** delete the local constant at `api.js:54-56` and import `ACTIVE_PROJECT_STATUSES` from `src/lib/projects.js` (⑫ — M6 owns the definition, everyone imports it). The query at `:141` becomes `.in('project_status', ACTIVE_PROJECT_STATUSES)`.
🔴 **This is a behaviour fix, not a cleanup.** After it, a `ready` event where a hostess cancelled **appears** on the recruitment manager's screen; today it vanishes. **That is the desired outcome.**
⚠️ **And a contradiction you must carry, not resolve silently:** the code comment at `api.js:54-55` says `ready` is excluded **deliberately** (*"פרויקט שאוייש יצא מרשימת-העבודה של מנהלת הגיוס"*). ⑫ and `db_roadmap M6-14` overrule it. 🔴 **Delete the stale comment and write the new reason in its place** — leaving it would make the next reader think the change was a mistake. **Record the overrule in §10.**
🔴 **And `cancelled` is the other half:** once M6 starts writing `cancelled`, an event disappears from the recruitment manager's screen **while its assignments remain `finally_approved`** (`🚧 מ6 ← מ4`, open). Surface the cancelled project rather than hiding it, or state in §10 why not.
**Grep before editing:** `grep -rn "OPEN_PROJECT_STATUSES" src/ docs/micro_guides/`.
**🔻🤖 Verify:** `npm run test:run` → green, **and the M4 test count does not drop**. Then, in the live preview as `E2E_RECRUIT_*`, a project on `ready` appears in M4's overview where it did not before — screenshot before and after.
**מה ייחשב עובד** *(`spec.md` §12⑪, quoted)*
1. *"‏`OPEN_PROJECT_STATUSES` הוא תיקון-התנהגות, לא ניקיון… לפי ⑫ זה שגוי: פרויקט ב-`ready` אינו 'פתוח' ⇒ **הוא נעלם ממסך מנהלת הגיוס**, ואם דיילת תבטל באירוע 'מוכן' שמתקיים מחר — **היא לא תראה זאת**."*
2. *"ואחרי התיקון מ4 יציג פרויקטים שהוא לא הציג קודם — **זה הרצוי**."*
3. *"ואותו תיקון חייב לכלול את `cancelled`: ברגע שמ6 יכתוב `cancelled`, האירוע ייעלם ממסך מנהלת הגיוס בעוד השיבוצים נשארים `finally_approved`."*
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 2.7 · Align `smartMatch.js` to the real attendance column names** ⚠️ shared-surface *(`src/lib/smartMatch.js`)*
**Files:** `src/lib/smartMatch.js` · `src/lib/smartMatch.test.js` · 🔴 **`src/lib/smartMatchCandidates.js`** *(the file this step used to omit entirely)*
🔴 **The file lives at `src/lib/smartMatch.js`. `spec.md:527` gives a path under `src/modules/04_hostesses/` — that path is wrong.**
**What to do (AR-7's three measured problems, each needing its own fix):**
1. `smartMatch.js:43-52` keys on **Hebrew in a single `outcome` field**; the DB now has **three English columns**. Rewrite the mapping to read `(attendance_status, lateness_level, no_show_reason)`.
2. 🔴 **The seventh value is not an attendance value at all** — `WITHDREW` maps to `approval_withdrawn`, which is an **`assignment_status`**, not one of the seven attendance options. **A hostess who cancelled after approval is not on the closing list at all**, so her `0.5` must be sourced from `assignment_status`, on a separate branch.
3. Derive the two booleans `projectCancelled` (from `projects.project_status = 'cancelled'`) and `eventPassed` (from `final_event_date < today`).
4. ⚠️ **Silent-failure risk: `smartMatch.js:207` is `if (value === undefined) continue`** — a mis-mapped value **drops the row silently** instead of throwing. **Add a test that feeds an unknown combination and asserts it throws or is counted**, not skipped.
5. 🔴 **`src/lib/smartMatchCandidates.js:81` hard-codes `attendance: []`** — with its own comment saying so (`:79-80`: *"🚧 מ6 — סימוני-הנוכחות נוצרים בסגירת האירוע ואינם קיימים היום"*). **Wire it to the real rows M6 now writes.** ⚠️ **The failure if you skip it is the module's quietest:** the code stays green, every test passes, and the moment M9 flips `מרכיב_אמינות_פעיל` **every hostess returns "no data"** — a uniform blank, not an error. **The file appeared ZERO times in this guide until 14/08.**
🔴 **📏 The numbers that must not move — and "seven" is wrong, so do not write it (AR-7).** `ATTENDANCE_OUTCOMES` (`:43-52`) has **EIGHT** members; `ATTENDANCE_VALUES` (`:56-63`) has **SIX** scored entries — `SICK` and `EXCUSED` are deliberately unscored (`:54-55`). **The six values are frozen. The mapping around them is what changes.** ⚠️ **`ATTENDANCE_VALUES` is `const` and NOT exported** — a test cannot import it; assert through the scoring function.
🚫 **Do not flip `מרכיב_אמינות_פעיל` to `true`.** That is a params change owned by M9 (`🚧 מ9 ← מ4`, `PROJECT_MASTER:465`), and `reliabilityScore` is already called in every ranking with weight 0.
**Grep before editing:** `grep -rn "smartMatch" docs/micro_guides/`.

**🔻🤖 Verify — and read this before running it, because the old wording was impossible to satisfy:**
> 🔴 **This step CHANGES the record contract** (`outcome` → three columns), so `smartMatch.test.js`'s existing fixtures are written against the **old** shape and **cannot** all pass unchanged. The previous instruction demanded exactly that, and a build session obeying it literally would either revert the step or fake the pass. ⇒ **the correct split:**
> **(a) MUST NOT MOVE — the six `ATTENDANCE_VALUES` numbers.** The nine existing assertions that depend on them (`smartMatch.test.js:241-270`, via `ATTENDANCE_OUTCOMES`) keep asserting the same *scores*, and their expectations are **not** to be edited.
> **(b) MUST BE REWRITTEN — the fixtures that build a record.** Migrating a fixture from `{outcome: 'איחור_בינוני'}` to `{attendance_status:'late', lateness_level:'medium'}` is the step's whole purpose, and rewriting it is **not** a regression.
> **(c) MUST BE ADDED — the unknown-shape test.** Feed a combination that maps to nothing and assert it is **reported**, not skipped. 🔴 **Without it the guard is untestable**, because `:207`'s `if (value === undefined) continue` swallows it: `count` never increments, the score comes out of the remaining rows, and **the number looks plausible.**
> **(d) NOTE, not a task:** `EXCUSED` is referenced by **zero** existing tests. M6 does not owe that coverage, but say so rather than letting the closing audit rediscover it.

`npm run test:run` → green, count **strictly greater than 752**. `smartMatchCandidates` returns a **non-empty** `attendance` array for a hostess with closed assignments — **assert non-empty explicitly; `[]` is the bug this step exists to kill.**
**מה ייחשב עובד** *(`spec.md` §12⑤, quoted)*
1. *"בלשון הקוד: 'שמות שדות-הרשומה (`outcome`/`projectCancelled`/`eventPassed`) הם **הנחה שלי** — **מ6 הוא שיקבע את שמות-העמודות בפועל**'. ⇒ שם שונה ⇒ `reliabilityScore` תקבל `undefined` ותחזיר ציון שגוי, **בשקט**."*
2. *"⇒ פריט-ביצוע מפורש: אחרי המיגרציה, ליישר את `smartMatch.js`."*
3. *"וההדלקה עצמה היא שינוי-פרמטר ולא שינוי-קוד: `מרכיב_אמינות_פעיל = false` ב-`params`, ו-`reliabilityScore` כבר נקראת בכל דירוג עם משקל 0."*
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 2.8 · Mail builders — cancellation and details-changed** ⚠️ shared-surface *(`src/lib/shiftEmails.js`)*
**Files:** `src/lib/shiftEmails.js` (extend) · `src/lib/shiftEmails.test.js`
**What to do:** two builders, following the existing `SHIFT_TEMPLATE_NAMES` shape with **byte-identical** param names.
- **Cancellation:** template `תבנית_מייל_אירוע_בוטל`, 3 placeholders, subject `` `ביטול האירוע — ${event_name}` ``, `entityType: 'project'`, `requireAttachment: false`. 🔴 **Does NOT call `resolveShiftContact`** — that function returns `null` when name *or* phone is missing and the caller must then refuse to send, and this mail must reach every hostess even when `projects.owner_phone` is null.
- **Details changed:** template `תבנית_מייל_פרטי_האירוע_השתנו`, **8 placeholders identical to `תבנית_אישור_סופי_שיבוץ`** ⇒ **reuse `resolveShiftContact` unchanged**, subject `` `עדכון פרטי האירוע — ${event_name}` ``, `entityType: 'project'`, `requireAttachment: false`.
- **Summary report to the customer:** `entityType: 'project_report'`, `requireAttachment: true` (AR-8). 🔴 **Download the file and attach it — do not embed a signed link** (§12⑬(ג)): an expired link at the customer's end looks like a fault.
🔴 **The Hebrew body of an outgoing mail does not inherit `<html dir="rtl">`** — every Hebrew artefact that leaves the app (mail · PDF · file · print) runs its own direction pass (`src/CLAUDE.md`).
**✅ The attachment-ceiling conflict is RESOLVED and this step changes nothing for it.** `MAX_ATTACHMENT_BASE64_CHARS = 4_000_000` (`src/lib/email.js:29`) stays exactly as it is — **the hard binary wall is 3,000,000 bytes**, and the fix went the other way: **the `reports` bucket is capped at 2 MiB and the screen now promises `עד 2MB`** (step 1.5 · step 3.5 · AS-3, ruled 14/08/2026). 🚫 **Do not raise `MAX_ATTACHMENT_BASE64_CHARS`** — `:26-28` explains it sits deliberately below Make's 5MB free-tier limit, and raising it moves a limit this project does not control.
**🔻🤖 Verify:** `npm run test:run` green; a builder test asserts every placeholder in each template body is supplied and that **no unfilled `[…]` token survives** in the rendered output. `grep -rn "resolveShiftContact" src/lib/shiftEmails.js` shows the cancellation builder does **not** call it.
**מה ייחשב עובד** *(`db_roadmap` M6-12's copy decisions, quoted)*
1. *"אין placeholders של איש-קשר במייל-הביטול, **במכוון** — `resolveShiftContact` מחזיר `null` כששם *או* טלפון חסר, **והקורא חייב אז לסרב לשלוח**."*
2. *"`בוטל` בלי ייחוס — סיבת-הביטול יכולה להיות לקוח/כוח-עליון/אחר… ⇒ 'בוטל על ידי הלקוח' היה **שקר** בכוח-עליון."*
3. *"‏`אין צורך להגיע` נושאת כסף בישראל — לפי צו-ההרחבה לאולמות אירועים, עובדת ש**הגיעה** ולא עבדה זכאית לחצי יום; מי שעודכנה בזמן — לא."*
4. *"⚠️ הטריגר צר ממה שהוא נקרא: שינוי **תאריך** אינו שולח את המייל השני — ㉑ מאפס אישורים ומזמין מחדש. רק **מיקום (㉒) ושעות (㉝)** שולחים עדכון בעוד האישור שלה עומד."*
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 2.9 · 🔻👤 Phase-2 gate**
**🔻👤 Verify:** `npm run test:run` → exit 0, count strictly greater than **752**, zero failures, 26+ files. `npm run lint` → 0 errors. And the three hand-computed anchors from `spec.md` §3 reproduce **exactly**:
| Anchor | Expected | Source |
|---|--:|---|
| `הכנסה מתוכננת` for `#8` | **`5,355.00 ₪`** | §3.1 |
| Total to customer for `#8` | **`6,318.90 ₪`** | §3.1 |
| Staffing metric `#8` / `#11` | **`1/6`** / **`0/1`** | §3.2 |
| Closing labour cost for `#102` | **`1,085.00 ₪`** | §3.3 |
🔴 **Do not recompute the expectations — they come from the spec so the test cannot compare the code to itself** (`spec.md` §3's own framing).
🚫 **And do not build a regression test on a "gap" between catalogue and frozen price for quote `#6` — there is none, and it would fail forever** (§3.1, corrected 14/08).
**מה ייחשב עובד** *(`spec.md` §"מה ייחשב עובד" #9, quoted)*
1. *"החישוב הידני שבאפיון תואם את מה שהקוד מחשב — `5,355.00 ₪` · `6,318.90 ₪` · `1/6` · `0/1` · `1,085.00 ₪`."*
**🌊 אדוות —**
**🗣️ אושר —**

---

### Phase 3 — UI

**Phase gate (§9h):** 🟢 **A9 · B7 · B13 · E3 are ALL RULED (14/08/2026) — do NOT carry them to Ishay.** *(See the RULED block at the head of §3.5. Whoever rules an item updates the §3.5 row AND every door that sweeps for it — this line was left stale once already.)* **The door still sweeps §3.5 for anything newly opened.** *(Changed 14/08: **B1** and **B14** are closed by Ishay's two reality rulings R-1 and R-2 and were removed from §3.5; **B7** was cited by step 3.5 while having no row at all and now has one.)*

🔴 **The eight mockups are APPROVED.** ⇒ **appearance** — layout · order · colour · label wording · emphasis — **is built as drawn, and is not re-presented for approval.** **Behaviour, data and settings** follow the spec even against the drawing. Neither ⇒ stop and ask Ishay.
🔴 **Every Hebrew string comes from the approved card or mockup verbatim.** The vocabulary is locked (`spec.md` §1.8) and a paraphrase is a bug.
🔴 **Design tokens are measured from the approved mockups, in `oklch`-derived sRGB, NOT Tailwind-3 hexes.** `--primary: #0D9488` · sidebar `240px` on the **right** (`right:0` + `border-left`) · topbar `64px` · radii from `--radius: 0.625rem`. ⚠️ **The teal lives in two places** — `--primary` in `index.css` and hard-coded `bg-teal-600` in many read sites; **`.btn.primary` uses `--primary`, and the brand one wins.**

---

**Step 3.0 · 🔧 Shared-component checkpoint** ⚠️ shared-surface *(`src/components/**`)*
**Files — 🔴 named, not "whatever it produces". This step is the OWNER of every shared-component edit in module 6, and until 14/08 no step owned any of them:**
`src/components/StatusTag.jsx` · `src/components/StatTile.jsx` · `src/components/Money.jsx` · **`src/components/Ltr.jsx` (new)** · **`src/components/PermissionAwareEmpty.jsx` (new)** · `src/components/LoadingOrError.jsx` · plus the read-only sweep of all 8 cards + all 8 mockups.

**🔴 The six shared-surface edits this step owns — each with one home and one enforcing test:**

| # | Edit | Shape | Its test |
|:-:|---|---|---|
| **α** | `StatusTag.jsx` — **project statuses** | 🔴 **`...PROJECT_STATUS_TONES` spread in from `src/lib/projects.js`. 🚫 Never retype the eight Hebrew labels here** — a retyped label that differs by one character is invisible (`:50` falls to `TONES.muted`, byte-identical to `ממתינה למענה`) | step 2.1 guard ① — the unmapped-label RED case |
| **β** | `StatTile.jsx:29` — add `items-start` | Align to the approved mockup's `.cell, .tile{align-items:flex-start}` (`02_project_card_approved.html:227`). 🔴 **Measure `getBoundingClientRect().left` of label vs value on a live module-2 tile BEFORE and AFTER, and record both numbers** — see S-25: the mockup's browser measurement is real, but that the React component splits **is not established from the code**, and this step settles it rather than assuming it | the two recorded measurements, in the step |
| **γ** | `Ltr.jsx` — **new** | Extract the `dir="ltr"` + `inline-block [unicode-bidi:isolate]` pair from `Money.jsx:23-24`; re-consume it in `Money` **and** in `RatingStars.jsx:78-79`, which is a **second live copy of the same two attributes**. 🔑 **Why a component and not the scanner:** `check:bidi` fires only on a digit touching `₪ ★ ×` ⇒ **`1/6`, `0/2` and `חסרות 5` pass green**, and those are most of what M6 renders | a unit test asserting `<Ltr>` emits both attributes together — the `Money`/`LtrFieldGroup` principle: one component emits all the parts, so deviation is not expressible |
| **δ** | `PermissionAwareEmpty.jsx` — **new** | **The three states in one component: `empty` · `noPermission` · `error`.** 🔴 **The denied counter renders `—`, never `0`.** See S-26 for why two states are literally unimplementable here | a unit test per state, and a test asserting the denied count renders `—` |
| **ε** | `LoadingOrError.jsx` — feminine retry | 🔴 **`נסה שוב` is HARD-CODED at `:132`, not a default — there is no prop to override.** ⇒ **add an optional `retryLabel` prop whose default is the existing `נסה שוב`** (additive, zero behaviour change for the four existing callers) and have M6 pass `נסי שוב`. 🚫 **Do not change the hard-coded string itself** — that is the cross-system sweep, `🚧 מ12` | a test asserting the default is unchanged **and** that a passed label wins |
| **ζ** | Shift-lead badge | `StatusTag` with `tone="outline"`. 🚫 **No ★** — `RatingStars.jsx:82` renders `{rating} ★` and the glyph already means "rating" *(the project's word for it is **התרשמות**, not דירוג — `RatingStars.jsx:10-11`)* | covered by α's map test |

🔴 **All six are `⚠️ shared-surface`: grep every other open micro-guide for each file before editing, and shape each change additively.**

**🔴 And one standing rule this step publishes for every surface step that follows — `_design-contract.md` DOES NOT EXIST.**
> 📏 **Measured `14/08/2026`: `Glob "**/*design-contract*"` over the whole repo returns nothing.** `screens-approved.md` nonetheless leans on it — **twice by filename** (`:1151` `_design-contract §3.2` · `:1552` `_design-contract.md §5.8`), **seven more times by its Hebrew name `חוזה-העיצוב`** (`:259`, `:315`, `:896`, `:1696`, `:1697`, `:2188`, `:2286`), **and — the dangerous class — as bare `§N.M` references with no filename at all** (e.g. `:1142`'s `§3.4③`), which a build session reads as a section of the document it is already holding.
> ⇒ **The rule, applied by steps 3.1–3.8:** **a card justification that resolves to the design contract — by filename, by Hebrew name, or as a bare `§N.M` matching no section of `screens-approved.md` itself — is UNSOURCED.** **Fall back to the approved mockup for APPEARANCE, or to a measured `src/` precedent for BEHAVIOUR.** 🚫 **Never invent the missing section's content, and never let it settle a question on its own authority.**
> ✅ **The correct handling already exists in the spec, twice — copy it:** surface 6 contradicts the contract on **measured** grounds (`520px → 768px` because `QuoteDocumentDialog.jsx:306` and `HostessViewCard.jsx:92` are both `sm:max-w-3xl`; amber banner → white block) **and reports the contradiction itself** rather than quietly obeying or quietly ignoring.
> *(By `docs/CLAUDE.md`'s placement rule — *"אין מסלול-טעינה ⇒ הוא לא ייקרא"* — these citations were dead on arrival. `STATUS.md:73` and `CLAUDE_CODE_LOG.md:99` already record the gap as known and deliberately unfixed, so this is not a new discovery — it is the first time it has been written where a builder stands.)*

**Then the ordinary checkpoint sweep:**
**What to do:** list every element that repeats across surfaces and rule shared-vs-local per item. **Default: appears in 3+ surfaces ⇒ shared, in `src/components/`.** ⚠️ **Check `src/components/` first — most of this exists, and the finding is usually "reuse this", not "build a new one":**

| Existing component | How M6 uses it | The mine |
|---|---|---|
| **`StatusTag`** | 8 project statuses + 6 assignment statuses + 3 logistics statuses | 🔴 **Key is the displayed Hebrew label; a miss falls to `muted` silently** (`:50`). 📏 **Counted 14/08: `TONE_BY_LABEL` holds exactly TEN entries — 2 hostess states + 6 assignment statuses + 2 derived (`פג תוקף`, `הושלם`) — and ZERO project statuses.** M6 adds 8 ⇒ 18. ⚠️ **Five of the ten keys are unquoted, so a grep for `'…':` undercounts by five** |
| **`StatTile`** | 2 tiles on surface 1 · 2 on surface 2 · 3 on surface 3 · 3 on surface 4 · 2 new on surface 8 | 🔴 **A numeric `value` is auto-routed through `Money`** (`StatTile.jsx:37`) ⇒ **`value={4}` renders `"4 ₪"`.** `מספר אירועים` **must be passed as a string.** Wrapper is `flex flex-wrap`, **never a full-width `grid`** (Ishay 08/08) |
| **`Money`** | the only way to render `₪` | — |
| **`LoadingOrError`** | every surface; `skeleton={{variant:'table'\|'cards'\|'card'\|'fields'\|'page'}}` | **The only shared skeleton in the project.** Tiles and tabs get their own skeleton — an empty counter is worse than a loading one |
| **`LtrFieldGroup`** | every label+LTR-value pair | 🔴 **Emits label and value from ONE array** — this is the bug that happened **three times**. `.cell`/`.tile` are `flex-direction: column`, so children get blockified, `.ltr` loses `inline-block`, stretches full width and left-aligns away from its label. **The mockups fix it with `align-items: flex-start`, and the bug is in the shared skeleton ⇒ it touches all eight** |
| **`FilterPill`** | 9 status pills on surface 1 | **Light** teal for selected; solid teal is reserved for a primary action. A 0-pill stays, dimmed, with `title="אין כרגע פרויקט בסטטוס הזה"` |
| **`ConfirmDialog`** / `useConfirm()` | — | Single provider in `App.jsx` |
| **`RowAction`** | row-level icon buttons | 30px square; `title` is both `aria-label` and an **E2E contract**. 🔴 **Its `border-red-200 bg-red-50 text-red-600` is the only "negative action" pattern in `src/`** — surface 7's `בטל את הפרויקט` uses that shape, **red outline, never solid red fill** |
| **`ChipToggle`** | the three quality marks | The mockup calls them `.qp`; check whether `ChipToggle` already fits before building `.qual` |

**Candidates M6 might genuinely need:**
- **`ReadinessMetric`** — the `N/M` + sub-line pair appearing on surfaces 1, 2, 3, 4. **4 surfaces ⇒ shared.**
- **`ProjectIdentityStrip`** — the compact identity row drawn on surfaces 3, 4, 5. **3 surfaces ⇒ shared**, and 🔴 **surface 2 owns it** — the others render it as context, deliberately **without** the card's primary action button.
- **`AttendanceSelect`** and the quality pills — surface 5 only ⇒ **local**.
🚫 **Do not plan functions this way** — business logic already has one home (`src/lib` SSOT).
**🔻👤 Verify:** the ruling table above, filled in, presented to Ishay with the count of surfaces per item. **A per-item ruling, not a blanket.**
**מה ייחשב עובד** *(`module-blueprint/template.md`, quoted)*
1. *"premature abstraction designs a component with **no known uses**; here **every use is already written and approved before a line of code exists**, so this is counting, not predicting."*
2. *"‏`StatTile`… the correct shape — label above value — was only visible by comparing two real implementations."*
3. `src/CLAUDE.md`: `⛔ npx shadcn add` overwrites the hand-RTL'd primitives back to LTR **with no error and no failing test**.
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 3.1 · Surface 1 — projects overview**
**Files:** `src/modules/06_projects/ProjectsPage.jsx` · mockup `01_overview_approved.html` · card `screens-approved.md:69-374`
**What to do:** a **pure read screen — zero writes, zero dialogs, zero emails.**
- **Header:** `<h1>פרויקטים</h1>` **alone. No primary button** (S-5) — a project is born only from quote approval, so `+ פרויקט חדש` would promise an action that does not exist.
- **Two tiles, in order:** `אירועים שחסרות בהם דיילות` (sub `מתוכם 1 שלא נשלח בו אף זימון`) · `אירועים שהלוגיסטיקה בהם טרם מוכנה` (sub `4 פריטים, אף אחד לא הוזמן`). **Both count ⑫'s active list and do NOT change between tabs.** 🚫 **Never merged into one percentage** (⑨).
- **Three tabs with counters, in order:** `בעבודה` · `לסגירה` · `הכול`. **The counter stays visible at `0`** (⑦).
- **Nine status filter pills — in the `הכול` tab only**, in the order the mockup draws them: `הכול` · `טרם החל` · `בתהליך` · `מוכן לביצוע` · `ממתין לסגירה` · `ממתין לחשבונית` · `ממתין לתשלום` · `פרויקט הסתיים` · `בוטל`.
- **Sort line, text only:** `ממוין: חסרים תחילה, ובתוכם לפי קרבת האירוע`. **Column headers are not sortable** — the order *is* the screen's answer (⑧).
  - 🔴 **`mockup-data.md` contradicts itself on this exact ordering, and step 3.1 is where it gets settled** *(it used to be recorded in §10 with no owning step)*: `:164` says verbatim *"🚫 אל תשים אותו בראש רשימה — הוא ייראה כמו באג-עיצוב"* while **`:293-294` numbers the same two rows in the opposite order.** **S-7 rules the behaviour** — event proximity for a past date is **absolute distance both ways** — ⇒ **build S-7, and fix `mockup-data.md`'s numbering to match in the same step.** *(That file is `docs/specs/`, which is living, not frozen — editing it is allowed. 🚫 The approved **mockups** are not: `docs/mockups/**/approved/*.html` carries no hook protection, so an edit there succeeds silently — do not make one.)*
- 🔴 **The no-location-column deviation gets a code comment, in this step** *(it used to be a §10 line saying "this sentence must appear in the code comment", with no step to put it in)*: the overview has **no location column** while module 4's *built* overview has one (`OverviewTab.jsx:225,301`). **Write the reconciling sentence into `ProjectsPage.jsx` as a why-first comment:** in M4 location **is** a ranking input (0.25 of the score); in M6 it has no consumer that separates projects. **Without it the first engineer to open both screens reads the absence as an oversight** (S-8).
- **Columns — `בעבודה` and `הכול` (7):** `אירוע` · `מתי` · `דיילות` · `לוגיסטיקה` · `מצב` · `מה חסר` · blank. **`לסגירה` (6): the `לוגיסטיקה` column drops out.**
- **Row link:** `לכרטיס →`, and in the `לסגירה` tab `לסגירה →`.
- **Tab state in `useSearchParams`, not `useState`** (S-18) — ⚠️ **and swapping a setter for the URL silently breaks every `setX(v => …)`**; it happened in `CustomersPage` on 30/07.
- **Every non-pure-Hebrew value wrapped in `.ltr`** — dates, ratios, every counter. ⚠️ **`.ltr` wraps the digit, not the row**: as a flex child it becomes block and left-aligns the number away from its label. ⚠️ **And `check:bidi` does not catch a digit after a Hebrew word** ⇒ a missing `.ltr` on a counter **passes green** (S-11).
- **Five states, and two of them must never be merged:**
  - **Loading** — `LoadingOrError` `variant:'table'`; tiles and tabs get their own skeleton.
  - **Truly empty** — *"עדיין אין פרויקטים במערכת."* / *"פרויקט נוצר מעצמו ברגע שהצעת מחיר מאושרת — אין כאן יצירה ידנית."* + `למסך הצעות מחיר →`.
  - **Empty after filter** — *"אין פרויקט התואם למסנן שבחרת."* / *"8 פרויקטים קיימים ואינם מוצגים כרגע."* + `נקה סינון`. 🔴 **The right action is opposite in each; merging them is a bug.**
  - **Empty tab** — phrased positively, e.g. *"אין אירוע שממתין לסגירה"*, **counter shows `0` and does not vanish.**
  - **Load failure on `projects`** — the whole screen errors with a retry. **Never "אין פרויקטים".**
- 🔴 **Colour budget: `tr.block` (red row) appears ONCE per screen, and the mockup declares the budget as 1–2** (`01_overview:125`). Red = **zero `assignments` rows** (S-6). Amber = a gap with an answer on the way. Grey = a fact.
- 🚫 **Proximity is never coloured** — it is text, and it affects sort order only (F20 · ⑯).
**🔻🤖 Verify:** screenshots of all five states signed in as **מנהלת פרויקטים**; then the same screen as **מנהלת לוגיסטיקה** (`E2E_STAFF_*`) and as **מנהלת גיוס** (`E2E_RECRUIT_*`), proving the metrics are real for all three (AR-3) and `הכנסה מתוכננת` is `—` where it should be. `npm run check:bidi` → exit 0, **and** a manual read of every counter confirming `.ltr` is present (the gate does not cover this shape).
**מה ייחשב עובד** *(`spec.md` §"מה ייחשב עובד" #1/#3/#8 + `screens-approved` מסך 1, quoted)*
1. *"דנה פותחת את מבט-העל ויודעת מיד לאיזה אירוע להיכנס — הסדר והעמודה `מה חסר` עונים על זה, ולא ציון."*
2. *"שני מדדי-המוכנות מוצגים בנפרד ולעולם אינם ממוצעים… ואף מסך אינו אומר '50%'."*
3. *"מסך שלא הצליח לטעון אומר זאת. לעולם לא רשימה ריקה בשקט."*
4. The mockup's own colour legend: *"🔴 אדום = לא נשלח אף זימון לדיילת… 🟠 ענבר = חסר שיש לו מענה בדרך… ⚪ אפור = עובדה, ואין בה מה לעשות. 🚫 קרבת-האירוע לעולם אינה נצבעת."*
5. The mockup's black-and-white test: *"כל שורה כאן נקראת במלואה גם בלי צבע"* — **run it: view the screen greyscale and confirm every row still says what is missing.**
6. **יחידה-ספציפית, both directions:** מנהלת לוגיסטיקה sees the rows and real logistics counts but **no `שינוי תכולה` and no `ביטול פרויקט` control anywhere**, and `הכנסה מתוכננת` reads `—`; מנהלת פרויקטים sees all of it. **Both, not only the one you wanted to see.**
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 3.2 · Surface 2 — project card shell + identity area**
**Files:** `src/modules/06_projects/ProjectCardPage.jsx` · `EditProjectDetailsDialog.jsx` · mockup `02_project_card_approved.html` · card `screens-approved.md:375-679`
**What to do:**
- Breadcrumbs `פרויקטים | כנס לקוחות שנתי`; header = title + status tag inline + subtitle `מדיטק פתרונות בע"מ · פרויקט #8 · נוצר מהצעה #6`.
- **Two header buttons, in DOM order:** `ביטול פרויקט` (`btn quiet`) then `שינוי תכולה` (`btn primary`). 🔴 **`ביטול פרויקט` lives on the shell, not in the closing tab** (S-14) — the closing tab only opens after the event, and cancellation is legal *"בכל שלב פעיל"*. ⚠️ **This needs a `סטייה מ-5.6.7` note in the living docs — not optional.**
- **Identity card `פרטי האירוע`** with a `✎ עריכת פרטים` row action, and **8 cells in this order:** `תאריך האירוע` · `שעות האירוע` · `מיקום` · `איש קשר אצל הלקוח` · `אורחים מוערכים` · `הכנסה מתוכננת` · `מנהל/ת הפרויקט` · `משוב הלקוח`.
  - 🔴 **Plus a NINTH cell, `סיבת הביטול`, rendered ONLY when `project_status = 'cancelled'`** (S-30). It shows `cancel_reason`, `cancel_type`'s label, and the `cancelled_at` / `cancelled_by` stamp. **Why this is a defect and not an addition:** surface 7's dialog tells the user, in its own approved copy, *"היא נשמרת בכרטיס והיא ההסבר היחיד שיישאר אחרי הביטול"* — **and no screen in the module renders it.** ⇒ **the system makes a promise it does not keep**; that is a broken promise, not a design choice. **The cell is where the promise is kept.**
  - 🔴 **`הכנסה מתוכננת` renders `—` for no-quote and for no-permission, and only a genuine zero renders `0.00 ₪`** (S-2). Sub-line: `לפני מע"מ, אחרי הנחה של 15%` — **it is pre-VAT**, and showing `6,318.90` there passes every schema check while being wrong (§3.1②).
  - 🔴 **Owner phone and email on two separate lines** (S-23) — *"לרצף בן שני ערכים אין סדר נכון בכלל ⇒ התיקון הוא לפרק את הרצף."*
  - 🔴 **`משוב הלקוח` is read-only** — one cell, not four tiles (S-21); no editable field, no clickable stars. Empty state `טרם התקבל משוב` with sub `הסקר יוצא בסגירת האירוע · הציון והסיבה מוזנים במסך הכספים`. Four phrasings for `feedback_status`, including S-22's correction that `completed` with a NULL score needs its own wording.
- **Two readiness tiles:** `צוות דיילות` `1/6` sub `חסרות 5 דיילות שאושרו סופית` · `לוגיסטיקה ומוצרים` `0/2` sub `שני הפריטים טרם הוזמנו`. **Tiles are not clickable** (S-16, measured across all 15 usages). 🚫 **No stepper** (㉖).
- **Three tabs:** `לוגיסטיקה ומוצרים` · `צוות דיילות` · `סגירת אירוע` — the third **disabled** until `event_finished` **(A9 — surface 2 owns the shell)**.
  🔴 **The closing tab has THREE states, not two, and the draft carried only one. All three are specified here so no build session has to guess:**
  **‏① Before the event (`not_started`/`in_progress`/`ready`) — disabled**, reason text `(נפתחת אחרי האירוע)`.
  **‏② Between the event ending and the 02:00 cron — disabled, but the sentence above is FALSE.** The DB rule is right (the status is still `ready` until `module6-event-finished` runs), **but the event already happened**, and telling Dana the tab "opens after the event" on the morning after it **reads as a broken screen.** ⇒ **when `final_event_date < current_date` and the status has not moved yet, the reason text becomes `(נפתחת בסריקה היומית — האירוע נסגר לסגירה מחר ב-02:00)`.** 🔑 **Do not "fix" this by moving the gate to the date** — the status machine is the single writer (⑳/㉚), and a second, UI-side definition of "the event passed" is exactly the drift ⑫ was written to stop. **The sentence changes; the gate does not.**
  **‏③ After the operational closing (`awaiting_invoice` and beyond) — 🔴 the tab STAYS, read-only.** ⚠️ **By the draft's own gate it would re-disable**, because `awaiting_invoice` is not `event_finished` — i.e. Dana closes the event and the tab she just used **vanishes**, taking the record of what she entered with it. **`screens-approved.md:1309` already specifies the answer and the draft did not pick it up: the tab remains, its fields are read-only, and it carries a `נסגר ב-… על-ידי …` stamp** built from `operationally_closed_at`/`operationally_closed_by` (step 1.1's two columns — **this is their on-screen consumer, and ⑭ justified them by having one**).
- **Edit dialog `עריכת פרטי האירוע`:** lead *"שינוי כאן משנה את הפרויקט בלבד — ההצעה שהלקוח אישר נשארת כפי שהיא."*; three fields with the mockup's exact placeholders and helper texts; footer `שמור ושלח זימון מחדש` then `ביטול`.
  - 🔴 **The amber consequence banner appears BEFORE confirmation when the date changed** (㉑), naming the affected hostesses and the metric change: *"⚠ שינית את תאריך האירוע."* / *"דיילת אחת כבר אושרה סופית לתאריך הקודם — נועה שגיא. השמירה תבטל את האישור שלה ותשלח לה זימון מחדש לתאריך החדש. מדד הצוות יחזור מ-1/6 ל-0/6."*
  - Location helper: *"שינוי מיקום אינו מבטל אישורים. הדיילות מקבלות עדכון, והנקודה על המפה נקבעת מחדש."* Hours helper: *"שינוי שעות אינו מבטל אישורים. הדיילות מקבלות עדכון שנוקב בשעות החדשות."*
  - **Past date and cross-midnight: inform, never block** (S-17) — past date is `calm`, cross-midnight gets amber, neither disables save.
  - **After a successful save the client sends the mails** (AR-5), and reports per-recipient outcome. 🚫 **Not inside the RPC.**
- 🚫 **Do not link the customer name or the quote number** (S-13) — there is not one entity→entity link in the built app, and a link that rejects 2 of 5 roles is worse than none.
- **`שבת · בעוד 9 ימים`** under the date, from `weekdayOf` (step 2.4).
**🔻🤖 Verify:** screenshots of the card and of the edit dialog in its date-changed state; a screenshot of the disabled `סגירת אירוע` tab showing its reason; a screenshot of `הכנסה מתוכננת` rendering `—` for מנהלת לוגיסטיקה **and** `5,355.00 ₪` for מנהלת פרויקטים. Then the **date-move failure path**: attempt a move onto a date where a hostess is already `finally_approved` elsewhere and confirm AR-10's Hebrew message appears **naming her and the conflicting event** — not `"השמירה נכשלה"`.
**מה ייחשב עובד** *(`spec.md` §2.5 + `screens-approved` מסך 2, quoted)*
1. §2.5: the three fields with three different behaviours — date resets approvals and re-invites, location keeps them and nulls `lat`/`lng`, hours keep them and send an update naming the new hours.
2. §2.5(א): *"דחיית תאריך *יכולה להיכשל*, וזו התנהגות נכונה… בלי זה המנהלת תראה 'השמירה נכשלה' בלי סיבה, **ותסיק שהמערכת שבורה**."*
3. §2.5(ב): *"והמוקש השני *שקט*, ולכן חמור יותר: `set_project_coordinates` כותבת רק כשהעמודות ריקות ⇒ שינוי כתובת משאיר את הנקודה על המפה על הישנה, בלי שגיאה ובלי רמז. **קואורדינטה שגויה נראית כמו עובדה ומדרגת דיילות לפי המקום הלא-נכון.**"*
4. §3.1②: *"`הכנסה מתוכננת` היא **לפני מע"מ**. מימוש שיציג `6,318.90` שם **עובר כל בדיקת-סכימה** ושוגה."*
5. **יחידה-ספציפית:** מנהלת לוגיסטיקה and מנהלת גיוס see the card and its tabs but **neither header button is rendered for them**, and the `✎` row action is absent — **not present-and-disabled.**
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 3.3 · Surface 3 — logistics & products tab**
**Files:** `src/modules/06_projects/LogisticsTab.jsx` · mockup `03_tab_logistics_approved.html` · card `screens-approved.md:680-976`
**What to do:**
- Compact identity strip (6 cells) + the three tabs + **three tiles in order:** `פריטים מוכנים` (`0 מתוך 2`, sub `טרם הוזמן אף פריט`) · `שינויי תכולה` (`2`, sub `האחרון היום, 09:15`) · `השפעת השינויים על ההכנסה` (`+85.00 ₪`, sub `אחרי הנחת הלקוח`).
- Bar: sort line `ממוין: מה שרחוק ביותר ממוכן — תחילה` + the primary `שינוי תכולה` button.
- **Main table, 4 columns:** `פריט` · `כמות מתוכננת` · `כמות בפועל` · `מצב הפריט`. **Item statuses are READ-ONLY here** — the explainer under the table says so verbatim: *"שלושת מצבי הפריט, לפי הסדר: טרם החל, הוזמן, מוכן. מי שמעדכנת אותם היא מנהלת הלוגיסטיקה, במסך שלה. כאן הם לקריאה בלבד."*
- 🔴 **Only `ready` counts toward the readiness metric.** *"הוזמן" אינו נספר* ⇒ an ordered-but-not-arrived item is **identical in the metric** to one nobody touched, **and different in its tag** — which is why the tag stays even when there is a metric (`spec.md` §1.3).
- **History section `היסטוריית שינויי תכולה`**, 6 columns: `מתי` · `פריט` · `השינוי` · `סיבה` · `מי ביצעה` · `השפעה על ההכנסה`, plus the totals sentence. 🔴 **It lives here, in Ishay's words, because *"מנהלת הפרויקטים משנה — בלוגיסטיקה מתעדכנת הדרישה החדשה"* ⇒ history sits where its result is visible.**
- 🔴 **THREE states that look identical and must not — and two of them are unimplementable, so read this before coding the tab** (S-26, and `PermissionAwareEmpty.jsx` from step 3.0):
  - **① Legal empty** — *"לא הוזמנו מוצרים לאירוע הזה — ההצעה כללה שירותי דיילות בלבד."* / *"מצב תקין. פרויקט בלי פריטי לוגיסטיקה נספר כמוכן לוגיסטית."*
  - **② Load failure** — *"לא ניתן לטעון את נתוני הלוגיסטיקה של הפרויקט."* / *"להצעה שאושרה יש פריטי מוצר, ולכן רשימה ריקה כאן היא תקלה ולא מצב תקין."* + `נסי שוב`.
  - **③ 🔴 NO PERMISSION — the state the draft was missing, and without it ① and ② cannot be told apart at all.** The discriminator that distinguishes ① from ② is *"does the approved quote contain product lines?"* — i.e. **a read of `quote_services`, which is gated on `'הצעות מחיר'` where מנהלת גיוס and מנהלת לוגיסטיקה are both `➖`** (`PROJECT_MASTER:193-194`). ⇒ **for exactly the two roles this distinction was written for, the discriminator itself returns `{data:null, error:null}` — byte-identical to "the quote has no products".** **Two states cannot express three situations.** ⇒ **the tab renders `PermissionAwareEmpty` with `noPermission`:** `🔒` + *"אין לך הרשאה לצפות בפריטי ההצעה, ולכן לא ניתן לקבוע אם הרשימה ריקה כדין."* 🔴 **And the readiness metric renders `—`, never `0/0` and never "מוכן"** — *"אפס שורות ⇒ הושלם"* applied to an unreadable table is the module's most dangerous lie.
- Colour budget the mockup declares: **zero red rows in the main table; one amber row (the increase, which creates a gap); the only red on the screen sits in the error panel.** An increase is amber (it creates a shortfall); a **decrease is grey, not amber**.
- 🚫 **No "add first item" empty-state CTA** — logistics rows are born automatically with the quote approval; adding an item **is** a scope change and goes through the button above, with a mandatory reason.
**🔻🤖 Verify:** screenshots of the populated tab and of **all three** states — legal-empty · no-permission · load-failure — **side by side, proving all three read differently.** Then, signed in as **מנהלת גיוס** (blocked on `'לוגיסטיקה'` under AR-2 **and** on `'הצעות מחיר'`), the tab shows the **no-permission** state — 🔴 **not "לא הוזמנו מוצרים", and not a bare error either.** 🔴 **This is the single most dangerous silent failure in the module** and the three screenshots are the evidence.
**מה ייחשב עובד** *(`spec.md` §"מה ייחשב עובד" #8 + §1.3 + `screens-approved` מסך 3, quoted)*
1. #8: *"‏RLS-בלי-policy מחזיר `{data:null, error:null}` — **ובמ6 זה חמור פי-כמה מאשר במ4:** רשימת-לוגיסטיקה ריקה **אינה נראית כשגיאה, היא נראית כ-100% מוכן**, כי 'אפס שורות ⇒ הושלם'."*
2. §1.3: *"ורק `ready` נספר במדד-המוכנות. 'הוזמן' אינו נספר ⇒ פריט שהוזמן ולא הגיע **זהה במדד** לפריט שאיש לא נגע בו, **ושונה ממנו בתג**."*
3. The mockup's own error-state comment: *"בלי ההבחנה הזאת המסך יאמר 'לא הוזמנו מוצרים' על פרויקט שיש בו 300 תגים."*
4. **יחידה-ספציפית:** מנהלת לוגיסטיקה sees the rows and **no `שינוי תכולה` button** (that is the project manager's action); מנהלת פרויקטים sees both.
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 3.4 · Surface 4 — hostess team tab**
**Files:** `src/modules/06_projects/TeamTab.jsx` · mockup `04_tab_team_approved.html` · card `screens-approved.md:977-1190`
**What to do:**
- **Three tiles in order:** `כמות נדרשת` (`6`, sub `מההצעה — 04ST × 6`) · `אושרו סופית` (`1`, sub `המדד: מאושרות ≥ נדרשות`) · `חסרות` (`5`, sub `אין אף זימון חי`).
- **One headline sentence — the screen's only red statement**, and the words carry it without the colour: *"⚠ חסרות 5 דיילות — שני הזימונים הפתוחים פגו אחרי 48 שעות, כלומר אין קישור חי: גם דיילת שתרצה לאשר עכשיו לא תוכל. הפעולה הבאה היא זימון חדש, לא המתנה."*
- Bar: `שנה כמות דיילות` (secondary) + `פתח שיבוץ חכם →` + sort line `ממוין: בפנים · פתוח · יצא`.
- **Main table, 4 columns:** `דיילת` · `סטטוס` · `מתי` · **`מה זה אומר`** — the same logic as `מה חסר`, at hostess level: **a sentence, never a score.**
- **Status labels come from `src/lib/hostesses.js:22-37` and are not re-invented:** `ממתינה למענה` · `אישרה זמינות` · `סירבה` · `אושרה סופית` · `שוחררה` · `ביטלה אחרי אישור`, plus the display-derived `פג תוקף` (`pending` **and** 48h since `invite_sent_at`). ✅ **plus the second display-derived label, `הושלם`** (`hostesses.js:35-37,244`) — which lights up on every approved hostess whose event has passed, i.e. **exactly on the screens M6 builds.**
  > 🔴 **CORRECTION, measured `14/08/2026` — the earlier claim here was false in three ways and a build session would have acted on it.** It said `הושלם` *"the approved spec does not know about"* and *"appears zero times in all three spec files"*. **It appears 4 × in `spec.md` · 3 × in `processes-approved.md` · 6 × in `screens-approved.md`** — thirteen times. **And `screens-approved.md:1105` already RULES it**, verbatim: *"**'פג תוקף'** ו**'הושלם'** — **נגזרות בתצוגה, ואינן סטטוס שביעי.**"* **It is also already in `StatusTag`'s `TONE_BY_LABEL` (`:41`, tone `ok`).** ⇒ 🚫 **Nothing here is open, and there is no "render or suppress" decision to take.** **Render it, as a derived label, exactly like `פג תוקף`.**
  > ⚠️ **The one genuinely open sliver, and it is a render question only:** the six locked statuses are the DB vocabulary (`schema.sql:786`), and `הושלם` is derived at display time from `finally_approved` + a past event date — **so the rounds-history section, which shows the RAW status, must NOT show it.** *"כאן מוצג הסטטוס הגולמי כפי שנרשם — לא התווית הנגזרת שלמעלה"* is already the card's own rule; **apply it to `הושלם` as well as to `פג תוקף`.**
- **Rounds history `היסטוריית הסבבים`** — collapsible, 6 columns, showing the **raw** status *"כאן מוצג הסטטוס הגולמי כפי שנרשם — לא התווית הנגזרת שלמעלה"*, with the footnote *"9 שורות במסד, 6 דיילות על המסך: הסטטוס הקובע לכל דיילת הוא של הסבב האחרון שלה. הסבבים הקודמים נשמרים ואינם נמחקים."*
- **The `שינויי-תכולה בכמות הדיילות` section**, currently a fact line.
- **Two variant states:** no invitation sent yet (with `פתח שיבוץ חכם →`) and cancelled project (tag `בוטל` + the released list + a **disabled** `שנה כמות דיילות` with the reason *"הפרויקט בוטל — לא ניתן לשנות תכולה."*).
- 🚫 **Explicitly NOT here:** the card's primary action button (surface 2 owns it) · the logistics metric (the two stay separate) · per-row assignment actions (M4's) · attendance and quality fields (the closing tab's).
**🔻🤖 Verify:** screenshots of the populated tab, the no-invitations variant and the cancelled variant. The de-dup is visible on screen: **9 rows in the DB, 6 hostesses in the table** — count them in the screenshot. Then the same tab as **מנהלת כספים** (`➖` on `'דיילות'`): the assignment data is served through the overview RPC for counts, but the per-hostess table itself must show a **permission-shaped empty state**, not a silent blank table.
**מה ייחשב עובד** *(`spec.md` §1.2 + §3.2 + `screens-approved` מסך 4, quoted)*
1. §1.2: *"מקור-האמת לתוויות: `src/lib/hostesses.js:24` — **אל תמציא נוסח חדש**"*, and *"`פג תוקף` אינו סטטוס שביעי; הוא נגזר בזמן-תצוגה."*
2. §3.2: *"9 שורות ו-6 דיילות ⇒ ספירה נאיבית של `COUNT(*)` תמנה דיילת שסירבה-ואז-זומנה-שוב פעמיים."*
3. §1.8: *"`מה זה אומר` (משטח 4) — אותו היגיון"* as `מה חסר`: words, not a score.
4. The mockup's own exclusion list, verbatim: *"🚫 ובמכוון אינו כאן: כפתור הפעולה הראשית של הכרטיס · מדד הלוגיסטיקה · פעולות-שיבוץ פר-שורה · שדות נוכחות ואיכות."*
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 3.5 · Surface 5 — event-closing tab**
> 📜 **BINDS TO THE PAYLOAD CONTRACTS in step 1.8** — the `p_lines` / `p_rows` field lists. 🚫 **Do not invent a field, rename one, or omit `serial_number` / `assignment_number`.** **Those two are the third part of a three-column primary key**, and dropping either writes the WRONG row **without raising anything.** ⚠️ **If this step needs a field the contract does not have, the contract changes FIRST — in 1.8 — and every other consumer gets an `↳ as-built` note in the same session.**

**Files:** `src/modules/06_projects/ClosingTab.jsx` · mockup `05_tab_closing_approved.html` · card `screens-approved.md:1191-1545`
**What to do — the heaviest surface in the module, and the rule that holds the whole thing:**
> 🔑 **Nothing on this tab is saved before `שמור ושלח`.** Every choice, keystroke and upload sits in an **in-memory draft** and is written in **one atomic action** (ט4-ד).
> 🔴 **And the in-memory draft is ALL there is — R-1, Ishay 14/08/2026.** Asked whether Dana ever closes an event across two sittings, he answered **`לא`**. ⇒ 🚫 **No draft table, no draft columns, no autosave, and no navigation guard.** **Do not build a "are you sure you want to leave?" prompt** — that is logic for a case whose existence was denied, and it costs a real interaction on every legitimate exit.
> 🔴 **`assignments.travel_amount` does not appear on this tab — R-2, Ishay 14/08/2026: `לא קורה`.** Travel is never agreed in the field; it is a fixed `params` sum owned by M8 (§7.69), by the same reasoning that made `personal_bonus` M8's.

- **Section 🅰️ `מה קרה בפועל — ברמת האירוע`**, lede *"שלושת השדות חובה. בלעדיהם לא ניתן לשמור ולשלוח."*, three fields:
  - `שעות ביצוע בפועל · חובה`, unit `שעות`, helpers `מתוכנן: 16:00–22:00 · 6.0 שעות` and `קובע את ברירת-המחדל בעמודת "שעות בפועל" של כל דיילת — וניתן לדרוס אותה פר-שורה`.
  - `כמות אורחים בפועל · חובה`, unit `אורחים`, helpers `מתוכנן: 200 אורחים` and `לתיעוד ולדו"חות בלבד — אינו משנה את החיוב ללקוח`.
  - `דוח-סיכום אירוע · חובה` — file row with `הורדה` / `החלפת קובץ`, helper 🔴 **`PDF · JPG · PNG · עד 2MB. הקובץ נשלח ללקוח כקובץ מצורף`** — **`2MB`, and the number is rendered from `REPORT_MAX_BYTES`, never typed** (step 1.5). 🚫 **Not `10MB`.** **Why it changed:** the mail path's hard wall is **3,000,000 bytes** (`MAX_ATTACHMENT_BASE64_CHARS = 4_000_000` at `src/lib/email.js:29`, base64 3→4), so a 6 MB PDF would upload fine, satisfy the old promise, **and then fail at send — after the closing had already committed.** Ruled 2 MiB in `db_roadmap` §5 (Ishay 14/08/2026). ⚠️ **`screens-approved.md:1398` and the approved mockup both still say `עד 10MB`** — that is a **superseded approved string**; record it as a dated pointer in §10, 🚫 **and do not edit the approved mockup file** (it carries no hook protection, so the edit would succeed silently).
  - 🔴 **`dir="ltr"` on every numeric input** — the house pattern (`PricingParamsCard.jsx:115-118`); without it the value sticks to the right edge, 120px away from the word `שעות`, and value and unit split apart.
  - 🔴 **A Hebrew filename is NOT wrapped in `.ltr`** — the wrapper tears the extension to the wrong end (measured). The three extensions `PDF · JPG · PNG` are **one atomic run**, not three separate `.ltr` spans.
- 🔴 **The `דיילת` column renders `hostesses.full_name`, keyed on `hostess_id`.** 🚫 **Not `first_name`/`last_name`** — surface 5 §③ (`screens-approved.md:1270`) names two columns that **do not exist in the schema**. ⚠️ **The `select` fails loudly; the row KEYING fails quietly** — a closing form keyed on a phantom column writes attendance to the wrong hostess. *(§10 verification #8.)*
- **Section 🅱️ `מה קרה עם כל דיילת`**, lede quoted verbatim from the card: *"נוכחות היא עובדה — היא מזינה את ציון-האמינות בשיבוץ החכם. סימון-איכות הוא שיפוט — הוא קובע את מי נציע לעיריית חדרה בפעם הבאה. שתי שאלות שונות, ושתיהן חובה בכל שורה."*, counter `5 דיילות שובצו · כולן סומנו`, **5 columns:** `דיילת` · `נוכחות` · `סימון-איכות` · `שעות בפועל` · **`עלות בפועל`** *(🚫 **not `שכר`** — cost is M6's, wage is `§7.19` and M8's)*.
  - **One flat 7-option attendance select** in mockup order — **already ruled; the seven options and their three-column tuples are `ATTENDANCE_OPTIONS` in step 2.3.** *(This used to cite "B4" as though it were open. **B4 had no row in §3.5** — it was a dead id, and the thing it pointed at was settled by `spec.md` §1.4 and ט4 long before.)*
  - **Three quality pills:** `מצוינת` · `בסדר` · `לא לשלוח שוב` — the last opens a mandatory reason field under the row. 🔴 **The DB value is `לא_לשלוח`.** The constraint `customer_hostess_preference_negative_needs_reason` **already exists**, so a form that misses the reason **fails loudly, and that is correct.**
  - 🔴 **A `no_show` row: quality pills DISABLED (not empty) with the on-screen reason *"לא ניתן לסמן איכות — לא הגיעה, ואי-אפשר לשפוט מי שלא ראית."*, and hours forced to `0` and disabled** (ט4-א). *"ריק נראה כמו שכחה, מושבת-ומנומק נראה כמו החלטה."*
  - Summary row `סה"כ עלות דיילות בפועל` `1,085.00 ₪`.
- **Section `שינויי תכולה שהתגלו באירוע`** with `רישום שינוי שהתגלה באירוע` (㉔). 🟢 **B7 — RULED 14/08/2026: reuse surface 6's dialog.** It already carries the mandatory reason, the frozen-price arithmetic, AR-4's zero-guard and the tier-crossing notice; an inline form re-implements all four. ⚠️ **The one real build constraint:** the dialog opens over the closing draft and R-1 rules there is no draft-save ⇒ **the draft must survive the dialog in memory.** *(It was cited here from 14/08 while having no row anywhere — a citation with nowhere to be answered.)* **Recommendation carried into the door: reuse surface 6's dialog.**
- **Readiness strip `מוכן לשליחה`** (white, bordered — it reports, it does not act) + the **amber irreversibility banner**: *"⚠ הלחיצה הזאת סוגרת את האירוע ואי-אפשר לבטל אותה."* with the consequence list. ⚠️ **The mockup's banner text ends with `העלות בפועל והרווח הסופי קופאים` — AR-6 removed the profit freeze from M6. Ishay's 14/08 clarification post-dates the mockup.** 🔴 **Amend that clause to name only the cost, and record the amendment in §10 as a deviation from an approved mockup with its dated reason.**
- **Blocked save:** the button **stays on screen, disabled and explained**, with **one** summary sentence rather than seven messages: *"לא ניתן לסגור: חסרים 2 סימוני-איכות ודוח-סיכום."*
- **The seven per-field validation strings are quoted verbatim from the card** (`screens-approved.md:1396-1402`) — do not re-word them.
- 🔴 **The order that must not be reversed** (`spec.md` §2.2): the row exists first ⇒ upload to `reports/<project_id>/…` ⇒ **one RPC writes the path and moves the status in the same transaction** ⇒ on failure, **delete the file**. *"קובץ יתום הוא לכלוך שקוף; פרויקט סגור בלי דוח הוא שבר-נתונים."*
- 🔴 **After commit, and only then:** download the report and send it to the customer ⇒ send the survey ⇒ **only on success** call `mark_feedback_survey_sent` (AR-5). **If a send fails, the closing still stands**, `feedback_status` stays `not_sent` — which is now true — **and the screen names which mail failed.**
- 🔴 **AND THE RESEND CONTROL — without it the failure path is a dead end.** The draft described the failure honestly and then left the user with **no way out**: the closing has committed, the tab (per §3.2 state ③) is read-only, and the mail never went. ⇒ **the read-only closed tab renders a `שליחה חוזרת` control whenever `feedback_status = 'not_sent'` after the closing stamp exists**, with the state sentence *"הסגירה נשמרה. מייל הסקר לא יצא — אפשר לשלוח שוב."* **It calls the send path and then `mark_feedback_survey_sent`, exactly as the first attempt did.**
  🔑 **This is precisely why ㉙ is a WHITELIST and not a blanket** (§4.2): `mark_feedback_survey_sent` is **exempt** from the post-closing refusal, so the resend has a legal write path. **Phrase ㉙ as "these four operational RPCs refuse", never as "any RPC touching a closed project refuses"** — the blanket form makes this control impossible to build. *(§7.92 was closed on 14/08 by §7.39 on exactly this mechanism.)*
  🔴 **And fix the sentence that contradicts it:** any on-screen text saying the survey *"יוצא בסגירת האירוע"* (surface 2's `משוב הלקוח` empty state says exactly this) must read *"נשלח בסגירת האירוע"* **and, when `not_sent` after a closing, must say the send did not succeed** — otherwise the card asserts a mail went out while `feedback_status` records that it did not.
- 🔴 **Disable the send control for the whole send phase** *(this used to live in §10 with no owning step)*. `email_log` has **no uniqueness on `(entity_type, entity_id, recipient)`**, and the closing RPC's own `operationally_closed_at is null` precondition guards the **DB** write, not the **mail** path ⇒ **a second click during sending double-logs and sends the customer two reports.** **Not guarded at DB level, deliberately** — the retry engine is `§7.36`, 🟡, owned by **M10**. **The client-side disable is M6's, and it is this line.**
- **Legal empty:** a project can reach closing with zero approved hostesses (`#7`) ⇒ *"לא שובצו דיילות לאירוע הזה — אין מה לסמן"* **and closing stays possible.** 🔴 **The screen must not look like it failed.**
- **Load failure:** explicit error + `נסה שוב`, **never an empty list** — a silently-empty table is indistinguishable from "no hostesses", and Dana would close an event marking nobody.
**🔻🤖 Verify:** screenshots of — the populated form · the no-show row with its disabled controls · the blocked save with its single sentence · the legal-empty variant · the load-failure variant. Then run the full journey in the live preview against a real project and verify **through an independent channel** (SQL, not the UI) that `projects`, `assignments` and `customer_hostess_preference` all moved, and that `email_log` has one `project_report` row and one `project` row. Then **force a send failure** (bad recipient) and confirm the closing **still stands** with `feedback_status = 'not_sent'` and a named failure on screen.
**מה ייחשב עובד** *(`processes-approved.md` §🏁 + `screens-approved` מסך 5 §⑦, quoted)*
1. §🏁2's flow, ending: *"⇒ הדוח נשלח ללקוח · הסטטוס עובר ל'ממתין לחשבונית' · **הכרטיס ננעל תפעולית** · **נחתמת חותמת-הסגירה**."*
2. §🏁6: *"דיילת שובצה ולא סומנה ⇒ 🚫 'שמור ושלח' חסום — 6 שורות, 6 סימונים."* And: *"הפרויקט בוטל ⇒ 🚫 אין סגירה תפעולית לפרויקט מבוטל."*
3. §⑦'s blocked-button text, verbatim: *"⚠ לא ניתן לסגור: חסרים 2 סימוני-איכות ודוח-סיכום."*
4. §⑦: *"וסיבת-השלילי נאכפת גם במסד, לא רק בטופס… ⇒ טופס שיפספס אותו ייכשל **בקול**, וזה נכון."*
5. `spec.md` §"מה ייחשב עובד" #6: *"הסגירה התפעולית אינה מתאפשרת עם שדה חסר אחד — **והכפתור אומר *מה* חסר, במשפט אחד**."* And #7: *"אחרי הסגירה, המסכים התפעוליים מסרבים לכתוב — ומסכי-הכספים ממשיכים לעבוד."*
6. **יחידה-ספציפית:** only מנהלת פרויקטים and מנכ"ל reach this tab's controls; for everyone else the tab is not rendered as an action surface at all.
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 3.6 · Surface 6 — scope-change dialog**
> 📜 **BINDS TO THE PAYLOAD CONTRACTS in step 1.8** — the `p_lines` / `p_rows` field lists. 🚫 **Do not invent a field, rename one, or omit `serial_number` / `assignment_number`.** **Those two are the third part of a three-column primary key**, and dropping either writes the WRONG row **without raising anything.** ⚠️ **If this step needs a field the contract does not have, the contract changes FIRST — in 1.8 — and every other consumer gets an `↳ as-built` note in the same session.**

**Files:** `src/modules/06_projects/ScopeChangeDialog.jsx` · mockup `06_dialog_scope_change_approved.html` · card `screens-approved.md:1546-1752`
**What to do:** a **768px** dialog (`sm:max-w-3xl` — the measured precedent is `QuoteDocumentDialog.jsx:306` and `HostessViewCard.jsx:92`; the design contract's 520px form width does not fit a line table).
- Lead: *"משנים כמויות בלבד. ההצעה שהלקוח אישר נשארת כפי שהיא — השינוי נרשם בשורה נפרדת ומתווסף לחיוב."*
- Identity strip (5 cells) ⇒ section `מה משתנה` with the note *"— מחירי היחידה מגיעים מההצעה המאושרת ואינם ניתנים לעריכה. משנים כמויות בלבד."*
- **Line table, 6 columns:** `פריט` · `מחיר ליח' · קפוא` · `כמות בתוקף` · `כמות חדשה` · `הפרש` · `סכום השינוי`. Unchanged lines read `ללא שינוי` / `—` and the row is muted. Every quantity input carries an explicit `aria-label` (`כמות חדשה — <item>`).
- `+ הוספת פריט שאינו בהצעה` with the note *"פריט חדש נכנס לפי מדרגת-המחיר בקטלוג היום, ומקבל את הנחת ההצעה"*.
- Money block `התוספת לחיוב` — five rows exactly as step 2.2 computes them, ending `תוספת לחיוב` `1,404.20 ₪`.
- **Section `מה יקרה כשתשמרי` — four consequence rows** (`צוות` · `לוגיסטיקה` · `מיילים` · `חיוב`), white and bordered because they report rather than act. 🔴 **The `מיילים` row says explicitly *"לא יישלח מייל לאף דיילת"*** — recruiting the extra hostesses is the recruitment manager's screen.
- **Reason field, mandatory:** label `מה קרה, במילים שלך`, placeholder from the mockup, helper *"חובה. בלי סיבה אי-אפשר לשמור. הסיבה נשמרת עם השינוי ומוצגת בהיסטוריה שבלשונית הלוגיסטיקה."*; auto-stamp line *"יירשם אוטומטית: דנה כהן · 13/08/2026 15:40"*.
- **Four states the mockup draws as panels and the code must implement:**
  - **① Late change** — the amber banner **and the save button stays enabled.** 🚫 **No time threshold that BLOCKS** (⑯). 🔴 **↳ as-built — the banner is CONDITIONAL, a deviation from the mockup, which draws it unconditionally** *(Ishay `14/08/2026 11:30`, item ד — §3.5)*: it renders **only** for a hostess-quantity line under 24h or a printed-goods line under 3 business days, and **never for a reduction**. The condition decides whether the sentence is **shown**, never whether the save is **allowed** — the button stays enabled in every case. Predicate: `isLateChange` from step 2.2.
  - **② Reduction** — the banner states *"המערכת לא תשחרר אף דיילת מכאן — מנהלת הגיוס בוחרת את מי לשחרר במסך שלה"* (this is the ⑤-vs-scope-reduction distinction).
  - **③ Blocked save, two reasons** — empty reason ⇒ *"חובה למלא סיבה — היא מה שיסביר את החיוב הזה בעוד חודש."*; no quantity changed ⇒ button disabled with *"לא שינית אף כמות — אין מה לשמור"* (the same pattern M3 already built on 01/08).
  - **④ Item not in the quote** — priced at today's catalogue tier with the quote's discount.
- 🔴 **Reducing to zero is refused** (AR-4): *"הכמות חייבת להיות גדולה מאפס. להסרת פריט לגמרי — פני למנהלת הלוגיסטיקה."* — blocked in the dialog **before** submit, and the DB CHECK is the backstop.
- **The tier-crossing notice** (③ↄ) appears only when the new total crosses into a cheaper tier. 🚫 **No ₪ figure in it.**
- ⚠️ **`nowrap` on money columns** — a `₪` that wraps to the next line detaches from its number (measured in the reduction panel).
**🔻🤖 Verify:** screenshots of the normal dialog and all four states. Then submit a real change and verify by SQL that **one** `project_changes` row per line and **one** `change_group_id` were written **and** `logistics.planned_qty` moved **and** the project status recomputed — **or that none of them did.**
**מה ייחשב עובד** *(`spec.md` §"מה ייחשב עובד" #4 + §2.3, quoted)*
1. #4: *"שינוי-תכולה נרשם עם סיבה, ההצעה נשארת קפואה, והדרישה בלוגיסטיקה מתעדכנת באותה פעולה — **או ששלושתם קרו, או שאף אחד מהם לא**."*
2. §2.3: *"ההצעה נעולה במסד ואי-אפשר לגעת בה — טריגר זורק `P0001` בעברית על כל `UPDATE` בשורה שאינה `in_progress`. ⇒ `project_changes` היא הבית היחיד לשינוי, כי למקור אין דלת."*
3. §2.3: *"⏱️ והזמן מודיע ולא חוסם: שינוי מאוחר **מסומן בטקסט**. 🚫 אין סף-זמן במערכת. לא `T-36` ולא אחר."*
4. `🔄5`: increasing 6→8 sends the project back to `בתהליך` and the screen shows the gap; decreasing 6→4 leaves it `מוכן` because 6 approved ≥ 4.
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 3.7 · Surface 7 — project-cancellation dialog**
**Files:** `src/modules/06_projects/CancelProjectDialog.jsx` · mockup `07_dialog_cancel_approved.html` · card `screens-approved.md:1753-2015`
**What to do:**
- Lead: *"הפרויקט ייסגר, הדיילות ישוחררו, והעובדה תישמר בכרטיס — והפעולה אינה הפיכה."*
- **Amber consequence banner with four glyph rows, in this order — ⚠ ✉ ₪ ▥ — and each row reads on its own without the colour:**
  - `⚠` the timing: *"ביטול 23 ימים לפני האירוע."*
  - `✉` who is released, **by name, as plain text**: *"3 דיילות שאושרו סופית ישוחררו ויקבלו מייל 'האירוע בוטל': יעל דוד · סיון נחום · מאיה כהן. **אין בחירה מי — כולן משוחררות יחד.**"* 🔴 **No checkboxes, no per-row action** — the text says so explicitly so it is not read as a pick-list (⑤).
  - `₪` the compensation, with the ladder: *"פיצוי לדיילות: 0% — הביטול הוא יותר מ-72 שעות לפני האירוע."* / *"המדרג: יותר מ-72 שעות מזכה ב-0% · 24–72 שעות מזכות ב-50% · פחות מ-24 שעות מזכות ב-100% · כוח עליון מזכה ב-0% תמיד."*
  - `▥` logistics: *"פריטי הלוגיסטיקה לא משתנים. מה שכבר הוזמן נשאר מסומן כהוזמן — זו הראיה לחיוב ההוצאות שבוצעו לפני הביטול."* (㉕)
- **`סוג הביטול — חובה לבחור אחד` — three options**, each with a description line **and** a money line:
  - `הלקוח ביטל` / *"הפרת-הסכם מצידו — אנחנו היינו מוכנים ומסוגלים לבצע."* / *"הפיצוי לדיילות נקבע לפי מרחק-הזמן מהאירוע."*
  - `כוח עליון` / *"מלחמה · אסון טבע · צו ממשלתי. לא: שינוי דעה של הלקוח."* / *"מאפס את הפיצוי לדיילות — 0% תמיד, גם בביטול של יום לפני."* 🔴 **The explanatory line is mandatory (⑪) — this is the only option that takes money away from hostesses**, and it is the only one that also states what it is *not*.
  - `אחר` / *"מקרה חריג שאינו אחד משני אלה — תארי אותו בשדה למטה."* / *"לעניין הפיצוי מתנהג כמו 'הלקוח ביטל'."*
- **`סיבת הביטול — חובה`** in all three types, helper *"נשמרת בכרטיס הפרויקט וזמינה לדו"חות. חובה בכל אחד משלושת הסוגים."*; empty ⇒ error *"חובה לכתוב סיבה. היא נשמרת בכרטיס והיא ההסבר היחיד שיישאר אחרי הביטול."* and the destructive button **disabled**.
- Auto-stamp line: *"התאריך, השעה ומי ביצעה את הביטול — נחתמים אוטומטית עם האישור, ואינם ניתנים לעריכה."*
- **Footer:** `בטל את הפרויקט` (destructive) then **`חזרה`** — 🔴 **not `ביטול`**, because in Hebrew that word names both the destructive action and the dismiss button, two opposite meanings in one dialog.
- 🔴 **The destructive button is a RED OUTLINE, never a solid red fill.** The anchor is the only "negative action" pattern in `src/`: `RowAction.jsx:25` — `border-red-200 bg-red-50 text-red-600`. **A solid red fill exists nowhere in `src/`.**
- 🔴 **`בוטל` is never red anywhere** — cancellation is a valid terminal state, not a failure.
- 🔴 **Colour budget: three red occurrences across both dialog states** — the destructive button in each, plus the validation error. Zero red rows.
- **After a successful RPC the client sends the cancellation mail to every released hostess** (AR-5), reporting per-recipient outcome. 🚫 **Not inside the RPC.**
**🔻🤖 Verify:** screenshots of both states (normal, and force-majeure-with-empty-reason). Then cancel a real project and verify by SQL: `project_status='cancelled'`, `cancelled_at` and `cancelled_by` set, `cancel_type` set, **every** assignment `released`, **`logistics` untouched** (compare row-by-row before/after), and one `email_log` row per hostess.
**מה ייחשב עובד** *(`spec.md` §"מה ייחשב עובד" #5 + §2.4, quoted)*
1. #5: *"ביטול משחרר את כל הדיילות ביחד, שולח להן מייל שאינו משקר, וחותם תאריך-שעה-ומי — **וממנו מ8 יכול לחשב פיצוי חודשיים אחר-כך**."*
2. §2.4: *"ולמה החותמת חוסמת ולא נוחות: הפיצוי לדיילות נגזר ממרחק-הזמן, **וביטול שיתבצע בלי `cancelled_at` מוחק את הנתון שממנו מ8 יחשב אותו — ואי-אפשר לשחזר**."*
3. §2.4: *"🚫 ופרויקט שבוטל אינו חוזר לחיים ⇒ **אין לבנות 'ביטול-ביטול'**."*
4. ⑪: *"'כוח עליון' חייב שורת-הסבר צמודה — זו האפשרות היחידה שלוקחת כסף מהדיילות. שורה אחת, אפס עלות פיתוח, ומונעת בחירה שגויה שעולה כסף אמיתי לדיילת."*
5. ㉕, verbatim: *"השורות עצמן הן הראיה לחיוב… **לשנות אותו = למחוק את ההוכחה**."*
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 3.8 · Surface 8 — customer card projects tab** ⚠️ shared-surface *(`src/modules/02_customers/**`)*
**Files:** `src/modules/02_customers/CustomerDetailsPage.jsx` (or the tab component it renders) · `src/modules/02_customers/api.js` · **`src/lib/customers.js`** *(A3's `matchesCustomerFilters` at `:42` — it was named in this step's body but missing from this line, so a session reading only the `Files:` line would not have touched it)* · `src/modules/02_customers/CLAUDE.md` · mockup `08_customer_projects_tab_approved.html` · card `screens-approved.md:2016-2300`
🔴 **This is module 2's screen. The active sidebar item is `לקוחות`, not `פרויקטים`.** Shape the change as a bounded block; grep every open micro-guide for these files first.
**What to do:**
- **Two new stat tiles, appended to the existing three:** `מספר אירועים` (`4`, sub `אחד מהם בוטל`) and `אירוע אחרון` (`01/08/2026`, sub `לפני 12 יום`). 🔴 **`מספר אירועים` MUST be passed as a string** — `StatTile.jsx:37` routes a numeric `value` through `Money` and would render **`"4 ₪"`**.
- **`אירוע אחרון` has three states:** a date · the dormant variant (`.hint` amber, *"רדום · לפני 146 ימים"*) · and the never-held variant (`.tile-empty`, *"טרם התקיים אירוע"* + *"הראשון מתוכנן ל-19/08/2026"*).
- **Two sections, in order — `מתקרבים` then `התקיימו`** (A2, Ishay 30/07), each with its own count and definition line: *"· תאריך האירוע טרם עבר · הקרוב ראשון"* and *"· תאריך האירוע עבר, או שהפרויקט בוטל · האחרון ראשון · המבוטלים בסוף"*. 🚫 **Explicitly rejected and not to be rebuilt: an `ארכיון` tab, and a date-range filter.**
- 🔴 **A cancelled project sits in `התקיימו` regardless of the calendar** (㊲) — the split is "what is ahead of me" vs "what is behind me", and cancelled is behind you. **Two guards against the "but the date hasn't passed" confusion: the dashed `בוטל` tag (never red) and the sub-line `היה אמור להתקיים` under the date.**
- **Both tables, 5 columns:** `תאריך אירוע` · `שם האירוע` · `סכום` · `מצב` · blank (`לכרטיס →`).
- **Fix `getCustomerProjects`** (A12): filter directly on `projects.customer_id` (index `schema.sql:517` already exists — **do not create another**), join the quote as `LEFT`, not `!inner`, and list columns explicitly. 🔴 **Today a project without a quote vanishes silently.** ⚠️ **After step 1.1's `SET NOT NULL` that case becomes impossible going forward — but the `LEFT` join is still the correct shape and the migration is what makes it moot, not the query.**
- **Fix the stale comment in `02_customers/CLAUDE.md`** (A13): it declares `getCustomerProjects` *"always returns `[]`"*, which stopped being true at `20260809134237`.
- **Replace the placeholder block — 🔴 and here is what is actually on disk, measured `14/08/2026`, because the string this step used to quote does not exist:**
  - **The UI string is `CustomerDetailsPage.jsx:446`** — verbatim: **`אין פרויקטים עדיין — יתמלא במודול 6`**. *(🚫 It is **not** `ממתין למודול הבא`; that string is nowhere in the file. A build session grepping for the quoted text would have found nothing and either invented a replacement or skipped the item.)* **This whole `<p data-testid="customer-no-projects">` block is replaced by the real tab.** ⚠️ **`data-testid="customer-no-projects"` is an E2E contract** — check `e2e/` before removing the attribute.
  - 🔴 **AND a THIRD stale artefact the step did not mention at all — the comment at `:440-441`:** *"ריק בכוונה: `projects` היא deny-all (RLS בלי policies) עד מודול 6"*. **That has been false since `20260809134237:126` added `projects_select_by_permission`** — five days before this guide was written. **Delete it with the block**; leaving a comment that mis-describes the security model is worse than leaving none. *(Iron rule 13(ח): a capability that got built leaves text behind that still says it does not exist — **and here there are two such texts, one of them describing RLS.**)*
- **Add the `רדומים` filter to `matchesCustomerFilters`** (`src/lib/customers.js`, A3), reading `סף_לקוח_רדום_ימים` from `params`. 🟢 **Ruled `120` — read it from `params`, never hard-code it.**
- **The search box placeholder is `חיפוש לפי שם אירוע` — byte-identical to the quotes tab's** (`CustomerDetailsPage.jsx:471`), deliberately, so the two tabs do not teach two vocabularies for one action. 🚫 **No minimum length, no validation, no error state** — every string is legal, including empty (= no filter). ⚠️ **And the card names a trap already documented on the quotes tab: below the threshold at which the controls appear, they also stop filtering** — reproduce the existing behaviour, do not invent a second one.
- **Six appendix states the card mandates:** truly empty (*"עדיין לא נוצר פרויקט ללקוח הזה."* / *"פרויקט נולד מאישור הצעת מחיר."*) · **empty after *search*** (*"אין פרויקט התואם לחיפוש."* + `נקה חיפוש`; this tab says `חיפוש`, the other seven say `סינון` — the appendix counted it; **pick one and record it**) · **no permission — `🔒`, *"אין לך הרשאה לצפות בפרויקטים."*, and the tab counter shows `—`, not `0`** 🔴 (`0` would be a lie) · load failure (*"שגיאה בטעינת היסטוריית הפרויקטים."* + `נסה שוב`) · loading skeleton shaped like the content · the two extra `אירוע אחרון` variants.
**🔻🤖 Verify:** screenshots of the tab, both empty states, the no-permission state and the dormant tile. `npm run test:run` → green **and M2's existing tests unchanged**. Then, signed in as **מנהלת גיוס** (`➖` on `'לקוחות'`), confirm the whole customer page is unreachable — the pre-existing guard, re-proven not broken.
**מה ייחשב עובד** *(`screens-approved` מסך 8 + `PROJECT_MASTER §6` A1/A2/A12/A13, quoted)*
1. A2 (Ishay 30/07): *"פיצול לשונית-הפרויקטים ל'מתקרבים' מול 'התקיימו'. 🚫 נדחו במפורש ואין לבנות מחדש: לשונית 'ארכיון' · סינון טווח-תאריכים."*
2. A12: *"שתי דרכים מתחרות מלקוח לפרויקטים — `quotes!inner` מול `projects.customer_id`. `quote_id` הוא nullable ⇒ **פרויקט בלי הצעה נעלם**. מ6 בוחר את הישיר ופורש את השני."*
3. The mockup's own build landmine, verbatim: *"⚠️ מוקש למי שבונה: `StatTile` מעביר ערך מספרי דרך `Money` ⇒ `value={4}` יוצג '4 ₪'. 'מספר אירועים' חייב לעבור כמחרוזת."*
4. The card's no-permission state: **`🔒` with *"אין לך הרשאה לצפות בפרויקטים."* and the tab counter showing `—`, not `0`** — 🔴 **`0` would be a lie.**
**🌊 אדוות —**
**🗣️ אושר —**

---

**Step 3.9 · 🔻👤 🎨 UX & functional review (end of Phase 3)**
**What to do:** present, and Ishay rules on:
**(a)** §4 design conformance — palette, layout, RTL, sidebar on the right.
**(b)** **Functional states present on all eight surfaces** — loading · empty · no-results · error-with-retry · success feedback. 🔴 **On this module, "empty vs error" is not a nicety: on the logistics tab they are the difference between "the screen lied" and "the screen failed."**
**(c)** Keyboard operability of every primary action + a visible focus ring.
**(d)** **Validation completeness** — every rule the cards specify is implemented, and every spec-silent choice was confirmed.
**(e)** The real design question: *"should anything be redesigned / added / removed?"*
**Plus the two module-specific passes:**
- 🔴 **A cross-surface status × surface matrix** — one row per status, one column per surface, showing the tone actually rendered. **This is the artefact whose absence let the tone contradiction survive visual approval of all eight mockups** (S-1, and see §10). Build it once and keep it.
- 🔴 **A direction pass** on every screen: label-above-value pairs, `.ltr` on every number/ratio/date, and **`align-items: flex-start` on every `flex-direction: column` container** — the shared-skeleton bug that touches all eight surfaces.
**🔻👤 Stop.** Findings become build steps now, or `🚧`/§7 deferrals logged in §10.
**מה ייחשב עובד** *(`~/.claude/CLAUDE.md` + `module-blueprint/template.md`, quoted)*
1. *"Green ≠ done. Verify visually yourself (a screenshot is the evidence — don't send him to check manually)."*
2. *"ישי קורא תוצר ויזואלי כמסמך-שלם ותופס יישור/פרופורציות/כיווניות שאימות-תוכן מפספס"* ⇒ an explicit document pass before saying "נראה טוב".
3. This is module 6's OWN UX pass and does **not** replace M12's system-wide sweep.
**🌊 אדוות —**
**🗣️ אושר —**

---

### Phase 4 — Wiring & integration

**Step 4.0 · 🔻👤 Phase-4 door — Ledger sweep** (no OPEN items are anchored here today; confirm that is still true, and say `אין` if so).

**Step 4.1 · Route wiring** ⚠️ shared-surface *(`src/App.jsx`)*
**Files:** `src/App.jsx`
**What to do:** replace `<UnderConstruction moduleName="פרויקטים" />` at `:142` with `<ProjectsPage />`, and add the nested card route. 🔴 **Do not touch `<ProtectedRoute allow="פרויקטים">`** — the guard is already correct and the literal is byte-sensitive.
**Grep before editing:** `grep -rn "App.jsx" docs/micro_guides/` — if another open guide declares it, stop and reconcile.
**🔻🤖 Verify:** in the live preview, `/projects` renders the overview (not the placeholder) for מנכ"ל and for all four managers; a direct URL hit as a role with `➖` on projects is still blocked by `ProtectedRoute` — **screenshot the block, do not assume it.** `npm run test:run` → green including `ProtectedRoute.test.jsx`.
**מה ייחשב עובד** *(measured repo state, quoted)*
1. `src/App.jsx:138-145` — the route and its guard already exist; **only the element changes.**
2. `Sidebar.jsx` already filters blocked modules; the route guard is the second layer and both are required.
**🌊 אדוות —**
**🗣️ אושר —**

**Step 4.2 · Cross-module ripples** ⚠️ shared-surface
**Files:** `src/modules/02_customers/**` · `src/modules/04_hostesses/**` · **`src/modules/04_hostesses/SmartMatchPage.jsx`** · **`docs/automations.md`** · `docs/PROJECT_MASTER.md` §6 · `docs/db_roadmap.md`

**🔴 Two ripple targets that appeared ZERO times in this guide until 14/08 — both are rule-13 obligations, not nice-to-haves:**

**‏(א) `docs/automations.md` — the automation register.** It was born as **module 4's DoD requirement** and M6 is the biggest automation-adding module so far. **M6 must add four things:**
- the `pg_cron` job **`module6-event-finished`** to *"⏰ עבודות מתוזמנות"*, which today says **"שתיים"** and must say three *(`module3-quote-expiry` 01:00 · `module1-login-attempts-cleanup` 01:30 · **`module6-event-finished` 02:00** — and the 02:00 slot was chosen to avoid the other two, which is exactly the fact the register exists to make visible)*;
- the **three** status-machine triggers from step 1.9 to *"🗄️ טריגרים במסד"*, which today counts **20**;
- the **two new `entity_type` values** to the *"📧 פונקציית-קצה"* section, which today lists consumers as **"מודולים 4 · 8 · 11"** — **M6 is now a consumer and is absent**;
- the **seven RPCs** from step 1.8.
🔑 **Why a register that is not updated is worse than none:** it reads as complete. Its own opening argument is the module-1 cron job hiding inside a module-3 migration filename — *"מי שיחפש… לפי שם-הקובץ לא ימצא אותו לעולם"*. **An M6 job absent from the register is the same failure, one module later.**

**‏(ב) `SmartMatchPage.jsx:506` — a sentence that becomes false the day M6 ships.** Verbatim: *"וגם תגית "מצוינת אצל הלקוח" עוד לא קיימת — הסימון נוצר באותה סגירה."* **M6's closing screen creates exactly that mark** (surface 5's quality pills → `customer_hostess_preference`). ⚠️ **And the reason it will NOT self-correct:** the banner is gated at `:489` on **`params?.reliabilityEnabled === false`** — the `מרכיב_אמינות_פעיל` param, whose flip is **M9's** (`🚧 מ9 ← מ4`), **not M6's** ⇒ **M6 makes the sentence false while leaving the condition that displays it true.** **Amend the sentence in this step; 🚫 do not flip the flag.** *(Rule 13(ח), verbatim: "יכולת חדשה נבנתה? לחפש טקסט-ממשק שעדיין מתאר אותה כלא-קיימת".)*

**Then close the three debts M6 owes others and mark the ones it consumed —**
- `🚧 מ8 ← מ6`: the unified `event_finished ⇒ ממתין לסגירה` label · `actual_guests` is not a billing input · §7.39 closed (M6 sends, M8 does not).
- `🚧 מ11 ← מ6`: record that *"תכנון מול ביצוע"* is now computable **only once `logistics` origin rows are actually filled** — the column exists from step 1.4 and the **writer is M3's merged approve-RPC**, which M6 did not touch.
- `🚧 מ5 ← מ6`: all seven contract items from `processes-approved.md §"מה מ6 מכתיב למ5"`.
- Fix `db_roadmap A-20`'s "one value each" sentence (AR-8).
- **Re-count `🚧 מ6` LIVE in this step. 🚫 Do not trust any number written in this guide, including the ones below.** 🔴 **The approved spec says "תשעה"; that was true on 13/08 and stale within a day. This guide then wrote "17 occurrences ⇒ 14 distinct" on 14/08 — and a spot check the same evening returned a different line count.** ⇒ **the number is not the deliverable; the sweep is.** ⚠️ **Two measurement traps, and both bite:** `grep -c` counts **lines**, `grep -o … | wc -l` counts **occurrences**, and they differ · and **`grep` is line-based, so it returns only the first physical line of each debt while many §6 items span more than one** (`§6:545`) — **read every hit in full, do not judge from the matched line.**
**🔻🤖 Verify:** run **both** `grep -c "🚧 מ6" docs/PROJECT_MASTER.md` and `grep -o "🚧 מ6" docs/PROJECT_MASTER.md | wc -l`, report both, then read each hit in full; every one is either closed with evidence or explicitly re-targeted with a module number. **Then the push side:** every `🚧 מN` token in this guide has a byte-matching `🚧 מN` line in `PROJECT_MASTER §6` (iron rule 15; the Stop hook globs `docs/micro_guides/module-*.md`).
**מה ייחשב עובד** *(`docs/CLAUDE.md` iron rule 13(ז)/(ח), quoted)*
1. *"יכולת חדשה נבנתה? לחפש טקסט-ממשק שעדיין מתאר אותה כלא-קיימת"* — the M2 waiting strip and the M2 code comment.
2. *"שורת-🚧 בלי תאום ב-§6 = חוב שקט."*
**🌊 אדוות —**
**🗣️ אושר —**

**Step 4.3 · 🔻👤 Phase-4 gate**
**🔻👤 Verify:** `npm run gate` → **exit 0** (lint · format:check · test:run · build · dup · deadcode · audit · check:bidi · check:context · check:docs-structure). 🔴 **Run it without a pipe, or with `set -o pipefail`** — a pipeline's exit code is `tail`'s, and a red run looks green.
**מה ייחשב עובד:** ①–③ per `docs/architecture_and_qa_roadmap.md`'s DoD (see §7). 🔴 **And `gate` is not what CI runs** — see §6.
**🌊 אדוות —**
**🗣️ אושר —**

---

### Phase 5 — QA & handoff

**Step 5.1 · E2E + smoke coverage**
**Files:** `e2e/projects.spec.js` (new) · `e2e/project-closing.spec.js` (new) · possibly `e2e/smoke.spec.js` ⚠️ shared-surface
**What to do:** specs covering — the overview as all five roles (**including the positive control: מנכ"ל sees ≥ 1 project**) · the two empty states rendering **different** text · the logistics tab's empty-vs-error distinction · the closing journey end-to-end · the cancellation dialog's blocked-save path.
🔴 **Resolve `role → email` from `process.env.E2E_*` and let the spec skip itself when they are absent** — the house pattern. ⚠️ **And that skip is exactly why "green" can mean "everything skipped"** (`src/CLAUDE.md:335`); **state the executed count in the report, not just the exit code.**
🔴 **`RowAction`'s `title` is an E2E contract** — do not change one without updating its selector.
**Also, before 28/08:** re-check `🚧 מ6 ← מ3` (A10) — E2E fixtures pinned to quotes **#8 and #22** expire around **28/08** and **31/08** when `module3-quote-expiry` moves them to `rejected`. The pattern is already ruled: **select at runtime by condition, never a hard-coded id.** *(28/08 is the interim-presentation date.)*
**🔻🤖 Verify:** `npm run test:e2e` → passing count **and** the count of skipped tests, both reported. `npm run smoke` → exit 0.
**מה ייחשב עובד** *(`src/CLAUDE.md` + `PROJECT_MASTER §6` A10, quoted)*
1. *"‏`E2E` אינו רץ ב-CI ומדלג על עצמו בשקט כשאין credentials — 'ירוק' עלול להיות 'הכול דולג'."*
2. A10: *"בחירה בזמן-ריצה לפי תנאי, לעולם לא מזהה קשיח"* — M4 already applied this to itself.
**🌊 אדוות —**
**🗣️ אושר —**

**Step 5.2 · 🔻👤 Closing audit — in a FRESH session**
**What to do:** run `.claude/skills/module-close/template.md` via the `module-close` skill, **in a new session with a clean context**. Independent re-verification ⇒ DoD typed-echo sign-off ⇒ PR instructions.
🚫 **The audit never merges, never pushes and never opens a PR.** Its verdict is that the module is **mergeable**, not merged.
🚫 **And it never archives or closes the session — that is Ishay's action alone.**
**🔻👤 Stop.**
**מה ייחשב עובד** *(`module-blueprint/template.md`, quoted)*
1. *"a 🔻👤 closing-audit step that runs the closing-audit template in a FRESH session (independent re-verification → DoD typed-echo sign-off → PR instructions); a blueprint without this step is incomplete."*
**🌊 אדוות —**
**🗣️ אושר —**

---

## 7. 📊 QA Matrix

| Test type | Planned for module 6 | As-run *(filled by the closing audit)* |
|---|---|---|
| **Unit** (`npm run test:run`, Vitest) | `projects.test.js` — 8 status labels, the tone map via `describe.each` over **all eight**, `staffingMetric` (`≥`, de-dup, `1/6`, `0/1`), `logisticsMetric` (zero rows ⇒ complete), `gapSentence` per state · `projectChanges.test.js` — the `1,404.20 ₪` chain, discounts **added not chained**, the tier-crossing notice, the late-change marker · `projectClosing.test.js` — the seven attendance shapes, `לא_לשלוח` byte-exact, `1,085.00 ₪`, the no-show row · `dates.test.js` — `weekdayOf` across a week and a DST boundary · `smartMatch.test.js` — the attendance shapes + `approval_withdrawn` + **one unknown shape that must be REPORTED, not silently skipped** (`:207`), with the **six** `ATTENDANCE_VALUES` scores asserted unchanged · `smartMatchCandidates` returning a **non-empty** `attendance` array · **`projects.guards.test.js` — the three enforcement scans (unmapped label with its RED case · `אירוע הסתיים` · `OPEN_PROJECT_STATUSES`), shaped like `src/App.routes.test.jsx`** · `Ltr` · `PermissionAwareEmpty`'s three states + the `—` counter · `LoadingOrError`'s unchanged default + overridable `retryLabel`. 🔴 **These are unit tests and not scanner scripts on purpose: CI runs seven npm scripts and `check:bidi`/`check:docs-structure`/`check:context` are not among them.** **Baseline to exceed: 752 passed / 26 files.** | |
| **Integration** (Vitest, module `api.js`) | Every write path asserts `.select()` row-count and throws `RLS_DENIED` on zero (AS-6) · every read distinguishes rows / zero-rows / could-not-read | |
| **E2E** (`npm run test:e2e`, Playwright) | `e2e/projects.spec.js` — overview as all five roles incl. the מנכ"ל positive control; both empty states render **different** text; the logistics empty-vs-error distinction · `e2e/project-closing.spec.js` — the closing journey; the blocked-save single sentence; the cancellation dialog's disabled destructive button | |
| **Regression** | M4's overview after `OPEN_PROJECT_STATUSES` widens (count must not drop) · M2's customer page after surface 8 · M3's quote-approval path untouched · `smartMatch` weights unchanged | |
| **UAT** | Ishay drives the closing journey and the cancellation dialog himself at the Phase-3 🎨 gate | |
| **Security / Pen** | The five-role matrix run against `logistics`, `assignments`, `email_log`, `storage.objects` and each of the seven RPCs — **positive control first**, then the negative cases · `anon` has no execute on any M6 function · advisors clean after every migration | |
| **Performance** | `list_projects_overview()` is one round-trip instead of N+1 (AR-3's reason) · every new FK has an index · every policy uses the `(select …)` initplan wrapper · advisors' performance lint clean | |
| **Usability** | Filled from the Phase-3 🎨 review (§6 step 3.9) + the closing template's UX & Validation audit: the five functional states on all eight surfaces, keyboard operability, focus rings, the **status × surface tone matrix**, and the RTL direction pass | |
| **Compatibility** | RTL correctness in the app itself, not only in preview — **physical utilities only**; `npm run check:bidi` exit 0 **plus** a manual read of every counter, because the gate does not catch a digit after a Hebrew word | |

### 🔴 The measured boundary of the automated gates — state it, do not assume it

- **`npm run test:e2e` is literally `playwright test --config=playwright.e2e.config.js --grep-invert בדיקת-עשן`** ⇒ **it silently excludes the smoke journey.** The smoke tests are `npm run smoke` (`node scripts/smoke.mjs`), which is a **separate command**.
- **Neither E2E nor smoke runs in CI at all.** `.github/workflows/ci.yml` has three jobs: `quality-gate` (lint · format:check · dup · deadcode · audit · test:run · build) · `edge-function-check` (`deno check`) · `secret-scan` (gitleaks). **No Playwright step exists.**
- **`npm run gate` is NOT what CI runs.** CI runs the steps individually and never calls `gate`, so **`check:docs-structure` runs nowhere automatically** (it exists only in `package.json`), and `check:context` runs only as a **fail-open** session-start hook — context, not a gate. **`check:bidi` is in `gate` and not in CI.**
- **E2E skips itself silently when `E2E_*` credentials are absent** (`src/CLAUDE.md:335`) ⇒ **"green" can mean "everything was skipped".** ⇒ **every E2E report in this module states the executed count and the skipped count, never just the exit code.**
- 🔴 **And when running any gate from Bash: no pipe, or `set -o pipefail`.** A pipeline's exit code is `tail`'s, so a red run reads green. The repo has a pre-tool hook that blocks this exact mistake.

---

## 8. ✅ Definition of Done

### 8.1 The canonical DoD (`docs/architecture_and_qa_roadmap.md`), instantiated for module 6

- [ ] **1.** `npm run verify` green — lint · format:check · test:run · build.
- [ ] **2.** Pure logic touched ⇒ unit tests exist/updated: `projects.test.js` · `projectChanges.test.js` · `projectClosing.test.js` · `dates.test.js` · `smartMatch.test.js`.
- [ ] **3.** DB changed ⇒ **nine** migration files (A–I) in `supabase/migrations/`, **all applied**, and `docs/schema.sql` refreshed as a snapshot.
- [ ] **4.** Documented — a session entry in `docs/CLAUDE_CODE_LOG.md` (what + why/decisions) + every DB change in `docs/db_roadmap.md` §10 + `STATUS.md` updated for the module/stage change.
- [ ] **5.** No secrets or keys in code. ⚠️ **This box rests on discipline, not on a tool** — `gitleaks` runs only on PR/push to `dev`/`main` and is not installed locally.

### 8.2 Module-6-specific

- [ ] **Migration counter reconciled: A–I = nine applied**, each with its `<timestamp-id>` recorded in the step and in `db_roadmap`.
- [ ] Every `🚧 מ6` debt closed or explicitly re-targeted with a module number — **counted LIVE at step 4.2 with both `grep -c` and `grep -o … | wc -l`, and compared against the count taken at the start of Phase 4.** 🚫 **Not against any number written in this guide or in the approved spec** (the spec says "תשעה", this guide once said "14"; both aged within a day). And the **three** `🚧 מN ← מ6` obligations written into `PROJECT_MASTER §6`.
- [ ] **Every `🚧 מN` token in this guide has a byte-matching `🚧 מN` line in `PROJECT_MASTER §6`** — the Stop hook globs `docs/micro_guides/module-*.md`, so this file is in scope from the moment it is renamed.
- [ ] `projects` still has **exactly one** policy (SELECT). 🔴 **No `projects_write_by_permission` exists.**
- [ ] `logistics` has exactly one policy, gated on **`'לוגיסטיקה'`**, and the five-role read matrix matches §6 step 1.4's table — **including the positive control returning ≥ 1**.
- [ ] Seven RPCs exist, all `SECURITY DEFINER`, all with their own Hebrew permission check, all with `anon` revoked.
- [ ] The status-machine trigger fires from **all three** sources, and its `not in ('not_started','in_progress','ready')` guard is present (🔗 מראת §7.44).
- [ ] `pg_cron` job `module6-event-finished` is scheduled, and `#7` actually moved to `event_finished`.
- [ ] The three hand-computed anchors reproduce exactly: **`5,355.00 ₪`** · **`6,318.90 ₪`** · **`1/6` and `0/1`** · **`1,085.00 ₪`**.
- [ ] `הכנסה מתוכננת` renders `—` for no-quote and for no-permission, and `0.00 ₪` only for a genuine zero — **verified on screen as מנהלת לוגיסטיקה**.
- [ ] The logistics tab's **empty** state and **failure** state are visibly different, screenshotted side by side.
- [ ] `'אירוע הסתיים'` appears **zero times** in `src/` — `grep -rn "אירוע הסתיים" src/` returns nothing.
- [ ] Both mail templates in `params` are **byte-identical** to `db_roadmap` M6-12's approved copy.
- [ ] `email_log.entity_type` accepts four values, and there are **three** SELECT policies on `email_log`.
- [ ] Two new private buckets exist and `storage.objects` carries **twelve** policies — 🔴 **`reports` at `file_size_limit = 2097152` (2 MiB)** · `finance` at `10485760` · and **`REPORT_MAX_BYTES` in `src/` agrees with the SQL literal** (they are twins with no mechanical link).
- [ ] **No `עד 10MB` string survives anywhere in module 6** — `grep -rn "10MB" src/modules/06_projects/` returns nothing.
- [ ] `smartMatch.js` reads the real column names, **the six `ATTENDANCE_VALUES` scores are unchanged** *(six, not seven — `ATTENDANCE_OUTCOMES` has eight members and `SICK`/`EXCUSED` are deliberately unscored)*, and an unknown shape **is reported, not silently skipped**.
- [ ] **`smartMatchCandidates.js` returns a non-empty `attendance` array** for a hostess with closed assignments — asserted explicitly, because `[]` is green and wrong.
- [ ] **The tone map covers all eight statuses from `src/lib/projects.js`, spread into `StatusTag.jsx`, and the unmapped-label guard FAILS on an unknown key** — the RED case is run and recorded, not just the green one.
- [ ] **The three states — empty · no-permission · load-failure — render differently on the logistics tab, screenshotted side by side**, and the denied counter shows **`—`, never `0`**.
- [ ] **`<Ltr>` exists as a component** and both `Money.jsx` and `RatingStars.jsx` consume it.
- [ ] **Every string module 6 authors is feminine**, and `LoadingOrError`'s hard-coded default is **unchanged** (M6 passes `retryLabel`).
- [ ] **`StatTile`'s label-vs-value `left` measurement is recorded before and after `items-start`** — both numbers, in step 3.0.
- [ ] **The closing tab survives the closing** — read-only with a `נסגר ב-… על-ידי …` stamp — **and a failed survey send has a working `שליחה חוזרת` path** proven by forcing a failure and then resending.
- [ ] **The ninth identity cell renders `cancel_reason` on a cancelled project** — the dialog's *"ההסבר היחיד שיישאר"* promise is kept.
- [ ] **`docs/automations.md` names M6's cron job, its three triggers, its seven RPCs and its two `entity_type` values**, and its section counts are updated.
- [ ] **Every `🌊 אדוות` slot in §6 is closed** — ripples performed, or the word `אין`. **36 slots.**
- [ ] `OPEN_PROJECT_STATUSES` no longer exists as a local constant; `ACTIVE_PROJECT_STATUSES` is imported from `src/lib/projects.js`, and the stale code comment is gone.
- [ ] Every `🗣️ אושר` slot in §6 carries a `DD/MM HH:MM`, or the step is not done.
- [ ] 🔴 **Routing audit re-run at close: every §10 finding has an owning step or a §3.5 row, and every id cited from a step body exists in §3.5.** *(The audit of 14/08 found **seven** findings with neither and **four** dead ids; the closing audit re-runs it rather than trusting that it stayed clean.)*
- [ ] E2E fixtures use **runtime selection by condition**, not the pinned quote ids `#8`/`#22` *(they expire ~28/08 and ~31/08)*.

### 8.3 UX & validation

- [ ] **The end-of-Phase-3 🎨 review passed** — §4 design conformance (palette · layout · RTL · right-hand sidebar) · all five functional states on all eight surfaces · keyboard operability of every primary action with a visible focus ring.
- [ ] **Validation completeness** — every rule the approved cards specify is implemented with its **verbatim** Hebrew string, and every spec-silent validation choice was confirmed with Ishay.
- [ ] **The status × surface tone matrix exists and every cell agrees.**
- [ ] **The direction pass ran** — `.ltr` on every number, ratio and date; label-above-value intact; `align-items: flex-start` on every column-flex container.

### 8.4 Post-merge note — **NOT audit checkboxes**

> The closing audit's verdict is that the module is **mergeable**, not merged. The following happen after it and are **not** items a truthful audit could tick:
> **(a)** Ishay opens a PR from `ishay/module-6-projects` into `dev`. **(b)** CI goes green on that PR. **(c)** Ishay merges. **(d)** The `post-merge` skill verifies with fresh git evidence and flips the `STATUS.md` row.
> 🚫 **Claude never pushes to `dev`/`main`, never force-pushes, never merges, and never archives or closes a session** — those are Ishay's actions.
> 🔴 **Mid-session merge check, after any push and before any further commit:** `git fetch origin` then `git merge-base --is-ancestor HEAD origin/dev`. ⚠️ **And the caveat that check alone does not carry:** it **succeeds on a fresh branch with no commits exactly as it does on a merged one.** The test that separates them is `git log origin/dev..HEAD --oneline` — **empty ⇒ fresh branch, just start working** · **non-empty ⇒ genuinely merged or behind.**

---

## 9. 🔄 Self-Update Protocol

**(a)** At every step transition, update the status header **and** the step table in §1 — **in the same session, before moving on.**

**(b)** Any deviation from the plan gets an inline **`↳ as-built`** note on the step **plus** a line in the Deviations & Tech-Debt Log (§10).

**(c)** The repo's Stop hook (`.claude/hooks/check-docs-updated.sh`) blocks session end if module code under `src/modules/06_projects/` changed but this guide did not — **keep it current, not as an afterthought.**

**(d)** The end-of-session protocol in `CLAUDE.md` applies: **the active micro-guide → `docs/CLAUDE_CODE_LOG.md` → `STATUS.md`, in that order.** *(`CHANGELOG.md` was frozen 23/07/2026 — archive only.)*

**(e)–(g):** per `CLAUDE.md` iron rules 13/15/16 + the end-of-session protocol. *(New open question mid-build ⇒ stop at the nearest gate and bring it to Ishay, never self-answer · applied a migration or found a DB gap ⇒ update `db_roadmap` the same session · a change landing on a future module ⇒ name those module numbers in the log entry and in `PROJECT_MASTER §6`.)*

**(h) On ENTERING a phase:** sweep the Decisions Ledger (§3.5) for OPEN / nod-pending items anchored to this phase's steps and bring them to Ishay for **one consolidated ruling round BEFORE the phase's first step.** Deferred questions get settled at the phase door, never mid-step where they ambush the build. *(The anchored sets are named at the top of each phase in §6.)*

**(i) Compaction:** when a phase closes, its step-by-step instructions collapse to a `| Step | What landed | Evidence |` table plus a short carry-forward note, and the pre-compaction copy is archived under `docs/archive/` **first**. 🔴 **Never compact the active phase, §9, or §10 — those are the memory.** *(This guide's own format was recovered from `docs/archive/module-4_pre-compaction_2026-08-12.md` precisely because module 4's live guide had been compacted past the point of being a template.)*

**(j) 🌊 Ripple sweep — 🔴 PER STEP, and the draft was wrong to move it.**
> **`.claude/skills/module-blueprint/template.md:84` carries Ishay's ruling of 09/08/2026 verbatim: an empty `🌊 אדוות —` slot on every build-unit step, *"closed when the step closes with either the ripples performed or the word `אין`"*, and *"A step whose `🌊` line is empty is not closed."*** The draft replaced this with a per-phase block, citing module 4's recovered format. 🚫 **That is not a change this guide may make.** ⚠️ **The rule it overrode is his; a blueprint observing that another artefact does it differently raises the conflict — it does not resolve it in its own favour.** *(Iron rule 1: a contradiction where he ruled twice ⇒ bring both, quoted and dated, and ask which stands. Never obey the one you found first.)*
> ⇒ **Every build-unit step carries `🌊 אדוות —`, per the template.** The per-phase blocks below are **kept as an addition**, not a replacement — they are where a ripple spanning several steps lands.
> ⚠️ **The observation is still worth his minute, and it is recorded rather than acted on:** module 4's live guide does carry 🌊 as a closing block (`module-4.md:274,287`), so **the template and the built precedent genuinely disagree.** **His call, at the Phase-1 door.** Until he rules, **the template wins** — it is the newer ruling and it is the file this blueprint was generated from.
>
> **The five targets of any sweep, per-step or per-phase:** ① the step's own `↳ as-built` note · ② a line in §10 · ③ **the DoD checkboxes this step's evidence moved, with the numbers** · ④ the Decisions-Ledger rows it implemented · ⑤ **every approved-spec, mockup or research section that now reads differently** — recorded as a **tagged pointer, never as an edited number.**
**Why the sweep is needed at all, and why iron rule 13 does not already cover it:** rule 13 fires on a decision that changes schema, a §7 item, or a work process — **it produces no signal when a build step merely finishes**, which is exactly when most drift is created.
🚫 **No number in the approved spec is edited.** *(Measured on module 4, 09/08/2026: Phase 2 wrote its §10 deviation correctly and still left four stale spots — a DoD line reading `428 passed` after the count had moved to 535, an instruction with no `↳ as-built` beside it, an approved assumption row naming a superseded algorithm, and an SSOT section still carrying a formula the build had replaced. **All four were found only because Ishay asked for a ripple audit — the second time in one day he had to ask.**)*

**🌊 Ripple sweep — Phase 1:** *(to be filled at Phase-1 close)*
**🌊 Ripple sweep — Phase 2:** *(to be filled at Phase-2 close)*
**🌊 Ripple sweep — Phase 3:** *(to be filled at Phase-3 close)*
**🌊 Ripple sweep — Phase 4:** *(to be filled at Phase-4 close)*
**🌊 Ripple sweep — Phase 5:** *(to be filled at Phase-5 close)*

---

## 10. 📝 Deviations & Tech-Debt Log

*(Append-only, dated lines.)*

### 🔴 Nine-point verification of the approved spec — run `14/08/2026 01:20–01:30`, before a single step was written

> **Why this block exists:** several "facts" in the approved spec are measurably wrong. Five were corrected on disk on 14/08/2026 and others were not. **A guide built on the uncorrected ones ships a defect.** Each line below names the command or `path:line` that settled it.

| # | Claim under test | Result | Evidence | What the build session must do |
|:-:|---|:--:|---|---|
| **1** | `quote_services.line_id` — does a single-column PK exist? | **STALE** *(the spec's denial is wrong; the column exists)* | `docs/schema.sql:457` — `alter table quote_services add column line_id bigint generated always as identity primary key;` The original `create table` at `:108-117` had `primary key (quote_id, sku, line_number)`, **replaced** at `:456`. Also `20260723111005_module3_quotes_structure_and_constraints.sql:35`. | **Use `line_id` as the FK target for `logistics.quote_service_line_id`.** 🚫 Do **not** create a surrogate key and do **not** build a three-column FK, as `screens-approved §נספח③` and `:2327` propose. |
| **2** | `assignments_one_event_per_day` — plain unique constraint or a **partial** index? | **STALE** *(the spec quotes it without the predicate)* | `docs/schema.sql:852-853` — `create unique index assignments_one_event_per_day on assignments (hostess_id, event_date) where assignment_status = 'finally_approved';` | **Only `finally_approved` rows collide.** A pending invitation or an availability-confirmation does **not** block a date move — an implementation assuming a blanket block forbids legal actions. And the error mapping hangs on the **index name** (`schema.sql:850-851` calls the name a contract with the UI), via `SERVER_CONSTRAINT_RULES`, not on a constraint name that does not exist. |
| **3** | `projects.event_name` / `projects.customer_name` — snapshot columns, or must they be joined? | **CONFIRMED** *(both are snapshot columns on `projects`)* | `docs/schema.sql:502` `alter table projects add column event_name text;` · `:799` `alter table projects add column customer_name text;` (+ the backfill at `:800-801`). Both are `ALTER`s **below** the `create table` block. | **Read both from `projects`.** 🚫 Never join to `customers` for the name — מנהלת גיוס is `➖` on `'לקוחות'` and the join returns `null` **without an error** on three approved screens (`04_hostesses/api.js:128-130` already learned this). ⇒ `screens-approved §נספח④` and surface 7 §③ are wrong on both halves. |
| **4** | `logistics.line_id` — does that column exist at all? | **STALE** *(it does not exist; `processes-approved` claims the approve-RPC writes it)* | `logistics` is `docs/schema.sql:180-189`, PK `(project_id, sku, serial_number)`, no `line_id`. A full-file grep for `line_id` returns only `:455` and `:457`, both `quote_services`. | **M6 creates the origin columns itself** (step 1.4, AS-7). And the writer for **new** rows is M3's **merged** approve-RPC — `🚧 מ5 ← מ6` contract item 1 — which M6 does not edit in this module. Existing rows stay NULL; **no positional backfill** (the `row_number()` offset makes it unsound). |
| **5** | `email_log.entity_type` — what does the CHECK allow **today**? | **CONFIRMED** *(two values only)* | `docs/schema.sql:637` — `check (entity_type in ('quote', 'shift'))`. Two SELECT policies at `:649-653` and `:658-662`. | **Widen by two** (`'project'`, `'project_report'`) **in the same migration as the Edge-Function change**, and add a **third** SELECT policy. 🔧 **And fix `db_roadmap A-20`**, which says only "M4/M8/M11 widen by one value each" — M6 is absent from that list and widens by two. |
| **6** | `MAX_ATTACHMENT_BASE64_CHARS` — the real ceiling, versus the 10MB the closing screen promises | 🟢 **WAS a live contradiction — RULED 14/08/2026 and now CLOSED** | `src/lib/email.js:29` — `const MAX_ATTACHMENT_BASE64_CHARS = 4_000_000`, enforced by `isAttachmentTooLarge` at `:35-37`. Base64 is 3 bytes → 4 chars, so **the hard binary wall is exactly 3,000,000 bytes ≈ 2.86 MiB.** The comment at `:26-28` explains it is deliberately below Make's 5MB free-tier limit. `screens-approved.md:1398` and the approved mockup both promise *"עד 10MB"*. **The ruling: `db_roadmap` §5's `reports` row — `file_size_limit = 2097152` (2 MiB), helper text `עד 2MB`** *(Ishay delegated, 14/08/2026)*, **which also explicitly rejects 3 MiB**: 3,145,728 > 3,000,000, so a 3 MiB bucket still admits a file that fails at send. | ✅ **Owned by three steps, and it needed to be — this line previously said *"Raised as a new open item"* while §3.5 had no such row, so the decision had nowhere to be made.** **‏1.5** sets the bucket to `2097152` and adds `REPORT_MAX_BYTES`; **‏3.5** renders `עד 2MB` from that constant; **‏2.8** keeps the attachment path unchanged. **`AS-3` is updated and is no longer an assumption.** ⚠️ **`screens-approved.md:1398` and the approved mockup are now SUPERSEDED strings** — recorded as a dated pointer below; 🚫 **not edited.** |
| **7** | `OPEN_PROJECT_STATUSES` — which statuses today? | **CONFIRMED** *(two, and `ready` is deliberately absent)* | `src/modules/04_hostesses/api.js:56` — `const OPEN_PROJECT_STATUSES = ['not_started', 'in_progress']`, used at `:141`. **And the comment at `:54-55` says the exclusion is deliberate:** *"`ready` ומעלה אינם ברשימה **במכוון** — פרויקט שאוייש יצא מרשימת-העבודה של מנהלת הגיוס."* | ⑫ and `db_roadmap M6-14` **overrule that comment**: M4 decided it unilaterally in code and it is wrong under the ruling — a `ready` project vanishes from the recruitment manager's screen, so a hostess cancelling on a "ready" event tomorrow is invisible to her. **Widen to three, move to `src/lib/projects.js`, and DELETE the stale comment** — leaving it would make the next reader think the widening was a mistake. |
| **8** | `hostesses` name column — `full_name`, or `first_name`/`last_name`? | **CONFIRMED `full_name`** | `docs/schema.sql:145` — `full_name text not null`, inside `create table hostesses`. There is no `first_name` and no `last_name` anywhere in the schema. *(Also note the PK moved: `id_number` was dropped at `:746` and `hostess_id bigint generated always as identity` added at `:747`.)* | `screens-approved.md:1270` (surface 5 §③) says `hostesses.first_name`/`last_name` — **it is wrong.** `spec.md` §1.7 already has it right. ✅ **Owned by steps 2.5 and 3.5** *(added 14/08 — this finding previously had no owning step and no OPEN row, i.e. a correct measurement that no build step would ever read)*: **step 2.5's `getProjectAssignments` selects `full_name` and `hostess_id`**, and **step 3.5's `דיילת` column renders `full_name`**. 🔴 **A build session that follows `screens-approved:1270` gets `column hostesses.first_name does not exist` — which at least fails loudly** — **but the same wrong reading of surface 5 §③ would also mis-key the closing rows**, and that fails quietly. |
| **9** | `_design-contract.md` — does it exist anywhere in the repo? | 🔴 **STALE — the file does not exist** | `find . -iname "*design-contract*"` (excluding `node_modules`) ⇒ **empty**. `Glob "**/*design*contract*"` ⇒ **No files found.** The only files mentioning the name are `docs/specs/module_06_projects/spec.md`, `screens-approved.md`, three approved mockups, `docs/archive/prompt_module_discovery_retired_2026-08-13.md` and `docs/CLAUDE_CODE_LOG.md`. | 📏 **RE-COUNTED 14/08/2026, and the earlier "ten places" was wrong — the real shape is worse, not smaller.** By **filename: TWO** (`:1151` `_design-contract §3.2` · `:1552` `_design-contract.md §5.8`). By **Hebrew name (`חוזה-העיצוב`): SEVEN more** (`:259`, `:315`, `:896`, `:1696`, `:1697`, `:2188`, `:2286`). 🔴 **And the dangerous class the "ten" list actually mislabelled:** `:1142` was listed as a citation and cites no contract at all — it cites a **bare `§3.4③`**. **A bare `§N.M` with no filename resolves to the missing file silently**, and a build session reads it as a section of the document it is already holding. ⇒ **Rule, owned by step 3.0 and applied by every surface step: a card justification that resolves to `_design-contract` — by filename, by Hebrew name, or as a bare `§N.M` that matches no section of `screens-approved.md` itself — is UNSOURCED.** **Fall back to the approved mockup (appearance) or a measured `src/` precedent (behaviour). 🚫 Never invent the missing section's content, and never treat it as binding.** *(By `docs/CLAUDE.md`'s placement rule — "אין מסלול-טעינה ⇒ הוא לא ייקרא" — these were dead on arrival. `STATUS.md:73` and `CLAUDE_CODE_LOG.md:99` already record the gap as known and deliberately unfixed.)* ✅ **Now owned by step 3.0** — it previously had no owning step and no OPEN row. **Note: surface 6 already contradicts two of them on measured grounds (520px → 768px; amber banner → white block) and reports the contradiction itself, which is the correct handling — copy that behaviour.** |

**Count: nine reported. Four CONFIRMED (#3, #5, #7, #8) · four STALE (#1, #2, #4, #9) · one RULED-AND-CLOSED (#6).**

> ### 🔴 Routing audit of this whole section — run `14/08/2026 03:12`, and it is the reason this revision exists
> **The test applied to every finding below: does it have an OWNING STEP (named in a step body in §6) or an OPEN-TABLE ROW (§3.5)?** 🔑 **Nothing else is read at build time.** §10 is an append-only *log*; no phase door, no step and no gate opens it. ⇒ **a finding recorded only here is invisible to the build, and it looks handled.**
> 📏 **Measured before any fix: SEVEN findings had NEITHER.**
> | # | Finding | What it had | Now |
> |:-:|---|---|---|
> | 1 | **#6** — report ceiling, 10 MB promise vs ~2.86 MiB wall | Said *"raised as a new open item"* — **§3.5 had no such row**; steps 2.8 and 3.5 pointed **back at §10** | ✅ Ruled (2 MiB) · steps **1.5 · 2.8 · 3.5** · `AS-3` |
> | 2 | **#8** — `full_name`, not `first_name`/`last_name` | Nothing. The words `full_name` appeared in no step body | ✅ Steps **2.5 · 3.5** |
> | 3 | **#9** — `_design-contract.md` does not exist | A general instruction with no owner | ✅ Step **3.0**, as a standing rule + the bare-`§N.M` class added |
> | 4 | **Tone map** — the three-way mockup conflict | Routed to *"open item A8"* — 🔴 **A8 never existed in §3.5** | ✅ Ruled in full (**S-1**) · steps **2.1 · 3.0** + an enforcing test |
> | 5 | **`mockup-data.md`** self-contradiction on sort order | *"fix it when surface 1 is built"* — step 3.1's body never mentioned it | ✅ Step **3.1**, with the file named and the edit permitted (it is living, not frozen) |
> | 6 | **`email_log` double-log** — *"the client must disable the send button"* | Step 3.5's body carried no such instruction | ✅ Step **3.5** |
> | 7 | **No-location-column deviation** — *"this sentence must appear in the code comment"* | Step 3.1's body carried no such instruction (only S-8's anchor column pointed at it) | ✅ Step **3.1** |
>
> ⚠️ **Two of the seven (#5, #7) had an `Anchor` cell in §3.3 naming step 3.1.** **That is not an owning step.** §3.3 is a rulings table; the build session executes **step bodies**. An anchor column tells a reader where a ruling applies — it does not put an instruction where the builder will stand.
> 🚫 **And the trap that makes this class self-perpetuating: the natural fix is to add another §10 note. That IS the defect.** ⇒ **a finding needing a DECISION goes to §3.5 or a named phase-door sweep; a finding needing an ACTION goes into a STEP. §10 records that it happened — it never carries it.**
> **Four dead ids were also removed** — **A8 · B4 · B7 · B10** were cited from step bodies while having no §3.5 row. Three are now ruled (S-1 · ט4/2.3 · AS-3) and **B7 has a real row.**

---

### Dated entries

- **`14/08/2026 01:25` — Guide created as `module-6.draft.md`.** Not the approval gate and not the saved guide; a reviewer audits it next, then it is renamed. Nothing committed, no other file touched.
- **`14/08/2026 10:20` — Renamed `module-6.draft.md` → `module-6.md`; the guide is now live.** **What the `.draft` suffix was protecting against, and why it can come off:** the draft was written by one agent in one pass, and a fresh-context reviewer returned **8 blockers**. All eight are closed, and the two that mattered most were not content errors but **routing** errors — findings that were measured correctly, written down correctly, and filed where no build step would ever read them *(the 03:12 audit; seven of them)*. 🚫 **What the rename does NOT mean: it is not approval to start building.** ⚠️ **Rule 15's `🔻` gates still stand, and the Phase-1 door is 👤 — Ishay's**; step 1.1 applies a migration, which is his gate under iron rule 12 and the typed-echo protocol. **Live means "this is the plan of record", not "go".**
- **`14/08/2026 01:25` — Section numbering follows the recovered module-4 format, not the literal nine-item list in the writing brief.** The brief listed nine sections but then referred to *"§10 (Deviations & Tech-Debt Log)"* and to *"the phase gate (§9h)"* — both of which only resolve under the format file's numbering, where 🗡️ is its own §5 and the step plan is §6. **Numbering used: 1 header · 2 context · 3 ledger · 4 security · 5 🗡️ · 6 step plan · 7 QA · 8 DoD · 9 self-update · 10 deviations.** Recorded so a reader does not think a section is missing.
- **`14/08/2026 01:25` — AR-6 supersedes the approved spec and one approved mockup on the profit freeze.** `spec.md` §2.2 lists *"הרווח הסופי קופא"* among the closing's atomic effects, `screens-approved` row 17 requires a frozen-profit column, and the approved mockup `05_tab_closing_approved.html`'s irreversibility banner ends *"העלות בפועל והרווח הסופי קופאים"*. **Ishay's clarification of 14/08/2026 01:17 post-dates all three**: §7.52's *"בסגירת-האירוע"* means the **financial** closing (M8), not the operational one. ⇒ **M6 builds no profit computation and no `final_gross_profit` column; the banner clause is amended to name only the cost.** `db_roadmap M6-8` was already re-scoped to match. 🚫 **No number in the approved spec was edited** — this is a tagged pointer.
- **`14/08/2026 01:25` — AR-3 requires deleting two lines from the approved spec's recommendations.** `screens-approved.md:200` and `:336` recommend widening `assignments_select_by_permission` to `'פרויקטים'` holders. **Doing so would expose hostess names, hourly rates and phone numbers to every holder of `👁` on projects.** ⇒ superseded by the `SECURITY DEFINER` overview RPC. **Flagged as a pointer; the spec's own text is not edited by this guide.**
- **`14/08/2026 01:25` — The `🚧 מ6` count in the approved spec is stale.** `processes-approved.md` §970-998 says *"תשעה"*; **measured 14/08: 17 token occurrences ⇒ 14 distinct debts** (three of the occurrences are the document quoting its own grep command, at `:394`, `:482`, `:527`). Five were added on 12–13/08 **after** the spec counted. ⚠️ **And `grep` is line-based, so it returns only the first physical line of each debt while 12 of 35 §6 items span more than one line** (`§6:545`). ⇒ **A session trusting "nine" misses five.**
- **`14/08/2026 03:12` — The status tone map's three-way mockup conflict is RULED IN FULL, and its routing defect is recorded because it is the template case.** Measured across all eight approved files: `בתהליך` is `tag muted` in `01`, `04`, `06` and **`tag teal`** in `02`, `03`, `08` (**3–3**); `מוכן לביצוע` is `tag teal` in `01` while surface 8's §⑥ map says `ok`; **`ממתין לסגירה` is `tag warn` in `01` and `08` but `tag teal` in `05`** (**2–1**). **Why it survived visual approval of all eight: no single artefact shows the same status twice.** ⇒ **ruled in S-1, all eight labels, one home (`src/lib/projects.js`), spread into `StatusTag.jsx`, enforced by step 2.1's guard ①.** 🔴 **The routing defect, recorded deliberately:** this entry used to route the third label to *"open item A8"*, **and A8 had no row in §3.5** — a finding correctly measured, correctly written down, and pointed at a gate that did not exist. **`PROJECT_STATUS_TONES` sat as an empty `{}` in step 2.1 waiting on it.** 📏 **And one number here was wrong too: `TONE_BY_LABEL` holds TEN entries, not 18** — 2 hostess states + 6 assignment statuses + 2 derived, **zero project statuses**; five of the ten keys are unquoted, so a quote-based grep undercounts by five. M6 adds 8 ⇒ 18.
- **`14/08/2026 03:12` — 🔴 CORRECTION: the earlier `הושלם` entry was false, and it is retained here rather than deleted so the correction is legible.** It claimed `הושלם` *"appears zero times in all three spec files"* and that the spec *"does not know about"* it. **Measured: it appears 4 × in `spec.md` · 3 × in `processes-approved.md` · 6 × in `screens-approved.md` — thirteen times — and `screens-approved.md:1105` already RULES it**, verbatim: *"**'פג תוקף'** ו**'הושלם'** — **נגזרות בתצוגה, ואינן סטטוס שביעי.**"* **It is also already in `StatusTag`'s `TONE_BY_LABEL` (`:41`, tone `ok`).** ⇒ **Nothing was open. Step 3.4 renders it as a derived label like `פג תוקף`, and suppresses it in the raw-status rounds history.** 🔑 **Why this mattered: the entry instructed step 3.4 to "decide render-or-suppress" — i.e. to re-open a question `screens-approved` had already closed**, which is exactly the "asking Ishay to re-decide what he already decided" failure the interview-skip rule condemns.
- **`14/08/2026 03:12` — `mockup-data.md` contradicts itself on sort order, and now has an owning step.** `:164` says verbatim *"🚫 אל תשים אותו בראש רשימה — הוא ייראה כמו באג-עיצוב"* while `:293-294` numbers the same two rows in the opposite order. The file is cited as an anchor by `screens-approved:279` yet `spec.md §①`'s reading list omits it. ⇒ ✅ **Step 3.1 builds S-7's behaviour AND fixes the file's numbering in the same step.** *(It is `docs/specs/` — living, editable. 🚫 The approved mockups are not.)* **Previously it said "fix it when surface 1 is built" and step 3.1's body never mentioned it.**
- **`14/08/2026 03:12` — The ~20 cross-card wording contradictions now have ONE home: §3.7, "Locked UI strings".** Three different *"reason is required"* messages · three *"cannot load"* strings · two loading-skeleton patterns · two *"no permission"* phrasings · a success toast forbidden on one card and mandatory on two · `≥0` vs `>0` · the past-date phrase (`התקיים לפני N ימים` vs bare `לפני N ימים`, almost certainly column-width truncation) · `מה חסר` copy differing between tabs · `סינון` on surfaces 1–7 vs `חיפוש` on surface 8. **Each is resolved to one string, majority-wins unless a card gives a measured reason.** 🔑 **Why a table and not a note:** recorded as prose here, every one of them was left to whichever build session reached it first — **eight surfaces re-inventing the same six sentences.** ⚠️ **Two of the "contradictions" turned out NOT to be drift and are documented as deliberate:** `סינון`/`חיפוש` (the control's own name differs) and the two reason-required messages (different consequences).
- **`14/08/2026 01:25` — `spec.md:527` gives a wrong path for `smartMatch.js`.** It places the file under `src/modules/04_hostesses/`; **it is at `src/lib/smartMatch.js`** (measured). Step 2.7 uses the real path.
- **`14/08/2026 01:25` — `db_roadmap A-14` sits outside the `A-M6` block and is easy to miss.** The `SET NOT NULL` of §7.62 was ruled for M6's migration but lives in table A1, not in the `A-M6` block that `spec.md §①` points the blueprint at. ⇒ **step 1.1 carries it; a literal reading of the block's scope would drop a ruled migration item.**
- **`14/08/2026 03:12` — `email_log` double-log: the DB-level deferral stands, and the client-side half now has an owning step.** The journal has no uniqueness on `(entity_type, entity_id, recipient)`, so a re-click after a partial send failure can double-log **and send the customer two reports.** **Not guarded at DB level in M6, deliberately** — the closing RPC's `operationally_closed_at is null` precondition guards the *DB* write, **not the mail path.** ⇒ ✅ **Step 3.5 disables the send control for the whole send phase.** *(Previously this sentence lived only here, and step 3.5's body carried no such instruction — the finding was right and the build would not have contained it.)* The retry engine itself is `§7.36`, 🟡, owned by **M10** — the return path is that §7 item, not a promise to remember.
- **`14/08/2026 03:12` — 🟢 CLOSED BY ISHAY, and recorded so it is not silently re-opened: `assignments.travel_amount` is not M6's.** Asked as a field-reality question — is travel reimbursement ever agreed in the field? — he answered **`לא קורה`**. ⇒ **R-2: a fixed `params` sum, owned by M8 (§7.69). M6's closing screen neither shows nor writes it, and open item B14 is REMOVED from §3.5 rather than left dangling.** 🔑 **A reality ruling is the cheapest kind and the easiest to lose** — it leaves no artefact, so a later session re-reads `schema.sql:778`, sees a column nobody writes, and re-opens work he already killed. **The quoted `לא קורה` is the guard.**
- **`14/08/2026 03:12` — 🟢 CLOSED BY ISHAY: no draft-save on the closing screen.** Asked whether Dana ever closes an event across two sittings, he answered **`לא`**. ⇒ **R-1: no draft table, no columns, no autosave, and 🚫 no navigation guard.** The in-memory draft of ט4-ד is the only draft there is. **Open item B1 is REMOVED from §3.5.** ⚠️ **"No navigation guard" is the load-bearing half** — a session reading only "no draft-save" would still build a *"are you sure you want to leave?"* prompt "to be safe", i.e. logic for a case whose existence was denied, at the cost of a real interaction on every legitimate exit.
- **`14/08/2026 01:25` — Recorded as a deliberate deviation needing a note in the living docs:** `ביטול פרויקט` sits on the project-card **shell**, not in the closing tab where `C5 §5.6.7` places it. **Reason:** the closing tab is gated on `event_finished` while cancellation is legal *"בכל שלב פעיל"* ⇒ C5's placement makes the control unreachable in exactly the window it is needed. **Requires an explicit "סטייה מ-5.6.7" note — not optional** (S-14).
- **`14/08/2026 03:12` — Deliberate deviation from a built precedent, now with an owning step:** the overview has **no location column**, while module 4's *built* overview shows one (`OverviewTab.jsx:225,301`). **What reconciles them:** in M4 location **is** a ranking input (0.25 of the score); in M6 it has no consumer that separates projects. ⇒ ✅ **Step 3.1 writes that sentence into `ProjectsPage.jsx` as a why-first comment.** *(Previously this said "the sentence must appear in the code comment" and no step said where or by whom — S-8's anchor column named 3.1, but an anchor column is not an instruction a builder stands on.)*

---

### Added `14/08/2026 03:12` — the revision pass

- **🔴 `public.moddatetime` was broken SQL and would have failed on apply.** Step 1.2's trigger read `execute function public.moddatetime(updated_at)`. **The extension was moved out of `public` by `20260710164420_module2_moddatetime_to_extensions_schema.sql:7`** ⇒ that name no longer resolves. 📏 **Measured: `public.moddatetime` appeared exactly ONCE in the entire repo — in this guide**, in no migration. ⇒ **corrected to `extensions.moddatetime`.** ⚠️ **And the near-miss worth naming:** the 11 bare-`moddatetime` triggers in `20260710160735` still work **only because they bound to the function OID before the move**, so copying *their* form would also have failed. **Three forms in the repo, one correct for new code.**
- **🔴 Step 1.7 was about to seed a THIRD name for a link that is already live.** It proposed `קישור_שאלון_שביעות_רצון` and instructed the session to *"ask Ishay for the value"*. **Measured: `קישור_בסיס_סקר_לקוחות` is seeded at `20260723112000_module3_seed_products_tiers_params.sql:63` with a real URL — `https://forms.gle/YFJobqmgpBCqf1x87`** — and `[לינק_לשאלון_שביעות_רצון]` is the **placeholder token** inside `תבנית_מייל_משוב_לקוח`, not a param. ⇒ **no survey-link row is seeded, and the "ask Ishay" instruction is deleted — the value is on disk and asking implies it is missing.** ⚠️ **Step 1.6's own acceptance item 4 already said so verbatim**, two screens earlier — an internal contradiction inside one phase.
- **🔴 `src/lib/smartMatchCandidates.js` appeared ZERO times in this guide, and `:81` hard-codes `attendance: []`.** ⇒ **added to step 2.7's `Files:` and body, with a test asserting the array is non-empty.** **The failure mode is the module's quietest:** everything stays green, and the day M9 flips `מרכיב_אמינות_פעיל` **every hostess returns "no data"** — a uniform blank across the ranking, not an error.
- **🔴 `docs/automations.md` appeared ZERO times.** The register — born as module 4's DoD requirement — must gain M6's `pg_cron` job (its *"שתיים"* becomes three), its three triggers, its seven RPCs and its two `entity_type` values (its consumer list *"מודולים 4 · 8 · 11"* omits M6). ⇒ **added to step 4.2.** 🔑 **A register that is not updated is worse than none — it reads as complete**, which is the exact failure its own opening argument describes.
- **🔴 `SmartMatchPage.jsx:506` ships a sentence that M6 makes false.** *"וגם תגית "מצוינת אצל הלקוח" עוד לא קיימת — הסימון נוצר באותה סגירה."* M6's closing screen creates exactly that mark. ⚠️ **It will not self-correct: the banner is gated at `:489` on `params?.reliabilityEnabled === false` — a param whose flip is M9's, not M6's** ⇒ M6 falsifies the sentence while leaving the condition that shows it true. ⇒ **rule 13(ח) sweep, step 4.2.**
- **⚠️ `StatTile` — honest boundary, not a fix asserted as measured.** `StatTile.jsx:29` genuinely lacks `items-start`, and the approved mockup genuinely rules `.cell, .tile{align-items:flex-start}` off a **browser measurement dated 13/08/2026** with real numbers. **But that the React component visibly splits today is NOT derivable from the code** — the measured mechanism needs the `.ltr` element to be a *direct* flex child, and in `StatTile.jsx:36-38` `<Money>` sits one level in. ⇒ **step 3.0 aligns the component to the approved shape AND measures label-vs-value `left` before and after, recording both numbers.** 🔑 **Recorded because the instruction this revision was working from asserted it as a live module-2 defect. It may be. I did not open a browser, and I will not hand a build session a measurement I did not take.**
- **🔴 The `🌊` ripple field was moved from per-step to per-phase against `module-blueprint/template.md:84`, which carries Ishay's ruling of 09/08/2026.** ⇒ **restored to per-step (36 slots), with the per-phase blocks kept as an addition.** ⚠️ **The observation behind the move is real and is his to rule:** module 4's live guide does carry 🌊 as a closing block (`module-4.md:274,287`), so **the template and the built precedent disagree.** **Raised at the Phase-1 door; until he rules, the template wins.** 🔑 **A blueprint that finds two of his rulings in conflict brings both — it does not pick the one that suits it.**
- **✅ `14/08/2026 10:20` — Two `§7` status inconsistencies, reported here as "for Ishay" and then FIXED, because on inspection neither was a decision.** **‏(1) `§7.39`** carried `🟢 סגור` in its code and ended `סטטוס: **פתוח**` — **the ruling was already inside the same line** (*"הוכרע 13/08/2026 בהאצלת-ישי"*); the original question text simply was not updated when the ruling was prepended to it. **‏(2) `§7.92`**'s inline code still read `🟡 פתוח` while its closure sat one line below (`↳ 🟢 נסגר 14/08/2026 03:03`) — **an incomplete write-back from this same night's session**, and `grep` for open items still returned it. ⇒ **Both corrected to `🟢`.** 🔑 **Why this was not Ishay's to rule:** aligning a status marker to a ruling recorded in the same line decides nothing — **the decision already existed; only its label lagged.** ⚠️ **The distinction that matters, and it is the rule for the next reader: a marker that contradicts a ruling on the same line is a TYPO to fix. A marker with no ruling behind it is a QUESTION for Ishay.** Escalating the first wastes him; deciding the second alone is forbidden by iron rule 1.
- **⚠️ `db_roadmap` has TWO different rows carrying the id `A-20`** — the `email_log` `entity_type` row (`:183`) and a `users.email ON UPDATE CASCADE` row (`:214`). Step 4.2 is told to "fix A-20"; **it means the `email_log` one.** Named here so the fix does not land on the wrong row. *(And the substance is confirmed: `A-20`'s forward notice lists **M4 · M8 · M11** and **M6 is absent**, while M6 widens by two.)*
- **⚠️ `db_roadmap` §5 does NOT name `allowed_mime_types` for the `reports` bucket** — only the `marketing` row carries them. AS-3's three MIME types therefore remain **M6's assumption**, and step 1.5's typed-echo is where they get ruled. *(The `file_size_limit` **is** ruled; the mime list is not, and the two were being carried as one fact.)*
- **✅ Verified and NOT changed — recorded so the next reader does not re-check:** `smartMatch.js`'s silent-skip line **is** `:207` throughout this guide *(it was never `:208`)* · `quote_services.line_id` **exists** at `schema.sql:457` and no surrogate-key work is planned · `assignments_one_event_per_day` **is** partial · `logistics.line_id` **does not** exist · `m6-OPEN-ITEMS`, `M6-8` and `src/lib/customers.js` are **not** missing *(the first is a session scratchpad, `M6-8` is owned via AR-6, and `customers.js` was in step 3.8's body — it has now also been added to its `Files:` line, which is where it was actually absent)*.
- **`14/08/2026 01:25` — Open, and it is a build-order dependency, not a DB one:** surface 8's `לכרטיס →` links to the project card (surface 2). **Either surface 8 is built after surface 2, or the link is disabled with a visible reason** (`FilterPill.jsx:14-17` — disabled stays on screen and explains itself). 🚫 **A link that 404s is not an option.** The step order in §6 already puts 3.2 before 3.8.
- **`14/08/2026 01:25` — Disagreement recorded, built as ruled:** AR-1 stores `cancel_type` as **one** three-value column and derives the money type in code, overriding `spec.md:474`'s suggestion of two columns. I build it as ruled. **My note:** two columns would make the money type queryable without a code join, which matters for M8's reports — **but the ruling's anchor holds** (`src/lib/hostesses.js:36-37`: a value that is a pure function of a stored value is derived, not stored), and a three-value label column fully serves the stated motive of keeping `אחר` countable. **No action; recorded so the reviewer can see it was considered rather than missed.**
- **`14/08/2026 01:25` — Considered and deferred (free-rein disclosure):** ① a `project_status_history` table — no reader exists today, and ⑭ explicitly rejected per-transition stamps, so it would be a column nobody asked for. ② A DB-level `unique` on `(project_id, hostess_id)` for the quality mark's history — B13 asks the question and it is Ishay's. ③ Extracting the `MAX(assignment_number)` fold into a SQL `view` so it has one implementation instead of two — 🚫 **rejected: `grep "create view"` returns zero across the whole repo**, and introducing the first view in the system as a side effect of module 6 is a bigger architectural change than it looks. **The two implementations are pinned to each other by `spec.md` §3.2's numbers instead.**
