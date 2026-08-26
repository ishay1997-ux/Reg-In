# Module 8 Research — Domain 4: Job Costing & Gross Profit for Event/Project Businesses

Context: REG-IN module 8 = finance & event closing. ~50 hostesses, 2-5 per event, single finance
manager, no ops team, academic project (coherence test, not scale). Feeds open question §7.58
(plan priced per-shift/per-item vs actuals tracked per-hour — basis mismatch).

Method note: every claim below is sourced from a real search result (WebSearch) or explicitly
tagged "מהידע שלי, לא אומת" if it slipped in without a source. No claim is invented.

---

## Q1 — Gross profit per event/job: standard formula, and where bonuses/travel sit

**The recognized shape, confirmed across multiple independent sources:**

- Basic job cost formula: **Total job cost = Direct materials + direct labor + applied overhead**;
  gross profit = revenue collected from the customer minus total production/direct costs. Example
  given: $50,000 job − $35,000 direct costs = $15,000 gross profit (30% margin). — [GrowthForce, Indeed.com via job-cost-formula search]
- Direct labor cost formula: **Direct Labor Cost = (Hourly Rate × Hours Worked) + Benefits and
  Payroll Taxes** — i.e. actual hours × a *burdened* rate, not a bare wage. — [Indeed.com/GrowthForce, same search]
- ServiceTitan's job-costing template computes **Gross Margin % = Profit / Total Revenue × 100%**
  and also carries absolute Total Revenue / Gross Margin columns side by side. — [help.servicetitan.com/docs/project-job-costing-report-template]

**REG-IN fit:** revenue-net-of-discounts-before-VAT minus (actual hours × frozen rate) minus direct
procurement matches this shape exactly — it's the standard job-cost formula, not a REG-IN invention.
✅ Fits — this is the universal practice, not an edge case being imported for nothing.

**Where do per-event bonuses and travel reimbursements sit — direct labor burden, or overhead?**

This is the sharpest finding of the domain. The concept that answers it is **"labor burden" / "fully
burdened labor rate"**:

- Labor burden = payroll taxes (FICA/Medicare/Social Security), workers' comp, unemployment
  insurance, health insurance, retirement, PTO, **and** "company cell phones," "equipment
  insurance," "training," **and explicitly "Bonuses"** and **"travel allowances."**
  "Burdened labor rates must factor in payroll taxes, health insurance, travel allowances, and
  additional costs like fringe benefits." — [knowify.com/resources/what-is-labor-burden], [constructioncoverage.com/business/labor-burden], [smartbarrel.io/blog/fully-burdened-labor-rate]
- The rationale for classifying **travel** specifically: "If traveling can be connected entirely to
  a specific job, it would be called a direct cost, but... business travel generally to see
  prospects, go to the bank or suppliers... [is] overhead not to a specific job." — [source found via "per diem / travel reimbursement job costing direct cost" search, exact site not individually named in result]
- Bonuses: knowify's source lists "Bonuses" as a labor-burden line item but does **not** distinguish
  a general/annual bonus from a project-specific incentive — it treats bonuses as folded into the
  burdened rate either way, without resolving whether a job-specific bonus is direct-labor-burden
  or overhead. **Gap, tagged explicitly below.**

**Fit assessment for REG-IN:** A hostess's per-event bonus and her travel reimbursement to *that*
event are both traceable to one specific event (unlike the "sales rep visiting the bank" example,
which is genuinely un-traceable and correctly overhead). By the sourced rule — traceable-to-one-job
= direct cost — **both belong in direct labor burden, not overhead.** This is a fit assessment, not
an invented rule: it's a direct application of the traceability test the sources use to draw the
line, to REG-IN's actual case (5 roles, one person each, small volume — you can trace a bonus to its
event without an allocation formula).

**Not fully resolved by search:** none of the sources gave a clean example of a *job-specific
incentive bonus* (REG-IN's case) as opposed to a *general employee bonus program* (the sources'
case) — tagged as a genuine gap, not glossed over.

---

## Q2 — Planned-vs-actual budget deviation: bridging a per-shift/per-item plan against
per-hour actuals (feeds §7.58)

Three concrete bridging patterns found, with sources:

