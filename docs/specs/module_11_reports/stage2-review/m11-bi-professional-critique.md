<div dir="rtl">

# ביקורת-BI מקצועית — מודול 11 · "מה איש BI אמיתי יעיר"

> **מה זה:** תשובה לשאלת ישי — *"האם הוא ברמה מקצועית כמקובל בעולם? שים לב לפרטים הקטנים,
> תחקור. מה איש BI אמיתי יחשוב ויעיר, ומה התיקונים הנדרשים?"*
> **מתי:** 06/09/2026 · **מי:** סוכן-ביקורת בהקשר-טרי.
> 🔴 **הקובץ הזה אינו רשאי לקבוע כלל-מוצר.** הוא **ממליץ**; ההכרעה של ישי, תמיד.
> ה-SSOT היחיד הוא `processes-approved.md`. כל מקום שבו ממצא **סותר הכרעה רשומה** מדווח
> ב-**§5 כסתירה**, עם שני הצדדים מצוטטים — לא כתיקון.
>
> **מה נקרא במלואו לפני הכתיבה:** `processes-approved.md` (📑 · 🏷️ · 📊 · 🔒 · §🗳️ 1–20 ·
> ת1–ת8 · 1-ג2 · הלדג'ר) · `design-contract.md` (§① · §② · §③ · §⑤ · §⑥.1) ·
> `data-set.md` (§0 · מ7–מ13) · `stage2-review/m11-charts-rtl-a11y.md` (דרך ההעתק המלא ב-§5.2
> של חוזה-העיצוב) · `world-sources.md` · והמוקאפ
> `docs/mockups/management-report-screen/drafts/03_tab_finance.html` (1,264 שורות, נקרא בקוד).
>
> **כל מדידה בקובץ רצה היום על הקבצים עצמם** (`grep`/`wc`), ומצוינת ככזו. מה שלא נמדד — כתוב
> "לא נבדק".
>
> **מקרא-חומרה:** 🔴 **חובה** = איש-BI יסמן את זה כטעות, ובכנס זו שאלה שאין עליה תשובה טובה ·
> 🟠 **כדאי** = פער מול המקובל, אפשר לחיות איתו אם מודעים · ⚪ **טעם** = העדפה, לא תקן.

---

## 0 · השורה התחתונה, לפני הפירוט

**האפיון של מודול 11 גבוה מהממוצע שאיש-BI פוגש בשטח**, ולא בגלל כמות הדוחות: הוא נושא שלושה
דברים שרוב הדשבורדים הארגוניים לא נושאים — **שאלה עסקית אחת לכל דף** (🏷️), **שורת-מסקנה
מחושבת** ("אז מה"), ו**מילון-נעול** שמונע שני שמות לאותו דבר. אלה בדיוק שלושת הדברים
ש-IBCS ו-Stephen Few מבקשים ורוב הכלים לא עושים.

**ושלוש חולשות חוזרות כמעט בכל דף:**

| # | החולשה | היכן היא חוזרת |
|---|---|---|
| **א** | **מספר בלי מכנה ובלי חלון-זמן על-הפנים** — "0.1% מהמחזור" · "נתח 5 הגדולים" · "35 ימים" · "9.9% פער". הקורא לא יכול לדעת מתוך מה, ומאיזו תקופה | דוחות 4 · 6 · 8 · 11 · 14 · 17 · מבטי-על |
| **ב** | **אוכלוסייה לא-מוצהרת על המסך** — R11 מול `finished`-בלבד, `completed`-בלבד, ≥3 משמרות, ≥3 חשבוניות. כל דוח מחריג משהו, ואף מסך לא אומר מה | דוחות 1 · 5 · 13 · 14א · 17 · 18 |
| **ג** | **החלטת-מיון וחלוקה-לדליים שלא הוכרזה** — מיון לפי % על מכנה זעיר, sku לא-ממוין, דליים לא-שווים | דוחות 2 · 5 · 11 · 15 · 18 |

**וממצא-על אחד על המוקאפ שנחת:** הוא **מיישם את הכרעה 4 באפס אחוז מהאריחים**. נמדד היום על
הקובץ: **32 אריחים · 32 מהם נושאים "אין ערך תקופה-קודמת" · 0 חצי-השוואה**
(`grep -c 'class="tile"'` = 32 · `grep -c 'אין ערך תקופה-קודמת'` = 32 · `grep -c 'class="arrow"'` = 0).
הכרעה 4 קובעת *"השוואה לתקופה קודמת **בכל אריח**"*, והכרעה 15-ב מפרטת את הצורה
(▲/▼ לא-צבוע + הערך הקודם). זה הפער הגדול ביותר בין האפיון למוקאפ, והוא בדיוק מה שאיש-BI
רואה ראשון.

---

## 1 · התקן — 28 בדיקות שמבקר מקצועי מריץ על דף-דוח

> כל שורה: **הבדיקה · למה (משפט) · המקור שנשלף בפועל · המצב אצלנו**.
> מקור שלא נשלף — מסומן `מהידע שלי, לא אומת`.

| # | הבדיקה | למה | מקור (נשלף 06/09/2026) | אצלנו |
|---|---|---|---|---|
| **ב1** | הכותרת נוקבת ב**מדד** וב**תקופה**, לא רק בנושא | כותרת שהיא רק נושא מכריחה את הקורא לנחש מה הוא רואה | [Statistics Canada — Data Visualization: Best Practices](https://www150.statcan.gc.ca/n1/pub/89-26-0005/892600052022001-eng.htm) *("descriptive… include variables and time periods covered")* · [Tableau — Visual Best Practices](https://help.tableau.com/current/blueprint/en-us/bp_visual_best_practices.htm) | ◐ הכותרת = שם קצר + שאלה; **התקופה אינה בכותרת** |
| **ב2** | לכל מספר **בסיס-השוואה מפורש** (תקופה קודמת · חציון · יעד) | מספר בודד אינו ניתן לשיפוט; זה הפיטפול מס' 2 של Few | [Few — Common Pitfalls in Dashboard Design](https://www.perceptualedge.com/articles/Whitepapers/Common_Pitfalls.pdf) *("Provide the context that people need to interpret the data correctly")* | 🔴 מוגדר בהכרעה 4, **0/32 במוקאפ** |
| **ב3** | יש **משפט-מסקנה** ("אז מה") — מסיק, לא מתאר | מבחן ה-"so what": כותרת שמסכמת ממצא מעבירה את המסר לפני הדיון | [Urban Institute Data Visualization Style Guide](https://urbaninstitute.github.io/graphics-styleguide/) *(דוגמה: "The Labor Force Participation Rate Has Declined…" במקום תיאור)* · [IBCS — SAY / Message](https://en.wikipedia.org/wiki/International_Business_Communication_Standards) | ✅ מיושם בכל 21 המשטחים |
| **ב4** | **האוכלוסייה מוצהרת על המסך** — מי נכלל ומי הוצא | דוח שמחריג בשקט מדבר על עולם אחר מזה שהקורא מדמיין | [Urban Institute](https://urbaninstitute.github.io/graphics-styleguide/) *("Notes can include technical information about methodology")* | 🔴 מוגדר ב-R11/ח8-8, **לא מופיע באף מסך** |
| **ב5** | **יחידת-המידה נאמרת פעם אחת**, במקום קבוע | חזרה על ₪ בכל תא היא רעש; היעדר מוחלט הוא עמימות | [Urban Institute](https://urbaninstitute.github.io/graphics-styleguide/) *("The unit of measurement should be mentioned only once, either in the subtitle or the y-axis label")* | ✅ הכרעה 15-ח נועלת ₪-אחרי-המספר |
| **ב6** | **דיוק אחיד**, ומעוגל לרמת-ההחלטה | "75,769.90" ו-"75,770" על אותו מדד בשני דפים = שני מספרים בעיני הקורא | [Microsoft Learn — Tips for Designing a Great Power BI Dashboard](https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips) *("Don't exceed three or four numerals… Don't mix levels of precision and time")* · Few, pitfall 3 | 🔴 נמדד: `75,769.90` בדף-1 מול `75,770` בדף-3 |
| **ב7** | **אין ערבוב סדרי-גודל** על ציר אחד | סדרה של אלפים לצד סדרה של מאות הופכת את הקטנה לקו-אפס | [Power BI](https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips) *("Avoid mixing large and small measures on the same scale")* | 🔴 דוח 11: `01WEB`=118 לצד `B-SAT-LAN`=58,490 |
| **ב8** | **ציר-ערך של עמודות מתחיל באפס**; קטיעה = לא-לעשות | קטיעה מנפחת את גודל-האפקט הנתפס — **וסימון-קטיעה אינו מנטרל זאת** | [Correll, Bertini, Franconeri — *Truncating the Y-Axis: Threat or Menace?* (arXiv 1907.02035 · CHI 2020)](https://arxiv.org/abs/1907.02035) · [StatCan](https://www150.statcan.gc.ca/n1/pub/89-26-0005/892600052022001-eng.htm) *("axis should start at zero and not be broken")* | 🔴 דוח 5 במוקאפ: ציר נחתך ב-40%, ופרויקט 12 (300%) מצויר באורך של 40% |
| **ב9** | **ערכי-הסימון (ticks) עגולים** | "46,400 / 23,200" נגזר מהמקסימום ומקשה קריאה מהירה | [StatCan](https://www150.statcan.gc.ca/n1/pub/89-26-0005/892600052022001-eng.htm) *("The intervals should be regular, such as multiples of 10, 100, 1,000 or million")* | 🟠 נמדד בכל 7 הגרפים: 46,400 · 57,500 · 58,500 |
| **ב10** | **מיון עמודות קטגוריאליות לפי ערך**, אלא אם יש סדר טבעי | הסדר עצמו הוא מסר; א"ב או סדר-מסד אינם מסר | [storytelling with data — order in the sort](https://www.storytellingwithdata.com/blog/order-in-the-sort) · [Power BI](https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips) *("If you want to draw attention to the highest or lowest number, sort by the measure")* | 🔴 דוח 11: ה-sku ממוינים לפי **עלות**, בעוד הגרף מציג **כמות** |
| **ב11** | **סדר-הדליים הטבעי נשמר** ולא מוחלף במיון-ערך | מדרגי-גיול / חודשים / דירוג — סדר טבעי גובר | [storytelling with data](https://www.storytellingwithdata.com/blog/order-in-the-sort) *("natural order… an audience will likely find it challenging to consume a visual that depicts it otherwise")* | ✅ דוח 6 (שוטף→90+) ודוח 16 (חודשים) נכונים |
| **ב12** | **אריח / גרף / טבלה — לפי מה שעושים עם המספר** | טבלה לחיפוש-ערך-בודד; גרף לצורה ומגמה; אריח למספר-אחד-שמנטרים | [Few — Effective Chart Design](https://www.perceptualedge.com/images/Effective_Chart_Design.pdf) · [Power BI](https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips) *("card visualizations are a good way to display an important number prominently… Be sure to provide context")* | ✅ החלוקה 4-אריחים + גרף + טבלה תקנית |
| **ב13** | **תוויות-ישירות עדיפות על מקרא**; ואין פריט-מקרא ריק | פריט-מקרא לקטגוריה שאין לה אף סימן הוא רעש | [Urban Institute](https://urbaninstitute.github.io/graphics-styleguide/) *("When possible, directly label the data in the chart and omit the legend")* | 🟠 דוח 5 במוקאפ: פריט-מקרא "בתוך הסף — אין כזה בשמונה המוצגים" |
| **ב14** | **קווי-רשת דקים ומעטים**, ואין קישוט | קו-רשת שמתחרה בנתון גונב תשומת-לב | [StatCan](https://www150.statcan.gc.ca/n1/pub/89-26-0005/892600052022001-eng.htm) *("thin, light and placed behind the elements presenting the data")* · Few, pitfall 11 | ✅ 2 קווי-רשת ב-`--s100`, אפס גרדיאנטים |
| **ב15** | **צבע לעולם לא לבדו** | עד ~4.5% מהקוראים לא יפרידו בין הגוונים | [WCAG 2.2 SC 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) *("Color is not used as the only visual means of conveying information")* | ✅ מיושם: ▲ · ✓ · דפוס-מילוי (hatch) |
| **ב16** | **סמנטיקת-צבע קבועה** בכל הדוחות | צבע שמשמעותו משתנה בין דפים הורס אמון | [Tableau](https://help.tableau.com/current/blueprint/en-us/bp_visual_best_practices.htm) *("avoid having one color mean multiple things")* | 🟠 `slate-400` = "תקופה קודמת" · "לא-נבחר" · "הגיע בפועל" — שלוש משמעויות |
| **ב17** | **עמודות מוערמות רק לסך**; להשוואת-רכיב — מקובצות | רק המקטע התחתון יושב על בסיס משותף | [Atlassian — Stacked Bar Chart: A Complete Guide](https://www.atlassian.com/data/charts/stacked-bar-chart-complete-guide) *("only the bottom segment shares a common baseline")* | 🟠 דוח 16 מוערם, והשאלה כוללת "כמה נסיעות" |
| **ב18** | **מצב-ריק מבחין** בין "אין נתונים" ל"המסנן לא החזיר" | קורא שרואה מסך ריק לא יודע אם נשבר או ריק | [NN/g — Designing Empty States in Complex Applications](https://www.nngroup.com/articles/empty-state-interface-design/) *("There are no records to display for the selected date range")* | ✅ מוגדר מצוין בת1 (חמישה מצבים) — **לא מצויר במוקאפ** |
| **ב19** | **אפס אמיתי מוסבר**, לא מוצג עירום | "0 ₪" נקרא ככשל-נתונים | [NN/g](https://www.nngroup.com/articles/empty-state-interface-design/) *(Guideline 1: communicate system status)* | ✅ במוקאפ יש הסבר לשני האפסים של ספטמבר |
| **ב20** | **מצב-הסינון הפעיל גלוי** על הדף עצמו | בלי זה, צילום-מסך שיוצא מהמערכת חסר-הקשר | [Microsoft Learn — Format filters in Power BI reports](https://learn.microsoft.com/en-us/power-bi/create-reports/power-bi-report-filter) | ✅ שורת-שבבים + צ'יפ "× נקה בחירה" |
| **ב21** | **אריח שאינו מגיב לסינון מסומן ככזה** | אחרת הקורא מייחס את המספר לבחירה שעשה | `מהידע שלי, לא אומת` (נגזר מ-ב20 ומעקרון UNIFY של IBCS) | 🟠 דוח 6 במוקאפ: 2 מ-4 האריחים זהים בשני המצבים |
| **ב22** | **הגדרת-מדד בהערת-שוליים**, ליד המספר | "ימים לתשלום" · "סטייה" · "מתרחק" — כל אחד יכול להיות שלושה דברים | [Urban Institute](https://urbaninstitute.github.io/graphics-styleguide/) *("define all acronyms")* · [CFPB Design System — Data visualization guidelines](https://cfpb.github.io/design-system/guidelines/data-visualization-guidelines) *("Notes about caveats or data inconsistencies")* | 🟠 קיימת שורת-מקורות; **אין שורת-הגדרות** |
| **ב23** | **עדכניות-הדאטה מוצהרת** | "data as of" הוא ההרגל שבונה אמון בדוח | [Metaplane — What is data freshness](https://www.metaplane.dev/blog/data-freshness-definition-examples) · [Basedash — Data freshness for BI](https://www.basedash.com/blog/data-freshness-how-current-your-dashboard-data-really-is) | ⚠️ **סתירה מול הכרעה רשומה — §5-א** |
| **ב24** | **לא מציגים שיעור על מכנה זעיר** | "100% איחורים" על 2 משמרות אינו מידע | [Washington State DOH — Standards for Reporting Data with Small Numbers](https://doh.wa.gov/sites/default/files/legacy/Documents/1500/SmallNumbers.pdf) | ◐ קיים `מינימום_תשובות_להצגת_ציון`=3 — **מוחל רק בחלק מהדוחות** |
| **ב25** | **חריג לא מכתיב את הסקאלה ולא את המיון** | ערך-קצה אחד הופך את שאר הגרף לקו-שטוח | [Correll et al.](https://arxiv.org/abs/1907.02035) · [Power BI](https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips) | 🔴 דוח 5: פרויקט של 500 ₪ עומד ראשון עם 300% |
| **ב26** | **טולטיפ מוסיף מידע, ונגיש** | טולטיפ שרק חוזר על התווית מבזבז; טולטיפ מותאם חייב שלושה תנאים | [WCAG 2.2 SC 1.4.13 Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) *(dismissable · hoverable · persistent — עם פטור מפורש ל-`title` של הדפדפן)* · [Tableau](https://help.tableau.com/current/blueprint/en-us/bp_visual_best_practices.htm) | 🟠 במוקאפ 5 טולטיפים בלבד, כולם `title=` (פטורים מ-1.4.13, אך לא נגישים במקלדת) |
| **ב27** | **אותו מדד = אותו מספר בכל דף** | שני מספרים לאותו שם הורסים אמון מהר מכול | [IBCS — UNIFY](https://en.wikipedia.org/wiki/International_Business_Communication_Standards) *("Apply consistent standards and notation across all reports and dashboards")* · [Power BI](https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips) *("Be consistent with chart scales on axes and chart dimension ordering")* | 🔴 יתרת-החוב מוצגת בשתי רמות-דיוק בשני דפים |
| **ב28** | **טבלת-נתונים נגישה** — `scope` בכל `th`, שינוי-מצב מוכרז | קורא-מסך אינו יודע איזו כותרת שייכת לאיזה תא בלעדיו | [WCAG Technique H63 — Using the scope attribute](https://www.w3.org/WAI/WCAG22/Techniques/html/H63) | 🔴 נמדד: **99 תגי `<th>` · 0 `scope`** · 0 `aria-live` |

**סה"כ 28 בדיקות ב-§1.**

---
