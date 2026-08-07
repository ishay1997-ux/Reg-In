-- =====================================================================================
-- Module 3 (Quotes) — Migration 3: RLS policies (quotes/quote_services §7.21 + catalog §7.83)
-- =====================================================================================
-- why (blueprint-M3 step 1.3): open the doors. All five tables were RLS-on with 0 policies
--   (deny-all by design, §7.48). Two access models:
--   • quotes + quote_services → §7.21 standard template, module gate 'הצעות מחיר'
--     (select for edit|view, write for edit). Module-level RLS, no row ownership (accepted, §4).
--   • products + price_tiers + params → §7.83: OPEN read to every authenticated user (catalog is
--     consumed by M3/M8/M11 screens too), write CEO-only via the existing 'הגדרות מערכת' module gate.
--     The M9 full-params screen and the M3 "מחירים" tab reuse these same 2 policies (no extra migration).
--   The (select current_user_role_id()) initplan wrap is mandatory (perf; matches M1/M2 policies).
-- Ref skeleton: docs/module3_prices_tab_design_notes.md §6. 🔗 מראת §7.83 — SSOT: PROJECT_MASTER §7.
-- ⚠️ typed-echo gate (DB protocol): shared project. Applied via MCP apply_migration after Ishay
--    types the migration name. Advisors after: expect +multiple_permissive_policies WARNs on the
--    five tables (inherent to the §7.21 two-policy template — same accepted pattern as customers/M1).

-- ── quotes (§7.21, module 'הצעות מחיר') ──────────────────────────────────────────────
create policy "quotes_select_by_permission" on quotes for select to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
      and p.permission_level in ('edit', 'view')));
create policy "quotes_write_by_permission" on quotes for all to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
      and p.permission_level = 'edit'))
  with check (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
      and p.permission_level = 'edit'));

-- ── quote_services (§7.21, same 'הצעות מחיר' gate — a line inherits its quote's module access) ──
create policy "quote_services_select_by_permission" on quote_services for select to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
      and p.permission_level in ('edit', 'view')));
create policy "quote_services_write_by_permission" on quote_services for all to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
      and p.permission_level = 'edit'))
  with check (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הצעות מחיר')
      and p.permission_level = 'edit'));

-- ── products (§7.83: open read, CEO write via 'הגדרות מערכת') ─────────────────────────
create policy "products_select_all_authenticated" on products for select to authenticated using (true);
create policy "products_write_ceo_only" on products for all to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
      and p.permission_level = 'edit'))
  with check (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
      and p.permission_level = 'edit'));

-- ── price_tiers (§7.83, same as products) ────────────────────────────────────────────
create policy "price_tiers_select_all_authenticated" on price_tiers for select to authenticated using (true);
create policy "price_tiers_write_ceo_only" on price_tiers for all to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
      and p.permission_level = 'edit'))
  with check (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
      and p.permission_level = 'edit'));

-- ── params (§7.83, same; policy covers the whole table — the 2 pricing rows are filtered in pricesApi) ──
create policy "params_select_all_authenticated" on params for select to authenticated using (true);
create policy "params_write_ceo_only" on params for all to authenticated
  using (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
      and p.permission_level = 'edit'))
  with check (exists (select 1 from permissions p
    where p.role_id = (select current_user_role_id())
      and p.module_id = (select module_id from modules where module_name = 'הגדרות מערכת')
      and p.permission_level = 'edit'));
