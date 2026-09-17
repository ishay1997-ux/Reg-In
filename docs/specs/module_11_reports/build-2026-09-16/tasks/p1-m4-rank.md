# Task P1-C · The module-4 write of `recommended_rank` (module 11, step 1.5) — code + unit tests

**Session type:** build, test-first, on MERGED module-4 code. **Repo:** `C:\Users\ishay\Reg-In`, branch `ishay/module-11-build`. Several agents write to the same tree — write ONLY the files listed below. **Never commit.** Report in English.

## 🔴 The one top mine
`writeInviteToken` is the **resend / token path** and is **imported by module 6** (`src/modules/06_projects/api.js`, `sendDateChangeReinvites`). **Do not touch it.** The rank is written **once, on insert, in `insertInviteRow` only**. Before reporting, prove it: `git diff --stat` shows no change to `writeInviteToken`, and `grep -n "writeInviteToken" src/modules/06_projects/api.js` still resolves to the unchanged export. Report both.

## Read first, in this order (MUST)
1. `docs/micro_guides/module-11.md` — **`## 2ב. 🔒 Build conventions`** in full, then §6 **step 1.5** in full (the table "What the old version said / What is actually there" and "The executable version" 1–4 and its Verify list). That step IS your spec.
2. `src/modules/04_hostesses/CLAUDE.md` — the module's own traps.
3. `src/modules/04_hostesses/api.js` — `createShiftInvites` · `insertInviteRow` · `writeInviteToken` (read the whole invite path).
4. `src/modules/04_hostesses/SmartMatchPage.jsx` — where `ranked` (= `rankCandidates(...)`, the system's score order) becomes `candidates` (= `sortByAngle(...)`, the manager's lens); where `createShiftInvites({ projectId, hostessIds, origin })` is called; the row-menu `NEW_INVITE` path.
5. `src/lib/smartMatch.js` (`rankCandidates`) and `src/lib/sortAngles.js` — to derive rank = position in `ranked` (1-based).
6. Existing tests around these: `src/modules/04_hostesses/*.test.js*` (list them with Glob) — copy their mocking style (`vi.mock('@/supabaseClient')`).
7. `docs/db_roadmap.md` row **M11-4** (line ~301) and `processes-approved.md` card **ת5** (line 580–590) — the product rule: written once at invite time, not overwritten on resend, failed write must not fail the invite (`NULL` + `console.warn`), no back-fill.
Probably NOT needed: the reports spec, mockups, other modules.

## Constraints
- The DB column `assignments.recommended_rank` **does not exist yet** when you run (another agent authors migration B; the orchestrator applies it after you finish). ⇒ Your unit tests mock Supabase. **Do not run E2E** — the orchestrator runs `e2e/hostesses.spec.js` + `e2e/smart-match.spec.js` after the column is live.
- "A failed rank write must not fail the invite": implement so that a failure attributable to the rank (e.g. Postgres `42703` undefined column, or a CHECK violation on the rank) **retries the insert without the rank** and `console.warn`s — the invite still goes out. Test this path with a mocked first failure.
- Signature change is allowed ONLY as step 1.5 says: `createShiftInvites` gains one **optional** argument `ranks` (`hostessId → rank` map). Absent ⇒ every row `NULL`. All existing callers keep working unchanged.
- Physical Tailwind utilities only if you touch JSX; Hebrew why-first comments (`src/CLAUDE.md`).

## Files you may write
`src/modules/04_hostesses/api.js` · `src/modules/04_hostesses/SmartMatchPage.jsx` · the existing test files next to them (or one new `*.test.js` beside `api.js` if none covers the invite path). Nothing else.

## Verify (all of it, and paste outputs)
1. Unit: Smart-Match invite writes `recommended_rank` from `ranked` (1-based position) · a **resend** leaves it unchanged (prove `writeInviteToken` payload has no rank) · a row-menu `NEW_INVITE` for a hostess filtered out of the list ⇒ `NULL` · a forced rank-write failure still inserts the invite (retry without rank + warn) · `ranks` absent ⇒ `NULL`.
2. `npx vitest run src/modules/04_hostesses src/modules/06_projects src/lib/smartMatch.test.js src/lib/sortAngles.test.js` — paste the summary line.
3. `npx eslint <changed files>` and `npx prettier --check <changed files>` — clean.
4. `perl -ne '$n+=tr/
//; END{print "CR=$n
"}' <file> prints CR=0 (measured 16/09: `grep -c $'
'` returns wrong numbers in this Git Bash — never use it)`.

## Output (final message = data)
- `files_changed`, `diff_summary` (functions touched, signature change).
- `as_built`: two or three English sentences ready to paste as the micro-guide's `↳ as-built` line for step 1.5 (what deviates from the step text, if anything).
- `test_results`: the exact summary lines.
- `not_verified` (must include: E2E not run — column not live yet) · `blind_spot` · `assumed`. Tag claims `אומת-על-ידי` / `דווח-לי` / `הנחתי`.

כל עובדה כאן ניתנת לערעור — אם מדדת אחרת, תקן אותי עם המדידה.
