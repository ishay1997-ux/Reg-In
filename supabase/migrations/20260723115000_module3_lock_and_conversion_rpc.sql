-- =====================================================================================
-- Module 3 (Quotes) — Migration 4: lock trigger + conversion RPC + create/edit RPCs
-- =====================================================================================
-- why (blueprint-M3 step 1.4): lifecycle integrity in the DB.
--   1) Lock trigger (§7.50/F5): UPDATE/DELETE on a quote or its lines is rejected unless the
--      quote is in_progress — protects §7.12 PDF-reconstruction + §7.28 profitability data even
--      from an edit-role API call. in_progress rows stay freely updatable (so moddatetime, the
--      edit RPC, the approval flip, and the cron expiry all work without exemption machinery).
--   2) Conversion RPC approve_quote_and_create_project (§7.49): SECURITY DEFINER + pinned
--      search_path + EXPLICIT internal permission check (edit on 'הצעות מחיר' — no blind bypass).
--      Validates in_progress + future date (§7.32) + has hostess lines (§7.53). Freeze order is
--      load-bearing: freeze closing_unit_cost (§7.28) WHILE in_progress, then flip status +
--      freeze VAT (§7.51) — once flipped the row is locked. Project born complete: identity
--      snapshot event_name+customer_id (§7.76/LOCAL-5), date/times/location inherited (LOCAL-1),
--      owner=caller, required_hostess_count=Σ hostess-line qty (F22). Logistics derived from
--      non-hostess lines. Double-click safe (row FOR UPDATE + status re-check + projects.quote_id UNIQUE).
--   3+4) create_quote / replace_quote_lines (SECURITY INVOKER — RLS is the wall; F17): atomic
--      header+lines so a mid-failure never leaves a lines-less quote. Edit verifies in_progress and
--      refreshes updated_at (restarts the expiry clock — F4 by design).
--
-- as-built: closing_unit_cost is NOT NULL, so create/edit set it to the current products.cost as a
--   placeholder; the conversion RPC re-freezes it at approval per §7.28 (approval-time value wins).
-- Comments in English for consistency with M3 migrations 2/3 (authored during the MCP outage).
-- Applied via MCP apply_migration after Ishay's typed-echo. Verified live: full happy-path battery
--   (project+logistics born complete, VAT=18/cost frozen), double-click, lock, view-role denial,
--   no-orphan-on-failure — all pass.
-- Advisor note: approve_quote_and_create_project is (intentionally) authenticated-executable
--   SECURITY DEFINER (gated by the internal permission check — same accepted pattern as M1's
--   lockout functions). The trigger function enforce_quote_in_progress_lock got the default public
--   EXECUTE grant → flagged as anon/authenticated-executable; it is non-exploitable (a trigger
--   function errors if called directly) and is hardened by a `revoke execute` folded into migration 5.

-- 1) Lock trigger
create or replace function public.enforce_quote_in_progress_lock()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_status text;
begin
  if TG_TABLE_NAME = 'quotes' then
    v_status := OLD.quote_status;
  else
    select q.quote_status into v_status from public.quotes q where q.quote_id = OLD.quote_id;
  end if;
  if v_status is distinct from 'in_progress' then
    raise exception 'הצעה נעולה: עריכה/מחיקה מותרת רק בסטטוס in_progress (נמצא: %)', coalesce(v_status,'unknown')
      using errcode = 'P0001';
  end if;
  return case when TG_OP = 'DELETE' then OLD else NEW end;
end; $$;

create trigger quotes_lock_non_in_progress
  before update or delete on public.quotes
  for each row execute function public.enforce_quote_in_progress_lock();
create trigger quote_services_lock_non_in_progress
  before update or delete on public.quote_services
  for each row execute function public.enforce_quote_in_progress_lock();

-- 2) Conversion RPC
create or replace function public.approve_quote_and_create_project(p_quote_id int)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_caller_email text := (select auth.email());
  v_status text; v_event_date date; v_project_id int; v_hostess_count int; v_vat numeric;
