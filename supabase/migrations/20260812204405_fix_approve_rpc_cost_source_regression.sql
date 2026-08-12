-- למה המיגרציה הזו קיימת: תיקון-רגרסיה אמיתי, נתפס ברהרסל-הדגמה חי (12/08/2026).
--
-- ‏31/07/2026 (round_g_fix_forward_approve_rpc_cost_source) תיקן את approve_quote_and_create_project
-- לקרוא עלות ממק"ט דרך product_costs ולא products.cost (שנמחקה אז — §7.83↳, RLS ברמת-טבלה).
-- ‏09/08/2026, מיגרציה module4_project_owner_contact_snapshot עשתה CREATE OR REPLACE FUNCTION
-- כדי להוסיף owner_email/owner_name/owner_phone לשורת-הפרויקט — ובנתה על גרסה ישנה של הפונקציה,
-- מלפני תיקון-31/07. התוצאה: השורה שקוראת עלות חזרה ל-`products pr ... pr.cost` — עמודה שלא
-- קיימת יותר מ-31/07. כל אישור-הצעה מאז 09/08/2026 נכשל בשקט עם 42703 "column pr.cost does not
-- exist". נתפס רק עכשיו כי אף הצעה לא אושרה דרך המסך האמיתי מאז המיגרציה הזו.
--
-- מה משתנה, ומה לא: שורה אחת בלבד — מקור-העלות חוזר ל-product_costs, בדיוק בנוסח של 31/07.
-- כל שאר גוף-הפונקציה (כולל עמודות owner_* שנוספו ב-09/08) נשאר זהה מילה-במילה.
--
-- הפיכוּת: להריץ CREATE OR REPLACE FUNCTION נוסף עם הגוף הקודם (מה-09/08) בכל עת. אין שינוי-סכמה,
-- אין מחיקת-דאטה — רק לוגיקת הפונקציה.

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

  -- 🔁 מקור-העלות: product_costs, לא products (§7.83↳) — זו בדיוק השורה שהוחזרה בטעות ב-09/08.
  update public.quote_services qs set closing_unit_cost = pc.cost
    from public.product_costs pc where qs.sku = pc.sku and qs.quote_id = p_quote_id;
  update public.quotes set quote_status='approved', vat_rate_snapshot = v_vat where quote_id = p_quote_id;

  insert into public.projects
    (quote_id, event_name, customer_id, customer_name, final_event_date, final_location,
     final_start_time, final_end_time, owner_email, owner_name, owner_phone,
     required_hostess_count, project_status)
  select q.quote_id, q.event_name, q.customer_id, c.company_name, q.estimated_event_date,
         q.estimated_location, q.estimated_start_time, q.estimated_end_time,
         v_caller_email, ou.full_name, ou.phone, v_hostess_count, 'not_started'
    from public.quotes q
    left join public.customers c on c.customer_id = q.customer_id
    left join public.users ou on ou.email = v_caller_email
   where q.quote_id = p_quote_id
  returning project_id into v_project_id;

  insert into public.logistics (project_id, sku, serial_number, planned_qty)
  select v_project_id, qs.sku, row_number() over (order by qs.line_number), qs.qty
    from public.quote_services qs join public.products pr on pr.sku = qs.sku
    where qs.quote_id = p_quote_id and pr.category <> 'hostess';

  return v_project_id;
end; $$;
