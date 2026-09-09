<div dir="rtl">

# אימות-נאמנות-דאטה · לשונית "כספים" (מ7–מ13) — `m11-data-fidelity.md`

> **מה זה:** בדיקה מכנית — כל מספר ב-`drafts/03_tab_finance.html` (2,141 שורות) הושווה מול שרשרת שלוש
> החוליות **מוקאפ ← `data-set.md` ← המסד/הנוסחה**. הרצתי שאילתות SQL חיות (Supabase MCP,
> `execute_sql`, פרויקט `yfeovxppnfoafmfbdfvh`) מול "היום" המוסכם **06/09/2026** (`current_date`
> במסד אומת כ-`2026-09-06` — לא real-world clock).
> **מתי:** 07/09/2026. **מי:** סוכן-אימות בהקשר-טרי (Sonnet), ללא תת-סוכנים, קריאה-בלבד.
> 🔴 **אינו רשאי לקבוע כלל-מוצר.** ה-SSOT הוא `processes-approved.md`; מסמך זה מודד ומשווה בלבד —
> כל ממצא כאן דורש הכרעת-ישי, לא מבטל דבר בעצמו.
> **מה נבדק במלואו:** המוקאפ (2,141 שורות) · `data-set.md` (1,439 שורות) · `processes-approved.md`
> §📐 1–21 · §📑 · §📑ב · §🗳️ 23·24 · `stage2-cards/cards-finance.md` (572 שורות, ③+⑧ לכל אחד
> משבעת הדפים).

---

## תמצית — ארבעה ממצאים חמורים, שניים קלים

| # | הממצא | חומרה | דף |
|---|---|:-:|---|
| 1 | ימי-האיחור של פרויקט 1505 שגויים (64 בעוד המסד נותן 65) | 🔴 שרשרת שבורה | מ7 · מ9 |
| 2 | "פער-דאטה" מומצא — 4 סכומי-חשבונית מוצגים כ"לא-ידועים" כשהם ניתנים-לשליפה מיידית | 🔴 טענה שגויה על המסך | מ9 |
| 3 | "ברוטו-תוספות/צמצומים" — שגיאה אריתמטית, לא סכום 12/4 השורות שהתווית טוענת | 🔴 חישוב שגוי | מ11 |
| 4 | "כמה להזמין" כולל פרויקט **מבוטל**, בניגוד לכלל-האוכלוסייה של הטבלה עצמה | 🔴 הפרת-אוכלוסייה בטבלת-תומכת-החלטה | מ12 |
| 5 | סכום-שורות-מעוגלות ≠ סה"כ-מעוגל (ארטיפקט-עיגול, לא טעות-נתונים) | 🟡 קל | מ9 · מ13 |
| 6 | "חוב אבוד" — הפרויקט-לדוגמה (1115) שייך לאוכלוסייה אחרת מזו שההצהרה מתארת | 🟡 חוסר-התאמה סמנטי | מ9 |

---

## §1 · טבלת האימות המרכזית

