# Module 8 (Finance) Discovery — Fresh-Eyes Source Audit

Reviewer: fresh-context session, no visibility into the Discovery conversation itself.
Scope: `docs/specs/module_08_finance/` (processes-approved.md = SSOT; world-sources.md,
discovery-log.md, stage0-sweeps/, research/ = evidence) cross-checked against the live
Supabase project (`yfeovxppnfoafmfbdfvh`, read-only SQL) and `src/`. Every claim below was
independently re-run against the DB or the repo — not taken on the sweep authors' word.
Ranked most-severe first. I rule on nothing; each item ends in a question for Ishay/the
build session, not a verdict.

---

## 1. [HIGH] The finance columns M8 is about to own on `projects` are readable — today,
live — by two roles the spec itself says must be blocked from finance

**What:** `projects` carries exactly **one** SELECT policy, and it gates on module
**'פרויקטים'** (view or edit), not 'כספים'. Verified live:

```sql
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename='projects';
-- projects_select_by_permission | SELECT | permissions.module_id = (module 'פרויקטים')
--   AND permission_level = ANY('edit','view')
```

Four roles hold view/edit on 'פרויקטים' (live query on `permissions`/`roles`/`modules`):
**מנהלת גיוס ושיבוץ** (view), **מנהלת כספים ולקוחות** (view), **מנהלת לוגיסטיקה** (view),
**מנהלת פרויקטים** (edit). Two of those four — recruitment/scheduling manager and
logistics manager — are exactly the roles `processes-approved.md` §א11 says should be kept
away from finance concentration (*"מנהלת-פרויקטים חסומה מריכוז-שכר"*, and the live
permission matrix independently confirms `כספים` is `blocked` for both of them).

Postgres RLS is row-level, not column-level — a fact `src/CLAUDE.md` states explicitly and
the project has already paid for twice (`product_costs` was split out of `products` for
exactly this reason; `hostesses.bank_*` is the still-open half of §7.63, closed in this very
Discovery as **ה19** via a `hostess_bank_details` child table). The single `projects` SELECT
policy means: whoever can read the row can read **every column** of it, regardless of
module-of-intent — enforced today only by which columns a given query happens to name.

And one query doesn't name them: `src/modules/06_projects/api.js:getProject()` —

```js
const { data, error } = await supabase.from('projects').select('*').eq('project_id', projectId)...
```

— powers `ProjectCardPage.jsx`, mounted at route `projects/:id` behind nothing but
`<ProtectedRoute allow="פרויקטים">` (`src/App.jsx:153-158`). So **today**, live, a logistics
manager or recruitment/scheduling manager opening any project card already receives
`invoice_sent`, `payment_date`, `feedback_score`, `negative_feedback_reason`,
`feedback_notes` in the network response — columns §א11 says her role shouldn't concentrate.
M8's own plan (recorded in `db_roadmap.md` line 352, ✅ already write-backed per iron rule
13) adds three more to the same table on the same policy: `cancellation_fee`,
`written_off`, `final_profit`.

**Why it matters:** this is precisely the class of gap `processes-approved.md` treats as
serious enough to fix by table-split when it's about hostesses' bank data (ה19) — and
`PROJECT_MASTER.md` §6 already logs the identical pattern for `quote_services.closing_unit_cost`
(line 552, tagged `🚧 מ8 · 🚧 מ9`, explicitly calling it *relevant to how מ8 designs its own
RLS model*) — but that line's own reasoning ("not live leakage today, because finance's
only view-role already holds edit on כספים anyway") does **not** hold for `projects`: two
roles genuinely blocked from 'כספים' already have live read access to the whole row. The
Discovery closed the write side of this exact tension (§7.63/㉘: RPC-only writes gated on
'כספים') but the read side — the actual network-response leak — was never asked here, even
though B14 in the reverse-contracts sweep explicitly flagged it as something "relevant to
how מ8 designs its own permission/RLS model." Ishay's own acceptance bar (④, "explain it at
the conference in one sentence") gets harder to meet if an engineer asks "why is the
recruitment manager's browser receiving the client's payment status and gross profit?" and
the honest answer is "nobody decided that, `select('*')` just does it."

**Suggested question:** does M8 need the same treatment ה19 gave hostesses' bank data
(split the finance-only columns into a child table, gated read+write on 'כספים') — or is a
lighter fix enough (change `getProject()` to an explicit column list, and audit every other
`.from('projects').select(...)` call for the same blind spot before M8 ships)? Either way
it reads like a decision the build session shouldn't make silently on its own judgment.

---

## 2. [HIGH] A cancelled project's path through S1's three tabs and P3's freeze gate is
never spelled out — and read literally, the two approved cards contradict each other

**What:** S1 is defined as exactly **3 tabs**, one per `project_status` value:
*ממתין-לחשבונית · ממתין-לתשלום · הסתיים* (א17, mapped in ה10 to `awaiting_invoice` /
`awaiting_payment` / `finished`). P1's cancellation track states, in the same breath as
introducing it: *"🔴 סטטוס-הפרויקט נשאר `בוטל` — מכונת-מ6 לא נגעת"* — a cancelled
project's `project_status` **never** becomes any of the three tab-mapped values. P1 only
says the row *"מופיע בלשונית מיד עם דגל 'דמי-ביטול'"* without naming which of the three
tabs a status-`cancelled` row would ever satisfy the `WHERE` clause of.

