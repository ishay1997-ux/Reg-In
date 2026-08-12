# Module 4 — closing-audit working findings

> **Scratch file (audit rule 5).** Raw observations appended **at the moment of finding** — no
> conclusions, no routing, no fixes mid-scan. Clustering happens once, at §5b, after the last
> audit section. This file is also the **interruption handoff**: if the session dies or nears the
> rotation threshold, a fresh session resumes from here with no hand-written prompt.
> Archived to `docs/archive/` at the end of the audit (persistence step 6).

**Audit started:** 12/08/2026 08:12 · branch `ishay/module-4-hostesses` @ `ec4b416` · working tree clean
**Session:** fresh (built nothing in module 4)
**Ishay's rulings for this close (12/08/2026):** UAT runs live, together, now · live verification in
**his own Chrome** (extension), not the in-app browser · **real emails to `ishay1997@gmail.com` are
pre-authorised** — journey 1 creates a hostess carrying his address so journey 2's invite lands in
his real inbox · **he types every password; Claude types none.**

---

## Pre-flight (verified this turn)

- `git rev-parse --abbrev-ref HEAD` → `ishay/module-4-hostesses`; `git status --short` → empty.
- `git ls-remote --heads origin` → `ec4b416417f3174ef5c512b2292cadc68760d1f9  refs/heads/ishay/module-4-hostesses` = local `HEAD` ⇒ **pushed, up to date.**
- `git merge-base HEAD origin/dev` → `6da211c…` ≠ `HEAD` ⇒ **not merged.** 127 commits ahead.
- Supabase MCP: `list_projects` → `Reg-In` / `yfeovxppnfoafmfbdfvh` / ACTIVE_HEALTHY. Confirmed to be
  the project the app talks to (grep of the local env file for the ref — value never printed).
  ⚠️ **Provenance note:** at the start of this session the connected MCP pointed at a DIFFERENT
  project (`gdud-710`); Ishay reconnected on request. Every DB claim below is therefore measured
  against the correct project, this session.

---

## §1 DoD walkthrough — findings

