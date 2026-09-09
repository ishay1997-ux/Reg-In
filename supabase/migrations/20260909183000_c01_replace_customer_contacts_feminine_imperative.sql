-- =============================================================================
-- C-01 של לילה שכתוב-הטקסטים (08–09/09/2026) — ניסוח-הנקבה של משפט-החסימה ב-RPC
-- `replace_customer_contacts`.
--
-- מה משתנה: מילה אחת בהודעת ה-`raise` שנזרקת כשמנסים לשמור לקוח בלי איש-קשר ראשי:
--   'אי אפשר למחוק את איש הקשר הראשי. סמן קודם אחר כראשי.'
--   ⇒ 'אי אפשר למחוק את איש הקשר הראשי. סמני קודם אחר כראשי.'
-- הפנייה ("סמן") היא למשתמשת — וכל חמש המשתמשות נשים (מדריך-הסגנון §1, הכרעת S-28).
-- "איש הקשר"/"אחר" הם איש-הקשר של הלקוח (יכול להיות גבר) — לא משתנים. המשפט הוא
-- נוסח-ישי (27/08/2026) והשינוי היחיד הוא ההטיה; הכרעת-ישי על C-01: 09/09/2026.
--
-- 🔴 הגוף נמשך מהמסד החי (pg_get_functiondef, 09/09/2026 18:3X) ולא מקובץ-המיגרציה הקודם —
-- הכלל של supabase/migrations/CLAUDE.md ("לפני CREATE OR REPLACE — למשוך את הגוף החי").
-- ההבדל היחיד מול הגוף החי: המילה "סמן" ⇒ "סמני".
--
-- הפיכוּת: מלאה — CREATE OR REPLACE חוזר עם המילה הקודמת. אין שינוי בטבלאות, בעמודות,
-- ב-RLS או בהרשאות; ה-revoke/grant חוזרים על עצמם רק כדי שלא ייווצר חלון-anon (מוקש מתועד).
-- צד-הלקוח (`CustomerFormDialog.jsx` NO_PRIMARY_MSG · api.test · CustomerFormDialog.test)
-- מיושר לאותו בייט באותו קומיט.
-- =============================================================================

create or replace function public.replace_customer_contacts(p_customer_id bigint, p_contacts jsonb)
 returns table(contact_id bigint, contact_name text, phone text, email text, is_primary boolean)
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_rows      jsonb;
  v_named     integer;
  v_primaries integer;
begin
  perform public.assert_module_permission('לקוחות', array['edit']);

  if p_customer_id is null then
    raise exception 'לא צוין לקוח.' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.customers c where c.customer_id = p_customer_id) then
    raise exception 'הלקוח המבוקש אינו קיים.' using errcode = 'P0001';
  end if;

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_rows
    from (
      select jsonb_build_object(
               'contact_name', btrim(e->>'contact_name'),
               'phone',        nullif(btrim(coalesce(e->>'phone', '')), ''),
               'email',        nullif(btrim(coalesce(e->>'email', '')), ''),
               'is_primary',   coalesce((e->>'is_primary')::boolean, false)
             ) as x
        from jsonb_array_elements(coalesce(p_contacts, '[]'::jsonb)) e
       where btrim(coalesce(e->>'contact_name', '')) <> ''
    ) s;

  select count(*) into v_named from jsonb_array_elements(v_rows);
  select count(*) into v_primaries
    from jsonb_array_elements(v_rows) e where (e->>'is_primary')::boolean;

  if v_named = 0 then
    raise exception 'לא ניתן לשמור לקוח בלי איש קשר אחד לפחות.' using errcode = 'P0001';
  end if;

  if v_primaries = 0 then
    raise exception 'אי אפשר למחוק את איש הקשר הראשי. סמני קודם אחר כראשי.'
      using errcode = 'P0001';
  end if;

  if v_primaries > 1 then
    raise exception 'ניתן לסמן איש קשר ראשי אחד בלבד.' using errcode = 'P0001';
  end if;

  delete from public.customer_contacts cc where cc.customer_id = p_customer_id;

  insert into public.customer_contacts (customer_id, contact_name, phone, email, is_primary)
  select p_customer_id, e->>'contact_name', e->>'phone', e->>'email',
         (e->>'is_primary')::boolean
    from jsonb_array_elements(v_rows) e;

  return query
    select cc.contact_id, cc.contact_name, cc.phone, cc.email, cc.is_primary
      from public.customer_contacts cc
     where cc.customer_id = p_customer_id
     order by cc.is_primary desc, cc.contact_id;
end;
$function$;

revoke all on function public.replace_customer_contacts(bigint, jsonb) from public, anon;
grant execute on function public.replace_customer_contacts(bigint, jsonb) to authenticated;
grant execute on function public.replace_customer_contacts(bigint, jsonb) to service_role;
