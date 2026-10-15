<div dir="rtl">

# Step 6: coherence tests, 14.10.2026

- **Source:** `origin/main:docs/specs/module_11_reports/seed-coherence-tests.md`. The file defines **16 tests** (מ1 to מ16), not 8. All the SQL ones were run, read-only, against the live DB `yfeovxppnfoafmfbdfvh`.
- **Read-only:** SELECT only. מ13 calls `finance_project_money` inside `begin read only … rollback`.
- **Not run:** מ7 is manual by definition. Only its numeric claims were re-derived here. The גיני check (0.34 vs 0.605) was not re-run.

## Results table

| Test | Result | Numbers (live, 14.10) | Threshold | If failed: likely cause and where |
|---|:-:|---|---|---|
| **מ1** rating predicts attendance | PASS | no-show 15.1% / 5.0% / 1.3% for ratings 3/4/5; late 19.5 / 11.1 / 2.7; 298 / 1,251 / 1,276 shifts | monotonic decrease, ratio 3÷5 >= 3 | The ratio is 11.6 (10/09 baseline was 11.0). |
| **מ2** rate rises with rating | PASS | 41.7 (n=6) / 44.0 (n=13) / 46.9 (n=14); end-to-end gap 12.5% | gap >= 8% | The 10/09 gap was 18.0%, and the active-hostess count has changed since. |
| **מ3** response time distinguishes hostesses | PASS | 25.2 / 10.0 / 4.0 hours; gap 84.1%; never answered 59 / 95 / 97 | gap >= 40% | None. |
| **מ4** minimum population per page | PASS (with a note) | "other" 33, negative feedback 119, cancelled 41, drifting customers **10** | >= 30 each | The "drifting customers" row (10) is below 30. It was already 9 on 09/09 and is not counted in the status table. This matters only if a surface leans on that group. Negative feedback is 119 (it was 70 on 10/09). |
| **מ5** feedback predicts churn | FAIL (as written) | **-2 / -2 / 148** days for satisfied (n=12) / medium (n=27) / unsatisfied (n=16). The same query restricted to past events gives **74 / 41 / 171** | strictly monotonic increase as satisfaction falls | **Cause 1:** the query takes `max(final_event_date)` with no `<= current_date` filter. 42 projects have future dates (max 2027-01-24, `projects.final_event_date`). So "days since last" is negative for 15 + 6 customers. **Cause 2, real even with future dates removed:** satisfied customers (74) lag medium ones (41), so the U-shape from 09/09 is back. Likely source: the focused feedback seed of 24/09 (D-46, `projects.feedback_score`, 106 rows, snapshot `seed_snapshot.projects_feedback_20260924`, `docs/micro_guides/module-11.md` line 66). That seed did not re-run מ5. If any surface says "satisfaction predicts return", it is not backed. |
| **מ6** profitability fits the profile | PASS | 706 projects, 689 profitable (97.6%), 12 at a loss, 7 written off; worst -4,146, median 4,101, best 12,206, total 3,025,499 | most profitable, with a real loss tail | The 10/09 baseline was 713 / 12 / 2.74M. The profit total rose by about 281K. The 29 projects that are not finished all have `final_profit`, as in the 10/09 baseline. |
| **מ7** statement vs DB (manual) | PARTIAL | 2024: 221 · 2025: 302 · **2026: 314** · 2027: 4. Jan to Sep 2026: 263 vs 207 in 2025 = **+27%** | claims must match | **"221→304" is now stale. The DB says 221→314**, because 10 projects were added after 10/09. Any slide or text that says 304 is wrong as of today. "+27% growth" still holds. |
| **מ8** payroll does not pay a no-show | **FAIL (money impact 0)** | 10 lines, all in `salary_reports` id **16** (July 2026, 75 lines). All have hours 0, bonus null, travel null, `line_total` 0.00. Lines: 189, 196, 197, 206, 210, 214, 217, 228, 244, 245 (hostesses 383 ×4, 449 ×2, 468, 493, 384, 406). The strict join on `assignment_number` also gives 10. Report 16 totals 22,578.00, equal to the sum of its lines. | = 0 | **Cause:** the new collection authority `payroll_collect` (migration `20261014000500_module8_payroll_collection_authority.sql`, line 61 onward) selects `assignment_status='finally_approved'` with **no `attendance_status` filter**. A no-show therefore enters as a zero-value line (flagged `ZERO_VALUE`) instead of being excluded. The old rule was "arrived + late only". Nobody was paid a shekel, but 10 of the 75 lines are zero rows. They will show on the hostess summary and on the report screen, and the tests expected 0. **Decision for Ishay, not code:** either exclude no-shows in `payroll_collect`, or relax מ8 to "no-show lines have total 0". Not touched, because this job is read-only. Report 16 was already issued. |
| **מ9** shift lead gets a bonus | PASS | 683 paid out of 713 arrived leads (95.8%). Out of 748 including no-shows it is 91.3%. no-show bug = **0** | >= 90%, bug = 0 | The 748 − 713 = 35 absent leads are correctly unpaid. |
| **מ11** price list is not absurd (anchors 1-3) | PASS | lowest rate 39.9 > minimum wage 35.4; employer multiplier **1.59** (range 1.25-1.60, borderline); blended margin **48.3%** (range 40-50, close to the upper edge) | within range | None. Both borderline values are near the edge, so a small change in rates would flip them. |
| **מ11 anchor 4** product units per guest | PASS | 2.16, suspicious = 0 | 1.8-2.5, 0 | None. |
| **מ11 anchor 5** guests per hostess | PASS | 43.2 vs 50 (-13.6%) | +/-20% | None. |
| **מ11 anchor 6** product prices | PASS with a flag | Tag plain 2.07-3.00, branded 4.23-6.00, eco 3.57-8.00 (range 2-10 OK). Lanyard fabric branded 4.89-7.00, satin plain 4.23-6.00, satin branded 6.58-9.00 OK. **Lanyard fabric plain 2.63-3.88** (range 3-12: min is 0.37 below). Registration site 2,350-2,500 (range 1,500-5,000 OK) | tag 2-10 · lanyard 3-12 · site 1,500-5,000 | The one outlier is "שרוך בד (חלק)" at 2.63. It is `quote_services.closing_unit_price`, most likely a closing discount on the cheapest SKU. It does not break the logic of the anchor, but a sharp eye could catch it. |
| **מ12** no orphan log rows | PASS | 0 | 0 | None. |
| **מ13** frozen profit equals live calculation | PASS | 677 finished projects checked, **0 drifted** | 0 | Today's changes (the 15 September closures, 1638/1648 count, 1651 times) did not break `final_profit` for finished projects. Note that the test only covers `finished`. |
| **מ14** scope change carries a price and direction | PASS | zero-price 0 / 0; hostess_count +14 vs -3; logistics +9 vs -4 | 0 and increases > decreases | None. |
| **מ15** rate bands overlap | PASS (at the minimum) | expensive_low_rated **2**, cheap_top_rated **2** | >= 2 each | Exactly at the threshold. One status change of a single hostess (inactive, or a rating shift) would flip it. |
| **מ16** repeated note is not evidence | **FAIL** | **106 rows, 91 distinct notes** (15 duplicates). Example: "בסדר ברמת השירות, פחות ברמת ההכנה…" appears in projects 1374, 1128, 939. "האירוע עבר, אבל בלי ה'וואו'…" appears in 981, 1244, 1433. Four phrases occur 3 times each; most others twice. | rows = distinct | The negative-feedback population grew from 63 (10/09) to 106 after the 24/09 feedback seed (D-46). The new rows reused 15 note texts (`projects.feedback_notes`). This is a seed problem and not a code bug. It matters for the surfaces that show quoted notes (reports 17 and 20), and for the "other" bucket that story ④ leans on. |

