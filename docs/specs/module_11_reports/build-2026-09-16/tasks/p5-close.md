# Task P5 · Closing audit of module 11 — run `module-close` verbatim, in a fresh context, and DO NOT merge

You are a fresh session that did not build this module. Act as Senior QA Engineer, Security Auditor and Release Manager. **Repo:** `C:\Users\ishay\Reg-In`, branch `ishay/module-11-build`. Report in Hebrew to Ishay (chat + artifact), English in the micro-guide and LOG.

## What to run — exactly
1. Load the skill **`/module-close`** through the Skill tool, then read `.claude/skills/module-close/template.md` and **perform it exactly as written** with `MODULE_NUMBER=11 · MODULE_NAME=דו"חות מנהלים · BRANCH_NAME=ishay/module-11-build`. The template's persistence steps ARE yours (findings file `docs/micro_guides/close-findings-module-11.md`, DoD ticks, QA matrix, §9 rows, LOG entry, STATUS row, compaction, the HTML artifact with the three comprehension questions).
2. Then the four module-specific checks from the step guide's ⑥3 block (`docs/guides/modules/module_11_reports.md`, grep `⑥3`): **(1)** the 39 rulings of `processes-approved.md §🗳️` (lines 899–944) each mapped to a built step, an explicit deferral, or a "לא קורה" row — the denominator is the rulings list, not the guide · **(2)** the hand-computed acceptance numbers of `spec.md §🔢` verified **on the screen** (aging 35 · 10-13-8-1-3 · 236,382 ₪; Gini 0.40 case in the unit test) — never against a test the build wrote · **(3)** the onboarding layer: every `<Hint id>` in `src/modules/11_reports/**` resolves in `src/lib/onboardingCopy*.js` and every m11 key there is used (both directions, mechanically) · **(4)** the four conference stories of `seed-plan.md §1` against the five rules — sentence, page, number; rule ⑤: the page must be a built page.
3. Deviations the orchestrator already recorded — read them before you audit, so you do not rediscover them as new: `docs/micro_guides/module-11.md §9 D-9…D-13` and later rows, and every `↳ as-built` line in §6.

## Rules that differ from a normal close — Ishay's rulings 16/09/2026, recorded in `module-11.md §9 D-9`
- **The typed-echo DoD sign-off is waived** (*"על כולם — מיגרציות (~8) · חתימת-DoD · ריצת-הזריעה של הסיווג"*). Print the verdict and the DoD gate as the template says, and write beside it: *"ויתור על הד-ההקלדה — הכרעת-ישי 16/09/2026, חד-פעמי"*. Do not wait for a typed echo.
- **You never merge, push or open a PR** (unchanged). The orchestrator does that after reading your verdict.
- **One fix round only** (template §6b): if you find §6 blockers, list them FIX-READY (four fields each) and STOP with a `[NO]` verdict and the findings file in place — the orchestrator dispatches the fixers and re-runs you (or a fresh you) for the verdict. Do not fix code yourself.
- `rls_enabled_no_policy` is judged whole-DB: expect the five pre-existing deny-all tables (`login_attempts` · `login_rpc_calls` · `feedback_rpc_calls` · `project_changes` · `seed_registry`) **plus the six `bak_*` tables hardened on 16/09 (D-11, deliberate deny-all)** — each needs a written triage line, not a wave-through. `project_changes` and `seed_registry` were never triaged in writing: triage them now (are they DEFINER-only by design? measure who reads them).
- Model note: you are running on the strongest available model on purpose — the self-catch rate of the building session is zero by measurement; you are the outside reader.

## Tools
Read/Grep/Glob/Bash (tests, gate, `git`) · Supabase MCP read-only (`execute_sql`, `get_advisors`, `list_tables`) · Playwright for the live preview smoke with the `E2E_*` identities from `.env.local` (never print them) · the `Artifact` tool for the report page (load `/artifact-design` first) · `pr-review-toolkit:silent-failure-hunter` and a general-purpose agent for §2c/§3b as the template says.
🚫 No DDL, no DB writes, no `git commit/push/merge`, no `gh pr`.

## Output
The template's full report (Hebrew) + the artifact link + the findings file on disk + the persistence steps done. Final line: the verdict `[YES]`/`[NO]`, the branch head SHA it applies to (`git rev-parse --short HEAD`), and — for `[NO]` — the paste-ready opening line for the fixing session.
