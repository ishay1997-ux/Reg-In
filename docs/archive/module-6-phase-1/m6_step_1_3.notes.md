<div dir="rtl">

# צעד 1.3 · מיגרציה C — עמודות-הנוכחות על `assignments`

**קובץ ה-SQL:** `m6_step_1_3.sql` · **שם-קובץ מוצע למיגרציה:** `20260814115047_module6_assignments_attendance.sql`
**נמדד מול המסד החי:** 14/08/2026 11:4X–11:5X.

## מה זה עושה

מוסיף לטבלת השיבוצים שלוש עמודות שעונות על שאלה אחת: **"מה קרה עם הדיילת באירוע?"** — האם
הגיעה, ואם איחרה — כמה, ואם לא הגיעה — למה. על המסך דנה בוחרת **אפשרות אחת מתוך שבע**
(*"איחרה — בינוני"*, *"לא הגיעה — חולה"*), והמסד שומר אותה בשלוש עמודות.
בנוסף נוספים שני **שומרים** שהמסד אוכף בעצמו: ① אי-אפשר לשמור צירוף חסר-הגיון — *"איחרה"* בלי
דרגת-איחור, או *"הגיעה"* עם סיבת-היעדרות; ② מי שסומנה *"לא הגיעה"* חייבת **אפס שעות** —
אי-אפשר לשלם למי שלא הייתה שם.
**למה זה חשוב מעבר לתיעוד:** אלה הנתונים שמפעילים את **מרכיב-האמינות ב-Smart Match** — המרכיב
הכי כבד (`0.35`) שכבוי היום, כי אף אחד לא רשם עד היום מי הגיעה ומי לא.

## הפיכוּת

**הפיכה במלואה, ובלי אובדן נתונים.** ביטול = שורה אחת:
`alter table public.assignments drop column attendance_status, drop column lateness_level, drop column no_show_reason;`
(הפלת עמודה מפילה איתה את כל האילוצים שנשענים עליה, כולל שני אילוצי-העקביות).

- **אף שורה קיימת אינה נמחקת ואינה משתנה** — שלוש העמודות נולדות `null` בכל 10 השורות.
- ‏`actual_hours` **אינה נגעת** (היא כבר קיימת) ⇒ אין מה לשחזר בה.
- **מה שאינו הפיך:** אם ייכתבו נתוני-נוכחות אמיתיים ואז תופל העמודה — הנתונים ילכו. כרגע
  אין ולו שורה אחת כזאת, ולכן החלון הזה ריק.

## מה מדדתי

