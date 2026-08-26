# Module 5 — לוגיסטיקה · Build Micro-Guide

> Written for a future Claude session with zero memory of the blueprint conversation. English
> throughout; Hebrew only as data (DB values, UI strings, §7 quotes). **This guide IS the approved
> plan** — build sessions execute it directly (iron rule 2: no extra planning round).

## 1. 🟢 Live Status Header

| | |
|---|---|
| **Module** | 5 — לוגיסטיקה (Logistics) |
| **Branch** | `ishay/module-5-logistics` *(exists — carries the whole Discovery + this blueprint; verified live 25/08/2026, ahead of `origin/dev`, NOT merged — `git log origin/dev..HEAD` non-empty)* |
| **Owner** | Ishay (sole developer) |
| **Status** | 🔨 **BUILD — Phases 1+2 ✅ COMPLETE (2.3 gate closed 26/08/2026 11:4X).** Phase 1: migrations A–D + two-mode seed live, commit `eb17b19`. **Phase 2 (agent workflow — 2 Opus builders → 3-lens adversarial panel → fixers): 17 queue-derivation exports + 43 tests in `projectLogistics` · the 5-function api layer + 27 tests · 11 panel findings (4 actionable) all fixed · gate 1,341/51 = baseline+70, zero regressions · live anchors = contract-3.** Phase-3 door (3.0) closed with Ishay's approvals in hand (O-1/O-4/O-5 + both briefs, "מאשר את הכל" 10:29). *(Earlier:)* 📘 BLUEPRINT APPROVED — Ishay, `25/08/2026 23:35`. |
| **Last updated** | `26/08/2026 11:4X` *(system clock)* — phase 2 committed; phase-3 screen workflow launching (2 builders + 3-lens panel per screen, ruling-conflict rule armed). |
| **Active step** | **3.1 + 3.2** (screen workflow) → 3.3 route swap (orchestrator) → **3.4 — the 🎨 gate, Ishay's stop** |
| **Deadline** | interim presentation **28/08 — a FRIDAY** (module 5 demo-ready is the stretch goal Ishay named; 🔄 **run the seed REFRESH that morning** — the 02:00 cron closes the "today" demo project overnight, step 1.5) · conference **01/10** (target: 100%) |

**Legend:** 🔻 stop-point · 🤖 Claude verifies alone · 👤 human (Ishay) gate · 🚧 cross-module debt (§6) · ⏳ deferred decision · 🕓 freshness stamp · 🔗 tagged §7 mirror · 🧩 handoff prompt · 🧊 frozen file · 🔮 future checkpoint · 🗡️ DB Design Challenge
**Step status set:** ⬜ pending · 🔨 in progress · ✅ done · ⏸️ deferred (with target module) · ❌ blocked (with reason)

