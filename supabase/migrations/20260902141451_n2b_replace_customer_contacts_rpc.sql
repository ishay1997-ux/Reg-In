-- =============================================================================
-- N2ב — שמירת אנשי-הקשר עוברת ל-RPC אחד. **טרנזקציה, לא שתי בקשות.**
-- =============================================================================
-- 🔴🔴🔴 **טרם הוחלה. נכתבה 02/09/2026 14:14 וממתינה לשער-ההקלדה של ישי.**
-- =============================================================================
--
-- 🩸 **למה זה נדרש, ולא "נחמד": שני מסלולי-השמירה הקיימים נשברים מול `N2א`.**
--
--    ‏`replaceCustomerContacts` (‏`02_customers/api.js`) שומרת היום בסדר
--    **הכנסה ← מחיקה**, וזה סדר מכוון: הכרעת-ישי 30/07/2026, אחרי שהסדר ההפוך
--    **מחק בפועל** את חמש מדרגות-המחיר של `B-REG-TAG` במודול 3. הנימוק שנרשם אז:
--    *"שתי בקשות HTTP אינן טרנזקציה — סגירת-דפדפן בין המחיקה להכנסה משאירה את הלקוח
--    בלי אנשי-קשר בכלל, בלי שגיאה."* **הנימוק נכון ועומד בעינו.**
--
--    ⚠️ **אבל עם `is_primary` הוא מייצר סתירה:**
--      · **מסלול א׳ — ההכנסה מסמנת ראשי:** הראשי הישן עדיין קיים באותו רגע ⇒
--        ‏`customer_contacts_one_primary_per_customer` **חוסם את ההכנסה**.
--        *(אומת 02/09/2026 מול לקוח #47: `primaries_now = 1`, והאינדקס הוא
--        `unique (customer_id) where is_primary`.)*
--      · **מסלול ב׳ — ההכנסה אינה מסמנת:** הלקוח נשאר עם **אפס ראשיים**, ו**האינדקס
--        אינו יכול לתפוס זאת** — הוא אוכף *"לכל היותר אחד"*, לא *"לפחות אחד"*.
--    ⇒ **שני המסלולים שבורים, וזו הסיבה לפונקציה הזו.**
--
-- 🔑 **ומה שהפונקציה משנה בשורש: גוף-פונקציה ב-Postgres הוא טרנזקציה אחת.**
--    ⇒ ‏**מחיקה-ואז-הכנסה נעשית בטוחה כאן** — בדיוק הסדר שנאסר בצד-הלקוח, ומותר כאן,
--    כי אין "בין": או ששתיהן קרו או שאף אחת. **ההכרעה מ-30/07 אינה נעקפת — היא מתקיימת
--    בדרך חזקה יותר.** ובנוסף הראשי הישן נמחק לפני שהחדש נכנס ⇒ **אין התנגשות באינדקס.**
--
-- 🛡️ **והאינווריאנט שהמסד לא יכול לאכוף לבדו — "בדיוק אחד ראשי" — נאכף כאן.**
--    ‏`N2א` הסבירה למה אינדקס-חלקי אינו יכול: הוא שולל שניים, ואינו יכול לדרוש אחד.
--    **זהו הבית הטבעי לכלל**, וגם המקום היחיד שבו אפשר להחזיר את המשפט שישי ניסח
--    במקום שגיאת-אילוץ גנרית שנראית למשתמשת כתקלה.
--
-- 🚫 **מה שהיא במפורש אינה עושה: ולידציית-פורמט על טלפון/אימייל.** יש הכרעת-ישי מפורשת
--    (12/08/2026, על פרטי-בנק) שבדיקת-מבנה שלא הוגדרה היא בדיקה מומצאת שחוסמת שמירות
--    תקינות. **אותו היגיון חל כאן** — שם הוא חובה, השאר רשות.
--
-- 🔻 אימות אחרי ההחלה:
--   -- (א) בעסקה מתגלגלת: החלפת-סט על #47 עוברת, ונשאר בדיוק ראשי אחד.
--   -- (ב) קריאה בלי ראשי כלל ⇒ נדחית עם המשפט של ישי.
--   -- (ג) קריאה עם שני ראשיים ⇒ נדחית.
--   -- (ד) מנהלת בלי הרשאת 'לקוחות' edit ⇒ 42501.
-- =============================================================================

create or replace function public.replace_customer_contacts(
  p_customer_id bigint,
  p_contacts    jsonb
)
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
  -- אותו שער כמו ה-policy הקיים על הטבלה: 'לקוחות' + edit. הפונקציה היא
  -- `security definer`, ולכן היא **חייבת** לשאול בעצמה — ה-RLS לא יגן עליה.
  perform public.assert_module_permission('לקוחות', array['edit']);

  if p_customer_id is null then
    raise exception 'לא צוין לקוח.' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.customers c where c.customer_id = p_customer_id) then
    raise exception 'הלקוח המבוקש אינו קיים.' using errcode = 'P0001';
  end if;

  -- מנרמלים פעם אחת: גוזמים רווחים, מפילים שורות בלי שם, וממירים ריק ל-null.
  -- ⚠️ ‏`nullif(btrim(...), '')` ולא `btrim` לבד — מחרוזת ריקה בטלפון/אימייל הייתה
  -- נשמרת כערך ולא כ"אין", והמסך מבדיל בין השניים.
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

  -- 🔴 שלושת האינווריאנטים, וכל אחד עם המשפט שהמשתמשת אמורה לקרוא.
  if v_named = 0 then
    raise exception 'לא ניתן לשמור לקוח בלי איש קשר אחד לפחות.' using errcode = 'P0001';
  end if;

  if v_primaries = 0 then
    -- הנוסח של ישי, מילה-במילה (הכרעת 27/08/2026).
    raise exception 'אי אפשר למחוק את איש הקשר הראשי. סמן קודם אחר כראשי.'
      using errcode = 'P0001';
  end if;

  if v_primaries > 1 then
    raise exception 'ניתן לסמן איש קשר ראשי אחד בלבד.' using errcode = 'P0001';
  end if;

  -- 🔑 **מחיקה ואז הכנסה — מותר כאן ואסור בצד-הלקוח**, כי זו טרנזקציה אחת.
  -- הראשי הישן נעלם לפני שהחדש נכנס ⇒ האינדקס-החלקי אינו מתנגש.
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

-- ‏`security definer` שנוצרת מקבלת `EXECUTE` ל-PUBLIC כברירת-מחדל של Postgres.
-- 🩸 **המוקש הזה נמדד בפרויקט הזה ב-28/08/2026** (‏`H5`→`H5b`): פונקציית-כסף נפתחה
-- ל-`anon` בדיוק כך, ונדרשה מיגרציה נוספת לסגור. **כאן זה נעשה מראש, באותה מיגרציה.**
revoke all on function public.replace_customer_contacts(bigint, jsonb) from public;
revoke all on function public.replace_customer_contacts(bigint, jsonb) from anon;
grant execute on function public.replace_customer_contacts(bigint, jsonb) to authenticated;
grant execute on function public.replace_customer_contacts(bigint, jsonb) to service_role;

comment on function public.replace_customer_contacts(bigint, jsonb) is
  'מחליפה את קבוצת אנשי-הקשר של לקוח בטרנזקציה אחת, ואוכפת "בדיוק אחד ראשי". N2ב, 02/09/2026.';
