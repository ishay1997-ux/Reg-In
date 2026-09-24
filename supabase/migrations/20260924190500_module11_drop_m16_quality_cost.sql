-- why: מ16 "איכות מול עלות" הוסר מהממשק (ליטושי-הכנס 0ג פריט 3; ישי 22/09: *"נראלי החלטנו למחוק את
--      המשטח הזה בכלל"*, 24/09: *"מאשר הכל"*), והקוד שהפסיק לקרוא לו נמצא בייצור מ-24/09/2026
--      (PR #158 ⇒ `main` `b5ef4255`, Vercel Production `6642131150` success — לוח מ12 §7א).
--      הפונקציה עדיין חיה ומחזירה את `hourly_rate` של כל דיילת גם להרשאת `view` על 'דיילות' — החוב
--      ב-`docs/PROJECT_MASTER.md` §6 ("מ13 ← מ11 · חשיפת `hourly_rate` ב-RPC"). ה-drop הוא מה שסוגר אותו.
--      אישור: ישי 24/09, *"מאשר את שינהם"* (53 עמודות-הסיבה + `drop report_m16` אחרי main) —
--      `docs/micro_guides/module-12.md` §5.
--      📏 נבדק לפני הכתיבה (24/09, grep על `src` · `e2e` · `supabase/functions` · `scripts`, בענף ובעץ של
--         `origin/main`): **אין קורא.** ההופעות היחידות: הערות · הרשימה `RETIRED_REPORT_TARGETS`
--         (`src/modules/11_reports/reportsCatalog.js`) · שתי פיקסטורות-בדיקה של יעד-אריח. ‏`callReport`
--         (`src/modules/11_reports/api.js`) מקבל את שם ה-RPC רק מ-`reportsCatalog`, ומ16 אינו בקטלוג.
--      ⚠️ האריח "דיילות פעילות" של `report_m14_hostess_overview` עדיין נושא
--         `target.report = 'report_m16_quality_cost'` כמחרוזת. זו אינה קריאה: הלקוח מציג את האריח עם
--         הערך ובלי דלת (`RETIRED_REPORT_TARGETS`), ולכן ה-drop אינו משנה דבר במסך.
-- what: ① שומר: עוצר אם גוף של פונקציה אחרת קורא ל-`report_m16_quality_cost(`. ‏plpgsql אינו רושם
--       תלות ב-`pg_depend`, ולכן `drop` רגיל לא היה נכשל על קורא כזה — הוא היה שובר אותו בשקט בזמן-ריצה.
--       ② `drop function` על החתימה המדויקת (`docs/schema.sql`, שורת `report_m16_quality_cost`), בלי
--       `if exists` ובלי `cascade`: חתימה שהשתנתה או תלות-אמת נכשלות בקול.
-- reversible: לא בפעולה אחת. השחזור = `create or replace` מהגוף החי שנשמר לפני ההחלה, ואחריו ה-ACL
--       (`revoke execute … from public, anon, authenticated` · `grant execute … to authenticated`) וה-comment.
--       הקבצים אינם שחזור מדויק: הגוף המלא האחרון הוא `20260917005500_module11_j1_rpc_round4.sql`, ועליו
--       רצו שלושה סבבי-טקסט על הגוף החי (`…l1_report_copy` · `…l2_tile_copy` · `…l5_card_standard_copy`).
--       🔴 לפני ההחלה (הסגן): לשמור מחוץ למסד את
--       `pg_get_functiondef('public.report_m16_quality_cost(date, date, integer, jsonb)'::regprocedure)`
--       ואת `proacl` שלה. זה הגיבוי.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m16drop$
declare
  v_callers text;
begin
  select string_agg(n.nspname || '.' || p.proname, ', ' order by n.nspname, p.proname)
    into v_callers
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname not in ('pg_catalog', 'information_schema')
     and p.proname <> 'report_m16_quality_cost'
     and strpos(p.prosrc, 'report_m16_quality_cost(') > 0;
  if v_callers is not null then
    raise exception 'm16 drop: report_m16_quality_cost is still called by %', v_callers;
  end if;
end
$m16drop$;

-- ✏️ 24/09/2026 (הסגן): גיבוי לפני בלתי-הפיך, באותה מיגרציה — הגוף החי המדויק נשמר ב-`seed_snapshot`
-- (הסכמה שבה הפרויקט כבר שומר גיבויים, ר' `20260924007000_module11_m2_feedback_notes_backup`), כך
-- שהגיבוי והמחיקה אטומיים יחד. שחזור: `execute (select def from seed_snapshot.function_backups where
-- fn_name = 'report_m16_quality_cost')`, ואז השוואת md5.
create table if not exists seed_snapshot.function_backups (
  fn_name  text        not null,
  saved_at timestamptz not null default now(),
  md5      text        not null,
  def      text        not null
);
revoke all on seed_snapshot.function_backups from public, anon, authenticated;

insert into seed_snapshot.function_backups (fn_name, md5, def)
select p.proname, md5(pg_get_functiondef(p.oid)), pg_get_functiondef(p.oid)
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'report_m16_quality_cost';

drop function public.report_m16_quality_cost(date, date, integer, jsonb);
