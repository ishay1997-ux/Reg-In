# Module 4 — דיילות + Smart Match · Build Micro-Guide

> ✅ **APPROVED by Ishay 08/08/2026 23:30** ("מאשר"). This is the live guide.
> **Reader: a future Claude Code session with zero memory.** English; Hebrew only as data
> (DB values, UI strings, §7 quotes). All chat reports to Ishay are Hebrew.
> **Revision 2** — after a fresh-context adversarial review of revision 1, run against the finished
> guide rather than a summary of it (`module-blueprint/template.md` was corrected the same session).

## §1 🟢 Live Status Header

| | |
|---|---|
| Module | **4 — דיילות + Smart Match** |
| Branch | `ishay/module-4-hostesses` — **exists; never re-create.** ⚠️ measured `ahead 6` of origin: `git status -sb` before assuming it is pushed |
| Owner | ישי (sole developer) |
| Overall status | 🔨 **Phase 0 in progress** |
| Last updated | **09/08/2026 07:53** *(system clock; refresh it at every step transition)* |
| **Active step** | **0.1** 🔨 |
| Deadline | module 4 → `dev` by **21/08/2026**; submission **19/09/2026** |

Legend: ⬜ pending · 🔨 in progress · ✅ done · ⏸️ deferred (target module) · ❌ blocked (reason)

| Step | Title | Status |
|---|---|---|
| 0.1 | Unlock the shared email engine for module 4 | ✅ 09/08 — gate 0 · unit 428 · E2E 78 · smoke 0 |
| 0.2 | Migration 0 — `email_log` accepts `'shift'` + its own read policy | ✅ 09/08 — applied `20260809085058`, verified live |
| 0.3 | Deploy `send-email` and re-verify live | 🔨 **half done** — deployed (v4) + gate proven live on 7 cases, zero mails. **Owed: the Make bypass + one real shift mail.** |
| 1.1 | Migration A — surrogate key + module-4 columns | ⬜ |
| 1.2 | Migration B — one-event-per-day constraint (§7.88) | ⬜ |
| 1.3 | Migration C — new tables, params, release-message template | ⬜ |
| 1.4 | Migration D — RLS policies, min-wage trigger, public RPC | ⬜ |
| 1.5 | 🔻👤 Phase-1 gate: advisors clean + `schema.sql` refreshed | ⬜ |
| 2.1 | `src/lib/hostesses.js` — ID check digit, min-wage, derived states | ⬜ |
| 2.2 | `src/lib/smartMatch.js` — the four layers | ⬜ |
| 2.3 | `src/modules/04_hostesses/api.js` — query-side filtering | ⬜ |
| 2.4 | 🔻👤 Geocoding — service choice (product decision) + lazy fill + backfill | ⬜ |
| 2.5 | 🔻👤 Phase-2 gate: the hand-computed anchor reproduces | ⬜ |
| 3.0 | 🔧 Shared-component checkpoint (before any screen) | ⬜ |
| 3.1 | Surface 3 — hostess repository table | ⬜ |
| 3.2 | Surfaces 3ב/3ג/3ד — add / edit / view cards | ⬜ |
| 3.3 | Surface 1 — assignment overview (triage) | ⬜ |
| 3.4 | Surface 2 — Smart Match | ⬜ |
| 3.5 | Surface 4 — per-row action menu | ⬜ |
| 3.6 | Surface 5 — public confirm page (no login) | ⬜ |
| 3.7 | 🔻👤 Phase-3 gate: 🎨 UX & functional review | ⬜ |
| 4.1 | Wiring: replace `UnderConstruction`, add the public route | ⬜ |
| 4.2 | Demo seed extension + E2E anchors + the fixture-rot ruling | ⬜ |
| 5.1 | E2E + regression suites | ⬜ |
| 5.2 | 🔻👤 Closing audit (`module-close`, FRESH session) | ⬜ |

---

## §2 📦 Context Packet

**Purpose (3 lines).** מנהלת הגיוס והשיבוץ manages a pool of up to 50 hostesses and staffs each
event with 2–10 (usually 4–5). Smart Match ranks candidates for her; **she picks manually, every
round anew.** Success is measured negatively: no event goes out with a staffing hole, and no
hostess appears in two places on the same day.

### Product source — tier 2, above C5/C6 and above `docs/mockups/`

🔴 **`docs/specs/module_04_hostesses/` is the build source.** Its `spec.md` §① carries the mandatory
numbered reading list; from `module4_smart_match_research.md` read **§11 only**.
Screen cards: `screens-approved.md`. Processes: `processes-approved.md`.
**Approved mockups: `docs/mockups/hostesses-screen/approved/*.html` — 8 files, HTML not PNG (read them).**

⚖️ **Arbitration (`screens-approved.md` §⚖️):** the mockup wins on APPEARANCE (layout · order · colour ·
label wording · emphasis); the spec wins on BEHAVIOUR · DATA · PERMISSIONS · **STATES** · **SETTINGS**.
Neither → stop and ask Ishay.
🚫 **These mockups are APPROVED** — do NOT re-flag their drawn details for Ishay's re-approval.

⚠️ **`docs/mockups/hostesses-screen/` also holds six superseded `01–06.png` and a
`03_sortangles_DRAFT.html`.** Only `approved/` is authoritative. *(A `_DRAFT` suffix already nearly
caused the public-page security surface to be skipped — `spec.md:49-51`.)*

🔴 **Two stale lines inside otherwise-authoritative sources — do not obey them:**
- `processes-approved.md:260` still says the project moves to `מוכן לביצוע` **by a DB trigger in M4**.
  **Reversed 08/08/2026** — `spec.md §12⑱(ד)` + `PROJECT_MASTER §6` `🚧 מ6 ← מ4`. **M4 never writes
  `projects.project_status`.**
- `module4_smart_match_research.md §11.6#11` (30/07) puts the one-event-per-day index on three
  statuses. **§7.88 (08/08, later) narrows it to `finally_approved`.** See the ledger.

### Capabilities delivered vs deferred

| Capability | Module 4 delivers | Completed by | §6 line |
|---|---|---|---|
| Hostess pool: create · edit · deactivate · declared unavailability | ✅ full | — | — |
| Smart Match ranking (gate · pin · score · sort) | 🚧 **2 of 3 score components** | 🚧 מ6 | `🚧 מ6 ← מ4` (attendance fields) |
| `מצוינת אצל הלקוח הזה` pin tag (layer 2) | 🚧 **code built, table stays empty** | 🚧 מ6 | `🚧 מ6 ← מ4` (three-state mark) |
| Invitations + public confirm page | ✅ full — M4 owns the RPC | — | — |
| Scheduled T-24 reminder **email** | ❌ | 🚧 מ10 | `🚧 מ10 ← מ4` |
| T-24 **on-screen alert** | ✅ derived at read time (§7.91) | — | — |
| `projects.project_status` → `מוכן לביצוע` | ❌ **M4 never writes it** | 🚧 מ6 | `🚧 מ6 ← מ4` |
| Salary report | ❌ M4 supplies raw material only | 🚧 מ8 | `🚧 מ8 ← מ4` |
| "Who is below minimum wage" report | ❌ | 🚧 מ9 | `🚧 מ9 ← מ4` (exists, `:427`) |
| Smart Match params **editing screen** | ❌ rows seeded, no UI | 🚧 מ9 | 🔴 **NO §6 LINE EXISTS — write it this session** |

🔴 **Rule (ENFORCED — iron rule 15 + Stop hook):** every 🚧 row above must have a **byte-matching**
`🚧 מN ← מ4` line in `PROJECT_MASTER §6`, written **in this same session** — format
`🚧 מN ← מ4 · what · why it lives only there · מקור: micro_guides/module-4.md` — then verified with
`grep '🚧 מN' docs/PROJECT_MASTER.md`. A 🚧 with no §6 twin is a **silent debt**; the registry is read
by `grep`, and `grep` does not read prose.
⚠️ **Two of the rows above have no §6 line today and must be authored:** the **M9 Smart-Match params
screen** (the one existing `🚧 מ9 ← מ4` at `PROJECT_MASTER.md:427` is the min-wage report, a different
debt) and the **M6 attendance fields** if `PROJECT_MASTER.md:437` does not already name
`attendance_status`/`lateness_level`/`no_show_reason` explicitly — check before writing, do not duplicate.

**Roles on every module-4 screen:** מנהלת גיוס ושיבוץ = edit · מנכ"ל = edit · מנהלת פרויקטים = view ·
מנהלת כספים ולקוחות / מנהלת לוגיסטיקה = blocked. *(Verified live against `permissions`, 08/08/2026.)*

### DB tables and the existing migrations that shaped them

| Table | State entering module 4 | Migration that made it so |
|---|---|---|
| `hostesses` | 11 columns, ת"ז as PK, `rating int not null default 3`, RLS on, **0 policies**, **0 rows** | baseline + `20260710160735` (RLS + `created_at`/`updated_at`) |
| `assignments` | composite PK on ת"ז, 5-value status CHECK, RLS on, **0 policies**, **0 rows** | baseline + `20260710160735` |
| `projects` | 24 columns incl. `event_name`/`customer_id`/`final_start_time`/`final_end_time`, RLS on, **0 policies**, **3 rows, all `not_started`** | `20260723111005` (M3 structure) · `20260723115000` (the conversion RPC that writes it) |
| `params` | 20 rows incl. 4 hostess email templates and 3 **wrong** Smart-Match weights | `20260723112000` (M3 seed) |
| `email_log` | `entity_type check in ('quote')`, 1 SELECT policy, no client write path | `20260730095439` |
| `customers` | SELECT policy gated on module `'לקוחות'` — **מנהלת גיוס is blocked there** | `20260710160735` |
| **new:** `hostess_unavailability` · `customer_hostess_preference` | do not exist | authored in step 1.3 |

**Lower-tier background (read only where the approved spec does not cover the item, and flag any
conflict rather than passing both down):** frozen spec `C5 §5.6.10` (overview) · `§5.6.11` (Smart Match) ·
`§5.6.12` (repository) · `§5.5.5`/`§5.5.7` (project status machine) · `§5.5.8` (assignment statuses) ·
`§5.8.4`/`§5.8.5` (invite and cancellation mail bodies) · `C6 §2.4.14` (assignment data dictionary) ·
`PROJECT_MASTER §5.10–§5.12`. Superseded mockups: `docs/mockups/hostesses-screen/01–06.png`.
🔴 **Where they conflict with `docs/specs/module_04_hostesses/`, the approved spec wins** — it is tier 2.

