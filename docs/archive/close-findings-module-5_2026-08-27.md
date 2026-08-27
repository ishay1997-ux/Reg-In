# close-findings-module-5 — working findings file (audit rule 5)

## 🅿️ FROZEN STATE (27/08/2026 00:1X) — the resume contract

**The audit is COMPLETE except the fix round's Ishay-gated half. A fresh session needs ONLY this file.**

**The three questions, verbatim as put to Ishay (report artifact `claude.ai/code/artifact/17872adf-2da2-4e53-b570-87e79560c4a3`):**
1. *"שני תיקונים נכנסו לקוד בלי שנרשם אישור שלך — לאשרר או להחזיר?"* (commits `030bee4`+`bde057a`,
   22:55–22:56, after STATUS 22:2X listed both as `⏸️ פתוח אליך`; owns the single red e2e test
   projects.spec.js:122). **Recommendation: ratify.** Blocks: e2e green + the verdict.
2. *"הודעה שהובטחה בכרטיס-המסך ולא נבנתה: 'הפרויקט לא התקדם כי חסרה דיילת' — לבנות עכשיו או לדחות?"*
   **Recommendation: build-now (small).** Blocks: DoD §8.3 completeness note.
3. *"סימנים פנימיים (`(㊴)` · 'מודול 8') מגיעים למסך של דנה — להשאיר ולרשום ל-M12?"*
   **Recommendation: register M12, leave as drawn-approved.** Blocks: nothing (flag).

**What is already COMPLETE:** every audit section ran (see below) · blocker C-1 FIXED+red-proved
(working-tree changes: ChecklistDialog.jsx + ChecklistDialog.test.jsx + LogisticsPage.jsx —
UNCOMMITTED) · gate exit 0 ×2 (1,439/56) · smoke 0 · e2e 1-red (the C-2 test only) · frozen-state
persistence written (micro-guide §1/§7/§8/§10) · report artifact published + quiz.
**What remains on Ishay's answers:** ‏(1)→ update projects.spec.js:122 assertion (or revert the two
fixes) → full `test:e2e` re-run → if green: verdict [YES] + typed-echo (module name + `DoD`) →
YES-persistence: LOG-compaction (685→≤150, archive first, 2b′ self-audit) · dated annotations on the
19 stale anchors (re-derive by grep!) · src/CLAUDE.md deny-all += project_changes · roadmap 2c line ·
STATUS row flip · archive THIS file · commit (pathspec!) · PR instructions + 🧩 prompt.
**Regression state per blocker:** C-1 תוקן+ירוק · C-2/C-3/C-4 ממתינים להכרעה. Full regression after
C-1 ran (gate 0); a second run follows the C-2/C-3 fixes if any.

## 🟢 ROUND 2 (27/08/2026 00:2X–) — Ishay's blanket ruling landed: "בצע הכל לפי המלצה שלך... ואם ניתן לסגור"

All three decisions ruled PER THE RECOMMENDATIONS. Executed:
- **C-2 ratified** ⇒ projects.spec.js:122 updated to the new honest assertion (new testid
  `logistics-state-no-permission-logistics` + TAB_NO_PERMISSION_SENTENCE byte-copy; also asserts the
  OLD branch absent). + the leftover eslint exhaustive-deps warning in LogisticsTab fixed
  (canReadLogistics added to deps with why-comment) — the unratified commit's last loose thread.
- **C-3 built:** STAFFING_HOLD_SENTENCE + staffingHold state + amber banner in ChecklistDialog
  (fires only when THIS save marked ready + all rows ready + project not ready; moment-message, any
  other save clears). Locking test added incl. the clears-on-next-save half. RED-PROVED (stash source
  → 1 failed → pop → green). Wording is הנחתי-delegated (recorded §3.7), overridable.
- **C-4 registered:** ONE `🚧 מ12 ← מ5` line in §6 (glyphs · notes length-cap · irreversible-lens
  rerun) + O-7 row in guide §3.5. Reverse-sweep bonus: `🚧 מ12 ← מ4` item (ב) (dead waivers) PAID —
  both stale GHSA waivers removed from audit-gate.mjs, §6 line struck-with-date.
