# Payroll report: preview, approval, delivery and history

Date: 2026-10-13. Owner: Codex. Scope: module 08 Finance, process P4.

**Document status: implementation plan, not implemented. Readiness: LIMITED for implementation, with the specific inspection tasks in the last section.** Product direction is accepted; new internal contracts below are a proposed engineering design. No database migration, payroll generation, email or production deployment was performed for this plan.

**Accepted scope update 2026-10-13:** [§7.105](../PROJECT_MASTER_sec7.md) selects calendar-month regular reports and separate late-work supplements. [§7.106](../PROJECT_MASTER_sec7.md) records final issuance/send after the work month ends; current-month use is preview/draft only. These replace cumulative collection and current-month final issuance in the new design. Existing issued reports remain frozen. Exact supplement DDL and accountant handoff/payment dates still need W0/field confirmation; this is a plan, not a deployed change.

<div dir="rtl">

**לישי:** בוחרים חודש, רואים את השעות והסכומים ומורידים טיוטה לפי הצורך. אישור אחד מפיק את הדוח הסופי ושולח אותו. בהיסטוריה אפשר לצפות בנתונים שנחתמו ולהוריד את הקובץ המקורי. דוח ישן ללא קובץ יוצג מהנתונים הקפואים, עם הסבר מפורש על המידע שלא נשמר. שחזור והפקה בדיעבד בעדיפות משנית. האישור לכיוון מתועד ב־[§7.104](../PROJECT_MASTER_sec7.md).

</div>

## Product specification

### Goal and accepted scope

Let an authorized finance user verify the exact report before payroll rows are claimed, then create and send one immutable XLSX with one explicit confirmation. Make its contents and delivery state accessible after closing or refreshing the window.

The canonical product decision is [§7.104](../PROJECT_MASTER_sec7.md). Do not re-ask the selected preview/draft → one final approval flow. Approval of this direction does not itself authorize live payroll writes or email tests by an agent.

Core delivery includes actual preview, draft, one final confirmation, calendar-month collection, separate late-work supplements, safe claiming, durable file, delivery outcome, history and original download. Original-file recovery and previously unissued past periods remain secondary. No new management reports, PDF/CSV, mobile redesign, scheduler, salary-payment execution or full module 10 is included.

### Evidence and existing rules

| Label | Evidence | Implication |
| --- | --- | --- |
| Observed: current source | [SalaryReportDialog.jsx](../../src/modules/08_finance/SalaryReportDialog.jsx), complete preview/result/history paths | Existing preflight describes scope and recipient; actual rows appear only after the writing generation call. History download requires a file reference. |
| Observed: current source | [api.js](../../src/modules/08_finance/api.js), payroll generation and resend paths | Storage failure does not stop initial email. Resend requires the saved file. Unknown delivery is currently persisted as `failed`. |
| Observed: current source | [salaryReport.js](../../src/lib/salaryReport.js), complete document builder | XLSX has eight columns, preserves text identifiers and reconciles row count and amount; it does not recalculate salary. |
| Observed: database, 2026-10-13 | Read-only function definitions and ACLs on project `yfeovxppnfoafmfbdfvh` | Only `generate_salary_report` and `finalize_salary_report` matched payroll/report function names; both are volatile, SECURITY DEFINER, with explicit finance-edit checks. Live generation matches the H3 collection structure. |
| Observed: database, 2026-10-13 | August report metadata and aggregate frozen-row sum | Frozen rows exist and reconcile with the report total, but the report has no file reference. This does not establish whether an orphaned original object or an email copy exists. No individual payroll identities were queried for this plan. |
| Observed: database, 2026-10-13 | `finance` bucket metadata | Private, 10 MiB limit, XLSX MIME currently allowed. The historical MIME warning in `api.js` is not evidence of the present failure cause. Upload/download permissions have not been exercised for this plan. |
| Observed: live policy definitions, 2026-10-13 | `pg_policies` for payroll, bank and finance objects | Finance-view may read frozen lines and finance objects; current bank-table finance access requires edit. Current finance object UPDATE/DELETE permits finance-edit broadly, so private storage and `upsert:false` alone do not enforce issued-file immutability. Policy definitions were read; no write/delete attempt was executed. |
| Reported: independent review | `/root/search_review`, read-only review returned 2026-10-13 | UNIQUE period does not protect simultaneous collection for different months. Missing row locks/rechecks are visible in source; no concurrent live reproduction was attempted. |
| Observed: schema and earlier approved specification | [schema.sql](../schema.sql), salary tables; [approved P4](../specs/module_08_finance/processes-approved.md), H4/H9/H14/H15; [module-8 guide](../micro_guides/module-8.md), B-4 | The live cumulative writer and UNIQUE period are compatibility baselines, superseded for new reports by §7.105. Preserve frozen money, protected bank data and XLSX. Bank data is not duplicated into report lines. |

