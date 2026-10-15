-- REH2 — data for Ishay's own evening rehearsal (14.10), so STAGE objects (1638, 1651, Sept issuance) stay untouched.
-- Written by the demo-route session [4775e9], 14.10. Applied by the deputy only. Approved in principle by the deputy;
-- Ishay: "מאשר הכל לפי המלצתך" (14.10).
--
--   G. 1650 "סדנת לקוחות", סמארט-סיטי פתרונות, 30.11.2026 18:30–22:00, מרכז הכנסים פארק המדע רחובות.
--      Measured 14.10: in_progress · required 1 · lat/lng NULL · 0 assignments · logistics 2/2 ready.
--      required 1 -> 2; lat/lng NULL -> 31.9093, 34.8076 (APPROXIMATE, Rehovot Science Park; ~20 km from the
--      4 hostesses, under the 40 km no-car goalpost). Same 4 +tag hostesses as the stage (11, 41, 28, 382).
--   H. contact 234 (סמארט-סיטי) smart.city@smart-city.co.il -> ishay1997+smart@gmail.com   (rehearsal quote target too).
--   I. contact 221 (ביו-לוג, closing practice on 1649) biolog.labs@biolog-labs.co.il -> ishay1997+biolog@gmail.com.
--   RESTORE H/I and G after 15.10 (REVERSE at the bottom).
--
-- 🔴 Precondition by design: GATE0 fails until REH 1648 is cleared — the same-day rule
--    UNIQUE (hostess_id, event_date) WHERE assignment_status='finally_approved' (migration 20260814142440:133)
--    would block finally approving Noa/Dana on 30.11 while they are finally_approved on 1648.
--    The agent's rehearsal ends by cancelling 1648 in the UI. Apply this script after that.

begin;

do $$
begin
  if exists (select 1 from assignments where hostess_id in (11,41,28,382)
             and event_date = '2026-11-30' and assignment_status = 'finally_approved') then
    raise exception 'GATE0: a demo hostess is still finally_approved on 30.11 — cancel REH 1648 first';
  end if;
  if exists (select 1 from assignments where project_id = 1650) then
    raise exception 'GATE0: 1650 already has assignments';
  end if;
  if (select count(*) from projects where project_id = 1650 and project_status = 'in_progress'
        and required_hostess_count = 1 and lat is null) <> 1 then
    raise exception 'GATE0: 1650 not in the measured state';
  end if;
  if exists (select 1 from logistics where project_id = 1650 and item_status <> 'ready') then
    raise exception 'GATE0: 1650 logistics not all ready';
  end if;
  if (select count(*) from projects where project_id = 1649 and project_status = 'event_finished') <> 1 then
    raise exception 'GATE0: 1649 is not event_finished (already closed?)';
  end if;
  if (select count(*) from customer_contacts where (contact_id = 234 and email = 'smart.city@smart-city.co.il')
        or (contact_id = 221 and email = 'biolog.labs@biolog-labs.co.il')) <> 2 then
    raise exception 'GATE0: contacts 234/221 not in the measured state';
  end if;
end $$;

create table seed_snapshot.projects_demo2_20261015 as
  select * from projects where project_id = 1650;
create table seed_snapshot.customer_contacts_demo2_20261015 as
  select * from customer_contacts where contact_id in (234,221);

do $$
declare n int;
begin
  update projects set required_hostess_count = 2, lat = 31.9093, lng = 34.8076 where project_id = 1650;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GATE G: 1650 updated %', n; end if;

  update customer_contacts set email = 'ishay1997+smart@gmail.com' where contact_id = 234;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GATE H: 234 updated %', n; end if;

  update customer_contacts set email = 'ishay1997+biolog@gmail.com' where contact_id = 221;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GATE I: 221 updated %', n; end if;

  if (select count(*) from projects where project_id = 1650 and required_hostess_count = 2 and lat is not null) <> 1
     or (select count(*) from customer_contacts where contact_id in (234,221) and email like 'ishay1997+%') <> 2
     or (select count(*) from seed_snapshot.projects_demo2_20261015) <> 1
     or (select count(*) from seed_snapshot.customer_contacts_demo2_20261015) <> 2 then
    raise exception 'AFTER-GATE failed';
  end if;
end $$;

commit;

-- proof (read-only)
select project_id, event_name, final_event_date, project_status, required_hostess_count, lat, lng,
       (select count(*) from assignments a where a.project_id = p.project_id) as assignments
from projects p where project_id in (1649,1650);
select contact_id, customer_id, email, is_primary from customer_contacts where contact_id in (221,234);

-- ═════════════════════════════════════════════════════════════════════════════
-- REVERSE (after 15.10)
-- ═════════════════════════════════════════════════════════════════════════════
-- begin;
-- update projects p set required_hostess_count = s.required_hostess_count, lat = s.lat, lng = s.lng
--   from seed_snapshot.projects_demo2_20261015 s where p.project_id = s.project_id;           -- expect 1
-- update customer_contacts c set email = s.email
--   from seed_snapshot.customer_contacts_demo2_20261015 s where c.contact_id = s.contact_id;  -- expect 2
-- commit;
