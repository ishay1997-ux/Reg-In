<div dir="rtl">

# 🤖 REG-IN — 4 הרוטינות של Claude (הגדרות קנוניות)

> **קובץ זה הוא המקור הקנוני.** אם אתה Claude וקוראים לך לעדכן, ליצור, או להבין את "4 הרוטינות" של REG-IN — **זה המקום**. הקובץ נועד לעמוד בפני עצמו: סשן טרי, או חשבון Claude על מחשב אחר, שקורא רק את הקובץ הזה בלי שום הקשר קודם — אמור להבין בדיוק מה כל רוטינה עושה, מתי מריצים אותה, ואיך יוצרים אותה מחדש בחשבון חדש.
>
> **מקומו בהיררכיית האמת:** זהו תיעוד תפעולי, לא ליבת המערכת — אבל הוא **המקור הראשי** לתוכן הרוטינות (עדכון תוכן קודם כאן, אחר-כך בעותקי ה-SKILL.md המקומיים; ר' "פרוטוקול עדכון" בסוף).

---

## 1. מה זה בעצם — לפני שנכנסים לפרטים

**"רוטינה" = משימה מתוזמנת של Claude Code (scheduled task), מסוג Manual בלבד — בלי cron, בלי הפעלה אוטומטית ברקע.** אתה (או Claude) לוחצים "הפעל עכשיו", וזה מריץ סשן Claude שלם עם הנחיות קבועות מראש, שמדווח בעברית בסוף.

**עובדות מפתח:**
- **פר-מחשב/חשבון Claude, לא פר-ריפו.** הרוטינות מוגדרות כקובץ `SKILL.md` בתיקייה `~/.claude/scheduled-tasks/<שם-הרוטינה>/SKILL.md` — כלומר בפרופיל המשתמש של Windows, **מחוץ לריפו של Git**. זה אומר: **`git clone` של הריפו למחשב חדש לא מביא אותן** — צריך ליצור אותן שם בנפרד (ר' סעיף 3 למטה).
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
> 🕓 עודכנה (קנוני): 23/07/2026 — STEP 1: נוסף `.claude/skills/**` (טמפלטי-המודול עברו לשם) + `docs/CHANGELOG.md` סומן retired (read-only, לא לתייג/לצפות-לעדכון); FRESHNESS-STAMP + הערת-שפה: CHANGELOG הוסר · קודם: 10/07/2026 00:12 (STEP 2 בולט-🚧→ציטוט כלל 15) · 08/07/2026 17:15 (חותמת-אימות) · 07/07/2026 ערב (אודיט-עמוק) · סונכרנה: ישי ✓ (העותק החי `~/.claude/scheduled-tasks/regin-docs-sync/SKILL.md` עודכן זהה-בייט באותו סשן, 23/07/2026)

**מטרה (שודרגה 07/07/2026 לאודיט-סנכרון עמוק):** לסנכרן את כל התיעוד מול המציאות (קוד/DB) **ומול עצמו**, ומעל הכול — **לתפוס כל החלטה שהוכרעה ונשארה "פתוחה"/בערך-ישן במקום אחר** (לשני הכיוונים). קוראת הכול במלואו (לא skim), מסווגת כל ממצא בעץ-הכרעה (מכני→מתקנת · יש-מקור-הכרעה→מסנכרנת · עמום→שואלת), ומפיקה conflict-ledger.

**🕐 מתי להפעיל:** אחרי סיום צעד/מודול, לפני סגירת סשן עבודה, ותמיד לפני סגירת מודול / מיזוג גדול. כל ריצה = האודיט העמוק המלא (הכרעת ישי 07/07).

**הפרומפט הקנוני המלא (זה מה שיושב ב-SKILL.md; זה מה שמעתיקים בעת יצירה בחשבון חדש):**

```
---
name: regin-docs-sync
description: REG-IN: deep semantic sync-audit — reads every doc IN FULL plus all decision-bearing code/DB, verifies every §7/§6 decision propagated (both directions), classifies findings (mechanical=fix, ruled=sync, ambiguous=ask), outputs a conflict ledger. Read-only system health checks live in the separate regin-health-pulse routine.
---

🕐 מתי להפעיל: אחרי סיום צעד/מודול, לפני סגירת סשן עבודה, ותמיד לפני סגירת מודול / מיזוג גדול. כל ריצה = האודיט העמוק המלא.

You are running the recurring documentation sync-audit for the REG-IN project (React 19 + Vite + Supabase + Tailwind, Hebrew RTL, repo at the current working directory). You have no memory of any prior conversation — everything you need is below or in the repo itself.

GOAL: keep the project's documentation truthful — "does each doc match actual reality (code/DB)", "do the docs agree with EACH OTHER", and above all: **no decision that was already ruled may stay open or stale anywhere else** (in either direction). This is a semantic consistency audit, not a line-diff.

SCOPE NOTE: this routine only handles documentation truthfulness. It does NOT run lint/npm audit/outdated-deps/Supabase-advisors/git-status — that lightweight read-only check is a separate routine, `regin-health-pulse`, run independently so it stays cheap and can be triggered on its own.

STEP 0 — Merge-status check (do this FIRST, before trusting any local git state — added 08/07/2026 after a real incident): `git fetch origin --prune`, then check whether the current branch's tip is already an ancestor of `origin/dev` (`git merge-base --is-ancestor HEAD origin/dev` — exit 0 means yes) or whether `git log origin/dev --oneline -5` shows a merge commit for this exact branch name. **Local git log/status alone cannot detect this** — a human can merge the current branch's PR on GitHub mid-session, invisibly to a session that never fetches. If the current branch is already merged into `origin/dev`:
- Say so explicitly and prominently in the journal/report — do not silently proceed as if still pre-merge.
- Any further doc fixes this audit finds are still valid content, but they must NOT be piled onto the now-shipped branch as if it were still open. Recommend to Ishay: pull `dev` fresh and open a new small branch for these fixes (or, if they prefer, push more commits to the same branch name and open a second PR from it — their call, not this routine's).
- Never push or open a PR yourself either way — this routine stays docs-only per the hard safety boundaries below.

STEP 1 — Read reality and the full doc set (exhaustive — every doc IN FULL, no skimming):
- Docs: `docs/CLAUDE_CODE_LOG.md` · `STATUS.md` · `CLAUDE.md` (iron rules — rule 13 is the ripple checklist this audit enforces) · `README.md` (check its links/doc-map still point at real files) · `docs/guides/**` · `docs/micro_guides/*.md` (LIVING blueprints, English, `module-N.md` — Live Status Header, step table, Deviations log) · `.claude/skills/*/SKILL.md` + `.claude/skills/*/template.md` (the module-flow skills `module-blueprint`/`module-build`/`module-close` and the blueprint/closing templates that moved into them 23/07/2026 — verify their trigger phrasings, routing, and the discipline block that is identical-by-design ×3; `docs/templates/` no longer exists, so a doc still pointing there is drift to fix) · `docs/PROJECT_MASTER.md` (especially §6 + the full §7 registry) · `docs/CHANGELOG.md` (⛔ retired 23/07/2026 — read-only archive; verify the retirement banner is intact and nothing wrote new dated lines to it, but do NOT stamp it or expect updates) · `docs/architecture_and_qa_roadmap.md` (check its "חלק 0: מצב היישום" table) · `docs/claude_routines.md` (canonical routines — also diff against the 4 local SKILL.md files under `~/.claude/scheduled-tasks/*/SKILL.md`; per the dual-update protocol in its §4, drift on Ishay's side means a behaviour change missed his live copy — flag as a missed sync) · `docs/reference_spec/products_and_params.md` (the LOCKED Seed decisions at its top are a first-class ruling source).
- Decision-bearing code/DB — where ruled values physically live: `docs/schema.sql`, the cumulative state of `supabase/migrations/**`, `src/lib/**` (the SSOT layer per iron rule 14: pricing/customers/constants/permissions/validators), enforcement patterns in `src/modules/**` + `src/components/layout/**`, and seed values.
- Actual DB via the Supabase MCP (read-only): tables/RLS/functions + `params` rows (ruled values like VAT live there). If MCP access is not available this run — do NOT silently skip and claim success: proceed file-only and note in the journal: "DB check skipped (MCP not authenticated this run)".
- git as the recency oracle: `git log --oneline -20`, `git status --short`; and when a passage has no timestamp, use `git log -1 --format=%cd -- <path>` and `git log -p -S"<token>" -- <path>` to establish which side is newer.

STEP 2 — Decision-state audit (§7 + §6) — the core step:
- For every §7 item: parse its status (✅ ruled/closed vs open), the ruled value, date, owner.
- FORWARD (ruled → propagated): for every ✅-ruled item verify the ruled value is reflected in (a) the code/DB where it physically lives, (b) every other doc that mentions the topic, (c) every guide citing it — grep `§7.N` AND `מראת §7.N` across `docs/guides/**` + `docs/micro_guides/**`. Report every place still showing the old value or still calling it "open/TBD".
- BACKWARD (open-but-actually-done): for every still-OPEN item, check whether it was already implemented/ruled in code/DB/CHANGELOG/Seed. If yes → stale-open: with a clear dated ruling record it's Class 2 (sync it, citing the record); without one it's Class 3 (ask). NEVER close a §7 item on your own authority — rulings belong to Ishay (iron rule 1).
- §6 ↔ §7 ↔ "מצב נוכחי": the same fact must not be "done" in one place and "open" in another. Check §7's own header/batch notes still match the actual item mix.
- **Status-line tokens (added 08/07/2026):** every §7 item opens with a machine-readable code-span `` `status·type·module` `` (🟢סגור/🟡פתוח/🔵להנהון/⚪ממתין; types DB/מסך/לוגיקה/אוטומציה/הרשאות/תהליך). VALIDATE: (a) each item 1..N has exactly one token — a missing/duplicate token is a finding, and a token accidentally landing on a non-§7 numbered list (e.g. §1's truth-hierarchy list) is the exact bug caught on 08/07; (b) the token's status MUST agree with the item's narrative "סטטוס: **X**" — a mismatch is the drift this token exists to kill (clear ruling record ⇒ sync token to it, Class 2; else Class 3). The token is what makes §7 query-by-type (`grep 'פתוח·אוטומציה'`); a wrong token silently breaks that query. Riders: a closed item may carry `(↳פתוח)` = a real open concern living on a closed parent; when promoted to its own §7.71+ number, drop `↳פתוח` from the parent.
- **Cross-module debt (🚧, added 09/07/2026):** the 🚧/§6 mechanism (every `🚧 מN` micro-guide token ⟺ a byte-matching `🚧 מN` line in `PROJECT_MASTER.md` §6; §6 = the router a future module greps on open, `grep '🚧 מ<its-number>' §6` = every debt owed to it; 🚧 ≠ ⏳ deferred-decision ≠ 🕓 freshness-stamp; Stop-hook `check-docs-updated.sh` 0ג enforcement) is defined in CLAUDE.md iron rule 15 — this step audits it, it does not redefine it. FORWARD: for each micro-guide 🚧-token, `grep -F '🚧 מN' docs/PROJECT_MASTER.md`; a missing §6 line is a silent-debt finding (Class 2 — add it, citing the source micro-guide). The Stop hook blocks a session that leaves a 🚧 unregistered, but this routine catches drift the hook can miss (a debt hand-edited out of §6, or a guide not touched this session). BACKWARD: every §6 `🚧 מN` line should name its source module; a §6 🚧 with no traceable source is a soft finding (flag, don't delete).

STEP 3 — Cross-file consistency + structural integrity:
- Existing checks: the ACTIVE module's micro-guide Live Status Header ↔ STATUS.md's row ↔ actual code under `src/modules/NN_*/` ↔ PROJECT_MASTER's "מצב נוכחי"; no step left 🔨 without a note; "Last updated" not older than the module's newest code change; `claude_routines.md` ↔ the 4 live SKILL.md copies.
- Structural integrity: broken markdown tables (a row missing cells, two rows merged into one, a squashed `_(שורה חדשה כאן)_` marker), broken internal links, duplicate H1s across files.
- **LOG reference-sections drift (lesson 09/07/2026; the LOG is English since 12/07):** the reference sections of `docs/CLAUDE_CODE_LOG.md` (Operational Gotchas / Tech-debt / DB journal / Templates & hooks) are LIVING knowledge, not dated records — they rot silently while dated session entries stay frozen. Spot-check them against current reality: does "Open flags" still name items §7 has since closed (found stale 09/07 — pointed at VAT/address already ruled)? Does the hooks/templates description match the actual hook count + current template features (found stale 09/07 — described the 06/07 version)? A reference line contradicting reality = Class 1/2 fix (these are snapshots to refresh, NOT frozen dated entries — the "never rewrite dated entries" rule does not shield them). **After re-verifying a reference section, refresh its `🕓 reviewed DD/MM/YYYY HH:MM` header stamp to the run time** — each reference section carries a last-verified stamp; a stamp far older than today is itself the drift signal that nobody re-checked that section (added 09/07/2026 at Ishay's suggestion — makes stale reference-knowledge visible at a glance instead of hiding as identical-looking text).
- **LOG bloat gauge — MEASURE & FLAG only, never auto-compress (added 12/07/2026; the LOG is English since 12/07 — anchors are English):** the two size-bounded parts of `docs/CLAUDE_CODE_LOG.md` drift-by-growth silently (a bloated snapshot looks identical to a lean one). Measure each per the file's own Maintenance policy: (a) the "Current State" snapshot — lines between `## Current State` and the next `---`; target ~15, and a `DD/MM` date INSIDE it is an F4 smell (dated narrative leaked in). (b) the session-journal NARRATIVE — lines between `## Session Log` and the first `## Reference` (reference sections are exempt); trigger ~180, target ~150. (c) count `### `-session headers whose date is >3 days old and NOT already a `### 📦 Week …` bucket. If any threshold is exceeded → **raise a ⚠️ flag in the journal entry** ("snapshot/narrative over budget — needs compression in a human session") — do NOT compress here. Compression rewrites dated entries, which STEP 5 forbids for this routine (headless/hasty runs risk losing reference facts — see the deliberate decline that used to be recorded in the log's own tail); the actual compress+weekly-bucket is done by an approved human session per the "harvest before you delete" rule.
- Mirror convention (iron rule 13): any text tagged `🔗 מראת §7.N` that deviates from §7.N's current text = Class 2 (auto-sync FROM §7 — §7 is the declared SSOT). Any UNTAGGED restatement of a §7 decision = an "untagged mirror" finding — flag it for tagging (or conversion to a bare citation); do not sync it blindly until tagged.

STEP 4 — Classify every finding and act (the decision tree):
- Class 1 — mechanical drift (renamed file/path, badge, date, moved section; broken table structure whose original content is recoverable from git history): fix directly.
- Class 2 — an un-propagated decision (there IS a ruling record: a ✅ §7 item with date/owner, a dated CHANGELOG line, a locked Seed decision — OR the truth hierarchy `schema.sql` › reference_spec/אפיון › mockups › guides yields an unambiguous winner): sync the stale side to the ruling value, and cite in the journal BOTH the stale location AND the ruling source.
- Class 3 — genuinely ambiguous (same-tier sources conflict, no ruling record, git recency inconclusive): do NOT edit either side. If the run is interactive (a human is present / "Run now" inside a live session) — ask directly, one question per conflict, presenting both sides + your recommendation. If headless — write a prominent "⚠️ ממתין להחלטת ישי" block per conflict in the journal (both claims + file:line for each side + your recommended answer), and fix nothing.
- Anti-noise: before flagging any "conflict", check whether it is a DOCUMENTED intentional deviation (a ✅ §7 ruling, a "סטייה מ-5.x" note, an as-built note). Documented deviations are NOT conflicts — never re-flag them run after run (e.g. VAT 17→18, CAPTCHA removal). The frozen files under `docs/reference_spec/` are EXPECTED to disagree with later rulings — that is what the deviation notes are for.

STEP 5 — Auto-edit approval + historical-record exception: you may edit docs autonomously for Class 1+2 (status badges, STATUS.md's table, "מצב נוכחי"/"Current State" snapshots, DoD checkboxes, stale terminology, tagged mirrors). EXCEPTION: never rewrite a dated journal entry in `docs/CHANGELOG.md` or `docs/CLAUDE_CODE_LOG.md`'s session log — those are historical records (the ONE exception: repairing the broken table STRUCTURE of an entry — restoring lost cells verbatim from git history — is allowed and is not a content rewrite). Only the "Current State" snapshot (LOG) / "מצב נוכחי" (PROJECT_MASTER) gets rewritten; dated entries otherwise only get appended.

STEP 6 — Output + journal:
- Summarize the Class 1+2 fixes applied.
- Produce the CONFLICT LEDGER: a clearly-headed block listing every Class 3 item — even if empty ("0 קונפליקטים פתוחים"), so its absence is never ambiguous.
- Append ONE new dated entry (`DD/MM/YYYY HH:MM` from the system clock — never date-only) under `docs/CLAUDE_CODE_LOG.md`'s "Session Log" (newest-first) describing what was found/fixed/asked. If nothing needed fixing, write a short "no drift found, all clean" entry. If the JOURNAL NARRATIVE is over ~180 lines (measured per STEP 3's gauge — narrative only, reference sections exempt; the old "~250 whole-file" threshold was retired in F3 because it counted the exempt reference sections), **raise a ⚠️ flag that it needs compression in a human session** — do NOT compress dated entries here (STEP 5 forbids it for this routine). If you changed STATUS.md, also bump its "עודכן לאחרונה" line. If the run was interactive and conflicts were answered — apply the answers as Class 2 and record them.
- FRESHNESS STAMP (green runs ONLY — added 08/07/2026): if and only if this run ends with an EMPTY conflict ledger (0 open Class-3 items), stamp each core doc you fully audited — `STATUS.md`, `docs/CLAUDE_CODE_LOG.md`, `docs/PROJECT_MASTER.md`, `docs/db_roadmap.md` — with one header line: `✅ אומת-סנכרון: DD/MM/YYYY HH:MM (regin-docs-sync)` (replace the previous stamp line if one exists; never stack duplicates). *(`docs/CHANGELOG.md` was retired 23/07/2026 — it is a frozen archive; do NOT stamp it and do NOT expect dated updates. Verify only that its retirement banner is intact and nothing wrote to it.)* A run with open conflicts must NOT stamp anything — the stamp means "verified consistent", not "was visited". If you also verified canonical↔local SKILL sync, refresh the routines' 🕓 stamp lines in `docs/claude_routines.md` §2 accordingly.

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

Write your CLAUDE_CODE_LOG journal entry in **English** (the log is a Claude-facing file, English since 12/07/2026; Hebrew only as data — names/UI-strings/§7-refs). Keep the log entry concise — this is a maintenance log, not a report. *(This routine no longer writes to `docs/CHANGELOG.md` — it was retired 23/07/2026.)*
```

**גבולות בטיחות (תקציר):** רק תיעוד; לא נוגעת ב-`src/`, במיגרציות, ב-`reference_spec/`, ב-`.claude/settings*.json`, ולא מריצה git commit/push.

---

### 🩺 `regin-health-pulse`
> 🕓 עודכנה (קנוני): 07/07/2026 · סונכרנה: ישי ✓ (אומת-mtime ‏08/07/2026)

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
> 🕓 עודכנה (קנוני): 23/07/2026 — הוסר `docs/CHANGELOG.md` ממקורות הודעת-הקומיט (הקובץ הוקפא) · קודם: 07/07/2026 ערב · סונכרנה: ישי ✓ (העותק החי עודכן זהה-בייט באותו סשן, 23/07/2026)

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
  c. Otherwise, stage everything: `git add -A`. ⚠️ This captures the ENTIRE working tree. This routine assumes Ironclad Rule 16 (it runs only when no other Claude session has uncommitted work), so the tree should contain only the change you intend to ship. If the staged set clearly includes files unrelated to a single coherent change (e.g. another session's in-progress work), do NOT invent a commit message that misrepresents them — commit only if it is all one coherent change; otherwise STOP, do not commit, and report the full staged file list for a human to sort out.
  d. Write a real commit message in Hebrew, in the imperative/summary style already used in this repo's history (check `git log --oneline -5` for tone) — summarize what actually changed by looking at `git diff --stat --cached` and, if relevant, the newest entries in `docs/CLAUDE_CODE_LOG.md`. Do NOT use a generic message like "update files". End the commit message with a clear automation tag on its own line: `🤖 Auto-committed by regin-pr-gate (verify green)`.
  e. Commit: `git commit -m "<message>"`.
  f. Push with `git push`. If there is no upstream yet, use `git push -u origin <current-branch>` instead. Do NOT ever use `--force` or `--force-with-lease` — if the push is rejected because the remote has diverged, STOP and report exactly what git said; do not attempt to merge, rebase, or force-push to resolve it yourself.
  g. Never run `gh pr create` or open a pull request — that stays a manual, human-initiated step. Report success and that a PR can now be opened.

STEP 4 — Report your result in Hebrew, concise and direct — this is meant to be read in seconds. State clearly which of these happened: verify failed (with diagnosis) / verify passed but on a protected branch (no commit) / verify passed, nothing to commit / verify passed and committed+pushed (with the commit message and branch name) / push was rejected (with the exact git error). When you committed, also list the files that were committed (from `git diff --stat` of the commit) so an accidental sweep of unrelated or parallel-session work is caught immediately.

HARD SAFETY BOUNDARIES (do not violate these under any circumstance):
- The protected-branch check in Step 3a is absolute — `main`/`master`/`dev` NEVER get an automatic commit or push from this routine, no matter what verify says.
- Never use `git push --force` or `--force-with-lease`, ever, on any branch.
- Never run `eslint --fix`, `prettier --write`, `npm run format`, or any auto-fixing command on a failing verify — diagnosis only, no code edits, no config edits.
- Never run `npm install` or change dependencies.
- Never run `gh pr create`, `gh pr merge`, or any GitHub API write — PR creation is a manual step, always.
- Never edit `.claude/settings.json` or `.claude/settings.local.json`.
- If `npm run verify` itself is missing or the repo is in an unexpected state (e.g. package.json doesn't have a `verify` script) — say so plainly rather than guessing or trying to reconstruct it yourself.
- Note: this repo's hooks live as bash scripts under `.claude/hooks/` (`.claude/settings.json`, shared via git, only points at them): the Stop hook `check-docs-updated.sh` is **session-aware** (07/07/2026) — it blocks session end only if THIS session edited files via Edit/Write/NotebookEdit (tracked by a per-session marker under the repo's git dir; since 07/07 evening the marker records only edits to paths INSIDE the repo tree — plan files/scratchpad edits don't count) AND `docs/CLAUDE_CODE_LOG.md`/`STATUS.md` are older than this session's last such edit; a session that only ran shell/git commands (no Edit/Write) records no marker and is never blocked. It also blocks if code under `src/modules/NN_*/` changed without the matching `docs/micro_guides/module-N.md` being updated. The PreToolUse hook `protect-frozen-files.sh` blocks any edit/delete of the frozen spec exports (C5/C6). Since this routine changes files only via git/shell (not Edit/Write), it normally records no marker and the Stop hook won't block it — but if it ever does block after your auto-commit, add a brief journal line to `docs/CLAUDE_CODE_LOG.md` (and confirm STATUS.md is accurate), then let the re-check pass. These are existing repo safety nets, not something to route around.

Respond in Hebrew, concise and direct.
```

**גבולות בטיחות (תקציר):** לעולם לא commit/push על `main`/`dev`; לעולם לא `--force`; לא מתקנת קוד על verify אדום; לא פותחת PR.

---

### 🧪 `regin-e2e-check`
> 🕓 עודכנה (קנוני): 11/07/2026 (שורת-הכיסוי → מודולים 1–2, טריגר-צמיחה בסגירת-מ2; הפרומפט עצמו גנרי — לא נגעו) · סונכרנה: ישי ✓ (העותק החי כבר גנרי — נבדק 11/07/2026, אין דריפט)

**מטרה:** להריץ את חבילת ה-E2E האמיתית (Playwright) ולדווח תקציר עברי pass/fail. **כיסוי היום: מודולים 1–2** (‏`auth`+`permissions`+`customers` ‏spec-ים; 2 ספי finance/logistics מדלגים-בחן עד `E2E_FINANCE_*`/`E2E_LOGISTICS_*` — עודכן 11/07/2026 בסגירת-מ2; התרחבות = ראה "טריגרי צמיחה" בסעיף 4 למטה).

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

## 3. איך יוצרים את הרוטינות במחשב/חשבון Claude חדש

**מדריך ההקמה המעשי:** [reference/claude_routines_setup](guides/reference/claude_routines_setup.md) — שם הפרומפט להדבקה וסדר הצעדים. הסעיף הזה מסביר רק את המנגנון.

מדביקים ל-Claude Code (בתוך תיקיית הריפו המקומית) פרומפט שמפנה לקובץ הזה. Claude קורא אותו, ולכל אחת מ-4 הרוטינות — יוצר משימה מתוזמנת חדשה (**Manual בלבד, בלי cron**) בשם המדויק (`regin-docs-sync` וכו'), עם תוכן ה-SKILL.md המדויק שמופיע כאן בכל בלוק קוד. הפרטים הטכניים ("איפה זה נשמר, איזו פקודה") — Claude Code כבר יודע לבד.

**בדיקת קבלה מהירה:** אחרי היצירה, מריצים את `regin-health-pulse` פעם אחת — היא read-only ומהירה, והצלחה שלה (שורת יומן חדשה ב-`docs/CLAUDE_CODE_LOG.md` + הסשן מסתיים בלי חסימה) מוכיחה שהרוטינה נוצרה תקין ורצה מקצה-לקצה. (הערה: ה-Stop hook המודע-לסשן **מדלג** על health-pulse — היא עורכת רק את היומן, קובץ שמוחרג מסימון-העריכה, אז אין לה מרקר; זה מכוון ותקין.)

⚠️ **הערת תצוגה:** ‏`list_scheduled_tasks` **כן מציג** את הרוטינות שנוצרו (אומת 08/07/2026; באג-התצוגה הישן שבו הכלי החזיר ריק — חלף). בכל מקרה, **היעדרות מהרשימה אינה כשל יצירה** — האימות האמיתי הוא בדיקת-הקבלה למעלה (הרצת `regin-health-pulse` בפועל).

---

## 4. פרוטוקול עדכון — איך Claude שומר את הרוטינות מסונכרנות

1. **הקובץ הזה (`docs/claude_routines.md`) הוא המקור הקנוני — וקבוע.** עותקי ה-`SKILL.md` המקומיים (`~/.claude/scheduled-tasks/<name>/SKILL.md`, בכל מחשב בנפרד, מחוץ ל-git) הם **מופעים חיים** של הקנוני, לא תחליף לו. **הקובץ הזה לא נמחק אחרי אונבורדינג** — הוא הגיבוי היחיד (העותקים החיים מחוץ ל-git, בלי היסטוריה/שחזור), מקור-השחזור למחשב חדש/התקנה-מחדש, המול-להשוואה של `regin-docs-sync` לזיהוי דריפט, והרשומה המשותפת היחידה לתיאום בין שני המפתחים. מחיקתו תשבור את כל אלה.
   - **פרוטוקול עדכון דו-צדדי (מ-07/07/2026):** כל שינוי ב**התנהגות** של רוטינה — Claude מעדכן **גם** את הקובץ הקנוני כאן **וגם**, בסשן של ישי, את 4 קבצי ה-SKILL.md החיים של ישי (`~/.claude/scheduled-tasks/regin-*/SKILL.md`) — כך הצד של ישי לא דורף. **וכן (מ-08/07/2026): את שורת-החותמת 🕓 בראש סעיף-הרוטינה כאן** (עודכנה/סונכרנה) — חותמת בלי עדכון-בפועל היא שקר; ‏`regin-docs-sync` מאמתת אותן מול mtime בכל ריצה ומדווחת על דריפט canonical↔local כרשת-ביטחון.
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