- **F-01 · migration count.** DoD line 1 says "All **8 migrations**" and names 8. Reality: **10**
  `module4_*` migration files in the branch diff, and **10** applied rows in the live DB
  (`list_migrations`, 12/08 08:1X) — names match 1:1, only the version timestamps differ by the
  UTC/local offset (file `20260809085058` ↔ DB `20260809055327`, etc.). The two extra are
  `module4_final_approval_contact_label` (§10 calls it "migration H") and
  `module4_public_shift_invite_read` (the 3.6 row's unplanned 9th). ⇒ **the count went stale; nothing
  is missing or unapplied.** Fix the DoD line to 10 and name all ten.
- **F-02 · gate.** `npm run gate` → **exit 0**, measured this session 12/08/2026 08:1X (log:
  scratchpad `gate.log`). DoD line satisfied.

## §2 Security & RLS — findings

**Live impersonation matrix (rolled-back transactions, `request.jwt.claims` carrying `sub`+`email`,
`set local role authenticated`) — run 12/08/2026 against `yfeovxppnfoafmfbdfvh`:**

| who | hostesses | assignments | unavail | prefs | projects | customers |
|---|---|---|---|---|---|---|
| `recruit.test` (edit דיילות) — **positive control** | **25** | 6 | 1 | 0 | 3 | **0** (blocked, correct) |
| `finance.test` (blocked דיילות) | **0** | **0** | **0** | **0** | — | 5 (edit, correct) |
| `projects.test` (view דיילות) | 25 read | — | — | — | — | — |
| `anon` | **0** | **0** | — | — | **0** | — |

- **F-03 · write wall holds.** As `projects.test` (view-only): `update hostesses` → **0 rows**,
  `update assignments` → **0 rows**, `delete from hostesses` → **0 rows**, and
  `insert into hostess_unavailability` → **explicit `42501` RLS violation** (not a silent no-op).
  As `anon`: `update assignments` → **0 rows**.
- **F-04 · public RPC is not an oracle — verified live as `anon`.** `get_shift_invite` returns
  **byte-identical `{"ok": false}`** for unknown / SQL-injection-shaped / empty tokens.
  `respond_to_shift_invite` returns the **same single generic Hebrew sentence** for all three.
  No distinction between "no such token", "expired", "already answered" leaks.
- **F-05 · token entropy.** `crypto.randomUUID()` (`src/modules/04_hostesses/api.js:309`) — CSPRNG,
  122 bits. Expiry is enforced **server-side** as the earlier of *48h from `invite_sent_at`* and
  *24h before the event* (`20260809134237_module4_rls_and_public_rpc.sql:190,193`).
- **F-06 · advisors, measured this session: 17 security findings** — identical count to the guide's
  baseline. Breakdown: 4 × `rls_enabled_no_policy` (`login_attempts`, `login_rpc_calls` — deliberate
  deny-all · `logistics` → M5 · `salary_reports` → M8) · 4 × anon-executable SECURITY DEFINER
  (`check_login_lock`, `register_failed_login` — M1; `get_shift_invite`, `respond_to_shift_invite`
  — M4, **intentional, the public page needs them**) · 8 × authenticated-executable SECURITY DEFINER
  · 1 × `auth_leaked_password_protection` disabled.
  🔴 **Gap in the written triage, not in the DB:** the DoD's advisor note (written 09/08) accounts for
  `respond_to_shift_invite`'s two WARNs but **predates `get_shift_invite`**, which was created by the
  10th migration on 10/08 and contributes two more WARNs that no written triage covers. ⇒ extend the note.
- **F-07 · performance advisors: 22 findings**, all pre-existing classes (`unindexed_foreign_keys` ×3,
  `no_primary_key` ×1, `unused_index` ×1, `multiple_permissive_policies` ×17). The
  `multiple_permissive_policies` pattern is **project-wide and by design** — every module's tables
  carry a `_select_by_permission` + `_write_by_permission` pair, so module 4's four tables inherit the
  same shape as modules 1–3. `projects_owner_email_idx` unused is M4-adjacent but harmless.
  `assignments_salary_report_id_fkey` unindexed → the FK points at M8's table. **No blocker.**

## §2b UX & validation (incl. built-vs-approved-spec diff) — findings

## §2c General security scan (agent) — findings

Agent ran the 7-category rubric over all 39 in-scope files + the 3 context files, and ran
`npm run audit` (exit 0). Categories **1 Injection · 2 XSS · 3 Secrets · 6 Error leakage ·
7 Dependency risk → checked, clean**, each with cited evidence.

- **F-10 · REAL, and already ruled: view-only roles can read ת"ז + bank details over REST.**
  `api.js:101` (also `:112`, `:163`) selects `'*'`; policy `hostesses_select_by_permission`
  (`20260809134237:49-54`) admits `edit` **and** `view`. The hiding exists only in the client
  (`HostessViewCard.jsx:304`, `RepositoryTab.jsx:351`). Path: מנהלת פרויקטים (view on דיילות) opens
  `/hostesses` and reads the raw response.
  🔴 **NOT a new discovery and NOT mine to re-open** — `processes-approved.md:72-73` says the hiding is
  *"הסתרה בממשק בלבד, לא הגנה"* and `:431` records **§7.63 deferred to M6/M8, "מגבלה מוצהרת, לא חור
  לסתום."** ⇒ route to the report's *declared limitations*, and VERIFY the §6/§7 registration exists.
- **F-11 · stale audit exemption.** `scripts/audit-gate.mjs` prints
  `🧹 הפטור GHSA-qwww-vcr4-c8h2 אינו תואם עוד לאף חולשה` — dead exemption, deletable. Cheap.
- **F-12 · hardening ×3, no live exploit path.** (a) no rate limit on the two public RPCs
  (`20260810004500:53-55`) — **already registered as `🚧 מ12 ← מ4`, verify**; (b)
  `SmartMatchPage.jsx:657` builds `tel:` without `encodeURIComponent` while `marketing.js:45-47`
  does encode — worst case a malformed dial string; (c) `send-email/index.ts:123-127` has no
  server-side attachment size cap (client-only at `email.js:29`); module 4 sends no attachments.
- **F-13 · dependency delta:** module 4 added exactly one package — `@axe-core/playwright@^4.12.1`
  (devDependency, MPL-2.0, no advisory, not in the browser bundle). No new high/critical.

## 🔴 F-35 · the public link cannot be opened from a phone — and the reason splits in two

**What happened:** Ishay opened the invitation on his real phone and got *"לא ניתן להגיע לאתר זה"*.

**Half one — my test setup, not a product defect.** The journey ran against the **dev server**, so
`confirmUrlFor(window.location.origin, token)` (`src/lib/shiftEmails.js:24-27`) produced
`http://localhost:5173/shift/<token>`, which on a phone resolves to the phone's own localhost. And
the origin-from-caller design is **deliberate** — the comment above that function says so:
*"הבסיס מגיע מהקורא… מייל שנשלח מסביבת-פיתוח"* must point back at dev. ⇒ **no bug; the invitation was
correct for the environment that sent it.** *(Immediate workaround: the same mail opens fine on the
machine running the dev server.)*

**🔴 Half two — the real finding, and it is not fixable inside this module.** Acceptance criterion #3
(*"הדיילות עונות דרך הקישור בלי להתחבר"*) has **never been exercised the way a real hostess would**:
over the internet, on a phone. And it **cannot be** today — **measured, not inferred:**
`git show origin/dev:src/App.jsx | grep -c "shift/:token"` → **0**. The app has been live on Vercel
since 31/07 (`PROJECT_MASTER.md:404`), but the public route was built on this branch on 10/08 and is
**unmerged**, so the deployed site has no `/shift/:token` at all.
⇒ **The proof this criterion needs is a POST-MERGE action, not an audit-time one**: after module 4
reaches `dev` and deploys, send one invite from the deployed origin and open it on a phone.
⚠️ **And it is a conference item, not only a QA item** — a demo of "the hostess gets a link and
confirms" run from `localhost` will produce exactly the screen Ishay just saw.
📌 **What IS proven locally, so the gap is narrow and stated:** 6 E2E specs on the public page, the
3.6 screenshots at 390px in a session-less browser, and today's live `anon` probes showing the RPCs
return a byte-identical `{ok:false}` for unknown/malformed/empty tokens.

## §3 Architecture & pro-tips — findings

## §3b Silent-failure sweep (agent) — findings

Agent read all 22 in-scope files + the security model + `AuthContext` + the permission matrix.
It also stated what is **clean**, by name: load/error/empty states on all four surfaces are correct
and distinct; every write pairs `.select()` with `assertRowsAffected` so an RLS-denied write throws;
`publicApi.js` rethrows and never confuses `error` with empty `data`; `send-email/index.ts` fails
loudly on a missing secret.

- **F-14b · 🔬 F-14 IS NO LONGER A CODE READING — IT WAS PROVEN LIVE, BY FAULT INJECTION, 12/08/2026.**
  One run, one broken network (`page.route('**/functions/v1/send-email**', abort)` — **2 calls blocked,
  counted**), two paths on the same screen, same hostess:
  - **A · "פתח זימון חדש" (the invite path) → `toast-error`:**
    *"1 — לא ידוע אם יצאו (ייתכן שכן; לא לשלוח שוב מיד)"* — honest, and it even separates *unknown*
    from *failed*.
  - **B · "שחרר — המשרה אוישה" (the release path) → `toast-success`:**
    ***"דנה לוין שוחררה, והודעה נשלחה אליה"*** — while the confirm dialog had just promised
    *"היא תקבל הודעה שהמשרה אוישה"*.
  - **Ground truth:** `email_log` rows created since the final approval = **0**. No mail left. No record.
  🔴 **Same failure, same screen, opposite honesty — and the dishonest one is the path that touches a
  real person.** This removes any judgement call from the §6 routing: it is a live user-facing path
  that reports success on failure.
- **F-14 · A1 — 🔴 I VERIFIED THIS MYSELF, and it is the sharpest finding of the audit.**
  `api.js:629-647` — `releaseAssignment` wraps the whole email send in `try { … } catch {}`. The
  comment claims *"והמסך מדווח על המייל בנפרד"* — **it does not**: the function returns
  `data?.[0] ?? null` (`api.js:649`), so no caller can learn the mail failed. Meanwhile
  `SmartMatchPage.jsx:303-306` toasts **unconditionally**: `` `${name} שוחררה, והודעה נשלחה אליה` ``.
  Two more call sites promise the same in words: `RepositoryTab.jsx:210-244` (dialog text at `:478-479`
  — *"והדיילת תקבל מייל-ביטול על כל אירוע"*, `Promise.allSettled` counts a resolved release as success)
  and the auto-release inside `approveFinalAndRelease` (`api.js:538-541` → `SmartMatchPage.jsx:265-267`).
  Swallowed: missing template · Make 502 · missing webhook secret · edge-function 403 · **and the
  30-second timeout — this is the only send path in the module that never calls `classifySendError`**,
  so "unknown whether it went out" collapses into the same silence as an outright failure.
  🔑 **The fix pattern already exists in this same file** — every other send path returns
  `{sent, unknown, failed}` and is surfaced through `reportMail` (`SmartMatchPage.jsx:198-206`).
  ⚠️ **And the harm is spelled out by the code's own neighbouring comment** (`api.js:627-628`):
  *"מי שאמרה 'כן' ולא שמעה כלום מפסיקה לענות, וההיענות היא 40% מהציון"*.
- **F-15 · A2 — the overview's green ✅ can mean "denied", not "all clear".** `api.js:137`
  `listStaffingOverview` returns `data ?? []`; an RLS denial on `projects` yields
  `{data: [], error: null}` ⇒ `OverviewTab.jsx:406-414` renders **`✅ אין כרגע אירועים הממתינים לאיוש`**.
  That is verbatim the failure `spec.md § מה ייחשב עובד` **#4** names as the module's worst.
  🔬 **Verified the precondition honestly:** it does **not** fire on today's seeded matrix — no role has
  `דיילות ≠ blocked` together with `פרויקטים = blocked` (measured live this session). It becomes live
  the moment the CEO edits the matrix in `PermissionsMatrixPage`, which carries no warning that
  `דיילות` depends on `פרויקטים`. **The asymmetry is inside one file:** `getSmartMatchData:154` throws
  *"האירוע לא נמצא, או שאין לך הרשאה אליו"* for the same table under the same policy.
- **F-16 · A3 — a successful geocode is thrown away when its save is denied.** `api.js:79-90`:
  `geocodeAddress` succeeds, `set_project_coordinates` returns 42501 for a view-only role (the
  comment at `api.js:78` says so explicitly), and the function returns `null` instead of the resolved
  point ⇒ every candidate card shows the chip **`אין קואורדינטות`** (`SmartMatchPage.jsx:796-800`),
  which reads as "my hostess records lack addresses" when the truth is "the **event** has none".
  Proximity is 38% of the live weights, and `passesGate` stops filtering by distance entirely.
- **F-17 · A4 — invite failures collapse to a bare count.** `api.js:318, 328, 455, 477` all reduce
  distinct causes to `'failed'`/`null`, surfacing as **`"2 נכשלו"`** with no name and no reason.
  Live trigger: a template edited through the Table Editor (a *planned* workflow, §7.70) that adds an
  unknown placeholder ⇒ `fillEmailTemplate` returns `''` ⇒ **every invite in the system fails** with
  no hint that a template edit caused it. Module 3 solved exactly this
  (`QuoteDocumentDialog.jsx:227` calls `findUnknownQuoteEmailPlaceholders`); **module 4 never calls
  `findUnknownPlaceholders` anywhere.**
- **F-18 · (b) defensive-but-noisy, no live wrong-outcome path:** `api.js:345-351` the
  `invite_sent_at` rollback never checks its own result · `api.js:331,572,637` discard `sendEmail`'s
  `{logFailed:true}` that module 3 surfaces · `api.js:429` iterates the query result rather than the
  requested ids · `src/api/geocode.js:68-72` makes a 429 indistinguishable from "not found" ·
  `PublicConfirmPage.jsx:62-66,93-96` discard the caught error with nowhere to log it
  (**project-wide convention** — the only `console.error` in all of `src/` is `ErrorBoundary.jsx:18`;
  the agent deliberately did **not** propose a logger that does not exist here).

## §4b Duplication & shared-component — findings

- **F-19 · jscpd: 6 clones repo-wide, 0.36% of lines. Three involve module 4.**
  (a) `OverviewTab.jsx[47:29-59:14]` ↔ `RepositoryTab.jsx[87:43-102:14]` ↔
  `SmartMatchPage.jsx[81:23-93:14]` — the **same 13-line block three times**: `reloadTick` state +
  `refresh` callback + the cancel-guarded async `useEffect`. I read all three: the loaders and the
  post-load state differ, but the reload/cancel mechanism is identical and **would have to change
  together** — and `CustomersPage` (module 2) carries a fourth copy of the same idiom.
  ⇒ genuine "should-be-shared" candidate (a `useReloadableData` hook), **not** done now: it rewrites
  the data path of three working screens for zero user-visible gain, 9 days before submission.
  (b) `lib/shiftEmails.js[96:19-103:56]` ↔ `[128:16-135:56]` — the placeholder map shared by
  `buildShiftInvitePayload` and `buildFinalApprovalPayload`. **Deliberately separate and it should
  stay so:** the two maps are *not* the same set (`[עיר_אירוע]` vs `[כתובת_אירוע_מלאה]`,
  `[לינק_אישור_משמרת]` vs `[שם_מנהלת_פרויקט]`/`[טלפון_מנהלת_פרויקט]`), each is anchored to a
  different approved template, and merging them would couple two templates that must be able to
  change apart. Recording the reason so no future audit re-raises it.
  (c) the other three clones are in modules 01/02/03 — **not module 4's**, not re-litigated here.
- **F-20 · `npm run lint`: zero errors and zero warnings** — no `sonarjs/cognitive-complexity` and no
  `sonarjs/no-identical-functions` on module 4's files. **`npm run deadcode` (knip): clean** (one
  configuration hint about `.css`, no unused files/exports/dependencies).

