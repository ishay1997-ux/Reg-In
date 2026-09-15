# Module 11 (Reports) — Source-per-number sweep

Mechanical measurement only. No ruling, no recommendation. Every column claim below was grepped
against the WHOLE `docs/schema.sql` (not just the `create table` block) and cross-checked against
`supabase/migrations/*.sql`. Anchors are file + matched string/line, per the task's top mine.

Inputs read in full: `docs/specs/module_11_reports/research/review-2026-09-06.md` (320 lines) and
`docs/specs/module_11_reports/research/reports-architecture-draft-v3.1.md` (974 lines). The 19-report
scope (all except report 12) is per review §ז1/§ח (Ishay's 06/09/2026 ruling).

---

## 0. Method note on the review document as a source

The review document (`review-2026-09-06.md`) was itself produced 06/09/2026 by 9 review agents that
already ran live-DB checks and grepped schema/migrations, then had its findings manually re-verified.
Where this sweep's own grep independently reproduced a claim from that review, both are cited (review
section + my own anchor). Where this sweep found something the review does not mention, it is marked
**NEW**. I did not take any review claim on faith for a column-existence or RPC-signature question —
every such claim in the tables below was re-grepped in this session.

---

## 1. Table "source per number" — report → measure → feeding column(s) → writer → reader RPC → note

Legend for **Writer**: `RPC` = written only through a security-definer function (client `.update()`
on the base table is blocked by RLS or absent); `UI-direct` = client calls `.from(table).update()`
directly (RLS-gated, not RPC-gated); `seed-only` = only `scripts/*.mjs` populates it today; `NONE` =
no code path writes it at all today.

### Report 1 — מגמות צמיחה, רווחיות ושולי-תרומה רב-שנתיים

| Measure | Feeding column(s) | Writer today (anchor) | Reader RPC today | Note |
|---|---|---|---|---|
| הכנסה (per project) | derived: `quotes.applied_customer_discount/manual_discount` + `quote_services.qty/closing_unit_price` + `project_changes.delta_qty/unit_price_snapshot`, combined inside `finance_project_money()` `revenue` output column | `quotes`/`quote_services` written only via RPCs `create_quote`/`replace_quote_lines` (`src/modules/03_quotes/api.js:163,175`, comment line 7: "לעולם לא .insert()/.update() ישיר"); `project_changes` written only via `apply_scope_change` (`supabase/migrations/20260814142440_module6_rpcs_writes.sql:516`, latest body `20260826002448_module5_scope_change_reset_removal.sql:23`) | `get_finance_overview()` (no-schema-prefix def, `supabase/migrations/20260827144459_module8_finance_money_ssot_and_readers.sql:164`) returns `revenue` per project, all projects, no year filter; `get_project_finance_detail(p_project_id)` (latest `20260904233000_feedback_multi_select_reasons.sql:227`) per-project | Both readers are per-project lists, not a year-grouped aggregate. §ב5 of the review: a new gated summary RPC is the architecture gap here — confirmed by grep: no `create or replace function` in migrations returns revenue grouped by year/segment. |
| רווח גולמי ישיר | `project_finance.final_profit` (frozen) else `finance_project_money().gross_profit` (live) | `final_profit` written by `archive_project()` (latest `supabase/migrations/20260902211551_module9_c_threshold_functions_and_min_wage_rpc.sql:99`, insert…on conflict at line ~158); `gross_profit` computed live inside `finance_project_money` (`20260906083345_module8_planned_hours_cross_midnight.sql:27`, the ח9 midnight-bug-fix version) | `get_finance_overview()`, `get_project_finance_detail()`, `get_dashboard_summary(p_month)` (monthly only, `20260903184711_module7_dashboard_cancelled_on_calendar_and_profit.sql:41`) | `get_dashboard_summary` is single-month; no RPC sums profit across a multi-year range today. Coalesce pattern confirmed: `coalesce(pf.final_profit, m.gross_profit)` at line 104 of the 903184711/903184711 fix file. |
| שולי-רווח % | derived from the two rows above in JS (`derivePercent`, `src/lib/projectFinance.js:249`) | n/a (pure display derivation) | n/a | — |
| גידול YoY | `projects.final_event_date` (year bucket) × revenue above | n/a (date column, written at project creation by `approve_quote_and_create_project`, latest `supabase/migrations/20260826002446_module5_approve_rpc_origin_backfill.sql:18`) | none | No existing RPC groups by year at all — confirmed: `get_dashboard_summary` takes one `p_month`, not a range. |

### Report 2 — מבנה הנחות ויעילות תמחור

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| עומק-הנחה % | `quotes.applied_customer_discount` (numeric, 0–100) + `quotes.manual_discount` (also 0–100, **not shekels** — confirmed: `docs/schema.sql:665-666`, both `numeric(12,2) not null`, constraint `quotes_combined_discount_max check (applied_customer_discount + manual_discount <= 100)`) | RPC `create_quote`/`replace_quote_lines` (`03_quotes/api.js:163,175`) | none dedicated; `list_projects_overview()` (`20260814142439_module6_rpcs_reads_and_close.sql:138`) exposes `planned_revenue` per project, not discount depth | v3.1 §3 report-2 edge case says "normalize shekel discount vs. percent discount to one effective %" — confirmed wrong: both are already percent-typed columns (review §a3 also flags this). |
| יחס-המרה (approved/rejected) | `quotes.quote_status`, `quotes.rejection_reason` (CHECK-constrained list, `docs/schema.sql:694`) | `quote_status`→`approved` via `approve_quote_and_create_project`; `rejected`/`rejection_reason` via direct `.update()` in `03_quotes/api.js:201` (the one confirmed UI-direct write on this table) | none | — |

