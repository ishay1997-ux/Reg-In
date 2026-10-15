-- Conference demo data — 15.10.2026 09:00 stage. Written by the demo-route session [4775e9], 14.10 ~12:30.
-- Applied by the deputy only (root CLAUDE.md §2.4). Ishay approved the route and today's writes: "מאשר הכל לפי המלצתך" (14.10).
--
-- What this does (all reversible, see REVERSE at the bottom):
--   A. 4 demo hostesses -> ishay1997+<tag>@gmail.com, so invite / final / release mails reach Ishay's inbox.
--      send-email guards salary_report only (index.ts:177); invites go to the stored address.
--        11  נועה שגיא   (car, Ramat Gan, 4.7 km from Dan Panorama)   -> +noa     [was ishay1997@gmail.com]
--        41  דנה לוין    (no car, Tel Aviv, 0.7 km)                   -> +dana    [was ishay1997@gmail.com]
--        28  נטע הרוש    (car, Rishon, 8.5 km)                         -> +neta
--        382 שלי אלקיים  (no car, Ramat Gan, 5.1 km, new, no history)  -> +shelly
--      Stage plan: invite all 4 -> Noa, Dana, Neta confirm, Shelly declines -> final Noa + Dana -> Neta auto-released.
--      All 4 are under goalpost 40 km (no-car rule, smartMatch.js:493) and under gate 80 km.
--      Selected by: active, lat set, NO assignment in Sept 2026 (outside payroll), NO assignment on 30.11/01.12, no unavailability there.
--   B. STAGE project 1638 "כנס סוף שנה", מיטב מוצרי חשמל, 01.12.2026 08:30–16:00, מלון דן פנורמה תל אביב.
--      required 5 -> 2; lat/lng were NULL -> copied from 1649 (same venue: 32.064731, 34.7632536). Logistics already ready (1/1).
--   C. REH project 1648 "יריד תעסוקה", הדר מערכות רפואיות, 30.11.2026 19:00–00:00, אקספו תל אביב ביתן 10.
--      required 6 -> 2; lat/lng were NULL -> copied from 1620 (Expo TLV: 32.1063, 34.8102). Logistics ready (3/3).
--      Its customer contact 322 is ALREADY ishay1997@gmail.com -> the rehearsal quote also goes to הדר (not OpenU).
--   D. OpenU contact 321 (רונית שמלו) <כתובת-צד-שלישי-הוסרה> -> ishay1997+openu@gmail.com.   RESTORE AFTER 15.10.
--      Reason: closing 1651 mails the primary contact (summary + survey) and the screen can't change it.
--      On stage the coordinator's address is typed by hand in the quote dialog (editable recipient).
--   F. Stage closing project 1651: final times 08:47–13:47 (seed noise) -> 09:00–14:00. Same 5 h; date unchanged; only moddatetime fires.
--      Deputy checked: assignments have no time columns; projects.actual_hours is NULL.
--   E. Rehearsal closing project 1605 (פרימיום אירועים) contact 260 -> ishay1997+premium@gmail.com.   RESTORE AFTER 15.10.
--
-- NOT touched: 1615, 1620 (frozen), 1651 except its two time fields (item F), payroll tables.
-- Expected side effect later: cancelling REH 1648 after the rehearsal sends release mails to the +tag addresses.

begin;

-- ── 0. preconditions (raise = nothing changes) ───────────────────────────────
do $$
begin
  if exists (select 1 from assignments where project_id in (1638, 1648)) then
    raise exception 'GATE0: 1638/1648 already have assignments';
  end if;
  if exists (select 1 from assignments where hostess_id in (11,41,28,382)
             and (event_date in ('2026-11-30','2026-12-01') or event_date between '2026-09-01' and '2026-09-30')) then
    raise exception 'GATE0: a demo hostess has an assignment on 30.11/01.12 or in September';
  end if;
  if exists (select 1 from hostess_unavailability where hostess_id in (11,41,28,382)
             and start_date <= '2026-12-01' and end_date >= '2026-11-30') then
    raise exception 'GATE0: a demo hostess is unavailable on 30.11/01.12';
  end if;
  if (select count(*) from hostesses where hostess_id in (11,41,28,382) and status = 'active' and lat is not null) <> 4 then
    raise exception 'GATE0: expected 4 active located hostesses';
  end if;
  if (select count(*) from projects where project_id in (1638,1648) and project_status = 'in_progress'
        and lat is null and required_hostess_count in (5,6)) <> 2 then
    raise exception 'GATE0: 1638/1648 not in the measured state (in_progress, lat null, required 5/6)';
  end if;
  if (select count(*) from projects where project_id = 1651 and final_start_time = '08:47' and final_end_time = '13:47') <> 1 then
    raise exception 'GATE0: 1651 times not 08:47-13:47';
  end if;
  if exists (select 1 from logistics where project_id in (1638,1648) and item_status <> 'ready') then
    raise exception 'GATE0: logistics of 1638/1648 not all ready';
  end if;
  if (select count(*) from customer_contacts where (contact_id = 321 and email = '<כתובת-צד-שלישי-הוסרה>')
        or (contact_id = 260 and email = 'premium.events@premium-events.co.il')
        or (contact_id = 322 and email = 'ishay1997@gmail.com')) <> 3 then
    raise exception 'GATE0: contacts 321/260/322 not in the measured state';
  end if;
