-- =====================================================================================
-- Round G — DB hardening: 4 fixes in one migration (audit of 31/07/2026)
-- =====================================================================================
-- ⚠️⚠️ HOW THIS WAS ACTUALLY APPLIED — read before trusting the file as a single unit.
-- This file is the complete, correct end state and matches the live DB. But the apply was
-- NOT one call: the MCP connector timed out twice on the full payload (verified each time
-- that nothing had been written — the DB was untouched), so it was re-sent compacted. In
-- compacting, TWO function bodies were dropped by mistake — `approve_quote_and_create_project`
-- and `replace_quote_lines` — while `alter table products drop column cost` DID run. For a
-- few minutes both functions referenced a column that no longer existed, i.e. approving a
-- quote and saving an edit were broken. Caught immediately and fixed forward in two more
-- migrations, then all three were re-read from `pg_get_functiondef` and verified to read
-- `product_costs` and not `pr.cost`. Registered in `schema_migrations` as THREE rows:
--   round_g_db_hardening · round_g_fix_forward_remaining_cost_readers ·
--   round_g_fix_forward_approve_rpc_cost_source
-- 📌 The lesson, so it is not re-learned: **shrinking a payload is an edit.** It got no
--    re-read against the source, which is exactly the check the whole round exists to model.
-- 📌 Consistent with §7.86 (ruled the same day): this folder is documentation, not a restore
--    script — the live DB + this header are the record, and the version drift is expected.
-- =====================================================================================
-- why: the 31/07 whole-codebase review found four gaps where the DB is more permissive
--   than the ruling it is supposed to enforce. All four were RULED by Ishay before this
--   migration was written; nothing here is a new product decision.
--
--   (1) register_failed_login is granted to `anon` and takes an EMAIL as its argument, so
--       anyone holding the public anon key can lock any known account for 15 minutes,
--       repeatedly, without a single password attempt — and the victim cannot self-release
--       (reset_login_attempts requires an authenticated session). RULED (§7.8↳, 31/07):
--       rate-limit to 15 calls per IP per hour — by CALLER, not by the emailed argument
--       (OWASP Authentication Cheat Sheet + Auth0 brute-force-protection, whose default is
--       10/IP; 15 because Ishay's five test users share one office wifi). ⚠️ This REDUCES
--       severity (permanent lock → periodic disruption); it does not close the gap. The
--       full fix (A-22, Auth Hook) needs a Supabase Team plan — deferred by Ishay's ruling.
--
--   (2) products_select_all_authenticated (using(true), §7.83) exposes EVERY products column
--       — including `cost`, i.e. the margin — to every authenticated user, including the
--       recruitment and logistics managers who are fully blocked on 'הצעות מחיר'. The screens
--       obey §7.28 (profitability for edit-holders only); the wall did not. RULED (§7.83↳,
--       31/07): split `cost` into a child table with a narrow policy. Postgres RLS is
--       row-level and Supabase explicitly advises against column-level privileges, so a
--       separate table is the documented pattern (a view cannot help: security_invoker
--       cannot restrict columns).
--
--   (3) storage bucket `marketing` has neither file_size_limit nor allowed_mime_types
--       (verified live: both null, bucket public). The 10MB / PDF-JPG-PNG validation lives
--       in JS only — i.e. it is bypassed entirely by a direct REST upload.
--
--   (4) products.description is NOT NULL with no DEFAULT. It enforces nothing (an empty
--       string passes) but breaks any writer that omits the key — the bug fixed in the
--       product form on 31/07 was waiting for the next writer.
--
-- 🔗 מראת §7.8↳ · §7.83↳ — SSOT: PROJECT_MASTER §7 (do not edit the rulings here).
-- ⚠️ typed-echo gate (DB protocol): applied via MCP apply_migration only after Ishay types
--    the migration name. Live project, no separate test environment.
-- Reversibility: (1) replace the function again · (2) the cost values are COPIED, not moved,
--    so products.cost can be re-added and back-filled from product_costs · (3)+(4) inverse
--    UPDATE / ALTER.

-- ─────────────────────────────────────────────────────────────────────────────────────
-- (1) Rate limit for register_failed_login — 15 calls per IP per hour
-- ─────────────────────────────────────────────────────────────────────────────────────
-- ⚠️ Deliberate deviation from the db_roadmap §1 new-table checklist: no surrogate PK and
--    no created_at/updated_at+moddatetime. This is an append-only rate log that prunes
--    itself inside the function (rows older than one hour are deleted on every call), not a
--    business table — a PK and an updated_at would carry cost with no reader.
create table public.login_rpc_calls (
  ip         inet        not null,
  called_at  timestamptz not null default now()
);

comment on table public.login_rpc_calls is
  'יומן-קצב ל-register_failed_login (§7.8↳, 31/07/2026). מתנקה בתוך הפונקציה — שורות מעל שעה נמחקות בכל קריאה.';

create index login_rpc_calls_ip_time_idx on public.login_rpc_calls (ip, called_at desc);

-- deny-all by design: the only access path is the SECURITY DEFINER function below.
-- Same model as login_attempts (migration 20260703071534).
alter table public.login_rpc_calls enable row level security;
revoke all on public.login_rpc_calls from anon, authenticated;

-- Body below = the LIVE pg_get_functiondef of register_failed_login (verified 31/07/2026)
-- with the rate-limit block prepended. The business logic (5 failures → 15-minute lock) is
-- unchanged byte-for-byte.
create or replace function public.register_failed_login(p_email text)
returns timestamptz
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_count int;
  v_locked timestamptz;
  v_ip inet;
  v_recent int;
begin
  -- ── הגבלת-קצב (§7.8↳, הכרעת-ישי 31/07/2026): 15 קריאות לכל כתובת-IP בשעה ──
  -- לפי **מי שמתקשר** ולא לפי p_email: הפרמטר נשלט ע"י התוקף, כתובת-ה-IP לא. זו הסיבה
  -- ש-OWASP מוריד כיום מחשיבות את נעילת-החשבון לטובת הגבלה לפי מקור-הבקשה.
  -- ⚠️ IP חסר ⇒ **מדלגים על ההגבלה ולא חוסמים.** זה קורה רק בגישה ישירה למסד (psql/MCP),
  -- לא דרך PostgREST — וחסימה שם הייתה הופכת תקלת-תשתית להשבתת-כניסה מלאה.
  begin
    v_ip := nullif(btrim(split_part(
      coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''),
      ',', 1)), '')::inet;
  exception when others then
    v_ip := null;   -- כותרת פגומה/חסרה = כאילו אין IP, לא כישלון-כניסה
  end;

  if v_ip is not null then
    delete from public.login_rpc_calls where called_at < now() - interval '1 hour';

    select count(*) into v_recent
      from public.login_rpc_calls
      where ip = v_ip and called_at > now() - interval '1 hour';

    -- 15 עוברות, ה-16 נחסמת. ההודעה גנרית **בכוונה**: אסור לומר לתוקף שהוא פגע בהגנת-קצב
    -- (מידע-אבחון שמאפשר לו לכייל את הקצב). ⚠️ מסך-הכניסה זורק את שגיאת-ה-RPC במכוון
    -- (fail-open מתועד ב-src/CLAUDE.md), ולכן המשתמש יראה "מייל או סיסמה שגויים" — נכון
    -- עובדתית (הוא אכן נכשל בסיסמה) ואינו חושף דבר. ⛔ לא "לתקן" את זה במסך.
    if v_recent >= 15 then
      raise exception 'לא ניתן להשלים את הפעולה כרגע. נסה שוב מאוחר יותר.'
        using errcode = 'P0001';
    end if;

    insert into public.login_rpc_calls (ip) values (v_ip);
  end if;

  -- ── הלוגיקה העסקית הקיימת, ללא שינוי ──
  insert into public.login_attempts (email, failed_count, last_attempt_at)
    values (p_email, 1, now())
  on conflict (email) do update
    set failed_count = public.login_attempts.failed_count + 1,
        last_attempt_at = now()
  returning failed_count into v_count;

  if v_count >= 5 then
    v_locked := now() + interval '15 minutes';
    update public.login_attempts
      set locked_until = v_locked, failed_count = 0
      where email = p_email;
    return v_locked;
  end if;

  return null;
