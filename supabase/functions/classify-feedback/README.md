# `classify-feedback` — the module-11 classification engine

Classifies the customers' free-text feedback notes (`projects.feedback_notes`) with a Gemini model
and writes one row per project into `feedback_ai_insights`, under one `feedback_ai_runs` row.
Report 20 ("ניתוח הערות") shows nothing until a run is approved by `approve_feedback_ai_run`
(`edit` on `'דו"חות'`) — this function never approves anything.

Spec anchors: `docs/specs/module_11_reports/processes-approved.md` card **ת2** ·
`stage2-cards/cards-customers.md` **מ22** · `docs/micro_guides/module-11.md` §4.3–4.5, §6 step 2ב.2 ·
migration `supabase/migrations/20260916043300_module11_a_feedback_ai_tables.sql`.

## Request

`POST /functions/v1/classify-feedback`, `Authorization: Bearer <user JWT>`.

```json
{ "action": "start" }
{ "action": "continue", "run_id": 7 }
```

- `start` — refuses if any run is `running`; creates a run and classifies every candidate note.
- `continue` — resumes a run left in `partial`; sends only what is still unclassified.

## Response

```json
{ "status": "done" | "partial" | "failed" | "noop", "run_id": 7, "ok": 400, "failed": 26, "remaining": 0 }
```

