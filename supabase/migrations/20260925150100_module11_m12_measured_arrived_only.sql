-- why: דוח "צריכת ציוד" (מ12) — "נמדד" סופר שורות שבהן "הגיע" מעולם לא הוזן. ממצא הבוקר של מסביר-הדוחות
--      (`Reg-In-evidence/reports-review-2026-09-25/explain/`, מ12). 📏 נמדד 25/09: פרויקט 1577 — ECO-TAG ו-SAT-LAN,
--      140 ⇐ 0, `actual_qty_autofilled = false`, `item_status = not_started`, `actual_arrival_date` ריק: "מעולם לא הוזמנו"
--      (כותרת 20260924233500). ‏`actual_qty` הוא `NOT NULL default 0` — "הוזן 0" ו"לא הוזן" נראים זהים, ולכן הדגל לבדו
--      אינו מבחין. ההבחנה שיש במודל: הפריט **הגיע** (`item_status = 'ready'` — הרגע שבו "הגיע" נחתם, ㊶).
--      הכרעה: ישי בשיחת הסגן 14:4X, *"המשך הכל לפי המלצתך"*.
-- what: החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר.
--       (1) ה-CTE `lines` מביא גם את `l.item_status`.
--       (2) "נמדד" = לא מולא אוטומטית **וגם** הפריט הגיע. היה: לא מולא אוטומטית בלבד.
--       🚫 לא נוגע: הגדרת "פער" / "הוזמן" / "הגיע" · האריחים · הנוסח "נמדד על N שורות מתוך M — …".
--       🔗 זוג: 20260925150000 (תיקון-הנתונים של 1588) — בלעדיו 1588 נשאר מחוץ ל"נמדד".
-- 📏 הגוף החי לפני: md5 `c9f9348e835b8d7547a59ed18f1f6654`, ‏18,886 תווים (נמדד 25/09 ~15:1X).
-- 📏 הגוף הצפוי אחרי: ר' db_roadmap.md §10ב (בלוק-ניסיון מתגלגל, כמנכ"ל).
-- reversible: כן — ההחלפות ההפוכות, או הגוף הקודם (md5 למעלה). אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m12m$
declare
  v_oid oid;
  v_def text;
  v_old_cols text := $o$           l.planned_qty, l.actual_qty, l.actual_qty_autofilled,
$o$;
  v_new_cols text := $n$           l.planned_qty, l.actual_qty, l.actual_qty_autofilled, l.item_status,
$n$;
  v_old_meas text := $o$         (select count(*) from priced where not actual_qty_autofilled and final_event_date < v_today - 7 and project_status is distinct from 'cancelled'),
$o$;
  v_new_meas text := $n$         -- ✏️ 25/09/2026: וגם הפריט הגיע (`item_status = 'ready'`) — "הגיע 0" על פריט שלא הגיע אינו מדידה (1577).
         (select count(*) from priced where not actual_qty_autofilled and item_status = 'ready' and final_event_date < v_today - 7 and project_status is distinct from 'cancelled'),
$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m12_equipment';
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_cols, ''))) <> length(v_old_cols) then
    raise exception 'm12m: lines columns segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_meas, ''))) <> length(v_old_meas) then
    raise exception 'm12m: measured segment not exactly once'; end if;

  v_def := replace(v_def, v_old_cols, v_new_cols);
  v_def := replace(v_def, v_old_meas, v_new_meas);
  execute v_def;
end $m12m$;
