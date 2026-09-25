-- why: דוח "צריכת ציוד" (מ12) — ממצא הבוקר של מסביר-הדוחות (`Reg-In-evidence/reports-review-2026-09-25/explain/`,
--      מ12 `new_findings`). בפרויקט 1588 הפער האמיתי — 120 יחידות — מסומן "הועתק מהמתוכנן" ולכן לא נספר כ"נמדד".
--      📏 נמדד 25/09 ~15:1X: בשתי שורות `actual_qty_autofilled = true`, אבל הכמות שהגיעה **שונה** מהמתוכננת —
--         ECO-TAG ‏470 ⇐ 410 · FAB-LAN ‏480 ⇐ 420. **האפליקציה לא יכולה לייצר מצב כזה:** `update_logistics_item`
--         (20260826002447, שורות 175–197) מסמנת "מולא אוטומטית" רק כשהיא עצמה מעתיקה את המתוכנן (actual = planned),
--         וכל כתיבה ידנית מורידה את הדגל. ‏`updated_at` של שתיהן = 2026-09-09 23:23:59 UTC (10/09 02:23 שעון-ישראל) —
--         ריצת-האופק של נתוני-ההדגמה (`seed-horizon-2026-09-10`, ר' כותרת 20260924233500), לא המסך.
--      הכרעה: ישי בשיחת הסגן 14:4X, *"המשך הכל לפי המלצתך"* (ההמלצה: תיקון-נתונים, לא שינוי-הגדרה).
-- what: שתי השורות ⇐ `actual_qty_autofilled = false` ("הוזן ידנית" — המספר שונה מהמתוכנן, ולכן מישהי הזינה אותו).
--       ‏01WEB (1 = 1) לא נוגעים. הכמויות, התאריכים והסטטוס — לא נוגעים.
--       🔒 ה-WHERE מזהה כל שורה בכל הערכים הנוכחיים שלה, והקובץ נכשל אם לא עודכנו **בדיוק 2**.
--       🔑 הטריגרים: `updated_at` יזוז לשעת-ההחלה. `logistics_recompute_project_status` — 1588 ב-`awaiting_invoice`,
--          מחוץ לציר הפעיל ⇒ הפונקציה לא עושה דבר (כמו ב-20260924233500).
-- ערכי-לפני (להחזרה):
--   (1588, 'ECO-TAG', serial 1): planned 470 · actual 410 · item_status ready · actual_qty_autofilled **true** ·
--       actual_arrival_date 2026-09-07 · updated_at 2026-09-09 23:23:59.382544+00 · md5(row) b47d175c487964d565c9da29176acaa2
--   (1588, 'FAB-LAN', serial 2): planned 480 · actual 420 · item_status ready · actual_qty_autofilled **true** ·
--       actual_arrival_date 2026-09-07 · updated_at 2026-09-09 23:23:59.382544+00 · md5(row) 6742b9f62c371d5aeb3d1911d82e92d9
-- reversible: כן — `update public.logistics set actual_qty_autofilled = true where project_id = 1588 and sku in ('ECO-TAG','FAB-LAN');`
--             (ו-`updated_at` לערך שלמעלה, אם רוצים זהות-בייט).
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $fix1588$
declare
  v_n integer;
begin
  update public.logistics l
     set actual_qty_autofilled = false
   where l.project_id = 1588
     and l.actual_qty_autofilled
     and l.item_status = 'ready'
     and ((l.sku = 'ECO-TAG' and l.serial_number = 1 and l.planned_qty = 470 and l.actual_qty = 410)
       or (l.sku = 'FAB-LAN' and l.serial_number = 2 and l.planned_qty = 480 and l.actual_qty = 420));
  get diagnostics v_n = row_count;
  if v_n <> 2 then
    raise exception 'fix1588: expected exactly 2 rows, got %', v_n;
  end if;
end $fix1588$;
