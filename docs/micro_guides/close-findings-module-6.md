# Module 6 — Closing-Audit Working Findings (scratch, audit rule 5)

> Created 20/08/2026 22:57 by the 5.2 closing-audit session (fresh session, branch head `94a6b99`).
> Raw findings only, appended at the moment of finding. NO conclusions, NO routing, NO fixes mid-scan.
> Clustering happens at §5b; routing at §6/§7. On a YES verdict this file archives; on NO it stays.

## Interruption-state (kept current)

- **VERDICT: [NO] — 3 blockers open (20/08/2026 23:5X). Audit scan COMPLETE end-to-end; fix round NOT started — 2 of 3 blockers need a migration = Ishay's typed-echo gate. This file stays in place per §6/persistence-8a.**
- **Paste-ready opening line for the fixing session:**
  `תקן את שלושת חוסמי-הסגירה של מודול 6 — קרא קודם את docs/micro_guides/close-findings-module-6.md (סעיף "6. Blockers — fix-ready") ואת CLAUDE.md; החוסם הראשון והשני הם מיגרציה אחת (typed-echo שלי), השלישי הוא שורת-לקוח; אחרי התיקון: gate + E2E מלא + עשן + הרצה חוזרת של מסע-הסגירה על #12 (עדיין טרי), ואז חזרה ל-module-close לפסק מחודש.`
- Fix-round progress (8c format): blocker 1 — טרם · blocker 2 — טרם · blocker 3 — טרם · regression rerun — טרם.
- Pre-flight: git fetch done · tree clean · head `94a6b99` · branch ahead of origin/dev (not merged) · fresh session (did not build the module).
- Opening facts verified: guide header shows Phases 1–4 CLOSED all signed (entry L = delegated round) ⇒ no stop.
- First ⑥3 check: `#12 E2E-תרחיש-סגירה` = `event_finished` (SQL 20/08 22:5X) — the 05:00 cron fired. `#7` also `event_finished`. Write journeys unlocked.
- Gates run this session: gate exit 0 (1,271/50 files) · full E2E **129 passed · 1 FAILED · 6 skipped** (the failure = the first-ever live run of the closing journey — a real find, below) · smoke 1 executed/0 skipped/exit 0 · audit 0 unexempted-high.
- `#12` end-state after the failed journey: UNTOUCHED (`event_finished`, all closing fields null, feedback not_sent, **zero mails fired, zero orphan files in `reports`** — upload→refusal→delete cycle proven clean). #12 remains a fresh subject for the fix round's red→green proof.

## 6. Blockers — fix-ready (template §6 four-field format)

