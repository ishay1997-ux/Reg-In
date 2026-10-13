-- REG-IN · payroll replica · step 3: live function bodies, triggers, policies and grants.
--
-- Source: `pg_get_functiondef` on the live database, 13.10.2026 (SELECT only). Bodies are copied
-- verbatim; md5 of the live definition is noted above each payroll writer so a checker can
-- confirm the copy (`select md5(pg_get_functiondef('public.<fn>'::regprocedure))`).
--
-- Subset, on purpose: the 11 functions the payroll path executes (permission gate, the two
-- legacy payroll writers, the assignment/project triggers and the rate-limit precedent).
-- The 58 others (17 report_m*, quotes, logistics, feedback …) are not called by any payroll
-- code and would add ~450 KB of SQL to every replica start.

CREATE OR REPLACE FUNCTION public.current_user_role_id()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select role_id from public.users where email = auth.email() and status = 'active';
$function$;

CREATE OR REPLACE FUNCTION public.assert_module_permission(p_module text, p_level text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not exists (
    select 1
      from public.permissions p
     where p.role_id = (select public.current_user_role_id())
       and p.module_id = (select m.module_id from public.modules m where m.module_name = p_module)
       and p.permission_level = any(p_level)
  ) then
    raise exception 'אין לך הרשאה לבצע פעולה זו במודול %', p_module using errcode = '42501';
  end if;
end
$function$;

-- live md5 8af8f09f9cb60904f7ac0feb45e28111
CREATE OR REPLACE FUNCTION public.finalize_salary_report(p_report_id integer, p_file_url text, p_status text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform public.assert_module_permission('כספים', array['edit']);

  if p_status not in ('sent', 'failed') then
    raise exception 'סטטוס שליחה לא מוכר.' using errcode = 'P0001';
  end if;

  update public.salary_reports
     set report_file_url = coalesce(p_file_url, report_file_url),
         send_status = p_status,
         sent_date = case when p_status = 'sent' then current_date else sent_date end
   where report_id = p_report_id;

  if not found then
    raise exception 'דוח שכר % לא נמצא.', p_report_id using errcode = 'P0001';
  end if;

  return jsonb_build_object('ok', true, 'report_id', p_report_id, 'send_status', p_status);
end;
$function$;

-- live md5 d8d58ba0ed5c2076fc14d19ce0e0c907
CREATE OR REPLACE FUNCTION public.generate_salary_report(p_period date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_period      date;
  v_report_id   integer;
  v_travel_rate numeric;
  v_total       numeric := 0;
  v_lines       jsonb;
  v_existing    record;
begin
  perform public.assert_module_permission('כספים', array['edit']);

  if p_period is null then
    raise exception 'יש לבחור חודש להפקת הדוח.' using errcode = 'P0001';
  end if;
  v_period := date_trunc('month', p_period::timestamp)::date;

  select sr.report_id, sr.sent_date, sr.report_file_url into v_existing
    from public.salary_reports sr where sr.period = v_period;
  if found then
    raise exception 'דוח לחודש % כבר הופק (מספר %). לא ניתן להפיק פעמיים אותו חודש.',
      to_char(v_period, 'MM/YYYY'), v_existing.report_id using errcode = 'P0001';
  end if;

  select coalesce(pa.param_value::numeric, 0) into v_travel_rate
    from public.params pa where pa.param_name = 'סכום_נסיעות_למשמרת';
  v_travel_rate := coalesce(v_travel_rate, 0);

  insert into public.salary_reports (period, send_status)
  values (v_period, 'pending')
  returning report_id into v_report_id;

  drop table if exists _collect;

  create temp table _collect on commit drop as
  select a.project_id, a.hostess_id, a.assignment_number,
         'actual'::text                      as line_basis,
         a.actual_hours                      as hours,
         a.hourly_rate_snapshot              as rate,
         coalesce(a.personal_bonus, 0)       as bonus,
         case when a.actual_hours > 0 then v_travel_rate else 0 end as travel
    from public.assignments a
    join public.projects p on p.project_id = a.project_id
   where a.salary_report_id is null
     and a.assignment_status = 'finally_approved'
     and a.event_date <= (v_period + interval '1 month' - interval '1 day')::date
     and p.project_status in ('awaiting_invoice', 'awaiting_payment', 'finished')
  union all
  select a.project_id, a.hostess_id, a.assignment_number,
         'cancellation_compensation'::text,
         case when p.final_start_time is null or p.final_end_time is null then null
              else extract(epoch from (p.final_end_time - p.final_start_time)) / 3600.0 end
           * (case
                when p.cancel_type = 'force_majeure' then 0
                when p.cancelled_at is null then null
                when extract(epoch from (((p.final_event_date + p.final_start_time)
                       at time zone 'Asia/Jerusalem') - p.cancelled_at)) / 3600.0
                     > (select pa.param_value::numeric from public.params pa
                          where pa.param_name = 'שעות_פיצוי_ביטול_חלקי') then 0
                when extract(epoch from (((p.final_event_date + p.final_start_time)
                       at time zone 'Asia/Jerusalem') - p.cancelled_at)) / 3600.0
                     >= (select pa.param_value::numeric from public.params pa
                          where pa.param_name = 'שעות_פיצוי_ביטול_מלא')
                  then (select pa.param_value::numeric from public.params pa
                         where pa.param_name = 'אחוז_פיצוי_ביטול_חלקי')
                else 100
              end) / 100.0                   as hours,
         a.hourly_rate_snapshot,
         0::numeric,
         0::numeric
    from public.assignments a
    join public.projects p on p.project_id = a.project_id
   where a.salary_report_id is null
     and a.released_from_status = 'finally_approved'
     and p.project_status = 'cancelled'
     and a.event_date <= (v_period + interval '1 month' - interval '1 day')::date;

  if exists (select 1 from _collect where hours is null) then
    raise exception 'לא ניתן להפיק את הדוח — לפרויקט מבוטל אחד או יותר חסרות שעות סופיות לחישוב הפיצוי.'
      using errcode = 'P0001';
  end if;

  insert into public.salary_report_lines
    (report_id, hostess_id, hostess_name, id_number, source_project_id,
     line_basis, hours, rate, bonus, travel, line_total)
  select v_report_id, c.hostess_id, h.full_name, h.id_number, c.project_id,
         c.line_basis, round(c.hours, 2), c.rate,
         nullif(c.bonus, 0),
         nullif(c.travel, 0),
         round(c.hours * c.rate + c.bonus + c.travel, 2)
    from _collect c join public.hostesses h on h.hostess_id = c.hostess_id;

  update public.assignments a
     set salary_report_id = v_report_id,
         travel_amount = c.travel
    from _collect c
   where a.project_id = c.project_id
     and a.hostess_id = c.hostess_id
     and a.assignment_number = c.assignment_number;

  select coalesce(sum(l.line_total), 0) into v_total
    from public.salary_report_lines l where l.report_id = v_report_id;

  update public.salary_reports set total_amount = v_total where report_id = v_report_id;

  select coalesce(jsonb_agg(x order by x->>'hostess_name'), '[]'::jsonb) into v_lines
    from (
      select jsonb_build_object(
               'hostess_id', l.hostess_id,
               'hostess_name', l.hostess_name,
               'id_number', l.id_number,
               'source_project_id', l.source_project_id,
               'line_basis', l.line_basis,
               'hours', l.hours,
               'rate', l.rate,
               'bonus', l.bonus,
               'travel', l.travel,
               'line_total', l.line_total,
               'bank_name', b.bank_name,
               'bank_branch', b.bank_branch,
               'bank_account', b.bank_account,
               'show_in_file', l.line_total <> 0
             ) as x
        from public.salary_report_lines l
        left join public.hostess_bank_details b on b.hostess_id = l.hostess_id
       where l.report_id = v_report_id
    ) s;

  return jsonb_build_object(
    'ok', true,
    'report_id', v_report_id,
    'period', v_period,
    'total_amount', v_total,
    'line_count', (select count(*) from public.salary_report_lines where report_id = v_report_id),
    'lines', v_lines
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.recompute_project_status(p_project_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_status text; v_required int; v_confirmed int; v_log_total int; v_log_ready int;
        v_any_human_action boolean;
begin
  select project_status, required_hostess_count into v_status, v_required
    from public.projects where project_id = p_project_id for update;

  -- 🔗 מראת §7.44 — recompute ONLY while the project is on the active axis.
  if v_status not in ('not_started','in_progress','ready') then return; end if;

  -- staffing: MAX(assignment_number) per hostess, then count finally_approved
  select count(*) into v_confirmed from (
    select distinct on (a.hostess_id) a.assignment_status from public.assignments a
     where a.project_id = p_project_id order by a.hostess_id, a.assignment_number desc) w
   where w.assignment_status = 'finally_approved';

  select count(*), count(*) filter (where item_status = 'ready')
    into v_log_total, v_log_ready from public.logistics where project_id = p_project_id;

  -- "first human action" = an assignments row exists OR an item LEFT not_started.
  -- NOT "a logistics row was created" — logistics rows are born with the project.
  select exists (select 1 from public.assignments where project_id = p_project_id)
      or exists (select 1 from public.logistics   where project_id = p_project_id
                   and item_status <> 'not_started')
    into v_any_human_action;

  if v_confirmed >= v_required
     and (v_log_total = 0 or v_log_ready = v_log_total)
  then
    update public.projects
       set project_status = case when final_event_date < current_date
                                 then 'event_finished' else 'ready' end
     where project_id = p_project_id;
  elsif v_any_human_action then
    update public.projects set project_status = 'in_progress' where project_id = p_project_id;
  else
    update public.projects set project_status = 'not_started'  where project_id = p_project_id;
  end if;
end $function$;

CREATE OR REPLACE FUNCTION public.trg_recompute_project_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_project_id int;
begin
  if tg_op = 'DELETE' then
    v_project_id := old.project_id;
  else
    v_project_id := new.project_id;
  end if;

  perform public.recompute_project_status(v_project_id);

  -- שורה שהועברה בין פרויקטים הייתה משאירה את הישן עם מדד ישן ובלי שאיש ידע.
  if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id then
    perform public.recompute_project_status(old.project_id);
  end if;

  return null;
end $function$;

CREATE OR REPLACE FUNCTION public.sync_assignment_event_date()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  select p.final_event_date into new.event_date
    from public.projects p where p.project_id = new.project_id;
  return new;
end; $function$;

CREATE OR REPLACE FUNCTION public.sync_assignments_on_project_date_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  update public.assignments set event_date = new.final_event_date
   where project_id = new.project_id;
  return null;
end; $function$;

CREATE OR REPLACE FUNCTION public.stamp_recommended_rank_set_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'INSERT' then
    if new.recommended_rank is not null then
      new.recommended_rank_set_at := now();
    end if;
  elsif new.recommended_rank is distinct from old.recommended_rank then
    new.recommended_rank_set_at :=
      case when new.recommended_rank is null then null else now() end;
  end if;
  return new;
end
$function$;

CREATE OR REPLACE FUNCTION public.enforce_hostess_min_wage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_text text; v_min numeric;
begin
  select param_value into v_text from public.params where param_name = 'שכר_מינימום_שעתי';
  if v_text is null or btrim(v_text) = '' or btrim(v_text) !~ '^[0-9]+(\.[0-9]+)?$' then
    raise exception 'שכר המינימום השעתי אינו מוגדר בהגדרות המערכת (פרמטר שכר_מינימום_שעתי) — לא ניתן לשמור דיילת'
      using errcode = 'P0001';
  end if;
  v_min := btrim(v_text)::numeric;
  if new.hourly_rate < v_min then
    raise exception 'התעריף השעתי שהוזן (%) נמוך משכר המינימום שבהגדרות המערכת (%) — לא ניתן לשמור',
      new.hourly_rate, v_min using errcode = 'P0001';
  end if;
  return new;
end; $function$;

CREATE OR REPLACE FUNCTION public.feedback_rate_limit()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_ip inet; v_recent int;
begin
  -- fail-open מכוון כשאין כותרת תקינה, בדיוק כמו במונה-הכניסה.
  begin
    v_ip := nullif(btrim(split_part(
              coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''),
              ',', 1)), '')::inet;
  exception when others then v_ip := null;
  end;

  if v_ip is null then return; end if;

  delete from public.feedback_rpc_calls where called_at < now() - interval '1 hour';

  select count(*) into v_recent
    from public.feedback_rpc_calls
   where ip = v_ip and called_at > now() - interval '1 hour';

  if v_recent >= 15 then
    raise exception 'לא ניתן להשלים את הפעולה כרגע. נסי שוב מאוחר יותר.'
      using errcode = 'P0001';
  end if;

  insert into public.feedback_rpc_calls (ip) values (v_ip);
end;
$function$;

-- Function ACLs exactly as live `proacl` (13.10.2026). Default privileges granted EXECUTE to
-- anon on creation above; live has none of that, so it is revoked first.
revoke execute on all functions in schema public from public, anon, authenticated, service_role;
grant execute on function public.current_user_role_id() to authenticated, service_role;
grant execute on function public.assert_module_permission(text, text[]) to service_role;
grant execute on function public.finalize_salary_report(integer, text, text) to authenticated, service_role;
grant execute on function public.generate_salary_report(date) to authenticated, service_role;
grant execute on function public.recompute_project_status(integer) to service_role;

-- triggers (live definitions; moddatetime → extensions stub)
CREATE TRIGGER params_set_updated_at BEFORE UPDATE ON public.params FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');
CREATE TRIGGER hostesses_enforce_min_wage BEFORE INSERT OR UPDATE OF hourly_rate ON public.hostesses FOR EACH ROW EXECUTE FUNCTION public.enforce_hostess_min_wage();
CREATE TRIGGER hostesses_set_updated_at BEFORE UPDATE ON public.hostesses FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');
CREATE TRIGGER hostess_bank_details_set_updated_at BEFORE UPDATE ON public.hostess_bank_details FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');
CREATE TRIGGER projects_recompute_on_required_count AFTER UPDATE OF required_hostess_count ON public.projects FOR EACH ROW WHEN ((old.required_hostess_count IS DISTINCT FROM new.required_hostess_count)) EXECUTE FUNCTION public.trg_recompute_project_status();
CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');
CREATE TRIGGER projects_sync_assignment_dates AFTER UPDATE OF final_event_date ON public.projects FOR EACH ROW WHEN ((old.final_event_date IS DISTINCT FROM new.final_event_date)) EXECUTE FUNCTION public.sync_assignments_on_project_date_change();
CREATE TRIGGER assignments_recommended_rank_stamp BEFORE INSERT OR UPDATE OF recommended_rank ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.stamp_recommended_rank_set_at();
CREATE TRIGGER assignments_recompute_project_status AFTER INSERT OR DELETE OR UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_project_status();
CREATE TRIGGER assignments_set_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');
CREATE TRIGGER assignments_sync_event_date BEFORE INSERT OR UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.sync_assignment_event_date();
CREATE TRIGGER salary_reports_set_updated_at BEFORE UPDATE ON public.salary_reports FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');
CREATE TRIGGER salary_report_lines_set_updated_at BEFORE UPDATE ON public.salary_report_lines FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');
CREATE TRIGGER logistics_recompute_project_status AFTER INSERT OR DELETE OR UPDATE ON public.logistics FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_project_status();
CREATE TRIGGER logistics_set_updated_at BEFORE UPDATE ON public.logistics FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

-- policies (live text, payroll-relevant tables only)
create policy modules_select_all on public.modules for select to authenticated using (true);
create policy roles_select_all on public.roles for select to authenticated using (true);
create policy permissions_select_all on public.permissions for select to authenticated using (true);
create policy params_select_all_authenticated on public.params for select to authenticated using (true);
create policy users_select_self_or_ceo on public.users for select to authenticated
  using ((email = (select auth.email())) or ((select public.current_user_role_id()) = (select roles.role_id from public.roles where roles.role_name = 'מנכ"ל')));
create policy assignments_select_by_permission on public.assignments for select to authenticated
  using (exists (select 1 from public.permissions p where p.role_id = (select public.current_user_role_id()) and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'דיילות') and p.permission_level = any (array['edit','view'])));
create policy assignments_write_by_permission on public.assignments for all to authenticated
  using (exists (select 1 from public.permissions p where p.role_id = (select public.current_user_role_id()) and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'דיילות') and p.permission_level = 'edit'))
  with check (exists (select 1 from public.permissions p where p.role_id = (select public.current_user_role_id()) and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'דיילות') and p.permission_level = 'edit'));
create policy salary_reports_select_by_permission on public.salary_reports for select to authenticated
  using (exists (select 1 from public.permissions p where p.role_id = (select public.current_user_role_id()) and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'כספים') and p.permission_level = any (array['edit','view'])));