## §2b UX & validation — findings

**Built-vs-approved-spec diff — sources read: `spec.md` (acceptance chapter §"מה ייחשב עובד",
7 criteria), `screens-approved.md`, and `processes-approved.md` in full (Ishay asked for the third
explicitly, mid-audit).**

- **F-25 · the T-24 *automatic reminder email* is NOT built — and that is CORRECT, not an omission.**
  `processes-approved.md §ב7` says *"תזכורת אוטומטית לפי הפרמטר `שעות_תזכורת_לדיילת` (=24 היום)"* and
  describes *"ריצה מתוזמנת אחת, שני פלטים"*. Measured: **zero** occurrences of `reminder` /
  `שעות_תזכורת` in module-4 migrations or in `src/`; `cron.job` live holds only
  `module3-quote-expiry` and `module1-login-attempts-cleanup`. **Only the second output — the T-24
  screen mode + overview alert — is built** (and it is E2E-covered).
  ✅ **Registered ownership, cited:** `PROJECT_MASTER.md:419-435` (`🚧 מ10 ← מ4`) assigns *"ה-Edge
  Function המתוזמנת ששולחת תזכורות T-24, §7.42"* to **module 10**, and the approved screen card
  itself replaced the reminder button — `screens-approved.md:484`: *"הכפתור `שלח תזכורות במייל`
  הופך ל-`שלח שוב למי שפג תוקפן (N)`"*. ⇒ **no deviation.**
