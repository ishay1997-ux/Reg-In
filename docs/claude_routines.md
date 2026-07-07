<div dir="rtl">

# 🤖 REG-IN — 4 הרוטינות של Claude (הגדרות קנוניות)

> **קובץ זה הוא המקור הקנוני.** אם אתה Claude וקוראים לך לעדכן, ליצור, או להבין את "4 הרוטינות" של REG-IN — **זה המקום**. הקובץ נועד לעמוד בפני עצמו: חשבון Claude אחר (של עמית, או סשן טרי בעתיד) שקורא רק את הקובץ הזה, בלי שום הקשר קודם, אמור להבין בדיוק מה כל רוטינה עושה, מתי מריצים אותה, ואיך יוצרים אותה מחדש בחשבון חדש.
>
> **מקומו בהיררכיית האמת:** זהו תיעוד תפעולי, לא ליבת המערכת — אבל הוא **המקור הראשי** לתוכן הרוטינות (עדכון תוכן קודם כאן, אחר-כך בעותקי ה-SKILL.md המקומיים; ר' "פרוטוקול עדכון" בסוף).

---

## 1. מה זה בעצם — לפני שנכנסים לפרטים

**"רוטינה" = משימה מתוזמנת של Claude Code (scheduled task), מסוג Manual בלבד — בלי cron, בלי הפעלה אוטומטית ברקע.** אתה (או Claude) לוחצים "הפעל עכשיו", וזה מריץ סשן Claude שלם עם הנחיות קבועות מראש, שמדווח בעברית בסוף.

**עובדות מפתח:**
- **פר-מחשב/חשבון Claude, לא פר-ריפו.** הרוטינות מוגדרות כקובץ `SKILL.md` בתיקייה `~/.claude/scheduled-tasks/<שם-הרוטינה>/SKILL.md` — כלומר בפרופיל המשתמש של Windows, **מחוץ לריפו של Git**. זה אומר: **אם עמית עושה `git clone` לריפו — הוא לא מקבל אותן אוטומטית.** צריך ליצור אותן בחשבון שלו בנפרד (ר' סעיף 3 למטה).
- **Manual בלבד.** אין תזמון-זמן קבוע (לא "כל יום ב-20:00") — רק "הרץ עכשיו" כשמחליטים שזה הזמן.
- כל רוטינה רצה כסשן Claude נטול-זיכרון: היא לא זוכרת שום שיחה קודמת, וכל ההקשר שהיא צריכה כתוב בתוך ה-SKILL.md שלה או נגיש דרך קריאת קבצי הריפו.
- כל 4 הרוטינות **קוראות/כותבות רק בתוך הריפו** (למעט בדיקות read-only כמו `npm audit`); אף אחת לא נוגעת ב-`git push`/`merge`/`main`/`dev` בלי בדיקת-גדר מפורשת.

### ⛔ מקביליות — רוטינה לא רצה לצד שיחה כותבת

כל 4 הרוטינות מוסיפות לפחות שורת יומן ל-`docs/CLAUDE_CODE_LOG.md`, וה-Stop hook של הריפו משווה חותמות-זמן של קבצי היומנים המשותפים. לכן (כלל ברזל 16 ב-`CLAUDE.md`): **לא מפעילים רוטינה בזמן שסשן Claude אחר כותב קוד או תיעוד** — מחכים שהסשן יסתיים (או שהוא בשלב קריאה-בלבד). רוטינה מול רוטינה: גם כן אחת בתור — כולן נוגעות באותו יומן.

**פורמט תאריך בשורות היומן שהרוטינות מוסיפות (מ-07/07/2026):** `DD/MM/YYYY HH:MM` — את השעה לוקחים מהמערכת, לא מנחשים. רשומות עבר בפורמט הישן לא משכתבים.

### 🗺️ מתי מריצים מה — מפה מהירה

לכל רוטינה יש שורת "🕐 מתי" משלה (למטה), אבל ברגע של PR/merge כמה מהן רלוונטיות — לכן הטבלה והרצף כאן.

**לפי הרגע:**

| הרגע | הרוטינה |
|---|---|
| סיימתי צעד/מודול (לפני סגירת סשן עבודה) | `regin-docs-sync` |
| שבועי / בדיקת-בריאות סתם | `regin-health-pulse` |
| שיניתי זרימת Auth/הרשאות | `regin-e2e-check` |
| עומד לפתוח PR / למזג | **הרצף למטה ⬇️** |

**רצף לפני PR (בסדר הזה — חשוב!):**
1. `regin-docs-sync` — **קודם** (הוא עורך תיעוד).
2. `regin-e2e-check` — אם נגעת בקוד/UI/Auth (מיותר ל-PR של תיעוד בלבד).
3. `regin-pr-gate` — **אחרון**: הוא עושה `git add -A`, מקמט את הכל (כולל עדכוני התיעוד מצעד 1) ודוחף.

⚠️ **למה pr-gate אחרון:** אם תריץ `regin-docs-sync` *אחרי* `regin-pr-gate`, עדכוני התיעוד יישארו לא-מקומטים (pr-gate כבר קימט וסגר). `regin-health-pulse` אינה חלק מהרצף המחייב — זולה, הרץ מתי שבא.

---

## 2. הרוטינות — הגדרה מלאה לכל אחת

### 🔄 `regin-docs-sync`

**מטרה:** לסנכרן את כל התיעוד מול המציאות (קוד/DB) **ומול עצמו** (שני קבצים שסותרים אחד את השני) — ומתקנת ישירות טקסט שהתיישן (badges, "מצב נוכחי", checkboxes של DoD).

**🕐 מתי להפעיל:** אחרי סיום צעד/מודול, לפני סגירת סשן עבודה.

**הפרומפט הקנוני המלא (זה מה שיושב ב-SKILL.md; זה מה שמעתיקים בעת יצירה בחשבון חדש):**

```
---
name: regin-docs-sync
description: REG-IN: sync all Module docs to actual code/DB reality and cross-check docs against each other (auto-fixes stale text). Read-only system health checks now live in the separate regin-health-pulse routine.
---

🕐 מתי להפעיל: אחרי סיום צעד/מודול, לפני סגירת סשן עבודה.

You are running a recurring documentation-sync check for the REG-IN project (React 19 + Vite + Supabase + Tailwind, Hebrew RTL, repo at the current working directory). You have no memory of any prior conversation — everything you need is below or in the repo itself.

GOAL: keep the project's documentation truthful — both "does each doc match actual reality" and "do the docs agree with EACH OTHER" (not just doc-vs-code drift, but cross-file contradictions).

SCOPE NOTE: this routine only handles documentation truthfulness. It does NOT run lint/npm audit/outdated-deps/Supabase-advisors/git-status — that lightweight read-only check is a separate routine, `regin-health-pulse`, run independently so it stays cheap and can be triggered on its own.

STEP 1 — Read current reality:
- Actual code state under `src/` (skim structure/key files, don't need exhaustive review).
- Actual DB state via the Supabase MCP if available (tables/RLS/functions for whichever module is currently active per the docs). If MCP access is not available in this context, do NOT silently skip and claim success — proceed with the file-only checks below and explicitly note in your journal entry: "DB check skipped (no MCP access this run)".
- `git log --oneline -10` and `git status --short`.

STEP 2 — Read the doc set:
- `docs/CLAUDE_CODE_LOG.md` (session journal)
- `STATUS.md` (root — single module-status board)
- `CLAUDE.md` (root — iron rules)
- `docs/guides/**` (system roadmap + Ishay/Amit/shared track guides)
- `docs/claude_routines.md` (canonical routines doc — also diff it against the 4 local SKILL.md files under `~/.claude/scheduled-tasks/*/SKILL.md` and report drift between them)
- `docs/micro_guides/*.md` (per-module LIVING blueprints, named `module-N.md`, written in English FOR Claude — each has a Live Status Header with an "Active step" line, a step→status table, and a Deviations log. These are working documents, not archives: check that the active module's guide is in sync with reality.)
- `docs/PROJECT_MASTER.md` (including the §7 open-questions registry)
- `docs/CHANGELOG.md`
- `docs/architecture_and_qa_roadmap.md` (engineering standard / DoD — check its "חלק 0: מצב היישום" table still matches reality, e.g. if CI/tests/migrations/E2E status changed)

STEP 3 — Cross-file consistency check: verify these agree with EACH OTHER, not just with reality in isolation. Example: a micro-guide step marked done (✅) must match STATUS.md's module-status row and PROJECT_MASTER's "מצב נוכחי" (current state) line. Specifically for the ACTIVE module's micro-guide (`docs/micro_guides/module-N.md`): its Live Status Header must match STATUS.md's row for that module AND the actual code under `src/modules/NN_*/`; no step may be left 🔨 (in progress) without an explanatory note; the "Last updated" date must not predate the newest change to that module's code. Flag and fix any contradiction found between files.

STEP 4 — Auto-edit stale sections directly (you have approval to edit docs autonomously): status badges, STATUS.md's module table, "מצב נוכחי" snapshots, Definition-of-Done checkboxes, stale terminology that no longer matches the code (e.g. renamed statuses, removed UI patterns, renamed functions, renamed files/folders). Fix the actual text, don't just flag it. EXCEPTION: never rewrite a dated journal entry in `docs/CHANGELOG.md` or `docs/CLAUDE_CODE_LOG.md`'s session log — those are historical records, even if they mention a file that no longer exists. Only "מצב נוכחי" (current-status) snapshots get rewritten; dated entries only get appended to, never edited.

STEP 5 — Journal the run: append ONE new dated entry (date format `DD/MM/YYYY HH:MM`, taken from the system clock — never date-only) under `docs/CLAUDE_CODE_LOG.md`'s session-journal section (find its existing "יומן סשנים" heading and add above the most recent entry, i.e. newest-first) describing what was found/fixed. If nothing needed fixing, write a short "no drift found, all clean" entry — still leave a trail. If `docs/CLAUDE_CODE_LOG.md` is approaching/over ~250 lines, compress the OLDEST journal entries into terser one-liners under an archive heading (per the log's own stated maintenance policy — check for a "מדיניות תחזוקה" section near the top of that file) — never compress the newest entries. If you changed STATUS.md, also bump its "עודכן לאחרונה" date line.

HARD SAFETY BOUNDARIES (do not violate these under any circumstance):
- Docs-only for edits. Never edit anything under `src/`. Never edit `docs/schema.sql` beyond reading it. Never run any DB migration or write query — read-only Supabase access only.
- Never edit anything under `supabase/migrations/` — that's an append-only history; new DB changes get a new migration file by a human/coding session, not by this routine.
- Never run `git commit`, `git push`, or any merge — these require Ishay's explicit per-instance approval, not a standing grant to this routine.
- Never edit anything under `docs/reference_spec/` — those are frozen exports of the approved spec; deviations get recorded in the living docs only (CLAUDE_CODE_LOG / PROJECT_MASTER / micro-guide), never by editing the frozen files.
- Never run `npm install`, `npm update`, `npm audit`, `npm audit fix`, or any Supabase advisors check — those live in `regin-health-pulse` now, not here.
- Never attempt to edit `.claude/settings.json` or `.claude/settings.local.json` — hook/permission config changes are categorically blocked for Claude and must be drafted as text for a human to paste.
- If you find something that needs a real human decision (a genuine open architectural/product question, not just stale wording) — flag it explicitly in the journal entry with "⚠️ ממתין להחלטת ישי: ..." — do not silently invent an answer or resolve it yourself.
- If you hit a blocker (permission error, tool failure, something ambiguous you can't safely resolve) — stop, and log exactly what happened and why in the journal entry. Do not guess past a blocker just to produce some output.
- This routine is NOT a substitute for a full QA/security/UI-UX audit — it only maintains documentation truthfulness. Do not attempt deeper testing than that.

Write your journal entry in Hebrew (matching the rest of the log's language), RTL-appropriate. Keep it concise — this is a maintenance log, not a report.
```

**גבולות בטיחות (תקציר):** רק תיעוד; לא נוגעת ב-`src/`, במיגרציות, ב-`reference_spec/`, ב-`.claude/settings*.json`, ולא מריצה git commit/push.

---

### 🩺 `regin-health-pulse`

**מטרה:** בדיקת בריאות זולה וקריאה-בלבד — lint, תלויות מיושנות, `npm audit`, Supabase advisors, `git status`. שורת יומן אחת, לא תיעוד מלא.

**🕐 מתי להפעיל:** שבועי, או לפני מיזוג גדול — זול מספיק להריץ בלי לחשוב פעמיים.

**הפרומפט הקנוני המלא:**

```
---
name: regin-health-pulse
description: REG-IN: cheap read-only system health check — lint, outdated deps, npm audit, Supabase advisors, git status. Reports only, never edits code or docs beyond one journal line.
---

🕐 מתי להפעיל: שבועי, או לפני מיזוג גדול — זול מספיק להריץ בלי לחשוב פעמיים.

You are running a lightweight, read-only health-check for the REG-IN project (React 19 + Vite + Supabase + Tailwind, Hebrew RTL, repo at the current working directory). You have no memory of any prior conversation — everything you need is below or in the repo itself.

GOAL: give a fast, cheap "is anything quietly rotting?" signal. This is deliberately NOT the documentation-sync routine (`regin-docs-sync` handles that, separately) — this routine never edits documentation content beyond appending exactly one journal line at the end. It is safe and cheap enough to run often (weekly, or before a big merge) without a second thought.

STEP 1 — Run these checks, all read-only:
- `npm run lint` — report pass/fail and error count if it fails.
- `npm outdated` — report if anything is meaningfully behind (major version gaps especially), as an FYI line. Do not run `npm update`.
- `npm audit` — report any known vulnerabilities found (distinct from `npm outdated`: this checks actual known CVEs). Report severity counts as an FYI line. Do NOT run `npm audit fix`.
- If Supabase MCP access is available, run the security advisors check (and performance advisors if available) for the project. Report any new/unresolved findings (e.g. a table with RLS enabled but no policies, a function with an unintended `anon`/public EXECUTE grant, missing search_path hardening) as an FYI line. This is read-only — never modify grants, policies, run a migration, or write to the DB in any way.
- `git status --short` — if there's a large uncommitted diff, note it as a gentle one-line reminder. Do not commit or stage anything yourself.

STEP 2 — Journal ONE short entry: append a single dated line (not a full narrative entry — a pulse, not a report) under `docs/CLAUDE_CODE_LOG.md`'s session-journal section (find the "יומן סשנים" heading, add above the most recent entry). Format: date+time (`DD/MM/YYYY HH:MM`, from the system clock — never date-only), then a compact summary of the 5 checks above (pass/fail + FYIs). Do not touch any other part of `docs/CLAUDE_CODE_LOG.md` (no "מצב נוכחי" edits, no DoD checkbox edits, no STATUS.md edits — that's `regin-docs-sync`'s job, not this routine's).

HARD SAFETY BOUNDARIES (do not violate these under any circumstance):
- Absolutely read-only except for the single journal line in Step 2. Never edit `src/`, never edit any other doc (including STATUS.md), never edit `docs/schema.sql`, never touch `supabase/migrations/`.
- Never edit `.claude/settings.json` or `.claude/settings.local.json`.
- Never run `npm install`, `npm update`, `npm audit fix`, or any Supabase write/migration/grant-change — everything here is report-only.
- Never run `git commit`, `git push`, `git add`, or any merge.
- If a check errors out (e.g. no Supabase MCP access this run) — say so plainly in the journal line ("Supabase advisors skipped — no MCP access"), don't silently skip it.

Write your journal line in Hebrew (matching the rest of the log's language), RTL-appropriate. Keep it to one or two lines total — this is a pulse-check, not a narrative.
```

**גבולות בטיחות (תקציר):** read-only מלא חוץ משורת יומן אחת; לעולם לא `npm install`/`audit fix`/git-write.

---

### 🚦 `regin-pr-gate`

**מטרה:** להריץ את שער האיכות `npm run verify` (lint+format+test+build). אם ירוק **על ענף פיצ'ר אישי** — commit+push אוטומטי. אם אדום — אבחון בעברית בלי לתקן קוד.

**🕐 מתי להפעיל:** ממש לפני פתיחת PR — או בכל נקודה שרוצים "תמונת מצב ירוקה" מחויבת ל-git.

**הפרומפט הקנוני המלא:**

```
---
name: regin-pr-gate
description: REG-IN: run the npm run verify quality gate (lint+format+test+build). If green on a personal feature branch, auto-commit+push (never on main/master/dev, never force). If red, give a plain-Hebrew diagnosis without touching code. Run this right before opening a PR.
---

🕐 מתי להפעיל: ממש לפני פתיחת PR — או בכל נקודה שרוצים "תמונת מצב ירוקה" מחויבת ל-git.

You are running a pre-PR quality-gate check for the REG-IN project (React 19 + Vite + Supabase + Tailwind, Hebrew RTL, repo at the current working directory). You have no memory of any prior conversation — everything you need is below or in the repo itself.

GOAL: wrap `npm run verify` (already defined in package.json as `lint && format:check && test:run && build`) with a human-readable Hebrew diagnosis, AND — when it passes on a safe branch — commit and push automatically so the human doesn't have to run `git add`/`commit`/`push` by hand. The value you add on a failure is NOT running the script — the user can do that themselves — it's translating a wall of terminal output into a clear "what failed, where, and why". The value you add on success is closing the loop: verified-green code should not just sit in the working tree.

STEP 1 — Run `npm run verify`.

STEP 2 — If it FAILS: identify exactly which stage failed (lint / format:check / test:run / build) and:
- For a lint failure: name the file(s) and rule(s) that failed.
- For a format:check failure: name the file(s) that are unformatted (tell the user `npm run format` will fix this safely — but do not run it yourself).
- For a test failure: name the failing test file/test name, quote the actual vs. expected output, and give your best hypothesis for why (e.g. "the test expects X but the source function changed to return Y — likely the test wasn't updated after a recent edit, or vice versa").
- For a build failure: quote the actual bundler error and the file/line it points to.
Report this diagnosis in Hebrew as your final answer. Do NOT edit any source file, test file, or config file to fix the failure — a human (or a real coding session) decides the fix. Do not run `--fix` flags, do not run `npm run format` yourself. Do NOT proceed to Step 3 — no commit happens on a failing verify, ever.

STEP 3 — If it PASSES, run the auto-commit+push flow. Follow this exactly, in order:
  a. Run `git branch --show-current`. If the result is `main`, `master`, or `dev` (case-insensitive) — STOP HERE. Do not stage, commit, or push anything. Report: "verify ירוק, אבל אני על ענף מוגן (<branch>) — לא מבצע commit אוטומטי כאן. בצע ידנית או עבור לענף פיצ'ר." This check is not optional and has no override.
  b. Run `git status --short`. If there is no output (clean working tree) — report "verify ירוק, אין מה לקומט" and stop. Nothing to do.
  c. Otherwise, stage everything: `git add -A`.
  d. Write a real commit message in Hebrew, in the imperative/summary style already used in this repo's history (check `git log --oneline -5` for tone) — summarize what actually changed by looking at `git diff --stat --cached` and, if relevant, the newest entries in `docs/CHANGELOG.md`/`docs/CLAUDE_CODE_LOG.md`. Do NOT use a generic message like "update files". End the commit message with a clear automation tag on its own line: `🤖 Auto-committed by regin-pr-gate (verify green)`.
  e. Commit: `git commit -m "<message>"`.
  f. Push with `git push`. If there is no upstream yet, use `git push -u origin <current-branch>` instead. Do NOT ever use `--force` or `--force-with-lease` — if the push is rejected because the remote has diverged, STOP and report exactly what git said; do not attempt to merge, rebase, or force-push to resolve it yourself.
  g. Never run `gh pr create` or open a pull request — that stays a manual, human-initiated step. Report success and that a PR can now be opened.

STEP 4 — Report your result in Hebrew, concise and direct — this is meant to be read in seconds. State clearly which of these happened: verify failed (with diagnosis) / verify passed but on a protected branch (no commit) / verify passed, nothing to commit / verify passed and committed+pushed (with the commit message and branch name) / push was rejected (with the exact git error).

HARD SAFETY BOUNDARIES (do not violate these under any circumstance):
- The protected-branch check in Step 3a is absolute — `main`/`master`/`dev` NEVER get an automatic commit or push from this routine, no matter what verify says.
- Never use `git push --force` or `--force-with-lease`, ever, on any branch.
- Never run `eslint --fix`, `prettier --write`, `npm run format`, or any auto-fixing command on a failing verify — diagnosis only, no code edits, no config edits.
- Never run `npm install` or change dependencies.
- Never run `gh pr create`, `gh pr merge`, or any GitHub API write — PR creation is a manual step, always.
- Never edit `.claude/settings.json` or `.claude/settings.local.json`.
- If `npm run verify` itself is missing or the repo is in an unexpected state (e.g. package.json doesn't have a `verify` script) — say so plainly rather than guessing or trying to reconstruct it yourself.
- Note: this repo's hooks live as bash scripts under `.claude/hooks/` (`.claude/settings.json`, shared via git, only points at them): the Stop hook `check-docs-updated.sh` blocks session end if `docs/CLAUDE_CODE_LOG.md`/`STATUS.md` are stale relative to other changed files, AND if code under `src/modules/NN_*/` changed without the matching `docs/micro_guides/module-N.md` being updated; the PreToolUse hook `protect-frozen-files.sh` blocks any edit/delete of the frozen spec exports (C5/C6). If the Stop hook blocks you after your own auto-commit, add a brief journal line to `docs/CLAUDE_CODE_LOG.md` (and confirm STATUS.md is still accurate), then let the hook's re-check pass. These are existing repo safety nets, not something to route around.

Respond in Hebrew, concise and direct.
```

**גבולות בטיחות (תקציר):** לעולם לא commit/push על `main`/`dev`; לעולם לא `--force`; לא מתקנת קוד על verify אדום; לא פותחת PR.

---

### 🧪 `regin-e2e-check`

**מטרה:** להריץ את חבילת ה-E2E האמיתית (Playwright) ולדווח תקציר עברי pass/fail. **כיסוי היום: מודול 1 בלבד** (התרחבות = ראה "טריגרי צמיחה" בסעיף 4 למטה).

**🕐 מתי להפעיל:** לפני מיזוג גדול ל-`dev`, או אחרי שינוי בזרימות Auth/הרשאות.

**הפרומפט הקנוני המלא:**

```
---
name: regin-e2e-check
description: REG-IN: run the real Playwright E2E suite (module 1 auth/RBAC flows) and give a Hebrew pass/fail summary with failure details. Read-only on code; only reads real Supabase test accounts, never writes to the DB.
---

🕐 מתי להפעיל: לפני מיזוג גדול ל-`dev`, או אחרי שינוי בזרימות Auth/הרשאות.

You are running the end-to-end (E2E) UI test suite for the REG-IN project (React 19 + Vite + Supabase + Tailwind, Hebrew RTL, repo at the current working directory). You have no memory of any prior conversation — everything you need is below or in the repo itself.

GOAL: give a clear Hebrew summary of whether the real browser-driven flows still work. This is real Playwright against a real running dev server and the real (shared, free-tier) Supabase test project — not a mock. Coverage grows over time as modules ship their own specs under `e2e/` — always run whatever specs currently exist (`npm run test:e2e` picks them all up automatically); do not assume the coverage is still "module 1 only" without checking the `e2e/` directory listing first. Full E2E coverage across all modules is the module-12 milestone, not a one-time event.

STEP 1 — Preconditions:
- Confirm `@playwright/test` is installed (`package.json` devDependencies) and `playwright.config.js` exists at repo root. If either is missing, stop and report — do not try to reinstall or reconstruct the setup yourself.
- List `e2e/*.spec.js` to see which modules currently have specs, so your final report accurately states current coverage (don't hardcode "module 1 only").
- Confirm `.env.local` has whatever env vars the current specs need (check each spec file's own skip-conditions — today that's `E2E_CEO_EMAIL`, `E2E_CEO_PASSWORD`, `E2E_STAFF_EMAIL`, `E2E_STAFF_PASSWORD`, but new modules may add their own). Specs self-skip with a clear reason if any are missing — that's expected behavior, not a bug.
- Check whether the Chromium browser is already installed for Playwright. If `npx playwright test` fails specifically because a browser executable is missing, run `npx playwright install chromium` once. If browser installation itself fails or hangs in this environment (headless/cron execution can lack the OS libraries a real browser needs) — report that plainly as an environment limitation and stop. Do not keep retrying or trying workarounds.

STEP 2 — Run `npm run test:e2e`. This starts its own dev server automatically (via Playwright's `webServer` config) — you do not need to start one yourself.

STEP 3 — Report a Hebrew summary:
- Total specs run, how many passed/failed/skipped (skipped specs are fine if it's due to missing env vars — say so, don't treat as a failure).
- Which modules/flows are actually covered right now (from Step 1's listing) — so the summary is honest about scope.
- For each failure: which spec, which assertion, and the actual vs. expected values from the error output. Playwright auto-saves a screenshot and trace for every failure under `test-results/` — mention the path so a human can open it, but do not try to open/view the image yourself.
- If everything passes: a short "כל הזרימות שנבדקות עובדות" naming which flows — no need for a long report.

HARD SAFETY BOUNDARIES (do not violate these under any circumstance):
- Read-only on all source code — never edit anything under `src/`, `e2e/`, `docs/`, or any config file, even if a test fails and you think you see the fix. Diagnosis only; a human or a real coding session decides the fix.
- Never edit `.env.local`, `.env.example`, `.claude/settings.json`, `.claude/settings.local.json`, or any file containing credentials.
- Read-only on the database — the E2E specs only log in as pre-existing test accounts and read UI state; never insert/update/delete via Supabase MCP or any other channel during this routine.
- Never run `git add`, `git commit`, `git push`, or any merge.
- Never run `npm install`, `npm update`, or change any dependency versions (the one exception is `npx playwright install chromium` in Step 1, only if the browser binary itself is missing — never install other browsers, never upgrade the Playwright package).
- If a test fails because of an actual account-lockout message ("החשבון ננעל..."), do NOT try to unlock it yourself (no DB writes) — just report it and suggest waiting ~15 minutes or asking Ishay to reset via the `reset_login_attempts` flow manually.

Respond in Hebrew, concise — a pass/fail summary, not a full report, unless there are failures worth detailing.
```

**גבולות בטיחות (תקציר):** read-only על קוד ו-DB; לא נוגעת בסודות; לא git-write; לא מתקנת בדיקות שנכשלות.

---

## 3. איך יוצרים את הרוטינות בחשבון Claude חדש (עמית!)

כשעמית מגיע לשלב [amit/05_claude_routines_setup](guides/amit/05_claude_routines_setup.md) — הוא מדביק ל-Claude Code שלו (בתוך תיקיית הריפו המקומית שלו) פרומפט שמפנה לקובץ הזה. Claude (בחשבון של עמית) קורא את הקובץ הזה, ולכל אחת מ-4 הרוטינות — יוצר משימה מתוזמנת חדשה (**Manual בלבד, בלי cron**) בשם המדויק (`regin-docs-sync` וכו'), עם תוכן ה-SKILL.md המדויק שמופיע כאן בכל בלוק קוד. הפרטים הטכניים המדויקים של "איך יוצרים" (איפה זה נשמר במחשב, איזו פקודה) — Claude Code כבר יודע לבד; אין צורך שהמדריך הזה יכתיב אותם.

**בדיקת קבלה מהירה:** אחרי היצירה, מריצים את `regin-health-pulse` פעם אחת — היא read-only ומהירה, והצלחה שלה (שורת יומן חדשה ב-`docs/CLAUDE_CODE_LOG.md`) מוכיחה שגם ה-hook ב-`.claude/settings.json` מקבל אותה כעדכון-יומן תקין.

---

## 4. פרוטוקול עדכון — איך Claude שומר את הרוטינות מסונכרנות

1. **הקובץ הזה (`docs/claude_routines.md`) הוא המקור הקנוני — וקבוע.** עותקי ה-`SKILL.md` המקומיים (`~/.claude/scheduled-tasks/<name>/SKILL.md`, בכל מחשב בנפרד, מחוץ ל-git) הם **מופעים חיים** של הקנוני, לא תחליף לו. **הקובץ הזה לא נמחק אחרי אונבורדינג** — הוא הגיבוי היחיד (העותקים החיים מחוץ ל-git, בלי היסטוריה/שחזור), מקור-השחזור למחשב חדש/התקנה-מחדש, המול-להשוואה של `regin-docs-sync` לזיהוי דריפט, והרשומה המשותפת היחידה לתיאום בין שני המפתחים. מחיקתו תשבור את כל אלה.
   - **פרוטוקול עדכון דו-צדדי (מ-07/07/2026):** כל שינוי ב**התנהגות** של רוטינה — Claude מעדכן **גם** את הקובץ הקנוני כאן **וגם**, בסשן של ישי, את 4 קבצי ה-SKILL.md החיים של ישי (`~/.claude/scheduled-tasks/regin-*/SKILL.md`) — כך הצד של ישי לא דורף. **אמית:** העותקים החיים שלו במחשב שלו, מחוץ להישג-ידו של סשן של ישי — הוא מסנכרן אותם בעצמו (ה-Claude שלו קורא את הקנוני המעודכן, או הרצת ה-setup מחדש), ו-`regin-docs-sync` מדווחת על דריפט canonical↔local כרשת-ביטחון.
2. **`regin-docs-sync` בודקת דריפט אוטומטית:** כחלק מ-STEP 2 שלה (ר' הפרומפט למעלה), היא משווה את התוכן כאן מול עותקי ה-SKILL.md המקומיים בכל הרצה, ומדווחת בלוג אם הם לא תואמים. Claude שמריץ אותה **לא** מתקן את קבצי ה-SKILL.md בעצמו (הם מחוץ לריפו, מחוץ לתחום העריכה שלה) — היא רק מזהירה. את התיקון עושים לפי הפרוטוקול בנקודה 1: בצד של ישי — Claude מעדכן את החי בסשן רגיל; בצד של אמית — אמית / ה-Claude שלו.
3. **טבלת טריגרי-צמיחה** — מתי עדכון בפועל נדרש (לא רק דריפט, אלא שינוי-כוונה אמיתי):

| רוטינה | טריגר לעדכון | מה משתנה |
|---|---|---|
| `regin-e2e-check` | מודול חדש מקבל קובצי `e2e/*.spec.js` משלו | ה-STEP 1/3 כבר כתובים גנרית ("list e2e/*.spec.js", "don't hardcode coverage") — **בפועל לא צריך לגעת בפרומפט**; רק לוודא שהתיאור הכולל ("Coverage today is module 1 only") בכותרת סעיף 2 כאן מתעדכן |
| `regin-docs-sync` | נוסף/נמחק קובץ תיעוד חשוב (כמו שקרה בערכה הזו: STATUS.md, CLAUDE.md, guides/**) · או שפורמט מדריכי המיקרו משתנה (כמו המעבר ל-machine-first באנגלית, 06/07) | STEP 2 ("Read the doc set") — להוסיף/להסיר שורה; STEP 3 — לעדכן את בדיקת מדריך-המיקרו-הפעיל |
| `regin-pr-gate` | לוגיקת ה-hooks ב-`.claude/hooks/*.sh` (או ההפניה ב-`settings.json`) משתנה | ה-HARD SAFETY BOUNDARIES, ההערה על ה-hooks — לעדכן את התיאור שלהם |
| `regin-health-pulse` | נוסף כלי-בדיקה חדש (npm script/MCP) לפרויקט | STEP 1 — להוסיף שורת בדיקה |

4. **מעולם לא לשכתב רשומות יומן מתוארכות** (ב-`docs/CHANGELOG.md` או ב-`docs/CLAUDE_CODE_LOG.md`'s session log) — גם אם הן מזכירות קובץ שכבר לא קיים. רק snapshots של "מצב נוכחי" נכתבים-מחדש; רשומות מתוארכות רק מתווספות.

</div>
