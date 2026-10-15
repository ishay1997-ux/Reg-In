# Agent K, phase 1: report surfaces מ2 and מ3, plus customer reports (14.10 ~13:50)

Saved by the deputy from the agent's hand-back. The agent could not write report files.

- **Code:** origin/main @ bffdfae3.
- **Report functions:** read live, SELECT only. No screenshots were taken.
- **Script, NOT applied:** `demo-data/uat-customers-rename-20261015.sql`.

## Fits today (~30–35 min, no break of existing calls)
| # | Item | Size |
|---|---|---|
| T1 | Rename the 2 UAT test customers. Script ready; needs Ishay's go. | ~2 min to apply |
| T2 | מ20 sub-heading wording (`reportsCatalog.js:207`), plus 1 test | 5 min |
| T3 | Text-only DB change (same technique as L1, `20260923180000`). Same parameters, nothing dropped. Three strings: the מ20 chart title "מה משמח…", the מ19 next-step line "…מה מכעיס…", the מ2 tile "הכנסות מתחילת השנה". Migration file, then check ① by the deputy. | 20–25 min |

## A. Customer-type filter on מ2 and מ3: about 2 h, not today
- **Today:** both functions take a single `p_customer_id`. מ3 reads `customer_type` but never filters on it.
- **Option (i), filtering in the browser: rejected.** The tiles are server-side rates, and מ3 rows carry no customer_id.
- **Option (ii), `p_customer_type text default null`: the only correct one.**
- 🔴 **Trap:** `CREATE OR REPLACE` with an extra parameter creates an overload, and PostgREST becomes ambiguous, so prod calls break. It must be DROP + CREATE in one transaction, then re-grant (check ①). The client sends the param only where it is accepted, gated like `p_page_size` (`api.js:152`).
- **Strings:**
  - label `סוג לקוח`;
  - options `כל הסוגים` · `חברה פרטית` · `חברה ממשלתית` · `חברת הפקה` · `עמותה`;
  - window line `… · סוג לקוח: חברה ממשלתית`.
- **Volumes, 2026:**
  - מ3 decided: private 248, production 69, government 29, non-profit 13.
  - מ2 finished: 192 / 45 / 21 / 6.
- **Edge case:** with עמותה, the מ3 rates show "אין מספיק נתונים (13)".

## B. Year selector: about 40 min plus T3, not today
- **Chips today** (`reportsPeriod.js:57`): החודש · 3 חודשים · 12 חודשים · השנה · הכול.
- 🔴 **On מ2 and מ3, "הכול" silently equals "השנה":** `coalesce(p_from, date_trunc('year', v_to))`. **Stage advice: do not click "הכול" on these two tomorrow.**
- **Adding a year is browser-only:** a key like `y2025` maps to 01/01–31/12.
  - "אשתקד" then becomes the full previous year.
  - For 2024 there are no 2023 events. מ2 handles this ("אין טווח מקביל"); מ3 still has 34 quotes to compare.
- 🔴 **One string becomes false:** `הכנסות מתחילת השנה`. It is already false today on החודש, 3 חודשים and 12 חודשים. Proposed: `הכנסות` (T3).
- **Proposed UI:** keep the 5 chips and add a `שנה` select (`—` · `2025` · `2024`).

## C. Counts on the 2 מ3 charts: about 55 min
- **The counts are already returned** (`lost_n`, `n`) but not shown, and the chart component has no bar labels at all.
- **Recommendation:** the DB function adds a `bar_label` text (new fields only, same params). The chart gets a generic bar-end label, repeated in the tooltip.
- **Chart 1 labels:**
  - מחיר `41 הצעות · 40% מהסכום`
  - נבחר מתחרה `16 · 17%`
  - חוסר זמינות/לו"ז `13 · 16%`
  - תקציב לקוח `12 · 12%`
  - פג תוקף `10 · 7%`
  - האירוע בוטל אצל הלקוח `9 · 7%`
  - אחר `1 הצעה · 1%`
  - Tooltip: `הצעות מחיר שנדחו: 287,781 ₪`
- **Chart 2 labels:**
  - `72.3% · 347 הצעות`
  - new customers: `אין מספיק נתונים · 12 הצעות` (today that bar is an unexplained empty space)
  - other segments: 43 / 212 / 104
