# `draft-followup` — an AI-drafted follow-up email for a quote (never sent by the system)

Drafts a short Hebrew follow-up email for one quote with a Gemini model and returns it as **text**.
The quote-document dialog (`src/modules/03_quotes/QuoteDocumentDialog.jsx` → "נסחי מייל מעקב" →
`FollowupDraftDialog.jsx`) shows it editable, with `העתיקי` and `פתחי במייל` (`mailto:`).

🔒 **The system never sends it.** This function does not call `send-email`, Make or `email_log` —
there is no write of any kind here. A human copies the draft or opens her own mail client and sends.

Plan anchor: `docs/plans/2026-09-24-system-polish.md` §6 **D2** (approved by Ishay 23/09/2026 23:15,
*"מאשר הכל לפי המלצתך"*) · §6ה (UCD, wording, accessibility, measurable targets).
Template: `supabase/functions/classify-feedback/` (gate order, provider call, privacy decision).

## Request

`POST /functions/v1/draft-followup`, `Authorization: Bearer <user JWT>`.

```json
{ "quote_id": 31 }
```

## Response

```json
{ "draft": { "subject": "…", "body": "…" }, "to": "contact@example.com" }
```

- `to` = the email of the customer's **primary** contact (`customer_contacts.is_primary = true`) — the
  only source; the contact columns on `customers` were dropped (`n2d_drop_customers_contact_columns`).
  `null` when that contact has no email (or the caller cannot read contacts) — the dialog then disables
  `פתחי במייל` with the visible reason `אין מייל לאיש הקשר הראשי`.
- The body **has no signature**: the client appends `buildSenderSignature` (`src/lib/quotes.js`), the
  same block the quote email carries — so the user's name never reaches the model, and there is no
  second copy of the signature rules.

## The gates, in this order (the order is a contract)

| # | Gate | Failure | HTTP | Body |
|---|---|---|---|---|
| 1 | `GEMINI_API_KEY` present | missing secret | **500** | `{error: 'מפתח ה-AI לא הוגדר במערכת — פנה למנכ"ל'}` (byte-identical to `classify-feedback`) |
| 2 | `Authorization` → `auth.getUser()` | missing/invalid JWT | **401** | `{error: 'לא מחובר.'}` — with `verify_jwt` on, the platform gateway answers a missing header with 401 before the function runs |
| 3 | `edit` on `'הצעות מחיר'` (two queries filtered by `role_id`, `status='active'`) | blocked identity | **403** | `{error: 'אין לך הרשאה לנסח מייל מעקב.'}` |
| 4 | body validation — **only after gate 3** | `quote_id` not a positive integer | **400** | `{error: 'גוף הבקשה אינו תקין.'}` |

Gate 3 before gate 4 is load-bearing (the `send-email` / `classify-feedback` precedent): otherwise a
blocked user sending a bad body gets 400 and learns she *would* have passed.

`edit` and not `view`: every call spends the shared AI quota (the reason `classify-feedback` demands
`edit` on `'דו"חות'`).

## After the gates

| Case | HTTP | Body |
|---|---|---|
| quote not readable with the caller's JWT (RLS) or does not exist | **404** | `{error: 'ההצעה לא נמצאה, או שאין לך הרשאה אליה.'}` |
| quote is neither `in_progress` nor `rejected` with `rejection_reason = 'פג תוקף'` | **409** | `{error: 'אפשר לנסח מייל מעקב רק להצעה פתוחה, או להצעה שפג תוקפה.'}` |
| `in_progress` quote with no successful send in `email_log` | **409** | `{error: 'ההצעה עוד לא נשלחה ללקוח.'}` — the same sentence the dialog shows beside the disabled button |
| provider **429** (quota) | **429** | `{status: 'quota', error: 'הגעת למכסת ה-AI — נסי שוב מאוחר יותר.', provider_error}` — **not** retried |
| provider 5xx / timeout / network | retried **once** (1.5 s) if the 24 s budget allows, then **502** | `{status: 'failed', error: 'הניסוח נכשל — נסי שוב.', provider_error}` |
| provider 400/401/403, non-JSON, empty text, model JSON invalid | **502** | same `failed` body |
| model draft fails the guard (below) | **502** | same `failed` body, `provider_error` names the rule |
| database read error | **500** | `{status: 'failed', error: 'הניסוח נכשל — נסי שוב.'}` |

**409 is additive to the plan's contract** (which lists 400 · 401 · 403 · 404 · 429 · 502): an ineligible
quote is not a malformed body, and `classify-feedback` already uses 409 for "the resource is in the wrong
state". The dialog never calls in those states; the server enforces the same rule the screen shows.

`provider_error` is diagnostics only (the provider's own body, trimmed to 600 characters, or the guard
rule that failed). The dialog shows only `error`. It cannot contain the key (the key travels in the
`x-goog-api-key` header and is never echoed) and cannot contain customer data (see below).

**Never an empty draft:** every path that does not produce a checked, filled subject and body answers
with an error, and the dialog shows the error — never a blank editor.

## Privacy — the same decision as `classify-feedback` (`README:93-95` there)

The model receives **placeholders and non-identifying facts only**:

