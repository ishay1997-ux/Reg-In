# Module 9 — הגדרות מערכת · Build Micro-Guide

> Written for a future Claude session with zero memory of the blueprint conversation. English
> throughout; Hebrew only as data (DB values, UI strings, §7 quotes). **This guide IS the approved
> plan** — build sessions execute it directly (iron rule 2: no extra planning round).
>
> 🔴 **This module has NO approved spec folder** — ruled by Ishay 02/09/2026 (R-1: "מיקרו-גייד"),
> superseding the 08/08/2026 STATUS task line that asked for a Discovery per module. **This guide is
> the only plan.** Product truth = the step guide `docs/guides/modules/module_09_settings.md`
> (its ①א–①ז carry Ishay's dated rulings of 28/08 and 02/09), the frozen spec C5 §5.6.16 / C6 §2.4.9
> where the guide is silent, and the Decisions Ledger below (rulings R-1…R-4 and Q-1…Q-4).
>
> ✅ Renamed from `module-9.draft.md` to `module-9.md` at Ishay's approval (02/09/2026 20:5X) — the
> Stop hook's iron-rule-15 enforcement for module 9 is live from here.

## 1. 🟢 Live Status Header

| | |
|---|---|
| **Module** | 9 — הגדרות מערכת (System settings: the `params` tab, template editor, owner-scoped editing, notification preferences) |
| **Branch** | `ishay/module-9-settings` — cut `02/09/2026 ≈19:05` from fresh `origin/dev` (`f785d71`). Discriminator at cut: `git log origin/dev..HEAD` ⇒ **empty** (fresh, not merged-and-dead — iron rule 10's caveat). |
| **Owner** | Ishay (sole developer) |
| **Status** | 🔨 **BUILD OPEN — Ishay's delegation `02/09/2026 21:1X`** (*"אני מאציל אותך להתחיל ולסיים את מודול 9… העזר בסוכנים… תפתור בעצמך את הקונפליקטים. אבל שום דבר לא בשקט"*; module-close excluded — fresh session). Orchestrator = this session (Fable 5.1); builders = Opus/Sonnet agents on disjoint files; every 🗣️ brief is still POSTED, but under the delegation it does not block unless Ishay stops it. **The typed-echo gate is NOT delegated** (migrations/CLAUDE.md — the name must be typed). |
| **Last updated** | `02/09/2026 21:2X` *(system clock — 1.0 measured, A/B/C files written, Phase-2 builders launched)* |
| **Active step** | **3.7 🎨 gate (screenshots in flight, Opus E2E builder) + 4.2 E2E (same builder)** · Phases 1–3 code complete and committed (`65b6ed8` · `ed743d1`, pushed) · 2.6 gate ✅ · 4.1 ◐ (STATUS + LOG owed at session end) · next: 4.3 regression · 4.4 · 5.1 live journeys · 5.2 = fresh session |
| **Deadline** | m9 merge to `dev` **18/09/2026** (`00_roadmap` §3; ~2 days allotted; "נדרש למ10") · conference **01/10** · end **20/10**. Days saved go to the pre-conference buffer, never to the next module (the buffer rule). |

**Legend:** 🔻 stop-point · 🤖 Claude verifies alone · 👤 human (Ishay) gate · 🚧 cross-module debt (§6) · ⏳ deferred decision · 🕓 freshness stamp · 🔗 tagged §7 mirror · 🧩 handoff prompt · 🧊 frozen file · 🔮 future checkpoint · 🗡️ DB Design Challenge
**Step status set:** ⬜ pending · 🔨 in progress · ✅ done · ⏸️ deferred (with target module) · ❌ blocked (with reason)

| Step | Title | Status |
|---|---|:--:|
| **1.0** | 🔻👤 Phase-1 door — branch · ledger sweep · live re-measurement · baseline · Ishay checkpoint | ✅ `02/09 21:2X` — every measurement = the draft: `params` 39 · types 5 · policies 2 · roles byte-exact · T12 `qual` names 'כספים' · `origin/main` still `73c61d5` ⇒ T9 stands (both rows clean; only the `shiftEmails.js:254` comment) · §9א: no pending removals (C2/N1b/N2 all struck) · E2E pairs 5, `STAFF`=logistics (`customers.spec.js:10`) · no other OPEN guide · MCP live (PG 17.6) · **unit baseline 67 files / 1838 tests** · attendance 1/27 · active hostesses 26 · min-wage 35 · owner-map dry count (read-only SQL) = 5 CEO / 8 finance / 4 projects / 25 recruit / 1 logistics = 43, owned 38. Rule 16: Ishay delegated at 21:1X with no other session named — `הנחתי` sole writer. Sequential-vs-agents: his delegation text picks agents |
| **1.1** | Migration A — `params` owner column + sixth `param_type` + 6 new rows + owner map (loud-fail guard) + deletion(s) + policy rewrite | ✅ `02/09 21:2X` APPLIED (`20260902211549_…`, DB version `20260902182441`). **Gate: typed echo WAIVED ONCE by Ishay in advance** (*"תחיל חד פעמי עם אישור מראש. הנה אני מאשר לך להכיל את כולם"*, after the three explanations) — recorded in `db_roadmap` §10ב; not a precedent. Verified: 43 rows · 6 types · 4 policies · 38 owned · 0 doomed left · impersonation matrix exactly as planned (fin vat=1/weight=0 · recruit weight=1/vat=0 · CEO 1 · logistics own=1) |
| **1.2** | Migration B — `notification_preferences` table + RLS | ✅ `02/09 21:2X` APPLIED (`20260902211550_…`, version `20260902182448`). Verified: RLS on · 3 policies · FK `a/c` · trigger fn in `extensions` |
| **1.3** | Migration C — `record_feedback`/`archive_project` read the threshold from `params` · `list_hostesses_below_min_wage()` RPC | ✅ `02/09 21:2X` APPLIED (`20260902211551_…`, version `20260902182524`; bodies pulled live via `pg_get_functiondef` 21:13). Verified: both bodies contain `סף_שביעות_רצון`, no `< 3` · `proacl` = authenticated only · RPC fin@35 ⇒ 0, @40 ⇒ 2 (מירב אטיאס@38, ליאת פרץ@39), logistics ⇒ `42501` · threshold contract proven in a rolled-back block (row absent ⇒ `no_response` ok / scoring ⇒ Hebrew `P0001` naming the param / threshold 4 blocks score 3) |
| **1.4** | 🔻👤 Phase-1 gate — advisors · health battery · `schema.sql` regen ⚠️ shared-surface · `db_roadmap` §10 · commit | 🔨 `02/09 21:5X` — advisors: zero new unexplained (see §10ב) · **health battery `נבדקו 13 · נכשלו 0`** (Sonnet, read-only; check 10 N/A — no column dropped; new baselines 67·35·11·27 / 29 tables / 20 triggers / 45 functions written to `db_health_checks.md`) · `db_roadmap` §10ב + A-24 + `params` row + §7.64 lane ✅ · `products_and_params.md` §16–20 ✅ · `shiftEmails.js` tombstone re-pointed ✅ · `schema.sql` re-synced by an Opus builder (documented/live name-for-name: 29 tables · 62 policies · 45 functions · 28 triggers; it also fixed a stale "43 פונקציות" count that was 44) · **committed `65b6ed8`** (explicit pathspecs, 9 files) ✅ |
| **2.0** | Phase-2 door — ledger sweep; **Q-3 (validation kinds) must be ruled before 2.1** | ✅ Q-3 ruled at approval (02/09 ≈20:40); A-6/A-7 briefs folded into the 3.0 mockup page per Ishay's standing preference (*"אני יאשר בסוף את המסכים פעם אחת אחרי שאראה את כולם"*, 27/08) |
| **2.1** | `src/lib/paramsRegistry.js` — label/kind/unit/validation/affects registry + tests · **🗣️ labels brief** | ✅ `02/09 21:5X` (Sonnet builder) — 43 entries, 69 tests (both-directions fixture dated 21:20); two hints corrected by the orchestrator (`משקולת_אמינות` = attendance, not "דירוגי עבר"; `סף_שביעות_רצון` = per-score reason gate + the customers "טעון בירור" filter). `הנחתי` (builder): group order pricing→control→shift_invites→templates→smart_match→technical · `סף_שביעות_רצון` int 1–5 unit ★ · kind `templates` never fails `validateParamValue` (the editor's verdict is the gate). **Labels brief = the 3.0 mockup page** |
| **2.2** | `src/lib/emailTemplates.js` — the template⇐placeholders contract (required/optional) + consistency tests | ✅ `02/09 21:5X` (same builder) — 11 sets byte-exact from §3.7, 31 tests incl. the live `buildShiftInvitePayload` consumption proof; `הנחתי`: when both a required token is missing AND an unknown token exists, the required-missing sentence is reported first |
| **2.3** | ⚠️ shared-surface — the six constants become param readers (per-constant ripple table in §6) + `src/api/params.js` | ✅ `02/09 22:4X` (Opus builder, ~61 min, 29 files) — six-constant grep ⇒ **0** · `< 3`/`ל-3` grep ⇒ **0** · full unit suite at that moment **73 files / 2007 tests** green · `vite build` exit 0. **As-built beyond the table (all reported, none silent):** `countAssignmentStates`/`overviewRow` also take thresholds (transitive callers; `overviewRow` takes an OBJECT, not three adjacent numbers) · **`04_hostesses/OverviewTab.jsx` was an unlisted consumer with no loader** ⇒ `getParamValues` call · `resendExpiredInvites` reads the value itself (api layer, loud on missing) · m8's five `< 3` sites route through `needsSatisfactionAttention` (one rule) · `feedbackReasonGate(threshold)` builder · `matchesCustomerFilters` third argument. **`הנחתי`:** pure functions return the "unknown" answer on a missing threshold (`null`/`false`) — the loud failure lives in `getParamValues` (anchors: `deriveQuoteExpiry`, `CustomersPage`'s NaN comment, `minWageError`) · values travel as raw text, parsed by `optionalNumber` · whitespace-only value = missing. **Follow-up ordered 22:5X, done 23:1X:** the three hard-coded strings interpolated (+ a fourth the builder found: `AmberLegend`) · `getHostessScreenParams` AND `getSmartMatchData`'s inline query now go through `getParamValues` (fail loud; the Smart Match load-error wording became the shared `שגיאה בטעינת הגדרות המערכת.` — disclosed) · new `OverviewTab.params.test.jsx` (m4's first component test) · 41 files / 1434 tests in the scoped run · the m6 `cancellationApi.js` comment that became stale was corrected by the orchestrator |
| **2.4** | ⚠️ shared-surface — `smartMatch.js`: reliability company-average fix (pays `🚧 מ9 ← מ4/מ6`) | ✅ `02/09 21:3X` (Sonnet builder) — `companyReliabilityAverage` + shared private `attendanceCounts` helper; dormant guarantee proven on the §3.2 hand anchors (`[0.67, 0.66, 0.64]` unchanged); 89/89 in the two suites; no deviations |
| **2.5** | `src/modules/09_settings/api.js` — reads · grouped updates · min-wage RPC · notification prefs · "my params" + tests | ✅ `02/09 21:4X` (Sonnet builder) — 20/20 tests; `PARAMS_ERROR_CODE.BLOCKED` for `42501`; `countAttendanceRows` ⇒ `{ total, withAttendance }` (one fetch, client count — `הנחתי`); module `CLAUDE.md` written **in Hebrew** (every `src/modules/*/CLAUDE.md` is Hebrew — as-built deviation from the builder prompt's "English", precedent wins) |
| **2.6** | 🔻👤 Phase-2 gate — full unit suite, zero regressions | ✅ `02/09 23:3X` (run once for Phases 2+3 together, after wave 2): **`npm run gate` exit 0** — lint · prettier (after fixing wrapping in two test files) · **83 files / 2094 tests** (baseline 67 / 1838 ⇒ +16 / +256, zero failures) · build · jscpd · knip · audit · bidi · context · docs-structure. `check:context` still lists the four `🚧 מ9` §6 debts — struck at 4.1 |
| **3.0** | 🔻👤 Phase-3 door — shared-component checkpoint + **the updated mockup (per-role view + the undrawn states) for final approval** (Ishay's 02/09 request) + the Q-1 duplicate-editor ruling applied | ✅ **mockup v2 approved by Ishay `02/09 22:02`** (*"הסתכלתי על המוקאפ שלו אני מאשר"*); shared-component checkpoint recorded at the Phase-3 builder launch (see §10) |
| **3.1** | S1 — `ParamsTab.jsx`: search + group list + generic value pane; route swap `params` ⚠️ shared-surface (`App.jsx`) | ✅ `02/09 22:5X` (Opus builder A, ~29 min) — shared pieces `components/{ParamRow,SaveRow,GroupList,useParamsForm}` + `ParamsTab` + route swap + **`PricingParamsCard` deleted, `pricesApi` param functions deleted (Q-1)**; 79 tests in the 9 m9/m1 files · `vite build` · `check:bidi` · `jscpd` (0 in m9) · `knip` clean. **As-built:** `useParamsForm` calls `updateParams` once per changed row (the locked save-failed line must name the row; the batch-level ownership guard still runs first) · grouping by DB `param_type`, not the registry's `group` (an unregistered row is never hidden) · skeleton testid is the shared `skeleton-table`. **Orchestrator rulings on its questions:** the two cross-field sentences (`WEIGHTS_SUM_ERROR`/`DISTANCE_ORDER_ERROR`, echoing approved text) — keep · empty-search `אין הגדרות שתואמות לחיפוש` — keep · no lead sentences for the four undrawn groups — keep absent · the Smart Match banner arrives with wave 2 (C). ⚠️ **Live red until 4.2:** `e2e/prices.spec.js:194-228` + `smoke.spec.js:138` still assert the dead `param-*` testids |
| **3.2** | S2 — `TemplateEditor.jsx`: template list · body · variable chips · required/optional gating | ✅ `02/09 22:3X` (Sonnet builder B) — 8 tests; verdict from `templateSaveVerdict` only; `onVerdict(name, verdict)` reports the blocked state upward (the parent's `SaveRow` disables on it — wired in wave 2); no Save button of its own (`הנחתי`); `set-state-in-effect` avoided by deriving the selected row at render |
| **3.3** | S3 — `SmartMatchPane.jsx`: warning · sum-1.00 bar · reliability toggle with live attendance count · distance order rule · partial-row behaviour | ✅ `02/09 23:1X` (Sonnet builder C) — 10 tests; both variants byte-exact; partial-row rule; reliability row is a standalone `Switch` block (live note replaces the static hint — as-built); **ruling: the attendance note stays uniform in both variants** (the CEO-only extra clause the mockup §2 drew is dropped — the locked pattern is the short one). C also caught a shape mismatch in `TemplateEditor` (`row.name` vs `row.param_name`) — routed to D's wiring |
| **3.4** | S4 — `MySettingsPage.jsx` at `/my-settings` + Topbar menu item "ההגדרות שלי" (owner mode of S1–S3) ⚠️ shared-surface | ✅ `02/09 23:2X` (Sonnet builder D, ~40 min) — page + Topbar item (V-7 predicate) + route + allowlist why-comment + the pane wiring (`templates`/`smart_match` real components as the default map; `onVerdict` ⇒ blocked template disables the shared `SaveRow`) + the min-wage live preview (`draftThreshold`, 400 ms debounce, note `תצוגה מקדימה — טרם נשמר`) + **the `TemplateEditor` row-shape fix (`row.name` → `row.param_name`; C's catch)**; 13 files / 115 tests in m9 + layout + routes; `vite build` · `dup` 0.99 % green. **As-built (`הנחתי`, flagged for the 🎨 gate):** a group routed through a pane component receives the group's FULL row set — search drives the sidebar counts/navigation only — because filtering inside `SmartMatchPane` collided with its partial-row rule (searching `שער_מרחק_קמ` hid the row it found). `MySettingsPage` subtitle "N הגדרות בבעלותך, ב-M קבוצות" is mockup-direction text |
| **3.5** | S5 — Profile `NotificationsSection` wired: email toggle live, SMS toggle truthful, **both** "(בקרוב)" labels gone ⚠️ shared-surface | ✅ `02/09 22:4X` (Sonnet builder E) — 5 tests · `vite build` exit 0 · `grep בקרוב` ⇒ 0 · toast via `ToastProvider` (house pattern; `הנחתי`) · stale comment rewritten (13ח) · testids `settings-notify-email/sms` are canonical — the mockup's `settings-notif-*` was aligned to the code by the orchestrator (tier-4 detail, nobody sees it) |
| **3.6** | S6 — "מי מתחת לשכר-המינימום" list beside `שכר_מינימום_שעתי` (pays `🚧 מ9 ← מ4`) | ◐ `02/09 22:5X` built by A (`BelowMinWageList.jsx`, three states, `blocked` ⇒ nothing, `refreshKey` after save) **against the SAVED threshold** — the approved mockup §4ב draws the list reacting to the TYPED value before saving, which the C-migration RPC cannot do (finance is blocked on `hostesses`, so the preview must come from the DEFINER function). **Migration D written `20260902230500_module9_d_min_wage_rpc_threshold_arg.sql`** (`p_threshold numeric default null`; the 0-arg version dropped to avoid overload ambiguity — safe, nothing deployed calls it) — **✅ APPLIED `02/09 23:1X` after Ishay's typed echo** (`module9_d_min_wage_rpc_threshold_arg`); proof (rolled back): one overload · ACL authenticated-only · finance default ⇒ 0, `(40)` ⇒ 2, `(-1)` ⇒ `P0001`, logistics ⇒ `42501`. `api.js` `listBelowMinWage(threshold)` passes `p_threshold` for a finite number (orchestrator; test added); the draft-value → preview wiring (debounced, note `תצוגה מקדימה — טרם נשמר`) is in D's wave-2 scope; `schema.sql` signature line updated |
| **3.7** | 🔻👤 Phase-3 🎨 gate — UX & functional review with Ishay | ⬜ |
| **4.1** | Doc ripples — §6 debts paid · §7.70/§7.83/§7.84/§7.21/§7.64/§7.35 · `db_roadmap` · `products_and_params.md` · the 08/08 STATUS task line · the step guide's ⑥1 pointer · delete the interview file | ◐ `02/09 23:5X` (Sonnet docs builder) — §6: three inbound `🚧 מ9` lines struck with measurements, the prefs line stays live for מ10 with "חצי שולם" · §7.70/§7.21/§7.83/§7.84/§7.66/§7.90 ↳ sub-notes appended (§7.64/§7.35 already carried the blueprint's deferrals) · step guide ⑥2 refreshed + ①ו block with the four delegated rulings (`הכרעתי, הפיך`) · `check:docs-structure` exit 0. Done earlier this session: `db_roadmap` (§10ב A–D, A-24, `params`/`users`, §7.64 lane) · `products_and_params.md` §16–20 · the tombstone comment · the interview file (blueprint) · ⑥1 pointer (blueprint) · seven closed guides' ripple records. **Still owed at session end (orchestrator): STATUS.md + CLAUDE_CODE_LOG.md** |
| **4.2** | E2E `e2e/settings.spec.js` + smoke anchor + accessibility list ⚠️ shared-surface (`e2e/**`) | ⬜ |
| **4.3** | Full regression: `gate` · `test:e2e` · `smoke` · DB health battery (13) | ⬜ |
| **4.4** | 🔻👤 Phase-4 gate | ⬜ |
| **5.1** | Live acceptance journeys (VAT in an un-saved quote form · owner edits hers · blocked template save · notification toggle round-trip) | ⬜ |
| **5.2** | 🔻👤 Closing audit — `module-close` in a FRESH session | ⬜ |

---

## 2. 📦 Context Packet for Claude

### 2.1 Purpose (≤3 lines)

Fill the fourth, still-`UnderConstruction` tab of the existing ניהול-מערכת screen: every `params`
row becomes editable without SQL, grouped by `param_type`, validated by kind, with a real editor for
the mail templates. Ownership per role (§7.70) lets each manager edit her own parameters from a
second door ("ההגדרות שלי"). Six hard-coded business constants move into `params`. A new
`notification_preferences` table makes the profile toggles real (delivery itself is m10's).

### 2.2 Capabilities delivered vs deferred

| Capability | What m9 delivers | Completed by | Tracked where |
|---|---|---|---|
| Full params tab | **43 rows** (39 + 6 new − 2 deleted, Q-2 ruled 02/09) in 6 groups, search on both the friendly label and the DB name, group panes, save-per-group with kind validation (kinds = Q-3) | ✅ complete here | this guide |
| Template editor | **11 mail-body templates** (of the 13 `templates`-typed rows: 11 bodies + `תבנית_איפוס_סיסמה` + `קישור_בסיס_סקר_לקוחות` — a URL typed `templates` by seed #15; both are Q-2), per-template allowed variables as chips, required-missing ⇒ blocked save, optional-missing ⇒ warning, unknown token ⇒ blocked (R-3) | ✅ complete here | this guide |
| Smart Match pane | warning banner, weights-sum-1.00 bar (`mockup_descriptions.md` §10, ruled July), goalpost ≤ gate rule, `מרכיב_אמינות_פעיל` toggle with live attendance count — **pays `🚧 מ9 ← מ4` (params screen, incl. `סכום_נסיעות_למשמרת` which that debt names) and `🚧 מ9 ← מ4/מ6` (company-average fix)** | ✅ complete here | this guide · §6 |
| Owner-scoped editing | `owner_role_id` on `params` + rewritten write policy; "ההגדרות שלי" page from the user menu (R-2) — **deviation from C5 §5.4.1 and from §7.21's "בלי בעלות ברמת-רשומה" (06/07) by Ishay's later rulings 23/07 (§7.70 map) + 02/09 (R-2); §7.84's own reopen trigger names m9 — Q-1 confirms all three at once** | ✅ complete here | this guide · §7.70 · §7.84 · §7.21 |
| Six constants → params | `שעות_סף_זימון_לפני_אירוע`(24) · `שעות_תוקף_זימון`(48) · `שעות_אירוע_דחוף`(72) in the new `shift_invites` type · `סף_שביעות_רצון`(3) · `סף_לוגיסטיקה_ימי_עסקים`(10) in `control_alerts` · `ימי_אזהרה_הצעה_פגה`(7) in `pricing_timing` (Ishay 02/09, guide ①ו) — **deviation from C6 §2.4.9's closed five-value enum, by that ruling (G-1)** | ✅ complete here | this guide |
| Below-minimum-wage list | read-only list beside the min-wage param (DEFINER RPC — finance is blocked on 'דיילות'); **active hostesses only** (V-10) — **pays `🚧 מ9 ← מ4` (report)** | ✅ complete here | this guide · §6 |
| Notification preferences | table + RLS + profile toggles: email toggle live, SMS toggle disabled with "אין ערוץ SMS במערכת" (R-4) — **a C5/C6 addition, by the 07/07 ruling (§6 line)** | 🚧 **מ10** delivers the mail — **the existing §6 line `🚧 מ9 · 🚧 מ10 — העדפות התראות` already carries מ10; cited, not duplicated** | §6 (existing line) |
| `users.email` mutability (§7.64 "exec M9") | ❌ **not now — verdict V-2:** a cascade without the auth-sync half makes an SQL-side email change *succeed* and silently lock the user; today it fails loudly on the FK, and the UI blocks email edits anyway. **Note: m9 ADDS two FKs** (`params.owner_role_id → roles`, `notification_preferences.email → users`) — the second enlarges §7.64's future work by one constraint | M12 (or never; §7.64 sub-note at 4.1) | §7.64 |
| Off-boarding + owner reassignment (§7.35) | ❌ not now — verdict `דחה-ל-מ12` (0 projects owned by inactive users; no defined process; outside the 02/09 framing) | M12 | §7.35 (target updated at 4.1) |
| Param change history | ❌ never — §7.70 ruled "היסטוריה — לא נדרשת" | — | §7.70 |
| Ownership-map UI | ❌ not now — the map is data (`update params set owner_role_id …`), no screen to reassign owners in v1 | reopen if Ishay asks | §3.5 A-8 |

**Rule:** every `🚧 מN` token above must have a byte-matching `🚧 מN` line in `PROJECT_MASTER.md` §6
(iron rule 15; Stop-hook enforced). **This module creates ZERO new tokens** — the one outbound contract
(delivery by m10) is the existing `🚧 מ9 · 🚧 מ10` line. Inbound `🚧 מ9` debts consumed here are struck at 4.1.
Verified at draft: four live `🚧 מ9` lines in §6 (min-wage report · Smart Match params screen ·
reliability average · prefs) + one struck `🚧 מ8 · 🚧 מ9` (ה30 — **verified live 02/09 20:2X:**
`quote_services_select_by_permission` exists; its `qual` content is re-read at 1.0).

### 2.3 Existing files to touch (the module's whole non-additive surface)

| File | Change | Step |
|---|---|---|
| `src/App.jsx` | `<Route path="params">` swaps `UnderConstruction` for `ParamsTab` · new `<Route path="my-settings">` under `MainLayout` **without** `ProtectedRoute` (the `/profile` precedent) · `src/App.routes.test.jsx`: `ALLOWED_UNPROTECTED` gains `my-settings` **consciously, with a why-comment** | 3.1 · 3.4 |
| `src/components/layout/Topbar.jsx` | user-menu item "ההגדרות שלי" → `/my-settings`, hidden when `permissions['הגדרות מערכת'] === 'edit'` (that holder has the full tab) — **the same predicate as `canEdit`, never `SYSTEM_MODULES`** (V-7) | 3.4 |
| `src/components/ProfileSettingsPage.jsx` (`NotificationsSection`, incl. the comment above it "אין עדיין טבלת העדפות") | toggles read/write `notification_preferences` via m9's `api.js`; **both** "(בקרוב)" suffixes removed; SMS row `disabled` with the truthful label; the stale comment rewritten (rule 13(ח)) | 3.5 |
| `src/modules/01_auth/PricesManagementPage.jsx` + `PricingParamsCard.jsx` (+ `pricesApi.js` `getPricingParams`/`updatePricingParam`) | **per Q-1 (recommended):** the card is removed from the `מחירים` tab; the two params live in the `פרמטרים` tab and "ההגדרות שלי"; `pricesApi`'s two param functions deleted (knip flags survivors) | 3.0 · 3.1 |
| `src/lib/hostesses.js` | `INVITE_VALIDITY_HOURS`(48) / `INVITE_CUTOFF_HOURS_BEFORE_EVENT`(24) / `URGENT_EVENT_HOURS`(72) (`:42-44`) become params: the three names join `HOSTESS_PARAM_NAMES` (`:17`); `inviteHoursLeft` · `isInviteExpired` · `isWithinFinalDay` · `isUrgentEvent` · `assignmentDisplayStatus` take the threshold as an argument (pure, injected — the `nowIso` discipline) | 2.3 |
| `src/lib/projectTeam.js:146` (imports `INVITE_VALIDITY_HOURS`) | takes the value as an argument | 2.3 |
| `src/lib/quotes.js` (`EXPIRING_SOON_DAYS` `:469`, used in `deriveQuoteExpiry(quote, validityDays, todayIso)` `:583-596`) + `QUOTE_SCREEN_PARAM_NAMES` (`:474`) | `ימי_אזהרה_הצעה_פגה` added to `QUOTE_SCREEN_PARAM_NAMES`; `deriveQuoteExpiry` gains a fourth argument (it already takes `validityDays` — same pattern) | 2.3 |
| `src/lib/projectLogistics.js` (`const AMBER_BUSINESS_DAYS = 10` `:358`, **not exported**, used once in `amberMark` `:396`) | `amberMark` gains the threshold argument | 2.3 |
| `src/lib/customers.js` (`SATISFACTION_ATTENTION_MAX` `:29`, `needsSatisfactionAttention`) + `src/modules/02_customers/api.js` (`getCustomerScreenParams`) | `סף_שביעות_רצון` loaded (+1 name) and injected | 2.3 |
| **`src/modules/08_finance/ClosingWindowDialog.jsx`** — numeric gates `:226`, `:291`, `:1556` **and two Hebrew UI strings that hard-code the number: `:150` ("חסום: ציון מתחת ל-3 מחייב…") · `:1146` ("סיבת-הבירור — חובה בציון מתחת ל-3")** · **`FinancePage.jsx`** `:857`, `:906` | read `סף_שביעות_רצון` via `src/api/params.js`; **client gate and DB gate read the SAME row** (the comment at `ClosingWindowDialog.jsx:220-223` says the client copy exists to avoid a raw `P0001` — they desynchronise silently otherwise); the two strings interpolate the value. `src/lib/projectFinance.js` `SCORE_TAGS`/`SCORE_LABELS` (`:192-198`) **stay** — §7.80's band labels are ruled per score (declared boundary) | 2.3 |
| `src/lib/smartMatch.js` (`companyResponsivenessAverage` feeds `reliabilityScore`) + `smartMatchCandidates.js` | reliability gets its OWN company average (research §"מרכיב 2"); zero effect while the weight is 0 — tests prove both states | 2.4 |
| `src/modules/04_hostesses/api.js` (`ALL_PARAM_NAMES` `:50`) | inherits the 3 new names via `HOSTESS_PARAM_NAMES` — verify, do not duplicate | 2.3 |
| `src/modules/05_logistics/LogisticsPage.jsx:505` (`amberMark` call) | **no params loader exists in m5** — the page loads `סף_לוגיסטיקה_ימי_עסקים` via `src/api/params.js` with a load/error state | 2.3 |
| `src/modules/06_projects/TeamTab.jsx` (`:352-361`: `assignmentDisplayStatus` · `isInviteExpired` · `inviteHoursLeft`) | **m6's two loaders serve cancellation/closing only** — TeamTab loads `שעות_תוקף_זימון` via `src/api/params.js` | 2.3 |
| `src/lib/assignmentActions.js` (`:12` imports `isInviteExpired`; `isWithinFinalDay` at `:97/:129/:147` is a **destructured boolean**, not a call) | pass the threshold where `isInviteExpired` is called (`:102`) | 2.3 |
| `src/lib/shiftEmails.js:254` (tombstone comment: *"שורת-ה-params עצמה נשארת במסד בכוונה"*) | **re-pointed per Q-2** — if the row is deleted the comment says so with the date (rule 13(ח)); if kept, unchanged | 1.1 |
| merged DB functions `record_feedback` · `archive_project` | `< 3` ⇒ `< v_threshold` read from `public.params` (pull the live body with `pg_get_functiondef` first — migrations/CLAUDE.md rule; both carry `set search_path to ''` ⇒ every **relation and user function** `public.`-qualified — `pg_catalog` builtins need no prefix) | 1.3 |
| `docs/schema.sql` | regenerated after each apply (DB protocol) | 1.4 |
| `docs/reference_spec/products_and_params.md` (**editable**, not frozen — `docs/CLAUDE.md`) | the closed 5-value `param_type` list gains `shift_invites`; the six new rows are listed; #19 (`תבנית_איפוס_סיסמה`) and #15 struck per Q-2; `owner_role_id` noted | 4.1 |
| `e2e/smoke.spec.js` + `e2e/smoke-anchors.json` · `e2e/accessibility.spec.js` · `e2e/prices.spec.js:194-228` | `/system/params` + `/my-settings` added (house rule: every new screen adds a smoke anchor + an axe entry); the existing anchors `prices.vat = "18"` and `builder.ratioDefault = "50"` are live-value fixtures — untouched by m9's migrations, re-checked after journey ①; **per Q-1 the `param-vat` assertions move to the new tab's `settings-` testids** | 4.2 |
| `docs/guides/modules/module_09_settings.md` ⑥1 | `RELEVANT_SECTIONS=§5.16` names a C5 section that does not exist (C5 §5 spans 5.2–5.8; the screen is **C5 §5.6.16**, and `§5.16` is a `PROJECT_MASTER` heading) — fix the pointer and add the "מה נבדק ומה לא" header the 08/08 task asks for | 4.1 |

**No-ops, stated so nobody looks for them:** `Sidebar.jsx` and `PermissionsMatrixPage.jsx` derive from
`BUSINESS_MODULES` (since 21/08) and m9 adds no `modules` row ⇒ untouched. No E2E spec visits
`/system/params` today (measured) ⇒ the route swap breaks nothing. `pricesApi.js:167`'s bare
`.select()` would start returning `owner_role_id` — harmless, and moot if Q-1 removes the card.

**Cross-module collision check (run at 1.0):** at draft time no other micro-guide is OPEN — m8 closed
and merged 02/09; `STATUS.md` module table shows 1–6 and 8 ✅. Re-verify at 1.0, and ask Ishay whether
another session is writing (rule 16) before the first edit.

### 2.4 Files to create

| Path | What |
|---|---|
| `supabase/migrations/<ts>_module9_a_params_owner_types_seed.sql` | Migration A (1.1) |
| `supabase/migrations/<ts>_module9_b_notification_preferences.sql` | Migration B (1.2) |
| `supabase/migrations/<ts>_module9_c_threshold_functions_and_min_wage_rpc.sql` | Migration C (1.3) |
| `src/api/params.js` + `.test.js` | shared generic reader `getParamValues(names)` ⇒ `{name: value}`, fail-loud on a missing name (the `getEmailTemplate` precedent in `src/api/email.js` — cross-module resource, one home) |
| `src/lib/paramsRegistry.js` + `.test.js` | the registry: label · hint · kind · unit · group · affects · validation (§2.8 contract) |
| `src/lib/emailTemplates.js` + `.test.js` | template ⇐ placeholders contract (required/optional) + `templateSaveVerdict()` |
| `src/modules/09_settings/api.js` + `api.test.js` | reads, grouped updates, min-wage RPC, notification prefs, my-params |
| `src/modules/09_settings/ParamsTab.jsx` · `TemplateEditor.jsx` · `SmartMatchPane.jsx` · `MySettingsPage.jsx` · `BelowMinWageList.jsx` (+ `.test.jsx` each) | the surfaces — `data-testid` prefix **`settings-`** (the `param-*`/`params-*` namespace belongs to `PricingParamsCard` and is asserted by `e2e/prices.spec.js` + `smoke.spec.js`) |
| `src/modules/09_settings/CLAUDE.md` | module gotchas file (module-close §4c makes it binding) |
| `e2e/settings.spec.js` | E2E: CEO edit (network-intercepted) · owner sees only hers · view-holder read-only · blocked role never reaches · template gating · profile toggle |
| `docs/mockups/settings-screen/02_params_tab_roles_and_states.html` | the updated mockup for 3.0 (per-role view + the undrawn states), drawn on live values |

### 2.5 DB tables and migrations

**Owns:** `params` (existing; gains `owner_role_id`, a sixth `param_type`, 6 rows, loses 2 rows — Q-2) · `notification_preferences` (new). **Touches others' functions:** `record_feedback`/`archive_project`
(m8) — body edit, signature unchanged. **Reads:** `hostesses.hourly_rate` + `full_name` + `status` inside a
DEFINER RPC only (finance is blocked on 'דיילות' ⇒ client read = silent `[]`); `assignments.attendance_status`
count via the existing 'דיילות' read policy. **Storage:** none. **FKs: two NEW ones are created**
(`params.owner_role_id → roles(role_id)` · `notification_preferences.email → users(email)`); **no existing FK
is altered** (V-2).

**Deploy-rule check (migrations/CLAUDE.md):** A = add column · extend CHECK · insert rows · policy
*widening* · **delete rows** ⇒ the destructive-row check is the mandated `git show origin/main:<file>
| grep -n "<name>"` form, run at 1.0 over every file that ever named the param (`git log -S'<name>'
--name-only` lists them), **not** a working-tree grep — and `db_roadmap.md` §9א is read first. **Run at
draft (02/09, `origin/main` = `73c61d5`): both candidate rows have zero executable readers** — only
seed migrations, docs, and the `shiftEmails.js:254` tombstone comment. B = new table ⇒ safe. C =
function bodies keep their signatures and read a row that A seeded ⇒ safe **only if A applied first** (T1).

### 2.6 Dependencies

- **m1 (merged):** `SystemManagementPage` tab bar + `/system` guard (`ProtectedRoute allow={SYSTEM_MODULES}`, and `isAllowed` admits `view` as well as `edit`) · `ProfileSettingsPage` toggles · `users` policies (`users_update_self` freezes role/status; email edits are UI-disabled in `UsersManagementPage`) · `current_user_role_id()` (returns `integer`; NULL for inactive users).
- **m3 (merged):** `PricingParamsCard` — the precedent for kind validation, `.select()`+row-count writes, "affects new quotes only" hint; **it edits the same two params the tab will show (Q-1)** · `getEmailTemplate` in `src/api/email.js` · `findUnknownPlaceholders`/`fillEmailTemplate` in `src/lib/email.js` · `src/lib/validators.js` (`isValidVatPercent`, `isValidGuestsRatio`, `isValidPositiveInt`, `isValidNonNegativePrice`, `EMAIL_REGEX`) · `PRICING_PARAM_NAMES` in `src/lib/pricing.js:20`.
- **m4 (merged):** `SMART_MATCH_PARAM_NAMES` (`smartMatch.js:21`, 13, byte-exact) · `activeWeights` runtime normalisation (a sum ≠ 1.00 does NOT break ranking — the 1.00 rule is a **UI validation**, not a DB invariant) · `proximityScore`: score hits 0 at `גולפוסט_מרחק_קמ` (40); `שער_מרחק_קמ` (80) disqualifies (`km > gate ⇒ false`) · the 3 invite thresholds · `enforce_hostess_min_wage` (trigger, write-only — hence the report debt; **also the pattern for reading a param inside a function**) · `hostesses.hostess_id` is **`bigint`**.
- **m5 (merged):** `amberMark` consumer with no params loader.
- **m6 (merged):** attendance columns on `assignments` (1 row populated of 27, measured 02/09) · `TeamTab` consumer of the invite functions, no params loader for them · `assert_module_permission(text, text[])` — DEFINER, raises `42501`, callable from another DEFINER body (the m6 precedent at `20260814142439:748`).
- **m8 (merged):** `record_feedback` (last defined in `20260827150049`) / `archive_project` (last defined in `20260827155303` — **not** E2's copy; pull the live body) · the client copies in `ClosingWindowDialog.jsx`/`FinancePage.jsx` · `תנאי_תשלום_ימים` · finance manager identity.
- **Mail engine (shared):** consumed as-is; m9 edits template TEXT only, never the engine. One outgoing mail has no `params` row at all — `PROJECT_REPORT_BODY_TEMPLATE` (`shiftEmails.js:284-288`, code-hosted, `הנחתי` in m6) — the settings screen cannot edit it (§4.5).

### 2.7 🔑 Test Identities (MANDATORY — RLS + role-gated UI)

- **Live `roles.role_name` strings, byte-exact (measured 02/09):** `מנכ"ל` · `מנהלת פרויקטים` · `מנהלת כספים ולקוחות` · `מנהלת גיוס ושיבוץ` · `מנהלת לוגיסטיקה`. 🔴 **§7.70's map writes them truncated ("מנהלת כספים", "מנהלת גיוס") — a subquery on the truncated name returns NULL and sets `owner_role_id = NULL` SILENTLY.** Never copy the names from §7.70; copy them from here or from `roles`. The last four are `blocked` on 'הגדרות מערכת' **and** on 'ניהול הרשאות'. **No live role holds `view` on 'הגדרות מערכת'** — the view state (§4.4) is proven by impersonation/unit test, not by a seeded user.
- **Owner map — two readings, Q-4 picks one** (§7.70 23/07 verbatim = the literal reading; A-8 by analogy = the recommended reading):
  - **finance (`מנהלת כספים ולקוחות`):** `אחוז_מעמ` · `שכר_מינימום_שעתי` · `מייל_משרד_רואי_חשבון` *(§7.70)* + `סף_שביעות_רצון` · `סכום_נסיעות_למשמרת` · `תנאי_תשלום_ימים` *(analogy)* + `תבנית_מייל_חשבונית_מס` · `תבנית_מייל_דוח_שכר` *(analogy — finance-facing mails)*.
  - **projects (`מנהלת פרויקטים`):** `ימי_תוקף_הצעה` · `ימי_אזהרה_קדם_אירוע` · `תבנית_מייל_הצעת_מחיר` *(§7.70)* + `ימי_אזהרה_הצעה_פגה` *(analogy)*.
  - **recruitment (`מנהלת גיוס ושיבוץ`):** the 3 weights · `יחס_אורחים_לדיילת` · `שעות_תזכורת_לדיילת` · `תבנית_זימון_משמרת` · `תבנית_מייל_שחרור_משמרת` *(§7.70)* + the other 10 `smart_match` rows · the 3 `shift_invites` · the 5 other hostess-facing templates (`תבנית_מייל_ביטול_משמרת` · `תבנית_אישור_סופי_שיבוץ` · `תבנית_תזכורת_משמרת` · `תבנית_מייל_אירוע_בוטל` · `תבנית_מייל_פרטי_האירוע_השתנו`) *(analogy)*.
  - **logistics (`מנהלת לוגיסטיקה`):** `סף_לוגיסטיקה_ימי_עסקים` *(analogy)*.
  - **CEO only (`owner_role_id IS NULL`):** `תבנית_מייל_משוב_לקוח` (customer-facing, sender is m6 — no natural owner) · `קישור_בסיס_סקר_לקוחות` if it survives Q-2 (§7.70 puts it with the CEO).
  - **Owned-row count — Q-4 ruled the analogy reading: 38** (the literal reading would have been 31; the two deleted rows were CEO-only, so the count is unaffected by Q-2). The loud-fail guard in A asserts **38**.
- Impersonation for RLS proofs: `set local role authenticated` + `set_config('request.jwt.claims', …)` carrying BOTH `sub` and `email` (one missing key ⇒ 0 rows that *look* like RLS). **Positive control first:** the CEO must update ≥1 row before any 0-row result is read as "blocked".
- UI-login creds: `E2E_<ROLE>_*` in `.env.local`. ✅ **Counted 02/09/2026: five pairs — CEO · FINANCE · PROJECTS · RECRUIT · STAFF.** `STAFF` = `מנהלת לוגיסטיקה` (documented in `e2e/customers.spec.js:10`); confirm live at 1.0. Presence ≠ a working login — first exercised at 4.2.
- Never hard-code emails; resolve from the seed at test time.

### 2.8 Product source of truth

**No `docs/specs/module_09_*/` folder exists (R-1).** The packet's sources, in order:
1. `docs/guides/modules/module_09_settings.md` §①א–①ז — Ishay's dated rulings (28/08: mockup direction; 02/09: sixth type, 6 params, the new mockup governs, the 1.00 constraint is settled) + the measured ground state and world conventions (§①ב, 3 sources). ⚠️ Its ⑥1 pointer `§5.16` is broken (§2.3 last row). ⚠️ Its ①ו arithmetic "39 → 45" assumed **no deletions** — Q-2 is where that is reconciled.
2. §3 below — rulings R-1…R-4, the approval-round questions Q-1…Q-4, and the verdicts V-*.
3. `docs/PROJECT_MASTER_sec7.md` §7.70 (ownership map, 23/07) · **§7.84 ↳ 30/07 (prices tab stays CEO-only, reopen trigger = m9) — Q-1** · **§7.21 (06/07: access "אך ורק" by the permission matrix, "בלי בעלות ברמת-רשומה") — Q-1** · §7.83 (read open to all authenticated; its *write* clause is what A widens) · §7.64 · §7.66 (min-wage report) · §7.90 (reliability flag in `params`) · §7.80 (band labels) · §7.35 (deferred).
4. `docs/PROJECT_MASTER.md` §6 — the four `🚧 מ9` lines (grep `🚧 מ9`) · §3 (permission matrix) · §4 (design language).
5. `docs/specs/module_04_hostesses/module4_smart_match_research.md` §11.1 — the meaning of every `smart_match` param (labels derive from here; the mockup's **gate** label is wrong — V-4).
6. Mockup (tier 4, direction approved 28/08, **not final**): `docs/mockups/settings-screen/01_params_tab_proposal.html` — the four views + its "מה הכרעתי לבד" block. The old folder `docs/mockups/system-settings-screen/01–04.png` is **not** the reference (Ishay 02/09) — only its 1.00 rule survives. **Correctly absent from this plan (mockup-only or killed):** sliders · "שחזר להגדרות ברירת מחדל" · "תעריף ברירת מחדל לדיילת חדשה" 350 · "הוספת נסיעות אוטומטית" · "תעריף חיוב קבוע לדיילת ללקוח" (`db_roadmap` §9 #8).
7. Frozen background (tier 3): C5 §5.6.16 · C5 §5.6.17 (§.4 field errors never reset other fields; success strip at the top, auto-dismissing · §.5 access-denied blocks the fetch, not only the render) · C5 §5.8 (template bodies as seeded) · C6 §2.4.9 · C6 §2.4.8 / C5 §5.4.6 (three permission states incl. `view`). Known-bad passages: `db_roadmap` §9 #7 (W3 naming superseded) and #8.
8. Registers read live: `docs/schema.sql` (exact names — the CHECK is `params_param_type_check`, `schema.sql:538`) · `docs/db_roadmap.md` (§1 checklist · **§9א before any deletion** · A-24 · the `users`/`params` §6 rows · §7 matrix row "9 הגדרות") · `docs/reference_spec/products_and_params.md` (the `param_type` enum; seed decision #7 "no description column"; its "תיאור פונקציונלי" prose is a *documentation* source for labels; **editable — 4.1 updates it**).

**Contracts this guide fixes (the "two builders would diverge" test):**
- **Registry entry shape** (`paramsRegistry.js`): `{ name, label, hint, kind, unit?, min?, max?, decimals?, group, affects? }` — `kind` per Q-3's ruled table; `group` derived from `param_type` via one map (`pricing_timing`→"תמחור ותזמון" · `control_alerts`→"בקרה והתראות" · `templates`→"תבניות מייל" · `smart_match`→"התאמת דיילות" · `integration_tech`→"טכני" · `shift_invites`→"שיבוץ וזימונים"); **`affects`** = an optional one-sentence Hebrew consequence shown as an amber note beside rows whose change alters another role's screen (the Smart Match banner generalised — e.g. `סף_שביעות_רצון` ⇒ "מעלה את הרף שבו נדרשת סיבה למשוב — מסך הכספים ידרוש אותה"); the exact sentences are nodded at the 2.1 🗣️ brief. A DB row with no registry entry renders with its raw name, kind `text`, and a visible note "הגדרה ללא הגדרת-תצוגה" — **never hidden**.
- **Validators compose, never fork:** `percent` ⇒ `isValidVatPercent` · `int`-family ⇒ `isValidPositiveInt` · `decimal`/`money` ⇒ `isValidNonNegativePrice` · `email` ⇒ `EMAIL_REGEX` · `weight`/`boolean`/`url` are the only new predicates (none exists). `PRICING_PARAM_NAMES`, `HOSTESS_PARAM_NAMES`, `SMART_MATCH_PARAM_NAMES`, `QUOTE_SCREEN_PARAM_NAMES`, `CANCELLATION_PARAM_NAMES` stay where they are; the registry keys on `param_name` strings and a test proves it matches the live seed **both directions**. Cross-field: weights sum 1.00 (±0.005) · `גולפוסט_מרחק_קמ ≤ שער_מרחק_קמ`. Blank ⇒ invalid for every non-template kind (the `Number('') === 0` trap).
- **Template contract** (`emailTemplates.js`): `{ [param_name]: { required: [...tokens], optional: [...tokens] } }` — tokens byte-exact with `[…]` brackets. Save verdict: unknown token ⇒ `blocked` · required missing ⇒ `blocked` with `בלי <token> <consequence>` · optional missing ⇒ `warning` · else `ok`. The measured allowed sets (DB bodies, 02/09) are in §3.7.
- **`updateParams` write shape:** sequential `update … eq('param_name') … select()` per changed row (never `upsert` — `param_type` NOT NULL makes upsert fail, the 30/07 lesson in `pricesApi.js`), `assertRowsAffected` on each; the first failure stops the sequence and the UI names the row. **Mixed-ownership guard:** the form submits only rows whose `canEdit` is true, and `updateParams` refuses a batch containing a row the caller cannot edit (checked client-side from `owner_role_id`/permission) — a half-written batch must be unreachable, not merely unlikely.
- **Shared reader** (`src/api/params.js`): `getParamValues(names[])` ⇒ `{ [name]: value }`; a name missing from the result throws a Hebrew error naming it (never a default) — the `requireParams` doctrine; consumers render `LoadingOrError` on failure.
- **Threshold-in-DB contract (1.3):** `record_feedback` and `archive_project` read `סף_שביעות_רצון` from `public.params` **only on the paths that consult it** — a missing/malformed row must never block `no_response` marking or the archive of a project with no score. Missing/malformed ⇒ Hebrew `P0001` naming the param. Any message that used to hard-code "3" takes the threshold as a `%` argument (wording and errcode otherwise kept).
- **RPC:** `list_hostesses_below_min_wage()` returns `table(hostess_id bigint, full_name text, hourly_rate numeric)` (all three typed; `hostess_id` is `bigint`), `stable`, DEFINER, `set search_path = ''` ⇒ `public.hostesses`, `public.params`, `public.current_user_role_id()`, `public.assert_module_permission()` — every relation/user-function qualified, and every column `h.`-qualified (the OUT names collide with the column names); **population = `status = 'active'` only (V-10)**; ordered by rate asc, name asc; gate = `if not exists (owner of שכר_מינימום_שעתי) then perform public.assert_module_permission('הגדרות מערכת', array['edit']); end if;` (the assert raises `42501` — the owner branch is tested first); `revoke from public, anon, authenticated` + grant `authenticated` execute.
- **Notification prefs row:** `email text not null` PK, FK `users(email)` **`on update no action on delete cascade` — written explicitly** (V-2: the loud FK failure is the safeguard) · `email_new_projects boolean not null default false` · `sms_last_minute boolean not null default false` · `created_at`/`updated_at timestamptz not null default now()` + `extensions.moddatetime`. **C-1 is satisfied by the PK — do not add a second index on `email`.** No grants beyond Supabase defaults (table rule; the explicit-revoke rule is for functions). Absent row = both false.
- **Migration A's loud-fail guard:** after the owner-map `update`s, a `do $$ … raise exception … $$` block asserts `count(*) where owner_role_id is not null` = the ruled number (31 or 38 per Q-4) — because the failure mode of a wrong role string is **silence**, not an error. The owner-map `update` bumps `updated_at` on every mapped row (moddatetime) — accepted and stated (§4.5②).
- **Policy set on `params` after A — FOUR policies, one command each** (Postgres allows one command per policy; the earlier "INSERT+DELETE in one policy" was not expressible): `params_select_all_authenticated` (SELECT, existing) · `params_update_settings_or_owner` (UPDATE; `using` = `with check` = settings-edit OR owner) · `params_insert_settings_only` (INSERT) · `params_delete_settings_only` (DELETE). `params_write_ceo_only` (FOR ALL) is dropped. **Expected `pg_policies` count = 4, and zero `multiple_permissive_policies` advisor findings** (one permissive policy per command). Identical `using`/`with check` on the owner policy means an owner cannot null out or hand away her own `owner_role_id` — keep it.
- **Success feedback:** a toast via `ToastProvider` — "ההגדרות נשמרו" — auto-dismissing (C5 §5.6.17.4), and a field error never clears other fields' input (same clause).

### 2.9 Environment facts

`@/supabaseClient` (NOT `@/lib/`) · dev server 5173 · full RTL, physical utilities only; every non-Hebrew value (numbers, emails, `param_name`) in `<Ltr>`/`dir="ltr"` · `LoadingOrError` with `skeleton` for load states · `Switch` in `src/components/ui/` is RTL-patched — never `npx shadcn add` · Supabase project `yfeovxppnfoafmfbdfvh`, Postgres 17; **MCP was LIVE in the blueprint session (02/09/2026)** — every count in this guide is a same-day measurement, re-measure at 1.0; ⚠️ **a subagent session may find MCP unauthenticated (the rehearsal did) — then `pg_get_functiondef` is unavailable and the last-defining migration is only a fallback, never a substitute for the live body** · typed-echo gate before every `apply_migration` · `moddatetime` lives in schema `extensions` (`schema.sql` writes 9 of 12 triggers bare — do not copy its form) · new-function grants: `revoke … from public, anon, authenticated` then grant by name · `params.param_value` is `text` for every kind — parsing is the reader's job (`optionalNumber`, `paramBoolean`) · `npm run gate` is NOT what CI runs, and `check:docs-structure` runs nowhere automatically (root `CLAUDE.md`) · `apply_migration` runs a file as one transaction (drop CHECK → add CHECK → insert is safe in one file).

---

## 3. 🧭 Decisions Ledger

### 3.1 §7 items of this module (read each to its tail in `PROJECT_MASTER_sec7.md`)

| Item | State | What it binds here | Lands in |
|---|---|---|---|
| §7.70 🟡 | typed validation + the full params screen deferred to m9; **↳ ownership map (23/07)** — its role names are truncated (§2.7); history NOT required | 1.1 (owner column) · 2.1 (kinds) · 3.1–3.4 |
| §7.21 🟢 (06/07) | RLS model: access **"אך ורק"** by the permission matrix, **"בלי בעלות ברמת-רשומה"**. `owner_role_id` IS record-level ownership ⇒ **two dated rulings** — §7.21 (06/07) vs §7.70↳ (23/07) + R-2 (02/09). **Q-1** asks which stands (the later, specific ones are recommended) | 1.1 · 4.1 (sub-note on §7.21) |
| §7.84 🟢 ↳ 30/07 | prices tab stays CEO-only on three grounds — (א) updates ~twice a year · (ב) per-quote ratio already open · (ג) "no way to grant only prices" — **with the explicit reopen trigger "מסך-הפרמטרים המלא במודול 9 (§7.70)"**. The `owner_role_id` column dissolves (ג); (א) stands. **Q-1** | 1.0 (question) · 3.0 |
| §7.83 🟢 | `params` SELECT open to all `authenticated` — unchanged; **its write clause ("כתיבה: params לפי מטריצת 'הגדרות מערכת'") is what A widens** — a dated sub-note at 4.1 | 1.1 · 4.1 |
| §7.64 ⚪ | `users.email` accept-case + cascade + auth-sync, "exec M9" — **V-2: not executed here**; m9 adds one more FK to `users(email)` | 4.1 |
| §7.66 🟢 | min-wage trigger is write-only ⇒ the "who is below" list is m9's | 1.3 · 3.6 |
| §7.90 🟢 | reliability flag lives in `params`, editable in m9's screen, never auto-derived | 3.3 |
| §7.15 🟢 | W3 = מהימנות; the live weights are `היענות/אמינות/קרבה` — labels follow the live names | 2.1 |
| §7.80 🟢 | score→tag bands ruled per score; **the threshold param drives the reason-gate (DB + client) and the customer filter — NOT the tag labels** (declared boundary) | 2.3 |
| §7.35 🟡 | off-boarding + owner reassignment — **verdict `דחה-ל-מ12`** (V-1, overridable) | 4.1 (target updated) |
| §7.57 🟢 | ghost param stays unseeded — nothing to show | — |

### 3.2 Ishay's rulings baked here (dated, quoted where load-bearing)

| # | Ruling | Date | Lands in |
|---|---|---|---|
| R-1 | micro-guide, no Discovery | 02/09 ≈19:20 | this file · 4.1 |
| R-2 | "ההגדרות שלי" second door; CEO keeps the tab; owner column + policy | 02/09 ≈19:20 | 1.1 · 3.4 |
| R-3 | two-level template gating (required blocks, optional warns, unknown blocks) | 02/09 ≈19:20 | 2.2 · 3.2 |
| R-4 | prefs table with both columns; only the email toggle enabled; SMS label "אין ערוץ SMS במערכת" | 02/09 ≈19:20 | 1.2 · 3.5 |
| G-1 | sixth `param_type` = `shift_invites` / "שיבוץ וזימונים" | 02/09 (guide ①ו) | 1.1 |
| G-2 | six constants become params (names in §2.2) | 02/09 (guide ①ו) | 1.1 · 2.3 |
| G-4 | the new mockup governs; the July mockups are not the reference; the 1.00 rule is settled | 02/09 (guide ①ד) | 3.0 |
| G-5 | mockup direction approved, details not; per-role mockup to be re-shown for final approval | 28/08 + 02/09 (guide ①ב/①ז) | 3.0 |
| G-6 | notification prefs split: m9 table+UI, m10 sending | 07/07 (§6) | 1.2 · 3.5 |
| G-7 | ownership per natural owner (the §7.70 map) | 23/07 | 1.1 |

### 3.3 Anchored self-closures made at blueprint (Ishay may override any)

| # | Closure | Anchor |
|---|---|---|
| V-1 | §7.35 ⇒ `דחה-ל-מ12` | 0 projects owned by inactive users (live); no process in any source; outside the 02/09 framing "השלמת-לשונית + הוספה" |
| V-2 | §7.64 cascade ⇒ **`דחה`** | `UsersManagementPage.jsx` disables the email field ("מפתח זיהוי RLS+FK"); `users_update_self` requires `email = auth.email()`; `users_write_ceo_only` is `FOR ALL` ⇒ an SQL-side change would *succeed* after a cascade and leave `auth.users` stale — the lockout §7.64's own first sentence warns about. The loud FK failure is the safeguard until cascade + auth-sync ship together |
| V-4 | the mockup's **gate** label is wrong ("מרחק שממנו מתחילים להוריד ניקוד" on `שער_מרחק_קמ`); its goalpost label is right; labels derive from research §11.1; rule goalpost ≤ gate | `proximityScore` zeroes at goalpost; `km > gate ⇒ false` filters (`smartMatch.js`) |
| V-5 | reliability toggle editable + company-average fix in the same step + live attendance count beside it | §6 `🚧 מ9 ← מ4/מ6` names "יחד עם הדלקת-המתג"; 1 of 27 assignments has attendance (live) |
| V-6 | ownership data lives in `params.owner_role_id` (FK `roles`), labels/kinds live in code (registry) | seed decision #7 (03/07): no description column on `params`; validation must be unit-testable; ownership must be RLS-visible |
| V-7 | "ההגדרות שלי" menu item hidden when `permissions['הגדרות מערכת'] === 'edit'`, shown otherwise; the page's empty state is a fail-safe (unreachable under either owner-map reading, since every non-CEO role owns ≥1 row) | one screen for one job (src/CLAUDE.md inventory pass); the same predicate as `canEdit` — one rule, one expression |
| V-8 | G-3: `QUARTER_WINDOW_DAYS` (`hostesses.js:465`) stays in code — Ishay's own recorded default (ב); the guide says "הכרעה נדרשת בבנייה", so this closure is **named at the approval message**, not hidden | guide ①ו③ |
| V-9 | mixed-ownership save batches are made unreachable by contract (§2.8), not left to "won't happen" | the sequential-write partial-state hazard measured in `PricingParamsCard.jsx:93-96` |
| V-10 | the min-wage list shows **active** hostesses only | an inactive hostess is not paid; listing her makes the floor look breached when it is not — `הכרעתי, הפיך`, disclosed at approval |
| V-11 | the owner-map `update` bumps `updated_at` on every mapped row — accepted, not suppressed | suppressing the trigger for one statement is a special case nobody would look for; `updated_at` on `params` never meant "value changed" precisely |

*(V-3 — the two row deletions — moved to Q-2 in full: the step guide calls the password template "טעון בדיקה" and Ishay's ①ו arithmetic "39 → 45" assumed no deletions; both rows are his call, not a closure.)*

### 3.4 🛑 Ishay's items — ✅ ALL FOUR RULED 02/09/2026 ≈20:40, each = the recommendation below (cited as Q-N through the guide; overridable like any ruling)

| # | Item | Recommendation (becomes the ruling if he taps it) | Anchored to |
|---|---|---|---|
| Q-1 | **Three dated rulings on "who edits what", and three editors for two params.** §7.21 (06/07): access by the matrix only, "בלי בעלות ברמת-רשומה". §7.84 ↳ (30/07): prices tab CEO-only *"בשלושה נימוקים… 🔁 טריגר-פתיחה-מחדש: מסך-הפרמטרים המלא במודול 9"*. §7.70 ↳ (23/07) + R-2 (02/09): per-owner editing. After m9 the same two params (`אחוז_מעמ`, `יחס_אורחים_לדיילת`) would be editable in THREE places: `PricingParamsCard` on the `מחירים` tab, the `פרמטרים` tab, and "ההגדרות שלי" — the house rule "שניים באותו תפקיד ⇒ אחד נמחק". | **R-2 stands** (it IS the reopen §7.84 anticipated; the owner column dissolves ground ג; §7.21's "no record-level ownership" gets a dated sub-note: superseded for `params` only) **and `PricingParamsCard` is removed from the `מחירים` tab** — the tab keeps catalog + tiers; the two params live in the `פרמטרים` tab (CEO) and in "ההגדרות שלי" (owners). Ripple: `e2e/prices.spec.js:194-228` and `smoke.spec.js:138` re-pointed to `settings-` testids; the smoke anchor `prices.vat` moves under `settings.*`; `pricesApi`'s two param functions deleted. | 1.0 (ask) · 3.0 · 4.1 · 4.2 |
| Q-2 | **Delete the two unread rows?** ① `תבנית_איפוס_סיסמה` — Supabase Auth sends that mail itself; 0 readers on `origin/main` (T9 run for real); the step guide calls it "מועמד אמיתי למחיקה, טעון בדיקה" — the check is done. ② `קישור_בסיס_סקר_לקוחות` — 0 readers since m8 moved the survey to a token URL (only the tombstone comment `shiftEmails.js:254`, which itself says the row "נשארת במסד בכוונה"); m8's Discovery ruled by delegation "נשאר, מיושן"; but C5 §5.6.16, `PROJECT_MASTER §5.16` and §7.70's map (23/07) all name it. Ishay's own ①ו count "39 → 45" assumed neither is deleted. **Not recoverable without re-seeding** (the password body lives only in a July migration). | **Delete both** — a settings screen that shows an editable value nobody reads lies to the user; the survey link is now minted per project, so C5's requirement is met by a different mechanism (deviation note at 4.1); the tombstone comment is re-pointed in the same change. Alternatives: delete only ① (count 44) · keep both (count 45; both render as CEO-only rows with the note "לא בשימוש"). | 1.1 · §2.2 count |
| Q-3 | **Validation per kind** — the step guide §①ב says *"מה שנדרש לכל טיפוס הוא הכרעה של ישי, לא של הבונה"*. Presented on the 02/09 page as an assumption; silence is not a ruling. | The kinds and rules in §2.8 ("Validators compose"): percent 0–100 · positive integers for hours/days/km/counts · ≥0 money with 2 decimals · weights 0–1 summing to 1.00 · true/false · email · https URL · goalpost ≤ gate · blank never = 0. | 2.0 door · 2.1 |
| Q-4 | **Owner map for the rows the 23/07 map predates** (10 `smart_match` rows seeded 09/08 · the 3 `shift_invites` · 5 hostess-facing templates · 2 finance-facing templates · the 3 finance numbers · the projects/logistics thresholds). Literal reading (§7.70 only): those stay CEO-only, **31** owned rows. Analogy reading (A-8): each goes to its natural owner, **38** owned rows. Two builders would diverge — the migration's loud-fail guard needs ONE number. | **Analogy (38)** — the 23/07 map named what existed then; "natural owner" was its principle. Concretely: all 13 `smart_match` + 3 `shift_invites` + 5 hostess-facing templates ⇒ recruitment · `סף_שביעות_רצון` · `סכום_נסיעות_למשמרת` · `תנאי_תשלום_ימים` · invoice + salary templates ⇒ finance · `ימי_אזהרה_הצעה_פגה` ⇒ projects · `סף_לוגיסטיקה_ימי_עסקים` ⇒ logistics · `תבנית_מייל_משוב_לקוח` ⇒ CEO. The map is data — one UPDATE changes it later. | 1.0 · 1.1 |

### 3.5 Assumptions (spec-silent) — surfaced, never silently resolved

| # | Assumption | Why needed / the trap |
|---|---|---|
| A-2 | "שינית N מתוך M" footer line (mockup ④, no source) stays | 13-field form with no change indicator invites accidental saves |
| A-3 | Save is per group ("שמור שינויים" on the visible pane), not per field | the `PricingParamsCard` precedent |
| A-4 | Blank numeric value ⇒ invalid, never 0 | the VAT trap already caught in m3 |
| A-5 | Concurrent edits: last write wins, no lock | reality filter asked ("קורה אצלך?") — unanswered ⇒ recorded as assumption |
| A-6 | Friendly labels for the ~30 params the mockup did not draw are proposed by the builder from research §11.1 · `products_and_params.md`'s "תיאור פונקציונלי" prose · C5 §5.6.16, and **nodded at the 2.1 🗣️ brief — before the registry is committed** | labels are product-visible; the mockup drew 12 |
| A-7 | Per-template required sets (§3.7) follow R-3's principle (links + recipient name); the exact per-template list is confirmed at the 3.2 🗣️ brief | R-3 ruled the principle, not 11 lists |
| A-8 | → promoted to **Q-4** (owner map by analogy) | two readings diverge on 7 rows; a number is needed for the guard |
| A-9 | `/my-settings` is open to every logged-in user (like `/profile`) and scopes by ownership inside; the routes-guard allowlist gains it consciously | a route needing "owns ≥1 param" cannot be expressed as a module permission |
| A-10 | The attendance count beside the toggle reads `assignments` with the existing 'דיילות' policy — the pane is only reachable by roles that hold it (CEO, recruitment) | a DEFINER reader for one count would be a new exposure for nothing |
| A-11 | A `view`-level holder of 'הגדרות מערכת' (none seeded today) sees the whole tab read-only: inputs disabled, no save row, the note "צפייה בלבד" | C5 §5.4.6 defines the state; `isAllowed` admits it to the route |

*(A-1 — validation kinds — is Q-3.)*

### 3.6 ⏳ Deferred (recorded; the phase door asks only if newly relevant)

| Item | Target |
|---|---|
| Notification delivery (email on new projects) | M10 (existing §6 line) |
| Off-boarding + `projects.owner_email` reassignment (§7.35) | M12 |
| `users.email` cascade + auth sync (§7.64) — now five FKs, not four | M12 or never — sub-note at 4.1 |
| Ownership-map UI | reopen on request |
| Param change history | never (§7.70) |

### 3.7 🔤 Locked UI strings — the build session copies, never re-derives

- Group labels: `תמחור ותזמון` · `בקרה והתראות` · `תבניות מייל` · `התאמת דיילות` · `טכני` (mockup, direction-approved) · `שיבוץ וזימונים` (Ishay 02/09).
- Tab label stays `פרמטרים` (already live in `SystemManagementPage`). Menu item: `ההגדרות שלי` (R-2). Page title: `ההגדרות שלי`.
- Smart Match warning, CEO view (mockup ד׳): `שינוי כאן משנה שיבוצים אמיתיים. הדירוג שמנהלת השיבוץ תראה מחר ייראה אחרת, והיא לא תדע שמשהו השתנה. שינוי כדאי לתאם איתה מראש.` · **owner view (recruitment manager herself):** `שינוי כאן משנה את הדירוג שתראי מחר במסך השיבוץ.` · sum bar: `שלוש המשקולות מסתכמות ל-1.00` + tag `תקין` / amber otherwise.
- Pricing hint (mockup א׳, matches the m3 card): `שינוי משפיע על הצעות חדשות בלבד — הצעה שכבר אושרה שומרת את הערכים שהוקפאו בה.`
- SMS toggle label: `אין ערוץ SMS במערכת` (R-4) · email toggle helper: `ההתראות עצמן יישלחו כשמנוע ההתראות יעלה (מודול 10)` · **no "(בקרוב)" remains on either row**.
- Template gating sentence pattern (R-3): `בלי [<token>] <consequence>` — e.g. `בלי [לינק_אישור_משמרת] הדיילת לא יכולה לאשר את המשמרת`.
- `affects` note pattern (registry): one sentence naming whose screen changes — texts nodded at 2.1.
- DB messages that carried the number: `ציון נמוך מ-% מחייב בחירת סיבה…` (threshold interpolated); client twins at `ClosingWindowDialog.jsx:150/:1146` likewise.
- Corrected distance labels (V-4): `שער_מרחק_קמ` ⇒ `מרחק שמעבר לו הדיילת נפסלת` · `גולפוסט_מרחק_קמ` ⇒ `מרחק שבו ציון-הקרבה מגיע ל-0` (the mockup's own label for this one) · rule text: `חייב להיות קטן או שווה למרחק-הפסילה`.
- Success toast: `ההגדרות נשמרו` · save-failed: `השמירה נכשלה ב"<label>" — <reason>` · error/empty: `לא ניתן לטעון את ההגדרות.` + `נסי שוב` · empty "my settings": `אין הגדרות בבעלות התפקיד שלך` · view-only note: `צפייה בלבד` · min-wage empty: `אין דיילות פעילות מתחת לרף הנוכחי`.
- `data-testid` prefix: `settings-` (never `param-`/`params-`).
- **Measured template ⇐ placeholders (DB bodies, 02/09/2026; required per A-7):**
  `תבנית_מייל_הצעת_מחיר` — req `[שם_איש_קשר]` · opt `[שם_פרויקט] [תאריך_אירוע] [חתימת_שולח]` ·
  `תבנית_זימון_משמרת` — req `[שם_דיילת] [לינק_אישור_משמרת]` · opt `[שם_פרויקט] [תאריך_אירוע] [שעת_התחלה] [שעת_סיום] [עיר_אירוע] [תעריף_שעתי_דיילת]` ·
  `תבנית_מייל_משוב_לקוח` — req `[שם_איש_קשר] [לינק_לשאלון_שביעות_רצון]` · opt `[שם_פרויקט]` ·
  `תבנית_מייל_חשבונית_מס` — req `[שם_לקוח_חברה]` · opt `[שם_פרויקט]` ·
  `תבנית_מייל_ביטול_משמרת` — req `[שם_דיילת]` · opt `[שם_פרויקט] [תאריך_אירוע]` ·
  `תבנית_אישור_סופי_שיבוץ` — req `[שם_דיילת] [טלפון_מנהלת_פרויקט]` · opt `[שם_פרויקט] [תאריך_אירוע] [שעת_התחלה] [שעת_סיום] [כתובת_אירוע_מלאה] [שם_מנהלת_פרויקט]` ·
  `תבנית_תזכורת_משמרת` — req `[שם_דיילת] [טלפון_מנהלת_פרויקט]` · opt `[שם_פרויקט] [שעת_התחלה] [כתובת_אירוע_מלאה] [שם_מנהלת_פרויקט]` ·
  `תבנית_מייל_דוח_שכר` — req `[חודש_דיווח_ושנה]` · opt `[שם_רואה_חשבון]` (the code strips it when no name) ·
  `תבנית_מייל_שחרור_משמרת` — req `[שם_דיילת]` ·
  `תבנית_מייל_אירוע_בוטל` — req `[שם_דיילת]` · opt `[שם_פרויקט] [תאריך_אירוע]` ·
  `תבנית_מייל_פרטי_האירוע_השתנו` — req `[שם_דיילת] [טלפון_מנהלת_פרויקט]` · opt `[שם_פרויקט] [תאריך_אירוע] [שעת_התחלה] [שעת_סיום] [כתובת_אירוע_מלאה] [שם_מנהלת_פרויקט]`.
  (`תבנית_איפוס_סיסמה` — Q-2; `קישור_בסיס_סקר_לקוחות` is a URL, never opens the editor.) **Allowed = required ∪ optional; anything else is unknown.** *(Re-derived independently by the fresh-context reviewer, 02/09 — all 11 sets confirmed.)*

### 3.8 🔴 Ruling-coverage ledger (denominator = every dated ruling this module holds)

| Ruling | Owning step |
|---|---|
| R-1 micro-guide | this file · 4.1 (STATUS line) |
| R-2 second door + owner column | 1.1 · 3.4 |
| R-3 template gating | 2.2 · 3.2 |
| R-4 prefs table, email-only toggle | 1.2 · 3.5 |
| G-1 sixth type | 1.1 |
| G-2 six params | 1.1 · 2.3 |
| G-4 new mockup governs / 1.00 settled | 3.0 · 3.3 |
| G-5 per-role mockup for final approval | 3.0 |
| G-6 prefs split | 1.2 · 3.5 · §6 (m10) |
| G-7 ownership map | 1.1 |
| §7.21 vs §7.70↳/R-2 | Q-1 → 1.1 · 4.1 |
| §7.84 reopen trigger | Q-1 → 1.0 · 3.0 |
| §7.83 write clause | 1.1 · 4.1 |
| §7.66 report | 1.3 · 3.6 |
| §7.90 toggle | 3.3 |
| §7.64 (V-2 deferral) | 4.1 |
| §7.35 deferral (V-1) | 4.1 |
| Q-2 deletions | 1.1 |
| Q-3 kinds | 2.0 · 2.1 |
| Q-4 owner map | 1.0 · 1.1 |
| V-4 labels | 2.1 · 3.3 |
| V-5 toggle + fix | 2.4 · 3.3 |
| V-8 quarter window | — (recorded, named at approval) |
| V-9 mixed batches | 2.5 |
| V-10 active-only list | 1.3 · 3.6 |
| V-11 `updated_at` bump | 1.1 |

Every ruling maps to a step or a recorded closure — none dangling.

---

## 4. 🛡️ Security & Auth Model Statement (iron rule 9)

### 4.1 Policy table — exact `module_name` strings

| Table | Policy | Gate |
|---|---|---|
| `params` | SELECT (`params_select_all_authenticated`, existing) | `true` for `authenticated` (§7.83) — unchanged |
| `params` | **UPDATE** (`params_update_settings_or_owner`, new) | `edit` on `'הגדרות מערכת'` **OR** `owner_role_id = (select current_user_role_id())`; `with check` identical |
| `params` | **INSERT** (`params_insert_settings_only`, new) | `edit` on `'הגדרות מערכת'` only |
| `params` | **DELETE** (`params_delete_settings_only`, new) | `edit` on `'הגדרות מערכת'` only |
| `params` | ~~`params_write_ceo_only`~~ (FOR ALL) | **dropped** — replaced by the three above; **4 policies total after A** |
| `notification_preferences` | SELECT · INSERT · UPDATE (self) | `email = (select auth.email())` (the `users_update_self` precedent); no DELETE policy |
| `hostesses` (read for S6) | none new — DEFINER RPC | `list_hostesses_below_min_wage()`: owner of `שכר_מינימום_שעתי` OR `edit` on `'הגדרות מערכת'` |

All policies use the `(select …)` initplan wrap (§7.21 template). Policies are keyed by the Hebrew
`module_name` string byte-exact with `modules` (src/CLAUDE.md mine). **The write rewrite is a widening**
(deploy rule row 1) — no deployed code can break on apply. One permissive policy per command ⇒ no
`multiple_permissive_policies` advisor finding.

### 4.2 The RPC layer

Only one RPC is needed: the min-wage list, because the finance manager is `blocked` on 'דיילות' and a
client read returns `[]` with `error: null` (the project's central silent failure). Everything else is
plain table access under the policies above. Migration C also rewrites two m8 DEFINER functions
(`record_feedback`, `archive_project`) — bodies pulled live via `pg_get_functiondef` before editing
(the 12/08 `pr.cost` lesson); gates inside them untouched; `set search_path to ''` retained ⇒ every
added relation/user-function reference is `public.`-qualified.

### 4.3 The silent-failure doctrine (this module's core risk)

A settings write that RLS blocks returns `{data: null, error: null}` ⇒ every update goes through
`.select()` + `assertRowsAffected` (house pattern, `pricesApi.js`). A param the code reads by the wrong
name returns nothing and *looks* missing ⇒ the registry's names are tested byte-exact against the live
seed list at 2.1, both directions. **A role name copied from §7.70 sets `owner_role_id = NULL` with no
error** ⇒ migration A's loud-fail guard (§2.8) exists for exactly this. A template with a deleted required
variable would send a useless mail with no error ⇒ R-3's blocking is a save-time guard, and 2.2 tests
prove the block fires (the "watch the guard fail" rule). The client-side `< 3` copies in m8 exist to give
a friendly message before the DB raises ⇒ if only one side moves to the param they desynchronise silently
— 2.3 moves both, and the DoD greps the literal boundary **and the Hebrew "ל-3" strings** in those files.

### 4.4 UI gates

`/system/params` inherits `<ProtectedRoute allow={SYSTEM_MODULES}>` (existing; **`isAllowed` admits
`view` too** — a `view`-level holder reaches the tab and gets the read-only state A-11; a `blocked` role
never reaches it). `/my-settings` is open to every logged-in user (A-9) and renders only owned rows — the
UI is convenience; RLS is the wall. `canEdit` per row = `permissions['הגדרות מערכת'] === 'edit' ||
row.owner_role_id === user.roleId` (mirrors the policy exactly; the Topbar item uses the same first
predicate — one rule, one expression). Access denied blocks the **fetch**, not only the render
(C5 §5.6.17.5): the my-settings page queries with `owner_role_id = roleId`, never "all then filter".

### 4.5 Declared limitations

① RLS is row-level: an owner can technically change any column of her rows (name, type), not only
`param_value` — accepted for an internal 5-user tool; the UI never offers it (she cannot, however, change
or null her own `owner_role_id` — the `with check` forbids it). ② No "who changed what" audit (§7.70:
history not required; §7.23 deferred) — `updated_at` answers *when* only, **and migration A bumps it on
every mapped row (V-11)**. ③ Kind validation is client-side; `param_value` is `text` in the DB and cannot
carry a per-row CHECK — a Table-Editor edit bypasses validation (stated, not hidden). ④ The reliability
toggle can be flipped with almost no attendance data (1 row today) — the live count beside it is the
safeguard, by Ishay's sight, not by code. ⑤ `/my-settings` empty state is a fail-safe (unreachable under
either map). ⑥ A manager can change a param that alters another manager's screen (e.g. the satisfaction
threshold ⇒ the projects manager's archive gate) — the `affects` note is the only warning; no approval
flow. ⑦ `PROJECT_REPORT_BODY_TEMPLATE` (m6's summary-report mail) lives in code, not in `params` — the
one outgoing mail this screen cannot edit. ⑧ User email edits stay UI-blocked (m1) and §7.64's cascade
is deferred (V-2) — an SQL-side email change still fails loudly on the FK, by design; m9 adds a fifth FK
to `users(email)`. ⑨ The min-wage list ignores inactive hostesses (V-10).

---

## 5. 🗡️ DB Design Challenge (one line per sub-check, including "אין ממצאים")

| Sub-check | Examined | Finding |
|---|---|---|
| Keys & mutability | `params` PK `param_id serial` + `param_name` UNIQUE (natural key the code keys on — never renamed by the UI) · `owner_role_id integer` FK → `roles(role_id)` `on update restrict on delete set null` + covering index · `notification_preferences` PK `email` FK → `users(email)` `on update no action on delete cascade` (explicit; V-2) | אין ממצאים |
| Relationships & lineage | none — settings rows are leaves; templates are plain text | אין ממצאים |
| Lifecycle | no statuses; `updated_at` via `moddatetime` (exists on `params`; added on the new table) | אין ממצאים |
| Screen-to-column audit | every displayed figure: value ⇐ `param_value` · group counts ⇐ derived · "שינית N" ⇐ client state · attendance count ⇐ `count(assignments where attendance_status is not null)` · min-wage list ⇐ RPC · owner scope ⇐ `owner_role_id` · `affects` ⇐ registry · **the six new params had NO home — migration A is exactly that** | אין ממצאים after A |
| 🔮 Answerable-later | (א) overwritten: every edit overwrites `param_value` — §7.70 ruled no history; **accepted, stated to Ishay on the 02/09 page** · (ב) when: `updated_at` exists; *who* is unrecorded — accepted (§7.23) · (ג) not applicable — no journal | one accepted gap, zero columns added |
| Derived-vs-stored coherence | values are live; downstream snapshots (`vat_rate_snapshot`, `hourly_rate_snapshot`, frozen costs) already isolate closed documents — the pricing pane says so | אין ממצאים |
| Permissions↔RLS mapping | m9 writes on its own tables only; function bodies on m8's RPCs keep m8's gates; the policy change is a widening; **§7.21 vs §7.70↳ named (Q-1)** | one ruling conflict, routed to Ishay |
| Files/Storage | none | אין ממצאים |
| Temporal columns | `timestamptz` only | אין ממצאים |
| Migration checklist (db_roadmap §1) | embedded in 1.1 · 1.2 · 1.3; advisors after every apply; **the 13-check health battery** at 1.4 and 4.3 | — |
| Known reference-spec defects (§9) | #7 (W3 naming) — the live names rule; #8 (removed tariff param) — nothing to show | recorded so nobody "restores" them |

---

## 6. 🏗️ Phase & Step Plan

### Model & effort per phase

| Phase | Model | Effort | Why |
|---|---|---|---|
| 1 DB | Opus/Fable | High | RLS rewrite on a table every module reads; two DEFINER bodies edited live |
| 2 Logic | Sonnet | High | registry + contract tests; shared-surface rewires in five closed modules |
| 3 UI | Sonnet | High | six surfaces, RTL, states; the 🗣️/🎨 gates carry the product risk |
| 4 Ripples & integration | Sonnet | Medium | doc ripples + E2E + regression |
| 5 QA & handoff | Opus/Fable | High | closing audit re-verifies independently (fresh session) |

### Phase 1 — DB

> 🛑 **Phase-1 blocker table — closed into owning steps; Phase 1 does not open until each row is closed:**
>
> | # | The trap | Owning step |
> |---|---|---|
> | T1 | Migration C reads `סף_שביעות_רצון` — it must be seeded by A **before** C applies; C's body `raise`s in Hebrew if the row is missing/malformed — **but only on the paths that consult it** (§2.8) | 1.1 · 1.3 |
> | T2 | `param_type` CHECK (`params_param_type_check`) must be extended **before** the `shift_invites` rows are inserted, in the same migration, in that order; `on conflict (param_name) do nothing` on the insert (re-run safe) | 1.1 |
> | T3 | The existing write policy is `FOR ALL`; the SELECT policy is separate and stays, so nothing goes dark. **After A: exactly 4 policies** (`pg_policies`), one per command | 1.1 |
> | T4 | Ownership keys on `role_id` (integer) — the policy compares to `current_user_role_id()`; never on the Hebrew name. **And the `update … set owner_role_id = (select role_id from roles where role_name = …)` uses the LIVE names in §2.7, never §7.70's truncated ones — a wrong name yields NULL silently ⇒ the loud-fail guard** | 1.1 |
> | T5 | `notification_preferences` RLS-on with zero policies would be deny-all; the three self policies ship in the same migration | 1.2 |
> | T6 | `record_feedback`: `< 3` appears **twice** (guard + `case`) — replace both; `archive_project`'s live body is F's (`20260827155303`), not E2's — pull the LIVE body; keep every message's **wording and errcode**, and any message that hard-coded "3" takes the threshold as a `%` argument | 1.3 |
> | T7 | new-function grants: `revoke … from public, anon, authenticated` then grant `authenticated`; verify `proacl`; re-issue the same for the two rewritten functions (signature unchanged, ACL preserved, but written explicitly) | 1.3 |
> | T8 | `moddatetime` lives in `extensions` — `execute function extensions.moddatetime('updated_at')` | 1.2 |
> | T9 | **Destructive rows (Q-2):** for each deleted param, `git log -S'<name>' --name-only` then `git show origin/main:<file> \| grep -n '<name>'` on every listed file (migrations/CLAUDE.md's command form) — **run at draft: both clean on `73c61d5`** (seed migrations · docs · one tombstone comment); re-run at 1.0 against the then-current `origin/main`; **`db_roadmap` §9א read first** | 1.0 · 1.1 |
> | T10 | Both m8 functions run with `set search_path to ''` — every **relation and user-defined function** `public.`-qualified (`pg_catalog` builtins like `btrim`/`coalesce`/`now()` need none); every column in the RPC `h.`-qualified (OUT names collide) | 1.3 |
> | T11 | ✅ **Q-1 / Q-2 / Q-4 ruled 02/09** — A's row list is **43**, the owner map is the natural-owner reading, the guard asserts **38** | 1.0 ✅ |
> | T12 | The struck `🚧 מ8 · 🚧 מ9` (ה30) — `quote_services_select_by_permission` exists (verified 02/09); re-read its `qual` at 1.0 to confirm the cost tightening; if absent, a `🚧 מ9` revives | 1.0 |
> | T13 | `hostesses.hostess_id` is **`bigint`** — a `RETURNS TABLE(hostess_id integer, …)` fails at first call with `42804` | 1.3 |
> | T14 | While this file is `module-9.draft.md` the Stop hook does not enforce rule 15 for m9 — **rename at approval, before 1.0** | approval |

**Step 1.0 · 🔻👤 Phase door**
**🤖 half:** `git fetch origin` + `git log origin/dev..HEAD` (empty or only this module's commits) · MCP live (`select version()`) · re-measure: `params` count = 39 · `param_type` distinct = 5 · policies on `params` = 2 · T9 for each doomed param against current `origin/main` · T12 `qual` check · `E2E_*` pairs = 5 and confirm `STAFF` = `מנהלת לוגיסטיקה` live · the five `roles.role_name` strings byte-exact · unit baseline `npm run test:run` (record files/tests) · no other OPEN micro-guide · `db_roadmap` §9א read.
**👤 half:** ask Ishay whether another session is writing (rule 16) · **Q-1, Q-2, Q-3, Q-4 if still open** (normally ruled at blueprint approval — re-ask only if not) · offer sequential vs agent-batched build (his 26/08 standing ruling: he picks).
**🔻👤 Verify:** measurements reported + checkpoint answered.
**🌊 אדוות —** ·

**Step 1.1 · Migration A — `params` owner column · sixth type · 6 rows · owner map · deletion(s) · policy rewrite**
**Goal:** the data model for ownership and the six new business parameters.
**Files:** `supabase/migrations/<ts>_module9_a_params_owner_types_seed.sql`.
**What to do:** Hebrew why-header citing §7.70 + R-2 + G-1/G-2 + Q-2's ruling + §7.83's write clause + §7.21's supersession (Q-1) + the T9 result with the `origin/main` SHA · `alter table public.params add column owner_role_id integer null` + FK `references public.roles(role_id) on update restrict on delete set null` + covering index `params_owner_role_id_idx` (C-1) · drop + re-create `params_param_type_check` with six values (T2) · `insert … on conflict (param_name) do nothing` the six rows (names/values/types in §2.2; `param_value` as text) · `update params set owner_role_id = (select role_id from public.roles where role_name = '<LIVE NAME>')` per the map Q-4 ruled (T4) · **the loud-fail `do $$ … raise $$` guard on the owned-row count (31 or 38)** · `delete from params where param_name in (…)` per Q-2 · drop `params_write_ceo_only`; create the three command policies per §4.1 · `comment on column params.owner_role_id`. **Migration Design Checklist (db_roadmap §1) embedded:** §7 scan (§7.70/§7.83/§7.84/§7.21) · RLS §7.21 wrap · FK actions explicit · seed exception applies (params) · typed-echo · schema regen · advisors · ripple rows.
**Verification (🤖 after the typed echo):** `select count(*) from params` ⇒ **43** (Q-2) · `select count(distinct param_type)` ⇒ **6** · `select count(*) from pg_policies where tablename='params'` ⇒ **4** · `select count(*) from params where owner_role_id is not null` ⇒ **38** (Q-4; the guard already raised if not) · impersonated as finance: `update params set param_value=param_value where param_name='אחוז_מעמ' returning 1` ⇒ **1 row** (positive control) and the same on `משקולת_היענות` ⇒ **0 rows**; as recruitment the mirror image; as CEO all ⇒ 1 · advisors: zero new unexplained, **and no `multiple_permissive_policies` on `params`**.
**מה ייחשב עובד:** *(source: R-2 + guide ①ו)* — מנהלת הכספים יכולה לעדכן את המע"מ ולא את משקולות ההתאמה · מנהלת הגיוס — ההפך · המנכ"ל יכול לעדכן הכול · שש ההגדרות החדשות קיימות עם הערכים שהיו בקוד (24 · 48 · 72 · 3 · 10 · 7) · השורות שהוכרע למחוק נעלמו, ולא אחרות.
**🔻👤** typed echo of the migration name before apply. **🗣️ אושר —** · **🌊 אדוות —**

**Step 1.2 · Migration B — `notification_preferences`**
**Goal:** the preferences table (R-4, G-6).
**Files:** `supabase/migrations/<ts>_module9_b_notification_preferences.sql`.
**What to do:** why-header citing the §6 line (07/07) + R-4 + V-2 (why `on update no action` is explicit) · `create table public.notification_preferences` with the four columns of §2.8 exactly (PK `email`; FK `on update no action on delete cascade`; two booleans `not null default false`; `created_at`/`updated_at timestamptz not null default now()`) · `enable row level security` · trigger `extensions.moddatetime('updated_at')` (T8) · three self policies (SELECT/INSERT/UPDATE, `email = (select auth.email())`, `with check` same) (T5) · `comment on table`. **No second index on `email` (the PK covers C-1); no grants (table rule).** **Migration Design Checklist embedded** (§7 scan: **none — the authority is the §6 line 07/07 and `db_roadmap` A-24** · RLS §7.21 · FK actions explicit · timestamptz · moddatetime · typed-echo · schema regen · advisors · ripple: A-24 struck).
**Verification:** `pg_policies` on the new table ⇒ 3 · impersonated as projects manager: insert own row ⇒ 1, read another's ⇒ 0 · `pg_constraint` shows `confupdtype='a'`, `confdeltype='c'` · advisors: no `rls_enabled_no_policy` for the new table.
**מה ייחשב עובד:** *(source: §6 07/07 + R-4)* — כל משתמש יכול לשמור לעצמו העדפה ולא לראות של אחרים · ההעדפה שורדת רענון.
**🔻👤** typed echo. **🗣️ אושר —** · **🌊 אדוות —**

**Step 1.3 · Migration C — threshold functions + min-wage RPC**
**Goal:** the satisfaction threshold has one DB source (`params`), and the min-wage list is readable by its owners.
**Files:** `supabase/migrations/<ts>_module9_c_threshold_functions_and_min_wage_rpc.sql`.
**What to do:** pull `pg_get_functiondef` for `record_feedback` and `archive_project` (T6) · `create or replace` each per the §2.8 threshold contract (read on the consulting paths only; `raise` Hebrew `P0001` naming `סף_שביעות_רצון` if null/malformed; `< 3` ⇒ `< v_threshold`; messages interpolate `%`); bodies otherwise byte-identical (state the exact diff in the header; T10 qualification) · `create function public.list_hostesses_below_min_wage()` per §2.8 (T13 types · `stable` · V-10 `status='active'` · owner-first gate) · grants per T7 for all three. **Migration Design Checklist embedded** (§7 scan: §7.66/§7.80 · no new table · DEFINER + `search_path` · typed-echo · schema regen · advisors · ripple: §6 report line struck at 4.1).
**Verification:** `pg_get_functiondef` of both m8 functions contains `סף_שביעות_רצון` and no `< 3` · `record_feedback(p_mark_no_response ⇒ true)` on a rolled-back fixture succeeds even with the param row temporarily renamed (the "paths that never consult it" contract, proven then rolled back) · as finance: `select * from list_hostesses_below_min_wage()` ⇒ **0 rows, no error** (nobody active is below 35 today; then inside a rolled-back transaction set the param to 40 ⇒ **2 rows**) · as logistics manager ⇒ `42501` · `proacl` shows `authenticated` only on all three · advisors zero new unexplained.
**מה ייחשב עובד:** *(source: guide ①ג + §7.66)* — סף שביעות-הרצון חי במקום אחד גם במסד · העלאת שכר-המינימום מציגה מיד מי מתחתיו · סימון "לא ענה לסקר" עובד גם אם הסף חסר.
**🔻👤** typed echo. **🗣️ אושר —** · **🌊 אדוות —**

**Step 1.4 · 🔻👤 Phase-1 gate ⚠️ shared-surface (`docs/schema.sql`)**
`get_advisors` security + performance (zero new unexplained, or a written triage) · **DB health battery (`docs/db_health_checks.md`, 13 checks — report `נבדקו 13 · נכשלו 0`, never a bare list)** · regenerate `docs/schema.sql` from `pg_catalog` (DB protocol; no function bodies) · `db_roadmap.md` §10 Done rows + A-24 struck + `params` §6 row · **`docs/reference_spec/products_and_params.md`: sixth type + six rows + the Q-2 strikes + `owner_role_id`** · commit migrations + `schema.sql` together with explicit pathspecs · `npm run gate` exit 0.
**🌊 אדוות —** ·

### Phase 2 — Business logic

**Step 2.0 · Phase-2 door** — ledger sweep: **Q-3 (kinds) must be ruled** (normally at approval); A-6/A-7 briefs are Phase-2/3 items; baseline re-count.

**Step 2.1 · `src/lib/paramsRegistry.js` + `.test.js` · 🗣️ labels brief**
**Goal:** one code home for label · hint · kind · unit · group · `affects` · validation of every param (§2.8 contract, V-6).
**What to do:** **before writing the file**, post the 🗣️ brief with the proposed label + hint + `affects` sentence per param (A-6) and wait for Ishay's nod · then export `PARAM_REGISTRY` (43 entries) · `PARAM_GROUPS` · `validateParamValue(entry, value)` composing the existing validators (§2.8) · `weightsSumOk` · `distanceOrderOk` · `matchesParamSearch` (label OR `param_name`) · `parseForDisplay`. Labels for the 12 drawn params from the mockup **except the gate label (V-4)**.
**Tests:** every registry name ∈ the live seed list (fixture dated, re-pulled at 1.0) and vice-versa · each kind's accept/reject table · the sum rule reddens on 0.40/0.35/0.30 · the order rule reddens on goalpost 90 / gate 80 · search finds `שער_מרחק_קמ` by `מרחק` and by its DB name · a registry entry with no live row fails the test (both directions).
**מה ייחשב עובד:** *(source: guide ①ב + Q-3)* — ערך לא תקין נדחה עם משפט בעברית שאומר מה תקין · חיפוש מוצא לפי שני השמות · כל שם בקוד קיים במסד ולהפך.
**🗣️ אושר —** · **🌊 אדוות —**

**Step 2.2 · `src/lib/emailTemplates.js` + `.test.js`**
**Goal:** the template⇐placeholders contract (§3.7) and `templateSaveVerdict(name, body)` (R-3).
**What to do:** export `TEMPLATE_PLACEHOLDERS` · `templateSaveVerdict` ⇒ `{ status: 'ok'|'warning'|'blocked', missingRequired[], missingOptional[], unknown[], message }` · reuse `findUnknownPlaceholders` from `email.js` for the unknown set (never a second regex).
**Tests:** per template: full body ⇒ ok · required removed ⇒ blocked with the token named · optional removed ⇒ warning · a typo token ⇒ blocked · **consistency:** every token in the seeded bodies (fixture from DB, dated) is in `required ∪ optional`, and every required token of the invite is one `buildShiftInvitePayload` actually fills (import the builder, run it with a full fixture, assert the placeholder is consumed).
**מה ייחשב עובד:** *(source: R-3)* — מחיקת הלינק מזימון-משמרת חוסמת שמירה ואומרת למה · מחיקת "עיר האירוע" מזהירה ומאפשרת · שגיאת-כתיב בסוגריים נחסמת.
**🗣️ אושר —** · **🌊 אדוות —**

**Step 2.3 · ⚠️ shared-surface — six constants become params (+ `src/api/params.js`)**
**Goal:** every reader of the six values reads `params`; no hard-coded copy remains in `src/`.
**Per-constant ripple table (the contract; measured 02/09):**

| Param | Pure function(s) gaining an argument | Consuming screens | Loader |
|---|---|---|---|
| `שעות_תוקף_זימון` (48) | `inviteHoursLeft` · `isInviteExpired` · `assignmentDisplayStatus` (`hostesses.js`) · `projectTeam.js:146` · `assignmentActions.js:102` | m4 `SmartMatchPage` (`:684-685`) · m4 `HostessViewCard` (`:386`) · m4 `api.js:511` · **m6 `TeamTab` (`:352-361`)** | m4: `HOSTESS_PARAM_NAMES` +1 (existing loader) · **m6 TeamTab: new `getParamValues` call + load/error state** |
| `שעות_סף_זימון_לפני_אירוע` (24) | `isWithinFinalDay` | m4 `SmartMatchPage:144` (its boolean is passed down to `assignmentActions`) | m4 existing loader +1 |
| `שעות_אירוע_דחוף` (72) | `isUrgentEvent` | m4 `SmartMatchPage:153` | m4 existing loader +1 |
| `ימי_אזהרה_הצעה_פגה` (7) | `deriveQuoteExpiry` 4th argument | m3 `QuotesPage` (`:242`, `:609`) | m3 `QUOTE_SCREEN_PARAM_NAMES` +1 (existing loader) |
| `סף_לוגיסטיקה_ימי_עסקים` (10) | `amberMark` | **m5 `LogisticsPage:505`** | **new `getParamValues` call + load/error state** |
| `סף_שביעות_רצון` (3) | `needsSatisfactionAttention` · the m8 client gates (`ClosingWindowDialog.jsx:226/:291/:1556`) · **the two Hebrew strings `ClosingWindowDialog.jsx:150/:1146`** · `FinancePage.jsx:857/:906` | m2 `CustomersPage:86` · **m8 `FinancePage` + `ClosingWindowDialog`** | m2 `getCustomerScreenParams` +1 · **m8: new `getParamValues` call (once in `FinancePage`, passed to the dialog)** |

**What to do:** create `src/api/params.js` (§2.8) · apply the table row by row; a missing param stops with a Hebrew message, never a default · delete the six constants (knip flags any survivor) · **do not touch `SCORE_TAGS`/`SCORE_LABELS`** (§7.80 boundary; the customers.js comment `:25-28` documents the deliberate duplication).
**Verification:** `grep -rn "INVITE_VALIDITY_HOURS\|INVITE_CUTOFF_HOURS_BEFORE_EVENT\|URGENT_EVENT_HOURS\|AMBER_BUSINESS_DAYS\|EXPIRING_SOON_DAYS\|SATISFACTION_ATTENTION_MAX" src/` ⇒ **0** · `grep -n "< 3\|<3\b\|ל-3" src/modules/08_finance/*.jsx src/lib/customers.js` ⇒ **0** (the literal boundary, numbers inside Hebrew strings included) · m2/m3/m4/m5/m6/m8 suites green · `npm run test:run` ≥ baseline · mutation check: `שעות_תוקף_זימון` fixture = 1 flips `isInviteExpired`.
**מה ייחשב עובד:** *(source: guide ①ו)* — שינוי "שעות תוקף זימון" במסך משנה מתי זימון נחשב פג, בלי לגעת בקוד · סף שביעות-הרצון חי במקום אחד גם במסכים, כולל בטקסטים שמציגים אותו.
**🗣️ אושר —** · **🌊 אדוות —** (m2/m3/m4/m5/m6/m8 §10 cross-ref lines: their constants moved).

**Step 2.4 · ⚠️ shared-surface — `smartMatch.js` reliability company average (V-5)**
**Goal:** `reliabilityScore` is damped toward a **reliability** company average, not the responsiveness one (research §"מרכיב 2"; §6 `🚧 מ9 ← מ4/מ6`).
**What to do:** add `companyReliabilityAverage(records)` · `rankCandidates` feeds it to `reliabilityScore` · tests: with weight 0 the ranking is byte-identical to before (the dormant guarantee) · with weight 0.35 and two fixtures the new average changes the order as the research predicts.
**Verification:** m4 Smart Match suites green; the hand anchors in `smartMatch.test.js` unchanged.
**מה ייחשב עובד:** *(source: §6 line)* — כשהמתג יודלק, מרכיב-האמינות יחושב מול ממוצע-אמינות ולא מול ממוצע-היענות.
**🗣️ אושר —** · **🌊 אדוות —** (m4/m6 §10 cross-refs; §6 line struck at 4.1).

**Step 2.5 · `src/modules/09_settings/api.js` + tests**
**Goal:** every Supabase access of the module in one file (rule 14).
**What to do:** `listParams()` (all rows incl. `owner_role_id`) · `listMyParams(roleId)` (queries `eq('owner_role_id', roleId)`) · `updateParams(changes, { roleId, canEditAll })` per §2.8 incl. the mixed-ownership refusal (V-9) · `listBelowMinWage()` (RPC) · `getNotificationPreferences()` / `saveNotificationPreferences(prefs)` (upsert on `email`) · `countAttendanceRows()` (A-10) · error mapping in Hebrew (`toError`).
**Tests:** mocked client — sequential update stops at first failure and names the row; 0 rows ⇒ throws (never "נשמר"); a batch with a non-owned row is refused before any write.
**מה ייחשב עובד:** *(source: V-9 + src/CLAUDE.md)* — שמירה שנחסמה במסד לעולם לא מוצגת כ"נשמר" · קבוצה מעורבת לא נשלחת בכלל.
**🗣️ אושר —** · **🌊 אדוות —**

**Step 2.6 · 🔻👤 Phase-2 gate** — full unit suite ≥ baseline, `gate` exit 0, zero regressions, m2/m3/m4/m5/m6/m8 suites named in the report.

### Phase 3 — UI

**Step 3.0 · 🔻👤 Phase-3 door — shared components + the updated mockup (G-5) + Q-1 applied**
List what repeats across S1–S4 (value field + unit pair · group list · save row · gating note) and rule shared/local (3+ surfaces ⇒ `src/components/`; check `LtrFieldGroup`, `StatTile`, `LoadingOrError`, `PermissionAwareEmpty`, `ToastProvider` first). **Draw `02_params_tab_roles_and_states.html` on live values:** the finance manager's "ההגדרות שלי" view (her rows only) · the recruitment manager's view (the full Smart Match pane in owner wording) · the CEO's full tab · the four undrawn states (loading · error+retry · view-only · save-failed) · the template editor's blocked state (R-3 sentence) · the reliability toggle with the live count · **and the `מחירים` tab without `PricingParamsCard` (Q-1)**. **Present to Ishay for final approval before any screen code (his 02/09 ask).**
**🗣️ אושר — `02/09/2026 22:02`, Ishay: *"הסתכלתי על המוקאפ שלו אני מאשר"*** (v2 `02_params_tab_roles_and_states.html`, drawn by a Sonnet builder on live values; v1's direction stands, v2 adds the per-role views, the undrawn states, the corrected distance label, the `מחירים` tab without the card, and the profile toggles). One approval for all Phase-3 screens per his 27/08 preference; the 🎨 gate at 3.7 is the built-screen check. · **🌊 אדוות —** none (mockups are tier 4; the registry is the label SSOT).

**Step 3.1 · S1 `ParamsTab.jsx` + route swap ⚠️ shared-surface (`App.jsx`)**
Master-detail per the mockup: search box (right-side magnifier, both names) · group list with counts · generic pane: label · value field (`dir="ltr"`, `select()` on focus, unit beside it in one `inline-flex` wrapper — the LTR-pair rule) · hint · `affects` note · save row "שינית N מתוך M" · `LoadingOrError` skeleton · success toast · save-failed row naming the param; **a field error never clears other fields** (C5 §5.6.17.4) · `canEdit` per §4.4 · view-only state (A-11). `App.jsx`: `params` route → `<ParamsTab />`. **Per Q-1:** `PricesManagementPage` drops `PricingParamsCard` (and `pricesApi`'s two param functions). Tests: renders 6 groups · validation message appears before save · a `view`-level permission map renders read-only · a mixed batch is never sent.
**מה ייחשב עובד:** *(source: guide ①ב + mockup א׳)* — המנכ"ל רואה 6 קבוצות, מחפש, משנה ערך ורואה "ההגדרות נשמרו"; ערך שגוי לא נשמר ולא מוחק שדות אחרים.
**🗣️ אושר —** · **🌊 אדוות —**

**Step 3.2 · S2 `TemplateEditor.jsx`**
Template list · body textarea (RTL) · chips of allowed variables (click inserts at caret) · live verdict from `templateSaveVerdict`: blocked ⇒ save disabled + the sentence; warning ⇒ amber note, save enabled · missing chips highlighted (mockup ג׳'s `.chip.miss`). Only `templates`-type rows present in `TEMPLATE_PLACEHOLDERS` open the editor; any other `templates`-typed row (a URL) renders as a plain kind row.
**מה ייחשב עובד:** *(source: R-3 + mockup ב׳/ג׳)* — מחיקת הלינק מהזימון חוסמת עם המשפט; החזרת המשתנה מהצ'יפ משחררת.
**🗣️ אושר —** · **🌊 אדוות —**

**Step 3.3 · S3 `SmartMatchPane.jsx`**
The warning banner (CEO wording in the tab, owner wording in "ההגדרות שלי" — §3.7) · sum bar green/amber · weights + distances with the corrected labels and the order rule · **partial row set: if either distance row is absent the distance block and its rule are hidden, never half-rendered** · `מרכיב_אמינות_פעיל` as a `Switch` with an amber note carrying the live count: "N שורות-נוכחות קיימות מתוך M שיבוצים" — no hard-coded minimum (none was ruled).
**מה ייחשב עובד:** *(source: G-4 + §7.90)* — משקולות שלא מסתכמות ל-1.00 לא נשמרות; המתג מציג כמה נתוני-נוכחות יש לפני שמדליקים.
**🗣️ אושר —** · **🌊 אדוות —**

**Step 3.4 · S4 `MySettingsPage.jsx` + Topbar item ⚠️ shared-surface**
Route `/my-settings` (A-9) · page title "ההגדרות שלי" · reuses S1–S3 components with `rows = listMyParams(user.roleId)` · empty state string (§3.7) · Topbar menu item hidden when `permissions['הגדרות מערכת'] === 'edit'` (V-7) · `App.routes.test.jsx` allowlist updated with a why-comment.
**מה ייחשב עובד:** *(source: R-2)* — מנהלת הכספים פותחת "ההגדרות שלי" ורואה רק את ההגדרות שלה; מנהלת הלוגיסטיקה רואה את שלה; המנכ"ל לא רואה את הפריט (יש לו את הלשונית).
**🗣️ אושר —** · **🌊 אדוות —**

**Step 3.5 · S5 profile `NotificationsSection` ⚠️ shared-surface**
Email toggle bound to `notification_preferences` (load → toggle → save with `.select()`); helper text (§3.7) · SMS toggle stays `disabled`, label "אין ערוץ SMS במערכת" · **both "(בקרוב)" suffixes removed** and the stale comment above the section rewritten (rule 13(ח)).
**מה ייחשב עובד:** *(source: R-4)* — מדליקה "מייל על פרויקטים חדשים", מרעננת, המתג נשאר דלוק; SMS אומר את האמת; אין "(בקרוב)" בשום מקום.
**🗣️ אושר —** · **🌊 אדוות —** (m1 §9 cross-ref: the toggles are live).

**Step 3.6 · S6 `BelowMinWageList.jsx`**
Beside `שכר_מינימום_שעתי` (in S1 and in S4 for the finance owner): count + names + rates from the RPC (active hostesses only, V-10); empty ⇒ "אין דיילות פעילות מתחת לרף הנוכחי"; blocked (42501) ⇒ hidden, never `0`.
**מה ייחשב עובד:** *(source: §6 `🚧 מ9 ← מ4` + §7.66)* — כשמעלים את הרף ל-40, שתי דיילות פעילות מופיעות ברשימה מיד; כשמורידים — הרשימה ריקה ואומרת זאת.
**🗣️ אושר —** · **🌊 אדוות —** (§6 report debt struck at 4.1).

**Step 3.7 · 🔻👤 Phase-3 🎨 gate** — Ishay's review on live screenshots: §4 design conformance · states (loading/empty/error/success/view-only) · keyboard + focus ring · validation completeness · "should anything be redesigned?". The five pre-show passes (src/CLAUDE.md) run before, with the bidi `Range` measurement on the value/unit pairs.

### Phase 4 — Ripples & integration

**Step 4.1 · Doc ripples** — §6: strike `🚧 מ9 ← מ4` (report) · `🚧 מ9 ← מ4` (params screen) · `🚧 מ9 ← מ4/מ6` (average) with the measurement each; the prefs line stays live for מ10 with an "m9 half paid" note · §7.70 progress note (executed: map + typed validation; history never) · **§7.21 sub-note: record-level ownership introduced for `params` only, by §7.70↳/R-2 (Q-1)** · §7.83 write-clause sub-note · §7.84 Q-1 outcome sub-note · §7.64 V-2 sub-note (deferred, why; five FKs now) · §7.35 target → מ12 (V-1, dated, overridable) · `db_roadmap` A-24 struck, `users`/`params` §6 rows, §7 matrix row · `products_and_params.md` (if not done at 1.4) · **STATUS "מטלות פתוחות" 08/08 line gets the R-1 update** + module row · **the step guide's ⑥1 `§5.16` pointer fixed + a "מה נבדק ומה לא" header** · **`docs/micro_guides/module-9-interview.md` folded and deleted** · deviation notes (§10 block) · `shiftEmails.js:254` tombstone re-pointed per Q-2 (if not done at 1.1) · m1/m2/m3/m4/m5/m6/m8 §10 cross-refs · this guide's §10.
**מה ייחשב עובד:** *(source: iron rule 13)* — `grep '🚧 מ9' docs/PROJECT_MASTER.md` מחזיר רק את שורת-ההתראות החיה; קובץ-הראיון נעלם; מדריך-הצעדים מצביע ל-C5 §5.6.16.
**🗣️ אושר —** (not a product unit — the slot stays `—`) · **🌊 אדוות —**

**Step 4.2 · E2E ⚠️ shared-surface (`e2e/**`)** — `e2e/settings.spec.js` (network-intercepted writes only; the one real write is the RLS proof with a manager JWT that must return 0 rows) · smoke anchors (+ the Q-1 move of `prices.vat`) · accessibility list · **re-point `prices.spec.js`/`smoke.spec.js` per Q-1**.
**מה ייחשב עובד:** *(source: e2e/CLAUDE.md)* — הבדיקה מוכיחה גם שהחסימה חוסמת (0 שורות למנהלת על שורה שאינה שלה), לא רק שהמסך נראה נכון.
**🗣️ אושר —** (n/a) · **🌊 אדוות —**

**Step 4.3 · Full regression** — `npm run gate` · `npm run test:e2e` (preview config) · `npm run smoke` (separately, by name) · DB health battery again (functions changed) · report every gate BY NAME with its number.
**Step 4.4 · 🔻👤 Phase-4 gate.**

### Phase 5 — QA & handoff

**Step 5.1 · Live acceptance journeys (credentialed, evidence-spec pattern, restore after, no new rows):** ① CEO sets `אחוז_מעמ` 18→17, opens the quote builder and reads 17% in the **un-saved** form's totals (never saves a quote — e2e/CLAUDE.md), sets it back to 18, **then re-runs `npm run smoke` (its VAT anchor is a live-value fixture)** · ② finance manager edits `אחוז_מעמ` from "ההגדרות שלי" and cannot see the weights · ③ template save with the invite link removed ⇒ blocked · ④ profile toggle round-trip survives a refresh.
**Step 5.2 · 🔻👤 Closing audit** — `module-close` in a FRESH session; typed-echo DoD; PR instructions + 🧩 handoff.

---

## 7. 📊 QA Matrix

| Test type | Planned | As-run (closing audit fills) |
|---|---|---|
| Unit | registry (names both ways · kinds · sum · order · search) · template verdicts + builder consistency · six param readers (mutation checks) · smartMatch average (dormant + active) · api.js (mixed batch refusal) | |
| Integration | impersonated RLS: positive control (CEO) · owner ok / non-owner 0 rows (both directions) · prefs self-only · RPC 42501 for logistics · the "paths that never consult the threshold" proof | |
| E2E | `settings.spec.js` · smoke anchor · axe on both screens · re-pointed `prices.spec.js` | |
| Regression | m2/m3/m4/m5/m6/m8 suites · `gate` · full `test:e2e` + `smoke` | |
| UAT | Ishay drives journey ① at 5.1 | |
| Security/Pen | policies count on `params` = 4, one per command · no policy-less table · RPC ACL · advisors · `search_path` on the 3 functions | |
| Performance | N/A — ≤45 rows | |
| Usability | 3.0 mockup approval + 3.7 🎨 gate + closing UX audit | |
| Compatibility | Chromium (house); cross-browser = M12 | |

### 🔴 The measured boundary of the automated gates
`npm run test:e2e` excludes the smoke suite; E2E and smoke do not run in CI; `npm run gate` is not what
CI runs and `check:docs-structure` runs nowhere automatically; `check:bidi` misses the value/unit pair
family (needs a live `Range` measurement); ESLint is not a compile gate; **the Stop hook ignores a
`.draft` guide**. Every gate result is reported by name.

## 8. ✅ Definition of Done

### 8.1 Canonical (instantiated)
- [ ] `npm run verify`/`gate` green · full suite ≥ baseline, zero regressions (numbers recorded)
- [ ] 3 migrations applied via MCP after typed echo · `docs/schema.sql` regenerated · committed together
- [ ] `db_roadmap.md` rows flipped (A-24 · users · params · §7 matrix) · §6 inbound `🚧 מ9` debts struck against measurement · `products_and_params.md` updated
- [ ] §7.70 / §7.21 / §7.83 / §7.84 / §7.64 / §7.35 updated at the item; snapshot counts re-derived
- [ ] `CLAUDE_CODE_LOG` + `STATUS` current (incl. the 08/08 task line) · interview file deleted · step guide ⑥1 pointer fixed

### 8.2 Module-specific (each with its measurement)
- [ ] `select count(*) from params` = **43** · 6 distinct types · **4 policies** · owned rows = **38**
- [ ] impersonated proof: finance updates `אחוז_מעמ` (1 row) and not `משקולת_היענות` (0 rows); recruitment the mirror; positive control first
- [ ] `notification_preferences` exists with 3 self policies; a saved toggle survives refresh (live)
- [ ] `record_feedback` and `archive_project` contain `סף_שביעות_רצון` and no `< 3` (`pg_get_functiondef`); `no_response` marking works with the param row absent (rolled-back proof)
- [ ] `grep` for the six old constants over `src/` ⇒ 0 **and** `grep "< 3\|<3\b\|ל-3" src/modules/08_finance/*.jsx src/lib/customers.js` ⇒ 0
- [ ] journey ①: the un-saved quote form computes with the changed VAT (live, restored after, smoke re-run)
- [ ] template with the invite link removed ⇒ save blocked (unit + E2E + live)
- [ ] `PricingParamsCard` gone from the `מחירים` tab (if Q-1 as recommended) and no testid `param-vat` remains asserted anywhere
- [ ] DB health battery: `נבדקו 13 · נכשלו 0`

### 8.3 UX & validation
- [ ] 3.0 mockup approved by Ishay (per-role + states) · 3.7 🎨 gate passed · every spec-silent validation was confirmed at a 🗣️ brief

### 8.4 Post-merge note — NOT audit checkboxes
PR opened base:`dev` · CI green · merged — after the closing audit's YES; the audit confirms *mergeable*, never merges.

## 9. 🔄 Self-Update Protocol

(a) At every step transition, update §1 (header + step table) in the same session, before moving on. (b) Any deviation → inline `↳ as-built` on the step + a dated §10 line. (c) The Stop hook blocks session end if `src/modules/09_settings/**` changed but this guide didn't — **only once this file is named `module-9.md`**. (d) The `CLAUDE.md` end-of-session protocol applies (LOG → STATUS). (e)–(g): per CLAUDE.md iron rules 13/15/16 + the end-of-session protocol. (h) On ENTERING a phase: sweep §3.4/§3.5/§3.6 for items anchored to it and settle them with Ishay at the phase door, not mid-step. (i) Compaction: a closed phase compacts to a done-table + carry-forward; never the active phase, §3, or §10; archive the pre-compaction copy first.

## 10. 📝 Deviations & Tech-Debt Log

### Deviations from the frozen spec (C5/C6) — each with its authority
| Deviation | From | Authority |
|---|---|---|
| Non-CEO editing of owned params | C5 §5.4.1 "המשתמש היחיד בעל גישה למודול הגדרות מערכת"; §7.21 "בלי בעלות ברמת-רשומה" | §7.70 map (Ishay 23/07) · R-2 (02/09) · §7.84's own reopen trigger · Q-1 |
| Sixth `param_type` | C6 §2.4.9 closed five-value enum | G-1 (Ishay 02/09) |
| Fifth column `owner_role_id` on `params` | C6 §2.4.9 four columns | R-2 (mechanism, Claude; disclosed) |
| New table `notification_preferences` | C5/C6 silent | §6 line (Ishay 07/07) · R-4 |
| Six new params | C5/C6 silent | G-2 (Ishay 02/09) |
| Search across settings | C5 §5.6.17.1 defines filtering elsewhere | guide §①ב (world convention, direction approved 28/08) |
| Deletion of `תבנית_איפוס_סיסמה` | C5 §5.8.9 names the mail | Q-2 (Ishay) — Supabase Auth sends it; 0 readers |
| Deletion/keeping of `קישור_בסיס_סקר_לקוחות` | C5 §5.6.16 names the link | Q-2 (Ishay) — the link is now minted per project (m8) |
| Reliability toggle | C5/C6 silent | §7.90 (Ishay 08/08) |
| `PricingParamsCard` removed from the `מחירים` tab | §7.84 (Ishay 14/07 + 30/07) | Q-1 (Ishay) — §7.84's own reopen trigger |

### Dated entries
- `02/09/2026 22:1X` — **Phase-3 door (3.0): shared-component checkpoint + work split, derived from the approved v2 mockup section by section** (Ishay: *"רק תעבור על המוקאפ שתחלק עבודה בהתאמה"*). **Inventory pass (measured):** `src/components/` has `Ltr` · `LtrFieldGroup` · `LoadingOrError` · `PermissionAwareEmpty` · `StatTile` · `ToastProvider` · `ui/switch` (RTL-patched) · `ui/dropdown-menu` · `ui/input` · `ui/button` — reused, never re-created. **What repeats across S1/S3/S4 (3 surfaces ⇒ shared, but all three live in m9 ⇒ `src/modules/09_settings/components/`, not `src/components/`):** `ParamRow` (label · value field + unit in one `inline-flex` LTR wrapper · hint · `affects` amber note · per-row error · disabled/view-only) · `SaveRow` ("שינית N מתוך M" · ביטול · שמור · the save-failed line naming the param) · `GroupList` (group label + count, active state) · `useParamsForm` (draft values, dirty count, per-row validation via the registry, mixed-batch guard before `updateParams`). **Pane wiring contract (so builders stay parallel):** `ParamsTab` renders a generic pane per group and takes an optional `paneComponents` map `{ templates: TemplateEditor, smart_match: SmartMatchPane }`; the wiring itself lands in wave 2. **Wave 1 (parallel, disjoint files):** **A (Opus)** = S1 `ParamsTab` + the four shared pieces + S6 `BelowMinWageList` (mockup §1 · §4 · §8 · §10) + route swap + `PricingParamsCard` removal + `pricesApi` cleanup · **B (Sonnet)** = S2 `TemplateEditor` (mockup §3, three states) · **E (Sonnet)** = S5 profile `NotificationsSection` (mockup §9). **Wave 2 (after A):** **C (Sonnet)** = S3 `SmartMatchPane` on A's `ParamRow` (mockup §2 + §6's owner wording, partial-row rule, live attendance count) · **D (Sonnet)** = S4 `MySettingsPage` + Topbar item + routes-test allowlist + the pane wiring (mockup §5–§7). E2E re-points (`prices.spec.js` / smoke anchors) stay in 4.2. **Mockup v2 disclosures accepted as drawn:** group order (registry's) · save-failure reason text is illustrative · the warning-state sentence comes from `templateSaveVerdict` (not locked) · the `מחירים` strip is schematic. **Mockup-agent blind spot carried to 3.7:** sections 2–10 were DOM-verified (overflow 0 px, all 30 value/unit pairs on one line by `Range` measurement) but not screenshotted — the 🎨 gate screenshots the BUILT screens instead.
- `02/09/2026 19:4X` — draft v1 written. No approved spec (R-1).
- `02/09/2026 19:56` — draft v2 after the fresh-context review (Opus, ~23 min): B1 (threshold copies live in m8, not m6) · B2 (three consumers had no params loader — per-constant table + `src/api/params.js`) · B3 (§7.64 cascade flipped to deferred — V-2) · B4 (§7.84 vs R-2 → Q-1) · B5 (deletion check in `origin/main` form; survey link → Q-2) · Y1 (both "(בקרוב)" labels) · Y2 (kinds → Q-3) · Y3 (labels brief at 2.1) · Y6 (`deriveQuoteExpiry`, `AMBER_BUSINESS_DAYS` not exported, constant locations) · Y7 (only the gate label was wrong) · Y8 (owner view of the Smart Match pane) · Y9 (three editors → Q-1) · Y10 (validators compose) · Y11 (journey ① un-saved form + smoke re-run) · Y12 (`view` state, V-7 predicate) · Y13 (deviation table above) · Y14 (⑥1 pointer).
- `02/09/2026 20:23` — draft v3 after the Phase-1 execution rehearsal (Opus, ~17 min; it wrote all three migrations in full and ran T9 for real — both rows clean on `origin/main` `73c61d5`): **the role names** (§7.70's are truncated; live strings in §2.7; loud-fail guard on the owned count) · **the owner map's two readings** (31 vs 38 → Q-4) · **the policy set** (one command per policy ⇒ 4, not 3; zero multiple-permissive) · **V-3a promoted into Q-2** (the guide said "טעון בדיקה"; Ishay's ①ו count assumed no deletions) · RPC typed signature (`hostess_id bigint`), `stable`, `h.`-qualified columns, active-only (V-10) · the "paths that never consult the threshold" contract · T6 messages interpolate `%` · two Hebrew "ל-3" strings added to 2.3 and the DoD grep · `updated_at` bump accepted (V-11) · B's four columns spelled, explicit `on update no action`, C-1 by PK, no grants, §7 scan none · `products_and_params.md` in the ripple list · the `.draft` Stop-hook blind spot (T14) · §7.21 vs §7.70↳ named (Q-1) · the tombstone comment re-point (Q-2 ripple). **Fallback recorded:** the rehearsal's MCP was unauthenticated, so it used last-defining migrations for the two m8 bodies — not a substitute for `pg_get_functiondef` at build time.
- `02/09/2026 ≈20:40` — **Q-1…Q-4 ruled by Ishay, all four = the recommendation** (interview scratch file, round 2): R-2 stands + `PricingParamsCard` leaves the `מחירים` tab · both unread rows deleted (43) · the validation kinds as listed · owner map by natural owner (38). T11 closed. ה30 verified live the same hour: `quote_services_select_by_permission`'s `qual` names 'כספים' — the cost tightening shipped with m8; T12 keeps only the 1.0 re-read.
- `02/09/2026 20:5X` — **approved by Ishay ("מאשר")**; renamed from `.draft`. The interview scratch file was folded (R-1…R-4 → §3.2, Q-1…Q-4 → §3.4) and deleted. *"על מה לא שאלתי ושווה שתספר לי?"* was asked twice (the opening page and the approval message) — nothing added; A-5 (concurrent edits, last write wins) stands as an assumption. Rule-13 write-backs done in the same session: §7.21/§7.35/§7.64/§7.70/§7.83/§7.84 sub-notes · `db_roadmap` A-24, §7.64/§7.35 lane rows, `users`/`params` §6 rows, §7 matrix row · STATUS (header, module row, current step, the 08/08 task line) · the step guide's ⑥1 pointer + a "מה נבדק" header + ⑥2 addresses · `CLAUDE_CODE_LOG`. Not yet done (owed by later steps): §6 debt strikes (4.1), `products_and_params.md` (1.4/4.1), the tombstone comment (1.1).
