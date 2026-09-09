<div dir="rtl">

# מבחני-קוהרנטיות לזריעה — כללים שרצים, לא כללים שזוכרים

> **למה הקובץ הזה קיים.** ‏09/09/2026 נמצא שדירוג-הדיילות **הפוך** לביצועים בפועל (דירוג-5
> נעדרת פי-1.6 מדירוג-3). הפגם לא נתפס בשום בדיקה קודמת — לא כי מישהו התרשל, אלא כי
> **כל דוח נבדק לחוד ואיש לא שאל אם הם מסכימים זה עם זה.** הערת-ישי שהולידה את הקובץ:
> *"והכל קשור אחד לשני… מתאם וקוהרנטיות"*.
>
> 🔴 **הכלל שמאחורי הצורה:** כלל שאינו מייצר תוצאה נשכח. לכן **אין כאן פרוזה להיזכר בה** —
> יש שאילתות עם ספים. סשן מריץ, מקבל ✅/❌, ואי-אפשר "לחשוב שבדקנו".
> **מתי מריצים:** אחרי **כל** שינוי-זריעה · ולפני שנבנה דף-דוח שנשען על המדד.
> **גישה:** ‏Supabase MCP `execute_sql`, פרויקט `yfeovxppnfoafmfbdfvh`, **קריאה בלבד**.
> 🚫 **כישלון כאן הוא כמעט תמיד תקלת-זריעה, לא באג-קוד.** אל תתקן קוד לפי הקובץ הזה.

---

## איך קוראים את הטבלה
**"עובר"** = מה שצריך לצאת. **"נמדד 09/09"** = מה שיצא בפועל בהרצה הראשונה.
מבחן ללא עמודת-מדידה טרם הורץ — ‏**"טעון בדיקה"**, ואין להסיק ממנו דבר.

## כלל-על: מתאם קיים אך אינו מושלם
עסק אמיתי מראה **נטייה עם חריגות**. ‏🚫 **מתאם מושלם (r≈1.0) פוסל בדיוק כמו היעדר-מתאם** —
הוא נראה מפוברק לעין מנוסה, וזו העין שיושבת בכנס. **בכל מבחן-מתאם למטה: הכיוון חייב להיות
נכון, והחריגות חייבות להתקיים.**

---

## מ1 · דירוג-דיילת מנבא נוכחות 🔴 **נכשל 09/09/2026**
**למה זה חוסם:** אם הדירוג אינו מנבא — דוח 14 (תעריף↔דירוג) מצייר ענן חסר-מבנה,
ו-Smart Match מכייל משקולת חסרת-תוכן.
```sql
select h.rating, count(*) shifts,
       round(100.0*count(*) filter (where a.attendance_status='no_show')/nullif(count(*),0),1) pct_no_show,
       round(100.0*count(*) filter (where a.attendance_status like 'late%')/nullif(count(*),0),1) pct_late
from assignments a join hostesses h on h.hostess_id=a.hostess_id
where a.attendance_status is not null and h.rating is not null
group by h.rating order by h.rating;
```
**עובר:** `pct_no_show` **יורד מונוטונית** ככל שהדירוג עולה, ומנת-הקצוות (דירוג-3 ÷ דירוג-5) **≥ 3**.
**נמדד 09/09:** 3.6% / 4.6% / **5.7%** — עולה במקום לרדת. **מנה 0.63 במקום ≥3.** ❌

## מ2 · תעריף עולה עם דירוג 🔴 **נכשל 09/09/2026**
```sql
select rating, count(*) n, round(avg(hourly_rate),1) avg_rate
from hostesses where status='active' and rating is not null group by rating order by rating;
```
**עובר:** `avg_rate` עולה עם הדירוג; פער קצוות **≥ 8%**.
**נמדד 09/09:** 44.0 / 44.9 / **43.8** — שטוח והפוך. ❌

## מ3 · זמן-תגובה לזימון מבחין בין דיילות 🔴 **נכשל 09/09/2026**
```sql
select h.rating, round(avg(extract(epoch from (a.responded_at-a.invite_sent_at))/3600)::numeric,1) hrs,
       count(*) filter (where a.responded_at is null) never_answered
from assignments a join hostesses h on h.hostess_id=a.hostess_id
where a.invite_sent_at is not null and h.rating is not null group by h.rating order by h.rating;
```
**עובר:** פער **≥ 40%** בין המהירה לאיטית.
**נמדד 09/09:** 18.1 / 17.8 / 18.5 שעות — **פער 4%.** אקראי. ❌

## מ4 · אוכלוסייה מינימלית לכל דף ⚠️ **נכשל חלקית**
🔗 **זהו כלל כ4 של `m11-report-inclusion-rules.md`, בצורת מבחן.**
```sql
select 'feedback = אחר' k, count(*) n from projects where 'אחר' = any(negative_feedback_reasons)
union all select 'negative feedback', count(*) from projects where array_length(negative_feedback_reasons,1)>0
union all select 'cancelled', count(*) from projects where project_status='cancelled'
union all select 'drifting customers', count(*) from (
  select p.customer_id from projects p group by p.customer_id
  having max(p.final_event_date) < current_date - 120) z;
```
**עובר:** כל שורה שדף-דוח נשען עליה — **≥ 30**.
**נמדד 09/09:** "אחר" = **7** ❌ · שליליים 83 ✅ · ביטולים 41 ✅ · מתרחקים 9 ⚠️ *(12 בהגדרת §ח7)*.