**Test infrastructure:** Vitest via `npm run test:run` · Playwright specs in `e2e/` via
`npm run test:e2e` (**excludes smoke**) · smoke via `npm run smoke` · full gate `npm run gate`
(lint · format · unit · build · jscpd · knip · audit · context · docs-structure) ·
CI `.github/workflows/ci.yml` — **runs neither E2E nor smoke.**

### Existing files to touch or reuse

| Path | Why |
|---|---|
| `supabase/functions/send-email/index.ts` **⚠️ shared-surface** | `:69` hardcodes `'הצעות מחיר'`; `:84` requires `pdf_base64` |
| `src/lib/email.js` **⚠️ shared-surface** | consume as-is; move the 2 quote-specific strings out (`~:134`, `~:164`) |
| `src/lib/quotes.js` **⚠️ shared-surface** | receives those strings; `~:216` holds `recommended_hostess_count` |
| `src/modules/03_quotes/QuoteDocumentDialog.jsx` **⚠️ shared-surface** | transport at `~:260` (+ 3 metadata fields `:263-265`) — extract to the engine |
| `src/lib/email.test.js` **⚠️ shared-surface** | `:235`, `:240`, `:284` assert the two moved strings |
| `e2e/quote-email.spec.js` **⚠️ shared-surface** | `:229`/`:235`/`:239-242` pin the gate order **by line number** |
| `src/CLAUDE.md` **⚠️ shared-surface** | `~:300-304` says the disable-reason lives in the engine and that `params` holds 6 templates — both become false |
| `src/modules/03_quotes/CLAUDE.md` **⚠️ shared-surface** | documents that the disable-reason was left generic **on purpose** |
| `src/lib/apiError.js` | `assertRowsAffected` / `RLS_DENIED` — the post-write row-count pattern |
| `src/modules/02_customers/api.js` · `src/modules/03_quotes/api.js` | the two existing `api.js` precedents (03 is the newer) |
| `src/modules/02_customers/CustomerFormDialog.jsx` | dialog language for 3ב/3ג (locked ח"פ ≙ locked ת"ז; contacts-in-form ≙ unavailability ranges) |
| `src/modules/02_customers/CustomerDetailsPage.jsx` | structure for 3ד — **as an overlay, not a page** |
| `src/components/` | `StatTile` · `Money` · `LtrFieldGroup` · `ConfirmDialog` · `LoadingOrError` · `RowAction` · `ToastProvider` |
| `src/App.jsx` **⚠️ shared-surface** | `:126-129` — the route **already exists** with `<UnderConstruction>`; replace it, and add the public route |
| `src/App.routes.test.jsx` | AST guard: any screen under `<MainLayout>` without `<ProtectedRoute>` fails |
| `scripts/demo-seed.mjs` **⚠️ shared-surface** | extend with the 5 hostesses of `spec.md §3.1` |
| `docs/schema.sql` · `e2e/smoke-anchors.json` **⚠️ shared-surface** | snapshot + regression anchors |

🚫 **Already wired — do NOT re-add, it would duplicate:** `Sidebar.jsx:36` (`דיילות → /hostesses`) ·
`App.jsx:126-129` (route + `ProtectedRoute allow="דיילות"`) ·
`PermissionsMatrixPage.jsx:31` (`GROUPS` → `'דיילות'`). **All three measured present 08/08/2026.**

**Files to create:** `src/modules/04_hostesses/{api.js, HostessesPage.jsx, RepositoryTab.jsx,
OverviewTab.jsx, SmartMatchPage.jsx, HostessFormDialog.jsx, HostessViewCard.jsx,
AssignmentRowMenu.jsx, PublicConfirmPage.jsx}` · **`src/modules/04_hostesses/CLAUDE.md`** — the
module's own gotchas file, **written incrementally as traps are found, not cold at the end**
(`module-close/template.md` treats it as binding; the precedent is
`src/modules/02_customers/CLAUDE.md`) · `src/lib/{smartMatch.js, hostesses.js}` + tests ·
`e2e/hostesses.spec.js` · `e2e/smart-match.spec.js` · 5 migrations.

### 🔑 Test Identities (MANDATORY — the recurring load-bearing gap)

**Resolve `role → email → user_id` LIVE, never hard-code.** Verified 08/08/2026: 5 `E2E_*` pairs exist
in `.env.local` — `E2E_CEO_*` · `E2E_STAFF_*` · `E2E_FINANCE_*` · `E2E_PROJECTS_*` · `E2E_RECRUIT_*`.
**`E2E_RECRUIT_*` = `recruit.test@regin.co.il` = מנהלת גיוס ושיבוץ** — edit on 'דיילות',
view on 'פרויקטים', **blocked on 'לקוחות'**.

**RLS impersonation:** `set_config('request.jwt.claims', …)` carrying **both `sub` and `email`** —
one missing key makes every query return 0 rows and *look* like perfect RLS.
🔴 **Positive control, mandatory:** impersonating `recruit.test@regin.co.il` MUST return ≥1 hostess row
after step 1.4. A `0` there means **broken impersonation, not working RLS**.
🔴 **Before writing any policy, confirm the gate string resolves:**
`select module_id from modules where module_name = 'דיילות'` → exactly one row. The `modules` rows are
**not** seeded by any migration (`grep -rn "insert into modules" supabase/migrations/ docs/schema.sql`
→ nothing), so this is not derivable from the repo. **A missing row makes every policy NULL and every
new table silently deny-all.**

### Environment facts

`@/supabaseClient` (**not** `@/lib/supabaseClient`) · alias `@/` → `src/` · dev server 5173 ·
Tailwind v4, no config file · Radix is one package `radix-ui` · full RTL, physical utilities only ·
`moddatetime` lives in schema **`extensions`** (`20260710164420`) — qualify it ·
Supabase project `Reg-In`, ref `yfeovxppnfoafmfbdfvh`.

---

## §3 🧭 Decisions Ledger