```json
{
  "status": "pending" | "expired",
  "event_passed": false,
  "days_since_sent": 27 | null,
  "placeholders": ["{{איש_קשר}}", "{{אירוע}}", "{{תאריך}}", "{{תוקף}}"]
}
```

- No contact name, company name, event name, date, amount, `quote_id` or `customer_id` leaves the
  system. **The server fills the placeholders after the answer**, with values it read under the
  caller's RLS.
- A placeholder is offered only when its value exists (no primary contact ⇒ no `{{איש_קשר}}`; a
  missing or non-integer `ימי_תוקף_הצעה` ⇒ no `{{תוקף}}` for a pending quote — never a silent
  default of 30).
- `{{תוקף}}`: pending ⇒ the UTC day of `updated_at` + `ימי_תוקף_הצעה` — the exact formula of
  `deriveQuoteExpiry` (`src/lib/quotes.js`), copied (Deno cannot import `src/`); expired ⇒ the UTC day
  of `updated_at`, which *is* the expiry day: the expiry job writes the rejection, `moddatetime`
  stamps it, and `quotes_lock_non_in_progress` forbids any later update.
- `event_passed` (additive to the plan's facts, 24/09/2026): **measured, all 33 expired quotes have an
  event date that has already passed.** "Check whether it is still relevant and renew" is nonsense for
  an event that took place, so the prompt then asks about an upcoming event instead. One boolean, no
  date. Reversible: drop the field and the prompt line.
- Nothing is written anywhere, and nothing but the model text before filling (placeholders only) is
  ever logged.

## The draft guard (what does not pass never reaches the screen)

After the model answers and **before** filling, both subject and body must:

1. be non-empty;
2. contain only the offered placeholders — an invented `{{מחיר}}` would otherwise reach the screen as
   raw braces;
3. contain no money or discount marker (`₪` · `%` · `ש"ח` · `שקל` · `הנחה` · `הנחות`) — the prompt forbids
   inventing a price or a discount, and a draft that does is a commitment nobody approved;
4. be at most 2,000 characters.

A failure is a 502 `failed` ("נסי שוב"), not a silently trimmed draft.

## Wording (the prompt)

Hebrew · business-polite, warm, not fawning · **gender-neutral** (the email goes to a customer — style
guide §6: *"במסמך ובמייל ללקוח היא ניטרלית"*; the feminine imperative belongs to the screens) · 4–6
short lines · opens with `שלום {{איש_קשר}},` · ends with `בברכה,` and no name · pending ⇒ "are there
questions" + valid-until · expired ⇒ "is it still relevant, shall we renew" · event passed ⇒ "an upcoming
event we can help with". `temperature` 0.4 (an email should sound human; there is no agreement metric
to protect, unlike classification).

## Secrets

- `GEMINI_API_KEY` — the same Supabase secret `classify-feedback` reads. **There is no way to read a
  secret back**; the proof that it is installed is behavioural: the function does **not** answer 500
  `מפתח ה-AI לא הוגדר במערכת`.
- `GEMINI_MODEL` — optional override of `gemini-3.5-flash-lite`. ⚠️ **The quota bucket is per model**
  (`classify-feedback/README.md`, "What is *not* verified" §1): while both functions run the same model
  they draw from the same unknown free-tier bucket.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — provided by the platform. **No service-role key is used**: every
  read goes through the caller's JWT, so RLS applies exactly as on the screen.

## Type check

```
deno check --node-modules-dir=none supabase/functions/draft-followup/index.ts
```

Runs in CI as the third step of the `edge-function-check` job (`.github/workflows/ci.yml`). Prettier
formats `index.ts` (`.prettierignore` does not exclude `supabase/functions`); ESLint and knip do not
reach it, so `deno check` plus Prettier are the whole gate for this file.

## Deploy

Supabase MCP `deploy_edge_function` (name `draft-followup`, `verify_jwt: true`). **A deploy is live for
every user at once** and nothing in CI deploys — an edit to this file is not live until it is deployed
again. Repo⇄deployment identity: `get_edge_function` diffed against this file.

## Running it by hand (no secrets on the command line)

```bash
# $SB_URL = https://<project>.supabase.co ; $JWT = a signed-in user's access token (never echoed)

# gate 2 — no Authorization header ⇒ 401
curl -s -X POST "$SB_URL/functions/v1/draft-followup" \
  -H 'Content-Type: application/json' -d '{"quote_id":31}' -w '\nHTTP %{http_code}\n'

# gate 3 before gate 4 — an identity WITHOUT edit on 'הצעות מחיר', empty body ⇒ 403 (not 400)
curl -s -X POST "$SB_URL/functions/v1/draft-followup" \
  -H "Authorization: Bearer $JWT_VIEWER" \
  -H 'Content-Type: application/json' -d '{}' -w '\nHTTP %{http_code}\n'

# a real draft (spends one request of the AI quota)
curl -s -X POST "$SB_URL/functions/v1/draft-followup" \
  -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' -d '{"quote_id":31}' -w '\nHTTP %{http_code}\n'
```

## Live verification

_Filled in after the first deploy — see below._
