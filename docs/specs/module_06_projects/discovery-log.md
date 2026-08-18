<div dir="ltr">

# Module 6 (Projects) — Discovery Log

> **What this file is:** the evidence trail behind every ruling in `processes-approved.md`. English by
> repo convention (reader = Claude); Hebrew appears only as data — Ishay's quotes, UI strings, §7 refs.
> **Written during the work, not after.** Newest stage at the bottom.

---

## Stage 1 — Processes · 13/08/2026

### Session opening — a resume-from-disk catch, before any work

`STATUS.md` and the 12/08 journal entry both stated module-6 Discovery stage 1-א was *"presented to
Ishay, approved"*. **`docs/specs/module_06_projects/` did not exist.** Nothing had been written to disk.
⇒ Stage 1-א was **re-run**, not continued. *(The exact failure mode the global CLAUDE.md names:
"narration is intent, not evidence".)*

### The reframe — Ishay changed what this module is about

His words, mid-session:
> *"תנסה להתעלם מהמוקאפ, הוא נכתב לפני כ-5 חודשים… זה רק רעיון. גם האפיון נכתב מזמן. אנחנו עכשיו
> באמת מנתחים את המצב הקיים ומה שאמור להיות — **אנחנו לא סתם מעתיקים מה שכתוב באפיון, אנחנו ממש
> עושים חשיבה מחדש**."*

And the actual question:
> *"איך מנהלת פרויקטים יכולה לבצע בקרה על הפרויקטים בצורה הטובה, היעילה והנעימה למשתמש, שממש
> **יניע אותה לפעולה**, יעזור לה להבין **לאיזה פרויקט היא צריכה להיכנס עכשיו** ולטפל בו, או
> **לדבר עם המנהלות** שיקדמו דברים."*

🔑 **This is nearly verbatim what he said in module 4's Discovery on 06/08/2026** — *"מסך מבט על של
המנהלת… על איזה פרויקט להיכנס ראשון… שיהיה עבורה מסך שמקל עליה בקבלת החלטות"* — **and he did not
remember saying it.** His product intuition is consistent across five weeks; the artifact was what
was missing, not the thinking.

⇒ **Consequence for this module:** C5 §5.6.6 (tabs by status + counters + flat list) is *inventory*.
The module needs *triage*. Precedent exists in-house and is already approved: module 4's overview
screen card (`docs/specs/module_04_hostesses/screens-approved.md`, "מסך 1") — same problem in one
dimension. Its five rulings were adopted rather than re-invented (iron rule 1, case ②: a similar
component behaving differently is a contradiction to resolve, not a free choice).

### Research — 4 agents, approved by Ishay, split by domain (§5 rule ב)

One agent was lost to a crash mid-run and three were relaunched; the relaunched prompts added an
explicit *"do not spawn sub-agents"* after the first run fanned out and never synthesized.

**Convergence across three independent domains — the strongest single result:**

| Domain | Verbatim finding |
|---|---|
| Dispatch (ServiceTitan · Jobber · Salesforce FSL) | *"I found no product that sorts its primary board by a composite urgency score — worth noting, since that is the obvious thing to build and nobody ships it."* |
| Staffing (Nowsta · Deputy · TempWorks · Shiftboard) | *"I found no product that ranks a gap list by a formula."* Ranking is chronological or by filter. |
| Design literature (NN/g · OECD · CHI) | At 10–40 rows, *"an ordered list with a one-line reason beats a score, and it's far more defensible orally."* |

**The finding that invalidated the old colour rule:** *"days-to-event is not health. A project 3 days
out and fully staffed is green; a project 30 days out with zero confirmed hostesses is red. Colouring
by the calendar encodes the one variable she already knows."*

**Verified against live data (13/08/2026), not argued:**

| Project | Away | Hostesses | C5 §5.5.2 colour | Reality |
|---|---|:--:|---|---|
| כנס לקוחות שנתי | 9 days | 1/6 | 🔴 red | correct |
| כנס טכנולוגיה שנתי | 33 days | 0/1 | 🟢 green | its only hostess is missing |
| **כנס רפואה 2026** | 45 days | **0/6** | 🟢 **green** | **zero of six** |
| תרחיש-קבלה 5.1 | **12 days PAST** | 0/6 | undefined | date passed, nobody noticed |

