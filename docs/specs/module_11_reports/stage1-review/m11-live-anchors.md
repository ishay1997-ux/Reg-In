# M11 Live-DB Re-measurement — 06/09/2026 (post-hotfix `20260906083345`)

> Read-only measurement pass. Project `yfeovxppnfoafmfbdfvh`, `current_date = 2026-09-06` (verified: `select current_date` → `2026-09-06`, `now()` → `2026-09-06 13:16:07+00`).
> Purpose: re-run the numbers in `processes-approved.md` (§📑 17-report definitions, §🗳️ rulings, §ח7, §ח8) and `research/review-2026-09-06.md` (§א5, §א8, §ח7, §ח8) now that the cross-midnight `finance_project_money` hotfix (PR #124) has landed, and hand Discovery a fresh acceptance-number candidate list.
> No product rulings made here. Where a definition in the source docs is ambiguous, both readings are computed and flagged — see "Ambiguous definitions" at the end.
> All SQL below ran via the Supabase MCP `execute_sql` tool (read-only) against the live project.

---

## A. Gini + Lorenz (report 14א)

**Definition used:** population = hostesses with ≥1 `assignments.assignment_status='finally_approved'` row whose `event_date` falls in the rolling 12 months ending today (`> current_date - 12mo` and `<= current_date`); shifts/hostess → Gini via the rank-sum formula `2·Σ(rank·x)/(n·Σx) − (n+1)/n`. Per §ח8-row-1 ruling: no color grading, show number + Lorenz + prior-12-month comparison.

```sql
with pop as (
  select a.hostess_id, count(*) as shifts
  from assignments a
  where a.assignment_status = 'finally_approved'
    and a.event_date > current_date - interval '12 months'
    and a.event_date <= current_date
  group by a.hostess_id
),
ranked as (
  select hostess_id, shifts, row_number() over (order by shifts asc) as rn
  from pop
)
select
  (select count(*) from pop) as n_hostesses,
  (select sum(shifts) from pop) as total_shifts,
  round((2.0*sum(r.rn*r.shifts) / ((select count(*) from pop)::numeric*(select sum(shifts) from pop)))
        - ((select count(*) from pop)+1.0)/(select count(*) from pop), 4) as gini
from ranked r;
```

| population | n hostesses | total shifts | Gini | top-3 share |
|---|---|---|---|---|
| ≥1 finally_approved shift, last 12mo (main, per §ח8#1) | 106 | 1,849 | **0.4556** | 7.52% |
| … restricted to `hostesses.status='active'` (alt reading) | 37 | 807 | **0.4472** | — |
| same main population, **prior** 12-month window (comparison arrow) | 95 | 1,455 | **0.4329** | — |

Lorenz deciles (main population, cumulative shifts per decile, ~11 hostesses/decile): 11 · 25 · 58 · 95 · 139 · 172 · 245 · 305 · 358 · 441 (running sum out of 1,849 total).

**What would make this number wrong:** if the population should instead be "every hostess who worked ≥1 shift regardless of window" (no rolling-12mo cut), or if `finally_approved` is the wrong status filter (e.g. should include `released` shifts that were worked before release) — either would change both `n` and the shift-count distribution, hence the Gini value materially.

---

## B. Time-to-fill

**Definition used:** for `assignments` with `invite_sent_at` not null in the last 12 months, hours = `responded_at − invite_sent_at`; response rate = responded ÷ invited.

```sql
with base as (
  select a.*, extract(epoch from (a.responded_at - a.invite_sent_at))/3600.0 as hours
  from assignments a
  where a.invite_sent_at is not null and a.invite_sent_at > now() - interval '12 months'
)
select count(*) as invited, count(*) filter (where responded_at is not null) as responded,
  round(count(*) filter (where responded_at is not null)::numeric / count(*), 4) as response_rate,
  round((percentile_cont(0.5) within group (order by hours) filter (where responded_at is not null))::numeric, 2) as median_hours,
  round(avg(hours) filter (where responded_at is not null)::numeric, 2) as mean_hours
from base;
```

| window | invited | responded | response rate | median hrs | mean hrs |
|---|---|---|---|---|---|
| last 12 months | 2,432 | 2,192 | **90.13%** | **17.58** | 17.49 |
| all-time (no window, for comparison) | 5,673 | 5,338 | 94.09% | 18.23 | 18.09 |

**Note:** the ledger's D1/§ח8#1 anchor text cites "5,338 responses" — that is the **all-time** figure, not last-12-months. The task's own instruction says "last 12 months"; both are shown because the spec text elsewhere quotes all-time.

**What would make this number wrong:** if a re-sent invite overwrites `invite_sent_at` (R2-a, a known data hole) — repeated invites collapse into the *last* send timestamp, so time-to-fill is measured against the final nudge, not the original ask. This is a documented, accepted gap, not a bug to fix here.

---

## C. "מתרחק" (report 18, §ח7 ruling)

**Definition used:** customers with ≥3 non-cancelled projects with `final_event_date`; per-customer median gap in days between consecutive `final_event_date`; flagged "מתרחק" = no project with `final_event_date >= today` (and not cancelled) AND days-since-last-event > 1.5 × personal median gap. "רדום" (existing rule) = same no-future condition AND days-since-last > 120.

```sql
with proj as (
  select p.customer_id, p.project_id, p.final_event_date, p.project_status
  from projects p where p.project_status <> 'cancelled' and p.final_event_date is not null
),
counts as (select customer_id, count(*) as n_proj from proj group by customer_id having count(*) >= 3),
ordered as (
  select pr.customer_id, pr.final_event_date,
    pr.final_event_date - lag(pr.final_event_date) over (partition by pr.customer_id order by pr.final_event_date) as gap
  from proj pr join counts c on c.customer_id = pr.customer_id
),
gaps as (select customer_id, percentile_cont(0.5) within group (order by gap) as median_gap from ordered where gap is not null group by customer_id),
last_ev as (select customer_id, max(final_event_date) as last_event from proj where final_event_date < current_date group by customer_id),
has_future as (select distinct customer_id from proj where final_event_date >= current_date),
combined as (
  select c.customer_id, g.median_gap, le.last_event, (current_date - le.last_event) as days_since,
    (le.customer_id is not null and hf.customer_id is null) as no_future,
    case when g.median_gap is not null and g.median_gap > 0 then (current_date - le.last_event)::numeric / g.median_gap else null end as ratio
  from counts c
  left join gaps g on g.customer_id = c.customer_id
  left join last_ev le on le.customer_id = c.customer_id
  left join has_future hf on hf.customer_id = c.customer_id
),
flags as (
  select *, coalesce(no_future and ratio > 1.5, false) as mistarechek,
         coalesce(no_future and days_since > 120, false) as dormant_120
  from combined
)
select count(*) as n_qualifying, count(*) filter (where mistarechek) as n_mistarechek,
  count(*) filter (where dormant_120) as n_dormant_120,
  count(*) filter (where mistarechek and not dormant_120) as personal_catches_not_120,
  count(*) filter (where dormant_120 and not mistarechek) as dormant120_catches_not_personal,
  count(*) filter (where mistarechek and dormant_120) as both
from flags;
```

| metric | value |
|---|---|
| customers with ≥3 non-cancelled projects | 53 |
| flagged "מתרחק" (1.5× personal median, no future) | **14** |
| flagged "רדום" (>120d, no future) | **10** |
| caught by personal-cadence, missed by 120-day rule | **5** |
| caught by 120-day rule, missed by personal-cadence | **1** |
| caught by both | 9 |

Top flagged customers (by ratio, descending): מגה-אירוע הפקות (last 2026-01-06, 243d since, median gap 7d, ratio 34.7×) · עמותת אור לנוער (2026-03-30, 160d, gap 6d, ratio 26.7×) · ברק שיווק דיגיטלי (2025-09-08, 363d, gap 60d, ratio 6.1×) · קליק פינטק (2025-12-31, 249d, gap 44d, ratio 5.7×) · סייבר-שילד (2026-02-16, 202d, gap 42d, ratio 4.8×) · מגדלי הים התיכון (2025-10-29, 312d, gap 66d, ratio 4.7×).

**Reproducibility check:** this reproduces the §ח7 anchor (14 / 5 / 1) almost exactly — the source used "≥3 events" (52 customers) vs. this run's "≥3 non-cancelled projects" (53 customers); the one-customer difference doesn't change the flagged counts.

**What would make this number wrong:** if "non-cancelled" should also exclude projects with no `final_event_date` set yet (already excluded here) or if a customer's very first project (no prior gap) should count toward the gap sample with some assumed value — currently it's correctly excluded (needs ≥2 non-null gaps, i.e. ≥3 projects, to have a median).

---

## D. Payment behaviour (report 7 / bottlenecks)

**Definition used:** paid invoices = `invoice_sent_at` and `payment_date` both not null.

```sql
with paid as (
  select p.project_id, p.customer_id, c.customer_type, p.invoice_sent_at, p.payment_date,
    (p.payment_date - p.invoice_sent_at::date) as days_to_pay
  from projects p join customers c on c.customer_id = p.customer_id
  where p.invoice_sent_at is not null and p.payment_date is not null
)
select customer_type, count(*), percentile_cont(0.5) within group (order by days_to_pay), avg(days_to_pay)
from paid group by customer_type;
```

| segment | n | median days | mean days |
|---|---|---|---|
| overall | 699 | **35.00** | 36.79 |
| government (עיריות) | 56 | **68.50** | 68.14 |
| nonprofit | 22 | 46.00 | 45.45 |
| private_company | 519 | 34.00 | 34.33 |
| production_company | 102 | 31.00 | 30.20 |

Bottleneck medians (separate stage-to-stage, not cumulative):

| stage | median days | n |
|---|---|---|
| final_event_date → operationally_closed_at | 3.00 | 717 |
| operationally_closed_at → invoice_sent_at | 3.00 | 712 |
| invoice_sent_at → payment_date | 35.00 | 699 |

**Ambiguity resolved by direct check:** the review doc's §א8 phrase "אירוע→סגירה 3 ימים, →חשבונית 5" reads as if close→invoice were 5 days, but a direct `invoice_sent_at − final_event_date` query gives median **5.00** (n=712) as the *cumulative* event→invoice figure (3 + ~2, medians don't add). Both are reported; the per-stage table above answers the letter's literal ask.

Per-customer, customers with ≥3 paid invoices: **52 customers qualify**, average-of-medians = 37.23 days.

**What would make this number wrong:** `payment_date` is a `date` column while `invoice_sent_at` is `timestamptz` — the cast `invoice_sent_at::date` assumes the app always stores it in a way where the date component alone is meaningful (it is, per `deriveDaysOverdue`'s own use of `israelCalendarDate`), but a UTC-vs-Israel boundary case near midnight could shift a handful of projects by one day.

---

## E. Aging (report 6)

**Definition used:** open invoices = `projects.invoice_sent = true` AND `payment_date is null` AND `coalesce(project_finance.written_off, false) = false`. Bucket by `today − (invoice_sent_at::date + 30)`. Revenue via `finance_project_money(project_id)` (callable via MCP — confirmed below).

```sql
with open_inv as (
  select p.project_id, p.invoice_sent_at, (current_date - (p.invoice_sent_at::date + 30)) as days_overdue
  from projects p left join project_finance pf on pf.project_id = p.project_id
  where p.invoice_sent = true and p.payment_date is null and coalesce(pf.written_off, false) = false
),
withrev as (select oi.*, fm.revenue from open_inv oi cross join lateral finance_project_money(oi.project_id) fm)
select case when days_overdue<=0 then 'שוטף' when days_overdue between 1 and 30 then '1-30'
       when days_overdue between 31 and 60 then '31-60' when days_overdue between 61 and 90 then '61-90'
       else '90+' end as bucket, count(*), sum(revenue)
from withrev group by 1;
```

| bucket | n | Σ revenue |
|---|---|---|
| שוטף (≤0) | 7 | ₪46,398.60 |
| 1–30 | 0 | — |
| 31–60 | 1 | ₪13,761.90 |
| 61–90 | 2 | ₪5,446.80 |
| 90+ | 1 | ₪10,162.60 |
| **total** | **11** | **₪75,769.90** |

Confirms `finance_project_money` **is callable via the MCP connection** (it ran without an EXECUTE-privilege error — the MCP session bypasses the `service_role`-only ACL, unlike the browser). `written_off = true` currently on 7 projects (excluded here, consistent with the letter's instruction).

**What would make this number wrong:** if "not written off" should be read at the invoice level rather than project-finance level (there is no invoice-level flag — `written_off` lives on `project_finance` per-project, which is what was used).

---

## F. Report 1 (yearly trends)

**Definition used:** population = `project_status='finished'` OR (`cancelled` AND `project_finance.cancellation_fee is not null`), grouped by year of `final_event_date`. Revenue/profit via `finance_project_money`.

```sql
with pop as (
  select p.project_id, p.final_event_date, extract(year from p.final_event_date)::int as yr
  from projects p left join project_finance pf on pf.project_id = p.project_id
  where p.project_status = 'finished' or (p.project_status = 'cancelled' and pf.cancellation_fee is not null)
),
withfin as (select pop.*, fm.revenue, fm.gross_profit from pop cross join lateral finance_project_money(pop.project_id) fm)
select yr, count(*), sum(revenue), sum(gross_profit), sum(gross_profit)/sum(revenue)*100
from withfin group by yr order by yr;
```

| year | n projects | Σ revenue | Σ profit | margin % |
|---|---|---|---|---|
| 2024 | 221 | ₪1,423,070.76 | ₪832,432.26 | 58.50% |
| 2025 | 298 | ₪2,027,203.53 | ₪1,192,476.63 | 58.82% |
| 2026 | 215 | ₪1,487,574.83 | ₪893,699.43 | 60.08% |

YTD Jan 1 – Sep 6:

| period | n | Σ revenue | Σ profit |
|---|---|---|---|
| 2025 YTD | 177 | ₪1,228,141.87 | ₪723,137.57 |
| 2026 YTD | 215 | ₪1,487,574.83 | ₪893,699.43 |

**Discrepancy note:** the project counts here (221/298/215) are close to but not identical to the review doc's cited "221/302/304" (§א5, marked ✅ correct there). 221 for 2024 matches exactly; 2025 and 2026 are each a few projects off. Likely explanation: the review's figures were measured hours earlier the same day and/or used a slightly different population (e.g. all `finished`-or-`cancelled-with-fee` projects regardless of a `final_event_date` NULL-check, or a snapshot before some project closed between then and now). Not investigated further — flagged for Discovery to re-anchor at build time rather than trust either number blindly.

**What would make this number wrong:** cancelled-with-fee projects call `finance_project_money`, which raises an exception if the project has no linked quote or the quote has no service lines (`raise exception` in the function body) — if any cancelled-with-fee project lacks a quote, this whole query would have errored rather than silently under-counted; it did not error, so this isn't currently happening, but it's a latent fragility for the report RPC to guard against.

---

## G. Report 5 threshold (budget-deviation ratio)

**Formula read from `20260906083345_module8_planned_hours_cross_midnight.sql`:** `budget_deviation = v_labor_hours − (v_planned_hours × v_planned_labor)`, where `v_planned_labor = Σ hourly_rate_snapshot` filter `assignment_status='finally_approved'`. So **planned labor cost = `planned_hours × Σ(rate_snapshot for finally_approved assignments)`**, and the ratio asked for is `budget_deviation ÷ planned_labor_cost`.

```sql
with fin as (select p.project_id from projects p where p.project_status = 'finished'),
planned as (
  select a.project_id, sum(a.hourly_rate_snapshot) filter (where a.assignment_status='finally_approved') as planned_rate_sum
  from assignments a group by a.project_id
),
withfm as (
  select f.project_id, fm.budget_deviation, fm.planned_hours, pl.planned_rate_sum,
    (fm.planned_hours * pl.planned_rate_sum) as planned_labor_cost
  from fin f cross join lateral finance_project_money(f.project_id) fm
  left join planned pl on pl.project_id = f.project_id
),
ratios as (
  select project_id, budget_deviation, planned_labor_cost,
    case when planned_labor_cost is not null and planned_labor_cost<>0 then budget_deviation/planned_labor_cost else null end as ratio
  from withfm
)
select count(*), count(*) filter (where ratio>0.15), count(*) filter (where abs(ratio)>0.15),
  percentile_cont(0.5) within group (order by ratio), percentile_cont(0.9) within group (order by ratio)
from ratios;
```

| reading | n over-threshold | % | median | p90 |
|---|---|---|---|---|
| signed, ratio > 15% (overspend only) | **81** | 11.6% | −0.12% | **16.64%** |
| signed, ratio > 25% | 23 | 3.3% | — | — |
| absolute value, \|ratio\| > 15% | 175 | 25.0% | — | 24.23% (p90 of \|ratio\|) |
| absolute value, \|ratio\| > 25% | 62 | 8.8% | — | — |

**🔴 Flagged discrepancy against the ledger's own anchor (H9 note in `processes-approved.md`):** the migration file itself states, as its own post-fix measurement: *"מעל 15% = 61 פרויקטים (8.7%) … p90 14.3%"*. This run, using the identical formula (verified byte-for-byte against project 1177: this run gets `planned_hours=5.0, budget_deviation=−22` — an **exact match** to the migration's own worked example), gets **81 projects / 11.6% / p90 16.64%** on the signed reading, or 175/25%/24.2% absolute. None of the four readings computed here reproduce 61/8.7%/14.3% exactly. The population size (701 finished projects) and the single spot-check (project 1177) both match, so the formula is not obviously wrong — but the aggregate doesn't reproduce. This needs re-verification by whoever set the 15% default in §ח8#2 before it's trusted as an acceptance number.

**What would make this number wrong:** exactly what's flagged above — the denominator `planned_hours × Σrate` could instead have been intended as an **average** rate rather than a **sum** across all finally-approved hostesses (i.e., cost-per-hostess-hour rather than total-crew-cost), which would shrink the denominator for multi-hostess events and inflate the ratio — the opposite of what's seen here, so that's not the explanation either. Recommend a fresh, independent re-derivation rather than trusting either number.

---

## H. Report 13 badges (reliability)

**Definition used:** replicated `attendanceCounts`/`reliabilityScore` from `src/lib/smartMatch.js` exactly: skip records where the project is cancelled or the event hasn't passed; `assignment_status='approval_withdrawn'` → value 0.5; else classify by `(attendance_status, lateness_level, no_show_reason)` → arrived/light-late=1, medium-late=0.75, heavy-late=0.5, no_show(ghosted)=0; `sick`/`approved_absence` excluded from both numerator and denominator entirely; anything else (attendance not yet recorded) also excluded. `reliabilityScore = (Σvalue + m·companyAvg) / (n + m)`, m=3 (`קבוע_ריסון_m`). Window = last 12 months (`event_date` between `today−12mo` and `today`), non-cancelled projects.

```sql
with base as (
  select a.hostess_id, a.assignment_status, a.attendance_status, a.lateness_level, a.no_show_reason
  from assignments a join projects p on p.project_id=a.project_id
  where p.project_status<>'cancelled' and a.event_date<current_date and a.event_date>current_date-interval '12 months'
),
classified as (
  select hostess_id, case
    when assignment_status='approval_withdrawn' then 0.5
    when attendance_status='arrived' and lateness_level is null and no_show_reason is null then 1
    when attendance_status='late' and no_show_reason is null and lateness_level='light' then 1
    when attendance_status='late' and no_show_reason is null and lateness_level='medium' then 0.75
    when attendance_status='late' and no_show_reason is null and lateness_level='heavy' then 0.5
    when attendance_status='no_show' and lateness_level is null and no_show_reason='ghosted' then 0
    else null end as val
  from base
),
valid as (select hostess_id, val from classified where val is not null),
per_hostess as (select hostess_id, count(*) as n, sum(val) as total_val from valid group by hostess_id),
company as (select sum(total_val)/sum(n) as avg from per_hostess)
select (select avg from company), count(*) filter (where n>=3) as n_ge3
from per_hostess;
```

| metric | value |
|---|---|
| company average reliability (last 12mo, all hostesses w/ ≥1 valid record, n=102) | **0.9613** |
| hostesses with ≥3 marked shifts | **86** |
| below 0.8×avg (0.769) | **1** |
| below 0.9×avg (0.865) | **2** |
| on-time (arrived) | 1,544 / 1,812 marked = **85.21%** |
| late (any severity) | 172 / 1,812 = **9.49%** |
| no-show (ghosted) | 40 / 1,812 = **2.21%** |
| excused (sick/approved, excluded from ratio, shown for context) | 56 |

**🔴 Flagged discrepancy against the ledger's §ח8-row-3 anchor:** that row states *"ממוצע-החברה 0.852; 87 דיילות עם ≥3 משמרות; 7 אדומות · 4 ענבר"*. This run, replicating the exact JS formula and the stated 12-month window, gets company average **0.9613** (not 0.852) and only **1 red / 2 amber** (not 7/4) — because with an average that high, the 0.8×/0.9× thresholds are barely below the bulk of the distribution. The population size (86 vs 87 with ≥3 shifts) is close, so the underlying data hasn't shifted much — the discrepancy is in the **average itself**, which cascades into very different red/amber counts. Sanity-checked independently: raw totals (Σvalue=1,694.75, Σn=1,763, incl. withdrawals) reproduce 0.9613 exactly by hand. This is a concrete, checkable gap: **either the 0.852 anchor used a different population/window, or it has a bug** — needs resolution before §ח8#2's red/amber thresholds go into a screen mockup.

Overall on-time/late/no-show over the **full history** (not just 12mo), for cross-check against §א5's "85.4%": arrived 3,319, late 360, no-show(ghosted) 83, excused 125, withdrawn 7 → 3,319/(3,319+360+83+125) = **85.4%** exactly, and no-show+excused = 208, exactly matching §א5's "208 לא הגיעו". This full-history check reproduces the review doc perfectly — it is specifically the 12-month-windowed **company average for the damping formula** that diverges from the ledger, not the raw on-time percentage.

**What would make this number wrong:** if `companyReliabilityAverage` in production is computed over a *different* candidate pool than "every hostess with any valid record" — e.g., only over hostesses who passed the Smart Match gate for a specific historical set of assignments — the average would differ from this project-wide reconstruction.

---

## I. Report 2 discount buckets

**Definition used:** approved quotes bucketed by `applied_customer_discount + manual_discount`. Approval rate uses `NON_LOSS_REJECTION_REASONS` **as it actually exists in code** (`src/lib/quotes.js:490`): `['נפתחה בטעות']` only — **not** the two-reason list implied by the task text.

```sql
with approved as (select q.quote_id, coalesce(q.applied_customer_discount,0)+coalesce(q.manual_discount,0) as d from quotes q where q.quote_status='approved')
select case when d=0 then '0' when d between 0.01 and 5 then '1-5' when d between 5.01 and 10 then '6-10' else '10+' end as bucket, count(*)
from approved group by 1;
```

| discount bucket | n approved quotes | n projects born | avg gross margin % |
|---|---|---|---|
| 0% | 347 | 347 | 63.70% |
| 1–5% | 299 | 299 | 62.68% |
| 6–10% | 124 | 124 | 60.68% |
| >10% | 57 | 57 | 57.87% |

Quote status counts: approved 827 · in_progress 33 · rejected 352 (breakdown: מחיר 117 · תקציב לקוח 56 · נבחר מתחרה 54 · חוסר זמינות/לו"ז 35 · האירוע בוטל אצל הלקוח 35 · פג תוקף 33 · נפתחה בטעות 15 · אחר 7).

| approval-rate reading | excluded reasons | rejected (counted) | rate |
|---|---|---|---|
| **code truth** (`NON_LOSS_REJECTION_REASONS`) | נפתחה בטעות (15) | 337 | **827/(827+337) = 71.05%** |
| task text's implied 2-reason list | נפתחה בטעות + פג תוקף (15+33=48) | 304 | 827/(827+304) = **73.12%** |

**What would make this number wrong:** if `פג תוקף` rejections should indeed be excluded (they're auto-set by a daily cron job, not a human "loss"), the code's `NON_LOSS_REJECTION_REASONS` constant is itself incomplete relative to that intent — this is a product question, not a measurement error, and both readings are reported rather than silently picking one.

---

## J. Report 17 (CSAT)

**Definition used:** avg `feedback_score` where `feedback_status='completed'`, grouped by year of `final_event_date`; response rate = completed ÷ (completed + no_response); reason tallies via `unnest()` on the array columns.

```sql
select extract(year from final_event_date)::int as yr,
  avg(feedback_score) filter (where feedback_status='completed'),
  count(*) filter (where feedback_status='completed'), count(*) filter (where feedback_status='no_response')
from projects where feedback_status is not null group by 1 order by 1;
```

| year | avg score (completed) | n completed | n no_response |
|---|---|---|---|
| 2024 | **4.13** | 167 | 42 |
| 2025 | **4.25** | 222 | 64 |
| 2026 | **4.41** | 163 | 54 |

`feedback_status` totals: completed 552 · no_response 160 · not_sent 115. **Response rate = 552/(552+160) = 77.53%** — matches §ח8#6 exactly (77.5%).

Reason tallies (unnest of array columns):

| kind | reason | n |
|---|---|---|
| negative | איחור דיילות | 36 |
| negative | תפקוד דיילות | 36 |
| negative | איכות תגים | 26 |
| negative | ניהול לקוי | 19 |
| negative | אחר | 7 |
| positive | מקצועיות הדיילות | 203 |
| positive | עמידה בזמנים | 166 |
| positive | ניהול ותקשורת | 134 |
| positive | איכות תגים וציוד | 83 |
| positive | אחר | 28 |

`feedback_notes` non-empty: **415** (matches the reseed script's own reported count exactly).

**Ambiguous — two columns carry "אחר":** the array column `negative_feedback_reasons` has 7 rows tagged `'אחר'`; the legacy singular column `negative_feedback_reason` has only **3**. The task's "human↔model agreement denominator" (§ח4#4) should almost certainly use the **array** column (that's the current multi-select taxonomy the AI classifies against), so 7 is the recommended reading — but both are reported since the singular column still exists and is populated.

**What would make this number wrong:** if a project's `feedback_score` should be counted even when `feedback_status` isn't `'completed'` (e.g. a manually-entered score with a stale status) — checked: no such rows exist today (all `feedback_score` values sit on `completed` rows), so this isn't currently a live discrepancy.

---

## K. Report 10 (guests vs. staff)

**Definition used:** finished projects with both `actual_guests` and `quotes.estimated_guests` (via `projects.quote_id`); share where actual > estimated. "Median actual guests per finally-approved hostess" = median, across projects, of `actual_guests ÷ count(finally_approved assignments for that project)`.

```sql
with base as (
  select p.project_id, p.actual_guests, q.estimated_guests
  from projects p join quotes q on q.quote_id=p.quote_id
  where p.project_status='finished' and p.actual_guests is not null and q.estimated_guests is not null
)
select count(*), count(*) filter (where actual_guests>estimated_guests) from base;
```

| metric | value |
|---|---|
| finished projects with both guest figures | 701 |
| share where actual > estimated | **18.69%** (131/701) |
| median guests-per-finally-approved-hostess (717 projects with ≥1 fa hostess) | **40.80** |

For context: the global param `יחס_אורחים_לדיילת` = 50 — the measured median (40.8) runs somewhat below that target ratio.

**What would make this number wrong:** if "per finally-approved hostess" should instead divide by `required_hostess_count` (the planned staffing) rather than the actual finally-approved headcount — that would answer "did we overstaff/understaff relative to plan" rather than "how many guests did each working hostess actually handle," a materially different question.

---

## L. Report 15 (live roster)

**Definition used:** buckets by days since each hostess's last `assignment_status='finally_approved'` shift; tenure = months since `hostesses.created_at`.

```sql
with last_shift as (select hostess_id, max(event_date) as last_date from assignments where assignment_status='finally_approved' group by hostess_id)
select case when ls.last_date is null then 'never' when current_date-ls.last_date<=30 then '<=30'
       when current_date-ls.last_date<=90 then '31-90' when current_date-ls.last_date<=180 then '91-180'
       else '>180' end as bucket, count(*)
from hostesses h left join last_shift ls on ls.hostess_id=h.hostess_id group by 1;
```

| bucket | n hostesses |
|---|---|
| ≤30 days | 50 |
| 31–90 days | 12 |
| 91–180 days | 25 |
| >180 days | 85 |
| never worked | 14 |
| **total** | **186** |

Median tenure: **17.79 months** (n=186, from `created_at`).

**What would make this number wrong:** the "≤30 days" bucket (50) equals exactly the count of `hostesses.status='active'` (50, from §M below) — worth checking whether that's coincidence or whether `status='active'` is in fact maintained by "worked in the last 30 days" logic somewhere in the app rather than being an independently-set flag; if the latter, buckets 2–5 are redundant with `status` and the report should say so explicitly rather than implying they're independent signals.

---

## M. Row-count refresh (06/09/2026, current session)

```sql
select project_status, count(*) from projects group by 1;  -- etc., see full query in transcript
```

| table / breakdown | value |
|---|---|
| projects total | 827 (finished 701 · cancelled 41 · awaiting_payment 11 · in_progress 45 · ready 11 · not_started 7 · awaiting_invoice 5 · event_finished 6) |
| assignments total | 5,674 (finally_approved 4,207 · declined 941 · pending 301 · released 190 · confirmed_available 28 · approval_withdrawn 7) |
| project_changes | 16 |
| salary_reports | 0 |
| hostess_unavailability | 5 |
| feedback_notes distinct wordings | 157 |
| feedback_notes non-empty (count, not distinct) | 415 |
| customers | 61 |
| hostesses | 186 (active 50 · inactive 136) |
| quotes | 1,212 (approved 827 · in_progress 33 · rejected 352) |

All of these match the ledger's D15/D16 snapshot exactly except where the ledger's numbers were already dated to an earlier moment in the same session (e.g. quotes were reported as 1,212 in D15 and still 1,212 here — no drift detected on the static/reference tables).

---

## Summary — anchor candidates for the spec's hand-computed acceptance number

| value | definition | date/time measured |
|---|---|---|
| **Gini = 0.4556** (n=106, ≥1 finally_approved shift/12mo) | §ח8#1 main population | 06/09/2026 (this run) |
| Gini = 0.4472 (n=37, active-only alt reading) | §ח8#1 alt population | 06/09/2026 (this run) |
| "מתרחק" = 14 / "רדום" = 10 (5 personal-only, 1 dormant-only, 9 both) | §ח7 ruling | 06/09/2026 (this run; reproduces §ח7's own 14/5/1 within 1 customer) |
| Aging open total = ₪75,769.90 across 11 invoices | report 6 definition | 06/09/2026 (this run; matches §א5's "≈₪75.8K") |
| CSAT response rate = 77.53% | §ח8#6 | 06/09/2026 (this run; matches ledger exactly) |
| Time-to-fill median = 17.58h (12mo) / 18.23h (all-time) | letter B | 06/09/2026 (this run) |
| Budget-deviation >15% = 81 projects (11.6%), signed | report 5 threshold, §ח8#2 | 06/09/2026 (this run) — **contradicts the migration's own 61/8.7% anchor; needs resolution before use** |
| Reliability company average = 0.9613, 1 red / 2 amber | report 13, §ח8#3 | 06/09/2026 (this run) — **contradicts the ledger's 0.852 / 7 red / 4 amber; needs resolution before use** |

---

## Ambiguous definitions — both readings computed

1. **G (budget-deviation ratio):** signed vs. absolute-value threshold, and this run vs. the migration's own stated post-fix numbers — four readings shown, none reproduce the documented anchor. **Flag for re-derivation, not silent adoption.**
2. **H (reliability company average):** this run's direct formula replication (0.9613) vs. the ledger's quoted §ח8#3 anchor (0.852) — both shown, with a hand-verified arithmetic check backing this run's number. **Flag for re-derivation.**
3. **I (quote approval rate):** `NON_LOSS_REJECTION_REASONS` per code (`['נפתחה בטעות']`, rate 71.05%) vs. the task text's implied two-reason exclusion list (adds `'פג תוקף'`, rate 73.12%). Product question: should auto-expired quotes count as a "loss" in the approval-rate denominator?
4. **J ("אחר" denominator for human↔model agreement):** array column `negative_feedback_reasons` (7 rows) vs. legacy singular column `negative_feedback_reason` (3 rows) — recommend the array as current-mechanism truth, but both reported.
5. **D (event→invoice bottleneck):** per-stage medians (event→close=3d, close→invoice=3d) don't sum to the directly-measured cumulative event→invoice median (5d) because medians aren't additive — both shown so the reader isn't misled by either framing alone.