create policy salary_report_lines_select_by_permission on public.salary_report_lines for select to authenticated
  using (exists (select 1 from public.permissions p where p.role_id = (select public.current_user_role_id()) and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'כספים') and p.permission_level = any (array['edit','view'])));
create policy email_log_select_finance_module on public.email_log for select to authenticated
  using ((entity_type = any (array['invoice','salary_report'])) and exists (select 1 from public.permissions p where p.role_id = (select public.current_user_role_id()) and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'כספים') and p.permission_level = any (array['edit','view'])));
create policy hostess_bank_details_select_finance_module on public.hostess_bank_details for select to authenticated
  using (exists (select 1 from public.permissions p where p.role_id = (select public.current_user_role_id()) and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'כספים') and p.permission_level = 'edit'));

-- storage.objects finance policies (live text, 13.10.2026)
create policy finance_read_by_permission on storage.objects for select to authenticated
  using ((bucket_id = 'finance') and exists (select 1 from public.permissions p where p.role_id = (select public.current_user_role_id()) and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'כספים') and p.permission_level = any (array['edit','view'])));
create policy finance_insert_by_permission on storage.objects for insert to authenticated
  with check ((bucket_id = 'finance') and exists (select 1 from public.permissions p where p.role_id = (select public.current_user_role_id()) and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'כספים') and p.permission_level = 'edit'));