Preserved business rules:

- Accepted collection: normalize the selected month to its first day; collect only eligible, unclaimed assignments whose `event_date` is in `[period, next_month_start)`. Use this range for regular reports and supplements. Operational closure date does not move an August shift into September. Compensation uses the original assignment event month and a distinct basis; its server thresholds remain unchanged. Older unclaimed work stays visible for its own month.
- Current-month preview/draft is allowed and labelled incomplete. Final signing/send is allowed only after that work month ends in `Asia/Jerusalem`; future-month preview/final actions are blocked. Enforce the rule in UI/server, resumed operations and legacy compatibility.
- Actual work uses operationally closed projects and finally approved assignments. Cancellation compensation uses the existing eligible released-assignment branch. Preserve the current server compensation thresholds and force-majeure rule.
- Salary and compensation calculations have one server authority. Preview and final generation share that authority. Travel uses the parameter effective at final approval, with a change detected against preview before signing.
- Freeze identity, salary components and source linkage at final generation. Keep one regular report per period, distinct supplement identity/sequence with an original-report link, and one permanent claim per assignment. A later source change must not rewrite an original or supplement. The old blanket UNIQUE period requires a compatible additive transition before supplements can exist.
- Zero-value eligible rows are preserved as signed evidence and omitted from the XLSX body under existing N-4. A genuinely empty collection is a distinct state.
- Missing bank details remain a warning, as in the existing process; missing identity or required numeric values are blockers. Do not invent bank values or make absence look like zero.
- `sent` means the delivery service reported success; it does not prove inbox receipt or that wages have been paid.

### User journeys

**New report:** open Finance → monthly payroll dialog → choose a period → load actual preview → inspect rows, totals, warnings and recipient → optionally download draft → select `הפק ושלח` → one confirmation → preparation, signing and delivery → persistent result and refreshed history.

**Issued report:** select a history row → view its frozen rows, totals and delivery attempts → download that report's own immutable artifact. An issued period goes to history, without a second regular generation.

**Late work:** finance-edit selects `הפק דוח השלמה` for an issued period → preview only that month's newly eligible, unclaimed rows → draft/one final confirmation/file/sign/send. Show `השלמת אוגוסט 2026 — 1` and the original reference. Further new rows can form a later supplement. An empty collection creates none; a resend sends the same supplement rather than generating another.

**Interrupted or failed operation:** reopen history or the operation → see the persisted step and allowed recovery action → resume the same operation or retry a known failed send with the same original artifact. Never regenerate salary to repair a transport or storage error.

**Past period:** an issued period goes to history/supplement actions. An unissued period collects only that month's eligible unclaimed rows. Do not move claims from legacy mixed-month reports or rewrite those reports into a new format. An empty result means no eligible unclaimed rows remain for this month, not no historical work.

### Report content and preview

- Retain the existing XLSX order: `ת"ז`, `שם`, `פרטי-בנק`, `תעריף`, `שעות`, `בונוס`, `נסיעות`, `סה"כ`.
- Header: report month, final report code, final generation timestamp. Footer: bonus, travel and grand total. Do not aggregate actual-work hours with compensation hours.
- Screen preview may retain the current result-table order and add source project and basis beneath the hostess name. Several assignments for one hostess remain several rows, not an unapproved aggregation.
- Summary shows report kind, month start/end, counts, total, captured time and recipient; supplements also name the original. Show zero-value omissions. Separately show authorized counts/references for potentially relevant shifts/projects awaiting operational approval. Their amounts remain unknown; a failed completeness check is an error, not zero pending work. Do not present the month as fully settled merely because all currently eligible rows were collected.
- A draft has `טיוטה — לא הופק ולא נשלח`, draft capture time, no final report code, and filename `09_2026_Payroll_Report_DRAFT.xlsx`. Draft creation, refresh, cancellation and closing have no salary claim, report row or email side effect.
- Amounts/identifiers in preview and draft must correspond to the same server preview version. Do not export the visible page alone when pagination exists.
- After successful generation, refresh history and display the final identifier and artifact. Download must remain possible when mail failed but the artifact exists.

### State, buttons and feedback contract