end;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────────────
-- (2) products.cost → product_costs (narrow RLS)
-- ─────────────────────────────────────────────────────────────────────────────────────
-- Readers = edit on 'הצעות מחיר' (CEO + projects manager — the two who see the profitability
-- panel, §7.28) OR edit on 'כספים' (finance manager, for M8 §7.79). Verified live 31/07: this
-- yields exactly מנכ"ל · מנהלת פרויקטים · מנהלת כספים ולקוחות, and excludes מנהלת גיוס ושיבוץ
-- and מנהלת לוגיסטיקה. Writes stay CEO-only through the same 'הגדרות מערכת' gate as products.
create table public.product_costs (
  sku         text primary key references public.products(sku) on update cascade on delete cascade,
  cost        numeric(12,2) not null check (cost >= 0),   -- §7.74 money precision
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()          -- §7.73 + moddatetime below
);

comment on table public.product_costs is
  'עלות-רכש פר-מק"ט, מופרדת מ-products כדי שההרשאה תהיה ברמת-טבלה (§7.83↳, הכרעת-ישי 31/07/2026). ה-PK מכסה את ה-FK — אין צורך באינדקס נוסף (C-1).';

-- moddatetime lives in schema `extensions` since migration 20260710164420.
create trigger product_costs_set_updated_at
  before update on public.product_costs
  for each row execute function extensions.moddatetime (updated_at);

alter table public.product_costs enable row level security;

create policy "product_costs_select_by_permission" on public.product_costs
  for select to authenticated
  using (exists (select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id in (
        select module_id from public.modules where module_name in ('הצעות מחיר', 'כספים'))
      and p.permission_level = 'edit'));

create policy "product_costs_write_ceo_only" on public.product_costs
  for all to authenticated
  using (exists (select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'הגדרות מערכת')
      and p.permission_level = 'edit'))
  with check (exists (select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'הגדרות מערכת')
      and p.permission_level = 'edit'));

