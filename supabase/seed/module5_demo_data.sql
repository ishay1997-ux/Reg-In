-- ============================================================================
-- module5_demo_data.sql — סיד-הדגמה דו-מצבי למודול 5 (לוגיסטיקה)
-- ============================================================================
-- למה הקובץ קיים: הכרעת-ישי 22/08/2026 — "פשוט שיהיה את הנתונים במערכת כאשר
-- מייצרים": בכנס נפתח מסך אמיתי, לא תמונה. בלי הסיד /logistics מציג שתי שורות
-- בלבד, בלי סעיף-יציאה, בלי 'הוזמן', בלי חוסר ובלי סימון-ענבר.
-- 🚫 אינו מיגרציה — פרוטוקול-ה-DB אוסר דאטת-בדיקה במיגרציות. הרץ: סשן-הבנייה
-- דרך MCP execute_sql, ורק אחרי שער-👤 של צעד 1.5 (אישור תוכנית-הכתיבה).
--
-- 🔴 שני מצבים, ולעולם לא מחק-וצור-מחדש (G1, נמדד): הסיד מאשר את הצעות-הדמו,
-- וטריגרי-הנעילה של §7.50 זורקים על כל UPDATE/DELETE של הצעה שאינה in_progress;
-- projects.quote_id הוא ON DELETE RESTRICT. ⇒ שום דבר אינו נמחק לעולם.
--   · מצב CREATE — שלושת שמות-האירוע אינם קיימים: הצעות אמיתיות דרך create_quote
--     ⇒ אישור דרך approve_quote_and_create_project בזהות מנהלת-הפרויקטים
--     (⇒ שורות-לוגיסטיקה נולדות במנגנון האמיתי, עם מצביע+צבע — ההוכחה החיה של
--     M5-3) ⇒ עדכוני-דאטה למצבי-הפריטים ⇒ שיבוצים ⇒ בדיקת-ההסרה (M5-7).
--   · מצב REFRESH — קיימים: הזזת תאריכים דרך update_project_details (המסלול
--     המוסמך היחיד — מחזיר לחיים פרויקט שהקרון סגר), אישור-מחדש של השיבוצים
--     (איפוס-㉑ של ה-RPC צפוי — הסיד מאשרר), ויישור שורות-הלוגיסטיקה לטבלת-הערכים.
--     ההצעות לא נגועות (estimated_event_date שלהן מתיישן — מוצהר, לא מוצג במ5).
-- 🔄 שגרה קבועה: מריצים (REFRESH) בבוקר כל הדגמה — קרון 02:00 סוגר את פרויקט-
-- "היום" בן-לילה (G2).
--
-- תאריכים — הכול יחסי ל-current_date (AR-5): #105=היום · #106=יום-העסקים הבא ·
-- #107=+12. ימי-עסקים: א'–ה' ("שישי שבת לא עובדים" — ישי).
-- דיילות-הדמו: נבחרו מחוץ לרשימת עוגני-העשן (מאיה כהן · קרן אשכנזי · ליאת רזניק,
-- e2e/smoke-anchors.json) ומחוץ לדיילות עם אישור-סופי עתידי קיים (נועה שגיא) —
-- ‏#107 נודד קדימה יום-יום ועלול לנחות על 15/10/20/10 (אילוץ אירוע-אחד-ביום).
-- ‏דנה ברק (דיילת) הושמטה בכוונה — כפילות-שם עם מנהלת-הלוגיסטיקה מבלבלת דמו.
--
-- טבלת-הערכים (data-set.md §4+§9, אושרה 25/08/2026):
--   #105 פסטיבל קיץ עירוני (לקוח 47) · היום 09:00–13:00 · דיילות 4/4:
--     s1 B-REG-TAG 300: ready · actual 285 (הוקלד ⇒ autofilled=false) · הגיע לפני 2 י"ע
--     s2 B-FAB-LAN 300: ready · actual 300 (autofilled=true) · הגיע לפני 2 י"ע
--     ⇒ project_status = ready (נגזר בטריגר — לעולם לא נכתב ביד)
--   #106 כנס פתיחת שנה (לקוח 48) · יום-העסקים הבא 17:00–21:00 · דיילות 4/4:
--     s1 B-ECO-TAG 200: ready · 200 (autofilled=true) · הגיע לפני 2 י"ע
--     s2 B-SAT-LAN 200: ordered · 120 (הוקלד) · הגעה משוערת = תאריך-האירוע
--     ⇒ in_progress (הלוגיסטיקה היא מה שעוצר)
--   #107 ערב השקה — קמפוס צפון (לקוח 213) · +12 ימים 19:00–23:00 · דיילות 1/2:
--     s1 B-REG-TAG 150: ordered · 0 · הגעה משוערת = +6 · ההערה (G6, ישי):
--        "הוזמן בבית-הדפוס — הובטחה אספקה בתחילת השבוע הבא."
--     s2 B-SAT-LAN 150: not_started · 0
--     s3 B-ECO-TAG 50: ready · 50 (autofilled=true) · הגיע לפני 2 י"ע
--     s4 01WEB 1: not_started (הפריט מקטגוריית site)
--     s5 REG-TAG 25: שורת-בדיקת-ההסרה — נולדת בהצעה, מוסרת ב-apply_scope_change(0)
--        במצב CREATE ⇒ נשארים 4 שורות + שורת-היסטוריה עם סיבה ומחירים
--   #103 מבוטל — לא נזרע (AS-3): בלתי-נגיש מה-UI; הווריאנט הנעול מוכח ב-E2E.
--
-- מספרי-הקבלה (פריט-חוזה 3): גלולות 3·1·5 · סעיף-יציאה 2 · ענבר #107 בלבד ·
-- צ'קליסט #107: 4 שורות, 1/4 · #105=ready · #106=in_progress. הסקריפט בודק את
-- כולם בעצמו (בלוק האימות בסוף) ונכשל-מתגלגל-אחורה אם משהו לא מסתדר.
-- ============================================================================