### Pattern A — Re-rate the plan (flex the plan's *quantity* to actual output, keep the *rate* standard)

This is standard-costing's core technique, and it is the closest real-world analog to "the plan was
priced per shift, actuals come in per hour":

- Three-column variance analysis: **(Actual Hours × Actual Rate)** vs **(Actual Hours × Standard
  Rate)** vs **(Standard Hours Allowed for Actual Output × Standard Rate).** The middle-to-right
  comparison is exactly "what would the plan have cost if flexed to what actually happened" — i.e.
  the plan gets *re-rated* to the real basis before comparison. — [Chapter 9 Flexible Budgets, Standard Costs and Variance Analysis, fae.uprrp.edu PDF; saylordotorg.github.io Direct Labor Variance Analysis]
- This splits into two named variances: **rate/price variance** (AH × (AR − SR)) — did we pay more
  per hour than planned — and **efficiency/quantity variance** (Standard Hours vs Actual Hours) ×
  standard rate — did the job take more/less time than planned. — [efinancemanagement.com/budgeting/labor-cost-variance-meaning-formula-and-example, courses.lumenlearning.com/wm-managerialaccounting/direct-labor-cost-variance]
- Same logic appears in construction WIP reporting: "if approved scope changes have increased the
  expected cost, the denominator [in %-complete] should reflect the revised budget" — i.e. the plan
  itself gets revised/re-rated as facts change, not left frozen at the original quote. — [construction WIP report search result, multiple sources incl. Deltek/Adaptive/WhippleWood family]

### Pattern B — Compare at total-cost level only (aggregate, no basis reconciliation)

Simpler small-contractor tools skip line-level basis matching entirely and just compare **total
budget vs total actual per job/category**, without forcing the plan's unit (per-item) and the
actual's unit (per-hour) onto a common footing:

- LiveCosts: "Live Budget v Actuals... instant insights into how actual job costs compare to
  planned budget." — [livecosts.com/construction-job-costing-software]
- Buildxact: "compares the estimate to actual spend, line-by-line **or by job category**" — i.e.
  offers an aggregate option explicitly as an alternative to line-level matching. — [buildxact.com/us/features/construction-cost-tracking-software]

### Pattern C — Line-level variance with explicit basis tagging (cost-code level, not unit-forced)

Mid-market tools (Werx, FOUNDATION) track **budgeted, committed, and billed amounts side by side
per cost code** — labor, materials, equipment, subs — without requiring the original estimate unit
and the actual-tracking unit to match; each cost code just accumulates whatever actuals post to it,
and the comparison is cost-code-to-cost-code, not unit-to-unit. — [werxapp.com/features/job-costing, foundationsoft.com/software/job-costing]

**Fit assessment for §7.58:** REG-IN's case (plan = per-shift/per-item from a quote catalog, actual
= per-hour) is closest to **Pattern A** if REG-IN wants a *rate* comparison (was the per-hour cost
in line with what the per-shift price implied), and closest to **Pattern B** if REG-IN only needs a
total-cost sanity check per event (small volume, one finance manager — Pattern B's simplicity is a
real candidate, not just the "lazy" option). Pattern C is the weakest fit: it assumes multiple cost
codes and a bookkeeping cadence (committed vs billed) that doesn't exist here — one finance manager,
no procurement department issuing POs.

**Not found:** no source described the *exact* REG-IN shape (a catalog quote in "shift" units
reconciled against a timesheet in "hour" units) as a named pattern. This is a genuine niche the
literature doesn't name directly — the three patterns above are the closest real analogs, not an
exact match. Said plainly rather than forced into a false fit.

---

## Q3 — Scope changes / change orders: is customer billing for approved changes always in job
revenue, and is a quantity decrease credited or kept?

**Approved changes → always in job revenue: yes, with a specific trigger.**

- "All gross profit related to the changes in scope should be recognized **once the change order is
  approved in writing**." — [cfma.org / accountingforeveryone.com change-order revenue recognition search result]