**Single world precedent for our exact shape:** **Rentman** (event equipment rental) is the only
system found that measures readiness across two dimensions — crew *and* equipment — **and it
deliberately keeps them as separate indicators instead of merging them into one score**
([Rentman Project Status](https://support.rentman.io/hc/en-us/articles/360013587379-Project-Status)).
None of the eight shift-work platforms do this; they have no equipment dimension at all.

**Change-order anchor** (Ishay conditioned his approval of ruling ③ on this being world practice, so
it was verified before being relied on): additional work is priced at the **same rates and terms as
the original contract**; in Job Order Contracting this is formalized — every change is priced from
the original scope's unit price book
([Gordian](https://www.gordian.com/resources/joc-advantage-consistent-pricing-change-orders/),
[Rhumbix](https://www.rhumbix.com/blog/change-orders-construction-definitive-guide)). Event-industry
specific: freelancer and sub-rental commitments are non-recoverable once made, so changes must carry
explicit pricing, and cancellation norms are graduated by proximity — 25–50% within 30 days, 75–100%
within 14 ([Zigaflow](https://www.zigaflow.com/industry-resources/event-av-production-quote-contract-billing-discipline)).
⇒ **Ishay's `§7.16ב` tiers match the industry structurally**; his numbers differ, which is his call.

### Live DB measurements — `docs/schema.sql` is stale on two tables

Read from the live database via MCP (read-only), not from the snapshot:

- **`projects`** carries 9 columns absent from `schema.sql`: `event_name`, `customer_id`,
  `final_start_time`, `final_end_time`, `lat`, `lng`, `customer_name`, `owner_name`, `owner_phone`.
- **`assignments`** differs materially: `hostess_id` (not `id_number`), **6** status values (not 4,
  incl. `approval_withdrawn`), plus `responded_at`, `invite_token`, `invite_sent_at`, `travel_amount`,
  `is_shift_lead`, `event_date`.
- **`logistics`** matches the snapshot — but has **zero RLS policies**. RLS on + no policies =
  deny-all, silently, with `error: null`. ⇒ **M6's second readiness dimension has no data path today.**
- **`projects`** has a SELECT policy and **no INSERT/UPDATE/DELETE policy** ⇒ every M6 write must go
  through a dedicated DB function, as quote-conversion already does.
- **`projects.cancel_reason` is free text; there is no `cancelled_at` and no standard/force-majeure
  distinction.** ⇒ a cancellation performed today destroys the input `§7.16ב`'s compensation tiers
  require, and it cannot be reconstructed afterwards.
- **10 email templates in `params`** — every one addressed to a customer, a hostess, or the user
  themselves. **Not one to a colleague.** This is what makes Ishay's "no notifications" ruling a
  statement of the existing architecture rather than a new constraint.

### 🔴 The register sweep — triggered by Ishay's question, and it changed the surface list

Ishay asked: *"ומבחינת דברים פתוחים, חוסמים, חובות ממודולים אחרים — אספת הכל הכל?"*
**Honest answer at that moment: no.** Items had been collected opportunistically as they surfaced.

The systematic sweep that followed (`grep '🚧 מ6' docs/PROJECT_MASTER.md` → 13 occurrences / 9 debts;
`·מ6` status tags in `docs/PROJECT_MASTER_sec7.md` → 12 items) found **12 items absent from the
draft.** Full table in `processes-approved.md` §סריקת-הרשמים. The three that matter most:

1. **A whole surface would have been lost.** M6 owes three separate debts inside **module 2's customer
   card** — project history, the **"upcoming vs past" tab split (Ishay's ruling 30/07/2026)**, and two
   derived metrics plus a "dormant" filter. Surface list went **7 → 8**.
2. **`§7.9` was answered today without anyone knowing it existed.** It asks whether the mockup's
   literal weighted formula — *50% proximity + 30% staffing gap + 20% open logistics* — is a real
   spec requirement or a mockup-only addition. Ruling ⑧ answers it exactly. **Left 🟡: §7 closure is
   Ishay's alone (iron rule 1).**
3. **The operational closing is more blocked than assumed:** `§7.61` (no Storage plan exists, yet the
   summary report is a *mandatory* file at close, C5:647) · `§7.77` (columnar locking) · `§7.63`
   (column ownership vs RLS) · `§7.39` (feedback survey sent twice, by M6 and by M8).

Also surfaced: **`§7.32` was already open** for the gap found independently this session — nothing
writes `event_finished` when the date passes (live proof: project `#7`, event 01/08, still
`not_started` 12 days later; `pg_cron` is installed and already runs two M3 jobs). And
⚠️ **E2E fixtures rot ~28/08 (`🚧 מ6 ← מ3`) — the interim presentation date.**

🔑 **Method lesson:** the sweep is a one-minute `grep` on two registers and is **not a judgement
call**. It ran only because Ishay asked. It belongs in stage 1-א unconditionally.

### Process observations — what worked and what did not

- ⚠️ **Ishay pushed back on flooding, twice:** *"אתה קצת מציף אותי ואנחנו מאבדים דברים בשיחה. בא
  נעבור דבר דבר ולא נקפוץ."* **Diagnosis: much of the discussion was stage-2 screen design leaking
  into stage 1** — which is precisely why it felt abstract and unbounded. Process cards (scope change,
  cancellation, release) moved fast; screen questions did not.
- **A mockup of surface 1 was drawn and then correctly parked by Ishay** — *"המוקאפים זה בשלב יותר
  מאוחר"*. It stayed in scratch and was **not** copied into the repo. It did earn its cost once: it
  made ruling ⑧ concrete in a way prose had not.
- **Register calibration from Ishay, saved to memory:** in a planning session, a missing column or
  policy is the **expected output**, not an alarm — *"לא להתרגש, זה חלק מהאפיון… בגלל זה עושים את
  התכנון הזה."* 🔴 is reserved for something that breaks what already works.
- **Methodology question he raised, and the answer:** process and mockup stay **separate**; screen and
  mockup are **already merged** (his own ruling 06/08/2026). If they were mixed,
  `processes-approved.md` — the file a fresh session reads — could not distinguish "this is how the
  process was decided" from "this is how a picture looked".

### Stage 1 — where it stopped

**Written:** `processes-approved.md` (9 rulings, full register sweep, ⬜ surface list, explicit next
item) and this log.
**Deliberately NOT written:** `db_roadmap.md` rows and any §7 write-back — both wait on approval of
the surface that produced them (Discovery protocol, stage 2).
🛑 **Blocking stop: the 8-surface list is not approved.** Stage 2 must not start.

</div>
