-- הכרעת-ישי, מילה-במילה: "מאשר את שינהם" (24/09/2026), אחרי שהסגן הציג לו את התיקון — להעתיק את הסיבה
--    מהמערך כמו ש-record_feedback עושה, בלי שאף דוח יזוז, ועם גיבוי. נבדק קודם בריצה-יבשה (begin … rollback).
-- why: 53 פרויקטים עם feedback_score מתחת ל-סף_שביעות_רצון (היום 3), negative_feedback_reason ריק
--      ו-negative_feedback_reasons מלא — שארית של הזריעה הממוקדת מ-23/09, שכתבה את המערך בלבד.
--      record_feedback (הגוף החי) כותב negative_feedback_reason = v_clean_negs[1] בכל ציון מתחת לסף,
--      ו-archive_project בודק את העמודה הבודדת בלבד ⇒ פרויקט 1550 (ממתין לתשלום, ציון 1, סיבה "ניהול
--      לקוי" במערך) היה נחסם בארכוב גם אחרי רישום תשלום: "חסום: הלקוח נתן ציון 1 — נדרש בירור טלפוני
--      ובחירת סיבה לפני העברה לארכיון." 52 האחרים כבר finished (שם אין השפעה על מסך).
-- what: negative_feedback_reason = negative_feedback_reasons[1] רק לשורות שבהן הציון מתחת לסף החי,
--       העמודה הבודדת null והמערך לא ריק. שער: בדיוק 53, וכל מערך הוא איבר אחד מתוך חמש הסיבות
--       התקינות — כלומר [1] שלו זהה ל-v_clean_negs[1] ש-record_feedback היה כותב.
--       🚫 66 הפרויקטים עם ציון ≥ 3 ומערך-סיבות-שליליות — לא נוגעים (הם מזינים את מ20/מ22).
--       קוראי העמודה הבודדת (נמדד 24/09): archive_project · get_project_finance_detail · record_feedback ·
--       submit_feedback — אף report_m* ואף view. בממשק (ClosingWindowDialog · ProjectCardPage ·
--       lib/projectCard) המערך קודם, והעמודה הבודדת רק fallback ⇒ אין שינוי-טקסט על המסך.
--       תופעת-לוואי: projects.updated_at של ה-53 זז (moddatetime); אף פונקציה ואף קוד-לקוח אינם קוראים אותו.
--       גיבוי: seed_snapshot.projects_negative_reason_single_20260924.
-- reversible: כן —
--   update public.projects p set negative_feedback_reason = b.negative_feedback_reason
--     from seed_snapshot.projects_negative_reason_single_20260924 b where b.project_id = p.project_id;

do $$
declare
  v_thr_text text;
  v_thr int;
  v_n int;
begin
  select param_value into v_thr_text from public.params where param_name = 'סף_שביעות_רצון';
  if v_thr_text is null or btrim(v_thr_text) !~ '^[0-9]+$' then
    raise exception 'data-fix ④: סף_שביעות_רצון אינו מספר (%). לא נכתב דבר.', v_thr_text;
  end if;
  v_thr := btrim(v_thr_text)::int;

  perform 1 from public.projects
   where feedback_score < v_thr and negative_feedback_reason is null
     and coalesce(cardinality(negative_feedback_reasons), 0) > 0
     for update;

  select count(*) into v_n
    from public.projects
   where feedback_score < v_thr and negative_feedback_reason is null
     and coalesce(cardinality(negative_feedback_reasons), 0) > 0;
  if v_n <> 53 then
    raise exception 'data-fix ④: % שורות לתיקון, צפוי 53. לא נכתב דבר.', v_n;
  end if;

  select count(*) into v_n
    from public.projects
   where feedback_score < v_thr and negative_feedback_reason is null
     and coalesce(cardinality(negative_feedback_reasons), 0) > 0
     and (cardinality(negative_feedback_reasons) <> 1
          or negative_feedback_reasons[1] not in ('איחור דיילות', 'תפקוד דיילות', 'איכות תגים', 'ניהול לקוי', 'אחר'));
  if v_n <> 0 then
    raise exception 'data-fix ④: ב-% מערכים אינם איבר-תקין-יחיד — [1] לא היה זהה לכלל של record_feedback. לא נכתב דבר.', v_n;
  end if;
end $$;

create table seed_snapshot.projects_negative_reason_single_20260924 as
select p.project_id, p.feedback_score, p.negative_feedback_reason, p.negative_feedback_reasons, p.updated_at,
       now() as captured_at
  from public.projects p
 where p.feedback_score < (select btrim(param_value)::int from public.params where param_name = 'סף_שביעות_רצון')
   and p.negative_feedback_reason is null
   and coalesce(cardinality(p.negative_feedback_reasons), 0) > 0;

comment on table seed_snapshot.projects_negative_reason_single_20260924 is
'גיבוי 53 פרויקטים (ציון מתחת לסף, סיבה בודדת ריקה, מערך מלא) לפני 20260924110000_data_fix_negative_reason_single. חזרה: ר'' כותרת הקובץ.';

update public.projects p
   set negative_feedback_reason = p.negative_feedback_reasons[1]
  from seed_snapshot.projects_negative_reason_single_20260924 b
 where b.project_id = p.project_id;

do $$
declare
  v_thr int := (select btrim(param_value)::int from public.params where param_name = 'סף_שביעות_רצון');
  v_n int;
begin
  select count(*) into v_n from seed_snapshot.projects_negative_reason_single_20260924;
  if v_n <> 53 then
    raise exception 'data-fix ④ סיום: בגיבוי % שורות, צפוי 53.', v_n;
  end if;
  select count(*) into v_n
    from public.projects p
    join seed_snapshot.projects_negative_reason_single_20260924 b on b.project_id = p.project_id
   where p.negative_feedback_reason is distinct from p.negative_feedback_reasons[1];
  if v_n <> 0 then
    raise exception 'data-fix ④ סיום: ב-% שורות הסיבה הבודדת אינה [1] של המערך.', v_n;
  end if;
  -- אף שורה אחרת לא נגעה: מתחת לסף — אין יותר ריק-מול-מערך; מעל/בסף — אותם 66 בדיוק, עדיין ריקים
  select count(*) into v_n
    from public.projects
   where feedback_score < v_thr and negative_feedback_reason is null
     and coalesce(cardinality(negative_feedback_reasons), 0) > 0;
  if v_n <> 0 then
    raise exception 'data-fix ④ סיום: נותרו % שורות מתחת לסף בלי סיבה בודדת.', v_n;
  end if;
  select count(*) into v_n
    from public.projects
   where feedback_score >= v_thr and coalesce(cardinality(negative_feedback_reasons), 0) > 0
     and negative_feedback_reason is null;
  if v_n <> 66 then
    raise exception 'data-fix ④ סיום: ה-66 עם ציון ≥ 3 זזו (% עכשיו).', v_n;
  end if;
end $$;