- **F-26 · spot-checked the spec's word-for-word contract items against the build — all match.**
  Over-quota warning: `assignmentActions.js:77` produces *"המכסה מלאה — 6 מתוך 6. לאשר את נועה שגיא
  בכל זאת?"* and `overQuotaLabel(7,6)` → *"אחת מעבר לנדרש"* — byte-identical to
  `processes-approved.md §ב5`, and unit-tested (`assignmentActions.test.js:105,124`).
  Shift lead (`§ב5`) built (`SmartMatchPage.jsx:367`, `★ אחראית משמרת` badge at `:680`).
  `languages text[]` multi-select present in the form and card (`HostessFormDialog.jsx:438-447`),
  and correctly **not** a gate and **not** a repository column, per the same §.
- **F-27 · the two stale lines the guide warns about are real and still stale in the source, and the
  build correctly does NOT obey them.** `processes-approved.md §ב6` (*"הפרויקט עובר ל'מוכן לביצוע'
  בטריגר במסד"*) and `§ב8` (*"הפרויקט חוזר ל'בתהליך' אוטומטית"*) both have M4 writing
  `projects.project_status`; that was reversed 08/08 (`spec.md §12⑱(ד)` + `🚧 מ6 ← מ4`). Measured:
  M4 never writes `project_status`. ⇒ correct behaviour, **and the spec file still carries the
  superseded sentences** — worth an `↳ as-built` pointer so the next reader doesn't obey them.

### 🔎 Per-surface omission hunt against `processes-approved.md` (Ishay's scope addition, 12/08/2026)

His framing: *"האם מסמך-התהליכים מתאר התנהגות שהמערכת אינה עושה, או עושה אחרת? חפש במיוחד
**השמטות** — כלל-תהליך שאין לו כרטיס-מסך ולכן ייתכן שמעולם לא נבנה."* Reconciliation rule he set:
**later + more specific document wins for that item, recorded as a dated note** (precedent: the guide
§2 declares `processes-approved.md:260` superseded); **a real conflict with no later ruling = a
finding for Ishay, not Claude's call.** 🚫 **And explicitly NOT to be fixed in the §6b round.**

**Checked in code, present as described** *(not assumed — each has a file:line)*: א1 ID check digit ·
min-wage block · soft duplicate-email warning · geocode-once with a **neutral** proximity score on
failure · א2 **the frozen-rate warning IS on screen** (`HostessFormDialog.jsx:380` — *"שינוי כאן לא
ישנה תעריף של שיבוץ עתידי שכבר קיים"*) · א3 unavailability as the 5th gate condition · א4 the 3-way
deactivation dialog · ב2 `VISIBLE_CANDIDATES = 8` with *"השאר בגלילה"* rendered at
`SmartMatchPage.jsx:528` · the four sort angles with the 72h default · ב3 **all three link-expiry
conditions including "המשרה אוישה"** (`20260810004500:95` returns `state:'filled'`) · ב4 unlimited
resend · ב5 over-quota warning + shift lead · ב6 auto-release with its own wording.
🔑 **And the subtle one from `§ב4` that a screen-only reading would never check —
"נספר פעם אחת, לפי השורה האחרונה" — IS implemented**: `smartMatch.js:161-170` folds rows to the
highest `assignment_number` per `(project, hostess)`, and `smartMatchCandidates.js:17` counts events
rather than rows.

**Described in processes, NOT built — each with its status:**
- **F-28 · T-24 automatic reminder** ⇒ **M10's**, registered (`🚧 מ10 ← מ4`, §7.42). Correct.
- **F-29 · every `projects.project_status` transition** (`§ב6` quota-full ⇒ "מוכן לביצוע"; `§ב8`
  withdrawal ⇒ back to "בתהליך"; client resize ⇒ unlock/relock) ⇒ **M6's**, registered
  (`🚧 מ6 ← מ4`), and the guide already flags the two source sentences as superseded. Correct.
- **F-30 · `§ב8`'s "cancelled project doesn't count"** ⇒ designed in and deliberately dormant:
  `reliabilityScore` (`smartMatch.js:196+`) already takes a `projectCancelled` field, and its own
  comment says the shape is an assumption and the function is **not to be called until M6**. Correct.
- **F-31 · `§א1`'s "פרטי בנק (שם · סניף · חשבון) — בדיקת מבנה" was never built: the three fields are
  presence-required only, with no format check** (`HostessFormDialog.jsx:388-411`; zero `bank`
  matches in `src/lib/validators.js`). ⚖️ **Resolved by Ishay's rule, not by me:** the later and more
  specific document — `screens-approved.md` **§⑤ "מצבים"** — enumerates every blocking state for this
  form (ת"ז · שכר · אימייל · geocode · save-failure) and **does not include a bank-format check** ⇒
  **the screen card wins, the build is correct.** ⚠️ **But nobody ever wrote that down** — a reader of
  `processes-approved.md §א1` today still sees an unbuilt requirement. ⇒ dated note, no code.
- **F-32 · `§ב7`'s "הטלפון על הכרטיס הופך לפעולה" built as a plain `tel:` link on every row**, not as
  the T-24-specific emphasis the mockup draws. Already recorded as a deliberate simplification in the
  3.7 row. ⇒ dated note, no code.

**🔴 F-33 · ONE genuine gap with no later ruling — this is a finding FOR ISHAY, not a Claude decision.**
`countWorkedForCustomer` (`smartMatchCandidates.js:19-30`) counts a past `finally_approved` row for
that customer with **no exclusion of `project_status = 'cancelled'`** (a legal value —
`schema.sql:129`). So an event the **client cancelled** still credits the hostess with
*"עבדה אצל \<לקוח\> 3×"* on the live Smart Match chip, and feeds the "עבדה אצל הלקוח הזה" sort angle.
⚖️ **Why no document settles it:** `§ב8` rules only that a client cancellation must not be counted
**against** her *(in reliability)*; it is silent on whether it should count **for** her. This is a
credit, not a penalty, so the rule does not reach it. **Not reachable in today's data** (zero
`cancelled` projects live — measured). Small, live, unruled ⇒ Ishay's call.

**⇒ Verdict for this section: no deviation from the approved spec beyond items already ruled and
registered** — the M6/M10 ownership boundaries, Ishay's deliberate no-builds (the "X פג תוקפן"
scroll-link, ruled 10/08), and the declared §7.63 interface-only protection.

- **F-21 · acceptance criterion #5 proven LIVE at the database, not in code.** Two probes, both in
  rolled-back transactions, 12/08/2026: (a) inserting a second `finally_approved` row for hostess 11
  on `2026-08-22` → **`23505 assignments_one_event_per_day`**; (b) the ruled-but-rarely-tested half of
  §7.88 — creating a legal assignment on another date and then **moving that project's event date onto
  the collision** → the **same** `23505`, raised from inside
  `sync_assignments_on_project_date_change()`. ⇒ the trigger half of the ruling works, not just the
  index half.

## §4 Housekeeping — findings

- **F-08 · schema drift: none.** Live `public` schema has **22 tables**; `docs/schema.sql` declares
  **22** and the two name-sets are identical. All module-4 columns present in the snapshot
  (`hostess_id`, `address`, `lat`, `lng`, `has_car`, `languages`, `invite_token`, `invite_sent_at`,
  `responded_at`, `travel_amount`, `is_shift_lead`, `event_date`, `owner_name`, `owner_phone`), and so
  are the late artifacts (`get_shift_invite`, `respond_to_shift_invite`, `set_project_coordinates`,
  `assignments_one_event_per_day`). ⇒ the "snapshot committed with each migration" claim holds.
- **F-22 · 🔴 the E2E suite is NOT green as run: 116 passed / 1 FAILED (7.8 min).** The failure is
  `e2e/accessibility.spec.js:81` on **`/system/prices` — module 1/system, not module 4**:
  `button-name: Ensure buttons have discernible text (11 nodes)`.
  🔬 **Diagnosed, not guessed:** re-ran the spec **alone → passes, exit 0**, and in that run the
  prices screen produced **zero** findings, while in the full run it also produced the advisory
  `empty-table-header`. Root cause is in the harness: `waitForReady` (`accessibility.spec.js:51-53`)
  waits only for `<nav>` — the layout chrome, present the moment auth resolves — and **not for the
  screen's own data**, so axe can scan a half-rendered table. The 11 nodes are the **11 products**'
  Radix `SelectTrigger` status controls (`PricesManagementPage.jsx:212-217`), whose accessible name
  comes **only** from the rendered `<SelectValue />`; before it paints, the button has no name.
  🔑 **This is the SAME family the spec's own header documents as already fixed once** (the 10/08
  `<main>`/`<h1>` false finding) — the fix then was `waitForReady`, and it was incomplete.
  ⇒ one cause, three symptoms (`button-name` · `empty-table-header` · the old landmark finding).
