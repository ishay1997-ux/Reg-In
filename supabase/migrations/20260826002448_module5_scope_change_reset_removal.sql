-- למה: M5-4 + M5-7 — שתי אדוות מאושרות לקוד מוזג של מודול 6 (apply_scope_change).
-- הגוף הועתק מ-pg_get_functiondef החי (26/08/2026), לא מקובץ-מיגרציה ישן (הלקח מ-12/08).
-- ארבעה שינויים, ורק הם:
--   ① M5-4 (הכרעת-ישי ⑪ · C5 §5.6.8): הגדלת-כמות על שורה קיימת מחזירה את הפריט
--     ל-not_started — ורק את הסטטוס (㉟): הסחורה שכבר הגיעה לא נעלמה, actual_qty לא נגוע.
--     הקטנה אינה מאפסת דבר. נמדד לפני: item_status הופיע אפס פעמים בפונקציה.
--   ② M5-7 (הכרעת-ישי ㊳): ההודעה הגורפת "להסרת פריט לגמרי — פני למנהלת הלוגיסטיקה"
--     (נוסח-שגיאה שהפך שקרי) הוסרה; אפס על שורת-לוגיסטיקה קיימת = הסרה: שומר בן שני
--     תנאים (㊱ — not_started וגם actual_qty=0, שתי הודעות-סירוב שונות בכוונה ㉚),
--     רישום project_changes (דלתא שלילית, מחיר-מוקפא, סיבה שכבר חובה ㉖) ואז מחיקת
--     השורה — באותה טרנזקציה, אטומית. טריגר-הסטטוס של מ6 מאזין גם ל-DELETE ומעדכן.
--     פתרון-המחיר מצביע-תחילה (AR-6): quote_service_line_id כשקיים (בדיקת-הכפילות
--     מדולגת — המצביע הוא ההכרעה, G11c); אחרת המסלול הקיים (quote_id, sku), ושורה
--     שאינה ניתנת לפתרון מקבלת הודעה משלה (G11a).
--   ③ G5 (ישי 25/08): כמות-דיילות אפס/שלילית מקבלת הודעה חדשה — "כמות הדיילות חייבת
--     להיות גדולה מאפס." (AR-9: המראה בצד-לקוח מסונכרנת בצעד 4.2, בייט-זהה).
--   ④ G11b (ישי 25/08): פריט חדש עם כמות אפס — "כמות של פריט חדש חייבת להיות גדולה מאפס."
-- זהירות-רגרסיה: כל השאר — שערי-ההרשאה, שער-הקריאה הפיננסי, נעילות-הסטטוס, מסלול
-- הפריט-החדש, שורת-הדיילות, ההחזרה — זהים-בייט לגוף החי. diff מלא מאומת אחרי ההחלה.
-- הפיכות: הפונקציה ניתנת לשחזור מהגוף הקודם; שורה שנמחקה ב-M5-7 אינה ניתנת לשחזור —
-- וזו בדיוק ההתנהגות המוזמנת (ההיסטוריה נשארת ב-project_changes).

