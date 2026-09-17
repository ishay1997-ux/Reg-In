# Close-audit working findings — Module 11 (Executive Reports)

> **Scratch file, audit rule 5 of `module-close/template.md`.** Raw observations are appended here
> **at the moment of finding** — no conclusions, no routing, no fixes mid-scan. Clustering (§5b) and
> routing (§6/§7) happen only after the scan is complete.
> **Interruption-safety:** this file IS the handoff. A fresh session resumes from it with no prompt.
>
> - Audit session: closing audit, fresh context (did not build the module).
> - Branch: `ishay/module-11-build`
> - Tree audited: HEAD `fc3cb2317118ea8519b6a951e24139e176b28280` (`fc3cb231`)
> - Started: 17/09/2026
> - Model: Opus 5 (1M) — the building session's self-catch rate is zero by measurement; this is the outside reader.

## 0. State of the audit (resume point — update as sections complete)

| Section | Status | Note |
|---|---|---|
| 1 DoD walkthrough | DONE | 7 gates: 5 OK, 1 N/A-at-audit, 1 partial (37/39 rulings) |
| 2 Security & RLS | DONE | 17/17 RPC gates live; 11/11 rls_enabled_no_policy triaged (F-01..F-03, F-12) |
| 2b UX & validation / spec diff | DONE | 7 surfaces re-rendered live, 0 console errors (F-09, F-17) |
| 2c General security scan | DONE | agent: 0 blockers, 4 debt; its premise corrected by me (F-14, F-12) |
| 3 Architecture | DONE | folded into F-05 / F-20 |
| 3b Silent-failure sweep | DONE | 9 findings; 2 promoted to blockers, 1 demoted (F-10, F-11, F-13, F-15) |
| 4 Housekeeping + DB health | DONE | gate exit 0; advisors triaged (F-02..F-04). E2E line = TAUN BDIKA |
| 4b Duplication / dead code | DONE | 0.80% of 3% cap; 2 clones touch m11 (F-05) |
| 4c Module gotchas file | ASSESSED, refresh OWED | cannot write src/** in this audit (F-18) |
| 4d Answerable-later | DONE | 2 gaps registered (F-19) |
| 5 QA matrix | DONE | F-21 |
| 5b Clustering | DONE | 20 findings => 14 root causes (F-20) |
| Module-specific 6-3 (1)-(4) | DONE | (1) 37/39 F-07 - (2) PASS F-09 - (3) PASS F-06 - (4) 2 of 4 hold F-17 |
| Verdict | [NO] - 2 blockers | B-1 ExportBar · B-2 AnalysisRunBar; head fc3cb231 |

## 1. Raw findings (append-only, newest at the bottom)

### F-01 · md5 sweep of all 17 functions — 16/17 byte-equal, 1 comment-only drift (measured, not inherited)
- Method: `<scratchpad>/fn_md5_all.py` — glob `supabase/migrations/*module11*.sql` (20 files), extract each
  `$function$` body, keep the LATEST file per function (sorted glob = chronological), md5 it; compare to
  `select proname, md5(prosrc), length(prosrc) from pg_proc` (MCP, 17/09).
- **16 report functions: md5 file == md5 live, exactly.** Latest file per function: J2 (13) · J1 (m16, m21) · I2 (m03).
- **`approve_feedback_ai_run` differs** — live `e03df921aea332bf199101659679f9de` (1,239 ch) vs file
  `20260916043300_module11_a_feedback_ai_tables.sql` `69221f3ed61af0cf2724059262c28360` (1,369 ch).
  **I diffed it myself this turn** (unified diff, file vs `prosrc`): the delta is exactly **two Hebrew `--`
  comment lines** dropped on apply. Stripping `--` lines from the file body reproduces the live md5
  **exactly** (`e03df921…`). ⇒ **logic byte-identical; documentation drift only.**
  Matches the pre-seeded finding and Ishay's ruling 16/09 23:4X (record, do not fix now).
- All 17: `prosecdef=true`, `proconfig={search_path=""}`, owner `postgres`, `proacl` has **no PUBLIC and no anon**
  (`postgres=X | service_role=X | authenticated=X`). ⇒ C5's revoke/grant contract holds live on all 17.

### F-02 · Whole-DB `rls_enabled_no_policy` triage — 11 tables, each triaged in writing
Source: `get_advisors(security)` 17/09 + a `pg_class`/`pg_policy`/`relacl` join run this turn.

| Table | Rows | Grants to anon/authenticated | Who reads it | Triage |
|---|--:|---|---|---|
| `bak_assignments_20260909` | 5,674 | **revoked** (postgres+service_role only) | nobody — `grep -rn "bak_" src/ e2e/ supabase/functions/ scripts/` = **0** hits; no pg_proc body references them | ✅ deliberate deny-all, hardened by H0 (D-11). Airtight: RLS **and** no grant. |
| `bak_assignments_20260910` | 5,681 | revoked | same | ✅ same |
| `bak_hostesses_20260909` | 186 | revoked | same | ✅ same (holds PII — the hardening is what matters) |
| `bak_project_finance_20260910` | 745 | revoked | same | ✅ same |
| `bak_projects_20260909` | 827 | revoked | same | ✅ same |
| `bak_projects_20260910` | 837 | revoked | same | ✅ same |
| `login_attempts` | 0 | **granted (all privs)** | `check_login_lock`, `register_failed_login`, `reset_login_attempts` — all `security definer`, `search_path=""` | ✅ documented DEFINER-only deny-all (pre-existing, m1) |
| `login_rpc_calls` | 1 | revoked | `register_failed_login` (DEFINER) | ✅ DEFINER-only, airtight |
| `feedback_rpc_calls` | 2 | granted (all privs) | `feedback_rate_limit` (DEFINER) | ✅ DEFINER-only rate-limit ledger (m8) |
| 🔴 `project_changes` | 30 | granted (all privs) | **measured this turn** — `apply_scope_change` (write) · `list_project_changes` (read) · `list_projects_overview` · `finance_project_money` · **`report_m12_equipment` (m11's own)** — all five `security definer` + `search_path=""`. Client code: **zero** `.from('project_changes')`; `src/modules/06_projects/CLAUDE.md:23,43` and `src/modules/02_customers/api.js:106–113` document the deny-all as the deliberate design and name the trap. | ✅ **DEFINER-only by design — first written triage.** m11 reads it only through its own DEFINER RPC. |
| 🔴 `seed_registry` | 2,270 | granted (all privs) | **measured this turn** — `seed_register` · `seed_reset` · `seed_backdate_project` · `seed_backdate_quote` · `enforce_quote_in_progress_lock`, all `security definer` + `search_path=""`. Client code: **zero** references in `src/`, `e2e/`, `supabase/functions/`. | ✅ **DEFINER-only seeding infrastructure — first written triage.** |

**One residual, registered as debt not a blocker:** four of the eleven (`login_attempts` · `feedback_rpc_calls` ·
`project_changes` · `seed_registry`) still carry **full table grants to `anon` and `authenticated`**. RLS-with-zero-
policies denies them today, so there is **no live exploit path** (the grant alone cannot read a row). But it is one
`alter table … disable row level security` away from being world-readable — **which is exactly the `bak_*` story that
D-11 found and H0 fixed.** The airtight pattern already exists in this DB (`login_rpc_calls`, the six `bak_*`): revoke
the grants as well. ⇒ §7 tech-debt, hardening, no module-11 exposure.

### F-03 · Advisors — what module 11 added, and what it did not
- `anon_security_definer_function_executable` **WARN ×6** — `check_login_lock` · `get_feedback_page` ·
  `get_shift_invite` · `register_failed_login` · `respond_to_shift_invite` · `submit_feedback`. **All six are
  pre-existing (m1/m4/m8 public-token surfaces). Module 11 added ZERO anon-executable functions** — its 17 are in the
  `authenticated_` list only. This is the §2 "public/no-auth surface" answer: **m11 adds no public surface.**
- `authenticated_security_definer_function_executable` **WARN ×54** — includes all 17 m11 functions **by design**:
  the whole architecture is DEFINER RPCs whose first statement is `assert_module_permission(...)`. Not a finding.
- `auth_leaked_password_protection` **WARN ×1** — pre-existing Supabase Auth config (HaveIBeenPwned check off).
  Not introduced by m11; belongs to m1's surface. Registered as a note, not this module's blocker.
- `rls_enabled_no_policy` INFO ×11 — F-02 above.
- **Zero ERROR-level security advisors.**

### F-04 · `npm run gate` on the FINAL tree (my own run, not the orchestrator's)
`npm run gate > <log> 2>&1; echo exit=$?` ⇒ **exit=0**, 17/09/2026 03:19, on HEAD `fc3cb231`.
- **117 test files · 3,035 tests passed · 0 failed**, duration 142.72 s.
- `build`: vite v8.2.1, 2,840 modules transformed, built in 1.91 s.
- `jscpd`: **0.80 % duplicated lines** (424/53,094) / 1.01 % tokens — cap is 3 %. 32 clones repo-wide.
- `knip`: 2 config-hygiene notes only (`recharts` in `ignoreDependencies`; `.css` excluded) — **no unused m11 file/export**.
- `audit`: 0 findings, 0 waivers. `check:bidi` OK · `check:context` OK (9 plugins, 20 skill files, tree intact)
  · `check:docs-structure` OK 165 files · `check:iron-rules` OK 17/17 resolve · `check:declared-counts` OK 6/6.
- One thing `check:context` prints that is worth carrying forward: *"§6 — 2 חובות פתוחים למודול 9"*
  (`העדפות התראות` · `e2e/prices.spec.js`). The second is one of the five pre-existing E2E debts D-37(ג) registered.
  Not m11's, and the checker itself asks the closing step to confirm they were not silently closed — they were not.

### F-05 · §4b duplication — only TWO of the 32 clones touch module 11
1. **`finiteNumber` — three copies, and one has already drifted textually.**
   `src/lib/reportsCustomers.js:29` · `src/lib/reportsExecutive.js:30` · `src/lib/reportsHostesses.js:22`.
   Customers and hostesses are **md5-identical** (`0e80f762...`); **executive is a third variant**
   (`const trimmed = typeof value === 'string' ? value.trim() : value` instead of testing `value` and
   converting the untrimmed value). I walked the input classes — `null`/`undefined`, `''`, `'  '`,
   `' 5 '`, a non-string — and **behaviour is equivalent today** (`Number()` trims its own input), so this
   is not an active bug. But it is the exact early stage of the "two copies that must agree and already
   drifted" class: they encode ONE invariant (*"a non-finite value is absence, never zero"* — the why-comment
   says so in all three) and would have to change together. => **§7 tech-debt: one home under `src/lib/reports*`.**
   NOT §6: no behavioural drift, and jscpd is 2.2 points under its cap.
2. **`resolveNext` + the URL-patch loop** — `ReportsPage.jsx:268` vs `ProjectsPage.jsx:146` vs `CustomersPage.jsx:332`.
   **Record why it stays separate:** `ReportsPage.jsx:265-267` carries a why-comment naming the measured silent
   trap it guards (a URL setter handed a function writes the function body into the address, silently — bit
   `CustomersPage` on 30/07), and says it is repeated deliberately. The copies are **not** identical — reports
   also deletes on `value === ''` — and that difference is correct for reports' filter semantics. Extracting a
   2-line guard would couple three modules' URL-state handling for no invariant they share. **Intentional; recorded
   so no future audit re-raises it.**
Every other clone is between pre-existing modules (m1-m9) — not this module's to route.

### F-06 · check (3) of the step guide's 6-3 block — onboarding layer, swept MECHANICALLY in BOTH directions — PASS
Method (re-run this turn; the first attempt grepped only single-quoted literals and produced a false
"10 dead keys" — the wrong-vocabulary trap; the corrected command covers single, double and backtick quotes):
- USED: every `reports.*` string literal in `src/modules/11_reports/**` excluding `*.test.*`
- DEFINED: the `'reports.x.y':` keys of the four `src/lib/onboardingCopy.m11.*.js` files.
**Result: 80 used · 80 defined · `comm` in BOTH directions returns EMPTY.**
Zero `<Hint id>` resolving to `null`; zero authored-but-dead key. Per file: exec 15 · finance 15 · hostesses 38 · customers 12.
All four are spread into `src/lib/onboardingCopy.js:32-35`.
And the direction is **locked by tests**, not only by this sweep: `CustomersTab.test.jsx:1021`
(`[...used].sort()` equals `Object.keys(M11_CUSTOMERS_COPY).sort()`), `ExecutiveTab.test.jsx:993`,
`HostessesTab.test.jsx:1056-1059` (and a hard `toHaveLength(38)`).

### F-07 · check (1) of the 6-3 block — the 39 rulings, denominator taken from the REGISTER, not the guide
**Denominator measured this turn, not inherited:** `processes-approved.md` L899-944 holds **exactly 39
numbered rulings, 1..39, no gap and no duplicate** (verified by script), plus **3** `לא-קורה` reality
rows at L949-951. The guide's `39 + 3` is correct.
*(My own first pass measured 26 — because rulings 27-39 carry `✏️ <date>` INSIDE the first cell
(`| **27** ✏️ 23:0X |`) and my regex demanded `**N**` followed immediately by `|`. It was caught only
because 26 did not sum to the 39 every other document cites. Recorded as the method note it is:
**I measured my reconstruction of the row shape instead of the row shape.**)*

**Result of the mapping check — a real finding, and it is the same class D-7 warns about:**
`module-11.md §3.3` — the section whose stated purpose is *"an enumeration is only a control if its parts
sum to the whole"* and which asserts *"It has now been walked, all 39"* — sorts rulings into three buckets:
- (א) not a build item: `3 · 8 · 9 · 10 · 11 · 12 · 13 · 16 · 17 · 20 · 21 · 26 · 27 · 29 · 31 · 32` = 16
- (ב) has an owning step: `1 · 2 · 5 · 14 · 23 · 28 · 30 · 34 · 35 · 36` = 10
- (ג) surface content, table of ten: `4 · 6 · 15 · 19 · 22 · 24 · 33 · 37 · 38 · 39` = 10
- plus ruling **25** named as the explicit exception to (א).
**16 + 10 + 10 + 1 = 37. Rulings 7 and 18 are in NO bucket.**

**Both are nonetheless honoured — I checked the product, not the guide:**
- **Ruling 18** (report names: short name in nav, question as subtitle, **no report numbers on screen**):
  built and enforced. `src/modules/11_reports/reportsCatalog.js:7-9` cites §🏷️ and ruling 18 by name; every
  one of the 16 surfaces carries `name` + `question`; and an uncapped grep for a rendered report number
  (`דוח [0-9]` / `דו"ח [0-9]`) across `src/modules/11_reports/**` excluding tests returns **zero**.
- **Ruling 7** (the four conference stories) is a seeding/story item — bucket (א) by its own definition —
  and it IS carried: the QA matrix's 🎤 row and the 6-3 check (4) both own it. It was simply never listed.
=> **§7 doc reconciliation on `module-11.md §3.3` (add 7 and 18 to their buckets and restate the sum as
39 = 17 + 10 + 10 + 1 + 1). NOT a §6 blocker: no ruling is unbuilt, only unlisted.**

### F-08 · Spot-checks of the (ג) bucket against the built code — clean
- **Ruling 14 / D-14 (drill set = מ3 · מ9 only):** `reportsCatalog.js` — exactly two surfaces carry
  `drill: true` (מ3 `trends` L59, מ9 `aging` L106). **מ17 `fairness` is `drill: false` (L163)** with a dated
  why-comment (L161-162) naming D-14 and explaining that 📐13's "ריכוזיות" is מ5, not מ17.
  *(My first count said three `drill: true` — the third is the string inside the JSDoc at L32. Re-read, not assumed.)*
- **Ruling 2 (a tab opens on the owning module's permission):** `reportsCatalog.js:21-26`
  `TAB_PERMISSION_MODULE = { exec:'כספים', finance:'כספים', hostesses:'דיילות', customers:'לקוחות' }` —
  matches C5 and the live RPC gates (F-01/F-09) exactly.
- **Ruling 30 (scope = 16 built, the rest deferred):** the catalog contains **16** surfaces and the eight
  deferred ones (מ5 · מ10 · מ11 · מ13 · מ18 · מ26 · מ23 · מ24) are **absent entirely**, not disabled —
  with the reasoning written at L15-18 (*"a deferral is not an on-screen intermediate state"*).

### F-09 · check (2) of the 6-3 block — the acceptance numbers, VERIFIED ON THE SCREEN — PASS
**Definition read to its end BEFORE measuring** (`spec.md §🔢 3.1-3.2` + `deriveDaysOverdue`,
`src/lib/projectFinance.js:153-159`): days-overdue = today − (`invoice_sent_at` + `תנאי_תשלום_ימים`),
clamped to 0, `null` when uncomputable; **five** buckets (שוטף · 1-30 · 31-60 · 61-90 · 90+).
The RPC implements the same: `greatest(v_asof - (o.sent_d + v_terms), 0)` and
`dov=0⇒current · <=30 · <=60 · <=90 · else d90p` (J2 file, the aging body).

**Three independent channels, 17/09/2026:**

| | invoices | total ₪ | שוטף | 1-30 | 31-60 | 61-90 | 90+ |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `spec.md §🔢` hand anchor (10/09) | 35 | 236,382 | 10 / 68,585 | 13 / 87,574 | 8 / 56,839 | 1 / 5,438 | 3 / 17,946 |
| my own live SQL, written from the definition (17/09) | 35 | **236,382** | 7 / 42,231 | 13 / 89,828 | 7 / 53,661 | 5 / 32,716 | 3 / 17,946 |
| **the SCREEN** (CEO, mode 0, frozen preview :5189) | **35** | **236,382 ₪** | 7 / 42,231 ₪ | 13 / 89,828 ₪ | 7 / 53,661 ₪ | 5 / 32,716 ₪ | 3 / 17,946 ₪ |

- **Screen == my independent query, digit for digit, on all five buckets and both totals.**
- **The invariant the anchor actually pins holds exactly: 35 invoices · 236,382 ₪.** The distribution moved
  (10/09 ⇒ 17/09, seven days) because invoices age; the **total is identical to the shekel**, which is what
  proves the population is the same 35 and only their ages moved. Bucket counts sum to 35; bucket money sums
  to 236,382.
- `מעל 60 יום` tile: **50,662 ₪ · 8 invoices · 5 customers** — my query's OVER_60 = 8 / 50,662. OK
- Pager reads **"1-35 מתוך 35"** — no row cap, no cap-note lie.
- **The §3.2 boundary that "broke five times in one day" is right on screen:** project `1555` due 16/09
  ⇒ `1 יום` ⇒ bucket `1-30`; project `1560` due 19/09 ⇒ `0 ימים` ⇒ `שוטף`. The −1⇒0⇒שוטף clamp holds.
- The definitions line states the rule on screen: *"מדרג-גיול נמדד מול מועד-הפירעון (יום השליחה + 30 ימי
  תנאי-תשלום), **לא מול יום השליחה**"*. **Zero console errors** on the surface.
- **Gini oracle (`spec §🔢 3.3`):** `src/lib/reportsHostesses.test.js:56-72` — `HAND_CASE = [1,2,3,4,10]`
  expects `0.40` to 10 dp, **plus an explicit negative test that it is NOT 0.50** (the sample variant), plus
  the second-formula cross-check. Not re-authored; copied from the spec.

### F-10 · BLOCKER — the Excel export swallows its ONLY real failure
`src/modules/11_reports/components/ExportBar.jsx:29-36`. **Measured by reading both sides this turn:**
- `src/lib/reportsExport.js:191-195` — `exportReportRows` is **not** `async` and ends `return writeXlsxFile(...)`,
  i.e. it returns a **Promise**.
- `handleExport` is **not** `async` and calls it **without `await`** inside its `try`. A rejection therefore
  escapes the try/catch entirely: no `setError`, no console line, **nothing on screen**. The user presses
  the export button, no file arrives, and the product says nothing.
- The catch block is **dead code for every failure that can actually happen**: the only two throws it can see
  are the synchronous `EXPORT_NO_TABLE` / `EXPORT_NO_ROWS` (`reportsExport.js:192-193`), and both are already
  prevented upstream — `exportCaption` returns `disabled:true` for them (`:98`, `:101`) and the button is
  `disabled={caption.disabled}`.
- `ExportBar.test.jsx` has no failure-path test.
- **Same file, same fix round — `ExportBar.jsx:33`:** the guard
  `[caption.file, err?.message].includes(err?.message)` is a tautology (the array contains the very value it
  tests), so `known` is always true, the generic fallback is unreachable, and an error with no `message`
  calls `setError(undefined)` so the error span renders nothing at all.
This is the module's own declared core risk (§4.3: *"the screen lies; it does not fail"*) on a live,
user-facing path present on **all 16 surfaces**. Routed §6.

### F-11 · BLOCKER — a RUNNING analysis run is reported as a FAILED one
`src/modules/11_reports/tabs/customers/AnalysisRunBar.jsx`. **Both halves measured this turn:**
- `supabase/functions/classify-feedback/index.ts:825-828` — the "already running" answer is HTTP **409** with
  a body carrying **both** an `error` string and `status: 'running'`.
- `classify()` (`AnalysisRunBar.jsx:225-230`) tests **`if (result?.status) setLocal(result)` first**, and only
  `else` reads `result.error`. A 409 therefore takes the `status` branch and the error text is discarded.
- `barState` (`:185-187`) gives `local` precedence over everything, and `localState` (`:89-118`) has branches
  for `partial` · `done` · `noop` only — **`running` falls through to the final branch**, which prints
  *"הריצה נכשלה ולא נשמרו בה סיווגים."* with an **active** run button that will 409 again.
  The comment at `:111` shows the assumption: it treats the fall-through as `failed` only.
- The correct handling already exists in the same file — `serverRunState` renders `running` properly — but it
  is reached only from `meta.run_in_progress`, a payload snapshot taken at load, which cannot see a run that
  started afterwards. The file header (`:19-25`) names this very scenario as the blind spot it closed.
- **Reachability, measured honestly:** H1's unique partial index guarantees at most one `running` run, so the
  409 needs a second actor or a page loaded before the run began. Low frequency — but the consequence is the
  product making a **false factual claim about the user's data** (nothing was saved) while rows are being
  written, on מ22, a conference surface. No test covers it. Routed §6.

### F-12 · MAJOR / conflict question — money reaches a browser whose user is blocked on finance
**The premise the §2c scanner graded this on was wrong, and I measured the correction:**
it assumed no documented role holds לקוחות without כספים. **Live `permissions` today:**

| role | לקוחות | כספים | active users |
|---|---|---|:-:|
| מנכ"ל | edit | edit | 3 |
| מנהלת כספים ולקוחות | edit | edit | 1 |
| **מנהלת פרויקטים** | **edit** | **blocked** | **1** |
| מנהלת גיוס ושיבוץ | blocked | blocked | 1 |
| מנהלת לוגיסטיקה | blocked | blocked | 1 |

⇒ **the role exists and has an active user today.**
**And the mechanism:** `report_m19_customers_overview` / `report_m21_drifting` gate **only** on
`assert_module_permission` for לקוחות; there is no כספים test anywhere in either body (uncapped scan of the
J2/J1 bodies). Revenue is in the payload; the masking is entirely client-side
(`tabs/CustomersTab.jsx:28` `canSeeMoney`, `tabs/customers/payload.jsx:105-124` `maskMoney`).
**But this is a RECORDED PRODUCT DECISION, so it is a conflict question and NOT a fix instruction.**
`payload.jsx:40-42` cites the approved card verbatim — *"…כספים; המיסוך מתבצע בלשונית"* (cards-customers ⑤ מ21,
lines 408-409) — and the RPC states it on screen in `meta.notes`. **The two sources, side by side:**
- the card + D-34 ⑨ rule *what the identity sees* — and on screen the masking works;
- the micro-guide's own C5 names `module7_dashboard_summary_rpc.sql` as *"Precedent to copy"*, and that
  function keeps the number **inside the DB** (`if v_can_finance then`), which is the opposite placement.
**What Ishay was probably never asked:** that "masked in the tab" means the number still crosses the wire to
a signed-in user the org marked `blocked`, readable in devtools or by calling the RPC directly.
⇒ **§7 + a question in the morning table. NOT a §6 blocker and NOT fixed here** — overruling a recorded
product decision is exactly what a reviewer may not do on its own authority.
**And a matrix hole this exposes:** `module-11.md §2.7` names four test identities (מנכ"ל · מנהלת כספים
ולקוחות · מנהלת גיוס · מנהלת לוגיסטיקה). **מנהלת פרויקטים is not one of them** — and she is the ONLY role
that exercises `canSeeMoney === false` on real data. The branch is unit-tested; it has never been seen on a
screen by any identity.

### F-13 · §7 debt — a missing system parameter can still surface as emptiness
`src/modules/11_reports/components/ReportSurface.jsx` — the empty-page early return at **:606** fires
**before** `<MissingParamsBanner names={payload.meta?.missing_params} />` at **:640**. A payload with
zero rows **and** a non-empty `missing_params` shows *"אין נתונים"* and never the §7.83 sentence
*"חסר פרמטר מערכת: X"* — the exact silent default that ruling §7.83 and step 1.4 exist to forbid.
**Reachability measured, not assumed: NOT reachable today.** All five params exist live
(1.5 · 15 · 0.87 · 0.95 · 30), and `src/modules/09_settings/ParamsTab.jsx` has **no delete and no insert
path** — it edits values only. `missing_params` can only become non-empty through a DB-level delete or
rename. ⇒ latent, one-line reorder. **§7, not §6.**

### F-14 · §2c general security scan (agent, verified against my own live measurements)
`build-2026-09-16/results/p5-close-sec2c.json`. **0 blockers · 0 conflicts · 4 debt.**
- **RPC gate table 17/17** — every function has `assert_module_permission` as its first executable statement
  with the correct owning module (כספים ×8 · דיילות ×4 · לקוחות ×4 · דו"חות-edit ×1), `security definer`,
  `set search_path to ''`, and an exact-signature revoke-then-grant. **I independently confirmed the live
  half the agent could not reach** (its own declared blind spot): `pg_proc` shows all 17 with
  `prosecdef=true`, `proconfig={search_path=""}`, and `proacl` containing **no PUBLIC and no anon** (F-01).
- The real trap it caught and cleared: `m07`/`m09` gained a 5th argument (`p_asof date`) in the e2 round —
  a new signature is created at Postgres's default `EXECUTE TO PUBLIC`. The 4-arg originals are explicitly
  dropped and the 5-arg ones re-revoked/re-granted. **I confirmed live: my `pg_proc` query returns exactly
  17 rows, one per name — no stale overload survived.**
- Clean, each with an uncapped grep: injection · XSS (zero hits for `dangerouslySetInnerHTML`/`innerHTML`/
  `eval`/`new Function`) · secrets (all hits are `Deno.env.get` or doc placeholders) · dependency risk
  (`npm run audit` exit 0; `package.json` byte-unchanged vs `origin/dev`, so **no package was added**).
- Debt: SEC2C-01 (= F-12, and its premise is corrected there) · SEC2C-02 (= the tautology, folded into F-10) ·
  SEC2C-03 `api.js:173` passes raw `error.message` through — safe for the designed Hebrew raises, leaky for
  undesigned Postgres errors · SEC2C-04 Excel formula injection **measured not exploitable** (only
  `type:'Formula'` emits a formula cell; `String` emits `t="s"`) but incidental and untested.
- Worth stating positively: migration **H0 is itself a security fix this module ships** — six `bak_*` tables
  holding ID numbers, phones and addresses were reachable through the public anon key; it revokes and
  RLS-locks them (D-11, and F-02 confirms the live state).

### F-15 · §3b silent-failure sweep — `סריקת-כשלים-שקטים: 9 ממצאים`
`build-2026-09-16/results/p5-close-silent3b.json`. Two of its three candidate blockers I confirmed and
promoted (F-10, F-11); the third I measured as **latent, not live**, and demoted to §7 (F-13).
Remaining debt, each checked: `reportsParams.js:54` `missingReportParamsMessage` has **zero production
importers** (only its own test) while `ReportSurface.jsx:92` prints the bare param name — a documented
mechanism that is not the one running · `AnalysisRunBar.jsx:77-82` a bare `catch` drops the supabase error
with no log (the only m11 network path with no trace) · `AnalysisRunBar.jsx:235,250` `??` does not catch `''`
· `ReportsPage.jsx:419` a catalog-miss door is a dead click (**reported as a conflict, both sources quoted**)
· `HostessesPage.jsx` `?hostess=` ⇒ `Number('')` ⇒ id 0.
**And what it recorded as correct, which matters as much:** `toScreenError` maps `42501` to a dedicated
permission envelope on all 16 surfaces and `callReport` has exactly one call site · `assertReportShape`
throws instead of repairing · `approveFeedbackAiRun` checks `data.ok !== true` · the edge function checks
row count on every write and closes the run row before re-throwing · m4's `insertInviteRow`/`writeInviteToken`
check rows · **D-16 confirmed by design** (`listCustomers` ⇒ `[]` for RECRUIT/STAFF), with the honest note
that the honesty is the *absence of options* — no sentence tells the user the filter is unavailable in her role.
**One correction it made to its own brief, measured:** a totally failed run returns **HTTP 502** with
`status:'failed'` (`index.ts:656-660`), not 200; only the non-fatal nothing-saved exit returns 200. Both
halves of the C8 contract still hold because `invokeClassify` reads `error.context.json()` on non-2xx and the
UI branches on `body.status`.
**Its open blind spot, which I closed:** whether a tab's `transformPayload` drops `meta.missing_params`
before the banner — see F-16.

### F-16 · closing the §3b agent's declared blind spot — `meta` reconstruction in the four tabs
Checked every place a tab rebuilds `meta` (`tabs/customers/payload.jsx`, `tabs/finance/financePayload.jsx`,
`tabs/hostesses/payloadTransforms.jsx`, `tabs/executive/chartShape.js`): every one spreads the original
(`meta: { ...payload.meta, … }`) rather than constructing a fresh object, so `missing_params` survives
`transformPayload` on all four tabs. **No finding.** (F-13's ordering bug is upstream of this and unaffected.)

### F-17 · check (4) of the 6-3 block — the four conference stories against the five rules
Rules read to their end first (`seed-plan.md:178-190`): ① the number must be on screen character-for-character
· ② the sentence's population must be the population the page declares · ③ the label must mean what the
sentence says · ④ what the sentence claims happened must already have happened · ⑤ the page must be a page
that gets built. Every check below is against a **live render of the final tree** (frozen preview :5189,
CEO, 17/09/2026) plus the screenshot that proves it.

| Story | Page (built?) | Verdict | What I measured on the screen |
|---|---|:-:|---|
| **① ריכוזיות-משמרות (ג'יני · לורנץ)** | מ17 `fairness` **and** the מ14 overview tile — both built | 🛑 **FAILS ① and ②** | see below |
| **② החשבונית שנשכחה** | מ9 `aging` — built | ⚠️ **one stale number** | see below |
| **③ "מתרחק" תופס מה ש-120 יום מפספס** | מ21 `drifting` — built | ✅ **HOLDS** | see below |
| **④ המודל מוצא "ניהול לקוי" מתחת ל"אחר"** | מ22 `notes` — built | ✅ **HOLDS** | see below |

**① — the flagship story does not hold, and it is rules ① and ② together.**
The sentence says *"מדד-ג'יני … עומד על **0.49**"*. **The screen says `0.46`** — on מ17 *("ריכוזיות המשמרות
0.46")* and again on the מ14 overview tile *("ריכוזיות המשמרות 0.46")*. And the populations differ:
the story's own SQL (`seed-plan.md:96-105`) filters `assignment_status='finally_approved'` with
`event_date >= current_date - interval '12 months'` — a **closed** window — and reports **117 hostesses /
2,132 shifts / 0.4925**; the page declares **`n=106` דיילות · `1,877` משמרות** over the **half-open**
`(17/09/2025, 17/09/2026]` window that **D-17 ruled** and `spec.md §🔢 3.3` pins.
🔑 **Cause, and it is a rule the module already wrote for itself:** rule ⑤ says *"any scope ruling triggers a
pass over the four stories"*. **D-17 was a convention ruling, not a scope ruling — so no pass was triggered**,
and the story kept the number from its 06/09 query. This is the second time a story has gone stale under a
later decision with nobody re-reading it (story ② was the first, under ruling 30).
📎 `Reg-In-evidence/m11-2026-09-16/evidence-final/CEO-m0-fairness.png` · `CEO-m0-hostess-overview.png`
⇒ **§7 + a question for Ishay. NOT a code defect** — the screen is right and the spec's own anchor
(`0.4556`/`0.4559` ⇒ `0.46` under 📐4) agrees with it. **The sentence is what needs changing, not the page.**

**② — every number holds except the one that moves every day.**
On screen, verbatim: **`236,382 ₪`** open debt in **`35`** invoices ✅ · median **`35 ימים`** on `675` paid
invoices ✅ · oldest = **מועצה מקומית שוהם, נשלחה `14/01/2025`** ✅ · and the follow-up sentence about
measuring from the **due date** is printed in the definitions line ✅.
🔴 **But the story pins `574 יום` and the screen says `581 ימים`** — exactly seven days, the drift from the
10/09 measurement to today. **On the conference date (15/10/2026) it will read ~609.**
⇒ **This is not a defect to fix by writing 581; a days-counter in a spoken sentence is stale the next
morning.** The recommendation is to say it as a magnitude — *"פתוחה מעל שנה וחצי"* — and read the exact
figure off the screen on the day. **§7 + a question for Ishay.**
📎 `evidence-final/CEO-m0-aging.png` — I opened it: the tile row, the four-bucket stacked chart and the
`581 ימים` row for שוהם are all legible, the chart is fully rendered (not an animation frame 0), and the
pager reads `1–35 מתוך 35`.

**③ — HOLDS, and the screen hands Ishay a better version than the script.**
The sentence carries no hard number, so ① cannot break. The page declares its population openly
(*"52 לקוחות שקיימו 3 אירועים לפחות, מתוך 62"*) ②✅, the tile *"נתפסים רק בקצב האישי"* says exactly what the
sentence claims ③✅, nothing is claimed as having happened ④✅, and מ21 is built ⑤✅.
Live proof of the claim itself on screen: *"⁦12⁩ מתרחקים מול ⁦11⁩ רדומים, ו-⁦3⁩ לקוחות נראים רק בשיטה
האישית"*, plus two named customers in the action line. *(The tile's `3` is the value D-37(א2) corrected from
`11`; it now agrees with its own sub-line *"כלל 120 הימים לבדו מוצא 11 לקוחות, ואת אלה הוא מפספס: 3"*.)*
📎 `evidence-final/CEO-m0-drifting.png`

**④ — HOLDS, and rule ④ — the one that broke it before — is now satisfied on screen.**
The story's `N` is filled from the page: the "אז מה" line reads verbatim *"לשקול קטגוריה חדשה בטופס-המשוב —
המודל מצא **"ניהול לקוי" ב-⁦24⁩ הערות שהלקוח תייג "אחר"**."* ①✅
Population declared: *"⁦426⁩ הערות מתוך ⁦552⁩ משובים שהושלמו"*, and the agreement matrix is coherent with it
(אחר: תויג `33` · המודל הסכים `5`) ②✅. Labels match ③✅.
**④ — the rule that failed at the 11/09 check (*"המודל קרא"* while the page declared four times that no run
existed) — now passes visibly:** *"מציג ⁦2⁩ ריצות-ניתוח מאושרות, האחרונה מ-⁦16/09/2026⁩ · אושרה ע"י ישי אטיאס"*.
מ22 is built ⑤✅.
📎 `evidence-final/CEO-m0-notes.png`

**Summary of check (4): 2 of 4 hold as written; 2 need a sentence change, neither needs a code change.**
Both failures are the same shape — **a number frozen into a spoken sentence while the page keeps measuring** —
and both are Ishay's to reword.

### F-18 · §4c module gotchas file — present and good, but it carries one wrong fact
`src/modules/11_reports/CLAUDE.md` exists (35 lines, written 16/09) and is genuinely trap-shaped, not a tour:
six invariants + five silent traps, each with a mechanism and a `file`/rule anchor. It correctly records the
RLS-empty-returns-zero trap, the masked-not-hidden tab rule, the `dir="ltr"` chart wrapper, the
`rightToLeft: true` export flag, the `requestKey` re-fetch loop, and D-16's `listCustomers()` degradation.
🔴 **One row is factually wrong, and I measured it:** *"ריצת-סיווג שנכשלה לחלוטין מחזירה **HTTP 200**"*.
`supabase/functions/classify-feedback/index.ts:655-660` returns **`http: 502`** with
`body: { status: 'failed', … }`. Only the non-fatal nothing-saved exit returns 200.
**The advice the row gives is still right** (*"branch on `body.status`, never on `res.ok`"*) — and at 502 it is
even more necessary, because `res.ok` is false there. So: **a correct rule resting on a wrong fact**, in a
file that auto-loads for every future session that touches this directory.
⚠️ **I am not permitted to write under `src/**` in this audit** (orchestrator's scope), so the §4c refresh is
**owed, not done** — it is listed in §7 with the three items it should gain (this correction, F-05's
`finiteNumber` invariant, F-12's client-side money masking).

### F-19 · §4d 🔮 answerable-later — **2 gaps registered**
The three probes run against **what shipped**, measured live, not against the plan.

**‏(א) What does a repeated action overwrite instead of accumulate? — ONE REAL GAP.**
Measured live: `feedback_ai_insights` carries `UNIQUE (project_id)`
(`feedback_ai_insights_project_id_key`, confirmed in `pg_constraint` this turn). ⇒ **a re-classification of a
project REPLACES its row**, taking `run_id`, `classified_at` and the model's verdict with it.
Today it is invisible because runs 5 and 6 classified **disjoint** projects (`5:40 · 6:386 = 426`, and
`loadCandidates` skips already-classified projects). But D-23 ③ records that a uniform re-classification
**requires deleting those 40 first** — and at that moment **run 5's verdicts cease to exist with no trace**.
🔑 **Why it matters here specifically: report 20's entire point is the human↔model agreement matrix.** After a
re-run, *"did the model get better?"* and *"what did the previous model say about this project?"* become
uncomputable, because the only copy was overwritten. `feedback_ai_runs` keeps the run's *aggregate*
(`ok_count`/`failed_count`/`model`), never the per-project verdict.
⇒ `🚧 מ11` debt: insights should be keyed `(run_id, project_id)` with the report reading the latest approved
run, rather than one row per project. **Registered, not built** (§6b: a new unique key is a migration = work,
not a repair).

**‏(ב) Which state changes leave no trace of when? — none new.** `feedback_ai_insights.classified_at` and
`feedback_ai_runs.started_at/finished_at/approved_at/created_at/updated_at` are all `timestamptz` and all
populated. The one pre-existing hole is already recorded and accepted: `assignments.invite_sent_at` is
**overwritten** on a re-invite (R2, m4's accepted hole), which is why every page says
*"מאז הזימון האחרון"* and never *"הראשון"* — and `מ17` says exactly that on screen in its definitions line
(*"זמן-התגובה נמדד מאז הזימון האחרון ולא מהראשון — שליחה חוזרת דורסת את שעת הזימון"*). **Declared, not hidden.**

**‏(ג) Where something IS journalled, is it keyed so a report can join back? — yes.**
`feedback_ai_insights.run_id` → `feedback_ai_runs(run_id)` and `.project_id` → `projects(project_id)`, both
real FKs with `on delete cascade`; `feedback_ai_runs.approved_by`/`run_by` are `text` FKs to `users(email)`.
No email-instead-of-id gap. **The only 🔮 item here is (א).**
**Second gap, smaller:** `assignments.recommended_rank` is written but **never dated** — there is no
`recommended_rank_set_at`, so *"when did we start adopting the recommendation"* is only answerable through the
assignment's own timestamps. The screen already declares the absence honestly (מ14/מ17 tile
*"אימוץ המלצת Smart Match — טרם נמדד … המערכת התחילה לרשום את הדרג רק מעכשיו"*), so this is a **registered
debt, not a defect**.
📌 `🔮 answerable-later — 2 gaps registered`

### F-20 · §5b clustering — `אשכול: 20 ממצאים ⇒ 14 סיבות-שורש`
Merged: **F-10 + the §2c tautology (SEC2C-02) + the §3b dead generic-fallback = ONE root cause**
(`ExportBar.jsx`'s error path was never exercised: the promise is not awaited AND the guard that would
classify the error is a tautology — one fix, one file, one test). **F-12 + SEC2C-01 = one item**
(same finding, wrong premise corrected). **F-11 + the §3b `??`-does-not-catch-`''` items in the same file =
one fix round on `AnalysisRunBar.jsx`.** **F-05 + the §3b `missingReportParamsMessage`-has-no-importer item +
F-18's stale row = three separate causes, kept split** — they look like "doc/lib hygiene" but each would
change independently. Everything else stands alone.

### F-21 · §5 QA coverage matrix — as run by THIS audit
| Type | Verdict | Evidence I produced or verified this turn |
|---|:-:|---|
| Unit | ✅ | `npm run gate` exit 0 — **117 files · 3,035 tests · 0 failed**. The acceptance oracles are copied, not re-authored: Gini `[1,2,3,4,10] ⇒ 0.40` with an explicit not-`0.50` guard (`reportsHostesses.test.js:56-72`). |
| Integration (RPC↔UI) | ✅ | md5 sweep **16/17 byte-equal, 17/17 logic-equal** against the latest migration per function (F-01); the payload contract's shape guard (`assertReportShape`) throws rather than repairs. |
| RLS | ✅ | 17/17 RPCs `security definer` + `search_path=""` + `proacl` with no PUBLIC/anon, measured live in `pg_proc`; whole-DB `rls_enabled_no_policy` triaged, 11/11 in writing (F-02); m11 adds **zero** anon-executable functions (F-03). |
| E2E | ⚠️ | **Not run by me** — a parallel agent owns the full suite. Its result file never arrived within the 30-minute window (see the E2E line in §4). The last measured state is inherited, not verified by me: `p3-e2e-rerun.json` 185 passed / 6 failed / 7 skipped, of which 5 are pre-existing on `origin/dev@9b5ea534` (D-37(ה)). **טעון בדיקה.** |
| Regression | ✅ | The gate is a full-tree run at `fc3cb231`, not a scoped one: m4's suites and every other module's unit tests are inside the 3,035. |
| UAT | ⚠️ | The comprehension quiz + the morning table are in the artifact, unanswered — by design, that is Ishay's step. |
| Security / Pen | ✅ | §2c scan 17/17 RPC gates, 0 blockers; I independently closed its declared blind spot with the live `pg_proc` query, and **corrected its premise** on SEC2C-01 with the live `permissions` matrix (F-12). |
| Performance / Load | ❌ | **Not measured by anyone, and I am saying so rather than marking it N/A.** The heaviest surface (מ17) renders a 107-point Lorenz series and two 50-row tables; no timing was taken at any point in this module. Target: the M12 sweep. |
| Usability | ◐ | 16 surfaces × 4 identities × 2 onboarding modes were shot (128 PNGs + 12 extras) and two copy evaluators ran; **I re-rendered 7 surfaces live myself** — all `rendered`, **zero console errors**, no overflow. But: **the `canSeeMoney === false` branch has never been seen on a screen by any identity** (F-12) — `מנהלת פרויקטים` is not a test identity. |
| Compatibility | ❌ | Chromium 1280×800 only. No second browser, no mobile — correct for this module (the reports screen is desktop-only by ruling), and the system-wide sweep is M12's. |

---

## 2. Routing and verdict — 17/09/2026, branch head `fc3cb231`

> ✏️ **17/09/2026 · הוספה של סבב-התיקון שאחרי האודיט ("closing-audit fix round ⑦") — שורה אחת, בלי לגעת בטקסט של האודיט.**
> **נסגרו בסבב:** ‏**B-1** ו-**B-2** *(קוד, עם בדיקות אדום-לפני/ירוק-אחרי — ‏`ExportBar.test.jsx` ו-`CustomersTab.test.jsx`)* · ‏**T1** *(‏`finiteNumber` ⇒ בית אחד, `src/lib/reportsFormat.js:40`)* · ‏**T3** · ‏**T10** · ‏**T11** *(קוד)* · ‏**T6** *(‏`module-11.md §3.3` — 39 = 17+10+10+1+1)* · ‏**T7** *(‏`src/modules/11_reports/CLAUDE.md` — ‏502 במקום 200, ‏+ רענון §4c שהאודיט הותיר כחוב)*.
> **נשארו פתוחים, וכל אחד קיבל שורת-`PROJECT_MASTER §6` מתוארכת:** ‏**T2 · T4 · T5 · T8 · T9 · T12 · T13** — ‏**החוב ש-§7 כאן הכריז כ-OWED שולם.** ⚠️ **חריג אחד:** שאלת-הסתירה של **T4** טעונה גם רישום ב-`PROJECT_MASTER_sec7.md`, וסבב-התיקון לא הורשה לכתוב שם.
> **הפירוט המלא:** ‏`module-11.md` §9 **D-39**.


### §1 Definition-of-Done walkthrough (`module-11.md §8`)
| # | Gate | Verdict | Evidence, this turn |
|:-:|---|:-:|---|
| 1 | `npm run verify` green | ✅ | `npm run gate` **exit 0** (gate ⊃ verify): 117 files · 3,035 tests · lint · prettier · build. |
| 2 | Unit test for pure logic | ✅ | `src/lib/reports*.test.js` × 7 present; the Gini acceptance oracle is the spec's hand case, with a negative guard (`reportsHostesses.test.js:56-72`). |
| 3 | Migration applied **and** `docs/schema.sql` regenerated | ✅ | 20 m11 migration files; live `pg_proc` = 17 functions, md5 16/17 byte-equal / 17/17 logic-equal (F-01). `docs/schema.sql` carries `feedback_ai_runs` (20 hits) · `feedback_ai_insights` (17) · `recommended_rank` (5) · **all 17 `report_m*` functions**. |
| 4 | Journal + `db_roadmap §10` + `STATUS.md` | ✅ | `db_roadmap.md` holds **24** `module11` rows; the journal carries the 16/09 build entry; STATUS carries the awaiting-audit block. **This audit adds its own three** (persistence below). |
| 5 | No secrets | ✅ | §2c scan, uncapped: every hit is `Deno.env.get` or a doc placeholder; `package.json` byte-unchanged vs `origin/dev`; `npm run audit` exit 0, 0 findings. *(Method note: the secrets evidence is the §2c sweep + the gate's audit step. `gitleaks` is **not** a step of `npm run gate` — I checked `package.json` — so it is not what earns this tick.)* |
| 6 | Merged to `dev` through a PR | **N/A-at-audit (post-merge)** | The audit never merges. Not a §6 blocker. |
| 7 | **This module's seventh** — all 39 rulings map to a step, a deferral or a reality-kill row | ◐ | **37 of 39.** Rulings **7** and **18** are in no bucket of §3.3; both are honoured in the product (F-07 measured each), so this is a doc reconciliation, not a gap. |

🔴 **DoD sign-off gate — `ויתור על הד-ההקלדה — הכרעת-ישי 16/09/2026, חד-פעמי` (D-9).**
The gate is printed as the template requires and **no typed echo is awaited**. The waiver is one-time and
changes no gate in the repo.

### §6 BLOCKERS — 2, written FIX-READY for a session that was not here

**‏B-1 · The Excel export swallows its only real failure** *(F-10)*
- **① Where** — grep anchor `function handleExport` in `src/modules/11_reports/components/ExportBar.jsx`, and
  `export function exportReportRows` in `src/lib/reportsExport.js`.
- **② How it was observed** — read both this turn: `exportReportRows` is non-`async` and ends
  `return writeXlsxFile(...)` (a Promise); `handleExport` is non-`async` and calls it **without `await`**
  inside its `try`, so a rejection never reaches the `catch`. The catch's only reachable inputs
  (`EXPORT_NO_TABLE` / `EXPORT_NO_ROWS`) are already blocked upstream by `exportCaption`'s `disabled:true`.
  Second half, same file: `[caption.file, err?.message].includes(err?.message)` is a tautology, so the
  generic fallback is dead and a message-less error renders nothing.
- **③ Read first** — `src/modules/11_reports/CLAUDE.md` §2.6 (the export invariant) ·
  `module-11.md §4.3` (the silent-failure doctrine this violates) · the locked strings at the head of
  `src/lib/reportsExport.js` (**do not reword them**) · `cards-*.md §⑤` row 5 (the caption contract).
- **④ Proof of fix** — a NEW test in `ExportBar.test.jsx` that mocks `exportReportRows` to **reject**, and
  asserts the `role="alert"` span renders a non-empty Hebrew sentence. **It must go red on the current tree
  and green after.** Second assertion, for the tautology: an error whose `message` is `undefined` must still
  render the generic sentence, not an empty span.

**‏B-2 · A running analysis run is reported to the user as a failed one** *(F-11)*
- **① Where** — grep anchor `async function classify(body)` and `function localState(local)` in
  `src/modules/11_reports/tabs/customers/AnalysisRunBar.jsx`.
- **② How it was observed** — read both sides this turn: the edge function answers "already running" with
  **HTTP 409** and a body carrying **both** `error` and `status:'running'`
  (`supabase/functions/classify-feedback/index.ts:825-828`); `classify()` tests `if (result?.status)` first,
  so the 409 sets `local` and the error text is discarded; `barState` gives `local` precedence, and
  `localState` has branches for `partial`/`done`/`noop` only, so `running` **falls through** to
  *"הריצה נכשלה ולא נשמרו בה סיווגים."* with an **active** run button.
- **③ Read first** — the file header `:19-25` (it names this exact blind spot) · `serverRunState` in the same
  file (the **correct** `running` rendering already exists — copy it, do not invent a second one) ·
  `module-11.md §2ב C8` last bullet (branch on `body.status`, never `res.ok`) · migration **H1** (the unique
  partial index that makes 409 the designed answer).
- **④ Proof of fix** — a NEW test in `CustomersTab.test.jsx` (or a dedicated `AnalysisRunBar.test.jsx`) that
  makes `invokeClassify` resolve with `{ error:'ריצת-ניתוח כבר פועלת.', run_id:1, status:'running' }` and
  asserts the bar shows the **running** sentence and **no enabled run button** — red before, green after.
  **Fault-injection half, since no suite drives the real 409:** with two browser contexts on
  `/reports?tab=customers&report=notes`, start a run in the first, then press *"הרץ ניתוח"* in the second;
  evidence = the second context's bar text + the 409 in the network log + `select count(*) from
  feedback_ai_runs where status='running'` staying at 1.

🚫 **Neither is fixed by this audit** (template §6b: the auditor lists, the orchestrator dispatches).
Both are small, both are in the module's own declared risk class, and both have a precedent to copy.

### §7 Tech debt — registered, each with its target
| # | Item | Target | Source |
|:-:|---|---|---|
| T1 | `finiteNumber` exists in **three** copies across `src/lib/reports{Customers,Executive,Hostesses}.js`, one already textually drifted; one invariant, one home needed | m12 / next reports work | F-05 |
| T2 | **Four deny-all tables still carry full `anon`/`authenticated` table grants** (`login_attempts` · `feedback_rpc_calls` · `project_changes` · `seed_registry`). No live exploit (RLS denies), but the airtight pattern already exists in this DB — revoke the grants too | m12 security sweep | F-02 |
| T3 | `ReportSurface.jsx` — empty-page early return precedes `MissingParamsBanner`; a missing param can read as "no data". Latent today (all 5 params present, no UI delete path) | m12 | F-13 |
| T4 | 🔴 **Money crosses the wire to a role `blocked` on 'כספים'** — masking is client-side only on מ19/מ21. **Conflict question for Ishay, not a unilateral fix** | Ishay's ruling, then m12 | F-12 |
| T5 | **`מנהלת פרויקטים` is not a test identity**, and she is the only role that exercises `canSeeMoney === false` on real data | next evidence round | F-12 |
| T6 | `module-11.md §3.3` does not sum: 37 of 39 rulings bucketed (7 and 18 missing) | doc round | F-07 |
| T7 | `src/modules/11_reports/CLAUDE.md` says a totally failed run returns **HTTP 200**; it returns **502**. Correct advice, wrong fact, in an auto-loading file. §4c refresh owed (this + T1 + T4) | doc round | F-18 |
| T8 | 🔮 **`feedback_ai_insights` is `UNIQUE (project_id)` ⇒ a re-run destroys the previous model's per-project verdict**, and report 20's agreement matrix becomes historically unreproducible | after the conference | F-19 |
| T9 | 🔮 `assignments.recommended_rank` is written but never dated — no `*_set_at` | after the conference | F-19 |
| T10 | `missingReportParamsMessage` (`src/lib/reportsParams.js:54`) has **zero production importers** while the screen prints the bare param name | m12 | F-15 |
| T11 | `AnalysisRunBar.jsx:77-82` bare `catch` drops the supabase error with no log — the only m11 network path with no trace | folded into B-2's round | F-15 |
| T12 | **Conference stories ① and ② carry numbers that no longer match the screen** (0.49 vs 0.46 · 574 vs 581). Sentence changes, not code changes — **Ishay's** | before 15/10 | F-17 |
| T13 | **`CLAUDE_CODE_LOG.md` narrative measured at 2,599 lines against a ≤150 target** (`awk '/^## Session Log/{f=1;next} /^## Reference/{f=0} f' … \| wc -l`, run this turn). **Escape hatch taken** per persistence 2b: a ~2,450-line harvest-and-compress cannot be done well alongside this audit, and the harvest step is exactly where working-lessons get lost. ⇒ **a dedicated compaction session**, with the measured number | dedicated session, before m12 | this audit |

⚠️ **T1-T13 need `PROJECT_MASTER §6` lines, and I could not write them:** this audit's scope
(orchestrator) is `close-findings-module-11.md` · `module-11.md` · `CLAUDE_CODE_LOG.md` · `STATUS.md` only.
**The §6 registration is OWED and handed to the orchestrator explicitly** — it is not done, and saying so is
the point.

### Whole-DB `rls_enabled_no_policy` triage — 11/11 written (F-02)
6 × `bak_*` deliberate deny-all, grants revoked, zero readers anywhere (H0/D-11) · `login_attempts` ·
`login_rpc_calls` · `feedback_rpc_calls` DEFINER-only, pre-existing · **`project_changes` — first written
triage: DEFINER-only by design**, five definer functions including m11's own `report_m12_equipment`, zero
client `.from()`, documented as the deliberate design in `src/modules/06_projects/CLAUDE.md:23,43` ·
**`seed_registry` — first written triage: DEFINER-only seeding infrastructure**, five definer functions,
zero references in `src/`/`e2e/`. Residual grant-hygiene = T2.

### 🪞 Self-review — four answers, each with an anchor
1. **Who caught the mistakes — me or someone else?** **Both, and the split is the point.** The two blockers
   came from the dispatched `silent-failure-hunter`, not from me; what I added was the verification that
   promoted two of its three and **demoted the third** (F-13, measured unreachable). And I caught **three of
   my own errors, all by arithmetic rather than by re-reading**: the 26-vs-39 ruling count (my regex demanded
   `**N**|`), the "10 dead onboarding keys" (I grepped single quotes only), and the "three `drill: true`"
   (the third was inside a JSDoc). **Each was caught because a number failed to sum, never because I re-read
   my own work** — which is the measured pattern, not an exception to it.
2. **Which of my own actions got no check at all?** **The E2E line.** I did not run the suite (forbidden —
   another agent owns it), its result file never arrived, and I wrote that line as `טעון בדיקה` rather than
   inheriting `p3-e2e-rerun.json`'s numbers as fact. Also unchecked by me: the 128-PNG evidence set — I
   opened **one** PNG (`CEO-m0-aging.png`) and re-rendered **7** surfaces live; the other 120 images are
   `דווח-לי`. And I never drove a keyboard or a screen reader.
3. **Where did I look for confirmation instead of refutation?** **Once, and it produced the session's most
   important correction.** I was about to accept the §2c agent's grading of SEC2C-01 as debt on its premise
   *"no role holds לקוחות without כספים"* — a premise that matched what I expected from `§2.7`'s four test
   identities. **Querying `permissions` instead of trusting it returned `מנהלת פרויקטים`: `לקוחות edit`,
   `כספים blocked`, one active user** (F-12). The source writes its roles in a table; the reporter searched
   a micro-guide's prose list.
4. **What is the general shape — how many are really the same defect?** `אשכול: 20 ⇒ 14` (F-20). And the
   dominant shape across the whole audit is **one**: *a number or a sentence frozen at the moment it was
   written, while the thing it describes kept moving.* Story ① (0.49 frozen before D-17 changed the window)
   · story ② (574 frozen seven days ago) · `module-11.md §3.3` (a sum that stopped summing when rulings were
   added) · `src/modules/11_reports/CLAUDE.md` (HTTP 200 frozen before the 502 branch was written) ·
   `finiteNumber` (one invariant, three frozen copies). **Five of the fourteen root causes are this.** The
   blockers are not — they are two real code defects, and they came from a different lens.

### 🛑 Disk state — verdict NO (template persistence 8a)
- `docs/micro_guides/close-findings-module-11.md` — **stays in place**, NOT archived (§6: archiving while
  blockers are open removes the richest context exactly when the fixing session needs it).
- `docs/micro_guides/module-11.md` — status header set to `🛑 Closed-audit: NOT mergeable — 2 blockers open`,
  DoD ticks and QA matrix filled with what **was** verified (it is real), §9 gains the audit row.
- **Micro-guide compaction: NOT done, deliberately** — §4c's compaction collapses the guide to an as-built
  summary, and the module is not closed. It runs at the clean close, after the blockers are fixed.
- Fix-round progress: **none started** — this audit fixes nothing by design.
- Paste-ready opening line for the fixing session is printed at the end of the report.