- **F-23 · `npm run smoke` — the first invocation returned exit 3, not a pass:**
  `🔌 עשן: אין שרת על http://localhost:5173`. It needs the **dev** server (5173) while `test:e2e`
  runs against build+preview (4173). With the dev server up: **`exit 0`, 1 passed** —
  *"כל המסכים הראשיים עלו עם הנתונים האמיתיים"*. Worth stating because a close that ran `smoke`
  without a dev server would have read exit≠0 as a failure, or worse, never noticed.
- **F-24 · latent a11y gap behind F-22 (module 1's screen, not module 4's):** the product-status
  `SelectTrigger` has no `aria-label`, unlike its neighbour in the same file
  (`PricesManagementPage.jsx:234` — `aria-label={`עריכת ${p.item_name}`}`). Transient-only once the
  value paints ⇒ §7 line, target M12's usability sweep, where the other a11y items already live
  (`architecture_and_qa_roadmap.md:141`).
- **F-09 · LOG compaction backlog re-measured 12/08/2026: 3,457 lines** of Session Log narrative
  (`awk` between `## Session Log` and `## Reference`) against the file's own **≤150** target — the
  §6 debt line (`PROJECT_MASTER.md:504`) still carries the old measurement. Escape hatch applies;
  the number must be refreshed, not silently left.

