-- =============================================================================
-- מרשם-זריעה + שלוש פונקציות-עזר — כדי שגנרטור נתוני-ההדגמה יהיה הפיך באמת
-- =============================================================================
-- 🔴🔴🔴 **טרם הוחלה. נכתבה 03/09/2026 18:09 וממתינה לשער-ההקלדה של ישי.**
-- =============================================================================
--
-- 🎯 **למה זה נדרש (הכרעת-ישי 03/09/2026, "מאשר הכל לפי המלצתך"):**
--    ‏`docs/specs/module_07_dashboard/seed-data-spec.md` דורש ~900 פרויקטים על 32 חודשים,
--    שנכתבים **דרך אותם RPC-ים שהמסכים קוראים להם**, והפיכים ב-`--reset`. שלושה קירות
--    שנמדדו מול המסד החי ב-03/09/2026 מונעים זאת בלי עזרה מצד המסד:
--
--    ‏① **לטבלת `projects` אין מדיניות-כתיבה למשתמשים** (רק `projects_select_by_permission`).
--       הסקריפט מתחבר כמנכ"ל דרך המפתח הציבורי ⇒ כל `UPDATE`/`DELETE` ישיר על פרויקט
--       מחזיר אפס שורות בשקט. אי-אפשר לתארך אחורה `created_at` / `cancelled_at` /
--       `invoice_sent_at` / `final_event_date` של פרויקט מהסקריפט.
--    ‏② **`approve_quote_and_create_project` מסרבת לתאריך-אירוע שעבר** (*"לא ניתן לאשר הצעה
--       שתאריך-האירוע שלה עבר"*), ואחרי האישור ההצעה נעולה (§7.50) ⇒ אין דרך לייצר
--       פרויקט היסטורי במסלול הרגיל.
--    ‏③ **טריגר-הנעילה חוסם גם מחיקה** ⇒ הצעה זרועה שאושרה אינה ניתנת למחיקה, כלומר
--       ‏`--reset` אינו אפשרי. התקדים היחיד בריפו (`scripts/cleanup_test_quotes_14_15.sql`)
--       כיבה את הטריגר בטרנזקציה — **וזה בדיוק מה שלא נעשה כאן.**
--
-- 🧩 **מה המיגרציה הזו עושה, בארבעה חלקים:**
--    ‏(א) טבלה `seed_registry` — "מדבקה" על כל שורה שהגנרטור יצר (לקוח · דיילת · הצעה ·
--        פרויקט). ‏RLS דלוק **בלי policies במכוון** — הגישה רק דרך פונקציות-ה-DEFINER שכאן,
--        באותו דפוס של `login_attempts`/`project_changes`. הדמו הישן (לקוחות 46–49,
--        פרויקטים 3/7/8/13/14, חמש הדיילות) **אינו במרשם** ⇒ בלתי-נגיש לפונקציות מבנייה.
--    ‏(ב) `seed_register` — הגנרטור מדווח מה יצר.
--    ‏(ג) `seed_backdate_quote` / `seed_backdate_project` — מזיזות תאריכים של שורות **רשומות**
--        אחרי שנוצרו במסלול הרגיל (ההצעה נוצרת ומאושרת עם תאריך עתידי כמו הצעה אמיתית,
--        ואז מוזזת ל-2024). כך קיר ① ו-② נעקפים בלי לשכפל שורה אחת מגוף ה-RPC של האישור.
--    ‏(ד) `seed_reset` — מוחקת בדיוק את מה שבמרשם של אצווה נתונה, בסדר ה-FK הנכון.
--
-- 🔑 **והשינוי היחיד בקוד קיים — שורה אחת בטריגר-הנעילה:** *"אם הקריאה מגיעה מתוך פונקציית-
--    זריעה (מפתח-סשן `regin.seed_bypass`) **וגם** ההצעה רשומה במרשם — תן לעבור."*
--    · המפתח נקבע ב-`set_config(..., is_local => true)` ⇒ חי רק בטרנזקציה של הפונקציה.
--    · משתמש רגיל אינו יכול להחזיק אותו: ‏PostgREST חושף רק פונקציות ב-`public`, ו-`set_config`
--      יושבת ב-`pg_catalog`; אין SQL חופשי למשתמש מחובר.
--    · וגם אילו החזיק — ההסתייגות חלה **רק על שורות שבמרשם**, והמרשם נכתב רק דרך
--      ‏`seed_register` הגדורה למנכ"ל.
--    ⇒ **אף טריגר לא מכובה, ואף הצעה אמיתית אינה נפתחת.**
--    ⚠️ הגוף נמשך מהמסד החי ב-03/09/2026 (`pg_get_functiondef`) לפי פרוטוקול
--    ‏`supabase/migrations/CLAUDE.md`; ה-diff הוא בלוק ה-`if` הראשון בלבד.
--
-- 🔐 **שער-ההרשאה של כל הפונקציות: `edit` על 'הגדרות מערכת'** — מודול-מערכת שאינו ניתן
--    למתן מהמסך (‏`src/CLAUDE.md` §הרשאות) ⇒ בפועל מנכ"ל בלבד, בלי לקודד שם-תפקיד.
--
-- 🚫 **מה שהיא במפורש אינה עושה:** אינה נוגעת ב-`updated_at` (‏`moddatetime` דורס תמיד —
--    מגבלה מוצהרת: "פג בקרוב" אינו ניתן לזריעה ביום-הריצה) · אינה משנה עלות-מוצר בהצעות
--    היסטוריות · אינה נוגעת ב-`products`/`product_costs`/`params`.
--
-- 🔻 אימות אחרי ההחלה (קריאה בלבד, דרך ה-MCP):
--   -- (א) `select count(*) from seed_registry` ⇒ 0.
--   -- (ב) `select tgenabled from pg_trigger where tgname='quotes_lock_non_in_progress'` ⇒ 'O'.
--   -- (ג) בעסקה מתגלגלת: `update quotes set notes=notes where quote_id=6` ⇒ עדיין נזרקת
--          שגיאת-הנעילה (הצעה 6 אינה במרשם, ואין מפתח-סשן).
--   -- (ד) `select proacl from pg_proc where proname like 'seed_%'` ⇒ אין `anon=` באף אחת.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- (א) המרשם
-- ---------------------------------------------------------------------------
create table public.seed_registry (
  entity_type text        not null,
  entity_id   bigint      not null,
  batch_id    text        not null,
  created_at  timestamptz not null default now(),
  constraint seed_registry_pkey primary key (entity_type, entity_id),
  constraint seed_registry_entity_type_check
    check (entity_type = any (array['customer'::text, 'hostess'::text, 'quote'::text, 'project'::text]))
);
create index seed_registry_batch_idx on public.seed_registry (batch_id);
comment on table public.seed_registry is
  'רישום שורות שנוצרו ע"י גנרטור נתוני-ההדגמה (scripts/demo-seed.mjs). RLS דלוק בלי policies במכוון — גישה רק דרך seed_register / seed_backdate_* / seed_reset.';
alter table public.seed_registry enable row level security;

-- ---------------------------------------------------------------------------
-- (ב) רישום
-- ---------------------------------------------------------------------------
create or replace function public.seed_register(p_batch text, p_entity text, p_ids bigint[])
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare v_n integer;
begin
  perform public.assert_module_permission('הגדרות מערכת', array['edit']);
  if p_batch is null or btrim(p_batch) = '' then
    raise exception 'seed_register: חסר מזהה-אצווה' using errcode = 'P0001';
  end if;
  if p_entity not in ('customer', 'hostess', 'quote', 'project') then
    raise exception 'seed_register: סוג-ישות לא מוכר (%)', p_entity using errcode = 'P0001';
  end if;
  insert into public.seed_registry (entity_type, entity_id, batch_id)
  select p_entity, unnest(p_ids), p_batch
  on conflict (entity_type, entity_id) do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- ---------------------------------------------------------------------------
-- (ג1) תיארוך-אחורה של הצעה רשומה
--      ⚠️ נקראת אחרי האישור/הדחייה. `updated_at` יתקבע ל-now() ע"י moddatetime — מוצהר.
-- ---------------------------------------------------------------------------
create or replace function public.seed_backdate_quote(
  p_quote_id             integer,
  p_created_at           timestamptz,
  p_issue_date           date,
  p_estimated_event_date date,
  p_vat_rate_snapshot    numeric default null
)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare v_n integer;
begin
  perform public.assert_module_permission('הגדרות מערכת', array['edit']);
  if not exists (select 1 from public.seed_registry r
                  where r.entity_type = 'quote' and r.entity_id = p_quote_id) then
    raise exception 'seed_backdate_quote: הצעה % אינה במרשם-הזריעה — לא נוגעים בה', p_quote_id
      using errcode = 'P0001';
  end if;
  perform pg_catalog.set_config('regin.seed_bypass', 'on', true);
  update public.quotes
     set created_at           = coalesce(p_created_at, created_at),
         issue_date           = coalesce(p_issue_date, issue_date),
         estimated_event_date = coalesce(p_estimated_event_date, estimated_event_date),
         vat_rate_snapshot    = coalesce(p_vat_rate_snapshot, vat_rate_snapshot)
   where quote_id = p_quote_id;
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'seed_backdate_quote: הצעה % לא עודכנה', p_quote_id using errcode = 'P0001';
  end if;
  update public.quote_services
     set created_at = coalesce(p_created_at, created_at)
   where quote_id = p_quote_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- (ג2) תיארוך-אחורה של פרויקט רשום
--      · שינוי `final_event_date` מפעיל את `projects_sync_assignment_dates` (השיבוצים זזים
--        איתו) ⇒ בדיוק ההתנהגות של המערכת, לא עקיפה שלה.
--      · אחרי התיארוך מוחל **אותו כלל בדיוק** של עבודת-הלילה `module6-event-finished`
--        על הפרויקט הזה בלבד — כדי שהגנרטור לא יחכה למחרת.
--      · `archived_at` יושב ב-`project_finance` (ילד של projects) ומטופל כאן באותה קריאה.
-- ---------------------------------------------------------------------------
create or replace function public.seed_backdate_project(
  p_project_id              integer,
  p_created_at              timestamptz default null,
  p_final_event_date        date        default null,
  p_cancelled_at            timestamptz default null,
  p_operationally_closed_at timestamptz default null,
  p_invoice_sent_at         timestamptz default null,
  p_archived_at             timestamptz default null
)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare v_n integer; v_status text;
begin
  perform public.assert_module_permission('הגדרות מערכת', array['edit']);
  if not exists (select 1 from public.seed_registry r
                  where r.entity_type = 'project' and r.entity_id = p_project_id) then
    raise exception 'seed_backdate_project: פרויקט % אינו במרשם-הזריעה — לא נוגעים בו', p_project_id
      using errcode = 'P0001';
  end if;

  update public.projects
     set created_at              = coalesce(p_created_at, created_at),
         final_event_date        = coalesce(p_final_event_date, final_event_date),
         cancelled_at            = coalesce(p_cancelled_at, cancelled_at),
         operationally_closed_at = coalesce(p_operationally_closed_at, operationally_closed_at),
         invoice_sent_at         = coalesce(p_invoice_sent_at, invoice_sent_at)
   where project_id = p_project_id;
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'seed_backdate_project: פרויקט % לא עודכן', p_project_id using errcode = 'P0001';
  end if;

  if p_archived_at is not null then
    update public.project_finance set archived_at = p_archived_at where project_id = p_project_id;
  end if;

  -- העתק-בייט של הכלל ב-cron `module6-event-finished`, מצומצם לפרויקט הזה.
  update public.projects
     set project_status = 'event_finished'
   where project_id = p_project_id
     and project_status in ('not_started', 'in_progress', 'ready')
     and final_event_date < current_date;

  select project_status into v_status from public.projects where project_id = p_project_id;
  return v_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- (ד) איפוס אצווה — מוחקת רק מה שבמרשם, בסדר ה-FK:
--     project_finance (restrict) → projects (cascade: assignments/logistics/project_changes)
--     → quotes (cascade: quote_services; הנעילה עוברת בזכות המפתח + המרשם)
--     → customers (cascade: contacts/preferences) → hostesses (cascade: unavailability/
--     languages/bank/preferences) → שורות-המרשם עצמן.
--     🔴 כל FK-restrict שלא כוסה (למשל דיילת רשומה עם שורת-דוח-שכר) מפיל את הקריאה בקול —
--     וזו ההתנהגות הרצויה: אצווה שאי-אפשר להסיר בשלמותה אינה מוסרת בחלקה.
-- ---------------------------------------------------------------------------
create or replace function public.seed_reset(p_batch text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare v_projects int; v_quotes int; v_customers int; v_hostesses int; v_registry int;
begin
  perform public.assert_module_permission('הגדרות מערכת', array['edit']);
  if p_batch is null or btrim(p_batch) = '' then
    raise exception 'seed_reset: חסר מזהה-אצווה' using errcode = 'P0001';
  end if;
  perform pg_catalog.set_config('regin.seed_bypass', 'on', true);

  delete from public.project_finance pf
   where pf.project_id in (select r.entity_id from public.seed_registry r
                            where r.batch_id = p_batch and r.entity_type = 'project');
  delete from public.projects p
   where p.project_id in (select r.entity_id from public.seed_registry r
                           where r.batch_id = p_batch and r.entity_type = 'project');
  get diagnostics v_projects = row_count;

  delete from public.quotes q
   where q.quote_id in (select r.entity_id from public.seed_registry r
                         where r.batch_id = p_batch and r.entity_type = 'quote');
  get diagnostics v_quotes = row_count;

  delete from public.customers c
   where c.customer_id in (select r.entity_id from public.seed_registry r
                            where r.batch_id = p_batch and r.entity_type = 'customer');
  get diagnostics v_customers = row_count;

  delete from public.hostesses h
   where h.hostess_id in (select r.entity_id from public.seed_registry r
                           where r.batch_id = p_batch and r.entity_type = 'hostess');
  get diagnostics v_hostesses = row_count;

  delete from public.seed_registry r where r.batch_id = p_batch;
  get diagnostics v_registry = row_count;

  return jsonb_build_object(
    'batch', p_batch, 'projects', v_projects, 'quotes', v_quotes,
    'customers', v_customers, 'hostesses', v_hostesses, 'registry_rows', v_registry);
end;
$$;

-- ---------------------------------------------------------------------------
-- הרשאות — הדפוס הקיים (מיגרציית מ4-D): revoke מכולם, grant ל-authenticated; השער בגוף.
-- ---------------------------------------------------------------------------
revoke execute on function public.seed_register(text, text, bigint[]) from public, anon, authenticated;
revoke execute on function public.seed_backdate_quote(integer, timestamptz, date, date, numeric) from public, anon, authenticated;
revoke execute on function public.seed_backdate_project(integer, timestamptz, date, timestamptz, timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.seed_reset(text) from public, anon, authenticated;
grant  execute on function public.seed_register(text, text, bigint[]) to authenticated;
grant  execute on function public.seed_backdate_quote(integer, timestamptz, date, date, numeric) to authenticated;
grant  execute on function public.seed_backdate_project(integer, timestamptz, date, timestamptz, timestamptz, timestamptz, timestamptz) to authenticated;
grant  execute on function public.seed_reset(text) to authenticated;

-- ---------------------------------------------------------------------------
-- השינוי היחיד בקוד קיים: ההסתייגות בטריגר-הנעילה (§7.50).
-- הגוף נמשך מהמסד החי 03/09/2026; ה-diff = בלוק ה-if הראשון. הטריגרים עצמם
-- (`quotes_lock_non_in_progress`, `quote_services_lock_non_in_progress`) אינם נוגעים.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_quote_in_progress_lock()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare v_status text;
begin
  -- מרשם-הזריעה (03/09/2026): מעבר חופשי רק כששני התנאים מתקיימים — מפתח-הסשן שרק
  -- seed_backdate_quote/seed_reset קובעות, **וגם** ההצעה רשומה במרשם. הצעה אמיתית
  -- לעולם אינה במרשם ⇒ הנעילה עליה לא נחלשה בגרם.
  if pg_catalog.current_setting('regin.seed_bypass', true) = 'on'
     and exists (select 1 from public.seed_registry r
                  where r.entity_type = 'quote' and r.entity_id = OLD.quote_id) then
    return case when TG_OP = 'DELETE' then OLD else NEW end;
  end if;

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
end;
$$;
