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
| **Phase** | **0 — not started.** Step 1.0 (the phase door) is the next action. |
| **Branch** | `ishay/dashboard-legend-ucd` — ⚠️ **not** the `ishay/module-11-reports` the step guide names. See §9 D-1. |
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
**⏳1** report 11 vs the logistics manager's permission · **⏳2** "queue memory" *(first write path in a
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
**👤 half:** ask Ishay whether another session is writing (rule 16) · ⏳1 if still open.
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

**Step 1.2 · Migration A — the two AI tables + their policies**
**Files:** `supabase/migrations/<ts>_module11_a_feedback_ai.sql`.
**Verify:** `pg_policies` shows a read policy on each, gated on `'דו"חות'`; a query as a
`'לקוחות'`-only identity returns rows; as a blocked identity returns **zero with no error**, and that
is *asserted*, not observed.

**Step 1.3 · Migration B — `assignments.recommended_rank`**
**Verify:** column exists, nullable; **the 5,674 seeded rows stay `NULL`** (no back-fill);
`pg_constraint` confirms the PK triple is untouched.

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
**Step 3.0 · Build מ1 — the shell — FIRST.** Four tabs · the chip row *(ruling 29: tabs with an underline
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
| **D-1** | Branch is `ishay/dashboard-legend-ucd`, not the `ishay/module-11-reports` the step guide names | That branch **does not exist** — verified 11/09 on local and origin. All Discovery output, 73 commits, sits here. Cutting a new branch now either fragments the work or needs a 73-commit merge first. The blueprint's actual requirement — *not on `main`/`dev`* — holds. |
| ~~**D-2**~~ | ~~🔴 **מ1, the shell, has no mockup** — the single largest guess in this guide~~ | ✅ **CLOSED 11/09/2026, and the original wording was wrong twice over.** ① **"No drawn reference" was false:** `design-contract §⑥` is a **401-line copyable HTML skeleton written for מ1** — sidebar, four tabs, chip row, filters, the "אז מה" line, and **real markup for all five envelope states** — plus §⑥.1 with the four pickers. ② **"It has no mockup" was true but irrelevant:** measured across the four approved files, **every one renders `side` · `tabs` · `picker` · `filters` · `stamp`, and three of four render the masked tab.** ⇒ **the shell is drawn four times over; a fifth file would have shown the same screen a fifth time.** **Ishay ruled it deleted** *(11/09: "המעטפת לא טובה תמחק לדעתי מיותרת גם")*, and `§⑥.2` records the reasoning. 🔑 **What the exercise did produce, and it was the real defect:** the skeleton rendered the picker as a **220px vertical rail** while the approved mockups render a **horizontal chip row** — and **§⑥ is what the build copies**, so it would have shipped with no visible symptom. **Fixed in §⑥.** ⚠️ **The lesson, not the file: a gap recorded once as "no reference" is never re-checked, and it kept being repeated to Ishay as a blocker.** |
| **D-3** | §7's RLS matrix row for m11 reads *"none (5 reports as Views/RPC, read-only)"* | Written before the Discovery. **Corrected once, in Phase 4**, with all three writes — correcting it now would describe tables that do not exist. |
| **D-4** | `docs/schema.sql` missing three live columns | Fixed in step 1.1 before anything depends on it. |
| ~~**D-5**~~ | ~~The step guide §① still says **"5 דו"חות"**~~ | ✅ **CLOSED 11/09/2026 — verified this turn, not remembered.** The guide was rewritten end to end: §① now reads **16**, and the old sentence survives only struck through with its correction note *(`module_11_reports.md:15–16`)*. ⚠️ **Left as a closed row rather than deleted, because a builder who inherits "the guide says 5" from anywhere else needs to see it was checked and when.** |
| ~~**D-6**~~ | ~~`מתחילי` appears twice in live `src/` strings~~ | ❌ **WITHDRAWN 11/09/2026 — the claim was wrong, and a fresh-context reviewer caught it.** Re-measured: **zero** occurrences in `src/` and `e2e/`. The three hits are `מתחילים`, a valid word, **all inside code comments**. The cause is the error class this guide keeps warning about: a `grep` on a **prefix** matched a different word — I measured my reconstruction of the search instead of the word. It was inherited from `spec.md`, now corrected there too. **No debt.** |
