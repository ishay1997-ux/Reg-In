<div dir="rtl">

# בדיקת ששת החשדות של ישי — מוקאפ מול מסד (`m11-ishay-number-checks.md`)

> **מה זה:** מענה נקודתי לשישה מספרים שישי חשד בהם במוקאפ הכספים, אחד-אחד: לכל חשד — היכן
> הוא מופיע במוקאפ בדיוק, אילו שאילתות SQL הורצו **חי** מול המסד, מה נמדד, והאם התקלה היא
> בדאטה, במוקאפ, או שהמספר תקין וההסבר סביבו מבלבל.
> **מתי:** 07/09/2026. **מי:** סוכן-אימות בהקשר-טרי (Sonnet), ללא תת-סוכנים, **קריאה בלבד** במסד.
> 🔴 **מסמך זה אינו רשאי לקבוע כלל-מוצר.** ה-SSOT היחיד הוא
> `docs/specs/module_11_reports/processes-approved.md`; כל ממצא כאן דורש הכרעת-ישי, לא מבטל דבר
> בעצמו. ממצא שסותר הכרעה רשומה שם מדווח כסתירה עם שני הצדדים מצוטטים — לא נמצאה סתירה כזו כאן.
> **גישת-המסד:** Supabase MCP `execute_sql`, פרויקט `yfeovxppnfoafmfbdfvh`, מול "היום" המוסכם
> `06/09/2026` (אומת: `select current_date` ⇒ `2026-09-06`, לא שעון-real-world).
> **קובץ-המוקאפ בפועל:** `docs/mockups/management-report-screen/drafts/03_tab_finance.html`
> (2,141 שורות — הספירה תואמת את מה ש-`m11-data-fidelity.md` בדק). ⚠️ **תיקון-נתיב:**
> `processes-approved.md` ו-`m11-data-fidelity.md` מצטטים אותו כ-
> `docs/specs/module_11_reports/drafts/03_tab_finance.html` — נתיב שאינו קיים בריפו. זו הערת-מיקום
> בלבד, לא ממצא-מספר; מובאת כדי שציטוט עתידי לא ילך לנתיב המת.
> **מה כבר כוסה ולא נמדד כאן מחדש:** ארבעת הממצאים של `m11-data-fidelity.md` (07/09 00:50) —
> ימי-איחור 1505 (64≠65) · "פער-דאטה" מומצא במ9 · פרויקט-מבוטל בטבלת "כמה להזמין" (מ12) ·
> חוב-אבוד שהדוגמה שלו שייכת לאוכלוסייה אחרת. הם אינם בין ששת החשדות של ישי, ומצוטטים כאן רק
> כרקע.

---

## טבלת הבדיקות