| Screen state | Available actions | Visible information |
| --- | --- | --- |
| Loading preview | Cancel/close; final approval disabled | `טוען את שורות הדוח…` with a table skeleton. No zero totals while unknown. |
| Preview failed | `נסה שוב`, cancel | Persistent error panel; no false empty result. |
| Ready preview | `הורד טיוטה`, `רענן`, `הפק ושלח`, cancel | Period, complete totals, recipient, snapshot time, eligibility and warnings. |
| Blocking validation | Refresh, draft if data can safely be rendered, cancel | Error beside affected input/row, plus a short summary. `הפק ושלח` disabled with a visible reason. |
| Truly no eligible rows | Refresh, choose another period, close | `אין שורות שכר מאושרות שטרם נכללו בדוח לחודש שנבחר.` Show pending operational approval separately. No final report is created solely for an empty preview. |
| Eligible rows all have zero value | Preview and draft; final action with explicit zero-file explanation | Preserve N-4; distinguish signed zero rows from no collected rows. |
| Existing regular period | View, original download; finance-edit supplement action | No second regular generation. A supplement has a separate preview and approval. |
| Current month | Preview, refresh, draft, close | `החודש עדיין לא הסתיים. ניתן להפיק טיוטה; הפקה ושליחה סופיות יתאפשרו לאחר סיום החודש.` Final action disabled with a visible reason. |
| Confirm | Final approval, back to review | Name kind, work month, original reference for supplements, row count, total, actual recipient and irreversible claiming. Show outstanding operational approval explicitly. Supplements do not postpone wage obligations. |
| Preparing or signing | No second submit; operation status available | `מכין ושומר את הקובץ…`, then `מפיק את הדוח…`. Navigating away must not cancel or duplicate the durable operation. |
| Sending | View persisted operation; no parallel retry | `שולח לרואה החשבון…`; no success toast yet. |
| Sent | View, download, close | Success toast plus persistent `נשלח` state, recipient and send timestamp. |
| Known send failure | View, download, `שלח שוב` for finance-edit | `הדוח נשמר, אך השליחה נכשלה.` Retry confirmation names the actual retry recipient; same report/artifact. |
| Delivery unknown | View, download, `בדוק סטטוס` | `לא ניתן לקבוע אם השליחה הושלמה. אין לשלוח שוב לפני בדיקה.` No automatic retry. |
| Artifact preparation/storage failed before signing | Retry the preparation, review, close | `שמירת הקובץ נכשלה. הדוח לא נחתם ולא נשלח.` Only show this if persisted state proves it. |
| Commit response lost | `בדוק סטטוס` | `תוצאת ההפקה טרם ידועה.` Resolve by operation ID before enabling another generation. |
| Historical file reference absent or object unavailable | Frozen-data view; recovery action when supported | `אין קובץ מקורי זמין. נתוני השכר השמורים מוצגים כאן.` Explain whether reference missing, access denied or object not found. |

Toasts acknowledge actions; durable inline status conveys the lasting outcome. Never hide a failure explanation in a tooltip or only in a transient toast. A permission/network failure is not an empty report. Preserve inputs and scroll position on recoverable errors; avoid losing the chosen period during session refresh.

### Validation and permissions

| Check | Severity and outcome |
| --- | --- |
| Invalid/missing period, invalid year, future month | Block UI/server. Use `Asia/Jerusalem`; current month supports preview/draft, but not final issuance/send before month end. |
| Regular period already issued | Open history; regular-period uniqueness remains enforced. A separately approved supplement requires an existing original and collects only unclaimed rows within its month. |
| Preview version changed or expired | No signing/mail; explain what changed where possible and require a refreshed preview followed by new confirmation. |
| Missing identity, missing/non-finite required numbers, malformed basis, inconsistent count/total | Block before signing; identify offending rows safely. Validate server shape as well as UI formatting. |
| Bank missing | Warning in preview and confirmation; preserve `—`. Never query current bank details for an old report and call them historical. |
| Recipient absent/invalid, template unusable, unresolved required placeholders | Preview remains readable; final delivery blocked before signing. Show the configuration action permitted to that role; do not invent an accountant's name. |
| Artifact too large or wrong MIME | Block preparation before signing; use the smaller of actual storage and email limits after encoding overhead. Do not split payroll or silently omit rows. |
| New unclaimed rows, changed hours/identity/bank/rates/travel/recipient/template | Reject a stale final request even when total is unchanged. |
| Report lines/history fail to load | Retry panel; historical amounts stay unknown until loaded. |

Preserve existing authority: finance `view` may read frozen history/detail and download an available original artifact. New unissued preview and draft, including current bank data, require finance `edit`, as do approval, resume and resend. Do not infer permission to current bank data from access to a historical file. Preview/draft for view-only users would be a separately approved extension, outside this scope. Blocked users and anonymous callers receive no payroll data or signed URL. Server checks remain mandatory inside each public-facing privileged RPC/endpoint; UI controls are not authorization. A finance-edit user must not gain access to the Hostesses module merely to preview salary.

### Historical viewing, downloads and recovery

History stays inside the payroll dialog. Show work period, regular/supplement kind, original link/sequence, identifier, total, artifact and delivery state. Each supplement has its own file and send history. Label the amount `סה"כ לתשלום`, not `סה"כ ששולם`. Preserve historical recipients per attempt; neither issuance nor send proves wages were paid.

