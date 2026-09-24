-- why: הכרעת הסגן, 24/09/2026 ערב (הפיכה): אריח "הכנסות מתחילת השנה" במבט-על הנהלה (מ2) פתח את
--      `report_m03_trends`. עד 23/09 זה היה הדוח "מגמות רב-שנתיות". הקומיט `4281d924` (23/09 22:26,
--      "דוחות-החלטה") החליף אותו ב"סגירת הצעות", אותו rpc ואותו slug. ⇐ אריח על הכנסות נפתח היום על
--      דוח על הצעות. דוח-הכנסות אחר שמתאים כיעד אין ⇐ **האריח מאבד את הדלת** (`'target', null`),
--      כמו אריחי-העלות של מ12.
--      🚫 דחה (הסגן): להפנות לדוח אחר — אף אחד מהם לא עונה על שאלת-ההכנסות · להחזיר את "מגמות
--         רב-שנתיות" — החלטת-מוצר של ישי, נשאלת בנפרד.
--      📏 נמדד לפני הכתיבה (24/09, `pg_get_functiondef` חי, md5 `cdf27b682bb7e58812e81a7e8dc9d3aa`,
--         17,215 תווים): `report_m03_trends` מופיע בגוף **פעם אחת** — כ-target של האריח הזה. שלושת
--         האריחים האחרים פותחים את מ4 · מ8 · מ21, ולא נוגעים בהם.
--      🔎 מוצג למשתמשת? כן — `KpiTile` מצייר דלת רק כש-`target` קיים (דפוס `'target', null` חי במ12).
-- what: החלפה אחת "בדיוק פעם אחת" על הגוף החי, אותה חתימה ⇒ ה-ACL נשמר. הדפוס:
--       `20260924141000_module5_m12_status_names.sql`.
-- reversible: כן — ההחלפה ההפוכה. אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m02t$
declare
  v_oid oid;
  v_def text;
  v_old text := $o$'target', jsonb_build_object('tab', 'הנהלה', 'report', 'report_m03_trends', 'drill', null)),$o$;
  v_new text := $n$'target', null),$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m02_exec_overview';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, v_old, ''))) <> length(v_old) then
    raise exception 'm02t: revenue-tile target segment not exactly once'; end if;
  v_def := replace(v_def, v_old, v_new);
  execute v_def;
end $m02t$;