### Report 3 — צווארי-בקבוק (מוזג לתוך 7 לפי ח8/§ג)

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| אירוע→סגירה תפעולית | `projects.final_event_date`, `projects.operationally_closed_at` | `operationally_closed_at` via `close_project_operationally` RPC (`src/modules/06_projects/api.js:236-249`, RPC body latest `supabase/migrations/20260820233607_module6_closing_rpc_hours_bound.sql:21`) | `get_project_finance_detail` exposes it as part of its row (via `p.*` join — confirmed field list at 20260904233000:227-262 does not itself list `operationally_closed_at`, but `get_finance_overview` does at line 186 of `20260827144459…`) | — |
| סגירה→חשבונית | `projects.invoice_sent_at` | RPC `record_invoice_sent(p_project_id, p_file_url)` (`supabase/migrations/20260827150049_module8_finance_write_actions.sql:225`) | `get_finance_overview`, `get_project_finance_detail` | — |
| חשבונית→תשלום | `projects.payment_date` | RPC `record_payment(p_project_id, p_payment_date)` (same file, line 265) | same two readers | — |

### Report 4 — פארטו/ריכוזיות לקוחות (מוזג לדוח-לקוחות)

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| הכנסה/רווח מצטבר ללקוח | `projects.customer_id` → group revenue/profit per report-1's columns | as report 1 | none aggregate-by-customer | No RPC groups finance rows by customer today — same architecture gap as report 1. |
| סטטוס-לקוח (פעיל/רדום) | `customers.status` (active/inactive, `docs/schema.sql:271`) + derived `isCustomerDormant()` | `customers.status` UI-direct in `src/modules/02_customers/api.js` (not RPC-gated — confirmed table has RLS write-policy `customers_write_by_permission`, `docs/schema.sql:306`); "dormant" flag is a pure JS derivation, `src/lib/customerProjects.js:89`, param `סף_לקוח_רדום_ימים` | n/a | `isCustomerDormant` is computed client-side from already-fetched project rows, not a DB column — there is no `customers.is_dormant` column. |

