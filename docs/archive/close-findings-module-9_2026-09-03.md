# Close-audit working findings — Module 9 (הגדרות מערכת)

> Scratch file (module-close audit rule 5). Raw observations at the moment of finding — **no
> conclusions, no routing, no fixes mid-scan**. Clustering happens at §5b, routing at §6/§7.
> Also the interruption handoff: a fresh session resumes from THIS file, not from the transcript.

**Audit session opened:** `03/09/2026 02:35` · branch `ishay/module-9-settings` · HEAD `b9dbcf7`
· working tree clean · 9 commits ahead of `origin/dev`.
**Auditor:** fresh session (did NOT build this module). Contract audited against:
`docs/micro_guides/module-9.md`.

---

## Section state (updated as the scan proceeds)

| § | Section | State |
|---|---|---|
| 1 | DoD walkthrough | ⬜ |
| 2 | Security & RLS stress-test | ⬜ |
| 2b | UX & validation audit | ⬜ |
| 2c | General security scan (agent) | ⬜ |
| 3 | Architectural review | ⬜ |
| 3b | Silent-failure sweep (agent) | ⬜ |
| 4 | Housekeeping + DB health | ⬜ |
| 4d | Answerable-later | ⬜ |
| 4c | Module gotchas file | ⬜ |
| 4b | Duplication & shared-component | ⬜ |
| 5 | QA coverage matrix | ⬜ |
| 5b | Cluster before routing | ⬜ |

---

## Raw findings

### §1 + §4 — live DB measurements (03/09/2026 02:4X, MCP read-only, project `yfeovxppnfoafmfbdfvh`)

- `params`: **43 rows · 6 distinct types · 38 owned · 4 policies (one per command)**. Types:
  `control_alerts, integration_tech, pricing_timing, shift_invites, smart_match, templates`.
  Both Q-2 deletions gone (`תבנית_איפוס_סיסמה`, `קישור_בסיס_סקר_לקוחות` ⇒ 0).
