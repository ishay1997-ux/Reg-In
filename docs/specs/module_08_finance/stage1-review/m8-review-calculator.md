# Module 8 Discovery Review — Angle 2: Independent Calculator

Fresh-context reviewer. Read-only. Source of formulas: `docs/specs/module_08_finance/processes-approved.md`
sections ה2, ה7, ה14–ה18, ה21, the P1–P4 cards, and the §7.20 three-part ruling as quoted at line 225
(no other file in the repo was read for formula text — only for column/function verification). Live data:
Supabase project `yfeovxppnfoafmfbdfvh`, queried today (26/08/2026). All money figures shown to the agora
(2 decimals) as the codebase does (`src/lib/pricing.js` — internal math in agorot).

---

## PART 0 — Scope correction before the numbers

The task brief that generated this review assumed labor cost = **planned** event hours × Σ finally-approved
hostesses' `hourly_rate_snapshot`. That is **not** what the approved spec says. Read verbatim:

- ה7 (line 251): *"גזירת-שכר פר-דיילת = `assignments.actual_hours × hourly_rate_snapshot + personal_bonus`
  — ישירות מהשורות (אין 'פיזור' מנתון-אירוע)"*
- P3 card (line 321): *"הוצאות = שכר-בפועל (שעות×תעריף-קפוא — `hostessActualCost` הקיים)"*

Both anchor to **actual** hours, confirmed live in code: `hostessActualCost(actualHours, hourlyRateSnapshot)`
in `src/lib/projectClosing.js:84` multiplies `actualHours × hourlyRateSnapshot`, nothing else. There is no
function anywhere in `src/lib/` that computes a *planned*-hours labor cost.

