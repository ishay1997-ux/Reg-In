-- why: הכרעת הסגן, 25/09/2026 ~02:5X. 📏 נמדד במסד החי (מסביר-דוחות, 02:4X): השרת סוגר את קישור-הזימון לפי
--      קבועים — 48 שעות משליחה ו-24 שעות לפני האירוע (`respond_to_shift_invite` · `get_shift_invite`) — בזמן
--      שהמסך מציג "בתוקף עד…" לפי הפרמטרים `שעות_תוקף_זימון` ו-`שעות_סף_זימון_לפני_אירוע`
--      (`src/lib/hostesses.js` HOSTESS_PARAM_NAMES · `inviteHoursLeft` · `isWithinFinalDay`). מנהלת שתשנה ל-72
--      תראה על המסך תוקף שהקישור בפועל כבר לא מקיים. היום שני הפרמטרים 48/24 (נבדק 25/09) = הקבועים.
-- what: שתי הפונקציות קוראות את שני הפרמטרים (`public.params`, שם-סכמה מלא). פרמטר חסר, ריק, או לא מספר
--       שלם חיובי ⇒ 48/24, **לא כשל** — דף-הזימון הציבורי לא נשבר בגלל שורת-הגדרות.
--       החלפות "בדיוק פעם אחת" על הגוף החי (דפוס L7), אותה חתימה ⇒ ה-ACL נשמר; SECURITY DEFINER
--       ו-`search_path=''` באים מהגוף החי ולא נוגעים בהם.
--       get_shift_invite: (1) הצהרת שני משתנים (2) קריאת הפרמטרים + בדיקת-התוקף (3) חישוב `expires_at`.
--       respond_to_shift_invite: (4) הצהרה (5) קריאת הפרמטרים לפני השליפה (6) תנאי-התוקף ב-WHERE.
--       🚫 לא נוגע: הודעת-השגיאה הגנרית · הסטטוסים · מה נכתב ב-assignments · שעות_אירוע_דחוף (לא בשרת).
--       ⚠️ אין תקרה בשרת (המסך מגביל ל-1–72 ב-`paramsRegistry.js`); השרת רק מסרב לערך שאינו שלם חיובי.
-- 📏 הגוף החי לפני (25/09, pg_get_functiondef):
--      get_shift_invite(text)               md5 `806266dc13c7a90be059d02220adfaa6` · 2,493 תווים
--      respond_to_shift_invite(text,text)   md5 `b56bbcbe51cf99617b72fe83dfa6543b` · 1,766 תווים
-- 📏 הגוף הצפוי אחרי (שתי הרצות יבשות, 25/09 ~03:1X, כל אחת DO אחד שמריץ את הקובץ הזה ב-EXECUTE ומסתיים ב-raise;
--    אחריהן נבדק: שני הגופים עדיין ב-md5 של "לפני", params 48/24, שורות פרויקט 11 כמו שהיו):
--      get_shift_invite(text)               md5 `535d8be8d3f68f6c363f079196c0df38` · 3,123 תווים
--      respond_to_shift_invite(text,text)   md5 `7c5eb8a0c8811c4091dbec0abb9411fb` · 2,368 תווים
--    prosecdef · proconfig (search_path='') · proacl — זהים לפני/אחרי.
--    התנהגות (זימון של פרויקט 11, הפוך זמנית ל-pending — לא 1620/1615): נשלח לפני 10 שעות ⇒ awaiting ו-expires_at
--    **זהה בדיוק** לפני ואחרי · לפני 50 שעות ⇒ פג, לפני ואחרי · תוקף=72 ⇒ חוזר ל-awaiting, expires_at = שליחה+72.00,
--    ו-respond מקבל · תוקף='abc' ⇒ נופל ל-48: פג, ו-respond מסרב · סף=30 ⇒ עובד, אותו expires_at.
-- reversible: כן — הגופים הקודמים (md5 למעלה) או ההחלפות ההפוכות. אין שינוי-סכמה, אין נתונים, אין שינוי-התנהגות
--             כל עוד הפרמטרים 48/24.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $inv$
declare
  v_oid oid;
  v_def text;
  -- הקריאה המשותפת: ערך שלם חיובי (עד 4 ספרות, רווחים מותרים) ⇒ הוא; כל דבר אחר ⇒ ברירת-המחדל.
  c_read text := $r$
  -- ✏️ 25/09/2026: החלון נקרא מ-params — אותם שני פרמטרים שהמסך מציג. חסר/לא שלם חיובי ⇒ 48/24, לא כשל.
  select case when param_value ~ '^\s*0*[1-9][0-9]{0,3}\s*$' then btrim(param_value)::int end
    into v_valid_h from public.params where param_name = 'שעות_תוקף_זימון';
  select case when param_value ~ '^\s*0*[1-9][0-9]{0,3}\s*$' then btrim(param_value)::int end
    into v_cutoff_h from public.params where param_name = 'שעות_סף_זימון_לפני_אירוע';
  v_valid_h := coalesce(v_valid_h, 48);
  v_cutoff_h := coalesce(v_cutoff_h, 24);