| # | החשד (במילות ישי) | השורה במוקאפ | השאילתה (מלאה ב-§נספח) | מה נמדד | **הוורדיקט** | **התיקון המדויק** |
|---|---|---|---|---|---|---|
| **א** | שעות בפועל לא הגיוניות (דוח 5 — "רווחיות פרויקטים", עמוד 2) — *"כמה יכולה להיות סטייה? לדעתי לא יותר משעתיים"* | טבלת "הפרויקטים שחרגו... שעות מתוכנן מול בפועל", שורות 662–675: למשל פרויקט 1347 — **2.50** מתוכנן מול **13.0** בפועל (+10.5ש') · 1376 — **4.00** מול **26.0** (+22.0ש') · 1465 — **4.00** מול **31.0** (+27.0ש') | §נספח-א (פונקציית `finance_project_money` + שאילתות-שעות על `assignments`) | **"שעות מתוכנן"** = משך-האירוע עצמו (`final_end_time−final_start_time`, מספר אחד קבוע) מתוך `finance_project_money()`. **"שעות בפועל"** = **סכום** `actual_hours` על **כל** המשובצות-בתשלום לפרויקט (4–7 דיילות). בדקתי את הסטייה **האמיתית ברמת-משמרת בודדת** (מה שישי שאל) על **3,679** משמרות-בתשלום ברחבי המסד: חציון **0.00** שעות, ממוצע **0.15**, אחוזון-99 **1.50**, מקסימום **4.50** (משמרת אחת בלבד — פרויקט 12, כבר מסומן במוקאפ עצמו כ"מתחת לרצפת-המהותיות"). רק **1/3,679 (0.03%)** חורגות מעל שעתיים; **116/3,679 (3.2%)** חורגות מעל שעה. ברמת-פרויקט (סכום מול משך-אירוע בודד) על 712 פרויקטים: חציון **19.0** שעות, ממוצע **24.7**, **94.2%** חורגים מעל שעתיים — **אותה תבנית שיטתית, לא מקרים בודדים** | 🔴 **באג-מוקאפ** (לא דאטה לא-מציאותית — ברמת-משמרת הדאטה **תואמת בדיוק** את הציפייה של ישי; לא רק ניסוח — שתי העמודות באמת מודדות שני דברים בקנה-מידה שונה) | **"שעות מתוכנן" צריך לכפול ב-מספר המשובצות-הסופיות** (בדיוק כפי שכבר עושה "עלות-עבודה מתוכננת" הקיימת: `planned_hours × Σתעריפים`) — לא להשאיר כמספר-אירוע בודד. לדוגמה: 1347 → 2.5×4=**10.0** מול 13.0 בפועל (סטייה 3.0, לא 10.5) · 1376 → 4×5=**20.0** מול 26.0 (סטייה 6.0, לא 22.0) · 1465 → 4×6=**24.0** מול 31.0 (סטייה 7.0, לא 27.0). ה-₪ וה-% בטבלה **כבר נכונים** (מאומתים מול `budget_deviation` ב-`m11-data-fidelity.md`) — הפגם הוא **רק** בשתי עמודות-השעות הגולמיות |
| **ב** | "15 סטיות גדולות" — לאיזו תקופה? | כותרת-הגרף, שורה 541: *"סטיית-תקציב ב-₪ לפי פרויקט — 15 הסטיות הגדולות"* (עמוד 2, דוח 5) | §נספח-ב | חלון-הזמן **כן מוצהר** — בכותרת-המשנה של הדף (📐17), שורה 501: *"2026 (01/01–06/09) · כל הלקוחות"*, ובהצהרת-האוכלוסייה (📐2) מיד מתחתיה: *"n=215"* R11 YTD. חוזר שוב ב-`src-footer` בתחתית הדף (שורה 707–709): *"215 פרויקטים (R11)... 15 הסטיות הגדולות ב-₪"*. **📐3 דורש חלון-בכל-אריח — לא בכל גרף** (📐17 הוא הכלל שחל על כותרת-הדף כולה, כולל גרפים); כאן שני הכיסויים מתקיימים | ✅ **תקין** — 15 המספרים כבר אומתו **בדיוק** מול המסד באותו חלון (`m11-data-fidelity.md` §1/מ8: *"top-15 סטיית-₪... כל 15 תואמים מסד בדיוק"*) | **אין תיקון-מספר.** שיפור-ניסוח אפשרי (לא חובה): להוסיף בתת-הכותרת של הגרף עצמו "2026 YTD" במפורש, כדי שקורא שמדלג-ישר לגרף (בלי לעבור על כותרת-הדף) לא יצטרך לגלול למעלה |
| **ג** | "הוזמן והגיע" בציוד — מספרים לא הגיוניים; *"סביר בין 100 ל-800 לפרויקט"* | שורת-"אז מה" (1286): *"תגים ממותגים: הוזמנו **58,490**, הגיעו **54,110**"*; אריח (1295–1299): *"פער הוזמן ← הגיע **2.5%** · **3,010** יחידות מתוך **122,788** מתוכננות"* (עמוד 6, דוח 11) | §נספח-ג | **ההשערה המובילה אושרה במלואה:** בדקתי את **Σ planned_qty פר-פרויקט** (סוכם על-פני **כל** ה-sku יחד, בדיוק איך שישי מדמיין "לפרויקט") על **825** פרויקטים עם שורות-לוגיסטיקה: **חציון 461 · ממוצע 528.2 · מינימום 100 · מקסימום 1,311**. **648/825 (78.5%)** נופלים **בדיוק** בטווח 100–800 שישי ציין; רק 177 (21.5%) מעליו, עד מקסימום סביר של 1,311. **הדאטה ברמת-הפרויקט תקינה ותואמת את האינטואיציה של ישי כמעט לגמרי.** המספרים שהוא ראה (58,490/54,110/122,788) הם **סכום כל-הזמנים/כלל-הפרויקטים לפי sku בודד** — לא פר-פרויקט — והמוקאפ **כן מצהיר** על כך (*"כל הזמנים · כל הלקוחות"*, שורה 1282; תג `win: כל הזמנים` על האריחים) | 🟡 **תקין-והניסוח מבלבל** — הדאטה תקינה, ההצהרה-על-האוכלוסייה קיימת ועומדת בכלל 📐2/📐3, אבל **אין עוגן פר-פרויקט על הדף** שיעצור את הקורא מלדמיין "זה המספר של אירוע אחד" | להוסיף מספר-עוגן אחד ליד ה"אז מה"/האריחים — למשל *"ממוצע ~530 יחידות ציוד לאירוע (על 825 פרויקטים)"* — כדי שהקנה-מידה של 58,490 יהיה ברור מיידית כ"סכום-כל-החברה", לא כטעות |
| **ד** | "חציון 3 על 717" (תזרים צפוי) | טבלת "צווארי-בקבוק", שורה 1068: *"אירוע ← סגירה תפעולית \| **3.00** על **717** פרויקטים \| **0** מעל **7** ימים"* (עמוד 4, דוח 7) | §נספח-ד | המשמעות בפועל: **חציון 3 ימים** בין תאריך-האירוע לסגירה התפעולית שלו, נמדד על **717** הפרויקטים שכבר נסגרו-תפעולית עד היום; ואף אחד מהם לא לקח יותר מ-7 ימים לסגירה (המקסימום בפועל: **4 ימים**). אימות-חי עצמאי: `n=717 · median=3.00 · over_7_days=0 · max=4` — **זהה במדויק** למה שכבר אושר ב-`m11-data-fidelity.md` | ✅ **תקין** — המספר נכון, אבל הניסוח "3.00 על 717" קשה לפענוח בקריאה ראשונה למי שאינו טכני | **ניסוח מוצע לכנס/למסך:** *"חציון 3 ימים מהאירוע ועד הסגירה התפעולית שלו (נמדד על 717 פרויקטים שכבר נסגרו) — ואף פרויקט לא נתקע מעבר לשבוע"*, במקום "3.00 על 717" |
| **ה** | "שורות בלי מקור עלות" (צריכת ציוד) | אריח, שורות 1305–1309: *"שורות בלי מקור-עלות (㉗): **3** \| ≈**479** ₪ מושפעים · מתוך 1,771 שורות"* (עמוד 6, דוח 11) | §נספח-ה | 3 שורות ב-`logistics` — כולן `sku='B-SAT-LAN'`, `planned_qty=40` כל אחת (120 יחידות בס"כ), מפרויקטים **1581 · 1594 · 1606** — שבהן **גם** `quote_service_line_id` **וגם** `project_change_id` הם `NULL`. אלה שורות שנוצרו כתוספת-שטח (יש להן רשומה תואמת ב-`project_changes`: change_id 7/12/17, אותם פרויקטים ואותו sku, +40 יח' כל אחת), **אבל** הקישור-חזרה מ-`logistics` לא נשמר — כי `apply_scope_change()` **אינה כותבת** `logistics.project_change_id` בכלל (מתועד ומוכרע כבר ב-`seed-phase-a.md` שורות 335–339 ו-R4 ב-`processes-approved.md`, סייג ㉗). בלי הקישור, המערכת לא יכולה למשוך את המחיר-המדויק, ומעריכה מחיר-ממוצע-ליחידה מאותו דגם (233,480÷58,490=**3.99** ₪) ⇒ 120×3.99≈**479** ₪ — הערכה, לא מדידה. **כבר אומת נכון** ב-`m11-data-fidelity.md` ("✅ הצהרה עצמה נכונה") | ✅ **תקין** — המספר נכון; רק הניסוח "בלי מקור-עלות" דורש תרגום לעברית-לא-טכנית | **ניסוח מוצע:** *"3 שורות ציוד (מדגם B-SAT-LAN, משלושה פרויקטים) שנוספו כתוספת בשטח — אך הקישור לשינוי-התכולה שיצר אותן לא נשמר במסד, ולכן המחיר שלהן (כ-479 ₪) מוערך לפי ממוצע-הדגם, לא נמדד ישירות"* |
| **ו** | "ברוטו-תוספות/ברוטו-צמצומים" | אריחים, שורות 1139–1148: *"ברוטו-תוספות **4,743** ₪ (12 שורות) \| ברוטו-צמצומים **−375** ₪ (4 שורות)"* (עמוד 5, דוח 8) | §נספח-ו | אימתתי **בעצמי, שאילתה עצמאית** על `project_changes` (16 השורות): Σ`(delta_qty×unit_price_snapshot)` על 12 השורות עם `delta_qty>0` = **4,884 ₪** (לא 4,743) · על 4 השורות עם `delta_qty<0` = **−516 ₪** (לא −375) · הנטו = **4,368 ₪** (תואם את המוקאפ — נכון). **הפער נובע מקיבוץ-לפי-sku ולא לפי-סימן-שורה:** ל-sku ‏`REG-TAG` יש 3 שורות מעורבות-סימן (+168 · −75 · −66 = נטו +27); מי שבנה את הגרף למטה בעמוד (8 עמודות לפי sku) **חיבר את 8 הערכים-לפי-sku** (2,400+1,080+510+390+336+**27**=4,743 · −165−210=−375) **במקום** לסכם ישירות לפי-סימן-שורה — מה ש"בולע" את שתי השורות השליליות של REG-TAG (−141 ₪ בס"כ) לתוך הדלי החיובי. פער מדויק פר-כיוון: **141 ₪** בשני הכיוונים (4,884−4,743=141 · 516−375=141) | 🔴 **באג-מוקאפ / שגיאה אריתמטית** (מאושר עצמאית — תואם `m11-data-fidelity.md` §2.1 במדויק) | **ברוטו-תוספות = 4,884 ₪** (לא 4,743) · **ברוטו-צמצומים = −516 ₪** (לא −375). **הנטו (4,368 ₪) נשאר ללא שינוי** — הוא כבר היה נכון בשתי דרכי-החישוב |

---

## §מה מזה חייב לרוץ בזריעה (`seed-phase-a.md`) — ולא ניתן לתקן במוקאפ

**כלום.** שישת הפריטים מתחלקים לשתי קבוצות, ואף אחת מהן אינה דורשת שינוי-דאטה:

- **א · ג (ניסוח) · ד · ה · ו** — תיקוני **מוקאפ/מסך** בלבד (נוסחת-עמודה, ניסוח, או שני מספרים
  שגויים באריח) — הדאטה שמתחתיהם תקינה כפי שהיא, ואינה זקוקה לזריעה נוספת.
- **ה** נוגע ל**קוד-אפליקציה קיים** (`apply_scope_change()` לא כותבת `logistics.project_change_id`)
  — לא לזריעה. וזה **כבר מוכרע**: `seed-phase-a.md` שורות 335–339 קובע במפורש *"מה שהצעד הזה לא
  יתקן, ואין לנסות: `logistics.project_change_id` יישאר 0 שורות"*, ו-R4 ב-`processes-approved.md`
  מסמן זאת כ**מבני, בכוונה** (סייג ㉗) עם המספר ✅ מכוסה. אין כאן ממצא חדש שדורש לפתוח את ההכרעה
  הזו מחדש.
- **ב** לא נדרש תיקון כלל — המספר נכון והחלון מוצהר.

---

## נספחים — השאילתות שהרצתי, מילה-במילה

### §נספח-א — הגדרת "שעות מתוכנן" ופיזור-הסטייה האמיתי

```sql
-- הגדרת planned_hours בפועל (מתוך pg_proc, לא ניחוש)
select pg_get_functiondef(oid) from pg_proc where proname='finance_project_money';
-- → v_planned_hours := mod(extract(epoch from (final_end_time-final_start_time))+86400,86400)/3600.0
--   (משך-האירוע עצמו, מספר אחד — לא סכום שעות-צוות)

-- 8 השורות המדויקות מהטבלה במוקאפ
select p.project_id, p.event_name, p.final_start_time, p.final_end_time,
  fm.planned_hours, sum(a.actual_hours) as sum_actual_hours,
  count(*) filter (where a.actual_hours>0) as n_paid_shifts,
  count(*) filter (where a.assignment_status='finally_approved') as n_finally_approved
from projects p
cross join lateral finance_project_money(p.project_id) fm
left join assignments a on a.project_id=p.project_id
where p.project_id in (12,1347,1376,1465,1488,1427,1423,1433)
group by p.project_id, p.event_name, p.final_start_time, p.final_end_time, fm.planned_hours
order by p.project_id;

-- סטיית-משמרת-בודדת האמיתית, כל המסד (3,679 משמרות-בתשלום)
with pd as (
  select p.project_id,
    mod(extract(epoch from (p.final_end_time - p.final_start_time))::numeric + 86400, 86400) / 3600.0 as planned_hours
  from projects p where p.final_start_time is not null and p.final_end_time is not null
)
select count(*) n_shifts,
  round(avg(a.actual_hours - pd.planned_hours)::numeric,2) avg_dev,
  round(percentile_cont(0.5) within group (order by a.actual_hours - pd.planned_hours)::numeric,2) median_dev,
  round(min(a.actual_hours - pd.planned_hours)::numeric,2) min_dev,
  round(max(a.actual_hours - pd.planned_hours)::numeric,2) max_dev,
  count(*) filter (where abs(a.actual_hours - pd.planned_hours) > 2) n_over_2h,
  count(*) filter (where abs(a.actual_hours - pd.planned_hours) > 1) n_over_1h
from assignments a join pd on pd.project_id = a.project_id
where a.actual_hours > 0;
-- → n_shifts=3679 · avg=0.15 · median=0.00 · min=-1.00 · max=4.50 · over_2h=1 · over_1h=116

-- פרצנטילים
with pd as (
  select p.project_id,
    mod(extract(epoch from (p.final_end_time - p.final_start_time))::numeric + 86400, 86400) / 3600.0 as planned_hours
  from projects p where p.final_start_time is not null and p.final_end_time is not null
),
dv as (select (a.actual_hours - pd.planned_hours) as dev from assignments a
  join pd on pd.project_id=a.project_id where a.actual_hours>0)
select round(percentile_cont(0.10) within group (order by dev)::numeric,2) p10,
  round(percentile_cont(0.90) within group (order by dev)::numeric,2) p90,
  round(percentile_cont(0.99) within group (order by dev)::numeric,2) p99
from dv;
-- → p10=-0.50 · p90=1.00 · p99=1.50

-- ברמת-פרויקט (מה שהמוקאפ בפועל מציג): סכום-צוות מול משך-אירוע-בודד, 712 פרויקטים
with pd as (
  select p.project_id,
    mod(extract(epoch from (p.final_end_time - p.final_start_time))::numeric + 86400, 86400) / 3600.0 as planned_hours
  from projects p where p.final_start_time is not null and p.final_end_time is not null
),
proj as (select a.project_id, sum(a.actual_hours) sum_actual
  from assignments a group by a.project_id having sum(a.actual_hours) > 0)
select count(*) n_projects,
  round(avg(proj.sum_actual - pd.planned_hours)::numeric,2) avg_dev,
  round(percentile_cont(0.5) within group (order by proj.sum_actual - pd.planned_hours)::numeric,2) median_dev,
  round(max(proj.sum_actual - pd.planned_hours)::numeric,2) max_dev,
  count(*) filter (where abs(proj.sum_actual - pd.planned_hours) > 2) n_over_2h
from proj join pd on pd.project_id = proj.project_id;
-- → n=712 · avg=24.68 · median=19.00 · max=101.50 · over_2h=671 (94.2%)
```

### §נספח-ב — חלון "15 הסטיות הגדולות"

כבר אומת במלואו ב-`m11-data-fidelity.md` §1/מ8 (שאילתה #12/#13 שם) על אותו חלון בדיוק
(`final_event_date between '2026-01-01' and '2026-09-06'`, R11) — לא הורץ מחדש כאן; רק אומת
שהחלון-המוצהר בכותרת-הדף (📐17) ובהצהרת-האוכלוסייה (📐2) הוא אותו חלון שנבדק שם.

### §נספח-ג — הוזמן/הגיע פר-פרויקט

```sql
with per_proj as (
  select project_id, sum(planned_qty) sum_planned, sum(actual_qty) sum_actual
  from logistics group by project_id
)
select count(*) n_projects,
  round(avg(sum_planned)::numeric,1) avg_planned,
  percentile_cont(0.5) within group (order by sum_planned) median_planned,
  min(sum_planned) min_planned, max(sum_planned) max_planned,
  round(avg(sum_actual)::numeric,1) avg_actual,
  percentile_cont(0.5) within group (order by sum_actual) median_actual
from per_proj;
-- → n=825 · avg_planned=528.2 · median=461 · min=100 · max=1311 · avg_actual=476.1 · median_actual=430

with per_proj as (select project_id, sum(planned_qty) sum_planned from logistics group by project_id)
select count(*) filter (where sum_planned between 100 and 800) n_100_800,
  count(*) filter (where sum_planned < 100) n_under_100,
  count(*) filter (where sum_planned > 800) n_over_800
from per_proj;
-- → 100-800: 648 · <100: 0 · >800: 177 (מתוך 825)
```

### §נספח-ד — צוואר-הבקבוק "אירוע←סגירה"

```sql
select count(*) n,
  round(percentile_cont(0.5) within group(order by (operationally_closed_at::date - final_event_date))::numeric,2) med,
  count(*) filter (where (operationally_closed_at::date - final_event_date) > 7) over7,
  max(operationally_closed_at::date - final_event_date) max_days
from projects where operationally_closed_at is not null;
-- → n=717 · med=3.00 · over7=0 · max_days=4
```

### §נספח-ה — שורות-לוגיסטיקה בלי מקור-עלות

```sql
select project_id, sku, planned_qty, actual_qty, quote_service_line_id, project_change_id, created_at
from logistics where quote_service_line_id is null and project_change_id is null;
-- → 3 שורות: פרויקטים 1581 · 1594 · 1606, כולן sku='B-SAT-LAN', planned_qty=40

select change_id, project_id, sku, delta_qty, unit_price_snapshot
from project_changes where project_id in (1581,1594,1606);
-- → change_id 7/12/17 קיימים בדיוק לאותם פרויקטים/sku (+40 כל אחד) — הקישור אבד רק ב-logistics
```

### §נספח-ו — ברוטו-תוספות/צמצומים

```sql
select
  round(sum(delta_qty*unit_price_snapshot) filter (where delta_qty>0)::numeric,0) gross_add,
  round(sum(delta_qty*unit_price_snapshot) filter (where delta_qty<0)::numeric,0) gross_red,
  round(sum(delta_qty*unit_price_snapshot)::numeric,0) net,
  count(*) filter (where delta_qty>0) n_pos, count(*) filter (where delta_qty<0) n_neg
from project_changes;
-- → gross_add=4884 · gross_red=-516 · net=4368 · n_pos=12 · n_neg=4
```

</div>