CREATE OR REPLACE FUNCTION public.apply_scope_change(p_project_id integer, p_lines jsonb, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor           text;
  v_can_read_quotes boolean;
  v_reason          text;
  v_status          text;
  v_closed_at       timestamptz;
  v_quote_id        integer;
  v_required_now    integer;
  v_group           uuid;
  v_line            jsonb;
  v_target          text;
  v_sku             text;
  v_serial          integer;
  v_is_new          boolean;
  v_new_qty         integer;
  v_qty_raw         numeric;
  v_key             text;
  v_seen            text[] := '{}';
  v_category        text;
  v_prod_status     text;
  v_base_price      numeric;
  v_q_count         integer;
  v_q_color         text;
  v_q_price         numeric;
  v_q_cost          numeric;
  v_current         integer;
  v_delta           integer;
  v_revenue         numeric(14,2);
  v_lines_out       jsonb := '[]'::jsonb;
  v_total           numeric(14,2) := 0;
  v_hours           integer;
  v_item_status     text;
  v_actual_qty      integer;
  v_qs_line_id      bigint;
  v_is_removal      boolean := false;
begin
  perform public.assert_module_permission('פרויקטים', array['edit']);

  -- שער-הקריאה הפיננסי (S-2 · screens-approved:809). NULL ולא 0.
  select exists (
    select 1
      from public.permissions p
     where p.role_id = (select public.current_user_role_id())
       and p.module_id = (select m.module_id from public.modules m where m.module_name = 'הצעות מחיר')
       and p.permission_level = any(array['edit', 'view'])
  ) into v_can_read_quotes;

  v_actor := auth.email();
  if v_actor is null then
    raise exception 'לא זוהתה משתמשת מחוברת. התחברי מחדש ונסי שוב.' using errcode = '42501';
  end if;

  v_reason := btrim(coalesce(p_reason, ''));
  if v_reason = '' then
    raise exception 'חובה למלא סיבה — היא מה שיסביר את החיוב הזה בעוד חודש.'
      using errcode = 'P0001';
  end if;

  if p_lines is null or jsonb_typeof(p_lines) is distinct from 'array' then
    raise exception 'לא נשלחה אף שורה לשינוי.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_lines) = 0 then
    raise exception 'לא נשלחה אף שורה לשינוי.' using errcode = 'P0001';
  end if;

  select p.project_status, p.operationally_closed_at, p.quote_id, p.required_hostess_count
    into v_status, v_closed_at, v_quote_id, v_required_now
    from public.projects p
   where p.project_id = p_project_id
   for update;

  if not found then
    raise exception 'הפרויקט המבוקש אינו קיים.' using errcode = 'P0001';
  end if;

  -- ㉙ — הנעילה תלויה בסגירה התפעולית, לא בכך שהתאריך עבר. חלון-הסגירה פתוח (㉔ + B7).
  if v_status = 'cancelled' then
    raise exception 'הפרויקט בוטל ולא ניתן לשנות את תכולתו.' using errcode = 'P0001';
  end if;
  if v_closed_at is not null
     or v_status in ('awaiting_invoice', 'awaiting_payment', 'finished') then
    raise exception 'האירוע כבר נסגר תפעולית ולא ניתן לשנות את תכולתו.'
      using errcode = 'P0001';
  end if;

  if v_quote_id is null then
    raise exception 'לפרויקט אין הצעת מחיר משויכת, ולכן אין מחיר מוקפא לרשום לשינוי.'
      using errcode = 'P0001';
  end if;

  v_group := pg_catalog.gen_random_uuid();

  for v_line in select je.value from jsonb_array_elements(p_lines) je loop
    if jsonb_typeof(v_line) is distinct from 'object' then
      raise exception 'אחת השורות בבקשה אינה תקינה. השינוי לא בוצע.' using errcode = 'P0001';
    end if;

    v_target := btrim(coalesce(v_line ->> 'target', ''));
    if v_target not in ('logistics', 'hostess_count') then
      raise exception 'שורה בבקשה נשלחה בלי סוג יעד תקין. השינוי לא בוצע.' using errcode = 'P0001';
    end if;

    if jsonb_typeof(v_line -> 'target_qty') is distinct from 'number' then
      raise exception 'שורה בבקשה נשלחה בלי כמות חדשה. השינוי לא בוצע.' using errcode = 'P0001';
    end if;
    v_qty_raw := (v_line ->> 'target_qty')::numeric;
    if v_qty_raw <> trunc(v_qty_raw) then
      raise exception 'הכמות חייבת להיות מספר שלם. השינוי לא בוצע.' using errcode = 'P0001';
    end if;
    v_new_qty := v_qty_raw::integer;

    -- M5-7/㊳: ההודעה הגורפת הוסרה — אפס בשורת-לוגיסטיקה קיימת הוא הסרה, ונבדק בהמשך,
    -- אחרי שידוע אם השורה קיימת. לדיילות אפס נשאר אסור (AR-10), וההודעה קודמת ל-CHECK
    -- כי CHECK מדבר אנגלית (G5, ישי 25/08).
    if v_target = 'hostess_count' and v_new_qty <= 0 then
      raise exception 'כמות הדיילות חייבת להיות גדולה מאפס.' using errcode = 'P0001';
    end if;

    if v_target = 'logistics' then
      v_sku := btrim(coalesce(v_line ->> 'sku', ''));
      if v_sku = '' then
        raise exception 'שורת פריט נשלחה בלי מק"ט. השינוי לא בוצע.' using errcode = 'P0001';
      end if;
      v_is_new := jsonb_typeof(v_line -> 'serial_number') is distinct from 'number';
      if v_is_new then
        v_serial := null;
        v_key    := v_sku || '#new';
      else
        v_serial := (v_line ->> 'serial_number')::integer;
        v_key    := v_sku || '#' || v_serial::text;
      end if;
      -- G11b (ישי 25/08): פריט חדש חייב כמות חיובית — אין "הסרה" של מה שטרם קיים
      if v_is_new and v_new_qty <= 0 then
        raise exception 'כמות של פריט חדש חייבת להיות גדולה מאפס. השינוי לא בוצע.' using errcode = 'P0001';
      end if;
      -- שלילי על שורה קיימת אינו הסרה ואינו כמות — נחסם לפני כל דבר אחר
      if (not v_is_new) and v_new_qty < 0 then
        raise exception 'הכמות אינה יכולה להיות שלילית. השינוי לא בוצע.' using errcode = 'P0001';
      end if;
    else
      v_is_new := false;
      if jsonb_typeof(v_line -> 'serial_number') = 'number' then
        raise exception 'שורת הדיילות נשלחת בלי מספר סידורי. השינוי לא בוצע.' using errcode = 'P0001';
      end if;
      v_sku    := null;
      v_serial := null;
      v_key    := 'hostess_count';
    end if;

    if v_key = any(v_seen) then
      raise exception 'אותה שורה נשלחה פעמיים באותה בקשה. השינוי לא בוצע.' using errcode = 'P0001';
    end if;
    v_seen := v_seen || v_key;

    if v_target = 'logistics' then
      select pr.category, pr.status, pr.base_price
        into v_category, v_prod_status, v_base_price
        from public.products pr where pr.sku = v_sku;

      if not found then
        raise exception 'המק"ט שנשלח אינו קיים בקטלוג המוצרים. השינוי לא בוצע.' using errcode = 'P0001';
      end if;
      if v_category = 'hostess' then
        raise exception 'המק"ט שנשלח הוא שורת דיילות ולא פריט. השינוי לא בוצע.' using errcode = 'P0001';
      end if;

      if not v_is_new then
        -- מסלול א' · שורה קיימת — המחיר מוקפא מההצעה (③ↄ). שלושת חלקי logistics_pkey.
        -- M5-7: נשלפים גם המצב, הכמות-בפועל והמצביע — שומר-ההסרה ופתרון-המחיר צריכים אותם.
        select l.planned_qty, l.item_status, l.actual_qty, l.quote_service_line_id
          into v_current, v_item_status, v_actual_qty, v_qs_line_id
          from public.logistics l
         where l.project_id = p_project_id
           and l.sku = v_sku
           and l.serial_number = v_serial
         for update;

        if not found then
          raise exception 'לא נמצאה שורת לוגיסטיקה תואמת לפריט הזה בפרויקט. להוספת פריט חדש שלחי את השורה בלי מספר סידורי. השינוי לא בוצע.'
            using errcode = 'P0001';
        end if;

        if v_new_qty = 0 then
          -- M5-7 (㊳): אפס = הסרה. השומר בן שני התנאים (㊱) — שתי הודעות שונות בכוונה,
          -- כדי שתדע איזה משני החוקים חסם אותה (㉚).
          if v_item_status in ('ordered', 'ready') then
            raise exception 'הפריט כבר הוזמן — לא ניתן להסירו' using errcode = 'P0001';
          end if;
          if v_actual_qty > 0 then
            raise exception 'הגיעו כבר פריטים — לא ניתן להסיר' using errcode = 'P0001';
          end if;

          -- פתרון-מחיר מצביע-תחילה (AR-6); מצביע פתור ⇒ בדיקת-הכפילות מדולגת (G11c)
          if v_qs_line_id is not null then
            select qs.color, qs.closing_unit_price, qs.closing_unit_cost
              into v_q_color, v_q_price, v_q_cost
              from public.quote_services qs
             where qs.line_id = v_qs_line_id;
          else
            select count(*)::integer into v_q_count
              from public.quote_services qs
             where qs.quote_id = v_quote_id and qs.sku = v_sku;

            if v_q_count = 0 then
              -- G11a: מחלקת-㉗ — שורה שנולדה משינוי-תכולה בלי מצביע; אין מחיר לרשום להסרה
              raise exception 'לפריט אין שורת-מחיר מקושרת — לא ניתן להסירו מהמסך.'
                using errcode = 'P0001';
            end if;
            if v_q_count > 1 then
              raise exception 'למק"ט הזה יש יותר משורה אחת בהצעת המחיר, ולכן לא ברור לפי איזה מחיר לחייב. השינוי לא בוצע.'
                using errcode = 'P0001';
            end if;

            select qs.color, qs.closing_unit_price, qs.closing_unit_cost
              into v_q_color, v_q_price, v_q_cost
              from public.quote_services qs
             where qs.quote_id = v_quote_id and qs.sku = v_sku;
          end if;

          v_delta      := -v_current;
          v_is_removal := true;
        else
          select count(*)::integer into v_q_count
            from public.quote_services qs
           where qs.quote_id = v_quote_id and qs.sku = v_sku;

          if v_q_count = 0 then
            raise exception 'הפריט שנשלח אינו מופיע בהצעת המחיר של הפרויקט הזה. השינוי לא בוצע.'
              using errcode = 'P0001';
          end if;
          if v_q_count > 1 then
            raise exception 'למק"ט הזה יש יותר משורה אחת בהצעת המחיר, ולכן לא ברור לפי איזה מחיר לחייב. השינוי לא בוצע.'
              using errcode = 'P0001';
          end if;

          select qs.color, qs.closing_unit_price, qs.closing_unit_cost
            into v_q_color, v_q_price, v_q_cost
            from public.quote_services qs
           where qs.quote_id = v_quote_id and qs.sku = v_sku;

          v_delta := v_new_qty - v_current;
          if v_delta <> 0 then
            if v_delta > 0 then
              -- M5-4 (⑪ · C5 §5.6.8): הגדלה מחזירה את הפריט ל'טרם החל' — ורק את הסטטוס (㉟):
              -- הסחורה שכבר הגיעה לא נעלמה, ו-actual_qty אינו נגוע ("8 הגיעו, צריך 12").
              update public.logistics
                 set planned_qty = v_new_qty,
                     item_status = 'not_started'
               where project_id = p_project_id
                 and sku = v_sku
                 and serial_number = v_serial;
            else
              -- הקטנה: יש לה כבר מספיק — שום דבר אינו מתאפס
              update public.logistics
                 set planned_qty = v_new_qty
               where project_id = p_project_id
                 and sku = v_sku
                 and serial_number = v_serial;
            end if;
          end if;
        end if;
      else
        -- מסלול ב' · פריט חדש — המחיר מקטלוג היום, ושמור טרום-הנחה כמו כל שורה אחרת.
        if exists (select 1 from public.logistics l
                    where l.project_id = p_project_id and l.sku = v_sku) then
          raise exception 'הפריט הזה כבר קיים באירוע. לעדכון הכמות שלחי את השורה הקיימת עם המספר הסידורי שלה. השינוי לא בוצע.'
            using errcode = 'P0001';
        end if;

        if v_prod_status <> 'active' then
          raise exception 'המוצר הזה אינו פעיל בקטלוג ולא ניתן להוסיף אותו לאירוע. השינוי לא בוצע.'
            using errcode = 'P0001';
        end if;

        -- תרגום מילה-במילה של resolveUnitPrice: ה-min_qty הגבוה ביותר שעדיין <= הכמות.
        -- max_qty אינו משתתף.
        select t.special_price into v_q_price
          from public.price_tiers t
         where t.sku = v_sku
           and t.min_qty <= v_new_qty
         order by t.min_qty desc
         limit 1;

        if v_q_price is null then
          v_q_price := v_base_price;
        end if;

        select c.cost into v_q_cost from public.product_costs c where c.sku = v_sku;
        if v_q_cost is null then
          raise exception 'למוצר הזה אין עלות מוגדרת בקטלוג, ולכן לא ניתן לרשום אותו כשינוי תכולה. השינוי לא בוצע.'
            using errcode = 'P0001';
        end if;

        v_q_color := null;

        -- המספר הסידורי מוקצה בשרת, על הפרויקט כולו — כך ממספר approve_quote_and_create_project.
        select coalesce(max(l.serial_number), 0) + 1 into v_serial
          from public.logistics l
         where l.project_id = p_project_id;

        insert into public.logistics (project_id, sku, serial_number, planned_qty)
        values (p_project_id, v_sku, v_serial, v_new_qty);

        v_current := 0;
        v_delta   := v_new_qty;
      end if;
    else
      select count(*)::integer into v_q_count
        from public.quote_services qs
        join public.products pr on pr.sku = qs.sku
       where qs.quote_id = v_quote_id and pr.category = 'hostess';

      if v_q_count = 0 then
        raise exception 'להצעת המחיר של הפרויקט אין שורת דיילות, ולכן אין מחיר לרשום לשינוי. השינוי לא בוצע.'
          using errcode = 'P0001';
      end if;
      if v_q_count > 1 then
        raise exception 'להצעת המחיר של הפרויקט יש יותר משורת דיילות אחת, ולכן לא ברור לפי איזה מחיר לחייב. השינוי לא בוצע.'
          using errcode = 'P0001';
      end if;

      select qs.closing_unit_price, qs.closing_unit_cost
        into v_q_price, v_q_cost
        from public.quote_services qs
        join public.products pr on pr.sku = qs.sku
       where qs.quote_id = v_quote_id and pr.category = 'hostess';

      v_q_color := null;

      v_current := v_required_now;
      v_delta   := v_new_qty - v_current;
      if v_delta <> 0 then
        update public.projects
           set required_hostess_count = v_new_qty
         where project_id = p_project_id;
        v_required_now := v_new_qty;
      end if;
    end if;

    if v_delta <> 0 then
      insert into public.project_changes (
        project_id, change_group_id, sku, color, change_target, delta_qty,
        unit_price_snapshot, unit_cost_snapshot, reason, performed_by)
      values (
        p_project_id,
        v_group,
        v_sku,
        v_q_color,
        v_target,
        v_delta,
        v_q_price,
        v_q_cost,
        v_reason,
        v_actor);
    end if;

    -- M5-7: המחיקה אחרי רישום-ההיסטוריה, באותה טרנזקציה — אטומית (🔄ה).
    -- טריגר-הסטטוס של מ6 מאזין גם ל-DELETE (20260814141052) ומעדכן את הפרויקט.
    if v_is_removal then
      delete from public.logistics
       where project_id = p_project_id
         and sku = v_sku
         and serial_number = v_serial;
      v_is_removal := false;
    end if;

    v_revenue := round(v_delta * v_q_price, 2);
    v_total   := v_total + v_revenue;

    v_lines_out := v_lines_out || jsonb_build_array(jsonb_build_object(
      'target',              v_target,
      'sku',                 v_sku,
      'serial_number',       v_serial,
      'is_new_line',         v_is_new,
      'target_qty',          v_new_qty,
      'delta_qty',           v_delta,
      'unit_price_snapshot', case when v_can_read_quotes then v_q_price end,
      'revenue_delta',       case when v_can_read_quotes then v_revenue end));
  end loop;

  -- ⑯: מדווח, לא חוסם.
  select floor(extract(epoch from
           (((p.final_event_date + coalesce(p.final_start_time, '00:00'::time))
              at time zone 'Asia/Jerusalem') - now())) / 3600)::integer
    into v_hours
    from public.projects p
   where p.project_id = p_project_id;

  return jsonb_build_object(
    'change_group_id',     v_group,
    'lines',               v_lines_out,
    'revenue_delta_total', case when v_can_read_quotes then v_total end,
    'can_read_revenue',    v_can_read_quotes,
    'hours_to_event',      v_hours);
end
$function$;
