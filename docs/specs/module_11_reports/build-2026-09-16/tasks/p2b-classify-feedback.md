# Task P2ב · The classification engine — Edge Function `classify-feedback` (steps 2ב.2, part of 2ב.3)

**Session type:** build. **Repo:** `C:\Users\ishay\Reg-In`, branch `ishay/module-11-build`. Other agents write elsewhere in the tree — write ONLY the files listed below. **Never commit. Never deploy** (the orchestrator deploys through MCP). Report in English; user-facing messages in Hebrew.

## 🔴 The one top mine
**The provider call is the one thing NOT frozen in the spec.** The micro-guide (step 2ב.2) says the Gemini Developer API shape recorded on 11/09/2026 — `x-goog-api-key` header · JSON mime type + response schema with `enum`/array fields — "is a starting point with a date on it, and a model id in particular will be stale". **Step 1 of your work is to open the current documentation** — use the `context7` MCP (`resolve-library-id` → `query-docs` for the Gemini API / `@google/genai` structured output) and/or `WebFetch` on https://ai.google.dev/gemini-api/docs/structured-output and https://ai.google.dev/api/generate-content — and confirm: endpoint · a current model id suitable for classification (cheap, deterministic) · the exact field names for structured output (`responseMimeType`, `responseSchema` / `responseJsonSchema`, `temperature`). **Write what you confirmed, with the URL and the date, in a comment at the top of the function.** Do not copy the guide's shape as fact.

## Read first, in this order (MUST)
1. `docs/micro_guides/module-11.md` — §2ב Build conventions in full · §4.3–4.5 · **§6 Phase 2ב: steps 2ב.1 · 2ב.2 · 2ב.3 · 2ב.4 in full** (the template table "From the template — copy this, it is load-bearing"; the decisions with their anchors; the failure paths to verify).
2. `supabase/functions/send-email/index.ts` — **the whole file** (214 lines): the request skeleton, the two-stage manual permission check (secret → JWT → permission BEFORE body validation → validation), how it creates its Supabase client, error shapes and Hebrew messages, the JSR pin.
3. `supabase/migrations/*module11_a*.sql` (already authored this session — Glob it): the exact columns of `feedback_ai_runs` and `feedback_ai_insights`, the two topic CHECK lists, the write-policy decision recorded in its `-- why:` header, and `approve_feedback_ai_run`.
4. `docs/specs/module_11_reports/processes-approved.md` card **ת2** (lines 549–570, read every row to its end) and ruling **1** (§🗳️ line 903).
5. `docs/specs/module_11_reports/stage2-cards/cards-customers.md` — **מ22** (line 471–610): §③ (what the run bar shows: `"נעצר: N/M · [המשך]"`, run stamp), §⑤ (the "הרץ ניתוח" / "אשר להצגה" interactions), §⑧ (states incl. *"טרם אושרה ריצת-ניתוח"*), item 20.7 (the 20 complaints with no negative tag).
6. `.github/workflows/ci.yml` — the `edge-function-check` job (it type-checks only `send-email`; you add one line for your function).
7. `supabase/migrations/20260904233000_feedback_multi_select_reasons.sql` — the two CHECK lists (verbatim into your enums).
Probably NOT needed (say so if opened): the other cards, mockups, `design-contract.md`.

## Tools
- Read/Grep/Glob/Write/Edit/Bash · `context7` MCP (ToolSearch `select:mcp__plugin_context7_context7__resolve-library-id,mcp__plugin_context7_context7__query-docs`) · `WebFetch` (ToolSearch `select:WebFetch`).
- Live DB **read-only** via MCP `execute_sql` (ToolSearch `select:mcp__5c4d90c8-bdb0-4e4a-bd64-299d0299d315__execute_sql`, project `yfeovxppnfoafmfbdfvh`): to count the notes (`projects.feedback_notes` non-empty — expect ~426) and to check the AI tables exist (they may not yet — the orchestrator applies migration A in parallel; if absent, take the columns from the migration file).
- Type check: try `npx -y deno check --node-modules-dir=none supabase/functions/classify-feedback/index.ts`; if `deno` cannot be obtained, say so — CI is then the check.
- 🚫 No secrets: never print, log, or hard-code a key. `GEMINI_API_KEY` is read with `Deno.env.get` only. 🚫 No deploy, no DB writes, no live provider calls.