## 🧩 §5b — cluster before routing (MANDATORY OUTPUT LINE)

> **`אשכול: 12 ממצאים ⇒ 6 סיבות-שורש`**

| סיבת-שורש | הממצאים שהיא מסבירה |
|---|---|
| **A · הופכים כישלון לערך שנראה תקין** | מייל-השחרור שמדווח "נשלח" · המסך הירוק על שאילתה שנחסמה · קואורדינטות שנזרקות · **ושני הפגמים שהתיקון עצמו הכניס** (שחרור שנכשל ולא דווח · הודעת-ההרשאה שנעלמת בסינון) |
| **B · בדיקה נעוצה למצב-דאטה חי** | הזווית שנדלקה בגלל ה-UAT · המונה שנרקב ב-5.1 · המזהים הקשיחים מ-4.2 |
| **C · כלל שיושם באתר אחד מתוך כמה** | האירוע-המבוטל בארבעה מונים · תווית-הנגישות שהייתה חריגה בשורה שלה |
| **D · טענה מתועדת שהתיישנה** | ‏"‏8 מיגרציות" · טענת ה-`rating` בארבעה מקומות · סטטוס-הפרויקט בחמישה · שם-קובץ שגוי ברשם |
| **E · פער-בעלות מוצהר ותקין** | התזכורת (מ10) · סטטוס-הפרויקט (מ6) · מרכיב-האמינות (מ6) · §7.63 (מ6/8) |
| **F · יחיד ללא משפחה** | הזיכוי על פרויקט שבוטל — פער-אפיון אמיתי שישי הכריע |