- **Carried items:** customer-page.spec.js rewritten as runtime invariant with denominator assert
  (open-quote rows; loud fixture-refresh failure instead of vacuous green) · .first() conflict:
  answered — runtime-condition selection is the rule, .first() AFTER a condition is fine (module-4's
  dated approval stands; recorded in LOG) · irreversible-lens → inside the מ12 line.
- **src/CLAUDE.md deny-all += project_changes** (dated).
- **§6b re-scan of round-2 diff (both lenses, auditor's own):** clean. Notable check: the staffing
  sentence cannot lie — all-ready + active + not-ready implies staffing-missing BY THE TRIGGER'S OWN
  FORMULA (ready ⇔ all-logistics-ready AND staffing-full, guard active-only); a qty/note save carries
  no item_status key ⇒ no banner; cancelled/finished saves raise ⇒ never reach the branch.
- Unit: modules 5+6 = 261/261 green. **Full regression LANDED GREEN: gate exit 0 (1,440/56) ·
  test:e2e 143/0/6 · smoke exit 0.**

## 🏁 ROUND 3 (00:3X–01:0X) — Ishay: "מבחינתי יש אישור. מזג לפי הנוהל... וגם תעבור על תיעוד הקבצים"

Docs-pass EXECUTED (his explicit ask, ahead of the echo):
- LOG compaction: narrative **747→244** (target ≤150 unreachable without compressing the two protected
  newest entries, ~115 lines by themselves — declared); Current State REWRITTEN; 3 working-lessons
  harvested to Reference: Operational Gotchas (SessionStart-banner-is-a-pointer · untracked-files-vs-
  pathspec-commit · Edit-swallows-neighbor-heading — the third from this session's own near-loss of
  the m8 journal heading, caught by a headings count). Archive: CLAUDE_CODE_LOG_pre-compaction_2026-08-27.md.
  2b′ fast-read declaration: the m8-day sub-bullets and the m6-arc one-liners were read at speed.
- Guide compaction: **1,716→1,005** (phases 1–5 → as-built table; both carry-forward contracts kept
  verbatim; §3/§10/DoD/QA untouched). Archive: module-5_pre-compaction_2026-08-27.md.
- Debts sweep per his question: 3 stale-open מ4 §6 lines measured ALREADY-PAID & struck w/ evidence ·
  §2 TOC "16 טבלאות" remnant fixed · module gotchas file +3 close-mines · roadmap 2c line written
  (close 27/08 vs planned 11/09, −15 to the buffer, later modules NOT moved) · two-weeks plan → attic ·
  routines coverage line updated (20 specs, modules 1–6; the E2E_LOGISTICS_* myth corrected) ·
  module-6.md entry S (the C-2 write-back).
- Annotation agent (19 stale spec anchors): dispatched; verify-on-landing.
**Remaining, gated on the literal typed echo "לוגיסטיקה DoD":** archive THIS file · STATUS row flip ·
pathspec commit (+ explicit `git add` for new files!) · push · PR via claude-in-chrome (his browser,
the PR #62 precedent, his explicit "מזג עבורי") · CI green · merge · post-merge flip.

## 🪞 Self-review (4 answers, anchored)

1. **Who caught the mistakes — me or someone else?** The E2E suite caught C-2's red; the
   silent-failure AGENT caught C-1; the spec-diff AGENT caught C-3. My one genuine self-catch:
   the evidence-spec's NOTE_SUBROWS=0 — caught only because a second independent channel (live SQL)
   disagreed with it; my own spec had fallen into the documented measure-the-skeleton trap while
   this very audit was quoting that rule. Self-catch-by-rereading: zero, as measured before.
2. **Which of my own actions got no check?** ‏(א) the identity of the process serving port 5173
   (assumed same-tree vite; e2e used its own 4173 build so impact bounded) · ‏(ב) Dana's no-op
   control write bumped one demo row's updated_at — disclosed, not reverted, and I did not verify
   nothing reads updated_at · ‏(ג) smoke's CONTENT — I read exit 0, not its assertions.
3. **Where confirmation instead of refutation?** The pills: SQL derivation FIRST, screen second —
   right order. Weak spot: I initially read C-2's timeline as violation-shaped; the equally-consistent
   reading (chat approval given, write-back missed) was adopted only on second pass — the question to
   Ishay is phrased as a record-gap, not an accusation.
4. **General shape — how many findings are one defect?** 12 raw ⇒ 4 root causes; the dominant one:
   POST-GATE-WINDOW work landing without its process tail (nod-record · full-e2e re-run · doc
   write-back). C-2 is it entirely; C-1's defect was born inside a post-gate fix nobody re-scanned —
   the exact class §6b's "re-scan the fix diff" rule names: the code written last, under pressure,
   is the only code no scan ever saw.

> Scratch file for the module-5 closing audit, 26/08/2026. Raw findings appended at the moment
> of finding — no conclusions, no routing, NO fixes mid-scan. Clustered in §5b, routed in §6/§7,
> archived on a YES verdict only.

## Session state (interruption-safety)

- Audit session opened 26/08/2026 ~23:0X. Branch `ishay/module-5-logistics`, HEAD `be24d69`,
  clean tree, `git log origin/dev..HEAD` non-empty (67+ commits, NOT merged).
- Pre-flight done: rule 16 (0 uncommitted files at session start, no parallel writer detected) ·
  rule 10 (`git fetch origin` ran) · fresh session (this session built nothing of module 5).
- ⑥3 block read (its five must-knows + three open-to-Ishay items registered below).
- Progress: audit sections not yet run. Findings below, per section, as they land.

## ⑥3 carried items (NOT findings — context the audit must honor)

1. Scope = `git diff origin/dev...HEAD --stat` (touches shared FilterPill/ToastProvider,
   module-1 PricingParamsCard, module-4 e2e specs, check-docs-structure.mjs) — not "M5 + 2 ripples".
2. POST-GATE work exists (explicit `הסר פריט` button replaced type-0; Esc-note-loss fix;
   error-toast persistence) — audit the FINAL state.
3. DoD §8 = 16 unticked boxes; most were done but never ticked. Evaluate one-by-one.
4. Module 5 lives ONLY on this branch — not on origin/dev, not on origin/main.
5. Gate runs green 26/08 but two were red same-day for non-code reasons (M8 docs-structure file ·
   5 module-4 live-data fixtures). If red again — read micro-guide end sections before diagnosing.

## Open-to-Ishay items from ⑥3 (bring, don't close)

- `.first()` as e2e selection strategy — conflict question vs module-4 micro-guide's dated approval.
- `e2e/customer-page.spec.js:218-222` — 3 negative assertions pinned to quote #22; expiry cron
  (~31/08) makes them vacuously green. Module 3, out of scope, not fixed.
- "Irreversible actions" lens of the feedback sweep crashed mid-run, never re-run — ground uncovered.

## §5b Clustering (done after the last audit section) + §6b fix-round state

**אשכול: 12 ממצאים גולמיים ⇒ 4 סיבות-שורש + חבילת-תיעוד אחת.**

| Cluster | Members | State |
|---|---|---|
| **C-1** — the close path does not observe the in-flight save | F-1 (swallowed failure) + F-1b (stale refetch) | ✅ **FIXED this round** (precedent-based repair — persistent error toast, Ishay's 26/08 toast ruling; + onSaveSettledAfterClose refetch). Red-proved: new test fails without the fix (1 failed), 94/94 green with it. Full gate re-run: pending/see below. Self-scan of fix diff (2c+3b lenses): clean — the branch surfaces instead of swallowing; optional-chaining no-op only when no consumer passes the prop (single consumer passes it). |
| **C-2** — post-22:2X commits without recorded nod + no full-e2e re-run | F-2 (projects.spec.js:122 red) + F-3 (LogisticsTab gate + PricingParamsCard unratified; zero write-back) | 🅿️ **ISHAY** — ratify (recommended; then the audit updates the test assertion to the new honest state and re-runs e2e) or revert. |
| **C-3** — card-promised behaviour unbuilt | F-4 (last-item-ready-but-understaffed message) | 🅿️ **ISHAY** — build-now (small: one conditional banner + test) / defer with §6 line. |
| **C-4** — internal-glyph treatment inconsistency | obs A (㊵ explainer hybrid, "מודול 8" visible) + obs B ((㊴) in tooltip vs (㊵) dropped) | 🅿️ **ISHAY flag** — recommend register as M12 polish (drawn-approved as-is). |
| **D-batch** — documentation reconciliation | 19 stale spec anchors · src/CLAUDE.md deny-all missing project_changes · micro-guide header stale · advisors triage notes | Persistence step 7 (re-derive by grep at execution). |

**Debt candidates (§7):** notes length-cap hardening · 2 stale audit-gate exemptions · LOG compaction owed (685 vs ≤150 — numbered debt until the close completes) · stale two-weeks plan → attic. **⑥3 carried opens:** .first() conflict question · customer-page.spec.js:218-222 vacuous-by-31/08 · irreversible-actions lens never re-run.

**Fix-round per-blocker state (interruption contract):** C-1 תוקן (regression: module tests 94/94 ✅; full gate run started 23:59) · C-2 טרם — awaiting Ishay · C-3 טרם — awaiting Ishay · C-4 טרם — awaiting Ishay. Regression run after C-1: gate started (result to be recorded).

## Findings by section

### §1 DoD walkthrough

- Live DB (26/08 ~23:1X): `logistics` = 2 policies (select_by_permission SELECT · write_by_permission ALL) ·
  5 CHECKs (planned>0 · status-3 · origin_exactly_one · actual_qty>=0 · color-5-values) · all 5 new columns
  present (color · expected_arrival_date · actual_arrival_date date · actual_qty_autofilled bool NOT NULL default false).
- Origin pointers: 16/16 with quote_service_line_id, 0 project_change_id, 0 no-origin.
- Contract-3 formula re-derived live: pills today = needsAction 4 (#15,#16,#8,#3) · awaiting 1 (#14) · all 6.
  (#16 "כנס שנתי" born today via real quote approval — live drift, exactly as ⑥3 warned; formula holds.)
- #13 (פסטיבל קיץ עירוני) project_status='ready' — derived (2/2 rdy rows + staffing), consistent with trigger derivation.
- `npm run gate` exit 0 (this session): lint · format · unit · build · dup(15 clones, under threshold) ·
  deadcode(knip, 1 css hint only) · audit(0 unexempted) · check:bidi 0 · check:context OK · check:docs-structure 66 files 0 findings.

### §2 Security & RLS

- Impersonation stress test (FULL recipe incl. `set local role authenticated`, positive-first):
  Dana(edit): read 16, no-op write 1 row ✅ · Noa(view): read 16, write 0 rows ✅ · Recruit(blocked): read 0, write 0 ✅.
  (Dana positive write = notes=notes no-op on demo #15 row; only updated_at bumped.)
- Live RPC guards: apply_scope_change — old string 'להסרת פריט לגמרי' ABSENT, both refusal strings present,
  delete-branch present. update_logistics_item — SECURITY DEFINER, search_path set, closed-event raise present.
- anon table grants on logistics exist (Supabase default) but zero policies apply to anon ⇒ RLS denies; house-wide pattern, not module-5's.
- Advisors security: 26 findings = phase-1 baseline 26 exactly, ZERO new.
  rls_enabled_no_policy whole-DB check (exempt-class): login_attempts + login_rpc_calls (deliberate DEFINER-only, fine) ·
  project_changes (reads via list_project_changes DEFINER RPC, writes only inside apply_scope_change — deliberate; verify documented in src/CLAUDE.md deny-all list) ·
  salary_reports (M8 territory, deny-all until M8 policies) — TRIAGE NOTES NEEDED in report.
- Advisors performance: 25 (vs 27 phase-1 baseline — fewer). 2 new INFO unused_index on logistics = the M5 FK indexes just created, never yet queried — expected, keep.
- Public/no-auth surface: module 5 added NO public/anon-reachable endpoint (update_logistics_item EXECUTE revoked from public+anon, granted to authenticated only — migration 2447:222-225). The 4 anon-callable DEFINER functions in advisors are M1/M4 (login + shift-invite), pre-existing.

### §2c General security scan (agent, completed)

- 0 real-exploit findings. Categories 1-5,7 clean (see agent report in transcript).
- Hardening note A: `notes` has no length cap (RPC or schema) — edit-holder could store huge text. Internal tool, no exploit path.
- Hardening note B: unanticipated Postgres errors (deadlock class) would surface English text via rpcErrorMessage — recorded AR-9 pattern, residual only.
- package.json/lock diff vs origin/dev EMPTY — zero new dependencies.

### §2b UX & validation (built-vs-approved-spec) — agent completed + auditor's own E2E investigation

- Agent walked spec.md + both screen cards + all 7 process cards vs code. All 5 approved supersessions verified present.
  Column headers/widths match approved mockups exactly. Verdict on cards/process: one finding + two conflict-observations.
- **F-4: card-promised behaviour with no home** — surface-2 card §② (grep `בלעדיו סימון הפריט האחרון לא יקדם את הפרויקט`):
  when she marks the LAST item ready on an under-staffed project, card says a message should say the project did not
  advance; built code shows banner ONLY on project_status='ready' — under-staffed case shows NOTHING. No register closes
  it. Unbuilt, untriaged. → Ishay (build-now-small / defer), never silent.
- **Conflict-obs A:** ㊵ explainer — mockup (appearance authority, has `(㊵)` glyph + module-8 sentence) vs §3.7 locked
  string (has neither) vs built (hybrid: sentence yes, glyph no). "מודול 8" wording is user-visible. Two sources disagree;
  build closest to mockup. → Ishay flag, tiny.
- **Conflict-obs B:** `(㊴)` glyph reaches the user in the cancelled-qty tooltip (byte-locked §3.7 + drawn in mockup ⇒
  approved as-is) while sibling `(㊵)` glyph was dropped — opposite treatments of two internal glyphs. → Ishay flag, tiny.
- **Stale-sentences list: 19 anchors** across processes-approved.md (8) · spec.md (2+) · screens-approved.md (9) still
  stating pre-M5 reality with no dated note beside the line (full list in the agent report / to be re-derived by grep at
  persistence step 7 per template). Documentation reconciliation, NOT blockers.
- End-of-UI-phase 🎨 review honored: 3.4 APPROVED 26/08 13:3X (quote in guide). States/keyboard/RTL: e2e a11y +72 axe
  checks green, bidi Range audits recorded in §10, states proven by interception in e2e/logistics.spec.js.

#### E2E failure investigation (the audit's own)

- **F-2: `test:e2e` exit 1 — 1 failed / 142 passed / 6 skipped.** projects.spec.js:122 (module-6 card, recruit):
  expects testid `logistics-state-no-permission` + sentence `אין לך הרשאה לצפות בפריטי ההצעה`; screen now renders the NEW
  first-gate branch `logistics-state-no-permission-logistics` + `אין לך הרשאה לצפות בפריטי הלוגיסטיקה, ולכן לא ניתן
  לקבוע אם הרשימה ריקה כדין.` (error-context.md line 55 — the honest state IS on screen; the test pins the old one).
  CAUSED BY THIS BRANCH (not live-data drift): commit bde057a added a permissions-map first discriminator to LogisticsTab.
- **F-3 (process/approval): the two 22:5X commits (030bee4 22:55 · bde057a 22:56) landed AFTER the last STATUS write
  (22:2X) which lists BOTH indication-defect fixes as `⏸️ פתוח אליך` (awaiting Ishay):** (a) LogisticsTab permission
  discriminator (bde057a) — zero documentation anywhere (grep TAB_NO_PERMISSION/noPermissionLogistics in micro-guide,
  LOG, STATUS = 0 hits); (b) PricingParamsCard setSavedOk(false) fix (bde057a). No recorded approval on disk. Also:
  the full E2E was never re-run after 22:55 (last recorded full run 19:0X; post-gate re-ran only the 2 rewritten
  module-4 specs) — which is how F-2 survived to the audit. → Ishay: ratify (then update projects.spec.js:122 to the
  new honest assertion — recommended) or revert bde057a's LogisticsTab/PricingParamsCard parts. Until ruled: E2E is red.
- Out-of-⑥3-list files explained: TeamTab+HostessesPage = 1bb56c1 (22/08, smart-match link fix, pre-blueprint) ·
  SmartMatchPage = f4748e8 (22/08, reliability-banner wording fix) — both older, documented in their own commits.

### §2c General security scan

### §3 Architectural review

### §3b Silent-failure sweep (agent, completed)

- 🔴 **F-1 (real, user-facing-silent-loss): flush-on-close save failure is swallowed.**
  Where: ChecklistDialog.jsx `closeAfterFlush` (grep `closeAfterFlush`) + the save catch (grep `aliveRef.current`) +
  LogisticsPage `closeChecklist` (grep `closeChecklist`).
  Scenario: type note/qty → close dialog in same motion (Esc/overlay/button) → blur fires save → dialog unmounts
  (`aliveRef=false`) → RPC fails (network/42501/RLS_DENIED) → catch returns early, error dropped. No toast, no console,
  row-error UI unmounted. Screen promised "כל שינוי נשמר מיד". Reopens the failure branch of the 5.1-era fix.
  Conflict check done by agent: the blur-before-close fix is recorded (§10 post-gate ②) but covers firing the save,
  not surfacing its failure. §4.5 does not cover. Remedy constraint: fix comment says "בלי פקד חדש, בלי חלון-אישור" —
  so surface via persisting error toast (existing 26/08 pattern), never confirm-on-close.
  Routing candidate: §6 blocker (swallowed error on live user-facing path per §3b routing rule); precedent-based repair.
- F-1b (corollary, minor): `closeChecklist` fires `refetch()` while flush-save still in flight ⇒ queue can show
  pre-write counts until next reload. Same fix locus. Routing candidate: fix together with F-1 or §7 debt.
- All other paths explicitly checked clean / covered by recorded decisions (agent report in transcript).

### §3 Architectural review (free hand, suggestions only)

- File sizes: LogisticsPage 651 · ChecklistDialog 904 · api.js 218 · SegmentedControl 63 ·
  projectLogistics.js 527 · ScopeChangeDialog 1,174 (grew with 4.2 ripples + removal button).
  Suggestion (M12-class): ScopeChangeDialog's removal-flow branch could be extracted when next touched. No action now.
- State management: local component state + api module, house pattern. Nothing messy accumulated.

### §4 Housekeeping

- `npm run gate` exit 0 (evidence in §1 above). `npm run audit` inside gate: 0 unexempted; gate itself flags
  2 stale exemptions for cleanup (GHSA-qwww-vcr4-c8h2 · GHSA-2v37-7h3g-55p8) — debt candidate.
- git status: clean except this findings file (expected). No `+console.log` lines in the whole src diff (grep 0).
- Micro-guide: no step left 🔨; status header stale ("Active step 4.1 / phases 1-3" while 5.1 done) — fix at persistence.
- Seed-refresh routine documented: do-not-touch.md:89-90 ✅ · STATUS 2 mentions ✅ · micro-guide §1+1.5 ✅ (⑥3 requirement met).
- LOG narrative measured: 685 lines vs target ≤150 ⇒ compaction owed THIS session (persistence 2b), archive first.
- Plans check: docs/plans/{attic, handoff-2026-08-07, ideas-backlog, synthetic-monitoring-skill-brief, two-weeks-2026-08-06} ·
  mega-plans/regin_workflow_short_updated.md. None chartered to die at M5 close; two-weeks-2026-08-06 mentions M5 in an
  outdated schedule (pre-Discovery) — flag as stale-plan candidate for attic, not a close item.
- Schema drift spot-check: live logistics columns/CHECKs/policies match docs/schema.sql expectations (verified via
  information_schema + pg_policies above; schema.sql refreshed at 1.6 and 4.3).
- src/CLAUDE.md deny-all list (line 292) lists only salary_reports (+login pair) — MISSING project_changes,
  which is live RLS-enabled-zero-policies (deliberate: DEFINER-only access via list_project_changes/apply_scope_change).
  Doc gap, fix at persistence or §7.

### §4d Answerable-later

- (א) repeated-action overwrite: notes overwrite by design (hers); no resend-like action. Clean.
- (ב) transition times: M5-8 answers the known questions — live: ordered 2/2 with expected_arrival_date,
  ready 4/6 with actual_arrival_date (the 2 missing = pre-M5 legacy rows, renders `—`, declared). `ordered_at`
  deliberately not added (guide 🗡️, reopen trigger = M11 lead-time question). Clean.
- (ג) journal keys: project_changes keyed by change_id+project_id with price/cost snapshots; removal rider row
  verified in seed round-trip. ㉗ class registered `🚧 מ11 ← מ5`. Clean.
- 🔮 answerable-later — אין (all three probes verified with live queries, no new gaps).

### §4b Duplication / dead code

- jscpd: 15 clones repo-wide; involving this module's scope: (1) LogisticsPage[523-531]↔ProjectsPage[483-491] —
  9-line table-cell markup (event-name cell + ⏱); logic already shared (proximitySentence/formatDate/Ltr in lib);
  the clone is JSX skeleton of two different tables — intentional separation, record. (2) LogisticsTab[84-98]↔
  OverviewTab[49-61] — the house LoadingOrError-state skeleton family (OverviewTab clones with 5 other files),
  pre-existing pattern, not M5-born. (3) ScopeChangeDialog↔CancelProjectDialog ×2 — M6 dialog-footer boilerplate,
  pre-existing family. Verdict: no extraction recommended; all three families change independently.
- knip (deadcode): green, 1 css config hint only. lint: exit 0 in gate.
- Semantic should-be-shared hunt: queue derivations centralized in projectLogistics.js (SSOT held);
  no re-derived day-calculator/counter found (imports of businessDaysUntil/logisticsMetric verified by the
  build-time panel + gate). Clean.

### §5 QA matrix notes (as-run draft — final after smoke + evidence run)

- Unit: ✅ 1,436/55 exit 0 inside gate (this session).
- Integration (api.js write path, RPC error→Hebrew, revert-on-failure): ✅ unit-level 27+12 wrapper tests (2.2) + e2e S-2 test.
- E2E: 🔴 1 failed (projects.spec.js:122 — F-2/F-3) / 142 passed / 6 skipped (env-var skips: project-closing E2E-* subject,
  public-confirm live-row, empty-tab — all documented skip conditions).
- Smoke: pending this session's run.
- Regression: full suite named runs this session: gate ✅ · test:run (inside gate) ✅ · test:e2e 🔴(1) · smoke pending.
- Security: ✅ advisors 26=baseline · impersonated pos/neg controls re-run live this session · route-guard test in suite.
- UAT: ✅ 5.1 live journey (26/08 22:2X, restore verified field-by-field) + 3.4 🎨 review approved.
- Performance: N/A (≤ tens of rows; 🧱⑤ designed around) — unchanged from plan.
- Usability/Compatibility: 3.4 done; system-wide sweep = M12 (unchanged).