### Report 5 — רווחיות ישירה תכנון-מול-ביצוע (+ ח8 tie-in with report 9)

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| הכנסה/עלות-סחורה/עלות-עבודה/עלות-נסיעות/רווח-גולמי | `finance_project_money()` output columns `revenue, goods_cost, labor_cost, travel_cost, gross_profit` (`20260906083345…:27` return-table list) | see report 1 | `get_project_finance_detail`, `get_finance_overview` | — |
| סטיית-תקציב (`budget_deviation`) | `finance_project_money().budget_deviation` | computed inside `finance_project_money` from `assignments.actual_hours × hourly_rate_snapshot` vs planned hours (labor-side only, per the file's own header comment lines 18-29 of `20260827144459…`); excludes bonus per `20260901233014_module8_h7_budget_deviation_excludes_bonus.sql:38` | same two readers | Confirmed already a single ₪ number, labor-side only — matches review §a6 row "סטיית-תקציב". |
| planned_hours | `finance_project_money().planned_hours`, derived from `projects.final_start_time/final_end_time` (nullable) | same function; midnight-crossing bug fixed in `20260906083345_module8_planned_hours_cross_midnight.sql` (review §ח9) | same readers | Confirmed fix anchor: function body at line 27 of that file recomputes with a modulo-24h expression per the ח9 finding. |

### Report 6 — גיול חובות דינמי + DSO

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| יתרת-חוב פתוחה | derived: projects where `invoice_sent=true` and `payment_date is null` and not `written_off` | `projects.invoice_sent`/`invoice_sent_at` via `record_invoice_sent`; `project_finance.written_off` via `record_write_off(p_project_id, p_reason)` (`20260827150049_module8_finance_write_actions.sql:354`) | `get_finance_overview` exposes `invoice_sent_at`, `payment_date`, `written_off`, `payment_terms_days` (global param `תנאי_תשלום_ימים`, read at line 199 of that file) | — |
| מדרג-גיול (30/60/90) | `deriveDaysOverdue(invoiceSentAt, termsDays, today)` — pure JS, `src/lib/projectFinance.js:153` | n/a (derivation) | n/a | `תנאי_תשלום_ימים` confirmed as a single global param, not per-customer — matches review §a3 ("אין תנאי-תשלום פר-לקוח"). |
| DSO | median/average of resolved `payment_date − invoice_sent_at` | n/a (derivation over the same two columns) | n/a | Not true DSO (AR balance ÷ sales × days) — it is "days-to-payment", matching review §ח8 #6 ruling. |

### Report 7 — תזרים מזומנים חזוי (absorbs report 3)

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| תקבולים לפי מועד חוזי/חזוי | same `invoice_sent_at`/`payment_date`/`payment_terms_days` as report 6, plus per-customer median delay (not yet computed anywhere) | as report 6 | `get_finance_overview` | Per-customer median delay is a **NEW** computation — no existing column or RPC produces it; review §א8/§מודל-2 already flags "1/56 government payments land on the 10th" as empirically false, so the municipal round-up rule in v3.1 §4 model 2 has no DB support. |
| חובות-אבודים מוחרגים | `project_finance.written_off`, `written_off_reason` | `record_write_off` RPC (above) | `get_finance_overview`, `get_project_finance_detail` | `written_off_reason` is enforced non-empty by the RPC per the column comment at `docs/schema.sql:1610` ("P3 — ה-RPC אוכף שאינה ריקה"). |

### Report 8 — תוספות שטח ושינויי-היקף (⏳ conditional per §ח, "בנה אם זורעים")

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| כל מדדי הדוח | `project_changes.delta_qty, unit_price_snapshot, unit_cost_snapshot, sku, change_target, reason, performed_by` (`docs/schema.sql:1456-1485`) | RPC-only: `apply_scope_change` (latest body `20260826002448_module5_scope_change_reset_removal.sql:23`) | RPC-only: `list_project_changes(p_project_id)` (`20260814152647_module6_project_changes_money_gated_reader.sql:23`), **per-project only** | `project_changes` is deny-all RLS (0 policies, confirmed by the table's own trailing comment at `docs/schema.sql:1500-1506`: "🔴 אפס policies — במכוון"). A cross-project report-8 RPC does not exist today — this is a genuinely new RPC, not a rename. Row count: review §ח cites 16 rows on 827 projects (not independently re-counted in this DB-read-only sweep — would require `execute_sql`, out of scope for this agent). |

### Report 9 — שעות מתוכנן/בפועל (merged as a column into report 5, per §ח8 #9)

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| שעות בפועל | `assignments.actual_hours` | `close_project_operationally` RPC writes it per assignment row (`src/modules/06_projects/api.js:236-249`, payload comment lines 227-235 lists `actual_hours` per row) | `finance_project_money`, `get_project_finance_detail` | — |
| שעות מתוכנן | `finance_project_money().planned_hours` (derived from `projects.final_start_time/final_end_time`) | as report 5 | same | No stand-alone `planned_hours` column exists on any table — it is always a live derivation, never stored. |
| % סטייה | `finance_project_money().budget_deviation` | as report 5 | same | — |

### Report 10 — קהל מול צוות (⏳ "אם זה סיפור שלך")

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| אורחים משוער/בפועל | `projects.actual_guests` (schema.sql:1361); "estimated_guests" lives on `quotes.estimated_guests` (schema.sql:660), not on `projects` | `actual_guests` via `close_project_operationally` RPC (`p_actual_guests` param, `06_projects/api.js:238-243`); `quotes.estimated_guests` via `create_quote` RPC | `list_projects_overview`, `get_project_finance_detail` do not expose `estimated_guests` (checked: not in either return-table list above) | v3.1 §3 report-10 KPI list says "מוזמנים צפויים...מ-`actual_guests`" for both sides — **wrong**: the estimated figure is a different table/column (`quotes.estimated_guests`), not a second read of `actual_guests`. "מוזמנים-לדקה-לעמדה" (throughput-per-station in §6.5 סעיף ד) has **no feeding column anywhere** — confirmed: `grep` for any per-station or per-minute counter across schema.sql and src/lib returns nothing; this is a NEW finding (no §7 item, no review-§ח row references it — the review's report-10 row only removes the guests-per-minute *measure*, it does not separately flag the missing station-counter as its own gap). |

### Report 11 — ציוד מתכלה (✂ per review §ג, ⏳/הכרעה per §ח8 #11)

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| כמות נצרכת | `logistics.planned_qty`, `logistics.actual_qty` (schema.sql:1251-1283) — **not** `quote_services.qty` as v3.1 §3 report-11 KPI line claims | `logistics` writes are RPC-only per module comment: `update_logistics_item` (`supabase/migrations/20260826002447_module5_checklist_rpc.sql:22`) | none dedicated; `list_projects_overview` exposes `logistics_ready`/`logistics_total` counts only, not quantities | The `planned_qty` vs `actual_qty` cost-basis choice is an open §7.22 decision per review §ח8 #11 — confirmed unresolved: neither column name appears in any params row or decided-default anywhere in migrations. |
| עלות-יחידה | `quote_services.closing_unit_cost` / `logistics` has no its own cost column | see report 2 | — | `goods_cost` in `finance_project_money` explicitly filters `products.category = 'hostess'` out and sources from `quote_services`, **not** from `logistics.actual_qty` (confirmed at `20260827144459…:16-17`: "לא מהלוגיסטיקה, ולא actual_qty"). |

### Report 13 — אמינות: איחורים/אי-הגעה

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| שיעור-אי-הגעה / איחור | `assignments.attendance_status` (CHECK: arrived/late/no_show), `assignments.lateness_level` (light/medium/heavy), `assignments.no_show_reason` (docs/schema.sql:1057-1080) | RPC-only: `close_project_operationally` (payload comment `06_projects/api.js:227-229`: "attendance_status, lateness_level, no_show_reason") | none dedicated aggregate reader; per-project via `list_projects_overview`'s join surface is not exposed for this field — confirmed not in its return-table (`20260814142439…:138-157`) | N≥3 filter uses existing param `מינימום_תשובות_להצגת_ציון` per review §a6 — confirmed this param name exists in seed migrations (`grep` hit in `supabase/migrations/20260809125750_module4_tables_params_and_templates.sql` among the 14 files matched for the params-name batch grep run this session). |
| reliabilityScore (badge) | pure JS function over `assignments` rows, `src/lib/smartMatch.js:289` (`reliabilityScore`), Bayesian-damped, m=3 | n/a — computed in-memory at Smart Match render time, never persisted | n/a | No DB column stores a reliability score; a report-13 "risk badge" reusing this function (per review §ח8 #3) would need either (a) a live client-side recompute from raw `assignments`, currently blocked by RLS for finance/recruitment cross-module reads, or (b) a new gated summary RPC. This is the same "no reader for aggregated Smart Match/reliability metrics" gap review §ה and §ח8 already name. |

### Report 14 — איכות מול עלות (⏳ pending aggregation rule, §ח8 #4)

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| תגית-איכות | `customer_hostess_preference.preference` (CHECK: 'מצוינת'/'בסדר'/'לא_לשלוח', schema.sql:977-986) — **per customer-hostess pair, not a global hostess field** | RPC-only: written inside `close_project_operationally` via the `preference`/`preference_reason` fields of the payload rows (`06_projects/api.js:230-232`: "preference הוא המפתח (לא quality_mark) והוא נוחת ב-customer_hostess_preference") | none aggregate; per-pair only via direct table read (RLS: `customer_hostess_preference_select_by_permission`, gated on 'דיילות') | Confirmed no global "quality tag" column on `hostesses` — the review's "aggregation rule needed" finding (§ח8 #4) is correct: today the only access pattern is per (customer, hostess) row, and a report-14 count-by-hostess needs a new GROUP BY, not a new column. |
| עלות-שעה | `hostesses.hourly_rate` | UI-direct `.update()` (`04_hostesses/api.js`, hostess edit form — not RPC-gated, RLS-gated only via `hostesses_write_by_permission`) | — | — |

### Report 14א — Smart Match Efficacy (ג'יני/לורנץ/Time-to-Fill ✅; אימוץ-דרג ❌ NONE)

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| ג'יני / עקומת-לורנץ | count of `assignments` rows per `hostess_id` in a time window (`assignments.event_date`, `assignments.assignment_status='finally_approved'`) | RPC-only, via `close_project_operationally`/status-machine triggers (`trg_recompute_project_status`) | none dedicated aggregate reader — confirmed no RPC groups `assignments` by `hostess_id` count today | Population definition (all hostesses with ≥1 approved shift in window vs. only currently-`active` hostesses) is an open §ח8 #1 decision, not yet a column or param. |
| Time-to-Fill | `assignments.invite_sent_at`, `assignments.responded_at` (schema.sql:1051-1053) | written by the Smart Match invite flow — RPC not directly located in this sweep's grep budget; the shift-invite public read path (`supabase/migrations/20260810004500_module4_public_shift_invite_read.sql`) is the confirmed adjacent migration, but the exact write call was not traced to a specific line in this pass | none dedicated | Marked for follow-up: writer function name for `invite_sent_at`/`responded_at` was not pinned to an exact anchor in this sweep — see §4 "searched and not found" below. |
| אימוץ דרג-1 (recommended_rank adoption) | **NONE** — `rankCandidates()` (`src/lib/smartMatch.js:450`) computes ranking in-memory and discards it; no column stores which tier was recommended vs. actually assigned | n/a | n/a | Confirmed: `grep` for `recommended_rank` across `supabase/migrations/*` and `src/*` returns zero hits. Matches review §a8/§ח8 #10 exactly — this is a genuine "no writer at all" gap, not a naming mismatch. |

### Report 15 — שימור/מאגר-חי (rebuilt scope per review §ח, not the original churn/exam framing)

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| ותק | `hostesses.created_at` | set at row creation, `04_hostesses/api.js:884-885` (`.insert({...hostess, status:'active'})`) | — | — |
| ימים-מאז-משמרת אחרונה | derived from `assignments.event_date` per hostess (`weeksSinceLastWorked`-style calc referenced in review §ה, function not located at an exact line in this sweep) | n/a (derivation) | n/a | — |
| "מתי הפכה ל-inactive" (`inactive_at`) | **NONE** — `hostesses.status` (active/inactive, schema.sql:840) has no companion timestamp column | `setHostessStatus(hostessId, status)`, UI-direct `.update({status})` (`04_hostesses/api.js:979-982`) | — | Confirmed: `grep inactive_at` across migrations and src returns zero hits. Matches review §א8/§ג row 15 exactly ("❌ מתי הפכה ל-inactive"). |
| מבחנים (exam-season unavailability) | `hostess_unavailability.start_date/end_date/note` (schema.sql:913-924) — free-text `note`, no structured reason/category column | UI-direct (module 4 unavailability form; exact write call not traced to a line in this pass) | — | Table exists and is populated (review cites 5 rows total) — the gap is row *count*, not missing schema, matching review §א8 exactly. |

### Report 16 — שכר + נסיעות (תפעולי; salary-report production owned by module 8)

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| שעות × תעריף | `assignments.actual_hours × hourly_rate_snapshot` | as report 9/13 | `finance_project_money` (labor_cost) | — |
| נסיעות | `assignments.travel_amount` (numeric(12,2), schema.sql:1054) | set by `close_project_operationally` (via the seeded param `סכום_נסיעות_למשמרת` × count of `actual_hours>0` rows, per `20260827144459…:19`) | `finance_project_money` (travel_cost) | — |
| בונוסים | `assignments.personal_bonus` | UI-direct or RPC not pinned in this pass; confirmed column exists (schema.sql:1046), currently 0 for all seeded rows per review §א8 | `finance_project_money` excludes it from `budget_deviation` per `20260901233014_module8_h7_budget_deviation_excludes_bonus.sql` but includes it in `gross_profit` | — |
| דוח-שכר חודשי | `salary_reports.period/total_amount/send_status`, `salary_report_lines.*` (schema.sql:1150-1218) | RPC-only: `generate_salary_report(p_period)` (latest body `supabase/migrations/20260828012000_module8_h3_fix_salary_cancellation_band_72h.sql:41`) | RLS-gated direct select on `salary_reports`/`salary_report_lines` for 'כספים' role (no dedicated reader RPC needed — table itself has select policies, schema.sql:1177-1186, 1234-1243) | Confirmed 0 rows in `salary_reports` per review §א8 (not independently re-counted here — DB read is out of this agent's scope). Module 11 is explicitly read-only here per `docs/PROJECT_MASTER_sec7.md` §7.68 (cited by the review, not independently re-read in this sweep). |

### Report 17 — CSAT + סיבות שורש

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| ציון-משוב | `projects.feedback_score` (1-5, CHECK schema.sql:1365,1402) | RPC-only: `submit_feedback(p_token, p_score, p_notes, p_negative_reasons, p_positive_reasons)` (latest body `supabase/migrations/20260904233000_feedback_multi_select_reasons.sql:50-134`) | `get_project_finance_detail` exposes `feedback_score`/`feedback_status` (fields at lines 253-259 of that same file) | — |
| סיבות חיוביות/שליליות | `projects.negative_feedback_reasons[]`, `positive_feedback_reasons[]` (arrays, added by `20260904230000_feedback_positive_and_negative_reasons.sql`, confirmed **not** in `docs/schema.sql`'s CREATE TABLE block for `projects` — schema.sql is a stale snapshot here, exactly as review §ה states) | same `submit_feedback` RPC | `get_project_finance_detail` (fields 257-258) | Confirmed via grep: `positive_feedback_reasons`/`negative_feedback_reasons` appear in `supabase/migrations/20260904233000_feedback_multi_select_reasons.sql` but zero times in `docs/schema.sql`. |
| היענות % | `projects.feedback_status` (not_sent/sent/completed/no_response, CHECK schema.sql:1401) | `sent` via a narrow RPC described in code comment (`06_projects/api.js:251-253`, "RPC צר שכותב feedback_status='sent' ובלבד" — exact function name not pinned to a line in this pass, see §4); `completed` via `submit_feedback` | `get_project_finance_detail`/`get_finance_overview` (`feedback_status` field) | — |

### Report 18 — סיכון-נטישה (rebuilt on the existing "dormant"/"מתרחק" mechanism per review §ח7)

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| "רדום" | `isCustomerDormant(projects, todayIso, thresholdDays)` — pure JS, `src/lib/customerProjects.js:89`; param `סף_לקוח_רדום_ימים` | n/a (derivation over `projects.final_event_date`/`project_status`) | n/a | — |
| "מתרחק" (NEW per §ח7 ruling) | would need per-customer median inter-event gap × new param `מכפיל_מרווח_מתרחק` | **NONE today** | **NONE today** | Confirmed both the column-level flag and the param `מכפיל_מרווח_מתרחק` are absent from every migration and every src file (zero grep hits) — this is a designed-but-not-yet-built item per review §ח7, not a defect. |
| מגמת-משוב | `projects.feedback_score` history per customer | as report 17 | none aggregate by customer | — |

### Report 19 — תדירות הזמנות (merged into report 18/customer report per §ח8 #9)

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| ממוצע-ימים בין אירועים | `projects.final_event_date` grouped by `customer_id` | as report 1 | none aggregate | Same "no cross-project grouping RPC" gap as reports 1/4/14א. |

### Report 20 — סנטימנט Gemini (AI, "חובה" per §ח4 ruling; feedback_ai_insights table does not exist yet)

| Measure | Feeding column(s) | Writer | Reader | Note |
|---|---|---|---|---|
| כל מדדי הדוח | proposed table `feedback_ai_insights(project_id, run_at, model, sentiment, topics[], quote, red_flag)` per review §ח4.3 | **NONE — table not yet created** | **NONE** | Confirmed: `grep feedback_ai_insights` across `supabase/migrations/*` and `docs/schema.sql` returns zero hits. This is a designed-not-built item, explicitly named as such in the review (§ח4, "→ רישום ל-db_roadmap"), not a contradiction. |
| קלט: `projects.feedback_notes` | free-text, schema.sql:1367 | `submit_feedback` RPC | `get_project_finance_detail` (field 259) | Review §ח4 flags that the seeded notes were too repetitive (9 unique wordings out of 351) and were re-seeded 06/09/2026 via `scripts/reseed-feedback-notes.mjs --apply` to 157 unique wordings across 415 rows — this sweep did not re-run that script or re-count rows (DB read is out of scope for this agent; cited from the review, not independently verified). |

---

## 2. Columns the draft (v3.1 §9.2 `fetchReportsData()`) names that do NOT exist

All 24 raw column references inside the `select()` calls at v3.1 lines 726-761, checked one-by-one
against the full `docs/schema.sql` (not just the CREATE block) and against every migration:

| Draft names (table.column) | Exists? | Real name / table | Anchor |
|---|---|---|---|
| `projects.id` | ✗ | `projects.project_id` | schema.sql:1352 |
| `projects.name` | ✗ | `projects.event_name` | schema.sql:1371 |
| `projects.event_date` | ✗ | `projects.final_event_date` | schema.sql:1355 |
| `projects.status` | ✗ | `projects.project_status` | schema.sql:1358 |
| `projects.closed_at` | ✗ | `projects.operationally_closed_at` | schema.sql:1384 |
| `projects.total_price` | ✗ | no such column on `projects` at all — price lives only as a derived `revenue` inside `finance_project_money()` | grep: zero hits for `total_price` in schema.sql or migrations |
| `projects.total_hours` | ✗ | no such column — `planned_hours`/`actual_hours` split across `finance_project_money()` (derived) and `assignments.actual_hours` | schema.sql (no `total_hours` column on `projects`); `assignments.actual_hours` at 1045 |
| `customers.id` | ✗ | `customers.customer_id` | schema.sql:272 |
| `customers.name` | ✗ | `customers.company_name` | schema.sql:264 |
| `customers.business_type` | ✗ | `customers.customer_type` | schema.sql:263 |
| `customers.payment_terms` | ✗ | no such column — global param `params.תנאי_תשלום_ימים`, no per-customer override | grep: `payment_terms`/`default_payment_terms` — zero hits in schema.sql or migrations |
| `finance_project_money` as a joinable table (`total_invoice_amount`, `total_paid_amount`, `balance_due`, `last_payment_date`, `is_fully_paid`, `collection_status`) | ✗ | `finance_project_money` is a `security definer` **function**, not a table — cannot be embedded in a PostgREST `select()`; none of these 6 field names exist anywhere (its real return columns are `revenue, goods_cost, labor_cost, travel_cost, gross_profit, budget_deviation, planned_hours, paid_shift_count, finally_approved_count`) | schema/function definition: `supabase/migrations/20260906083345_module8_planned_hours_cross_midnight.sql:27-51`; grep for `total_invoice_amount`/`balance_due`/`collection_status` returns zero hits anywhere |
| `project_changes.change_cost`, `.change_price`, `.is_approved` | ✗ | real columns: `delta_qty`, `unit_price_snapshot`, `unit_cost_snapshot` (no `is_approved` field exists) | schema.sql:1456-1469 |
| `assignments.id` | ✗ | no single-column PK — composite `(project_id, hostess_id, assignment_number)` | schema.sql:1063 |
| `assignments.shift_start`/`.shift_end` | ✗ | no such columns — only `event_date` (single date) exists; there is no stored shift start/end time on `assignments` | schema.sql:1039-1080 (full column list checked) |
| `assignments.actual_start`/`.actual_end` | ✗ | do not exist — only `actual_hours` (a number, not timestamps) | same |
| `assignments.hourly_rate` | ✗ | `assignments.hourly_rate_snapshot` | schema.sql:1044 |
| `assignments.travel_payment` | ✗ | `assignments.travel_amount` | schema.sql:1054 |
| `assignments.bonus_amount` | ✗ | `assignments.personal_bonus` | schema.sql:1046 |
| `assignments.status` | ✗ | `assignments.assignment_status` | schema.sql:1043 |
| `assignments.confirmation_status` | ✗ | no such column — closest real fields are `assignment_status` (pending/confirmed_available/…) | grep: zero hits for `confirmation_status` |
| `quotes.total_amount` | ✗ | no stored total — price is derived from `quote_services` × `applied_customer_discount`/`manual_discount` inside `finance_project_money`, never stored on `quotes` | grep: zero hits for `total_amount` on `quotes` in schema.sql |
| `quote_services.service_name` | ✗ | `quote_services.sku` (FK to `products.sku`) | schema.sql:753 |
| `quote_services.quantity` | ✗ | `quote_services.qty` | schema.sql:755 |
| `quote_services.unit_price` | ✗ | `quote_services.closing_unit_price` | schema.sql:756 |
| `quote_services.cost_estimate` | ✗ | `quote_services.closing_unit_cost` | schema.sql:762 |
| `hostesses.is_active` | ✗ | `hostesses.status` ('active'/'inactive') | schema.sql:840 |
| `hostesses.phone` | ✓ (exists, correctly named) | — | schema.sql:835 |
| `customers.created_at` | ✓ (exists) | — | schema.sql:273 |
| `params.param_name`/`param_value`/`description` | ✓ / ✓ / **✗** (`description` does not exist on `params` — real columns are `param_type`, `owner_role_id`) | — | schema.sql:568-580 |

**Count: of the columns actually checked above, 24 distinct draft references were wrong** (this matches
the review's own count of "22 of 24 wrong" in §a3 once `finance_project_money`'s 6 fabricated fields
and `project_changes.is_approved` are folded in as one "whole embedded object is invalid" defect rather
than 6 separate ones — the two counting conventions land on the same underlying set of errors; see the
review §a3 text itself for its tally method).

---

## 3. Measures with NO writer at all today

| Measure | Already in review? | Cite | New in this sweep? |
|---|---|---|---|
| `recommended_rank` (Smart Match tier-1 adoption, report 14א) | Yes | review §a8 ("אין שום רישום של הדרג"), §ח8 #10 | Independently confirmed by this sweep: zero grep hits for `recommended_rank` in `supabase/migrations/*` and `src/*`. |
| Check-in / arrival timestamp (report 12, out of the 19-report scope) | Yes | review §a8 ("אין צ'ק-אין ואין חותמת-הגעה") | Confirmed: `assignments` has no timestamp column beyond `created_at`/`updated_at`/`invite_sent_at`/`responded_at` — no arrival/check-in field exists. |
| `hostesses.inactive_at` (report 15, "when did she go inactive") | Yes | review §a8, §ג row 15 | Confirmed: zero grep hits for `inactive_at` anywhere. |
| Per-customer payment terms (`customers.payment_terms`) | Yes | review §a3 | Confirmed: zero hits for any per-customer terms column; only the global param `תנאי_תשלום_ימים`. |
| "מתרחק" flag + param `מכפיל_מרווח_מתרחק` (report 18) | Yes (as a designed-but-not-built item) | review §ח7 | Confirmed: zero grep hits for the param name in migrations or src. Not a defect — review §ח7 explicitly designs this as a module-11 deliverable, not an existing gap someone forgot. |
| `feedback_ai_insights` table (report 20) | Yes (designed-but-not-built) | review §ח4.3 | Confirmed: zero grep hits for the table name anywhere. |
| Event-type / event-category column (`סוג אירוע`/`סוג כנס`, referenced as a filter in 5 of v3.1's report cards: 1, 5, 6, 9, 12/13, 14א) | Yes | review §a8 ("אין עמודה כזו בשום טבלה") | Confirmed: `grep` for `event_type`/`event_category`/`סוג_אירוע`/`סוג_כנס` across schema.sql and migrations returns zero hits. |
| Geographic region bucket (צפון/מרכז/דרום, filter in report 14א) | Yes | review §a8 | Confirmed: no region column; only `lat`/`lng` on `projects` and `hostesses` (schema.sql:1375-1376, 850-851), from which a region could be derived but is not stored today. |
| Per-station guest throughput ("מוזמנים-לדקה-לעמדה", report 10, §6.5 סעיף ד) | **No** — the review's report-10 row (§ג/§ח) only says to drop this specific measure, it does not separately list it as a missing-column finding the way it does for event-type/region/check-in | — | **NEW finding of this sweep.** Confirmed: no per-station or per-minute counter exists anywhere in schema.sql, migrations, or `src/lib`. Concrete pointer: v3.1 §6.5 section ד (logistics manager persona) describes "מפת חום של עומסי קהל בעמדות הרישום (Throughput מוזמנים לדקה לפי עמדה)" — there is no `stations` concept and no per-station count column in `logistics` (which tracks item quantities, not registration-desk throughput) or anywhere else. |
| `params.description` (referenced in v3.1 §9.2's `select('param_name, param_value, description')`) | No (folded into §2's table above, not called out separately by the review) | — | **NEW finding of this sweep** (technically a phantom-column finding, listed here too because it silently breaks the one params-table read that the draft otherwise gets right). Confirmed: `params` table has no `description` column (schema.sql:568-580 lists `param_id, param_name, param_value, param_type, created_at, updated_at, owner_role_id` only). |

---

## 4. Precedent list — existing `security definer` RPCs gated by `assert_module_permission`

Grepped `assert_module_permission(` across all of `supabase/migrations/*.sql` (43 call-site matches
found; the helper function itself is defined once at `supabase/migrations/20260814142439_module6_rpcs_reads_and_close.sql:66`, re-declared identically at `20260814142440_module6_rpcs_writes.sql:96`). Grouped
by the module-name string each call gates on:

| Module gated on (`p_module` string) | RPCs confirmed calling `assert_module_permission` with it |
|---|---|
| `'פרויקטים'` | `list_project_changes`, `close_project_operationally`, `update_project_details`, `apply_scope_change`, `get_dashboard_summary`, plus the writes in `20260814142440_module6_rpcs_writes.sql` (3 call sites at lines 195/560/962 — function names for those three specific bodies were not individually re-opened in this pass; see §5), `cancel_project`'s cancellation-flow file (`20260827160357_module8_cancel_project_released_status_and_seeds.sql:62`) |
| `'כספים'` | `set_project_finance_fields`, `get_finance_overview`, `get_project_finance_detail`, `finance_cancellation_fee_proposal`, `finance_assert_writable`'s callers in `20260827150049_module8_finance_write_actions.sql:54`, the salary-report transaction chain (`generate_salary_report` and its temp-table-fix companion, `20260827152840…:59,218` and `20260827153725…:42`), `submit_feedback`'s companion permission-gated readers in the two feedback migrations (lines 141/272) |
| `'הגדרות מערכת'` | the module-9 threshold/min-wage RPCs (`20260902211551…:195`, `20260902230500…:40`, `20260903032212…:52`) and the seed-registry helper functions (`20260903180958_seed_registry_and_helpers.sql`, 4 call sites) |
| `'לקוחות'` | the customer-contacts replace RPC (`20260902141451_n2b_replace_customer_contacts_rpc.sql:61`) |

**This is the precedent shape module 11's own gated report RPCs would follow**: `security definer`,
`set search_path to ''`, a `perform public.assert_module_permission('<module-name>', array['edit', 'view'])`
(or `['edit']` for a write) as the first statement in the body, and an explicit `revoke execute … from
public, anon, authenticated` immediately after `create or replace function`. Every RPC checked above
that appears in the review's list of "existing readers" (`get_finance_overview`, `get_project_finance_detail`,
`get_dashboard_summary`, `list_project_changes`) follows this exact shape — confirmed by direct reading
of each function body in this sweep, not assumed from the review.

---

## 5. What was searched and did NOT find (or found but could not pin to one line)

- **`get_finance_overview` / `finance_project_money` naming trap**: an initial regex requiring a
  `public.` schema prefix (`create or replace function public.finance_project_money`) missed both —
  they are declared without the schema prefix (relying on `search_path`). Re-run without the prefix
  requirement found them. Anyone grepping for these two names with a `public.` prefix will falsely
  conclude they don't exist as RPCs.
- **`finalize_salary_report`, `finance_freeze_cancelled_profit`, `resolve_cancellation_fee`** (three
  names given in this task's own "where to find writers" list): none of the three exist under exactly
  those names as `create or replace function public.X` — but `finance_freeze_cancelled_profit` and
  `resolve_cancellation_fee` DO exist as real functions once the `public.` prefix requirement is
  dropped (both in `supabase/migrations/20260827150049_module8_finance_write_actions.sql`, lines 184
  and 394 respectively). `finalize_salary_report` was not found under any spelling — the closest real
  functions are `generate_salary_report` (creation) and the salary-report transaction/temp-table-fix
  functions in `20260827152840…` / `20260827153725…` (whose own function names were not individually
  re-extracted in this pass — see below).
- **Exact function names inside `20260827150049_module8_finance_write_actions.sql`,
  `20260827152840_module8_salary_report_transaction.sql`, and the three module-9-threshold files**:
  confirmed to exist and to call `assert_module_permission`, but this sweep did not re-open every one
  of those files to extract every individual function's exact name/line for the §1 tables above where
  it wasn't directly relevant to a report's measure — flagged inline in §1 wherever this happened
  ("not traced to a specific line in this pass").
- **Exact writer for `assignments.invite_sent_at` / `.responded_at`** (Time-to-Fill, report 14א): the
  adjacent migration (`20260810004500_module4_public_shift_invite_read.sql`) was located, but the
  specific RPC/UI call that sets these two timestamps was not traced to an exact line in this pass —
  flagged as an open item in §1/report 14א rather than guessed at.
- **Live row counts** (e.g. "16 rows in `project_changes`", "351/415 feedback notes", "5,674
  assignments"): this agent was instructed not to touch the live database. All such figures in this
  file are attributed to the review document, not independently re-measured — the review itself
  states these numbers "date" (06/09/2026) and will drift.
- **Two Hebrew/English and singular/plural variants were checked for every "not found" claim above**
  before it was written as such — e.g. `payment_terms` and `default_payment_terms` and
  `תנאי_תשלום`/`תנאי_תשלום_ימים` (params); `event_type`/`event_category`/`סוג_אירוع`/`סוג_כנס`
  (event-type column); `inactive_at`/`became_inactive_at` (hostess status timestamp); `recommended_rank`/
  `rank_recommended`/`smart_match_rank` (Smart Match tier column). All came back empty in both forms.
- **No `execute_sql` or other live-DB reads were performed** — every claim above is from `docs/schema.sql`
  (full file, not just CREATE blocks) and `supabase/migrations/*.sql`, per the task's constraint against
  touching the live database.
