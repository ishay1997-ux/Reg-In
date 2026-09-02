-- =============================================================================
-- מודול 9 · מיגרציה A · צעד 1.1 — בעלות על פרמטרים · טיפוס שישי · שש הגדרות חדשות
-- =============================================================================
-- **מה המיגרציה עושה, בסדר הזה (קובץ אחד = טרנזקציה אחת):**
--   ① עמודה `owner_role_id` על `params` — מי "הבעלים הטבעי" של ההגדרה (§7.70 ↳ 23/07:
--      מפת-הבעלות · R-2 02/09: הדלת השנייה "ההגדרות שלי").
--   ② הרחבת `params_param_type_check` לשישה ערכים — `shift_invites` ("שיבוץ וזימונים",
--      G-1, ישי 02/09). **ההרחבה לפני ההכנסה** (מוקש T2).
--   ③ שש הגדרות חדשות שעד היום היו קבועים בקוד (G-2, ישי 02/09 — מדריך-הצעדים ①ו):
--      24 · 48 · 72 שעות-זימון · סף שביעות-רצון 3 · סף לוגיסטיקה 10 ימי-עסקים · 7 ימי-אזהרה.
--   ④ מפת-הבעלות — 38 שורות לפי "בעלים טבעי" (Q-4, ישי 02/09), **בשמות-התפקידים החיים**
--      (מוקש T4: §7.70 כותב "מנהלת כספים"/"מנהלת גיוס" — מקוצרים; במסד השמות המלאים,
--      ו-subquery על שם שגוי מחזיר NULL **בשקט**). ⇒ שער-כישלון-רועש: אם לא בדיוק 38
--      שורות קיבלו בעלים — המיגרציה נופלת ומתגלגלת אחורה כולה.
--   ⑤ מחיקת שתי שורות שאיש לא קורא (Q-2, ישי 02/09): `תבנית_איפוס_סיסמה` (Supabase Auth
--      שולח את המייל בעצמו) ו-`קישור_בסיס_סקר_לקוחות` (מ8 החליף בקישור-פר-פרויקט).
--      **בדיקת-המחיקה (כלל-הפריסה):** `git show origin/main:<file> | grep` על כל קובץ
--      שאי-פעם נקב בשם — `origin/main` = `73c61d5` (02/09/2026 21:12) — **אפס קוראים
--      מבצעיים**; רק מיגרציות-Seed, תיעוד, והערת-מצבה ב-`shiftEmails.js:254`.
--   ⑥ שכתוב מדיניות-הכתיבה: `params_write_ceo_only` (FOR ALL) יורדת, ובמקומה **שלוש
--      מדיניות פר-פקודה** — UPDATE למחזיק-`edit` ב-'הגדרות מערכת' **או** לבעלים; INSERT
--      ו-DELETE למחזיק-`edit` בלבד. SELECT (`params_select_all_authenticated`) לא נוגעים.
--      ⇒ **4 מדיניות, אחת לכל פקודה** — אפס `multiple_permissive_policies`.
--
-- **מה זה משנה בהיררכיית-ההכרעות:** §7.21 (06/07) קבע "בלי בעלות ברמת-רשומה" — **נדרס
-- ל-`params` בלבד** בהכרעות המאוחרות §7.70↳ (23/07) + R-2 (02/09), ואושר מפורשות ב-Q-1
-- (02/09). §7.83: פסוקית-הכתיבה ("params לפי מטריצת 'הגדרות מערכת'") **מורחבת** לבעלים.
-- §7.84: כרטיס-המחירים יוצא מלשונית "מחירים" (Q-1) — זה שינוי-קוד, לא DB.
--
-- **הפיכוּת:** ①②③⑥ הפיכים (drop column · CHECK ישן · delete rows · policies). ⑤ **אינו
-- הפיך בלי re-seed** — גוף תבנית-האיפוס חי רק במיגרציה `20260723112000`; ישי הכריע (Q-2).
-- **כלל-הפריסה:** הכל תוספת/הרחבה חוץ מ-⑤, שנבדק כנ"ל. הקוד הפרוס לא יכול להישבר.
-- **`updated_at` על 38 השורות הממופות יזוז** (טריגר `moddatetime`) — מקובל ומוצהר (V-11).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- ① עמודת-הבעלות + FK + אינדקס-מכסה (C-1)
-- -----------------------------------------------------------------------------
alter table public.params
  add column owner_role_id integer null
    references public.roles(role_id) on update restrict on delete set null;

create index params_owner_role_id_idx on public.params(owner_role_id);

comment on column public.params.owner_role_id is
  'התפקיד שהוא "הבעלים הטבעי" של ההגדרה ורשאי לערוך אותה מ"ההגדרות שלי" (§7.70↳ · R-2). NULL = מנכ"ל בלבד. מודול 9.';


-- -----------------------------------------------------------------------------
-- ② הטיפוס השישי — לפני ההכנסה (T2)
-- -----------------------------------------------------------------------------
alter table public.params drop constraint params_param_type_check;
alter table public.params add constraint params_param_type_check
  check (param_type = any (array[
    'pricing_timing', 'control_alerts', 'smart_match', 'templates', 'integration_tech', 'shift_invites'
  ]));


-- -----------------------------------------------------------------------------
-- ③ שש ההגדרות שיצאו מהקוד (הערכים = מה שהיה בקוד; חוזרים-בטוחים)
-- -----------------------------------------------------------------------------
insert into public.params (param_name, param_type, param_value) values
  ('שעות_סף_זימון_לפני_אירוע', 'shift_invites',  '24'),
  ('שעות_תוקף_זימון',           'shift_invites',  '48'),
  ('שעות_אירוע_דחוף',           'shift_invites',  '72'),
  ('סף_שביעות_רצון',            'control_alerts', '3'),
  ('סף_לוגיסטיקה_ימי_עסקים',    'control_alerts', '10'),
  ('ימי_אזהרה_הצעה_פגה',        'pricing_timing', '7')
