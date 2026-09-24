-- why: ליטושי-הכנס · "להזמין" = רק פריטים פיזיים שעדיין "טרם החל" (הכרעת-ישי 24/09/2026: "מאשר",
--      ובהמשך "רק סגרו לי תפינות… בלי קיצורי דרך"; הועבר ע"י הסגן, `docs/plans/2026-09-24-system-polish.md` §12).
--      📏 נמדד 24/09: מ-41 שורות-הלוגיסטיקה של 30 הימים הקרובים, 38 כבר `ready`. השורה הראשונה בטבלה,
--      "שרוך סאטן — ממותג 2,540", כולה `ready`. מה שבאמת טרם יצא לספק: תג שם אקולוגי ממותג 997 ·
--      תג שם רגיל ממותג 570. ⚠️ הרמז והגדרת-הדוח אמרו "המערכת אינה יודעת מה כבר הוזמן" — **שגוי**:
--      `logistics.item_status` הוא `not_started` (טרם החל) ⇐ `ordered` (הוזמן) ⇐ `ready` (מוכן).
-- what:
--   ① public.m11_upcoming_equipment_orders — + `l.item_status = 'not_started'` + פריט פיזי בלבד:
--      `pr.category is distinct from 'site'` — בדיוק `isPhysical` ב-`src/lib/projectLogistics.js`
--      (‏`01WEB` "הקמת אתר רישום" אינו ציוד שמזמינים מספק; מק"ט שאינו בקטלוג נספר כפיזי, אותו כיוון-טעות).
--      החלפה "בדיוק פעם אחת" על הגוף החי ⇒ אותה חתימה, ה-ACL (בלי authenticated/anon) נשמר.
--   ② public.report_m12_equipment — (א) שורת-"אז מה" נגזרת מ**השורה הראשונה של טבלת-ההזמנה עצמה**
--      (SSOT) במקום שלוש תת-שאילתות שחישבו את "הגדול ביותר" בהגדרה הישנה — אחרת הטבלה הייתה אומרת
--      997 והמשפט שמעליה 2,540 · (ב) `definitions` · (ג) תווית-האוכלוסייה — מתארות את ההגדרה החדשה.
--      כל החלפה "בדיוק פעם אחת" על הגוף החי. שאר המטען (עלות · פער · שורות · גרפים) לא זז.
--   ③ הערת ①.
-- reversible: כן — החלפות הפוכות. אין שינוי-סכמה ואין נתונים.
-- verified before apply (ריצה-יבשה, 24/09): הגרסה החדשה של ① בשאילתה ⇒ 2 שורות (997 · 570).

do $m5b$
declare
  v_oid oid;
  v_def text;
  v_old text := $o$       and p.project_status <> 'cancelled'
     group by l.sku, pr.item_name) s$o$;
  v_new text := $n$       and p.project_status <> 'cancelled'
       -- ✏️ 24/09/2026: רק מה שטרם יצא לספק, ורק ציוד (לא "הקמת אתר רישום") — `isPhysical`.
       and l.item_status = 'not_started'
       and pr.category is distinct from 'site'
     group by l.sku, pr.item_name) s$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'm11_upcoming_equipment_orders';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, v_old, ''))) <> length(v_old) then
    raise exception 'm5b: m11_upcoming_equipment_orders filter block not exactly once'; end if;
  execute replace(v_def, v_old, v_new);
end $m5b$;

comment on function public.m11_upcoming_equipment_orders(date, integer) is
  'פנימית (SSOT): "כמה להזמין" ל-30 הימים שאחרי p_to — פריטים פיזיים בסטטוס not_started בלבד. נקראת מ-report_m12_equipment ומ-logistics_upcoming_orders.';

do $m12o$
declare
  v_oid oid;
  v_def text;
  -- (א) שלוש תת-השאילתות של "אז מה" ⇐ null, והערכים נגזרים מטבלת-ההזמנה אחרי ה-select.
  v_old_top text := $o$         (select coalesce(item_name, sku) from priced
           where final_event_date > v_to and final_event_date <= v_to + 30 and project_status <> 'cancelled'
           group by sku, item_name order by sum(planned_qty) desc limit 1),
         (select sum(planned_qty) from priced
           where final_event_date > v_to and final_event_date <= v_to + 30 and project_status <> 'cancelled'
           group by sku order by sum(planned_qty) desc limit 1),
         (select count(distinct project_id)::integer from priced
           where final_event_date > v_to and final_event_date <= v_to + 30 and project_status <> 'cancelled'
           group by sku order by sum(planned_qty) desc limit 1)$o$;
  v_new_top text := $n$         null::text, null::bigint, null::integer$n$;
  v_old_into text := $o$         v_top_order, v_top_qty, v_top_events;
$o$;
  v_new_into text := $n$         v_top_order, v_top_qty, v_top_events;

  -- ✏️ 24/09/2026: שורת-"אז מה" = השורה הראשונה של טבלת-ההזמנה עצמה (SSOT) — לא חישוב שני שיכול
  --     להיפרד ממנה (עד היום: הטבלה והמשפט חושבו בשתי הגדרות). הטבלה ממוינת לפי כמות, יורד.
  v_top_order  := v_order_rows -> 0 ->> 'item_name';
  v_top_qty    := (v_order_rows -> 0 ->> 'qty')::bigint;
  v_top_events := (v_order_rows -> 0 ->> 'events')::integer;
$n$;
  -- (ב) ההגדרה.
  v_old_def text := $o$"כמות להזמנה" = מה שהוזמן לאירועים שטרם התקיימו בחודש '
      || 'הקרוב, והיא תקרה עליונה — המערכת אינה יודעת מה כבר הוזמן מהספק · '$o$;
  v_new_def text := $n$"כמות להזמנה" = פריטים פיזיים לאירועים שבחודש הקרוב שסטטוס-הלוגיסטיקה '
      || 'שלהם עדיין "טרם החל" — פריט שכבר יצא לספק או הגיע אינו נספר, והקמת אתר רישום אינה ציוד · '$n$;
  -- (ג) תווית-האוכלוסייה.
  v_old_pop text := $o$' שייכות לאירועים שטרם התקיימו. בלוק ההזמנה למטה חותך לאירועים שטרם התקיימו ('$o$;
  v_new_pop text := $n$' שייכות לאירועים שטרם התקיימו. בלוק ההזמנה למטה חותך לפריטים שטרם יצאו לספק, באירועים שטרם התקיימו ('$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m12_equipment';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, v_old_top, ''))) <> length(v_old_top) then
    raise exception 'm12o: so-what sub-selects not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_into, ''))) <> length(v_old_into) then
    raise exception 'm12o: into-list tail not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_def, ''))) <> length(v_old_def) then
    raise exception 'm12o: definitions segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_pop, ''))) <> length(v_old_pop) then
    raise exception 'm12o: population label segment not exactly once'; end if;
  v_def := replace(v_def, v_old_top, v_new_top);
  v_def := replace(v_def, v_old_into, v_new_into);
  v_def := replace(v_def, v_old_def, v_new_def);
  v_def := replace(v_def, v_old_pop, v_new_pop);
  execute v_def;
end $m12o$;
