-- why: בדיקת-ניסוח עצמאית של מחרוזות הלילה (Reg-In-evidence/reports-review-2026-09-25/night/tonight-copy-review.md,
--      ממצא 0-9, "מבלבל", רדום). הלילה 20260925040200 קבע שברשימת הפרויקטים "ממתין" = זימון **חי** בלבד (השורה
--      הקובעת של הדיילת, ב-`pending`, ושלא עברו `שעות_תוקף_זימון` שעות מהשליחה). באריח "אירועים עם חוסר" במ14 עדיין
--      נספרת כל שורת `pending` בטבלה — גם זימון שפג, וגם שורה ישנה שהוחלפה בזימון חדש יותר לאותה דיילת. אותה מילה,
--      "ממתינים", בשתי הגדרות. היום הערך בשני המקרים 0, ולכן זה לא נראה.
-- what: החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר.
--       (1) declare: ‏`v_invite_hours`.
--       (2) קוראים את `שעות_תוקף_זימון`, מיד אחרי קריאת מקדם-הענבר. ערך חסר או לא-מספרי ⇒ null ⇒ שום זימון אינו "פג"
--           — אותו כלל כמו 040200 ו-`isInviteExpired` בכרטיס. לא נכנס ל-`v_missing`: הוא לא מפיל את הדוח.
--       (3) ה-CTE `folded` (השורה הקובעת של כל דיילת בכל פרויקט) מביא גם את `invite_sent_at`.
--       (4) `pend` סופר מתוך `folded` — רק `pending` שלא פג. היה: כל שורת `pending` ב-`assignments`.
--       🚫 לא נוגע: שאר האריחים · הטבלה · הנוסח "‹N› זימונים ממתינים" / "זימון אחד ממתין".
-- 📏 הגוף החי לפני: md5 `092b22fb62ad4071649704ffddf3c689`, ‏32,008 תווים (= אחרי 20260925030200; נמדד 25/09 06:1X).
--    ⚠️ 010350 (הדלת של מ14, "אחרי העלייה לאוויר") נוגע באריח אחר באותה פונקציה. הקטעים כאן אינם חופפים לשלו,
--    ולכן הסדר ביניהם לא משנה — אבל ה-md5 שאחרי תלוי בסדר. ר' שורת-הבדיקה בסוף הקובץ.
-- 📏 הגוף הצפוי אחרי (כשמוחל לפני 010350): md5 `6d0b405cd0cfba2b40c24dd7aec7c55d`, ‏32,763 תווים — בלוק-ניסיון
--    (25/09 06:2X, כמנכ"ל, pg_temp, מתגלגל; md5 הבלוק `98d55419…` נבדק במסד מול הקובץ). קריאה 25/09/2025–25/09/2026:
--    אפס שינויים בדוח (האריח: "4 מתוך 21 אירועים · 14 מקומות · 0 זימונים ממתינים" לפני ואחרי).
--    📏 מדידה נפרדת, אותו יום: 290 שורות `pending` בטבלה, 290 מהן קובעות, **0 חיות** (תוקף 48 שעות) ⇒ ההבדל רדום היום.
-- reversible: כן — ההחלפות ההפוכות, או הגוף הקודם (md5 למעלה). אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — ממתין לאישור ישי.

do $m14p$
declare
  v_oid oid;
  v_def text;
  -- (1) declare.
  v_old_decl text := $o$  v_gap_pending integer;
$o$;
  v_new_decl text := $n$  v_gap_pending integer;
  v_invite_hours numeric;
$n$;
  -- (2) הסף.
  v_old_par text := $o$  if v_amber_coef is null then v_missing := v_missing || 'מקדם_אמינות_ענבר'; end if;
$o$;
  v_new_par text := $n$  if v_amber_coef is null then v_missing := v_missing || 'מקדם_אמינות_ענבר'; end if;

  -- ✏️ 25/09/2026 (בדיקת-ניסוח 0-9): תוקף-הזימון, כמו ברשימת הפרויקטים (040200) ובכרטיס (`isInviteExpired`).
  --    לא-מספרי או חסר ⇒ null ⇒ שום זימון אינו "פג". לא מפיל את הדוח.
  select case when btrim(pa.param_value) ~ '^[0-9]+(\.[0-9]+)?$' then btrim(pa.param_value)::numeric end
    into v_invite_hours
    from public.params pa where pa.param_name = 'שעות_תוקף_זימון';
$n$;
  -- (3) folded מביא את שעת-השליחה.
  v_old_fold text := $o$  with folded as (
    select a.project_id, a.assignment_status
$o$;
  v_new_fold text := $n$  with folded as (
    select a.project_id, a.assignment_status, a.invite_sent_at
$n$;
  -- (4) pend: רק זימון חי.
  v_old_pend text := $o$    select project_id, count(*) filter (where assignment_status = 'pending') as p from public.assignments group by project_id
$o$;
  v_new_pend text := $n$    -- ✏️ 25/09/2026 (בדיקת-ניסוח 0-9): רק זימון חי, מתוך השורה הקובעת של הדיילת. היה: כל שורת `pending`
    --    בטבלה, גם שפגה וגם שהוחלפה — "ממתינים" כאן ו"ממתינים" ברשימת הפרויקטים (040200) אמרו שני דברים.
    select project_id, count(*) filter (where assignment_status = 'pending'
                                          and not coalesce(invite_sent_at + v_invite_hours * interval '1 hour' <= now(), false)) as p
      from folded group by project_id
$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m14_hostess_overview';
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_decl, ''))) <> length(v_old_decl) then
    raise exception 'm14p: declare segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_par, ''))) <> length(v_old_par) then
    raise exception 'm14p: param segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_fold, ''))) <> length(v_old_fold) then
    raise exception 'm14p: folded segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_pend, ''))) <> length(v_old_pend) then
    raise exception 'm14p: pend segment not exactly once'; end if;

  v_def := replace(v_def, v_old_decl, v_new_decl);
  v_def := replace(v_def, v_old_par, v_new_par);
  v_def := replace(v_def, v_old_fold, v_new_fold);
  v_def := replace(v_def, v_old_pend, v_new_pend);
  execute v_def;
end $m14p$;