do $seed$
declare
  v_noa_email  text;
  v_noa_id     uuid;
  -- "היום" לפי שעון-ישראל, לא current_date (שהוא UTC): הרצה בין חצות לשלוש-לפנות-בוקר
  -- הייתה זורעת אתמול (§7.56 — סמנטיקת Asia/Jerusalem; נתפס בהרצה הראשונה, 26/08 01:00)
  v_today      date := (now() at time zone 'Asia/Jerusalem')::date;
  v_next_bd    date;  -- יום-העסקים הבא (א'–ה')
  v_arrival    date;  -- "הגיע לפני 2 ימי-עסקים"
  v_d107       date;
  v_mode       text;
  v_q          integer;
  p105         integer; p106 integer; p107 integer;
  v_cnt        integer;
  v_all        integer;
  v_status     text;
  v_removed    boolean := false;
  v_err        text;
begin
  ------------------------------------------------------------------
  -- זהות: כל קריאות ה-RPC רצות בזהות מנהלת-הפרויקטים (נועה כהן)
  ------------------------------------------------------------------
  -- ה-sub נשלף מ-auth.users — לטבלת public.users אין עמודת-מזהה, הזהות שלה היא האימייל
  select u.email, au.id into v_noa_email, v_noa_id
    from public.users u
    join public.roles r on r.role_id = u.role_id
    join auth.users au on au.email = u.email
   where r.role_name = 'מנהלת פרויקטים' and u.status = 'active'
   limit 1;
  if v_noa_email is null then
    raise exception 'seed: לא נמצאה משתמשת פעילה בתפקיד מנהלת פרויקטים';
  end if;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_noa_id, 'email', v_noa_email)::text, true);

  ------------------------------------------------------------------
  -- תאריכים יחסיים
  ------------------------------------------------------------------
  v_d107    := v_today + 12;
  v_next_bd := v_today + (case extract(dow from v_today)::int
                            when 4 then 3   -- חמישי ⇒ ראשון
                            when 5 then 2   -- שישי ⇒ ראשון
                            else 1          -- א'-ד', שבת ⇒ מחר
                          end);
  v_arrival := v_today + (case extract(dow from v_today)::int
                            when 0 then -4  -- ראשון ⇒ רביעי שעבר
                            when 1 then -4  -- שני ⇒ חמישי שעבר
                            when 6 then -3  -- שבת ⇒ רביעי
                            else -2
                          end);

  ------------------------------------------------------------------
  -- זיהוי-מצב: לפי שלושת שמות-האירוע הקבועים
  ------------------------------------------------------------------
  select count(*) into v_cnt from public.projects
   where event_name in ('פסטיבל קיץ עירוני', 'כנס פתיחת שנה', 'ערב השקה — קמפוס צפון');
  if v_cnt = 0 then
    v_mode := 'create';
  elsif v_cnt = 3 then
    v_mode := 'refresh';
  else
    raise exception 'seed: נמצאו % מ-3 פרויקטי-דמו — מצב חלקי, נדרשת בדיקה ידנית', v_cnt;
  end if;
  raise notice 'seed mode: %', v_mode;

  if v_mode = 'create' then
    ----------------------------------------------------------------
    -- CREATE ① — שלוש הצעות אמיתיות (create_quote מתמחר: מדרגה/בסיס)
    ----------------------------------------------------------------
    -- ‎#105 — עיריית חדרה (47)
    select public.create_quote(
      jsonb_build_object(
        'customer_id', 47, 'event_name', 'פסטיבל קיץ עירוני',
        'recommended_hostess_count', 4, 'estimated_guests', 300,
        'estimated_event_date', v_today,
        'estimated_location', 'פארק העירוני, חדרה',
        'estimated_start_time', '09:00', 'estimated_end_time', '13:00',
        'applied_customer_discount', 0),
      (select jsonb_agg(jsonb_build_object('sku', s.sku, 'qty', s.qty,
        'closing_unit_price', coalesce(
          (select t.special_price from public.price_tiers t
            where t.sku = s.sku and t.min_qty <= s.qty
            order by t.min_qty desc limit 1),
          (select pr.base_price from public.products pr where pr.sku = s.sku))) order by s.ord)
        from (values (1,'04ST',4), (2,'B-REG-TAG',300), (3,'B-FAB-LAN',300))
          as s(ord, sku, qty))
    ) into v_q;
    p105 := public.approve_quote_and_create_project(v_q);

    -- ‎#106 — הייטק גרופ (48)
    select public.create_quote(
      jsonb_build_object(
        'customer_id', 48, 'event_name', 'כנס פתיחת שנה',
        'recommended_hostess_count', 4, 'estimated_guests', 200,
        'estimated_event_date', v_next_bd,
        'estimated_location', 'אקספו תל אביב, ביתן 1',
        'estimated_start_time', '17:00', 'estimated_end_time', '21:00',
        'applied_customer_discount', 0),
      (select jsonb_agg(jsonb_build_object('sku', s.sku, 'qty', s.qty,
        'closing_unit_price', coalesce(
          (select t.special_price from public.price_tiers t
            where t.sku = s.sku and t.min_qty <= s.qty
            order by t.min_qty desc limit 1),
          (select pr.base_price from public.products pr where pr.sku = s.sku))) order by s.ord)
        from (values (1,'04ST',4), (2,'B-ECO-TAG',200), (3,'B-SAT-LAN',200))
          as s(ord, sku, qty))
    ) into v_q;
    p106 := public.approve_quote_and_create_project(v_q);

    -- ‎#107 — קמפוס טכנולוגי צפון (213); שורה 5 (REG-TAG 25) = שורת-בדיקת-ההסרה
    select public.create_quote(
      jsonb_build_object(
        'customer_id', 213, 'event_name', 'ערב השקה — קמפוס צפון',
        'recommended_hostess_count', 2, 'estimated_guests', 150,
        'estimated_event_date', v_d107,
        'estimated_location', 'אולמי דיור, תל אביב',
        'estimated_start_time', '19:00', 'estimated_end_time', '23:00',
        'applied_customer_discount', 0),
      (select jsonb_agg(jsonb_build_object('sku', s.sku, 'qty', s.qty,
        'closing_unit_price', coalesce(
          (select t.special_price from public.price_tiers t
            where t.sku = s.sku and t.min_qty <= s.qty
            order by t.min_qty desc limit 1),
          (select pr.base_price from public.products pr where pr.sku = s.sku))) order by s.ord)
        from (values (1,'04ST',2), (2,'B-REG-TAG',150), (3,'B-SAT-LAN',150),
                     (4,'B-ECO-TAG',50), (5,'01WEB',1), (6,'REG-TAG',25))
          as s(ord, sku, qty))
    ) into v_q;
    p107 := public.approve_quote_and_create_project(v_q);

    -- אימות-לידה: המצביעים מולאו ע"י ה-RPC המעודכן (M5-3) — ההוכחה החיה
    select count(*) into v_cnt from public.logistics
     where project_id in (p105, p106, p107) and quote_service_line_id is null;
    if v_cnt > 0 then
      raise exception 'seed: % שורות-דמו נולדו בלי מצביע-מקור — M5-3 לא פעל', v_cnt;
    end if;

    ----------------------------------------------------------------
    -- CREATE ② — בדיקת-ההסרה (M5-7) לפני קביעת-המצבים: שני הסירובים + ההסרה
    ----------------------------------------------------------------
    -- סירוב א': פריט שהוזמן (זמנית — מוחזר מיד)
    update public.logistics set item_status = 'ordered'
     where project_id = p107 and serial_number = 1;
    begin
      perform public.apply_scope_change(p107,
        jsonb_build_array(jsonb_build_object('target','logistics','sku','B-REG-TAG',
          'serial_number',1,'target_qty',0)), 'בדיקת-סיד: סירוב על פריט שהוזמן');
      raise exception 'seed: הסרת פריט שהוזמן לא נחסמה — שומר ㊱ שבור';
    exception when others then
      get stacked diagnostics v_err = message_text;
      if v_err <> 'הפריט כבר הוזמן — לא ניתן להסירו' then raise; end if;
    end;
    update public.logistics set item_status = 'not_started'
     where project_id = p107 and serial_number = 1;

    -- סירוב ב': טרם-החל עם כמות שהגיעה (זמנית — מוחזר מיד)
    update public.logistics set actual_qty = 5
     where project_id = p107 and serial_number = 5;
    begin
      perform public.apply_scope_change(p107,
        jsonb_build_array(jsonb_build_object('target','logistics','sku','REG-TAG',
          'serial_number',5,'target_qty',0)), 'בדיקת-סיד: סירוב על סחורה שהגיעה');
      raise exception 'seed: הסרת שורה עם סחורה שהגיעה לא נחסמה — שומר ㊱ שבור';
    exception when others then
      get stacked diagnostics v_err = message_text;
      if v_err <> 'הגיעו כבר פריטים — לא ניתן להסיר' then raise; end if;
    end;
    update public.logistics set actual_qty = 0
     where project_id = p107 and serial_number = 5;

    -- ההסרה עצמה: שורה נקייה ⇒ נמחקת + שורת-היסטוריה עם מחירים וסיבה
    perform public.apply_scope_change(p107,
      jsonb_build_array(jsonb_build_object('target','logistics','sku','REG-TAG',
        'serial_number',5,'target_qty',0)),
      'הלקוח ויתר על התגים החלקים — נשארים עם הממותגים בלבד');
    if exists (select 1 from public.logistics
                where project_id = p107 and serial_number = 5) then
      raise exception 'seed: שורת-ההסרה עדיין קיימת — M5-7 לא מחק';
    end if;
    select count(*) into v_cnt from public.project_changes
     where project_id = p107 and delta_qty = -25 and sku = 'REG-TAG';
    if v_cnt <> 1 then
      raise exception 'seed: שורת-ההיסטוריה של ההסרה לא נרשמה (נמצאו %)', v_cnt;
    end if;
    v_removed := true;

  else
    ----------------------------------------------------------------
    -- REFRESH — איתור לפי שם + הזזת תאריכים במסלול המוסמך
    ----------------------------------------------------------------
    select project_id into p105 from public.projects where event_name = 'פסטיבל קיץ עירוני';
    select project_id into p106 from public.projects where event_name = 'כנס פתיחת שנה';
    select project_id into p107 from public.projects where event_name = 'ערב השקה — קמפוס צפון';

    -- update_project_details מחזיר-לחיים פרויקט שהקרון סגר (p_event_date >= היום),
    -- מאפס אישורים-סופיים (㉑ של מ6 — צפוי; מאושרר למטה) ואינו שולח מייל (הדיוור צד-לקוח)
    if (select final_event_date from public.projects where project_id = p105) <> v_today then
      perform public.update_project_details(p105, v_today, 'פארק העירוני, חדרה', '09:00', '13:00');
    end if;
    if (select final_event_date from public.projects where project_id = p106) <> v_next_bd then
      perform public.update_project_details(p106, v_next_bd, 'אקספו תל אביב, ביתן 1', '17:00', '21:00');
    end if;
    if (select final_event_date from public.projects where project_id = p107) <> v_d107 then
      perform public.update_project_details(p107, v_d107, 'אולמי דיור, תל אביב', '19:00', '23:00');
    end if;
  end if;

  ------------------------------------------------------------------
  -- שיבוצים — 4 · 4 · 1 (‏#107 הוא "1 מתוך 2" בכוונה), מאושרות-סופית.
  -- הסטטוס של הפרויקט לעולם אינו נכתב ביד — הטריגר גוזר (חוק-הבית של מ6).
  ------------------------------------------------------------------
  -- create: הוספה · refresh: אשרור-מחדש אחרי איפוס-㉑. upsert לפי המפתח.
  insert into public.assignments
      (project_id, hostess_id, assignment_number, assignment_status,
       event_date, hourly_rate_snapshot)
  select x.pid, x.hid, 1, 'finally_approved',
         (select p.final_event_date from public.projects p where p.project_id = x.pid),
         (select h.hourly_rate from public.hostesses h where h.hostess_id = x.hid)
    from (values
      (p105, 12), (p105, 14), (p105, 15), (p105, 16),
      (p106, 17), (p106, 18), (p106, 19), (p106, 22),
      (p107, 24)) as x(pid, hid)
  on conflict (project_id, hostess_id, assignment_number)
  do update set assignment_status = 'finally_approved',
                event_date = excluded.event_date;

  ------------------------------------------------------------------
  -- מצבי-הפריטים — טבלת-הערכים (עדכוני-דאטה; הטריגר גוזר את סטטוס-הפרויקט)
  ------------------------------------------------------------------
  -- ‎#105
  update public.logistics set item_status='ready', actual_qty=285,
         actual_qty_autofilled=false, actual_arrival_date=v_arrival,
         expected_arrival_date=null, notes=null
   where project_id=p105 and serial_number=1;                       -- B-REG-TAG: החוסר
  update public.logistics set item_status='ready', actual_qty=300,
         actual_qty_autofilled=true, actual_arrival_date=v_arrival,
         expected_arrival_date=null, notes=null
   where project_id=p105 and serial_number=2;                       -- B-FAB-LAN
  -- ‎#106
  update public.logistics set item_status='ready', actual_qty=200,
         actual_qty_autofilled=true, actual_arrival_date=v_arrival,
         expected_arrival_date=null, notes=null
   where project_id=p106 and serial_number=1;                       -- B-ECO-TAG
  update public.logistics set item_status='ordered', actual_qty=120,
         actual_qty_autofilled=false, actual_arrival_date=null,
         expected_arrival_date=v_next_bd, notes=null
   where project_id=p106 and serial_number=2;                       -- B-SAT-LAN: הגעה חלקית
  -- ‎#107
  update public.logistics set item_status='ordered', actual_qty=0,
         actual_qty_autofilled=false, actual_arrival_date=null,
         expected_arrival_date=v_today + 6,
         notes='הוזמן בבית-הדפוס — הובטחה אספקה בתחילת השבוע הבא.'
   where project_id=p107 and serial_number=1;                       -- B-REG-TAG
  update public.logistics set item_status='not_started', actual_qty=0,
         actual_qty_autofilled=false, actual_arrival_date=null,
         expected_arrival_date=null, notes=null
   where project_id=p107 and serial_number=2;                       -- B-SAT-LAN: הצד המותר להסרה
  update public.logistics set item_status='ready', actual_qty=50,
         actual_qty_autofilled=true, actual_arrival_date=v_arrival,
         expected_arrival_date=null, notes=null
   where project_id=p107 and serial_number=3;                       -- B-ECO-TAG: תגי VIP
  update public.logistics set item_status='not_started', actual_qty=0,
         actual_qty_autofilled=false, actual_arrival_date=null,
         expected_arrival_date=null, notes=null
   where project_id=p107 and serial_number=4;                       -- 01WEB: site

  ------------------------------------------------------------------
  -- בלוק-האימות — מספרי-הקבלה של פריט-חוזה 3. כשל ⇒ הכול מתגלגל אחורה.
  ------------------------------------------------------------------
  -- ‎#107: 4 שורות, 1/4 מוכן
  select count(*), count(*) filter (where item_status='ready') into v_cnt, v_q
    from public.logistics where project_id = p107;
  if v_cnt <> 4 or v_q <> 1 then
    raise exception 'seed: צ''קליסט #107 — % שורות, % מוכן (צפוי 4 ו-1)', v_cnt, v_q;
  end if;
  -- סטטוסים נגזרים
  select project_status into v_status from public.projects where project_id = p105;
  if v_status <> 'ready' then
    raise exception 'seed: #105 היה אמור להיגזר ready — בפועל %', v_status;
  end if;
  select project_status into v_status from public.projects where project_id = p106;
  if v_status <> 'in_progress' then
    raise exception 'seed: #106 היה אמור להיגזר in_progress — בפועל %', v_status;
  end if;
  select project_status into v_status from public.projects where project_id = p107;
  if v_status <> 'in_progress' then
    raise exception 'seed: #107 היה אמור להיגזר in_progress — בפועל %', v_status;
  end if;
  -- הגלולות: דורש-טיפול 3 · ממתין-למשלוח 1 · הכול 5 · סעיף-יציאה 2 · ענבר 1 (#107)
  with base as (
    select p.project_id, p.final_event_date,
           count(*) filter (where l.item_status = 'not_started')            as n_not_started,
           count(*) filter (where l.item_status = 'ordered')                as n_ordered
      from public.projects p
      join public.logistics l on l.project_id = p.project_id
     where p.project_status in ('not_started', 'in_progress', 'ready')
     group by p.project_id, p.final_event_date)
  select
    count(*) filter (where n_not_started > 0),
    count(*) filter (where n_not_started = 0 and n_ordered > 0),
    count(*)
    into v_cnt, v_q, v_all
    from base;
  if v_cnt <> 3 or v_q <> 1 or v_all <> 5 then
    raise exception 'seed: גלולות % · % · % (צפוי 3 · 1 · 5)', v_cnt, v_q, v_all;
  end if;
  -- הערה: חלון-היציאה והענבר תלויים ב-businessDaysUntil (קוד-לקוח) — כאן נבדקת
  -- המקבילה המסדית (פרוקסי-לוח); הבדיקה הצד-לקוחית המדויקת — בצעד 2.3, מול אותם נתונים.
  select count(*) into v_cnt from public.projects
   where project_status in ('not_started','in_progress','ready')
     and final_event_date between v_today and v_next_bd
     and exists (select 1 from public.logistics l where l.project_id = projects.project_id);
  if v_cnt <> 2 then
    raise exception 'seed: סעיף-היציאה — % פרויקטים בחלון (צפוי 2)', v_cnt;
  end if;
  -- ענבר (⑳): פריט פיזי טרם-החל + עד ~10 ימי-עסקים (פרוקסי: 14 ימי-לוח) ⇒ ‏#107 בלבד
  with amber as (
    select p.project_id
      from public.projects p
     where p.project_status in ('not_started','in_progress','ready')
       and p.final_event_date <= v_today + 14
       and exists (select 1 from public.logistics l
                     join public.products pr on pr.sku = l.sku
                    where l.project_id = p.project_id
                      and l.item_status = 'not_started' and pr.category <> 'site'))
  select count(*), max(project_id) into v_cnt, v_q from amber;
  if v_cnt <> 1 or v_q <> p107 then
    raise exception 'seed: סימון-ענבר — % פרויקטים (צפוי #107 בלבד)', v_cnt;
  end if;

  raise notice 'seed done: mode=% · #105=% · #106=% · #107=% · removal-run=%',
    v_mode, p105, p106, p107, v_removed;
end
$seed$;