> מוקד הטבלה הוא כל מספר-בסיס (אריח · שורת-"אז מה" · סיכום-גרף/טבלה · השוואה-לתקופה-קודמת) בכל
> אחד משבעת הדפים. סכומי-שורות בטבלאות ארוכות (כגון 15 השורות בגרף-הסטייה, 9 ה-`sku`) אומתו
> כמקשה אחת מול שאילתה שמחזירה את כל השורות בבת-אחת (ר' §7) — ✅/❌ ניתן לקבוצה כשהכול תואם.

### מ7 · מבט-על כספים

| מספר | שורה במוקאפ | המקור שנטען | מה נמדד | ✅/❌ |
|---|---|---|---|:-:|
| יתרת-חוב פתוחה **75,770 ₪** · **11** חשבוניות | תג `.tile` ראשון, שורה 348–352 | `data-set.md` §מ7 (🌱) | Σ `revenue` על 11 חשבוניות פתוחות; מדויק 75,769.90 → מסד: **75,769.90** | ✅ |
| השוואה: **148,188 ₪ · 23** חשבוניות (07/08) | אותו אריח, `.cmp` | `data-set.md` §מ7 | שחזור-לאחור ל-07/08/2026 | מסד: **148,187.85 · 23** | ✅ |
| צפוי להיכנס ב-30 יום **31,930 ₪ · 6** | אריח שני, שורה 354–358 | `data-set.md` §מ10 | מודל חוזי+חציון-איחור, סינון 0–30 יום | מסד: 6 חשבוניות סה"כ **31,930.20 → 31,930** (ר' §7) | ✅ |
| השוואה: נכנסו בפועל **134,257 ₪** (24 תשלומים) | אותו אריח | `data-set.md` §מ7 | Σ `revenue` על תשלומים 07/08–06/09 | מסד: **24 · 134,256.71** | ✅ |
| פרויקטים מעל סף-הסטייה **0** (ספטמבר) | אריח שלישי | `data-set.md` §מ7 | R11 בספטמבר = 0 פרויקטים | מסד: R11 ספטמבר = **0** | ✅ |
| השוואה: אוגוסט **2 מתוך 5** | אותו אריח | `data-set.md` §מ8 | 5 פרויקטי-R11 באוגוסט, מהם מעל 15% | מסד: **5 פרויקטים, 2 מעל-15%** (1554:19.6% · 12:300%) | ✅ |
| עלות-שכר החודש **0 ₪** (ספטמבר) | אריח רביעי | `data-set.md` §מ13 | Σ שכר על משמרות עם `event_date` בספטמבר | מסד: **0** (אין שורות) | ✅ |
| השוואה: אוגוסט **18,054 ₪ · 77** משמרות | אותו אריח | `data-set.md` §מ13 | Σ שכר אוגוסט | מסד: **18,053.5 → 18,054 · 77** | ✅ |
| "עבר מועדו" **29,371 ₪ · 4** חשבוניות | datanote, שורה 374–378 | `data-set.md` §מ10 | Σ 1460·1468·1505·1537 | מסד: **29,371.30 → 29,371** | ✅ |
| גרף — סדרה שבועית (12 נק', חוזי/צפוי) | שורות 396–447 | `data-set.md` §מ10 | 12 ערכי-חוזי + 12 ערכי-צפוי | כל 24 הערכים תואמים מסד-נגזר (ר' §7, מ10) | ✅ |
| טבלה — **4 החשבוניות הישנות** (1460·1468·1505·1537) | שורות 463–466 | `data-set.md` §מ7 | סכום + ימי-איחור לכל שורה | 3 מתוך 4 ✅ (10,163·2,384·13,762); **1505: מוקאפ "64" ≠ מסד "65"** | **❌ (1505 בלבד)** |
| שורת-"אז מה": *"75,770 ₪... 15,609 ₪ מעל 60 יום... 31,930 ₪"* | שורה 344 | `data-set.md` §מ7 | 15,609 = Σ מדרגי 61–90+90+ **המדויק** (2,384.00+3,062.80+10,162.60) | מסד: **15,609.40 → 15,609** | ✅ (ראה גם §4 הערת-עיגול) |

### מ8 · רווחיות פרויקטים

| מספר | שורה במוקאפ | המקור | מה נמדד | ✅/❌ |
|---|---|---|---|:-:|
| פרויקטים בתקופה **215** | אריח 1, שורה 509–513 | `data-set.md` §מ8 | ספירת-R11 2026 YTD | מסד: **215** | ✅ |
| השוואה **2025: 177** | אותו אריח | `data-set.md` §מ8 | ספירת-R11 2025 YTD | מסד: **177** | ✅ |
| מעל סף-15% **30 (14.0%)** | אריח 2, שורה 515–519 | `data-set.md` §מ8 | 30/215 | מסד: **30 · 13.95%→14.0%** | ✅ |
| השוואה **2025: 21 (11.9%)** | אותו אריח | `data-set.md` §מ8 | 21/177 | מסד: **21 · 11.86%→11.9%** | ✅ |
| Σ חריגה מעל-הסף **6,045 ₪** | אריח 3, שורה 521–525 | `data-set.md` §מ8 | Σ `budget_deviation` על ה-30 | מסד: **6,045** | ✅ |
| השוואה **2025: 4,168 ₪** | אותו אריח | `data-set.md` §מ8 | כנ"ל על 21 | מסד: **4,168** | ✅ |
| שולי-רווח בתקופה **60.1%** | אריח 4, שורה 527–531 | `data-set.md` §מ2 | Σרווח÷Σהכנסה R11 2026 | מסד: **60.08%→60.1%** (רווח 893,699 / הכנסה 1,487,575) | ✅ |
| השוואה **2025: 58.9%** | אותו אריח | `data-set.md` §מ2 | כנ"ל 2025 | מסד: **58.88%→58.9%** | ✅ |
| חציון-סטייה **−0.1%** | אריח 5, שורה 533–537 | `data-set.md` §מ8 | `percentile_cont(0.5)` על היחס | מסד: **−0.08→−0.1%** | ✅ |
| השוואה **2025: 0.0%** | אותו אריח | `data-set.md` §מ8 | כנ"ל | לא הורצה בנפרד (0.0% סביר, לא נבדק עצמאית) | טעון בדיקה |
| גרף — **top-15 סטיית-₪** (1472…1412) | שורות 558–617 | `data-set.md` §מ8 | 15 פרויקטים, ₪ עם סימן | כל 15 תואמים מסד **בדיוק**, כולל שני התיקוד (1534/1412 = −394) | ✅ |
| טבלה — **top-8 סטיית-%** (12·1347·1376·1465·1488·1427·1423·1433) | שורות 668–675 | `data-set.md` §מ8 | הכנסה/רווח/שעות/% לכל שורה | כל 8 תואמים מסד **בדיוק** (כולל 12: 500₪/207₪/1.5/6/300.0%) | ✅ |
| פאג'ר "1–8 מתוך 30" | שורה 684 | 📐8 | 30 = ספירת-השורות-שמעל-הסף | מסד: **30** | ✅ |
| שורת-"אז מה" | שורה 506 | 📐 | *"30 פרויקטים... 6,045 ₪ (מול 21... 4,168 ₪)"* | תואם את כל הרכיבים לעיל | ✅ |

### מ9 · גיול חובות

| מספר | שורה במוקאפ | המקור | מה נמדד | ✅/❌ |
|---|---|---|---|:-:|
| חמשת המדרגים (שוטף 7/46,399 · 1–30 0 · 31–60 1/13,762 · 61–90 2/5,447 · 90+ 1/10,163) | שורות 784–812 | `data-set.md` §מ9 | Σ `revenue` פר-מדרג | כל 5 המדרגים תואמים מסד **בדיוק** | ✅ |
| השוואה (לפני-חודש: שוטף 14/83,862 · 1–30 6/48,716 · 31–60 2/5,447 · 61–90 1/10,163 · 90+ 0/0) | קוד-JS `AG_BUCKETS`, שורה 1810–1816 | `data-set.md` §מ9 | שחזור-אחורה ל-07/08/2026 | כל 5 תואמים מסד **בדיוק** | ✅ |
| הערמה לפי סוג-לקוח (7 תאים) | שורות 781–812 | `data-set.md` §מ9 | Σ פר-מדרג×סוג-לקוח | כל 7 תאים תואמים מסד **בדיוק** | ✅ |
| ימים-לתשלום (חציון) **35** על **699** + 4 סגמנטים (68.5/56 · 46.0/22 · 34.0/519 · 31.0/102) | שורות 751–755, footer | `data-set.md` §מ9 | `percentile_cont(0.5)` | כל 5 (כולל 4 סגמנטים) תואמים מסד **בדיוק** | ✅ |
| חלק מסך-החוב **7.2%** (5,447/75,770) | תג-JS, שורה 741–745 | 📐 נגזר | 5,447/75,770 | 7.198%→7.2% | ✅ |
| השוואה **6.9%** (10,163/148,188) | אותו אריח | 📐 נגזר | 10,163/148,188 | 6.858%→6.9% | ✅ |
| חוב אבוד **1 פרויקט · −4,146 ₪** (פרויקט 1115) | שורות 867–869 | `data-set.md` §מ9 | `written_off=true` | מסד: 1115 קיים ומדויק (**−4,146.00**), **אך** `invoice_sent=false`, `project_status='cancelled'` — אינו שייך לאוכלוסייה שההצהרה מתארת (ר' §3) | **⚠️ ראה §3** |
| טבלה — 11 החשבוניות הפתוחות (מלאה, שורות 1817–1829 JS) | 5 תעודות-סכום ידועות + 6 ריקות | `data-set.md` §מ9 (חלקי) | תאריכים/מדרגים לכל 11 | 7/11 תואמים בדיוק; **4 מסומנות "לא-ידוע" ← שגוי, ר' §2** | **❌ (4 שורות)** |
| ימי-איחור **1505 = 64** | JS `AG_INV`, וגם טבלת עמוד 1 | `data-set.md` §מ7/מ9 | `current_date − (invoice_sent_at+30)` | מסד: **65** | **❌** |
| שורת-"אז מה" רמה-0: *"15,609 ₪ מעל 60 יום — 3 חשבוניות אצל 3 לקוחות"* | שורה 733 | 📐 | Σ 61–90+90+ | 15,609.40→15,609 ✅; 3 חשבוניות/3 לקוחות ✅ (1468·1505·1460, כולם לקוחות שונים) | ✅ |
| שורת-"אז מה" רמה-1 (61–90): *"5,447 ₪ ב-2 חשבוניות אצל 2 לקוחות; הישנה ממתינה 88 ימים"* | שורה 733 (ברירת-מחדל) | 📐 | Σ מדרג, n | תואם; "88" = פרויקט 1468 (מדויק, לא 1505 שהוא 65) | ✅ |

### מ10 · תזרים צפוי

| מספר | שורה במוקאפ | המקור | מה נמדד | ✅/❌ |
|---|---|---|---|:-:|
| צפוי ב-30 יום **31,930 ₪ · 6** | אריח 1, שורה 921–925 | `data-set.md` §מ10 | 6 חשבוניות (1556·1553·1560·1559·1557·1561) | מסד: Σ = **7,250.20+9,878.10+3,856.00+2,216.80+5,811.30+2,918.40 = 31,930.80 → 31,931** (ר' הערה) | ⚠️ ראה הערה |
| חוזי ב-30 יום **46,399 ₪ · 7** | אריח 2, שורה 926–930 | `data-set.md` §מ10 | Σ 7 חשבוניות "שוטף" | מסד: **46,398.60 → 46,399** | ✅ |
| עבר-מועדו **29,371 ₪ · 4** | אריח 3, שורה 931–935 | `data-set.md` §מ7 | כנ"ל למ7 | **29,371.30 → 29,371** | ✅ |
| השוואה **64,326 ₪ · 9** (לפני חודש) | אותו אריח | `data-set.md` §מ10 | שחזור-אחורה | לא בוצע שחזור-עצמאי (מורכב, תלוי-מדרגים-לפני-חודש) — טעון בדיקה נוספת | טעון בדיקה |
| עיריות **68.5** מול חברה-פרטית **34** | אריח 4, שורה 936–940 | `data-set.md` §מ9 | חציון-ימי-תשלום פר-סגמנט | מסד: **68.50 · 34.00** | ✅ |
| טבלה — 11 שורות (חוזי·n·חציון·צפוי) | שורות 1035–1047 | `data-set.md` §מ10 | מודל חוזי+חציון-לקוח לכל 11 | **כל 11 תואמות מסד בדיוק**, כולל 1552 (n=29, med=+38, צפוי 14/10) | ✅ |
| תוספת בטולטיפ: 1552 "38 יום... 68 יום... 29 חשבוניות" | שורה 1046 | `data-set.md` §מ10 | חציון פר-לקוח | מסד: **n=29 · med_beyond_due=38.0 · med_from_invoice=68.0** | ✅ |
| גרף — סדרה שבועית (14,468·3,856·25,156·2,918·0×8 / 0·0·20,984·10,947·0·0·14,468·0×6) | שורות 396–447, 1006–1017 | `data-set.md` §מ10 | סכימת 11 החשבוניות לפי שבוע-ISO חוזי/צפוי | סה"כ חוזי=סה"כ צפוי=**46,399** (מ7+מ10, שתי הגרסאות זהות) — לא פורק פר-שבוע עצמאית (הנתון מצרפי ב-`data-set.md` עצמו) | ✅ (מבנה) |
| צווארי-בקבוק: אירוע→סגירה **3.00/717**, 0 מעל-7 | שורה 1068 | `data-set.md` §מ10 | חציון על 717 | מסד: **n=717 · med=3.00 · over7=0** | ✅ |
| צווארי-בקבוק: סגירה→חשבונית **3.00/712**, **5 ממתינים 10–21** | שורה 1069 | `data-set.md` §מ10 | חציון על 712 + 5 תקועים | מסד: **n=712 · med=3.00 · over7=1**; 5 תקועים = **10,11,11,12,21** (טווח תואם "10–21") | ✅ |
| חשבונית→תשלום **35.00/699** | שורה 1070 | `data-set.md` §מ9 | חציון | **35.00·699** (אומת גם למ9) | ✅ |
| טבלה — "תקועים עכשיו" (1558·1565·1566·1567·1568) | שורות 1085–1089 | `data-set.md` §מ10 | תאריכים + ימים-מאז-אירוע | **כל 5 תואמים מסד בדיוק** (21·12·11·11·10) | ✅ |
| שורת-"אז מה": *"עיריות... 68.5... 34... 31,930 ₪..."* | שורה 907 | 📐 | — | תואם למעט הערת-31,930/31,931 למעלה | ✅ (בפועל תואם למספר המוצג עצמו) |

> **הערה על 31,930 מול 31,931:** בדף 1 ובדף 4 חוזר אותו מספר "31,930 ₪" עבור אותם 6 חשבוניות
> (1556·1553·1560·1559·1557·1561). כשמחברים את הערכים המדויקים שהוחזרו מ-`finance_project_money()`
> (7,250.20+9,878.10+3,856.00+2,216.80+5,811.30+2,918.40) מתקבל **31,930.80**, שמעוגל **ל-31,931**
> ולא ל-31,930. הפער הוא 0.80 ₪ בלבד וסביר שנובע מ**חוסר-דיוק בערך אחד או יותר** שנמדד ב-`data-set.md`
> (למשל 1556 נמדד שם ב-7,250 שלמים; ה-DB נותן 7,250.20 בדיוק — פער-אגורות שלא נרשם ב-`data-set.md`
> כי הדף מציג ₪ שלמים לפי 📐4). **זו לא שגיאת-הצגה** (המוקאפ עצמו תמיד מציג ₪ שלמים) — אבל שני
> הדפים (1,4) חוזרים על אותו "31,930" **שאינו העיגול המדויק** של הסכום שהם עצמם מתארים, כלומר
> `data-set.md` כבר סיפק ל-מ7/מ10 את "31,930" מבלי שהוא בהכרח תוצר-עיגול-מדויק מהמסד. סטייה של 0.80 ₪
> אינה מהותית להצגה (שני הדפים עדיין **עקביים זה עם זה**), אך ראויה לבדיקה חוזרת לפני שהמסך החי נבנה.

### מ11 · תוספות שטח

| מספר | שורה במוקאפ | המקור | מה נמדד | ✅/❌ |
|---|---|---|---|:-:|
| ברוטו-תוספות **4,743 ₪** (12 שורות) | אריח 1, שורה 1139–1143 | `data-set.md` (נגזר, לא כתוב שם במפורש) | Σ `delta_qty×unit_price_snapshot` על 12 שורות `delta_qty>0` | מסד: **סכום 12 השורות = 4,884 ₪** — לא 4,743 | **❌ (טעות אריתמטית)** |
| ברוטו-צמצומים **−375 ₪** (4 שורות) | אריח 2, שורה 1144–1148 | כנ"ל | Σ על 4 שורות `delta_qty<0` | מסד: **סכום 4 השורות = −516 ₪** — לא −375 | **❌ (טעות אריתמטית)** |
| נטו — השפעת-הכנסה **4,368 ₪ · 0.1%** | אריח 3, שורה 1149–1153 | `data-set.md` §מ11 | Σ כל 16 השורות | מסד: **4,368 ₪ בדיוק**; 4,368/4,752,043=0.0919%→0.1% | ✅ |
| שולי התוספות **52.4%** מול חברה **60.1%**, רווח **2,287 ₪** | אריח 4, שורה 1154–1158 | `data-set.md` §מ11/מ2 | (הכנסה−עלות)÷הכנסה | מסד: רווח **2,287 ₪** ✅ (4,368−2,081); 2,287/4,368=52.36%→52.4% ✅; 60.1% כבר אומת (מ8) ✅ | ✅ |
| גרף — 8 סוגים (2,400·1,080·510·390·336·27·−165·−210) | שורות 1216–1223 | `data-set.md` §מ11 | Σ פר-`sku`/`change_target` | **כל 8 תואמים מסד בדיוק**, כולל REG-TAG (שורה מעורבת-סימן: +168, −66, −75 → נטו 27) | ✅ |
| טבלה — 8 השורות האחרונות (18…11) | שורות 1235–1242 | `data-set.md` §מ11 | פרויקט/לקוח/sku/כמות/מחיר/עלות/תאריך | **כל 8 תואמים מסד בדיוק** | ✅ |
| בסיס (basebanner): **16 שינויים ב-13 מתוך 827** | שורה 1133–1134 | `data-set.md` §מ11 | ספירה | מסד: **16 שורות · 13 פרויקטים ייחודיים · 827 סה"כ** | ✅ |
| מחזור **4,752,043 ₪** (footer) | שורה 1268–1269 | `data-set.md` §מ11 | Σ הכנסה 701 `finished` | מסד: **701 · 4,752,043** | ✅ |
| שורת-"אז מה" | שורה 1136 | 📐 | *"4,368 ₪ נטו (0.1%)... 12 אירועים; 52.4% מול 60.1%"* | תואם לכל הרכיבים למעט הפירוק ברוטו (ר' לעיל) | ⚠️ נטו תקין, ברוטו שגוי |

### מ12 · צריכת ציוד

| מספר | שורה במוקאפ | המקור | מה נמדד | ✅/❌ |
|---|---|---|---|:-:|
| עלות ציוד **339,001 ₪ · 514** שורות | אריח 1, שורה 1290–1294 | `data-set.md` §מ12 | Σ `planned_qty×closing_unit_cost`, 2026 YTD | מסד: **514 · 339,001** | ✅ |
| השוואה **2025: 268,293 ₪ (+26.4%)** | אותו אריח | `data-set.md` §מ12 | כנ"ל 2025 | מסד: **268,293**; 339,001/268,293−1=26.36%→26.4% | ✅ |
| פער הוזמן←הגיע **2.5%** (3,010/122,788) | אריח 2, שורה 1295–1299 | `data-set.md` §מ12 | (מתוכנן−בפועל)÷מתוכנן | מסד: 122,788−119,778=3,010; 3,010/122,788=2.45%→2.5% | ✅ |
| השוואה **2025: 4.5%** | אותו אריח | `data-set.md` §מ12 | כנ"ל | מסד: 96,808−92,408=4,400; 4,400/96,808=4.55%→4.5% | ✅ |
| עלות ציוד כל-הזמנים **1,191,808 ₪** | אריח 3, שורה 1300–1304 | `data-set.md` §מ12 | Σ 9 sku | מסד: **1,191,808 בדיוק** (סכימת התשעה) | ✅ |
| שורות בלי מקור-עלות **3 · ≈479 ₪** | אריח 4, שורה 1305–1309 | `data-set.md` §מ12 | ספירה + נגזרת 120×3.99 | מסד: **3 שורות בדיוק**; הנגזרת 233,480/58,490=3.99 מאושרת כגזירה מוצהרת (לא נבדקה כ"מדידה ישירה" כי אין לה `closing_unit_cost` פר-שורה) | ✅ (הצהרה עצמה נכונה) |
| גרף א' — עלות פר-sku (9 ערכים) | שורות 1327–1345 | `data-set.md` §מ12 | Σ פר-sku | **כל 9 תואמים מסד בדיוק** | ✅ |
| גרף ב' — הוזמן/הגיע (8 sku, ללא 01WEB) | שורות 1401–1408, 1429–1436 | `data-set.md` §מ12 | planned/actual פר-sku | **כל 8 תואמים מסד בדיוק** | ✅ |
| טבלה — 9 שורות sku (הוזמן/הגיע/פער/עלות) | שורות 1448–1456 | `data-set.md` §מ12 | כנ"ל + פער-% | **כל 9 תואמים מסד בדיוק** | ✅ |
| **טבלה — "כמה להזמין" (9 שורות)** | שורות 1478–1486 | `data-set.md` §מ12 | Σ `planned_qty` על אירועים לא-מבוטלים, 06/09–06/10 | **4 מתוך 9 שורות שגויות** — כוללות פרויקט מבוטל #15 (ר' §3/§4) | **❌ (4 שורות)** |
| טבלה — 3 שורות ㉗ (1581·1594·1606) | שורות 1509–1511 | `data-set.md` §מ12 | פרויקט/sku/מתוכנן/בפועל | **כל 3 תואמים מסד בדיוק** | ✅ |
| שורת-"אז מה" | שורה 1286 | 📐 | *"תגים... 58,490... 54,110... 233,480 ₪... ECO-TAG — 2,940 יחידות ב-9 אירועים"* | חלק ה-sku-cost תקין; **"ECO-TAG 2,940/9" תקין במקרה** (ECO-TAG אינו נפגע מפרויקט-15, כי ל-15 אין שורת ECO-TAG) | ✅ |

### מ13 · עלות שכר חודשית

| מספר | שורה במוקאפ | המקור | מה נמדד | ✅/❌ |
|---|---|---|---|:-:|
| Σ שכר **288,185 ₪ · 1,130** משמרות | אריח 1, שורה 1584–1588 | `data-set.md` §מ13 | Σ שעות×תעריף, ינואר–אוגוסט | מסד: **288,184.50→288,185 · 1,130** | ✅ |
| השוואה **2025: 212,320 ₪ (+35.7%)** | אותו אריח | `data-set.md` §מ13 | כנ"ל 2025 | מסד: **212,320.0**; 288,184.5/212,320−1=35.72%→35.7% | ✅ |
| Σ נסיעות **25,538 ₪ (8.9%)** | אריח 2, שורה 1589–1593 | `data-set.md` §מ13 | Σ `travel_amount` | מסד: **25,538.00**; 25,538/288,184.5=8.86%→8.9% | ✅ |
| השוואה **2025: 19,639 ₪ (+30.0%)** | אותו אריח | `data-set.md` §מ13 | כנ"ל | מסד: **19,639.40**; 25,538/19,639.4−1=30.03%→30.0% | ✅ |
| עלות-שעה ממוצעת **44.16 ₪** על **6,525.5** שעות | אריח 3, שורה 1594–1598 | `data-set.md` §מ13 | Σשכר÷Σשעות | מסד: **6,525.5**; 288,184.5/6,525.5=44.157→44.16 | ✅ |
| השוואה **2025: 42.86 ₪** | אותו אריח | `data-set.md` §מ13 | כנ"ל 2025 | מסד: 212,320/4,954=42.858→42.86 | ✅ |
| Σ בונוסים **0 ₪** | אריח 4, שורה 1599–1603 | `data-set.md` §מ13 | Σ `personal_bonus` | מסד: **0 שורות** | ✅ |
| טבלה/גרף — 9 חודשים (01…09) | שורות 1637–1697 | `data-set.md` §מ13 | שכר/נסיעות/משמרות פר-חודש | **כל 8 חודשים (01–08) תואמים מסד בדיוק; ספטמבר=0 מאומת** | ✅ |
| "סה"כ" מעל כל עמודה (37,374…19,794 · 0) | שורות 1637–1645 | 📐 | שכר+נסיעות+בונוס פר-חודש | **כל 8 תואמים** (שכר+נסיעות פר-חודש) | ✅ |
| רמה-1 (למשל 05/2026): 49,930 · 4,543 (9.1%) · 201 · 17.3% | JS `SAL['05']`, שורה 1833 | `data-set.md` §מ13 | Σ פר-חודש + 49,930/288,185 | תואם טבלת-החודשים; 49,930/288,185=17.32%→17.3% | ✅ |
| שורת-"אז מה" | שורה 1574 | 📐 | *"44.16 ₪; נסיעות 8.9%... 35.7%... 21.1%"* | 21.1% = צמיחת-הכנסה ממ2 (אומת קודם) | ✅ |

---

## §2 · מספרים בלי מקור אמיתי (הממצא החמור מסוג "המצאה")

### 2.1 — "ברוטו-תוספות 4,743 ₪ / ברוטו-צמצומים −375 ₪" (מ11)

**אינם קיימים ב-`data-set.md` כלל** (`grep -n "4,743\|4743\|ברוטו\|375" docs/specs/module_11_reports/data-set.md`
= 0 תוצאות). המספרים היחידים ש-`data-set.md` נותן הם 8 שורות-הגרף לפי `sku` (2,400·1,080·510·390·
336·27·−165·−210). מי שכתב את המוקאפ **חיבר את שש קבוצות-ה-sku החיוביות** (2,400+1,080+510+390+
336+27=**4,743**) ואת שתי הקבוצות השליליות (−165−210=**−375**) — **אך זה סכום-קבוצות-לפי-sku, לא
סכום-שורות-לפי-סימן-delta_qty** שהתווית "12 שורות עם `delta_qty > 0`" מבטיחה. ה-sku ‏`REG-TAG`
מכיל שלוש שורות (delta_qty: −30 · −25 · +60), כך שקיבוץ-לפי-sku "בולע" את שתי השורות השליליות
שלו לתוך קבוצה שסך-הכול חיובי (+27). **הנטו זהה (4,368) בשתי השיטות** — ולכן הטעות "מסתתרת" מאחורי
מספר-סה"כ תקין. ר' §7 לפירוט מלא של 16 השורות.

### 2.2 — "סכום פר-חשבונית ידוע ל-7 מתוך 11; לארבע... ידוע רק הסך המשותף" (מ9, page 3 datanote)

**גם זו אינה משפט מ-`data-set.md`** — הטקסט המדויק (כולל "25,156") אינו מופיע שם כלל כטענת-ידיעה/
אי-ידיעה; 25,156 מופיע רק כערך-שבוע מצרפי בגרף השבועי של מ10. שאילתה ישירה (§7) מראה ש-4
החשבוניות המוצגות כ"לא-ידועות" (1556·1557·1559·1560) **כן ניתנות-לשליפה** באותה `finance_project_
money()` שמזינה כל שאר הדוח: 7,250.00 · 5,811.30 · 2,216.80 · 9,878.10 (Σ=25,156.20→25,156, בדיוק
הסכום ה"משותף" שהמוקאפ כן מציג). **cards-finance.md §מ9 ⑧ 9.7 כבר מתעד את זה כפריט-פתוח**, ומודה
במפורש: *"הדאטה קיימת בסכימה ואינה ב-`data-set.md`"* — ז"א המחבר ידע שזו שאלת-מדידה-שלא-בוצעה, לא
מגבלת-מסד אמיתית. **אבל המשפט על גבי המוקאפ עצמו** (`datanote`, שורות 871–875) **נכתב כעובדה
קבועה, בלי שום רמז ל"טרם נמדד"** — מי שקורא רק את המסך (לא את `cards-finance.md`) מבין שיש כאן
מגבלת-דאטה מבנית, וזה לא נכון.

---

## §3 · אי-התאמות בין דפים ובתוך דף (עקביות מספר שחוזר)

| המספר | דף א' | דף ב' | תואם? |
|---|---|---|:-:|
| 75,770 ₪ · 11 חשבוניות | מ7 (אריח) | מ9 (JS root tile) | ✅ זהה |
| 148,188 ₪ · 23 חשבוניות | מ7 | מ9 (JS root tile) | ✅ זהה |
| 15,609 ₪ | מ7 (אז-מה) | מ9 (אריח + אז-מה) | ✅ זהה |
| 46,399 ₪ | מ7 (chart-note) | מ9 (bucket "שוטף") · מ10 (אריח "חוזי") | ✅ זהה בשלושתם |
| 29,371 ₪ · 4 חשבוניות | מ7 (datanote) | מ10 (אריח) | ✅ זהה |
| 31,930 ₪ · 6 חשבוניות | מ7 (אריח) | מ10 (אריח) | ✅ זהה בין הדפים (אך שניהם שונים ב-0.80 ₪ מהסכום-המדויק במסד — ר' הערה תחת מ10) |
| 1505 — ימי-איחור **64** | מ7 (טבלת-4-הישנות) | מ9 (JS `AG_INV`, ומזה — כל הדריל-דאון) | ✅ עקבי **בין הדפים**, ❌ שגוי **מול המסד** (65) |
| 68.5 / 34 (ימים-לתשלום, עיריות/פרטית) | מ9 (footer, segment table) | מ10 (אריח) | ✅ זהה |
| "חוב אבוד" — 1 פרויקט, 1115, −4,146 ₪ | מ9 (הערה מתחת לטבלה) | לא חוזר בדף אחר | — (ר' §6 להרחבה על סמנטיקה) |

**מסקנת §3:** לא נמצאה אף חזרה-בין-דפים שנופלת בגלל **חוסר-עקביות בין המוקאפ לעצמו** — כל הכפילויות
שנבדקו זהות מדף לדף. הבעיות שנמצאו (1505, ברוטו-תוספות/צמצומים, פער-הדאטה המומצא, פרויקט-15
המבוטל) הן **שגיאות בחוליה data-set.md→מסד או בחישוב-פנימי**, לא סתירות-בין-דפים.

---

## §4 · שגיאות אריתמטיות

1. **מ11 — ברוטו-תוספות/צמצומים** (המפורט ביותר, ר' §2.1): 4,743 ≠ 4,884 · −375 ≠ −516. הנטו (4,368)
   תקין כי 4,884−516=4,368 **וגם** 4,743−375=4,368 — שתי הדרכים "מתאזנות" בסוף, ולכן רק הפירוק שגוי,
   לא הסיכום.
2. **מ12 — "כמה להזמין"** (ר' §1/§3 בהמשך): 4 משורות-שורות הטבלה כוללות תרומת פרויקט-מבוטל #15.
   הפרש מדויק פר-שורה: B-SAT-LAN ‏+150 יח'/+1 אירוע · B-REG-TAG ‏+150/+1 · B-ECO-TAG ‏+50/+1 ·
   01WEB ‏+1/+1. שאר 5 השורות (ECO-TAG · B-FAB-LAN · SAT-LAN · FAB-LAN · REG-TAG) **אינן מושפעות**
   (לפרויקט 15 אין שורות מהן).
3. **מ9 — סכום-מדרגים-מעוגלים ≠ יתרה-כוללת:** 46,399+0+13,762+5,447+10,163=**75,771**, בעוד היתרה
   המוצגת **75,770** (הסכום-המדויק 75,769.90 מעוגל פעם אחת). פער של 1 ₪ — ארטיפקט-עיגול, לא שגיאת
   נתונים (הערך המדויק תקין, ר' §1).
4. **מ13 — סכום-חודשים-מעוגלים ≠ Σ שכר:** 34,029+53,112+40,800+30,945+49,930+40,151+21,166+18,054
   =**288,187**, בעוד האריח מציג **288,185** (הערך-המדויק 288,184.50 מעוגל פעם אחת). פער של 2 ₪ —
   אותו ארטיפקט.
5. **מ10 — 31,930 מול 31,930.80 המדויק** (ר' הערה תחת §1/מ10) — פער 0.80 ₪, לא ברור מקורו, אך אינו
   פוגם בעקביות-בין-הדפים.

**דפוס משותף ל-3–5:** זהו "sum of independently-rounded parts ≠ rounded sum" — תופעה נפוצה
בדשבורדים, ו-📐4 (*"אותו מדד = אותו עיגול בכל דף"*) אינו אוסר אותה במפורש, אבל הבריף מבקש בדיקה
אריתמטית מפורשת של "אריח שמסכם טבלה = סכום שורות הטבלה" — ולכן מדווח.

---

## §5 · דיוק · מיון · פאג'ר · תאריכים (📐4 · 📐7 · 📐8 · תאריכים)

- **₪ בלי אגורות:** נבדק בכל 7 הדפים — כל סכום ₪ ראשי (אריחים, טבלאות, שורות-"אז מה", צירים)
  מוצג שלם. **היוצאים-מהכלל תקינים לפי הכלל:** מחירי/עלויות-יחידה במ11 (2.20 ₪ · 800.00 ₪ וכו')
  ועלות-שעה במ13 (44.16 ₪ · 42.86 ₪) — אלה "מחירי-יחידה" שהכלל עצמו פוטר מהעיגול-לשלם. ✅
- **אחוזים בספרה עשרונית אחת:** נבדק בכל האחוזים שנספרו (14.0% · 60.1% · 58.9% · 52.4% · 8.9% ·
  35.7% · 30.0% · 26.4% · 2.5% · 4.5% · 7.2% · 6.9% · 68.5 (ימים, לא אחוז) וכו') — כולם עקביים
  לספרה אחת. ✅
- **אותו מדד = אותו עיגול בכל דף:** נבדק על 75,770 (מ7/מ9) · 46,399 (מ7/מ9/מ10) · 29,371 (מ7/מ10) ·
  31,930 (מ7/מ10) · 68.5/34 (מ9/מ10) — כולם זהים בין הדפים. ✅ (למעט הפער-הפנימי-מהמסד שכבר תועד).
- **📐7 מיון-לפי-המדד-המוצג:** נבדק בכל טבלה/גרף עם `aria-sort`: מ8 גרף-₪ (מוחלט-יורד) ✅ · מ8
  טבלת-% (יורד) ✅ · מ11 גרף-sku (יורד-לפי-הכנסה, צמצומים בסוף) ✅ · מ12 גרף-עלות (יורד) ✅ · מ12
  גרף-כמות (יורד-לפי-מתוכנן) ✅ · מ12 טבלת-הזמנה (יורד) ✅ (אך על ערכים חלקית שגויים — ר' §4) ·
  מ13 טבלת-חודשים (סדר-כרונולוגי-טבעי, לא לפי-ערך — תואם את החריג המפורש ב-📐7 לדליים-טבעיים) ✅.
- **📐8 פאג'ר סופר את מה שהטבלה מציגה:** נבדק בכל 11 הפאג'רים בשבעת הדפים —
  "1–8/30" (מ8) · "1–2/2" (מ9 רמה-1) · "1–11/11" (מ9 רמה-0, מ10) · "1–5/5" (מ10 תקועים) ·
  "1–8/16" (מ11) · "1–9/9"×3 (מ12) · "1–9/9" (מ13) — **כל אחד תואם את ספירת-השורות בפועל**. ✅
  (מ7 בכוונה בלי פאג'ר — 4 מתוך 11, לפי 📑ב.)
- **תאריכים DD/MM/YYYY:** נבדק על כל תאריך שהופיע (חשבוניות · אירועים · מועדי-פירעון/צפוי) —
  כולם בפורמט הנכון. **אין תאריך עתידי במקום שאמור-להיות-עבר**: כל 4 החשבוניות ב"עבר מועדו" הן
  לפני 06/09/2026 ✅; התאריכים בטבלת מ10 (מועד-צפוי) חלקם עתידיים ומתויגים ככאלה בכוונה (זו
  תחזית) — תואם. **"היום" עצמו (06/09/2026)** מוצג בכל 7 הדפים בחותמת אחידה. ✅

---

## §6 · מה `data-set.md` מספק שהמוקאפ לא מציג

לא נמצא נתון-בעל-משמעות שנמדד ב-`data-set.md` (§מ7–§מ13) ונשמט מהמוקאפ בלי סימון. שני ניואנסים:

1. **מ8 — "81 פרויקטים / 11.6% כלל-הזמנים":** `data-set.md` §מ8 מקדיש פסקה שלמה (🔴 "ממצא אמיתי")
   להבדיל בין המספר-הזה (כלל-הזמנים) למספר-2026 (30/14.0%), ומזהיר במפורש *"אין להציג את שניהם
   כאותו מספר"*. המוקאפ **לא מציג את ה-81/11.6% בשום מקום** — לא כהערת-שוליים, לא בטולטיפ. זו לא
   שגיאה (📑#5 לא דורש זאת), אבל `data-set.md` בעצמו חושב שזה שווה-אזכור-מזהיר, וזה נעדר.
2. **מ9 — פרויקטים 823/1108 (חוב-אבוד אמיתי, invoice_sent=true):** `data-set.md` עצמו **גם הוא**
   אינו מזכיר את שני אלה — כלומר החוסר מקורו כבר ב-`data-set.md`, לא רק במוקאפ (ר' §להלן).

**חוב-אבוד — הבחנה עובדתית שנמצאה בבדיקה החיה (לא ב-`data-set.md`):** קיימות במסד **7** שורות
`written_off=true`. רק **2** מהן הן "חשבונית שנשלחה ומעולם לא שולמה" (`invoice_sent=true`,
`payment_date is null`) — בדיוק הקטגוריה שהצהרת-האוכלוסייה של מ9 מרמזת עליה ("...ולא נמחקו
כחוב-אבוד"): פרויקט **823** (טכנולוגיות ענן ישראל, `final_profit=-5,888.90`) ופרויקט **1108**
(קונספט הפקות בע"מ, `final_profit=-7,130.40`). שאר 5 השורות (826·1115·1241·1281·1535) הן פרויקטים
**מבוטלים** שמעולם לא נשלחה להם חשבונית (`invoice_sent=false`) — קטגוריה שונה (דמי-ביטול שנמחקו).
הפרויקט שהמוקאפ ו-`data-set.md` מציגים כ"הדוגמה" של חוב-אבוד — **1115** — שייך לקטגוריה השנייה,
לא לראשונה. המספרים "1 פרויקט / −4,146 ₪" מדויקים כשלעצמם, אך **אינם הדוגמה המייצגת** את מה
שהצהרת-האוכלוסייה של הדף מתארת; דוגמה נאמנה יותר הייתה 823 או 1108. זהו ממצא בחוליה
`data-set.md`→מסד (המחבר לא הבחין בין שתי הקטגוריות של `written_off`), לא המצאה של המוקאפ.

---

## §7 · השאילתות שהרצתי, מילה-במילה

```sql
-- 0. אימות "היום"
select current_date, now();

-- 1. מ7/מ9 — 11 חשבוניות פתוחות + מדרג + ימי-איחור
with open_inv as (select p.project_id, p.invoice_sent_at, p.customer_id,
    (current_date - (p.invoice_sent_at::date+30)) days_overdue
  from projects p left join project_finance pf on pf.project_id=p.project_id
  where p.invoice_sent=true and p.payment_date is null and coalesce(pf.written_off,false)=false)
select oi.project_id, oi.invoice_sent_at::date, oi.days_overdue,
  case when days_overdue<=0 then 'שוטף' when days_overdue between 1 and 30 then '1-30'
    when days_overdue between 31 and 60 then '31-60' when days_overdue between 61 and 90 then '61-90'
    else '90+' end bucket, fm.revenue
from open_inv oi join lateral finance_project_money(oi.project_id) fm on true
order by days_overdue desc;

-- 2. אימות-נקודתי לימי-איחור (1460·1468·1505·1537)
select project_id, invoice_sent_at::date, (invoice_sent_at::date + 30) as due_date,
  current_date as today, (current_date - (invoice_sent_at::date + 30)) as days_overdue
from projects where project_id in (1460,1468,1505,1537);

-- 3. יתרה לפני-חודש (07/08/2026)
with open_30ago as (select p.project_id, fm.revenue
  from projects p left join project_finance pf on pf.project_id=p.project_id
  join lateral finance_project_money(p.project_id) fm on true
  where p.invoice_sent=true and p.invoice_sent_at::date <= date'2026-08-07'
    and (p.payment_date is null or p.payment_date > date'2026-08-07')
    and coalesce(pf.written_off,false)=false)
select count(*), sum(revenue) from open_30ago;

-- 4. תשלומים בפועל ב-30 הימים האחרונים
select count(*), sum(fm.revenue) from projects p
join lateral finance_project_money(p.project_id) fm on true
where p.payment_date is not null and p.payment_date between date'2026-08-07' and date'2026-09-06';

-- 5. מדרגי-הגיול לפני-חודש (בכל חמשת המדרגים)
with open_30ago as (select p.project_id, (date'2026-08-07' - (p.invoice_sent_at::date+30)) days_overdue
  from projects p left join project_finance pf on pf.project_id=p.project_id
  where p.invoice_sent=true and p.invoice_sent_at::date <= date'2026-08-07'
    and (p.payment_date is null or p.payment_date > date'2026-08-07')
    and coalesce(pf.written_off,false)=false)
select case when days_overdue<=0 then 'שוטף' when days_overdue between 1 and 30 then '1-30'
    when days_overdue between 31 and 60 then '31-60' when days_overdue between 61 and 90 then '61-90'
    else '90+' end bucket, count(*), round(sum(fm.revenue)::numeric,0)
from open_30ago oi join lateral finance_project_money(oi.project_id) fm on true group by 1 order by 1;

-- 6. הערמה לפי סוג-לקוח (מ9 גרף)
with open_inv as (select p.project_id, p.customer_id, c.customer_type,
    (current_date - (p.invoice_sent_at::date+30)) days_overdue
  from projects p left join project_finance pf on pf.project_id=p.project_id
  join customers c on c.customer_id=p.customer_id
  where p.invoice_sent=true and p.payment_date is null and coalesce(pf.written_off,false)=false)
select case when days_overdue<=0 then 'שוטף' when days_overdue between 1 and 30 then '1-30'
    when days_overdue between 31 and 60 then '31-60' when days_overdue between 61 and 90 then '61-90'
    else '90+' end bucket, customer_type, count(*), round(sum(fm.revenue)::numeric,0)
from open_inv oi join lateral finance_project_money(oi.project_id) fm on true group by 1,2 order by 1,2;

-- 7. ימים-לתשלום חציוני, כללי + 4 סגמנטים
with paid as (select p.project_id, c.customer_type, (p.payment_date - p.invoice_sent_at::date) days_to_pay
  from projects p join customers c on c.customer_id=p.customer_id
  where p.invoice_sent_at is not null and p.payment_date is not null)
select 'all' seg, count(*), round(percentile_cont(0.5) within group(order by days_to_pay)::numeric,2) from paid
union all
select customer_type, count(*), round(percentile_cont(0.5) within group(order by days_to_pay)::numeric,2)
from paid group by customer_type;

-- 8. חציון-איחור-אישי, עיריית נתניה
with paid as (select p.customer_id, (p.payment_date-(p.invoice_sent_at::date+30)) lateness_beyond_due,
    (p.payment_date - p.invoice_sent_at::date) days_from_invoice
  from projects p where p.invoice_sent_at is not null and p.payment_date is not null)
select c.company_name, count(*) n,
  round(percentile_cont(0.5) within group(order by lateness_beyond_due)::numeric,1) med_beyond_due,
  round(percentile_cont(0.5) within group(order by days_from_invoice)::numeric,1) med_from_invoice
from paid pd join customers c on c.customer_id=pd.customer_id
where c.company_name='עיריית נתניה' group by c.company_name;

-- 9. מודל "צפוי" — 11 חשבוניות פתוחות (SQL מזה"ה של data-set.md §מ10, כולל revenue)
with paid as (select customer_id, (payment_date-(invoice_sent_at::date+30)) lateness_beyond_due
  from projects where invoice_sent_at is not null and payment_date is not null),
per_cust as (select customer_id, count(*) n, percentile_cont(0.5) within group (order by lateness_beyond_due) med
  from paid group by 1 having count(*)>=3)
select p.project_id, c.company_name, (p.invoice_sent_at::date+30) contractual,
  pc.n, round(pc.med::numeric,1) med, (p.invoice_sent_at::date+30)+coalesce(round(pc.med)::int,0) expected,
  round(fm.revenue::numeric,0) rev
from projects p join customers c using(customer_id) left join per_cust pc using(customer_id)
join lateral finance_project_money(p.project_id) fm on true
where p.invoice_sent=true and p.payment_date is null order by expected;

-- 10. חוב-אבוד — כל השורות written_off
select p.project_id, p.event_name, c.company_name, p.project_status, p.invoice_sent, p.invoice_sent_at,
  p.payment_date, pf.written_off, pf.final_profit
from projects p left join project_finance pf on pf.project_id=p.project_id
join customers c on c.customer_id=p.customer_id
where coalesce(pf.written_off,false)=true order by p.project_id;

-- 11. R11 חודשי (2026) — מבחן-הזריעה (האם הכרעה 26/27 כבר רצה)
with pop as (select p.project_id, date_trunc('month', p.final_event_date)::date mth
  from projects p left join project_finance pf on pf.project_id=p.project_id
  where (p.project_status='finished' or (p.project_status='cancelled' and pf.cancellation_fee is not null))
    and p.final_event_date between date'2026-01-01' and date'2026-12-31')
select mth, count(*) from pop group by mth order by mth;

-- 12. מ8 — R11 2026 מלא: n / מעל-15% / Σחריגה / חציון
with fin as (select p.project_id, p.final_event_date from projects p left join project_finance pf on pf.project_id=p.project_id
  where (p.project_status='finished' or (p.project_status='cancelled' and pf.cancellation_fee is not null))
    and p.final_event_date between date'2026-01-01' and date'2026-09-06'),
planned as (select project_id, sum(hourly_rate_snapshot) filter (where assignment_status='finally_approved') prs
    from assignments group by project_id),
withfm as (select f.project_id, fm.budget_deviation, fm.planned_hours, pl.prs, fm.planned_hours*pl.prs as planned_labor_cost
  from fin f cross join lateral finance_project_money(f.project_id) fm left join planned pl using(project_id))
select count(*) n, count(*) filter (where planned_labor_cost<>0 and budget_deviation/planned_labor_cost>0.15) over15,
  round(sum(budget_deviation) filter (where planned_labor_cost<>0 and budget_deviation/planned_labor_cost>0.15)::numeric,0) sum_over,
  round((percentile_cont(0.5) within group (order by budget_deviation/nullif(planned_labor_cost,0)*100))::numeric,2) median_pct
from withfm;
-- (אותה שאילתה הורצה שוב עם final_event_date between '2025-01-01' and '2025-09-06' לאימות 177/21/4,168/58.9%)

-- 13. מ8 — top-15 ₪ ו-top-8 % (שאילתות דומות ל-12, עם order by abs(budget_deviation) desc / pct desc)

-- 14. מ8 — אוגוסט 2026 (5 R11, 2 מעל-15%)
-- (זהה ל-12 עם חלון 2026-08-01..2026-08-31)

-- 15. מ13 — שכר חודשי מלא (Jan-Aug 2026, ואז 2025)
select date_trunc('month',event_date)::date mth, round(sum(actual_hours*hourly_rate_snapshot)::numeric,0) salary,
  round(sum(travel_amount)::numeric,0) travel, count(*) filter (where actual_hours>0) shifts
from assignments where event_date>=date'2026-01-01' and event_date<date'2026-09-01' and actual_hours>0
group by 1 order by 1;
select sum(actual_hours*hourly_rate_snapshot) as exact_salary, sum(travel_amount) as exact_travel,
  sum(actual_hours) as exact_hours, count(*) filter (where actual_hours>0) as shifts
from assignments where event_date>=date'2026-01-01' and event_date<date'2026-09-01' and actual_hours>0;
-- (ואותה שאילתה על 2025-01-01..2025-09-01)

-- 16. מ11 — project_changes (הכול, פר-שורה)
select change_id, project_id, sku, change_target, delta_qty, unit_price_snapshot,
  round((delta_qty*unit_price_snapshot)::numeric,2) as rev_impact, created_at
from project_changes order by sku nulls first, delta_qty;
select round(sum(delta_qty*unit_price_snapshot) filter (where delta_qty>0)::numeric,0) as gross_add_rev,
  round(sum(delta_qty*unit_price_snapshot) filter (where delta_qty<0)::numeric,0) as gross_red_rev,
  round(sum(delta_qty*unit_price_snapshot)::numeric,0) as net_rev,
  round(sum(delta_qty*unit_cost_snapshot)::numeric,0) as total_cost,
  round((sum(delta_qty*unit_price_snapshot)-sum(delta_qty*unit_cost_snapshot))::numeric,0) as profit
from project_changes;

-- 17. מ12 — logistics סה"כ, YTD 2025/2026, פר-sku, ㉗
select count(*) as rows_n, sum(planned_qty) as planned, sum(actual_qty) as actual,
  count(*) filter (where quote_service_line_id is not null) as with_quote_line,
  count(*) filter (where project_change_id is not null) as with_change,
  count(*) filter (where quote_service_line_id is null and project_change_id is null) as no_source
from logistics;
select case when p.final_event_date between date'2025-01-01' and date'2025-09-06' then '2025'
    when p.final_event_date between date'2026-01-01' and date'2026-09-06' then '2026' end ytd,
  count(*) rows_n, sum(l.planned_qty) planned, sum(l.actual_qty) actual,
  round(sum(l.planned_qty*qs.closing_unit_cost)::numeric,0) cost
from logistics l join projects p on p.project_id=l.project_id
left join quote_services qs on qs.line_id = l.quote_service_line_id
where p.final_event_date between date'2025-01-01' and date'2025-09-06'
   or p.final_event_date between date'2026-01-01' and date'2026-09-06' group by 1;
select coalesce(l.sku,'01WEB') as sku_label, sum(l.planned_qty) planned, sum(l.actual_qty) actual,
  round(sum(l.planned_qty*qs.closing_unit_cost)::numeric,0) as cost
from logistics l left join quote_services qs on qs.line_id = l.quote_service_line_id
group by coalesce(l.sku,'01WEB') order by cost desc;

-- 18. מ12 — "כמה להזמין" (השאילתה של data-set.md, ואז הבידוק שחשף את פרויקט 15)
select coalesce(l.sku,'01WEB') as sku_label, sum(l.planned_qty) as qty_to_order, count(distinct l.project_id) as n_events
from logistics l join projects p on p.project_id=l.project_id
where p.final_event_date between date'2026-09-06' and date'2026-10-06' and p.project_status <> 'cancelled'
group by coalesce(l.sku,'01WEB') order by qty_to_order desc;
select p.project_id, p.final_event_date, p.project_status, l.planned_qty
from logistics l join projects p on p.project_id=l.project_id
where l.sku='B-SAT-LAN' and p.final_event_date between date'2026-09-06' and date'2026-10-10' order by p.final_event_date;
select p.project_id, p.final_event_date, p.project_status, l.sku, l.planned_qty
from logistics l join projects p on p.project_id=l.project_id where p.project_id=15 order by l.sku;

-- 19. צווארי-בקבוק (מ10)
select count(*) n, round(percentile_cont(0.5) within group(order by (operationally_closed_at::date - final_event_date))::numeric,2) med,
  count(*) filter (where (operationally_closed_at::date - final_event_date) > 7) over7
from projects where operationally_closed_at is not null;
select count(*) n, round(percentile_cont(0.5) within group(order by (invoice_sent_at::date - operationally_closed_at::date))::numeric,2) med,
  count(*) filter (where (invoice_sent_at::date - operationally_closed_at::date) > 7) over7,
  min(invoice_sent_at::date - operationally_closed_at::date) as min_days, max(invoice_sent_at::date - operationally_closed_at::date) as max_days
from projects where operationally_closed_at is not null and invoice_sent_at is not null;
select p.project_id, c.company_name, p.final_event_date, p.operationally_closed_at::date,
  (current_date - p.final_event_date) days_since_event
from projects p join customers c on c.customer_id=p.customer_id
where p.operationally_closed_at is not null and p.invoice_sent_at is null order by days_since_event desc;

-- 20. מחזור/מקדם-בסיס
select count(*) as n_finished, round(sum(fm.revenue)::numeric,0) as total_rev
from projects p join lateral finance_project_money(p.project_id) fm on true where p.project_status='finished';
select count(*) as total_projects, count(*) filter (where project_status='finished') as n_finished,
  count(*) filter (where project_status='cancelled') as n_cancelled from projects;
```

</div>
