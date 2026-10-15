-- Finance catch-up, 14.10.2026. Ishay: "מאשר ותעשה עכשיו זה רק סקריפט" (~17:4x).
-- Why: the seed stopped advancing money on 01.09. No payment since, and no invoice since late August. So all 35
-- "ממתין לתשלום" rows were overdue (one since 01.2025), and 41 events sat in "ממתין לחשבונית".
-- What it does, mirroring the app's own write paths:
--   B: events that ended by 30.09 → invoice sent 3–6 days after the event (status awaiting_payment, a seed invoice file).
--      The protected objects are excluded.
--   C: pays invoices on invoice day + 20..55 days (history: 2026 average 35.9 days), never in the future.
--      The 5 most recently invoiced of the original 35 stay unpaid, as a realistic overdue tail.
--   D: archives the paid ones whose feedback is resolved and whose summary report exists, as archive_project() does:
--      final_profit = finance_project_money().gross_profit, status finished.
-- Protected: 1605 1615 1620 1638 1648 1649 1650 1651 1652.
-- Reports: מ2 counts finished/awaiting_* alike, so revenue and margin do not move.

do $$
begin
  if (select count(*) from public.projects where project_status = 'awaiting_payment' and payment_date is null) <> 35
     or (select count(*) from public.projects where project_status = 'awaiting_invoice') <> 41 then
    raise exception 'GATE0: finance not in the measured state (35 awaiting_payment / 41 awaiting_invoice)';
  end if;
  if to_regclass('seed_snapshot.finance_catchup_projects_20261014') is not null then
    raise exception 'GATE0: already ran';
  end if;
end $$;

create table seed_snapshot.finance_catchup_projects_20261014 as
  select * from public.projects where project_status in ('awaiting_payment', 'awaiting_invoice');
create table seed_snapshot.finance_catchup_pf_20261014 as
  select pf.* from public.project_finance pf
  join public.projects p using (project_id) where p.project_status in ('awaiting_payment', 'awaiting_invoice');

do $$
declare n_inv int; n_paid int; n_arch int;
  c_protected constant int[] := array[1605,1615,1620,1638,1648,1649,1650,1651,1652];
begin
  -- B: send invoices
  create temp table t_inv on commit drop as
    select project_id, final_event_date from public.projects
     where project_status = 'awaiting_invoice' and final_event_date <= date '2026-09-30'
       and not (project_id = any (c_protected));
  update public.projects p
     set invoice_sent = true,
         invoice_sent_at = ((t.final_event_date + (3 + p.project_id % 4)) + time '10:00') at time zone 'Asia/Jerusalem',
         project_status = 'awaiting_payment'
    from t_inv t where p.project_id = t.project_id;
  get diagnostics n_inv = row_count;
  insert into public.project_finance (project_id, invoice_file_url)
    select project_id, 'seed/e1_invoice.pdf' from t_inv
  on conflict (project_id) do update set invoice_file_url = coalesce(public.project_finance.invoice_file_url, excluded.invoice_file_url);

  -- C: payments
  create temp table t_keep on commit drop as
    select project_id from seed_snapshot.finance_catchup_projects_20261014
     where project_status = 'awaiting_payment' order by invoice_sent_at desc limit 5;
  update public.projects p
     set payment_date = (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date + (20 + (p.project_id * 7) % 36)
   where p.project_status = 'awaiting_payment' and p.payment_date is null
     and not (p.project_id = any (c_protected))
     and p.project_id not in (select project_id from t_keep)
     and (p.invoice_sent_at at time zone 'Asia/Jerusalem')::date + (20 + (p.project_id * 7) % 36) <= current_date - 1;
  get diagnostics n_paid = row_count;

  -- D: archive the paid ones with resolved feedback and a summary report
  create temp table t_arch on commit drop as
    select p.project_id, p.payment_date from public.projects p
     where p.project_status = 'awaiting_payment' and p.payment_date is not null
       and p.feedback_status in ('completed', 'no_response') and p.summary_report_url is not null
       and not (p.project_id = any (c_protected));
  insert into public.project_finance (project_id, final_profit, archived_at)
    select a.project_id, m.gross_profit,
           least(((a.payment_date + 2) + time '12:00') at time zone 'Asia/Jerusalem', now())
      from t_arch a cross join lateral public.finance_project_money(a.project_id) m
  on conflict (project_id) do update set final_profit = excluded.final_profit, archived_at = excluded.archived_at;
  update public.projects p set project_status = 'finished', feedback_token = null
    from t_arch a where p.project_id = a.project_id;
  get diagnostics n_arch = row_count;

  if exists (select 1 from public.projects where payment_date > current_date or invoice_sent_at > now()) then
    raise exception 'AFTER-GATE: a date in the future';
  end if;
  if exists (select 1 from public.projects where project_id = any (c_protected)
              and row(project_status, invoice_sent, payment_date) is distinct from
                  (select row(s.project_status, s.invoice_sent, s.payment_date) from seed_snapshot.finance_catchup_projects_20261014 s where s.project_id = projects.project_id)
              and project_id in (select project_id from seed_snapshot.finance_catchup_projects_20261014)) then
    raise exception 'AFTER-GATE: a protected project changed';
  end if;
  raise notice 'invoiced %, paid %, archived %', n_inv, n_paid, n_arch;
end $$;

-- REVERSE (after 15.10, if wanted):
-- update public.projects p set project_status = s.project_status, invoice_sent = s.invoice_sent,
--        invoice_sent_at = s.invoice_sent_at, payment_date = s.payment_date, feedback_token = s.feedback_token
--   from seed_snapshot.finance_catchup_projects_20261014 s where p.project_id = s.project_id;
-- delete from public.project_finance pf where pf.project_id in (select project_id from seed_snapshot.finance_catchup_projects_20261014)
--    and pf.project_id not in (select project_id from seed_snapshot.finance_catchup_pf_20261014);
-- update public.project_finance pf set final_profit = s.final_profit, archived_at = s.archived_at, invoice_file_url = s.invoice_file_url
--   from seed_snapshot.finance_catchup_pf_20261014 s where pf.project_id = s.project_id;
