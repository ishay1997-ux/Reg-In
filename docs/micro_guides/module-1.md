# REG-IN — Micro-Guide | Module 1: Users & Permissions (as-built)

> **Audience:** a future Claude Code session with zero memory. Humans (Ishay) only approve and decide.
> **Format:** this file is the pilot of the machine-first micro-guide format (9 sections, per `.claude/skills/module-blueprint/template.md`). Module 1 was built before this format existed, so it is recorded here **as-built** — it doubles as the format exemplar for modules 2–12.
> **Language rule:** guide in English; Hebrew appears only as data (DB values, UI strings). Chat reports to Ishay — always Hebrew.

---

## 1. 🟢 Live Status Header

| Field | Value |
|---|---|
| Module | 1 — Users & Permissions (משתמשים והרשאות) |
| Owner | Ishay |
| Branch | `ishay/module-1-permissions` |
| **Status** | **✅ Closed & Merged to `dev`** (PR [#2](https://github.com/ishay1997-ux/Reg-In/pull/2), merge commit `3ba5c5f`, 08/07/2026 18:35 — quality-gate + gitleaks green) |
| Last updated | 29/07/2026 10:08 (cross-module file addition from M3 — see §9 dated entry). Prior: 12/07/2026 02:40 (format-alignment pass, fresh-context audit: `🚧 מN` tokens in the capabilities table, 5.4-handoff marked superseded — M2 built by Ishay, §7.21 already instantiated; DoD anon-EXECUTE wording fixed to match §4; §8 synced to template item (h)). Prior: 08/07/2026 18:52 regin-docs-sync merge-flip; 08/07/2026 17:55 re-run closing audit (DoD re-walked, RLS re-verified live, advisors clean, `verify` green, E2E 8/8). |
| Active step | — (module closed & merged; 5.4 handoff superseded 12/07/2026 — see step table) |

| Phase / step | Status |
|---|---|
| Phase 1 — DB & RLS (steps 1.1–1.4) | ✅ done |
| Phase 2 — Business logic & helpers (2.1–2.2) | ✅ done |
| Phase 3 — UI (3.1–3.5) | ✅ done |
| Phase 4 — Control & integration (4.1–4.2) | ✅ done |
| Phase 5 — QA & handoff: 5.1 test infra | ✅ done |
| Phase 5: 5.2 core RLS scenarios (5–12) | ✅ done (verified live 02/07) |
| Phase 5: 5.2b extended matrix on `customers` | ✅ CLOSED in Module 2 — step 1.3 ran the 14-scenario RLS matrix on `customers` (deferred here 02/07 per Ishay's ruling; discharged 10/07 when M2 wrote the §7.21 policies). Backward write-back per M2 step 5.3 (11/07/2026). |
| Phase 5: 5.3 PR + merge to `dev` | ✅ done (PR #2, merge commit `3ba5c5f`, 08/07/2026 18:35) |
| Phase 5: 5.4 handoff message to Amit (RLS template ready) | ✅ superseded (12/07/2026) — M2 was built by Ishay and instantiated the §7.21 template on `customers` directly (module-2.md steps 1.1/1.3); the planned message became moot. Amit's handoff happens at his actual onboarding entry point. |

## 2. 📦 Context Packet for Claude

**Purpose (3 lines):** CEO opens users and sets a permissions matrix (edit/view/blocked) per role × module — without a programmer. Every other module checks permissions against this module (RLS + UI gates). It is the security foundation of the whole system.

**Capabilities delivered vs deferred** *(backfilled 07/07/2026 per current template — sources: section 9 here + PROJECT_MASTER §6)*:

| Capability | What M1 delivers | Which module completes it | Tracked where |
|---|---|---|---|
| RLS authorization | `current_user_role_id()` (hardened) + §7.21 policy template + 7 policies on the 4 core tables | ✅ discharged by M2 (step 1.3 — the **14-scenario** RLS matrix on `customers`; §7.21 instantiated 10/07/2026; backward write-back 11/07) | PROJECT_MASTER §6 · section 9 here |
| Login & lockout | Email+password, Google Sign-In, 5-failures→15-min lockout (app+DB level) | Auth-Hook–level enforcement — future (needs paid Supabase tier) | Section 4 "accepted limitations" |
| User self-service | Own name/phone edit + real password change (re-auth → `updateUser`) | Self email-change → M9 (M9's own scope — no §6 token); self-service password *reset* (forgot-password) → 🚧 מ10 | Section 9 · PROJECT_MASTER §6 |
| Admin screens | Users CRUD + permissions matrix (7 business modules, 4 groups) | `params` UI → M9 (M9's own scope); admin-modules exposure in matrix → future | Section 9 |
| Navigation shell | Sidebar/Topbar/ProtectedRoute/AuthContext (all modules ride on this) | Topbar global search → M9 (M9's own scope) | Section 9 |
| Test coverage | Vitest 16 + Playwright 8 (Chromium only, workers=1) + CI | Cross-browser+mobile → before M5; formal UAT + full-system E2E → 🚧 מ12 (Ishay ruling 07/07 — aligned with `architecture_and_qa_roadmap.md`) | Section 6 · PROJECT_MASTER §6 |
| Notification preferences | Profile-screen email/SMS toggles delivered **deliberately disabled** (no preferences table yet — `ProfileSettingsPage.jsx`) | Preferences table + UI activation → 🚧 מ9; actual notification sending → 🚧 מ10 (Ishay ruling 07/07) | Section 9 · PROJECT_MASTER §6 |

**Rule:** every `🚧 מN` token above must have a byte-matching `🚧 מN` line in PROJECT_MASTER §6 — the only registry module-N's opening prompt greps (`grep '🚧 מN'`); Stop-hook enforced (iron rule 15). *(Tokens backfilled 12/07/2026 — format alignment to the current template; the matching §6 lines already existed.)*

**Code map (all verified on disk 06/07/2026):**

| Path | Role |
|---|---|
| `src/contexts/AuthContext.jsx` | Single source of truth: session → `users` row → `{user, permissions}`. Central auth gate — session without an active `users` row → `signOut()` + `authError` (covers Google OAuth returns too). Exposes `useAuth()`. |
| `src/modules/01_auth/LoginPage.jsx` | Email/password + real Google Sign-In (`signInWithOAuth`) + account lockout (5 failures → 15 min, via RPCs). |
| `src/modules/01_auth/SystemManagementPage.jsx` | Tab container for the system screens. |
| `src/modules/01_auth/UsersManagementPage.jsx` | CEO-only CRUD: add/edit (name/phone/role), bidirectional active/inactive status (soft delete — no "delete" framing), self-lockout prevention. |
| `src/modules/01_auth/PermissionsMatrixPage.jsx` | 7 business modules in 4 groups × 5 roles; CEO column locked; auto-save per click; stable `data-testid="perm-cell-{moduleId}-{roleId}"`. |
| `src/components/layout/` — `MainLayout.jsx`, `Sidebar.jsx`, `Topbar.jsx`, `ProtectedRoute.jsx` | Session guard + inactive block; RTL collapsible sidebar fed dynamically from `modules` table (`blocked` hidden); profile/logout; route-level permission guard (`allow` = modules/roles). |
| `src/components/ErrorBoundary.jsx` | Wraps the whole route tree in `App.jsx` — render crash ≠ silent white screen. |
| `src/components/ProfileSettingsPage.jsx` | All users, own data: details / security (real password change via re-auth + `updateUser`) / notifications (disabled, "coming soon"). |
| `src/lib/constants.js` | `CEO_ROLE_NAME`, `SYSTEM_MODULES` — canonical Hebrew name strings, prevents typo-drift. |
| `src/lib/permissions.js` + `src/lib/validators.js` | `isAllowed(user, modules)` extracted for testability; form validators. Unit-tested. |
| `src/supabaseClient.js` | Import as `@/supabaseClient` (NOT `@/lib/`). Session persistence = `sessionStorage` (tab close = logout; refresh survives). |

**DB (live-verified 06/07/2026 via Supabase MCP, project `yfeovxppnfoafmfbdfvh`):**
- Core tables + row counts: `roles`=5, `modules`=9, `permissions`=45 (5×9), `users` (email PK, status active/inactive), `login_attempts`.
- 7 policies on the 4 core tables (see section 4). 11 business tables: RLS-on with zero policies (deliberate deny-all) until each module adds its own.
- Migrations (`supabase/migrations/`, chronological): `20260629000000_baseline_schema` · `20260702112703_users_status_soft_delete` (frozen→inactive) · `20260702143254_module1_users_update_self` + `20260702143405_..._fix_recursion` · `20260702195258_harden_current_user_role_id` (search_path='', the load-bearing function for ALL future RLS — see §7.21) · `20260703071534_module1_login_attempts_lockout` (3 SECURITY DEFINER RPCs) · `20260703071740_module1_reset_login_attempts_revoke_anon` · `20260707163709_module1_users_rls_initplan_select_wrap` (initplan lint fix — `(select …)` wrap on the 2 flagged `users` policies; behavior-identical).

**Spec & mockups:** `PROJECT_MASTER.md` §3 (default matrix seed), §5.1, §6; mockups under `docs/mockups/` (login, users, permissions screens). Design language: §4 (teal `#14B8A6`, bg `#F8FAFC`, right sidebar) — approved and binding.

**Test infra (real, current):** Vitest — 16 unit tests (`src/lib/validators.test.js`, `src/lib/permissions.test.js`, `src/components/layout/ProtectedRoute.test.jsx`) via `npm run test:run`; Playwright — 8 E2E (`e2e/auth.spec.js`, `e2e/permissions.spec.js`) via `npm run test:e2e` (needs `E2E_CEO_*`/`E2E_STAFF_*` in `.env.local`; Chromium only, workers=1 — shared test DB); quality gate `npm run verify` (lint+format:check+test+build); CI `.github/workflows/ci.yml` (lint+test+build+gitleaks on PR); Husky pre-commit.
*(This supersedes the old appendix that claimed "no test runner / manual E2E only" — that was true on 03/07, obsolete since the 04–06/07 hardening.)*

## 3. 🧭 Decisions Ledger

| Item | Ruling | Who | Date | Unblocked |
|---|---|---|---|---|
| §7.2 | `phone` added to `users`; no `username` (email = identifier) | Ishay | 02/07 | Users screen |
| §7.5 | Matrix grouped into 4 super-groups (per mockup), not flat | Ishay | 02/07 | Matrix screen |
| §7.8 | CAPTCHA cancelled (deviation from frozen 5.6.1) → Google Sign-In + account lockout | Ishay | 03/07 | Login |
| §7.10 | `modules` = 9 rows; dashboard is NOT an RBAC module — always accessible | Ishay | 01/07 | Seed, matrix |
| §7.21 | RLS = role→module matrix ONLY, no row-level ownership; standard policy template written in PROJECT_MASTER §7.21 | Ishay | 06/07 | Module 2+ RLS |
| §7.24 | Test-user passwords exposed in old git history will NOT be rotated — accepted, documented risk (academic project) | Ishay | 06/07 | PR (gitleaks handling) |
| §7.8↳ | Accept the account-lockout DoS trade-off (email-keyed + anon-callable `register_failed_login` → anyone can lock a victim by submitting its email 5×). No IP-combined mitigation now — 15-min auto-expiry + Google-Sign-In bypass bound the risk; internal/academic system | Ishay | 07/07 | Advisor triage / M1 security posture |
| local | Session in `sessionStorage` (shared-computer safety) | Ishay | 03/07 | supabaseClient |
| local | "System management" access is permission-driven (`SYSTEM_MODULES`), not hardcoded role check | Ishay | 03/07 | Sidebar/routes |
| local | Soft delete = bidirectional active/inactive toggle; inactive rows shown dimmed, not hidden | Ishay | 02/07 | Users screen; pattern binding for M2/M4 |

## 4. 🛡️ Security & Auth Model Statement

- **Helper function (load-bearing for ALL future RLS):** `current_user_role_id()` — SECURITY DEFINER, `search_path=''`, returns `role_id` only for `status='active'`, EXECUTE for `authenticated` only. Every future policy goes through it (§7.21 template).
- **Policies (7, live-verified):** `roles_select_all`, `modules_select_all`, `permissions_select_all` (read open to authenticated); `permissions_write_ceo_only`, `users_write_ceo_only` (ALL, CEO only); `users_select_self_or_ceo`; `users_update_self` (self-update of phone/full_name only — `role_id`/`status` escalation rejected, verified live).
- **Login lockout:** `login_attempts` + `check_login_lock`/`register_failed_login`/`reset_login_attempts` (SECURITY DEFINER, `search_path=''`). EXECUTE grants are **deliberate and asymmetric**: `check_login_lock` + `register_failed_login` keep **`anon`** EXECUTE — they run *pre-auth*, during the login attempt; only `reset_login_attempts` is `authenticated`-only and self-scoped (`delete … where email = auth.email()` — caller resets its own counter). 5 failures → 15 min. Google OAuth bypasses the lockout by design (password-only counter) — safe demo path. *(⚠️ earlier wording here said "anon EXECUTE revoked" — that is true only for `reset_login_attempts`; corrected 07/07 during advisor triage.)*
- **OAuth gate:** a Google account without an active `users` row is signed out immediately in `AuthContext` with a visible error.
- **Accepted limitations (documented, deliberate):** lockout enforced at app/DB level, bypassable via direct API calls (robust Auth Hook needs a paid Supabase tier — internal closed system, acceptable); old test-user passwords remain in git history (§7.24 — no rotation, academic project); no audit trail (§7.23, deferred by design).
- **Advisor acceptances (triaged 07/07/2026 after a `regin-health-pulse` run — these are the "expected & accepted" advisor findings so a future pulse does not re-raise them as alarms):**
  - Security advisors **0028/0029** — `SECURITY DEFINER` functions executable by `anon`/`authenticated` (`check_login_lock`, `register_failed_login`, `current_user_role_id`, `reset_login_attempts`): **accepted, by design.** All four are `search_path=''`-hardened and correctly scoped — the `anon` grants on the two lockout probes are *required* (pre-auth), and `reset_login_attempts`/`current_user_role_id` only ever touch the caller's own row.
  - **Account-lockout DoS** (direct consequence of §7.8): email-keyed lockout + anon-callable `register_failed_login` lets anyone lock a victim's account by submitting its email 5×. **Accepted** — see Decisions Ledger (§7.8↳, Ishay 07/07). Blast radius bounded by the 15-min auto-expiry + Google-Sign-In bypass; IP-combined lockout deferred (§9 backlog).
  - **Leaked-password protection** (advisor `auth_leaked_password_protection`, WARN) — **blocked-by-plan, not ignored:** enabling the HaveIBeenPwned check requires Supabase Pro (server rejected the toggle on the current plan, 07/07). Revisit if/when the project upgrades — it is a one-click dashboard toggle, zero code.
  - ~~`auth_rls_initplan`~~ — **FIXED 07/07/2026** (Ishay's ruling: option ב, pre-merge migration): `20260707163709_module1_users_rls_initplan_select_wrap` wraps the `auth.email()`/`current_user_role_id()` calls in the 2 flagged `users` policies in `(select …)`. Verified: advisors clean of initplan, pg_policies shows wrapped exprs, impersonation smoke (staff sees self-only, CEO sees all, escalation → 42501), verify + E2E 8/8 green. §7.21 template + Module-2 blueprint updated in lockstep.
  - Remaining performance advisors (`unindexed_foreign_keys` INFO; `multiple_permissive_policies` WARN on `users`/`permissions`) — **deferred as tech-debt (§9)**; irrelevant at current scale. `multiple_permissive` deliberately NOT restructured: merging the self/CEO UPDATE policies means conditional WITH CHECK logic on an audited security surface — risk without real gain.

### 🚨 Emergency playbook — unlock during a demo
Paste in Supabase SQL Editor:
```sql
-- unlock one account / everyone / inspect:
delete from public.login_attempts where email = '<email>';
delete from public.login_attempts;
select email, failed_count, locked_until from public.login_attempts;
```
Lockout also auto-expires after 15 min, and Google Sign-In bypasses it entirely.

## 5. 🏗️ Phase & Step Plan (as-built record)

> Original build predates this format; steps below are the as-built summary: what was planned → what was actually built → where → how verified. The original Hebrew step-by-step recipe (with full SQL) lives in git history of this file (pre-06/07 version).

**Model & effort per phase** *(backfilled 07/07/2026, as-built — what was actually appropriate; binding pattern for modules 2–12)*:

| Phase | Model | Effort | Why |
|---|---|---|---|
| 1 — DB & RLS | Opus | High | Security foundation; `current_user_role_id()` is load-bearing for ALL future RLS |
| 2 — Business logic & helpers | Sonnet | Medium | Mechanical extraction to `src/lib/` + unit tests |
| 3 — UI | Sonnet | Medium | Screens from approved mockups; no new business decisions |
| 4 — Control & integration | Opus | High | Security regression (impersonation, escalation, direct-URL) |
| 5 — QA & handoff | Opus | High | Closing audit, E2E diagnosis, gitleaks/history review |

**Phase 1 — DB & RLS ✅**
- **1.1 Seed:** roles=5, modules=9 (per §7.10), permissions=45 seeded per PROJECT_MASTER §3 matrix. Verified: `select count(*)` → 5/9/45 (live, 06/07).
- **1.2 Auth pairing:** CEO test user exists in both Supabase Auth and `users`.
- **1.3 Helper function:** `current_user_role_id()` created, later hardened (migration `20260702195258`). Verified: active user → role_id; inactive → NULL.
- **1.4 RLS on 4 core tables:** 7 policies (section 4). ↳ as-built: `users_update_self` added beyond the original plan (+ recursion fix migration). Verified: smoke tests + impersonation transactions (`request.jwt.claims` + rollback).

**Phase 2 — Business logic & helpers ✅**
- **2.1 `src/lib/`:** `isAllowed()` extracted to `permissions.js`; `validators.js`; `constants.js` (`CEO_ROLE_NAME`, `SYSTEM_MODULES`). ↳ as-built: extraction happened during the hardening sprint, driven by testability (iron rule 14 was codified later — this module is its precedent).
- **2.2 Unit tests:** 16 Vitest tests across 3 files. Verified: `npm run test:run` green.

**Phase 3 — UI ✅**
- **3.1 Login:** shadcn/ui, local validation, Hebrew errors, Google button, lockout UX. ↳ as-built: CAPTCHA from spec 5.6.1 cancelled (§7.8); `frozen` wording → `inactive`.
- **3.2 Routing shell:** react-router-dom v7 + `MainLayout`/`Sidebar`/`Topbar`/`ProtectedRoute`/`AuthContext` — new infra all future modules ride on.
- **3.3 Users management:** CRUD + bidirectional status + edit dialog + self-lockout prevention. ↳ as-built: replaced one-way "freeze" with active/inactive toggle; `phone` column added (§7.2).
- **3.4 Permissions matrix:** dynamic from `modules` table (no hardcoded list), 4 groups, CEO column locked, auto-save. ↳ as-built: system modules (2) not displayed in matrix — their access is permission-driven in code.
- **3.5 Profile settings:** details + real password change (re-auth → `updateUser`) + disabled notification toggles.

**Phase 4 — Control & integration ✅**
- **4.1 Regression gate:** RLS smoke tests re-run after UI build; `inactive` wall verified at both frontend (LoginPage/MainLayout) and RLS level; direct-URL blocking verified across 3 roles.
- **4.2 Code review closure:** all P0/P1 of `docs/code_review_2026-07.md` fixed 06/07 (engines, `.env.example`, ErrorBoundary, `lang="he" dir="rtl"`, load-bearing migration comment, 2 new E2E). P2 routed: #8 → next `modules`-schema touch; #9 → Module 3; #10 → closed via §7.24.

**Phase 5 — QA & handoff**
- **5.1 Test infra ✅:** Vitest+Playwright+CI as in section 2. `npm run verify` + `npm run test:e2e` (8/8) green (06/07).
- **5.2 Core RLS scenarios 5–12 ✅** (verified live 02/07): non-CEO `update permissions` → 0 rows; CEO → succeeds; non-CEO sees only self in `users`; CEO sees all; inactive login blocked; inactive filtered in UI; self-update escalation rejected.
- **5.2b ✅ CLOSED in Module 2 (backward write-back, M2 step 5.3, 11/07/2026):** the `customers` scenarios (deny-all here until M2's policies) were discharged by **Module 2 step 1.3** — the 14-scenario RLS matrix on `customers` (12 SQL-verified PASS + scenarios 11–12 covered live by these M1 E2E specs; §7.21 template instantiated with `module_name='לקוחות'`). See `docs/micro_guides/module-2.md` step 1.3. The forward-only `🚧 מN` mechanism doesn't cover a debt repaid backward, hence this explicit mark.
- **5.3 ✅ PR & merge (👤 Ishay):** PR [#2](https://github.com/ishay1997-ux/Reg-In/pull/2) opened base:`dev` ← compare:`ishay/module-1-permissions` → CI green (quality-gate + gitleaks — one gitleaks 403 permission fix needed first, `32d55bd`, not a leak finding) → merged (merge commit `3ba5c5f`, 08/07/2026 18:35; Amit not yet at review stage — noted in CHANGELOG). A small follow-up docs-only PR [#3](https://github.com/ishay1997-ux/Reg-In/pull/3) then flipped STATUS/CHANGELOG/LOG to reflect the merge.
- **5.4 ✅ superseded (12/07/2026):** the planned "tell Amit the §7.21 template awaits Module 2" became moot — M2 was built by Ishay (branch `ishay/module-2-customers`, merged PR #6) and instantiated the template on `customers` itself. Amit's handoff happens at his actual onboarding entry point.

## 6. 📊 QA Matrix

*(As-run column = audit evidence, not impressions — refreshed 07/07/2026 after the slow-network E2E hardening session.)*

| Test type | Planned | As-run (closing audit — evidence) |
|---|---|---|
| Unit | validators, permissions, ProtectedRoute | ✅ 16/16 Vitest green — `npm run test:run`, re-verified at closing audit 06/07 and again in the 07/07 verify run |
| Integration | login→Supabase→users/permissions fetch | ⚠️ not automated — covered manually: live login→fetch verified in the 03/07 UI/UX pass and the 06/07 audit; automation deliberately not scheduled (E2E covers the same path end-to-end) |
| E2E | auth flows + matrix editing + self-lockout | ✅ 8/8 Playwright green — `npm run test:e2e`, re-verified 08/07/2026 re-audit + the matrix-write test run 3× cold = 3/3 green. **08/07 hardening:** that test was flaky (1/3 cold-fail) — a StrictMode double-`loadData` race clobbered the optimistic title; fixed test-only (`waitForLoadState('networkidle')` before the click + deterministic next-title assert). Earlier 07/07 slow-network fix (`clickCellAndAwaitWrite` awaits the PATCH before reload) retained. See §9. |
| Regression | guards/RLS/inactive wall after every change | ✅ RLS smoke re-run post-UI (step 4.1, 02/07) + full E2E re-runs at audit (06–07/07) |
| UAT | Ishay manual passes | ⚠️ informal passes by Ishay only (03–06/07); formal UAT = Module 12 / milestone M5 "הגשה" (tracked in section 2 capabilities table + PROJECT_MASTER §6) |
| Security/Pen | impersonation RLS tests, lockout, escalation, direct-URL | ✅ impersonation transactions (`request.jwt.claims` + rollback), escalation rejection, direct-URL blocks across 3 roles — live-verified 02/07, re-checked 06/07 via Supabase MCP |
| Performance/Load | none | ❌ N/A at this stage (no scale data; revisit ~M3) |
| Usability (UI/UX) | full RTL pass, 3 roles, all screens | ✅ done 03/07 — 2 findings found and fixed same day |
| Compatibility | Chromium only | ⚠️ Chromium-only by config (workers=1, shared test DB); cross-browser+mobile before M5 — tracked in section 2 capabilities table |

## 7. ✅ Definition of Done

- [x] Seed counts: `roles`=5, `modules`=9, `permissions`=45 (live-verified 06/07 — MCP + Ishay's Table Editor check).
- [x] RLS active and enforcing on 4 core tables; `inactive` blocked at DB level, not only frontend.
- [x] `current_user_role_id()` hardened; lockout RPC trio deployed; anon EXECUTE revoked on `reset_login_attempts` only — the 2 pre-auth probes keep `anon` by design (§4; wording fixed 12/07/2026 to match the 07/07 §4 correction).
- [x] Users screen end-to-end (bidirectional status, edit, self-lockout prevention).
- [x] Permissions matrix (4 groups, CEO column locked, auto-save) — persists across refresh.
- [x] Role simulation: 3 roles see exactly what their permissions dictate; direct-URL blocked.
- [x] CAPTCHA deviation documented (§7.8); frozen spec untouched.
- [x] All migrations applied + `docs/schema.sql` snapshot current + committed together.
- [x] `npm run verify` green; `npm run test:e2e` 8/8 green (re-verified at both closing audits — 06/07/2026 and the 08/07/2026 re-run; the matrix-write flake was fixed test-only in the re-run, §9).
- [x] Closing audit: gitleaks scan of full history (39 commits) — no leaks found; CI secret-scan expected green with no `.gitleaksignore` needed (§7.24 fallback documented if CI disagrees).
- [x] Code review P0/P1 closed (`docs/code_review_2026-07.md`).
- [x] CHANGELOG + CLAUDE_CODE_LOG + STATUS current.
- [ ] Fresh `dev` checkout: `npm install && npm run dev` → Google login works, CEO reaches the matrix. **Not yet performed by any session — no evidence found; flagged, not checked off.**
- [x] ~~Handoff message to Amit (§7.21 template ready for Module 2)~~ — superseded 12/07/2026: M2 built by Ishay, §7.21 already instantiated on `customers` (see step 5.4).

**Post-merge (template rule 7 — not an audit-time checkbox):** ✅ PR #2 opened, CI green, merged to `dev` — merge commit `3ba5c5f`, 08/07/2026 18:35.

## 8. 🔄 Self-Update Protocol

*(Dormant for this module — kept as the canonical example for modules 2–12.)*
1. At every step transition, update section 1 (status header + step table) **in the same session, before moving on**.
2. Any deviation from plan → inline "↳ as-built" note on the step + a dated line in section 9.
3. The repo's Stop hook (`.claude/hooks/check-docs-updated.sh`) blocks session end if code under `src/modules/NN_*/` changed but the module's micro-guide didn't — keep this file current as you work, not as an afterthought.
4. The `CLAUDE.md` end-of-session protocol applies on top (CHANGELOG → CLAUDE_CODE_LOG → STATUS).
5. On entering a new phase: collect every Ledger question anchored to it and present them to Ishay for batch ruling (P13 style) **before** the phase's first step — template item (h). *(Backfilled 12/07/2026 — exemplar alignment.)*
6. Template items (e)–(g) map to `CLAUDE.md` iron rules 13/15/16 + the end-of-session protocol — they bind here too.

## 9. 📝 Deviations & Tech-Debt Log

- 🔧 **12/08/2026 — a one-line accessibility fix landed here from module 4's closing audit** *(cross-module; the module itself stays closed)*. `PricesManagementPage.jsx`'s product-status `SelectTrigger` had **no `aria-label`**, so its accessible name came only from the rendered `<SelectValue />` — and until that value paints, the button is nameless. `axe` reported `button-name` on **11 nodes = the 11 products**. 🔬 **Why it took two attempts to diagnose:** it **passes when its spec runs alone** and fails under the parallel full suite, which reads exactly like a timing race — and the first fix (widening `waitForReady` in `e2e/accessibility.spec.js` to `networkidle` + `h1`) **did not cure it**. That refutation is what proved it is a real missing name rather than a scan that arrives too early. **The neighbouring button in the same row already carried an `aria-label`; this one was the outlier.** ⚠️ **Do not "clean up" this attribute** — without it the gate goes red again, intermittently, in a way that reads as flakiness. *(Ishay ruled the fix at module 4's close, §6b floor rule.)*

- 31/07/2026 09:30 — 🟡 **OPEN FLAKE (not fixed, not caused by the change that found it):**
  `e2e/permissions.spec.js` → *"CEO משנה תא במטריצה … והשינוי נשמר אחרי רענון"* failed **once** in a
  full-suite run during M3's audit fix-round A, then passed in isolation and on a full re-run
  (3 consecutive greens after). Symptom: after `clickCellAndAwaitWrite`, the cell's `title` was
  observed stuck at `אין גישה` for the whole 10 s retry window instead of the next value in
  `TITLE_CYCLE` — i.e. the cell sat **two** cycle steps away from the computed expectation.
  **Not a data problem:** `permissions` was re-read from the DB right after the failure and
  `מנהלת לוגיסטיקה × פרויקטים` was at its baseline `edit`, so the test's restore-clicks were not the
  cause and nothing was left dirty. **Not caused by the fix round:** it shares no code path with any
  file that round touched (verified by re-running the spec alone and the suite twice).
  **Suspected class — the same one the spec already documents:** `PermissionsMatrixPage` updates
  `permMap` optimistically and `loadData` overwrites the whole map when it resolves; a `loadData`
  landing after a click reverts the optimistic value. An earlier instance of exactly this was
  "fixed" on 08/07/2026 by awaiting `networkidle` before the click — **that mitigation is evidently
  not sufficient**, since StrictMode's second effect run is not guaranteed to be inside that window.
  ⚠️ **Note this is a dev-only amplifier** (StrictMode double-invoke), but the underlying shape —
  a refetch clobbering an in-flight optimistic write — is real in production too if any future code
  refetches on focus/interval.
  **Not attempted here on purpose:** it is outside fix-round A, it did not reproduce in two real
  attempts, and the project rule is to stop after two rather than thrash. **Direction when picked up:**
  assert on the value **after a reload** (the DB is the truth) instead of on the optimistic title, or
  make `loadData` merge rather than replace while a write is in flight. Related but NOT covering it:
  `docs/audit_2026-07-31_fix_plan.md` §F (permission testing layers) — F is about *where* permissions
  are asserted, not about this race; if F is done first, this line still stands.
- 12/07/2026 02:40 — **Format-alignment pass (no code/DB; fresh-context agent audit + fixes):** capabilities table gained literal `🚧 מN` tokens + the §6 byte-match Rule (was prose "→ M9/M10/M12"); RLS row marked ✅ discharged-by-M2 and "12-scenario"→"14-scenario"; 5.4-handoff marked ✅ superseded (M2 built by Ishay — §7.21 instantiated on `customers`; the planned Amit message became moot); DoD anon-EXECUTE line fixed to match §4's 07/07 correction; PR checkbox converted to a Post-merge note (template rule 7); §8 gained items 5–6 (phase-entry sweep (h) + (e)–(g) rule citations); backlog wording softened (only notifications carries §6 tokens). Guide format now matches module-2.md + the current template.
- 03/07 — CAPTCHA (spec 5.6.1) cancelled → Google Sign-In + lockout (§7.8). Frozen spec untouched.
- 02/07 — `frozen` → `inactive`; one-way freeze → bidirectional toggle (binding pattern for M2 `customers.status`, M4 `hostesses.status`).
- 02/07 — Matrix: 4 super-groups per mockup (§7.5); seed values from spec §3, not mockup (§7.4 note).
- 04–06/07 — E2E/Vitest/CI pulled forward from Module 12 (deliberate — security-critical surface first).
- 06/07 — §7.24: test-user passwords in git history stay — accepted risk, no rotation; gitleaks findings (if any) handled via `.gitleaksignore`.
- 07/07/2026 10:47 — template-conformance backfill ahead of the closing-prompt re-run: added the capabilities-delivered-vs-deferred table (section 2), the model-&-effort-per-phase table (section 5), and replaced QA-matrix as-run impressions with audit evidence (section 6). No code or status change — documentation alignment only.
- 11/07/2026 11:53 — **`UsersManagementPage` adopted the shared `ConfirmDialog`** (deactivate-user confirm: `window.confirm` → `await confirm({…})`). Cross-module UI-consistency change made from the M2 branch (`ishay/module-2-customers`) — Ishay's decision to standardize confirmations system-wide; the shared component lives at `src/components/ConfirmDialog.jsx` (built in M2, see `module-2.md` §9 11:53). No behavior change (same message/flow), no M1 test change (auth/permissions specs don't exercise user-deactivation). This M1 edit rides in the M2 PR — flag at the M2 closing audit so the diff's M1 file is expected, not a surprise.
- 11/07/2026 12:17 — **`UsersManagementPage` also adopted the shared `useToast`** (deactivate/activate failure: `window.alert` → `toast.error`). Same system-wide UI-consistency pass (shared `src/components/ToastProvider.jsx`, built in M2 — see `module-2.md` §9 12:17); rides in the M2 PR. No behavior change, no M1 test change.
- 11/07/2026 16:21 — **`UsersManagementPage` load-error "נסה שוב" (retry button).** Part of the M2-branch UX/a11y hardening round (Ishay audit — `module-2.md` §9 16:21, plan `dazzling-hugging-quill.md`): the full-screen `loadError` state offered no recovery but a browser refresh; added a "נסה שוב" button that re-runs `loadUsersAndRoles`, in a `role="alert"` container. Cross-module edit from `ishay/module-2-customers` (M1 is Ishay's too); no change to the success path, no M1 test change (auth/permissions specs don't hit the load-error branch). Rides in the M2 PR — expected M1 file in the diff, flag at the M2 closing audit.
- 07/07/2026 16:37 — **Post-closure DB touch (Ishay-approved plan, option ב):** migration `20260707163709_module1_users_rls_initplan_select_wrap` applied via MCP — `(select …)` wrap on the 2 initplan-flagged `users` policies. Behavior-identical (re-verified: impersonation smoke + escalation block + verify + E2E 8/8). Bonus: fixed a pre-existing `docs/schema.sql` drift (stale pre-hardening `current_user_role_id()` body at ~:190). §7.21 template + module-2.md draft SQL wrapped in lockstep. Module status unchanged (🔒 closed, awaiting PR/merge).
- 07/07/2026 16:09 — `regin-health-pulse` follow-up (doc-only, no code/DB): patch-bumped 3 deps (`@supabase/supabase-js` 2.110.1, `radix-ui` 1.6.2, `vitest` 4.1.10 — lint clean, 16/16 Vitest green). Triaged the Supabase advisors into §4 "Advisor acceptances" (SECURITY DEFINER 0028/0029 accepted; account-lockout DoS accepted per §3 §7.8↳; leaked-password blocked-by-plan; perf WARNs deferred). Corrected a §4 inaccuracy: prior wording implied `anon` EXECUTE was fully revoked on the lockout trio — in fact 2 of 3 keep `anon` by design.
- 08/07/2026 17:55 — **Re-run closing audit (verdict YES again) + E2E flake fix.** Ran the full audit against this guide's DoD: DoD re-walked (counts `roles`=5/`modules`=9/`permissions`=45 live; users grew to 7 — the 2 real CEO users added 07/07); RLS re-verified live via MCP (all `users`/`permissions` policies `(select …)`-wrapped, CEO-only writes, `users_update_self` escalation-block intact, `schema.sql` in sync — no drift); advisors clean of NEW findings (12× `rls_enabled_no_policy` INFO + 5 SECURITY-DEFINER WARN + leaked-password WARN + 8 FK-index INFO + 3 `multiple_permissive` WARN — all previously triaged/accepted). **Flake found & fixed (Ishay-approved, test-only):** `e2e/permissions.spec.js` matrix-write test failed 1/3 on cold runs — a StrictMode double-`loadData` (dev runs the effect twice) resolving *after* the click clobbered the optimistic title with the stale DB value. Fix: `await page.waitForLoadState('networkidle')` before the click (both loadData calls settle first) + a deterministic next-title assertion (`TITLE_CYCLE`) replacing the fragile `not.toHaveAttribute(before)`. Product code unchanged (identical to the 07/07 8/8-green commit `6460fc4`); CI unaffected (CI runs Vitest+build, not E2E). Re-verified: `verify` green, full suite 8/8, the fixed test 3/3 cold. Shared test-DB left net-zero (3 cold-fails × 1 click + 2 passes × 3 clicks = whole cycles; cell back to seed `blocked`). **Migration-version note (no action):** this guide cites the initplan migration as `20260707163709` (local filename, local time); `list_migrations` records it as `20260707133754` (Supabase stores the version in UTC — 13:37Z = 16:37 Asia/Jerusalem). Same migration; not a drift.
- Deferred backlog (target): ~~12 RLS scenarios on `customers` (M2)~~ ✅ discharged (M2 step 1.3, 14-scenario matrix) · self email-change, Topbar search, `params` UI (M9 — M9's own scope; no §6 token) · **notification-preferences table + toggle activation (🚧 מ9), actual sending (🚧 מ10)** — the notifications line is the one registered in PROJECT_MASTER §6 (07/07 open-items audit; wording corrected 12/07/2026 — the M9-scope items were never §6-registered) · lockout via Auth Hook (needs paid tier) · **IP-combined lockout to bound the §7.8 email-keyed DoS** · **leaked-password protection — blocked-by-plan (Supabase Pro)** · FK covering indexes + `multiple_permissive_policies` restructure (perf advisors — accepted/deferred, see §4) · admin modules exposure in matrix (future) · router-level ErrorBoundary (future) · `MODULE_META` stable key — P2#8 (next `modules` schema touch). *(initplan fix — done 07/07, removed from backlog.)*
- 25/07/2026 — **Dedup pass (`npm run dup` flagged a 15-line clone): `UsersManagementPage` + `PermissionsMatrixPage` adopted the new shared `src/components/LoadingOrError.jsx`** (extracted alongside the identical clone in M2's `CustomersPage` — see `module-2.md` §9 25/07/2026). `UsersManagementPage`'s loading/error/retry gate → `<LoadingOrError loading />` / `<LoadingOrError error={loadError} onRetry={loadUsersAndRoles} retryTestId="users-load-retry" />` (behavior-identical, same `data-testid`). `PermissionsMatrixPage`'s loading/error gate (no retry button — a variant jscpd didn't flag, spotted manually) → `<LoadingOrError loading />` / `<LoadingOrError error={loadError} />` (component renders the minimal no-retry form when `onRetry` is omitted). No state/logic change. Verified: `npm run dup` → 0 clones (was 1); lint clean on changed files; `e2e/auth.spec.js` + `e2e/permissions.spec.js` 6/6 passed post-change.

- 28/07/2026 — **Module gotchas file added: `src/modules/01_auth/CLAUDE.md`** (context-architecture overhaul). A short Hebrew file that loads automatically ONLY when a session touches this module's directory — REG-IN's living code map: it sits next to the code so it cannot drift far, and costs nothing until needed. It carries only the non-obvious traps (silent-failure paths, coupled edits, deliberate deviations that look like bugs, the module's RLS surface, E2E contract strings) — never a tour of the code. האזהרה המרכזית שם: המודול קודם למוסכמת `api.js` ומעולם לא הוסב (6 קבצים פונים ל-supabase ישירות) — חריגה היסטורית, לא תבנית לחיקוי. Sourced from a verified read-only review of all 45 files under `src/` (28/07). `module-close` §4c now makes writing/refreshing this file binding for every module.

- 29/07/2026 00:32 — **Open-findings session (Ishay-approved triage): 3 stale comments fixed + the RLS write-guard closed.** Cross-module edits made from `ishay/module-3-quotes-build`; M1 is closed+merged, so this is an expected M1 file in a future diff. **(a) Three comments asserted the opposite of the code** and were corrected to what the code does (never the reverse): `SystemManagementPage.jsx:1` and `UsersManagementPage.jsx:2` both claimed `ProtectedRoute allow={CEO_ROLE_NAME}` — verified against `App.jsx:55`, it is `allow={SYSTEM_MODULES}` (permission-driven; CEO-only is a seed fact, not a code fact); `PermissionsMatrixPage.jsx:3-5` justified filtering the two system modules out of the grid by claiming access to them is hardcoded per-`roleName` in Sidebar/ProtectedRoute — verified false (`Sidebar.jsx:56` + `constants.js:5-8` are permission-driven). The corrected comment states the real consequence the old one hid: **because access is permission-driven, this filter is precisely what prevents delegating system access from the UI** (granting it needs a direct DB UPDATE) — and points at the registered debt "admin modules exposure in matrix" in this file's backlog. **(b) `PermissionsMatrixPage.handleCellClick` adopted the `.select()`+row-count RLS guard** (pattern: `02_customers/api.js:97-104`) — an RLS-blocked write returns `{data: [], error: null}`, so the optimistic cell update used to stand as if saved. Failure condition widened from `error` to `error || 0 rows`; rollback + message were already there. Note: 0 rows also covers "no permissions row for the role/module pair" — the seed is full (45 = 5×9) so it cannot happen today, and if it ever did the user now sees "השינוי לא נשמר" instead of a silent lie. **Verified:** `npm run lint` 0 errors · `npm run verify` green (51 Vitest tests, build ok) · `npm run test:e2e` 10 passed / 2 skipped — the 2 skips are the optional `E2E_FINANCE_*`/`E2E_LOGISTICS_*` role variants (not configured; CEO/STAFF cover those tiers) and are unrelated to this change. `permissions.spec.js` 3/3 green, including the cell-write + reload + restore test that exercises the new guard end-to-end.

- 29/07/2026 10:08 — **New file `src/modules/01_auth/pricesApi.js` added, from M3's branch.** Not an edit to any M1 file — a brand-new API-layer file for M3's "מחירים" (prices) tab, placed under `01_auth/` by a design decision that this is a system-settings screen (parallel to `SystemManagementPage.jsx`), not a quotes screen. Full detail (function list, RLS model, the `params_param_name_key` UNIQUE dependency) lives in `module-3.md` step 2.3 + `src/modules/03_quotes/CLAUDE.md`. Zero M1 behavior change — no M1 file touched, no M1 test affected. This entry exists only because the repo's doc-sync hook maps directory prefix (`01_auth` → module 1) mechanically and can't see the semantic ownership; flagging here is the correct mechanical answer, per the same pattern as the 11/07 `UsersManagementPage` cross-module entries above.
