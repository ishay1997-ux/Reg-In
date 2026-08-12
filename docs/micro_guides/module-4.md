# Module 4 — דיילות + Smart Match · Build Micro-Guide

> ✅ **APPROVED by Ishay 08/08/2026 23:30** ("מאשר"). This is the live guide.
> **Reader: a future Claude Code session with zero memory.** English; Hebrew only as data
> (DB values, UI strings, §7 quotes). All chat reports to Ishay are Hebrew.
> **Revision 2** — after a fresh-context adversarial review of revision 1, run against the finished
> guide rather than a summary of it (`module-blueprint/template.md` was corrected the same session).


> 🗜️ **COMPACTED 12/08/2026 at the closing audit** (`module-close §4c`). **1,773 → this.**
> **What was removed:** §2's context packet, §4's security-model statement, §5's DB-design challenge and
> **§6's 739-line phase-and-step plan** — all of it build-time instruction whose job ended when the code
> landed. **What was kept, deliberately:** the status header and step table (the as-built record with its
> evidence), the capabilities table (**it feeds the `🚧` debt mechanism**), the Decisions Ledger, the QA
> matrix, the Definition of Done, and the **entire** Deviations & Tech-Debt Log — the last two are the
> only things a future session actually needs, and the rules say the ledger and the deviations log are
> **never** compacted.
> 📦 **The full pre-compaction copy: `docs/archive/module-4_pre-compaction_2026-08-12.md`** — nothing was
> lost, only moved off the read path.
> ⚠️ **This step was measured as skipped at module 3's close and nobody could tell** — which is why the
> template now demands it be said out loud.

## §1 🟢 Live Status Header

