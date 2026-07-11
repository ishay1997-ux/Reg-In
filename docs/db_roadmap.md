# DB Roadmap — Future Schema Changes (REG-IN)

> **Machine-first (English; Hebrew only as data).** This file is the single consolidated MAP of all
> pending/future database work — it is an **execution aggregator, NOT a decision registry**.
> Open questions live ONLY in `PROJECT_MASTER.md` §7 (iron rule; `docs/CLAUDE.md`). Decided rows
> cite `§7.N`; the single verbatim copy here is the §7.47 mirror (tagged per iron rule 13).
> Log-sourced debt cites `CHANGELOG.md §TODO` / `CLAUDE_CODE_LOG.md §tech-debt`.
>
> **Read triggers:** before designing ANY migration · at every module blueprint
> (`create_micro_guide_template.md` mandates it) · at §7 decision sessions touching schema (P13) ·
> at the periodic DB-attack audit (P17).
> **Update trigger (rule 13 + §10 below):** any §7 change or applied migration touching schema ⇒
> update the matching row here IN THE SAME SESSION. The Stop hook blocks a session that changed
> `supabase/migrations/**` without touching this file.
>
> **Created:** 08/07/2026 (structural-attack audit, §7 batch 61–70).
> **Last verified vs live DB:** 08/07/2026 18:54 via Supabase MCP (read-only): `get_advisors`
> (security — same 12 accepted `rls_enabled_no_policy` INFOs + accepted SECURITY DEFINER/leaked-password
> WARNs, zero new findings), `list_migrations` (still 7 — no new migration since creation). Prior: 08:34.
> ✅ אומת-סנכרון: 08/07/2026 18:54 (regin-docs-sync)

---

## 0. Current state pointer (do NOT duplicate DDL here)

- Schema SSOT (reads): `docs/schema.sql` (snapshot). Changes SSOT: `supabase/migrations/` (8 files:
  local-only baseline + 7 applied remote migrations, latest `20260707163709_module1_users_rls_initplan_select_wrap`).
- **16 tables**: roles, modules, permissions, users, login_attempts (Module-1 infra, RLS+policies live) ·
  customers, products, price_tiers, params, quotes, quote_services, projects, hostesses,
  salary_reports, assignments, logistics (11 business tables — live RLS **on** with 0 policies =
  intended deny-all; the enable-RLS exists in NO migration → restore-gap, §7.48).
- No triggers, no views, no enums (text+CHECK pattern), no installed extensions beyond platform
  defaults (`pg_cron` available, not installed — §7.42).
- Advisors snapshot (08/07/2026 08:34): **security** — 12× `rls_enabled_no_policy` INFO (by design,
  until per-module policies land) · 5× SECURITY DEFINER WARNs on the 4 Module-1 functions
  (intentional: lockout functions must be anon-callable; documented) · `auth_leaked_password_protection`
  WARN (deferred → M10, CHANGELOG §TODO). **performance** — 8× `unindexed_foreign_keys` INFO (Lane C-1) ·
  3× `multiple_permissive_policies` WARN on users/permissions (triaged & deferred, micro-guide M1 §9).

## 1. Migration Design Checklist — run for EVERY schema change (the "deep thinking" pre-flight)

- [ ] Named migration + Hebrew "why" header; never edit an applied migration — fix-forward only (P15)
- [ ] §7 scan: does this change execute/affect a §7 item or a row in this file? Cite it in the header
- [ ] New/touched table: RLS policies per §7.21 standard template; `(select …)` initplan wrap mandatory
- [ ] FKs: explicit ON DELETE **and** ON UPDATE decision (§7.64 policy) + covering index (C-1)
- [ ] Constraints: CHECK / UNIQUE / NOT NULL per this file's §6 per-table index
- [ ] **Every number a screen displays has a named source column or computation** (the C5:833 lesson —
      a displayed figure with no data home is a 🛑 finding, not a shrug)
