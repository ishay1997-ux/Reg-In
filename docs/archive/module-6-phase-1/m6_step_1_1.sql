-- =====================================================================================
-- מודול 6 (פרויקטים) — מיגרציה A: עמודות מחזור-החיים על `projects`, הפלת `project_bonus`,
--                                  שני CHECK חסרים, והידוק שתי עמודות ל-NOT NULL
-- שם-קובץ מוצע: <ts>_module6_projects_columns_and_constraints.sql
-- =====================================================================================
-- why (⑭, הכרעת-ישי 13/08/2026): המודול מקבל **בדיוק שתי חותמות-זמן** — רגע הביטול ורגע
--   הסגירה-התפעולית. לשתיהן יש צרכן מוכח: בלי `cancelled_at` אי-אפשר לחשב את מדרגות-הפיצוי
--   לדיילות (0% / 50% / 100% לפי §7.16ב), ובלי `operationally_closed_at` השאלה "כמה זמן
--   הפרויקט הזה יושב בלי חשבונית" חסרת-תשובה. 🚫 **אין `ready_at` ואין חותמת לכל מעבר-סטטוס** —
--   לאלה אין צרכן, גם לא היפותטי.
--
-- why (AR-1 + ⑩, הכרעת-ישי 13/08/2026): סוג-הביטול הוא **עמודה אחת בת שלושה ערכים**
--   (`customer` · `force_majeure` · `other`), לצד `cancel_reason` החופשי שנשאר כפי שהוא.
--   ⑩ הסיר את "בעיית איוש" — במילותיו: *"שמעת על עסק שמבטל ללקוח כי אין לו עובדים?"*.
--   **סוג-הכסף נגזר בקוד ולא נשמר** (`other` מתנהג כמו `customer`), לפי התקדים
--   `src/lib/hostesses.js:36-37` — ערך שהוא פונקציה טהורה של ערך שמור: לגזור, לא לאחסן.
--   🔴 **והעמודה נשארת nullable בכוונה:** לפרויקט חי אין סוג-ביטול, ו-`not null` על עמודה
--   שריקה בכל השורות הקיימות מחייב ברירת-מחדל — וברירת-מחדל כאן היא שקר. החובה נאכפת
--   בתוך ה-RPC ‏`cancel_project` (צעד 1.8), לא ברמת-העמודה.
--
-- why (M6-13, נמצא בסריקת-הכיסוי-ההפוכה 13/08/2026): `negative_feedback_reason` היא הרשימה
--   הסגורה **היחידה** במודול שאיש לא רשם לה CHECK — `feedback_status` קיבלה, היא לא.
--   חמשת הערכים הם של `C6 §2.4.4`.
--
-- why (㉛, סוגר §7.36): **אין ערובה טרנזקציונית בין Storage ל-Postgres** ⇒ פרויקט יכול
--   "להיסגר" בעוד קובץ-הדוח לא עלה. ה-CHECK `projects_closed_needs_report` הוא הערובה:
--   סטטוס-סגירה כלשהו מחייב `summary_report_url`.
--   🔴 **שם-האילוץ תוקן בסבב-הבקרה 14/08/2026 מ-`project_closed_needs_report` (יחיד) ל-
--   `projects_closed_needs_report` (שם-הטבלה המלא).** נמדד חי: **44 מתוך 44** אילוצי-ה-CHECK
--   ב-`public` נושאים את שם-הטבלה המדויק כתחילית — **אפס חריגים**, כולל אלה שנוסחם פרוזה
--   (`quotes_approved_requires_vat` · `customers_company_number_9_digits` ·
--   `hostess_unavailability_range_valid`). הצורה הישנה הייתה החריג היחיד במסד כולו, והיא
--   נקראת כאילו היא שייכת לטבלה בשם `project`. ⚠️ **והתיקון גורר אדווה תיעודית — ראה
--   `m6_step_1_1.notes.md` §"מה תוקן בסבב הבקרה", פריט 2: **14 מופעים בשישה קבצים**,
--   כולם תיעוד/הערות ואף אחד מהם אינו טקסט שמשתמשת רואה.**
--
-- why (㉟, הכרעת-ישי 13/08/2026): *"לא עשינו בהצעת מחיר בונוס לפרויקט, בוא נמחק את זה"* —
--   ל-`projects.project_bonus` **אין מקור ואין קורא**. נמדד חי 14/08/2026: אפס policies,
--   אפס פונקציות, אפס views, אפס אינדקסים ואפס constraints מזכירים את העמודה, וכל ארבע
--   השורות החיות מחזיקות `0`. ‏`assignments.personal_bonus` **נשארת** — היא של מודול 8.
--
-- why (AR-9 / §7.62 / db_roadmap שורה `A-14`, הונהן במלואו ע"י ישי 13/08/2026 בערב):
--   ‏`projects.quote_id` ו-`projects.owner_email` מקבלות `SET NOT NULL`. ההידוק רץ **אחרון**,
--   אחרי ההפלה ואחרי כל שלב שיוצר שורות. שורת `A-14` נשארה פתוחה מ-M2/M3 בדיוק בשביל הרגע הזה.
--
-- why (אינדקסים על שתי ה-FK החדשות): כל עמודת-FK על `projects` נושאת היום אינדקס
--   (`projects_owner_email_idx` · `projects_customer_id_idx` · `projects_quote_id_key`) —
--   אפס חריגים. 🔴 **והנימוק שרשום בצ'קליסט של המדריך — "אין צורך כי `users(email)` ייחודית" —
--   שגוי:** יועץ-הביצועים בוחן את **העמודה המפנה**, לא את המופנית; בדיוק בגלל זה
--   `projects_owner_email_idx` קיים אף ש-`users(email)` הוא ה-PK. ⇒ שתי העמודות החדשות
--   מקבלות אינדקס מפורש-שם, והמערכת נשארת עקבית.
--
-- reversibility: **הפיכה במלואה חוץ ממשפט אחד.** חמש העמודות ניתנות ל-`drop column`, שלושת
--   ה-CHECKים ושתי ה-FK ל-`drop constraint`, שני האינדקסים ל-`drop index`, ושני ההידוקים
--   ל-`drop not null`. 🔴 **`drop column project_bonus` בלתי-הפיך — הנתונים נמחקים.**
--   מה שהופך אותו לבטוח כאן ולא במקום אחר: כל ארבע השורות מחזיקות `0` (נמדד חי 14/08/2026
--   11:2X ושוב 11:4X), ולכן אין מה לאבד. ⛔ **המשפט מוגן בבלוק-שומר** שמפיל את המיגרציה
--   כולה אם ולו שורה אחת שינתה ערך בין המדידה להחלה.
-- =====================================================================================

-- ── ② העמודות החדשות (⑭: בדיוק שתי חותמות · AR-1: עמודת סוג-ביטול אחת) ─────────────
alter table public.projects
  add column cancelled_at            timestamptz,
  add column cancelled_by            text,
  add column cancel_type             text,
  add column operationally_closed_at timestamptz,
  add column operationally_closed_by text;

-- 🔴 כל אילוץ מקבל שם מפורש. הקוד מזהה שגיאות-מסד **לפי שם-האילוץ ולא לפי נוסח ההודעה**
--    (`src/lib/hostesses.js:600-613`) — שם אוטומטי של Postgres הוא באג, לא קיצור-דרך.
-- ‏`on delete restrict` לפי התקדים היחיד החי במסד: `projects_owner_email_fkey`
--    (נמדד 14/08/2026 — זו ה-FK **היחידה** ל-`users(email)` בכל המסד).
alter table public.projects
  add constraint projects_cancelled_by_fkey
    foreign key (cancelled_by) references public.users (email) on delete restrict,
  add constraint projects_operationally_closed_by_fkey
    foreign key (operationally_closed_by) references public.users (email) on delete restrict,
  add constraint projects_cancel_type_check
    check (cancel_type is null
           or cancel_type in ('customer', 'force_majeure', 'other'));

-- ── ③ ה-CHECK החסר (M6-13) — חמשת הערכים הסגורים של C6 §2.4.4 ──────────────────────
alter table public.projects
  add constraint projects_negative_feedback_reason_check
    check (negative_feedback_reason is null
           or negative_feedback_reason in
              ('איחור דיילות', 'תפקוד דיילות', 'איכות תגים', 'ניהול לקוי', 'אחר'));

-- ── ④ "סגירה מחייבת דוח" (㉛, סוגר §7.36) ─────────────────────────────────────────
-- ‏`project_status` היא `not null` ⇒ ל-`not in` אין כאן מלכודת של לוגיקה תלת-ערכית.
-- 🔴 שם-הטבלה המלא כתחילית — ‏44/44 במסד החי (ראה why למעלה).
alter table public.projects
  add constraint projects_closed_needs_report
    check (project_status not in ('awaiting_invoice', 'awaiting_payment', 'finished')
           or summary_report_url is not null);

-- ── ⑤ ההפלה (㉟) — ורק אחרי שהשומר הוכיח שאין מה לאבד ─────────────────────────────
-- 🛑 זהו המשפט הבלתי-הפיך היחיד במיגרציה. הספירה נמדדה לפני ההחלה, אבל מדידה אינה ערובה:
--    בין המדידה להחלה יכולה שורה להשתנות. הבלוק הבא הופך את "ספרנו ויצא 0" לשער אמיתי.
do $$
declare
  v_nonzero integer;
begin
  select count(*) into v_nonzero
    from public.projects
   where project_bonus is distinct from 0;

  if v_nonzero > 0 then
    raise exception
      'המיגרציה נעצרה: נמצאו % שורות שבהן project_bonus אינו אפס. אין להפיל את העמודה — פני לישי לפני שממשיכים.',
      v_nonzero;
  end if;
end
$$;

alter table public.projects drop column project_bonus;

-- ── ⑥ ההידוק (§7.62 / A-14) — אחרון, אחרי כל שלב שיוצר שורות ──────────────────────
alter table public.projects alter column quote_id    set not null;
alter table public.projects alter column owner_email set not null;

-- ── האינדקסים לשתי ה-FK החדשות (ראו הערת ה-why למעלה) ─────────────────────────────
create index projects_cancelled_by_idx
  on public.projects (cancelled_by);
create index projects_operationally_closed_by_idx
  on public.projects (operationally_closed_by);