-- Copy BEFORE the drop. Not test data — this is the data migration the split consists of,
-- and it is also the reversibility story (products.cost can be rebuilt from here).
insert into public.product_costs (sku, cost)
  select sku, cost from public.products;

-- ── The three functions that read products.cost (verified live: these are the only three;
--    no views reference the column). Each body below is the LIVE definition with the cost
--    source swapped — in particular approve_quote_and_create_project keeps the VAT guard
--    that round A added on 31/07 (migration 20260731085335). ⛔ Never rebuild these bodies
--    from the older 20260723115000 file: that would silently revert round A.
create or replace function public.approve_quote_and_create_project(p_quote_id integer)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
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

  -- 🔁 מקור-העלות עבר ל-product_costs (§7.83↳). הפונקציה security definer ולכן עוקפת RLS —
  -- ההקפאה עובדת גם כשהמאשר עצמו אינו רשאי לקרוא עלויות.
  update public.quote_services qs set closing_unit_cost = pc.cost
    from public.product_costs pc where qs.sku = pc.sku and qs.quote_id = p_quote_id;
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
end; $function$;

-- create_quote / replace_quote_lines are SECURITY INVOKER (unchanged). That is safe here:
-- writing a quote already requires edit on 'הצעות מחיר' (quotes RLS), and every such role is
-- inside the product_costs read group. A missing cost row would otherwise land as a raw 23502
-- on the NOT NULL closing_unit_cost — so it is caught explicitly, in Hebrew, naming the item.
-- ⚠️ The Hebrew prefix below is a CONTRACT with SERVER_MESSAGE_RULES in src/lib/quotes.js.
--    Re-wording it there and not here (or vice versa) makes the screen fall back silently.
create or replace function public.create_quote(p_header jsonb, p_lines jsonb)
returns integer
language plpgsql
set search_path to ''
as $function$
declare v_quote_id int; v_missing text;
begin
  select string_agg(distinct coalesce(pr.item_name, arr.l->>'sku'), ', ') into v_missing
    from jsonb_array_elements(p_lines) as arr(l)
    left join public.products pr on pr.sku = arr.l->>'sku'
    where not exists (select 1 from public.product_costs pc where pc.sku = arr.l->>'sku');
  if v_missing is not null then
    raise exception 'לא מוגדרת עלות למוצר % — יש לפנות למנכ"ל להשלמת קטלוג המחירים', v_missing
      using errcode = 'P0001'; end if;

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
         (select pc.cost from public.product_costs pc where pc.sku = l->>'sku'),
         nullif(l->>'color',''), nullif(l->>'notes','')
  from jsonb_array_elements(p_lines) with ordinality as arr(l, ord);
  return v_quote_id;
end; $function$;

create or replace function public.replace_quote_lines(p_quote_id integer, p_header jsonb, p_lines jsonb)
returns void
language plpgsql
set search_path to ''
as $function$
declare v_status text; v_missing text;
begin
  select quote_status into v_status from public.quotes where quote_id = p_quote_id for update;
  if not found then raise exception 'הצעה % לא נמצאה', p_quote_id using errcode='P0002'; end if;
  if v_status <> 'in_progress' then
    raise exception 'לא ניתן לערוך הצעה שאינה בתהליך (סטטוס %)', v_status using errcode='P0001'; end if;

  select string_agg(distinct coalesce(pr.item_name, arr.l->>'sku'), ', ') into v_missing
    from jsonb_array_elements(p_lines) as arr(l)
    left join public.products pr on pr.sku = arr.l->>'sku'
    where not exists (select 1 from public.product_costs pc where pc.sku = arr.l->>'sku');
  if v_missing is not null then
    raise exception 'לא מוגדרת עלות למוצר % — יש לפנות למנכ"ל להשלמת קטלוג המחירים', v_missing
      using errcode = 'P0001'; end if;

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
         (select pc.cost from public.product_costs pc where pc.sku = l->>'sku'),
         nullif(l->>'color',''), nullif(l->>'notes','')
  from jsonb_array_elements(p_lines) with ordinality as arr(l, ord);
end; $function$;

-- Last: the column itself. Everything above already reads from product_costs.
alter table public.products drop column cost;

-- ─────────────────────────────────────────────────────────────────────────────────────
-- (3) storage bucket `marketing` — server-side limits
-- ─────────────────────────────────────────────────────────────────────────────────────
-- ⚠️ These two values are TWINS of MARKETING_MAX_BYTES and MARKETING_ALLOWED_MIME in
--    src/modules/02_customers/api.js. Changing one side without the other means the client
--    rejects a file the server would accept (or worse: the reverse, a confusing raw error).
update storage.buckets
  set file_size_limit = 10485760,                                        -- 10MB = 10*1024*1024
      allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']
  where id = 'marketing';

-- ─────────────────────────────────────────────────────────────────────────────────────
-- (4) products.description — default ''
-- ─────────────────────────────────────────────────────────────────────────────────────
-- NOT NULL stays (it is the intent); the missing default is what broke writers that omit the
-- key. The product form already sends '' as a workaround — that workaround now has a backstop.
alter table public.products alter column description set default '';
