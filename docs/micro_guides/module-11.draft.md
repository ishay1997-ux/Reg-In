# REG-IN — Micro-Guide | Module 11: Management Reports

> 🟨 **DRAFT.** This file is `module-11.draft.md` on purpose: the Stop hook does not enforce iron
> rule 15 for m11 while the name carries `.draft`. **Rename to `module-11.md` at approval, before
> step 1.0.** Until then nothing in it has been executed.
>
> **Reader:** a future zero-memory Claude session. **Language:** English, per `docs/CLAUDE.md`; Hebrew
> appears only as data — UI strings, module/role names, §7 quotes, migration names.

---

## 1. 🟢 Live Status Header

| | |
|---|---|
| **Phase** | **0 — not started.** Nothing in this guide has run. |
| **Branch** | `ishay/dashboard-legend-ucd` — ⚠️ **not** the `ishay/module-11-reports` the step guide names. See §9 D-1. |
| **Spec** | `docs/specs/module_11_reports/spec.md` — approved 11/09/2026 |
| **Surfaces** | **16**, in **4** files under `docs/mockups/management-report-screen/approved/` |
| **Deadline** | 🔴 **Conference 15/10/2026.** m11 is zero lines of code today. |
| **DB items owed** | **4** — `db_roadmap.md` M11-2 … M11-5 |
| **§7 items** | **0 open.** ‏§7.58 · §7.93 · §7.95 · §7.97 all 🟢 closed (verified 11/09) |

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
**⬜ Not drawn at all:** **מ1 — the shell** *(4 tabs · report chip row · global filters · the five
envelope states)*, מ23, מ24, מ25. 🔴 **מ1 is the real gap — see §9 D-2.**

### 2.3 Existing files this module touches (non-additive surface)
| File | Why | Risk |
|---|---|---|
| `src/App.jsx` | one `<Route>` + `<ProtectedRoute allow='דו"חות'>` | route left unguarded = open screen; `App.routes.test.jsx` catches it |
| `src/components/Sidebar.jsx` | `MODULE_META` row | missing ⇒ module invisible, **silently** |
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
מנהלת גיוס · מנהלת לוגיסטיקה** — the last one is exactly ⏳1: she is `blocked` on module 6 and
therefore cannot reach report 11, which is the report written for her.

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

### 3.4 🚧 Cross-module debts targeted at m11 — **10 rows in `PROJECT_MASTER §6`**
Read each to its tail. Three carry build consequences: **`🚧 מ11 ← מ5`** (cost basis — closed by
ruling 5: `planned_qty`) · **`🚧 מ11 ← מ8`** (the supply contract for profitability + salary) ·
**`🚧 מ11 ← מ4`** (two data holes the reports would otherwise discover too late).

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
> | T8 | While this file is `.draft.md` the Stop hook does not enforce rule 15 — **rename at approval** | approval |

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

**Step 2ב.2 · The edge function `classify-feedback`** — in the **`send-email` shape**: JWT →
`assert_module_permission('דו"חות', ['edit'])` → batch of ~20 comments → `temperature 0` → JSON per
the schema in card ת2. **Writes rows one at a time, immediately** *(a mid-run quota hit must keep what
was classified)*.
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

### Phase 3 — UI
**Step 3.0 · 🔴 Build מ1 — the shell — FIRST, and it was never drawn.** Four tabs · the chip row
*(ruling 29: tabs with an underline for role, pills for report)* · global filters · **the five
envelope states**, which §📐10 requires every page to know. **See §9 D-2: this is the one surface
with no mockup.**
**Steps 3.1–3.4 · One tab per step**, in the order the approved files sit: executive · finance ·
hostesses · customers. **Each step ends with the 🎨 UX gate and a 🗣️ screenshot to Ishay.**
**Step 3.5 · The onboarding layer** — 70 keys copied **verbatim** from each card's §⑩ into
`onboardingCopy.js`. 🔴 **Convert every `<span class="ltr">` to LRI…PDI** *(`onboarding-layer-contract §5ב`)*.

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
| 🔴 Acceptance oracle | the hand-computed numbers of `spec.md §🔢` — **never a test this session authored** |

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
| **D-2** | 🔴 **מ1, the shell, has no mockup** | It is one of four ⬜ surfaces. §📐10 requires every page to know the five envelope states and the gallery is drawn **once, in מ1**. ⇒ **Step 3.0 builds it from `design-contract §⑥` without a drawn reference**, which is the single largest guess in this guide. **Ishay may prefer to draw it first.** |
| **D-3** | §7's RLS matrix row for m11 reads *"none (5 reports as Views/RPC, read-only)"* | Written before the Discovery. **Corrected once, in Phase 4**, with all three writes — correcting it now would describe tables that do not exist. |
| **D-4** | `docs/schema.sql` missing three live columns | Fixed in step 1.1 before anything depends on it. |
| **D-5** | The step guide `module_11_reports.md` §① still says **"5 דו"חות"** | The Discovery produced **16 surfaces**. The truth hierarchy puts the guide last and it says so itself — **but it is the file Ishay pastes from**, so §⑥1 needs updating with the same commit that approves this guide. |
| ~~**D-6**~~ | ~~`מתחילי` appears twice in live `src/` strings~~ | ❌ **WITHDRAWN 11/09/2026 — the claim was wrong, and a fresh-context reviewer caught it.** Re-measured: **zero** occurrences in `src/` and `e2e/`. The three hits are `מתחילים`, a valid word, **all inside code comments**. The cause is the error class this guide keeps warning about: a `grep` on a **prefix** matched a different word — I measured my reconstruction of the search instead of the word. It was inherited from `spec.md`, now corrected there too. **No debt.** |
