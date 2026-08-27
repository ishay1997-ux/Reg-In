-- למה: M5-6 — ה-RPC של דיאלוג-הצ'קליסט: הכותב היחיד של ארבעת שדות מנהלת-הלוגיסטיקה.
-- הכרעה ㉑ (ישי): כל כתיבה של מודול 5 עוברת ב-RPC, לעולם לא ישירה — כי נמדד (🧱④)
-- ששומר-הסטטוס של מ6 חוזר בשקט על פרויקט cancelled/event_finished: הכתיבה "מצליחה"
-- והמסד אינו אוכף. ב-RPC השומר יושב במקום אחד בשרת ואי-אפשר לעקוף אותו.
-- החוזה (docs/micro_guides/module-5.md, צעד 1.3):
--   · p_changes ב-jsonb עם סמנטיקת מפתח-נוכח (AS-8); מפתחות מותרים בדיוק:
--     item_status · actual_qty · notes · expected_arrival_date. מפתח זר ⇒ raise.
--   · שערים בסדר: זהות → הרשאת edit על 'לוגיסטיקה' (㉞ — לא 'פרויקטים', שהיה נועל
--     את בעלת-המודול בחוץ) → נעילת-שורה → שומר-סטטוס-פרויקט, עם חריג ㊴ יחיד:
--     cancelled + המטען מכיל אך ורק actual_qty ⇒ מותר (רישום סחורה שהגיעה בכל זאת).
--   · מעבר אל ready: מילוי-אוטומטי של actual_qty ל-planned רק אם עדיין 0 ואין כמות
--     במטען (㉕·㊵) + דגל autofilled + חתימת actual_arrival_date = היום (㊶/M5-8).
--   · מעבר מ-ready החוצה (G8, הוכרע 25/08): התאריך נמחק; כמות שמולאה אוטומטית חוזרת
--     ל-0 והדגל יורד — מספר שלא נמדד לא נשאר רשום; כמות שהוקלדה נשמרת (㉕).
--   · expected_arrival_date (G9): נכתב רק כשהשורה — או הופכת באותו מטען — 'הוזמן';
--     תאריך-עבר מותר (הטריגר השני של הענבר ㊶ תלוי בו); נשמר במעבר ל-ready.
--   · כמות שלילית ⇒ ההודעה העברית (S-5) לפני שה-CHECK מדבר אנגלית; מעל המתוכנן מותר.
--   · החזרה (G10): jsonb עם שני מפתחות בדיוק — row (השורה המלאה) + project_status
--     (נקרא מחדש אחרי הכתיבה — הטריגר של מ6 רץ סינכרונית) ⇒ באנר-ההשלמה ⑬ בלי סבב שני.
-- הפיכות: drop function — אין שינוי-סכמה בקובץ הזה.