- `ok` = rows written with `unclassifiable = false`; `failed` = rows written with
  `unclassifiable = true` (the card's *"לא ניתן לסווג"*); `remaining` = candidates with no row yet.
- `noop` (additive, not in card ת2): nothing left to classify, so **no run row is created** — an
  empty run would demand a human approval over nothing.
- `feedback_ai_runs.sent_count` is the progress bar's denominator (`"נעצר: 300/426"`), fixed when
  the run opens; `ok_count` / `failed_count` are updated after every batch.
- `provider_error` — **present only when a run stopped on a provider fault**: the provider's own
  response body, trimmed to 600 characters (`(empty body)` when it wrote nothing). It is also
  `console.error`-ed. This exists because three seeding runs died on `gemini responded 500` with the
  body discarded, so nobody could say *why*; the body named the cause in one sentence. It cannot
  contain the key — the key travels in the `x-goog-api-key` request header and is never echoed.

## Candidate population (the exact filter)

`public.projects` where `feedback_status = 'completed'` **and** `feedback_notes` is not null and
not blank **and** the project has no row in `feedback_ai_insights` at all
("הערה מסווגת פעם אחת בחייה" — card ת2). Measured live 16/09/2026: **426**.

`feedback_score` is **not** part of the filter (the task file's wording said it was): card מ22 §③
defines the 426 as notes + `completed` only, and that is the denominator the bar shows — a narrower
engine population could never reach 100 %. All four variants return 426 today, so the choice
changes nothing now; a note without a score would be sent with `score: null`.

## The four gates, in this order (the order is a contract)

| # | Gate | Failure | HTTP | Message | Run row created? |
|---|---|---|---|---|---|
| 1 | `GEMINI_API_KEY` present | missing secret | **500** | `מפתח ה-AI לא הוגדר במערכת — פנה למנכ"ל` | **no** |
| 2 | `Authorization` → `auth.getUser()` | missing/invalid JWT | **401** | `לא מחובר.` | no |
| 3 | `edit` on `'דו"חות'` (two queries, filtered by `role_id`, `status='active'`) | blocked identity | **403** | `אין לך הרשאה להריץ ניתוח.` | no |
| 4 | body validation — **only after gate 3** | bad `action` / `run_id` | **400** | `גוף הבקשה אינו תקין.` | no |

Gate 3 before gate 4 is load-bearing: otherwise a blocked user gets `400` and learns she *would*
have passed (`send-email` :95-99, locked by `e2e/quote-email.spec.js`).

## The failure paths that matter (card ת2 (א)–(ד))

| Case | Result | HTTP |
|---|---|---|
| provider **5xx** mid-run | retried in place up to 3 attempts (waits 2 s, 5 s, and only if they fit the run budget); if all three fail → `partial`, everything classified so far is kept, bar reads `נעצר: N/M · [המשך]` | 200 |
| provider **429** (quota) mid-run | **not** retried in place — the provider's own retry-after is ~45 s, longer than the whole 90 s run budget, and each retry burns another request from the quota that just ran out. Run → `partial`; `[המשך]` is the backoff. ⚠️ **And when the exhausted quota is a *daily* one (`RPD`), `[המשך]` does not help either that day** — the fix is a different model or a paid tier, not a longer wait | 200 |
| timeout / network mid-run | run → `partial`, same as above | 200 |
| provider 400/401/403 (our request shape or the key) | run → `failed` — no amount of `[המשך]` fixes it | 502 |
| invalid JSON for one comment | that row is written `unclassifiable = true`, `quote = "לא ניתן לסווג (שגיאת-פורמט)"`, **the run continues** | 200 |
| invalid JSON for the **first** batch | run → `failed` — a systemic shape fault, not 426 unreadable customers | 502 |
| double click | second call refused while the first is `running` | 409 |
| `continue` on a run already approved | refused — approval means a human saw *this* batch | 409 |
| self-imposed 90 s budget reached | run → `partial`, same as a quota hit | 200 |

A run that stopped without saving a single row is `failed`, never `partial` — `partial` means
"some was saved", and `approve_feedback_ai_run` accepts `partial`, so an empty `partial` would open
report 20 on zero rows.

## Secrets and privacy

- `GEMINI_API_KEY` — Supabase Secrets only (🧩 Ishay's step 2ב.1). Read with `Deno.env.get`, sent in
  the `x-goog-api-key` header, never logged, never in a URL, never in a response.
- `GEMINI_MODEL` — optional override of the default `gemini-3.5-flash-lite`; the model that actually
  ran is stored in `feedback_ai_runs.model` (runs 1–5 record `gemini-3.8-flash`, run 6 the new
  default — the column is why the switch left no ambiguity about which run was classified by what).
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — provided by the platform.
  Reads and writes to the two AI tables go through the **service-role** client: migration A ships
  read policies only, by decision (card ת8 §3; the `email_log` precedent in `send-email`).
- The model receives **text and score only** (§4.5) — no customer name, no money, no project name,
  and not even `project_id`: each batch item carries a local index `0..BATCH_SIZE-1` (today `0..29`),
  mapped back locally.
- `feedback_notes` is third-party text: instructions live in `system_instruction`, the notes travel
  as JSON inside `input`, never concatenated into an instruction sentence (מ22 §⑨).

## Provider call — the shape that actually classified rows, 16/09/2026

```
POST https://generativelanguage.googleapis.com/v1beta/interactions
x-goog-api-key: <GEMINI_API_KEY>
{
  "model": "gemini-3.5-flash-lite",
  "input": "<JSON string: {\"comments\":[{i,score,text}…]}>",
  "system_instruction": "<the classification rules>",
  "response_format": { "type": "text", "mime_type": "application/json", "schema": <JSON Schema> },
  "generation_config": { "temperature": 0, "thinking_level": "minimal" }
}
```

Response text is read from `steps[].content[].text`. `BATCH_SIZE` is **30**.

✅ **This is no longer doc-sourced: it is measured, twice, on two different models.** Run 5
(16/09/2026 03:06 UTC, `gemini-3.8-flash`, batches of 20) classified **40 notes**; **run 6**
(16/09/2026 04:23 UTC, `gemini-3.5-flash-lite`, batches of 30, `thinking_level: "minimal"`)
classified the remaining **386 in 13 requests across two invocations and reached `done`** — 386 ok,
0 failed, **no 429 at all**. So the endpoint, both model ids, `response_format`,
`system_instruction`, `input`-as-JSON-string, **`generation_config.temperature`** and
**`generation_config.thinking_level`** are all accepted by the live API, and
`gemini-3.5-flash-lite` honours the JSON-Schema structured output even though the structured-output
page demonstrates only `gemini-3.8-flash` and `gemini-3.1-pro-preview`. The 11/09 shape recorded in
the micro-guide (`generationConfig.responseMimeType` + `responseSchema` on `:generateContent`) was
never used.

Doc sources, all read 16/09/2026: <https://ai.google.dev/api/interactions-api-v1> (the field table —
`model`, `input`, `system_instruction`, `response_format`, `generation_config`; `generation_config`
lists `thinking_level` and does **not** name `temperature`) ·
<https://ai.google.dev/gemini-api/docs/structured-output> ·
<https://ai.google.dev/gemini-api/docs/models> (lists both `gemini-3.8-flash` and
`gemini-3.5-flash-lite` as stable; the release notes date `gemini-3.5-flash-lite` GA **21/07/2026**,
making it the newest flash-lite) ·
<https://ai.google.dev/gemini-api/docs/thinking> (the per-model table: `gemini-3.5-flash-lite`
default `minimal`, allows `minimal | low | medium | high`; `gemini-3.8-flash` allows only
`low | medium | high` — which is why `THINKING_LEVEL_BY_MODEL` is a map and not a constant) ·
<https://ai.google.dev/gemini-api/docs/rate-limits> · <https://ai.google.dev/gemini-api/docs/pricing>
(both flash and flash-lite are free-tier eligible) ·
<https://ai.google.dev/gemini-api/docs/text-generation>.

### The three live failures, and what each one taught

1. **`HTTP 500` — the one that killed runs 1–4.** Body, verbatim:
   *"gemini-3.8-flash is currently experiencing high demand, spikes in demand are usually temporary.
   Please try again later."* Not our request shape and not the key: **the same body classified 40
   notes two minutes later.** ⇒ 5xx is now retried in place (2 s, 5 s, budget-permitting). Without
   it a single spike on batch 1 leaves the run `failed`, and `continue` accepts only `partial`, so
   the run row is dead and the CEO must start a new one.
