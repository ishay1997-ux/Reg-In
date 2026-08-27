<div dir="ltr">

# CLAUDE_CODE_LOG — Claude Code's internal work journal
✅ אומת-סנכרון: 26/08/2026 00:2X (regin-docs-sync — 15 תיקונים, 0 קונפליקטים פתוחים. 🔴 **גבול החותמת:** נגזר מקבצים + git בלבד — **Supabase MCP היה ללא-אימות בהרצה הזו, ואף טענה לא נבדקה מול המסד החי**)

> This file is **not** for Ishay to maintain — it is for my (Claude Code) own creation and self-update between sessions, so context isn't lost. Ishay may read it, but keeping it current is my responsibility. Update it at the end of every meaningful session.
> Language: **English** (this is a Claude-facing file, like `micro_guides/` and the templates; Hebrew appears only as data — role/module names, UI strings, §7 refs, migration names). Other truth-sources not duplicated here: `docs/PROJECT_MASTER.md` (schema/permissions/screens + §7 open questions), `../CLAUDE.md` + the directory-scoped `CLAUDE.md` files (iron rules; the DB protocol lives in `supabase/migrations/CLAUDE.md`), `../STATUS.md` (module status board, Hebrew), `docs/guides/00_roadmap.md` (operational roadmap), `docs/archive/` (pre-28/07 full versions). *(`docs/CHANGELOG.md` was frozen 23/07/2026 — archive only, never written to.)*