- Under ASC 606 (US GAAP), change orders are treated as contract modifications — approved changes
  become part of the transaction price and revenue once approved; **unpriced/unapproved** changes
  are handled differently (recognized only if cost recovery is *probable*, which can mean recognizing
  the cost without matching revenue yet — i.e. a real accounting risk sits specifically in the
  unapproved-and-unwritten case). — [btcpa.net/insights/considerations-for-contractors-implementing-the-new-revenue-recognition-standard-asc-606, ellinandtucker.com change-order article]

**Quantity DECREASE — credited to customer or kept by the vendor?**

This is the most specific and well-sourced finding in the domain:

- Under standard AIA construction-contract logic: "the deduction from the Contract Sum will be
  calculated by using the **actual net cost** of the work removed... **the contractor will keep the
  original overhead and profit** associated with the descoped work." — [learn.aiacontracts.com/articles/contractors-overhead-and-profit-on-deductive-and-net-increase-change-orders]
- Rationale given: overhead is "cost of doing business," largely already incurred (estimating,
  coordination, vendor selection) by the time of the decrease, so clawing it back would be unfair.
  **Only the direct net cost is credited; profit/overhead margin is not.**
- Caveat found in the same source: "contract language varies... some contracts allow a maximum of
  5% total profit and overhead on deductive change orders, [others] no mark-up at all" — so this is
  a *convention*, not a universal rule; the specific credit percentage is a negotiated term.

**Fit assessment for REG-IN:** the pattern "credit the direct cost, keep the margin" is a defensible
default for a quantity-decrease on an event (e.g. customer cuts 2 hostesses from a booked 10) — it
matches the "already-incurred coordination cost" logic even better in REG-IN's case, since the
finance/ops overhead of arranging the original booking was already spent regardless of the later
cut. This is a fit assessment worth bringing to Ishay as a sourced default, not a decision made here.

---

## Q4 — Two-number profit model (live expected profit while running, frozen final profit at
close): is freeze-at-close recognized, and what triggers it?

**Yes — this is a named, standard practice, called WIP (Work-In-Progress) reporting in construction/
job accounting, and the freeze trigger is explicitly financial, not operational.**

