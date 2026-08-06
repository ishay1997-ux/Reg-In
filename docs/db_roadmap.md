# DB Roadmap — Future Schema Changes (REG-IN)

> **Machine-first (English; Hebrew only as data).** This file is the single consolidated MAP of all
> pending/future database work — it is an **execution aggregator, NOT a decision registry**.
> Open questions live ONLY in `PROJECT_MASTER.md` §7 (iron rule; `docs/CLAUDE.md`). Decided rows
> cite `§7.N`; the single verbatim copy here is the §7.47 mirror (tagged per iron rule 13).
> Log-sourced debt cites `PROJECT_MASTER.md §6` (the single debt registry) / `CLAUDE_CODE_LOG.md §tech-debt`. *(The old `CHANGELOG.md §TODO` home was retired 23/07/2026 — CHANGELOG is now a frozen archive; its §TODO debts moved to §6.)*
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
> ✅ אומת-סנכרון: 15/07/2026 23:25 (regin-docs-sync — אודיט פוסט-בלופרינט-מ3: §7 85 פריטים סונכרן בכל המקומות, 4 חותמות-רפרנס רועננו, 0 קונפליקטים)

---

## 0. Current state pointer (do NOT duplicate DDL here)

### 0.0 🔴 The migrations folder is DOCUMENTATION, not a restore script — RULED §7.86 (31/07/2026)

**Measured live 31/07/2026 (Supabase MCP, `list_migrations` vs the folder):** **21** SQL files on disk
vs **18** rows in `supabase_migrations.schema_migrations`.
- **3 files are not registered at all:** `20260629000000_baseline_schema` (local-only by design, per
  §0 below) · `20260711013517_module2_customer_contacts` · `20260723111005_module3_quotes_structure_and_constraints`.
  ⚠️ The last two **are live in the DB** — they were applied out-of-band during the 23/07 MCP outage.
- **12 more files carry a filename timestamp that differs from the registered version**, because
  `apply_migration` stamps its own UTC version (e.g. round A's `20260731085335` is registered as
  `20260731060107`). This gap **re-opens on every future MCP apply** — it is structural, not drift.