| | |
|---|---|
| Module | **4 — דיילות + Smart Match** |
| Branch | `ishay/module-4-hostesses` — **exists; never re-create.** ✅ **PUSHED to `origin` for the first time on 12/08/2026 00:45, on Ishay's instruction** *(this row said "nothing on this branch is pushed" until then — it was true for three weeks and stopped being true here)*. **Still NOT merged** — verified the same minute with `git merge-base --is-ancestor HEAD origin/dev`. 🚫 Do not write a number here — it rotted twice already *("ahead 6" was written on 08/08 and was 93 by 09/08 evening)*. **Measure it: `git rev-list --count origin/dev..HEAD`** |
| Owner | ישי (sole developer) |
| Overall status | 🔒 **Closed — awaiting PR/merge.** ✅ **ישי חתם על ה-DoD בשער-ההקלדה 12/08/2026 11:2X** (`דיילות + Smart Match DoD`, מוקלד במלואו — לא "מאשר"), אחרי שעבר על דף-הדוח וענה על שלוש שאלות-ההבנה. כל שאר האודיט הושלם. **‏12 ממצאים ⇒ 6 סיבות-שורש · 7 חוסמים תוקנו, כולם בסבב אחד · 0 חוסמים פתוחים.** שערים על `067dad4`+: `gate` **exit 0** (**751 unit** / 26 files) · `test:e2e` **117 passed** · `smoke` **exit 0** · advisors **17** (ללא שינוי) · אפס פער-סכמה (22 טבלאות). **UAT רץ חי עם ישי — שני מסעות, שני מיילים אמיתיים שנחתו בתיבתו, ואישור דרך הקישור הציבורי (19מ׳17ש׳).** |
| Last updated | **12/08/2026 11:17** *(system clock)* |
| **Active step** | **NONE — 5.2 (closing audit) is DONE.** ✅ Verdict `[YES]` released once Ishay typed the DoD echo (12/08/2026 11:2X); the module now waits only on the PR to `dev`. *(This row still read "verdict withheld pending Ishay's typed DoD echo" after the signature landed — the Overall-status row above had been updated and this one had not; corrected by `regin-docs-sync` 12/08/2026 12:56.)* **The audit record, kept:** 🔬 **The blocker that mattered was proven and re-proven by fault injection, not by reading code:** with the mail path cut at the network layer, *"שחרר"* claimed `והודעה נשלחה אליה` while `email_log` gained **0** rows — and after the fix, the same cut produced *"לא ידוע אם ההודעה יצאה"*. ⚠️ **Two defects the fix round itself introduced were caught by re-scanning its own diff** (a failed auto-release reported nowhere · the permission message losing to the filter branch) — both fixed. 📌 **Verified against `067dad4`; re-check the head before merging.** |
| Deadline | module 4 → `dev` was due **21/08/2026** — **closed 12/08/2026, nine days early** (`00_roadmap §3`, "בפועל" column). Submission: **01/10/2026** closing conference · **20/10/2026** end. *(This row said "submission **19/09/2026**"; that date was **cancelled by Ishay's ruling 12/08/2026** — fixed by `regin-docs-sync` 12/08 12:56.)* |

Legend: ⬜ pending · 🔨 in progress · ✅ done · ⏸️ deferred (target module) · ❌ blocked (reason)

| Step | Title | Status |
|---|---|---|
| 0.1 | Unlock the shared email engine for module 4 | ✅ 09/08 — gate 0 · unit 428 · E2E 78 · smoke 0 |
| 0.2 | Migration 0 — `email_log` accepts `'shift'` + its own read policy | ✅ 09/08 — applied `20260809085058`, verified live |
| 0.3 | Deploy `send-email` and re-verify live | ✅ 09/08 — deployed v4 · Router built in Make (Ishay) · verified by opening 3 real emails in Gmail, not by status code |
| 1.1 | Migration A — surrogate key + module-4 columns | ✅ 09/08 — applied `20260809122536`, verified live from the catalog · advisors 15 = baseline, zero new · quote-approval E2E 16/16 |
| 1.2 | Migration B — one-event-per-day constraint (§7.88) | ✅ 09/08 — applied `20260809124327`, 5-assertion rolled-back probe · advisors 15 = baseline |
| 1.3 | Migration C — new tables, params, release-message template | ✅ 09/08 — applied `20260809125750` · `params` 20→32, weights sum 1.00 · ⚠️ advisors 17 (+2 expected: the new tables await D's policies) |
| 1.4 | Migration D — RLS policies, min-wage trigger, public RPC | ✅ 09/08 — applied `20260809134237` · 9 policies · impersonation verified both ways, positive control passed · advisors **14** (see §10 triage) |
| 1.5 | 🔻👤 Phase-1 gate: advisors clean + `schema.sql` refreshed | ◐ **Claude's side done 09/08** — `schema.sql` refreshed & committed with each migration · `db_roadmap §10` four Done-rows · every `🚧` audited against §6 (+1 new debt written) · §7.67 write-back · advisors triaged in writing. **Awaiting Ishay: run `regin-docs-sync` (rule 13ז — Claude never runs routines) and sign the gate.** |
| 2.1 | `src/lib/hostesses.js` — ID check digit, min-wage, derived states | ✅ 09/08 — tests written first and watched red · `validators.js` +`isValidIsraeliId` |
| 2.2 | `src/lib/smartMatch.js` — the four layers | ✅ 09/08 — **anchor reproduces `0.67/0.66/0.64` + order + two absent** · all three §3.5 holes proven red against deliberately-broken code |
| 2.3 | `src/modules/04_hostesses/api.js` — query-side filtering | ◐ 09/08 — **reads + hostess-pool writes done.** Assignment-lifecycle writes deferred to Phase 3: §7.33 + §7.41 are open (see §10) |
| 2.4 | 🔻👤 Geocoding — service choice (product decision) + lazy fill + backfill | ✅ 09/08 — **verified end-to-end in a real browser against the live DB.** Migrations E+F applied · **all 3 events filled through the production path** (proj 3 → ירושלים *not* אשקלון, proj 8 → אקספו ת"א, proj 7 → correctly none) · advisors **15** (16→15 after F, as forecast) · gate `exit 0`, 571 unit |
| 2.5 | 🔻👤 Phase-2 gate: the hand-computed anchor reproduces | ✅ **09/08 — Ishay signed. PHASE 2 CLOSED.** Anchor `0.67/0.66/0.64` + order + two absent, re-verified **after** every later change · `gate exit 0` · **575 unit** · 7 migrations · advisors 15 |
| 3.0 | 🔧 Shared-component checkpoint (before any screen) | ✅ 09/08 — all 8 approved mockups scanned by class-vocabulary. **3 new shared** (`StatusTag` · `RatingStars` · `ChipToggle`, 23 tests) · **4 reused** (`StatTile`/`Money`/`useConfirm`/`LoadingOrError`) · **1 deliberately local** (Smart Match reasoning chips — `spec.md §1.5` requires two separate families) |
| 3.1 | Surface 3 — hostess repository table | ✅ 09/08 — built as drawn · 4 new pure functions (**tests first, watched red**) · **verified live on 20 real rows**, both permission directions, all four screen states |
| 3.2 | Surfaces 3ב/3ג/3ד — add / edit / view cards | ✅ 09/08 — one dialog serves add+edit · stars open EMPTY · **the three different validation behaviours screenshotted** (ID blocks · wage blocks · duplicate email warns-only) |
| 3.3 | Surface 1 — assignment overview (triage) | ✅ 09/08 — built · **8 E2E green incl. both permission directions and the load-failure guard** · 4 new pure functions, each proven red against deliberately-broken code |
| 3.4 | Surface 2 — Smart Match | ✅ 09/08 — C1–C5 done · **the lifecycle ran live**: 5 invites sent, 1 finally approved, 1 released, 1 declined, 1 withdrawn · anchor `0.67/0.66/0.64` re-verified after wiring |
| 3.5 | Surface 4 — per-row action menu | ✅ 09/08 — **all six statuses opened and screenshotted on real rows**; `approval_withdrawn` correctly has no `⋯` at all |
| 3.6 | Surface 5 — public confirm page (no login) | ✅ 10/08 — built · 🔴 **a 9th migration was required and was NOT in the plan** (`get_shift_invite` — the approved screen demands fields no anon path could read) · 7 states screenshotted at 390px in a session-less browser · **6 E2E green** · the write path proven inside `begin…rollback`, demo data untouched |
| 3.7 | 🔻👤 Phase-3 gate: 🎨 UX & functional review | ✅ **CLOSED 10/08 12:33 — Ishay signed the gate via a live acceptance walkthrough** (`feature-acceptance` skill: 5 stations screenshotted against the real dev server + demo DB, ✔️ on all — row-click, the 3-way deactivate dialog, the loading skeleton, Smart Match phone numbers, the add-hostess dialog) **and ruled the one open decision** ("X פג תוקפן" clickable-and-scroll) **NOT to build it**, agreeing with Claude's recommendation — closed as a deliberate no-build, not left open. 🔴 **One caveat carried forward, stated plainly:** the release-button's write path (`releaseAssignment` via the new 3-way dialog) was code-reviewed, gate-verified and dialog-screenshotted, but its first real click was never exercised (would have emailed a real address) — watch it once, live, the first real time someone uses it. **10/08 02:3X — the sweep (a)+(b) ran on all 7 remaining surfaces (1 · 2 · 3 · 3ב/3ג · 3ד · 4) and every real finding was FIXED and verified, not just logged. Formal 👤 sign-off is the only thing not yet done** — Ishay saw and ruled on the two decisions that came up live, but has not seen the consolidated list below (he went to sleep mid-sweep and told me to keep going and decide). ⏳ Carried forward unchanged: rate limiting on the public RPCs, still `🚧 מ12 ← מ4`.<br>🔬 **Method:** 6 parallel read-only review agents (one per surface, each cross-reading the component + its approved mockup + its `screens-approved.md` card, static-code only) + my own direct read of every `toast()` call site (Ishay's explicit ask) + a live Playwright pass against the real dev server + demo DB for what static reading can't prove (keyboard tab-order, the duplicate close button, rendered bidi, actual screenshots). **Every finding below is either live-verified or explicitly marked static-only.**<br>🐛 **Fixed (13 items, all rebuilt + gate-verified):** ① **`RepositoryTab` deactivate dialog** — was telling the manager "release from events isn't available yet, will be added later" for a capability that **already shipped at 3.4/3.5**; worse, it offered only the non-recommended action as a real button and buried the recommended one (`processes-approved.md §א4`, mockup `.copt.rec`) as inert text. **Ishay ruled `בנה עכשיו` live** ⇒ rebuilt as a real 3-way choice (release-and-notify / deactivate-and-keep / cancel), wired to the existing `releaseAssignment` — `futureActiveAssignments` (`src/lib/hostesses.js`) grew two extra fields (`hostessId`/`assignmentNumber`) so the caller doesn't need a second DB round-trip. ② **Surface 1 keyboard trap** — the whole triage table's only navigation (`<tr onClick>`) was unreachable by keyboard; **measured live**: Tab went straight from the urgent-filter button to `<body>`. Added `tabIndex`+`onKeyDown`+focus ring. ③ Same **row-click gap on Surface 3** — `Ishay flagged it live mid-session` ("בדומה ללקוחות… לא רק לחיצה על השם"): only the name was clickable; now the whole row is, matching `CustomersPage`'s own 11/07 pattern exactly (`tabIndex`+`onKeyDown`+`stopPropagation` on the action cell). ④ **Duplicate close button on the view card (3ד)** — a hand-added `X` sat exactly on top of Radix's own default close button; two Tab stops for one action. Removed the manual one. ⑤ **`🔴` emoji leaked into visible UI text** in the edit-mode hourly-rate note (`HostessFormDialog.jsx`) — was meant as a code-comment marker, rendered on screen instead. ⑥ **Enter did nothing in the add/edit dialog** — no `<form>` wrapper, unlike `CustomerFormDialog` (its own modeled precedent); added, with the 3 unavailability-range draft fields guarded so Enter there adds the range instead of submitting the whole form. ⑦ **4 required fields with no placeholder** (`full_name`/`bank_name`/`bank_branch`/`bank_account`) — violated the module's own empty-input rule (`src/CLAUDE.md` pass 5, the rule born from Ishay catching this exact class of miss once already). ⑧ Save button now says **"שומר..."** while saving (was silently disabled with no label, unlike its own modeled precedent). ⑨ **"עבדה לאחרונה לפני N שבועות" chip (3ד) had no threshold** — Smart Match gates the identical chip by `תקרת_שבועות_הוגנות` (`screens-approved.md` 3ד §⑦: "same threshold, not new wording"); the card showed it unconditionally, so a hostess who worked yesterday displayed "לפני 0 שבועות" — the opposite of the warning it exists to carry. Now gated identically. ⑩ **Fake `event_starts_at`** in the same card's status derivation — hardcoded midnight UTC + "now"=`23:59:59` instead of the canonical `eventStartInstant` helper this module's own `CLAUDE.md` requires to stay identical across screens; could mislabel a same-day not-yet-happened shift as "הושלם" the moment the card opens. Fixed to use the real helper + a real current instant. ⑪ **Reliability-off banner (Smart Match) was unconditional** — always rendered regardless of `params.reliabilityEnabled`; correct today only because the param happens to be `false`. Gated on the actual param so it stays correct the day M6 flips it. ⑫ **10th occurrence of the number-glued-to-Hebrew bidi bug** (same family as the documented ★/₪/62%-38% incidents): `{count}×` in both the Smart Match customer-history chip and the 3ד card, plus an unisolated date in the 3ד header and unisolated phone/quarter-events columns on Surface 3 (the mockup's own CSS applies `unicode-bidi:isolate` uniformly to all 4 numeric columns; 2 of them didn't have it). All isolated. ⑬ **Two duplicate "no candidates" sentences** rendered simultaneously on Smart Match when the list is empty — merged to one; added a one-line pointer to the hostess pool per `screens-approved.md:330`.<br>➕ **One gap both the mockup AND the spec already agreed on, not a new decision:** the hostess's phone number was fetched (`row.hostesses.phone`) but never rendered on the assignment row itself (Surface 4) — added as a `tel:` dial link. **Simplified vs. the mockup's drawn behaviour:** the mockup gives the phone extra visual prominence specifically inside the T-24 window; this fix shows it plainly on every row instead of building that state-dependent styling — flagged, not built, pending a design call if Ishay wants the distinction.<br>🚫 **Found and deliberately NOT fixed this session (say so, don't bury it):** the spec'd loading-state (`screens-approved.md`: table/card **skeletons** on Surfaces 1/2/3) renders as plain "טוען..." text via the shared `LoadingOrError` component — cross-cutting beyond module 4, needs a decision, not a silent module-4-only patch. "X פג תוקפן" is spec'd as a clickable element that scrolls to the relevant rows (`screens-approved.md` מסך 2 §①); it renders as inert text — not fixed, low-confidence on whether the click behaviour is worth the added complexity for what's effectively a coarse in-page filter reminder. Two cosmetic wording items on Surface 1 (punctuation consistency between two fallback error strings; an "none of them" phrasing that reads oddly at zero) — noted, not touched. **Ruled by Ishay, no code change needed:** Surface 3's view-only role sees 6 columns vs. the mockup's drawn 4 — "נראלי מותר לראות למנהלת הפרויקטים למרות שאין לה מה לעשות עם המידע הזה," so this is not a permission gap.<br>✅ **Verified, not just built:** `npm run gate` **exit 0** (lint+format+**750 unit**+build+jscpd+knip+audit+context+docs-structure) · `npm run smoke` **exit 0** · the 4 E2E spec files above rerun clean · **live browser pass** (Playwright against the real dev server + demo DB, read-only — every write-capable action was opened and screenshotted, then cancelled, never submitted, per `e2e/CLAUDE.md`'s no-mutate-live-data rule): row-click confirmed opening the card from a non-name cell, exactly one close button counted in the DOM, keyboard reached an overview row at Tab-step 4, the Smart Match screen showed live phone dial-links + the correctly-still-visible reliability banner + correctly-split percentages, and the add-hostess dialog showed all 4 new placeholders with zero rows written. |
| 4.1 | Wiring: **the public route only** — `UnderConstruction` was already replaced at 3.1 | ✅ 10/08 — the public route landed **with 3.6** (the page is meaningless without it). 🔴 **The allow-list entry was NOT added — deliberately, against this plan's own wording:** measured that the AST guard walks **only** children of `<Route element={<MainLayout />}>`, so `/login` — and now `/shift/:token` — never reach it. An entry would only **mute** the guard if the route were later moved *inside*. Replaced by a **live** E2E: 5 internal paths still redirect when signed out |
| 4.2 | Demo seed extension + E2E anchors + the fixture-rot ruling | ✅ 11/08 — 5 new hostesses (`scripts/demo-seed.mjs`), illustrating the gate's 5 conditions in isolation (not `spec.md §3.1`'s exact anchor, Ishay's ruling §10) · `smoke-anchors.json` module-4 block + `smoke.spec.js` leg · fixture-selection-pattern ruled (§10) · 🐞 real availability-gate bug found + fixed + regression-tested along the way · gate exit 0, 750 unit · module-4 E2E 17/17 · smoke exit 0 |
| 5.1 | E2E + regression suites | ✅ 12/08 — **+15 E2E** (module-4 total **38**: `hostesses` 20 · `smart-match` 12 · `public-confirm` 6) covering the four surfaces that had **zero** coverage: 3 (repository) · 3ב/3ג (form) · 4 (row menu) · **T-24 mode** · all 3 remaining hardcoded `overview-row-N` fixtures removed · **every new test proven red against deliberately-broken code** (4 breaks → exactly the 6 expected failures, zero others) · gate `exit 0` (750 unit, unchanged) · **full `test:e2e` 117 passed** · `smoke` `exit 0`. 🐞 Found + fixed: a clock-rotted assertion in a 09/08 test (§10) |
| 5.2 | 🔻👤 Closing audit (`module-close`, FRESH session) | 🔨 **12/08 — scan complete, fix round applied, verdict NOT yet given.** ‏**5 blockers fixed** (release-mail reporting · overview denial-vs-empty · geocode result kept when its save is denied · a11y harness race · cancelled project no longer credited). ‏**UAT ran live with Ishay** — both journeys, 2 real emails delivered to his inbox, and he confirmed through the public link (19m17s response time). 🔬 **The release blocker was proven AND re-verified by fault injection** (network-level abort of `send-email`): before → `toast-success "והודעה נשלחה אליה"` with **0** `email_log` rows; after → `toast-error "לא ידוע אם ההודעה יצאה"`. ⚠️ **Regression run: `gate` blocked on prettier only (fixed) · `smoke` exit 0 · `test:e2e` 115 passed / 2 failed** — and **neither failure is caused by the fixes**: the a11y `button-name` on `/system/prices` (module 1's screen) survived the harness fix, and `sm-angle-fastest` rotted because **the UAT itself created the first `responded_at` in the system**, so the angle correctly turned on. **Both routed to Ishay per §6b's floor rule.** |

---

## §2 📦 Capabilities delivered vs deferred

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
| 🆕 Hebrew message for a **reschedule blocked by the same-day rule** | ⚠️ the DB constraint only | 🚧 מ6 | `🚧 מ6 ← מ4` (written 09/08, mig B) |
| Salary report | ❌ M4 supplies raw material only | 🚧 מ8 | `🚧 מ8 ← מ4` |
| "Who is below minimum wage" report | ❌ | 🚧 מ9 | `🚧 מ9 ← מ4` ✅ exists — grep `דוח "מי מתחת לשכר-המינימום"` |
| Smart Match params **editing screen** | ❌ rows seeded, no UI | 🚧 מ9 | `🚧 מ9 ← מ4` ✅ exists — grep `מסך-הפרמטרים של Smart Match` |

🔴 **Rule (ENFORCED — iron rule 15 + Stop hook):** every 🚧 row above must have a **byte-matching**
`🚧 מN ← מ4` line in `PROJECT_MASTER §6`, written **in this same session** — format
`🚧 מN ← מ4 · what · why it lives only there · מקור: micro_guides/module-4.md` — then verified with
`grep '🚧 מN' docs/PROJECT_MASTER.md`. A 🚧 with no §6 twin is a **silent debt**; the registry is read
by `grep`, and `grep` does not read prose.
✅ **RESOLVED — re-measured 12/08/2026 12:56 by `regin-docs-sync`: every 🚧 row above now has its §6 twin.**
The two that this block once flagged as missing were both authored: the **M9 Smart-Match params screen**
and the **M6 attendance fields** (`attendance_status` / `lateness_level` / `no_show_reason`) each have their
own `🚧 מN ← מ4` line in `PROJECT_MASTER §6`, distinct from the M9 min-wage-report debt.
⚠️ **The line numbers this block used to cite (`:427`, `:437`) were already wrong** — §6 has grown since.
**Grep by the debt's Hebrew title, never by line number**; that is the whole reason the registry is
grep-addressed.

**Roles on every module-4 screen:** מנהלת גיוס ושיבוץ = edit · מנכ"ל = edit · מנהלת פרויקטים = view ·
מנהלת כספים ולקוחות / מנהלת לוגיסטיקה = blocked. *(Verified live against `permissions`, 08/08/2026.)*

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
| local-6 | **Release-message template is WRAPPED like its four sisters** — `היי [שם_דיילת],` + the spec sentence verbatim + `בברכה,\nצוות הגיוס, REG-IN.` Seeded as `תבנית_מייל_שחרור_משמרת`. **Why asked at all:** `processes-approved.md:264-266` gives one exact sentence, and "seed verbatim" read literally would have shipped the only one of five templates with no greeting and no signature | ישי 09/08 | 1.3 |
| local-7 | 🔴 **`תקרת_דיילות_מומלצת` CANCELLED — the row is NOT seeded and `src/lib/pricing.js` is not touched.** Ishay 09/08: *"אין צורך בתקרה, מיותר"*. ⚠️ **This REVERSES his own ruling of 07/08/2026** recorded at `db_roadmap:135` (*"`תקרת_דיילות_מומלצת` = 6 … `recommended_hostess_count = min(ceil(אורחים ÷ יחס), תקרה)`"*). **Both are quoted and dated at `db_roadmap:135`; the later one stands** (iron rule 1, contradiction case ②). Effect: the `params` list drops 15 → 14, and `recommendHostessCount` keeps `ceil(guests / ratio)` with no cap | ישי 09/08 | 1.3 |
| §7.55↳ | 🟢 **Geocode service = Nominatim (OSM).** Closes §7.55's single remaining build-residue (*"נבחר בבנייה מול תנאי-שימוש עדכניים, לא מהזיכרון"*). **ToS read live 09/08/2026:** free · **no key, no account** · **max 1 req/sec** · results **must be cached our side** (which the "convert once and store" design already is) · end-user-triggered use permitted. Measured on real Hebrew addresses: house-number precision on `דיזנגוף 100, תל אביב` and `הרצל 50, ראשון לציון`; `אקספו תל אביב` resolves to the venue itself. ⚠️ **Stated deviation:** the ToS asks that switching be possible *without a software update*; the endpoint is a **code constant**. Rationale: ~60 requests ever, switching = one line, and a DB-editable URL would be a footgun on M9's params screen with no matching risk | ישי 09/08 | 2.4 |
| local-8 | **Migration E — `set_project_coordinates` (`SECURITY DEFINER`), not a write policy on `projects`.** Ishay ruled the 6th migration after being shown that `projects` is SELECT-only for M4 and that without a write path the proximity component — **0.25 of the score** — would be neutral for every event forever | ישי 09/08 | 2.4 |
| local-9 | **Fallback chain + locality guard** — Claude's call, shown with its measurement; Ishay may override. 🔴 **No third on-screen state ("מיקום מקורב") was added** — the approved model has exactly two. **Cost said out loud:** when the chain falls back to city level the distance is computed from the city centre, and the screen does not flag it | קלוד, anchor = live measurement | 2.4 |
| local-10 | 🔴 **Distance is shown as a WORD, not a number — `קרובה` / `בינונית` / `רחוקה`.** ⚠️ **Deviation from the approved mockup**, which draws `2.5 ק"מ` · `3.1 ק"מ` · `11 ק"מ` (`02_smartmatch_approved.html`) and which `screens-approved.md §①` marks as a `score`-family chip. **The mockup is NOT redrawn** — same handling as `local-1`. **Two reasons, and the second is what decided it:** (1) Ishay's field knowledge — *"למנהלת לא משנה אם 3 ק"מ או 5 ק"מ בתכלס"*; (2) 🔑 **displayed precision must match data precision** — when an event address resolves only to city level (**measured: project 3**), `18 ק"מ` is a number *pretending* to be measured. 🚫 **The SCORE is untouched** — it keeps running on continuous km, and the hand-computed anchor `0.67/0.66/0.64` still reproduces (verified after the change). **Thresholds are derived from `גולפוסט_מרחק_קמ`, read at runtime — no new param, no migration:** `רחוקה` starts exactly at the goalpost (where the proximity score hits zero, and the no-car cutoff), `קרובה` at half of it | ישי 09/08 | 3.4 |
| local-11 | 🚫 **Travel-TIME display (`≈35 דק'`) — DROPPED, and recorded so it does not return.** Origin: a parallel session's suggestion, relayed to Ishay; **it was never in the spec and he never asked for it.** Measured before dropping (so this is a decision, not an avoidance): the OSRM demo server works from a browser, needs no key, sends `Access-Control-Allow-Origin: *`, and returns **51 points in ONE matrix call**. **Why dropped anyway:** its published policy states there is **no uptime guarantee and access may be withdrawn at any time without reason** — a live external dependency in a project whose entire deliverable is **a one-hour conference talk**. ➕ And the information it would add is not information the manager asked for. Ishay 09/08: *"אפשר לוותר על זה?"* — **yes** | ישי 09/08 | — |
| local-12 | ⏸️ **OPEN — an "approximate location" marker when an address resolved only to city level.** ⚠️ **Sweep this at the Phase-3 door (§9(h)) — do not build it silently.** **Why it is open rather than ruled:** the display is now a WORD (`local-10`), which already hides false precision, **so the marker may be redundant** — that is exactly the judgement call. **What is measured:** an event address CAN resolve to a city centroid (project 3), and in that state a hostess's distance is off by kilometres while the row looks normal. **Quantified:** a ~5 km error shifts the proximity sub-score by `5/40 = 0.125`, i.e. ≈`0.047` on the final score — **and the anchor's own scores are `0.01–0.03` apart**, so it CAN flip the order. 🔴 **Cost if ruled yes:** it needs to know *which* candidate resolved the address ⇒ either a `precision` column (migration) or re-deriving it at read time. **Not cheap — do not agree to it casually** | ⏸️ פתוח | 3.4 |
| §7.41↳ | 🟢 **CLOSED at the Phase-3 door — the `max+1` race on `assignment_number` needs nothing built.** 🔬 **Measured, not assumed** (`docs/schema.sql:765-766`): `assignments`' PK is **`(project_id, hostess_id, assignment_number)`** ⇒ two concurrent writers that computed the same number **cannot both land** — the second gets `unique_violation`. 🔑 **That is exactly what the item asked for: the failure is LOUD, not silent.** What remains is implementation detail, not a decision: one retry with a refreshed number, in code. **Verdict `לא-נדרש-כי` the key already covers it.** ⚠️ Only the module-4 clause is nodded — the rest of §7.41's bundle stays open | ישי 09/08 | 3.4 · 3.5 |
| local-13 | 🟢 **§7.33 CLOSED — the auto-release runs IN CODE, in the same action as the final approval. 🚫 Not a DB trigger.** What was already ruled 07/07: when the quota fills, everyone who confirmed availability and was not picked is released automatically. What was open: **where**. 🔑 **And it is not a technical question:** the released hostess gets **her own message** (`תבנית_מייל_שחרור_משמרת`, seeded in `20260809125750`) — *"not because it is polite: responsiveness is 40% of the score, and a hostess who said yes three times and heard nothing back stops answering."* **A DB trigger cannot send mail** ⇒ a trigger would split the release from its notice. ⇒ both leave together, from code, in step 3.5 | ישי 09/08 | 3.5 |
| local-12↳ | 🟢 **CLOSED — the "approximate location" marker is NOT built.** `local-10` (distance shown as a WORD) removed its ground: the marker existed to warn that `18 ק"מ` claims precision we do not have, **and no number is displayed any more**. Residual risk acknowledged and accepted: in edge cases a city-level fallback can move a candidate one place in the ranking — **and the manager picks manually every round anyway**. Price if reversed: a `precision` column ⇒ an **eighth** migration. **Verdict `לא-נדרש-כי` the label already solves it; if usage shows it misleads, we come back — and that is cheap** | ישי 09/08 | — |
| local-14 | 🆕 **The hostess pool is REAL DATA, not fixtures — 20 rows, and they stay.** Ishay 09/08: *"אפשר לשים במסד 20 דיילות רק שיהיה הגיוני, בלי לרשום את המילה דמו… באמת שידמה"*. ⚠️ **A conscious exception to `e2e/CLAUDE.md`'s "never inject rows into the DB"** — and it is not a fixture: there is one live DB, **no delete anywhere in the module**, and these rows are the module's demo content. **Created through the app's own `createHostess`** (signed-in browser, real geocode, real RLS) — 🚫 not from node (Nominatim returns `Access denied`) and not via SQL (would bypass both the geocode and the permission gate). 🔴 **Consequence for step 4.2: the seed MUST skip an `id_number` that already exists**, or it will fail on these rows | ישי 09/08 | 3.1 · 4.2 |
| local-15 | 🟢 **RULED 09/08 — snapshot `projects.owner_name` + `owner_phone`.** Ishay delegated the choice (*"מה שנראה לך נכון, אני לא מבין את המשמעויות"*) ⇒ **Claude owns the outcome.** **Why this one of the three:** it is the *third* use of a pattern already in this very table (`event_name` §7.76 · `customer_name` `local-5`, whose migration A even rewrote the conversion RPC to populate it — **copy that file's shape**), it opens no new security surface, and a snapshot is semantically right: **what a sent mail says must stay what it said**, exactly like `hourly_rate_snapshot`. Rejected: a `users` read policy (widens module 1 for two fields) · a `SECURITY DEFINER` function (no new columns, but the printed name could change retroactively). ✅ **APPLIED 09/08 as migration G `20260809223025_module4_project_owner_contact_snapshot`** (typed echo received). Verified: the same recruiter query that returned `[]` now returns `ישי אטיאס`/`050-1241223` · module-3 regression **17/17** · advisors **15 = baseline, zero new**. ⬇️ The original finding: |
| local-15↳ | ❌ **The measurement that produced it.** `local-2` routes the field contact to `users.full_name`/`users.phone` via `projects.owner_email`; **measured live 09/08 that מנהלת גיוס gets `200` + `[]` there** (`users_select_self_or_ceo` — self or מנכ"ל only) ⇒ the mail would print an empty contact, and `fillEmailTemplate` cannot catch it because the placeholder is *known*. **Recommendation: snapshot `projects.owner_name`/`owner_phone`** — third use of a pattern already in this table (`event_name` §7.76 · `customer_name` local-5), and a snapshot is semantically right for something printed into a sent mail. Alternatives: a `users` read policy for 'דיילות', or a `SECURITY DEFINER` function | ⏸️ פתוח | 3.4 · 3.5 |
| local-5 | **`projects.customer_name` snapshot** — written at conversion, backfilled for existing rows. **Why:** מנהלת גיוס is `blocked` on 'לקוחות' (live) and `customers`' SELECT policy (`schema.sql:363-367`) demands view/edit there ⇒ an embedded customer join returns null **silently** on three approved surfaces. `projects` already snapshots `event_name` for this exact reason (§7.76, `schema.sql:502`) | קלוד, anchor §7.76 — Ishay may override | 1.1, 2.3 |

| local-16 | 🟢 **CLOSED without a new ruling — `approval_withdrawn` on the public page shows the GENERIC message.** I had opened this as "spec-silent" and flagged it for 3.7; Ishay replied *"ביטלה אחרי אישור — זה חשוב מאוד כי זה משנה אחר כך"* and *"כבר דיברתי על זה, לא זוכר איפה ומה היו השיקולים"*. 🔑 **He was right and the record was found:** `processes-approved.md §ב8` rules the neighbouring case in one line — *"דיילת חוזרת בה לפני האישור הסופי: מתקשרת, המנהלת מעבירה ל'סירבה'. **אין מסלול-קישור**, אין סטטוס חדש"* — and the row-menu card (`screens-approved.md §①`) marks `סמן: ביטלה אחרי אישור` as **רושם בלבד · 🚫 no mail**. ⇒ changing her mind has **no link path at all**, by decision; the generic text points to the phone, which is the ruled channel. **And "משנה אחר כך" is also on record:** the project reverts to `בתהליך`, the screen shows the hole, and it scores **0.5 in reliability** (§ב8) — 🚧 the revert itself is **M6's**, M4 never writes `project_status`. 🚫 **Not "תודה שעדכנת"** — she did not update here | ישי (§ב8, 07/08) · אותר 10/08 | 3.6 |
| local-17 | 🟢 **RULED 10/08 — "something sensible that works" outranks 1:1 mockup fidelity.** Ishay, on being shown surface 5's deviations: *"נראלי הכי חשוב שבנינו משהו הגיוני שעובד גם אם לא אחד לאחד"*, with the reason: **the mockups were drawn AFTER the spec**, so drift between them is expected and is his to reconcile, not a build blocker. ⚠️ **Scope, deliberately narrow:** this relaxes *fidelity*, 🚫 **not** the arbitration rule (`screens-approved §⚖️`) and 🚫 **not** approved copy — the five message texts of משטח 5 are still quoted byte-for-byte, and a deviation is still **recorded**, never silent. **Deviations taken under it at 3.6:** ① `יום שלישי הקרוב` → `יום שבת · 22/08/2026` *(the event is ~2 weeks out; "הקרוב" would simply be false — the exact date-rot trap the card itself records)* · ② `+ נסיעות 30 ₪` → `+ נסיעות` with no number *(`local-3`; the mockup draws a state that cannot occur while the param is `0`)* · ③ result screens render icon + the approved sentence, **with no invented title** *(the mockup's `.tt`/`.dd` CSS is unused; its labels are review captions, not on-screen text)* | ישי 10/08 | 3.6 · 3.7 |

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
| 6 | tie-break inputs | `md5(project_id::text ‖ hostess_id::text) ASC`. ⚠️ **`event_id` does not exist**. ↳ **as-built 09/08: the INPUTS stand (`project_id` + `hostess_id`, ASC); the HASH is FNV-1a, not md5** — no hashing lib in `package.json`, `crypto.subtle` lacks md5, and it runs in JS. See §10 | ⑭#8, ⑳ |
| 7 | attendance counts arrive cumulative ⇒ de-dup untested | de-dup by `MAX(assignment_number)` **in SQL**, plus a dedicated unit test | ⑭#9 |
| 8 | shift-lead column + "one per event" | `assignments.is_shift_lead boolean not null default false` + `unique index on (project_id) where is_shift_lead` — **DB-enforced**, per §7.29's own precedent | ⑲(1) |
| 9 | unavailability shape + is the end day included? | `hostess_unavailability(unavailability_id, hostess_id, start_date, end_date, note)`; gate test `final_event_date between start_date and end_date` — **inclusive**, consistent with §7.30 and every UI label | ⑲(2) |
| 10 | `רבעון אחרון` window | **rolling 90 days**, identical on surface 3 and card 3ד | 🆕 no spec source |
| 11 | `עבדה אצל <לקוח> N×` counting rule | distinct projects whose final row is `finally_approved` **and** `final_event_date < today` | 🆕 no spec source |
| 12 | `לא ענתה ל-N האחרונים` definition | final row per `(project_id, hostess_id)`, ordered `invite_sent_at DESC`, take N; fires when all N are `pending` | 🆕 no spec source |
| 13 | `הושלם` in the view-card history | **a derived display label** (`finally_approved` + past event date) — 🚫 not a seventh status | 🆕 no spec source |
| 14 | ₪ glyph order | `<Money>` everywhere ⇒ `45 ₪`. Mockup `03` draws glyph-first 12×; `05`/`08` and `src/CLAUDE.md:117-118` say otherwise, and the code rule wins | 🆕 no spec source |

---

## §7 📊 QA Matrix

| Type | Planned | As-run |
|---|---|---|
| Unit (`npm run test:run`) | `smartMatch.js` incl. the anchor + `§11.10` #2–#5 + the three §3.5 holes; `hostesses.js` ID/min-wage/derived states | ✅ **751 passed / 26 files** — re-measured at the close, 12/08/2026, after the audit added one regression test (a client-cancelled event must not count in the hostess's favour), **watched red against the deliberately removed line, then green again**. The hand-computed anchor `0.67/0.66/0.64` + order + two absent reproduces; the three §3.5 holes and `§11.10` #2–#5 each watched **red** against deliberately-broken code. 5.1 added **zero** unit tests — by design, its gap was end-to-end. |
| Integration | RPC + trigger + constraint, in rolled-back transactions | ✅ done in Phase 1 (09/08) — every migration probed inside `begin…rollback`, incl. a 5-assertion probe on constraint B and a deliberate policy-drop. 🚫 **Not re-run at 5.1**: no migration and no DB change since 10/08. |
| E2E (`npm run test:e2e`) | pool CRUD · invitation round · public confirm · row menu · T-24 mode | ✅ **117 passed / 7.7 min, whole repo** — re-run at the close **after** the five fixes, 12/08/2026. ⚠️ **The first re-run was 115/2:** neither failure came from the fixes — one was a genuinely missing `aria-label` on **module 1's** prices screen (a longer wait did **not** cure it; that refutation is what proved it real), and one was this suite's own assertion rotting because **the UAT created the system's first response-time datum**. Both were ruled by Ishay and fixed. Module-4's own share **38**: `hostesses` 20 · `smart-match` 12 · `public-confirm` 6. ◐ **"pool CRUD" is covered as far as it can be: create/edit dialogs, their three validation behaviours and the 3-way deactivate window — but no test presses *save*** (live DB, no test environment). Row menu and T-24 fully covered. |
| **Smoke (`npm run smoke`)** | one module-4 screen + the order anchor. ⚠️ **`test:e2e` excludes smoke silently; neither runs in CI** | ✅ `exit 0`, re-run at the close 12/08/2026. ⚠️ **And its first invocation that day returned `exit 3`** — `smoke` needs the **dev** server on 5173 while `test:e2e` runs against build+preview on 4173; a close that ran it blind would have misread that. Module-4 leg anchors the **gate's behaviour** — who is listed, who is excluded — not the score, which is deliberately never displayed. |
| Regression | all existing suites, especially `quote-email.spec.js` after Phase 0 | ✅ all suites green in the same run above, `quote-email.spec.js` included. 🐞 **And it earned its keep at 5.1:** the only red was a 09/08 module-4 assertion that had pinned `(0)`, rotted by the clock — see §10. |
| **UAT** | Ishay drives the two real journeys end-to-end in the live preview: build a pool entry from a phone call, and staff `כנס לקוחות שנתי` from zero to a full quota — including the public link on a phone | ✅ **DONE 12/08/2026, both journeys, with Ishay present** *(this row said ❌ from the module's opening until the close)*. **Journey 1:** a hostess built from scratch — invalid ID **blocked the save**, wage `30` **blocked the save** (threshold read from `params`), and the address resolved to real coordinates through the production path; DB confirms `hostess_id 41`, `status active`, `rating null`. **Journey 2:** Smart Match opened **15 candidates**, the invite was sent, **`email_log #30` recipient `ishay1997@gmail.com` status `sent`**, Ishay answered through the public link — **`confirmed_available`, 19m17s** — and the final-approval mail (`#31`) also landed, which he confirmed by opening it. ⚠️ **Two honest boundaries:** it was driven by a **headed browser script Ishay watched**, not by his own clicking (both browser surfaces here lose their login between turns — `sessionStorage` by design), and the public link was opened **on his computer, not his phone**, because the deployed site has no such route until the merge. |
| Security / Pen (RLS) | impersonation matrix both directions + positive control + a deliberate policy drop | ✅ Phase 1 (09/08): impersonation both directions **with the positive control first**, a deliberate double policy-drop (0 rows, no error), and `anon` proven unable to touch `assignments` outside the RPC. ➕ 5.1 re-verified the **screen** half of both permission directions on surfaces 1 · 2 · 3 — incl. that the view-only role has no wage column at all, not merely no buttons. |
| Usability | filled from step 3.7 + the closing template's UX audit | ✅ step 3.7's sweep (13 findings fixed) + Ishay's live acceptance. ➕ 5.1 locked two of them as regressions: whole-row click **and its keyboard path**, and the four missing `placeholder`s. |
| Performance | Smart Match on 50 hostesses × 10 events — query-side filtering | ⚠️ **STILL NOT MEASURED at the close — said in the verdict rather than quietly ticked.** Registered for M12. *(Original note kept:)* ⚠️ **NOT MEASURED.** The design intent (server-side filtering, one query per screen, no N+1) was verified by reading `api.js`, and the real pool is 25 rows — far from the 50 × 10 the row describes. **No timing was taken; do not report this as met.** |
| Compatibility | 1024 / 1366 / mobile for the public page | ◐ the public page was screenshotted at **390px** in a session-less browser (3.6). 🚫 **1024 / 1366 were never exercised** — and neither was any internal screen at a small viewport. |

## §8 ✅ Definition of Done

*(Canonical DoD from `docs/architecture_and_qa_roadmap.md`, instantiated for module 4.
The closing audit walks these one by one and ticks what it verified — so they must be checkboxes.)*

- [x] All **8 migrations** applied via MCP after a typed-echo, `docs/schema.sql` refreshed, migration + snapshot committed **together** — `20260809085058` (mig 0, phase 0) · `20260809122536` (A) · `20260809124327` (B) · `20260809125750` (C) · `20260809134237` (D) · `20260809172638` (E — `set_project_coordinates`) · `20260809174501` (F — revoke `anon` from E) · `20260809223025` (G — `projects.owner_name`/`owner_phone` snapshot). **Ishay typed each name individually; no gate was batched or pre-granted.** *(F exists because E's own revoke was incomplete — see §10. The count moved 5→7 during step 2.4, and 7→8 when `local-15` was ruled at the 3.4 door. **G's line said 7 until 09/08 23:5X — corrected while closing 3.4/3.5.**)*
- [x] `get_advisors(security)` — **triage note written, 09/08/2026** *(this line closes with a triage,
      not a zero, and that is the honest outcome)*. Trajectory across phase 1: **15 → 15 → 15 → 17 → 14.**
      Migration C legitimately raised it (+2 — two new tables born RLS-on before D gave them policies);
      migration D cleared **five** `rls_enabled_no_policy` and added **two** WARNs, both on
      `respond_to_shift_invite` (`anon_…` + `authenticated_…`), because EXECUTE is granted to both
      roles **on purpose** — a manager opening the invite link while signed into the app must not hit
      a permission error on a public page. **Residual four `rls_enabled_no_policy`:** `login_attempts`
      + `login_rpc_calls` (deliberate deny-all, §7.8↳) · `logistics` (M5) · `salary_reports` (M8).
- [x] RLS verified **in both directions**, with the positive control passing — `recruit.test@regin.co.il` → **1 hostess** (plus projects 3 · unavailability 1 · preference 1); `finance.test` → **0**; `projects.test` reads but her UPDATE took no row. *(09/08/2026, rolled-back DO-block impersonation carrying both `sub` and `email`.)*
- [x] The deliberate policy-drop test ran — **0 rows and NO error**, both for a `view`-only role with the select policy dropped and for an `edit` role with **both** dropped. ⚠️ **And it caught a mine:** dropping only `_select_` hides nothing from an `edit` holder, because `_write_by_permission` is `FOR ALL`. ◐ **The DB half is proven; the screen half (showing an error rather than an empty list) is owed by Phase 3** — the DB cannot signal this.
- [x] `anon` cannot read or write `assignments` directly; the public RPC is the only path — as `anon`: `count(*)` = **0**, direct UPDATE took no row; the RPC returned `ok:true` on a valid token and a **byte-identical** generic message on all four failure paths (unknown · replayed · 49h-old · event already past).
- [x] `npm run gate` green — **exit 0**, re-run **12/08/2026** at the close of 5.1 (lint · format · 750 unit · build · jscpd · knip · audit · **`check:bidi`** · `check:context` · `check:docs-structure` 29 files / 0 findings). *(Was dated 09/08 here until 5.1; `check:bidi` joined the gate on 10/08 and this line did not say so.)*
- [x] `npm run test:run` green — **750 passed / 26 files** *(12/08/2026; 733/25 after steps 3.4+3.5, 662/22 after 3.3, 627/20 after 3.2, 575/17 at the close of Phase 2, 535/15 after 2.2, 428/13 at the close of Phase 1)*. ⚠️ **Flat across 3.7 · 4.2 · 5.1 on purpose** — those three fixed behaviour and added **E2E**, and a rising unit count would have been the wrong signal.
- [x] `npm run test:e2e` — ✅ **117 passed / 7.4 min, whole repo, 12/08/2026** *(module-4's own share: 38 — `hostesses` 20 · `smart-match` 12 · `public-confirm` 6, of which **15 were written at 5.1**)*. **The one red in that run was not a regression:** a 09/08 assertion pinned `(0)` on the bulk-resend button and the clock made it `(1)` two days later — proven pre-existing with `git stash` before it was touched (§10). ⚠️ **And read the E2E row in §7 before quoting this as full coverage** — no test presses *save* or fires a row action, on purpose.
      ↳ **The earlier resolution of the flaky-suite incident is kept below, not rewritten:**
- [x] *(09/08 — the harness fix that made a green run possible at all)* `npm run test:e2e` — ✅ **RESOLVED 09/08/2026 ~16:0X by the parallel E2E session, and the diagnosis
      was right: it was never a code bug.** The dev server was refreshing itself mid-run (Vite HMR),
      which is why login "never left `/login`" and why every one of the five passed in isolation.
      `test:e2e` now runs against **build + preview** (`playwright.e2e.config.js`, port 4173) and was
      verified **78/78 twice**, plus `smoke` green. Full detail: `CLAUDE_CODE_LOG.md` (09/08 15:3X).
      🔑 **Worth keeping: the symptom pointed at the application and the cause was in the harness
      running it** — every in-app suspect (rate limit · lockout · GoTrue throttle) was measured out
      first, and the honest "cause not identified" below is what kept the search alive instead of
      shipping a fix for a guess. *(Folded in here by the Phase-2 session once the file was free —
      the other session was blocked from writing it by rule 16.)*
      ↳ **The original, superseded record is kept below, not rewritten:**
- ◐ *(superseded — see the line above)* `npm run test:e2e` — **72 passed / 6 failed / 12.3 min, and NOT claimed as green.** One failure was
      a **real Phase-1 regression** (`customer-page:66`, the `projects` tab — fixed, re-verified
      passing). The other five pass in isolation; **their cause is NOT identified** — the two
      in-repo suspects (§7.8↳ rate limit · the 5-strike lockout) were both **measured out**, and a
      GoTrue throttle could be neither confirmed nor excluded (see §10). ⚠️ **A clean full-suite green
      was not achieved and is not being reported as one. This is a lost gate, not a cosmetic
      annoyance** — and the next move is a diagnosis, not a fix.
- [x] `npm run smoke` green — **exit 0**, re-run **12/08/2026** with the module-4 leg included *(⚠️ `test:e2e` excludes it silently; neither runs in CI — so "green" here means two commands were run by hand, and the closing audit must run both again)*
- [x] The hand-computed anchor reproduces: the three scores **and** the order `נועה ← מיכל ← דנה`, two candidates absent — **re-verified by name after every later change in the phase**, including the distance-label swap (09/08/2026)
- [x] The three §3.5 holes each fail a deliberately-wrong implementation *(hardcoded split · never-worked given the cap · mid-computation rounding)* — **all three watched red against code broken on purpose.** Hole (ג) needed its own non-round data before it bit; the first version of that test was green on a broken implementation (§10)
- [x] **UX & validation:** step 3.7's sweep ran, its 13 real findings are fixed, and **Ishay signed the gate 10/08 12:33** via a live acceptance walkthrough (5 stations ✔️ + the one open decision ruled closed-no-build) — see the 3.7 row in §1 and §10
- [x] All 8 approved surfaces built and screenshot-verified, including the public page on a phone viewport
      — ✅ **8 of 8 closed** *(3.6 landed משטח 5 on 10/08; the public page was screenshotted at **390px**
      in a session-less browser)*. 🔴 **And one honest boundary the tick does not cover:** the public page
      has **never been opened from a real phone over the internet**, and could not be — measured
      12/08/2026, `git show origin/dev:src/App.jsx | grep -c "shift/:token"` → **0**: the route exists only
      on this branch, so the deployed site has no such path. ⇒ **post-merge action, and only the merge
      unblocks it.**
      — ◐ **7 of 8 done 09/08/2026** *(3 · 3ב · 3ג · 3ד · 1 · 2 · 4 — the last two closed with steps
      3.4/3.5, including the row menu opened on **all six statuses on real rows**. **Only משטח 5, the
      public page, is left** — step 3.6.)* *(was: 4 of 8; the original note follows)*
      — ◐ **4 of 8 done 09/08/2026** *(3 · 3ב · 3ג · 3ד; screenshots of every state, both permission
      directions, and the §א4 window with a real name and date)*. **Remaining: 1 · 2 · 4 · 5.**
- [x] Every `🚧` in §2 has its **byte-matching** `🚧 מN` line in `PROJECT_MASTER §6` — **including the two authored this module** (M9 params screen · M6 attendance fields). ✅ **Verified 12/08/2026 by counting both sides:** the capability table declares tokens for **M6 · M8 · M9 · M10**, and §6 carries **8 · (M8 present) · 5 · 10** matching lines respectively. ➕ **NINE more were added by this audit — not six.** *(Re-counted 12/08/2026 by `regin-docs-sync` with a dedicated fresh-context agent: §6's audit block carries **nine** `← מ4` lines. The self-count written here was short by three, and — this is the part that matters — **the three it missed are the three whose subject never made it back into this guide at all**: the M6 cancelled-event one, the M11 report data-holes, and the M12 public-page wording.)*
  🔴 **And the direction that was never checked until now: §6 → guide.** The forward direction is clean — **every 🚧 in §2 has its §6 twin, 27 tokens verified one by one**. But **seven of the nine debts this audit wrote into §6 exist ONLY in §6**; this guide's own tech-debt log never learned about them. §6 is the registry a future module greps, so **no debt is silent** — but a session reading *this file* to understand what module 4 left behind would miss them. **The seven, by §6 subject, so they are greppable from here:** `findUnknownPlaceholders` / invite-failure collapsed to a bare count (M10) · three noisy defensive patterns in `04_hostesses/api.js` incl. `createShiftInvites` (M12) · `useReloadableData` — the same 13-line block in three M4 screens + `CustomersPage` (M12) · bank-details **structure** check deliberately not built (M8) · two report data-holes + the history-strategy ruling (M11) · a **cancelled event vanishing** from the recruiter overview via `OPEN_PROJECT_STATUSES` (M6) · the public page thanking a hostess who was *released*, not one who withdrew (M12). **Two more are partial here:** the `PricesManagementPage` `SelectTrigger` `aria-label` + the dead `GHSA-qwww-vcr4-c8h2` exemption (M12), and `ensureProjectCoordinates` still swallowing real RPC errors alongside the expected `42501` (M12).
  ⚠️ **The mechanism lesson, worth more than the list:** the Stop hook and the close template both enforce **guide ⇒ §6** and **neither enforces §6 ⇒ guide**. An audit that authors debts directly into the registry therefore leaves its own guide behind, silently, and its self-count is the only thing that would catch it — which is exactly what failed here.
- [x] `db_roadmap.md` rows for module 4 marked Done in §10 — ✅ **verified 12/08/2026**: all ten module-4 migrations carry dated `✅ DONE` entries, and the `hostesses`/`assignments` schema rows are marked done in place.
- [x] `PROJECT_MASTER §7` write-back done: **§7.67** marked deferred with its reasoning *(09/08/2026 — the item's own "בלופרינט-מ4 בוחן מחדש" instruction is now answered in place: the entity is ⏸️ deferred, the main justification collapsed with "אירוע דו-תפקידי לא קורה", re-adding later is one row per project, and the practical "time inheritance" need was met differently — `assignments.event_date` synced by trigger)*
- [x] `src/modules/04_hostesses/CLAUDE.md` written — the module's own gotchas file. ✅ **Refreshed at the close** with three traps the audit itself produced: `releaseAssignment`'s new `{row, mail}` shape (a coupled edit — a caller that destructures wrongly loses the reporting again), the overview's dependence on the **'פרויקטים'** permission, and the geocode-save-is-a-cache rule.
- [x] 🆕 **Automations registry written — `docs/automations.md`, 12/08/2026.** Every count in it was measured live at the close (`cron.job` → **2 jobs**; `information_schema.triggers` → **20 triggers, 6 of them business logic**; 1 Edge Function; 2 anon-callable RPCs; 1 Make scenario that is **not in the repo at all**). 🔴 **And it opens with the disorder it was seeded with**, exactly as instructed: `module1-login-attempts-cleanup` is defined inside a **module-3** migration filename — unfixable by rule, and therefore invisible to anyone searching by filename. *(Original requirement below, kept verbatim.)*
      *(was: )* 🆕 **Automations registry written** *(Ishay approved 09/08/2026, in answer to "should we open an
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
- [x] 🆕 **DONE — the verdict says it, and so does the report page Ishay reads.** ➕ **And the audit gave the sentence teeth it did not have when this box was written:** the one blocker that mattered most lived in exactly that uncovered surface (`releaseAssignment`), so its fix was verified **by hand through fault injection** rather than by "the suites are green" — and the verdict states that too, per §6b's blind-spot clause. *(Original requirement below, kept verbatim.)*
      *(was: )* 🆕 **The closing verdict SAYS OUT LOUD that the module's write path has no automated coverage** *(Ishay's ruling 12/08/2026)*. Required wording, in substance: the unit suites cover the **rules** and the E2E covers the **screens and their blocks**; `api.js` — every write in the module — is covered by **neither**, and was proven by **one live hand-run on 09/08** (20 hostesses created through the screen; the full assignment lifecycle exercised). 🔴 **A verdict that reports `gate exit 0` + `117 E2E` without this sentence is inaccurate by omission** — that combination reads as "tested", and the one thing a reader most wants to conclude from it is the one thing it does not show. The structural fix is `🚧 מ12 ← מ4` (a second Supabase project); until then this is a **stated limitation, not a gap being hidden**.
- [x] `STATUS.md` points at this guide, and `CLAUDE_CODE_LOG.md` carries the session entry — ✅ both written during the audit, not after it, so a session death would not have lost the measurements.

*(Post-merge — **not** audit checkboxes, and a truthful audit must not be forced to mark them ❌:
PR opened · CI green · merged. The closing verdict says the module is **mergeable**, not merged.)*

## §9 🔄 Self-Update Protocol

(a) update the status header + step table **at every step transition, same session**;
(b) any deviation gets an inline `↳ as-built` note + a line in §10;
(c) the Stop hook blocks session end if `src/modules/04_hostesses/**` changed and this guide did not —
⚠️ **and it is blind to `e2e/`, `scripts/`, `src/lib/`, `src/components/`** (**verified 09/08/2026**:
`.claude/hooks/check-docs-updated.sh` matches `src/modules/*` and nothing else), so phases 2/4/5
are updated by discipline, not by the hook;
(d) end-of-session protocol per `CLAUDE.md`;
(h) **on ENTERING a phase** — sweep this ledger for OPEN items anchored to that phase and get a
consolidated ruling from Ishay **at the phase door** (measured 08/08/2026: Phase 1 has none);
(i) **compaction** — a closed phase collapses to a done-table + evidence; never compact the active
phase, §10, or the ledger.
(j) 🆕 🌊 **CLOSING A STEP = SWEEPING ITS RIPPLES, and the step is not closed until the sweep is
written down** *(Ishay's ruling 09/08/2026, in his words: "מוזר שאני צריך להגיד כל הזמן")*.
**Why this exists next to (b) rather than inside it:** (b) covers a *deviation*; iron rule 13 covers
a *decision*. **Neither fires when a step simply finishes** — and that is where the drift actually
comes from. **Measured on step 2.2 the same day:** the §10 entry was written correctly and **four**
spots still went stale — a `[x]` DoD line reading `428 passed` after the count reached 535, the
step-2.2 instruction still saying the tie-break "runs in SQL" with no inline `↳ as-built`, ledger
assumption #6 still naming `md5`, and `research §11.2` still carrying the SQL formula with nothing
pointing at the as-built. **All four surfaced only because Ishay asked — the second time in one
day.** ⇒ **at every step close, walk these five and write one line saying what you touched, or the
word `אין`:** ① the step's own `↳ as-built` · ② §10 · ③ **every DoD checkbox whose number or claim
this step moved** · ④ the Ledger row the step implements · ⑤ **any approved-spec or research section
that now states differently what you actually built** — and there the fix is a **tagged as-built
pointer, never an edit to a number** (`§11` stays the SSOT). **An empty `🌊` line means the step is
still open.**
**(e)/(f)/(g): per `CLAUDE.md` iron rules 13/15/16 + the end-of-session protocol.**

## §10 📝 Deviations & Tech-Debt Log

- 🔬 **12/08/2026, closing audit — the module's sharpest defect was proven by breaking the network, not by reading the code, and the same harness proved the fix.** `releaseAssignment` (`api.js`) wrapped its whole email send in an empty `catch {}` and returned the row only, so **no caller had a channel to learn the mail had failed** — while three call sites promised in words that it had been sent (`SmartMatchPage`'s `שוחררה, והודעה נשלחה אליה`; `RepositoryTab`'s deactivate dialog *"והדיילת תקבל מייל-ביטול על כל אירוע"*; the auto-release inside `approveFinalAndRelease`, whose `result.mail` covered **only** the final-approval mails). 🔴 **The comment above the `catch` claimed *"והמסך מדווח על המייל בנפרד"* — and that was simply false.** ⇒ it now returns `{ row, mail }` with the same three outcomes the invite path already used (`sent`/`unknown`/`failed`), plus a separate `result.releaseMail` counter. 🔑 **Why `unknown` matters and is not pedantry:** a timeout reported as "failed" makes the manager resend, and the hostess gets two contradictory emails. **Evidence, one run each way:** with `**/functions/v1/send-email**` aborted at the network layer, "פתח זימון חדש" reported honestly while "שחרר" reported success and `email_log` gained **0** rows; after the fix, the same abort produced *"דנה לוין שוחררה — לא ידוע אם ההודעה יצאה"*. ⚠️ **And this is a write path in `api.js`, which no suite reaches** (§10's coverage debt) — so it was verified **by hand**, deliberately, and the verdict says so.
- 🟢 **12/08/2026 — the overview could show a green ✅ where the truth was "denied".** `listStaffingOverview` reads `projects`, whose RLS belongs to module **'פרויקטים'** while the route gate requires **'דיילות'**; a denial there returns `{data: [], error: null}` and `EmptyState` rendered *"אין כרגע אירועים הממתינים לאיוש"* — verbatim the failure `spec.md § מה ייחשב עובד` **#4** names as the module's worst. **Measured honestly: it does not fire on today's matrix** (no role holds `דיילות ≠ blocked` with `פרויקטים = blocked`) **and is one CEO edit away**, from a permissions screen that gives no hint of the dependency. ⇒ `OverviewTab` now checks `permissions['פרויקטים']` client-side and renders an explicit permission message. 🔑 **Why a client-side check and not a smarter query:** RLS returns empty *without a signal*, so "no data" and "denied" are indistinguishable **from the response** — but knowable in advance from the permission map.
- 🟢 **12/08/2026 — a successful geocode was thrown away when its save was denied.** `ensureProjectCoordinates` returned `error ? null : coordinates`; a view-only role hits `42501` on `set_project_coordinates` **by design**, so the resolved point was discarded and every candidate card showed `אין קואורדינטות` — read as *"my hostess records lack addresses"* when the truth was *"the **event** has none"*, with proximity (38% of the live weights) silently no longer filtering. ⇒ the point is returned regardless; **the save is a cache, not the source of truth for that render.**
- 🟢 **12/08/2026, Ishay's ruling ("לתקן בסבב הזה") — a client-cancelled event no longer counts *in her favour*.** `countWorkedForCustomer` (`src/lib/smartMatchCandidates.js`) counted any past `finally_approved` row for that customer with no exclusion of `project_status = 'cancelled'`, so an event the client cancelled still produced `עבדה אצל <לקוח> N×` and lifted her in the matching sort angle. ⚖️ **Why no document settled it:** `§ב8` rules only that a cancellation must not count **against** her; a credit is not a penalty, so the rule never reached it. **Regression test added and proven to bite** — green with the fix, exactly one failure with the line deliberately removed, green again on restore.
- 🔴 **12/08/2026 — the fix round's OWN diff was scanned, and it caught two defects the fixes had just introduced.** *(This is why §6b requires re-scanning the diff: the code written last, under time pressure, is the only code in the module no scan has seen.)*
  **‏(1) A failed AUTOMATIC release was reported nowhere at all.** The round added a channel for the **mail** and left the **release itself** silent: in `approveFinalAndRelease`, a target whose write failed simply **did not get pushed** to `result.released` and vanished from the toast — while the confirm dialog one step earlier had named that hostess to the manager and promised *"כל אחת מהן תקבל הודעה שהמשרה אוישה"*. **Consequence:** she stays `confirmed_available` on a fully-staffed event, is never emailed, **and turns up to the shift**. 🔴 **And the comment above that branch still promised *"הוא מדווח למסך כמספר"* — a false reassurance of exactly the shape the round had just removed two lines below it.** ⇒ `result.releaseFailed` added, reported by name at both call sites, comment corrected.
  **‏(2) The new no-permission message lost to the filter message.** I had written `!filtered && !canReadProjects`, so a blocked user saw the correct red message **until she clicked any filter pill** — then the screen told her *"לא נמצאו אירועים התואמים לסינון"* and offered a **"clear filter"** button. **The module's worst-defined failure, re-entering through the side door.** ⇒ the permission branch is now unconditional and first.
- 🟢 **12/08/2026, Ishay's ruling ("אני רוצה לעשות מה שנכון") — the cancelled-event rule was applied to ALL FOUR counters, not the one that had the bug.** The same scan found the ruling implemented in `countWorkedForCustomer` only, while `HostessViewCard`'s per-customer chip, `eventsInLastQuarter` and `weeksSinceLastWorked` still counted a cancelled event — **so the same hostess and customer would show one number on Smart Match and another on her own card, under the identical label.** ⇒ a single exported predicate `eventWasCancelled` (`src/lib/hostesses.js`) is now the only door, all four sites call it, and `listRepositoryAssignments` had to start selecting `project_status` — **without which the rule dies silently** (`undefined !== 'cancelled'` ⇒ everything counts).
- ⚠️ **12/08/2026 — two findings surfaced AFTER the regression run, and neither is caused by the fixes.** ‏**(1)** the a11y `button-name` on `/system/prices` **survived** the `waitForReady` widening (`nav` → `networkidle` → `h1`): 11 nodes = the 11 products' Radix `SelectTrigger`s, whose accessible name comes only from the rendered `<SelectValue />`. It passes in isolation and fails under the parallel full suite ⇒ **the real cure is an `aria-label`, not a longer wait** — the button genuinely has no name until its value paints. ‏**(2)** `sm-angle-fastest` asserted the "תענה הכי מהר" angle is disabled for lack of response-time data — **and the UAT created the first `responded_at` in the system**, so the angle correctly turned on. **Same family as the 5.1 clock-rot:** a test pinned to a live-data state that our own work changed. ⇒ **Both routed to Ishay under §6b's floor rule** (a second harmful finding after the regression run is his call, not an unbounded loop).

- 🔴 **DEBT surfaced 12/08/2026 by Ishay's question, and it is the sharpest coverage gap in the module: `src/modules/04_hostesses/api.js` — the module's ENTIRE write surface — has zero automated coverage of any kind.** Measured, not estimated: `grep` across every `*.test.js` returns **zero** matches for `createHostess` · `updateHostess` · `releaseAssignment` · `markAssignmentStatus` · `approveFinalAndRelease` · `setShiftLead`. The unit suites cover the **rules** (`hostesses.js` · `assignmentActions.js` · `smartMatch.js` — 750 tests) and 5.1's E2E covers **the screens and their blocks**; between them sits `api.js`, and nothing tests it. 🔑 **What DOES exist, and it is real:** one live hand-run on 09/08 — 20 hostesses created through `createHostess` in a signed-in browser (`local-14`, 20/20 succeeded, 20/20 geocoded) and the full assignment lifecycle exercised end-to-end at 3.4 (5 invites sent · 1 finally approved · 1 released · 1 declined · 1 withdrawn). ⇒ **the writes are proven once, by hand, and guarded by nothing** — a regression in `api.js` tomorrow is caught by no gate. ⚠️ **Why this was not visible until asked:** every artifact said "E2E doesn't cover writes" while implying unit tests did, and **the sentence was never checked** — including in this guide's own 5.1 as-built, written hours earlier. ✅ **RULED by Ishay 12/08/2026 ("בצע לפי המלצתך") — (a) + (c), and the mechanism is in place, not just the sentence.** **(a)** the closing verdict must **state the limitation out loud** rather than let a green gate imply coverage — enforced as a **new DoD checkbox in §8**, so 5.2 walks it like every other line instead of relying on someone remembering. **(c)** a second Supabase project is the real fix and is now registered as **`🚧 מ12 ← מ4` in `PROJECT_MASTER §6`** (verified with `grep '🚧 מ12'` in the same session), with the note that the exposure is **project-wide, not module-4-specific** — M2 and M3 carry it identically. 🚫 **(b) was considered and rejected, with its reason recorded so it is not re-proposed:** integration tests inside `begin…rollback` (the pattern Phase 1's migration probes already used) would cover only half the path — the mail-sending actions cannot be rolled back — while adding a new write surface 9 days before submission.
- 🔴 **DEBT, restored 12/08/2026 — the deployed `send-email` was never byte-compared to the repo file, and this module's own close owed that check.** Step 0.3 deployed the shared engine through Supabase MCP `deploy_edge_function` → **v4, ACTIVE**, by **transcribing `supabase/functions/send-email/index.ts` into the MCP call**. ⇒ **repo⇄deployment identity is verified behaviourally, not byte-for-byte** — the 7-case gate matrix and the three real emails opened in Gmail prove the paths that were exercised, not that the live body equals the file. The Phase-0 carry-forward said in as many words *"re-check it byte-wise at module close with `get_edge_function`"*; **the close ran and did not** (measured 12/08/2026: `get_edge_function` appears nowhere in the repo outside the module-4 archives). 📌 **Bounded, not alarming:** the repo file's last commit is `70c739e`, **09/08 08:45 — before the deploy** — so nothing has diverged *since*; the only unknown is the transcription itself. ⇒ **owed as a post-merge action, and it is one MCP read.** ⚠️ **And it is not module-4-only: `send-email` is owned by M3 and consumed by M4 · M8 · M11**, so the generalizable half lives in `CLAUDE_CODE_LOG.md` `## Reference: Operational Gotchas` — do not restate it here, both halves must not drift. *(Restored 12/08/2026 by the compaction audit — removed in the 12/08 guide compaction, found nowhere else.)*
  ✅ **PARTLY DISCHARGED the same day, 12/08/2026 ~14:5X — `get_edge_function` was finally run** (Supabase MCP authenticated this session). **What it proves:** the live function is `slug: send-email · version 4 · status ACTIVE`, and its source matches the repo file on **every load-bearing marker** — the exact pin `jsr:@supabase/supabase-js@2.112.0` (not `@2`), both entity maps (`ENTITY_MODULE` with `shift: 'דיילות'`, `ENTITY_REQUIRES_ATTACHMENT` with `quote: true` / `shift: false`), the deny-by-default 403-before-400 gate order, the two-step `role_id` + `status='active'` permission query, the `log_failed` additive contract, and the always-send-five-keys webhook body. **Nine of nine checked; zero divergence.**
  🔴 **What it does NOT prove, and why this cannot be closed from here.** A true byte diff needs the deployed text written to disk and `diff`-ed — and the only route available is for the text to pass **through this session's own transcription**, which is the exact hazard the debt is about. **A transcription that silently "corrects" toward the repo file would produce a clean diff that means nothing.** ⇒ **the byte-level half stays open on purpose**, and closing it needs a mechanical pipe (CLI `supabase functions download`, or an MCP call whose output is redirected to a file without a model in the middle). **Downgraded from "never checked" to "semantically verified, byte-level open" — not from open to closed.**
- 🐞 **Found + fixed 12/08/2026, step 5.1 — a test that pinned a live count as an eternal truth, and rotted on the clock two days later.** `e2e/hostesses.spec.js`'s *"שלח שוב למי שפג תוקפן (0)"* asserted `toBeDisabled()` **and** `toContainText('(0)')`. Written 09/08, it went red on 12/08 **with no code change anywhere near it**: `רוני אלמוג`'s invite was sent 09/08, the public link lives 48 hours, so from 11/08 there is exactly one expired-and-resendable invite ⇒ the button correctly reads `(1)` and is correctly **enabled**. 🔬 **Proven pre-existing before it was touched, not assumed:** `git stash` → the same test → **same failure on the pre-5.1 code** → `git stash pop` (`e2e/CLAUDE.md`: *"לפני שמייחסים כשל-E2E לשינוי האחרון"* — the rule that already caught one false attribution on 10/08). **Fix — the invariant the test's own title always claimed** (*"ואינו נעלם"*, §11.4: a control that vanishes teaches inconsistency, a disabled one with a number teaches *why*): the button is always present, the count is **read off the label**, and `disabled` must agree with it (`0` ⇒ disabled, `>0` ⇒ enabled). 🔑 **Why this matters beyond one line: this is the third documented instance of the same family** *(04/08 — 8 specs pinned to quote #6 · 09/08 — the whole module-4 suite pinned to `overview-row-8` and dated to die on 23/08 · now this one)*, and it is the first where the rotting value was a **count** rather than an id — i.e. the `🚧 מ4 ← מ3` fixture debt is wider than "don't hardcode ids": **any live-derived number is a fixture too.**
- 📌 **Correction 12/08/2026 to the 11/08 fixture-ruling entry below — it said ONE residual hardcoded fixture; there were THREE.** The 4.2 entry named only `smart-match.spec.js`'s load-failure test. Measured at 5.1 by grepping both files: `hostesses.spec.js` carried **two more** (`overview-row-8` + `overview-row-3` in the landing test, and the same pair compared by index in the sort test). **All three are gone** — the landing test now asserts a row exists and the demo event appears **by name**, the sort test reads the **rendered dates** of the missing-events group and asserts they ascend (a stronger claim than the old id-vs-id comparison, and one that survives any project id), and the load-failure test selects the first row at runtime. 🔑 **The lesson is about the absence-claim, not the count:** the 11/08 entry reported "one residual" from the file it happened to be editing, and an absence is only as wide as the search behind it (`_shared/discipline.md`). **A two-file `grep` would have cost seconds.**
- 🔴 **`הנחתי` (11/08/2026, step 4.2) — the demo seed does NOT reproduce `spec.md §3.1`'s exact anchor case; five differently-named hostesses illustrate the gate mechanics instead.** Ishay's ruling, in chat: build the light version — five new demo hostesses with no fabricated response history, chosen so each of the gate's five conditions is demonstrated in isolation (near+car passes · medium passes · far+car passes because of the car · far+no-car fails · near+car-but-declared-unavailable fails), rather than engineering ~20-30 fake past invite/response cycles to reproduce the literal `נועה 0.67 · מיכל 0.66 · דנה 0.64` order live. **Cost estimate given and accepted:** 2-4 hours of additional scripted history-building, with real risk of more hidden bugs (see the very next entry, found in *this* lighter pass) and new fixture-rot exposure this step's own title warns against — against a 21/08 dev-merge deadline with 5.1/5.2 still ahead. **What this does NOT touch:** the hand-computed `0.67/0.66/0.64` anchor stays proven at the unit level (`smartMatch.test.js`, reproduced at every gate since 09/08) — nothing about its correctness is weakened. 🔴 **Naming, `הנחתי`, mine to decide (no product content, purely to avoid on-screen confusion):** none of the five reuse `spec.md §3.1`'s character names (נועה/דנה/מיכל/יעל/שירה) — project 8 already carries a real, Ishay-approved `נועה שגיא` (finally_approved, shift lead) from the 3.4-3.7 lifecycle demo, and a second "נועה" on the same screen would confuse the story at the conference. Five fresh names used instead (מאיה כהן · שירי לוגסי · טל ברקאי · קרן אשכנזי · ליאת רזניק), tagged in `scripts/demo-seed.mjs`'s own comment. 🚫 **No `[דמו]` tag anywhere in hostess fields** — same ruling as `local-14` for the original 20, restated by Ishay explicitly this session after he first suggested a delete-and-reseed shortcut and then asked to keep it real-looking instead; the five are identified for `--reset` by their fixed `id_number`s, not by a text marker.
- 🔴 **Bug found + fixed, 11/08/2026, step 4.2 — the Smart Match availability gate checked "today", not the event date.** `SmartMatchPage.jsx`'s `ranked` memo called `rankCandidates(candidates, { params, eventDate: today, projectId })` — `today` being the real current date, not `project.final_event_date`. `rankCandidates` feeds `eventDate` into exactly one thing, `isUnavailableOn` (`src/lib/smartMatch.js`'s `passesGate`), so the "declared unavailable" gate condition — one of Smart Match's five disqualifiers, and the exact reason `spec.md §3.1`'s שירה is excluded — was silently checking the wrong date since it shipped at step 3.4 (09/08) and survived the full 3.7 review sweep (10/08) untouched. **Why no prior test caught it:** the pure-layer unit tests (`smartMatch.test.js`) pass `eventDate` explicitly as a distinct test input and never "today" — the defect lived only in the screen's wiring, invisible to those tests by construction. It surfaced only because the new seed data (`ליאת רזניק`, unavailable 20/08–25/08 against the 22/08 event) exercised a future-dated unavailability range for the first time. **Fix:** `eventDate: project?.final_event_date`. **Verified the guard, not just the fix** — reverted the one line, watched the new regression test fail (`exit=1`), restored it, watched it pass; full `smart-match.spec.js` + `hostesses.spec.js` (17 tests) green after. **Regression test added:** `e2e/smart-match.spec.js` — "שער אי-הזמינות בודק את תאריך האירוע — לא את תאריך היום", selecting the event by name at runtime (not a hardcoded project id), asserting an eligible new hostess is visible and the unavailable one is not. **The other four gate conditions were re-checked, not assumed clean:** "same-day elsewhere" is computed by a separate DB query that already uses `project.final_event_date` correctly (no shared bug class); distance/car and customer-blocked preference carry no date dependency at all — confirmed by reading, not just by this incident's proximity.
- 🔴 **`הנחתי` (11/08/2026, step 4.2) — fixture-selection-pattern ruling for module 4's own future E2E (the `🚧 מ4 ← מ3` debt this step named).** Every new spot this session that needed to find "the demo event" selected it **at runtime by event name** (`page.locator('[data-testid^="overview-row-"]', { hasText: 'כנס לקוחות שנתי' })`), not by a hardcoded `overview-row-8` — same pattern `quote-email.spec.js`'s `SENT_RECIPIENT` and this file's own `openSmartMatch` helper already use, for the exact reason `e2e/CLAUDE.md` records: a fixture pinned to a live-DB id rots the moment that id's row changes. **Ruling for step 5.1 (not yet built): module-4's own E2E specs follow the same rule — select by a condition true at the moment the test runs, never a bare numeric id.** ⚠️ **One residual, pre-existing exception found and NOT touched (out of this step's scope):** `smart-match.spec.js`'s load-failure-guard test still hardcodes `page.getByTestId('overview-row-8').click()` — it predates this ruling and will need the same runtime-selection fix when 5.1 touches that file; flagged here so it isn't rediscovered as new.
- 🟢 **CLOSED (with a new decision inside it) 10/08/2026 — Repository deactivate-dialog now offers a real release action.** Full context and every other 3.7 finding is written once, in the 3.7 row of §1's step table (not duplicated here) — this entry exists only to record the **decision** taken along the way: Ishay ruled `בנה עכשיו` live in chat when shown that the dialog's "will be added later" text was stale (the release capability shipped at 3.4/3.5) and that it buried the mockup/spec's recommended action as inert text. `futureActiveAssignments` (`src/lib/hostesses.js`) was widened with `hostessId`/`assignmentNumber` on its returned objects — additive only, no existing consumer's shape changed, no test broke. **Verified:** `npm run gate` exit 0 (750 unit, unchanged count) · live Playwright pass against the real dev server showed the dialog rendering correctly with real data · the release action itself was **never actually clicked** during verification (would have emailed a real address, per `e2e/CLAUDE.md`'s no-mutate-live-data rule) — so the write path is code-reviewed and gate-verified, not yet exercised end-to-end. **Owed:** the first real click of "שחרר מהאירועים" should be watched once, the same way `local-14`'s hostess-creation and `3.6`'s public-page write were.
- 🟢 **CLOSED, same session (10/08/2026, later) — the shared-component decision was made and built.** `LoadingOrError` (`src/components/LoadingOrError.jsx`) gained an opt-in `skeleton` prop — `table`/`cards`/`card`/`fields`/`page` variants, all `animate-pulse` gray bars — with the plain `"טוען..."` text staying the default when `skeleton` is omitted, so every existing call site across modules 1–3 is untouched, byte-for-byte. Wired into the 5 module-4 call sites the spec actually names (`cards×8` on Smart Match, `table` on Repository, `card` on the view card, `fields` on the edit dialog) plus Overview's table (not spec-required there — a consistency addition, said so in the code comment, not silently invented as a requirement). **Also fixed in the same pass:** the ADD-mode dialog was gating its empty form behind a loading spinner even though `screens-approved.md:702` explicitly forbids any intermediate state there — `loading` now starts `false` for ADD and only `true` for EDIT, so the blank form appears immediately and `params`/`peers` populate in the background. **Verified:** `npm run gate` exit 0 · full E2E regression across modules 1–4 (59 tests: `customers`, `customer-page`, `permissions`, `quotes`, `load-failure-guards`, and all four module-4 specs) — zero failures, confirming the shared-component rewrite didn't touch modules 1–3's behaviour · live screenshots of the table and 8-card skeletons rendering correctly under artificial network latency. **Not independently screenshotted: the `card`/`fields` variants** — the dialogs they guard resolve too fast even under throttling to reliably catch mid-render; covered by build+lint+the same E2E run (which opens both dialogs) but not by a dedicated loading-state screenshot. **This is now infrastructure every future module inherits for free** — a new screen that wants a skeleton passes the prop; one that doesn't, doesn't notice anything changed.
- 🟢 **CLOSED 10/08/2026 — `RepositoryTab.jsx`'s city-filter `Select` had no `aria-label` at all**, found by the axe-core sweep (`e2e/accessibility.spec.js`, project-wide infra, not module-4-specific — full story in `architecture_and_qa_roadmap.md` and `CLAUDE_CODE_LOG.md`, not duplicated here). This is the one real module-4-scoped fix from that sweep; added `aria-label="סינון לפי עיר"`. The sweep's first run also reported a broader "7 of 8 screens missing `<main>`/`<h1>`" finding that turned out to be a race condition in the test itself, not a module-4 (or any) defect — corrected in the journal, not repeated here since it never was a module-4 finding.
- 🟢 **RULED CLOSED 10/08/2026 12:33 — "X פג תוקפן" stays inert text, not built as clickable-and-scrolls.** `screens-approved.md` מסך 2 §① names it as a navigating element ("מנווט — מגלגל לשורות הרלוונטיות"); found during the 3.7 sweep, flagged with low confidence it's worth the added complexity. **Ishay ruled it during the 3.7 acceptance walkthrough: "כן סבבה מה שהמלצת"** — agreeing with Claude's recommendation not to build it. A deliberate deviation from the spec's drawn behaviour, not an oversight — recorded per the arbitration rule's own escape hatch (Ishay decides what neither rule cleanly covers).
- 🟢 **CLOSED 10/08/2026 — migration H applied (`20260810001421`), and the code half shipped with it.**
  Ishay approved the recommendation and typed the echo. The template line is now
  `איש קשר בשטח: [שם_מנהלת_פרויקט], טלפון: …`, and `resolveShiftContact` returns
  `אחראית המשמרת <שם>` / `מנהלת הפרויקט <שם>` — **the role travels inside the value.**
  🔑 **Why the two halves had to ship together:** the migration alone downgrades the line to a bare
  name with no role; the code alone would have doubled it (*"מנהלת הפרויקט -מנהלת הפרויקט ישי"*).
  ⚠️ **And the test's template constant was updated in the same turn** — had it stayed on the old
  text, the suite would have gone green on exactly that doubled string, since `toContain('ישי אטיאס')`
  cannot see it. **A pinned copy of live data is only a guard while it is re-pinned.**
  🔬 **Verified:** the `params` row re-read from the DB · `resolveShiftContact` unit-pinned to the
  rendered line with the role asserted **exactly once** · and נועה שגיא marked as shift lead **through
  the screen**, confirmed in the DB (`is_shift_lead = true`) and on the row (`★ אחראית משמרת`).
  🚫 **Not verified: a real mail sent while a lead is marked** — no send was exercised, on purpose
  (every demo address bounces into Ishay's inbox). ⬇️ The finding that produced it:
- 🔴 **09/08/2026 · steps 3.4+3.5 — the original finding: the final-approval mail
  MISLABELS the shift lead.** `תבנית_אישור_סופי_שיבוץ` hardcodes *"איש קשר בשטח: **מנהלת הפרויקט**
  -[שם_מנהלת_פרויקט]"*, while `local-2` (Ishay, 08/08) rules the contact is **the shift lead when one
  is marked**. ⇒ the moment a lead is marked, the mail introduces her in a role that is not hers.
  🔑 **This is not a new discovery — `spec.md §12` already recorded it** (*"ולתבנית אין placeholder
  עבורה בכלל"*) and §7.89 delegated *"each placeholder ruled on its own merits"*, but nobody came back
  to it. **Cost of the fix: a params UPDATE ⇒ a ninth migration**, so it cannot be done silently.
  **Recommendation:** drop the two hardcoded words from the template so the line reads
  *"איש קשר בשטח: [שם_מנהלת_פרויקט], טלפון: …"* and let the value carry the role
  (`אחראית המשמרת נועה שגיא` / `מנהלת הפרויקט ישי אטיאס`). 🚫 **Until ruled, do not mark a shift lead
  on a project whose approval mails have gone out.** The code side is already ready:
  `resolveShiftContact` returns `isShiftLead`, and only the template text has to change.
- 📌 **09/08/2026 · `הנחתי` ×2, steps 3.4+3.5** — nobody stated these and I did not measure them:
  ① **A hostess who already has a row on this event is not listed as a candidate.** `§ב1`'s gate has
  five conditions and this is not one of them; she is already in the right-hand column, and showing
  her on both sides invites a duplicate invitation. **It closes no door** — `declined`/`released` come
  back through `פתח זימון חדש`, which exists for exactly that.
  ② **Marking a second shift lead is disabled-and-explained**, not attempted. `§ב5` says *"ביטלה ⇒
  הסימון משתחרר, המנהלת מסמנת אחרת"* and never says what a click does while one is marked; the DB has
  a partial unique index, so the click **would fail**. Disabled-and-explained is the pattern this
  surface already uses for `שלח את הקישור שוב`.
- ⚠️ **09/08/2026 · measured, and it changes what a demo can claim: the 19 `@regin-demo.co.il`
  addresses BOUNCE.** The domain does not resolve, so every send to them returns a Gmail
  non-delivery notice to Ishay's inbox — **while `email_log` records `sent`, because Make accepted the
  request.** 🔑 **This is the sharpest live proof of the project's own rule that a `200` is not
  delivery**, and it is now a fact about the demo data, not a defect: only `נועה שגיא`
  (`ishay1997@gmail.com`) actually receives. **Decision needed from Ishay only if the bounce mail
  bothers him**; the app behaves correctly either way.
- 🐞 **09/08/2026 · step 3.4 — `formatDate` accepted a timestamp and emitted garbage
  (`09T20:33:42.432+00:00/08/2026`).** ⚠️ **And the existing `dates.test.js` KNEW:** its own case sliced
  the string to 10 chars *before* calling — a guard written around one caller instead of around the
  function, which is the same shape as the two vacuous tests of step 3.1. ⇒ `formatDate` now rejects
  non-date input, and `formatTimestamp` (Asia/Jerusalem) was added — **the timezone is load-bearing:
  a mail sent 01:10 Israel time is stored as 22:10 of the previous day.**
- 🔬 **09/08/2026 · the NINTH bidi occurrence — `62% / 38%` renders reversed.** `Range` rects put
  `38%` LEFT of `62%`. **Fixed by deleting the sequence, not by isolating it:** each percentage moved
  next to its own word. 🔑 **The rule this adds to the family: `Money`/`LRI…PDI` fix a single value
  inside Hebrew; a two-value sequence has no correct order at all, and must be broken up.**

- 🔴 **09/08/2026 · steps 3.1–3.2 — the SEVENTH occurrence of the bidi family, and Ishay spotted it
  from the code before it was ever rendered.**
  His note: *"סכום כסף שנכתב ידנית בתוך משפט עברי… לא טענתי שזה שבור — לא ראיתי את זה מרונדר. שווה
  מבט בעין."* **Measured in a real browser rather than eyeballed** — glyph positions via `Range` rects:
  **both** strings put `₪` to the **LEFT** of the digits, while `Money` on the same screen showed `45 ₪`.
  ⇒ two fixes: the JSX hint now goes through **`Money`**, and `minWageError` — a **flat string that has
  no `Money` equivalent** — wraps its amount in `U+2066…U+2069` (LRI…PDI), the text-level twin of
  `unicode-bidi:isolate`. Re-measured after: `shekelLeftOfDigits: false`.
  ➕ **And looking at the built screen caught an eighth, one column over:** the rating rendered
  **`★ 5`** while the mockup's source says `5 ★`. ⚠️ **The mockup itself would have shipped the defect** —
  it isolates the wage column (`.num`) and not the rating column, so *"build it as drawn"* alone
  reproduces it. Same wrapper applied.
  🔑 **The shape worth keeping: a measurement caught what the code review would not, and the eye caught
  what the measurement was not pointed at.** Neither alone was enough.
  📌 **Not closed by this:** the same weakness lives in every flat `params` mail template
  (`תבנית_זימון_משמרת` and its sisters, and M8/M11's future ones) — the `IREG-IN` entry above is the
  same disease. `isolatedShekels` is deliberately **not exported** until one of them consumes it.

- 🔴 **09/08/2026 · step 3.1 — TWO of my own new tests passed against deliberately broken code.**
  I broke three behaviours on purpose; **only one test went red.** The two that stayed green —
  *"counts events, not rows"* and *"only the deciding row counts"* — had been written with data where
  folding and not-folding produce the **same answer**, so they asserted a truth that held either way.
  Rebuilt with discriminating data (a superseded `declined` row; a final `approval_withdrawn` row), and
  then both went red on the same breaks and green on revert.
  🔑 **Third instance of one shape in this module** (after the §3.5(ג) rounding hole and the geocode
  fixtures): **a guard written against data the feature already passes is not a guard — and no amount of
  re-reading reveals it. Only breaking the code does.**

- ⚠️ **09/08/2026 · step 3.1 — the route was wired here instead of at 4.1, deliberately.**
  Phase 3 requires functional **and visual** verification of every step, while `App.jsx` rendered
  `<UnderConstruction>` until 4.1 ⇒ **the plan asked for screenshots of an unreachable screen.**
  One line moved forward; **4.1 still owns the public route and the `App.routes.test.jsx` allow-list**,
  which is the part that is actually a security boundary. The AST guard was re-run green.
  ➕ **Ripple:** the `knip` waiver for `04_hostesses/api.js` was **narrowed, not removed** — the file
  is consumed now, but `listStaffingOverview` (3.3) and `getSmartMatchData` (3.4) still have no
  consumer. Its removal trigger moved from 4.1 to **3.4**, and its stale justification was rewritten
  rather than left standing on a claim that is no longer true.

- 🟢 **09/08/2026 · Phase-3 door — all three open items ruled, none silently.**
  **§7.41** closed on a measurement (`assignments` PK covers the race — the failure is loud) ·
  **§7.33** closed on a **product** reason, not a technical one (the released hostess gets her own mail,
  and a DB trigger cannot send mail) · **`local-12`** closed because `local-10` removed its ground.
  📌 **Recorded because a scan would otherwise re-open them:** all three carry a `לא-נדרש-כי` / ruling
  verdict in the Ledger, and §7.33/§7.41 got their write-back in `PROJECT_MASTER §7` **first** (rule 13א).

- 🆕 **09/08/2026 · the pool is real data now — 20 hostesses, and they cannot be deleted.**
  Ishay's ruling (`local-14`). Created through the app's own `createHostess` in a signed-in browser:
  **20/20 succeeded, 20/20 geocoded, 0 failures.**
  🔴 **Two findings from the run that Phase 3.4 needs:**
  **(1) The `אין קואורדינטות` state did not occur even once** — I deliberately left one hostess with a
  city and no street, expecting it, and Nominatim resolved the city fine. ⇒ **that on-screen state is
  reachable only for a genuinely unresolvable address, not for a thin one.** Said out loud because
  "I demonstrated it" would have been false.
  **(2) 🔑 But the collapse case DID appear, in real data:** `סיון נחום` (`קינג ג׳ורג׳ 20, ירושלים`)
  resolved to **`31.7788472 / 35.2257856` — byte-identical to project 3's coordinates**, because the
  locality guard rejected the street and fell back to the Jerusalem centroid. ⇒ **she and event 3 are
  the exact-equality case `candidateDistanceKm` was built for**, live and reproducible. **Step 3.4 has
  a real specimen for the neutral-score path — it does not need a synthetic one.**
  ⏳ **And the 20 verified `lat`/`lng` pairs are exactly what step 4.2's seed must hardcode**, since the
  seed cannot geocode from node.

- 🔴 **09/08/2026 · step 2.4 — distance is DISPLAYED as a word, not a number. Deviation from an
  approved mockup, by Ishay's dated ruling (Ledger `local-10`).**
  `distanceLabel(km, goalpost)` in `src/lib/smartMatch.js` returns `קרובה` / `בינונית` / `רחוקה`.
  **What it does NOT change:** the score. `proximityScore` still consumes continuous km, and the
  hand-computed anchor was re-verified green **after** the change — this is a display swap, not a
  metric swap. **Why the thresholds needed no new param:** they are derived from
  `גולפוסט_מרחק_קמ` at runtime (`רחוקה` = beyond the goalpost, which is already both the
  zero-score point and the no-car cutoff; `קרובה` = half of it) ⇒ **no migration, no seed row.**
  🔑 **The reason worth keeping, because it outlives this screen: displayed precision must match
  data precision.** We measured that an event address can resolve only to a city centroid, so a
  three-significant-figure `18.3 ק"מ` claims an accuracy we do not have. A word claims exactly what
  we know. *(It is also the answer that survives a question at the conference — which is the
  project's own §1 test.)*
  ⚠️ **Blast radius, checked rather than assumed:** distance is displayed on **surface 2 only**
  (`screens-approved.md:290,298`). The two other `ק"מ` mentions in that file (`:683`, `:767`) are the
  **has-car gate**, which is unchanged. No other module displays distance. Approved-spec pointer
  written in place; the mockup is **not** redrawn.
  📌 `knip` caught a speculative `export` of the label set on the first attempt and was right —
  nothing consumes it yet, so it stays module-local until Phase 3 has a real consumer.

- 🔴 **09/08/2026 · step 2.4 — Ishay found a scoring inversion from the product side, before it
  existed in code. `candidateDistanceKm` exists because of it.**
  His question, verbatim: *"אם אירוע הוא תל אביב והדיילת ירקון 5 תל אביב אז מרחק אווירי 0?"*
  **The real mechanism is worse than the example:** when an event address falls back to city level
  (**measured — project 3 `מרכז הכנסים, ירושלים` resolves to the Jerusalem centroid**) and a hostess
  has only `city` and no `address`, **both sides land on the identical OSM object** ⇒ distance
  `0.000` ⇒ proximity **1.0, the maximum possible.** ⇒ **the less we know about her, the higher she
  ranks** — the `Number(null)===0` family again, but arriving through arithmetic that is entirely correct.
  **The rule that decides it, and why there is no epsilon:** two *different* addresses geocoded
  independently never land on a byte-identical point. Exact equality is therefore not "very close" —
  it is **evidence both sides collapsed to the same fallback**, so the distance is unknown ⇒ `null` ⇒
  neutral. ⚠️ **What it does NOT solve, said out loud:** a street-level hostess against a city-level
  event still yields a small, wrong-ish distance (2–3 km inside Tel Aviv). Not equality, so not caught —
  and that residue is swallowed by the aerial-vs-road gap anyway. The on-screen marker for it is an
  open item for Ishay.
  📌 **Timing note that matters: this was NOT a shipped bug.** Nothing computes `candidate.distanceKm`
  yet — the wiring is Phase 3, and the tests inject the number directly. The guard was added now so the
  Phase-3 session calls one function and cannot get it wrong.

- ⏳ **09/08/2026 · step 2.4 — event-address changes will strand the coordinates. Registered as
  `🚧 מ6 ← מ4`, not fixed here, and here is why that is the right call.**
  `set_project_coordinates` writes **only when both columns are NULL** — that is the DB-level
  enforcement of *"מומרת פעם אחת"*. ⇒ editing `final_location` would leave the old point in place,
  silently. **Measured before concluding:** `final_location` is written **only** by the quote-conversion
  RPC's `INSERT`; there is **not one `UPDATE` of it** anywhere in `supabase/migrations/**` or `src/**`.
  ⇒ the trap **cannot fire in M4** and is born the moment M6 adds a project-edit screen. The fix there
  is one line (null the two columns in the same UPDATE); M4's existing path then refills them.

- 🔴🔴 **09/08/2026 · step 2.4 — 31 GREEN unit tests sitting on a feature that returned nothing, and
  only a real browser exposed it. The most instructive result of this step.**
  **The bug:** Nominatim localizes place names by `Accept-Language`. A real browser sends the user's
  system locale — on `en-US` the response carries **`city: "Tel-Aviv"` in English** while the typed
  address is Hebrew ⇒ the locality guard never matches and **every address silently ends as
  "אין קואורדינטות"**. Measured in a real browser: without the header `Tel-Aviv`; with
  `Accept-Language: he`, `תל־אביב–יפו` (U+05BE + U+2013 — exactly the bytes the normalizer handles).
  🚨 **Why the tests were green:** the fixtures were built from a response fetched by a *different
  tool*, which happened to request Hebrew. **The unit suite proved the parser correct against data the
  browser never produces.** Fixed at the source (the header is now sent explicitly) + a regression test
  that asserts the header itself.
  🔑 **The shape worth keeping, and it generalizes past this module: a fixture captured with one client
  does not represent what a different client receives.** Same family as the §3.5(ג) rounding hole — a
  guard written against convenient data is not a guard — but one level worse, because here the data was
  *real*, just fetched through the wrong door.
  📌 **Second, independent finding from the same run: geocoding is IMPOSSIBLE from node** — vitest/node
  get **`Access denied`** (the ToS reject stock library User-Agents). ⇒ **`scripts/demo-seed.mjs`
  cannot geocode** (relevant to step 4.2): seed fixed `lat`/`lng`, or fill via the screen.

- 🔴 **09/08/2026 · step 2.4 — a defect in my own migration E, caught by measuring instead of
  assuming, and fixed forward in F.** E wrote `revoke execute … from public` and I asserted in the gate
  briefing that this left `anon` unable to call the function. **It did not.** Measured immediately after
  apply: `proacl` = `{postgres=X, anon=X, authenticated=X, service_role=X}` — Supabase's
  `alter default privileges` grants `anon` **by name**, and `revoke … from public` does not touch it.
  ⚠️ **My advisor forecast was wrong because of it** — I predicted 14→15; the actual was **16**, and the
  extra finding was precisely this. **The prediction is recorded as wrong rather than restated.**
  ✅ **What it was NOT, and this was measured rather than assumed:** not an exploitable hole. Impersonating
  `anon` (no claims, `set local role anon`, deliberately invalid coordinates so nothing could be written)
  returned **`42501` — "אין הרשאה לעדכן קואורדינטות של אירוע"**, i.e. the in-function permission gate
  held. A `22023` would have meant a breach; it never appeared. ⇒ broken defense-in-depth + an
  unrequested advisor WARN, not an open door.
  📌 **The precedent was in the repo the whole time:** migration D wrote
  `revoke … from public, anon, authenticated` on `enforce_hostess_min_wage`, and *its* `proacl` is clean.
  **E simply failed to copy that half.** Now in `04_hostesses/CLAUDE.md` as a standing mine.

- 🔴 **09/08/2026 · step 2.4 — the measurement that inverted the design, and it is the entry worth
  keeping from this step.** The obvious implementation (send the address, store what comes back) is
  **wrong twice over**, and neither fault is visible without going and measuring:
  **(א) It returns nothing on our real data.** Both event addresses in the DB come back **empty**.
  A session that trusted the happy path would have shipped a feature that marks 100% of events
  "אין קואורדינטות" — and every test would have been green, because there was no test with a real address.
  **(ב) The obvious fix makes it worse.** Retrying with the leading segment resolves
  `מרכז הכנסים` → **אשקלון (62 km off)** and `הרצל 50` → **נתניה**. Those are *valid* coordinates:
  they pass the 80 km gate, feed a real distance into a 0.25-weight component, and change the ranking
  **with nothing on screen to suggest anything is wrong.**
  🔑 **The shape worth keeping: a missing datum announces itself; a wrong one impersonates a measured
  one.** Hence the rule the guard encodes — *accept a coordinate only if the locality it resolves to
  appears in the address that was typed.* Verified by disabling the guard: **4 tests went red**,
  including both wrong-city cases, and green again on revert.

- 📌 **09/08/2026 · step 2.4 — `הנחתי` register** *(assumptions I filled; nobody stated them and I did
  not measure them)*. ① **The candidate chain's shape** — full address, then each comma-segment
  **from last to first**, capped at 4. The direction is reasoned (the last segment of a Hebrew address
  is usually the locality) and the cap is arbitrary-but-bounded; no source states either.
  ② **`MIN_LOCALITY_PREFIX = 4`** — the minimum name-fragment length that counts as a locality match.
  Three would have matched `כפר` and equated כפר-סבא with כפר-ויתקין; four is a judgement call, not a
  measurement. ③ **The Israel bounding box** (`29.0–33.5` / `34.0–36.0`) as a second, independent check
  beside `countrycodes=il`. ④ **An address change with no `city` in the patch CLEARS the coordinates**
  rather than keeping the old ones — chosen because a stale coordinate is the failure mode this whole
  step exists to prevent, but nobody ruled it.

- ⚠️ **09/08/2026 · step 2.4 — `src/modules/04_hostesses/api.js` gained geocoding and still has no unit
  test, because no `api.js` in this repo has one.** The pure half is covered (31 tests across
  `lib`+`api/geocode`); the **wiring** — create/update re-geocoding, the lazy fill, the `Promise.all`
  merge — is covered only by live verification and, later, E2E. **Named rather than left implied:** this
  is the same class of gap that let the `{data:null,error:null}` trap live for months.
  The step text for 2.2 said they are "the query". **Measured this session that they cannot be:**
  `supabase-js` cannot compute haversine, cannot express `NOT EXISTS`, and cannot `ORDER BY` a
  computed expression; and the DB has **no view and no ranking function** to host them (nine
  functions counted in `docs/schema.sql`; module 4's four are two sync triggers, the min-wage
  trigger and the public RPC). Adding one is a **sixth migration** with a typed-echo gate, which
  Phase 2 was not planned to carry. ⇒ the query fetches **small, server-filtered sets** (this
  event · this customer · this date) and the four layers run in `src/lib/smartMatch.js`.
  **Three reasons this is the right side of the trade, not just the available one:** 50 hostesses
  is already the project's documented rationale for re-sorting instead of filtering · **no `api.js`
  in this repo has a single unit test**, so logic buried in SQL would not be tested at all, and the
  de-dup test is an explicit spec requirement · and `src/lib/pricing.js` is the same shape already.
  🔴 **And the tie-break is NOT `md5`** — no hashing library in `package.json` and `crypto.subtle`
  does not implement it (measured). FNV-1a delivers what the requirement actually states:
  deterministic, fixed per (event, hostess), **never insertion order**. Ishay was shown this in
  the approved plan and may override.

- 🔴 **09/08/2026 — the most instructive result of the phase: a hole-test that PASSED a broken
  implementation, and only breaking the code on purpose revealed it.**
  `spec.md §3.5(ג)` warns that a mid-computation rounder passes the hand-computed anchor. I wrote
  a test for it that asserted `rawScore` to ten digits **on the anchor's own data** — and when I
  deliberately rounded the sub-scores, **it stayed green.** The reason is exactly what §3.5 says:
  every sub-score in that case (`0.78 · 0.25 · 0.52 · 0.80 · 0.70 · 0.50`) is already round, so the
  rounding is a no-op. Fixed by adding a case where **both** sub-scores are non-round
  (`0.4666…` and `0.575`); it then went red, and green again on revert.
  🔑 **The shape worth keeping: a guard written against the same data the feature already passes
  is not a guard.** Holes (א) and (ב) each went red on first try; only (ג) needed its own data.
  *(All three were verified by breaking the code and watching the failure — not by assertion.)*

- 🐞 **09/08/2026 — `Number(null) === 0` bit again, and two unit tests caught it.**
  `haversineKm` on a hostess with no `lat`/`lng` returned **3,558 km** instead of `null`, and the
  `אין קואורדינטות` chip never lit — i.e. she would have sunk to the bottom of the ranking for a
  datum the *system* is missing. The mine is documented twice already in this repo
  (`validators.js:30`, `pricing.js`) and still recurred. Fixed structurally: `optionalNumber`
  (`src/lib/hostesses.js`) is now the **only** door for reading an optional number in module 4,
  and `smartMatch.js` imports that one copy — jscpd caught the duplicate and was right.

- ⏳ **09/08/2026 — step 2.3 shipped partial, deliberately, and here is exactly what is missing.**
  Built: all four screens' reads + the hostess-pool writes (create · update · status ·
  unavailability with the **insert-first / delete-stale-by-id** order that a real data-loss
  incident on 30/07 produced). **Not built: assignment-lifecycle writes** — invite creation,
  final approval + the auto-release that follows it, shift-lead marking. **Two §7 items that are
  preconditions are open in writing:** **§7.33** (*"מנגנון-הכתיבה של השחרור לא נקבע"*) and
  **§7.41** (the `max+1` race on `assignment_number`, tagged 🔵 "להנהון בעת הבנייה"). Deciding
  either silently would have overridden a parked ruling. ⇒ they are built in Phase 3 with the
  screen that drives them and the mail engine they need.

- 📌 **09/08/2026 — three `הנחתי` (assumptions I filled; nobody stated them and I did not measure
  them).** ① **`ממתינות` and `פג תוקפן` are disjoint counters** — `spec.md:135` gives the two tags
  and their opposite meanings but never says the sets do not overlap; counting a dead invite as
  "waiting" would leave the manager waiting on a link that no longer works. ② **the attendance
  record's field names** (`outcome` / `projectCancelled` / `eventPassed`) in `reliabilityScore` —
  🚧 מ6 owns the real column names; only the contract exists here, so §11.10 #2 and #5 are
  runnable. ③ **the knip exemption's removal trigger is step 4.1** — chosen because that is where
  `HostessesPage.jsx` first imports `api.js`; the exemption itself follows the dated precedent
  Ishay set on 29/07 (`01_auth/pricesApi.js`).

- 🔴 **09/08/2026 — ONE REAL REGRESSION from Phase 1, found by the full E2E run, and it is the most
  instructive result of the phase: `e2e/customer-page.spec.js:66` asserted `customer-tab-projects`
  contains `0`.** Migration D added `projects_select_by_permission`, so the CEO now genuinely sees
  מדיטק's three projects (3 · 7 · 8 — verified against the DB, not copied out of the failure) and the
  tab reads `3`. **Fixed to `3`; re-run isolated → passes.**
  🔑 **Why this one matters far beyond the one-character fix:** the test's own comment already said
  *"נשאר 0 **לא כי אין** … אלא כי `projects` היא deny-all ב-RLS — אפס policies, ולכן הלקוח מקבל
  רשימה ריקה בלי שגיאה"*. **The suite had pinned a known defect as its expected value.** It did not
  catch the hole — it *preserved* it, and only closing the hole made it fail. **A green test can be
  green because the feature is broken.** *(This is the same `{data:null, error:null}` trap
  `spec.md § מה ייחשב עובד` #4 names, caught from the opposite direction.)*
- ✅ **09/08/2026 ~16:0X — the entry below is CLOSED. Cause: the dev server, not the app.**
  Vite's HMR was refreshing the page mid-run; `test:e2e` now runs against **build + preview**
  (`playwright.e2e.config.js`, port 4173) → **78/78, twice**, plus `smoke` green. Diagnosed and
  fixed by the parallel E2E session; folded in here by the Phase-2 session once rule 16 released
  the file. 🔑 **The lesson the long hunt actually taught: every suspect inside the application was
  measured out one by one, and the answer was in the harness that runs it.** The record below is
  left standing unedited — including the wrong first explanation and its correction — because that
  sequence is the point.

- 🐞 **09/08/2026 — E2E flakiness under a long serial run — MEASURED, and now with the numbers.
  PRE-EXISTING, not caused by Phase 1.**
  🔬 **Full-suite evidence:** `npm run test:e2e` → **72 passed / 6 failed / 12.3 min.** Of the six,
  **one was the real regression above**; the other **five all pass in isolation** — `auth:23`,
  `customer-page:184`, `customers:124`, `quote-email:201` (4 tests, **26.3s together**) and
  `prices:121`. In the long run each of those had burned a 30s timeout. **Their failure mode is
  uniform:** login never leaves `/login`, or a navigation never settles.
  🔴 **CAUSE NOT IDENTIFIED — and an earlier version of this very entry claimed it was. That claim
  was wrong and is corrected here rather than quietly edited away.**
  **What was claimed (09/08, by me):** that the **§7.8↳ rate limit (15 calls/IP/hour)** on
  `register_failed_login` had tripped, because `auth.spec.js:23` waits for
  `/מייל או סיסמה שגויים|החשבון ננעל/` and saw neither.
  **What measurement showed, when Ishay asked for detail and I finally went and checked:**
  - `select count(*) from login_rpc_calls` → **1 call in the past hour**, not 15. The limit **cannot**
    have fired. ⚠️ **And the reasoning was broken at the root anyway:** that RPC is called on a
    **failed** login. The suite's ~78 logins overwhelmingly **succeed**, so they never touch it.
  - `login_attempts` → **1 row, from 01/08, `locked_until` NULL** ⇒ the 5-strike lockout is out too.
  - Supabase **auth logs**: **zero `429`, zero `over_request_rate`** — but the API returns only the
    **last 100 entries** (window measured 11:00–11:31 UTC), which is **after** the failing run.
    ⇒ a GoTrue throttle is **neither confirmed nor excluded**; it was simply not observable.
  ⇒ **Honest state: the symptom is characterised, the cause is not.** Remaining candidates, none
  measured: dev-server/Vite contention under a 12-minute single-worker run · Playwright timeouts under
  local load · a session race (the app keeps its session in `sessionStorage` **by design**) · an auth
  throttle in a window the log API no longer holds.
  🚫 **Therefore: do NOT "fix" this by adding session reuse.** That is a fix aimed at a cause nobody
  has established — it would reduce logins, and if the cause is contention it changes nothing while
  touching all 11 spec files. **Diagnose first.**
  🔬 **The cheapest next diagnostic, for whoever picks this up:** re-run the full suite and pull
  `get_logs(auth)` **within minutes of the failure** (the 100-entry cap is what defeated this attempt);
  in parallel, re-run with more than one worker and with the dev server already warm, to separate
  "auth refuses" from "the machine is slow".
  📌 **Consequence for the DoD, unchanged:** `npm run test:e2e` cannot honestly be reported green
  until this is understood. That is a **lost gate**, not a cosmetic annoyance.
  Running `quote-approval.spec.js` + `quotes.spec.js` together (24 tests, ~3.8 min, one worker) failed
  **2**: `quote-approval:177` never left `/login` after filling the form, and `quotes:71` timed out
  waiting for the reject dialog. **Both passed on an isolated re-run (2/2, 15.7s)**, and the same
  `quote-approval.spec.js` had run **6/6 green** minutes earlier on its own.
  🔎 **Checked, so this is a measurement and not a shrug:** `login_attempts` holds **one** row, from
  01/08, `locked_until` NULL ⇒ **the app's own 5-strike lockout is NOT the cause.** The remaining
  suspects are Supabase Auth's own per-IP sign-in throttle and the `login_rpc_calls` 15/hour cap
  (§7.8↳) — each test logs in fresh, so a 24-test serial run makes ~24 sign-ins in minutes.
  ⚠️ **Why it matters beyond today:** the failure surfaces as a *product* assertion ("the dialog did
  not open"), never as "auth throttled you" — so the natural reading is "my change broke the screen".
  **Do not re-diagnose this from scratch next time; re-run the failing test alone first.**
  📌 Not fixed here — out of Phase 1's scope, and no product decision is blocked on it.
- 🏷️ **09/08/2026 — `הנחתי` register for step 3.3** *(three assumptions I filled; nobody stated
  them and I did not measure them)*.
  **(1) An event dated BEFORE today is not listed on the overview.** The approved spec is silent —
  checked screen-card מסך 1 §④/⑤/⑥, the approved mockup, and process ב׳. **Why it needed a rule at
  all:** a project leaves the list only when it reaches `מוכן לביצוע`, and **M4 never writes that
  status** (`🚧 מ6 ← מ4`) ⇒ with the sort being "by event proximity", a past event pins itself to
  the top of a triage screen permanently. **Boundary: `final_event_date < today` hides; an event
  dated TODAY stays** — she still closes holes by phone on the day, which is exactly what
  `אושרה סופית — סוכם בטלפון` exists for. **Shown to Ishay with its consequences; he asked me to
  decide it.** Side effect: the internal-looking `תרחיש-קבלה 5.1` row disappears from the demo
  screen without deleting anything.
  **(2) `[עיר_אירוע]` in the invitation mail is filled with `final_location` in full.** 🔴 **And this one is a RESOLUTION of a mismatch the spec itself flags, not a gap I invented into being:** `spec.md:704` records *"אי-התאמה רביעית: הזימון נושא `[עיר_אירוע]` (עיר בלבד) בעוד `§ב3` דורש 'מיקום' ו-`screens-approved` (משטח 5) מבטיח שהדף הציבורי מציג את אותם שדות כמו המייל"* — **and leaves it unruled.** My choice resolves it in the direction the spec's own sentence argues for. Measured:
  **`projects` has no city column**, and the real addresses cannot be split reliably — in
  `אקספו תל אביב, ביתן 2` the city sits *inside the venue name*, while in `מרכז הכנסים, ירושלים` it
  is last. A guessing parser would emit a **wrong city silently** — the geocode lesson exactly. The
  spec's own field list says **"מיקום"**, and the public page shows *"בדיוק אותם שדות שכבר במייל"*.
  **(3) `email_log.entity_id` for a `shift` mail = the PROJECT id.** `assignments` has a triple key
  and no single-column id, while the column is `integer`. **No protection is lost:** resending an
  invitation is **explicitly permitted** (`§ב4`), so for shifts this journal is a record, not a gate —
  unlike a quote. Who received it is preserved in `recipient`.
- 🏷️ **09/08/2026 — `הנחתי` register for Phase 1** *(the third provenance tag; it lives here and not
  only in chat, because two weeks from now an assumption reads exactly like a fact)*.
  **‏(1) `param_type` for `סכום_נסיעות_למשמרת` = `pricing_timing`.** Nothing names it. Anchor: its
  nearest sibling `שכר_מינימום_שעתי` (money-per-unit) was seeded `pricing_timing` in
  `20260723112000:57`. The CHECK accepts either, so a wrong choice fails **silently** and only
  surfaces on M9's params screen, which groups by type.
  **‏(2) `מרכיב_אמינות_פעיל` seeded as the literal `false`.** §7.90 rules **where** the flag lives and
  explicitly forbids deriving it from "no attendance rows" — it never states the encoding.
  `false`/`0`/`לא` were all available; `false` parses unambiguously in both JS and SQL. **No existing
  boolean param exists to anchor against** — this is the weakest of the four.
  **‏(3) Nine new `param_name` identifiers** (`משקולת_היענות` · `משקולת_אמינות` · `משקולת_קרבה` ·
  `שער_מרחק_קמ` · `גולפוסט_מרחק_קמ` · `קבוע_ריסון_m` · `חלון_חישוב_חודשים` ·
  `חלון_חישוב_מורחב_חודשים` · `מינימום_תשובות_להצגת_ציון`). 🔴 **`§11.1` gives Hebrew
  *descriptions*, not identifiers — measured, none of the nine exists anywhere in the repo.** Coined
  from the live naming convention (`משקולת_1W_דירוג` · `לא_ענתה_ל_N` · `שכר_מינימום_שעתי`), and shown
  to Ishay in the approved plan so he could override.
  **‏(4) Template name `תבנית_מייל_שחרור_משמרת`** — patterned on `תבנית_מייל_ביטול_משמרת`. The
  wording inside it is Ishay's ruling (local-6), not an assumption; only the key is mine.
- ⚠️ **09/08/2026 — advance notice, so it is not read as a regression when it appears.** Migration D
  will add **one new advisor WARN** — `anon_security_definer_function_executable` on
  `respond_to_shift_invite` — **by design** (§7.45: the public confirm page is the only surface in the
  system that writes without a session). The DoD line "zero new findings" therefore closes with a
  **written triage note**, not a zero. In the same apply **three INFO findings disappear**
  (`rls_enabled_no_policy` on `hostesses` · `assignments` · `projects`).
- ✅ **09/08/2026 — Phase 0 CLOSED, and closed correctly this time.** Ishay built the Router in Make
  himself (Route A: `Gmail(4)` unchanged, filtered on `pdf_base64 Exists` · Route B: cloned to
  `Gmail(9)` with the attachment deleted, marked fallback, followed by a new `Webhook response(10)`),
  and reported exactly what he touched and what he verified he didn't (`Webhook(2)`, the Google
  connection, the error branch). **I did not take that report as closure either** — re-ran the three
  probes, then opened both resulting emails in Gmail via the browser: the real invitation shows **no
  attachment section at all**, the regression call shows a real `regresia2.pdf` thumbnail. `gate` ·
  `smoke` · the quote-mail E2E suite (8/8) all green after the change. See the full account below (this
  is the entry that follows the false-closure one, in the same log, on purpose — the correction and the
  real resolution both stay on record).
- 🔴 **09/08/2026 — I closed 0.3 on a false claim. Ishay caught it from the actual email.** I reported
  *"a real shift mail went out **with no attachment**"* on the strength of **HTTP 200 + an `email_log`
  row reading `sent`**. Both were true. **The email was not.** It arrived carrying an **empty
  attachment named `undefined`**.
  🔑 **The lesson, and it is the project's own rule restated:** `200` proves the *transport* succeeded,
  not that the *artifact* is right. **The only verification that counted here was opening the inbox** —
  and I asked Ishay to do it while already reporting the conclusion as fact.
  **What is actually true:** the webhook fix removed the **rejection** (400 → 200), but the Gmail module
  still evaluates its static Attachment 1. With the fields empty it no longer errors — **it silently
  attaches a 0-byte file named `undefined`.** ⇒ **the failure moved from loud to silent, which is
  worse**, and **the Router IS required after all** — the web research was right about the outcome even
  though it predicted the wrong mechanism (a hard error, not junk output).
  ➡️ **Do NOT close 0.3 again on a status code.** Acceptance = **the mail is opened and has no
  attachment.**
- 🐞 **09/08/2026 — bidi bug, 6th occurrence in this project and the 2nd inside a mail body.**
  The real invitation rendered *"התאמת לאירוע חדש של **IREG-IN**"* — the `!` in the template's
  `REG-IN!` jumped to the wrong side of the Latin token. Template text lives in
  `params.תבנית_זימון_משמרת`; the wrapper `plainTextToEmailHtml` already emits `dir="rtl"`, so **the
  per-line direction is correct and the defect is the Latin+punctuation run inside a Hebrew line** —
  the same class that `Money`/`LtrFieldGroup` solve on screen.
  ⚠️ **Corrected same day: the original "fix belongs with step 3.6" was wrong** — 3.6 is the public
  confirm page (no login, no outbound mail). **The real send points are 3.4 (`שלח מייל תיאום`) and
  3.5 (`שלח את הקישור שוב`/`פתח זימון חדש`), both pointing back here.** ⚠️ **And this is arguably not
  module-4-only:** `plainTextToEmailHtml` lives in the shared `src/lib/email.js` engine and every
  hostess template (`תבנית_אישור_סופי_שיבוץ`, `תבנית_מייל_ביטול_משמרת`, `תבנית_תזכורת_משמרת`) — plus
  M8/M11's future templates — shares the same defect. **Whoever fixes it should check whether the fix
  belongs at the engine level, not per-template**, and confirm with Ishay before scoping it small.
  🔑 **And the reusable lesson: an RTL wrapper is necessary but NOT sufficient.** Five earlier
  occurrences were all fixed structurally by emitting label+value together; a plain-text template
  pulled from `params` has no such structure, so **any Latin token followed by punctuation inside a
  Hebrew sentence will do this again.**

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
  ✅ **Root cause CONFIRMED at the source, 09/08/2026 — the setting was found and read, not inferred.**
  The webhook `regin-quote-email` has, under **Advanced settings → Data structure**, the structure
  **`regin-quote`**, whose own hint reads *"Data structure to be used for **validation of incoming
  data**"*. Its fields each carry `*` = **Required: Yes** (verified on `to` and `subject`; the rest
  follow the same pattern). ⇒ an empty `pdf_base64` fails **validation**, which is why no execution is
  ever created.
  🧭 **Exact click path, so the next session does not rediscover it:** scenario → **Edit** → click the
  **`Webhooks · Custom webhook`** module → **Edit** (beside `regin-quote-email`) → toggle
  **Advanced settings** ON → **Data structure** → **⋮ → Edit** → collapse fields until `pdf_base64` →
  set **Required: No** → Save → Save.
  ⚠️ **09/08/2026, first pass — closed on `200` + an `email_log` row, WITHOUT opening the mail.**
  I claimed *"NO Router needed — the webhook fix alone is sufficient"*. **False.** The mail arrived
  with a **silent empty attachment named `undefined`** — the webhook fix removed the rejection but
  Gmail's static Attachment 1 still evaluated. Full account, kept as the reusable lesson (`200` proves
  transport, never the artifact): see the `↳ as-built` entry at the top of §10.
  ✅✅ **RESOLVED FOR REAL, same day — Ishay built the Router himself in Make; verified here by opening
  three actual emails, not by status code.**
  **What was built** (scenario `REG-IN — שליחת מייל`): `Router(8)` inserted between the webhook and
  `Gmail(4)`. **Route A** → `Gmail(4)` unchanged (still has the static Attachment 1), filtered on
  `{{2.pdf_base64}} Exists`. **Route B** → `Gmail(4)` cloned to `Gmail(9)` with its **Attachment 1
  deleted** (To/Subject/Body untouched), marked **fallback route** (no filter — catches everything
  Route A's filter excludes), followed by a new `Webhooks → Webhook response(10)` mirroring `(5)`'s
  status/body. `Webhook(2)`, the Google connection, and the error branch (`6→7`) were left untouched —
  confirmed visually before saving.
  🔬 **Verification, done in the browser, not by status code:**
  1. **The real shift invitation** (`תבנית_זימון_משמרת` text, sent 09/08 11:31) — opened in Gmail via
     `get_page_text`: full body renders, thread ends after the reply/forward buttons, **zero attachment
     section**. Not `undefined`, not empty-but-present — genuinely absent.
  2. **Regression — same call with a real filename+base64** — opened in Gmail: **`regresia2.pdf`
     renders as a real PDF thumbnail**, i.e. the quote-with-attachment path is provably unbroken by
     the Router.
  3. `email_log` — three `shift · sent · error_message NULL` rows in the same window, matching the
     three sends above.
  ✅ `npm run gate` exit 0 (428 unit) · `npm run smoke` exit 0 · `e2e/quote-email.spec.js` +
  `e2e/quote-document.spec.js` green (8/8) — the quote-mail regression suite, re-run after the Router
  landed.
  📌 **The web research's mechanism prediction (Gmail rejects an empty attachment with a hard error)
  did not materialize on the FIRST attempt** — it silently attached junk instead, which is arguably
  worse — **but the research's conclusion (a Router is required) was correct**, confirmed by the
  actual failure mode observed in production.
  ⚠️ **And the webhook URL is a secret visible in that panel — never paste it into any file or chat.**
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
