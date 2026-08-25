-- למה: מודול 5 (לוגיסטיקה) — הקשחת טבלת logistics לקראת מסכי המודול.
-- ארבעה רשומי-רשם, כולם מאושרים (docs/db_roadmap.md, בלוק "Module 5 (logistics)"):
--   M5-1 — policy-כתיבה. נמדד חי 26/08/2026: policy יחיד (SELECT) ⇒ היום UPDATE/DELETE
--          מחזירים 0 שורות עם error:null — כפתור "נשמר" שמשקר (🧱⑥). השער 'לוגיסטיקה'
--          ולא 'פרויקטים' (הכרעה ㉞ — שער 'פרויקטים' היה נועל את בעלת-המודול בחוץ).
--   M5-2 — CHECK (actual_qty >= 0). דרישת C6 §2.4.13 שהסכמה השמיטה; הונהן ע"י ישי
--          22/08/2026 (§7.41, סעיף-המשנה של מ5): כמות שלילית אינה מצב עסקי.
--   M5-5 — עמודת color, אותו CHECK בדיוק כמו quote_services_color_check (הכרעה ⑱ —
--          הצבע נוסע עם השורה, כי quote_services חסומה בפניה; הכרעת-ישי 21/08:
--          חמשת הצבעים הקיימים בלבד).
--   M5-8 — שני תאריכי-ההגעה (הכרעת-ישי ㊶): expected_arrival_date היא ממלאת בהזמנה;
--          actual_arrival_date נחתם ע"י ה-RPC (M5-6) במעבר ל-ready, לעולם לא ידנית.
--          טיפוס date ולא timestamptz — בכוונה, כמו final_event_date: סמנטיקת יום-לוח
--          (סטייה מודעת מברירת-המחדל של §7.56, שנועדה לחותמות-זמן).
--        + actual_qty_autofilled (AR-7) — הנשא העמיד של תג "מולא אוטומטית" (㊵):
--          הנימוק פיננסי — מספר שלא נמדד אסור שייקרא כנמדד במ8, ותג בצד-לקוח
--          מתאייד ברענון.
-- הפיכות: policy ועמודות nullable ניתנים להסרה; ה-CHECKים נאכפים רק קדימה.

-- M5-1 — policy-הכתיבה, התבנית הביתית (זהה ל-hostesses_write_by_permission, שער אחר)
create policy "logistics_write_by_permission" on public.logistics
  for all to authenticated
  using (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'לוגיסטיקה')
      and p.permission_level = 'edit'))
  with check (exists (
    select 1 from public.permissions p
    where p.role_id = (select public.current_user_role_id())
      and p.module_id = (select module_id from public.modules where module_name = 'לוגיסטיקה')
      and p.permission_level = 'edit'));

-- M5-2 — הרצפה שהסכמה השמיטה
alter table public.logistics
  add constraint logistics_actual_qty_check check (actual_qty >= 0);

-- M5-5 — הצבע נוסע עם השורה; ה-CHECK העתק-בייט של quote_services_color_check
alter table public.logistics add column color text;
alter table public.logistics
  add constraint logistics_color_check
  check (color is null or color = any (array['לבן'::text, 'שחור'::text, 'אפור'::text, 'טורקיז'::text, 'כחול'::text]));

-- M5-8 — שני תאריכי-ההגעה (㊶) + דגל המילוי-האוטומטי (㊵/AR-7)
alter table public.logistics add column expected_arrival_date date;
alter table public.logistics add column actual_arrival_date date;
alter table public.logistics
  add column actual_qty_autofilled boolean not null default false;

comment on column public.logistics.expected_arrival_date is
  'מתי הובטח שיגיע — היא ממלאת בהזמנה (㊶). הטריגר השני של סימון-הענבר ⑳ נשען עליו.';
comment on column public.logistics.actual_arrival_date is
  'מתי הגיע בפועל — נחתם ע"י update_logistics_item במעבר ל-ready, לעולם לא ידנית (M5-8).';
comment on column public.logistics.actual_qty_autofilled is
  'true כשהכמות-בפועל מולאה אוטומטית בסימון מוכן (㊵) — מספר שאיש לא ספר, והמסך מסמן זאת.';
