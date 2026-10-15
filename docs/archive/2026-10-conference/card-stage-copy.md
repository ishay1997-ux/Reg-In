# Card: builder for the report copy Ishay approved at 16:5x ("מאשר הכל לפי המלצתך")

Your role is **builder**. You make exact, approved text replacements; you make no wording decisions of your own.

- **Worktree:** `C:\Users\ishay\Reg-In-payroll-f`.
- **Branch:** `ishay/stage-copy`, which already exists and is checked out at ccf5e917, on top of origin/main @83d34eaa.
- Commit by explicit pathspec (`git commit -- <paths>`). No push, merge, deploy or migration apply. The live DB is SELECT only.

## The 8 approved changes, verbatim (today → new)
| # | Where (measured by the deputy) | Today | New |
|---|---|---|---|
| 1 | DB `report_m02_exec_overview` (3 occurrences) + every visible string in `src` (9 files contain it) | `שולי-רווח` (also `שולי-רווח גולמי`) | `שולי רווח` (`שולי רווח גולמי`) |
| 2 | DB `report_m02_exec_overview` | `החודש האחרון חלקי — N ימים בלבד, ולכן העמודה שלו נמוכה.` | `החודש האחרון עוד לא הסתיים (N ימים), ולכן העמודה שלו נמוכה.` Keep the N expression exactly as it is today. |
| 3 | client: the new year `<select>` label added today by commit e76361d7 (`src/lib/reportsPeriod.js` / FiltersBar) | `שנה` | `שנה מלאה` |
| 4 | DB `report_m03_trends` (tile label) + client copies | `סך הצעות שפג תוקפן` | `הצעות שפג תוקפן` |
| 5 | DB `report_m03_trends` | `סגירה, לקוח חדש` and its sub-line `אין מספיק נתונים (12)` | `שיעור סגירה – לקוחות חדשים` (en dash) and `אין מספיק נתונים (12 הצעות)`. Keep the number expression; use `הצעה` when it is 1. |
| 6 | DB `report_m03_trends` (chart 2 title) | `שיעור סגירה לפי מאפיין` | `שיעור סגירה לפי סוג לקוח ומועד ההצעה` |
| 7 | DB `report_m03_trends`, the decision line | `…— 10 פגו בלי מענה, 53,024 ₪.` | `…— 10 הצעות פגו בלי מענה, בשווי 53,024 ₪.` Change only these words; the numbers stay as computed. Use `הצעה אחת פגה` when it is 1, if the function already has a singular branch. |
| 8 | DB `report_m03_trends` | `13 הצעות פתוחות שתאריך האירוע שלהן עבר — לא נספרו.` | `13 הצעות פתוחות שתאריך האירוע שלהן עבר — לא נכללו בחישוב.` |

**Nothing else changes.** In particular, keep the "לשים לב" opening, the ▲▼ arrows, "שהוכרעו" and "על מה מפסידים הצעות"; Ishay kept those.

## How
- **DB:** write ONE migration file, `supabase/migrations/20261014170000_module11_stage_copy.sql`. **Copy the technique of `supabase/migrations/20261014151000_module11_m03_chart_counts.sql` exactly:**
  - `pg_get_functiondef` + `pg_temp.m11_replace_once`, so each source string must occur exactly once or the migration raises;
  - CREATE OR REPLACE with the same signature;
  - a `proacl` assert at the end.
- **Measure the live body first** (SELECT `pg_get_functiondef`) to get each exact source substring, including the SQL around it (`v_lri`/`v_pdi`, `||`). Your anchors must be the live SQL text, not the rendered text. For item 1, three occurrences means three distinct anchors, or a replace of a longer unique string each time.
- **Client:** change the visible strings, and every test, hint (`src/lib/onboardingCopy*.js`) and e2e anchor that quotes them, so the gate stays green. Search `src` and `e2e` for each "today" string.
- Run `npm run gate > C:\Users\ishay\payroll-work\gate-copy.log 2>&1; echo exit=$?`. It must end with exit 0. Never pipe it into head/tail.

## Report (your final message)
- the SHAs;
- the migration path;
- for each of the 8: the anchors used and where the client strings changed;
- the gate exit code;
- anything you could not do, and why.

**Deadline:** be done by **18:40**. The deputy must apply, merge and deploy before the 19:45 freeze.