### Blocker 1 — the closing RPC refuses the legal-empty closing the approved card mandates
① **Where:** `close_project_operationally`, grep anchor `לא התקבלה רשימת הדיילות לסגירת האירוע` (migration `20260814142439:384-386`; confirmed in LIVE prosrc 20/08).
② **Observed:** live prosrc query — `jsonb_array_length(p_rows) = 0 ⇒ raise`. Client sends `[]` when zero finally_approved (closingDraft.js:34-36, ClosingTab.jsx:274-275 enables the button) per screens-approved:1303 ("הסגירה נשארת אפשרית"). Server refuses ⇒ Dana fills 3 fields, clicks, gets a wrong error AND the uploaded report is deleted (ClosingTab.jsx:359). Reachable: quote approved after its date passed / event nobody invited (the original #7 class).
③ **Read first:** screens-approved.md:1303 + 🏁6 table (blocks only "assigned-unmarked") · module-6.md §4.2-4.3 · the RPC migration in full.
④ **Proof of fix:** fault-injection — a manufactured zero-assignment `event_finished` subject (or unit-level: call RPC with `[]` impersonated) goes refusal→success; the E2E legal-empty test stops skipping the moment such a subject exists. Regression: the "assigned but unmarked" refusal must STAY red (server compares p_rows against live finally_approved rows).
**Fix = migration (typed-echo). Size: one guard change — allow `[]` iff the project has zero finally_approved assignments (keep refusing when rows exist but payload is empty).**

### Blocker 2 — per-hostess hours bound: server derives from PLANNED times, client+card from ENTERED event hours
① **Where:** same RPC, grep anchor `v_max_hours` (`20260814142439:454-463,568`) vs `src/lib/projectClosing.js:145,159` (`upperBound = eventHours + 2` from the entered `actualHours`).
② **Observed:** the first live closing journey on #12 (E2E 20/08) — client said `מוכן לשליחה ✓`, server threw `אפרת דהן: שעות בפועל חייבות להיות בין 0 ל-3.5` (planned 22:00-23:30 = 1.5h ⇒ 3.5) against entered event-hours 6. Screenshot: `test-results/project-closing-…/test-failed-1.png` + error-context.md.
③ **Read first:** screens-approved.md:1412 — the card's bound is "שעות-האירוע + 2" where the closing screen's only event-hours value is the ENTERED field (:1406, 0.5-24) ⇒ **the server is the deviator**. Also read the RPC's v_event_hours block in full (midnight-crossing logic must survive the change).
④ **Proof of fix:** re-run the closing journey on #12 (still fresh) — red today, green after. Regression: row-hours > entered+2 must still refuse (fault-injection: fill row hours = event+3 via the same journey, expect the Hebrew refusal).
**Fix = same migration as Blocker 1: `v_max_hours := p_actual_hours + 2` (with the existing 0.5-24 validation on p_actual_hours). Size: one line + regression of the RPC's own hours checks.**

### Blocker 3 — ScopeChangeDialog swallows REAL quote-load failures into the '—' no-permission rendering
① **Where:** `src/modules/06_projects/ScopeChangeDialog.jsx`, grep anchor `getQuote(project.quote_id).catch`.
② **Observed:** code read — `getQuote` (03_quotes/api.js:78-86) returns null-on-blocked WITHOUT throwing and throws only on real errors ⇒ this `.catch(()=>null)` swallows exclusively genuine failures; money columns render '—' as if no-permission, no error state, no retry, dialog stays savable. Violates acceptance criterion #8 ("מסך שלא הצליח לטעון אומר זאת").
③ **Read first:** the sibling loads in the same `Promise.all` (they throw into loadError — the in-file precedent) · module-6 CLAUDE.md money-flag rule.
④ **Proof of fix:** unit/E2E — intercept the quotes read with a 500 as מנהלת פרויקטים ⇒ expect the locked error state + `נסי שוב`, NOT '—' columns. Red today (renders '—'), green after.
**Fix = client one-liner (remove the catch). No migration.**

## 5b. Clustering (after full scan): ~24 raw findings ⇒ 9 root causes
- RC-1 (BLOCKERS 1+2): one RPC's validation deviates from the approved card in two spots — one migration.
- RC-2 (BLOCKER-adjacent, routed §7 after the harm test): ClosingTab resend semantics (F2+F6 share one root — runMailPhase/handleResend don't track per-mail state; survey can double-send when mark-RPC fails, report failure dropped when survey succeeds). NOTE: routed §7 ONLY if Ishay rules so — recommendation below says fix F2's message-drop inside the round (client, same file as nothing else touches). See report.
- RC-3 (BLOCKER 3 + debt): `.catch(()=>fallback)` where the fallback has business meaning — F3 (blocker, acceptance-criterion violation) · F5/F7/F8 (rare transient paths with recovery ⇒ one §7 line).
- RC-4 (debt): F1 cancel-banner blocked-read — latent (cancel gated on projects-edit; live matrix gives projects-edit only to CEO+PM who both read assignments). §7 hardening line.
- RC-5 (debt): AS-6-pattern violations — F4 rollback-update unchecked · F9 dormant-param silent-disable. §7.
- RC-6 (Ishay's ruling): B-1 surface-8 amount ignores project_changes — spec-mandated (screens-approved:2126-8), unowned, 0 live rows today so no screen lies yet. Options: build now (work: money-gated read path) / register 🚧 targeted at מ5-scope-UI or מ8 + dated annotation. Recommendation: register.
- RC-7 (debt + annotations): B-2 breadcrumb source-tab · B-3 disabled-controls vs text · B-4/B-5 cross-card resolutions unrecorded (annotate cards) · B-6 deliberate (comment-only) · processes-approved still claims present-tense that approval-RPC writes logistics origin pointers (STALE — annotate) · screens-approved `עד 10MB` line (re-derive by grep at persistence).
- RC-8 (debt): rpcErrorMessage surfaces raw Postgres text on unanticipated errors (security-scan LOW) + send-email `detail` passthrough.
- RC-9 (hygiene): stale audit exemption `GHSA-qwww-vcr4-c8h2` removable · db_roadmap M6-14 Done-cell still says "live, wrong" (fixed by 2.6 — flip at persistence) · 6 audit exemptions name THIS close as renewal point + cite the cancelled 19/09 date · `npm audit fix` (nanoid/js-yaml/undici) deliberately deferred "to module close" = now — recommend a fresh post-merge line, not inside this branch.

## 4d. 🔮 answerable-later — 1 gap registered
- (א) overwrites: quality-mark overwrite ruled (B13, UI warns) · project_changes appends · closing one-time ⇒ covered.
- (ב) no-trace-of-when: **1 gap** — a location/hours edit via `update_project_details` on a project with ZERO finally-approved hostesses sends no mail and journals nowhere ⇒ "מתי השתנה המיקום" is uncomputable for that class (date changes DO leave traces — re-invite rounds in assignments; mailed changes land in email_log with entity_id+created_at). ⇒ dated `🚧 מ11` candidate line (register at persistence).
- (ג) journal keys: email_log keyed entity_type+entity_id ⇒ joinable ✓.

## Self-review (4 answers, anchored)
1. Who caught the mistakes — NOT me line-by-line: the dispatched lenses did (process-hunter → blockers 1+2's server side · silent-failure-hunter → F1-F9 · spec-agent → B-1), and the FIRST LIVE RUN of the closing journey caught blocker 2 exactly as the as-built note predicted ("המסעות מעולם לא רצו — יש לעבור עליהם בעין"). Self-catch: one — my own wrong param-name guess for the mail templates, corrected by reading the seed migration in the same turn. Zero self-catches of my own conclusions by re-reading.
2. Got no check at all: the impersonated write-refusal call (permission classifier blocked it — compensated by LIVE prosrc gate reads, stated openly) · actual mail delivery (zero mails fired this run — nothing to check) · Compatibility's manual counter-read (leaned on the 3.9 pass + bidi gate, not re-done).
3. Confirmation vs refutation: the DoD walkthrough was confirmation-shaped; the refutation lenses were the agents + the live journey. One place I accepted a prior triage: the 25 security-advisor findings matched 1.10's count and I re-derived only the rls_enabled_no_policy class whole-DB, not all 25 explanations.
4. General shape: 24 findings ⇒ 9 roots; the dominant shape is ONE: "paths that never executed until tonight" — the write journeys' first live run found the server-client contract drift, and the empty-close path (never run anywhere) hides the second server drift. The module's read paths, RLS, money-gating and vocabulary are clean everywhere they were measured.

## Raw findings

### Gates (measured this session, 20/08 23:0X)
- `npm run gate` exit 0 · Tests 1271 passed / 50 files · audit: 7 findings, 6 exempt, 0 unexempted-high · bidi 0 · check:context OK · check:docs-structure 36 files 0 findings.
- Gate hygiene line (from audit-gate itself): exemption `GHSA-qwww-vcr4-c8h2` matches no vuln anymore — removable from `scripts/audit-gate.mjs`. Also: all 6 exemption notes name "סגירת המודול הבא" as their renewal point (= THIS close) and cite the cancelled 19/09 deadline.
- `npm audit fix` deliberately deferred to module close (nanoid exemption note says so) — this IS the close; dependency-upgrade decision is open.

### RLS / security (measured live via SQL, 20/08 23:0X)
- Positive control: CEO impersonation → list_projects_overview = 5 rows. Anchors live: #8 planned_revenue 5355.00 ✓ · #8 staffing 1/6 ✓.
- Anchor 0/1 (#11) does NOT reproduce live — #11 is 1/1 `ready` (documented deliberate board move: Noa final-approved 19/08 for ⑫ proof). Computation is unit-pinned; not a defect. 6,318.90 + 1,085.00 = unit-pinned (verify test presence).
- Logistics manager: 5 rows, 0 revenue values ✓ (S-2). Recruit → logistics: 0 rows ✓. Staff → logistics: 6 rows ✓ (positive).
- Live matrix: לוגיסטיקה×פרויקטים=view ✓ (ratified) · PM×דיילות=edit ✓ (Ishay 19/08 ruling intact) · PM×כספים=blocked · finance×דיילות/לוגיסטיקה=blocked.
- All 9 M6 functions: SECURITY DEFINER + search_path='' + anon revoked ✓. recompute_project_status also revoked from authenticated ✓. All 4 operational write RPCs carry 'פרויקטים' gate + closed-check in LIVE prosrc ✓.
- NOTE: micro-guide §4.3 says `set search_path = public, pg_temp`; live is `search_path=""` (stricter). Doc-level nuance only.
- Impersonated write-refusal call (view role → update_project_details) was BLOCKED by the session permission classifier — not executed. Compensating evidence: live prosrc gates verified + phase-1 gate script 97/100 + agent read of migration gate lines. Record honestly in report.
- Policies live: projects=1 (SELECT) ✓ no write policy ✓ · logistics=1 ✓ · project_changes=0 (deny-all by design) ✓ · email_log=3 SELECT (incl. email_log_select_projects_module) ✓ · storage.objects total 12 ✓ · buckets: reports=2097152 ✓ finance=10485760 ✓.
- email_log.entity_type CHECK = 4 values ✓. Triggers: all 3 recompute triggers live ✓. cron: module6-event-finished @ 0 2 * * * ✓ — and it FIRED: #12 event_finished this morning.
- Advisors security: 25 findings = same as 1.10 triage (4 rls_enabled_no_policy · 20 DEFINER warns intentional · 1 leaked-password-protection). rls_enabled_no_policy whole-DB check: login_attempts+login_rpc_calls (deliberate DEFINER-only) · project_changes (deliberate, RPC-masked) · salary_reports (M8-unbuilt) — ALL FOUR carry a written triage in supabase/migrations/CLAUDE.md:117-123 ✓.

### §2c security-scan agent (agent-reported; key items)
- Categories 1-5,7: checked clean (details in agent output; M6 added zero new packages).
- LOW finding: `rpcErrorMessage` (06_projects/api.js:36-39) surfaces error.message verbatim — an UNANTICIPATED Postgres error (e.g. CHECK violation, deadlock) would show raw English constraint text to the user. Deliberate design for curated Hebrew raises; leak only on undocumented paths. + send-email returns `detail: errorMessage` (index.ts:198).
- Informational: CORS `*` on send-email — acceptable (bearer JWT, not cookies).

### §3b silent-failure-hunter agent (agent-reported, NOT yet independently verified)
- F1 (live-path): CancelProjectDialog banner counts hostesses from a possibly-RLS-blocked read → "אין דיילות משובצות" false claim before an irreversible confirm (CancelProjectDialog.jsx:295-298,352,429-431; projectCancellation.js:164). TeamTab solved same case via overviewRow fallback.
- F2 (live-path): ClosingTab resend: survey-success + report-failure → success toast, message discarded, resend strip disappears (feedbackStatus='sent'), report mail unrecoverable from UI (ClosingTab.jsx:407-431).
- F3 (live-path): ScopeChangeDialog `getQuote(...).catch(()=>null)` swallows REAL failures only (blocked reads return null without throw) → money columns render '—' as if no-permission, dialog still savable (ScopeChangeDialog.jsx:536).
- F4: sendDateChangeReinvites rollback UPDATE ignores result (api.js:325-331) — violates AS-6 pattern.
- F5: getCustomerMailContact `.catch(()=>null)` → failure presented as "ללקוח אין כתובת מייל" (ClosingTab.jsx:217,283-291).
- F6: survey mail success + mark-RPC failure → resend re-sends survey (double mail to customer); resend strip claims survey never went (ClosingTab.jsx:313-319).
- F7: locked-view download button failure = console.error only (ClosingTab.jsx:1215-1222).
- F8: getCustomerPreferences `.catch(()=>[])` — real failure rides the '—' convention silently (ClosingTab.jsx:229).
- F9: missing dormant param → all customers silently non-dormant (customerProjects.js:86-93) — opposite policy of getCancellationParams which blocks.

### Orchestrator verification of F1-F3 (own reads, 20/08 23:2X)
- F1 mechanism CONFIRMED (getProjectAssignments returns [] on blocked, banner counts it) — but LATENT: cancel button gated on projects=edit (ProjectCardPage:76,231); live matrix holds projects-edit only for CEO+PM, both of whom hold דיילות read/edit ⇒ unreachable today. Fires only if matrix changes.
- F2 CONFIRMED in code (handleResend:425-431 — surveyMarked short-circuits, outcome.message dropped, resend strip keyed to feedbackStatus='not_sent'). Plausible divergence path: attachment-specific Make failure (report has attachment, survey doesn't).
- F3 CONFIRMED: getQuote (03_quotes/api.js:78-86) returns null-on-blocked WITHOUT throwing, throws only on real errors ⇒ ScopeChangeDialog:536's `.catch(()=>null)` swallows exclusively real failures. Violates acceptance criterion #8/#4 (a failed load says so). Fix candidate = remove the catch (siblings in same Promise.all throw into loadError) — one-line repair with in-file precedent.

### §2b spec-diff agent (agent-reported)
- All NINE acceptance criteria PASS with evidence anchors. Locked vocabulary/strings reproduce verbatim. No urgency score anywhere (criterion 1).
- B-1 🔴 (real deviation, no owner): surface-8 amount column ignores project_changes — screens-approved:2126-2128 says once project_changes exists the column MUST be quote+Σ changes; customerProjects.js:143-146 sums quote only. No 🚧/§6/§10/ledger record. MEASURED live: project_changes has 0 rows ⇒ no wrong number on screen today. Needs Ishay routing (work, not repair: read-path + money-gating design).
- B-2: card breadcrumb always returns to default tab, not source tab (screens-approved:403 vs ProjectCardPage:376-388). Unrecorded gap.
- B-3: surface-5 view-only renders disabled controls, card :1316 wanted values-as-text. Unrecorded choice.
- B-4: cancelled project's closing tab exists-disabled (card :1331 wanted absent) — resolves cross-card contradiction toward card 2's disabled-and-explained; unrecorded resolution → candidate dated annotation.
- B-5: surface-4 post-event block tooltip without link (card :1068 wanted link; card 2 wanted disabled+reasoned) — followed card 2; unrecorded resolution → candidate dated annotation.
- B-6: surface-8 retry reloads projects tab only (card :2061 wanted whole page) — deliberate, reasoned in code comment only.
- Known-deferred honored: TeamTab row-click (carry-forward ④) · tile-2 sub nodded.