on conflict (param_name) do nothing;


-- -----------------------------------------------------------------------------
-- ⑤ המחיקה (Q-2) — לפני מפת-הבעלות, כדי שהספירה תהיה על 43 שורות
-- -----------------------------------------------------------------------------
delete from public.params
 where param_name in ('תבנית_איפוס_סיסמה', 'קישור_בסיס_סקר_לקוחות');


-- -----------------------------------------------------------------------------
-- ④ מפת-הבעלות — שמות חיים, byte-exact (T4). 8 + 4 + 25 + 1 = 38.
-- -----------------------------------------------------------------------------
-- מנהלת כספים ולקוחות — 8
update public.params
   set owner_role_id = (select r.role_id from public.roles r where r.role_name = 'מנהלת כספים ולקוחות')
 where param_name in (
   'אחוז_מעמ', 'שכר_מינימום_שעתי', 'מייל_משרד_רואי_חשבון',
   'סף_שביעות_רצון', 'סכום_נסיעות_למשמרת', 'תנאי_תשלום_ימים',
   'תבנית_מייל_חשבונית_מס', 'תבנית_מייל_דוח_שכר'
 );

-- מנהלת פרויקטים — 4
update public.params
   set owner_role_id = (select r.role_id from public.roles r where r.role_name = 'מנהלת פרויקטים')
 where param_name in (
   'ימי_תוקף_הצעה', 'ימי_אזהרה_קדם_אירוע', 'תבנית_מייל_הצעת_מחיר', 'ימי_אזהרה_הצעה_פגה'
 );

-- מנהלת גיוס ושיבוץ — 25 (13 smart_match + 3 shift_invites + 2 + 7 תבניות לדיילות)
update public.params
   set owner_role_id = (select r.role_id from public.roles r where r.role_name = 'מנהלת גיוס ושיבוץ')
 where param_type in ('smart_match', 'shift_invites')
    or param_name in (
      'יחס_אורחים_לדיילת', 'שעות_תזכורת_לדיילת',
      'תבנית_זימון_משמרת', 'תבנית_מייל_שחרור_משמרת',
      'תבנית_מייל_ביטול_משמרת', 'תבנית_אישור_סופי_שיבוץ', 'תבנית_תזכורת_משמרת',
      'תבנית_מייל_אירוע_בוטל', 'תבנית_מייל_פרטי_האירוע_השתנו'
    );

-- מנהלת לוגיסטיקה — 1
update public.params
   set owner_role_id = (select r.role_id from public.roles r where r.role_name = 'מנהלת לוגיסטיקה')
 where param_name = 'סף_לוגיסטיקה_ימי_עסקים';

-- שער-כישלון-רועש: שם-תפקיד שגוי ⇒ NULL בשקט ⇒ הספירה לא תגיע ל-38 ⇒ הכל מתגלגל אחורה.
do $$
declare v_owned integer; v_total integer; v_roles integer;
begin
  select count(*) into v_roles from public.roles
   where role_name in ('מנהלת כספים ולקוחות', 'מנהלת פרויקטים', 'מנהלת גיוס ושיבוץ', 'מנהלת לוגיסטיקה');
  if v_roles <> 4 then
    raise exception 'מודול 9 · מיגרציה A: נמצאו % מתוך 4 שמות-תפקידים — שם אחד לפחות אינו תואם את roles; המיגרציה בוטלה', v_roles;
  end if;
  select count(*) into v_total from public.params;
  select count(*) into v_owned from public.params where owner_role_id is not null;
  if v_total <> 43 or v_owned <> 38 then
    raise exception 'מודול 9 · מיגרציה A: צפוי 43 שורות / 38 בבעלות, נמצאו % / % — המיגרציה בוטלה', v_total, v_owned;
  end if;
end $$;


-- -----------------------------------------------------------------------------
-- ⑥ מדיניות-כתיבה — אחת לכל פקודה (T3). SELECT נשארת כפי שהיא (§7.83).
-- -----------------------------------------------------------------------------
drop policy params_write_ceo_only on public.params;

create policy params_update_settings_or_owner on public.params
  for update to authenticated
  using (
    exists (
      select 1 from public.permissions p
       where p.role_id = (select public.current_user_role_id())
         and p.module_id = (select m.module_id from public.modules m where m.module_name = 'הגדרות מערכת')
         and p.permission_level = 'edit'
    )
    or owner_role_id = (select public.current_user_role_id())
  )
  with check (
    exists (
      select 1 from public.permissions p
       where p.role_id = (select public.current_user_role_id())
         and p.module_id = (select m.module_id from public.modules m where m.module_name = 'הגדרות מערכת')
         and p.permission_level = 'edit'
    )
    or owner_role_id = (select public.current_user_role_id())
  );

create policy params_insert_settings_only on public.params
  for insert to authenticated
  with check (
    exists (
      select 1 from public.permissions p
       where p.role_id = (select public.current_user_role_id())
         and p.module_id = (select m.module_id from public.modules m where m.module_name = 'הגדרות מערכת')
         and p.permission_level = 'edit'
    )
  );

create policy params_delete_settings_only on public.params
  for delete to authenticated
  using (
    exists (
      select 1 from public.permissions p
       where p.role_id = (select public.current_user_role_id())
         and p.module_id = (select m.module_id from public.modules m where m.module_name = 'הגדרות מערכת')
         and p.permission_level = 'edit'
    )
  );
