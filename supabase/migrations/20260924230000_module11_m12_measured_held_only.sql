-- why: הכרעת-ישי, 24/09/2026: ב-`report_m12_equipment` ("צריכת ציוד") "שורות שנמדדו" = **רק אירועים
--      שהתקיימו**. המיגרציה הקודמת (`20260924210000_module11_m12_measured_past_only`) מימשה את זה
--      כ-`final_event_date < v_today` בלבד — **ואירוע שבוטל לא התקיים** ("הגיע" = 0 ⇒ הפער ספר ביטולים;
--      ממצא מעבר-הדוחות #1, 24/09, אומת במסד ע"י היועץ).
--      ✏️ **ועוד הכרעת-ישי מאותו ערב** (צ'אט הסגן, ~21:5X): *"לדעתי בסגירת אירוע השעות אמורות להסגר
--      נראלי גג שבוע סוגרים אירוע?"* ⇐ הסגן: אירוע מ-7 הימים האחרונים עדיין "בסגירה", וה"הגיע" שלו
--      עוד לא נספר. ⇐ **"נסגר" = `final_event_date < v_today - 7` וגם `project_status is distinct from 'cancelled'`.**
--      והסגן (#2): **אוכלוסייה אחת למדד אחד בדף** — אותה הגדרה גם לאריח "פער הוזמן מול הגיע" ולהשוואת-אשתקד שלו.
--      📏 נמדד לפני הכתיבה (24/09 ~22:00, על המסד החי, כמנכ"ל, 01/01–24/09): הגוף החדש נבנה כ-`pg_temp`
--         והורץ בטרנזקציה שבוטלה —
--         "נמדד על" 74 ⇐ 17 · 01WEB ‏4.5% ⇐ 1.9% · אריח-הפער 5.4% ⇐ 2.8% (7,213/134,443 ⇐ 3,482/125,030) ·
--         אשתקד 5.4% ⇐ **ללא השוואה** (בחלון-אשתקד אין אף שורה שנמדדה — הכל מילוי-אוטומטי; בלי החלפה 12 היה
--         מוצג "0.0% ▲"). מתוך 18 שורות ספטמבר שבהן "הגיע" = 0 — ‏17 עברו לפני יותר משבוע.
--      🔑 `projects_project_status_check`: not_started · in_progress · ready · event_finished · awaiting_invoice ·
--         awaiting_payment · finished · cancelled. ל-0 פרויקטים אין סטטוס. `project_status` כבר נבחר ב-CTE ‏`lines`.
--         ההשוואה לאשתקד חותכת את אותו שבוע אחרון, שנה אחורה (`(v_today - interval '1 year')::date - 7`),
--         כדי ששני הצדדים יהיו באותו אורך.
--      🚫 לא נוגעים: אריחי-העלות · גרף "עלות לפי מוצר" · טבלת "כמה להזמין לחודש הקרוב" (כבר מחריגה מבוטלים,
--         `m11_upcoming_equipment_orders`) · תווית-האוכלוסייה "כולל פרויקטים מבוטלים" (נכונה לעלות ולספירת-השורות).
--      🔎 מוצג למשתמשת? כן — `definitions` ו-`population.label` בחלונית-ההיקף (`ReportSurface.jsx` `ScopeLine`),
--         `meta.notes` מתחת לאריחים, וכותרת-העמודה בטבלה.
--      📏 כל אחד מ-12 הקטעים מופיע בגוף החי בדיוק פעם אחת (נבדק 24/09, `pg_get_functiondef`,
--         md5 ‏92315606d0ded3b9c18b231cbf449b21 · 17,558 תווים). md5 צפוי אחרי: dd3ebac8808d9ac99d1fdb626689a794 (18,904 תווים).
-- what: 12 החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר. הדפוס:
--       `20260924210000_module11_m12_measured_past_only.sql`.
-- reversible: כן — ההחלפות ההפוכות. אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m12h$
declare
  v_oid oid;
  v_def text;
  -- [i][1] = הקטע בגוף החי · [i][2] = מה שבא במקומו.
  v_seg text[][] := array[
    -- (1) "נמדד על N שורות".
    [$o$(select count(*) from priced where not actual_qty_autofilled and final_event_date < v_today),$o$,
     $n$(select count(*) from priced where not actual_qty_autofilled and final_event_date < v_today - 7 and project_status is distinct from 'cancelled'),$n$],
    -- (2) הגרף "הוזמן מול הגיע".
    [$o$from priced where coalesce(category, '') = 'product' and final_event_date < v_today$o$,
     $n$from priced where coalesce(category, '') = 'product' and final_event_date < v_today - 7 and project_status is distinct from 'cancelled'$n$],
    -- (3) טבלת-המוצרים.
    [$o$from priced where final_event_date < v_today group by sku, item_name) s),$o$,
     $n$from priced where final_event_date < v_today - 7 and project_status is distinct from 'cancelled' group by sku, item_name) s),$n$],
    -- (4–5) אריח "פער הוזמן מול הגיע" — הוזמן והגיע בחלון.
    [$o$(select coalesce(sum(planned_qty), 0) from priced
            where final_event_date >= v_from and final_event_date <= v_to),$o$,
     $n$(select coalesce(sum(planned_qty), 0) from priced
            where final_event_date >= v_from and final_event_date <= v_to
              and final_event_date < v_today - 7 and project_status is distinct from 'cancelled'),$n$],
    [$o$(select coalesce(sum(actual_qty), 0) from priced
            where final_event_date >= v_from and final_event_date <= v_to),$o$,
     $n$(select coalesce(sum(actual_qty), 0) from priced
            where final_event_date >= v_from and final_event_date <= v_to
              and final_event_date < v_today - 7 and project_status is distinct from 'cancelled'),$n$],
    -- (6–7) ההשוואה לאשתקד — אותו חיתוך, שנה אחורה.
    [$o$(select coalesce(sum(planned_qty), 0) from priced
            where final_event_date >= v_prev_from and final_event_date <= v_prev_to),$o$,
     $n$(select coalesce(sum(planned_qty), 0) from priced
            where final_event_date >= v_prev_from and final_event_date <= v_prev_to
              and final_event_date < (v_today - interval '1 year')::date - 7 and project_status is distinct from 'cancelled'),$n$],
    [$o$(select coalesce(sum(actual_qty), 0) from priced
            where final_event_date >= v_prev_from and final_event_date <= v_prev_to),$o$,
     $n$(select coalesce(sum(actual_qty), 0) from priced
            where final_event_date >= v_prev_from and final_event_date <= v_prev_to
              and final_event_date < (v_today - interval '1 year')::date - 7 and project_status is distinct from 'cancelled'),$n$],
    -- (8) תווית-האוכלוסייה.
    [$o$טבלת-המוצרים והגרף "הוזמן מול הגיע" כוללים רק אירועים שהתקיימו לפני היום.$o$,
     $n$טבלת-המוצרים, הגרף "הוזמן מול הגיע" ואריח-הפער כוללים רק אירועים שנסגרו: התקיימו לפני יותר משבוע ולא בוטלו.$n$],
    -- (9) ההגדרות.
    [$o$ובטבלת-המוצרים ובגרף "הוזמן מול הגיע" הוא נמדד רק באירועים שהתקיימו לפני היום — באירוע עתידי עוד לא הגיע דבר · $o$,
     $n$והוא נמדד רק באירועים שנסגרו — התקיימו לפני יותר משבוע ולא בוטלו; באירוע עתידי, מבוטל או מהשבוע האחרון (עוד בסגירה) "הגיע" עוד לא נספר · $n$],
    -- (10) ההערה מתחת לאריחים.
    [$o$' — בשאר, האירוע עוד לא התקיים, או ש"הגיע בפועל" הועתק מהמתוכנן ולא נמדד.'$o$,
     $n$' — בשאר, האירוע עוד לא נסגר או בוטל, או ש"הגיע בפועל" הועתק מהמתוכנן ולא נמדד.'$n$],
    -- (11) כותרת עמודת-העלות (הסגן #3: העמודה נשארת על אוכלוסיית השורה, והכותרת אומרת את זה).
    [$o$'label', 'עלות מוזמנת (₪)', 'format'$o$,
     $n$'label', 'עלות מוזמנת (₪) · באירועים שנסגרו', 'format'$n$],
    -- (12) הסגן #2: "השוואה לכלום מטעה" ⇐ אין השוואה כשבחלון-אשתקד אין אף שורה שנמדדה (לא מילוי-אוטומטי).
    [$o$'compare', case when v_prev_gap_pct is null then null else jsonb_build_object($o$,
     $n$'compare', case when v_prev_gap_pct is null
                          or not exists (select 1 from public.logistics l2 join public.projects p2 on p2.project_id = l2.project_id
                                          where not l2.actual_qty_autofilled
                                            and p2.final_event_date >= v_prev_from and p2.final_event_date <= v_prev_to
                                            and p2.final_event_date < (v_today - interval '1 year')::date - 7
                                            and p2.project_status is distinct from 'cancelled'
                                            and (p_customer_id is null or p2.customer_id = p_customer_id))
                     then null else jsonb_build_object($n$]
  ];
  i int;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m12_equipment';
  v_def := pg_get_functiondef(v_oid);

  for i in 1 .. array_length(v_seg, 1) loop
    if (length(v_def) - length(replace(v_def, v_seg[i][1], ''))) <> length(v_seg[i][1]) then
      raise exception 'm12h: segment % not exactly once', i; end if;
  end loop;

  for i in 1 .. array_length(v_seg, 1) loop
    v_def := replace(v_def, v_seg[i][1], v_seg[i][2]);
  end loop;
  execute v_def;
end $m12h$;