## Summary for tomorrow's surfaces

- **מ2 "מבט-על הנהלה":** the inputs it depends on are healthy: מ6 (profit), מ13 (0 drift), מ11 (price list), מ14, and מ1-מ3. Two risks: the "221→304" figure is now **221→314**, and the **blended margin of 48.3%** is close to the upper edge of the plausible range (50%). I could not run `report_m02_exec_overview` itself: it is gated by `assert_module_permission('כספים')` and the MCP session has no module permission. So the surface's own numbers were **not** verified here.
- **מ3 "סגירת הצעות" (ה1, `report_m03_trends`):** the same gate blocked a direct call. Its coherence neighbours are מ16 (notes repeated: the quotes shown on the screen) and מ5 (the satisfaction-to-return story). Both are red. Do not say "satisfaction predicts return" on stage.
- **Payroll (מ8):** the July report 16 contains 10 zero-value no-show lines. Money is correct (22,578.00 matches the lines), but the line count (75) includes them.

## Fix summary (not applied, read-only job)

1. מ8: choose between excluding `attendance_status='no_show'` in `payroll_collect` and relaxing the test.
2. מ16: rewrite 15 duplicate notes (seed fix).
3. מ5: restrict the test to `final_event_date <= current_date`, and decide whether the satisfaction/return story stays in the deck. The real non-monotonicity (74 vs 41) needs a seed fix.
4. מ7: replace "304" with "314" in any text, or say "over 300".

</div>