create policy finance_update_by_permission on storage.objects for update to authenticated
  using ((bucket_id = 'finance') and exists (select 1 from public.permissions p where p.role_id = (select public.current_user_role_id()) and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'כספים') and p.permission_level = 'edit'))
  with check ((bucket_id = 'finance') and exists (select 1 from public.permissions p where p.role_id = (select public.current_user_role_id()) and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'כספים') and p.permission_level = 'edit'));
create policy finance_delete_by_permission on storage.objects for delete to authenticated
  using ((bucket_id = 'finance') and exists (select 1 from public.permissions p where p.role_id = (select public.current_user_role_id()) and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'כספים') and p.permission_level = 'edit'));

-- The live legacy writer, kept under another name so tests can compare "old" against the
-- rewritten one (migration 8) on the same fixture.
do $$
begin
  execute replace(pg_get_functiondef('public.generate_salary_report(date)'::regprocedure),
                  'FUNCTION public.generate_salary_report(', 'FUNCTION live_copy.generate_salary_report(');
  execute replace(pg_get_functiondef('public.finalize_salary_report(integer,text,text)'::regprocedure),
                  'FUNCTION public.finalize_salary_report(', 'FUNCTION live_copy.finalize_salary_report(');
end $$;
grant usage on schema live_copy to authenticated;
grant execute on all functions in schema live_copy to authenticated;
