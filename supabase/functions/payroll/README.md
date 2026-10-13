# `payroll` — final payroll file, issue and mail (REG-IN, module 08)

Builds the final XLSX from the database snapshot, stores it immutably, commits the report, and
sends mail through Make: the accountant mail (with the file) and the personal review mails (a
link per hostess). Contract: `docs/specs/module_08_finance/payroll-contract.md` §3, with the
deputy's fixes in `contract-fixes.md` (F1, F2, F7, F9 touch this function).

🔒 **Every mail goes through `guard.ts`.** An address that is not `ishay1997@gmail.com` (or its
`+tag`) is delivered to `ishay1997@gmail.com`, with a notice line at the top of the body and
`[הופנה: <intended>]` in the subject. Owner ruling, 13.10.2026: *"שליחת מיילים אמיתית לכתובת
ishay1997@gmail.com בלבד"*. There is no environment switch; lifting the guard is a code change.
`send-email/guard.ts` is a byte-identical copy (a unit test fails if they drift).

## Files

| File | What | Tested by |
|---|---|---|
| `index.ts` | Router: secret → identity → body; wires the real Supabase clients, storage, Make | `deno check` |
| `pipeline.ts` | All orchestration, with injected dependencies | `pipeline.test.js` (fakes) |
| `document.ts` | Port of `buildSalaryReportDocument` + supplement title/row/filename | `document.parity.test.js` |
| `xlsx.ts` | `npm:write-excel-file@2.3.10` → `Uint8Array` | `deno check` + the W0 spike below |
| `mail.ts` | Ports of the mail rules + accountant and personal-review rendering | `mail.parity.test.js` |
| `dates.ts`, `money.ts` | Ports of `formatTimestampFull`, `toAgorot`/`toShekels`/`toFiniteNumber` | `dates.parity.test.js`, via document parity |
| `guard.ts` | The recipient guard | `guard.test.js` |
| `transport.ts` | One POST to Make, classified sent / failed / unknown | `transport.test.js` |

No file imports from `src/`. The parity tests import the `src/` originals read-only and compare.

## Request

`POST /functions/v1/payroll`, `Authorization: Bearer <user JWT>`, body `{action, …}`:

| `action` | Body | First call (as the user — this is the permission gate) |
|---|---|---|
| `issue` | `operation_id, review_id, expected_version, period, kind, original_report_id` | `payroll_operation_begin` |
| `resume` | `operation_id` | `payroll_operation_status` |
| `distribute` | `review_id, expected_revision, recipient_ids\|null, mode, request_id, app_origin` | `payroll_review_distribute_begin` |
| `distribute_continue` | `review_id, app_origin` | `payroll_review_queued_attempts` |
| `resend_review` | `recipient_id, prior_attempt_id, acknowledge_unknown, app_origin` | `payroll_review_resend_reserve` |
| `retry_accountant` | `report_id, prior_attempt_id, confirmed_recipient, acknowledge_unknown` | `payroll_accountant_retry_reserve` |

After that first call, service-role calls always pass `p_actor_email` from `auth.getUser()`, and
the database re-checks 'כספים' edit for that actor.

## Response

- `200 {ok:true, …}` — `issue`/`resume`: `{operation_id, report_id, total_amount, line_count,
  attempt:{attempt_id, state, delivered_recipient, redirected, code?}}`. `distribute`/
  `distribute_continue`: `{processed[], skipped[], remaining}`. Resend/retry: `{attempt}`.
- `200 {ok:false, code, message, retryable, operation_id?, report_id?, blockers?}` — every
  business refusal. `retryable` is true for `PAYROLL_BUSY`, `REVIEW_NOT_READY`, `RPC_ERROR`.
- `401` not signed in · `403` `PERMISSION_DENIED` · `500` missing `MAKE_EMAIL_WEBHOOK_URL` or an
  unexpected exception.
- An attempt `state` is `sent` · `failed` (certainly not sent) · `unknown` (may have been sent;
  never retried automatically) · `skipped` (someone else holds it) · `not_started` (claim refused).

## Secrets

- `MAKE_EMAIL_WEBHOOK_URL` — exists (shared with `send-email`).
- `PAYROLL_ALLOWED_ORIGINS` — **new**, comma-separated, e.g. the production URL plus
  `http://localhost:5173` (W0-CHECK 7). Unset ⇒ no personal links can be sent (fail-closed).

## Deployment order (deputy only)

1. Migrations 1–6, 6b (`000650`), 7, 8, 9 applied and checked (contract §7 step 3).
2. **Deploy `send-email`** (guard + legacy refusal). It reads `payroll_config` (migration 1) and
   writes `email_log.intended_recipient` (migration 3). Deployed before those exist, every legacy
   `salary_report` send is refused with 409 (fail-closed) — quotes, invoices, shifts and projects
   are unaffected.
3. Migrations 10–13, then 14–15.
4. Set `PAYROLL_ALLOWED_ORIGINS`, then deploy `payroll` (`verify_jwt: true`).

## What to check after deploying `payroll`

1. `OPTIONS` → 200; `POST` without a JWT → 401.
2. A finance-view user: `{action:'distribute', …}` → 403 `PERMISSION_DENIED`, and no attempt row.
3. `{action:'distribute', app_origin:'https://evil.example', …}` → `ORIGIN_NOT_ALLOWED`, no rows.
4. Acceptance P4 (July, 3 hostesses): 3 mails reach `ishay1997@gmail.com`, each with the notice
   line and `[הופנה: …]`; `payroll_mail_attempts` and `email_log` hold both the intended and the
   delivered address; the link opens `/payroll-review/<token>`.
5. Acceptance P8: the downloaded artifact's sha256 equals `salary_reports.artifact_sha256`; the
   accountant mail is redirected; history shows `נשלח`.
6. Function logs contain no webhook URL and no token (`error_detail` is URL-stripped).

## Known limits

- No local Supabase (contract §9.1): the pipeline is proven against fakes shaped like the
  contract's return values, not against A's and B's real functions. Integration is checked in
  production acceptance.
- Wall-clock: one call sends at most 8 personal mails and starts none that could overrun a
  120-second budget (25 s transport timeout each); the rest stay `queued` for
  `distribute_continue`.
- An object orphaned by a crash between upload and `record_artifact` is never referenced and never
  deleted by this function.

## W0 spike (13.10.2026, contract §3.4)

Deno 2.9.6, `npm:write-excel-file@2.3.10` browser entry: 3 rows written and read back with
`read-excel-file/node` — the ID `"012345678"` stays a string, money stays a number,
`rightToLeft="1"` is in the sheet XML. 300 rows built in 37 ms. The fallback (hand-written OOXML)
was not needed.