**↳ Re-measured live 01/08/2026 (step 5.3, explicit-definition sweep across a work-manager finding
of 4 different live migration-count numbers — 9/11/8/22 — across this file, the guide, and the
folder itself):** **22** files vs **21** rows now. Same two files still unregistered-but-live
(re-confirmed directly: `customer_contacts` table exists, `quote_services.line_id` column exists);
one file was added since 31/07 and round G's single file registered as 3 rows, so the gap **grew by
exactly the expected amount** — this is the ruled pattern continuing, not a new incident. **The
declared definition adopted this round for "module-3 migration count" specifically** (used in
`module-3.md` and its DoD): **filename-prefix `module3_` on disk = 10** (documentation-folder count,
consistent with this section's own framing that the folder is the record). `round_g_db_hardening`
touches module-3-owned objects (`product_costs`) but is a cross-module hardening pass, not
`module3_`-named — tracked separately, not folded into the 10.

**Consequence:** `supabase db push` would try to re-run already-applied migrations, and the two
unregistered ones are **not idempotent** (`create table` · `drop constraint` · `add constraint`
without `if not exists`) — so it halts on `customer_contacts`. **There is no automatic way to rebuild
this database from zero.**

✅ **Ishay's ruling (31/07/2026, fix-round G): MCP `apply_migration` is the ONLY apply path, and this
folder is a read-record of what was applied — not a restore script.** The trade-off was stated to him
explicitly and accepted: rebuilding a database from scratch would be manual work. The one-time repair
(registering the missing rows + aligning filenames) was **rejected** — the very next MCP apply
re-opens the gap, so the repair only holds if everything moves to the CLI, a process change nobody
planned and which a 19/09-deadline academic project does not justify.
⚠️ **Still in full force, unchanged:** append-only (a committed migration is history; fix forward
only) · the typed-echo gate before every apply · `docs/schema.sql` refreshed after every apply.

### 0.1 Pointers

- Schema SSOT (reads): `docs/schema.sql` (snapshot). Changes SSOT: `supabase/migrations/` (8 files:
  local-only baseline + 7 applied remote migrations, latest `20260707163709_module1_users_rls_initplan_select_wrap`).
  ⚠️ **This file-count line is a 08/07 snapshot and is stale by design** — the authoritative live
  count is in §0.0 above (22/21 as of 01/08). Do not "fix" one without re-measuring both.
- **16 tables**: roles, modules, permissions, users, login_attempts (Module-1 infra, RLS+policies live) ·
  customers, products, price_tiers, params, quotes, quote_services, projects, hostesses,
  salary_reports, assignments, logistics (11 business tables — live RLS **on** with 0 policies =
  intended deny-all; the enable-RLS exists in NO migration → restore-gap, §7.48).
- No triggers, no views, no enums (text+CHECK pattern), no installed extensions beyond platform
  defaults (`pg_cron` available, not installed — §7.42).
- Advisors snapshot (08/07/2026 08:34): **security** — 12× `rls_enabled_no_policy` INFO (by design,
  until per-module policies land) · 5× SECURITY DEFINER WARNs on the 4 Module-1 functions
  (intentional: lockout functions must be anon-callable; documented) · `auth_leaked_password_protection`
  WARN (deferred → M10, PROJECT_MASTER §6 / A-23). **performance** — 8× `unindexed_foreign_keys` INFO (Lane C-1) ·
  3× `multiple_permissive_policies` WARN on users/permissions (triaged & deferred, micro-guide M1 §9).

## 1. Migration Design Checklist — run for EVERY schema change (the "deep thinking" pre-flight)

- [ ] Named migration + Hebrew "why" header; never edit an applied migration — fix-forward only (P15)
- [ ] §7 scan: does this change execute/affect a §7 item or a row in this file? Cite it in the header
- [ ] New/touched table: RLS policies per §7.21 standard template; `(select …)` initplan wrap mandatory
- [ ] FKs: explicit ON DELETE **and** ON UPDATE decision (§7.64 policy) + covering index (C-1) — **this applies to ANY new FK column, including one born from a blueprint / PM-interview ruling mid-module, not only the FKs already enumerated in the C-1 list (that list predates today's rulings; cross-check it, don't assume "not in C-1 ⇒ nothing to do")**
- [ ] Constraints: CHECK / UNIQUE / NOT NULL per this file's §6 per-table index
- [ ] **Every number a screen displays has a named source column or computation** (the C5:833 lesson —
      a displayed figure with no data home is a 🛑 finding, not a shrug)
- [ ] Time columns: `timestamptz` only; Asia/Jerusalem job semantics (§7.56)
- [ ] Money columns: `numeric(12,2)` (§7.74)
- [ ] `created_at`/`updated_at` + `moddatetime` on new tables (§7.73, once nodded)
- [ ] Seed impact? (roles/modules/params exception only — DB protocol) · Storage impact? (§5 lane)
- [ ] 👤 typed-echo gate BEFORE applying (irreversible on the live project — DB protocol, rule 10)
- [ ] After apply: refresh `docs/schema.sql`, commit migration+snapshot **together**
- [ ] Run Supabase advisors (MCP read-only) — zero new findings, or a written triage note
- [ ] Ripple: mark executed rows here + §7.47 + name the affected FUTURE modules in the §10 Done-row and in PROJECT_MASTER §6 (the CHANGELOG was retired 23/07/2026)

## 2. Lane A — Committed / near-certain ("pretty sure we'll change")

### A1. Decided (or nod-pending 👍) — awaiting a named migration

🔗 מראת §7.47 — SSOT: PROJECT_MASTER §7 (לא לערוך כאן ידנית)

| טבלה | עמודות חדשות | מקור-הכרעה | מודול-ביצוע |
|---|---|---|---|
| `hostesses` | `address` (טקסט), `lat`, `lng` (קואורדינטות) | §7.6, §7.14 | 4 |
| `projects` | ~~זמני התחלה/סיום לאירוע~~ ✅ **עמודות-הזמן (`final_start_time`/`final_end_time`) הוקדמו למ3** (הכרעת-ישי 15/07/2026, בלופרינט-מ3: נזרעות מההצעה ב-RPC-ההמרה וניתנות-לעריכה על הפרויקט — ההצעה נעולה §7.50); **נותר למ4: סיווג "קצר/ארוך" בלבד** | §7.29, §7.45, §7.43 (קשור §7.30) | 3 (זמנים) · 4 (סיווג) |
| `projects` | `event_name` + `customer_id` (snapshot-זהות) | §7.76 (היקף הוכרע 15/07/2026) | 3 |
| `projects` | `cancelled_at` (timestamptz), `cancellation_reason` enum(`standard`,`force_majeure`) | §7.16(ב) | 4/8 |
| `assignments` | `invite_token`, `invite_sent_at` (+פקיעה) | §7.45 | 4 |
| `assignments` | `attendance_status`, `lateness_level`, `no_show_reason` | §7.16(א) | 4/8 |
| `quote_services` | `closing_unit_cost` (הקפאת עלות) | §7.28 | 3 |
| `quotes` | `estimated_start_time` + `estimated_end_time` (time); `estimated_hours` נגזר-מההפרש | §7.82/F23 | 3 |
| `params` / `roles` / `modules` / `salary_reports` | אילוצי-ייחודיות | §7.40 | 2/3/8 |
| `hostesses` | `languages text[] not null default '{}'` ⚠️ **(שונה מ-`speaks_english boolean` בהכרעת-ישי 06/08/2026 — *"הגיוני שיהיה שפות"*, כפי שניסח מלכתחילה. עלות-בנייה זהה — רב-בחירה במקום תיבה — וחוסך מיגרציה אם יידרשו רוסית/ערבית. **המיגרציה טרם נכתבה, ולכן השינוי הוא טקסט בלבד.**)** — **שדה-מידע בכרטיס הדיילת בלבד.** 🚫 **אינו תנאי בשער של שכבה 1 ואינו עמודה בטבלת-המאגר** *(הכרעת-ישי 06/08/2026)*: לאירוע אחד יש **תפקידים שונים** — *"אולי סבבה מישהי שתהיה עם המדפסת ולא צריכה את השפה"* — ושער ברמת-האירוע מניח שכל העמדות זהות. **השדה מיידע; המנהלת בוחרת ידנית ממילא (C5:311).** ‏🚧 הצעד הבא אם יידרש: **צ'יפ-הקשר** בכרטיס-המועמדת, לא שער | הכרעת-ישי 06/08/2026 (‏Discovery מ4 · `research §7` פריט 8, שהיה ⚪ "לשאול את ישי") | 4 |
| **טבלה חדשה — אי-זמינות דיילת** | `(hostess_id, מ-תאריך, עד-תאריך, הערה)` — הצהרת חופשה/היעדרות; **תנאי חמישי בשער של שכבה 1** | הכרעת-ישי 05/08/2026 (‏Discovery מ4 · `specs/module_04_hostesses/processes-approved.md` §א3) | 4 |
| `assignments` | `responded_at` (timestamptz) — **אינו קיים ולא תוכנן בשום מקום**; חוסם את זווית-המיון "תענה הכי מהר", **שהיא ברירת-המחדל לאירוע קרוב מ-72 שעות**. ⚠️ **לא לגזור מ-`updated_at`** — טריגר דורס אותו, ומ8 יכתוב `salary_report_id` | ‏`module4_smart_match_research` §11.6#8 + Discovery מ4 | 4 |
| `assignments` | סימון **"אחראית משמרת"** — אחת לכל אירוע; היא איש-הקשר בשטח במייל האישור של האחרות | הכרעת-ישי 05/08/2026 (‏Discovery מ4 · §ב5) | 4 |
| `params` | **שבעה ערכי `smart_match` חדשים** — שלושת המשקלים המעודכנים (0.40 היענות · 0.35 אמינות · 0.25 קרבה) · שער-מרחק 80 · גולפוסט 40 · ריסון m=3 · חלון 12→24 חודשים · מינימום-3-תשובות. 🔴 **ושלוש השורות הקיימות במסד שגויות** (`משקולת_1W_דירוג`=0.4 · `משקולת_2W_קרבה`=0.3 · `משקולת_3W_מהימנות`=0.3) — הן שמות מרכיב (`דירוג`) שההכרעה **הוציאה מהציון**. נמדד חי 05/08/2026 | ‏§7.15↳ + `module4_smart_match_research` §11.1 | 4 |

Additional decided / nod-pending rows (cite-only):

| # | Change | Source | Status | Module | Trigger |
|---|---|---|---|---|---|
| A-8 | enable-RLS migration for the 11 business tables (idempotent; restore-gap — live is fine) | §7.48 | **✅ APPLIED `20260710160735` (SECTION 2), 10/07** | 2 | before first M2 policies (module-2.md step 1.1) |
| A-9 | discount CHECKs: 0–100 + combined ≤100% (customers/quotes) | §7.26 | **✅ APPLIED, both parts** — customers (`customers_discount_range`, M2) + quotes (`20260723111005`, 23/07, M3 — see 23/07 entry below). Re-verified live 01/08/2026 (step 5.3 db_roadmap sweep). | 2/3 | M2 step 1.2 draft exists |
| A-10 | per-table RLS policies from the standard template, `(select …)` wrapped | §7.21 | decided | every module | with each module's first migration; multi-module tables gated on §7.63 |
| A-11 | `pg_cron` install + quote-expiry daily job | §7.42 | **✅ APPLIED `20260723122655` (`module3_pg_cron_expiry_and_cleanup`), 23/07** — `cron.job` confirmed live 01/08/2026: `module3-quote-expiry` at `0 1 * * *`. | 3 | first consumer = quote expiry (T2) |
| A-12 | Seed: products (11) + price_tiers (40) + params (20 rows, #1–20 incl. `שכר_מינימום_שעתי` and 4 new template rows #17–20 added 14/07) | §7.13 + `reference_spec/products_and_params.md` (locked decisions) | **✅ APPLIED `20260723112000`, 23/07** | 3 | blocker removed (VAT=18%); **note (14/07): the A-19 RLS + M3 "prices" screen (§7.84) land alongside this seed, not instead of it — seed still runs first via migration, the screen is for post-seed maintenance only** |
| A-13 | `created_at`/`updated_at` + `moddatetime` trigger, all business tables, one migration | §7.73 | 👍 nod | 2 (rolling) | also anchors T2 validity semantics |
| A-14 | NOT NULL: `users.role_id` · `quotes.customer_id` · `projects.owner_email` · `projects.quote_id` | §7.62 | **⚠️ PARTIALLY APPLIED — verified live 01/08/2026:** `users.role_id` NOT NULL ✅ (M2) · `quotes.customer_id` NOT NULL ✅ (`20260723111005`, 23/07, M3). `projects.owner_email` and `projects.quote_id` are **still nullable** — that part awaits M6 (projects lifecycle isn't built yet; the M3 conversion RPC populates them but the column-level constraint was never M3's to add). Row stays open until M6 closes its part. | 2 / 3 / 6 | users → with A-8 in the M2 infra migration; **`quotes.customer_id`→bigint in M2 (§7.64 type-change; its SET NOT NULL still M3)** |
| A-15 | partial UNIQUE on active assignment statuses (one active row per hostess+project) | §7.54 | 👍 nod | 4 | kills double-count/double-pay class |
| A-16 | timestamptz + Asia/Jerusalem standard for all new time columns & jobs | §7.56 | **✅ nodded (Ishay 15/07, blueprint-M3) — with a reality note: Supabase `cron.timezone`=GMT (fixed); the date-granular expiry job runs at a fixed UTC hour ≈01:00 Israel, which delivers the ruled behavior** | 3+ | first pg_cron job (M3 step 1.5) |
| A-17 | money columns → `numeric(12,2)` | §7.74 | **✅ APPLIED for all M3-owned money columns** (`20260723111005`, 23/07, M3 — see 23/07 entry below). Re-verified live 01/08/2026: `products.base_price` · `price_tiers.special_price` · `quote_services.closing_unit_price`/`closing_unit_cost` · `quotes.applied_customer_discount`/`manual_discount` all `numeric(12,2)`. (`quotes.vat_rate_snapshot` is `numeric(5,2)` — a percentage, not a money column, correctly out of this row's scope.) Money columns outside M3's tables (future modules) are that module's own row. | 3 | with A-9 in the pricing migrations; *(historical note: still not applied as of 14/07 — the A-19 RLS migration deliberately did not touch column types; applied 23/07 in the structure migration instead, see status column)* |
| A-18 | `login_attempts` stale-row purge job (>30d from `last_attempt_at`) | §7.75 | 👍 nod | 3/10 | after A-11 |
| A-19 | RLS: `select` open to all `authenticated` + write CEO-only (module 'הגדרות מערכת') on `params`/`products`/`price_tiers` — write is now real (not deferred) since the M3 "מחירים" tab (§7.84) will write to these | §7.83 | decided | 3 | with the M3 migration; params write reuses the same 2 policies when M9 builds the full params screen. **✅ Migration `20260723113500` APPLIED 23/07 via MCP** (10 policies verified: catalog §7.83 select-all + CEO-write). Ishay's follow-up ("should params be role-editable?") → kept CEO-only for M3; the approved **per-role ownership map is recorded in §7.70** as M9 design input. |
| A-21 | **`params` row `תבנית_מייל_הצעת_מחיר` — sender signature** (`[חתימת_שולח]` replaces the fixed "צוות REG-IN") | Ishay 30/07/2026, after asking to add the project manager's phone/email; my counter-recommendation (sign as the **actual** sender) was accepted | **✅ APPLIED `20260730123321`, 30/07 via MCP** (typed-echo given) | 3 | why: send permission belongs to **both** מנהלת פרויקטים and מנכ"ל (verified live), so fixed contact details would point the customer at someone who doesn't know the quote. **One** placeholder, not three — the code omits an empty phone line, which a text template cannot do. ⚠️ Continues migration 7's deviation from FROZEN C5 §5.8.1. |
| A-20 | **NEW table `email_log`** — generic email send-journal `(entity_type, entity_id, recipient, template_name, subject, status, error_message, sent_by_email, created_at)` + index on `(entity_type, entity_id, created_at desc)` + one §7.21 SELECT policy gated on 'הצעות מחיר'; **no client write policy at all** (only the Edge Function writes, via service-role) | **§6 🚧 מ10 "ישות יומן-שליחות", pulled forward by Ishay's explicit ruling 30/07/2026** | **✅ APPLIED `20260730095439`, 30/07 via MCP** (typed-echo given) | 3 (was 10) | why now: it is the **only** one of the 8 blind-spot findings that client code cannot close — the anti-double-send guards all live in component state and die on a page refresh or a second user. ⚠️ **Deliberately generic** (6 email templates exist in `params`; M4/M8/M11 will send too) ⇒ polymorphic `(entity_type, entity_id)` and therefore **no real FK** — accepted, and correct for a journal: a send is history, and this project never deletes (§7.11). ⚠️ **Beyond the frozen spec** (C6 has no such table). **Forward notice (§10.2): M4/M8/M11 each widen the `entity_type` CHECK by one value and add their own module-gated SELECT policy — do NOT widen this policy to "any authenticated".** |

### A2. Log-registered debt with a decided direction (SSOT: the logs)

| # | Change | Source | Module/Trigger |
|---|---|---|---|
| A-20 | `users.email` ON UPDATE CASCADE + `auth.users`↔`public.users` email sync | `CLAUDE_CODE_LOG.md` §tech-debt | folded into the §7.64 decision; next users-schema touch |
| A-21 | `MODULE_META` Hebrew-string → `module_id`/slug | `PROJECT_MASTER.md` §6 | next `modules` schema touch |
| A-22 | account lockout → Supabase Auth Hook | `PROJECT_MASTER.md` §6 | requires Team plan — parked |
| A-23 | Leaked-Password Protection (Auth setting) | `PROJECT_MASTER.md` §6 | M10 |
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
| §7.78 | financial snapshot as a unit — **converging (RULED 11/07):** VAT snapshot-at-approval (§7.51) · final-profit stored-₪-at-closure, expected derived live (§7.52 two-figure) · cost frozen (§7.28). Frame: price-side freezes at approval, actuals-side at closure; M6/8 ratify | 🔴 | M6/8 (M3 VAT part RULED) |
| §7.68 | salary report as a document: `period` UNIQUE + frozen line snapshots (absorbs §7.46 edge) |  | M8 |
| §7.61 | unified Storage plan: buckets + `storage.objects` policies (private+signed URLs?) |  | direction at M6; first bucket M2 |

**Remaining open schema-bound items:**

| Ref | Question (label) | Decide before |
|---|---|---|
| §7.49 + §7.76 | quote→project conversion RPC — **RULED 11/07 (Ishay): atomic RPC, all-or-nothing; project born-complete incl. identity snapshot; approval stays human-in-loop (no email approve button — deferred M10+)** | M3 (execute) |
| §7.50 + §7.77 | DB-level lock — **§7.50 RULED 11/07 (Ishay): trigger blocks UPDATE/DELETE on approved quotes+quote_services (may share the §7.49 migration)**; §7.77 (project close-lock, column-granular — ties §7.63) still open | M3 (execute §7.50) / 6 |
| §7.53 | ~~hostess-count CHECK >0 → ≥0~~ — **CLOSED 11/07 (Ishay): "אין אירוע בלי דיילות" — CHECK >0 stays, no schema change** | — |
| §7.85 | ✅ **RULED (Ishay 14/07)** — `quote_services` PK = synthetic `line_id bigint generated always as identity`; `quote_id`/`sku`/`color`/`line_number` become regular columns. Per §7.64 policy; single-column downstream refs for §7.67 (M4)/§7.72 (M6). Exec: M3 `quote_services` migration | M3 |
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
| C-1 | 8 FK covering indexes: `permissions.module_id`, `users.role_id`, `quotes.customer_id`, `quote_services.sku`, `projects.owner_email`, `assignments.hostess_id` (⚠️ **was `assignments.id_number` — renamed by §7.64, ruled 31/07/2026; the index goes on the NEW surrogate column**), `assignments.salary_report_id`, `logistics.sku` **+ `projects.customer_id` (new FK added M3 via LOCAL-5, 15/07 — needs the same covering index)** | advisors `unindexed_foreign_keys` (triaged 07/07; **live audit 15/07 confirmed exactly these 8 are unindexed — the list is complete, none outside the registry**) | with each module's first migration touching that table; **M3 migration 1.1 (blueprint 15/07) covers `quotes.customer_id` + `quote_services.sku`/`quote_id` + `projects.customer_id` + `projects.owner_email` + `logistics.sku`** — the last two because M3's conversion RPC is the first writer to `projects`/`logistics` (both empty until now), so M3 is their first-touch. Remaining (`permissions.module_id`, `users.role_id`, `assignments.hostess_id` (⚠️ **was `assignments.id_number` — renamed by §7.64, ruled 31/07/2026; the index goes on the NEW surrogate column**), `assignments.salary_report_id`) → their own modules. Mechanical backstop: **C-4** (zero-new-advisor-findings gate on every migration) catches any brand-new unindexed FK regardless of this list |
| C-6 | index `quotes(quote_status, updated_at)` — serves the daily pg_cron expiry scan (§7.42/§7.82 expiry-from-`updated_at`) and the ⭐"expiring-soon" worklist filter (§7.82) | pre-M3 gap hunt 14/07 (Ishay nod) | with the M3 quotes migrations |
| C-2 | `multiple_permissive_policies` on users/permissions | advisors WARN — deferred (micro-guide M1 §9) | reconsider at M12 |
| C-3 | `(select …)` initplan wrap in every new policy | §7.21 template | always |
| C-4 | advisors run after every applied migration | this file §1 | always |
| C-5 | `docs/schema.sql` snapshot refresh + same-commit rule | DB protocol (root CLAUDE.md) | always |

## 5. Storage & infrastructure lane

| Item | Status | Source | Module |
|---|---|---|---|
| `marketing` bucket (public) + 4 `storage.objects` policies | **✅ APPLIED in migration `20260710160735` (10/07)** | `micro_guides/module-2.md` step 1.1 | 2 |
| `marketing` bucket **server-side limits** (`file_size_limit` 10MB + `allowed_mime_types` PDF/JPG/PNG) — measured live 31/07: both were `null`, i.e. the JS validation was bypassable by a direct REST upload | ⏳ **written, awaiting typed-echo** in `20260731155511_round_g_db_hardening` | audit 31/07 §G | 2 |
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
| login_attempts | purge job (A-18) · Auth Hook upgrade (A-22) · ⚠️ **rate limit added 31/07 (§7.8↳, round G): `register_failed_login` is anon-granted and takes an EMAIL, so anyone with the public anon key could lock any known account repeatedly without a password attempt. Capped at 15 calls/IP/hour via the new `login_rpc_calls` log. REDUCES severity only — the full fix stays A-22** |
| login_rpc_calls | **NEW rate-limit log (§7.8↳, round G, `20260731155511`).** Deliberate checklist deviations, both justified in the migration header: no surrogate PK and no `created_at/updated_at`+moddatetime — it is an append-only log that prunes itself (rows >1h deleted on every call), not a business table. RLS-on with **0 policies + explicit revoke** = deny-all; the only access path is the SECURITY DEFINER function |
| product_costs | **NEW child table (§7.83↳, round G, `20260731155511`) — `products.cost` moved out so the permission can live at TABLE level.** Read = `edit` on 'הצעות מחיר' **or** `edit` on 'כספים' (verified live 31/07: מנכ"ל · מנהלת פרויקטים · מנהלת כספים ולקוחות — and NOT מנהלת גיוס / מנהלת לוגיסטיקה); write = CEO via 'הגדרות מערכת', same gate as `products`. PK covers the FK (C-1 ✓) · `numeric(12,2)` (§7.74) · moddatetime (§7.73). ⚠️ **Three RPCs read it** (`approve_quote_and_create_project` DEFINER · `create_quote` + `replace_quote_lines` INVOKER) and the two INVOKER ones raise a Hebrew `P0001` when a SKU has no cost row — **that message is a contract with `SERVER_MESSAGE_RULES` in `src/lib/quotes.js`** (same trap as the `quotes` row below). ⚠️ **The catalog embed must stay a LEFT join** — an inner join drops disabled products and resurrects the §7.34 0 ₪ bug |
| customers | policies (A-10) · discount CHECK (A-9) · timestamps (A-13) · **surrogate PK — RULED §7.64 (10/07): `customer_id bigint` + `company_number` unique not null; exec M2 step 1.1 (סטיית-C6 §2.4.1)** · email UNIQUE (§7.65) · deactivate guards (§7.34) · **+ child `customer_contacts` — §7.81 (11/07), ריבוי אנשי-קשר אופציה C (איש-קשר ראשי נשאר inline)** |
| customer_contacts | **NEW child table — RULED §7.81 (11/07): ריבוי אנשי-קשר, אופציה C.** FK→`customers(customer_id)` on delete/update cascade + covering index (C-1 ✓) · RLS §7.21 ('לקוחות', same gate as customers) · moddatetime (§7.73). Migration `20260711013517_module2_customer_contacts.sql` — **✅ APPLIED 11/07 (verified live via MCP: table/7-cols/FK/covering-index/trigger[extensions.moddatetime]/RLS/2 policies)**; api/UI wiring = step 3.7; סטיית-C6 §2.4.1 (single inline contact) |
| products | unit/category CHECKs exist; sku stays natural PK + **ON UPDATE CASCADE — RULED §7.64 (10/07)**, exec M3 · seed (A-12) · RLS select-all/write-CEO (A-19, §7.83) · write UI = M3 "מחירים" tab (§7.84) · **31/07 round G: `cost` DROPPED from this table → `product_costs` (§7.83↳); `description` gained `default ''`** (NOT NULL stays — the missing default broke any writer omitting the key) |
| price_tiers | seed (A-12) · sanity CHECKs min_qty>0/max≥min (§7.41 bundle) · RLS select-all/write-CEO (A-19, §7.83) · write UI = M3 "מחירים" tab (§7.84) |
| params | UNIQUE (§7.40) · typed+history (§7.70) · seed (A-12, now 20 rows #1–20) · ghost param (§7.57) · RLS select-all/write-CEO (A-19, §7.83) · write UI for the 2 pricing rows only = M3 "מחירים" tab (§7.84); the other 18 rows still wait for the full M9 params screen |
| quotes | NOT NULL customer_id (A-14) · vat_rate_snapshot (**§7.51 RULED 11/07**) · lock (**§7.50 RULED 11/07**) · conversion RPC atomic + identity snapshot (**§7.49+76 RULED 11/07**) · ~~CHECK ≥0 (§7.53)~~ **closed 11/07 — stays >0** · expiry anchor (A-13/§7.42) · pdf_url drop (§7.71) · discounts CHECK (A-9) · **start/end times + GENERATED estimated_hours w/ +24h wrap (F23+LOCAL-2, blueprint 15/07 — M3 mig 1.1)** · ⚠️ **RAISE-message contract (31/07, fix-round D): the Hebrew RAISE texts in `approve_quote_and_create_project` / `replace_quote_lines` / the lock trigger are string-matched by `quoteServerErrorMessage` (`src/lib/quotes.js`) to show actionable Hebrew on screen — SQLSTATE alone can't distinguish the **9** P0001 sites (measured live 31/07 evening from `pg_get_functiondef`; this line said 11 until then — true for round A that morning, wrong once round G rewrote all three RPCs into `20260731155511`). Any future migration that rewords a RAISE MUST update the prefixes there, or the UI silently falls back to the generic message and no test fails. ⚠️ **Count and file both drift — re-measure, never re-quote**| 
| quote_services | closing_unit_cost (§7.47-mirror) · color/reason enums (§7.41) · change-order model (§7.72) · **line_id surrogate PK (§7.85 RULED 14/07 — M3 mig 1.1)** |
| projects | §7.47-mirror ×2 (times — **הוקדם למ3, LOCAL-1 15/07**; cancelled_at) · NOT NULL owner/quote_id (A-14) · finance-column ownership 🔴 (§7.63) · identity snapshot (**§7.76 RULED 11/07; scope ruled 15/07: event_name+customer_id** — inside the §7.49 RPC, columns in M3 mig 1.1) · close-lock (§7.77) · profit stored (**§7.52 RULED 11/07**: final ₪ stored at closure; expected derived live; % display-derived) · coords (§7.55) · multi-day (§7.30) |
| hostesses | §7.47-mirror (address/coords) · bank-column protection 🔴 (§7.63) · ת"ז → **surrogate — RULED §7.64 (10/07), APPROVED-TO-EXECUTE 31/07/2026 as M4's FIRST migration** (`hostess_id bigint identity` PK; `id_number` → `unique not null` column). **Measured live 31/07: table is EMPTY (0 rows) ⟹ no data migration.** Template to copy: `20260710160735_module2_customers_surrogate_key_rls_and_marketing.sql` (§7.67/54 coord; סטיית-C6) · email UNIQUE (§7.65) · min-wage rule (§7.66) |
| assignments | **PK/FK move to `hostess_id` — §7.64, same M4 migration** (composite PK `(project_id, hostess_id, assignment_number)`; measured live 31/07: **0 rows**) · §7.47-mirror ×2 (token, attendance) · shift lineage 🔴 (§7.67) · partial-unique (A-15) — **now on `(hostess_id, event_date)`** · travel (§7.69) · FK indexes (C-1) |
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
| 15 | Gross profit "computed and saved" vs "derived, not stored" — **resolved 11/07 (§7.52 two-figure ruling): both were right about different numbers (final=stored, expected=derived)** | C5:453 vs C6:279 | §7.52 + §7.78 (snapshot-as-a-unit) |

## 10. Maintenance protocol (how this file stays alive)

1. **Live update, same session (parallel of iron rule 15):** any session that applies a migration,
   discovers a DB gap, or closes a §7 item — updates the matching row here BEFORE the session ends.
   Enforced: the Stop hook blocks sessions that changed `supabase/migrations/**` without touching
   this file. The loop closes from three directions: module open (blueprint template reads this
   file) → during work (hook) → module close (final-test template marks rows Done).
2. **Forward notice:** a row executed/added/changed whose target module or tables belong to a
   FUTURE module ⇒ the §10 Done-row here **and** a PROJECT_MASTER §6 line name those module numbers, so the session that opens that
   module finds the change instead of rediscovering it. The responsibility is on the session that
   made the change, not on the reader. *(Replaced the cross-developer 📣 tag, retired 22/07/2026
   with the move to a single developer.)*
3. **Executed rows** move to a dated strike-list at the bottom of the relevant lane (numbering is
   never reused — like §7). `regin-docs-sync` audits rows against §7 + `schema.sql` on each run.
4. This file never *decides*: a new open question found here goes to §7 (P10) and comes back as a
   citation.

<!-- Done strike-list (dated) -->
- 05/08/2026 — **Module-3 closing audit: the DB side re-verified live, zero writes, zero new DB work.**
  Read directly from the live project rather than from this file: **10 `module3_` migrations** on disk, all
  already struck below · policies **quotes 2 · quote_services 2 · products 2 · price_tiers 2 · params 2 ·
  product_costs 2 · `email_log` 1 (SELECT only — no client write path)** · both lock triggers wired
  `BEFORE DELETE OR UPDATE ... FOR EACH ROW` on **both** tables · **2 `cron.job` rows active**
  (`module3-quote-expiry` 01:00 UTC, `module1-login-attempts-cleanup` 01:30 UTC) · seed **11 / 40 / 20** ·
  `get_advisors(security)` **0 ERROR** (7 INFO are non-M3 deny-all tables; the single M3 WARN is
  `approve_quote_and_create_project` as SECURITY DEFINER, by design, permission-checked internally).
  Row counts read **before and after** a full 78-test E2E run and identical both times — 10 quotes ·
  24 lines · 3 projects · 3 journal rows · 4 customers. **No new deferred DB work was discovered.**
  ⚠️ **One DB *behaviour* that lands on a future module and is easy to miss because nobody triggers it:**
  `module3-quote-expiry` runs daily and flips any `in_progress` quote older than `ימי_תוקף_הצעה` (=**30**)
  to `rejected` + 'פג תוקף'. The E2E suite pins fixtures to live quote ids, so **the job will break those
  specs by itself** — #8 (updated 29/07) around **28/08/2026**, #22 (01/08) around **31/08/2026**, with no
  human action involved. Booked as `🚧 מ4` in `PROJECT_MASTER §6`; recorded here too because the trigger
  is a DB job, and whoever reads only this axis would not find it in the test files.
- 05/08/2026 — **Correction to a note recorded 01/08.** Step 5.3's carry-forward stated that rows
  A-9 / A-11 / A-14 / A-17 lack their own inline "✅ APPLIED" tag. Re-measured directly: **A-9, A-11 and
  A-17 all carry it**; only **A-14** differs, and it deliberately reads `⚠️ PARTIALLY APPLIED`. The gap
  named there no longer exists — closed, not carried forward into module 4.
- 31/07/2026 — migration `20260731155511_round_g_db_hardening.sql` — ✅ **APPLIED via MCP `apply_migration`** (typed-echo: Ishay typed `round_g_db_hardening` in chat, 31/07 ~16:05). ⚠️ **Registered as THREE rows, not one** — `round_g_db_hardening` · `round_g_fix_forward_remaining_cost_readers` · `round_g_fix_forward_approve_rpc_cost_source`: the MCP connector timed out twice on the full payload (state verified untouched after each), the payload was re-sent compacted, and **the compaction accidentally dropped two function bodies while `drop column cost` did run** — leaving `approve_quote_and_create_project` and `replace_quote_lines` referencing a dead column for a few minutes (quote approval + edit-save broken). Caught immediately, fixed forward in two migrations, all three re-read from `pg_get_functiondef` afterwards. **The lesson, recorded so it is not re-learned: shrinking a payload is an edit and needs a re-read against the source.** Full account in the migration file header. **Source:** whole-codebase audit 31/07 §G (`docs/audit_2026-07-31_fix_plan.md`); items (1) and (2) were ruled in round C and carried forward verbatim when C's prompt was deleted. **Four fixes, one migration** (one typed-echo instead of four): **(1) §7.8↳ rate limit** — new `login_rpc_calls (ip, called_at)` + `register_failed_login` capped at 15 calls/IP/hour. Body = the LIVE `pg_get_functiondef` with the limit block prepended; business logic (5 failures → 15-min lock) byte-unchanged. IP from `request.headers→x-forwarded-for` (first element); **null IP ⇒ skip the limit, never block** (only happens on direct DB access, where blocking would turn an infra hiccup into a full login outage). Generic Hebrew message on purpose — telling an attacker he hit a rate limit lets him calibrate. ⚠️ `LoginPage.jsx` deliberately untouched: its three RPC calls discard `error` (documented fail-open, `src/CLAUDE.md`), so a blocked caller sees "מייל או סיסמה שגויים" — factually true and leaks nothing. **(2) §7.83↳ cost split** — `product_costs` + narrow RLS, values COPIED (11 rows, no nulls, verified live) before `alter table products drop column cost`. **Pre-verified live: `products_cost_check` involves only `cost`, so it drops with the column — no CASCADE needed.** Three RPCs re-created from their LIVE definitions; ⚠️ `approve_quote_and_create_project` is rebuilt from the **20260731085335** body so round A's VAT guard survives — rebuilding from the older `20260723115000` file would have silently reverted it. `create_quote`/`replace_quote_lines` stay SECURITY INVOKER (safe: every role that can write quotes is in the cost-read group) and gain an explicit Hebrew `P0001` naming the **item name** when a SKU has no cost row, instead of a raw 23502 on the NOT NULL `closing_unit_cost`. **(3)** `marketing` bucket limits (twins of `MARKETING_MAX_BYTES`/`MARKETING_ALLOWED_MIME` in `02_customers/api.js`). **(4)** `products.description` `set default ''`. **Gap proven BEFORE the fix, not assumed:** a live REST probe signed in as all five roles — **all five**, including מנהלת גיוס and מנהלת לוגיסטיקה (fully blocked on 'הצעות מחיר'), read `products.cost` (`[{"sku":"06ST","cost":500.00},…]`).
  **✅ POST-APPLY VERIFICATION — quoted, not paraphrased.** *(1) All three RPCs re-read from `pg_get_functiondef`: each contains `product_costs`, none contains `pr.cost`; approve is still `SECURITY DEFINER` **and still carries round A's VAT guard** (the check that would have caught a silent revert). *(2) Data: 11 products / 11 cost rows, `products.cost` column gone, `description` default `''::text`, bucket = 10485760 + the 3 MIME types, `product_costs` 2 policies, `login_rpc_calls` 0 policies (deny-all, intended). *(3) **Embed shape measured, not assumed** — PostgREST returns an **object or null**, not an array (one-to-one via the PK/FK); an array would have made every cost `null` with no error. *(4) **Both directions, live:** מנהלת פרויקטים reads `product_costs` and the profitability panel renders; מנהלת גיוס gets **`[]`** from `product_costs`, gets no `cost` key anywhere in `products?select=*`, and **still receives all 11 products** with `product_costs: null` — proving the embed stayed LEFT and §7.34 is intact. Locked by the new spec `e2e/cost-visibility.spec.js` (3 tests). *(5) **Rate limit proven by failure-return, with ZERO permanent rows:** one `DO` block set `request.headers` transaction-locally, called the RPC 16×, and rolled itself back with a deliberate `raise`. Result: *"הקריאה הראשונה שנחסמה: 16 | ההודעה: לא ניתן להשלים את הפעולה כרגע… | אחרי איפוס היומן: עברה ✅"* — i.e. 15 pass, the 16th is blocked by the generic message, and **removing the log rows removes the block**, which is what proves the log is the cause. Residue afterwards: 0 (the single `login_rpc_calls` row present is real E2E traffic from 10 minutes earlier, and self-prunes after an hour). *(6) Advisors: the only new finding is `rls_enabled_no_policy` on `login_rpc_calls` — **by design**, identical to `login_attempts`; `product_costs` does not appear. *(7) Gate exit 0 · 366 unit (+6) · E2E 36/36 + 3 new. **Note for future E2E work:** a full suite run makes exactly ONE failed login, so 15/IP/hour allows 15 full runs per hour — the tests cannot rate-limit themselves. **Reversibility:** (1) replace the function again · (2) re-add the column and back-fill from `product_costs` (values copied, not moved) · (3)+(4) inverse UPDATE/ALTER. **Forward notice (§10.2):** **M8** (`כספים`) is already in the `product_costs` read group by design (§7.79 gross-profit) — it does **not** need a policy change; **M9**'s full params screen inherits nothing here; **M4/M5** are unaffected (they never read cost).
- 31/07/2026 — migration `20260731085335_module3_vat_and_expiry_param_guards.sql` **✅ APPLIED via MCP `apply_migration`** (typed-echo: Ishay typed the migration name in chat, 31/07 ~09:10). **Source:** whole-codebase audit 31/07 finding A (`docs/audit_2026-07-31_fix_plan.md`). **What it hardens — one failure family, two params, three sites** (the third, `quotePdf.jsx`, is client-side and already landed): a `params` row deleted / renamed / saved blank becomes NULL and both SQL readers cast it without a guard. (1) `approve_quote_and_create_project` read `אחוז_מעמ` via `param_value::numeric` with **no NULL check**, writing NULL into `quotes.vat_rate_snapshot` (nullable, no CHECK) — an approved quote **and the project born from it** frozen with an unknown VAT rate, no error raised. Now the value is read as **text** and validated (missing / blank / non-numeric / outside 0–100) **before any write**, raising Hebrew `P0001` — so a failed approval creates no project. Read as text on purpose: `''::numeric` raises an English cast error instead of our message. (2) Two CHECKs added — `quotes_approved_requires_vat` (approved ⇒ snapshot not null) and `quotes_vat_snapshot_range` (0–100). **Pre-verified live before writing the file: 0 violating rows** (8 quotes; only #10 approved, 18.00). `ADD CONSTRAINT` validates without UPDATE, so the `quotes` lock trigger is not involved — the usual trap on this table. (3) `module3-quote-expiry` compared `updated_at < now() - (NULL * interval)` = NULL = never true ⇒ **no quote ever expired and the job reported `UPDATE 0` as success every night**. Re-scheduled under the **same job name** (`cron.schedule` upserts by name), same `'0 1 * * *'`, same business logic, body wrapped in a `DO` block that raises Hebrew `P0001` on a missing/non-integer param. **Ishay's ruling 31/07:** fail loudly rather than fall back to an invented 30 days — a number nobody configured is exactly what the money engine exists to prevent; and because `cron.job_run_details` is a place nobody opens, the same condition also raises a **visible banner on the quotes screen** (`missingPricingParamsMessage`, `src/lib/quotes.js`). ⚠️ **The function body is copied byte-for-byte from migration `20260723115000`, including `security definer set search_path = ''`** — the project already has a whole migration born from that line's absence (`20260702195258_harden_current_user_role_id.sql`); baseline captured pre-apply (`pg_get_functiondef` md5 `7063ce14…`, both markers present) for a post-apply diff. **Reversibility: full** — re-create the migration-4 body, drop the two constraints, re-schedule the previous one-statement job. No data rows are read, written, or deleted. **✅ POST-APPLY VERIFICATION — all done, quoted not paraphrased:** `pg_get_functiondef` re-read after apply ⇒ `SECURITY DEFINER` **true** · `SET search_path TO ''` **true** · VAT guard present (Ishay demanded this comparison explicitly, and the project has a whole migration born from that line's absence). `cron.job` = **exactly 2 rows**, `1:module3-quote-expiry:0 1 * * *:true | 2:module1-login-attempts-cleanup:30 1 * * *:true` — the jobid was **preserved**, so `cron.schedule` upserted rather than duplicating (a third row would have meant the old unguarded job still firing nightly). Both CHECKs present on `quotes`. **Two failure-injections, each self-rolled-back by a deliberate final `raise`:** ⚠️ *the entry condition mattered* — the RPC checks permission → status → past event date → hostess lines **before** reaching the VAT guard, so a control run had to prove the quote gets that far, otherwise a failure from an older gate would masquerade as the new guard working. Control (quote #6, param intact, impersonating an edit-permission user via `request.jwt.claims`): *"עבר את ארבעת השערים ויצר פרויקט 5"*. Injection (quote #7, `אחוז_מעמ` renamed): *"שיעור המע\"מ אינו מוגדר בהגדרות המערכת (פרמטר אחוז_מעמ) — לא ניתן לאשר הצעה"* — **the VAT message specifically, not a generic error**, and projects inside the transaction stayed at 2 (1 pre-existing + 1 from the control, **none** from the injection). Cron job: the real `command` string was read out of `cron.job` and `execute`d — control *"רצה בלי שגיאה"*, injection *"פרמטר ימי_תוקף_הצעה חסר או אינו מספר שלם — עבודת תפוגת ההצעות לא בוצעה"*. **DB verified byte-identical afterwards:** 8 quotes at the same statuses, 1 project (the pre-existing 29/07 one for quote #10), 20 params, `אחוז_מעמ`=18, `ימי_תוקף_הצעה`=30, zero leftover `%PROOF%` rows. `docs/schema.sql` patched surgically in the same session (the two CHECKs, the RPC note, and the cron command at ~`:600` replaced with the live guarded body). **Forward notice (§10.2):** M6 consumes the projects created by this RPC — the guard means an approval that fails now leaves **no** half-born project.

- 30/07/2026 — migration `20260730123321_module3_quote_email_sender_signature.sql` applied via **MCP** (typed-echo given). **A-21** executed: the quote-email body now ends with `[חתימת_שולח]` instead of a fixed "צוות REG-IN", so the mail is signed by **whoever actually sent it**. **Why:** send permission on 'הצעות מחיר' belongs to **both** מנהלת פרויקטים and מנכ"ל (verified live the same session), so fixed contact details would send the customer to someone who does not know the quote. **Design note worth not re-deriving:** ONE placeholder, not three (name/phone/email) — the code (`buildSenderSignature`, `src/lib/quotes.js`) assembles it from the logged-in user and **omits an empty phone line**; 2 of 3 CEO users have no phone in the DB, and "טלפון:" with nothing after it is worse than no phone line, which a text template cannot express. Data-only, no DDL, no advisor impact, `docs/schema.sql` unchanged (row data, per this file's convention). ⚠️ **Continues migration 7's deliberate deviation from FROZEN C5 §5.8.1** — the frozen file is untouched; only the seeded `params` value differs, recorded in `micro_guides/module-3.md` §9. **Verified live:** the delivered mail body contains `ישי אטיאס | מנכ"ל, REG-IN` + `טלפון: …` + `מייל: …` inside the RTL wrapper, with the PDF attached. Reversible (migration 7 holds the previous wording).

- 30/07/2026 — migration `20260730095439_module3_email_log.sql` applied via **MCP `apply_migration`** (typed-echo given by Ishay in chat). **A-20** executed: new table `email_log` — the first source of truth for "was this already sent". **Why it exists:** the anti-double-send guards built in `QuoteDocumentDialog` all live in component state and therefore die on a page refresh or a second user; this was the only one of the session's 8 blind-spot findings that client code cannot close. **Pulled forward from M10** (§6 🚧 מ10 "ישות יומן-שליחות") on Ishay's explicit ruling. **Design decisions worth not re-deriving:** generic `(entity_type, entity_id)` rather than a per-module table (6 email templates already live in `params`; M4/M8/M11 will send too) ⇒ **no real FK**, accepted because a send is history and this project never deletes (§7.11); `status` is `sent`/`failed` **with no `unknown`** — a timeout is handled in the UI and deliberately never written, since a journal containing "maybe" stops answering the question it exists for; **zero write policy** — only the Edge Function writes (service-role), because a journal the browser can write to is not evidence. **Verified live:** 10 columns · `relrowsecurity = true` · exactly 1 policy · 2 indexes (PK + `(entity_type, entity_id, created_at desc)`) · both CHECK definitions read back byte-correct. **Advisors: zero new findings** — `email_log` does **not** appear in `rls_enabled_no_policy` (the 6 that do are all future-module tables), and the remaining WARNs are the pre-existing accepted set (M1 lockout fns, the intentionally-gated approve RPC, leaked-password = M10). `docs/schema.sql` patched surgically in the same session (module-3 delta block, same method as migration 6). **Forward notice (§10.2): M4 / M8 / M11 each widen the `entity_type` CHECK by one value and add their OWN module-gated SELECT policy — do not widen this one to "any authenticated".**

- 10/07/2026 — migration `20260710160735` applied: **§7.64 customers surrogate PK** · **A-8** enable-RLS (10 business tables) · **A-13** timestamps+moddatetime (11 tables) · **§7.40(א)** roles/modules UNIQUE · **§7.62** users.role_id NOT NULL · **§7.21** customers 2 policies + marketing bucket + 4 storage policies.
- 10/07/2026 — migration `20260710164420` applied: moddatetime extension moved `public`→`extensions` (advisor `extension_in_public` cleared; 11 triggers intact). Advisors back to baseline accepted set, zero new.
- 11/07/2026 — migration `20260711013517_module2_customer_contacts.sql` applied: **§7.81** child table `customer_contacts` (FK cascade + covering index [C-1 ✓ for this FK] + `extensions.moddatetime` + RLS §7.21 'לקוחות' 2 policies). Closing-audit note (11/07 22:33): advisors show `multiple_permissive_policies` on customers/customer_contacts — inherent to the §7.21 two-policy template (same as M1's users/permissions baseline), accepted; `quotes_customer_id_fkey` still unindexed — already scheduled as C-1 (M3's first migration touching `quotes`).
- 23/07/2026 — migration `20260723111005_module3_quotes_structure_and_constraints.sql` applied (manual apply by Ishay via Studio SQL Editor — **Supabase MCP returned permission-denied this session**, so the DB-protocol browser/CLI fallback was used; live-verified post-apply via a read-only battery Ishay ran). Executed rows: **§7.85** (`quote_services` synthetic `line_id` PK, composite PK dropped) · **§7.28** (`quote_services.closing_unit_cost`) · **§7.41** (color CHECK + `price_tiers` min>0/max≥min CHECKs) · **§7.64** (`quote_services.sku`/`price_tiers.sku`/`logistics.sku` FKs → +ON UPDATE CASCADE) · **§7.74 / A-17** (money cols → `numeric(12,2)` on products/price_tiers/quotes/quote_services) · **§7.51** (`quotes.vat_rate_snapshot`) · **§7.82 F2/F3/F16** (`rejection_reason` 7-value CHECK + `rejection_notes` + rejected⇔reason) · **§7.82 F23 + LOCAL-2** (`quotes.estimated_start_time`/`estimated_end_time` + `estimated_hours` GENERATED wrap-around) · **§7.62 / A-14 (quotes part)** (`quotes.customer_id` SET NOT NULL) · **§7.26 / A-9 (quotes part)** (discount CHECKs 0–100 each + combined ≤100) · **§7.40ב** (`params` UNIQUE(param_name)) · **§7.76 + LOCAL-5** (`projects.event_name` + `projects.customer_id` FK) · **LOCAL-1** (`projects.final_start_time`/`final_end_time`) · **F13** (`products.unit` CHECK) · **C-1** (covering indexes: `quotes.customer_id`, `quote_services.sku`, `quote_services.quote_id`, `projects.customer_id`, `projects.owner_email`, `logistics.sku`) · **C-6** (`quotes(quote_status, updated_at)`). **Forward notice (§10.2):** the new `projects` columns (event_name/customer_id/final_start_time/final_end_time) are consumed by **M6** (projects lifecycle/UI) and the customer-card (M3 itself); the `logistics.sku` CASCADE + index land on a table whose UI is **M5**. Remaining unindexed FKs (`permissions.module_id`, `users.role_id`, `assignments.hostess_id` (⚠️ **was `assignments.id_number` — renamed by §7.64, ruled 31/07/2026; the index goes on the NEW surrogate column**), `assignments.salary_report_id`) → their own modules (C-1). Advisors run (MCP restored mid-session 23/07): the 6 M3-touched `unindexed_foreign_keys` findings **cleared** (only the 4 future-module ones remain — assignments×2, permissions.module_id, users.role_id); **+7 `unused_index` INFO** on the new indexes = benign empty-table artifact (clears once M3 runtime queries hit these FKs; **keep** — required by C-1), **0 new WARN**. Migration 1 was applied out-of-band (manual, during the MCP outage) so it is NOT in `supabase_migrations.schema_migrations` — same applied-but-untracked state as `customer_contacts` (11/07); the repo migration files + live DB are the record (that tracking table is already non-authoritative here: its versions diverge from repo filenames, and the baseline is local-only per §0). `schema.sql` snapshot updated same session (module-3 delta block appended).
- 23/07/2026 — migration `20260723112000_module3_seed_products_tiers_params.sql` applied via **MCP `apply_migration`** (MCP restored mid-session; typed-echo: Ishay typed the migration name). **A-12** executed: 11 products · 40 price_tiers (NO service tiers — decision #3; top-tier `max_qty` NULL — #6) · 20 params (composition per doc #11: raw #1–20 **minus** #4 `יום_הפקת_דוח_שכר`/§7.57 **plus** `שכר_מינימום_שעתי`=35; corrected names `משקולת_3W_מהימנות`+`מייל_משרד_רואי_חשבון`; weights **0.4/0.3/0.3**; real survey URL; email bodies verbatim from C5 §5.8). Verified live: 11/40/20, 0 service tiers, 8 top-tier NULLs, 04ST base=500.00, B-REG-TAG@201=5.00, B-FAB-LAN@201=6.00, REG-TAG@201=2.50, אחוז_מעמ=18, יחס=50. Pure-data migration → **no advisor impact** (schema unchanged). Recorded in `schema_migrations` (unlike mig 1, which was manual/untracked). The 20 param names' byte-equality vs `PRICING_PARAM_NAMES` is verified at step 2.1 (pricing.js). `schema.sql` unchanged (data-only seed — the snapshot documents DDL, not row data, per this file's convention).
- 23/07/2026 — migration `20260723113500_module3_rls_quotes_and_catalog.sql` applied via **MCP `apply_migration`** (typed-echo: Ishay typed the name). **A-10 (quotes/quote_services part) + A-19 (§7.83 catalog)** executed: 10 RLS policies — quotes 2 + quote_services 2 (§7.21, module 'הצעות מחיר', select edit|view / write edit, initplan-wrapped) + products/price_tiers/params 2 each (§7.83: `select using(true)` to authenticated + write CEO via 'הגדרות מערכת'). Verified: `pg_policies` shows exactly 2 per table (10 total, names correct); security advisors — the 5 tables **cleared** from `rls_enabled_no_policy` (down to 6, all future-module); expected `multiple_permissive_policies` WARNs on the 5 (inherent to the §7.21 two-policy template — accepted, same as customers/M1), no other new finding. Full impersonation matrix (positive control with a seeded test quote) = step 1.6. `schema.sql` unchanged (policies are documented in the module-3 delta block already appended with mig 1's structure — see note; the delta block will get the policy DDL at the Phase-1 gate snapshot). **Ishay follow-up:** approved a per-role param-ownership map → recorded in **§7.70** as M9 design input; §7.83 stays CEO-only for M3.
- 23/07/2026 — migration `20260723115000_module3_lock_and_conversion_rpc.sql` applied via **MCP**. **§7.50/F5** lock trigger `enforce_quote_in_progress_lock` (on quotes+quote_services — blocks UPDATE/DELETE unless the quote is in_progress) + **§7.49/76/28/51/32/53 + LOCAL-1/5** conversion RPC `approve_quote_and_create_project` (SECURITY DEFINER, internal edit-check on 'הצעות מחיר'; freeze cost→flip+freeze VAT→project born-complete [identity snapshot, dates/times, owner=caller, required_hostess=Σ hostess-qty]→logistics from non-hostess lines; double-click safe via FOR UPDATE + status re-check + projects.quote_id UNIQUE) + **F17** `create_quote`/`replace_quote_lines` (SECURITY INVOKER, atomic header+lines). Verified live (rolled-back test txns): happy path (project+logistics born complete, VAT=18.00, cost frozen 500.00, required=2, status not_started), double-click→friendly error, UPDATE-on-approved→lock error, view-role approve→permission error, failed-approve→quote stays in_progress + 0 orphan projects. **This RPC is the FIRST writer to `projects`+`logistics`** (their UI = M6/M5). Advisors: the approve RPC is (intentionally) authenticated-executable SECURITY DEFINER — gated by the internal permission check, accepted like M1's lockout functions; the trigger fn `enforce_quote_in_progress_lock` got the default public EXECUTE → 2 findings, **non-exploitable** (a trigger function errors if called directly) → **hardened by a `revoke execute` folded into migration 5**. schema.sql RPC/trigger DDL sync at the step-1.7 phase-gate snapshot.
- 29/07/2026 — migration `20260729191557_module3_add_rejection_reason_opened_by_mistake.sql` applied via **MCP** (typed-echo given by Ishay in chat). **Widens `quotes_rejection_reason_check` from 7 values to 8**, adding `'נפתחה בטעות'` — an explicit correction of Ishay's own **§7.82/F2** ruling of 12/07 ("exactly 7"), written back to `PROJECT_MASTER §7.82` the same session. Rationale: the system has no delete anywhere, so a mistakenly-opened quote could only be *rejected*, permanently depressing the approval rate. The **exclusion from the approval-rate denominator lives in code** (`NON_LOSS_REJECTION_REASONS`, `src/lib/quotes.js`) and not in the DB — the DB does not compute metrics. Verified live via `pg_get_constraintdef` (8 values present) and end-to-end on the management screen: two mistake-quotes appear in the נדחו breakdown yet the rate stayed **25% (1 of 4)**. Reversible while no row uses the new value. `docs/schema.sql` patched surgically to match byte-for-byte (a full Snapshot regeneration is due at the Phase-3 gate).
  ⚠️ **Finding worth keeping, discovered while trying to delete two test quotes: a quote row cannot be deleted at all.** The lock trigger (§7.50) also guards `quote_services`; on a cascading DELETE the parent row is already gone, so the trigger's status lookup returns NULL and it raises `P0001` ("נמצא: unknown"). Any future delete-quote feature must drop or exempt that trigger first — and this is exactly why the 8th rejection reason, rather than deletion, was the correct answer.
- 30/07/2026 — migration `20260730085144_module3_quote_email_wording_deviation_5_8_1.sql` applied via **MCP `apply_migration`** (typed-echo: Ishay typed the migration name in chat). **Data-only** — one `params` row (`תבנית_מייל_הצעת_מחיר`), no DDL, no schema/RLS/advisor impact, `docs/schema.sql` unchanged (the snapshot documents DDL, not row data — same convention as the seed migration `20260723112000`). **What changed:** the phrase "והתנעת הפרויקט" was **removed** from the email body — "לאישור ההצעה, אנא השב למייל זה…". **Why:** Ishay read the actual outgoing mail during step 3.4 and flagged the wording; at send time nothing is yet "מותנע" — only the quote awaits approval, and the project-start is *our* action, not something the customer initiates. Consistent with the `src/CLAUDE.md` wording pass (say the thing itself, no imported internal jargon). ⚠️ **This is a deliberate deviation from the FROZEN spec C5 §5.8.1**, whose body was seeded verbatim — the frozen file is untouched; only the seeded `params` value now differs, recorded in `docs/micro_guides/module-3.md` §9. **Reversibility:** full (a further UPDATE restores the previous text; the pre-change wording is preserved verbatim in C5 §5.8.1 and in migration `20260723112000`). **Verified live:** `param_value like '%התנעת%'` = **false**, length 243. **Forward notice (§10.2):** this same template row is the one **M10** will consume for real server-side sending (🚧 מ10 ← מ3 in `PROJECT_MASTER §6`) — M10 must read it from `params`, not re-derive it from C5.
- 23/07/2026 — migration `20260723120500_module3_pg_cron_expiry_and_cleanup.sql` applied via **MCP**. **A-11** pg_cron install (schema `pg_catalog`, per Supabase docs — M3 is the first pg_cron consumer) + daily **quote-expiry** job `module3-quote-expiry` (**§7.42/§7.56**: in_progress older than `ימי_תוקף_הצעה` days → rejected+'פג תוקף'; runs as postgres, fires the lock trigger [OLD=in_progress→allowed], F16 satisfied; date-granular @ `0 1 * * *` UTC) + **A-18** login cleanup `module1-login-attempts-cleanup` (**§7.75**: >30 days @ `30 1 * * *`) + the **advisor-hygiene revoke** on `enforce_quote_in_progress_lock` (clears the 2 migration-4 findings). **A-16 (§7.56 GMT/fixed-hour standard)** satisfied for the first pg_cron job. Verified live: `cron.job` = 2 active jobs; rolled-back logic test (backdated in_progress quote → rejected+'פג תוקף'; stale login_attempts row deleted); advisors — the `enforce_quote_in_progress_lock` findings are gone, no new (remaining DEFINER WARNs = M1 lockout fns + the intentionally-gated approve RPC; 6 tables still `rls_enabled_no_policy` for future modules; leaked-password = M10). **✅ Phase 1 DB COMPLETE (5/5).** schema.sql full sync (policies + RPCs + trigger + cron DDL → module-3 delta block) happens at step 1.7.