P3 then asserts, without a mechanism: *"גם מבוטלים מקבלים רווח-קפוא בפתרון דמי-הביטול...
הדו"חות מספרים גם ביטולים"* — but P3's own freeze gate, stated two lines above, is
**"שער כפול: `payment_date` קיים + משוב נפתר"**, gating the `ממתין-לתשלום → הסתיים` RPC.
A cancelled project has no `payment_date` (there was never an invoice) and, per P1's own
rule, never reaches `awaiting_payment` to trigger that RPC in the first place — so the
literal archive RPC described in P3 cannot be the mechanism that freezes a cancelled
project's profit, even though the same card asserts it happens.

Verified live that this isn't hypothetical plumbing: the CHECK constraint gating the three
statuses is real and currently enforced —

```sql
CHECK ((project_status = ANY (ARRAY['not_started','in_progress','ready','event_finished',
  'awaiting_invoice','awaiting_payment','finished','cancelled'])))
```

— 8 values exactly as א15 says, and `cancelled` sits outside the three the tabs are built
on.

**Why it matters:** whoever builds S1's query/RPC will hit this on the first cancelled-fee
test case: either the row for a cancelled project with an unresolved fee needs a 4th
pseudo-tab / a UNION added to one of the three real tabs (which one — most naturally
`ממתין-לתשלום`, since it's owed money — but that's not written anywhere), or the "profit
freeze on cancellation-fee resolution" needs its own RPC distinct from the archive RPC
described in P3, writing `final_profit` (and presumably flipping something readable by S1's
`הסתיים` filter) outside the `payment_date`+feedback gate. Both are legitimate designs; the
spec currently reads as if one unified mechanism covers both paths, and it doesn't, on its
own stated gate.

**Suggested question:** for a cancelled project whose cancellation fee gets resolved — which
tab shows it before resolution, which status/flag does it carry after, and does resolving
the fee run through the same archive RPC (with the gate loosened for `cancelled` rows) or a
second, cancellation-specific freeze action?

---

## 3. [MEDIUM] The cancellation-fee "ordered/ready goods at full price" component has no
named price source, and the one that exists has a documented dead end

**What:** P1's cancellation-fee mechanism lists three components, one being *"סחורה
שהוזמנה (שורות `ordered`/`ready` במחיר מלא — עוגן: 'רגע התחייבות-הכסף' של אפיון-מ5)"*.
Verified live that `ordered`/`ready` are indeed the exact values of `logistics.item_status`
(`CHECK (item_status = ANY (ARRAY['not_started','ordered','ready']))`) — so the anchor is
real. But `logistics` itself carries **no price column** — `planned_qty`, `actual_qty`,
`item_status`, dates, no price. The only way to price a `logistics` row is to follow one of
two mutually-exclusive nullable FKs:

```sql
CHECK ((quote_service_line_id IS NULL AND project_change_id IS NULL)
       OR num_nonnulls(quote_service_line_id, project_change_id) = 1)
```

— either `quote_service_line_id → quote_services.closing_unit_price` (the frozen quote
price) or `project_change_id → project_changes.unit_price_snapshot` (the frozen
scope-change price). The constraint's own first branch — **both null** — is real and
already documented by module 5's Discovery as a declared, bounded limitation (reverse-sweep
B13: *"שורות שנולדו משינוי-תכולה נשארות בלי מצביע-מקור... נרשם כאן כדי שמ8/מ11 לא יגלו את
זה בהפתעה"*). Live count today is 0 rows in that state (`project_changes` is empty), so it
hasn't bitten yet — but it is one scope-change away from mattering, and P1's cancellation-fee
description doesn't carry B13's warning forward into the concrete formula it's describing.

**Why it matters:** a builder implementing "ordered/ready at full price" needs to (a) know
there are two different price sources depending on row origin, and (b) decide what happens
to a both-null row's contribution to a cancellation fee — silently `0`, a manual line like
the "שירותים-שבוצעו (ידני)" component P1 already carves out for services, or a build-time
error. The spec resolves this ambiguity for the *services* leg of the same formula but is
silent on it for the *goods* leg, even though the underlying limitation (B13) was already
surfaced by module 5 specifically so M8 wouldn't be surprised by it.

**Suggested question:** for the goods component of the cancellation fee, does the both-null
case (once scope-changes exist) fall into the same manual/no-tracking bucket as
"שירותים-שבוצעו", or does it need its own handling?

---

## 4. [MEDIUM] A different, pre-existing "profitability" calculation already lives in the
codebase and is never mentioned or reconciled