end $$;

-- ── 1. backups (exact rows touched) ──────────────────────────────────────────
create table seed_snapshot.hostesses_demo_20261015 as
  select * from hostesses where hostess_id in (11,41,28,382);
create table seed_snapshot.projects_demo_20261015 as
  select * from projects where project_id in (1638,1648,1651);
create table seed_snapshot.customer_contacts_demo_20261015 as
  select * from customer_contacts where contact_id in (321,260);

-- ── 2. writes, each with a row-count gate ────────────────────────────────────
do $$
declare n int;
begin
  update hostesses set email = case hostess_id
      when 11 then 'ishay1997+noa@gmail.com'
      when 41 then 'ishay1997+dana@gmail.com'
      when 28 then 'ishay1997+neta@gmail.com'
      when 382 then 'ishay1997+shelly@gmail.com' end,
    updated_at = now()
  where hostess_id in (11,41,28,382);
  get diagnostics n = row_count;
  if n <> 4 then raise exception 'GATE A: hostesses updated %', n; end if;

  update projects set required_hostess_count = 2, lat = 32.064731, lng = 34.7632536, updated_at = now()
  where project_id = 1638;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GATE B: 1638 updated %', n; end if;

  update projects set required_hostess_count = 2, lat = 32.1063, lng = 34.8102, updated_at = now()
  where project_id = 1648;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GATE C: 1648 updated %', n; end if;

  update projects set final_start_time = '09:00', final_end_time = '14:00', updated_at = now()
  where project_id = 1651;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GATE F: 1651 updated %', n; end if;

  update customer_contacts set email = 'ishay1997+openu@gmail.com', updated_at = now() where contact_id = 321;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GATE D: 321 updated %', n; end if;

  update customer_contacts set email = 'ishay1997+premium@gmail.com', updated_at = now() where contact_id = 260;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'GATE E: 260 updated %', n; end if;
end $$;

-- ── 3. after-gate ────────────────────────────────────────────────────────────
do $$
begin
  if (select count(*) from hostesses where email like 'ishay1997+%@gmail.com' and hostess_id in (11,41,28,382)) <> 4
     or (select count(*) from projects where project_id in (1638,1648) and required_hostess_count = 2 and lat is not null) <> 2
     or (select count(*) from customer_contacts where contact_id in (321,260) and email like 'ishay1997+%') <> 2
     or (select count(*) from projects where project_id = 1651 and final_start_time = '09:00' and final_end_time = '14:00') <> 1
     or (select count(*) from seed_snapshot.hostesses_demo_20261015) <> 4
     or (select count(*) from seed_snapshot.projects_demo_20261015) <> 3
     or (select count(*) from seed_snapshot.customer_contacts_demo_20261015) <> 2 then
    raise exception 'AFTER-GATE failed';
  end if;
end $$;

commit;

-- ── 4. proof (read-only) ─────────────────────────────────────────────────────
select hostess_id, full_name, email, has_car from hostesses where hostess_id in (11,41,28,382) order by hostess_id;
select project_id, event_name, final_event_date, final_start_time, final_end_time, project_status, required_hostess_count, lat, lng,
       (select count(*) from assignments a where a.project_id = p.project_id) as assignments
from projects p where project_id in (1638,1648,1651);
select contact_id, customer_id, contact_name, email, is_primary from customer_contacts where contact_id in (260,321,322);

-- ═════════════════════════════════════════════════════════════════════════════
-- REVERSE (run after the conference; D/E = "restore after 15.10").
-- Note: assignments created on 1638/1648 by the rehearsal/stage are NOT reverted here — they are real
-- history of the demo. Cancelling REH 1648 is a UI action (sends release mails to the +tags).
-- ═════════════════════════════════════════════════════════════════════════════
-- begin;
-- update hostesses h set email = s.email, updated_at = now()
--   from seed_snapshot.hostesses_demo_20261015 s where h.hostess_id = s.hostess_id;          -- expect 4
-- update projects p set required_hostess_count = s.required_hostess_count, lat = s.lat, lng = s.lng,
--        final_start_time = s.final_start_time, final_end_time = s.final_end_time, updated_at = now()
--   from seed_snapshot.projects_demo_20261015 s where p.project_id = s.project_id;            -- expect 3 (1638,1648,1651)
-- update customer_contacts c set email = s.email, updated_at = now()
--   from seed_snapshot.customer_contacts_demo_20261015 s where c.contact_id = s.contact_id;   -- expect 2
-- commit;