2. **`HTTP 429` — the free-tier quota.** Body, verbatim:
   *"You exceeded your current quota … Quota exceeded for metric:
   generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model:
   gemini-3.8-flash. Please retry in 42.287558704s."* ⇒ 429 is deliberately **not** retried in
   place: the retry-after the provider names was measured between 19 s and 46 s — half the entire
   90 s run budget for one batch — and **waiting far longer did not help either: after 5.5 minutes
   of complete silence a single request returned 429 again.** Each in-place retry would also spend
   another request from the very quota that ran out.
3. **The `limit: 20` turned out to be a *daily* quota, and that is what actually unblocked this.**
   The 5.5-minute silence had no effect because `RPD` resets at midnight Pacific, not on a rolling
   window — Google's own public forum thread is titled *"Gemini 3.8 Flash Free Tier 20 RPD Is Too
   Limited for Practical Evaluation"*. ⇒ **no `[המשך]` could have finished the seeding that day on
   that model.** The fix was the model, not the waiting: `generate_content_free_tier_requests` is a
   **per-model** metric (the model id is inside the quota message itself), so
   `gemini-3.5-flash-lite` draws from its own bucket. Run 6 then finished all 386 remaining notes in
   **13 requests with zero 429s**, which is the measurement that closes this.

### What is *not* verified

1. **The numeric free-tier quota of `gemini-3.5-flash-lite`.** Google **removed the per-model
   free-tier RPM/TPM/RPD table from the docs** — <https://ai.google.dev/gemini-api/docs/rate-limits>
   now says limits *"can be viewed in Google AI Studio"* and links
   <https://aistudio.google.com/rate-limit>, which needs a signed-in account. So the claim behind
   the model switch is **not** "flash-lite has quota X"; it is the two things that *are* checkable:
   the quota metric is per-model (so the bucket is fresh), and the docs position flash-lite for
   *"high-volume automation"*. **What replaced the guess is the run itself: 13 requests, 0 refusals.**
   A future seeding of a much larger corpus could still hit a ceiling nobody has read.
2. **Per-batch latency and cost were observed once, not profiled.** Run 6: 100.5 s for the first
   invocation (9 batches inside the 90 s budget, then a clean `partial`) and 41.1 s for the second
   (4 batches) — roughly **10 s per 30-note batch**, versus ~20 s per 20-note batch on
   `gemini-3.8-flash`. One sample, one time of day.
3. **The prompt-injection defence** (instructions in `system_instruction`, notes as data inside
   `input`) has still not been tested against an adversarial note.
4. 🔴 **`quote` is "verbatim" in 425 of 426 rows, not 426.** Measured with
   `position(quote in feedback_notes) > 0` over both approved runs. The single miss is project
   **1249**, where the model returned `ממוينים` — a **Hebrew word with one Arabic YEH (U+064A)
   substituted for the Hebrew YOD (U+05D9)**. It renders almost identically, compiles fine, and no
   CHECK constraint can see it. ⇒ **a quote that looks copied is not proof that it was copied**; if
   report 20 ever presents `quote` as "the customer's own words", it needs that `position(...)`
   test as a real guard, not as a one-off audit.

## Type check

```
deno check --node-modules-dir=none supabase/functions/classify-feedback/index.ts
```

Runs in CI as a second step of the `edge-function-check` job. Prettier formats this file —
`.prettierignore` excludes `supabase/migrations`, `docs`, `*.md` and build output, but **not**
`supabase/functions` — so `npx prettier --check` on `index.ts` must pass too. ESLint and knip do
not reach it (both are scoped to `**/*.{js,jsx}` and `src/` respectively), so `deno check` plus
Prettier are the whole gate for this file.

## Running it by hand (no secrets on the command line)

Deploy is the orchestrator's step (`supabase functions deploy classify-feedback`), and
`GEMINI_API_KEY` is installed by Ishay in the dashboard — never from a shell history.

The verifier's calls, with the JWT taken from an environment variable that is never echoed:

```bash
# $SB_URL = https://<project>.supabase.co ; $JWT = a signed-in user's access token
curl -s -X POST "$SB_URL/functions/v1/classify-feedback" \
  -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' \
  -d '{"action":"start"}' -w '\nHTTP %{http_code}\n'

curl -s -X POST "$SB_URL/functions/v1/classify-feedback" \
  -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' \
  -d '{"action":"continue","run_id":1}' -w '\nHTTP %{http_code}\n'

# gate 2 — no Authorization header at all ⇒ 401
curl -s -X POST "$SB_URL/functions/v1/classify-feedback" \
  -H 'Content-Type: application/json' -d '{"action":"start"}' -w '\nHTTP %{http_code}\n'

# gate 3 before gate 4 — an identity WITHOUT edit on 'דו"חות', empty body ⇒ 403 (not 400)
curl -s -X POST "$SB_URL/functions/v1/classify-feedback" \
  -H "Authorization: Bearer $JWT_VIEWER" \
  -H 'Content-Type: application/json' -d '{}' -w '\nHTTP %{http_code}\n'
```

Locally: `supabase functions serve classify-feedback --env-file supabase/functions/.env.local`
(that file is git-ignored and holds `GEMINI_API_KEY`; it must never be committed).