- A WIP report tracks, *while the job is open*: "total contract value, costs incurred to date,
  estimated cost to complete... percentage complete... earned revenue to date." This **is** the
  live/running profit number — recalculated regularly ("updated monthly at minimum... makes
  percentage-of-completion accounting functional in practice"). — [multiple sources: Deltek, Adaptive, ProjectManager, WhippleWood, Excelcomplete — construction WIP search]
- The freeze happens at a **separate, later** milestone than operational completion:
  - **Substantial/operational completion** ("owner and contractor agree a building is ready for its
    intended use... kicks off a chain reaction of legal and financial milestones") starts the
    closeout process but does **not** itself lock the numbers.
  - **Financial completion** — "final change order reconciliation, payment applications, lien
    waivers, retainage requests, backcharge review, and final account settlement" — is the step
    that actually performs "the accounting settlement and cost lock-out." — [academy2.youngarchitect.com/project-closeout, procore.com/library/construction-closeout, cmicglobal.com Construction-Project-Closeout-Checklist]
  - Explicit best-practice recommendation found: **"separate physical completion, document
    completion, and financial completion into distinct tracks."** — [same closeout-process search result]
- A second, independent source frames it the same way for construction accounting generally: "It's
  the bridge between having a physically finished building and a financially closed-out project...
  even if physical work is complete, [full closeout] cannot occur without" further financial steps;
  financial closeout "typically occurs **after** the completion of all construction work." — [getvergo.com/define/financial-closeout]

**Fit assessment for REG-IN:** this maps cleanly onto REG-IN's two numbers. "Event ends" =
operational/physical completion (starts the closing process, does not freeze anything). The freeze
trigger should be a **financial** event — the sourced practice would say: after the last direct cost
is booked and the invoice is confirmed sent/paid, not merely "the event happened." This is exactly
the shape of a "reality filter" question to bring to Ishay (do we have a discrete financial-closeout
action in this module, or does the freeze need a different concrete trigger for a business this
size?) — not a ruling made here.

**Not found:** no source gave a **small-business-scale** example of freeze-at-close (this is 100%
sourced from construction-industry WIP practice, which operates at far larger jobs/longer timelines
than a REG-IN event). Tagged explicitly: **the practice imported here is the freeze-trigger logic
(financial ≠ operational completion), not the WIP-reporting infrastructure itself** (percentage-of-
completion revenue recognition, retainage, lien waivers are all construction-scale machinery REG-IN
has no use for — see Rejected section).

---

## Q5 — Percentage vs currency display: % on lists, absolute currency on the closing statement

**Mixed finding — partially confirmed, not a clean universal split.**

- ServiceTitan's job-list report template leads with **percentage** columns ("Materials + Equip. +
  POs As % of Sales," "Total Cost As % of Sales," "Labor Burden as % of Sales") but **also** carries
  absolute-currency columns (Material Costs, Labor Pay, Total Costs) **in the same list view** —
  i.e. % is the lead metric on the list, but currency isn't exclusively reserved for a separate
  detail view; both coexist. — [help.servicetitan.com/docs/project-job-costing-report-template]
- QuickBooks' Job Profitability report explicitly shows **"profit by project in both dollars and
  percentages"** together, and the underlying Profit & Loss by Job report is a currency-first
  statement (income/cost/profit line items in $, not %). — [fourlane.com/quickbooks-job-costing-reports-wip search result summary]
- ServiceM8's dashboard-level Gross Profit Margin is percentage-only at the dashboard/summary level
  ("percentage of total sales value... which was profit"), while the underlying Quotes & Invoicing
  tab on the job card itself shows Cost Price (currency) alongside a %Margin column. — [support.servicem8.com Gross-Profit-Margin-in-the-Business-Dashboard-Report]

**Fit assessment for REG-IN:** the *direction* of REG-IN's ruled split (list = %, closing statement
= currency) is directionally supported — every tool found leads a list/dashboard view with % and
puts full currency detail in the per-job statement — but **no source shows a system that shows %
ONLY on the list and currency ONLY on the closing statement with zero overlap.** Every real example
found shows both formats coexisting to some degree at both levels. **This should be reported to
Ishay honestly as "your split is the right direction and matches the pattern leaders use, but the
strict either/or is not itself a documented external convention — it's a reasonable simplification
of the pattern, worth naming as ours."**

---

## Searched for and did NOT find (worth as much as what was found)

1. **No source named the exact REG-IN basis-mismatch** (quote priced in "shifts"/catalog items,
   actuals tracked in "hours") as a named job-costing pattern. Searched: "shift-based staffing quote
   vs hourly actual timesheet reconciliation," "professional services fixed-fee vs hourly
   realization rate." Found adjacent patterns (realization rate in professional services, the three
   bridging patterns in Q2) but nothing that names this specific shift-vs-hour mismatch directly.
2. **No source distinguished a job-specific incentive bonus from a general/annual employee bonus**
   for burden-vs-overhead classification — every "labor burden" source lists bonuses as a burden
   component without addressing whether project-tied bonuses are treated differently from
   company-wide bonus programs.
3. **No small-business-scale (non-construction) example of the freeze-at-close / WIP two-number
   model** was found — the practice is well-documented in construction accounting specifically;
   attempts to find a services/staffing-industry equivalent at REG-IN's scale did not surface a
   named parallel practice (searched "staffing agency" and "professional services" variants).
4. **No source showed a strict %-only-on-list / currency-only-on-statement split** with zero
   overlap — see Q5 above; every real dashboard example mixes both formats to some degree.