begin
  if not exists (
    select 1 from public.permissions p
    join public.users u on u.role_id = p.role_id
    join public.modules m on m.module_id = p.module_id
    where u.email = v_caller_email and u.status = 'active'
      and m.module_name = 'הצעות מחיר' and p.permission_level = 'edit'
  ) then
    raise exception 'אין הרשאה: נדרשת עריכה על הצעות מחיר לאישור הצעה' using errcode = '42501';
  end if;

  select quote_status, estimated_event_date into v_status, v_event_date
    from public.quotes where quote_id = p_quote_id for update;
  if not found then raise exception 'הצעה % לא נמצאה', p_quote_id using errcode='P0002'; end if;
  if v_status <> 'in_progress' then
    raise exception 'ההצעה כבר טופלה (סטטוס %) — לא ניתן לאשר שוב', v_status using errcode='P0001'; end if;
  if v_event_date < current_date then
    raise exception 'לא ניתן לאשר הצעה שתאריך-האירוע שלה עבר (%)', v_event_date using errcode='P0001'; end if;

  select coalesce(sum(qs.qty),0) into v_hostess_count
    from public.quote_services qs join public.products pr on pr.sku = qs.sku
    where qs.quote_id = p_quote_id and pr.category = 'hostess';
  if v_hostess_count <= 0 then
    raise exception 'לא ניתן לאשר הצעה ללא שורות-דיילות (אין אירוע בלי דיילות)' using errcode='P0001'; end if;

  select param_value::numeric into v_vat from public.params where param_name = 'אחוז_מעמ';

  update public.quote_services qs set closing_unit_cost = pr.cost
    from public.products pr where qs.sku = pr.sku and qs.quote_id = p_quote_id;
  update public.quotes set quote_status='approved', vat_rate_snapshot = v_vat where quote_id = p_quote_id;

  insert into public.projects
    (quote_id, event_name, customer_id, final_event_date, final_location,
     final_start_time, final_end_time, owner_email, required_hostess_count, project_status)
  select q.quote_id, q.event_name, q.customer_id, q.estimated_event_date, q.estimated_location,
         q.estimated_start_time, q.estimated_end_time, v_caller_email, v_hostess_count, 'not_started'
    from public.quotes q where q.quote_id = p_quote_id
  returning project_id into v_project_id;

  insert into public.logistics (project_id, sku, serial_number, planned_qty)
  select v_project_id, qs.sku, row_number() over (order by qs.line_number), qs.qty
    from public.quote_services qs join public.products pr on pr.sku = qs.sku
    where qs.quote_id = p_quote_id and pr.category <> 'hostess';

  return v_project_id;
end; $$;
revoke execute on function public.approve_quote_and_create_project(int) from public, anon;
grant  execute on function public.approve_quote_and_create_project(int) to authenticated;

-- 3) Create RPC (atomic header+lines; RLS is the wall) — F17
create or replace function public.create_quote(p_header jsonb, p_lines jsonb)
returns int language plpgsql security invoker set search_path = '' as $$
declare v_quote_id int;
begin
  insert into public.quotes
    (customer_id, event_name, recommended_hostess_count, estimated_guests,
     estimated_event_date, estimated_location, estimated_start_time, estimated_end_time,
     applied_customer_discount, manual_discount, notes)
  values (
    (p_header->>'customer_id')::bigint, p_header->>'event_name',
    (p_header->>'recommended_hostess_count')::int, (p_header->>'estimated_guests')::int,
    (p_header->>'estimated_event_date')::date, p_header->>'estimated_location',
    (p_header->>'estimated_start_time')::time, (p_header->>'estimated_end_time')::time,
    (p_header->>'applied_customer_discount')::numeric,
    coalesce((p_header->>'manual_discount')::numeric, 0), nullif(p_header->>'notes',''))
  returning quote_id into v_quote_id;

  insert into public.quote_services
    (quote_id, sku, line_number, qty, closing_unit_price, closing_unit_cost, color, notes)
  select v_quote_id, l->>'sku', ord::int, (l->>'qty')::int, (l->>'closing_unit_price')::numeric,
         (select pr.cost from public.products pr where pr.sku = l->>'sku'),
         nullif(l->>'color',''), nullif(l->>'notes','')
  from jsonb_array_elements(p_lines) with ordinality as arr(l, ord);
  return v_quote_id;
end; $$;
revoke execute on function public.create_quote(jsonb, jsonb) from public, anon;
grant  execute on function public.create_quote(jsonb, jsonb) to authenticated;

-- 4) Edit RPC (verify in_progress, replace header+lines atomically) — F17
create or replace function public.replace_quote_lines(p_quote_id int, p_header jsonb, p_lines jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare v_status text;
begin
  select quote_status into v_status from public.quotes where quote_id = p_quote_id for update;
  if not found then raise exception 'הצעה % לא נמצאה', p_quote_id using errcode='P0002'; end if;
  if v_status <> 'in_progress' then
    raise exception 'לא ניתן לערוך הצעה שאינה בתהליך (סטטוס %)', v_status using errcode='P0001'; end if;

  update public.quotes set
    customer_id = (p_header->>'customer_id')::bigint, event_name = p_header->>'event_name',
    recommended_hostess_count = (p_header->>'recommended_hostess_count')::int,
    estimated_guests = (p_header->>'estimated_guests')::int,
    estimated_event_date = (p_header->>'estimated_event_date')::date,
    estimated_location = p_header->>'estimated_location',
    estimated_start_time = (p_header->>'estimated_start_time')::time,
    estimated_end_time = (p_header->>'estimated_end_time')::time,
    applied_customer_discount = (p_header->>'applied_customer_discount')::numeric,
    manual_discount = coalesce((p_header->>'manual_discount')::numeric, 0),
    notes = nullif(p_header->>'notes','')
  where quote_id = p_quote_id;

  delete from public.quote_services where quote_id = p_quote_id;
  insert into public.quote_services
    (quote_id, sku, line_number, qty, closing_unit_price, closing_unit_cost, color, notes)
  select p_quote_id, l->>'sku', ord::int, (l->>'qty')::int, (l->>'closing_unit_price')::numeric,
         (select pr.cost from public.products pr where pr.sku = l->>'sku'),
         nullif(l->>'color',''), nullif(l->>'notes','')
  from jsonb_array_elements(p_lines) with ordinality as arr(l, ord);
end; $$;
revoke execute on function public.replace_quote_lines(int, jsonb, jsonb) from public, anon;
grant  execute on function public.replace_quote_lines(int, jsonb, jsonb) to authenticated;
