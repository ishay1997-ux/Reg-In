-- why: סבב תיקוני-אמת מתוך מעבר-העיניים על המסכים (screens-pass.md 25/09 03:4X, ממצא #2; הכרעת הסגן: "מה שאומר
--      למנהלת דבר לא נכון — מתקנים הלילה"). ברשימת הפרויקטים, 1620: *"8/10 · חסרות 2 · 5 זימונים ממתינים למענה"*.
--      בכרטיס של אותו פרויקט: *"אין אף זימון חי … 5 הזימונים הפתוחים פגו"*. ‏`list_projects_overview` סופר כל שורה
--      ב-`pending` בלי לבדוק תפוגה, והכרטיס (`isInviteExpired`, src/lib/hostesses.js) כן בודק.
--      📏 נמדד 25/09 (קריאה בלבד): ב-193 פרויקטים יש `pending` — ו**כל** הזימונים הפתוחים בהם כבר פגו (48 שעות,
--      `שעות_תוקף_זימון`). כלומר ברשימה, בכל שורה שאומרת "N זימונים ממתינים", ה-N הוא זימונים מתים.
-- what: החלפות "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר.
--       (1) declare: ‏`v_validity_hours`.
--       (2) קוראים את `שעות_תוקף_זימון` מ-params, מיד אחרי בדיקת-ההרשאה. ערך חסר או לא-מספרי ⇒ null.
--       (3) העמודה `pending_invites` סופרת רק זימון **חי**: השורה הקובעת של הדיילת (אותו distinct on) ב-`pending`,
--           ו**לא** פג — פג = `invite_sent_at` ידוע ועברו `שעות_תוקף_זימון` שעות. זה בדיוק הכלל של הכרטיס:
--           `inviteHoursLeft` ⇒ 0. ‏null (סף חסר או שעת-שליחה חסרה) ⇒ "לא פג", כמו בכרטיס (שם זה `null`, לא 0).
--           🔑 הכרטיס בודק רק את `שעות_תוקף_זימון`, לא את `שעות_סף_זימון_לפני_אירוע` — ולכן גם כאן.
--       🔗 מי קורא את העמודה: ‏`gapSentence` ברשימה (src/lib/projects.js) · עמודת-הייצוא "זימונים ממתינים" ·
--          ‏`TeamTab` לתפקיד שאינו רואה דיילות (`overviewRow.pending_invites` — שם הוא הוצג כ"ממתינים למענה" גם הוא).
--          אחרי השינוי שלושתם אומרים "ממתין" רק על זימון שעוד אפשר לענות עליו.
--       🚫 לא נוגע: שאר 16 העמודות · הסדר · ההרשאות.
-- 📏 הגוף החי לפני: md5 `3043c1d85f884c0cac06dd1f6a3c8990`, ‏3,261 תווים.
-- 📏 הגוף הצפוי אחרי: md5 `de9b39d71c425dfb7124a443b71450f3`, ‏3,900 תווים — בלוק-ניסיון (25/09): אותו DO (md5 הבלוק
--    `47fb2bf3…` נבדק במסד מול הקובץ) ב-EXECUTE בתוך DO שמסתיים ב-raise ⇒ גלגול; ACL זהה; קריאה כמנכ"ל לפני/אחרי:
--    837/837 שורות · `pending_invites` זז ב-193 שורות, בכולן ל-0 (193 ⇐ 0 שורות עם זימון ממתין) · 1620: ‏5 ⇐ 0 ·
--    16 העמודות האחרות זהות בכל 837 השורות.
-- reversible: כן — ההחלפות ההפוכות, או הגוף הקודם (md5 למעלה). אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $ovl$
declare
  v_oid oid;
  v_def text;
  -- (1) declare.
  v_old_decl text := $o$  v_can_read_quotes boolean;
$o$;
  v_new_decl text := $n$  v_can_read_quotes boolean;
  v_validity_hours numeric;
$n$;
  -- (2) הסף.
  v_old_perm text := $o$  perform public.assert_module_permission('פרויקטים', array['edit', 'view']);
$o$;
  v_new_perm text := $n$  perform public.assert_module_permission('פרויקטים', array['edit', 'view']);

  -- ✏️ 25/09/2026: תוקף-הזימון, כמו בכרטיס (`isInviteExpired`). לא-מספרי או חסר ⇒ null ⇒ שום זימון אינו "פג".
  select case when trim(pa.param_value) ~ '^[0-9]+(\.[0-9]+)?$' then trim(pa.param_value)::numeric end
    into v_validity_hours
    from public.params pa
   where pa.param_name = 'שעות_תוקף_זימון';
$n$;
  -- (3) הספירה.
  v_old_pend text := $o$      (select count(*)
         from (select distinct on (a.hostess_id) a.assignment_status
                 from public.assignments a
                where a.project_id = p.project_id
                order by a.hostess_id, a.assignment_number desc) w
        where w.assignment_status = 'pending')::integer,
$o$;
  v_new_pend text := $n$      -- ✏️ 25/09/2026 (סבב תיקוני-אמת): רק זימון חי. היה: כל `pending`, גם כשהקישור מת מזמן —
      --    ברשימה "5 זימונים ממתינים למענה" ובכרטיס "אין אף זימון חי" על אותו פרויקט.
      (select count(*)
         from (select distinct on (a.hostess_id) a.assignment_status, a.invite_sent_at
                 from public.assignments a
                where a.project_id = p.project_id
                order by a.hostess_id, a.assignment_number desc) w
        where w.assignment_status = 'pending'
          and not coalesce(w.invite_sent_at + v_validity_hours * interval '1 hour' <= now(), false))::integer,
$n$;
begin
  v_oid := 'public.list_projects_overview()'::regprocedure;
  v_def := pg_get_functiondef(v_oid);

  if (length(v_def) - length(replace(v_def, v_old_decl, ''))) <> length(v_old_decl) then
    raise exception 'ovl: declare segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_perm, ''))) <> length(v_old_perm) then
    raise exception 'ovl: permission segment not exactly once'; end if;
  if (length(v_def) - length(replace(v_def, v_old_pend, ''))) <> length(v_old_pend) then
    raise exception 'ovl: pending segment not exactly once'; end if;

  v_def := replace(v_def, v_old_decl, v_new_decl);
  v_def := replace(v_def, v_old_perm, v_new_perm);
  v_def := replace(v_def, v_old_pend, v_new_pend);
  execute v_def;
end $ovl$;