5. Attempted `WebFetch` on cfma.org's dedicated change-order article — blocked (HTTP 403). The
   claim about change-order revenue recognition triggering "once approved in writing" is sourced
   from the WebSearch result summary of that same article (title: "The Constant Challenges Faced
   When Accounting for Change Orders & Claims," cfma.org), not from a direct fetch of the full text
   — flagging this as a slightly weaker citation than the others (search-snippet-sourced, not
   full-article-verified).

---

## Considered and rejected for this project

Practices found in the research that solve a problem REG-IN does not have (scale, multi-tenant,
regulatory audit trail, multi-year projects) — imported for completeness, then rejected with reason:

| Practice | What it solves | Why rejected for REG-IN |
|---|---|---|
| **Percentage-of-completion revenue recognition (ASC 606 cost-to-cost method)** for recognizing revenue *during* a multi-month job | Multi-year/multi-quarter construction contracts where revenue must be recognized before the job finishes, for GAAP compliance and investor reporting | REG-IN events are single-day-to-few-day engagements — there is no multi-period revenue-recognition problem to solve. The "live expected profit" number REG-IN wants is an internal management view, not a statutory revenue-recognition requirement. |
| **Retainage / lien waivers / bonding** at job closeout | Protecting an owner against a contractor's non-performance on a large, long-duration capital project; protecting subcontractors' payment rights | REG-IN has no subcontractor chain, no capital project, no multi-party payment risk of that kind — single vendor (the company itself) invoicing a single customer per event. |
| **Multi-cost-code / committed-vs-billed tracking (Pattern C, Werx/FOUNDATION style)** | Coordinating dozens of trade subcontractors and purchase orders across a large job | One finance manager, no procurement department, tiny per-event vendor count — this is bookkeeping infrastructure for a scale REG-IN doesn't have. |
| **Labor rate variance / efficiency variance as two separately reported, formally named variances** | Manufacturing/large-crew environments where a plant manager needs to know *whether* an overrun came from paying more per hour or taking more hours, across many workers per job | Useful as a *concept* (folded into Pattern A above) but formally splitting and separately displaying "rate variance" and "efficiency variance" as two distinct dashboard numbers is more structure than 2-5 hostesses per event needs — one deviation number with a drill-down is proportionate; a named two-variance system is not. |
| **Deductive-change-order overhead/profit retention as a formally negotiated contract clause (with specific % caps)** | Large capital contracts where overhead-and-profit-on-deductions is contentious enough to need explicit contract language and legal precedent | The *logic* (credit direct cost, keep margin) is worth importing (see Q3); the *machinery* of it being a negotiated, contractually-capped clause is not — REG-IN doesn't sign construction-style contracts per event. |

---

## Sources (consolidated)

- growthforce.com/blog/expand-your-profit-margins-with-job-costing-learn-how
- indeed.com/career-advice/career-development/job-cost-formula
- help.servicetitan.com/docs/project-job-costing-report-template
- knowify.com/resources/what-is-labor-burden
- constructioncoverage.com/business/labor-burden
- smartbarrel.io/blog/fully-burdened-labor-rate
- fae.uprrp.edu (Chapter 9 — Flexible Budgets, Standard Costs, and Variance Analysis, PDF)
- saylordotorg.github.io/text_managerial-accounting (10.4 Direct Labor Variance Analysis)
- efinancemanagement.com/budgeting/labor-cost-variance-meaning-formula-and-example
- courses.lumenlearning.com/wm-managerialaccounting/direct-labor-cost-variance
- livecosts.com/construction-job-costing-software
- buildxact.com/us/features/construction-cost-tracking-software
- werxapp.com/features/job-costing
- foundationsoft.com/software/job-costing
- cfma.org — "The Constant Challenges Faced When Accounting for Change Orders & Claims" (search-snippet sourced; direct fetch blocked 403)
- btcpa.net/insights/considerations-for-contractors-implementing-the-new-revenue-recognition-standard-asc-606
- ellinandtucker.com/insights/constant-challenges-faced-when-accounting-for-change-orders-and-claims
- learn.aiacontracts.com/articles/contractors-overhead-and-profit-on-deductive-and-net-increase-change-orders
- academy2.youngarchitect.com/project-closeout
- procore.com/library/construction-closeout
- cmicglobal.com/resources/article/Construction-Project-Closeout-Checklist-A-Complete-Guide
- getvergo.com/define/financial-closeout
- deltek.com/en/construction/accounting/work-in-progress
- adaptive.build/blog/construction-wip-reports-guide
- projectmanager.com/blog/wip-report-construction
- whipplewood.com/insights/construction-accounting-job-costing-guide
- fourlane.com/quickbooks-job-costing-reports-wip
- support.servicem8.com/help-center/servicem8-add-ons/reports/gross-profit-margin-in-the-business-dashboard-report
- help.housecallpro.com/en/articles/6596631-job-costing-reports
- wgcpas.com/article/the-importance-of-measuring-realization-in-a-professional-services-firm (realization rate — Q2 adjacent)