Frozen payroll lines are the authority for historical identity and money. If the original artifact is available, protected parsing may obtain its original bank column; validate report identity and reconciliation, reject malformed files, and never execute spreadsheet formulas. No private file is exposed through a public bucket or third-party document viewer. If historical bank fields cannot be proven from that artifact, show `לא נשמר בנתוני הדוח`.

Original download fetches the existing immutable object with an authorized short-lived URL or authenticated download response, using its original filename. Persist the object key, not an expiring URL. Detect absent object, expired session, access refusal, network failure and browser-blocked download separately; retry download is always read-only.

Recovery order for a legacy report with no usable reference:

1. Look for the exact original under the known report path and any proven original attachment/archive. This is inspection, not automatic email access or a new send.
2. If the original is found, verify identity, period and reconciliation before proposing a metadata repair under existing data-change authority.
3. If no original is found, offer a **reconstructed** XLSX from frozen salary rows, with original report ID, period, frozen amounts, a reconstruction timestamp and `שחזור — הקובץ המקורי אינו זמין`. Preserve missing historical bank information as missing.
4. A reconstruction has a separate artifact kind/key and cannot overwrite or masquerade as the original. It does not claim assignments, change totals or silently become the resend attachment. Sending such a reconstruction requires a distinct reviewed action.

This secondary work does not promise a byte-identical August original. Backdated issuance cannot recover rows already settled in another report or create data for months with no stored source records.

### Conference recommendation: August history and September issuance

<div dir="rtl">

**שאלת ישי, 2026-10-13:** "לדעתך אפשר ליצור את הדוחות הקודמים או מיותר? אני חשבתי להדגמה לפחות שיהיה חודש קודם ואפשרות לעשות את ספטמבר תקן אותי". זו הצעה להדגמה ובקשת המלצה, לא אישור להפקה חיה או לשינוי נתוני עבר.

</div>

Recommendation: prepare one usable previous report (August) and leave September unissued for the new flow. Full historical backfill remains secondary. For August, inspect for the original artifact first; if none is found, frozen-data viewing and an explicitly labelled reconstruction are sufficient for illustrating history. Never generate a second regular August payroll report or replace its frozen money. A separately approved August supplement is allowed under §7.105 for newly eligible, unclaimed August work.

Observed in a read-only preflight at **2026-10-13 17:54:56 UTC**, project `yfeovxppnfoafmfbdfvh`: August has 83 frozen rows whose sum matches its report total, with no file reference; September has no report. Applying the two eligibility branches of the complete live `generate_salary_report(date)` definition to unclaimed assignments through 2026-09-30 found **4,167 candidate rows** (3,992 actual-work candidates and 175 cancellation-compensation candidates), including **4,068 dated before September**. No actual-work candidate had missing hours. These are candidate counts, not a validated preview, payable-file count or proof that every row can pass final validation; cancellation inputs and zero-value rows still require the shared reader. No individual identities/bank values were retrieved, generation function called, claim changed or email sent.

The preflight above describes the old live cumulative writer. The accepted monthly target excludes prior-month candidates, but is not deployed. W0/pre-conference owner must verify month-specific demo data and keep older outstanding work traceable, without reassigning claims or inventing months. Rehearse safely in isolation; preserve the intended live period for its single regular issuance. August original availability and final September validity remain unknown.

### Accepted monthly scope and late reporting

Canonical decision: [§7.105](../PROJECT_MASTER_sec7.md). Ishay selected `דוח השלמה נפרד לאוגוסט (מומלץ)`. Individual assignment event dates define the month; actual work and compensation remain distinct. A below is selected; B/C are comparison history, not target behaviour.

| Option | Example: an August shift is closed after August's report was issued | Tradeoff |
| --- | --- | --- |
| A — calendar month plus a separate supplement (accepted) | September's regular report contains only September shifts. A separately identified August supplement contains newly eligible August rows; August's original stays unchanged. | Clear meaning per month and visible late work. Requires an additive supplement contract and uniqueness/claim/artifact rules; this feature does not exist today. |
| B — calendar month plus labelled prior-month adjustments | September's main section contains September shifts; a separate, visibly labelled section carries late August rows. | One handoff to the accountant, but the whole file is not September-only. This differs from the user's preferred strict monthly summary. |
| C — cumulative outstanding collection (current behaviour) | All eligible unclaimed August and September rows enter September's report. | Avoids leaving earlier rows unclaimed, but mixes work months and produced the observed large candidate backlog. |

