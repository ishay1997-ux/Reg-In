# Module 7 — Home Dashboard · Build Micro-Guide

> **Shortened blueprint (Ishay's own call, 03/09/2026):** every product decision below was reached
> through live back-and-forth with Ishay this same session — not a scripted agent pass — including
> two real correction cycles (a masking-vs-remove fork, a "did we already answer this" false start).
> The formal fresh-context-reviewer / execution-rehearsal agent passes the full template calls for are
> deliberately **not** re-run: they would rediscover what a real product-owner conversation already
> found. Self-check only: this document was read once end-to-end before being shown, specifically for
> head-vs-tail contradictions — the exact bug class this project hit four times tonight in other files.

## 1. 🟢 Live Status Header

| | |
|---|---|
| **Module** | 7 — מסך הבית (Home Dashboard) |
| **Branch** | `ishay/m7-blueprint-and-seed` **(deviation — the step guide names `ishay/module-7-dashboard`)**. Shared with the seed-data workstream by Ishay's own split-the-work call, same session. **Open, not blocking:** whether to rename before build starts, or update the ⑥2/⑥3 handoff prompts to match — Ishay's call, flagged in §9. |
| **Owner** | Ishay (sole developer) |
| **Status** | 📘 **Blueprint ready, awaiting Ishay's read-through nod on this file** (the design itself — mockup, KPI set, masking, calendar rule — is already approved through direct iteration; this document formalizes it into build steps). |
| **Active step** | **1.1 — not started.** |
| **No approved spec folder** | `docs/specs/module_07_dashboard/` exists but holds *debate/decision records* (`dashboard-design-debate.html`, `seed-data-spec.md`), not a Discovery `processes-approved.md`/`screens-approved.md` pair — **by Ishay's explicit ruling, no Discovery for this module** ("מיותר דיסקברי... רק חשוב להציג דיון"). Tier-2 in the truth hierarchy is therefore this micro-guide itself plus the two decision-record files it cites; C5/C6 apply only where neither says anything (see §3). |

**Legend (verbatim, per iron rule F7):** 🔻 stop-point · 🤖 Claude verifies alone · 👤 human (Ishay) gate · 🚧 cross-module debt (§6) · ⏳ deferred decision · 🕓 freshness stamp · 🔗 tagged §7 mirror · 🧩 handoff prompt · 🧊 frozen file.
**Step status set:** ⬜ pending · 🔨 in progress · ✅ done · ⏸️ deferred · ❌ blocked.

---

## 2. 📦 Context Packet for Claude

**Purpose (≤3 lines):** the one screen every role opens first. Reads-only aggregation of data other
modules already own — no new business process, no new table, no new RLS policy (§4). Answers two
questions: "what's coming up" (calendar) and "what fell through the cracks" (attention strip), plus
four at-a-glance numbers.

### Capabilities delivered (all ✅ — this module owes nothing to a later one, and nothing is owed to it)

| Capability | Data source | Who sees it |
|---|---|---|
| Monthly calendar grid, red/yellow/green by readiness | `projects.project_status` + `final_event_date` only | Everyone |
| "מה דורש טיפול" strip (finished-unbilled, missing-staffing-soon, expiring quotes) | Same as above + `quotes` (existing policy) | Everyone (quote-expiry items naturally absent for roles already blocked from `quotes` — no new gap, matches every other quote-touching screen) |
| KPI: active projects | `projects` | Everyone |
| KPI: satisfaction (90-day rolling) | `projects.feedback_score`, `feedback_status='completed'` | Everyone |
| KPI: monthly gross profit | `project_finance`, existing module-8 policy — no change needed, see §4 | מנכ"ל + כספים only; masked (not `0`) for the other three |
| KPI: pending quotes | `quotes` — existing policy | מנכ"ל · פרויקטים · כספים (existing gate — גיוס/לוגיסטיקה already blocked from `quotes` everywhere) |
| Click-through: any calendar chip → full project card | Existing route | Everyone who can already open that project |
| Nav: prev/next month, "today", status-filter chips, project-name search | Client-side over the same payload | Everyone |

### Files to touch / reuse

- `src/App.jsx` **⚠️ shared-surface** — swap `<Route index element={<WelcomePage />} />` for the real dashboard component. No `<ProtectedRoute>` wrapper (matches `WelcomePage`'s existing exemption in `App.routes.test.jsx`'s allow-list — §7.10 is therefore already structurally supported, not a new guard exception to add).
- `src/components/StatTile.jsx`, `src/components/Money.jsx`, `src/components/LoadingOrError.jsx` — reuse as-is for the KPI strip (no new tile pattern; §③ shared-component checkpoint below just confirms this).
- `src/components/WelcomePage.jsx` — retired from the route; leave the file (harmless dead code check will flag it if truly unused — confirm with `knip` at the Phase-4 gate rather than deleting pre-emptively).

### Files to create

- `supabase/migrations/<ts>_module7_dashboard_summary_rpc.sql` — the one aggregating RPC (Phase 1; no new RLS policy needed — see §4).
- `src/lib/dashboard.js` + `.test.js` — pure derivations: calendar-day color, masked-value formatting, 90-day window boundary. No Supabase, no clock in the body (per `src/CLAUDE.md`'s `Date.now()` rule — "today" is a parameter).
- `src/modules/07_dashboard/api.js` — the RPC call wrapper, following the module `api.js` convention.
- `src/modules/07_dashboard/DashboardPage.jsx` + `.test.jsx` — the screen itself.
- `src/modules/07_dashboard/CLAUDE.md` — required by `check:context` once the module has code (empty modules are exempt; this one won't be after Phase 3).

### DB tables touched

`projects` (read only, existing policy) · `quotes` (read only, existing policy) · `project_finance`
(read only, **existing module-8 policy, unchanged** — see §4) · no writes, no new tables, no new
columns, **no new RLS policy at all**.

### Dependencies

Module 6 (merged to `dev` ✅) for `projects`/`project_status`. Module 8 (merged ✅) for
`project_finance`/`finance_project_money()`/`deriveExpectedProfit` — all already live and proven
(`project_finance.final_profit = 207.40` verified on project #12).

### 🔑 Test identities (RLS-touching module — mandatory)

Five `E2E_<ROLE>_*` pairs **confirmed present** in `.env.local` this session (counted, not assumed):
`CEO`, `STAFF`, `FINANCE`, `PROJECTS`, `RECRUIT`. ⚠️ **`STAFF`'s mapping to a Hebrew role (`מנהלת
לוגיסטיקה`, most likely, by elimination) was not live-verified this session — confirm at Phase-4
RLS-stress-test time**, don't assume from the name alone. Positive control for the masking test:
`FINANCE` or `CEO` must return the profit figure; `PROJECTS`/`RECRUIT`/`STAFF` must return `null`
(not `0`, not a missing key — see §4).

### Approved visual reference

`docs/specs/module_07_dashboard/dashboard-design-debate.html` — the reasoning trail (why one screen,
why three strips, why masking not removal). The **live working mockup** (sent to Ishay as a file this
session, iterated through four real feedback rounds — chips-not-color-blocks, icons-not-letters,
peak-density legibility, uniform row/column sizing) is the actual visual contract for Phase 3; it was
not committed to the repo as of this writing (scratchpad-only) — **commit it alongside Phase 3 or
before, so a future session doesn't lose the version Ishay actually signed off on** (the exact
failure this project hit twice already tonight with other scratchpad-only files).

---

## 3. 🧭 Decisions Ledger

| §7 / decision | Ruling | Date | Unblocks |
|---|---|---|---|
| `§7.10` | Dashboard accessible to **everyone**, not an RBAC row, no `<ProtectedRoute>` | 01/07/2026 | Route wiring (§4.1) |
| `§7.9` | No urgency-score formula anywhere in the product (list/grid sorted by date-proximity is enough; a manager already knows what's near). **Relevant here:** the calendar sorts by date structurally (it's a grid) but **colors by readiness, not date** — the two are independent, confirmed explicitly during tonight's debate after an analogy to this ruling was raised and found not to apply | 13/08/2026 | Calendar design (§5, step 3.2) |
| `§7.94` (🔗 formalizes §7.18) | Calendar color: 🔴 = shortage (staffing incomplete **or** logistics incomplete) **and** within 14 days · 🟡 = shortage, further out · 🟢 = no shortage. Anchored to existing code — `projects.js:104`'s `ALL_DONE` check already requires both complete; this is its logical inverse, not a new rule | 03/09/2026 | Step 2.1, 3.2 |
| `§7.95` (🔗 formalizes §7.37 window) | Satisfaction KPI window: **90-day rolling**, not calendar quarter | 03/09/2026 | Step 2.1 |
| `§7.96` (🔗 formalizes §7.59) | Monthly-profit population: projects with `final_event_date` in the target month; `final_profit` if closed, else live-expected; **cancelled-and-resolved projects included**, same as the `§7.79` customer-level precedent | 03/09/2026 | Step 1.1, 2.1 |
| `§7.97` | The two money-adjacent KPI cards (profit, pending quotes) are **masked per role, never removed from the screen** — same screen for everyone, role-scoped content, external BI-convention anchor. Confirmed final after a real "maybe remove them entirely" detour that this session (correctly) walked back before it reached Ishay as a settled position | 03/09/2026 | Step 1.1, 2.1, 3.1 |
| `§7.52` (background, built in M8) | Two-number profit model: רווח-צפוי (live, never stored) vs רווח-סופי (frozen at financial close, `project_finance.final_profit`) | 11/07/2026 | Step 1.1 formula reuse |
| `§7.79` (background, built in M8) | Precedent this module's cancelled-project handling copies: a resolved cancellation fee counts as real revenue, frozen the moment it resolves, even though the project never reaches `finished` | 26/08/2026 | Step 1.1 |

No item here contradicts C5/C6; where C5 §5.6.2 is silent (masking, the exact color formula, the
90-day-vs-quarter choice) this ledger is the authority, per the truth-hierarchy's own tier-2 rule.

---

## 4. 🛡️ Security & Auth Model Statement

- **Route guard:** none (§7.10). `App.routes.test.jsx`'s AST scan already exempts the `index` route
  by name — confirm this still passes after the component swap; do not add a new exemption entry.
- **`projects` / `quotes` reads:** unchanged, existing `..._select_by_permission` policies (§7.21
  template) already cover every role that needs them for this screen.
- **`project_finance` read — 🔴 self-caught on re-read, correcting an over-build in the first draft
  of this section: no new table-level policy is needed at all.** The first pass proposed one anyway
  (`project_finance_select_dashboard`, gated to `'כספים'`) — but per the live permission matrix
  (`PROJECT_MASTER.md §3`), `מנכ"ל` already holds `edit` on `'כספים'` and `מנהלת כספים ולקוחות` holds
  `edit` on her own module, which is **the exact same two roles `§7.97` wants** — so a new policy
  with an identical predicate to `project_finance`'s existing module-8 policy would change nothing,
  just duplicate it. **And it wouldn't even be the thing doing the masking:** the aggregating RPC
  (step 1.1) is `security definer`, which bypasses table RLS entirely for its own internal reads —
  so the masking is enforced by the RPC's own in-body permission check, not by any table policy, with
  or without a second one. ⇒ **`project_finance` keeps its existing module-8 policy, untouched.**
  There is no "dashboard" row in `modules`, and per §7.10 there must never be one — irrelevant now
  since no policy needs to gate on it. Phase 1 is therefore **one migration, not two** (§5).
- **The masking contract, stated once so every consuming layer agrees:** a blocked read returns
  **zero rows**, so an aggregate `SUM`/single-row fetch resolves to SQL `NULL`. The RPC (§5, step 1.1)
  passes that `NULL` through **unchanged** — never `coalesce`s it to `0`. `src/lib/dashboard.js`
  formats `null` as `"לא זמין בתפקידך"` (role-masked — a **different** message from the project's
  general "—" no-data-measured convention, because the meanings differ: "—" says nothing was
  measured, this says something exists and you may not see it). The UI renders that as a muted,
  non-numeric card — never `0 ₪`, which would misstate the month as profit-free.
- **No write path** — this module performs zero `INSERT`/`UPDATE`/`DELETE`. No write-policy question
  arises.

---

## 5. 🏗️ Phase & Step Plan

**Model & effort per phase:**

| Phase | Model | Effort | Why |
|---|---|---|---|
| 1 — DB/RLS | Opus | High | One aggregating RPC touching money-shaped data, with its own internal masking; low step-count, needs care not volume |
| 2 — Business logic | Sonnet | Medium | Pure derivation functions, well-specified above |
| 3 — UI | Sonnet | Medium–High | Matches an already-approved, already-iterated mockup closely — less open design work than a typical UI phase, but real RTL/chip/grid detail |
| 4 — Control & integration | Sonnet | Low | One route swap, one RLS stress-test |
| 5 — QA & handoff | Opus | High | Closing audit re-verifies independently, per standing rule |

### Phase 1 — DB/RLS

| Step | Goal · Files · What to do | Verification | 🔻 |
|---|---|---|---|
| **1.0** | Door: no OPEN ledger items anchored to Phase 1 (confirmed — §3 has none marked ⏳) | Re-read §3 in full | 🤖 |
| **1.1** | Migration: `get_dashboard_summary()` RPC, `security definer`, `set search_path to ''`. **No new table policy** — `project_finance` keeps its existing module-8 `'כספים'`-gated policy untouched (§4 explains why one isn't needed). The RPC itself is callable by any authenticated user; masking happens **inside its body**, per field, mirroring how `get_finance_overview` gates itself — here only *part* of the payload is sensitive, so the body branches: call `finance_project_money()`/read `project_finance` only after an inline check of the same `'כספים'` permission, else emit `null` for those two fields. Embed the standard Migration Design Checklist (`db_roadmap.md §1`). Returns: `active_projects_count`, `satisfaction_avg` (nullable), `monthly_profit` (nullable — masked or genuinely no closed-yet data, **distinguish the two in the row shape**, e.g. a sibling boolean `profit_visible`), `pending_quotes_count`, and a `calendar_days` array (`date`, `project_id`, `event_name`, `color`, `staffing_ok`, `logistics_ok`) for the requested month range. **מה ייחשב עובד:** one call replaces what would otherwise be 4-5 client queries; a `PROJECTS`-role call gets real `active_projects_count`/`satisfaction_avg`/`calendar_days` and `profit_visible:false` | Impersonated call, both a `FINANCE` and a `PROJECTS` identity; assert `profit_visible` flips correctly and `monthly_profit` is `null` when it does. Cross-check `active_projects_count` against a hand count from `select count(*) from projects where project_status not in ('cancelled')` (acceptance-oracle rule — never re-author the expected number from the same formula) | 👤 typed-echo (shared Supabase project) |
| **1.2** | Phase-1 gate: advisors clean · `docs/schema.sql` refreshed · `db_roadmap.md` row added for the new RPC | `grep` `schema.sql` for the new function; advisors diff vs. pre-migration baseline (expect **zero** new findings — no new table, no new policy) | 🤖 |

### Phase 2 — Business Logic

| Step | Goal · Files · What to do | Verification | 🔻 |
|---|---|---|---|
| **2.1** | `src/lib/dashboard.js`: `deriveCalendarColor(status, eventDate, today)` (§7.94 — pure, no DB) · `formatMaskedProfit(monthlyProfit, profitVisible)` → `"לא זמין בתפקידך"` vs `formatMoney` · `isWithinRollingWindow(date, today, days=90)` for any client-side re-derivation needed. **מה ייחשב עובד:** unit tests reproduce the §7.94 hero-pair from the seed spec (full-staffing+missing-logistics → red; the reverse → red; both complete → green) once that seed data exists — until then, test with hand-built fixtures matching the same shapes | `npm run test:run`, table-driven cases incl. the 14-day boundary (`§7.94`'s "and" is inclusive — confirm off-by-one against the ruling's own wording) | 🤖 |
| **2.2** | `src/modules/07_dashboard/api.js`: single wrapper `getDashboardSummary(monthStart)` calling the RPC, returning the shape §1.2 defined, `assertFinanceShape`-style guard on the two nullable-but-declared fields (per `projectFinance.js`'s own `undefined`-vs-`null` doctrine — `profit_visible` must never silently vanish) | Unit test with a mocked Supabase client shape | 🤖 |

### Phase 3 — UI

| Step | Goal · Files · What to do | Verification | 🔻 |
|---|---|---|---|
| **3.0** | 🧩 Shared-component checkpoint: confirm `StatTile`/`Money`/`LoadingOrError` cover the KPI strip and skeleton states with **zero new shared components** — the mockup uses only patterns already in `src/components/` | Read the four components, map each mockup element to one | 🤖 |
| **3.1** | `DashboardPage.jsx` shell + KPI strip (4 `StatTile`s; the two masked ones render the muted "not available" state per §4, never `0`) | Live preview screenshot, both a `CEO` and a `RECRUIT` login | 🤖 (screenshot) |
| **3.2** | Calendar grid — per the approved mockup exactly: per-project colored chips (not per-day fill), person/box SVG icons (filled=complete, outline=missing — the colorblind-safe pattern, not color-only), uniform row height and column width (`grid-auto-rows:minmax(...)`, `grid-template-columns:repeat(7,minmax(0,1fr))` — the two CSS bugs this session's mockup review caught, carry the fix forward, don't reintroduce it), prev/next + "today" nav, status-filter chips, name-search. Multi-event days show 2 chips + "+N עוד" | Live preview; the two required hero-pair days (§ה׳ in the seed spec) must render visibly once seed data exists | 🤖 (screenshot) |
| **3.3** | "מה דורש טיפול" strip — derived rows, not a separate query: finished-unbilled (`project_status in ('event_finished','awaiting_invoice')` past a threshold), staffing-short-and-soon (mirrors the red calendar days), quote-expiring-soon (existing `quotes` logic, already built elsewhere — reuse, don't reimplement) | Live preview against seed hero-rows | 🤖 |
| **3.4** | 🔻👤 🎨 UX & functional review — **this gate is largely pre-satisfied** by the four real iteration rounds already completed with Ishay on the live mockup (chip legibility, icon clarity, peak-density stress-test, grid uniformity). Confirm the **built** screen matches the **approved mockup** byte-for-byte in structure; re-open only what changed between mockup and build | Side-by-side screenshot vs. the approved mockup file | 👤 |

### Phase 4 — Control & Integration

| Step | Goal · Files · What to do | Verification | 🔻 |
|---|---|---|---|
| **4.1** | `src/App.jsx` **⚠️ shared-surface**: swap `WelcomePage` → `DashboardPage` at the `index` route. No new `<ProtectedRoute>`. `git grep` any other OPEN micro-guide for `App.jsx` before editing (rule 16) | `App.routes.test.jsx` still passes; manual nav to `/` as each of the 5 identities | 🤖 |
| **4.2** | RLS stress-test, impersonated, 5 identities incl. the `STAFF`-role confirmation flagged in §2. Positive control first | 5×(KPI visibility + calendar renders + attention-strip renders), tabulated | 🤖 |

### Phase 5 — QA & Handoff

| Step | Goal · Files · What to do | Verification | 🔻 |
|---|---|---|---|
| **5.1** | Full regression: `npm run gate`, `test:e2e`, `smoke` | Exit codes + counts, all three named explicitly (per `_shared/discipline.md`'s citation table — "tests are green" must name which suite) | 🤖 |
| **5.2** | 🔻👤 Closing audit — `module-close` skill, **fresh session**, typed-echo DoD sign-off | Full closing-audit report | 👤 |

---

## 6. 📊 QA Matrix

| Type | Planned coverage | As-run |
|---|---|---|
| Unit | `dashboard.js` derivations (color rule, masking format, 90-day window) | — |
| Integration | `api.js` wrapper against a mocked RPC shape | — |
| E2E | Nav to `/` as each of 5 roles; masked-card assertion for 3 of them; calendar click-through to a project card | — |
| Regression | Full suite green, zero new failures | — |
| Security/Pen | RLS stress-test (Phase 4.2), positive control mandatory | — |
| Usability | End-of-Phase-3 🎨 gate — largely pre-satisfied by the live mockup's 4 iteration rounds | — |
| Compatibility | Standard RTL/dark-mode checks per `src/CLAUDE.md`'s five-pass discipline | — |

---

## 7. ✅ Definition of Done

- [ ] `get_dashboard_summary()` RPC applied, `profit_visible` flips correctly per role (2 allow-identities, 3 deny-identities — no separate table policy exists to test, per §4)
- [ ] `docs/schema.sql` + `db_roadmap.md` updated in the same commit as the migration (DB protocol)
- [ ] All 4 KPI cards show correct values against a known seed project (hand-computed, not re-authored from the same formula)
- [ ] Calendar color matches §7.94 for both hero-pair days
- [ ] Masked cards render "לא זמין בתפקידך", never `0 ₪`, for the 3 non-finance roles
- [ ] `/` route accessible to all 5 roles, no `<ProtectedRoute>` regression
- [ ] 🎨 UX & functional review passed — built screen matches the approved mockup
- [ ] Full regression green: `gate` · `test:e2e` · `smoke`, all three named with counts
- [ ] `WelcomePage.jsx`'s removal-or-keep decided (knip check, not a guess)

**Post-merge (not audit blockers):** PR opened, CI green, merged to `dev`.

---

## 8. 🔄 Self-Update Protocol

(a) Update the status header + step table at every step transition, same session.
(b) Any deviation gets an inline `↳ as-built` note + a line in §9.
(c) The Stop hook blocks session end if `src/modules/07_*` changed without this guide changing.
(d) End-of-session protocol per root `CLAUDE.md` (log → STATUS).
(e)–(g): per CLAUDE.md iron rules 13/15/16 + end-of-session protocol.
(h) On entering each phase, sweep §3 for anything anchored to it before the first step (currently:
nothing anchored beyond what's already ruled).
(i) Compact each phase to a done-table on close; never compact the active phase, §3, or §9.

---

## 9. 📝 Deviations & Tech-Debt Log

- **03/09/2026 — branch name.** Built on the shared `ishay/m7-blueprint-and-seed` branch, not the
  step guide's `ishay/module-7-dashboard`. Not fixed here — Ishay's call whether to rename before
  Phase 1 starts or update the ⑥2/⑥3 handoff prompts to match reality.
- **03/09/2026 — no Discovery folder.** By Ishay's explicit ruling, not an omission — recorded so a
  future reader doesn't read the absence as a skipped step.
- **03/09/2026 — the approved mockup lives only in scratchpad as of blueprint-writing time.** Flagged
  in §2 as a same-class risk to the two files already rescued into git tonight; commit it before or
  during Phase 3, not after.