create or replace function public.update_logistics_item(
  p_project_id integer,
  p_sku text,
  p_serial_number integer,
  p_changes jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_caller_email   text := (select auth.email());
  v_bad_key        text;
  v_project_status text;
  v_row            public.logistics%rowtype;
  v_has_status     boolean;
  v_has_qty        boolean;
  v_has_notes      boolean;
  v_has_expected   boolean;
  v_new_status     text;
  v_qty_raw        numeric;
  v_new_qty        integer;
  v_set_qty        integer;
  v_set_autofilled boolean;
  v_set_arrival    date;
  v_set_notes      text;
  v_set_expected   date;
begin
  -- שער 1 — זהות
  if v_caller_email is null then
    raise exception 'לא זוהתה משתמשת מחוברת. התחברי מחדש ונסי שוב.' using errcode = '42501';
  end if;

  -- שער 2 — הרשאה פנימית: edit על 'לוגיסטיקה' (㉞; הדפוס של approve_quote_and_create_project)
  if not exists (
    select 1 from public.permissions p
    join public.users u on u.role_id = p.role_id
    join public.modules m on m.module_id = p.module_id
    where u.email = v_caller_email and u.status = 'active'
      and m.module_name = 'לוגיסטיקה' and p.permission_level = 'edit'
  ) then
    raise exception 'אין לך הרשאת עריכה על לוגיסטיקה — העדכון לא בוצע.' using errcode = '42501';
  end if;

  -- ולידציית המעטפת — מפתח-נוכח, מפתחות מותרים בלבד (AS-8)
  if p_changes is null or jsonb_typeof(p_changes) is distinct from 'object' then
    raise exception 'לא נשלח אף שינוי לשמירה.' using errcode = 'P0001';
  end if;
  select k into v_bad_key
    from jsonb_object_keys(p_changes) k
   where k not in ('item_status', 'actual_qty', 'notes', 'expected_arrival_date')
   limit 1;
  if v_bad_key is not null then
    raise exception 'שדה לא מוכר בבקשה (%) — העדכון לא בוצע.', v_bad_key using errcode = 'P0001';
  end if;
  v_has_status   := p_changes ? 'item_status';
  v_has_qty      := p_changes ? 'actual_qty';
  v_has_notes    := p_changes ? 'notes';
  v_has_expected := p_changes ? 'expected_arrival_date';
  if not (v_has_status or v_has_qty or v_has_notes or v_has_expected) then
    raise exception 'לא נשלח אף שינוי לשמירה.' using errcode = 'P0001';
  end if;

  -- השורה, נעולה
  select * into v_row
    from public.logistics
   where project_id = p_project_id and sku = p_sku and serial_number = p_serial_number
   for update;
  if not found then
    raise exception 'שורת הלוגיסטיקה לא נמצאה — ייתכן שהוסרה. רענני את המסך.' using errcode = 'P0001';
  end if;

  -- שומר-סטטוס-הפרויקט (🧱④ — המסד לבדו אינו עוצר; השומר חי כאן), עם חריג ㊴ יחיד
  select p.project_status into v_project_status
    from public.projects p where p.project_id = p_project_id;
  if v_project_status not in ('not_started', 'in_progress', 'ready') then
    if v_project_status = 'cancelled' then
      -- ㊴: בפרויקט מבוטל מותר לרשום אך ורק כמות שהגיעה — כל השאר נעול (㉝)
      if v_has_status or v_has_notes or v_has_expected then
        raise exception 'הפרויקט בוטל — לא ניתן לעדכן' using errcode = 'P0001';
      end if;
    else
      -- G4 (ישי 25/08): אירוע שהסתיים / הועבר לכספים
      raise exception 'האירוע כבר הסתיים — לא ניתן לעדכן את הלוגיסטיקה שלו.' using errcode = 'P0001';
    end if;
  end if;

  -- item_status — שלושת הערכים בלבד
  if v_has_status then
    if jsonb_typeof(p_changes -> 'item_status') is distinct from 'string' then
      raise exception 'מצב פריט לא תקין — העדכון לא בוצע.' using errcode = 'P0001';
    end if;
    v_new_status := p_changes ->> 'item_status';
    if v_new_status not in ('not_started', 'ordered', 'ready') then
      raise exception 'מצב פריט לא מוכר (%) — העדכון לא בוצע.', v_new_status using errcode = 'P0001';
    end if;
  else
    v_new_status := v_row.item_status;
  end if;

  -- actual_qty — שלם, אי-שלילי (ההודעה העברית לפני ה-CHECK); מעל המתוכנן מותר (כרטיס §⑦)
  if v_has_qty then
    if jsonb_typeof(p_changes -> 'actual_qty') is distinct from 'number' then
      raise exception 'כמות בפועל חייבת להיות מספר.' using errcode = 'P0001';
    end if;
    v_qty_raw := (p_changes ->> 'actual_qty')::numeric;
    if v_qty_raw <> trunc(v_qty_raw) then
      raise exception 'כמות בפועל חייבת להיות מספר שלם.' using errcode = 'P0001';
    end if;
    v_new_qty := v_qty_raw::integer;
    if v_new_qty < 0 then
      raise exception 'כמות בפועל אינה יכולה להיות שלילית.' using errcode = 'P0001';
    end if;
    -- ㉕: השדה עריך ב'הוזמן' וב'מוכן' בלבד — וזה שומר-שרת, לא רק הסתרת-UI (㉑).
    -- בלעדיו הקלדה על שורת 'טרם החל' הייתה נועלת את שומר-ההסרה ㊱ של עצמה.
    if v_new_status = 'not_started' then
      raise exception 'הפריט טרם הוזמן — הכמות בפועל נפתחת לעריכה אחרי סימון ''הוזמן''.' using errcode = 'P0001';
    end if;
  end if;

  -- expected_arrival_date (G9) — רק כשהמצב הסופי 'הוזמן'; תאריך-עבר מותר
  if v_has_expected then
    if v_new_status <> 'ordered' then
      raise exception 'תאריך הגעה משוער נרשם רק על פריט במצב ''הוזמן''.' using errcode = 'P0001';
    end if;
  end if;

  -- חישוב הערכים הסופיים — סמנטיקת ㉕/㊵/㊶/G8
  v_set_qty        := v_row.actual_qty;
  v_set_autofilled := v_row.actual_qty_autofilled;
  v_set_arrival    := v_row.actual_arrival_date;
  v_set_notes      := v_row.notes;
  v_set_expected   := v_row.expected_arrival_date;

  if v_has_notes then
    v_set_notes := p_changes ->> 'notes';
  end if;
  if v_has_expected then
    if jsonb_typeof(p_changes -> 'expected_arrival_date') = 'null' then
      v_set_expected := null;
    else
      begin
        v_set_expected := (p_changes ->> 'expected_arrival_date')::date;
      exception when others then
        raise exception 'תאריך הגעה משוער אינו תאריך תקין.' using errcode = 'P0001';
      end;
    end if;
  end if;
  if v_has_qty then
    -- כתיבה ידנית: הערך שלה, והדגל יורד — מרגע זה זו מדידה (㊵)
    v_set_qty        := v_new_qty;
    v_set_autofilled := false;
  end if;

  if v_row.item_status <> 'ready' and v_new_status = 'ready' then
    -- מעבר אל 'מוכן': מילוי-אוטומטי רק אם עדיין 0 ואין כמות במטען (㉕·㊵), וחתימת ההגעה (㊶)
    if (not v_has_qty) and v_row.actual_qty = 0 then
      v_set_qty        := v_row.planned_qty;
      v_set_autofilled := true;
    end if;
    v_set_arrival := current_date;
  elsif v_row.item_status = 'ready' and v_new_status <> 'ready' then
    -- מעבר מ'מוכן' החוצה (G8): התאריך נמחק; מספר שמולא אוטומטית לא נשאר רשום
    v_set_arrival := null;
    if v_row.actual_qty_autofilled and (not v_has_qty) then
      v_set_qty        := 0;
      v_set_autofilled := false;
    end if;
  end if;

  -- אין שינוי בפועל ⇒ אין כתיבה (כרטיס §①: לחיצה על המצב הנוכחי אינה כותבת; 🧱⑤ — כל
  -- כתיבה מריצה חישוב מלא + FOR UPDATE על הפרויקט, וכתיבה ריקה היא עומס בלי מידע)
  if v_new_status = v_row.item_status
     and v_set_qty = v_row.actual_qty
     and v_set_autofilled = v_row.actual_qty_autofilled
     and v_set_arrival is not distinct from v_row.actual_arrival_date
     and v_set_notes is not distinct from v_row.notes
     and v_set_expected is not distinct from v_row.expected_arrival_date then
    return jsonb_build_object('row', to_jsonb(v_row), 'project_status', v_project_status);
  end if;

  update public.logistics
     set item_status           = v_new_status,
         actual_qty            = v_set_qty,
         actual_qty_autofilled = v_set_autofilled,
         actual_arrival_date   = v_set_arrival,
         notes                 = v_set_notes,
         expected_arrival_date = v_set_expected
   where project_id = p_project_id and sku = p_sku and serial_number = p_serial_number
   returning * into v_row;

  -- הטריגר של מ6 רץ סינכרונית ⇒ הסטטוס שנקרא עכשיו כבר מעודכן (G10)
  select p.project_status into v_project_status
    from public.projects p where p.project_id = p_project_id;

  return jsonb_build_object('row', to_jsonb(v_row), 'project_status', v_project_status);
end;
$function$;

-- הרשאות-הרצה: הלקח מ-20260809174501 — revoke מ-public לבדו משאיר את anon עם גישה
revoke execute on function public.update_logistics_item(integer, text, integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.update_logistics_item(integer, text, integer, jsonb)
  to authenticated;