Supplements contain only newly eligible, unclaimed rows from the original's work month. Require an issued regular report; give each supplement its own ID, sequence, original-report link, filename, artifact and attempts. Serialize competing supplement operations and guard assignment claims across every report kind. Enforce one regular report per period and unique supplement identity; keeping the old blanket UNIQUE period would prevent this contract. Empty supplements are not finalized. A resend uses the same bytes and adds no salary rows.

A supplement is distinct from missing-file reconstruction and corrections to money already claimed. Signed-money corrections/negative adjustments need a separate accountant-reviewed policy outside this late-unclaimed-work scope. Never recategorize old reports/claims. W0 validates exact schema/ACL, report identity, source linkage, legacy callers and storage filenames; this product approval grants no specific migration or live-send authority.

### Month-end timing and accountant handoff

Per §7.106, final approval/send starts only after the work month ends in `Asia/Jerusalem`. September 2026 becomes eligible for final issuance at 2026-10-01 00:00 local time; October can be previewed/drafted during October. Month end does not prove all hours are approved: expose pending operational approvals before signing. Late supplements do not reset a wage-payment deadline.

Recommendation, not an agreed cutoff: hand off during the first few days of the next month and leave payroll-processing/correction time. **Unknown, owner: business payroll contact/accountant** — actual handoff deadline, processing lead time and payment date under the workers' employment arrangements. Do not hardcode `10` as a universally valid payment date or infer bank receipt from a sent report. REG-IN sends the hours document; payslips and wage transfer are outside scope. No automatic scheduler is added.