$r$;
  c_vars text := $v$
  v_valid_h int;
  v_cutoff_h int;
$v$;

  -- ── get_shift_invite ──
  g_old_decl text := $o$  v_expires timestamptz;
$o$;
  g_old_check text := $o$  if v_row.invite_sent_at is null
     or v_row.invite_sent_at + interval '48 hours' <= now()
     or (v_row.event_start - interval '24 hours') <= now() then
$o$;
  g_new_check text := $n$  if v_row.invite_sent_at is null
     or v_row.invite_sent_at + make_interval(hours => v_valid_h) <= now()
     or (v_row.event_start - make_interval(hours => v_cutoff_h)) <= now() then
$n$;
  g_old_exp text := $o$  v_expires := least(v_row.invite_sent_at + interval '48 hours',
                     v_row.event_start - interval '24 hours');
$o$;
  g_new_exp text := $n$  v_expires := least(v_row.invite_sent_at + make_interval(hours => v_valid_h),
                     v_row.event_start - make_interval(hours => v_cutoff_h));
$n$;

  -- ── respond_to_shift_invite ──
  r_old_decl text := $o$  v_number int;
$o$;
  r_old_sel text := $o$  select a.project_id, a.hostess_id, a.assignment_number
$o$;
  r_old_where text := $o$     and a.invite_sent_at + interval '48 hours' > now()
     and (((p.final_event_date + coalesce(p.final_start_time, time '00:00'))
            at time zone 'Asia/Jerusalem') - interval '24 hours') > now()
$o$;
  r_new_where text := $n$     and a.invite_sent_at + make_interval(hours => v_valid_h) > now()
     and (((p.final_event_date + coalesce(p.final_start_time, time '00:00'))
            at time zone 'Asia/Jerusalem') - make_interval(hours => v_cutoff_h)) > now()
$n$;
begin
  -- get_shift_invite(text)
  v_oid := 'public.get_shift_invite(text)'::regprocedure;
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, g_old_decl, ''))) <> length(g_old_decl) then
    raise exception 'inv: get_shift_invite declare segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, g_old_check, ''))) <> length(g_old_check) then
    raise exception 'inv: get_shift_invite expiry-check segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, g_old_exp, ''))) <> length(g_old_exp) then
    raise exception 'inv: get_shift_invite expires_at segment not exactly once'; end if;
  v_def := replace(v_def, g_old_decl, g_old_decl || ltrim(c_vars, E'\n'));
  v_def := replace(v_def, g_old_check, ltrim(c_read, E'\n') || g_new_check);
  v_def := replace(v_def, g_old_exp, g_new_exp);
  if position('interval ''48 hours''' in v_def) > 0 or position('interval ''24 hours''' in v_def) > 0 then
    raise exception 'inv: get_shift_invite still has a constant window'; end if;
  execute v_def;

  -- respond_to_shift_invite(text,text)
  v_oid := 'public.respond_to_shift_invite(text,text)'::regprocedure;
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, r_old_decl, ''))) <> length(r_old_decl) then
    raise exception 'inv: respond declare segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, r_old_sel, ''))) <> length(r_old_sel) then
    raise exception 'inv: respond select segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, r_old_where, ''))) <> length(r_old_where) then
    raise exception 'inv: respond where segment not exactly once'; end if;
  v_def := replace(v_def, r_old_decl, r_old_decl || ltrim(c_vars, E'\n'));
  v_def := replace(v_def, r_old_sel, ltrim(c_read, E'\n') || E'\n' || r_old_sel);
  v_def := replace(v_def, r_old_where, r_new_where);
  if position('interval ''48 hours''' in v_def) > 0 or position('interval ''24 hours''' in v_def) > 0 then
    raise exception 'inv: respond still has a constant window'; end if;
  execute v_def;
end $inv$;