## מ5 · משוב-לקוח מנבא נטישה 🔴 **נכשל 09/09/2026**
**למה:** אם לקוחות מרוצים נוטשים ולקוחות זועמים חוזרים, דוח-השימור מאבד את בסיסו.
```sql
with last_ev as (select customer_id, max(final_event_date) le from projects group by customer_id),
     sat as (select customer_id, avg(feedback_score) s from projects where feedback_score is not null group by customer_id)
select case when s.s>=4.5 then 'מרוצים' when s.s>=3.5 then 'בינוני' else 'לא מרוצים' end bucket,
       count(*) n, round(avg(current_date - l.le),0) avg_days_since_last
from sat s join last_ev l using (customer_id) group by 1 order by 1;
```
**עובר:** `avg_days_since_last` **גדל** ככל ששביעות-הרצון יורדת (מונוטוני).
**נמדד 09/09:** מרוצים(4.65) **61 יום** · בינוני(4.20) **18 יום** · לא-מרוצים(2.05) **64 יום**.
❌ **לא מונוטוני — עקומת-U:** הלקוחות המרוצים ביותר נעלמים כמעט כמו הזועמים, והבינוניים
חוזרים הכי מהר. ⚠️ **ובנוסף — רק 2 לקוחות בדלי "לא מרוצים"**, כלומר גם מ4 נכשל כאן.
**המשמעות לכנס:** *"אז שביעות-הרצון לא מנבאת חזרה — למה אתם מודדים אותה?"*

## מ6 · רווחיות עקבית עם פרופיל-העסק — **טעון בדיקה**
**למה:** הפרופיל שנקבע הוא *"בריא ורווחי עם כאב תפעולי"*. אם הרווחיות שלילית או אחידה
לחלוטין — הפרופיל שקרי והדוחות הפיננסיים יסתרו את הסיפור.
```sql
select count(*) n, count(*) filter (where final_profit>0) profitable,
       count(*) filter (where final_profit<0) at_a_loss, count(*) filter (where written_off) written_off,
       round(min(final_profit),0) worst,
       round(percentile_cont(0.5) within group (order by final_profit)::numeric,0) median,
       round(max(final_profit),0) best, round(sum(final_profit),0) total
from project_finance where final_profit is not null;
```
**עובר:** רוב הפרויקטים רווחיים, **עם זנב הפסדים אמיתי** — לא אפס ולא רבע.
**נמדד 09/09:** 730 פרויקטים · **711 רווחיים (97.4%)** · **14 בהפסד (1.9%)** · 7 חובות-אבודים ·
הגרוע **7,130-** ₪ · חציון **3,504** ₪ · הטוב 10,525 ₪ · סה"כ **2,744,214** ₪. ✅ **עובר** —
זנב-ההפסדים קיים ומידתי, וזהו בדיוק הפרופיל שהוכרע.
⚠️ **לבדיקה נפרדת:** רווח 2.74M מול הטענה *"5.1M הכנסות"* = שולי-רווח 54%. גבוה לענף הזה;
לוודא ש-`final_profit` הוא רווח **גולמי** ולא אחרי-תקורה, לפני שהמספר נאמר בכנס.

## מ7 · הכפילות בין הצהרה למסך — **מבחן ידני, לא SQL**
כל מספר שמופיע במסמך-אפיון או בשקף-כנס **נשלף מהמסד באותו יום** ומושווה.
**נמדד 09/09 — שני כשלים:** האפיון אומר *"221→304 פרויקטים"* מול **827 במסד** ❌ ·
האפיון אומר **ג'יני 0.34** מול **0.605 שנמדד** ❌.

---

## טבלת-מצב

| מבחן | 09/09/2026 |
|---|:-:|
| מ1 דירוג↔נוכחות | ❌ |
| מ2 דירוג↔תעריף | ❌ |
| מ3 דירוג↔זמן-תגובה | ❌ |
| מ4 אוכלוסייה מינימלית | ⚠️ |
| מ5 משוב↔נטישה | ❌ |
| מ6 רווחיות | ✅ |
| מ7 מסמך↔מסד | ❌ |

✅ **מ6 הוא היחיד שעובר — והוא לא מקרי:** הרווחיות נזרעה מתוך נוסחה, ולכן היא קוהרנטית.
כל השאר נזרע כשדות-עצמאיים, ולכן אינו מסכים עם עצמו. **זהו הלקח, ולא רשימת התיקונים.**

🔴 **שלושת הכשלים הראשונים הם פגם אחד** — הדירוג נזרע באקראי ביחס להתנהגות.
תיקון-זריעה יחיד סוגר את מ1 · מ2 · מ3 יחד, ואז **מריצים את כל השבעה מחדש**.

</div>
