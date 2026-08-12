<div dir="rtl">

# מקורות מהעולם — מודול 4

> **מה זה:** רק מה שזוקק משני סוכני-המחקר של 05/08/2026, **מסודר לפי ההכרעה שהוא תומך בה.**
> נכתב כי המסקנות שרדו על הדיסק והקישורים לא, **וישי מציג בכנס** — *"ככה מקובל"* בלי מקור
> אינה תשובה שם. **הנימוקים המלאים: `discovery-log.md`.**
> ⚠️ **מה שאינו כאן:** המקורות של האלגוריתם עצמו (‏Nature 2025 · Uber · DoorDash · Instacart ·
> IMDb · OECD) — **הם כבר ב-`docs/specs/module_04_hostesses/module4_smart_match_research.md` §6.**

---

**אי-זמינות מוצהרת (הכרעה ①)** — ‏Deputy מצהיר את החולשה של השיטה שלנו במילותיו:
*"Deputy assumes every team member is available all day until specific availability or
unavailability information is entered."*
‏Ubeya ו-Nowsta מחזיקים **"בדיקת-זמינות"** כסבב נפרד לפני שיבוץ.
`help.deputy.com/hc/en-au/articles/4658282900111` · `learn.ubeya.com/en/articles/11654099`

**ביטול אחרי אישור סופי (הכרעה ②)** — ‏**ארבעה מוצרים שאינם מכירים זה את זה כותבים את אותו
משפט:** המשמרת נשארת באחריות מי שביטל **עד שמחליפה מאשרת בפועל**. ‏Sidekicker פותח אותה
מחדש אוטומטית ומודיע למזמין.
`help.sidekicker.com/en/articles/2692163` · `help.wheniwork.com/articles/getting-your-shifts-covered`
`help.connecteam.com/en/articles/6444737` · `help.instawork.com/en/articles/2226313`

**בונוס צמוד למשמרת (הכרעה ③)** — ‏Instawork **"Top Pro Booster"**: תוספת-אחוז לתעריף
שנראית **רק לדרגים העליונים**, ככלי למילוי משמרת קשה.
`help.instawork.com/en/articles/4819315`

**השבתה עם שיבוצים עתידיים (הכרעה ④ · §7.34)** — **הרוב מאפשר ואינו חוסם:**
*מכריחים החלטה פר-שיבוץ* — When I Work · Zoho Shifts · *משחררים אוטומטית* — Connecteam ·
Workforce.com · Instawork · ESHYFT · *חוסמים (מיעוט)* — Deputy · TempWorks · Salesforce ·
*מאפשרים בשקט* — 7shifts, **והתיעוד שלהם עצמו מזהיר שהמנהל חייב לנקות ידנית.**
`help.wheniwork.com/articles/deleting-a-user-iphoneipad` · `help.zoho.com/portal/en/kb/shifts/managing-employees/articles/deactivate-and-reactivate-employees`
`help.connecteam.com/en/articles/9225998` · `help.deputy.com/hc/en-au/articles/4764904256143`
`kb.7shifts.com/hc/en-us/articles/4417505066515`

**אין מחיקה (תהליך א׳ §א4)** — ‏Ubeya: מושבת מאבד גישה לעתיד **ושומר את כל העבר**; מחיקה
**בלתי-הפיכה**. ‏TempWorks: המערכת *"אינה מאפשרת למחוק רשומת עובד באמת"*.
‏שימור סטטוטורי: ‏EEOC — שנה מרשומות-עובד, FLSA — שלוש שנים לשכר.
`learn.ubeya.com/en/articles/7955918` · `kb.tempworks.com/help/how-to-reactivate-and-deactivate-employee-records`
`eeoc.gov/employers/recordkeeping-requirements`