🔑 **מה השינוי הזה עשה בפועל:** ‏A נסגר כ**סוללה אחת** ולא כשלושה תיקונים נפרדים — ולכן כששני
פגמים חדשים מאותה משפחה צפו בסריקת-הדיף, הם זוהו מיד כאותה סיבה ולא כ"ממצאים חדשים".

## §7-reverse — 🚧 מ4 sweep (MANDATORY OUTPUT LINE)

> **`🚧 מ4 swept — 32 tokens found across §6 (14) · micro-guides (18) · src comments (0) · design notes (0 — no such file exists); each struck-with-date or justified as still open.`**

**Judged, not counted:** in `PROJECT_MASTER §6` **7 of 14 are struck** — two from 05/08 and **four struck
today as genuinely paid by this module** (the shared mail engine · server-side filtering · the
active/inactive convention · `projects` deny-all). In `docs/micro_guides/`: **module-3's guide was
advertising three debts to module 4** — the E2E-fixture debt is **struck as paid today**, the LOG
compaction stays open **with its number corrected from 1,141 to 3,457**, and `03_quotes/CLAUDE.md`'s
bloat stays open (module 3's own file). Module-4's own five are live cross-references, and the two in
this scratch file die with it.
**Still open and why:** the four documentation-mechanism debts (`:488 :510 :516 :517`) are about the
project's own tooling, not module 4's product — none was in this module's scope, and none was silently
dropped.

## §7-reverse — raw counts (pre-judgement)

`🚧 מ4` occurrences: **PROJECT_MASTER §6 → 14** · `docs/micro_guides/` → 8 (module-3 ×6, module-4 ×2)
· `src/**` comments → **0** · `docs/*design_notes*` → **0 (no such file exists)**.
Live (unstruck) §6 lines to judge one by one: `:400 :412 :481 :485 :488 :494 :504 :505 :510 :516 :517`
(`:486`/`:487` already struck 05/08).

## §4b Duplication & shared-component — findings

## §4c Module gotchas file — findings

## §5 QA coverage matrix — findings

## §UAT (live, with Ishay) — findings

**How it was run, and why not the way it was planned.** The plan said Ishay would drive in his own
Chrome. Measured, in order: (a) the Chrome MCP tab is **recreated empty on every turn** (three
distinct tab ids), and the app stores its session in **`sessionStorage`** by deliberate design
(`src/supabaseClient.js:14`; `src/CLAUDE.md:279` — *"טאב שני — לא"*), so a login cannot survive to the
next turn; (b) in the in-app pane the **viewport changed between calls** (1176 → 1288 → 1280), element
refs went **stale within a single turn** (`ref is stale (element removed)`), and screenshots failed
whenever the pane was not displayed. ⇒ Ishay asked to be spared the effort, so the journey was driven
by a **headed Playwright script** against the **dev server** — a real browser window he could watch,
signing in as `E2E_RECRUIT_*` read straight from `.env.local` (never through Claude, never printed).
🔑 **This is the production path, not a test harness shortcut:** real login, real clicks, real network,
real writes — and it is the same credentialed pattern the project already uses.

**Journey 1 — "a hostess arrives by phone call" — PASSED, with both traps proven live.**
- Signed in as **מנהלת גיוס ושיבוץ** (the persona the module was built for).
- Repository loaded: **25 rows before**.
- Add dialog opened **empty and immediately** — the `screens-approved.md:702` requirement of *"אין
  מצב-ביניים"* holds in the real browser.
- **Trap A — invalid ID `123456789`:** the message *"מספר תעודת זהות אינו תקין"* rendered **and**
  `hostess-save` was **disabled**. Both measured, not inferred.
- **Trap B — wage `30`:** *"— מתחת ל-35 ₪ (שכר מינימום) חוסם שמירה"*, save **disabled**. The threshold
  came from `params`, not from the script.
- **Save:** toast *"דנה לוין נוספה למאגר"*; table **25 → 26**; the row visible by name.
- **DB confirmation** (`hostesses` where `id_number='123456782'`): `hostess_id` 41 ·
  email **`ishay1997@gmail.com`** (deliberate — journey 2's invite must reach Ishay) ·
  **`lat 32.063481 / lng 34.770027`** ⇒ *geocoding ran through the production path and resolved
  הרצל 1, תל אביב* · `status` **`active`** (born "פעילה", §א1) · `has_car false` · `languages {}`.

- **🔴 F-34 · a real spec-vs-built divergence the UAT surfaced, and it resolves cleanly under the
  corrected §2b order.** The new row came out with **`rating: null`** and the table shows **`—`**.
  `screens-approved.md:696-697` states `hostesses.rating` is **`int not null default 3`** and explains
  it as *"כל דיילת נולדת עם 3 כוכבים שאיש לא נתן לה"*. ⚖️ **Case ② — a dated RULING governs:** Ishay
  ruled 08/08/2026 that `rating` becomes **`int null check (1..5)`**, `NULL` = "not yet impressed"
  (`db_roadmap:140`; micro-guide Ledger row; `spec.md §12⑱(ב)`), and `schema.sql:753-754` drops both
  the default and the `not null`. ⇒ **the build is correct and the screen card carries the sentence the
  ruling reversed.** Persistence action: dated annotation **at that line inside
  `screens-approved.md`** — annotate, never rewrite.

## 🪞 Self-review — four answers, each with its anchor from THIS audit

**1 · Who caught the mistakes — me, or someone else? → Someone else, every time. Zero self-catches.**
Ishay caught the two that mattered most: (a) he corrected the resolution rule *"later + more specific
wins"* **the same day it was written**, and I had already applied the wrong version to the bank-validation
case and reported it to him as settled — his correction turned it from "closed by Claude" into "his
ruling"; (b) he added `processes-approved.md` to the scope, which produced the entire omission hunt —
without it, F-25 through F-33 would not exist. Inside the audit, the **agents** found the release-mail
blocker; my contribution was verifying it, not finding it. **The one thing that looks like a self-catch
isn't:** I reversed my own §7 routing of the a11y item — but only after the test failed a second time.
**The evidence caught it, not me.**

**2 · Which of my own actions got no check at all? → The documentation I wrote today.**
Seven dated annotations across `processes-approved.md`, `screens-approved.md` and `spec.md`, plus six
new `§6` debt lines, plus the routine's coverage line. **Nothing verifies any of them** — no test, no
hook, no reader. If I mis-cited a ruling's date or pointed at the wrong file, it would sit there
looking authoritative. *(The repo's own history says this is the risk class that bites: §6:517 records
a pointer to a §7 item **that did not exist**.)* ➕ Second unchecked surface: the new toast strings
(`reportRelease` / `reportReleaseGroup`) — **no test asserts their wording**, only that the path
reports honestly.

**3 · Where did I look for confirmation instead of refutation? → The accessibility diagnosis.**
I formed the render-race hypothesis, ran the spec in isolation, saw it pass, and read that as
**confirmation**. But an isolated pass is equally consistent with *"less parallel load"* — which is
what it actually was. I then routed the underlying `aria-label` gap to §7 as "transient only" **on the
strength of a hypothesis I had only tried to confirm**, and the full-suite re-run refuted it.
➕ Same shape, smaller: I resolved the bank-validation divergence by reaching for the first resolution
rule I remembered, rather than checking whether that rule still said what I thought.

**4 · What is the general shape — how many are really the same defect? → Five findings, two causes.**
🔴 **Cause A — "the module turns a failure into a value that looks normal": three of the five blockers.**
The release mail reported as sent · the overview's green ✅ over a denied query · the geocode result
discarded when its save was denied. Different files, one habit. *(And the module's own `api.js` header
warns about exactly this trap — the discipline was applied to **writes**, where `assertRowsAffected`
guards every path, and not to **reads and side-effects**.)*
🔴 **Cause B — "a test pinned to a live-data state": both post-regression failures**, and they join
5.1's clock-rotted counter and 4.2's hardcoded row ids as the **fourth and fifth** members of one
family. ⇒ the fixes were written as invariants, not as new pins.
*(The two singletons: the cancelled-project credit — a genuine spec gap Ishay ruled — and the
`aria-label`, which is module 1's screen and unrelated to either cause.)*

## Carried in before the scan started (from the plan phase — verify, do not trust)

- `§8` DoD line reads **"All 8 migrations"** and names eight files, but the branch diff against
  `origin/dev` contains **10** `supabase/migrations/*module4*` files — the two extra
  (`20260810001421_module4_final_approval_contact_label`,
  `20260810004500_module4_public_shift_invite_read`) are both documented elsewhere in the guide
  (§10 "migration H", and the 3.6 row's "a 9th migration was required and was NOT in the plan").
  ⇒ hypothesis: **the count in the DoD line went stale, the migrations are accounted for.** VERIFY.
- `docs/CLAUDE_CODE_LOG.md` narrative measured **3,457 lines** (`awk` between `## Session Log` and
  `## Reference`) against the file's own **≤150** target. Escape hatch (persistence 2b) applies.
- QA matrix rows already self-declared as gaps by the build sessions: **UAT ❌** (being closed live
  this session), **Performance ⚠️ not measured**, **Compatibility ◐ 390px only**.