| Item | Ruling | Who · when | Unblocks |
|---|---|---|---|
| §7.64 | ת"ז leaves the PK → `hostess_id bigint identity`; `id_number` stays `unique not null` | ישי 31/07 | 1.1 |
| `db_roadmap:140` | `hostesses.rating` → **`int null check (1..5)`**; `NULL` = "not yet impressed". *(Not §7.64 — a standalone row)* | ישי 08/08 | 1.1, 3.2 |
| §7.88 | one-event-per-day = **denormalized `assignments.event_date` + sync trigger**, incl. on event-date change | ישי 08/08 | 1.2 |
| §7.88↳ | **Enforcement point = `finally_approved` only.** ⚠️ §7.29/§7.54 (ישי 30/07) said "active statuses" incl. `pending`; §7.88 (ישי 08/08) narrows it, citing `processes-approved.md:242`. **Both quoted to Ishay 08/08; he confirmed the later one.** 🔴 **Cost, recorded so it is not rediscovered:** §7.54's bonus — the same index also blocked two active rows on the *same project* — **is lost**, and `db_roadmap` row **A-15 stays open** | ישי 08/08 | 1.2 |
| §7.89 | release-message template seeded **verbatim** from `processes-approved.md:264-266`; each placeholder ruled on its own merits | ישי 08/08 | 1.3 |
| §7.90 | reliability-off flag lives in **`params`** — 🚫 never auto-derived from "no attendance rows" | ישי 08/08 | 1.3, 2.2, 3.4 |
| §7.91 | T-24 alert **derived at read time**, like `פג תוקף` — no column, no migration, no M10 dependency | ישי 08/08 | 3.3 |
| §7.66 | min-wage enforced by a **write-time trigger**; existing rows never auto-raised; the report is M9's | ישי 31/07 | 1.4 |
| §7.69 | travel = fixed sum per shift, own column, never folded into pay. **Amount still open** — verified with the accountant before M10 | ישי 01/08 | 1.1, 1.3 |
| §7.67 | ⏸️ **`project_shifts` DEFERRED.** Its main justification collapsed with "אירוע דו-תפקידי לא קורה" (ישי 01/08). One shift per project ⇒ the project row *is* the shift; re-adding later is one row per project, a mechanical backfill. 🔴 **§7 write-back required this session (rule 13א)** | ישי 08/08 | — |
| §7.65 | ✅ **CLOSED — no UNIQUE on `hostesses.email`**, plus a **soft warning** in the form (*"כתובת זו כבר רשומה אצל \<שם\> — להמשיך?"*). ⚠️ **Read the WHOLE item before quoting it:** `PROJECT_MASTER_sec7.md:207` still ends *"חלק-ה-hostesses נשאר להנהון במודול 4"* — and **`:208` immediately closes it**. A fresh-context reviewer read only `:207` and reported this as open; so did an earlier revision of this guide. **The ruling reverses the item's own original direction** ("hostesses = UNIQUE"), which is exactly why the stale sentence still reads as live | ישי 31/07 | 1.1 |
| local-1 | `email`/`city`/`bank_*` **stay NOT NULL**; the form stars all five and blocks save. ⚠️ Deviation from mockup `06` (stars 4) and `07` (stars 3 — ת"ז is locked there) — recorded as Ishay's dated ruling; mockups not redrawn | ישי 08/08 | 3.2 |
| local-2 | Confirmation mail: address = `projects.final_location`; field contact = **the shift lead if marked**, else the project manager (`users.full_name`/`users.phone` via `projects.owner_email`). **Applies to `תבנית_תזכורת_משמרת` too — same three placeholders** | ישי 08/08 | 1.3, 2.3 |
| local-3 | travel param seeded `0`; while `0`, screen and mail print `+ נסיעות` with **no number** | ישי 08/08 | 1.3, 3.6 |
| local-4 | ⏸️ **Exposure log DEFERRED** — it measures real usage, and there are no real users before the conference | ישי 08/08 | — |
| local-5 | **`projects.customer_name` snapshot** — written at conversion, backfilled for existing rows. **Why:** מנהלת גיוס is `blocked` on 'לקוחות' (live) and `customers`' SELECT policy (`schema.sql:363-367`) demands view/edit there ⇒ an embedded customer join returns null **silently** on three approved surfaces. `projects` already snapshots `event_name` for this exact reason (§7.76, `schema.sql:502`) | קלוד, anchor §7.76 — Ishay may override | 1.1, 2.3 |

🔗 **מראת §11.1 — SSOT: `module4_smart_match_research.md §11`. Do NOT copy its numbers into this guide.**
*(`spec.md §12④`: duplicate the reasoning, never the number — §11 has already been corrected three times.)*
Every constant (weights · gate · goalpost · `m` · window · leverage rate · cap) is **read from `params`
at runtime and from §11.1 at write time.** This guide names none of them.

### Assumptions (spec-silent) — presented for approval, not decided invisibly

| # | The assumption | Chosen value + why | Source |
|:-:|---|---|---|
| 1 | "weeks since she worked" — `floor`/`round`, clock to *event date* or *now*? | `floor`, to **the event date** — the score describes her *for this event* | `spec.md` ⑭#3 |
| 2 | rounding of sub-scores before weighting | **none** — one rounding of `score × leverage` at the very end | ⑭#4 |
| 3 | 12→24-month window — is a single answer before or after widening? | count the base window first; widen **only if <3 answers**, then recount | ⑭#5 |
| 4 | is `C` on one fixed window or per-hostess windows? | **one fixed base window** — `C` is a company property | ⑭#6 |
| 5 | "neutral score" with no coordinates = average **of what**? | **`0.5`** — mid-goalpost. 🚫 pool average is the sample-dependence §11.3#3 forbids | ⑭#7 |
| 6 | tie-break inputs | `md5(project_id::text ‖ hostess_id::text) ASC`. ⚠️ **`event_id` does not exist** | ⑭#8, ⑳ |
| 7 | attendance counts arrive cumulative ⇒ de-dup untested | de-dup by `MAX(assignment_number)` **in SQL**, plus a dedicated unit test | ⑭#9 |
| 8 | shift-lead column + "one per event" | `assignments.is_shift_lead boolean not null default false` + `unique index on (project_id) where is_shift_lead` — **DB-enforced**, per §7.29's own precedent | ⑲(1) |
| 9 | unavailability shape + is the end day included? | `hostess_unavailability(unavailability_id, hostess_id, start_date, end_date, note)`; gate test `final_event_date between start_date and end_date` — **inclusive**, consistent with §7.30 and every UI label | ⑲(2) |
| 10 | `רבעון אחרון` window | **rolling 90 days**, identical on surface 3 and card 3ד | 🆕 no spec source |
| 11 | `עבדה אצל <לקוח> N×` counting rule | distinct projects whose final row is `finally_approved` **and** `final_event_date < today` | 🆕 no spec source |
| 12 | `לא ענתה ל-N האחרונים` definition | final row per `(project_id, hostess_id)`, ordered `invite_sent_at DESC`, take N; fires when all N are `pending` | 🆕 no spec source |
| 13 | `הושלם` in the view-card history | **a derived display label** (`finally_approved` + past event date) — 🚫 not a seventh status | 🆕 no spec source |
| 14 | ₪ glyph order | `<Money>` everywhere ⇒ `45 ₪`. Mockup `03` draws glyph-first 12×; `05`/`08` and `src/CLAUDE.md:117-118` say otherwise, and the code rule wins | 🆕 no spec source |

---

## §4 🛡️ Security & Auth Model

Leans entirely on module-1 auth. **RLS is the enforcement; the UI is convenience.**

| Table | Policy gate (§7.21 template, `(select …)` wrapped) |
|---|---|
| `hostesses` · `assignments` · `hostess_unavailability` · `customer_hostess_preference` | module **`'דיילות'`** — select on `('edit','view')`, write on `'edit'` |
| `projects` | **SELECT only**, module **`'פרויקטים'`** — matrix §3 gives מנהלת גיוס 👁 (verified live). 🚫 M4 never writes `projects` except its own additive `customer_name` backfill |
| `email_log` | widen `entity_type` CHECK by **one** value `'shift'` + **a NEW module-gated SELECT policy on 'דיילות'**. 🚫 Never widen the existing quote policy to "any authenticated" |

**Public path — the only unauthenticated writer in the system (§7.45):**
`assignments` stays **fully deny-all to `anon`**. The single entry point is
`respond_to_shift_invite(token, response)` — `SECURITY DEFINER`, `anon`-executable,
`set search_path = ''`, taking **only** token + choice, writing **only** `assignment_status` +
`responded_at`, on **one** row, and only when all three conditions hold: token valid · token in date
(48h from `invite_sent_at` **and** ≥24h before the event) · status still `pending`.
**One fixed generic error string to the client**; the real reason goes to the server log only.
🔴 `invite_token` must be **long and cryptographically random** (`gen_random_uuid()` or equivalent),
never sequential, **`unique`, with its own index** — the RPC does `WHERE invite_token = $1` on every call.

**UI permission gates — the convenience half, and it has its own failure modes.**
Every module-4 screen sits behind `<ProtectedRoute allow="דיילות">` (`App.jsx:128`) — **except the
public page, which sits outside `<MainLayout>` with no guard at all** (step 3.6). The `allow` string is
a **raw Hebrew literal that must be byte-identical** to the `modules` row; a typo denies everyone
**silently** (deny-by-default). Within a screen, edit-vs-view is read from the permission map, and
🔴 **a blocked control is NOT RENDERED, never rendered-disabled** — the rule already set on surfaces
2/3/4/3ב. `src/App.routes.test.jsx` is the AST guard that catches a screen left unwrapped; it must be
extended **deliberately and with a comment** for the public route, exactly as `index`/`profile`/`*` are.
⚠️ *"לא הצלחנו לטעון הרשאות" is not "אין לך הרשאה"* (`src/CLAUDE.md`) — on a permissions-load failure the
map is **not** reset, and `ProtectedRoute` shows a retry **after** `isAllowed`. Do not "fix" that.

**Session/OAuth:** inherited unchanged from module 1 — the session lives in `sessionStorage` and dies
with the tab (deliberate); Google sign-in returns to `/`, so any auth error must travel through
`authError` in `AuthContext`. Module 4 adds nothing here **except** the public route, which must work
**with no session at all** — verify it signed out, not just in an incognito-looking tab.

**Declared limitation:** bank details and ת"ז are hidden **in the UI only** (§7.63 deferred to M6/M8).
Any role with row-read on `hostesses` can read those columns via the API. **Stated, not a hole to plug.**

---

## §5 🗡️ DB Design Challenge

*(Mandatory adversarial pass — `template.md`. One line per sub-check, **including the ones that found
nothing**, so a session that ran all seven is distinguishable from one that skipped them.)*

| Sub-check | What was examined | Finding |
|---|---|---|
| **Keys & mutability** | `hostesses.id_number` as PK; `assignments`' composite PK | 🔴 **Finding:** ת"ז is PII replicated into every assignment row, and a check-digit correction after events is blocked. → surrogate `hostess_id` (§7.64). Both tables empty ⇒ no data migration |
| **Relationships & lineage** | can every derived row be traced to its source? | 🔴 **Finding:** `assignments` points only at `project_id` — no link to a service line (§7.67). **Ruled: deferred**, because one shift per project makes the project row the shift |
| **Lifecycle & writers** | six statuses; who writes each; time anchors | 🔴 **Finding:** `approval_withdrawn` is in the approved vocabulary and **not** in the CHECK (`schema.sql:170-171` has five). → widened in Migration A. `פג תוקף` stays **derived**, not a seventh value. `projects.project_status` has **no M4 writer** (§7.44↳, M6 owns it) |
| **Screen-to-column audit** — every displayed number has a named source | all 8 approved surfaces + all 8 approved mockups | 🔴 **Two findings.** (1) three surfaces print the customer name; `projects` carries only `customer_id`, and מנהלת גיוס is blocked on `customers` ⇒ silent null. → `projects.customer_name` snapshot (local-5). (2) the public page prints a travel amount with no param. → local-3. ✅ Everything else resolves: `במאגר מ-DD/MM` → `hostesses.created_at` (exists, from A-13); `אירועים · רבעון אחרון` → computed, window in assumption 10; the four counters → `MAX(assignment_number)` per pair |
| **Derived vs stored** | what freezes, what stays live | ✅ **אין ממצאים.** `hourly_rate_snapshot` already freezes at assignment (§א2); `customer_name`/`event_name` freeze at conversion; the score is **never stored** — recomputed per read, which is why the anchor test is a unit test and not a row |
| **Permissions ↔ RLS** | does M4 write columns on a table another module owns? | 🔴 **Finding:** `projects` is shared with M6/M8 (§7.63). M4 takes **SELECT only**, plus one additive column it populates in its own migration. No write policy on `projects` from M4 |
| **Files/Storage · temporal · migration checklist** | `timestamptz` (§7.56) · money `numeric(12,2)` (§7.74) · `created_at`/`updated_at` (§7.73) · FK covering indexes (C-1) | 🔴 **Finding:** `assignments.hostess_id` is one of the C-1 unindexed FKs and moves to the **new** surrogate column — the index goes there. ✅ No Storage impact: module 4 uploads nothing |

⚠️ **Also read `db_roadmap.md §9` (known reference-spec defects) before deriving anything from C5/C6** —
defect #4 (two overlapping cancel-reason fields) is scheduled for reconciliation at "M4/8" and is
**deferred here**: `docs/schema.sql:134` already has `cancel_reason`, and adding a second
near-identically-named `cancellation_reason` without M8 present would create exactly the confusion
the defect describes.

---

## §6 🏗️ Phase & Step Plan

### Model & effort per phase

| Phase | Model | Effort | Why |
|---|---|---|---|
| 0 — email unlock | Opus | High | touches merged, tested module-3 code |
| 1 — DB/RLS | Opus | High | irreversible migrations on a shared live project |
| 2 — logic | Opus | High | the algorithm is the module; the anchor must reproduce exactly |
| 3 — UI | Opus | Medium | 8 surfaces, all drawn and approved |
| 4 — wiring | Sonnet | Medium | mechanical, but the public route is a security boundary |
| 5 — closing audit | Opus | High | independent re-verification |

> **Every build-unit step below carries all seven fields**: Goal · Files · What to do ·
> Verification (command + expected output) · 🔻 stop-point 🤖/👤 · **`מה ייחשב עובד`**
> (3–5 Hebrew sentences, **quoted from the approved spec, never re-authored**) · **`🗣️ אושר —`**
> (empty until Ishay approves; `module-build` reads this line off disk and re-asks him without it).

---

### Phase 0 — unlock the shared email engine ⚠️ shared-surface

**Step 0.1 · Goal:** make the shared engine usable by module 4 without building a second one.
*(§6 debt `🚧 מ4 · 🚧 מ8 · 🚧 מ11 ← מ3`; Ishay ruled 31/07 this is module 4's FIRST step.)*

**Files:** `supabase/functions/send-email/index.ts` · `src/lib/email.js` · `src/lib/quotes.js` ·
`src/modules/03_quotes/QuoteDocumentDialog.jsx` · `src/lib/email.test.js` ·
`e2e/quote-email.spec.js` · `src/CLAUDE.md` · `src/modules/03_quotes/CLAUDE.md`

**What to do**
1. **Closed server-side map** `entity_type ⇒ required module`: `quote`⇒'הצעות מחיר' · `shift`⇒'דיילות'.
   🚫 **The client never sends a module name** — the server derives it from the resource.
   🚫 **Do NOT add `invoice`/`salary_report`** — `email_log`'s CHECK will not accept them and
   `index.ts` returns `{ok:true, log_failed:true}` on a journal failure ⇒ silent loss. M8/M11 add
   their own value when they widen the CHECK themselves.
2. **Attachment becomes optional.** 🔴 **Keep a per-`entity_type` floor:** `quote` still requires
   `pdf_base64`; `shift` must not. *(Removing it outright deletes a live server guard from the quote
   path, and `e2e/quote-email.spec.js:118,134` would stay green while it was gone.)*
3. **Move the 2 quote-specific strings** out of `src/lib/email.js` (`~:134` `emailSendDisabledReason`,
   `~:164` the failure text) into `src/lib/quotes.js` — **and move their assertions with them**.
4. **Extract the transport** (`functions.invoke` + timeout + the 3 `email_log` metadata fields) from
   `QuoteDocumentDialog.jsx` (`~:260`, fields `:263-265`) into the engine.
5. **Ripple, same session:** `src/modules/03_quotes/CLAUDE.md` records the disable-reason as
   deliberately generic — now false. `src/CLAUDE.md ~:300-304` says the disable-reason lives in the
   engine and that `params` holds 6 templates — both become false. `e2e/quote-email.spec.js:240`
   hardcodes *"403 בשורה 71 … אימות-השדות רק בשורה 84"* — the numbers move.

🔴 **Gate-order contract — do not break it.** `e2e/quote-email.spec.js:239-242` pins that the
**permission gate runs before body parsing**; `:229` sends `{}` as FINANCE expecting **403**, `:235`
sends `{}` as CEO expecting **400**. ⇒ **Parse only `entity_type`, gate, then validate the rest**, and
update the comment's line numbers.

**🔻🤖 Verification** — `npm run test:run` (**this suite breaks first**) · `npm run test:e2e`
**including the 403/400 pair** · `npm run smoke`. All three named, all three green.

**מה ייחשב עובד** *(`spec.md §12③`, quoted)*
1. *"מנוע-המייל המשותף חוסם היום את מנהלת הגיוס (מקודד קשיח למודול 'הצעות מחיר')."* — after this step
   she is not blocked.
2. *"⛔ לא לבנות מנוע/טבלה מקבילים"* (`§6`) — `jscpd` stays green; no second engine exists.
3. `PROJECT_MASTER §6`: *"הלקוח לא שולח שם-מודול — השרת מסיק את ההרשאה מהמשאב."*

⚠️ **Attribution correction (09/08/2026, measured):** `spec.md §12③` is **two lines** and supplies
**only bullet 1**. Bullets 2 and 3 come from `PROJECT_MASTER §6` (`:400`, `:416`) — the header above
over-claimed. The criteria stand; only their provenance changes.

**🗣️ אושר 09/08 07:53** — Ishay approved the Phase-0 plan (`~/.claude/plans/4-warm-nygaard.md`),
covering steps 0.1–0.3 as one unit. **Approved additions beyond the step text:** the shared journal
reader `src/api/emailLog.js` · pinning the `jsr:` import (`ci.yml` `🚧 מ10`) · one Make scenario with
a no-attachment bypass, **which Claude performs himself via Claude-in-Chrome** (Ishay connected it).

---

**Step 0.2 · Migration 0 — `module4_email_log_accepts_shift`** 🔻👤 typed-echo
Widen `email_log.entity_type` CHECK from `('quote')` (`schema.sql:637`) to `('quote','shift')` and add
a **new** module-gated SELECT policy on 'דיילות'. 🔴 **This must land before any `shift` mail is sent** —
otherwise the send succeeds, the journal insert fails, and `index.ts` swallows it.
**🔻🤖 Verify:** `pg_get_constraintdef` shows both values; `select count(*) from pg_policies where
tablename='email_log'` → 2; advisors → zero new.
**מה ייחשב עובד** *(`src/CLAUDE.md`, quoted)*: *"'האם כבר נשלח' נענה רק מטבלת `email_log`"* — a shift
mail must leave a journal row, or the anti-double-send guard does not exist for module 4.
**🗣️ אושר 09/08 07:53** *(plan approval; the 🔻👤 typed-echo before `apply_migration` is still owed.)*

**Step 0.3 · Deploy the Edge Function and re-verify live.**
🔴 **Without a deploy the live checks exercise the OLD function.** CI only type-checks it.
**🔻🤖 Verify live:** as `E2E_RECRUIT_*`, `entity_type='shift'` ⇒ **200 and a row in `email_log`**;
`entity_type='quote'` ⇒ **403**. As `E2E_CEO_*`, both ⇒ 200.
**🧩 handover:** if deploying needs the Supabase dashboard or a token Claude does not hold, print
step-by-step Hebrew instructions **plus** a self-contained "🧩 פרומפט לקלוד בדפדפן" — no secrets.
↳ **as-built 09/08/2026: no handover needed for the deploy.** Supabase MCP was measured live this
session and exposes `deploy_edge_function` ⇒ Claude deploys it himself.
↳ **New prerequisite the step did not carry: the Make scenario.** `regin-quote` runs
`toBinary(pdf_base64;"base64")` and attaches on every send, so an attachment-less `shift` mail has no
proven path. Ishay ruled 09/08: **one scenario with a bypass** (empty `pdf_base64` ⇒ send without the
attachment module), performed by Claude in Chrome.
**🗣️ אושר 09/08 07:53**

↳ **as-built 09/08/2026 — the half that IS done, with its evidence.**
Deployed via MCP `deploy_edge_function` → **version 4, ACTIVE, `verify_jwt: true`**.
🔬 **Gate proven against the LIVE function on 7 cases, and not one mail left the system** — every
call carried a body missing `to`/`body`, so each stops at field-validation, **after** the permission
gate and **before** the mail module. `400` here therefore means *"passed the gate"* and is the
positive result:
`RECRUIT + shift → 400` · `RECRUIT + quote → 403` · `RECRUIT + no entity_type → 403` (defaults to
`quote`) · `RECRUIT + invoice → 403` (deny-by-default) · `CEO + shift → 400` · `CEO + quote → 400` ·
`FINANCE + shift → 403`.
🔑 **Why this shape of test is worth reusing:** it proves the map, the ordering contract, and the
role matrix **without any side effect at all** — no mail, no `email_log` row, no data.
🔴 **STILL OWED, and the step is NOT closeable without it:** the Make bypass (empty `pdf_base64` ⇒
send without the attachment module) and **one real shift mail**, eyeballed for RTL. Until then the
attachment-less path has never actually run end-to-end.
⚠️ **And one honest limit on the deploy itself:** the function was uploaded by transcribing the repo
file into the MCP call, so repo⇄deployment identity is verified **behaviourally** (the 7 cases), not
byte-for-byte. **Re-check it byte-wise at module close** — `get_edge_function` returns the deployed
source, and on 09/08 the pre-change comparison was clean.

---

### Phase 1 — DB / RLS

> Every step embeds the Migration Design Checklist (`db_roadmap.md §1`).
> **🔻👤 typed-echo before EVERY apply** — Ishay types the migration name; "yes" is not enough.
> After each: `get_advisors(security)` → zero new (or a written triage note) · refresh `docs/schema.sql` ·
> commit migration + snapshot **together** · update `db_roadmap.md §10` in the same session.
> **🔻👤 Phase door (§9h):** sweep the ledger for OPEN items anchored to Phase 1 before step 1.1.
> **Measured 08/08/2026: there are none** — §7.65 was verified closed (`PROJECT_MASTER_sec7.md:208`).
> 🚫 Do not re-ask Ishay about hostess-email uniqueness; it was ruled 31/07.

**Step 1.1 · Migration A — `module4_hostesses_surrogate_key_and_columns`**
Template to copy: `20260710160735_module2_customers_surrogate_key_rls_and_marketing.sql` (it did exactly
this to `customers`, including the RLS).
🔴 **Re-measure emptiness immediately before applying** — `select count(*) from hostesses, assignments`.
The "0 rows" reading is from 08/08/2026, and it is the one claim whose being wrong is irreversible.

- `hostesses`: `hostess_id bigint generated always as identity` PK; `id_number` → `unique not null`;
  `rating` → **`int null check (rating between 1 and 5)`**; add `address text`, `lat numeric`,
  `lng numeric`, `has_car boolean not null default false`, `languages text[] not null default '{}'`.
  🚫 `email`/`city`/`bank_*` **stay `not null`** (local-1). 🚫 **No UNIQUE on `email`** — §7.65, ruled 31/07;
  the duplicate-email warning is a soft, non-blocking one in the form.
- `assignments`: PK → `(project_id, hostess_id, assignment_number)`, FK → `hostesses(hostess_id)`;
  add `responded_at timestamptz`, `invite_token text unique`, `invite_sent_at timestamptz`,
  `travel_amount numeric(12,2) not null default 0`, `is_shift_lead boolean not null default false`,
  `event_date date`; widen `assignment_status` CHECK to **six** values (+`approval_withdrawn`);
  `unique index on assignments(project_id) where is_shift_lead`.
- `projects`: `lat numeric`, `lng numeric`, **`customer_name text`** (local-5) + backfill from `customers`.
- Indexes: `assignments(hostess_id)` (C-1) · `assignments(invite_token)`.
- ⏸️ **Deliberately NOT here, each with a §6 line written this session:** `attendance_status`/
  `lateness_level`/`no_show_reason` → **M6 creates them with the screen that fills them** ·
  `projects.cancelled_at`/`cancellation_reason` → **M4/8 jointly, deferred to M8**; note
  `schema.sql:134` already has `cancel_reason`, and `db_roadmap §9` defect #4 is exactly this collision ·
  `projects` "סיווג קצר/ארוך" (`db_roadmap:118`, module `4`) → **deferred**: §7.29 retired the
  classification for the double-booking gate, and no surviving module-4 requirement reads it.

**🔻🤖 Verify:** `\d hostesses` shows `hostess_id` as PK · an insert omitting `rating` reads back `null` ·
`select count(*) from projects where customer_name is null` → `0` · advisors zero new.
**מה ייחשב עובד** *(`spec.md §1.3`/`§1.4`, quoted)*
1. *"`hostess_id` (`bigint identity`) — לא `id_number`"* — ת"ז no longer appears in any key.
2. *"ודיילת שלא דורגה מציגה `—`, לא `3 ★`"* — the column can now hold "not rated".
3. *"אושרה סופית · ביטלה אחרי אישור"* — all six statuses are writable.
**🗣️ אושר —**

**Step 1.2 · Migration B — `module4_one_event_per_day_constraint`** *(§7.88)*
`assignments.event_date` synced by trigger **in both directions** — on assignment insert/update, **and
on `projects.final_event_date` UPDATE** (else the constraint goes stale silently).
`create unique index … on assignments(hostess_id, event_date) where assignment_status = 'finally_approved'`.
🔴 **`finally_approved` only.** Two same-day *invitations* stay legal.
🔴 The trigger must not error on M3's conversion RPC (`20260723115000:94-100`), which creates a project
with **zero** assignments.
**🔻🤖 Verify (rolled-back transaction):** two `finally_approved`, same hostess, same date ⇒ **error** ·
two `pending` same day ⇒ **allowed** · change `projects.final_event_date` ⇒ `assignments.event_date`
follows · re-run `approve_quote_and_create_project` ⇒ still succeeds.
**מה ייחשב עובד** *(`spec.md §2.2(א)`, quoted)*: *"דיילת אחת בשני אירועים באותו יום ⇒ **חסימה, ואילוץ
במסד ולא בדיקה בקוד**"* · *"והמסד חוסם, לא הקוד"* (`§ מה ייחשב עובד` #5).
**🗣️ אושר —**

**Step 1.3 · Migration C — `module4_tables_params_and_templates`**
- **`hostess_unavailability`** — `(unavailability_id bigint generated always as identity primary key,
  hostess_id bigint not null references hostesses(hostess_id) on delete cascade, start_date date not
  null, end_date date not null, note text, created_at timestamptz not null default now(), updated_at
  timestamptz not null default now())` + `check (end_date >= start_date)` +
  `extensions.moddatetime(updated_at)` + covering index on `hostess_id`.
- 🔴 **`customer_hostess_preference`** — `(preference_id bigint generated always as identity primary
  key, customer_id bigint not null references customers(customer_id) on delete cascade, hostess_id
  bigint not null references hostesses(hostess_id) on delete cascade, preference text not null check
  (preference in ('מצוינת','בסדר','לא_לשלוח')), preference_reason text, created_at, updated_at)` +
  `unique (customer_id, hostess_id)` + covering indexes + moddatetime +
  `check (preference <> 'לא_לשלוח' or preference_reason is not null)` — **a negative mark requires a
  written reason** (`db_roadmap:145`; TempWorks/Avionté precedent).
  🔴 **M4 CREATES and READS it (Smart Match layers 1 and 2); M6 WRITES it** — `🚧 מ6 ← מ4`.
  **Without it the gate's third condition has nothing to read.** It stays **empty** until M6.
- **`params`.** 🔴 **Derive the list, do not trust a count** — the registries disagree
  (`db_roadmap:135`'s header says twelve; §11.1 marks **10** rows as `params`, one as `קוד`).
  **The list = every §11.1 row whose "חי ב־" cell reads `params`** *(the 12→24 window becomes **two**
  rows — one value per row)* **+ the ➕ rows in `db_roadmap:135`** (`לא_ענתה_ל_N`=4 ·
  `תקרת_דיילות_מומלצת`=6 · `מרכיב_אמינות_פעיל`) **+ `סכום_נסיעות_למשמרת`=0** (local-3).
  🔴 The three existing rows `משקולת_1W_דירוג`/`2W_קרבה`/`3W_מהימנות` are **replaced, not renamed** —
  the new algorithm has no "rating" component. **Fix `db_roadmap:135`'s header in the same session.**
- **The release-message template** — seed **verbatim** from `processes-approved.md:264-266`
  (the body spans **two lines**; reading only `:265` truncates it). Name it in the same Hebrew style as
  the four existing shift templates. 🚫 Do not reuse `תבנית_מייל_ביטול_משמרת` — "your shift was
  cancelled" is a lie; she was never assigned.
- **Placeholders (local-2):** `[כתובת_אירוע_מלאה]` and `[עיר_אירוע]` → `projects.final_location` ·
  `[שם_מנהלת_פרויקט]`/`[טלפון_מנהלת_פרויקט]` → `users.full_name`/`users.phone` via
  `projects.owner_email` · **a marked shift lead replaces them.** ⚠️ Applies equally to
  `תבנית_תזכורת_משמרת`, which carries the same three.

**🔻🤖 Verify:** `select count(*) from params where param_name = any($1)` equals the length of the
derived list · all five hostess templates present · `insert` with `end_date < start_date` → error ·
`insert` with `preference='לא_לשלוח'` and null reason → error.
**מה ייחשב עובד** *(`spec.md §2.1(3)`, quoted)*
1. *"המנהלת מזינה **טווח תאריכים + הערה**. מאותו רגע Smart Match **פשוט לא מציע אותה** — תנאי חמישי בשער."*
2. *(`§ב6`)* *"תודה שהתפנית — המשרה כבר אוישה לאירוע הזה"* — the wording exists in `params`, not in code.
**🗣️ אושר —**

**Step 1.4 · Migration D — `module4_rls_and_public_rpc`**
- §7.21 policies on `hostesses` · `assignments` · `hostess_unavailability` ·
  `customer_hostess_preference` (module 'דיילות'); **SELECT-only** on `projects` (module 'פרויקטים').
- Min-wage trigger (§7.66) — `before insert or update of hourly_rate on hostesses`, reads
  `params.שכר_מינימום_שעתי`, raises Hebrew `P0001`. **Copy the guarded read from `20260731085335`:
  read as TEXT, validate (missing/blank/non-numeric/out-of-range), then cast** — `''::numeric` raises
  an English cast error instead of ours. 🚫 Existing rows are never auto-raised.
- `respond_to_shift_invite(token, response)` exactly per §4. Accept `'confirmed'|'declined'` and map to
  the column values inside the function.

**🔻🤖 Verify — prove the guard FAILS, not just that it passes**
- **Positive control first:** `recruit.test@regin.co.il` returns ≥1 hostess. A `0` = broken
  impersonation, **not** working RLS.
- `finance.test@regin.co.il` → `0` hostesses; `projects.test@regin.co.il` reads but cannot write.
- Drop the `hostesses` SELECT policy inside a rolled-back transaction, confirm the screen shows an
  **error and not an empty list**, roll back.
- `anon` cannot select/update `assignments` directly; the RPC works with a valid token and returns the
  **identical generic string** for wrong-token / expired / not-`pending`.
- Min-wage: `hourly_rate = 30` → Hebrew error; `= 40` → succeeds.

**מה ייחשב עובד** *(`spec.md § מה ייחשב עובד` #4, quoted)*: *"מסך שלא הצליח לטעון אומר זאת. לעולם לא
רשימה ריקה בשקט. (RLS-בלי-policy מחזיר `{data:null, error:null}` — 'אין אירועים' כשהשאילתה נכשלה הוא
הכישלון החמור ביותר במודול.)"*
**🗣️ אושר —**

**Step 1.5 · 🔻👤 Phase-1 gate** — advisors clean · `docs/schema.sql` refreshed and committed with the
migrations · `db_roadmap.md §10` Done rows written · every `🚧` has its byte-matching §6 line ·
§7.67 write-back done · **recommend Ishay run `regin-docs-sync`** (rule 13ז — Claude never
runs routines).

---

### Phase 2 — business logic

**Step 2.1 · `src/lib/hostesses.js`** — Israeli ID check digit (validated **while typing**, the only
field that does not wait for blur) · min-wage validation mirroring the DB trigger · unavailability
overlap (inclusive both ends) · derived states: `פג תוקף`, the T-24 alert, the `הושלם` display label.
Unit tests beside it.
**מה ייחשב עובד** *(`spec.md §2.1(1)`, quoted)*: *"ת"ז נבדקת **תוך כדי ההקלדה** (היחיד שאינו ממתין
ליציאה מהשדה) … שכר מתחת למינימום **חוסם** · אימייל כפול **מזהיר ולא חוסם**."*
**🗣️ אושר —**

**Step 2.2 · `src/lib/smartMatch.js`** — the four layers, numbers read from `params`, **never hardcoded**.
🔴 **Layer 1 gate — five conditions:** `status='active'` · no `finally_approved` assignment on that date ·
**not marked `לא_לשלוח` for this event's customer** · distance within the gate · **no declared
unavailability covering the event date**. ➕ conditional gate: beyond the goalpost distance **without a
car ⇒ rejected**.
🔴 **Layer 3** — three components, damped toward the company average `C`. **`C` is computed over ALL
hostesses in the company, including those the gate rejected** (§11.3).
🔴 **The reliability component is switched off by `params.מרכיב_אמינות_פעיל`, and the remaining weights
RENORMALIZE to sum to 1.0** — 🚫 **never hardcode the two-component split.** *(`spec.md §3.5(א)`: a
hardcoded split **passes the regression anchor** and is wrong the day M6 turns reliability on.)*
🔴 **Layer 4** — leverage multiplies the **raw** score, **one rounding at the very end**; weeks measured
from when she **WORKED** (`max(projects.final_event_date)`), not when invited; a hostess who never
worked gets **`0` weeks, not the cap**.
🔴 **The tie-break runs in SQL, not in JS** — there is no md5 in `package.json` and
`crypto.subtle` does not implement it. ⇒ layers 1–2 and the tie-break ordering are the **query**;
layers 3–4 arithmetic is the **pure module**. Say so in the file header.
🔴 **Reasoning chips are TWO families and must not share one CSS class** (`spec.md §1.5`):
`chip.score` vs `chip.ctx` vs absence markers vs the pin tag `מצוינת אצל הלקוח הזה` (its own row,
above the score chips, teal).

**Unit tests** — 🎯 the hand-computed anchor from `spec.md §3.2`: **the three scores and the order
`נועה ← מיכל ← דנה`, with two candidates absent entirely.**
⚠️ **Date-free** — feed weeks/km/counts directly; never pin to a calendar date (`e2e/CLAUDE.md` records
eight tests broken once by exactly that).
➕ `§11.10` #2–#5 **and** the three holes named in `spec.md §3.5`: a hardcoded-split implementation ·
a never-worked hostess given the cap · mid-computation rounding. **All three must FAIL a wrong
implementation** — write them by breaking the code deliberately and watching them go red.
**מה ייחשב עובד** *(`spec.md § מה ייחשב עובד` #7 + `§3.2`, quoted)*: *"הציון הידני שחושב באפיון תואם
את מה שהקוד מחשב"* · *"וסדר-התצוגה: נועה ← מיכל ← דנה. שתי מועמדות אינן ברשימה כלל."*
**🗣️ אושר —**

**Step 2.3 · `src/modules/04_hostesses/api.js`** — 🔴 **filter in the query, never
pull-everything-and-filter-in-the-browser** (`§6`, `🚧 מ4 · 🚧 מ6`). Every write does `.select()` and
checks the row count (`assertRowsAffected`, `src/lib/apiError.js`) — an RLS-blocked write returns
`{data:null, error:null}`. Counters come from the row with `MAX(assignment_number)` per
`(project_id, hostess_id)`. Precedents: `02_customers/api.js`, `03_quotes/api.js`.
**מה ייחשב עובד** *(`spec.md §2.2(ג)`, quoted)*: *"הסטטוס הקובע הוא של השורה עם `MAX(assignment_number)`,
לא השורה האחרונה שנוצרה"* — otherwise a hostess who refused and was later overridden is counted
**both as refusing and as accepting**.
**🗣️ אושר —**

**Step 2.4 · 🔻👤 Geocoding — a product decision, not a technical one**
🔴 **The service is NOT chosen** (§7.55): Nominatim (OSM) is the registered *candidate*.
**Bring Ishay:** the ToS as read **in that same turn** (not from memory), the rate limit, whether a key
or account is needed, and a recommendation. 🧩 **If a key is required — Ishay creates it; Claude never
enters credentials.** Then: geocode a hostess **once on save** and an event **on first entry to its
Smart Match screen**, storing to `lat`/`lng`. 🔴 **Failure ⇒ neutral proximity score + a visible
`אין קואורדינטות` marker — never `0`** (§7.55/§11.4). ➕ **Backfill the existing projects** — M3's
conversion RPC does not populate coordinates, so today every event has none.
**מה ייחשב עובד** *(`spec.md §2.1(1)`, quoted)*: *"כתובת מומרת לקואורדינטות **פעם אחת** בשמירה · **נכשל
⇒ נשמרת בכל מקרה** ומסומנת."*
**🗣️ אושר —**

**Step 2.5 · 🔻👤 Phase-2 gate** — the anchor reproduces; `npm run test:run` green.

---

### Phase 3 — UI

**Step 3.0 · 🔧 Shared-component checkpoint — BEFORE the first screen.**
Read all eight approved cards, list what repeats, rule shared vs local. **Default: appears in 3+
surfaces ⇒ shared, in `src/components/`.** ⚠️ **Check `src/components/` first — much of it exists**
(`StatTile` · `Money` · `LtrFieldGroup` · `ConfirmDialog` · `LoadingOrError` · `RowAction`); the finding
is usually "reuse this". Likely new: status tag · reasoning chip (two families) · counter strip.
🚫 Do not plan functions this way — logic already has one home in `src/lib`.

> **Every surface step below is a build-unit.** It opens with a 🗣️ experience-brief and **waits for
> Ishay's approval before code**: (א) the business flow as understood, invited for correction ·
> (ב) planned validations · (ג) which files · (ד) anything spec-silent.
> 🚫 **Approved mockup details are NOT re-flagged for approval** — build them as drawn.
> **Verification for every UI step is functional AND visual** — drive the flow in the live preview and
> attach screenshots as the evidence. 🤖, not a human wait.
> **Mockup → surface map:** `01`→3.3 · `02`→3.4 · `03`→3.1 · `04`→3.5 · `05`→3.6 · `06`/`07`/`08`→3.2.

**Step 3.1 · Surface 3 — hostess repository**
**Files:** `04_hostesses/{HostessesPage.jsx, RepositoryTab.jsx}` · mockup `03_repository_approved.html`
**What to do:** table + the four filters + the two tabs. `—` for an unrated hostess, **never `3 ★`** ·
`מצב` shows a **range** `לא זמינה DD/MM–DD/MM`, never a single end date · the deactivate toggle opens
the §א4 confirmation **only when a future active assignment exists**, naming them by name and date;
with none, it flips immediately. No pagination (≤50 rows). No delete anywhere.
**🔻🤖 Verify:** true-empty vs empty-after-filter show **different** messages · a load failure shows an
error + retry, never an empty table · screenshots of both empty states and the confirmation dialog.
**מה ייחשב עובד** *(`screens-approved.md` מסך 3 §①/§③, quoted)*
1. *"איזו דיילת אני פותחת עכשיו — ומה מצבה, לפני שאני נוגעת בה."*
2. *"חור במוקאפ: יש מסנן 'פעילות בלבד' ואין עמודה שמראה מצב"* — the `מצב` column closes it.
3. *"שתי ההודעות חייבות להיות שונות, אחרת המנהלת חושבת שהמאגר נמחק."*
**🗣️ אושר —**

**Step 3.2 · Surfaces 3ב / 3ג / 3ד — add · edit · view**
**Files:** `04_hostesses/{HostessFormDialog.jsx, HostessViewCard.jsx}` · mockups `06`/`07`/`08`
**What to do:** 🔴 **the rating stars open EMPTY, not preset to 3** — mockup `06:150` draws `3 מתוך 5`;
without this every new hostess is born rated and the `null` column change is worthless.
All five previously-optional fields carry `*` (local-1) · ת"ז validated **while typing**, locked in edit
mode · unavailability ranges accumulate in form memory and are written by the single "שמור שינויים" ·
3ד is an **overlay on surface 3, not a page**, and hides "פרטים עסקיים" + the edit pencil from a
view-only role.
**🔻🤖 Verify:** save without email is **blocked with a clear message** (local-1) · a duplicate email
**warns and does not block** · an ungeocodable address **still saves**, marked · screenshots of each.
**מה ייחשב עובד** *(`processes-approved.md §א1` + `screens-approved.md` 3ב §②, quoted)*
1. *"כרטיס נפתח רק אחרי שהמנהלת כבר דיברה עם הדיילת. אין 'מועמדת ממתינה לאישור'."*
2. *"בשמירה: `פעילה`, ונכנסת מיידית למאגר-המועמדות."*
3. *"נכשל ⇒ נשמרת בכל מקרה ומסומנת"* — a geocode failure never blocks a save.
**🗣️ אושר —**

**Step 3.3 · Surface 1 — assignment overview (triage)**
**Files:** `04_hostesses/OverviewTab.jsx` · mockup `01_overview_approved.html`
**What to do:** shows **`טרם החל` AND `בתהליך`** — every live project is `not_started`, so filtering to
`in_progress` alone leaves the screen empty forever. Default order: **missing first, then by event
proximity.** Five counters + the split `ממתינות N · מתוכן M פג תוקפן`, the expired part **clickable**.
Two KPIs. T-24 alert **derived at read time** (§7.91). The only writing action on this screen is
`שלח שוב`; everything else routes.
**🔻🤖 Verify:** with the seeded data the row order matches "missing first" · `שלח שוב למי שפג תוקפן (N)`
is disabled at `N=0` · a load failure shows an error, **not** *"אין כרגע אירועים"* · screenshots.
**מה ייחשב עובד** *(`screens-approved.md` מסך 1 §②/③ + `spec.md § מה ייחשב עובד` #1, quoted)*
1. *"המנהלת פותחת את המבט-על ויודעת מיד לאיזה אירוע להיכנס — הסדר עונה על זה, לא רשימה."*
2. *"אירוע שבו 6 אישרו זמינות ואיש לא אושר סופית מציג `אושרו 0` ונראה זהה לאירוע שאיש לא ענה בו"* —
   the fifth counter closes it.
3. *"'3 ממתינות' אומר תני להן זמן; '3 פג תוקפן' אומר שלחי לעוד שלוש, עכשיו."*
**🗣️ אושר —**

**Step 3.4 · Surface 2 — Smart Match**
**Files:** `04_hostesses/SmartMatchPage.jsx` · mockup `02_smartmatch_approved.html`
**What to do:** two columns · four counters · the four sort angles · candidate cards with reasoning
chips. 🔴 **The screen SAYS OUT LOUD that the reliability component is off and that the pin tag does not
exist yet** — 🚫 never a silent zero (§7.90). The score stays hidden; the chips explain.
`תענה הכי מהר` renders **disabled + explained** (`opacity:.5` + `— כבוי` + an explanation line) while
response-time data is insufficient — 🚫 it does not vanish and does not sort wrongly.
Excess final approvals **warn, never block**; a same-day double approval is **blocked by the DB**.
**🔻🤖 Verify:** switching angles reorders **the same candidates** and changes neither the list nor the
chips · the disabled-angle state is visible and explained · a blocked double approval returns the row to
its previous state with an explicit message · screenshots of each.
**מה ייחשב עובד** *(`spec.md § מה ייחשב עובד` #2 + `screens-approved.md` מסך 2 §⑥, quoted)*
1. *"Smart Match מחזיר רשימה מדורגת שהיא יכולה להסביר לעצמה — כל שורה נושאת למה היא שם."*
2. *"'אמינות ההגעה כבוי' = המרכיב לא מנורמל לאפס אלא מוסר מהנוסחה, והמשקלים מתחלקים מחדש."*
3. *"ארבע הזוויות מסדרות בלבד — אינן מסננות."*
**🗣️ אושר —**

**Step 3.5 · Surface 4 — per-row action menu**
**Files:** `04_hostesses/AssignmentRowMenu.jsx` · mockup `04_rowmenu_approved.html`
**What to do:** contents **derived from row status**, never a flat list. 🔴 `שלח את הקישור שוב` refreshes
**the same row**; `פתח זימון חדש` creates a **second** row — never merge them. 🔴 `שחרר — המשרה אוישה`
(a system action, counted nowhere) vs `שחרר מהאירוע (צמצום תקנים)` (a manager action) — never one item.
`שלח את הקישור שוב` is **disabled-and-explained in three cases**: inside T-24 · the event is already
staffed · the row is not `pending`. For a view-only role the `⋯` button **does not exist at all**.
No delete, in any status.
**🔻🤖 Verify:** open the menu on all six statuses and screenshot each — the items differ · a failed
action returns the row to its previous state with a message, never a silent "נשמר".
**מה ייחשב עובד** *(`screens-approved.md` מסך 4 §②/③, quoted)*
1. *"מה קרה עם הזימון הזה — ואיך אני רושמת מידע שהגיע בטלפון ולא דרך הקישור."*
2. *"אילו שתיהן היו נקראות 'שלח שוב', המנהלת הייתה מוחקת היסטוריית-מענה בלי לדעת."*
3. *"פריט-תפריט אחד לשתיהן היה מזייף את הציון של דיילת חפה-מפשע."*
**🗣️ אושר —**

**Step 3.6 · Surface 5 — public confirm page** ⚠️ shared-surface *(`src/App.jsx`)*
**Files:** `04_hostesses/PublicConfirmPage.jsx` · `src/App.jsx` · mockup `05_public_confirm_approved.html`
**What to do:** no sidebar, no login, no role. 🔴 **Its route lives OUTSIDE `<MainLayout>`** —
`src/App.routes.test.jsx` fails any screen *under* `MainLayout` lacking `<ProtectedRoute>`, so wrapping
it would satisfy the test **by breaking the page**. Eight states per `screens-approved.md §⑤`:
loading · awaiting-answer · thanks-accepted · thanks-declined · already-staffed · link-expired ·
invalid-link (**identical wording to expired, deliberately**) · network error.
Shows only facts — no score, no comparison. Travel prints without a number while the param is `0`.
🔴 `responded_at` is written **once, on the first answer**; `שלח שוב` resets `invite_sent_at`
**without touching it** (else negative response times), and it is 🚫 **never derived from `updated_at`**
— a trigger overwrites that, and M8 will write `salary_report_id` months later.
**🔻🤖 Verify:** open the link **in a signed-out browser** on a mobile viewport and screenshot all eight
states · a second click after answering shows the thank-you, not a second write · a tampered token shows
the **same generic message** as an expired one.
**מה ייחשב עובד** *(`spec.md § מה ייחשב עובד` #3 + `screens-approved.md` משטח 5 §②, quoted)*
1. *"היא שולחת זימונים, והדיילות עונות דרך הקישור בלי להתחבר — והמסך מראה מה קרה עם כל אחד."*
2. *"אני יכולה להגיע למשמרת הזו — כן או לא, בלי להתקין שום דבר ובלי סיסמה."*
3. *"לעולם לא 'נשמר' כשלא נשמר."*
**🗣️ אושר —**

**Step 3.7 · 🔻👤 🎨 UX & functional review** — the five passes in `src/CLAUDE.md` (direction ·
inventory · consistency · wording · empty-input) + loading / true-empty / empty-after-filter / error
with retry on every surface + keyboard operability + a visible focus ring. Ishay rules on
"should anything be redesigned / added / removed". Findings become steps now or logged deferrals.

---

### Phase 4 — wiring

**Step 4.1** 🚫 **The three usual sites already exist — re-adding them duplicates.** The real work:
- Replace `<UnderConstruction moduleName="דיילות" />` (`src/App.jsx:129`) with the module's page.
- **Add the public route outside `<MainLayout>`** with no `ProtectedRoute` — and extend
  `src/App.routes.test.jsx`'s allow-list for it, deliberately and with a comment, exactly as
  `index`/`profile`/`*` are handled.
**🔻🤖 Verify:** `npm run test:run` green **including `App.routes.test.jsx`** · the public route loads
while signed out · every other module-4 screen still redirects when signed out.
**מה ייחשב עובד**: the public page opens in a signed-out browser and answers; every internal screen
does not.
**🗣️ אושר —**

**Step 4.2 · Demo seed + anchors + the fixture-rot ruling**
- Extend `scripts/demo-seed.mjs` with the five hostesses of `spec.md §3.1` and their assignments,
  through the real server functions.
  ⚠️ **`כנס לקוחות שנתי` is `in_progress` in the seed (`demo-seed.mjs:108,121`), so no project exists
  for it** — approve that quote in the seed so the module's own demo event exists as a project.
- Add a module-4 block to `e2e/smoke-anchors.json`: **the ORDER `נועה ← מיכל ← דנה`**, not the scores —
  the score is deliberately never displayed, and that file requires every anchor to be visible on screen.
- 🔴 **Rule the fixture pattern before adding fixtures** (`PROJECT_MASTER §6`, `🚧 מ4 ← מ3`): the
  `module3-quote-expiry` cron flips `in_progress` quotes older than the validity param, and it is
  predicted to break existing E2E specs **around 28/08 and 31/08/2026 — inside this module's window**.
  ⇒ module-4 fixtures **create their own rows and clean up**, or pin to values the cron cannot touch.
  Record the ruling here as an `↳ as-built` note.
**🗣️ אושר —**

---

### Phase 5 — QA & handoff

**5.1** — `e2e/hostesses.spec.js` + `e2e/smart-match.spec.js`; regression across every existing suite.
⚠️ **The Stop hook derives the module number from `src/modules/NN_*/` only** (`PROJECT_MASTER §6:457`),
so work living in `e2e/`, `scripts/`, `src/lib/` and `src/components/` — i.e. most of phases 2, 4 and 5 —
**does not trigger it.** Update this guide manually in those phases; do not rely on the hook.
**5.2 · 🔻👤 Closing audit** — run `module-close` in a **FRESH** session: independent re-verification →
DoD typed-echo → PR instructions. 🚫 The audit never merges.

---

## §7 📊 QA Matrix

| Type | Planned | As-run |
|---|---|---|
| Unit (`npm run test:run`) | `smartMatch.js` incl. the anchor + `§11.10` #2–#5 + the three §3.5 holes; `hostesses.js` ID/min-wage/derived states | |
| Integration | RPC + trigger + constraint, in rolled-back transactions | |
| E2E (`npm run test:e2e`) | pool CRUD · invitation round · public confirm · row menu · T-24 mode | |
| **Smoke (`npm run smoke`)** | one module-4 screen + the order anchor. ⚠️ **`test:e2e` excludes smoke silently; neither runs in CI** | |
| Regression | all existing suites, especially `quote-email.spec.js` after Phase 0 | |
| **UAT** | Ishay drives the two real journeys end-to-end in the live preview: build a pool entry from a phone call, and staff `כנס לקוחות שנתי` from zero to a full quota — including the public link on a phone | |
| Security / Pen (RLS) | impersonation matrix both directions + positive control + a deliberate policy drop | |
| Usability | filled from step 3.7 + the closing template's UX audit | |
| Performance | Smart Match on 50 hostesses × 10 events — query-side filtering | |
| Compatibility | 1024 / 1366 / mobile for the public page | |

## §8 ✅ Definition of Done

*(Canonical DoD from `docs/architecture_and_qa_roadmap.md`, instantiated for module 4.
The closing audit walks these one by one and ticks what it verified — so they must be checkboxes.)*

- [ ] All **5 migrations** applied via MCP after a typed-echo, `docs/schema.sql` refreshed, migration + snapshot committed **together**
- [ ] `get_advisors(security)` — **zero new findings** after every apply, or a written triage note
- [ ] RLS verified **in both directions**, with the positive control passing (`recruit.test@regin.co.il` ≥1 row)
- [ ] The deliberate policy-drop test ran: a screen with no policy shows an **error**, never an empty list
- [ ] `anon` cannot read or write `assignments` directly; the public RPC is the only path
- [ ] `npm run gate` green
- [ ] `npm run test:run` green — **named separately**
- [ ] `npm run test:e2e` green — **named separately**
- [ ] `npm run smoke` green — **named separately** *(⚠️ `test:e2e` excludes it silently; neither runs in CI)*
- [ ] The hand-computed anchor reproduces: the three scores **and** the order `נועה ← מיכל ← דנה`, two candidates absent
- [ ] The three §3.5 holes each fail a deliberately-wrong implementation *(hardcoded split · never-worked given the cap · mid-computation rounding)*
- [ ] **UX & validation:** step 3.7 passed — §4 design conformance · all screen states · RTL · keyboard basics — **and** every spec'd validation implemented, every spec-silent one confirmed with Ishay
- [ ] All 8 approved surfaces built and screenshot-verified, including the public page on a phone viewport
- [ ] Every `🚧` in §2 has its **byte-matching** `🚧 מN` line in `PROJECT_MASTER §6` — **including the two authored this module** (M9 params screen · M6 attendance fields)
- [ ] `db_roadmap.md` rows for module 4 marked Done in §10
- [ ] `PROJECT_MASTER §7` write-back done: **§7.67** marked deferred with its reasoning
- [ ] `src/modules/04_hostesses/CLAUDE.md` written — the module's own gotchas file
- [ ] 🆕 **Automations registry written** *(Ishay approved 09/08/2026, in answer to "should we open an
      automations folder?")*. **A folder was rejected on measurement, and the reason must survive:**
      three of the four automation kinds here **cannot** be moved — DB triggers and `pg_cron` jobs are
      append-only migration files, the Edge Function's folder name **is** its deploy address, and the
      Make scenario is not in the repo at all. A folder would have been empty and would have fought the
      platform. **What is actually missing is the LIST**, so the deliverable is one document answering:
      what runs by itself · where it physically lives · when it fires · which module owns it · what
      breaks if it stops. **Write it at module close**, when M4's own triggers and public RPC are fresh.
      📍 **Seed it with the concrete disorder already measured 09/08/2026:** the `pg_cron` job
      `module1-login-attempts-cleanup` is defined inside `20260723120500_module3_pg_cron_...` — a
      **module-1** automation living in a **module-3** filename, unfixable by rule (append-only) and
      therefore exactly what a registry exists to answer.
- [ ] `STATUS.md` points at this guide, and `CLAUDE_CODE_LOG.md` carries the session entry

*(Post-merge — **not** audit checkboxes, and a truthful audit must not be forced to mark them ❌:
PR opened · CI green · merged. The closing verdict says the module is **mergeable**, not merged.)*

## §9 🔄 Self-Update Protocol

(a) update the status header + step table **at every step transition, same session**;
(b) any deviation gets an inline `↳ as-built` note + a line in §10;
(c) the Stop hook blocks session end if `src/modules/04_hostesses/**` changed and this guide did not —
⚠️ **and it is blind to `e2e/`, `scripts/`, `src/lib/`, `src/components/`** (`§6:457`), so phases 2/4/5
are updated by discipline, not by the hook;
(d) end-of-session protocol per `CLAUDE.md`;
(h) **on ENTERING a phase** — sweep this ledger for OPEN items anchored to that phase and get a
consolidated ruling from Ishay **at the phase door** (measured 08/08/2026: Phase 1 has none);
(i) **compaction** — a closed phase collapses to a done-table + evidence; never compact the active
phase, §10, or the ledger.
**(e)/(f)/(g): per `CLAUDE.md` iron rules 13/15/16 + the end-of-session protocol.**

## §10 📝 Deviations & Tech-Debt Log

- **09/08/2026 · two RED suites found at step 0.1, BOTH pre-existing, neither caused by Phase 0.**
  Recorded because a future session will hit this class again, and because "the suite was already
  red" is exactly the claim that must carry its evidence.
  **(1) `e2e/quote-email.spec.js` — 4 tests.** `CLEAN_QUOTE_ID = 8` (a quote that must never have
  been sent) acquired a real `email_log` row on **07/08/2026 16:04** (`tal@hitechgroup-demo.co.il`,
  `sent`). Three tests then hung silently — the dialog raises `window.confirm('ההצעה כבר נשלחה…')`,
  Playwright auto-dismisses it, the handler `return`s, and **nothing at all appears on screen**.
  **Fixed structurally, not with a new number:** the clean quote is now resolved at runtime
  (`in_progress` · has an email · zero successful `email_log` rows), preferring a demo domain — the
  pattern `e2e/CLAUDE.md` prescribes and the `🚧 מ4 ← מ3` debt in `PROJECT_MASTER §6`.
  **(2) `npm run smoke` — 2 anchors, one root cause.** Quote #6 was **approved on 01/08/2026**,
  which (a) raised מדיטק's revenue by exactly `6,319 ₪` (`16,184 → 22,503`) and (b) moved the
  canonical amount out of the quotes screen's default `בתהליך` tab. Anchor updated per that file's
  own rule; the smoke now clicks `הכל` before asserting — the anchor value itself is untouched.
  🔑 **Why nobody noticed for 8 days: neither suite runs in CI, and `test:e2e` excludes smoke.**
- **09/08/2026** — `GHSA-2v37-7h3g-55p8` (`nanoid`) exempted in `scripts/audit-gate.mjs`; it appeared
  on its own and blocked the gate. Dev-only chain (`shadcn → postcss → nanoid`, measured single path),
  zero occurrences in `dist`. `npm audit fix` offers a fix for it (and for `js-yaml`/`undici`) —
  **deliberately deferred to module close**, not silently skipped.
- **09/08/2026 · `הנחתי` ⇒ ✅ `אומת-על-ידי` the same day — the assumption held, and the tag is kept
  so the promotion is visible rather than silently overwritten.** The claim was: the Make scenario
  attaches a file on **every** send (derived from `03_quotes/CLAUDE.md`, without opening the scenario).
  **Confirmed twice over:**
  *(a)* **By sight** — scenario `REG-IN — שליחת מייל` (`eu1`, id `6759079`), module 4 `Gmail · Send an
  email`: `Attachments → Attachment 1` with `File name: 2.filename` and
  `Data: toBinary( 2.pdf_base64 ; base64 )`, and **the `Map` toggle on `Attachments` is OFF** — i.e. the
  list is static, exactly one attachment, unconditionally.
  *(b)* **By running it** — one real attachment-less `shift` mail through the full production path
  returned **`502 · "Make responded 400"`**. ⇒ **the bypass is required; it is not optional polish.**
  ✅ **SETTLED the same session, by two measurements — and the answer makes the fix cheap.**
  *(i)* **Binary search on the payload:** `filename="bdika.pdf"` + a valid tiny base64 → **200, mail
  delivered**; the same call with `pdf_base64=""` → **400**. ⇒ the empty value that breaks it is
  **`pdf_base64`, and `filename` is innocent.**
  *(ii)* **The scenario History is the decider:** it lists **exactly one run today** (`09:16:00 ·
  Success · 639 B` = the passing probe). **Both 400s produced NO execution at all — not even a failed
  one.** ⇒ the rejection happens at the **webhook layer, before the scenario starts**, i.e. the custom
  webhook's **data structure marks `pdf_base64` as required** and an empty string fails validation.
  🎯 **Therefore: NO Router, NO second Gmail module, no duplication.** The fix is to make that field
  optional in the webhook's data structure.
  ⚠️ **But it is a TWO-PART fix, and part two is unproven:** once the webhook accepts the call, the
  Gmail module still evaluates `toBinary(""; "base64")` on an empty attachment. **Re-run the
  attachment-less probe immediately after the data-structure change** — if the scenario now starts and
  *then* fails, the conditional-attachment problem is real after all and only then is a Router on the
  table. **Do not declare 0.3 closed on the webhook fix alone.**
  📍 **How to re-measure:** `scratchpad/probe.mjs <to> <filename> <base64>` sends one mail through the
  full production path and prints the HTTP status; History tells you whether an execution was created.
- **09/08/2026 — and the failed send proved MORE than it broke.** `email_log` now carries
  `shift · 999999 · failed · "Make responded 400" · recruit.test@regin.co.il · תבנית_זימון_משמרת`.
  Everything on **our** side is therefore proven in production, not merely in a catalog query:
  the widened CHECK **accepted** `'shift'` · the service-role journal write worked · and
  **מנהלת הגיוס passed the permission gate**, which was impossible before this session. The failure is
  entirely inside Make. ⚠️ **`entity_id = 999999` is a deliberately synthetic id** — no project or
  assignment will ever collide with it; it is a test row in an append-only journal, left in place
  because this project does not delete history (§7.11).
- **09/08/2026** — `entity_type` map narrowed to **one** new value, `shift`. Ishay's 31/07 ruling
  (`PROJECT_MASTER:416`) named four (`shift`/`assignment` ⇒ 'דיילות', `invoice`/`salary_report` ⇒
  'כספים'); `spec.md:692` and this guide say "by one value". **Claude's call, anchored, Ishay may
  override:** synonyms in one column drift, and a map entry whose CHECK value does not exist yet
  produces a mail that sends while its journal row fails **silently**. M8/M11 add their value together
  with their own CHECK widening.
- **09/08/2026** — 🆕 `src/api/emailLog.js` created (outside the guide's file list). `getLastSuccessfulSend`
  and `getSentQuoteIds` were trapped in `src/modules/03_quotes/api.js`; module 4 needs them, and the only
  alternatives were a cross-module import or the duplication `src/CLAUDE.md:320` forbids. `src/lib/` is
  pure (measured: no file there imports `supabaseClient`), so a third home was needed for tables no
  module owns.
- **09/08/2026** — `jsr:@supabase/supabase-js@2` pinned to an exact version, executing the `🚧 מ10`
  request recorded in `.github/workflows/ci.yml` for "the next time the function is touched".
- **09/08/2026** — step 0.1's `מה ייחשב עובד` attribution corrected: `spec.md §12③` supplies one
  criterion, not three; the other two are `PROJECT_MASTER §6`.
- **08/08/2026** — `email`/`city`/`bank_*` stay `not null`; the form gains stars beyond mockups `06`/`07`.
  **Deviation from an approved mockup, by Ishay's dated ruling.**
- **08/08/2026** — `project_shifts` (§7.67) deferred; §7 write-back required this session.
- **08/08/2026** — exposure log deferred; stays registered in `db_roadmap`.
- **08/08/2026** — one-event-per-day narrowed to `finally_approved`; **§7.54's same-project bonus is
  lost and `db_roadmap` row A-15 stays open.**
- **08/08/2026** — `projects.customer_name` snapshot added (Claude's call, anchor §7.76).
- **08/08/2026** — `customer_hostess_preference` is CREATED by M4 and stays empty until M6 writes to it.
- **08/08/2026** — `db_roadmap:135`'s "twelve params" header is wrong (§11.1 marks 10) — fixed in step 1.3.
- ⏸️ `attendance_status`/`lateness_level`/`no_show_reason` → M6, with the screen that fills them.
- ⏸️ `projects.cancelled_at`/`cancellation_reason` → M8; `schema.sql:134` already has `cancel_reason`
  and `db_roadmap §9` defect #4 is exactly this collision.
- ⏸️ `projects` "סיווג קצר/ארוך" (`db_roadmap:118`, module 4) → deferred; §7.29 retired it for the gate
  and nothing surviving reads it.
- ⏸️ §7.30 (multi-day / cross-midnight) — the single-day model stands (ruled 12/07); the
  per-`event_date` unique index is consistent with it.
- **08/08/2026** — §7.65 was carried in revision 1 as OPEN; it is **closed** (ruled 31/07, no UNIQUE +
  soft warning). Cause: `PROJECT_MASTER_sec7.md:207` ends with a stale *"נשאר להנהון"* and `:208`
  closes it. **Read a §7 item whole before quoting it** — a fresh-context reviewer made the same slip.