| # | השאילתה | מה חזר | תג |
|:-:|---|---|---|
| 1 | `select column_name, data_type, is_nullable from information_schema.columns where table_name='assignments'` | **17 עמודות.** ‏`actual_hours` = `numeric`, `is_nullable=NO`, `default 0` — **קיימת, לא נוגעים בה.** ‏`attendance_status`/`lateness_level`/`no_show_reason` — **אינן קיימות** | אומת-על-ידי |
| 2 | `select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.assignments'::regclass` | 6 אילוצים. ‏PK = **`(project_id, hostess_id, assignment_number)`** *(זה מה שמתקן את חוסם #9 — ר' למטה)*. ‏`assignments_assignment_status_check` מונה 6 ערכים, ביניהם `approval_withdrawn` | אומת-על-ידי |
| 3 | `select count(*) from public.assignments` · `… where actual_hours <> 0` · `… where actual_hours < 0` | **10 · 0 · 0** ⇒ אף שורה קיימת אינה יכולה להפר את `assignments_no_show_zero_hours` | אומת-על-ידי |
| 4 | אותה שאילתה על `quality_mark` ב-`assignments` | **0 עמודות** — לא קיימת, ו**לא נוצרת כאן** (ר' §"סימון-האיכות" למטה) | אומת-על-ידי |
| 5 | `pg_constraint` על `customer_hostess_preference` | קיים חי: `check (preference in ('מצוינת','בסדר','לא_לשלוח'))` · `customer_hostess_preference_negative_needs_reason` · `unique (customer_id, hostess_id)` | אומת-על-ידי |
| 6 | `information_schema.columns` על `customer_hostess_preference` | `preference text not null` · `preference_reason text null` · שתי חותמות `timestamptz` | אומת-על-ידי |
| 7 | `src/lib/smartMatch.js:43-63` (קריאה בעין) | `ATTENDANCE_OUTCOMES` = **8 חברים** · `ATTENDANCE_VALUES` = **6 ערכים מנוקדים**; `SICK`/`EXCUSED` מוחרגים במפורש בשורות 54–55 | אומת-על-ידי |
| 8 | `docs/specs/module_06_projects/spec.md:134-146` · `screens-approved.md:1368-1376` ו-`:1532-1538` | אותה טבלת-מיפוי בת שבע שורות בשני המסמכים, ורשימת חמש דרישות-המסד (3 עמודות + 2 אילוצים) | דווח-לי (מסמך מאושר) |
| 9 | `grep -c 'comment on'` על `supabase/migrations/` | **3 מופעים בשני קבצים** מתוך 34 ⇒ ‏`comment on column` אינו מוסכמת-בית, ולכן לא נוספו הערות-עמודה | אומת-על-ידי |

### 🔻 בדיקת-הקבלה — **להריץ אחרי ההחלה**

🔴 **זה מה שמחליף את בלוק-ה-Verify של המדריך, שהוא SQL לא-חוקי** (חוסם #9): המדריך כותב
`update … where project_id=8 limit 1`, ו-**`UPDATE … LIMIT` אינו קיים ב-PostgreSQL** ⇒ השגיאה
היא `42601` (תחביר) ולא `23514` (הפרת-אילוץ), כלומר ההוכחה שהצעד מבטיח **לא רצה מעולם.**
התיקון: תת-שאילתה על **צמד-המפתח המלא** — `(project_id, hostess_id, assignment_number)`, שהוא
ה-PK האמיתי שנמדד (שורה 2 בטבלה למעלה).

**① קריאה-בלבד — העמודות והאילוצים נחתו:**

```sql
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'assignments'
   and column_name in ('attendance_status', 'lateness_level', 'no_show_reason')
 order by column_name;
-- מצופה: 3 שורות · text · YES

select conname, pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid = 'public.assignments'::regclass
   and conname in ('assignments_attendance_status_check', 'assignments_lateness_level_check',
                   'assignments_no_show_reason_check', 'assignments_attendance_shape',
                   'assignments_no_show_zero_hours')
 order by conname;
-- מצופה: 5 שורות, בדיוק בשמות האלה

select count(*) as rows_total,
       count(attendance_status) as with_attendance
  from public.assignments;
-- מצופה: 10 · 0 — אף שורה קיימת לא נגעה
```

**② הוכחה שכותבת — ומגלגלת את עצמה אחורה בעצמה.**
‏🔑 **למה זה בטוח:** כל צירוף נכתב בתוך **תת-טרנזקציה** שנזרקת תמיד — או ע"י האילוץ, או ע"י
חריגה-סנטינל שאני זורק בכוונה (`ZZ001`). ⇒ **בסוף הריצה אין ולו כתיבה אחת ששרדה**, וגם אם
הבלוק ייקטע באמצע. **הצלחה = `NOTICE` בסוף; כישלון = `exception` שמפרט מה נכשל.**

```sql
do $$
declare
  r      record;
  v_pid  integer;
  v_hid  bigint;
  v_num  integer;
  v_con  text;
  v_pass integer := 0;
  v_fail text := '';
begin
  -- ‏🔴 תיקון חוסם #9: תת-שאילתה על צמד-המפתח המלא, לא `limit` ב-`update`
  select a.project_id, a.hostess_id, a.assignment_number
    into v_pid, v_hid, v_num
    from public.assignments a
   order by a.project_id, a.hostess_id, a.assignment_number
   limit 1;

  if v_pid is null then
    raise exception 'אין שורות ב-assignments — אי-אפשר להריץ את ההוכחה';
  end if;

  for r in
    select * from (values
      -- ===== שמונה הצורות החוקיות: שבע של §1.4 + "טרם נסגר" =====
      ('טרם נסגר',              null::text, null::text, null::text, 0::numeric, true,  null::text),
      ('הגיעה',                 'arrived',  null,       null,       6.5,        true,  null),
      ('איחרה — קל',            'late',     'light',    null,       6.5,        true,  null),
      ('איחרה — בינוני',        'late',     'medium',   null,       6.5,        true,  null),
      ('איחרה — רב',            'late',     'heavy',    null,       6.5,        true,  null),
      ('לא הגיעה — חולה',       'no_show',  null,       'sick',             0,  true,  null),
      ('לא הגיעה — אישור מראש', 'no_show',  null,       'approved_absence', 0,  true,  null),
      ('לא הגיעה — הבריזה',     'no_show',  null,       'ghosted',          0,  true,  null),
      -- ===== אחת-עשרה צורות שחייבות להיחסם =====
      ('late בלי דרגה',         'late',     null,       null,       6.5, false, 'assignments_attendance_shape'),
      ('arrived עם דרגה',       'arrived',  'light',    null,       6.5, false, 'assignments_attendance_shape'),
      ('arrived עם סיבה',       'arrived',  null,       'sick',     6.5, false, 'assignments_attendance_shape'),
      ('no_show בלי סיבה',      'no_show',  null,       null,         0, false, 'assignments_attendance_shape'),
      ('no_show עם דרגה',       'no_show',  'heavy',    'ghosted',    0, false, 'assignments_attendance_shape'),
      ('דרגה בלי סטטוס',        null,       'light',    null,         0, false, 'assignments_attendance_shape'),
      ('סיבה בלי סטטוס',        null,       null,       'sick',       0, false, 'assignments_attendance_shape'),
      ('no_show עם שעות',       'no_show',  null,       'ghosted',    5, false, 'assignments_no_show_zero_hours'),
      ('סטטוס לא-קיים',         'ghosted',  null,       null,         0, false, null),
      ('דרגה לא-קיימת',         'late',     'severe',   null,       6.5, false, 'assignments_lateness_level_check'),
      ('סיבה לא-קיימת',         'no_show',  null,       'absent',     0, false, 'assignments_no_show_reason_check')
    ) as t(label, st, lvl, rsn, hrs, should_pass, expect_con)
  loop
    begin
      update public.assignments
         set attendance_status = r.st,
             lateness_level    = r.lvl,
             no_show_reason    = r.rsn,
             actual_hours      = r.hrs
       where (project_id, hostess_id, assignment_number) = (v_pid, v_hid, v_num);

      -- ‏🔴 שומר מפני ירוק-שקרי: אם RLS חסמה, ה-`update` נוגע ב-0 שורות **בלי שגיאה**,
      -- ואז אף אילוץ לא נבדק וכל הבדיקה "עוברת" על לא-כלום.
      if not found then
        raise exception 'ההוכחה לא עדכנה אף שורה (%): כנראה RLS או PK שגוי — אל תקרא לזה "עבר"', r.label;
      end if;

      if r.should_pass then
        v_pass := v_pass + 1;
      else
        v_fail := v_fail || format('[%s] התקבל ולא היה אמור; ', r.label);
      end if;

      -- ‏🔴 גלגול-אחורה מכוון: התת-טרנזקציה הזאת נזרקת תמיד ⇒ שום כתיבה אינה שורדת
      raise exception using errcode = 'ZZ001', message = 'rollback-sentinel';
    exception
      when sqlstate 'ZZ001' then
        null;                                   -- צירוף חוקי, והכתיבה גולגלה אחורה
      when check_violation then
        get stacked diagnostics v_con = constraint_name;
        if r.should_pass then
          v_fail := v_fail || format('[%s] נחסם ע"י %s ולא היה אמור; ', r.label, v_con);
        elsif r.expect_con is not null and v_con is distinct from r.expect_con then
          v_fail := v_fail || format('[%s] נחסם ע"י %s במקום %s; ', r.label, v_con, r.expect_con);
        else
          v_pass := v_pass + 1;
        end if;
    end;
  end loop;

  if v_fail <> '' then
    raise exception 'בדיקת-הקבלה נכשלה: %', v_fail;
  end if;
  raise notice 'בדיקת-הקבלה עברה: %/19 צירופים (8 חוקיים + 11 חסומים)', v_pass;
end $$;
```

**מצופה:** ‏`NOTICE: בדיקת-הקבלה עברה: 19/19 צירופים` — ואז
`select count(attendance_status) from public.assignments;` ⇒ **`0`**, כלומר לא שרד דבר.

**③ יועצי-האבטחה (`get_advisors`)** — **הצעד הזה לבדו אינו אמור להוסיף אף ממצא**: אין עמודה
חדשה עם FK, אין אינדקס, אין פונקציה, אין policy. *(מוסר-הצעד: אילוצי-`CHECK` אינם מנוטרים
ע"י היועצים כלל.)*

### 🔗 המיפוי ל-`ATTENDANCE_OUTCOMES` — **מה שצעד 2.7 חייב לגשר עליו**

‏`ATTENDANCE_OUTCOMES` (`smartMatch.js:43-52`) מחזיק **שמונה** חברים ומפתחותיו **עברית בשדה
אחד**; המסד מחזיק **שלוש עמודות באנגלית**. הגשר, שורה-בשורה:

| המסד (3 עמודות) | על המסך | חבר ב-`ATTENDANCE_OUTCOMES` | ניקוד ב-`ATTENDANCE_VALUES` |
|---|---|---|:--:|
| `arrived` · `null` · `null` | הגיעה | `ARRIVED` = `'הגיעה'` | **1** |
| `late` · `light` · `null` | איחרה — קל | `SLIGHTLY_LATE` = `'איחור_קצת'` | **1** |
| `late` · `medium` · `null` | איחרה — בינוני | `MODERATELY_LATE` = `'איחור_בינוני'` | **0.75** |
| `late` · `heavy` · `null` | איחרה — רב | `VERY_LATE` = `'איחור_הרבה'` | **0.5** |
| `no_show` · `null` · `sick` | לא הגיעה — חולה | `SICK` = `'חולה'` | 🚫 **לא מנוקד** — מוחרג מהמונה *ומהמכנה* |
| `no_show` · `null` · `approved_absence` | לא הגיעה — אישור מראש | `EXCUSED` = `'אישור_מראש'` | 🚫 **לא מנוקד** — מוחרג משניהם |
| `no_show` · `null` · `ghosted` | לא הגיעה — הבריזה | `NO_SHOW` = `'הבריזה'` | **0** |
| ⛔ **אין ייצוג בעמודות האלה** | *(אינה על רשימת-הסגירה בכלל)* | `WITHDREW` = `'ביטלה_אחרי_אישור'` | **0.5** — ומגיע מ-`assignment_status = 'approval_withdrawn'` |

🔴 **שלוש עובדות שאסור לסתור בצעד 2.7:**
1. **‏8 חברים, 6 ניקודים.** ‏`SICK` ו-`EXCUSED` חסרים מ-`ATTENDANCE_VALUES` **במכוון**
   (`smartMatch.js:54-55`) — ‏`0` עבורם היה מעניש מי שהודיעה מראש כמו מי שהבריזה.
   🚫 **כל אמירה על "שבע המשקולות" שגויה.**
2. **‏`WITHDREW` אינו ערך-נוכחות.** הוא `assignment_status`, ודיילת כזאת **אינה מופיעה ברשימת
   הסגירה** ⇒ ה-`0.5` שלה חייב להגיע מענף נפרד שקורא `assignment_status`, לא מהעמודות האלה.
3. **הכשל שקט:** ‏`smartMatch.js:207` הוא `if (value === undefined) continue` ⇒ מיפוי שגוי
   **משמיט את השורה בשקט** במקום לזרוק. ⇒ הבדיקה של 2.7 חייבת לאמת את **הספירה** (המכנה),
   לא רק את הציון.

### סימון-האיכות (הכרעת-ישי B13) — **אינו עמודה חדשה, והוא כבר חי במסד**

נמדד: הסימון התלת-מצבי יושב על **`customer_hostess_preference.preference`**, לא על
`assignments` — ‏`check (preference in ('מצוינת','בסדר','לא_לשלוח'))` **קיים חי**, עם
`unique (customer_id, hostess_id)` ו-`customer_hostess_preference_negative_needs_reason`.
⇒ **שלוש דרישות B13 מתקיימות כבר היום, בלי DDL:**
- *"דריסה, בלי טבלת-היסטוריה"* ⇒ ה-`unique` על הצמד **הוא** מנגנון-הדריסה (upsert על אותה שורה).
- *"שלושה מצבים — `מצוינת · בסדר · לא_לשלוח`"* ⇒ בדיוק שלושת הערכים ב-`CHECK` החי, **בעברית
  ועם קו-תחתון ב-`לא_לשלוח`** *(‏`spec.md §1.5` מדגיש: `not_send` או `לא לשלוח` ייפסלו)*.
- *"שלושתם חובה בסגירה"* ⇒ **חובה של טופס+RPC, לא של המסד** — ה-`CHECK` אינו יכול לדעת שאירוע
  נסגר. זה יושב בצעד 1.8 (ה-RPC האטומי) ו-3.5 (הטופס), בדיוק כמו חובת-הנוכחות.
🚫 **⇒ לא נוספה כאן עמודת `quality_mark`, ואין בה צורך.** *(הפער היחיד שנשאר לצעד 1.8:
ל-`customer_hostess_preference` **טרם נמדדו policies** — זו שורה 13 ב-§🗄️ של משטח 5, מסומנת
שם "🟡 טעון בדיקה", והיא **לא** של הצעד הזה.)*

## הנחות

| תג | ההנחה | מדוע, ואיך להרוג אותה |
|:--:|---|---|
| **הנחתי** | **הידקתי את ענף-ה-`null` של `assignments_attendance_shape`.** המדריך כותב `attendance_status is null or …`; אני כתבתי `(attendance_status is null and lateness_level is null and no_show_reason is null) or …` | נוסח-המדריך מתיר שורה עם **דרגת-איחור בלי איחור** (`status=null, level='light'`) — צירוף שאין לו שורה בטבלת §1.4. **מחיר: אפס** (כל 10 השורות נושאות שלושה `null`). **להרוג:** אם צעד 1.8 יכתוב את שלוש העמודות בשלושה `update` נפרדים במקום באחד — ההידוק יחסום את השלב האמצעי. **הוא לא אמור: ה-RPC אטומי (ט4-ד).** |
| **הנחתי** | **לא הוספתי `check (actual_hours >= 0)`.** | הוא אינו ברשימת חמש הדרישות של `screens-approved` §🗄️, והרצפה-והתקרה שהאפיון כן מגדיר — *"בין 0 ל-‹שעות-האירוע + 2›"* (§⑦) — **תלויות בפרויקט ואינן ניתנות לביטוי ב-`CHECK` על הטבלה.** ⇒ אכיפה בטופס וב-RPC. **להרוג:** ישי/1.8 מחליטים שרצפת-`0` שווה אילוץ נפרד — זו מיגרציה נפרדת בת שורה. |
| **הנחתי** | **לא הוספתי `comment on column`.** | נמדד: `comment on` מופיע ב-**2 מתוך 34** קובצי-המיגרציה ⇒ אינו מוסכמת-בית. ה-"why" חי בכותרת-המיגרציה, כמו בכל הקבצים האחרים. |
| **הנחתי** | **שמות שלושת אילוצי-העמודה** (`assignments_attendance_status_check` וכו') | ‏`AS-7`/`AS-8` מגדירים שמות כ"הכרעה טכנית בלי משמעות מוצרית". בחרתי בדיוק את השם ש-Postgres היה מייצר לבדו — כך שהשם **מפורש** (כלל-הבית) **וגם** תואם את `assignments_assignment_status_check` שכבר חי בטבלה. **שני שמות-האילוצים המורכבים (`_shape`, `_no_show_zero_hours`) לקוחים מילה-במילה מהמדריך** ולא הומצאו. |
| **הנחתי** | **הצירוף `'ghosted'` כערך של `attendance_status` נבדק בלי לקבע שם-אילוץ.** | ערך-סטטוס לא-חוקי מפר **שני** אילוצים בו-זמנית (`_check` וגם `_shape`), וסדר-הבדיקה בין אילוצים אינו חוזה מתועד. ⇒ הבדיקה מאמתת "נחסם", לא "נחסם ע"י X". |

## 🛑 צריך את ישי

**אין.**

*(ושתי השאלות שנראות כמועמדות — ולשתיהן יש עוגן, ולכן הבאתן אליו הייתה
"שאלה-שיש-לי-עליה-תשובה":*
- *‏**`screens-approved` §⑧⑤** משאיר `❓ "להשאיר פתוח למקרה של 'הגיעה לחצי שעה והלכה'?"* —
  **העוגן עונה:** מי שהגיעה לחצי שעה **הגיעה**, ותסומן `arrived`/`late` עם `0.5` שעות;
  ‏`assignments_no_show_zero_hours` נוגע **רק** ב-`no_show`, כלומר במי שלא ראו אותה. ⇒ האילוץ
  אינו חוסם את התרחיש, ואין מה להכריע. **הוא כן ייכנס לדיון אם ישי יאמר שדנה מסמנת "לא הגיעה"
  למי שהופיעה לרגע — וזו שאלת-שדה לצעד 3.5, לא לצעד הזה.**
- *‏**חובת-הנוכחות בסגירה** — ‏`screens-approved` §⑦ כבר קובע אותה מילה-במילה
  (*"חסר סימון נוכחות ל-‹שם›."*), והמדריך קובע שהעמודות `nullable` והאכיפה ב-RPC. אין פער.)*

## שמות שהקוד יסתמך עליהם

**עמודות (3):**
- `public.assignments.attendance_status` — `text null`, ערכים `arrived` · `late` · `no_show`
- `public.assignments.lateness_level` — `text null`, ערכים `light` · `medium` · `heavy`
- `public.assignments.no_show_reason` — `text null`, ערכים `sick` · `approved_absence` · `ghosted`

**אילוצים (5) — 🔴 שמות שהם חוזה מול הממשק:**
- `assignments_attendance_status_check`
- `assignments_lateness_level_check`
- `assignments_no_show_reason_check`
- `assignments_attendance_shape`
- `assignments_no_show_zero_hours`

**אינדקסים · policies · פונקציות · טריגרים שנוצרו כאן:** **אין.**

⚠️ **ומה שהצעד הזה מחייב מצעדים אחרים:**
1. **צעד 2.7** — יישור `smartMatch.js` לשלושת השמות האלה (טבלת-הגשר למעלה). שם שגוי ⇒
   `reliabilityScore` מדלגת על השורה **בשקט**.
2. **צעד 1.8 / 3.5** — אם הטופס אמור להציג הודעה עברית על הפרת אחד משני אילוצי-העקביות,
   הוא מוסיף שורה ל-`SERVER_CONSTRAINT_RULES` (`src/lib/hostesses.js:603-613`) לפי **שם-האילוץ**.
   כרגע יש שם שתי שורות בלבד, ואף אחת מהן אינה של הצעד הזה. **בפועל אין בכך צורך אם הטופס
   חוסם קודם** — האילוצים האלה הם רשת-ביטחון, לא מסלול-משתמש.

---

## מה תוקן בסבב הבקרה

> **‏14/08/2026 · סבב-בקרה יריב על תשע טיוטות פזה-1 (‏32 ממצאים).**
> 🟢 **על הקובץ הזה לא נרשם ולו ממצא אחד — לא חוסם, לא major, לא minor.**
> מה שלמטה הוא **מה שנבדק מחדש בכל זאת** בסבב, ומה שהשתנה בקבצים *אחרים* בגללו.

### ① אין ממצאים — ומה זה אומר

הקובץ נבדק בסבב בארבעה ממדים (שמות · טיפוסי-זמן · תלויות · נאמנות-לאפיון) ולא הופל בהם.
🚫 **ואין כאן "המצאת ממצא כדי להיראות יסודי"** — הרשימה למטה היא אימות, לא תיקון.

### ② מה אומת מחדש חי, ועבר ✅

| מה נבדק | המדידה החיה (14/08/2026) | תוצאה |
|---|---|---|
| האילוץ החדש לא יכול ליפול על נתונים קיימים | `select count(*) from public.assignments where actual_hours <> 0` ⇒ **0** | ✅ `assignments_no_show_zero_hours` בטוח |
| אילוץ-הצורה לא יכול ליפול | שלוש העמודות נולדות `null` בכל השורות הקיימות | ✅ |
| כל אילוץ בשם מפורש | חמישה שמות מפורשים, אפס נגזרים אוטומטית | ✅ |
| `timestamptz` ולא `timestamp` | **אין עמודות-זמן חדשות בצעד הזה כלל** | ✅ לא חל |
| כותרת-why בעברית | קיימת, עם המיפוי המלא של שבע הבחירות | ✅ |
| טקסט-`raise` בעברית ובלשון נקבה | **אין `raise` בקובץ הזה כלל** — הוא DDL בלבד | ✅ לא חל |

### ③ מה כן השתנה בקבצים אחרים בגלל הצעד הזה 🌊

1. **שני האילוצים של הצעד נכנסו לרשימת-החוב של `SERVER_CONSTRAINT_RULES`** —
   `assignments_attendance_shape` ו-`assignments_no_show_zero_hours` הם פריטים 8 ו-9
   בטבלת התשעה ב-`m6_step_1_1.notes.md` §"מה תוקן בסבב הבקרה" ③. ⚠️ **זה מחזק את
   ההסתייגות שכבר כתובה למעלה בקובץ הזה** (פריט 2 ברשימת-המחייבים): כל עוד הטופס חוסם
   קודם, אלה רשת-ביטחון; אם הטופס **לא** יחסום, המשתמשת תראה אנגלית גולמית.
2. **‏`m6_step_1_10.sql` — חמשת האילוצים של הצעד תויגו `[1.3]`** בעמודת "מצופה", כדי
   שכישלון בשער יצביע על המיגרציה האשמה. חמשתם עברו לספירה כ-`FAIL` אמיתי (ולא `PENDING`),
   כי הצעד הזה **כן** נמצא באצווה — בניגוד ל-1.4 ול-1.6.

</div>
