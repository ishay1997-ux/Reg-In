-- =============================================================================
-- ‏N1 · החצי התוסף — `hostesses.languages` → טבלת-בת `hostess_languages`
-- =============================================================================
-- **מה זה, ומה זה לא.** ‏`hostesses.languages` הוא `text[]` — **העמודה היחידה במסד
-- שמחזיקה רשימה בתא אחד**, כלומר ההפרה היחידה של 1NF שנמצאה בסריקת-הנרמול
-- (‏27/08/2026, סשן-חקירת-מסד; אושר ע"י ישי באותו יום).
--
-- 🔴 **וההבדל מ-ה19 חשוב, כי הוא קובע את ההרשאות:** פיצול פרטי-הבנק היה
-- **אבטחתי** — המטרה הייתה שפחות תפקידים יראו את השדות, ולכן טבלת-הבת קיבלה
-- policies **מצומצמות**. ‏N1 הוא **נרמול בלבד**: שמות-שפה אינם רגישים, ומי
-- שרואה דיילת אמור לראות את שפותיה. ⇒ **ה-policies כאן משקפות אחת-לאחת את
-- אלה של `hostesses`** *(נמדדו חי לפני הכתיבה)*:
--   ‏`hostesses_select_by_permission` — 'דיילות' ב-edit **או** view
--   ‏`hostesses_write_by_permission`  — 'דיילות' ב-edit, ‏FOR ALL
-- 🚫 **צמצום כאן היה שובר קוראים בשקט**, כי RLS מחזיר רשימה ריקה בלי שגיאה.
--
-- 📏 **נמדד לפני הכתיבה (27/08/2026 18:3X):** ‏26 דיילות · ‏0 עם `NULL` ·
--    ‏6 עם מערך ריק · ‏20 עם שפות · **33 שורות-שפה בסך-הכול** · מקסימום 3 לדיילת ·
--    חמישה ערכים מובחנים: אמהרית · אנגלית · עברית · ערבית · רוסית.
--
-- ⚠️ **זה החצי התוסף בלבד. העמודה `languages` נשארת** — ‏`origin/main` כותב
-- אליה (`HostessFormDialog.jsx:222`) וקורא אותה (`HostessViewCard.jsx:328`).
-- **מחיקתה = מיגרציה נפרדת, רק אחרי שהקוד המתוקן נפרס** (כלל-הפריסה,
-- `supabase/migrations/CLAUDE.md`). זו בדיוק הצורה שבה C ו-C2 רצו היום.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- ① הטבלה
-- -----------------------------------------------------------------------------
-- 🔑 **מפתח ראשי מורכב `(hostess_id, language)` ולא מפתח-סוגט.** הוא **מונע
-- כפילות בהגדרה** — אותה שפה פעמיים לאותה דיילת היא בלתי-אפשרית, ולא "משהו
-- שהקוד ישמור עליו". זה בדיוק מה שמערך לא נתן: `{'עברית','עברית'}` היה חוקי.
-- ⚠️ ובניגוד ל-`hostess_bank_details`, כאן היחס הוא 1:N ולא 1:1.
create table hostess_languages (
  hostess_id bigint      not null,
  language   text        not null,
  created_at timestamptz not null default now(),
  constraint hostess_languages_pkey primary key (hostess_id, language),
  -- ‏cascade: דיילת שנמחקת לוקחת את שפותיה. אותה הכרעה כמו בטבלת-הבנק.
  -- ‏(במודול אין מחיקת-דיילות — יש השבתה — אבל האילוץ מתאר את היחס, לא את המסך.)
  constraint hostess_languages_hostess_id_fkey
    foreign key (hostess_id) references hostesses (hostess_id) on delete cascade,
  -- שפה ריקה או רווחים-בלבד אינה שפה. המערך הישן קיבל אותה בשקט.
  constraint hostess_languages_not_blank check (btrim(language) <> '')
);

comment on table hostess_languages is
  'מ8 · N1 (27/08/2026) — נרמול `hostesses.languages` מ-text[] לטבלת-בת. 1:N. ההרשאות זהות ל-hostesses (נרמול, לא אבטחה).';

-- אינדקס-כיסוי ל-FK (צ'קליסט-העיצוב §1: כל FK חדש מקבל אחד).
-- ⚠️ המפתח הראשי כבר מכסה `(hostess_id, …)` בתור עמודה מובילה — ולכן
-- **אינדקס נוסף על `hostess_id` לבדו היה מיותר**. מה שכן חסר הוא הכיוון ההפוך:
-- "מי מדברת ערבית?" — שאילתת-Smart-Match סבירה שאין לה אינדקס בלי זה.
create index hostess_languages_language_idx on hostess_languages (language);


-- -----------------------------------------------------------------------------
-- ② העתקת הנתונים — 33 שורות מ-20 דיילות
-- -----------------------------------------------------------------------------
-- ‏`distinct` הוא רשת: אם מערך כלשהו נושא כפילות, ה-PK היה מפיל את המיגרציה.
-- ‏`btrim` מנקה רווחי-קצה שהמערך אפשר ואילו ה-CHECK החדש אוסר.
insert into hostess_languages (hostess_id, language)
select distinct h.hostess_id, btrim(l)
  from hostesses h, lateral unnest(h.languages) as u(l)
 where btrim(l) <> '';


-- -----------------------------------------------------------------------------
-- ③ RLS — שיקוף מדויק של hostesses
-- -----------------------------------------------------------------------------
alter table hostess_languages enable row level security;

create policy hostess_languages_select_by_permission on hostess_languages
  for select to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = any (array['edit', 'view'])
    )
  );

-- ⚠️ ‏`for all` מכסה גם SELECT לבעל `edit` — ולכן מי שבודק "מה קורה בלי policy"
-- חייב להפיל את **שתיהן**. המוקש הזה כבר רשום ב-`src/CLAUDE.md`.
create policy hostess_languages_write_by_permission on hostess_languages
  for all to authenticated
  using (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  )
  with check (
    exists (
      select 1 from permissions p
      where p.role_id = (select current_user_role_id())
        and p.module_id = (select module_id from modules where module_name = 'דיילות')
        and p.permission_level = 'edit'
    )
  );


-- -----------------------------------------------------------------------------
-- ④ סימון העמודה הישנה
-- -----------------------------------------------------------------------------
comment on column hostesses.languages is
  '⚠️ מוחלפת ע"י hostess_languages (N1, 27/08/2026). נשארת זמנית רק כדי שהקוד שנפרס לא יישבר. תימחק במיגרציה N1b אחרי הפריסה — db_roadmap §9א. 🔴 קוד חדש קורא וכותב לטבלת-הבת.';