- Owner split, live: projects 4 · finance 8 · recruitment 25 · logistics 1 = **38**; CEO 0 (⇒ 5 rows with `owner_role_id IS NULL`). Matches Q-4's analogy reading exactly.
- `notification_preferences`: **3 self policies** (SELECT/INSERT/UPDATE, all `email = (select auth.email())`), no DELETE — as designed.
- Policy text read from `pg_policies`: matches guide §4.1 word-for-word, `(select …)` initplan wrap present on all four, `params_write_ceo_only` gone.
- `record_feedback` · `archive_project`: both contain `סף_שביעות_רצון`, **zero `< 3`**, `SECURITY DEFINER`, `search_path=""`, ACL = postgres/service_role/**authenticated only**.
- `list_hostesses_below_min_wage`: exactly **one** overload (`p_threshold numeric`), DEFINER, `search_path=""`, authenticated-only ACL.
- `rls_enabled_no_policy` whole-DB (NOT filtered to m9): **4** — `login_attempts` · `login_rpc_calls` · `project_changes` · `feedback_rpc_calls`. All four carry a named gatekeeper in `docs/db_health_checks.md:88-92`; `project_changes`'s deliberate policy-drop is recorded at `db_roadmap.md:1397`. m9 added zero.
- Tables with RLS OFF: **none**.

### §2 — RLS stress-test, 21 impersonated assertions in a rolled-back block. **21/21 as designed.**

Positive control first (CEO to 1 row). finance own=1 / other=0 · recruit mirror (own=1 / other=0) ·
logistics own=1 / other=0 · finance SELECT sees all 43 (§7.83, by design) · finance INSERT ⇒ `42501` ·
finance DELETE own row ⇒ 0 · finance nulling her own `owner_role_id` ⇒ `42501` · finance stealing a
recruit row ⇒ 0 · logistics RPC ⇒ `42501` · finance RPC default ⇒ 0 rows, `(40)` ⇒ 2 · finance sees 0
prefs rows of others · finance INSERT of the CEO's prefs ⇒ `42501` · finance UPDATE of the CEO's prefs
row ⇒ 0 · finance INSERT of her own prefs ⇒ 1 · finance DELETE of her own prefs ⇒ 0 (no policy, by design).

### §4 — housekeeping, all run this session by name

- **`npm run gate` exit 0** — lint · prettier · **83 files / 2142 tests, 0 failures** · build 8.25 s ·
  jscpd **26 clones / 0.98%** · knip clean · `audit` "no severe unexempted vulns (1 finding, 0 exempted)" ·
  `check:bidi` clean · `check:context` "context architecture sound" + **1 open `🚧 מ9` = notification prefs** ·
  `check:docs-structure` "66 files, zero findings".
- DoD greps: six old constants in `src/` ⇒ **0** · `< 3`/`ל-3` in the two m8 files + `customers.js` ⇒ **0** ·
  `param-*` testid asserted anywhere ⇒ **0** · `console.log` added in the diff ⇒ **0** ·
  the "(coming soon)" string in `ProfileSettingsPage.jsx` ⇒ **0**. `PricingParamsCard`/`getPricingParams`/`updatePricingParam`
  ⇒ 9 hits, **all of them tombstone comments**, no live code.
- Advisors (security): 4x `rls_enabled_no_policy` (above) · 6x `anon_…definer` (all pre-existing m1/m4/m8) ·
  ~30x `authenticated_…definer` — of which **exactly one is m9's**: `list_hostesses_below_min_wage`,
  by design (browser RPC, gate inside the body, proven `42501` for logistics) ·
  1x `auth_leaked_password_protection` (pre-existing Auth setting, not DB).
- Working tree clean; HEAD `b9dbcf7`; 9 commits ahead of `origin/dev`.

### §4c — module gotchas file

`src/modules/09_settings/CLAUDE.md`, 67 lines, Hebrew, seven traps, every one citing a mechanism
(write policy is "edit OR ownership" · the double silent failure on one row · V-9's pre-write lock ·
`param_value` is always `text` · testid prefix · byte-exact role names · `42501` ⇒ `blocked` not a red
error · prefs identity from the session · `countAttendanceRows` single-fetch). Matches the m1/m2 tone.
**F-1 (nit):** it says the S3 UI "should hide" the panel on `42501` — written at step 2.5 in future
tense, before Phase 3 existed. Now as-built; the tense makes it read as an unbuilt intention.

### §4b — duplication

jscpd: 26 clones repo-wide (0.98%), **2 involve m9**, both `MySettingsPage.jsx` vs `ParamsTab.jsx`:
`handleSave`'s written-rows write-back into local state (22 lines) and the `LoadingOrError` block (10 lines).
**F-2:** the write-back half is genuine shared logic — same invariant (local state must mirror what was
actually written), and it would have to change together. It differs only in `form.submit()` vs
`form.submit(groupNames)` plus testid/skeleton props. Not drifted functionally today (only the comment
lives in one copy). knip: nothing dead.

### §2c — general security scan (agent, scoped to the diff)

Injection · XSS · secrets · client-only-authz · unsafe-input · error-leakage · dependency: **checked, clean**,
each with citations. Zero new packages (`package.json` not in the diff). Migrations: all three DEFINER
functions carry `search_path`, grants follow revoke-then-grant-to-authenticated, nothing to `public`/`anon`.
Two hardening findings, both re-measured by me:

**F-3 (agent `H-1`) — CONFIRMED LIVE. `list_hostesses_below_min_wage` validates its floor, not its ceiling.**
Migration D rejects `p_threshold < 0` and accepts anything above. Measured this session, impersonated as
finance: `list_hostesses_below_min_wage(999999)` returns **26 rows** = every active hostess with
`full_name` + `hourly_rate`, while her direct read of `hostesses` returns **0**. Reachable from the UI:
`שכר_מינימום_שעתי` is `kind: 'decimal'`, `min: 0`, **no `max`**, and `BelowMinWageList.jsx` forwards the
typed value straight through.
*Severity re-derived independently, not taken from the agent:* finance already reads
`hostess_bank_details` for all **26** hostesses (measured, impersonated — m8's own surface, strictly more
sensitive than name+rate). So **no confidentiality boundary is crossed that is not already open by design.**

**F-4 — the same missing ceiling, as a PRODUCT footgun, and it is the bigger half of F-3.**
Measured across the registry by parsing `PARAM_REGISTRY` entry-by-entry with brace matching (not a
file-wide `grep`): **43 entries · 30 of numeric kind · 7 carry an explicit `max` · 23 carry no ceiling at
all.** The 7: `אחוז_מעמ` · `אחוז_פיצוי_ביטול_חלקי` · `סף_שביעות_רצון` · the three weights ·
`שיעור_בונוס_הוגנות_לשבוע`. `KIND_RULES` supplies a kind-level ceiling only for `percent` (100) and
`weight` (1) — **`int` and `decimal` have none**, which is why all 23 uncapped entries are of those two kinds.
*(The peer build session independently reported "10 with max / 20 without". Re-measured here and the
23/30 stands; a file-wide `grep -c "max:"` returns 11 because `KIND_RULES` and `boundsFor` contain `max:`
too, which is the most likely source of the 10.)* Worst case traced live: `enforce_hostess_min_wage`
(`pg_get_functiondef`, read this session) blocks **every** hostess write whose `hourly_rate < שכר_מינימום_שעתי`,
so typing `3500` instead of `35` — accepted by the validator — locks module 4's whole save path.
The failure is **loud, self-explanatory** (Hebrew exception naming both numbers) and reversible by fixing
the param back. Same shape as the UX review's own A2 fix (`סף_שביעות_רצון = 99`), which repaired the
*mechanism* (`validateParamValue` now reads `min`/`max`) but never swept *which rows need a ceiling*.

**F-5 (agent `H-2`) — conflict question, NOT a patch. Declared limitation §4.5(3) is narrower than the code.**
Recorded (`module-9.md:422-423`): "Kind validation is client-side … a **Table-Editor** edit bypasses
validation". Measured: (a) the bypass is not limited to the admin console — `params_update_settings_or_owner`
grants an owner a column-unrestricted UPDATE and `param_value` is bare `text not null` with only
`params_set_updated_at` on it, so a plain authenticated `PATCH /rest/v1/params?param_name=eq.X` from a
browser console skips the client guard entirely; (b) (3) names only "kind validation", while the template
required-placeholder block (`emailTemplates.js:153-163`) and the weights-sum-1.00 / distance-order
cross-field rules (`useParamsForm.js:115-135`) are equally client-only and appear nowhere in §4.5.
Actors are the same 5 trusted internal users who may already write those rows through the UI, so this is
integrity *wording*, not privilege escalation.

### §3b — silent-failure sweep (agent, scoped to the diff). 7 findings; I re-verified the two severe ones.

**F-6 — CONFIRMED by reading the code myself. `ימי_אזהרה_הצעה_פגה` is the only quote-screen param outside
the screen's own missing-param banner.** `missingPricingParamsMessage({ vatRate, validityDays })`
(`quotes.js:517`) inspects exactly two params; `QuotesPage.jsx:219` calls it with exactly those two, and
the m9-added third (`expiringSoonDays`) is loaded by `getQuoteScreenParams` (`03_quotes/api.js:66-72`),
which is **not** the loud `getParamValues`. `quotes.js:604` computes
`isExpiringSoon: warning !== null && daysLeft <= warning` ⇒ unknown becomes **false**.
Effect: the `פג בקרוב` chip count (`QuotesPage.jsx:251`) reads **0**, the filter returns nothing, the
per-row badge never appears — with no banner and no error.
🔴 **This contradicts the banner's own recorded reason, quoted at `quotes.js:510-515`: Ishay's ruling
31/07/2026 created it precisely because these params fail silently.** m9 added a param of exactly that
class to exactly that screen and inherited the silence without the banner.

**F-7 — CONFIRMED by reading the code myself. `סף_שביעות_רצון` on the customers screen: the recorded
justification points at a shout that does not exist on this path.**
`customers.js:44-46` states the rule verbatim: *"וסף חסר ⇒ `false` ולא 3 … 'לא בכוח', בלי להמציא מספר.
**הצעקה על פרמטר חסר יושבת ב-`getParamValues`**"*. But this screen never calls `getParamValues`:
`getCustomerScreenParams` (`02_customers/api.js:139-147`) checks only `error` and returns whatever rows
came back, and `CustomersPage.jsx:229-234` catches into `setSatisfactionThreshold(null)` with no error
state and no console trace. ⇒ the `טעון בירור` badge disappears from **every** row and the preset filter
returns an empty list that reads as "nobody needs a call", with nothing anywhere saying why.
⚖️ **Two sources, reported side by side, not patched:** the same catch block documents the identical
"לא בכוח" degradation as *deliberate* for its sibling param (the dormancy threshold) — so the graceful
degradation is a precedent, while the sentence naming `getParamValues` as the safety net is the half that
is measurably wrong here. **What changed with m9:** before it, this threshold was a code constant that
could not fail; m9 made a warning indicator network-dependent.
*(The four sibling screens — m4 `OverviewTab`, m5 `LogisticsPage`, m6 `TeamTab`, m8 `FinancePage` — do
route through `getParamValues` and the contract holds; I spot-verified `FinancePage.jsx:415-435`.)*

**F-8 (latent) — `TemplateEditor` hides a `templates` row that has no placeholder contract**, while
`ParamsTab.jsx:53` routes every `param_type='templates'` row into it and the sidebar counter still counts
it. `TemplateEditor.jsx:58-62` filters to `TEMPLATE_PLACEHOLDERS` and `:103` returns `null` if none survive.
⚖️ Two recorded intentions collide: the filter cites step 3.2 as its authority, and §2.8 says a DB row with
no registry entry *"renders with its raw name and a visible note — **never hidden**"* (`ParamRow.jsx:52-56`
calls itself the safety net for exactly this and is bypassed). **Not live today** — both contract-less rows
were deleted by migration A and `emailTemplates.test.js` locks the count at 11 — and no test asserts
DB-templates-rows ⊆ `TEMPLATE_PLACEHOLDERS`.

**F-9 (minor) — the two m9 load catches discard the error entirely.** `ParamsTab.jsx:99-102` and
`MySettingsPage.jsx:68-70` are bare `catch { setLoadError('לא ניתן לטעון את ההגדרות.') }`. The string is
correct per §3.7, but every sibling screen keeps a `console.error` trace alongside it
(`LogisticsPage.jsx:199`, `TeamTab.jsx:125`, `FinancePage.jsx:433`). Zero diagnostics here.

**F-10 (minor, checked and standing) — `countAttendanceRows` is a plain client read on `assignments`**
(`09_settings/api.js:145-153`); a role blocked on 'דיילות' would get `[]` with `error: null` rendered as
fact at `SmartMatchPane.jsx:200`. Its justification comment (A-10) **checks out today** — the pane is only
reachable by CEO and recruitment, both of whom hold 'דיילות' — but the safeguard rests on a permission map
that is itself editable data, and §4.5(4) names this live count as the *only* guard on the reliability toggle.

**F-11 (minor, unreachable today) — `useParamsForm.submit` can no-op or half-succeed silently**
(`useParamsForm.js:165-172`): dirty rows failing `canEditRow` are dropped from the batch; if all are dropped
it returns `{ok:false}` with **no `saveError`** (button click, nothing happens); in a mixed set the survivors
write and `ParamsTab.jsx:183` still fires the success toast. Unreachable from the UI because
`ParamRow.jsx:102/140` disables non-editable rows — which is also why V-9's mixed-batch refusal never fires
from the real screen.

**F-12 (checked, NOT a finding) — the m8 feedback gate.** `needsSatisfactionAttention` returns `false` on
an unknown threshold, which would *open* the client gate rather than close it. Verified unreachable:
`FinancePage.jsx:418-435` loads through `getParamValues` and throws, and the dialog only mounts under
`openProject` after that load succeeded (`FinancePage.jsx:599-608`).

**Verified clean by the sweep and spot-checked by me:** every write in `09_settings/api.js` carries
`.select()` + `assertRowsAffected` (`:90-107`, `:189-203`), and `assertRowsAffected` treats both `null` and
`[]` as denial · `src/api/params.js:36-68` genuinely fails loud (checks the returned SET, treats whitespace
as missing, names every missing param) · the `blocked` RPC path raises a real `42501` rather than returning
a client `[]`, and the UI hides the panel instead of rendering `0`.

### §2b — UX & validation audit

🔴 **Built-vs-approved-spec diff: there is NO `docs/specs/module_09_*/` folder** — `ls docs/specs/` returns
only modules 04 · 05 · 06 · 08. This is **ruled, not missing**: R-1 (Ishay, 02/09/2026 ≈19:20) — micro-guide
with a short product interview, no full Discovery. The product source is therefore
`docs/guides/modules/module_09_settings.md` §(1)א–(1)ז + C5 §5.6.16 / C6 §2.4.9 + the Ledger §3.
**I walked (1)א–(1)ז against what shipped. Omission hunt first:**

- **(1)ב(2) "one search field that filters across groups"** — as-built, search *navigates* rather than
  *filters* inside the two pane groups (templates, smart_match). This is a **disclosed, dated Claude ruling**
  under Ishay's delegation, written into the step guide's (1)ו block (`הכרעתי, הפיך`), with a measured reason
  (filtering inside `SmartMatchPane` collided with its partial-row rule). ✅ recorded, not an omission.
- **F-13 — (1)ב(2)'s own argument is unanswered on `/my-settings`.** (1)ב(2) says 39 rows are past
  eye-scanning ⇒ a search field. `MySettingsPage.jsx` has **no search at all** (grep: zero hits), and the
  recruitment manager owns **25** of the 38 rows (measured live). The reasoning that produced the search on
  the CEO tab applies to her page and nothing was built there. *(Already on the seven recorded items.)*
- **F-14 — (1)ג(3) declared two un-swept surfaces and neither was swept.** Verbatim: *"ערכים קשיחים בתוך
  פונקציות-המסד (נבדק רק סף-שביעות-הרצון) · ערכים בקומפוננטות (`src/modules/`) ולא רק ב-`src/lib/`"*.
  I swept the second myself: `src/modules/**` non-test carries 6 numeric constants —
  `CONTROLS_THRESHOLD=8` · `MAX_VISIBLE=8` · `MS_PER_WEEK` · `VISIBLE_CANDIDATES=8` ·
  `LABEL_ANCHOR_YEAR=2000` · m9's own `PREVIEW_DEBOUNCE_MS=400`. **All six are presentation or physics —
  zero business rules.** ⇒ the declared gap turns out to be **empty on that axis**; the DB-function axis
  remains unmeasured and is the one worth registering.
- **(1)ו(3) `QUARTER_WINDOW_DAYS`** — Ishay's recorded default (ב) "stays in code" was followed (V-8), so
  the "רבעון אחרון" label stays truthful. ✅ no deviation.
- **(7) acceptance line "משתמש שאינו מנכ"ל לא רואה את המסך כלל"** is now imprecise: the `/system/params`
  **tab** is still unreachable for the four blocked roles (proven live), but R-2/Q-1 gave owners a second
  door at `/my-settings`. **F-15: stale sentence needing a dated annotation at the line.**

**End-of-UI-phase 🎨 gate honoured:** yes — step 3.7 approved by Ishay `03/09/2026 01:3X` ("מאשר"), after
two catches of his own (the oversized value box; the unit drifting away from it), both fixed and re-measured
before the approval. A dedicated fresh-context UX/UI review then ran and found two real blockers no gate
caught (chip appended instead of inserting at the caret, clearing the block on a corrupt mail body;
`validateParamValue` ignoring the registry's own `min`/`max`, so `סף שביעות רצון = 99` was accepted) — both
fixed with measured proof, unit tests 170 ⇒ 218 in the m9 + registry files.

**Validation completeness:** `KIND_RULES` covers percent · int · decimal · weight · boolean · email · url,
blank is never 0 (A-4), templates are validated by `templateSaveVerdict` rather than by kind. Cross-field
rules (weights sum 1.00, goalpost ≤ gate) live in `useParamsForm.js:115-135`. **The gap is the ceiling —
see F-4.**

**The seven items recorded-not-fixed, each re-verified this session:**
1. **No unsaved-changes guard on navigation.** Confirmed: no `beforeunload` / blocker anywhere in m9.
2. **Four card recipes in one screen's four tabs.** Measured: `UsersManagementPage` and
   `PermissionsMatrixPage` = `rounded-2xl shadow-md p-6`; `PricesManagementPage` = `rounded-xl border p-5`;
   `ParamsTab` = `gap-4` with its own card. 🔑 **The divergence predates m9** — prices already differed from
   the m1 pair; m9 added a fourth recipe rather than creating the inconsistency.
3. **The blocked page offers no way forward.** Confirmed: `ProtectedRoute.jsx` renders only
   `אין לך הרשאה לצפות במסך זה.` inside a card — no home link, no next action. **Pre-existing m1 surface**
   (the testid was added 31/07); m9 did not create it.
4. **The locked sum sentence can contradict the tag beside it.** Confirmed at `SmartMatchPane.jsx:165` +
   `:174`: the sentence renders `שלוש המשקולות מסתכמות ל-1.00` unconditionally, next to an amber tag showing
   the real sum (e.g. `1.50`). The sentence is a **§3.7-locked string** ⇒ rewording it is Ishay's call.
5. **Two save models in one module** (params explicit, profile toggle auto-save). Confirmed.
6. **No search on `/my-settings` at 25 rows.** = F-13.
7. **1024 px compresses the hint column.** Recorded by the UX review's own measurement; not re-measured here.
*(Plus, app-wide and explicitly not m9's: 375 px is unusable because `Sidebar.jsx` has no breakpoint.)*

### §4d — 🔮 answerable-later, measured against what SHIPPED (not asserted)

- **(א) overwritten:** every edit overwrites `params.param_value`; §7.70 ruled no history. Accepted and stated.
- **(ב) when:** `updated_at` is live on **both** tables (`params_set_updated_at`,
  `notification_preferences_set_updated_at`; **0 rows with a null `updated_at`**, max `2026-09-02 23:06:37Z`).
  *Who* is unrecorded (§7.23, deferred).
- **(ג) journal keyed to join back:** no journal for params — not applicable.
- **The blueprint's answer was "one accepted gap". Re-asked against the shipped module, I measure TWO more,
  both created by m9's own constant→param move:**
  **G-1 — `שעות_תוקף_זימון` retroactively rewrites invite history.** `assignments` carries `invite_sent_at`
  and `responded_at` but **no `invite_expires_at`** (full column list read live). Expiry is derived at read
  time from `invite_sent_at + threshold`. While 48 was a code constant it could only move by a deploy, so
  history was stable and git-traceable; as an editable row with no history, changing it silently changes
  the answer to *"was this invite still open when she replied?"* for every past assignment.
  **G-2 — `סף_שביעות_רצון` the same, smaller.** `record_feedback` stores the reason text, so the *decision*
  survives, but the threshold that forced it does not — an m11 report cannot say whether the bar was 3 or 4
  in a past quarter.
  *Not a gap:* closed money documents are already isolated by four snapshot columns, verified live —
  `quotes.vat_rate_snapshot` · `assignments.hourly_rate_snapshot` · `project_changes.unit_price_snapshot`
  and `unit_cost_snapshot`. So the VAT/price family is genuinely covered; the two above are not.
  ⇒ **🔮 answerable-later — 2 gaps registered** (target מ11; no column added here, per the rule).

### ⑥3② — the module's own declared blind spot, re-derived rather than repeated

The step guide says a save that fails on the **second** row of a group "was never put on screen".
I read the code path instead of assuming: `useParamsForm.submit` (`:169-197`) calls
`updateParams([change])` **one row per call**, catches per row, returns `{ok:false, written}` carrying the
rows written *so far*, and its `finally` moves exactly those into `saved` while leaving the failed row's
draft in its field; `updateParams` (`api.js:85-107`) writes sequentially and stops at the first failure,
attaching the failed `param_name` to the error as a field rather than to the text.
**Two unit tests assert exactly this partial state** — `useParamsForm.test.js:185`
("כשל נוקב בשם השדה — והטיוטה של השדה הבא נשארת בדיוק כפי שהוקלדה", failure on the second of two rows)
and `:212` ("שורה שכן נכתבה לפני הכשל מפסיקה להיספר כ'שונתה'"). ⇒ **the logic is right and covered; the
gap is only that no human ever watched it.** Journey ⑤ already put the single-row failure on screen with
the same message path. → resolved by a live journey this session (below).

### ✅ ⑥3② CLOSED — the second-row failure, on screen for the first time (03/09/2026 04:2X)

Run as a temporary credentialed evidence-provider spec under `e2e/` (house pattern,
`e2e/CLAUDE.md`), **both PATCHes intercepted so nothing reached the database**: the first
fulfilled 200, the second forced to `403 / 42501`. Two rows of `תמחור ותזמון` edited 30 → 31.
**Spec deleted immediately after the run; never committed.**

| What the module promises | What the screen actually did |
|---|---|
| exactly two writes, stopping at the failure | ✅ `attempts: 2` — `…params?param_name=eq.ימי_תוקף_הצעה` then `…eq.תנאי_תשלום_ימים`, bodies `{"param_value":"31"}` |
| the message names the **second** row, by friendly label | ✅ **`השמירה נכשלה ב"תנאי תשלום" — השרת דחה את השמירה`** — the label, not the DB name, and the reason reads as a reason |
| no false success | ✅ `toast-success` **absent** |
| a way forward | ✅ the primary button relabels to **`נסי שוב`** |
| the written row keeps its new value | ✅ field A = `31` |
| the failed row keeps the typed draft | ✅ field B = `31`, not reverted to 30 |

⇒ **the partial-write behaviour is correct, and the unit tests at `useParamsForm.test.js:185`
and `:212` were describing it accurately.** The module's own declared blind spot is closed by
observation, not by argument.

**One thing measured that nobody had stated, and it is a real (small) information gap:**
`SaveRow.jsx:35-52` renders the failure message **and** the "שינית N מתוך M" counter in the
**same slot** — a ternary — so after a failure the counter disappears. With two rows that is
fine. **With six, rows after the failed one were never attempted and nothing on screen says so:**
`השמירה נכשלה ב"X"` can read as "everything else went through". → §7, and the wording is
Ishay's call (e.g. appending "ו-N שורות נוספות לא נשמרו").

### §3 — architectural review (suggestions only)

- **A-1. The batch is not a transaction, and there is a house precedent for making it one.**
  `updateParams` issues one `PATCH` per changed row and stops at the first failure, so a three-row group
  can end half-written. The screen handles that honestly (above), but the repo already owns the stronger
  pattern: `replace_customer_contacts(p_customer_id, p_contacts jsonb)` and
  `apply_scope_change(p_project_id, p_lines jsonb, p_reason)` are atomic multi-row DEFINER RPCs
  (both confirmed live in the advisor listing). A `save_params(p_changes jsonb)` in the same shape would
  make the partial state unreachable rather than merely well-handled. **Cost:** one migration + one api
  function + tests; the UI contract (`{ok, written}`) survives unchanged. Not needed for merge.
- **A-2.** `paramsRegistry.js` at 653 lines is one flat array of 43 entries plus the rules. Readable today;
  worth splitting by group only if the count grows past ~60.
- **A-3.** The `paneComponents` injection point (`ParamsTab.jsx:53`) is a clean seam and is the reason
  `MySettingsPage` could compose the owner variant without forking `ParamsTab`. Keep it.

### §5 — QA coverage matrix (as-run)

| Type | As-run | Evidence |
|---|---|---|
| Unit | ✅ | `npm run gate` this session: **83 files / 2142 tests, 0 failures** (baseline at module open: 67 / 1838) |
| Integration | ✅ | 21 impersonated RLS assertions this session, rolled back, positive control first — all 21 as designed |
| E2E | ✅ | `npm run test:e2e` this session (see run log) + `npm run smoke` by name + axe on `/system/params` ×3 states and `/my-settings` as FINANCE |
| Regression | ✅ | the full `gate` + full `test:e2e` include every pre-existing suite; six constants and the hardcoded `3` grep to **0** |
| UAT | ✅ | 5 live acceptance journeys at 5.1 (incl. the forced-403 failure path **on the first row**) + Ishay's own 🎨 approval `03/09 01:3X`. 🔴 **The second-row partial-failure case remains unit-tested only** — see ⑥3② above; do NOT read this row as covering it. *(Corrected 03/09 03:2X: this cell first credited "this session's live partial-failure journey", which had not been run — a planned step written as a done one. Caught by the peer build session, not by me.)* |
| Security/Pen | ✅ | 4 policies on `params` (one per command) · zero policy-less table introduced · RPC ACL authenticated-only · `search_path` on all three functions · advisors triaged · §2c agent scan |
| Performance | N/A | 43 rows, no pagination question |
| Usability | ⚠️ partial | 3.0 mockup approved · 3.7 🎨 gate approved · fresh-context UX review ran and found 2 real blockers (fixed) — **7 items deliberately left for Ishay's ruling** |
| Compatibility | ⚠️ partial | Chromium only (house rule); **375 px is unusable app-wide** because `Sidebar.jsx` has no breakpoint — pre-existing, target M12 |

### §4 — E2E and smoke, run this session BY NAME

- **`npm run smoke` — exit 0, 1/1 passed, 50.2 s.** "✅ עשן: כל המסכים הראשיים עלו עם הנתונים האמיתיים."
- **`npm run test:e2e` — exit 1. 165 passed · 1 FAILED · 6 skipped, 13.8 min.**

**F-16 — the one E2E failure, and what I could and could not establish.**
`e2e/projects.spec.js:336` — *"🔗 הקישור מלשונית 'צוות דיילות' נוחת על השיבוץ של אותו פרויקט"* (module 6,
projects manager). Signature: `expect(getByRole('heading', {name: 'שיבוץ חכם — כנס שנתי'})).toBeVisible()`
⇒ **element(s) not found** after 30 s — the heading was *absent*, not *wrong*.
- **Re-run in isolation this session: PASSES, 6.6 s, exit 0.** So it is not a deterministic regression.
- **Interference ruled out by measurement:** `playwright.config.js` sets `workers: 1`,
  `fullyParallel: false`, `retries: 0` — the suite is strictly sequential, so no other spec was running.
- **Mechanism that fits the signature, read this session:** `SmartMatchPage.jsx:426-434` returns *only* an
  error card when `getSmartMatchData` throws — the `<h1>שיבוץ חכם — …` at `:453` never renders. So any
  single throw in that load produces exactly this failure. 🔑 **And m9 widened that throw surface on
  purpose:** step 2.3 routed `getSmartMatchData`'s inline params query through the fail-loud
  `getParamValues`. That is the *intended* trade (`SmartMatchPage.jsx:99-102` cites `screens-approved`
  מסך 2 §④ — a blocked read must never look like "no candidates"), and the screen offers `נסי שוב`.
- 🔴 **My own error, stated: I destroyed the evidence.** Playwright wipes `test-results/` at the start of
  each run, and I re-ran the single test before reading the failed run's `error-context.md` and screenshot.
  Those would have said whether the error card was on screen. They are gone.
- ✅ **ANSWERED, with evidence rather than a shrug.** On the post-fix-round tree (`325c58a`):
  **`npm run test:e2e` exit 0 — 166 passed · 0 failed · 6 skipped · 12.4 min**, and
  **`projects.spec.js:336` PASSED in its full-suite position (5.2 s)**. Together with the isolated re-run
  that also passed, that is **two passes to one failure at the same position**, plus a traced mechanism
  that fits the signature exactly. ⇒ recorded as a **flake**, not a regression — and recorded as *measured*,
  not assumed. `npm run smoke` exit 0, 1/1, 58 s.
  ⚠️ **The residual worth keeping:** m9 widened what makes `SmartMatchPage` fail closed (its params read
  is now the loud one), so a single transient throw blanks that screen down to its error card. That is the
  intended trade — loud beats silent, and the card offers `נסי שוב` — but it does make the suite more
  sensitive to a transient network error there than it was before this module.
- *(History:)* Second full `npm run test:e2e` launched to answer determinism. **Killed at 83/172** —
  the build session edited `quotes.js` + `QuotesPage.jsx` inside that run's window and then reverted
  (`git checkout --`, tree re-measured clean at `b9dbcf7`), so the run's validity was compromised. The
  authoritative run happens on the post-fix tree instead. **The determinism question is therefore still
  open and the final run answers it** — if `projects.spec.js:336` fails again it is deterministic; if it
  passes, that is two passes to one failure and the flake reading stands.

---

## 🤝 Two-session coordination (03/09/2026 03:0X–03:3X) — recorded because the verdict depends on it

The session that BUILT module 9 is alive and messaged this audit. Ishay had asked it (his words, relayed
to me — **I did not receive them**): *"באמת ממצאים או שהוא מחרטט? רוצה לדון איתו?"* and then
*"אפשר חד פעמי שאקום בבוקר ואהיה רגוע שיסדרתם הכל והכל מוזג? בלי לוותר על איכות העבודה"*.

**Boundaries I held, and why:**
- 🔴 **I do not sign the DoD typed echo and my verdict is not a substitute for it.** It is defined as
  Ishay's own keystrokes and is one of only two typed-echo gates in the project. A peer's relay of his
  words is not his approval to me. The build session accepted this and will record in its own report that
  the echo was **not** obtained, why, and that it is a second one-night exception rather than a new normal.
- 🔴 **This audit does not merge, push, or open a PR** — module-close forbids it outright, independent of
  anyone's authorization. If the build session merges, that is its record.
- ✅ **Agreed and on the record between the two sessions: a NO verdict means nothing merges.**
- **Rule 16 honoured by sequencing, not by trust:** the tree was handed over explicitly at 03:3X; docs
  (this file, `module-9.md`, `STATUS.md`, the journal, `db_roadmap`, §7 annotations) stay with the auditor,
  code stays with the builder, and neither touches the other's set.

**Two corrections the peer made to MY work — both checked, one upheld, one refuted:**
- ✅ **Upheld:** §5's UAT cell credited a live partial-failure journey I had not run. My error, fixed above.
- ❌ **Refuted with a re-measurement:** it reported 20-of-30 uncapped; the real figure is **23 of 30**
  (brace-matched per-entry parse). Its regex scanned a fixed 500-char window after each `name:` and read
  into neighbouring entries and into `KIND_RULES`. It re-measured and withdrew.

**One correction I made that the peer refuted, and I withdrew:** I had F-6 as `דחה` on the grounds that
`ימי_אזהרה_קדם_אירוע` is equally uncovered and predates m9, so patching only m9's param makes the banner
*more* arbitrary. The peer's counter is better and I took it: a missing `ימי_אזהרה_קדם_אירוע` makes the
"אירועים קרובים" count read **0**, and a silent failure that renders as **good news** is the worst shape
there is — that is invisible-and-consequential by my own stated rule. ⇒ **fix all four params, close the
class**, disclosed as deliberate scope growth into m3.

### §5b — cluster before routing

**16 raw findings ⇒ 6 root causes.**
- **C1 = F-6 + F-7** — *a constant m9 moved into `params` reached a screen through a loader that is not
  the loud one, and no user-visible signal was wired for its absence.* Two sites (quotes, customers); the
  quotes site turns out to be a whole class of four params. ONE fix, two files.
- **C2 = F-3 + F-4 + the RPC half of F-5** — *numeric params validate a floor and no ceiling, and the
  DEFINER RPC inherits it.* One defect, three surfaces (registry · RPC · declared limitation).
- **C3 = F-1 + F-5b + F-8 + F-15** — *recorded statements that no longer match the built code* (future
  tense in the gotchas file · §4.5(3) narrower than the code · `TemplateEditor` hiding vs §2.8's "never
  hidden" · acceptance line (7) predating R-2). Documentation reconciliation, not behaviour.
- **C4 = the seven recorded UX items + F-13** — *product and design decisions deliberately left open.*
  Ishay's, all of them.
- **C5 = G-1 + G-2 + F-14** — *history that became unanswerable when constants became editable rows*,
  plus the one declared-but-unmeasured surface (constants inside DB function bodies). Target מ11/מ12.
- **C6 = F-2 + F-9 + F-10 + F-11 + F-16** — *independent minors*; only F-9 is worth doing now.

`אשכול: 16 ממצאים ⇒ 6 סיבות-שורש.`

### §7 — the reverse `🚧 מ9` sweep, all four surfaces (measured 03/09/2026 03:1X)

**K = 50 tokens.** `PROJECT_MASTER §6` **7** · `docs/micro_guides/**` (excluding this file) **34** ·
`src/**` comments **9** · `docs/*design_notes*` **0** (no such file exists in the repo).
Most of the 34 are `module-9.md` describing its own work; the sweep's real question is which tokens still
**advertise a debt m9 has now paid**. Classified one by one:

**Correctly open (1):** `PROJECT_MASTER §6` — `🚧 מ9 · 🚧 מ10 — העדפות התראות`, marked "חצי שולם"; the
table + RLS + toggles are live, **sending** stays m10's. `npm run check:context` independently reports
exactly this one open m9 debt and nothing else.

**Already struck with a measurement (4):** the two `~~🚧 מ9 ← מ4~~` lines (min-wage report · Smart Match
params screen), `~~🚧 מ9 ← מ4/מ6~~` (reliability company average), and `~~🚧 מ8 · 🚧 מ9~~` (ה30).

**Still advertising a paid debt — need a dated strike at persistence (7):**
1. `docs/micro_guides/module-4.md:82` — "Who is below minimum wage report | ❌ | 🚧 מ9" — delivered at m9 step 3.6.
2. `docs/micro_guides/module-4.md:83` — "Smart Match params editing screen | ❌ rows seeded, no UI | 🚧 מ9" — delivered at steps 3.1+3.3.
3. `docs/micro_guides/module-6.md:89` — the reliability row. **Partial:** m9 shipped the *switch*; flipping `מרכיב_אמינות_פעיל` to `true` stays Ishay's product call (measured live: still `false`, and `משקולת_אמינות` = `0.35`).
4. `docs/db_roadmap.md:1619` — *"**M9** owns the screen that edits all 14 rows — **until it exists**, changing any of them means a hand-edit in the Table Editor."* **That sentence is now false.**
5. `src/lib/smartMatch.js:286` — *"המשקל שלו כבוי **עד שמ9 ידליק** את `מרכיב_אמינות_פעיל`"* — future tense; the screen exists.
6. `src/modules/04_hostesses/SmartMatchPage.jsx:506` — *"**והדלקתו היא של מ9**"* — same, and this one is *displayed inside a user-facing banner comment block*.
7. `docs/specs/module_04_hostesses/processes-approved.md:502` — the `מ4 → מ9 ④` forward contract, now fulfilled ⇒ gets the §2b dated `🔴 גובר` annotation **at the line**, not a top-of-file banner.

**Correctly descriptive, no action (3 sites):** `docs/schema.sql:2074` (cites the debt as the RPC's
*origin* — reads as history) · `docs/PROJECT_MASTER_sec7.md:247` (a dated derivation record of how the
debt was born) · `docs/mockups/settings-screen/01_params_tab_proposal.html:485` (the v1 mockup, superseded
by v2 and kept as history).

⇒ `🚧 מ9 swept — 50 tokens found across §6 · micro-guides · src comments · design notes (0 files);
1 justified as still open (m10 delivery), 4 already struck, 7 to strike with today's date, 3 descriptive.`

### Live parameter values re-read at 03:1X (proof journey ① restored cleanly)

`אחוז_מעמ` = **18** ✅ (journey ① set 17 and restored) · `שכר_מינימום_שעתי` = **35** ·
`סף_שביעות_רצון` = **3** · `שעות_תוקף_זימון` = **48** · `מרכיב_אמינות_פעיל` = **false** (by design —
flipping it is Ishay's) · `משקולת_אמינות` = **0.35**.
Live active hostess rates, for the F-4 ceiling anchor: **min 38 · avg 44.27 · max 52 ₪/h, n=26.**

### E2E `settings.spec.js` — what it actually proves (read, not assumed)

10 tests: six groups + search by friendly label · a value change leaves as a PATCH with the right name and
value and the screen confirms `ההגדרות נשמרו` · an invalid value blocks the save, shows the message, and
**does not clear a sibling field** · the template editor blocks on a deleted required variable and the chip
releases it · the CEO has no "ההגדרות שלי" menu item · the profile toggle round-trip · finance sees only
her rows and not the Smart Match weights · **the RLS wall proven at the REST layer, not the screen** ·
recruitment's mirror image · logistics blocked on the tab and admitted through the second door.
🔑 **The wall test is well built:** it takes the finance manager's own JWT out of `sessionStorage`, reads
the weight she does not own, PATCHes it back **with the identical value** (so even a broken RLS could not
move data), and re-reads — asserting 0 rows written. It also asserts the row was readable first, so
"0 rows written" cannot be confused with "no such row". That satisfies §4.2's *"מה ייחשב עובד"*.

### Persistence plan (written before the verdict, so an interrupted session can resume from here)

0. §6 debt registration re-check — `grep '🚧 מ9'`: one live line (prefs/מ10), correct.
0b. §7 ripple — verify §7.70 · §7.21 · §7.83 · §7.84 · §7.64 · §7.66 · §7.90 · §7.35 sub-notes exist and
    are current; `grep '§7.N'` + `'מראת §7.N'` across `docs/guides/**` + `docs/micro_guides/**`.
0c. `db_roadmap` — rows Done; **plus the stale sentence at `:1619`** (see the sweep list).
1. `module-9.md` — tick DoD §8, fill the §5 QA "as-run" column, append §7 items to §10, set the status
   header, and mark steps 3.6 · 4.1 · 4.2 · 4.3 (all still ◐) to their real state. ⚠️ The §1 header still
   says "Active step 3.7" and "Last updated 02/09 21:2X" — **stale by five hours**; fix.
2. `CLAUDE_CODE_LOG.md` — session entry naming `artifact: published/skipped+why` and `quiz: asked/skipped+why`.
2b. **LOG compaction — escape hatch, with the measured number.** Narrative measured this session:
    **1,459 lines** against the ≤150 the file sets for itself (`awk '/^## Session Log/{f=1;next}
    /^## Reference/{f=0} f' docs/CLAUDE_CODE_LOG.md | wc -l`). The existing §6 debt line (`PROJECT_MASTER.md:715`)
    records 976 measured at m8's close on 01/09 — it has grown by **483 lines in two days**. Harvesting
    ~1,300 lines with the working-lessons category hunt does not fit beside a full audit in one window
    ⇒ refresh that line with 1,459 and recommend a dedicated compaction session. **Not silence.**
2c. `docs/guides/00_roadmap.md` §3 — m9 planned **18/09**, actual **03/09** ⇒ **−15 days**. Per §3's buffer
    rule the gain goes to the pre-conference buffer, so the remaining rows shift EARLIER by the same
    difference rather than absorbing it (7: 20/09→05/09 · 11: 24/09→09/09 · 10: 26/09→11/09 ·
    12: 29/09→14/09), leaving ~16 days of buffer before the 01/10 conference. **Present as overridable.**
3. `STATUS.md` — module-9 row → "ממתין ל-PR/merge"; refresh "עודכן לאחרונה". Note the header line still
    says "נותרו מסעי-הקבלה החיים" — stale since 02:3X.
4. **Routine growth-triggers (`docs/claude_routines.md` §4): ONE trigger fired.** m9 added
    `e2e/settings.spec.js`, which is `regin-e2e-check`'s trigger — **but that row's own note says its STEPs
    are written generically ("list e2e/*.spec.js", "don't hardcode coverage") ⇒ no edit required.** The
    other three did not fire: no `.claude/hooks/**` change and no `package.json` change in the diff
    (measured), and no key doc added or removed beyond the module's own guide.
5. **Plans that die with this module: none.** `docs/plans/` holds `attic`, `handoff-2026-08-07.md`,
    `ideas-backlog.md`, `synthetic-monitoring-skill-brief.md`; `docs/claude mega plans/` holds
    `regin_workflow_short_updated.md`. None is scoped to m9.
6. Archive this findings file to `docs/archive/` — **on a YES verdict only.**
7. The dated `🔴 גובר` annotations — re-derive with `grep` at execution time; the known one is
    `docs/specs/module_04_hostesses/processes-approved.md:502`, plus `docs/guides/modules/module_09_settings.md`
    §⑦'s acceptance line "משתמש שאינו מנכ"ל לא רואה את המסך כלל", now superseded by R-2/Q-1.

---

## Fix round (§6b) — scope, and how it grew

**Ishay ruled the scope himself at 03/09 ~03:2X**, which is what makes this round legitimate rather than
two sessions widening it between them: *"לא לחסוך בעבודה בבקשה פעם אחת עושים את העבודה כמו שצריך"* and,
on the product items I had deferred, *"באמת אתם צריכים אותי כדי להחליט? אשמח שתחסכו ממני עבודה… רק שלא
יעבור בשקט שאחד מכם יכתוב לי דוח מסודר בבוקר"*. ⇒ the UX items are delegated **with disclosure as the
condition**, not waived. Every one below is therefore decided-with-anchor, dated, and overridable.

**Built (builder session, files as declared):** F-6 (all four quote-screen params into the banner, not
just m9's) · F-7 (loud load + the false comment corrected) · F-9 · F-1 (+ the F-8 latent trap noted in the
gotchas file) · F-4 (ceilings) · **UX-4** (the sum sentence: a claim becomes a rule) · **UX-6**
(search on `/my-settings`) · **UX-3** (a way forward from the blocked page) · migration **E** (written).

**Deliberately still open, each with an engineering reason, not fatigue:**
- **UX-1, the unsaved-changes guard.** `App.jsx:55` mounts `<BrowserRouter>`, not a data router, so
  react-router 7's `useBlocker` does not exist here — a real in-app guard means migrating every route.
  `beforeunload` alone catches tab-close and **not** the sidebar click that actually loses the work, so it
  would be theatre. Not on the night before a merge.
- **UX-7, the 1024 px hint column.** The 🎨 gate was approved at 1280 px, which is where Ishay works.
- **UX-2, card padding.** Three different card recipes already exist across the four tabs
  (`p-6 rounded-2xl shadow-md` ×2 · `p-5 rounded-xl border` ×1 · m9's own); choosing among them is a look
  decision and he catches those himself — he caught two tonight.
- **UX-5, two save models.** `לא-נדרש`: auto-save on one toggle is the world convention, explicit commit
  on a 13-field form is the right affordance. Recorded so no future session "fixes" it.

### Migration E — reviewed by me before recommending it, not taken on the builder's word

`supabase/migrations/20260903032212_module9_e_min_wage_rpc_threshold_ceiling.sql`, **written and NOT applied**.
I pulled the live body with `pg_get_functiondef` this session and compared line by line: **the file is
migration D's live body verbatim with exactly one change** — `if p_threshold < 0` becomes
`if p_threshold < 0 or p_threshold > 1000`, with the message updated. Gate (ownership, then
`assert_module_permission`), `status = 'active'`, ordering, signature, `stable`, `security definer`,
`set search_path to ''` and the revoke/grant pair are byte-identical. The header's claim that the body was
pulled from the database rather than written from memory is **true**.
Ceiling rationale, checkable: **1000 ₪/h is ~19× the highest live rate** (52; n=26, avg 44.27), so a
legitimate preview can never be refused, while `999999` is. `NULL` behaviour is unchanged.
Reversibility: full — `create or replace` with D's body restores it.
✅ **APPLIED `03/09/2026 03:3X` via MCP — F-3 is CLOSED, not open at merge.**
🔑 **Gate note, so nobody reads it as precedent:** the typed echo was **waived in advance by Ishay, in his
own words to this session** — *"מאשר למזג לייצור בלי הקלדה כנל לגבי המיגרציות רק תהיו מסונכרנים בינכם"*
(03/09/2026 ~03:3X). ⚠️ **This is the THIRD waiver of the night and the count is recorded on purpose:**
A/B/C were waived in advance on 02/09, **D was typed in full**, and E + the DoD sign-off are waived here.
The gate itself (`supabase/migrations/CLAUDE.md`) is unchanged.

**Post-apply proof, impersonated, this session — 10 of 10 as designed:**
- finance `(999999)` ⇒ `P0001` *"רף לתצוגה-מקדימה חייב להיות בין 0 ל-1000"* — **the identical call that
  returned all 26 hostesses at 02:5X now raises.**
- `(1001)` ⇒ `P0001` · `(-1)` ⇒ `P0001` · **`(1000)` boundary ⇒ 26 rows, allowed** (ceiling is inclusive).
- `(40)` ⇒ **2** · `NULL` ⇒ **0** — unchanged, so real behaviour did not move.
- logistics ⇒ `42501` — the gate still gates.
- **1** overload · ACL `postgres | service_role | authenticated`, no `anon` · `search_path=""`.

🔑 **Both halves were needed and neither alone was enough:** the registry `max: 200` closes the screen
path; the RPC ceiling closes the reachable one, because PostgREST exposes the function to any signed-in
caller and a direct call bypasses every client guard.

⚠️ **F-3 residual, measured and stated rather than glossed (scan finding S-1).** The ceiling of **1000**
does not achieve what migration E's own header claims. The highest live rate is **52**, so **any value
from 53 to 1000 still returns all 26 active hostesses** — the ceiling refuses absurd input, it does not
prevent a full read, and the header's *"not biasable to a full dump"* oversells it. The residual exposure
is only to a caller already entitled to the list (the gate is untouched and proven), so this is **not a
blocker**. 🚫 **Deliberately not fixed tonight** — a second migration at 04:00 to move a number is worse
than a recorded limitation. **Debt:** align the RPC ceiling with the registry `max` (200) so the function
can never be asked for more than the form can save.

---

## §6b re-scan of the FIX-ROUND DIFF (`b9dbcf7..f51fe6e`) — the rule earned its keep

Both lenses re-run over the fix diff alone, because the code written last, at the end of a close, is the
only code in the module no scanner had ever seen. **3 findings; I verified the two serious ones myself.**

**R-1 — CONFIRMED. The F-7 fix made the customers screen WORSE, and F-7 is a fix I ruled into the round.**
`CustomersPage.jsx:218-235`: the call sits in a `Promise.all` whose `catch` is **bare** — no error bound,
no flag, no banner, no `console.error`. The file carries exactly two failure flags (`loadError` for the
list, `revenueLoadFailed` for the revenue column with its banner at `:542`); **this block has neither.**
*Measured widening:* before F-7 a missing param resolved silently, `Promise.all` still resolved, and
`setProjectsByCustomer(...)` ran — only the `טעון בירור` badge broke. **After F-7 the throw rejects the
whole `Promise.all`**, so `projectsByCustomer` becomes `{}` and the dormant filter **and** the
satisfaction/stars column empty out too. ⇒ the API layer got honest, the screen got no louder, and the
blast radius grew. The comment above the block is now false as well — it still promises the failure
*"touches only the filter"*.
🔑 **This is the finding of the night about our own process:** a fix ruled in by the audit, written by the
builder, passing a green gate, that made the defect bigger. Only the mandated re-scan of the fix diff
caught it.

**R-2 — CONFIRMED. UX-6's new search can hide the reason a save is blocked.**
`MySettingsPage.jsx:134-138` computes `hasErrors` over **all** `form.dirtyNames` while the rows render
filtered by `matchesParamSearch`. Type an invalid value, then search for something else: the save button
is grey, the counter reads "שינית 1 מתוך 38", and the red message is off-screen with nothing pointing at
it. `ParamsTab.jsx:158-166` already solves exactly this by scoping both gate and write to the active group.
Also introduced by an item I ruled in (UX-6).

**S-1** — recorded above under F-3's residual.

**Verified clean by the scan and worth recording** (it re-checked the things most likely to break silently):
the return SHAPE of `getCustomerScreenParams` is unchanged and both call sites still match · `getParamValues`
genuinely validates the returned SET · the four pre-existing banner tests were **extended, not weakened**,
and the new effect sentences are wired to the correct params (no crossed pair) · the validation message
prints the same `max` it enforces, from one source · `data-testid="access-denied"` and its Hebrew string
are **context lines in the diff, not changes**, and the new "חזרה למסך הבית" text does not collide with
any of the six E2E consumers' assertions · migration E's grants are byte-identical to D's — no widening.

### 🛑 The bound (§6b's floor, applied)

This is the **second** harmful finding after the regression run. §6b says stop and let Ishay rule; he is
asleep and has delegated, so the rule collapses to *decide, bound it, disclose*. **The bound: one more
batch of six, one full regression run, and no further fixes tonight.** If the re-scan of THAT batch finds
another harmful item it is **not fixed** — it goes in the report as open, and if it is genuinely harmful
the verdict becomes **NO** and nothing merges. An honest NO beats a fourth round at 04:00.


---

## 👑 FINAL VERDICT — [YES], mergeable. Code identity `c305322`.

`gate` exit 0 (**83 files / 2165 tests**) · `test:e2e` exit 0 (**166 passed / 6 skipped / 0 failed**) ·
`smoke` exit 0 (**1/1**) — all three run by name on the verdict commit, 03/09/2026 04:49.

**Two sentences.** Module 9 meets its DoD on every figure re-measured live rather than read — 43 params ·
6 types · 4 policies one-per-command · 38 owned · **21/21** impersonated RLS assertions — and three fix
rounds closed a money defect, two silent-failure paths, a DEFINER-RPC hole and the two regressions the
rounds themselves introduced, each verified by the session that did not write it. It merges with **two
gates waived by Ishay in his own words, five items recorded-not-fixed and 22 uncapped numeric params by
decision** — none of which produces a wrong result with the data as it ships.

🔴 **The typed-echo DoD sign-off was NOT obtained.** Waived in advance by Ishay, verbatim:
*"מאשר למזג לייצור בלי הקלדה כנ"ל לגבי המיגרציות רק תהיו מסונכרנים בינכם"*. **The audit did not sign it
and did not merge.** Third waiver of the night — A/B/C in advance, **D typed in full**, E + the DoD here.

### The one pattern worth more than any single finding

**Three times tonight a fix corrected a claim and left its twin thirty lines away** — `customers.js`'s
comment naming a shout that did not exist on its path · R-2's comment claiming `ParamsTab` scoped the gate
when it scoped only the write · the m7 guide's prose marking §7.9 closed while its parameter block still
handed §7.9 to the next session. **Two were the builder's, one was the auditor's, and not one was found by
re-reading the sentence.** Every one was found by the *other* session re-deriving the claim from the code.
That is not a lesson about carelessness; it is what peer review is actually for.

**And the second pattern, measured:** the `§6b` rule that re-scans the fix round's own diff caught **two
regressions the fix round introduced** — including one where a fix the audit ruled in made the original
defect *bigger*. The code written last, under time pressure, is the only code no scanner has seen.