- [ ] Time columns: `timestamptz` only; Asia/Jerusalem job semantics (§7.56)
- [ ] Money columns: `numeric(12,2)` (§7.74)
- [ ] `created_at`/`updated_at` + `moddatetime` on new tables (§7.73, once nodded)
- [ ] Seed impact? (roles/modules/params exception only — DB protocol) · Storage impact? (§5 lane)
- [ ] 👤 gate BEFORE applying (shared Supabase project, rule 10) — coordinate with the partner
- [ ] After apply: refresh `docs/schema.sql`, commit migration+snapshot **together**
- [ ] Run Supabase advisors (MCP read-only) — zero new findings, or a written triage note
- [ ] Ripple: mark executed rows here + §7.47 + CHANGELOG (📣 if it touches the partner's modules/tables)

## 2. Lane A — Committed / near-certain ("pretty sure we'll change")

### A1. Decided (or nod-pending 👍) — awaiting a named migration

🔗 מראת §7.47 — SSOT: PROJECT_MASTER §7 (לא לערוך כאן ידנית)

| טבלה | עמודות חדשות | מקור-הכרעה | מודול-ביצוע |
|---|---|---|---|
| `hostesses` | `address` (טקסט), `lat`, `lng` (קואורדינטות) | §7.6, §7.14 | 4 |
| `projects` | זמני התחלה/סיום לאירוע + סיווג "קצר/ארוך" | §7.29, §7.45, §7.43 (קשור §7.30) | 4 |
| `projects` | `cancelled_at` (timestamptz), `cancellation_reason` enum(`standard`,`force_majeure`) | §7.16(ב) | 4/8 |
| `assignments` | `invite_token`, `invite_sent_at` (+פקיעה) | §7.45 | 4 |
| `assignments` | `attendance_status`, `lateness_level`, `no_show_reason` | §7.16(א) | 4/8 |
| `quote_services` | `closing_unit_cost` (הקפאת עלות) | §7.28 | 3 |
| `params` / `roles` / `modules` / `salary_reports` | אילוצי-ייחודיות | §7.40 | 2/3/8 |

Additional decided / nod-pending rows (cite-only):

| # | Change | Source | Status | Module | Trigger |
|---|---|---|---|---|---|
| A-8 | enable-RLS migration for the 11 business tables (idempotent; restore-gap — live is fine) | §7.48 | **✅ APPLIED `20260710160735` (SECTION 2), 10/07** | 2 | before first M2 policies (module-2.md step 1.1) |
| A-9 | discount CHECKs: 0–100 + combined ≤100% (customers/quotes) | §7.26 | decided | 2/3 | M2 step 1.2 draft exists |
| A-10 | per-table RLS policies from the standard template, `(select …)` wrapped | §7.21 | decided | every module | with each module's first migration; multi-module tables gated on §7.63 |
| A-11 | `pg_cron` install + quote-expiry daily job | §7.42 | decided | 3 | first consumer = quote expiry (T2) |
| A-12 | Seed: products (11) + price_tiers (40) + params (17 incl. `שכר_מינימום_שעתי`) | §7.13 + `reference_spec/products_and_params.md` (locked decisions) | pending exec | 3 | blocker removed (VAT=18%) |
| A-13 | `created_at`/`updated_at` + `moddatetime` trigger, all business tables, one migration | §7.73 | 👍 nod | 2 (rolling) | also anchors T2 validity semantics |
| A-14 | NOT NULL: `users.role_id` · `quotes.customer_id` · `projects.owner_email` · `projects.quote_id` | §7.62 | 👍 nod | 2 / 3 / 6 | users → with A-8 in the M2 infra migration; **`quotes.customer_id`→bigint in M2 (§7.64 type-change; its SET NOT NULL still M3)** |
| A-15 | partial UNIQUE on active assignment statuses (one active row per hostess+project) | §7.54 | 👍 nod | 4 | kills double-count/double-pay class |
| A-16 | timestamptz + Asia/Jerusalem standard for all new time columns & jobs | §7.56 | 👍 nod | 3+ | first pg_cron job |
| A-17 | money columns → `numeric(12,2)` | §7.74 | 👍 nod | 3 | with A-9 in the pricing migrations |
| A-18 | `login_attempts` stale-row purge job (>30d from `last_attempt_at`) | §7.75 | 👍 nod | 3/10 | after A-11 |

### A2. Log-registered debt with a decided direction (SSOT: the logs)

| # | Change | Source | Module/Trigger |
|---|---|---|---|
| A-20 | `users.email` ON UPDATE CASCADE + `auth.users`↔`public.users` email sync | `CLAUDE_CODE_LOG.md` §tech-debt | folded into the §7.64 decision; next users-schema touch |
| A-21 | `MODULE_META` Hebrew-string → `module_id`/slug | `CHANGELOG.md` §TODO | next `modules` schema touch |
| A-22 | account lockout → Supabase Auth Hook | `CHANGELOG.md` §TODO | requires Team plan — parked |
| A-23 | Leaked-Password Protection (Auth setting) | `CHANGELOG.md` §TODO | M10 |
| A-24 | notification-preferences table (+UI toggles wired) | `PROJECT_MASTER.md` §6 (Ishay 07/07) | M9 builds table+UI; M10 wires sending |
| A-25 | send/dispatch-log entity (marketing + automations; no C6 table exists) | §6 + §7.60 | M10 |
| A-26 | password-reset flow storage (6-digit code — or Supabase Auth OTP instead; decide at blueprint) | §6 ("שכחתי סיסמה") + C5 §1.8.9 | M10 |

## 3. Lane B — Open design decisions with schema impact ("needs deeper thinking")

Label + citation ONLY — decision content lives in §7. 🔴 = cheap now, expensive after more modules ship.

**Core cluster (the structural-attack batch — decide first):**

| Ref | Question (label) | 🔴 | Decide before |
|---|---|---|---|
| §7.64 | natural PKs (email/ח"פ/ת"ז/SKU) vs surrogate — **direction RULED 10/07**: external/PII→surrogate; system-owned (SKU)→natural+ON UPDATE CASCADE; users.email→accept+CASCADE | 🔴🔴 | per-module: customers=**M2 now** · sku=M3 · ת"ז=M4 · email=M9 |
| §7.63 | column-level ownership vs row-level RLS (projects finance columns; hostesses bank/ת"ז) | 🔴 | direction before M2 policies |
| §7.67 | assignment → service-line/shift lineage (unblocks §7.19/29/30) | 🔴 | M4 blueprint |
| §7.72 | change-order data home / single project-line entity (logistics⟷quote_services lineage) | 🔴 | M6 (direction earlier helps M5) |
| §7.78 | financial snapshot as a unit: decide §7.51 (VAT) + §7.28 (cost) + §7.52 (profit) together | 🔴 | M3 (VAT part) / M6/8 |
| §7.68 | salary report as a document: `period` UNIQUE + frozen line snapshots (absorbs §7.46 edge) |  | M8 |
| §7.61 | unified Storage plan: buckets + `storage.objects` policies (private+signed URLs?) |  | direction at M6; first bucket M2 |

**Remaining open schema-bound items:**

| Ref | Question (label) | Decide before |
|---|---|---|
| §7.49 + §7.76 | quote→project conversion RPC (atomicity; copies event-identity snapshot) | M3 |
| §7.50 + §7.77 | DB-level lock: approved quote + closed/archived project card (column-granular — ties §7.63) | M3 / 6 |
| §7.53 | hostess-count CHECK >0 → ≥0 (site/tags-only events) | M3/6 |
| §7.30 | multi-day / cross-midnight events representation | M3/4 |
| §7.55 | event-side coordinates + geocode service choice + NULL rule | M4 |
| §7.65 | business-email uniqueness (hostesses UNIQUE? customers open) | M2/4 |
| §7.66 | `hourly_rate` ≥ min-wage param — enforcement mechanism (trigger vs app) | M4 (ties 9) |
| §7.69 | "+ נסיעות" promised in invite template vs absent from salary model | M4/8 |
| §7.70 | typed params + history (split money/templates/integration, or minimum UNIQUE+validation) | M3 seed |
| §7.19 | bonus split + per-hostess actual-hours derivation | M8 |
| §7.22 | logistics `actual_qty` < `planned_qty` semantics (+possible CHECK) | M5/8 |
| §7.34 | deactivating an in-use customer/hostess/product — status guards | M2/4/9 |
| §7.35 | user off-boarding + `projects.owner_email` reassignment | M9 |
| §7.36 | upload+DB-write atomicity, orphan cleanup | first at M2 (marketing) |
| §7.57 | ghost param `יום_הפקת_דוח_שכר` — seed it or drop it | M3 seed / M8 |
| §7.60 | Module 10 has no spec — its tables (dispatch-log etc.) synthesized at blueprint | M10 |
| §7.23 | full audit trail (who-changed-what) — deliberately deferred | reconsider at M12 |
| §7.71 | DROP timing for deprecated `quotes.pdf_url` | M12 cleanup (or never) |

## 4. Lane C — Engineering hygiene (no product decision; execution discipline)

| # | Rider | Source | Timing |
|---|---|---|---|
| C-1 | 8 FK covering indexes: `permissions.module_id`, `users.role_id`, `quotes.customer_id`, `quote_services.sku`, `projects.owner_email`, `assignments.id_number`, `assignments.salary_report_id`, `logistics.sku` | advisors `unindexed_foreign_keys` (triaged 07/07) | with each module's first migration touching that table |
| C-2 | `multiple_permissive_policies` on users/permissions | advisors WARN — deferred (micro-guide M1 §9) | reconsider at M12 |
| C-3 | `(select …)` initplan wrap in every new policy | §7.21 template | always |
| C-4 | advisors run after every applied migration | this file §1 | always |
| C-5 | `docs/schema.sql` snapshot refresh + same-commit rule | DB protocol (root CLAUDE.md) | always |

## 5. Storage & infrastructure lane

| Item | Status | Source | Module |
|---|---|---|---|
| `marketing` bucket (public) + 4 `storage.objects` policies | **✅ APPLIED in migration `20260710160735` (10/07)** | `micro_guides/module-2.md` step 1.1 | 2 |
| summary-reports bucket (mandatory closure upload) · payroll files · invoice PDFs — one plan: names, private+Signed-URLs, policy template | OPEN | §7.61 (cites §7.38, §7.36) | 6/8 |
| `pg_cron` install + jobs (quote expiry, event-passed, login purge) | decided | §7.42 + §7.75 | 3 |
| scheduled Edge Function (sender: reminders, dispatch) | decided direction | §7.42 | 10 |
| Supabase Auth Hook (lockout) · Leaked-Password Protection | parked / deferred | logs (A-22/A-23) | plan-gated / 10 |

## 6. Per-table pending index (cross-reference; update rows as items close)

| Table | Pending work (refs) |
|---|---|
| roles | UNIQUE (§7.40 · §7.47-mirror row) — load-bearing: all CEO policies subquery `role_name='מנכ"ל'` |
| modules | UNIQUE (§7.40) · slug/module_id refactor (A-21) |
| permissions | FK index (C-1) · multiple_permissive (C-2) |
| users | NOT NULL role_id (A-14) · email key = **accept + ON UPDATE CASCADE — RULED §7.64 (10/07)**, exec M9 · email sync (A-20) · FK index (C-1) |
| login_attempts | purge job (A-18) · Auth Hook upgrade (A-22) |
| customers | policies (A-10) · discount CHECK (A-9) · timestamps (A-13) · **surrogate PK — RULED §7.64 (10/07): `customer_id bigint` + `company_number` unique not null; exec M2 step 1.1 (סטיית-C6 §2.4.1)** · email UNIQUE (§7.65) · deactivate guards (§7.34) · **+ child `customer_contacts` — §7.81 (11/07), ריבוי אנשי-קשר אופציה C (איש-קשר ראשי נשאר inline)** |
| customer_contacts | **NEW child table — RULED §7.81 (11/07): ריבוי אנשי-קשר, אופציה C.** FK→`customers(customer_id)` on delete/update cascade + covering index (C-1 ✓) · RLS §7.21 ('לקוחות', same gate as customers) · moddatetime (§7.73). Migration `20260711013517_module2_customer_contacts.sql` — **✅ APPLIED 11/07 (verified live via MCP: table/7-cols/FK/covering-index/trigger[extensions.moddatetime]/RLS/2 policies)**; api/UI wiring = step 3.7; סטיית-C6 §2.4.1 (single inline contact) |
| products | unit/category CHECKs exist; sku stays natural PK + **ON UPDATE CASCADE — RULED §7.64 (10/07)**, exec M3 · seed (A-12) |
| price_tiers | seed (A-12) · sanity CHECKs min_qty>0/max≥min (§7.41 bundle) |
| params | UNIQUE (§7.40) · typed+history (§7.70) · seed (A-12) · ghost param (§7.57) |
| quotes | NOT NULL customer_id (A-14) · vat_rate_snapshot (§7.51/§7.78) · lock (§7.50) · CHECK ≥0 (§7.53) · expiry anchor (A-13/§7.42) · pdf_url drop (§7.71) · discounts CHECK (A-9) |
| quote_services | closing_unit_cost (§7.47-mirror) · color/reason enums (§7.41) · change-order model (§7.72) |
| projects | §7.47-mirror ×2 (times, cancelled_at) · NOT NULL owner/quote_id (A-14) · finance-column ownership 🔴 (§7.63) · name snapshot (§7.76) · close-lock (§7.77) · profit stored? (§7.52) · coords (§7.55) · multi-day (§7.30) |
| hostesses | §7.47-mirror (address/coords) · bank-column protection 🔴 (§7.63) · ת"ז → **surrogate — RULED §7.64 (10/07)**, exec M4 (§7.67/54 coord; סטיית-C6) · email UNIQUE (§7.65) · min-wage rule (§7.66) |
| assignments | §7.47-mirror ×2 (token, attendance) · shift lineage 🔴 (§7.67) · partial-unique (A-15) · travel (§7.69) · FK indexes (C-1) |
| logistics | actual<planned (§7.22) · lineage/cost (§7.72) · FK index (C-1) |
| salary_reports | month-id UNIQUE (§7.40/§7.47-mirror) · document model (§7.68) · storage (§7.61) |

## 7. RLS rollout matrix (module × tables it WRITES; base input for §7.63)

| Module | Writes tables | Roles with edit (permission matrix, C5 §1.4) | Multi-module conflict? |
|---|---|---|---|
| 2 לקוחות | customers (+marketing bucket) | CEO, projects mgr, finance mgr | no (one module gates the table) |
| 3 הצעות | quotes, quote_services (+seed: products/price_tiers/params) | CEO, projects mgr | quotes locked after approval (§7.50) |
| 4 דיילות | hostesses, assignments | CEO, recruitment mgr | assignments also written by M8 (salary_report_id) |
| 5 לוגיסטיקה | logistics (item_status/actual_qty only) | CEO, logistics mgr | derived rows created by M3/M6 conversion |
| 6 פרויקטים | projects (operational cols), assignments/logistics via content-change | CEO, projects mgr | ⚠️ projects shared with M8 columns — §7.63 |
| 8 כספים | projects (invoice_sent/payment_date/feedback_*), salary_reports, assignments.salary_report_id | CEO, finance mgr | ⚠️ the §7.63 hard case |
| 9 הגדרות | params, users, notification-prefs (new) | CEO only | no |
| 10 אוטומציות | dispatch-log (new), reminder flags | system (definer jobs) | jobs bypass RLS — SECURITY DEFINER discipline |
| 11 דו"חות | none (5 reports as Views/RPC, read-only) | per matrix view rights | no |

## 8. Explicitly-accepted designs (decided NOT to over-engineer — with reopen triggers)

| Accepted | Why acceptable | Reopen if… |
|---|---|---|
| Bank details in-row on `hostesses` | dozens of rows, internal tool | §7.63 lands a masked view/table-split anyway; reopen if payroll export screens ship before it |
| Composite text PKs (JOIN/PostgREST ergonomics) | scale is tiny; the real cost is key *mutability* (§7.64), not performance | table crosses ~100k rows or API latency complaints |
| Soft-delete via `status` columns | consistent convention (users/customers/hostesses/products) | §7.34 decision demands more |
| Hostess availability = absence of date-conflict in assignments | spec-explicit (C5:756); no calendar entity | business asks for availability preferences/vacations |
| Single KV `params` for templates+integration | small, editable via M9 UI | §7.70 decides split; template versioning demanded |
| `quotes.pdf_url` column stays (unused) | dropping is churn (§7.12) | §7.71 cleanup batch at M12 |

## 9. Known reference-spec defects (C5/C6 read with a grain of salt — verified 08/07/2026)

| # | Defect | Where | Handled by |
|---|---|---|---|
| 1 | Projects field table printed inside the Quotes section, no §2.4.4 table of its own | C6:243–261 vs C6:276 | awareness; schema already mapped correctly |
| 2 | `quote_services`/`assignments`/`logistics` labeled "M:N link tables" though they carry lifecycle+money (association entities) | C6 §2.4.11/13/14 | §7.67 + §7.72 address the resulting lineage gaps |
| 3 | `pdf_url` marked mandatory (חובה) | C6:235 | overruled — §7.12 (deprecated, nullable) |
| 4 | Two overlapping cancel-reason fields (C6 `cancel_reason` 4-value vs §7.16(ב) `cancellation_reason`) | C6:256 vs §7.47 | §7.16↳ — reconcile at M4/8 migration |
| 5 | SKU format appears 3 ways: `-06ST` (catalog) / `ST-04`+`TAG-REG-B` (worked example) / `06ST` (seed decision) | P:24 / C5:184–186 / P:8 | seed decisions #2 rule |
| 6 | Worked example prices 04ST at 500 (base) while raw tier table says 400 | C5:184 vs P:45 | seed decision #3 (base_price; no tiers for services) |
| 7 | W3 = "עומס" in raw params vs "מהימנות" + weights 0.4/0.3/0.3 in locked decisions | P:102 vs P:11 | seed decision #5 + §7.15 |
| 8 | Settings screen lists a "תעריף חיוב קבוע לדיילת" param that was removed | C5:883 | seed decision #4 (dropped) |
| 9 | Invite template promises "+ נסיעות" absent from the salary model | C5:1095 vs C5:471 | §7.69 |
| 10 | Project card shows event date/location as read-only-from-quote while C6+process say editable | C5:644 vs C6:247, C5:226 | editable wins (process text); UI note at M6 |
| 11 | `users` table specifies a password column — implementation uses Supabase Auth | C6:301 | as-built deviation (documented, M1) |
| 12 | Login screen specifies CAPTCHA — replaced by lockout + Google Sign-In | C5:488 | §7.8 (decided) |
| 13 | C6 describes trigger T3 as "send final details" (that's the manual §1.8.6 action) | C6:22 | §7.42↳ (07/07) — implement per §1.8.7 |
| 14 | T3 reminder wording says "מחר" while the timing is a param in hours | C5:1127 vs P:99 | §7.42↳ — the param rules |
| 15 | Gross profit "computed and saved" vs "derived, not stored" | C5:453 vs C6:279 | §7.52 + §7.78 (snapshot-as-a-unit) |

## 10. Maintenance protocol (how this file stays alive)

1. **Live update, same session (parallel of iron rule 15):** any session that applies a migration,
   discovers a DB gap, or closes a §7 item — updates the matching row here BEFORE the session ends.
   Enforced: the Stop hook blocks sessions that changed `supabase/migrations/**` without touching
   this file. The loop closes from three directions: module open (blueprint template reads this
   file) → during work (hook) → module close (final-test template marks rows Done).
2. **Partner notification 📣:** a row executed/added/changed whose target module or tables belong
   to the OTHER developer ⇒ the CHANGELOG line is tagged 📣 with their name AND the session's final
   report prints a ready-to-paste Hebrew note to them (what changed, where it meets them, what to
   read). The responsibility is on the session that made the change, not on the reader.
3. **Executed rows** move to a dated strike-list at the bottom of the relevant lane (numbering is
   never reused — like §7). `regin-docs-sync` audits rows against §7 + `schema.sql` on each run.
4. This file never *decides*: a new open question found here goes to §7 (P10) and comes back as a
   citation.

<!-- Done strike-list (dated) -->
- 10/07/2026 — migration `20260710160735` applied: **§7.64 customers surrogate PK** · **A-8** enable-RLS (10 business tables) · **A-13** timestamps+moddatetime (11 tables) · **§7.40(א)** roles/modules UNIQUE · **§7.62** users.role_id NOT NULL · **§7.21** customers 2 policies + marketing bucket + 4 storage policies.
- 10/07/2026 — migration `20260710164420` applied: moddatetime extension moved `public`→`extensions` (advisor `extension_in_public` cleared; 11 triggers intact). Advisors back to baseline accepted set, zero new.