| Step | Title | Status |
|---|---|:--:|
| **1.0** | Phase-1 door — ledger sweep + live-state re-measurement | ✅ 26/08 |
| **1.1** | Migration A — `logistics` hardening (M5-1 · M5-2 · M5-5 · M5-8 + `actual_qty_autofilled`) | ✅ 26/08 |
| **1.2** | Migration B — approve-RPC origin+color fill & backfill (M5-3) | ✅ 26/08 |
| **1.3** | Migration C — checklist write RPC (M5-6) | ✅ 26/08 |
| **1.4** | Migration D — `apply_scope_change`: status reset + zero-as-removal (M5-4 · M5-7) | ✅ 26/08 |
| **1.5** | Demo-data seed (Ishay's 22/08 ruling) | ✅ 26/08 |
| **1.6** | 🔻👤 Phase-1 gate — advisors · schema.sql regen · db_roadmap §10 · commit | ✅ 26/08 |
| **2.0** | Phase-2 door — ledger sweep | ✅ 26/08 |
| **2.1** | Queue derivations in `src/lib/projectLogistics.js` + tests ⚠️ shared-surface | ✅ 26/08 |
| **2.2** | `src/modules/05_logistics/api.js` — reads + RPC call + tests | ✅ 26/08 |
| **2.3** | 🔻👤 Phase-2 gate — full unit suite + hand-computed anchors | ✅ 26/08 |
| **3.0** | Phase-3 door — shared-component checkpoint + OPEN-item sweep (O-1 nod) | ✅ 26/08 |
| **3.1** | Surface 1 — `/logistics` overview page (🗣️ brief → build → verify) | ⬜ |
| **3.2** | Surface 2 — checklist dialog incl. cancelled variant (🗣️ brief → build → verify) | ⬜ |
| **3.3** | Route swap in `App.jsx` ⚠️ shared-surface | ⬜ |
| **3.4** | 🔻👤 Phase-3 gate — 🎨 UX & functional review | ⬜ |
| **4.1** | M6 ripple — `LogisticsTab` notes column (㉒) ⚠️ shared-surface | ⬜ |
| **4.2** | M6 ripple — `ScopeChangeDialog`: item_status display · dynamic floor · strings (㊳②③④) ⚠️ | ⬜ |
| **4.3** | Doc ripples — AR-4 fix · §6 debt consumption · automations register · ripple sweep | ⬜ |
| **4.4** | E2E + smoke + accessibility for both surfaces; full regression | ⬜ |
| **4.5** | 🔻👤 Phase-4 gate | ⬜ |
| **5.1** | Live acceptance journey on seeded data (credentialed, screenshots) | ⬜ |
| **5.2** | 🔻👤 Closing audit — `module-close` in a FRESH session | ⬜ |

---

## 2. 📦 Context Packet

### 2.1 Purpose (≤3 lines)

The logistics manager (דנה ברק) turns an approved sales spec into goods in the right place on event
day: she **orders · receives · marks · notes** — never adds/edits/removes items. Two surfaces
(`M = 2`): the `/logistics` work-queue (with the outbound section on top) and a per-project
checklist **dialog**. When the last item is `ready` and staffing is full, the project advances to
`מוכן לביצוע` by M6's DB trigger — module 5 never writes `project_status`.

### 2.2 Capabilities delivered vs deferred

| # | Capability | M5 delivers | Deferred | §6 twin |
|:-:|---|---|---|---|
| 1 | Work-queue `/logistics` — outbound section (㉓·㊷) · 3 pills (㉙·㉛) · amber mark (⑳+㊶) | ✅ full | — | — |
| 2 | Checklist dialog — status/qty/note/expected-date, per-row instant save, completion banner (⑬), cancelled lock (㉝·㊴·㊲) | ✅ full | — | — |
| 3 | Writers for the three writer-less columns + `expected_arrival_date` (via M5-6 RPC only) | ✅ full | — | — |
| 4 | Her notes visible to the projects manager (㉒ — M6 tab column) | ✅ full | — | — |
| 5 | Item removal = typing `0` in M6's scope-change dialog, two-condition guard, history row (㊳·㊱·㉖) | ✅ full (M5-7 + dialog ripples) | — | — |
| 6 | Origin pointer + color on logistics rows born from quote approval, incl. backfill (M5-3 · M5-5) | ✅ full | — | — |
| 7 | Demo data living in the DB, relative dates (Ishay 22/08: *"פשוט שיהיה את הנתונים במערכת"*) | ✅ seed script | — | — |
| 8 | Lateness/profitability reporting on the recorded data | ❌ records only | 🚧 מ11 (M8 consumes through it — §7.22's own routing) | `🚧 מ11 ← מ5` ×2 (already registered — verify live, do not re-add) |
| 9 | Supplier entity · "יצא" checkbox | ❌ rejected with reasons (⑤·⑨, `הנחתי` — reopen without ceremony) | — | — |

**Roles on every module-5 screen** *(measured live in the permission matrix, re-verified 25/08/2026)*:
מנהלת לוגיסטיקה = edit · מנכ"ל = edit · מנהלת פרויקטים = view (write controls **removed**, values as
text) · מנהלת גיוס / מנהלת כספים = blocked (no access to `/logistics` at all).
🔴 **Rule (ENFORCED — iron rule 15 + Stop hook):** any new 🚧 token written into this guide gets a
byte-matching `🚧 מN ← מ5` line in `PROJECT_MASTER §6` in the same session, then
`grep '🚧 מN' docs/PROJECT_MASTER.md`. Current expectation: **no new §6 debt** beyond the two
`🚧 מ11 ← מ5` lines that already exist — re-count live at 4.3, do not trust this sentence.

### 2.3 Existing files to touch (the module's whole non-additive surface)

| File | Change | Step |
|---|---|:--:|
| `approve_quote_and_create_project` (live DB function; latest body written by `20260812204405_fix_approve_rpc_cost_source_regression.sql`) | fill `quote_service_line_id` + `color` in its logistics INSERT; backfill migration for existing rows | 1.2 |
| `apply_scope_change` (live DB function; body in `20260814142440_module6_rpcs_writes.sql`) | reset `item_status` on qty increase (M5-4); accept `0` as removal for `target='logistics'` (M5-7); replace the `v_new_qty <= 0` message (grep anchor: `להסרת פריט לגמרי`) | 1.4 |
| `src/lib/projectLogistics.js` + `projectLogistics.test.js` | additive: queue derivations + new locked strings (§3.7) | 2.1 |
| `src/App.jsx` | swap `UnderConstruction` → `LogisticsPage` inside the existing `<ProtectedRoute allow="לוגיסטיקה">` (App.jsx:167-174) | 3.3 |
| `src/modules/06_projects/LogisticsTab.jsx` + `LogisticsTab.test.jsx` | show `notes` (㉒) — measured 22/08: `notes` appears 0 times in the component while `getProjectLogistics` already `select('*')` | 4.1 |
| `src/modules/06_projects/ScopeChangeDialog.jsx` + `ScopeChangeDialog.test.jsx` | show `item_status` on logistics rows · dynamic spinner floor (`min={0|1}`) replacing the hard `min="1"` (`QtyInput`, ScopeChangeDialog.jsx — grep `min="1"`) · per-row refusal explanation lines · client validation string synced byte-for-byte with the new raise | 4.2 |
| `docs/micro_guides/module-6.md` | fix `AR-4` (*"the row is never deleted"* — false once M5-7 lands); **note its header guard** (*"must not fix back"* — predates ㊳; reconcile with a dated additive note citing ㊳ + M5-7, never a silent rewrite) | 4.3 |
| `docs/specs/module_06_projects/screens-approved.md` | dated note where the deleted error string is quoted (grep `להסרת פריט לגמרי`) | 4.3 |
| `docs/automations.md` | add the new RPCs (M5-6, and the M5-3/M5-4/M5-7 function rewrites as updates) | 4.3 |
| `e2e/smoke.spec.js` + `e2e/smoke-anchors.json` | add `/logistics` screen + count-based anchors (never date-based — seed dates move daily) | 4.4 |

Everything else is **additive**: new module folder, new migrations, new columns/policies, seed
script, new E2E spec.

### 2.4 Files to create

```
src/modules/05_logistics/
  api.js                     — reads (projects · logistics · products) + the M5-6 RPC call
  LogisticsPage.jsx          — surface 1 (outbound section + pills + queue)
  ChecklistDialog.jsx        — surface 2 (dialog, both variants)
  SegmentedControl.jsx       — local status control (AS-9; no house component exists — measured)
  CLAUDE.md                  — module mines file (written at close, module-close §4c)
src/lib/
  (no new file — projectLogistics.js is the logistics-domain SSOT, extended additively; AR-8)
supabase/migrations/
  <ts>_module5_logistics_hardening.sql        (A — M5-1 · M5-2 · M5-5 · M5-8 + autofilled flag)
  <ts>_module5_approve_rpc_origin_backfill.sql (B — M5-3 + backfill)
  <ts>_module5_checklist_rpc.sql              (C — M5-6)
  <ts>_module5_scope_change_reset_removal.sql (D — M5-4 · M5-7)
supabase/seed/
  module5_demo_data.sql      — idempotent demo seed (AS-1/AS-2; NOT a migration — DB protocol
                               forbids test data in migrations)
e2e/
  logistics.spec.js          — both surfaces, permission branches, write-path via interception
```

### 2.5 DB tables and migrations

- **`logistics`** (owner) — live shape verified 25/08/2026: 11 columns · PK `(project_id, sku,
  serial_number)` · CHECKs `planned_qty > 0`, `item_status ∈ {not_started,ordered,ready}`,
  `logistics_origin_exactly_one` · **one policy only** (`logistics_select_by_permission`, SELECT) ·
  **no** `actual_qty` CHECK · **no** color/arrival columns. 6 rows, origin pointers 0/6.
- **Reads only:** `projects` (read policy exists, gate `'פרויקטים'` — she is `view`) · `products`
  (`using(true)` select) · `quote_services` (via RPC internals only — she is `blocked` on the module).
- **Never touched:** `project_status` (M6's trigger owns it — inherited contract item 2) ·
  `project_changes` (written only inside `apply_scope_change`).
- Registry rows: `db_roadmap.md` block **"Module 5 (logistics)"** — M5-1…M5-8 (M5-6 widened and
  M5-8 extended 25/08/2026). **Always re-read the block live before Phase 1.**

### 2.6 Dependencies

- M3 + M6 merged and live (verified: `apply_scope_change`, recompute trigger, read policy all live).
- The inherited seven-item contract `🚧 מ5 ← מ6` (`PROJECT_MASTER §6`, grep `🚧 מ5 ← מ6`) — items
  2/3/4/7 already delivered by M6 (see the ➕ update line under the מ11 rows); items 1 (pointer
  writer) and the write-policy half of 7 are THIS module's work; item 5 closed (§7.31), item 6
  reconciled (⑳ informs, never blocks — same wording in three places).
- `businessDaysUntil` + `isLateChange` (`src/lib/projectChanges.js`) · `logisticsMetric` ·
  `proximitySentence` · `filteredOutSentence` (`src/lib/projects.js`) · the locked vocabulary
  (`src/lib/projectLogistics.js`). **Never write a second counter or a second day-calculator.**

### 2.7 🔑 Test Identities

- 5 seeded users; resolve `role→email→user_id` LIVE from `users join roles`, never hard-code.
  Measured 25/08/2026: **דנה ברק = מנהלת לוגיסטיקה** (`logistics.test@regin.co.il`) · **נועה כהן =
  מנהלת פרויקטים** (`projects.test@regin.co.il`).
- RLS impersonation — 🔴 **THREE parts, and the third is the one everyone forgets (G3,
  rehearsal-measured):** in ONE `execute_sql` call: ‏(1) `set_config('request.jwt.claims',
  json_build_object('sub', <user_id>, 'email', <email>)::text, true)` — both keys (house recipe;
  note: every module-5-relevant function resolves identity via `auth.email()`, so `email` is the
  load-bearing key) · ‏(2) **`set local role authenticated;`** — the MCP connection is `postgres`
  with `rolbypassrls = true`, so WITHOUT the role switch **RLS is never engaged and every
  negative control silently passes in the wrong direction** · ‏(3) the query. The positive
  control does NOT catch a missing role switch — it passes either way.
- **Positive control before trusting any zero:** Dana (known-`edit`) must read ≥1 logistics row;
  0 there = broken impersonation, NOT working RLS. Negative control only after the positive passes.
- UI creds in `.env.local` — measured 25/08/2026 (names only, values never printed): `E2E_CEO_*` ·
  `E2E_STAFF_*` · `E2E_FINANCE_*` · `E2E_PROJECTS_*` · `E2E_RECRUIT_*` — **five pairs, all exist.**
  🔴 **`E2E_STAFF_*` IS the logistics manager** (`e2e/customers.spec.js:10` — "STAFF (=מנהלת
  לוגיסטיקה)"; points at `logistics.test@regin.co.il`). There is no `E2E_LOGISTICS_*` — do not
  invent one and do not report the pair missing.

### 2.8 Product source of truth

**Tier 2 — the approved spec — outranks C5/C6 and outranks `docs/mockups/`, per-item, for
everything it actually covers:**

- `docs/specs/module_05_logistics/spec.md` — entry point; §① is the mandatory ordered reading list
  (**including the 25/08 addendum rows 15–17** — ripple targets, house components, DB protocol);
  the locked-vocabulary contract; the testable numbers; the cross-module table; **§"🚫 מה אסור
  לבלופרינט לנחש"** — read before every phase.
- `docs/specs/module_05_logistics/processes-approved.md` — **the only ruling file in the folder.**
  42 rulings ①–㊷ · 7 process cards 🔄א–ז · measured DB facts 🧱①–⑨ · the 30-req ledger · the
  🎓 conference rationales.
- `docs/specs/module_05_logistics/screens-approved.md` — 2 screen cards, 9 sections each.
  **Content-approved 25/08/2026** (scope + two changes recorded in its header: no StatTiles;
  ㊷ exit rows clickable). Includes the 25/08 arrival-column contract block (surface 2 §③).
- `docs/mockups/logistics-screen/approved/01_overview_approved.html` ·
  `02_dialog_checklist_approved.html` — **HTML, read them; appearance is final.** Known drawn
  glitches (recorded in the card, do NOT reproduce): future "הגיע בפועל" date · `-` vs `—` mix ·
  the enabled date-input in the cancelled view (behaviour: locked, ㊴).
- `docs/specs/module_05_logistics/design-contract.md` (colors are ONLY there — §1.2/§1.3 two teals,
  §2 fill rule, §5 components, §6 feminine grammar) · `data-set.md` (which rows are drawn; the
  seed's value source; **dates are distance-demos — the seed derives from `current_date`**) ·
  `world-sources.md` (conference answers).
- `docs/db_roadmap.md` block "Module 5 (logistics)" · `PROJECT_MASTER.md` §3 (matrix) + §6 (grep
  `🚧 מ5 ← מ6`, `🚧 מ11 ← מ5`) · `docs/PROJECT_MASTER_sec7.md` items 7.22 · 7.31 · 7.41 · 7.44.
- Arbitration (same rule as M4/M6): mockup wins on APPEARANCE · card wins on BEHAVIOUR/DATA/
  PERMISSIONS/STATES · neither → stop and ask Ishay.

🚫 **Not a product source:** `discovery-log.md` (evidence/narrative) · the retired
`01.png`/`02.png` (ruling ① — zero credibility) · M4's mockups (opposite coloring logic) ·
`mockup-data.md` of M6 §6️⃣ (two rows measured stale — `#7` went `ready` 21/08).

### 2.9 Environment facts

`@/supabaseClient` (NOT `@/lib/…`) · dev `npm run dev` :5173 · full RTL, physical utilities only ·
Supabase project `Reg-In` ref `yfeovxppnfoafmfbdfvh` (Postgres 17) · migrations via MCP
`apply_migration` after the typed-echo gate; `execute_sql` read-only for schema, allowed for the
seed's data writes after the 1.5 👤 gate · `moddatetime` lives in `extensions.` (NOT `public.`) ·
`revoke … from public, anon, authenticated` (public alone leaves `anon` granted) · **before every
`CREATE OR REPLACE FUNCTION` on an existing function: pull the live body via
`pg_get_functiondef`** — building from an old migration file already broke quote-approval once
(12/08, `supabase/migrations/CLAUDE.md`).

---

## 3. 🧭 Decisions Ledger

**Reading key.** `Ishay` = his ruling, quoted and dated — binding. `Claude (delegated)` = ruled
under explicit delegation — may be reopened without ceremony. `Claude (technical)` = no product
meaning. `OPEN` = still his, anchored to the step it blocks.

### 3.1 Product & process rulings

**The SSOT is `processes-approved.md §3` — 42 rulings ①–㊷. This guide cites, never restates.**
The ones that shape steps directly are wired into the steps below by number. Highest-risk five,
by number: ㉕ (`actual_qty` editability + autofill-only-if-zero) · ㉟ (`טרם החל` with qty>0 is
legal — render the field's value, never a hard 0) · ㊱ (removal = two conditions) · ㊲ (dialog
re-reads project status on open) · ㊴ (cancelled lock exempts `actual_qty` only).

### 3.2 Architecture rulings

| # | Ruling | Who | Anchor | Unblocks |
|:-:|---|---|---|---|
| AR-1 | **Every module-5 write goes through an RPC** — zero `.from().update()` in module-5 code | Ishay (㉑) | `🧱④` measured: the DB does not enforce M6's status rules; only an RPC can | 1.3, 2.2 |
| AR-2 | **M5 never writes `project_status`** — M6's trigger is the only writer | inherited (`🚧 מ5 ← מ6` #2, §7.44) | trigger live: `logistics_recompute_project_status` (`20260814141052`) | all |
| AR-3 | **Surface 1 = three direct reads** (`projects` + `logistics` + `products`), no new read-RPC; branch ① (no-permission) whenever `projects` returned rows and `logistics` returned zero; both empty ⇒ branch ① too (fail toward "maybe blocked") | Claude (delegated — approved in the 25/08 round, string pack) | `src/lib/projects.js` (grep `ה-RPC אינו מחזיר מונה ordered`): `list_projects_overview` returns ready/total only — pills/amber/reasons need full rows; card §④ defines the two-gate discriminator | 2.2, 3.1 |
| AR-4 | **Per-row instant save; no save button** | Claude (technical, forced) | `🧱⑤`: trigger has no WHEN/OF ⇒ bulk saves serialize on `FOR UPDATE` | 1.3, 3.2 |
| AR-5 | **Seed derives every date from `current_date`** — `#105`=today · `#106`=next business day · `#107`=+12 | Ishay (22/08) | `data-set.md §📅`; hard dates expire on 28/08 02:00 | 1.5 |
| AR-6 | **M5-3 backfills unambiguous existing rows; M5-7 resolves price pointer-first with the existing `(quote_id, sku)`+`count>1 ⇒ raise` fallback** | Claude (technical) | 6/6 live rows are approval-born, unambiguous (measured 25/08); ㉗ keeps scope-change rows NULL | 1.2, 1.4 |
| AR-7 | **㊵'s tag is carried by `logistics.actual_qty_autofilled boolean`** — durable, not client state | Claude (delegated mechanism for Ishay's ㊵) | ㊵'s rationale is financial; a session-only tag evaporates on refresh | 1.1, 1.3, 3.2 |
| AR-8 | **Queue logic extends `src/lib/projectLogistics.js` additively** (logistics-domain SSOT; M6 imports stay untouched) — no new lib file | Claude (technical) | iron rule 14; the file already carries the locked vocabulary | 2.1 |
| AR-9 | **Raise-text ↔ client-validation-text is a byte contract** — change both sides together (`apply_scope_change` strings) | inherited (M6 house rule) | `src/modules/06_projects/CLAUDE.md`: "העתק-בייט של ה-raise" | 1.4, 4.2 |
| AR-10 | **Zero-as-removal is scoped to `target='logistics'` only** — `hostess_count` keeps rejecting ≤0 | Claude (technical) | `projects_required_hostess_count_check > 0`; removal of the hostess line is not a thing | 1.4 |

### 3.3 Surface rulings (from the 25/08 content-approval round)

| # | Ruling | Who |
|:-:|---|---|
| S-1 | **No StatTiles on surface 1.** A tile earns its place only when it carries a decision-changing number not already on screen; here every count lives in the pills and the queue is the metric | Claude (delegated — Ishay: "מה שהכי נכון לדעתך") |
| S-2 | The three new strings (queue no-permission · empty outbound section · write-failure) approved verbatim — locked in §3.7 | Ishay |
| S-3 | Surface-1 pack approved: columns (`אירוע·מתי·מוכנות·מצב·מה חסר`) · outbound wordings · amber form (row bg + ⏱ + legend) · avatar `--teal600` · sort caption · pill counters · disabled-pill title · amber/gray reason lines · two-week req covered by sort+amber+outbound | Ishay |
| S-4 | **㊷ — outbound-section rows ARE clickable** (open the checklist dialog; no record-keeping control in the section) | Ishay (direction) + checked |
| S-5 | Surface-2 pack approved: tag+segmented control together · 768px width · placeholder · two explainer lines · both banners · negative-qty message · layout choices · conscious omissions | Ishay |
| S-6 | **Cancelled project: expected-arrival field LOCKED** (㊴ — only `actual_qty` stays open; the mockup's enabled input is a drawn glitch) | Ishay (approved 25/08) |
| S-7 | Empty outbound section STAYS on screen with its sentence — never disappears | Ishay (in S-2 pack) |

### 3.4 🔗 §7 mirrors

- `🔗 מראת §7.22 — SSOT: PROJECT_MASTER §7`: shortage does not block `ready`; non-blocking visual
  indication required (the `285/300` gap display).
- `🔗 מראת §7.31 — SSOT: PROJECT_MASTER §7`: cancellation touches nothing in `logistics`; rows are
  billing evidence; no fourth item status.
- `🔗 מראת §7.44 — SSOT: PROJECT_MASTER §7`: `project_status` is written by an atomic DB trigger
  (M6-built, ownership re-ruled 08/08), with a status guard. *(Separately-tagged MEASUREMENT, not
  part of the §7.44 mirror: the live guard computes only in `not_started/in_progress/ready` —
  `recompute_project_status`, `20260814141052:49` / `🧱④`.)* M5 must not bypass it or write status.
- §7.41: the M5-2 CHECK was nodded 22/08 (module-5 half); the `category != 'hostess'` derivation
  sub-item is implemented-and-awaiting-nod — **do not mark §7.41 closed.**

### 3.5 OPEN — still Ishay's, anchored

🔴 **THIS TABLE IS THE ONLY ROUTE TO A RULING** (M6 convention). A finding that needs a decision
goes HERE or into a phase-door sweep list; a finding that needs an action goes into a STEP. §10 is
a log nobody reads for rulings.

| # | Item | Anchored to | Ask when |
|:-:|---|---|---|
| ~~O-1~~ | ✅ **CLOSED — Ishay 26/08/2026 10:29 ("מאשר את הכל", Phase-3-door round).** Approved wording: *"ההגעה מתעכבת — הובטח ל-`DD/MM` וטרם הגיע"* (date from `expected_arrival_date`; wired as one const in 2.1) | — | done |
| O-2 | The two teals (`--primary #0D9488` vs `bg-teal-600 #009689`) — system-wide color call, rule 8 | none (build imitates the existing screen per design-contract) | M12 / whenever Ishay wants |
| O-3 | ⏸️ ⑨ "יצא" checkbox · ⑤ suppliers — closed with `הנחתי`, reopen without ceremony when the missing fact lands | — | — |
| ~~O-4~~ | ✅ **CLOSED — Ishay 26/08/2026 10:29 (same round).** Approved: banner body corrected to *"אין לעדכן מצב או הערה בפרויקט מבוטל."* (the drawn *"מצב, כמות או הערה"* contradicted ㊴) **plus** the visible sentence *"אפשר עדיין לרשום כמות שהגיעה — שאר הפקדים נעולים."* | — | done |
| ~~O-5~~ | ✅ **CLOSED — Ishay 26/08/2026 10:29 (same round; born from the mockup-vs-data gap found 26/08).** Undrawn count-forms approved: in-transit reason **`{N} יחידות עדיין בדרך`** / `יחידה אחת עדיין בדרך` (the drawn `80 שרוכים` is not data-derivable — "יחידות" replaces it) · `פריט אחד טרם הוזמן` (1) · numeral `N פריטים טרם הוזמנו` (N≥3; the dual `שני פריטים טרם הוזמנו` stays as drawn) · `✓ מוכן` for a fully-ready row in `הכול` | — | done |

### 3.6 Assumptions (spec-silent)

| # | Assumption | Basis |
|:-:|---|---|
| AS-1 | Seed home `supabase/seed/module5_demo_data.sql`; runner = the build session via MCP `execute_sql`, **only after the 1.5 👤 gate**; idempotent via **TWO MODES — create-once + refresh, never delete-recreate** (the §7.50 quote lock makes deletion impossible; G1, Ishay approved 25/08) | migrations protocol forbids test data in migrations; 21/08 precedent of MCP data fixes |
| AS-2 | Seed path: create demo **quotes** (customers 47/48/213 — real), approve via `approve_quote_and_create_project` under נועה's impersonation ⇒ projects + logistics rows born through the real mechanism (origin pointers + color filled by M5-3 — which is also its live regression proof); then data-level UPDATEs for item states/notes/dates; **assignments inserted as data** (`finally_approved`, distinct hostesses, `event_date` = the project's date) and the trigger derives `project_status` — status is never set by hand (M6 rule) | `projects.quote_id NOT NULL` (measured); `src/modules/06_projects/CLAUDE.md` status-machine rule |
| AS-3 | **`#103` (cancelled) is NOT seeded.** The seed ruling names three projects; a pre-cancelled project is unreachable from the UI anyway (not in any pill, and the dialog is not a route) — seeding it demonstrates nothing. The cancelled variant is proven by E2E interception (4.4) and can be demoed live by cancelling a project through M6's dialog | ruling scope + reachability measurement |
| AS-4 | Demo project IDs are allocated by the DB (next identity values), NOT forced to 105/106/107 — no screen shows project numbers; the labels are narrative | card §③: "אין על המסך… מספרי-פרויקט" |
| AS-5 | Empty arrival cell renders `—` (unified); auto-stamped arrival is always ≤ today | recorded in screens card 25/08 |
| AS-6 | `נקי סינון` — feminine call-site override of the shared `נקה סינון` default (the shared default is untouched; changing it is the registered `🚧 מ12`) | mockup comment + ㉜ |
| AS-7 | Column header `מוכנות` (the 22/08 mockup-comment ruling) — the stale `התקדמות` mentions in the card lose | mockup:284 comment |
| AS-8 | M5-6 payload = jsonb `p_changes` with present-key semantics (house precedent: `apply_scope_change` jsonb lines); returns the updated row + the recomputed `project_status` so the dialog can show the completion banner without a second round-trip | contract fixed in step 1.3 |
| AS-9 | `SegmentedControl` is a **local** module-5 component (single consumer; the 🧩 rule's 3-surface bar not met) | shared-component checkpoint 3.0 |
| AS-10 | Arrival-stamp semantics: every transition INTO `ready` stamps `actual_arrival_date = current_date` (+ autofill logic per ㉕/㊵); transition OUT of `ready` via M5-6 clears it; M5-4's scope-change reset touches `item_status` only (its ruling text) and the stale date is invisible in `not_started` display | ㊶ + ㉟ + display contract |

### 3.7 🔤 Locked UI strings — the build session copies, never re-derives

| Concept | 🔒 The one string | Source |
|---|---|---|
| Item statuses | `טרם החל` · `הוזמן` · `מוכן` | `LOGISTICS_STATUS_LABELS` — merged; `resolveLogisticsTone` throws on anything else |
| Checklist sort caption | `ממוין: מה שרחוק ביותר ממוכן — תחילה` | `SORT_LINE` — merged |
| Queue sort caption | `ממוין: לפי קרבת האירוע` | S-3 (approved 25/08) |
| Empty states (checklist) | `LEGAL_EMPTY_TITLE` · `LEGAL_EMPTY_DETAIL` · `NO_PERMISSION_SENTENCE` · `BROKEN_EMPTY_DETAIL` · `LOAD_FAILURE_DETAIL` — verbatim from `projectLogistics.js`; three are test-locked, **`LEGAL_EMPTY_DETAIL`/`LOAD_FAILURE_DETAIL` are not — extend the lock test to all queue-relevant strings while there (cheap, prevents silent rewording)** | merged + S-2 |
| Queue no-permission | `אין לך הרשאה לצפות בפריטי הלוגיסטיקה, ולכן לא ניתן לקבוע אם התור ריק כדין.` → new const `QUEUE_NO_PERMISSION_SENTENCE` + uniqueness test | S-2 (Ishay 25/08) |
| Empty outbound section | `אין אירוע שיוצא עד יום העסקים הבא.` | S-2 |
| Write failure | `העדכון לא נשמר — הערך הוחזר לקודם. נסי שוב.` | S-2 |
| Negative qty | `כמות בפועל אינה יכולה להיות שלילית.` | S-5 |
| Note placeholder | `הערה חופשית — מה שכדאי שמנהלת הפרויקטים תדע` | S-5 |
| Explainers under the table (quoted in full — a pointer here hid the ㊵ teaching line once) | `כל שינוי נשמר מיד — אין כפתור שמירה במסך.` · `סימון מוכן ממלא את הכמות בפועל אוטומטית, רק אם עדיין לא הוקלד בה ערך. וערך שמולא כך נושא לידו את הכיתוב "מולא אוטומטית" — שנעלם ברגע שהיא מקלידה. מספר שהקלדת לעולם אינו נדרס.` | S-5 (mockup verbatim) |
| Auto-fill tag | `מולא אוטומטית` | ㊵ |
| Removal refusals (M6 dialog + M5-7 raise, byte-identical both sides) | `הפריט כבר הוזמן — לא ניתן להסירו` · `הגיעו כבר פריטים — לא ניתן להסיר` | ㉚·㊱ (processes 🔄ה) |
| Cancelled-lock titles | `הפרויקט בוטל — לא ניתן לעדכן` (controls) · `הפרויקט בוטל — אך אפשר לרשום סחורה שהגיעה (㊴)` (actual_qty) | mockup (appearance-final) |
| M5-6 closed-event raise | `האירוע כבר הסתיים — לא ניתן לעדכן את הלוגיסטיקה שלו.` | Ishay 25/08 (G4) |
| Hostess-qty raise (server + client, byte-identical) | `כמות הדיילות חייבת להיות גדולה מאפס.` | Ishay 25/08 (G5 · AR-9) |
| New-item-zero raise (server + client) | `כמות של פריט חדש חייבת להיות גדולה מאפס.` | Ishay 25/08 (G11b) |
| The seeded demo note (`#107`/1; also written into `data-set.md`) | `הוזמן בבית-הדפוס — הובטחה אספקה בתחילת השבוע הבא.` | Ishay 25/08 (G6) |
| Unresolvable-price removal raise (㉗-class corner; no demo path) | `לפריט אין שורת-מחיר מקושרת — לא ניתן להסירו מהמסך.` | Claude (delegated) — nod batched at the 4.2 🗣️ gate |
| Disabled pill title | `אין כרגע פרויקט במצב הזה` | S-3 |
| Retry | `נסי שוב` — 🔴 **passed explicitly as `retryLabel="נסי שוב"` at EVERY `LoadingOrError` call site**: its default is masculine `נסה שוב` (`LoadingOrError.jsx`, the `🚧 מ12` note) and `PermissionAwareEmpty`'s `RETRY_LABEL` is a non-exported const — nothing importable | card §④-② (*"חייב לעבור במפורש"*) |
| Amber legend | mockup verbatim (⏱ שורה בענבר…) | S-3 |
| Banners (cancel · completion) | mockup verbatim | S-5 |
| Second-amber reason | ✅ `ההגעה מתעכבת — הובטח ל-DD/MM וטרם הגיע` | O-1 — approved 26/08/2026 |
| In-transit reason (queue/outbound) | ✅ `{N} יחידות עדיין בדרך` · `יחידה אחת עדיין בדרך` · prefix `יוצא היום —` / `יוצא ביום {weekday} —` | O-5 — approved 26/08/2026 |
| Not-ordered counts | ✅ `פריט אחד טרם הוזמן` · `שני פריטים טרם הוזמנו` (drawn dual) · `N פריטים טרם הוזמנו` (N≥3) · fully-ready in `הכול` ⇒ `✓ מוכן` | mockup + O-5 |
| Cancel-banner ㊴ sentence | ✅ `אין לעדכן מצב או הערה בפרויקט מבוטל.` + `אפשר עדיין לרשום כמות שהגיעה — שאר הפקדים נעולים.` | O-4 — approved 26/08/2026 |

### 3.8 🔴 Ruling-coverage ledger — the decision-coverage back-check (denominator = the registry)

**Every ruling ①–㊷ maps to exactly one of: an owning step · already-delivered (inherited/merged) ·
an explicit deferral · a not-a-build-item note.** Walked ruling-by-ruling 25/08/2026:

| Rulings | Owner |
|---|---|
| ① ⑤ ⑧ (cut) · ⑨ ("יצא") | not-a-build-item (rejections; O-3) |
| ② (§7.22 display) · ㉕ ㊵ | steps 1.3 (RPC semantics) + 3.2 (display) |
| ㉟ (`טרם החל` with qty>0 is legal) | 1.4 (M5-4 resets status ONLY) + 1.3 (RPC never zeroes) + 3.2 (render the field's value) |
| ③ (two rows same/similar SKU) | display 3.2 + a unit fixture. 🔴 **The seed does NOT prove ③** — `#107` rows 1+3 are DIFFERENT SKUs (`B-REG-TAG`/`B-ECO-TAG`); the same-SKU-two-colors case is zero in the DB (`🎓⑱`) and `apply_scope_change` refuses to create it. The real carrier is the `color` column (M5-5) + the fixture |
| ④ (text tags) ㉘ (layout separation) ㉜ (feminine) | 3.1 + 3.2 (design contract) |
| ⑥ ㉔ (M=2, dialog) ⑦ (section not surface) ⑲ ㉙ ㉛ (pills) ⑳ + ㊶'s second trigger (amber) ㉓ (outbound window) | 2.1 (derivations) + 3.1 (render) |
| ㊶ (the two arrival dates — full body) | 1.1 (M5-8 columns) + 1.3 (M5-6 writes expected · stamps actual) + 3.2 (the three-state column) + 2.1/3.1 (second amber trigger) |
| ㉚ (blocked control stays, reasoned) | 3.1 (disabled pill) + 3.2 (disabled `actual_qty` in `טרם החל`; cancelled controls) + 4.2 (dynamic floor + explanation line) + 1.4 (matching raises) |
| ⑩ (ordered meaning) ⑬ (message not gate) | 1.3 (RPC) + 3.2 (banner) |
| ⑪ ⑫ ⑱ (ripples) | 1.1 (⑱'s column = M5-5) + 1.2 (⑫ pointer + ⑱'s fill = M5-3) + 1.4 (⑪ = M5-4) |
| ⑭ (01WEB in her checklist) | inherited — derivation live (`🧱①`); amber exemption in 2.1 |
| ⑮ (notes writer) ㉒ (notes reader) | 1.3 + 4.1 |
| ⑯ (history visible, no money) | inherited — M6 built it; regression only |
| ⑰ ㉖ ㊱ ㊳ ㉚ (removal) | 1.4 (M5-7) + 4.2 (dialog ripples) |
| ㉑ (RPC-only) ㉞ (gates) | 1.1 + 1.3 + 1.4 (AR-1) |
| ㉗ (origin ceiling) | declared — `🚧 מ11 ← מ5` registered; 1.2's backfill does NOT touch it |
| ㉝ ㊲ ㊴ (cancelled lock + re-read + exception) | 1.3 (guard) + 3.2 (variant) |
| ㊷ (outbound rows clickable) | 3.1 |

*(The "not-happening" register — `processes-approved.md §5`, heading **`מסלולים שנשללו כ"לא-קורה"`**
— is empty; nothing to map.)*

---

## 4. 🛡️ Security & Auth Model Statement

### 4.1 Policy table — exact `module_name` strings

| Table | Policy | Gate string | State |
|---|---|---|---|
| `logistics` | `logistics_select_by_permission` (SELECT, `edit|view`) | `'לוגיסטיקה'` | ✅ live (M6-6) — **M5 inherits, never recreates** |
| `logistics` | **`logistics_write_by_permission`** — `for all to authenticated`, identical `exists(…)` in `using` AND `with check`, `permission_level = 'edit'`, `(select …)` initplan wrap | `'לוגיסטיקה'` (㉞ — `'פרויקטים'` would lock the module owner out; she is `view` there) | ⬜ M5-1, step 1.1 |
| `projects` | read policy (M4-era) | `'פרויקטים'` | ✅ live — surface 1 reads it |
| `products` | `products_select_all_authenticated` (`using(true)`) | — | ✅ live — category read for the amber physical-item test |

### 4.2 The RPC layer (why policies alone are not the model)

- `update_logistics_item` (M5-6) and `apply_scope_change` (M5-7) are `SECURITY DEFINER` ⇒ **RLS
  does not gate them; their internal permission check does** (M5-6: `edit` on `'לוגיסטיקה'`;
  `apply_scope_change` keeps its `'פרויקטים'` gate — ㊳ moved removal to the projects manager).
- `search_path = ''` + schema-qualified names + `revoke execute … from public, anon, authenticated`
  then `grant … to authenticated` — the M4 revoke-anon lesson (`20260809174501`).
- **Status guard lives in the RPC, not the DB** (`🧱④` — the recompute guard silently skips;
  the write still lands). M5-6 raises on non-active projects, with ㊴'s single exception
  (`actual_qty` on `cancelled`).

### 4.3 The silent-zero doctrine (this module's core risk)

A blocked read/write returns **0 rows with `error: null`** — byte-identical to "empty". Therefore:
every write path asserts affected-rows (the RPC raises internally; the client treats a non-row
response as failure with the S-2 message and reverts the on-screen value) · surface 1's branch
order is **no-permission FIRST** (AR-3's discriminator) · the E2E negative tests run only after the
positive control passes (2.7).

### 4.4 UI gates

`<ProtectedRoute allow="לוגיסטיקה">` already wraps the route (App.jsx:167-174; `App.routes.test.jsx`
fails on an unguarded screen). `view`-role: write controls **removed** (not disabled) — values
render as text; state-blocked controls (cancelled) stay **disabled + reasoned** (㉚ split, card §⑤).

### 4.5 Declared limitations

> ① **M5-1 permits at the DB layer what ㉑ forbids at the client layer** — an `edit`-holder could
> write **or DELETE** `logistics` rows directly via REST (`for all` grants all four verbs — and
> delete is the one capability ㊳ deliberately moved OFF the logistics manager), bypassing the
> RPC's guards (the DB-level status guard silently skips recompute but the write lands, `🧱④`).
> Accepted: M5-1 is an Ishay-approved
> register row aligning the table with the house pattern; ㉑ is a code rule (zero direct writes in
> `src/`), enforced by review + the E2E write-path going through the RPC only. Recorded so the
> closing audit does not re-discover it.
> ② **No rate limiting / no audit trail on the RPC** — internal tool, 5 users, same acceptance as
> every other module RPC (§7.23 deferred).
> ③ **Write-path automated coverage is bounded** — same single-live-DB constraint as M2–M4
> (`🚧 מ12 ← מ4`): E2E intercepts writes; the real write path is proven in 5.1's live journey and
> the seed's RPC round-trip.

---

## 5. 🗡️ DB Design Challenge

> One line per sub-check, including the ones that found nothing, so a session that ran all eight is
> distinguishable from one that skipped them.

| Sub-check | What was examined | Finding |
|---|---|---|
| **Keys & mutability** | `logistics` PK `(project_id, sku, serial_number)` vs M5-7's delete + scope-change re-add | ✅ אין ממצאים — serial is `max+1` per project (server-allocated); a deleted serial is not reused and nothing references logistics rows by serial from outside |
| **Relationships & lineage** | origin pointers vs M5-7's `NOT NULL` price snapshots | 🔴 **Finding → AR-6:** all 6 live rows have NULL pointers; M5-7's pointer-first resolution would raise on every legacy row. **Fix: M5-3's migration backfills unambiguous approval-born rows** (measured: 6/6 qualify) and M5-7 keeps the `(quote_id, sku)` + `count>1 ⇒ raise` fallback. ㉗'s scope-change rows stay NULL — declared, registered (`🚧 מ11 ← מ5`) |
| **Lifecycle & writers** | the three writer-less columns · state transitions · time anchors | 🔴 **Finding → M5-6 scope widened 25/08** (expected_arrival_date had no writer; caught by the simulated build). Transition writers now fully named: M3-RPC births rows · M5-6 writes her four fields + stamps/clears arrival · M6 trigger derives project status · M5-4 resets on increase (one column only, ㉟) · M5-7 deletes under the two-condition guard |
| **Screen-to-column audit** | every number on both approved mockups + cards, walked surface-by-surface | 🔴 **One displayed figure had no data home:** the `הגעה משוערת` column (drawn in 3 states, zero behaviour rows in the card) — **fixed 25/08**: contract block added to the card; M5-8/M5-6 are the home. Everything else resolves (readiness = `logisticsMetric` · gap = `planned−actual` · business days = `businessDaysUntil` · customer name = `projects.customer_name`, never a join) |
| **Derived vs stored** | what freezes vs what stays live | ✅ אין ממצאים — readiness/pills/amber all derived at read; stored: the two dates (M5-8) + `actual_qty_autofilled` (AR-7). Nothing double-stored |
| **Permissions ↔ RLS** | gate strings per surface/RPC · cross-module writes | ⚠️ **The M5-1↔㉑ tension** — declared limitation §4.5① · M5-7 writes money snapshots she cannot read — correct by design (㊳ moved the actor to the projects manager) · gates: `'לוגיסטיקה'` (M5-1/M5-6) vs `'פרויקטים'` (M5-7) — the ㉞/㊳ split, stated so nobody "fixes" it |
| **Files/Storage · temporal · checklist** | column types · storage · the §1 migration checklist | ✅ אין ממצאים — `date` (not timestamptz) for both arrival dates matches `final_event_date` calendar-day semantics; no storage; `numeric` not needed; each Phase-1 step embeds the checklist + advisors run |
| 🔮 **Answerable-later** | what M5 does NOT record | ‏(א) repeated-action overwrite: לא רלוונטי — no resend-like action; notes are hers to overwrite · ‏(ב) transition times: the KNOWN questions ("late? promised when? arrived when?") are answered by M5-8; `ordered_at` deliberately NOT added — no known question needs it, adding later is one cheap column (reopen trigger: an M11 question about order-to-arrival lead time) · ‏(ג) keys: arrival data is per-row ✅; profitability joins via M5-3's pointer ✅ except ㉗'s class — already registered |

**Before deriving anything from C5/C6, read `db_roadmap.md` §9** (known reference-spec defects).

---

## 6. 🏗️ Phase & Step Plan

### Model & effort per phase

| Phase | Model | Effort | Why |
|---|---|---|---|
| 1 — DB & seed | Opus | High | four migrations, two of them rewrites of MERGED M3/M6 functions on a shared live project; the seed writes real data |
| 2 — logic | Opus | High | the pill/amber/window derivations are the module's brain; anchors must reproduce |
| 3 — UI | Opus | Medium | 2 surfaces, both drawn and approved — fidelity + states |
| 4 — ripples & integration | Opus | Medium | touches merged M6 UI + its tests; E2E authoring |
| 5 — closing audit | Opus | High | independent re-verification in a fresh session |

**Recommended agent-batching (Ishay runs Opus ultracode builds, 2–8 steps per workflow):**
Phase 1 = ONE session, sequential (four typed-echo gates cannot be parallelized; agents may draft
SQL, the session applies). Phase 2 = one workflow (2.1+2.2 parallel, gate after). Phase 3 = two
build agents (3.1 · 3.2) + adversarial verification panel (M6's pattern), then 3.3. Phase 4 = two
agents (4.1+4.2 · 4.4) + 4.3 in the main session. Phase 5 = fresh session.

**Global conventions for every step below**
- **Seven fields per build-unit step:** Goal in the title · **Files** · **What to do** ·
  **🔻 Verify** (command + expected output) · 🤖/👤 · **`מה ייחשב עובד`** (quoted from the approved
  spec, never re-authored) · empty **`🗣️ אושר —`** · plus the **`🌊 אדוות —`** slot (closed with
  ripples or `אין` before the step closes).
- `⚠️ shared-surface` steps: grep every other OPEN micro-guide for the file first (today: none
  open — verify), shape changes additively.
- Hebrew code comments why-first (iron rule 3). Baseline before Phase 1:
  `npm run test:run` → record the passing count live; every later step compares against it.
- **DB steps embed the Migration Design Checklist (`db_roadmap.md` §1) and end with a Supabase
  advisors run** (zero new findings or a written triage note). Typed-echo before every apply.
- 🔴 Run gates without a pipe or with `set -o pipefail`.

---

### Phase 1 — DB & seed

> 🛑 **Phase-1 blocker table — the execution rehearsal (25/08/2026) found 15 gaps; ALL CLOSED
> 25/08 into their owning steps. Rows kept so nobody re-opens a settled question:**
>
> | Gap | Was | Closed by |
> |---|---|---|
> | G1 seed idempotency vs the §7.50 quote lock (**BLOCKER** — delete-recreate raises `הצעה נעולה` on rerun) | 1.5 | **two-mode seed** (create-once + date-refresh; Ishay approved 25/08) — in 1.5 |
> | G2 nightly decay (cron 02:00 closes the "today" project) + no re-run policy | 1.5 | refresh-every-demo-morning routine — in 1.5 + §1 Deadline row |
> | G3 RLS verification could not fail (MCP runs as `postgres`, `rolbypassrls`) | 1.1/§2.7 | `set local role authenticated` added to the impersonation recipe |
> | G4 M5-6 closed-event raise had no text | 1.3 | string approved (§3.7) |
> | G5 hostess-raise reword had no text (AR-9 byte contract) | 1.4/4.2 | string approved (§3.7) |
> | G6 the demo note had no source | 1.5 | string approved (§3.7 + written into `data-set.md`) |
> | G7 seeded `ready`/`ordered` rows had no arrival-date values | 1.5 | value table added (mirrors the approved arrival contract) |
> | G8 autofilled qty on leaving `ready` — two incompatible readings | 1.3 | contract: autofilled ⇒ revert to 0 + flag false; typed ⇒ kept (㉕+㊵ read together) |
> | G9 `expected_arrival_date` validation unstated | 1.3 | contract lines added |
> | G10 M5-6 return keys unnamed | 1.3 | `{row, project_status}` pinned |
> | G11 three M5-7 failure messages unstated | 1.4 | contract + strings (§3.7) |
> | G12 A→B migration ordering implicit | 1.2 | stated |
> | G13 ~12 seed values with no source | 1.5 | value table added |
> | G14 does the backfill fill `color`? | 1.2 | pointer only; stated (zero live impact — measured) |
> | G15 §4.5① omitted DELETE exposure | §4.5 | sentence extended |

**Step 1.0 · 🔻🤖 Phase door — sweep & re-measure**
**What to do:** sweep §3.5 (O-1 belongs to Phase 3 — confirm nothing anchored here) · re-read
`db_roadmap` block M5 + `supabase/migrations/CLAUDE.md` · re-measure live: policies on `logistics`
(expect 1), `pg_constraint` on `logistics` (no actual_qty CHECK), origin pointers (0/6), the five
demo-relevant projects' statuses — **if anything moved since 25/08, update this guide first.**
Record the unit-test baseline count.
**🔻🤖 Verify:** the measurements above, reported. **🌊 אדוות —** אין (nothing moved since 25/08; baseline 1,271 recorded in §10). **🗣️ אושר —** covered by Ishay's session-opening scope approval (26/08).

**Step 1.1 · Migration A — `module5_logistics_hardening`**
**Files:** `supabase/migrations/<ts>_module5_logistics_hardening.sql`
**What to do (one migration, Hebrew why-header):**
1. **M5-1** — write policy, the house template (exact skeleton — load-bearing):
```sql
create policy "logistics_write_by_permission" on public.logistics
  for all to authenticated
  using (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'לוגיסטיקה')
      and p.permission_level = 'edit'))
  with check (<identical exists(...)>);
```
2. **M5-2** — `alter table logistics add constraint logistics_actual_qty_check check (actual_qty >= 0);`
3. **M5-5** — `color text` nullable + a CHECK **byte-matching `quote_services_color_check`**
   (לבן·שחור·אפור·טורקיז·כחול — Ishay 21/08: no new colors).
4. **M5-8** — `expected_arrival_date date` · `actual_arrival_date date` (both nullable) ·
   `actual_qty_autofilled boolean not null default false` (AR-7).
**🔻👤 Typed-echo gate, then apply via MCP.**
**🔻🤖 Verify:** `pg_policies` shows 2 policies on `logistics` · `pg_constraint` shows the new
CHECKs · columns exist with right types · **negative control** (with the FULL §2.7 recipe incl.
`set local role authenticated` — without it the control silently passes wrong, G3): impersonate
נועה (`view`) → `update logistics set notes='x' … returning *` ⇒ 0 rows; **positive:** דנה ⇒ 1 row
(then revert) · advisors: no new findings.
**מה ייחשב עובד** *(spec §"מה אסור לנחש" #1, quoted)*: ‏1. *"כל כתיבה חייבת `.select()` ובדיקת
מספר-שורות"* — הבסיס שהמדיניות הזאת נותנת לו משמעות. ‏2. ‏`C6 §2.4.13`: *"כמות בפועל … ≥ 0"* נאכף
במסד. **🌊 אדוות —** done 26/08: db_roadmap M5-1/2/5/8 → ✅ · schema.sql refreshed (logistics block + policy). **🗣️ אושר —** Ishay 26/08, one-time blanket typed-echo (§10).

**Step 1.2 · Migration B — `module5_approve_rpc_origin_backfill` (M5-3) ⚠️ merged-M3 code**
**Files:** migration only.
**What to do:** pull the LIVE body via `pg_get_functiondef` — **resolve the real signature first;
the rehearsal measured it as `(integer)`, not `(bigint)`**; extend its logistics INSERT (current
4-column shape measured 25/08 at `20260812204405:75-78`) to also select `qs.line_id` →
`quote_service_line_id` and `qs.color` → `color`. Then the **backfill** (AR-6): one UPDATE filling
`quote_service_line_id` ONLY (G14 — `color` stays NULL on legacy rows; measured: all 9 relevant
`quote_services.color` are NULL anyway, zero visual impact) for rows whose `(project→quote, sku)`
match is unique; scope-change rows and ambiguous rows untouched (㉗).
⚠️ **Ordering dependency (G12):** this migration writes `logistics.color`, which Migration A
creates — **A applies before B, always**, including under any agent-batched drafting.
**🔻👤 Typed-echo → apply.**
**🔻🤖 Verify:** `select count(*) from logistics where quote_service_line_id is not null` → **6** ·
🔴 **full-body diff** (reviewer finding): keep the pre-edit `pg_get_functiondef` output, diff it
against the post-apply body — the ONLY delta is the INSERT's two new columns; VAT, `product_costs`
sourcing, the quote `FOR UPDATE`, `required_hostess_count` derivation all byte-identical *(this is
the function whose rewrite already broke quote-approval once, 12/08)* · run
`npx playwright test e2e/quote-approval.spec.js` NOW, not only at 4.4 · advisors clean. *(The
forward-fill is proven live by the seed's approvals in 1.5 — check pointers ≠ NULL there.)*
**מה ייחשב עובד** *(processes 🔗-table row 1 + `M5-3`, quoted)*: ‏1. *"`approve_quote_and_create_project`
ימלא `quote_service_line_id`"*. ‏2. *"העמודה בפועל היא `quote_service_line_id` והיא קיימת. אין
ליצור עמודה שנייה."* **🌊 אדוות —** done 26/08: db_roadmap M5-3 → ✅ · schema.sql function pointer moved to the new migration · quote-approval E2E re-run (6 passed). **🗣️ אושר —** Ishay 26/08 (blanket, §10).

**Step 1.3 · Migration C — `module5_checklist_rpc` (M5-6)**
**Files:** migration only.
**What to do — the CONTRACT (two builders alone would diverge here; the body is the builder's):**
- `public.update_logistics_item(p_project_id int, p_sku text, p_serial_number int, p_changes jsonb)
  returns jsonb` · `security definer` · `search_path=''`.
- `p_changes` present-key semantics (AS-8); allowed keys exactly: `item_status` · `actual_qty` ·
  `notes` · `expected_arrival_date`. Unknown key ⇒ raise (feminine Hebrew).
- Guards, in order: auth present → internal permission `edit` on `'לוגיסטיקה'` (㉞; use the
  house-pattern check `approve_quote_and_create_project` uses) → row `FOR UPDATE`, raise if absent
  → **project-status guard:** status ∉ `{not_started,in_progress,ready}` ⇒ raise
  (`הפרויקט בוטל — לא ניתן לעדכן` for cancelled / a closed-event wording for the rest) **except**:
  `cancelled` + payload contains ONLY `actual_qty` ⇒ allowed (㊴).
- Validations: `item_status` ∈ the three values · `actual_qty` integer ≥ 0 (raise with the S-5
  string **before** the CHECK does, so the screen shows Hebrew) · over-planned allowed (card §⑦).
- Semantics: transition INTO `ready` ⇒ if current `actual_qty = 0` and payload has no `actual_qty`
  ⇒ autofill to `planned_qty` + `actual_qty_autofilled = true` (㉕·㊵); stamp
  `actual_arrival_date = current_date`. **Transition OUT of `ready` (G8, ruled 25/08):** clear
  `actual_arrival_date` (AS-10), **and if `actual_qty_autofilled` is true — revert `actual_qty`
  to 0 + flag false** (an auto-filled number was never measured, ㊵'s finance rationale; ㉕ protects
  only values SHE typed — a typed value is kept). Any manual `actual_qty` write ⇒
  `actual_qty_autofilled = false`. A no-op status click writes nothing (card §①).
- **`expected_arrival_date` rules (G9):** writable only when the row is — or becomes, in the same
  payload — `ordered` (validated against the NEW status); past dates allowed (㊶'s second amber
  trigger depends on them); kept on `ready` (the promise's history — not displayed there); a
  not_started write raises (㉑ — guards live on the server, the UI merely hides the field).
- **Closed-event guard string (G4, Ishay 25/08):** the non-active, non-cancelled statuses raise
  **`האירוע כבר הסתיים — לא ניתן לעדכן את הלוגיסטיקה שלו.`** (cancelled keeps its ㉝ title string;
  the ㊴ exception is unchanged).
- Returns (G10 — pinned; §9(i) names this a carry-forward contract): `jsonb` with exactly two
  keys — **`row`** (the full updated logistics row, all columns) · **`project_status`** (text,
  re-selected after the UPDATE — the recompute trigger fires synchronously) — so the client shows
  the ⑬ banner and the ㊲-consistent state without a second query.
- `revoke … from public, anon, authenticated; grant execute … to authenticated;`
**🔻👤 Typed-echo → apply.**
**🔻🤖 Verify (SQL, impersonated):** דנה: mark a `#3` row `ordered` → returns row + status
`in_progress` (the first-human-action rule — say it out loud, `🔄ב`); revert to `not_started` →
project returns to `not_started` (reversible formula) · mark `ready` with qty 0 → autofilled=true,
qty=300, arrival stamped · revert → arrival cleared · נועה (view) ⇒ raise `42501`-class · negative
qty ⇒ the S-5 Hebrew raise · **leave `#3` exactly as found (revert everything).** Advisors clean.
**מה ייחשב עובד** *(spec ✅-chapter, quoted)*: ‏1. *"היא נכנסת לפרויקט, מסמנת `הוזמן`, מקלידה כמות
שהגיעה, וכותבת הערה"*. ‏2. *"כתיבה שנחסמה אינה מדווחת 'נשמר'"*. ‏3. ㉕: *"ערך שהיא הקלידה לעולם
אינו נדרס"*. **🌊 אדוות —** done 26/08: db_roadmap M5-6 → ✅ · schema.sql §24 gained the module-5 function block. **🗣️ אושר —** Ishay 26/08 (blanket, §10).

**Step 1.4 · Migration D — `module5_scope_change_reset_removal` (M5-4 + M5-7) ⚠️ merged-M6 code**
**Files:** migration only.
**What to do:** pull the LIVE body via `pg_get_functiondef`. Two changes in `apply_scope_change`:
- **M5-4:** in the existing-row logistics path (grep the UPDATE at `20260814142440:752-758`), when
  `v_delta > 0` also `item_status = 'not_started'` — **and nothing else** (never `actual_qty`, ㉟).
  A decrease resets nothing.
- **M5-7:** replace the blanket `if v_new_qty <= 0 then raise` (line ~660, grep
  `להסרת פריט לגמרי`) with target-scoped logic (AR-10): for `target='logistics'` + existing row +
  `v_new_qty = 0` ⇒ **removal**: guard `item_status='not_started' AND actual_qty=0` — on violation
  raise the matching locked string (`הפריט כבר הוזמן — לא ניתן להסירו` for ordered/ready ·
  `הגיעו כבר פריטים — לא ניתן להסיר` for not_started+qty>0, §3.7); on pass: write the
  `project_changes` row (delta = −current planned; price/cost via pointer, fallback per AR-6;
  reason already mandatory — reuse M6's message) **then delete the logistics row**, atomically.
  The DELETE branch of the recompute trigger updates project status (measured live:
  `20260814141052:95-101`, and the trigger fires `after insert or update or delete` —
  `:124-126`). ⚠️ **Placement (rehearsal-measured):** the blanket raise currently sits ABOVE the
  target/serial parsing — the zero-branch must move BELOW it, where `v_target`/`v_is_new` are
  known. For `hostess_count`, `v_new_qty <= 0` raises the approved string (G5, Ishay 25/08):
  **`כמות הדיילות חייבת להיות גדולה מאפס.`** — AR-9: update the client mirror in 4.2 in the same
  PR, byte-identical.
- **The three failure paths (G11, contract):** ‏(a) removal of a row whose pointer is NULL AND
  `(quote_id, sku)` matches 0 lines (the ㉗ scope-change-born class — price unresolvable) ⇒ raise
  **`לפריט אין שורת-מחיר מקושרת — לא ניתן להסירו מהמסך.`** *(delegated corner-copy — no demo path
  reaches it; flagged for the 4.2 🗣️ nod batch)* · ‏(b) a NEW row with `target_qty = 0` ⇒ raise
  **`כמות של פריט חדש חייבת להיות גדולה מאפס.`** (Ishay 25/08; client mirrors) · ‏(c) when the
  pointer resolves cleanly, the `(quote_id, sku)` `count>1 ⇒ raise` check is SKIPPED — the pointer
  IS the disambiguation.
**🔻👤 Typed-echo → apply.**
**🔻🤖 Verify:** grep the new function def: the old string `להסרת פריט לגמרי` **absent**, the two
refusal strings present · advisors clean. 🔴 **The behavioural round-trips (reset-on-increase ·
removal · both refusals) run in 1.5's rider on seeded rows — never on the 6 real rows.** State
explicitly in this step's report that behaviour verification is deferred to 1.5 and confirmed
there.
**מה ייחשב עובד** *(processes 🔄ה, quoted)*: ‏1. *"מותר להסיר אך ורק שורה שגם `item_status =
'not_started'` וגם `actual_qty = 0`. שני התנאים, תמיד."* ‏2. ‏`C5 §5.6.8` (via M5-4): *"הלוגיקה
משנה את הסטטוס שלו חזרה ל'בתהליך'"*. ‏3. *"ההסרה נרשמת בהיסטוריה כמו כל שינוי-תכולה."*
**🌊 אדוות —** done 26/08: db_roadmap M5-4+M5-7 → ✅ · schema.sql pointer moved · behaviour round-trips ran in 1.5's rider as planned (stated in 1.4's report and confirmed there). The 4.2/4.3 client-string + doc ripples stay owned by Phase 4 (unchanged). **🗣️ אושר —** Ishay 26/08 (blanket, §10).

**Step 1.5 · Demo-data seed — TWO-MODE (Ishay approved 25/08/2026, after the rehearsal's G1)**
**Files:** `supabase/seed/module5_demo_data.sql` (new; committed to the repo).
🔴 **Why two modes and never delete-recreate (G1, measured):** the seed APPROVES its demo quotes,
and `quotes_lock_non_in_progress` + `quote_services_lock_non_in_progress` (§7.50) raise on ANY
update/delete of a non-`in_progress` quote; `projects.quote_id` is `ON DELETE RESTRICT`; no
delete-quote RPC exists; `session_replication_role` is `42501` for this connection; and disabling
triggers is forbidden DDL. **Delete-recreate cannot re-run. Nothing is ever deleted.**
**What to do (contract — AS-1/AS-2/AS-3/AS-4):**
- **CREATE mode** (demo projects absent, identified by the three fixed event names): the full path
  below.
- **REFRESH mode** (they exist): slide dates forward via `update_project_details` (the ONLY
  sanctioned path — it reactivates a cron-closed project via its future-date branch; if it refuses
  same-day on reactivation, two-step it: tomorrow → today. Emails are client-side by AR-5/M6, so a
  SQL call sends nothing) · re-assert assignment rows to `finally_approved` + `event_date` = the
  new project date (the RPC's ㉑-of-M6 approval reset is expected — the seed re-asserts) · re-assert
  the logistics item states/qtys/notes/dates to the value table below. **Quotes untouched** (their
  `estimated_event_date` goes stale — displayed nowhere in M5; declared).
- 🔄 **Standing routine: run the seed (refresh) on the morning of ANY demo** — the 02:00 cron
  closes the "today" project overnight (G2). On Friday 28/08 the screen will honestly read
  `היום: שישי` with the outbound window reaching Sunday — approved 25/08.
- Dates from `current_date` (AR-5): `#105`=today · `#106`=next business day (א׳–ה׳ logic) ·
  `#107`=+12 days. `#107`'s expected date for the ordered row = +6 days.
- **Value table (G7/G13 — everything `data-set.md` does not carry; approved/delegated 25/08):**
  quotes via the real `create_quote`/`replace_quote_lines` RPCs (they price the lines —
  `closing_unit_price` is NOT NULL and only the RPC path fills it correctly) · hostess SKU `04ST`
  (all three events are 4-hour, data-set times) with qty **4/4/2** · `applied_customer_discount 0`
  · `estimated_guests` = the tag quantity (300/200/150) · assignments: `assignment_number 1`,
  `hourly_rate_snapshot` copied from a live assignment row (measure, don't invent) ·
  **arrival data:** `ready` rows get `actual_arrival_date` = today −2 business days (always ≤
  today — the mockup's future-date glitch is not reproduced) · `ordered` rows get
  `expected_arrival_date` = the project's event date (`#107`/1: +6 per data-set) ·
  `actual_qty_autofilled` = **true** where actual==planned (`#105`/2 300, `#106`/1 200, `#107`/3
  50 — the drawn `מולא אוטומטית` tag), **false** for typed partials (285 · 120) · the ONE note
  (`#107`/1, §3.7: *"הוזמן בבית-הדפוס — הובטחה אספקה בתחילת השבוע הבא."*) · removal-rider row:
  SKU `REG-TAG` qty 25, `not_started`/0.
- 🔴 **The demo QUOTES must satisfy the approve-RPC's preconditions** *(read live from its body —
  `20260812204405:30-56`)*: `quote_status='in_progress'` · `estimated_event_date >= current_date`
  · **≥1 hostess line with qty > 0 — `required_hostess_count` is DERIVED from that sum**, so the
  hostess-line qty IS the staffing target: **4 (`#105`) · 4 (`#106`) · 2 (`#107`)** · product
  lines per `data-set.md §4` · every SKU has a `product_costs` row (the 11-SKU catalog does).
- Path: demo quotes for customers 47/48/213 → approve via the real RPC under נועה's impersonation
  (⇒ logistics rows born with pointers+color — M5-3's live proof) → UPDATE item states/qtys/notes
  per `data-set.md §4` (`#105`: ready 285/300 + ready 300/300 · `#106`: ready 200/200 + ordered
  120/200 · `#107`: the four-row star incl. `01WEB`) → INSERT `finally_approved` assignments —
  **4 · 4 · 1** (`#107` is `1 מתוך 2`, data-set §4) — `event_date` = the project's date,
  respecting `assignments_one_event_per_day`, so the trigger derives `ready`/`in_progress` —
  **status is never set by hand.**
- 🔴 **Hostess exclusion list:** read `e2e/smoke-anchors.json` live and never assign a hostess
  named in it — the smoke anchors pin those names' screen state, and `#107` (+12) will land on
  real anchor dates as the calendar moves (reviewer finding).
- `#103` NOT seeded (AS-3).
- **Removal round-trip rider (reviewer finding — 1.4 cannot verify removal before rows exist):**
  seed ONE extra removable row on `#107` (5th row, `not_started`, qty 0), run `apply_scope_change`
  with `0` against it as נועה → row deleted + `project_changes` row with reason+snapshots; assert
  the contract numbers AFTER it is gone (back to 4 rows). Also assert the two refusal raises on
  the ordered row and on a qty>0 row (transient, reverted).
**🔻👤 Gate: show Ishay the script's plan (what will be written to the live DB) and get approval,
then run via MCP `execute_sql`.**
**🔻🤖 Verify — the spec's testable numbers (contract-3), by SQL:** pills **3 · 1 · 5** · outbound
**2** rows (`#105` today · `#106` next business day) · amber **only `#107`** · `#107` checklist
**4 rows, 1/4 ready** · `#105` project_status **`ready`** (derived!) · `#106` **`in_progress`** ·
new rows carry origin pointers · the removal round-trip above · **run the script a second time
(now REFRESH mode) → identical contract numbers, and `select count(*)` on
`projects`/`quotes`/`assignments`/`logistics` before vs after shows delta 0** (idempotency proof —
nothing deleted, nothing duplicated).
**מה ייחשב עובד** *(Ishay 22/08, quoted)*: *"בסוף צריך מה שיראה טוב והגיוני ביום ההצגה ב-28.8"* —
המבחן אינו "הסקריפט רץ" אלא "המסך נראה נכון בכל יום שפותחים אותו".
**🌊 אדוות —** done 26/08: seed committed to `supabase/seed/` · §10 entry (timezone fix — Israel-local "today") · demo IDs are `#13/#14/#15` (allocated by the DB per AS-4; the `#105/#106/#107` labels in all docs remain narrative names). **🗣️ אושר —** Ishay approved the write-plan in chat ("מאשר הכל לפי המלצתך", conditional on the migrations — condition met and stated).

**Step 1.6 · 🔻👤 Phase-1 gate**
**Files:** `docs/schema.sql` · `docs/db_roadmap.md` §10 + M5 rows
**What to do:** regenerate `docs/schema.sql` from `pg_catalog`/`information_schema` (the 14/08
protocol — Claude's job, no browser) · advisors full run (security + performance) with triage
note · `db_roadmap` §10 Done-rows + M5-row flips · commit migrations+schema+seed together
(pathspec, never `git add -A`).
**🔻👤 Verify:** `npm run gate` → exit 0 · baseline unit count unchanged · present the phase
package to Ishay. **מה ייחשב עובד:** DoD §8.1 items 1–3.
**↳ as-built (26/08/2026 09:36):** the commit (`eb17b19`) landed in the phase-1 session; the gate
run + doc flip landed here (a session boundary split the step — resume-from-disk caught it).
Gate: exit 0, 1,271/50 = baseline. **🌊 אדוות —** אין (all ripples closed in 1.1–1.5 slots; commit
already includes schema+db_roadmap+STATUS+log). **🗣️ אושר —** Ishay 26/08 session opener — scoped
this session to "פזה 2 ואז פזה 3", acknowledging the phase-1 package in STATUS; phase-1 evidence
re-presented in this session's first report.

---

### Phase 2 — Business logic

**Step 2.0 · 🔻🤖 Phase door** — sweep §3.5 for Phase-2 anchors (expect none; say `אין`).
**↳ done 26/08/2026 09:36 — `אין`.** §3.5 walked: O-1/O-4 → Phase-3 door · O-2 → M12 · O-3 dormant.
Live re-measurement (Supabase MCP, Israel-local today = 26/08): pills 3·1·5 · outbound 2 · amber
`#15` only · `#15` 4 rows 1/4 — contract-3 holds on the seeded DB before a line of logic is written.

**Step 2.1 · Queue derivations ⚠️ shared-surface (`src/lib/projectLogistics.js` + test)**
**What to do (additive exports; every rule with its ruling number in a why-comment):**
- **Base set first (this is the module's population rule, and getting it wrong breaks every
  count):** the queue operates on **active projects (`ACTIVE_PROJECT_STATUSES`) that have ≥1
  logistics row**. A zero-row project *"נספר מוכן לוגיסטית ⇒ לא מגיע אליה לעולם — לא לתור ולא
  לאף גלולה"* (`data-set.md`, the `#11` row; `🎓㉙`). **`#11` is `ready` (active) with 0 rows —
  including it makes `הכול` = 6 and the anchor is 5.**
- `pillOf(rows)` / membership over that base: `needsAction` = ≥1 `not_started` (㉙) ·
  `awaitingDelivery` = none `not_started` AND ≥1 `ordered` (㉛ — the `#106` hole-closer) ·
  `all` = the whole base set, incl. completed-logistics projects (⑲).
- `amberMark(rows, products, todayIso, businessDaysUntil)` — condition ① ≥1 **physical**
  `not_started` (`category <> 'site'` — `01WEB` exempt, ⑳/⑧) + ② `businessDaysUntil ≤ 10`;
  **second trigger (㊶):** any row `ordered` with `expected_arrival_date < today` and not arrived —
  reason string = O-1 (pending nod; wire the string as a const so the nod changes one line).
- `outboundMembership` — event date in [today .. next business day] inclusive (㉓), via
  `businessDaysUntil`; never a hand-rolled calendar.
- Queue sort: proximity ascending (card §⑧-8; no second sort dimension — the pill already filtered).
- Reason-line pickers reusing `readinessTileSub` / `logisticsTileSub` wording (locked).
- `QUEUE_NO_PERMISSION_SENTENCE` (S-2) + extend the uniqueness lock-test to cover it and the two
  previously-unlocked siblings (§3.7 note).
- Branch discriminator (AR-3) as a pure helper: `(projectsRows, logisticsRows) → 'noPermission' | …`.
**Tests:** varied, non-monotonic fixtures (the 30/07 lesson); every pill/amber/window rule
positive+negative; `#106`-shaped fixture proves ㉛.
**🔻🤖 Verify:** `npm run test:run` → baseline + new, all green; **prove one new test red** by
inverting a rule locally, then restore.
**מה ייחשב עובד** *(processes ㉙/㉛/⑳/㉓ quoted in the step's why-comments)*.
**↳ as-built (26/08, Opus builder + 3-lens panel + fixer):** 17 additive exports, +43 tests
(32→75 after the fix round). Deviations from this guide's sketch, each reasoned: ‏(a)
`amberMark(rows, products, eventDate, todayIso, businessDaysUntil)` — the sketch omitted
`eventDate`, without which trigger ② is unwritable · ‏(b) reason lines return **split parts**
`{prefix, value, suffix, tone}` (the `changesTileSub` bidi precedent), never flat strings ·
‏(c) a PAST-date guard on amber + outbound (`businessDaysUntil` returns 0 for past dates —
locked by an explicit test). Panel caught + fixer fixed: the Σ/clamp fixture gap in
`inTransitReason` (both mutations run live, each killed as the sole failure). Orchestrator's
own mutation probe: breaking the `#11` base-set rule ⇒ 4 tests red, restore ⇒ green.
📌 **Product corner flagged for the 🎨 gate (not locked by test on purpose):** an outbound row
whose rows are all `ordered` with gap 0 renders NO reason sentence ("לא בכוח" — nothing false,
nothing invented). **🌊 אדוות —** done 26/08: O-1 comments synced to approved status ·
`knip.jsonc` untouched (2.1's exports are test-consumed, knip green). **🗣️ אושר —** 🤖 step;
covered by the session-scope approval + the approved 3.1 acceptance list it feeds.

**Step 2.2 · `src/modules/05_logistics/api.js`**
**Files:** `src/modules/05_logistics/api.js` (+ a pure-mapper test file)
**What to do:** three reads (AR-3): active projects (`ACTIVE_PROJECT_STATUSES` import — never a
local list) · logistics rows for those projects · products (sku→category,item_name,unit). Dialog
refresh read (㊲: re-read the single project's status + rows on open). The write:
`rpc('update_logistics_item', …)` mapping raises to Hebrew as-is (house `rpcErrorMessage` pattern),
never `.update()`. Failure ⇒ throw so the UI reverts + shows the S-2 string.
**🔻🤖 Verify:** unit tests for the pure mappers; `npm run build` (the lint-isn't-compile rule).
**מה ייחשב עובד** *(spec §"מה אסור לנחש" #1/#3, quoted)*: ‏1. *"כל כתיבה חייבת… בדיקת מספר-שורות"*
(here: the RPC raises and the client surfaces it — never a silent "נשמר"). ‏2. *"הדיאלוג קורא
סטטוס מחדש בפתיחה"* (㊲).
**↳ as-built (26/08, Opus builder + 3-lens panel + fixer):** zero direct writes measured
(grep = 0 in code). Deviations, each reasoned: ‏(a) `toRpcError` EXPORTED (the task file said
local) — exporting is what gives the mapping a unit test; single definition repo-wide verified ·
‏(b) `listActiveProjects` orders by `project_id` deliberately NOT by event date — a DB order
resembling the display sort would mask a screen that forgot to sort (the 30/07 uniform-data
trap) · ‏(c) 🔴 **`getChecklist` envelope WIDENED to `{project, rows, quoteProductLines}`** —
the panel's spec lens caught that surface-2's three empty branches (card §④/§⑨) had NO data
source in module 5; fixed per the LogisticsTab precedent (`getQuote`+`countProductLines`),
lazy (fires only when rows are empty), three-state (`undefined`/`null`/number — the email_log
pattern). **Step 3.2 consumes this field — its task file was updated the same hour.** Panel
also caught: an invented second write-failure sentence (now the locked `WRITE_FAILURE_SENTENCE`
import) · a false repo-convention claim in the test header + the unobserved write-path mine —
fixed with 12 wrapper tests via 04's chain harness (15→27). **🌊 אדוות —** done 26/08: dated
knip exemption for the five consumer-less exports added to `knip.jsonc` (removal at 3.3, the
09/08 M4 precedent) · `prompt_step_3_2.md` updated to the new envelope. **🗣️ אושר —** 🤖 step;
covered by the session-scope approval.

**Step 2.3 · 🔻👤 Phase-2 gate** — full suite green; walk the hand-computed anchors (pills 3/1/5,
amber `#107` only, outbound 2) against the SEEDED DB via a live SQL spot-check — the numbers were
hand-derived in Discovery (acceptance-oracle rule: never re-author them from the code being tested).
**↳ CLOSED 26/08/2026 11:4X.** Evidence: `npm run gate` — **all module-5-relevant steps green;
1,341 unit / 51 files = baseline 1,271 + 70 new (43 in 2.1 · 27 in 2.2), zero regressions.**
⚠️ The gate's exit code was 1 on `check:docs-structure` alone — its 3 findings sit EXCLUSIVELY
in `docs/specs/module_08_finance/stage0-sweeps/m8-sec7-items.md`, an uncommitted file of the
PARALLEL M8 advisory session (rule 16: not touched; flagged to Ishay/that session; this step
does not run in CI at all — root CLAUDE.md measured fact). Live SQL anchor walk (Israel-local
today): pills **3·1·5** · outbound **2** · amber candidates **1** (`#15` only) · `#15` = 4 rows,
1 ready — the spec's hand-computed contract-3, from the DB, not from the code under test.
Orchestrator's mutation probe: `#11` rule inverted ⇒ 4 tests red ⇒ restored ⇒ green.
**🌊 אדוות —** done: knip exemption (dated) · module CLAUDE.md born · §10 entry · commit follows
as the step's last act. **🗣️ אושר —** Ishay's session opener scoped phases 2+3 explicitly
("מבחינתי אם אין לך שאלות אמיתיות… תמשיך עד הסוף") — the 👤 gate rides on that standing
approval; the full phase-2 package is in the session report he reads.

---

### Phase 3 — UI

**Step 3.0 · 🔻🤖 Phase door — shared-component checkpoint (🧩) + O-1 nod sweep**
Expected outcome (verify, don't assume): reuse `PermissionAwareEmpty` · `LoadingOrError`
(`skeleton={{variant:'table'}}`) · `StatusTag` · `FilterPill` · `Ltr` · dialog primitives; new
LOCAL `SegmentedControl` (AS-9). Present O-1 + O-4 for Ishay's nod (P13 style, one round).
**↳ done 26/08/2026 10:29.** Components measured present: `FilterPill` · `LoadingOrError` ·
`Ltr` · `Money` · `PermissionAwareEmpty` · `StatusTag` (+tests) and `ui/dialog.jsx`; zero
"segmented" hits in `src/` ⇒ AS-9 confirmed (local build). **Nod round: Ishay approved ALL
("מאשר את הכל") — O-1 · O-4 · O-5 (see §3.5) — AND both experience-briefs for 3.1/3.2** in the
same message. ↳ Sequencing note: the door ran BEFORE the 2.3 gate (phase-2 workflow still
running) at Ishay's explicit direction ("את צבא הסוכנים למסכים אפשר במקביל?") — approval was
front-loaded; the build itself still waits for the phase-2 gate.

**Step 3.1 · Surface 1 — `LogisticsPage.jsx`** *(🗣️ experience-brief → build → verify)*
**What to do:** build exactly per `01_overview_approved.html` + card §①–§⑨ + S-3/S-4: header with
today-line · outbound section (clickable rows ㊷, stays when empty with S-2's sentence, amber/gray
reason lines, **no controls**) · three pills with counters · queue table (`מוכנות` header AS-7,
amber row form, `לצ'קליסט →`) · states ①–⑧ in the card's order, no-permission FIRST · **the load-failure
state shows the locked `ERROR_TITLE` ALONE — no detail line** (`LOAD_FAILURE_DETAIL` speaks about
"הפרויקט" and does not fit the queue; approved rec ③ of card §⑧-5) · `נקי סינון`
call-site override (AS-6) · em-dash for denied counters. The approved mockup wins on appearance —
**do not re-flag drawn details for approval** (they are content-approved 25/08).
**🔻🤖 Verify:** functional AND visual — drive the seeded screen in the preview as דנה
(`E2E_STAFF_*`), screenshot vs mockup; state screenshots (block the network for the error state);
bidi Range-measurement on numbers; `npm run check:bidi`.
**מה ייחשב עובד** *(the APPROVED list, presented in the 26/08 brief and approved with it;
sources per sentence)*: ‏1. דנה פותחת `/logistics` ורואה **בלי ללחוץ דבר** מה יוצא לפני שהיא
שוב במשרד — שתי שורות בסעיף-היציאה (spec ✅#1). ‏2. הגלולות מציגות **3 · 1 · 5** מהמסד המזורע
(פריט-חוזה 3 — hand-computed, never re-derived); גלולה עם 0 מושבתת-ומנומקת (㉚/S-3). ‏3. ענבר
על "ערב השקה — קמפוס צפון" בלבד — `01WEB` לא נספר (⑳/⑧). ‏4. חוסר-הרשאה נבדק ראשון:
projects-בלי-logistics מציג את משפט-החוסר-הרשאה, לא "התור ריק" (AR-3 · card §④-①). ‏5. לחיצה
על כל שורה — כולל בסעיף-היציאה — פותחת את דיאלוג-הצ'קליסט (㊷).
**🌊 אדוות —** **🗣️ אושר —** Ishay 26/08/2026 10:29 — *"מאשר את הכל"* (brief + the O-1/O-4/O-5
nod round, one consolidated message).

**Step 3.2 · Surface 2 — `ChecklistDialog.jsx`** *(🗣️ brief → build → verify)*
**What to do:** per `02_dialog_checklist_approved.html` + card + the 25/08 arrival-column contract:
768px override · header (project status tag — never on the item rows' line, ㉘) · sorted rows
(`sortLogisticsRows`) · SegmentedControl per row (no-op click writes nothing) · `actual_qty` field
(editable in `הוזמן`/`מוכן` only; disabled+reasoned in `טרם החל`, ㉕/㉚; renders the VALUE, never
hard 0, ㉟) · arrival column (3 states per the contract block; locked in cancelled, S-6) · note
row (blur-save) · auto-fill tag from `actual_qty_autofilled` (disappears on manual write) ·
completion banner when the returned `project_status` flips to `ready` (⑬; the `#106` wording) ·
cancelled variant (㊲ re-read on open · ㉝ lock · ㊴ exception · banner verbatim) · view-role:
controls removed, values as text · write-failure: revert + S-2 string · per-row save, no save
button · **focus stays on the clicked control after the re-sort jump** (marking `מוכן` re-sorts
the row to the bottom — the card calls it a known surprise; a stable row `key` + preserved focus
is her visual anchor, and the screen-reader needs it anyway) · **O-4 rider (pending Ishay's nod at
the 3.2 brief):** one visible sentence in the cancel banner naming the ㊴ exception — the `title`
tooltip alone is invisible until hover and keyboard-inaccessible.
**🔻🤖 Verify:** drive seeded `#107` (mark/unmark, type qty, note) — **revert every write**;
screenshots of both variants + the banner (banner via interception if no seeded project is one
click from ready — `#106` IS one click away: use interception, not a real write) · bidi pass.
**מה ייחשב עובד** *(the APPROVED list, presented in the 26/08 brief and approved with it)*:
‏1. על "ערב השקה": מסמנת `הוזמן`, מקלידה כמות, כותבת הערה — נשמר מיד, בלי כפתור (spec ✅#2).
‏2. כשל-כתיבה מציג *"העדכון לא נשמר — הערך הוחזר לקודם. נסי שוב."* והערך חוזר — לעולם לא "נשמר"
כוזב (spec ✅#4 · S-2). ‏3. פרויקט שבוטל בזמן שהדיאלוג פתוח — ננעל והיא רואה למה; `actual_qty`
לבדו נשאר פתוח (spec ✅#5 · ㊲·㉝·㊴). ‏4. `מולא אוטומטית` רק על מספר שהמערכת מילאה; מספר מוקלד
לעולם אינו נדרס (㉕·㊵·G8). ‏5. סימון הפריט האחרון ב"כנס פתיחת שנה" מציג את באנר-ההשלמה הירוק —
הודעה, לא שער — מוכח ביירוט (spec ✅#3 · ⑬).
**🌊 אדוות —** **🗣️ אושר —** Ishay 26/08/2026 10:29 — *"מאשר את הכל"* (same consolidated round;
incl. the O-4 banner amendment this step renders).

**Step 3.3 · Route swap ⚠️ shared-surface (`src/App.jsx`)**
**Files:** `src/App.jsx`
**What to do:** swap `UnderConstruction` → `LogisticsPage` inside the existing
`<ProtectedRoute allow="לוגיסטיקה">` — the guard itself is untouched.
**🔻🤖 Verify:** `App.routes.test.jsx` green **after proving it still fails on a guard-less route**
(the 06/08 pattern — invert once, restore) · recruit-role blocked live (screenshot).
**מה ייחשב עובד** *(card §⑨ req 1–2, quoted)*: ‏`allow` זהה-בייט ל-`'לוגיסטיקה'`; מסך בלי שומר
נופל בבדיקה. **🌊 אדוות —** **🗣️ אושר —**

**Step 3.4 · 🔻👤 Phase-3 gate — 🎨 UX & functional review**
Present to Ishay: §4 conformance · states on every screen · keyboard operability + focus ring
(SegmentedControl!) · validation completeness · the real question — "should anything be
redesigned?" Findings → steps or logged deferrals.

---

### Phase 4 — Ripples & integration

**Step 4.1 · `LogisticsTab.jsx` notes column (㉒) ⚠️ shared-surface**
Read-only display (she writes in M5; the tab shows). Update `LogisticsTab.test.jsx`.
**🔻🤖 Verify:** seeded note visible in M6's tab (screenshot); M6 tests green.
**מה ייחשב עובד** *(㉒, quoted)*: *"ההערה נראית למנהלת-הפרויקטים"*. **🌊 אדוות —** **🗣️ אושר —**

**Step 4.2 · `ScopeChangeDialog.jsx` ripples (㊳ items ②④ + AR-9) ⚠️ shared-surface**
Show `item_status` (as `StatusTag`) on logistics rows (data already fetched — measured) · refusal
explanation line per row (the two §3.7 strings, matching the server's raise byte-for-byte) · the
"מה יקרה כשתשמרי" block gains the removal line · client validation strings synced with 1.4's
reworded raises.
🔴 **The client-side zero-guard is `parseQtyInput`, NOT the spinner's `min`** *(reviewer finding —
`min` on `<input type="number">` is a hint; typed `0` passes it, and `parseQtyInput` (grep
`ZERO_QTY_MESSAGE`, ScopeChangeDialog.jsx) returns `{value:null, error}` on `<=0`, so the row
never reaches the payload and M5-7 would be DEAD code)*. Contract:
- `parseQtyInput(raw, { allowZero })` — `allowZero` true **only** for an EXISTING logistics row
  with `item_status==='not_started' && actual_qty===0`. The hostess row (`kind:'hostess'`) and
  the new-row path (`deriveNewRowStates`) stay `allowZero:false` (AR-10; the DB CHECK
  `required_hostess_count > 0` backs the hostess side).
- `QtyInput` gains a `min` prop, default `1` — **two call sites exist** (existing rows · the
  new-item row, grep `כמות — פריט חדש`); only the removable existing-logistics-row passes `0`.
Update `ScopeChangeDialog.test.jsx` (the old error-string assertion goes RED first — prove it,
then update; add allowZero-scope tests: hostess `0` still refused client-side).
**Files:** `src/modules/06_projects/ScopeChangeDialog.jsx` · `ScopeChangeDialog.test.jsx`
**🔻🤖 Verify:** interception-driven dialog states; unit/E2E of M6 green.
**מה ייחשב עובד** *(🔄ה item ④, quoted)*: *"רצפת-הספינר דינמית, עם הסבר צמוד"*. **🌊 אדוות —** **🗣️ אושר —**

**Step 4.3 · Doc ripples & debt sweep**
**Files:** `docs/micro_guides/module-6.md` · `docs/specs/module_06_projects/screens-approved.md` ·
`docs/specs/module_05_logistics/data-set.md` + `world-sources.md` · `docs/automations.md` ·
`docs/PROJECT_MASTER.md` §6 · `docs/db_roadmap.md` · `STATUS.md`
**What to do:** AR-4 fix in `module-6.md` — 🔴 **THREE sites, not one** (reviewer-measured):
the `AR-4` ruling row · the header guard (*"must not fix back"* — reconcile with a dated additive
note citing ㊳+M5-7, never a silent rewrite) · **the `target_qty = 0` is-REJECTED line** (grep
`target_qty = 0`) · dated notes in M6's `screens-approved.md` AND in M5's `data-set.md` +
`world-sources.md` where the deleted string is described as live behaviour · `automations.md`
(+M5-6 RPC; function-rewrite notes) · **consume `🚧 מ5 ← מ6` items 1+7 in §6 with evidence** ·
re-count `🚧 מ5` live · `db_roadmap` M5-rows → ✅ · STATUS ruling-count current.
**🔻🤖 Verify:** `grep -c 'להסרת פריט לגמרי' docs/ src/` — every remaining hit sits next to a
dated ㊳-note; §6 items carry closure evidence.
**מה ייחשב עובד** *(iron rule 13(ח), quoted)*: *"יכולת חדשה נבנתה? לחפש טקסט-ממשק שעדיין מתאר
אותה כלא-קיימת."* **🌊 אדוות —** **🗣️ אושר —**

**Step 4.4 · E2E + smoke + accessibility**
**Files:** `e2e/logistics.spec.js` (new) · `e2e/smoke.spec.js` + `smoke-anchors.json` ·
`e2e/accessibility.spec.js`
**What to do:** `e2e/logistics.spec.js`: queue render + pills (real reads) · dialog write-paths
via interception (incl. cancelled lock, ㊲ race: row loaded active → status re-read returns
cancelled → controls locked; the ㊴ open field) · permission branches (STAFF=edit sees, RECRUIT
blocked, PROJECTS view sees text-only dialog) · smoke: `/logistics` + count-based anchors —
⚠️ **smoke runs as CEO (`E2E_CEO_*` only, exit 2 without it); CEO is `edit` on לוגיסטיקה so the
screen renders — anchor accordingly, not around דנה** · extend `accessibility.spec.js` to both
surfaces (incl. the cancelled variant's lone open field). Full regression: `npm run gate` ·
`npm run test:e2e` · `npm run smoke` — report all three by name.
**🔻🤖 Verify:** all green; every NEW spec/assertion proven-red once (invert, restore) — including
4.1's notes-column assertion (nothing locked guards it otherwise).
**מה ייחשב עובד** *(spec ✅-chapter, quoted)*: ‏1. *"כתיבה שנחסמה אינה מדווחת 'נשמר'"* (the
intercepted-failure path shows the S-2 string). ‏2. card §④ branch order holds under E2E.
**🌊 אדוות —** **🗣️ אושר —**

**Step 4.5 · 🔻👤 Phase-4 gate** — package: regression counts, screenshots, ripple evidence.

---

### Phase 5 — QA & handoff

**Step 5.1 · 🔻👤 Live acceptance journey (credentialed — writes to the LIVE DB)**
**Files:** none (evidence only).
**What to do:** as דנה on the REAL app against seeded data: open queue → open `#107` → mark
`B-SAT-LAN` ordered with expected date → type partial qty → note → verify in M6 tab as נועה →
**revert to seeded state** (re-run the idempotent seed and re-assert its counts). Screenshots at
every station.
**🔻👤 Verify:** the journey is a live-DB write session — announce it to Ishay before running, and
present the screenshot pack + the post-revert count assertions. Declared boundary: this is the
once-proven live write-path (§4.5③).
**מה ייחשב עובד** *(spec ✅-chapter, all five sentences, quoted at run time)* — the journey walks
them one-by-one on the real screen. **🌊 אדוות —** **🗣️ אושר —**

**Step 5.2 · 🔻👤 Closing audit** — `module-close` template in a FRESH session: independent
re-verification · DoD typed-echo · PR instructions + 🧩 handoff prompt. The audit assesses and
persists; it never merges.

---

## 7. 📊 QA Matrix

| Test type | Planned for module 5 | As-run *(filled by the closing audit)* |
|---|---|---|
| **Unit** (Vitest) | every derivation in 2.1 (pills · amber both triggers · outbound window · discriminator · string-uniqueness incl. the new const), varied non-monotonic fixtures; api mappers | |
| **Integration** | api.js write path: RPC error→Hebrew mapping, revert-on-failure; read distinguishes rows/zero/could-not-read | |
| **E2E** (Playwright) | `logistics.spec.js` per 4.4 (reads real, writes intercepted); M3 `quote-approval` + M6 `projects`/`project-closing` specs as regression for the touched RPCs | |
| **Smoke** | `/logistics` + count-anchors (never dates) | |
| **Regression** | full `test:run` baseline + `test:e2e` + `smoke`, named individually (e2e silently excludes smoke — see boundary) | |
| **Security** | advisors after each migration · impersonated positive/negative controls (1.1/1.3) · route guard test | |
| **UAT** | 5.1 live journey + Ishay's 🎨 review (3.4) | |
| **Performance** | לא רלוונטי — ≤ tens of rows; the only perf-shaped fact (`🧱⑤` serialization) is designed around, not load-tested | |
| **Usability / Compatibility** | 3.4 review now; system-wide sweep = M12 (unchanged) | |

### 🔴 The measured boundary of the automated gates
`npm run test:e2e` = `--grep-invert בדיקת-עשן` — smoke runs ONLY via `npm run smoke` · neither runs
in CI · `gate` ≠ CI's step list ·
E2E skips itself silently when `E2E_*` credentials are absent — "green" can mean "skipped" ·
write-paths to the live DB are not E2E-covered (single live project — `🚧 מ12 ← מ4` class), proven
once in 5.1.

## 8. ✅ Definition of Done

### 8.1 Canonical (instantiated)
- [ ] `npm run verify` exit 0 · unit count ≥ baseline+new, zero regressions
- [ ] 4 migrations applied via typed-echo · `docs/schema.sql` regenerated from catalogs · committed together
- [ ] advisors: zero new findings or written triage
- [ ] session logs per protocol (`CLAUDE_CODE_LOG` → `STATUS`), db_roadmap §10 rows

### 8.2 Module-specific (each with its measurement)
- [ ] `logistics` carries 2 policies · **5 CHECKs** (planned · status · origin_exactly_one · actual ≥ 0 · color) · 5 new columns (color · 2 dates · autofilled flag — M5-5/M5-8/AR-7)
- [ ] origin pointers: 6/6 legacy backfilled; seeded rows born non-NULL
- [ ] seed idempotent; contract-3 numbers verified by SQL (pills 3/1/5 · outbound 2 · amber `#107` only · `#107` 4 rows 1/4)
- [ ] `#105` reached `ready` **via the trigger** (derived, never hand-set)
- [ ] removal round-trip: `0` on clean row ⇒ row gone + history row with reason+snapshots; both refusal strings raise
- [ ] `🧱⑥` falsified: the checklist writes land (RPC) and a blocked write shows the S-2 message, never "נשמר"
- [ ] old error string `להסרת פריט לגמרי` — zero hits in DB functions AND in `src/`
- [ ] notes visible in M6 tab; `item_status` visible in scope dialog; dynamic floor works both ways
- [ ] `מוכנות לביצוע` transition shown as message, no gate (⑬); cancelled variant locks all but `actual_qty` (㊴)
- [ ] every `🌊 אדוות` slot in §6 closed (ripples or `אין`) — count live
- [ ] every 🚧 token here has its §6 twin — count live

### 8.3 UX & validation
- [ ] 3.4 🎨 review passed: §4 design · states · RTL (Range-measured) · keyboard+focus · validation completeness (every spec'd validation built; spec-silent ones = the 25/08 approvals + O-1 nod)

### 8.4 Post-merge note — NOT audit checkboxes
> (a) Ishay opens the PR to `dev` · (b) CI green · (c) Ishay merges · (d) `post-merge` flips STATUS
> with fresh git evidence. 🚫 Claude never pushes/merges/archives.

## 9. 🔄 Self-Update Protocol

(a) status header + step table updated at every transition, same session · (b) deviations get an
inline `↳ as-built` + a §10 line · (c) the Stop hook watches `src/modules/05_*` ⇄ this guide —
**and is blind to `e2e/`, `src/lib/`, `src/components/`, `supabase/`** (verified M4 note): phases
1/2/4 update by discipline · (d) end-of-session protocol per root `CLAUDE.md` · (e)–(g): per iron
rules 13/15/16 + end-of-session (not restated) · (h) on ENTERING a phase: sweep §3.5 for anchored
OPEN items, settle at the door (P13 style) · (i) compaction: closed phase → done-table + verbatim
carry-forward contracts (the M5-6 payload contract and the removal guard are the two
incompatible-if-rederived items); archive first; never compact §3, §10, or the active phase ·
(j) 🌊 per-step ripple sweep — five targets: the step's as-built · §10 · the DoD boxes it moved ·
the ledger rows it implemented · any approved-spec section now reading differently (tagged
pointer, never an edited number).

## 10. 📝 Deviations & Tech-Debt Log

### 🔴 Pre-build verification of the approved spec — run 25/08/2026, before a single step was written

| # | Claim under test | Result | Evidence |
|:-:|---|---|---|
| 1 | data-set's 6 logistics rows / 5 projects / users / products / customers | **CONFIRMED** | live SQL 25/08 — byte-identical |
| 2 | `logistics` has 1 policy, no actual-CHECK, no color/date columns | **CONFIRMED** | `pg_policies` + `pg_constraint` + `information_schema` 25/08 |
| 3 | spec.md's "38 rulings" | **STALE — fixed 25/08** (registry held 41; now 42 with ㊷) | grep + registry |
| 4 | M5-6 scope "three columns" | **STALE — widened 25/08** (`expected_arrival_date` had no writer) | simulated-build finding |
| 5 | mockup's cancelled-view date input enabled | **DRAWN GLITCH — behaviour locked (㊴)** | S-6 approval |
| 6 | mockup's `02/09` "הגיע בפועל" future date | **DRAWN GLITCH — not reproduced** | card note 25/08 |
| 7 | `projects.quote_id` nullable (seed could insert bare projects) | **REFUTED — NOT NULL** ⇒ AS-2 quote path | live `information_schema` |
| 8 | reading list sufficiency | **NO — fixed**: rows 15–17 added to spec §① | simulated-build verdict |
| 9 | the fresh-context blueprint review (25/08) | **19 findings, all fixed** — incl. the `הכול`-pill population rule, the `parseQtyInput` zero-guard, and the seed's quote preconditions | reviewer report |
| 10 | the Phase-1 execution rehearsal (25/08) | **15 gaps, all closed** — one BLOCKER (seed idempotency vs the §7.50 quote lock ⇒ two-mode seed, Ishay-approved) + 4 unmarked ask-a-human points ⇒ four strings approved | the 🛑 table at the head of Phase 1 |

### Dated entries
*(Append-only. Starts at build.)*

**26/08/2026 00:15–00:4X — Phase-1 build session (steps 1.0–1.4 drafting + 1.5 script).**
- **Step 1.0 measurements (all live via Supabase MCP; nothing moved since 25/08):** policies
  on `logistics` = 1 (`logistics_select_by_permission`) · `pg_constraint` shows NO
  `actual_qty` CHECK (only planned/status/origin/PK/FKs) · origin pointers **0/6**,
  `project_change_id` 0/6 · project statuses: `#3 not_started` · `#7 event_finished` ·
  `#8 in_progress` · `#11 ready` · `#12 awaiting_invoice` (no cancelled project — AS-3
  consistent) · **unit-test baseline: 1,271 tests / 50 files, exit 0** (recorded from a full
  `npm run test:run`). §3.5 sweep: nothing anchored to Phase 1 (O-1/O-4 → Phase-3 door,
  O-2 → M12, O-3 → dormant).
- **↳ RULING (Ishay, session opener, quoted): one-time blanket typed-echo for all four
  migrations.** His words: *"חד פעמי כי 12 בלילה מאשר לך להריץ את כולם בלי אישור אחד אחד
  אלה עכשיו הנה קיבלת אישור על כולם"*. This waives the per-apply typed-echo gate for
  migrations A–D **this session only**; the seed (1.5) explicitly keeps its gate
  (*"הצג לי קודם את תוכנית-הכתיבה למסד החי, המתן לאישורי, ורק אז הרץ"*). Deviation from
  `supabase/migrations/CLAUDE.md`'s gate recorded here per the honesty rule — the gate's
  owner waived it, it was not skipped.
- 🔴 **BLOCKER (tool layer, not Ishay): MCP `apply_migration` denied by the Claude Code
  auto-mode permission classifier.** `execute_sql` (reads) works. Not worked around —
  DDL via `execute_sql` is forbidden by the DB protocol (unregistered migration). All four
  migration files + the seed script were drafted to disk instead; applies wait for Ishay
  to unblock (approve the tool / add a permission rule).
- **Function bodies for B and D pulled live via `pg_get_functiondef`** (the 12/08 lesson):
  `approve_quote_and_create_project(integer)` (signature confirmed integer, per the
  rehearsal) · `apply_scope_change(integer, jsonb, text)`. B's only delta: the logistics
  INSERT gains `quote_service_line_id` + `color`; D's deltas: the four marked M5-4/M5-7
  changes. Full-body diff scheduled as part of each apply's verification.
- **`הנחתי` (technical, no product meaning — server-only raise strings the UI never
  surfaces, invented because no locked string exists):** M5-6's unknown-key / not-a-number /
  not-an-integer / not-a-date / row-not-found / empty-payload raises; M5-6's
  expected-date-only-on-ordered raise text; M5-6's qty-on-not_started raise reuses the ㉚
  explanation sentence from `processes-approved` (*"הפריט טרם הוזמן — הכמות בפועל נפתחת
  לעריכה אחרי סימון 'הוזמן'"*); D's negative-qty-on-existing-row raise
  (*"הכמות אינה יכולה להיות שלילית. השינוי לא בוצע."*). Also `הנחתי`: the seed's amber
  assertion uses a **14-calendar-day proxy** for the 10-business-day threshold (DB-side
  sanity only; the exact `businessDaysUntil` check is client-side, step 2.3), and the seed's
  demo-hostess picks (12·14·15·16 / 17·18·19·22 / 24) — active, outside the smoke-anchor
  names, no future `finally_approved` rows (avoids the one-event-per-day collision as
  `#107` drifts toward 15/10–20/10).
- **`update_project_details` measured live:** its reactivation branch accepts
  `p_event_date >= current_date` ⇒ **same-day refresh works in ONE step**; the guide's
  1.5 two-step fallback ("tomorrow → today") is unnecessary — kept in the guide text as
  dead caution, behaviour confirmed from the live body.

**26/08/2026 01:0X–01:3X — Phase 1 EXECUTED end-to-end (after Ishay cleared the tool block by
adding the `apply_migration` allow rule to `.claude/settings.local.json` — his edit, his consent).**
- **Applies A→B→C→D, serial, each verified before the next** (evidence in the db_roadmap strike
  entry, not restated here): A — 2 policies · 2 new CHECKs · 4 new columns; impersonated controls
  with the FULL §2.7 recipe (positive first: דנה update→1 row, read→6; negative: נועה→0 rows).
  B — pointers 6/6, color 0/6 (G14); **full-body diff vs the pre-edit live def: delta = the two
  INSERT columns only**; `quote-approval.spec.js` → 6 passed. C — the 7-assert behavioural
  round-trip inside a rolled-back transaction (`#3` left untouched); נועה→42501. D — old raise
  string absent, all four new strings present in the live def.
- **Seed:** create-run OK (demo `#13/#14/#15` born via the real quote→approve path; removal rider:
  both refusals raised with the exact ㊱ strings, row deleted, history row written); second run =
  refresh, **count delta 0** (8/16/27/14/1). **↳ as-built (1.5):** seed's "today" is now
  `(now() at time zone 'Asia/Jerusalem')::date`, NOT `current_date` — measured live: the 01:00
  run seeded 25/08 because `current_date` is UTC; the AR-5 wording ("derives from current_date")
  is satisfied in spirit, corrected in mechanism (§7.56). A refresh realigned all dates
  (26/08 · 27/08 · 07/09) and re-proved the ㉑-reset + re-assert path with a real date change.
- **Advisors triage:** security 26 (= 25 baseline + `update_logistics_item`, the accepted
  browser-RPC class) · performance 27 (= 26 baseline + `multiple_permissive_policies` on
  `logistics`, the accepted house pattern — C-2/M12). Zero unexpected findings.
- **`docs/schema.sql` refreshed** (delta edits, cross-checked live: 23 tables · 224 columns ·
  37+12 policies · 26 functions · 3 cron jobs). db_roadmap: all 8 M5 rows → ✅ + strike entry.

**26/08/2026 09:36–10:3X — Phase-2 orchestration session (Fable main + Opus agents).**
- **1.6 closed** (gate exit 0 · 1,271/50 · anchors re-verified live) — the commit had landed in
  the phase-1 session but the gate run + doc flip had not (session boundary split the step;
  resume-from-disk caught it). **2.0 door: `אין`.**
- **Ishay's mid-session directives (quoted):** agents must get explicit reading lists ("צריך
  לכתוב מה עליהם לקרוא למשימה ומה אתה לא בטוח אם הם צריכים") · orchestrate via Workflow with
  an agent army + adversarial verification + main-session control ("למה אתה בכלל עושה פרומטים
  ולא וורקפלואו… עם צבא סוכנים ואימותים ובקרה שלך") · phase-3 screen agents run AFTER approval,
  approval itself front-loaded. All three implemented.
- **Fresh-eyes reviewer over the two 2.1/2.2 task files caught 14 real findings before dispatch**
  (worst: `toRpcError` not exported from 06's api · outbound window missing its lower bound —
  past-date active projects would enter · knip dead-code gate would fail on consumer-less
  exports · flat number-in-Hebrew strings vs the split-parts bidi law). Task files fixed, THEN
  the phase-2 workflow launched (2 Opus builders → 3 read-only adversarial lenses each → fix
  agents). Verifiers are barred from mutating source and from trusting builder reports; empty
  findings declared legitimate. Main session re-verifies everything at the 2.3 gate (mutation
  probe, full gate, live SQL anchors) before commit.
- **Phase-3 door (3.0) ran EARLY at Ishay's direction, and he approved the full package
  ("מאשר את הכל"):** O-1 · O-4 (incl. banner-body correction — the drawn text contradicted ㊴) ·
  O-5 (the units-form family — "שרוכים" is not data-derivable) · both experience-briefs. The
  approved acceptance lists were written into steps 3.1/3.2 above. **`הנחתי` register:** the
  undrawn count-forms were proposed as `הנחתי` and are now Ishay-approved (O-5) — no open
  assumptions from this session.
- **Phase-2 workflow landed (10 agents, 0 errors): 11 panel findings — 4 actionable, all fixed;
  7 minor, all addressed or triaged.** The real catches: `inTransitReason`'s Σ/clamp had no
  locking fixture (fixer ran BOTH mutations live — each killed as the sole failure) · api.js
  invented a second write-failure sentence (→ the locked S-2 import) · surface-2's three empty
  branches had NO data source (→ `getChecklist` widened per the spec, the LogisticsTab
  precedent) · a false repo-convention claim left the write-path mine unobserved (→ 12 wrapper
  tests via 04's chain harness). Verifier discipline held: zero findings contradicted a
  recorded ruling; one product corner was correctly ESCALATED instead of test-frozen (an
  outbound row with all rows `ordered` and gap 0 shows no reason line — flagged to the 🎨
  gate). Orchestrator adds: own mutation probe on the `#11` base-set rule (4 tests red →
  restored green) · dated knip exemption for api.js's five consumer-less exports (removal at
  3.3) · `src/modules/05_logistics/CLAUDE.md` written NOW rather than at close —
  `check:context` demands it the moment the folder exists, and it auto-loads for the phase-3
  builders. Two premature 3.2 stubs tripped knip's unused-files check and were deleted until
  the phase-3 launch (lesson: scaffolding follows the commit, not the build).