## Maintenance policy (read before editing)
- **"Current State"** = a snapshot **rewritten** every time to reflect reality. Not append; never let it go stale. **No internal dates (rule F4, 09/07/2026):** a date inside Current State signals dated narrative leaked in (its place is the Session Log below). The snapshot answers "what is true now" briefly (**target ~15 lines**), not "what happened when"; dense details → reference sections / journal.
- **"Session Log"** = append-only, newest first. Detail budget: the 2–3 latest sessions in full · the next ones shortened to 1–3 lines · **a session older than 3 days that isn't among the latest 2–3 → merged into a weekly/thematic super-bucket** (header `### 📦 Week DD/MM–DD/MM — topic`), after migrating any evergreen fact to the reference sections · older/generic than that — one archive line, or deleted if all its evergreen facts already moved to the reference sections.
  > 📌 **OUTSTANDING DEBT — updated 01/08/2026 (dedicated compaction session, per Ishay's 31/07 ruling below).** The 29/07–30/07 mass this note originally flagged (measured 31/07 12:50 at 34 entries / ~325 lines, out of a 534-line narrative) is now compressed into `### 📦 Week 25–30/07/2026` (also folded in the two small adjacent 28/07 + 25/07 entries — both were already "older than 3 days" and mostly redundant with the Reference paragraphs). Every evergreen fact it carried was verified to already have a durable home (`module-3.md` §9 · `module4_smart_match_research.md` §11 · `PROJECT_MASTER` §6/§7 · the Reference paragraphs below) **before** deleting, not assumed — see the compaction session's report for the spot-checks. **Remaining debt, deliberately NOT touched this pass:** the 31/07 mass. It sits inside the 3-day freshness window (rule: keep the 2–3 latest sessions in full) and a parallel builder session was still landing entries into it the same night — compressing a moving target risks a rule-16 collision. Revisit once those entries age past 3 days.
  > **Ishay's ruling 31/07/2026 (why this needed its own session):** judgement work, not cleanup — "harvest before you delete" means a separate call per entry on which evergreen facts move to the reference sections first — and **Ishay cannot review the result** (English, written for Claude), so Claude is the only gate. Mitigation that makes it safe: **every compressed entry stays fully recoverable from `git log`**, so compaction here is reversible. *(This refines, and does not cancel, `module-close` step 💾2b ownership below: module close still guarantees it happens if a dedicated session never does.)*
- **Size self-check (measure before editing):** narrative = `awk '/^## Session Log/{f=1;next} /^## Reference/{f=0} f' docs/CLAUDE_CODE_LOG.md | wc -l` (target ≤150) · snapshot = the lines between `## Current State` and the next `---` (target ~15). `regin-docs-sync` measures and flags both on every run (measure-and-flag only). **The compaction itself is OWNED by the `module-close` skill, step 💾2b** (Ishay's ruling 31/07/2026 — the flag previously had no owner and the narrative reached 457 lines). Do NOT grant the routine compaction authority: "harvest before you delete" needs to know what the NEXT modules will need, which a memoryless routine run cannot, and its English output is unreviewable by Ishay — so a routine doing it would have no gate. Any session may of course compact when asked; module close is what guarantees it happens.
- **Realistic threshold (fixed F3, 09/07/2026): the journal NARRATIVE** (Session Log only — excluding the reference sections and Current State) **over ~180 lines → compress the old tail back toward ~150.** Never compress the 2–3 newest sessions or Current State. This is a *utility-and-cost* limit: the read tool reads 2000 lines/call, and when stuck, old narrative buries the knowledge. **The metric: bound the narrative, not the reference.** *(The old "whole-file ~250→~200" threshold was never honored — it counted the exempt reference sections and thus silently "overflowed" forever; the new threshold measures what actually gets compressed.)*
- **The trigger is measured on the whole file, but compression touches only the narrative.** If the file is large because the reference grew legitimately and the narrative is already minimal — that's fine, don't sacrifice reference to get under 250.
- **The reference sections (Gotchas / Tech-debt / DB / Templates-hooks) are exempt from the count and are never compressed** — they are the long-term memory for solving problems. Keeping them current is mandatory.
- **Golden rule — "harvest before you delete":** before shrinking a session record, every fact still relevant going forward (a debt, a DB/schema decision, an open flag, a solved gotcha/trap + how) **first migrates to the appropriate reference section**, and only then do you compress. That way shortening never loses useful knowledge. Compression is the ONLY way an old dated record changes (a deliberate exception to "never rewrite records").
  > 🔴 **The category that actually gets lost, measured 12/08/2026 — and it is NOT product facts.** After the `bf5b3fc` compaction, an agent audited the two ranges the compacting session itself flagged as rushed: **37 durable facts, 34 survived, 3 lost.** Every DB decision, §7 ruling, 🚧 debt and solved code-trap survived — **because those have obvious homes** (§6 · §7 · `db_roadmap` · a micro-guide's §9) and a harvester routes to them by reflex. **All three losses were the same species: a lesson about HOW WE WORK.** ("A running session does not see `CLAUDE.md` edits made after it started" · "import the practice, not the justification" · a threshold refined to *work*-days.) **They have no reflexive home, so they get read as narrative and deleted with it.**
  > ⇒ **Before compressing any entry, ask the harvest question SEPARATELY for this category:** does this entry teach something about how sessions, rules, prompts or tools behave — as opposed to what the product does? **If yes, its home is one of: `## Reference: Operational Gotchas` (mechanism + operational consequence) · `_shared/discipline.md` (a rule about evidence, anchors or what may justify a decision) · `_shared/writing-prompts.md` (instruction-craft) · root `CLAUDE.md` (a mine no loaded file carries).** ⚠️ **And the rule that makes this auditable at all: a compacting session MUST declare, in its report, which ranges it read fast.** That declaration is the only reason these three were recovered — the audit went straight to the two named ranges instead of re-reading 4,000 lines. **A compaction report with no declared blind spot is not a cleaner compaction; it is an unauditable one.**
- **Repeated routine records = first to shrink:** green runs of `regin-health-pulse`/`regin-docs-sync` ("all green"/"no drift") are merged into one rolling line (e.g. `health-pulse: green ×5, last 07/07/2026`), not a line per run. A run that found something stays standalone.

---

## Current State (snapshot — rewritten, not appended)
<!-- target ~15 lines · no internal dates (F4) · over budget? compress / move to journal -->

**Where we stand:** Modules **1**, **2**, **3**, **4**, **5** and **6** are closed and merged to `dev`; `dev` has been promoted to `main` and tagged `milestone-2.5`, so 1–6 are all live. The m5 as-built map: `docs/micro_guides/module-5.md` (§1 header + §10 log); its spec set `docs/specs/module_05_logistics/` (42 rulings ①–㊷); `db_roadmap` `M5-1`…`M5-8` all ✅. **Module 8 (finance) is the ACTIVE build** — branch `ishay/module-8-finance`, cut from fresh `dev`. Step **1.0 (Phase-1 door) is ✅ closed**: all 8 live re-measurements held with zero drift, MCP verified live, baseline **1,440 unit / 56 files exit 0**, `E2E_FINANCE_*` confirmed present. Standing at **step 1.1 — migration A written on disk and awaiting Ishay's typed-echo; NOTHING applied to the live project yet.** The plan: `docs/micro_guides/module-8.md`; the approved spec: `docs/specs/module_08_finance/` (its `spec.md §①` is the binding reading list, and the four hand-computed acceptance anchors in `§③3` are never recomputed from code). 🔄 **Standing routine: run the seed REFRESH on every demo morning** — the 02:00 cron closes the "today" demo project overnight; the seed never deletes. ⚠️ **The system is exercised in production ahead of the demo, so any test pinned to a live count/date/id keeps rotting** — the documented fix is runtime-condition invariants with denominator asserts, never new pinned values.
Two 1-line src fixes deliberately parked for immediately-post-merge (mailto-encode in QuotesPage · Select-uncontrolled in QuoteLineEditor — §6 line `🚧 מ10 ← מ3`): touching src after the certified regression would have voided the verdict's identity.
`docs/schema.sql` measure command: `grep -c '^create table' docs/schema.sql` (23 at the last audit).

**Governance:** single developer (Ishay). Schedule (re-ruled 12/08/2026, old `19/09` deadline cancelled everywhere): **28/08** interim presentation (10 min · one end-to-end process · ~50%) · **01/10** closing conference (target **100%**) · **20/10** end. Per-module schedule + dates SSOT: `00_roadmap.md` §3. Overflow policy: whole modules defer, nothing is trimmed — shock-absorbers are **M10 and M7 only**; the 3→4→6→5 core, M8 and M12 never defer.

**Quality gates:** `npm run gate` = verify+dup+knip+audit+check:bidi+check:context+check:docs-structure, all blocking. `npm run test:e2e` excludes the smoke suite (`npm run smoke`, separate); neither runs in CI.

**Context architecture:** `CLAUDE.md` is a thin root + directory-scoped files loaded on demand — `supabase/migrations/CLAUDE.md` (DB protocol), `src/CLAUDE.md` (security/SSOT model), `docs/CLAUDE.md` (iron rule 13 + emoji legend), `e2e/CLAUDE.md` (test gotchas), plus per-module `src/modules/NN_*/CLAUDE.md`. `STATUS.md` holds only live state; the module-status board there is the SSOT for what's open, not this file.

**Truth-source hierarchy:** `docs/schema.sql` (DB snapshot) → the approved module spec `docs/specs/module_NN_*/` → the frozen spec `reference_spec/C5_*`+`C6_*` → mockups → previous micro-guides. Future DB changes: `docs/db_roadmap.md`. Open questions: `docs/PROJECT_MASTER_sec7.md` (count via `grep -c '^[0-9]\+\. '`, never via `§7.N`). Cross-module debt: `PROJECT_MASTER §6` (`grep '🚧 מN'`).

**Stack:** React 19 + Vite 8 · JavaScript (not TS) · Tailwind 4 + shadcn/ui over Radix · Supabase (Auth + Postgres 17 + RLS) · react-router-dom v7 · full RTL · alias `@/`→`src/` · session in `sessionStorage`.

**Pointers:** module 6 detail → `micro_guides/module-6.md` · module 4 → `micro_guides/module-4.md` (🔒 closed) · module 3 → `micro_guides/module-3.md` · traps + tech-debt → the reference sections below · pre-16/07 history → `docs/archive/session_log_2026-07.md`.

---

## Session Log (newest first)

### 27/08/2026 19:4X–19:5X — everything in production; dead branches cleared; phase-2 branch cut

- 🚀 **Production is `c1a3306`.** PR #73 → `dev`, #74 → `main`, `dev`/`main` content-identical,
  Vercel `state=success`. **And the deploy was verified the way it has been all day — by fetching
  the live bundle and asserting its contents**, not by trusting the pipeline: it reads
  `hostess_languages(language)` and `hostess_bank_details(*)`, and **does not write the dropped
  parent column**. ⚠️ Same bundle hash as the previous deploy, correctly: N1b carried no `src/`
  change, only a migration and docs.
- 🧹 **Seven merged branches deleted, remote and local.** Each was measured first
  (`git rev-list --count origin/dev..<branch>` ⇒ 0) rather than assumed, and **every SHA was
  recorded before deletion** so any of them is recoverable: `module-8-finance` `e41be2b` ·
  `module-8-c2-and-n1` `3593bf9` · `module-8-n1b` `5e0bf45` · `fix-flaky-checklist-focus`
  `c3b2eaf` · `module-5-logistics` `3822a47` · `post-merge-m5-flip` `89f830b` ·
  `reconcile-main-into-dev` `8e63da9`. **The remote now holds `dev` and `main` only.**
- 🌱 **`ishay/module-8-phase-2` cut from fresh `origin/dev` (`ed353bc`)**, with the fresh-vs-dead
  discriminator run at cut (`git log origin/dev..HEAD` ⇒ empty ⇒ fresh, not merged).
- **The day's ledger:** phase 1 (ten migrations + the 1.8 gate) · `C2` — ה19 closed · `N1`+`N1b` —
  normalization complete · one flaky test fixed with a mutation proof. **One debt remains and it is
  not m8's to build: `N2`, after the 28/08 presentation.**

### 27/08/2026 19:3X — N1b applied: the normalization is complete

- ✅ **`hostesses.languages` dropped. The languages package (N1 + N1b) is closed**, and so is C2's
  ה19 earlier today. **Two of the three registered schema removals landed on the same day; only N2
  remains.**
- 🔑 **The closing measurement is the one worth keeping, because it is checkable in one query rather
  than believed: `data_type = 'ARRAY'` across the whole `public` schema now returns ZERO columns.**
  The single 1NF violation the normalization scan found is gone.
- 🔴 **Regression after an irreversible drop:** `smoke` **exit 0** · `hostesses.spec.js` +
  `smart-match.spec.js` **32/32**. `docs/schema.sql` updated the same minute and re-cross-checked —
  `hostesses` **15 documented / 15 live, zero divergence**.
- **The safety net touched 0 rows, exactly as measured beforehand** — which is the point of
  measuring first: the net exists for the case that did not happen, and its narrowness is what made
  it safe if it had.

### 27/08/2026 19:2X — C2+N1 in production; N1b written and gated

- **Merged and promoted:** PR #70 → `dev`, the flaky fix #72 → `dev` (`4b9f7af`), PR #71 `dev` →
  `main` ⇒ **`008b037`**, content-identical. Vercel production `state=success`, and once again the
  claim was not taken at face value: **the live bundle `index-BPFpouI9.js` was fetched and asserted
  to contain `hostess_languages`.**
- **`N1b` written, dry-run, standing at its typed-echo gate.** Copy touches 0 · column 1 → 0 · 33
  child rows intact · a real hostess still reads `אנגלית · עברית` after the drop · 0 function
  bodies reference the parent column · rollback clean.
- 🔑 **The lesson of the day, and it is about NOT reusing a pattern that worked hours earlier.**
  C2's `updated_at` guard was right for a **1:1** relation where both tables carry `updated_at`.
  Reusing that shape for N1b would have been **wrong, and measurably so**: the relation is 1:N, the
  child has only `created_at`, and `hostesses.updated_at` bumps on *any* edit. 🔬 **The proof was
  sitting in the data:** my own announced phone probe at 19:0X made
  `max(hostesses.updated_at)` = 16:02Z newer than every child row (15:47Z) **while no language
  changed**. A C2-shaped guard would have re-copied from the frozen array and resurrected any
  language the new code had removed. ⇒ N1b's net is narrower on purpose: copy only where a hostess
  has a non-empty array and **zero** child rows — the one state with nothing to overwrite.
  **Twice today the fresh pattern was the wrong one to reach for** (the first was N1's permissions
  vs ה19's), and both times what caught it was asking *why* the earlier decision was made.

### 27/08/2026 19:1X — the flaky CI test fixed, with proof it is a flake and proof the fix still bites

- 🐞 **`ChecklistDialog.test.jsx` "שלושת האפקטים יחד" failed CI on the push to `dev`**, minutes after
  the SAME code passed the pull-request run. 🔑 **Same SHA `7eba407`, one run failed and one
  succeeded** — no code difference is possible, so this is a flake, proven rather than argued.
  It had already failed once locally earlier today under CPU contention.
- **Cause:** focus restoration happens in an effect **after** the re-sort (`ChecklistDialog.jsx`
  `focusRef` effect), and the test asserted `document.activeElement` **synchronously**. Under load
  the assertion ran before the effect committed, and `activeElement` was still Radix's dialog close
  button. **Fix: the focus assertion now `waitFor`s, exactly like the row-order assertion two lines
  above it.**
- 🔴 **And it is not a softening — proved, not claimed:** disabling focus restoration in the
  component made the test fail again, exactly one test and the right one; the component was then
  restored byte-identical. A genuinely broken focus restore still fails, now by timeout.
- **Why fix module 5's test at all, mid-m8:** a gate that goes red at random is worse than no gate —
  it teaches everyone to ignore it, and there is a presentation tomorrow with another merge (`N1b`)
  still to come.

### 27/08/2026 18:0X–19:0X — N1 applied and the client rewired; gate green at 1,454

- ✅ **N1 additive half applied, client rewired, gate exit 0 at 1,454 tests** (up from 1,446).
  33 rows / 20 hostesses / 5 languages, 2 policies, RLS on. 🔑 **The count is the weak claim, so the
  one relied on is different: `mismatched_hostesses = 0` — every original array reconstructs
  EXACTLY from the child table.**
- 🔴 **Impersonated read matrix, positive control first:** גיוס / פרויקטים / מנכ"ל = **26 hostesses
  and 33 languages** · כספים / לוגיסטיקה = **0 and 0**. The language count tracks the hostess count
  one for one for every role — the mirror is proven rather than asserted.
- **Two files changed, and the two SCREENS deliberately not touched.** Ishay caught the gap between
  what I said ("2 files") and what I did, and he was right to: the "2 files" was the count of
  *consumers* of `languages`, not of files I would edit. The split lives in `api.js`, so
  `hostess.languages` is still a plain array to the screens — the same call the bank split made, and
  it keeps the lowest-auto-coverage write surface in the repo untouched. My wording was the error,
  not the work.
- 🔴 **Two mutations, both proved red, file restored byte-identical:** treating a missing
  `languages` field as `[]` (which would have wiped a hostess's languages on **every phone edit**,
  silently) · reversing insert/delete (the `src/CLAUDE.md` rule that has already destroyed live data
  once here).
- **Live in a connected browser**, the narrow announced-and-restored exception: the card read
  `שפות · אנגלית · עברית` from the child table · **editing only the phone left both languages
  intact** · phone restored and the restore verified in the DB · 33 rows unchanged · zero console
  errors.
- **`docs/schema.sql` re-synced and re-measured:** 28 tables (all RLS) · 45 public + 12 storage
  policies · 43 functions · **271 documented columns minus 9 parser artefacts = 262 = live**.

### 27/08/2026 18:0X–18:4X — N1 additive half written, standing at its typed-echo gate

- **`N1` written** (`20260827183845_module8_n1_hostess_languages_additive`): `hostesses.languages`
  (`text[]`) → `hostess_languages`, 1:N. Ishay approved the package earlier today and, asked to pick
  between "additive tonight, drop tomorrow" and the full cycle tonight, said **"בצע לפי המלצתך"** —
  the full cycle. Additive half first, as always.
- 🔴 **The decision worth keeping: N1's permissions are the OPPOSITE of ה19's, on purpose.** The bank
  split was a **security** measure and its child table got **narrowed** policies. N1 is
  **normalization only** — language names are not sensitive, and anyone who can see a hostess should
  see her languages. So its two policies **mirror `hostesses`' own one for one**, measured live from
  `pg_policies` before writing rather than copied from the fresh C2 pattern.
  ⚠️ **Reusing C2's shape unthinkingly would have narrowed access and broken readers silently** — a
  missing policy returns an empty list with `error: null`. The pattern in my head was the wrong one
  to reach for, and the only thing that caught it was asking *why* the earlier split was narrowed.
- **Two design calls, both stated in the file:** composite PK `(hostess_id, language)` so duplication
  is impossible by definition (the old array accepted `{'עברית','עברית'}`); and the index on
  **`language`**, not `hostess_id` — the PK already leads with the latter, while "who speaks Arabic?"
  has no index without it.
- Measured first: 26 hostesses · 0 NULL · 6 empty arrays · 20 with languages · **33 language rows** ·
  five distinct values.

### 27/08/2026 16:5X–18:0X — MODULE 8 MERGED, IN PRODUCTION, AND ה19 CLOSED (C2 applied)

- ✅ **C2 applied on Ishay's typed echo — ה19 is CLOSED.** The three bank columns are gone from
  `hostesses`; bank details now live only in `hostess_bank_details`, readable by 'דיילות' and
  'כספים' alone. **Until today every holder of 'דיילות' could read every account number**, because
  RLS gates rows, not columns. That was the exposure, and it is shut.
  **Measured after apply:** 0 legacy columns · **26/26 rows intact** · **0** hostesses left with an
  empty bank triple · a real hostess still reads her line through the new table.
- 🔴 **Regression run immediately after an irreversible drop — the moment things break silently:**
  `npm run smoke` **exit 0** and the full `e2e/hostesses.spec.js` **20/20**. Nothing broke.
  `docs/schema.sql` updated in the same minute and re-cross-checked: `hostesses` **16 documented /
  16 live, zero divergence**.
- 🔑 **The guard added to C2's contract four hours earlier paid off, measurably.** All 26 child rows
  were NEWER than their parent, so the originally-registered unguarded `on conflict do update` would
  have touched all 26 and pulled them back to the stale source. With the guard the copy touched
  **0 rows**. A contract defect found by reasoning about the deploy window, and confirmed by the
  numbers when it ran.
- ⚠️ **And an alarm on the way that was chased to the end rather than waved off:**
  `generate_salary_report` mentions `bank_*` — line-by-line it reads them from
  `left join public.hostess_bank_details b`, the new table, not the parent. Clean, and checked
  before the irreversible statement, not after.

### 27/08/2026 16:5X–17:5X — MODULE 8 MERGED AND IN PRODUCTION; C2 written and gated

- **Merged and promoted on Ishay's explicit approval** *("ויש לך אישור להתקדם ולמזג")*:
  PR #68 → `dev` (`518587d`), PR #69 `dev` → `main` (**`9e07233`**). `dev`/`main` content-identical
  (`git diff` = 0 bytes). CI **5/5 green** on both, checked on the run itself — never `gh pr checks
  --watch` on the queue, which reports green while still queued (the 12/08 mine).
- 🔑 **"Deployed" was not accepted as a claim.** Vercel reported `state=success` for production —
  and then the live site's own JS bundle was fetched (`index-B7qWDbqi.js`, 2,662,504 bytes) and
  asserted to **contain `hostess_bank_details`**. The first is a statement about the pipeline; only
  the second is a statement about what the browser receives — and C2's safety depends on the second.
- **C2 written, dry-run in a rolled-back transaction, standing at its typed-echo gate.** Copy
  touched **0 rows** · bank columns **3 → 0** · 26 child rows intact · a real hostess still reads her
  bank line through the new table **after** the drop · **rollback verified**.
  🔑 **And the guard I added to the contract this afternoon earned itself here:** all 26 child rows
  are newer than their parent, so an unguarded `do update` would have touched all 26 and pulled them
  back to the stale source. Measured, not argued.
  ⚠️ One alarm chased to the end rather than waved off: `generate_salary_report` mentions `bank_*`,
  but line-by-line it reads them from `hostess_bank_details`, not the parent.
- 🔴 **Three register defects found because Ishay asked "how will I remember?" — measured, not
  answered.** ① the session-start banner was stale by two days and two modules, and it is what every
  fresh session is handed as fact ② `supabase/migrations/CLAUDE.md` pointed at **§10 and a
  sub-heading that does not exist**, so a session obeying it lands in the Done list and concludes
  there are no pending removals — the pointer never once pointed correctly ③ `PROJECT_MASTER §6` had
  **zero rows** for C2/N1/N2. All three fixed, and §6 now says out loud that `grep '🚧 מN'` cannot
  find these in time because none of them waits on a module — they wait on a **deploy**.
- **Recommendation on record, and Ishay may override:** N1 (10 occurrences / 2 files) is small and
  is the same shape as today's bank split. **N2 is 46 occurrences across 16 production files plus a
  screen**, running through the quote→project→email chain — the thing the 28/08 presentation demos.
  Recommended after the presentation, said twice as promised.

### 27/08/2026 12:39–16:5X — MODULE 8 PHASE 1 COMPLETE: ten migrations live, 1.8 gate passed

- ✅ **All ten migrations applied and verified** (A · B · C · D · E1 · E2 · E3 · E3-fix · F · G),
  and the 🔻👤 **1.8 gate passed**. **All three currently-reachable hand anchors are produced by the
  code itself:** profit **3,650.00** · cancellation fee **3,508.00** · salary line **292.60**.
- **Battery, reported per suite on purpose** — `test:e2e` carries `--grep-invert בדיקת-עשן`, so a
  single "E2E green" line would be a false all-clear: `gate` **exit 0** (1,446 unit / 56 files) ·
  `test:e2e` **143 passed / 6 skipped / 0 failed** · `smoke` **exit 0** · browser walkthrough of the
  three production surfaces with **zero console errors**.
- 🐞 **`gate` was RED first, and the cause was mine — kept because the failure mode is invisible.**
  Python's `io.open(...,'w')` on Windows rewrites newlines as CRLF; the repo is LF. Eleven files
  were contaminated. 🔴 **`git status` stayed clean and `git diff` stayed empty the whole time**
  (`core.autocrlf` normalises before comparing) ⇒ no signal until `format:check` fell, and its
  message says "code style", not "line endings". **The committed blobs were always LF, so CI would
  have stayed green** — only a local gate could catch it. Mine written into root `CLAUDE.md`.
- ⚠️ **One flake, diagnosed rather than waved away.** A mid-gate re-run showed 1 failed / 1,445
  passed — `05_logistics/ChecklistDialog.test.jsx › "הצלחה רגילה — שלושת האפקטים יחד"`, which
  asserts **focus** after a sort jump. Alone the file is **34/34 exit 0**; the failing run had a dev
  server competing for CPU (vitest reported `environment 629.53s` vs **1.53s** in isolation), and
  with the server stopped the gate is **1,446/56 exit 0**. Not a regression, not m8's — but that
  test is timing-sensitive under load and someone will want this the day CI goes red on it.
- 🔴 **Four real gaps in `docs/schema.sql`**, found by cross-checking 54 m8 identifiers against the
  live catalog rather than skimming: a whole live table missing (`feedback_rpc_calls` — 26 blocks
  for 27 tables), a **dropped function still listed as live** in §24 twelve lines above the note
  saying it was dropped, a stale deny-all count, and a refresh header that stopped at E2. All fixed.
- 🔴 **A defect in C2's own registered contract**, the debt m8 still owes. `insert … on conflict do
  update` was unqualified. The deploy window runs in **two opposite directions** — before it,
  production writes the parent; **after** it, m8's `api.js` writes only the child. So the unguarded
  overwrite fires **after** the deploy and pushes stale parent values over fresh child rows: the
  same data loss the re-copy exists to prevent, reversed, landing as wrong bank numbers in a CPA
  salary report. Guarded on `updated_at` in both registers; N1 inherits it.
- **Deploy rule re-run as a command, not recalled:** `set_project_finance_fields` has **zero call
  sites on `origin/main`** · the three bank columns are **still written and read there** ⇒ C2 keeps
  waiting · `hostess_bank_details` is **unknown to `origin/main`**, which is why the live site works.
- **§7 write-back:** `§7.69` got a dated ↳ — the DB now holds `22.60` where the item's text says the
  amount was never set. **Status unchanged; CPA verification before M10 stands in full.** `§7.20`
  needed nothing: it already names `תנאי_תשלום_ימים` default 30, exactly what G seeded.

### 27/08/2026 12:39–16:0X — MODULE 8 phase 1: steps 1.0–1.6 closed; G written, phase nearly done

- **Step 1.0 (👤 phase door) ✅.** Branch `ishay/module-8-finance` cut from fresh `origin/dev`
  (`585ad27`) after verifying m5 really merged. **All 8 live re-measurements held — zero drift
  since the 26/08 blueprint**, so no pre-emptive guide rewrite was needed. Baseline **1,440 unit /
  56 files exit 0**. MCP verified live (T11 closed — it had been unauthenticated at blueprint time,
  which is exactly why every §2.9 claim carried a 26/08 date and needed re-measuring).
- 🔴 **A risk the blueprint never carried, raised at the door: the 28/08 interim presentation is
  TOMORROW**, and Phase 1 drops 7 migrations on the live project — four of them touching merged,
  demoed code. Recommended the safe split (only the additive A+B today); **Ishay ruled
  `הכל היום, כרגיל`** and that stands. Mitigation actually added: a reported regression after every
  step that touches merged code, no silent progression past a red one. He also picked **`חסכוני`**
  (one sequential session, no agent army) for Phase 1 — matching the guide's own recommendation,
  since typed-echo gates serialize the work anyway.
- **Steps 1.3 and 1.4 closed in BOTH halves.** The m4 bank rewire shipped — and the split lives in
  `04_hostesses/api.js` alone, so the hostess form itself was never touched; only the view card
  changed, by one line. Proven in a credentialed browser: loaded from the child table, saved,
  re-read after a full reload, rendered on the card, restored, restore verified in the DB. The
  6 new unit tests were red-proved (broke `splitBankFields` ⇒ exactly 2 went red). `send-email`
  deployed at v6 and certified by 5 real calls — zero mails sent, `email_log` unchanged at 33.
- **E1 applied — the money SSOT + both readers + the F16 ripple into merged m6 SQL.** The headline
  verification: **m6's own hand anchor, project #8, still returns 5,355.00 digit-identical** after
  its function was rewritten. #15 moved 6,060 → 5,985 exactly as the reviewer predicted, which is
  the *point* — m6 and m8 now report one revenue instead of two. No test pinned the old value.
- **E2 applied and verified by two complete journeys run inside rolled-back transactions**, so real
  projects were exercised and nothing persisted. *(The report had to travel inside the rollback
  exception's message — a rollback destroys any result table. Worth remembering as a technique.)*
  Archive froze **230.00**, identical to what E1's reader computes live for the same project, so the
  frozen number and the live number agree. The cancellation proposal returned **3,508.00** — the
  hand anchor, produced by the function itself rather than by a query written to match it. Billing
  alone did not freeze; the payment did, at 1,680.00. Status stayed `cancelled`.
- **F applied — the public feedback page, verified from the attacker's seat as well as the
  customer's.** The not-found answer for a wrong, empty and NULL token was **asserted byte-identical
  rather than eyeballed** (any difference is an oracle telling a token-guesser they guessed right);
  anon reading the tables directly gets 0 rows; and the rate limit was **proven by a 20-call loop —
  exactly 15 through, 5 blocked**, not by reading the code. T14 held: m4's `/shift/:token` has no
  limiter to copy, so the shape came from module 1's login counter, with a **separate** table so a
  customer refreshing the page cannot eat the login-attempt budget for that IP.
- 🔑 **A technique worth reusing, discovered under pressure:** these RPC families were verified by
  driving complete journeys on REAL projects **inside transactions that were then rolled back**,
  with the report carried out **inside the rollback exception's own message** — because a rollback
  destroys any result table. It is the only way to exercise irreversible writes against live data
  without leaving a trace, and it is how every gate in E2/E3/F was proven rather than assumed.
- 🔴 **Two real defects found today, both in my own code, and both share a shape worth naming: they
  were invisible in production and visible only to the checker.**
  **(1) E3's temp table** used `on commit drop`, so a second call in one transaction failed. Every
  Supabase RPC runs in its own transaction, so production would never have shown it — but this
  project verifies write functions by running them inside a transaction that is then rolled back,
  and the defect made the function **unverifiable by the only method available**. Fixed forward; the
  new body was extracted programmatically rather than retyped and proven a one-line delta.
  **(2) `archive_project` never checked that a low score had a reason.** It only became reachable
  when F landed: **the public feedback page has no reason field at all** — the customer gives a
  score and free text, and the reason is chosen by the manager after a phone call. So a customer
  could submit **2 with no reason** and the file would close **without the phone call ever
  happening**, against an explicit approved rule (*"עד אז אין ארכוב"*). Gate added in F.
  🔑 **The generalisation: a defect that production cannot show you is not a small defect** — it is
  one whose only witness is the verification, which is exactly why the verification has to be a real
  journey and not a shape check.
- **E3 written (not yet applied) — the salary transaction.** Its own migration because P4 crosses
  projects and months and pays people. 🔑 **The design fact worth carrying forward: the anti-double-
  pay mechanism is the SIGNATURE on the row, not a check** — which is also what makes a late-closing
  project ride into the next report with nobody remembering. And **Q-5 is the ruling most likely to
  be built wrong**: ה15 said "every unsigned row", which read literally would sign `declined` and
  `released` rows as permanent ₪0.00 lines in the accountant's document.
- ⚠️ **A same-day correction of ה15 that no mechanism would have caught, only a person's question:**
  its first wording collected from operationally-closed projects only — and **a cancelled project is
  never operationally closed**, so §7.16 compensation would have entered no report at all and those
  hostesses would silently not have been paid. Ishay's own "I didn't understand how compensation
  works against a cancellation" is what surfaced it.
- **E2 written (not yet applied): seven write actions + the explicit drop of m6's
  `set_project_finance_fields`** (zero call sites, measured). Its fee formula was likewise proven
  first: #14 ⇒ 30.0h before the event ⇒ 50% ⇒ 328.00 + 3,180.00 = **3,508.00**, matching `spec §③3`
  component by component, not just at the total.
- 🔑 **Before writing a line of migration E1, I ran the approved profit formula against live data:
  #13 ⇒ 3,650.00, digit-identical to `spec.md §③3`'s hand-computed anchor.** ⚠️ **And the anchor
  settled something no test I wrote myself could have caught:** the hostess quote line carries its
  own `closing_unit_cost` (300/unit). Counting it as goods gives 2,450, not 3,650 — so hostess-
  category lines are excluded from the goods term and labour comes from the assignment rows alone.
  **This is the whole argument for hand-computing acceptance numbers before the code exists**: a
  test authored beside the implementation would have encoded the same wrong reading and passed.
- 🔴 **A defect in the plan itself, found at the 1.3 gate and worth more than the migrations:
  migration C as written would have broken the LIVE site — today.** The plan (step 1.3 / 🛑 T3)
  says copy-then-drop the three `hostesses` bank columns in one migration, with the client rewire
  in the same step. **T3 reasons about the BRANCH's code. Production runs its own older copy, and
  there is ONE Supabase project for both** — measured: `git show origin/main:…HostessFormDialog.jsx`
  writes the columns at 217–219, `HostessViewCard.jsx:315` reads them, `.env.local` points at the
  same ref every migration this session went to. ⇒ the drop breaks the live hostess form from the
  instant it applies until m8 merges and deploys — days, with the **28/08 presentation** in between.
  **Split into C (create + copy + policies + relax NOT NULL, production untouched) and C2 (the drop,
  post-merge, with a re-copy-first contract).** Registered in three places — `micro_guides/module-8.md`
  §8.4 and §10, and `db_roadmap` §10 — because a debt with one home is a debt that gets lost.
  ⚠️ **Consequence stated, not buried: ה19 is NOT closed until C2 runs**, so §2.2's "✅ complete
  here" row for bank protection is false on merge day and the closing audit must check C2 itself.
- **Migrations C + D applied.** C shipped the ADDITIVE half of ה19 only: `hostess_bank_details`
  created, 26 of 26 rows copied, both ruled policies in place, and the three parent columns
  **relaxed but kept**. **The decisive proof that the split worked: an INSERT, an UPDATE and a READ
  shaped exactly as `origin/main` performs them — against the parent columns — all succeeded.**
  (First attempt at that probe failed on a missing `city` value — my probe's bug, not the
  migration's; re-run clean. Worth recording: a verification table that looks green while its one
  decisive row never actually ran is the failure mode, not the exception.) D widened `email_log`'s
  CHECK to 6 and added the 4th per-module policy. Suite **1,440/56 exit 0** after both.
- 🔴 **A claim I wrote into migration D's why-header was disproven by my own verification, and the
  file is append-only, so the correction had to be re-homed.** I wrote that the finance manager
  would see "only her two m8 rows". She sees **8** — quote mails and project mails — because **RLS
  policies are PERMISSIVE and OR together**, and she already qualified through two existing
  policies via her `view` grants. **A new tightly-gated policy can only ADD to what someone sees,
  never subtract.** Nothing broken; the SQL is right and the sentence was wrong. Correction landed
  in `docs/schema.sql` (beside the four policies AND in the header conventions) and in the guide.
  **Generalise: when reasoning about who sees what, count every policy on the table, not the one
  you are adding.**
- 🔑 **The generalisable lesson, and it is not "check main":** every migration this project applies
  goes to the SAME database the deployed site is using, while the deployed site runs code from a
  DIFFERENT commit. **So the real question before any destructive DDL is not "does my branch still
  compile" but "what is `origin/main` doing with this column right now".** Nothing in the guide, the
  🛑 table, or the DB protocol asks that question today. Additive DDL is immune; `drop`, `rename`
  and `not null`-tightening are not.
- **Migration A applied** (`20260827125155_module8_finance_tables_and_columns`), typed-echo
  received. `project_finance` child table + `projects.invoice_sent_at`/`feedback_token` +
  `assignments.released_from_status` + the C-1 index + the ה30 `quote_services` tightening.
  Every assertion measured impersonated with a positive control first; advisors 26 = baseline;
  post-apply suite 1,440/56 exit 0, unchanged.
- **Migration B applied** (`20260827131033_module8_salary_report_document_model`). `salary_reports`
  run → document: `period` (UNIQUE + first-of-month CHECK) closes §7.40ג's double-generation hole,
  `send_status`/`total_amount` added, the two NOT NULLs released (T4), and its first policy ever.
  New `salary_report_lines` — the frozen signed snapshot, identity+numbers only, **no bank columns**
  (B-4), every FK RESTRICT both ways (T19) with a covering index each. **Both behaviours proven by
  writes that actually failed, not by reading DDL:** a second report for the same month →
  `unique_violation`; a mid-month `period` → `check_violation`. Advisors **26 → 25** — the finding
  that left is `rls_enabled_no_policy` on `salary_reports`, **the last business table that was
  deny-all for want of being built.** The three that remain are deny-all by design. 🚧 the
  `supabase/migrations/CLAUDE.md` section "טבלה חדשה בשימוש ראשון" still names `salary_reports` and
  is now stale — flagged, deliberately not edited (another file's surface).
  Suite after: **1,440/56 exit 0**, unchanged. Also struck `db_roadmap`'s §7.40ג row, which had read
  *"אין לסמן את השורה כבוצעה"* since 12/08 — the four-unique-constraints item is now 4/4.
- 🔑 **Two guide facts were WRONG and only measurement caught them — both are the "a written rule
  is not a working rule" species.** ① 🛑 **T1 named the wrong mechanism**: it said a CHECK blocks
  `cancelled → finished`, but the live `projects_closed_needs_report` body never mentions
  `cancelled` — it requires `summary_report_url IS NOT NULL` for three statuses. Same conclusion,
  different mechanism, and it changes step 1.5: `archive_project` must assert that precondition
  itself or a legitimate archive dies on a raw CHECK instead of the Hebrew `P0001` contract.
  ② **§2.7 claimed `E2E_FINANCE_*` was "not configured"** — a 29/07 fact carried forward unverified
  into a 26/08 guide; the pair exists, and a 👤 question to Ishay would have been raised for nothing.
- ⚠️ **Operational lesson worth keeping: a fact inherited from another document ages silently, and
  the guide gives it the same authority as a fact it measured itself.** Both defects above were
  inherited, not invented — one from a 5-week-old micro-guide, one from a paraphrase of a
  constraint nobody re-read. **The cheap defense is the one that worked here: the phase door's
  re-measurement list.** Its value is not confirming what held (all 8 did) — it is that running it
  at all is what put eyes on the two that had not.
- Found while cross-checking `schema.sql` against the catalog: its §24 heading said **"25
  functions" while listing 26** — stale before this session, corrected along with the header's
  table/policy counts (24 / 38 public + 12 storage).
- **Deferred with Ishay's approval ("לתקן, אבל לא עכשיו"):** `micro_guides/module-5.md`'s **Active
  step** and **Branch** rows still read "pending typed-echo" / "NOT merged" while its own Status row
  says MERGED. Parked as an open item in `STATUS.md`.

### 27/08/2026 12:2X–12:3X — PRODUCTION PROMOTED: dev → main (PR #66), tagged `milestone-2.5`; the #63 divergence root-fixed

- **Ishay's word ("מעולה מאשר למזג") executed:** PR #66 merged after its CI went green on the
  reconciled dev head; verified with fresh git evidence — `dev` is an ancestor of `main`, the
  verdict commit `3822a47` is in `main`, main head = `6a387f5`; live site returns HTTP 200.
  **Tagged `milestone-2.5`** (joins milestone-1/-2; the tag belongs to the version presented —
  roadmap §4's M2.5 row, satisfied a day early).
- 🔴 **Root cause found and fixed en route:** the first #66 merge attempt failed — **PR #63 (the
  #62 write-back) was merged to `main` only and never returned to `dev`**, so main carried 2
  commits dev lacked and every future promotion would conflict. Reconciled via a dedicated branch
  (PR #67, `8e63da9`): main merged back into dev, STATUS conflict resolved with dev's version
  after VERIFYING #63's sole content (one 21/08 banner entry) already exists verbatim in dev's
  chain — zero information loss. **Lesson for every future main-targeted flip: it must land on
  dev too, or the next promotion pays for it.**
- Three merged=dead branches await Ishay's delete click: `ishay/module-5-logistics` ·
  `ishay/post-merge-m5-flip` · `ishay/reconcile-main-into-dev`.

### 27/08/2026 01:0X–01:2X — MODULE 5 MERGED to dev (PR #64) + post-merge flip + three debts paid

- **Merge executed via Ishay's real Chrome on his explicit ask** (*"מזג לפי הנוהל בבקשה עבורי"* —
  the PR #62/#41 precedent): PR #64, 74 commits / 124 files, ALL checks green **by name**
  (Lint·Test·Build · Deno type-check · gitleaks · Vercel ×2). **Verified with fresh git evidence,
  never the browser banner:** `git merge-base --is-ancestor 3822a47 origin/dev` ⇒ yes; dev head =
  merge commit `0eb42a4`. Branch is merged ⇒ dead (rule 10); deletion is Ishay's click.
- 🔴 **CI gotcha caught en route:** `gh pr checks --watch` exited GREEN while the Actions run was
  still **queued** — at that moment only the two Vercel checks existed. Green-that-means-not-yet-run;
  the merge waited for `gh run watch` on the run itself. (Same family as the wrapper-exit gotcha.)
- **This flip branch (`ishay/post-merge-m5-flip`, cut from fresh dev) also pays three debts** under
  the standing "בצע הכל לפי המלצה שלך": the two `🚧 מ10 ← מ3` one-liners (mailto
  `encodeURIComponent` per the marketing.js house pattern · `QuoteLineEditor` controlled-from-birth
  `value={sku || ''}`) — deliberately AFTER the merge so the certified tree stayed untouched — and
  `🚧 מ12 ← מ4`(א) measured ALREADY-paid (the live SelectTrigger carries the aria-label with a
  12/08 dated comment; struck with evidence). STATUS row → ✅ merged; roadmap → merged.

### 26/08/2026 23:1X – 27/08/2026 00:3X — module-5 CLOSING AUDIT: blocker fixed · three rulings landed and executed · verdict [YES] pending the typed echo

**Round 2 (00:2X–00:3X) — Ishay ruled all three per the recommendations (*"בצע הכל לפי המלצה שלך
בלי לחסוך בעבודה"*), then asked the cross-module debts question; everything executed:**
- **C-2 ratified** → `projects.spec.js:122` now asserts the honest branch (new testid + byte-copied
  `TAB_NO_PERMISSION_SENTENCE`, old branch asserted absent) · the commit's leftover
  `exhaustive-deps` warning fixed · **write-back the 22:5X commits lacked = module-6.md entry S.**
- **C-3 built:** `STAFFING_HOLD_SENTENCE` amber banner in ChecklistDialog — fires exactly at the
  card's "נאמר בהודעה ברגע שזה קורה" moment (this save marked ready + all rows ready + project not
  ready), clears on any other save; wording `הנחתי`-delegated (§3.7 row). Red-proved (stash → 1
  failed → pop → green).
- **C-4 registered:** one `🚧 מ12 ← מ5` §6 line (glyphs · notes length-cap · irreversible-lens rerun)
  + O-7 guide row.
- **Carried items:** `customer-page.spec.js` pinned negatives → runtime invariant with a denominator
  assert (loud fixture-refresh failure, never vacuous green) · `.first()` conflict answered — the
  rule is runtime-condition selection; `.first()` AFTER a condition is fine, module-4's dated
  approval stands · dead GHSA waivers removed from `audit-gate.mjs` (pays `🚧 מ12 ← מ4`(ב), struck).
- **The debts sweep Ishay asked for (all §6, all modules):** THREE stale-open מ4 lines measured
  ALREADY-PAID and struck with evidence — the false-reassurance sentence (0 occurrences), 3 of the
  4 hook-enforcement failures (PM_LIVE strike-stripping · specs glob · awk doc all live), and the
  §2 table-count (fixed 21/08; last TOC remnant fixed now). The register was OVER-reporting open
  debt; nothing payable was found unpaid except two 1-line src fixes deliberately left for
  post-merge (mailto-encode · Select-uncontrolled — touching src would void the regression the
  verdict rests on) and the twice-registered LOG compaction this close's persistence pays.
- **Full battery after all fixes: gate exit 0 (1,440/56) · `test:e2e` 143 passed / 0 failed / 6
  skipped · smoke exit 0.** §6b re-scan of the round-2 diff (both lenses): clean — notable proof:
  the staffing sentence cannot lie (all-ready + active + not-ready ⇒ staffing-missing by the
  trigger's own formula). **Verdict [YES] pending the literal "לוגיסטיקה DoD" echo.**
- **The docs pass (his "תעבור על תיעוד הקבצים") COMPLETED 01:0X:** LOG narrative compacted
  **747→244** (archive first; 3 working-lessons harvested to Gotchas; Current State rewritten;
  2b′ fast-read ranges declared: the m8-day sub-bullets + the m6-arc one-liners) · guide compacted
  **1,716→1,005** (phases → as-built table; both carry-forward contracts verbatim; §3/§10/DoD/QA
  intact; archive `module-5_pre-compaction_2026-08-27.md`) · **40 dated `🔴 גובר` annotations**
  landed on the stale spec anchors by a dispatched agent and VERIFIED (original text preserved —
  mechanical per-cell diff; spot-checks; `check:docs-structure` 66 files / 0 findings) · roadmap 2c
  line (−15 days → the buffer, later modules NOT moved) · module gotchas file +3 close-mines ·
  routines coverage → 20 specs/modules 1–6 (the `E2E_LOGISTICS_*` myth corrected) · two-weeks plan
  → attic · debts sweep: 3 stale-open מ4 §6 lines struck as already-paid. **Awaiting only the echo,
  then: findings-file archive → STATUS row flip → pathspec commit (+`git add` for new files) → push
  → PR+merge via his Chrome (his explicit ask; PR #62 precedent) → post-merge flip.**
- **00:5X — the typed DoD echo received: Ishay typed `DoD5`** (module number + DoD — read as the
  module-5 signature; the interpretation was stated back to him, overridable). Recorded verbatim
  here + guide §1. Findings file archived (`docs/archive/close-findings-module-5_2026-08-27.md`);
  STATUS row flipped to 🔒 awaiting-PR/merge; closing commit follows (its hash = the verdict's
  identity), then push → PR → CI → merge via claude-in-chrome.

*(Round 1, original entry:)*
### 🅿️ round-1 record — audit ran end-to-end; one blocker fixed; frozen on three rulings

`module-close` in a fresh session, template executed in full. **Working file (NOT archived — audit
open): `docs/micro_guides/close-findings-module-5.md` — it IS the resume contract**, with the three
questions verbatim, per-blocker state and the completed-work ledger.
**artifact: published** (`claude.ai/code/artifact/17872adf-2da2-4e53-b570-87e79560c4a3`) ·
**quiz: asked** (3 questions at its foot, two of them doubling as decisions 1–2).
- **Green, all named:** gate ×2 exit 0 (1,438 → **1,439/56** with the audit's one new test) · smoke 0 ·
  RLS live stress-test (Dana 16-read/1-write · Noa 16/0 · Recruit 0/0, full recipe incl. role switch) ·
  advisors security 26 = baseline exactly · §2c security agent 0 exploits · spec-diff agent: zero
  deviations beyond one omission · live screenshots of both surfaces + M6 notes tab (pills on screen
  4·1·6 = the audit's own SQL derivation; values drifted from 3·1·5 with real usage, as ⑥3 warned).
- 🔴 **Blocker found AND fixed in the one round (C-1):** flush-on-close save failure was swallowed —
  RPC fails after the dialog unmounted ⇒ `aliveRef` early-return dropped the error; no toast, no
  console; the note evaporates under "כל שינוי נשמר מיד". The failure branch of the 26/08 Esc fix.
  Repair per the approved toast precedent: persistent error toast naming the item + S-2/server
  sentence; `onSaveSettledAfterClose` re-syncs the queue after late-landing saves. **Red-proved**
  (stash-fix → test fails → pop → green), full gate re-run exit 0. Changes UNCOMMITTED (frozen state).
- 🅿️ **The freeze (C-2, the load-bearing finding):** commits `030bee4`+`bde057a` (22:55–22:56) landed
  AFTER STATUS's 22:2X entry that lists both indication fixes as `⏸️ פתוח אליך` — no recorded nod, the
  LogisticsTab permission-gate documented nowhere, full e2e never re-run after them ⇒
  `projects.spec.js:122` red (pins the OLD testid/sentence; the screen now shows the MORE honest
  state). To Ishay as a record-gap question with a ratify recommendation, not an accusation.
  Plus **C-3** (card-promised understaffed-completion message unbuilt — spec-diff agent's omission
  hunt) and **C-4** (internal glyphs user-visible — flag, M12).
- **Self-review recorded in the findings file**; its headline: the dominant root cause is
  post-gate-window work missing its process tail (nod-record · e2e re-run · write-back) — C-2 wholly,
  and C-1's defect was born inside a post-gate fix no scan ever saw.
- **Deferred to the YES-completion of this close (numbered):** LOG compaction (narrative measured
  **685** lines vs ≤150 — archive-first + 2b′) · dated annotations on **19** stale spec anchors ·
  `src/CLAUDE.md` deny-all += `project_changes` · roadmap 2c line · STATUS row flip · findings-file
  archive · pathspec commit · PR instructions + 🧩.

### 26/08/2026 20:1X–22:5X — module 8 BLUEPRINT drafted, triple-verified, APPROVED & SAVED

Opened via the ⑥1 prompt (`module-blueprint` skill). **Deliverable on disk:
`docs/micro_guides/module-8.draft.md`** — the full 9-section guide (5 phases · ~7 migrations ·
a 🛑 table of 22 closed traps T1–T22 · a ruling-coverage ledger walking EVERY
`processes-approved.md` ruling to an owning step). **NOT yet approved — stays `.draft.md`;
nothing else was written to the repo** (STATUS/LOG entries excepted, per the Stop hook).
Presentation package (Hebrew, HTML artifact) delivered with **5 🛑 questions (Q-1…Q-5) + 6 nods
(N-1…N-6)** open on Ishay.

- **Three verification passes ran, in the template's order, ALL findings folded before presenting:**
  ① **simulated build** confined to spec.md §①'s reading list — 5 blockers (S2's awaiting-payment
  state never drawn · manual feedback entry undrawn · no navigation path to S3 · cancelled
  frozen-profit formula unstated · mail subjects unapproved), 5 conflicts (incl. change-list rows
  5/13 being PRE-ruling snapshots, and the spec's rate-limit "precedent" pointing at `/shift`
  which has NO limiter), verdict: the reading list alone is INSUFFICIENT (schema.sql · §3 matrix ·
  e2e sweep · products_and_params added to the guide's §2.8). ② **fresh-context reviewer**
  (+Contrarian/Outsider) — 11 findings; the loud ones: the `🚧 מ11 ← מ8` §6 line ALREADY EXISTS
  (draft planned to create it — cite-don't-duplicate), per-build-unit fields missing on Phase-3/4
  steps, the ה30 pointer aimed at a db_roadmap row that doesn't exist, `RatingStars` exists (census
  said "no precedent"), the ה30 regression tested the WRONG persona (מנהלת כספים is the only
  view-holder on quotes — her channel is what changes). Its denominator walk confirmed zero
  orphan rulings. ③ **execution rehearsal** — wrote ALL of Phase 1's SQL apply-ready on paper;
  3 red gaps: step 1.0 was tagged 🤖 while three of its duties are Ishay-interactions (retagged
  👤), ה22's four-action family lacks the regular-project bad-debt writer P3 approved (extended to
  five, disclosed — B-13), and the salary-collection population is unstated (→ **Q-5**, its
  "single most likely to build wrong": a literal ה15 reading would permanently SIGN a declined
  invite as a ₪0 CPA line).
- **Ishay rulings landed mid-session:** branch — blueprint saves on the m5 branch; the BUILD
  branch `ishay/module-8-finance` is cut by the guide's own step 1.0 AFTER the m5 merge (measured:
  `origin/dev` does not contain `docs/specs/module_08_finance/` — a branch cut today would be
  spec-less). ⑥2/⑥3 stay generic until approval, then rewritten in the m5 pattern (full text shown
  to him verbatim in the package).
- **Anchored self-closures worth knowing (all overridable, all in the draft's §3.3):** B-1
  מנהלת-פרויקטים sees no m8 surface (live §3 matrix: ➖ on 'כספים') · B-14 the §7.20ב credit-note
  flag's ONLY reachable trigger is a billed fee later waived/written-off (the live `cancel_project`
  refuses cancellation once `awaiting_invoice`) · B-15 feedback stays manager-editable until
  archive (else the <3 gate deadlocks) · F16 resolved by EXTENDING `list_projects_overview`
  (+Σ scope changes; m6's #8→5,355.00 oracle must stay digit-identical) · ✏️ spec §③3's 3,650
  anchor is mislabeled "רווח-צפוי" (it is the frozen derivation; data-set §2 documents the
  tension) — dated correction note lands at guide save, disclosed in the package.
- **What broke / stayed red:** nothing run — docs-only session; no code, no migrations, no commits
  (rule 16: STATUS/LOG carry uncommitted m5 lines; this session only appended its banner/entry).
- **22:40 — Q-1…Q-5 ALL RULED by Ishay per the recommendations** ("מאשר את חמשתן לפי ההמלצות") —
  recorded in the draft's §3.4 (the recommendation column is now the ruling column, dated+quoted).
  **His follow-up "do the migrations need updating?" answered by a walked check: NO** — all five
  land in RPC bodies/UI the plan already carries (Q-1/Q-2 UI-only; Q-3/Q-4 inside 1.5's freeze
  logic as drafted post-rehearsal; Q-5 resolves the collection-filter indirection the rehearsal's
  own SQL already used); zero table/column/policy changes. The ONLY still-open item touching
  Phase 1 is **N-4** (zero-amount rows — an override rewrites the 1.5 generation transaction),
  flagged in the draft. **Open on Ishay: N-1…N-6 + the blueprint approval itself → then save,
  ⑥2/⑥3 rewrite, pathspec commit.**
- **22:43 — BLUEPRINT APPROVED** (*"מבחינתי אחרי הבדיקה הזו יש אישור"* — read as covering
  N-1…N-6 too, stated to him as the interpretation, correctable). **Save package executed:**
  draft → **`docs/micro_guides/module-8.md`** (1,115 lines) with the approval stamped in §1/§3.4/
  §10 · step guide `module_08_finance.md`: ⑥1 marked done, **⑥2+⑥3 rewritten in the m5 pattern**
  (unique address block · 5 measured mines · the 1.0-cuts-the-branch flow), §④'s stale checkout
  instruction struck · `spec.md` §③3 got the dated ✏️ label correction ("רווח-צפוי"→"רווח-קפוא",
  the false "(טרם שובצו)" parenthetical fixed — disclosed pre-approval) · pathspec commit on the
  m5 branch (module-8.md + step guide + spec) — STATUS/LOG stay uncommitted (rule 16, m5 session's
  lines). **Next:** m5 close (⑥3) → merge → m8 build opens via the rewritten ⑥2; its step 1.0
  verifies the merge and cuts `ishay/module-8-finance` itself.

### 26/08/2026 19:3X–21:4X — post-gate on Ishay's word: removal becomes a CONTROL, the gate turns green *(compacted 27/08 — full text: guide §10 POST-GATE sections + the pre-compaction archive)*
All after the approved 4.5 gate, each on his word: ‏① removal moved from "type 0" to an explicit `הסר פריט` control (his question; ㊳ ruled ownership not mechanism; every destructive action here has a named control; derived state, 18 mutations red-proved) · ‏② the Esc-close note-loss found and fixed (input-device dependent: mouse saved, Esc lost — focus flushed before close propagates) · ‏③ the five module-4 fixtures rewritten as invariants (32 passed; three now stricter) · ‏④ `check:docs-structure` sharpened with three lookbehinds — gate green first time in two days; M8's correct file NOT rewritten · ‏⑤ two doc corrections owned out loud (Amit-guide "live" claim was MY false correction of a true sentence; do-not-touch's reversibility promise bounded by §7.44's own guard) · ‏⑥ error toasts no longer auto-dismiss (his approval; success still does).

### 26/08/2026 19:5X–20:2X — Q&A on `api.js` + M8's ⑥1 prompt fixed (`8df8e4c`) *(compacted 27/08)*
Teaching turn: the three-layer picture (api.js = DB I/O · lib = rules · components = render; ㉑ is enforceable because there is exactly one door; what api.js does NOT contain is evidence too). M8's ⑥1 carried a 9-vs-16 §7 list that drifted within two days — the list is gone, the prompt points at the register; M5's three paying practices folded in (🛑 table · coverage ledger · phase-1 SQL dry-run). The SessionStart-banner gotcha harvested to Reference: Operational Gotchas.

### 26/08/2026 16:4X–19:2X — M5 PHASE 4 COMPLETE (4.1–4.4) *(compacted 27/08)*
The three ruled forms built (notes full-width sub-row · `StatusTag` in the existing sub-line · dynamic zero-floor with byte-copied refusal strings, machine-verified 6/6) + the shared `FilterPill` tooltip fix. AR-4 amended in three sites; `🚧 מ5 ← מ6` items 1+7 consumed (pointer 16/16). `e2e/logistics.spec.js` (12) + smoke + a11y — 59 assertions red-proved; regression 1,420/55; the 5 e2e fails proven pre-existing (module-4 pinned fixtures) by a 27-file stash re-run. Wrapper-exit gotcha + the `1 יחידות` singular fix recorded in guide §10. Full as-built: guide §10 + `docs/archive/CLAUDE_CODE_LOG_pre-compaction_2026-08-27.md`.

### 26/08/2026 10:5X–20:0X — the parallel M8 Discovery: Stage 0 → CLOSE in one day *(compacted 27/08)*
`docs/specs/module_08_finance/` born complete (7 files + 3 evidence dirs) · 6 mockups approved ("מאשר את כולם") · 30 delegated rulings ה1–ה30 (each anchored+dated) · §7 register 16🟡→8🟡 with live re-counts · a 4-agent stage-1 review wave (42 findings, 42/42 landed after Ishay's "והכל סידרת?" audit caught 3 chat-only) · hand-computed acceptance anchors (3,650 · 3,508 · 292.60) · the outgoing-debt audit wrote the three ` ← מ8` supply contracts (מ11 · מ10 · **מ7**, the unsuspected third). Ishay's six field-reality catches are credited in the files (the §7.16-cancellation hole among them); the who-caught harvest went to `discovery_lessons.md`. Commits `1caa8b3`…`a2c6333`. Working-lesson harvested to Gotchas: untracked files never ride a pathspec commit.

### 26/08/2026 09:3X–12:3X — M5 phases 2+3 orchestration *(compacted 27/08)*
1.6 closed from disk (the phase-1 session died between commit and doc-flip — resume-from-disk caught the half-step). Ishay's three directives implemented: explicit per-agent reading lists · Workflow agent-army with adversarial read-only lenses (verifiers barred from mutating source and from trusting builder reports) · approvals front-loaded (O-1/O-4/O-5 + both experience-briefs, "מאשר את הכל" 10:29). Fresh-eyes reviewer caught 14 task-file defects pre-dispatch. Phase 2 landed (1,341 = 1,271+70, zero regressions, `40a978b`); phase 3 launched (`wf_fc693d3e`) and landed — both screens faithful, 4 conflict questions escalated not patched, Q1–Q4 triaged with Ishay ("מאשר לפי המלצתך"). Prompt-craft ruling → `_shared/writing-prompts.md`. Full detail: guide §10.

### 26/08/2026 — M8 step guide got the m5 prompt template (advisory session) *(compacted 27/08)*
⑥0 added (did not exist) · ⑥1 modernized (`d4dd9e9`) · parallel-Discovery timing recommended post-28/08; Ishay chose to run it same-day.

### 26/08/2026 02:0X — Ishay's ruling: `module-build` reads the ⑥2 block ITSELF at every activation *(compacted 27/08)*
A bare "תמשיך לבנות" had silently lost every address in the block. The ruling + the grep-anchor discipline live in the skill's Read order (`module-build/SKILL.md`); this line is a pointer.

### 26/08/2026 00:15–01:3X — M5 Phase 1 EXECUTED (1.0–1.5, then 1.6 next session) *(compacted 27/08)*
Migrations A–D applied serially under Ishay's one-time blanket typed-echo (quoted in guide §10) after he cleared the `apply_migration` tool block himself. Two-mode seed ran via the real quote→approve path (demo `#13/#14/#15` born with pointers+color; refresh = delta 0; removal rider proved both ㊱ refusals live). Israel-timezone "today" fix (`current_date` is UTC — measured; §7.56). Advisors 26/27 triaged; `schema.sql` refreshed. Full detail: guide §10 + db_roadmap strike entry.

### 26/08/2026 00:12 — `regin-docs-sync`: 13 fixes *(compacted 27/08)*
Loudest: the current-step line had rotted two whole modules behind (it feeds every fresh session's opening banner) · M6's board row flipped to merged (PR #41, git-verified). Supabase MCP unauthenticated — zero live-DB claims checked that run.

### 25/08/2026 — Module-5 blueprint written, triple-reviewed, APPROVED ("מאשר", 23:35) *(compacted 27/08)*
Triage round → simulated builder → fresh-context reviewer (19 findings) → execution rehearsal (15 gaps; the seed-idempotency BLOCKER ⇒ the Ishay-approved two-mode seed). 42 rulings · `M5-1`…`M5-8` · 4 ripples into merged code. The 🛑 gap table lives at the head of the guide's Phase 1; the seed-refresh demo-morning routine was set here.

### 📦 21–22/08/2026 — Module 5 Discovery: opened → approved spec set *(bucketed 27/08)*
Stage 0 measured live (no write policy · pointers 0/6 · no `actual_qty` CHECK · silent write to cancelled projects) → surface list M=3→**M=2** (removal moved to M6's dialog, ㊳; scope cut through the conference lens) → mockups approved against a five-process walk (7 actions · 2 screens · 0 orphans; three rulings ㉟㊱㊲ born from DRAWING, not reading) → `spec.md` behind Ishay's zero-unapproved-claims gate (96 claims audited → 2 → 0). The day's real products were three measuring tests: the zero-claims gate · source triage (6 of 41 questions actually his) · the simulated builder (38 guesses caught). Rulings ①–㊷ + 🧱 facts: `processes-approved.md`; evidence: `discovery-log.md`. Ishay's corrections en route: mockups=zero credibility · "מיגרציות זה לא פער" · the skipped surface-list approval.

### 📦 21/08/2026 — freshness sweep · post-close M3 fixes · discovery safeguards *(bucketed 27/08)*
Docs-freshness sweep (`ishay/docs-freshness-sweep`, later PR #62 → main): `DEV_HOME.md` rebuilt (32 broken links) · stale "מ5 בעבודה" corrected against git (branch existed, zero commits) · live-DB demo-data fixes (locked quotes deliberately left). Two real post-close M3 bugs fixed (`ishay/quote-time-bidi-fix`). M6's Discovery→build decision-loss root-caused → 3 safeguards into the skills (`ishay/discovery-blueprint-safeguards`). M6 ㊲ "latent bug" re-measured: correctly built all along.

### 📦 18–21/08/2026 — Module 6 build → close → merge arc *(bucketed 27/08)*
Phases 1–3 built across sessions A–E (panel-verified; ⑫ proven live: `#11 → ready` via M4's real UI + Noa's mail receipt) → closing audit **[NO]** with 3 fix-ready blockers → fix round → **[YES] + typed DoD echo** (21/08 00:30) → **PR #41 merged to dev** + post-merge verified with fresh git evidence. Same window: the Stop hook's single-writer assumption fixed (LOG/STATUS enforcement defers while background agents are mid-write). Full arc: `micro_guides/module-6.md` + its archives.

### 📦 Week 13/08–17/08/2026 — Module 6 Discovery finished and ruled (38 rulings, 8 approved surfaces); `module-discovery` skill built from the retiring prompt; module-6 blueprint drafted and rehearsed through 3 review passes before approval; Amit conference-prep guide built as a 28/08 fallback

Module 6's Discovery closed with 8 approved screens/mockups, 5 cross-module contracts, and 11 §7 items closed (`docs/specs/module_06_projects/`, `docs/PROJECT_MASTER_sec7.md`). The retiring `docs/guides/prompt_module_discovery.md` was rebuilt as `.claude/skills/module-discovery/` after a harvest-measurement, a fresh-eyes review, and a blind bake-off against a parallel rewrite (lessons: `docs/guides/discovery_lessons.md`, `_shared/discipline.md`). The blueprint (`docs/micro_guides/module-6.md`) went through a 15-agent reading fan-out, a fresh-context reviewer (8 blockers), and — the methodology fix that stuck — a new EXECUTION-REHEARSAL pass that found 41 gaps four other passes had missed; both the rehearsal step and the "§10 is append-only, route findings to their owning step" rule are now permanent in `.claude/skills/module-blueprint/template.md`, along with a mandatory decision-coverage back-check for spec-driven modules. Two DB gotchas that surfaced repeatedly are now written into `supabase/migrations/CLAUDE.md`: use `extensions.moddatetime` (not `public.`), and `revoke … from public` does not revoke `anon`'s default-privilege grant. Demo-date SQL updates landed to keep interim/conference demo data valid through both presentation dates. Amit conference-prep guide (fallback presenter, in case Ishay misses 28/08): `docs/guides/conference/amit-prep-guide.html`. Full narrative: `git log` on `ishay/module-6-projects` for this date range.

### 📦 Week 09/08–12/08/2026 — Module 4 (Hostesses + Smart Match) built end-to-end across 5 phases, closed [YES], merged to `dev` then `main` (live in production); `module-close` template redesigned from a fear-of-closing consultation; `regin-pr-gate`/`regin-docs-sync` hardened

Module 4 built Phase 0 (shared mail engine, generalized off the quotes-only original) through Phase 3 (UI, 13 UX findings fixed) in one continuous multi-session build, each phase gated by a real acceptance walkthrough or live-DB verification (RLS impersonation, fault-injection network blocking, real emails opened in Gmail). The closing audit (5.2) found and fixed 7 blockers — the sharpest was `releaseAssignment` swallowing a real mail-send failure and reporting success to the screen — verdict [YES], typed DoD echo signed 12/08. Merged via PR #24 → `dev`, then PR #26 → `main` (the app's actual production branch — the live site had been module-4-less for days, correcting an assumption that any `dev` merge auto-deploys). A same-night consultation traced Ishay's fear of closing to an unrelated early `quality-audit` run rather than `module-close` itself, and produced the one-fix-round rule (§6b), the collect-then-conclude findings-file workflow, and mandatory public/no-auth-surface + processes-doc-diff audit steps — all now permanent in `.claude/skills/module-close/template.md`. `regin-pr-gate`/`regin-docs-sync` were both found drifted from `package.json`'s real gate stages and fixed. A live regression (a `CREATE OR REPLACE FUNCTION` silently reverting a 31/07 fix) was found and fixed the same week the general rule — pull the live body via `pg_get_functiondef` before replacing a function — was written into `supabase/migrations/CLAUDE.md`. Full narrative: `git log` on `ishay/module-4-hostesses`/`dev` for this date range; findings archived at `docs/archive/close-findings-module-4.md`.

### 📦 Week 05–08/08/2026 — Module 4 Discovery closed (8/8 screens + Smart Match spec) → blueprint approved → build Phase 0; doc-architecture hardened (§7 split, STATUS 442K→41K); `advisor` + `skill-scan` skills built, `work-manager` retired

Evergreen facts already harvested to their SSOT homes as each session closed (rule 13/§9 discipline), so nothing below is the only copy: module-4 spec/rulings → `docs/specs/module_04_hostesses/spec.md` + `processes-approved.md`/`screens-approved.md` · Smart Match formula → `module4_smart_match_research.md §11` · schema/RLS/DB decisions → `db_roadmap.md` + `PROJECT_MASTER §6/§7` · skill mechanics + hook/tooling detail → the four Reference sections below and the skill files themselves (current). Kept here as the index:

- **05/08 08:04 — Module 3 merged to `dev`** (PR #10, verified 4 independent ways: fetch, log, merge-base, `gh`). `skill-scan` built (5 lenses + 3 brakes, validated over 9 paired runs, then caught its own author's measured-figure leakage) and `work-manager` retired — archived to `docs/archive/work-manager/` (10 files), two files rescued first into `_shared/parallel-sessions.md` + `_shared/writing-prompts.md`.
- **05/08 12:35–18:3X — `advisor` skill built v6→v13** in its own first live shift, every landed rule earned by a measured failure inside the shift itself: the opening filter-ranking axis was corrected against `PROJECT_MASTER §1`'s three filters (not "product vs meta"), and a false "≈20 unauthenticated MCP servers block schema checks" blocker was repeated three times before being measured false — a third, UUID-named Supabase server was live the whole time. PR #11 merged same day after two fresh reviewers found 6 defects in the Discovery prompt (3 created hours earlier).
- **05/08 19:30 — Module-4 Discovery opened** (stage 2 of the nine-step plan); read-only scope discipline held (zero product code, zero migrations, zero DB writes) throughout Discovery.
- **06/08 — All 8 Discovery screens drawn, reviewed and approved** (`docs/mockups/hostesses-screen/approved/`), plus the Smart Match research/mockup: hidden score + reason chips ruled with world precedent (Sidekicker/LinkedIn/Greenhouse hide the score; Ubeya is the lone counter-example, kept as the conference talking point); four named sort-angles ruled a deliberate deviation from the universal filter-heavy pattern, justified by the project's ~23-candidate scale (narrowing is pointless at that size). System-wide colour rule added to `PROJECT_MASTER §4`: fill-colour reserved for the one primary action or a real warning; neutral/positive facts get white+border. Shared `StatTile` extracted from two divergent implementations (module 2's grid+teal vs module 3's flex+neutral); module 2's form (label-above-value) became canonical, both modules migrated onto it, `src/CLAUDE.md` carries the mandatory-shared line.
- **06/08 — First whole-codebase `quality-audit` from a live shift** (29 agents, 4 streams) found the quote-PDF's per-line rounding doesn't always sum to the printed total (38.5% of a 4,480-quote sample) — **re-examined the same week and ruled intentional by Ishay**: whole-shekel display rounding is a legitimate choice, and a ±1₪ reconciliation gap doesn't signify against this project's real bar (presentation coherence, no live customer). Closed, not a defect. The same sweep flagged 5 RLS-enabled-no-policy tables (`projects`/`hostesses`/`salary_reports`/`assignments`/`logistics`) — since closed as M4/M5/M8 shipped their policies (see Tech-debt reference below).
- **06/08 — Handoff discipline hardened** after two consecutive post-compact catches came from Ishay, not the prompt: `next-session-prompt.md` gained a mandatory 4-part acceptance test (mechanical path-check · survivability source-tagging · judgement re-verify · factual questions answerable only from disk), a `Continues from:` chain line, and a 640K-context turn line (finish the card, commit, stop — never compact mid-card).
- **07/08 (early morning) — Dependabot's 8 auto-PRs all targeted `main` by default**; 7 were merged there before the base-branch mismatch was caught via `gh api .../base.ref`. No security/data risk (all green CI including gitleaks), corrected on a dedicated branch with Ishay's explicit approval.
- **07/08 01:53 — Milestone M2 reached:** `dev` → `main` (PR #13, tag `milestone-2`), after a GitHub Actions platform-wide outage (verified via githubstatus.com, not assumed) delayed the merge a few hours.
- **07/08 — Discovery→blueprint handoff gap closed:** `docs/specs/` had zero references across every skill (`module-blueprint`/`module-build`), meaning a Discovery-produced spec would never be opened by a build session. Fixed in `template.md`/`SKILL.md`/`_shared/writing-prompts.md`. Screens 1/2/4 re-checked against `processes-approved.md` for the same class of gap screen 3 had — 9 found, all already-ruled-elsewhere, all fixed with full write-backs.
- **08/08 — Module 4 `spec.md` written, Discovery stage 3 closed:** the hand-computed Smart Match regression anchor (`נועה 0.67 · מיכל 0.66 · דנה 0.64`) built and cross-verified by 3 independent fresh-context agents, surfacing 3 real DB-registry gaps (`projects.lat/lng` never registered anywhere, two fairness-lever numbers hardcoded instead of `params`, the exposure log never mentioned) and 2 wrong claims in the spec's own first draft, both caught only by grep. `docs/PROJECT_MASTER.md` split into itself (120KB) + `PROJECT_MASTER_sec7.md` (195KB) — both now under the Read tool's 256KB ceiling. `STATUS.md` archived 442KB→41KB the same day.
- **08/08 (night) — Two of three pre-blueprint blockers ruled by Ishay directly, the third via an `llm-council` run** that reversed the initial framing: `ready` ownership belongs to M6, not M4 — M4 derives the staffing metric at read time and never touches `project_status` (registered `🚧 מ6 ← מ4`). `docs/guides/module_playbook.md` written on Ishay's request — 26 verbatim quotes pulled from the repo's own record, organised by Discovery stage, as a reproducible how-to for future modules.
- **08/08 23:45 — Module-4 blueprint APPROVED and saved** (`docs/micro_guides/module-4.md`, 825 lines, commit `8ccfcbc`). Four Ishay rulings recorded (`email`/`city`/`bank_*` stay NOT NULL and the form stars all five; confirmation-mail contact = shift lead else project manager; travel param seeded `0`; `project_shifts` + the exposure log both deferred). `projects.customer_name` ruled as a snapshot column (same pattern `event_name` already uses) to fix a real blocked-permission null-join trap found live during the pre-approval measurement pass.

### 📦 Week 31/07–01/08/2026 — Module 3 closing: first whole-codebase `quality-audit` + 7 audit rounds (VAT guard, silent-catch blocks, rate-limiting, key/min-wage/email §7 rulings) closed; build steps 4.1–5.4 finished and merged (PR #10); `work-manager` skill born from live manager-shift use

Evergreen facts already in their SSOT homes: DB/security rulings → `PROJECT_MASTER §7` (§7.64/65/66/86 etc.) · recurring code gotchas → the Gotchas reference below · module-3 as-built → `micro_guides/module-3.md` §9. Kept here as the index:

- **31/07 04:2x — First whole-codebase `quality-audit`** (10 parallel reviewers, one dimension each, zero code/DB writes). Top findings, all fixed the same week: a missing `params` row could silently break 3 paths (PDF VAT, snapshot freeze, the expiry cron comparing against NULL — quotes never expiring while reporting success) · 3 `catch` blocks disabling safety nets built after real incidents (archive-warning, double-send guard, `AuthContext` silently degrading a working user to deny-all) · `register_failed_login` grantable to `anon` with no rate limit (account-lockout DoS, victim can't self-unlock) · the "generic" email engine hard-coded module-3-only assumptions, unusable as-is by M4/M8/M11.
- **31/07 09:2x–21:55 — Audit rounds A/B closed same day.** Round A (VAT guard): all three silent `?? 0` consumers fixed, proven failing-then-passing (8 tests red on regression, 24/24 green after). Round B: the 3 silent-catch blocks fixed with tri-state/explicit-null patterns instead of swallowed errors; a bonus fix stopped `AuthContext` ejecting a working user on a one-second network blip.
- **31/07 11:25–12:45 — Three M4 §7 rulings closed in parallel with another live session, zero collisions** (iron rule 16 working in practice): §7.64 (ת"ז → surrogate key, module-4's first migration) · §7.65 (hostess email uniqueness — ruled AGAINST the item's own stale default once its original justification had expired) · §7.66 (minimum wage — blocking DB trigger + form validation, `params.שכר_מינימום_שעתי=35`, booked `🚧 מ9` for a below-floor report).
- **31/07 14:45–17:55 — Fix-rounds D–F closed:** DB error messages now reach the screen (11 Hebrew-prefixed P0001 sites mapped to client copy) · an inactive product never silently zeroes a quote line · three stale code comments contradicting the code beneath them fixed, including one that had described the exact delete-then-insert ordering responsible for the 30/07 data-loss incident as "the convention."
- **31/07 16:30 — Round G (rate limit · cost-table split · bucket limits · description default) DONE.** `register_failed_login` capped 15/IP/hour (OWASP/Auth0-anchored, tested via a transaction-local `DO` block leaving zero permanent rows) · `products.cost` split into a child table with historical rows preserved · `docs/schema.sql` hand-patched surgically (Studio's auto-generate would have wiped its Hebrew comments) and verified column-by-column against the live DB.
- **31/07 16:35 — New skill: `work-manager`**, extracted from a full day of live manager-shift use (plan-critique against code, work review that runs tests rather than trusting counts). Measured at 237 lines (~2.9× the next-largest skill); a prune was drafted and deliberately declined in favour of growth-control instead.
- **01/08 (overnight, manager-directed) — Module 3 build steps 4.1 through 5.4 all closed:** approval-flow edges proven via a rolled-back SQL battery (7/7 DB guards) · E2E 44→66→71 · step 5.1's binding acceptance scenario (מדיטק, 300 guests, 6 hostesses) built live through the real screen, with `6,319 ₪` read back from the DOM before the irreversible approval fired · gate green including `knip`.
- **01/08 05:01 — Module 3 closing audit: verdict `[YES]`, typed-echo signed.** Nothing taken on trust — gate, 410 unit, 78/78 E2E (0 skips), DB counted before and after, RLS/triggers/cron/seed all re-verified fresh by a session that built none of it. Merged to `dev` the same day (PR #10, 303 commits).
- **01/08 10:42–12:42 — Same-day fix-round on manager-caught product gaps:** "עדכן ושלח" without changes no longer double-saves (a no-change-detection bug was silently resetting quote expiry) · "שמור ושלח" wired end-to-end (the send dialog was already mounted, just never fed a saved row) · a PDF BiDi glyph-drop regression caught by the manager's own full-document read after the builder's own automated tests had already gone green — the second time in the same night a full-document pass caught what an automated check missed.
- **01/08 — The quote-PDF per-line rounding mismatch surfaced by the whole-codebase audit was revisited and ruled intentional by Ishay** (whole-shekel display rounding, ±1₪ gap acceptable for a no-live-customer academic project) — closed, not a defect.

### 📦 Week 25–30/07/2026 — Module 3 Phase 3 (PDF · builder · quotes mgmt · email engine · prices) + Smart Match (M4) architecture research + context-architecture overhaul + quality tooling round 2

Evergreen facts already harvested to their SSOT homes as each session closed (rule 13/§9 discipline), so nothing below is the only copy: DB decisions → `PROJECT_MASTER §7` · module-3 as-built/deviations → `micro_guides/module-3.md` §9 · code gotchas → `src/CLAUDE.md` + `src/modules/03_quotes/CLAUDE.md` · Smart Match formula/architecture → `docs/module4_smart_match_research.md` §11 (self-contained build spec) · migrations 6–9 → `db_roadmap.md` §10 · context-tree split + quality-tooling roster → the two Reference sections below (already dated 28/07 and 23–29/07). Kept here as the index:

- **29/07 09:58–19:10 — Module 3 Phase 2 (money SSOT) closed; Phase 3 built through step 3.3** (PDF engine · quote builder · quotes management screen). TDD throughout; the `6,319 ₪` acceptance scenario exact end-to-end. Two silent PDF-render traps (fontkit TTF-only, bidi character-run reversal) and a Radix-picker onBlur/click race are permanent entries in `src/modules/03_quotes/CLAUDE.md`/`src/CLAUDE.md`. Two sessions collided on the branch (rule 16), resolved by evidence not assumption — led directly to the hook fix below.
- **29/07 19:30 — Migration 6:** 8th rejection reason `נפתחה בטעות` (corrects Ishay's own 12/07 "exactly 7" ruling), forced by the discovery that the DB **categorically refuses to delete a quote in any status** (the lock trigger blocks cascading delete too).
- **29/07 19:55 — Validation-message bug fixed:** the error map was `state`, so a corrected field kept its red message until the next save; now derived every render (cross-field rules made per-field clearing unsafe).
- **29/07 22:41 — Iron rule 16 hardened:** the Stop hook could not tell *which* session changed a file, only *that* it changed. `protect-frozen-files.sh` now records real per-edit paths; `check-docs-updated.sh` attributes staleness per-file. Reviewed by an independent agent before shipping, verified live against the real repo.
- **29/07 23:05–30/07 00:05 — Smart Match (M4) architecture ruled from evidence, not the frozen spec's formula.** All three original score components (rating/distance/reliability) were unbuildable today (`hostesses.rating` never written anywhere, `actual_hours` fills only at M6 close, no project coordinates). Ruled: **gate → pin → score → fairness**, three components **acceptance-likelihood · show-reliability · proximity**, weights **0.40/0.35/0.25** (a blind two-persona role-play contradicted the initial equal-weighting). Score stays hidden; UI shows "reason chips" instead. Full spec: `module4_smart_match_research.md §11`. One item left open: which sort angles to build (deferred to M4 opening).
- **30/07 09:05–12:30 — Step 3.4: real email send built** (Make.com webhook → Supabase Edge Function `send-email` → Gmail), replacing the originally-planned mailto. Built as a **generic engine** (`src/lib/email.js`) since M4/M8/M11 all need it (`🚧 מ4/מ8/מ11` in §6). `email_log` pulled forward from M10 (migration 8). Four defects only a live send exposed, incl. a corrupt attachment from Make's `toBinary()` needing an explicit `"base64"` flag and a `using(true)` permissions policy silently 403-ing everyone. All Make/Gmail API gotchas (connection-type mismatch, the working `sendAnEmail` v4 module) already live in `module-3.md` §9 (lines ~1070–1250) — not duplicated here.
- **30/07 09:13–12:15 — Pre-M4 §7 rulings + a doc consistency sweep.** One-event-per-day superseded the old short-event/gap rule (unified into one DB-level UNIQUE constraint); sixth assignment status `approval_withdrawn` ratified; a reliability-formula blind spot fixed (a client-cancelled project must not read as a no-show). A full top-to-bottom read of the 863-line research doc caught a "still open" section that had already been closed elsewhere in the same file.
- **30/07 13:55–14:45 — Step 3.5 built: customer card → full `/customers/:id` record page** (scope grew ~1.5× mid-brief: dialog→page, header actions, sent/not-sent marker, sort control). §7.34 ruled **warn, don't block** on archiving a customer with open quotes. Two bugs a green gate would not have caught: a `useState`→custom-setter swap silently broke a second call site using the updater form, and "+ הצעה חדשה" navigated but never read the query string, silently dropping the preselected customer — both now permanent entries in `02_customers/CLAUDE.md`/`src/CLAUDE.md`. New standing practice from this session: every 🗣️ brief ends with **"מה ייחשב עובד"** (concrete outcome sentences), now in `module-build`.
- **30/07 17:40–18:35 — Two more of the same defect family:** `revenueByCustomer`'s async load meant "not yet known" and "no open quotes" were indistinguishable, silently skipping the §7.34 warning in a race window (fixed: unknown is its own state). A template field added via the Table Editor but missing from code shipped literal brackets to a customer — the near-miss was that the first fix scanned the **filled** body (would have blocked every demo customer, whose names all contain `[דמו]`); fixed to scan the template before injection.
- **30/07 18:20–23:40 — Step 3.6 (prices tab) built and closed; smoke check added.** One dead-on-arrival upsert (Postgres validates NOT NULL before conflict resolution) and one **real data-loss incident** — delete-then-insert really deleted 5 live seed tiers on a closed browser tab; reordered to upsert-then-delete-stale, matching module 2's earlier fix on the same defect family. **The general "replace-style save = insert-first, never delete-then-insert" rule had no permanent home until this compaction pass — now harvested into `src/CLAUDE.md`** (see this session's report). `npm run smoke` added as a thin, CI-excluded read-only layer. Finance E2E credentials provisioned, closing the last real coverage gap.
- **28/07 22:52–23:55 — Context-architecture overhaul planned and executed** (per-project plugin scoping, `CLAUDE.md` split into a thin root + directory-scoped files, hooks shortened, journal reform). Full detail already lives in the "Context-architecture overhaul" paragraph in Reference: Templates & hooks below — not re-summarized here.
- **25/07 21:01–21:38 — Quality-gates round 2** (`knip` + Dependabot + `npm audit` gate added; `eslint-plugin-jsx-a11y` tried and reverted on a real ESLint-10 incompatibility) **+ the `LoadingOrError` cross-module dedup fix** (M1+M2). Full detail already lives in the "Code-quality tooling" paragraph in Reference: Templates & hooks below.

### 📦 Week 22–23/07/2026 — solo reorg + PR #9 + module-flow skills + M3 Phase-1 DB + quality guardrails (bucketed 28/07)

Evergreen facts already harvested into the reference sections below (skills roster, quality tooling, hooks, the PowerShell/CRLF/English-sweep traps); DB detail lives in `docs/db_roadmap.md` §10 + `docs/schema.sql` + `docs/micro_guides/module-3.md`. Kept here as the index:

- **22/07 — solo reorganization** (Ishay: "עמית יוצא מהתמונה… מהיום אני המפתח היחיד"). Guides regrouped `guides/modules/` + `guides/reference/`; CLAUDE.md rewritten solo with **rule numbering 1–17 preserved**; 📣 retired (subtraction, F1); **deadline 19/09/2026 set** with a per-module schedule. Ishay's overriding ruling: **"לא לקצץ כלום! אפשר לדחות להמשך"** — whole modules defer (leaf modules M10→M11→M7 first), nothing gets trimmed, because a deferred module is clean while a trimmed one is rework debt (written into `00_roadmap.md` §3).
- **22/07 21:00 — PR #9 merged** by Ishay (`gh pr view 9` → `state=MERGED mergeCommit=a35c92f`); `origin/main` stayed at `4b09d2f`. `ishay/solo-reorg` and `ishay/module-3-quotes` became ancestors of `dev` = **dead branches (rule 10)**; `ishay/module-3-quotes-build` cut fresh from `dev`.
- **23/07 — three module prompts → skills** (`module-blueprint`/`module-build`/`module-close`), templates `git mv`d into them byte-identical, `docs/templates/` deleted. Later that day **+3 helper skills** (`section7-rulings`/`post-merge`/`feature-acceptance`), then the discipline kernel extracted to `_shared/discipline.md`, then de-duplicated again against Ishay's new global `~/.claude/CLAUDE.md`, and `feature-acceptance` moved out to his global folder (a real name collision was found and resolved).
- **23/07 — CHANGELOG retired in place** (Ishay's ruling B, after I honestly corrected my own "~10 refs" estimate to ~50 across ~20 files): retirement banner + removed from every forward protocol; the one genuinely-orphaned `§TODO` debt (the active/inactive-no-"delete" convention, binding on M4) rehomed to `PROJECT_MASTER §6`. The freeze then got **real enforcement** in `protect-frozen-files.sh` (it had been documentation-only — Ishay asked "is it actually blocked?" and it wasn't).
- **23/07 — M3 Phase 1 (DB) COMPLETE: 5/5 migrations applied + live-verified**, gate 1.7 approved by Ishay. Migration 1 was applied manually via Studio during a **full Supabase-MCP outage** (`-32600 permission-denied`), with Ishay acting as a read-only `execute_sql` proxy; the MCP was restored mid-session and migrations 2–5 went through `apply_migration` behind typed-echo. Step 1.6's RLS impersonation matrix passed; `schema.sql` synced. Committed `fbe2287`, pushed.
- **23/07 — the resume-after-interruption rule** was added to the shared discipline after a real incident: a turn cut by a usage limit right after announcing "saving migration 5 + updating docs" — the file survived, the `db_roadmap` update didn't, and the resumed turn advanced as if it had. Ishay caught it. **Narration is intent, not evidence.**
- **23/07 — code-quality guardrails** (Ishay's ask, all four built): jscpd · sonarjs · `module-close` §4b duplication check · the `quality-audit` skill. Gates deliberately `warn`, hardening tracked in three findable homes.
- **23/07 14:22 — a live rule-16 collision:** `module-3.md` changed **between two reads in the same turn** — direct proof of a concurrent writing session. Stopped, surfaced the evidence, went read-only.

### 📦 15/07/2026 and earlier — archived
Sessions up to and including 15/07/2026 (M3 blueprint, milestone-1 promotion, module-2 close, the infrastructure-immunization wave, module-1 merge, and the 02–09/07 buckets) live in **`docs/archive/session_log_2026-07.md`**. Evergreen facts from them were already harvested into the reference sections below — read those first, not the archive.

---

> 🔧 **Stuck / something not working?** First read the three reference sections below (Operational Gotchas · Tech-debt · DB journal) and "Current State" above — the operational knowledge for solving it is there, not in the Session Log.

## Reference: Operational Gotchas (read when something doesn't work) · 🕓 reviewed 08/08/2026 15:33 (regin-docs-sync — **read-through only**: no bullet here contradicts current reality, but the environment-dependent ones (npm/TLS, prettier, clipboard) were **not** re-executed. Treat this stamp as "no known contradiction", not "each item re-proven")
> The scan stamp is refreshed whenever this section is checked (a session / `regin-docs-sync`). A much older stamp = suspected drift, dig deeper.

- **Running a routine needs a manual "Run now" in the UI** — `list_scheduled_tasks` **does show** the 4 routines (`enabled`, valid `taskId`/`lastRunAt`; verified 08/07/2026 — the old display bug from 06/07, where the tool returned empty, is gone). I have no direct run tool (create/update/list only) — end-to-end verification that a routine ran = running `regin-health-pulse` in the UI and seeing a new journal line. Absence from the list (if it happens) is not a creation failure.
- **‏`block_pipe` triggers on the TOKEN, not the act (measured live 26/08/2026 by a fresh-context reviewer — this corrected my own wrong first version of this entry).** The words `vitest`/`playwright`/`eslint`/`tsc`/`prettier`, or `npm run <gate-script>`, appearing ANYWHERE before a pipe into `head|tail|grep|less|more` reject the **entire** Bash call — **a filename glob like `playwright*.js` counts**, and everything earlier in the compound (a heredoc creating a file, an `ls`) silently never ran. Keep file-creation and piped inspection in separate calls. *(Distinct from the cmdlet-in-verb-position mine in root `CLAUDE.md` — that is `block-shell-dialect-mixup.sh:71`; this is `block_pipe`, `:102-103`.)* **Paired trap, same day:** Python printing Hebrew under the Bash tool dies on `cp1255` (`UnicodeEncodeError`) — always `PYTHONIOENCODING=utf-8`; cost two round-trips before it stuck.
- 🔴 **A running session does NOT see `CLAUDE.md` edits made after it started — and "loading is automatic, compliance is not."** The context files are read at session start; a rule you add mid-flight binds the *next* session, never the ones already open. Together with `discipline.md`'s skills-only load path this fully explained a parallel session's incomplete summary on 07/08/2026, measured live that day. ⚠️ **The consequence that bites: several files describe themselves as "loading automatically every session", which reads as "always current" and is not.** A rule that must bind NOW has to be handed to the running session in chat, or enforced by a hook — text alone cannot reach it, and no mechanism can judge whether a finding rests on a real anchor. *(Restored 12/08/2026 by `regin-docs-sync`: this fact was deleted in the log compaction `bf5b3fc` and existed **nowhere else in the repo** — found by an agent sent to verify the compacting session's own declared blind spot. Its disclosure is what made the recovery possible.)*
- 🔴 **"Use Chrome" does NOT reliably mean the right browser — there are two, and the default is the useless one for our work** *(12/08/2026)*. `mcp__Claude_Browser__*` is the in-app Browser pane: Chromium-based, **logged into nothing**, and it is what the harness instructs me to default to. `mcp__claude-in-chrome__*` is **Ishay's real Chrome**, already authenticated to GitHub/Supabase/Vercel/Google. **The word "כרום" alone does not disambiguate them** — Ishay reported that earlier sessions opened the wrong one on that exact phrasing, and it worked on 12/08 only because he wrote *"השתמש בכרום **האמיתי**"*. ⇒ **The discriminator is not the brand name but the question "does this task need a logged-in identity?"** GitHub PRs · Supabase Studio · Vercel · Gmail ⇒ **go straight to `claude-in-chrome`, without asking, even if he only says "כרום"**. The in-app pane is for `localhost:5173` and public pages. *(Anchor: PR #24 was opened and merged from his account with no login step. The phrasing that always works, if he needs one: **"בכרום שלי, זה שאני מחובר בו"**.)*
- **Open REG-IN sessions from `C:\Users\ishay\Reg-In`** — a session running from another directory works on absolute paths and may miss hooks/CLAUDE.md.
- **Editing `.claude/settings.json`/`.local.json` is categorically blocked for Claude** (auto-mode "Self-Modification") — even inside an approved plan. Hand over ready text, Ishay pastes it manually.
- **The add-user screen only creates a `users` row** — the Auth account + password are created separately in the Supabase Dashboard (Authentication→Users, Auto-Confirm). A knowledge gap that recurred twice.
- **Two sessions writing on the same worktree = collision** (crossing commits/edits; one session's `git add -A` sweeps up the other's files). Iron rule 16: one writing session at a time.
  - 🔴 **And the mirror-image variant, measured 08/08/2026 — the dangerous one, because it defeats the protection people think they have.** The trap is **not** `-A`; it is **leaving the shared index loaded at all.** I ran `git add -- <11 explicit paths>` (no `-A`), my `git commit` then failed on a syntax error, and in that window the *other* session's **ordinary** `git commit` swept all 11 of my files into **its** commit under **its** subject line (`cfd8e82`) — while its own work stayed uncommitted. **Reading rule 10 as "avoid `git add -A`" is not enough: any separate `git add` step is the exposure.** ⇒ **Stage and commit in ONE atomic call — `git commit -m "…" -- <paths>` — and note the flag order: `-m` must come BEFORE `--`, or git reads the message as a pathspec and the commit fails**, which is exactly what left the index loaded here. *(Damage was label-only: content verified intact and reachable via `git log -- <file>` / `git log -S`; no history was rewritten — the wrong subject line was judged not worth an empty marker commit.)*
- **Network-dependent npm hangs (up to 17 min)** — a TLS failure against the registry (proxy/AV injecting a root CA). Verified fix: `NODE_OPTIONS="--use-system-ca"` before every `npm install`/`update`/`outdated`.
- **E2E on a slow network:** a matrix cell click must wait for the PATCH response before `reload()`, otherwise the write is cancelled in flight (`clickCellAndAwaitWrite`); login flows = up to 8 network calls → 30s timeout.
- 🔴 **The SessionStart hook banner's "active step" is a POINTER, not evidence** *(measured 26/08/2026; harvested here at the 27/08 compaction)*. The banner is generated from the micro-guide's §1 header, so it is only as fresh as the last write to that header — a parallel builder that lands work without touching §1 leaves the banner behind. It opened a session saying "step 1.0, build not started" while phases 1–4 were done, **and was quoted to Ishay twice** before the journal exposed it. ⇒ re-derive the active step from the guide §1 *and* Current State before citing it — "resume from disk", applied to machine-generated narration.
- 🔴 **New (untracked) files never ride `git commit -- <paths>` alone** *(bit three times in one day, 26/08/2026, m8 Discovery session)*: a pathspec commit picks up MODIFIED tracked files but silently skips untracked ones even when named — each new file needs an explicit `git add <file>` first (then the atomic-commit rule above still applies). The symptom: a commit that "landed the spec" while the spec file stayed untracked.
- 🔴 **An Edit whose old_string spans up to a NEIGHBOR's heading deletes that heading silently** *(nearly lost the m8-blueprint journal heading, 27/08/2026 — caught only by a headings-listing pass before compaction)*. When inserting a new entry above an existing one, the old_string should END at the boundary line, and the new_string must RE-INCLUDE any neighbor text it consumed. After any multi-entry edit in an append-only log: `grep '^### '` and count.
- **react-hooks (new, caught in module 2 — 10–11/07):** `set-state-in-effect`/`static-components` reject module-1's open-in-dialog effect pattern — use `useState(initializer)` + `key`-remount on the parent, and error/header components as top-of-file components (not defined inside render) · `react-hooks/purity` forbids `Date.now()`/an impure call inside a `useMemo`/render body — breaks `lint` (and thus `npm run verify`) but **not** `vite build`/dev-server (no React Compiler, plain `@vitejs/plugin-react`) — compute a time-dependent value in an event handler and pass it as a prop.
- **Prettier `printWidth` in CI:** long lines (tests/JSX) pass `lint` but fail `format:check`; run `prettier --write --end-of-line auto <file>` on new files before commit (`--end-of-line auto` preserves local CRLF without causing git noise).
- **A migration with Hebrew comments + the browser SQL editor = corruption risk:** typing/pasting directly garbles RTL/bidi (chars interpreted as keyboard shortcuts, policy names break). The MCP `apply_migration` (after typed-echo) avoids the problem entirely — fallback to browser/CLI only if the MCP is unavailable, and then hand over SQL clean of Hebrew comments (keep only load-bearing strings like `'לקוחות'`).
- 🔴 **Nothing in CI deploys the Edge Function — `send-email` is only *type-checked*, so an edit to the repo file is NOT live until someone deploys it, and a live check run before deploying exercises the OLD function while CI is green.** `.github/workflows/ci.yml`'s `edge-function-check` job runs `deno check` on `supabase/functions/send-email/index.ts` and stops there; there is **no** `supabase functions deploy` step anywhere in `.github/`, `package.json` or `scripts/` (re-measured 12/08/2026 — the only workflow file is `ci.yml`). ⇒ this is the trap waiting for **M8/M11** when they widen the `entity_type` map: green pipeline, unchanged live function, and the 403/400 gate matrix still answering from the old code. **The deploy is a Claude-side action, not a 🧩 handover** — Supabase MCP exposes `deploy_edge_function` (that is how version 4 shipped on 09/08/2026); and because the upload transcribes the repo file into the MCP call, repo⇄deployment identity is only ever proven *behaviourally* unless `get_edge_function` is diffed against the file. *(Restored 12/08/2026 by the compaction audit — removed in `8d3ee2e`, found nowhere else.)*
- **`clipboard.readText()` freezes browser automation** (a permission prompt blocks) — components that need to read the clipboard use `writeText` only in product code; auto-verification avoids `readText`.
- **`"` (double quotes) inside a Hebrew string inside attribute-JSX breaks parsing** (e.g. "ח\"פ") — wrap as `{'…'}` (a JS string expression), don't write it directly inside the attribute's quotes.
- **Never round-trip a UTF-8 Hebrew file through PowerShell `Get-Content -Raw | Set-Content -Encoding utf8`** (harvested 22–23/07) — it reads as ANSI and **corrupts every emoji**, and it silently flips CRLF→LF on all lines (a 705/705 diffstat gave it away once). Use `sed`, or Python/.NET `WriteAllText` with explicit no-BOM UTF-8. Caught both times only by re-Reading the file afterwards.
- **CRLF noise is local-only, and `format:check` is now a blocking CI step** (23/07). Root cause was Ishay's global `core.autocrlf=true` (never touched — git config is his) checking files out as CRLF while Prettier defaults to LF; committed content was always clean LF (proved via `git show HEAD:<file> | prettier`). Fixed by generalizing `.gitattributes` to `* text=auto eol=lf`. **If `format:check` fails locally on files you never touched — suspect the working-tree checkout, not the repo.**
- **A Hebrew-only grep misses live English instructions** (22/07 lesson) — when sweeping the docs for a retired concept, run an **English-layer sweep too** (`amit|partner|other developer|second dev`). The Hebrew pass missed three *live* template instructions that would have misled a future module session.
- 🔴 **`git merge-base --is-ancestor HEAD origin/dev` succeeds on a fresh, zero-commit branch exactly as it does on a merged one** — so iron rule 10's "already merged ⇒ STOP, don't pile commits on a dead branch" reads a brand-new branch as dead, and the false stop looks identical to the real one. **Disambiguate with `git rev-list --count origin/dev..HEAD`**: `0` means nothing of yours is on it yet (fresh), not that it was merged. ⚠️ The `--is-ancestor` check is prescribed in four places that all trust it blindly — root `CLAUDE.md` rule 10 · `_shared/discipline.md`'s citation-target table · `module-build/SKILL.md` · `post-merge/SKILL.md` — and none of them carries this caveat. *(Restored 12/08/2026 by the compaction audit — deleted in `bf5b3fc`, found nowhere else in the repo.)*
- 🪝 **Stop-hook mechanics (`check-docs-updated.sh`) — three facts that decide whether it fires at all.** ① **It compares mtimes, and `CLAUDE_CODE_LOG.md` + `STATUS.md` must be the NEWEST-mtime files in the tree** — so every edit made *after* updating those two re-stales them and the hook fires again. ⇒ **update the log and the board LAST, immediately before the final commit**; committing does not change working-tree mtimes, so a commit after them is safe. *(Learned the slow way, three consecutive fires — and it bites hardest when another session's untracked files mean `git status` is never clean, so the mtime comparison always runs.)* ② **A session that committed everything before Stop is skipped entirely:** the hook's change scan is `git status --porcelain` minus those two files, and an empty result exits 0 — **a clean tree at Stop means no doc enforcement runs at all.** *(Restored 12/08/2026 by the compaction audit — deleted in `bf5b3fc`, found nowhere else in the repo.)* ③ **Fixed 19/08/2026 — a live background agent no longer causes the ×4–×6 false-fire loop.** A dispatched agent writes under the PARENT session's `session_id`, so every agent edit used to advance the mtime marker ① checks and re-arm the hook mid-write (hit and worked around by hand three times during module 6's build, 14/08 and 18/08). The hook now reads the harness-written session transcript, detects a genuinely live background agent, and skips only enforcements 1-3 (doc freshness) for that turn — 0/0b/0c/0d stay fully active regardless. Detection failure of any kind ⇒ falls back to the pre-fix behavior. See `_shared/parallel-sessions.md` for the concurrency-discipline side of this (an agent still counts as "another session" for the write-collision rules even though the hook now tolerates its mtime churn).
- 🧩 **A skill loads ONCE, at session start, and does NOT survive a compaction.** Measured 07/08/2026 across all 98 session transcripts: the Skill tool fired **16 times, in 27% of sessions, exactly once each, never re-invoked**. In the advisor session it loaded at line 12, the compaction landed at line 1153, and it never reloaded across 1,435 further lines — **that is the incident where three advisor rules silently stopped running**, with no signal that they had. ⇒ **after any compaction, re-read the skill governing the current work**; what needs judgement survives a compaction, what needs remembering a detail does not, so suspect the mechanism rules first. ⚠️ This is a property of **every** skill, not of one — `advisor/SKILL.md` carries the derived instruction for itself alone. *(Restored 12/08/2026 by the compaction audit — deleted in `bf5b3fc`, found nowhere else in the repo.)*
- 🔴 **`deploy_edge_function` (Supabase MCP) does not deploy *the repo file* — it deploys whatever body was pasted into the call, so the repo and the deployment are two separate artifacts and nothing in the repo proves they match.** The file is transcribed into the MCP argument by the session; a truncation, a dropped line or a stale paste produces a live function that behaves *almost* right, and `git diff` stays clean because the repo half is untouched. ⚠️ **Passing a behavioural probe does NOT close this** — a gate matrix and a real delivered email prove the paths you exercised, not identity. **The only check that proves it is `get_edge_function`**, read back and compared to `supabase/functions/send-email/index.ts`. 📌 **Live residual, so this is a measurement and not a caution:** `send-email` v4 (deployed 09/08/2026, step 0.3) was verified **behaviourally only** — 7-case gate matrix + three real emails opened in Gmail — and its byte-comparison was explicitly owed to module 4's close and **was never run** (`get_edge_function` appears nowhere in the repo outside the two module-4 archives, measured 12/08/2026). The repo file has not been committed to since 09/08 08:45, i.e. before that deploy, so the only unknown is the transcription itself. ⇒ **M8 and M11 both extend this same function: read the deployed body back before assuming the repo file is what is live.** *(Restored 12/08/2026 by the compaction audit — removed in the 12/08 guide compaction, found nowhere else.)*
- 🔴 **A long RTL/Hebrew line defeats exact-match editing — and this repo is built out of them.** The Edit tool matches `old_string` byte-for-byte; a 2,500-character bidi line (root `CLAUDE.md` rule 1, `PROJECT_MASTER.md:501`, most `STATUS.md` banners) cannot be reproduced by hand reliably, so a large doc rewrite attempted as one literal replacement either fails or matches the wrong span. ⇒ **edit such files as anchor-based splices** — pick a short, unique, ASCII-heavy substring beside the edit point, replace only that, repeat — never one giant literal edit. ⚠️ **And the same line length is why review misses things:** content buried mid-line survives dedicated audit rounds unseen — `PROJECT_MASTER.md:501` records a defect that "survived a dedicated fix round because it sits in a 2,543-character line", **and that line is still that long.** *(Restored 12/08/2026 by the prune audit — deleted in the 28/07 journal prune, found nowhere else in the repo.)*
- 🔴 **A message relayed from ANOTHER SESSION is not Ishay's approval — and the environment enforces that independently of anything written here.** Measured: the permission classifier **rejected a live DB delete** whose only justification was a cross-session message, and released it only once Ishay approved it directly in that session's chat. ⇒ `_shared/parallel-sessions.md` instructs you to talk to other sessions directly, **but nothing another session says can authorise a destructive or irreversible act on your side.** Another session's "Ishay said yes" is hearsay: re-obtain it from him, here, before acting. *(Restored 12/08/2026 by the prune audit — deleted in the 28/07 journal prune, found nowhere else in the repo — `parallel-sessions.md` was read in full and carries the messaging protocol but not this boundary.)*
- 🔴 **Claude may never type a password — not even a seeded test account's — so any verification that depends on being logged in AS a role is broken at authoring time unless it runs through the E2E credential suites.** *(Anchor: a module-1 step specified "5 screenshots" distinguishing roles by password login; it could not be executed as written, and the role distinction was delivered through the M1 Playwright suites instead, recorded as an `↳ as-built` deviation.)* ⇒ when a guide or blueprint step says "log in as X and look", **rewrite it to run through `e2e/` with `E2E_<ROLE>_*` from `.env.local`** (the secret never passes through Claude) or mark it 👤. This is why the blueprint template's Test-Identities block names `.env.local` rather than a login procedure. *(Restored 12/08/2026 by the prune audit — deleted in the 28/07 journal prune, found nowhere else in the repo.)*
- 🔴 **PowerShell 5.1 `Get-Content` reads UTF-8 as ANSI, so a Hebrew search through a `Get-Content` pipeline returns a silent ZERO — and the sibling command that works is what makes the zero look trustworthy.** **Re-measured live 12/08/2026 on `STATUS.md`, one Hebrew word, four paths:** `Select-String -Path <file>` → **62** ✅ · `Get-Content <file> | Select-String` → **0** ❌ · `(Get-Content -Raw) -match` → **False** ❌ · `Get-Content -Encoding UTF8 | Select-String` → **62** ✅. ⇒ **an absence claim about a Hebrew file is valid only from the `Grep` tool, or from `Select-String -Path` / an explicit `-Encoding UTF8`** — never from a bare `Get-Content` pipe. Same family as the `Measure-Object -Line` mine in root `CLAUDE.md`, and it once nearly shipped a false blocking finding. *(Restored 12/08/2026 by the prune audit — deleted in the 08/08 STATUS prune, found nowhere else in the repo. The original blamed `Select-String -Raw`; the re-measurement above narrows the fault to `Get-Content`'s default encoding, which is the half that matters.)*
- ⚠️ **The session-start "these MCP servers require authentication" list is NOT evidence that a capability is blocked.** It enumerates the servers needing OAuth — while an *equivalent, already-authenticated* server can sit in the same toolset under a different id. *(Anchor: the banner named `supabase` and `plugin:supabase:supabase` as unauthenticated while a third Supabase server — id `5c4d90c8-…` — was authenticated the whole time; same for GitHub, where the plugin wanted auth and `gh` was already logged in. The false "blocked" conclusion was inherited by **three consecutive sessions**. Still reproducible 12/08/2026: the same banner appeared this session with the same third server present.)* ⇒ **test one live read** (`list_tables`, `gh auth status`) before reporting a capability as unavailable. *(Restored 12/08/2026 by the prune audit — deleted in the 08/08 STATUS prune, found nowhere else in the repo.)*
- ⚠️ **A red CI job does NOT block a merge unless it is listed as a REQUIRED check in branch protection** — a PR can show "Able to merge" directly under a failing check, and to anyone scanning the button that reads exactly like a pass. ⇒ **judge the gate by the required-checks configuration, never by the PR's merge button.** 📌 **Scope of this restoration, stated honestly:** the GitHub-side mechanism is general and current, but **this repo's required-checks list was NOT re-measured today** — branch-protection settings are not readable from the working tree — so "which of `ci.yml`'s jobs actually block" is **טעון בדיקה**. *(Restored 12/08/2026 by the prune audit — deleted in the 08/08 STATUS prune, found nowhere else in the repo.)*
- ⚠️ **`--legacy-peer-deps` / `--force` make a genuinely incompatible install SUCCEED, and the damage lands on the gate rather than on the install.** A peer-dependency refusal is not automatically metadata lag: `eslint-plugin-jsx-a11y` force-installed against ESLint 10 **crashed `npm run lint`** outright — and the worse outcome is the quiet one, a gate that goes green while checking nothing. ⇒ **after any forced install, run the tool itself and read its output** before calling the force safe; if it cannot be made to run, remove the package rather than leave it inside `npm run gate`. ➕ **And re-run `npm run audit` after any install/uninstall round-trip** — a removed dev tool leaves its transitive vulnerabilities behind, which is why `package.json` carries `overrides`. *(Restored 12/08/2026 by the prune audit — deleted in the 28/07 journal prune and again in both STATUS prunes, found nowhere else in the repo.)*
- 📏 **English roughly HALVES the token cost of a Claude-facing file — that measurement is the reason for the language split, and it makes translation a cheaper lever than deletion.** *(Anchor 22–23/07/2026: this log had reached 437 lines / 187KB / **34K tokens** and the Read tool choked on it — the file defeating its own purpose, which is context when stuck. Converting it to English was chosen over trimming precisely because it costs no content.)* ⇒ when a Claude-facing file (`docs/micro_guides/`, `.claude/skills/**`, this log) goes over budget, **check whether it is still carrying Hebrew prose before you start deleting facts.** *(Restored 12/08/2026 by the prune audit — deleted in the 28/07 journal prune, found nowhere else in the repo.)*
- 🔴 **A connected Supabase MCP is not a correct one — `list_projects` can silently point at the WRONG project.** *(Anchor 12/08/2026, module-4 close: the session opened with the MCP pointed at `gdud-710`, a different project entirely, and would have answered every DB query happily — about the wrong database. The 08/08 `regin-docs-sync` run hit the opposite failure the same week: server absent, DB half skipped and said so.)* ⇒ before trusting any DB claim, confirm the connected project is `Reg-In` / `yfeovxppnfoafmfbdfvh` — an absent server is the safe failure; a connected-but-wrong one is the dangerous one, because it never says so.
- ⚠️ **The `SessionStart` hook's banner (branch/step/deadline) is a cached snapshot taken once, not a live query — quoting it into a file without cross-checking reproduces its staleness.** *(Anchor: `STATUS.md`'s "🫵 הצעד הנוכחי" line rotted this exact way on its THIRD documented occurrence, 10–11/08/2026 — a session wrote the hook's own stale opening message ("still Phase 0") into `STATUS.md` as if it were current state, without checking the very file it was editing, which already documented hours of later work.)* ⇒ before writing anything the hook's banner told you, re-read the file it summarizes.
- **Three days of Discovery work (49 of 55 commits) sat on a local-only branch with no remote copy** — a single laptop failure would have lost it. *(Anchor 14/08/2026, module 6: `git ls-tree -r origin/dev -- docs/specs` showed only module 4's folder; the entire module-6 spec set existed only on `ishay/post-fixes-followup`, unpushed for three days.)* ⇒ push a working branch regularly even mid-Discovery, not only at a milestone — an unpushed branch is not a backup of itself.
- **A published Artifact cannot resolve relative links to sibling repo files** — it has no access to the rest of the filesystem, so a page built by copying repo-relative markdown links (mockups, `do-not-touch.md`) breaks silently once published as a standalone URL, even though the same links resolve fine when the file is opened from inside the repo. *(Anchor 17/08/2026, the Amit conference-prep guide.)* ⇒ an Artifact meant to stand alone needs its references inlined, not linked.

## Reference: Tech-debt & open flags · 🕓 reviewed 12/08/2026 13:10 (regin-docs-sync — the **deny-all table list was re-derived from `supabase/migrations/20260809134237` + `docs/schema.sql` and corrected: 5 → 2**. ⚠️ Scope of this stamp: the RLS/deny-all line only. **Supabase MCP was unauthenticated again**, so nothing here was checked against the live DB, and the advisor-count claims still carry their 08/07 measurement)

> 🗺️ **DB debts (since 08/07/2026):** the unified view — `docs/db_roadmap.md` (the DB lines here are cited there in Lane A2/C; the decisions live only in PROJECT_MASTER §7).

- **Missing RLS on tables whose module isn't built yet** — deny-all until the module is built. M2 (built+closed 11/07): `customers`+`customer_contacts` policied. M3 (built on branch, mig 3 `20260723113500` + mig 8): `quotes`/`quote_services` (§7.21) + `products`/`price_tiers`/`params` (§7.83 open-read/CEO-write) + `email_log` policied. M4 (built+closed 12/08, migration D `20260809134237` — **9 policies**): `hostesses` · `assignments` · `hostess_unavailability` · `customer_hostess_preference` · **and `projects`** (`projects_select_by_permission`, read-side only; M6 still owns its write path) are policied. **Remaining deny-all = 2 tables** (`salary_reports` → M8, `logistics` → M5). *(Re-derived 12/08/2026 12:56 by `regin-docs-sync` from the migration file + `docs/schema.sql`, not from the live DB — this line still said "5 tables incl. `hostesses`/`assignments`" after M4 shipped them.)*
- ✅ **14 RLS scenarios on `customers` (the original 12 + 2 view-tier) — completed and closed M1's deferred gate** (module 2 step 1.3, 10/07; independently re-verified in the 11/07 22:33 closing audit). *(The previous line here said "deferred to M2" — update: done.)*
- **Self email-change intentionally omitted** — `users.email` = PK + RLS key (`auth.email()`) + FK-target (`projects.owner_email`, no cascade). A temporary desync would lock a user out of all RLS. Future implementation: `on update cascade` + syncing `auth.users.email`↔`public.users.email`.
- **Account lockout at app/DB level** (not an Auth Hook) — bypassable via a direct API call. Upgrading to a Hook requires a Team plan.
- **Leaked-Password Protection** off (module 10). **Topbar search** placeholder. **UI for `params`** (module 9). **Error Boundary** at Router level (module 3). **Module mapping by Hebrew string** (`MODULE_META`/`GROUPS`) — a module name changed in the DB would break silently; move to `module_id`/slug when touching the schema.
- **Binding convention:** the bidirectional active/inactive status (no "delete" framing) applies to `customers` (M2 — **a ruled deviation**: hidden behind an archive button, not dimmed in a shared list like M1; see module-2.md §9 11:41) and `hostesses` (M4, when built).
- **Three E2E spec files intercept a browser-native `window.confirm()` dialog event that no longer exists in the code they test.** `quote-email.spec.js` / `quotes.spec.js` / `load-failure-guards.spec.js` still hook the native `dialog` event; the quotes module's confirm flows were migrated to the custom `useConfirm()` dialog on 12/08/2026. The interception now silently no-ops, so these specs "pass" without exercising the confirm step at all. E2E doesn't run in CI, so nobody notices until run locally. Needs rewriting to drive the custom dialog like the rest of the suite.
- **Accrued advisors (accepted, not new-untreated):** `multiple_permissive_policies` on `customers`/`customer_contacts`/`permissions`/`users` — an inherent trait of the §7.21 pattern (2 separate SELECT/ALL policies); `unindexed_foreign_keys` — `quotes.customer_id` scheduled as C-1 in M3's first migration; `assignments`/`projects`/`logistics` FKs — M4–6 when built.
- **Open flags** — the only live registry = `PROJECT_MASTER` §7 (**91 items, mix 🟢43/🟡27/🔵4/⚪16/🟠1 as re-measured 08/08/2026** — **the exact count always via grep, not hand-maintained here**; items 87–91 were added/ruled 06–08/08 in the M4 Discovery rounds). **Don't keep a manual list here — it goes stale.** §7 is **queryable-by-type/module** via the status lines — **and since 08/08/2026 it lives in `docs/PROJECT_MASTER_sec7.md`, not `PROJECT_MASTER.md`** (split by Ishay's ruling; §6 stayed put): `grep -E '🟡|🔵' docs/PROJECT_MASTER_sec7.md` (all open) · `grep 'פתוח·אוטומציה'` · `grep 'פתוח·[^·]*·מ4'` (module 4 — now building).
  - ⚠️ **Count by `^N\. `, never by `§7.N`** — items are written as a plain numbered list (`88. 🟢 …`), so `grep -c '§7.88'` returns **0** for every item that exists. A script that verifies presence via `§7.N` reports "all clear" on an empty file. *(Measured 08/08/2026 — it briefly produced the false conclusion that four just-written items did not exist.)*
  - ⚠️ **A stray `U+200F` (RLM) between the number and the emoji silently breaks the documented count** — item 87 carried one, so `grep -cE '^[0-9]+\. 🟢'` returned 42 against a true 43. Removed 08/08/2026; if a count ever looks one short, suspect an invisible bidi char first.
  - ⚠️ **`⚪ ממתין-לביצוע` is NOT closed** — §7.64/65/66 are ruled-but-unbuilt and are executed **by module 4**. Never fold them in with 🟢 when archiving or summarising.

## Reference: DB journal (module 1) · 🕓 reviewed 31/07/2026 01:02 (module-1 content verified still correct; module-2's extended DB journal lives in `docs/db_roadmap.md` §10 + `docs/schema.sql`, not duplicated here)

- **Functions:** `current_user_role_id()→int` (SECURITY DEFINER, `search_path=''`, returns role_id only for `status='active'`, EXECUTE to authenticated only) · `check_login_lock(text)`, `register_failed_login(text)`, `reset_login_attempts()` (lockout, SECURITY DEFINER, `reset` to authenticated only).
- **New tables:** `login_attempts` (email PK, failed_count, locked_until, RLS-on without policies — access only via the functions).
- **RLS:** `roles`/`modules`/`permissions` SELECT-to-all-authenticated (permissions write to CEO) · `users` self-or-CEO + `users_update_self`. **Triggers:** none.
- **Central migrations:** soft-delete (frozen→inactive) · `users_update_self` · `harden_current_user_role_id` · `module1_login_attempts_lockout` · `module1_reset_login_attempts_revoke_anon`.
- ✅ **The initplan debt closed (07/07/2026):** the `(select …)` wrap was applied in migration `20260707163709_module1_users_rls_initplan_select_wrap` — advisors clean. *(The original record's wording, folded here from the old macro-guide 06/07, described the debt as open — updated in the 07/07 open-items audit.)*

## Reference: Templates & hooks · 🕓 reviewed 26/08/2026 00:0X (regin-docs-sync — re-measured against `.claude/`: skill count **8 → 9** (`module-discovery` was missing), hook count **4 confirmed**, `enabledPlugins` **9 on / 10 off confirmed**, `docs/templates/` **confirmed absent**. Prior: 08/08/2026 15:33)

**Templates** — **relocated 23/07/2026** from `docs/templates/` into the module-flow skills (`git mv`, byte-identical): the blueprint template is now `.claude/skills/module-blueprint/template.md` and the closing-audit template `.claude/skills/module-close/template.md`, each invoked by its skill (`module-blueprint`/`module-close`; `module-build` has no template — the micro-guide is its engine). `docs/templates/` no longer exists. Output = a micro-guide **in English, written for Claude** (9 sections, 🤖/👤 tags, self-update). **Substantially hardened 07–08/07** (over the 06/07 version): cross-module blueprint cross-check (was cross-dev until 22/07/2026) · question-anchored-to-step + phase scan · DB-Design-Challenge + mandatory db_roadmap read · shared-surface marker · §7-ripple-check + forward-notice at close (the 📣 cross-developer convention and the two-owner shared-module header were retired 22/07/2026 — single developer). **+ 09/07:** the 🚧 mechanism (mandatory `🚧 מN`↔§6 pairing as a 🔻🤖 ripple) · typed-echo for DoD signing and migration apply · fresh-context reviewer for the blueprint (rule 2b). **+ 17:07 (Ishay's ruling, M2):** a mandatory "🎨 UX & functional review" gate at end-of-Phase-3 (opening) + a mandatory "§2b UX & Validation Audit" section (closing) — the infra freeze was deliberately opened before M3. **+ 11/07 22:33–22:42 (Ishay's rulings, in the M2 close — 3 opening-template changes):** (1) 🗣️ went from "narrate-and-continue" to a **mandatory "experience brief" + wait-for-PM-approval-before-code** (invited-correction understanding statement · validations · screen/mockup description · "for-your-approval" flags); (2) 🤖 gates = functional+visual self-verification **with screenshots**, full 👤 only at phase-end/design (not mid-build); (3) a new **🎤 "PM interview" section** before blueprint approval — a full user journey + focused questions + "what didn't I ask about?". Ripple: CLAUDE.md rule 1 updated accordingly.
**Skills (re-measured 26/08/2026) — 9 repo-local:** **`module-discovery`** · `module-blueprint` · `module-build` · `module-close` · `section7-rulings` · `post-merge` · `quality-audit` · **`skill-scan`** · **`advisor`** (`skill-scan`/`advisor` added 05/08/2026; **`module-discovery` added 13/08/2026, commit `e6c2655`, and this line kept saying "8" for thirteen days** — corrected by `regin-docs-sync` 26/08/2026, measured with `git ls-files .claude/skills/`; registry + triggers in `docs/toolbox.md`). **All nine `SKILL.md` files read `.claude/skills/_shared/discipline.md` first** (the kernel was consolidated there 24/07 — each skill carries only a one-line pointer, no duplicated paragraph). *(This line said "6 repo-local" and "the first five read it — `quality-audit` deliberately opts out" until 08/08/2026; both halves were stale — measured `grep -rl 'discipline.md' .claude/skills/`, which returns all eight including `quality-audit`. `quality-audit` still keeps its own verify-the-recommendation doctrine on top of the kernel — that part was never wrong.)* `feature-acceptance` moved OUT to Ishay's global `~/.claude/skills/` (23/07 — project-agnostic).

**Code-quality tooling (built 23/07, extended 25/07, hardened 29/07)** — `npm run dup` (jscpd, `.jscpd.json`) · `eslint-plugin-sonarjs` curated set in `eslint.config.js` · `npm run deadcode` (knip, `knip.jsonc`) · `npm run audit` (npm audit, `scripts/audit-gate.mjs`) · Dependabot (`.github/dependabot.yml`) · a duplication/should-be-shared step in `module-close` §4b. **The gates are now BLOCKING** — hardening completed 29/07/2026 08:45 (`sonarjs`→error · `continue-on-error` removed from jscpd/knip/audit); `npm run gate` = verify+dup+knip+audit+check:context, all blocking. `gitleaks` and `format:check` were already blocking. Sole accepted-risk waiver: `react-router` GHSA (RSC-only, unused) in `scripts/audit-gate.mjs`.

**Context-architecture overhaul (28/07/2026)** — `CLAUDE.md` split into a thin root + directory-scoped files that load on demand: **`supabase/migrations/CLAUDE.md` now holds the full DB protocol including the typed-echo gate** · `src/CLAUDE.md` the code/security model · `docs/CLAUDE.md` iron rule 13 + the emoji legend. Full pre-split originals in `docs/archive/`. Plugins scoped per-project via `enabledPlugins` in `.claude/settings.json` (11 off in REG-IN only) — registry + re-enable triggers in `docs/toolbox.md`.
🔴 **And what a plugin actually COSTS in context, which is what makes the on/off call decidable rather than a guess** *(verified 28/07/2026 against the official settings precedence table, via `claude-code-guide`)*: **`enabledPlugins` is supported at project level and OVERRIDES the user-level file** — so a REG-IN trim is local to REG-IN and every other project of Ishay's keeps its full set (this is the fact that dissolved his standing objection, "how do I know I won't need it elsewhere"). **Disabling a plugin removes its skills, agents, MCP servers and hooks from context entirely.** ⚠️ **But skill *bodies* were always lazy — only the DESCRIPTIONS are always-on.** ⇒ **The recurring cost of an enabled plugin is its description line, not its content**, so "it is a big skill" is not by itself a reason to disable, and disabling one to save its body saves nothing that was ever being paid. *(Restored 12/08/2026 by the compaction audit — deleted in `64d7971`, found nowhere else in the repo: `docs/toolbox.md` carries the on/off registry and the per-project-override note but never states what is loaded when, and `docs/guides/reference/claude_code_setup.md` §④ב only points at the registry.)*

**The hooks live in scripts** (`.claude/hooks/`, settings.json only points) — **4 hooks, re-counted 08/08/2026 against `.claude/settings.json`** *(this line said "3 hooks as of 09/07" — `block-shell-dialect-mixup.sh` was added later and never reached here; root `CLAUDE.md` already cites it by name and line)*: (0) **PreToolUse** `block-shell-dialect-mixup.sh` — blocks PowerShell/Bash dialect mix-ups (e.g. `Get-Date` inside the Bash tool). ⚠️ **It reads the `|` before a cmdlet name as a verb position, so even *searching* for those names via the Bash tool gets blocked** — use `Read`/`Grep` instead. (1) **PreToolUse** `protect-frozen-files.sh` — protects the frozen C5/C6 **+ committed migrations (append-only) + closes a tool hole** (runs on Edit/Write/Bash/PowerShell/Desktop-Commander; fail-open; tests in `test-protect-frozen.sh` 14/14). (2) **Stop** `check-docs-updated.sh` — blocks session end until the journal+`STATUS` are updated · if code under `src/modules/NN_*/` changed without `module-N.md` · if a migration changed without `db_roadmap.md` · **if a micro-guide contains `🚧 מN` without a matching §6 line (enforcement-0c, 09/07)**. (3) **SessionStart** `session-start-context.sh` — a banner: branch + current step + deadline + active-plan line + concurrency reminder. *(Collapsed to a single track 22/07/2026 — the machine-identity branch and the second developer's track line were removed with the move to a single developer.)*

🧭 **A directory-scoped `CLAUDE.md` loads only for files UNDER it — sibling directories inherit NOTHING, and that is how a whole class of rules ends up unreachable.** *(Measured: every testing mine lived in `src/CLAUDE.md`, while the test work itself lives in `e2e/` and `scripts/` — **siblings** of `src/`, not children. Commit `ae78851` fixed 8 fixtures touching **4 `e2e/` files, 2 `scripts/` files and zero `src/` files** — i.e. the file holding the rules was never loaded for a single file it was written for. `e2e/CLAUDE.md` was created in response and **exists today; `scripts/` still has none.**)* ⇒ **a rule goes in the directory whose files it governs, not the directory of the code it talks about** — the same "the reader must already be standing there" test as `docs/CLAUDE.md`'s כלל-המיקום. *(Restored 12/08/2026 by the prune audit — deleted in the 08/08 STATUS prune, found nowhere else in the repo.)*

⚠️ **A skill in Ishay's global `~/.claude/skills/` and a repo-local skill with the SAME NAME shadow each other, silently.** The harness surfaces one of them in the skill listing — its description, its body — while edits to the other never fire, so a session can carefully maintain a skill that is never the one being loaded. *(Anchor 23/07/2026: `feature-acceptance` existed in both places at once, and the listing was showing the **global** one's description while the **repo-local** copy was the one being edited. Resolved by moving it out of the repo entirely — which is *why* it is global today, not merely because it is project-agnostic. Still live as a shape: the current skill listing shows both a bare `feature-acceptance` and an `anthropic-skills:feature-acceptance`.)* ⇒ **before creating or renaming a repo-local skill, check `~/.claude/skills/` for the same name.** *(Restored 12/08/2026 by the prune audit — deleted in the 28/07 journal prune, found nowhere else in the repo: the surviving log line records only that "a real name collision was found and resolved", never what a collision actually does.)*

</div>