## What to build (files you may write)
1. `supabase/functions/classify-feedback/index.ts` — Deno, same skeleton as `send-email`:
   - **Order is a contract:** missing `GEMINI_API_KEY` ⇒ `500` with a Hebrew message *"מפתח ה-AI לא הוגדר במערכת — פנה למנכ"ל"* **before anything else, and no run row is created** · no/invalid `Authorization` ⇒ `401` · permission gate `'דו"חות'` requires `edit`, checked with the **two-query, role_id-filtered** lookup from the template (`status='active'` included) **BEFORE body validation** ⇒ `403` · then validate the body.
   - Body: `{ "action": "start" | "continue", "run_id"?: number }`. `start`: refuse with `409` if a run is `running`; create a `feedback_ai_runs` row (`status='running'`, `model`, `run_by` = the caller's identity as the migration types it, `sent_count` = number of candidate notes); classify in **batches of 20** notes (`temperature 0`, structured JSON, `enum`s = the two CHECK lists verbatim; `sentiment` 1–5; `quote` one sentence; `red_flag`; `unclassifiable`), **write each insight row immediately** (upsert on `project_id`, `run_id` = this run) so a mid-run quota hit keeps what was classified; on provider error / quota / timeout ⇒ set the run `status='partial'` with the counts **before returning**, and return `{ status:'partial', ok, failed, remaining }`; on completion ⇒ `status='done'`, `finished_at`. `continue`: same, only for the notes not yet in `feedback_ai_insights` for that run. **Invalid JSON for one comment ⇒ that comment gets `unclassifiable=true` with `quote` = *"לא ניתן לסווג (שגיאת-פורמט)"` and the run continues.**
   - The model receives **text and score only** — no customer name, no money, no project name (§4.5).
   - Candidate population: `projects` with a non-empty `feedback_notes` (and a `feedback_score`), per card ת2 — state the exact filter in a comment and in your report; report the live count.
   - Writes go through the Supabase client the template uses (if it is the user's JWT, the migration's write policies must allow it — check migration A's decision; if service role, use `SUPABASE_SERVICE_ROLE_KEY` from `Deno.env` exactly as Supabase provides it, never printed). Every write checks the returned row count (`assertRowsAffected` pattern), never only the absence of error.
2. `.github/workflows/ci.yml` — add a second `deno check --node-modules-dir=none supabase/functions/classify-feedback/index.ts` step in the existing `edge-function-check` job (keep the comment style; one Hebrew line saying why).
3. `supabase/functions/classify-feedback/README.md` (short, English): what it does, the request/response shapes, the four failure paths and their HTTP codes, the secret name, how to run it locally, and the exact `curl` (without secrets) the verifier will use.
4. `<scratchpad>/results/p2b-classify.json` — your report (below).

## Verify before reporting
- `deno check` result (or the honest "not available locally").
- `grep -c "GEMINI_API_KEY" index.ts` ≥ 1 and `grep -n "Deno.env.get" index.ts` shows it is read, never logged.
- The order of the four gates is visible in the code as four consecutive blocks with Hebrew why-comments.
- `perl -ne '$n+=tr/
//; END{print "CR=$n
"}' <file> prints CR=0 (measured 16/09: `grep -c $'
'` returns wrong numbers in this Git Bash — never use it)` on every file you touched; `npx prettier --check supabase/functions/classify-feedback/index.ts` (Prettier does format this folder — `.prettierignore` excludes only migrations).

## Output (final message = the JSON you wrote to `results/p2b-classify.json`)
`{ "files", "provider": { "endpoint", "model_id", "config_fields", "doc_url", "confirmed_on" }, "population_filter", "live_note_count", "write_client": "jwt|service_role", "failure_paths": [ { "case", "http", "message", "run_row_created" } ], "batch_size", "ci_change", "not_verified", "blind_spot", "assumed" }`

כל עובדה כאן ניתנת לערעור — אם מדדת אחרת, תקן אותי עם המדידה.
