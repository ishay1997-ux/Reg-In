# REG-IN — Micro-Guide | Module 1: Users & Permissions (as-built)

> **Audience:** a future Claude Code session with zero memory. Humans (Ishay/Amit) only approve and decide.
> **Format:** this file is the pilot of the machine-first micro-guide format (9 sections, per `docs/templates/create_micro_guide_template.md`). Module 1 was built before this format existed, so it is recorded here **as-built** — it doubles as the format exemplar for modules 2–12.
> **Language rule:** guide in English; Hebrew appears only as data (DB values, UI strings). Chat reports to Ishay/Amit — always Hebrew.

---

## 1. 🟢 Live Status Header

| Field | Value |
|---|---|
| Module | 1 — Users & Permissions (משתמשים והרשאות) |
| Owner | Ishay |
| Branch | `ishay/module-1-permissions` |
| **Status** | **✅ Closed & Merged to `dev`** (PR [#2](https://github.com/ishay1997-ux/Reg-In/pull/2), merge commit `3ba5c5f`, 08/07/2026 18:35 — quality-gate + gitleaks green) |
| Last updated | 08/07/2026 18:52 (regin-docs-sync: synced status header + step table + DoD checkbox to reflect the actual PR #2 merge — was stale at "awaiting PR/merge"). Prior: 08/07/2026 17:55 re-run closing audit (DoD re-walked, RLS re-verified live, advisors clean, `verify` green, E2E hardened to 8/8 — StrictMode-race flake fixed test-only, §9). |
| Active step | 5.4 — Handoff to Amit (message not yet sent) |

| Phase / step | Status |
|---|---|
| Phase 1 — DB & RLS (steps 1.1–1.4) | ✅ done |
| Phase 2 — Business logic & helpers (2.1–2.2) | ✅ done |
| Phase 3 — UI (3.1–3.5) | ✅ done |
| Phase 4 — Control & integration (4.1–4.2) | ✅ done |
| Phase 5 — QA & handoff: 5.1 test infra | ✅ done |
| Phase 5: 5.2 core RLS scenarios (5–12) | ✅ done (verified live 02/07) |
| Phase 5: 5.2b extended 12-scenario matrix on `customers` | ⏸️ deferred → Module 2 (Ishay's ruling, 02/07) |
| Phase 5: 5.3 PR + merge to `dev` | ✅ done (PR #2, merge commit `3ba5c5f`, 08/07/2026 18:35) |
| Phase 5: 5.4 handoff message to Amit (RLS template ready) | ⬜ pending (merge done — message not yet sent) |

## 2. 📦 Context Packet for Claude

**Purpose (3 lines):** CEO opens users and sets a permissions matrix (edit/view/blocked) per role × module — without a programmer. Every other module checks permissions against this module (RLS + UI gates). It is the security foundation of the whole system.

**Capabilities delivered vs deferred** *(backfilled 07/07/2026 per current template — sources: section 9 here + PROJECT_MASTER §6)*:

| Capability | What M1 delivers | Which module completes it | Tracked where |
|---|---|---|---|
| RLS authorization | `current_user_role_id()` (hardened) + §7.21 policy template + 7 policies on the 4 core tables | M2 — first business-table policies + the 12-scenario matrix on `customers` | PROJECT_MASTER §6 · section 9 here |
| Login & lockout | Email+password, Google Sign-In, 5-failures→15-min lockout (app+DB level) | Auth-Hook–level enforcement — future (needs paid Supabase tier) | Section 4 "accepted limitations" |
| User self-service | Own name/phone edit + real password change (re-auth → `updateUser`) | Self email-change → M9; self-service password *reset* (forgot-password) → M10 | Section 9 · PROJECT_MASTER §6 |
| Admin screens | Users CRUD + permissions matrix (7 business modules, 4 groups) | `params` UI → M9; admin-modules exposure in matrix → future | Section 9 |
| Navigation shell | Sidebar/Topbar/ProtectedRoute/AuthContext (all modules ride on this) | Topbar global search → M9 | Section 9 |
| Test coverage | Vitest 16 + Playwright 8 (Chromium only, workers=1) + CI | Cross-browser+mobile → before M5; formal UAT + full-system E2E → M12 (Ishay ruling 07/07 — aligned with `architecture_and_qa_roadmap.md`) | Section 6 · PROJECT_MASTER §6 |
| Notification preferences | Profile-screen email/SMS toggles delivered **deliberately disabled** (no preferences table yet — `ProfileSettingsPage.jsx`) | Preferences table + UI activation → M9; actual notification sending → M10 (Ishay ruling 07/07) | Section 9 · PROJECT_MASTER §6 |

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
- **5.2b ⏸️ deferred → Module 2:** scenarios 1–4 (the 12-scenario matrix on `customers`) — `customers` is deny-all until Module 2 writes its policies per §7.21. First task there.
- **5.3 ✅ PR & merge (👤 Ishay):** PR [#2](https://github.com/ishay1997-ux/Reg-In/pull/2) opened base:`dev` ← compare:`ishay/module-1-permissions` → CI green (quality-gate + gitleaks — one gitleaks 403 permission fix needed first, `32d55bd`, not a leak finding) → merged (merge commit `3ba5c5f`, 08/07/2026 18:35; Amit not yet at review stage — noted in CHANGELOG). A small follow-up docs-only PR [#3](https://github.com/ishay1997-ux/Reg-In/pull/3) then flipped STATUS/CHANGELOG/LOG to reflect the merge.
- **5.4 ⬜ Handoff:** after merge — tell Amit `dev` is ready and the §7.21 policy template awaits Module 2.

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
- [x] `current_user_role_id()` hardened; lockout RPC trio deployed; anon EXECUTE revoked.
- [x] Users screen end-to-end (bidirectional status, edit, self-lockout prevention).
- [x] Permissions matrix (4 groups, CEO column locked, auto-save) — persists across refresh.
- [x] Role simulation: 3 roles see exactly what their permissions dictate; direct-URL blocked.
- [x] CAPTCHA deviation documented (§7.8); frozen spec untouched.
- [x] All migrations applied + `docs/schema.sql` snapshot current + committed together.
- [x] `npm run verify` green; `npm run test:e2e` 8/8 green (re-verified at both closing audits — 06/07/2026 and the 08/07/2026 re-run; the matrix-write flake was fixed test-only in the re-run, §9).
- [x] Closing audit: gitleaks scan of full history (39 commits) — no leaks found; CI secret-scan expected green with no `.gitleaksignore` needed (§7.24 fallback documented if CI disagrees).
- [x] Code review P0/P1 closed (`docs/code_review_2026-07.md`).
- [x] CHANGELOG + CLAUDE_CODE_LOG + STATUS current.
- [x] **PR opened, CI green, merged to `dev`** — PR #2, merge commit `3ba5c5f`, 08/07/2026 18:35.
- [ ] Fresh `dev` checkout: `npm install && npm run dev` → Google login works, CEO reaches the matrix. **Not yet performed by any session — no evidence found; flagged, not checked off.**
- [ ] Handoff message to Amit (§7.21 template ready for Module 2).

## 8. 🔄 Self-Update Protocol

*(Dormant for this module — kept as the canonical example for modules 2–12.)*
1. At every step transition, update section 1 (status header + step table) **in the same session, before moving on**.
2. Any deviation from plan → inline "↳ as-built" note on the step + a dated line in section 9.
3. The repo's Stop hook (`.claude/hooks/check-docs-updated.sh`) blocks session end if code under `src/modules/NN_*/` changed but the module's micro-guide didn't — keep this file current as you work, not as an afterthought.
4. The `CLAUDE.md` end-of-session protocol applies on top (CHANGELOG → CLAUDE_CODE_LOG → STATUS).

## 9. 📝 Deviations & Tech-Debt Log

- 03/07 — CAPTCHA (spec 5.6.1) cancelled → Google Sign-In + lockout (§7.8). Frozen spec untouched.
- 02/07 — `frozen` → `inactive`; one-way freeze → bidirectional toggle (binding pattern for M2 `customers.status`, M4 `hostesses.status`).
- 02/07 — Matrix: 4 super-groups per mockup (§7.5); seed values from spec §3, not mockup (§7.4 note).
- 04–06/07 — E2E/Vitest/CI pulled forward from Module 12 (deliberate — security-critical surface first).
- 06/07 — §7.24: test-user passwords in git history stay — accepted risk, no rotation; gitleaks findings (if any) handled via `.gitleaksignore`.
- 07/07/2026 10:47 — template-conformance backfill ahead of the closing-prompt re-run: added the capabilities-delivered-vs-deferred table (section 2), the model-&-effort-per-phase table (section 5), and replaced QA-matrix as-run impressions with audit evidence (section 6). No code or status change — documentation alignment only.
- 07/07/2026 16:37 — **Post-closure DB touch (Ishay-approved plan, option ב):** migration `20260707163709_module1_users_rls_initplan_select_wrap` applied via MCP — `(select …)` wrap on the 2 initplan-flagged `users` policies. Behavior-identical (re-verified: impersonation smoke + escalation block + verify + E2E 8/8). Bonus: fixed a pre-existing `docs/schema.sql` drift (stale pre-hardening `current_user_role_id()` body at ~:190). §7.21 template + module-2.md draft SQL wrapped in lockstep. Module status unchanged (🔒 closed, awaiting PR/merge).
- 07/07/2026 16:09 — `regin-health-pulse` follow-up (doc-only, no code/DB): patch-bumped 3 deps (`@supabase/supabase-js` 2.110.1, `radix-ui` 1.6.2, `vitest` 4.1.10 — lint clean, 16/16 Vitest green). Triaged the Supabase advisors into §4 "Advisor acceptances" (SECURITY DEFINER 0028/0029 accepted; account-lockout DoS accepted per §3 §7.8↳; leaked-password blocked-by-plan; perf WARNs deferred). Corrected a §4 inaccuracy: prior wording implied `anon` EXECUTE was fully revoked on the lockout trio — in fact 2 of 3 keep `anon` by design.
- 08/07/2026 17:55 — **Re-run closing audit (verdict YES again) + E2E flake fix.** Ran the full audit against this guide's DoD: DoD re-walked (counts `roles`=5/`modules`=9/`permissions`=45 live; users grew to 7 — the 2 real CEO users added 07/07); RLS re-verified live via MCP (all `users`/`permissions` policies `(select …)`-wrapped, CEO-only writes, `users_update_self` escalation-block intact, `schema.sql` in sync — no drift); advisors clean of NEW findings (12× `rls_enabled_no_policy` INFO + 5 SECURITY-DEFINER WARN + leaked-password WARN + 8 FK-index INFO + 3 `multiple_permissive` WARN — all previously triaged/accepted). **Flake found & fixed (Ishay-approved, test-only):** `e2e/permissions.spec.js` matrix-write test failed 1/3 on cold runs — a StrictMode double-`loadData` (dev runs the effect twice) resolving *after* the click clobbered the optimistic title with the stale DB value. Fix: `await page.waitForLoadState('networkidle')` before the click (both loadData calls settle first) + a deterministic next-title assertion (`TITLE_CYCLE`) replacing the fragile `not.toHaveAttribute(before)`. Product code unchanged (identical to the 07/07 8/8-green commit `6460fc4`); CI unaffected (CI runs Vitest+build, not E2E). Re-verified: `verify` green, full suite 8/8, the fixed test 3/3 cold. Shared test-DB left net-zero (3 cold-fails × 1 click + 2 passes × 3 clicks = whole cycles; cell back to seed `blocked`). **Migration-version note (no action):** this guide cites the initplan migration as `20260707163709` (local filename, local time); `list_migrations` records it as `20260707133754` (Supabase stores the version in UTC — 13:37Z = 16:37 Asia/Jerusalem). Same migration; not a drift.
- Deferred backlog (target): 12 RLS scenarios on `customers` (M2) · self email-change, Topbar search, `params` UI (M9) · **notification-preferences table + toggle activation (M9), actual sending (M10)** — registered in PROJECT_MASTER §6, 07/07 open-items audit · lockout via Auth Hook (needs paid tier) · **IP-combined lockout to bound the §7.8 email-keyed DoS** · **leaked-password protection — blocked-by-plan (Supabase Pro)** · FK covering indexes + `multiple_permissive_policies` restructure (perf advisors — accepted/deferred, see §4) · admin modules exposure in matrix (future) · router-level ErrorBoundary (future) · `MODULE_META` stable key — P2#8 (next `modules` schema touch). *(initplan fix — done 07/07, removed from backlog.)*
