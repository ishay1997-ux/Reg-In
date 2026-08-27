-- למה: M5-3 — אדווה לקוד מוזג של מודול 3 (אושרה ע"י ישי 21/08/2026).
-- approve_quote_and_create_project יוצר שורות-לוגיסטיקה בלי מצביע-מקור ובלי צבע:
-- העמודה quote_service_line_id נוצרה ע"י M6-5 בדיוק בשביל "אותו מק"ט בשני צבעים ⇒
-- שורות בלתי-ניתנות-להבחנה", ואין לה כותב — נמדד חי 26/08/2026: 0/6 שורות מלאות.
-- מה משתנה: ה-INSERT ללוגיסטיקה מקבל שתי עמודות — qs.line_id → quote_service_line_id
-- ו-qs.color → color (⑱ — הצבע נוסע עם השורה). זה כל ה-diff; שאר הגוף הועתק
-- מ-pg_get_functiondef החי (26/08/2026), לא מקובץ-מיגרציה ישן — הלקח מ-12/08
-- (supabase/migrations/CLAUDE.md): מע"מ, מקור-העלות product_costs, נעילת-ההצעה
-- וגזירת required_hostess_count — כולם זהים-בייט לגוף החי.
-- + backfill חד-פעמי (AR-6): מילוי quote_service_line_id בשורות קיימות שההתאמה
-- (פרויקט→הצעה, מק"ט) שלהן חד-משמעית (count=1; נמדד: כל 6 השורות החיות עומדות בזה,
-- כולן נולדו מאישור-הצעה). color נשאר NULL בשורות ישנות (G14 — נמדד: כל 9 שורות
-- quote_services הרלוונטיות נושאות color=NULL ממילא, אפס השפעה חזותית).
-- שורות שנולדו משינוי-תכולה נשארות NULL בכוונה (㉗ — מגבלה מוצהרת, 🚧 מ11 ← מ5).
-- תלות: מיגרציה A (module5_logistics_hardening) חייבת לרוץ קודם — היא יוצרת את color.
-- הפיכות: הפונקציה ניתנת לשחזור מהגוף הקודם; ה-backfill הפיך (איפוס העמודה ל-NULL).

CREATE OR REPLACE FUNCTION public.approve_quote_and_create_project(p_quote_id integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

  -- M5-3: שתי העמודות החדשות — מצביע-המקור (⑫) והצבע (⑱). זה ה-diff היחיד בפונקציה.
  insert into public.logistics (project_id, sku, serial_number, planned_qty, quote_service_line_id, color)
  select v_project_id, qs.sku, row_number() over (order by qs.line_number), qs.qty, qs.line_id, qs.color
    from public.quote_services qs join public.products pr on pr.sku = qs.sku
    where qs.quote_id = p_quote_id and pr.category <> 'hostess';

  return v_project_id;
end; $function$;

-- backfill (AR-6): מצביע בלבד, ורק כשההתאמה חד-משמעית. color נשאר NULL בשורות ישנות (G14).
update public.logistics l
   set quote_service_line_id = qs.line_id
  from public.projects p
  join public.quote_services qs on qs.quote_id = p.quote_id
 where p.project_id = l.project_id
   and qs.sku = l.sku
   and l.quote_service_line_id is null
   and l.project_change_id is null
   and (select count(*) from public.quote_services q2
         where q2.quote_id = p.quote_id and q2.sku = l.sku) = 1;