**What:** `src/lib/quotes.js` already exports `deriveProfitability(preVat, cost)`
(`grossProfit = preVat - cost`, `marginPercent`, an explicit null-propagation rule from an
Ishay ruling dated 01/08/2026: *"רווח שחושב מעלות חלקית הוא מספר שקרי"*). It's consumed
today by `QuoteBuilderPage.jsx:251` — `deriveProfitability(totals?.preVat ?? 0,
computeLinesCost(lines))` — i.e. a **quote-drafting-time** margin estimate, using **only**
goods cost (`computeLinesCost`), with no labor, no bonuses, no travel. This is a materially
different metric from the one M8's Discovery is designing (P3: revenue = frozen quote +
scope changes; cost = actual labor + bonuses + travel + goods; computed at event-closing
time, not quote-drafting time) — yet nothing in `processes-approved.md`, `world-sources.md`,
or the stage0 sweeps references `deriveProfitability` at all. I confirmed via grep that no
sweep file or the ledger names it.

**Why it matters:** `src/CLAUDE.md` §14 (SSOT rule) is explicit — *"לוגיקה עסקית פעם אחת
ב-`src/lib/` + בדיקת-יחידה לצידה... לפני כתיבת helper — לחפש קיים"* — and the codebase
already has two profit-shaped functions computing genuinely different numbers at genuinely
different moments. That may well be the right design (a planning-stage margin estimate is
not the same thing as a realized-actuals gross profit), but nothing records that the two are
intentionally distinct, and both are liable to be called "רווח"/"רווחיות" on-screen. This is
exactly the shape of finding `src/CLAUDE.md`'s "same symbol, opposite behavior" section warns
about (the `formatDate` incident) — not a bug today, but a naming/documentation gap a build
session could easily fall into by either (a) not knowing `deriveProfitability` exists and
partially reinventing it, or (b) reusing it somewhere it doesn't fit (its null-on-partial-cost
contract, for instance, doesn't obviously match M8's frozen-snapshot inputs, which are never
partially known).

**Suggested question:** should the M8 build explicitly cross-reference `deriveProfitability`
(even just a comment noting "this is the quote-drafting estimate; M8's closing-time gross
profit is a separate, larger-scoped calculation") so the relationship is on record rather
than discoverable only by grep?

---

## Checks run for the "no findings" discipline (per claim area, Hebrew + English vocabulary)

- **RLS/policies:** `pg_policies` for `salary_reports`, `projects`, `assignments`, `quotes`,
  `quote_services`, `email_log`, `hostesses`, `product_costs`, `products` — all counts/gating
  cross-checked against the sweep's claims; one live discrepancy found and reported above (#1).
- **CHECK constraints:** `pg_constraint`/`pg_get_constraintdef` on `projects.project_status`,
  `projects.feedback_status`, `project_changes.*`, `logistics.item_status`,
  `logistics_origin_exactly_one` — all confirmed byte-for-byte against the ledger's claims.
- **RPC bodies:** read `set_project_finance_fields`'s live `prosrc` directly — confirmed it
  writes `invoice_sent`/`payment_date`/`feedback_score`/`negative_feedback_reason`/
  `feedback_notes`, confirmed it does **not** touch `feedback_status` at all (so ה5's
  "score save ⇒ `feedback_status='completed'`" is genuinely unbuilt, not a small tweak to an
  existing writer) and confirmed it carries no status/lock gate (matches ג5/ה12 exactly).
- **Live row counts:** `assignments` (27/27 at defaults for `personal_bonus`/`travel_amount`/
  `salary_report_id`), `salary_reports` (0 rows, 0 policies), `logistics` (14 rows, 0 with
  both source-pointers null, 8 in `ordered`/`ready`), `email_log` (32 rows, CHECK confirmed
  missing `invoice`/`salary_report`) — all match the sweeps.
- **Code search, both vocabularies** (כספים·שכר·חשבונית·משוב·רווח·ביטול /
  finance·salary·invoice·feedback·profit·cancel): grepped `src/`, `docs/micro_guides/`,
  `PROJECT_MASTER.md` §6 (`🚧 מ8`, 18 hits, all read in context per the reverse-contract
  sweep), `docs/db_roadmap.md` (confirmed every M8 Discovery decision — ה9/ה19/ה20/§7.20/S4 —
  is already write-backed there, satisfying iron rule 13(ב) for a Discovery session) — no
  `src/modules/08_*` folder exists yet (expected, confirmed), no `written_off` /
  `cancellation_fee` / `salary_report_lines` anywhere in `src/`, `schema.sql`, or migrations
  (confirmed these are genuinely new, as the spec assumes).
- **§7 register cross-check:** spot-checked the live snapshot arithmetic in
  `PROJECT_MASTER_sec7.md` (🟢62·🟡8·🔵3·⚪18·🟠1=92) against the Discovery's own closure
  claims (ה15–ה18/ה21, §7.20) — the counts reconcile.
- **Did not re-verify:** the four research/*.md files' external citations (job-costing,
  payroll, invoicing, feedback-survey conventions) — treated as out of scope for a DB/repo
  audit; world-sources.md already self-flags which of its claims are unsourced ("חיפשתי
  ולא מצאתי").

No further absence claims are made beyond what's listed above as findings.