Timing was checked on 2026-10-13 against [Wage Protection Law, sections 1/9/10](https://www.btl.gov.il/Laws1/00_0106_000000.pdf) and [payment-date guidance](https://www.kolzchut.org.il/he/מועד_תשלום_השכר). Monthly wages are due at month end; unpaid wages beyond the relevant ninth-day threshold are late. Hourly/partial-month arrangements need their applicable rules/agreements checked. This explains why the 10th is not a safe universal default; it does not establish these workers' actual dates.

## Technical design

### Boundaries and alternatives

Keep the current React dialog, module `api.js` boundary, pure document shaping/guards, salary tables, private finance storage and shared email transport. Add a payroll-specific server coordinator and durable operation/delivery records; reuse shared transport rather than building module 10.

Chosen design: prepare and persist the approved artifact before the atomic salary commit; enqueue the approved send in that commit, then dispatch after it commits. Storage and email are external effects and cannot be honestly described as part of one SQL transaction. One user confirmation triggers this staged operation.

Rejected shortcut: call the existing writing generation RPC to obtain a preview or make a temporary report and undo it. That consumes a month and claims payroll. Rejected shortcut: recompute salary in JavaScript. Rejected shortcut: keep the approved file only in browser memory until email returns. Each conflicts with a stated requirement.

Engineering proposals in this section are scoped to §7.104; exact internal names, schema and runtime adapters must be verified in work unit W0 before implementation. No claims of implemented endpoints follow.

### Proposed contracts

| Contract | Request/result | Side effects |
| --- | --- | --- |
| `preview_salary_report` | Period and regular/supplement kind; original report reference for supplements → server lines, totals, row/file counts, pending approvals, month bounds, captured time, opaque version, configuration and recipient | Read-only; no final report, claims, email or artifact upload. Server verifies original kind/period and caller authority. |
| `get_salary_report_detail` | Report ID → frozen rows and report metadata, artifact availability, durable delivery attempts | Read-only; original bank fields only from a validated original artifact, if requested and authorized. |
| `approve_salary_report` coordinator | Period, kind, original reference for supplements, preview version, operation UUID → durable operation ID and progress | After approval and server month-end/original validation: trusted preparation, private storage, atomic commit, dispatch. Server allocates final report ID/supplement sequence; client money is never authoritative. |
| Internal final commit | Trusted typed operation, original/sequence and artifact manifest, preview/version → report ID and pending approved send | Recheck completed month, kind/original identity and version; atomically claim assignments, freeze lines/travel, bind artifact and enqueue one send. Restricted internal caller validates originating actor/finance authority. |
| Operation status/resume | Operation UUID → persisted preparation/report/send result | Status is read-only; resume may continue only the existing approved operation with permissions and state checks. |
| Retry known failed send | Report ID, prior attempt version and reviewed recipient → new attempt | Same immutable artifact and salary snapshot; no generation. Unknown delivery is ineligible until resolved. |

Error responses include a stable machine code, plain Hebrew message, retryability, operation/report ID if known and safe row/configuration references. Use names such as `PREVIEW_CHANGED`, `PERIOD_EXISTS`, `ARTIFACT_UNAVAILABLE`, `DELIVERY_UNKNOWN` and `PERMISSION_DENIED`; never expose raw bank data, attachments or tokens in errors/logs.

### Preview and final-commit integrity

Bind the preview version and operation to the full regular/supplement identity, verified original report, work-month range and eligible membership. Changing kind or original after preview is a stale/invalid approval even when totals match. The server checks that a supplied original is a regular report for the same work month; an arbitrary known report ID is not authority. Final month-end checks use server time, including status/resume and legacy paths.

Extract one internal server collection/calculation authority from the live generation logic. The read-only preview invokes it; final commit revalidates the same semantics. Preserve the existing compensation thresholds, full precision before amount rounding, and row reconciliation. Do not compare a recomputed client `rounded hours × rate` against server line amounts.

Preview version covers canonical assignment keys including assignment number, complete eligible membership, source statuses/times, identity, exact financial inputs and outputs, original bank fields, period/cutoff, travel configuration and actual recipient/template version. Bind it to the authorized actor/context. It is not a hash of the total alone. A same-total replacement of a hostess or bank account must invalidate approval.

The coordinator validates the version, allocates an operation and a regular/supplement report identity, original link/sequence and final identifier without creating a signed month, generates the final artifact from the trusted approved snapshot, validates/reconciles it and stores it immutably. The snapshot containing bank information must remain protected; bank fields are not added to `salary_report_lines` or public logs. Interrupted preparation must be recoverable from the persisted private candidate artifact and manifest, or restart safely from a new preview if no verified artifact was stored. A candidate whose source/configuration version changed is ineligible for signing. Once a newer version is approved, supersede old candidates so an old resume request cannot revive them; do not delete an active or committed candidate.

Final commit is short and contains **no storage or email network calls**. Serialize collection across months, then protect/recheck every source that influences eligibility, identity, financial fields, bank and configuration while computing the approved version. For this small system, a fixed-order, bounded lock of the relevant source tables during final commit is the initial conservative design; narrower row locks require a demonstrated strategy for new eligible rows and concurrent project/configuration updates. Verify existing writer lock order and deadlock handling in W0.

Use an explicit transaction-wide collection lock shared by all regular/supplement salary writers, retain regular-period and supplement-identity uniqueness, and use conditional assignment claims with affected-row count reconciliation. A mismatch rolls back the report, frozen lines, travel updates and send enqueue together. The lock is not only per period. Old direct generation access must not retain a bypass around the new guard; use an additive compatibility wrapper and cutover verified against deployed callers.

PostgreSQL's [explicit-locking documentation](https://www.postgresql.org/docs/17/explicit-locking.html) supports transaction-scoped locks and consistent acquisition order; this is a design inference for REG-IN, not proof that existing SQL is race-safe. The exact source set/isolation must pass real concurrent tests before this design is declared ready for release.

### Durable artifact, operations and delivery

Proposed operation metadata: UUID/idempotency key, actor, period, report kind, original-report link/supplement sequence, version, reserved report ID, preparation/commit state, artifact key/hash/size/MIME, approval timestamp, configuration/recipient snapshot, timestamps and safe failure code. Do not persist the candidate's bank fields in this metadata. UUID deduplicates retries of one request; distinct UUIDs from separate tabs may still compete. Serialize active preparation/commit ownership by work period and report kind on the server; supplements also bind the original and candidate version. A competing authorized request gets the existing operation's safe status/reference or an explicit period-busy/existing-report result; it never starts a second initial dispatch. Status access still requires finance authority, even with a known UUID.

Proposed delivery-attempt metadata: report ID, attempt ID, approved recipient/template version, queued/sending/sent/failed/unknown state, transport correlation ID, started/completed time and safe outcome. Enforce one active attempt per report and idempotent operation transitions. An older attempt's completion cannot overwrite a later attempt's state. History retains each real recipient.

Record the verified artifact key/hash with the frozen report at final commit. Make bytes immutable; no overwrite/upsert of an issued report. Email attachment, download and retry use that same original artifact. Keep prepared candidates distinct from issued artifacts; clean only proven unreferenced candidates under a documented retention rule, never an issued object. Enforce this on every storage UPDATE/DELETE/overwrite route and RPC that changes a report's file key, not only in the new client. Current broad finance-edit storage policies must be narrowed for issued payroll artifacts without breaking invoice handling. Protect the transition from prepared to committed so cleanup cannot race with commit. Privileged maintenance must also check references/operation state; a service key is not a substitute for those checks.

Storage remains private. [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control) describes RLS-based authorization; verify actual upload/select policies for finance roles before use. A service-side coordinator must authenticate and authorize the initiating user rather than treating an operation UUID or browser-supplied file key as authority.

The coordinator reserves a send before contacting transport, persists the attempt and dispatches only after report commit. A crash/time-out after dispatch but before a trustworthy result becomes durable `unknown`, including after refresh. Do not automatically replay an expired sending lease: the recipient may already have received the message. W0 must establish whether the existing transport supports a delivery-status lookup or idempotency key; absent evidence, do not promise exactly-once email delivery.

Known failures may be retried manually using the original artifact after reviewing the actual recipient. No automated retry engine is required. Unknown is resolved from trustworthy transport/log evidence or a specifically reviewed manual resend; missing evidence remains unknown. SMTP/service acceptance and inbox receipt remain distinct claims.

### Migration, compatibility and recovery

- Add operations/attempts and public read contracts first, with explicit RLS/DEFINER checks and restrictive ACLs. Do not expose internal final-commit routines publicly.
- Preserve old signatures during expand-contract. Inventory all three legacy mutation routes: `generate_salary_report`, `finalize_salary_report` and the direct `salary_report` branch of `supabase/functions/send-email/index.ts`. Before enabling the new writer, these must participate in the same claim/artifact/attempt contract or return a controlled upgrade-required response for new-contract reports. In particular, an old finalize call cannot replace an issued file or overwrite attempt state, and a direct send cannot submit arbitrary bytes/recipient outside the approved attempt. Restrict payroll only; invoice and invitation branches retain their own contracts. Inspect deployed old clients; do not leave a race or transport bypass.
- Preserve existing send status for legacy clients until all consumers can safely display the richer durable delivery state; plan additive fields rather than silently mapping unknown to failed.
- Never backfill legacy reports to `sent` or `failed` from assumptions. Unknown historical file/delivery evidence remains explicitly legacy/unknown.
- No updates to issued money, claim reassignment, destructive migration or bulk generation are needed for the core feature. Record exact approved migrations in [db_roadmap.md](../db_roadmap.md) when written; do not treat this plan as applied DDL.
- Rollback disables new approvals and preserves all committed reports/artifacts/attempts. Do not re-enable an unguarded old writer. In-flight operations remain inspectable and have an owner for recovery.

## Implementation and verification plan

### Work units and ownership

| Unit | Responsibility | Exit evidence |
| --- | --- | --- |
| W0 — confirm integration | Implementer: live RPC/RLS, all legacy writers, storage, send transport, trusted XLSX, lock order, monthly/supplement IDs/uniqueness/source linkage, compatible schema transition and filenames | Exact supported adapter/DDL and effective authority; payment/handoff dates remain owned by business/accountant. |
| W1 — pure preview and history | Implementer: shared server collection reader, frozen-detail reader, Finance preview/history UI and draft shaping | Preview/draft do not alter salary state; permissions tested independently; history uses frozen data; drafts open correctly. |
| W2 — approved operation | Implementer: preparation, storage/RPC artifact immutability, guarded atomic commit, legacy generate/finalize cutover and operation recovery | Same-/different-period concurrency, stale-preview rejection and interruption tests pass; no signed month without a durable artifact; old finalize/storage routes cannot replace or delete issued output. |
| W3 — delivery and feedback | Implementer: shared-transport integration, payroll-specific direct-send guard/cutover, durable attempts, UI result/history/retry states | Known failure vs unknown survives refresh; one active attempt; unchanged original file on download/resend; direct transport calls cannot bypass approval. |
| W4 — secondary history recovery | Implementer: exact-original lookup, distinctly labelled reconstruction and past-period paths | No recalculation, fabricated historical bank data, claim duplication or original overwrite. May follow core delivery. |
| W5 — independent acceptance | A checker other than the implementer: desktop/laptop browser, actual downloaded workbook, persisted data and authorized email test | Verified evidence for the matrix below; findings fixed and affected paths retested. |

Planning does not execute these units or authorize a live test send. Match existing personal-branch, migration and deployment authority. The shared database serves live and development clients; use a disposable isolated environment for destructive/concurrent/fault tests, never live payroll as a fixture.

### Acceptance matrix

| ID | Exercise | Required evidence |
| --- | --- | --- |
| A01 | Preview, refresh, draft and cancel | Counts/claims/report rows/email logs unchanged; visible rows and XLSX agree. |
| A02 | One approved normal report | Frozen lines and total reconcile; every claimed assignment links once; artifact exists and hash matches attached/downloaded bytes; actual authorized test email opened before claiming receipt. |
| A03 | Same-period double click, two tabs with distinct UUIDs and lost response | One final report and one approved initial attempt; competing callers receive an authorized existing-operation/status reference or an explicit busy/existing-report result; no duplicate signing or silent failure. |
| A04 | Concurrent regular/supplement operations for the same month and different months | No duplicate or overwritten assignment claim; regular uniqueness and supplement sequencing persist separately. |
| A05 | Change hours, bonus, travel, identity, bank or membership after preview; include same-total swaps | Reject stale approval with no report/claims/mail; refreshed preview exposes the change. |
| A06 | New eligible row or source/configuration update during preparation/commit | No unseen row/configuration enters approved output; bounded lock/rollback behaviour and no silent omissions. |
| A07 | Recipient/template/configuration missing, malformed or changed | Preview readable, precise final blocker, no salary writes or send. Confirm displays the actual chosen destination. |
| A08 | Storage failure, oversized file, crash before storage/commit and after commit | Resume/status gives the correct persisted step; no email without final commit/artifact; no duplicate month or claims; incomplete preparation never looks sent. |
| A09 | Known transport rejection, timeout after acceptance, log failure, stale completion | Correct durable failed/unknown state after refresh; unknown not auto-retried; earlier attempt cannot overwrite later state. |
| A10 | Original download and known-failure resend | Same original bytes and unchanged frozen financial data; expired session/URL/missing object show actionable failure. |
| A11 | Preview/detail/draft/download/approve/retry under edit, view, blocked and anonymous identities | Finance-edit preview works without Hostesses access; finance-view history/original download works but current-bank preview/draft is rejected; blocked/anonymous calls fail at server/storage boundary without payroll leakage. |
| A12 | Missing bank vs identity/numeric data; zero rows vs zero-value eligible rows | Correct warning/blocker; no false zero; truly empty collection does not consume a period; N-4 evidence preserved when zero-value rows are deliberately approved. |
| A13 | Cancellation 24/72-hour boundaries, force majeure, retro operational closure, multiple assignments and fractional hours | Existing server rules unchanged; no client recomputation/rounding rejection; compensation rows and XLSX totals correct. |
| A14 | History after source/bank/recipient changes; August without file reference | Frozen identity/money unchanged; no current bank/recipient substituted as historical; view remains usable and missing-original limitations visible. |
| A15 | Past unissued month or supplement where some/all rows were already claimed by legacy reports | Only that month's eligible unclaimed rows enter; no claim reassignment or false no-work statement. |
| A16 | Hebrew workbook and browser on desktop/laptop | Text IDs retain leading zero, numeric cells/totals valid, RTL readable, long tables paginated without partial draft/export, keyboard focus and visible loading/error/disabled reasons. Mobile is outside the user scope. |
| A17 | Direct old generate/finalize and payroll send-email calls under finance-edit; supplied arbitrary file/recipient/attempt | Old generation cannot bypass the collection guard, finalize cannot replace final artifact/attempt state, and direct send cannot bypass the approved report/attempt. Invoice/invitation regressions checked separately. |
| A18 | Direct overwrite/delete of issued object; cleanup racing commit; resume superseded candidate | Issued artifact protected by effective storage/RPC policy; active/committed objects never cleaned; stale candidate cannot sign after new approval; salary/history remain intact. |
| A19 | Month-boundary assignments, compensation and leap-year February | Regular/supplement preview, draft and final include only the selected assignment event month; closure date does not shift membership. |
| A20 | Current-month draft, early final calls and Jerusalem month-end boundary | Draft has no final side effect; UI/server and legacy/resume paths reject early final/send and admit completed months only. |
| A21 | Potentially relevant work awaiting operational approval; completeness reader fails | Pending work is visible without fabricated amounts; failure never becomes zero or an assertion the month is fully reported. |
| A22 | Supplement empty/double click/concurrent operations/resend and original history | Original remains frozen; only new rows are claimed once; unique supplement identity/link/file; empty creates none; resend changes no money. |

Appropriate code gates still apply when implementing. They are necessary but do not replace actual workbook opening, browser inspection, independent acceptance, database persistence checks or proof of receipt. Do not run broad application tests merely to validate this planning-only document.

### Readiness and current open work

**LIMITED:** requirements, core flow, history semantics, failure states and acceptance criteria are coherent. W0 still must prove the trusted XLSX adapter, exact lock/source set, legacy caller cutover, storage role policies and transport reconciliation capabilities. These are inspection tasks for the implementer, not questions for Ishay to answer technically. This verdict does not mean a working or deployed payroll feature.

Product question requiring Ishay now: **none on monthly scope/late-work policy** — §7.105 is answered. Field confirmation of accountant handoff/payment dates remains with the business/accountant; do not invent a cutoff or promise timely payment. Preserve bank-access boundaries. Optional reconstruction cannot promise the exact original without evidence.

Planning verification: the earlier independent review cleared the initial plan's four required corrections. The monthly/supplement and month-end revision was then independently reviewed by `/root/search_review`; two document findings (regular-report wording and a broken acceptance-table continuation) were fixed and rechecked on disk. No required document correction remained in that review. Focused checks confirm 22 cases in one Markdown table and valid local links; document structure/Bidi checks passed. These are document checks, not implementation or live-send validation.

Next owner: the subsequently assigned implementer, W0. No implementation has been dispatched to Claude or another chat by this document. Implementation/release closure remains W5 evidence.
