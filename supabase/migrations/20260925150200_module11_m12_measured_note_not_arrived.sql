-- why: fix-forward על 20260925150100 (הוחל 15:14, registry `20260925121434`). "נמדד" במ12 מחריג עכשיו גם פריט שלא
--      סומן "הגיע" (`item_status <> 'ready'` — 1577), אבל שני דברים על אותו מסך לא יושרו:
--      (א) ההערה שמתחת למספר מונה רק את הסיבות הישנות: "בשאר, האירוע עוד לא נסגר או בוטל, או ש"הגיע בפועל" הועתק
--          מהמתוכנן ולא נמדד." — שורה מוחרגת בלי סיבה כתובה. הכרעת הסגן 25/09 ~15:2X.
--      (ב) אריח-הפער ("הוזמן מול הגיע") סופר 400 יחידות: 280 מהן מ-1577 — פריטים שמעולם לא הגיעו — ורק 120 מ-1588.
--          האריח והשורה "נמדד" מדברים על שורות אחרות. ממצא הבודק (צלם-דוחות), הכרעת הסגן 25/09 ~15:4X.
-- what: החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר.
--       (1) בסוף ההערה נוסף: ", או שהפריט לא סומן 'הגיע'".
--       (2) ארבעת הסכומים של אריח-הפער — הוזמן/הגיע, התקופה והשוואת-אשתקד — מקבלים את אותו תנאי `item_status = 'ready'`
--           (פער = הוזמן פחות הגיע, על פריטים שהגיעו בלבד; אשתקד באותה הגדרה, כדי שההשוואה תהיה תפוחים-לתפוחים).
--       🚫 לא נוגע: הטבלה הראשית · הגרפים · "נמדד" עצמו · שאר ההערות.
-- 📏 הגוף החי לפני: md5 `7508974ebe59c0802134d674405d3540`, ‏19,042 תווים (= הצפוי של 150100; נמדד 25/09 ~15:3X).
-- 📏 הגוף הצפוי אחרי: ר' db_roadmap.md §10ב (בלוק-ניסיון מתגלגל, כמנכ"ל).
-- reversible: כן — ההחלפות ההפוכות, או הגוף הקודם (md5 למעלה). אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m12n$
declare
  v_oid oid;
  v_def text;
  v_old_note text := $o$          || ' — בשאר, האירוע עוד לא נסגר או בוטל, או ש"הגיע בפועל" הועתק מהמתוכנן ולא נמדד.'),$o$;
  v_new_note text := $n$          || ' — בשאר, האירוע עוד לא נסגר או בוטל, או ש"הגיע בפועל" הועתק מהמתוכנן ולא נמדד, או שהפריט לא סומן ''הגיע''.'),$n$;
  v_old_gap text := $o$         (select coalesce(sum(planned_qty), 0) from priced
            where final_event_date >= v_from and final_event_date <= v_to
              and final_event_date < v_today - 7 and project_status is distinct from 'cancelled'),
         (select coalesce(sum(actual_qty), 0) from priced
            where final_event_date >= v_from and final_event_date <= v_to
              and final_event_date < v_today - 7 and project_status is distinct from 'cancelled'),
         (select coalesce(sum(planned_qty), 0) from priced
            where final_event_date >= v_prev_from and final_event_date <= v_prev_to
              and final_event_date < (v_today - interval '1 year')::date - 7 and project_status is distinct from 'cancelled'),
         (select coalesce(sum(actual_qty), 0) from priced
            where final_event_date >= v_prev_from and final_event_date <= v_prev_to
              and final_event_date < (v_today - interval '1 year')::date - 7 and project_status is distinct from 'cancelled'),
$o$;
  v_new_gap text := $n$         -- ✏️ 25/09/2026: אריח-הפער — רק פריטים שהגיעו (`item_status = 'ready'`), כמו "נמדד" (1577: 280 יח' שלא הגיעו).
         (select coalesce(sum(planned_qty), 0) from priced
            where final_event_date >= v_from and final_event_date <= v_to and item_status = 'ready'
              and final_event_date < v_today - 7 and project_status is distinct from 'cancelled'),
         (select coalesce(sum(actual_qty), 0) from priced
            where final_event_date >= v_from and final_event_date <= v_to and item_status = 'ready'
              and final_event_date < v_today - 7 and project_status is distinct from 'cancelled'),
         (select coalesce(sum(planned_qty), 0) from priced
            where final_event_date >= v_prev_from and final_event_date <= v_prev_to and item_status = 'ready'
              and final_event_date < (v_today - interval '1 year')::date - 7 and project_status is distinct from 'cancelled'),
         (select coalesce(sum(actual_qty), 0) from priced
            where final_event_date >= v_prev_from and final_event_date <= v_prev_to and item_status = 'ready'
              and final_event_date < (v_today - interval '1 year')::date - 7 and project_status is distinct from 'cancelled'),
$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m12_equipment';
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_note, ''))) <> length(v_old_note) then
    raise exception 'm12n: note segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_gap, ''))) <> length(v_old_gap) then
    raise exception 'm12n: gap sums segment not exactly once'; end if;

  v_def := replace(v_def, v_old_note, v_new_note);
  v_def := replace(v_def, v_old_gap, v_new_gap);
  execute v_def;
end $m12n$;
