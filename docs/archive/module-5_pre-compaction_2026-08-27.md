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
| **Status** | ✅ **[YES] — audit complete, awaiting the typed-echo DoD sign-off ("לוגיסטיקה DoD"), then commit + PR.** Round 2 (27/08 00:2X–00:3X, Ishay: *"בצע הכל לפי המלצה שלך"*): C-2 RATIFIED (projects.spec.js updated to the honest branch + exhaustive-deps fix; write-back = module-6.md entry S) · C-3 BUILT (`STAFFING_HOLD_SENTENCE` amber banner, red-proved test) · C-4 registered (`🚧 מ12 ← מ5`) · customer-page vacuous asserts → runtime invariant · dead waivers removed (pays `🚧 מ12 ← מ4`(ב)) · debts sweep: 3 stale-open מ4 lines measured already-paid and struck. **Full battery after everything: gate 0 · 1,440/56 · e2e 143/0/6 · smoke 0.** *(Earlier:)* 🅿️ **מוקפא — ממתין להכרעת ישי (closing audit 26–27/08/2026, step 5.2).** The audit ran end-to-end in a fresh session; ONE blocker (swallowed flush-on-close save failure) was FIXED + red-proved + full gate green (1,439/56, exit 0). Frozen on THREE Ishay decisions, quoted verbatim in `close-findings-module-5.md`: ‏(1) ratify-or-revert the two post-22:2X unratified fixes (LogisticsTab permission gate + PricingParamsCard), which also own the single red E2E test (projects.spec.js:122 — pins the OLD testid/sentence); ‏(2) the unbuilt card-promised "last-item-ready-but-understaffed" message; ‏(3) internal glyphs `(㊴)`/"מודול 8" reaching the user (recommend M12). Report artifact + quiz delivered. *(Earlier:)* 🖥️ **BUILD — Phases 1+2+3-build ✅ COMPLETE; standing at the 3.4 🎨 gate (Ishay's stop).** Phase 1: migrations A–D + two-mode seed live (`eb17b19`). Phase 2: queue brain + api layer, panel-verified (`40a978b`). **Phase 3: both screens built (workflow `wf_fc693d3e`) + panel-verified + cleanup-agent 7/7 fixed with red-first proofs · route `/logistics` LIVE (guard proven red then restored) · Q1–Q4 conflict triage APPROVED by Ishay ("מאשר לפי המלצתך" — all four confirmed) and Q1's legend clause implemented + test-locked · final suite 1,405/54 green (= phase-2 baseline 1,341 + 64, zero regressions) · live-browser evidence: contract-3 numbers on the real screen, dialog Range audit 6/0, keyboard date-typing = exactly 1 RPC call (the triple-write fear REFUTED in real Chrome), recruit blocked live.** *(Earlier:)* 📘 BLUEPRINT APPROVED — Ishay, `25/08/2026 23:35`. |
| **Last updated** | `27/08/2026 00:3X` *(system clock)* — round-2 fixes done, full battery green, verdict [YES] pending the typed echo. |
| **Active step** | **5.2 — verdict [YES] stands PENDING the typed-echo DoD sign-off.** After the echo: YES-persistence (LOG compaction 685→≤150 · 19 dated spec annotations · roadmap 2c · STATUS row flip · guide compaction+archive · findings-file archive · pathspec commit · PR instructions + 🧩). 🔄 Demo-morning reminder stands: run the seed REFRESH on 28/08 morning (step 1.5's standing routine). |
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
| **3.1** | Surface 1 — `/logistics` overview page (🗣️ brief → build → verify) | ✅ 26/08 |
| **3.2** | Surface 2 — checklist dialog incl. cancelled variant (🗣️ brief → build → verify) | ✅ 26/08 |
| **3.3** | Route swap in `App.jsx` ⚠️ shared-surface | ✅ 26/08 |
| **3.4** | 🔻👤 Phase-3 gate — 🎨 UX & functional review | ✅ 26/08 |
| **4.1** | M6 ripple — `LogisticsTab` notes column (㉒) ⚠️ shared-surface | ✅ 26/08 |
| **4.2** | M6 ripple — `ScopeChangeDialog`: item_status display · dynamic floor · strings (㊳②③④) ⚠️ *(+ the shared `FilterPill` tooltip fix)* | ✅ 26/08 |
| **4.3** | Doc ripples — AR-4 fix · §6 debt consumption · automations register · ripple sweep | ✅ 26/08 *(STATUS.md held — rule 16)* |
| **4.4** | E2E + smoke + accessibility for both surfaces; full regression | ✅ 26/08 *(unit+smoke green; `test:e2e` red on 5 PRE-EXISTING module-4 fixtures — proven by clean-tree re-run)* |
| **4.5** | 🔻👤 Phase-4 gate | ✅ 26/08 *("בוצע לפי המלצתך")* |
| **5.1** | Live acceptance journey on seeded data (credentialed, screenshots) | ✅ 26/08 *(restore verified field-by-field against the pre-journey snapshot)* |
| **5.2** | 🔻👤 Closing audit — `module-close` in a FRESH session | 🅿️ 27/08 *(audit ran; 1 blocker fixed+proved; frozen on 3 Ishay rulings — see §1 Status)* |

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
| O-6 | ✅ **CLOSED — deferred to M12 (Ishay 26/08/2026 13:4X, "הבנתי מעולה, מאשר"):** the ⚠ glyph the mockup draws above the load-failure title — the shared `PermissionAwareEmpty` error branch renders no glyph, system-wide; cosmetic, identical to every merged screen's error panel today. Fix belongs to the M12 system-wide UX sweep (the O-2 pattern) | — | M12 |
| O-7 | ✅ **REGISTERED to M12 — Ishay 27/08/2026 ("בצע הכל לפי המלצה שלך", closing-audit decision 3):** the two internal glyphs reaching the user (`(㊴)` tooltip · "מודול 8" in the explainer) + the notes length-cap hardening + the crashed irreversible-actions lens — all in ONE `🚧 מ12 ← מ5` line in `PROJECT_MASTER §6` (grep it) | — | M12 |
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
| Unresolvable-price removal raise (㉗-class corner; no demo path) | `לפריט אין שורת-מחיר מקושרת — לא ניתן להסירו מהמסך.` | Claude (delegated) — ✅ **NODDED, Ishay 26/08/2026 16:5X** (*"מאשר לפי ההמלצות"*, decision ד of the phase-4 brief). The batched 4.2 nod is discharged; this table has no open row left |
| Disabled pill title | `אין כרגע פרויקט במצב הזה` | S-3 |
| Retry | `נסי שוב` — 🔴 **passed explicitly as `retryLabel="נסי שוב"` at EVERY `LoadingOrError` call site**: its default is masculine `נסה שוב` (`LoadingOrError.jsx`, the `🚧 מ12` note) and `PermissionAwareEmpty`'s `RETRY_LABEL` is a non-exported const — nothing importable | card §④-② (*"חייב לעבור במפורש"*) |
| Amber legend | mockup verbatim (⏱ שורה בענבר…) | S-3 |
| Banners (cancel · completion) | mockup verbatim | S-5 |
| Second-amber reason | ✅ `ההגעה מתעכבת — הובטח ל-DD/MM וטרם הגיע` | O-1 — approved 26/08/2026 |
| In-transit reason (queue/outbound) | ✅ `{N} יחידות עדיין בדרך` · `יחידה אחת עדיין בדרך` · prefix `יוצא היום —` / `יוצא ביום {weekday} —` | O-5 — approved 26/08/2026 |
| Not-ordered counts | ✅ `פריט אחד טרם הוזמן` · `שני פריטים טרם הוזמנו` (drawn dual) · `N פריטים טרם הוזמנו` (N≥3) · fully-ready in `הכול` ⇒ `✓ מוכן` | mockup + O-5 |
| Cancel-banner ㊴ sentence | ✅ `אין לעדכן מצב או הערה בפרויקט מבוטל.` + `אפשר עדיין לרשום כמות שהגיעה — שאר הפקדים נעולים.` | O-4 — approved 26/08/2026 |
| Staffing-hold banner (card §② "נאמר בהודעה ברגע שזה קורה") | ✅ `כל הפריטים מוכנים — אך הפרויקט לא עבר ל"מוכן לביצוע": צוות הדיילות טרם הושלם.` (`STAFFING_HOLD_SENTENCE`, ChecklistDialog) | closing-audit C-3 — built 27/08/2026 under Ishay's "בצע הכל לפי המלצה שלך"; wording `הנחתי`-delegated, overridable |

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
**🌊 אדוות —** אין beyond §10's 12:3X as-built register *(slot found empty at the closing audit and closed with this pointer — the content always lived in §10)*. **🗣️ אושר —** Ishay 26/08/2026 10:29 — *"מאשר את הכל"* (brief + the O-1/O-4/O-5
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
**🌊 אדוות —** אין beyond §10's 12:3X as-built register *(slot closed at the closing audit, same as 3.1)*. **🗣️ אושר —** Ishay 26/08/2026 10:29 — *"מאשר את הכל"* (same consolidated round;
incl. the O-4 banner amendment this step renders).

**Step 3.3 · Route swap ⚠️ shared-surface (`src/App.jsx`)**
**Files:** `src/App.jsx`
**What to do:** swap `UnderConstruction` → `LogisticsPage` inside the existing
`<ProtectedRoute allow="לוגיסטיקה">` — the guard itself is untouched.
**🔻🤖 Verify:** `App.routes.test.jsx` green **after proving it still fails on a guard-less route**
(the 06/08 pattern — invert once, restore) · recruit-role blocked live (screenshot).
**מה ייחשב עובד** *(card §⑨ req 1–2, quoted)*: ‏`allow` זהה-בייט ל-`'לוגיסטיקה'`; מסך בלי שומר
נופל בבדיקה.
**↳ done 26/08/2026 (orchestrator, main session).** `UnderConstruction` → `LogisticsPage` inside
the untouched `<ProtectedRoute allow="לוגיסטיקה">`. **Guard proven red:** wrapper removed ⇒
`App.routes.test.jsx` failed naming exactly `logistics` ("expected ['logistics'] to deeply equal
[]"); restored ⇒ green. **knip's dated exemption for `api.js` REMOVED at its own named removal
date** — `npm run deadcode` exit 0 without it (both screens consume all five exports).
**Live browser evidence (read-only credentialed Playwright spec, deleted after the run — the
house pattern; secrets never through chat):** דנה sees the live queue — pills **3·1·5**, outbound
**2 rows** ("יוצא ביום חמישי — 80 יחידות עדיין בדרך" — the approved O-5 form live), amber row on
"ערב השקה" with ⏱ + "8 ימי עסקים" · the checklist dialog opens with all four rows in
`sortLogisticsRows` order, the `מולא אוטומטית` tag, the three arrival-column states, and the
seeded note · **bidi Range audit: >5 LTR values measured, zero failures; the "N מתוך M" split
pair sits in correct RTL order** · מנהלת-הגיוס blocked live ("אין לך הרשאה לצפות במסך זה.",
no queue in DOM). Screenshots in the session scratchpad (attached to the 🎨 package).
**🌊 אדוות —** done: `knip.jsonc` exemption closed with a dated note · this guide. **🗣️ אושר —**
🤖 step (shared-surface swap only; the 🎨 gate 3.4 is where Ishay rules).

**Step 3.4 · 🔻👤 Phase-3 gate — 🎨 UX & functional review**
Present to Ishay: §4 conformance · states on every screen · keyboard operability + focus ring
(SegmentedControl!) · validation completeness · the real question — "should anything be
redesigned?" Findings → steps or logged deferrals.
**↳ APPROVED — Ishay 26/08/2026 13:3X: "חוץ מזה מאשר"** (the package: 3 live screenshots ·
behavior walkthrough · the honest open-items list; the one "חוץ מזה" was a request to EXPLAIN
item 3, re-explained in plain Hebrew the same minute). **Open-items disposition:** ‏(1) the
no-sentence outbound corner — accepted as-is ("לא בכוח") · ‏(2) the weekend-clause verbosity —
kept, revisit only if it bothers him on the live screen · ‏(3) TWO HOUSE-COMPONENT items
pending his one-word nod on the recommendation: disabled-pill tooltip unreachable
(`disabled:pointer-events-none` in the shared Button — pre-existing house-wide, module 6's
pills share it) → small house fix in Phase 4; missing ⚠ glyph in the shared error panel →
defer to M12 · ‏(4) the undrawn `event_finished` full-lock — approved within the package.
**מה ייחשב עובד: the two approved acceptance lists of 3.1/3.2 — every sentence demonstrated
in the package (live screen · screenshots · measured evidence).**
**🌊 אדוות —** the gate closes the phase; Phase-4 ripples are its own steps (4.1–4.5).
**🗣️ אושר —** the quote above.

---

### Phase 4 — Ripples & integration

**Step 4.1 · `LogisticsTab.jsx` notes column (㉒) ⚠️ shared-surface**
Read-only display (she writes in M5; the tab shows). Update `LogisticsTab.test.jsx`.
🔴 **FORM — Ishay's ruling 26/08/2026 16:5X, decision א of the phase-4 brief ("מאשר לפי
ההמלצות"): a FULL-WIDTH sub-row beneath the item's row**, label `הערת הלוגיסטיקה:` + the note
text; **a row with no note renders no sub-row at all** (no `—`, no empty cell). **Why it needed
his word:** measured 26/08 — `03_tab_logistics_approved.html` draws **four** columns
(`פריט · כמות מתוכננת · כמות בפועל · מצב הפריט`) and **zero** hits for `הער*` ⇒ the notes
display is **undrawn in the approved mockup**; ㉒ approves the capability, not a form.
The rejected alternative (a 5th column) squeezes the four existing ones and renders `—` on most
rows. *(Presented as a live HTML comparison on the real seeded row.)*
**🔻🤖 Verify:** seeded note visible in M6's tab (screenshot); M6 tests green.
**מה ייחשב עובד** *(㉒, quoted)*: *"ההערה נראית למנהלת-הפרויקטים"* — concretely, on the live
`ערב השקה — קמפוס צפון` tab, the row `תג שם רגיל - ממותג` (`B-REG-TAG`) carries
*"הוזמן בבית-הדפוס — הובטחה אספקה בתחילת השבוע הבא."*, and the other three rows carry no note
element (spec ✅#2's second half — *"וההערה נראית למנהלת-הפרויקטים"*).
**↳ done 26/08/2026 (agent-built; every claim below RE-VERIFIED by the orchestrator against the
code and the DB, not taken from the agent's report).** `MainTable` emits a `<Fragment>` per row:
the item `<tr>` (four columns, widths untouched) plus — **only when `notes` is non-blank after
trim** — a second `<tr>` with `colSpan={4}` carrying `NOTE_LABEL = 'הערת הלוגיסטיקה:'` + the text.
**A row without a note emits no second `<tr>` at all** — no `—`, no empty cell, exactly as ruled.
➕ **One detail the agent reasoned out rather than being told:** the bottom border moves from the
item row to the note row when a note exists, so a rule never separates a note from the item it
belongs to. Correct, and consistent with the ruling's intent.
**Measured:** `LogisticsTab.test.jsx` **14/14 green** (was 13; the new assertion was watched RED
first — it failed alone in the suite run at 17:09 before the component change landed).
**🌊 אדוות —** ⚠️ **one this step did NOT fix, and it is the orchestrator's, not the agent's:**
`LogisticsTab.jsx`'s header comment and an inline comment still say the origin columns are
*"NULL בכל השורות היום ושום דבר אינו ממלא אותן (as-built 3.3⑥)"* — **false since `M5-3`; measured
16/16 filled.** Out of the agent's scope by design. ⏳ **OPEN — orchestrator's, closes before the
4.5 gate.** Deliberately NOT edited while the build agent still holds the file (rule 16 applies to
agents sharing a tree, not only to sessions): a concurrent edit to a file an agent is mid-write on
is the collision the rule exists to prevent. *(Stated as open rather than written as done — the
half-step where a file is saved and its doc-ripple is lost is exactly what this guide warns about.)*
**🗣️ אושר —** Ishay 26/08/2026 16:5X — *"מאשר לפי ההמלצות"* (decisions א–ד, one
consolidated round).

**Step 4.2 · `ScopeChangeDialog.jsx` ripples (㊳ items ②④ + AR-9) ⚠️ shared-surface**
➕ **Added 26/08/2026 (🎨-gate disposition, Ishay: "הבנתי מעולה, מאשר"): the disabled-pill
tooltip house fix.** The shared `Button` carries `disabled:pointer-events-none` ⇒ a disabled
`FilterPill`'s `title` never shows on hover — ㉚'s "מושבת ומנומק" is half-delivered, house-wide
(module 6's pills share it today). Fix in the SHARED component layer (e.g. wrap the disabled
pill in a `span` carrying the `title`, or swap to `aria-disabled` + guard), verify on BOTH
module-5 and module-6 pills, prove-red once. Small, but it touches merged screens — that is
why it waited for this step's shared-surface batch rather than being patched mid-module.
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
🔴 **THREE forms ruled by Ishay 26/08/2026 16:5X (decisions ב–ד of the phase-4 brief,
"מאשר לפי ההמלצות") — all three were undrawn/unsourced, which is why they went to him:**
- **‏ב · `item_status` placement = a `StatusTag` inside the item's EXISTING sub-line** (the one
  rendering `model.subLabel`, today the unit — becomes `יחידה · <tag>`). **No new column.**
  *(Measured 26/08: `06_dialog_scope_change_approved.html` draws six columns and no status at
  all ⇒ undrawn. The rejected alternative — a 7th column — squeezes the two money columns,
  which are what the projects manager opens the dialog to read.)*
- **‏ג · the `מה יקרה כשתשמרי` removal line** *(this line had NO tier-1–3 source — micro-guide
  only, hence the ask)*: **`"{שם הפריט}" — השורה תוסר ממסך הלוגיסטיקה, וההסרה תירשם בהיסטוריית
  שינויי-התכולה.`** — sits in the existing `לוגיסטיקה` consequence row, beside the update line.
- **‏ד · the delegated ㉗-corner raise NODDED** (§3.7's batched nod, discharged here):
  **`לפריט אין שורת-מחיר מקושרת — לא ניתן להסירו מהמסך.`** — already live in the DB (1.4);
  the nod closes §3.7's only open row. **No demo path reaches it.**
🔴 **And the mockup's own `min="0"` is NOT a licence** (measured: all three drawn rows carry it,
**including the hostess row**). That is BEHAVIOUR ⇒ the spec wins over the drawing: the hostess
row and the new-row path stay `allowZero:false` (AR-10; the DB `CHECK required_hostess_count > 0`
backs it). Only an existing logistics row with `not_started` + `actual_qty = 0` gets `0`.
**🔻🤖 Verify:** interception-driven dialog states; unit/E2E of M6 green.
**מה ייחשב עובד** *(🔄ה item ④, quoted)*: *"רצפת-הספינר דינמית, עם הסבר צמוד"* — concretely, on
the live `ערב השקה — קמפוס צפון` dialog: `שרוך סאטן - ממותג` (`not_started`, `actual_qty=0`)
accepts `0` · `תג שם רגיל - ממותג` (`ordered`) refuses it with *"הפריט כבר הוזמן — לא ניתן
להסירו"* beside the field · `תג שם אקולוגי - ממותג` (`ready`) likewise · the hostess row refuses
`0` client-side with *"כמות הדיילות חייבת להיות גדולה מאפס."* **The third refusal case
(`not_started` + `actual_qty > 0` ⇒ *"הגיעו כבר פריטים — לא ניתן להסיר"*) has ZERO live rows —
measured 26/08 — and is proven by unit/E2E only.**
**↳ done 26/08/2026 (agent-built; orchestrator-verified line by line — see the measurements).**
· **The guard is `parseQtyInput`, as the step demanded** — it now takes a rules object
(`allowZero` · `zeroMessage` · `negativeMessage`); `isRemovableLine(model)` is
`itemStatus === 'not_started' && Number(actualQty) === 0` — **both conditions (㊱)**, and
`removalBlockReason(model)` returns the string naming *which* rule blocked.
· **`allowZero:false` is hardwired for the hostess row and for `deriveNewRowStates`** (AR-10),
with a why-comment stating it stays so permanently.
· **`QtyInput` gained `min`** and the existing-row call site passes `min={removable ? 0 : 1}` —
the dynamic floor, with the reason rendered beside the field via a new `hint` prop.
· **`item_status` renders as a `StatusTag` inside the EXISTING sub-line** (`{subLabel} · <tag>`) —
**no seventh column**, exactly as ruled; hostess rows get no tag (they have no item status).
· **The consequence block's removal line is Ishay's wording, byte-for-byte**, branched on
`s.target === 0`, with a comment recording that it had no source layer and was therefore asked.
🔬 **Byte contract — machine-verified, not eyeballed.** A checker parsed all **30** `raise
exception` strings from the live migration and compared them to the file after normalising the
server's deliberately-omitted ` השינוי לא בוצע.` suffix: **6/6 contract strings identical, 0
failures.** ⚠️ **And it caught something a read-through would have missed:** mid-build the file
carried placeholder sentinels (`@@SRV_HOSTESS_ZERO@@` …) in place of the Hebrew — had they
survived, the projects manager would have seen that literal text on screen. **Zero remain.**
📌 **The retired blanket string survives ONLY inside a why-comment explaining its removal** — kept
deliberately (it is what stops a future session re-introducing a blanket refusal), and the DoD line
was sharpened from *"zero hits"* to *"zero LIVE hits"* to match. Technical call, disclosed.
· **Shared-component tooltip fix (the 🎨-gate rider): DONE in `FilterPill.jsx`** — a `span`
wrapper carrying the same `title` receives the hover, because the shared `Button`'s
`disabled:pointer-events-none` denies the button itself a hit-test. **Route chosen over
`aria-disabled` + click-guard on purpose**, and the reason is in the file: `aria-disabled` would
return the control to the tab order and change what a screen reader announces — a cross-system
semantics change bought for a tooltip. **Appearance, tab order and semantics all unchanged.**
**Measured:** `src/modules/06_projects/` **151/151 green across 9 files, exit 0** (was 143 with 1
red — and that red was the OLD error-string assertion, watched failing at 17:18 before it was
updated, exactly the prove-red the step required).
**🌊 אדוות —** `FilterPill` is shared with module 6's pills ⇒ its behaviour change is verified on
both modules' screens at the 4.5 gate (live browser), not on module 5's alone.
**🗣️ אושר —** Ishay 26/08/2026 16:5X — *"מאשר לפי ההמלצות"* (same consolidated
round as 4.1).

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
אותה כלא-קיימת."*
**↳ done 26/08/2026 (orchestrator, main session).** All three `AR-4` sites in `module-6.md`
amended **additively** (ruling row · header guard · payload-contract block) — the original text is
preserved in every one and a dated `🔶` note states the new boundary, citing ㊳/㊱/`M5-7`. Dated
notes also landed in M6's `screens-approved.md` (the `הכמות החדשה` validation row, which quoted
the deleted string as live on-screen text) and in M5's `data-set.md` + `world-sources.md` (both
already carried a ㊳ correction predicting the deletion — each now carries a `✅ בוצע` stamp).
🔎 **THREE more sites this step's own file-list did not name, found by running the greps instead of
trusting the list** — all the same class (text still describing a now-built capability as absent,
which is literally this step's `מה ייחשב עובד`):
· **`processes-approved.md` `🧱②`** still read *"🔴 לעולם לא DELETE … `qty<=0` נדחה בהודעה"* — a
measured-22/08 statement that `M5-7` deliberately falsified. Dated note added; the fact preserved
(it records the state we came from).
· **`processes-approved.md`'s column-scan table** listed `actual_qty`/`item_status`/`notes` as
**`אין כותב`** and `quote_service_line_id` as **`נמדד 0/6`**. Re-measured live: all three have a
writer (`update_logistics_item`), and the pointer is **16/16**. Dated re-measurement block added
below the table.
· 🔴 **`src/CLAUDE.md` — the highest-cost one, because it loads in EVERY code session:** it listed
`logistics` under *"כרגע deny-all (RLS פעיל, אפס policies)"*. **Measured live: two policies**
(`logistics_select_by_permission` + `M5-1`'s `logistics_write_by_permission`). Corrected, with the
`FOR ALL`-covers-SELECT caveat carried into the same note.
**Live-measured, not inferred** — `pg_get_functiondef` on the running `apply_scope_change`:
`להסרת פריט לגמרי` **absent**; all five replacement raises present; the `delete from
public.logistics` branch present.
**`automations.md`:** the `logistics_recompute_project_status` row said the blast radius was
*"מ5 העתידי"* — updated, module 5 is live. **And a deliberate deviation from this step's
instruction, stated rather than done silently:** the step said *"+M5-6 RPC"*, but this register's
charter is *"מה רץ במערכת בלי שאף אחד לוחץ"* and `update_logistics_item` is UI-called ⇒ filing it
as an automation would be a category error. Instead: a measured **zero-automations** entry for
module 5 (`cron.job` = 3 unchanged · 24 unique public triggers unchanged · `logistics` carries the
same two triggers), naming the one new RPC and the three function rewrites and saying where they
ARE registered (`db_roadmap`). **Raised to Ishay in the same report as a guide-vs-charter conflict.**
**`PROJECT_MASTER §6`:** items **(1)** and **(7)** consumed with live evidence — pointer column
filled **16/16 rows**; `pg_policies` shows exactly `logistics_select_by_permission [SELECT]` (M6's,
untouched) + `logistics_write_by_permission [ALL]` (M5-1's, new) ⇒ inherited, not recreated.
➕ **Item (2) checked though not mandated** (it is the one that fails silently): every one of the
seven `project_status` mentions in the live `update_logistics_item` body is a `select … into`, a
guard, or a return field — **zero writes.** M6's trigger remains the sole writer.
**`db_roadmap` M5 rows:** re-read live — **all eight `M5-1`…`M5-8` were already ✅** at phase-1
close. Nothing to flip; saying so rather than claiming work.
**`🚧 מ5` live re-count:** **one** `🚧 מ5 ← מ6` line (seven items inside it) + **two**
`🚧 מ11 ← מ5` lines — matches the expectation in §2.2; **no new debt added by module 5.**
⏸️ **`STATUS.md` NOT touched** — another session holds it modified in the working tree right now
(iron rule 16); carried to the 4.5 gate pending Ishay's word.
**🌊 אדוות —** this step IS the ripple sweep; its own ripples: `spec.md`'s cross-module table
gained a dated execution-status block, and `module-6.md` + M6's `screens-approved.md` now point at
㊳. Nothing else touched. **🗣️ אושר —** 🤖 step (documentation only; no product decision).

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
**↳ done 26/08/2026 (agent-built; orchestrator ran the three named regressions itself).**
`e2e/logistics.spec.js` — **new, 12 tests**: queue + 3 pills on real reads · the §④ branch that
matters most (**zero logistics rows reads as BLOCKED, never "the queue is empty"**, and the same
endpoint *aborted* reads as a load failure — two different sentences, asserted as different) ·
㉚/㉛/㊷ via interception · **㊲+㉝+㊴** (cancelled lock with `actual_qty` as the lone open field) ·
**S-2** (a blocked write shows the failure string **and the value reverts**) · ⑬ banner-not-a-gate ·
STAFF/RECRUIT/PROJECTS permission branches. Every test ends with a network-level guard asserting
**zero non-GET requests left the browser**. `smoke.spec.js` +31 / `smoke-anchors.json` +7 —
CEO-anchored, **no id, count, date or status pinned** (the block's comment says why).
`accessibility.spec.js` +72 — axe over all three module-5 surfaces, each with a content wait.
**59 assertions individually inverted, seen red, restored.**
🔴 **And the red-proof found a hole in the spec itself, which is the point of doing it:** two loops
in the cancelled-variant test ran on **empty collections** and stayed green when inverted — the
runtime-chosen subject happened to be a project whose rows are all `מוכן`. Fixed by preferring a
subject carrying all three row kinds and asserting each denominator first. **This is the
zero-denominator rule (`e2e/CLAUDE.md`) catching itself.**
📌 **A defect the E2E work surfaced in module 5's OWN screen, fixed here** *(see the deviations log
entry for the anchor)*: the completion banner printed **`נרשם חוסר של 1 יחידות`** — the branch was
on `items` while the word describes `units`, and the mockup only ever drew `80`. Now `יחידה אחת`,
per Ishay's `O-5` which gave the twin sentence that exact form. Red-proved and locked by a test.
**🌊 אדוות —** `ChecklistDialog.jsx` (the singular fix) + its test; `docs/` this guide + §7.
**🗣️ אושר —** 🤖 step for the spec authoring; the singular-wording fix is an anchored ruling
disclosed to Ishay in the same message, **overridable**.

**Step 4.5 · 🔻👤 Phase-4 gate** — package: regression counts, screenshots, ripple evidence.
**↳ ✅ APPROVED — Ishay 26/08/2026 19:3X: *"בוצע לפי המלצתך"*** (same message that opened the
open-items investigation). **PHASE 4 CLOSED.**
**The package as presented:** live screenshots of BOTH ruled surfaces from the real DB (not
mockups) — the note sub-row with **1 note row over 4 item rows, denominators asserted**, and the
dialog's status tags + both refusal lines · the four-command regression **by name** with the two
red ones explained and their causes located OUTSIDE module 5 · and an honest open-items list rather
than a clean-sounding summary.
🔴 **The gate package deliberately carried a self-reported gap, not only successes:** the green
*"אפשר להקליד 0"* affordance that the approval mockup drew but the spec never required and the
build never produced. **Ishay approved the mockup, so the discrepancy is disclosed to him rather
than quietly resolved in the build's favour** — it is now open-item #1 of the investigation.
⏸️ **What the gate could NOT evidence, stated rather than glossed:** a live disabled-pill tooltip.
**Measured: zero of three logistics pills are disabled on live data right now** (the demo data grew
during the day), so the state is unreachable without manufacturing it. The shared-component fix
rests on component-level red→green across **both** modules' real pill components.
**מה ייחשב עובד** — the acceptance lists of 4.1/4.2/4.4, each demonstrated: the note is visible to
the projects manager on the live tab (㉒ / spec ✅#2) · the dynamic floor with its adjacent
explanation is on the live dialog (🔄ה item ④) · a blocked write shows the S-2 string and reverts,
never "נשמר" (spec ✅#4).
**🌊 אדוות —** the gate closes the phase; `STATUS.md` + `CLAUDE_CODE_LOG.md` written at close
(released under rule 16 only after the parallel M8 session's own commit declared its Discovery
CLOSED and its files sat idle 45+ minutes — the wait, and the reason it ended, are both recorded).
**🗣️ אושר —** the quote above.

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
them one-by-one on the real screen. **🌊 אדוות —** see §10's `Step 5.1 — ✅ DONE` entry (this guide · LOG · STATUS) *(slot closed at the closing audit)*. **🗣️ אושר —** the 🤖-step record + live-write announcement, §10 same entry.

**Step 5.2 · 🔻👤 Closing audit** — `module-close` template in a FRESH session: independent
re-verification · DoD typed-echo · PR instructions + 🧩 handoff prompt. The audit assesses and
persists; it never merges.

---

## 7. 📊 QA Matrix

| Test type | Planned for module 5 | As-run *(filled by the closing audit)* |
|---|---|---|
| **Unit** (Vitest) | every derivation in 2.1 (pills · amber both triggers · outbound window · discriminator · string-uniqueness incl. the new const), varied non-monotonic fixtures; api mappers | ✅ 1,439/56 exit 0 (closing audit 27/08, two full gate runs; +1 = the flush-failure locking test, red-proved) |
| **Integration** | api.js write path: RPC error→Hebrew mapping, revert-on-failure; read distinguishes rows/zero/could-not-read | ✅ 27+12 wrapper tests (2.2) + e2e S-2 path + the new post-unmount failure channel test |
| **E2E** (Playwright) | `logistics.spec.js` per 4.4 (reads real, writes intercepted); M3 `quote-approval` + M6 `projects`/`project-closing` specs as regression for the touched RPCs | ⚠️ 142 passed · 6 env-skips · **1 failed — projects.spec.js:122, pins the pre-bde057a testid/sentence (audit finding C-2, Ishay's ruling pending)**; all module-5 specs green |
| **Smoke** | `/logistics` + count-anchors (never dates) | ✅ exit 0 (run by name, closing audit 27/08) |
| **Regression** | full `test:run` baseline + `test:e2e` + `smoke`, named individually (e2e silently excludes smoke — see boundary) | ✅ gate ×2 exit 0 · smoke 0 · e2e 1-red (the C-2 test, above) |
| **Security** | advisors after each migration · impersonated positive/negative controls (1.1/1.3) · route guard test | ✅ advisors 26 = baseline, 0 new · full-recipe impersonation re-run live at audit (Dana 16/1 · Noa 16/0 · Recruit 0/0) · §2c agent scan: 0 exploits |
| **UAT** | 5.1 live journey + Ishay's 🎨 review (3.4) | ✅ 5.1 done 26/08 (restore field-verified) · 3.4 approved · audit re-drove both surfaces read-only with live screenshots |
| **Performance** | לא רלוונטי — ≤ tens of rows; the only perf-shaped fact (`🧱⑤` serialization) is designed around, not load-tested | N/A per plan |
| **Usability / Compatibility** | 3.4 review now; system-wide sweep = M12 (unchanged) | ✅ 3.4 + e2e a11y (axe ×3 surfaces) · M12 sweep unchanged |

### 🔴 The measured boundary of the automated gates
`npm run test:e2e` = `--grep-invert בדיקת-עשן` — smoke runs ONLY via `npm run smoke` · neither runs
in CI · `gate` ≠ CI's step list ·
E2E skips itself silently when `E2E_*` credentials are absent — "green" can mean "skipped" ·
write-paths to the live DB are not E2E-covered (single live project — `🚧 מ12 ← מ4` class), proven
once in 5.1.

## 8. ✅ Definition of Done

### 8.1 Canonical (instantiated)
- [x] `npm run verify` exit 0 · unit count ≥ baseline+new, zero regressions *(audit 27/08: gate — which contains verify — exit 0 twice; 1,438 → 1,439 with the audit's one new test)*
- [x] 4 migrations applied via typed-echo · `docs/schema.sql` regenerated from catalogs · committed together *(applied 26/08 under the recorded blanket typed-echo, §10; schema refreshed at 1.6+4.3; audit cross-checked live columns/CHECKs/policies against catalogs)*
- [x] advisors: zero new findings or written triage *(audit 27/08: security 26 = phase-1 baseline exactly; performance 25 < 27 baseline; triage notes for project_changes/salary_reports deny-all in the audit report)*
- [x] session logs per protocol (`CLAUDE_CODE_LOG` → `STATUS`), db_roadmap §10 rows *(db_roadmap rows all ✅ at 4.3; audit's own LOG/STATUS entries written 27/08)*

### 8.2 Module-specific (each with its measurement)
- [x] `logistics` carries 2 policies · **5 CHECKs** (planned · status · origin_exactly_one · actual ≥ 0 · color) · 5 new columns (color · 2 dates · autofilled flag — M5-5/M5-8/AR-7) *(audit 27/08: pg_policies + pg_constraint + information_schema, live — exact match)*
- [x] origin pointers: 6/6 legacy backfilled; seeded rows born non-NULL *(audit live count: 16/16 with pointer, 0 without)*
- [x] seed idempotent; contract-3 numbers verified by SQL (pills 3/1/5 · outbound 2 · amber `#107` only · `#107` 4 rows 1/4) *(idempotency delta-0 proven at 1.5; audit 27/08 re-derived the FORMULA live: pills 4·1·6 — values moved with real usage (#16 born 26/08) exactly as ⑥3 warned — outbound 2 · amber #15 only · #15 4 rows; the on-screen numbers matched the SQL derivation)*
- [x] `#105` reached `ready` **via the trigger** (derived, never hand-set) *(#13 live: project_status='ready', 2/2 rows ready + staffing full)*
- [x] removal round-trip: `0` on clean row ⇒ row gone + history row with reason+snapshots; both refusal strings raise *(1.5 rider, recorded; audit verified the live function body carries the delete branch + both strings)*
- [x] `🧱⑥` falsified: the checklist writes land (RPC) and a blocked write shows the S-2 message, never "נשמר" *(e2e S-2 test green; audit RLS negative controls; + the audit's new post-unmount failure channel closes the last swallow path)*
- [x] old error string `להסרת פריט לגמרי` — zero hits in DB functions AND **zero LIVE hits in `src/`** *(audit 27/08: pg_get_functiondef LIKE-check — absent from the live body)*
  *(wording sharpened 26/08/2026, step 4.3 — technical-execution call, disclosed to Ishay, overridable:
  the original said "zero hits in `src/`" flat. A mention inside a **why-comment explaining the removal**
  is not a violation — it is the thing that stops a future session re-introducing a blanket refusal, and
  iron rule 3 asks for exactly that comment. What must be zero is a **live string constant or rendered
  text**. Checked by a comment-aware scan, not a flat `grep -c`.)*
- [x] notes visible in M6 tab; `item_status` visible in scope dialog; dynamic floor works both ways *(audit 27/08: live screenshot — exactly 1 note sub-row over 4 item rows in נועה's tab; ScopeChangeDialog verified by the §2b agent + 151/151 M6 tests)*
- [x] `מוכנות לביצוע` transition shown as message, no gate (⑬); cancelled variant locks all but `actual_qty` (㊴) *(e2e: ⑬ banner-not-gate + ㊲/㉝/㊴ tests green)*
- [x] every `🌊 אדוות` slot in §6 closed (ripples or `אין`) — count live *(audit 27/08: three step-body slots (3.1 · 3.2 · 5.1) stood empty with their content in §10 — closed now with pointers)*
- [x] every 🚧 token here has its §6 twin — count live *(audit 27/08: 2 real `🚧 מ11 ← מ5` §6 lines + 1 consumption-citation inside item (1) — a naive `grep -c` returns 3; the guide's expectation of 2 debt lines holds, no new debt)*

### 8.3 UX & validation
- [x] 3.4 🎨 review passed: §4 design · states · RTL (Range-measured) · keyboard+focus · validation completeness (every spec'd validation built; spec-silent ones = the 25/08 approvals + O-1 nod) *(3.4 approved 26/08 13:3X; audit added live read-only screenshots of both surfaces + a direction pass. ⚠️ One card-promised behaviour found unbuilt — the understaffed-completion message — open as audit decision 2, Ishay's)*

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

**26/08/2026 12:3X — Phase-3 workflow landed: the builders' deviation/`הנחתי` registers
(written here per rule 15; the nod round itself is the 🎨 gate).**
- **3.1's four `הנחתי` assembly decisions (user-visible, Ishay's at 3.4):** ‏(a) the outbound
  section is HIDDEN on the no-permission branch — its content derives from unreadable rows and
  the empty-section sentence there would be the silent lie; pills stay with `—` · ‏(b)
  `נקי סינון` selects the `הכול` pill, not the default — a zero-count default pill is DISABLED
  (㉚), so "return to default" would be a no-op in the only state that shows the button (the
  merged `ProjectsPage` does the same; card §① wording queued for ratification) · ‏(c)
  reason-line precedence: O-1's late-arrival wording renders only when nothing is left to
  order — `not_started` work wins · ‏(d) the drawn ⏱ `title` shows only when trigger-⑳ fired —
  on a late-arrival-only row the drawn tooltip would be FALSE, and no second wording was
  invented (glyph-vs-legend queued for Ishay).
- **3.2's deviations beyond the five pre-approved:** locked-§3.7 explainer wording (the
  mockup's inline `(㊵)` marker not reproduced — §3.7 is the later approved source) · view-role
  drops the `עדכון מצב` column entirely (card §⑤ "מוסרים לגמרי") · date input `w-full` (a
  native date field cannot fit 64px) · the undrawn `event_finished` state built with ZERO
  invented text — the locked G4 sentence + full lock incl. qty (㊴ is cancelled-only by its own
  wording). **3.2's four `הנחתי`:** failure-message mapping by `code` (server raise as-is ·
  no-code network failure ⇒ the locked S-2) · `undefined`-discriminator on an empty list ⇒
  fail-toward-blocked · unchanged-value writes skipped (`🧱⑤`) EXCEPT typing over an autofilled
  value (㊵'s tag must clear — test-locked) · focus ring `teal-700`.
- **Panel: 15 findings.** 1 major (the ruling-③ same-SKU fixture) — FIXED with a live mutation
  proof (`serialNumber: 1` slip ⇒ exactly 1 failed/27; the fixer also REFUTED part of the
  finding's own evidence by measurement). **4 CONFLICT QUESTIONS correctly escalated, not
  patched** (⏱-glyph vs legend · the red write-failure line vs the zero-red color budget ·
  the card's branch-order wording · the card's `נקי סינון` wording) — queued for the 🎨 gate.
  Shared-component items (no ⚠ glyph in the error state · disabled-pill `title` unreachable
  through `disabled:pointer-events-none`) — house-level, NOT patched from module files. Test
  minors → the 7-item cleanup agent (incl. one real tooltip bug: the closed-event sentence
  surfacing during a routine busy-save on an active project).
- **Two measurement debts carried to the pre-🎨 verification (from 3.2's blind-spot section —
  its jsdom tests cannot see either):** ‏(a) a real-Chrome `type="date"` field may fire `change`
  per SEGMENT ⇒ triple RPC writes each holding `FOR UPDATE` (`🧱⑤`) — measure via the network
  tab while typing a date by keyboard on `#15`'s ordered row (two announced-and-reverted live
  writes); >1 call per date ⇒ one-line blur-save fix · ‏(b) the orchestrator's live Range audit
  was scoped to `[data-testid="logistics-page"]` — the DIALOG lives in a portal OUTSIDE it and
  was NOT measured; extend the audit to the open dialog before the package.
- **12:5X — the four CONFLICT QUESTIONS triaged with Ishay (he asked to see them, not have
  them passed silently):** ‏Q1 (⏱ glyph vs legend — amends approved-drawn text) + Q2 (red
  write-failure line — a rule-8 color call) ⇒ **his, presented with recommendations (extend
  the legend by one clause · keep red).** ‏Q3 (card's branch-order wording) + Q4
  (`נקי סינון` target) ⇒ **closed as anchored decisions** (measured impossibility + the merged
  `ProjectsPage` precedent) — dated ✏️ notes written into `screens-approved.md` §④/§① the same
  hour; he can override.
- ✅ **13:0X — Ishay approved the triage: "מאשר לפי המלצתך".** ‏**Q1 CLOSED:** the ⏱ glyph stays
  on every amber row and the legend gains ONE clause — **approved wording:**
  *"או: משלוח שתאריכו המובטח עבר וטרם הגיע."* (implemented in `LogisticsPage.jsx`'s legend +
  its locking test, right after the cleanup agent releases the folder). **Q2 CLOSED:** the
  write-failure line STAYS RED — a failed save is an error, consistent with the red
  `ERROR_TITLE`; the zero-red budget governs DATA, not failure notices (recorded as a dated
  note beside the color-budget lines at the next card touch). Q3/Q4's anchored closures stand
  ratified under the same approval.

**26/08/2026 13:1X — phase-3 close-out (all measured, nothing narrated):**
- **Cleanup agent: 7/7 fixed, none rejected, each red-first** (the false busy-tooltip repro'd
  then fixed one-line · refresh-on-close now asserts LANDED data, proven against the exact
  thrown-away-refetch mutation · fan-out array asserted incl. `#11` · controlled inversion
  pair · loading-skeleton test · explainer full-textContent lock (killing the silent-line-loss
  family) · re-sort test now locks all 3 card effects). Restorations md5-proven;
  `SegmentedControl.jsx` untouched. Its rule-16 flag (foreign App.jsx/knip edits) was THIS
  session's own 3.3 work — verified, no incident.
- **Q1's approved legend clause implemented + locked by a new test** (the exact approved bytes
  asserted).
- **The two §10 measurement debts CLOSED in real Chrome:** dialog-portal Range audit —
  **6 measured, 0 failures** · keyboard date-typing — **exactly 1 RPC call per completed date**
  (3.2's per-segment triple-write fear REFUTED; no blur-save change needed). Two announced
  live writes on `#15`'s ordered row, value restored to `2026-09-01` and verified. ⚠️ Method
  note: the first audit run measured the dialog's LOADING skeleton (0 spans) — measuring
  before content is the trap; the fixed spec waits for the dialog's own text first.
- **Final gate: 1,405 unit / 54 files, everything module-5 green.** Exit-1 again ONLY from
  `check:docs-structure` on the parallel M8 session's uncommitted sweep file (same 3 findings;
  flagged to Ishay twice — that session should fix its own file). Temp evidence/measure specs
  deleted; phase-3 commit follows as this entry's last act.

### Added `26/08/2026 17:3X` — Phase 4, steps 4.1+4.2: the build agent's five `הנחתי` items

🔴 **Why these are on disk and the other two provenance tags are not** (Ishay's ruling 08/08/2026):
`אומת-על-ידי` and `דווח-לי` describe **how something was learned** — their reader is Ishay while the
conversation is live. **`הנחתי` describes something that was INVENTED**, and two weeks from now it
reads exactly like a fact. This log is the only place a future session can tell them apart.
**All five were disclosed by the agent, and all five are reversible.**

| # | The assumption | What was actually checked before calling the source silent | Verdict |
|:-:|---|---|---|
| **1** | A **negative** qty on an existing logistics row mirrors `הכמות אינה יכולה להיות שלילית.` | The step's own instruction named only three mirrors and is silent on negatives. §3.7's `Negative qty` row is `כמות בפועל אינה יכולה להיות שלילית.` — a **different field** (module 5's `actual_qty`) and a different string. Opened: the step text, §3.7, §3.3, `🔄ה`, `🎓㊳` | ✅ **Sound, and barely an assumption** — the string was byte-copied from the server's own `(not v_is_new) and v_new_qty < 0` raise. The instruction was silent; the DB was not |
| **2** | A **hostess negative** shows the hostess-zero message | Measured, not guessed: the server's condition is `v_new_qty <= 0`, so that raise covers negatives byte-exactly | ✅ **Not really an assumption** — a measurement. Kept here because the agent tagged it |
| **3** | The refusal reason shows **always while blocked**, not only after she types `0` | The ruling said *"שורת-הסבר לצד השדה"* and did not say when it appears | ✅ **Keep.** `🎓㉚` is explicit: *"כפתור מושבת מלמד אותה את החוק"* — teaching happens **before** the attempt. And typing `0` turns the same sentence red rather than adding a second one, so she never sees it twice |
| **4** | A line model with **no matching logistics row** falls back to the new-item zero message | Unreachable today (that input is disabled and its error nulled) | ✅ **Keep, and the reasoning is right:** such a line, if ever sent, goes without `serial_number` — which the server reads as "new row". The fallback matches what the server would actually say |
| **5** | The note sub-row **takes over the item row's bottom border** | Purely visual; nothing in the ruling or the card covers it | ✅ **Keep.** A rule between an item and its own note would fight the whole point of the form Ishay chose |

⏸️ **And one thing the agent deliberately did NOT build, recorded so it is not lost:**
**`aria-describedby` linking the refusal hint to the qty input**, so a screen-reader user hears the
rule on focus. **It is a real gap** — the hint is a plain `<div>` today, and only the red error
carries `role="alert"`. Not asked for, touches merged-screen markup, and `e2e/accessibility.spec.js`
was being edited by another agent at that moment. ⇒ **candidate for the 4.5 gate's decision, or M12
with the other system-wide a11y items** (O-2/O-6 pattern). **Ishay's call, not Claude's.**

📌 **One scope call, disclosed rather than buried:** the agent **created**
`src/components/FilterPill.test.jsx` (76 lines, 4 tests) where its task said *"(+ its test, if one
exists)"* and none existed. Justified: the task required the tooltip fix be proven red once, and a
throwaway probe would have left a shared-component fix permanently unguarded. **New file, new
coverage on a component three modules use — accepted.**
🔎 **Orchestrator's independent re-checks of this agent's report (it was not taken at face value):**
`git status` confirms `LogisticsPage.test.jsx` and `ProjectsPage.test.jsx` are **unmodified** (its
tooltip probes really were copies, and really were deleted — zero probe files remain anywhere) ·
the byte-contract verifier re-run **6/6, 0 failures** · full suite re-run independently:
**1,418 / 55, exit 0**, matching its claim exactly.

### Added `26/08/2026 19:0X` — Phase-4 full regression: the three named runs, and the one that is RED

**Run by the orchestrator, not delegated** (the gate never delegates).

| Command | Exit | Result |
|---|:--:|---|
| `npm run test:run` | **0** | **1,420 / 55 files** — baseline before phase 4 was 1,405 / 54 ⇒ **+15 tests, +1 file, zero regressions** |
| `npm run test:e2e` | 🔴 **1** | **138 passed · 5 failed · 6 skipped** — **all five in MODULE 4**, none in module 5 |
| `npm run smoke` | **0** | 1 passed (37.6s) — needed the dev server up first (`exit 3` without it, which is the wrapper working correctly) |
| `npm run gate` | 🔴 **1** | Every stage green — lint · format · **1,420 unit** · build · `dup` · `deadcode` · `audit` · `check:bidi` · `check:context` — **except `check:docs-structure`: 3 findings, all in `docs/specs/module_08_finance/stage0-sweeps/m8-sec7-items.md`**, a file committed by the parallel M8 session (`1caa8b3`) and **never touched here** |

🔬 **The five E2E failures were PROVEN not to be ours, not argued.** `e2e/CLAUDE.md`'s own rule —
*"before attributing an E2E failure to your last change: `git stash`, run, restore"* — was executed:
**the whole phase-4 tree was stashed (27 files) and the two specs re-run against a tree carrying
zero phase-4 changes. The identical five failed, with byte-identical messages.** Restored with
`git stash pop`, no conflicts, suite re-verified **1,420 / 55, exit 0**.
⚠️ **Why the suspicion was legitimate and had to be tested rather than waved off:** phase 4 changed
**`FilterPill`, a SHARED component**, and all three failing areas (repository · overview ·
smart-match) render filter pills. The clean-tree run is what ruled it out.
🔴 **And a trap worth recording: the background-task notification reported `exit code 0` for that
E2E run while the command's own captured `E2E_EXIT` was `1`.** The notification reports the
*wrapper's* exit, not the command's. **Read the captured exit code, never the notification's.**

> 🔴 **CORRECTED `26/08/2026 20:0X` — the root cause written below was WRONG, and the correction
> matters because it reassigns blame from an outsider to us.** The paragraph that follows attributed
> the `overview-kpi-missing` break to *"a new project with no staffing created in production the same
> day"* (a quote approved by another person). **Measured live, project-by-project:** the KPI counts
> **4** projects with a staffing gap (`#16` gap 10 · `#3` gap 6 · `#8` gap 5 · `#15` gap **1**), while
> the test's row matcher is `{ hasText: 'חסרות' }` — and `OverviewTab.jsx:319` renders
> **`gap === 1 ? 'חסרה 1' : \`חסרות ${gap}\`'`**. ⇒ **The plural matcher is structurally blind to the
> singular branch.** A 0-of-10 project renders the PLURAL form and is counted fine — so the outsider's
> project **cannot** be the cause. **The one row the matcher cannot see is `#15` — `ערב השקה — קמפוס
> צפון`, gap 1 — which is MODULE 5's OWN phase-1 demo seed.**
> ⇒ **The test defect is module 4's and is old** (it never handled the singular). **The trigger is
> ours.** And it was already failing before the outsider's project existed (KPI 3 vs rows 2).
> ⚠️ **And this exposes the limit of the clean-tree proof recorded below:** `git stash` removes
> **phase-4 code** — it does not remove **phase-1 seed rows**. The proof was sound for the question
> "did phase 4 break this"; it was silently read as "is module 5 involved at all", which it cannot
> answer. **Two different questions, one experiment.**

**What the five actually are — live-data fixture rot, the class `e2e/CLAUDE.md` already documents**
(*"פיקסטורות נעוצות לשורות-מסד חיות מרקיבות לבד"*, and its sibling *"וגם מספר חי הוא פיקסטורה"*):
`overview-kpi-missing` expected `3`, live screen says **`4`** — and a new project **with no staffing**
was created in production earlier the same day (quote → project via the real approval path), which is
exactly one more "event missing staff". The other four are the same family (a filtered-empty state
that no longer empties, an invite row with no `נשלח` line, and two action-menu label counts).
⇒ **They are module 4's fixtures, they will keep drifting while the system is used before the demo,
and the documented fix is to re-express them as invariants rather than pinned values.**
**Not done here — out of phase-4 scope, and a triage call that is Ishay's.**

### Added `26/08/2026 21:4X` — POST-GATE work, all of it on Ishay's word after 4.5 closed

⚠️ **This section is deliberately after the phase-4 gate.** Every item here was ruled by Ishay
*after* he approved 4.5, so none of it retro-changes what the gate certified. Recorded separately
so a later reader can tell the gate's contents from what followed it.

**‏① 🔴 Item removal moved from "type `0`" to an EXPLICIT `הסר פריט` control** *(Ishay, "אשמח שתבנה
כן. מה שהכי נכון")*. **His question was the right one and the analysis backed it:**
· `㊳` ruled **ownership + no new screen** — *"הסרה = כמות חדשה 0"* is the **how**, derived from
  *"the same screen where she already reduces quantities"*. ⇒ **changing the mechanism does not touch
  his ruling.**
· **Measured house precedent:** every destructive action in this system has an explicitly named
  control (`העבר לארכיון` · `השבת` · `ביטול פרויקט`). **"Type a magic value to delete" was the only
  exception in the codebase.**
· 🔑 **And it is what finally makes `㉚` literal.** `㉚` says *"פקד מושבת מלמד אותה את החוק"* — but
  there was **no removal control at all**, so nothing taught. Blocked rows now render the button
  **present, disabled, and reasoned**.
**As built:** the marked state is **derived** (`target === 0`), not parallel state — the button
writes into the same `qtyInputs` field she would type into, so the two routes cannot drift. Marked
row: name struck through, the qty input **replaced** by `יוסר`, button flips to `בטל הסרה`. The
server contract is **untouched** — `target_qty: 0` and the two-condition `㊱` guard are exactly as
before, and typing `0` by hand still works identically.
🚫 **No modal confirmation, deliberately** — the dialog already gates with a mandatory reason + the
consequence block + an explicit Save. Ishay asked whether quantity changes should also be confirmed;
**answer: no** — a quantity change is *reversible*, a removal is not, and a fourth gate would train
her to click through the one that matters (`⑯`: *"הזמן מודיע ולא חוסם"*).
🚫 **The positive hint line under discussion is DROPPED** — the button supersedes it.
**Verified:** 18 mutations, each watched failing and reverted · suite **1,433 / 55, exit 0** ·
`vite build` 0 · eslint 0 · prettier 0 · `check:bidi` 0.
⏸️ **Owed and NOT done: the live visual pass.** The DOM, semantics and behaviour are proven; **how
the button and the strikethrough actually look in the row has not been seen by anyone.**

**‏② 🔴 A real defect in MODULE 5's OWN screen, found by the feedback audit and confirmed by
measurement — a promise the screen made and broke.** `ChecklistDialog` prints
*"כל שינוי נשמר מיד — אין כפתור שמירה במסך."* and saves on `onBlur`. **Measured with a throwaway
probe: type a note, close the dialog without leaving the field ⇒ `updateLogisticsItem` called ZERO
times.** The note is gone.
🔴 **And it was INPUT-DEVICE DEPENDENT, which is what made it dangerous:** closing with the mouse
moves focus to the button ⇒ `blur` fires ⇒ saved. Closing with **Esc** unmounts directly ⇒ lost.
**Same intent, two outcomes, no error either way.**
**Fix:** blur the active element before the close propagates — this triggers the existing, already
validated blur-save. No new control, no confirmation, no change to the save path.
**Red-proved:** fix removed ⇒ *"expected vi.fn() to be called at least once"*; restored ⇒ green.

**‏③ The five module-4 E2E fixtures rewritten as invariants** *(Ishay's ② — "לתקן")*. **Verified by
the orchestrator, not taken from the report: exit 0, 32 passed** (was 27 passed / 5 failed).
**No guard was weakened and three are now STRICTER** — most notably the twin-action test, which
asserted *"never both"* and therefore **passed green when NEITHER appeared**; it now demands exactly
one. 🔎 **And the agent surfaced a worse sibling it was told not to fix:**
`e2e/customer-page.spec.js:218-222` pins quote `#22` in three **negative** assertions, and the
`module3-quote-expiry` cron flips `#22` to `rejected` around **31/08** ⇒ the testids vanish and all
three **pass vacuously — a silent pass that never goes red.** Out of scope here; flagged.

**‏④ `check:docs-structure` sharpened — the gate is GREEN for the first time in two days.**
The rule matched `מ3/8`-style **module-pair tags** as surface counts. 🔑 **The checker's own header
already documented module pairs as a known false-positive class and tried to exclude them with a
closure-word requirement — which a Discovery status tag (`סגור·לוגיקה·מ3/8`) satisfies anyway.**
**Measured: 3 findings in the scanned set, 3 of them false — 100%**, which is precisely the state
the checker's own comment calls *"בדיקה שמכבים"*. Added `(?<!מ)(?<!מודול )(?<!מודולים )`; verified
seven forms one by one — **`8/8` (the line the checker was born for), `4 מתוך 8` and `3/8 נסגרו`
are all still caught** — then proved it still bites by planting a real violation and watching it fail.
🚫 **Module 8's committed file was NOT edited.** It is correct; it uses the project's own tagging
convention. Rewriting a sound document to appease a broken tool would have punished the victim and
left the defect to catch every future `מN/8` tag — and module 8 is the module that carries the 8.

**‏⑤ Two corrections to documents Ishay relies on, both of them mine to own:**
· 🔴 **I had written into Amit's presentation guide that the logistics screen is live. It is not.**
  Measured: `git ls-tree origin/main -- src/modules/` returns **no `05_logistics`** — nor does `dev`;
  the module lives only on this branch, 67 commits ahead. **The original sentence I "corrected" was
  true, and I replaced it with a false one** by conflating *built* with *deployed*. Both guides now
  say so, marked as a same-day correction-of-a-correction. ✅ **And the mitigating measurement:**
  `demo-script-28-08.html` **never mentions logistics** — the screen is not in the presentation, so
  nothing is urgent.
· 🔴 **`do-not-touch.md` promised that marking an item `מוכן` is reversible.** True only while the
  event date has not passed. Measured in the **live** `recompute_project_status`: once
  `final_event_date < current_date` the same formula writes **`event_finished`**, and the guard
  `if v_status not in ('not_started','in_progress','ready') then return` means un-marking recomputes
  nothing — and the dialog locks entirely. **This is Ishay's own deliberate guard (`§7.44`); only the
  promise was wrong.** Corrected in place.
· 📌 **Demo-day measurement worth keeping:** `#13` (event 26/08) and `#14` (27/08) both satisfy
  `final_event_date < 28/08` ⇒ **without the morning seed refresh, two of the three logistics demo
  projects leave the queue on their own, `#14` at 05:00 on presentation morning.** A dispatched check
  confirmed the refresh **will** succeed (every `finally_approved` row in the DB was examined; the one
  hostess with future approvals outside the demo set is not in any demo project) — and the refresh
  **already ran successfully today**, which is the strongest evidence available.

### Added `26/08/2026 22:0X` — the system-wide feedback fix Ishay approved (⑥ of the post-gate list)

**🔴 Error toasts no longer auto-dismiss.** `ToastProvider` deleted **every** toast after 4s,
regardless of kind. **The concrete case that decided it** (not a principle — a sentence that exists):
releasing a hostess prints *"…אך הודעות-הביטול: 2 לא נשלחו · 1 — לא ידוע אם יצאו. כדאי ליידע אותה
טלפונית."* — **and no screen anywhere records that a hostess was never told her event was cancelled.**
Four seconds was the entire window to read it, while the table simultaneously swapped to a loading
skeleton and pulled the eye.
🔑 **This APPLIES an existing house ruling rather than inventing one:** the closing tab already
avoids a refresh on purpose *"כי הוא היה מוחק את הודעת-הכשל"*, and the quote-send dialog keeps a
persistent message **in addition to** its toast. The knowledge existed; it had never been applied to
the toast itself. **Success/info still dismiss at 4s — a success is reproducible, a failure is not.**
**Scope: one condition.** Covers all 63 call sites at once; the `✕` control already existed.
**New file `src/components/ToastProvider.test.jsx`** (it had none): success dismisses · an error
survives **5× the window** · and the error is closable, so it cannot become trapped on screen.
**Red-proved:** auto-dismiss restored ⇒ two of the three fail, the first on the hostess sentence
verbatim; reverted ⇒ green.
🐞 **And a defect in my own first test, worth recording because it is the rule I preach:** it looked
for a close control by `aria-label` containing **`סגור`**, while the real label is **`סגירת ההתראה`** —
which does not contain that string. **The test failed and the code was fine.** *Search the target's
own vocabulary, not the words you arrived with* — noted inline in the test.

**Suite after this round: 1,436 / 55, exit 0** · eslint 0 · prettier 0 (`src` clean).
⏸️ **Still owed, unchanged:** the live visual pass on the removal control · step **5.1** ·
two feedback findings awaiting Ishay's word (the permission-block rendered as a system fault in the
project card; success-and-failure shown together on the pricing-parameters screen).

### Step 5.1 — ✅ DONE `26/08/2026 22:2X` · live acceptance journey, and what the verification caught

**Announced to Ishay before a single write, as he required.** Ran through a temporary credentialed
provider in `e2e/` (the house evidence-provider pattern) — **deleted before commit; `git status`
confirms `e2e/` holds only the real specs.**

**The journey, as דנה on the live DB** — subject `ערב השקה — קמפוס צפון` / `B-SAT-LAN`, chosen
because **every field it touches starts empty**, so the restore is unambiguous:
mark `הוזמן` → expected arrival date → partial `actual_qty` → note → **then re-authenticated as the
projects manager and confirmed the note is visible in M6's tab** (`㉒` end-to-end on real data, not
interception) → then every field restored through the same screen.

🔴 **What the verification caught, and a green test would have hidden.** The restore came back
**6 of 7 fields correct**: `notes` was `''`, not `NULL`. **Cause is structural, not a slip — the UI
can never produce `NULL`:** a cleared `<textarea>` yields `''`. ⇒ **once anyone writes and clears a
note, that column cannot return to its seeded state through the screen, ever.** Visually identical
(both render no note row), and functionally equivalent to every reader — but not byte-identical to
the seed, and the promise made was exact restoration. Completed with one targeted `notes = ''` →
`NULL` update, disclosed in the same message.
🔑 **This is the whole reason 5.1 exists as a separate step:** the Playwright run was **green**, and
the database was **not** back.

**Restore proof — programmatic, not eyeballed.** All six logistics rows of both demo projects
compared field-by-field against the pre-journey snapshot with `is not distinct from` (so `NULL` and
`''` cannot pass as equal): **`identical_to_snapshot = true` on all six.** Counters unchanged:
`logistics` = **16** · `project_changes` = **1** (the journey performs no scope change) ·
project `#15` still `in_progress` · demo rows **6**.

**מה ייחשב עובד** *(spec ✅-chapter, walked on the real screen)*: she marks `הוזמן`, types a quantity
and writes a note — saved instantly, no save button (✅#2) · **and the note is visible to the
projects manager** (✅#2's second half, `㉒`) · nothing reported "נשמר" that did not happen (✅#4).
**🌊 אדוות —** this guide (step table + this entry) · `CLAUDE_CODE_LOG` · `STATUS`. The temp provider
was deleted rather than committed.
**🗣️ אושר —** 🤖 step; the live-write announcement was given and acknowledged before running.

### Step 5.2 — 🅿️ closing audit ran `26–27/08/2026`, FROZEN on three Ishay rulings

**Fresh session, template executed in full** (DoD walk · RLS stress-test with the full impersonation
recipe · §2b spec-diff agent · §2c security agent (0 exploits) · §3b silent-failure agent · gate ×2 ·
e2e · smoke · live read-only screenshots · answerable-later · duplication · clustering).
**Working state + verbatim questions: `close-findings-module-5.md` (NOT archived — audit is open).**
- 🔴 **Blocker C-1 FIXED inside the one fix round** (precedent-based repair): a flush-on-close save
  whose RPC fails after the dialog unmounts was silently dropped (`aliveRef` early-return) — the
  failure branch of the 5.1-era Esc fix. Now: persistent error toast (the approved 26/08 toast
  ruling) naming the item + the S-2/server sentence, and `onSaveSettledAfterClose` re-syncs the
  queue after a late-landing save. Red-proved (test fails without the fix), gate exit 0, 1,439/56.
- 🅿️ **C-2 (Ishay):** commits `030bee4`/`bde057a` (22:55–22:56) landed AFTER the last STATUS write
  (22:2X) which lists both indication fixes as `⏸️ פתוח אליך`; no recorded nod anywhere, and the
  LogisticsTab permission gate is documented nowhere. It also breaks `projects.spec.js:122` (pins
  the old testid/sentence; the screen now shows the MORE honest state). Recommendation: ratify →
  audit updates the test → e2e green. Alternative: revert.
- 🅿️ **C-3 (Ishay):** card-promised understaffed-completion message unbuilt (grep
  `בלעדיו סימון הפריט האחרון לא יקדם את הפרויקט` in M5's screens card) — build-now (small) or defer.
- 🅿️ **C-4 (Ishay, tiny):** internal glyphs `(㊴)` / "מודול 8" user-visible (drawn-approved);
  recommend register M12.
- **Also recorded:** 19 stale spec anchors for the dated-annotation persistence pass ·
  `src/CLAUDE.md` deny-all list misses `project_changes` · LOG narrative 685 vs ≤150 (compaction
  owed at the YES-completion of this close) · hardening: no notes length cap · 2 stale audit-gate
  exemptions · the ⑥3 carried trio (.first() ruling-conflict answered with a recommendation ·
  customer-page vacuous-by-31/08 · irreversible-actions lens never re-run).
