-- why: בודק-ניסוח טרי, 25/09/2026 (tonight-copy-review.md, ממצא 0-4); הכרעת הסגן: תיקון-אמת במסד הלילה.
--      שורת-"אז מה" של מ15, כשאין אדומה: *"להזהיר את … הענבר — אף אחת אינה אדומה החודש."* הסימון האדום מחושב על
--      חלון קבוע של 12 חודשים (`v_from := v_to - interval '12 months'`, העמודה "הבריזה · ב-12 חודשים", החלון
--      "12 החודשים האחרונים" — נקרא בגוף החי 25/09). "החודש" מדבר על חודש אחד.
-- what: החלפה אחת, "בדיוק פעם אחת" (שתי השורות, יחיד ורבים, כקטע אחד), אותה חתימה ⇒ ה-ACL נשמר: "החודש" ⇐ "כרגע".
--       🚫 לא נוגע: הענפים האחרים של השורה · הספירות · הסימון.
-- 📏 הגוף החי לפני: md5 `c640e176d91b1f0c35455ed5ee4044a9`, ‏32,178 תווים.
-- 📏 הגוף הצפוי אחרי: md5 `d162caf3c1d537ee09f1f4bf02a9c3b2`, ‏32,266 תווים — בלוק-ניסיון משורשר (25/09): שלושת הקבצים (040300 · 040400 · 040500) ב-EXECUTE בתוך DO אחד שמסתיים ב-raise ⇒ גלגול;
--    md5 כל בלוק נבדק במסד מול הקובץ; ‏ACL של שלוש הפונקציות זהה לפני/אחרי; קריאה כמנכ"ל לפני/אחרי: הפלט זהה לפני/אחרי,
--    כי היום יש 5 אדומות והענף "אין אדומה" אינו פעיל; נבדק שהנוסח החדש ("אינה אדומה כרגע") נמצא בגוף.
-- reversible: כן — ההחלפה ההפוכה. אין שינוי-סכמה ואין נתונים.
-- ⏳ נכתב, לא הוחל — הסגן מחיל.

do $m15n$
declare
  v_oid oid;
  v_def text;
  v_old text := $o$        case when v_amber = 1 then 'להזהיר את דיילת הענבר — אף אחת אינה אדומה החודש.'
             else 'להזהיר את ' || to_char(coalesce(v_amber, 0), 'FM999,999,999') || ' דיילות הענבר — אף אחת אינה אדומה החודש.' end$o$;
  v_new text := $n$        -- ✏️ 25/09/2026 (בודק-ניסוח 0-4): "כרגע" ולא "החודש" — הסימון נמדד על 12 חודשים.
        case when v_amber = 1 then 'להזהיר את דיילת הענבר — אף אחת אינה אדומה כרגע.'
             else 'להזהיר את ' || to_char(coalesce(v_amber, 0), 'FM999,999,999') || ' דיילות הענבר — אף אחת אינה אדומה כרגע.' end$n$;
begin
  select p.oid into strict v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'report_m15_reliability';
  v_def := pg_get_functiondef(v_oid);
  if (length(v_def) - length(replace(v_def, v_old, ''))) <> length(v_old) then
    raise exception 'm15n: no-red so-what segment not exactly once'; end if;
  v_def := replace(v_def, v_old, v_new);
  execute v_def;
end $m15n$;