I computed the spec-literal number (actual_hours-based) as the primary figure for all three tasks below, and
separately show what a planned-hours reading would produce, labelled as an **unanchored alternate**, not the
spec. This gap is itself Finding #1 (below) — it is not cosmetic, because for all three candidate demo
projects (#13/14/15) `actual_hours = 0` (none has run yet), so the spec-literal formula returns **zero labor
cost**, not a small number.

---

## PART 1 — Expected profit (project #13, quote #26 — primary; project #15 shown second to exercise the `project_changes` term)

### Inputs read (live, 26/08/2026)

`projects` (project_id=13): `quote_id=26`, `project_status='ready'`, `final_event_date=2026-08-26`,
`final_start_time=09:00`, `final_end_time=13:00`, `actual_hours=NULL`, `operationally_closed_at=NULL`.

`quotes` (quote_id=26): `applied_customer_discount=0.00`, `manual_discount=0.00`, `vat_rate_snapshot=18.00`,
`estimated_hours=4.00`.

`quote_services` (quote_id=26):
| sku | qty | closing_unit_price | closing_unit_cost |
|---|---|---|---|
| 04ST (hostess svc) | 4 | 500.00 | 300.00 |
| B-REG-TAG | 300 | 5.00 | 2.50 |
| B-FAB-LAN | 300 | 6.00 | 3.00 |

`project_changes` for project 13: **0 rows** (the table has exactly 1 row total, and it belongs to project 15).

`assignments` (project_id=13, all 4 rows `assignment_status='finally_approved'`):
| hostess_id | hourly_rate_snapshot | actual_hours | personal_bonus |
|---|---|---|---|
| 12 | 42 | 0 | 0 |
| 14 | 44 | 0 | 0 |
| 15 | 41 | 0 | 0 |
| 16 | 46 | 0 | 0 |

`logistics` (project_id=13):
| sku | planned_qty | item_status |
|---|---|---|
| B-FAB-LAN | 300 | ready |
| B-REG-TAG | 300 | ready |

`params`: `אחוז_מעמ=18`, `סכום_נסיעות_למשמרת=0` (live value — see Finding #2).

### Revenue (ה2: quote `preVat` + Σ `project_changes` pre-VAT)

`computeQuoteTotals` (`src/lib/pricing.js:110`): `subtotal = Σ(qty×unitPrice)`, `discount = subtotal×(applied+manual)%`,
`preVat = subtotal − discount`.

```
subtotal = 4×500.00 + 300×5.00 + 300×6.00 = 2,000.00 + 1,500.00 + 1,800.00 = 5,300.00
discount = 5,300.00 × (0% + 0%) = 0.00
preVat   = 5,300.00
Σ project_changes (project 13) = 0.00  (no rows)
────────────────────────────────────────
REVENUE = 5,300.00 + 0.00 = 5,300.00 ₪  (pre-VAT)
```

### Costs (P3 card, spec-literal — actual_hours)

```
Labor    = Σ hostessActualCost(actual_hours, rate) = 4 rows × (0 hours × rate) = 0.00
Bonuses  = Σ personal_bonus = 0.00
Travel   = shifts(4) × param(0) = 0.00
Goods    = Σ planned_qty × closing_unit_cost
         = 300×3.00 (B-FAB-LAN) + 300×2.50 (B-REG-TAG)
         = 900.00 + 750.00 = 1,650.00
────────────────────────────────────────
COSTS = 0.00 + 0.00 + 0.00 + 1,650.00 = 1,650.00 ₪
```

### Result

```
EXPECTED PROFIT (spec-literal) = 5,300.00 − 1,650.00 = 3,650.00 ₪
```

### Unanchored alternate — planned-labor reading (not in the approved spec; shown because the task brief assumed it)

```
Planned labor = estimated_hours(4.00) × Σ rate(42+44+41+46=173) = 4.00 × 173 = 692.00
Alt costs (live travel=0)          = 692.00 + 0 + 0.00  + 1,650.00 = 2,342.00 → Alt profit = 2,958.00 ₪
Alt costs (ה20 travel=22.60×4=90.40) = 692.00 + 0 + 90.40 + 1,650.00 = 2,432.40 → Alt profit = 2,867.60 ₪
```

The spread between the spec-literal number (3,650.00) and the planned-labor alternate (2,958.00) is
**692.00 ₪ — 100% of the planned labor cost** — because the spec-literal formula has no live labor cost to
report pre-event. See Finding #1.

### Secondary example — project #15 (quote #28), to exercise the `project_changes` term

`quote_services` (quote_id=28) lines sum to `subtotal = 1,000.00(04ST) + 825.00(B-REG-TAG) + 1,260.00(B-SAT-LAN)
+ 400.00(B-ECO-TAG) + 2,500.00(01WEB) + 75.00(REG-TAG) = 6,060.00`; discounts 0/0 → `preVat = 6,060.00`.

`project_changes` row (change_id=3, the only row in the table): `project_id=15, sku=REG-TAG,
change_target='logistics', delta_qty=-25, unit_price_snapshot=3.00` → revenue delta = `-25 × 3.00 = -75.00`
(this exactly reverses the original REG-TAG line, 25×3.00=75.00 — the customer fully cancelled that add-on).

```
REVENUE(15) = 6,060.00 + (−75.00) = 5,985.00 ₪
```

Costs: `assignments` for project 15 has 1 row (hostess 24, rate 41, actual_hours=0) → labor=0; `logistics`
has 4 rows, **none for REG-TAG** (see Finding #6):
```
Goods = 1×1,200.00(01WEB) + 50×3.50(B-ECO-TAG) + 150×2.50(B-REG-TAG) + 150×4.00(B-SAT-LAN)
      = 1,200.00 + 175.00 + 375.00 + 600.00 = 2,350.00
COSTS(15) = 2,350.00
EXPECTED PROFIT(15) = 5,985.00 − 2,350.00 = 3,635.00 ₪
```

---

## PART 2 — Cancellation-fee example (project #14, quote #27) — hypothetical: cancelled 30h before the event

30 hours falls between `שעות_פיצוי_ביטול_מלא=24` and `שעות_פיצוי_ביטול_חלקי=72` (live params) → the **50%**
tier (`אחוז_פיצוי_ביטול_חלקי=50`), matching the task's instruction. **This ladder was reconstructed entirely
from param names in the live DB — see Finding #1 below; it is not written as prose anywhere in the file I was
scoped to read.**

### Inputs read (live)

`quotes` (quote_id=27): `estimated_hours=4.00` (17:00–21:00).
`assignments` (project_id=14, all 4 `finally_approved`): rates 43, 40, 39, 42 (hostess_id 17,18,19,22).
`logistics` (project_id=14), current `item_status`:
| sku | planned_qty | item_status | closing_unit_price | closing_unit_cost |
|---|---|---|---|---|
| B-ECO-TAG | 200 | ready | 7.50 | 3.50 |
| B-SAT-LAN | 200 | ordered | 8.40 | 4.00 |

Both rows qualify for the "ordered/ready" component (neither is `not_started`).

### Component 1 — team compensation (§7.16 ladder × planned hours × rate)

```
Σ rate = 43+40+39+42 = 164
Full (100%) team cost = estimated_hours(4.00) × 164 = 656.00
50% tier               = 0.50 × 656.00 = 328.00 ₪
```

### Component 2 — goods already ordered/ready, "at full price"

**Two readings — see Finding #3.** "מחיר-מלא" reads literally as `closing_unit_price` (what the
customer was going to pay); the card's own anchor phrase ("רגע התחייבות-הכסף", the moment the *company*
committed money) points to `closing_unit_cost` (what the company already paid the supplier). The two give
very different numbers:

```
PRICE-based: 200×7.50(B-ECO-TAG) + 200×8.40(B-SAT-LAN) = 1,500.00 + 1,680.00 = 3,180.00 ₪
COST-based : 200×3.50(B-ECO-TAG) + 200×4.00(B-SAT-LAN) =   700.00 +   800.00 = 1,500.00 ₪
```

### Component 3 — manually-entered "services already performed"

No live data source exists for this (P1 card, line 307: *"שורה-ידנית לשירותים-שבוצעו"* — explicitly manual,
no status tracking). Cannot be computed; shown as an open manual-entry line, not zero.

### Suggested fee totals

```
PRICE reading: 328.00 (team) + 3,180.00 (goods) + [manual] = 3,508.00 ₪ + manual line
COST  reading: 328.00 (team) + 1,500.00 (goods) + [manual] = 1,828.00 ₪ + manual line
```

---

## PART 3 — Salary-report expectation

**Live-DB check first:** across all 27 `assignments` rows, exactly **one** has `actual_hours > 0` —
`project_id=12, hostess_id=20`. No other project (7, 8, 11, 13, 14, 15) has any hostess with recorded
actual hours. So the computable example is project #12, not #13/14/15.

`assignments` (project_id=12, assignment_number=1, hostess_id=20):
`assignment_status='finally_approved'`, `hourly_rate_snapshot=45`, `actual_hours=6`, `personal_bonus=0`,
`travel_amount=0.00` (still the un-signed default — `salary_report_id IS NULL`, i.e. no report has ever been
generated; this is *not* evidence the travel param is 0, see caveat below).

`hostesses` (hostess_id=20): `full_name='אפרת דהן'`, `id_number='301554333'`, `bank_name='הפועלים'`.

Formula (P4 card, line 291 + ה14): `hours × hourly_rate_snapshot + personal_bonus + shifts × travel_param`
(travel signed at report-generation time, one shift = one assignment row for this event).

```
hours × rate     = 6 × 45 = 270.00
+ personal_bonus = + 0.00
+ shifts×travel  = 1 × [live param 0.00  → +0.00]   = 270.00 ₪  (live param)
                 = 1 × [ה20-recommended 22.60 → +22.60] = 292.60 ₪ (if the ה20 demo-seed migration is applied first)
```

**Monthly line for אפרת דהן (period = August 2026, live params today): 270.00 ₪.**
**Same line once the ה20 demo-seed change (`סכום_נסיעות_למשמרת: 0→22.60`) is applied: 292.60 ₪.**

---

## FINDINGS — ranked most severe first

### Finding 1 — SEVERITY: HIGH — The §7.16 cancellation ladder's exact thresholds/percentages are not written as prose anywhere in the file the review was scoped to read; they only exist as param names in the live DB

**What:** `processes-approved.md` mentions "סולם-§7.16" / "פיצוי-§7.16" **five times** (lines 184, 225, 258,
291, 298, 314) but never once spells out the tiers in prose. The only place the 0/50/100% structure is even
named is line 225: *"שלושה רכיבי-כיסוי: פיצוי-צוות (סולם-§7.16) ... 0/50/100 לפי עיתוי-הביטול והסיבה"* — the
word "0/50/100" appears, but not which hour-boundary maps to which tier.

**Evidence:** `grep -n "7\.16" docs/specs/module_08_finance/processes-approved.md` → lines 184, 225, 258, 291,
298, 314, none containing an hour number. Contrast with live `params` (SQL, 26/08/2026): `שעות_פיצוי_ביטול_מלא=24`,
`שעות_פיצוי_ביטול_חלקי=72`, `אחוז_פיצוי_ביטול_חלקי=50` — these DB rows are the *only* place the 24h/72h/50%
structure exists, and I had to reverse-engineer the ladder shape (≤24h→100%, 24–72h→50%, >72h→0%) from
three param **names**, not from any written rule. The full §7.16 ruling likely lives in
`docs/PROJECT_MASTER_sec7.md`, outside this review's scoped reading list.

**Why it matters:** Two people (or two AI sessions) could each build a self-consistent read of "the ladder" and
land on different tier boundaries or different treatment of the reference timestamp (cancellation-to-what?
`final_start_time`? `final_event_date` midnight?) — with no prose to arbitrate. This is exactly the situation
the calculator angle exists to catch: I could only produce the Part 2 numbers above by guessing from param
names, and a different reasonable guess (e.g. is 72h itself already in the 50% tier or the 0% tier —
inclusive/exclusive boundary is unstated) changes the ₪ figure with zero warning to whoever builds it.

**Suggested question:** Should the full §7.16 ladder text (inclusive/exclusive hour boundaries, and the
reference timestamp it counts from) be quoted verbatim into `processes-approved.md` or a linked P1 addendum,
the way §7.20 already is at line 225 — so a build session never has to reverse-engineer it from param names?

---

### Finding 2 — SEVERITY: HIGH — Every cost formula that touches labor is currently unrunnable on live data: `actual_hours` is 0 for all three demo projects named in scope (#13/14/15), because none has been operationally closed yet

**What:** The approved P3/ה7 profit formula is explicitly actual-hours-based
(`hostessActualCost(actual_hours, hourly_rate_snapshot)`, confirmed at `src/lib/projectClosing.js:84`).
Projects #13, #14, #15 all show `project_status` of `ready`/`in_progress` and `operationally_closed_at=NULL`
— i.e. module 6 has not yet closed them, so `actual_hours=0` on every one of their 9 assignment rows (SQL,
26/08/2026). The spec-literal "expected profit" for any of them is therefore a goods-only number that
**silently excludes 100% of labor cost** (₪692.00 for project #13 alone) — not because labor is free, but
because the input the formula reads doesn't exist yet.

**Evidence:** `SELECT actual_hours FROM assignments WHERE project_id IN (13,14,15)` → all rows `0`.
`SELECT operationally_closed_at FROM projects WHERE project_id IN (13,14,15)` → all `NULL`. Ledger item א29
(line 117) is still `⬜` open: *"עם התשלום: חישוב והצגת רווח גולמי ... (רגע-החישוב מול רגע-ההקפאה — כרטיס-תהליך)"*
— and the P3 card itself (line 321) only describes the balance-sheet display *inside the closing window,
after payment+feedback are resolved*, not for an in-progress project.

**Why it matters:** If a build session (or a later screen for module 7's "רווח גולמי משוער לחודש" KPI, א57,
also still ⬜) reuses this exact formula to show a running/pre-event profit estimate on an active project, it
will show an inflated number (e.g. 3,650.00 ₪ instead of a more realistic ~2,958.00 ₪ for project #13) with no
visual cue that labor cost is a placeholder zero, not a real zero. There is no spec text anywhere that defines
what number (if any) a still-running project should show for "expected profit" before operational closure.

**Suggested question:** Is "expected/running profit" for an in-progress project in scope for module 8 at all
(P3's own text suggests the profit number only ever appears once, at closing) — or does every screen that
shows a profit figure before that point (e.g. the dashboard KPI in module 7) need its own explicitly-defined
formula, distinct from the closing-time `hostessActualCost` one?

---

### Finding 3 — SEVERITY: MEDIUM — "goods at full price" (מחיר-מלא) in the cancellation-fee component is ambiguous between `closing_unit_price` and `closing_unit_cost` — a ~2.1× difference in the worked example

**What:** P1 card, line 307: *"שורות ordered/ready במחיר-מלא (עוגן: 'רגע התחייבות-הכסף' של אפיון-מ5)"*. The
word used is "מחיר" (price), which in this codebase's own vocabulary is a specific, distinct column
(`closing_unit_price`, what the *customer* pays) from "עלות" (cost, `closing_unit_cost`, what the *company*
pays the supplier) — the two are never used interchangeably anywhere else in this file (e.g. ה17 at line 260
is careful to say "closing_unit_cost" for the profit formula's goods line). But the anchor phrase attached to
this specific clause — "the moment money was committed" — describes the company's own outlay, i.e. cost, not
what it charges the customer.

**Evidence:** Worked in Part 2 above on project #14's two `ordered`/`ready` logistics rows: PRICE-based
component = 3,180.00 ₪; COST-based component = 1,500.00 ₪ — a 1,680.00 ₪ swing on this component alone,
more than half of either total.

**Why it matters:** This single word choice moves the total suggested cancellation fee by roughly 46-48%
in this example (3,508.00 ₪ vs 1,828.00 ₪). A company recovering only its own cost is a very different
policy from a company recovering the full margin it would have earned — and a customer disputing the fee
would ask exactly this question.

**Suggested question:** When a project is cancelled and goods are already `ordered`/`ready`, should the
customer be charged what they contracted to pay (`closing_unit_price`) or only what the company already spent
(`closing_unit_cost`)?

---

### Finding 4 — SEVERITY: MEDIUM — The travel-per-shift param the salary/profit formulas depend on is live at ₪0, while the approved decision (ה20) to seed it at ₪22.60 has not been applied to the database

**What:** ה20 (line 263) explicitly decides: *"ערך-הדמו של הנסיעות: לזרוע `סכום_נסיעות_למשמרת = 22.60`
(במקום 0 של היום)"*. Live query today: `סכום_נסיעות_למשמרת = '0'`. The migration implementing this decision
has evidently not been applied yet.

**Evidence:** `SELECT param_value FROM params WHERE param_name='סכום_נסיעות_למשמרת'` → `'0'` (26/08/2026,
`pricing_timing` type). Compare ה20's own text, which frames 0 as "today's" (stale) value.

**Why it matters:** Every travel-dependent number in this review has two versions that differ by exactly
`22.60 × shift_count` (e.g. the salary line for אפרת דהן: 270.00 ₪ today vs 292.60 ₪ once seeded). Anyone
hand-verifying a build against "the numbers in the spec" needs to know which param state they're comparing
against, or a correct implementation will look "wrong" by exactly this delta.

**Suggested question:** Is applying the ה20 seed migration (`0→22.60`) queued before module 8's build starts,
or does the build need to tolerate/display the current `0` until that migration lands?

---

### Finding 5 — SEVERITY: LOW — "Team compensation" as a cancellation-fee component (P1) has no formula of its own; it was inferred by transplanting the salary-report formula (P4/ה15) into a different card

**What:** P1's cancellation route (line 307) names "פיצוי-צוות (סולם-§7.16)" as one of three fee components,
but never states its formula. ה15 (line 258), written for the *salary report*, does define a formula for a
*cancelled* project's payroll line: `%(0/50/100) × שעות-מתוכננות × תעריף-קפוא`. I applied that same formula to
P1's "team compensation" component by analogy — there is no text confirming the customer-facing cancellation
fee's team-compensation figure is meant to equal, exactly, what the company will later pay the hostesses in
payroll (a pure pass-through with no markup).

**Evidence:** Worked in Part 2: team comp = 328.00 ₪ (50% × 4.00h × Σrate 164). This number is only as solid
as the assumption that P1 and ה15 mean the same computation for the same phrase.

**Why it matters:** If the two are *not* meant to be identical (e.g. the fee charged to the customer should
include an administrative markup, or should be capped differently from the payroll obligation), a build that
wires P1's fee display straight to the ה15/`hostessActualCost`-style formula will be quietly wrong in a way
that only shows up when someone compares an actual invoiced cancellation fee to the actual payroll line for
the same event.

**Suggested question:** Is the "team compensation" component of the cancellation fee (P1) defined to be
numerically identical to the ה15 payroll-compensation formula, or are they two separate numbers that happen to
share the same ladder?

---

### Finding 6 — SEVERITY: LOW — Project #15's `project_changes` row reduces a SKU (`REG-TAG`) that has no matching `logistics` row at all

**What:** `project_changes` (change_id=3) reduces `REG-TAG` by 25 units (from the original quote line of
exactly 25 — i.e. a full cancellation of that add-on) with `change_target='logistics'`. But `logistics` for
project 15 has zero rows with `sku='REG-TAG'` — only `B-REG-TAG` (a different SKU) and three others exist.

**Evidence:** SQL, 26/08/2026: `SELECT * FROM logistics WHERE project_id=15` → 4 rows (`01WEB`, `B-ECO-TAG`,
`B-REG-TAG`, `B-SAT-LAN`), none `sku='REG-TAG'`. `SELECT * FROM project_changes WHERE project_id=15` → 1 row,
`sku='REG-TAG'`. The B13 ledger note (line 186) already flags a related but distinct gap: *"שורות-לוגיסטיקה
משינוי-תכולה בלי מצביע-מקור — רווחיות לא-מדויקת עבורן, מוצהר"*.

**Why it matters:** In this specific instance the net effect on the profit number is arguably correct by
coincidence (the reduction is a full cancellation to zero, so there is genuinely nothing left to cost), but it
means the ה17 goods-cost formula ("Σ planned_qty × closing_unit_cost **from `logistics` rows**") cannot, by
construction, ever pick up a cost contribution for a SKU whose `logistics` row was removed or never created —
there is no way from the data alone to tell "correctly fully cancelled, nothing to cost" apart from "logistics
row is simply missing, cost silently dropped." A larger reduction (e.g. −5 of 25, not −25 of 25) on a SKU with
no logistics row would silently omit real remaining cost from the profit formula with zero error surfaced.

**Suggested question:** Should a `project_changes` row with `change_target='logistics'` be required to carry
a back-pointer to the `logistics` row it affects (the way `logistics.project_change_id` already exists in the
schema for the reverse direction — increases), so the goods-cost formula can distinguish "fully and correctly
zeroed out" from "the logistics row is simply missing"?

---

## Checks run that produced no finding

- Confirmed no cancelled project exists live (`project_status='cancelled'` or `cancel_type IS NOT NULL`) →
  0 rows — Part 2's cancellation scenario is necessarily hypothetical, as the task instructed.
- Confirmed only one `assignments` row anywhere in the live DB has `actual_hours > 0` (project 12/hostess 20)
  — checked across all 7 projects with assignment rows (7, 8, 11, 12, 13, 14, 15), not just the m5-seed range.
- Confirmed `computeQuoteTotals` (`src/lib/pricing.js:110-136`) matches ה2's revenue formula exactly:
  discount is additive (not compounding) on `applied_customer_discount + manual_discount`, and `preVat` is
  computed before VAT — no hidden rounding surprises beyond the documented agora-rounding.
  All three quotes used (26, 27, 28) have `applied_customer_discount=0.00` and `manual_discount=0.00`, so the
  discount branch of the formula was not exercised by this data — worth re-testing against a quote that
  actually carries a discount before relying on this review's revenue numbers as a discount-path regression
  anchor.
- Confirmed `hostessActualCost` (`src/lib/projectClosing.js:84`) is a pure `actualHours × hourlyRateSnapshot`
  function with agora-rounding and a `null`/negative guard returning 0 — matches ה7's stated formula verbatim,
  no hidden bonus or travel folded in (those are separate lines per the P3 card).