**"פג תוקף" כמצב גלוי (הכרעה #4)** — ‏When I Work מחזיק סטטוס **`Expired`** מפורש
("deadline passed without acceptance"). ‏foundU: הצעה פגה אחרי 8 שעות כברירת-מחדל, **ומיד
כשהמשרה מתמלאת**.
`help.wheniwork.com/articles/getting-your-shifts-covered`

**"שלח שוב" כפתור ולא טיימר (הכרעה #5)** — ‏Ubeya מיישמת **`Resend confirmation`** ידני.
`learn.ubeya.com/en/articles/5320192`

**חסימה פר-לקוח ולא גלובלית (כבר שלנו)** — ‏ESHYFT מגדיר **DNR ברמת-המתקן**: מוסרת מהמשמרות
העתידיות **שם**, מקבלת מייל עם הסיבה, והמתקן יכול לבטל. ‏Instawork: Block **פר-עסק**, הפיך.
`help.eshyft.com/en/articles/7061773` · `help.instawork.com/en/articles/2281199`

---

## 🖥️ סבב 2 (06/08/2026) — **מסך ה-Smart Match: איך העולם מציג רשימה מדורגת של אנשים**

### ① הציון הסמוי — **ההכרעה שלנו היא דפוס-הרוב, ולמתחרה הכי דומה לנו יש בדיוק ההפך**

**‏🏆 מדרגים בלי להציג מספר:**
· **Sidekicker** *(שיבוץ אירועים — הכי קרוב אלינו)*: *"the applications list is sorted by 'Best match'"*,
והציון **קיים פנימית ולא מודפס** — *"The Sidekicks scoring higher than our best match threshold
will have a **'Recommended' tag** to make them stand out"*.
· **LinkedIn Recruiter**: מדרג **בלי שום ציון מספרי**, ובמקומו תוויות מנוסחות ("Spotlights").
· **Greenhouse**, מילולית: *"AI doesn't score or rank applications, nor does it make any decisions."*
· **Instawork**: **כפתורים קטגוריים** *(`+ Roster` · `Okay to return` · `Block`)* ודרגות
Bronze/Silver/Gold/Platinum — **לא מספר.**
· **Indeed Flex · Upwork · TaskRabbit · Airbnb**: **תגיות** ("Top Rated", "TaskRabbit Elite",
"Guest favorite"), לא ציונים.

**‏⚠️ והנגד — והוא דווקא האנלוג הקרוב ביותר: Ubeya מציגה את המספר.**
*"a single **Match Score**, showing next to the employee's name"*, צבוע: אדום 0–25% · כתום 25–50% ·
ירוק 50–100%. **‏Bullhorn מציגה ציונים אך מסתירה עד ריחוף** (*"roll your mouse over the blue line"*).
🔑 **⇒ וזו בדיוק התשובה החזקה בכנס: לא "ככה מקובל", אלא *"היו שתי אסכולות ובחרנו את זו של
Sidekicker ו-LinkedIn על פני זו של Ubeya, כי X"*.**
`help.sidekicker.com/en/articles/8660717` · `linkedin.com/help/recruiter/answer/a413241`
`learn.ubeya.com/en/articles/12599652-smart-ranking` · `my.greenhouse.com/blogs/what-really-happens-after-you-apply-for-a-job`

### ② צ'יפי-ההנמקה — **יש תקדים אחד ממש, והוא קרוב להפחיד**

**‏LinkedIn Recruiter "Spotlights"** — תוויות-סיבה פר-מועמד, ובהן:
**`Active talent`** *("more active on LinkedIn and **more likely to respond**")* ·
**`Missed candidates`** *("**uncontacted for longer than a week**")* · `Past applicants` ·
`Have company connections` · `Open to work`.
🔑 **`Missed candidates` הוא כמעט התאום של `עבדה לאחרונה לפני X שבועות`, ו-`Active talent` של
`אישרה 9 מ-10`.** **‏Ubeya:** כתר = *"employees who have worked with the client before"* — **בדיוק
`עבדה אצל הלקוח הזה`, אך כאייקון והנימוק בטולטיפ.**
🔴 **והממצא השלילי: אין דפוס-עיצוב מתועד לצ'יפי-הנמקה פר-שורה ברשימות-אנשים.** ‏חיפוש ייעודי
החזיר רק הנחיות-רכיב גנריות. **⇒ הצורה שלנו היא המצאה מוצדקת, לא העתקה.**
‏➕ **וביקורת-ענף שמנמקת אותה:** *"A match score without a reason cannot be challenged, defended,
or improved"*, ומגייסים תיארו ציונים כ-*"hit and miss"*.
`linkedin.com/help/recruiter/answer/a414283` · `heymilo.ai/blog/ai-match-score-problem-explainable-screening`

### ③ 🔴 **זוויות-המיון — כאן אנחנו סוטים מהעולם כולו, ולא ידענו**

**הסוכן חיפש ולא מצא ולו מוצר אחד שמתעד *שני סדרי-דירוג מתחרים ומנוקבים בשם* על רשימת אנשים.**
**הדפוס האוניברסלי: סדר מדורג אחד + הרבה מסננים.**
· **Sidekicker** — סדר אחד: *"Best match"*. · **LinkedIn** — **‏~17 "Spotlights", והם *מסננים*, לא
מיונים.** · **Upwork · Indeed** — מסננים. ⚠️ *(‏Upwork החזיר `403`; שמות-המסננים מהאינדקס.)*
🔑 **הנימוק לסטייה, והוא נשען על קנה-המידה שלנו:** העולם מסנן כי יש לו **אלפי** מועמדים וצריך
**לצמצם**. **אצלנו 23 עוברות את השער — הרשימה כולה נכנסת למסך, וצמצום הוא חסר-תוחלת.**
**⇒ בקנה-מידה שלנו *סידור-מחדש* הוא הכלי הנכון, ו*סינון* הוא הכלי השגוי.** **סטייה מודעת, ונרשמת.**

### ④ אורך הרשימה — **אין קונבנציה לסתור**
**‏LinkedIn**: *"10 recommendations per day… up to 50 unique"* · *"up to 25 similar candidates"*.
**‏Sidekicker**: האורך נקבע מהיצע ולא ממספר קבוע. **‏🔴 ולא נמצא אף מוצר שמתעד "top-N ואז עימוד"
כקונבנציה** ⇒ **8 המועמדות שלנו אינן סותרות דבר.**

### ⑤ ומה שנבדק ונמצא **לא רלוונטי** — כדאי בכנס
**‏NYC Local Law 144** מסדיר אודיטי-הטיה ודיווח, **ואינו אומר דבר על הצגת ציון למנהל במסך.**
`rules.cityofnewyork.us/rule/automated-employment-decision-tools-2`

### ⚠️ ותיקון-כנות לנכס-הכנס הקודם
הטענה *"אף מוצר אינו מדרג לפי היענות"* **מצטמצמת ונשארת נכונה:** ‏LinkedIn **כן** מדרג לפי
*"more likely to respond"* — **אבל זו פעילות בפלטפורמה, לא היענות לזימון שאנחנו שלחנו.**
⇒ **הניסוח המדויק: אף מוצר אינו מדרג לפי *שיעור-ההיענות לזימונים שלנו*.** ‏**אצלנו זה 40%.**

---

## 🔴 ומה שהסוכן חיפש **ולא מצא** באף מוצר — לפעמים שווה יותר

- **הסלמה אוטומטית לפי טיימר** ("אם לא ענתה תוך 48 שעות — שלח שוב") ⇒ **תמיכה ישירה בהכרעה #5.**
- **דוח היגיינת-מאגר** — *"אלה 40 שלא ענו לזימון בחצי שנה"* ⇒ **תמיכה בצ'יפ של הכרעה #3.**
- **סטטוס "המתנה/רזרבה"** נפרד מ"משובצת".
- **תהליך מודל לצמצום-תקנים מצד הלקוח** — כולם משאירים את *מי* לשחרר לשיקול המנהל.
- 🏆 **ואף מוצר אינו מדרג עובד לפי *היענות לזימונים*** — כולם לפי התנהגות במשמרות שכבר עבד,
  **והחוקר ציין במפורש שהיענות "ארגומנטבילית רלוונטית יותר".** ‏**אצלנו זה 40% מהציון.**

</div>
