-- =====================================================================================
-- Module 3 (Quotes) — Migration 10: param-guards for VAT + quote-expiry (silent-NULL family)
-- =====================================================================================
-- why (audit 31/07/2026, finding A): two system params are read with a raw cast and no NULL
--   check. A missing/renamed/blank row in `params` (edited by hand in the Table Editor —
--   §7.84, so this is a real path) turns into NULL and then fails SILENTLY:
--   • approve_quote_and_create_project read `אחוז_מעמ` with `param_value::numeric` and no
--     guard, writing NULL into quotes.vat_rate_snapshot (nullable, no CHECK). An approved
--     quote AND the project born from it were frozen with an unknown VAT rate, no error.
--   • the `module3-quote-expiry` cron job compared `updated_at < now() - (NULL * interval)`,
--     which is NULL — never true. No quote ever expired, and the job reported UPDATE 0 as
--     success every night, forever.
--   The JS money engine (src/lib/pricing.js) already enforces "empty is not 0" and returns
--   null rather than a made-up rate; these two SQL sites were the ones bypassing it.
--
-- what changes (three parts, no data migration):
--   1) approve_quote_and_create_project — the param is read as TEXT and validated (missing /
--      blank / non-numeric / outside 0–100) BEFORE any write, raising a Hebrew P0001. Read as
--      text and not `::numeric` on purpose: `''::numeric` raises an English cast error instead
--      of our message. Everything else in the body is byte-for-byte the migration-4 version,
--      including `security definer set search_path = ''` and the ordering that freezes
--      closing_unit_cost while the quote is still in_progress (the lock trigger blocks later).
--   2) two CHECK constraints on quotes — an approved quote must carry a VAT snapshot, and any
--      snapshot must be a legal 0–100 percent. Verified before writing this file: 0 violating
--      rows (8 quotes, 1 approved, 0 approved-with-NULL). ADD CONSTRAINT validates without
--      UPDATE, so the quotes lock trigger is not involved.
--   3) module3-quote-expiry is re-scheduled under the SAME job name (cron.schedule upserts by
--      name) with the body wrapped in a DO block that reads the param into a variable and
--      raises a Hebrew P0001 when it is missing/non-integer. The business logic is unchanged.
--      Ishay's ruling 31/07/2026: fail loudly rather than fall back to an invented 30 days —
--      a number nobody configured is exactly what the money engine exists to prevent. A visible
--      warning banner on the quotes screen was added in the same session, because
--      cron.job_run_details is a place nobody opens.
--
-- reversibility: fully reversible. Part 1 = re-create the migration-4 function body; part 2 =
--   `alter table public.quotes drop constraint …` (x2); part 3 = re-schedule the job with the
--   previous one-statement body. No rows are read, written, or deleted by this migration.

-- 1) Conversion RPC — VAT guard before any write
create or replace function public.approve_quote_and_create_project(p_quote_id int)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_caller_email text := (select auth.email());
  v_status text; v_event_date date; v_project_id int; v_hostess_count int; v_vat numeric;
  v_vat_text text;
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

  select param_value into v_vat_text from public.params where param_name = 'אחוז_מעמ';
  if v_vat_text is null or btrim(v_vat_text) = '' or btrim(v_vat_text) !~ '^[0-9]+(\.[0-9]+)?$' then
    raise exception 'שיעור המע"מ אינו מוגדר בהגדרות המערכת (פרמטר אחוז_מעמ) — לא ניתן לאשר הצעה'
      using errcode = 'P0001'; end if;
  v_vat := btrim(v_vat_text)::numeric;
  if v_vat < 0 or v_vat > 100 then
    raise exception 'שיעור המע"מ שבהגדרות המערכת אינו חוקי (%) — לא ניתן לאשר הצעה', v_vat
      using errcode = 'P0001'; end if;

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

-- 2) The invariant the RPC guard produces, enforced by the table itself
alter table public.quotes add constraint quotes_approved_requires_vat
  check (quote_status <> 'approved' or vat_rate_snapshot is not null);
alter table public.quotes add constraint quotes_vat_snapshot_range
  check (vat_rate_snapshot is null or (vat_rate_snapshot >= 0 and vat_rate_snapshot <= 100));

-- 3) Quote-expiry job — same name (upsert), same schedule, same business logic, guarded param
select cron.schedule('module3-quote-expiry', '0 1 * * *', $job$
do $expiry$
declare v_days_text text; v_days int;
begin
  select param_value into v_days_text from public.params where param_name = 'ימי_תוקף_הצעה';
  if v_days_text is null or btrim(v_days_text) = '' or btrim(v_days_text) !~ '^[0-9]+$' then
    raise exception 'פרמטר ימי_תוקף_הצעה חסר או אינו מספר שלם — עבודת תפוגת ההצעות לא בוצעה'
      using errcode = 'P0001';
  end if;
  v_days := btrim(v_days_text)::int;

  update public.quotes
     set quote_status = 'rejected', rejection_reason = 'פג תוקף'
   where quote_status = 'in_progress'
     and updated_at < now() - (v_days * interval '1 day');
end
$expiry$;
$job$);