- ⚠️ The RTL position of the labels needs one look in the browser.

## E. Rework chart 1 of מ3: about 1 h minimum
- **No pie:** 7 close values is an anti-pattern under the dataviz rules.
- **Proposed:** horizontal bars sorted by ₪, one teal colour, with the C labels.
- **Title:** today `הצעות מחיר שנדחו לפי סיבה` → `על מה מפסידים הצעות · ‏102 הצעות שנדחו`.
- **Cross-filter:** clicking a bar still filters the table.
- **Optional:** collapse the 102-row table behind `פירוט לפי הצעה (102)` (+40 min).
- **Sizes:** minimum ≈ 1 h; with the collapse ≈ 1 h 45.

## D. UAT customers in the dropdown
- **What they are:** 492 `UAT-2026-10-08` and 493 `UAT-2026-10-08-b`.
  - Already archived (inactive).
  - 0 projects, quotes, contacts or preferences.
  - Created 08.10 by the blind UAT script, task 2.
- **Why they still show:** the report filter lists every customer, archived ones included (`ReportsPage.jsx:262` → `listCustomers()`). Latin names sort above Hebrew, so they sit right under "כל הלקוחות".
- **The script** renames them to `אופק מערכות מידע בע"מ` and `נתיב לוגיסטיקה בע"מ` and keeps them archived. No delete, and a snapshot.
- **Rejected:** hiding archived customers, because that also hides 407 ביו-לוג, which has real history.

## 1. Wording: "מה משמח" / "מה מכעיס"
| Where | Today | Proposed (alternative) |
|---|---|---|
| מ20 sub-heading, `reportsCatalog.js:207` | `מה משמח ומה מכעיס לקוחות?` | `מה הלקוחות משבחים, ועל מה הם מתלוננים?` (`נקודות חוזק ונקודות לשיפור`) |
| מ20 chart title (DB) | `מה משמח · N משובים סימנו סיבה חיובית` | `מה הלקוחות משבחים · N משובים` (`נקודות חוזק · N משובים`) |
| מ19 next-step line (hidden today) | `…ולראות מה מכעיס — אין כרגע…` | `…ולראות על מה הלקוחות מתלוננים — אין כרגע…` |
| New negative chart (if item 2 is approved) | — | `על מה הלקוחות מתלוננים · N משובים` (`נקודות לשיפור · N משובים`) |

- The tests at `CustomersTab.test.jsx:259,639` move in the same commit.
- **Side finding:** 15 feminine forms (e.g. `התחילי`) remain in the module 11 hints (`onboardingCopy.m11.*.js`). PR #177 did not reach them.

## 2. "What to improve" on מ20 in 10 seconds?
- **Top complaint: yes** (the next-step line names "תפקוד דיילות", 17).
- **Frequency of each: no.** You have to count 41 table rows by eye.
- **Trend: no.**
- **The hidden story, 2026 vs 2025:**
  - תפקוד דיילות 17 vs 11
  - **ניהול לקוי 11 vs 5 (more than doubled)**
  - אחר 10 vs 15
  - איכות תגים 3 vs 5
  - איחור 0 vs 1
- **Why Ishay's 23.09 deletion no longer holds:** he removed the chart when the table had 19 rows and "אחר" was 10 of 19. Now "אחר" is 10 of 41.
- **Proposed, which reverses his ruling, so it is his:**
  - Restore horizontal bars titled `על מה הלקוחות מתלוננים · 41 משובים`, placed before the positive one.
  - Clicking a bar filters the table.
  - Optional grey `אשתקד` series.
  - 40 min, or about 60 min with the trend.

## 3. Customer type across the customer surfaces
- **Already have it:**
  - module 2 list: column and filter;
  - מ19: column and chart.
- **Missing:**
  - מ20, מ22: ≈ 20 min each (server);
  - מ21: ≈ 20 min, or browser-only.
- **Filter by type on any report:** the same drop + create as A, +≈ 20 min per function after the first two; the 4 customer reports ≈ 1.5 h more.
- **Recommendation:** a filter, not a column, built once in the filter bar and switched on per report: מ2, מ3, then מ19–מ22.

## Not checked
- Whether the 2 new customer names read naturally (Ishay's call).
- The hint keys for a restored chart (טעון בדיקה).
