<div dir="rtl">

# מודול 11 — מקורות-עולם (world-sources)

> 🔴 **קובץ-מדידות בלבד: מקורות, בדיקות-התאמה ומחיר-יישום. שום כלל-מוצר אינו נקבע כאן** —
> ‏SSOT לכל כלל: `processes-approved.md`. כל ציטוט של הכרעה קיימת מסומן `🔗 מראת <שם-ההכרעה> —
> SSOT: processes-approved.md (לא לערוך כאן)` ומובא מילה-במילה מהקובץ ההוא — לא מנוסח מחדש.
>
> **מאורגן לפי ההכרעה שכל מקור תומך בה** (ישי מציג בכנס — "ככה מקובל" בלי מקור אינו תשובה שם).
> כל בלוק: הפרקטיקה במשפט · המקור (חיפוש שרץ בפועל, ר' "מה חיפשתי") · ארבע שאלות-ההתאמה
> (ערוץ · דאטה · תפקיד · נפח, `_shared/discipline.md`) · מחיר-היישום · המשפט הדו-חלקי.
> **קלט:** `research/review-2026-09-06.md` §ח3 (חמישה מקורות שנאספו 06/09, כאן מאומתים-שוב
> ב-WebFetch) ו-§ח7 (עוגן RFM/מחזור-אישי) · `processes-approved.md` §🗳️ הכרעות 1–9, כרטיסי ת1–ת8,
> טבלת ⑥ (17 הגדרות-הדוחות) · `.claude/skills/_shared/discipline.md` ("Adopting a world
> practice").

---

## א · פרקטיקות מאומצות — לפי ההכרעה שהן תומכות בה

### 1 · עמוד-לדוח + cross-filter + drill-through — הכרעה 4 · ת1

**הפרקטיקה:** דף אחד = דוח אחד, 3–4 מדדים, לחיצה על עמודה-בגרף מסננת את הטבלה ואת שאר האריחים
באותו דף (cross-filter), ולחיצה על שורה פותחת את כרטיס-הישות (drill-through).
**המקור (אומת-שוב ב-WebFetch, 06/09/2026):** [ZoomCharts — Power BI 2026 structural shifts](https://zoomcharts.com/en/microsoft-power-bi-custom-visuals/blog/power-bi-2026-10-structural-shifts-every-bi-team-needs-to-act-on-now) — "click-to-explore… the user starts with an overview, clicks to filter, drills into relevant detail" · [RedEagle — Power BI dashboard design](https://redeagle.tech/blog/power-bi-dashboard-design) — cross-filter ו-drill-through שניהם מתועדים כדפוס-ליבה · [Google Cloud — Looker ב-Gartner MQ 2026](https://cloud.google.com/blog/products/business-intelligence/looker-in-2026-gartner-analytics-and-bi-platforms-mq) · [Concord — Gartner 2026 MQ takeaways](https://www.concordusa.com/blog/what-gartners-2026-magic-quadrant-for-abi-tells-us-about-the-tools-we-work-in-every-day) · [Datatako — Power BI dashboards](https://datatako.com/power-bi/power-bi-dashboards).
**ארבע-שאלות-ההתאמה:**
- **ערוץ:** אין ערוץ חסר — cross-filter הוא state בדפדפן; הדוחות נפתחים מהמחשב במשרד בלבד (מסלול-מובייל/טאבלט נשלל כ"לא-קורה", ר' §ב להלן).
- **דאטה:** כל דף-דוח הוא כבר RPC מגודר שמחזיר את השורות (ת1) — אין דרישת-דאטה חדשה בשביל האינטראקטיביות עצמה.
- **תפקיד:** ללא תפקיד חדש — מנכ"ל/כספים/PM/לקוחות לפי המטריצה הקיימת (הכרעה 2).
- **נפח:** 827 פרויקטים / 61 לקוחות — קטן מאוד לעולם-ה-BI שהמקורות מתארים, אבל `onClick` על Recharts (מותקנת) הוא תוספת-state זולה שאינה תלוית-נפח; ההצדקה כאן היא נוחות-ניווט, לא ביצועים בכמות גדולה.
**מחיר-היישום:** אין שינוי DB. מצב-המסך (לשונית · דף · מסננים · בחירה-בגרף) נשמר בכתובת-הדף, לא במסד; שכבת ה-`onClick` על גרפי-Recharts הקיימים.
🔗 **מראת ת1 — SSOT: processes-approved.md (לא לערוך כאן):** *"עוגן-עולם: דף-לדוח · 3–4 מדדים · cross-filter · drill-through — זהה למקובל (Power BI / Tableau / Looker; מקורות: סקירה §ח3 → world-sources.md). סטייה מכוונת: אין שאלה-חופשית (הכרעה 1) ואין הפצה מתוזמנת (§7.57)."*
**זו המוסכמה, והיא מתאימה כאן כי** יש כבר תקדים-בית (מסך-הכספים, "לאיזה פרויקט לפנות עכשיו") ולוח-הזמן קצר — cross-filter הוא תוספת-state זולה על RPC שכבר תוכנן, לא תשתית חדשה.

### 2 · סיווג-LLM לטקסונומיה סגורה + בדיקת-מדגם אנושית — ת2

**הפרקטיקה:** מודל-שפה מסווג טקסט-חופשי (הערות-לקוחות) לקטגוריות **קבועות מראש**, ואדם בודק מדגם
לפני שהתוצאה מוצגת.
**המקור:** [Chattermill — Why text analytics keeps misclassifying feedback](https://chattermill.com/blog/why-your-text-analytics-platform-keeps-misclassifying-customer-feedback) · [Chattermill — How to use LLMs to analyse feedback at scale](https://chattermill.com/blog/how-to-use-llms-to-analyse-customer-feedback-at-scale) — "provide LLMs with complete taxonomic frameworks… evaluate their ability to map textual inputs into this fixed taxonomy" · [Latitude.so — Human feedback in LLM validation workflows](https://latitude.so/blog/human-feedback-llm-validation-workflows) — סט-אימות מתויג-אנושית כבנצ'מרק · [arXiv 2606.26595 — LLM+human-in-the-loop לניתוח משוב-שירות](https://arxiv.org/abs/2606.26595) (אומת ב-WebFetch: משלב "fine-tuned, quantized LLMs with expert oversight").
**ארבע-שאלות-ההתאמה:**
- **ערוץ:** תהליך-אצווה פנימי, לא ערוך ללקוח/דיילת — אין ערוץ חסר.
- **דאטה:** הטקסונומיה **כבר קיימת** כ-CHECK במסד (`negative_feedback_reasons`/`positive_feedback_reasons`, D14) — לא דאטה שאיש לא אוסף.
- **תפקיד:** מריץ+מאשר = `edit` על 'דו"חות' (מנכ"ל · כספים-ולקוחות) — בתוך המטריצה הקיימת, בלי תפקיד חדש.
- **נפח:** 415 הערות (אחרי הזריעה-מחדש) — קטן ביחס לפריסות-Chattermill (אלפי הערות ביום); באצווה חד-פעמית זה בדיוק הנפח שהאצווה נבנתה לשרת, לא זרם-חי.
**מחיר-היישום:** פונקציית-שרת `classify-feedback` + שתי טבלאות חדשות (`feedback_ai_runs` · `feedback_ai_insights`) + policies + מפתח-Gemini ב-Supabase Secrets — ~1–1.5 ימים (מתועד ב-ח4/ת2).
🔗 **מראת ת2 — SSOT: processes-approved.md (לא לערוך כאן):** *"עוגן-עולם: טקסונומיה קבועה של מומחה + בדיקת-מדגם אנושית — זהה למקובל (Chattermill · arXiv 2606.26595 · Kili — → world-sources.md). סטייה מכוונת: הטקסונומיה אינה מתעדכנת מהמודל — היא ה-CHECK במסד, השפה שהלקוחות בוחרים ממנה; אחרת אין השוואת אדם↔מודל."*
**זו המוסכמה בחלקה — ובחרנו לסטות בכוונה:** הספרות (Chattermill, ובמיוחד arXiv 2606.26595 — ר' "שאלות שעלו" למטה) ממליצה גם על **גילוי-נושאים-פתוח**; אנחנו נועלים לטקסונומיה הקיימת כדי שהתוצאה תהיה ניתנת-להשוואה מול תגית-הלקוח (המספר-המחושב-ביד לשער-הקבלה), לא כדי לגלות קטגוריות חדשות.

### 3 · מדרגי-גיול 30/60/90 ו"ימים-לתשלום" מול DSO — דוח 6

**הפרקטיקה:** חלוקת חשבוניות-פתוחות למדרגי-פיגור סטנדרטיים; ומדד-נפרד ל"כמה זמן לוקח באמת לגבות"
מחושב מהיסטוריית-תשלומים בפועל, לא מנוסחת-DSO הקלאסית.
**המקור:** [Tabs.com — AR Aging Guide](https://www.tabs.com/blog/ar-aging-guide) — "0–30, 31–60, 61–90, 90+ day buckets" כתקן · [CreditPulse — AR Aging Report Guide](https://www.creditpulse.com/blog/ar-aging-report-guide) · [Ledgerup — AR Aging Guide](https://www.ledgerup.ai/resources/accounts-receivable-aging-report-guide) — נוסחת-DSO הפורמלית `(AR / Annual Credit Sales) × 365` ותקן "מתחת ל-45 יום" · [InvoiceButler — AR & AP Aging Report Guide](https://www.invoicebutler.com/blog/aging-report-guide-accounts-receivable-payable).
**ארבע-שאלות-ההתאמה:**
- **ערוץ:** דוח פנימי בלבד.
- **דאטה:** `invoice_sent_at` · `payment_date` · `written_off` קיימים ומאוכלסים; כבר אושש במקביל ב-`module_08_finance/world-sources.md` ("דוח 6 מדרגי-גיול ודוח 2 מדרגי-הנחה — מוסכמות-עולם עם מקורות, ומאוכלסות בנתונים").
- **תפקיד:** כספים/מנכ"ל.
- **נפח:** 61 לקוחות, עשרות חשבוניות פתוחות — קטן, אבל המדרגים הם טבלת-סף קבועה שלא תלויה בנפח.
**מחיר-היישום:** אין — שדה מחושב בתוך ה-RPC של דוח 6 בלבד.
🔗 **מראת הגדרת-דוח 6 — SSOT: processes-approved.md (לא לערוך כאן):** *"חשבוניות פתוחות… מדרגים לפי `deriveDaysOverdue` מול `תנאי_תשלום_ימים`: שוטף · 1–30 · 31–60 · 61–90 · 90+ · Σ ₪ · הישנה ביותר · **'ימים לתשלום (חציון)'** על ששולמו (לא DSO) · חובות-אבודים כמונה נפרד."*
**זו המוסכמה, ומתאימה כאן ללא סטייה במדרגים עצמם (30/60/90) — אבל סטינו בכוונה מנוסחת-ה-DSO הפורמלית** (יחס שנתי) לטובת חציון-ימים-לתשלום על חשבוניות ששולמו בפועל: ל-61 לקוחות אין "מכירות-אשראי שנתיות" יציבות מספיק כדי שיחס אחד ישקף התנהגות, וחציון פר-חשבונית ששולמה הוא המדד שבאמת ענה על "מי לגבות השבוע" (ר' גם רשימת-הדחייה ב-§ב).

### 4 · תאריך-פירעון-צפוי מהיסטוריית-התשלום של הלקוח עצמו — דוח 7 · מ24

**הפרקטיקה:** לכל חשבונית פתוחה, מחשבים תאריך-תשלום **צפוי** = תאריך-חוזי + חציון-האיחור ההיסטורי
**של אותו לקוח**, לא ממוצע-כללי.
**המקור:** [Invoiced — Predictive Analytics in Accounts Receivable](https://www.invoiced.com/resources/blog/predictive-analytics-accounts) · [Emagia — Improve AR Forecasting Accuracy](https://www.emagia.com/resources/glossary/how-to-increase-accounts-receivable-forecasting-accuracy/) — "segmenting customers by payment patterns… improves forecasting precision by aligning predictions with real customer behavior" · [arXiv 2008.07363 — Predicting Account Receivables with ML](https://arxiv.org/html/2008.07363v1) — פיצ'רים: "average delay times… monetary aggregations of past payment behavior" · [Microsoft Learn — Customer payment insights, Dynamics 365](https://learn.microsoft.com/en-us/dynamics365/finance/accounts-receivable/payment-insights-overview).
**ארבע-שאלות-ההתאמה:**
- **ערוץ:** פנימי — דוח 7 + עמודה במסך-הכספים הקיים (מ8).
- **דאטה:** `invoice_sent_at` · `payment_date` · `תנאי_תשלום_ימים` (פרמטר גלובלי) קיימים; רק סף "≥3 חשבוניות ששולמו" נדרש להגדרה.
- **תפקיד:** כספים.
- **נפח:** 61 לקוחות, לרובם מעטות חשבוניות — קטן מדי לאימון מודל (המקורות מזכירים Random Forest / Gradient Boosting / LGBM על אלפי-רשומות).
**מחיר-היישום:** פונקציית-שרת אחת המשרתת גם את דוח 7 וגם את עמודת-מ24 (מקור-חישוב יחיד, לפי הכרעת-ת7) — אין ספריית-ML חדשה.
🔗 **מראת ת7 (מ24) — SSOT: processes-approved.md (לא לערוך כאן):** *"תאריך צפוי = חוזי + חציון-האיחור של אותו לקוח (≥3 חשבוניות ששולמו; אחרת חציון-הסגמנט; אחרת חציון-החברה)… מקור אחד לחישוב — אותה פונקציית-שרת שמזינה את דוח 7 (תזרים), כדי שהמספר במסך-הכספים ובדוח יהיה זהה."*
**זו המוסכמה (תחזית מהתנהגות-תשלום היסטורית), ובחרנו לסטות מהמורכבות שהמקורות ממליצים עליה** (מודלי-ML מאומנים) **כי** הנפח (61 לקוחות, מיעוטם עם ≥3 תשלומים) קטן מדי לאימון-מודל אמין — חציון-פר-לקוח משיג את אותה תובנה בעלות-תחזוקה אפסית ובלי סיכון-התאמת-יתר (overfitting) על מדגם זעיר.

### 5 · ג'יני + לורנץ לריכוזיות-עומס — דוח 14א

**הפרקטיקה:** מדד אי-שוויון מכלכלה (מקדם-ג'יני, עקומת-לורנץ) מיובא למדוד ריכוזיות-שיבוצים בין דיילות.
**המקור:** [Our World in Data — What is the Gini coefficient?](https://ourworldindata.org/what-is-the-gini-coefficient) · [Doing Economics — Lorenz curves and Gini coefficients](https://books.core-econ.org/doing-economics/book/text/05-01.html) · [BEA — Measuring Income Inequality: A Primer on the Gini Coefficient](https://apps.bea.gov/scb/issues/2025/08-august/0825-gini-primer.htm) · [PMC — A data science based standardized Gini index](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5552103/) — "the Gini index can be viewed as a measure of the level of fairness of a resource distribution among a group of entities" (כלומר המדד עצמו כבר משמש מעבר-לכלכלה, למדידת-הוגנות-חלוקה כללית).
**ארבע-שאלות-ההתאמה:**
- **ערוץ:** פנימי, ללא תלות-ערוץ.
- **דאטה:** שיבוצים (`assignments`) קיימים כמעט-במלואם; נמדד חי G=0.526.
- **תפקיד:** מנכ"ל/גיוס.
- **נפח:** ~50 דיילות פעילות — קטן-מאוד ביחס לספרות (מדינות, אוכלוסיות-עובדים-אלפים) — **זו בדיוק הסיבה שהמדרגים המוכנים (0.25/0.4/0.5, שאולים מכלכלת-מדינות ומחקר-אחיות) נדחו** (ר' §ה בסקירה: "אינם על עסק כזה").
**מחיר-היישום:** מחושב מתוך `assignments` הקיימות בתוך ה-RPC של דוח 14א; אין שינוי-סכמה.
🔗 **מראת הגדרת-דוח 14א — SSOT: processes-approved.md (לא לערוך כאן):** *"**ג'יני** על דיילות עם ≥1 משמרת מאושרת בחלון (§ח8 #1) + **לורנץ** + חץ מול 12 החודשים הקודמים."*
**זו המוסכמה — המדד עצמו (ג'יני+לורנץ) מקובל ומתאים כאן — ובחרנו לסטות מהמדרגים-התפעוליים המוכנים** (T238, נדחו) **כי** הם שאולים מסדר-גודל שונה לגמרי (מדינות, אלפי-עובדים); המספר-הגולמי + מגמה מול 12 חודשים קודמים נותן השוואה-פנימית בלי לייבא סף שלא נבדק על עסק בגודל הזה.

### 6 · נטישה נמדדת מול הקצב-האישי של הלקוח (RFM מותאם) — דוח 18

**הפרקטיקה:** במקום סף-ימים גורף לכל הלקוחות, "נטישה" נגזרת מהמרווח-החציוני **של אותו לקוח עצמו**
בין אירועים.
**המקור:** [Nature Scientific Reports — Hybrid deep learning for churn prediction using RFM](https://www.nature.com/articles/s41598-026-53220-0) — RFM עם "inter-purchase time, transaction variance, and purchase regularity" · [ResearchGate — Churn Prediction Using RFM + XGBoost](https://www.researchgate.net/publication/388636624_Customer_Churn_Prediction_Using_the_RFM_Approach_and_Extreme_Gradient_Boosting_for_Company_Strategy_Recommendation) · [LinkedIn — Customer Churn Analysis is Oversimplified and Wrong](https://www.linkedin.com/pulse/customer-churn-analysis-oversimplified-wrong-ian-pollard) — "customers' purchase intervals are much harder to influence if you treat them all the same… incorporating individual purchase cadence patterns… provide more effective churn prediction."
**ארבע-שאלות-ההתאמה:**
- **ערוץ:** פנימי — מסך-לקוחות.
- **דאטה:** תאריכי-פרויקטים פר-לקוח + `מכפיל_מרווח_מתרחק`=1.5 (פרמטר מתוכנן, §ח7) — קיימים/מתוכננים.
- **תפקיד:** כספים-ולקוחות/מנכ"ל.
- **נפח:** 61 לקוחות — קטן-מאוד ביחס למחקרי-ה-RFM המצוטטים (עשרות-אלפי לקוחות, embedding clustering) — לא מספיק לאימון מודל.
**מחיר-היישום:** אין — נשען על השדה/פרמטר שכבר מתוכננים ב-§ח7; רק פונקציית-חישוב בתוך ה-RPC של דוחות 18/19.
🔗 **מראת הגדרת-דוח 18 — SSOT: processes-approved.md (לא לערוך כאן):** *"'מתרחק' (§ח7): אין אירוע עתידי **וגם** ימים-מאז-אחרון > `מכפיל_מרווח_מתרחק`×חציון-המרווח-האישי (≥3 אירועים; אחרת 'רדום' 120) — ארבע עובדות: אירוע אחרון · הקצב · כמה מעבר · ציון אחרון מול ממוצעו… ✂️ ציון 0–100."*
**זו המוסכמה (RFM מותאם-אישית למחזור-הלקוח, לא סף-גורף) — ובחרנו לסטות מציון-משוקלל 0–100** שרוב המקורות בונים (למשל `ChurnScore` המקורי בטיוטה, T221, נדחה) **כי** אין דאטה לכייל משקלים על 61 לקוחות; דגל בוליאני עם ארבע עובדות ניתנות-לבדיקה משיג את אותה תובנה בלי מספר-שמתחזה למדעי.

### 7 · כותרת-דוח = שאלה אחת, לא מונח-BI — §ח8 #9

**הפרקטיקה:** כותרת כל דוח היא השאלה העסקית שהוא עונה עליה ("את מי לגבות השבוע?"), לא תווית-נתונים
("גיול-חובות") ולא מונח-כלי ("מרכז דוחות ואנליטיקה").
**המקור:** [aufaitux — Power BI Dashboard Design 2026](https://www.aufaitux.com/blog/power-bi-dashboard-design-best-practices/) — "'Revenue chart' doesn't share much information, while 'Revenue 12% below target' tells users exactly what they're looking for… each dashboard page should answer one primary business question" · [rib-software — 25 Dashboard Design Principles](https://www.rib-software.com/en/blogs/bi-dashboard-design-principles-best-practices) · [Catchr — Power BI Dashboard Design Best Practices](https://www.catchr.io/university/power-bi-lessons/power-bi-dashboard-design-best-practices).
**ארבע-שאלות-ההתאמה:** כולן טריוויאליות — זו החלטת-ניסוח, לא תלוית ערוץ/דאטה/תפקיד/נפח.
**מחיר-היישום:** אין — ניסוח בלבד, כבר מיושם בטבלת ⑥ (עמודה "הכותרת (השאלה)" לכל אחד מ-17 הדוחות).
🔗 **מראת הלדג'ר — SSOT: processes-approved.md (לא לערוך כאן):** T250 *"§ח8 row 9 — הכותרת צריכה להיות השאלה, לא מונח-BI"* — ההכרעה בפועל: כותרת "מרכז דוחות ואנליטיקה" (T250) נדחתה-מנומק לצד "תובנות-השבוע" (הכרעה 1).
**זו המוסכמה, ומתאימה כאן ללא סטייה.**

### 8 · אריחי-השוואה לתקופה-קודמת (period-over-period) — הכרעה 4

**הפרקטיקה:** כל אריח-KPI מציג ערך + Δ מול התקופה המקבילה (חודש/שנה קודמים), לא רק מספר יבש.
**המקור:** [Sigma — Build a KPI chart](https://help.sigmacomputing.com/docs/build-a-kpi-chart) — "Every card should follow the same flow: Label → Value → Delta → Time frame" · [epcgroup — Power BI KPI Visuals & Dashboard Cards 2026](https://www.epcgroup.net/power-bi-kpi-visuals-dashboard-guide-2026) · [Anatomy of the KPI Card](https://nastengraph.substack.com/p/anatomy-of-the-kpi-card) — "the delta… is often more important than the absolute value… design the change indicator as a first-class element."
**ארבע-שאלות-ההתאמה:** זהות ל-#1 (אותו הקשר-דוחות) — ללא ערוץ/דאטה/תפקיד/נפח חסרים; ה-RPC של כל דף כבר מחשב Σ לתקופה, אז Δ מול תקופה-מקבילה הוא אותה שאילתה פעמיים.
**מחיר-היישום:** אין — כל RPC-דף כבר מתוכנן להחזיר Δ מול אשתקד/תקופה-קודמת (ר' טבלת ⑥, כל שורה נושאת "מול אשתקד"/"מול…").
🔗 **מראת הכרעה 4 — SSOT: processes-approved.md (לא לערוך כאן):** *"רמת-האינטראקטיביות: 'כמו איש BI אמיתי' — רמה 1 חובה (cross-filter · drill-through · מסננים גלובליים · בועות) + השוואה לתקופה קודמת בכל אריח + שורת-'אז מה' מחושבת בכל דף."*
**זו המוסכמה, ומתאימה כאן ללא סטייה.**

### 9 · ייצוא-מה-שעל-המסך לאקסל (WYSIWYG export) — ת4

**הפרקטיקה:** כפתור-ייצוא מוריד בדיוק את מה שמוצג — אותן שורות, אותם מסננים — לא קובץ-גולמי נפרד.
**המקור:** [Flerlage Twins — Allow Users to Export Their Filtered Selections to Excel](https://www.flerlagetwins.com/2020/11/guest-blog-post-allow-users-to-export.html) — "only filtered data will be exported… check your filters every time" · [Apache Superset discussion — Export Filtered Dashboard Data with Applied Filters](https://github.com/apache/superset/discussions/29887) · [Tableau Exchange — Export to Excel](https://exchange.tableau.com/en-us/products/1130).
**ארבע-שאלות-ההתאמה:**
- **ערוץ:** הורדה מקומית מהדפדפן — קיים (`write-excel-file` כבר בשימוש במ8).
- **דאטה:** אותם נתונים שה-RPC כבר החזיר — בלי קריאה שנייה.
- **תפקיד:** כל מי שרואה את הדף (view/edit) — לא נדרש תפקיד חדש.
- **נפח:** קטן-מאוד (61 לקוחות/827 פרויקטים) — קובץ טריוויאלי, בלי בעיית-ביצועים.
**מחיר-היישום:** אין ספרייה חדשה; רק חיווט-כפתור על הנתונים שכבר בזיכרון.
🔗 **מראת ת4 — SSOT: processes-approved.md (לא לערוך כאן):** *"עוגן-עולם: ייצוא-הטבלה-כפי-שהיא הוא הסטנדרט בכל כלי-BI; סטייה: אין PDF/הדפסה (1-ב #3)."*
**זו המוסכמה, ומתאימה כאן ללא סטייה מהותית** (הסטייה היחידה — אין PDF — מפורטת ברשימת-הדחייה, §ב).

### 10 · בלי צביעה מול יעד — השוואה לחציון-החברה — הכרעה 6

**הפרקטיקה:** דוחות כספיים בעולם-ה-BI צובעים לרוב אדום/צהוב/ירוק **מול יעד קבוע**; כאן הצבע (במקום
שקיים בכלל) מבטא **מעל/מתחת לחציון-החברה באותה תקופה**, כי אין יעד-רווח-גולמי שהוכרע.
**המקור (מציג את המוסכמה הנפוצה, כדי שהסטייה תהיה גלויה):** [ColorPick — Color for Dashboards & Analytics](https://colorpick.app/blog/color-dashboard-analytics-design-guide) — "Diverging palettes use two hues meeting at a neutral midpoint, ideal for data that has a meaningful center (like profit/loss, above/below average)" — כלומר גם מקור-הרוב **מכיר** בהשוואה-לממוצע/חציון כפלטה תקנית-חלופית, לצד ה"traditional method [ש]uses conditional formatting with a red-yellow-green gradient… red for poor, yellow for average, green for success" **מול יעד** — שהיא עדיין הנפוצה יותר · [Phoenix Strategy Group — Best Color Palettes for Financial Dashboards](https://phoenixstrategy.group/blog/best-color-palettes-for-financial-dashboards).
**ארבע-שאלות-ההתאמה:**
- **ערוץ / תפקיד:** לא רלוונטיים לסטייה הזו.
- **דאטה:** זו בדיוק הסיבה לסטייה — **אין יעד-רווח-גולמי שהוכרע בשום מקום במערכת**; ה"59.2%" בטיוטה נמדד כממוצע, לא כיעד שמישהו קבע (§א5/§א6 בסקירה).
- **נפח:** לא-רלוונטי — הבעיה היא היעדר-נתון, לא כמות.
**מחיר-היישום:** שלילי — הכרעה 6 **חוסכת** עבודה: אין שורת-`params` ל"יעד", וההשוואה-לחציון נשענת על אותה אגרגציה שה-RPC כבר מחשב בשביל ה-Δ-לתקופה-קודמת (בלוק #8).
🔗 **מראת הכרעה 6 — SSOT: processes-approved.md (לא לערוך כאן):** *"אין פרמטר 'יעד-רווח-גולמי' ואין צביעה מול יעד. ההשוואה בדוחות היא ל**חציון-החברה** בתקופה ('מעל/מתחת לחציון ב-X'); יעד עתידי = שורת-`params` אחת במ9."*
**זו המוסכמה הנפוצה (אדום/ירוק מול יעד קבוע) — ובחרנו לסטות ממנה בכוונה, כי** אין בעסק הזה יעד שהוכרע כהכרעת-מוצר; לצבוע מול מספר שאיש לא קבע היה ממציא-יעד בדיעבד — בדיוק מה שהטיוטה טעתה לעשות עם ה-59.2%.

### 11 · החלקה בייסיאנית

> `🔗 מראת ת7 (תג-סיכון על reliabilityScore הקיים) + §ח8-3 — SSOT: processes-approved.md (לא לערוך כאן)` מרוסנת (m=3) — הכרעת-מ4 קיימת, לא מחקר חדש

**הפרקטיקה:** ציון-אמינות של דיילת עם מעט שיבוצים "נמשך" לכיוון ממוצע-החברה, במקום להיקבע מ-1–2
תצפיות בלבד (`(k + m·C) / (n + m)`).
**המקור:** לא נדרש מחקר-חוץ חדש — זו הכרעה קיימת שכבר עברה בייסיאני-מול-חלופות **במ4**, לא במ11.
**עוגן-פנימי:** `docs/PROJECT_MASTER_sec7.md §7.14` — *"קבוע-ריסון `m=3`… תיקון להמלצה קודמת של קלוד
שהייתה `m=5`: 5 הועבר מ-IMDb שיש לה אלפי הצבעות לפריט, בעוד שכאן דיילת טיפוסית תצבור 5–15 שיבוצים
בשנה ⇒ `m=5` היה מושך את כולן לממוצע-החברה ומשטח את הפיזור."* (אומת באותו-תור, 06/09/2026 —
הפריט קיים ומכיל בדיוק את ההנמקה).
**ארבע-שאלות-ההתאמה:** אין צורך — מ11 **צורך** `reliabilityScore` הקיים, לא בונה מודל שני. הכרעת-ח8
row 3 (T213) דחתה במפורש בניית `RiskScore` נפרד: *"מודל אמינות שני… הוכרע להשתמש ב-reliabilityScore
הקיים, לא במודל שני."*
**מחיר-היישום:** אפס — מ11 קורא את הפונקציה הקיימת (ת7, מ23); שום נוסחה לא נכתבת מחדש.
**זו המוסכמה, יובאה כבר במ4, ומ11 רק צורך אותה** — ייבוא-הפרקטיקה נעשה שם; החזרה עליה כאן הייתה
מייצרת בדיוק את "שני מחשבוני-אמינות במערכת" שהמודול נמנע ממנו במפורש בכספים (ר' §ח3: "אין שני
מחשבוני-רווח במערכת").

---

> ✏️ **תיקון 06/09 16:5X:** שורות שמצטטות `T221` · `T213` · `T238` כ"הכרעה" — שורות-הלדג'ר עצמן ⬜; ההכרעה שדחתה אותן היא **הכרעה 1 / כרטיס ת7 / §ח8-3** ב-`processes-approved.md`, וזה העוגן.

## ב · רשימת-הדחייה — ההוכחה שהופעל שיקול-דעת

> כל תא בעמודה "ההכרעה שדחתה" הוא מראה ל-`processes-approved.md` — **SSOT שם, לא לערוך כאן.**

| הפרקטיקה שנשקלה | למה היא מקובלת בעולם | ההכרעה שדחתה (מראה) |
|---|---|---|
| דיוור-מייל מתוזמן (תקציר-שבועי אוטומטי) | נפוץ ב-BI ארגוני (Power BI subscriptions, Looker scheduled delivery) | 🔗 1-ב #4: *"מייל-תקציר מתוזמן ✅ נדחה-מנומק — לא חוב, לא נרשם ב-§6… §7.57 כבר קובע: 'אם ירצו תזמון בעתיד — מנגנון אמיתי במ10'"* |
| שורת-שאלה-חופשית / text-to-SQL | "מרשים" לפי Gartner MQ 2026 (ר' בלוק #1, מקור Concord) | 🔗 §🗳️ הכרעה 1 + T253: *"בלי שורת-שאלה-חופשית (text-to-SQL)"* נאסר במפורש |
| נרטיב-AI ("תובנות השבוע" בניסוח-LLM חופשי) | Gartner MQ 2026 ממליץ על "AI agents that… narrate" | 🔗 §🗳️ הכרעה 1: *"'תובנות השבוע' אינו נבנה; במקומו שורת-'אז מה' מחושבת בכל דוח"* |
| ציון-נטישה משוקלל 0–100 (ChurnScore) | הנפוץ ברוב מודלי-ה-RFM המצוטטים בבלוק #6 | 🔗 הגדרת-דוח 18: *"✂️ ציון 0–100"* — הוחלף בדגל בוליאני + ארבע עובדות |
| DSO כ-KPI בכותרת | נוסחת-DSO הפורמלית מצוטטת בבלוק #3 | 🔗 הגדרת-דוח 6: *"'ימים לתשלום (חציון)' על ששולמו (**לא DSO**)"* |
| הדפסה / PDF | כלי-BI רבים תומכים ב-PDF-export לדירקטוריון | 🔗 1-ב #3: *"הדפסה / PDF של דוח ✅ נדחה-מנומק — אקסל מכסה את רו"ח; אין דירקטוריון; PDF-RTL = הסיכון הטכני שמ3 שילם עליו"* |
| פריסה למובייל/טאבלט | "רספונסיביות מלאה" מופיעה בטיוטה (T290) כדפוס-2026 | 🔗 מסלולים שנשללו: *"פתיחת דוח מטאבלט/טלפון בשטח… 'שניהם לא קורה'"* (ישי, 06/09/2026 09:4X) |
| מדרגי-ג'יני מוכנים (0.25/0.4/0.5) | מוסכמה בכלכלת-מדינות ובמחקר-סיעוד (ר' בלוק #5) | 🔗 T238: *"מדרגי ג'יני תפעוליים… נדחו"* |
| מסננים-שמורים / מועדפים | תכונת-סטנדרט בכל כלי-BI ארגוני | 🔗 1-ב #6: *"מסננים שמורים / מועדפים ✅ נדחה-מנומק — 5 משתמשות · 4 לשוניות · בורר-דוח — אין מה לשמור (מבחן-הנפח)"* |
| חותמת "עודכן לאחרונה" + כפתור-רענון | דפוס-סטנדרט בדשבורדים חיים | 🔗 1-ב #5 + T289: *"חותמת 'עודכן לאחרונה' + רענון ✅ נדחה-מנומק — הדאטה חי; חותמת מעל דוח-חי מטעה"* |
| חותמת צ'ק-אין / מודל-דייקנות אוטומטי (דוח 12) | נפוץ במערכות-נוכחות (ר' גם ת7 מ6-widget, T281) | 🔗 מסלולים שנשללו: *"צ'ק-אין / חותמת-הגעה של דיילת… מוכרע-החוצה כתהליך שאינו קיים, לא כדחייה"* |
| צביעה מול יעד קבוע (אדום/ירוק) | הנוסח ה"מסורתי" יותר, מוצג בבלוק #10 | 🔗 §🗳️ הכרעה 6: *"אין פרמטר 'יעד-רווח-גולמי' ואין צביעה מול יעד"* |

---

## ג · חיפשנו ולא מצאנו (פערים מוצהרים — לא מולאו בהמצאה)

מקרה-בוחן מפורסם של "מנוע-דוחות-BI לסוכנות-אירועים בגודל-50-עובדים" — כל התיעוד שנמצא הוא Enterprise
(Power BI/Looker/Tableau ללקוחות-אלפי-משתמשים) או אקדמי (RFM/Gini על מדגמים גדולים); אין מקור שדן
בסדר-הגודל הזה במפורש. מקור ישראלי/מקומי לתנאי-תשלום-עיריות מול תזרים-אירועים — לא נבדק (מחוץ
להיקף world-sources; זו שאלת-מציאות שכבר טופלה בסקירה עצמה, §א8). תקן מוצהר ל"כמה קטגוריות
בטקסונומיית-משוב-לקוחות זה בריא" מעבר להמלצת-Chattermill הכללית ("review quarterly") — לא נמצא
מספר-סף מוסכם.

---

## ד · מה חיפשתי (כל שורה = שאילתת-WebSearch שרצה בפועל, 06/09/2026)

- `LLM classify customer feedback into fixed predefined taxonomy human review sample validation 2026`
- `accounts receivable aging buckets 30 60 90 days DSO best practice definition`
- `predict expected payment date customer historical payment behavior accounts receivable`
- `Gini coefficient Lorenz curve workload distribution employees fairness measure`
- `RFM churn prediction based on customer's own average purchase interval individual cadence`
- `dashboard report title should be a question not a label BI design best practice`
- `KPI card design period over period comparison delta best practice dashboard`
- `export to Excel "what you see is what you get" dashboard filtered table export best practice`
- `dashboard color coding compare to median or peer average instead of fixed target red green`

**ו-WebFetch (אימות-מחדש/אימות-ראשוני של URL קונקרטי):** `arxiv.org/abs/2606.26595` ·
`zoomcharts.com/…/power-bi-2026-10-structural-shifts…` · `redeagle.tech/blog/power-bi-dashboard-design` ·
`cloud.google.com/…/looker-in-2026-gartner-…` · `datatako.com/power-bi/power-bi-dashboards` ·
`concordusa.com/blog/what-gartners-2026-magic-quadrant-…` — **כל חמשת ה-URL של §ח3 עברו אימות-מחדש
ונמצאו פעילים ותומכים בתוכן שיוחס להם.**

---

## ה · שאלות שעלו (לא הכרעות — לישי, אם ירצה לדעת)

🔵 **מתח-מקורות אמיתי בבלוק #2:** המקור החזק ביותר שנמצא ל"LLM מסווג משוב-שירות" — `arXiv 2606.26595`
— **בפועל ממליץ על ההפך המדויק** ממה שהוכרע: גילוי-נושאים-פתוח ("emerging topic detection"), לא
מיפוי לטקסונומיה סגורה. זה לא פוסל את הכרעת-ת2 (הנימוק הפנימי — השוואת אדם↔מודל — תקף בעצמו
ולא תלוי במקור-החוץ), אבל זה אומר ש**המקור-החיצוני-החזק-ביותר תומך בכיוון השני**, ואם ישי יישאל
בכנס "אבל המחקר לא ממליץ דווקא על טקסונומיה פתוחה?" — התשובה הכנה היא כן, ואנחנו סוטים ממנו
בכוונה לטובת מדידות-שוות (ר' בלוק #2, "בחרנו לסטות בכוונה").

</div>
